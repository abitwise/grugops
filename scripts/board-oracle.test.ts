// board-oracle.test.ts — THE BOARD GRAMMAR UNDER A SEVEN-AXIS CROSS PRODUCT (plan 32-04, DASH-02).
//
// WHAT THIS FILE IS, AND WHY IT TRANSCRIBES NO EXPECTED OUTPUT.
//
// `scripts/board-corpus.test.ts` replays shapes that EXIST — 141 measured rows and the mutations
// derived from the contract's refusal rules. This file sweeps shapes that DO NOT: every combination
// of seven axes whose levels are each traceable to a shape `agent-factory/contracts/board.md` names.
// 18,144 documents is far past the number anybody reads, so the sweep asserts PROPERTIES OF THE
// ANSWER rather than a transcription of it. A transcribed expectation per cell would be 18,144 lines
// nobody checks and a generator change would rewrite them all to agree with whatever the parser then
// did.
//
// THE FIVE INVARIANTS ARE PLAN 32-02'S, SPELLED THE SAME WAY. `scripts/board-model.test.ts` asserts
// I1 through I5 over four real documents; this file asserts the same five claims, worded the same
// way, over the generated set. Where that file derives a denominator independently of the parse
// loop, this one does too.
//
// THE INDEPENDENT SCANNER IS RE-IMPLEMENTED HERE ON PURPOSE. Two implementations where only one
// ships is the property that makes the counts evidence; a shared helper would make them one. The
// re-implementation is guarded rather than trusted: a case below asserts this file's blanker agrees
// with the shipped `stripHtmlComments` on every one of the 18,144 generated documents, so a drifted
// copy fails by name instead of quietly weakening every invariant beneath it.
//
// A VACUITY FLOOR CATCHES AN EMPTY DENOMINATOR AND HAS NEVER CAUGHT A SILENTLY SHORT ONE. That is
// `scripts/section-locator-oracle.test.ts`'s recorded scar, inherited here in full: the cell count is
// asserted THREE ways (the product of the pinned axis lengths, a counter the generation loop
// increments, and the generated array's own length), every axis label is asserted reached by at
// least one cell, and every invariant sweep derives its own denominator from the loop that consumed
// the corpus rather than reading it off the array.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { boardColumnName, parseBoard, stripHtmlComments } from "./board-model.js";
import type { BoardModel } from "./board-model.js";

const ROOT = join(import.meta.dirname, "..");

// ── The axes ─────────────────────────────────────────────────────────────────────────────────────

const AXIS_KEYS = ["comment", "suffix", "tail", "id", "gap", "updated", "position"] as const;

type AxisKey = (typeof AXIS_KEYS)[number];

/** The mini-board every comment level carries, so a failed pre-pass has something to promote. */
const MINI_HEADING = "## In Development (WIP 1/3)";
const MINI_ROW = "- [ABC-777] a documented example, never live state";

/**
 * Axis 1 — the comment span.
 *
 * `indent` is what the mini-board carries inside the comment. The un-indented level is the one
 * research measured as the ONLY input that separates a working comment pre-pass from a no-op, and
 * the unterminated level is the contract's fail-closed direction: the opener blanks to end of file.
 */
const AXIS_COMMENT = [
  { label: "no comment at all", kind: "absent" },
  { label: "a four-space-indented mini-board inside a closed comment", kind: "indented" },
  { label: "an UN-INDENTED mini-board inside a closed comment", kind: "unindented" },
  { label: "an opener that never closes, above an un-indented mini-board", kind: "unterminated" },
] as const;

/** Axis 2 — the heading's suffix. Three are legal; four are named refusals. */
const AXIS_HEADING_SUFFIX = [
  { label: "the limited form", spell: "## Done (WIP 1/3)" },
  { label: "the unlimited form", spell: "## Done (WIP unlimited)" },
  { label: "the blocked form", spell: "## Blocked (visible, time-tracked)" },
  { label: "the old specification's parenthesised count", spell: "## Blocked (2)" },
  { label: "a parenthesised section reference", spell: "## Columns (spec §6.1)" },
  { label: "a bare level-two heading", spell: "## Conventions" },
  { label: "a third-level heading", spell: "### Done (WIP 1/3)" },
] as const;

/** Axis 3 — what the row's parenthetical does. */
const AXIS_ROW_TAIL = [
  { label: "a parenthetical that closes at end of line", spell: "(owner: BA/PM, size: M)" },
  { label: "a parenthetical followed by trailing prose", spell: "(owner: BA/PM, size: M)  — merged 2026-06-06" },
  { label: "no parenthetical at all", spell: "" },
  { label: "a parenthetical that never closes", spell: "(owner: BA/PM, size: M" },
] as const;

/** Axis 4 — the bracketed identifier. Three are legal; three are named refusals or divergences. */
const AXIS_ID = [
  { label: "a conforming ticket identifier", spell: "ABC-014" },
  { label: "an epic identifier", spell: "EPIC-006" },
  { label: "a feature identifier", spell: "FEAT-002" },
  { label: "a lowercase identifier", spell: "abc-014" },
  { label: "an identifier with no dash", spell: "ABC014" },
  { label: "an identifier whose prefix is not the configured one", spell: "XYZ-014" },
] as const;

/** Axis 5 — the gap between the title and the parenthetical. */
const AXIS_GAP = [
  { label: "two spaces, the gap the contract names", spell: "  " },
  { label: "one space", spell: " " },
  { label: "one tab", spell: "\t" },
] as const;

/** Axis 6 — the update line in the header region. */
const AXIS_UPDATED = [
  { label: "a canonical update line", spell: "_Updated: 2026-09-14 by Orchestrator" },
  { label: "the kit board's own placeholder", spell: "_Updated: <ISO date> by <role>_" },
  { label: "no update line", spell: null },
] as const;

/** Axis 7 — where the row sits relative to the heading. */
const AXIS_POSITION = [
  { label: "before the first heading", kind: "preColumn" },
  { label: "directly beneath the heading under test", kind: "inSection" },
  { label: "inside a `## Notes (...)` non-column section below the heading", kind: "inNotes" },
] as const;

/**
 * The pinned cell count.
 *
 * 4 x 7 x 4 x 6 x 3 x 3 x 3. Asserted three ways below. Reducing an axis is a decision recorded in
 * this docblock, never a silently dropped level.
 */
const EXPECTED_CELLS = 18144;

type Labels = Record<AxisKey, string>;

type Cell = {
  readonly labels: Labels;
  readonly text: string;
};

// ── The generator ────────────────────────────────────────────────────────────────────────────────

function buildCorpus(): { readonly cells: readonly Cell[]; readonly counted: number } {
  const cells: Cell[] = [];
  let counted = 0;

  for (const comment of AXIS_COMMENT) {
    for (const suffix of AXIS_HEADING_SUFFIX) {
      for (const tail of AXIS_ROW_TAIL) {
        for (const id of AXIS_ID) {
          for (const gap of AXIS_GAP) {
            for (const updated of AXIS_UPDATED) {
              for (const position of AXIS_POSITION) {
                const row =
                  tail.spell === ""
                    ? `- [${id.spell}] Asset allocation chart`
                    : `- [${id.spell}] Asset allocation chart${gap.spell}${tail.spell}`;

                const lines: string[] = ["# Board"];
                if (updated.spell !== null) lines.push(updated.spell);

                if (comment.kind === "indented") {
                  lines.push("<!--", `    ${MINI_HEADING}`, `    ${MINI_ROW}`, "-->");
                } else if (comment.kind === "unindented") {
                  lines.push("<!--", MINI_HEADING, MINI_ROW, "-->");
                } else if (comment.kind === "unterminated") {
                  lines.push("<!--", MINI_HEADING, MINI_ROW);
                }

                if (position.kind === "preColumn") {
                  lines.push(row, suffix.spell);
                } else if (position.kind === "inSection") {
                  lines.push(suffix.spell, row);
                } else {
                  lines.push(suffix.spell, "## Notes (bootstrap, 2026-06-05)", row);
                }

                cells.push({
                  labels: {
                    comment: comment.label,
                    suffix: suffix.label,
                    tail: tail.label,
                    id: id.label,
                    gap: gap.label,
                    updated: updated.label,
                    position: position.label,
                  },
                  text: lines.join("\n"),
                });
                counted += 1;
              }
            }
          }
        }
      }
    }
  }

  return { cells, counted };
}

const CORPUS = buildCorpus();

/** A failing cell names EVERY axis value that produced it, so a failure says WHICH cell regressed. */
function nameCell(cell: Cell): string {
  return AXIS_KEYS.map((k) => `${k}=${cell.labels[k]}`).join(" | ");
}

// ── The independent scanner ──────────────────────────────────────────────────────────────────────

/**
 * Blank every `<!-- ... -->` span, preserving newlines — written as a CHARACTER STATE MACHINE.
 *
 * The module under test scans with `indexOf`. This one walks bytes and toggles a flag. Neither shape
 * can be a transcription of the other, which is the only property that makes the counts derived from
 * it independent evidence. A case below asserts the two agree on every generated cell.
 */
function blankIndependently(text: string): string {
  let out = "";
  let inside = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (!inside && text.startsWith("<!--", i)) inside = true;
    out += ch === "\n" ? "\n" : inside ? " " : ch;
    if (inside && i >= 2 && text.startsWith("-->", i - 2)) inside = false;
  }
  return out;
}

/** A legal row's shape, spelled here so the scanner does not borrow the module's own pattern. */
const ORACLE_ROW = /^- \[([^\]]{1,64})\] /;
const ORACLE_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;

type Scan = {
  readonly rawLines: readonly string[];
  readonly commented: ReadonlySet<number>;
  readonly blankOrHeading: number;
  readonly columnHeadings: number;
  readonly legalRows: readonly number[];
  readonly legalRowsInColumn: readonly number[];
};

/** Classify every line of `text` WITHOUT calling `parseBoard`. */
function scanIndependently(text: string): Scan {
  const normalized = text.split("\r\n").join("\n");
  const rawLines = normalized.split("\n");
  const blanked = blankIndependently(normalized).split("\n");

  const commented = new Set<number>();
  const legalRows: number[] = [];
  const legalRowsInColumn: number[] = [];
  let blankOrHeading = 0;
  let columnHeadings = 0;
  let inColumn = false;

  for (let i = 0; i < blanked.length; i++) {
    const line = blanked[i] as string;
    const lineNo = i + 1;

    if ((rawLines[i] as string).trim() !== "" && line.trim() === "") commented.add(lineNo);

    if (line.startsWith("## ")) {
      blankOrHeading += 1;
      if (boardColumnName(line) === null) {
        inColumn = false;
      } else {
        inColumn = true;
        columnHeadings += 1;
      }
      continue;
    }
    if (line.trim() === "") {
      blankOrHeading += 1;
      continue;
    }

    const row = ORACLE_ROW.exec(line);
    if (row !== null && ORACLE_ID.test(row[1] as string)) {
      legalRows.push(lineNo);
      if (inColumn) legalRowsInColumn.push(lineNo);
    }
  }

  return { rawLines, commented, blankOrHeading, columnHeadings, legalRows, legalRowsInColumn };
}

/** Every line number the model claims as a parsed entity of the board's live state. */
function parsedEntityLines(model: BoardModel): number[] {
  return [
    ...model.columns.map((c) => c.line),
    ...model.columns.flatMap((c) => c.rows.map((r) => r.line)),
    ...model.epicRows.map((r) => r.line),
    ...model.updates.map((u) => u.line),
  ];
}

/** Parsed once, shared by every sweep, so 18,144 documents are parsed once rather than six times. */
type Measured = { readonly cell: Cell; readonly model: BoardModel; readonly scan: Scan };
const MEASURED: readonly Measured[] = CORPUS.cells.map((cell) => ({
  cell,
  model: parseBoard(cell.text),
  scan: scanIndependently(cell.text),
}));

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the corpus is DERIVED and COUNTED.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-model under a seven-axis parse oracle (plan 32-04, DASH-02)", () => {
  it("pins every axis length and derives the cell count THREE ways", () => {
    expect(AXIS_COMMENT.length, "axis 1 — the comment span").toBe(4);
    expect(AXIS_HEADING_SUFFIX.length, "axis 2 — the heading suffix").toBe(7);
    expect(AXIS_ROW_TAIL.length, "axis 3 — the row's parenthetical").toBe(4);
    expect(AXIS_ID.length, "axis 4 — the bracketed identifier").toBe(6);
    expect(AXIS_GAP.length, "axis 5 — the gap before the parenthetical").toBe(3);
    expect(AXIS_UPDATED.length, "axis 6 — the update line").toBe(3);
    expect(AXIS_POSITION.length, "axis 7 — the row's position").toBe(3);
    expect(AXIS_KEYS.length, "the axis keys must match the number of axes").toBe(7);

    // DERIVATION ONE — the product of the pinned lengths.
    const product =
      AXIS_COMMENT.length *
      AXIS_HEADING_SUFFIX.length *
      AXIS_ROW_TAIL.length *
      AXIS_ID.length *
      AXIS_GAP.length *
      AXIS_UPDATED.length *
      AXIS_POSITION.length;
    expect(product, "the product of the seven pinned axis lengths").toBe(EXPECTED_CELLS);

    // DERIVATION TWO — a counter the generation loop incremented, computed without reading the
    // array. A generator that silently produced fewer cells fails here rather than reporting a
    // clean sweep over a smaller denominator.
    expect(CORPUS.counted, "the cells the generation loop actually emitted").toBe(product);

    // DERIVATION THREE — the generated array's own length.
    expect(CORPUS.cells.length, "the generated array's own length, a third witness").toBe(product);
  });

  it("reaches every declared label of every axis, and declares every label reached", () => {
    const declared: Record<AxisKey, readonly string[]> = {
      comment: AXIS_COMMENT.map((a) => a.label),
      suffix: AXIS_HEADING_SUFFIX.map((a) => a.label),
      tail: AXIS_ROW_TAIL.map((a) => a.label),
      id: AXIS_ID.map((a) => a.label),
      gap: AXIS_GAP.map((a) => a.label),
      updated: AXIS_UPDATED.map((a) => a.label),
      position: AXIS_POSITION.map((a) => a.label),
    };
    for (const key of AXIS_KEYS) {
      const seen = new Set(CORPUS.cells.map((c) => c.labels[key]));
      expect(
        [...seen].sort(),
        `axis ${key} — a total that stays healthy while one axis silently contributes one level is ` +
          "the silently-short shape a bare count cannot see",
      ).toEqual([...declared[key]].sort());
    }
  });

  it("generates documents distinct enough to be a sweep rather than one measurement repeated", () => {
    const texts = new Set(CORPUS.cells.map((c) => c.text));
    // The `no parenthetical at all` level drops the gap from the row, so its three gap cells collapse
    // onto one document by construction. That collapse is expected, which is exactly why the distinct
    // count is asserted as a NUMBER rather than assumed to equal the cell count. Measured at plan
    // 32-04 and pinned: a generator that started emitting one document fails here and not only at a
    // coverage floor.
    expect(texts.size, "distinct documents in the generated corpus").toBe(15120);
  });

  it("PREMISE: the independent blanker agrees with the shipped stripper on EVERY cell", () => {
    let compared = 0;
    const disagreements: string[] = [];
    for (const m of MEASURED) {
      compared += 1;
      const normalized = m.cell.text.split("\r\n").join("\n");
      if (blankIndependently(normalized) !== stripHtmlComments(normalized)) {
        disagreements.push(nameCell(m.cell));
      }
    }
    expect(compared, "cells the comparison loop actually walked").toBe(EXPECTED_CELLS);
    expect(
      disagreements.slice(0, 3),
      "the invariants below derive their denominators from the independent blanker. A drifted copy " +
        "must fail here by name rather than quietly weaken every one of them",
    ).toEqual([]);
  });

  it("PREMISE: the corpus reaches the edges the invariants are about, asserted rather than assumed", () => {
    const withComment = MEASURED.filter((m) => m.scan.commented.size > 0).length;
    const withColumns = MEASURED.filter((m) => m.model.columns.length > 0).length;
    const withRows = MEASURED.filter(
      (m) => m.model.columns.some((c) => c.rows.length > 0) || m.model.epicRows.length > 0,
    ).length;
    const withUnparsed = MEASURED.filter((m) => m.model.unparsed.length > 0).length;
    const withUpdates = MEASURED.filter((m) => m.model.updates.length > 0).length;
    const withSections = MEASURED.filter((m) => m.model.nonColumnSections.length > 0).length;

    // EVERY NUMBER BELOW IS MEASURED AND THEN DERIVED BY HAND, so a pin that moves is read as a
    // corpus-shape change rather than adjusted until the case passes. `legal id` is four of the six
    // identifier levels, not three: `XYZ-014` conforms to the identifier SHAPE and is refused only by
    // the prefix clause, which the pure grammar cannot enforce — the divergence
    // `scripts/board-corpus.ts` records as `ctl-id-disagreeing-prefix`.
    //
    //   withComment   3 of 4 comment levels carry a span                    18144 x 3/4      = 13608
    //   withColumns   3 comment levels x 3 legal suffixes x 648             9 x 648          =  5832
    //   withRows      + position must be `inSection` and the id legal       3x3x4x4x3x3      =  1296
    //   withUnparsed  78 of the 126 (suffix x id x position) triples        3 x 36 x 78      =  8424
    //   withUpdates   1 of 3 update levels, never inside the comment        18144 x 1/3      =  6048
    //   withSections  3 comment levels x 13/21 (non-column suffix OR Notes) 13608 x 13/21    =  8424
    //
    // `withUnparsed` and `withSections` coincide at 8424. The two derivations above are different
    // questions that happen to have the same answer; they are kept as separate expectations with
    // separate messages so an edit that moved one without the other reds rather than leaving two
    // plausible figures side by side.
    expect(withComment, "cells carrying a commented line — I2 measures nothing without them").toBe(13608);
    expect(withColumns, "cells opening at least one column — I3 is not a comparison of zero to zero").toBe(5832);
    expect(withRows, "cells filing at least one row — I5 is not a comparison of zero to zero").toBe(1296);
    expect(withUnparsed, "cells reporting at least one unparsed line — I4 needs entries to check").toBe(8424);
    expect(withUpdates, "cells carrying at least one update entry").toBe(6048);
    expect(withSections, "cells opening at least one non-column section").toBe(8424);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the five structural invariants, over every cell.
//
// The claims are plan 32-02's, spelled the same way. Only the corpus they are asserted over is new.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-oracle — I1, the partition is total", () => {
  it("accounts for every line of every cell exactly once", () => {
    let swept = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      swept += 1;

      // PREMISE — the denominator is derived a second way, per cell rather than once for the sweep.
      const byNewlines = (m.cell.text.match(/\n/g) ?? []).length + 1;
      if (m.scan.rawLines.length !== byNewlines) {
        failures.push(`line-count derivations disagree :: ${nameCell(m.cell)}`);
        continue;
      }

      const buckets =
        m.model.columns.reduce((n, c) => n + c.rows.length, 0) +
        m.model.epicRows.length +
        m.model.updates.length +
        m.model.preamble.length +
        m.model.nonColumnSections.reduce((n, s) => n + s.lines.length, 0) +
        m.model.unparsed.length;

      if (buckets + m.scan.blankOrHeading !== m.scan.rawLines.length) {
        failures.push(
          `${buckets} + ${m.scan.blankOrHeading} != ${m.scan.rawLines.length} :: ${nameCell(m.cell)}`,
        );
      }
    }
    expect(swept, "cells actually swept, counted by the loop that consumed them").toBe(EXPECTED_CELLS);
    expect(failures.slice(0, 5), "the first five cells whose lines do not partition").toEqual([]);
    expect(failures.length, "total I1 violations over the whole corpus").toBe(0);
  });

  it("never lets one line reach two line-numbered buckets, so the partition is disjoint too", () => {
    let swept = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      swept += 1;
      const claimed = [
        ...m.model.columns.flatMap((c) => c.rows.map((r) => r.line)),
        ...m.model.epicRows.map((r) => r.line),
        ...m.model.updates.map((u) => u.line),
        ...m.model.unparsed.map((u) => u.line),
      ];
      if (new Set(claimed).size !== claimed.length) failures.push(nameCell(m.cell));
    }
    expect(swept, "cells actually swept").toBe(EXPECTED_CELLS);
    expect(failures.slice(0, 5), "cells where one line number is claimed twice").toEqual([]);
  });
});

describe("board-oracle — I2, a comment span contributes no parsed entity", () => {
  it("parses nothing from inside any comment span of any cell", () => {
    let measured = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      if (m.scan.commented.size === 0) continue;
      measured += 1;
      const trespass = parsedEntityLines(m.model).filter((line) => m.scan.commented.has(line));
      if (trespass.length > 0) {
        failures.push(`lines ${trespass.join(",")} :: ${nameCell(m.cell)}`);
      }
    }
    expect(
      measured,
      "PREMISE: the subset of cells carrying a commented line, derived by the loop that consumed it",
    ).toBe(13608);
    expect(failures.slice(0, 5), "the first five cells parsing an entity from inside a comment").toEqual([]);
    expect(failures.length, "total I2 violations").toBe(0);
  });
});

describe("board-oracle — I3, columns are conserved", () => {
  it("opens exactly one column per uncommented legal heading, in every cell", () => {
    let swept = 0;
    let headingsSeen = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      swept += 1;
      headingsSeen += m.scan.columnHeadings;
      if (m.model.columns.length !== m.scan.columnHeadings) {
        failures.push(
          `model ${m.model.columns.length} vs scan ${m.scan.columnHeadings} :: ${nameCell(m.cell)}`,
        );
      }
    }
    expect(swept, "cells actually swept").toBe(EXPECTED_CELLS);
    expect(
      headingsSeen,
      "PREMISE: the total legal headings the independent scan found, derived independently of the " +
        "parse loop — a sweep over zero headings would be 18,144 comparisons of zero to zero",
    ).toBe(5832);
    expect(failures.slice(0, 5), "the first five cells whose column count is not conserved").toEqual([]);
    expect(failures.length, "total I3 violations").toBe(0);
  });
});

describe("board-oracle — I4, unparsed lines are ordered and real", () => {
  it("resolves every unparsed line number to a non-blank raw line, in ascending order", () => {
    let entries = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      let previous = 0;
      for (const u of m.model.unparsed) {
        entries += 1;
        if (u.line <= previous) failures.push(`line ${u.line} out of order :: ${nameCell(m.cell)}`);
        previous = u.line;
        const raw = m.scan.rawLines[u.line - 1];
        if (raw === undefined || raw.trim() === "") {
          failures.push(`line ${u.line} resolves to a blank or missing raw line :: ${nameCell(m.cell)}`);
        }
      }
    }
    expect(
      entries,
      "PREMISE: unparsed entries actually inspected, counted by the loop that consumed them — an " +
        "empty denominator here would make this case 18,144 assertions about nothing",
    ).toBe(8424);
    expect(failures.slice(0, 5), "the first five unreal or out-of-order unparsed entries").toEqual([]);
    expect(failures.length, "total I4 violations").toBe(0);
  });
});

describe("board-oracle — I5, rows are conserved", () => {
  it("places or refuses every legal row of every cell, and loses none", () => {
    let swept = 0;
    let legalRowsSeen = 0;
    const failures: string[] = [];
    for (const m of MEASURED) {
      swept += 1;
      legalRowsSeen += m.scan.legalRows.length;

      const inColumn = m.model.columns.reduce((n, c) => n + c.rows.length, 0) + m.model.epicRows.length;
      const refused = m.model.unparsed.filter((u) => {
        const row = ORACLE_ROW.exec(u.text);
        return row !== null && ORACLE_ID.test(row[1] as string);
      }).length;

      if (inColumn !== m.scan.legalRowsInColumn.length) {
        failures.push(
          `placed ${inColumn} vs scan ${m.scan.legalRowsInColumn.length} :: ${nameCell(m.cell)}`,
        );
        continue;
      }
      if (inColumn + refused !== m.scan.legalRows.length) {
        failures.push(
          `placed ${inColumn} + refused ${refused} != ${m.scan.legalRows.length} :: ${nameCell(m.cell)}`,
        );
      }
    }
    expect(swept, "cells actually swept").toBe(EXPECTED_CELLS);
    expect(
      legalRowsSeen,
      "PREMISE: the total legal rows the independent scan found, derived independently of the parse " +
        "loop — a sweep over zero rows would conserve nothing",
    ).toBe(9072);
    expect(failures.slice(0, 5), "the first five cells whose rows are not conserved").toEqual([]);
    expect(failures.length, "total I5 violations").toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — the bound case (T-32-01).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The wall-clock ceiling for one parse of a document carrying the longest real board line. */
const LONG_LINE_BUDGET_MS = 2000;

describe("board-oracle — the longest line any real board has produced (T-32-01)", () => {
  const chess = readFileSync(join(ROOT, "scripts/fixtures/board-replay/chess-board.md"), "utf8");
  const longest = chess
    .split("\n")
    .reduce((a, b) => (Buffer.byteLength(b, "utf8") > Buffer.byteLength(a, "utf8") ? b : a), "");

  it("PREMISE: the fixture still carries the bound-case line, at the size the trim preserved", () => {
    expect(
      Buffer.byteLength(longest, "utf8"),
      "PREMISE: the bound case has been elided out of the fixture, so the case below measures a " +
        "short line and says nothing about the ceilings it exists for",
    ).toBeGreaterThanOrEqual(34494);
    expect(longest.startsWith("- ["), "the bound case is a ticket row, not an update line").toBe(true);
  });

  it("parses a cell carrying that line within a stated wall-clock bound", () => {
    const doc = [
      "# Board",
      "<!--",
      MINI_HEADING,
      MINI_ROW,
      "-->",
      "## Done (WIP unlimited)",
      longest,
      "## Notes (bootstrap, 2026-06-05)",
      "Prose beneath a non-column heading.",
    ].join("\n");

    const started = Date.now();
    const model = parseBoard(doc);
    const elapsed = Date.now() - started;

    expect(
      model.columns.reduce((n, c) => n + c.rows.length, 0),
      "the bound case is a legal row and is placed, never dropped",
    ).toBe(1);
    expect(model.bounds.longestLine, "the measured longest line, in UTF-16 code units").toBeGreaterThan(
      34000,
    );
    expect(
      elapsed,
      "this repository has already turned a 0.47-second guard into a 383-second one on a long line. " +
        `Every pattern in the grammar is anchored so this stays linear; the ceiling is ${LONG_LINE_BUDGET_MS} ms`,
    ).toBeLessThan(LONG_LINE_BUDGET_MS);
  });

  it("holds all five invariants over the bound-case cell as well", () => {
    const doc = ["# Board", "## Done (WIP unlimited)", longest].join("\n");
    const model = parseBoard(doc);
    const scan = scanIndependently(doc);

    const buckets =
      model.columns.reduce((n, c) => n + c.rows.length, 0) +
      model.epicRows.length +
      model.updates.length +
      model.preamble.length +
      model.nonColumnSections.reduce((n, s) => n + s.lines.length, 0) +
      model.unparsed.length;
    expect(buckets + scan.blankOrHeading, "I1 over the bound case").toBe(scan.rawLines.length);
    expect(parsedEntityLines(model).filter((l) => scan.commented.has(l)), "I2").toEqual([]);
    expect(model.columns.length, "I3").toBe(scan.columnHeadings);
    expect(model.unparsed.every((u) => (scan.rawLines[u.line - 1] ?? "").trim() !== ""), "I4").toBe(true);
    expect(
      model.columns.reduce((n, c) => n + c.rows.length, 0) + model.epicRows.length,
      "I5",
    ).toBe(scan.legalRowsInColumn.length);
  });
});
