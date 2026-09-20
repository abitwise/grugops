// context-io.ts — the ONLY sanctioned write path into the shared verified context (SCTX-01/02/04).
//
// Provides readContext / appendNote / atomicWrite, a deterministic zero-token index.md +
// index.jsonl render, and a structural validator that fails on a missing provenance field.
// Roles and workflows never raw-write .grugops/context/ — they call this helper (enforced by the
// guard_context_writes foundation guard, plan 20-03). The note files under notes/ are the markdown
// source of truth; index.md + index.jsonl are derived, byte-reproducible, freshness-gated renders.
//
// Schema (the contract): agent-factory/contracts/context-note.md. A note is YAML frontmatter +
// markdown body. The provenance fence keys are kind / by / at / verified_by / confidence / refs
// (a YAML list) / supersedes (a note-id ref or empty). The six kinds are claim / finding / decision
// / failed-attempt / observation / artifact-ref. Required fields: kind, by, at, confidence.
//
// Build model (D-13): node:fs + node:crypto + node:path ONLY — ZERO host runtime deps. Authored in
// TypeScript, compiled with `tsc` to a committed scripts/context-io.js that host machines and CI run
// with bare Node; the freshness.ts build-output gate (OUTPUT_DIRS includes scripts/) proves the
// committed .js is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — trace + safety surface, never
// caveman voice).
//
// CLI (so plan-03's freshness gate can mirror-spawn the render, and the oracle can drive it):
//   node scripts/context-io.js validate <noteFile>                  # exit 0 = valid, 1 = structural FAIL
//   node scripts/context-io.js admit <task> <noteFile> [root]       # exit 0 = admitted, 1 = refused (D-01)
//   node scripts/context-io.js render <task> [contextRoot]          # regen index.md + index.jsonl
//
// Path-traversal mitigation (ASVS V12, T-20-01): the task name is validated against a strict
// allowlist (^[A-Za-z0-9._-]+$, rejecting .. / separators / absolute paths) before it is joined
// under the context root. The context root itself is a fixed literal (.grugops/context) in
// production; tests pass an explicit temp root.
import { randomUUID } from "node:crypto";
import { isEntrypoint } from "./is-entry.js";
import { writeFileSync, writeSync, 
// `readFileSync` is DELIBERATELY ABSENT from this import list (31-21, CR-12 / D-24). Every read
// this module performs goes through `readRegularFileOrNull`, so the primitive that BLOCKS on a
// non-regular file is not in scope to be reached for by accident. Re-adding it here is the drift
// this module's derived read-site axis turns red.
readdirSync, renameSync, unlinkSync, mkdirSync, existsSync, openSync, fstatSync, readSync, closeSync, statSync, realpathSync, constants as fsConstants, } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { CHECKPOINTS, CHECKPOINT_DEFAULTS, DISPOSITIONS, STRICTEST_MATRIX, canonicalizeDisposition, } from "./checkpoints.js";
// ── The six note kinds (SCTX-01) ──────────────────────────────────────────────────────────────
export const NOTE_KINDS = [
    "claim",
    "finding",
    "decision",
    "failed-attempt",
    "observation",
    "artifact-ref",
];
// ── Fixed context root (production). Tests pass an explicit root. ───────────────────────────────
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");
// ── Task-name allowlist (path-traversal mitigation, T-20-01) ────────────────────────────────────
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task) {
    // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
    if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
        throw new Error(`context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
// ── The reserved §14-gate author identity (D-02/D-04) ───────────────────────────────────────────
// `§14-gate` is a reserved author identity: the §14 quality gate is the root of the verification
// chain, and the ONLY emitter allowed to author a `by: §14-gate` verdict note (mirroring how the
// prod-deploy hook trusts the human-set env var as ITS root, hooks/guard.ts). Any OTHER note
// authored `by: §14-gate` is an impersonation flag — a structural FAIL on the plain validate path.
// The one carve-out (D-04): the gate's own verdict emission goes through emitVerdict(), which sets
// an internal trusted flag so the reserved-identity rule does not reject it.
const GATE_IDENTITY = "§14-gate";
// ── The SECOND reserved machine identity: the PreToolUse checkpoint guard (D-10/D-11, plan 30-08) ─
//
// WHY A SECOND ONE EXISTS AT ALL, STATED BEFORE THE MECHANISM. D-11 requires that a checkpoint
// lowered to `notify` records a `kind: finding` note naming the checkpoint, the actor and the
// command, and D-10 requires the same of an UNAUTHORIZED lowering. A `finding` needs a `verified_by`
// stamp under one of the two accepted grammars, and neither grammar can be satisfied honestly by
// this writer: there is no §14 gate run behind a hook decision, and in the unauthorized case there
// is NO human at all — that absence is the whole fact being recorded. The two ways out that were
// NOT taken: emitting a `§14-gate#<id>` stamp with no verdict behind it (a forged stamp), or
// interpolating the floor grant's value into a `human:<name>` stamp (a name the grammar's charset
// would mangle, and a claim the guard cannot make in the unauthorized branch at all).
//
// WHAT THIS IDENTITY IS, AND WHAT IT IS NOT. It is the SAME shape as the §14-gate carve-out one
// screen up: the guard is a separate operating-system process that the agent under it cannot
// invoke, cannot pass content to and cannot silence, so — exactly like the gate — it is a root of
// the verification chain and its record stamps nothing above it. It is NOT a widening of the
// refuse-self floor on any agent-reachable path: adding it here makes `validate()` STRICTER
// everywhere else, because a note authored by this identity through appendNote / admitAndAppend /
// the CLI / the compaction carve-out oracle is now an impersonation FAIL that was previously an
// ordinary author string. The only path that may author it is emitCheckpointNote() below.
//
// THE RESIDUAL, NAMED RATHER THAN CLAIMED AWAY. A process running as the same uid can write a note
// file directly and spell this identity itself. That is the pre-existing same-uid direct-FS residual
// recorded at writeNoteFile, it applies identically to `§14-gate` today, and this identity neither
// widens nor narrows it.
const CHECKPOINT_GUARD_IDENTITY = "§checkpoint-guard";
/**
 * The reserved machine identities, declared ONCE.
 *
 * A note may be authored by one of these ONLY through that identity's own sanctioned emitter, which
 * names itself when it validates. Every other path — every agent-reachable path — reaches the
 * impersonation FAIL. The list is a constant rather than two scattered comparisons so that a third
 * identity (should one ever be justified) cannot be added to one check and forgotten in the other.
 */
const RESERVED_IDENTITIES = [GATE_IDENTITY, CHECKPOINT_GUARD_IDENTITY];
// ── The two accepted verified_by grammars (D-05/D-06/D-07) ──────────────────────────────────────
// Anchored allowlists modeled on TASK_NAME_RE — only these two grammars admit a `finding`:
//   - §14-gate#<id>  the workhorse; admission cross-checks a live green verdict (D-01).
//   - human:<name>   the escalation valve (D-07). Its un-forgeable signal is now delivered by the
//                    separate PreToolUse `admission-guard` hook: a distinct process that reads the
//                    human-set session variable the agent's own child env cannot reach (mirroring
//                    the prod-deploy guard). That is the Claude Code primary tier; the four non-CC
//                    CLIs degrade to the in-script admit() refusal plus a prompt-level "stop, ask a
//                    named human," documented honestly as not mechanically un-forgeable (D-04/D-05).
// There is NO separate passing-test-reference grammar: a passing test IS a green gate run, so the
// gate grammar already covers it (D-05/D-06). The id/name segment reuses the task-name allowlist.
const GATE_STAMP_RE = /^§14-gate#[A-Za-z0-9._-]+$/;
const HUMAN_STAMP_RE = /^human:[A-Za-z0-9._-]+$/;
// ── The provenance hex allowlist for `sha` and `content_hash` (Phase 31, D-01/D-02) ─────────────
// An ANCHORED charset allowlist in the same idiom as TASK_NAME_RE and the two stamp grammars
// above: the value is admitted only when the WHOLE string is lowercase hex of a plausible digest
// length. It accepts an abbreviated or full lowercase git object id (the 7-character abbreviation
// floor through a 40-character sha1 name, and a 64-character sha256 object name) and a sha256 hex
// digest, and nothing else — no uppercase, no surrounding or embedded whitespace, no `HEAD`, no
// `refs/`-style prose. Anchoring is the point: an unanchored test would admit a value that merely
// CONTAINS hex, and these two fields are interpolated raw into the provenance fence.
export const SHA_HEX_RE = /^[0-9a-f]{7,64}$/;
// ── DeLM invalid-evidence phrase list (D-09; from DeLM verifier.py _INVALID_EVIDENCE_PHRASES) ────
// A `verified_by` that IS one of these (or STARTS with one at a non-alpha boundary) is hollow
// evidence and a structural FAIL. Match by lowercase+trim then `==` OR `startsWith` + a non-alpha
// boundary — NEVER naive substring (`.includes()` would false-positive on a legitimate stamp whose
// id happens to embed a phrase's letters, e.g. an id containing `tbd`). Same token-vs-prose care
// as guard_context_writes / guard_wr05 in check-foundation-guards.ts.
const DELM_INVALID_EVIDENCE = [
    "tbd",
    "pending",
    "not verified",
    "unverified",
    "should work",
    "should pass",
    "looks right",
    "looks correct",
    "seems to work",
    "to be verified",
    "will verify",
    "n/a",
];
// Literal self-attestation tokens an agent must never use as its own verification (D-09).
const REFUSE_SELF_LITERALS = ["self", "me", "agent"];
// Return true when `value` IS a DeLM invalid-evidence phrase, or STARTS with one followed by a
// non-alphanumeric boundary (so `pending review` matches but `§14-gate#R-ftbdui-001` does not).
// This is the deliberate non-substring matcher D-09 requires.
function isInvalidEvidencePhrase(value) {
    const v = value.trim().toLowerCase();
    for (const phrase of DELM_INVALID_EVIDENCE) {
        if (v === phrase)
            return true;
        if (v.startsWith(phrase)) {
            const next = v.charAt(phrase.length);
            // A non-alpha boundary (space, punctuation, end-of-string) means the phrase stands alone as a
            // token; an alphanumeric next char means it is part of a larger token and is NOT a match.
            if (!/[A-Za-z0-9]/.test(next))
                return true;
        }
    }
    return false;
}
// ── Single-line field guard (provenance-forgery mitigation, CR-01) ──────────────────────────────
// Every NoteInput field is interpolated RAW into the YAML provenance fence by composeNote. An
// embedded newline would inject additional `key: value` lines; because parseNote lets a later key
// overwrite an earlier one, an injected `kind:`/`verified_by:` could flip a soft `claim` into a
// forged verified `finding`. Reject any field carrying a CR or LF BEFORE composing.
function assertSingleLine(name, value) {
    if (/[\r\n]/.test(value)) {
        throw new Error(`context-io: field "${name}" must be single-line (no embedded newline): ${JSON.stringify(value)}`);
    }
}
// ── Hex-scalar guard for `sha` / `content_hash` (Phase 31, T-31-03) ─────────────────────────────
// The write-path companion to SHA_HEX_RE's validator rule: the composer guards what is about to be
// interpolated into a fence, the validator guards text that arrives from disk. Both ask the ONE
// exported allowlist, so there is no second charset spelled anywhere. Called only AFTER
// assertSingleLine, so a CR/LF is reported as the injection attempt it is rather than as a
// charset miss.
function assertHexScalar(name, value) {
    if (!SHA_HEX_RE.test(value)) {
        throw new Error(`context-io: field "${name}" must be lowercase hex matching ${SHA_HEX_RE} — an abbreviated ` +
            `or full git object id, or a sha256 digest: ${JSON.stringify(value)}`);
    }
}
// ── R6-1 CO-PRIMARY: path-metacharacter set for the `by`/`at` provenance scalars (Plan 25-12). ────
// `by` and `at` flow into noteId → the on-disk <id>.md filename. A value carrying a path separator
// (`/` or `\`), a NUL byte / any C0 control character (U+0000–U+001F), or the parent-directory
// sequence `..` is a path-traversal attempt (the GAP-R6-1 class). validate() FAILs on it — this is a
// CO-PRIMARY, load-bearing guard (NOT mere defense-in-depth): it is the structural guard for
// emitVerdict's `at` parameter and for the CLI / compaction-carve-out oracle callers of validate(),
// and it must not be weakened or skipped. It does NOT reject the reserved `by: §14-gate` (U+00A7 is
// none of these metacharacters) nor a legitimate ISO-8601 `at` (a single dot between digits is not the
// `..` parent-dir sequence). The shared writeNoteFile chokepoint is the OTHER primary (it contains the
// resolved write path and also catches a forged/precomputed id, which validate does not inspect).
const PATH_METACHAR_RE = /[\\/\u0000-\u001F]|\.\./;
// ── The SINGLE source-of-truth recognized-frontmatter-line grammar (IN-02). ─────────────────────
// A note's frontmatter line is RECOGNIZED — i.e. it parses cleanly and never lands in
// `malformedLines` — exactly when it is one of:
//   • a blank (empty-after-trim) line,
//   • the `refs:` block header (`refs:` with no inline value),
//   • a `refs:` list item (`  - x`) consumed under that header,
//   • a column-0 `key: value` scalar (`/^([A-Za-z_]+):\s*(.*)$/`).
// Everything else inside the fence (a leading-space/tab indented key, a `key : value` line with a
// space before the colon, junk) is malformed. This predicate is the SINGLE place that decision lives:
// BOTH parseNote's malformedLines decision AND splitNotes' note-boundary key consult it, so the
// read-path splitter provably CANNOT drift from the parser (the drift that was the 6th bypass —
// splitNotes keyed on a `/^id:/` STRICT SUBSET of this grammar). The `refs:` list item is a
// recognized SHAPE here so the splitter treats it as frontmatter-looking; parseNote still consumes a
// list item only inside a refs block and records a STRAY list item as malformed (its contextual
// behavior is unchanged — see the loop below).
export function isRecognizedFrontmatterLine(line) {
    if (line.trim() === "")
        return true; // blank
    if (/^refs:\s*$/.test(line))
        return true; // refs: block header
    if (/^\s*-\s+/.test(line))
        return true; // refs: list item shape
    if (/^([A-Za-z_]+):\s*(.*)$/.test(line))
        return true; // column-0 key: value scalar
    return false;
}
// ROUND-8 (parser unification): the former broader single-line fail-closure-trigger helper that the
// round-6/round-7 splitter used to decide a note boundary one line at a time is REMOVED. Its job is
// now done by parseNote itself — splitNotes derives "does a note open here?" by parsing the candidate
// region (see splitNotes below), so there is ONE grammar and no parallel line heuristic that can drift
// from the parser (the precise failure mode that produced seven bypasses). No standalone single-line
// boundary helper survives to be re-broadened.
// EXPORTED (IN-02): this is the single canonical frontmatter parser. The compactor's read path
// adopts THIS function instead of a hand-rolled near-copy, so the path the carve-out oracle parses
// provably cannot drift from the path appendNote/validate validates. No behavior change on export —
// only the visibility of the declaration and its ParsedFrontmatter return type.
export function parseNote(text) {
    // Normalize CRLF/CR to LF before matching the fence so a git-autocrlf (Windows) note parses
    // identically to its LF form. Without this, the fence regex (anchored on \n) misses a CRLF note,
    // parseNote returns null, readContext silently drops it, and admit() wrongly refuses a real
    // §14-gate verdict (CR-01). parseNote is the single choke point feeding both validate() and
    // readContext, so normalizing here aligns the text and admission paths in one place.
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m)
        return null; // no frontmatter fence → caller treats as a structural fail
    const fmLines = m[1].split("\n");
    const body = m[2] ?? "";
    const scalars = {};
    const seen = new Set();
    const dupes = new Set();
    // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02). Records the exact offending line
    // text so validate() and the carve-out oracle can name each one. The recognized set is exactly:
    // a blank line, the `refs:` block header, a `refs:` list item consumed under a header, and a
    // column-0 `key: value` scalar. Everything else inside the fence is malformed.
    const malformed = [];
    let refs = [];
    for (let i = 0; i < fmLines.length; i++) {
        const line = fmLines[i];
        // A blank (empty-after-trim) line is a recognized, legal shape — skip it.
        if (line.trim() === "")
            continue;
        // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
        // The `- item` lines are consumed HERE and never reach the kv branch, so the legitimate refs:
        // list block can never register as a duplicate provenance key.
        const refsBlock = line.match(/^refs:\s*$/);
        if (refsBlock) {
            if (seen.has("refs"))
                dupes.add("refs");
            seen.add("refs");
            const collected = [];
            while (i + 1 < fmLines.length && /^\s*-\s+/.test(fmLines[i + 1])) {
                collected.push(fmLines[++i].replace(/^\s*-\s+/, "").trim());
            }
            refs = collected;
            continue;
        }
        const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
        if (kv) {
            const key = kv[1];
            const val = kv[2].trim();
            // Record a duplicate provenance key once. parseNote still keeps the last value (overwrite)
            // for backward-compatible reads; validate() rejects on the recorded duplicate.
            if (seen.has(key))
                dupes.add(key);
            seen.add(key);
            if (key === "refs") {
                // Single-line comma form: `refs: a, b, c` (empty → []).
                refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
            }
            else {
                scalars[key] = val;
            }
            continue;
        }
        // CMP-02 round-5: a non-blank fence line that is neither the `refs:` header, a `refs:` list item
        // consumed above, nor a column-0 `key: value` scalar is MALFORMED. A stray `  - item` outside a
        // refs block, a leading-space/tab indented key, a `key : value` (space before the colon) line,
        // and any junk line all land here. The anchored kv regex would silently project each to "" with
        // no signal; recording it lets validate() and the carve-out oracle fail closed on the LINE SHAPE.
        //
        // IN-02 single-source coupling: a line reaches this branch only when it is NOT blank, NOT the
        // refs header, NOT a refs list item consumed above, and NOT a column-0 `key: value` scalar. The
        // shared isRecognizedFrontmatterLine predicate is the canonical statement of the
        // blank / refs-header / list-item-shape / column-0-kv grammar, and splitNotes keys its
        // recovered-note boundary on that SAME predicate so the splitter cannot drift from the parser.
        // The ONLY recognized-SHAPE line that still reaches here is a STRAY list item (recognized shape,
        // malformed context — a `- x` outside a refs block); every other line here is also
        // !isRecognizedFrontmatterLine. We assert that invariant (it documents and pins the coupling and
        // never trips on real input, so parseNote's recorded-malformed set is unchanged).
        const isStrayListItem = /^\s*-\s+/.test(line);
        if (!isStrayListItem && isRecognizedFrontmatterLine(line)) {
            throw new Error(`context-io.parseNote: internal invariant violated — line "${line}" reached the malformed ` +
                "branch yet is a recognized frontmatter line (splitNotes/parseNote grammar drift, IN-02).");
        }
        malformed.push(line);
    }
    // Route the parsed `kind` THROUGH the single-source authority (round-8 GAP-R7-1 Lever-1). This is
    // behavior-identical to the kv loop's existing `.trim()` (the value is already trimmed) — its sole
    // purpose is to make parseNote consult the SAME helper the gate (isGatedNote / the hook / the server)
    // consults, so the store's kind view and the gate's kind view cannot drift. The existing parseNote
    // tests stay green (this is a proven no-op on the persisted value).
    if (scalars.kind !== undefined)
        scalars.kind = normalizeKind(scalars.kind);
    return { scalars, refs, body, duplicateKeys: [...dupes], malformedLines: malformed };
}
// ── isBoundaryShapedLine: a `---`-boundary-shaped fence line, trailing-whitespace tolerant. ────────
// A note fence opens with a `---` line. The round-6 splitter used an EXACT `lines[i] === "---"`
// compare, so a trailing-whitespace variant (`--- ` / `---\t`) — writer-reachable via the free-scratch
// path — was NOT seen as a boundary line and the note that followed was silently absorbed (part of the
// 6th-bypass class). We trim trailing whitespace before the `=== "---"` compare so `---`, `--- `, and
// `---\t` all count as a boundary-shaped line. Leading content is NOT trimmed — an indented `  ---`
// is a body/markdown construct, not a column-0 fence open.
function isBoundaryShapedLine(line) {
    return line.replace(/[ \t]+$/, "") === "---";
}
// ── splitNotes: a FAIL-CLOSED, BODY-CONSUMING splitter (IN-02 single source). ───────────────────────
// The production raw-thread representation is a SINGLE threads/<agent>.md file (D-08) that the write
// path (writeThread/composeThreadNote) builds by APPENDING each note as a `---\n<frontmatter>\n---\n
// \n<body>\n` fence. The carve-out read path must recover EXACTLY the per-note set the write path
// emitted — same note count, same verbatim bytes — OR fail closed. parseNote's non-greedy fence regex
// matches only the FIRST fence, folding every later note into note #1's body; splitNotes is the
// read-path fix (CMP-02). This is the round-7 rewrite that closes the 6th-bypass CLASS.
//
// THE CLASS-LEVEL SAFETY MECHANISM IS FAIL-CLOSURE, NOT RECOGNITION. All six bypasses are one shape: a
// boundary heuristic NARROWER than the format, defeated by an adversarial fence. Broadening
// recognition alone is whack-a-mole. So splitNotes silently absorbs NOTHING fence-ish: a
// `---`-boundary-shaped line (column-0 `---` OR its trailing-whitespace variants `--- ` / `---\t`) that
// OPENS an id-bearing frontmatter run (the maximal run of contiguous frontmatter-LOOKING lines up to
// its closing `---`, CONTAINING an `id:`-looking line at any indent — including a kind-first note whose
// id is on a later line, and an indented ` id:`) is a NOTE BOUNDARY. Keying the boundary on the id —
// the carve-out's load-bearing identity — is what lets broadened recognition (recover a kind-first
// note) coexist with the round-5 body-`---` win (an id-LESS embedded `---\nkey: value\n---` block is
// body, not a note). Each note region (boundary → next boundary | EOF) is then RECOVERED or REFUSED:
//   • RECOVERED as its own per-note record: a region whose fence PARSES (parseNote non-null) is emitted
//     as a recovered note — even if it carries malformedLines (an indented ` id:`) or an empty id. Those
//     are NOT swallowed: they are caught DOWNSTREAM by checkCarveOut's fail-closed gates (gate (a) names
//     the malformed line, gate (b) runs the shared validator, the empty-id guard refuses an unmatchable
//     note). Splitting the buried note out as its own record is precisely what makes those gates SEE it.
//     A genuine kind-first note #2 (id on a later column-0 line) parses clean and is recovered — IN-02
//     single source, broadened past the old `/^id:/` subset, no drift.
//   • REFUSED (fail-closure, the floor SC2 depends on): a region whose fence does NOT parse (no closing
//     `---`, or a `--- ` trailing-whitespace open that parseNote's anchored `^---\n` fence rejects) is
//     routed to trailingMalformed so readNoteDir surfaces it as NoteDirResult.unparseable and
//     checkCarveOut fails closed (exit 1) naming the FILE. Either way — recovered-then-gated or refused —
//     a fence-ish, id-bearing region is NEVER silently swallowed into a prior note's body, regardless of
//     which exotic shape an adversary picks.
//
// A bare `---` line whose NEXT line is NOT frontmatter-looking (a markdown horizontal rule, a note's
// closing fence followed by body text) is NOT a boundary, and an id-LESS `---\nkey: value\n---` block
// inside a body is NOT a boundary (no id in its run) — so a body `---` neither spawns a spurious note
// nor terminates note #1 early. The embedded block sits INSIDE note #1's text run and is consumed as
// part of note #1's body, so it does not hide a real following note — the BODY-`---` ambiguity test
// (the round-5 win) still passes.
//
// Contract (the single-source / no-drift / no-byte-loss guarantees the carve-out depends on):
//   1. For each RECOVERED element, parseNote(notes[i]) is NON-NULL AND parseNote(notes[i]).body equals
//      that note's authored body (a carved note equals a parsed note, body included).
//   2. The recovered notes and the refused remainder TILE the CRLF-normalized input exactly: no byte
//      invented, none dropped. Stated as a tiling and NOT as the concatenation
//      `notes.join("") + trailingMalformed`, because that ORDER does not hold — the refused remainder
//      accumulates any LEADING un-fenced region first and is returned after the notes. Verify this
//      property over the byte COUNT; a harness written against the concatenation order reports
//      phantom failures (28-08, F-28-C — 28-02 measured 42 of them).
// A trailing/leading non-recoverable region (free scratch from the no-`note` writeThread path, or a
// fence-ish region that does not cleanly parse, WR-01/WR-02) is returned as trailingMalformed; the
// caller routes it into the fail-closed channel. A single-fence file yields exactly one note (body
// intact); an all-scratch file yields zero notes plus a trailingMalformed.
export function splitNotes(text) {
    // Normalize CRLF/CR to LF FIRST (mirror parseNote) so a CRLF multi-note file splits identically to
    // its LF form — the carve-out must not see a different per-note set on Windows line endings.
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (normalized === "")
        return { notes: [], trailingMalformed: null };
    const lines = normalized.split("\n");
    // Re-join lines [from, to) into their VERBATIM byte slice. split("\n") drops each separator, so a
    // slice [from, to) is the lines joined by "\n"; a trailing "\n" is added when the slice does not run
    // to the final (possibly-empty) element, so byte round-trip is exact.
    //
    // THE EMPTY SLICE IS THE FUNCTION'S BASE CASE, AND ITS ABSENCE WAS THE PHASE-22 BYTE RESIDUAL
    // (28-08, residual 2). The separator rule below asks a SEPARATOR-COUNT question — "is this slice
    // followed by a separator in the original?" — and answers it with a BOUNDS test on `to` alone. The
    // two coincide for every slice that contains at least one line and come apart for the one that
    // contains none: an empty slice has no last line and no separators at all, yet `to < lines.length`
    // is unconditionally true when `to` is 0 and the document is non-empty. So `sliceBytes(0, 0)`
    // returned "\n".
    //
    // THE DEFECT IS A MULTISET STATEMENT, NOT A NOVEL-BYTE ONE, AND THE DIFFERENCE IS NOT PEDANTRY.
    // An earlier draft of this comment said the invented byte was "present at no offset of the input".
    // That is FALSE for every reachable case, and a 28-08 red team measured it: reaching
    // `sliceBytes(0, 0)` requires `boundaries[0] === 0`, which requires `isBoundaryAt(0)`, which forces
    // `lines.length >= 2` — so the input ALWAYS already contains a `\n`. Over exhaustive enumeration
    // the site was reached 3,078 times and NOT ONCE with an input lacking `\n`.
    //
    // The true statement is that the output carries one MORE `\n` than the input — a count, over a
    // multiset. The false phrasing mattered because it invites the wrong check: "does the output
    // contain a character absent from the input?" returns CLEAN on this defect and would have
    // certified it fixed while it was live. Verify byte COUNTS, never byte novelty.
    //
    // WHERE IT WAS REACHED, MEASURED RATHER THAN ARGUED: of this function's five call sites only
    // `sliceBytes(0, boundaries[0])` (the leading region, below) can be called with `from === to`, and
    // only when `boundaries[0]` is 0 — i.e. when the document's FIRST line is a note boundary. Every
    // other site has `from < to` by construction (`j + 1 > i`; `lines.length >= 1`; the boundary walk's
    // indices strictly increase). The invented byte therefore landed at the FRONT of the refused
    // remainder, which is why the Phase-22 record described it as a trailing-space `--- ` adjacency and
    // why that recorded shape no longer reproduces (F-28-B).
    //
    // THIS IS A BASE CASE, NOT A SPECIAL CASE. It is stated once, inside the one function that owns the
    // byte-slicing question, and it changes no predicate that decides refuse-versus-admit: an empty
    // slice contributes no bytes because it contains no lines. A guard written at the CALL site instead
    // would leave the same hole open for the next caller.
    const sliceBytes = (from, to) => {
        if (from >= to)
            return "";
        const segment = lines.slice(from, to).join("\n");
        return to < lines.length ? segment + "\n" : segment;
    };
    // ── Identifying a NOTE BOUNDARY — UNIFIED with parseNote (ROUND-8: ONE grammar, no re-derivation). ─
    // THE BOUNDARY ORACLE IS parseNote. Every note the carve-out tracks is matched raw→promoted on its
    // frozen `id`, so a fence WITHOUT an id cannot participate in the carve-out and is definitionally BODY
    // content, not a note. The "does a NOTE open at this column-0 `---`-shaped line?" decision is therefore
    // derived DIRECTLY from parseNote: take the candidate region from this `---` open up to its FIRST
    // `\n---` close — the SAME span parseNote's non-greedy fence regex `^---\n([\s\S]*?)\n---` matches —
    // hand it to parseNote, and treat the line as a NOTE BOUNDARY iff parseNote(region) is non-null AND the
    // parsed frontmatter carries a non-empty `id`.
    //
    // WHY THIS ENDS THE META-DISEASE (the lesson of 7 bypasses): rounds 1–7 RE-DERIVED "where does a note
    // open" with bespoke line heuristics (an id-first line scan, a single-line gate testing only the line
    // immediately after the open, a hand-rolled id-bearing-run line scan). Each re-derivation was NARROWER than
    // parseNote's real fence grammar and drifted from it — a new exotic fence-open shape (a blank-first or
    // junk-first fence, the 7th bypass) defeated the heuristic while parseNote accepted the note cleanly.
    // By consulting parseNote ITSELF for the boundary, splitNotes' boundary-finding and parseNote CANNOT
    // drift: there is ONE grammar a future reviewer can point to. A hypothetical shape #9 is covered by
    // construction (proven by the parseNote-oracle fuzz test), not by adding another heuristic arm.
    //
    // This UNIFICATION preserves every prior win because parseNote-acceptance + an id is exactly the right
    // discriminator: the round-5 body-`---` win (an id-LESS embedded `---\nkey: value\n---` block parses
    // but has NO id → not a note-open attempt → stays body); a kind-first / blank-first / junk-first /
    // indented-id note (parseNote accepts an id at any position/indent → recovered, then gated downstream);
    // and a trailing-space `--- ` or unclosed orphan open (parseNote's anchored `^---\n`+closing-fence
    // grammar rejects it → it is a note-open ATTEMPT that does not cleanly parse → routed to
    // trailingMalformed and FAILED CLOSED, never silently absorbed).
    //
    // THE FAIL-CLOSURE FLOOR (must_have SC2): a `---`-shaped open is a BOUNDARY whenever it opens a
    // NOTE-OPEN ATTEMPT — its candidate region either (a) parseNote-accepts as an id-bearing note (clean,
    // RECOVERED below) OR (b) carries an `id:`-looking line anywhere in its frontmatter run yet does NOT
    // cleanly parse as a column-0 id-bearing note (REFUSED below via parseNote returning null or an empty
    // id → trailingMalformed → readNoteDir unparseable → checkCarveOut exit 1 naming the file). The
    // id-looking signal is ONLY a fail-closure TRIGGER that decides refuse-vs-leave-as-body — it is NEVER
    // the RECOVER authority: whether a surfaced region becomes its own per-note record is decided solely by
    // parseNote in the region walk below. This is what separates a real note-open attempt (refuse) from an
    // id-LESS embedded body block (stay body, the round-5 win). isBoundaryShapedLine is used ONLY to
    // cheaply enumerate candidate `---`-shaped opens to test.
    const idBearing = (region) => {
        const parsed = parseNote(region);
        return parsed !== null && typeof parsed.scalars.id === "string" && parsed.scalars.id !== "";
    };
    // The candidate region opening at line `i` runs from this `---` open up to (and including) its FIRST
    // subsequent `---`-shaped close — the same first `\n---` parseNote's non-greedy regex picks. If there
    // is no later `---`-shaped line, the region runs to EOF (parseNote then rejects it for want of a
    // closing fence → a note-open attempt that fails closed). Returns the region's bytes for parseNote.
    const candidateRegionFrom = (i) => {
        for (let j = i + 1; j < lines.length; j++) {
            if (isBoundaryShapedLine(lines[j]))
                return sliceBytes(i, j + 1);
        }
        return sliceBytes(i, lines.length);
    };
    // The FAIL-CLOSURE trigger: does the run that opens just after line `i` carry an `id:`-looking line (at
    // ANY indent) before its closing `---`-shaped line? A run with an id is a note-open ATTEMPT — even when
    // it does not cleanly parse (a trailing-space `--- ` open, an indented ` id:`, a truncated orphan with
    // no close). This is NOT a recover authority — parseNote still decides recover-vs-refuse below — it
    // only stops a fence-ish note-open attempt from being silently absorbed into a prior body (the precise
    // class that produced 7 bypasses). An id-LESS embedded `---key:value---` body block lacks this signal,
    // so it correctly stays body (round-5 win).
    const ID_LOOKING = /^\s*id\s*:/;
    const opensNoteAttempt = (i) => {
        for (let j = i + 1; j < lines.length; j++) {
            const l = lines[j];
            if (isBoundaryShapedLine(l))
                return false; // reached the closing fence with no id seen
            if (ID_LOOKING.test(l))
                return true; // an id-looking line — a note-open attempt
        }
        return false; // ran off the end with no id (and no close) — not a note-open attempt
    };
    // A NOTE BOUNDARY is a column-0 `---`-shaped line that opens a note-open attempt: parseNote accepts the
    // candidate region as an id-bearing note (clean → recovered) OR the region carries an id-looking line
    // but does not cleanly parse (→ refused). parseNote is the RECOVER authority; opensNoteAttempt is only
    // the fail-closure trigger that keeps an un-parseable note-open attempt from being silently swallowed.
    const isBoundaryAt = (i) => isBoundaryShapedLine(lines[i]) &&
        (idBearing(candidateRegionFrom(i)) || opensNoteAttempt(i));
    // Find every note-boundary index in document order. A `---` close consumed as the END of one note's
    // candidate region can also OPEN the next note's region; the boundary walk below re-slices each note
    // from its boundary to the NEXT boundary, so adjacent notes (no blank line between a close and the
    // next open) still tile exactly.
    const boundaries = [];
    for (let i = 0; i < lines.length; i++) {
        if (isBoundaryAt(i))
            boundaries.push(i);
    }
    // No boundary at all → the whole text is an un-fenced remainder (an all-scratch file, or a file whose
    // only fences are id-less body blocks). Zero notes; the caller fails closed on a non-blank remainder.
    if (boundaries.length === 0) {
        const remainder = sliceBytes(0, lines.length);
        return { notes: [], trailingMalformed: remainder.trim() === "" ? null : remainder };
    }
    // Walk the note regions in order. Each region runs from its boundary UP TO the NEXT boundary (or EOF)
    // — body-consuming, so a note INCLUDES its body (and any id-less embedded `---…---` block within it).
    // For each region, RECOVER a clean, fully-parsed note OR fail closed (route to trailingMalformed).
    const notes = [];
    // Refused (non-recoverable) regions accumulate into the trailing-malformed remainder so the caller
    // can fail closed. Any leading region BEFORE the first boundary is also accumulated (un-fenced scratch
    // ahead of the recognized notes, WR-01). Byte round-trip (contract property 2) holds because recovered
    // notes + the refused remainder together tile [0, EOF) exactly with no overlap and no gap.
    let refused = "";
    // Leading region before the first boundary (un-fenced scratch). Accumulate its bytes so byte
    // round-trip is exact; a purely-blank leading region is byte-preserved but does not by itself trip a
    // refusal (the `.trim()` test below decides).
    refused += sliceBytes(0, boundaries[0]);
    for (let b = 0; b < boundaries.length; b++) {
        const start = boundaries[b];
        const end = b + 1 < boundaries.length ? boundaries[b + 1] : lines.length;
        const regionText = sliceBytes(start, end);
        const parsed = parseNote(regionText);
        // RECOVER a region whose fence PARSES (parseNote non-null) as its own per-note record. Note this
        // does NOT require the note to be CLEAN: a recovered note may still carry malformedLines (an
        // indented ` id:` / `key : value` line) or an empty id — those are caught DOWNSTREAM by the
        // carve-out's own fail-closed gates in checkCarveOut: gate (a) names the malformed line (which
        // contains the laundered field, e.g. "verified_by"), gate (b) runs the shared validator, and the
        // empty-id guard refuses an unmatchable note. Splitting the region out as its own record is what
        // makes those gates SEE the buried note at all — the round-7 fix. Because the boundary is keyed on
        // an id-bearing frontmatter run, a genuine kind-first note is recovered (broadened recognition) and
        // an indented ` id:` note is recovered-then-refused-by-gate-(a), never silently absorbed. Only a
        // region whose fence does NOT parse at all (no closing `---`) is routed to trailingMalformed here —
        // surfaced via the unparseable channel naming the file (fail-closure), never swallowed into a body.
        if (parsed !== null) {
            notes.push(regionText);
        }
        else {
            refused += regionText;
        }
    }
    // BYTE ROUND-TRIP (contract property 2): the splitter invents no byte and drops none. In the common
    // (clean) case every region recovers and `refused` is empty, so notes.join("") reproduces the input;
    // when a region is refused the file is surfaced as unparseable (not promoted). The recovered notes
    // and the refused regions TILE the input exactly — no overlap, no gap, so the byte MULTISET is
    // preserved. trailingMalformed is null only when nothing non-blank was refused.
    //
    // (28-08, F-28-C) THIS COMMENT PREVIOUSLY STATED THE CONTRACT AS THE CONCATENATION
    // `notes.join("") + refused === normalized`, AND THAT SENTENCE IS FALSE AS WRITTEN. `refused`
    // accumulates the LEADING region (before the first boundary) first and is concatenated AFTER the
    // notes, so for any document with a leading refused region the bytes are all present in the right
    // counts but NOT in the stated order. The distinction is not pedantry: plan 28-02 wrote a fuzz
    // harness against this sentence, and it reported 42 phantom survivors of a fix that was in fact
    // complete — every one of them delta 0, reordered rather than damaged. A reader verifying this
    // module must assert over the byte COUNT (or over the tiling), never over the concatenation order.
    //
    // (28-08, F-28-C) THE NAME `trailingMalformed` CARRIES THE SAME WRONG IMPLICATION. The refused
    // remainder may be LEADING (un-fenced scratch ahead of the first note, WR-01), trailing, or both
    // concatenated together. It is the REFUSED remainder, not a trailing one. The name is load-bearing
    // across the compactor's fail-closed channel and its consumers' tests, so it is corrected HERE in
    // the contract a reader consults rather than renamed in a byte-fidelity fix — renaming a field on
    // a fail-closure path is a change that deserves its own RED-first evidence, and this plan's is
    // spent on the byte defect.
    const trailingMalformed = refused.trim() === "" ? null : refused;
    return { notes, trailingMalformed };
}
// ── Validate a note's structure (SC-1, extended in Phase 21 with the D-09/D-02 refuse-self set). ─
// PURE text→findings — inspects ONLY the parsed scalars, never reads context (D-10 keeps the cheap
// structural check pure; the context-aware admission cross-check is the separate admit() function).
// `trustedEmitter` is the D-04 carve-out, generalized by plan 30-08 from a BOOLEAN to the reserved
// identity the emission CLAIMS. A boolean said "somebody trusted is writing"; the identity says WHICH
// one, so the carve-out cannot be borrowed across emitters — emitVerdict() may author `§14-gate` and
// nothing else, emitCheckpointNote() may author `§checkpoint-guard` and nothing else, and each is
// still an impersonation FAIL in the other's name. The plain CLI `validate <file>` verb, the compaction
// carve-out oracle and every appendNote write path pass `null`, so an agent impersonating EITHER
// reserved identity always FAILs.
export function validate(text, trustedEmitter = null) {
    const findings = [];
    const parsed = parseNote(text);
    if (!parsed) {
        return ["structural FAIL: no YAML frontmatter fence (--- ... ---) found"];
    }
    const { scalars } = parsed;
    // Duplicate provenance key (CR-01 defense-in-depth): a second `kind:`/`at:`/… line is the on-disk
    // signature of a field-injection forgery (the later line silently overrides the earlier one).
    // Reject it here so the CLI `validate <file>` path catches an out-of-band note, not just the
    // appendNote write path. The legitimate refs: YAML list block cannot trigger this — its `- item`
    // lines are consumed by parseNote and never counted as repeated keys.
    for (const dup of parsed.duplicateKeys) {
        findings.push(`structural FAIL: duplicate frontmatter key "${dup}"`);
    }
    // Malformed in-fence line shape (CMP-02 round-5, IN-02 completion): a non-blank fence line that is
    // neither a column-0 `key: value`, the `refs:` block header, nor a `  - item` refs entry silently
    // projects to "" under the lenient parser and cannot enter the verified context. Reject it here so
    // the CLI `validate <file>` verb AND appendNote's write path refuse exactly these notes — and so
    // the compaction carve-out oracle (which runs this same validate()) refuses them on the read path.
    // Symmetric with the duplicateKeys loop above: a duplicate key launders a VALUE; a malformed line
    // launders a whole FIELD by projecting it to empty.
    for (const line of parsed.malformedLines) {
        findings.push(`structural FAIL: malformed frontmatter line "${line}" — a provenance line must be a column-0 ` +
            `"key: value", the "refs:" block header, or a "  - item" refs entry (an indented or ` +
            `"key : value" line silently projects to empty and cannot enter the verified context).`);
    }
    // Required provenance fields: a missing one is a structural FAIL naming the field.
    for (const field of ["kind", "by", "at", "confidence"]) {
        if (scalars[field] === undefined || scalars[field] === "") {
            findings.push(`structural FAIL: missing required provenance field "${field}"`);
        }
    }
    // kind, when present, must be one of the six values; a bad kind names the offending value.
    if (scalars.kind !== undefined && scalars.kind !== "") {
        if (!NOTE_KINDS.includes(scalars.kind)) {
            findings.push(`structural FAIL: kind "${scalars.kind}" is not one of the six values ` +
                `(${NOTE_KINDS.join(", ")})`);
        }
    }
    // ── R6-1 CO-PRIMARY path-metacharacter reject for `by`/`at` (load-bearing, Plan 25-12) ─────────
    // `by` and `at` flow into noteId → the on-disk <id>.md filename. A value carrying a path separator,
    // a NUL / C0 control char, or the `..` parent-dir sequence is a traversal attempt — a structural
    // FAIL naming the field. This is the structural guard for emitVerdict's `at` parameter and the CLI /
    // compaction-carve-out oracle validate callers; it pairs with (does not replace) the writeNoteFile
    // containment chokepoint. The reserved `by: §14-gate` (U+00A7) and a legitimate ISO-8601 `at`
    // (single dots, `:`/`-`/`T`/`Z`) are NOT metacharacters and pass this check.
    for (const field of ["by", "at"]) {
        const v = scalars[field];
        if (v !== undefined && v !== "" && PATH_METACHAR_RE.test(v)) {
            findings.push(`structural FAIL: provenance field "${field}" ("${v}") contains a path separator, a control ` +
                `character, or a ".." sequence — these flow into the on-disk note filename and a ` +
                `metacharacter there is a path-traversal attempt.`);
        }
    }
    // ── The evidence-provenance rule (Phase 31, D-01/D-02): which note may carry which field ──────
    //
    // THE COMPOSER DECIDES WHETHER A LINE IS EMITTED; THIS DECIDES WHICH NOTE MAY CARRY ONE, and it
    // is the only place that rule lives. `sha`, `gate_run` and `content_hash` are the evidence triple
    // an `artifact-ref` needs to be bound to a gate run: all three REQUIRED and non-empty there, and
    // absent everywhere else. Absent and blank are ONE case — a note carrying `sha:` with nothing
    // after it records no commit, and admitting it would leave admit()'s comparison reading "".
    //
    // THE ONE CARVE-OUT, AND WHY IT IS SAFE. The §14 gate's verdict is a `finding`, and it records
    // the commit its run was performed at — that recorded value is the left operand of D-03's
    // stale-evidence refusal, so a kind-only rule would refuse the very note the refusal depends on.
    // The exception is therefore keyed to `by === GATE_IDENTITY`, a property of the note's own text.
    // It opens no path for an agent: the reserved-identity rule below refuses `by: §14-gate` on
    // anything but the gate's own emission, so a narration cannot reach this carve-out by claiming
    // the name. Keying it on the text rather than on `trustedEmitter` is what lets the untrusted
    // readers — the plain `validate <file>` verb, admit(), and the compaction carve-out oracle —
    // re-read a legitimately written verdict from disk without reporting a false FAIL on it.
    //
    // The hex allowlist is asked of `sha` and `content_hash` wherever they are present: the composer
    // guards the write path, this guards text that arrived from disk, and both ask the ONE exported
    // SHA_HEX_RE so there is no second charset spelled anywhere. `gate_run` is a per-run id, not a
    // digest, so it is held to the single-line guard and nothing more.
    const PROVENANCE_FIELDS = ["sha", "gate_run", "content_hash"];
    if (scalars.kind === "artifact-ref") {
        for (const field of PROVENANCE_FIELDS) {
            if (scalars[field] === undefined || scalars[field] === "") {
                findings.push(`structural FAIL: an artifact-ref requires the evidence-provenance field "${field}" — ` +
                    `an artifact-ref records the commit its spec was run at (sha), the per-run id of the ` +
                    `§14-gate verdict that certifies that run (gate_run), and the sha256 of the committed ` +
                    `spec bytes (content_hash). A missing or empty one cannot be bound to a gate run.`);
            }
        }
    }
    else {
        for (const field of PROVENANCE_FIELDS) {
            if (scalars[field] === undefined || scalars[field] === "")
                continue;
            if (field === "sha" && scalars.by === GATE_IDENTITY)
                continue; // the verdict's own carve-out
            findings.push(`structural FAIL: the evidence-provenance field "${field}" belongs to an artifact-ref and ` +
                `to no other kind; this note is a "${scalars.kind}". The only other note that may carry ` +
                `one is the §14-gate verdict, which records "sha" — the commit its run was performed at ` +
                `— and nothing else of the triple.`);
        }
    }
    for (const field of ["sha", "content_hash"]) {
        const v = scalars[field];
        if (v !== undefined && v !== "" && !SHA_HEX_RE.test(v)) {
            findings.push(`structural FAIL: provenance field "${field}" ("${v}") is not lowercase hex matching ` +
                `${SHA_HEX_RE} — an abbreviated or full git object id, or a sha256 digest. The allowlist ` +
                `is anchored: a value that merely contains hex is refused.`);
        }
    }
    // ── D-02 reserved-identity rule (applies to ANY note, not only findings) ──────────────────────
    // A note authored by a RESERVED machine identity is an impersonation flag, EXCEPT that identity's
    // OWN sanctioned emitter — emitVerdict() for `§14-gate` (D-04), emitCheckpointNote() for
    // `§checkpoint-guard` (D-10/D-11) — each of which names itself here. The comparison is against the
    // claimed identity, not against a boolean, so one emitter's carve-out never covers the other's name.
    if (RESERVED_IDENTITIES.includes(scalars.by ?? "") &&
        scalars.by !== trustedEmitter) {
        findings.push(`structural FAIL: "${scalars.by}" is a reserved author identity (a grugops machine writer). ` +
            `A note may not be authored by it — this is an impersonation flag. Only that identity's own ` +
            `sanctioned emitter may use it.`);
    }
    // ── D-09 refuse-self FAIL set, GATED on kind === "finding" (D-08 — only a finding needs a stamp).
    // Still text-only: inspects scalars.verified_by / scalars.by only.
    //
    // WHY THE SUPPRESSION EXISTS, SAID ABOUT THE IDENTITY RATHER THAN ABOUT ONE CALLER (plan 30-11
    // round 2, finding `RA2-2`). Both reserved emitters author a `finding` that carries no
    // `verified_by` of its own, and the reason is the same for both and is a property of the identity:
    // **a root of trust stamps nothing above itself, because nothing verifies it.** That is the whole
    // justification, and it is true of `§14-gate` and `§checkpoint-guard` alike.
    //
    // This comment previously justified the checkpoint arm differently — "it is written by a separate
    // process the agent under it cannot invoke, pass content to or silence" — and that sentence is
    // false. `emitCheckpointNote` is an exported function; any importer calls it with any content, and
    // the record it writes is byte-indistinguishable from a hook-written one. Measured: an in-process
    // call produced `CHECKPOINT ALLOWED … command: "git push --force origin main"` under
    // `by: §checkpoint-guard` with no guard running, no grant and nothing pushed. The clause was not
    // decoration — it was the stated reason a human auditing `checkpoint-trace` may read a record as a
    // hook fact, so it is replaced rather than softened. What DOES distinguish the tiers is named at
    // `emitCheckpointNote`'s own header, in the same terms `emitVerdict` uses.
    //
    // The suppression is reached ONLY with a claimed reserved identity, which the reserved-identity
    // rule above has already matched against the note's own author.
    if (scalars.kind === "finding" && trustedEmitter === null) {
        const vb = (scalars.verified_by ?? "").trim();
        if (vb === "") {
            findings.push(`structural FAIL: a finding requires a verified_by stamp — it must not be empty ` +
                `(refuse-self: an unverified finding cannot enter the verified context).`);
        }
        else if (REFUSE_SELF_LITERALS.includes(vb.toLowerCase())) {
            findings.push(`structural FAIL: verified_by "${vb}" is a self-attestation literal — a finding may not ` +
                `verify itself (refuse-self).`);
        }
        else if (vb === scalars.by) {
            findings.push(`structural FAIL: verified_by "${vb}" equals the author (by) — an author may not ` +
                `self-stamp its own finding (refuse-self).`);
        }
        else if (isInvalidEvidencePhrase(vb)) {
            findings.push(`structural FAIL: verified_by "${vb}" is hollow evidence (a DeLM invalid-evidence ` +
                `phrase) — it does not name a real verification.`);
        }
        else if (!GATE_STAMP_RE.test(vb) && !HUMAN_STAMP_RE.test(vb)) {
            findings.push(`structural FAIL: verified_by "${vb}" matches no accepted grammar. A finding's stamp ` +
                `must be "§14-gate#<id>" (gate-verified) or "human:<name>" (escalation).`);
        }
    }
    return findings;
}
// ── atomicWrite: write a unique temp sibling, then rename onto the final path. ──────────────────
// POSIX: rename atomically replaces. Windows (MoveFileEx): not atomic and fails with
// EPERM/EEXIST/EACCES when the destination already exists — the unlink-then-rename branch handles
// that. For note publication the final path is ALWAYS fresh/unique so the Windows branch never
// fires; it exists for the single-writer derived-artifact (index.*) regen, which is freshness-gated.
export function atomicWrite(finalPath, data) {
    const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    writeFileSync(tmp, data, "utf8");
    try {
        renameSync(tmp, finalPath);
    }
    catch (e) {
        const code = e.code;
        if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
            // Windows branch: remove the destination, then retry the rename.
            try {
                unlinkSync(finalPath);
            }
            catch {
                /* not-present is fine */
            }
            renameSync(tmp, finalPath);
        }
        else {
            // Any other error: best-effort temp cleanup, then rethrow.
            try {
                unlinkSync(tmp);
            }
            catch {
                /* best-effort */
            }
            throw e;
        }
    }
}
// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE ONE NON-BLOCKING FILE READER OF THIS MODULE (31-21, CR-12 / D-24).
//
// WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED. Round 4's CR-11 fix put a destination READ at
// `writeNoteFile`, the module's single note-write chokepoint. The placement was right; the primitive
// was not. `readFileSync` on a path that is not a regular file BLOCKS at `open(2)` with no timeout,
// so ONE `mkfifo` at a note path wedged EVERY writer in this module — `appendNote`,
// `appendPreAdmittedNote`, `admitAndAppend`, `promoteAdmitted`, `emitTrusted`, `emitVerdict` and
// `emitCheckpointNote` all end here. Reproduced against the committed `scripts/context-io.js` before
// any source change: `timeout 10 node <probe>` → EXIT=124, zero bytes of stdout, zero bytes of
// stderr. A guard hook that emits a checkpoint note then hangs the tool call, and a PreToolUse hook
// that never answers is, in this project's own measured words, the same event as an allow.
//
// WHY THIS IS AN EXTRACTION AND NOT A SECOND HABIT. The discipline below is not new: it is the body
// of `readGovernanceConfigCandidate`, written 2,400 lines further down after plan 30-11 round 2
// measured finding `RA1-2` — a FIFO at `<project>/.grugops/factory.config.json` producing no exit and
// zero bytes on both streams at 20 seconds on BOTH committed guards. That reader's own header is the
// argument for this one and is kept in place as the recorded origin of the rule. What CR-12 proves is
// that a rule living inside one function is a HABIT: the next reader added to this module did not
// inherit it. So the body moved UP here, `readGovernanceConfigCandidate` became a caller, and this
// module now has exactly ONE non-blocking file read rather than two copies of one idea. The derived
// read-site axis in `scripts/context-io-writer-set.test.ts` asserts that count with a seeded mirror,
// so a third reader added later turns a case red before it can ship unguarded.
//
// THE CANONICAL FORM, AND WHY THE REFUSAL IS BY RULE. A caller-influenced read position may be
// ABSENT, OR A REGULAR FILE. Every other shape — FIFO, character or block device, directory, socket,
// present-and-unopenable — is refused in bounded time, by name, and the refusal NAMES the position.
// The decision is made by `fstat` on the OPEN descriptor rather than by an enumeration of dangerous
// file types, because an enumeration is a list that rots and this repository has paid for that shape
// more than once. `fstat` through the descriptor also stats THROUGH a symlink, which is deliberate:
// a file legitimately delivered through a symlink to a regular file still reads, and a symlink to a
// FIFO is refused for what it POINTS AT rather than for being a symlink. `lstat` would refuse both,
// which is a different and wrong rule.
//
// `O_NONBLOCK` is what makes the open itself safe: opening a FIFO for reading blocks until a writer
// appears unless it is set. ENOENT is the ONLY error mapped to "nothing here"; every other open
// failure is a position that IS occupied and could not be read, which fails CLOSED.
//
// ── DECISION D-24, MIRRORED HERE (one of the three places that must agree). ─────────────────────
// Full text: `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`, gap-closure round 5,
// plan 31-21. Also mirrored in `31-21-SUMMARY.md`'s key-decisions block.
//
//   Every read and every append this module performs on a caller-influenced filesystem position
//   goes through ONE non-blocking authority, and a property asserted in prose is asserted over the
//   DERIVED set of routes that have it, never over the route a reviewer happened to name.
//
// Three sub-decisions: (1) one non-blocking reader and one non-blocking appender for the whole
// module, with the canonical form `absent, or a regular file` stated once and everything else
// refused by name; (2) the GOV-02 ledger event is appended BEFORE the note is written at EVERY
// member of a derived note-then-ledger writer set (`promoteAdmitted` and `admitAndAppend`), and the
// ledger look fails CLOSED, because an over-record is the safe asymmetry and a note with no ledger
// line is a repudiation; (3) the corrected workflow prose NAMES the routes it covers and a case
// binds it to that derived set. D-24 does NOT re-base `ADMIT_FROZEN_SHA256` and does NOT touch
// `hooks/guard.ts` or `FROZEN_GUARD_BLOB`. Four residuals are named there, including R-31-21-03:
// this plan's own stated premise about `appendFileSync` was MEASURED false and is closed here
// rather than recorded as a disposition.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
/**
 * The one shape a caller-influenced read position may legitimately have. Published as a string so
 * every refusal below spells it once — the tests and the prose bind to this, not to a paraphrase.
 */
export const CANONICAL_READ_POSITION = "absent, or a regular file";
/**
 * The frozen clause a note-path refusal NAMES (31-21, CR-12). One spelling, so the cases in
 * `scripts/context-io.test.ts` and any later prose bind to the same literal.
 *
 * It covers every non-canonical shape, INCLUDING a present-but-unopenable path: a position this
 * write cannot read is not a position it may replace, and "not a readable regular file" is the one
 * question the chokepoint asks. The underlying reason (`fifo`, `directory`, `EACCES`, …) is carried
 * in the message beside the clause rather than fragmenting the clause into an enumeration.
 */
export const NOTE_PATH_NOT_REGULAR_FILE_CLAUSE = "note-path-not-a-regular-file";
/**
 * The clause an over-ceiling REGULAR file at a note position NAMES (31-29, CR-19).
 *
 * WHY THIS EXISTS AS ITS OWN CLAUSE RATHER THAN SHARING THE SHAPE ONE. Until this plan, an
 * over-ceiling note destination was refused through `NOTE_PATH_NOT_REGULAR_FILE_CLAUSE`, whose
 * message asserts the position "is not absent, or a regular file". The round-6 verifier MEASURED
 * that sentence against a 9,437,353-byte file that IS a regular file and recorded it as false. A
 * refusal that misnames the condition it met is a fabricated claim about the mechanism — the same
 * thing this repository forbids when it forbids a faked gate — and it is fixed as its own defect
 * rather than as a wording tidy-up. Two conditions, two names, each true of the file it describes.
 */
export const NOTE_ABOVE_CEILING_CLAUSE = "note-above-size-ceiling";
/**
 * The clause an over-ceiling GOV-02 ledger position NAMES (31-29, CR-19's second register).
 */
export const LEDGER_ABOVE_CEILING_CLAUSE = "audit-ledger-above-size-ceiling";
/**
 * The ceiling on a NOTE file, on BOTH sides. STATED here rather than inherited from the
 * configuration reader's 8 MiB by accident: a note and a governance config are different artifacts,
 * and a shared constant would make one of the two ceilings a coincidence of refactoring.
 *
 * ── EXPORTED, AND A BOUND IS OWNED BY THE SIDE THAT ADMITS (31-29, CR-19). ─────────────────────
 *
 * WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED. 31-21 (D-24) wired this ceiling into
 * `readRegularFileOrNull` and into nothing else. The write side never consulted it, so the writer
 * could CREATE an object its own readers were required to refuse. Reproduced against the committed
 * `scripts/context-io.js` at HEAD, with the round-6 verifier's own probe spelling:
 *
 *   the sanctioned writer, given a body of "x".repeat(9 * 1024 * 1024) — 9,437,184 bytes
 *     -> RETURNED id 20260910T000000Z-engineer-observation-3e67edaf, no diagnostic
 *     -> the file on disk: 9,437,353 bytes, a regular file
 *     -> readContext(task, ctx).length === 0
 *
 * The note is not corrupt, not refused and not logged — it is INVISIBLE, to `readContext`,
 * `render`, `currentState`, `admit()`'s cross-check and `promoteAdmitted`'s liveness clause alike,
 * because all five take that one reader's path. That is silent, permanent data loss on the shared
 * verified context, which is this project's only memory between agents.
 *
 * THE RULE THE FIX INSTALLS, AS A PROPERTY RATHER THAN AS A PATCH. A bound is enforced on the side
 * that ADMITS. The write side refuses an over-ceiling note at composition time, before anything is
 * written; the read side keeps its own refusal, for a file it did not write; and BOTH sides read
 * THIS ONE exported constant, so they cannot disagree by a byte. The export is what lets
 * `scripts/context-io.test.ts` derive every ceiling-comparison site and assert each one reads this
 * binding rather than a literal — a second spelling of a bound is the drift shape that produced
 * CR-19 in the first place.
 *
 * NAMING NOTE for a reader arriving from the round-6 brief, which calls this constant
 * `NOTE_MAX_BYTES`: it is this one. The existing spelling is KEPT rather than renamed, because a
 * rename here would create the second spelling this module keeps deleting.
 */
export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;
/**
 * The CONDITION a read/append position refusal met, as a discriminant the caller can branch on.
 *
 * ONE AUTHORITY FOR THE CONDITION, ONE REGISTER PER POSITION FOR THE NAME (31-29, CR-19). The two
 * authorities below decide WHAT is true of a position; each CALLER owns the clause it publishes for
 * that position, because a clause is a statement in the caller's own register. Carrying the
 * condition on the error is what lets `writeNoteFile` and `appendAuditLedger` name their own clause
 * WITHOUT re-deriving the fact — the alternative, matching on the message text, would make a
 * refusal's wording load-bearing and is exactly the fragility this module keeps deleting.
 *
 * PUBLISHED AS A VALUE, NOT ONLY AS A TYPE (31-33, CR-24 / D-34). A union type is erased from the
 * compiled `.js`, so nothing downstream could BIND to it: `NOTE_SKIP_ARMS` was a second hand-typed
 * literal beside this one, and the two disagreed — three conditions filed under one arm — while both
 * read as complete. The conditions are a runtime array now and the type is derived FROM it, so the
 * authority that raises a condition and the register that publishes an arm for it are one object.
 */
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"];
/** The error both filesystem authorities raise, carrying the condition it met. */
export class ReadPositionRefusal extends Error {
    condition;
    constructor(condition, message) {
        super(message);
        this.name = "ReadPositionRefusal";
        this.condition = condition;
    }
}
/**
 * Read one filesystem position as text, or `null` when NOTHING is there.
 *
 * @param path      the position to read
 * @param maxBytes  the size ceiling; a larger regular file is refused rather than read
 * @param position  what this position IS, in the caller's words — it is quoted into every refusal,
 *                  so a reader of the error learns which position was refused and why
 *
 * Returns `null` for ENOENT and ONLY for ENOENT. Throws — in bounded time — for every other shape.
 */
/**
 * The clause an audit-ledger APPEND refusal names (31-21). One spelling, like the note-path clause.
 */
export const LEDGER_PATH_NOT_REGULAR_FILE_CLAUSE = "audit-ledger-path-not-a-regular-file";
/**
 * The ONE sentence every writer uses when a GOV-02 ledger position cannot be written (31-21).
 *
 * Three sites reach this decision — `appendNote`, `admitAndAppend`'s gated branch and its non-gated
 * branch — and three hand-typed spellings of one sentence is the drift this module keeps deleting.
 * The sentence is stated once and the sites interpolate it, so a test binds to one literal.
 */
export const UNRECORDABLE_ADMISSION_REFUSAL = "An admission the audit trail cannot record is refused rather than granted unrecorded.";
/**
 * Append one line to a regular file, creating it when absent, WITHOUT the ability to block.
 *
 * THE WRITE SIDE OF THE SAME RULE, AND A CORRECTION TO THIS PLAN'S OWN PREMISE. Plan 31-21 recorded,
 * as a stated truth, that "`appendFileSync` to a FIFO exits 0 IMMEDIATELY — no hang, and the GOV-02
 * event is silently discarded", and asked for that to be filed as a write-site disposition. It is
 * false on darwin, and it was MEASURED false on this tree rather than reasoned about: `appendFileSync`
 * opens for WRITING, and opening a FIFO for writing BLOCKS until a reader appears.
 *
 *   mkfifo <repoRoot>/.grugops/audit/admissions.jsonl
 *   timeout 10 node <probe> admit          -> EXIT=124, wall 10.08s, zero further bytes
 *   timeout 10 node <probe> admitAndAppend -> EXIT=124, wall 10.05s, zero further bytes
 *
 * That is a FOURTH blocking position in CR-12's class, reached from `admit` and from
 * `admitAndAppend`'s gated branch — neither of which consults `ledgerRecordsId`, so neither inherits
 * the read-side refusal. `O_NONBLOCK` makes the open itself safe (a FIFO with no reader fails ENXIO
 * rather than waiting), `fstat` on the descriptor refuses everything that is not a regular file, and
 * `O_APPEND` keeps the append-only guarantee the ledger's own comment makes.
 */
function appendRegularFileLine(path, line, position, maxBytes) {
    let fd;
    try {
        fd = openSync(path, fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_CREAT | fsConstants.O_NONBLOCK, 0o600);
    }
    catch (e) {
        throw new ReadPositionRefusal("unopenable", `context-io: the ${position} "${path}" could not be opened for append ` +
            `(${e.code ?? "unknown"}) — it is refused rather than waited on. ` +
            `The canonical form for this position is ${CANONICAL_READ_POSITION}.`);
    }
    try {
        const st = fstatSync(fd);
        if (!st.isFile()) {
            throw new ReadPositionRefusal("not-a-regular-file", `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
                `written, because writing to a FIFO or a device can block forever and a program that ` +
                `never answers records nothing. The canonical form for this position is ` +
                `${CANONICAL_READ_POSITION}.`);
        }
        // ── THE SAME RECONCILIATION, ONE REGISTER OVER (31-29, CR-19). ───────────────────────────────
        //
        // The append side carried NO ceiling while `ledgerRecordsId` carried 64 MiB, which is the note
        // asymmetry exactly. Reproduced against the committed `.js`: with the ledger seeded to
        // 67,264,512 bytes, `appendNote` under `audit_retention: retained` appended 178 further bytes
        // and returned an id, and the very next read of that ledger refused it as above the
        // 67,108,864-byte ceiling. An append that grows a trail past what any reader will read makes
        // the trail unreadable and reports success for doing it.
        //
        // WHICH OF THE TWO OPTIONS WAS CHOSEN, AND WHY — recorded so a later reader meets a DECISION
        // rather than an asymmetry. The alternative was to drop the read ceiling and STREAM the look
        // line by line, which would let the ledger grow without bound. It is REJECTED: the ceiling is
        // not a parser limitation, it is a deliberate operational limit on an append-only trail (see
        // AUDIT_LEDGER_MAX_BYTES), and streaming would remove the limit rather than honour it. Bounding
        // the APPEND keeps the trail inside the size every reader of it can handle, and it surfaces the
        // exhaustion as a named refusal AT THE MOMENT A HUMAN CAN STILL ROTATE THE LEDGER — while
        // streaming would surface it as an unbounded read the next time somebody looked.
        //
        // The fstat above is the one this check reads, so no new filesystem call enters the module.
        const wouldBe = st.size + Buffer.byteLength(line, "utf8");
        if (wouldBe > maxBytes) {
            throw new ReadPositionRefusal("above-ceiling", `context-io: appending ${Buffer.byteLength(line, "utf8")} bytes to the ${position} ` +
                `"${path}" would carry it to ${wouldBe} bytes, above the ${maxBytes}-byte ceiling — ` +
                `refused rather than appended, because a trail grown past what its own readers will read ` +
                `is a trail nobody can audit. Nothing was appended.`);
        }
        writeSync(fd, line, null, "utf8");
    }
    finally {
        closeSync(fd);
    }
}
/**
 * EXPORTED FOR THE PARITY AXIS, AND FOR NOTHING ELSE (plan 31-27).
 *
 * `hooks/hook-entry.ts` now RESTATES this rule inline, because that file may import only `node:`
 * builtins — the import list is the whole reason the wrapper is a separate process, and importing
 * from `scripts/` would hand the corruption class that reaches the decider a route into the wrapper.
 * A restatement is a second implementation of ONE rule, which is this repository's recorded drift
 * shape, so `scripts/nonblocking-reader-parity.test.ts` drives ONE shared file-shape corpus through
 * BOTH and requires the same decision from each. That test must reach the REAL implementation rather
 * than a copy of it, and a copy is exactly what a private function would have forced it to make.
 * Every in-module caller still goes through this same function; the export adds a reader, not a
 * second path.
 */
export function readRegularFileOrNull(path, maxBytes, position) {
    let fd;
    try {
        fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    }
    catch (e) {
        const code = e.code;
        if (code === "ENOENT")
            return null; // genuinely nothing here
        // Present and unopenable — EACCES, ELOOP, ENXIO (a socket), a dangling symlink's own ENOENT on
        // the TARGET is reported as ENOENT by open(2) and is therefore correctly "nothing here". Fail
        // closed, naming the position rather than surfacing a bare errno the caller cannot place.
        throw new ReadPositionRefusal("unopenable", `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
            `— it is refused rather than read. The canonical form for this position is ` +
            `${CANONICAL_READ_POSITION}.`);
    }
    try {
        const st = fstatSync(fd);
        // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
        // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
        // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
        // now carries the condition it actually met, and each caller names its own clause from it.
        if (!st.isFile()) {
            throw new ReadPositionRefusal("not-a-regular-file", `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
                `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
                `program that never answers refuses nothing. The canonical form for this position is ` +
                `${CANONICAL_READ_POSITION}.`);
        }
        if (st.size > maxBytes) {
            throw new ReadPositionRefusal("above-ceiling", `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
                `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
                `size and nothing else.`);
        }
        // The read is bounded by the size fstat just reported on this same descriptor.
        const buf = Buffer.allocUnsafe(Number(st.size));
        let off = 0;
        while (off < buf.length) {
            const n = readSync(fd, buf, off, buf.length - off, off);
            if (n === 0)
                break;
            off += n;
        }
        return buf.subarray(0, off).toString("utf8");
    }
    finally {
        closeSync(fd);
    }
}
// ── writeNoteFile: the SINGLE note-file write chokepoint (path-containment, R6-1). ───────────────
// GAP-R6-1 (Plan 25-12, the Phase-22 round-8 one-chokepoint lesson): the on-disk note filename is
// `${id}.md`, and `id` is `${atCompact}-${by}-${kind}-${nonce}` (noteId) — so an agent-controlled
// `by`/`at` carrying a path separator or `..` could steer the write OUTSIDE the task's notes dir
// (cross-task injection through the sanctioned writer). The structural fix makes containment a
// PROPERTY OF THE WRITE: compute the final path, then assert the RESOLVED final path stays strictly
// inside the RESOLVED notes dir (it must begin with the resolved notes dir + the platform separator),
// failing CLOSED (throw, nothing written) otherwise. BOTH note-file writers — appendNote AND the
// sibling direct writer emitVerdict — route through here, so a future `at`-reachable change to either
// cannot silently re-open the hole. Because the check operates on the RESOLVED filesystem path it
// cannot be defeated by a novel metacharacter spelling (the anti-whack-a-mole posture). KNOWN LIMIT
// (documented, NOT patched): a lexical resolve() does not follow symlinks, so a symlinked notes dir /
// ancestor would pass containment — bounded by the same-uid direct-FS residual (the channel can only
// atomicWrite a `.md`, never plant a symlink). The id is NOT inspected by validate(); this
// path-containment is what catches a forged/precomputed id.
//
// ── APPEND-ONLY, ENFORCED HERE (31-18, CR-11). ──────────────────────────────────────────────────
//
// WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED. `appendNote`'s own justification comment says
// "Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication." That was an
// ASSUMPTION every writer happened to satisfy because it derived its id through `noteId`'s nonce —
// not a property the write enforced. `promoteAdmitted` (31-14) then arrived taking its id from an
// ARGUMENT, and the round-4 verifier reproduced the consequence against the committed `.js`: a
// legitimate `observation` admitted into a shared context the ordinary way was silently REPLACED by
// a forged `finding` under the same id, with the same id returned, nothing thrown, and no diagnostic
// of any kind. The original note was not superseded and not folded out by replay — it was DELETED
// from the permanent audit trail, and `render()`/`currentState()` reported only the replacement.
//
// WHY THE CHECK BELONGS AT THE CHOKEPOINT AND NOT IN THE ONE ROUTE THE REVIEWER REACHED. This
// repository's own doctrine is to ask how a chokepoint is REACHED, not only what it refuses. A
// destination read written into `promoteAdmitted` alone would close the route the reviewer walked
// and leave the CAPABILITY intact for the next writer that accepts a caller-chosen id — which is
// exactly the "fix the probe shape" pattern four rounds of this phase have paid for. Every note
// write in this module passes through here, so the invariant closes the class.
//
// THE IDENTICAL-BYTES CASE IS DECIDED, NOT LEFT TO THE RENAME PRIMITIVE. A write whose bytes are
// EXACTLY what the destination already holds PROCEEDS, as a no-op. The argument: the post-condition
// the caller asked for already holds, there is no note to destroy, and the case is reachable without
// any adversary — a re-run compaction promoting the same admitted note twice is an ordinary,
// idempotent operation that must not become a refusal. Only a write that would CHANGE an existing
// note's bytes is refused, and it is refused loudly. Returning early also means the rename primitive
// is never asked to replace an existing file on this path, so `atomicWrite`'s Windows
// unlink-then-rename branch stays what its own comment says it is: the derived-artifact path only.
function writeNoteFile(notesDir, id, text) {
    const finalPath = join(notesDir, `${id}.md`);
    const resolvedDir = resolve(notesDir);
    const resolvedFinal = resolve(finalPath);
    // Strict containment: the resolved final path must begin with the resolved notes dir + separator.
    // (Equality is NOT allowed — the final path is always a file strictly inside the dir.)
    if (!resolvedFinal.startsWith(resolvedDir + sep)) {
        throw new Error(`context-io.writeNoteFile: refusing to write — note id "${id}" resolves OUTSIDE the task ` +
            `notes directory (path containment violated: "${resolvedFinal}" is not strictly inside ` +
            `"${resolvedDir}"). No file was written. This is a path-traversal attempt (GAP-R6-1).`);
    }
    // THE DESTINATION READ GOES THROUGH THE ONE READER (31-21, CR-12 / D-24). The `existsSync` +
    // `readFileSync` pair that stood here could BLOCK FOREVER on a note path occupied by anything that
    // is not a regular file, and the path is caller-influenced: `promoteAdmitted` takes its id from
    // `sourceId` outright and `appendNote`/`emitTrusted` accept a `precomputedId`, so an adversary who
    // can plant one FIFO chooses which write wedges. The read is now bounded, and a position outside
    // the canonical form is a NAMED refusal rather than a wait. `existsSync` is gone with it: "is
    // something there" and "what does it hold" were two questions asked with two primitives, and the
    // one reader answers both at once, with `null` meaning absent.
    //
    // A DIRECTORY AT THE NOTE PATH USED TO REFUSE FOR THE WRONG REASON, WHICH IS ALSO FIXED HERE. The
    // pair above reached the APPEND-ONLY refusal for it: readFileSync threw EISDIR, the catch mapped it
    // to null, and the message then said "the destination already holds a DIFFERENT note". The
    // condition that actually held was never named. It is now.
    // ── THE BOUND IS OWNED BY THE SIDE THAT ADMITS (31-29, CR-19). ────────────────────────────────
    //
    // THE CANDIDATE'S OWN SIZE IS DECIDED HERE, BEFORE ANY DIRECTORY IS CREATED AND BEFORE ANY BYTE
    // IS WRITTEN. Until this plan the ceiling lived on the read side alone, so this writer could
    // create a note that `readContext`, `render`, `currentState`, `admit()`'s cross-check and
    // `promoteAdmitted`'s liveness clause were all then REQUIRED to refuse — measured on the
    // committed `.js` as a clean WROTE followed by a zero-length read of the same task.
    //
    // WHY THIS IS A PROPERTY AND NOT A PATCH. A writer that produces objects its own readers must
    // reject has no coherent contract: either the object is admissible, in which case the reader is
    // wrong to refuse it, or it is not, in which case the write was wrong to succeed. The side that
    // ADMITS owns the bound, so the question is settled once, at composition, where "nothing was
    // written" is true by construction rather than by cleanup. The read side KEEPS its own refusal —
    // it must, because it reads files this module did not write — and both sides read the ONE
    // exported `NOTE_FILE_MAX_BYTES`, so they cannot disagree by a byte.
    //
    // The check sits AFTER path containment deliberately: a traversal-bearing id is a security fault
    // about WHERE, and it stays the first thing this chokepoint answers.
    const candidateBytes = Buffer.byteLength(text, "utf8");
    if (candidateBytes > NOTE_FILE_MAX_BYTES) {
        throw new Error(`context-io.writeNoteFile: refusing to write (${NOTE_ABOVE_CEILING_CLAUSE}) — the composed ` +
            `note under id "${id}" is ${candidateBytes} bytes, above the ${NOTE_FILE_MAX_BYTES}-byte ` +
            `ceiling every reader of this store enforces. Writing it would create a note this module's ` +
            `own readers are required to refuse, which is silent loss rather than storage. No file was ` +
            `written and no directory was created.`);
    }
    let existing;
    try {
        existing = readRegularFileOrNull(resolvedFinal, NOTE_FILE_MAX_BYTES, "note destination");
    }
    catch (e) {
        // THE CLAUSE NAMES THE CONDITION THAT IS TRUE (31-29, CR-19). An over-ceiling REGULAR file gets
        // the ceiling clause; every non-canonical SHAPE keeps the shape clause. Reported through the
        // authority's own discriminant rather than by matching its message text.
        const aboveCeiling = e instanceof ReadPositionRefusal && e.condition === "above-ceiling";
        throw new Error(aboveCeiling
            ? `context-io.writeNoteFile: refusing to write (${NOTE_ABOVE_CEILING_CLAUSE}) — the note ` +
                `destination "${resolvedFinal}" IS a regular file, and it is above the ` +
                `${NOTE_FILE_MAX_BYTES}-byte ceiling, so this write can neither read it to compare nor ` +
                `replace it. No file was written. Underlying reason: ${e.message}`
            : `context-io.writeNoteFile: refusing to write (${NOTE_PATH_NOT_REGULAR_FILE_CLAUSE}) — the ` +
                `note destination "${resolvedFinal}" is not ${CANONICAL_READ_POSITION}, so it is REFUSED ` +
                `rather than waited on and rather than replaced. No file was written. Underlying reason: ` +
                `${e.message}`);
    }
    if (existing !== null) {
        if (existing === text)
            return; // the decided idempotent case: nothing to write, nothing to lose
        throw new Error(`context-io.writeNoteFile: refusing to write — the destination already holds a DIFFERENT ` +
            `note under id "${id}". The shared verified context is APPEND-ONLY (SCTX-04): a ` +
            `supersession is a NEW note carrying a supersedes: field, never a rewrite of an existing ` +
            `one. No file was written, and the note already at "${resolvedFinal}" is untouched (CR-11).`);
    }
    mkdirSync(notesDir, { recursive: true });
    atomicWrite(finalPath, text);
}
// ── Compose a note's frontmatter + body from a validated NoteInput. ─────────────────────────────
// The frozen `id:` line is emitted FIRST inside the fence (a deterministic slot, before `kind:`) so
// the on-disk frontmatter carries the same stable creation-time identity as the <id>.md filename.
// The id is a load-bearing provenance field the compaction carve-out matches raw→promoted on and
// byte-equal-checks — it is single-line-guarded exactly as the other provenance fields are.
function composeNote(note, body, id) {
    const refsBlock = note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
    return ("---\n" +
        `id: ${id}\n` +
        `kind: ${note.kind}\n` +
        `by: ${note.by}\n` +
        `at: ${note.at}\n` +
        `verified_by: ${note.verified_by}\n` +
        `confidence: ${note.confidence}\n` +
        provenanceBlock(note) +
        refsBlock +
        `supersedes: ${note.supersedes ?? ""}\n` +
        "---\n\n" +
        (body.endsWith("\n") ? body : body + "\n"));
}
// ── The evidence-provenance lines, emitted PER FIELD and ONLY when the field is set. ────────────
//
// WHY PRESENCE AND NOT KIND, WRITTEN DOWN BECAUSE THE PLAN SAID KIND (plan 31-01 deviation).
// The plan asked for two things that cannot both be literally true: emit the three scalars ONLY
// for `kind === "artifact-ref"`, AND have the §14 gate's verdict — which is a `finding` — record
// the SHA its run was performed at. Gating on kind would drop the verdict's SHA at the composer
// and leave D-03's comparison with no left operand, which is the exact gap research F-02 measured.
//
// Gating on PRESENCE discharges the reason the kind gate was asked for. That reason is byte
// stability: no note composed before this change set any of the three, so every one of them still
// composes byte-for-byte its previous form, and that is asserted rather than claimed (the
// composed-fence cases in scripts/context-io.test.ts). What changes bytes is exactly the two
// shapes that are SUPPOSED to carry provenance — the gate's own verdict, and an `artifact-ref`.
//
// The rule about WHICH note may carry WHICH field is not decided here; validate() decides it once
// (required-and-complete on an artifact-ref; `sha` alone on the gate's verdict; forbidden
// elsewhere), so a field the composer emits on a note that may not carry it is refused loudly at
// the very next line of every write path rather than dropped in silence.
function provenanceBlock(note) {
    const line = (key, value) => value !== undefined && value !== "" ? `${key}: ${value}\n` : "";
    return (line("sha", note.sha) + line("gate_run", note.gate_run) + line("content_hash", note.content_hash));
}
// ── Note id: <at-compact>-<by>-<kind>-<nonce>. The nonce is a collision nonce, NOT a security token.
// EXPORTED (IN-01): this is the SINGLE source of note identity raw→promoted, reused by both
// appendNote/emitVerdict (the shared-context write path) AND the compactor's composeThreadNote (the
// raw-thread write path). Single-sourcing the formula is the same single-source principle as IN-02's
// shared parser: a thread note's frozen id CANNOT drift from the promoted-counterpart id format the
// id-keyed carve-out match depends on, because both sides compute it here.
export function noteId(note) {
    const atCompact = note.at.replace(/[-:]/g, "").replace(/\.\d+/, ""); // 2026-06-17T14:23:05Z → 20260617T142305Z
    const nonce = randomUUID().slice(0, 8); // node:crypto — lock-free same-millisecond uniqueness
    return `${atCompact}-${note.by}-${note.kind}-${nonce}`;
}
// ── composeValidatedNote: the field guards + the frozen id + compose + the structural refusal. ───
//
// NOT EXPORTED. This is the shared BODY of the two write routes below, factored out so the sequence
// "guard every interpolated field → resolve ONE id → compose → validate" exists exactly once. It
// decides nothing about admission; it returns the id and the composed text, or throws on a
// structurally invalid note having written nothing (nothing has been opened at that point).
//
// It is a refactor with no behaviour of its own: every assertion below is the one appendNote already
// performed, in the order it already performed it.
function composeValidatedNote(task, note, body, precomputedId) {
    assertSafeTask(task);
    // Field-injection guard (CR-01): no interpolated provenance field may carry a newline, which
    // would smuggle additional frontmatter lines into the fence and forge a verified note.
    assertSingleLine("kind", note.kind);
    assertSingleLine("by", note.by);
    assertSingleLine("at", note.at);
    assertSingleLine("verified_by", note.verified_by);
    assertSingleLine("confidence", note.confidence);
    if (note.supersedes !== null)
        assertSingleLine("supersedes", note.supersedes);
    for (const r of note.refs)
        assertSingleLine("refs[]", r);
    // The three evidence-provenance scalars are interpolated into the same fence, so CR-01 applies to
    // them identically: a newline in `sha` would smuggle an extra `key: value` line into the
    // frontmatter. Guarded whenever the field is SET — the same condition the composer emits on, so
    // no value can reach the fence unguarded — and the two hex fields additionally pass the anchored
    // allowlist here on the write path.
    if (note.sha !== undefined) {
        assertSingleLine("sha", note.sha);
        assertHexScalar("sha", note.sha);
    }
    if (note.gate_run !== undefined)
        assertSingleLine("gate_run", note.gate_run);
    if (note.content_hash !== undefined) {
        assertSingleLine("content_hash", note.content_hash);
        assertHexScalar("content_hash", note.content_hash);
    }
    // Compute the frozen id ONCE and use it for BOTH the emitted `id:` frontmatter field and the
    // <id>.md filename — a single source of the identity so frontmatter `id` and filename can never
    // diverge. Guard it as a single-line field (an attacker must not forge/collide an id via a
    // smuggled frontmatter line).
    //
    // A caller MAY pass a precomputedId so the persisted note shares ONE identity with a record the
    // caller already composed/validated/ledgered for the SAME note (Plan 25-09's admitAndAppend keeps
    // the GOV-02 ledger `id` and the on-disk <id>.md filename consistent this way). When omitted the
    // id is generated here exactly as before — appendNote's behavior is byte-identical for every
    // existing caller (additive optional parameter).
    const id = precomputedId ?? noteId(note);
    assertSingleLine("id", id);
    const text = composeNote(note, body, id);
    const findings = validate(text);
    if (findings.length > 0) {
        throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
    }
    return { id, text };
}
// ── appendPreAdmittedNote: the ONE route that deliberately skips the admission authority. ────────
//
// NOT EXPORTED, AND THAT IS THE WHOLE POINT. `admitAndAppend` has two branches that have ALREADY
// adjudicated the note by the time they persist it, and calling the authority a second time from
// the writer would either refuse a note a human already disposed or decide the same question twice
// and append a second GOV-02 ledger event. They need a route that composes, validates and writes —
// and nothing else.
//
// A route that skips a safety check is reachable by any future in-module caller, which is exactly
// the shape the original bypass had. So it is bounded three ways rather than trusted: it carries no
// `export` modifier, its caller set is DERIVED from this file by the TypeScript AST in
// `scripts/context-io-writer-set.test.ts` and asserted equal to a one-member set, and that test
// asserts its call-site COUNT separately, so a third call site moves a number as well as a set.
//
// It takes no `repoRoot`, because it consults no governance dial: a function that admits nothing has
// no root to resolve, and a parameter it did not use would read as though it did.
function appendPreAdmittedNote(task, note, body, contextRoot, precomputedId) {
    const { id, text } = composeValidatedNote(task, note, body, precomputedId);
    // The SAME single write chokepoint (R6-1) appendNote reaches: containment is a property of the
    // write, so a traversal-bearing id can never escape the task's notes dir on this route either.
    writeNoteFile(join(contextRoot, task, "notes"), id, text);
    return id;
}
// ── appendNote: validate → compose → ADMIT → atomicWrite to a FRESH unique notes/<id>.md. ────────
// Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication.
export function appendNote(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT, precomputedId, 
// TEST SEAM (31-09, review finding WR-10). Production callers pass NOTHING: the governance root is
// the ONE trusted answer — the same reader `hooks/guard.ts`, `hooks/admission-guard.ts`,
// `scripts/admission-server.ts` and the CLI `admit` verb ask. A caller-chosen default of `ROOT`
// meant the hook refused on the host repository's dial while this writer consulted the kit's, which
// under the shipped shared-install model (`~/.grugops` kit + per-repo state) are different
// directories. Plan 30-11 removed exactly this seam from the production `admit` verb for exactly
// this reason: an admission may not point governance at a root the caller chose.
// ONE PARAMETER, TWO HALVES — AND THAT WAS THE DEFECT, NOT THE POINT (31-39, CR-27 / D-39).
// THIS BLOCK PREVIOUSLY CLAIMED THE OPPOSITE, and the claim was measured false at the round-8
// base: because `admit()` used this one root for the governance-dial read AND for the GOV-02
// append, aiming the RECORD necessarily aimed the DIAL, so `promoteAdmitted`'s fall-through —
// which correctly aims the record at its own destination — handed the caller's destination the
// power to decide whose configuration adjudicates the admission. A trusted root whose own
// configuration existed and could not be parsed, which D-14 requires a fail-closed refusal for,
// ADMITTED the write when a different, permissively-configured destination was named.
//
// SO THE TWO QUESTIONS NOW HAVE TWO PARAMETERS, and this one answers only the first.
// `repoRoot` ANSWERS THE GOVERNANCE DIAL AND NOTHING ELSE: it decides whether this note may land
// at all, and therefore decides where NOTHING lands. It stays the ONE trusted answer every tier
// asks (WR-10) — the same reader `hooks/guard.ts`, `hooks/admission-guard.ts`,
// `scripts/admission-server.ts` and the CLI `admit` verb consult. It is still a TEST SEAM
// (31-09, WR-10): production callers pass NOTHING. A caller-chosen default of `ROOT` meant the
// hook refused on the host repository's dial while this writer consulted the kit's, which under
// the shipped shared-install model (`~/.grugops` kit + per-repo state) are different directories.
repoRoot = trustedRepoRoot(), 
// …AND THIS ONE NAMES THE REPOSITORY WHOSE AUDIT TRAIL RECORDS THE ADMISSION.
//
// ITS DEFAULT IS THE OWNER OF THIS WRITER'S OWN STORE, NEVER THE DIAL ROOT. `D-31 (2)`'s rule is
// that two halves of one action key on ONE answer, and the half this writer actually performs is
// the note write into `contextRoot` — so the record follows the note by default, and a caller
// that hands this writer a `contextRoot` under one repository and a `repoRoot` under another no
// longer splits them. That is `R-31-33-01` CLOSED, by the deliberate `admit()` unfreeze
// `R-31-39-01` records.
//
// WHEN ITS OWNER CANNOT BE ANSWERED, AND A RECORD WOULD ACTUALLY BE WRITTEN, THE ADMISSION IS
// REFUSED — by `admit()`'s retention guard, which is the point of effect, with the same clause
// the re-binding route raises for the same input shape. Under the lean retention value nothing is
// recorded, so nothing is refused: see the guard's own block for why the scope is there.
ledgerOwner = actionOwnerRoot(contextRoot)) {
    const { id, text } = composeValidatedNote(task, note, body, precomputedId);
    // ── 31-09 (CR-05): the admission authority is consulted for EVERY note this writer takes. ───────
    //
    // WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED — TWICE. 31-05 wired this call for the kind a
    // verifier had measured (`artifact-ref`) and scoped it there with a comparison. `admit()` decides
    // FOUR refusal families — D-01 (a `finding` stamped `§14-gate#<id>` is admitted only against a live
    // green verdict with that per-run id), D-03 (the artifact-ref binding), D-04 (a high-severity
    // governance finding needs a named human disposition) and D-14 (an unreadable governance config
    // refuses) — and that scoped call reached D-03 alone. 31-VERIFICATION.md round 2 reproduced the
    // consequence against the committed .js: a `finding` naming `verified_by:
    // "§14-gate#fabricated-run-id"` was WRITTEN, an id returned, and `render()` printed it into
    // `index.md` as an ordinary row, indistinguishable from a genuinely admitted finding.
    //
    // THE KIND AXIS IS DELETED, NOT WIDENED. The comparison that used to sit here was a SECOND, and
    // narrower, statement of a question the authority already answers in full: which notes admission
    // applies to. Widening it to a longer list would keep the second statement and merely postpone the
    // next round — this file has now paid twice for that shape, and this phase four times across two
    // predicate families. So this writer expresses NO opinion about kind at all. The set of kinds it
    // routes is, by construction, the set `admit()` adjudicates, because it is the same call.
    //
    // THIS CALL CONTAINS NO PREDICATE OF ITS OWN. It reads no verdict, looks up no gate_run, compares
    // no stamp and consults no governance dial. It asks the single authority and refuses on its
    // findings — which is what D-03 means by one authority per predicate.
    //
    // WHY IT SITS EXACTLY HERE. After compose and validate, and BEFORE writeNoteFile. "Nothing is
    // written" is then true by construction rather than by cleanup: no file has been opened when the
    // refusal is decided. It is also why the call cannot be moved lower for convenience.
    //
    // RECURSION, CHECKED NOT ASSUMED (plan 31-09 assumption A1, RE-MEASURED on this tree rather than
    // inherited from 31-05, because `admit()` has changed since): `admit()` calls no note writer —
    // 0 occurrences of appendNote/appendPreAdmittedNote/emitTrusted/writeNoteFile/emitVerdict/
    // emitCheckpointNote/admitAndAppend in its body — so this call cannot re-enter.
    //
    // A GOV-02 LEDGER THAT CANNOT BE WRITTEN REFUSES THE WRITE (31-21, CR-12's class at the write
    // side). `admit()` appends the ledger event under `audit_retention: retained` and the append was
    // MEASURED wedging on a FIFO ledger at exit 124; it is now bounded and THROWS instead. The throw is
    // caught HERE rather than inside `admit()` on purpose: `admit()` decides whether a note is
    // ADMISSIBLE, and "can this admission be recorded" is a different question — putting it inside the
    // authority would conflate a decision about the note with a fact about the filesystem, and would
    // add a refusal family to an authority whose families are all about the note. The WRITER owns it,
    // fails CLOSED, and nothing is written: this call sits before the chokepoint.
    let admission;
    try {
        admission = admit(task, text, contextRoot, repoRoot, ledgerOwner);
    }
    catch (e) {
        throw new Error(`context-io.appendNote: refusing to write — the admission could not be decided or could not ` +
            `be recorded. ${UNRECORDABLE_ADMISSION_REFUSAL} Nothing was written. Underlying reason: ` +
            `${e.message}`);
    }
    if (admission.length > 0) {
        throw new Error(`context-io.appendNote: refusing to write a note the admission authority did not accept. ` +
            `Nothing was written:\n${admission.join("\n")}`);
    }
    // Route through the SINGLE write chokepoint (R6-1): containment is a property of the write, so a
    // traversal-bearing id can never escape the task's notes dir.
    const notesDir = join(contextRoot, task, "notes");
    writeNoteFile(notesDir, id, text);
    return id;
}
/**
 * WHY AN ENTRY IN A `notes/` DIRECTORY WAS NOT RETURNED AS A NOTE (31-29, IN-14 / R-31-21-02).
 *
 * Three different facts used to share one `catch { continue; }` and one silence. They are not the
 * same event and their operational answers differ. `31-29` split them into three arms — and then
 * hand-typed those three beside an authority that raises THREE CONDITIONS OF ITS OWN, so the split
 * stopped one register short of the facts. The arms are:
 *
 *   `unparseable`  — READER-OWNED. A file that is not a note. Ordinary: an editor backup, a stray
 *                    `.md`. No filesystem authority refuses it; this walk decides it.
 *   `unopenable`   — RAISED BY THE AUTHORITY. Present and it could not be opened at all: EACCES,
 *                    ELOOP, ENXIO. A permission bit or a socket, not a shape and not a size.
 *   `not-a-regular-file` — RAISED BY THE AUTHORITY. A position occupied by a FIFO, a device or a
 *                    directory. Somebody PUT that there; a note write never creates one.
 *   `above-ceiling` — RAISED BY THE AUTHORITY. It IS a regular file, and it is larger than
 *                    `NOTE_FILE_MAX_BYTES`. What disqualifies it is its size and nothing else.
 *   `vanished`     — READER-OWNED. Two conditions reach this arm. A file listed by `readdir` and
 *                    gone by the time it was opened — a concurrent delete — AND a DANGLING SYMLINK
 *                    at a note path, whose `open(2)` reports ENOENT for the TARGET, which this
 *                    module's one reader correctly answers as "nothing here".
 *
 * WHY THE SET IS DERIVED RATHER THAN TYPED OUT (31-33, CR-24 / D-34). The three arms `31-29`
 * published were a SECOND literal beside `READ_POSITION_CONDITIONS`, and the two disagreed while
 * both read as complete: `readRawNotesWithSkips` discarded the discriminant `D-31 (3)` created for
 * exactly that caller and hand-labelled every catch `not-a-regular-file`. Reproduced against the
 * committed `.js`: an EACCES regular file and an 8,388,609-byte regular file both rendered under
 * `not-a-regular-file`, and the second row's own detail text — "It IS a regular file; what
 * disqualifies it is its size and nothing else" — contradicted the arm it was filed under, on the
 * one artefact a human triaging an unreadable admitted note actually reads. So the arm set SPREADS
 * the authority's own constant. A sixth condition cannot arrive filed under a fifth arm's name,
 * because there is no second list for it to be absent from.
 *
 * `render` reports how many entries were skipped and under which arm, in this order.
 */
export const NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished"];
/**
 * The walk, returning BOTH what it read and what it skipped (31-29, IN-14).
 *
 * `readRawNotes` stays the notes-only view every existing caller uses, so this split adds a reader
 * rather than a second walk — the thing this module's own comment two paragraphs up forbids.
 */
function readRawNotesWithSkips(task, contextRoot) {
    assertSafeTask(task);
    const notesDir = join(contextRoot, task, "notes");
    if (!existsSync(notesDir))
        return { notes: [], skipped: [] };
    const skipped = [];
    const out = [];
    for (const file of readdirSync(notesDir)) {
        if (!file.endsWith(".md"))
            continue;
        // THE THIRD CALLER-INFLUENCED READ POSITION IN THIS MODULE (31-21, CR-12 / D-24). CR-12 named
        // the write chokepoint and the ledger look. This walk is the third: what it reads is whatever a
        // notes/ DIRECTORY lists, and a directory's contents are exactly what a caller can add a name
        // to. Measured with the first two positions already closed, a `mkfifo` at
        // `<ctx>/<task>/notes/<anything>.md` still wedged `readContext`, `render`, `currentState` AND
        // `promoteAdmitted`'s destination-liveness clause — CR-12 surviving at a position the finding
        // did not name. Closing only the two named reads would have satisfied the review and left D-24's
        // own rule false, which is the failure shape five rounds of this phase have paid for.
        //
        // THE DISPOSITION IS SKIP, AND IT IS A DECISION RATHER THAN A DEFAULT. This walk already skips a
        // file that does not PARSE rather than crashing, because one malformed file must not make a
        // whole task's context unreadable. A position occupied by a FIFO, a device or a directory is not
        // a note by that same argument, so it is skipped by the same rule. Throwing here would let one
        // planted FIFO deny `render` and `currentState` for the entire task — trading a hang for a
        // denial one register over. The WRITE side stays loud: `writeNoteFile` refuses that position BY
        // NAME, so nothing can be written over it and nothing is silently replaced. The residual — that
        // a skip is quiet on a surface whose whole value is legibility — is named in D-24.
        // THREE ARMS, EACH NAMED, EACH COUNTED (31-29, IN-14 / R-31-21-02). The disposition is still
        // SKIP — throwing would let one planted FIFO deny `render` and `currentState` for a whole task,
        // trading a hang for a denial one register over — but a skip is no longer SILENT.
        let text;
        try {
            const raw = readRegularFileOrNull(join(notesDir, file), NOTE_FILE_MAX_BYTES, "note file");
            if (raw === null) {
                // `open(2)` answered ENOENT. Two conditions reach here and the arm's docstring names both:
                // a file listed by `readdir` and deleted before it was opened, and a DANGLING SYMLINK whose
                // ENOENT is about its target.
                skipped.push({ file, arm: "vanished", detail: "" });
                continue;
            }
            text = raw;
        }
        catch (e) {
            // ── THE ARM IS READ FROM THE AUTHORITY, NEVER RE-DERIVED HERE (31-33, CR-24 / D-34). ──────
            //
            // `D-31 (3)` put the condition on the error with a stated reason: "carrying the condition on
            // the error is what lets a caller name its own clause WITHOUT re-deriving the fact." This
            // caller — the one `IN-14` was raised about — discarded it and hand-labelled all three
            // conditions `not-a-regular-file`. A caller that re-labels every condition with one arm has
            // re-derived the fact, and re-derived it WRONGLY, on the one surface whose whole stated value
            // is legibility: the row a human reads when a note that was admitted has become unreadable.
            // Reproduced before the fix — an EACCES file and an 8,388,609-byte REGULAR file both filed
            // under `not-a-regular-file`, the second row's detail contradicting its own arm.
            //
            // THE FALLBACK IS ONE EXPLICITLY NAMED ARM, not a label per catch. Anything reaching here
            // that is not a `ReadPositionRefusal` — an EIO from `fstat`, an allocation failure — is a
            // position that could not be opened or read as far as this walk is concerned, which is what
            // `unopenable` means. Naming it once is the difference between a fallback and a second
            // classifier.
            const arm = e instanceof ReadPositionRefusal ? e.condition : "unopenable";
            skipped.push({ file, arm, detail: e.message });
            continue;
        }
        const parsed = parseNote(text);
        if (!parsed) {
            // A file that is never a note — an editor backup, a stray `.md`. One malformed file must not
            // make a whole task's context unreadable, so it is skipped rather than thrown on.
            skipped.push({ file, arm: "unparseable", detail: "" });
            continue;
        }
        // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
        // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
        // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
        // wins for the read and the divergence is left for validate() to surface on the explicit path.
        const fileId = file.replace(/\.md$/, "");
        const s = parsed.scalars;
        out.push({ id: s.id && s.id !== "" ? s.id : fileId, text, parsed });
    }
    return { notes: out, skipped };
}
/** The notes-only view. Every existing caller reads this; the skips have their own reader. */
function readRawNotes(task, contextRoot) {
    return readRawNotesWithSkips(task, contextRoot).notes;
}
// ── recordFromParsed: the store's own read-back PROJECTION of a parsed note. ────────────────────
// One projection, so "what the store reads back" has a single answer that both `readContext` and
// the re-binding proof below consult.
function recordFromParsed(parsed, id) {
    const s = parsed.scalars;
    return {
        id,
        kind: s.kind ?? "",
        by: s.by ?? "",
        at: s.at ?? "",
        verified_by: s.verified_by ?? "",
        confidence: s.confidence ?? "",
        refs: parsed.refs,
        supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
        // The evidence-provenance projection (Phase 31). parseNote's open scalar map already ACCEPTS
        // these keys, so no parser change was needed — but a scalar the parser accepted and this
        // projection dropped is a scalar admit() cannot read, and admit()'s D-03 branch reads the
        // matched verdict's `sha` through exactly this record. Absent stays `undefined` rather than
        // "" so "the verdict recorded no SHA" and "the verdict recorded an empty SHA" are one case
        // for the refusal below to name.
        sha: s.sha ?? undefined,
        gate_run: s.gate_run ?? undefined,
        content_hash: s.content_hash ?? undefined,
        body: parsed.body.trim(),
    };
}
// ── readContext: parse every notes/<id>.md into a NoteRecord[] (id from the filename). ──────────
export function readContext(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    return readRawNotes(task, contextRoot).map((raw) => recordFromParsed(raw.parsed, raw.id));
}
// ── currentState: deterministic replay (SCTX-04). Sort by at (ISO lexicographic) with note-id ──
// tiebreak; fold out any note whose id appears in another note's supersedes. NEVER file position
// or mtime.
export function currentState(notes) {
    const ordered = [...notes].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
    const superseded = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
    return ordered.filter((n) => !superseded.has(n.id));
}
/**
 * The answered owner of a root this module ALREADY TRUSTS — a constructor, never a resolver.
 *
 * IT IS MODULE-PRIVATE, AND THAT IS THE WHOLE OF ITS SAFETY. It answers `answered` for whatever it
 * is handed, so it is NOT an answer to "which repository owns this store" and must never be used as
 * one. Its single caller is `admit()`'s ledger-owner DEFAULT, where the value is the governance
 * dial root the caller already established — so the default reproduces the pre-31-39 behaviour
 * exactly and every three- and four-argument caller is byte-behaviour-unchanged.
 *
 * IT EXISTS RATHER THAN AN INLINE OBJECT LITERAL FOR A MEASURED REASON. Spelling the default as
 * `{ answered: true, root: repoRoot }` put a brace in `admit()`'s PARAMETER LIST, and
 * `ADMIT_FROZEN_SHA256`'s extraction takes the first `{` after the declaration and brace-counts
 * from there. Measured on this tree before it was fixed: the frozen span collapsed from 12,394
 * bytes of function BODY to 1,885 bytes of parameter list, and the freeze would have re-locked on a
 * span that no longer contained a single one of the four refusal families it exists to pin. The
 * extraction is hardened in `scripts/context-io.test.ts` as well — both halves, because either
 * alone leaves the other free to reintroduce it.
 */
function answeredOwner(root) {
    return { answered: true, root };
}
/** The ONE answer. It adds no rule of its own; `governanceRootOf` decides, this shapes. */
export function actionOwnerRoot(contextRoot) {
    const root = governanceRootOf(contextRoot);
    if (root === null)
        return { answered: false, store: contextRoot };
    return { answered: true, root };
}
/**
 * The ONE clause name for "the repository that owns this action cannot be named".
 *
 * IT IS THE SAME CLAUSE THE RE-BINDING ROUTE ALREADY RAISES, deliberately: the two write-both
 * routes answer one input shape, so they name one clause. `PROMOTE_ADMITTED_DECLINES` keys off
 * this constant rather than repeating the literal, and the derived clause axis in
 * `scripts/context-io-writer-set.test.ts` asserts the register's key set equal to the keys parsed
 * out of the route's own body in BOTH directions — so this constant drifting from the literal at
 * the throw site turns that axis red rather than producing two silently different spellings.
 */
export const UNNAMEABLE_OWNER_CLAUSE = "destination-outside-governed-store";
/**
 * The ONE refusal sentence body for an unnameable owner, emitted by every route that would
 * otherwise write a GOV-02 record into a repository it cannot name.
 *
 * Both write-both routes consume THIS, so they cannot drift into two spellings of one refusal: the
 * re-binding route reaches it through `declineRebinding`'s register lookup and the admit-and-append
 * route returns it directly, and both therefore carry the clause name AND the register's written
 * reason.
 */
export function unnameableOwnerRefusal(store) {
    return (`admission REFUSED (${UNNAMEABLE_OWNER_CLAUSE}): the context store "${resolve(store)}" does ` +
        `not resolve to a governed store, so the repository whose audit trail would record this ` +
        `admission cannot be named. No note was written. ` +
        PROMOTE_ADMITTED_DECLINES[UNNAMEABLE_OWNER_CLAUSE]);
}
// 31-14 (D-19) — promotion of an ALREADY-ADMITTED note is a RE-BINDING, decided by a PROOF.
//
// THE GAP THIS CLOSES, MEASURED RATHER THAN DESCRIBED. 31-09 made `appendNote` consult the
// admission authority unconditionally — right, and D-01's evidence floor depends on it. But
// `compactor.promote` is a thin pass-through to that writer, and Workflow 18 names it as the ONLY
// prescribed route for carrying a note forward through compaction. So a note a human already
// legitimately disposed at the ORIGIN — written through `admitAndAppend`'s gated, pre-admitted
// branch, disposed by the un-forgeable per-call admission-guard hook — was REFUSED, unchanged, at
// the DESTINATION by `admit()`'s frozen D-04 arm, for the same structural reason that branch skips
// the authority in the first place: this tier cannot verify a self-authored `human:NAME` stamp.
// Reproduced by the round-3 verifier and re-reproduced by plan 31-14 against the committed `.js`:
// the origin write returned an id, the identical promotion threw D-04's refusal, zero notes landed.
//
// WHAT THIS ROUTE CARRIES FORWARD, AND WHAT IT DOES NOT. It carries forward ONLY the
// human-disposition binding the frozen arm is structurally unable to verify, and it carries forward
// NOTHING ELSE. A promoted finding whose stamp is a `§14-gate#<id>` stamp, and a promoted
// `artifact-ref`, are NOT this route's business: they fall through to full admission and are
// re-bound at the destination against a live green verdict THERE, exactly as before. D-01, D-02 and
// D-03 are untouched at the destination.
//
// A PROOF OVER BYTES, NEVER A FLAG. There is no "already admitted" parameter, option or flag — an
// agent-settable one would be the elevation this whole mechanism exists to prevent (T-31-14-01), and
// no parameter added later may widen what the proof trusts. That part of this paragraph was true
// when 31-14 wrote it and is still true.
//
// WHAT THE PROOF IS OVER, STATED AS THE CODE HAS IT (31-18, WR-17). The round-4 reviewer measured
// the rest of this paragraph as untrue of the mechanism, and was right: the left operand was
// `readRawNotes(task, from)` with `from` an ordinary unconstrained argument, so a caller that
// authored a directory and named it produced any proof it wanted — the functional equivalent of the
// flag the sentence above refused. The operand is now constrained. It must resolve inside a location
// this module has independent reason to trust, and that location has exactly ONE recognised
// CANONICAL FORM: a directory the module RECOGNISES as a grugops context store —
// `<X>/.grugops/context`, the shape `DEFAULT_CONTEXT_ROOT` names and the only shape the sanctioned
// writers create — whose `<X>` this module's OWN root walk independently answers as a governance
// root. Inside such a location the proof is what it always was: the named source note is LIVE in the
// origin's deterministic replay, and the promoted input recomposes to exactly the record the store
// reads back there. A caller that cannot produce that proof, or that names an origin outside that
// one form, is DECLINED BY NAME — including an origin inside this repository.
//
// ── D-25 (2026-09-09, gap-closure round 5, plan 31-22) — a DATED SUB-DECISION beside D-22. ───
//
// D-25 leaves D-01 through D-24 untouched. Round 5 found two things about this route, both
// reproduced against the committed `.js` before any change:
//
//   CR-16 — the operand constraint D-22 introduced was a DISJUNCTION whose second arm accepted any
//     directory under `trustedRepoRoot()`. Closed below: one arm, two conjuncts, the root-proximity
//     arm DELETED. The residual `T-31-18-01` is rewritten and PRICED; `R-31-22-01` states what the
//     narrowing cost and `R-31-22-02` decides the converse destination axis.
//   WR-25 — `origin-outside-trusted-store` was evaluated AFTER
//     `human-stamp-not-gated-at-destination`, so a caller naming a forged origin under the lean
//     posture was told the destination's DIAL was the problem, and the workflow's remedy for that
//     clause is to WIDEN the dial. Closed by moving exactly one clause: the CALLER'S INPUT is named
//     before the caller's ENVIRONMENT. `unreadable-governance-config` stays above both because a
//     dial that cannot be read is a fail-closed precondition, not an ordering preference. The order
//     is now a DERIVED axis (PART SIX-H) with a transposed watched-fail mirror.
//
// Recorded in three places that must agree: here, in `31-CONTEXT.md` beside D-24, and in
// `31-22-SUMMARY.md`'s key-decisions block.
//
// ── 31-22 (CR-16) — WHY THE SECOND ARM IS GONE RATHER THAN NARROWED. ──────────────────────────
//
// Round 4 left the recognition as a DISJUNCTION: the shape, OR a path at or under
// `trustedRepoRoot()`. The agent that calls this route RUNS INSIDE the repository, so every
// directory it can create satisfied the second arm. The round-5 verifier measured it: legitimately
// obtained, human-disposed note bytes COPIED into an ordinary directory under the repository root
// and promoted into a fresh destination id returned the id, threw nothing, left the destination
// holding the file, and appended a `disposed_by` GOV-02 event. That is verbatim the action
// `agent-factory/workflows/18-context-compaction.md` tells the agent is mechanically refused.
//
// And deleting the arm is NOT by itself enough, which was measured before it was deleted.
// `isRecognisedContextStore` is a two-component basename test, so
// `<proj>/tmp/forged/.grugops/context` is a recognised origin — the same caller, the same bytes, one
// `mkdir -p` further on. Driven against a scratch shape-only implementation, it promoted. So the
// surviving rule is a CONJUNCTION, and the second conjunct is what makes the workflow's stop
// condition true as written rather than narrowed to match a spelling test.
//
// WHY THE CONSTRAINT IS SHAPE-AND-ANCHORING AND NOT A REGISTRY, AND WHAT THAT COSTS. A
// cross-repository compaction — an origin in one checkout, a destination in another — is a promotion
// a host genuinely performs, and Workflow 18 names the origin context root as a caller-supplied
// argument for exactly that reason. Requiring the origin to be the DESTINATION's own store would
// refuse it, and so would requiring it to be the PROCESS's own root. So the recognition is by shape
// conjoined with an independently-resolved root, and what that leaves open is written down rather
// than waved away, PRICED in operations rather than in adjectives: `T-31-18-01` in the residual
// register below states its price per position, each operation proven load-bearing by subtraction,
// with what would force it closed. `R-31-22-01` states what the narrowing COST, and `R-31-22-02`
// states the converse destination axis this route deliberately does not constrain.
//
// THE LEDGER BEHAVIOUR IS DECIDED, NOT INHERITED (D-19). A re-binding is not a new admission, so it
// appends NO GOV-02 audit event: the origin's event already records the named human's disposition
// FOR THIS EXACT ID (the frozen id is carried forward), and a second line keyed by the same id would
// be a duplicate — the shape 31-09 collapsed rather than widened. Measured by a retained-mode case
// rather than assumed.
//
// ── D-22 (2026-09-09, gap-closure round 4 wave 3, plan 31-18) — a DATED SUB-DECISION of D-19. ──
//
// D-22 extends D-19 (2), (3) and (4) and edits none of them. Round 4 found three things about this
// route, all reproduced against the committed `.js` before any change:
//
//   CR-11 — it took its write id from `sourceId`, an ARGUMENT, and read nothing at the destination,
//     so a promotion silently REPLACED an already-admitted note. Closed at the POINT OF EFFECT: the
//     write chokepoint refuses a write onto an id whose destination bytes differ, so the class closes
//     for every writer; identical bytes are the DECIDED idempotent re-promotion and proceed as a
//     no-op; and this route ALSO declines `destination-id-occupied` by name, before the chokepoint.
//   WR-17 — the proof's left operand was an unconstrained caller-supplied path. Closed above: the
//     origin must resolve inside a location this module has independent reason to trust, with
//     `T-31-18-01` naming what shape-based recognition still leaves open.
//   WR-18 — the governance configuration was read for READABILITY and never for its VALUE, so this
//     route carried a `human:NAME` stamp forward under a dial `admitAndAppend` refuses the identical
//     note under. Closed by asking `isGatedNote` — the ONE gated authority, never a second local
//     composition — and by turning D-19 (4)'s no-ledger premise into a LOOK at the destination
//     repository's own ledger: nothing appended when the id is already recorded, one event marked
//     `re_bound: true` when it is not.
//
// Recorded in three places that must agree: here, in `31-CONTEXT.md` beside D-19, and in
// `31-18-SUMMARY.md`'s key-decisions block.
//
// NAMED RESIDUAL (T-31-14-03, disposition `accept`). The origin `notes/` directory is trusted here
// exactly as far as every other reader of it is trusted: a note hand-written into that directory and
// then promoted is a tampering this route does not close. Workflows 16 and 18 forbid hand-authoring a
// context path, and the un-forgeable tier remains the per-call admission-guard hook. Recorded as a
// residual with its reason rather than left as a silence.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
/**
 * Every shape the re-binding proof DECLINES, each with the written reason it declines it.
 *
 * THE SINGLE SOURCE OF THE DECLINE TEXT. The route below never spells a reason inline: it names a
 * clause key and this record supplies the sentence, so the register cannot drift from the code that
 * uses it. `scripts/context-io-writer-set.test.ts` DERIVES the clause keys from this function's own
 * parsed body and asserts them equal to this record's key set in BOTH directions — no derived clause
 * without a register entry, and no register entry naming a clause the route no longer has.
 */
export const PROMOTE_ADMITTED_DECLINES = Object.freeze({
    "empty-source-id": "A re-binding names the note it re-binds. An empty or blank source id names nothing, so there " +
        "is no origin record to prove anything against and the promotion is not a re-binding at all.",
    "unreadable-governance-config": "The governance configuration exists at a standard location and could not be read or parsed, so " +
        "the human_admission dial is UNKNOWN (D-14). This route skips only the human-stamp arm the " +
        "in-script tier cannot verify — never the authority itself — so an unknowable dial fails closed " +
        "here exactly as it does in admit(). A genuinely ABSENT config is a different case and runs lean.",
    "no-such-origin-note": "No note with the named id exists in the origin context under this task. The proof's left " +
        "operand is the origin's own stored bytes; with no such note there is nothing that was ever " +
        "admitted, and the promotion is a NEW admission that must take the full-admission route.",
    "origin-note-not-live": "The named origin note exists but is not LIVE in the origin's deterministic replay — another " +
        "note supersedes it. A superseded disposition is one a later note withdrew, and carrying it " +
        "forward would re-admit a decision the origin context has already folded out.",
    "field-differs-from-origin": "A load-bearing field of the promoted note differs from the origin record the id names. A " +
        "re-binding is a FAITHFUL carry-forward; a note whose provenance changed is a new note, and a " +
        "new note is a new admission.",
    "body-differs-from-origin": "The promoted body differs from the origin record's. A compaction that CHANGED the note is not " +
        "a re-binding — it is a new admission, decided by the full authority at the destination, and " +
        "honestly degraded when its stamp no longer cross-checks (Workflow 18 step 6).",
    "human-stamp-not-gated-at-destination": "The destination's governance dial does not gate this note, so a human:NAME disposition is not " +
        "meaningful on it and accepting one would forge a disposed_by audit record — the identical " +
        "ground admitAndAppend's W3 arm refuses the same note on. A re-binding carries forward the one " +
        "binding the in-script tier cannot verify; where the destination gates nothing there is no such " +
        "binding to carry, and the note is an ordinary new admission that must take the full-admission " +
        "route with an empty or §14-gate stamp.",
    "origin-outside-trusted-store": "The named origin does not resolve inside the ONE location shape this module has independent " +
        "reason to trust: a directory named `context` inside a directory named `.grugops`, sitting " +
        "directly under a directory this module's own root walk independently answers as a governance " +
        "root. The proof's left operand is the origin's stored bytes, so an ordinary directory a caller " +
        "authored and named would let that caller supply the very bytes its own write is judged " +
        "against: a flag wearing a filesystem path. Proximity to the root the CALLER is already running " +
        "inside is not evidence — the agent that promotes runs inside the repository, so every " +
        "directory it can create would satisfy such a rule, which is why the shape must be anchored to " +
        "a root this module resolves for itself rather than to one the caller happens to stand in.",
    "destination-id-occupied": "The destination already holds a DIFFERENT note under this id. The shared verified context is " +
        "APPEND-ONLY: a supersession is a NEW note, never a rewrite of an existing one, and a promotion " +
        "that replaced a note would delete admitted evidence from the permanent audit trail rather " +
        "than supersede it. Destination bytes IDENTICAL to the proven origin bytes are a different " +
        "case and are decided as an idempotent re-promotion that proceeds — a re-run compaction has " +
        "nothing to destroy — so this clause names only the destructive one.",
    [UNNAMEABLE_OWNER_CLAUSE]: "The destination does not resolve to a store this module recognises as belonging to a " +
        "governance root — the same canonical form the origin must meet: a directory named `context` " +
        "inside a directory named `.grugops`, sitting directly under a directory this module's own " +
        "root walk independently answers as a governance root. The constraint is not about trusting " +
        "the destination's CONTENTS, which no promotion reads as evidence. It is about naming the " +
        "repository whose audit trail records the promotion. A note and its GOV-02 event are two " +
        "halves of one action, and until this clause existed they were keyed on two different " +
        "arguments: a finding landed in one repository's note store while its audit record landed in " +
        "another's ledger, under a workflow sentence stating twice that it cannot happen. A store " +
        "whose owning repository cannot be resolved is a store whose audit trail cannot be named, and " +
        "a human disposition entering an unnameable trail is a repudiation waiting to be discovered. " +
        "The alternative — promote anyway and record nothing — is REJECTED: it would make the " +
        "workflow's guarantee true by weakening it.",
    "unreadable-audit-ledger": "The destination repository's GOV-02 audit ledger IS present and could not be read — it is not " +
        "a regular file, or it could not be opened at all. An audit trail this route cannot read is an " +
        "audit trail it cannot avoid duplicating: the route's response to \"no record\" is to APPEND, so " +
        "answering \"no record\" for a ledger nobody could read would manufacture a second event keyed " +
        "on one id — the duplicate 31-09 collapsed and the reason D-19 (4) appends nothing when the id " +
        "is already there. Absent and unreadable are different facts with different safe answers: an " +
        "absent ledger honestly records nothing, while an unknowable one is refused rather than guessed " +
        "about. The refusal is decided BEFORE the note is written, and the position is named.",
});
/**
 * Named residuals of this route: trust boundaries it does NOT close, each with its reason.
 * Published beside the declines so a boundary nobody wrote down cannot become the next round's gap.
 */
export const PROMOTE_ADMITTED_RESIDUALS = Object.freeze([
    "T-31-14-03 — a note HAND-WRITTEN into the origin notes/ directory and then promoted is not " +
        "detected. The origin store is trusted here exactly as far as every other reader trusts it; " +
        "workflows 16 and 18 forbid hand-authoring a context path, and the un-forgeable tier remains " +
        "the per-call admission-guard hook. Disposition: accept.",
    "T-31-18-01 — the origin store is recognised by its SHAPE (a directory named `context` inside a " +
        "directory named `.grugops`) CONJOINED with ROOT ANCHORING (that `.grugops` directory sits " +
        "directly under a directory this module's own walk independently answers as a governance root), " +
        "never by a registry. A caller that constructs a whole GOVERNANCE ROOT around notes it authored " +
        "— a version-control marker, a governance configuration beneath it, and the `.grugops/context` " +
        "store — still presents a store this route accepts. The price is stated PER POSITION, because " +
        "it was measured rather than assumed — and CORRECTED by plan 31-29 (WR-28), which measured a " +
        "THIRD position the previous two-way split hid. The three constructions are `mkdir " +
        "<forged>/.git`; write `<forged>/.grugops/factory.config.json`; `mkdir -p " +
        "<forged>/.grugops/context`. INSIDE a repository that carries a governance CONFIGURATION it is " +
        "THREE filesystem operations: each of the three is load-bearing there and both subtractions are " +
        "driven: without the configuration the walk answers `nearest` (null) rather than the forged " +
        "root, and without the marker the walk climbs past and answers the REPOSITORY's own root. " +
        "INSIDE a repository that carries a marker and NO configuration it is TWO — the configuration " +
        "and the store — because the enclosing boundary carries no configuration, so the walk answers " +
        "`nearest` (the forged configuration) with the forged marker ABSENT. The variable is the " +
        "ENCLOSING repository's configuration, not the fact of being inside one, and the previous " +
        "wording — three inside a repository — was measured FALSE at this position. " +
        "OUTSIDE every repository it is TWO operations — the configuration and the store — because the " +
        "walk that meets no boundary at all answers the nearest configuration it remembered, which is " +
        "the forged one. Those second and third numbers are the cross-repository capability this " +
        "residual keeps, priced in the same breath rather than left for a later round to discover. All " +
        "three positions are driven in scripts/context-io.test.ts. The capability is " +
        "KEPT deliberately: a cross-repository compaction is a " +
        "promotion a host genuinely performs, and Workflow 18 names the origin context root as an " +
        "argument for exactly that reason. What it costs is bounded by, and identical to, T-31-14-03 — " +
        "this route trusts what a recognised, root-anchored store CONTAINS. What would force it closed: " +
        "a store marker the sanctioned writer emits and this route verifies, or an explicit registry of " +
        "origin stores a caller cannot author. Disposition: accept.",
    "R-31-22-01 — the anchoring conjunct asks this module's own root walk, and that walk answers " +
        "`nearest` at a repository boundary carrying NO governance configuration. So a checkout that " +
        "has a `.grugops/context` store and no `factory.config.json` under it is refused as an ORIGIN, " +
        "where the deleted root-proximity rule accepted it by shape alone. The cost is bounded by what " +
        "the installer does: `install.js` seeds `.grugops/factory.config.json` into every target it " +
        "touches, so this reaches only a repository whose store was created by the minimal " +
        "markdown-copy path with no configuration ever written. Measured, not inferred — the case is " +
        "driven in scripts/context-io.test.ts. What would force it closed: anchoring on a repository " +
        "BOUNDARY MARKER alone, which would drop the price of a forged origin from three operations to " +
        "two and is therefore refused. Disposition: accept, as the stated cost of pricing the residual " +
        "at three operations rather than one.",
    "R-31-22-03 — the recognition rule is LEXICAL and CASE-SENSITIVE, and both halves of that are " +
        "decided rather than accidental. `resolve()` normalises `.` and `..` segments and a trailing " +
        "separator, so those spellings answer the same as the plain path — driven. It does NOT follow " +
        "symlinks, so the rule reads the LINK'S OWN location: a symlink at `<root>/.grugops/context` is " +
        "accepted for where it sits, whatever it points at, and a symlink whose text has the shape " +
        "under an UNANCHORED directory is refused. Accepting the first is not a new capability. " +
        "Planting that link requires write access to a real governance root's own `.grugops/` " +
        "directory, which is the same authority as writing a note into its `notes/` — the standing " +
        "T-31-14-03 residual, one indirection over — and Workflow 16 forbids hand-authoring a context " +
        "path. The case sensitivity runs the OTHER way and is the safe direction: `<root>/.GRUGOPS/" +
        "context` is refused by name even on a case-insensitive filesystem where it names the same " +
        "directory, so a legitimate-looking spelling is refused rather than a forged one accepted. What " +
        "would force the symlink half closed: comparing `realpathSync` rather than `resolve`, which " +
        "would also refuse a store legitimately delivered by a symlink and is therefore a module-wide " +
        "decision about every context root rather than this route's. Disposition: accept, bounded by " +
        "T-31-14-03.",
    "R-31-22-02 — REWRITTEN by plan 31-29 (CR-20 / D-31); the id is KEPT so existing citations " +
        "resolve to the current disposition rather than to a superseded one. WHAT IT SAID: that the " +
        "DESTINATION argument `to` was caller-supplied and NOT constrained by the canonical form the " +
        "origin must meet, accepted on the reasoning that `to` is not a proof OPERAND. That reasoning " +
        "was correct about EVIDENCE and silent about IDENTITY, and the round-6 verifier exploited the " +
        "gap between them: nothing read at the destination is evidence for the promotion, but the " +
        "destination still decides WHICH REPOSITORY'S AUDIT TRAIL records it, and that question had a " +
        "second answer (`repoRoot`) which nothing reconciled. Measured with three real governance " +
        "roots, the note landed in one repository and its GOV-02 event in another. WHAT THE " +
        "CONSTRAINT IS NOW: `to` must resolve, through the one authority `governanceRootOf`, to a " +
        "recognised store anchored to a governance root — D-25's canonical form, asked of the " +
        "destination as well as the origin — and the derived root keys BOTH the ledger look and the " +
        "ledger append. A `to` outside a governed store is the named `destination-outside-governed-" +
        "store` decline, raised before anything is written. WHAT IT STILL DOES NOT ESTABLISH: the " +
        "constraint names the destination's owning REPOSITORY; it does not authenticate the " +
        "destination's CONTENTS, and a caller who can construct a governance root can present a " +
        "destination this route accepts — at the same price, and bounded by the same residual, as " +
        "T-31-18-01 states for the origin. It is also NOT asked of every other writer's `contextRoot`: " +
        "`appendNote` still accepts any destination, so this is a property of the RE-BINDING route " +
        "rather than of the module, and a promotion is where it matters because a promotion is what " +
        "carries a human disposition across a repository boundary. WHAT WOULD FORCE THE REMAINDER " +
        "CLOSED: the same store marker T-31-18-01 names — one the sanctioned writer emits and this " +
        "route verifies — which would close the origin and destination halves together. Disposition: " +
        "the IDENTITY half is CLOSED by D-31; the CONTENTS half is accepted, bounded by T-31-18-01 and " +
        "by the append-only chokepoint that refuses a destructive write at any destination.",
    "R-37 — the compared field set is the store's own read-back projection (recordFromParsed) plus " +
        "the body. A frontmatter key the parser accepts and that projection drops is not compared — and " +
        "is also not read by admit(), render() or any other consumer, so the boundary is the store's " +
        "view of a note rather than this route's. Disposition: accept, bounded by that projection.",
]);
/**
 * THE WRITE PATH'S RESIDUALS, EXPORTED (31-29, R-31-21-04 / D-31).
 *
 * WHY THIS REGISTER EXISTS AT ALL. Round 5's own closing measurement recorded the asymmetry: the
 * four `R-31-21-*` residuals lived ONLY in `31-CONTEXT.md` prose and in two incidental string
 * occurrences, bound by no test — while `TRUSTED_ROOT_RESIDUALS` and `PROMOTE_ADMITTED_RESIDUALS`
 * each carry a two-sided binding. A residual a test cannot read is a residual that ships quietly
 * when somebody adds a fifth one, or deletes a disposition and leaves the id cited.
 *
 * The binding is the SAME two-sided one the other registers have — the written dispositions in
 * `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` asserted set-equal to this array in
 * BOTH directions, plus an asserted cardinality — so an undispositioned member turns a test red
 * rather than shipping.
 */
export const WRITE_PATH_RESIDUALS = Object.freeze([
    Object.freeze({
        id: "R-31-21-01",
        shape: "`atomicWrite`'s `writeFileSync` is a blocking-capable call this module still makes.",
        reason: "It is NOT AIMABLE, and that is the whole disposition: the destination carries a random UUID " +
            "no caller can predict and therefore no caller can pre-occupy, and the subsequent " +
            "`renameSync` REPLACES the final path rather than opening it — rename does not block on a " +
            "FIFO. What protects the final path is not this call but `writeNoteFile`'s append-only " +
            "refusal one frame up. A caller who can WATCH the temp name appear and win the race between " +
            "the write and the rename is already a same-uid direct-filesystem actor, which is the " +
            "standing T-31-25 residual this module does not close and does not claim to. " +
            "DISPOSITION (plan 31-29): CLOSE — accepted by design, an unaimable destination.",
        what_would_force_it_closed: "Nothing short of removing the temp-then-rename idiom, which would cost the atomicity the " +
            "idiom exists for. The race is bounded by same-uid filesystem access, which is T-31-25.",
    }),
    Object.freeze({
        id: "R-31-21-02",
        shape: "A non-regular file planted INSIDE a `notes/` directory is SKIPPED by the directory walk " +
            "rather than refused loudly.",
        reason: "The SKIP is unchanged and is still the right disposition: throwing would let one planted " +
            "FIFO deny `render` and `currentState` for an entire task, trading a hang for a denial one " +
            "register over, and the write side stays loud because the chokepoint refuses that position " +
            "BY NAME. What round 5 recorded as the cost — that the skip is quiet on a surface whose " +
            "whole value is legibility — is what plan 31-29 CLOSED. The single `catch { continue; }` " +
            "covered three different facts with one silence: a file that never was a note, a position " +
            "occupied by something that is not a regular file, and a note that vanished between the " +
            "listing and the read. Measured before the fix, all three produced a zero-length read, zero " +
            "rendered rows and no diagnostic of any kind. They are now three NAMED arms " +
            "(`NOTE_SKIP_ARMS`), the skipped entries are COUNTED, and `render` reports the count and the " +
            "arm breakdown. DISPOSITION (plan 31-29): the LEGIBILITY half is CLOSED; the SKIP itself is " +
            "accepted by design and is now a reported skip rather than a silent one.",
        what_would_force_it_closed: "The skip is deliberate and will not be closed. What remains is that a reader who never " +
            "looks at `index.md` still learns nothing — a surfacing question for the workflows rather " +
            "than for this module.",
    }),
    Object.freeze({
        id: "R-31-21-03",
        shape: "Plan 31-21's own stated premise — that `appendFileSync` to a FIFO exits 0 immediately and " +
            "silently discards the GOV-02 event — was FALSE on this tree.",
        reason: "Recorded as a residual by round 5 and CLOSED in the same round rather than carried. " +
            "`appendFileSync` opens for WRITING, and opening a FIFO for writing BLOCKS until a reader " +
            "appears: `timeout 10` produced exit 124 through BOTH `admit` and `admitAndAppend`, which " +
            "is a fourth blocking position in CR-12's class reachable from two routes that consult no " +
            "ledger and therefore inherit no read-side refusal. `appendRegularFileLine` replaced it, a " +
            "FIFO now fails ENXIO in bounded time, and an admission that cannot be recorded under " +
            "`retained` is REFUSED rather than granted unrecorded. " +
            "DISPOSITION (plan 31-29): CLOSED by plan 31-21, recorded here so the id resolves to its " +
            "measurement rather than to a gap.",
        what_would_force_it_closed: "Already closed. The measurement that closed it is the FIFO corpus in " +
            "scripts/context-io.test.ts, driven in a subprocess where a hang is a timeout.",
    }),
    Object.freeze({
        id: "R-31-21-04",
        shape: "The derivations behind the write-path axes are SYNTACTIC: they resolve a call by " +
            "identifier, and the order axis excludes a note write that is the whole expression of a " +
            "`return` statement.",
        reason: "NARROWED by plan 31-29 on its SCOPE half, and accepted on the rest. The scope half was a " +
            "real defect, not a stated boundary: `deriveFsBlockingSites` descended only into TOP-LEVEL " +
            "function declarations, so a blocking call inside an arrow, a class method or the CLI entry " +
            "block left the count unmoved and every assertion green — while the axis's own comment " +
            "claimed a new call ANYWHERE in the module turned it red (WR-27). The walk now starts at the " +
            "SourceFile and attributes each site to its nearest named enclosing scope, with three seeded " +
            "mirrors, one per shape, each moving the count by exactly one. The ALIAS and COMPUTED-MEMBER " +
            "half is KEPT: widening a matcher once per counter-example is the failure this repository " +
            "has paid for repeatedly, so the boundary is written down and watched BEHAVIOURALLY by the " +
            "FIFO corpus and the per-member transposed mirrors. The tail-delegation exclusion is a " +
            "DECISION rather than a limit — such a call returns before any ledger work in that function " +
            "happens, so counting it would compare two steps that never run together. " +
            "DISPOSITION (plan 31-29): the SCOPE half is CLOSED; the alias and computed-member half is " +
            "accepted, bounded by the behavioural corpus.",
        what_would_force_it_closed: "A type-checker-backed resolution rather than a syntactic one, which is the S2 cutover plan " +
            "31-28 landed for the modifier ban (D-30). Applying it here is a later decision, and it is " +
            "named rather than assumed: OWNER is the next milestone, not this phase.",
    }),
    Object.freeze({
        id: "R-31-29-01",
        shape: "The note ceiling and the ledger ceiling are enforced on both sides, and neither is " +
            "enforced against a note that is already ON DISK above the ceiling.",
        reason: "The NEW residual this round leaves, recorded rather than discovered next round. A note " +
            "written before this plan — or by a direct-filesystem actor — can sit at a note path above " +
            "`NOTE_FILE_MAX_BYTES`. Every reader refuses it, which is correct and is now REPORTED as a " +
            "`above-ceiling` skip arm with its byte count rather than as a silence — that arm was " +
            "`not-a-regular-file` until 31-33 corrected it (CR-24), which is the condition that is " +
            "actually true of an over-ceiling REGULAR file — and the write " +
            "side refuses to replace it under its own honest clause. What this module does NOT do is " +
            "delete or rotate it: the shared verified context is APPEND-ONLY, and a writer that removed " +
            "an over-ceiling note would be destroying evidence to tidy a listing. " +
            "DISPOSITION (plan 31-29): accept. The condition is legible at every surface and destructive " +
            "remedies are refused by design.",
        what_would_force_it_closed: "An operator-run rotation tool that archives an over-ceiling note rather than deleting it. " +
            "It belongs outside this module, because a tool that removes notes is not a note writer.",
    }),
    Object.freeze({
        id: "R-31-33-01",
        shape: "The repository whose audit trail records an admission is a PARAMETER of every write-path " +
            "entry point. Its DEFAULT is derived from the store the note lands in, so the two halves of " +
            "one action follow each other with no argument supplied — and a direct caller that supplies " +
            "that argument EXPLICITLY still lands the note in one repository and its GOV-02 record in " +
            "another.",
        reason: "TWO HALVES UNDER ONE ID, EACH WITH ITS OWN MEASUREMENT (plan 31-41, WR-39's class). The id " +
            "is KEPT rather than retired because prior documents, summaries and two cases cite it, and " +
            "renaming it would orphan those citations. " +
            "THE CLOSED HALF. The two shapes this entry's ORIGINAL text named are closed, each read off " +
            "disk in three roots rather than argued: `appendNote` with store = HOME and dial = ELSEWHERE lands " +
            "`{notes:1, ledger:1}` in HOME and `{notes:0, ledger:ABSENT}` in ELSEWHERE, and " +
            "`admitAndAppend`'s non-gated branch reads the same way. " +
            "WHAT REMAINS, WITH ITS OWN REPRODUCTION. Separating the dial from the record is what closed " +
            "those two, and it COST a new degree of freedom: `appendNote` grew a seventh parameter and " +
            "`admit()` a fifth, and a parameter is a value a caller may supply. Measured on this tree: " +
            "`appendNote` with store = H2, dial = H2 and an explicit ledger owner naming E2 lands `{notes:1, " +
            "ledger:ABSENT}` in H2 and `{notes:0, ledger:1}` in E2. The freedom is not silent — the " +
            "`31-40` census reads the ledger argument position and a new site supplying it divergently " +
            "must earn a `ROOT_DIVERGENCE_DISPOSITIONS` entry — but it is a freedom, and it is named here " +
            "rather than inherited by implication from the closed half. " +
            "DISPOSITION (plan 31-41): the DEFAULT-SPLIT half is CLOSED; the EXPLICIT-ARGUMENT half is " +
            "accepted, bounded by the census that enumerates the sites that could exhibit it. " +
            "THE CLOSURE ITSELF, AS PLAN 31-39 RECORDED IT: " +
            "CLOSED by plan 31-39 (CR-27 / D-39), and the closure is recorded here rather than left as a " +
            "register entry that over-states a boundary the module no longer has. `admit()` was " +
            "DELIBERATELY UNFROZEN under the dated human decision D-39 and given a ledger-owner parameter " +
            "DISTINCT from its governance-dial root — exactly what the `what_would_force_it_closed` " +
            "clause below named — so `appendNote` now defaults the record to the owner of its OWN store " +
            "and `admitAndAppend` hands both branches one derived owner. A caller that diverges " +
            "`contextRoot` and `repoRoot` no longer splits the two halves: the note and its GOV-02 " +
            "record both follow the store. `ADMIT_FROZEN_SHA256` re-locks at the new baseline under the " +
            "record `R-31-39-01`, which is the SIXTH re-base and lists all five prior baselines. " +
            "THE ORIGINAL TEXT, KEPT SO THE CLOSURE CAN BE READ AGAINST WHAT IT CLOSED: " +
            "The NEW residual this round leaves, recorded rather than discovered next round. CR-22's " +
            "three independently-reproduced positions are CLOSED: `promoteAdmitted` derives the owning " +
            "repository at its ENTRY and passes it on every return path including the fall-through, and " +
            "`admitAndAppend`'s gated branch appends to the derived root rather than to `repoRoot`. " +
            "Those three appends are reachable because each is an `appendAuditLedger` call this module " +
            "can aim. The appends inside `admit()` are not: that authority takes ONE root, uses it for " +
            "both the dial read and the append, and its bytes are frozen by `ADMIT_FROZEN_SHA256`. " +
            "MEASURED rather than assumed before this was accepted: routing the record through a derived " +
            "root necessarily routes the DIAL through it too, and the existing suite uses `repoRoot` as " +
            "the DIAL seam over a governed store in 63 cases, which turn RED on the dial rather than on " +
            "the ledger. Separating the two questions requires a deliberate unfreeze and re-base of " +
            "`ADMIT_FROZEN_SHA256`, which plan 31-33's own prohibitions forbid. " +
            "DISPOSITION (plan 31-33): accept and disclose, with the cost stated rather than the finding " +
            "declared closed past the coordinate the mechanism actually reaches.",
        what_would_force_it_closed: "The criterion this field named — a deliberate unfreeze giving `admit()` a ledger root " +
            "distinct from its dial root — has been MET, by plan 31-39, and a field that keeps naming a " +
            "met criterion states no open question. The criterion for the half that REMAINS is different " +
            "and is not met: removing the ledger-owner PARAMETER from `appendNote` entirely, so its one " +
            "in-module caller cannot name a repository its own store does not derive. That is expressible " +
            "— `promoteAdmitted`'s fall-through passes `actionOwnerRoot(to)` at a position whose default " +
            "is already `actionOwnerRoot(contextRoot)` over the same `to`, so the argument is redundant " +
            "THERE — and it is not expressible at `admit()`, where `admitAndAppend`'s non-gated branch " +
            "genuinely needs a ledger owner its dial root does not answer. A signature change to a " +
            "byte-frozen authority is a dated decision, not a gap-closure edit.",
    }),
    Object.freeze({
        id: "R-31-33-02",
        shape: "With NO arguments, the note and its GOV-02 record both land in `DEFAULT_CONTEXT_ROOT`'s own " +
            "repository — the KIT's (`join(ROOT, \".grugops\", \"context\")`) — while the governance DIAL " +
            "that decides whether the note may land at all is read from `trustedRepoRoot()`, the HOST " +
            "repository. One write, two repositories: the one that adjudicates it and the one that holds " +
            "it.",
        reason: "CR-22's fourth position, RE-STATED PER BRANCH against the post-31-39 tree (plan 31-41, " +
            "WR-39). THE PUBLISHED TEXT WAS MEASURED FALSE OF THE MECHANISM and is corrected here rather " +
            "than left standing: it said the GOV-02 event lands under `trustedRepoRoot()`. That was true " +
            "of the pre-31-39 program. It is not true of this one, on any branch. " +
            "PER BRANCH, WITH NO ARGUMENTS SUPPLIED: `appendNote` defaults its ledger owner to " +
            "`actionOwnerRoot(contextRoot)`, so the record follows the STORE. `admitAndAppend` derives " +
            "one `actionOwner` at its entry and hands it to BOTH branches — the gated branch consumes it " +
            "at its own retention guard, the non-gated branch hands it to `admit()` as that authority's " +
            "ledger owner — so both follow the STORE too. `promoteAdmitted` derives the destination's " +
            "owner above every branch, including the fall-through. What still reads `trustedRepoRoot()` " +
            "on every one of those paths is the DIAL, and that is `WR-10` working as decided rather than " +
            "a defect. " +
            "THE MEASURED FACT ABOUT THIS BOX IS KEPT: here the kit IS the host repository, so " +
            "`governanceRootOf(DEFAULT_CONTEXT_ROOT)` and `trustedRepoRoot()` coincide and the split is " +
            "NOT observable; under the shipped shared-install model (`~/.grugops` kit + per-repo state) " +
            "they are different directories and the dial and the write diverge. " +
            "WHAT IS STILL OPEN IS THE SAME DECISION IT ALWAYS WAS, and it is not closed inside plan " +
            "31-33 or since, because closing it means DECIDING which repository the default names, and " +
            "either answer reverses a prior decision that has a written reason: deriving `repoRoot` from " +
            "the kit store reverses `WR-10`, which made the host repository the ONE trusted dial answer " +
            "every tier asks, while re-pointing `DEFAULT_CONTEXT_ROOT` at the host repository moves every " +
            "READER's default with it and is a decision about where the shared verified context lives. " +
            "DISPOSITION (plan 31-41): accept and disclose, with the mechanism re-stated. A product " +
            "decision with a written reason is not a bug fix, and taking it silently inside a gap-closure " +
            "plan is the move this phase forbids.",
        what_would_force_it_closed: "A dated decision naming ONE repository as the default owner of the shared verified context, " +
            "applied to the readers' defaults and the writers' in the same change, with the `WR-10` dial " +
            "answer restated against it.",
    }),
    Object.freeze({
        id: "R-31-41-01",
        shape: "Moving the destination decline above `promoteAdmitted`'s human-stamp fall-through WIDENED " +
            "the refused input set. A destination outside a governed repository was ACCEPTED on that " +
            "path before plan 31-33 and is refused by name now — an input set that moved, not a clause " +
            "that was reordered.",
        reason: "PUBLISHED BECAUSE THE ROUND THAT WIDENED IT RECORDED THE CONSEQUENCE EVERYWHERE BUT HERE " +
            "(plan 31-41, WR-42). Round 7's own fixtures re-staged several cases with the note that a " +
            "bare directory is now refused by name, which is evidence the ACCEPTED-INPUT set moved rather " +
            "than the clause order — and no register member said so, so a later round reading the " +
            "refusal cold would meet it as a false refusal. " +
            "THE REFUSAL ITSELF IS NOT RE-DECIDED HERE. It is `D-31`'s own named decline, moved above the " +
            "fall-through by `D-34 (1)`; `D-31`'s REJECTED ALTERNATIVE stands, because leaving an " +
            "unanchored destination to get no audit record would make a workflow sentence true by " +
            "weakening the guarantee it describes. What this entry adds is the INPUT SET, measured: a " +
            "bare directory and a store-SHAPED directory outside every governed repository are both " +
            "declined `destination-outside-governed-store` at the fall-through. " +
            "THE SHARED-INSTALL SHAPE IS MEASURED RATHER THAN REASONED ABOUT, and the reasoning it " +
            "replaces was WRONG. `WR-42` argued that a kit-side store at `~/.grugops/.grugops/context` " +
            "has no configuration and no version-control marker, so the resolver would answer `null` and " +
            "every promotion into it would throw, and closed `UNKNOWN - verify`. Driven against a kit " +
            "home the COMMITTED `install/install.js` created: `copyKit` copies the source's " +
            "`agent-factory/` tree to `resolve(GRUGOPS_HOME, \"agent-factory\")`, and that tree carries " +
            "`config/factory.config.json` — which relative to the kit home is the `in-kit` position of " +
            "`governanceConfigCandidates`. The upward walk remembers it as `nearest`, the home directory " +
            "ends the walk without answering as a repository, and `nearest` is returned. So the resolver " +
            "answers the KIT HOME, the root-anchoring conjunct holds, and a promotion into a kit-side " +
            "store is ACCEPTED. A control with that one file absent answers `null` and refuses by name, " +
            "so the positive reading is attributable to the file the installer copies and not to the " +
            "walk. Two further readings bound the shape: the installer creates NO context store under " +
            "either root, and it materializes no `scripts/context-io.js` under the kit home — so " +
            "`DEFAULT_CONTEXT_ROOT` never NAMES a kit-side store on an installed host. " +
            "DISPOSITION (plan 31-41): accept the widened refusal and publish it. The shape most likely " +
            "to meet it does not meet it, and the shapes that do are ungoverned directories, which is " +
            "the input the decline exists for.",
        what_would_force_it_closed: "A shipped flow that promotes into a store whose owning repository this module cannot name — " +
            "at which point the disposition is an exemption with its own reason or a refusal with a " +
            "remedy, not a silent widening. The re-binding route's in-repo caller set is derived across " +
            "the tracked corpus and its one member FORWARDS the destination its own caller supplies, so " +
            "such a flow arrives as a new caller rather than as a changed constraint.",
    }),
    Object.freeze({
        id: "R-31-41-02",
        shape: "The unnameable-owner refusal sits at the RETENTION GUARD, so under any `audit_retention` " +
            "value other than `retained` a note whose store's owning repository cannot be named is " +
            "WRITTEN rather than refused — with no GOV-02 record anywhere and no refusal.",
        reason: "THE NEW RESIDUAL THIS ROUND LEAVES, and it is the converse face of `R-31-41-01` rather than " +
            "a second subject. `D-39 (3)` SCOPED the refusal deliberately, on a reading neither finding " +
            "document took: a note and a GOV-02 record are two halves of ONE action only when a record is " +
            "actually written, so under the lean value the action has one half and there are no two " +
            "halves to split across two repositories. That reading is what let `CR-26` close WITHOUT " +
            "refusing every ungoverned `contextRoot` — an unscoped refusal `D-34` had already measured at " +
            "121 `appendNote` and 26 `admitAndAppend` call sites. " +
            "MEASURED ON THIS TREE, both sides of the scope: `appendNote` into a store-shaped directory " +
            "outside every governed repository, under `audit_retention: git`, WROTE the note, created no " +
            "ledger in any root and refused nothing; the identical store under `retained` was REFUSED " +
            "`destination-outside-governed-store`. " +
            "WHY IT IS A RESIDUAL AND NOT A DEFECT. Nothing is recorded in the wrong repository, because " +
            "nothing is recorded. What is left open is narrower and is stated rather than implied: a note " +
            "can sit in a store this module cannot attribute to a repository, and no surface says so at " +
            "the time of the write. " +
            "DISPOSITION (plan 31-41): accept and disclose, with the scope stated as a scope rather than " +
            "carried inside a decision block nobody reading the register would find.",
        what_would_force_it_closed: "A decision that the ATTRIBUTION of a store to a repository is a precondition of writing into " +
            "it at all, independent of whether a record follows — which is the unscoped refusal `D-34` " +
            "priced and rejected, and would need its own dated decision and that measured cost paid " +
            "again. A cheaper partial: `render` reporting an unattributable store the way it already " +
            "reports a skipped entry, which makes the condition legible without moving a refusal.",
    }),
]);
// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE ROOT-DIVERGENCE REGISTER (31-40) — a disposition for every place a write path aims the
// governance DIAL or the audit RECORD somewhere other than the answer its own inputs derive.
//
// WHY IT EXISTS, STATED AS THE THING THAT KEEPS HAPPENING. Eight consecutive gap-closure rounds of
// this phase closed a Critical at the coordinate it was filed at and met the next one A REGISTER
// OVER. `CR-26` and `CR-27` are ONE defect on TWO DIFFERENT ARGUMENTS of the same call: one aimed
// the record at a root it could not name and fell open to the dial, the other aimed the dial at a
// destination the caller chose. `31-39` removed the freedom that produced both. This register is
// the other half: the SET of places that could still exhibit it, derived from source and counted by
// `scripts/context-io-writer-set.test.ts`'s census, with a written disposition per member — because
// a rule that holds at the two sites a reviewer read is exactly the rule that produced `CR-26`.
//
// THE VOCABULARY IS CLOSED AT THREE, AND THE TYPE IS DERIVED FROM THE CONSTANT. A literal union
// would be a second statement of the vocabulary that only a compiler can read, and this module has
// paid for two-statements-of-one-question often enough. `ROOT_DIVERGENCE_KINDS` is the vocabulary;
// `RootDivergenceKind` is made of it; the census asserts both the cardinality and the derivation. A
// fourth kind cannot be filed, which is the point — a shape that is none of the three is a
// DECISION, and a decision does not arrive as a fourth string typed into a diff.
//
// `derived-and-refusing` IS UNOCCUPIED ON THIS TREE, DELIBERATELY. Both write-both routes derive
// their owner and refuse when they cannot name one — but they do that from their OWN inputs, so
// they are not divergences and need no entry. The kind exists for the site that legitimately aims a
// root somewhere other than its caller's trusted one AND refuses when the derivation fails: a
// divergence that is not a defect. Naming it now is cheaper than inventing a name for it later,
// under the pressure of a round that has already found the site.
//
// WHAT A SOURCE CENSUS CANNOT SEE IS A MEMBER TOO. `scripts/check-platform-shapes.ts` assembles a
// write-path call as the TEXT of a temp module; on this tree it is a string, and no AST walk over
// this repository will ever report it. It is `visible_to_census: false` here rather than left for
// round 9 to discover, so the accepted boundary has a COORDINATE instead of a category.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
/**
 * THE CLOSED VOCABULARY of dispositions a root divergence may carry.
 *
 * A runtime constant rather than a bare type union, so the vocabulary is ONE object a compiler and
 * a test can both read. `RootDivergenceKind` is derived from it below.
 */
export const ROOT_DIVERGENCE_KINDS = Object.freeze([
    /** The site derives its own answer and REFUSES when it cannot name one — a divergence, not a defect. */
    "derived-and-refusing",
    /** The site's action writes NO audit record at all, so it has one half rather than two to split. */
    "one-half-action",
    /** The site is published as a residual, with its reproduction and what would force it closed. */
    "published-residual",
]);
/**
 * EVERY DIVERGING CALL SITE ON THIS TREE, MEASURED 2026-09-12 over 78 tracked `.ts` sources.
 *
 * Ten call sites reach a write-path entry point; two of them diverge, both on the DIAL axis, both
 * in the Tier-1 oracle; one more exists that the census cannot see and is published here anyway.
 */
export const ROOT_DIVERGENCE_DISPOSITIONS = Object.freeze([
    Object.freeze({
        id: "RD-31-40-01",
        site: "scripts/check-uat-oracles.ts::equivDoWork#appendNote@1",
        kind: "one-half-action",
        visible_to_census: true,
        shape: "The Tier-1 dual-path-equivalence oracle's first per-task write supplies `appendNote`'s " +
            "governance-dial argument from a temp directory the oracle itself creates, rather than from " +
            "the ambient trusted root every other tier asks.",
        reason: "QUOTED FROM THE CALL SITE, because a disposition that paraphrases its own site is a second " +
            "statement of it: `The 6th argument is the governance root: a Tier-1 oracle decides " +
            "admission against a root it` `owns, never against whatever repository the ambient order " +
            "resolves (IN-08).` The function's own block states the consequence the divergence exists " +
            "for: `A TIER-1 ORACLE NEVER WRITES TO A HOST REPOSITORY'S LEDGER (plan 31-15, IN-08). Both " +
            "writes below` take that explicit root. IT IS A ONE-HALF ACTION, and that is why it cannot " +
            "split anything: the root is a fresh `mkdtempSync` directory carrying no factory " +
            "configuration, so `readGovernanceConfig` answers the module's own defaults, " +
            "`audit_retention` is not `retained`, and NO GOV-02 record is written at all. There is one " +
            "half — the note — so there are not two halves to key on two repositories. The census case " +
            "MEASURES that default rather than believing this sentence. " +
            "DISPOSITION (plan 31-40): accept — a deliberate divergence whose action has no second half.",
        what_would_force_it_closed: "The oracle's governance root acquiring a configuration with `audit_retention: retained`, " +
            "which would give the write a second half and therefore a repository to split it across. " +
            "The restore criterion for the dropped GOV-02 platform-shape position in `deferred-items.md` " +
            "is the same shape and would be the likely occasion.",
    }),
    Object.freeze({
        id: "RD-31-40-02",
        site: "scripts/check-uat-oracles.ts::equivDoWork#appendNote@2",
        kind: "one-half-action",
        visible_to_census: true,
        shape: "The same oracle's second per-task write — the seeded admitted claim — supplies the same " +
            "oracle-owned governance root at the same argument position, inside the same `try`/`finally` " +
            "whose `rmSync` removes it.",
        reason: "QUOTED FROM THE CALL SITE: `Same governance root, same reason (IN-08): this fixture's " +
            "admission is decided against a root` `this function created and will remove, so no host " +
            "repository's ledger records it.` It is a SEPARATE register entry rather than a footnote on " +
            "the first because the census enumerates SITES, and a register that dispositioned one site " +
            "per reason would let a second site inherit a disposition nobody re-read. The one-half " +
            "argument is identical and is measured identically: the root is the same unconfigured temp " +
            "directory, so the module's defaults apply and no GOV-02 record is written. " +
            "DISPOSITION (plan 31-40): accept — the same deliberate divergence, at a second site, " +
            "written out rather than assumed to travel.",
        what_would_force_it_closed: "The same criterion as `RD-31-40-01`: a configuration under the oracle's own root that turns " +
            "retention on and gives the action a second half.",
    }),
    Object.freeze({
        id: "RD-31-40-03",
        // THE COORDINATE MOVED IN PLAN 31-43 AND THE ENTRY MOVED WITH IT (`WR-41`). The assembled call
        // used to live in `writeContextDriver`; that function now only writes what `contextDriverBody`
        // composes, because the body has mirror arms. A published coordinate that names the function it
        // used to be in is a residual nobody can find, which is the same defect as not publishing it.
        site: "scripts/check-platform-shapes.ts::contextDriverBody#appendNote@text",
        kind: "published-residual",
        visible_to_census: false,
        shape: "The platform-shapes gate BUILDS a write-path call as the text of a temp ES module and drives " +
            "it in a child process, supplying the child's own temp base directory as the governance-dial " +
            "argument — a divergence that exists at run time and is a string at rest.",
        reason: "THE CENSUS CANNOT SEE IT, AND THAT IS THE DISCLOSURE RATHER THAN THE DEFECT. The driver is " +
            "assembled inside `function contextDriverBody(mirror: MirrorDriverKind | null): string {`, " +
            "where the call is an " +
            "array of string literals joined with newlines; a syntax-tree walk over this repository sees " +
            "a string, never a call expression, so no census the census's own technique can build will " +
            "ever report it. What it passes is measurable by reading: the store argument is `base` " +
            "joined with the context subpath, the precomputed id is `noteId`, and the sixth argument — " +
            "the governance dial — is `base` itself, the child's temp root. It is SAFE HERE for a reason " +
            "that is a property of the position and not of the census: the child runs against roots the " +
            "gate creates under the system temp directory, drives the committed artifact, and asserts a " +
            "shape rather than admitting anything into a repository. It is published because the next " +
            "round is entitled to a coordinate rather than a category. " +
            "DISPOSITION (plan 31-40): accept and disclose — a run-time divergence a source census " +
            "cannot enumerate, named at its site.",
        what_would_force_it_closed: "Either the driver becoming real code the census can walk — a committed fixture module " +
            "imported by the gate rather than a string it writes — or a second census that parses the " +
            "assembled text as TypeScript before it is written, which is a parser this repository does " +
            "not have and should not grow for one site.",
    }),
]);
/**
 * Is `candidate` a directory this module RECOGNISES as a grugops context store?
 *
 * The shape is `<X>/.grugops/context` — exactly what `DEFAULT_CONTEXT_ROOT` names and the only
 * shape the sanctioned writers create. It is a recognition rule, not an existence check: a store
 * that is missing is a different case, decided one clause later by "no such origin note".
 *
 * THIS IS HALF A RULE, AND THE OTHER HALF IS NOT OPTIONAL (31-22, CR-16). Read as a TRUST decision
 * it is a two-component basename comparison, which `mkdir -p <anywhere>/.grugops/context` satisfies.
 * `originIsTrusted` therefore conjoins it with `originStoreIsRootAnchored`, and a caller that reuses
 * this predicate alone for a trust question has reproduced the defect CR-16 named.
 */
function isRecognisedContextStore(candidate) {
    const resolved = resolve(candidate);
    return basename(resolved) === "context" && basename(dirname(resolved)) === ".grugops";
}
/**
 * Is the directory the recognised store sits under one this module's OWN walk answers as a
 * governance root? (31-22, CR-16 — the anchoring conjunct.)
 *
 * WHY A SHAPE TEST ALONE CANNOT CARRY THE CLAIM. `isRecognisedContextStore` is a two-component
 * basename comparison, so `mkdir -p <anywhere>/.grugops/context` satisfies it. A rule any single
 * `mkdir` satisfies is a spelling requirement, not a constraint on the caller — and
 * `agent-factory/workflows/18-context-compaction.md`'s stop condition ("copying the origin notes
 * into a directory to make the promotion pass ... the constraint refuses it") would be false the
 * day it was written. So the recognised form is a CONJUNCTION, and this is its second conjunct.
 *
 * WHY THIS IS NOT THE DOCTRINE THE OLD TWO-ARMS DOCSTRING REJECTED — read this before concluding
 * the doctrine was relaxed. That docstring refused to let a CALLER supply BOTH the governance root
 * and the origin, because a caller choosing the location its own proof is judged inside decides its
 * own case. Here there is still exactly ONE caller-supplied value. The module resolves the root FROM
 * that value, by the same walk it uses everywhere else, and then asks whether the value's own
 * location IS that root. No second argument exists, and the route's `repoRoot` TEST SEAM is still
 * not consulted. A caller can move the origin; it cannot move what the walk says about where the
 * origin is.
 *
 * WHAT IT COSTS, PRICED IN OPERATIONS, PER POSITION — see `governanceRootOf` below, which is the
 * one authority that computes this and carries the measured table.
 */
function originStoreIsRootAnchored(from) {
    return governanceRootOf(from) !== null;
}
/**
 * WHICH REPOSITORY OWNS THIS CONTEXT STORE? The governed root, or `null` when there is none.
 *
 * ── ONE AUTHORITY FOR BOTH ENDS OF A PROMOTION (31-29, CR-20 / D-31). ─────────────────────────
 *
 * WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED. `promoteAdmitted` keyed its NOTE write on the
 * caller's `to` and its GOV-02 ledger event on `repoRoot`, which defaults to the process's own
 * governance root. Nothing reconciled the two. Reproduced against the committed
 * `scripts/context-io.js` with THREE real governance roots, each carrying a version-control marker
 * and a governance configuration — a legitimately human-disposed finding admitted at the origin and
 * promoted with `from = origin, to = third, repoRoot = dest`:
 *
 *   | repository | notes present | ledger lines |
 *   | origin     | the note      | 0            |
 *   | third      | THE NOTE      | 0            |
 *   | dest       | (none)        | 1            |
 *
 * The finding landed in THIRD's note store and its audit record landed in DEST's ledger. Two halves
 * of one action, aimed at two different repositories — and
 * `agent-factory/workflows/18-context-compaction.md` states, in the very paragraph rewritten the
 * round before, that "a re-binding first looks in the destination repository's ledger" and that
 * "the destination never holds a human-disposed finding with no ledger line". Both were measured
 * FALSE of the mechanism, at exactly the sentences that exist to assert them.
 *
 * THE RULE THE FIX INSTALLS. TWO HALVES OF ONE ACTION ARE KEYED ON ONE VARIABLE. The repository
 * that owns a store is DERIVED from the store path, here, once; the note write and the ledger event
 * both key on that one answer; and a destination that resolves to no governed root is a NAMED
 * decline evaluated before anything is written, never a promotion whose audit record lands
 * elsewhere. `repoRoot` remains a parameter for the governance-dial read it was always for, and a
 * case asserts it can no longer decide where an audit record lands.
 *
 * THE ANSWER IS A CONJUNCTION, and it is D-25's — the canonical origin form, now asked of the
 * DESTINATION too, which D-25 left unconstrained as `R-31-22-02`. A recognised SHAPE alone is a
 * two-component basename comparison that any single `mkdir -p` satisfies; ROOT ANCHORING alone
 * would accept any directory under a real root. Both, or `null`.
 *
 * WHAT IT COSTS, PRICED IN OPERATIONS, PER POSITION (31-29, WR-28 — a CORRECTION). The price was
 * stated as "three inside a repository, two outside every repository". The round-6 review measured
 * a third position the two-way split hides, and this table is the measurement rather than the
 * claim. The three constructions are a version-control marker at the forged root, a governance
 * configuration under it, and the store directory itself; each row drops one and records the answer:
 *
 *   INSIDE a repository that carries a governance CONFIGURATION  -> THREE. All three are
 *     load-bearing, and both subtractions are driven: without the configuration the walk meets the
 *     marker with `carriesConfig` false and answers `nearest`; without the marker the walk climbs
 *     past the forged root to the REPOSITORY's own boundary and answers that instead.
 *   INSIDE a repository that carries a marker and NO configuration -> TWO. The marker is NOT
 *     load-bearing here: the enclosing boundary carries no configuration, so the walk answers
 *     `nearest` — the forged configuration — with the forged marker absent. This is the position
 *     WR-28 named, and the reason the price is stated per position rather than as one number: the
 *     enclosing repository's configuration is the variable, not the fact of being inside one.
 *   OUTSIDE every repository -> TWO, for the same reason: a walk that meets no boundary at all
 *     answers the `nearest` configuration it remembered, which is the forged one.
 *
 * All three numbers are driven in `scripts/context-io.test.ts`, and `T-31-18-01` and
 * `18-context-compaction.md`'s stop condition state the same three. The capability is KEPT
 * deliberately — a cross-repository compaction is a promotion a host genuinely performs — and what
 * it costs is bounded by, and identical to, `T-31-14-03`.
 */
export function governanceRootOf(storePath) {
    // The emptiness guard is a NAMING precondition, not a third authority on trust: `resolve("")`
    // answers the process's working directory, so an empty path would be judged against wherever the
    // process happens to stand. It names nothing.
    if (storePath.trim() === "")
        return null;
    if (!isRecognisedContextStore(storePath))
        return null;
    const anchor = dirname(dirname(resolve(storePath)));
    return projectRootFromWorkingDirectory(anchor) === anchor ? anchor : null;
}
/**
 * Does the proof's left operand resolve inside a location this module has independent reason to
 * trust? (31-18 WR-17, narrowed by 31-22 CR-16 / D-25.)
 *
 * ONE ARM, TWO CONJUNCTS, AND THE ROOT-PROXIMITY ARM IS DELETED RATHER THAN NARROWED. The old second
 * arm asked whether the origin sat at or under `trustedRepoRoot()`. The agent that calls this route
 * RUNS INSIDE the repository, so every directory it can create satisfied that arm: the round-5
 * verifier copied legitimately-obtained human-disposed bytes into an ordinary directory under the
 * repository root and promoted them into a fresh destination id.
 *
 * The review's narrowed form — `resolvedFrom === resolve(join(trustedRepoRoot(), ".grugops",
 * "context"))` — is deliberately NOT kept as a second arm. It is the AMBIENT special case of the
 * anchoring conjunct above: the process's own governance root is one the walk answers, so its store
 * passes the conjunction already. Keeping it would be a second authority for a question the
 * conjunction answers, which is the drift shape this module keeps deleting.
 *
 * The emptiness conjunct is a NAMING precondition, not a third authority on trust: `resolve("")`
 * answers the process's working directory, so an empty or whitespace-only origin would be judged
 * against wherever the process happens to stand. It names nothing — the same `trim() !== ""`
 * reasoning `trustedRepoRoot` already applies to its environment variables.
 */
function originIsTrusted(from) {
    return (from.trim() !== "" && isRecognisedContextStore(from) && originStoreIsRootAnchored(from));
}
/** Build one decline, taking its reason from the single register above. */
function declineRebinding(clause, detail) {
    const reason = PROMOTE_ADMITTED_DECLINES[clause];
    // A clause with no register entry is a decline nobody wrote a reason for. Fail loudly rather than
    // emitting an undefined sentence — the register and the code are one thing or they are drift.
    if (reason === undefined) {
        return new Error(`context-io.promoteAdmitted: internal — no decline register entry for clause "${clause}".`);
    }
    return new Error(`context-io.promoteAdmitted: DECLINED (${clause}). ${detail} Nothing was written. ${reason}`);
}
/**
 * Promote a note that was ALREADY ADMITTED at an origin context into a destination context.
 *
 * Returns the persisted note id. On the proof route that id IS `sourceId` — the frozen creation-time
 * identity is carried forward, so the destination file is byte-identical to the origin file and the
 * compaction carve-out's id-keyed raw→promoted match still holds.
 *
 * @param repoRoot TEST SEAM, exactly as `appendNote`'s and `admitAndAppend`'s: production callers
 * pass nothing and the governance root is the ONE trusted answer every tier asks. IT ANSWERS THE
 * GOVERNANCE DIAL AND NOTHING ELSE (31-33, CR-22 / D-34): it decides where no record lands, on any
 * path this function takes. Where the record lands is `destinationRoot`, derived from `to` at this
 * function's entry, above every branch.
 */
export function promoteAdmitted(task, sourceId, note, body, from, to, repoRoot = trustedRepoRoot()) {
    assertSafeTask(task);
    // ── THE DESTINATION NAMES ONE REPOSITORY, AND IT IS DERIVED HERE, ABOVE EVERY BRANCH. ─────────
    //
    // WHERE THIS USED TO SIT, AND WHY THAT WAS THE WHOLE DEFECT (31-33, CR-22 / D-34). `D-31 (2)`
    // states its rule as a property of an ACTION — two halves of one action are keyed on ONE
    // variable — and `31-29` installed it NINETEEN LINES BELOW the human-stamp fall-through, inside
    // the arm the reproduction happened to walk. Reproduced against the committed `.js` with three
    // real governance roots, each asserted `governanceRootOf(store) === root` before any result was
    // read: `promoteAdmitted("T-3", …, verified_by:"", to = THIRD, repoRoot = DEST)` wrote the note
    // into THIRD and its GOV-02 event into DEST, on a call that never reached the derivation at all
    // because it returned two lines above it. That branch is the ORDINARY path through this
    // function, not an edge case.
    //
    // A PROPERTY CLAIMED OF A FUNCTION IS ESTABLISHED AT THE FUNCTION'S ENTRY, OR IT IS NOT
    // ESTABLISHED. A return that precedes the derivation is a path on which the property is simply
    // not true, and no amount of correctness below it changes that. So the derivation and its
    // decline are the FIRST thing this body does after `assertSafeTask`, and there is no return
    // between the function's first line and this one. Every path below — the fall-through included —
    // reaches a write only through this answer.
    //
    // WHY THIS IS A DECLINE AND NOT A FALLBACK, WITH THE ALTERNATIVE NAMED AND REJECTED. The review
    // offers a second disposition: leave `to` unconstrained and record that an unanchored
    // destination simply gets no audit record. It is REJECTED. That would make the workflow's
    // sentence true by WEAKENING the guarantee it describes — the claim-follows-mechanism move run
    // backwards — and it would leave a human disposition sitting in a store whose audit trail cannot
    // be named, which is the repudiation `audit_retention: retained` exists to prevent.
    //
    // IT IS ASKED BEFORE THE ORIGIN CLAUSE NOW, WHICH IS A CHANGE OF ORDER AND IS DELIBERATE. The
    // origin clause is the more specific fault about the caller's input and was asked first while
    // this clause lived on the gated arm. It cannot stay first without leaving the fall-through
    // behind a branch again, and an ENTRY-level property is worth more than a clause ordering: a
    // caller told `destination-outside-governed-store` is told the truth about the destination it
    // named, and the origin clause still fires for every call whose destination resolves.
    //
    // IT IS THE ONE AUTHORITY, CONSUMED WITH AN EXPLICIT BRANCH (31-39, D-39). The answer arrives as
    // a discriminated `ActionOwner` with no null member, so this route cannot fall open to some other
    // root by writing `?? repoRoot` — which is exactly what the sibling route did, and exactly what
    // round 8 reproduced. THE CLAUSE NAME IS SPELLED AS A STRING LITERAL HERE ON PURPOSE:
    // `scripts/context-io-writer-set.test.ts` parses this route's own body for the first argument of
    // every `declineRebinding` call, and `UNNAMEABLE_OWNER_CLAUSE` is bound to it from the other
    // side — the register keys off the constant, and the register's key set is asserted equal to the
    // parsed set in BOTH directions. The two spellings cannot drift without turning that axis red.
    const destinationOwner = actionOwnerRoot(to);
    if (!destinationOwner.answered) {
        throw declineRebinding("destination-outside-governed-store", `The destination "${resolve(destinationOwner.store)}" does not resolve to a governed store, ` +
            `so the repository whose audit trail would record this promotion cannot be named.`);
    }
    const destinationRoot = destinationOwner.root;
    // ── THE ENTRY SET, DECIDED FIRST AND NAMED. ────────────────────────────────────────────────────
    // This route exists for ONE question the frozen arm cannot answer: is this human disposition the
    // same one a human already placed at the origin? A note that carries no human disposition stamp
    // does not ask that question, so it is not this route's business — it takes the FULL-ADMISSION
    // route, byte-identically to what `compactor.promote` does today. That is why a `§14-gate`-stamped
    // finding and an `artifact-ref` still re-bind against a live green verdict at the destination: they
    // never enter the proof at all. Falling through here is deliberate and is asserted by test — a
    // shape outside the entry set must not be silently accepted OR silently dropped.
    //
    // IT CARRIES THE DERIVED ROOT WITH IT (31-33, CR-22). The fall-through is a full admission at the
    // DESTINATION, so the repository that records it is the destination's — never the caller's dial
    // root. Passing `destinationRoot` as the ledger root is what makes this return path obey the
    // property the entry established; passing `repoRoot` is precisely what CR-22 measured.
    const vb = (note.verified_by ?? "").trim();
    if (!HUMAN_STAMP_RE.test(vb)) {
        // THE DIAL AND THE RECORD ARE AIMED SEPARATELY, AND THAT IS THE WHOLE OF CR-27 (31-39, D-39).
        // The sixth argument answers the governance DIAL and is the CALLER'S OWN trusted root — the one
        // every tier asks (WR-10). The seventh names the repository whose audit trail records the
        // admission and is the answered owner of the derived destination, which is CR-22's closure and
        // must survive this fix. Passing `destinationRoot` as the dial, as this line did until now, let
        // a caller-supplied destination decide whose configuration adjudicates the admission: a
        // fail-closed D-14 refusal at the trusted root was routed around by naming a permissive one.
        return appendNote(task, note, body, to, undefined, repoRoot, destinationOwner);
    }
    // ── FROM HERE ON THE NOTE CLAIMS TO BE A RE-BINDING, AND MUST PROVE IT. ────────────────────────
    // Every clause below DECLINES before the write chokepoint is reached, so "nothing was written" is
    // true by construction rather than by cleanup.
    if (sourceId.trim() === "") {
        throw declineRebinding("empty-source-id", `The source id was ${JSON.stringify(sourceId)}.`);
    }
    // FAIL CLOSED ON THE DIAL, ON THIS ROUTE TOO (T-31-14-04). The skip is scoped to the human-stamp
    // arm, never to the authority — so the SAME discriminated read `admitAndAppend`'s gated branch
    // consults is consulted here, and an unreadable configuration refuses. It must not throw: a read
    // that failed is a read that failed, and it lands on this one refusal rather than a second shape.
    let govResult = null;
    try {
        govResult = readGovernanceConfig(repoRoot);
    }
    catch {
        govResult = null;
    }
    if (govResult === null || govResult.source === "unreadable") {
        throw declineRebinding("unreadable-governance-config", "A governance configuration file exists at a standard location but could not be read or parsed.");
    }
    // ── THE OPERAND IS CONSTRAINED BEFORE IT IS READ, AND BEFORE THE DIAL IS CONSULTED. ──────────
    //
    // 31-18 (WR-17) added this clause; 31-22 (WR-25) MOVED it here and changed nothing else about it.
    // A proof whose left operand the benefiting caller may author is a flag wearing a filesystem path.
    // The origin must resolve inside the ONE canonical form this module recognises; what that still
    // leaves open is the named residual T-31-18-01 rather than a silence.
    //
    // WHY IT SITS ABOVE THE DIAL CLAUSE — the argument, not the verdict. `origin-outside-trusted-store`
    // is a statement about the CALLER'S INPUT. `human-stamp-not-gated-at-destination` is a statement
    // about the ENVIRONMENT the caller is writing into. The input fault is the more specific answer,
    // and the ordering matters because the register's whole contract is that a caller is told WHICH
    // clause failed: the workflow's remedy for the environment clause is to SET the destination's
    // `human_admission` dial, so a caller whose origin was forged and who was told about the dial
    // would WIDEN a gate in response to an origin fault. Measured before the move, against the
    // committed `.js`, with a forged in-repository origin: `off` and an absent configuration both
    // answered the dial clause.
    //
    // WHY `unreadable-governance-config` STAYS ABOVE BOTH. That one is not an ordering preference but
    // a PRECONDITION. A dial that cannot be read is UNKNOWN (D-14) and fails closed, and every answer
    // below it — this clause included — is computed in a world where the dial has a known value. The
    // route may not reason past a fail-closed refusal to reach a more specific one.
    if (!originIsTrusted(from)) {
        throw declineRebinding("origin-outside-trusted-store", `The origin "${resolve(from)}" is not a recognised grugops context store anchored to a ` +
            `governance root this module resolves for itself.`);
    }
    // THE DESTINATION'S OWN REPOSITORY WAS ALREADY DERIVED, AT THE FUNCTION'S ENTRY (31-33, CR-22).
    // `destinationRoot` is in scope here and every clause below reads it. It used to be derived at
    // THIS position, below the human-stamp fall-through, which is exactly the branch the property was
    // not true on — see the entry block for the measurement.
    // ── THE DIAL'S VALUE DECIDES, THROUGH THE ONE AUTHORITY (31-18, WR-18). ───────────────────────
    //
    // WHAT WAS WRONG, MEASURED RATHER THAN DESCRIBED. The read above asked only whether the
    // configuration was READABLE; `human_admission` had zero occurrences in this body. So under `off`,
    // and under an ABSENT configuration — the lean posture this project ships and the one most
    // repositories run — this route carried a `human:NAME` stamp forward and WROTE, while
    // `admitAndAppend` refused the IDENTICAL note at its W3 arm on the explicit ground that accepting
    // a human disposition on a non-gated entry would forge a `disposed_by` audit record. Two routes,
    // one rule, two answers. Reproduced per dial value against the committed `.js` before this change.
    //
    // ASKED THROUGH `isGatedNote`, NEVER RECOMPOSED HERE. `isGatedNote` is the SINGLE-SOURCE gated
    // decision the combiner and the 25-10 per-call hook both import, and the comment above it says why
    // a second local composition of `((high-sev && active) || all)` is forbidden: that duplication was
    // this module's ten-round drift surface. This route therefore asks it, once, and spells no dial
    // value of its own — which is also what makes the derived dial set in the tests meaningful.
    //
    // WHY THIS IS NOT A RE-CLOSURE OF CR-08. Round 3's gap was a note a named human HAD disposed under
    // a dial that gates it being refused at the destination. That case is exactly `gated === true`,
    // and it still promotes, byte-identically, under every gating posture. What is refused here is the
    // converse: a human disposition offered where the destination gates nothing, which is not a
    // carried-forward binding at all.
    if (!isGatedNote(note.by, note.kind, govResult)) {
        throw declineRebinding("human-stamp-not-gated-at-destination", `The destination's dial does not gate a "${note.kind}" authored by "${note.by}", so the ` +
            `"${vb}" disposition binds nothing there.`);
    }
    // THE PROOF'S LEFT OPERAND: the origin's own bytes, folded through the SAME deterministic replay
    // every other reader of that context uses. Without this read there is nothing to compare against,
    // which is what makes this a proof rather than a flag.
    const originRaw = readRawNotes(task, from);
    const originEntry = originRaw.find((raw) => raw.id === sourceId);
    if (originEntry === undefined) {
        throw declineRebinding("no-such-origin-note", `No note with id "${sourceId}" exists under task "${task}" in the origin context.`);
    }
    const originRecord = recordFromParsed(originEntry.parsed, originEntry.id);
    const live = currentState(originRaw.map((raw) => recordFromParsed(raw.parsed, raw.id)));
    if (!live.some((n) => n.id === sourceId)) {
        throw declineRebinding("origin-note-not-live", `The note "${sourceId}" is present in the origin context but has been superseded there.`);
    }
    // Compose the candidate through the module's OWN composer and validator, with the origin's frozen
    // id, then read it back through the store's own projection. Comparing two records the SAME
    // projection produced is what makes "byte-equality" a statement about the note the store will hold
    // rather than about the shape of a caller's object literal. Nothing is written by this step.
    const { text: candidateText } = composeValidatedNote(task, note, body, sourceId);
    const candidateParsed = parseNote(candidateText);
    if (!candidateParsed) {
        // Unreachable in practice — composeValidatedNote validated this text — and therefore NOT a
        // register clause: it is a type-narrowing guard, not a decision about a caller's input.
        throw new Error("context-io.promoteAdmitted: internal — the composed candidate did not parse.");
    }
    const candidateRecord = recordFromParsed(candidateParsed, sourceId);
    // THE COMPARED FIELD SET IS DERIVED FROM THE TWO RECORDS, NOT TYPED OUT HERE. The four scalars
    // CR-08's fix clause (a) names — kind, by, verified_by, at — are members of it by construction, and
    // so is every other field the store reads back, so this is that requirement met and exceeded. A
    // field this projection does not carry is the named residual R-37 above.
    const comparedKeys = [
        ...new Set([...Object.keys(originRecord), ...Object.keys(candidateRecord)]),
    ]
        .filter((key) => key !== "id" && key !== "body")
        .sort();
    const originFields = originRecord;
    const candidateFields = candidateRecord;
    for (const key of comparedKeys) {
        const originValue = JSON.stringify(originFields[key] ?? null);
        const candidateValue = JSON.stringify(candidateFields[key] ?? null);
        if (originValue !== candidateValue) {
            throw declineRebinding("field-differs-from-origin", `Field "${key}" is ${candidateValue} on the promoted note and ${originValue} on the origin ` +
                `record "${sourceId}".`);
        }
    }
    if (candidateRecord.body !== originRecord.body) {
        throw declineRebinding("body-differs-from-origin", `The promoted body is not the body stored for "${sourceId}" at the origin.`);
    }
    // ── THE DESTINATION IS PART OF THE PROOF (31-18, CR-11). ──────────────────────────────────────
    // Read the DESTINATION through the SAME reader the proof's left operand already uses, so "what is
    // already there" has one answer rather than a second walk beside `readRawNotes`. The clause sits
    // HERE — before the write chokepoint is reached — for the positional reason every other clause in
    // this register sits where it does: "nothing was written" is then true by construction rather than
    // by cleanup. The chokepoint enforces the same invariant for every writer (see writeNoteFile);
    // this clause exists so the refusal is LEGIBLE where a reader of the register looks, and so the
    // route names its own decision rather than inheriting a message about a filesystem primitive.
    //
    // Identical bytes are the DECIDED idempotent case and fall through to the write, which is itself a
    // no-op there. A destination file that exists but does not PARSE is invisible to this reader — and
    // is caught by the chokepoint, which compares bytes rather than records. Defense in depth, stated
    // rather than assumed.
    const destinationEntry = readRawNotes(task, to).find((raw) => raw.id === sourceId);
    if (destinationEntry !== undefined && destinationEntry.text !== candidateText) {
        throw declineRebinding("destination-id-occupied", `The destination already holds a DIFFERENT note under id "${sourceId}".`);
    }
    // EVERY CLAUSE HELD. Persist through the module-private pre-admitted route with the origin's frozen
    // id, so the destination file IS the origin file. This is the SECOND — and, by the derived caller
    // assertion in scripts/context-io-writer-set.test.ts, the last unannounced — caller of that route.
    //
    // THE GOV-02 LEDGER PREMISE IS A LOOK, NOT AN ASSUMPTION (31-18, WR-18 (b)). D-19 (4) decided a
    // re-binding appends no audit event, because the origin's admission already recorded this exact id
    // and the named human who disposed it — a second line keyed by the same id would be the duplicate
    // 31-09 collapsed. That reasoning is CORRECT wherever the premise holds, and nothing checked
    // whether it held: the review named three conditions under which it does not (the origin write
    // happened under a different repoRoot, or before `retained` was set, or through a hand-authored
    // origin). So the route asks the destination repository's own ledger. When the id is already
    // there, D-19 (4) stands unchanged and nothing is appended. When it is not, the event is appended
    // and marked `re_bound: true`, so it stays distinguishable from a fresh admission and the "no
    // duplicate keyed by the same id" property becomes intentional rather than accidental.
    // ── THE LEDGER EVENT PRECEDES THE NOTE WRITE (31-21, WR-22 (1) / D-24). ───────────────────────
    //
    // THE ARGUMENT, WRITTEN ONCE, HERE. `admitAndAppend`'s gated branch is the other route that writes
    // both a note and a ledger event, it is inverted for the same reason, and it points at this
    // paragraph. The two steps CANNOT be made atomic: this module has no transaction, and a crash, a
    // SIGINT or an ENOSPC between them is reachable in either order. So the ORDER is what decides
    // WHICH asymmetry a reader of the audit trail can ever meet, and it is chosen deliberately rather
    // than inherited from the sequence somebody typed first.
    //
    //   note first, then ledger  →  the destination holds a HUMAN-DISPOSED FINDING WITH NO LEDGER
    //                               LINE. That is a repudiation: the trail cannot show who disposed
    //                               a finding that is sitting in the shared verified context. It is
    //                               the exact state `18-context-compaction.md` says can never happen,
    //                               and the round-5 review MEASURED it with a FIFO at the ledger path
    //                               (`timeout 15` → exit 124, the note already written).
    //   ledger first, then note  →  the trail holds a line for a note that was not written. That is
    //                               an OVER-RECORD: legible, self-evidently reconcilable against the
    //                               notes directory, and it accuses nobody of nothing.
    //
    // An audit trail's conservative direction is to over-record, so the ledger goes first.
    //
    // NO VALUE IS CARRIED BACKWARDS. The persisted id on this route IS `sourceId` — the candidate was
    // composed with it, the frozen creation-time identity is carried forward deliberately, and the
    // function returns it. So every scalar the event needs is known before either step runs.
    //
    // THE LOOK IS FAIL-CLOSED (WR-22 (2)). `ledgerRecordsId` throws for a ledger that is present and
    // unreadable rather than answering "not recorded", because the response to "not recorded" is to
    // APPEND and a fail-open read would manufacture the duplicate D-19 (4) exists to prevent. The
    // throw becomes a named decline here, raised before anything is written — so "nothing was
    // written" stays true by construction rather than by cleanup, exactly like every clause above.
    const persistedId = sourceId;
    if (govResult.config.audit_retention === "retained") {
        // BOTH HALVES KEY ON `destinationRoot` (31-29, CR-20). `repoRoot` decided this look and this
        // append until round 6 measured the consequence: the note went to `to`'s store and the event
        // went to `repoRoot`'s ledger, in two different repositories. `repoRoot` still answers the
        // governance-dial question it was always for; it no longer answers WHERE the record lands.
        let alreadyRecorded;
        try {
            alreadyRecorded = ledgerRecordsId(destinationRoot, persistedId);
        }
        catch (e) {
            throw declineRebinding("unreadable-audit-ledger", `The ledger look for id "${persistedId}" failed: ${e.message}`);
        }
        // D-19 (4) UNCHANGED: when the id is already in the ledger, nothing is appended.
        if (!alreadyRecorded) {
            appendAuditLedger(destinationRoot, {
                id: persistedId,
                kind: note.kind,
                by: note.by,
                at: note.at,
                verified_by: note.verified_by,
                confidence: note.confidence,
            }, isHighSeverityRole(note.by), vb, true);
        }
    }
    const writtenId = appendPreAdmittedNote(task, note, body, to, sourceId);
    // The two ids are the same object by construction; asserting it here means a future change that
    // let the write mint its own id would be caught rather than silently de-keying the ledger event
    // this route already appended.
    if (writtenId !== persistedId) {
        throw new Error(`context-io.promoteAdmitted: internal — the persisted note id "${writtenId}" is not the id ` +
            `"${persistedId}" the GOV-02 ledger event was keyed on. The audit record and the note must ` +
            `share one identity.`);
    }
    return persistedId;
}
// ── The green-verdict recognition contract (D-01/D-03) ──────────────────────────────────────────
// A §14-gate verdict is itself a context note (it dogfoods the schema — not a separate ledger).
// A note is a LIVE GREEN verdict for per-run id <id> exactly when ALL of:
//   - kind === "finding"
//   - by === "§14-gate"   (the reserved gate identity)
//   - refs includes the literal "§14-gate#<id>"   (the per-run id this verdict certifies)
//   - body contains the green terminal marker "READY_FOR_HUMAN_REVIEW"
//   - it is LIVE (not folded out by currentState — a superseded/withdrawn verdict must not admit)
// Plan 02's emitVerdict() (below) is the ONLY emitter; the gate's §14 step calls it on a green
// terminal result. The admission cross-check (admit) matches a finding's §14-gate#<id> stamp
// against this contract. Keep emitVerdict and this recognizer in lockstep with Plan 02.
const VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW";
function verdictStampFor(id) {
    return `${GATE_IDENTITY}#${id}`;
}
function isLiveGreenVerdict(n, id) {
    return (n.kind === "finding" &&
        n.by === GATE_IDENTITY &&
        n.refs.includes(verdictStampFor(id)) &&
        n.body.includes(VERDICT_GREEN_MARKER));
}
// ── The gate run's test-integrity result, as the emitter receives it (plan 30-05, D-15). ────────
// Three states, mirroring the exit codes the gate workflow's test-integrity step ALREADY branches
// on (05-pr-quality-gate.md Step 3): `0` → the skip registry justifies every skip; `1` → an
// unjustified, expired or malformed skip; `2` → the checker failed to run. The argument therefore
// carries information the gate procedure already holds, rather than inventing a second vocabulary
// beside the one the workflow documents.
//
// There is deliberately NO fourth "disabled" state. `quality.test_integrity` has no `off` value in
// any mode (the TINT-03 trace-integrity floor, recorded in scripts/validate-agent-factory.ts's
// enum), and a dial that can be switched off entirely is not a floor. That carve-out survives this
// move to the point of effect: the only value that admits a green verdict is `clean`.
export const TEST_INTEGRITY_RESULTS = ["clean", "finding", "unknown"];
/** The ONE value that admits a green verdict. Everything else — recognized or not — refuses. */
const TEST_INTEGRITY_CLEAN = "clean";
// ── emitVerdict: the §14 gate's verdict emission carve-out (D-03/D-04). ──────────────────────────
// The ONE path allowed to author a `by: §14-gate` note. Called by the §14 quality gate step
// (05-pr-quality-gate.md, Plan 02) on a GREEN terminal result, carrying the unique per-run <id>
// that downstream findings reference in `verified_by: §14-gate#<id>`. Composes a verdict note,
// validates it with the trusted-gate-emission carve-out (so the reserved-identity rule does not
// reject the gate's own note), and atomically appends it under the task. Returns the verdict
// note's id, or `null` when it refused to emit. The per-run <id> is the caller's (the gate
// generates it via node:crypto, D-03).
//
// THE TEST-INTEGRITY FLOOR, AT ITS POINT OF EFFECT (plan 30-05, D-15/D-16). The third argument is
// the gate run's test-integrity result. It is REQUIRED and it is POSITIONAL — ahead of the two
// defaulted parameters — so that every existing call site had to be revisited rather than keep
// compiling against a default that would have made the floor decorative. This function performs no
// file read and no log read of its own to obtain that result: a second parser inside a safety path
// is a second thing to drift, and the workflow already holds the checker's exit code.
//
// THE TIER, STATED RATHER THAN PAPERED OVER. The hook-enforced checkpoints are decided by a
// SEPARATE process (hooks/guard.js) reading its own environment, which the agent under the hook
// cannot set for itself. This one is decided IN-PROCESS from an argument the gate procedure
// supplies. Those are different tiers and this file will not claim otherwise. What the mechanism
// does buy is that a malformed, misspelled, wrong-typed, empty or absent result FAILS CLOSED —
// nothing is written and nothing is partially written — so the only way to reach a green verdict
// is to state `clean` outright. The residual is that a caller determined to lie can state it; that
// residual is named here and in the workflow prose instead of being claimed away.
// THE COMMIT THE RUN WAS PERFORMED AT (plan 31-01, D-01/UATX-04). The fourth argument is the HEAD
// SHA the gate run was performed against, and it is REQUIRED and POSITIONAL for the same reason
// `integrity` is — ahead of the two defaulted parameters, so every existing call site had to be
// revisited rather than keep compiling against a default that would have made the field decorative.
// The verdict RECORDS it, and that recorded value is the only left operand D-03's stale-evidence
// refusal has: an artifact-ref claims a commit, and this is what that claim is compared against.
//
// It is NOT derived here. Shelling to git inside this function would be a second parser inside a
// safety path — the thing the paragraph above already refuses to do for the test-integrity result
// — and the gate procedure already holds the fact. A malformed, multi-line, non-hex, empty or
// absent SHA THROWS a named error before anything is composed, so the failure is loud at the point
// of invocation rather than a verdict that quietly records nothing. That is a different disposition
// from the integrity refusal below, and deliberately so: the integrity result is a policy OUTCOME
// whose non-clean values are ordinary and degrade to `UNKNOWN - verify`, while a malformed SHA is a
// malformed INVOCATION, which is how this function already treats a malformed per-run id.
export function emitVerdict(task, id, integrity, sha, contextRoot = DEFAULT_CONTEXT_ROOT, at = new Date().toISOString()) {
    assertSafeTask(task);
    // The per-run id is interpolated into a ref; it must be single-line and grammar-clean so the
    // emitted stamp `§14-gate#<id>` is a valid GATE_STAMP_RE stamp downstream findings can match.
    assertSingleLine("verdict id", id);
    if (!GATE_STAMP_RE.test(verdictStampFor(id))) {
        throw new Error(`context-io.emitVerdict: invalid per-run id "${id}" — the emitted stamp ` +
            `"${verdictStampFor(id)}" must match ${GATE_STAMP_RE}.`);
    }
    // The gate-run SHA, checked in the same slot and the same way as the per-run id above and BEFORE
    // the first line that builds any part of the note — a refusal here can leave no partial file
    // because nothing has been composed. `(sha as unknown) ?? ""` covers the untyped caller who hands
    // across `undefined` or `null`; a padded or empty value fails the anchored allowlist.
    assertSingleLine("verdict sha", sha ?? "");
    assertHexScalar("verdict sha", sha ?? "");
    // REFUSE BEFORE COMPOSE (D-16). Placed above the first line that builds any part of the note, so
    // a refusal cannot leave a partial or zero-length note file behind — the only way to guarantee
    // "nothing was written" is to have composed nothing. Anything that is not EXACTLY the clean
    // sentinel lands here, including a value this file does not recognize: `finding`, `unknown`, a
    // misspelling, a wrong case, a non-string forced through by an untyped caller, and absence.
    // It returns rather than throws: a throw at the gate's terminal step is a crash where the
    // contract promises a degraded finding at `UNKNOWN - verify`.
    if (integrity !== TEST_INTEGRITY_CLEAN)
        return null;
    const note = {
        kind: "finding",
        by: GATE_IDENTITY,
        at,
        verified_by: "", // the gate is the root of trust (D-04) — its verdict stamps nothing above it
        confidence: "high",
        refs: [verdictStampFor(id)],
        supersedes: null,
        // The verdict records the commit it was performed at, and NOTHING else of the provenance
        // triple: `gate_run` names the run a piece of evidence points BACK at, and the verdict IS that
        // run; `content_hash` digests an artifact, and the verdict references none.
        sha,
    };
    const body = `${VERDICT_GREEN_MARKER}: the §14 quality gate run ${id} passed (all checks green).`;
    for (const r of note.refs)
        assertSingleLine("refs[]", r);
    // The verdict note carries its own frozen id (the same one in its <id>.md filename) — a single
    // source of identity, single-line-guarded like every other provenance field.
    const noteIdStr = noteId(note);
    assertSingleLine("id", noteIdStr);
    const text = composeNote(note, body, noteIdStr);
    return emitTrusted(GATE_IDENTITY, "emitVerdict", task, note, text, noteIdStr, contextRoot);
}
// ── emitTrusted — the ONE trusted-emission tail, shared by every reserved-identity emitter. ──────
//
// WHY IT IS ONE FUNCTION AND NOT A COPIED THREE LINES (plan 30-08). Composing a note and then
// validating it under a carve-out and then writing it is the exact sequence whose steps must not
// drift apart: a second emitter that validated with the wrong identity, or skipped the validation,
// or wrote past writeNoteFile, would be a second authority for the same rule — this repository's
// named failure class pointed at the one path that may author a reserved identity. So the sequence
// exists once, takes the claimed identity as an argument, and every reserved-identity emitter ends
// on this line. Adding an emitter therefore cannot add a way to write.
//
// It validates with the CLAIMED identity (never a blanket "trusted" flag), so an emitter that
// composed a note under the wrong reserved name is refused by the same impersonation rule that
// refuses an agent. It throws on an invalid note and writes NOTHING — a refusal here leaves no
// partial file, because nothing is written before the findings are known.
function emitTrusted(identity, emitterName, task, note, text, id, contextRoot) {
    if (note.by !== identity) {
        throw new Error(`context-io.${emitterName}: refusing to emit — the composed note is authored "${note.by}" ` +
            `while the emitter claims the reserved identity "${identity}". An emitter may only author ` +
            `its own identity.`);
    }
    const findings = validate(text, identity);
    if (findings.length > 0) {
        throw new Error(`context-io.${emitterName}: refusing to write an invalid note:\n${findings.join("\n")}`);
    }
    // Route through the SAME single write chokepoint as appendNote (R6-1): a reserved-identity emitter
    // is a SECOND direct note-file writer, so containment must live in the shared helper, not only in
    // appendNote. Every emitter reaches the chokepoint through this one line.
    writeNoteFile(join(contextRoot, task, "notes"), id, text);
    return id;
}
// ── The checkpoint trace (D-10 / D-11, plan 30-08) ───────────────────────────────────────────────
/**
 * The fixed task the PreToolUse checkpoint guard records under.
 *
 * A PreToolUse payload carries no task name — the hook is a per-tool-call process, not a step in a
 * ticket — so the task is a FIXED constant rather than something derived from a payload field an
 * agent controls. It satisfies the TASK_NAME_RE allowlist by construction, and it is one greppable
 * place a human or an auditor reads the checkpoint trace from.
 */
export const CHECKPOINT_TRACE_TASK = "checkpoint-trace";
/**
 * Write ONE checkpoint record into the shared verified context (D-10, D-11).
 *
 * TWO CASES, ONE WRITER. A lowering that WAS authorized allows the action and records that it did
 * (D-11); a lowering that was NOT authorized is refused and records the unauthorized declaration
 * (D-10). Both go through here, because "an agent that edits config alone is ineffective" and "…and
 * visible" are one promise, and a second writer for the second half is how the halves come apart.
 *
 * WHY THE BODY CARRIES THE NAMES AND THE FRONTMATTER DOES NOT. `authorizedBy` is a human name typed
 * into a shell — it may carry spaces, and the `human:<name>` stamp grammar does not admit them. A
 * stamp is therefore not where it goes: the note is a trusted emission (verified_by is empty, as the
 * gate's own verdict is), and the name appears VERBATIM in the body, unmangled, beside the variable
 * that carried it. Recording a mangled name in a provenance field would be worse than recording none.
 *
 * It THROWS on any failure — an unwritable directory, a field carrying a newline, a note the
 * validator refuses, or a field outside the vocabularies checked at the top of the body. It does not
 * swallow. The caller decides what a failure to record means, and the guard's answer is that an
 * unrecordable lowering is not a lowering (see hooks/guard.ts).
 *
 * ---------------------------------------------------------------------------------------------
 * THE TIER, STATED RATHER THAN PAPERED OVER (plan 30-11 round 2, `RA2-2`) — the paragraph
 * `emitVerdict` has carried since plan 30-05, owed here for the same reason.
 *
 * A `§checkpoint-guard` record written BY THE HOOK is written by a separate process whose
 * environment and invocation an agent's tool call cannot reach. That is what makes the hook's record
 * a fact about a decision a human's key did or did not authorize.
 *
 * This function is not that process. It is an exported function, and an importer may call it with
 * any content: an in-process caller can write `CHECKPOINT ALLOWED … command: "git push --force
 * origin main"` under the reserved identity with no guard running and nothing pushed, and the
 * resulting file is byte-indistinguishable from a real one. So the distinction between the tiers is
 * the CALLER, not the identity, and no reader should take the identity alone as evidence of a hook
 * run. The residual is that an in-process caller determined to lie can — named here rather than
 * claimed away, exactly as `emitVerdict` names its own.
 *
 * What the vocabulary checks below DO buy: a record under this identity always names a real
 * checkpoint, a real disposition and one of the two defined outcomes, so a forged record is
 * constrained to statements the design defines even when its content is false.
 * ---------------------------------------------------------------------------------------------
 */
/**
 * The ONE way an untrusted value reaches a checkpoint record's body (plan 30-11 round 3, `RA4-1`).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THE FIELD LOOP WAS THE WRONG AXIS.
 *
 * Round 2's refuse-before-compose block type-checked `actor` and `command` — the two fields that were
 * ALREADY passed through `JSON.stringify` — and left `envVarName` and `actionApproval`, the two
 * interpolated RAW, with no check of any kind. Measured on the round-2 artifact: a newline in
 * `envVarName` carrying a complete frontmatter block made the single written record parse, through
 * this module's own splitter, as **two notes** — the second authored `by: security-nfr` with a
 * `verified_by: human:alice` stamp. A record under the reserved identity was therefore NOT
 * "constrained to statements the design defines", which is the bound the tier paragraph publishes;
 * and the second note it carried was authored by a NON-reserved identity that no tier paragraph in
 * this module covers.
 *
 * The axis is not "which fields did someone remember to check". It is **how a value reaches the
 * body**: every value interpolated into the body goes through this function, and
 * `scripts/context-io.test.ts` asserts that this function's source contains no other `${input.`
 * interpolation site — so a field added later is covered by the rule rather than by a memory.
 * ---------------------------------------------------------------------------------------------
 */
function bodyValue(v) {
    return JSON.stringify(String(v));
}
/** The two outcomes a checkpoint record may state. Derived from the input type's own union. */
const CHECKPOINT_OUTCOMES = ["allowed", "refused"];
export function emitCheckpointNote(input, contextRoot = DEFAULT_CONTEXT_ROOT, at = new Date().toISOString(), task = CHECKPOINT_TRACE_TASK) {
    assertSafeTask(task);
    // ── REFUSE BEFORE COMPOSE, against the vocabularies that already exist (round 2, `RA2-3`). ──────
    //
    // This emitter validated the note's STRUCTURE and none of its content. Measured on the committed
    // artifact, every one of these was WRITTEN under the reserved identity and none was refused:
    // an off-roster checkpoint id published as a checkpoint; `outcome: "approved"` minted
    // `CHECKPOINT APPROVED`, a verdict word the design does not define; non-canonical `declared`
    // /`effective` values (`yes`, `maybe`); an empty checkpoint id; and a misspelled field name put the
    // literal string `undefined` into `refs`, which is a load-bearing provenance field the compaction
    // carve-out matches on.
    //
    // The TypeScript unions that were supposed to prevent this are ERASED in the compiled `.js`, and
    // the compiled `.js` is what a host runs — the artifact rule this whole surface is audited against.
    // So the check is at runtime, above the first line that builds any part of the note, exactly as
    // `emitVerdict` does it 150 lines above: the sibling emitter refuses the complement of one exact
    // string by rule and composes nothing before it decides, while this one composed everything and
    // decided nothing.
    //
    // Every accept set is DERIVED — `CHECKPOINTS` is the roster table, the disposition set is the
    // canonicalizer's own three values, and the outcome set comes off the input type's union — so none
    // of them is a second list beside the authority it mirrors.
    if (!CHECKPOINTS.includes(input.checkpoint)) {
        throw new Error(`context-io.emitCheckpointNote: refusing to emit — "${input.checkpoint}" is not a checkpoint ` +
            `on the roster. A record under the reserved identity may only name a checkpoint that exists.`);
    }
    for (const [field, value] of [
        ["declared", input.declared],
        ["effective", input.effective],
    ]) {
        if (!DISPOSITIONS.includes(value)) {
            throw new Error(`context-io.emitCheckpointNote: refusing to emit — ${field} is "${value}", which is not one ` +
                `of ${DISPOSITIONS.join("|")}. A record under the reserved identity may only state a ` +
                `disposition the canonicalizer admits.`);
        }
    }
    if (!CHECKPOINT_OUTCOMES.includes(input.outcome)) {
        throw new Error(`context-io.emitCheckpointNote: refusing to emit — outcome is "${input.outcome}", which is ` +
            `not one of ${CHECKPOINT_OUTCOMES.join("|")}. A record under the reserved identity may not ` +
            `mint a verdict word the design does not define.`);
    }
    // ── ONE RULE FOR EVERY BODY FIELD (plan 30-11 round 4, `RA6-4`). ────────────────────────────
    //
    // Round 3 closed `RA2-3` with a TYPE refusal over `actor`/`command`/`authorizedBy`, and closed
    // `RA4-1` with a SINGLE-LINE refusal over `envVarName`/`actionApproval`. Two fixes, each covering
    // one field-set on one axis — and the remaining cell was open: `assertSingleLine` does not refuse a
    // non-string, because `/[\r\n]/.test(undefined)` coerces to the string `"undefined"` and passes.
    // Measured: `actionApproval: undefined` WROTE the record, minting the sentence
    // `- action approved by: undefined was set by a human` under the reserved identity. That line is
    // the record's assertion that a human set an approval; a missing field minted it rather than
    // refusing, and no reader or test can tell the forged line from a real one.
    //
    // The axis is "is this a field of the record", not "which fields did which round remember". One
    // loop, both rules, and the nullable set is DERIVED from the input type's own optionality rather
    // than hand-listed — `scripts/context-io.test.ts` asserts the loop covers exactly the fields the
    // body interpolates.
    const NULLABLE_BODY_FIELDS = new Set(["envVarName", "actionApproval", "authorizedBy"]);
    for (const field of ["envVarName", "actionApproval", "authorizedBy", "actor", "command"]) {
        const value = input[field];
        if (value === null && NULLABLE_BODY_FIELDS.has(field))
            continue;
        if (typeof value !== "string") {
            throw new Error(`context-io.emitCheckpointNote: refusing to emit — ${field} is ${value === undefined ? "undefined" : typeof value}, not a string. A misspelled or missing caller field reaches the record as the literal text ` +
                `"undefined", and this record's whole value is that its sentences are true.`);
        }
        assertSingleLine(field, value);
    }
    const note = {
        kind: "finding",
        by: CHECKPOINT_GUARD_IDENTITY,
        at,
        // The guard is a root of trust exactly as the §14 gate is (see CHECKPOINT_GUARD_IDENTITY):
        // its record stamps nothing above it, so it carries no verified_by of its own.
        verified_by: "",
        confidence: "high",
        refs: [input.checkpoint],
        supersedes: null,
    };
    // THE THREE UNTRUSTED VALUES ARE QUOTED, NOT INTERPOLATED RAW. `command` is agent-authored text
    // and `actor` comes off the same payload; `authorizedBy` is whatever a human typed into a shell.
    // Any of them may carry a newline, and a newline in a note BODY can spell a `---` fence line — the
    // shape that makes one file read as two notes to anything that splits a stream. JSON.stringify
    // renders each on ONE line with its newlines escaped and its quotes visible, so the recorded value
    // is exactly the value, and the record's own structure is not something the command can rewrite.
    const authorization = input.authorizedBy === null
        ? input.envVarName === null
            ? "not applicable (this checkpoint is not floor-tier and needs no second key)"
            : `NONE — ${input.envVarName} is absent, so the declaration authorized nothing`
        : `${input.envVarName}=${bodyValue(input.authorizedBy)}`;
    const body = `CHECKPOINT ${input.outcome.toUpperCase()}: the checkpoint "${input.checkpoint}" was declared ` +
        `\`${input.declared}\` and enforced as \`${input.effective}\`.\n\n` +
        `- checkpoint: ${input.checkpoint}\n` +
        `- declared: ${input.declared}\n` +
        `- effective: ${input.effective}\n` +
        `- authorized by: ${authorization}\n` +
        (input.actionApproval === null
            ? ""
            : `- action approved by: ${input.actionApproval} was set by a human, which approves THIS ` +
                `action at the enforced posture — it does not authorize the declared lowering\n`) +
        `- actor: ${bodyValue(input.actor)}\n` +
        `- command: ${bodyValue(input.command)}\n`;
    for (const r of note.refs)
        assertSingleLine("refs[]", r);
    const id = noteId(note);
    assertSingleLine("id", id);
    const text = composeNote(note, body, id);
    return emitTrusted(CHECKPOINT_GUARD_IDENTITY, "emitCheckpointNote", task, note, text, id, contextRoot);
}
// ── Governance high-severity roles (D-06) ───────────────────────────────────────────────────────
// Severity is the AUTHORING ROLE, read from the note's `by` scalar via the canonical parseNote —
// there is NO self-declared `severity:` note field (it would be gameable downward, D-06). A finding
// authored by one of these three roles is a high-severity governance entry: a security/NFR finding,
// an architecture decision, or a release verdict. The admission-guard hook (Plan 25-02) classifies
// from this SAME set, so the in-script tier and the hook tier cannot diverge.
const HIGH_SEVERITY_ROLES = ["security-nfr", "architect-design", "release-manager"];
// ── The single global governance audit-ledger path (GOV-02, D-08) ───────────────────────────────
// Under audit_retention: retained, admit() appends one admission-record event here. One durable
// end-to-end auditor trail (OQ-2). This is the governance RECORD ledger — NOT a note-body store and
// NOT a compaction artifact (D-09): it never touches the compaction code path.
const AUDIT_LEDGER_RELPATH = [".grugops", "audit", "admissions.jsonl"];
/**
 * The ceiling on a GOV-02 ledger, on BOTH sides (31-21; reconciled by 31-29, CR-19). Stated for
 * this artifact rather than shared with the note or config ceilings: an append-only JSONL trail
 * grows in ordinary use, so its ceiling is a deliberate operational limit and not a copy of
 * somebody else's number.
 *
 * EXPORTED for the same reason `NOTE_FILE_MAX_BYTES` is: the append side and the read side must
 * read ONE binding, and the derived ceiling-site assertion in `scripts/context-io.test.ts` can only
 * prove that about a name it can import.
 */
export const AUDIT_LEDGER_MAX_BYTES = 64 * 1024 * 1024;
// ── admit: the context-aware admission cross-check (D-01/D-10 — the ONLY context-reading path). ──
// Given a candidate note text for a task, run the structural validate() first; then, only when the
// note is a `finding` carrying a §14-gate#<id> stamp, cross-check that <id> against a LIVE GREEN
// verdict record under the task (Posture B — format-trust alone is refused). Returns a findings
// array (empty = admitted). A `human:<name>` stamp passes structurally and is NOT gate-cross-checked
// here; its un-forgeable enforcement is the separate PreToolUse `admission-guard` hook, which reads
// the human-set session variable and denies an un-approved high-severity admission (the agent's own
// child env can never reach that variable). Keeping this a DISTINCT function preserves the D-10
// separation: validate() stays pure; only admit() reads context; the hook holds the human gate.
//
// GOVERNANCE TIERS (Plan 25-03):
//   - D-04 in-script refusal (defense-in-depth): when human_admission ≠ off, a high-severity finding
//     (by ∈ HIGH_SEVERITY_ROLES) lacking a human:<name> stamp is refused, NAMING the fault — exactly
//     like the validate() refuse-self set, NEVER rewriting the note (the no-fabrication floor). This
//     is the WEAKER, self-settable tier (D-05): an in-script check is settable in admit()'s own child
//     env, so it covers the four non-CC CLIs at the script level but is NOT the un-forgeable primary
//     (that is the separate admission-guard hook, Plan 25-02). The dial is read via the shared
//     discriminated reader — the SAME read path the hook uses — so the two tiers cannot diverge (OQ-3).
//   - D-14 (Plan 30-03) unreadable-config refusal: a config file that EXISTS but cannot be read or
//     parsed refuses the admission and degrades the finding to `UNKNOWN - verify`. See the block at
//     the governance read below for why this is not scoped to high-severity roles.
//   - GOV-02 audit ledger: under audit_retention: retained, a successful admission appends one
//     fixed-key JSONL event to the single global .grugops/audit/admissions.jsonl. Under git (the lean
//     default) nothing new is written (the audit stays implicit in git history).
//
// repoRoot resolves BOTH the governance config (readGovernanceConfig) AND the audit-ledger location;
// it defaults to the script's own repo root (ROOT). Tests pass an explicit temp root.
export function admit(task, text, contextRoot = DEFAULT_CONTEXT_ROOT, repoRoot = ROOT, 
// ── THE DIAL AND THE RECORD ARE TWO QUESTIONS, AND THEY NOW HAVE TWO PARAMETERS (31-39, CR-27 /
// D-39). `repoRoot` above answers the governance DIAL and nothing else: it decides whether this
// note may land at all, and therefore decides where NOTHING lands. This parameter names the
// repository whose audit trail RECORDS the admission once the dial has said yes.
//
// WHY THEY WERE ONE, AND WHAT THAT COST, MEASURED. Until this plan `repoRoot` answered both, and
// `R-31-33-01` published the exposure with the price of closing it written at the freeze.
// `promoteAdmitted`'s fall-through then aimed the RECORD at its derived destination — correct,
// and CR-22's fix — and the DIAL rode the same argument and moved with it. Reproduced at the
// round-8 base: a trusted root whose own configuration EXISTS and is unparseable, which D-14
// requires a fail-closed refusal for, ADMITTED the write when the caller named a different,
// permissively-configured destination, and REFUSED the identical note when the destination was
// the caller's own store.
//
// THE DEFAULT IS THE ANSWERED OWNER OF THE DIAL ROOT, so every existing three- and
// four-argument caller keeps its exact present behaviour: the record follows `repoRoot` unless a
// caller deliberately names somewhere else. That is what makes this unfreeze byte-behaviour-safe
// for every call site that does not opt in.
//
// A CALLER MAY AIM THIS AND MAY NOT AIM THE DIAL. Routing the dial through a caller-supplied
// destination reverses `D-31` and `WR-10` and would need its own dated human decision; D-39
// RESTORES the trusted dial answer rather than reversing it.
ledgerOwner = answeredOwner(repoRoot)) {
    assertSafeTask(task);
    // Structural gate first: a structurally invalid note is never admitted (D-11 strict-reject).
    const findings = validate(text);
    if (findings.length > 0)
        return findings;
    const parsed = parseNote(text);
    if (!parsed)
        return ["admission FAIL: no YAML frontmatter fence (--- ... ---) found"];
    const { scalars } = parsed;
    // Only a gate-stamped finding triggers the verdict cross-check (D-01). A human:<name> finding is
    // structurally valid and admitted without a gate cross-check (D-07). Soft kinds carry no stamp.
    const vb = (scalars.verified_by ?? "").trim();
    if (scalars.kind === "finding" && GATE_STAMP_RE.test(vb)) {
        const id = vb.slice(`${GATE_IDENTITY}#`.length);
        const live = currentState(readContext(task, contextRoot));
        const matched = live.some((n) => isLiveGreenVerdict(n, id));
        if (!matched) {
            return [
                `admission FAIL: no live green §14-gate verdict found for "${verdictStampFor(id)}" under ` +
                    `task "${task}". A finding stamped §14-gate#${id} is admitted only when a real green ` +
                    `gate verdict with that per-run id exists in the task context (Posture B).`,
            ];
        }
    }
    // ── D-03 (Phase 31): an artifact-ref is bound to the commit its gate run was performed at ──────
    //
    // THE SIBLING BRANCH, AND THE ONLY IMPLEMENTATION OF THIS PREDICATE. A piece of UAT evidence
    // names a gate run; that run was performed at one commit; evidence claiming a different commit is
    // not evidence of that run. The comparison lives HERE, at write time, and nowhere else — the §14
    // gate performs no SHA pre-check before or after it emits its verdict (D-03). Two code paths
    // deciding one question is this repository's named failure class; one authority means there is
    // nothing to drift.
    //
    // It compares two RECORDED strings and never shells out to git (research Open Question 2). An
    // `admit()` that confirmed the recorded HEAD was a real commit would put an I/O failure mode
    // inside a path whose whole contract is "refuse cleanly, write nothing".
    //
    // All three arms REFUSE. The middle one is the one worth naming: a verdict that recorded no SHA
    // at all — one minted before this change, or hand-written onto disk — leaves the evidence
    // UNBINDABLE, and an unbindable artifact-ref is refused rather than passed through (T-31-05). A
    // fall-through there would be exactly the "skipped verification reported as a pass" this path
    // exists to prevent.
    if (scalars.kind === "artifact-ref" && (scalars.gate_run ?? "").trim() !== "") {
        const runId = (scalars.gate_run ?? "").trim();
        const evidenceSha = (scalars.sha ?? "").trim();
        const live = currentState(readContext(task, contextRoot));
        const matches = live.filter((n) => isLiveGreenVerdict(n, runId));
        if (matches.length === 0) {
            return [
                `admission FAIL: no live green §14-gate verdict found for "${verdictStampFor(runId)}" ` +
                    `under task "${task}". An artifact-ref naming gate_run "${runId}" is evidence only when ` +
                    `a real green gate verdict with that per-run id exists in the task context.`,
            ];
        }
        // AMBIGUITY REFUSES, IN BOTH DIRECTIONS (red-team round 1). The refusal below says "THE live
        // green verdict", and with two of them there is no such thing. Taking the first match would
        // resolve the question by replay order, so evidence claiming EITHER recorded SHA would admit —
        // measured, before this arm existed. A per-run id is minted from node:crypto per gate run, so a
        // duplicate is not a shape the gate produces; when one appears anyway the honest answer is that
        // this evidence cannot be bound, which is the posture every other arm here keeps.
        if (matches.length > 1) {
            return [
                `admission FAIL: more than one live green §14-gate verdict exists for ` +
                    `"${verdictStampFor(runId)}" under task "${task}" (${matches.length} found), so there is ` +
                    `no single commit this artifact-ref can be bound to. A per-run id names one gate run; ` +
                    `the evidence is refused and nothing is written until the duplicate is superseded.`,
            ];
        }
        const verdict = matches[0];
        const verdictSha = (verdict.sha ?? "").trim();
        if (verdictSha === "") {
            return [
                `admission FAIL: the live green §14-gate verdict for "${verdictStampFor(runId)}" under ` +
                    `task "${task}" recorded no commit SHA, so this artifact-ref cannot be bound to the ` +
                    `commit that gate run was performed at. The evidence is refused and nothing is written — ` +
                    `an unbindable artifact-ref is never admitted as a pass.`,
            ];
        }
        if (verdictSha !== evidenceSha) {
            return [
                `admission FAIL: this artifact-ref records sha "${evidenceSha}" while the live green ` +
                    `§14-gate verdict for "${verdictStampFor(runId)}" under task "${task}" was performed at ` +
                    `sha "${verdictSha}". Evidence is bound to the commit its gate run ran against; a ` +
                    `mismatch is refused and nothing is written.`,
            ];
        }
    }
    // ── D-04 governance defense-in-depth refusal (the weaker, self-settable tier, D-05) ────────────
    // Read the human_admission dial via the ONE shared path (OQ-3). When the dial is on (≠ off) and
    // this is a high-severity governance finding (by ∈ HIGH_SEVERITY_ROLES) that carries NO human:<name>
    // disposition, REFUSE and name the fault — mirroring the validate() refuse-self set exactly. We push
    // a finding; we NEVER silently rewrite the note (the no-fabrication floor). The dials only ADD this
    // refusal; there is no value that removes a floor refusal (SC3).
    //
    // ── D-14 (Plan 30-03): an UNREADABLE config REFUSES the write and degrades ─────────────────────
    // admit() reads the ONE discriminated reader, which distinguishes a genuinely ABSENT config (stay
    // lean — the zero-config contract, SC2) from a config file that EXISTS at a standard location but
    // cannot be read or parsed. The fail-OPEN value reader admit() used before Plan 30-03 collapsed
    // those two into the same lean default, so a corrupt config silently ADMITTED what the dial would
    // otherwise have gated (measured RED at 30-03: findings came back EMPTY, it did not even throw).
    // An unknown dial is not a lean dial. We refuse, we write NOTHING (no note, no ledger event), and
    // we degrade the finding to `UNKNOWN - verify` — the same posture a non-green gate already
    // produces (Phase 21), never a fabricated pass. The refusal is NOT scoped to high-severity roles:
    // scoping it would leave the fail-open standing for every routine admission, which is most of them.
    //
    // IT MUST NOT THROW. The contract here promises a degraded finding, and a crash is not one. The
    // reader does not throw today; a throw is nonetheless caught and lands on the SAME refusal branch
    // rather than on a second reconstructed result shape — a read that failed is a read that failed.
    let govResult = null;
    try {
        govResult = readGovernanceConfig(repoRoot);
    }
    catch {
        govResult = null;
    }
    if (govResult === null || govResult.source === "unreadable") {
        return [
            `admission REFUSED (UNKNOWN - verify): a governance configuration file exists at a standard ` +
                `location but could not be read or parsed, so the human_admission dial is UNKNOWN. This ` +
                `admission is refused and nothing is written — no note, no audit-ledger event — and the ` +
                `finding stays "UNKNOWN - verify" until a human repairs the configuration. An unreadable ` +
                `dial is never degraded to the lean "off" default; reading it as off is the fail-open this ` +
                `refusal closes (D-14). A genuinely ABSENT config is a different case and still runs lean.`,
        ];
    }
    const gov = govResult.config;
    // SINGLE-SOURCE high-severity classification (round-8 GAP-R7-1 Lever-2). admit()'s D-04 backstop now
    // classifies severity through the ONE classifier isHighSeverityRole — NOT a separate inline
    // `.trim().toLowerCase()` membership test. isHighSeverityRole is a STRICT SUPERSET of the former check:
    // it NFKC-folds, strips ALL whitespace AND zero-width code points, then lowercases, so it catches the
    // internal-space / NFKC / zero-width / case `by` variants the former edges-only trim missed (e.g.
    // `by:"security- nfr"`). Routing admit()'s D-04 through the same classifier isGatedNote and the hook
    // use means the in-script tier and the gate tier cannot diverge — there is no weaker duplicate left to
    // drift. This DELIBERATELY UNFREEZES admit() (D-12: the byte-freeze had frozen a strictly-weaker
    // duplicate `by` classifier — the GAP-R7-1 Lever-2 trap); the freeze re-locks at the new baseline so
    // any FUTURE drift to admit() still goes RED. scalars.kind is parseNote's already-normalized output
    // (the kind authority), so the finding guard consumes the canonical value. The original `by` is
    // preserved verbatim in the refusal message below.
    const isHighSeverity = scalars.kind === "finding" && isHighSeverityRole(scalars.by ?? "");
    // Under an active dial (≠ off), a high-severity finding is refused at this in-script tier when it
    // lacks a named human disposition. CRITICAL (the 25-04 forged-stamp backstop, GAP1): the refusal
    // must fire for BOTH a finding with NO human:NAME stamp AND a finding carrying a SELF-AUTHORED
    // human:NAME stamp. admit() is the weaker, self-settable tier (D-05) — it cannot itself verify
    // that a human:NAME stamp was placed by a real human, so it cannot honor a self-authored
    // high-severity human stamp. The ONLY path that grants a high-severity admit is the un-forgeable
    // admission-guard hook, which reads the human-set session env the agent's child env cannot reach.
    // Previously this branch fired only on a MISSING stamp (!HUMAN_STAMP_RE.test(vb)), so a forged
    // `verified_by: human:eve` passed at every dial (verified RED in 25-04-RED-baseline.txt). Now a
    // high-severity finding under an active dial is refused regardless of a self-authored human stamp;
    // we NAME the fault and NEVER rewrite the note (the no-fabrication floor). The hook stays the only
    // grant path; a hook-disposed admit never reaches admit() with an un-gated high-severity finding.
    if (isHighSeverity && gov.human_admission !== "off") {
        const hasHumanStamp = HUMAN_STAMP_RE.test(vb);
        const fault = hasHumanStamp
            ? `carries a self-authored human disposition stamp (verified_by: ${vb}) that this in-script ` +
                `tier cannot verify was placed by a real human. A high-severity admission is granted ONLY ` +
                `through the un-forgeable admission-guard hook (a human exports the approval in the launching ` +
                `shell); a self-authored human:NAME stamp does not satisfy it.`
            : `requires a named human disposition (verified_by: human:NAME) under the active ` +
                `human_admission setting, granted through the un-forgeable admission-guard hook.`;
        return [
            `admission REFUSED (human_admission: ${gov.human_admission}): a high-severity governance entry ` +
                `authored by "${(scalars.by ?? "").trim()}" (security, architecture, or release) ${fault} ` +
                `Admission is refused until a named human disposes it through the hook. This is the in-script ` +
                `defense-in-depth tier; on Claude Code the un-forgeable gate is the separate admission-guard hook.`,
        ];
    }
    // ── GOV-02 audit ledger (retained mode only) ───────────────────────────────────────────────────
    // Admission is decided (no findings remain → admitted). Under audit_retention: retained, append ONE
    // fixed-key JSONL event recording the admission RECORD — never the note body (D-09), never the
    // compaction path. Under git (lean default) write nothing new.
    //
    // THE OWNER IS CONSUMED HERE, AT THE POINT OF EFFECT, AND DERIVED AT EACH ROUTE'S ENTRY (31-39,
    // D-39). A note and a GOV-02 record are two halves of ONE action only when a record is actually
    // written, and that is exactly `audit_retention: retained`. So the refusal for an unnameable
    // owner belongs at THIS line rather than at the entry: under the lean value nothing is recorded,
    // the action has one half, and there are no two halves to key on two repositories — measured, at
    // the round-8 base, as "no ledger line in ANY root". The DERIVATION still sits at each route's
    // entry, above every branch, which is `D-34 (1)` unchanged.
    //
    // WHY IT IS SCOPED AT ALL, WITH THE NUMBER THAT SCOPED IT. Refusing every ungoverned
    // `contextRoot` unconditionally is the adjacent alternative `D-34` measured at 121 `appendNote`
    // and 26 `admitAndAppend` call sites and rejected. The scoped form's own cost was measured
    // against this tree before it was taken and is recorded in `D-39`.
    if (gov.audit_retention === "retained") {
        if (!ledgerOwner.answered) {
            return [unnameableOwnerRefusal(ledgerOwner.store)];
        }
        appendAuditLedger(ledgerOwner.root, scalars, isHighSeverity, vb);
    }
    return [];
}
// ── appendAuditLedger: append one fixed-key admission-record event (GOV-02, D-08/D-09/D-10). ─────
// The sole sanctioned writer of the governance audit ledger. It records the admission RECORD only —
// id / kind / by / severity / verified_by / disposed_by / at — NOT the note body and with NO overlap
// with the compaction (note-body verbosity) code path. The fixed key order mirrors the toJsonl()
// discipline so each line is byte-reproducible. The .grugops/audit/ directory is created on demand.
function appendAuditLedger(repoRoot, scalars, isHighSeverity, verifiedBy, reBound = false) {
    const auditDir = join(repoRoot, AUDIT_LEDGER_RELPATH[0], AUDIT_LEDGER_RELPATH[1]);
    const ledgerPath = join(auditDir, AUDIT_LEDGER_RELPATH[2]);
    mkdirSync(auditDir, { recursive: true });
    // disposed_by: the named human who disposed a high-severity entry (human:NAME), else null. Derived
    // from the admitting stamp — NOT a separate note field.
    const disposedBy = HUMAN_STAMP_RE.test(verifiedBy) ? verifiedBy : null;
    // severity is the CLASSIFICATION derived from `by` (D-06), not a note-body field.
    const event = {
        id: scalars.id ?? "",
        kind: scalars.kind ?? "",
        by: (scalars.by ?? "").trim(),
        severity: isHighSeverity ? "high" : "routine",
        verified_by: verifiedBy,
        disposed_by: disposedBy,
        at: scalars.at ?? "",
    };
    // Append-only: never truncate or rewrite a prior line. JSON.stringify of the literal above fixes
    // the key order, so the line is byte-reproducible (the toJsonl shape).
    //
    // `re_bound` is APPENDED AFTER the fixed seven, and ONLY when a re-binding asked for it (31-18,
    // WR-18). Every event a fresh admission writes therefore produces the identical seven-key line it
    // produced before this change — the field is ABSENT rather than `false`, which is asserted
    // byte-for-byte rather than claimed — while a re-bound event stays distinguishable from a fresh
    // one for any reader of the ledger.
    // THE APPEND CANNOT BLOCK (31-21, CR-12's class at the write side). `appendFileSync` here was
    // MEASURED wedging both `admit` and `admitAndAppend` on a FIFO ledger at exit 124. The throw is
    // caught by each caller and turned into a REFUSAL: under `retained` the operator declared that
    // admissions are recorded, so an admission that cannot be recorded is not granted.
    //
    // THE APPEND IS BOUNDED BY THE SAME CONSTANT THE LOOK READS (31-29, CR-19). The ceiling refusal
    // is republished here under this position's own clause, because a clause is a statement in the
    // caller's register and `LEDGER_ABOVE_CEILING_CLAUSE` is what a reader of a ledger refusal looks
    // up. The condition itself is decided once, by the write authority's fstat.
    try {
        appendRegularFileLine(ledgerPath, JSON.stringify(reBound ? { ...event, re_bound: true } : event) + "\n", "GOV-02 audit ledger", AUDIT_LEDGER_MAX_BYTES);
    }
    catch (e) {
        if (e instanceof ReadPositionRefusal && e.condition === "above-ceiling") {
            throw new Error(`context-io.appendAuditLedger: refusing to append (${LEDGER_ABOVE_CEILING_CLAUSE}) — the ` +
                `GOV-02 audit ledger at "${ledgerPath}" is at or above the ${AUDIT_LEDGER_MAX_BYTES}-byte ` +
                `ceiling every reader of it enforces, so a further line would grow a trail nobody can ` +
                `read. Nothing was appended. Underlying reason: ${e.message}`);
        }
        throw e;
    }
}
/**
 * Does the destination repository's GOV-02 ledger already carry an event keyed by this note id?
 *
 * 31-18 (WR-18 (b)): D-19 (4) decided that a re-binding appends no audit event, on the premise that
 * "the origin's admission already recorded this exact id and the named human who disposed it".
 * NOTHING CHECKED THAT PREMISE, and the round-4 review named three conditions under which it is
 * false — the origin write happened under a different `repoRoot`, or before `audit_retention` was
 * `retained`, or through a hand-authored origin. In `retained` mode the destination repository could
 * therefore gain a high-severity human-disposed finding with no ledger line anywhere in it, which is
 * the repudiation shape this requirement exists to prevent. So the premise became a LOOK.
 *
 * AN UNREADABLE LEDGER IS A REFUSAL, NOT A SILENCE (31-21, WR-22 (2) / D-24). This function used to
 * answer `false` for an unreadable or EACCES ledger, on the reasoning that a duplicate line is a
 * legible redundancy while a missing line is a silent gap. That reasoning inverted the direction it
 * meant to take: the CALLER'S RESPONSE TO "not recorded" IS TO APPEND, so a fail-OPEN read
 * MANUFACTURES the duplicate event keyed on one id that D-19 (4) exists to prevent — the exact
 * duplicate 31-09 collapsed. "Absent" and "unreadable" are different questions with different safe
 * answers: an absent ledger honestly records nothing about this id and returns `false`; a ledger
 * that IS there and cannot be read is a fact this route does not know, and the safe answer to an
 * unknowable audit trail is to REFUSE the write rather than to guess about it. The throw becomes
 * `promoteAdmitted`'s `unreadable-audit-ledger` decline, raised before anything is written.
 *
 * The read goes through the module's ONE non-blocking reader, so the ledger path — like the note
 * path — cannot block. Measured pre-fix with a FIFO at `<repoRoot>/.grugops/audit/admissions.jsonl`:
 * `timeout 15` → exit 124, with the destination note ALREADY written.
 */
function ledgerRecordsId(repoRoot, id) {
    const ledgerPath = join(repoRoot, AUDIT_LEDGER_RELPATH[0], AUDIT_LEDGER_RELPATH[1], AUDIT_LEDGER_RELPATH[2]);
    // `null` is the ONLY absence: the ledger is genuinely not there, which records nothing about this
    // id. Every other shape throws, in bounded time, and the caller declines on it.
    const raw = readRegularFileOrNull(ledgerPath, AUDIT_LEDGER_MAX_BYTES, "GOV-02 audit ledger");
    if (raw === null)
        return false;
    for (const line of raw.split("\n")) {
        if (line.trim() === "")
            continue;
        try {
            if (JSON.parse(line).id === id)
                return true;
        }
        catch {
            continue; // an unparseable line records nothing about this id
        }
    }
    return false;
}
// ── cell(): escape free-text before it enters a pipe-delimited markdown table cell (T-20-02). ───
// Cloned from generate-catalog.ts: backslash first, then pipe, then flatten newlines to a space.
function cell(s) {
    return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
// ── First line of a body, for a compact excerpt in the index.md table. ──────────────────────────
function bodyExcerpt(body) {
    return body.trim().split("\n")[0]?.trim() ?? "";
}
// ── Deterministic JSONL event line: FIXED key order, body excluded (event index only). ──────────
// The evidence-provenance fields are APPENDED after `supersedes`, in the fence's own order, and
// only when the record carries them — the same presence condition the composer emits on, so a
// note's JSONL line and its fence never disagree about which fields exist. Every note that carries
// none produces the identical eight-key line it produced before Phase 31; the JSON key order is
// fixed by insertion order here, so the line stays byte-reproducible either way.
function toJsonl(n) {
    const event = {
        id: n.id,
        kind: n.kind,
        by: n.by,
        at: n.at,
        verified_by: n.verified_by,
        confidence: n.confidence,
        refs: n.refs,
        supersedes: n.supersedes,
    };
    if (n.sha !== undefined && n.sha !== "")
        event.sha = n.sha;
    if (n.gate_run !== undefined && n.gate_run !== "")
        event.gate_run = n.gate_run;
    if (n.content_hash !== undefined && n.content_hash !== "")
        event.content_hash = n.content_hash;
    return JSON.stringify(event);
}
// ── render: read notes/ → emit byte-reproducible index.md + index.jsonl (SCTX-03/04). ──────────
// Sorted by at (ISO lexicographic) with note-id tiebreak; no wall-clock timestamps of its own;
// single trailing newline. Superseded notes are folded out of the live state and listed in a
// history section so the audit trail stays visible. Conforms to task-notes.template.md.
export function render(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const taskDir = join(contextRoot, task);
    // ONE WALK, TWO VIEWS (31-29, IN-14). `render` reads the skips as well as the notes, so an entry
    // that was in the directory and is not in the output is LEGIBLE rather than absent.
    const read = readRawNotesWithSkips(task, contextRoot);
    const all = read.notes.map((raw) => recordFromParsed(raw.parsed, raw.id));
    // Deterministic order for ALL notes (drives both the JSONL emit and the supersede fold).
    const ordered = [...all].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
    const supersededIds = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
    const live = ordered.filter((n) => !supersededIds.has(n.id));
    const history = ordered.filter((n) => supersededIds.has(n.id));
    // ── index.jsonl: one event line per note, in the deterministic order, body excluded. ──
    const jsonlLines = ordered.map(toJsonl);
    jsonlLines.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(taskDir, "index.jsonl"), jsonlLines.join("\n"));
    // ── index.md: generated header + title + current-state table + history table. ──
    const md = [];
    md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/context-io.js render <task> -->");
    md.push(`# Context: ${cell(task)}`);
    md.push("");
    md.push("## Current state");
    md.push("");
    md.push("| at | kind | by | confidence | verified_by | note |");
    md.push("| --- | --- | --- | --- | --- | --- |");
    for (const n of live) {
        md.push(`| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(n.confidence)} | ` +
            `${cell(n.verified_by)} | ${cell(bodyExcerpt(n.body))} |`);
    }
    // ── Evidence provenance, rendered as its OWN conditional section (Phase 31) ──
    // The current-state table's columns are fixed and every existing render depends on them, so the
    // three fields get a section of their own rather than three more columns on every row. It is
    // emitted only when some live note carries provenance, in the same shape the history section
    // already uses — so a task holding no evidence renders byte-for-byte what it rendered before.
    // Field order matches the fence and the JSONL line: sha, then gate_run, then content_hash.
    const provenanced = live.filter((n) => (n.sha ?? "") !== "" || (n.gate_run ?? "") !== "" || (n.content_hash ?? "") !== "");
    if (provenanced.length > 0) {
        md.push("");
        md.push("## Evidence provenance");
        md.push("");
        md.push("| at | kind | by | sha | gate_run | content_hash |");
        md.push("| --- | --- | --- | --- | --- | --- |");
        for (const n of provenanced) {
            md.push(`| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(n.sha ?? "")} | ` +
                `${cell(n.gate_run ?? "")} | ${cell(n.content_hash ?? "")} |`);
        }
    }
    if (history.length > 0) {
        md.push("");
        md.push("## Superseded (history)");
        md.push("");
        md.push("| at | kind | by | superseded-by | note |");
        md.push("| --- | --- | --- | --- | --- |");
        // For each superseded note, name the latest note that supersedes it (deterministic).
        for (const n of history) {
            const supersededBy = ordered
                .filter((o) => o.supersedes === n.id)
                .map((o) => o.id)
                .sort()
                .join(", ");
            md.push(`| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(supersededBy)} | ` +
                `${cell(bodyExcerpt(n.body))} |`);
        }
    }
    // ── SKIPPED ENTRIES ARE REPORTED, NOT SILENT (31-29, IN-14 / R-31-21-02). ──────────────────────
    //
    // Three different facts shared one `catch { continue; }` and produced one indistinguishable
    // silence: a file that never was a note, a position occupied by something that is not a regular
    // file, and a note that vanished between the listing and the read. Measured before this change —
    // all three produced a zero-length read, zero rows and no diagnostic of any kind.
    //
    // The section is CONDITIONAL, so a task with nothing skipped renders byte-for-byte what it
    // rendered before this plan. The arms are emitted in `NOTE_SKIP_ARMS` order and the files sorted
    // within each, so the output stays byte-reproducible — `render`'s whole contract.
    if (read.skipped.length > 0) {
        md.push("");
        md.push("## Skipped entries");
        md.push("");
        md.push(`${read.skipped.length} entr${read.skipped.length === 1 ? "y" : "ies"} in this task's ` +
            `notes/ directory ${read.skipped.length === 1 ? "was" : "were"} not read as a note. A ` +
            `position occupied by something that is not a regular file is not the same event as a ` +
            `file that was never a note, so each is named by its own arm.`);
        md.push("");
        md.push("| entry | arm | detail |");
        md.push("| --- | --- | --- |");
        for (const arm of NOTE_SKIP_ARMS) {
            for (const entry of read.skipped
                .filter((s) => s.arm === arm)
                .sort((a, b) => a.file.localeCompare(b.file))) {
                md.push(`| ${cell(entry.file)} | ${cell(entry.arm)} | ${cell(entry.detail)} |`);
            }
        }
    }
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(taskDir, "index.md"), md.join("\n"));
}
// ── readGovernanceConfig — THE governance config-read path. One reader. (GOV-01/GOV-02, AUTO-06) ──
//
// This is the ONE config-read the admission-guard hook (25-02), the prod-deploy guard's matrix read
// (30-01), the in-script admit() refusal (25-03 / 30-03 D-14) and admitAndAppend() (25-09) all
// consume, so no two governance read paths can diverge (OQ-3).
//
// THERE WAS A SECOND READER, AND PLAN 30-03 DELETED IT (D-12). Until this plan the module exported a
// pair: a value-only reader under THIS name, returning `{human_admission, audit_retention}` and
// failing OPEN to the lean default, and a `…Result`-suffixed sibling returning the discriminated shape
// and failing CLOSED. Two functions answering the same question is the second-authority shape this tree has
// paid for repeatedly, and the pair had already diverged in the way that matters: the fail-open half
// could not distinguish an ABSENT config from an UNREADABLE one, so admit() — its only consumer —
// silently admitted on a corrupt config. The fail-open reader was NOT deleted and replaced by a
// stricter one; the surviving function IS the discriminated reader, renamed, with the fail-open
// reader's one legitimate job (the lean default on a genuinely absent config) still done here, on the
// `source: "absent"` branch, and its illegitimate one (leaning on an unparseable file) given the
// explicit landing place D-14 specifies at admit()'s own call site. NO third reader may be added as a
// convenience wrapper over this one: a wrapper is a second authority wearing a smaller name.
//
// Semantics (D-11, read-at-use / default-on-absent — see agent-factory/config/factory.config.md):
//   - A missing config file, an absent `context` object, or an absent key all degrade to the LEAN
//     DEFAULT for that key (human_admission→"off", audit_retention→"git"). Zero-config runs lean.
//   - A config file that EXISTS but cannot be read or parsed is `source: "unreadable"` — NOT lean.
//     Every consumer treats it as `block`/gate-or-stricter: `isGatedNote` gates it (SC3), the
//     checkpoint matrix comes back at the roster default (every entry `block`), and admit() refuses
//     and degrades to `UNKNOWN - verify` (D-14).
//   - A value that IS present is returned VERBATIM. The reader does NOT validate it against the
//     allowed set; the consumer (hook / admit / floor-sweep) decides. Returning a garbage value
//     verbatim is required so the Plan-25-03 floor-sweep can prove a bogus value still REFUSES.
//   - This function does not throw. Its consumers nonetheless catch, because a read that failed by
//     throwing must reach the same fail-closed branch as one that failed by returning `unreadable`.
//
// Config-location resolution: given a directory to look in (`repoRoot`), try the standard config
// locations in order — first the installed/repo-dropped `.grugops/factory.config.json` (what the
// installer drops at a consumer repo root and what the hook points `${CLAUDE_PROJECT_DIR}` at), then
// the in-kit `agent-factory/config/factory.config.json`. When `repoRoot` is omitted, default to the
// script's own repo root (join(import.meta.dirname, "..")) exactly as freshness.ts resolves ROOT.
// THAT ORDER IS A CONTRACT, NOT AN IMPLEMENTATION DETAIL. Both deleted-and-surviving readers resolved
// these same two paths in this same order; the surviving reader's array below is now the single place
// the order is spelled, and scripts/context-io.test.ts asserts BOTH that the order holds behaviorally
// and that exactly ONE such candidate array survives in this file.
//
// THE SURVIVING READER READS NOTHING THE PAIR DID NOT (T-30-10). Collapsing two authorities into one
// makes the survivor's SCOPE a new degree of freedom, so it is stated and asserted rather than
// assumed: the keys read are `context.human_admission`, `context.audit_retention` and `checkpoints`
// — the union of what the two readers already read, with nothing added. The deleted reader read a
// strict SUBSET (the first two); it never read `checkpoints`, deliberately, because a safety matrix
// must not be reported by a fail-open reader.
const GOVERNANCE_DEFAULTS = { human_admission: "off", audit_retention: "git" };
// Gate-or-stricter sentinel for a PRESENT-but-non-string human_admission (round-2 GAP-C). Only the
// EXACT JSON string "off" is off-equivalent; a present non-string value (true / 1 / null / array /
// object) — or a present non-object config shape — must NEVER coerce to the lean `off` default, or an
// operator who writes `"human_admission": true` to "turn governance on" silently turns it OFF. We
// canonicalize such a value to "all": the strictest dial (gate EVERY matched admission), which the hook
// and admit() already treat as gate-or-stricter. A genuinely ABSENT config still reads the lean default
// (the zero-config contract, SC2). The audit_retention dial keeps its own default-on-non-string
// behavior (GAP-C is human_admission-scoped — D-08's audit ledger contract is unchanged).
const GATE_OR_STRICTER_HUMAN_ADMISSION = "all";
// Canonicalize a raw human_admission JSON value read from config. A string is taken VERBATIM (the
// existing contract — "off"/"high-severity"/"all"/typo all flow through unchanged; the hook canonicalizes
// a typo'd STRING fail-closed). A PRESENT non-string value is gate-or-stricter, never `off`.
function canonicalizeHumanAdmission(raw) {
    return typeof raw === "string" ? raw : GATE_OR_STRICTER_HUMAN_ADMISSION;
}
/**
 * Read the `checkpoints` object out of an already-parsed config file.
 *
 * THE FOUR DEGENERATE SHAPES, EACH ITS OWN BRANCH — the same four the `context` object above already
 * distinguishes, because that structure is what closed the round-2 GAP-C fail-open and a new key
 * written without that history reintroduces it (RESEARCH Pitfall 4):
 *   1. the whole parsed file is not a JSON object  → STRICTEST_MATRIX + a refusal;
 *   2. `checkpoints` is ABSENT                     → roster defaults, NO refusal (AUTO-07: a repo
 *                                                    that configures nothing is not misconfigured);
 *   3. `checkpoints` is PRESENT but not an object  → STRICTEST_MATRIX + a refusal;
 *   4. `checkpoints` is a present object           → per key: absent → the roster default; present →
 *                                                    `canonicalizeDisposition`, which reaches `block`
 *                                                    by RULE for the entire non-canonical complement.
 * Branches 1 and 3 reach `STRICTEST_MATRIX` — every member at `block` — and NOT the roster defaults.
 * That distinction is load-bearing as of plan 30-02: `commit_to_branch` is a non-floor member whose
 * roster default is `off`, so "fall back to the defaults" would have let a corrupt config GRANT a
 * permission the repository had declared `block`. A shape a matrix cannot come out of is an UNKNOWN
 * declaration, and an unknown declaration is enforced at the strictest value, never at the
 * permissive one. Branch 2 is the only one that is not also a refusal, and it is the only one where
 * the roster defaults are the right answer: the file WAS read and it says nothing.
 *
 * THE KEY SET IS STRUCTURAL, NOT ACCUMULATED. The result starts as a copy of `CHECKPOINT_DEFAULTS`
 * and is overwritten in place, so it CANNOT come out short — and the count is asserted anyway
 * against a denominator taken from `CHECKPOINT_DEFAULTS` rather than from the loop that filled it
 * (RESEARCH Pitfall 6). An unknown id is dropped and recorded; it never becomes a roster member.
 */
function readCheckpointMatrix(parsed) {
    const defaults = { ...CHECKPOINT_DEFAULTS };
    const refusals = [];
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        refusals.push("the config file did not parse to a JSON object, so no `checkpoints` matrix could be read — every checkpoint is enforced at `block`");
        return { matrix: { ...STRICTEST_MATRIX }, refusals };
    }
    const raw = parsed.checkpoints;
    if (raw === undefined) {
        return { matrix: defaults, refusals }; // zero-config: defaults, and nothing to report.
    }
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        refusals.push("`checkpoints` is present but is not a JSON object — the whole matrix is refused and every checkpoint is enforced at `block`");
        return { matrix: { ...STRICTEST_MATRIX }, refusals };
    }
    const obj = raw;
    const rosterIds = new Set(CHECKPOINTS);
    for (const key of Object.keys(obj)) {
        if (!rosterIds.has(key)) {
            // THE KEY IS QUOTED, NOT INTERPOLATED RAW (plan 30-11, finding A-6). This is the one value in
            // this function that comes from the config file rather than from the roster, and a config file
            // is agent-writable. JSON permits a key carrying a newline, so a raw interpolation would let
            // that key spell additional LINES in whatever prints this refusal — including a line shaped
            // like the run banner the guard emits on the next line down. `emitCheckpointNote` in this same
            // module already states the rule for untrusted values ("quoted, not interpolated raw"); this
            // site was the one that had not applied it. Quoting renders the key on one line, with its
            // escapes visible, so the reported value is exactly the value and the report's own structure
            // is not something the config can rewrite.
            refusals.push(`\`checkpoints.\` entry ${JSON.stringify(key)} is not a checkpoint on the roster — the entry is dropped and does not widen the checkpoint set`);
        }
    }
    for (const id of CHECKPOINTS) {
        if (!(id in obj))
            continue; // absent key → the roster default already in place.
        const value = obj[id];
        const canonical = canonicalizeDisposition(value);
        if (canonical === "block" && value !== "block") {
            refusals.push(`\`checkpoints.${id}\` carries a value that is not one of block|notify|off — it is enforced as \`block\``);
        }
        defaults[id] = canonical;
    }
    // Pitfall 6: the denominator comes from the roster table, not from the loop above.
    const expected = Object.keys(CHECKPOINT_DEFAULTS).length;
    const actual = Object.keys(defaults).length;
    if (actual !== expected) {
        // Unreachable by construction (the object starts as a full copy); asserted anyway, because a
        // matrix that comes out SHORT gates fewer checkpoints while presenting as a clean read.
        return {
            matrix: { ...STRICTEST_MATRIX },
            refusals: [
                ...refusals,
                `the effective checkpoint matrix carried ${actual} key(s) where the roster declares ${expected} — the read is refused and every checkpoint is enforced at \`block\``,
            ],
        };
    }
    return { matrix: defaults, refusals };
}
/**
 * The standard governance-config locations under `base`, IN PRECEDENCE ORDER: the repo-dropped
 * `.grugops/factory.config.json` first, then the in-kit `agent-factory/config/factory.config.json`.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THE ORDER IS PUBLISHED AND NOT MERELY OBEYED (plan 30-10, red-team surface B finding B-1).
 *
 * The candidate order was already spelled exactly once — inside `readGovernanceConfig` — and a test
 * asserted the count, so no second reader could appear. What no assertion covered was a consumer
 * that needed to know WHICH FILES ARE GOVERNANCE CONFIGURATION without reading one:
 * `scripts/validate-agent-factory.ts` form-checks a governance configuration, and it named only the
 * in-kit path. That is the file this reader consults SECOND. Measured on the committed artifact:
 * nine of nine payloads the validator refuses in the kit config — a missing required key, the
 * retired `autonomy` scalar, an unknown checkpoint id, a non-canonical disposition, a `checkpoints`
 * value a matrix cannot come out of, the TINT-03 carve-out, the WR-01 deploy boolean, an
 * out-of-enum dial, and bytes that are not JSON — produced `ALL CHECKS PASSED` when written to
 * `.grugops/factory.config.json`, the file that actually governs every read.
 *
 * The predicate was correct and was asked at the wrong position. The repair is positional, and it
 * needs this list to be ASKED FOR rather than copied: a validator spelling the two paths for itself
 * would be a second answer to "which file is the governance configuration", free to drift from this
 * one the day a third location is added — the authority-duplication D-12 deleted from this module.
 * So the order lives here, once, and every consumer asks.
 * ---------------------------------------------------------------------------------------------
 */
export function governanceConfigCandidates(base) {
    return [
        join(base, ".grugops", "factory.config.json"),
        join(base, "agent-factory", "config", "factory.config.json"),
    ];
}
/**
 * WHAT EACH PUBLISHED CANDIDATE POSITION *IS*, PARALLEL TO THE LIST ABOVE (plan 31-23, CR-13's
 * second adversarial re-check).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY A CLASSIFICATION AND NOT JUST AN ORDER. The two positions are not equivalent evidence, and
 * everywhere but one directory that difference is already resolved for us.
 *
 *   `repository-state-plane` — `<base>/.grugops/factory.config.json`. This is what
 *   `install/install.ts`'s `seedState` writes for a seeded TARGET (`agent-factory/seed/.grugops/`
 *   copied to `join(TARGET, ".grugops", …)`). It is a REPOSITORY'S OWN governance posture.
 *
 *   `in-kit` — `<base>/agent-factory/config/factory.config.json`. This is A KIT'S OWN
 *   configuration: the file every vendored copy of this kit carries, and the exact position
 *   D-23 (4) already ruled must lose to a repository root's own.
 *
 * At every ordinary directory D-23 (4)'s boundary-wins rule keeps a kit's configuration from
 * governing a host, because there is a boundary ABOVE it to lose to. At the user's home directory
 * the walk ENDS — there is no boundary above — so the in-kit position must be excluded there BY
 * POSITION. That is the only place this classification is consulted, and
 * `scripts/context-io.test.ts` binds it to the list above on FOUR axes: index-for-index,
 * cardinality, transposition, and a SHAPE PREDICATE over each candidate's own segments relative to
 * its base. The shape axis is the one the other three leave open — an in-place RENAME of a
 * candidate path moves neither index nor cardinality and leaves a kind sitting on a position it no
 * longer describes.
 * ---------------------------------------------------------------------------------------------
 */
export const GOVERNANCE_CONFIG_CANDIDATE_KINDS = Object.freeze([
    "repository-state-plane",
    "in-kit",
]);
/**
 * The same candidates as REPO-RELATIVE POSIX paths, for a consumer that must NAME the files rather
 * than read them — a mirror that copies them, a gate that reports one by path.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY IT IS DERIVED FROM THE FUNCTION ABOVE AND NOT WRITTEN OUT (plan 30-10, finding B-5).
 *
 * `scripts/generate-guarantees.ts` needed exactly this and, with no published answer to ask,
 * RESTATED the two paths — with a comment saying so, and a harness case holding the restatement
 * against this module's source. That case was documented as two-sided and was measurably one-sided:
 * it asserted every path the restatement names is present here, and nothing in the other direction,
 * so a candidate ADDED here would leave the mirror copying a strict subset of what the real render
 * reads. A byte comparison between two documents rendered from different inputs is a comparison
 * between two different questions.
 *
 * `join(base, …)` with an EMPTY base yields the repo-relative form, so this list cannot disagree
 * with the absolute one: there is one array of segments, in one function, and both views are it.
 * ---------------------------------------------------------------------------------------------
 */
export const GOVERNANCE_CONFIG_RELPATHS = governanceConfigCandidates("").map((p) => p.split(sep).join("/"));
/**
 * The base this reader resolves against when a caller supplies NO `repoRoot` — its own module's
 * parent, which is the KIT this module ships in.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY IT IS PUBLISHED (plan 30-10, round 2, finding F1 = reviewer R1-1 ≡ R2-2).
 *
 * Round 1 took the POSITIONS from this module and left the BASE hand-chosen: the structure
 * validator enumerated `governanceConfigCandidates(STATE_ROOT)` and one fixed kit relpath. But this
 * reader has TWO bases — the caller's, and this one — and this one is the DECLARED DEFAULT of
 * `admit()`, `admitAndAppend()` and the `context-io.js admit` CLI. On the four host CLIs that set no
 * `CLAUDE_PROJECT_DIR`, it is the base the PreToolUse guard's read lands on too. So
 * `<this base>/.grugops/factory.config.json` is a governing FIRST candidate, and it was form-checked
 * at no position: identical illegal bytes produced six named errors at the state position and
 * `ALL CHECKS PASSED` at the kit position.
 *
 * WHAT IT IS BY CONSTRUCTION, WHICH IS WHY NAMING IT CLOSES THE HOLE RATHER THAN WIDENING A LIST.
 * `import.meta.dirname` is `<kit>/scripts`, so this constant is always `<kit>` — the kit the reader
 * ships in. A validator asked about that kit therefore covers this base by covering `KIT_ROOT`, and
 * `scripts/validate.test.ts` asserts that construction rather than arguing it.
 * ---------------------------------------------------------------------------------------------
 */
export const GOVERNANCE_FALLBACK_BASE = ROOT;
/**
 * THE RUNNING MODULE'S OWN TWO CANDIDATE POSITIONS, FROZEN AT LOAD (plan 31-23, CR-13's second
 * adversarial re-check).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS INPUT AND NOT A FILESYSTEM PROBE. The home rule below needs to know whether the
 * candidate carrying the home directory's configuration is THIS KIT'S OWN. The draft that went to
 * review answered that with two `existsSync` probes under `$HOME/.grugops`, and an adversarial
 * re-check measured BOTH as caller-authorable in ONE operation, in OPPOSITE directions:
 * `mkdir -p $HOME/.grugops/agent-factory` turned an ADOPTION into a REFUSAL — and a refusal at home
 * returns `nearest`, which with nothing remembered lands on `GOVERNANCE_FALLBACK_BASE`, whose
 * shipped dial is LEAN, so CR-13's own measured harm came back by one `mkdir` — while
 * `touch $HOME/.grugops/install.json` turned a REFUSAL into an ADOPTION. Reading the installer's
 * marker through its own parser is the same one-write flip: `install/install.ts:597-620` makes
 * every `InstallMarker` field optional and names no TARGET, so the two-byte document `{}` parses
 * as a valid marker. A conjunct a caller can flip is a switch this module would have handed it,
 * whichever way it flips.
 *
 * WHAT THIS CONSTANT IS INSTEAD. `GOVERNANCE_FALLBACK_BASE` is `join(import.meta.dirname, "..")` —
 * a property of WHICH PROGRAM IS RUNNING, not of the filesystem that program inspects. No `mkdir`,
 * no `touch`, no write under `$HOME` or under the repository moves it. Moving it at all means
 * running a DIFFERENT copy of this decider, which is the capability `DECIDER_MANIFEST` in
 * `hooks/hook-entry.ts` already freezes and which this predicate is not the tier for.
 *
 * `process.env.GRUGOPS_HOME` is deliberately NOT read. It is caller-settable in ZERO operations, so
 * a rule consulting it would be a rule the caller decides — the same flip, one register over.
 *
 * MEASURED, NOT ASSUMED (plan 31-23 MOVEMENT 0): the shipped kit carries no `scripts/` directory
 * (`agent-factory/` holds `roles`, `workflows`, `checklists`, `contracts`, `config`, `packaging`,
 * `seed`, `VERSION` and two markdown files), so an installed shared kit at `$GRUGOPS_HOME/agent-factory`
 * does not contain this module at all. This base is therefore always a CHECKOUT root, and any
 * derivation of a "kit home" from `dirname()` of it would be a derivation over a shape the
 * installer never creates.
 * ---------------------------------------------------------------------------------------------
 */
/**
 * ONE CANONICALISER, USED ON BOTH SIDES OF EVERY PATH COMPARISON THAT DECIDES SOMETHING (31-27).
 *
 * ---------------------------------------------------------------------------------------------
 * WHAT IT CLOSES. `R-31-19-07`, which round 5 recorded OCCUPIED at a price of one filesystem
 * operation. `MODULE_OWN_CONFIG_POSITIONS` was built with `resolve` and the candidate was compared
 * with `resolve`, so a LEXICAL equality decided whether the running kit's own configuration was
 * excluded. On a case-insensitive filesystem the two sides can spell ONE directory two ways, and
 * then the exclusion misses.
 *
 * MEASURED on this tree, with the harness's own premise asserted first (`realpathSync.native`
 * returning the same canonical path for both spellings, so "one directory, two strings" is
 * established rather than assumed):
 *
 *   module addressed as <tmp>/KitRoot/scripts/context-io.js   -> excluded: TRUE
 *   module addressed as <tmp>/kitroot/scripts/context-io.js   -> excluded: FALSE
 *
 * i.e. addressing the kit through a case-differing spelling of its own root leaves the running kit's
 * configuration eligible to be adopted as the governance root over a project nested inside it.
 *
 * THE LADDER, STATED, THREE RUNGS AND A TAIL:
 *   1. `realpathSync.native` — the KERNEL's own answer. On darwin it returns the ON-DISK casing,
 *      which is precisely the authority a lexical comparison lacks.
 *   2. `realpathSync` — the portable resolver, for a platform that exposes no native variant.
 *   3. the deepest EXISTING ancestor, canonicalised by rungs 1-2, with the remainder re-joined.
 *
 * WHY RUNG 3 IS NOT A BARE `resolve`. The inputs this predicate is asked about are candidate
 * POSITIONS — `<root>/.grugops/factory.config.json` and the in-kit position — and a candidate need
 * not exist. `realpathSync` throws ENOENT on a path whose leaf is absent, so a bare `resolve` tail
 * would leave the caller's spelling on exactly the inputs the exclusion is asked about, and the
 * bypass would survive the fix. Canonicalising the deepest existing ancestor gives a position a
 * canonical spelling before anything is written there. The recursion terminates at the filesystem
 * root, where `dirname(p) === p`.
 *
 * WHY IDENTITY-BY-INODE IS NOT THE RULE CHOSEN HERE. A `dev:ino` comparison is a `statSync` on paths
 * under `$HOME` that a SINGLE symlink can make agree — a one-operation flip in the gate-LOWERING
 * direction, which is the defect `R-31-19-07` existed instead of. The dev/ino objection round 5
 * recorded does not apply to canonicalisation: a symlink that makes a project root's canonical path
 * equal the kit root also re-points the working directory, and a process that can re-point its own
 * working directory is `R-31-15-01`'s already-accepted capability rather than a new one.
 * ---------------------------------------------------------------------------------------------
 */
function canonicalDirectoryPath(candidate) {
    const abs = resolve(candidate);
    const native = realpathSync.native;
    if (typeof native === "function") {
        try {
            return native(abs);
        }
        catch {
            // fall to rung 2
        }
    }
    try {
        return realpathSync(abs);
    }
    catch {
        // fall to rung 3
    }
    const parent = dirname(abs);
    if (parent === abs)
        return abs; // the filesystem root: nothing above it to canonicalise
    return join(canonicalDirectoryPath(parent), basename(abs));
}
/**
 * The working directory the trusted-root walk STARTS from, in the one canonical spelling
 * (plan 33-16, closing windows-latest row W-21 of run 35499800942).
 *
 * WHY THE WALK'S START IS CANONICALISED AT ALL. `trustedRepoRoot` answers the walk's `nearest`
 * directory, which is spelled from the working directory it started at. On darwin `process.cwd()`
 * returns the kernel's realpath, so a process started inside `<link>/proj` — `<link>` a directory
 * symlink to `<kit>` — already walks from `<kit>/proj`, and the R-31-19-07 SYMLINK cell HELD by that
 * kernel behaviour alone. On win32 `process.cwd()` keeps the spelling the process was started with:
 * the walk began at `<link>\proj`, the answer was `<link>\proj`, and the cell's verdict MOVED
 * (`expected '…\link\proj' to be '…\kit\proj'`). Two hosts, two answers for one directory, decided
 * by which one's cwd call happened to resolve links.
 *
 * WHY THIS IS `canonicalDirectoryPath` AND NOT A SECOND RESOLVER. Tier 0's delivered root is already
 * spelled through that ladder (rung 1 `realpathSync.native`, rung 2 portable, rung 3 the deepest
 * existing ancestor), and the module-own exclusion compares through it on both sides. A walk that
 * started from a differently-spelled input would be a second authority for "what is this directory
 * called" — the shape this module keeps deleting. D-15: a location the module opens is canonicalised
 * where the module reads it, once. It is read in `trustedRepoRoot`, so it is canonicalised there,
 * through this one exported name, and the 31-15 monotonicity mirror's two anchors are untouched.
 *
 * EXPORTED so the test can drive the authority on a link spelling directly, on a host whose kernel
 * would never let the walk see one.
 */
export function canonicalWorkingDirectory(raw) {
    return canonicalDirectoryPath(raw);
}
export const MODULE_OWN_CONFIG_POSITIONS = Object.freeze(
// BOTH SIDES through the same authority (31-27, `R-31-19-07`). This side is canonicalised here;
// the candidate side is canonicalised in `homeConfigPositionIsProjectOwned` below. A comparison
// whose two sides are produced by two different functions is a comparison waiting to disagree.
governanceConfigCandidates(GOVERNANCE_FALLBACK_BASE).map((candidate) => canonicalDirectoryPath(candidate)));
/**
 * Whether the candidate carrying a HOME DIRECTORY'S configuration is a PROJECT'S own position.
 *
 * Two comparisons and no filesystem read. The in-kit position is excluded because D-23 (4) already
 * ruled a vendored kit's configuration must lose to a repository root's own, and at `$HOME` there
 * is no boundary above for it to lose to. The running module's own positions are excluded because
 * the kit this reader ships in is not a project, and `$HOME` is the only directory where its own
 * fallback candidate can also be a candidate the walk computes.
 *
 * THE COMPARISON IS CANONICAL ON BOTH SIDES (31-27, closing `R-31-19-07`). It used to be a LEXICAL
 * path equality, and a case-insensitive filesystem spelling one directory two ways defeated it in
 * ONE operation — measured, and recorded at `canonicalDirectoryPath` above with the two compared
 * strings. Both sides now pass through that one ladder: `MODULE_OWN_CONFIG_POSITIONS` at
 * construction, the candidate here. It is still not a `statSync` under `$HOME` and still not a
 * `dev:ino` identity — those are the one-operation flip in the gate-lowering direction this member
 * existed instead of, and the argument is written out at the canonicaliser.
 */
function homeConfigPositionIsProjectOwned(candidateIndex, candidatePath) {
    if (GOVERNANCE_CONFIG_CANDIDATE_KINDS[candidateIndex] !== "repository-state-plane")
        return false;
    return !MODULE_OWN_CONFIG_POSITIONS.includes(canonicalDirectoryPath(candidatePath));
}
/**
 * THE PROJECT-DIRECTORY VARIABLES THE TRUSTED ROOT HONOURS, IN PRECEDENCE ORDER, NAMED ONCE
 * (plan 31-15, review finding WR-15).
 *
 * `CLAUDE_PROJECT_DIR` is the variable CLAUDE CODE sets for a real project session.
 * `GRUGOPS_PROJECT_DIR` is the documented INSTALLER-SET answer for the four host CLIs that set no
 * Claude Code variable — the installer knows the target repository it seeded (`install/install.ts`
 * resolves `TARGET` and materializes the resolved kit path into every target adapter), and it is the
 * installer, not the agent, that names it.
 *
 * WHY THE ORDER IS DATA AND NOT READING ORDER. Two `if` statements are a precedence rule stated by
 * position; a reader asking "which one wins when both are set?" has to reconstruct it from the source
 * and a test asserting the answer has to hand-type the same order a third time. The array IS the
 * precedence, `trustedRepoRoot` iterates it, and `scripts/context-io.test.ts` asserts the winning
 * value against `TRUSTED_ROOT_ENV_ORDER[0]` rather than against a literal.
 */
export const TRUSTED_ROOT_ENV_ORDER = Object.freeze([
    "CLAUDE_PROJECT_DIR",
    "GRUGOPS_PROJECT_DIR",
]);
/**
 * The names that mark a REPOSITORY BOUNDARY for the upward search below (widened by plan 31-19,
 * review finding WR-21).
 *
 * ---------------------------------------------------------------------------------------------
 * WHAT THIS SET IS, AND WHAT IT IS NOT.
 *
 * It is CONTENT: the metadata directory names the common version-control systems place at a
 * checkout root. It is NOT the bound on the search, and reading it as one is exactly the defect
 * WR-21 recorded. The docstring here used to claim that the walk "never continues past" a boundary
 * so a resolution "can never reach a user's home directory". That only followed if some ancestor
 * happened to carry `.git`, and nothing guarantees one does — the round-4 reviewer reproduced the
 * walk climbing three ancestors into a home-directory-shaped directory and adopting its dial. The
 * BOUND is the `isAboveHome` / `isHomeItself` pair below: a property of the walk rather than of
 * which tool the user happens to run. This set decides where a REPOSITORY starts, which is a
 * different question — and at the home directory it is one of the three conjuncts that decides
 * whether the home directory answers at all (plan 31-23 / D-26).
 *
 * WHY IT NAMES MORE THAN ONE SYSTEM. With `.git` alone, a Mercurial, Subversion, Jujutsu or Fossil
 * checkout was not a boundary at all, so the walk climbed straight out of it into whatever sat
 * above. A boundary that exists only for users of one tool is not a boundary. The set is open by
 * nature and is recorded as such in `TRUSTED_ROOT_RESIDUALS`.
 *
 * WHY NO NON-VCS MARKER IS IN HERE — the road not taken, recorded so a later round does not
 * rediscover it as an omission. WR-21 offered "add a second frozen array of non-VCS boundaries" as
 * an alternative. The obvious member is the factory's own `.grugops` state directory. It is refused
 * because it moves cases in the UNSAFE direction: a sub-package carrying `.grugops` STATE and no
 * configuration would end the walk BELOW the repository whose dial governs, and the answer would
 * fall through to the kit's lean default — a configuration moving from refused to admitted, which
 * is the WR-15 defect this order exists to close. The kit's own `agent-factory` directory is
 * refused one register over for the same class of reason: a vendored kit inside a host repository
 * is not a governed project, which is the inner-configuration case the walk below decides.
 * ---------------------------------------------------------------------------------------------
 */
export const REPO_BOUNDARY_MARKERS = Object.freeze([
    ".git", // Git
    ".hg", // Mercurial
    ".svn", // Subversion
    ".bzr", // Bazaar
    "_darcs", // Darcs
    ".jj", // Jujutsu
    ".pijul", // Pijul
    ".fslckout", // Fossil, POSIX checkout marker
    "_FOSSIL_", // Fossil, Windows checkout marker
]);
/**
 * The ceiling on how many ancestors the upward search inspects. A bound, not a tuning knob: a
 * symlink cycle or a pathologically deep path must not make a governance read spin, and no real
 * repository is nested this far below a filesystem root.
 */
const TRUSTED_ROOT_SEARCH_MAX_ANCESTORS = 64;
/** A directory's FILESYSTEM IDENTITY, or `null` when it cannot be stat-ed at all. */
function directoryIdentity(dir) {
    try {
        const st = statSync(dir);
        return `${String(st.dev)}:${String(st.ino)}`;
    }
    catch {
        return null;
    }
}
/** The user's home directory, as `os.homedir()` names it, or `null` when it names nothing real. */
function namedHomeDirectory() {
    let raw;
    try {
        raw = homedir();
    }
    catch {
        return null;
    }
    if (typeof raw !== "string" || raw.trim() === "")
        return null;
    const home = resolve(raw.trim());
    // A home directory that cannot be STAT-ED AT ALL has not been DETERMINED. Saying so here is what
    // lets the caller degrade to the kit instead of walking on with an unenforceable bound.
    //
    // WHAT THIS PREDICATE ACTUALLY CHECKS, STATED BECAUSE THE EARLIER SENTENCE HERE DID NOT (plan
    // 31-23, PROBE 3). It read "a home directory that is not an existing DIRECTORY", and
    // `directoryIdentity` is a `statSync`, which succeeds on a regular file. Driven with `HOME`
    // naming a file: `os.homedir()` returned it, the boundary was built from its ancestors, and the
    // walk was bounded there rather than degrading. That is a claim outrunning its mechanism, which
    // is the WR-21 class, so the CLAIM is corrected rather than the behaviour.
    //
    // WHY THE BEHAVIOUR IS NOT CHANGED TO MATCH THE OLD SENTENCE. Rejecting a non-directory here
    // would return `null`, which stops the search and lands the caller on `GOVERNANCE_FALLBACK_BASE`
    // — the kit's LEAN default. A refusal is NOT the safe direction (D-26 (4), `R-31-19-06`), so
    // tightening this on the strength of a comment would lower a gate. A `$HOME` naming a file is a
    // misconfigured environment, and the capability it represents is `R-31-19-02`'s: `os.homedir()`
    // reads an ambient value a process controls in its own child environment, which already names
    // the governance root outright through either project-directory variable.
    return directoryIdentity(home) === null ? null : home;
}
function homeBoundary() {
    const named = namedHomeDirectory();
    if (named === null)
        return null;
    // The same directory under every spelling this module can obtain for it.
    const spellings = new Set([named]);
    try {
        spellings.add(resolve(realpathSync(named)));
    }
    catch {
        // The resolved spelling is what there is. The identity sets below cover the rest.
    }
    const selfPaths = new Set();
    const selfIds = new Set();
    const abovePaths = new Set();
    const aboveIds = new Set();
    for (const start of spellings) {
        let dir = start;
        for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
            // Step 0 is the home directory itself; every later step is a STRICT ancestor of it. The two
            // are separate questions with separate answers, so they are separate sets.
            const paths = step === 0 ? selfPaths : abovePaths;
            const ids = step === 0 ? selfIds : aboveIds;
            paths.add(dir);
            const id = directoryIdentity(dir);
            if (id !== null)
                ids.add(id);
            const parent = dirname(dir);
            if (parent === dir)
                break;
            dir = parent;
        }
    }
    // THE IDENTITY SETS' OWN PREMISE, RE-CHECKED FOR THE SPLIT SHAPE RATHER THAN INHERITED FROM THE
    // SINGLE ONE. Two directories that are demonstrably different must not carry the same identity.
    // Where they do, the platform's identities say nothing and BOTH sets are dropped — the spelling
    // sets then decide alone, exactly as before the split.
    const parent = dirname(named);
    const degenerate = parent !== named && directoryIdentity(parent) === directoryIdentity(named);
    return {
        selfPaths,
        selfIds: degenerate ? new Set() : selfIds,
        abovePaths,
        aboveIds: degenerate ? new Set() : aboveIds,
    };
}
/**
 * Whether `dir` is STRICTLY an ancestor of the user's home directory — the directories the walk
 * never inspects at all.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS IS SPLIT FROM THE PREDICATE BELOW (plan 31-23, review finding CR-13). 31-19 answered
 * "may the walk climb here?" and "may the walk look here?" with ONE predicate, asked BEFORE the
 * directory was inspected. A bound on a SEARCH must bound the search, not the OBSERVATION: a
 * repository whose root IS the home directory had its own `.git` and its own
 * `.grugops/factory.config.json` skipped entirely, and the answer fell through to the kit's lean
 * default. That is a configuration moving from refused to admitted — the WR-15 direction.
 * ---------------------------------------------------------------------------------------------
 */
function isAboveHome(dir, home) {
    if (home.abovePaths.has(dir))
        return true;
    const id = directoryIdentity(dir);
    return id !== null && home.aboveIds.has(id);
}
/** Whether `dir` IS the user's home directory — inspected exactly once, and the walk ends there. */
function isHomeItself(dir, home) {
    if (home.selfPaths.has(dir))
        return true;
    const id = directoryIdentity(dir);
    return id !== null && home.selfIds.has(id);
}
/**
 * Step 3 of the resolution order: the configuration that governs `startDir`, or `null` when the
 * walk reaches the user's home directory, a repository boundary carrying no configuration, a
 * filesystem root or the step limit without finding one.
 *
 * The candidate POSITIONS come from `governanceConfigCandidates` — the one published answer to
 * "which file is the governance configuration" — so this search cannot come to disagree with the
 * reader about what it is searching for. The complete stop conditions are published once, as
 * `TRUSTED_ROOT_STOP_CONDITIONS`, and `agent-factory/workflows/16-context-read-write.md` is
 * asserted equal to that export in both directions.
 *
 * THE FOUR RULES, AND THEIR PRECEDENCE, STATED RATHER THAN LEFT TO READING ORDER.
 *
 * 1. THE BOUND BOUNDS ASCENT, NOT OBSERVATION (plan 31-23 / D-26, review finding CR-13; this
 *    AMENDS D-23's "never inspects it or anything above it" — the halt stays, the blanket
 *    non-inspection does not). A directory STRICTLY ABOVE the home directory is never inspected.
 *    The home directory ITSELF is inspected exactly once, and the walk ends there either way.
 * 1b. THE HOME DIRECTORY ANSWERS ONLY AS A REPOSITORY, ON THREE CONJUNCTS. It is adopted only when
 *    it carries a version-control MARKER, AND the candidate carrying its configuration is the
 *    `repository-state-plane` position rather than the `in-kit` one, AND that candidate is not a
 *    member of `MODULE_OWN_CONFIG_POSITIONS`. It never becomes `nearest` on the way past.
 *
 *    WHY THE REVIEW'S OWN `Fix:` SKETCH IS NOT ADOPTED VERBATIM. It assigns `nearest = dir` before
 *    asking whether `dir` is home and then returns `nearest`, so a home directory carrying only a
 *    configuration would be ADOPTED on the way past — verbatim the WR-21 hole 31-19 was convened to
 *    close. Hence the marker requirement, and hence home never entering `nearest`.
 *
 *    WHY MARKER-PLUS-CONFIGURATION IS STILL NOT ENOUGH. `governanceConfigCandidates` publishes TWO
 *    positions, and at `$HOME` the second is `$HOME/agent-factory/config/factory.config.json` — a
 *    KIT's own configuration, which D-23 (4) already ruled must lose to a repository root's own.
 *    Everywhere else that rule holds because a boundary ABOVE the kit wins; at `$HOME` the walk
 *    ends, so nothing wins, and a two-conjunct rule would let a kit's shipped LEAN default govern
 *    every un-configured directory below home. That is WR-21's harm at the one position D-23 (4)
 *    cannot reach.
 *
 *    WHY THE THIRD CONJUNCT IS A PATH EQUALITY AND NOT A PROBE — the paragraph a later reader most
 *    needs. The draft that went to review answered the previous paragraph with two `existsSync`
 *    probes under `$HOME/.grugops`, and BOTH were caller-authorable in ONE operation, in OPPOSITE
 *    directions: creating `<kitHome>/agent-factory` turned an adoption into a refusal, whose answer
 *    is `GOVERNANCE_FALLBACK_BASE`'s LEAN dial — CR-13's own measured harm restored by one `mkdir`
 *    — and creating `<kitHome>/install.json` turned a refusal into an adoption. Reading that marker
 *    through `install/install.ts:609`'s `readMarker` is the same one-write flip: every
 *    `InstallMarker` field is optional, none names a TARGET, and `{}` parses as valid. A conjunct a
 *    caller can flip is a switch, whichever way it flips. So the two added conjuncts decide by a
 *    published POSITION and by a load-time MODULE CONSTANT, and read the filesystem not once.
 *
 *    WHY THE POSITION QUESTION IS ASKED ONLY AT HOME. Everywhere else D-23 (4)'s boundary-wins rule
 *    already answers it, and asking it twice would be a second authority for one question — the
 *    authority-duplication this module keeps deleting. The ordinary rules below therefore keep
 *    using existence alone.
 *
 *    WHAT THE TWO REMAINING CONJUNCTS COST is priced in operations as `R-31-19-06`, not defended:
 *    they are the walk's ORDINARY evidence, applied identically at every directory.
 * 2. A REPOSITORY ROOT'S OWN CONFIGURATION OUTRANKS ONE NESTED INSIDE IT (plan 31-19, the second
 *    half of WR-21). The reviewer named the nearest-wins rule running the other way: a vendored
 *    kit's `agent-factory/config/factory.config.json` — the SECOND published candidate, and the
 *    file every vendored copy of this kit carries — won over the host repository's own for any
 *    process whose working directory sat under it. That is a governance dial lowered to the kit's
 *    shipped lean default by changing directory, so the walk no longer stops at the first
 *    configuration it sees: it remembers it and continues to the repository boundary, and the
 *    boundary's own configuration wins when it has one. A vendored kit is not a governed project.
 *    Where the repository root carries no configuration the remembered nearest one still answers,
 *    so nothing that resolved before resolves differently.
 * 3. WITHIN ONE DIRECTORY, A CONFIGURATION WINS OVER THAT DIRECTORY'S OWN MARKER — the published
 *    rule, unchanged: a repository that configured the factory is exactly the repository whose dial
 *    should decide. A boundary directory carrying ONLY a marker ends the walk and yields whatever
 *    was remembered below it, which the caller turns into the kit fallback when nothing was.
 */
function projectRootFromWorkingDirectory(startDir) {
    let dir;
    try {
        dir = resolve(startDir);
    }
    catch {
        return null;
    }
    // A HOME DIRECTORY THAT CANNOT BE DETERMINED IS NOT A LICENCE TO WALK PAST IT. The search does
    // not run at all, and the caller falls through to the kit — the answer the pre-31-15 program gave
    // unconditionally. An unbounded search is the one outcome this case may not degrade to.
    const home = homeBoundary();
    if (home === null)
        return null;
    let nearest = null;
    for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
        // RULE 1 — ASCENT IS BOUNDED. A STRICT ancestor of the home directory is refused outright,
        // before any inspection. This half of the bound is unchanged by plan 31-23.
        if (isAboveHome(dir, home))
            return nearest;
        // INSPECT FIRST, THEN DECIDE ABOUT CLIMBING. `existsSync` is the right predicate here and its
        // failure direction is the safe one: a position occupied by something that is not a readable
        // regular file still ANSWERS this search, and `readGovernanceConfig` then maps it to
        // `unreadable`, which is gate-or-stricter. A position that does not exist at all is not a
        // configuration and the walk continues. The carrying candidate's INDEX is kept, not just the
        // boolean, because at the home directory WHICH position carries the configuration decides.
        const candidates = governanceConfigCandidates(dir);
        const carryingIndex = candidates.findIndex((candidate) => existsSync(candidate));
        const carriesConfig = carryingIndex >= 0;
        const isBoundary = REPO_BOUNDARY_MARKERS.some((marker) => existsSync(join(dir, marker)));
        // RULE 1b — THE HOME DIRECTORY ANSWERS ONLY AS A REPOSITORY, AND ENDS THE WALK EITHER WAY. It
        // never becomes `nearest`: `nearest` is not assigned on this path at all.
        if (isHomeItself(dir, home)) {
            const homeAnswersAsRepository = isBoundary && carriesConfig && homeConfigPositionIsProjectOwned(carryingIndex, candidates[carryingIndex]);
            return homeAnswersAsRepository ? dir : nearest;
        }
        if (carriesConfig && nearest === null)
            nearest = dir;
        if (isBoundary) {
            return carriesConfig ? dir : nearest;
        }
        const parent = dirname(dir);
        if (parent === dir)
            return nearest; // filesystem root
        dir = parent;
    }
    return nearest;
}
/**
 * WHAT BOUNDS THE UPWARD SEARCH, PUBLISHED ONCE (plan 31-19, review finding WR-21).
 *
 * WHY THIS EXPORT EXISTS. WR-21 is a claim that outran its mechanism: a docstring and a workflow
 * sentence both said the search could never reach a user's home directory, and neither was bound to
 * anything that made it so. Correcting the two sentences without binding them would leave the next
 * drift equally unobserved. So the stop conditions are one frozen answer a consumer or a document
 * can ask, and `scripts/context-io.test.ts` asserts the workflow's list equal to this array in BOTH
 * directions — every stop the code has is named in the prose, and every stop the prose names the
 * code has. This is the discipline `browser-uat-recipe.md` already keeps against the ban-rule
 * constants, one register over.
 *
 * THE STEP LIMIT IS INTERPOLATED, NEVER TYPED. A number written twice is a number free to disagree
 * with itself; changing the constant moves this sentence, which turns the prose assertion red until
 * the document moves with it.
 */
export const TRUSTED_ROOT_STOP_CONDITIONS = Object.freeze([
    Object.freeze({
        id: "S-HOME-ABOVE",
        sentence: "The upward search never inspects any ancestor of the user's home directory.",
    }),
    Object.freeze({
        id: "S-HOME-SELF",
        // THREE SENTENCES, NOT ONE, AND THAT IS A CONSTRAINT RATHER THAN A STYLE CHOICE. This string is
        // quoted VERBATIM into `agent-factory/workflows/16-context-read-write.md`, where WP-03 bounds a
        // descriptive sentence at 25 words. A published stop that states two of the three conditions
        // the walk applies is the drift WR-21 was, so the sentence count moves rather than the content.
        sentence: "The user's home directory itself is inspected exactly once and ends the upward search " +
            "either way. It is adopted only when it carries a version-control marker and its " +
            "configuration sits at the repository state-plane position rather than the in-kit position. " +
            "That candidate must also not be one of the running kit's own fallback candidate positions.",
    }),
    Object.freeze({
        id: "S-HOME-UNKNOWN",
        sentence: "When the home directory cannot be determined, the upward search does not run at all.",
    }),
    Object.freeze({
        id: "S-BOUNDARY",
        sentence: "The upward search ends at the first ancestor carrying a version-control marker.",
    }),
    Object.freeze({
        id: "S-BOUNDARY-WINS",
        sentence: "That ancestor's own configuration outranks one nested below it.",
    }),
    Object.freeze({
        id: "S-ROOT",
        sentence: "The upward search ends at the filesystem root.",
    }),
    Object.freeze({
        id: "S-STEPS",
        sentence: `The upward search inspects at most ${String(TRUSTED_ROOT_SEARCH_MAX_ANCESTORS)} ancestors.`,
    }),
]);
/**
 * THE NAME THE HOST-DELIVERED GOVERNANCE ROOT ARRIVES UNDER (plan 31-27, structural fix S1).
 *
 * Deliberately DISTINCT from both members of `TRUSTED_ROOT_ENV_ORDER`. Those two are AMBIENT names:
 * whatever process happens to be an ancestor set them, and `R-31-15-03` records exactly that. This
 * one is set by the frozen PreToolUse wrapper on the environment of the ONE `spawnSync` it makes,
 * from a value the HOST built. Sharing a spelling between the two channels would make them
 * indistinguishable at the point of reading, which is the point at which the difference matters.
 */
export const HOST_DELIVERED_ROOT_ENV = "GRUGOPS_HOST_DELIVERED_ROOT";
/**
 * TIER 0 — the governance root as the HOST delivered it, or `null` (plan 31-27, S1).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS TIER EXISTS AT ALL. Every member of `TRUSTED_ROOT_RESIDUALS` ends with the same
 * `what_would_force_it_closed`: *a root the calling process cannot influence, resolved by the host
 * from outside the agent's process tree and delivered through a channel the agent cannot write.*
 * On Claude Code that channel exists. The host builds the environment of the hook subprocess it
 * spawns, so `CLAUDE_PROJECT_DIR` as read INSIDE `hooks/hook-entry.ts` is host-built; the wrapper is
 * byte-frozen under D-24 and hash-verifies the decider's whole import closure before the decider
 * runs. The wrapper canonicalises and shape-checks that value and sets it here.
 *
 * IT IS A STRENGTHENING, AND THAT IS MEASURED RATHER THAN ARGUED. Today's tier 1 accepts ANY
 * non-empty string after a trim and a `resolve`. Measured against the committed `.js` before this
 * change, all three of these were ACCEPTED as the governance root:
 *
 *   CLAUDE_PROJECT_DIR = a REGULAR FILE                                      -> accepted
 *   CLAUDE_PROJECT_DIR = an existing directory with NO version-control marker -> accepted
 *   CLAUDE_PROJECT_DIR = the kit's OWN root                                   -> accepted
 *
 * Tier 0 refuses all three, and `scripts/context-io.test.ts` drives one value set through tier 1's
 * predicate and tier 0's and asserts tier 0's accepted set is a STRICT SUBSET. A tier that admitted
 * even one root the tier below refused would be a gate lowering, whatever else it fixed.
 *
 * WHAT IT DOES NOT ESTABLISH, STATED HERE RATHER THAN IMPLIED (see D-29):
 *   - On Codex, Gemini CLI, OpenCode and Copilot CLI there is no such channel. Those hosts keep the
 *     walk, and the affected register members are re-scoped `hosts: "non-cc-hook-path"` rather than
 *     deleted.
 *   - An agent invoking `scripts/context-io.js` DIRECTLY from its own Bash tool builds its own
 *     environment and can set this name. That is `R-31-15-01`'s already-accepted capability, not a
 *     new one. Tier 0 closes the tier that decides whether a force push or a deploy pattern runs. It
 *     closes nothing about a process acting as itself.
 * ---------------------------------------------------------------------------------------------
 */
export function hostDeliveredRoot() {
    const raw = process.env[HOST_DELIVERED_ROOT_ENV];
    if (typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    if (trimmed === "")
        return null;
    // ABSOLUTE, tested on the value as delivered. A relative value would resolve against the reading
    // process's working directory, which is the very input the delivered channel exists to bypass.
    if (!isAbsolute(trimmed))
        return null;
    const canonical = canonicalDirectoryPath(trimmed);
    let st;
    try {
        st = statSync(canonical);
    }
    catch {
        return null; // names nothing real
    }
    if (!st.isDirectory())
        return null;
    // A REPOSITORY, by the marker set the walk already publishes — one authority for "where a
    // repository starts", never a second list here.
    if (!REPO_BOUNDARY_MARKERS.some((marker) => existsSync(join(canonical, marker))))
        return null;
    // NOT the kit this module ships in. The kit is not a governed project, and adopting it is the
    // shape D-23 (4) and CR-13 both already refuse one tier down.
    if (canonical === canonicalDirectoryPath(GOVERNANCE_FALLBACK_BASE))
        return null;
    return canonical;
}
/**
 * THE RESOLUTION ORDER, IN WORDS, PUBLISHED ONCE (plan 31-27).
 *
 * `agent-factory/workflows/16-context-read-write.md` is asserted equal to this array in BOTH
 * directions, so the prose and the program cannot drift the way `TRUSTED_ROOT_STOP_CONDITIONS`
 * already prevents for the walk's stop set. Restating the order in prose is how a fifth tier arrives
 * documented as four.
 */
export const TRUSTED_ROOT_TIERS = Object.freeze([
    "0. The root the HOST delivered on this process's own spawn environment, under " +
        "GRUGOPS_HOST_DELIVERED_ROOT, when it canonicalises to an existing directory that carries a " +
        "version-control marker and is not the kit's own root. Available on the Claude Code hook path " +
        "only, because that is the one host that builds the hook subprocess's environment. Its VALUE on " +
        "that path is derived from CLAUDE_PROJECT_DIR — the tier-1 ambient name — read inside the frozen " +
        "PreToolUse wrapper and promoted under this name. The channel is one the agent cannot write " +
        "because the HOST builds that subprocess's environment and the wrapper is byte-frozen, not " +
        "because the name is a second variable.",
    "1. CLAUDE_PROJECT_DIR when present and non-empty after trimming, made absolute.",
    "2. GRUGOPS_PROJECT_DIR — the documented installer-set variable — under the same predicate.",
    "3. The configuration that governs the process working directory: the repository root's own when " +
        "the walk reaches a repository boundary carrying one, else the nearest ancestor carrying a " +
        "factory configuration, bounded above by the user's home directory.",
    "4. The kit this module ships in.",
]);
/**
 * THE ONE TRUSTED ROOT (plan 30-11 round 2, findings `RA2-1` and reviewer-1 observation 2; the
 * resolution order below is plan 31-15, review finding WR-15; its BOUND is plan 31-19 / D-23,
 * review finding WR-21).
 *
 * D-23 AS AMENDED BY D-26, MIRRORED HERE BECAUSE THIS IS ONE OF THE THREE PLACES THAT MUST AGREE.
 * The bound on step 3 is a property of the WALK and not of which markers a filesystem happens to
 * carry: the search HALTS at the user's home directory, an undeterminable home stops the search
 * rather than licensing an unbounded one, a repository root's own configuration outranks one
 * nested inside it, and the complete stop set is published once as `TRUSTED_ROOT_STOP_CONDITIONS`
 * with `agent-factory/workflows/16-context-read-write.md` asserted equal to it in both directions.
 *
 * D-26 AMENDS ONE SENTENCE OF D-23 AND LEAVES THE REST STANDING. D-23 said the search "never
 * inspects it or anything above it". The ASCENT halt stays; the blanket non-inspection does not.
 * The home directory itself IS inspected, exactly once, and answers only as a repository — a
 * version-control marker AND a `repository-state-plane` configuration candidate AND that candidate
 * not being one of `MODULE_OWN_CONFIG_POSITIONS`. Every input to that rule beyond the walk's
 * ordinary evidence is a path, a position or a load-time constant: no filesystem probe under
 * `$HOME`, no environment read. What the two rules do NOT establish is enumerated as `R-31-19-01`
 * through `R-31-19-07` in `TRUSTED_ROOT_RESIDUALS`. The other two places are
 * `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` and `31-23-SUMMARY.md`.
 *
 * Every consumer that needs "the root governance is read from" asks this, so there is one answer
 * rather than one per caller. It answers, in this order:
 *
 *   1. `CLAUDE_PROJECT_DIR` when present and non-empty after trimming, made absolute.
 *   2. `GRUGOPS_PROJECT_DIR` — the documented installer-set variable — under the same predicate.
 *   3. The configuration that governs the process working directory: the repository root's own
 *      when the walk reaches a repository boundary carrying one, else the nearest ancestor
 *      carrying a factory configuration. Bounded above by the user's home directory, which the
 *      search never inspects — see `TRUSTED_ROOT_STOP_CONDITIONS` for the complete stop set.
 *   4. The kit this module ships in.
 *
 * WHY STEPS 2 AND 3 EXIST (WR-15, reproduced by the round-3 verifier as spot-check row 6). Step 1's
 * variable is a CLAUDE CODE variable, and step 4 under the shipped two-root install is `~/.grugops`,
 * whose only configuration is the shipped LEAN default. So on Codex, Gemini CLI, OpenCode and
 * Copilot CLI — the four hosts D-12 names as the ones where the attended lane is absent by design,
 * which makes this in-script refusal the ONLY tier available — every D-04/D-14 refusal the writers
 * reach was evaluated against `human_admission: off` whatever the target repository's dial said.
 * Measured against the committed `.js` before this change: with the variable unset and the working
 * directory inside a project carrying `human_admission: high-severity`, a self-stamped high-severity
 * governance finding was WRITTEN, and `trustedRepoRoot()` reported the kit's install root.
 *
 * WHY THIS IS NOT A ROOT THE CALLER CHOSE — the doctrine 30-11 and 31-09 both enforce. What that
 * doctrine forbids is an admission pointed at a governance root supplied as an ARGUMENT: no
 * parameter is added here, the CLI `admit` verb still refuses a root on `argv`, and the MCP tool
 * schema still carries none. Steps 2 and 3 read the AMBIENT environment and the working directory,
 * which a process could already influence — and the step they replace resolved unconditionally to
 * the kit, which is the MOST PERMISSIVE answer available, so the change is monotone in the safe
 * direction. The residual is named, not waved away: see `TRUSTED_ROOT_RESIDUALS`.
 *
 * WHY THE PRESENCE TEST IS `trim() !== ""` AND NOT `?? `. `process.env.X ?? BASE` treats an EMPTY
 * value as a supplied one, because `""` is not nullish — so `join("", ".grugops", …)` resolves
 * against the *process's cwd*, which is neither the project root nor the kit. An empty or
 * whitespace-only value names nothing, and naming nothing is what the next step is for.
 *
 * A PRESENCE PREDICATE PUBLISHES THE VALUE IT TESTED (plan 30-11 round 3, `RA4-2`). This trimmed to
 * decide and returned the RAW value, so `CLAUDE_PROJECT_DIR=" proj "` passed the emptiness test and
 * `join()` produced `" proj /.grugops/factory.config.json"` — ENOENT, which the reader mapped to
 * ABSENCE, which is the lean posture. Measured on the round-2 artifact: one byte of padding made
 * `hooks/admission-guard.js` ALLOW an un-stamped high-severity finding with zero bytes on both
 * streams, against a control that DENIED. The trimmed value is also made ABSOLUTE (round 4,
 * reviewer-6 observation 3). Both variables go through that ONE predicate, in the loop below, so the
 * second name cannot acquire a second spelling of it.
 *
 * WHY IT IS EXPORTED. `scripts/admission-server.ts` had its own copy of this function
 * (`CLAUDE_PROJECT_DIR`, else the module's parent) — the second spelling of one rule, which is the
 * shape this module keeps deleting. The server now imports this one, and so does the CLI `admit`
 * verb, which used to read the root from `process.argv`.
 */
export function trustedRepoRoot() {
    // TIER 0, ABOVE THE LOOP AND ABOVE THE WALK (plan 31-27, S1). It is placed here rather than woven
    // into the loop for two reasons. It is a DIFFERENT KIND of signal — a host-built channel, not an
    // ambient name — and `TRUSTED_ROOT_ENV_ORDER` is the ambient precedence, which a delivered root
    // does not belong inside. And the 31-15 monotonicity mirror reconstructs the pre-31-15 program by
    // reverting exactly two anchors — the loop's first element and the walk call below — so a step
    // added ABOVE them leaves that reconstruction intact rather than silently changing what the mirror
    // compares against.
    const delivered = hostDeliveredRoot();
    if (delivered !== null)
        return delivered;
    for (const name of TRUSTED_ROOT_ENV_ORDER) {
        const fromEnv = process.env[name];
        if (typeof fromEnv === "string" && fromEnv.trim() !== "")
            return resolve(fromEnv.trim());
    }
    let cwd = null;
    try {
        // CANONICALISED WHERE IT IS READ (plan 33-16, W-21). On darwin `process.cwd()` answers the
        // kernel's realpath; on win32 it KEEPS the spelling the process was started with, so a working
        // directory addressed through a directory symlink walked from the LINK spelling and the
        // R-31-19-07 SYMLINK cell moved on windows-latest. The walk's start now goes through the same
        // canonicaliser tier 0's delivered root does, so both are spelled by one authority.
        cwd = canonicalWorkingDirectory(process.cwd());
    }
    catch {
        // A deleted working directory is not a project root. Fall through to the kit rather than throw
        // inside a governance read — the reader's job is to answer, and the un-lowered answer is safe.
        cwd = null;
    }
    // ANCHORED FOR THE MONOTONICITY MIRROR (`scripts/context-io.test.ts`, plan 31-15). That case
    // reconstructs the PRE-31-15 program — step 1, else the kit — by reverting this ONE call to `null`
    // and the loop above to its first element, then drives the same configuration set through both
    // programs and compares verdict by verdict. Each anchor's occurrence count is asserted exactly
    // before the mutation and at zero after it, so a mutation that matched nothing cannot masquerade
    // as a passing control. Keep both on ONE line each; a reformat is a red test, not a silent miss.
    // The 33-16 canonicalisation lives on the READ line inside the `try` above, so the mirror's two
    // anchors — this line and the loop's first element — are byte-untouched by it.
    const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);
    if (discovered !== null)
        return discovered;
    return GOVERNANCE_FALLBACK_BASE;
}
/**
 * WHAT THE RESOLUTION ORDER STILL CANNOT ANSWER, ENUMERATED (plan 31-15, extended by plan 31-19).
 *
 * WHY THIS IS A FROZEN EXPORT AND NOT A PARAGRAPH. This repository's recorded failure mode is that a
 * gap in a safety predicate arrives as a SILENCE — nobody wrote it down, so the next round rediscovers
 * it as a finding. A named register makes the next gap arrive as a member: `scripts/context-io.test.ts`
 * asserts the round's written dispositions set-equal to this array, so adding a member without
 * dispositioning it turns a test red rather than shipping quietly.
 *
 * NOT EVERY MEMBER IS A DEFECT. `R-31-15-02` in particular is the CORRECT answer stated so a future
 * reader does not mistake it for a hole.
 */
export const TRUSTED_ROOT_RESIDUALS = Object.freeze([
    Object.freeze({
        id: "R-31-15-01",
        hosts: "non-cc-hook-path",
        shape: "A process that can change its own working directory can decide which project's factory " +
            "configuration step 3 finds.",
        reason: "Threat T-31-15-02, dispositioned ACCEPT. It is strictly monotone against the behaviour it " +
            "replaces: step 4 resolved unconditionally to the kit, the most permissive answer available. " +
            "A process that can change its working directory can already set the step-1 or step-2 " +
            "variable in its own child environment, so this adds no capability. What the doctrine forbids " +
            "is a root chosen as an ARGUMENT, and no parameter is added. The un-forgeable tier remains the " +
            "per-call admission hook, which reads the human's fresh session grant. FIX (S1, plan 31-27): " +
            "CLOSED on the Claude Code hook path, where tier 0 reads a root the byte-frozen, " +
            "decider-hash-verifying wrapper set on its own spawn environment from a HOST-BUILT value. It " +
            "is NOT closed on Codex, Gemini CLI, OpenCode or Copilot CLI — no host there builds the " +
            "environment of a grugops decider — and it is NOT closed for an agent invoking " +
            "`scripts/context-io.js` directly from its own Bash tool, which builds its own environment; " +
            "that is this member's own already-accepted capability, not a new one.",
        what_would_force_it_closed: "A root the calling process cannot influence at all — resolved by the host from outside the " +
            "agent's process tree and delivered through a channel the agent cannot write, as the per-call " +
            "admission hook's session grant already is.",
    }),
    Object.freeze({
        id: "R-31-15-02",
        hosts: "all",
        shape: "A host repository that carries no factory configuration at any of the published candidate " +
            "positions resolves to the kit, whose shipped dial is lean.",
        reason: "This is the CORRECT answer and not a hole: a repository that configured nothing has expressed " +
            "no governance posture, and the kit's shipped default is the posture the project ships. It is " +
            "recorded here because it reads like a miss to someone tracing WR-15 and is not one. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design on every host, kept as a member so it " +
            "stops being re-discovered as a gap. It is not an open miss and no round owes it a fix.",
        what_would_force_it_closed: "Nothing in this module. It would change only if the project decided an unconfigured " +
            "repository should be treated as stricter than the shipped default, which is a product " +
            "decision about the dial and not a resolution-order defect.",
    }),
    Object.freeze({
        id: "R-31-15-03",
        hosts: "non-cc-hook-path",
        shape: "Both project-directory variables are ambient environment values; a process that controls its " +
            "own child environment sets what a child of it resolves.",
        reason: "Pre-existing and unchanged by this plan — step 1 has always had this property, and step 2 is " +
            "the same shape one name over. It is the reason the environment tier is documented as the " +
            "weaker, non-mechanically-un-forgeable signal (D-05) rather than as the authority. " +
            "FIX (S1, plan 31-27): CLOSED on the Claude Code hook path, where tier 0 answers ABOVE this " +
            "loop from a host-built channel, so neither ambient name is consulted at all. It is NOT " +
            "closed on Codex, Gemini CLI, OpenCode or Copilot CLI, where these two names remain the " +
            "answer and are exactly as ambient as this shape says.",
        what_would_force_it_closed: "The same thing that would close R-31-15-01: a governance root delivered outside the agent's " +
            "process tree — which tier 0 now IS, on the Claude Code hook path only.",
    }),
    Object.freeze({
        id: "R-31-15-04",
        hosts: "all",
        shape: "A factory configuration held ABOVE a nested repository is not found from inside that nested " +
            "repository — the walk stops at the inner repository marker.",
        reason: "Deliberate, and it is threat T-31-15-03's mitigation rather than a side effect: an unbounded " +
            "walk reaches a user's home directory and a sibling checkout's dial. Stopping at the boundary " +
            "is what makes the search safe to run from an arbitrary working directory. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design on every host. It is a mitigation, not " +
            "an open miss, and it is kept as a member so it stops being re-read as one.",
        what_would_force_it_closed: "A published, explicit statement that an outer repository governs an inner one — which today " +
            "no artifact in this project makes, and which would need its own decision record. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design on every host, and deliberately so; it " +
            "is threat T-31-15-03's mitigation and not an open miss.",
    }),
    Object.freeze({
        id: "R-31-19-01",
        hosts: "all",
        shape: "A factory configuration held at an ancestor BELOW the user's home directory, with no " +
            "repository boundary marker between it and the working directory, governs any process whose " +
            "working directory is under it.",
        reason: "That IS step 3, and it is WR-15's CLOSURE rather than a residue of it: the round-3 verifier " +
            "measured every non-Claude-Code host reading the kit's lean default instead of the target " +
            "repository's dial, and the nearest-ancestor search is what fixed it. WR-21's `Fix:` asks for " +
            "a case answering the kit for a working directory below a planted ancestor configuration. " +
            "That case is asserted here for an ancestor AT OR ABOVE the home directory, which is the " +
            "shape the review actually reproduced; asserting it for an ancestor below the home directory " +
            "would revert WR-15, so the difference is recorded rather than quietly taken. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design on every host. Refusing it reverts " +
            "WR-15, and a process that can write under `$HOME` is already a same-uid actor. Not an open " +
            "miss; kept so it stops reading as one.",
        what_would_force_it_closed: "A published statement that only a VERSION-CONTROLLED checkout may govern. That would make an " +
            "un-versioned project directory unreadable to the order, so it needs its own decision record: " +
            "nothing in this project requires a host repository to carry a repository marker.",
    }),
    Object.freeze({
        id: "R-31-19-02",
        hosts: "non-cc-hook-path",
        shape: "The home directory the stop is measured against is whatever `os.homedir()` names, which " +
            "reads the ambient `HOME` or `USERPROFILE` value a process controls in its own child " +
            "environment.",
        reason: "Pre-existing in kind, and the same shape as R-31-15-03 one name over. A process that can set " +
            "`HOME` can already set either project-directory variable, and those name the governance root " +
            "outright, so the stop adds no capability an adversary did not have. The stop exists against " +
            "the ORDINARY case the review reproduced — a legitimate shared install at `~/.grugops` " +
            "adopted by a process that meant nothing by it — not against a process choosing its own root. " +
            "FIX (S1, plan 31-27): CLOSED on the Claude Code hook path, where tier 0 answers before the " +
            "walk runs and `os.homedir()` is therefore never consulted. It is NOT closed on Codex, " +
            "Gemini CLI, OpenCode or Copilot CLI, where the walk is the answer and this stop is real.",
        what_would_force_it_closed: "The same thing that would close R-31-15-01 and R-31-15-03: a governance root resolved by the " +
            "host from outside the agent's process tree and delivered through a channel the agent cannot " +
            "write, as the per-call admission hook's session grant already is — which tier 0 now IS, on " +
            "the Claude Code hook path only. FIX (S1, plan 31-27): tier 0 answers before the walk, so " +
            "`os.homedir()` is not consulted there at all. Still open on the four non-Claude-Code hosts.",
    }),
    Object.freeze({
        id: "R-31-19-03",
        hosts: "all",
        shape: "On a platform whose filesystem reports no meaningful directory identity, the stop compares " +
            "path SPELLINGS alone, so the same home directory reached under an unusual spelling is not " +
            "recognised as the home directory.",
        reason: "Decided this way because the alternative fails in the worse direction. Where identities are " +
            "degenerate every directory carries one identity, so trusting them would stop the walk at its " +
            "first step and hand every host on that platform the kit's lean default — a configuration " +
            "moving from refused to admitted, which is the WR-15 defect this order exists to close. The " +
            "premise is CHECKED rather than assumed: the home directory's identity is compared with its " +
            "own parent's, and the identity set is discarded only where the two agree. " +
            "DISPOSITION (plan 31-27): OPEN — the ONLY open member of this register. It is measurable " +
            "only on a platform whose filesystem reports degenerate directory identity, i.e. Windows, so " +
            "no agent running on darwin can close it by measurement and none may close it by argument. " +
            "OWNER: `31-30`'s Windows leg, and the standing human item R-03. `canonicalDirectoryPath` " +
            "(plan 31-27) is the second half of the criterion below, but whether it answers correctly on " +
            "such a platform is UNMEASURED from here and is not claimed.",
        what_would_force_it_closed: "A per-platform identity primitive this module can trust, or a canonicalisation of both sides " +
            "through one resolver — either of which has to be MEASURED on that platform rather than " +
            "reasoned about from this one. DISPOSITION (plan 31-27): OPEN, and it is the only member of " +
            "this register that is. It is measurable only on Windows, so no agent on this platform can " +
            "close it; it is owned by `31-30`'s Windows leg and by the standing human item R-03. " +
            "`canonicalDirectoryPath` now exists and is the resolver the second half of the criterion " +
            "names, but whether it answers on a degenerate-identity platform is unmeasured from here.",
    }),
    Object.freeze({
        id: "R-31-19-04",
        hosts: "all",
        shape: "A version-control system whose checkout root carries a marker name absent from " +
            "`REPO_BOUNDARY_MARKERS` is not recognised as a repository root, so a configuration nested " +
            "inside such a checkout is not outranked by the checkout's own.",
        reason: "The marker set is CONTENT, and this project has learned that an open set cannot be claimed " +
            "closed. It is not load-bearing for the BOUND: the home stop bounds the walk whatever markers " +
            "a filesystem happens to carry, and this set decides only where a repository STARTS. What it " +
            "leaves is the pre-31-19 nearest-wins answer, which is what every host had before this plan. " +
            "DISPOSITION (plan 31-27): CLOSE — an open set is CONTENT and not mechanism, which is the " +
            "D-59 rule this project settled at the end of phase 27. Accepted by design, not an open miss.",
        what_would_force_it_closed: "A boundary predicate that enumerates no tools — a property every checkout root has and no " +
            "directory inside one has — which no artifact in this project can name today. " +
            "DISPOSITION (plan 31-27): CLOSE — an open set is CONTENT and not mechanism (the D-59 rule " +
            "this project settled at the end of phase 27). It is accepted by design, not an open miss.",
    }),
    Object.freeze({
        id: "R-31-19-05",
        hosts: "all",
        shape: "A repository whose root IS the user's home directory and which carries its own governance " +
            "configuration but NO version-control boundary marker is not adopted, and its dial is " +
            "replaced by the kit's shipped lean default.",
        reason: "A bare configuration position at the home directory is not evidence of a project, and " +
            "adopting one on that evidence alone is precisely the WR-21 hole plan 31-19 closed — under " +
            "the shipped shared-install model `~/.grugops/factory.config.json` is what the installer " +
            "creates for a target seeded AT home, and it is indistinguishable at that position from a " +
            "shared install's own state. The marker is what tells the two apart, and requiring it is the " +
            "narrower of the two available errors. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design. It is moot on the Claude Code hook " +
            "path after tier 0, which answers before the walk reaches home at all, and it stands " +
            "unchanged on the four hosts where the walk is the answer.",
        what_would_force_it_closed: "An explicit opt-in the walk can read that a caller cannot author. Explicitly NOT the " +
            "installer's own `.grugops/install.json`: `install/install.ts:597-620` makes every " +
            "`InstallMarker` field optional and names no TARGET, so the two-byte document `{}` is a " +
            "schema-valid marker and a caller satisfies it in ONE write. " +
            "DISPOSITION (plan 31-27): CLOSE — accepted by design; requiring the marker is the narrower " +
            "of the two available errors. It is moot on the Claude Code hook path after tier 0, which " +
            "answers before the walk reaches home at all, and it stands unchanged elsewhere.",
    }),
    Object.freeze({
        id: "R-31-19-06",
        hosts: "non-cc-hook-path",
        shape: "The home directory's adoption rests on two ordinary filesystem artifacts, so a process that " +
            "can write under `$HOME` can MAKE home adoptable in THREE operations against a bare home — " +
            "`mkdir $HOME/.git`; `mkdir $HOME/.grugops`; write `$HOME/.grugops/factory.config.json` — or " +
            "in ONE against a home already carrying a dotfiles checkout. The converse is a ONE-operation " +
            "gate LOWERING that predates this plan: `mkdir $HOME/work/.git` ends the walk at an " +
            "intermediate boundary carrying no configuration, after which the answer degrades to " +
            "`GOVERNANCE_FALLBACK_BASE`'s lean default.",
        reason: "These are the walk's OWN evidence, applied identically at every directory; neither is " +
            "introduced by plan 31-23, and both sit inside the capability `R-31-15-01` already accepts " +
            "and `31-22`'s `T-31-18-01` prices the same way. The alternative considered and REJECTED was " +
            "to distinguish the home directory by PROBING the filesystem under `$HOME`, which an " +
            "adversarial re-check measured as a one-operation flip in BOTH directions — creating " +
            "`<kitHome>/agent-factory` turned an adoption into a refusal whose answer is the kit's lean " +
            "dial, and creating `<kitHome>/install.json` turned a refusal into an adoption — and which " +
            "would therefore have handed the caller a switch rather than taken one away. A refusal at " +
            "home is NOT the safe direction, because refusing home returns `nearest` and lands on the " +
            "lean fallback; the price is therefore stated in both directions rather than as monotonicity " +
            "in one. FIX (S1, plan 31-27): CLOSED on the Claude Code hook path — tier 0 answers before " +
            "the walk, so no write under `$HOME` can reach a decision the walk never makes. It is NOT " +
            "closed on Codex, Gemini CLI, OpenCode or Copilot CLI, where the walk is the answer and the " +
            "prices stated above still stand exactly as written.",
        what_would_force_it_closed: "`R-31-15-01`'s own criterion and nothing narrower: a governance root the calling process " +
            "cannot influence at all, resolved by the host from outside the agent's process tree and " +
            "delivered through a channel the agent cannot write — which tier 0 now IS, on the Claude " +
            "Code hook path only. FIX (S1, plan 31-27): CLOSED there, because tier 0 answers before the " +
            "walk and no `$HOME` write can reach a decision the walk never makes. Still open on the four " +
            "non-Claude-Code hosts, where the walk is the answer and the price stated above still stands.",
    }),
    Object.freeze({
        id: "R-31-19-07",
        hosts: "all",
        shape: "The exclusion of the running module's own candidate positions compared LEXICALLY RESOLVED " +
            "path SPELLINGS, so the module's own position and the candidate the walk computes could name " +
            "one directory with two strings and the exclusion missed. MEASURED on a case-insensitive " +
            "filesystem: addressing this module through a case-differing spelling of its own root left " +
            "`import.meta.dirname` carrying the caller's casing while the canonical candidate carried the " +
            "on-disk casing, the equality missed, and the running kit's own configuration was eligible to " +
            "be adopted as the governance root over a project nested inside it. MEASURED on the SYMLINK " +
            "axis in the same run: the exclusion HELD, because Node's ESM resolver realpaths a symlinked " +
            "module specifier.",
        reason: "CLOSED by plan 31-27, with the measurement that closed it rather than an assurance. BOTH " +
            "sides of the comparison now pass through ONE canonicaliser, `canonicalDirectoryPath`, whose " +
            "ladder is the kernel realpath variant, then the portable realpath, then the deepest EXISTING " +
            "ancestor with the remainder re-joined — that tail is load-bearing, because a candidate " +
            "POSITION need not exist and a bare `resolve` there would have left the caller's spelling on " +
            "exactly the inputs this exclusion is asked about. THE MEASUREMENT, premise asserted first " +
            "(`realpathSync.native` returning one canonical path for both spellings, so 'one directory, " +
            "two strings' is established rather than assumed): before, the module addressed as " +
            "<tmp>/KitRoot excluded its own position and the same module addressed as <tmp>/kitroot did " +
            "NOT; after, both exclude it. This is NOT a `dev:ino` identity and NOT a `statSync` under " +
            "`$HOME` — those are the one-operation flip in the gate-lowering direction this member " +
            "previously existed instead of, and the argument is written out at the canonicaliser. It is " +
            "also not a case-FOLDING comparison, which would EXCLUDE MORE and therefore lower a gate in " +
            "the converse direction.",
        what_would_force_it_closed: "Nothing further on this axis: it is closed, on every host, by canonicalising both sides " +
            "through one resolver the caller cannot re-point without also re-pointing its own working " +
            "directory — which is `R-31-15-01`'s already-accepted capability. What remains UNMEASURED is " +
            "the behaviour of that resolver on a platform whose filesystem reports degenerate directory " +
            "identity, and that is `R-31-19-03`'s open item and its owner, not this one's.",
    }),
]);
/** The ceiling on a governance config read. Larger than any real config, small enough to bound. */
const GOVERNANCE_CONFIG_MAX_BYTES = 8 * 1024 * 1024;
/**
 * Read one governance-config candidate as text, or `null` when nothing is at that position.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS IS NOT `existsSync` + `readFileSync` (plan 30-11 round 2, finding `RA1-2`).
 *
 * `readFileSync` on a path that is not a regular file BLOCKS. Measured on the committed
 * `hooks/guard.js` and `hooks/admission-guard.js`, spawned as processes: with a FIFO at
 * `<project>/.grugops/factory.config.json` — created by a plain `mkfifo`, which the guard itself
 * ALLOWS — both hooks produced **no exit, zero bytes of stdout and zero bytes of stderr at 20
 * seconds**, against controls answering in 31 ms and 43 ms. A symlink to `/dev/zero` did the same.
 * A PreToolUse hook that never answers produces no `permissionDecision`, which the host treats as
 * non-blocking: the same event as an allow. One allowed `mkfifo` turned BOTH guards off for every
 * subsequent command, with no grant, no config declaration and no human.
 *
 * The refusal is BY RULE and not an enumeration of dangerous file types: a governance config is a
 * regular file, and anything else at that position is `unreadable` — which this reader already maps
 * to the un-lowered posture. `fstat` on the OPEN descriptor stats through a symlink, so a config
 * legitimately delivered through a symlink to a regular file still reads; `lstat` would have
 * refused it and that would be a different, wrong rule.
 *
 * `O_NONBLOCK` is what makes the open itself safe: opening a FIFO for reading blocks until a writer
 * appears unless it is set. The descriptor is stat'ed and closed; nothing is read from a
 * non-regular file at all.
 *
 * ENOENT is the ONLY error mapped to "nothing here". Every other open failure — EACCES, ELOOP, a
 * dangling symlink's ENOENT-on-target — is a file that IS at this position and could not be read,
 * which is `unreadable` and fails closed. Mapping EACCES to absence would have been a regression:
 * the old `existsSync` + `readFileSync` pair reached the unreadable branch for it.
 * ---------------------------------------------------------------------------------------------
 */
/** Does this path name a directory that exists? `false` for a file, a dangling link or an error. */
function isExistingDirectory(path) {
    try {
        return statSync(path).isDirectory();
    }
    catch {
        return false;
    }
}
function readGovernanceConfigCandidate(path) {
    // THE READER MOVED UP; THIS IS NOW A CALLER OF IT (31-21, CR-12 / D-24). The header above is kept
    // in place because it is the RECORDED ORIGIN of the rule — `RA1-2`'s measurement is why the
    // discipline exists at all. What round 5 proved is that a rule living inside one function is a
    // HABIT rather than an authority: the destination read CR-11 added to `writeNoteFile` did not
    // inherit it, and one `mkfifo` then wedged every writer in this module. So the body was lifted
    // into `readRegularFileOrNull` above, and this module has ONE non-blocking read rather than two
    // copies of one idea. A second copy of this discipline anywhere in this file is the drift shape
    // the derived read-site axis in `scripts/context-io-writer-set.test.ts` turns red.
    return readRegularFileOrNull(path, GOVERNANCE_CONFIG_MAX_BYTES, "governance config position");
}
export function readGovernanceConfig(repoRoot) {
    // An empty or whitespace-only root names nothing and falls back, exactly as an absent one does
    // (round 2, reviewer-1 observation 2) — never to the process cwd.
    const supplied = repoRoot !== undefined && repoRoot.trim() !== "";
    const base = supplied ? repoRoot.trim() : ROOT;
    // A SUPPLIED ROOT THAT IS NOT A DIRECTORY IS `unreadable`, NOT `absent` (round 3, `RA4-2` half 2).
    // "No config anywhere under a root that exists" and "the root itself does not exist" are different
    // facts, and only the first is a repository that configured nothing. Collapsing them made a
    // mistyped or padded root read as the lean posture — silent fail-OPEN on a governance dial. This is
    // the same by-rule move `RA1-2` made for a non-regular config file.
    //
    // Scoped to a SUPPLIED root on purpose: the kit fallback exists by construction, so requiring it to
    // exist would add a failure mode without adding a check. A caller that names a root owns naming one
    // that is there, and the refusal says which one was missing.
    if (supplied && !isExistingDirectory(base)) {
        return {
            source: "unreadable",
            config: { ...GOVERNANCE_DEFAULTS, checkpoints: { ...STRICTEST_MATRIX } },
            checkpointRefusals: [
                `the supplied governance root ${JSON.stringify(base)} is not an existing directory — the ` +
                    `configuration could not be looked for at all, so every checkpoint is enforced at \`block\``,
            ],
        };
    }
    const candidates = governanceConfigCandidates(base);
    for (const path of candidates) {
        // A config file EXISTS here. Any failure to read or parse it is a read FAILURE → unreadable
        // (fail closed), NOT an absence. This is the distinction the hook needs and the value reader
        // (correctly) cannot make. `readGovernanceConfigCandidate` returns null ONLY for ENOENT and
        // throws for everything else, including a path that is not a regular file (RA1-2).
        try {
            const text = readGovernanceConfigCandidate(path);
            if (text === null)
                continue;
            const parsed = JSON.parse(text);
            // The checkpoint matrix is read ONCE, from the same parsed bytes, and carried on every
            // source="ok" return below — including the degenerate-shape ones, where it supplies the roster
            // default (i.e. `block` everywhere). No branch below can return a config without a matrix.
            const cp = readCheckpointMatrix(parsed);
            // A present-but-degenerate whole-file shape (array / string / number / null) parses but is not a
            // config object — gate-or-stricter at source="ok" (it WAS read), never the lean default (GAP-C).
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                return {
                    source: "ok",
                    config: { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention, checkpoints: cp.matrix },
                    checkpointRefusals: cp.refusals,
                };
            }
            const context = parsed.context;
            // An ABSENT `context` key (governance unconfigured) stays lean; a PRESENT non-object `context`
            // (null / array / string / number) is a degenerate present shape → gate-or-stricter (GAP-C).
            if (context === undefined) {
                return { source: "ok", config: { ...GOVERNANCE_DEFAULTS, checkpoints: cp.matrix }, checkpointRefusals: cp.refusals };
            }
            if (context === null || typeof context !== "object" || Array.isArray(context)) {
                return {
                    source: "ok",
                    config: { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention, checkpoints: cp.matrix },
                    checkpointRefusals: cp.refusals,
                };
            }
            const ctx = context;
            const human = ctx.human_admission;
            const audit = ctx.audit_retention;
            return {
                source: "ok",
                config: {
                    // A PRESENT non-string human_admission → gate-or-stricter; an ABSENT key → lean `off` (GAP-C).
                    human_admission: human === undefined ? GOVERNANCE_DEFAULTS.human_admission : canonicalizeHumanAdmission(human),
                    audit_retention: typeof audit === "string" ? audit : GOVERNANCE_DEFAULTS.audit_retention,
                    checkpoints: cp.matrix,
                },
                checkpointRefusals: cp.refusals,
            };
        }
        catch {
            // Unreadable is treated as `block` everywhere — STRICTEST_MATRIX, not the roster defaults.
            // The file EXISTS and we could not read it, so what it declared is unknown, and an unknown
            // declaration is enforced at the strictest value. The fact that no matrix could be read is
            // recorded rather than presented as "nothing was configured".
            return {
                source: "unreadable",
                config: { ...GOVERNANCE_DEFAULTS, checkpoints: { ...STRICTEST_MATRIX } },
                checkpointRefusals: [
                    "the config file exists but could not be read or parsed — every checkpoint is enforced at `block`",
                ],
            };
        }
    }
    // No config file at any standard location → genuinely absent. Zero-config runs lean, and every
    // checkpoint sits at its roster default (AUTO-07): nothing is lowered by omission.
    return {
        source: "absent",
        config: { ...GOVERNANCE_DEFAULTS, checkpoints: { ...CHECKPOINT_DEFAULTS } },
        checkpointRefusals: [],
    };
}
// ── admitAndAppend + isGatedNote + isHighSeverityRole — the structured-channel persist arbiter ───
// (Plan 25-09, D-01 point-of-effect move). THREE additive exports. They REUSE the byte-frozen admit()
// (non-gated path) and the in-module sanctioned writer + GOV-02 ledger (gated path); they fork NO
// second writer and reconstruct the gated composition / severity classifier NOWHERE else (W-A single
// source). The un-forgeable Claude Code gate is the PER-CALL 25-10 PreToolUse hook, NOT these
// functions and NOT the MCP server — admitAndAppend reads no approval env; it arbitrates persistence
// from isGatedNote + the note's own verified_by stamp.
//
// CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — governance/safety surface, never caveman).
// ── normalizeKind — the SINGLE-SOURCE kind classifier (round-8 GAP-R7-1 Lever-1 anti-drift). ─────
// The ONE authority for a note's `kind` view. It MUST equal, byte-for-byte, the value parseNote
// persists for `kind`: parseNote's kv loop trims every scalar value via String.trim() (line ~286) and
// does NOT case-fold, so this returns the trimmed string with no case change. parseNote ITSELF calls
// this, and isGatedNote, the admission-guard hook, and the admission-server boundary all consult it —
// so the gate's notion of "is this a finding?" can never be NARROWER than what the store persists.
//
// GAP-R7-1 Lever-1 was exactly that divergence: the hook and isGatedNote raw-compared `kind !== "finding"`
// while parseNote trimmed, so a whitespace-padded `kind:"finding "` read as a SOFT (non-finding) kind at
// the gate (ALLOW / not-gated) yet persisted as a REAL `finding` in the store. Routing every kind view
// through this one helper makes that divergence structurally impossible.
//
// ANTI-WHACK-A-MOLE: this is NOT a denylist of padded spellings — it consults the format's own
// normalization (the SAME trim parseNote applies), so there is nothing left to drift. A zero-width code
// point (U+200B etc.) is NOT removed by String.trim(), so such a value stays a non-finding at BOTH the
// gate and the store — no divergence — which is the correct, consistent outcome (it is also not a member
// of NOTE_KINDS, so the store rejects it). Severity folding (NFKC/zero-width) is a SEPARATE concern owned
// by isHighSeverityRole; kind canonicalization deliberately mirrors parseNote and nothing more.
export function normalizeKind(raw) {
    return (raw ?? "").trim();
}
// ── isHighSeverityRole — the SINGLE-SOURCE severity classifier (W-A, round-8 anti-drift). ────────
// Severity is the AUTHORING ROLE (D-06). Canonicalize the `by` value before the allowlist test so a
// homoglyph/spacing/case variant of a role literal cannot dodge the `high-severity` dial: NFKC-fold
// (collapses full-width and compatibility forms), strip ALL whitespace AND zero-width code points
// (U+200B/C/D, U+2060, U+FEFF; ordinary whitespace incl. U+00A0 is covered by \s), then lowercase.
// A TRUE cross-script homoglyph `by` is the accepted D-06 residual (escape via human_admission: all).
// This is the ONLY severity classifier isGatedNote depends on; admit()'s frozen .trim().toLowerCase()
// D-04 classifier is a separate, WEAKER, intentionally-frozen degrade tier whose coverage ⊆ this one.
export function isHighSeverityRole(by) {
    const canonical = (by ?? "")
        .normalize("NFKC")
        .replace(/[\s\u200B\u200C\u200D\u2060\uFEFF]/gu, "")
        .toLowerCase();
    return HIGH_SEVERITY_ROLES.includes(canonical);
}
// ── isGatedNote — the SINGLE-SOURCE FULL gated decision (W-A, round-8 anti-drift). ───────────────
// The COMPLETE gated predicate lives HERE and only here: a note is gated when
//   kind === "finding" AND ((isHighSeverityRole(by) AND the dial is active) OR the dial is "all"),
// with the dial canonicalization folded in. BOTH the combiner (admitAndAppend) and the 25-10 per-call
// hook IMPORT this; NEITHER reconstructs the `((high-sev && active) || all)` composition locally —
// that duplicated composition was the 10-round drift surface (the allow-forge risk: the hook reading
// not-gated/allow-unchecked while the combiner reads gated/trust-the-stamp). configResult is the
// discriminated read (readGovernanceConfig): an UNREADABLE config fails CLOSED (gate-or-stricter,
// SC3). The value reader already canonicalizes a present non-string dial to "all" (gate-or-stricter),
// so config.human_admission is always a string here; a present typo/garbage string is also treated as
// gate-or-stricter. Only the exact string "off" (or a genuinely absent config, which reads "off") is
// NOT gated.
export function isGatedNote(by, kind, configResult) {
    // Only a finding is ever gated — soft kinds carry no stamp (D-08). Consult the single-source kind
    // authority (round-8 GAP-R7-1 Lever-1): a whitespace-padded `kind:"finding "` normalizes to "finding"
    // here EXACTLY as parseNote persists it, so the gate's finding-view can never be narrower than the
    // store's. This is the SAME normalizeKind the admission-guard hook and the admission-server consult.
    if (normalizeKind(kind) !== "finding")
        return false;
    // A config file that EXISTS but cannot be read/parsed → fail closed (gate-or-stricter, SC3).
    if (configResult.source === "unreadable")
        return true;
    const dial = configResult.config.human_admission;
    if (dial === "off")
        return false; // lean / explicitly off → never gated
    if (dial === "all")
        return true; // strictest → every finding gated
    if (dial === "high-severity")
        return isHighSeverityRole(by); // gated iff a high-severity role
    // Any other PRESENT value (a typo, garbage, or a canonicalized non-string) → gate-or-stricter.
    return true;
}
// ── admitAndAppend — the additive admit-decides-then-persist combiner (D-01 point-of-effect). ────
// Decides admission, then persists ONLY on success through appendNote (the SOLE sanctioned writer),
// returning the new note id; on refusal it returns the named findings and persists NOTHING (the
// no-fabrication floor — it never rewrites a note to make it pass). It reads NO approval env: the
// un-forgeable per-entry gate is the per-call 25-10 hook. repoRoot resolves the governance config AND
// the audit ledger (defaults to the script's own repo root); tests pass an explicit temp root.
export function admitAndAppend(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT, 
// TEST SEAM (31-09, review finding WR-10) — moved in the SAME change as appendNote's. Production
// callers pass nothing: the governance root is the ONE trusted answer, the same reader the hooks,
// the admission server and the CLI `admit` verb ask. Moving one default and not the other would
// re-introduce the divergence in the other direction, which is why they move together.
repoRoot = trustedRepoRoot()) {
    assertSafeTask(task);
    // ── THE OWNING REPOSITORY IS DERIVED FROM THIS CALL'S OWN STORE (31-33, CR-22 / D-34). ────────
    //
    // `agent-factory/workflows/18-context-compaction.md` names this route BY HAND as the other one
    // that writes a note and a GOV-02 ledger event, and states that "both steps name the same
    // derived repository". Measured FALSE here against the committed `.js`, with three real
    // governance roots each asserted `governanceRootOf(store) === root` first:
    // `admitAndAppend("T-2", {verified_by:"human:alice"}, …, contextRoot = DEST store,
    // repoRoot = THIRD)` wrote the note into DEST and appended its event into THIRD — a
    // human-disposed finding in one repository with its own audit record in another, on the exact
    // route the sentence names.
    //
    // IT IS DERIVED AT THE ENTRY, ABOVE EVERY BRANCH, for the reason the entry block of
    // `promoteAdmitted` states: a property claimed of a function is established at the function's
    // entry or it is not established. `repoRoot` still answers the governance DIAL below; it no
    // longer decides where the gated branch's record lands.
    //
    // WHAT IT USED TO DISCARD, AND WHY THAT WAS THE WHOLE OF CR-26 (31-39, D-39). This line read
    // `governanceRootOf(contextRoot) ?? repoRoot`, which is a derivation followed immediately by a
    // decision to ignore its failure: when `contextRoot` did not resolve to a governed store the
    // record silently followed the caller's dial root instead. That is the pre-fix program and the
    // exact split CR-22 was raised on, still reachable — while the sibling route `promoteAdmitted`
    // DECLINED the identical input shape by name. One input, two routes, two opposite dispositions.
    //
    // THE FALLBACK IS NOT NARROWED, IT IS UNSPELLABLE NOW. `actionOwnerRoot` answers a discriminated
    // `ActionOwner` with no null member, so there is nothing for `??` to coalesce and falling open
    // would cost an explicit branch a reviewer meets. The UNION of this route's two branches now
    // answers one way, because both consume this one value.
    //
    // BOTH BRANCHES REACH THE LEDGER THROUGH IT. The gated branch appends through
    // `appendAuditLedger` directly and consumes it at its own retention guard; the NON-GATED branch
    // hands it to `admit()` as that authority's ledger owner, which is the deliberate unfreeze
    // `R-31-39-01` records and the closure of `R-31-33-01`.
    const actionOwner = actionOwnerRoot(contextRoot);
    // Decide GATED via the SINGLE-SOURCE predicate (W-A) — NOT a local reconstruction; the SAME
    // isGatedNote the 25-10 per-call hook imports. The discriminated read fails closed on an unreadable
    // config (gate-or-stricter, SC3).
    const configResult = readGovernanceConfig(repoRoot);
    const gated = isGatedNote(note.by, note.kind, configResult);
    const vb = (note.verified_by ?? "").trim();
    if (gated) {
        // GATED: persist ONLY with a valid human:NAME disposition stamp. On Claude Code the per-call
        // 25-10 hook validated this stamp against the FRESH human-set session env, so the disposition is
        // un-forgeable per entry; on the non-CC / direct-node tier it is the weaker self-settable D-05
        // residual (documented, not over-claimed). A gated note lacking a valid human:NAME stamp is
        // REFUSED naming the fault — this also backstops a gated routine note under human_admission: all
        // that carries no disposition (W5).
        if (!HUMAN_STAMP_RE.test(vb)) {
            return {
                id: null,
                findings: [
                    "admission REFUSED: this note is gated under the active human_admission setting and " +
                        "requires a named human disposition (verified_by: human:NAME). It carries " +
                        (vb === "" ? "no disposition stamp" : `"${vb}", which is not a human:NAME stamp`) +
                        ". A named human grants the specific disposition through the per-call admission hook; " +
                        "admission is refused until then. No note was written.",
                ],
            };
        }
        // Reuse the IN-MODULE composeNote + validate, then persist through the module-private
        // PRE-ADMITTED route. Compose with a frozen id so the persisted <id>.md and the GOV-02 ledger
        // record share one identity. On a structurally invalid note, return the findings rather than
        // throwing.
        //
        // WHY THIS BRANCH SKIPS THE AUTHORITY, WRITTEN AT ITS SITE (31-09, CR-05 consequence (a)).
        // `admit()`'s FROZEN D-04 arm refuses a high-severity governance finding that carries no
        // verifiable human disposition — and it cannot verify one, because it is the weaker, self-settable
        // tier (D-05). This branch is reached only AFTER the un-forgeable per-call 25-10 admission hook
        // has already disposed exactly this note against the human-set session variable an agent's child
        // env can never reach. Sending it through `admit()` would therefore refuse a note a named human
        // has already approved — the authority answering a question it is structurally unable to answer
        // here. The skip is deliberate, it is bounded by the derived caller-set assertion in
        // `scripts/context-io-writer-set.test.ts`, and it is the reason that route is not exported.
        const id = noteId(note);
        const text = composeNote(note, body, id);
        const findings = validate(text);
        if (findings.length > 0)
            return { id: null, findings };
        // ── THE LEDGER EVENT PRECEDES THE NOTE WRITE HERE TOO (31-21, WR-22 (1) / D-24). ────────────
        // THE SECOND ROUTE THAT WRITES BOTH, AND THE REASON IT IS INVERTED IN THE SAME CHANGE. The
        // round-5 review named `promoteAdmitted` alone. This branch has the identical pair — a note
        // write and a GOV-02 append with `disposed_by` derived from the very `human:NAME` stamp that
        // makes the note human-disposed — so it produces verbatim the same "a destination holding a
        // human-disposed finding with no ledger line" on any crash between the two steps. Inverting
        // only the route a reviewer happened to walk would leave the corrected sentence in
        // `agent-factory/workflows/18-context-compaction.md` FALSE at the other one: the claim
        // outrunning the mechanism inside the edit that exists to stop it. The full argument for which
        // asymmetry is the safe one is written ONCE, at `promoteAdmitted`'s ledger block above.
        //
        // NO VALUE IS CARRIED BACKWARDS. `id` is frozen by `noteId(note)` above, composed into `text`,
        // and passed to `appendPreAdmittedNote` — which is what the branch's own comment already states
        // it is frozen FOR. So the event is keyed on `id` and the append simply moves up.
        if (configResult.config.audit_retention === "retained") {
            // THE POINT OF EFFECT, AND THE SAME DISPOSITION THE SIBLING ROUTE TAKES (31-39, CR-26 /
            // D-39). A record is about to be written, so this action genuinely has two halves; if the
            // repository that owns them cannot be named, NOTHING is written and the refusal carries the
            // one shared clause and the one shared sentence `promoteAdmitted` raises for the identical
            // input shape. Under the lean retention value this guard is not entered at all, which is why
            // the refusal is scoped here rather than at the entry — see `admit()`'s own guard for the
            // measurement that decided the scope.
            if (!actionOwner.answered) {
                return { id: null, findings: [unnameableOwnerRefusal(actionOwner.store)] };
            }
            const scalars = {
                id,
                kind: note.kind,
                by: note.by,
                at: note.at,
                verified_by: note.verified_by,
                confidence: note.confidence,
            };
            // GOV-02 ledger (retained mode only): reuse the SAME private appendAuditLedger admit() uses —
            // disposed_by derives from the human:NAME stamp; severity is the role classification (D-06).
            //
            // A LEDGER THAT CANNOT BE WRITTEN REFUSES THE ADMISSION, in this branch too and for the same
            // reason as in `admit()`. Because the append now runs BEFORE the note write, the refusal is
            // returned with nothing on disk — the ordering and the fail-closed direction reinforce each
            // other rather than each needing its own cleanup.
            try {
                // BOTH HALVES KEY ON `ledgerRoot` (31-33, CR-22). `repoRoot` answered this append until
                // round 7 measured the consequence: the note went to `contextRoot`'s store and the event
                // went to `repoRoot`'s ledger, in two different repositories. `repoRoot` still answers the
                // governance-dial read above; it no longer answers WHERE the record lands.
                appendAuditLedger(actionOwner.root, scalars, isHighSeverityRole(note.by), vb);
            }
            catch (e) {
                return {
                    id: null,
                    findings: [
                        `admission REFUSED (audit_retention: retained): the GOV-02 audit ledger could not be ` +
                            `written, so this admission cannot be recorded. ${UNRECORDABLE_ADMISSION_REFUSAL} No ` +
                            `note was written. Underlying reason: ${e.message}`,
                    ],
                };
            }
        }
        const persistedId = appendPreAdmittedNote(task, note, body, contextRoot, id);
        if (persistedId !== id) {
            throw new Error(`context-io.admitAndAppend: internal — the persisted note id "${persistedId}" is not the ` +
                `frozen id "${id}" the GOV-02 ledger event was keyed on. The audit record and the note ` +
                `must share one identity.`);
        }
        return { id: persistedId, findings: [] };
    }
    // NON-GATED: a human:NAME stamp is illegitimate here — it would forge a disposed_by ledger entry.
    // REJECT an agent-supplied human:NAME on a non-gated note (W3): verified_by must be empty or a
    // §14-gate#<id> stamp. Nothing is written.
    if (HUMAN_STAMP_RE.test(vb)) {
        return {
            id: null,
            findings: [
                "admission REFUSED (W3): this note is not gated, so its verified_by must be empty or a " +
                    `"§14-gate#<id>" stamp — it must not carry a "human:NAME" disposition ("${vb}"). A human ` +
                    "disposition is meaningful only on a gated entry; accepting one here would forge a " +
                    "disposed_by audit record. No note was written.",
            ],
        };
    }
    // Route the non-gated note through admit() UNCHANGED (validate + Posture-B §14-gate cross-check +
    // the D-04 branch, which cannot fire on a non-gated note + the GOV-02 ledger). Compose with a frozen
    // id so the ledger record and the persisted <id>.md share one identity, then persist that same id on
    // success. Posture-B is preserved (VFY-01).
    const id = noteId(note);
    const text = composeNote(note, body, id);
    // A GOV-02 ledger that cannot be written refuses here too (31-21). Same argument as `appendNote`'s:
    // the authority decides admissibility, the WRITER owns the recording failure, and this branch
    // returns findings rather than throwing because that is its contract.
    let findings;
    try {
        // THROUGH THE AUTHORITY, WITH THE DIAL AND THE RECORD AIMED SEPARATELY (31-39, D-39). This
        // branch reaches the ledger through the byte-frozen authority rather than through
        // `appendAuditLedger` directly. Until this plan that authority took ONE root for both the dial
        // read and the append, so this branch could not be aimed without moving the dial — the exposure
        // `R-31-33-01` published. `admit()` is now deliberately unfrozen (`R-31-39-01`) and takes a
        // ledger owner distinct from its dial root, so the SAME `actionOwner` the gated branch consumes
        // is handed here and the union of the two branches answers one way.
        findings = admit(task, text, contextRoot, repoRoot, actionOwner);
    }
    catch (e) {
        return {
            id: null,
            findings: [
                `admission REFUSED: the admission could not be decided or could not be recorded. ` +
                    `${UNRECORDABLE_ADMISSION_REFUSAL} No note was written. Underlying reason: ` +
                    `${e.message}`,
            ],
        };
    }
    if (findings.length > 0)
        return { id: null, findings };
    // WHY THIS BRANCH SKIPS THE AUTHORITY, WRITTEN AT ITS SITE (31-09, CR-05 consequence (b)). The
    // line directly above IS the authority call. Persisting through `appendNote` would call `admit()`
    // a SECOND time on the same note in the same context — deciding one question twice, which is this
    // repository's named failure class, and appending a SECOND GOV-02 ledger event under
    // `audit_retention: retained`, because the ledger records admissions rather than notes. (That
    // duplicate is what residual `R-21` disclosed for the one kind 31-05 wired; routing this branch
    // through the pre-admitted route COLLAPSES it rather than widening it to every kind.)
    const persistedId = appendPreAdmittedNote(task, note, body, contextRoot, id);
    return { id: persistedId, findings: [] };
}
// ── CLI entrypoint (only when run directly, never on import) ────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node context-io.js ...`.
// ONE authority for the entrypoint predicate (round 4, `RA6-1`) — see scripts/is-entry.ts
// for why a per-file spelling of it silently no-ops under a symlinked path.
const isMain = isEntrypoint(import.meta.url);
/**
 * Read a note file named on the CLI, through the module's ONE reader (31-21, D-24).
 *
 * The last two caller-influenced read positions in this module are these two argv paths. Routing
 * them here rather than exempting them is what makes D-24's rule TOTAL for this file: the derived
 * read-site axis in `scripts/context-io-writer-set.test.ts` then has no survivor to argue about, and
 * "every read goes through the one reader" is a count rather than a sentence with two footnotes.
 * A missing file and a position that is not a regular file are different messages, both bounded.
 */
function readCliNoteFileOrExit(noteFile) {
    let text;
    try {
        text = readRegularFileOrNull(noteFile, NOTE_FILE_MAX_BYTES, "note file named on the command line");
    }
    catch (e) {
        console.error(e.message);
        process.exit(1);
    }
    if (text === null) {
        console.error(`context-io: no file at ${JSON.stringify(noteFile)}.`);
        process.exit(1);
    }
    return text;
}
if (isMain) {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
        if (cmd === "validate") {
            const noteFile = rest[0];
            if (!noteFile) {
                console.error("usage: context-io.js validate <noteFile>");
                process.exit(1);
            }
            const findings = validate(readCliNoteFileOrExit(noteFile));
            if (findings.length > 0) {
                for (const f of findings)
                    console.error(f);
                process.exit(1);
            }
            console.log("note valid: all required provenance fields present, kind is one of the six.");
            process.exit(0);
        }
        else if (cmd === "admit") {
            // Context-aware admission (D-01): structural validate + the §14-gate verdict cross-check.
            //
            // THE GOVERNANCE ROOT IS NOT AN ARGUMENT (plan 30-11 round 2, finding `RA2-1`). This verb used
            // to read `contextRoot` and `repoRoot` from `process.argv` — the exact two arguments GAP-R6-2
            // removed from the MCP tool schema, where `scripts/admission-server.ts` states in this same
            // codebase that "the dial / ledger root / context root MUST come from the SAME trusted source
            // … NOT from agent-supplied tool args … the agent can no longer point governance at a root it
            // controls." The fix was applied to the schema and not to the CLI — which is the surface the
            // four non-Claude-Code CLIs use, i.e. exactly the tier the MCP fix does not cover.
            //
            // Measured on the committed artifact: the identical self-stamped high-severity finding was
            // REFUSED with `repoRoot` naming a repository whose dial is active, and ADMITTED with
            // `repoRoot` naming an empty directory. A test seam was sitting on the production verb.
            //
            // Both roots now come from `trustedRepoRoot()`. Tests reach `admit()` in-process, where the
            // parameters remain — a test seam belongs in the function signature, not in argv.
            const task = rest[0];
            const noteFile = rest[1];
            if (!task || !noteFile || rest.length !== 2) {
                console.error("usage: context-io.js admit <task> <noteFile>");
                console.error(`context-io: admit takes exactly 2 positional arguments and received ${rest.length}. ` +
                    `The governance root is NOT an argument: it is ${TRUSTED_ROOT_ENV_ORDER.join(", else ")}` +
                    `, else the nearest ancestor of the working directory carrying a factory configuration ` +
                    `(bounded by the repository marker), else the kit this script ships in. Set ` +
                    `${TRUSTED_ROOT_ENV_ORDER[0]} to move it — an admission may not point governance at a ` +
                    `root the caller chose.`);
                process.exit(1);
            }
            const admitRoot = trustedRepoRoot();
            const findings = admit(task, readCliNoteFileOrExit(noteFile), join(admitRoot, ".grugops", "context"), admitRoot);
            if (findings.length > 0) {
                for (const f of findings)
                    console.error(f);
                process.exit(1);
            }
            // WHAT THIS LINE MAY ASSERT (plan 30-11, finding A-7). It used to read "structurally valid
            // and the §14-gate stamp matches a live green verdict" — printed unconditionally. Measured:
            // a finding carrying a `human:<name>` stamp, and a soft `claim` note, both print that line
            // while NO gate cross-check ran at all, because only a §14-gate-stamped finding is
            // cross-checked. A success line that names a check the run did not perform is the same shape
            // this repository records at severity `blocking` and has closed twice elsewhere in this phase.
            //
            // The fix is not a second predicate here deciding which checks applied — that would put the
            // admission rule in two places. It is to say only what is true of EVERY admitted note: it
            // passed every check that applies to it.
            console.log(`note admitted: it passed every admission check that applies to it — structural ` +
                `validation, the reserved-identity rule, the governance dial in force, and, for a ` +
                `finding stamped §14-gate#<id>, the live-green-verdict cross-check.`);
            process.exit(0);
        }
        else if (cmd === "emit-verdict") {
            // The emission surface 05-pr-quality-gate.md describes (plan 30-05). The integrity argument
            // is read from its command-line position and passed through UNMODIFIED — no canonicalization,
            // no defaulting, no coercion — so an absent or unrecognized one reaches exactly the same
            // refusal as the in-process path and the two surfaces cannot come to disagree.
            const task = rest[0];
            const id = rest[1];
            const integrity = rest[2];
            const sha = rest[3]; // the commit the gate run was performed at (plan 31-01, D-01)
            const contextRoot = rest[4]; // optional explicit root (tests pass a temp dir)
            // ARITY IS THE CLI'S OWN CONCERN, AND IT IS CHECKED HERE (plan 30-11, finding A-8).
            //
            // The verb takes four required positional arguments and one optional one. Without this
            // check, an invocation with too few or too many arguments was accepted silently: two
            // arguments passed `undefined` into the integrity slot, and one too many let a stowaway
            // argument sit unremarked after the context root.
            //
            // It is an ARITY check and deliberately not a VALUE check. The integrity value and the SHA
            // are passed through UNMODIFIED — no canonicalization, no defaulting, no coercion — so the
            // CLI and the in-process path cannot come to disagree about which values admit a verdict or
            // which SHAs are well-formed. Checking argv's SHAPE adds no second authority over those
            // vocabularies; checking the values here would.
            //
            // WHAT ARITY CANNOT DECIDE, WRITTEN DOWN RATHER THAN FUDGED. A caller using the pre-30-05
            // shape `emit-verdict <task> <id> <contextRoot>` passes exactly THREE arguments, which is
            // also the legitimate shape `emit-verdict <task> <id> clean`. The two are indistinguishable
            // by count, and the only thing that separates them is the VALUE — which is precisely what
            // this site must not inspect. Since plan 31-01 the legitimate shape carries FOUR required
            // arguments, so that particular collision now fails the arity check outright; the general
            // point stands for any shifted four-argument invocation, which is left to the refusals below,
            // where it fails CLOSED (a filesystem path is neither `clean` nor lowercase hex, so nothing
            // is written) and the message names the argument order unconditionally rather than guessing
            // at the caller's intent. The residual is recorded in docs/audit/30-redteam-surface-a.md § A-8.
            if (!task || !id || rest.length < 4 || rest.length > 5) {
                console.error("usage: context-io.js emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot]");
                console.error(`context-io: emit-verdict takes 4 or 5 positional arguments and received ${rest.length}. ` +
                    `The third is the gate run's test-integrity result and the fourth is the commit SHA the ` +
                    `run was performed at, NOT the context root — a shifted invocation would have its ` +
                    `context root read as a test outcome. Nothing was written.`);
                process.exit(1);
            }
            const noteIdStr = emitVerdict(task, id, integrity, sha, contextRoot ?? DEFAULT_CONTEXT_ROOT);
            if (noteIdStr === null) {
                console.error(`context-io: refusing to emit a green verdict — the test-integrity result was ` +
                    `${JSON.stringify(integrity ?? null)}, and only "clean" admits one. Nothing was ` +
                    `written. The finding stays at UNKNOWN - verify. ` +
                    // Stated UNCONDITIONALLY, never as a guess about the value above (plan 30-11, A-8).
                    // The third positional is the integrity result, the FOURTH is the commit SHA and the
                    // FIFTH is the context root; a caller using an older shape has some other value land
                    // here, and the refusal would otherwise read as a claim about a test run that never
                    // happened.
                    `Argument order: emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot] ` +
                    `— the THIRD argument is the test-integrity result, the FOURTH is the commit SHA the ` +
                    `gate run was performed at, and the FIFTH is the context root.`);
                process.exit(1);
            }
            console.log(`verdict emitted: ${noteIdStr} (§14-gate#${id}).`);
            process.exit(0);
        }
        else if (cmd === "render") {
            const task = rest[0];
            const contextRoot = rest[1]; // optional explicit root (tests pass a temp dir)
            if (!task) {
                console.error("usage: context-io.js render <task> [contextRoot]");
                process.exit(1);
            }
            render(task, contextRoot ?? DEFAULT_CONTEXT_ROOT);
            console.log(`rendered index.md + index.jsonl for task "${task}".`);
            process.exit(0);
        }
        else {
            console.error("usage: context-io.js <validate <noteFile> | admit <task> <noteFile> | emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot] | render <task> [contextRoot]>");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`context-io: ${e.message}`);
        process.exit(1);
    }
}
