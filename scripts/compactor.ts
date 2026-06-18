// compactor.ts — the deterministic carve-out invariant checker over (raw thread → promoted notes).
//
// This is the MECHANICAL FLOOR of the body/frontmatter seam (Phase 22, D-01). The division of
// labor is crisp and load-bearing:
//
//   • The AGENT compresses note BODIES. Distillation is semantic — the role reads its verbose local
//     trajectory and writes the terse gist (caveman token-economy applied to memory). That is the
//     intelligence, and it lives in the role / Workflow 18, never here.
//
//   • This TOOL protects note STRUCTURE. compactor.ts is node:fs-only with ZERO host runtime deps
//     (D-13/D-15) — it CANNOT call an LLM and MUST NOT summarize. Its only job before a promotion
//     is a deterministic carve-out check: nothing load-bearing was dropped on the way from the raw
//     thread to the proposed promoted notes.
//
// The carve-out (CMP-02), enforced identically at every dial value (D-05 — un-dialable):
//   1. Every failed-attempt note id present in the raw thread SURVIVES into the promoted set
//      (DeLM reusable dead-ends are never compacted away). A dropped id → refuse, name the id.
//   2. The load-bearing provenance fields verified_by / supersedes / by / at are INTACT on every
//      promoted note. A dropped field → refuse, name the field.
//   3. Promotion routes ONLY through context-io.ts's appendNote — this file forks NO writer of
//      .grugops/context/ (the single sanctioned write path + the Phase-21 admission gate are
//      preserved; the guard_context_writes foundation guard still holds).
//
// The ONLY structural fold this tool may reuse is context-io.ts's deterministic currentState()
// supersedes collapse (D-03). Any other dedup / merge / "drop a duplicate observation" is a
// judgment in disguise — that is the agent's body-compression job, NOT the tool's. Keep this tool
// mechanically dumb and un-cheatable; the mechanical/semantic line stays crisp.
//
// Re-verify (D-12) routes ONLY through context-io.ts's admit(): a promoted finding's §14-gate#<id>
// stamp must still cross-check a live green verdict. A faithful body compaction re-admits cheaply
// (the verdict verified the WORK, not the prose). A compaction that materially changed the finding
// such that its stamp no longer cross-checks is REFUSED → it honestly degrades to a claim with
// confidence "UNKNOWN - verify" (the Phase-21 escape hatch) — NEVER a hand-carried stamp, NEVER a
// faked pass.
//
// On any dropped carve-out element: refuse, process.exit(1), and NAME the dropped element — the
// same fail-closed, name-the-fault posture as context-io.ts's appendNote and hooks/guard.ts.
//
// Build model (D-13): authored in TypeScript, compiled with `tsc` to a committed scripts/compactor.js
// that hosts and CI run with bare Node; the freshness.ts gate (OUTPUT_DIRS includes scripts/)
// auto-discovers compactor.js and proves it is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — trace + safety + token surface,
// never caveman voice).
//
// CLI:
//   node scripts/compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]
//     # exit 0 = carve-out intact; exit 1 = a load-bearing element was dropped (named on stderr)

import { readFileSync, readdirSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  appendNote,
  admit,
  type NoteInput,
} from "./context-io.js";

// ── Context root (production). Tests pass an explicit root. ──────────────────────────────────────
const REPO_ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(REPO_ROOT, ".grugops", "context");
const DEFAULT_CONFIG_ROOT = join(REPO_ROOT, ".grugops");

// ── The three dial values (D-04). aggressive is the lean default (CMP-03). ───────────────────────
export const COMPACTION_DIALS = ["aggressive", "balanced", "retain-raw"] as const;
export type CompactionDial = (typeof COMPACTION_DIALS)[number];
const DEFAULT_DIAL: CompactionDial = "aggressive";

// ── Path-traversal allowlist (V12) — reuse context-io.ts's assertSafeTask discipline. ───────────
// BOTH the <task> and the <agent> segments of .grugops/context/<task>/threads/<agent>.md are
// caller-supplied identifiers; validate each before interpolating it into a filesystem path.
const SAFE_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeSegment(kind: string, value: string): void {
  if (!SAFE_SEGMENT_RE.test(value) || value === "." || value === "..") {
    throw new Error(
      `compactor: invalid ${kind} "${value}" — must match ^[A-Za-z0-9._-]+$ ` +
        "(no path separators, no .., no absolute paths)",
    );
  }
}

// ── Minimal frontmatter read (read-only; never a write path). ────────────────────────────────────
// The compactor READS provenance fields off raw thread + promoted note files to compare them. This
// is not note I/O into the shared context — promotion still routes solely through appendNote. The
// flat key:value scalar shape mirrors context-io.ts's parseNote (we only need the scalar fields the
// carve-out inspects); CRLF is normalized so a Windows-checkout note reads identically.
interface NoteFields {
  kind: string;
  by: string;
  at: string;
  verified_by: string;
  supersedes: string;
  body: string;
}

function readNoteFields(text: string): NoteFields | null {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const scalars: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) scalars[kv[1]] = kv[2].trim();
  }
  return {
    kind: scalars.kind ?? "",
    by: scalars.by ?? "",
    at: scalars.at ?? "",
    verified_by: scalars.verified_by ?? "",
    supersedes: scalars.supersedes ?? "",
    body: m[2]?.trim() ?? "",
  };
}

// Read every notes/*.md-style file under a directory into parsed fields keyed by filename.
function readNoteDir(dir: string): Map<string, NoteFields> {
  const out = new Map<string, NoteFields>();
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const fields = readNoteFields(readFileSync(join(dir, file), "utf8"));
    if (fields) out.set(file, fields);
  }
  return out;
}

// ── Failed-attempt id extraction. The load-bearing id is the FA-<token> the agent records in the ─
// note (the DeLM reusable dead-end key). Read it from the body (`FA-1: …`) or the filename
// (`FA-1.md`) — whichever carries it — so a dropped failed-attempt is named precisely.
function failedAttemptId(filename: string, fields: NoteFields): string | null {
  if (fields.kind !== "failed-attempt") return null;
  const fromBody = fields.body.match(/\bFA-[A-Za-z0-9_-]+\b/);
  if (fromBody) return fromBody[0];
  const fromName = filename.match(/\bFA-[A-Za-z0-9_-]+\b/);
  if (fromName) return fromName[0];
  // A failed-attempt with no recoverable id is itself a carve-out violation: it cannot be tracked.
  return filename.replace(/\.md$/, "");
}

// ── The carve-out invariant check (CMP-02). Returns a findings array; empty = intact. ────────────
// Deterministic, mechanical, summarization-free. The dial is accepted but NEVER weakens the check
// (D-05): the carve-out holds identically at aggressive / balanced / retain-raw.
export function checkCarveOut(
  rawThread: Map<string, NoteFields>,
  promoted: Map<string, NoteFields>,
  _dial: CompactionDial = DEFAULT_DIAL,
): string[] {
  const findings: string[] = [];

  // 1. Every failed-attempt id in the raw thread must survive into the promoted set (D-02.1).
  const rawFailedIds: string[] = [];
  for (const [file, fields] of rawThread) {
    const id = failedAttemptId(file, fields);
    if (id !== null) rawFailedIds.push(id);
  }
  const promotedFailedIds = new Set<string>();
  for (const [file, fields] of promoted) {
    const id = failedAttemptId(file, fields);
    if (id !== null) promotedFailedIds.add(id);
  }
  for (const id of rawFailedIds) {
    if (!promotedFailedIds.has(id)) {
      findings.push(
        `carve-out FAIL: failed-attempt "${id}" present in the raw thread was dropped from the ` +
          `promoted set — DeLM reusable dead-ends are never compacted away (CMP-02, D-02.1).`,
      );
    }
  }

  // 2. The load-bearing provenance fields must be intact on every promoted durable note (D-02.2).
  // For each non-failed-attempt note in the raw thread, find its promoted counterpart (match by
  // kind + by, falling back to kind alone when a single note of that kind exists) and confirm no
  // load-bearing field present in the raw note was dropped/emptied in the promoted note.
  for (const [, rawFields] of rawThread) {
    if (rawFields.kind === "failed-attempt") continue;
    const counterpart = findCounterpart(rawFields, promoted);
    if (!counterpart) continue; // a wholly-dropped durable note is the agent's call; fields are the floor
    for (const field of ["verified_by", "supersedes", "by", "at"] as const) {
      const rawVal = rawFields[field];
      const promVal = counterpart[field];
      if (rawVal !== "" && promVal === "") {
        findings.push(
          `carve-out FAIL: load-bearing provenance field "${field}" (value "${rawVal}") was ` +
            `dropped from a promoted ${rawFields.kind} note — provenance must survive compaction ` +
            `(CMP-02, D-02.2).`,
        );
      }
    }
  }

  return findings;
}

// Find the promoted note that corresponds to a raw note. Prefer an exact (kind, by) match; when the
// `by` line was dropped (the "drops by" case), the promoted note's by is empty, so fall back to a
// single note of the same kind.
function findCounterpart(raw: NoteFields, promoted: Map<string, NoteFields>): NoteFields | null {
  const sameKind = [...promoted.values()].filter((p) => p.kind === raw.kind);
  if (sameKind.length === 0) {
    // No same-kind note: the by/at line may have been stripped, changing the parsed kind line's
    // siblings but not the kind itself — so this only fires if the kind was also lost. Match any
    // single promoted note as the counterpart so a stripped required field is still caught.
    if (promoted.size === 1) return [...promoted.values()][0];
    return null;
  }
  const byMatch = sameKind.find((p) => p.by === raw.by);
  if (byMatch) return byMatch;
  // by was dropped/changed → return the single same-kind note as the counterpart.
  if (sameKind.length === 1) return sameKind[0];
  return sameKind[0];
}

// ── readCompactionDial: read context.compaction from .grugops/factory.config.json at point-of-use. ─
// Default-on-absent (D-06): missing key — or missing file, or unparseable file — reads as aggressive.
// No new dial-reading machinery; mirrors how quality.* / security.* keys are read.
export function readCompactionDial(configRoot: string = DEFAULT_CONFIG_ROOT): CompactionDial {
  const configPath = join(configRoot, "factory.config.json");
  if (!existsSync(configPath)) return DEFAULT_DIAL;
  try {
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    const value = cfg?.context?.compaction;
    if ((COMPACTION_DIALS as readonly string[]).includes(value)) return value as CompactionDial;
    return DEFAULT_DIAL;
  } catch {
    return DEFAULT_DIAL;
  }
}

// ── writeThread: append the verbose local trajectory to the ephemeral threads/<agent>.md tier. ───
// This is the gitignored local scratch (D-07/D-08). It is NOT the shared context — it never routes
// through appendNote. mkdirSync on demand mirrors appendNote's notes/ creation.
export function writeThread(
  task: string,
  agent: string,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
): string {
  assertSafeSegment("task", task);
  assertSafeSegment("agent", agent);
  const threadsDir = join(contextRoot, task, "threads");
  mkdirSync(threadsDir, { recursive: true });
  const threadPath = join(threadsDir, `${agent}.md`);
  const existing = existsSync(threadPath) ? readFileSync(threadPath, "utf8") : "";
  writeFileSync(threadPath, existing + (existing && !existing.endsWith("\n") ? "\n" : "") + body + "\n");
  return threadPath;
}

// ── promote: the SOLE promotion path (D-02.3) — a thin pass-through to context-io.appendNote. ────
// The compactor adds NO forked writer of the shared context. assertSingleLine / duplicate-key /
// structural validation all fire automatically inside appendNote.
export function promote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
): string {
  return appendNote(task, note, body, contextRoot);
}

// ── reVerify: re-admission of a promoted finding (D-12) — a thin pass-through to context-io.admit. ─
// Returns context-io's findings array ([] = admitted). It adds no new verification loop: the
// §14-gate#<id> stamp cross-check is admit()'s job. The caller degrades a refused finding to a claim.
export function reVerify(
  task: string,
  text: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
): string[] {
  return admit(task, text, contextRoot);
}

// ── degradeToClaim: the honest fallback (D-12 / Phase-21 escape hatch). ──────────────────────────
// When reVerify refuses a finding (its stamp no longer cross-checks a live green verdict), the
// agent must NOT hand-carry the stamp or fake a pass. It re-records the result as a soft `claim`
// with confidence "UNKNOWN - verify" and an EMPTY verified_by — the trace stays honest.
export function degradeToClaim(findingText: string): string {
  const normalized = findingText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let out = normalized
    .replace(/^kind:\s*finding\s*$/m, "kind: claim")
    .replace(/^verified_by:\s*.*$/m, "verified_by: ")
    .replace(/^confidence:\s*.*$/m, "confidence: UNKNOWN - verify");
  // If the note carried no confidence line, append one inside the fence is out of scope; the
  // finding template always carries kind/verified_by/confidence, so the replacements above hold.
  return out;
}

// ── CLI entrypoint (only when run directly, never on import). ────────────────────────────────────
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    if (cmd === "check") {
      // node compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]
      const positional = rest.filter((a) => !a.startsWith("--"));
      const threadDir = positional[0];
      const promotedDir = positional[1];
      if (!threadDir || !promotedDir) {
        console.error(
          "usage: compactor.js check <threadDir> <promotedDir> [--compaction=<aggressive|balanced|retain-raw>]",
        );
        process.exit(1);
      }
      const dialArg = rest.find((a) => a.startsWith("--compaction="));
      const dialRaw = dialArg ? dialArg.slice("--compaction=".length) : DEFAULT_DIAL;
      // An unknown dial value reads as the default — the carve-out holds regardless (D-05), so a
      // bad dial never weakens the check.
      const dial: CompactionDial = (COMPACTION_DIALS as readonly string[]).includes(dialRaw)
        ? (dialRaw as CompactionDial)
        : DEFAULT_DIAL;

      const rawThread = readNoteDir(threadDir);
      const promoted = readNoteDir(promotedDir);
      const findings = checkCarveOut(rawThread, promoted, dial);
      if (findings.length > 0) {
        for (const f of findings) console.error(f);
        process.exit(1);
      }
      console.log(
        "carve-out intact: every failed-attempt id survived and all load-bearing provenance fields are present.",
      );
      process.exit(0);
    } else {
      console.error("usage: compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]");
      process.exit(1);
    }
  } catch (e) {
    console.error(`compactor: ${(e as Error).message}`);
    process.exit(1);
  }
}
