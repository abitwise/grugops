// migrate-v3-dryrun.test.ts — `install --migrate --dry-run`, end to end, on the frozen pre-v3 fixture (phase 38, plan
// 38-09, MIGRATE-01; research Pitfall 1: install.js had DRY_RUN=1 and no `--dry-run` argument).
//
// WHAT THIS PROVES (a lettered case list):
//   (D1) on the materialized fixture, `--migrate --dry-run` exits 0; stdout holds one line per fixture file under the
//        pre-v3 root naming its moved path and its byte count (computed here from the fixture, never from the plan);
//        snapshotTree of the target and of the kit home are unchanged, and MIGRATE_STAGING_REL is never made;
//   (D2) `--migrate --dry-run` and DRY_RUN=1 `--migrate` print byte-identical stdout on the fixture, a second
//        `--dry-run` run prints the same again (the one per-run name, the adapter render's mkdtemp mirror, is
//        replaced before the whole stdout is compared; the state migrate section is compared exactly as printed), the
//        section is the listing only (every line in the report shape, the last one saying nothing was written), and
//        no run writes anything;
//   (D3) D-11 under the dry run: on a vendored-kit repository that also holds the pre-v3 state, `--migrate --dry-run`
//        previews both arms (the kit's backups and the state migrate) and leaves the target, its agent-factory/ and
//        the kit home unchanged.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after the
// file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: a preview that writes breaks the trust the flag asks for.

import { afterAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL, MIGRATE_STAGING_REL } from "./state-layout.js";
import { movedRel } from "./state-migrate.js";
import { PRE_V3_CHESS_DIR, makeOldLayoutFixture, makePreV3ChessFixture, runInstall, snapshotTree, type Run } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-dryrun-")));
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

/** Every regular file under `dir`, as sorted POSIX relative paths. */
function filesUnder(dir: string, rel = ""): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...filesUnder(dir, childRel));
    else if (ent.isFile()) out.push(childRel);
  }
  return out.sort();
}

/** Run install.js with `args` (`--migrate --dry-run` by default) and no DRY_RUN in the environment. */
function dryRun(w: World, args: readonly string[] = ["--migrate", "--dry-run"]): Run {
  const r = runInstall(w.target, w.kitHome, args, { home: w.home, timeoutMs: 180_000 });
  expect(r.error).toBeUndefined();
  return r;
}

/**
 * `out` with the one name that differs from run to run replaced: the adapter render runs in a fresh mkdtemp mirror
 * (`grugops-install-render-XXXXXX`), and its `render` line names it. Every other byte is compared as printed.
 */
function sameRun(out: string): string {
  return out.replace(/grugops-install-render-[A-Za-z0-9]{6}/g, "grugops-install-render-XXXXXX");
}

/** The lines of the run's `-- state migrate --` section: after its heading, up to the next blank line. */
function stateMigrateSection(out: string): string[] {
  const lines = out.split("\n");
  const at = lines.indexOf("-- state migrate --");
  if (at < 0) return [];
  const end = lines.findIndex((l, i) => i > at && l === "");
  return lines.slice(at + 1, end < 0 ? lines.length : end);
}

describe("install --migrate --dry-run (plan 38-09, MIGRATE-01)", () => {
  it("(D1) on the fixture, --migrate --dry-run lists each pre-v3 file's moved path and byte count and writes nothing", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    const targetBefore = snapshotTree(w.target);
    const kitHomeBefore = snapshotTree(w.kitHome);
    const r = dryRun(w);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout).toContain("-- state migrate --");
    const lines = r.stdout.split("\n");
    const boardRoot = join(PRE_V3_CHESS_DIR, "board-root");
    const files = filesUnder(boardRoot);
    expect(files.length, "PREMISE: the fixture holds files under its pre-v3 root").toBeGreaterThan(0);
    for (const rel of files) {
      const legacy = `${LEGACY_STATE_ROOT_REL}/${rel}`;
      const bytes = readFileSync(join(boardRoot, ...rel.split("/"))).length;
      const named = lines.filter((l) => l.includes(`${legacy} → ${movedRel(legacy)} (${bytes} bytes`));
      expect(named, `one line moves ${legacy} (${bytes} bytes)\n${r.stdout}`).toHaveLength(1);
    }
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(targetBefore);
    expect(snapshotTree(w.kitHome), "nothing was written to the kit home").toBe(kitHomeBefore);
    expect(existsSync(at(w.target, MIGRATE_STAGING_REL)), "no staging directory was made").toBe(false);
  });

  it("(D2) --migrate --dry-run and DRY_RUN=1 --migrate print the same stdout, twice over, and write nothing", () => {
    const w = emptyWorld();
    makePreV3ChessFixture(w.target);
    const targetBefore = snapshotTree(w.target);
    const kitHomeBefore = snapshotTree(w.kitHome);
    const byArgument = dryRun(w);
    expect(byArgument.status, `${byArgument.stdout}\n${byArgument.stderr}`).toBe(0);
    expect(snapshotTree(w.target), "the --dry-run run left the target as it was").toBe(targetBefore);
    const byEnvironment = runInstall(w.target, w.kitHome, ["--migrate"], { home: w.home, dryRun: true, timeoutMs: 180_000 });
    expect(byEnvironment.error).toBeUndefined();
    expect(byEnvironment.status, `${byEnvironment.stdout}\n${byEnvironment.stderr}`).toBe(0);
    const again = dryRun(w);
    expect(sameRun(byEnvironment.stdout), "DRY_RUN=1 prints what --dry-run prints").toBe(sameRun(byArgument.stdout));
    expect(sameRun(again.stdout), "a second --dry-run prints the same").toBe(sameRun(byArgument.stdout));
    const section = stateMigrateSection(byArgument.stdout);
    // The state migrate section names no temporary path, so it is compared exactly as printed.
    expect(stateMigrateSection(byEnvironment.stdout)).toEqual(section);
    expect(stateMigrateSection(again.stdout)).toEqual(section);
    expect(section.length, byArgument.stdout).toBeGreaterThan(0);
    expect(section.filter((l) => !/^ {2}\S+ +\S/.test(l)), "every line of the section is a listing line").toEqual([]);
    expect(section.at(-1)).toContain("nothing was written");
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(targetBefore);
    expect(snapshotTree(w.kitHome), "nothing was written to the kit home").toBe(kitHomeBefore);
    expect(existsSync(at(w.target, MIGRATE_STAGING_REL)), "no staging directory was made").toBe(false);
  });

  it("(D3) D-11: on a vendored-kit repository holding the pre-v3 state, the dry run previews both arms and writes nothing", () => {
    const w = emptyWorld();
    makeOldLayoutFixture(w.target, { rootConfig: true });
    makePreV3ChessFixture(w.target);
    const targetBefore = snapshotTree(w.target);
    const kitBefore = snapshotTree(at(w.target, "agent-factory"));
    const kitHomeBefore = snapshotTree(w.kitHome);
    // --backup-edited-kit, as migrate-v3-states.test.ts (S7) passes it: the vendored kit's adapters hold edits install
    // did not write, so without it the kit plan is a refusal.
    const r = dryRun(w, ["--migrate", "--dry-run", "--backup-edited-kit"]);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout, "the kit arm is previewed").toMatch(/^ {2}would-back-up /m);
    const section = stateMigrateSection(r.stdout);
    expect(section.some((l) => l.includes(`${LEGACY_BOARD_REL} → `)), `the state arm is previewed\n${r.stdout}`).toBe(true);
    expect(section.at(-1)).toContain("nothing was written");
    expect(snapshotTree(w.target), "the target is byte-identical").toBe(targetBefore);
    expect(snapshotTree(at(w.target, "agent-factory")), "the in-repo kit is byte-identical").toBe(kitBefore);
    expect(snapshotTree(w.kitHome), "nothing was written to the kit home").toBe(kitHomeBefore);
    expect(existsSync(at(w.target, MIGRATE_STAGING_REL)), "no staging directory was made").toBe(false);
  });
});
