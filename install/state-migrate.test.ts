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
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BOARD_REL,
  LEGACY_BOARD_REL,
  LEGACY_STATE_ROOT_REL,
  PRE_V3_BOARD_REL,
  PRE_V3_TICKETS_REL,
  STATE_ROOT_REL,
  TICKETS_REL,
} from "./state-layout.js";
import { PRE_V3_CHESS_DIR } from "./installer-paths.test-support.js";
import {
  BOARD_NOTES_HEADING,
  MIGRATE_GENERATED_LINE_KINDS,
  cutRow,
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
  const seed = join(ROOT, "agent-factory", "seed", "memory-bank", "plans");
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

/** The inputs with the legacy files under `rel` removed. */
function without(inputs: MigrateInputs, rel: string): MigrateInputs {
  return { ...inputs, legacy: inputs.legacy.filter((f) => f.rel !== rel) };
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

  it("(S5) no import or export line of install/state-migrate.ts names scripts/", () => {
    const src = readFileSync(join(import.meta.dirname, "state-migrate.ts"), "utf8");
    const edges = src.split("\n").filter((l) => /^\s*(import|export)\b.*\bfrom\b/.test(l));
    expect(edges.length, "PREMISE: the module imports the state-layout constants").toBeGreaterThan(0);
    expect(edges.filter((l) => l.includes("scripts/"))).toEqual([]);
    expect(edges.filter((l) => !l.includes('"./state-layout.js"') && !l.includes('"node:'))).toEqual([]);
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

// Keep the shared helpers referenced while Task 2's cases are not yet written.
void withFile;
void without;
void enc;
