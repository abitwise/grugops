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
    // `schemaVersion: 1` shape, and the honesty is reachable inside the existing kind.
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
// PLAN 32-05 TASK 3 — THE COMMITTED GOLDEN FREEZES `schemaVersion: 1` (D-19, DASH-08).
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

describe("board-model — the committed golden freezes schemaVersion 1 byte for byte (D-19)", () => {
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
    expect(SCHEMA_VERSION, "the published shape is version 1").toBe(1);
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
