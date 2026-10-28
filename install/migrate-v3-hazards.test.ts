// migrate-v3-hazards.test.ts — every unsafe shape of a real repository is a named refusal of `install --migrate`
// before its first write (phase 38, plan 38-08, MIGRATE-04 refusals, MIGRATE-02 nothing lost; T-38-20, T-38-21).
//
// THE HAZARDS. The pre-v3 state is chosen by whoever controls the repository, so the migrate's input walk asks every
// entry by lstat and never follows a link, never opens a special file, and never reads past a bound. Each case below
// plants one hazard into the frozen pre-v3 fixture (makePreV3ChessFixture, materialized at test time; the fixture
// bytes are never edited) and runs the COMMITTED install/install.js:
//   (H1) a symbolic link under the pre-v3 tickets directory, to a file outside the target: exit 3, one verify naming
//        the link, the target and the outside file unchanged;
//   (H2) the pre-v3 root itself a symbolic link to a directory holding the fixture: exit 3, one verify naming it,
//        nothing written on either side of the link; (H2b) the progress file a link to a file outside, and (H2c) the
//        context root a link to a directory outside: the same refusal, naming the link, nothing read through it;
//   (H3) a FIFO under the pre-v3 root: exit 3, one verify naming it, and the run does not hang (it is never opened);
//   (H4) a file of USER_FILE_MAX_BYTES + 1 bytes under the pre-v3 root: exit 3, one verify naming the file and the
//        bound;
//   (H5) a pre-v3 tree of more than TREE_MAX_ENTRIES entries: exit 3, one verify naming the count and the bound;
//   (H6) the board with one CRLF line among LF lines: exit 3, one verify naming the board and its mixed line endings;
//   (H7) a staging directory left by an interrupted migrate, then a PLAIN install: exit 1, stdout empty, one stderr
//        sentence naming the directory and how to finish or remove it, nothing written;
//   (H8) a staging directory with a file inside, on a migrated repository, then --prune-old-kit and uninstall: the
//        directory and its file are byte-identical after each (it sits inside the protected memory-bank root);
//   (H9) a file under the pre-v3 root whose moved path would pass this platform's path limit: exit 3, one verify
//        naming that path and the limit (pathLimitProblem), nothing written.
// In every refusal case the target is byte-identical afterwards (snapshotTree) and nothing reached the kit home. A
// second filesystem (the device comparison) has no case here: it needs a mount; plan 38-06's EXDEV fault case is the
// commit-time proof.
//
// Hermetic: every run goes through runInstall or runUninstall with GRUGOPS_HOME and HOME inside a scratch directory
// removed after the file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED
// install/install.js and install/uninstall.js (npm run build first). Clear professional voice: this is a safety
// surface (no refusal may follow a write).

import { afterAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { skipLine, stageShapeOrSkip } from "../scripts/check-platform-shapes.js";
import {
  CONTEXT_REL,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  MIGRATE_STAGING_REL,
  PROGRESS_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
} from "./state-layout.js";
import { PATH_MAX_BYTES, TREE_MAX_ENTRIES, USER_FILE_MAX_BYTES } from "./user-file.js";
import { lineNamesPath, makePreV3ChessFixture, runInstall, runUninstall, snapshotTree, type Run } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-hazards-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let seq = 0;
type World = { readonly root: string; readonly target: string; readonly kitHome: string; readonly home: string };
/** A fresh world: a target holding the frozen pre-v3 fixture, a scratch HOME, and a kit home that does not exist yet. */
function preV3World(): World {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  makePreV3ChessFixture(target);
  return { root, target, kitHome: join(root, "kit-home"), home };
}

const at = (root: string, rel: string): string => join(root, ...rel.split("/"));
/** The pre-v3 tickets directory: TICKETS_REL's last segment under the pre-v3 root (no pre-v3 path is spelled here). */
const PRE_V3_TICKETS_DIR_REL = `${LEGACY_STATE_ROOT_REL}/${TICKETS_REL.split("/").slice(-1)[0]}`;

/** The lines of `out` printed under `label` (report's `  <label padded to 14> <msg>` shape). */
function labelled(out: string, label: string): string[] {
  return out.split("\n").filter((l) => l.startsWith(`  ${label.padEnd(14)} `));
}

function migrate(w: World, timeoutMs = 180_000): Run {
  const r = runInstall(w.target, w.kitHome, ["--migrate"], { home: w.home, timeoutMs });
  expect(r.error, "the run finished (it did not hang or fail to spawn)").toBeUndefined();
  return r;
}

/**
 * Run --migrate and assert a pre-check refusal: exit 3, exactly one verify line (returned), the target byte-identical
 * to `before`, and nothing written to the kit home.
 */
function expectRefusal(w: World, before: string, timeoutMs = 180_000): string {
  const r = migrate(w, timeoutMs);
  expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(3);
  expect(r.stdout).toContain("-- migrate pre-check (before any change) --");
  const verifies = labelled(r.stdout, "verify");
  expect(verifies, r.stdout).toHaveLength(1);
  expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  expect(snapshotTree(w.kitHome), "nothing was written to the kit home").toBe("");
  return verifies[0] as string;
}

/** A symbolic link cannot be made here (win32 without the privilege), or null when it can. */
const LINK_SKIP: string | null = process.platform === "win32" ? "win32: a symbolic link needs a privilege the run may lack" : null;
if (LINK_SKIP !== null) console.log(`SKIP 4 link cases (H1, H2, H2b, H2c) of migrate-v3-hazards.test.ts — ${LINK_SKIP}`);

describe("hazards of a real repository refuse --migrate before any write (plan 38-08, MIGRATE-04)", () => {
  it.skipIf(LINK_SKIP !== null)("(H1) a link under the pre-v3 tickets directory, to a file outside the target, is a pre-check refusal naming the link", () => {
    const w = preV3World();
    const outside = join(w.root, "outside.md");
    writeFileSync(outside, "a file outside the target the link points at\n");
    const link = at(w.target, `${PRE_V3_TICKETS_DIR_REL}/ABC-999-a-link.md`);
    symlinkSync(outside, link);
    const outsideBefore = readFileSync(outside);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, link), v).toBe(true);
    expect(v).toContain("symbolic link");
    expect(readFileSync(outside).equals(outsideBefore), "the file outside the target is unchanged").toBe(true);
  });

  it.skipIf(LINK_SKIP !== null)("(H2) the pre-v3 root a link to a directory holding the fixture is a pre-check refusal naming it, nothing written", () => {
    const w = preV3World();
    const legacyRoot = at(w.target, LEGACY_STATE_ROOT_REL);
    const elsewhere = join(w.root, "elsewhere-state");
    renameSync(legacyRoot, elsewhere);
    symlinkSync(elsewhere, legacyRoot);
    expect(existsSync(at(w.target, LEGACY_BOARD_REL)), "PREMISE: the board is reached through the link").toBe(true);
    const elsewhereBefore = snapshotTree(elsewhere);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, legacyRoot), v).toBe(true);
    expect(v).toContain("symbolic link");
    expect(snapshotTree(elsewhere), "nothing was written through the link").toBe(elsewhereBefore);
  });

  it.skipIf(LINK_SKIP !== null)("(H2b) the progress file a link to a file outside the target is a pre-check refusal naming it, never read through", () => {
    const w = preV3World();
    const progress = at(w.target, PROGRESS_REL);
    const outside = join(w.root, "outside-progress.md");
    renameSync(progress, outside);
    symlinkSync(outside, progress);
    const outsideBefore = readFileSync(outside);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, progress), v).toBe(true);
    expect(v).toContain("symbolic link");
    expect(readFileSync(outside).equals(outsideBefore), "the file outside the target is unchanged").toBe(true);
  });

  it.skipIf(LINK_SKIP !== null)("(H2c) the context root a link to a directory outside the target is a pre-check refusal naming it", () => {
    const w = preV3World();
    const context = at(w.target, CONTEXT_REL);
    const outside = join(w.root, "outside-context");
    renameSync(context, outside);
    symlinkSync(outside, context);
    const outsideBefore = snapshotTree(outside);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, context), v).toBe(true);
    expect(v).toContain("symbolic link");
    expect(snapshotTree(outside), "nothing was written through the link").toBe(outsideBefore);
  });

  it.skipIf(process.platform === "win32")("(H3) a FIFO under the pre-v3 root is a pre-check refusal naming it, and the run does not hang", () => {
    const w = preV3World();
    const fifo = at(w.target, `${LEGACY_STATE_ROOT_REL}/notes.fifo`);
    const skip = stageShapeOrSkip("FIFO", fifo, "migrate-v3-hazards (H3)");
    if (skip !== null) {
      console.log(skipLine(skip, "the special-file kind check of readMigrateInputs, read by review"));
      return;
    }
    // A run that opened the FIFO for reading would block until the 60 s timeout, and r.error would be set.
    const v = expectRefusal(w, snapshotTree(w.target), 60_000);
    expect(lineNamesPath(v, fifo), v).toBe(true);
    expect(v).toContain("fifo");
  });

  it("(H4) a file over USER_FILE_MAX_BYTES under the pre-v3 root is a pre-check refusal naming the file and the bound", () => {
    const w = preV3World();
    const big = at(w.target, `${PRE_V3_TICKETS_DIR_REL}/ABC-998-too-large.md`);
    writeFileSync(big, "");
    truncateSync(big, USER_FILE_MAX_BYTES + 1); // sparse: no byte is written one by one
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, big), v).toBe(true);
    expect(v).toContain(`${USER_FILE_MAX_BYTES + 1} bytes`);
    expect(v).toContain(`${USER_FILE_MAX_BYTES} bytes`);
  });

  it("(H5) a pre-v3 tree of more than TREE_MAX_ENTRIES entries is a pre-check refusal naming the count and the bound", () => {
    const w = preV3World();
    const bulk = at(w.target, `${LEGACY_STATE_ROOT_REL}/bulk/notes`);
    mkdirSync(bulk, { recursive: true });
    for (let i = 0; i <= TREE_MAX_ENTRIES; i++) writeFileSync(join(bulk, `n${String(i).padStart(5, "0")}.md`), "");
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, at(w.target, LEGACY_STATE_ROOT_REL)), v).toBe(true);
    expect(v).toContain(`${TREE_MAX_ENTRIES + 1}`);
    expect(v).toContain(`bound of ${TREE_MAX_ENTRIES} entries`);
  }, 300_000);

  it("(H6) a board with one CRLF line among LF lines is a pre-check refusal naming the board and its mixed line endings", () => {
    const w = preV3World();
    const board = at(w.target, LEGACY_BOARD_REL);
    const text = readFileSync(board, "utf8");
    const nl = text.indexOf("\n");
    expect(nl, "PREMISE: the fixture board has an LF line").toBeGreaterThan(0);
    expect(text.includes("\r"), "PREMISE: the fixture board has no CR").toBe(false);
    writeFileSync(board, `${text.slice(0, nl)}\r${text.slice(nl)}`);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(v).toContain(LEGACY_BOARD_REL);
    expect(v).toContain("mixes LF and CRLF line endings");
  });

  it("(H7) a staging directory left by an interrupted migrate refuses a plain install: exit 1, one stderr sentence, nothing written", () => {
    const w = preV3World();
    const m = migrate(w);
    expect(m.status, `${m.stdout}\n${m.stderr}`).toBe(0);
    const staging = at(w.target, MIGRATE_STAGING_REL);
    mkdirSync(staging);
    writeFileSync(join(staging, "commit-plan.txt"), "the commit plan an interrupted run left\n");
    const before = snapshotTree(w.target);
    const kitBefore = snapshotTree(w.kitHome);
    const r = runInstall(w.target, w.kitHome, [], { home: w.home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(1);
    expect(r.stdout, "nothing on stdout").toBe("");
    const lines = r.stderr.split("\n").filter((l) => l.trim() !== "");
    expect(lines, r.stderr).toHaveLength(1);
    const line = lines[0] as string;
    expect(lineNamesPath(line, staging), line).toBe(true);
    expect(line).toContain("commit-plan.txt");
    expect(line).toContain("--migrate");
    expect(line).toContain("remove");
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
    expect(snapshotTree(w.kitHome), "the kit home is byte-identical").toBe(kitBefore);
  });

  it("(H8) --prune-old-kit and uninstall leave a leftover staging directory and its file byte-identical", () => {
    const w = preV3World();
    const m = migrate(w);
    expect(m.status, `${m.stdout}\n${m.stderr}`).toBe(0);
    expect(existsSync(at(w.target, LAYOUT_MARKER_REL)), "PREMISE: the state was migrated").toBe(true);
    const staging = at(w.target, MIGRATE_STAGING_REL);
    mkdirSync(staging);
    writeFileSync(join(staging, "commit-plan.txt"), "the commit plan an interrupted run left\n");
    const stagingBefore = snapshotTree(staging);
    expect(stagingBefore).toContain("commit-plan.txt");
    const prune = runInstall(w.target, w.kitHome, ["--prune-old-kit"], { home: w.home, timeoutMs: 180_000 });
    expect(prune.error).toBeUndefined();
    expect([0, 3], `${prune.stdout}\n${prune.stderr}`).toContain(prune.status);
    expect(snapshotTree(staging), "--prune-old-kit left the staging directory as it was").toBe(stagingBefore);
    const un = runUninstall(w.target, w.kitHome, { home: w.home, timeoutMs: 180_000 });
    expect(un.error).toBeUndefined();
    expect([0, 3], `${un.stdout}\n${un.stderr}`).toContain(un.status);
    expect(snapshotTree(staging), "uninstall left the staging directory as it was").toBe(stagingBefore);
    expect(existsSync(at(w.target, `${STATE_ROOT_REL}`)), "uninstall kept the migrated state").toBe(true);
  });

  it.skipIf(process.platform === "win32")("(H9) a moved path past this platform's path limit is a pre-check refusal naming it and the limit", () => {
    const w = preV3World();
    // A file under the pre-v3 root whose own path is under the limit, but whose path after the root is renamed to
    // STATE_ROOT_REL is at or over it: the moved path is longer by the length difference of the two roots.
    const grow = STATE_ROOT_REL.length - LEGACY_STATE_ROOT_REL.length;
    expect(grow, "PREMISE: the v3 state root is longer than the pre-v3 root").toBeGreaterThan(0);
    const want = PATH_MAX_BYTES - 1 - Math.floor(grow / 2); // the source path's byte length: under the limit
    let dir = at(w.target, `${LEGACY_STATE_ROOT_REL}/deep`);
    while (want - dir.length > 250) dir = join(dir, "d".repeat(200));
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "f".repeat(want - dir.length - 1));
    expect(Buffer.byteLength(file), "PREMISE: the source path is under the limit").toBeLessThan(PATH_MAX_BYTES);
    writeFileSync(file, "a note kept deep in the tree\n");
    const moved = at(w.target, STATE_ROOT_REL) + file.slice(at(w.target, LEGACY_STATE_ROOT_REL).length);
    expect(Buffer.byteLength(moved), "PREMISE: the moved path is at or over the limit").toBeGreaterThanOrEqual(PATH_MAX_BYTES);
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, moved), v).toBe(true);
    expect(v).toContain(`path limit of ${PATH_MAX_BYTES - 1} bytes`);
  });
});
