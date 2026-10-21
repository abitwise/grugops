// state-path-scan.test.ts — the counting core of the old-spelling gate (scripts/state-path-scan.ts, phase 36 D-10,
// D-11, D-15; the wired gate is plan 36-14's).
//
// WHAT THIS PROVES.
//   - each of the three spellings of the pre-v3 state root (slash, quoted segment, backslash) is counted once per
//     occurrence, and two sites on one line count two;
//   - the new root's spellings (the parent of the state root, then the pre-v3 root name, in the slash, backslash and
//     escaped double-backslash forms) are never counted, while the same plants without the parent are;
//   - exact occurrences of LEGACY_FALLBACK_CLAUSE are subtracted and nothing else is: the clause with one character
//     changed is counted;
//   - a tracked path under a top-level pre-v3 directory is reported as a legacy path; the same path under the new
//     root is not;
//   - .planning/ is never read and the output names the exclusion with its reason;
//   - a pathspec that matches no file, and a run outside a git repository, exit 2 and print no pass line;
//   - sites print sorted by path, then line, then spelling order, and two runs print the same bytes.
//
// EVERY PLANT IS ASSEMBLED FROM THE CONSTANTS. This file spells the pre-v3 root nowhere: each plant is built from
// LEGACY_STATE_ROOT_REL and STATE_ROOT_REL, so the scan run over this file reports zero sites.
//
// The CLI cases spawn the COMMITTED scripts/state-path-scan.js (run `npm run build` first) by absolute path, with a
// scratch git repository under the OS temp dir as cwd, removed at the end. GIT_CEILING_DIRECTORIES keeps git from
// finding a repository above the scratch root.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { LEGACY_FALLBACK_CLAUSE, LEGACY_STATE_ROOT_REL, STATE_ROOT_REL } from "../install/state-layout.js";
import { SCAN_EXCLUSIONS, SPELLING_NAMES, countSpellings, legacyPathHit, scanTracked, spellingPatterns } from "./state-path-scan.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const SCAN_JS = join(REPO_ROOT, "scripts", "state-path-scan.js");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-state-scan-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

const OLD = LEGACY_STATE_ROOT_REL;
const PARENT = STATE_ROOT_REL.slice(0, STATE_ROOT_REL.lastIndexOf("/"));
const BS = "\\";

/** One plant per spelling, without the new root's parent. */
const PLANT = {
  slash: `see ${OLD}/board.md for the board`,
  segment: `join(root, "${OLD}", "board.md")`,
  backslash: `C:${BS}repo${BS}${OLD}${BS}board.md`,
} as const;

/** The same plants under the new root: slash, backslash and the escaped double-backslash form. */
const NEW_PLANTS = [
  `see ${PARENT}/${OLD}/board.md for the board`,
  `C:${BS}repo${BS}${PARENT}${BS}${OLD}${BS}board.md`,
  `"C:${BS}${BS}repo${BS}${BS}${PARENT}${BS}${BS}${OLD}${BS}${BS}board.md"`,
];

let seq = 0;
const GIT_ENV = { ...process.env, GIT_CEILING_DIRECTORIES: SCRATCH, GIT_CONFIG_NOSYSTEM: "1" };
function git(cwd: string, args: readonly string[]): void {
  execFileSync("git", ["-c", "user.name=grugops-test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    env: GIT_ENV,
    stdio: "pipe",
  });
}
/** A scratch git repository holding `files` (repo-relative POSIX path → text), committed. */
function repo(files: Readonly<Record<string, string>>): string {
  const d = join(SCRATCH, `repo-${seq++}`);
  mkdirSync(d, { recursive: true });
  git(d, ["init", "-q"]);
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
function scan(cwd: string, pathspecs: readonly string[] = []): CliRun {
  const r = spawnSync(process.execPath, [SCAN_JS, ...pathspecs], { cwd, env: GIT_ENV, encoding: "utf8", timeout: 60_000 });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}
const siteLines = (stdout: string): string[] => stdout.split("\n").filter((l) => /^\S.*:\d+: (slash|segment|backslash)$/.test(l));
const PASS_LINE = /^PASS\b/m;

describe("the three spellings come from the constants (D-10)", () => {
  it("SPELLING_NAMES is slash, segment, backslash in that order", () => {
    expect([...SPELLING_NAMES]).toEqual(["slash", "segment", "backslash"]);
  });

  it("spellingPatterns returns fresh global patterns on every call", () => {
    const a = spellingPatterns();
    const b = spellingPatterns();
    for (const name of SPELLING_NAMES) {
      expect(a[name].flags, name).toContain("g");
      expect(a[name], name).not.toBe(b[name]);
    }
  });

  for (const name of SPELLING_NAMES) {
    it(`a ${name} plant is counted once, and only as ${name}`, () => {
      const c = countSpellings(`${PLANT[name]}\n`);
      for (const other of SPELLING_NAMES) expect(c.totals[other], `${name} plant counted as ${other}`).toBe(other === name ? 1 : 0);
      expect(c.sites).toEqual([{ line: 1, spelling: name }]);
    });
  }

  it("each plant under the new root is never counted", () => {
    for (const text of NEW_PLANTS) {
      const c = countSpellings(text);
      expect(c.totals, text).toEqual({ slash: 0, segment: 0, backslash: 0 });
    }
  });

  it("the same plants without the new root's parent are each counted once", () => {
    for (const text of NEW_PLANTS) {
      const bare = text.split(`${PARENT}/`).join("").split(`${PARENT}${BS}${BS}`).join("").split(`${PARENT}${BS}`).join("");
      expect(bare, "the plant did not lose its parent").not.toContain(PARENT);
      const c = countSpellings(bare);
      expect(c.totals.slash + c.totals.segment + c.totals.backslash, bare).toBe(1);
    }
  });

  it("counts occurrences, not lines: two slash sites on one line count 2", () => {
    const c = countSpellings(`${OLD}/a.md and ${OLD}/b.md\n`);
    expect(c.totals.slash).toBe(2);
    expect(c.sites).toEqual([
      { line: 1, spelling: "slash" },
      { line: 1, spelling: "slash" },
    ]);
  });

  it("a name that only ends with the root's name is not a site", () => {
    const c = countSpellings(`my${OLD}/x and "my${OLD}" and my${OLD}${BS}x`);
    expect(c.totals).toEqual({ slash: 0, segment: 0, backslash: 0 });
  });

  it("legacyPathHit names a path under a pre-v3 directory and never one under the new root", () => {
    expect(legacyPathHit(`${OLD}/board.md`)).toBe(true);
    expect(legacyPathHit(`fixtures/tree/${OLD}/board.md`)).toBe(true);
    expect(legacyPathHit(`${STATE_ROOT_REL}/board.md`)).toBe(false);
    expect(legacyPathHit(`docs/${OLD}.md`)).toBe(false);
  });
});

describe("only the exact fallback clause is subtracted (D-15)", () => {
  it("a text holding the clause exactly reports 0 and says it removed one clause", () => {
    const c = countSpellings(`> ${LEGACY_FALLBACK_CLAUSE}\n`);
    expect(c.totals).toEqual({ slash: 0, segment: 0, backslash: 0 });
    expect(c.clauseOccurrences).toBe(1);
  });

  it("the clause with one character changed is not subtracted, so its old spellings are counted", () => {
    const changed = LEGACY_FALLBACK_CLAUSE.replace(/\.$/, "!");
    expect(changed).not.toBe(LEGACY_FALLBACK_CLAUSE);
    // Derived from the clause, never typed: every backticked `<old>/` the clause spells outside the new root.
    const expected = changed.split(`\`${OLD}/`).length - 1;
    expect(expected, "the clause spells no old path (premise)").toBeGreaterThan(0);
    const c = countSpellings(changed);
    expect(c.clauseOccurrences).toBe(0);
    expect(c.totals.slash).toBe(expected);
  });

  it("a site beside the clause on the same line still counts", () => {
    const c = countSpellings(`${LEGACY_FALLBACK_CLAUSE} ${OLD}/x.md`);
    expect(c.totals.slash).toBe(1);
    expect(c.sites).toEqual([{ line: 1, spelling: "slash" }]);
  });
});

describe("scanTracked lists from git and names its exclusion (D-11)", () => {
  it("SCAN_EXCLUSIONS is the one named .planning/ exclusion with its reason", () => {
    expect(SCAN_EXCLUSIONS.map((e) => e.prefix)).toEqual([".planning/"]);
    for (const e of SCAN_EXCLUSIONS) expect(e.reason, e.prefix).toMatch(/\S/);
  });

  it("a file under .planning/ is never read, and is counted as excluded", () => {
    const d = repo({ ".planning/notes.md": `${PLANT.slash}\n`, "a.md": "clean\n" });
    const r = scanTracked(d, []);
    expect(r.scanned).toBe(1);
    expect(r.excluded).toBe(1);
    expect(r.sites).toEqual([]);
  });
});

describe("the CLI (exit 0 / 1 / 2)", () => {
  it("one committed file holding each spelling once reports 1 slash, 1 segment and 1 backslash, exit 1", () => {
    const d = repo({ "notes.md": `${PLANT.slash}\n${PLANT.segment}\n${PLANT.backslash}\n` });
    const r = scan(d);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(siteLines(r.stdout)).toEqual(["notes.md:1: slash", "notes.md:2: segment", "notes.md:3: backslash"]);
    expect(r.stdout).toMatch(/slash 1, segment 1, backslash 1/);
    expect(r.stdout).not.toMatch(PASS_LINE);
  });

  it("the plants under the new root report 0, exit 0, with a pass line whose denominator is this run's", () => {
    const d = repo({ "notes.md": `${NEW_PLANTS.join("\n")}\n`, "b.md": "clean\n" });
    const r = scan(d);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(siteLines(r.stdout)).toEqual([]);
    expect(r.stdout).toMatch(/slash 0, segment 0, backslash 0/);
    expect(r.stdout).toMatch(/scanned 2 file\(s\)/);
    expect(r.stdout).toMatch(PASS_LINE);
  });

  it("a file holding the clause exactly reports 0; the clause with one character changed reports its old spellings", () => {
    expect(scan(repo({ "AGENTS.md": `${LEGACY_FALLBACK_CLAUSE}\n` })).status).toBe(0);
    const r = scan(repo({ "AGENTS.md": `${LEGACY_FALLBACK_CLAUSE.replace(/\.$/, "!")}\n` }));
    expect(r.status, r.stdout).toBe(1);
    expect(siteLines(r.stdout).length).toBeGreaterThan(0);
  });

  it("a committed path under a top-level pre-v3 directory is a legacy path; the same file under the new root is not", () => {
    const d = repo({ [`${OLD}/board.md`]: "clean\n", [`${STATE_ROOT_REL}/board.md`]: "clean\n" });
    const r = scan(d);
    expect(r.status, r.stdout).toBe(1);
    const legacy = r.stdout.split("\n").filter((l) => l.startsWith("legacy path: "));
    expect(legacy).toEqual([`legacy path: ${OLD}/board.md`]);
  });

  it("a file under .planning/ is never read and the output names the exclusion with its reason", () => {
    const d = repo({ ".planning/notes.md": `${PLANT.slash}\n`, "a.md": "clean\n" });
    const r = scan(d);
    expect(r.status, r.stdout).toBe(0);
    expect(siteLines(r.stdout)).toEqual([]);
    expect(SCAN_EXCLUSIONS.length, "no named exclusion (premise)").toBeGreaterThan(0);
    for (const e of SCAN_EXCLUSIONS) expect(r.stdout).toContain(`excluded: ${e.prefix} (${e.reason}): 1 file(s)`);
  });

  it("a pathspec that matches no file exits 2 and prints no pass line", () => {
    const d = repo({ "a.md": "clean\n" });
    const r = scan(d, ["no-such-dir/"]);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).not.toMatch(PASS_LINE);
    expect(r.stdout + r.stderr).toMatch(/could not run/);
  });

  it("a run outside a git repository exits 2 and prints no pass line", () => {
    const d = join(SCRATCH, `not-a-repo-${seq++}`);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "a.md"), `${PLANT.slash}\n`);
    const r = scan(d);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).not.toMatch(PASS_LINE);
    expect(r.stdout + r.stderr).toMatch(/could not run/);
  });

  it("sites print sorted by path, then line, then spelling order, and two runs print the same bytes", () => {
    const d = repo({
      "b.md": `${PLANT.backslash} ${PLANT.slash}\n`,
      "a.md": `x\n${PLANT.segment}\n${PLANT.slash}\n`,
    });
    const first = scan(d);
    expect(first.status).toBe(1);
    expect(siteLines(first.stdout)).toEqual(["a.md:2: segment", "a.md:3: slash", "b.md:1: slash", "b.md:1: backslash"]);
    expect(scan(d).stdout).toBe(first.stdout);
  });

  it("on the live tree: the authority spells the pre-v3 root (non-vacuity), and this core and its test spell it nowhere", () => {
    const authority = scan(REPO_ROOT, ["install/state-layout.ts"]);
    expect(authority.status, authority.stdout).toBe(1);
    expect(siteLines(authority.stdout).filter((l) => l.endsWith(": segment")).length).toBeGreaterThan(0);
    const self = scan(REPO_ROOT, ["scripts/state-path-scan.ts", "scripts/state-path-scan.js", "scripts/state-path-scan.test.ts"]);
    expect(self.status, self.stdout).toBe(0);
  });
});
