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
// Plan 38-03 (2026-10-28, D-07, D-10, D-11, D-17, D-21) adds the real run, on the materialized fixture in a target with
// no install marker (the clean kit arm):
//   (M1) --migrate exits 0 with no verify line; the pre-v3 root is gone; every fixture file is at its home per D-21
//        (the board unchanged at PRE_V3_BOARD_REL; each ticket that received Board notes unchanged under
//        PRE_V3_TICKETS_REL, its live copy at TICKETS_REL beginning with the original's bytes; every other file
//        unchanged at its moved path); BOARD_REL holds the split board; the trailer of the fixture's longest row sits
//        under `## Board notes` in its ticket; LAYOUT_MARKER_REL is `layout: v3` and one LF; MIGRATE_STAGING_REL is gone;
//   (M2) a second --migrate changes nothing: snapshotTree of the target and of the kit home are byte-identical;
//   (M3) STATE_ROOT_REL planted as an empty directory is a pre-check refusal: exit 3, one verify naming it, and the
//        target unchanged;
//   (M4) a zero-byte file and an empty subdirectory planted under the pre-v3 root are found unchanged at their moved
//        paths.
// Plan 38-04 (2026-10-28, D-05 archive half, D-06) adds the NFR catalog and the traceability file; (M1) now finds the
// catalog and the traceability file unchanged at PRE_V3_NFR_CATALOG_REL and PRE_V3_TRACEABILITY_REL:
//   (M5) after --migrate on the fixture, nfr/ holds one NFR-xxx.md per table row of the fixture catalog;
//        parseNfrIndex over the comment-blanked new catalog gives exactly one entry per NFR file and no malformed
//        line; the catalog and the traceability file sit unchanged in the pre-v3 archive; TRACEABILITY_REL holds the
//        kit seed's bytes; and the kit-source state-check.js --json reports no NFR index or NFR file finding.
// Plan 38-05 (D-08, D-09) adds the Done and progress rolls inside the plan. The frozen fixture's Done column holds 18
// ticket rows (within BUDGETS.doneRows) and its progress file holds no dated entry, so each roll case adds the shape it
// needs to the materialized fixture:
//   (M6) with five Done rows added at the top of the Done column, --migrate writes BOARD_DONE_ARCHIVE_REL, the board
//        keeps BUDGETS.doneRows Done rows, and the kit-source state-roll.js --dry-run on the migrated target exits 0
//        and says nothing would move for the Done column.
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
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_REL,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  MIGRATE_STAGING_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PRE_V3_BOARD_REL,
  PRE_V3_NFR_CATALOG_REL,
  PRE_V3_TICKETS_REL,
  PRE_V3_TRACEABILITY_REL,
  PROGRESS_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
  TRACEABILITY_REL,
} from "./state-layout.js";
import { parseNfrIndex } from "../scripts/state-rules.js";
import { normalizeDocument, stripHtmlComments } from "../scripts/board-model.js";
import { BOARD_NOTES_HEADING, cutRow } from "./state-migrate.js";
import {
  PRE_V3_CHESS_DIR,
  lineNamesPath,
  makePreV3ChessFixture,
  printedCommand,
  runInstall,
  snapshotTree,
} from "./installer-paths.test-support.js";

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

  it("(M1) --migrate moves the fixture to the v3 layout: every original at its D-21 home, the split board, Board notes, the marker, no staging", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    const r = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    expect(existsSync(join(target, LEGACY_STATE_ROOT_REL)), "the pre-v3 root is gone").toBe(false);
    const root = join(PRE_V3_CHESS_DIR, "board-root");
    let archivedTickets = 0;
    for (const rel of fixtureFiles(root)) {
      const original = readFileSync(join(root, ...rel.split("/")));
      if (rel === "board.md") {
        expect(readFileSync(join(target, PRE_V3_BOARD_REL)).equals(original), "the board is archived unchanged").toBe(true);
        continue;
      }
      // Plan 38-04 (D-05, D-06): the NFR catalog and the traceability file are archived unchanged; new ones are written.
      if (rel === "nfr-catalog.md" || rel === "traceability.md") {
        const archived = rel === "nfr-catalog.md" ? PRE_V3_NFR_CATALOG_REL : PRE_V3_TRACEABILITY_REL;
        expect(readFileSync(join(target, archived)).equals(original), `${rel} is archived unchanged`).toBe(true);
        continue;
      }
      const archived = join(target, PRE_V3_TICKETS_REL, rel.slice("tickets/".length));
      if (rel.startsWith("tickets/") && !rel.slice("tickets/".length).includes("/") && existsSync(archived)) {
        archivedTickets += 1;
        expect(readFileSync(archived).equals(original), `${rel} is archived unchanged`).toBe(true);
        const live = readFileSync(join(target, STATE_ROOT_REL, ...rel.split("/")));
        expect(live.subarray(0, original.length).equals(original), `${rel}: the live ticket begins with the original`).toBe(true);
        expect(live.subarray(original.length).toString("utf8")).toContain(BOARD_NOTES_HEADING);
        continue;
      }
      expect(readFileSync(join(target, STATE_ROOT_REL, ...rel.split("/"))).equals(original), `${rel} is moved unchanged`).toBe(true);
    }
    expect(archivedTickets, "the fixture has tickets that receive Board notes").toBeGreaterThan(0);
    // The split board: the planned board, without its trailers and `_Updated:` lines.
    const board = readFileSync(join(target, BOARD_REL), "utf8");
    expect(board).toContain("- [ABC-115] ");
    expect(board.split("\n").some((l) => l.startsWith("_Updated:"))).toBe(false);
    // The fixture's longest row: its trailer, cut from the raw board line, is under Board notes in its ticket.
    const boardLines = readFileSync(join(root, "board.md"), "utf8").split("\n");
    const raw = boardLines.find((l) => l.startsWith("- [ABC-115] "));
    expect(raw).toBeDefined();
    const cut = cutRow(raw as string);
    expect(cut).not.toBeNull();
    expect(board.split("\n")).toContain((cut as { kept: string }).kept);
    const ticketName = readdirSync(join(target, TICKETS_REL)).find((n) => n.startsWith("ABC-115-"));
    expect(ticketName).toBeDefined();
    const ticket = readFileSync(join(target, TICKETS_REL, ticketName as string), "utf8");
    const notesAt = ticket.indexOf(`\n${BOARD_NOTES_HEADING}\n`);
    expect(notesAt, "the ticket has a Board notes section").toBeGreaterThan(-1);
    expect(ticket.slice(notesAt).split("\n")).toContain((cut as { trailer: string }).trailer);
    expect(readFileSync(join(target, LAYOUT_MARKER_REL), "utf8")).toBe("layout: v3\n");
    expect(existsSync(join(target, MIGRATE_STAGING_REL)), "the staging directory is gone").toBe(false);
    // The progress file and the context folders are not part of this arm and keep their bytes.
    expect(readFileSync(join(target, PROGRESS_REL)).equals(readFileSync(join(PRE_V3_CHESS_DIR, "progress.md")))).toBe(true);
  });

  it("(M2) a second --migrate on the migrated fixture writes nothing in the target or the kit home", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    const first = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);
    const beforeTarget = snapshotTree(target);
    const beforeKit = snapshotTree(kitHome);
    const second = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(second.error).toBeUndefined();
    expect(second.status, `${second.stdout}\n${second.stderr}`).toBe(0);
    expect(snapshotTree(target)).toBe(beforeTarget);
    expect(snapshotTree(kitHome)).toBe(beforeKit);
  });

  it("(M3) an empty directory already at the v3 state root is a pre-check refusal: exit 3, one verify naming it, nothing written", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    mkdirSync(join(target, STATE_ROOT_REL), { recursive: true });
    const before = snapshotTree(target);
    const r = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(3);
    const verifies = labelled(r.stdout, "verify");
    expect(verifies, r.stdout).toHaveLength(1);
    expect(lineNamesPath(verifies[0], join(target, STATE_ROOT_REL)), verifies[0]).toBe(true);
    expect(verifies[0]).toContain("already exists");
    expect(snapshotTree(target)).toBe(before);
    expect(snapshotTree(kitHome)).toBe("");
  });

  it("(M4) a zero-byte file and an empty subdirectory under the pre-v3 root are found unchanged at their moved paths", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    mkdirSync(join(target, LEGACY_STATE_ROOT_REL, "notes"));
    writeFileSync(join(target, LEGACY_STATE_ROOT_REL, "notes", "zero.txt"), "");
    mkdirSync(join(target, LEGACY_STATE_ROOT_REL, "empty-dir"));
    const r = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const zero = join(target, STATE_ROOT_REL, "notes", "zero.txt");
    expect(lstatSync(zero).isFile()).toBe(true);
    expect(readFileSync(zero).length).toBe(0);
    const empty = join(target, STATE_ROOT_REL, "empty-dir");
    expect(lstatSync(empty).isDirectory()).toBe(true);
    expect(readdirSync(empty)).toEqual([]);
  });

  it("(M5) --migrate splits the NFR catalog into one file per row with an index state-check accepts, and archives the catalog and the traceability file unsplit", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    const r = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    const root = join(PRE_V3_CHESS_DIR, "board-root");
    const catalog = readFileSync(join(root, "nfr-catalog.md"));
    // The rows of the fixture table: a line that begins `| NFR-<digits> |` (the commented example row is indented).
    const ids = catalog
      .toString("utf8")
      .split("\n")
      .flatMap((l) => {
        const m = /^\| (NFR-[0-9]+) \|/.exec(l);
        return m === null ? [] : [m[1] as string];
      });
    expect(ids.length, "PREMISE: the fixture table has rows").toBeGreaterThan(1);
    const files = readdirSync(join(target, NFR_DIR_REL)).filter((n) => !n.startsWith(".")).sort();
    expect(files).toEqual(ids.map((id) => `${id}.md`).sort());
    for (const id of ids) {
      const text = readFileSync(join(target, NFR_DIR_REL, `${id}.md`), "utf8");
      expect(text.split("\n")[2]?.startsWith(`| ${id} |`), `${id}: line 3 is its row`).toBe(true);
    }
    const index = parseNfrIndex(stripHtmlComments(normalizeDocument(readFileSync(join(target, NFR_CATALOG_REL), "utf8"))));
    expect(index.malformed).toEqual([]);
    expect(index.entries.map((e) => e.id).sort()).toEqual([...ids].sort());
    for (const e of index.entries) expect(e.target, e.id).toBe(`nfr/${e.id}.md`);
    expect(readFileSync(join(target, PRE_V3_NFR_CATALOG_REL)).equals(catalog), "the catalog is archived unchanged").toBe(true);
    expect(readFileSync(join(target, PRE_V3_TRACEABILITY_REL)).equals(readFileSync(join(root, "traceability.md")))).toBe(true);
    const seedTrace = readFileSync(join(import.meta.dirname, "..", "agent-factory", "seed", ...TRACEABILITY_REL.split("/")));
    expect(readFileSync(join(target, TRACEABILITY_REL)).equals(seedTrace), "the traceability file is the kit seed").toBe(true);
    // The kit-source state-check: exit 0 or 1 (budget findings are observations, D-07), never 2, and no NFR finding.
    const check = spawnSync(process.execPath, [join(import.meta.dirname, "..", "scripts", "runnable-ref", "state-check.js"), target, "--json"], {
      encoding: "utf8",
      timeout: 120_000,
    });
    expect(check.error).toBeUndefined();
    expect([0, 1], `${check.stdout}\n${check.stderr}`).toContain(check.status);
    const doc = JSON.parse(check.stdout) as { findings: { key: string; rel: string }[] };
    expect(doc.findings.filter((f) => f.key.startsWith("nfr-"))).toEqual([]);
  });

  it("(M6) --migrate rolls the Done column with the state rules: BOARD_DONE_ARCHIVE_REL holds the older rows and state-roll --dry-run moves nothing more", () => {
    const { target, kitHome, home } = emptyWorld();
    makePreV3ChessFixture(target);
    const boardPath = join(target, LEGACY_BOARD_REL);
    const lines = readFileSync(boardPath, "utf8").split("\n");
    const at = lines.findIndex((l) => l.startsWith("## Done "));
    expect(at, "PREMISE: the fixture board has a Done column").toBeGreaterThan(-1);
    const added = Array.from({ length: 5 }, (_, k) => `- [ABC-${900 + k}] A Done row added for the roll case ${k}  (merged: 2026-10-2${k})`);
    writeFileSync(boardPath, [...lines.slice(0, at + 1), ...added, ...lines.slice(at + 1)].join("\n"));
    const r = runInstall(target, kitHome, ["--migrate"], { home, timeoutMs: 180_000 });
    expect(r.error).toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    expect(labelled(r.stdout, "verify"), r.stdout).toEqual([]);
    expect(existsSync(join(target, BOARD_DONE_ARCHIVE_REL)), "the Done archive is written").toBe(true);
    const doneRows = (text: string): number => {
      const ls = text.split("\n");
      const start = ls.findIndex((l) => l.startsWith("## Done "));
      const end = ls.findIndex((l, i) => i > start && l.startsWith("## "));
      return ls.slice(start + 1, end < 0 ? undefined : end).filter((l) => /^- \[ABC-[0-9]+\] /.test(l)).length;
    };
    expect(doneRows(readFileSync(join(target, BOARD_REL), "utf8"))).toBe(BUDGETS.doneRows);
    const roll = spawnSync(process.execPath, [join(import.meta.dirname, "..", "scripts", "runnable-ref", "state-roll.js"), target, "--dry-run"], {
      encoding: "utf8",
      timeout: 120_000,
    });
    expect(roll.error).toBeUndefined();
    expect(roll.status, `${roll.stdout}\n${roll.stderr}`).toBe(0);
    expect(roll.stdout).toContain(`Nothing to roll: the Done column of ${BOARD_REL} holds ${BUDGETS.doneRows} row(s)`);
    expect(roll.stdout).not.toContain("PLAN    done");
  });
});
