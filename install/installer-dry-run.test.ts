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
// THE PREVIEW HAS TWO HALVES (plan 33.1-34). The FILE half (would-remove, would-edit) is computed in
// memory since plan 33.1-28: uninstall works out the text each file would hold after the run and
// decides on that, so the preview names the files the real run removes or edits, including a
// CLAUDE.md or Copilot file install created that would be blank once its block is gone. The DIRECTORY
// half (would-rmdir) names a directory only when the files this run would remove are all it holds
// (plan 33.1-28's red-team fix counts each previewed removal as gone); a directory that would be
// emptied by anything else is not named (the re-review's IN-02, ledgered by plan 33.1-35). Both halves
// are checked below as a subset of what the real run does on a copy of the same tree, over flows 7, 8
// and 10, and every path the preview names must be one install writes (the shared derivation,
// deriveWritePaths, plan 33.1-27).
//
// Every case drives the COMMITTED install/install.js and install/uninstall.js (rebuild with
// `npm run build` before running), hermetically, into mkdtemp directories removed by afterEach.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, existsSync, cpSync, lstatSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { dirList, ledgerOf, type RawEntry } from "./ledger.test-support.js";
import { PI_PROMPT_REL } from "./host-tools.js";
import {
  INSTALL_JS,
  MARKER_REL,
  UNINSTALL_JS,
  type Run as SharedRun,
  deriveWritePaths,
  makeFixture as sharedMakeFixture,
  makeOldLayoutFixture as sharedMakeOldLayoutFixture,
  normalizeIso,
  printedRel,
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

// Every path any install variant writes (files, links and directories), from the ONE shared derivation
// (plan 33.1-27). A path the preview names must be in it: uninstall acts only on install's paths.
const DERIVE_ROOT = realpathSync(mkdtempSync(join(tmpdir(), "grugops-dry-derive-")));
afterAll(() => rmSync(DERIVE_ROOT, { recursive: true, force: true }));
const SET = deriveWritePaths(DERIVE_ROOT);
const WRITE_PATHS: ReadonlySet<string> = new Set([...SET.files, ...SET.dirs]);

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

/** The path a report message is about: its first token (a file line may go on with a reason). */
const subject = (msg: string): string => msg.split(" ")[0];

// The files a fresh install into an EMPTY target creates and a DRY_RUN uninstall must name for
// removal (flow 10): the pointer files install created (their file and block entries), the Gemini
// settings file it created (the gemini entry) and, since plan 34-04 (D-17), the Pi prompt template
// (a kit-false file entry; PI_PROMPT_REL imported from the host-tool registry, never retyped).
const FLOW10_CREATED = ["CLAUDE.md", ".github/copilot-instructions.md", ".gemini/settings.json", PI_PROMPT_REL] as const;

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
    // Plan 33.1-28: a directory is removed only on install's dir entry, never by its name,
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
    // Plan 33.1-40 (review CR-02): these backups were planted by hand, so install has no record of them;
    // prune names each `left` and removes nothing, DRY_RUN or not (installer-prune.test.ts covers the
    // recorded arm and its would-remove lines).
    expect(r.stdout).not.toMatch(/would-remove/);
    for (const label of ["target", "kit home"]) {
      for (const iso of [ISO_A, ISO_B]) expect(r.stdout).toContain(`${label}: agent-factory.bak.${iso} (not recorded by install`);
    }
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

  // Flow 11 (plan 33.1-39, review WR-02): an edited adapter is left, so the marker is kept. The preview
  // changes nothing and reaches the real run's marker decision: the same banner, a would-edit of the marker
  // and no would-remove of it; the real run (on a copy of the same tree) keeps and edits the marker.
  it("flow 11: DRY_RUN uninstall after an install with one adapter edited: nothing changes, and the preview keeps the marker as the real run does", () => {
    const target = makeFixture();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    const adapter = ledgerOf(JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")) as Record<string, unknown>)
      .filter((e) => e.kind === "file" && e.path.startsWith(".claude/agents/"))
      .map((e) => e.path)
      .sort()[0];
    const p = join(target, ...adapter.split("/"));
    writeFileSync(p, readFileSync(p, "utf8") + "a line the user added\n");
    const kept = "recorded item(s) left in place; .grugops/install.json kept to record them";
    const r = expectDryRunUnchanged(target, home, () => runUninstall(target, home, true), 0, `${kept} (DRY_RUN — nothing changed) ==`);
    // The printed subjects, relative to the target in the product's one spelling (printedRel, plan 34-12).
    expect(reported(r.stdout, "would-edit").map((m) => printedRel(target, subject(m))), r.stdout).toContain(MARKER_REL);
    expect(reported(r.stdout, "would-remove").map((m) => printedRel(target, subject(m))), r.stdout).not.toContain(MARKER_REL);
    const copy = join(mkTmp(), "copy");
    cpSync(target, copy, { recursive: true, verbatimSymlinks: true });
    rebindMarker(copy);
    const real = runUninstall(copy, home, false);
    expect(real.status, real.stdout).toBe(0);
    expect(real.stdout).toContain(`${kept} ==`);
    expect(reported(real.stdout, "edited").map((m) => printedRel(copy, subject(m))), real.stdout).toContain(MARKER_REL);
    expect(existsSync(join(copy, ...MARKER_REL.split("/")))).toBe(true);
    expect(existsSync(join(copy, ...adapter.split("/")))).toBe(true);
  });

  it("flow 10: DRY_RUN uninstall after a fresh install into an EMPTY target (no CLAUDE.md): nothing changes, and the preview names the removal of the files install created", () => {
    const target = mkTmp();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    const r = expectDryRunUnchanged(target, home, () => runUninstall(target, home, true), 0, UNINSTALL_BANNER);
    const whole = reported(r.stdout, "would-remove").map(subject);
    for (const f of FLOW10_CREATED) expect(whole, `the preview does not name the removal of ${f}\n${r.stdout}`).toContain(f);
  });
});

// The subset invariant for flows 7, 8 and 10: the preview runs on the installed tree; the real
// uninstall runs next on a COPY of that same tree (so the real run's result cannot depend on anything
// the preview did). Paths are compared relative to each run's own target root.
//
// The DIRECTORY half: every would-rmdir path is an rmdir path of the real run. Red-team of plan
// 33.1-28: a directory is removed only when the run empties it, and the preview counts each file it
// would remove as removed, so on these trees the preview names the directories the real run empties
// and removes. The third case is an installed tree whose .github/ the user has since emptied
// themselves: neither run removes it (this run did not empty it), and the preview still names the
// others.
//
// The FILE half (plan 33.1-34): every path the preview names as would-remove or would-edit is removed
// or changed by the real run: absent afterwards, or holding other bytes. The marker is compared after
// re-binding, so a would-remove of it must leave it absent. Every path named in either half is one
// install writes (WRITE_PATHS, the shared derivation).
interface Named {
  readonly would: string[];
  readonly done: string[];
  readonly files: string[];
  /** The copy the real run ran on. */
  readonly copy: string;
}
const fileState = (p: string): string => {
  try {
    const st = lstatSync(p);
    if (st.isSymbolicLink()) return "link";
    if (!st.isFile()) return "other";
    return createHash("sha256").update(readFileSync(p)).digest("hex");
  } catch {
    return "absent";
  }
};
function expectPreviewSubsetOfRealRun(target: string, home: string): Named {
  const copy = join(mkTmp(), "copy");
  cpSync(target, copy, { recursive: true, verbatimSymlinks: true });
  // The marker is bound to the directory install wrote it in (red-team B2 of plan 33.1-33); the copy is
  // re-bound as the same install moved, the remedy uninstall names. Only the marker's target differs.
  rebindMarker(copy);
  const noMarker = (s: string): string => s.split("\n").filter((row) => !row.startsWith(".grugops/install.json ")).join("\n");
  expect(noMarker(snapshotTree(copy))).toBe(noMarker(snapshotTree(target))); // the copy is faithful

  // A printed path relative to the root it names, in the product's one spelling (printedRel, plan 34-12,
  // WIN-1): uninstall prints `${TARGET}/${d}`, which on Windows mixes `\` and `/`, and the flavor's own
  // isAbsolute decides absoluteness, never a leading `/`.
  const rel = (root: string, p: string): string => printedRel(root, p);
  const tPre = snapshotTree(target);
  const hPre = snapshotTree(home);
  const preview = runUninstall(target, home, true);
  expect(preview.status, preview.stderr).toBe(0);
  expect(snapshotTree(target)).toBe(tPre); // the preview changed nothing
  expect(snapshotTree(home)).toBe(hPre);
  const would = reported(preview.stdout, "would-rmdir").map((p) => rel(target, p));
  // A file line names the path relative to the target (or, in principle, absolute under it).
  const fileRel = (msg: string): string => printedRel(target, subject(msg));
  const files = [...new Set([...reported(preview.stdout, "would-remove"), ...reported(preview.stdout, "would-edit")].map(fileRel))];
  expect(files.length).toBeGreaterThan(0); // non-vacuous: the preview named files
  const before = new Map(files.map((f) => [f, fileState(join(copy, ...f.split("/")))]));

  const real = runUninstall(copy, home, false);
  expect(real.status, real.stderr).toBe(0);
  const done = reported(real.stdout, "rmdir").map((p) => rel(copy, p));
  expect(done.length).toBeGreaterThan(0); // the real run removed directories, so the comparison is not empty on both sides
  for (const f of files) {
    const b = before.get(f)!;
    const a = fileState(join(copy, ...f.split("/")));
    expect(b, `preview named ${f}, which is not a file in the tree`).not.toBe("absent");
    expect(a === "absent" || a !== b, `preview named ${f} for removal or edit; the real run left it byte-identical\n${preview.stdout}`).toBe(true);
  }
  for (const p of would) expect(done.includes(p), `preview named ${p}; the real run did not remove it`).toBe(true);
  // Every path either half names is one install writes.
  for (const p of [...files, ...would]) {
    expect(WRITE_PATHS.has(normalizeIso(p)), `the preview named ${p}, which no install variant writes`).toBe(true);
  }
  return { would, done, files, copy };
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
    expect(would).toContain(".claude");
    expect(would).not.toContain(".github");
    expect(done).not.toContain(".github");
  });

  it("subset: uninstall after a fresh install into an EMPTY target (flow 10's tree): the files install created are named and removed, and every ledger's paths are named", () => {
    const target = mkTmp();
    const home = mkTmp();
    expect(runInstall(target, home, false).status).toBe(0);
    const m = JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")) as Record<string, unknown>;
    const { would, done, files, copy } = expectPreviewSubsetOfRealRun(target, home);
    // The files install created are named, and the real run removed each whole (the helper checks only
    // "removed or changed").
    for (const f of FLOW10_CREATED) {
      expect(files, `the preview does not name ${f}`).toContain(f);
      expect(existsSync(join(copy, ...f.split("/"))), `the real run did not remove ${f}`).toBe(false);
    }
    // Every file path each kind of ledger entry records is named by the preview (an untouched install
    // holds every record), and every directory the preview names has a dir entry; the real run removes
    // exactly the directories the preview names.
    const entries = ledgerOf(m);
    const pathsOf = (pick: (e: RawEntry) => boolean): string[] => entries.filter(pick).map((e) => e.path);
    const ledgerFiles: ReadonlyArray<readonly [string, readonly string[]]> = [
      ["file (kit false)", pathsOf((e) => e.kind === "file" && e.kit === false)],
      ["file (kit true)", pathsOf((e) => e.kind === "file" && e.kit === true)],
      ["block", pathsOf((e) => e.kind === "block")],
      ["gemini", pathsOf((e) => e.kind === "gemini")],
      ["ask-rules", pathsOf((e) => e.kind === "ask-rules")],
      ["the marker", [MARKER_REL]],
    ];
    for (const [name, paths] of ledgerFiles) {
      expect(paths.length, `the ledger has no ${name} entry`).toBeGreaterThan(0);
      for (const p of paths) expect(files, `a ${name} entry records ${p}; the preview does not name it`).toContain(p);
    }
    const dirEntries = new Set(dirList(m));
    expect(dirEntries.size).toBeGreaterThan(0);
    for (const d of would) expect(dirEntries.has(d), `the preview names ${d}, which no dir entry records`).toBe(true);
    expect([...done].sort()).toEqual([...would].sort());
  });
});
