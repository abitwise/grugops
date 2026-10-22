// trace-render.ts — the requirement→code→test→release trace render (MIGR-03, D-01/D-04/D-06).
//
// The human-facing traceability matrix (the traceability file under the state root, TRACEABILITY_REL in
// install/state-layout.ts) is GENERATED, never hand-maintained:
// it is the deterministic product of `node scripts/trace-render.js`. The shared verified-context
// NOTES under .grugops/context/<task>/notes/ are the SOURCE OF TRUTH; their `refs` carry the
// requirement / code / test / UAT / release links a ticket accrues as work is done. traceability.md
// is the derived, human-readable mirror of those refs (D-01 Option A: it SURVIVES as a render of note
// refs — it is never hand-maintained and never deleted). This is the same render-family seam Phase 20
// deferred to Phase 24 (D-02), through which role output is published.
//
// One row per ticket id, keyed by the ticket-shaped ref a note carries; columns
//   Requirement | Code | Tests | UAT | Release
// are filled (D-04) from each note's `refs` (D-06), classified deterministically by ref shape — NOT
// from the index.md at/kind/by columns. Ticket ids appear verbatim in the rendered rows so the
// validator's `trace.includes(id)` completeness check (validate-agent-factory.ts) stays a minimal,
// path-unchanged re-point (A2).
//
//   node scripts/trace-render.js                 # regen the traceability file under the state root (real roots)
//   node scripts/trace-render.js <ctxRoot> <stateRoot>   # explicit roots (tests pass temp dirs)
//
// Build model (D-13): node:fs + node:path ONLY (plus the readContext/atomicWrite helpers re-used from
// the committed context-io.js) — ZERO host runtime deps. Authored in TypeScript, compiled with `tsc`
// to a committed scripts/trace-render.js; the freshness.ts build-output gate proves the committed .js
// is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — this is a trace surface, never
// caveman voice).

import { readdirSync, existsSync } from "node:fs";
import { isEntrypoint } from "./is-entry.js";
import { join } from "node:path";

import { readContext, atomicWrite, type NoteRecord } from "./context-io.js";
import { buildTraceRows, traceCell, type TraceRow } from "./trace-model.js";
import { STATE_ROOT_REL, TRACEABILITY_REL } from "../install/state-layout.js";

// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops", "context");
// The state root (install/state-layout.ts); the traceability file is written directly under it.
const DEFAULT_PLANS_ROOT = join(ROOT, STATE_ROOT_REL);

// ── List the task directories under a context root (each holds a notes/ dir). ───────────────────
function listTasks(contextRoot: string): string[] {
  if (!existsSync(contextRoot)) return [];
  return readdirSync(contextRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort(); // deterministic task order
}

// ── Build the ticket rows from every note's refs across every task. ─────────────────────────────
// The classification and the row merge live once, in scripts/trace-model.ts (plan 37-06). This export
// keeps its contract until plan 37-08 turns this file into a wrapper: the notes of every task under one
// context root, merged into one row per ticket. Its row order stays the order this render has always
// written, so the monolithic file below keeps its bytes; the per-ticket render sorts by code units.
export function buildRows(contextRoot: string): TraceRow[] {
  const notes: NoteRecord[] = [];
  for (const task of listTasks(contextRoot)) {
    try {
      notes.push(...readContext(task, contextRoot));
    } catch {
      continue; // a task name the allowlist rejects, or an unreadable notes dir — skip, never crash
    }
  }
  return buildTraceRows(notes).sort((a, b) => a.id.localeCompare(b.id));
}

// ── render: read notes → emit the byte-reproducible traceability file under the state root. ─────
// GENERATED header naming the re-run command; the five-column table; deterministic ticket-id sort;
// cell()-escaped cells; single trailing newline via a trailing "" push; atomicWrite.
export function renderTraceability(
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  plansRoot: string = DEFAULT_PLANS_ROOT,
): void {
  const rows = buildRows(contextRoot);

  const md: string[] = [];
  md.push("<!-- GENERATED — do not hand-edit. Re-run: node scripts/trace-render.js -->");
  md.push("# Traceability Matrix");
  md.push("");
  md.push("| Requirement | Code | Tests | UAT | Release |");
  md.push("| --- | --- | --- | --- | --- |");
  for (const r of rows) {
    // The Requirement cell leads with the ticket id (verbatim, so the validator trace.includes(id)
    // re-point stays minimal — A2), followed by any requirement-shaped refs.
    const requirement = [r.id, ...r.Requirement].map(traceCell).join(", ");
    const code = r.Code.map(traceCell).join(", ");
    const tests = r.Tests.map(traceCell).join(", ");
    const uat = r.UAT.map(traceCell).join(", ");
    const release = r.Release.map(traceCell).join(", ");
    md.push(`| ${requirement} | ${code} | ${tests} | ${uat} | ${release} |`);
  }
  md.push(""); // trailing element → exactly one final "\n"
  atomicWrite(join(plansRoot, "traceability.md"), md.join("\n"));
}

// ── CLI entrypoint (only when run directly, never on import) ─────────────────────────────────────
const isMain = isEntrypoint(import.meta.url);

if (isMain) {
  const [ctxRoot, plansRoot] = process.argv.slice(2);
  try {
    renderTraceability(ctxRoot ?? DEFAULT_CONTEXT_ROOT, plansRoot ?? DEFAULT_PLANS_ROOT);
    console.log(`rendered ${TRACEABILITY_REL} from the shared-context note refs.`);
    process.exit(0);
  } catch (e) {
    console.error(`trace-render: ${(e as Error).message}`);
    process.exit(1);
  }
}
