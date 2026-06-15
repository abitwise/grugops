// catalog-freshness.test.ts — behavioral oracle for the DOCS-02 catalog drift gate.
//
// Drives the COMMITTED compiled artifact scripts/catalog-freshness.js as a child
// process (never the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = committed docs/catalog/README.md matches a fresh regeneration ("fresh")
//   exit 1 = the committed catalog drifted from a fresh regen, OR the regen itself failed
//
// Mirrors scripts/freshness.test.ts: spawn the committed .js, assert status/stdout,
// plant-and-restore the committed file under an afterEach guard, and force a broken
// regeneration for the fail-closed case. Vitest globals:false → import explicitly.
//
// Ships RED until Task 2 lands the committed catalog-freshness.js (correct Wave-0
// test-first sequencing).

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "catalog-freshness.js");
const CATALOG = join(ROOT, "docs", "catalog", "README.md");

function runFreshness() {
  return spawnSync("node", [FRESHNESS_JS], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

describe("catalog-freshness.js (DOCS-02 catalog drift gate)", () => {
  // Test 2 plants a byte of drift into the committed catalog; always restore it.
  let drifted: string | null = null;
  let original: Buffer | null = null;
  afterEach(() => {
    if (drifted && original) {
      writeFileSync(drifted, original);
      drifted = null;
      original = null;
    }
  });

  it("Test 1: exits 0 and reports fresh when the committed catalog matches a regeneration", () => {
    const r = runFreshness();
    expect(r.status).toBe(0);
    expect(r.stdout.toLowerCase()).toContain("fresh");
  });

  it("Test 2: exits non-zero and names the catalog file on planted drift", () => {
    // Plant one byte of drift into the committed catalog itself.
    drifted = CATALOG;
    original = readFileSync(CATALOG);
    writeFileSync(CATALOG, Buffer.concat([original, Buffer.from("\n<!-- drift -->\n")]));

    const r = runFreshness();
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain("docs/catalog/README.md");
  });

  it("Test 3 (fail-closed): exits non-zero if the mirrored regeneration fails", () => {
    // Plant a non-conforming role file (no `# Role:` H1) into the real kit. The gate
    // cpSyncs agent-factory/roles into its temp mirror, so the mirrored generator
    // rejects it (fail-closed, exit 1) and the gate must refuse to report "fresh".
    // The filename must NOT start with `_` — the generator's D-03 underscore filter
    // would silently drop it, so the regen would succeed and never exercise the gate.
    const badRole = join(ROOT, "agent-factory", "roles", "zzz-catalog-freshness-badrole.md");
    writeFileSync(badRole, "---\nkind: role\ntier: core\n---\n\nNo H1 here.\n");
    try {
      const r = runFreshness();
      expect(r.status).not.toBe(0);
      // The success-only marker — distinct from the "Catalog freshness check FAILED"
      // fail-closed message, which also contains the substring "catalog fresh".
      expect(r.stdout.toLowerCase()).not.toContain("matches a fresh regeneration");
    } finally {
      // Remove the planted source so it never lingers in the tree.
      rmSync(badRole, { force: true });
    }
  });
});
