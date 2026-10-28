// pre-v3-layout.test.ts — a plain install on a repository still on the pre-v3 state layout refuses (phase 36,
// plan 36-12, 2026-10-21, D-01, D-05, D-06, D-08, LAYOUT-04, install half).
//
// WHAT THIS PROVES. install.ts decides the state layout from board-file presence alone (stateLayout(), D-01). On a
// repository whose board is at LEGACY_BOARD_REL with none at BOARD_REL, a plain install used to seed a second, empty
// board beside the user's. It now refuses the whole run before any write:
//   (a) a plain install on the named pre-v3 fixture (makePreV3StateFixture, D-08) exits 1, prints nothing on stdout
//       and one stderr sentence naming the pre-v3 board, the v3 state root and the --migrate command (with the
//       agents named by flag), and leaves the target and the kit home byte-identical by snapshotTree (the kit home
//       is absent before and after);
//   (b) the same run twice refuses twice with byte-identical stderr and writes nothing either time (idempotency);
//   (c) DRY_RUN does not exempt the refusal: a preview refuses the same way and writes nothing;
//   (d) a layout that cannot be read (the pre-v3 root at mode 000, so lstat answers EACCES, never "absent") refuses
//       the same way, naming the path and the error code, and writes nothing. Skipped on win32 and as root, where a
//       directory mode does not stop a read.
// Plan 36-13 (2026-10-21, D-02, D-05, D-06, D-07, LAYOUT-04) closes the other entry points:
//   (e) --migrate on a v1.0 vendored-kit repository that also holds the pre-v3 board migrates that state in the same
//       run (plan 38-03, 2026-10-28, D-11, D-17): the two-root steps run, then the state migrate; the pre-v3 root is
//       gone, BOARD_REL and LAYOUT_MARKER_REL exist, PRE_V3_BOARD_REL holds PRE_V3_BOARD_TEXT, and the pre-v3 ticket is
//       byte-identical at its moved path. Until plan 38-03 this run seeded nothing and reported one `skipped` line;
//   (f) a repository with both boards installs normally on the v3 layout with exactly one stale `note`, no verify,
//       and both boards byte-identical (nothing merged or deleted, D-02);
//   (g) a fresh repository installs with no layout note; (h) a regular file at the pre-v3 root (ENOTDIR) is not
//       pre-v3 and installs normally;
//   (i) --migrate over an unreadable pre-v3 root is a pre-check refusal (plan 38-07, 2026-10-28, MIGRATE-04): exit 3,
//       one verify naming the path and the code, and the target byte-identical and the kit home absent, so the two-root
//       steps do not run either (skipped on win32 and as root, as case (d) is). Until plan 38-07 the run went on into
//       the install run and its state seed reported the verify;
//   (j) --check after (e): exit 0, one ok state-layout line naming STATE_ROOT_REL, no pre-v3 WARN and no FAIL; a
//       second --check prints the same line (plan 38-03; before it, the line was a WARN naming --migrate);
//   (k) --check on a both repository WARNs once that the pre-v3 root is stale; on a current install it prints one ok
//       state-layout line;
//   (l) --update into a scratch kit home leaves a pre-v3 repository byte-identical, and the kit home's Orchestrator
//       carries LEGACY_FALLBACK_CLAUSE (the copy an unmigrated repository's Orchestrator reads);
//   (m) uninstall on the migrated repository of (e) is not refused by the layout and keeps every file under
//       STATE_ROOT_REL byte-identical (plan 38-03; before it, the kept state was the pre-v3 root).
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after
// the file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: this is a safety surface (no user state is ever written over).

import { afterAll, describe, expect, it } from "vitest";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import {
  BOARD_REL,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_FALLBACK_CLAUSE,
  LEGACY_STATE_ROOT_REL,
  PRE_V3_BOARD_REL,
  STATE_ROOT_REL,
} from "./state-layout.js";
import {
  ALL_AGENT_FLAGS,
  PRE_V3_BOARD_TEXT,
  PRE_V3_TICKET_REL,
  PRE_V3_TICKET_TEXT,
  lineNamesPath,
  makeFixture,
  makeOldLayoutFixture,
  makePreV3StateFixture,
  printedCommand,
  runInstall,
  runUninstall,
  snapshotTree,
  type Run,
} from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-pre-v3-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let seq = 0;
/** A fresh world: a pre-v3 target, a scratch HOME, and a kit home path that does not exist yet. */
function world(): { target: string; kitHome: string; home: string } {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  makePreV3StateFixture(target);
  return { target, kitHome: join(root, "kit-home"), home };
}

/** Why a directory mode cannot make lstat fail here, or null when the mode 000 case can run. */
const CHMOD_SKIP: string | null =
  process.platform === "win32"
    ? "win32: a directory mode does not stop a read"
    : typeof process.getuid === "function" && process.getuid() === 0
      ? "running as root: a directory mode does not stop root"
      : null;
if (CHMOD_SKIP !== null) console.log(`SKIP case (d) of pre-v3-layout.test.ts — ${CHMOD_SKIP}`);

/** The refusal's shape, shared by (a) to (c). */
function expectPreV3Refusal(r: Run): void {
  expect(r.error).toBeUndefined();
  expect(r.status).toBe(1);
  expect(r.stdout).toBe("");
  const lines = r.stderr.trimEnd().split("\n");
  expect(lines, r.stderr).toHaveLength(1);
  const line = lines[0];
  expect(line).toContain(LEGACY_BOARD_REL);
  expect(line).toContain(BOARD_REL);
  expect(line).toContain(`${STATE_ROOT_REL}/`);
  expect(line).toContain("--migrate");
  expect(line).toContain("Nothing was written.");
  // The remedy is migrateCommand over the agents named by flag: every agent runInstall named, and --migrate.
  const command = printedCommand(line);
  expect(command).toContain("--migrate");
  for (const flag of ALL_AGENT_FLAGS) expect(command).toContain(flag);
}

describe("a plain install on the pre-v3 state layout refuses before any write (plan 36-12, D-05, LAYOUT-04)", () => {
  it("(a) refuses with exit 1, nothing on stdout, one stderr sentence naming --migrate, and the target and kit home unchanged", () => {
    const { target, kitHome, home } = world();
    const beforeTarget = snapshotTree(target);
    expect(beforeTarget).not.toBe("");
    expect(snapshotTree(kitHome)).toBe("");
    const r = runInstall(target, kitHome, [], { home });
    expectPreV3Refusal(r);
    expect(snapshotTree(target)).toBe(beforeTarget);
    expect(snapshotTree(kitHome)).toBe("");
    // The user's pre-v3 state keeps its bytes, and no board was seeded at BOARD_REL.
    expect(readFileSync(join(target, LEGACY_BOARD_REL), "utf8")).toBe(PRE_V3_BOARD_TEXT);
    expect(readFileSync(join(target, PRE_V3_TICKET_REL), "utf8")).toBe(PRE_V3_TICKET_TEXT);
    expect(snapshotTree(target)).not.toContain(BOARD_REL);
  });

  it("(b) the same run twice refuses twice with byte-identical stderr and writes nothing either time", () => {
    const { target, kitHome, home } = world();
    const beforeTarget = snapshotTree(target);
    const first = runInstall(target, kitHome, [], { home });
    expectPreV3Refusal(first);
    expect(snapshotTree(target)).toBe(beforeTarget);
    expect(snapshotTree(kitHome)).toBe("");
    const second = runInstall(target, kitHome, [], { home });
    expectPreV3Refusal(second);
    expect(second.stderr).toBe(first.stderr);
    expect(snapshotTree(target)).toBe(beforeTarget);
    expect(snapshotTree(kitHome)).toBe("");
  });

  it("(c) DRY_RUN does not exempt the refusal: a preview refuses the same way and writes nothing", () => {
    const { target, kitHome, home } = world();
    const beforeTarget = snapshotTree(target);
    const real = runInstall(target, kitHome, [], { home });
    const preview = runInstall(target, kitHome, [], { home, dryRun: true });
    expectPreV3Refusal(preview);
    expect(preview.stderr).toBe(real.stderr);
    expect(snapshotTree(target)).toBe(beforeTarget);
    expect(snapshotTree(kitHome)).toBe("");
  });

  it.skipIf(CHMOD_SKIP !== null)(
    "(d) an unreadable layout (EACCES on the pre-v3 root) refuses with exit 1, naming the path and the code, and writes nothing",
    () => {
      const { target, kitHome, home } = world();
      const legacyRoot = join(target, LEGACY_STATE_ROOT_REL);
      const beforeTarget = snapshotTree(target);
      let r: Run;
      chmodSync(legacyRoot, 0o000); // mode-census: access-denial
      try {
        r = runInstall(target, kitHome, [], { home });
      } finally {
        chmodSync(legacyRoot, 0o755); // mode-census: restore
      }
      expect(r.error).toBeUndefined();
      expect(r.status).toBe(1);
      expect(r.stdout).toBe("");
      const lines = r.stderr.trimEnd().split("\n");
      expect(lines, r.stderr).toHaveLength(1);
      expect(lines[0]).toContain("the state layout could not be read");
      // The path in the host spelling (lineNamesPath, the path-spelling census rule (t3)), followed by the code.
      expect(lineNamesPath(lines[0], join(target, LEGACY_BOARD_REL)), lines[0]).toBe(true);
      expect(lines[0]).toContain(": EACCES)");
      expect(lines[0]).toContain("Nothing was written.");
      expect(snapshotTree(target)).toBe(beforeTarget);
      expect(snapshotTree(kitHome)).toBe("");
    },
  );
});

// ── plan 36-13: the other entry points (D-02, D-05, D-06, D-07, LAYOUT-04) ─────────────────────────────────────────

/** The lines of `out` that carry the report label `label` (report's `  <label padded to 14> <msg>` shape). */
function labelled(out: string, label: string): string[] {
  return out.split("\n").filter((l) => l.startsWith(`  ${label.padEnd(14)} `));
}

// The scratch directory's own name holds "pre-v3" (mkdtemp prefix "grugops-pre-v3-"), and every printed path holds it,
// so the cases below look for the layout wording ("pre-v3 layout", "state layout: pre-v3 (") and never the bare word.

/** The doctor's state-layout lines in `out`. */
function layoutLines(out: string): string[] {
  return out.split("\n").filter((l) => l.includes("state layout: "));
}

/** A world whose target is built by `plant` (no pre-v3 fixture unless `plant` adds it). */
function worldOf(plant: (target: string) => void): { target: string; kitHome: string; home: string } {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  plant(target);
  return { target, kitHome: join(root, "kit-home"), home };
}

/** A v1.0 vendored-kit repository (makeOldLayoutFixture) that also holds the pre-v3 board (makePreV3StateFixture). */
const oldLayoutPreV3 = (): { target: string; kitHome: string; home: string } =>
  worldOf((t) => {
    makeOldLayoutFixture(t);
    makePreV3StateFixture(t);
  });

/** A repository holding a board at BOARD_REL and one at LEGACY_BOARD_REL (D-02). */
const bothBoards = (): { target: string; kitHome: string; home: string } =>
  worldOf((t) => {
    makeFixture(t);
    makePreV3StateFixture(t);
  });

/** The pre-v3 state is still the user's bytes. */
function expectPreV3StateKept(target: string): void {
  expect(readFileSync(join(target, LEGACY_BOARD_REL), "utf8")).toBe(PRE_V3_BOARD_TEXT);
  expect(readFileSync(join(target, PRE_V3_TICKET_REL), "utf8")).toBe(PRE_V3_TICKET_TEXT);
}

/** The pre-v3 ticket's path once the state migrate renamed the pre-v3 root to STATE_ROOT_REL (D-17). */
const MOVED_TICKET_REL = join(STATE_ROOT_REL, relative(LEGACY_STATE_ROOT_REL, PRE_V3_TICKET_REL));

/**
 * Run --migrate on oldLayoutPreV3() and assert it migrated the pre-v3 state in the same run (case (e)'s core, plan
 * 38-03, D-11, D-17): the pre-v3 root is gone, the v3 board and the layout marker exist, the original board is archived
 * unchanged, and the ticket is byte-identical at its moved path.
 */
function migratedPreV3(): { target: string; kitHome: string; home: string; r: Run } {
  const w = oldLayoutPreV3();
  const r = runInstall(w.target, w.kitHome, ["--migrate", "--backup-edited-kit"], { home: w.home });
  expect(r.error).toBeUndefined();
  expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  expect(existsSync(join(w.target, LEGACY_STATE_ROOT_REL)), "the pre-v3 root is gone").toBe(false);
  expect(existsSync(join(w.target, BOARD_REL)), "the v3 board exists").toBe(true);
  expect(readFileSync(join(w.target, LAYOUT_MARKER_REL), "utf8")).toBe("layout: v3\n");
  expect(readFileSync(join(w.target, PRE_V3_BOARD_REL), "utf8")).toBe(PRE_V3_BOARD_TEXT);
  expect(readFileSync(join(w.target, MOVED_TICKET_REL), "utf8")).toBe(PRE_V3_TICKET_TEXT);
  return { ...w, r };
}

/** Every file and directory under STATE_ROOT_REL in `target`, by snapshotTree. */
const stateSnapshot = (target: string): string => snapshotTree(join(target, STATE_ROOT_REL));

describe("the other entry points on the pre-v3 state layout never fork state (plan 36-13, D-02, D-05, D-06, D-07, LAYOUT-04)", () => {
  it("(e) --migrate on a v1.0 vendored-kit repository holding the pre-v3 board runs the two-root steps, then moves the state to the v3 layout", () => {
    const { target, r } = migratedPreV3();
    // The two-root steps ran: the pre-steps section, and the in-repo kit is no longer live in the target.
    expect(r.stdout).toContain("-- migrate pre-steps --");
    expect(existsSync(join(target, "agent-factory", "roles", "orchestrator.md")), "the in-repo kit was moved aside").toBe(false);
    // Then the state migrate, before the state seed, which no longer skips the v3 state root.
    const at = r.stdout.indexOf("-- state migrate --");
    expect(at, r.stdout).toBeGreaterThan(r.stdout.indexOf("-- migrate pre-steps --"));
    expect(at).toBeLessThan(r.stdout.indexOf("-- state seed --"));
    const moved = labelled(r.stdout, "moved").filter((l) => l.includes(`${LEGACY_STATE_ROOT_REL}/ → ${STATE_ROOT_REL}/`));
    expect(moved, r.stdout).toHaveLength(1);
    expect(labelled(r.stdout, "skipped").filter((l) => l.includes(`${STATE_ROOT_REL}/ seed`)), r.stdout).toEqual([]);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
  });

  it("(f) a repository with both boards installs on the v3 layout with exactly one stale note, no verify, and both boards byte-identical", () => {
    const { target, kitHome, home } = bothBoards();
    const v3Board = readFileSync(join(target, BOARD_REL), "utf8");
    const r = runInstall(target, kitHome, [], { home });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const stale = labelled(r.stdout, "note").filter((l) => l.includes("is stale"));
    expect(stale, r.stdout).toHaveLength(1);
    expect(stale[0]).toContain(`${LEGACY_STATE_ROOT_REL}/ is stale`);
    expect(stale[0]).toContain(BOARD_REL);
    expect(stale[0]).toContain(LEGACY_BOARD_REL);
    expect(stale[0]).toContain("merges or deletes nothing");
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    expect(readFileSync(join(target, BOARD_REL), "utf8")).toBe(v3Board);
    expectPreV3StateKept(target);
  });

  it("(g) a fresh repository installs with no layout note", () => {
    const { target, kitHome, home } = worldOf(() => {});
    const r = runInstall(target, kitHome, [], { home });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout).not.toContain("is stale");
    expect(r.stdout).not.toContain("pre-v3 layout");
    expect(r.stderr).not.toContain("pre-v3 layout");
    expect(existsSync(join(target, BOARD_REL))).toBe(true);
  });

  it("(h) a regular file at the pre-v3 root (ENOTDIR on its board path) is not pre-v3 and installs normally", () => {
    const fileText = "a user file that happens to carry the pre-v3 root's name\n";
    const { target, kitHome, home } = worldOf((t) => writeFileSync(join(t, LEGACY_STATE_ROOT_REL), fileText));
    const r = runInstall(target, kitHome, [], { home });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout).not.toContain("is stale");
    expect(r.stdout).not.toContain("pre-v3 layout");
    expect(r.stderr).not.toContain("pre-v3 layout");
    expect(readFileSync(join(target, LEGACY_STATE_ROOT_REL), "utf8")).toBe(fileText);
    expect(existsSync(join(target, BOARD_REL))).toBe(true);
  });

  it.skipIf(CHMOD_SKIP !== null)(
    "(i) --migrate over an unreadable pre-v3 root (EACCES) is a pre-check refusal naming the path and the code, and writes nothing",
    () => {
      const { target, kitHome, home } = oldLayoutPreV3();
      const legacyRoot = join(target, LEGACY_STATE_ROOT_REL);
      const before = snapshotTree(target);
      let r: Run;
      chmodSync(legacyRoot, 0o000); // mode-census: access-denial
      try {
        r = runInstall(target, kitHome, ["--migrate", "--backup-edited-kit"], { home });
      } finally {
        chmodSync(legacyRoot, 0o755); // mode-census: restore
      }
      expect(r.error).toBeUndefined();
      expect(existsSync(join(target, STATE_ROOT_REL)), "nothing is seeded under the v3 state root").toBe(false);
      expect(r.stdout).toContain("-- migrate pre-check (before any change) --");
      const verifies = labelled(r.stdout, "verify");
      expect(verifies, r.stdout).toHaveLength(1);
      const named = verifies.filter((l) => lineNamesPath(l, join(target, LEGACY_BOARD_REL)) && l.includes(": EACCES"));
      expect(named, r.stdout).toHaveLength(1);
      expect(named[0]).toContain("the state layout could not be read");
      // A counted verify ends the run INCOMPLETE (exit 3), never a silent pass. The pre-check stops it before any write:
      // the two-root steps did not run, the in-repo kit and the configuration are where they were.
      expect(r.status, r.stdout).toBe(3);
      expect(r.stdout).not.toContain("-- migrate pre-steps --");
      expect(snapshotTree(target), "the target is byte-identical").toBe(before);
      expect(snapshotTree(kitHome), "nothing was copied to the kit home").toBe("");
      expectPreV3StateKept(target);
    },
  );

  it("(j) --check after (e) prints one ok state-layout line naming the v3 state root, no pre-v3 WARN and no FAIL, and says the same twice", () => {
    const { target, kitHome, home } = migratedPreV3();
    const before = snapshotTree(target);
    const check = runInstall(target, kitHome, ["--check"], { home });
    expect(check.error).toBeUndefined();
    expect(check.status, check.stdout).toBe(0);
    expect(labelled(check.stdout, "FAIL"), check.stdout).toEqual([]);
    const lines = layoutLines(check.stdout);
    expect(lines, check.stdout).toEqual([`  ${"ok".padEnd(14)} state layout: ${STATE_ROOT_REL}/`]);
    expect(labelled(check.stdout, "WARN").filter((l) => l.includes("pre-v3")), check.stdout).toEqual([]);
    const again = runInstall(target, kitHome, ["--check"], { home });
    expect(again.status, again.stdout).toBe(0);
    expect(layoutLines(again.stdout)).toEqual(lines);
    expect(snapshotTree(target), "--check writes nothing in the target").toBe(before);
  });

  it("(k) --check WARNs once that the pre-v3 root is stale on a both repository, and prints one ok layout line on a current install", () => {
    const both = bothBoards();
    expect(runInstall(both.target, both.kitHome, [], { home: both.home }).status).toBe(0);
    const bothCheck = runInstall(both.target, both.kitHome, ["--check"], { home: both.home });
    expect(labelled(bothCheck.stdout, "FAIL"), bothCheck.stdout).toEqual([]);
    const bothLines = layoutLines(bothCheck.stdout);
    expect(bothLines, bothCheck.stdout).toHaveLength(1);
    expect(labelled(bothCheck.stdout, "WARN")).toContain(bothLines[0]);
    expect(bothLines[0]).toContain(`${STATE_ROOT_REL}/ is used`);
    expect(bothLines[0]).toContain(`${LEGACY_STATE_ROOT_REL}/ is stale`);
    expectPreV3StateKept(both.target);

    const current = worldOf((t) => makeFixture(t));
    expect(runInstall(current.target, current.kitHome, [], { home: current.home }).status).toBe(0);
    const currentCheck = runInstall(current.target, current.kitHome, ["--check"], { home: current.home });
    expect(layoutLines(currentCheck.stdout), currentCheck.stdout).toEqual([`  ${"ok".padEnd(14)} state layout: ${STATE_ROOT_REL}/`]);
  });

  it("(l) --update into a scratch kit home leaves a pre-v3 repository byte-identical, and the kit home's Orchestrator carries the fallback clause", () => {
    const { target, kitHome, home } = world();
    const before = snapshotTree(target);
    const r = runInstall(target, kitHome, ["--update"], { home });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stderr).not.toContain("pre-v3 layout");
    expect(snapshotTree(target)).toBe(before);
    expect(readFileSync(join(kitHome, "agent-factory", "roles", "orchestrator.md"), "utf8")).toContain(LEGACY_FALLBACK_CLAUSE);
  });

  it("(m) uninstall on the migrated repository of (e) is not refused by the layout and keeps every file under the v3 state root", () => {
    const { target, kitHome, home } = migratedPreV3();
    const before = stateSnapshot(target);
    expect(before).toContain("board.md ");
    const r = runUninstall(target, kitHome, { home });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stderr).not.toContain("pre-v3 layout");
    expect(stateSnapshot(target)).toBe(before);
  });
});
