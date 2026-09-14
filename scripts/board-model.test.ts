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

import { boardColumnName, parseBoard } from "./board-model.js";

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
