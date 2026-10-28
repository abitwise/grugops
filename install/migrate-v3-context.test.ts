// migrate-v3-context.test.ts — `install --migrate --archive-done-context`, the opt-in context archive (phase 38, plan
// 38-10, MIGRATE-06; D-14, D-20, D-22).
//
// WHAT IT HOLDS. With the flag, a task folder directly under CONTEXT_REL whose name names known ticket IDs that are all
// Done, that no live queue entry names (D-22: pending or claimed; a done entry does not keep it), whose archive path is
// free and that is a real directory, is renamed unchanged to CONTEXT_ARCHIVE_REL; every other folder stays. The kit's
// trace renderer reads both context roots, so the rendered trace does not change.
//   (C1) on the fixture with one Done row added for ABC-168, the ticket one fixture folder names, a migrate with the flag moves
//        that folder byte-identical into CONTEXT_ARCHIVE_REL, leaves the other folders in place, and renders a
//        TRACE_DIR_REL tree and a TRACEABILITY_REL byte-identical to those of a migrate of a second copy without the
//        flag; `trace-render.js --check` exits 0 after both.
//
// THE FIXTURE. The frozen fixture's board has no row for the tickets its context folders name, except ABC-209 (In
// Review). (C1) adds one Done row at run time, as the roll cases of migrate-v3.test.ts add theirs; the fixture bytes are
// never edited.
//
// Hermetic: every run goes through runInstall with GRUGOPS_HOME and HOME inside a scratch directory removed after the
// file; the real repository and the real ~/.grugops are never targeted. It drives the COMMITTED install/install.js
// (npm run build first). Clear professional voice: this is a safety surface (it moves user state).

import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTEXT_ARCHIVE_REL, CONTEXT_REL, LEGACY_BOARD_REL, TRACEABILITY_REL, TRACE_DIR_REL } from "./state-layout.js";
import { PRE_V3_CHESS_DIR, makePreV3ChessFixture, runInstall, snapshotTree } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-migrate-context-")));
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

/** The kit-source trace renderer, the program the migrate runs (D-18). */
const KIT_TRACE_RENDER = join(import.meta.dirname, "..", "scripts", "runnable-ref", "trace-render.js");

/** The fixture folder that names one ticket, ABC-168, which (C1) makes Done; its sealed note renders a trace file. */
const DONE_FOLDER = "uat-ABC-168";

/** The fixture materialized in a fresh world, with one Done row added at the top of the Done column for each of `ids`. */
function fixtureWorld(ids: readonly string[]): World {
  const w = emptyWorld();
  makePreV3ChessFixture(w.target);
  const boardPath = at(w.target, LEGACY_BOARD_REL);
  const lines = readFileSync(boardPath, "utf8").split("\n");
  const done = lines.findIndex((l) => l.startsWith("## Done "));
  expect(done, "PREMISE: the fixture board has a Done column").toBeGreaterThan(-1);
  const added = ids.map((id) => `- [${id}] A Done row added for the context archive case  (merged: 2026-10-20)`);
  writeFileSync(boardPath, [...lines.slice(0, done + 1), ...added, ...lines.slice(done + 1)].join("\n"));
  return w;
}

/** The kit-source renderer's --check on `target`. */
function traceCheck(target: string): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [KIT_TRACE_RENDER, target, "--check"], { encoding: "utf8", timeout: 120_000 });
}

describe("install --migrate --archive-done-context: the context archive (plan 38-10)", () => {
  it("(C1) the folder of a Done ticket moves unchanged into the archive, and the trace is byte-identical to a migrate without the flag", () => {
    const flagged = fixtureWorld(["ABC-168"]);
    const plain = fixtureWorld(["ABC-168"]);
    const fixtureFolders = readdirSync(join(PRE_V3_CHESS_DIR, "context")).sort();
    expect(fixtureFolders, "PREMISE: the fixture holds the folder of ABC-168").toContain(DONE_FOLDER);

    const a = runInstall(flagged.target, flagged.kitHome, ["--migrate", "--archive-done-context"], { home: flagged.home, timeoutMs: 180_000 });
    expect(a.error).toBeUndefined();
    expect(a.status, `${a.stdout}\n${a.stderr}`).toBe(0);
    expect(labelled(a.stdout, "verify"), a.stdout).toEqual([]);
    const b = runInstall(plain.target, plain.kitHome, ["--migrate"], { home: plain.home, timeoutMs: 180_000 });
    expect(b.error).toBeUndefined();
    expect(b.status, `${b.stdout}\n${b.stderr}`).toBe(0);
    expect(labelled(b.stdout, "verify"), b.stdout).toEqual([]);

    // The moved folder: gone from the live root, byte-identical under the archive root.
    expect(existsSync(at(flagged.target, `${CONTEXT_REL}/${DONE_FOLDER}`)), "the folder left the live root").toBe(false);
    const archived = snapshotTree(at(flagged.target, `${CONTEXT_ARCHIVE_REL}/${DONE_FOLDER}`));
    expect(archived, "the folder is under the archive root").not.toBe("");
    expect(archived, "the moved folder is byte-identical").toBe(snapshotTree(join(PRE_V3_CHESS_DIR, "context", DONE_FOLDER)));
    expect(readdirSync(at(flagged.target, CONTEXT_ARCHIVE_REL)), "only the Done folder moved").toEqual([DONE_FOLDER]);
    expect(readdirSync(at(flagged.target, CONTEXT_REL)).sort()).toEqual(fixtureFolders.filter((n) => n !== DONE_FOLDER));
    for (const name of fixtureFolders.filter((n) => n !== DONE_FOLDER)) {
      expect(snapshotTree(at(flagged.target, `${CONTEXT_REL}/${name}`)), `${name} stays unchanged`).toBe(
        snapshotTree(join(PRE_V3_CHESS_DIR, "context", name)),
      );
    }
    // Without the flag nothing moves and the archive root is never made.
    expect(existsSync(at(plain.target, CONTEXT_ARCHIVE_REL)), "no archive without the flag").toBe(false);
    expect(readdirSync(at(plain.target, CONTEXT_REL)).sort()).toEqual(fixtureFolders);

    // The rendered trace is the same with and without the move, and it holds the moved folder's ticket.
    const traceA = snapshotTree(at(flagged.target, TRACE_DIR_REL));
    expect(traceA, "the render wrote trace files").not.toBe("");
    expect(traceA, "the moved folder's ticket keeps its trace file").toContain("ABC-168.md ");
    expect(traceA, "TRACE_DIR_REL is byte-identical").toBe(snapshotTree(at(plain.target, TRACE_DIR_REL)));
    expect(readFileSync(at(flagged.target, TRACEABILITY_REL)).equals(readFileSync(at(plain.target, TRACEABILITY_REL))), "TRACEABILITY_REL is byte-identical").toBe(true);
    for (const target of [flagged.target, plain.target]) {
      const check = traceCheck(target);
      expect(check.error).toBeUndefined();
      expect(check.status, `${String(check.stdout)}\n${String(check.stderr)}`).toBe(0);
    }
  });
});
