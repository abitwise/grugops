// installer-dry-run.test.ts — the DIRECTORY-AWARE authority for the DRY_RUN contract of BOTH
// installer binaries (plan 33.1-18, CR-02 / D-18 / D-20 part c).
//
// WHY A SECOND FILE AND A SECOND SNAPSHOT. install/install.test.ts's `snapshot()` records regular
// files and symlinks only: an EMPTY directory contributes no row, so a DRY_RUN run that deleted one
// produced the same manifest before and after. That is how CR-02 (a DRY_RUN uninstall calling
// `rmdirSync` for real) stayed green through every existing DRY_RUN case. `snapshotTree()` (shared)
// records EVERY directory, every regular file by content hash, and every symlink by its target, so
// a directory that appears or disappears changes the manifest.
//
// The helpers (snapshotTree, the fixtures and the hermetic runners) live in
// install/installer-paths.test-support.ts since plan 33.1-27, shared with the DC-2 and DC-3 class
// tests; install/install.test.ts keeps its own copies (it exports nothing).
//
// Every case drives the COMMITTED install/install.js and install/uninstall.js (rebuild with
// `npm run build` before running), hermetically, into mkdtemp directories removed by afterEach.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync, existsSync, cpSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  INSTALL_JS,
  UNINSTALL_JS,
  type Run as SharedRun,
  makeFixture as sharedMakeFixture,
  makeOldLayoutFixture as sharedMakeOldLayoutFixture,
  rebindMarker,
  snapshotTree,
  spawnBin,
} from "./installer-paths.test-support.js";

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

// The fixtures, snapshotTree and the hermetic runners live in install/installer-paths.test-support.ts
// (plan 33.1-27), the module that also owns the derivation of every path install can write. Each
// fixture here gets its own tracked mkdtemp directory, removed by afterEach.
const makeFixture = (): string => sharedMakeFixture(mkTmp());
const makeOldLayoutFixture = (): string => sharedMakeOldLayoutFixture(mkTmp());

// The EMPTY directories a user may already hold at the paths uninstall's rmdirIfEmpty visits.
const USER_EMPTY_DIRS = [".github", ".gemini", ".claude", ".claude/skills", ".claude/agents", "tools/grugops"];

function plantEmptyDirs(d: string, rels: string[]): void {
  for (const rel of rels) mkdirSync(join(d, ...rel.split("/")), { recursive: true });
}

type Run = SharedRun;

const runInstall = (target: string, home: string, dryRun: boolean, ...args: string[]): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...args], target, home, { dryRun });
const runUninstall = (target: string, home: string, dryRun: boolean): Run => spawnBin(UNINSTALL_JS, [], target, home, { dryRun });

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
    // Plan 33.1-28: a directory is removed only on install's createdDirs record, never by its name,
    // so the preview can name a directory only in an installed target. Red-team of plan 33.1-28: and
    // only one this run empties, so the preview counts each file it would remove as removed and names
    // the directories it would empty. The preview changes nothing, so the real run below runs on the
    // same tree.
    expect(runInstall(target, home, false).status).toBe(0);

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

// ── Every DRY_RUN flow of both binaries (plan 33.1-18 Task 2, CR-02 sibling arms) ──────────────
//
// Each case snapshots BOTH roots with the directory-aware snapshotTree immediately before the
// DRY_RUN run and asserts both are identical after it. An absent home stays absent.

// The EMPTY directories a user may already hold where the INSTALLER writes (flow 2 / flow 8).
const INSTALL_EMPTY_DIRS = [".claude", ".claude/skills", ".claude/agents", ".gemini", ".github", "tools"];
const ISO_A = "2026-06-15T00-00-00.000Z";
const ISO_B = "2026-06-16T00-00-00.000Z";

function expectDryRunUnchanged(target: string, home: string, run: () => Run, status: number, banner: string): Run {
  const tPre = snapshotTree(target);
  const hPre = snapshotTree(home);
  const homeExisted = existsSync(home);
  const r = run();
  expect(r.status, r.stdout + r.stderr).toBe(status);
  expect(r.stdout).toContain(banner);
  expect(snapshotTree(target)).toBe(tPre);
  expect(snapshotTree(home)).toBe(hPre);
  expect(existsSync(home)).toBe(homeExisted);
  return r;
}

const INSTALL_BANNER = "== install complete (DRY_RUN — nothing changed) ==";
const UNINSTALL_BANNER = "== uninstall complete (DRY_RUN — nothing changed) ==";

describe("DRY_RUN flow matrix: both binaries leave target and kit home byte- and directory-identical", () => {
  it("flow 1: DRY_RUN install into a fresh fixture (home absent)", () => {
    const target = makeFixture();
    const home = join(mkTmp(), "home-never-created");
    expectDryRunUnchanged(target, home, () => runInstall(target, home, true), 0, INSTALL_BANNER);
    expect(existsSync(home)).toBe(false);
  });

  it("flow 2: DRY_RUN install into a fixture holding pre-existing EMPTY user directories", () => {
    const target = makeFixture();
    const home = join(mkTmp(), "home-never-created");
    plantEmptyDirs(target, INSTALL_EMPTY_DIRS);
    const pre = snapshotTree(target);
    for (const rel of INSTALL_EMPTY_DIRS) expect(pre).toContain(`${rel}/ DIR`);
    expectDryRunUnchanged(target, home, () => runInstall(target, home, true), 0, INSTALL_BANNER);
  });

  it("flow 3: DRY_RUN re-install over a real install", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    expectDryRunUnchanged(target, home, () => runInstall(target, home, true), 0, INSTALL_BANNER);
  });

  it("flow 4: DRY_RUN --migrate over an old-layout fixture (home absent)", () => {
    const target = makeOldLayoutFixture();
    const home = join(mkTmp(), "home-never-created");
    // --backup-edited-kit: the old layout's kit files have no install record, so D-32 (plan 33.1-32)
    // needs consent; with it the preview names the backups and the kit write, and still changes nothing.
    const r = expectDryRunUnchanged(
      target,
      home,
      () => runInstall(target, home, true, "--migrate", "--backup-edited-kit"),
      0,
      "DRY_RUN — nothing changed",
    );
    expect(r.stdout).toMatch(/would-back-up/);
    expect(r.stdout).toMatch(/would-/);
  });

  it("flow 5: DRY_RUN --update over a real install whose kit VERSION was changed", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    writeFileSync(join(home, "agent-factory", "VERSION"), "9.9.9-displaced\n");
    const r = expectDryRunUnchanged(
      target,
      home,
      () => runInstall(target, home, true, "--update"),
      0,
      "== update complete (DRY_RUN — nothing changed) ==",
    );
    expect(r.stdout).toMatch(/would-/);
  });

  it("flow 6: DRY_RUN --prune-old-kit with an EMPTY and a NON-EMPTY backup directory in each root", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    for (const root of [target, home]) {
      mkdirSync(join(root, `agent-factory.bak.${ISO_A}`)); // EMPTY — invisible to the file-only snapshot
      mkdirSync(join(root, `agent-factory.bak.${ISO_B}`, "roles"), { recursive: true });
      writeFileSync(join(root, `agent-factory.bak.${ISO_B}`, "roles", "orchestrator.md"), "backup body\n");
    }
    const r = expectDryRunUnchanged(
      target,
      home,
      () => runInstall(target, home, true, "--prune-old-kit"),
      0,
      "== prune complete (DRY_RUN — nothing changed) ==",
    );
    expect(r.stdout).toMatch(/would-remove/);
    for (const root of [target, home]) {
      expect(snapshotTree(root)).toContain(`agent-factory.bak.${ISO_A}/ DIR`); // the empty backup survived
      expect(existsSync(join(root, `agent-factory.bak.${ISO_B}`, "roles", "orchestrator.md"))).toBe(true);
    }
  });

  it("flow 7: DRY_RUN uninstall after a real install", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    expectDryRunUnchanged(target, home, () => runUninstall(target, home, true), 0, UNINSTALL_BANNER);
  });

  it("flow 8: DRY_RUN uninstall after a real install into flow 2's fixture", () => {
    const target = makeFixture();
    const home = mkTmp();
    plantEmptyDirs(target, INSTALL_EMPTY_DIRS);
    expect(runInstall(target, home, false).status).toBe(0);
    expectDryRunUnchanged(target, home, () => runUninstall(target, home, true), 0, UNINSTALL_BANNER);
  });
});

// The subset invariant for flows 7 and 8: the preview runs on the installed tree; the real
// uninstall runs next on a COPY of that same tree (so the real run's result cannot depend on
// anything the preview did). Paths are compared relative to each run's own target root.
//
// Red-team of plan 33.1-28: a directory is removed only when the run empties it, and the preview
// counts each file it would remove as removed, so on flow 7's and flow 8's trees the preview names
// the directories the real run empties and removes. The third case is an installed tree whose
// .github/ the user has since emptied themselves: neither run removes it (this run did not empty it),
// and the preview still names the others.
function expectPreviewSubsetOfRealRun(target: string, home: string): { would: string[]; done: string[] } {
  const copy = join(mkTmp(), "copy");
  cpSync(target, copy, { recursive: true, verbatimSymlinks: true });
  // The marker is bound to the directory install wrote it in (red-team B2 of plan 33.1-33); the copy is
  // re-bound as the same install moved, the remedy uninstall names. Only the marker's target differs.
  rebindMarker(copy);
  const noMarker = (s: string): string => s.split("\n").filter((row) => !row.startsWith(".grugops/install.json ")).join("\n");
  expect(noMarker(snapshotTree(copy))).toBe(noMarker(snapshotTree(target))); // the copy is faithful

  const rel = (root: string, p: string): string => (p.startsWith(root) ? p.slice(root.length) : `OUTSIDE:${p}`);
  const tPre = snapshotTree(target);
  const hPre = snapshotTree(home);
  const preview = runUninstall(target, home, true);
  expect(preview.status, preview.stderr).toBe(0);
  expect(snapshotTree(target)).toBe(tPre); // the preview changed nothing
  expect(snapshotTree(home)).toBe(hPre);
  const would = reported(preview.stdout, "would-rmdir").map((p) => rel(target, p));

  const real = runUninstall(copy, home, false);
  expect(real.status, real.stderr).toBe(0);
  const done = reported(real.stdout, "rmdir").map((p) => rel(copy, p));
  expect(done.length).toBeGreaterThan(0); // the real run removed directories, so the comparison is not empty on both sides
  for (const p of would) expect(done.includes(p), `preview named ${p}; the real run did not remove it`).toBe(true);
  return { would, done };
}

describe("DRY_RUN preview never over-claims: would-rmdir is a subset of the real run's rmdir", () => {
  it("subset: uninstall after a real install (flow 7's tree)", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    expectPreviewSubsetOfRealRun(target, home);
  });

  it("subset: uninstall after a real install into flow 2's fixture (flow 8's tree)", () => {
    const target = makeFixture();
    const home = mkTmp();
    plantEmptyDirs(target, INSTALL_EMPTY_DIRS);
    expect(runInstall(target, home, false).status).toBe(0);
    expectPreviewSubsetOfRealRun(target, home);
  });

  it("subset (non-vacuous): the preview names directories; an installed tree's .github/ the user has since emptied is left by both", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    rmSync(join(target, ".github", "copilot-instructions.md"));
    expect(readdirSync(join(target, ".github")).length).toBe(0);
    const { would, done } = expectPreviewSubsetOfRealRun(target, home);
    expect(would.length).toBeGreaterThan(0);
    expect(would).toContain("/.claude");
    expect(would).not.toContain("/.github");
    expect(done).not.toContain("/.github");
  });
});
