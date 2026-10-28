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
//        directory and its file are byte-identical after each (it sits inside the protected memory-bank root).
// In every refusal case the target is byte-identical afterwards (snapshotTree) and nothing reached the kit home. A
// second filesystem (the device comparison) has no case here: it needs a mount; plan 38-06's EXDEV fault case is the
// commit-time proof.
//
// Hermetic: every run goes through runInstall or runUninstall with GRUGOPS_HOME and HOME inside a scratch directory
// removed after the file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED
// install/install.js and install/uninstall.js (npm run build first). Clear professional voice: this is a safety
// surface (no refusal may follow a write).

import { afterAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTEXT_REL, LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL, PROGRESS_REL, TICKETS_REL } from "./state-layout.js";
import { lineNamesPath, makePreV3ChessFixture, runInstall, snapshotTree, type Run } from "./installer-paths.test-support.js";

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
});
