// catalog-freshness.test.ts — behavioral oracle for the reference-tree freshness gate (DOCS-02; plan 43-04,
// D-16, D-17).
//
// Drives the COMMITTED compiled artifact scripts/catalog-freshness.js as a child process (never the .ts) and
// asserts the exit-code-as-signal contract:
//   exit 0 = every page under docs/reference/ equals a fresh regeneration, byte for byte and member for member
//   exit 1 = a page is MISSING, EXTRA or STALE, a committed page is not a regular file, OR the regeneration
//            itself did not run cleanly
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree. The gate honours CHECK_ROOT for the
// judged tree (the role and workflow sources it regenerates from, and the committed docs/reference/ it compares),
// so each case copies those into its own realpath'd temp mirror, mutates that, and points the gate at it. Other
// plans run gates over the same checkout, so a plant in the real tree could turn their runs red.
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROLE_COUNT } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "catalog-freshness.js");
const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

// The judged inputs a mirror carries: the two kit source directories and the committed reference tree.
const MIRRORED_DIRS = ["agent-factory/roles", "agent-factory/workflows", "docs/reference"] as const;
const FRESH_MARKER = "Reference fresh:";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function scratch(prefix: string): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  tmpDirs.push(d);
  return d;
}

function mirror(): string {
  const m = scratch("grugops-reference-test-");
  for (const rel of MIRRORED_DIRS) {
    mkdirSync(at(m, rel), { recursive: true });
    cpSync(at(ROOT, rel), at(m, rel), { recursive: true });
  }
  return m;
}

// Spawn the gate. With no kit root it judges the real tree; with one it judges that mirror.
function runGate(kitRoot?: string, gateJs: string = GATE_JS) {
  const env = { ...process.env };
  if (kitRoot) env.CHECK_ROOT = kitRoot;
  else delete env.CHECK_ROOT;
  return spawnSync(process.execPath, [gateJs], { cwd: ROOT, encoding: "utf8", env });
}

describe("catalog-freshness.js (the reference-tree freshness gate)", () => {
  it(`green on the committed tree: compared ${ROLE_COUNT + 1} page(s) (the index and one page per role), 0 difference(s)`, () => {
    const r = runGate();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain(`compared ${ROLE_COUNT + 1} page(s), 0 difference(s)`);
  });

  it("P0 (premise control): the unmutated mirror is fresh, so every red below is the plant's", () => {
    const r = runGate(mirror());
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`compared ${ROLE_COUNT + 1} page(s), 0 difference(s)`);
  });

  it("STALE: one byte of drift planted in docs/reference/README.md is named, and no fresh line is printed", () => {
    const m = mirror();
    const index = at(m, "docs/reference/README.md");
    writeFileSync(index, Buffer.concat([readFileSync(index), Buffer.from("\n<!-- drift -->\n")]));
    const r = runGate(m);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("STALE: docs/reference/README.md");
    expect(r.stdout).toContain("compared ");
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("wired: package.json keeps the freshness:catalog script, which CI runs", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["freshness:catalog"]).toContain("node scripts/catalog-freshness.js");
    expect(readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8")).toContain("npm run freshness:catalog");
  });
});
