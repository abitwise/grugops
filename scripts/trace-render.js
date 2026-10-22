// trace-render.ts — grugops's own trace render command (phase 37, plan 37-08, SPLIT-03, D-01).
//
// WHAT IT IS. The documented own-tree command `node scripts/trace-render.js`. It holds NO trace logic: it runs
// the committed host runnable scripts/runnable-ref/trace-render.js against this repository's root and exits
// with that program's exit code. So grugops renders its own trace with the same program a host runs from
// tools/grugops/, and the two cannot disagree about what the render is. The trace model lives once, in
// scripts/trace-model.ts; the runnable carries a generated copy of it.
//
//   node scripts/trace-render.js           # write mode: make the trace index and the trace directory
//                                          # equal a fresh render from the published note refs
//   node scripts/trace-render.js --check   # read-only: exit 0 fresh, 1 on any difference, 2 could not run
//
// WHAT IT WRITES. The runnable writes the trace index (TRACEABILITY_REL in install/state-layout.ts) and one
// trace file per ticket under the trace directory, from the notes under .grugops/context and
// .grugops/archive/context. It refuses a hand-written index or trace file and writes nothing in that case.
//
// EXIT CODES. The runnable's own: 0, 1 or 2 (see the header of scripts/runnable-ref/trace-render.ts). A run
// that ended with no exit code (a signal) or a spawn that failed is exit 2, with a line on stderr saying the
// render could not run. An argument other than a single `--check` is exit 2 before anything is spawned.
//
// Build model (D-13): node: builtins plus the state-layout constants. Authored in TypeScript, compiled with
// `tsc` to the committed scripts/trace-render.js.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this is a trace surface a human audits.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { TRACEABILITY_REL } from "../install/state-layout.js";
/** The repository root: this script's parent's parent (scripts/ -> repo root). */
const ROOT = join(import.meta.dirname, "..");
/** The committed host runnable this command runs, relative to the repository root. */
export const TRACE_RUNNABLE_REL = "scripts/runnable-ref/trace-render.js";
/**
 * The exit code this command returns for a finished runnable. The runnable's own status passes through
 * unchanged; a run with no status (killed by a signal) or a spawn error is exit 2, never a pass.
 */
export function childExitCode(r) {
    if (r.error !== undefined || r.status === null)
        return 2;
    return r.status;
}
/**
 * The runnable's arguments for this command's arguments: the repository root, then `--check` when it was
 * given. Returns null for any other argument list, which the command refuses with exit 2.
 */
export function runnableArgs(root, argv) {
    if (argv.length === 0)
        return [root];
    if (argv.length === 1 && argv[0] === "--check")
        return [root, "--check"];
    return null;
}
function main() {
    const args = runnableArgs(ROOT, process.argv.slice(2));
    if (args === null) {
        console.error("trace-render: usage: node scripts/trace-render.js [--check]");
        process.exit(2);
    }
    const r = spawnSync(process.execPath, [join(ROOT, TRACE_RUNNABLE_REL), ...args], { stdio: "inherit" });
    const code = childExitCode(r);
    if (code === 2 && (r.error !== undefined || r.status === null)) {
        const why = r.error !== undefined ? r.error.message : `ended by signal ${String(r.signal)}`;
        console.error(`trace-render: the render of ${TRACEABILITY_REL} could not run (${why}).`);
    }
    process.exit(code);
}
if (isEntrypoint(import.meta.url)) {
    main();
}
