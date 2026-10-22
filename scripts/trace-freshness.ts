// trace-freshness.ts — grugops's own trace freshness gate (MIGR-03; phase 37, plan 37-08, SPLIT-03, D-01).
//
// THE TRACE IS GENERATED, NEVER HAND-MAINTAINED. The trace index (TRACEABILITY_REL in install/state-layout.ts)
// and the per-ticket trace files under the trace directory (TRACE_DIR_REL) are the render of the published
// note refs under .grugops/context and .grugops/archive/context. The notes are the source of truth. That
// contract holds only if the committed tree equals a fresh render, and this gate proves it.
//
// A DIRECTORY COMPARE, THROUGH THE ONE PROGRAM (D-01). The gate spawns the committed host runnable
// scripts/runnable-ref/trace-render.js with `<root> --check`. The runnable compares the index and every owned
// file in the trace directory with a fresh render through compareTraceTree in scripts/trace-model.ts, writes
// nothing, and exits 0 fresh, 1 on any missing, extra, changed or hand-written file (each named), or 2 when it
// could not run. Names that begin with `.` (a directory keeper such as .gitkeep) are outside the owned tree
// and are never read. The gate holds no comparison of its own, so it cannot disagree with the render.
//
//   node scripts/trace-freshness.js   # exit 0 = the committed trace equals a fresh render
//                                     # exit 1 = stale, or the render could not run
//
// NO VACUOUS PASS (research Pitfall 3). With no .grugops/context tree the runnable still renders from zero
// notes and compares the committed index against that render, so a hand-written matrix fails the gate. Only
// the runnable's exit 0 is fresh: its exit 1 is STALE, and its exit 2, a run ended by a signal, or a spawn
// that failed is "could not run" and exit 1. None of those is ever reported fresh.
//
// CHECK_ROOT override: a hermetic fixture root (a temp dir holding memory-bank/plans/ and, optionally,
// .grugops/context/) is supplied through the CHECK_ROOT env var. Absent it, the gate checks this repository.
//
// WIRED IN CI. `npm run freshness:traceability` runs in the ubuntu gate block of .github/workflows/ci.yml, and
// scripts/trace-freshness.test.ts asserts that wiring and the package.json script, deliberately at both ends.
//
// Node stdlib only. Findings are written in clear professional voice (CLAUDE.md hard rule: this is a
// build-safety and trace surface).

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { TRACE_RUNNABLE_REL } from "./trace-render.js";
import { TRACE_DIR_REL, TRACEABILITY_REL } from "../install/state-layout.js";

/** The repository root: this script's parent's parent (scripts/ -> repo root). */
const ROOT = join(import.meta.dirname, "..");

/** The gate's verdict for a finished runnable. */
export type FreshnessVerdict = "fresh" | "stale" | "could-not-run";

/** What a finished `--check` run reports: its exit status, and the spawn error if it never started. */
export interface CheckResult {
  readonly status: number | null;
  readonly error?: Error | undefined;
}

/**
 * The verdict for a `--check` run. Only exit 0 is fresh and only exit 1 is stale. Exit 2, any other code,
 * no exit code (a signal) and a spawn error are "could not run": never fresh.
 */
export function freshnessVerdict(r: CheckResult): FreshnessVerdict {
  if (r.error !== undefined || r.status === null) return "could-not-run";
  if (r.status === 0) return "fresh";
  if (r.status === 1) return "stale";
  return "could-not-run";
}

// ── The gate body: runs only when this module is the process entry point (WR-04). ─────────────────
function main(): void {
  // Read at call time, so an importer that sets CHECK_ROOT before calling main() is honored.
  const root = process.env.CHECK_ROOT ?? ROOT;
  const r = spawnSync(process.execPath, [join(ROOT, TRACE_RUNNABLE_REL), root, "--check"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const verdict = freshnessVerdict(r);
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  if (verdict === "fresh") {
    console.log(
      `Traceability fresh: ${TRACEABILITY_REL} and ${TRACE_DIR_REL}/ match a fresh render from the published note refs.`,
    );
    process.exit(0);
  }
  if (verdict === "stale") {
    console.log(
      `STALE: ${TRACEABILITY_REL} or ${TRACE_DIR_REL}/ differs from a fresh render from the published note refs ` +
        "(each difference is named above). The notes are the source of truth: run `node scripts/trace-render.js` " +
        "and commit the result.",
    );
    process.exit(1);
  }
  const why =
    r.error !== undefined
      ? r.error.message
      : r.status === null
        ? `ended by signal ${String(r.signal)}`
        : `exit ${r.status}`;
  console.log(
    `Traceability freshness check FAILED: the render could not run (${why}). ` +
      "Refusing to report the trace as fresh.",
  );
  process.exit(1);
}

if (isEntrypoint(import.meta.url)) {
  main();
}
