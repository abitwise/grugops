// board-model.test.ts — the TOTAL line partition (plan 32-02, DASH-02, D-24).
//
// WHAT THIS FILE ASSERTS, AND WHY IT IS STRUCTURAL RATHER THAN TRANSCRIBED. Plan 32-01 proved one
// path through the grammar against the real kit board. This file asserts the PARTITION: every line
// of a board document lands in exactly one named bucket, and the buckets neither overlap nor lose a
// line. The assertions below are properties of the answer — counts derived independently of the
// parse loop, orderings, and containment — never a transcribed expected output. A transcription
// tells you the parser still does what it did; a structural invariant tells you the parser still
// does what it PROMISED.
//
// THE FIVE INVARIANTS, NAMED ONCE HERE AND ONE PER CASE BELOW.
//
//   I1  TOTALITY. rows + epicRows + updates + preamble + nonColumnSection lines + unparsed +
//       the blank/heading set equals the raw line count exactly. Nothing is dropped, nothing is
//       counted twice.
//   I2  COMMENT INVISIBILITY. No column, row, epic row or update carries a line number that falls
//       inside a `<!-- … -->` span of the RAW input.
//   I3  COLUMN CONSERVATION. `columns.length` equals the number of uncommented lines that carry one
//       of the three D-05 heading suffixes.
//   I4  UNPARSED ORDER. `unparsed[]` ascends by line number and every entry resolves to a non-blank
//       line of the input.
//   I5  ROW CONSERVATION. Every legal row outside a comment span is accounted for: one inside a
//       column becomes a row or an epic row, one outside every column becomes an unparsed line.
//
// EVERY PREMISE IS A FAILING ASSERTION RATHER THAN AN ASSUMPTION. This repository has recorded a
// FALSE verification-harness premise six times across four rounds (project memory, Phase 31), so
// each invariant is preceded by a `PREMISE:` assertion that its denominator is non-zero AND equals
// an element count derived a second way. A vacuity floor catches an EMPTY denominator and has never
// caught a SILENTLY SHORT one, which is why the premises below assert equality with a second
// derivation rather than `toBeGreaterThan(0)` alone.
//
// THE COMMENT BLANKER IS IMPLEMENTED A SECOND TIME IN THIS FILE, DELIBERATELY. `blankIndependently`
// below is an ORACLE, not a second authority: it is a character state machine, where the module's
// `stripHtmlComments` is an `indexOf` scan. Two implementations of one rule are the drift class this
// repository has paid for when both are shipped — here only one ships, and the other exists so the
// shipped one has something to disagree with. The discrimination half (a no-op stripper turning I2
// red) lands in plan 32-04.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LARGE_BOARD_BYTES,
  LONG_LINE_CHARS,
  MAX_META_CHARS,
  MAX_UPDATE_TEXT_CHARS,
  SCHEMA_VERSION,
  boardColumnName,
  parseBoard,
} from "./board-model.js";

const ROOT = join(import.meta.dirname, "..");

// ── The corpus ───────────────────────────────────────────────────────────────────────────────────

/**
 * A synthetic board carrying every bucket of the partition at once.
 *
 * It is written as an array of lines rather than one template string so a line number in a failure
 * message can be counted by eye. It is the only member of the corpus that carries rows, so it is
 * what keeps I3 and I5 from passing vacuously over three real documents that are all rowless today.
 */
const RICH_LINES: readonly string[] = [
  /*  1 */ "# Rich board",
  /*  2 */ "_Updated: 2026-08-20 by Orchestrator",
  /*  3 */ "_Updated: not a date by nobody",
  /*  4 */ "> a blockquote line in the preamble",
  /*  5 */ "",
  /*  6 */ "<!--",
  /*  7 */ "  a documentation block carrying a structurally valid mini-board",
  /*  8 */ "    ## In Development (WIP 1/3)",
  /*  9 */ "    - [ABC-777] a documented example, never live state",
  /* 10 */ "-->",
  /* 11 */ "",
  /* 12 */ "## Columns (spec §6.1)",
  /* 13 */ "",
  /* 14 */ "| Column | WIP |",
  /* 15 */ "|--------|-----|",
  /* 16 */ "",
  /* 17 */ "## Backlog (WIP unlimited)",
  /* 18 */ "",
  /* 19 */ "- [EPIC-006] Move input and controls  (owner: BA/PM)",
  /* 20 */ "- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)",
  /* 21 */ "",
  /* 22 */ "## In Development (WIP 1/3)",
  /* 23 */ "",
  /* 24 */ "- [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)  — merged 2026-06-06",
  /* 25 */ "    - [ABC-013] a nested sub-bullet, unparsed this phase",
  /* 26 */ "_Updated: a placeholder that never matched",
  /* 27 */ "",
  /* 28 */ "## Notes (bootstrap, 2026-06-05)",
  /* 29 */ "",
  /* 30 */ "Prose line one.",
  /* 31 */ "Prose line two.",
  /* 32 */ "",
  /* 33 */ "## Blocked (2)",
  /* 34 */ "",
  /* 35 */ "- [ABC-099] the old spec's Blocked form, so this row finds no column",
  /* 36 */ "",
  /* 37 */ "## Blocked (visible, time-tracked)",
  /* 38 */ "",
  /* 39 */ "- [ABC-100] waiting on a decision",
  /* 40 */ "",
];

const RICH = RICH_LINES.join("\n");

type CorpusDoc = { readonly label: string; readonly text: string };

const REAL_DOCS: readonly string[] = [
  "plans/board.md",
  "agent-factory/seed/plans/board.md",
  "plans/traceability.md",
];

const CORPUS: readonly CorpusDoc[] = [
  ...REAL_DOCS.map((rel) => ({ label: rel, text: readFileSync(join(ROOT, rel), "utf8") })),
  { label: "synthetic/rich-board", text: RICH },
];

/** Two-sided: the corpus is the three in-repo documents plus the synthetic board. */
const CORPUS_COUNT = 4;

// ── The independent oracle ───────────────────────────────────────────────────────────────────────

/**
 * Blank every `<!-- … -->` span, preserving newlines — written as a CHARACTER STATE MACHINE.
 *
 * The module under test scans with `indexOf`. This one walks bytes and toggles a flag. Neither
 * shape can be a transcription of the other, which is the only property that makes the counts
 * derived from it independent evidence.
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

/** A legal row's shape, spelled here so the oracle does not borrow the module's own pattern. */
const ORACLE_ROW = /^- \[([^\]]{1,64})\] /;
const ORACLE_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;

type Scan = {
  /** Lines of the normalized input, before any blanking. */
  readonly rawLines: readonly string[];
  /** Lines after the independent blanking pass. */
  readonly blanked: readonly string[];
  /** One-based line numbers whose entire content sits inside a comment span. */
  readonly commented: ReadonlySet<number>;
  /** Blank lines plus level-two heading lines — the partition's seventh bucket. */
  readonly blankOrHeading: number;
  /** Uncommented lines carrying one of the three D-05 heading suffixes. */
  readonly columnHeadings: number;
  /** Every uncommented legal row, by line number. */
  readonly legalRows: readonly number[];
  /** The subset of `legalRows` that sits under an open column heading. */
  readonly legalRowsInColumn: readonly number[];
};

/**
 * Classify every line of `text` WITHOUT calling `parseBoard`.
 *
 * The section walk here is four lines long and asks only one question of the module — "does this
 * heading open a column" — through the exported `boardColumnName`. That is deliberate: the
 * invariants below are about the parse LOOP conserving what the heading and row grammars admit, so
 * borrowing the per-line predicates while deriving the totals independently is what isolates the
 * loop as the thing under test.
 */
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

  return {
    rawLines,
    blanked,
    commented,
    blankOrHeading,
    columnHeadings,
    legalRows,
    legalRowsInColumn,
  };
}

/** Every line number the model claims as a parsed entity of the board's live state. */
function parsedEntityLines(model: ReturnType<typeof parseBoard>): number[] {
  return [
    ...model.columns.map((c) => c.line),
    ...model.columns.flatMap((c) => c.rows.map((r) => r.line)),
    ...model.epicRows.map((r) => r.line),
    ...model.updates.map((u) => u.line),
  ];
}

// ── The premises the whole file rests on ─────────────────────────────────────────────────────────

describe("board-model — the harness's own premises", () => {
  it("PREMISE: the corpus is the pinned four documents and none of them is empty", () => {
    expect(CORPUS.length, "PREMISE: the corpus holds the pinned number of documents").toBe(
      CORPUS_COUNT,
    );
    for (const doc of CORPUS) {
      expect(doc.text.length, `PREMISE: ${doc.label} carries bytes`).toBeGreaterThan(0);
    }
  });

  it("PREMISE: the independent blanker blanks the kit board's own documentation block", () => {
    const board = CORPUS[0] as CorpusDoc;
    const scan = scanIndependently(board.text);
    expect(
      scan.commented.size,
      "PREMISE: plans/board.md ships a multi-line HTML comment; a zero here means the oracle saw none",
    ).toBeGreaterThan(10);
  });

  it("PREMISE: the synthetic board reaches every bucket of the partition", () => {
    const model = parseBoard(RICH);
    const reached = {
      columns: model.columns.length,
      rows: model.columns.reduce((n, c) => n + c.rows.length, 0),
      epicRows: model.epicRows.length,
      updates: model.updates.length,
      preamble: model.preamble.length,
      nonColumnSections: model.nonColumnSections.length,
      sectionLines: model.nonColumnSections.reduce((n, s) => n + s.lines.length, 0),
      unparsed: model.unparsed.length,
    };
    for (const [bucket, n] of Object.entries(reached)) {
      expect(n, `PREMISE: the synthetic board must reach the ${bucket} bucket`).toBeGreaterThan(0);
    }
  });
});

// ── I1 ───────────────────────────────────────────────────────────────────────────────────────────

describe("board-model — I1, the partition is total", () => {
  for (const doc of CORPUS) {
    it(`accounts for every line of ${doc.label} exactly once`, () => {
      const scan = scanIndependently(doc.text);

      // PREMISE — the denominator is non-zero AND equals an element count derived a second way.
      const normalized = doc.text.split("\r\n").join("\n");
      const byNewlines = (normalized.match(/\n/g) ?? []).length + 1;
      expect(scan.rawLines.length, `PREMISE: ${doc.label} has lines to partition`).toBeGreaterThan(
        0,
      );
      expect(
        scan.rawLines.length,
        `PREMISE: two independent derivations of ${doc.label}'s line count must agree`,
      ).toBe(byNewlines);

      const model = parseBoard(doc.text);
      const buckets =
        model.columns.reduce((n, c) => n + c.rows.length, 0) +
        model.epicRows.length +
        model.updates.length +
        model.preamble.length +
        model.nonColumnSections.reduce((n, s) => n + s.lines.length, 0) +
        model.unparsed.length;

      expect(
        buckets + scan.blankOrHeading,
        `${doc.label}: every line lands in exactly one bucket, or in the blank/heading set`,
      ).toBe(scan.rawLines.length);
    });
  }

  it("never lets one line reach two buckets, so the partition is disjoint as well as total", () => {
    const model = parseBoard(RICH);
    const claimed = [
      ...model.columns.flatMap((c) => c.rows.map((r) => r.line)),
      ...model.epicRows.map((r) => r.line),
      ...model.updates.map((u) => u.line),
      ...model.unparsed.map((u) => u.line),
    ];
    expect(new Set(claimed).size, "no line number is claimed by two line-numbered buckets").toBe(
      claimed.length,
    );
  });
});

// ── I2 ───────────────────────────────────────────────────────────────────────────────────────────

describe("board-model — I2, a comment span contributes no parsed entity", () => {
  for (const doc of CORPUS) {
    it(`parses nothing from inside a comment span of ${doc.label}`, () => {
      const scan = scanIndependently(doc.text);
      const model = parseBoard(doc.text);
      const entities = parsedEntityLines(model);

      // PREMISE — at least one document line IS commented, else this invariant asserts nothing.
      expect(
        scan.commented.size,
        `PREMISE: ${doc.label} must carry at least one fully commented line`,
      ).toBeGreaterThan(0);

      const trespass = entities.filter((line) => scan.commented.has(line));
      expect(trespass, `${doc.label}: parsed entity line numbers inside a comment span`).toEqual([]);
    });
  }

  it("gives a document whose comment never closes zero columns and zero rows", () => {
    const model = parseBoard(
      "# Board\n<!--\n## In Development (WIP 1/3)\n- [ABC-014] a documented example\n## Done (WIP unlimited)\n- [ABC-015] another\n",
    );
    expect(model.columns).toEqual([]);
    expect(model.epicRows).toEqual([]);
    expect(model.columns.reduce((n, c) => n + c.rows.length, 0)).toBe(0);
  });
});

// ── I3 ───────────────────────────────────────────────────────────────────────────────────────────

describe("board-model — I3, columns are conserved", () => {
  for (const doc of CORPUS) {
    it(`opens exactly one column per legal heading in ${doc.label}`, () => {
      const scan = scanIndependently(doc.text);
      const model = parseBoard(doc.text);
      expect(
        model.columns.length,
        `${doc.label}: one column per uncommented D-05 heading, no more and no fewer`,
      ).toBe(scan.columnHeadings);
    });
  }

  it("PREMISE: the corpus carries columns, so I3 is not four comparisons of zero to zero", () => {
    const total = CORPUS.reduce((n, doc) => n + scanIndependently(doc.text).columnHeadings, 0);
    expect(total, "PREMISE: the corpus must carry column headings for I3 to measure anything").
      toBeGreaterThan(0);
  });

  it("keeps two headings whose names normalize identically as two separate columns", () => {
    const model = parseBoard(
      "## Done (WIP unlimited)\n- [ABC-001] first\n## Done (WIP unlimited)\n- [ABC-002] second\n",
    );
    expect(model.columns.map((c) => c.name)).toEqual(["Done", "Done"]);
    expect(model.columns.map((c) => c.rows.map((r) => r.id))).toEqual([["ABC-001"], ["ABC-002"]]);
  });
});

// ── I4 ───────────────────────────────────────────────────────────────────────────────────────────

describe("board-model — I4, unparsed lines are ordered and real", () => {
  for (const doc of CORPUS) {
    it(`reports ${doc.label}'s unparsed lines in ascending order, each a non-blank line`, () => {
      const scan = scanIndependently(doc.text);
      const model = parseBoard(doc.text);
      const numbers = model.unparsed.map((u) => u.line);
      expect(numbers, `${doc.label}: unparsed line numbers ascend`).toEqual([...numbers].sort((a, b) => a - b));
      for (const u of model.unparsed) {
        expect(
          (scan.blanked[u.line - 1] as string).trim(),
          `${doc.label}:${u.line} — an unparsed entry must name a non-blank, uncommented line`,
        ).not.toBe("");
      }
    });
  }

  it("reports zero unparsed lines on the kit board as it ships", () => {
    const model = parseBoard(readFileSync(join(ROOT, "plans/board.md"), "utf8"));
    expect(model.unparsed, "a fresh checkout's board must produce no findings").toEqual([]);
    expect(model.preamble.length, "the `_Updated:` placeholder lives in the preamble").toBeGreaterThan(0);
  });
});

// ── I5 ───────────────────────────────────────────────────────────────────────────────────────────

describe("board-model — I5, rows are conserved", () => {
  for (const doc of CORPUS) {
    it(`accounts for every legal row of ${doc.label}`, () => {
      const scan = scanIndependently(doc.text);
      const model = parseBoard(doc.text);

      const inColumn =
        model.columns.reduce((n, c) => n + c.rows.length, 0) + model.epicRows.length;
      const refused = model.unparsed.filter((u) => {
        const row = ORACLE_ROW.exec(u.text);
        return row !== null && ORACLE_ID.test(row[1] as string);
      }).length;

      expect(inColumn, `${doc.label}: a legal row under a column becomes a row or an epic row`).toBe(
        scan.legalRowsInColumn.length,
      );
      expect(
        inColumn + refused,
        `${doc.label}: every legal row outside a comment is either placed or refused, never lost`,
      ).toBe(scan.legalRows.length);
    });
  }

  it("PREMISE: the corpus carries legal rows, so I5 is not four comparisons of zero to zero", () => {
    const total = CORPUS.reduce((n, doc) => n + scanIndependently(doc.text).legalRows.length, 0);
    expect(total, "PREMISE: the corpus must carry legal rows for I5 to measure anything").toBeGreaterThan(
      0,
    );
  });
});

// ── The four buckets, one case each ──────────────────────────────────────────────────────────────

describe("board-model — updates (D-03, D-24)", () => {
  it("makes a canonical `_Updated:` line an update entry with its date and actor", () => {
    const model = parseBoard("_Updated: 2026-08-20 by Orchestrator\n## Backlog (WIP unlimited)\n");
    expect(model.updates.map((u) => ({ date: u.date, actor: u.actor, line: u.line }))).toEqual([
      { date: "2026-08-20", actor: "Orchestrator", line: 1 },
    ]);
    expect(model.updates[0]?.text).toBe("_Updated: 2026-08-20 by Orchestrator");
  });

  it("keeps a NON-canonical `_Updated:` line in the preamble when it sits before the first column", () => {
    const model = parseBoard("_Updated: <ISO date> by <role>_\n## Backlog (WIP unlimited)\n");
    expect(model.updates).toEqual([]);
    expect(model.preamble).toEqual(["_Updated: <ISO date> by <role>_"]);
    expect(model.unparsed).toEqual([]);
  });

  it("makes a NON-canonical `_Updated:` line unparsed when it sits inside a column section", () => {
    const model = parseBoard("## Backlog (WIP unlimited)\n_Updated: soon by somebody\n");
    expect(model.updates).toEqual([]);
    expect(model.unparsed.map((u) => ({ line: u.line, column: u.column }))).toEqual([
      { line: 2, column: "Backlog" },
    ]);
  });
});

describe("board-model — non-column sections (D-24)", () => {
  it("collects a `## Notes (…)` heading and its prose into one non-column section", () => {
    const model = parseBoard(
      "## Notes (bootstrap, 2026-06-05)\n\nThe queue was seeded by hand.\nThe first ticket was ABC-001.\n",
    );
    expect(model.columns).toEqual([]);
    expect(model.nonColumnSections).toEqual([
      {
        heading: "## Notes (bootstrap, 2026-06-05)",
        line: 1,
        lines: ["The queue was seeded by hand.", "The first ticket was ABC-001."],
      },
    ]);
    expect(model.unparsed).toEqual([]);
  });

  it("puts a `###` heading inside whatever section is current, opening nothing of its own", () => {
    const model = parseBoard("## Conventions\n\n### Sizing (spec §6.3)\n\nXS=1, S=2, M=3.\n");
    expect(model.nonColumnSections.length).toBe(1);
    expect(model.nonColumnSections[0]?.lines).toEqual(["### Sizing (spec §6.3)", "XS=1, S=2, M=3."]);
  });

  it("refuses the old spec's `## Blocked (2)` form and reports its row as unparsed (D-07)", () => {
    const model = parseBoard("## Blocked (2)\n\n- [ABC-099] waiting on a decision\n");
    expect(model.columns).toEqual([]);
    expect(model.unparsed.map((u) => ({ line: u.line, text: u.text, column: u.column }))).toEqual([
      { line: 3, text: "- [ABC-099] waiting on a decision", column: null },
    ]);
  });
});

describe("board-model — unparsed lines inside a column (D-03)", () => {
  it("records a nested sub-bullet under a row as unparsed, naming its column", () => {
    const model = parseBoard(
      "## Done (WIP unlimited)\n- [ABC-012] Portfolio FX conversion\n    - [ABC-013] a nested sub-bullet\n",
    );
    expect(model.columns[0]?.rows.map((r) => r.id)).toEqual(["ABC-012"]);
    expect(model.unparsed.map((u) => ({ line: u.line, column: u.column }))).toEqual([
      { line: 3, column: "Done" },
    ]);
  });

  it("records prose between rows in the Done column as unparsed rather than dropping it", () => {
    const model = parseBoard(
      "## Done (WIP unlimited)\n- [ABC-012] first\nA paragraph an agent wrote between two rows.\n- [ABC-013] second\n",
    );
    expect(model.columns[0]?.rows.map((r) => r.id)).toEqual(["ABC-012", "ABC-013"]);
    expect(model.unparsed.map((u) => u.text)).toEqual([
      "A paragraph an agent wrote between two rows.",
    ]);
  });
});

// ── Bounds and truncation (D-20, T-32-01, T-32-07) ───────────────────────────────────────────────
//
// WHY A WALL-CLOCK ASSERTION LIVES IN A UNIT TEST FILE. The measured corpus carries a board of
// 380,605 bytes whose longest line is 34,494 characters, and this repository has already paid for
// one superlinear regex on a long line — a 0.47 second guard that took 383 seconds. A bound that is
// only asserted in prose is not a bound, so the long-line case below measures elapsed time and
// fails on it.
//
// THE TWO CEILINGS ARE DECISIONS, NOT TUNING KNOBS. Each is recorded in
// `agent-factory/contracts/board.md` § Bounds. A board that grows past a ceiling is still parsed in
// full and still renders every row; only the opaque strings shorten, and the header says so. The
// alternative — refusing a board over the ceiling — makes a growing board permanently unreadable,
// which is the failure D-20 rejected by name.

describe("board-model — bounds are measured on every parse (D-20)", () => {
  it("measures boardBytes in UTF-8 bytes and longestLine in UTF-16 code units", () => {
    // One astral character: two UTF-16 code units, four UTF-8 bytes. A board whose two numbers
    // disagree is the whole reason each carries a stated unit.
    const text = "# B\n🙂🙂\n";
    const model = parseBoard(text);
    expect(model.bounds.boardBytes, "UTF-8 byte length of the input as given").toBe(
      Buffer.byteLength(text, "utf8"),
    );
    expect(model.bounds.longestLine, "the longest line in UTF-16 code units").toBe(4);
    expect(model.bounds.exceeded).toBe(false);
  });

  it("pins the two ceilings as decisions rather than as constants", () => {
    expect(
      LARGE_BOARD_BYTES,
      "the large-board ceiling is one mebibyte, a decision recorded in agent-factory/contracts/board.md § Bounds; moving it is a contract change, never a convenience",
    ).toBe(1048576);
    expect(
      LONG_LINE_CHARS,
      "the long-line ceiling is 65,536 UTF-16 code units, a decision recorded in agent-factory/contracts/board.md § Bounds; moving it is a contract change, never a convenience",
    ).toBe(65536);
  });

  it("leaves exceeded false at exactly LARGE_BOARD_BYTES", () => {
    const line = `${"x".repeat(63)}\n`;
    const text = line.repeat(LARGE_BOARD_BYTES / 64);
    expect(Buffer.byteLength(text, "utf8"), "PREMISE: the fixture is exactly at the ceiling").toBe(
      LARGE_BOARD_BYTES,
    );
    expect(parseBoard(text).bounds.exceeded).toBe(false);
  });

  it("sets exceeded true at LARGE_BOARD_BYTES plus one byte", () => {
    const line = `${"x".repeat(63)}\n`;
    const text = `${line.repeat(LARGE_BOARD_BYTES / 64)}y`;
    expect(
      Buffer.byteLength(text, "utf8"),
      "PREMISE: the fixture is one byte past the ceiling",
    ).toBe(LARGE_BOARD_BYTES + 1);
    const bounds = parseBoard(text).bounds;
    expect(bounds.boardBytes).toBe(LARGE_BOARD_BYTES + 1);
    expect(bounds.exceeded).toBe(true);
  });

  it("leaves exceeded false at exactly LONG_LINE_CHARS on the longest line", () => {
    const text = `# B\n${"x".repeat(LONG_LINE_CHARS)}\n`;
    const bounds = parseBoard(text).bounds;
    expect(bounds.longestLine, "PREMISE: the fixture's longest line is exactly at the ceiling").toBe(
      LONG_LINE_CHARS,
    );
    expect(bounds.exceeded).toBe(false);
  });

  it("sets exceeded true at LONG_LINE_CHARS plus one code unit", () => {
    const text = `# B\n${"x".repeat(LONG_LINE_CHARS + 1)}\n`;
    const bounds = parseBoard(text).bounds;
    expect(bounds.longestLine).toBe(LONG_LINE_CHARS + 1);
    expect(bounds.exceeded).toBe(true);
  });

  it("parses a chess-sized board with a 34 KB line in under two seconds (T-32-01)", () => {
    const rows: string[] = ["# Chess", "_Updated: 2026-08-20 by Orchestrator", ""];
    rows.push("## In Development (WIP 1/3)", "");
    rows.push(`- [ABC-001] the long one  (${"detail, ".repeat(4312)})`);
    for (let i = 2; i <= 7000; i += 1) {
      rows.push(`- [ABC-${String(i).padStart(4, "0")}] a row  (owner: Software Engineer, P1)`);
    }
    const text = `${rows.join("\n")}\n`;

    expect(
      Buffer.byteLength(text, "utf8"),
      "PREMISE: the fixture is at least the measured 380,000 bytes",
    ).toBeGreaterThanOrEqual(380000);
    expect(
      Math.max(...text.split("\n").map((l) => l.length)),
      "PREMISE: the fixture carries the measured 34,494-character line",
    ).toBeGreaterThanOrEqual(34494);

    const started = Date.now();
    const model = parseBoard(text);
    const elapsed = Date.now() - started;

    expect(model.columns[0]?.rows.length, "every row is still parsed").toBe(7000);
    expect(elapsed, "a 380 KB board with a 34 KB line must parse in under two seconds").toBeLessThan(
      2000,
    );
  });
});

describe("board-model — truncation shortens the opaque strings and drops no row (D-20)", () => {
  it("truncates an over-long meta, flags the row, and keeps the row in its column", () => {
    const meta = "d".repeat(MAX_META_CHARS + 500);
    const model = parseBoard(`## Done (WIP unlimited)\n- [ABC-001] a title  (${meta})\n`);
    const row = model.columns[0]?.rows[0];
    expect(row?.id, "the row is still present — a bound shortens a string, never drops a row").toBe(
      "ABC-001",
    );
    expect(row?.meta?.length).toBe(MAX_META_CHARS);
    expect(row?.meta?.endsWith("…")).toBe(true);
    expect(row?.truncated).toBe(true);
  });

  it("truncates an over-long trailer and flags the same row", () => {
    const trailer = "t".repeat(MAX_META_CHARS + 500);
    const model = parseBoard(`## Done (WIP unlimited)\n- [ABC-002] a title  (m)  ${trailer}\n`);
    const row = model.columns[0]?.rows[0];
    expect(row?.meta).toBe("m");
    expect(row?.trailer.length).toBe(MAX_META_CHARS);
    expect(row?.truncated).toBe(true);
  });

  it("leaves a row inside the caps unflagged", () => {
    const model = parseBoard("## Done (WIP unlimited)\n- [ABC-003] a title  (owner: QE)\n");
    expect(model.columns[0]?.rows[0]?.truncated).toBe(false);
  });

  it("truncates an over-long update line and flags the entry", () => {
    const tail = "u".repeat(MAX_UPDATE_TEXT_CHARS + 500);
    const model = parseBoard(`_Updated: 2026-08-20 by ${tail}\n`);
    const update = model.updates[0];
    expect(update?.date).toBe("2026-08-20");
    expect(update?.text.length).toBe(MAX_UPDATE_TEXT_CHARS);
    expect(update?.actor.length).toBe(MAX_UPDATE_TEXT_CHARS);
    expect(update?.truncated).toBe(true);
  });

  it("cuts BEFORE a surrogate pair rather than between its halves", () => {
    const meta = "🙂".repeat(MAX_META_CHARS); // twice the cap in UTF-16 code units
    const model = parseBoard(`## Done (WIP unlimited)\n- [ABC-004] a title  (${meta})\n`);
    const cut = model.columns[0]?.rows[0]?.meta as string;

    expect(cut.length, "the result never exceeds the cap in code units").toBeLessThanOrEqual(
      MAX_META_CHARS,
    );
    expect(
      [...cut].length,
      "whole code points only — half the cap in astral characters, plus the marker",
    ).toBe(MAX_META_CHARS / 2);
    for (const ch of cut) {
      const code = ch.codePointAt(0) as number;
      const lone = code >= 0xd800 && code <= 0xdfff;
      expect(lone, `no lone surrogate may survive a cut (saw U+${code.toString(16)})`).toBe(false);
    }
  });
});

describe("board-model — a WIP number is read, never coerced (T-32-09)", () => {
  for (const suffix of ["(WIP 1.5/3)", "(WIP 1e2/3)", "(WIP ٣/3)", "(WIP  1/3)", "(WIP -1/3)"]) {
    it(`makes \`## Done ${suffix}\` a non-column heading rather than rounding it`, () => {
      const model = parseBoard(`## Done ${suffix}\n- [ABC-001] a row\n`);
      expect(model.columns, `${suffix} fails D-05, so it opens no column`).toEqual([]);
      expect(model.unparsed.map((u) => u.line), "its row is refused loudly").toEqual([2]);
    });
  }

  it("reads a conforming WIP pair as base-ten integers", () => {
    const model = parseBoard("## Done (WIP 07/12)\n");
    expect(model.columns[0]?.claimedLive).toBe(7);
    expect(model.columns[0]?.limit).toBe(12);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-05 — THE SEVEN CONFLICT KINDS AND THE JOIN (DASH-03, D-08, D-09, D-10).
//
// WHAT THESE CASES ASSERT, AND WHY THE FIXTURES ARE MANUFACTURED RATHER THAN MEASURED.
// `.planning/phases/32-board-projector-cli-dashboard/32-RESEARCH.md` § Pitfall 3 measured all three
// real boards reachable from this machine and found ZERO WIP mismatches: not one heading's claimed
// live number disagrees with its row count, and not one heading's limit disagrees with the dial. A
// suite that only replayed real boards would therefore report green over a `wip-count` comparison
// that had never once been evaluated. So every conflict kind below is MANUFACTURED from a value the
// case constructs, and the seven-kind inventory is asserted two-sided in both this file and the
// golden — a green suite over five kinds is exactly the shape this repository has already paid for.
//
// THE JOIN IS PURE, AND THE PURITY IS WHAT MAKES THESE CASES CHEAP. `joinSnapshot` takes the six
// already-read source states and returns a snapshot plus conflicts. It opens no file, so a case
// constructs the disagreement directly instead of planting a tree and hoping the reader reaches it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

import {
  CONFLICT_KINDS,
  CONFLICT_KIND_COUNT,
  TICKET_KEYS,
  TICKET_KEY_COUNT,
  joinSnapshot,
  parseTicketDocument,
  sourceValue,
} from "./board-model.js";
import type {
  Conflict,
  ConflictKind,
  ContextTaskState,
  FactoryConfigView,
  FactorySnapshot,
  QueueRow,
  SourceState,
  TicketRecord,
  TraceRow,
} from "./board-model.js";

const JOIN_AT = "2026-01-01T00:00:00.000Z";

const okSource = <T>(value: T): SourceState<T> => ({
  source: "ok",
  value,
  readAt: JOIN_AT,
});

const UNAVAILABLE = { source: "unavailable", present: false } as const;

const LEAN_CONFIG: FactoryConfigView = { mode: null, idPrefix: null, wipLimits: {} };

type JoinOverrides = {
  readonly board?: string | null;
  readonly tickets?: readonly TicketRecord[];
  readonly queue?: readonly QueueRow[];
  readonly context?: readonly ContextTaskState[];
  readonly traceability?: readonly TraceRow[];
  readonly config?: FactoryConfigView | null;
  readonly idPrefix?: string | null;
};

/** Build the six source states a join takes, from the pieces a case cares about. */
function sourcesFor(o: JoinOverrides): FactorySnapshot["sources"] {
  return {
    board:
      o.board === null || o.board === undefined
        ? UNAVAILABLE
        : okSource(parseBoard(o.board, { idPrefix: o.idPrefix ?? null })),
    tickets: okSource(o.tickets ?? []),
    queue: okSource(o.queue ?? []),
    context: okSource(o.context ?? []),
    traceability: okSource(o.traceability ?? []),
    config: o.config === null ? UNAVAILABLE : okSource(o.config ?? LEAN_CONFIG),
  };
}

function joinOf(o: JoinOverrides): { snapshot: FactorySnapshot; conflicts: readonly Conflict[] } {
  return joinSnapshot({
    repoRoot: "/fixture",
    generatedAt: JOIN_AT,
    sources: sourcesFor(o),
  });
}

const ticket = (
  id: string,
  column: string | null,
  status: string | null,
  title = "a ticket",
): TicketRecord => ({ file: `${id}.md`, id, title, column, status });

const kindsOf = (conflicts: readonly Conflict[]): readonly ConflictKind[] =>
  conflicts.map((c) => c.kind);

const only = (conflicts: readonly Conflict[], kind: ConflictKind): readonly Conflict[] =>
  conflicts.filter((c) => c.kind === kind);

describe("board-model — the conflict kinds are a CLOSED set (D-10)", () => {
  it("the conflict-kind set has the expected MEMBERS, in the order the contract lists them", () => {
    expect(
      [...CONFLICT_KINDS],
      "the members and their ORDER are both load-bearing: `conflicts[]` is sorted by kind in " +
        "declaration order, so a reshuffle here silently reorders the committed golden",
    ).toEqual([
      "board-vs-ticket",
      "ticket-unplaced",
      "ticket-duplicated",
      "row-without-file",
      "wip-limit",
      "wip-count",
      "column-missing",
    ]);
  });

  it("the conflict-kind set has the expected COUNT", () => {
    expect(
      CONFLICT_KINDS.length,
      "a conflict kind landed or left. An eighth kind is a DECISION recorded in " +
        "agent-factory/contracts/board.md first, plus a `schemaVersion` bump, plus a regenerated " +
        "scripts/fixtures/board-snapshot/expected-snapshot.json in the same commit — never a " +
        "bumped constant",
    ).toBe(CONFLICT_KIND_COUNT);
    expect(CONFLICT_KIND_COUNT).toBe(7);
    expect(new Set(CONFLICT_KINDS).size, "a kind is spelled twice").toBe(CONFLICT_KINDS.length);
  });
});

describe("board-model — the ticket document grammar is a CLOSED key set", () => {
  it("the ticket key set has the expected MEMBERS and COUNT", () => {
    expect([...TICKET_KEYS]).toEqual([
      "id",
      "title",
      "status",
      "column",
      "size",
      "priority",
      "epic",
      "feature",
    ]);
    expect(
      TICKET_KEYS.length,
      "a ticket key landed or left. The key set is stated in " +
        "agent-factory/contracts/board.md § Ticket documents first — it is a decision, never a " +
        "bumped constant",
    ).toBe(TICKET_KEY_COUNT);
  });

  it("admits a ticket written in the canonical form and reads its column and status", () => {
    const r = parseTicketDocument(
      "---\nid: ABC-014\ntitle: Asset allocation chart\nstatus: in-development\ncolumn: In Development\n---\n\n# ABC-014\n",
    );
    expect(r.ok, r.ok ? "" : r.reason).toBe(true);
    if (!r.ok) return;
    expect(r.value.column).toBe("In Development");
    expect(r.value.status).toBe("in-development");
    expect(r.value.id).toBe("ABC-014");
  });

  it("REFUSES a key outside the closed set by name rather than ignoring it", () => {
    const r = parseTicketDocument("---\nid: ABC-014\ntools: Bash\n---\n");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("unknown-key");
    expect(r.reason).toMatch(/tools/);
  });

  it("REFUSES a document with no frontmatter region at all", () => {
    const r = parseTicketDocument("# ABC-014\n\nno frontmatter here\n");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("no-opening-delimiter");
  });
});

describe("board-model — joinSnapshot derives every conflict kind (D-08, D-09, D-10)", () => {
  const BOARD_MIN = [
    "# Board",
    "",
    "## In Development (WIP 1/3)",
    "",
    "- [ABC-001] a row",
    "",
  ].join("\n");

  it("a row whose ticket file names a DIFFERENT column is one `board-vs-ticket`", () => {
    const { conflicts } = joinOf({
      board: BOARD_MIN,
      tickets: [ticket("ABC-001", "In Review", "in-review")],
    });
    const found = only(conflicts, "board-vs-ticket");
    expect(found).toHaveLength(1);
    expect(found[0]?.ticketId).toBe("ABC-001");
    expect(found[0]?.expected).toBe("In Review");
    expect(found[0]?.actual).toBe("In Development");
    expect(found[0]?.source).toBe("tickets");
  });

  it("a ticket whose `status` is not the kebab of its `column` is one `board-vs-ticket`", () => {
    const { conflicts } = joinOf({
      board: BOARD_MIN,
      tickets: [ticket("ABC-001", "In Development", "ready")],
    });
    const found = only(conflicts, "board-vs-ticket");
    expect(found).toHaveLength(1);
    expect(found[0]?.expected, "the kebab rule the validator already applies").toBe(
      "in-development",
    );
    expect(found[0]?.actual).toBe("ready");
  });

  it("a ticket file with NO board row is one `ticket-unplaced`", () => {
    const { conflicts } = joinOf({
      board: BOARD_MIN,
      tickets: [
        ticket("ABC-001", "In Development", "in-development"),
        ticket("ABC-777", "In Development", "in-development"),
      ],
    });
    const found = only(conflicts, "ticket-unplaced");
    expect(found).toHaveLength(1);
    expect(found[0]?.ticketId).toBe("ABC-777");
    expect(found[0]?.source).toBe("tickets");
  });

  it("one ID under TWO headings is one `ticket-duplicated` naming both, and BOTH rows render", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 1/3)",
      "",
      "- [ABC-001] a row",
      "",
      "## In Review (WIP 1/3)",
      "",
      "- [ABC-001] the same id again",
      "",
    ].join("\n");
    const { conflicts, snapshot } = joinOf({
      board,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
    });
    const found = only(conflicts, "ticket-duplicated");
    expect(found).toHaveLength(1);
    expect(found[0]?.ticketId).toBe("ABC-001");
    expect(found[0]?.actual).toMatch(/In Development/);
    expect(found[0]?.actual).toMatch(/In Review/);
    const rendered = (snapshot.board?.columns ?? []).flatMap((c) =>
      c.rows.filter((r) => r.id === "ABC-001").map(() => c.name),
    );
    expect(rendered, "the projector never hides a line in order to report a conflict about it").toEqual(
      ["In Development", "In Review"],
    );
  });

  it("two rows with the same ID under the SAME heading is ONE conflict naming that column twice", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 2/3)",
      "",
      "- [ABC-001] a row",
      "- [ABC-001] the same id, adjacent",
      "",
    ].join("\n");
    const { conflicts, snapshot } = joinOf({
      board,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
    });
    const found = only(conflicts, "ticket-duplicated");
    expect(found, "not a merge and not a silent dedupe").toHaveLength(1);
    expect(found[0]?.actual).toBe("In Development, In Development");
    expect(snapshot.board?.columns[0]?.rows.map((r) => r.id)).toEqual(["ABC-001", "ABC-001"]);
  });

  it("a board row with no ticket file is one `row-without-file` and the row still renders", () => {
    const { conflicts, snapshot } = joinOf({ board: BOARD_MIN, tickets: [] });
    const found = only(conflicts, "row-without-file");
    expect(found).toHaveLength(1);
    expect(found[0]?.ticketId).toBe("ABC-001");
    expect(found[0]?.expected).toBe("plans/tickets/ABC-001.md");
    expect(found[0]?.source).toBe("board");
    expect(snapshot.board?.columns[0]?.rows).toHaveLength(1);
  });

  it("a heading limit that disagrees with `wip_limits` is one `wip-limit` carrying both numbers", () => {
    const { conflicts } = joinOf({
      board: BOARD_MIN,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      config: { mode: "lean", idPrefix: null, wipLimits: { "In Development": 5 } },
    });
    const found = only(conflicts, "wip-limit");
    expect(found).toHaveLength(1);
    expect(found[0]?.column).toBe("In Development");
    expect(found[0]?.expected).toBe("5");
    expect(found[0]?.actual).toBe("3");
    expect(found[0]?.source).toBe("config");
  });

  it("a claimed live number that disagrees with the counted rows is one `wip-count`", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 2/3)",
      "",
      "- [ABC-001] a row",
      "- [ABC-002] another row",
      "- [ABC-003] a third row",
      "",
    ].join("\n");
    const { conflicts } = joinOf({
      board,
      tickets: [
        ticket("ABC-001", "In Development", "in-development"),
        ticket("ABC-002", "In Development", "in-development"),
        ticket("ABC-003", "In Development", "in-development"),
      ],
      config: { mode: "lean", idPrefix: null, wipLimits: { "In Development": 3 } },
    });
    const found = only(conflicts, "wip-count");
    expect(found).toHaveLength(1);
    expect(found[0]?.expected, "claimed and limit").toBe("claimed 2, limit 3");
    expect(found[0]?.actual, "counted").toBe("counted 3");
    expect(found[0]?.source).toBe("board");
  });

  it("an EPIC row under a limited heading is excluded from the `wip-count` comparison (D-02)", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 1/3)",
      "",
      "- [ABC-001] a row",
      "- [EPIC-006] an epic, a separate class",
      "",
    ].join("\n");
    const { conflicts, snapshot } = joinOf({
      board,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
    });
    expect(
      snapshot.board?.epicRows.map((r) => r.id),
      "PREMISE: the epic row never reached `epicRows`, so its exclusion was never evaluated",
    ).toEqual(["EPIC-006"]);
    expect(
      only(conflicts, "wip-count"),
      "counted 1 against a claimed 1 — the epic row is not a ticket",
    ).toEqual([]);
    expect(
      only(conflicts, "ticket-unplaced"),
      "an epic row is never joined against plans/tickets/",
    ).toEqual([]);
  });

  it("a configured column with no heading is one `column-missing`", () => {
    const { conflicts } = joinOf({
      board: BOARD_MIN,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      config: {
        mode: "lean",
        idPrefix: null,
        wipLimits: { "In Development": 3, "Ready for UAT": 4 },
      },
    });
    const found = only(conflicts, "column-missing");
    expect(found).toHaveLength(1);
    expect(found[0]?.column).toBe("Ready for UAT");
    expect(found[0]?.source).toBe("config");
  });

  it("a heading column ABSENT from the dial is legal and noted, never refused (D-08)", () => {
    const board = [
      "# Board",
      "",
      "## Backlog (WIP unlimited)",
      "",
      "## Blocked (visible, time-tracked)",
      "",
    ].join("\n");
    const { conflicts, snapshot } = joinOf({
      board,
      config: { mode: "lean", idPrefix: null, wipLimits: {} },
    });
    expect(conflicts).toEqual([]);
    expect(
      (snapshot.board?.columns ?? []).map((c) => c.kind),
      "noted as unlimited-or-blocked in the column record rather than raised as a conflict",
    ).toEqual(["unlimited", "blocked"]);
  });

  it("emits `conflicts[]` in a deterministic total order, whatever order the sources arrive in", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 9/3)",
      "",
      "- [ABC-003] a row",
      "- [ABC-001] a row",
      "",
      "## In Review (WIP 0/3)",
      "",
      "- [ABC-003] the same id again",
      "",
    ].join("\n");
    const tickets = [
      ticket("ABC-001", "In Review", "in-review"),
      ticket("ABC-900", "In Development", "in-development"),
    ];
    const config: FactoryConfigView = {
      mode: "lean",
      idPrefix: null,
      wipLimits: { "In Development": 5, "Ready": 8, "In Review": 3 },
    };

    const forward = joinOf({ board, tickets, config }).conflicts;
    const reversed = joinOf({
      board,
      tickets: [...tickets].reverse(),
      config: {
        ...config,
        wipLimits: Object.fromEntries(Object.entries(config.wipLimits).reverse()),
      },
    }).conflicts;

    expect(forward.length, "PREMISE: the ordering case measured an empty list").toBeGreaterThan(3);
    expect(reversed).toEqual(forward);

    const order = kindsOf(forward).map((k) => CONFLICT_KINDS.indexOf(k));
    expect(
      [...order].sort((a, b) => a - b),
      "kind in DECLARATION order is the primary sort key",
    ).toEqual(order);
  });

  it("a bracket carrying a path separator is UNPARSED, raises no conflict, and builds no path", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 0/3)",
      "",
      "- [../../etc/passwd] a traversal attempt",
      "- [ABC/001] a separator inside an otherwise plausible id",
      "",
    ].join("\n");
    const { conflicts, snapshot } = joinOf({ board, tickets: [] });
    expect(
      snapshot.board?.unparsed.map((u) => u.text),
      "PREMISE: the traversal lines never reached `unparsed`, so nothing below was evaluated",
    ).toEqual(["- [../../etc/passwd] a traversal attempt", "- [ABC/001] a separator inside an otherwise plausible id"]);
    expect(snapshot.board?.columns[0]?.rows, "no row was opened for either line").toEqual([]);
    expect(conflicts, "an unparsed line is a parser outcome, never a conflict").toEqual([]);

    // STRUCTURAL: the join builds no path at all, so no board byte can reach one (T-32-02).
    const src = readFileSync(join(ROOT, "scripts", "board-model.ts"), "utf8");
    const code = src
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    expect(code, "board-model.ts must import nothing from node:path").not.toMatch(/node:path/);
    expect(code, "board-model.ts must import nothing from node:fs").not.toMatch(/node:fs/);
  });

  it("raises NO conflict when the board could not be read — a missing source is not a disagreement", () => {
    const { conflicts, snapshot } = joinOf({
      board: null,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      config: { mode: "lean", idPrefix: null, wipLimits: { "In Development": 3 } },
    });
    expect(snapshot.board).toBeNull();
    expect(conflicts).toEqual([]);
  });

  it("threads every source state through unchanged and stamps the published schemaVersion", () => {
    const { snapshot } = joinOf({
      board: BOARD_MIN,
      queue: [{ task: "t1", by: "engineer", at: "2026-01-01T00:00:00Z" }],
      context: [{ task: "t1", noteCount: 2, liveCount: 1, latestAt: "x", latestKind: "decision" }],
      traceability: [{ ticket: "ABC-001", title: "a row", status: "Done", cells: ["ABC-001"] }],
    });
    expect(snapshot.schemaVersion).toBe(SCHEMA_VERSION);
    expect(sourceValue(snapshot.sources.queue)?.length).toBe(1);
    expect(sourceValue(snapshot.sources.context)?.length).toBe(1);
    expect(sourceValue(snapshot.sources.traceability)?.length).toBe(1);
    expect(snapshot.repoRoot).toBe("/fixture");
    expect(snapshot.generatedAt).toBe(JOIN_AT);
  });
});

describe("board-model — the configured id prefix is enforced by the parse, not by a conflict (D-02)", () => {
  it("refuses a row whose prefix disagrees with the dial, and admits one that agrees", () => {
    const board = [
      "# Board",
      "",
      "## In Development (WIP 0/3)",
      "",
      "- [ABC-001] the configured prefix",
      "- [XYZ-001] a foreign prefix",
      "- [EPIC-006] an epic, exempt from the prefix rule",
      "",
    ].join("\n");
    const withPrefix = parseBoard(board, { idPrefix: "ABC" });
    expect(withPrefix.columns[0]?.rows.map((r) => r.id)).toEqual(["ABC-001"]);
    expect(withPrefix.epicRows.map((r) => r.id)).toEqual(["EPIC-006"]);
    expect(withPrefix.unparsed.map((u) => u.text)).toEqual(["- [XYZ-001] a foreign prefix"]);

    const withoutPrefix = parseBoard(board);
    expect(
      withoutPrefix.columns[0]?.rows.map((r) => r.id),
      "with no dial the prefix rule has nothing to compare against, so both rows are admitted",
    ).toEqual(["ABC-001", "XYZ-001"]);
  });
});
