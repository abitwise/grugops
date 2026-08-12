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
import {
  writeFileSync,
  appendFileSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// ── The six note kinds (SCTX-01) ──────────────────────────────────────────────────────────────
export const NOTE_KINDS = [
  "claim",
  "finding",
  "decision",
  "failed-attempt",
  "observation",
  "artifact-ref",
] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

// ── A note's provenance fence + body (the input to appendNote) ──────────────────────────────────
export interface NoteInput {
  kind: NoteKind;
  by: string;
  at: string; // ISO-8601 — the authoritative replay sort key
  verified_by: string; // may be empty in Phase 20 (Phase 21 admits on it)
  confidence: string; // e.g. high | medium | low | UNKNOWN - verify
  refs: string[]; // YAML list — req ids, file paths, ticket refs
  supersedes: string | null; // note-id this note overrides, or null
}

// ── A parsed note (frontmatter projected to a record; id from the filename) ─────────────────────
export interface NoteRecord {
  id: string; // <at-compact>-<by>-<kind>-<nonce> (storage/convenience; NOT replay order)
  kind: string;
  by: string;
  at: string;
  verified_by: string;
  confidence: string;
  refs: string[];
  supersedes: string | null;
  body: string; // markdown body (NOT emitted in the JSONL event line)
}

// ── Fixed context root (production). Tests pass an explicit root. ───────────────────────────────
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");

// ── Task-name allowlist (path-traversal mitigation, T-20-01) ────────────────────────────────────
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task: string): void {
  // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
  if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
    throw new Error(
      `context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
        "(no path separators, no .., no absolute paths)",
    );
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
] as const;

// Literal self-attestation tokens an agent must never use as its own verification (D-09).
const REFUSE_SELF_LITERALS = ["self", "me", "agent"] as const;

// Return true when `value` IS a DeLM invalid-evidence phrase, or STARTS with one followed by a
// non-alphanumeric boundary (so `pending review` matches but `§14-gate#R-ftbdui-001` does not).
// This is the deliberate non-substring matcher D-09 requires.
function isInvalidEvidencePhrase(value: string): boolean {
  const v = value.trim().toLowerCase();
  for (const phrase of DELM_INVALID_EVIDENCE) {
    if (v === phrase) return true;
    if (v.startsWith(phrase)) {
      const next = v.charAt(phrase.length);
      // A non-alpha boundary (space, punctuation, end-of-string) means the phrase stands alone as a
      // token; an alphanumeric next char means it is part of a larger token and is NOT a match.
      if (!/[A-Za-z0-9]/.test(next)) return true;
    }
  }
  return false;
}

// ── Single-line field guard (provenance-forgery mitigation, CR-01) ──────────────────────────────
// Every NoteInput field is interpolated RAW into the YAML provenance fence by composeNote. An
// embedded newline would inject additional `key: value` lines; because parseNote lets a later key
// overwrite an earlier one, an injected `kind:`/`verified_by:` could flip a soft `claim` into a
// forged verified `finding`. Reject any field carrying a CR or LF BEFORE composing.
function assertSingleLine(name: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(
      `context-io: field "${name}" must be single-line (no embedded newline): ${JSON.stringify(value)}`,
    );
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

// ── Frontmatter parse (stdlib slice+regex — NO js-yaml/gray-matter, per the zero-dep constraint).
// Extends the flat key:value idiom from generate-catalog.ts with one addition: a `refs:` YAML list
// block (`refs:\n  - x\n  - y`). A single-line `refs: a, b` comma form is also accepted. The choice
// (extend the parser minimally rather than add a dependency) resolves RESEARCH Open Question 1.
export interface ParsedFrontmatter {
  scalars: Record<string, string>;
  refs: string[];
  body: string;
  // Frontmatter keys that appeared on more than one `key: value` line. parseNote keeps the LAST
  // value (later overwrites earlier) for backward-compatible reads; validate() treats any entry
  // here as a structural FAIL (CR-01 defense-in-depth) — a duplicate provenance key is the on-disk
  // signature of a field-injection forgery.
  duplicateKeys: string[];
  // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02 completion). parseNote records the
  // exact offending line text for any fence line that is NOT one of: a blank line, the `refs:` block
  // header, a `refs:` list item (`  - x`), or a column-0 `key: value` scalar. This catches a
  // leading-space/tab indented key, a `key : value` (space before the colon) line, and any junk line —
  // each of which the anchored kv regex (/^([A-Za-z_]+):\s*(.*)$/) silently projects to "" with no
  // parse error and no duplicate-key signal. This signal describes LINE SHAPE ONLY; it is orthogonal
  // to the lenient pre-id / last-value-wins projection contract. validate() pushes a structural FAIL
  // per entry, and the compaction carve-out oracle fails closed on any entry — so the read path
  // (the oracle) refuses EXACTLY what the write path (appendNote/validate) refuses.
  malformedLines: string[];
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
export function isRecognizedFrontmatterLine(line: string): boolean {
  if (line.trim() === "") return true; // blank
  if (/^refs:\s*$/.test(line)) return true; // refs: block header
  if (/^\s*-\s+/.test(line)) return true; // refs: list item shape
  if (/^([A-Za-z_]+):\s*(.*)$/.test(line)) return true; // column-0 key: value scalar
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
export function parseNote(text: string): ParsedFrontmatter | null {
  // Normalize CRLF/CR to LF before matching the fence so a git-autocrlf (Windows) note parses
  // identically to its LF form. Without this, the fence regex (anchored on \n) misses a CRLF note,
  // parseNote returns null, readContext silently drops it, and admit() wrongly refuses a real
  // §14-gate verdict (CR-01). parseNote is the single choke point feeding both validate() and
  // readContext, so normalizing here aligns the text and admission paths in one place.
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null; // no frontmatter fence → caller treats as a structural fail
  const fmLines = m[1].split("\n");
  const body = m[2] ?? "";
  const scalars: Record<string, string> = {};
  const seen = new Set<string>();
  const dupes = new Set<string>();
  // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02). Records the exact offending line
  // text so validate() and the carve-out oracle can name each one. The recognized set is exactly:
  // a blank line, the `refs:` block header, a `refs:` list item consumed under a header, and a
  // column-0 `key: value` scalar. Everything else inside the fence is malformed.
  const malformed: string[] = [];
  let refs: string[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    // A blank (empty-after-trim) line is a recognized, legal shape — skip it.
    if (line.trim() === "") continue;
    // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
    // The `- item` lines are consumed HERE and never reach the kv branch, so the legitimate refs:
    // list block can never register as a duplicate provenance key.
    const refsBlock = line.match(/^refs:\s*$/);
    if (refsBlock) {
      if (seen.has("refs")) dupes.add("refs");
      seen.add("refs");
      const collected: string[] = [];
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
      if (seen.has(key)) dupes.add(key);
      seen.add(key);
      if (key === "refs") {
        // Single-line comma form: `refs: a, b, c` (empty → []).
        refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
      } else {
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
      throw new Error(
        `context-io.parseNote: internal invariant violated — line "${line}" reached the malformed ` +
          "branch yet is a recognized frontmatter line (splitNotes/parseNote grammar drift, IN-02).",
      );
    }
    malformed.push(line);
  }
  // Route the parsed `kind` THROUGH the single-source authority (round-8 GAP-R7-1 Lever-1). This is
  // behavior-identical to the kv loop's existing `.trim()` (the value is already trimmed) — its sole
  // purpose is to make parseNote consult the SAME helper the gate (isGatedNote / the hook / the server)
  // consults, so the store's kind view and the gate's kind view cannot drift. The existing parseNote
  // tests stay green (this is a proven no-op on the persisted value).
  if (scalars.kind !== undefined) scalars.kind = normalizeKind(scalars.kind);
  return { scalars, refs, body, duplicateKeys: [...dupes], malformedLines: malformed };
}

// ── isBoundaryShapedLine: a `---`-boundary-shaped fence line, trailing-whitespace tolerant. ────────
// A note fence opens with a `---` line. The round-6 splitter used an EXACT `lines[i] === "---"`
// compare, so a trailing-whitespace variant (`--- ` / `---\t`) — writer-reachable via the free-scratch
// path — was NOT seen as a boundary line and the note that followed was silently absorbed (part of the
// 6th-bypass class). We trim trailing whitespace before the `=== "---"` compare so `---`, `--- `, and
// `---\t` all count as a boundary-shaped line. Leading content is NOT trimmed — an indented `  ---`
// is a body/markdown construct, not a column-0 fence open.
function isBoundaryShapedLine(line: string): boolean {
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
export function splitNotes(text: string): { notes: string[]; trailingMalformed: string | null } {
  // Normalize CRLF/CR to LF FIRST (mirror parseNote) so a CRLF multi-note file splits identically to
  // its LF form — the carve-out must not see a different per-note set on Windows line endings.
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized === "") return { notes: [], trailingMalformed: null };
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
  const sliceBytes = (from: number, to: number): string => {
    if (from >= to) return "";
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
  const idBearing = (region: string): boolean => {
    const parsed = parseNote(region);
    return parsed !== null && typeof parsed.scalars.id === "string" && parsed.scalars.id !== "";
  };
  // The candidate region opening at line `i` runs from this `---` open up to (and including) its FIRST
  // subsequent `---`-shaped close — the same first `\n---` parseNote's non-greedy regex picks. If there
  // is no later `---`-shaped line, the region runs to EOF (parseNote then rejects it for want of a
  // closing fence → a note-open attempt that fails closed). Returns the region's bytes for parseNote.
  const candidateRegionFrom = (i: number): string => {
    for (let j = i + 1; j < lines.length; j++) {
      if (isBoundaryShapedLine(lines[j])) return sliceBytes(i, j + 1);
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
  const opensNoteAttempt = (i: number): boolean => {
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (isBoundaryShapedLine(l)) return false; // reached the closing fence with no id seen
      if (ID_LOOKING.test(l)) return true; // an id-looking line — a note-open attempt
    }
    return false; // ran off the end with no id (and no close) — not a note-open attempt
  };
  // A NOTE BOUNDARY is a column-0 `---`-shaped line that opens a note-open attempt: parseNote accepts the
  // candidate region as an id-bearing note (clean → recovered) OR the region carries an id-looking line
  // but does not cleanly parse (→ refused). parseNote is the RECOVER authority; opensNoteAttempt is only
  // the fail-closure trigger that keeps an un-parseable note-open attempt from being silently swallowed.
  const isBoundaryAt = (i: number): boolean =>
    isBoundaryShapedLine(lines[i]) &&
    (idBearing(candidateRegionFrom(i)) || opensNoteAttempt(i));

  // Find every note-boundary index in document order. A `---` close consumed as the END of one note's
  // candidate region can also OPEN the next note's region; the boundary walk below re-slices each note
  // from its boundary to the NEXT boundary, so adjacent notes (no blank line between a close and the
  // next open) still tile exactly.
  const boundaries: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isBoundaryAt(i)) boundaries.push(i);
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
  const notes: string[] = [];
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
    } else {
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
// `trustedGateEmission` is the D-04 carve-out flag the gate's own emitVerdict() path sets so its
// reserved `by: §14-gate` verdict note is not rejected as an impersonation. The plain CLI
// `validate <file>` verb NEVER sets it, so an agent impersonating the gate always FAILs.
export function validate(text: string, trustedGateEmission = false): string[] {
  const findings: string[] = [];
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
    findings.push(
      `structural FAIL: malformed frontmatter line "${line}" — a provenance line must be a column-0 ` +
        `"key: value", the "refs:" block header, or a "  - item" refs entry (an indented or ` +
        `"key : value" line silently projects to empty and cannot enter the verified context).`,
    );
  }
  // Required provenance fields: a missing one is a structural FAIL naming the field.
  for (const field of ["kind", "by", "at", "confidence"] as const) {
    if (scalars[field] === undefined || scalars[field] === "") {
      findings.push(`structural FAIL: missing required provenance field "${field}"`);
    }
  }
  // kind, when present, must be one of the six values; a bad kind names the offending value.
  if (scalars.kind !== undefined && scalars.kind !== "") {
    if (!(NOTE_KINDS as readonly string[]).includes(scalars.kind)) {
      findings.push(
        `structural FAIL: kind "${scalars.kind}" is not one of the six values ` +
          `(${NOTE_KINDS.join(", ")})`,
      );
    }
  }

  // ── R6-1 CO-PRIMARY path-metacharacter reject for `by`/`at` (load-bearing, Plan 25-12) ─────────
  // `by` and `at` flow into noteId → the on-disk <id>.md filename. A value carrying a path separator,
  // a NUL / C0 control char, or the `..` parent-dir sequence is a traversal attempt — a structural
  // FAIL naming the field. This is the structural guard for emitVerdict's `at` parameter and the CLI /
  // compaction-carve-out oracle validate callers; it pairs with (does not replace) the writeNoteFile
  // containment chokepoint. The reserved `by: §14-gate` (U+00A7) and a legitimate ISO-8601 `at`
  // (single dots, `:`/`-`/`T`/`Z`) are NOT metacharacters and pass this check.
  for (const field of ["by", "at"] as const) {
    const v = scalars[field];
    if (v !== undefined && v !== "" && PATH_METACHAR_RE.test(v)) {
      findings.push(
        `structural FAIL: provenance field "${field}" ("${v}") contains a path separator, a control ` +
          `character, or a ".." sequence — these flow into the on-disk note filename and a ` +
          `metacharacter there is a path-traversal attempt.`,
      );
    }
  }

  // ── D-02 reserved-identity rule (applies to ANY note, not only findings) ──────────────────────
  // A note authored `by: §14-gate` is an impersonation flag, EXCEPT the gate's own verdict
  // emission (D-04), which routes through emitVerdict() and sets trustedGateEmission.
  if (scalars.by === GATE_IDENTITY && !trustedGateEmission) {
    findings.push(
      `structural FAIL: "${GATE_IDENTITY}" is a reserved author identity (the §14 quality gate). ` +
        `A note may not be authored by it — this is an impersonation flag. Only the gate's own ` +
        `verdict emission may use this identity.`,
    );
  }

  // ── D-09 refuse-self FAIL set, GATED on kind === "finding" (D-08 — only a finding needs a stamp).
  // Still text-only: inspects scalars.verified_by / scalars.by only. The gate's own verdict is a
  // `finding` authored by the trusted root (D-04): it carries no verified_by of its own (nothing
  // verifies the root), so the refuse-self set is suppressed for the trusted-gate-emission path.
  if (scalars.kind === "finding" && !trustedGateEmission) {
    const vb = (scalars.verified_by ?? "").trim();
    if (vb === "") {
      findings.push(
        `structural FAIL: a finding requires a verified_by stamp — it must not be empty ` +
          `(refuse-self: an unverified finding cannot enter the verified context).`,
      );
    } else if ((REFUSE_SELF_LITERALS as readonly string[]).includes(vb.toLowerCase())) {
      findings.push(
        `structural FAIL: verified_by "${vb}" is a self-attestation literal — a finding may not ` +
          `verify itself (refuse-self).`,
      );
    } else if (vb === scalars.by) {
      findings.push(
        `structural FAIL: verified_by "${vb}" equals the author (by) — an author may not ` +
          `self-stamp its own finding (refuse-self).`,
      );
    } else if (isInvalidEvidencePhrase(vb)) {
      findings.push(
        `structural FAIL: verified_by "${vb}" is hollow evidence (a DeLM invalid-evidence ` +
          `phrase) — it does not name a real verification.`,
      );
    } else if (!GATE_STAMP_RE.test(vb) && !HUMAN_STAMP_RE.test(vb)) {
      findings.push(
        `structural FAIL: verified_by "${vb}" matches no accepted grammar. A finding's stamp ` +
          `must be "§14-gate#<id>" (gate-verified) or "human:<name>" (escalation).`,
      );
    }
  }

  return findings;
}

// ── atomicWrite: write a unique temp sibling, then rename onto the final path. ──────────────────
// POSIX: rename atomically replaces. Windows (MoveFileEx): not atomic and fails with
// EPERM/EEXIST/EACCES when the destination already exists — the unlink-then-rename branch handles
// that. For note publication the final path is ALWAYS fresh/unique so the Windows branch never
// fires; it exists for the single-writer derived-artifact (index.*) regen, which is freshness-gated.
export function atomicWrite(finalPath: string, data: string): void {
  const tmp = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  writeFileSync(tmp, data, "utf8");
  try {
    renameSync(tmp, finalPath);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
      // Windows branch: remove the destination, then retry the rename.
      try {
        unlinkSync(finalPath);
      } catch {
        /* not-present is fine */
      }
      renameSync(tmp, finalPath);
    } else {
      // Any other error: best-effort temp cleanup, then rethrow.
      try {
        unlinkSync(tmp);
      } catch {
        /* best-effort */
      }
      throw e;
    }
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
function writeNoteFile(notesDir: string, id: string, text: string): void {
  const finalPath = join(notesDir, `${id}.md`);
  const resolvedDir = resolve(notesDir);
  const resolvedFinal = resolve(finalPath);
  // Strict containment: the resolved final path must begin with the resolved notes dir + separator.
  // (Equality is NOT allowed — the final path is always a file strictly inside the dir.)
  if (!resolvedFinal.startsWith(resolvedDir + sep)) {
    throw new Error(
      `context-io.writeNoteFile: refusing to write — note id "${id}" resolves OUTSIDE the task ` +
        `notes directory (path containment violated: "${resolvedFinal}" is not strictly inside ` +
        `"${resolvedDir}"). No file was written. This is a path-traversal attempt (GAP-R6-1).`,
    );
  }
  mkdirSync(notesDir, { recursive: true });
  atomicWrite(finalPath, text);
}

// ── Compose a note's frontmatter + body from a validated NoteInput. ─────────────────────────────
// The frozen `id:` line is emitted FIRST inside the fence (a deterministic slot, before `kind:`) so
// the on-disk frontmatter carries the same stable creation-time identity as the <id>.md filename.
// The id is a load-bearing provenance field the compaction carve-out matches raw→promoted on and
// byte-equal-checks — it is single-line-guarded exactly as the other provenance fields are.
function composeNote(note: NoteInput, body: string, id: string): string {
  const refsBlock =
    note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
  return (
    "---\n" +
    `id: ${id}\n` +
    `kind: ${note.kind}\n` +
    `by: ${note.by}\n` +
    `at: ${note.at}\n` +
    `verified_by: ${note.verified_by}\n` +
    `confidence: ${note.confidence}\n` +
    refsBlock +
    `supersedes: ${note.supersedes ?? ""}\n` +
    "---\n\n" +
    (body.endsWith("\n") ? body : body + "\n")
  );
}

// ── Note id: <at-compact>-<by>-<kind>-<nonce>. The nonce is a collision nonce, NOT a security token.
// EXPORTED (IN-01): this is the SINGLE source of note identity raw→promoted, reused by both
// appendNote/emitVerdict (the shared-context write path) AND the compactor's composeThreadNote (the
// raw-thread write path). Single-sourcing the formula is the same single-source principle as IN-02's
// shared parser: a thread note's frozen id CANNOT drift from the promoted-counterpart id format the
// id-keyed carve-out match depends on, because both sides compute it here.
export function noteId(note: NoteInput): string {
  const atCompact = note.at.replace(/[-:]/g, "").replace(/\.\d+/, ""); // 2026-06-17T14:23:05Z → 20260617T142305Z
  const nonce = randomUUID().slice(0, 8); // node:crypto — lock-free same-millisecond uniqueness
  return `${atCompact}-${note.by}-${note.kind}-${nonce}`;
}

// ── appendNote: validate → compose → atomicWrite to a FRESH unique notes/<id>.md (append-only). ──
// Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication.
export function appendNote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  precomputedId?: string,
): string {
  assertSafeTask(task);
  // Field-injection guard (CR-01): no interpolated provenance field may carry a newline, which
  // would smuggle additional frontmatter lines into the fence and forge a verified note.
  assertSingleLine("kind", note.kind);
  assertSingleLine("by", note.by);
  assertSingleLine("at", note.at);
  assertSingleLine("verified_by", note.verified_by);
  assertSingleLine("confidence", note.confidence);
  if (note.supersedes !== null) assertSingleLine("supersedes", note.supersedes);
  for (const r of note.refs) assertSingleLine("refs[]", r);
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
  // Route through the SINGLE write chokepoint (R6-1): containment is a property of the write, so a
  // traversal-bearing id can never escape the task's notes dir.
  const notesDir = join(contextRoot, task, "notes");
  writeNoteFile(notesDir, id, text);
  return id;
}

// ── readContext: parse every notes/<id>.md into a NoteRecord[] (id from the filename). ──────────
export function readContext(task: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): NoteRecord[] {
  assertSafeTask(task);
  const notesDir = join(contextRoot, task, "notes");
  if (!existsSync(notesDir)) return [];
  const records: NoteRecord[] = [];
  for (const file of readdirSync(notesDir)) {
    if (!file.endsWith(".md")) continue;
    const text = readFileSync(join(notesDir, file), "utf8");
    const parsed = parseNote(text);
    if (!parsed) continue; // skip an unparseable file rather than crash the read
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
export function currentState(notes: NoteRecord[]): NoteRecord[] {
  const ordered = [...notes].sort((a, b) =>
    a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
  );
  const superseded = new Set(
    ordered.map((n) => n.supersedes).filter((x): x is string => x !== null && x !== ""),
  );
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

function verdictStampFor(id: string): string {
  return `${GATE_IDENTITY}#${id}`;
}

function isLiveGreenVerdict(n: NoteRecord, id: string): boolean {
  return (
    n.kind === "finding" &&
    n.by === GATE_IDENTITY &&
    n.refs.includes(verdictStampFor(id)) &&
    n.body.includes(VERDICT_GREEN_MARKER)
  );
}

// ── emitVerdict: the §14 gate's verdict emission carve-out (D-03/D-04). ──────────────────────────
// The ONE path allowed to author a `by: §14-gate` note. Called by the §14 quality gate step
// (05-pr-quality-gate.md, Plan 02) on a GREEN terminal result, carrying the unique per-run <id>
// that downstream findings reference in `verified_by: §14-gate#<id>`. Composes a verdict note,
// validates it with the trusted-gate-emission carve-out (so the reserved-identity rule does not
// reject the gate's own note), and atomically appends it under the task. Returns the verdict
// note's id. The per-run <id> is the caller's (the gate generates it via node:crypto, D-03).
export function emitVerdict(
  task: string,
  id: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
): string {
  assertSafeTask(task);
  // The per-run id is interpolated into a ref; it must be single-line and grammar-clean so the
  // emitted stamp `§14-gate#<id>` is a valid GATE_STAMP_RE stamp downstream findings can match.
  assertSingleLine("verdict id", id);
  if (!GATE_STAMP_RE.test(verdictStampFor(id))) {
    throw new Error(
      `context-io.emitVerdict: invalid per-run id "${id}" — the emitted stamp ` +
        `"${verdictStampFor(id)}" must match ${GATE_STAMP_RE}.`,
    );
  }
  const note: NoteInput = {
    kind: "finding",
    by: GATE_IDENTITY,
    at,
    verified_by: "", // the gate is the root of trust (D-04) — its verdict stamps nothing above it
    confidence: "high",
    refs: [verdictStampFor(id)],
    supersedes: null,
  };
  const body = `${VERDICT_GREEN_MARKER}: the §14 quality gate run ${id} passed (all checks green).`;
  for (const r of note.refs) assertSingleLine("refs[]", r);
  // The verdict note carries its own frozen id (the same one in its <id>.md filename) — a single
  // source of identity, single-line-guarded like every other provenance field.
  const noteIdStr = noteId(note);
  assertSingleLine("id", noteIdStr);
  const text = composeNote(note, body, noteIdStr);
  // Validate WITH the trusted-gate-emission carve-out: the reserved-identity rule is suppressed for
  // this one path (D-04); every other structural rule still applies.
  const findings = validate(text, true);
  if (findings.length > 0) {
    throw new Error(
      `context-io.emitVerdict: refusing to write an invalid verdict note:\n${findings.join("\n")}`,
    );
  }
  // Route through the SAME single write chokepoint as appendNote (R6-1): emitVerdict is a SECOND
  // direct note-file writer, so containment must live in the shared helper, not only in appendNote.
  const notesDir = join(contextRoot, task, "notes");
  writeNoteFile(notesDir, noteIdStr, text);
  return noteIdStr;
}

// ── Governance high-severity roles (D-06) ───────────────────────────────────────────────────────
// Severity is the AUTHORING ROLE, read from the note's `by` scalar via the canonical parseNote —
// there is NO self-declared `severity:` note field (it would be gameable downward, D-06). A finding
// authored by one of these three roles is a high-severity governance entry: a security/NFR finding,
// an architecture decision, or a release verdict. The admission-guard hook (Plan 25-02) classifies
// from this SAME set, so the in-script tier and the hook tier cannot diverge.
const HIGH_SEVERITY_ROLES = ["security-nfr", "architect-design", "release-manager"] as const;

// ── The single global governance audit-ledger path (GOV-02, D-08) ───────────────────────────────
// Under audit_retention: retained, admit() appends one admission-record event here. One durable
// end-to-end auditor trail (OQ-2). This is the governance RECORD ledger — NOT a note-body store and
// NOT a compaction artifact (D-09): it never touches the compaction code path.
const AUDIT_LEDGER_RELPATH = [".grugops", "audit", "admissions.jsonl"] as const;

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
//     readGovernanceConfig — the SAME read path the hook uses — so the two tiers cannot diverge (OQ-3).
//   - GOV-02 audit ledger: under audit_retention: retained, a successful admission appends one
//     fixed-key JSONL event to the single global .grugops/audit/admissions.jsonl. Under git (the lean
//     default) nothing new is written (the audit stays implicit in git history).
//
// repoRoot resolves BOTH the governance config (readGovernanceConfig) AND the audit-ledger location;
// it defaults to the script's own repo root (ROOT). Tests pass an explicit temp root.
export function admit(
  task: string,
  text: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  repoRoot: string = ROOT,
): string[] {
  assertSafeTask(task);
  // Structural gate first: a structurally invalid note is never admitted (D-11 strict-reject).
  const findings = validate(text);
  if (findings.length > 0) return findings;

  const parsed = parseNote(text);
  if (!parsed) return ["admission FAIL: no YAML frontmatter fence (--- ... ---) found"];
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

  // ── D-04 governance defense-in-depth refusal (the weaker, self-settable tier, D-05) ────────────
  // Read the human_admission dial via the ONE shared path (OQ-3). When the dial is on (≠ off) and
  // this is a high-severity governance finding (by ∈ HIGH_SEVERITY_ROLES) that carries NO human:<name>
  // disposition, REFUSE and name the fault — mirroring the validate() refuse-self set exactly. We push
  // a finding; we NEVER silently rewrite the note (the no-fabrication floor). The dials only ADD this
  // refusal; there is no value that removes a floor refusal (SC3).
  const gov = readGovernanceConfig(repoRoot);
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
  const isHighSeverity =
    scalars.kind === "finding" && isHighSeverityRole(scalars.by ?? "");
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
  if (gov.audit_retention === "retained") {
    appendAuditLedger(repoRoot, scalars, isHighSeverity, vb);
  }
  return [];
}

// ── appendAuditLedger: append one fixed-key admission-record event (GOV-02, D-08/D-09/D-10). ─────
// The sole sanctioned writer of the governance audit ledger. It records the admission RECORD only —
// id / kind / by / severity / verified_by / disposed_by / at — NOT the note body and with NO overlap
// with the compaction (note-body verbosity) code path. The fixed key order mirrors the toJsonl()
// discipline so each line is byte-reproducible. The .grugops/audit/ directory is created on demand.
function appendAuditLedger(
  repoRoot: string,
  scalars: Record<string, string>,
  isHighSeverity: boolean,
  verifiedBy: string,
): void {
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
  appendFileSync(ledgerPath, JSON.stringify(event) + "\n", "utf8");
}

// ── cell(): escape free-text before it enters a pipe-delimited markdown table cell (T-20-02). ───
// Cloned from generate-catalog.ts: backslash first, then pipe, then flatten newlines to a space.
function cell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

// ── First line of a body, for a compact excerpt in the index.md table. ──────────────────────────
function bodyExcerpt(body: string): string {
  return body.trim().split("\n")[0]?.trim() ?? "";
}

// ── Deterministic JSONL event line: FIXED key order, body excluded (event index only). ──────────
function toJsonl(n: NoteRecord): string {
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
export function render(task: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): void {
  assertSafeTask(task);
  const taskDir = join(contextRoot, task);
  const all = readContext(task, contextRoot);

  // Deterministic order for ALL notes (drives both the JSONL emit and the supersede fold).
  const ordered = [...all].sort((a, b) =>
    a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
  );
  const supersededIds = new Set(
    ordered.map((n) => n.supersedes).filter((x): x is string => x !== null && x !== ""),
  );
  const live = ordered.filter((n) => !supersededIds.has(n.id));
  const history = ordered.filter((n) => supersededIds.has(n.id));

  // ── index.jsonl: one event line per note, in the deterministic order, body excluded. ──
  const jsonlLines = ordered.map(toJsonl);
  jsonlLines.push(""); // trailing element → exactly one final "\n"
  atomicWrite(join(taskDir, "index.jsonl"), jsonlLines.join("\n"));

  // ── index.md: generated header + title + current-state table + history table. ──
  const md: string[] = [];
  md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/context-io.js render <task> -->");
  md.push(`# Context: ${cell(task)}`);
  md.push("");
  md.push("## Current state");
  md.push("");
  md.push("| at | kind | by | confidence | verified_by | note |");
  md.push("| --- | --- | --- | --- | --- | --- |");
  for (const n of live) {
    md.push(
      `| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(n.confidence)} | ` +
        `${cell(n.verified_by)} | ${cell(bodyExcerpt(n.body))} |`,
    );
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
      md.push(
        `| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(supersededBy)} | ` +
          `${cell(bodyExcerpt(n.body))} |`,
      );
    }
  }
  md.push(""); // trailing element → exactly one final "\n"
  atomicWrite(join(taskDir, "index.md"), md.join("\n"));
}

// ── readGovernanceConfig — the SINGLE shared governance config-read path (GOV-01/GOV-02) ─────────
//
// This is the ONE config-read both the admission-guard hook (Plan 25-02) and the in-script admit()
// refusal (Plan 25-03) consume, so the two governance read paths cannot diverge (OQ-3).
//
// Semantics (D-11, read-at-use / default-on-absent — see agent-factory/config/factory.config.md):
//   - A missing config file, an unreadable file, a non-JSON file, an absent `context` object, or an
//     absent key all degrade to the LEAN DEFAULT for that key (human_admission→"off",
//     audit_retention→"git"). This function NEVER throws — zero-config grugops always runs lean.
//   - A value that IS present is returned VERBATIM. The reader does NOT validate it against the
//     allowed set; the consumer (hook / admit / floor-sweep) decides. Returning a garbage value
//     verbatim is required so the Plan-25-03 floor-sweep can prove a bogus value still REFUSES.
//   - This helper fails OPEN to lean because it is the READER. Failing CLOSED on a matched
//     high-severity admit is the HOOK's job (Plan 25-02), NOT this read helper's.
//
// Config-location resolution: given a directory to look in (`repoRoot`), try the standard config
// locations in order — first the installed/repo-dropped `.grugops/factory.config.json` (what the
// installer drops at a consumer repo root and what the hook points `${CLAUDE_PROJECT_DIR}` at), then
// the in-kit `agent-factory/config/factory.config.json`. When `repoRoot` is omitted, default to the
// script's own repo root (join(import.meta.dirname, "..")) exactly as freshness.ts resolves ROOT.
export interface GovernanceConfig {
  human_admission: string;
  audit_retention: string;
}

const GOVERNANCE_DEFAULTS: GovernanceConfig = { human_admission: "off", audit_retention: "git" };

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
function canonicalizeHumanAdmission(raw: unknown): string {
  return typeof raw === "string" ? raw : GATE_OR_STRICTER_HUMAN_ADMISSION;
}

export function readGovernanceConfig(repoRoot?: string): GovernanceConfig {
  const base = repoRoot ?? ROOT;
  // Standard config locations, most-specific (repo-dropped) first.
  const candidates = [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];

  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      // A whole-file config that parsed but is NOT a JSON object (an array / string / number / null)
      // is a present-but-degenerate shape — gate-or-stricter, never lean (round-2 GAP-C). A genuinely
      // absent file is handled after the loop and stays lean.
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention };
      }
      const context = (parsed as { context?: unknown }).context;
      // A `context` key that is PRESENT but not a JSON object (null / array / string / number) is a
      // degenerate present shape — gate-or-stricter (GAP-C). A genuinely ABSENT `context` key (a valid
      // config with governance simply unconfigured) stays lean — zero-config preserved (SC2).
      if (context === undefined) {
        return { ...GOVERNANCE_DEFAULTS };
      }
      if (context === null || typeof context !== "object" || Array.isArray(context)) {
        return { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention };
      }
      const ctx = context as Record<string, unknown>;
      const human = ctx.human_admission;
      const audit = ctx.audit_retention;
      // A PRESENT human_admission key that is non-string → gate-or-stricter; an ABSENT key → lean `off`.
      return {
        human_admission:
          human === undefined ? GOVERNANCE_DEFAULTS.human_admission : canonicalizeHumanAdmission(human),
        audit_retention: typeof audit === "string" ? audit : GOVERNANCE_DEFAULTS.audit_retention,
      };
    } catch {
      // Unreadable / non-JSON / any failure → fall through to the lean default. Never throw.
      return { ...GOVERNANCE_DEFAULTS };
    }
  }

  // No config file at any standard location → lean default. Zero-config runs lean.
  return { ...GOVERNANCE_DEFAULTS };
}

// ── readGovernanceConfigResult — the richer, discriminated read the HOOK consumes (GOV-01, SC3) ──
//
// readGovernanceConfig() above is the value reader: it fails OPEN to the lean default and NEVER
// throws, because that default-on-absent contract is what zero-config grugops and 25-01/02/03/SC2
// depend on — its absent path must NOT change. But the un-forgeable admission-guard hook needs to
// distinguish a genuinely ABSENT config (stay lean → allow routine) from a present-but-UNREADABLE
// one (a corrupt / non-JSON file → fail CLOSED → deny pending a human). Collapsing both into the
// same `off` (as the value reader must) is exactly the SC3 fail-open the verifier found.
//
// This result reports `source`:
//   - "absent"     — no config file at any standard location (zero-config lean).
//   - "ok"         — a config file was read and parsed; `config` carries its (verbatim) values.
//   - "unreadable" — a config file EXISTS at a standard location but could not be read or parsed
//                    (corrupt / non-JSON). The hook treats this as fail-closed.
// The value reader's default-on-absent behavior is unchanged; this is an ADDITIVE read path.
export type GovernanceConfigSource = "absent" | "ok" | "unreadable";
export interface GovernanceConfigResult {
  source: GovernanceConfigSource;
  config: GovernanceConfig;
}

export function readGovernanceConfigResult(repoRoot?: string): GovernanceConfigResult {
  const base = repoRoot ?? ROOT;
  const candidates = [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    // A config file EXISTS here. Any failure to read or parse it is a read FAILURE → unreadable
    // (fail closed), NOT an absence. This is the distinction the hook needs and the value reader
    // (correctly) cannot make.
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      // A present-but-degenerate whole-file shape (array / string / number / null) parses but is not a
      // config object — gate-or-stricter at source="ok" (it WAS read), never the lean default (GAP-C).
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
          source: "ok",
          config: { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention },
        };
      }
      const context = (parsed as { context?: unknown }).context;
      // An ABSENT `context` key (governance unconfigured) stays lean; a PRESENT non-object `context`
      // (null / array / string / number) is a degenerate present shape → gate-or-stricter (GAP-C).
      if (context === undefined) {
        return { source: "ok", config: { ...GOVERNANCE_DEFAULTS } };
      }
      if (context === null || typeof context !== "object" || Array.isArray(context)) {
        return {
          source: "ok",
          config: { human_admission: GATE_OR_STRICTER_HUMAN_ADMISSION, audit_retention: GOVERNANCE_DEFAULTS.audit_retention },
        };
      }
      const ctx = context as Record<string, unknown>;
      const human = ctx.human_admission;
      const audit = ctx.audit_retention;
      return {
        source: "ok",
        config: {
          // A PRESENT non-string human_admission → gate-or-stricter; an ABSENT key → lean `off` (GAP-C).
          human_admission:
            human === undefined ? GOVERNANCE_DEFAULTS.human_admission : canonicalizeHumanAdmission(human),
          audit_retention: typeof audit === "string" ? audit : GOVERNANCE_DEFAULTS.audit_retention,
        },
      };
    } catch {
      return { source: "unreadable", config: { ...GOVERNANCE_DEFAULTS } };
    }
  }

  // No config file at any standard location → genuinely absent. Zero-config runs lean.
  return { source: "absent", config: { ...GOVERNANCE_DEFAULTS } };
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
export function normalizeKind(raw: string | undefined): string {
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
export function isHighSeverityRole(by: string): boolean {
  const canonical = (by ?? "")
    .normalize("NFKC")
    .replace(/[\s\u200B\u200C\u200D\u2060\uFEFF]/gu, "")
    .toLowerCase();
  return (HIGH_SEVERITY_ROLES as readonly string[]).includes(canonical);
}

// ── isGatedNote — the SINGLE-SOURCE FULL gated decision (W-A, round-8 anti-drift). ───────────────
// The COMPLETE gated predicate lives HERE and only here: a note is gated when
//   kind === "finding" AND ((isHighSeverityRole(by) AND the dial is active) OR the dial is "all"),
// with the dial canonicalization folded in. BOTH the combiner (admitAndAppend) and the 25-10 per-call
// hook IMPORT this; NEITHER reconstructs the `((high-sev && active) || all)` composition locally —
// that duplicated composition was the 10-round drift surface (the allow-forge risk: the hook reading
// not-gated/allow-unchecked while the combiner reads gated/trust-the-stamp). configResult is the
// discriminated read (readGovernanceConfigResult): an UNREADABLE config fails CLOSED (gate-or-stricter,
// SC3). The value reader already canonicalizes a present non-string dial to "all" (gate-or-stricter),
// so config.human_admission is always a string here; a present typo/garbage string is also treated as
// gate-or-stricter. Only the exact string "off" (or a genuinely absent config, which reads "off") is
// NOT gated.
export function isGatedNote(
  by: string,
  kind: string,
  configResult: GovernanceConfigResult,
): boolean {
  // Only a finding is ever gated — soft kinds carry no stamp (D-08). Consult the single-source kind
  // authority (round-8 GAP-R7-1 Lever-1): a whitespace-padded `kind:"finding "` normalizes to "finding"
  // here EXACTLY as parseNote persists it, so the gate's finding-view can never be narrower than the
  // store's. This is the SAME normalizeKind the admission-guard hook and the admission-server consult.
  if (normalizeKind(kind) !== "finding") return false;
  // A config file that EXISTS but cannot be read/parsed → fail closed (gate-or-stricter, SC3).
  if (configResult.source === "unreadable") return true;
  const dial = configResult.config.human_admission;
  if (dial === "off") return false; // lean / explicitly off → never gated
  if (dial === "all") return true; // strictest → every finding gated
  if (dial === "high-severity") return isHighSeverityRole(by); // gated iff a high-severity role
  // Any other PRESENT value (a typo, garbage, or a canonicalized non-string) → gate-or-stricter.
  return true;
}

// ── admitAndAppend's result: the new note id on success, or the named faults on refusal. ─────────
// NOT exported (W-A anti-bloat: the ONLY new exports are the three functions admitAndAppend /
// isGatedNote / isHighSeverityRole). Consumers read the inferred structural shape — this is the
// return type of admitAndAppend, erased entirely from the compiled .js.
interface AdmitAndAppendResult {
  id: string | null; // the new note id when persisted; null on refusal (nothing written)
  findings: string[]; // empty on success; the named fault(s) on refusal
}

// ── admitAndAppend — the additive admit-decides-then-persist combiner (D-01 point-of-effect). ────
// Decides admission, then persists ONLY on success through appendNote (the SOLE sanctioned writer),
// returning the new note id; on refusal it returns the named findings and persists NOTHING (the
// no-fabrication floor — it never rewrites a note to make it pass). It reads NO approval env: the
// un-forgeable per-entry gate is the per-call 25-10 hook. repoRoot resolves the governance config AND
// the audit ledger (defaults to the script's own repo root); tests pass an explicit temp root.
export function admitAndAppend(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  repoRoot: string = ROOT,
): AdmitAndAppendResult {
  assertSafeTask(task);

  // Decide GATED via the SINGLE-SOURCE predicate (W-A) — NOT a local reconstruction; the SAME
  // isGatedNote the 25-10 per-call hook imports. The discriminated read fails closed on an unreadable
  // config (gate-or-stricter, SC3).
  const configResult = readGovernanceConfigResult(repoRoot);
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
    // Reuse the IN-MODULE composeNote + validate + appendNote (the sole writer) — the gated branch
    // does NOT call admit() (admit()'s frozen D-04 would refuse a high-severity finding regardless of
    // stamp). Compose with a frozen id so the persisted <id>.md and the GOV-02 ledger record share one
    // identity. On a structurally invalid note, return the findings rather than throwing.
    const id = noteId(note);
    const text = composeNote(note, body, id);
    const findings = validate(text);
    if (findings.length > 0) return { id: null, findings };
    const persistedId = appendNote(task, note, body, contextRoot, id);
    // GOV-02 ledger (retained mode only): reuse the SAME private appendAuditLedger admit() uses —
    // disposed_by derives from the human:NAME stamp; severity is the role classification (D-06).
    if (configResult.config.audit_retention === "retained") {
      const scalars: Record<string, string> = {
        id: persistedId,
        kind: note.kind,
        by: note.by,
        at: note.at,
        verified_by: note.verified_by,
        confidence: note.confidence,
      };
      appendAuditLedger(repoRoot, scalars, isHighSeverityRole(note.by), vb);
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
  const findings = admit(task, text, contextRoot, repoRoot);
  if (findings.length > 0) return { id: null, findings };
  const persistedId = appendNote(task, note, body, contextRoot, id);
  return { id: persistedId, findings: [] };
}

// ── CLI entrypoint (only when run directly, never on import) ────────────────────────────────────
// import.meta.url === the executed file's URL when run via `node context-io.js ...`.
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

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
        for (const f of findings) console.error(f);
        process.exit(1);
      }
      console.log("note valid: all required provenance fields present, kind is one of the six.");
      process.exit(0);
    } else if (cmd === "admit") {
      // Context-aware admission (D-01): structural validate + the §14-gate verdict cross-check.
      const task = rest[0];
      const noteFile = rest[1];
      const contextRoot = rest[2]; // optional explicit root (tests pass a temp dir)
      const repoRoot = rest[3]; // optional governance/audit root (tests pass a temp dir); defaults to ROOT
      if (!task || !noteFile) {
        console.error("usage: context-io.js admit <task> <noteFile> [contextRoot] [repoRoot]");
        process.exit(1);
      }
      const findings = admit(
        task,
        readFileSync(noteFile, "utf8"),
        contextRoot ?? DEFAULT_CONTEXT_ROOT,
        repoRoot ?? ROOT,
      );
      if (findings.length > 0) {
        for (const f of findings) console.error(f);
        process.exit(1);
      }
      console.log(`note admitted: structurally valid and the §14-gate stamp matches a live green verdict.`);
      process.exit(0);
    } else if (cmd === "render") {
      const task = rest[0];
      const contextRoot = rest[1]; // optional explicit root (tests pass a temp dir)
      if (!task) {
        console.error("usage: context-io.js render <task> [contextRoot]");
        process.exit(1);
      }
      render(task, contextRoot ?? DEFAULT_CONTEXT_ROOT);
      console.log(`rendered index.md + index.jsonl for task "${task}".`);
      process.exit(0);
    } else {
      console.error(
        "usage: context-io.js <validate <noteFile> | admit <task> <noteFile> [contextRoot] | render <task> [contextRoot]>",
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(`context-io: ${(e as Error).message}`);
    process.exit(1);
  }
}
