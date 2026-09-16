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
  PRESENCE_DEPENDENT_CONFLICT_KINDS,
  TICKET_CONTROL,
  TICKET_KEYS,
  TICKET_KEY_COUNT,
  TICKET_REFUSAL_CODES,
  TICKET_REFUSAL_CODE_COUNT,
  joinSnapshot,
  normalizeDocument,
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
  StaleReason,
  TicketRecord,
  TraceRow,
  UnadmittedTicket,
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
  /** The reader's unadmitted half (plan 32-15). Defaulted EMPTY here, never on `JoinInputs`. */
  readonly unadmittedTickets?: readonly UnadmittedTicket[];
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
    unadmittedTickets: o.unadmittedTickets ?? [],
  });
}

/**
 * A ticket record whose file is named after its identifier — the agreeing shape.
 *
 * `stem` IS DERIVED FROM `file` RATHER THAN TYPED BESIDE IT, here and in `mismatched` below, so a
 * case cannot accidentally construct a record whose published stem disagrees with its own file name
 * unless it MEANS to. The one case that means to is the one that says so in its name.
 */
const ticket = (
  id: string,
  column: string | null,
  status: string | null,
  title = "a ticket",
): TicketRecord => ({ file: `${id}.md`, stem: id, id, title, column, status });

/**
 * A record whose FILE STEM and DECLARED IDENTIFIER disagree — the third population (plan 32-33).
 *
 * `plans/tickets/<stem>.md` declares `<id>`. This is what the reader hands the join for a document
 * it listed, opened, parsed and admitted under an identifier that is not its file name.
 */
const mismatched = (
  stem: string,
  id: string,
  column: string | null,
  status: string | null,
  title = "a ticket",
): TicketRecord => ({ file: `${stem}.md`, stem, id, title, column, status });

/** Give a hand-written record literal the stem its own file name implies. */
const withStem = (r: Omit<TicketRecord, "stem">): TicketRecord => ({
  ...r,
  stem: r.file.slice(0, -".md".length),
});

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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-09 — THE PRESENCE-DEPENDENT SPLIT, DERIVED RATHER THAN RESTATED.
//
// CR-02's consequence: with `plans/tickets/` unreadable, the join asserted that seven ticket files
// did not exist, six of which did. The fix gates the two kinds whose derivation depends on a
// COMPLETE listing. The split itself is the thing that can rot — a future eighth kind lands in
// `CONFLICT_KINDS` and nobody asks which side of this line it falls on — so the COMPLEMENT is
// derived here from the two sets rather than typed out, and both cardinalities are pinned two-sided.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The gated set, as a set, for the complement arithmetic below. */
const PRESENCE_DEPENDENT = new Set<string>(PRESENCE_DEPENDENT_CONFLICT_KINDS);

/** DERIVED, never typed: every kind that is NOT presence-dependent. */
const PRESENCE_INDEPENDENT = CONFLICT_KINDS.filter((k) => !PRESENCE_DEPENDENT.has(k));

describe("board-model — the presence-dependent conflict split (plan 32-09, CR-02)", () => {
  it("names exactly the two kinds that assert something about a COMPLETE tickets listing", () => {
    expect(
      [...PRESENCE_DEPENDENT_CONFLICT_KINDS].sort(),
      "these two, and only these two, say something a failed directory listing cannot support: " +
        "`row-without-file` claims no ticket file carries an identifier, and `ticket-unplaced` " +
        "raises a finding per ticket record over a set the listing defines. Moving a kind across " +
        "this line is a DECISION recorded in agent-factory/contracts/board.md first",
    ).toEqual(["row-without-file", "ticket-unplaced"]);
  });

  it("pins the gated cardinality two-sided", () => {
    expect(PRESENCE_DEPENDENT_CONFLICT_KINDS.length).toBe(2);
    expect(PRESENCE_DEPENDENT.size, "a kind is spelled twice in the gated set").toBe(2);
  });

  it("pins the COMPLEMENT two-sided against CONFLICT_KINDS, derived rather than typed", () => {
    expect(
      PRESENCE_INDEPENDENT.length,
      "the ungated set is CONFLICT_KINDS minus the gated set. If this number moved, an eighth " +
        "conflict kind landed and nobody decided which side of the presence-dependence line it " +
        "falls on — that is a DECISION for agent-factory/contracts/board.md, never a bumped " +
        "constant here",
    ).toBe(CONFLICT_KIND_COUNT - PRESENCE_DEPENDENT_CONFLICT_KINDS.length);
    expect(PRESENCE_INDEPENDENT.length).toBe(5);
    expect([...PRESENCE_INDEPENDENT]).toEqual([
      "board-vs-ticket",
      "ticket-duplicated",
      "wip-limit",
      "wip-count",
      "column-missing",
    ]);
  });

  it("holds every gated kind inside CONFLICT_KINDS — the subset relation, asserted", () => {
    expect(
      [...PRESENCE_DEPENDENT_CONFLICT_KINDS].filter(
        (k) => !(CONFLICT_KINDS as readonly string[]).includes(k),
      ),
      "the gated set names a kind the conflict set does not declare",
    ).toEqual([]);
  });
});

/** A board carrying every shape the gating case needs, in one document. */
const GATING_BOARD =
  "## Backlog (WIP unlimited)\n" +
  "- [ABC-001] one\n" +
  "- [ABC-999] a row whose ticket file does not exist\n" +
  "## Done (WIP unlimited)\n" +
  "- [ABC-001] the same identifier again, under a second heading\n";

/** The ticket records the gating case joins against. `ABC-500` has no row; `ABC-001` disagrees. */
const GATING_TICKETS: readonly TicketRecord[] = [
  ticket("ABC-001", "Done", "done"),
  ticket("ABC-500", "Backlog", "backlog"),
];

/** A `stale` tickets source carrying a value — the arm a carried-forward listing lands on. */
const staleTickets = (
  value: readonly TicketRecord[],
  reason: StaleReason,
): SourceState<readonly TicketRecord[]> => ({
  source: "stale",
  value,
  readAt: JOIN_AT,
  stale: { reason, since: JOIN_AT },
});

/** Join `GATING_BOARD` with the tickets source forced into a named state. */
function gatingJoin(tickets: SourceState<readonly TicketRecord[]>): readonly Conflict[] {
  return joinSnapshot({
    repoRoot: "/fixture",
    generatedAt: JOIN_AT,
    sources: { ...sourcesFor({ board: GATING_BOARD, tickets: GATING_TICKETS }), tickets },
    unadmittedTickets: [],
  }).conflicts;
}

describe("board-model — a non-ok tickets source gates the presence-dependent kinds (plan 32-09)", () => {
  it("PREMISE: with the tickets source `ok`, BOTH gated kinds are actually derived", () => {
    const kinds = kindsOf(gatingJoin(okSource(GATING_TICKETS)));
    // Without this premise every assertion below is satisfiable by a join that derives nothing at
    // all — the vacuous green this repository has recorded a false harness premise for six times.
    expect(
      [...PRESENCE_DEPENDENT_CONFLICT_KINDS].filter((k) => !kinds.includes(k)),
      "PREMISE: the fixture did not reach one of the gated kinds, so the gating cases below " +
        "measure nothing",
    ).toEqual([]);
    expect(only(gatingJoin(okSource(GATING_TICKETS)), "row-without-file").length).toBe(1);
    expect(only(gatingJoin(okSource(GATING_TICKETS)), "ticket-unplaced").length).toBe(1);
  });

  it("derives NEITHER gated kind when the tickets source is stale with reason `eacces`", () => {
    const kinds = kindsOf(gatingJoin(staleTickets(GATING_TICKETS, "eacces")));
    expect(
      kinds.filter((k) => PRESENCE_DEPENDENT.has(k)),
      "a conflict derived from a listing that FAILED is an assertion about a filesystem nobody " +
        "read — CR-02's seven fabricated findings against six files that exist",
    ).toEqual([]);
  });

  it("derives NEITHER gated kind when the tickets source is stale with reason `bounded`", () => {
    // `bounded` is the subtle one: the listing SUCCEEDED and carries real names — just not all of
    // them. "No ticket file carries that identifier" is false about a prefix by construction.
    const kinds = kindsOf(gatingJoin(staleTickets(GATING_TICKETS, "bounded")));
    expect(kinds.filter((k) => PRESENCE_DEPENDENT.has(k))).toEqual([]);
  });

  it("derives NEITHER gated kind when the tickets source is unavailable", () => {
    const kinds = kindsOf(gatingJoin(UNAVAILABLE));
    expect(kinds.filter((k) => PRESENCE_DEPENDENT.has(k))).toEqual([]);
  });

  it("KEEPS deriving the ungated kinds while the tickets source is stale", () => {
    const kinds = kindsOf(gatingJoin(staleTickets(GATING_TICKETS, "eacces")));
    // `board-vs-ticket` is a claim about a document that WAS read; `ticket-duplicated` is a claim
    // about the board alone. Gating those too would turn one unreadable directory into silence
    // about disagreements the projector can still see — the opposite error, equally wrong.
    expect(
      only(gatingJoin(staleTickets(GATING_TICKETS, "eacces")), "board-vs-ticket").length,
      "the ticket file that WAS read still disagrees with its row, and the badge does not excuse " +
        "the projector from saying so",
    ).toBe(1);
    expect(only(gatingJoin(staleTickets(GATING_TICKETS, "eacces")), "ticket-duplicated").length).toBe(
      1,
    );
    expect(kinds.length, "exactly the two ungated findings this fixture manufactures").toBe(2);
  });
});


// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE PRESENCE QUESTION IS ANSWERED PER IDENTIFIER (plan 32-15, `32-REVIEW.md` CR-01)
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// The gate plan 32-09 added asks "was the LISTING obtained", which is a question about a directory
// and is right for what it asks. It cannot answer "is there a file for THIS identifier", and
// answering that from the parse SUCCESSES alone made the projector assert that a file which exists,
// which it read, and which it refused by name, is not there.
//
// THE CONVERSE IS ASKED HERE TOO, IN BOTH DIRECTIONS. Four cases, because a fix that is correct for
// the identifier it was written for and wrong for the one beside it is the failure class this
// repository has recorded in five consecutive rounds.

const ABSENCE_SENTENCE = "no ticket file carries that identifier";

/** A board whose one column carries three identifiers in the three populations under test. */
const PRESENCE_BOARD =
  "## In Development (WIP unlimited)\n" +
  "- [ABC-001] Admitted, with a file\n" +
  "- [ABC-900] Refused, with a file\n" +
  "- [ABC-777] Absent, with no file\n";

const REFUSED = (id: string, code = "unknown-key"): UnadmittedTicket => ({ id, code });

describe("board-model — a REFUSED document is never reported as an ABSENT one (plan 32-15)", () => {
  it("(a) a row whose identifier is UNADMITTED names the refusal and asserts no absence", () => {
    const conflicts = joinOf({
      board: PRESENCE_BOARD,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      unadmittedTickets: [REFUSED("ABC-900")],
    }).conflicts;

    const raised = only(conflicts, "row-without-file").filter((c) => c.ticketId === "ABC-900");
    expect(raised.length).toBe(1);
    expect(raised[0]?.actual).not.toBe(ABSENCE_SENTENCE);
    expect(raised[0]?.actual).toContain("unknown-key");
    expect(raised[0]?.actual).toContain("plans/tickets/ABC-900.md");
    // The KIND does not split and `expected` does not move: D-10 makes the kind set part of the
    // published shape, and the honesty is reachable inside the existing kind.
    expect(raised[0]?.kind).toBe("row-without-file");
    expect(raised[0]?.expected).toBe("plans/tickets/ABC-900.md");
    expect(raised[0]?.column).toBe("In Development");
  });

  it("(b) a row whose identifier is GENUINELY ABSENT carries the UNCHANGED absence sentence", () => {
    const conflicts = joinOf({
      board: PRESENCE_BOARD,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      unadmittedTickets: [REFUSED("ABC-900")],
    }).conflicts;

    const raised = only(conflicts, "row-without-file").filter((c) => c.ticketId === "ABC-777");
    expect(raised.length).toBe(1);
    // BYTE FOR BYTE. An identifier the reader never saw is still an identifier no file carries, and
    // this sentence is what a `--json` consumer and the committed golden both already read.
    expect(raised[0]?.actual).toBe(ABSENCE_SENTENCE);
  });

  it("(c) an UNADMITTED identifier with no row raises NO `ticket-unplaced`", () => {
    const conflicts = joinOf({
      // A board that names neither, so the only thing that could speak for ABC-900 is the refusal.
      board: "## In Development (WIP unlimited)\n- [ABC-001] Admitted, with a file\n",
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      unadmittedTickets: [REFUSED("ABC-900", "duplicate-key")],
    }).conflicts;

    // Raising it would be the same fabrication in the converse direction: a positive claim that a
    // document the grammar refused to read IS a ticket. Its identity is a file stem, not a statement.
    expect(only(conflicts, "ticket-unplaced").map((c) => c.ticketId)).toEqual([]);
  });

  it("(d) an ADMITTED ticket with no row still raises `ticket-unplaced`, exactly as before", () => {
    const conflicts = joinOf({
      board: "## In Development (WIP unlimited)\n- [ABC-001] Admitted, with a file\n",
      tickets: [
        ticket("ABC-001", "In Development", "in-development"),
        ticket("ABC-500", "In Development", "in-development"),
      ],
      unadmittedTickets: [REFUSED("ABC-900")],
    }).conflicts;

    // PREMISE for (c): with the same board shape, an ADMITTED unplaced ticket does reach the arm, so
    // (c)'s empty result measures the unadmitted entry rather than a silent arm.
    const unplaced = only(conflicts, "ticket-unplaced");
    expect(unplaced.map((c) => c.ticketId)).toEqual(["ABC-500"]);
    expect(unplaced[0]?.actual).toBe("no row names ABC-500");
  });

  it("stays silent on BOTH gated kinds when the tickets source is not `ok`, whatever it holds", () => {
    // The unadmitted set does not reopen a gate plan 32-09 closed: with the listing not obtained,
    // neither presence-dependent kind is derived, however many refusals the reader carries.
    const conflicts = joinSnapshot({
      repoRoot: "/fixture",
      generatedAt: JOIN_AT,
      sources: {
        ...sourcesFor({ board: PRESENCE_BOARD, tickets: [] }),
        tickets: staleTickets([], "eacces"),
      },
      unadmittedTickets: [REFUSED("ABC-900"), REFUSED("ABC-777")],
    }).conflicts;

    expect(conflicts.filter((c) => PRESENCE_DEPENDENT.has(c.kind))).toEqual([]);
  });

  it("produces the committed sentence for EVERY row when the unadmitted set is empty", () => {
    // The pristine shape: with no document refused, this change moves nothing. Both rows without a
    // file read exactly as they did before plan 32-15.
    const conflicts = joinOf({
      board: PRESENCE_BOARD,
      tickets: [ticket("ABC-001", "In Development", "in-development")],
      unadmittedTickets: [],
    }).conflicts;

    const actuals = only(conflicts, "row-without-file").map((c) => c.actual);
    expect(actuals.length).toBe(2);
    expect(new Set(actuals)).toEqual(new Set([ABSENCE_SENTENCE]));
  });

  it("dedupes per identifier: two rows naming one refused identifier raise ONE conflict", () => {
    const conflicts = joinOf({
      board:
        "## In Development (WIP unlimited)\n- [ABC-900] Refused\n" +
        "## Done (WIP unlimited)\n- [ABC-900] Refused again\n",
      tickets: [],
      unadmittedTickets: [REFUSED("ABC-900", "control-character")],
    }).conflicts;

    const raised = only(conflicts, "row-without-file");
    expect(raised.length).toBe(1);
    expect(raised[0]?.actual).toContain("control-character");
    // The duplicate is still reported by its own kind: this arm dedupes, it does not hide.
    expect(only(conflicts, "ticket-duplicated").map((c) => c.ticketId)).toEqual(["ABC-900"]);
  });
});

describe("board-model — one identifier is resolved once and read from one map (plan 32-17, WR-08)", () => {
  /** Two records claiming one identifier, in DIFFERENT files — the on-disk shape WR-08 names. */
  const DUP: readonly TicketRecord[] = [
    withStem({
      file: "ABC-014-copy.md",
      id: "ABC-014",
      title: "The copy",
      column: "Backlog",
      status: "done",
    }),
    withStem({
      file: "ABC-014.md",
      id: "ABC-014",
      title: "The original",
      column: "Backlog",
      status: "done",
    }),
  ];

  it("the status arm fires ONCE, not once per file", () => {
    // `Backlog` kebabs to `backlog`, so both records disagree IDENTICALLY — which is what makes the
    // double report survive the total order: the tiebreak chain ends on `expected`, equal for both.
    const { conflicts } = joinOf({
      board: "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n",
      tickets: DUP,
    });
    expect(only(conflicts, "board-vs-ticket").length).toBe(1);
    expect(only(conflicts, "board-vs-ticket")[0]?.expected).toBe("backlog");
  });

  it("the unplaced arm fires ONCE, not once per file", () => {
    const { conflicts } = joinOf({
      board: "## Backlog (WIP unlimited)\n- [ABC-001] Something else\n",
      tickets: DUP,
    });
    expect(only(conflicts, "ticket-unplaced").map((c) => c.ticketId)).toEqual(["ABC-014"]);
  });

  it("the COLUMN arm was already per placement, and stays that way", () => {
    // ARM ONE iterates `placements` and looks the identifier UP, so it never had this defect. It is
    // asserted here anyway: the fix moves two arms onto `ticketById`, and a case that only measures
    // the two moved arms says nothing about whether the third still agrees with them.
    const { conflicts } = joinOf({
      board: "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n",
      tickets: [
        withStem({ file: "a.md", id: "ABC-014", title: "a", column: "Done", status: "done" }),
        withStem({ file: "b.md", id: "ABC-014", title: "b", column: "Done", status: "done" }),
      ],
    });
    const arm = only(conflicts, "board-vs-ticket");
    expect(arm.length).toBe(1);
    expect(arm[0]?.actual).toBe("Backlog");
    expect(arm[0]?.expected).toBe("Done");
  });

  it("FIRST BY NAME wins, and the arms agree about which record that is", () => {
    // The two records disagree with each other, so the surviving one is observable rather than
    // inferred. `ABC-014-copy.md` sorts first (`-` is 0x2D, `.` is 0x2E), and the reader hands the
    // join its records in listing order — which plan 32-17 made sorted.
    const { conflicts } = joinOf({
      board: "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n",
      tickets: [
        withStem({
          file: "ABC-014-copy.md",
          id: "ABC-014",
          title: "c",
          column: "Backlog",
          status: "done",
        }),
        withStem({
          file: "ABC-014.md",
          id: "ABC-014",
          title: "o",
          column: "Backlog",
          status: "blocked",
        }),
      ],
    });
    const arm = only(conflicts, "board-vs-ticket");
    expect(arm.length).toBe(1);
    expect(
      arm[0]?.actual,
      "the arm read the SECOND record, so the join's answer depends on which file the iteration " +
        "reached last rather than on a stated rule",
    ).toBe("done");
  });

  it("no arm in the join iterates the RAW ticket list (derived from the file)", () => {
    // DERIVED, NOT REMEMBERED. The defect is one `for (const t of tickets)` in a function this long;
    // reading it once and trusting the memory of it is how the second one gets added back.
    //
    // THE PREMISE MOVED WITH THE BUILDER, AND WAS REPAIRED RATHER THAN DROPPED (plan 32-33). Until
    // this round the one legitimate reader of the raw list was a loop INSIDE `joinSnapshot`, so the
    // case asserted exactly one such loop there. `ticketPopulations` now owns every index of the
    // ticket population, so the same question is asked of two bodies instead of one: the join reads
    // the raw list NOWHERE, and the builder reads it in exactly one place. Asserting nothing about
    // the builder would let the indexes drift into a function this case never looks at.
    const source = readFileSync(join(ROOT, "scripts", "board-model.ts"), "utf8");
    const RAW_LOOP = /for \(const \w+ of (?:inputs\.)?tickets\b[^\n]*/g;
    const bodyOf = (name: string): string => {
      const start = source.indexOf(`export function ${name}`);
      expect(start, `PREMISE: \`${name}\` was not found, so this case scanned nothing`).toBeGreaterThan(
        0,
      );
      return source.slice(start, source.indexOf("\n}\n", start));
    };

    const body = bodyOf("joinSnapshot");
    expect(
      body.match(RAW_LOOP) ?? [],
      "every arm consuming the ticket population reads the indexes `ticketPopulations` built, so " +
        "one identifier is resolved once and reported once. An arm added against the raw list is " +
        "the odd one out.",
    ).toEqual([]);
    expect(
      body.includes("ticketPopulations("),
      "PREMISE: the join does not call the builder at all, so the emptiness above is vacuously " +
        "true of a join that lost the population entirely",
    ).toBe(true);
    expect(
      body.includes("ticketById.values()"),
      "PREMISE: no arm reads `ticketById.values()` either, so the assertion above is vacuously " +
        "true of a join that lost both arms",
    ).toBe(true);

    // THE BUILDER IS THE ONE LEGITIMATE READER, and its loop is identified by what it DOES rather
    // than excluded by position — a line-number exemption rots the first time the code above grows.
    const builder = bodyOf("ticketPopulations");
    const loops = builder.match(RAW_LOOP) ?? [];
    expect(
      loops.length,
      "PREMISE: the builder does not read the raw list, so `byId` and `byStem` are being filled " +
        "from something other than the records the reader handed over",
    ).toBe(1);
    expect(loops[0]?.includes("byId.set") || builder.includes("byId.set")).toBe(true);
    expect(
      builder.includes("byStem.set"),
      "PREMISE: the builder no longer indexes the population by FILE STEM, which is the measured " +
        "set the third presence arm is answered from",
    ).toBe(true);
  });

  it("changes nothing when every identifier is claimed once", () => {
    const { conflicts } = joinOf({
      board: "## Backlog (WIP unlimited)\n- [ABC-014] Asset allocation chart\n",
      tickets: [ticket("ABC-014", "Backlog", "done")],
    });
    expect(only(conflicts, "board-vs-ticket").length).toBe(1);
    expect(only(conflicts, "ticket-unplaced")).toEqual([]);
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-05 TASK 3 — THE COMMITTED GOLDEN FREEZES THE PUBLISHED SHAPE (D-19, DASH-08).
//
// VERSION 2 SINCE PLAN 32-33, which published `TicketRecord.stem`. The version number below is
// pinned two-sided against the golden AND against a literal, because a golden regenerated in the
// same commit as a shape change agrees with the module by construction: only a literal a human had
// to retype records that the move was a decision rather than a regeneration.
//
// WHY A GOLDEN AND NOT MORE ASSERTIONS. The cases above assert PROPERTIES of the join: seven kinds,
// one order, nothing resolved silently. None of them pins the SHAPE — the field names a future web
// renderer reads, which DASH-08 promises it can consume unchanged. A property suite stays green
// through a rename. A committed golden does not.
//
// THE TIMESTAMPS ARE NORMALIZED BEFORE COMPARISON, AND THAT IS NOT A WEAKENING. A golden embedding
// the wall clock fails on its second run, so it gets hand-edited, so within a week it means nothing.
// The comparison is over the SHAPE and the VALUES that are functions of the committed inputs; the
// minute the test ran is not one of those. The same applies to the absolute repository path, which
// differs on every machine.
//
// THE INVENTORY CASE IS THE ONE THAT MATTERS MOST. Research measured that no real board produces a
// WIP mismatch, so a suite that never asserted the seven-kind inventory would report green over a
// golden holding five kinds and nobody would know. It derives the kind set FROM THE GOLDEN FILE —
// not from the live read — and asserts equality with `CONFLICT_KINDS` in both directions, behind a
// PREMISE assertion that the file parsed and its `conflicts[]` is non-empty.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

import { existsSync, writeFileSync } from "node:fs";
import { readSnapshot } from "./board-read.js";

const FIXTURE_DIR = join(ROOT, "scripts", "fixtures", "board-snapshot");
const GOLDEN_PATH = join(FIXTURE_DIR, "expected-snapshot.json");

/** The one placeholder every wall-clock field is normalized to. */
const FIXED_INSTANT = "1970-01-01T00:00:00.000Z";

/** The one placeholder every absolute repository path is normalized to. */
const FIXED_ROOT = "<fixture-root>";

/** Every key whose value is a wall clock rather than a function of the committed inputs. */
const INSTANT_KEYS = new Set(["readAt", "generatedAt", "since"]);

/**
 * Normalize a read result into the value the golden freezes.
 *
 * Two substitutions and no others: a wall-clock field becomes `FIXED_INSTANT`, and any string
 * carrying the fixture's absolute path — `repoRoot`, a `readErrors[].path`, a message quoting one —
 * has that prefix replaced. Everything else is compared exactly, which is the whole point.
 */
function normalize(value: unknown, key: string | null, root: string): unknown {
  if (typeof value === "string") {
    if (key !== null && INSTANT_KEYS.has(key)) return FIXED_INSTANT;
    return value.split(root).join(FIXED_ROOT);
  }
  if (Array.isArray(value)) return value.map((v) => normalize(v, null, root));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    // SORTED KEYS, so the serialized bytes do not depend on insertion order anywhere in the tree.
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = normalize((value as Record<string, unknown>)[k], k, root);
    }
    return out;
  }
  return value;
}

/** Serialize the fixture read deterministically: sorted keys, two-space indent, one trailing LF. */
function serializeFixture(): string {
  const result = readSnapshot(FIXTURE_DIR);
  // The RESOLVED root, because `readSnapshot` resolves symlinks and `/var` is `/private/var` here.
  const root = result.snapshot.repoRoot;
  return `${JSON.stringify(normalize(result, null, root), null, 2)}\n`;
}

/** The first line at which two documents differ, with both lines, so a failure can be acted on. */
function firstDifference(a: string, b: string): string {
  const left = a.split("\n");
  const right = b.split("\n");
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] === right[i]) continue;
    return (
      `first difference at line ${i + 1}\n` +
      `  rendered: ${left[i] ?? "<end of document>"}\n` +
      `  golden:   ${right[i] ?? "<end of document>"}`
    );
  }
  return "the documents are equal line by line but differ in length";
}

/**
 * The committed golden's bytes, or `""` when the file is absent.
 *
 * ABSENCE IS A LEGIBLE ASSERTION FAILURE, NEVER A COLLECTION CRASH. A bare `readFileSync` at module
 * scope turns a missing golden into "no tests ran", which reports as a broken suite rather than as
 * the one thing that is actually wrong — and a run that executed nothing cannot prove anything about
 * the shape. Each case below asserts the golden is present, naming the regeneration command.
 */
function loadGolden(): string {
  return existsSync(GOLDEN_PATH) ? readFileSync(GOLDEN_PATH, "utf8") : "";
}

const GOLDEN_ABSENT =
  "PREMISE: scripts/fixtures/board-snapshot/expected-snapshot.json is absent or empty, so every " +
  "assertion below would measure nothing. Regenerate it with the command in that fixture's " +
  "README.md: npm run build && GRUGOPS_UPDATE_BOARD_GOLDEN=1 npx vitest run " +
  "--exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t \"golden\"";

describe("board-model — the committed golden freezes schemaVersion 2 byte for byte (D-19)", () => {
  const rendered = serializeFixture();

  // THE REGENERATION SEAM. Production callers set nothing; the comparison below is what runs in CI.
  // `scripts/fixtures/board-snapshot/README.md` names the exact command, so a legitimate shape
  // change is a one-command operation rather than a hand edit that erodes the golden's meaning.
  if (process.env["GRUGOPS_UPDATE_BOARD_GOLDEN"] === "1") {
    writeFileSync(GOLDEN_PATH, rendered, "utf8");
  }

  const goldenText = loadGolden();

  it("renders the committed fixture tree to the committed golden, byte for byte", () => {
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    expect(
      rendered.length,
      "PREMISE: the serializer produced an empty document, so the comparison below would compare " +
        "nothing against nothing",
    ).toBeGreaterThan(1000);
    expect(rendered, firstDifference(rendered, goldenText)).toBe(goldenText);
  });

  it("serializes to identical bytes when run a second time in one process", () => {
    const second = serializeFixture();
    expect(
      second,
      "a second read produced different bytes, so something outside the committed inputs — a wall " +
        "clock, a filesystem listing order, an object key order — reached the golden",
    ).toBe(rendered);
  });

  it("carries the fixed placeholder in every wall-clock field, never a real timestamp", () => {
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    const instants: string[] = [];
    const walk = (v: unknown, k: string | null): void => {
      if (typeof v === "string") {
        if (k !== null && INSTANT_KEYS.has(k)) instants.push(v);
        return;
      }
      if (Array.isArray(v)) {
        for (const e of v) walk(e, null);
        return;
      }
      if (v !== null && typeof v === "object") {
        for (const [kk, vv] of Object.entries(v as Record<string, unknown>)) walk(vv, kk);
      }
    };
    walk(JSON.parse(goldenText), null);
    expect(
      instants.length,
      "PREMISE: the golden carries no wall-clock field at all, so this case measured nothing",
    ).toBeGreaterThan(0);
    expect(new Set(instants), "a real timestamp reached the golden").toEqual(
      new Set([FIXED_INSTANT]),
    );
    expect(goldenText, "an absolute repository path reached the golden").not.toMatch(/"\/[^"]*"/);
  });

  it("holds a distinct conflict-kind set equal to CONFLICT_KINDS, asserted in both directions", () => {
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    const golden = JSON.parse(goldenText) as { conflicts: { kind: string }[] };
    expect(
      Array.isArray(golden.conflicts) && golden.conflicts.length > 0,
      "PREMISE: the golden did not parse, or its `conflicts[]` is empty — the inventory below " +
        "would then be an assertion over nothing, which is exactly the vacuous green this case " +
        "exists to make impossible",
    ).toBe(true);

    const inGolden = new Set(golden.conflicts.map((c) => c.kind));
    const declared = new Set<string>(CONFLICT_KINDS);

    expect(
      [...declared].filter((k) => !inGolden.has(k)),
      "a DECLARED conflict kind that no committed fixture reaches. The comparison for that kind " +
        "ships unexercised, which is the set-literal drift class this repository has already paid " +
        "for — add the shape to scripts/fixtures/board-snapshot/ that manufactures it",
    ).toEqual([]);
    expect(
      [...inGolden].filter((k) => !declared.has(k)),
      "the golden carries a kind CONFLICT_KINDS does not declare",
    ).toEqual([]);
    expect(inGolden.size).toBe(CONFLICT_KIND_COUNT);
  });

  it("reads `ok` for every source, which is WHY the plan 32-09 gating does not fire on it", () => {
    // GOLDEN INVARIANCE IS ASSERTED, NOT ASSUMED. The presence-dependent gating added by plan 32-09
    // suppresses `row-without-file` and `ticket-unplaced` whenever the tickets source is not `ok`.
    // The committed golden did not move when that gate landed — and the REASON it did not move is a
    // measurable premise about the fixture, not an absence of failure. If a future edit makes any
    // fixture source read stale, this case says so in one line instead of leaving a silently
    // narrowed golden to be discovered by the next verifier.
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    const golden = JSON.parse(goldenText) as {
      snapshot: { sources: Record<string, { source: string }> };
      conflicts: { kind: string }[];
    };
    expect(
      golden.snapshot.sources["tickets"]?.source,
      "the committed fixture's tickets source is no longer `ok`, so the plan 32-09 presence " +
        "gating now fires on the golden and the two gated kinds have been silently dropped from it",
    ).toBe("ok");
    const notOk = Object.entries(golden.snapshot.sources)
      .filter(([, s]) => s.source !== "ok")
      .map(([name]) => name);
    expect(notOk, "every source in the committed fixture reads `ok`").toEqual([]);

    // And the gated kinds ARE present in the golden, so the invariance claim is about a document
    // that would visibly change if the gate fired — not about one where the gate has nothing to cut.
    const kinds = new Set(golden.conflicts.map((c) => c.kind));
    expect(
      [...PRESENCE_DEPENDENT_CONFLICT_KINDS].filter((k) => !kinds.has(k)),
      "PREMISE: the golden carries neither gated kind, so 'the golden did not move' would be true " +
        "of a gate that cut everything",
    ).toEqual([]);

    // The comparison itself, re-run inside this case: the bytes are unchanged with the gate in.
    expect(rendered, firstDifference(rendered, goldenText)).toBe(goldenText);
  });

  it("pins the published schemaVersion, which no change may move without the golden moving with it", () => {
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    const golden = JSON.parse(goldenText) as { snapshot: { schemaVersion: number } };
    expect(
      golden.snapshot.schemaVersion,
      "the golden's schemaVersion and the module's disagree. Changing either one requires bumping " +
        "SCHEMA_VERSION and regenerating scripts/fixtures/board-snapshot/expected-snapshot.json in " +
        "the SAME commit (D-19) — the published shape is what DASH-08 promises a future web " +
        "renderer consumes unchanged",
    ).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION, "the published shape is version 2").toBe(2);
  });

  it("populates every bucket of the partition, so the golden is not a narrow slice", () => {
    expect(goldenText.length, GOLDEN_ABSENT).toBeGreaterThan(1000);
    const golden = JSON.parse(goldenText) as {
      snapshot: {
        board: {
          columns: { rows: unknown[] }[];
          epicRows: unknown[];
          updates: unknown[];
          preamble: unknown[];
          nonColumnSections: unknown[];
          unparsed: unknown[];
        };
      };
      readErrors: unknown[];
    };
    const b = golden.snapshot.board;
    expect(b.columns.length, "columns").toBeGreaterThan(4);
    expect(b.columns.flatMap((c) => c.rows).length, "ticket rows").toBeGreaterThan(4);
    expect(b.epicRows.length, "epic rows").toBeGreaterThan(0);
    expect(b.updates.length, "update entries").toBeGreaterThan(0);
    expect(b.preamble.length, "preamble lines").toBeGreaterThan(0);
    expect(b.nonColumnSections.length, "non-column sections").toBeGreaterThan(0);
    expect(b.unparsed.length, "unparsed lines").toBeGreaterThan(0);
    expect(
      golden.readErrors.length,
      "the tampered claim record's skip must be REACHED by the committed fixture, not only by a " +
        "unit test",
    ).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-16 — ONE NORMALIZATION AUTHORITY, AND A BYTE-ORDER MARK IS AN ENCODING ARTEFACT (WR-03).
//
// `readVerifyReread` passes `ignoreBOM: true` ON PURPOSE (`scripts/board-read.ts`): the read seam
// compares a stat's byte count against the bytes it holds, so it must not silently drop three of
// them on the way past. The consequence is that a mark a Windows editor wrote arrives INSIDE the
// text both grammars parse — and both grammars decided what a document's first line was without
// accounting for it. Measured against the committed `.js` before this block existed:
//
//   a ticket led by U+FEFF  -> REFUSED no-opening-delimiter, quoting `<U+FEFF>---`, a line that
//                              renders exactly as `---` in every terminal and every diff
//   a board led by U+FEFF   -> the first column VANISHES (it lands in `preamble`), and the rows
//                              beneath it become unparsed lines with a null column
//
// The refusal is the loud half and the dropped column is the quiet half; the quiet half is the one
// nobody would have reported. The seam keeps the bytes, and the GRAMMAR decides what the first line
// is — a decision that now lives in one function rather than in two spellings of it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-model — one normalization authority answers the byte-order mark for BOTH grammars (plan 32-16)", () => {
  // The mark is written as an ESCAPE, never as a literal byte: an invisible character in a
  // tracked source file is the hazard under test, not a way to write about it.
  const MARK = "\uFEFF";
  const TICKET =
    "---\nid: ABC-014\ntitle: Asset allocation chart\nstatus: in-development\ncolumn: In Development\n---\n\n# ABC-014\n";
  const BOARD = "## Backlog (WIP unlimited)\n\n- [ABC-001] a row a Windows editor saved\n";

  it("admits a mark-led ticket document, with the SAME values as the same document without it", () => {
    const plain = parseTicketDocument(TICKET);
    expect(
      plain.ok,
      "PREMISE: the unmarked document is already refused, so admitting the marked one would prove " +
        "nothing about the mark",
    ).toBe(true);

    const marked = parseTicketDocument(MARK + TICKET);
    expect(marked.ok, marked.ok ? "" : `${marked.code}: ${marked.reason}`).toBe(true);
    if (!marked.ok || !plain.ok) return;
    expect(marked.value).toEqual(plain.value);
  });

  it("returns the column of a board whose first line is a heading led by a mark", () => {
    const plain = parseBoard(BOARD);
    expect(
      plain.columns.map((c) => c.name),
      "PREMISE: the unmarked board carries no column, so the marked one carrying none would say " +
        "nothing about the mark",
    ).toEqual(["Backlog"]);

    const marked = parseBoard(MARK + BOARD);
    expect(marked.columns.map((c) => c.name)).toEqual(["Backlog"]);
    expect(marked.columns[0]?.rows.map((r) => r.id)).toEqual(["ABC-001"]);
    expect(
      marked.preamble,
      "the marked heading used to land in the preamble, which is how the column disappeared",
    ).toEqual([]);
    expect(
      marked.unparsed,
      "and the row beneath it used to be a legal row outside every column, reported with a null " +
        "column (rule 4)",
    ).toEqual([]);
  });

  it("counts the RAW bytes of a mark-led board, because that is what is on disk", () => {
    const marked = parseBoard(MARK + BOARD);
    expect(
      marked.bounds.boardBytes,
      "`boardBytes` is a byte count of the file, not of the normalized text — a human comparing it " +
        "against `ls -l` must not be told a smaller number",
    ).toBe(Buffer.byteLength(MARK + BOARD, "utf8"));
  });

  it("strips at MOST one mark: a document led by two is answered by the rules that already exist", () => {
    // A second mark is CONTENT. A document whose second character is another one is not a Windows
    // save, and the grammar says so through its existing refusal rather than by looping until the
    // document starts with something it likes.
    const ticket = parseTicketDocument(MARK + MARK + TICKET);
    expect(ticket.ok).toBe(false);
    if (ticket.ok) return;
    expect(ticket.code).toBe("no-opening-delimiter");

    const board = parseBoard(MARK + MARK + BOARD);
    expect(board.columns).toEqual([]);
    expect(
      board.preamble,
      "the doubly-marked heading is a preamble line, exactly as any other line that is not a legal " +
        "heading would be",
    ).toEqual([`${MARK}## Backlog (WIP unlimited)`]);
  });

  it("normalizes the two encoding artefacts and NOTHING else", () => {
    expect(normalizeDocument(`${MARK}a\r\nb\r\n`)).toBe("a\nb\n");
    expect(normalizeDocument("a\nb\n"), "an already-clean document is returned unchanged").toBe("a\nb\n");
    expect(normalizeDocument(""), "an empty document is not an index error").toBe("");
    expect(
      normalizeDocument(`a${MARK}b`),
      "a mark in the MIDDLE of a document is content and is left where the author put it",
    ).toBe(`a${MARK}b`);
    expect(
      normalizeDocument("a\rb"),
      "a bare carriage return is not a Windows line ending and is not folded",
    ).toBe("a\rb");
  });

  it("carries EXACTLY ONE non-comment line-ending fold, and it is inside `normalizeDocument`", () => {
    // Two spellings of one normalization is the drift this repository has already paid for: the two
    // this task deleted disagreed about the mark for a whole phase while every case stayed green.
    // A sentence DESCRIBING the rule must neither satisfy nor break this pin, so comment lines are
    // filtered out of the count before it is compared.
    const src = readFileSync(join(ROOT, "scripts", "board-model.ts"), "utf8");
    const lines = src.split("\n");
    const isComment = (l: string): boolean => {
      const t = l.trim();
      return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
    };
    const FOLD = 'split("\\r\\n")';
    expect(
      lines.filter((l) => l.includes(FOLD)).length,
      "PREMISE: the fold spelling this case searches for is absent from the module entirely, so " +
        "'exactly one' would be a claim about a string that does not appear",
    ).toBeGreaterThan(0);

    const foldLines = lines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => !isComment(l) && l.includes(FOLD));
    expect(
      foldLines.length,
      "a second line-ending fold landed in scripts/board-model.ts. One normalization authority " +
        "serves both grammars (plan 32-16); a second spelling is how the two grammars came to " +
        "disagree about what a document's first line is",
    ).toBe(1);

    const start = lines.findIndex((l) => l.startsWith("export function normalizeDocument("));
    expect(start, "PREMISE: `normalizeDocument` is not declared where this case looks").toBeGreaterThan(-1);
    const end = lines.findIndex((l, i) => i > start && l === "}");
    expect(end, "PREMISE: the declaration never closes at column zero").toBeGreaterThan(start);
    const at = foldLines[0]?.i ?? -1;
    expect(
      at > start && at < end,
      `the single fold is at line ${at + 1}, outside normalizeDocument (lines ${start + 1}-${end + 1})`,
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-16 — A TAB IS REFUSED BY THE RULE THE COMMENT NAMES (WR-04).
//
// `TICKET_CONTROL` used to read `[\x00-\x09\x0b-\x1f\x7f]`, whose range INCLUDES the horizontal
// tab, and the control check runs before `TICKET_KEY_LINE` is applied. So a tab anywhere in the
// region was refused as a control character — "which no terminal renders and no human wrote
// deliberately", two clauses that are both false of a tab — while the comment beside the pattern
// said "a tab is caught by the key pattern rather than trimmed", describing a program the file did
// not contain. Since plan 32-12 a refusal is a hard error in the structure validator, and since
// plan 32-15 it is a conflict on the screen, so an untrue refusal reason is an expensive sentence.
//
// THE CLASS IS DERIVED HERE RATHER THAN TRANSCRIBED. A character class edited to green a suite is
// the set-literal drift class this repository has paid for. Both the pattern's membership and the
// rule that actually FIRES are derived over every code point from 0 through 31 plus 127, and the
// two derivations are asserted to agree — a narrowing that left a second control check standing
// somewhere else would show up as a disagreement rather than as a green.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-model — the control class is pinned by derivation, and a tab is not in it (plan 32-16)", () => {
  /** Every code point the class is asked about: the C0 range plus DEL. */
  const PROBED = [...Array.from({ length: 32 }, (_, i) => i), 127];

  const TAB = String.fromCharCode(9);
  const NEWLINE = String.fromCharCode(10);

  /** A region line carrying `ch`, so the grammar is asked about it where it is actually asked. */
  const withChar = (ch: string): string => `---\nid: ABC-014\ntitle: a${ch}b\n---\n`;

  it("REFUSES a tab after the colon as an unrecognized line, quoting the line", () => {
    const r = parseTicketDocument(`---\nid: ABC-014\nstatus:${TAB}in-development\n---\n`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(
      r.code,
      "a tab is refused by the key pattern — the canonical form is `key: value` with one space — " +
        "and not as a byte no terminal renders",
    ).toBe("unrecognized-line");
    expect(r.reason).toMatch(/line 3 is `status:/);
  });

  it("REFUSES a region line indented by a tab as an unrecognized line", () => {
    const r = parseTicketDocument(`---\nid: ABC-014\ntitle: T\n${TAB}status: x\n---\n`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("unrecognized-line");
    expect(r.reason).toMatch(/line 4 is `/);
  });

  it("REFUSES a tab INSIDE a value, and a tab TRAILING one — the two positions the key pattern nearly admitted", () => {
    // FOUND BY PROBING THE SIBLING POSITIONS, not by the plan. Taking the tab out of the control
    // class let `(.*)` admit it inside a value: `title: a<TAB>b` was ADMITTED and the tab was
    // carried into the model and onto the board, and `title: ab<TAB>` was admitted with the tab
    // silently trimmed off. Both were refused the day before. Narrowing one rule must not widen
    // the next one along.
    const inside = parseTicketDocument(`---\nid: ABC-014\ntitle: a${TAB}b\n---\n`);
    expect(inside.ok, "a tab INSIDE a value").toBe(false);
    expect(inside.ok === false ? inside.code : "").toBe("unrecognized-line");

    const trailing = parseTicketDocument(`---\nid: ABC-014\ntitle: ab${TAB}\n---\n`);
    expect(trailing.ok, "a tab TRAILING a value").toBe(false);
    expect(trailing.ok === false ? trailing.code : "").toBe("unrecognized-line");
  });

  it("STILL refuses the characters that remain in the class, under the code that names them", () => {
    // THE CONVERSE. Narrowing a class is only correct if everything else it held is still refused
    // for the reason it was held for. Written with `String.fromCharCode` so no literal control byte
    // enters a tracked file — `npm run check:nul-bytes` scans every one of them.
    for (const code of [0, 27, 127]) {
      const r = parseTicketDocument(withChar(String.fromCharCode(code)));
      expect(r.ok, `code point ${code} was ADMITTED`).toBe(false);
      if (r.ok) continue;
      expect(r.code, `code point ${code}`).toBe("control-character");
      expect(r.reason).toMatch(/carries a control character/);
    }
  });

  it("derives the class MEMBERSHIP over every probed code point, rather than transcribing it", () => {
    const members = PROBED.filter((c) => TICKET_CONTROL.test(String.fromCharCode(c)));
    const expected = PROBED.filter((c) => c !== 9 && c !== 10);
    expect(
      members,
      "the control class changed membership. What the grammar refuses as a control character is a " +
        "decision recorded in agent-factory/contracts/board.md, never a range edited to green a " +
        "suite: the tab left this class in plan 32-16 so the key pattern could refuse it with a " +
        "reason that is true, and the newline was never in it because it ends a line rather than " +
        "sitting inside one",
    ).toEqual(expected);
    expect(TICKET_CONTROL.test(TAB), "the tab is NOT a member").toBe(false);
    expect(TICKET_CONTROL.test(NEWLINE), "the newline is NOT a member").toBe(false);
  });

  it("derives which RULE FIRES for each probed code point, and it agrees with the membership", () => {
    // Membership is a claim about a pattern; this is a claim about the program. They are derived
    // separately and compared, because a class narrowed while a second control check stood
    // somewhere else would satisfy the first and not the second.
    const refusedAsControl: number[] = [];
    const refusedAsUnrecognized: number[] = [];
    const other: string[] = [];
    for (const code of PROBED) {
      const r = parseTicketDocument(withChar(String.fromCharCode(code)));
      if (r.ok) {
        other.push(`${code}: ADMITTED`);
        continue;
      }
      if (r.code === "control-character") refusedAsControl.push(code);
      else if (r.code === "unrecognized-line") refusedAsUnrecognized.push(code);
      else other.push(`${code}: ${r.code}`);
    }

    expect(other, "every probed code point lands in one of the two refusals").toEqual([]);
    expect(
      refusedAsControl,
      "the rule that FIRES disagrees with the class's membership: a control character is reaching " +
        "a different rule, or a non-member is reaching this one",
    ).toEqual(PROBED.filter((c) => TICKET_CONTROL.test(String.fromCharCode(c))));
    expect(
      refusedAsUnrecognized,
      "the two code points outside the class are refused by the key pattern: a tab does not fit " +
        "`key: value`, and a newline ends the line so the remainder is not a key line either",
    ).toEqual([9, 10]);
  });

  it("does not add a member to the closed refusal-code set", () => {
    expect(TICKET_REFUSAL_CODES.length).toBe(TICKET_REFUSAL_CODE_COUNT);
    expect(TICKET_REFUSAL_CODE_COUNT, "a seventh refusal reason is a decision, not a fix").toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-16 — THE TWO KIT DOCUMENTS THAT DISAGREE ABOUT THE TICKET SHAPE, PAIRED (WR-11).
//
// `docs/initial/agent_factory_builder_spec_v2.md` § 6.1 shows a ticket template that is six bare
// key lines with no `---` region, and agents read it. A document written in that shape is refused
// `no-opening-delimiter` — a hard error in the structure validator since plan 32-12, and a conflict
// on the screen since plan 32-15. The contract already names the specification's `## Blocked (2)`
// heading as documented non-grammar for the OTHER grammar; it now does the same for this one, and
// the specification carries a pointer back.
//
// THE SPECIFICATION IS NOT REWRITTEN. `docs/initial/` is the historical input this kit was built
// from, `scripts/board-corpus.ts` replays eight live rows out of that exact file, and the contract
// already carries the precedent of NAMING a spec shape rather than editing it. One additive pointer
// line removes the trap without rewriting the record.
//
// TWO DOCUMENTS THAT MUST AGREE GET A CASE THAT READS BOTH. Each file is asserted non-empty before
// anything is asserted about its content, so a renamed or emptied file is a red rather than a
// vacuous pass.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("board-model — the contract and the builder specification stay paired about the ticket shape (plan 32-16)", () => {
  const CONTRACT_REL = "agent-factory/contracts/board.md";
  const SPEC_REL = "docs/initial/agent_factory_builder_spec_v2.md";

  const read = (rel: string): string => {
    const text = readFileSync(join(ROOT, rel), "utf8");
    expect(
      text.length,
      `PREMISE: ${rel} read as empty or missing, so every assertion about its content below would ` +
        "pass over a file nobody wrote",
    ).toBeGreaterThan(1000);
    return text;
  };

  /**
   * The § Ticket documents section of the contract, bounded by the next level-two heading.
   *
   * WHITESPACE IS COLLAPSED because the contract is hard-wrapped prose: a phrase that happens to
   * straddle a line break would otherwise fail an assertion about a sentence that is present.
   */
  const ticketSection = (contract: string): string => {
    const start = contract.indexOf("### Ticket documents");
    expect(start, `PREMISE: ${CONTRACT_REL} carries no "### Ticket documents" section`).toBeGreaterThan(-1);
    const after = contract.indexOf("\n## ", start);
    const section = after === -1 ? contract.slice(start) : contract.slice(start, after);
    return section.split(/\s+/).join(" ");
  };

  it("the contract's § Ticket documents names the specification, the refusal code, and the fix", () => {
    const section = ticketSection(read(CONTRACT_REL));
    expect(section, "the contract must name the document an agent copies the wrong shape from").toContain(
      SPEC_REL,
    );
    expect(section, "and the code that refusal reports").toContain("no-opening-delimiter");
    expect(
      section,
      "and what to write instead — a paragraph that names a trap without naming the way out is " +
        "half a finding",
    ).toMatch(/between an opening `---` line and a closing one/);
  });

  it("the specification's pointer names the contract, beside the template it is about", () => {
    const spec = read(SPEC_REL);
    const fence = spec.indexOf("status: in-development\ncolumn: In Development");
    expect(fence, `PREMISE: ${SPEC_REL} no longer carries the ticket template this pointer is about`).toBeGreaterThan(
      -1,
    );
    // The pointer sits within a few lines of the template, not somewhere else in a 2,000-line file.
    const nearby = spec.slice(fence, fence + 700);
    expect(nearby, "the pointer must be beside the example an agent is reading").toContain(CONTRACT_REL);
    expect(nearby).toContain("no-opening-delimiter");
  });

  it("a document in the specification's template shape is REFUSED, which is why the pairing exists", () => {
    // The claim the two documents make about each other, checked against the grammar rather than
    // taken on trust: the six key lines exactly as the specification shows them.
    const asShown =
      "status: in-development\ncolumn: In Development\nsize: M\npriority: P2\nepic: EPIC-003\nfeature: FEAT-007\n";
    const refused = parseTicketDocument(asShown);
    expect(refused.ok).toBe(false);
    expect(refused.ok === false ? refused.code : "").toBe("no-opening-delimiter");

    // And the corrective shape the contract names is admitted, so the advice is checkable too.
    const corrected = parseTicketDocument(`---\n${asShown}---\n\n# ABC-014\n`);
    expect(corrected.ok, corrected.ok ? "" : corrected.reason).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-33 — ONE PRESENCE DERIVATION OVER A TOTAL IDENTIFIER POPULATION (DASH-03, CR-03).
//
// THE DEFECT, AND WHY IT SURVIVED TWO ROUNDS THAT EACH CLOSED IT. Round 1 (`32-09`) closed "the
// listing failed" by gating both presence-dependent kinds. Round 2 (`32-15`) closed "the file is
// there and the grammar refused it" by carrying the refused half into the join. Each fix added ONE
// MORE MAP beside the one already there, and the third population — a document admitted under a
// declared identifier that is not its file stem — is in neither, so the stem's presence question was
// answered as absence. A fourth map would create a fifth population.
//
// WHAT REPLACES THE NEXT MAP. `presenceOf` asks three MEASURED sets in a stated order and returns a
// discriminated answer; `absent` is reachable only by falling off the end of all three. The cases
// below assert each arm, assert that each arm produces its own sentence, and — the one that matters
// most — assert the ARITHMETIC: the count of identifiers answered `absent` equals the count of
// placements in none of the three sets, derived on the other side of the loop that consumes it.
// That is plan 32-15's instrument, applied to the partition's KEYS rather than its SIZE, and it is
// what makes a fifth population visible as a failing number rather than as an arm somebody has to
// think of.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

import { mkdtempSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  TICKET_PRESENCE_KINDS,
  TICKET_PRESENCE_KIND_COUNT,
  presenceActual,
  presenceOf,
  ticketPopulations,
} from "./board-model.js";
import { readTicketsSource } from "./board-read.js";
import type { TicketPresenceKind } from "./board-model.js";

/** The sentence the join uses for an identifier NO file carries. It must reach `absent` and only it. */
const ABSENT_TEXT = "no ticket file carries that identifier";

describe("board-model — the presence kinds are a CLOSED set with a two-sided count (plan 32-33)", () => {
  it("has the expected MEMBERS, in the order the derivation asks them", () => {
    expect(
      [...TICKET_PRESENCE_KINDS],
      "the ORDER is the priority order: a document answers for the identifier it DECLARES before " +
        "it answers for the name the directory gave it",
    ).toEqual(["admitted-under-its-stem", "admitted-under-another-id", "refused", "absent"]);
  });

  it("has the expected COUNT, pinned from both sides", () => {
    expect(
      TICKET_PRESENCE_KINDS.length,
      "a presence arm landed or left. A fifth arm means the three measured sets were not total " +
        "after all, which is a finding to record in agent-factory/contracts/board.md — never a " +
        "bumped constant",
    ).toBe(TICKET_PRESENCE_KIND_COUNT);
    expect(TICKET_PRESENCE_KIND_COUNT).toBe(4);
    expect(new Set(TICKET_PRESENCE_KINDS).size, "an arm is spelled twice").toBe(
      TICKET_PRESENCE_KINDS.length,
    );
  });

  it("the conflict-kind set did NOT grow to reach the honest sentence", () => {
    // D-10 makes the kind set part of the published shape. The fourth population is reported inside
    // the EXISTING `row-without-file` kind by making `actual` true, so this pin is the converse of
    // the presence-kind pin above: one set grew by design, the other must not have moved at all.
    expect(CONFLICT_KINDS.length).toBe(CONFLICT_KIND_COUNT);
    expect(CONFLICT_KIND_COUNT).toBe(7);
    expect([...CONFLICT_KINDS]).toEqual([
      "board-vs-ticket",
      "ticket-unplaced",
      "ticket-duplicated",
      "row-without-file",
      "wip-limit",
      "wip-count",
      "column-missing",
    ]);
  });
});

describe("board-model — `presenceOf` answers each of the four arms from a measured set", () => {
  /** One population set carrying all three measured halves at once, so the arms are isolated. */
  const POPULATIONS = ticketPopulations(
    [
      ticket("ABC-001", "In Development", "in-development"),
      mismatched("ABC-300", "ABC-777", "In Development", "in-development"),
    ],
    [{ id: "ABC-900", code: "unknown-key" }],
  );

  it("(1) an identifier a document DECLARES answers `admitted-under-its-stem`", () => {
    const p = presenceOf("ABC-001", POPULATIONS);
    expect(p.kind).toBe("admitted-under-its-stem");
    expect(p.kind === "admitted-under-its-stem" ? p.record.file : "").toBe("ABC-001.md");
  });

  it("(2) an identifier that is a FILE STEM answers `admitted-under-another-id`, carrying it", () => {
    const p = presenceOf("ABC-300", POPULATIONS);
    expect(p.kind).toBe("admitted-under-another-id");
    expect(
      p.kind === "admitted-under-another-id" ? p.declaredId : "",
      "the arm must carry the identifier the FILE declares, which is the fact the sentence names",
    ).toBe("ABC-777");
  });

  it("(3) an identifier the reader REFUSED answers `refused`, carrying the code", () => {
    const p = presenceOf("ABC-900", POPULATIONS);
    expect(p.kind).toBe("refused");
    expect(p.kind === "refused" ? p.code : "").toBe("unknown-key");
  });

  it("(4) an identifier in NONE of the three sets answers `absent`", () => {
    expect(presenceOf("ABC-404", POPULATIONS).kind).toBe("absent");
    // PREMISE: the identifier is genuinely in none of them, checked against the sets themselves so
    // this case cannot pass because the populations were built empty.
    expect(POPULATIONS.byId.has("ABC-404")).toBe(false);
    expect(POPULATIONS.byStem.has("ABC-404")).toBe(false);
    expect(POPULATIONS.refusedById.has("ABC-404")).toBe(false);
    expect(POPULATIONS.byId.size + POPULATIONS.byStem.size + POPULATIONS.refusedById.size).toBe(5);
  });

  it("the DECLARED identifier wins over a same-named file stem, and the order is observable", () => {
    // `ABC-300` is BOTH the stem of the mismatched file and, here, the identifier a second document
    // declares. The stated priority says the declaration answers.
    const both = ticketPopulations(
      [
        mismatched("ABC-300", "ABC-777", "In Development", "in-development"),
        mismatched("ABC-800", "ABC-300", "In Development", "in-development"),
      ],
      [],
    );
    const p = presenceOf("ABC-300", both);
    expect(p.kind).toBe("admitted-under-its-stem");
    expect(p.kind === "admitted-under-its-stem" ? p.record.file : "").toBe("ABC-800.md");
  });

  it("a duplicate-identifier LOSER is not said to be joined — the arm distinguishes the two populations", () => {
    // REVIEW WR-01 (confirms 32-37 F-12). `ticketPopulations` fills `byStem` from EVERY admitted
    // record, including the record that lost the duplicate-identifier contest in
    // `readTicketsSource` — which pushes the loser into `records` deliberately, to keep the
    // partition total. Both reach this arm, and the consequence it states is true of the winner
    // and FALSE of the loser.
    //
    // RED before the fix: the loser's sentence read "so it is joined under that identifier and not
    // this one", while the SAME snapshot's `readErrors` said "ABC-903.md is the one joined and
    // ABC-901.md is not". One document, two fields, contradicting each other — the disagreement
    // DASH-03 exists to surface between two SOURCES, occurring inside one snapshot.
    const contested = ticketPopulations(
      [
        mismatched("ABC-901", "ABC-902", "In Development", "in-development"),
        mismatched("ABC-903", "ABC-902", "In Development", "in-development"),
      ],
      [],
    );

    const winner = presenceOf("ABC-901", contested);
    const loser = presenceOf("ABC-903", contested);
    expect(winner.kind).toBe("admitted-under-another-id");
    expect(loser.kind).toBe("admitted-under-another-id");

    // FIRST BY FILE NAME WINS, so ABC-901.md is the document joined under ABC-902.
    expect(
      winner.kind === "admitted-under-another-id" ? winner.joinedStem : "",
      "the winner of the duplicate-identifier contest is the document byId joined",
    ).toBe("ABC-901");
    expect(
      loser.kind === "admitted-under-another-id" ? loser.joinedStem : "",
      "the loser's arm must carry the stem of the document that ACTUALLY holds the identifier, " +
        "not its own — that difference is the only thing that can tell the two populations apart",
    ).toBe("ABC-901");

    expect(
      presenceActual("ABC-901", winner),
      "the WINNER is genuinely joined under the identifier it declares, and its sentence is unchanged",
    ).toBe(
      "plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined " +
        "under that identifier and not this one",
    );
    expect(
      presenceActual("ABC-903", loser),
      "the LOSER is joined under NO identifier, and the sentence must not assert a join that did " +
        "not happen. CLAUDE.md's no-fabrication rule is what makes this a defect rather than a nicety",
    ).toBe(
      "plans/tickets/ABC-903.md exists and declares the identifier ABC-902, which " +
        "plans/tickets/ABC-901.md claimed first, so it is joined under no identifier",
    );

    // THE TWO SENTENCES ARE DISTINCT, which is the whole point: one arm, two facts, two answers.
    expect(presenceActual("ABC-901", winner)).not.toBe(presenceActual("ABC-903", loser));
  });

  it("every arm produces its OWN sentence, and only `absent` asserts a negative", () => {
    const sentences = new Map<TicketPresenceKind, string | null>([
      ["admitted-under-its-stem", presenceActual("ABC-001", presenceOf("ABC-001", POPULATIONS))],
      ["admitted-under-another-id", presenceActual("ABC-300", presenceOf("ABC-300", POPULATIONS))],
      ["refused", presenceActual("ABC-900", presenceOf("ABC-900", POPULATIONS))],
      ["absent", presenceActual("ABC-404", presenceOf("ABC-404", POPULATIONS))],
    ]);

    // TWO-SIDED AGAINST THE CLOSED SET: every declared arm is exercised here, and nothing else is.
    expect(new Set(sentences.keys()), "an arm has no sentence case").toEqual(
      new Set(TICKET_PRESENCE_KINDS),
    );

    expect(sentences.get("admitted-under-its-stem"), "an admitted row is not a conflict").toBe(null);
    expect(sentences.get("admitted-under-another-id")).toBe(
      "plans/tickets/ABC-300.md exists and declares the identifier ABC-777, so it is joined " +
        "under that identifier and not this one",
    );
    expect(sentences.get("refused")).toBe(
      "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)",
    );
    expect(sentences.get("absent"), "the absence sentence is unchanged, byte for byte").toBe(
      ABSENT_TEXT,
    );

    // THE SENTENCES ARE DISTINCT. Two arms sharing one sentence is the defect this round closes:
    // rows 1 and 3 of 32-33-RED-baseline.txt produced byte-identical text for two different facts.
    const nonNull = [...sentences.values()].filter((s): s is string => s !== null);
    expect(new Set(nonNull).size, "two presence arms print the same sentence").toBe(nonNull.length);
    // And exactly one of them asserts a negative.
    expect(nonNull.filter((s) => s === ABSENT_TEXT).length).toBe(1);
  });

  it("no sentence quotes a byte of any document's BODY (the plan 32-10 containment rule)", () => {
    const body = "SECRET-BODY-TEXT";
    const withBody = ticketPopulations(
      [mismatched("ABC-300", "ABC-777", body, body, body)],
      [{ id: "ABC-900", code: "unknown-key" }],
    );
    for (const id of ["ABC-300", "ABC-900", "ABC-404"]) {
      expect(presenceActual(id, presenceOf(id, withBody)) ?? "").not.toContain(body);
    }
  });
});

describe("board-model — the join states what the file declares, never that it is not there", () => {
  const MISMATCH_BOARD =
    "## In Development (WIP unlimited)\n" +
    "- [ABC-300] Its file declares another identifier\n" +
    "- [ABC-900] Its file was refused\n" +
    "- [ABC-404] It genuinely has no file\n";

  const MISMATCH_JOIN = () =>
    joinOf({
      board: MISMATCH_BOARD,
      tickets: [mismatched("ABC-300", "ABC-777", "In Development", "in-development")],
      unadmittedTickets: [{ id: "ABC-900", code: "unknown-key" }],
    }).conflicts;

  it("raises NO conflict asserting absence for an identifier whose file was admitted", () => {
    const forMismatch = MISMATCH_JOIN().filter((c) => c.ticketId === "ABC-300");
    expect(
      forMismatch.map((c) => c.actual),
      "the projector asserted that no file carries ABC-300 while holding the record it built " +
        "from plans/tickets/ABC-300.md — a positive claim about a filesystem it read correctly",
    ).not.toContain(ABSENT_TEXT);

    const raised = only(MISMATCH_JOIN(), "row-without-file").filter((c) => c.ticketId === "ABC-300");
    expect(raised.length, "and the row is still reported: silence is a quieter fabrication").toBe(1);
    expect(raised[0]?.actual).toContain("declares the identifier ABC-777");
    expect(raised[0]?.actual).toContain("plans/tickets/ABC-300.md");
    // The kind does not split and `expected` does not move.
    expect(raised[0]?.kind).toBe("row-without-file");
    expect(raised[0]?.expected).toBe("plans/tickets/ABC-300.md");
    expect(raised[0]?.column).toBe("In Development");
  });

  it("leaves the refused and genuinely-absent rows BYTE-IDENTICAL to what they said before", () => {
    const conflicts = only(MISMATCH_JOIN(), "row-without-file");
    expect(conflicts.find((c) => c.ticketId === "ABC-900")?.actual).toBe(
      "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)",
    );
    expect(conflicts.find((c) => c.ticketId === "ABC-404")?.actual).toBe(ABSENT_TEXT);
    // Exactly three rows, so the fix neither dropped a population nor invented a fourth row.
    expect(conflicts.map((c) => c.ticketId).sort()).toEqual(["ABC-300", "ABC-404", "ABC-900"]);
  });

  it("still raises NO `row-without-file` for a row whose file declares the row's identifier", () => {
    const conflicts = joinOf({
      board: "## In Development (WIP unlimited)\n- [ABC-001] It agrees with its file\n",
      tickets: [ticket("ABC-001", "In Development", "in-development")],
    }).conflicts;
    expect(only(conflicts, "row-without-file")).toEqual([]);
  });

  it("the UNPLACED arm still speaks for the DECLARED identifier, so the pair reads as one dispute", () => {
    // The converse direction: ABC-777 is declared by a file no row names, so it is unplaced. A
    // human reading both conflicts sees ABC-300 -> "declares ABC-777" and ABC-777 -> "no row names
    // it", and the first names the second — which is what makes the two one disagreement rather
    // than two unrelated findings.
    const unplaced = only(MISMATCH_JOIN(), "ticket-unplaced");
    expect(unplaced.map((c) => c.ticketId)).toEqual(["ABC-777"]);
    expect(unplaced[0]?.actual).toBe("no row names ABC-777");
  });

  it("stays silent on the whole arm when the tickets source is not `ok`", () => {
    // The gate plan 32-09 closed is not reopened by the new population: with the listing not
    // obtained, no presence question is asked at all, whatever the three sets hold.
    const conflicts = joinSnapshot({
      repoRoot: "/fixture",
      generatedAt: JOIN_AT,
      sources: {
        ...sourcesFor({ board: MISMATCH_BOARD }),
        tickets: {
          source: "stale",
          value: [mismatched("ABC-300", "ABC-777", "In Development", "in-development")],
          readAt: JOIN_AT,
          stale: { reason: "bounded", since: JOIN_AT },
        },
      },
      unadmittedTickets: [{ id: "ABC-900", code: "unknown-key" }],
    }).conflicts;
    expect(
      conflicts.filter((c) =>
        (PRESENCE_DEPENDENT_CONFLICT_KINDS as readonly string[]).includes(c.kind),
      ),
    ).toEqual([]);
  });
});

// ── THE THIRD POPULATION AS ARITHMETIC, NOT AS AN ARM ────────────────────────────────────────────
//
// THIS IS THE CASE THAT WOULD HAVE CAUGHT THE DEFECT, and the two rounds before this one had nothing
// like it. Every earlier presence case names a population and asserts its sentence, so a population
// nobody thought of is a case nobody wrote. The two assertions below name no population at all: they
// take the `.md` stem set from the DIRECTORY LISTING, take the admitted stems and refused
// identifiers from the reader's own halves, and require the sets to be equal — and then require the
// number of identifiers answered `absent` to equal a count derived on the other side of the loop
// that produces it. A fifth population makes one of those two numbers wrong. That is plan 32-15's
// instrument, asked of the partition's KEYS.

/** Plant a real tree, read it with the real reader, and delete it. The join needs a LISTING here. */
function withTicketTree(
  files: Readonly<Record<string, string>>,
  board: string,
  run: (dir: string) => void,
): void {
  // THE RESOLVED PATH, because `readSnapshot` resolves symlinks and `/var` is `/private/var` on
  // this platform — an unresolved root makes the reader refuse its own fixture for containment.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "board-presence-")));
  try {
    mkdirSync(join(dir, "plans", "tickets"), { recursive: true });
    writeFileSync(join(dir, "plans", "board.md"), board, "utf8");
    for (const [name, text] of Object.entries(files)) {
      writeFileSync(join(dir, "plans", "tickets", name), text, "utf8");
    }
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const TREE_AT = "2026-01-01T00:00:00.000Z";

/** Four populations at once, so neither assertion below can be satisfied by a degenerate tree. */
const TREE_FILES = {
  // Admitted under its own stem.
  "ABC-001.md": "---\nid: ABC-001\ncolumn: In Development\nstatus: in-development\n---\n\n# a\n",
  // Admitted under a DIFFERENT identifier: stem ABC-300, declared ABC-777.
  "ABC-300.md": "---\nid: ABC-777\ncolumn: In Development\nstatus: in-development\n---\n\n# b\n",
  // Refused by the ticket grammar: `tools` is outside the closed ticket key set.
  "ABC-900.md": "---\nid: ABC-900\ntools: Bash\n---\n\n# c\n",
  // The degenerate listed entry, whose stem is empty.
  ".md": "---\ntitle: no stem at all\n---\n\n# d\n",
} as const;

const TREE_BOARD =
  "## In Development (WIP unlimited)\n" +
  "- [ABC-001] Agrees with its file\n" +
  "- [ABC-300] Its file declares another identifier\n" +
  "- [ABC-900] Its file was refused\n" +
  "- [ABC-404] It genuinely has no file\n" +
  "- [ABC-405] It genuinely has no file either\n";

describe("board-model — the presence partition's KEYS balance as arithmetic (plan 32-33)", () => {
  it("the listing's `.md` stem set EQUALS the admitted stems plus the refused identifiers", () => {
    withTicketTree(TREE_FILES, TREE_BOARD, (dir) => {
      // THE LEFT-HAND SIDE IS TAKEN FROM THE DIRECTORY, on the other side of the reader's loop. A
      // number taken from the record set would be vacuously equal to itself.
      const listed = readdirSync(join(dir, "plans", "tickets")).filter((n) => n.endsWith(".md"));
      const fromListing = new Set(listed.map((n) => n.slice(0, -".md".length)));
      expect(
        fromListing.size,
        "PREMISE: the tree produced no `.md` entry, so the equality below is 0 === 0",
      ).toBe(Object.keys(TREE_FILES).length);

      const settled = readTicketsSource(dir, TREE_AT, undefined, {});
      const records = settled.state.source === "ok" ? settled.state.value : [];
      const fromReader = new Set([
        ...records.map((r) => r.stem),
        ...settled.unadmitted.map((u) => u.id),
      ]);

      expect(
        fromReader,
        "an entry the directory listed is in neither half of the reader's partition, so the " +
          "presence question can be asked about a stem no measured set carries",
      ).toEqual(fromListing);
      // And both halves are non-empty, so the equality is not satisfied by one being the whole set.
      expect(records.length).toBeGreaterThan(0);
      expect(settled.unadmitted.length).toBeGreaterThan(0);
    });
  });

  it("the count answered `absent` EQUALS the count derived independently of the arm", () => {
    withTicketTree(TREE_FILES, TREE_BOARD, (dir) => {
      const settled = readTicketsSource(dir, TREE_AT, undefined, {});
      const records = settled.state.source === "ok" ? settled.state.value : [];
      const populations = ticketPopulations(records, settled.unadmitted);

      const placementIds = [
        ...new Set(parseBoard(TREE_BOARD, {}).columns.flatMap((c) => c.rows.map((r) => r.id))),
      ];
      expect(
        placementIds.length,
        "PREMISE: the board named no identifier, so both counts below are 0",
      ).toBe(5);

      // THE CONSUMING SIDE: what the derivation the join actually calls answers.
      const answeredAbsent = placementIds.filter(
        (id) => presenceOf(id, populations).kind === "absent",
      );

      // THE INDEPENDENT SIDE: three sets rebuilt from the reader's RAW arrays rather than from
      // `populations`, so a bug inside `ticketPopulations` cannot make both sides agree.
      const declared = new Set(records.map((r) => r.id));
      const stems = new Set(records.map((r) => r.stem));
      const refused = new Set(settled.unadmitted.map((u) => u.id));
      const inNoSet = placementIds.filter(
        (id) => !declared.has(id) && !stems.has(id) && !refused.has(id),
      );

      expect(
        answeredAbsent.sort(),
        "the arm answered `absent` for an identifier one of the three measured sets carries — " +
          "which is the exact shape of the fabrication this plan closes",
      ).toEqual(inNoSet.sort());
      // NON-VACUOUS FROM BOTH ENDS: some identifiers are absent and some are not, so neither an
      // all-absent nor a never-absent derivation could satisfy this.
      expect(inNoSet.length).toBe(2);
      expect(placementIds.length - inNoSet.length).toBe(3);
    });
  });

  it("the projector states what the file declares, end to end, through the real reader", () => {
    withTicketTree(TREE_FILES, TREE_BOARD, (dir) => {
      const result = readSnapshot(dir);
      expect(
        result.snapshot.sources.tickets.source,
        "PREMISE: the tickets source is not `ok`, so the presence arm is gated off and this case " +
          "measures the gate rather than the sentence",
      ).toBe("ok");

      const rows = result.conflicts.filter((c) => c.kind === "row-without-file");
      const byId = new Map(rows.map((c) => [c.ticketId ?? "", c.actual]));
      expect(byId.get("ABC-300")).toContain("declares the identifier ABC-777");
      expect(byId.get("ABC-900")).toContain("could not admit it (unknown-key)");
      expect(byId.get("ABC-404")).toBe(ABSENT_TEXT);
      expect(byId.get("ABC-405")).toBe(ABSENT_TEXT);
      expect(byId.has("ABC-001"), "a row whose file agrees with it is not a conflict").toBe(false);
      // And the empty-stem entry is refused by name on the channel a human reads.
      expect(result.readErrors.find((e) => e.code === "empty-stem")?.source).toBe("tickets");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 32-38, TASK 2 — EVERY SENTENCE BRANCH REACHED BY A NAMED INPUT, WITH THE COUNT DERIVED.
//
// WHY THE COUNT IS PARSED AND NOT RECALLED. This repository's second recorded systemic failure class
// is a hand-maintained set that rots while the suite stays green. `presenceActual`'s sentences are
// exactly such a set — four `switch` cases, one of which now carries THREE sentence branches after
// the WR-01 fix — and the per-arm cases above name their arms one at a time, so a branch nobody
// thought of is a case nobody wrote. The branch set below is taken from the MODULE, by the same
// TypeScript-parse instrument `scripts/validate.test.ts` uses for its reader census, and the named
// input rows are required to cover it in BOTH directions.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

import ts from "typescript";
import type { TicketPopulations } from "./board-model.js";

/** The `null` arm, carried through the derivation as a value so it cannot be silently dropped. */
const NULL_BRANCH = "<returns null — not a conflict>";
/** Every interpolated position, in both the parsed template and the measured sentence. */
const HOLE = "<>";

/**
 * Every string a `return` inside `presenceActual` can produce, with each `${...}` replaced by a
 * hole. TOTAL BY REFUSAL: a construct this walk does not recognise THROWS, so a branch expressed a
 * new way reds here rather than vanishing from the derived set and taking its coverage with it.
 */
function templatesOf(node: ts.Node): readonly string[] {
  if (ts.isParenthesizedExpression(node)) return templatesOf(node.expression);
  if (node.kind === ts.SyntaxKind.NullKeyword) return [NULL_BRANCH];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isTemplateExpression(node)) {
    return [node.head.text + node.templateSpans.map((s) => HOLE + s.literal.text).join("")];
  }
  if (ts.isConditionalExpression(node)) {
    return [...templatesOf(node.whenTrue), ...templatesOf(node.whenFalse)];
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = templatesOf(node.left);
    const right = templatesOf(node.right);
    return left.flatMap((l) => right.map((r) => l + r));
  }
  throw new Error(
    `presenceActual returns an expression shape this derivation does not know: ` +
      `${ts.SyntaxKind[node.kind]}. Teach templatesOf about it — a shape it cannot read is a ` +
      `branch that would silently leave the derived set.`,
  );
}

/** Parse `scripts/board-model.ts` and derive `presenceActual`'s branch set from its `return` sites. */
function derivePresenceBranches(): readonly string[] {
  const src = ts.createSourceFile(
    "board-model.ts",
    readFileSync(join(ROOT, "scripts", "board-model.ts"), "utf8"),
    ts.ScriptTarget.ES2022,
    true,
  );
  let fn: ts.FunctionDeclaration | undefined;
  src.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === "presenceActual") fn = n;
  });
  if (fn === undefined) return [];
  const out: string[] = [];
  const walk = (n: ts.Node): void => {
    // A nested function would carry its own returns; `presenceActual` has none, and stopping here
    // keeps that true rather than assuming it.
    if (n !== fn && (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n))) {
      return;
    }
    if (ts.isReturnStatement(n) && n.expression !== undefined) out.push(...templatesOf(n.expression));
    ts.forEachChild(n, walk);
  };
  walk(fn);
  return out;
}

/** Turn a sentence the code PRODUCED back into a template, by holing the values that went into it. */
function templateOfSentence(sentence: string | null, values: readonly string[]): string {
  if (sentence === null) return NULL_BRANCH;
  // Longest first, so one identifier that is a prefix of another cannot hole the wrong span.
  return [...values]
    .sort((a, b) => b.length - a.length)
    .reduce((text, v) => text.split(v).join(HOLE), sentence);
}

/** One audited branch: the input that reaches it, and whether the READER can produce that input. */
type AuditRow = {
  readonly branch: string;
  readonly name: string;
  readonly id: string;
  readonly values: readonly string[];
  readonly readerProducible: boolean;
  readonly populations: () => TicketPopulations;
  /** The sentence this row produced BEFORE plan 32-38, from 32-38-RED-baseline.txt section 8. */
  readonly before: string | null;
};

const AUDIT_AT = "2026-01-01T00:00:00.000Z";

/** A ticket document of a given stem declaring a given identifier — the shape the reader admits. */
const auditDoc = (stem: string, declaredId: string): readonly [string, string] => [
  `${stem}.md`,
  `---\nid: ${declaredId}\ncolumn: In Development\nstatus: in-development\n---\n\n# x\n`,
];

/** Read a planted tree with the REAL reader and index it the way the join does. */
function populationsFromTree(files: Readonly<Record<string, string>>): TicketPopulations {
  let built: TicketPopulations | undefined;
  withTicketTree(files, "## In Development (WIP unlimited)\n", (dir) => {
    const settled = readTicketsSource(dir, AUDIT_AT, undefined, {});
    const records = settled.state.source === "ok" ? settled.state.value : [];
    built = ticketPopulations(records, settled.unadmitted);
  });
  if (built === undefined) throw new Error("PREMISE: the planted tree produced no populations");
  return built;
}

const CONTEST_TREE = Object.fromEntries([
  auditDoc("ABC-901", "ABC-902"),
  auditDoc("ABC-903", "ABC-902"),
]);
const LONE_TREE = Object.fromEntries([auditDoc("ABC-300", "ABC-777")]);
const SELF_TREE = Object.fromEntries([auditDoc("ABC-001", "ABC-001")]);
const REFUSED_TREE = { "ABC-900.md": "---\nid: ABC-900\ntools: Bash\n---\n\n# c\n" };

/**
 * ONE NAMED INPUT PER DERIVED BRANCH. Five of the six are built from records the REAL reader
 * produced from a real tree; the sixth is the `joinedStem === undefined` arm, which no tree can
 * reach (see the invariant case below) and which is therefore exhibited through the exported
 * `presenceOf` against a directly-constructed `TicketPopulations` — the other legitimate input to
 * that exported function.
 */
const PRESENCE_AUDIT: readonly AuditRow[] = [
  {
    branch: "B1 null",
    name: "a document admitted under its OWN stem",
    id: "ABC-001",
    values: ["ABC-001"],
    readerProducible: true,
    populations: () => populationsFromTree(SELF_TREE),
    before: null,
  },
  {
    branch: "B2 joined under the identifier it declares",
    name: "the WINNER of a duplicate-identifier contest, stem != declared identifier",
    id: "ABC-901",
    values: ["ABC-901", "ABC-902"],
    readerProducible: true,
    populations: () => populationsFromTree(CONTEST_TREE),
    before:
      "plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined " +
      "under that identifier and not this one",
  },
  {
    branch: "B3 joinedStem === undefined",
    name: "a stem whose declared identifier no admitted record holds (direct construction only)",
    id: "ABC-950",
    values: ["ABC-950", "ABC-951"],
    readerProducible: false,
    populations: () => ({
      byId: new Map(),
      byStem: new Map([["ABC-950", "ABC-951"]]),
      refusedById: new Map(),
    }),
    before:
      "plans/tickets/ABC-950.md exists and declares the identifier ABC-951, which no admitted " +
      "document is joined under, so it is joined under no identifier",
  },
  {
    branch: "B4 another document claimed the identifier first",
    name: "the LOSER of a duplicate-identifier contest",
    id: "ABC-903",
    values: ["ABC-903", "ABC-902", "ABC-901"],
    readerProducible: true,
    populations: () => populationsFromTree(CONTEST_TREE),
    before:
      "plans/tickets/ABC-903.md exists and declares the identifier ABC-902, which " +
      "plans/tickets/ABC-901.md claimed first, so it is joined under no identifier",
  },
  {
    branch: "B5 refused by the ticket grammar",
    name: "a listed document the grammar could not admit",
    id: "ABC-900",
    values: ["ABC-900", "unknown-key"],
    readerProducible: true,
    populations: () => populationsFromTree(REFUSED_TREE),
    before: "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)",
  },
  {
    branch: "B6 absent",
    name: "a board identifier no document declares and no refusal records",
    id: "ABC-404",
    values: ["ABC-404"],
    readerProducible: true,
    populations: () => populationsFromTree(SELF_TREE),
    before: ABSENT_TEXT,
  },
];

/** The sentence each audited row actually produces, measured once and reused by both tasks. */
function auditedSentences(): ReadonlyMap<string, string | null> {
  return new Map(PRESENCE_AUDIT.map((r) => [r.branch, presenceActual(r.id, presenceOf(r.id, r.populations()))]));
}

describe("board-model — the presence SENTENCE set is derived from the module, not recalled (plan 32-38)", () => {
  it("derives the branch count by parsing `presenceActual`, and pins it against the audited rows", () => {
    const derived = derivePresenceBranches();
    expect(
      derived.length,
      "PREMISE: `presenceActual` was not found in scripts/board-model.ts, or it returned no " +
        "expression this derivation could read — the branch set is EMPTY and every comparison " +
        "below would be vacuously satisfied",
    ).toBeGreaterThan(0);
    // THE STATED FLOOR IS A NUMBER, not "greater than zero": an EMPTY set and a SILENTLY SHORT one
    // both red here. Six branches — one `null`, three under `admitted-under-another-id`, one
    // `refused`, one `absent`.
    expect(
      derived.length,
      "a sentence branch landed or left `presenceActual`. A seventh branch means a population the " +
        "four-arm partition did not name, which is a finding to record in " +
        "agent-factory/contracts/board.md and to give a named input row — never a bumped constant",
    ).toBe(6);
    expect(new Set(derived).size, "two branches produce the same sentence").toBe(derived.length);
    expect(
      PRESENCE_AUDIT.length,
      "a branch was added to the module without a named input row reaching it, or a row was " +
        "removed. Every branch the code can take is proved reachable here or proved unreachable " +
        "by the invariant case below",
    ).toBe(derived.length);
    expect(new Set(PRESENCE_AUDIT.map((r) => r.branch)).size).toBe(PRESENCE_AUDIT.length);
  });

  it("every derived branch is reached by a named input, and every named input reaches a derived branch", () => {
    const derived = new Set(derivePresenceBranches());
    const produced = new Set(
      PRESENCE_AUDIT.map((r) => templateOfSentence(auditedSentences().get(r.branch) ?? null, r.values)),
    );
    // BOTH DIRECTIONS. A subset check in either direction is how a branch rides in unproven.
    expect(
      [...produced].sort(),
      "a named input produced a sentence no `return` in presenceActual can produce — the input " +
        "rows and the module disagree about what the code says",
    ).toEqual([...derived].sort());
  });

  it("each audited branch says exactly what it said BEFORE this round (SAME, byte for byte)", () => {
    const sentences = auditedSentences();
    for (const row of PRESENCE_AUDIT) {
      expect(
        sentences.get(row.branch),
        `${row.branch} (${row.name}) CHANGED. A closure that silently rewords a sibling arm is a ` +
          `regression this phase has shipped twice; the before-image is ` +
          `32-38-RED-baseline.txt section 8`,
      ).toBe(row.before);
    }
  });

  it("exactly ONE audited branch is unreachable from any tree the reader can read", () => {
    const unreachable = PRESENCE_AUDIT.filter((r) => !r.readerProducible);
    expect(
      unreachable.map((r) => r.branch),
      "the reader-producible partition moved. Which branches a real tree can reach is what the " +
        "contract's presence table describes, so this number is the one Task 3 pins its row count against",
    ).toEqual(["B3 joinedStem === undefined"]);
  });
});

describe("board-model — the `joinedStem === undefined` branch is unreachable from the reader (plan 32-38)", () => {
  it("no tree the reader can read yields a `byStem` value absent from `byId`", () => {
    // MEASURED, NOT ARGUED. A tree carrying every population at once — a self-declaring document,
    // a contest winner, a contest loser, a lone mismatched document, a grammar-refused document,
    // and the degenerate `.md` entry — is read with the real reader and indexed the way the join
    // indexes it, and the two maps are asked the question directly.
    const populations = populationsFromTree({
      ...CONTEST_TREE,
      ...LONE_TREE,
      ...SELF_TREE,
      ...REFUSED_TREE,
      ".md": "---\ntitle: no stem at all\n---\n\n# d\n",
    });
    expect(
      populations.byStem.size,
      "PREMISE: the planted tree produced an EMPTY `byStem`, so the property below holds vacuously",
    ).toBeGreaterThan(2);
    expect(
      [...populations.byStem.entries()].filter(([stem, declared]) => stem !== declared).length,
      "PREMISE: no planted document declares an identifier other than its own stem, so the branch " +
        "under audit is not even asked",
    ).toBeGreaterThan(0);

    const orphans = [...populations.byStem.entries()].filter(([, id]) => !populations.byId.has(id));
    expect(
      orphans,
      "a `byStem` value is absent from `byId`, so `presenceOf` can now answer `joinedStem: " +
        "undefined` from a real tree. `ticketPopulations` fills BOTH maps in ONE loop over the SAME " +
        "record list, which is what makes this impossible today: every `byStem` value is some " +
        "record's `id`, and every record's `id` is a `byId` KEY (first-wins decides which record a " +
        "key holds, never whether the key is present). WHAT WOULD MAKE THE BRANCH REACHABLE AGAIN: " +
        "filling `byStem` from a second record list, guarding the `byId.set` on a condition the " +
        "`byStem.set` does not share, or deleting from `byId` after the loop. If any of those is " +
        "the intended change, this assertion is the one to revisit — and the branch then needs a " +
        "reader-producible input row and a row in agent-factory/contracts/board.md's presence table",
    ).toEqual([]);
  });

  it("the branch IS still reachable through the exported `presenceOf`, so it is not dead code", () => {
    // `TicketPopulations` is an exported type and `presenceOf` an exported function, so a direct
    // caller can hand it a map pair `ticketPopulations` would never build. The branch is the total
    // handling of the declared `joinedStem: string | undefined`, and it is kept for that reason
    // rather than deleted on the strength of an argument.
    const hand: TicketPopulations = {
      byId: new Map(),
      byStem: new Map([["ABC-950", "ABC-951"]]),
      refusedById: new Map(),
    };
    const p = presenceOf("ABC-950", hand);
    expect(p.kind).toBe("admitted-under-another-id");
    expect(p.kind === "admitted-under-another-id" ? p.joinedStem : "unset").toBeUndefined();
    expect(presenceActual("ABC-950", p)).toBe(
      "plans/tickets/ABC-950.md exists and declares the identifier ABC-951, which no admitted " +
        "document is joined under, so it is joined under no identifier",
    );
  });
});

describe("board-model — the converse of the arm the WR-01 fix touched (plan 32-38)", () => {
  it("a contested identifier that is ITSELF a stem on disk still names the joined document", () => {
    // THE CONVERSE PROBE. The fix's discriminator is `presence.joinedStem === id`. This tree makes
    // the contested identifier `ABC-902` also the NAME of a third document, so the stem population
    // and the declared population overlap on the value the discriminator compares.
    const populations = populationsFromTree(
      Object.fromEntries([
        auditDoc("ABC-901", "ABC-902"),
        auditDoc("ABC-902", "ABC-905"),
        auditDoc("ABC-903", "ABC-902"),
      ]),
    );
    expect(
      populations.byId.get("ABC-902")?.stem,
      "PREMISE: ABC-901.md did not win the contest, so this case is not probing the shape it names",
    ).toBe("ABC-901");

    // The contested identifier itself: a document genuinely IS joined under it, so the stated
    // priority answers from the DECLARED population and no `row-without-file` is raised at all.
    // WHICH document is joined is published regardless, as `tickets[].stem` beside `tickets[].id`.
    expect(presenceOf("ABC-902", populations).kind).toBe("admitted-under-its-stem");
    expect(presenceActual("ABC-902", presenceOf("ABC-902", populations))).toBe(null);

    // The loser still names the winner by file name, and the winner still says it is joined.
    expect(presenceActual("ABC-903", presenceOf("ABC-903", populations))).toBe(
      "plans/tickets/ABC-903.md exists and declares the identifier ABC-902, which " +
        "plans/tickets/ABC-901.md claimed first, so it is joined under no identifier",
    );
    expect(presenceActual("ABC-901", presenceOf("ABC-901", populations))).toBe(
      "plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined " +
        "under that identifier and not this one",
    );
  });
});
