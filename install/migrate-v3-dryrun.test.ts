// migrate-v3-dryrun.test.ts — `install --migrate --dry-run`, end to end, on the frozen pre-v3 fixture (phase 38, plan
// 38-09, MIGRATE-01; research Pitfall 1: install.js had DRY_RUN=1 and no `--dry-run` argument).
//
// WHAT THIS PROVES (a lettered case list):
//   (D1) on the materialized fixture, `--migrate --dry-run` exits 0; stdout holds one line per fixture file under the
//        pre-v3 root naming its moved path and its byte count (computed here from the fixture, never from the plan);
//        snapshotTree of the target and of the kit home are unchanged, and MIGRATE_STAGING_REL is never made.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after the
// file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: a preview that writes breaks the trust the flag asks for.

import { afterAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LEGACY_STATE_ROOT_REL, MIGRATE_STAGING_REL } from "./state-layout.js";
import { movedRel } from "./state-migrate.js";
import { PRE_V3_CHESS_DIR, makePreV3ChessFixture, runInstall, snapshotTree, type Run } from "./installer-paths.test-support.js";

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
});
