// freshness.test.ts — behavioral oracle for the D-02 build-output drift gate.
//
// Drives the COMMITTED compiled artifact scripts/freshness.js as a child process
// (never the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = every committed .js matches a fresh tsc rebuild ("fresh")
//   exit 1 = a committed .js drifted from source, OR the rebuild itself failed
//
// Mirrors the spawnSync child-CLI test idiom the .test.sh harnesses use today
// (node "$SCRIPT" + assert status/stdout). Vitest globals:false → import explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FRESHNESS_JS = join(ROOT, "scripts", "freshness.js");

function runFreshness() {
  return spawnSync("node", [FRESHNESS_JS], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

describe("freshness.js (D-02 build-output drift gate)", () => {
  // Test 2 plants a byte of drift into a committed .js; always restore it.
  let drifted: string | null = null;
  let original: Buffer | null = null;
  afterEach(() => {
    if (drifted && original) {
      writeFileSync(drifted, original);
      drifted = null;
      original = null;
    }
  });

  it("Test 1: exits 0 and reports fresh when committed .js matches a rebuild", () => {
    const r = runFreshness();
    expect(r.status).toBe(0);
    expect(r.stdout.toLowerCase()).toContain("fresh");
  });

  it("Test 2: exits non-zero and names the stale file on planted drift", () => {
    // Plant one byte of drift into the committed freshness.js itself.
    drifted = FRESHNESS_JS;
    original = readFileSync(FRESHNESS_JS);
    writeFileSync(FRESHNESS_JS, Buffer.concat([original, Buffer.from("\n// drift\n")]));

    const r = runFreshness();
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain("scripts/freshness.js");
  });

  it("Test 3 (fail-closed): exits non-zero if the temp rebuild fails (type error)", () => {
    // Plant a type error into a throwaway .ts under an included dir, then ensure
    // the gate never reports "fresh" on a broken build. We compile via the gate,
    // which spawns tsc; a type error makes tsc exit non-zero → gate exits non-zero.
    const badTs = join(ROOT, "scripts", "__freshness_typeerror__.ts");
    writeFileSync(badTs, "const x: number = 'not a number';\nexport {};\n");
    try {
      const r = runFreshness();
      expect(r.status).not.toBe(0);
      expect(r.stdout.toLowerCase()).not.toContain("all build outputs fresh");
    } finally {
      // Remove the planted source so it never lingers in the tree.
      rmSync(badTs, { force: true });
    }
  });
});
