// note.ts — the host note writer (phase 41, plan 41-07, RUN-02, RUN-05, D-28, D-35).
//
// WHAT IT IS. A kit-shipped runnable in the shape of claim.ts: authored here, compiled to a committed note.js, installed
// to tools/grugops/note.js and run on a host with only Node present. `claim.js done` passes only on a sealed note, and a
// spawned role has no other route to the sealed-note writer on a host with no MCP tool, so this program is that route:
//   - `add FOLDER --kind KIND --by ROLE --confidence LEVEL (--body TEXT | --body-file PATH)` writes one sealed note under
//     .grugops/context/FOLDER/notes/ and renders that folder's index.md and index.jsonl (Workflow 16 `## Commit`).
//     `--ref` repeats. `--verified-by`, `--supersedes`, `--sha`, `--gate-run` and `--content-hash` fill the fields of the
//     same name. ROLE is the role file's name without `.md`, never the adapter name `claim.js --by` takes.
// It moves no queue record and runs no git. It writes only under .grugops/context/ and, under
// `context.audit_retention: retained`, to the GOV-02 ledger the embedded admit() appends to. It creates no queue
// directory and reads no queue file.
//
// THE D-12 CONTRACT.
//   exit 0 → the note stands and reads back: stdout holds one line, `noted FOLDER ID`.
//   exit 1 → an outcome to act on, never an error: stdout holds one line, `refused FOLDER: REASON`, and nothing was written.
//            The writer decided this, so the note must change: earn a real stamp, or record an honest `claim`.
//   exit 2 → could not run: a bad argument, a root with no .grugops directory, a symbolic link or a non-directory on the
//            way to notes/, a folder outside the allowlist, a body that is empty or cannot be read. Exit 2 prints nothing
//            on stdout and one `Error: ` line on stderr. An unexpected error is exit 2 too, and never surfaces as Node's own
//            exit 1. That line names a note that stands, so a failed render never denies a note that was written.
//
// THE NOTE CHECK (D-28, D-35). Every note goes through the embedded appendNote, the one writer, which validates the note,
// asks the embedded admit() and seals what it writes. That is the in-script tier Workflow 16 names for a host with no
// hook. It never grants a high-severity admission, and it is the only tier this program holds: the combiner that trusts
// a `human:NAME` stamp is not embedded, because that stamp is checked by a per-call hook no shell tool passes through. No
// flag and no environment variable of this program writes an unsealed note or skips admission. This program adds no
// predicate over what a note may say: kind, stamp and field rules are the authority's, so a value that reaches the
// writer is refused there, with exit 1. The one exception is `--by`, an argv shape check and no severity rule: the
// high-severity classifier reads the role name, so an adapter name would step around it (T-41-30).
//
// THE TIME IS STAMPED HERE. There is no flag for `at`, so this route cannot forge the time `done` compares (T-41-36).
//
// THE ROOT IS A BOUNDARY. The store is the working directory's .grugops/context/, resolved once with realpath. There is
// no root flag: an admission may not point governance at a root the caller chose (the 30-11 rule, T-41-34). The dial comes
// from the embedded trustedRepoRoot(), appendNote's own default, and never from the store. A working directory with no
// .grugops directory is exit 2, so a wrong working directory never makes a stray store. The path to notes/ is asked of
// the embedded rootChainPresence, which lstats each component, so a symbolic link on it is refused by name with nothing
// written, wherever it points (T-41-33).
//
// OUTPUT IS SANITIZED. Every value this program prints has each C0, C1 and DEL code point removed by the embedded
// stripControlChars (V7), and a reason that spans lines is flattened onto one.
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and nothing
// else. The hand-written part below imports them as namespaces, so the names the generated region imports never
// collide with its own.
//
// NOTHING HERE IS RETYPED. The seal, the note grammar, every admission rule, the render and the state paths sit in the
// generated region, copied verbatim from install/state-layout.ts, scripts/state-rules.ts, scripts/checkpoints.ts and
// scripts/context-io.ts by scripts/generate-runnable-embeds.ts. scripts/runnable-embeds-freshness.ts fails CI when the
// region differs from a fresh derivation. The part below holds only argv, the root checks, the exit codes and the
// output lines.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this file writes records a human audits.

import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { createHash, randomUUID } from "node:crypto";
import { type Stats, closeSync, constants as fsConstants, existsSync, fstatSync, linkSync, lstatSync, mkdirSync, openSync, readSync, readdirSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync, writeSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, parse, resolve, sep } from "node:path";
export const RUNNABLE_SET_STAMP = "sha256:aa4d5125a4eae452daa114e07ceae1cb75b4f733e7a1e0d8f5a1dfd260adb9cd";
export const RUNNABLE_SET = Object.freeze(["claim.js", "note.js", "state-check.js", "state-roll.js", "trace-render.js"] as const);
export const RUNNABLE_SELF = "note.js";
// from install/state-layout.ts
export const GRUGOPS_DIR_REL = ".grugops";
export const CONTEXT_REL = `${GRUGOPS_DIR_REL}/context`;
// from scripts/state-rules.ts
export function stripControlChars(text: string, multiLine: boolean): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    if (!control || (multiLine && (c === 0x09 || c === 0x0a))) out += text[i];
  }
  return out;
}
// from scripts/checkpoints.ts
export type Disposition = "block" | "notify" | "off";
export type Checkpoint =
  // ── the floor arm: SAFETY_FLOORS' four ids (D-04) ──────────────────────────────────────────
  | "protected_branch_merge"
  | "production_requires_human_confirmation"
  | "test_integrity"
  | "open_pr"
  // ── the legacy-grade arm: the OTHER half of the retired `autonomy` scalar (D-06) ───────────
  | "commit_to_branch"
  // ── the tag arm: the ids carried by tagged workflow `## Stop conditions` bullets (D-01) ────
  | "proceed_past_blocked_risk"
  | "sign_off_acceptance"
  | "escalate_stale_blocker"
  | "exceed_wip_limit"
  | "decide_accessibility_exception"
  | "exhaust_self_fix_budget"
  | "override_finding_severity"
  // What this id gates, and what each disposition does at the Tech Lead's re-score stop (Workflow 04
  // step 15), is documented once in agent-factory/config/factory.config.md under "What
  // `escalate_unadjudicable_result` gates". This is a pointer; the site list is not restated here.
  | "escalate_unadjudicable_result"
  | "accept_human_only_failure";
export const CHECKPOINT_DEFAULTS = {
  protected_branch_merge: "block",
  production_requires_human_confirmation: "block",
  test_integrity: "block",
  open_pr: "block",
  commit_to_branch: "off",
  proceed_past_blocked_risk: "block",
  sign_off_acceptance: "block",
  escalate_stale_blocker: "block",
  exceed_wip_limit: "block",
  decide_accessibility_exception: "block",
  exhaust_self_fix_budget: "block",
  override_finding_severity: "block",
  escalate_unadjudicable_result: "block",
  accept_human_only_failure: "block",
} as const satisfies Record<Checkpoint, Disposition>;
export const CHECKPOINTS = Object.keys(CHECKPOINT_DEFAULTS) as readonly Checkpoint[];
export const STRICTEST_MATRIX: Readonly<Record<Checkpoint, Disposition>> = Object.freeze(
  Object.fromEntries(CHECKPOINTS.map((id) => [id, "block"])) as Record<Checkpoint, Disposition>,
);
export function canonicalizeDisposition(raw: unknown): Disposition {
  if (raw === "block") return "block";
  if (raw === "notify") return "notify";
  if (raw === "off") return "off";
  return "block";
}
// from scripts/context-io.ts
export const NOTE_KINDS = [
  "claim",
  "finding",
  "decision",
  "failed-attempt",
  "observation",
  "artifact-ref",
] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
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
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");
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
const GATE_IDENTITY = "§14-gate";
const CHECKPOINT_GUARD_IDENTITY = "§checkpoint-guard";
const RESERVED_IDENTITIES = [GATE_IDENTITY, CHECKPOINT_GUARD_IDENTITY] as const;
export type ReservedIdentity = (typeof RESERVED_IDENTITIES)[number];
const GATE_STAMP_RE = /^§14-gate#[A-Za-z0-9._-]+$/;
const HUMAN_STAMP_RE = /^human:[A-Za-z0-9._-]+$/;
export const SHA_HEX_RE = /^[0-9a-f]{7,64}$/;
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
const REFUSE_SELF_LITERALS = ["self", "me", "agent"] as const;
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
export function assertNoteScalar(name: string, value: unknown): asserts value is string {
  if (typeof value !== "string") {
    const shape =
      value === undefined ? "absent (undefined)" : value === null ? "null" : `a ${typeof value}`;
    throw new Error(
      `context-io: field "${name}" is ${shape}, not a string — refusing to compose. A missing or ` +
        `mistyped caller field would otherwise reach the fence as literal text; the writer does not ` +
        `invent a value the caller did not give.`,
    );
  }
  if (/[\r\n]/.test(value)) {
    throw new Error(
      `context-io: field "${name}" must be single-line (no embedded newline): ${JSON.stringify(value)}`,
    );
  }
}
export function assertNoteRefs(refs: unknown): asserts refs is string[] {
  if (!Array.isArray(refs)) {
    const shape = refs === undefined ? "absent (undefined)" : refs === null ? "null" : `a ${typeof refs}`;
    throw new Error(
      `context-io: field "refs" is ${shape}, not a list — refusing to compose. The writer does not ` +
        `invent a value the caller did not give.`,
    );
  }
  for (const r of refs) assertNoteScalar("refs[]", r);
}
function assertHexScalar(name: string, value: string): void {
  if (!SHA_HEX_RE.test(value)) {
    throw new Error(
      `context-io: field "${name}" must be lowercase hex matching ${SHA_HEX_RE} — an abbreviated ` +
        `or full git object id, or a sha256 digest: ${JSON.stringify(value)}`,
    );
  }
}
export function assertNoteFields(note: NoteInput): void {
  const n = note as unknown as Record<string, unknown>;
  assertNoteScalar("kind", note.kind);
  assertNoteScalar("by", note.by);
  assertNoteScalar("at", note.at);
  assertNoteScalar("verified_by", note.verified_by);
  assertNoteScalar("confidence", note.confidence);
  // `null` is the honest "supersedes nothing"; `undefined` is absence and reaches the guard.
  if (note.supersedes !== null) assertNoteScalar("supersedes", note.supersedes);
  assertNoteRefs(note.refs);
  if (n.sha !== undefined) {
    assertNoteScalar("sha", note.sha);
    assertHexScalar("sha", note.sha);
  }
  if (n.gate_run !== undefined) assertNoteScalar("gate_run", note.gate_run);
  if (n.content_hash !== undefined) {
    assertNoteScalar("content_hash", note.content_hash);
    assertHexScalar("content_hash", note.content_hash);
  }
}
const PATH_METACHAR_RE = /[\\/\u0000-\u001F]|\.\./;
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
export function isRecognizedFrontmatterLine(line: string): boolean {
  if (line.trim() === "") return true; // blank
  if (/^refs:\s*$/.test(line)) return true; // refs: block header
  if (/^\s*-\s+/.test(line)) return true; // refs: list item shape
  if (/^([A-Za-z_]+):\s*(.*)$/.test(line)) return true; // column-0 key: value scalar
  return false;
}
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
  // OWN sanctioned emitter — emitVerdict() for `§14-gate` (D-04), which names itself here;
  // `§checkpoint-guard` has no sanctioned emitter since 33.1 D-26. The comparison is against the
  // claimed identity, not against a boolean, so one emitter's carve-out never covers another name.
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
  // round 2, finding `RA2-2`). A reserved emitter authors a `finding` that carries no `verified_by`
  // of its own, and the reason is a property of the identity: **a root of trust stamps nothing above
  // itself, because nothing verifies it.** Since 33.1 D-26 the only emitter that reaches this
  // suppression is emitVerdict() for `§14-gate`; the checkpoint-note writer that also reached it was
  // deleted with the retired Bash command guard.
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
export function publishNoteExclusive(tmpPath: string, finalPath: string): void {
  const removeTemp = (): void => {
    try {
      unlinkSync(tmpPath);
    } catch {
      /* best-effort: a leftover temp is not a note */
    }
  };
  try {
    linkSync(tmpPath, finalPath);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code ?? "UNKNOWN";
    if (code !== "EEXIST") {
      removeTemp();
      throw new Error(
        `context-io.publishNoteExclusive: refusing to publish (${code}) — the exclusive link to ` +
          `"${finalPath}" failed for a reason other than an existing occupant. No replacing rename ` +
          `is attempted in its place, because a rename would overwrite whatever is there; a ` +
          `filesystem without hard links therefore refuses note writes. Nothing was published. ` +
          `Underlying reason: ${(e as Error).message}`,
      );
    }
    // Something occupies the final path. Decide it by its bytes, through the one bounded reader.
    let occupant: string | null;
    let candidate: string | null;
    try {
      occupant = readRegularFileOrNull(finalPath, NOTE_FILE_MAX_BYTES, "note destination");
      candidate = readRegularFileOrNull(tmpPath, NOTE_FILE_MAX_BYTES, "note temp file");
    } catch (readError) {
      removeTemp();
      throw new Error(
        `context-io.publishNoteExclusive: refusing to publish — "${finalPath}" is occupied and the ` +
          `occupant could not be compared, so it is left untouched and nothing was published. ` +
          `Underlying reason: ${(readError as Error).message}`,
      );
    }
    removeTemp();
    if (occupant !== null && candidate !== null && occupant === candidate) return; // idempotent
    throw new Error(
      `context-io.publishNoteExclusive: refusing to publish — ` +
        (occupant === null
          ? `"${finalPath}" was occupied when the link was made and is gone now; the note is not ` +
            `published over a path whose state changed under it. `
          : `"${finalPath}" already holds a DIFFERENT note, which appeared after the destination ` +
            `was decided. The shared verified context is APPEND-ONLY (SCTX-04); the occupant is ` +
            `untouched. `) +
        `Nothing was published.`,
    );
  }
  removeTemp();
}
export const CANONICAL_READ_POSITION = "absent, or a regular file";
export const NOTE_PATH_NOT_REGULAR_FILE_CLAUSE = "note-path-not-a-regular-file";
export const NOTE_ABOVE_CEILING_CLAUSE = "note-above-size-ceiling";
export const LEDGER_ABOVE_CEILING_CLAUSE = "audit-ledger-above-size-ceiling";
export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"] as const;
export type ReadPositionCondition = (typeof READ_POSITION_CONDITIONS)[number];
export class ReadPositionRefusal extends Error {
  readonly condition: ReadPositionCondition;
  constructor(condition: ReadPositionCondition, message: string) {
    super(message);
    this.name = "ReadPositionRefusal";
    this.condition = condition;
  }
}
export const UNRECORDABLE_ADMISSION_REFUSAL =
  "An admission the audit trail cannot record is refused rather than granted unrecorded.";
function appendRegularFileLine(
  path: string,
  line: string,
  position: string,
  maxBytes: number,
): void {
  let present: ReturnType<typeof statSync> | undefined;
  try {
    present = statSync(path, { throwIfNoEntry: false });
  } catch {
    present = undefined; // unclassifiable here — the open below is asked, and its arm answers
  }
  // ONE SENTENCE FOR THE ONE ARM, whichever of its two sites throws it: the type classification
  // here, or the post-open fstat guard below on a position that changed type between the two calls.
  const notRegularFile = (): ReadPositionRefusal =>
    new ReadPositionRefusal(
      "not-a-regular-file",
      `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
        `waited on, because writing to a FIFO or a device can block forever and a program that ` +
        `never answers records nothing. The canonical form for this position is ` +
        `${CANONICAL_READ_POSITION}.`,
    );
  if (present !== undefined && !present.isFile()) throw notRegularFile();
  let fd: number;
  try {
    fd = openSync(
      path,
      fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_CREAT | fsConstants.O_NONBLOCK,
      0o600,
    );
  } catch (e) {
    throw new ReadPositionRefusal(
      "unopenable",
      `context-io: the ${position} "${path}" could not be opened for append ` +
        `(${(e as NodeJS.ErrnoException).code ?? "unknown"}) — it is refused rather than waited on. ` +
        `The canonical form for this position is ${CANONICAL_READ_POSITION}.`,
    );
  }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) throw notRegularFile();
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
      throw new ReadPositionRefusal(
        "above-ceiling",
        `context-io: appending ${Buffer.byteLength(line, "utf8")} bytes to the ${position} ` +
          `"${path}" would carry it to ${wouldBe} bytes, above the ${maxBytes}-byte ceiling — ` +
          `refused rather than appended, because a trail grown past what its own readers will read ` +
          `is a trail nobody can audit. Nothing was appended.`,
      );
    }
    writeSync(fd, line, null, "utf8");
  } finally {
    closeSync(fd);
  }
}
export function readRegularFileOrNull(
  path: string,
  maxBytes: number,
  position: string,
): string | null {
  let fd: number;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    // ENOENT from open(2) is null. It does NOT prove that nothing is there: open(2) follows a link
    // and reports a dangling link's missing TARGET as ENOENT too, so this reader cannot tell a
    // missing path from a dangling link (plan 37-30, D-18). A caller that needs the absence answer
    // asks entryPresence first, and treats a null from here after a "present" answer as a path that
    // vanished, never as absence.
    if (code === "ENOENT") return null;
    // Any other open failure — EACCES, ELOOP, ENXIO (a socket) — means the path is present and
    // unopenable. Fail closed, naming the position rather than surfacing a bare errno the caller
    // cannot place.
    throw new ReadPositionRefusal(
      "unopenable",
      `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
        `— it is refused rather than read. The canonical form for this position is ` +
        `${CANONICAL_READ_POSITION}.`,
    );
  }
  try {
    const st = fstatSync(fd);
    // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
    // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
    // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
    // now carries the condition it actually met, and each caller names its own clause from it.
    if (!st.isFile()) {
      throw new ReadPositionRefusal(
        "not-a-regular-file",
        `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
          `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
          `program that never answers refuses nothing. The canonical form for this position is ` +
          `${CANONICAL_READ_POSITION}.`,
      );
    }
    if (st.size > maxBytes) {
      throw new ReadPositionRefusal(
        "above-ceiling",
        `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
          `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
          `size and nothing else.`,
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
function writeNoteFile(notesDir: string, id: string, text: string): void {
  const { finalPath, resolvedFinal, existing } = decideNoteDestination(notesDir, id, text);
  if (existing !== null) {
    if (existing === text) return; // the decided idempotent case: nothing to write, nothing to lose
    throw differingOccupantRefusal(id, resolvedFinal);
  }
  mkdirSync(notesDir, { recursive: true });
  // The temp is created EXCLUSIVELY (`wx`, O_CREAT|O_EXCL) at a name carrying a random UUID, so it
  // can neither replace nor open anything already there, including a planted FIFO.
  const tmpPath = `${finalPath}.tmp-${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  try {
    writeFileSync(tmpPath, text, { encoding: "utf8", flag: "wx" });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") {
      try {
        unlinkSync(tmpPath);
      } catch {
        /* best-effort: a partial temp is not a note */
      }
    }
    throw e;
  }
  publishNoteExclusive(tmpPath, finalPath);
}
function differingOccupantSentence(id: string, resolvedFinal: string): string {
  return (
    `the destination already holds a DIFFERENT note under id "${id}". The shared verified context ` +
    `is APPEND-ONLY (SCTX-04): a supersession is a NEW note carrying a supersedes: field, never a ` +
    `rewrite of an existing one. No file was written, and the note already at "${resolvedFinal}" ` +
    `is untouched (CR-11).`
  );
}
function differingOccupantRefusal(id: string, resolvedFinal: string): Error {
  return new Error(
    `context-io.writeNoteFile: refusing to write — ${differingOccupantSentence(id, resolvedFinal)}`,
  );
}
function decideNoteDestination(
  notesDir: string,
  id: string,
  text: string,
  who: "writeNoteFile" | "appendNote" = "writeNoteFile",
): { finalPath: string; resolvedFinal: string; existing: string | null } {
  const finalPath = join(notesDir, `${id}.md`);
  const resolvedDir = resolve(notesDir);
  const resolvedFinal = resolve(finalPath);
  // Strict containment: the resolved final path must begin with the resolved notes dir + separator.
  // (Equality is NOT allowed — the final path is always a file strictly inside the dir.)
  if (!resolvedFinal.startsWith(resolvedDir + sep)) {
    throw new Error(
      `context-io.${who}: refusing to write — note id "${id}" resolves OUTSIDE the task ` +
        `notes directory (path containment violated: "${resolvedFinal}" is not strictly inside ` +
        `"${resolvedDir}"). No file was written. This is a path-traversal attempt (GAP-R6-1).`,
    );
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
  // written" follows from the order of the code rather than from cleanup — and this check is not a
  // check-then-act: the size is a property of the bytes in hand, which nothing on disk can change
  // between the check and the write. The read side KEEPS its own refusal —
  // it must, because it reads files this module did not write — and both sides read the ONE
  // exported `NOTE_FILE_MAX_BYTES`, so they cannot disagree by a byte.
  //
  // The check sits AFTER path containment deliberately: a traversal-bearing id is a security fault
  // about WHERE, and it stays the first thing this chokepoint answers.
  const candidateBytes = Buffer.byteLength(text, "utf8");
  if (candidateBytes > NOTE_FILE_MAX_BYTES) {
    throw new Error(
      `context-io.${who}: refusing to write (${NOTE_ABOVE_CEILING_CLAUSE}) — the composed ` +
        `note under id "${id}" is ${candidateBytes} bytes, above the ${NOTE_FILE_MAX_BYTES}-byte ` +
        `ceiling every reader of this store enforces. Writing it would create a note this module's ` +
        `own readers are required to refuse, which is silent loss rather than storage. No file was ` +
        `written and no directory was created.`,
    );
  }
  let existing: string | null;
  try {
    existing = readRegularFileOrNull(resolvedFinal, NOTE_FILE_MAX_BYTES, "note destination");
  } catch (e) {
    // THE CLAUSE NAMES THE CONDITION THAT IS TRUE (31-29, CR-19). An over-ceiling REGULAR file gets
    // the ceiling clause; every non-canonical SHAPE keeps the shape clause. Reported through the
    // authority's own discriminant rather than by matching its message text.
    const aboveCeiling =
      e instanceof ReadPositionRefusal && e.condition === "above-ceiling";
    throw new Error(
      aboveCeiling
        ? `context-io.${who}: refusing to write (${NOTE_ABOVE_CEILING_CLAUSE}) — the note ` +
            `destination "${resolvedFinal}" IS a regular file, and it is above the ` +
            `${NOTE_FILE_MAX_BYTES}-byte ceiling, so this write can neither read it to compare nor ` +
            `replace it. No file was written. Underlying reason: ${(e as Error).message}`
        : `context-io.${who}: refusing to write (${NOTE_PATH_NOT_REGULAR_FILE_CLAUSE}) — the ` +
            `note destination "${resolvedFinal}" is not ${CANONICAL_READ_POSITION}, so it is REFUSED ` +
            `rather than waited on and rather than replaced. No file was written. Underlying reason: ` +
            `${(e as Error).message}`,
    );
  }
  return { finalPath, resolvedFinal, existing };
}
export const NOTE_SEAL_KEY = "seal";
const NOTE_SEAL_DOMAIN = "grugops-note-seal-v1";
export const NOTE_SEAL_RE = /^sha256:[0-9a-f]{64}$/;
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
export function noteSeal(unsealedText: string): string {
  const h = createHash("sha256");
  h.update(NOTE_SEAL_DOMAIN, "utf8");
  h.update(Buffer.from([0]));
  h.update(normalizeLineEndings(unsealedText), "utf8");
  return `sha256:${h.digest("hex")}`;
}
export type SealVerdict = { ok: true } | { ok: false; reason: "absent" | "malformed" | "mismatch" };
export function sealVerdict(text: string): SealVerdict {
  const normalized = normalizeLineEndings(text);
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { ok: false, reason: "absent" };
  const fmLines = m[1].split("\n");
  // A column-0 `<key>:` line. Spelled from the key and a character test rather than from a literal
  // or a template, so the S5 derivation (which counts every spelling of the seal key's line shape)
  // sees ONE emitter in this module and this reader is not it.
  const isSealLine = (line: string): boolean =>
    line.startsWith(NOTE_SEAL_KEY) && line.charAt(NOTE_SEAL_KEY.length) === ":";
  const sealIndexes: number[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    if (isSealLine(fmLines[i])) sealIndexes.push(i);
  }
  if (sealIndexes.length === 0) return { ok: false, reason: "absent" };
  if (sealIndexes.length > 1) return { ok: false, reason: "malformed" };
  const at = sealIndexes[0];
  if (at !== fmLines.length - 1) return { ok: false, reason: "malformed" };
  const sealLine = fmLines[at];
  const value = sealLine.slice(NOTE_SEAL_KEY.length + 1).trim();
  if (!NOTE_SEAL_RE.test(value)) return { ok: false, reason: "malformed" };
  // Strip the seal line by position: the fence body `m[1]` begins at offset 4 (after `---\n`), and
  // the seal line is its last line, followed by `\n---`. Removing `<line>\n` there yields exactly the
  // text `composeNote` sealed.
  const start = 4 + (m[1].length - sealLine.length);
  const unsealed = normalized.slice(0, start) + normalized.slice(start + sealLine.length + 1);
  return noteSeal(unsealed) === value ? { ok: true } : { ok: false, reason: "mismatch" };
}
function composeNote(note: NoteInput, body: string, id: string): string {
  // THE POINT OF EFFECT (plan 33-26): whatever route reaches this composer, the fields it is about
  // to interpolate have passed the one guard. Callers ask it earlier too (ahead of `noteId`), so
  // this call is the floor, not the only place — a caller added later cannot compose unguarded.
  assertNoteFields(note);
  const refsBlock =
    note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
  const fence =
    `id: ${id}\n` +
    `kind: ${note.kind}\n` +
    `by: ${note.by}\n` +
    `at: ${note.at}\n` +
    `verified_by: ${note.verified_by}\n` +
    `confidence: ${note.confidence}\n` +
    provenanceBlock(note) +
    refsBlock +
    `supersedes: ${note.supersedes ?? ""}\n`;
  const rest = "---\n\n" + (body.endsWith("\n") ? body : body + "\n");
  const unsealed = "---\n" + fence + rest;
  return "---\n" + fence + `${NOTE_SEAL_KEY}: ${noteSeal(unsealed)}\n` + rest;
}
function provenanceBlock(note: NoteInput): string {
  const line = (key: string, value: string | undefined): string =>
    value !== undefined && value !== "" ? `${key}: ${value}\n` : "";
  return (
    line("sha", note.sha) + line("gate_run", note.gate_run) + line("content_hash", note.content_hash)
  );
}
export function noteId(note: NoteInput): string {
  const atCompact = note.at.replace(/[-:]/g, "").replace(/\.\d+/, ""); // 2026-06-17T14:23:05Z → 20260617T142305Z
  const nonce = randomUUID().slice(0, 8); // node:crypto — lock-free same-millisecond uniqueness
  return `${atCompact}-${note.by}-${note.kind}-${nonce}`;
}
function composeValidatedNote(
  task: string,
  note: NoteInput,
  body: string,
  precomputedId?: string,
): { id: string; text: string } {
  assertSafeTask(task);
  // Field guard (CR-01 single-line + 33-26 string-type): every interpolated field, in the one list
  // `assertNoteFields` spells, BEFORE `noteId` reads `note.at` — so an absent field is a refusal
  // that names it, and nothing is composed.
  assertNoteFields(note);
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
  assertNoteScalar("id", id);
  const text = composeNote(note, body, id);
  const findings = validate(text);
  if (findings.length > 0) {
    throw new Error(`context-io.appendNote: refusing to write an invalid note:\n${findings.join("\n")}`);
  }
  return { id, text };
}
export function appendNote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  precomputedId?: string,
  // TEST SEAM (31-09, review finding WR-10). Production callers pass NOTHING: the governance root is
  // the ONE trusted answer — the same reader `hooks/admission-guard.ts`,
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
  // asks (WR-10) — the same reader `hooks/admission-guard.ts`,
  // `scripts/admission-server.ts` and the CLI `admit` verb consult. It is still a TEST SEAM
  // (31-09, WR-10): production callers pass NOTHING. A caller-chosen default of `ROOT` meant the
  // hook refused on the host repository's dial while this writer consulted the kit's, which under
  // the shipped shared-install model (`~/.grugops` kit + per-repo state) are different directories.
  repoRoot: string = trustedRepoRoot(),
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
  ledgerOwner: ActionOwner = actionOwnerRoot(contextRoot),
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
  // WHY IT SITS EXACTLY HERE. After compose and validate, and BEFORE writeNoteFile. A refusal then
  // writes nothing by the order of the code rather than by cleanup: no file has been opened when the
  // refusal is decided. It is also why the call cannot be moved lower for convenience. (That is a
  // statement about the authority's refusals, which read no destination. What occupies the note path
  // is a separate, filesystem question, decided below and again at the exclusive publish.)
  //
  // RECURSION, CHECKED NOT ASSUMED (plan 31-09 assumption A1, RE-MEASURED on this tree rather than
  // inherited from 31-05, because `admit()` has changed since): `admit()` calls no note writer —
  // 0 occurrences of appendNote/appendPreAdmittedNote/emitTrusted/writeNoteFile/emitVerdict/
  // admitAndAppend in its body — so this call cannot re-enter.
  //
  // A GOV-02 LEDGER THAT CANNOT BE WRITTEN REFUSES THE WRITE (31-21, CR-12's class at the write
  // side). `admit()` appends the ledger event under `audit_retention: retained` and the append was
  // MEASURED wedging on a FIFO ledger at exit 124; it is now bounded and THROWS instead. The throw is
  // caught HERE rather than inside `admit()` on purpose: `admit()` decides whether a note is
  // ADMISSIBLE, and "can this admission be recorded" is a different question — putting it inside the
  // authority would conflate a decision about the note with a fact about the filesystem, and would
  // add a refusal family to an authority whose families are all about the note. The WRITER owns it,
  // fails CLOSED, and nothing is written: this call sits before the chokepoint.
  // ── OCCUPANCY IS DECIDED BEFORE `admit()` CAN RECORD ANYTHING (33-38, WR-01's third arm). ────
  // `admit()` appends the GOV-02 event under `audit_retention: retained`, and it runs BEFORE the
  // write, so an occupied id — reachable outright here, because `precomputedId` is the caller's —
  // used to leave a ledger line for a note the chokepoint then refused. The ONE destination decision
  // is asked first: a differing occupant raises the chokepoint's own append-only refusal, and that
  // function's other refusals (containment, a FIFO at the path) are raised here too. Identical bytes
  // fall through, exactly as the chokepoint decides them.
  //
  // This is a check-then-act (33.1-12, WR-02): an occupant created after this read and before the
  // publish is refused by the exclusive publish and never overwritten, but after `admit()` has
  // recorded the admission, so a lost race over-records the ledger by one line — the accepted
  // residual of the ledger-first ordering (31-21).
  //
  // IN-01 (33.1-12): every refusal of this pre-check names THIS function, because the decision is
  // asked under the name of the function the caller called; it used to name the chokepoint, which
  // had not run.
  const destination = decideNoteDestination(join(contextRoot, task, "notes"), id, text, "appendNote");
  if (destination.existing !== null && destination.existing !== text) {
    throw new Error(
      `context-io.appendNote: refusing to write — ` +
        `${differingOccupantSentence(id, destination.resolvedFinal)}`,
    );
  }
  let admission: string[];
  try {
    // `destination.existing` is non-null here only for IDENTICAL bytes (a differing occupant was
    // refused above), which is the one case whose admission may already be recorded (WR-01).
    admission = admit(task, text, contextRoot, repoRoot, ledgerOwner, destination.existing !== null);
  } catch (e) {
    throw new Error(
      `context-io.appendNote: refusing to write — the admission could not be decided or could not ` +
        `be recorded. ${UNRECORDABLE_ADMISSION_REFUSAL} Nothing was written. Underlying reason: ` +
        `${(e as Error).message}`,
    );
  }
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
interface RawNote {
  /** The note's identity, decided by the ONE rule below. */
  readonly id: string;
  /** The file's bytes, exactly as stored. */
  readonly text: string;
  /** The canonical parse of those bytes. */
  readonly parsed: ParsedFrontmatter;
}
export const NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished", "unsealed"] as const;
export type NoteSkipArm = (typeof NOTE_SKIP_ARMS)[number];
export interface SkippedNoteEntry {
  readonly file: string;
  readonly arm: NoteSkipArm;
  /** The underlying reason, for the arm that has one. Empty for the arms that do not. */
  readonly detail: string;
}
interface RawNoteRead {
  readonly notes: RawNote[];
  readonly skipped: SkippedNoteEntry[];
}
export type EntryPresence =
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly code: string; readonly reason: string; readonly link: boolean }
  | { readonly kind: "present"; readonly entry: Stats; readonly target: Stats; readonly real: string };
function presenceCode(e: unknown): string {
  const code = (e as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" && code !== "" ? code : "unknown";
}
export function entryPresence(path: string): EntryPresence {
  const full = resolve(path);
  const top = parse(full).root;
  // Every prefix from the filesystem root to the path itself, so one lstat, one stat and one realpath answer for
  // every component.
  const prefixes: string[] = [top];
  for (const name of full.slice(top.length).split(sep)) {
    if (name !== "") prefixes.push(join(prefixes[prefixes.length - 1] as string, name));
  }
  for (let i = 0; ; i += 1) {
    const at = prefixes[i] as string;
    const last = i === prefixes.length - 1;
    let entry: Stats;
    try {
      entry = lstatSync(at);
    } catch (e) {
      const code = presenceCode(e);
      if (code === "ENOENT") return { kind: "absent" };
      return { kind: "unreadable", code, reason: `"${at}" cannot be inspected (${code})`, link: false };
    }
    // A link is followed with a stat. The last component is stat'ed whatever it is, so `target` is always what the
    // path names, and the one stat site is reached under every caller.
    let target = entry;
    if (entry.isSymbolicLink() || last) {
      try {
        target = statSync(at);
      } catch (e) {
        const code = presenceCode(e);
        return {
          kind: "unreadable",
          code,
          reason: !entry.isSymbolicLink()
            ? `"${at}" cannot be inspected (${code})`
            : last
              ? `it is a symbolic link whose target cannot be reached (${code})`
              : `a symbolic link on the path has a target that cannot be reached: "${at}" (${code})`,
          // The path's own lstat showed a link only when this is the last component and it is one (IN-11).
          link: last && entry.isSymbolicLink(),
        };
      }
    }
    if (!last) {
      if (!target.isDirectory()) {
        return { kind: "unreadable", code: "ENOTDIR", reason: `"${at}" on the path is not a directory (ENOTDIR)`, link: false };
      }
      continue;
    }
    let real: string;
    try {
      real = realpathSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return { kind: "unreadable", code, reason: `"${at}" cannot be resolved (${code})`, link: entry.isSymbolicLink() };
    }
    return { kind: "present", entry, target, real };
  }
}
export function isWithin(real: string, boundary: string): boolean {
  const prefix = boundary.endsWith(sep) ? boundary : `${boundary}${sep}`;
  return real === boundary || real.startsWith(prefix);
}
export const ROOT_CHAIN_LINK_REFUSAL =
  "is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path";
export function rootChainOf(rel: string): string[] {
  const refuse = (why: string): never => {
    throw new Error(`context-io: the state path ${JSON.stringify(rel)} is not a repository-relative path: ${why}`);
  };
  if (rel === "") refuse("it is empty");
  if (rel.includes("\\")) refuse("it holds a backslash");
  if (rel.startsWith("/")) refuse("it has a leading slash");
  if (rel.endsWith("/")) refuse("it has a trailing slash");
  const segments = rel.split("/");
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === "") refuse("it has an empty segment");
    if (segment === "." || segment === "..") refuse(`it has a ${JSON.stringify(segment)} segment`);
    out.push(out.length === 0 ? segment : `${out[out.length - 1] as string}/${segment}`);
  }
  return out;
}
export type RootChainPresence =
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly code: string; readonly reason: string }
  | { readonly kind: "link"; readonly rel: string; readonly reason: string }
  | { readonly kind: "outside"; readonly real: string }
  | { readonly kind: "present"; readonly entry: Stats; readonly target: Stats; readonly real: string };
export function rootChainPresence(realRoot: string, rel: string, leaf: "directory" | "entry"): RootChainPresence {
  const chain = rootChainOf(rel);
  for (let i = 0; ; i += 1) {
    const prefix = chain[i] as string;
    const at = join(realRoot, ...prefix.split("/"));
    const last = i === chain.length - 1;
    let entry: Stats;
    try {
      entry = lstatSync(at);
    } catch (e) {
      const code = presenceCode(e);
      if (code === "ENOENT") return { kind: "absent" };
      return { kind: "unreadable", code, reason: `"${prefix}" cannot be inspected (${code})` };
    }
    if (entry.isSymbolicLink() && (!last || leaf === "directory")) {
      return { kind: "link", rel: prefix, reason: `${prefix} ${ROOT_CHAIN_LINK_REFUSAL}` };
    }
    if (!last) {
      if (!entry.isDirectory()) {
        return { kind: "unreadable", code: "ENOTDIR", reason: `"${prefix}" on the path is not a directory (ENOTDIR)` };
      }
      continue;
    }
    let target: Stats;
    try {
      target = statSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return {
        kind: "unreadable",
        code,
        reason: entry.isSymbolicLink()
          ? `it is a symbolic link whose target cannot be reached (${code})`
          : `"${prefix}" cannot be inspected (${code})`,
      };
    }
    let real: string;
    try {
      real = realpathSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return { kind: "unreadable", code, reason: `"${prefix}" cannot be resolved (${code})` };
    }
    if (!isWithin(real, realRoot)) return { kind: "outside", real };
    return { kind: "present", entry, target, real };
  }
}
function codedError(message: string, code: string): Error {
  const err = new Error(message) as NodeJS.ErrnoException;
  err.code = code;
  return err;
}
function readRawNotesWithSkips(task: string, contextRoot: string, boundary: string | null = null): RawNoteRead {
  assertSafeTask(task);
  const notesDir = join(contextRoot, task, "notes");
  // ONLY AN LSTAT ENOENT IS ABSENCE (plan 37-28, D-18, CR-03, IN-06). The question is entryPresence's, the one
  // owner: a missing notes directory is a task with no notes, and anything else that stops the read throws and
  // reaches the trace model as a failed task. The stat this replaced (plan 37-21) answered undefined for ENOTDIR
  // and for a dangling link as well as for ENOENT, so its premise ("a missing path only") was false (IN-06), and a
  // dangling `notes` link read as a task with no notes (CR-03).
  const presence = entryPresence(notesDir);
  if (presence.kind === "absent") return { notes: [], skipped: [] };
  if (presence.kind === "unreadable") {
    throw codedError(`context-io: the notes directory "${notesDir}" could not be read: ${presence.reason}`, presence.code);
  }
  if (!presence.target.isDirectory()) {
    throw codedError(`context-io: the notes directory "${notesDir}" is not a directory (ENOTDIR)`, "ENOTDIR");
  }
  if (boundary !== null && !isWithin(presence.real, boundary)) {
    // Plan 37-38 (D-20): the refusal names the notes directory, as every other refusal of this walk does; until then
    // it said only "its notes directory", so a reader saw the task and not the position (the READ-1 shape table's
    // outside-link cells found it).
    throw new Error(`context-io: the notes directory "${notesDir}" resolves outside the repository root, so it was not read`);
  }
  const skipped: SkippedNoteEntry[] = [];
  const out: RawNote[] = [];
  for (const file of readdirSync(notesDir)) {
    if (!file.endsWith(".md")) continue;
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
    let text: string;
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
    } catch (e) {
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
      const arm: NoteSkipArm =
        e instanceof ReadPositionRefusal ? (e.condition as NoteSkipArm) : "unopenable";
      skipped.push({ file, arm, detail: (e as Error).message });
      continue;
    }
    const parsed = parseNote(text);
    if (!parsed) {
      // A file that is never a note — an editor backup, a stray `.md`. One malformed file must not
      // make a whole task's context unreadable, so it is skipped rather than thrown on.
      skipped.push({ file, arm: "unparseable", detail: "" });
      continue;
    }
    // THE SEAL IS ASKED HERE, IN THE ONE WALK, AND ONLY HERE (plan 33-25, KIT (b)). A note the
    // sanctioned writer did not compose — a hand-written note, a pre-seal note, an edited note — is
    // refused by name and counted under `unsealed`, with the predicate's own word as the detail. The
    // disposition is SKIP like the other arms: one planted file must not make a whole task's context
    // unreadable, and the write side stays loud. Measured on the held round-1 capture before this
    // change: nine `Write`-tool notes read as nine records; after it, nine `unsealed`/`absent` rows.
    const seal = sealVerdict(text);
    if (!seal.ok) {
      skipped.push({ file, arm: "unsealed", detail: seal.reason });
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
function readRawNotes(task: string, contextRoot: string): RawNote[] {
  return readRawNotesWithSkips(task, contextRoot).notes;
}
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
export function readContext(task: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): NoteRecord[] {
  return readRawNotes(task, contextRoot).map((raw) => recordFromParsed(raw.parsed, raw.id));
}
export function currentState(notes: NoteRecord[]): NoteRecord[] {
  const ordered = [...notes].sort((a, b) =>
    a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id),
  );
  const superseded = new Set(
    ordered.map((n) => n.supersedes).filter((x): x is string => x !== null && x !== ""),
  );
  return ordered.filter((n) => !superseded.has(n.id));
}
export type ActionOwner =
  | { readonly answered: true; readonly root: string }
  | { readonly answered: false; readonly store: string };
function answeredOwner(root: string): ActionOwner {
  return { answered: true, root };
}
export function actionOwnerRoot(contextRoot: string): ActionOwner {
  const root = governanceRootOf(contextRoot);
  if (root === null) return { answered: false, store: contextRoot };
  return { answered: true, root };
}
export const UNNAMEABLE_OWNER_CLAUSE = "destination-outside-governed-store";
export function unnameableOwnerRefusal(store: string): string {
  return (
    `admission REFUSED (${UNNAMEABLE_OWNER_CLAUSE}): the context store "${resolve(store)}" does ` +
    `not resolve to a governed store, so the repository whose audit trail would record this ` +
    `admission cannot be named. No note was written. ` +
    PROMOTE_ADMITTED_DECLINES[UNNAMEABLE_OWNER_CLAUSE]
  );
}
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
    "The named origin does not resolve inside the ONE location shape this module has independent " +
    "reason to trust: a directory named `context` inside a directory named `.grugops`, sitting " +
    "directly under a directory this module's own root walk independently answers as a governance " +
    "root. The proof's left operand is the origin's stored bytes, so an ordinary directory a caller " +
    "authored and named would let that caller supply the very bytes its own write is judged " +
    "against: a flag wearing a filesystem path. Proximity to the root the CALLER is already running " +
    "inside is not evidence — the agent that promotes runs inside the repository, so every " +
    "directory it can create would satisfy such a rule, which is why the shape must be anchored to " +
    "a root this module resolves for itself rather than to one the caller happens to stand in.",
  "destination-id-occupied":
    "The destination already holds a DIFFERENT note under this id. The shared verified context is " +
    "APPEND-ONLY: a supersession is a NEW note, never a rewrite of an existing one, and a promotion " +
    "that replaced a note would delete admitted evidence from the permanent audit trail rather " +
    "than supersede it. Destination bytes IDENTICAL to the proven origin bytes are a different " +
    "case and are decided as an idempotent re-promotion that proceeds — a re-run compaction has " +
    "nothing to destroy — so this clause names only the destructive one.",
  [UNNAMEABLE_OWNER_CLAUSE]:
    "The destination does not resolve to a store this module recognises as belonging to a " +
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
  "unreadable-audit-ledger":
    "The destination repository's GOV-02 audit ledger IS present and could not be read — it is not " +
    "a regular file, or it could not be opened at all. An audit trail this route cannot read is an " +
    "audit trail it cannot avoid duplicating: the route's response to \"no record\" is to APPEND, so " +
    "answering \"no record\" for a ledger nobody could read would manufacture a second event keyed " +
    "on one id — the duplicate 31-09 collapsed and the reason D-19 (4) appends nothing when the id " +
    "is already there. Absent and unreadable are different facts with different safe answers: an " +
    "absent ledger honestly records nothing, while an unknowable one is refused rather than guessed " +
    "about. The refusal is decided BEFORE the note is written, and the position is named.",
});
function isRecognisedContextStore(candidate: string): boolean {
  const resolved = resolve(candidate);
  return basename(resolved) === "context" && basename(dirname(resolved)) === ".grugops";
}
export function governanceRootOf(storePath: string): string | null {
  // The emptiness guard is a NAMING precondition, not a third authority on trust: `resolve("")`
  // answers the process's working directory, so an empty path would be judged against wherever the
  // process happens to stand. It names nothing.
  if (storePath.trim() === "") return null;
  if (!isRecognisedContextStore(storePath)) return null;
  const anchor = dirname(dirname(resolve(storePath)));
  return projectRootFromWorkingDirectory(anchor) === anchor ? anchor : null;
}
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
const HIGH_SEVERITY_ROLES = ["security-nfr", "architect-design", "release-manager"] as const;
const AUDIT_LEDGER_RELPATH = [".grugops", "audit", "admissions.jsonl"] as const;
export const AUDIT_LEDGER_MAX_BYTES = 64 * 1024 * 1024;
export function admit(
  task: string,
  text: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  repoRoot: string = ROOT,
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
  ledgerOwner: ActionOwner = answeredOwner(repoRoot),
  // ── THE CALLER'S DESTINATION ALREADY HOLDS EXACTLY THIS NOTE (33.1-12, WR-01 / D-19 (4)). ──────
  // `true` only from a writer whose ONE destination decision found identical bytes at the id path.
  // It changes nothing above the retention guard: every refusal family still runs. At the append it
  // asks the ledger first, and a line already keyed by this id is not appended a second time. The
  // default keeps every existing caller byte-behaviour-unchanged.
  stored: boolean = false,
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
    // WR-01 (33.1-12) / D-19 (4): a note already stored under this id whose admission the ledger
    // already records is not recorded twice; an unreadable ledger throws, and the writer refuses.
    if (!(stored && storedNoteAlreadyRecorded(ledgerOwner.root, scalars.id ?? ""))) {
      appendAuditLedger(ledgerOwner.root, scalars, isHighSeverity, vb);
    }
  }
  return [];
}
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
    appendRegularFileLine(
      ledgerPath,
      JSON.stringify(reBound ? { ...event, re_bound: true } : event) + "\n",
      "GOV-02 audit ledger",
      AUDIT_LEDGER_MAX_BYTES,
    );
  } catch (e) {
    if (e instanceof ReadPositionRefusal && e.condition === "above-ceiling") {
      throw new Error(
        `context-io.appendAuditLedger: refusing to append (${LEDGER_ABOVE_CEILING_CLAUSE}) — the ` +
          `GOV-02 audit ledger at "${ledgerPath}" is at or above the ${AUDIT_LEDGER_MAX_BYTES}-byte ` +
          `ceiling every reader of it enforces, so a further line would grow a trail nobody can ` +
          `read. Nothing was appended. Underlying reason: ${(e as Error).message}`,
      );
    }
    throw e;
  }
}
function ledgerRecordsId(repoRoot: string, id: string): boolean {
  const ledgerPath = join(repoRoot, AUDIT_LEDGER_RELPATH[0], AUDIT_LEDGER_RELPATH[1], AUDIT_LEDGER_RELPATH[2]);
  // `null` is the ONLY absence: the ledger is genuinely not there, which records nothing about this
  // id. Every other shape throws, in bounded time, and the caller declines on it.
  const raw = readRegularFileOrNull(ledgerPath, AUDIT_LEDGER_MAX_BYTES, "GOV-02 audit ledger");
  if (raw === null) return false;
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
function unreadableLedgerLookSentence(id: string, e: unknown): string {
  return (
    `the GOV-02 audit ledger look for id "${id}" failed (unreadable-audit-ledger), so this route ` +
    `cannot tell whether the admission of the note already stored under that id is recorded. A ` +
    `ledger that is present and cannot be read is refused rather than guessed about: answering "not ` +
    `recorded" would append a second event keyed on one id, the duplicate D-19 (4) exists to ` +
    `prevent. Underlying reason: ${(e as Error).message}`
  );
}
function storedNoteAlreadyRecorded(repoRoot: string, id: string): boolean {
  try {
    return ledgerRecordsId(repoRoot, id);
  } catch (e) {
    throw new Error(unreadableLedgerLookSentence(id, e));
  }
}
export function cell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function bodyExcerpt(body: string): string {
  return body.trim().split("\n")[0]?.trim() ?? "";
}
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
export function render(task: string, contextRoot: string = DEFAULT_CONTEXT_ROOT): void {
  assertSafeTask(task);
  const taskDir = join(contextRoot, task);
  // ONE WALK, TWO VIEWS (31-29, IN-14). `render` reads the skips as well as the notes, so an entry
  // that was in the directory and is not in the output is LEGIBLE rather than absent.
  const read = readRawNotesWithSkips(task, contextRoot);
  const all = read.notes.map((raw) => recordFromParsed(raw.parsed, raw.id));

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
    md.push(
      `${read.skipped.length} entr${read.skipped.length === 1 ? "y" : "ies"} in this task's ` +
        `notes/ directory ${read.skipped.length === 1 ? "was" : "were"} not read as a note. A ` +
        `position occupied by something that is not a regular file is not the same event as a ` +
        `file that was never a note, so each is named by its own arm.`,
    );
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
const GOVERNANCE_DEFAULTS = { human_admission: "off", audit_retention: "git" } as const;
const GATE_OR_STRICTER_HUMAN_ADMISSION = "all";
function canonicalizeHumanAdmission(raw: unknown): string {
  return typeof raw === "string" ? raw : GATE_OR_STRICTER_HUMAN_ADMISSION;
}
export type GovernanceConfigSource = "absent" | "ok" | "unreadable";
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
interface CheckpointMatrixRead {
  readonly matrix: Readonly<Record<Checkpoint, Disposition>>;
  readonly refusals: readonly string[];
}
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
      // like a report line printed after it. The module's rule for untrusted values is "quoted, not
      // interpolated raw"; this site was the one that had not applied it. Quoting renders the key on one line, with its
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
export function governanceConfigCandidates(base: string): readonly string[] {
  return [
    join(base, ".grugops", "factory.config.json"),
    join(base, "agent-factory", "config", "factory.config.json"),
  ];
}
export const GOVERNANCE_CONFIG_CANDIDATE_KINDS: readonly string[] = Object.freeze([
  "repository-state-plane",
  "in-kit",
]);
export const GOVERNANCE_FALLBACK_BASE: string = ROOT;
function canonicalDirectoryPath(candidate: string): string {
  const abs = resolve(candidate);
  const native = (realpathSync as { native?: (p: string) => string }).native;
  if (typeof native === "function") {
    try {
      return native(abs);
    } catch {
      // fall to rung 2
    }
  }
  try {
    return realpathSync(abs);
  } catch {
    // fall to rung 3
  }
  const parent = dirname(abs);
  if (parent === abs) return abs; // the filesystem root: nothing above it to canonicalise
  return join(canonicalDirectoryPath(parent), basename(abs));
}
export function canonicalWorkingDirectory(raw: string): string {
  return canonicalDirectoryPath(raw);
}
export const MODULE_OWN_CONFIG_POSITIONS: readonly string[] = Object.freeze(
  // BOTH SIDES through the same authority (31-27, `R-31-19-07`). This side is canonicalised here;
  // the candidate side is canonicalised in `homeConfigPositionIsProjectOwned` below. A comparison
  // whose two sides are produced by two different functions is a comparison waiting to disagree.
  governanceConfigCandidates(GOVERNANCE_FALLBACK_BASE).map((candidate) =>
    canonicalDirectoryPath(candidate),
  ),
);
function homeConfigPositionIsProjectOwned(candidateIndex: number, candidatePath: string): boolean {
  if (GOVERNANCE_CONFIG_CANDIDATE_KINDS[candidateIndex] !== "repository-state-plane") return false;
  return !MODULE_OWN_CONFIG_POSITIONS.includes(canonicalDirectoryPath(candidatePath));
}
export const TRUSTED_ROOT_ENV_ORDER: readonly string[] = Object.freeze([
  "CLAUDE_PROJECT_DIR",
  "GRUGOPS_PROJECT_DIR",
]);
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
const TRUSTED_ROOT_SEARCH_MAX_ANCESTORS = 64;
function directoryIdentity(dir: string): string | null {
  try {
    const st = statSync(dir);
    return `${String(st.dev)}:${String(st.ino)}`;
  } catch {
    return null;
  }
}
function namedHomeDirectory(): string | null {
  let raw: string;
  try {
    raw = homedir();
  } catch {
    return null;
  }
  if (typeof raw !== "string" || raw.trim() === "") return null;
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
interface HomeBoundary {
  /** Spellings of the home directory ITSELF. */
  readonly selfPaths: ReadonlySet<string>;
  /** Identities of the home directory ITSELF. */
  readonly selfIds: ReadonlySet<string>;
  /** Spellings of every STRICT ancestor of the home directory. */
  readonly abovePaths: ReadonlySet<string>;
  /** Identities of every STRICT ancestor of the home directory. */
  readonly aboveIds: ReadonlySet<string>;
}
function homeBoundary(): HomeBoundary | null {
  const named = namedHomeDirectory();
  if (named === null) return null;

  // The same directory under every spelling this module can obtain for it: the RAW spelling the
  // environment handed over, and the ONE spelling the module publishes for every directory —
  // `canonicalDirectoryPath`, rung 1 `realpathSync.native` (plan 33-24, D-33-R3-01, closing
  // 33-REVIEW WR-05 (a)). It used to be rung 2 `realpathSync`, a SECOND authority: the walk climbs
  // rung-1 spellings (33-16), so on a host whose home carries an 8.3 component (`RUNNER~1`) the
  // path sets held the short spelling while the walk climbed long-name directories
  // (`runneradmin`), `abovePaths`/`selfPaths` missed, and only the dev:ino identity sets could
  // catch it — and the `degenerate` guard below drops those on a host that reports equal identities
  // for parent and child. The home's canonical spelling must be the one the walk climbs through.
  const spellings = new Set<string>([named]);
  try {
    spellings.add(canonicalDirectoryPath(named));
  } catch {
    // The raw spelling is what there is. The identity sets below cover the rest.
  }

  const selfPaths = new Set<string>();
  const selfIds = new Set<string>();
  const abovePaths = new Set<string>();
  const aboveIds = new Set<string>();
  for (const start of spellings) {
    let dir = start;
    for (let step = 0; step < TRUSTED_ROOT_SEARCH_MAX_ANCESTORS; step++) {
      // Step 0 is the home directory itself; every later step is a STRICT ancestor of it. The two
      // are separate questions with separate answers, so they are separate sets.
      const paths = step === 0 ? selfPaths : abovePaths;
      const ids = step === 0 ? selfIds : aboveIds;
      paths.add(dir);
      const id = directoryIdentity(dir);
      if (id !== null) ids.add(id);
      const parent = dirname(dir);
      if (parent === dir) break;
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
    selfIds: degenerate ? new Set<string>() : selfIds,
    abovePaths,
    aboveIds: degenerate ? new Set<string>() : aboveIds,
  };
}
function isAboveHome(dir: string, home: HomeBoundary): boolean {
  if (home.abovePaths.has(dir)) return true;
  const id = directoryIdentity(dir);
  return id !== null && home.aboveIds.has(id);
}
function isHomeItself(dir: string, home: HomeBoundary): boolean {
  if (home.selfPaths.has(dir)) return true;
  const id = directoryIdentity(dir);
  return id !== null && home.selfIds.has(id);
}
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
    // RULE 1 — ASCENT IS BOUNDED. A STRICT ancestor of the home directory is refused outright,
    // before any inspection. This half of the bound is unchanged by plan 31-23.
    if (isAboveHome(dir, home)) return nearest;
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
    if (carriesConfig && nearest === null) nearest = dir;
    if (isBoundary) {
      return carriesConfig ? dir : nearest;
    }
    const parent = dirname(dir);
    if (parent === dir) return nearest; // filesystem root
    dir = parent;
  }
  return nearest;
}
export const HOST_DELIVERED_ROOT_ENV = "GRUGOPS_HOST_DELIVERED_ROOT";
export function hostDeliveredRoot(): string | null {
  const raw = process.env[HOST_DELIVERED_ROOT_ENV];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // ABSOLUTE, tested on the value as delivered. A relative value would resolve against the reading
  // process's working directory, which is the very input the delivered channel exists to bypass.
  if (!isAbsolute(trimmed)) return null;
  const canonical = canonicalDirectoryPath(trimmed);
  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(canonical);
  } catch {
    return null; // names nothing real
  }
  if (!st.isDirectory()) return null;
  // A REPOSITORY, by the marker set the walk already publishes — one authority for "where a
  // repository starts", never a second list here.
  if (!REPO_BOUNDARY_MARKERS.some((marker) => existsSync(join(canonical, marker)))) return null;
  // NOT the kit this module ships in. The kit is not a governed project, and adopting it is the
  // shape D-23 (4) and CR-13 both already refuse one tier down.
  if (canonical === canonicalDirectoryPath(GOVERNANCE_FALLBACK_BASE)) return null;
  return canonical;
}
export function trustedRepoRoot(): string {
  // TIER 0, ABOVE THE LOOP AND ABOVE THE WALK (plan 31-27, S1). It is placed here rather than woven
  // into the loop for two reasons. It is a DIFFERENT KIND of signal — a host-built channel, not an
  // ambient name — and `TRUSTED_ROOT_ENV_ORDER` is the ambient precedence, which a delivered root
  // does not belong inside. And the 31-15 monotonicity mirror reconstructs the pre-31-15 program by
  // reverting exactly two anchors — the loop's first element and the walk call below — so a step
  // added ABOVE them leaves that reconstruction intact rather than silently changing what the mirror
  // compares against.
  const delivered = hostDeliveredRoot();
  if (delivered !== null) return delivered;
  for (const name of TRUSTED_ROOT_ENV_ORDER) {
    const fromEnv = process.env[name];
    // THROUGH THE ONE LADDER, not a bare `resolve` (plan 33-24, D-33-R3-01, closing 33-REVIEW
    // WR-05 (b)). A link-spelled or 8.3-spelled project directory handed over in this variable names
    // the directory the cwd tier and tier 0 would name; a bare lexical spelling here was two answers
    // for one directory, one tier apart. The loop header above is a monotonicity-mirror anchor and
    // stays byte-identical; the change is on the RETURN line only.
    if (typeof fromEnv === "string" && fromEnv.trim() !== "") return canonicalDirectoryPath(fromEnv.trim());
  }
  let cwd: string | null = null;
  try {
    // CANONICALISED WHERE IT IS READ (plan 33-16, W-21). On darwin `process.cwd()` answers the
    // kernel's realpath; on win32 it KEEPS the spelling the process was started with, so a working
    // directory addressed through a directory symlink walked from the LINK spelling and the
    // R-31-19-07 SYMLINK cell moved on windows-latest. The walk's start now goes through the same
    // canonicaliser tier 0's delivered root does, so both are spelled by one authority.
    cwd = canonicalWorkingDirectory(process.cwd());
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
  // The 33-16 canonicalisation lives on the READ line inside the `try` above, so the mirror's two
  // anchors — this line and the loop's first element — are byte-untouched by it.
  const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);
  if (discovered !== null) return discovered;
  return GOVERNANCE_FALLBACK_BASE;
}
const GOVERNANCE_CONFIG_MAX_BYTES = 8 * 1024 * 1024;
function isExistingDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
function readGovernanceConfigCandidate(path: string): string | null {
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
export function normalizeKind(raw: string | undefined): string {
  return (raw ?? "").trim();
}
export function isHighSeverityRole(by: string): boolean {
  const canonical = (by ?? "")
    .normalize("NFKC")
    .replace(/[\s\u200B\u200C\u200D\u2060\uFEFF]/gu, "")
    .toLowerCase();
  return (HIGH_SEVERITY_ROLES as readonly string[]).includes(canonical);
}
// </runnable-embeds>

/** The note that stands, once one may have been written; read by the two messages below. */
let noteStands = "";

// EXIT-1 (plan 37-20): a throw that escapes every inner catch is could-not-run, never the outcome code. Registered
// before argv is read, and every binding the handler reads is declared above it.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));

/**
 * The command stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. It never says
 * nothing was written once `noteStands` is set, because the render that follows a note can be what threw.
 */
function stoppedUnexpectedly(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  process.stderr.write(
    `Error: the note tool stopped unexpectedly (${printable(message)}).${noteStands === "" ? "" : ` ${printable(noteStands)}`} ` +
      "The command did not finish.\n",
  );
  process.exit(2);
}

/** One value made safe to print on one line: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value: string): string {
  return stripControlChars(value.replace(/\s*[\r\n]+\s*/g, " "), false);
}

/** The command could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} ${noteStands === "" ? "No note was written." : printable(noteStands)}\n`);
  process.exit(2);
}

/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? "unknown error";
}

const USAGE =
  "Usage: node note.js add <folder> --kind <kind> --by <role> --confidence <level> (--body <text> | --body-file <path>) " +
  "[--ref <ref>]... [--verified-by <stamp>] [--supersedes <id>] [--sha <hex>] [--gate-run <id>] [--content-hash <hex>]";

/** What `add` takes on the command line: each flag, and whether it may repeat. */
const ADD_FLAGS: ReadonlyMap<string, boolean> = new Map([
  ["--kind", false],
  ["--by", false],
  ["--confidence", false],
  ["--ref", true],
  ["--body", false],
  ["--body-file", false],
  ["--verified-by", false],
  ["--supersedes", false],
  ["--sha", false],
  ["--gate-run", false],
  ["--content-hash", false],
]);

const args = process.argv.slice(2);
if (args[0] !== "add") couldNotRun(`${args[0] === undefined ? "no command was given" : `unknown command ${args[0]}`}. ${USAGE}.`);

const flags = new Map<string, string[]>();
const positional: string[] = [];
for (let i = 1; i < args.length; i += 1) {
  const arg = args[i] as string;
  if (!arg.startsWith("--")) {
    positional.push(arg);
    continue;
  }
  const repeats = ADD_FLAGS.get(arg);
  if (repeats === undefined) couldNotRun(`unknown option ${arg}. ${USAGE}.`);
  if (flags.has(arg) && !repeats) couldNotRun(`${arg} was given more than once. ${USAGE}.`);
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    couldNotRun(`${arg} needs a value, and a value may not start with two dashes. A body that does goes in a file. ${USAGE}.`);
  }
  flags.set(arg, [...(flags.get(arg) ?? []), value]);
  i += 1;
}
if (positional.length !== 1) couldNotRun(`add takes one folder; it was given ${positional.length}. ${USAGE}.`);

/** The one value of `flag`, or undefined when it was not given. */
function flagValue(flag: string): string | undefined {
  return flags.get(flag)?.[0];
}

/** The value of a flag `add` cannot run without. */
function requiredFlag(flag: string): string {
  const value = flagValue(flag);
  if (value === undefined) couldNotRun(`add needs ${flag}. ${USAGE}.`);
  return value;
}

/** `--kind`, one of the six the embedded list names. */
function noteKind(): NoteKind {
  const kind = requiredFlag("--kind");
  if (!(NOTE_KINDS as readonly string[]).includes(kind)) {
    couldNotRun(`--kind ${kind} is not a note kind. Use one of: ${NOTE_KINDS.join(", ")}.`);
  }
  return kind as NoteKind;
}

/**
 * `--by`, the role file's name. This is an argv shape check; every severity decision stays in the embedded admit(). The
 * high-severity classifier reads the role name, so an adapter name is refused here. scripts/kit-model.ts owns the
 * adapter namespace and a host program cannot import it, so note.test.ts drives this refusal with that owner's constant.
 */
function noteAuthor(): string {
  const by = flagValue("--by");
  const named = by?.trim().toLowerCase() ?? "";
  if (named === "") couldNotRun(`add needs --by <role>, the role file's name without .md. ${USAGE}.`);
  const role = named.replace(/^grugops-/, "");
  if (role !== named) couldNotRun(`--by ${by as string} is an adapter name. Pass the role file's name without .md: ${role}.`);
  return by as string;
}

/** The fence of the note, from argv. */
function noteFromFlags(): NoteInput {
  return {
    kind: noteKind(),
    by: noteAuthor(),
    at: new Date().toISOString(),
    verified_by: flagValue("--verified-by") ?? "",
    confidence: requiredFlag("--confidence"),
    refs: flags.get("--ref") ?? [],
    supersedes: flagValue("--supersedes") ?? null,
    sha: flagValue("--sha"),
    gate_run: flagValue("--gate-run"),
    content_hash: flagValue("--content-hash"),
  };
}

/** The text at `--body-file`, through the embedded non-blocking reader, so a FIFO is refused and never waited on. */
function bodyFromFile(path: string): string {
  let text: string | null;
  try {
    text = readRegularFileOrNull(path, NOTE_FILE_MAX_BYTES, "--body-file");
  } catch (e) {
    couldNotRun(`--body-file ${path} could not be read (${(e as Error).message}).`);
  }
  if (text === null) couldNotRun(`--body-file ${path} does not exist.`);
  return text;
}

/** The note's body: exactly one body flag, holding more than white space, so an empty note cannot free a slot. */
function noteBody(): string {
  const text = flagValue("--body");
  const file = flagValue("--body-file");
  if ((text === undefined) === (file === undefined)) couldNotRun(`add takes exactly one of --body and --body-file. ${USAGE}.`);
  const body = text ?? bodyFromFile(file as string);
  if (body.trim() === "") couldNotRun("the note body is empty.");
  return body;
}

/** The real path of the working directory, the one root of this program. */
function resolvedRoot(): string {
  try {
    return nodeFs.realpathSync(process.cwd());
  } catch (e) {
    return couldNotRun(`the working directory cannot be resolved (${codeOf(e)}).`);
  }
}

/** Why an answer of the root-chain owner is not a usable directory, or null when it is one. */
function directoryProblem(presence: RootChainPresence): string | null {
  if (presence.kind === "absent") return "nothing is there";
  if (presence.kind === "unreadable" || presence.kind === "link") return presence.reason;
  if (presence.kind === "outside") return "it resolves outside the repository root";
  return presence.target.isDirectory() ? null : "it is not a directory";
}

/**
 * Makes sure the path to `notes/` can be used. The owner walks every component in order, so one question covers
 * .grugops/context, the folder and notes. `absent` is allowed, because the writer creates what is missing.
 */
function refuseUnusableStore(root: string, notesRel: string): void {
  const presence = rootChainPresence(root, notesRel, "directory");
  if (presence.kind === "absent") return;
  const problem = directoryProblem(presence);
  if (problem !== null) couldNotRun(`${notesRel} cannot be used: ${problem}.`);
}

/** True for a refusal by the writer: an outcome to act on. Any other throw is could-not-run. */
function isWriterRefusal(e: unknown): e is Error {
  return e instanceof Error && e.message.startsWith("context-io");
}

/**
 * True when the read `claim.js done` makes finds the note `id`. render() files a note it cannot read under its skipped
 * entries and returns, so `noted` would otherwise report a note neither the index nor `done` can see (READ-1).
 */
function noteReadsBack(folder: string, id: string, contextRoot: string): boolean {
  return readRawNotesWithSkips(folder, contextRoot).notes.some((n) => n.id === id);
}

/** `add`: every rule about what a note may say is the embedded writer's. This maps its answer to the contract. */
function runAdd(folder: string): void {
  const note = noteFromFlags();
  try {
    assertSafeTask(folder);
  } catch (e) {
    couldNotRun(`${(e as Error).message}.`);
  }
  const root = resolvedRoot();
  const stateDirProblem = directoryProblem(rootChainPresence(root, GRUGOPS_DIR_REL, "directory"));
  if (stateDirProblem !== null) {
    couldNotRun(`${root} has no usable ${GRUGOPS_DIR_REL} directory (${stateDirProblem}). Run from the repository root.`);
  }
  const notesRel = `${CONTEXT_REL}/${folder}/notes`;
  refuseUnusableStore(root, notesRel);
  const body = noteBody();

  const contextRoot = nodePath.join(root, CONTEXT_REL);
  noteStands = `The note may have been written; check ${notesRel}/ before adding it again.`;
  let id: string;
  try {
    id = appendNote(folder, note, body, contextRoot);
  } catch (e) {
    if (!isWriterRefusal(e)) throw e;
    noteStands = "";
    process.stdout.write(`refused ${printable(folder)}: ${printable(e.message)}\n`);
    process.exitCode = 1;
    return;
  }
  noteStands = `Note ${id} stands in ${notesRel}/, and index.md and index.jsonl were not rendered.`;
  render(folder, contextRoot);
  noteStands = `Note ${id} stands in ${notesRel}/.`;
  if (!noteReadsBack(folder, id, contextRoot)) {
    couldNotRun(`note ${id} could not be read back, so index.md and index.jsonl may not list it and \`done\` may not count it.`);
  }
  process.stdout.write(`noted ${printable(folder)} ${printable(id)}\n`);
}

runAdd(positional[0] as string);
