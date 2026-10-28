// state-migrate.test.ts — the pure migrate planner and its stage-A conservation proof (phase 38, plan 38-02,
// MIGRATE-02, MIGRATE-03, MIGRATE-05).
//
// WHAT THIS PROVES (a lettered case list):
//   (S1) every cut row of the frozen fixture rejoins its raw board line byte for byte: the kept row plus the trailer
//        equals the original line, and the trailer is one line under a new `## Board notes` heading in its ticket's
//        planned bytes, after the provenance line (D-01, D-02);
//   (S2) the fixture's longest trailer, over MAX_META_CHARS (1,024), appears whole (research Pattern 2);
//   (S3) proveStateMigrate over the in-memory writes of the fixture plan returns ok (D-09 stage A);
//   (S4) BOARD_NOTES_HEADING is the heading the contract spells in § Ticket body sections;
//   (S5) no import or export line of install/state-migrate.ts names scripts/;
//   (S6) D-21 option-a: the original of every ticket that gets notes is archived unchanged, the board is archived,
//        every other legacy file is moved, and every original has one declared home;
//   (S7) the board split, the refusals, the budgets and every proof failure (plan 38-02 Task 2);
//   (S8) the NFR catalog and the traceability file (plan 38-04, D-05 archive half, D-06, D-09): each NFR row and its
//        own `##` section become nfr/NFR-xxx.md, the new catalog is the kit seed plus one index line per row, the
//        original catalog and traceability file are archived unchanged, the traceability file is the kit seed, and
//        the proof covers the catalog; then the whole NFR rule (plan 38-04 Task 2): the notes residue, the header
//        lookup by cell name, the refusals, the budgets, the proof's failure cases and the absent-file arms;
//   (S11) the dry-run listing (plan 38-09, MIGRATE-01): migrateListing holds a line of every step class (moved file,
//        archive move, new file, ticket append with its board lines, each orphan row by ID and board line, the
//        `_Updated:` count and bytes, an NFR file, the Done roll, the progress roll, the render, the marker, each
//        over-budget finding), in commit order with paths in code-unit order within a group, the same on every call,
//        and with no control character from a path, an ID or a note;
//   (S12) the context archive selection (plan 38-10, MIGRATE-06, D-14, D-20, D-22): planContextArchive keeps each
//        folder with its reason (no ticket ID, a named ticket not Done, two IDs of which one is not Done, a pending or a
//        claimed queue entry, an archive path that exists, a link or a regular file, a name outside the task-name rule)
//        and moves a folder whose IDs are all Done; the D-20 name rule; the known and Done IDs of a board, its Done
//        archive and the ticket file names; and migrateListing with the selection holds one line per folder, moved or
//        kept with its reason, in code-unit order of the names, with no control character.
//
// The planner does no I/O, so these cases read the fixture once and pass its bytes in. A shape the fixture lacks
// (CRLF, a byte-order mark, an orphan of its own, invalid UTF-8) is made here by mutating a copy of the inputs, never
// by editing the fixture (D-15). Clear professional voice: this module guards the first grugops operation that
// rewrites user state.

import { afterAll, describe, expect, it } from "vitest";
import ts from "typescript";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  LAYOUT_MARKER_REL,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  NFR_CATALOG_REL,
  NFR_DIR_REL,
  PRE_V3_BOARD_REL,
  PRE_V3_BOARD_UPDATES_REL,
  PRE_V3_NFR_CATALOG_REL,
  PRE_V3_NFR_NOTES_REL,
  PRE_V3_ORPHAN_NOTES_REL,
  PRE_V3_PROGRESS_REL,
  PRE_V3_TICKETS_REL,
  PRE_V3_TRACEABILITY_REL,
  PROGRESS_ARCHIVE_REL,
  PROGRESS_REL,
  QUEUE_CLAIMED_REL,
  QUEUE_PENDING_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
  TRACEABILITY_REL,
} from "./state-layout.js";
import { PRE_V3_CHESS_DIR } from "./installer-paths.test-support.js";
import {
  BOARD_NOTES_HEADING,
  BOARD_UPDATES_TITLE,
  MIGRATE_GENERATED_LINE_KINDS,
  NFR_NOTES_TITLE,
  ORPHAN_NOTES_TITLE,
  TASK_NAME_RE,
  contextTicketIds,
  cutRow,
  folderTicketIds,
  migratedContextTicketIds,
  planContextArchive,
  doneArchiveSkeleton,
  formatFinding,
  migrateListing,
  normalizeDocument,
  parseBoard,
  sortFindings,
  stripHtmlComments,
  movedRel,
  planStateMigrate,
  proveStateMigrate,
  provenanceLine,
  type ContextArchiveInputs,
  type ContextFolder,
  type LegacyFile,
  type MigrateInputs,
  type MigratePlan,
} from "./state-migrate.js";

const ROOT = join(import.meta.dirname, "..");
const DATE = "2026-10-28";
const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { ignoreBOM: true });

/** Every regular file under `dir`, as POSIX paths relative to it, in code-unit order. */
function walk(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === "" ? e.name : `${prefix}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The frozen fixture as planner inputs: board-root/** under LEGACY_STATE_ROOT_REL, the progress file, the kit seeds. */
function chessInputs(): MigrateInputs {
  const boardRoot = join(PRE_V3_CHESS_DIR, "board-root");
  const legacy: LegacyFile[] = walk(boardRoot).map((rel) => ({
    rel: `${LEGACY_STATE_ROOT_REL}/${rel}`,
    bytes: new Uint8Array(readFileSync(join(boardRoot, ...rel.split("/")))),
  }));
  const seed = join(ROOT, "agent-factory", "seed", ...STATE_ROOT_REL.split("/"));
  return {
    date: DATE,
    legacy,
    progress: new Uint8Array(readFileSync(join(PRE_V3_CHESS_DIR, "progress.md"))),
    seedNfrCatalog: new Uint8Array(readFileSync(join(seed, "nfr-catalog.md"))),
    seedTraceability: new Uint8Array(readFileSync(join(seed, "traceability.md"))),
  };
}

/** The inputs with one legacy file's bytes replaced (or added). */
function withFile(inputs: MigrateInputs, rel: string, bytes: Uint8Array): MigrateInputs {
  const legacy = inputs.legacy.filter((f) => f.rel !== rel);
  return { ...inputs, legacy: [...legacy, { rel, bytes }] };
}

/** The bytes of one legacy file. */
function legacyBytes(inputs: MigrateInputs, rel: string): Uint8Array {
  const f = inputs.legacy.find((x) => x.rel === rel);
  if (f === undefined) throw new Error(`PREMISE: ${rel} is a legacy file`);
  return f.bytes;
}

/** The plan's writes as a mutable map of rel to bytes, the shape proveStateMigrate reads. */
function writesOf(plan: MigratePlan): Map<string, Uint8Array> {
  return new Map(plan.writes.map((w) => [w.rel, w.bytes] as const));
}

/** The text of one planned write. */
function writeText(plan: MigratePlan, rel: string): string {
  const w = plan.writes.find((x) => x.rel === rel);
  if (w === undefined) throw new Error(`PREMISE: the plan writes ${rel}`);
  return dec.decode(w.bytes);
}

/** The legacy rel of the ticket whose file name begins `id-`. */
function ticketRel(inputs: MigrateInputs, id: string): string {
  const f = inputs.legacy.find((x) => x.rel.startsWith(`${LEGACY_STATE_ROOT_REL}/tickets/${id}-`));
  if (f === undefined) throw new Error(`PREMISE: a ticket file for ${id}`);
  return f.rel;
}

const CHESS = chessInputs();
const CHESS_PLAN = planStateMigrate(CHESS);
const BOARD_LINES = dec.decode(legacyBytes(CHESS, LEGACY_BOARD_REL)).split("\n");

describe("(S1)-(S3) one board row's trailer becomes its ticket's Board notes, planned and proven (tracer)", () => {
  it("PREMISE: the fixture plan has no refusal and cuts at least one row whose ticket file exists", () => {
    expect(CHESS_PLAN.refusals).toEqual([]);
    expect(CHESS_PLAN.cuts.filter((c) => c.noteRel.startsWith(`${TICKETS_REL}/`)).length).toBeGreaterThan(0);
  });

  it("(S1) every cut trailer rejoins its raw board line and sits on one line under a new Board notes heading, after the provenance line", () => {
    const board = writeText(CHESS_PLAN, BOARD_REL).split("\n");
    for (const cut of CHESS_PLAN.cuts) {
      const raw = (BOARD_LINES[cut.boardLine - 1] as string).replace(/\r$/, "");
      const kept = (board[cut.keptLine - 1] as string).replace(/\r$/, "");
      const note = writeText(CHESS_PLAN, cut.noteRel).split("\n").map((l) => l.replace(/\r$/, ""));
      const trailer = note[cut.noteLine - 1] as string;
      expect(kept + trailer, `${cut.id} at board line ${cut.boardLine}`).toBe(raw);
      expect(trailer.length, cut.id).toBeGreaterThan(0);
      if (cut.noteRel.startsWith(`${TICKETS_REL}/`)) {
        expect(note[cut.noteLine - 2], cut.id).toBe("");
        expect(note[cut.noteLine - 3], cut.id).toBe(provenanceLine(cut.boardLine, DATE));
        expect(note[cut.noteLine - 4], cut.id).toBe("");
        expect(note[cut.noteLine - 5], cut.id).toBe(BOARD_NOTES_HEADING);
      }
      // cutRow over the raw line agrees with the plan.
      const again = cutRow(BOARD_LINES[cut.boardLine - 1] as string);
      expect(again, cut.id).not.toBeNull();
      expect(again?.trailer, cut.id).toBe(trailer);
    }
  });

  it("(S2) the fixture's longest trailer, over 1,024 characters, appears whole in its ticket", () => {
    const longest = [...CHESS_PLAN.cuts].sort(
      (a, b) => (BOARD_LINES[b.boardLine - 1] as string).length - (BOARD_LINES[a.boardLine - 1] as string).length,
    )[0];
    expect(longest?.id).toBe("ABC-115");
    const raw = BOARD_LINES[(longest?.boardLine ?? 0) - 1] as string;
    const trailer = cutRow(raw)?.trailer ?? "";
    expect(trailer.length, "PREMISE: the trailer is longer than parseBoard's cap").toBeGreaterThan(1_024);
    const rel = movedRel(ticketRel(CHESS, "ABC-115"));
    expect(writeText(CHESS_PLAN, rel).split("\n")).toContain(trailer);
  });

  it("(S3) proveStateMigrate over the in-memory writes of the fixture plan returns ok, and the plan's own proof agrees", () => {
    expect(proveStateMigrate(CHESS, CHESS_PLAN, writesOf(CHESS_PLAN))).toEqual({ ok: true });
    expect(CHESS_PLAN.proof).toEqual({ ok: true });
  });

  it("cutRow returns null for a row with no parenthetical, an unbalanced one, and a parenthetical that ends the line", () => {
    expect(cutRow("- [ABC-1] a title with no meta")).toBeNull();
    expect(cutRow("- [ABC-1] a title  (unbalanced — trailer")).toBeNull();
    expect(cutRow("- [ABC-1] a title  (meta)")).toBeNull();
    expect(cutRow("- [ABC-1] a title  (meta) — merged")).toEqual({ kept: "- [ABC-1] a title  (meta)", trailer: " — merged" });
    expect(cutRow("- [ABC-1] a title  (meta) — merged\r")).toEqual({ kept: "- [ABC-1] a title  (meta)\r", trailer: " — merged" });
  });
});

describe("(S4)-(S5) the heading and the import edge", () => {
  it("(S4) BOARD_NOTES_HEADING equals the heading agent-factory/contracts/board.md spells in § Ticket body sections", () => {
    const text = readFileSync(join(ROOT, "agent-factory", "contracts", "board.md"), "utf8");
    const start = text.indexOf("\n### Ticket body sections\n");
    expect(start, "PREMISE: the contract carries the section").toBeGreaterThan(-1);
    const end = text.indexOf("\n#", start + 1);
    const section = text.slice(start, end === -1 ? undefined : end);
    const spelled = /^- `(## [^`]+)` holds text that used to sit in a board row's trailer/m.exec(section);
    expect(spelled, "the contract names the Board notes heading").not.toBeNull();
    expect(BOARD_NOTES_HEADING).toBe(spelled?.[1]);
  });

  it("(S5) no import or export declaration of install/state-migrate.ts names scripts/", () => {
    const path = join(import.meta.dirname, "state-migrate.ts");
    const sf = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const specifiers = sf.statements.flatMap((st) =>
      (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) &&
      st.moduleSpecifier !== undefined &&
      ts.isStringLiteral(st.moduleSpecifier)
        ? [st.moduleSpecifier.text]
        : [],
    );
    expect(specifiers, "PREMISE: the module imports the state-layout constants").toContain("./state-layout.js");
    expect(specifiers.filter((m) => m.includes("scripts/"))).toEqual([]);
    expect(specifiers.filter((m) => m !== "./state-layout.js" && !m.startsWith("node:"))).toEqual([]);
  });
});

describe("(S6) where every original lives (D-17, D-21 option-a)", () => {
  it("the board is archived unchanged and rewritten in place; every ticket that gets notes is archived unchanged and rewritten", () => {
    expect(CHESS_PLAN.archiveMoves).toContainEqual({ from: BOARD_REL, to: PRE_V3_BOARD_REL });
    const noted = [...new Set(CHESS_PLAN.cuts.filter((c) => c.noteRel.startsWith(`${TICKETS_REL}/`)).map((c) => c.noteRel))];
    for (const rel of noted) {
      const name = rel.slice(rel.lastIndexOf("/") + 1);
      expect(CHESS_PLAN.archiveMoves, rel).toContainEqual({ from: rel, to: `${PRE_V3_TICKETS_REL}/${name}` });
      const original = legacyBytes(CHESS, `${LEGACY_STATE_ROOT_REL}/tickets/${name}`);
      const planned = CHESS_PLAN.writes.find((w) => w.rel === rel)?.bytes ?? new Uint8Array();
      expect(Buffer.from(planned.subarray(0, original.length)).equals(Buffer.from(original)), `${rel} begins with its original`).toBe(true);
    }
  });

  it("every legacy file has exactly one declared home, identical in the archive or at its moved path", () => {
    const homes = new Map(CHESS_PLAN.originals.map((h) => [h.original, h] as const));
    expect(homes.size).toBe(CHESS.legacy.length);
    const archived = new Map(CHESS_PLAN.archiveMoves.map((m) => [m.from, m.to] as const));
    for (const f of CHESS.legacy) {
      const home = homes.get(f.rel);
      expect(home, f.rel).toBeDefined();
      expect(home?.match, f.rel).toBe("identical");
      expect(home?.at, f.rel).toBe(archived.get(movedRel(f.rel)) ?? movedRel(f.rel));
    }
    expect(movedRel(LEGACY_BOARD_REL)).toBe(BOARD_REL);
    expect(movedRel(`${LEGACY_STATE_ROOT_REL}/tickets/x.md`)).toBe(`${STATE_ROOT_REL}/tickets/x.md`);
  });

  it("every GeneratedLine of the fixture plan is a member of MIGRATE_GENERATED_LINE_KINDS", () => {
    for (const g of CHESS_PLAN.generated) expect(MIGRATE_GENERATED_LINE_KINDS as readonly string[], `${g.rel}:${g.line}`).toContain(g.kind);
  });
});

// ── (S7) the whole board split, the refusals, the budgets and every proof failure (plan 38-02 Task 2) ──────────

/** The pre-v3 board's text, decoded with its byte-order mark kept. */
const BOARD_TEXT = dec.decode(legacyBytes(CHESS, LEGACY_BOARD_REL));

/** The fixture with its board text replaced. */
function withBoard(text: string, base: MigrateInputs = CHESS): MigrateInputs {
  return withFile(base, LEGACY_BOARD_REL, enc.encode(text));
}

/** The one-based board lines that begin `_Updated:` outside HTML comments, as the budget rule finds them. */
function updateLines(text: string): number[] {
  return stripHtmlComments(normalizeDocument(text))
    .split("\n")
    .flatMap((l, i) => (l.startsWith("_Updated:") ? [i + 1] : []));
}

/** A copy of a written map with one file's text changed by `edit`. */
function editWritten(written: Map<string, Uint8Array>, rel: string, edit: (text: string) => string): Map<string, Uint8Array> {
  const bytes = written.get(rel);
  if (bytes === undefined) throw new Error(`PREMISE: ${rel} is written`);
  const out = new Map(written);
  out.set(rel, enc.encode(edit(dec.decode(bytes))));
  return out;
}

/** The lines of `text` with the one-based line `n` removed. */
function dropLine(text: string, n: number): string {
  const lines = text.split("\n");
  lines.splice(n - 1, 1);
  return lines.join("\n");
}

/** A failed proof's reasons, or a failure when the proof passed. */
function reasonsOf(r: ReturnType<typeof proveStateMigrate>): readonly string[] {
  if (r.ok) throw new Error("the proof passed, and this case needs it to fail");
  return r.reasons;
}

/** A small board: one Done column with the given rows, plus any extra lines first. */
function smallBoard(rows: readonly string[], head: readonly string[] = []): string {
  return ["# Board", ...head, "", "## Done (WIP unlimited)", "", ...rows, ""].join("\n");
}

/** Inputs holding only `board` and the tickets named, each a minimal admitted ticket. */
function smallInputs(board: string, ids: readonly string[], eol = "\n"): MigrateInputs {
  const ticket = (id: string): LegacyFile => ({
    rel: `${LEGACY_STATE_ROOT_REL}/tickets/${id}-small.md`,
    bytes: enc.encode(["---", `id: ${id}`, "title: small", "status: done", "column: Done", "---", "", `# ${id}`, ""].join(eol)),
  });
  return { ...CHESS, legacy: [{ rel: LEGACY_BOARD_REL, bytes: enc.encode(board) }, ...ids.map(ticket)] };
}

describe("(S7) D-04: every `_Updated:` line outside a comment goes to the updates file, verbatim and in order", () => {
  it("the updates file holds a title, the provenance line, then the fixture's update lines; the planned board holds none", () => {
    const at = updateLines(BOARD_TEXT);
    expect(at.length, "PREMISE: the fixture carries update lines").toBeGreaterThan(1);
    const lines = writeText(CHESS_PLAN, PRE_V3_BOARD_UPDATES_REL).split("\n");
    expect(lines[0]).toBe(BOARD_UPDATES_TITLE);
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe(provenanceLine(null, DATE));
    expect(lines[3]).toBe("");
    expect(lines.slice(4, 4 + at.length)).toEqual(at.map((n) => BOARD_LINES[n - 1]));
    expect(lines.slice(4 + at.length).every((l) => l === ""), "nothing follows the update lines").toBe(true);
    const board = writeText(CHESS_PLAN, BOARD_REL);
    expect(updateLines(board)).toEqual([]);
    for (const n of at) expect(board.split("\n"), `line ${n}`).not.toContain(BOARD_LINES[n - 1]);
  });

  it("an `_Updated:` line inside an HTML comment stays on the board, and no updates file is planned when there is none", () => {
    const inComment = "_Updated: 2026-01-01 by Orchestrator — written inside a comment";
    const board = smallBoard(["- [ABC-1] one  (meta)"], ["<!--", inComment, "-->"]);
    const plan = planStateMigrate(smallInputs(board, ["ABC-1"]));
    expect(plan.refusals).toEqual([]);
    expect(writeText(plan, BOARD_REL).split("\n")).toContain(inComment);
    expect(plan.writes.map((w) => w.rel)).not.toContain(PRE_V3_BOARD_UPDATES_REL);
    expect(plan.proof).toEqual({ ok: true });
  });

  it("an `_Updated:` line that opens an HTML comment stays on the board, so the commented-out rows after it stay commented out", () => {
    const opener = "_Updated: 2026-01-01 by me <!-- example rows below, not real:";
    const board = ["## Ready (WIP 0/5)", "- [ABC-1] One  (size: S) trailer one", opener, "- [ABC-2] Ghost  (size: S)", "-->", ""].join(
      "\n",
    );
    const plan = planStateMigrate(smallInputs(board, ["ABC-1"]));
    expect(plan.refusals).toEqual([]);
    const ids = (text: string): string[] => parseBoard(text).columns.flatMap((c) => c.rows.map((r) => r.id));
    expect(ids(board), "PREMISE: the pre-v3 board has one live row").toEqual(["ABC-1"]);
    const planned = writeText(plan, BOARD_REL);
    expect(ids(planned)).toEqual(["ABC-1"]);
    expect(planned.split("\n")).toContain(opener);
    expect(plan.writes.map((w) => w.rel)).not.toContain(PRE_V3_BOARD_UPDATES_REL);
    expect(plan.notes.some((n) => n.startsWith(`line 3 of ${LEGACY_BOARD_REL} is an \`_Updated:\` line`)), plan.notes.join("\n")).toBe(
      true,
    );
    expect(plan.proof).toEqual({ ok: true });
  });
});

describe("(S7) D-03: a row whose ticket file is absent is cut, and its trailer goes to the orphan file", () => {
  it("ABC-209 (no ticket file in the fixture) is cut into the orphan file under `## [ABC-209]`, and nothing is written for it under the tickets directory", () => {
    const n = BOARD_LINES.findIndex((l) => l.startsWith("- [ABC-209] ")) + 1;
    expect(n, "PREMISE: the fixture has the ABC-209 row").toBeGreaterThan(0);
    expect(CHESS.legacy.some((f) => f.rel.includes("/ABC-209")), "PREMISE: ABC-209 has no ticket file").toBe(false);
    const trailer = cutRow(BOARD_LINES[n - 1] as string)?.trailer ?? "";
    expect(trailer.length).toBeGreaterThan(0);
    const lines = writeText(CHESS_PLAN, PRE_V3_ORPHAN_NOTES_REL).split("\n");
    expect(lines.slice(0, 4)).toEqual([ORPHAN_NOTES_TITLE, "", provenanceLine(null, DATE), ""]);
    const h = lines.indexOf("## [ABC-209]");
    expect(h).toBe(4);
    expect(lines.slice(h + 1, h + 5)).toEqual(["", provenanceLine(n, DATE), "", trailer]);
    expect(CHESS_PLAN.writes.filter((w) => w.rel.startsWith(`${TICKETS_REL}/`) && w.rel.includes("ABC-209"))).toEqual([]);
    expect(CHESS_PLAN.cuts.find((c) => c.id === "ABC-209")?.noteRel).toBe(PRE_V3_ORPHAN_NOTES_REL);
  });

  it("an orphan row with no trailer (ABC-210) is not cut and stays whole; no orphan file is planned when there is none", () => {
    const n = BOARD_LINES.findIndex((l) => l.startsWith("- [ABC-210] ")) + 1;
    expect(writeText(CHESS_PLAN, BOARD_REL).split("\n")).toContain(BOARD_LINES[n - 1]);
    expect(writeText(CHESS_PLAN, PRE_V3_ORPHAN_NOTES_REL)).not.toContain("## [ABC-210]");
    const plan = planStateMigrate(smallInputs(smallBoard(["- [ABC-1] one  (meta) — merged"]), ["ABC-1"]));
    expect(plan.writes.map((w) => w.rel)).not.toContain(PRE_V3_ORPHAN_NOTES_REL);
  });

  it("two orphan rows give two `## [ID]` sections in board order, each with its own board line", () => {
    const board = smallBoard(["- [ABC-7] seven  (m) — note seven", "- [ABC-3] three  (m) — note three"]);
    const plan = planStateMigrate(smallInputs(board, []));
    const lines = writeText(plan, PRE_V3_ORPHAN_NOTES_REL).split("\n");
    expect(lines.indexOf("## [ABC-7]")).toBeLessThan(lines.indexOf("## [ABC-3]"));
    expect(lines).toContain(" — note seven");
    expect(lines).toContain(" — note three");
    expect(plan.writes.filter((w) => w.rel.startsWith(`${TICKETS_REL}/`))).toEqual([]);
    expect(plan.proof).toEqual({ ok: true });
  });
});

describe("(S7) the stage-A proof fails, naming the file and line, on every mutation of a valid plan's writes", () => {
  const written = writesOf(CHESS_PLAN);
  const boardText = writeText(CHESS_PLAN, BOARD_REL);
  const ready = boardText.split("\n").indexOf("## Ready (WIP 0/8)") + 1;
  const original115 = BOARD_LINES.findIndex((l) => l.startsWith("- [ABC-115] ")) + 1;
  const ticket115 = rel115();

  it("PREMISE: the unmutated writes prove", () => {
    expect(ready).toBeGreaterThan(0);
    expect(proveStateMigrate(CHESS, CHESS_PLAN, written)).toEqual({ ok: true });
  });

  it("proof: one original line dropped from the board is named by its pre-v3 board line", () => {
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, BOARD_REL, (t) => dropLine(t, ready))));
    const n = BOARD_LINES.indexOf("## Ready (WIP 0/8)") + 1;
    expect(r.some((x) => x.includes(`line ${n} of the pre-v3 board ${LEGACY_BOARD_REL}`) && x.includes("## Ready")), r.join("\n")).toBe(true);
  });

  it("proof: one line duplicated on the board is named by its line in the board", () => {
    const r = reasonsOf(
      proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, BOARD_REL, (t) => t.replace("## Ready (WIP 0/8)\n", "## Ready (WIP 0/8)\n## Ready (WIP 0/8)\n"))),
    );
    expect(r.some((x) => x.includes(`line ${ready + 1} of ${BOARD_REL}`)), r.join("\n")).toBe(true);
  });

  it("proof: one byte changed in an update line is named in the updates file and in the pre-v3 board", () => {
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, PRE_V3_BOARD_UPDATES_REL, (t) => t.replace("_Updated: 2026-10-26", "_Updated: 2026-10-27"))));
    expect(r.some((x) => x.includes(`of ${PRE_V3_BOARD_UPDATES_REL}`)), r.join("\n")).toBe(true);
    expect(r.some((x) => x.includes(`of the pre-v3 board ${LEGACY_BOARD_REL}`)), r.join("\n")).toBe(true);
  });

  it("proof: an original line declared generated fails, by template and by count", () => {
    const byTemplate = { ...CHESS_PLAN, generated: [...CHESS_PLAN.generated, { rel: BOARD_REL, line: 1, kind: "board-notes-heading" as const, boardLine: null, id: null }] };
    expect(reasonsOf(proveStateMigrate(CHESS, byTemplate, written)).some((x) => x.includes(`line 1 of ${BOARD_REL} is declared generated`))).toBe(true);
    // A board line that happens to equal a template is still an original: declaring it generated drops it from the outputs.
    const board = smallBoard(["- [ABC-1] one  (m) — note"], ["", "## Board notes"]);
    const inputs = smallInputs(board, ["ABC-1"]);
    const plan = planStateMigrate(inputs);
    expect(plan.proof, "PREMISE: the board's own heading line proves as an original").toEqual({ ok: true });
    const line = writeText(plan, BOARD_REL).split("\n").indexOf("## Board notes") + 1;
    const lying = { ...plan, generated: [...plan.generated, { rel: BOARD_REL, line, kind: "board-notes-heading" as const, boardLine: null, id: null }] };
    const r = reasonsOf(proveStateMigrate(inputs, lying, writesOf(plan)));
    expect(r.some((x) => x.includes(`of the pre-v3 board ${LEGACY_BOARD_REL}`) && x.includes("## Board notes")), r.join("\n")).toBe(true);
  });

  it("proof: a kept row that does not rejoin its trailer is named with both lines and the original board line", () => {
    const cut = CHESS_PLAN.cuts.find((c) => c.id === "ABC-074");
    expect(cut).toBeDefined();
    const shifted = { ...CHESS_PLAN, cuts: CHESS_PLAN.cuts.map((c) => (c === cut ? { ...c, keptLine: ready } : c)) };
    const r = reasonsOf(proveStateMigrate(CHESS, shifted, written));
    expect(r.some((x) => x.includes(`line ${ready} of ${BOARD_REL}`) && x.includes(`do not rejoin line ${cut?.boardLine} of the pre-v3 board`)), r.join("\n")).toBe(true);
    // The same failure when the written kept row loses its last byte.
    const kept = boardText.split("\n")[(cut?.keptLine ?? 0) - 1] as string;
    const r2 = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, BOARD_REL, (t) => t.replace(kept, kept.slice(0, -1)))));
    expect(r2.some((x) => x.includes("do not rejoin")), r2.join("\n")).toBe(true);
  });

  it("proof: the longest trailer shortened to 1,024 characters fails", () => {
    const trailer = cutRow(BOARD_LINES[original115 - 1] as string)?.trailer ?? "";
    expect(trailer.length).toBeGreaterThan(1_024);
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, ticket115, (t) => t.replace(trailer, trailer.slice(0, 1_024)))));
    expect(r.some((x) => x.includes(`do not rejoin line ${original115} of the pre-v3 board`)), r.join("\n")).toBe(true);
  });

  it("proof: an appended ticket whose prefix is not its original names the ticket and the byte", () => {
    const out = new Map(written);
    const bytes = new Uint8Array(written.get(ticket115) as Uint8Array);
    bytes[10] = bytes[10] === 0x41 ? 0x42 : 0x41;
    out.set(ticket115, bytes);
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, out));
    expect(r.some((x) => x.includes(`${ticket115} does not begin with the bytes of its original`) && x.includes("byte 10")), r.join("\n")).toBe(true);
  });

  it("proof: an orphan trailer removed from the orphan file is named by its pre-v3 board line", () => {
    const n = BOARD_LINES.findIndex((l) => l.startsWith("- [ABC-209] ")) + 1;
    const trailer = cutRow(BOARD_LINES[n - 1] as string)?.trailer ?? "";
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, editWritten(written, PRE_V3_ORPHAN_NOTES_REL, (t) => t.replace(trailer, ""))));
    expect(r.some((x) => x.includes(`line ${n} of the pre-v3 board`) || x.includes(`do not rejoin line ${n}`)), r.join("\n")).toBe(true);
  });
});

describe("(S7) the edge cases of MIGRATE-01 and MIGRATE-03", () => {
  it("MIGRATE-01 adjacency: two adjacent rows of one ticket give two Board notes sections, in board order, never merged", () => {
    const board = smallBoard(["- [ABC-1] first  (m) — note one", "- [ABC-1] again  (m) — note two"]);
    const plan = planStateMigrate(smallInputs(board, ["ABC-1"]));
    const lines = writeText(plan, `${TICKETS_REL}/ABC-1-small.md`).split("\n");
    expect(lines.filter((l) => l === BOARD_NOTES_HEADING)).toHaveLength(2);
    expect(lines.indexOf(" — note one")).toBeLessThan(lines.indexOf(" — note two"));
    expect(plan.proof).toEqual({ ok: true });
  });

  it("MIGRATE-01 empty: a board with no trailer and no `_Updated:` line plans its own bytes, no notes, no updates and no orphan file", () => {
    const board = smallBoard(["- [ABC-1] one  (merged)"]);
    const inputs = smallInputs(board, ["ABC-1"]);
    const plan = planStateMigrate(inputs);
    expect(plan.refusals).toEqual([]);
    expect(Buffer.from(plan.writes.find((w) => w.rel === BOARD_REL)?.bytes ?? []).equals(Buffer.from(enc.encode(board)))).toBe(true);
    expect(plan.writes.map((w) => w.rel)).toEqual([BOARD_REL]);
    expect(plan.appended).toEqual([]);
    expect(plan.cuts).toEqual([]);
    expect(plan.proof).toEqual({ ok: true });
  });

  it("MIGRATE-03 empty: a board of blank lines proves with two empty multisets; dropping the one line of a one-line board fails naming it", () => {
    const blank = planStateMigrate(smallInputs("\n\n\n", []));
    expect(blank.proof).toEqual({ ok: true });
    const one = smallInputs("# Board\n", []);
    const plan = planStateMigrate(one);
    const r = reasonsOf(proveStateMigrate(one, plan, new Map([[BOARD_REL, enc.encode("\n")]])));
    expect(r).toEqual([`line 1 of the pre-v3 board ${LEGACY_BOARD_REL} is in no split output: "# Board"`]);
  });

  it("MIGRATE-03 ordering: dropping one of two identical original lines fails (the proof counts a multiset)", () => {
    const board = smallBoard(["- [ABC-1] one  (m)"], ["", "same line", "same line"]);
    const inputs = smallInputs(board, ["ABC-1"]);
    const plan = planStateMigrate(inputs);
    expect(plan.proof).toEqual({ ok: true });
    const out = editWritten(writesOf(plan), BOARD_REL, (t) => t.replace("same line\nsame line\n", "same line\n"));
    const r = reasonsOf(proveStateMigrate(inputs, plan, out));
    expect(r.some((x) => x.includes(`of the pre-v3 board ${LEGACY_BOARD_REL} is in no split output: "same line"`)), r.join("\n")).toBe(true);
  });
});

describe("(S7) refusals, each naming the file, and a refused plan writes nothing", () => {
  const invalid = new Uint8Array([0x23, 0x20, 0xff, 0xfe, 0x0a]);

  it("a board that is not valid UTF-8 is refused by name", () => {
    const plan = planStateMigrate(withFile(CHESS, LEGACY_BOARD_REL, invalid));
    expect(plan.refusals.some((r) => r.includes(LEGACY_BOARD_REL) && r.includes("UTF-8"))).toBe(true);
    expect(plan.writes).toEqual([]);
    expect(plan.archiveMoves).toEqual([]);
    expect(plan.steps).toEqual([]);
  });

  it("a ticket to append that is not valid UTF-8 is refused by name", () => {
    const rel = ticketRel(CHESS, "ABC-074");
    const original = legacyBytes(CHESS, rel);
    const plan = planStateMigrate(withFile(CHESS, rel, concat(original, new Uint8Array([0xc3]))));
    expect(plan.refusals.some((r) => r.includes(rel) && r.includes("UTF-8")), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  it("a board with mixed line endings is refused by name", () => {
    const mixed = BOARD_TEXT.replace("\n", "\r\n");
    const plan = planStateMigrate(withBoard(mixed));
    expect(plan.refusals.some((r) => r.includes(LEGACY_BOARD_REL) && r.includes("mixes LF and CRLF")), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  it("a ticket to append with mixed line endings is refused by name; a ticket that receives nothing is not checked", () => {
    const rel = ticketRel(CHESS, "ABC-074");
    const mixed = enc.encode(dec.decode(legacyBytes(CHESS, rel)).replace("\n", "\r\n"));
    const plan = planStateMigrate(withFile(CHESS, rel, mixed));
    expect(plan.refusals.some((r) => r.includes(rel) && r.includes("mixes LF and CRLF")), plan.refusals.join("\n")).toBe(true);
    const quiet = ticketRel(CHESS, "ABC-001");
    const fine = planStateMigrate(withFile(CHESS, quiet, enc.encode(dec.decode(legacyBytes(CHESS, quiet)).replace("\n", "\r\n"))));
    expect(fine.refusals).toEqual([]);
  });

  it("two ticket files with one identity are refused, both named", () => {
    const rel = ticketRel(CHESS, "ABC-074");
    const twin = `${LEGACY_STATE_ROOT_REL}/tickets/ABC-074-a-second-copy.md`;
    const plan = planStateMigrate(withFile(CHESS, twin, legacyBytes(CHESS, rel)));
    expect(plan.refusals.some((r) => r.includes(rel) && r.includes(twin) && r.includes("ABC-074")), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  /** The pre-v3 path that the whole-root rename moves to `rel`. */
  const legacyOf = (rel: string): string => `${LEGACY_STATE_ROOT_REL}/${rel.slice(STATE_ROOT_REL.length + 1)}`;

  it("a pre-v3 file already at a planned archive destination, written file or the layout marker is refused by name, before any write", () => {
    const ticketName = ticketRel(CHESS, "ABC-074").slice(`${LEGACY_STATE_ROOT_REL}/tickets/`.length);
    expect(CHESS_PLAN.archiveMoves.map((m) => m.to), "PREMISE: the fixture archives these").toEqual(
      expect.arrayContaining([PRE_V3_BOARD_REL, `${PRE_V3_TICKETS_REL}/${ticketName}`, PRE_V3_NFR_CATALOG_REL, PRE_V3_TRACEABILITY_REL]),
    );
    expect(CHESS_PLAN.writes.map((w) => w.rel), "PREMISE: the fixture writes the updates file").toContain(PRE_V3_BOARD_UPDATES_REL);
    for (const taken of [
      PRE_V3_BOARD_REL,
      `${PRE_V3_TICKETS_REL}/${ticketName}`,
      PRE_V3_NFR_CATALOG_REL,
      PRE_V3_TRACEABILITY_REL,
      PRE_V3_BOARD_UPDATES_REL,
      LAYOUT_MARKER_REL,
    ]) {
      const legacy = legacyOf(taken);
      const plan = planStateMigrate(withFile(CHESS, legacy, enc.encode("in the way\n")));
      expect(
        plan.refusals.some((r) => r.startsWith(`${legacy} already exists in the pre-v3 tree`) && r.endsWith("move or rename that file first")),
        `${taken}: ${plan.refusals.join("\n")}`,
      ).toBe(true);
      expect(plan.writes, taken).toEqual([]);
      expect(plan.archiveMoves, taken).toEqual([]);
    }
  });
});

describe("(S7) line endings and the byte-order mark", () => {
  it("a CRLF board keeps the CR on each kept row, its trailers carry none, and each appended section uses its ticket's own ending", () => {
    const rel074 = ticketRel(CHESS, "ABC-074");
    const crlfTicket = enc.encode(dec.decode(legacyBytes(CHESS, rel074)).split("\n").join("\r\n"));
    const inputs = withFile(withBoard(BOARD_TEXT.split("\n").join("\r\n")), rel074, crlfTicket);
    const plan = planStateMigrate(inputs);
    expect(plan.refusals).toEqual([]);
    expect(plan.proof).toEqual({ ok: true });
    const board = writeText(plan, BOARD_REL).split("\n");
    for (const c of plan.cuts) {
      expect(board[c.keptLine - 1]?.endsWith("\r"), `${c.id}: the kept row keeps its CR`).toBe(true);
      const trailer = (writeText(plan, c.noteRel).split("\n")[c.noteLine - 1] ?? "").replace(/\r$/, "");
      expect(trailer.length, c.id).toBeGreaterThan(0);
      expect(trailer.includes("\r"), `${c.id}: the trailer carries no CR of its own`).toBe(false);
    }
    const appended074 = writeText(plan, movedRel(rel074)).slice(crlfTicket.length);
    expect(appended074.includes("\r\n")).toBe(true);
    expect(appended074.replace(/\r\n/g, "").includes("\n"), "ABC-074's section is CRLF only").toBe(false);
    const rel103 = movedRel(ticketRel(CHESS, "ABC-103"));
    const appended103 = writeText(plan, rel103).slice(legacyBytes(CHESS, ticketRel(CHESS, "ABC-103")).length);
    expect(appended103.includes("\r"), "an LF ticket's section is LF").toBe(false);
  });

  it("a byte-order mark on board line 1 is kept on the planned board", () => {
    const plan = planStateMigrate(withBoard(`﻿${BOARD_TEXT}`));
    expect(plan.refusals).toEqual([]);
    const bytes = plan.writes.find((w) => w.rel === BOARD_REL)?.bytes ?? new Uint8Array();
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(plan.proof).toEqual({ ok: true });
  });
});

describe("(S7) budgets after the split (D-01, D-07)", () => {
  it("overBudget names every planned board row still over BUDGETS.boardRowChars by ID and size, and every ticket over BUDGETS.ticketBytes", () => {
    const board = writeText(CHESS_PLAN, BOARD_REL);
    const lines = normalizeDocument(board).split("\n");
    const rows = parseBoard(board).columns.flatMap((c) => c.rows);
    const longRows = rows.filter((r) => (lines[r.line - 1] ?? "").length > BUDGETS.boardRowChars);
    expect(longRows.length, "PREMISE: the fixture keeps rows over the row budget after the cut").toBeGreaterThan(0);
    const rowFindings = CHESS_PLAN.overBudget.filter((f) => f.key === "boardRowChars");
    expect(rowFindings.map((f) => [f.rel, f.line, f.measured])).toEqual(
      longRows.map((r) => [BOARD_REL, r.line, (lines[r.line - 1] ?? "").length]).sort((a, b) => (a[1] as number) - (b[1] as number)),
    );
    for (const r of longRows) expect(rowFindings.find((f) => f.line === r.line)?.note ?? "", r.id).toContain(r.id);
    const big = CHESS_PLAN.writes
      .filter((w) => w.rel.startsWith(`${TICKETS_REL}/`) && w.bytes.length > BUDGETS.ticketBytes)
      .map((w) => w.rel);
    expect(big, "PREMISE: ABC-115 is over the ticket budget after its append").toContain(rel115());
    expect(CHESS_PLAN.overBudget.filter((f) => f.key === "ticketBytes").map((f) => f.rel)).toEqual(big.sort());
    expect(CHESS_PLAN.overBudget).toEqual(sortFindings(CHESS_PLAN.overBudget));
  });

  it("a planned board over BUDGETS.boardBytes is named with its bytes", () => {
    const pad = `${"x".repeat(200)}\n`.repeat(200);
    const plan = planStateMigrate(withBoard(BOARD_TEXT.replace("## Conventions\n", `## Conventions\n${pad}`)));
    const f = plan.overBudget.find((x) => x.key === "boardBytes");
    expect(f?.rel).toBe(BOARD_REL);
    expect(f?.measured).toBe(plan.writes.find((w) => w.rel === BOARD_REL)?.bytes.length);
  });
});

describe("(S7) determinism and the closed generated-line set", () => {
  it("planning the fixture twice gives byte-identical writes, archive moves, generated positions and steps", () => {
    const again = planStateMigrate(chessInputs());
    expect(again.writes).toEqual(CHESS_PLAN.writes);
    expect(again.archiveMoves).toEqual(CHESS_PLAN.archiveMoves);
    expect(again.generated).toEqual(CHESS_PLAN.generated);
    expect(again.steps).toEqual(CHESS_PLAN.steps);
  });

  it("MIGRATE_GENERATED_LINE_KINDS is pinned, and every generated kind of the fixture plan is a member", () => {
    // Plan 38-04 (D-06, D-05) adds the five NFR and kit-seed kinds; the fixture plan still generates every member.
    expect([...MIGRATE_GENERATED_LINE_KINDS]).toEqual([
      "board-notes-heading",
      "provenance",
      "updates-title",
      "orphan-title",
      "orphan-heading",
      "nfr-notes-title",
      "nfr-table-header-copy",
      "nfr-table-separator-copy",
      "nfr-index-line",
      "kit-seed-line",
      "done-archive-skeleton",
      "progress-archive-skeleton",
    ]);
    expect(Object.isFrozen(MIGRATE_GENERATED_LINE_KINDS)).toBe(true);
    // Plan 38-05 (D-08): the frozen fixture's Done column is within BUDGETS.doneRows, so the roll kinds come from the
    // rolling variant of the fixture (S9), whose plan generates every kind the fixture's does.
    const kinds = new Set([...CHESS_PLAN.generated, ...rollingPlan().generated, ...bothRolls().plan.generated].map((g) => g.kind));
    for (const k of MIGRATE_GENERATED_LINE_KINDS) expect(kinds, k).toContain(k);
  });
});

// ── (S8) the NFR catalog and the traceability file (plan 38-04) ───────────────────────────────────────────────

const LEGACY_NFR_CATALOG_REL = `${LEGACY_STATE_ROOT_REL}/nfr-catalog.md`;
const LEGACY_TRACEABILITY_REL = `${LEGACY_STATE_ROOT_REL}/traceability.md`;

/** The fixture catalog's lines, each without its terminator. */
function catalogLines(inputs: MigrateInputs = CHESS): string[] {
  return dec.decode(legacyBytes(inputs, LEGACY_NFR_CATALOG_REL)).split("\n").map((l) => l.replace(/\r$/, ""));
}

/** The trimmed cells of a table line, split on pipes not preceded by a backslash (independent of the planner). */
function cellsOf(line: string): string[] {
  const parts = line.split(/(?<!\\)\|/);
  parts.shift();
  if (/(?<!\\)\|\s*$/.test(line)) parts.pop();
  return parts.map((c) => c.trim());
}

/**
 * The one `##` section of the fixture catalog whose heading begins `start`: its lines from the heading to the line
 * before the next `#` or `##` heading, trailing blank lines dropped. The fixture's catalog has no fence, so a plain
 * scan is the section extent.
 */
function catalogSection(lines: readonly string[], start: string): string[] {
  const at = lines.findIndex((l) => l.startsWith(start));
  if (at < 0) throw new Error(`PREMISE: a catalog heading beginning ${start}`);
  let end = at + 1;
  while (end < lines.length && !/^#{1,2} /.test(lines[end] as string)) end++;
  const out = lines.slice(at, end);
  while (out.length > 0 && /^[ \t]*$/.test(out[out.length - 1] as string)) out.pop();
  return out;
}

describe("(S8) one NFR row and its own section become nfr/NFR-xxx.md and an index line (plan 38-04 tracer)", () => {
  const lines = catalogLines();
  const header = lines.find((l) => l.startsWith("| ID |")) as string;
  const separator = lines[lines.indexOf(header) + 1] as string;
  const row005 = lines.find((l) => l.startsWith("| NFR-005 |")) as string;
  const nfr005 = `${NFR_DIR_REL}/NFR-005.md`;

  it("PREMISE: the fixture catalog has a seed-shaped table header, the NFR-005 row and a heading naming NFR-005 alone", () => {
    expect(header).toBeDefined();
    expect(cellsOf(header)).toEqual(["ID", "Category", "Target", "Applies to", "Verified by"]);
    expect(row005).toBeDefined();
    expect(lines.some((l) => l.startsWith("## `NFR-005` IS MEASURED"))).toBe(true);
  });

  it("(S8) nfr/NFR-005.md holds the header copy, the separator copy, its row, then its own section verbatim, and the plan proves", () => {
    expect(CHESS_PLAN.refusals).toEqual([]);
    const file = writeText(CHESS_PLAN, nfr005).split("\n");
    expect(file[0]).toBe(header);
    expect(file[1]).toBe(separator);
    expect(file[2]).toBe(row005);
    const section = catalogSection(lines, "## `NFR-005` IS MEASURED");
    const at = file.indexOf(section[0] as string);
    expect(at, "the section's heading is in the file").toBeGreaterThan(2);
    expect(file.slice(at, at + section.length)).toEqual(section);
    expect(CHESS_PLAN.generated).toContainEqual({ rel: nfr005, line: 1, kind: "nfr-table-header-copy", boardLine: null, id: "NFR-005" });
    expect(CHESS_PLAN.generated).toContainEqual({ rel: nfr005, line: 2, kind: "nfr-table-separator-copy", boardLine: null, id: "NFR-005" });
    expect(CHESS_PLAN.proof).toEqual({ ok: true });
    expect(proveStateMigrate(CHESS, CHESS_PLAN, writesOf(CHESS_PLAN))).toEqual({ ok: true });
  });

  it("(S8) the new catalog is the kit seed's bytes followed by one index line per row in table order, copying the cells", () => {
    const seed = CHESS.seedNfrCatalog;
    const bytes = CHESS_PLAN.writes.find((w) => w.rel === NFR_CATALOG_REL)?.bytes ?? new Uint8Array();
    expect(Buffer.from(bytes.subarray(0, seed.length)).equals(Buffer.from(seed)), "the catalog begins with the kit seed").toBe(true);
    const rows = lines.filter((l) => /^\| NFR-[0-9]+ \|/.test(l));
    expect(rows.length, "PREMISE: the fixture table has rows").toBeGreaterThan(1);
    const index = dec.decode(bytes.subarray(seed.length)).split("\n").filter((l) => l !== "");
    expect(index).toEqual(
      rows.map((r) => {
        const c = cellsOf(r);
        return `- [${c[0]}](nfr/${c[0]}.md) ${c[1]}: ${c[2]}`;
      }),
    );
  });

  it("(S8) the original catalog and the traceability file are archived unchanged, and the traceability file is the kit seed", () => {
    expect(CHESS_PLAN.archiveMoves).toContainEqual({ from: NFR_CATALOG_REL, to: PRE_V3_NFR_CATALOG_REL });
    expect(CHESS_PLAN.archiveMoves).toContainEqual({ from: TRACEABILITY_REL, to: PRE_V3_TRACEABILITY_REL });
    expect(CHESS_PLAN.originals).toContainEqual({ original: LEGACY_NFR_CATALOG_REL, at: PRE_V3_NFR_CATALOG_REL, match: "identical" });
    expect(CHESS_PLAN.originals).toContainEqual({ original: LEGACY_TRACEABILITY_REL, at: PRE_V3_TRACEABILITY_REL, match: "identical" });
    const trace = CHESS_PLAN.writes.find((w) => w.rel === TRACEABILITY_REL)?.bytes ?? new Uint8Array();
    expect(Buffer.from(trace).equals(Buffer.from(CHESS.seedTraceability))).toBe(true);
    expect(CHESS_PLAN.writes.some((w) => w.rel === PRE_V3_NFR_NOTES_REL), "the notes file is planned").toBe(true);
  });
});

describe("(S8) the whole NFR rule: notes residue, header lookup, refusals, budgets and proof failures (plan 38-04 Task 2)", () => {
  const CATALOG_TEXT = dec.decode(legacyBytes(CHESS, LEGACY_NFR_CATALOG_REL));
  const lines = catalogLines();
  const headerAt = lines.findIndex((l) => l.startsWith("| ID |"));
  const nfrFiles = (plan: MigratePlan): string[] => plan.writes.filter((w) => w.rel.startsWith(`${NFR_DIR_REL}/`)).map((w) => w.rel);
  const withCatalog = (text: string, base: MigrateInputs = CHESS): MigrateInputs => withFile(base, LEGACY_NFR_CATALOG_REL, enc.encode(text));
  /** `lines` with `block` inserted before the zero-based line `at`, joined with LF and one final LF. */
  const inserted = (at: number, block: readonly string[]): string => [...lines.slice(0, at), ...block, ...lines.slice(at)].join("\n") + "\n";
  /** A small catalog: a title, the given header and rows, then the given tail. */
  const small = (header: string, rows: readonly string[], tail: readonly string[] = []): string =>
    ["# NFR Catalog", "", header, header.replace(/[^|]+/g, "---"), ...rows, "", ...tail].join("\n") + "\n";

  it("PREMISE: the fixture catalog's lines end with LF and no table line touches a comment", () => {
    expect(CATALOG_TEXT.endsWith("\n")).toBe(true);
    expect(CATALOG_TEXT.includes("\r")).toBe(false);
    expect(headerAt).toBeGreaterThan(0);
  });

  it("NFR notes: a section naming no NFR ID and a section naming two IDs go to the notes file verbatim, in catalog order", () => {
    const none = catalogSection(lines, "## `RISK-003`");
    const two = catalogSection(lines, "## `NFR-003` AND `NFR-006`");
    const notes = writeText(CHESS_PLAN, PRE_V3_NFR_NOTES_REL).split("\n");
    const a = notes.indexOf(none[0] as string);
    const b = notes.indexOf(two[0] as string);
    expect(a, "the no-ID section is in the notes file").toBeGreaterThan(0);
    expect(b, "the two-ID section comes later in the notes file").toBeGreaterThan(a);
    expect(notes.slice(a, a + none.length)).toEqual(none);
    expect(notes.slice(b, b + two.length)).toEqual(two);
    for (const rel of nfrFiles(CHESS_PLAN)) {
      const file = writeText(CHESS_PLAN, rel).split("\n");
      expect(file, rel).not.toContain(none[0]);
      expect(file, rel).not.toContain(two[0]);
    }
  });

  it("NFR notes: the notes file holds its title and provenance line, then the title, `_Updated:` lines, comment block, header and separator, verbatim and in order", () => {
    const notes = writeText(CHESS_PLAN, PRE_V3_NFR_NOTES_REL).split("\n");
    expect(notes[0]).toBe(NFR_NOTES_TITLE);
    expect(notes[2]).toBe(provenanceLine(null, DATE, "nfr-catalog"));
    expect(notes[2]).toContain(LEGACY_NFR_CATALOG_REL);
    expect(notes.slice(4, 4 + headerAt + 2)).toEqual(lines.slice(0, headerAt + 2));
    expect(lines.slice(0, headerAt).some((l) => l.startsWith("_Updated:"))).toBe(true);
    expect(lines.slice(0, headerAt).some((l) => l.startsWith("<!--"))).toBe(true);
  });

  it("NFR: a `###` heading inside a one-ID section stays in that NFR's file, and no line of it is in the notes file", () => {
    const at = lines.findIndex((l) => l.startsWith("## `NFR-003` NO LONGER NAMES")) + 1;
    const plan = planStateMigrate(withCatalog(inserted(at, ["", "### A sub-part of the NFR-003 section", "", "Its own sub-part text."])));
    expect(plan.refusals).toEqual([]);
    const file = writeText(plan, `${NFR_DIR_REL}/NFR-003.md`).split("\n");
    expect(file).toContain("### A sub-part of the NFR-003 section");
    expect(file).toContain("Its own sub-part text.");
    expect(writeText(plan, PRE_V3_NFR_NOTES_REL).split("\n")).not.toContain("Its own sub-part text.");
    expect(plan.proof).toEqual({ ok: true });
  });

  it("NFR: a commented example row is no row: no NFR file is planned for it and the commented lines go to the notes file verbatim", () => {
    const block = ["<!--", "| ID | Category | Target |", "|---|---|---|", "| NFR-099 | Example | not a live row |", "-->", ""];
    const plan = planStateMigrate(withCatalog(inserted(headerAt, block)));
    expect(plan.refusals).toEqual([]);
    expect(nfrFiles(plan)).not.toContain(`${NFR_DIR_REL}/NFR-099.md`);
    expect(nfrFiles(plan).length).toBe(CHESS_PLAN.writes.filter((w) => w.rel.startsWith(`${NFR_DIR_REL}/`)).length);
    const notes = writeText(plan, PRE_V3_NFR_NOTES_REL).split("\n");
    const at = notes.indexOf("| NFR-099 | Example | not a live row |");
    expect(notes.slice(at - 3, at + 2)).toEqual(block.slice(0, 5));
    expect(writeText(plan, NFR_CATALOG_REL)).not.toContain("NFR-099");
    expect(plan.proof).toEqual({ ok: true });
  });

  it("NFR: a header with Target before Category gives index lines with the right cells, read by header name", () => {
    const text = small("| ID | Target | Applies to | category |", ["| NFR-001 | p95 < 300 ms | reads | Performance |", "| NFR-002 | <= 1 MB | book | Cost |"]);
    const plan = planStateMigrate(withCatalog(text));
    expect(plan.refusals).toEqual([]);
    const index = writeText(plan, NFR_CATALOG_REL).split("\n").filter((l) => l.startsWith("- [NFR-"));
    expect(index).toEqual(["- [NFR-001](nfr/NFR-001.md) Performance: p95 < 300 ms", "- [NFR-002](nfr/NFR-002.md) Cost: <= 1 MB"]);
    expect(plan.proof).toEqual({ ok: true });
  });

  it("NFR: a cell holding an escaped pipe keeps it verbatim in the index line", () => {
    const text = small("| ID | Category | Target |", ["| NFR-001 | Perf \\| speed | `a \\| b` under 2 s |"]);
    const plan = planStateMigrate(withCatalog(text));
    expect(plan.refusals).toEqual([]);
    expect(writeText(plan, NFR_CATALOG_REL).split("\n")).toContain("- [NFR-001](nfr/NFR-001.md) Perf \\| speed: `a \\| b` under 2 s");
    expect(plan.proof).toEqual({ ok: true });
  });

  it("NFR refusal: a table header with no cell named Category is refused naming the file and the line, and nothing is planned", () => {
    const plan = planStateMigrate(withCatalog(small("| ID | Kind | Target |", ["| NFR-001 | Perf | fast |"])));
    expect(plan.refusals.some((r) => r.includes(LEGACY_NFR_CATALOG_REL) && r.includes("line 3") && r.includes("Category")), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
    expect(plan.archiveMoves).toEqual([]);
  });

  it("NFR refusal: a table header with no cell named Target is refused naming the file and the line", () => {
    const plan = planStateMigrate(withCatalog(small("| ID | Category | Goal |", ["| NFR-001 | Perf | fast |"])));
    expect(plan.refusals.some((r) => r.includes(LEGACY_NFR_CATALOG_REL) && r.includes("line 3") && r.includes("Target")), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  it("NFR refusal: two table rows with one NFR ID are refused, both lines named", () => {
    const plan = planStateMigrate(withCatalog(small("| ID | Category | Target |", ["| NFR-001 | Perf | fast |", "| NFR-002 | Cost | small |", "| NFR-001 | Perf | faster |"])));
    expect(
      plan.refusals.some((r) => r.includes(LEGACY_NFR_CATALOG_REL) && r.includes("NFR-001") && r.includes("lines 5 and 7")),
      plan.refusals.join("\n"),
    ).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  it("NFR refusal: a planned NFR file whose path already exists in the pre-v3 tree is refused by name", () => {
    const existing = `${LEGACY_STATE_ROOT_REL}/nfr/NFR-001.md`;
    const plan = planStateMigrate(withFile(CHESS, existing, enc.encode("# NFR-001\n")));
    expect(plan.refusals.some((r) => r.includes(existing) && r.includes(`${NFR_DIR_REL}/NFR-001.md`)), plan.refusals.join("\n")).toBe(true);
    expect(plan.writes).toEqual([]);
  });

  it("NFR refusal: a catalog that is not valid UTF-8, or mixes LF and CRLF, is refused by name", () => {
    const bad = planStateMigrate(withFile(CHESS, LEGACY_NFR_CATALOG_REL, new Uint8Array([0x23, 0x20, 0xff, 0x0a])));
    expect(bad.refusals.some((r) => r.includes(LEGACY_NFR_CATALOG_REL) && r.includes("UTF-8")), bad.refusals.join("\n")).toBe(true);
    const mixed = planStateMigrate(withCatalog(CATALOG_TEXT.replace("\n", "\r\n")));
    expect(mixed.refusals.some((r) => r.includes(LEGACY_NFR_CATALOG_REL) && r.includes("mixes LF and CRLF")), mixed.refusals.join("\n")).toBe(true);
    expect(mixed.writes).toEqual([]);
  });

  it("NFR budgets: overBudget names every index line over BUDGETS.indexEntryBytes and every NFR file over BUDGETS.nfrBytes; no index line is shortened", () => {
    const catalog = writeText(CHESS_PLAN, NFR_CATALOG_REL).split("\n");
    const long = catalog.flatMap((l, i) => (l.startsWith("- [NFR-") && enc.encode(l).length > BUDGETS.indexEntryBytes ? [[NFR_CATALOG_REL, i + 1, enc.encode(l).length]] : []));
    expect(long.length, "PREMISE: the fixture gives index lines over the index budget").toBeGreaterThan(0);
    expect(CHESS_PLAN.overBudget.filter((f) => f.key === "indexEntryBytes").map((f) => [f.rel, f.line, f.measured])).toEqual(long);
    const big = CHESS_PLAN.writes
      .filter((w) => w.rel.startsWith(`${NFR_DIR_REL}/`) && w.bytes.length > BUDGETS.nfrBytes)
      .map((w) => [w.rel, w.bytes.length]);
    expect(big.length, "PREMISE: the fixture gives NFR files over the NFR budget").toBeGreaterThan(0);
    expect(CHESS_PLAN.overBudget.filter((f) => f.key === "nfrBytes").map((f) => [f.rel, f.measured])).toEqual(big);
    expect(CHESS_PLAN.overBudget).toEqual(sortFindings(CHESS_PLAN.overBudget));
    const rows = lines.filter((l) => /^\| NFR-[0-9]+ \|/.test(l));
    for (const r of rows) {
      const c = cellsOf(r);
      expect(catalog, c[0]).toContain(`- [${c[0]}](nfr/${c[0]}.md) ${c[1]}: ${c[2]}`);
    }
  });

  it("NFR proof: a dropped section is named by its catalog line", () => {
    const heading = lines.find((l) => l.startsWith("## `NFR-005` IS MEASURED")) as string;
    const out = editWritten(writesOf(CHESS_PLAN), `${NFR_DIR_REL}/NFR-005.md`, (t) => t.split("\n").filter((l) => l !== heading).join("\n"));
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, out));
    expect(r).toContain(`line ${lines.indexOf(heading) + 1} of the pre-v3 NFR catalog ${LEGACY_NFR_CATALOG_REL} is in no split output: "${heading.slice(0, 120)}…"`);
  });

  it("NFR proof: a row duplicated into a second NFR file is named in that file", () => {
    const row = lines.find((l) => l.startsWith("| NFR-006 |")) as string;
    const rel = `${NFR_DIR_REL}/NFR-002.md`;
    const out = editWritten(writesOf(CHESS_PLAN), rel, (t) => `${t}${row}\n`);
    const n = dec.decode(out.get(rel) as Uint8Array).split("\n").length - 1;
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, out));
    expect(r.some((x) => x.startsWith(`line ${n} of ${rel} is not a line of the pre-v3 NFR catalog ${LEGACY_NFR_CATALOG_REL}`)), r.join("\n")).toBe(true);
  });

  it("NFR proof: a header copy that differs from the original header is named by its file and line", () => {
    const rel = `${NFR_DIR_REL}/NFR-001.md`;
    const out = editWritten(writesOf(CHESS_PLAN), rel, (t) => t.replace("| ID | Category |", "| ID | Kategory |"));
    const r = reasonsOf(proveStateMigrate(CHESS, CHESS_PLAN, out));
    expect(r.some((x) => x.startsWith(`line 1 of ${rel} is declared generated (nfr-table-header-copy)`)), r.join("\n")).toBe(true);
  });

  it("NFR proof: an index line declared over an original line fails, naming the file and line", () => {
    const forged: MigratePlan = {
      ...CHESS_PLAN,
      generated: [...CHESS_PLAN.generated, { rel: PRE_V3_NFR_NOTES_REL, line: 5, kind: "nfr-index-line", boardLine: null, id: "NFR-001" }],
    };
    const r = reasonsOf(proveStateMigrate(CHESS, forged, writesOf(CHESS_PLAN)));
    expect(r.some((x) => x.startsWith(`line 5 of ${PRE_V3_NFR_NOTES_REL} is declared generated (nfr-index-line)`)), r.join("\n")).toBe(true);
  });

  it("NFR absent: a pre-v3 tree with no catalog plans no NFR write and no notes file; one with no traceability file plans no trace move", () => {
    const noCatalog = { ...CHESS, legacy: CHESS.legacy.filter((f) => f.rel !== LEGACY_NFR_CATALOG_REL) };
    const a = planStateMigrate(noCatalog);
    expect(a.refusals).toEqual([]);
    expect(a.writes.filter((w) => w.rel.startsWith(`${NFR_DIR_REL}/`) || w.rel === PRE_V3_NFR_NOTES_REL || w.rel === NFR_CATALOG_REL)).toEqual([]);
    expect(a.archiveMoves.some((m) => m.to === PRE_V3_NFR_CATALOG_REL)).toBe(false);
    expect(a.proof).toEqual({ ok: true });
    const noTrace = { ...CHESS, legacy: CHESS.legacy.filter((f) => f.rel !== LEGACY_TRACEABILITY_REL) };
    const b = planStateMigrate(noTrace);
    expect(b.archiveMoves.some((m) => m.to === PRE_V3_TRACEABILITY_REL)).toBe(false);
    expect(b.writes.some((w) => w.rel === TRACEABILITY_REL)).toBe(false);
    expect(b.proof).toEqual({ ok: true });
  });
});

/** The moved path of the ABC-115 ticket. */
function rel115(): string {
  return movedRel(ticketRel(CHESS, "ABC-115"));
}

/** `a` followed by `b`. */
function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}


// ── (S9) the Done roll inside the migrate plan (plan 38-05, D-08, D-09) ─────────────────────────────────────────

const STATE_ROLL_JS = join(ROOT, "scripts", "runnable-ref", "state-roll.js");
const ROLL_SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-state-migrate-roll-")));
afterAll(() => rmSync(ROLL_SCRATCH, { recursive: true, force: true }));
let rollSeq = 0;

/**
 * The fixture board with `n` rows added at the top of its Done column (newest first). The frozen fixture's Done
 * column holds 18 ticket rows (its six epic rows are not ticket rows), within BUDGETS.doneRows, so a roll needs more:
 * a shape the copy lacks is made here by mutating the inputs, never the fixture (D-15). Each added row ends with its
 * parenthetical, so it has no trailer to cut.
 */
function withDoneRows(text: string, n: number): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => l.startsWith("## Done "));
  if (at < 0) throw new Error("PREMISE: the board has a Done column");
  const added = Array.from({ length: n }, (_, k) => `- [ABC-${900 + k}] A Done row added for the roll test ${k}  (merged: 2026-10-2${k})`);
  return [...lines.slice(0, at + 1), ...added, ...lines.slice(at + 1)].join("\n");
}

/** The number of ticket rows under the Done column of `text`. */
function doneRowCount(text: string): number {
  return parseBoard(text)
    .columns.filter((c) => c.name === "Done")
    .reduce((n, c) => n + c.rows.length, 0);
}

/** The fixture inputs with five Done rows added, and their plan (computed once). */
let ROLLING: { inputs: MigrateInputs; plan: MigratePlan } | null = null;
function rolling(): { inputs: MigrateInputs; plan: MigratePlan } {
  if (ROLLING === null) {
    const inputs = withBoard(withDoneRows(BOARD_TEXT, 5));
    ROLLING = { inputs, plan: planStateMigrate(inputs) };
  }
  return ROLLING;
}
function rollingPlan(): MigratePlan {
  return rolling().plan;
}

/**
 * Run the committed state-roll.js on a scratch v3 tree holding `board` at BOARD_REL and `progress` (when not null) at
 * PROGRESS_REL, and return the files it leaves at BOARD_REL, BOARD_DONE_ARCHIVE_REL, PROGRESS_REL and
 * PROGRESS_ARCHIVE_REL (null when absent), with its exit status and output.
 */
function stateRoll(board: Uint8Array, progress: Uint8Array | null, rels: readonly string[]): {
  status: number | null;
  out: string;
  files: Map<string, Buffer | null>;
} {
  const root = join(ROLL_SCRATCH, `r${++rollSeq}`);
  const put = (rel: string, bytes: Uint8Array): void => {
    const p = join(root, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, bytes);
  };
  put(BOARD_REL, board);
  if (progress !== null) put(PROGRESS_REL, progress);
  const r = spawnSync(process.execPath, [STATE_ROLL_JS, root], { encoding: "utf8", timeout: 60_000 });
  const files = new Map<string, Buffer | null>();
  for (const rel of rels) {
    try {
      files.set(rel, readFileSync(join(root, ...rel.split("/"))));
    } catch {
      files.set(rel, null);
    }
  }
  rmSync(root, { recursive: true, force: true });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}`, files };
}

/** The bytes of one planned write, or null when the plan does not write `rel`. */
function writeBytes(plan: MigratePlan, rel: string): Buffer | null {
  const w = plan.writes.find((x) => x.rel === rel);
  return w === undefined ? null : Buffer.from(w.bytes);
}

describe("(S9) the Done roll runs inside the migrate plan, with the embedded state rules (plan 38-05 tracer)", () => {
  it("PREMISE: the frozen fixture's Done column holds BUDGETS.doneRows or fewer ticket rows; the rolling variant holds more", () => {
    expect(doneRowCount(writeText(CHESS_PLAN, BOARD_REL))).toBeLessThanOrEqual(BUDGETS.doneRows);
    expect(doneRowCount(dec.decode(rollingPlan().beforeRoll ?? new Uint8Array()))).toBeGreaterThan(BUDGETS.doneRows);
    expect(rollingPlan().refusals).toEqual([]);
  });

  it("the frozen fixture's plan rolls nothing: no Done archive is written and the board is the split board", () => {
    expect(writeBytes(CHESS_PLAN, BOARD_DONE_ARCHIVE_REL)).toBeNull();
    expect(Buffer.from(CHESS_PLAN.beforeRoll ?? []).equals(writeBytes(CHESS_PLAN, BOARD_REL) ?? Buffer.alloc(1))).toBe(true);
  });

  it("the rolling plan's board keeps BUDGETS.doneRows Done rows, and the older rows sit in BOARD_DONE_ARCHIVE_REL under its one heading", () => {
    const plan = rollingPlan();
    const board = writeText(plan, BOARD_REL);
    expect(doneRowCount(board)).toBe(BUDGETS.doneRows);
    const archive = writeText(plan, BOARD_DONE_ARCHIVE_REL);
    const before = dec.decode(plan.beforeRoll ?? new Uint8Array());
    const moved = doneRowCount(before) - BUDGETS.doneRows;
    expect(archive.split("\n")[0]).toBe(doneArchiveSkeleton([]).replace(/\n$/, ""));
    expect(parseBoard(archive).columns.flatMap((c) => c.rows)).toHaveLength(moved);
    expect(plan.steps.some((s) => s.verb === "write" && s.to === BOARD_DONE_ARCHIVE_REL && s.note.includes(`${moved} Done row(s)`))).toBe(true);
  });

  it("parity: the planned board and Done archive equal what the committed state-roll.js writes over the split board", () => {
    const plan = rollingPlan();
    expect(plan.beforeRoll, "the plan keeps the split board before the roll").toBeInstanceOf(Uint8Array);
    const r = stateRoll(plan.beforeRoll as Uint8Array, rolling().inputs.progress, [BOARD_REL, BOARD_DONE_ARCHIVE_REL]);
    expect(r.status, r.out).toBe(0);
    expect(r.files.get(BOARD_REL)?.equals(writeBytes(plan, BOARD_REL) ?? Buffer.alloc(0)), "the board").toBe(true);
    expect(r.files.get(BOARD_DONE_ARCHIVE_REL)?.equals(writeBytes(plan, BOARD_DONE_ARCHIVE_REL) ?? Buffer.alloc(0)), "the Done archive").toBe(true);
  });

  it("the proof covers the rolled board: the skeleton line is declared by position, a cut row rolled to the archive rejoins there, and the plan proves", () => {
    const plan = rollingPlan();
    expect(plan.generated).toContainEqual({ rel: BOARD_DONE_ARCHIVE_REL, line: 1, kind: "done-archive-skeleton", boardLine: null, id: null });
    const rolledCut = plan.cuts.find((c) => c.keptRel === BOARD_DONE_ARCHIVE_REL);
    expect(rolledCut, "PREMISE: a cut row is among the rolled rows").toBeDefined();
    const archive = writeText(plan, BOARD_DONE_ARCHIVE_REL).split("\n");
    const note = writeText(plan, (rolledCut as { noteRel: string }).noteRel).split("\n");
    const c = rolledCut as { keptLine: number; noteLine: number; boardLine: number };
    const original = dec.decode(legacyBytes(rolling().inputs, LEGACY_BOARD_REL)).split("\n")[c.boardLine - 1];
    expect((archive[c.keptLine - 1] as string) + (note[c.noteLine - 1] as string)).toBe(original);
    expect(plan.proof).toEqual({ ok: true });
    expect(proveStateMigrate(rolling().inputs, plan, writesOf(plan))).toEqual({ ok: true });
  });

  it("proof: a rolled Done row dropped from the archive is named by its pre-v3 board line", () => {
    const plan = rollingPlan();
    const archive = writeText(plan, BOARD_DONE_ARCHIVE_REL).split("\n");
    const n = archive.findIndex((l, i) => i > 0 && l.startsWith("- [") && !plan.cuts.some((c) => c.keptRel === BOARD_DONE_ARCHIVE_REL && c.keptLine === i + 1)) + 1;
    expect(n, "PREMISE: an uncut rolled row").toBeGreaterThan(1);
    const reasons = reasonsOf(proveStateMigrate(rolling().inputs, plan, editWritten(writesOf(plan), BOARD_DONE_ARCHIVE_REL, (t) => dropLine(t, n))));
    expect(reasons.some((r) => r.includes(LEGACY_BOARD_REL) && r.includes("is in no split output")), reasons.join("\n")).toBe(true);
  });

  it("proof: an altered Done archive heading is named by its file and line", () => {
    const plan = rollingPlan();
    const reasons = reasonsOf(
      proveStateMigrate(rolling().inputs, plan, editWritten(writesOf(plan), BOARD_DONE_ARCHIVE_REL, (t) => t.replace("## Done (WIP unlimited)", "## Done (WIP 0/9)"))),
    );
    expect(reasons.some((r) => r.includes(`line 1 of ${BOARD_DONE_ARCHIVE_REL}`) && r.includes("done-archive-skeleton")), reasons.join("\n")).toBe(true);
  });
});

// ── (S10) the progress roll, refused rolls, budget findings and roll proof failures (plan 38-05 Task 2) ───────────

const PROGRESS_TEXT = dec.decode(CHESS.progress ?? new Uint8Array());

/**
 * The fixture progress file with three dated `## YYYY-MM-DD` entries added before its first `##` section. The frozen
 * fixture's progress file holds no dated entry (its two `##` sections are standing), so a progress roll needs them:
 * made here, never in the fixture (D-15). The entries are not in date order, so the roll's oldest-first order shows.
 */
function withDatedEntries(text: string): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => l.startsWith("## "));
  if (at < 0) throw new Error("PREMISE: the progress file has a `##` section");
  const entry = (date: string, k: number): string[] => [
    `## ${date} — status entry ${k} added for the roll test`,
    "",
    `- what moved on ${date}: the status of entry ${k}, kept whole by the roll.`,
    "",
  ];
  return [...lines.slice(0, at), ...entry("2026-07-03", 1), ...entry("2026-07-01", 2), ...entry("2026-07-02", 3), ...lines.slice(at)].join("\n");
}

/** The headings of the dated entries withDatedEntries adds. */
const DATED_HEADINGS = ["2026-07-01", "2026-07-02", "2026-07-03"];

/** The rolling fixture variant with dated progress entries too: both rolls run (computed once). */
let BOTH: { inputs: MigrateInputs; plan: MigratePlan } | null = null;
function bothRolls(): { inputs: MigrateInputs; plan: MigratePlan } {
  if (BOTH === null) {
    const inputs = { ...rolling().inputs, progress: enc.encode(withDatedEntries(PROGRESS_TEXT)) };
    BOTH = { inputs, plan: planStateMigrate(inputs) };
  }
  return BOTH;
}

describe("(S10) the progress roll, with its original archived unchanged (plan 38-05 Task 2, D-08, research A9)", () => {
  it("PREMISE: the fixture progress file is over BUDGETS.progressBytes and holds no dated entry", () => {
    expect(enc.encode(PROGRESS_TEXT).length).toBeGreaterThan(BUDGETS.progressBytes);
    expect(PROGRESS_TEXT.split("\n").some((l) => /^## [0-9]{4}-[0-9]{2}-[0-9]{2}/.test(l))).toBe(false);
  });

  it("progress: the dated entries roll to PROGRESS_ARCHIVE_REL oldest first, the standing sections stay, the original moves unchanged to PRE_V3_PROGRESS_REL, and PROGRESS_REL is a new write", () => {
    const { plan } = bothRolls();
    expect(plan.refusals).toEqual([]);
    expect(plan.archiveMoves).toContainEqual({ from: PROGRESS_REL, to: PRE_V3_PROGRESS_REL });
    expect(plan.originals).toContainEqual({ original: PROGRESS_REL, at: PRE_V3_PROGRESS_REL, match: "identical" });
    const progress = writeText(plan, PROGRESS_REL).split("\n");
    const archive = writeText(plan, PROGRESS_ARCHIVE_REL).split("\n");
    for (const d of DATED_HEADINGS) {
      expect(progress.some((l) => l.startsWith(`## ${d}`)), d).toBe(false);
      expect(archive.some((l) => l.startsWith(`## ${d}`)), d).toBe(true);
    }
    const order = DATED_HEADINGS.map((d) => archive.findIndex((l) => l.startsWith(`## ${d}`)));
    expect([...order].sort((a, b) => a - b), "oldest first").toEqual(order);
    for (const h of PROGRESS_TEXT.split("\n").filter((l) => l.startsWith("## "))) expect(progress, h).toContain(h);
    expect(plan.rolls.map((r) => [r.surface, r.outcome.ok])).toEqual([
      ["done", true],
      ["progress", true],
    ]);
    expect(plan.steps.some((s) => s.verb === "archive" && s.from === PROGRESS_REL && s.to === PRE_V3_PROGRESS_REL)).toBe(true);
  });

  it("progress parity: state-roll.js over the split board and the original progress file writes the same four files", () => {
    const { inputs, plan } = bothRolls();
    const rels = [BOARD_REL, BOARD_DONE_ARCHIVE_REL, PROGRESS_REL, PROGRESS_ARCHIVE_REL];
    const r = stateRoll(plan.beforeRoll as Uint8Array, inputs.progress, rels);
    expect(r.status, r.out).toBe(0);
    for (const rel of rels) expect(r.files.get(rel)?.equals(writeBytes(plan, rel) ?? Buffer.alloc(0)), rel).toBe(true);
  });

  it("progress: the proof covers the progress original, its skeleton lines are declared by position, and the plan proves", () => {
    const { inputs, plan } = bothRolls();
    const skeleton = plan.generated.filter((g) => g.kind === "progress-archive-skeleton");
    expect(skeleton.map((g) => [g.rel, g.line])).toEqual([
      [PROGRESS_ARCHIVE_REL, 1],
      [PROGRESS_ARCHIVE_REL, 3],
    ]);
    expect(plan.proof).toEqual({ ok: true });
    expect(proveStateMigrate(inputs, plan, writesOf(plan))).toEqual({ ok: true });
  });

  it("progress: a progress file within budget, or absent, or over budget with no dated entry plans no progress write and no PRE_V3_PROGRESS_REL move", () => {
    const small = enc.encode(["# Progress", "", "## 2026-07-01 a small entry", "", "- one line", ""].join("\n"));
    for (const [what, progress] of [
      ["within budget", small],
      ["absent", null],
      ["over budget with no dated entry (the frozen fixture)", CHESS.progress],
    ] as const) {
      const plan = planStateMigrate({ ...rolling().inputs, progress });
      expect(plan.refusals, what).toEqual([]);
      expect(plan.writes.some((w) => w.rel === PROGRESS_REL || w.rel === PROGRESS_ARCHIVE_REL), what).toBe(false);
      expect(plan.archiveMoves.some((m) => m.from === PROGRESS_REL), what).toBe(false);
      expect(plan.originals.some((o) => o.original === PROGRESS_REL), what).toBe(false);
      expect(plan.proof, what).toEqual({ ok: true });
    }
  });

  it("progress: a progress file that is not valid UTF-8 is not rolled, with one note naming it and state-roll, and the migrate is not refused", () => {
    const bad = concat(enc.encode(withDatedEntries(PROGRESS_TEXT)), new Uint8Array([0xff, 0x0a]));
    const plan = planStateMigrate({ ...rolling().inputs, progress: bad });
    expect(plan.refusals).toEqual([]);
    expect(plan.writes.some((w) => w.rel === PROGRESS_REL)).toBe(false);
    const notes = plan.notes.filter((n) => n.includes("node tools/grugops/state-roll.js"));
    expect(notes, plan.notes.join("\n")).toHaveLength(1);
    expect(notes[0]).toContain(PROGRESS_REL);
  });
});

describe("(S10) a roll the embedded planner refuses is a note, never a migrate refusal (research A6)", () => {
  it("A6: a Done column holding a line that is not a row is not rolled: no refusal, no Done archive, one note naming the reason and state-roll, and overBudget holds the doneRows finding", () => {
    const board = withDoneRows(BOARD_TEXT, 5).replace(/^## Done \(WIP unlimited\)$/m, "## Done (WIP unlimited)\nA line of prose under the Done column.");
    const plan = planStateMigrate(withBoard(board));
    expect(plan.refusals).toEqual([]);
    expect(plan.writes.some((w) => w.rel === BOARD_DONE_ARCHIVE_REL)).toBe(false);
    expect(plan.rolls.some((r) => r.surface === "done")).toBe(false);
    const notes = plan.notes.filter((n) => n.includes("node tools/grugops/state-roll.js"));
    expect(notes, plan.notes.join("\n")).toHaveLength(1);
    expect(notes[0]).toContain("not ticket rows");
    expect(notes[0]).toContain(BOARD_REL);
    expect(plan.overBudget.some((f) => f.key === "doneRows" && f.rel === BOARD_REL)).toBe(true);
    expect(plan.proof).toEqual({ ok: true });
  });
});

describe("(S10) overBudget holds the Done-row and progress-bytes findings over the planned state (D-07)", () => {
  it("the frozen fixture: the progress file is named over BUDGETS.progressBytes with its bytes, its note naming the standing sections; no doneRows finding", () => {
    const f = CHESS_PLAN.overBudget.find((x) => x.key === "progressBytes");
    expect(f?.rel).toBe(PROGRESS_REL);
    expect(f?.measured).toBe(CHESS.progress?.length);
    expect(f?.note ?? "").toContain("standing sections");
    expect(CHESS_PLAN.overBudget.some((x) => x.key === "doneRows")).toBe(false);
  });

  it("after both rolls: the board holds no doneRows finding, and the progress finding measures the rolled progress file", () => {
    const { plan } = bothRolls();
    expect(plan.overBudget.some((x) => x.key === "doneRows")).toBe(false);
    const f = plan.overBudget.find((x) => x.key === "progressBytes");
    expect(f?.measured).toBe(writeBytes(plan, PROGRESS_REL)?.length);
  });
});

describe("(S10) the proof fails, naming the file and line, on every mutation of the rolled outputs", () => {
  it("proof: a progress entry duplicated in the progress archive is named in that file", () => {
    const { inputs, plan } = bothRolls();
    const line = `- what moved on 2026-07-01: the status of entry 2, kept whole by the roll.`;
    const reasons = reasonsOf(proveStateMigrate(inputs, plan, editWritten(writesOf(plan), PROGRESS_ARCHIVE_REL, (t) => `${t}${line}\n`)));
    expect(reasons.some((r) => r.includes(PROGRESS_ARCHIVE_REL) && r.includes("is not a line of")), reasons.join("\n")).toBe(true);
  });

  it("proof: a progress line dropped from the rolled progress file is named by its line in the progress original", () => {
    const { inputs, plan } = bothRolls();
    const text = writeText(plan, PROGRESS_REL);
    const n = text.split("\n").findIndex((l) => l.startsWith("## Standing")) + 1;
    const reasons = reasonsOf(proveStateMigrate(inputs, plan, editWritten(writesOf(plan), PROGRESS_REL, (t) => dropLine(t, n))));
    expect(reasons.some((r) => r.includes(PROGRESS_REL) && r.includes("is in no split output")), reasons.join("\n")).toBe(true);
  });

  it("proof: an altered progress archive skeleton line is named by its file and line", () => {
    const { inputs, plan } = bothRolls();
    const reasons = reasonsOf(
      proveStateMigrate(inputs, plan, editWritten(writesOf(plan), PROGRESS_ARCHIVE_REL, (t) => t.replace("# Progress archive", "# Progress archive (edited)"))),
    );
    expect(reasons.some((r) => r.includes(`line 1 of ${PROGRESS_ARCHIVE_REL}`) && r.includes("progress-archive-skeleton")), reasons.join("\n")).toBe(true);
  });

  it("proof: a rolled Done row dropped from the archive in the two-roll plan is named by its pre-v3 board line", () => {
    const { inputs, plan } = bothRolls();
    const archive = writeText(plan, BOARD_DONE_ARCHIVE_REL).split("\n");
    const n = archive.findIndex((l, i) => i > 0 && l.startsWith("- [ABC-00")) + 1;
    expect(n, "PREMISE: a rolled ABC-00x row").toBeGreaterThan(1);
    const reasons = reasonsOf(proveStateMigrate(inputs, plan, editWritten(writesOf(plan), BOARD_DONE_ARCHIVE_REL, (t) => dropLine(t, n))));
    expect(reasons.some((r) => r.includes(LEGACY_BOARD_REL) && r.includes("is in no split output")), reasons.join("\n")).toBe(true);
  });

  it("proof: a roll whose stage-B outcome is not ok fails the proof with its stage and reason", () => {
    const { inputs, plan } = bothRolls();
    const failed = {
      ...plan,
      rolls: [{ surface: "progress" as const, moved: 3, outcome: { ok: false as const, stage: "rolled-back" as const, reason: "the archive differs" } }],
    };
    const reasons = reasonsOf(proveStateMigrate(inputs, failed, writesOf(plan)));
    expect(reasons.some((r) => r.includes("stage B") && r.includes("rolled-back") && r.includes("the archive differs")), reasons.join("\n")).toBe(true);
  });
});

// ── (S11) the dry-run listing (plan 38-09, MIGRATE-01) ─────────────────────────────────────────────────────────

/** The listing lines printed under `label` (the installer's `  <label padded to 14> <text>` shape), text only. */
function listed(lines: readonly string[], label: string): string[] {
  const head = `  ${label.padEnd(14)} `;
  return lines.filter((l) => l.startsWith(head)).map((l) => l.slice(head.length));
}

/** The commit-order group of one listing line (see migrateListing). */
function groupOf(line: string): number {
  const groups = ["would-move", "would-archive", "would-write|would-append", "would-orphan", "would-split", "would-roll"];
  const label = line.slice(2, 16).trim();
  const g = groups.findIndex((x) => x.split("|").includes(label));
  if (g >= 0) return g;
  if (label === "note") return line.includes("over budget") || line.includes("over a state budget") ? 9 : 6;
  if (label === "would-run") return 7;
  if (label === "would-create") return 8;
  if (label === "dry-run") return 10;
  throw new Error(`a listing line with an unknown label: ${line}`);
}

/** The path a step line leads with: its text up to ` → ` or ` (`. */
function leadPath(text: string): string {
  const arrow = text.indexOf(" → ");
  const paren = text.indexOf(" (");
  return text.slice(0, arrow >= 0 && (paren < 0 || arrow < paren) ? arrow : paren);
}

const CHESS_LISTING = migrateListing(CHESS_PLAN);

describe("(S11) migrateListing: every planned move and split, with bytes (plan 38-09, MIGRATE-01)", () => {
  it("one move line per pre-v3 file, naming its moved path and its bytes", () => {
    const moves = listed(CHESS_LISTING, "would-move");
    for (const f of CHESS.legacy) {
      expect(moves.filter((l) => l.startsWith(`${f.rel} → ${movedRel(f.rel)} (${f.bytes.length} bytes`)), f.rel).toHaveLength(1);
    }
    expect(moves).toHaveLength(CHESS.legacy.length);
  });

  it("one archive line per archive move, with the original's bytes", () => {
    const lines = listed(CHESS_LISTING, "would-archive");
    expect(lines).toHaveLength(CHESS_PLAN.archiveMoves.length);
    for (const m of CHESS_PLAN.archiveMoves) {
      const bytes = legacyBytes(CHESS, m.from.replace(`${STATE_ROOT_REL}/`, `${LEGACY_STATE_ROOT_REL}/`)).length;
      expect(lines.filter((l) => l.startsWith(`${m.from} → ${m.to} (${bytes} bytes`)), m.from).toHaveLength(1);
    }
  });

  it("one write line per new file (an NFR file among them), with its bytes and its source", () => {
    const lines = listed(CHESS_LISTING, "would-write");
    const appendedRels = new Set(CHESS_PLAN.appended.map((a) => a.rel));
    const fresh = CHESS_PLAN.writes.filter((w) => !appendedRels.has(w.rel));
    expect(fresh.some((w) => w.rel.startsWith(`${NFR_DIR_REL}/`)), "PREMISE: the plan writes NFR files").toBe(true);
    for (const w of fresh) {
      expect(lines.filter((l) => l.startsWith(`${w.rel} (${w.bytes.length} bytes; `) && l.includes(w.source)), w.rel).toHaveLength(1);
    }
    expect(lines).toHaveLength(fresh.length);
  });

  it("one append line per ticket that receives Board notes: the bytes added and every board line its notes come from", () => {
    const lines = listed(CHESS_LISTING, "would-append");
    expect(lines).toHaveLength(CHESS_PLAN.appended.length);
    for (const a of CHESS_PLAN.appended) {
      const added = (CHESS_PLAN.writes.find((w) => w.rel === a.rel)?.bytes.length ?? 0) - legacyBytes(CHESS, a.original).length;
      const line = lines.find((l) => l.startsWith(`${a.rel} (${added} bytes`));
      expect(line, `${a.rel}: ${added} bytes added\n${lines.join("\n")}`).toBeDefined();
      for (const c of CHESS_PLAN.cuts.filter((x) => x.noteRel === a.rel)) {
        expect(line, `${a.rel} names board line ${c.boardLine}`).toContain(`line ${c.boardLine} of ${LEGACY_BOARD_REL}`);
      }
    }
  });

  it("D-03: each orphan row is its own line, by ID and board line, in board order", () => {
    const orphanOf = (plan: MigratePlan) => plan.cuts.filter((c) => c.noteRel === PRE_V3_ORPHAN_NOTES_REL);
    expect(orphanOf(CHESS_PLAN), "PREMISE: the fixture has an orphan row").toHaveLength(1);
    // A second orphan: the ticket file of ABC-074 left out, so its row's trailer has no ticket to go to.
    const inputs = { ...CHESS, legacy: CHESS.legacy.filter((f) => f.rel !== ticketRel(CHESS, "ABC-074")) };
    const plan = planStateMigrate(inputs);
    const orphans = orphanOf(plan);
    expect(orphans.length, "PREMISE: two orphan rows").toBe(2);
    const lines = listed(migrateListing(plan), "would-orphan");
    expect(lines).toHaveLength(2);
    orphans.forEach((c, k) => {
      expect(lines[k], lines.join("\n")).toContain(`[${c.id}]`);
      expect(lines[k]).toContain(`line ${c.boardLine} of ${LEGACY_BOARD_REL}`);
      expect(lines[k]).toContain(PRE_V3_ORPHAN_NOTES_REL);
    });
  });

  it("D-04: one line gives the `_Updated:` line count and the bytes of those lines", () => {
    const at = updateLines(BOARD_TEXT);
    expect(at.length, "PREMISE: the fixture board has `_Updated:` lines").toBeGreaterThan(0);
    const raw = BOARD_TEXT.split("\n");
    const bytes = at.reduce((n, i) => n + enc.encode((raw[i - 1] as string).replace(/\r$/, "")).length, 0);
    const lines = listed(CHESS_LISTING, "would-split");
    expect(lines, CHESS_LISTING.join("\n")).toHaveLength(1);
    expect(lines[0]).toContain(`${at.length} \`_Updated:\` line(s)`);
    expect(lines[0]).toContain(`(${bytes} bytes`);
    expect(lines[0]).toContain(PRE_V3_BOARD_UPDATES_REL);
  });

  it("one line per roll surface: nothing rolls on the fixture; the rolling variants name the rows and entries moved", () => {
    const rolls = listed(CHESS_LISTING, "would-roll");
    expect(rolls, CHESS_LISTING.join("\n")).toHaveLength(2);
    expect(rolls[0]).toContain(`the Done column of ${BOARD_REL}`);
    expect(rolls[0]).toContain("nothing rolls");
    expect(rolls[1]).toContain(PROGRESS_REL);
    expect(rolls[1]).toContain("nothing rolls");
    const { plan } = bothRolls();
    const both = listed(migrateListing(plan), "would-roll");
    const moved = doneRowCount(dec.decode(plan.beforeRoll ?? new Uint8Array())) - BUDGETS.doneRows;
    expect(both[0]).toContain(`${moved} Done row(s)`);
    expect(both[0]).toContain(BOARD_DONE_ARCHIVE_REL);
    expect(both[1]).toContain(`${DATED_HEADINGS.length} dated progress entry(ies)`);
    expect(both[1]).toContain(PROGRESS_ARCHIVE_REL);
  });

  it("a roll the embedded planner refuses is its one roll line, saying it is not rolled and why", () => {
    const board = withDoneRows(BOARD_TEXT, 5).replace(/^## Done \(WIP unlimited\)$/m, "## Done (WIP unlimited)\nA line of prose under the Done column.");
    const rolls = listed(migrateListing(planStateMigrate(withBoard(board))), "would-roll");
    expect(rolls).toHaveLength(2);
    expect(rolls[0]).toContain(`the Done column of ${BOARD_REL}: not rolled (`);
    expect(rolls[0]).toContain("not ticket rows");
  });

  it("the render line, the marker line, one line per over-budget finding, and last the line that nothing was written", () => {
    const run = listed(CHESS_LISTING, "would-run");
    expect(run).toHaveLength(1);
    expect(run[0]).toContain("cannot be previewed");
    expect(listed(CHESS_LISTING, "would-create").filter((l) => l.startsWith(LAYOUT_MARKER_REL))).toHaveLength(1);
    const over = listed(CHESS_LISTING, "note").filter((l) => l.startsWith("over budget: "));
    expect(over).toEqual(CHESS_PLAN.overBudget.map((f) => `over budget: ${formatFinding(f)}`));
    expect(CHESS_LISTING.at(-1)).toContain("nothing was written");
  });

  it("commit order: moves, archive moves, writes, the splits and rolls, notes, render, marker, budgets; paths in code-unit order within a group", () => {
    for (const listing of [CHESS_LISTING, migrateListing(bothRolls().plan)]) {
      const groups = listing.map(groupOf);
      for (let k = 1; k < groups.length; k++) {
        expect(groups[k] as number, `${listing[k - 1]}\n${listing[k]}`).toBeGreaterThanOrEqual(groups[k - 1] as number);
      }
      for (const labels of [["would-move"], ["would-archive"], ["would-write", "would-append"]]) {
        const paths = listing.filter((l) => labels.includes(l.slice(2, 16).trim())).map((l) => leadPath(l.slice(17)));
        expect(paths, labels.join("|")).toEqual([...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
      }
    }
  });

  it("deterministic: two calls on one plan, and a second plan of the same inputs, give the same lines", () => {
    expect(migrateListing(CHESS_PLAN)).toEqual(CHESS_LISTING);
    expect(migrateListing(planStateMigrate(chessInputs()))).toEqual(CHESS_LISTING);
  });

  it("a ticket file name carrying ESC is listed without it", () => {
    const rel = ticketRel(CHESS, "ABC-074");
    const escaped = rel.replace("ABC-074-", "ABC-074-\x1b[31m-");
    const inputs = withFile({ ...CHESS, legacy: CHESS.legacy.filter((f) => f.rel !== rel) }, escaped, legacyBytes(CHESS, rel));
    const plan = planStateMigrate(inputs);
    expect(plan.refusals).toEqual([]);
    const listing = migrateListing(plan);
    expect(listing.filter((l) => /[\x00-\x1f\x7f-\x9f]/.test(l))).toEqual([]);
    const shownRel = movedRel(escaped).replace("\x1b", "");
    expect(listed(listing, "would-move").some((l) => l.includes(shownRel))).toBe(true);
    expect(listed(listing, "would-append").some((l) => l.startsWith(shownRel))).toBe(true);
  });

  it("a ticket ID and a path carrying ESC in a plan are listed without it", () => {
    const first = CHESS_PLAN.steps[0];
    if (first === undefined) throw new Error("PREMISE: the plan has steps");
    const plan: MigratePlan = {
      ...CHESS_PLAN,
      notes: [...CHESS_PLAN.notes, "the row of ABC-1\x1b[2J at line 3 has no ticket file"],
      steps: [{ ...first, to: `${first.to}\x1b]0;title\x07` }, ...CHESS_PLAN.steps.slice(1)],
    };
    const listing = migrateListing(plan);
    expect(listing.filter((l) => /[\x00-\x1f\x7f-\x9f]/.test(l))).toEqual([]);
    expect(listing.some((l) => l.includes("ABC-1[2J at line 3"))).toBe(true);
    expect(listing.some((l) => l.includes(`${first.to}]0;title`))).toBe(true);
  });
});

describe("(S12) the context archive selection (plan 38-10, MIGRATE-06, D-14, D-20, D-22)", () => {
  const dir = (name: string): ContextFolder => ({ name, kind: "directory" });
  const inputs = (folders: readonly ContextFolder[], over: Partial<ContextArchiveInputs> = {}): ContextArchiveInputs => ({
    folders,
    knownIds: new Set(["ABC-104", "ABC-105", "ABC-200"]),
    doneIds: new Set(["ABC-104", "ABC-105"]),
    queue: { pending: [], claimed: [] },
    archived: new Set<string>(),
    ...over,
  });
  const reasonOf = (input: ContextArchiveInputs, name: string): string | undefined =>
    planContextArchive(input).kept.find((k) => k.name === name)?.reason;

  it("the name rule: abc-104-implement and ABC-104 name ABC-104; abc-1041 and xabc-104 do not", () => {
    const known = ["ABC-104"];
    expect(folderTicketIds("abc-104-implement", known)).toEqual(["ABC-104"]);
    expect(folderTicketIds("ABC-104", known)).toEqual(["ABC-104"]);
    expect(folderTicketIds("qe.ABC-104_a2", known)).toEqual(["ABC-104"]);
    expect(folderTicketIds("abc-1041", known)).toEqual([]);
    expect(folderTicketIds("xabc-104", known)).toEqual([]);
    expect(folderTicketIds("abc104", known), "an ID written without its hyphen names nothing").toEqual([]);
    expect(folderTicketIds("abc-1041-and-abc-104", known), "a later delimited occurrence still matches").toEqual(["ABC-104"]);
  });

  it("a folder naming one Done ID, and a folder naming two IDs that are both Done, move with their IDs", () => {
    const plan = planContextArchive(inputs([dir("pair-ABC-105-ABC-104"), dir("scribe-ABC-104")]));
    expect(plan.moves).toEqual([
      { name: "pair-ABC-105-ABC-104", ids: ["ABC-104", "ABC-105"] },
      { name: "scribe-ABC-104", ids: ["ABC-104"] },
    ]);
    expect(plan.kept).toEqual([]);
  });

  it("keeps a folder naming no ID, a ticket that is not Done, or two IDs of which one is not Done", () => {
    const input = inputs([dir("security-nfr-public-repo"), dir("bapm-ABC-200"), dir("pair-ABC-104-ABC-200"), dir("abc104")]);
    expect(planContextArchive(input).moves).toEqual([]);
    expect(reasonOf(input, "security-nfr-public-repo")).toBe("no-ticket-id");
    expect(reasonOf(input, "abc104")).toBe("no-ticket-id");
    expect(reasonOf(input, "bapm-ABC-200")).toBe("not-done");
    expect(reasonOf(input, "pair-ABC-104-ABC-200")).toBe("not-done");
    expect(planContextArchive(input).kept.find((k) => k.name === "pair-ABC-104-ABC-200")?.why).toContain("ABC-200");
  });

  it("D-22: a pending or a claimed queue entry keeps the folder; an entry of another name does not", () => {
    const folders = [dir("scribe-ABC-104"), dir("qe-ABC-105")];
    const pending = inputs(folders, { queue: { pending: ["scribe-ABC-104.md", "other-task.md"], claimed: [] } });
    expect(reasonOf(pending, "scribe-ABC-104")).toBe("queued");
    expect(planContextArchive(pending).kept.find((k) => k.name === "scribe-ABC-104")?.why).toContain(`${QUEUE_PENDING_REL}/scribe-ABC-104.md`);
    expect(planContextArchive(pending).moves.map((m) => m.name)).toEqual(["qe-ABC-105"]);
    const claimed = inputs(folders, { queue: { pending: [], claimed: ["qe-ABC-105"] } });
    expect(reasonOf(claimed, "qe-ABC-105")).toBe("queued");
    expect(planContextArchive(claimed).kept.find((k) => k.name === "qe-ABC-105")?.why).toContain(`${QUEUE_CLAIMED_REL}/qe-ABC-105`);
    expect(planContextArchive(claimed).moves.map((m) => m.name)).toEqual(["scribe-ABC-104"]);
  });

  it("keeps a folder whose archive path exists, a link, a regular file, a special file and a name outside the task-name rule", () => {
    const input = inputs(
      [
        dir("scribe-ABC-104"),
        { name: "link-ABC-104", kind: "symbolic link" },
        { name: "file-ABC-104", kind: "regular file" },
        { name: "fifo-ABC-104", kind: "special file" },
        dir("bad name ABC-104"),
        dir(".."),
      ],
      { archived: new Set(["scribe-ABC-104"]) },
    );
    expect(planContextArchive(input).moves).toEqual([]);
    expect(reasonOf(input, "scribe-ABC-104")).toBe("archived");
    expect(planContextArchive(input).kept.find((k) => k.name === "scribe-ABC-104")?.why).toContain(`${CONTEXT_ARCHIVE_REL}/scribe-ABC-104`);
    expect(reasonOf(input, "link-ABC-104")).toBe("not-a-directory");
    expect(reasonOf(input, "file-ABC-104")).toBe("not-a-directory");
    expect(reasonOf(input, "fifo-ABC-104")).toBe("not-a-directory");
    expect(TASK_NAME_RE.test("bad name ABC-104"), "PREMISE: a space is outside the task-name rule").toBe(false);
    expect(reasonOf(input, "bad name ABC-104")).toBe("name-rule");
    expect(reasonOf(input, "..")).toBe("name-rule");
    for (const k of planContextArchive(input).kept) expect(k.why, k.name).not.toBe("");
  });

  it("every folder is moved or kept exactly once, in code-unit order of the names", () => {
    const names = ["b-ABC-104", "B-ABC-105", "a-ABC-200", "_x", "Z"];
    const plan = planContextArchive(inputs(names.map(dir)));
    const all = [...plan.moves.map((m) => m.name), ...plan.kept.map((k) => k.name)];
    expect([...all].sort()).toEqual([...names].sort());
    const byUnits = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
    expect(plan.moves.map((m) => m.name)).toEqual(plan.moves.map((m) => m.name).sort(byUnits));
    expect(plan.kept.map((k) => k.name)).toEqual(plan.kept.map((k) => k.name).sort(byUnits));
  });

  it("contextTicketIds: known IDs are every board ticket row, every Done-archive row and each ticket file's leading ID; Done IDs are the Done columns and the archive", () => {
    const board = [
      "# Board",
      "",
      "## In Review (WIP 1/3)",
      "- [ABC-200] Not finished  (owner: x)",
      "",
      "## Done (WIP unlimited)",
      "- [ABC-104] Finished  (merged: 2026-10-01)",
      "- [EPIC-007] An epic, not a ticket  (owner: x)",
      "",
    ].join("\n");
    const archive = ["# Done archive", "", "## Done (WIP unlimited)", "- [ABC-010] Rolled earlier  (merged: 2026-01-01)", ""].join("\n");
    const ids = contextTicketIds(board, archive, ["ABC-300-a-ticket-file.md", "ABC-301.md", "notes.md", "ABC-3011x.md"]);
    expect([...ids.known].sort()).toEqual(["ABC-010", "ABC-104", "ABC-200", "ABC-300", "ABC-301", "ABC-3011"]);
    expect([...ids.done].sort()).toEqual(["ABC-010", "ABC-104"]);
    expect([...contextTicketIds(board, null, []).done]).toEqual(["ABC-104"]);
  });

  it("contextTicketIds: a ticket rolled to the Done archive and then reopened (a row in a non-Done column) is not Done, so its folder stays", () => {
    const board = ["# Board", "", "## In Progress (WIP 1/3)", "- [ABC-5] Reopened  (owner: x)", "", "## Done (WIP unlimited)", ""].join("\n");
    const archive = ["# Done archive", "", "## Done (WIP unlimited)", "- [ABC-5] Rolled earlier  (merged: 2026-01-01)", ""].join("\n");
    const ids = contextTicketIds(board, archive, []);
    expect(ids.known.has("ABC-5")).toBe(true);
    expect(ids.done.has("ABC-5")).toBe(false);
    const plan = planContextArchive({
      folders: [{ name: "abc-5-work", kind: "directory" }],
      knownIds: ids.known,
      doneIds: ids.done,
      queue: { pending: [], claimed: [] },
      archived: new Set<string>(),
    });
    expect(plan.moves).toEqual([]);
    expect(plan.kept.map((k) => [k.name, k.reason])).toEqual([["abc-5-work", "not-done"]]);
  });

  it("migratedContextTicketIds on the fixture: the planned board's Done rows are Done, ABC-209 (In Review) is known and not Done", () => {
    const ids = migratedContextTicketIds(CHESS, CHESS_PLAN);
    expect(ids.known.has("ABC-209")).toBe(true);
    expect(ids.done.has("ABC-209")).toBe(false);
    const doneRows = parseBoard(writeText(CHESS_PLAN, BOARD_REL)).columns.filter((c) => c.name === "Done").flatMap((c) => c.rows);
    const doneTickets = doneRows.map((r) => r.id).filter((id) => id.startsWith("ABC-"));
    expect(doneTickets.length, "PREMISE: the fixture's Done column holds ticket rows").toBeGreaterThan(0);
    for (const id of doneTickets) expect(ids.done.has(id), id).toBe(true);
  });

  it("migrateListing with the selection: one line per folder, moved or kept with its reason, in code-unit order of the names, before the render line", () => {
    const selection = planContextArchive(
      inputs([dir("scribe-ABC-104"), dir("security-nfr-public-repo"), dir("bapm-ABC-200"), { name: "link-ABC-105", kind: "symbolic link" }]),
    );
    const listing = migrateListing(CHESS_PLAN, selection);
    const moved = listed(listing, "context-move");
    const kept = listed(listing, "context-keep");
    expect(moved).toEqual([`${CONTEXT_REL}/scribe-ABC-104 → ${CONTEXT_ARCHIVE_REL}/scribe-ABC-104 (unchanged; it names ABC-104, each Done)`]);
    expect(kept).toHaveLength(3);
    for (const k of selection.kept) {
      expect(kept.filter((l) => l === `${CONTEXT_REL}/${k.name} stays: ${k.why}`), k.name).toHaveLength(1);
    }
    const folderLines = listing.filter((l) => /^ {2}context-(move|keep) /.test(l));
    const names = folderLines.map((l) => (l.slice(17).split(" ")[0] as string).slice(CONTEXT_REL.length + 1));
    expect(names).toEqual(["bapm-ABC-200", "link-ABC-105", "scribe-ABC-104", "security-nfr-public-repo"]);
    const run = listing.findIndex((l) => l.startsWith("  would-run "));
    const last = listing.findIndex((l) => l === folderLines.at(-1));
    expect(last, "the folder lines come before the render line").toBeLessThan(run);
    expect(listed(listing, "note").filter((l) => l.startsWith("context archive: "))).toEqual([
      `context archive: 1 folder(s) would move to ${CONTEXT_ARCHIVE_REL}/, 3 would stay in ${CONTEXT_REL}/`,
    ]);
  });

  it("without the selection, migrateListing names no context folder", () => {
    expect(migrateListing(CHESS_PLAN).filter((l) => l.includes(CONTEXT_REL))).toEqual([]);
  });

  it("a kept name carrying ESC is listed without it", () => {
    const selection = planContextArchive(inputs([dir("bad\x1b[31m-ABC-104")]));
    expect(selection.kept.map((k) => k.reason)).toEqual(["name-rule"]);
    const listing = migrateListing(CHESS_PLAN, selection);
    expect(listing.filter((l) => /[\x00-\x1f\x7f-\x9f]/.test(l))).toEqual([]);
    expect(listed(listing, "context-keep").some((l) => l.startsWith(`${CONTEXT_REL}/bad[31m-ABC-104 stays: `))).toBe(true);
  });
});
