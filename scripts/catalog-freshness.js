// catalog-freshness.ts — grugops browsable-docs-catalog drift gate (DOCS-02).
//
// The catalog docs/catalog/README.md is generated, never hand-maintained: it is
// committed solely as the deterministic product of scripts/generate-catalog.js.
// That contract only holds if the committed catalog stays in sync with the kit it
// documents. This gate proves it: regenerate the catalog into a throwaway temp
// mirror, then compare the committed file byte-for-byte against the fresh
// regeneration. Any mismatch — or a regeneration that fails to run cleanly at all —
// is reported and the gate exits non-zero so the drift is caught before it ships.
// It is the content analog of the build-output drift gate (scripts/freshness.ts).
//
//   node scripts/catalog-freshness.js   # exit 0 = committed catalog is fresh
//                                       # exit 1 = drift detected OR the regen failed
//
// This gate is STANDALONE — it is NOT folded into scripts/check-foundation-guards.ts
// (D-07). It is wired as its own package.json script (freshness:catalog) so a stale
// catalog fails the build red on its own.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm
// dependencies; runs with bare Node. import.meta.dirname (stable at the Node 22+
// floor) resolves the repo root from this script's location.
//
// The generator keeps its OUT a fixed literal (docs/catalog/README.md) as a
// path-traversal mitigation (ASVS V12, D-06). The gate never overrides OUT; instead
// it mirror-spawns: cpSync the generator .js and the agent-factory/roles +
// agent-factory/workflows source dirs into a temp tree, then spawnSync the mirrored
// generator so it writes to <tmp>/docs/catalog/README.md — OUT stays a fixed literal.
//
// Fail-closed (D-07 / T-18-06): if the mirrored regeneration cannot run cleanly, the
// gate NEVER reports "fresh" — it exits non-zero. A broken generator must never be
// mistaken for an up-to-date catalog.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule —
// this is a build-safety surface, never caveman voice).
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
// Unique temp mirror per run; cleaned up before every process.exit.
const tmp = mkdtempSync(join(tmpdir(), "grugops-catalog-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
// ── Mirror-spawn regeneration ────────────────────────────────────────────────────
// Lay out <tmp>/scripts/generate-catalog.js + <tmp>/agent-factory/{roles,workflows}
// + <tmp>/docs/catalog, copy the generator + its kit sources in, then run the
// mirrored generator so it writes to <tmp>/docs/catalog/README.md (OUT, a fixed
// literal joined to import.meta.dirname's parent, resolves inside the mirror).
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, "docs", "catalog"), { recursive: true });
cpSync(join(ROOT, "scripts", "generate-catalog.js"), join(tmp, "scripts", "generate-catalog.js"));
cpSync(join(ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), { recursive: true });
cpSync(join(ROOT, "agent-factory", "workflows"), join(tmp, "agent-factory", "workflows"), { recursive: true });
const r = spawnSync("node", [join(tmp, "scripts", "generate-catalog.js")], { encoding: "utf8" });
// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
    if (r.stdout)
        process.stdout.write(r.stdout);
    if (r.stderr)
        process.stderr.write(r.stderr);
    console.log("Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.");
    cleanup();
    process.exit(1);
}
// ── Byte-compare the committed catalog against the fresh regeneration ────────────
const toPosix = (p) => p.split(sep).join("/");
const committed = readFileSync(join(ROOT, "docs/catalog/README.md"));
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));
cleanup();
if (!committed.equals(rebuilt)) {
    console.log(`STALE: ${toPosix("docs/catalog/README.md")} — committed catalog differs from a fresh regeneration. Run \`npm run generate:catalog\` and commit the result.`);
    process.exit(1);
}
console.log("Catalog fresh: docs/catalog/README.md matches a fresh regeneration.");
process.exit(0);
