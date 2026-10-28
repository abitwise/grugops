// migrate-v3-rollback.test.ts — install --migrate v3 fails safe at every commit step (phase 38, plan 38-06, D-10, D-17,
// MIGRATE-02, MIGRATE-03).
//
// WHAT IT PROVES. The v3 state migrate builds the whole v3 tree in a staging directory, proves it, and only then renames
// it into place (D-10). The commit is a journal of renames and directories, undone in reverse on any failure (D-17).
// This file fails each commit step class of the COMMITTED install/install.js from outside the program, through the one
// fault-injection harness (scripts/fault-inject.test-support.ts, `node --import <preload>`), and shows the state is
// exactly as before:
//   (R1) the state root rename fails with EIO;
//   (R2) the state root rename fails with EXDEV, which is an I/O failure like EIO: no copy-and-delete fallback runs;
//   (R3) an archive move (an original moved unchanged into the pre-v3 archive) fails with EIO;
//   (R4) a commit mkdir (a directory made on the way to an archive move) fails with EIO;
//   (R5) a staged write's rename (a split output moved from staging to its path) fails with EIO;
//   (R6) the layout marker write fails with EIO, after the trace render wrote its files;
//   (R7) a change to the pre-v3 board made after the read, while the first staged file is written (a test-only preload),
//        stops the arm before any commit rename with a verify saying the state changed after it was read.
// For each fault case: the preload reports that it fired exactly once (a case that fires nothing fails), install.js
// exits 3, exactly one verify names the step and the error code, treeDigest of the pre-v3 root, MEMORY_BANK_REL (which
// holds PROGRESS_REL) and CONTEXT_REL equals the digest taken before the run, and neither STATE_ROOT_REL,
// LAYOUT_MARKER_REL nor MIGRATE_STAGING_REL exists. The equal digests are the observation that the journal was undone
// in exactly the reverse of its order: a rename undone out of order would leave a file or directory at a new path.
//
// WHERE THE SITES COME FROM. Every fault site is derived from the committed install/install.js syntax tree with the
// harness's deriveFsCallSites and callingSites: the call of the named node:fs function inside the named enclosing
// function, and, where one helper serves several steps (migrateRename serves the root rename, the archive moves and the
// staged writes), the `via` frame of the call in runStateMigrate whose source line names that step's loop variable.
// No line number is typed by hand. install.js reads no switch: the fault comes only from the preload.
//
// NOT TESTED HERE. The harness injects one fault per run, so a failure inside the undo itself (a rename back that
// fails after a commit step failed) cannot be expressed. That path (each failed undo step its own verify, the staging
// directory and its commit plan left for the human) is reviewed by reading, not claimed as tested.
//
// THE WORLD. emptyWorld with the fixture materialized (as in migrate-v3.test.ts M1), and MEMORY_BANK_REL holding the
// kit seed's standing memory-bank files beforehand. A failed state migrate does not stop the install run: the state
// seed runs after it and creates each standing file that is absent, so a memory bank that already holds them shows any
// byte the state migrate left behind and nothing else.
//
// Hermetic: every run has GRUGOPS_HOME and HOME inside a scratch directory removed after the file. It drives the
// COMMITTED install/install.js (npm run build first). Clear professional voice: this is a safety surface.

import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CONTEXT_REL,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  MEMORY_BANK_REL,
  MIGRATE_STAGING_REL,
  PROGRESS_REL,
  STATE_ROOT_REL,
  TRACE_DIR_REL,
} from "./state-layout.js";
import { INSTALL_JS, REPO_ROOT, makePreV3ChessFixture, withAgentFlags } from "./installer-paths.test-support.js";
import {
  callingSites,
  deriveFsCallSites,
  runFaulted,
  scriptUrl,
  treeDigest,
  type FaultSpec,
  type FaultedRun,
  type FsFaultFn,
} from "../scripts/fault-inject.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-v3-rollback-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

const INSTALL_URL = scriptUrl(INSTALL_JS);
const INSTALL_LINES = readFileSync(INSTALL_JS, "utf8").split("\n");

let seq = 0;
/** A fresh world: the fixture in an empty target, the seed's standing memory-bank files, a scratch HOME and kit home. */
function world(): { target: string; kitHome: string; home: string; scratch: string } {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  const scratch = join(root, "scratch");
  for (const d of [target, home, scratch]) mkdirSync(d, { recursive: true });
  makePreV3ChessFixture(target);
  const seed = join(REPO_ROOT, "agent-factory", "seed");
  const seedStateRoot = join(seed, ...STATE_ROOT_REL.split("/"));
  cpSync(join(seed, ...MEMORY_BANK_REL.split("/")), join(target, MEMORY_BANK_REL), {
    recursive: true,
    force: false,
    errorOnExist: false,
    filter: (src) => src !== seedStateRoot && !src.startsWith(seedStateRoot + sep),
  });
  return { target, kitHome: join(root, "kit-home"), home, scratch };
}

/** The installer environment of a run in `w`: copy mode, this checkout as the kit source, scratch homes. */
function installEnv(w: { target: string; kitHome: string; home: string }): Record<string, string> {
  return { INSTALL_MODE: "copy", GRUGOPS_SRC: REPO_ROOT, GRUGOPS_HOME: w.kitHome, HOME: w.home, TARGET: w.target };
}

/** The install.js arguments of every run here: unattended, every agent named, --migrate. */
const MIGRATE_ARGS: readonly string[] = ["--yes", ...withAgentFlags(["--migrate"])];

/** The state the migrate must leave as it found it: the pre-v3 root, the memory bank (with the progress file), context. */
function stateDigest(target: string): string {
  const parts: string[] = [];
  for (const rel of [LEGACY_STATE_ROOT_REL, MEMORY_BANK_REL, CONTEXT_REL]) {
    const abs = join(target, ...rel.split("/"));
    parts.push(`## ${rel}`, ...(existsSync(abs) ? [...treeDigest(abs)].map(([k, v]) => `${k} ${v}`) : ["(absent)"]));
  }
  return parts.join("\n");
}

/** The lines of `out` the installer printed under `label`. */
function labelled(out: string, label: string): string[] {
  return out.split("\n").filter((l) => l.startsWith(`  ${label.padEnd(14)} `));
}

/** The one call of node:fs `fn` inside `enclosing` in the committed install.js whose source line contains `text`. */
function fsSite(fn: FsFaultFn, enclosing: string, text = ""): { url: string; line: number } {
  const sites = deriveFsCallSites(INSTALL_JS, fn).filter((s) => s.enclosing === enclosing && (INSTALL_LINES[s.line - 1] ?? "").includes(text));
  expect(sites.map((s) => s.key), `exactly one ${fn} call in ${enclosing} whose line contains ${JSON.stringify(text)}`).toHaveLength(1);
  return { url: INSTALL_URL, line: (sites[0] as { line: number }).line };
}

/** The one call of `fn` (a function of install.js) inside `scope` whose source line contains `text`: a `via` frame. */
function callSite(fn: string, scope: string, text: string): { url: string; line: number } {
  const sites = callingSites(INSTALL_JS, fn).filter((s) => s.scope === scope && (INSTALL_LINES[s.line - 1] ?? "").includes(text));
  expect(sites, `exactly one call of ${fn} in ${scope} whose line contains ${JSON.stringify(text)}`).toHaveLength(1);
  return { url: INSTALL_URL, line: (sites[0] as { line: number }).line };
}

/** The rename of migrateRename, the one rename of every commit step. */
const RENAME = (): { url: string; line: number } => fsSite("renameSync", "migrateRename");

/** The `via` frame of migrateRename's call in runStateMigrate for one commit step class, named by its loop variable. */
const VIA = (step: "rootRename" | "archiveMove" | "stagedWrite"): { url: string; line: number } =>
  callSite("migrateRename", "runStateMigrate", step);

/** A world the faulted run starts from, and its state digest before the run. */
function faultWorld(): { w: ReturnType<typeof world>; before: string } {
  const w = world();
  return { w, before: stateDigest(w.target) };
}

/**
 * The rollback contract of one faulted run: the fault fired exactly once, exit 3, exactly one verify naming `step`
 * and `code`, every rename undone, the state digest as before, and no state root, marker or staging directory.
 */
function expectRolledBack(w: ReturnType<typeof world>, before: string, r: FaultedRun, step: string, code: string): void {
  const out = `${r.stdout}\n${r.stderr}`;
  expect(r.fired, `the fault fired exactly once (site matched but not via: ${r.siteNotVia})\n${out}`).toBe(1);
  expect(r.status, out).toBe(3);
  const verifies = labelled(r.stdout, "verify");
  expect(verifies, r.stdout).toHaveLength(1);
  expect(verifies[0]).toContain(`state migrate (${step})`);
  expect(verifies[0]).toContain(code);
  expect(verifies[0]).toContain("Every rename was undone");
  expect(stateDigest(w.target), "the pre-v3 root, the memory bank and the context root are as they were").toBe(before);
  for (const rel of [STATE_ROOT_REL, LAYOUT_MARKER_REL, MIGRATE_STAGING_REL]) {
    expect(existsSync(join(w.target, ...rel.split("/"))), `${rel} does not exist`).toBe(false);
  }
}

describe("install --migrate v3 rollback (phase 38, plan 38-06)", () => {
  it("rollback (R1) the state root rename fails with EIO: the state is byte-identical, no state root, marker or staging", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "renameSync", site: RENAME(), via: VIA("rootRename"), code: "EIO" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "commit, the state root rename", "EIO");
  });

  it("rollback (R2) the state root rename fails with EXDEV: undone like EIO, no copy-and-delete fallback, nothing under the state root", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "renameSync", site: RENAME(), via: VIA("rootRename"), code: "EXDEV" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "commit, the state root rename", "EXDEV");
  });

  it("rollback (R3) an archive move fails with EIO: the root rename before it is undone too", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "renameSync", site: RENAME(), via: VIA("archiveMove"), code: "EIO" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "commit, an archive move", "EIO");
  });

  it("rollback (R4) a commit mkdir on the way to an archive move fails with EIO: the directories made before it are taken away", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "mkdirSync", site: fsSite("mkdirSync", "migrateMkdirs"), via: VIA("archiveMove"), code: "EIO" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "commit, an archive move", "EIO");
    expect(labelled(r.stdout, "verify")[0]).toContain("could not be made");
  });

  it("rollback (R5) a staged write's rename fails with EIO: every archive move and the root rename are undone", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "renameSync", site: RENAME(), via: VIA("stagedWrite"), code: "EIO" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "commit, a staged write", "EIO");
  });

  it("rollback (R6) the layout marker write fails with EIO after the trace render wrote its files: the rendered files go too", () => {
    const { w, before } = faultWorld();
    const spec: FaultSpec = { kind: "fs", fn: "writeFileSync", site: fsSite("writeFileSync", "runStateMigrate", "marker"), code: "EIO" };
    const r = runFaulted(INSTALL_JS, MIGRATE_ARGS, spec, { scratch: w.scratch, env: installEnv(w) });
    expectRolledBack(w, before, r, "marker", "EIO");
  });

  it("rollback (R6) premise: without a fault the same world migrates and the render writes trace files before the marker", () => {
    const w = world();
    const r = spawnSync(process.execPath, [INSTALL_JS, ...MIGRATE_ARGS], { encoding: "utf8", env: { ...process.env, ...installEnv(w) }, timeout: 120_000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    expect(readFileSync(join(w.target, LAYOUT_MARKER_REL), "utf8")).toBe("layout: v3\n");
    const traces = readdirSync(join(w.target, ...TRACE_DIR_REL.split("/"))).filter((n) => n.endsWith(".md"));
    expect(traces.length, "the render wrote trace files the marker fault must take away").toBeGreaterThan(0);
  });

  it("rollback (R7) a change to the pre-v3 board after the read stops the arm before any commit rename: exit 3, one verify, nothing committed, no staging", () => {
    const w = world();
    const board = join(w.target, ...LEGACY_BOARD_REL.split("/"));
    const staging = join(w.target, ...MIGRATE_STAGING_REL.split("/"));
    const firedLog = join(w.scratch, "changed-after-read.log");
    const preload = join(w.scratch, "changed-after-read.mjs");
    // Test code only: install.js reads none of these names. The preload appends one byte to the board the first time a
    // file is written under the staging directory, after readMigrateInputs read the board and before the re-check.
    writeFileSync(
      preload,
      [
        'import { createRequire, syncBuiltinESMExports } from "node:module";',
        "const require = createRequire(import.meta.url);",
        'const fs = require("node:fs");',
        "const original = fs.writeFileSync;",
        "const staging = process.env.ROLLBACK_TEST_STAGING;",
        "const board = process.env.ROLLBACK_TEST_BOARD;",
        "const log = process.env.ROLLBACK_TEST_LOG;",
        "let done = false;",
        "const wrapper = function (p, ...rest) {",
        '  if (!done && typeof p === "string" && p.startsWith(staging + "/")) {',
        "    done = true;",
        '    fs.appendFileSync(board, "x");',
        '    fs.appendFileSync(log, "fired\\n");',
        "  }",
        "  return original.call(this, p, ...rest);",
        "};",
        "Object.assign(wrapper, original);",
        "fs.writeFileSync = wrapper;",
        "syncBuiltinESMExports();",
        "",
      ].join("\n"),
    );
    appendFileSync(firedLog, "");
    const boardBefore = readFileSync(board);
    const r = spawnSync(process.execPath, ["--import", pathToFileURL(preload).href, INSTALL_JS, ...MIGRATE_ARGS], {
      encoding: "utf8",
      cwd: w.scratch,
      timeout: 120_000,
      env: { ...process.env, ...installEnv(w), ROLLBACK_TEST_STAGING: staging, ROLLBACK_TEST_BOARD: board, ROLLBACK_TEST_LOG: firedLog },
    });
    const out = `${r.stdout}\n${r.stderr}`;
    expect(readFileSync(firedLog, "utf8"), `the preload changed the board once\n${out}`).toBe("fired\n");
    expect(r.status, out).toBe(3);
    const verifies = labelled(r.stdout, "verify");
    expect(verifies, r.stdout).toHaveLength(1);
    expect(verifies[0]).toContain("changed after it was read");
    expect(existsSync(join(w.target, ...LEGACY_STATE_ROOT_REL.split("/"))), "the pre-v3 root was not renamed").toBe(true);
    expect(readFileSync(board).equals(Buffer.concat([boardBefore, Buffer.from("x")])), "the board holds the appended byte").toBe(true);
    for (const rel of [STATE_ROOT_REL, LAYOUT_MARKER_REL, MIGRATE_STAGING_REL]) {
      expect(existsSync(join(w.target, ...rel.split("/"))), `${rel} does not exist`).toBe(false);
    }
    expect(readFileSync(join(w.target, ...PROGRESS_REL.split("/"))).length, "the progress file is still there").toBeGreaterThan(0);
  });
});
