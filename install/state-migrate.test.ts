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
//   (S7) the board split, the refusals, the budgets and every proof failure (plan 38-02 Task 2).
//
// The planner does no I/O, so these cases read the fixture once and pass its bytes in. A shape the fixture lacks
// (CRLF, a byte-order mark, an orphan of its own, invalid UTF-8) is made here by mutating a copy of the inputs, never
// by editing the fixture (D-15). Clear professional voice: this module guards the first grugops operation that
// rewrites user state.

import { describe, expect, it } from "vitest";
import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BOARD_REL,
  BUDGETS,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  PRE_V3_BOARD_REL,
  PRE_V3_BOARD_UPDATES_REL,
  PRE_V3_ORPHAN_NOTES_REL,
  PRE_V3_TICKETS_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
} from "./state-layout.js";
import { PRE_V3_CHESS_DIR } from "./installer-paths.test-support.js";
import {
  BOARD_NOTES_HEADING,
  BOARD_UPDATES_TITLE,
  MIGRATE_GENERATED_LINE_KINDS,
  ORPHAN_NOTES_TITLE,
  cutRow,
  normalizeDocument,
  parseBoard,
  sortFindings,
  stripHtmlComments,
  movedRel,
  planStateMigrate,
  proveStateMigrate,
  provenanceLine,
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
    expect([...MIGRATE_GENERATED_LINE_KINDS]).toEqual(["board-notes-heading", "provenance", "updates-title", "orphan-title", "orphan-heading"]);
    expect(Object.isFrozen(MIGRATE_GENERATED_LINE_KINDS)).toBe(true);
    const kinds = new Set(CHESS_PLAN.generated.map((g) => g.kind));
    for (const k of MIGRATE_GENERATED_LINE_KINDS) expect(kinds, k).toContain(k);
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

