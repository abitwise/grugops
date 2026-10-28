// migrate-v3-states.test.ts — every row of the `install --migrate` state machine (phase 38, plan 38-07, MIGRATE-04,
// MIGRATE-01 concurrency; D-11, D-12, D-13, D-19).
//
// THE TABLE. `install --migrate` asks two questions before it changes anything: which kit layout the target is on
// (the vendored v1.0 kit, an installed two-root repository, or a clean one), and which state layout its planning state
// is on (stateLayout(): current, pre-v3, both, fresh, or unreadable). Each pair gets one named answer:
//   both                      a pre-check refusal on every kit arm: exit 3, one verify naming both boards, nothing
//                             written (the run cannot choose between them);
//   unreadable                a pre-check refusal naming the path and the error code, nothing written;
//   pre-v3 + a held claim     a non-empty QUEUE_CLAIMED_REL (an agent holds a claim) is a pre-check refusal naming the
//                             directory; an empty claimed directory does not refuse; a link there refuses too;
//   pre-v3 + staging          an existing MIGRATE_STAGING_REL (another migrate running, or one interrupted) is a
//                             pre-check refusal naming it and its commit-plan.txt;
//   vendored kit + a refusal  a v3 refusal stops the two-root arm too: agent-factory/ is not backed up and no
//                             configuration moves (D-11);
//   fresh                     one line that there is no planning state to migrate; on an installed two-root
//                             repository the already-migrated arm then answers, and no layout marker is written;
//   current + valid marker    one ok line that the state is already on the v3 layout; nothing written;
//   current + no marker       one note, and still no marker afterwards (migrate does not mark state it did not
//                             migrate); current + an invalid marker: one note naming its content, its bytes unchanged;
//   a second --migrate        after a successful one, the target and the kit home are byte-identical (the table's
//                             last row, as (M2) of migrate-v3.test.ts holds it on the same fixture);
//   a recorded backup         under the pre-v3 root (an earlier handoffs backup) moves with the state; one note names
//                             its new path and says it is no longer recorded.
// The rows where the v3 arm runs (installed two-root, vendored kit, clean) are held by migrate-v3.test.ts,
// pre-v3-layout.test.ts case (e) and agents-record.test.ts WR-04.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after the
// file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: this is a safety surface (no refusal may follow a write).

import { afterAll, describe, expect, it } from "vitest";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BOARD_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_HANDOFFS_REL,
  LEGACY_STATE_ROOT_REL,
  MEMORY_BANK_REL,
  MIGRATE_STAGING_REL,
  QUEUE_CLAIMED_REL,
  STATE_ROOT_REL,
} from "./state-layout.js";
import { movedRel } from "./state-migrate.js";
import {
  MARKER_REL,
  lineNamesPath,
  makeOldLayoutFixture,
  makePreV3ChessFixture,
  makePreV3StateFixture,
  runInstall,
  snapshotTree,
  type Run,
} from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-states-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let seq = 0;
type World = { readonly target: string; readonly kitHome: string; readonly home: string };
/** A fresh world: an empty target, a scratch HOME, and a kit home path that does not exist yet. */
function emptyWorld(): World {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, kitHome: join(root, "kit-home"), home };
}

const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

/** The lines of `out` printed under `label` (report's `  <label padded to 14> <msg>` shape). */
function labelled(out: string, label: string): string[] {
  return out.split("\n").filter((l) => l.startsWith(`  ${label.padEnd(14)} `));
}

function migrate(w: World, extra: readonly string[] = []): Run {
  const r = runInstall(w.target, w.kitHome, ["--migrate", ...extra], { home: w.home, timeoutMs: 180_000 });
  expect(r.error).toBeUndefined();
  return r;
}

/** An installed two-root repository: a plain install into an empty target. */
function installedWorld(): World {
  const w = emptyWorld();
  const r = runInstall(w.target, w.kitHome, [], { home: w.home, timeoutMs: 180_000 });
  expect(r.error).toBeUndefined();
  expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  expect(existsSync(at(w.target, MARKER_REL)), "PREMISE: the install wrote its marker").toBe(true);
  return w;
}

/**
 * Run --migrate (with `extra`) and assert a pre-check refusal: exit 3, exactly one verify line (returned), the target byte-identical
 * to `before`, and the kit home absent (nothing was copied to it).
 */
function expectRefusal(w: World, before: string, extra: readonly string[] = []): string {
  const r = migrate(w, extra);
  expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(3);
  expect(r.stdout).toContain("-- migrate pre-check (before any change) --");
  const verifies = labelled(r.stdout, "verify");
  expect(verifies, r.stdout).toHaveLength(1);
  expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  expect(snapshotTree(w.kitHome), "nothing was copied to the kit home").toBe("");
  return verifies[0] as string;
}

/** Why a directory mode cannot make lstat fail here, or null when the mode 000 case can run. */
const CHMOD_SKIP: string | null =
  process.platform === "win32"
    ? "win32: a directory mode does not stop a read"
    : typeof process.getuid === "function" && process.getuid() === 0
      ? "running as root: a directory mode does not stop root"
      : null;
if (CHMOD_SKIP !== null) console.log(`SKIP the unreadable case of migrate-v3-states.test.ts — ${CHMOD_SKIP}`);

/** A symbolic link cannot be made here (win32 without the privilege), or null when it can. */
const LINK_SKIP: string | null = process.platform === "win32" ? "win32: a symbolic link needs a privilege the run may lack" : null;

describe("the --migrate state machine (plan 38-07, MIGRATE-04)", () => {
  it("(S1) a both layout is a pre-check refusal: exit 3, one verify naming both boards, nothing written", () => {
    const w = emptyWorld();
    makePreV3StateFixture(w.target);
    mkdirSync(at(w.target, STATE_ROOT_REL), { recursive: true });
    writeFileSync(at(w.target, BOARD_REL), "a user's v3 board\n");
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, at(w.target, BOARD_REL)), v).toBe(true);
    expect(lineNamesPath(v, at(w.target, LEGACY_BOARD_REL)), v).toBe(true);
    expect(v).toContain("cannot choose between them");
  });

  it("(S2) a non-empty claimed queue is a pre-check refusal naming the claim directory, nothing written", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    mkdirSync(at(w.target, QUEUE_CLAIMED_REL), { recursive: true });
    writeFileSync(at(w.target, `${QUEUE_CLAIMED_REL}/task-1.md`), "a claimed task\n");
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, at(w.target, QUEUE_CLAIMED_REL)), v).toBe(true);
    expect(v).toContain("task-1.md");
  });

  it("(S3) an empty claimed directory does not refuse: the state migrates and the marker is written", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    mkdirSync(at(w.target, QUEUE_CLAIMED_REL), { recursive: true });
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    expect(readFileSync(at(w.target, LAYOUT_MARKER_REL), "utf8")).toBe(`${LAYOUT_MARKER_CONTENT}\n`);
    expect(existsSync(at(w.target, LEGACY_STATE_ROOT_REL)), "the pre-v3 root is gone").toBe(false);
  });

  it.skipIf(LINK_SKIP !== null)("(S4) a link at the claimed directory is a pre-check refusal naming it, nothing written", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    const elsewhere = join(w.target, "..", "elsewhere");
    mkdirSync(elsewhere, { recursive: true });
    mkdirSync(at(w.target, QUEUE_CLAIMED_REL.split("/").slice(0, -1).join("/")), { recursive: true });
    symlinkSync(elsewhere, at(w.target, QUEUE_CLAIMED_REL));
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, at(w.target, QUEUE_CLAIMED_REL)), v).toBe(true);
    expect(v).toContain("link");
  });

  it("(S5) an existing staging directory is a pre-check refusal naming it and its commit plan, nothing written", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    mkdirSync(at(w.target, MIGRATE_STAGING_REL), { recursive: true });
    writeFileSync(at(w.target, `${MIGRATE_STAGING_REL}/commit-plan.txt`), "rename plans -> memory-bank/plans\n");
    const v = expectRefusal(w, snapshotTree(w.target));
    expect(lineNamesPath(v, at(w.target, MIGRATE_STAGING_REL)), v).toBe(true);
    expect(lineNamesPath(v, join(at(w.target, MIGRATE_STAGING_REL), "commit-plan.txt")), v).toBe(true);
  });

  it.skipIf(CHMOD_SKIP !== null)("(S6) an unreadable pre-v3 root (EACCES) is a pre-check refusal naming the path and the code, nothing written", () => {
    const w = emptyWorld();
    makePreV3StateFixture(w.target);
    const before = snapshotTree(w.target);
    const legacyRoot = at(w.target, LEGACY_STATE_ROOT_REL);
    let r: Run;
    chmodSync(legacyRoot, 0o000); // mode-census: access-denial
    try {
      r = migrate(w);
    } finally {
      chmodSync(legacyRoot, 0o755); // mode-census: restore
    }
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(3);
    const verifies = labelled(r.stdout, "verify");
    expect(verifies, r.stdout).toHaveLength(1);
    expect(lineNamesPath(verifies[0] as string, at(w.target, LEGACY_BOARD_REL)), verifies[0]).toBe(true);
    expect(verifies[0]).toContain("EACCES");
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
    expect(snapshotTree(w.kitHome), "nothing was copied to the kit home").toBe("");
  });

  it("(S7) on a vendored-kit repository a v3 refusal stops the two-root arm too: agent-factory/ is not backed up, no configuration moves", () => {
    const w = emptyWorld();
    makeOldLayoutFixture(w.target, { rootConfig: true });
    makePreV3ChessFixture(w.target);
    mkdirSync(at(w.target, QUEUE_CLAIMED_REL), { recursive: true });
    writeFileSync(at(w.target, `${QUEUE_CLAIMED_REL}/task-1.md`), "a claimed task\n");
    // --backup-edited-kit, as pre-v3-layout.test.ts case (e) passes it: the vendored kit's adapters hold edits install
    // did not write, so without it the kit plan is a second refusal.
    const v = expectRefusal(w, snapshotTree(w.target), ["--backup-edited-kit"]);
    expect(lineNamesPath(v, at(w.target, QUEUE_CLAIMED_REL)), v).toBe(true);
    expect(existsSync(at(w.target, "agent-factory/roles/orchestrator.md")), "the in-repo kit is where it was").toBe(true);
    expect(readdirSync(w.target).filter((n) => n.startsWith("agent-factory") && n !== "agent-factory"), "no backup of agent-factory/").toEqual([]);
    expect(readdirSync(w.target).filter((n) => n.startsWith("factory.config.json.bak")), "the root configuration was not moved").toEqual([]);
  });

  it("(S8) a fresh layout prints that there is no planning state to migrate and writes no layout marker", () => {
    const w = installedWorld();
    rmSync(at(w.target, STATE_ROOT_REL), { recursive: true, force: true });
    const before = snapshotTree(w.target);
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const lines = r.stdout.split("\n").filter((l) => l.includes("no planning state to migrate"));
    expect(lines, r.stdout).toHaveLength(1);
    expect(existsSync(at(w.target, LAYOUT_MARKER_REL)), "no layout marker").toBe(false);
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  });

  it("(S9) a current layout with a valid marker prints one ok line that the state is already on the v3 layout and writes nothing", () => {
    const w = installedWorld();
    expect(readFileSync(at(w.target, LAYOUT_MARKER_REL), "utf8"), "PREMISE: the install marked its fresh state").toMatch(/^layout: v3\n?$/);
    const before = snapshotTree(w.target);
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const ok = labelled(r.stdout, "ok").filter((l) => l.includes("already on the v3 layout"));
    expect(ok, r.stdout).toHaveLength(1);
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  });

  it("(S10) a current layout with no marker prints one note and still has no marker afterwards", () => {
    const w = installedWorld();
    rmSync(at(w.target, LAYOUT_MARKER_REL));
    const before = snapshotTree(w.target);
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const notes = labelled(r.stdout, "note").filter((l) => l.includes(LAYOUT_MARKER_REL));
    expect(notes, r.stdout).toHaveLength(1);
    expect(notes[0]).toContain("does not mark");
    expect(existsSync(at(w.target, LAYOUT_MARKER_REL)), "no marker was written").toBe(false);
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  });

  it("(S11) a current layout with an invalid marker prints one note naming its content and leaves its bytes unchanged", () => {
    const w = installedWorld();
    const invalid = "layout: v2\u001b[31m\n";
    writeFileSync(at(w.target, LAYOUT_MARKER_REL), invalid);
    const before = snapshotTree(w.target);
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const notes = labelled(r.stdout, "note").filter((l) => l.includes(LAYOUT_MARKER_REL));
    expect(notes, r.stdout).toHaveLength(1);
    expect(notes[0]).toContain("layout: v2");
    expect(notes[0], "the printed content carries no control character").not.toContain("\u001b");
    expect(readFileSync(at(w.target, LAYOUT_MARKER_REL), "utf8")).toBe(invalid);
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(before);
  });

  it("(S12) a second --migrate after a successful one leaves the target and the kit home byte-identical", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    const first = migrate(w);
    expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);
    const target = snapshotTree(w.target);
    const kitHome = snapshotTree(w.kitHome);
    const second = migrate(w);
    expect(second.status, `${second.stdout}\n${second.stderr}`).toBe(0);
    expect(labelled(second.stdout, "ok").filter((l) => l.includes("already on the v3 layout")), second.stdout).toHaveLength(1);
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(target);
    expect(snapshotTree(w.kitHome), "the kit home is byte-identical").toBe(kitHome);
  });

  it("(S13) a recorded backup under the pre-v3 root moves with the state, and one note names its new path", () => {
    const w = installedWorld();
    mkdirSync(at(w.target, LEGACY_HANDOFFS_REL), { recursive: true });
    writeFileSync(at(w.target, `${LEGACY_HANDOFFS_REL}/h1.md`), "a user's handoff\n");
    const backedUp = migrate(w);
    expect(backedUp.status, `${backedUp.stdout}\n${backedUp.stderr}`).toBe(0);
    const marker = JSON.parse(readFileSync(at(w.target, MARKER_REL), "utf8")) as { ledger: Array<{ kind: string; path: string }> };
    const recorded = marker.ledger.filter((e) => e.kind === "backup" && e.path.startsWith(`${LEGACY_STATE_ROOT_REL}/`)).map((e) => e.path);
    expect(recorded, `PREMISE: the handoffs backup is recorded under the pre-v3 root\n${backedUp.stdout}`).toHaveLength(1);
    rmSync(at(w.target, STATE_ROOT_REL), { recursive: true, force: true });
    writeFileSync(at(w.target, LEGACY_BOARD_REL), "# Board\n\nA user's pre-v3 board.\n");
    const r = migrate(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const moved = movedRel(recorded[0] as string);
    expect(existsSync(at(w.target, `${moved}/h1.md`)), "the backup is at its moved path").toBe(true);
    const notes = labelled(r.stdout, "note").filter((l) => l.includes(recorded[0] as string));
    expect(notes, r.stdout).toHaveLength(1);
    expect(notes[0]).toContain(moved);
    expect(notes[0]).toContain("no longer recorded");
    expect(notes[0]).toContain(`${MEMORY_BANK_REL}/`);
    const after = JSON.parse(readFileSync(at(w.target, MARKER_REL), "utf8")) as { ledger: Array<{ kind: string; path: string }> };
    expect(after.ledger.filter((e) => e.kind === "backup" && e.path === recorded[0]), "the stale entry is dropped").toEqual([]);
  });
});
