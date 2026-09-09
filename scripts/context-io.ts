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
import {
  writeFileSync,
  appendFileSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  mkdirSync,
  existsSync,
  openSync,
  fstatSync,
  readSync,
  closeSync,
  statSync,
  realpathSync,
  constants as fsConstants,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import {
  CHECKPOINTS,
  CHECKPOINT_DEFAULTS,
  DISPOSITIONS,
  STRICTEST_MATRIX,
  canonicalizeDisposition,
  type Checkpoint,
  type Disposition,
} from "./checkpoints.js";

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
  // ── The evidence-provenance scalars (Phase 31, D-01/D-02/D-03) ───────────────────────────────
  // OPTIONAL on the interface and ADJUDICATED in validate(), exactly how `supersedes` is typed
  // loosely and decided at validation: the interface carries the shape, the validator carries the
  // rule, and there is one place that decides it. Required-and-non-empty on an `artifact-ref`;
  // `sha` is additionally carried by the §14 gate's own verdict (the run's HEAD, D-01/F-02) and
  // forbidden on every other note.
  sha?: string; // the commit the referenced spec was run at / the gate run was performed at
  gate_run?: string; // the per-run id of the §14-gate verdict that certifies that run
  content_hash?: string; // sha256 over the committed *.uat.spec.ts bytes at `sha` (D-02)
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
  // Projected by readContext so admit()'s D-03 branch can read a verdict's recorded SHA. Without
  // this projection the comparison has no left operand however faithfully the composer emits it.
  sha?: string;
  gate_run?: string;
  content_hash?: string;
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
const RESERVED_IDENTITIES = [GATE_IDENTITY, CHECKPOINT_GUARD_IDENTITY] as const;

/** The identity a trusted emission claims. `null` is every ordinary (agent-reachable) call. */
export type ReservedIdentity = (typeof RESERVED_IDENTITIES)[number];

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

// ── Hex-scalar guard for `sha` / `content_hash` (Phase 31, T-31-03) ─────────────────────────────
// The write-path companion to SHA_HEX_RE's validator rule: the composer guards what is about to be
// interpolated into a fence, the validator guards text that arrives from disk. Both ask the ONE
// exported allowlist, so there is no second charset spelled anywhere. Called only AFTER
// assertSingleLine, so a CR/LF is reported as the injection attempt it is rather than as a
// charset miss.
function assertHexScalar(name: string, value: string): void {
  if (!SHA_HEX_RE.test(value)) {
    throw new Error(
      `context-io: field "${name}" must be lowercase hex matching ${SHA_HEX_RE} — an abbreviated ` +
        `or full git object id, or a sha256 digest: ${JSON.stringify(value)}`,
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
// `trustedEmitter` is the D-04 carve-out, generalized by plan 30-08 from a BOOLEAN to the reserved
// identity the emission CLAIMS. A boolean said "somebody trusted is writing"; the identity says WHICH
// one, so the carve-out cannot be borrowed across emitters — emitVerdict() may author `§14-gate` and
// nothing else, emitCheckpointNote() may author `§checkpoint-guard` and nothing else, and each is
// still an impersonation FAIL in the other's name. The plain CLI `validate <file>` verb, the compaction
// carve-out oracle and every appendNote write path pass `null`, so an agent impersonating EITHER
// reserved identity always FAILs.
export function validate(text: string, trustedEmitter: ReservedIdentity | null = null): string[] {
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
  const PROVENANCE_FIELDS = ["sha", "gate_run", "content_hash"] as const;
  if (scalars.kind === "artifact-ref") {
    for (const field of PROVENANCE_FIELDS) {
      if (scalars[field] === undefined || scalars[field] === "") {
        findings.push(
          `structural FAIL: an artifact-ref requires the evidence-provenance field "${field}" — ` +
            `an artifact-ref records the commit its spec was run at (sha), the per-run id of the ` +
            `§14-gate verdict that certifies that run (gate_run), and the sha256 of the committed ` +
            `spec bytes (content_hash). A missing or empty one cannot be bound to a gate run.`,
        );
      }
    }
  } else {
    for (const field of PROVENANCE_FIELDS) {
      if (scalars[field] === undefined || scalars[field] === "") continue;
      if (field === "sha" && scalars.by === GATE_IDENTITY) continue; // the verdict's own carve-out
      findings.push(
        `structural FAIL: the evidence-provenance field "${field}" belongs to an artifact-ref and ` +
          `to no other kind; this note is a "${scalars.kind}". The only other note that may carry ` +
          `one is the §14-gate verdict, which records "sha" — the commit its run was performed at ` +
          `— and nothing else of the triple.`,
      );
    }
  }
  for (const field of ["sha", "content_hash"] as const) {
    const v = scalars[field];
    if (v !== undefined && v !== "" && !SHA_HEX_RE.test(v)) {
      findings.push(
        `structural FAIL: provenance field "${field}" ("${v}") is not lowercase hex matching ` +
          `${SHA_HEX_RE} — an abbreviated or full git object id, or a sha256 digest. The allowlist ` +
          `is anchored: a value that merely contains hex is refused.`,
      );
    }
  }

  // ── D-02 reserved-identity rule (applies to ANY note, not only findings) ──────────────────────
  // A note authored by a RESERVED machine identity is an impersonation flag, EXCEPT that identity's
  // OWN sanctioned emitter — emitVerdict() for `§14-gate` (D-04), emitCheckpointNote() for
  // `§checkpoint-guard` (D-10/D-11) — each of which names itself here. The comparison is against the
  // claimed identity, not against a boolean, so one emitter's carve-out never covers the other's name.
  if (
    (RESERVED_IDENTITIES as readonly string[]).includes(scalars.by ?? "") &&
    scalars.by !== trustedEmitter
  ) {
    findings.push(
      `structural FAIL: "${scalars.by}" is a reserved author identity (a grugops machine writer). ` +
        `A note may not be authored by it — this is an impersonation flag. Only that identity's own ` +
        `sanctioned emitter may use it.`,
    );
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
  if (existsSync(resolvedFinal)) {
    let existing: string | null = null;
    try {
      existing = readFileSync(resolvedFinal, "utf8");
    } catch {
      // A path that exists and cannot be read is not something this write may replace. Falling
      // through to the refusal below is the fail-closed answer; a rename would destroy it.
      existing = null;
    }
    if (existing === text) return; // the decided idempotent case: nothing to write, nothing to lose
    throw new Error(
      `context-io.writeNoteFile: refusing to write — the destination already holds a DIFFERENT ` +
        `note under id "${id}". The shared verified context is APPEND-ONLY (SCTX-04): a ` +
        `supersession is a NEW note carrying a supersedes: field, never a rewrite of an existing ` +
        `one. No file was written, and the note already at "${resolvedFinal}" is untouched (CR-11).`,
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
    provenanceBlock(note) +
    refsBlock +
    `supersedes: ${note.supersedes ?? ""}\n` +
    "---\n\n" +
    (body.endsWith("\n") ? body : body + "\n")
  );
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
function provenanceBlock(note: NoteInput): string {
  const line = (key: string, value: string | undefined): string =>
    value !== undefined && value !== "" ? `${key}: ${value}\n` : "";
  return (
    line("sha", note.sha) + line("gate_run", note.gate_run) + line("content_hash", note.content_hash)
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

// ── composeValidatedNote: the field guards + the frozen id + compose + the structural refusal. ───
//
// NOT EXPORTED. This is the shared BODY of the two write routes below, factored out so the sequence
// "guard every interpolated field → resolve ONE id → compose → validate" exists exactly once. It
// decides nothing about admission; it returns the id and the composed text, or throws on a
// structurally invalid note having written nothing (nothing has been opened at that point).
//
// It is a refactor with no behaviour of its own: every assertion below is the one appendNote already
// performed, in the order it already performed it.
function composeValidatedNote(
  task: string,
  note: NoteInput,
  body: string,
  precomputedId?: string,
): { id: string; text: string } {
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
  // The three evidence-provenance scalars are interpolated into the same fence, so CR-01 applies to
  // them identically: a newline in `sha` would smuggle an extra `key: value` line into the
  // frontmatter. Guarded whenever the field is SET — the same condition the composer emits on, so
  // no value can reach the fence unguarded — and the two hex fields additionally pass the anchored
  // allowlist here on the write path.
  if (note.sha !== undefined) {
    assertSingleLine("sha", note.sha);
    assertHexScalar("sha", note.sha);
  }
  if (note.gate_run !== undefined) assertSingleLine("gate_run", note.gate_run);
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
function appendPreAdmittedNote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string,
  precomputedId?: string,
): string {
  const { id, text } = composeValidatedNote(task, note, body, precomputedId);
  // The SAME single write chokepoint (R6-1) appendNote reaches: containment is a property of the
  // write, so a traversal-bearing id can never escape the task's notes dir on this route either.
  writeNoteFile(join(contextRoot, task, "notes"), id, text);
  return id;
}

// ── appendNote: validate → compose → ADMIT → atomicWrite to a FRESH unique notes/<id>.md. ────────
// Writes one NEW file; never mutates a shared file (SCTX-04). The publish target is always unique,
// so the cross-platform rename-onto-existing hazard does not apply to note publication.
export function appendNote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  precomputedId?: string,
  // TEST SEAM (31-09, review finding WR-10). Production callers pass NOTHING: the governance root is
  // the ONE trusted answer — the same reader `hooks/guard.ts`, `hooks/admission-guard.ts`,
  // `scripts/admission-server.ts` and the CLI `admit` verb ask. A caller-chosen default of `ROOT`
  // meant the hook refused on the host repository's dial while this writer consulted the kit's, which
  // under the shipped shared-install model (`~/.grugops` kit + per-repo state) are different
  // directories. Plan 30-11 removed exactly this seam from the production `admit` verb for exactly
  // this reason: an admission may not point governance at a root the caller chose.
  repoRoot: string = trustedRepoRoot(),
): string {
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
  const admission = admit(task, text, contextRoot, repoRoot);
  if (admission.length > 0) {
    throw new Error(
      `context-io.appendNote: refusing to write a note the admission authority did not accept. ` +
        `Nothing was written:\n${admission.join("\n")}`,
    );
  }
  // Route through the SINGLE write chokepoint (R6-1): containment is a property of the write, so a
  // traversal-bearing id can never escape the task's notes dir.
  const notesDir = join(contextRoot, task, "notes");
  writeNoteFile(notesDir, id, text);
  return id;
}

// ── The ONE note-directory reader: walk, parse, and name each note ONCE. ────────────────────────
//
// FACTORED OUT, NOT ADDED BESIDE (31-14). `readContext` returns PROJECTED records, and the
// proof-gated re-binding route below needs the same directory's RAW bytes as well. Giving that
// route its own walk would put a SECOND file walk and a SECOND id rule beside this one — this
// repository's named failure class, applied to the reader. So the walk, the parse and the id rule
// live here once, and the two views (records, raw text) are both read off this result.
interface RawNote {
  /** The note's identity, decided by the ONE rule below. */
  readonly id: string;
  /** The file's bytes, exactly as stored. */
  readonly text: string;
  /** The canonical parse of those bytes. */
  readonly parsed: ParsedFrontmatter;
}

function readRawNotes(task: string, contextRoot: string): RawNote[] {
  assertSafeTask(task);
  const notesDir = join(contextRoot, task, "notes");
  if (!existsSync(notesDir)) return [];
  const out: RawNote[] = [];
  for (const file of readdirSync(notesDir)) {
    if (!file.endsWith(".md")) continue;
    const text = readFileSync(join(notesDir, file), "utf8");
    const parsed = parseNote(text);
    if (!parsed) continue; // skip an unparseable file rather than crash the read
    // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
    // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
    // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
    // wins for the read and the divergence is left for validate() to surface on the explicit path.
    const fileId = file.replace(/\.md$/, "");
    const s = parsed.scalars;
    out.push({ id: s.id && s.id !== "" ? s.id : fileId, text, parsed });
  }
  return out;
}

// ── recordFromParsed: the store's own read-back PROJECTION of a parsed note. ────────────────────
// One projection, so "what the store reads back" has a single answer that both `readContext` and
// the re-binding proof below consult.
function recordFromParsed(parsed: ParsedFrontmatter, id: string): NoteRecord {
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
export function readContext(task: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): NoteRecord[] {
  return readRawNotes(task, contextRoot).map((raw) => recordFromParsed(raw.parsed, raw.id));
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
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
// this module has independent reason to trust: a directory the module RECOGNISES as a grugops
// context store — `<X>/.grugops/context`, the shape `DEFAULT_CONTEXT_ROOT` names and the only shape
// the sanctioned writers create — or a location reached from `trustedRepoRoot()`, the module's own
// answer to which root governs, which no caller supplies. Inside such a location the proof is what
// it always was: the named source note is LIVE in the origin's deterministic replay, and the
// promoted input recomposes to exactly the record the store reads back there. A caller that cannot
// produce that proof, or that names an origin outside those locations, is DECLINED — naming the
// clause that failed, with nothing written.
//
// WHY THE CONSTRAINT IS SHAPE-AND-ROOT AND NOT A REGISTRY, AND WHAT THAT COSTS. A cross-repository
// compaction — an origin in one checkout, a destination in another — is a promotion a host genuinely
// performs, and Workflow 18 names the origin context root as a caller-supplied argument for exactly
// that reason. Requiring the origin to be the DESTINATION's own store would refuse it. So the
// recognition is by shape, and what that leaves open is written down rather than waved away:
// `T-31-18-01` in the residual register below, with what would force it closed.
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
export const PROMOTE_ADMITTED_DECLINES: Readonly<Record<string, string>> = Object.freeze({
  "empty-source-id":
    "A re-binding names the note it re-binds. An empty or blank source id names nothing, so there " +
    "is no origin record to prove anything against and the promotion is not a re-binding at all.",
  "unreadable-governance-config":
    "The governance configuration exists at a standard location and could not be read or parsed, so " +
    "the human_admission dial is UNKNOWN (D-14). This route skips only the human-stamp arm the " +
    "in-script tier cannot verify — never the authority itself — so an unknowable dial fails closed " +
    "here exactly as it does in admit(). A genuinely ABSENT config is a different case and runs lean.",
  "no-such-origin-note":
    "No note with the named id exists in the origin context under this task. The proof's left " +
    "operand is the origin's own stored bytes; with no such note there is nothing that was ever " +
    "admitted, and the promotion is a NEW admission that must take the full-admission route.",
  "origin-note-not-live":
    "The named origin note exists but is not LIVE in the origin's deterministic replay — another " +
    "note supersedes it. A superseded disposition is one a later note withdrew, and carrying it " +
    "forward would re-admit a decision the origin context has already folded out.",
  "field-differs-from-origin":
    "A load-bearing field of the promoted note differs from the origin record the id names. A " +
    "re-binding is a FAITHFUL carry-forward; a note whose provenance changed is a new note, and a " +
    "new note is a new admission.",
  "body-differs-from-origin":
    "The promoted body differs from the origin record's. A compaction that CHANGED the note is not " +
    "a re-binding — it is a new admission, decided by the full authority at the destination, and " +
    "honestly degraded when its stamp no longer cross-checks (Workflow 18 step 6).",
  "human-stamp-not-gated-at-destination":
    "The destination's governance dial does not gate this note, so a human:NAME disposition is not " +
    "meaningful on it and accepting one would forge a disposed_by audit record — the identical " +
    "ground admitAndAppend's W3 arm refuses the same note on. A re-binding carries forward the one " +
    "binding the in-script tier cannot verify; where the destination gates nothing there is no such " +
    "binding to carry, and the note is an ordinary new admission that must take the full-admission " +
    "route with an empty or §14-gate stamp.",
  "origin-outside-trusted-store":
    "The named origin does not resolve inside a location this module has independent reason to " +
    "trust — neither a directory it recognises as a grugops context store nor a location reached " +
    "from its own trusted-root answer. The proof's left operand is the origin's stored bytes, so an " +
    "ordinary directory a caller authored and named would let that caller supply the very bytes its " +
    "own write is judged against: a flag wearing a filesystem path.",
  "destination-id-occupied":
    "The destination already holds a DIFFERENT note under this id. The shared verified context is " +
    "APPEND-ONLY: a supersession is a NEW note, never a rewrite of an existing one, and a promotion " +
    "that replaced a note would delete admitted evidence from the permanent audit trail rather " +
    "than supersede it. Destination bytes IDENTICAL to the proven origin bytes are a different " +
    "case and are decided as an idempotent re-promotion that proceeds — a re-run compaction has " +
    "nothing to destroy — so this clause names only the destructive one.",
});

/**
 * Named residuals of this route: trust boundaries it does NOT close, each with its reason.
 * Published beside the declines so a boundary nobody wrote down cannot become the next round's gap.
 */
export const PROMOTE_ADMITTED_RESIDUALS: readonly string[] = Object.freeze([
  "T-31-14-03 — a note HAND-WRITTEN into the origin notes/ directory and then promoted is not " +
    "detected. The origin store is trusted here exactly as far as every other reader trusts it; " +
    "workflows 16 and 18 forbid hand-authoring a context path, and the un-forgeable tier remains " +
    "the per-call admission-guard hook. Disposition: accept.",
  "T-31-18-01 — the origin store is recognised by its SHAPE (a directory named `context` inside a " +
    "directory named `.grugops`) or by sitting under `trustedRepoRoot()`, never by a registry. A " +
    "caller that constructs that whole tree around notes it authored still presents a store this " +
    "route accepts. The capability is KEPT deliberately: a cross-repository compaction is a " +
    "promotion a host genuinely performs, and Workflow 18 names the origin context root as an " +
    "argument for exactly that reason. What it costs is bounded by, and identical to, T-31-14-03 — " +
    "this route trusts what a recognised store CONTAINS. What would force it closed: a store marker " +
    "the sanctioned writer emits and this route verifies, or an explicit registry of origin stores a " +
    "caller cannot author. Disposition: accept.",
  "R-37 — the compared field set is the store's own read-back projection (recordFromParsed) plus " +
    "the body. A frontmatter key the parser accepts and that projection drops is not compared — and " +
    "is also not read by admit(), render() or any other consumer, so the boundary is the store's " +
    "view of a note rather than this route's. Disposition: accept, bounded by that projection.",
]);

/**
 * Is `candidate` a directory this module RECOGNISES as a grugops context store?
 *
 * The shape is `<X>/.grugops/context` — exactly what `DEFAULT_CONTEXT_ROOT` names and the only
 * shape the sanctioned writers create. It is a recognition rule, not an existence check: a store
 * that is missing is a different case, decided one clause later by "no such origin note".
 */
function isRecognisedContextStore(candidate: string): boolean {
  const resolved = resolve(candidate);
  return basename(resolved) === "context" && basename(dirname(resolved)) === ".grugops";
}

/**
 * Does the proof's left operand resolve inside a location this module has independent reason to
 * trust? (31-18, WR-17.)
 *
 * TWO ARMS, AND WHY NEITHER IS THE CALLER'S TO CHOOSE. The first recognises a context store by its
 * shape. The second asks `trustedRepoRoot()` — the module's OWN answer to which root governs, read
 * from the ambient environment and the working directory, never from an argument. The route's
 * `repoRoot` TEST SEAM is deliberately NOT consulted here: a caller that could supply both the
 * governance root and the origin would be choosing the location its own proof is judged inside,
 * which is the doctrine 30-11 and 31-09 both enforce, one register over.
 */
function originIsTrusted(from: string): boolean {
  const resolvedFrom = resolve(from);
  if (isRecognisedContextStore(resolvedFrom)) return true;
  const trusted = resolve(trustedRepoRoot());
  return resolvedFrom === trusted || resolvedFrom.startsWith(trusted + sep);
}

/** Build one decline, taking its reason from the single register above. */
function declineRebinding(clause: string, detail: string): Error {
  const reason = PROMOTE_ADMITTED_DECLINES[clause];
  // A clause with no register entry is a decline nobody wrote a reason for. Fail loudly rather than
  // emitting an undefined sentence — the register and the code are one thing or they are drift.
  if (reason === undefined) {
    return new Error(
      `context-io.promoteAdmitted: internal — no decline register entry for clause "${clause}".`,
    );
  }
  return new Error(
    `context-io.promoteAdmitted: DECLINED (${clause}). ${detail} Nothing was written. ${reason}`,
  );
}

/**
 * Promote a note that was ALREADY ADMITTED at an origin context into a destination context.
 *
 * Returns the persisted note id. On the proof route that id IS `sourceId` — the frozen creation-time
 * identity is carried forward, so the destination file is byte-identical to the origin file and the
 * compaction carve-out's id-keyed raw→promoted match still holds.
 *
 * @param repoRoot TEST SEAM, exactly as `appendNote`'s and `admitAndAppend`'s: production callers
 * pass nothing and the governance root is the ONE trusted answer every tier asks.
 */
export function promoteAdmitted(
  task: string,
  sourceId: string,
  note: NoteInput,
  body: string,
  from: string,
  to: string,
  repoRoot: string = trustedRepoRoot(),
): string {
  assertSafeTask(task);

  // ── THE ENTRY SET, DECIDED FIRST AND NAMED. ────────────────────────────────────────────────────
  // This route exists for ONE question the frozen arm cannot answer: is this human disposition the
  // same one a human already placed at the origin? A note that carries no human disposition stamp
  // does not ask that question, so it is not this route's business — it takes the FULL-ADMISSION
  // route, byte-identically to what `compactor.promote` does today. That is why a `§14-gate`-stamped
  // finding and an `artifact-ref` still re-bind against a live green verdict at the destination: they
  // never enter the proof at all. Falling through here is deliberate and is asserted by test — a
  // shape outside the entry set must not be silently accepted OR silently dropped.
  const vb = (note.verified_by ?? "").trim();
  if (!HUMAN_STAMP_RE.test(vb)) {
    return appendNote(task, note, body, to, undefined, repoRoot);
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
  let govResult: GovernanceConfigResult | null = null;
  try {
    govResult = readGovernanceConfig(repoRoot);
  } catch {
    govResult = null;
  }
  if (govResult === null || govResult.source === "unreadable") {
    throw declineRebinding(
      "unreadable-governance-config",
      "A governance configuration file exists at a standard location but could not be read or parsed.",
    );
  }

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
    throw declineRebinding(
      "human-stamp-not-gated-at-destination",
      `The destination's dial does not gate a "${note.kind}" authored by "${note.by}", so the ` +
        `"${vb}" disposition binds nothing there.`,
    );
  }

  // THE OPERAND IS CONSTRAINED BEFORE IT IS READ (31-18, WR-17). A proof whose left operand the
  // benefiting caller may author is a flag wearing a filesystem path. The origin must resolve inside
  // a location this module has independent reason to trust; what that recognition still leaves open
  // is the named residual T-31-18-01 rather than a silence.
  if (!originIsTrusted(from)) {
    throw declineRebinding(
      "origin-outside-trusted-store",
      `The origin "${resolve(from)}" is neither a recognised grugops context store nor inside the ` +
        `root this module trusts.`,
    );
  }

  // THE PROOF'S LEFT OPERAND: the origin's own bytes, folded through the SAME deterministic replay
  // every other reader of that context uses. Without this read there is nothing to compare against,
  // which is what makes this a proof rather than a flag.
  const originRaw = readRawNotes(task, from);
  const originEntry = originRaw.find((raw) => raw.id === sourceId);
  if (originEntry === undefined) {
    throw declineRebinding(
      "no-such-origin-note",
      `No note with id "${sourceId}" exists under task "${task}" in the origin context.`,
    );
  }
  const originRecord = recordFromParsed(originEntry.parsed, originEntry.id);
  const live = currentState(originRaw.map((raw) => recordFromParsed(raw.parsed, raw.id)));
  if (!live.some((n) => n.id === sourceId)) {
    throw declineRebinding(
      "origin-note-not-live",
      `The note "${sourceId}" is present in the origin context but has been superseded there.`,
    );
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
  const originFields = originRecord as unknown as Record<string, unknown>;
  const candidateFields = candidateRecord as unknown as Record<string, unknown>;
  for (const key of comparedKeys) {
    const originValue = JSON.stringify(originFields[key] ?? null);
    const candidateValue = JSON.stringify(candidateFields[key] ?? null);
    if (originValue !== candidateValue) {
      throw declineRebinding(
        "field-differs-from-origin",
        `Field "${key}" is ${candidateValue} on the promoted note and ${originValue} on the origin ` +
          `record "${sourceId}".`,
      );
    }
  }
  if (candidateRecord.body !== originRecord.body) {
    throw declineRebinding(
      "body-differs-from-origin",
      `The promoted body is not the body stored for "${sourceId}" at the origin.`,
    );
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
    throw declineRebinding(
      "destination-id-occupied",
      `The destination already holds a DIFFERENT note under id "${sourceId}".`,
    );
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
  const persistedId = appendPreAdmittedNote(task, note, body, to, sourceId);
  if (govResult.config.audit_retention === "retained" && !ledgerRecordsId(repoRoot, persistedId)) {
    appendAuditLedger(
      repoRoot,
      {
        id: persistedId,
        kind: note.kind,
        by: note.by,
        at: note.at,
        verified_by: note.verified_by,
        confidence: note.confidence,
      },
      isHighSeverityRole(note.by),
      vb,
      true,
    );
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
export const TEST_INTEGRITY_RESULTS = ["clean", "finding", "unknown"] as const;
export type TestIntegrityResult = (typeof TEST_INTEGRITY_RESULTS)[number];

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
export function emitVerdict(
  task: string,
  id: string,
  integrity: TestIntegrityResult,
  sha: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
): string | null {
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
  // The gate-run SHA, checked in the same slot and the same way as the per-run id above and BEFORE
  // the first line that builds any part of the note — a refusal here can leave no partial file
  // because nothing has been composed. `(sha as unknown) ?? ""` covers the untyped caller who hands
  // across `undefined` or `null`; a padded or empty value fails the anchored allowlist.
  assertSingleLine("verdict sha", (sha as unknown as string) ?? "");
  assertHexScalar("verdict sha", (sha as unknown as string) ?? "");
  // REFUSE BEFORE COMPOSE (D-16). Placed above the first line that builds any part of the note, so
  // a refusal cannot leave a partial or zero-length note file behind — the only way to guarantee
  // "nothing was written" is to have composed nothing. Anything that is not EXACTLY the clean
  // sentinel lands here, including a value this file does not recognize: `finding`, `unknown`, a
  // misspelling, a wrong case, a non-string forced through by an untyped caller, and absence.
  // It returns rather than throws: a throw at the gate's terminal step is a crash where the
  // contract promises a degraded finding at `UNKNOWN - verify`.
  if ((integrity as unknown) !== TEST_INTEGRITY_CLEAN) return null;
  const note: NoteInput = {
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
  for (const r of note.refs) assertSingleLine("refs[]", r);
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
function emitTrusted(
  identity: ReservedIdentity,
  emitterName: string,
  task: string,
  note: NoteInput,
  text: string,
  id: string,
  contextRoot: string,
): string {
  if (note.by !== identity) {
    throw new Error(
      `context-io.${emitterName}: refusing to emit — the composed note is authored "${note.by}" ` +
        `while the emitter claims the reserved identity "${identity}". An emitter may only author ` +
        `its own identity.`,
    );
  }
  const findings = validate(text, identity);
  if (findings.length > 0) {
    throw new Error(
      `context-io.${emitterName}: refusing to write an invalid note:\n${findings.join("\n")}`,
    );
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

/** What one checkpoint decision records. Every field is stated by the guard, none by the agent. */
export interface CheckpointNoteInput {
  /** The roster id whose pattern group the command matched. */
  readonly checkpoint: string;
  /** The disposition the config DECLARED (what the banner reports). */
  readonly declared: string;
  /** The disposition actually ENFORCED. */
  readonly effective: string;
  /** The name key two carries, or `null` when the lowering was never authorized. */
  readonly authorizedBy: string | null;
  /** The name of key two for this checkpoint, or `null` for a non-floor member. */
  readonly envVarName: string | null;
  /** What the guard did about this command. */
  readonly outcome: "allowed" | "refused";
  /**
   * The name of the ACTION-approval variable when that variable — not the checkpoint's own key two —
   * is what let the command proceed; `null` otherwise (plan 30-11, finding A-3).
   *
   * It exists because `outcome: "allowed"` and `effective: "block"` are a legal and initially
   * puzzling combination: the lowering was NOT authorized (so the checkpoint is enforced at its
   * default) while the action itself was separately approved by a human at that un-lowered posture.
   * Without this field a reader of the record would have to guess which of the two keys applied, and
   * the obvious guess — that the two-key rule was bypassed — is the wrong one.
   */
  readonly actionApproval: string | null;
  /** The actor, as far as a PreToolUse payload can identify one. */
  readonly actor: string;
  /** The command the decision was about. */
  readonly command: string;
}

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
function bodyValue(v: unknown): string {
  return JSON.stringify(String(v));
}

/** The two outcomes a checkpoint record may state. Derived from the input type's own union. */
const CHECKPOINT_OUTCOMES: readonly CheckpointNoteInput["outcome"][] = ["allowed", "refused"];

export function emitCheckpointNote(
  input: CheckpointNoteInput,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  at: string = new Date().toISOString(),
  task: string = CHECKPOINT_TRACE_TASK,
): string {
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
  if (!(CHECKPOINTS as readonly string[]).includes(input.checkpoint)) {
    throw new Error(
      `context-io.emitCheckpointNote: refusing to emit — "${input.checkpoint}" is not a checkpoint ` +
        `on the roster. A record under the reserved identity may only name a checkpoint that exists.`,
    );
  }
  for (const [field, value] of [
    ["declared", input.declared],
    ["effective", input.effective],
  ] as const) {
    if (!(DISPOSITIONS as readonly string[]).includes(value)) {
      throw new Error(
        `context-io.emitCheckpointNote: refusing to emit — ${field} is "${value}", which is not one ` +
          `of ${DISPOSITIONS.join("|")}. A record under the reserved identity may only state a ` +
          `disposition the canonicalizer admits.`,
      );
    }
  }
  if (!(CHECKPOINT_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw new Error(
      `context-io.emitCheckpointNote: refusing to emit — outcome is "${input.outcome}", which is ` +
        `not one of ${CHECKPOINT_OUTCOMES.join("|")}. A record under the reserved identity may not ` +
        `mint a verdict word the design does not define.`,
    );
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
  for (const field of ["envVarName", "actionApproval", "authorizedBy", "actor", "command"] as const) {
    const value = (input as unknown as Record<string, unknown>)[field];
    if (value === null && NULLABLE_BODY_FIELDS.has(field)) continue;
    if (typeof value !== "string") {
      throw new Error(
        `context-io.emitCheckpointNote: refusing to emit — ${field} is ${
          value === undefined ? "undefined" : typeof value
        }, not a string. A misspelled or missing caller field reaches the record as the literal text ` +
          `"undefined", and this record's whole value is that its sentences are true.`,
      );
    }
    assertSingleLine(field, value);
  }
  const note: NoteInput = {
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
  const authorization =
    input.authorizedBy === null
      ? input.envVarName === null
        ? "not applicable (this checkpoint is not floor-tier and needs no second key)"
        : `NONE — ${input.envVarName} is absent, so the declaration authorized nothing`
      : `${input.envVarName}=${bodyValue(input.authorizedBy)}`;
  const body =
    `CHECKPOINT ${input.outcome.toUpperCase()}: the checkpoint "${input.checkpoint}" was declared ` +
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
  for (const r of note.refs) assertSingleLine("refs[]", r);
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
  let govResult: GovernanceConfigResult | null = null;
  try {
    govResult = readGovernanceConfig(repoRoot);
  } catch {
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
  reBound = false,
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
  //
  // `re_bound` is APPENDED AFTER the fixed seven, and ONLY when a re-binding asked for it (31-18,
  // WR-18). Every event a fresh admission writes therefore produces the identical seven-key line it
  // produced before this change — the field is ABSENT rather than `false`, which is asserted
  // byte-for-byte rather than claimed — while a re-bound event stays distinguishable from a fresh
  // one for any reader of the ledger.
  appendFileSync(
    ledgerPath,
    JSON.stringify(reBound ? { ...event, re_bound: true } : event) + "\n",
    "utf8",
  );
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
 * A ledger that cannot be read answers "not recorded" rather than throwing: the caller's response to
 * both is to append, which is the conservative direction — a duplicate line is a legible redundancy,
 * a missing line is a silent gap in an audit trail.
 */
function ledgerRecordsId(repoRoot: string, id: string): boolean {
  const ledgerPath = join(repoRoot, AUDIT_LEDGER_RELPATH[0], AUDIT_LEDGER_RELPATH[1], AUDIT_LEDGER_RELPATH[2]);
  if (!existsSync(ledgerPath)) return false;
  let raw: string;
  try {
    raw = readFileSync(ledgerPath, "utf8");
  } catch {
    return false;
  }
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    try {
      if ((JSON.parse(line) as { id?: unknown }).id === id) return true;
    } catch {
      continue; // an unparseable line records nothing about this id
    }
  }
  return false;
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
// The evidence-provenance fields are APPENDED after `supersedes`, in the fence's own order, and
// only when the record carries them — the same presence condition the composer emits on, so a
// note's JSONL line and its fence never disagree about which fields exist. Every note that carries
// none produces the identical eight-key line it produced before Phase 31; the JSON key order is
// fixed by insertion order here, so the line stays byte-reproducible either way.
function toJsonl(n: NoteRecord): string {
  const event: Record<string, unknown> = {
    id: n.id,
    kind: n.kind,
    by: n.by,
    at: n.at,
    verified_by: n.verified_by,
    confidence: n.confidence,
    refs: n.refs,
    supersedes: n.supersedes,
  };
  if (n.sha !== undefined && n.sha !== "") event.sha = n.sha;
  if (n.gate_run !== undefined && n.gate_run !== "") event.gate_run = n.gate_run;
  if (n.content_hash !== undefined && n.content_hash !== "") event.content_hash = n.content_hash;
  return JSON.stringify(event);
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
  // ── Evidence provenance, rendered as its OWN conditional section (Phase 31) ──
  // The current-state table's columns are fixed and every existing render depends on them, so the
  // three fields get a section of their own rather than three more columns on every row. It is
  // emitted only when some live note carries provenance, in the same shape the history section
  // already uses — so a task holding no evidence renders byte-for-byte what it rendered before.
  // Field order matches the fence and the JSONL line: sha, then gate_run, then content_hash.
  const provenanced = live.filter(
    (n) => (n.sha ?? "") !== "" || (n.gate_run ?? "") !== "" || (n.content_hash ?? "") !== "",
  );
  if (provenanced.length > 0) {
    md.push("");
    md.push("## Evidence provenance");
    md.push("");
    md.push("| at | kind | by | sha | gate_run | content_hash |");
    md.push("| --- | --- | --- | --- | --- | --- |");
    for (const n of provenanced) {
      md.push(
        `| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(n.sha ?? "")} | ` +
          `${cell(n.gate_run ?? "")} | ${cell(n.content_hash ?? "")} |`,
      );
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
      md.push(
        `| ${cell(n.at)} | ${cell(n.kind)} | ${cell(n.by)} | ${cell(supersededBy)} | ` +
          `${cell(bodyExcerpt(n.body))} |`,
      );
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
const GOVERNANCE_DEFAULTS = { human_admission: "off", audit_retention: "git" } as const;

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

// ── The discriminated result the ONE reader returns (GOV-01, SC3, AUTO-01/02) ────────────────────
//
// `source` is the distinction the deleted value reader could not express, and the whole reason the
// pair existed at all:
//   - "absent"     — no config file at any standard location (zero-config lean).
//   - "ok"         — a config file was read and parsed; `config` carries its (verbatim) values.
//   - "unreadable" — a config file EXISTS at a standard location but could not be read or parsed
//                    (corrupt / non-JSON). EVERY consumer fails closed on it: the hook denies,
//                    `isGatedNote` gates, the matrix reads at the roster default (all `block`), and
//                    admit() refuses and degrades to `UNKNOWN - verify` (D-14).
export type GovernanceConfigSource = "absent" | "ok" | "unreadable";

// ── The config shape, checkpoint matrix included (AUTO-01/02/07; collapsed to one type by 30-03) ──
//
// This was TWO types while there were two readers: a `GovernanceConfig` the fail-open value reader
// returned, and a `GovernanceConfigWithCheckpoints` extending it that only the fail-closed reader
// returned — because a safety matrix must never be reported by a reader whose documented posture is
// "degrade quietly". With the value reader deleted (D-12) that split has nothing left to protect:
// there is one reader, it fails closed, and it returns one shape. Keeping a matrix-less
// `GovernanceConfig` export beside it would leave a type saying "a governance config need not carry
// a matrix", which is exactly the residue of the authority this plan removed.
export interface GovernanceConfig {
  human_admission: string;
  audit_retention: string;
  /** The effective per-checkpoint matrix. Key set is EXACTLY `CHECKPOINTS`, always. */
  readonly checkpoints: Readonly<Record<Checkpoint, Disposition>>;
}

export interface GovernanceConfigResult {
  source: GovernanceConfigSource;
  config: GovernanceConfig;
  /**
   * Human-readable refusals accumulated while reading the matrix — a `checkpoints` value that was
   * not a JSON object, or a key that is not a roster member. A refused input is DROPPED from the
   * effective matrix (it never widens the roster) and recorded here so the run can say what it
   * ignored instead of ignoring it silently (D-08).
   */
  readonly checkpointRefusals: readonly string[];
}

/** What `readCheckpointMatrix` returns: the effective matrix plus anything it refused. */
interface CheckpointMatrixRead {
  readonly matrix: Readonly<Record<Checkpoint, Disposition>>;
  readonly refusals: readonly string[];
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
function readCheckpointMatrix(parsed: unknown): CheckpointMatrixRead {
  const defaults = { ...CHECKPOINT_DEFAULTS } as Record<Checkpoint, Disposition>;
  const refusals: string[] = [];

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    refusals.push(
      "the config file did not parse to a JSON object, so no `checkpoints` matrix could be read — every checkpoint is enforced at `block`",
    );
    return { matrix: { ...STRICTEST_MATRIX }, refusals };
  }

  const raw = (parsed as { checkpoints?: unknown }).checkpoints;
  if (raw === undefined) {
    return { matrix: defaults, refusals }; // zero-config: defaults, and nothing to report.
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    refusals.push(
      "`checkpoints` is present but is not a JSON object — the whole matrix is refused and every checkpoint is enforced at `block`",
    );
    return { matrix: { ...STRICTEST_MATRIX }, refusals };
  }

  const obj = raw as Record<string, unknown>;
  const rosterIds = new Set<string>(CHECKPOINTS);
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
      refusals.push(
        `\`checkpoints.\` entry ${JSON.stringify(key)} is not a checkpoint on the roster — the entry is dropped and does not widen the checkpoint set`,
      );
    }
  }
  for (const id of CHECKPOINTS) {
    if (!(id in obj)) continue; // absent key → the roster default already in place.
    const value = obj[id];
    const canonical = canonicalizeDisposition(value);
    if (canonical === "block" && value !== "block") {
      refusals.push(
        `\`checkpoints.${id}\` carries a value that is not one of block|notify|off — it is enforced as \`block\``,
      );
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
export function governanceConfigCandidates(base: string): readonly string[] {
  return [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];
}

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
export const GOVERNANCE_CONFIG_RELPATHS: readonly string[] = governanceConfigCandidates("").map(
  (p) => p.split(sep).join("/"),
);

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
export const GOVERNANCE_FALLBACK_BASE: string = ROOT;

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
export const TRUSTED_ROOT_ENV_ORDER: readonly string[] = Object.freeze([
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
 * BOUND is `isAtOrAboveHome` below: a property of the walk rather than of which tool the user
 * happens to run. This set decides where a REPOSITORY starts, which is a different question.
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
export const REPO_BOUNDARY_MARKERS: readonly string[] = Object.freeze([
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
function directoryIdentity(dir: string): string | null {
  try {
    const st = statSync(dir);
    return `${String(st.dev)}:${String(st.ino)}`;
  } catch {
    return null;
  }
}

/** The user's home directory, as `os.homedir()` names it, or `null` when it names nothing real. */
function namedHomeDirectory(): string | null {
  let raw: string;
  try {
    raw = homedir();
  } catch {
    return null;
  }
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const home = resolve(raw.trim());
  // A home directory that is not an existing directory has not been DETERMINED. Saying so here is
  // what lets the caller degrade to the kit instead of walking on with an unenforceable bound.
  return directoryIdentity(home) === null ? null : home;
}

/**
 * THE BOUND ON THE UPWARD SEARCH: the user's home directory and every ancestor of it (plan 31-19,
 * review finding WR-21).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THE BOUND IS HERE RATHER THAN IN THE MARKER SET. The marker set says where a repository
 * starts; it says nothing about how far the search may go when no marker exists. Under the shipped
 * shared-install model the kit lives at `~/.grugops`, so a home-directory-shaped ancestor carrying
 * exactly a `.grugops/factory.config.json` is what `install/install.ts` creates rather than a
 * contrived tree. Adopting it has two consequences, both measured on the committed artifact: an
 * unrelated directory's dial decides admission for work done elsewhere, and `appendAuditLedger`
 * writes GOV-02 events — note id, author, stamp, severity, disposer — into THAT directory's
 * committed audit trail.
 *
 * WHY IDENTITY AND NOT PATH TEXT. A home directory reached through a symlink, or spelled with
 * different case on a case-insensitive filesystem, is the same directory under a different string.
 * A text comparison misses it, and a missed stop is the unsafe direction. `dev:ino` is the
 * filesystem's own answer to "is this the same directory", so the comparison is made against the
 * thing rather than against a spelling of it.
 *
 * WHY THE PATH SET IS KEPT ANYWAY, AND WHY THE IDENTITY SET'S PREMISE IS ASSERTED. Not every
 * platform reports a meaningful inode: where they are degenerate, every directory would carry one
 * identity and the walk would stop at its first step, which would silently re-open WR-15 on that
 * platform. So the premise is CHECKED rather than assumed — the home directory's identity is
 * compared with its own parent's, and where they agree the identity set is discarded and the
 * spelling set decides alone. The residual that leaves is named in `TRUSTED_ROOT_RESIDUALS`.
 * ---------------------------------------------------------------------------------------------
 */
interface HomeBoundary {
  readonly paths: ReadonlySet<string>;
  readonly ids: ReadonlySet<string>;
}

function homeBoundary(): HomeBoundary | null {
  const named = namedHomeDirectory();
  if (named === null) return null;

  // The same directory under every spelling this module can obtain for it.
  const spellings = new Set<string>([named]);
  try {
    spellings.add(resolve(realpathSync(named)));
  } catch {
    // The resolved spelling is what there is. The identity set below covers the rest.
  }

  const paths = new Set<string>();
  const ids = new Set<string>();
  for (const start of spellings) {
    let dir = start;
    for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
      paths.add(dir);
      const id = directoryIdentity(dir);
      if (id !== null) ids.add(id);
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  // THE IDENTITY SET'S OWN PREMISE. Two directories that are demonstrably different must not carry
  // the same identity. Where they do, the platform's identities say nothing and are dropped.
  const parent = dirname(named);
  const degenerate = parent !== named && directoryIdentity(parent) === directoryIdentity(named);
  return { paths, ids: degenerate ? new Set<string>() : ids };
}

/** Whether `dir` IS the user's home directory or an ancestor of it — the directories never read. */
function isAtOrAboveHome(dir: string, home: HomeBoundary): boolean {
  if (home.paths.has(dir)) return true;
  const id = directoryIdentity(dir);
  return id !== null && home.ids.has(id);
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
 * THE THREE RULES, AND THEIR PRECEDENCE, STATED RATHER THAN LEFT TO READING ORDER.
 *
 * 1. THE HOME STOP WINS OVER EVERYTHING. A directory that is the user's home directory, or an
 *    ancestor of it, is never inspected — not for a configuration, not for a marker. This is the
 *    bound WR-21 found claimed and absent.
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
function projectRootFromWorkingDirectory(startDir: string): string | null {
  let dir: string;
  try {
    dir = resolve(startDir);
  } catch {
    return null;
  }
  // A HOME DIRECTORY THAT CANNOT BE DETERMINED IS NOT A LICENCE TO WALK PAST IT. The search does
  // not run at all, and the caller falls through to the kit — the answer the pre-31-15 program gave
  // unconditionally. An unbounded search is the one outcome this case may not degrade to.
  const home = homeBoundary();
  if (home === null) return null;

  let nearest: string | null = null;
  for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
    if (isAtOrAboveHome(dir, home)) return nearest;
    // `existsSync` is the right predicate here and its failure direction is the safe one: a
    // position occupied by something that is not a readable regular file still ANSWERS this
    // search, and `readGovernanceConfig` then maps it to `unreadable`, which is gate-or-stricter.
    // A position that does not exist at all is not a configuration and the walk continues.
    const carriesConfig = governanceConfigCandidates(dir).some((candidate) => existsSync(candidate));
    if (carriesConfig && nearest === null) nearest = dir;
    if (REPO_BOUNDARY_MARKERS.some((marker) => existsSync(join(dir, marker)))) {
      return carriesConfig ? dir : nearest;
    }
    const parent = dirname(dir);
    if (parent === dir) return nearest; // filesystem root
    dir = parent;
  }
  return nearest;
}

/** One stop condition of the upward search, in the sentence the protocol document must carry. */
export interface TrustedRootStopCondition {
  /** Stable identifier, cited from a review or a disposition row. */
  readonly id: string;
  /** The stop, stated as one sentence. `16-context-read-write.md` quotes these verbatim. */
  readonly sentence: string;
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
export const TRUSTED_ROOT_STOP_CONDITIONS: readonly TrustedRootStopCondition[] = Object.freeze([
  Object.freeze({
    id: "S-HOME",
    sentence:
      "The upward search never inspects the user's home directory, and never inspects any " +
      "ancestor of it.",
  }),
  Object.freeze({
    id: "S-HOME-UNKNOWN",
    sentence:
      "When the home directory cannot be determined, the upward search does not run at all.",
  }),
  Object.freeze({
    id: "S-BOUNDARY",
    sentence:
      "The upward search ends at the first ancestor carrying a version-control marker, and that " +
      "ancestor's own configuration wins over one nested below it.",
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
 * THE ONE TRUSTED ROOT (plan 30-11 round 2, findings `RA2-1` and reviewer-1 observation 2; the
 * resolution order below is plan 31-15, review finding WR-15).
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
export function trustedRepoRoot(): string {
  for (const name of TRUSTED_ROOT_ENV_ORDER) {
    const fromEnv = process.env[name];
    if (typeof fromEnv === "string" && fromEnv.trim() !== "") return resolve(fromEnv.trim());
  }
  let cwd: string | null = null;
  try {
    cwd = process.cwd();
  } catch {
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
  const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);
  if (discovered !== null) return discovered;
  return GOVERNANCE_FALLBACK_BASE;
}

/** One shape the resolution order still cannot answer, with the reason it is left open. */
export interface TrustedRootResidual {
  /** Stable identifier, cited from `31-15-SUMMARY.md` and from any later review. */
  readonly id: string;
  /** The shape, stated as the situation rather than as a verdict. */
  readonly shape: string;
  /** Why it is left open — the argument, not an assurance. */
  readonly reason: string;
  /** What would force it closed, so a later round has a criterion rather than an opinion. */
  readonly what_would_force_it_closed: string;
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
export const TRUSTED_ROOT_RESIDUALS: readonly TrustedRootResidual[] = Object.freeze([
  Object.freeze({
    id: "R-31-15-01",
    shape:
      "A process that can change its own working directory can decide which project's factory " +
      "configuration step 3 finds.",
    reason:
      "Threat T-31-15-02, dispositioned ACCEPT. It is strictly monotone against the behaviour it " +
      "replaces: step 4 resolved unconditionally to the kit, the most permissive answer available. " +
      "A process that can change its working directory can already set the step-1 or step-2 " +
      "variable in its own child environment, so this adds no capability. What the doctrine forbids " +
      "is a root chosen as an ARGUMENT, and no parameter is added. The un-forgeable tier remains the " +
      "per-call admission hook, which reads the human's fresh session grant.",
    what_would_force_it_closed:
      "A root the calling process cannot influence at all — resolved by the host from outside the " +
      "agent's process tree and delivered through a channel the agent cannot write, as the per-call " +
      "admission hook's session grant already is.",
  }),
  Object.freeze({
    id: "R-31-15-02",
    shape:
      "A host repository that carries no factory configuration at any of the published candidate " +
      "positions resolves to the kit, whose shipped dial is lean.",
    reason:
      "This is the CORRECT answer and not a hole: a repository that configured nothing has expressed " +
      "no governance posture, and the kit's shipped default is the posture the project ships. It is " +
      "recorded here because it reads like a miss to someone tracing WR-15 and is not one.",
    what_would_force_it_closed:
      "Nothing in this module. It would change only if the project decided an unconfigured " +
      "repository should be treated as stricter than the shipped default, which is a product " +
      "decision about the dial and not a resolution-order defect.",
  }),
  Object.freeze({
    id: "R-31-15-03",
    shape:
      "Both project-directory variables are ambient environment values; a process that controls its " +
      "own child environment sets what a child of it resolves.",
    reason:
      "Pre-existing and unchanged by this plan — step 1 has always had this property, and step 2 is " +
      "the same shape one name over. It is the reason the environment tier is documented as the " +
      "weaker, non-mechanically-un-forgeable signal (D-05) rather than as the authority.",
    what_would_force_it_closed:
      "The same thing that would close R-31-15-01: a governance root delivered outside the agent's " +
      "process tree.",
  }),
  Object.freeze({
    id: "R-31-15-04",
    shape:
      "A factory configuration held ABOVE a nested repository is not found from inside that nested " +
      "repository — the walk stops at the inner repository marker.",
    reason:
      "Deliberate, and it is threat T-31-15-03's mitigation rather than a side effect: an unbounded " +
      "walk reaches a user's home directory and a sibling checkout's dial. Stopping at the boundary " +
      "is what makes the search safe to run from an arbitrary working directory.",
    what_would_force_it_closed:
      "A published, explicit statement that an outer repository governs an inner one — which today " +
      "no artifact in this project makes, and which would need its own decision record.",
  }),
  Object.freeze({
    id: "R-31-19-01",
    shape:
      "A factory configuration held at an ancestor BELOW the user's home directory, with no " +
      "repository boundary marker between it and the working directory, governs any process whose " +
      "working directory is under it.",
    reason:
      "That IS step 3, and it is WR-15's CLOSURE rather than a residue of it: the round-3 verifier " +
      "measured every non-Claude-Code host reading the kit's lean default instead of the target " +
      "repository's dial, and the nearest-ancestor search is what fixed it. WR-21's `Fix:` asks for " +
      "a case answering the kit for a working directory below a planted ancestor configuration. " +
      "That case is asserted here for an ancestor AT OR ABOVE the home directory, which is the " +
      "shape the review actually reproduced; asserting it for an ancestor below the home directory " +
      "would revert WR-15, so the difference is recorded rather than quietly taken.",
    what_would_force_it_closed:
      "A published statement that only a VERSION-CONTROLLED checkout may govern. That would make an " +
      "un-versioned project directory unreadable to the order, so it needs its own decision record: " +
      "nothing in this project requires a host repository to carry a repository marker.",
  }),
  Object.freeze({
    id: "R-31-19-02",
    shape:
      "The home directory the stop is measured against is whatever `os.homedir()` names, which " +
      "reads the ambient `HOME` or `USERPROFILE` value a process controls in its own child " +
      "environment.",
    reason:
      "Pre-existing in kind, and the same shape as R-31-15-03 one name over. A process that can set " +
      "`HOME` can already set either project-directory variable, and those name the governance root " +
      "outright, so the stop adds no capability an adversary did not have. The stop exists against " +
      "the ORDINARY case the review reproduced — a legitimate shared install at `~/.grugops` " +
      "adopted by a process that meant nothing by it — not against a process choosing its own root.",
    what_would_force_it_closed:
      "The same thing that would close R-31-15-01 and R-31-15-03: a governance root resolved by the " +
      "host from outside the agent's process tree and delivered through a channel the agent cannot " +
      "write, as the per-call admission hook's session grant already is.",
  }),
  Object.freeze({
    id: "R-31-19-03",
    shape:
      "On a platform whose filesystem reports no meaningful directory identity, the stop compares " +
      "path SPELLINGS alone, so the same home directory reached under an unusual spelling is not " +
      "recognised as the home directory.",
    reason:
      "Decided this way because the alternative fails in the worse direction. Where identities are " +
      "degenerate every directory carries one identity, so trusting them would stop the walk at its " +
      "first step and hand every host on that platform the kit's lean default — a configuration " +
      "moving from refused to admitted, which is the WR-15 defect this order exists to close. The " +
      "premise is CHECKED rather than assumed: the home directory's identity is compared with its " +
      "own parent's, and the identity set is discarded only where the two agree.",
    what_would_force_it_closed:
      "A per-platform identity primitive this module can trust, or a canonicalisation of both sides " +
      "through one resolver — either of which has to be MEASURED on that platform rather than " +
      "reasoned about from this one.",
  }),
  Object.freeze({
    id: "R-31-19-04",
    shape:
      "A version-control system whose checkout root carries a marker name absent from " +
      "`REPO_BOUNDARY_MARKERS` is not recognised as a repository root, so a configuration nested " +
      "inside such a checkout is not outranked by the checkout's own.",
    reason:
      "The marker set is CONTENT, and this project has learned that an open set cannot be claimed " +
      "closed. It is not load-bearing for the BOUND: the home stop bounds the walk whatever markers " +
      "a filesystem happens to carry, and this set decides only where a repository STARTS. What it " +
      "leaves is the pre-31-19 nearest-wins answer, which is what every host had before this plan.",
    what_would_force_it_closed:
      "A boundary predicate that enumerates no tools — a property every checkout root has and no " +
      "directory inside one has — which no artifact in this project can name today.",
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
function isExistingDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function readGovernanceConfigCandidate(path: string): string | null {
  let fd: number;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null; // genuinely nothing here
    throw e; // present and unopenable → the caller's unreadable branch (fail closed)
  }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) {
      throw new Error(
        `context-io: the governance config position "${path}" is not a regular file — it is ` +
          `refused rather than read, because reading a FIFO, a device or a directory can block ` +
          `forever and a guard that never answers does not block anything.`,
      );
    }
    if (st.size > GOVERNANCE_CONFIG_MAX_BYTES) {
      throw new Error(
        `context-io: the governance config at "${path}" is ${st.size} bytes, above the ` +
          `${GOVERNANCE_CONFIG_MAX_BYTES}-byte ceiling — refused rather than read.`,
      );
    }
    // The read is bounded by the size fstat just reported on this same descriptor.
    const buf = Buffer.allocUnsafe(Number(st.size));
    let off = 0;
    while (off < buf.length) {
      const n = readSync(fd, buf, off, buf.length - off, off);
      if (n === 0) break;
      off += n;
    }
    return buf.subarray(0, off).toString("utf8");
  } finally {
    closeSync(fd);
  }
}

export function readGovernanceConfig(repoRoot?: string): GovernanceConfigResult {
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
      if (text === null) continue;
      const parsed = JSON.parse(text) as unknown;
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
      const context = (parsed as { context?: unknown }).context;
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
          checkpoints: cp.matrix,
        },
        checkpointRefusals: cp.refusals,
      };
    } catch {
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
// discriminated read (readGovernanceConfig): an UNREADABLE config fails CLOSED (gate-or-stricter,
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
  // TEST SEAM (31-09, review finding WR-10) — moved in the SAME change as appendNote's. Production
  // callers pass nothing: the governance root is the ONE trusted answer, the same reader the hooks,
  // the admission server and the CLI `admit` verb ask. Moving one default and not the other would
  // re-introduce the divergence in the other direction, which is why they move together.
  repoRoot: string = trustedRepoRoot(),
): AdmitAndAppendResult {
  assertSafeTask(task);

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
    if (findings.length > 0) return { id: null, findings };
    const persistedId = appendPreAdmittedNote(task, note, body, contextRoot, id);
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
        console.error(
          `context-io: admit takes exactly 2 positional arguments and received ${rest.length}. ` +
            `The governance root is NOT an argument: it is ${TRUSTED_ROOT_ENV_ORDER.join(", else ")}` +
            `, else the nearest ancestor of the working directory carrying a factory configuration ` +
            `(bounded by the repository marker), else the kit this script ships in. Set ` +
            `${TRUSTED_ROOT_ENV_ORDER[0]} to move it — an admission may not point governance at a ` +
            `root the caller chose.`,
        );
        process.exit(1);
      }
      const admitRoot = trustedRepoRoot();
      const findings = admit(
        task,
        readFileSync(noteFile, "utf8"),
        join(admitRoot, ".grugops", "context"),
        admitRoot,
      );
      if (findings.length > 0) {
        for (const f of findings) console.error(f);
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
      console.log(
        `note admitted: it passed every admission check that applies to it — structural ` +
          `validation, the reserved-identity rule, the governance dial in force, and, for a ` +
          `finding stamped §14-gate#<id>, the live-green-verdict cross-check.`,
      );
      process.exit(0);
    } else if (cmd === "emit-verdict") {
      // The emission surface 05-pr-quality-gate.md describes (plan 30-05). The integrity argument
      // is read from its command-line position and passed through UNMODIFIED — no canonicalization,
      // no defaulting, no coercion — so an absent or unrecognized one reaches exactly the same
      // refusal as the in-process path and the two surfaces cannot come to disagree.
      const task = rest[0];
      const id = rest[1];
      const integrity = rest[2] as TestIntegrityResult | undefined;
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
        console.error(
          "usage: context-io.js emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot]",
        );
        console.error(
          `context-io: emit-verdict takes 4 or 5 positional arguments and received ${rest.length}. ` +
            `The third is the gate run's test-integrity result and the fourth is the commit SHA the ` +
            `run was performed at, NOT the context root — a shifted invocation would have its ` +
            `context root read as a test outcome. Nothing was written.`,
        );
        process.exit(1);
      }
      const noteIdStr = emitVerdict(
        task,
        id,
        integrity as TestIntegrityResult,
        sha as string,
        contextRoot ?? DEFAULT_CONTEXT_ROOT,
      );
      if (noteIdStr === null) {
        console.error(
          `context-io: refusing to emit a green verdict — the test-integrity result was ` +
            `${JSON.stringify(integrity ?? null)}, and only "clean" admits one. Nothing was ` +
            `written. The finding stays at UNKNOWN - verify. ` +
            // Stated UNCONDITIONALLY, never as a guess about the value above (plan 30-11, A-8).
            // The third positional is the integrity result, the FOURTH is the commit SHA and the
            // FIFTH is the context root; a caller using an older shape has some other value land
            // here, and the refusal would otherwise read as a claim about a test run that never
            // happened.
            `Argument order: emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot] ` +
            `— the THIRD argument is the test-integrity result, the FOURTH is the commit SHA the ` +
            `gate run was performed at, and the FIFTH is the context root.`,
        );
        process.exit(1);
      }
      console.log(`verdict emitted: ${noteIdStr} (§14-gate#${id}).`);
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
        "usage: context-io.js <validate <noteFile> | admit <task> <noteFile> | emit-verdict <task> <id> <clean|finding|unknown> <sha> [contextRoot] | render <task> [contextRoot]>",
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(`context-io: ${(e as Error).message}`);
    process.exit(1);
  }
}
