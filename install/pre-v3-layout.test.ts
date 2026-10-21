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
// Plan 36-13 adds the --migrate, both, doctor, --update and uninstall cases to this file.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after
// the file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: this is a safety surface (no user state is ever written over).

import { afterAll, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOARD_REL, LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL, STATE_ROOT_REL } from "./state-layout.js";
import {
  ALL_AGENT_FLAGS,
  PRE_V3_BOARD_TEXT,
  PRE_V3_TICKET_REL,
  PRE_V3_TICKET_TEXT,
  lineNamesPath,
  makePreV3StateFixture,
  printedCommand,
  runInstall,
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
