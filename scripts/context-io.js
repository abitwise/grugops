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
import { writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, mkdirSync, existsSync, } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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
// ── The two accepted verified_by grammars (D-05/D-06/D-07) ──────────────────────────────────────
// Anchored allowlists modeled on TASK_NAME_RE — only these two grammars admit a `finding`:
//   - §14-gate#<id>  the workhorse; admission cross-checks a live green verdict (D-01).
//   - human:<name>   the escalation valve (D-07); its un-forgeability is layered in Phase 25.
// There is NO separate passing-test-reference grammar: a passing test IS a green gate run, so the
// gate grammar already covers it (D-05/D-06). The id/name segment reuses the task-name allowlist.
const GATE_STAMP_RE = /^§14-gate#[A-Za-z0-9._-]+$/;
const HUMAN_STAMP_RE = /^human:[A-Za-z0-9._-]+$/;
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
// ── looksLikeFrontmatterLine: the BROADER fail-closure trigger. ─────────────────────────────────
// A line that LOOKS like frontmatter even when it is not cleanly recognized: a `<key>:` line at ANY
// indent, INCLUDING the `key : value` (space-before-colon) shape and an indented `  id:` line. This
// is deliberately wider than isRecognizedFrontmatterLine so that splitNotes can FAIL CLOSED on a
// `---`-boundary-shaped line followed by a frontmatter-LOOKING line it cannot cleanly recover —
// rather than silently absorbing it into a prior note's body (the 6th-bypass class). A region that
// looks-like-frontmatter but is not recognized is refused (loud), never swallowed.
function looksLikeFrontmatterLine(line) {
    // A key (optionally indented) followed by an optional space and a colon — `id:`, `  id:`,
    // `kind :`, `key : value`. The recognized set is a strict subset of this.
    return /^\s*[A-Za-z_][A-Za-z0-9_]*\s*:/.test(line);
}
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
//   2. notes.join("") + (trailingMalformed ?? "") reproduces the CRLF-normalized input BYTE-FOR-BYTE
//      (no byte invented, none dropped) — recovered notes first, then the refused remainder.
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
    const sliceBytes = (from, to) => {
        const segment = lines.slice(from, to).join("\n");
        return to < lines.length ? segment + "\n" : segment;
    };
    // ── Identifying a NOTE BOUNDARY (the load-bearing, drift-proof, id-centered rule). ──────────────
    // Every note the carve-out tracks is matched raw→promoted on its frozen `id` — a fence WITHOUT an id
    // cannot participate in the carve-out, so it is definitionally BODY content, not a note. This is the
    // principled discriminator that lets broadened recognition (recover a kind-first note #2) coexist
    // with the round-5 body-`---` win (an embedded `---\nkey: value\n---` block inside a body has NO id
    // and is consumed as body, never a spurious note).
    //
    // A NOTE BOUNDARY is a `---`-boundary-shaped line (trailing-whitespace tolerant) that OPENS a
    // frontmatter run — the maximal run of CONTIGUOUS frontmatter-LOOKING lines that follows, up to its
    // closing `---` — and that run CONTAINS an `id:`-looking line (`id:` at ANY indent: column-0 `id:`,
    // kind-first with `id:` on a later line, or an indented ` id:`). Because the run is keyed on the id
    // (the carve-out's identity), the boundary survives field-reordering (kind-first) and is broader than
    // the round-6 `/^id:/`-first subset — the drift that was the 6th bypass. The trailing-whitespace
    // tolerance of isBoundaryShapedLine handles the `--- ` variant.
    const ID_LOOKING = /^\s*id\s*:/;
    // Does the frontmatter run that opens at boundary line `i` (i.e. starting at line i+1) contain an
    // id-looking line before it ends? The run ends at the closing `---`-shaped line or the first line
    // that is neither frontmatter-looking nor blank. A blank line inside a fence is legal frontmatter
    // (parseNote skips it), so it does not end the run.
    const opensIdBearingRun = (i) => {
        for (let j = i + 1; j < lines.length; j++) {
            const l = lines[j];
            if (isBoundaryShapedLine(l))
                return false; // hit the closing fence with no id seen
            if (ID_LOOKING.test(l))
                return true; // an id-looking line — this is a note opening
            if (l.trim() === "")
                continue; // a blank line is legal inside frontmatter
            if (!looksLikeFrontmatterLine(l))
                return false; // body text — not a frontmatter run
        }
        return false; // ran off the end without a closing fence or an id
    };
    const isBoundaryAt = (i) => isBoundaryShapedLine(lines[i]) &&
        i + 1 < lines.length &&
        looksLikeFrontmatterLine(lines[i + 1]) &&
        opensIdBearingRun(i);
    // Find every note-boundary index in document order.
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
    // when a region is refused the file is surfaced as unparseable (not promoted), and
    // notes.join("") + refused === normalized still holds (recovered + refused regions tile the input
    // exactly). trailingMalformed is null only when nothing non-blank was refused.
    const trailingMalformed = refused.trim() === "" ? null : refused;
    return { notes, trailingMalformed };
}
// ── Validate a note's structure (SC-1, extended in Phase 21 with the D-09/D-02 refuse-self set). ─
// PURE text→findings — inspects ONLY the parsed scalars, never reads context (D-10 keeps the cheap
// structural check pure; the context-aware admission cross-check is the separate admit() function).
// `trustedGateEmission` is the D-04 carve-out flag the gate's own emitVerdict() path sets so its
// reserved `by: §14-gate` verdict note is not rejected as an impersonation. The plain CLI
// `validate <file>` verb NEVER sets it, so an agent impersonating the gate always FAILs.
export function validate(text, trustedGateEmission = false) {
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
    // ── D-02 reserved-identity rule (applies to ANY note, not only findings) ──────────────────────
    // A note authored `by: §14-gate` is an impersonation flag, EXCEPT the gate's own verdict
    // emission (D-04), which routes through emitVerdict() and sets trustedGateEmission.
    if (scalars.by === GATE_IDENTITY && !trustedGateEmission) {
        findings.push(`structural FAIL: "${GATE_IDENTITY}" is a reserved author identity (the §14 quality gate). ` +
            `A note may not be authored by it — this is an impersonation flag. Only the gate's own ` +
            `verdict emission may use this identity.`);
    }
    // ── D-09 refuse-self FAIL set, GATED on kind === "finding" (D-08 — only a finding needs a stamp).
    // Still text-only: inspects scalars.verified_by / scalars.by only. The gate's own verdict is a
    // `finding` authored by the trusted root (D-04): it carries no verified_by of its own (nothing
    // verifies the root), so the refuse-self set is suppressed for the trusted-gate-emission path.
    if (scalars.kind === "finding" && !trustedGateEmission) {
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
        refsBlock +
        `supersedes: ${note.supersedes ?? ""}\n` +
        "---\n\n" +
        (body.endsWith("\n") ? body : body + "\n"));
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
// ── appendNote: validate → compose → atomicWrite to a FRESH unique notes/<id>.md (append-only). ──
// Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication.
export function appendNote(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT) {
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
    // Compute the frozen id ONCE and use it for BOTH the emitted `id:` frontmatter field and the
    // <id>.md filename — a single source of the identity so frontmatter `id` and filename can never
    // diverge. Guard it as a single-line field (an attacker must not forge/collide an id via a
    // smuggled frontmatter line).
    const id = noteId(note);
    assertSingleLine("id", id);
    const text = composeNote(note, body, id);
    const findings = validate(text);
    if (findings.length > 0) {
        throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
    }
    const notesDir = join(contextRoot, task, "notes");
    mkdirSync(notesDir, { recursive: true });
    atomicWrite(join(notesDir, `${id}.md`), text);
    return id;
}
// ── readContext: parse every notes/<id>.md into a NoteRecord[] (id from the filename). ──────────
export function readContext(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const notesDir = join(contextRoot, task, "notes");
    if (!existsSync(notesDir))
        return [];
    const records = [];
    for (const file of readdirSync(notesDir)) {
        if (!file.endsWith(".md"))
            continue;
        const text = readFileSync(join(notesDir, file), "utf8");
        const parsed = parseNote(text);
        if (!parsed)
            continue; // skip an unparseable file rather than crash the read
        const s = parsed.scalars;
        // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
        // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
        // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
        // wins for the read and the divergence is left for validate() to surface on the explicit path.
        const fileId = file.replace(/\.md$/, "");
        const id = s.id && s.id !== "" ? s.id : fileId;
        records.push({
            id,
            kind: s.kind ?? "",
            by: s.by ?? "",
            at: s.at ?? "",
            verified_by: s.verified_by ?? "",
            confidence: s.confidence ?? "",
            refs: parsed.refs,
            supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
            body: parsed.body.trim(),
        });
    }
    return records;
}
// ── currentState: deterministic replay (SCTX-04). Sort by at (ISO lexicographic) with note-id ──
// tiebreak; fold out any note whose id appears in another note's supersedes. NEVER file position
// or mtime.
export function currentState(notes) {
    const ordered = [...notes].sort((a, b) => a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id));
    const superseded = new Set(ordered.map((n) => n.supersedes).filter((x) => x !== null && x !== ""));
    return ordered.filter((n) => !superseded.has(n.id));
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
// ── emitVerdict: the §14 gate's verdict emission carve-out (D-03/D-04). ──────────────────────────
// The ONE path allowed to author a `by: §14-gate` note. Called by the §14 quality gate step
// (05-pr-quality-gate.md, Plan 02) on a GREEN terminal result, carrying the unique per-run <id>
// that downstream findings reference in `verified_by: §14-gate#<id>`. Composes a verdict note,
// validates it with the trusted-gate-emission carve-out (so the reserved-identity rule does not
// reject the gate's own note), and atomically appends it under the task. Returns the verdict
// note's id. The per-run <id> is the caller's (the gate generates it via node:crypto, D-03).
export function emitVerdict(task, id, contextRoot = DEFAULT_CONTEXT_ROOT, at = new Date().toISOString()) {
    assertSafeTask(task);
    // The per-run id is interpolated into a ref; it must be single-line and grammar-clean so the
    // emitted stamp `§14-gate#<id>` is a valid GATE_STAMP_RE stamp downstream findings can match.
    assertSingleLine("verdict id", id);
    if (!GATE_STAMP_RE.test(verdictStampFor(id))) {
        throw new Error(`context-io.emitVerdict: invalid per-run id "${id}" — the emitted stamp ` +
            `"${verdictStampFor(id)}" must match ${GATE_STAMP_RE}.`);
    }
    const note = {
        kind: "finding",
        by: GATE_IDENTITY,
        at,
        verified_by: "", // the gate is the root of trust (D-04) — its verdict stamps nothing above it
        confidence: "high",
        refs: [verdictStampFor(id)],
        supersedes: null,
    };
    const body = `${VERDICT_GREEN_MARKER}: the §14 quality gate run ${id} passed (all checks green).`;
    for (const r of note.refs)
        assertSingleLine("refs[]", r);
    // The verdict note carries its own frozen id (the same one in its <id>.md filename) — a single
    // source of identity, single-line-guarded like every other provenance field.
    const noteIdStr = noteId(note);
    assertSingleLine("id", noteIdStr);
    const text = composeNote(note, body, noteIdStr);
    // Validate WITH the trusted-gate-emission carve-out: the reserved-identity rule is suppressed for
    // this one path (D-04); every other structural rule still applies.
    const findings = validate(text, true);
    if (findings.length > 0) {
        throw new Error(`context-io.emitVerdict: refusing to write an invalid verdict note:\n${findings.join("\n")}`);
    }
    const notesDir = join(contextRoot, task, "notes");
    mkdirSync(notesDir, { recursive: true });
    atomicWrite(join(notesDir, `${noteIdStr}.md`), text);
    return noteIdStr;
}
// ── admit: the context-aware admission cross-check (D-01/D-10 — the ONLY context-reading path). ──
// Given a candidate note text for a task, run the structural validate() first; then, only when the
// note is a `finding` carrying a §14-gate#<id> stamp, cross-check that <id> against a LIVE GREEN
// verdict record under the task (Posture B — format-trust alone is refused). Returns a findings
// array (empty = admitted). A `human:<name>` stamp passes structurally and is NOT gate-cross-checked
// (its un-forgeability is Phase 25). Keeping this a DISTINCT function preserves the D-10 separation:
// validate() stays pure; only admit() reads context.
export function admit(task, text, contextRoot = DEFAULT_CONTEXT_ROOT) {
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
    return [];
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
function toJsonl(n) {
    return JSON.stringify({
        id: n.id,
        kind: n.kind,
        by: n.by,
        at: n.at,
        verified_by: n.verified_by,
        confidence: n.confidence,
        refs: n.refs,
        supersedes: n.supersedes,
    });
}
// ── render: read notes/ → emit byte-reproducible index.md + index.jsonl (SCTX-03/04). ──────────
// Sorted by at (ISO lexicographic) with note-id tiebreak; no wall-clock timestamps of its own;
// single trailing newline. Superseded notes are folded out of the live state and listed in a
// history section so the audit trail stays visible. Conforms to task-notes.template.md.
export function render(task, contextRoot = DEFAULT_CONTEXT_ROOT) {
    assertSafeTask(task);
    const taskDir = join(contextRoot, task);
    const all = readContext(task, contextRoot);
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
    md.push(""); // trailing element → exactly one final "\n"
    atomicWrite(join(taskDir, "index.md"), md.join("\n"));
}
// ── CLI entrypoint (only when run directly, never on import) ────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node context-io.js ...`.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
        if (cmd === "validate") {
            const noteFile = rest[0];
            if (!noteFile) {
                console.error("usage: context-io.js validate <noteFile>");
                process.exit(1);
            }
            const findings = validate(readFileSync(noteFile, "utf8"));
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
            const task = rest[0];
            const noteFile = rest[1];
            const contextRoot = rest[2]; // optional explicit root (tests pass a temp dir)
            if (!task || !noteFile) {
                console.error("usage: context-io.js admit <task> <noteFile> [contextRoot]");
                process.exit(1);
            }
            const findings = admit(task, readFileSync(noteFile, "utf8"), contextRoot ?? DEFAULT_CONTEXT_ROOT);
            if (findings.length > 0) {
                for (const f of findings)
                    console.error(f);
                process.exit(1);
            }
            console.log(`note admitted: structurally valid and the §14-gate stamp matches a live green verdict.`);
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
            console.error("usage: context-io.js <validate <noteFile> | admit <task> <noteFile> [contextRoot] | render <task> [contextRoot]>");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`context-io: ${e.message}`);
        process.exit(1);
    }
}
