// check-state-paths.test.ts — the old-spelling gate (scripts/check-state-paths.ts, phase 36 D-13 step 4; LAYOUT-01,
// LAYOUT-02).
//
// WHAT THIS PROVES.
//   - the live tree: the committed gate exits 0, and the outside totals it prints are zero (read from its output);
//   - one planted site per spelling outside the allow-list, in a scratch repository holding a copy of the allow-list
//     layout, exits 1 and names the site;
//   - converse (D-10): every ALLOW_LIST entry matches at least one listed file and holds at least one site, and a
//     dead entry added to a scratch copy fails the same predicate; the list's length is never pinned;
//   - boundary: zero outside sites exit 0, exactly one exits 1, and a prefix-sharing path beside a `/**` entry is
//     outside;
//   - adjacency: the new root's slash, backslash and escaped double-backslash forms leave the gate at exit 0;
//   - clause (D-15): an exact LEGACY_FALLBACK_CLAUSE outside the allow-list exits 0, and one more ordinary spelling
//     in the same file exits 1 with exactly one site;
//   - precision: two sites on one line raise the outside total by 2;
//   - empty: a cwd outside any repository, and a repository with no file, exit 2 with no ALL CHECKS PASSED line;
//   - paths: a committed file under a top-level pre-v3 directory exits 1 as a legacy path;
//   - exclusion (D-11): a site under .planning/ is not counted, and the output names the exclusion and its reason;
//   - ordering: outside sites sorted by path then line, entries in declaration order, two runs byte-identical;
//   - ownership (LAYOUT-02): among git-tracked non-test install/ and scripts/ TypeScript sources, exactly the
//     authority and the two published-text carriers hold a string literal containing STATE_ROOT_REL, and the named
//     readers, writers, validator, installer and uninstaller each import the state-layout module.
//
// EVERY PLANT IS ASSEMBLED FROM THE CONSTANTS in install/state-layout.ts, so the scan run over this file reports zero
// sites. The CLI cases spawn the COMMITTED scripts/check-state-paths.js (run `npm run build` first) by absolute path,
// with a scratch git repository under the OS temp dir as cwd, removed at the end. GIT_CEILING_DIRECTORIES keeps git
// from finding a repository above the scratch root.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { LEGACY_FALLBACK_CLAUSE, LEGACY_STATE_ROOT_REL, STATE_ROOT_REL } from "../install/state-layout.js";
import { SCAN_EXCLUSIONS, SPELLING_NAMES } from "./state-path-scan.js";
import { ALLOW_LIST, deadEntries, evaluate, matchesGlob } from "./check-state-paths.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(REPO_ROOT, "scripts", "check-state-paths.js");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-state-gate-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

const OLD = LEGACY_STATE_ROOT_REL;
const PARENT = STATE_ROOT_REL.slice(0, STATE_ROOT_REL.lastIndexOf("/"));
const BS = "\\";

/** One plant per spelling of the pre-v3 root. */
const PLANT = {
  slash: `see ${OLD}/board.md for the board`,
  segment: `join(root, "${OLD}", "board.md")`,
  backslash: `C:${BS}repo${BS}${OLD}${BS}board.md`,
} as const;

let seq = 0;
const GIT_ENV = { ...process.env, GIT_CEILING_DIRECTORIES: SCRATCH, GIT_CONFIG_NOSYSTEM: "1" };
function git(cwd: string, args: readonly string[]): void {
  execFileSync("git", ["-c", "user.name=grugops-test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    env: GIT_ENV,
    stdio: "pipe",
  });
}

/** A file path an allow-list entry matches: the exact path, or a file under the directory of a `/**` glob. */
const fileFor = (glob: string): string => (glob.endsWith("/**") ? `${glob.slice(0, -3)}/record.md` : glob);

/** The allow-list layout: one file per entry, each holding one slash site, so every entry is live. */
function allowListLayout(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const e of ALLOW_LIST) files[fileFor(e.glob)] = `${PLANT.slash}\n`;
  return files;
}

/** A scratch git repository holding the allow-list layout plus `extra` (repo-relative POSIX path → text), committed. */
function repo(extra: Readonly<Record<string, string>> = {}, layout = true): string {
  const d = join(SCRATCH, `repo-${seq++}`);
  mkdirSync(d, { recursive: true });
  git(d, ["init", "-q"]);
  const files = { ...(layout ? allowListLayout() : {}), ...extra };
  for (const [rel, text] of Object.entries(files)) {
    const p = join(d, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
  }
  git(d, ["add", "-A"]);
  git(d, ["commit", "-q", "-m", "fixture"]);
  return d;
}

interface CliRun {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}
function gate(cwd: string): CliRun {
  const r = spawnSync(process.execPath, [GATE_JS], { cwd, env: GIT_ENV, encoding: "utf8", timeout: 120_000 });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** The outside totals line, parsed: per-spelling counts, sites, files and legacy paths. */
function outsideTotals(stdout: string): { counts: Record<string, number>; sites: number; legacy: number } {
  const m = /^outside the allow-list: slash (\d+), segment (\d+), backslash (\d+); (\d+) site\(s\) in \d+ file\(s\); (\d+) legacy path\(s\)$/m.exec(stdout);
  if (m === null) throw new Error(`no outside totals line in:\n${stdout}`);
  return { counts: { slash: Number(m[1]), segment: Number(m[2]), backslash: Number(m[3]) }, sites: Number(m[4]), legacy: Number(m[5]) };
}
const ALL_PASSED = /^ALL CHECKS PASSED$/m;

describe("the live tree (LAYOUT-01, LAYOUT-02)", () => {
  it("the committed gate exits 0 and its outside totals, read from its output, are zero", () => {
    const r = gate(REPO_ROOT);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const t = outsideTotals(r.stdout);
    expect(t).toEqual({ counts: { slash: 0, segment: 0, backslash: 0 }, sites: 0, legacy: 0 });
    expect(r.stdout).toMatch(ALL_PASSED);
  });
});

describe("a planted site outside the allow-list is red", () => {
  for (const name of SPELLING_NAMES) {
    it(`one ${name} plant outside the allow-list exits 1 and names it`, () => {
      const r = gate(repo({ "docs/guide.md": `intro\n${PLANT[name]}\n` }));
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stdout).toContain(`docs/guide.md:2: ${name}`);
      const t = outsideTotals(r.stdout);
      for (const other of SPELLING_NAMES) expect(t.counts[other], other).toBe(other === name ? 1 : 0);
      expect(r.stdout).not.toMatch(ALL_PASSED);
    });
  }
});

describe("converse: every allow-list entry is live, and a dead entry is red (D-10)", () => {
  it("on the live tree, every entry matches at least one listed file and holds at least one site", () => {
    const r = evaluate(REPO_ROOT);
    for (const e of r.entries) {
      expect(e.files, `${e.entry.glob} matches no listed file`).toBeGreaterThan(0);
      expect(e.sites + e.legacyPaths, `${e.entry.glob} holds no site`).toBeGreaterThan(0);
      expect(e.entry.reason.trim(), `${e.entry.glob} gives no reason`).not.toBe("");
    }
    expect(deadEntries(r).map((e) => e.entry.glob)).toEqual([]);
    expect(r.entries.map((e) => e.entry.glob), "every entry is reported, in declaration order").toEqual(ALLOW_LIST.map((e) => e.glob));
  });

  it("control: a scratch copy with a dead entry added fails the same predicate, naming only that entry", () => {
    const d = repo({ "README.md": "no site here\n" });
    const live = evaluate(d);
    expect(deadEntries(live).map((e) => e.entry.glob), "the scratch layout itself is live").toEqual([]);
    const withDead = [
      ...ALLOW_LIST,
      { glob: "docs/never/**", reason: "control: matches no file" },
      { glob: "README.md", reason: "control: matches a file holding no site" },
    ];
    expect(deadEntries(evaluate(d, withDead)).map((e) => e.entry.glob)).toEqual(["docs/never/**", "README.md"]);
  });

  it("docs/design/shared-install.md is scanned like any other file and no entry matches it (D-16)", () => {
    const rel = "docs/design/shared-install.md";
    expect(ALLOW_LIST.some((e) => matchesGlob(e.glob, rel)), `${rel} is allow-listed`).toBe(false);
    expect(evaluate(REPO_ROOT).scan.scannedPaths).toContain(rel);
  });
});

describe("boundary (LAYOUT-02)", () => {
  it("zero outside sites exits 0; exactly one planted site exits 1", () => {
    const clean = gate(repo({ "docs/guide.md": "nothing old here\n" }));
    expect(clean.status, clean.stdout + clean.stderr).toBe(0);
    expect(outsideTotals(clean.stdout).sites).toBe(0);
    expect(clean.stdout).toMatch(ALL_PASSED);
    const one = gate(repo({ "docs/guide.md": `${PLANT.slash}\n` }));
    expect(one.status, one.stdout + one.stderr).toBe(1);
    expect(outsideTotals(one.stdout).sites).toBe(1);
  });

  it("a site in docs/audit-notes.md, which only shares a prefix with docs/audit/**, is outside", () => {
    expect(ALLOW_LIST.some((e) => e.glob === "docs/audit/**"), "PREMISE: the docs/audit/** entry exists").toBe(true);
    expect(matchesGlob("docs/audit/**", "docs/audit-notes.md")).toBe(false);
    const r = gate(repo({ "docs/audit-notes.md": `${PLANT.slash}\n` }));
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain("docs/audit-notes.md:1: slash");
  });
});

describe("adjacency: the new root is never counted (LAYOUT-02)", () => {
  it("the new root in its slash, backslash and escaped double-backslash forms, outside the allow-list, exits 0", () => {
    const text = [
      `see ${STATE_ROOT_REL}/board.md for the board`,
      `C:${BS}repo${BS}${PARENT}${BS}${OLD}${BS}board.md`,
      `"C:${BS}${BS}repo${BS}${BS}${PARENT}${BS}${BS}${OLD}${BS}${BS}board.md"`,
    ].join("\n");
    const r = gate(repo({ "docs/new-layout.md": `${text}\n` }));
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(outsideTotals(r.stdout).sites).toBe(0);
  });
});

describe("clause subtraction (D-15)", () => {
  it("a file outside the allow-list holding LEGACY_FALLBACK_CLAUSE exactly exits 0", () => {
    const r = gate(repo({ "docs/carrier.md": `Kit vs state.\n${LEGACY_FALLBACK_CLAUSE}\n` }));
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/^fallback clause: 1 exact occurrence\(s\)/m);
  });

  it("the same file plus one ordinary old spelling exits 1 and reports exactly 1 site", () => {
    const r = gate(repo({ "docs/carrier.md": `Kit vs state.\n${LEGACY_FALLBACK_CLAUSE}\n${PLANT.slash}\n` }));
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(outsideTotals(r.stdout).sites).toBe(1);
    expect(r.stdout).toContain("docs/carrier.md:3: slash");
  });
});

describe("precision: occurrence counts, not line counts", () => {
  it("two sites on one line raise the outside total by 2", () => {
    const before = gate(repo({ "docs/guide.md": "plain\n" }));
    const after = gate(repo({ "docs/guide.md": `${PLANT.slash} and ${PLANT.slash}\n` }));
    expect(after.status, after.stdout + after.stderr).toBe(1);
    expect(outsideTotals(after.stdout).sites - outsideTotals(before.stdout).sites).toBe(2);
    expect(after.stdout.split("\n").filter((l) => l === "docs/guide.md:1: slash")).toHaveLength(2);
  });
});

describe("empty: could not run is never a pass (exit 2)", () => {
  it("a cwd that is not a git repository exits 2 and prints no ALL CHECKS PASSED line", () => {
    const d = join(SCRATCH, `not-a-repo-${seq++}`);
    mkdirSync(d, { recursive: true });
    const r = gate(d);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).not.toMatch(ALL_PASSED);
    expect(r.stdout).toContain("COULD NOT RUN");
  });

  it("a repository with no file exits 2 and prints no ALL CHECKS PASSED line", () => {
    const d = join(SCRATCH, `empty-repo-${seq++}`);
    mkdirSync(d, { recursive: true });
    git(d, ["init", "-q"]);
    const r = gate(d);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).not.toMatch(ALL_PASSED);
    expect(r.stdout).toContain("the scan set is empty");
  });
});

describe("paths: a tracked path under a pre-v3 directory", () => {
  it("a committed file under a top-level pre-v3 directory exits 1 and is reported as a legacy path", () => {
    const rel = `${OLD}/notes.txt`;
    const r = gate(repo({ [rel]: "no site in the text\n" }));
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`legacy path: ${rel}`);
    expect(outsideTotals(r.stdout)).toEqual({ counts: { slash: 0, segment: 0, backslash: 0 }, sites: 0, legacy: 1 });
  });
});

describe("exclusion: .planning/ is named, not silently skipped (D-11)", () => {
  it("a site under .planning/ is not counted, and the output names the exclusion and its reason", () => {
    const planning = SCAN_EXCLUSIONS.find((x) => x.prefix === ".planning/");
    expect(planning, "PREMISE: the .planning/ exclusion exists").toBeDefined();
    const r = gate(repo({ ".planning/notes.md": `${PLANT.slash}\n` }));
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(outsideTotals(r.stdout).sites).toBe(0);
    expect(r.stdout).toContain(`excluded: .planning/ (${(planning as { reason: string }).reason}): 1 file(s) skipped`);
  });
});

describe("ordering: two runs over one tree print identical output", () => {
  it("outside sites sort by path then line, entries print in declaration order, and two runs match byte for byte", () => {
    const d = repo({ "docs/b.md": `${PLANT.slash}\nplain\n${PLANT.segment}\n`, "docs/a.md": `plain\n${PLANT.backslash}\n` });
    const first = gate(d);
    const second = gate(d);
    expect(first.status).toBe(1);
    expect(second.stdout).toBe(first.stdout);
    const sites = first.stdout.split("\n").filter((l) => /^docs\/[ab]\.md:\d+: /.test(l));
    expect(sites).toEqual(["docs/a.md:2: backslash", "docs/b.md:1: slash", "docs/b.md:3: segment"]);
    const entryAt = ALLOW_LIST.map((e) => first.stdout.indexOf(`\n  ${e.glob}: `));
    for (const [i, at] of entryAt.entries()) expect(at, `${ALLOW_LIST[i].glob} is not printed`).toBeGreaterThan(-1);
    expect([...entryAt].sort((a, b) => a - b), "entries print in declaration order").toEqual(entryAt);
  });
});

// ── LAYOUT-02 ownership: who spells the new state root, and who imports the authority ─────────────────────────

/**
 * The git-tracked non-test TypeScript sources under install/ and scripts/ (git pathspecs, so nested directories
 * count). Excluded: `.test.ts`, `.test-support.ts` and `.d.ts` files, and `/fixtures/` corpus files, which are data a
 * checker parses rather than tooling (tsconfig.json excludes them from emit).
 */
function ownershipSources(): string[] {
  const out = execFileSync("git", ["-C", REPO_ROOT, "ls-files", "-z", "--", "install/*.ts", "scripts/*.ts"], { encoding: "utf8" });
  return out
    .split("\0")
    .filter((p) => p !== "" && !/\.test\.ts$|\.test-support\.ts$|\.d\.ts$/.test(p) && !p.split("/").includes("fixtures"))
    .sort();
}

/** True when `text` holds a string literal, a no-substitution template, or a template head, middle or tail containing `needle`. */
function holdsLiteral(fileName: string, text: string, needle: string): boolean {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found = false;
  const walk = (n: ts.Node): void => {
    if (found) return;
    if (
      (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) &&
      n.text.includes(needle)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return found;
}

/** True when `text` has an import declaration whose module specifier ends in state-layout.js. */
function importsStateLayout(fileName: string, text: string): boolean {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return sf.statements.some(
    (st) => ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.moduleSpecifier.text.endsWith("state-layout.js"),
  );
}

/** The authority plus the two published-text carriers kept import-free for the hand-listed freshness mirrors. */
const STATE_ROOT_HOLDERS = ["install/state-layout.ts", "scripts/generate-role-adapters.ts", "scripts/kit-model.ts"];
/** The readers, writers, validator, installer and uninstaller that must read the authority. */
const AUTHORITY_IMPORTERS = [
  "install/install.ts",
  "install/uninstall.ts",
  "scripts/board-read.ts",
  "scripts/board-model.ts",
  "scripts/validate-agent-factory.ts",
  "scripts/trace-render.ts",
  "scripts/trace-freshness.ts",
  "scripts/board-corpus.ts",
  "scripts/check-imperative-lexicon.ts",
];

describe("ownership: the new state root is spelled only by its authority and two declared carriers (LAYOUT-02)", () => {
  const sources = ownershipSources();
  const read = (rel: string): string => readFileSync(join(REPO_ROOT, ...rel.split("/")), "utf8");

  it("PREMISE: the derived source set is not empty and holds every named module", () => {
    expect(sources.length, "git listed no source").toBeGreaterThan(STATE_ROOT_HOLDERS.length + AUTHORITY_IMPORTERS.length);
    for (const rel of [...STATE_ROOT_HOLDERS, ...AUTHORITY_IMPORTERS]) expect(sources, `${rel} is not a tracked source`).toContain(rel);
  });

  it("the modules holding a string literal that contains STATE_ROOT_REL are exactly the three, in both directions", () => {
    const holders = sources.filter((rel) => holdsLiteral(rel, read(rel), STATE_ROOT_REL));
    expect(holders).toEqual([...STATE_ROOT_HOLDERS].sort());
  });

  it("control: the literal predicate sees a plain string, a template part and a split-free spelling, and ignores a comment", () => {
    expect(holdsLiteral("a.ts", `const x = "${STATE_ROOT_REL}/board.md";`, STATE_ROOT_REL)).toBe(true);
    expect(holdsLiteral("b.ts", `const x = \`\${root}/${STATE_ROOT_REL}/\${name}\`;`, STATE_ROOT_REL)).toBe(true);
    expect(holdsLiteral("c.ts", `// ${STATE_ROOT_REL}/board.md\nconst x = 1;`, STATE_ROOT_REL)).toBe(false);
  });

  it("each named reader, writer, validator, installer and uninstaller imports the state-layout module", () => {
    const missing = AUTHORITY_IMPORTERS.filter((rel) => !importsStateLayout(rel, read(rel)));
    expect(missing, "these modules do not import from a specifier ending in state-layout.js").toEqual([]);
  });

  it("control: the import predicate refuses a module that only names the specifier in a comment or a string", () => {
    expect(importsStateLayout("a.ts", `import { STATE_ROOT_REL } from "../install/state-layout.js";`)).toBe(true);
    expect(importsStateLayout("b.ts", `// import from "../install/state-layout.js"\nconst s = "../install/state-layout.js";`)).toBe(false);
  });
});
