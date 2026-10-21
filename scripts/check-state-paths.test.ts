// check-state-paths.test.ts — the old-spelling gate (scripts/check-state-paths.ts, phase 36 D-13 step 4; LAYOUT-01,
// LAYOUT-02).
//
// WHAT THIS PROVES.
//   - the live tree: the committed gate exits 0, and the outside totals it prints are zero (read from its output);
//   - one planted site per spelling outside the allow-list, in a scratch repository holding a copy of the allow-list
//     layout, exits 1 and names the site.
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
import { LEGACY_STATE_ROOT_REL } from "../install/state-layout.js";
import { SPELLING_NAMES } from "./state-path-scan.js";
import { ALLOW_LIST } from "./check-state-paths.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(REPO_ROOT, "scripts", "check-state-paths.js");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-state-gate-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

const OLD = LEGACY_STATE_ROOT_REL;
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
