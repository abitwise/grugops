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
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  mkdirSync,
  existsSync,
} from "node:fs";
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

// ── Frontmatter parse (stdlib slice+regex — NO js-yaml/gray-matter, per the zero-dep constraint).
// Extends the flat key:value idiom from generate-catalog.ts with one addition: a `refs:` YAML list
// block (`refs:\n  - x\n  - y`). A single-line `refs: a, b` comma form is also accepted. The choice
// (extend the parser minimally rather than add a dependency) resolves RESEARCH Open Question 1.
interface ParsedFrontmatter {
  scalars: Record<string, string>;
  refs: string[];
  body: string;
  // Frontmatter keys that appeared on more than one `key: value` line. parseNote keeps the LAST
  // value (later overwrites earlier) for backward-compatible reads; validate() treats any entry
  // here as a structural FAIL (CR-01 defense-in-depth) — a duplicate provenance key is the on-disk
  // signature of a field-injection forgery.
  duplicateKeys: string[];
}

function parseNote(text: string): ParsedFrontmatter | null {
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
  let refs: string[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
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
    }
  }
  return { scalars, refs, body, duplicateKeys: [...dupes] };
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
function noteId(note: NoteInput): string {
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
export function admit(
  task: string,
  text: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
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
  return [];
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
      if (!task || !noteFile) {
        console.error("usage: context-io.js admit <task> <noteFile> [contextRoot]");
        process.exit(1);
      }
      const findings = admit(task, readFileSync(noteFile, "utf8"), contextRoot ?? DEFAULT_CONTEXT_ROOT);
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
