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
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { PLUGIN_SKILL_ADAPTER_COUNT, ROLE_COUNT } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "catalog-freshness.js");
const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

// The judged inputs a mirror carries: the generator's data (the kit roles and workflows, the plugin skills,
// the standalone skill twins and the plugin manifest's directory) and the committed reference tree.
const MIRRORED_DIRS = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "skills",
  ".claude/skills",
  ".claude-plugin",
  "docs/reference",
] as const;
const FRESH_MARKER = "Reference fresh:";
// The page total: the index, one page per role and one page per plugin skill (plan 43-05, D-15, D-16).
const PAGE_TOTAL = 1 + ROLE_COUNT + PLUGIN_SKILL_ADAPTER_COUNT;

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

// Every regular file under `dir`, by POSIX relative path, with its bytes (lstat; links never followed).
function snapshot(dir: string): Map<string, Buffer> {
  const snap = new Map<string, Buffer>();
  const walk = (rel: string): void => {
    const abs = rel === "" ? dir : at(dir, rel);
    const st = lstatSync(abs);
    if (st.isDirectory()) {
      for (const n of readdirSync(abs).sort()) walk(rel === "" ? n : `${rel}/${n}`);
    } else if (st.isFile()) {
      snap.set(rel, readFileSync(abs));
    }
  };
  walk("");
  return snap;
}
function sameSnapshot(a: Map<string, Buffer>, b: Map<string, Buffer>): boolean {
  return a.size === b.size && [...a].every(([rel, bytes]) => b.get(rel)?.equals(bytes) === true);
}

// The gate's temp-mirror prefix, RECOVERED from the committed .js rather than restated, so the leftover
// assertion cannot become vacuous when the gate renames its directory.
const GATE_TMP_PREFIX = ((): string => {
  const m = readFileSync(GATE_JS, "utf8").match(/mkdtempSync\(join\(tmpdir\(\),\s*"([^"]+)"\)\)/);
  if (m === null) throw new Error("scripts/catalog-freshness.js: could not recover the temp-mirror prefix");
  return m[1];
})();
const gateTempEntries = (): string[] => readdirSync(tmpdir()).filter((n) => n.startsWith(GATE_TMP_PREFIX));

describe("catalog-freshness.js (the reference-tree freshness gate)", () => {
  it(`green on the committed tree: compared ${PAGE_TOTAL} page(s) (the index, one page per role and one per plugin skill), 0 difference(s)`, () => {
    const r = runGate();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain(`compared ${PAGE_TOTAL} page(s), 0 difference(s)`);
  });

  it("P0 (premise control): the unmutated mirror is fresh, so every red below is the plant's", () => {
    const r = runGate(mirror());
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`compared ${PAGE_TOTAL} page(s), 0 difference(s)`);
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


  // ── The failure arms (plan 43-04 Task 2): each plant lands in a mirror, and each red is named ─────
  function runRed(kitRoot: string, gateJs?: string) {
    const r = runGate(kitRoot, gateJs);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    return r;
  }

  it("EXTRA: a page planted at docs/reference/agents/zzz-extra.md is named", () => {
    const m = mirror();
    writeFileSync(at(m, "docs/reference/agents/zzz-extra.md"), "# Extra\n");
    const r = runRed(m);
    expect(r.stdout).toContain("EXTRA: docs/reference/agents/zzz-extra.md");
  });

  it("MISSING: a deleted role page is named", () => {
    const m = mirror();
    rmSync(at(m, "docs/reference/agents/orchestrator.md"));
    const r = runRed(m);
    expect(r.stdout).toContain("MISSING: docs/reference/agents/orchestrator.md");
  });

  it("MISSING: a tree with no docs/reference/ at all names every page and compares none", () => {
    const m = mirror();
    rmSync(at(m, "docs/reference"), { recursive: true, force: true });
    const r = runRed(m);
    expect(r.stdout).toContain("MISSING: docs/reference/README.md");
    expect(r.stdout).toContain(`compared 0 page(s), ${PAGE_TOTAL} difference(s)`);
  });

  it("MISSING: a deleted skill page is named (plan 43-05)", () => {
    const m = mirror();
    rmSync(at(m, "docs/reference/skills/gate.md"), { force: true });
    const r = runRed(m);
    expect(r.stdout).toContain("MISSING: docs/reference/skills/gate.md");
  });

  it("a data source that did not land is refused by name: no plugin skills directory (plan 43-05)", () => {
    const m = mirror();
    rmSync(at(m, "skills"), { recursive: true, force: true });
    const r = runRed(m);
    expect(r.stdout).toContain("did not land in the mirror");
    expect(r.stdout).toMatch(/data source\(s\) [^\n]*\bskills\b/);
  });

  it("a data source that did not land is refused by name: no plugin manifest (plan 43-05)", () => {
    const m = mirror();
    rmSync(at(m, ".claude-plugin/plugin.json"), { force: true });
    const r = runRed(m);
    expect(r.stdout).toContain("did not land in the mirror");
    expect(r.stdout).toContain(".claude-plugin/plugin.json");
  });

  it("a link at a page path is never read through: named as not a regular file", () => {
    const m = mirror();
    const page = at(m, "docs/reference/agents/orchestrator.md");
    const target = at(m, "elsewhere.md");
    cpSync(page, target);
    unlinkSync(page);
    symlinkSync(target, page);
    const r = runRed(m);
    expect(r.stdout).toContain("STALE: docs/reference/agents/orchestrator.md — the committed page is not a regular file");
  });

  it("broken regeneration (a planted role with no H1): FAILED, never fresh, and every committed page byte-unchanged", () => {
    const m = mirror();
    writeFileSync(at(m, "agent-factory/roles/zzz-badrole.md"), "---\nkind: role\ntier: core\n---\n\nNo H1 here.\n");
    const before = snapshot(at(m, "docs/reference"));
    expect(before.size, "PREMISE: the mirror carries the committed pages").toBe(PAGE_TOTAL);
    const r = runRed(m);
    expect(r.stdout).toContain("Reference freshness check FAILED: the generator did not run cleanly");
    expect(r.stderr).toContain("zzz-badrole.md: no `# Role:` H1");
    expect(sameSnapshot(snapshot(at(m, "docs/reference")), before)).toBe(true);
  });

  // A script root of its own: the committed gate, the generator's import closure and a package.json, with the
  // generator replaced by a stub. The gate's own modules still load, so the only thing that changes is what the
  // regeneration writes.
  function fakeRoot(stub: string): string {
    const fake = scratch("grugops-reference-fakeroot-");
    for (const rel of ["scripts/catalog-freshness.js", "scripts/js-import-closure.js", "scripts/kit-model.js", "scripts/frontmatter.js"]) {
      mkdirSync(dirname(at(fake, rel)), { recursive: true });
      cpSync(at(ROOT, rel), at(fake, rel));
    }
    writeFileSync(at(fake, "package.json"), '{ "type": "module" }\n');
    // The gate's import walk loads its parser from node_modules relative to its own location.
    symlinkSync(join(ROOT, "node_modules"), at(fake, "node_modules"), "dir");
    writeFileSync(at(fake, "scripts/generate-catalog.js"), stub);
    return at(fake, "scripts/catalog-freshness.js");
  }

  it("zero pages: a regeneration that exits 0 having written nothing is refused, never compared", () => {
    const gate = fakeRoot("process.exit(0);\n");
    const r = runRed(mirror(), gate);
    expect(r.stdout).toContain("wrote no page into the mirror");
  });

  it("ROLE_COUNT, two-sided: a regeneration that writes one role page too few is refused", () => {
    const stub = [
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import { join } from "node:path";',
      'const out = join(import.meta.dirname, "..", "docs", "reference");',
      'mkdirSync(join(out, "agents"), { recursive: true });',
      'writeFileSync(join(out, "README.md"), "x\\n");',
      `for (let i = 0; i < ${ROLE_COUNT - 1}; i += 1) writeFileSync(join(out, "agents", "r" + i + ".md"), "x\\n");`,
      "",
    ].join("\n");
    const r = runRed(mirror(), fakeRoot(stub));
    expect(r.stdout).toContain(`wrote ${ROLE_COUNT - 1} page(s) under docs/reference/agents/, expected exactly ROLE_COUNT = ${ROLE_COUNT}`);
  });

  it("ROLE_COUNT, two-sided: a regeneration that writes one role page too many is refused", () => {
    const stub = [
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import { join } from "node:path";',
      'const out = join(import.meta.dirname, "..", "docs", "reference");',
      'mkdirSync(join(out, "agents"), { recursive: true });',
      'writeFileSync(join(out, "README.md"), "x\\n");',
      `for (let i = 0; i < ${ROLE_COUNT + 1}; i += 1) writeFileSync(join(out, "agents", "r" + i + ".md"), "x\\n");`,
      "",
    ].join("\n");
    const r = runRed(mirror(), fakeRoot(stub));
    expect(r.stdout).toContain(`wrote ${ROLE_COUNT + 1} page(s) under docs/reference/agents/, expected exactly ROLE_COUNT = ${ROLE_COUNT}`);
  });

  // A stub that writes the index, exactly ROLE_COUNT role pages and `skills` skill pages, so the role check
  // passes and only the skill count can refuse (plan 43-05, D-16, D-17).
  const skillStub = (skills: number): string =>
    [
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import { join } from "node:path";',
      'const out = join(import.meta.dirname, "..", "docs", "reference");',
      'mkdirSync(join(out, "agents"), { recursive: true });',
      'mkdirSync(join(out, "skills"), { recursive: true });',
      'writeFileSync(join(out, "README.md"), "x\\n");',
      `for (let i = 0; i < ${ROLE_COUNT}; i += 1) writeFileSync(join(out, "agents", "r" + i + ".md"), "x\\n");`,
      `for (let i = 0; i < ${skills}; i += 1) writeFileSync(join(out, "skills", "s" + i + ".md"), "x\\n");`,
      "",
    ].join("\n");

  it("PLUGIN_SKILL_ADAPTER_COUNT, two-sided: a regeneration that writes one skill page too few is refused", () => {
    const r = runRed(mirror(), fakeRoot(skillStub(PLUGIN_SKILL_ADAPTER_COUNT - 1)));
    expect(r.stdout).toContain(
      `wrote ${PLUGIN_SKILL_ADAPTER_COUNT - 1} page(s) under docs/reference/skills/, expected exactly PLUGIN_SKILL_ADAPTER_COUNT = ${PLUGIN_SKILL_ADAPTER_COUNT}`,
    );
  });

  it("PLUGIN_SKILL_ADAPTER_COUNT, two-sided: a regeneration that writes one skill page too many is refused", () => {
    const r = runRed(mirror(), fakeRoot(skillStub(PLUGIN_SKILL_ADAPTER_COUNT + 1)));
    expect(r.stdout).toContain(
      `wrote ${PLUGIN_SKILL_ADAPTER_COUNT + 1} page(s) under docs/reference/skills/, expected exactly PLUGIN_SKILL_ADAPTER_COUNT = ${PLUGIN_SKILL_ADAPTER_COUNT}`,
    );
  });

  it("no leftovers: a run that refuses (no role directory in the judged tree) still removes its temp mirror", () => {
    const m = mirror();
    rmSync(at(m, "agent-factory/roles"), { recursive: true, force: true });
    const before = new Set(gateTempEntries());
    const r = runRed(m);
    expect(r.stdout).toContain("did not land in the mirror");
    expect(gateTempEntries().filter((n) => !before.has(n))).toEqual([]);
    // Anti-vacuity: the leftover filter must be able to see a directory carrying the gate's prefix.
    const sentinel = mkdtempSync(join(tmpdir(), GATE_TMP_PREFIX));
    try {
      expect(gateTempEntries()).toContain(basename(sentinel));
    } finally {
      rmSync(sentinel, { recursive: true, force: true });
    }
  });

  it("wired: package.json keeps the freshness:catalog script, which CI runs", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["freshness:catalog"]).toContain("node scripts/catalog-freshness.js");
    expect(readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8")).toContain("npm run freshness:catalog");
  });
});
