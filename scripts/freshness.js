// freshness.ts — grugops build-output drift gate (D-02).
//
// grugops compiles its TypeScript tooling with `tsc` and commits BOTH the .ts
// source and the emitted .js, so host machines and CI run the committed .js with
// bare Node and never build. That trade only holds if the committed .js is always
// a faithful build of the committed .ts. This gate proves it: rebuild the sources
// to a throwaway temp directory, then compare each committed .js byte-for-byte
// against the freshly emitted one. Any mismatch — or a rebuild that fails to
// compile at all — is reported and the gate exits non-zero so the drift is caught
// before it ships. It is the build-output analog of the ASVS generator's
// reproducibility check (scripts/generate-asvs-checklist.mjs).
//
//   node scripts/freshness.js     # exit 0 = all committed .js fresh
//                                 # exit 1 = drift detected OR the rebuild failed
//
// Node stdlib ONLY — node:fs, node:path, node:os, node:child_process. Zero npm
// dependencies; runs with bare Node. import.meta.dirname (stable at the Node 22+
// floor) resolves the repo root from this script's location.
//
// Fail-closed (D-02 / D-10 stale-artifact mitigation): if `tsc` cannot complete a
// clean rebuild, the gate NEVER reports "fresh" — it exits non-zero. A broken build
// must never be mistaken for an up-to-date one.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule —
// this is a build-safety surface, never caveman voice).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync, } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
// The directories whose committed .js outputs are build artifacts of committed
// .ts sources. Mirrors the tsconfig "include" set (install/scripts/hooks).
const OUTPUT_DIRS = ["install", "scripts", "hooks"];
// ── Recursively collect every committed .js under a directory (skip node_modules
//    and the gitignored .tmp-build, which are not committed build outputs). ──────
function collectJs(dir, acc) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs))
        return acc;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".tmp-build")
            continue;
        const rel = join(dir, entry.name);
        if (entry.isDirectory()) {
            collectJs(rel, acc);
        }
        else if (entry.isFile() && entry.name.endsWith(".js")) {
            acc.push(rel);
        }
    }
    return acc;
}
// ── Rebuild the sources to a fresh temp dir, then compare. ───────────────────────
const tmp = mkdtempSync(join(tmpdir(), "grugops-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
// `tsc --outDir <tmp>` re-emits the whole compiled tree under <tmp>, preserving the
// install/ scripts/ hooks/ subpaths (rootDir is the repo root). A non-zero exit
// means the sources do not compile cleanly — fail closed, never report "fresh".
const build = spawnSync("npx", ["tsc", "--outDir", tmp], { cwd: ROOT, encoding: "utf8" });
if (build.status !== 0) {
    if (build.stdout)
        process.stdout.write(build.stdout);
    if (build.stderr)
        process.stderr.write(build.stderr);
    console.log("Freshness check FAILED: the rebuild did not compile cleanly — refusing to report build outputs as fresh.");
    cleanup();
    process.exit(1);
}
const committed = OUTPUT_DIRS.reduce((acc, d) => collectJs(d, acc), []);
const stale = [];
for (const rel of committed) {
    const committedPath = join(ROOT, rel);
    const rebuiltPath = join(tmp, rel);
    if (!existsSync(rebuiltPath)) {
        // A committed .js with no source-rebuilt counterpart is itself drift
        // (an orphaned or hand-authored build output).
        stale.push(rel);
        continue;
    }
    const a = readFileSync(committedPath);
    const b = readFileSync(rebuiltPath);
    if (!a.equals(b)) {
        stale.push(rel);
    }
}
cleanup();
// Normalize path separators so findings read the same on every platform.
const toPosix = (p) => p.split(sep).join("/");
if (stale.length > 0) {
    for (const rel of stale) {
        console.log(`STALE: ${toPosix(rel)} — committed build output differs from a fresh tsc rebuild. Run \`npm run build\` and commit the result.`);
    }
    console.log(`Freshness check FAILED: ${stale.length} stale build output(s) detected.`);
    process.exit(1);
}
console.log(`All build outputs fresh: ${committed.length} committed .js file(s) match a fresh tsc rebuild.`);
process.exit(0);
