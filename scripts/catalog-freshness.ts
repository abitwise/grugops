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

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}

// ── Mirror-spawn regeneration ────────────────────────────────────────────────────
// Lay out <tmp>/scripts/{generate-catalog,frontmatter,kit-model}.js + <tmp>/agent-factory/
// {roles,workflows} + <tmp>/docs/catalog, copy the generator, its import closure and
// its kit sources in, then run the mirrored generator so it writes to
// <tmp>/docs/catalog/README.md (OUT, a fixed literal joined to import.meta.dirname's
// parent, resolves inside the mirror).
//
// THE TWIN LIST IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. `frontmatter.js`
// joined it in plan 29-35, when the generator's private section-extent grammar was
// deleted and the question moved onto the one authority (LANG-07 / WR-08). `kit-model.js`
// joined it in plan 29-54, when the generator's hand-copied copy of the workflow
// membership rule was deleted and that question moved onto the kit authority (IN-01).
// Both entries arrived by the same route, and it is the route this list must keep
// tracking: deleting a private grammar from the generator ADDS a file here. The list is
// hand-written rather than derived, matching the recorded trade in
// scripts/adapters-freshness.ts: deriving it would mean writing a grammar for "what does
// this module import" inside a build-safety gate, which is a second grammar of exactly
// the kind this milestone deletes. The trade is only acceptable because the failure
// direction is LOUD, and it was measured before this line was written: with the import
// unmirrored the child dies on ERR_MODULE_NOT_FOUND and the fail-closed branch below
// reports "the generator did not run cleanly" and exits 1. This gate can never report
// "fresh" while it is one file short.
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, "docs", "catalog"), { recursive: true });
cpSync(
  join(ROOT, "scripts", "generate-catalog.js"),
  join(tmp, "scripts", "generate-catalog.js"),
);
cpSync(
  join(ROOT, "scripts", "frontmatter.js"),
  join(tmp, "scripts", "frontmatter.js"),
);
cpSync(
  join(ROOT, "scripts", "kit-model.js"),
  join(tmp, "scripts", "kit-model.js"),
);
cpSync(
  join(ROOT, "agent-factory", "roles"),
  join(tmp, "agent-factory", "roles"),
  { recursive: true },
);
cpSync(
  join(ROOT, "agent-factory", "workflows"),
  join(tmp, "agent-factory", "workflows"),
  { recursive: true },
);

const r = spawnSync(
  "node",
  [join(tmp, "scripts", "generate-catalog.js")],
  { encoding: "utf8" },
);

// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log(
    "Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.",
  );
  cleanup();
  process.exit(1);
}

// ── Byte-compare the committed catalog against the fresh regeneration ────────────
const toPosix = (p: string): string => p.split(sep).join("/");
let committed: Buffer;
try {
  committed = readFileSync(join(ROOT, "docs/catalog/README.md"));
} catch {
  // Fail-closed: if the committed catalog cannot be read (e.g. it is missing), we
  // cannot prove freshness — clean up the temp mirror and report, never fall through
  // to "fresh".
  cleanup();
  console.log(
    `Catalog freshness check FAILED: ${toPosix("docs/catalog/README.md")} could not be read — run \`npm run generate:catalog\` and commit it.`,
  );
  process.exit(1);
}
const rebuilt = readFileSync(join(tmp, "docs/catalog/README.md"));

cleanup();

if (!committed.equals(rebuilt)) {
  console.log(
    `STALE: ${toPosix("docs/catalog/README.md")} — committed catalog differs from a fresh regeneration. Run \`npm run generate:catalog\` and commit the result.`,
  );
  process.exit(1);
}

console.log(
  "Catalog fresh: docs/catalog/README.md matches a fresh regeneration.",
);
process.exit(0);
