// migrate-v3.test.ts — install --migrate v3, end to end, on a real-shaped pre-v3 repository (phase 38, MIGRATE-01 to
// MIGRATE-07). Plan 38-01 (2026-10-28, D-15) lands the frozen fixture first, before any migrate code exists.
//
// THE FIXTURE. install/fixtures/pre-v3-chess/ is trimmed from a real copy of a repository that still keeps its planning
// state in the pre-v3 layout (D-15), by `.planning/phases/38-install-migrate-v3/38-fixture-tools.mjs trim`, under the
// rules `38-FIXTURE-CENSUS.md` § Trim rules states. It holds real hand-written board rows with and without trailers (the
// longest trailer row of the copy included), real `_Updated:` lines, real trace rows and real NFR table rows and
// sections. No directory in it is named for the pre-v3 root: makePreV3ChessFixture places board-root/ at
// LEGACY_STATE_ROOT_REL, progress.md at PROGRESS_REL and context/ at CONTEXT_REL at run time. A shape the copy lacks
// (`38-FIXTURE-CENSUS.md` § Shapes not in the copy) is made by mutating the materialized fixture in a test, never by
// writing it into the fixture.
//
// WHAT THIS PROVES (a lettered case list; later plans of phase 38 add their cases below):
//   (F1) the fixture is frozen: a sha256 over the sorted list of every fixture file's POSIX relative path, a NUL, its
//        bytes and a NUL equals FIXTURE_DIGEST, so an edit, an added file or a removed file fails red. The file mode is
//        not hashed. A deliberate re-trim moves the pin in the same commit and says why;
//   (F2) the materialized fixture reads as pre-v3: on an installed repository holding it, the committed
//        install/install.js --check exits 0 and prints exactly one state-layout line, a WARN naming LEGACY_BOARD_REL and
//        --migrate, and the run changes no byte of the target.
//
// THE INSTALLED WORLD. The doctor refuses a repository with no install marker before it reads the layout ("grugops not
// installed", one FAIL), so (F2) needs what the copy itself is: a repository a v2.x grugops install already serves,
// whose planning state is still in the pre-v3 layout. installedPreV3World builds it without --migrate, so later plans
// that teach --migrate the v3 arm do not change this case: a plain install into an empty target, then the paths that
// install seeded where the fixture's three parts go (STATE_ROOT_REL, PROGRESS_REL, CONTEXT_REL) are removed, as a
// pre-Phase-36 install never seeded them there, and makePreV3ChessFixture materializes the fixture in their place.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after the
// file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: this is a safety surface (the first grugops operation that rewrites
// user state).

import { afterAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOARD_REL, CONTEXT_REL, LEGACY_BOARD_REL, PROGRESS_REL, STATE_ROOT_REL } from "./state-layout.js";
import { PRE_V3_CHESS_DIR, makePreV3ChessFixture, printedCommand, runInstall, snapshotTree } from "./installer-paths.test-support.js";

/**
 * The pinned digest of install/fixtures/pre-v3-chess/ (plan 38-01, 2026-10-28). Moves only with a deliberate re-trim
 * from the copy, recorded in the commit that moves it.
 */
const FIXTURE_DIGEST = "23cd8efac495196e3fb6d58572243089cd20f1ed8933daad77d0d2ac6f90fa2c";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-v3-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

let seq = 0;
/** A fresh world: an empty target, a scratch HOME, and a kit home path that does not exist yet. */
function emptyWorld(): { target: string; kitHome: string; home: string } {
  const root = join(SCRATCH, `w${++seq}`);
  const target = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, kitHome: join(root, "kit-home"), home };
}

/** An installed repository whose planning state is the materialized fixture (see THE INSTALLED WORLD above). */
function installedPreV3World(): { target: string; kitHome: string; home: string } {
  const w = emptyWorld();
  const install = runInstall(w.target, w.kitHome, [], { home: w.home, timeoutMs: 180_000 });
  expect(install.error).toBeUndefined();
  expect(install.status, `${install.stdout}\n${install.stderr}`).toBe(0);
  expect(existsSync(join(w.target, BOARD_REL)), "a plain install seeds the v3 board").toBe(true);
  for (const rel of [STATE_ROOT_REL, PROGRESS_REL, CONTEXT_REL]) rmSync(join(w.target, rel), { recursive: true, force: true });
  makePreV3ChessFixture(w.target);
  expect(existsSync(join(w.target, LEGACY_BOARD_REL))).toBe(true);
  expect(existsSync(join(w.target, BOARD_REL))).toBe(false);
  return w;
}

/** Every regular file under `dir`, as sorted POSIX relative paths. Throws on anything that is not a file or directory. */
function fixtureFiles(dir: string, rel = ""): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...fixtureFiles(dir, childRel));
    else if (ent.isFile()) out.push(childRel);
    else throw new Error(`the frozen fixture holds an entry that is not a file or directory: ${childRel}`);
  }
  return out;
}

/** sha256 over each file's POSIX relative path, a NUL, its bytes and a NUL, in sorted path order. */
function fixtureDigest(dir: string): string {
  const h = createHash("sha256");
  for (const rel of fixtureFiles(dir).sort()) {
    h.update(rel, "utf8");
    h.update(Buffer.from([0]));
    h.update(readFileSync(join(dir, ...rel.split("/"))));
    h.update(Buffer.from([0]));
  }
  return h.digest("hex");
}

/** The doctor's state-layout lines in `out`. */
function layoutLines(out: string): string[] {
  return out.split("\n").filter((l) => l.includes("state layout: "));
}

/** The lines of `out` the doctor printed under `label`. */
function labelled(out: string, label: string): string[] {
  return out.split("\n").filter((l) => l.startsWith(`  ${label.padEnd(14)} `));
}

describe("install --migrate v3 (phase 38)", () => {
  it("(F1) the frozen pre-v3 fixture matches its pinned digest", () => {
    expect(fixtureFiles(PRE_V3_CHESS_DIR).length).toBeGreaterThan(0);
    expect(fixtureDigest(PRE_V3_CHESS_DIR)).toBe(FIXTURE_DIGEST);
  });

  it("(F2) --check on an installed repository holding the fixture exits 0 and WARNs once that the layout is pre-v3, naming --migrate", () => {
    const { target, kitHome, home } = installedPreV3World();
    const before = snapshotTree(target);
    const check = runInstall(target, kitHome, ["--check"], { home });
    expect(check.error).toBeUndefined();
    expect(check.status, `${check.stdout}\n${check.stderr}`).toBe(0);
    const lines = layoutLines(check.stdout);
    expect(lines, check.stdout).toHaveLength(1);
    expect(labelled(check.stdout, "WARN"), check.stdout).toContain(lines[0]);
    expect(lines[0]).toContain(LEGACY_BOARD_REL);
    expect(printedCommand(lines[0])).toContain("--migrate");
    expect(snapshotTree(target), "--check writes nothing in the target").toBe(before);
  });
});
