// installer-dry-run.test.ts — the DIRECTORY-AWARE authority for the DRY_RUN contract of BOTH
// installer binaries (plan 33.1-18, CR-02 / D-18 / D-20 part c).
//
// WHY A SECOND FILE AND A SECOND SNAPSHOT. install/install.test.ts's `snapshot()` records regular
// files and symlinks only: an EMPTY directory contributes no row, so a DRY_RUN run that deleted one
// produced the same manifest before and after. That is how CR-02 (a DRY_RUN uninstall calling
// `rmdirSync` for real) stayed green through every existing DRY_RUN case. `snapshotTree()` below
// records EVERY directory, every regular file by content hash, and every symlink by its target, so
// a directory that appears or disappears changes the manifest.
//
// The helpers are COPIED from install/install.test.ts rather than imported: that file exports
// nothing, and importing a test file would also register all of its cases here.
//
// Every case drives the COMMITTED install/install.js and install/uninstall.js (rebuild with
// `npm run build` before running), hermetically, into mkdtemp directories removed by afterEach.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const UNINSTALL_JS = join(import.meta.dirname, "uninstall.js");

const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-dry-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) {
    const d = tmpDirs.pop()!;
    rmSync(d, { recursive: true, force: true });
  }
});

// makeFixture — verbatim from install/install.test.ts: a user-owned CLAUDE.md, a stand-in frozen
// core under agent-factory/, and a user-owned plans/board.md.
function makeFixture(): string {
  const d = mkTmp();
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "plans"), { recursive: true });
  writeFileSync(join(d, "CLAUDE.md"), "# User Project\n\nMy own dev instructions — must be preserved.\n");
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — uninstall must never delete this.\n");
  writeFileSync(join(d, "plans", "board.md"), "user board\n");
  return d;
}

// The EMPTY directories a user may already hold at the paths uninstall's rmdirIfEmpty visits.
const USER_EMPTY_DIRS = [".github", ".gemini", ".claude", ".claude/skills", ".claude/agents", "tools/grugops"];

function plantEmptyDirs(d: string, rels: string[]): void {
  for (const rel of rels) mkdirSync(join(d, ...rel.split("/")), { recursive: true });
}

// snapshotTree — a sorted manifest with ONE row per entry under `dir`:
//   `<rel>/ DIR`                  a directory (so an empty directory is visible)
//   `<rel> LINK <readlink>`       a symlink, never followed
//   `<rel> <sha256>`              a regular file, by content
//   `<rel> OTHER`                 anything else (FIFO, socket, device)
// An absent `dir` snapshots to "" — a legitimate, diffable "never created" state.
function snapshotTree(dir: string): string {
  if (!existsSync(dir)) return "";
  const rows: string[] = [];
  const walk = (rel: string): void => {
    const abs = rel ? join(dir, rel) : dir;
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(dir, childRel);
      if (ent.isSymbolicLink()) {
        rows.push(`${childRel} LINK ${readlinkSync(childAbs)}`);
      } else if (ent.isDirectory()) {
        rows.push(`${childRel}/ DIR`);
        walk(childRel);
      } else if (ent.isFile()) {
        rows.push(`${childRel} ${createHash("sha256").update(readFileSync(childAbs)).digest("hex")}`);
      } else {
        rows.push(`${childRel} OTHER`);
      }
    }
  };
  walk("");
  return rows.sort().join("\n");
}

type Run = { status: number | null; stdout: string; stderr: string };

function spawnBin(bin: string, args: string[], target: string, home: string, dryRun: boolean): Run {
  const env: NodeJS.ProcessEnv = { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: home, TARGET: target };
  if (dryRun) env.DRY_RUN = "1";
  else delete env.DRY_RUN;
  const r = spawnSync("node", [bin, ...args], { encoding: "utf8", env });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const runUninstall = (target: string, home: string, dryRun: boolean): Run => spawnBin(UNINSTALL_JS, [], target, home, dryRun);

// The paths a run printed under one report label. report() pads the label to 14 columns after two
// spaces of indent, so an exact label match never confuses `rmdir` with `would-rmdir`.
function reported(stdout: string, label: string): string[] {
  const out: string[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(line);
    if (m && m[1] === label) out.push(m[2]);
  }
  return out;
}

describe("CR-02: a DRY_RUN uninstall changes nothing (rmdirIfEmpty)", () => {
  it("DRY_RUN uninstall of a never-installed target over empty user directories leaves every directory in place", () => {
    const target = makeFixture();
    const home = mkTmp();
    plantEmptyDirs(target, USER_EMPTY_DIRS);
    const tPre = snapshotTree(target);
    const hPre = snapshotTree(home);
    for (const rel of USER_EMPTY_DIRS) expect(tPre).toContain(`${rel}/ DIR`);

    const r = runUninstall(target, home, true);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("(DRY_RUN — nothing changed)");

    expect(snapshotTree(target)).toBe(tPre);
    expect(snapshotTree(home)).toBe(hPre);
  });

  it("every would-rmdir path of the preview is an rmdir path of the real run on the same tree", () => {
    const target = makeFixture();
    const home = mkTmp();
    plantEmptyDirs(target, USER_EMPTY_DIRS);

    const preview = runUninstall(target, home, true);
    expect(preview.status, preview.stderr).toBe(0);
    const would = reported(preview.stdout, "would-rmdir");
    expect(would.length).toBeGreaterThan(0); // non-vacuous: the preview named something

    const real = runUninstall(target, home, false);
    expect(real.status, real.stderr).toBe(0);
    const done = new Set(reported(real.stdout, "rmdir"));
    for (const p of would) expect(done.has(p), `preview named ${p}; the real run did not remove it`).toBe(true);
  });
});
