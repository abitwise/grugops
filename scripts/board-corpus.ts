// board-corpus.ts — THE BOARD-GRAMMAR REPLAY CORPUS, BOTH HALVES (plan 32-04, DASH-02).
//
// WHAT THIS MODULE IS FOR.
//
// `agent-factory/contracts/board.md` states a small canonical form and refuses every other byte.
// A canonical-form grammar passes its own test suite trivially by refusing everything, and a
// transcribed corpus passes it trivially by admitting everything. Only the two halves together say
// the grammar DISCRIMINATES, so this module carries both:
//
//   * THE LIVE HALF — every one of the 141 ticket rows measured across the five board-row sources
//     reachable from this project, each declaring the disposition the contract assigns it, plus the
//     update lines, headings and prose lines that reach the remaining buckets of the partition.
//   * THE MUTATION HALF — shapes derived from the contract's REFUSAL rules, each declaring the
//     named bucket it is refused into. "It failed" and "it failed for the right reason" are
//     different claims, and only the second one is worth a green line.
//   * THE CONTROL HALF — shapes a reader expects to be refused that the SHIPPED grammar admits,
//     each carrying the sentence of the contract that says why. A corpus that quietly omits the
//     cases where prose and code disagree is a corpus that hides the disagreement.
//
// THE HIGHEST-VALUE CASE IN THIS PHASE IS VACUOUS WITHOUT THE MUTATION HALF. Research measured it:
// with the comment-blanking pre-pass DELETED ENTIRELY, the "a documentation block yields zero
// columns" assertion still passes on `plans/board.md`, on its seed twin, on the chess board and on
// the dogfood board — because every mini-board inside every one of those comments happens to be
// four-space indented, and the anchored heading scan refuses an indented heading on its own. A
// correct implementation and a no-op are indistinguishable on the transcribed corpus. The four
// comment mutations below are the inputs that tell them apart, and `scripts/board-corpus.test.ts`
// proves the assertion can fail by replaying them through a no-op-stripper mirror built from the
// live source.
//
// A DISPOSITION IS A PROPERTY OF A LINE, AND A LINE HAS NO MEANING WITHOUT ITS DOCUMENT. The
// contract classes a line BY POSITION — the same bytes are a row inside a column, an unparsed line
// outside every column, a section line inside a non-column section, and a preamble line before the
// first heading. Each row therefore carries one line of input plus the name of a FRAME, and
// `frameDocument()` below builds the document the replay parses. The frames are a closed set drawn
// from the contract's own positional rules; an eighth positional rule is a decision recorded in the
// contract first.
//
// PROVENANCE IS PART OF THE DATA, NOT A COMMENT. Every row names the repository-relative path of
// the artifact that justifies it, and `unresolvedSources()` resolves each distinct path against a
// repository root. The two real boards live OUTSIDE this repository, in a user's own example
// repositories, so their rows cite the committed trimmed copies under `scripts/fixtures/board-replay/`
// rather than a path under anybody's home directory. A row whose citation has been deleted is a row
// nobody can check, and this repository's standing lesson is that an uncheckable claim is how
// eleven rounds of green shipped a live bypass.
//
// TRANSCRIPTION HONESTY. Two values record exactly what was done to each line on its way into this
// file:
//
//   * `transcription: "verbatim"` — the line is copied byte for byte from its source.
//   * `transcription: "framed"` — the line exceeded 240 characters, so it keeps its first 200 and
//     then carries the marker `... [elided N chars]`. The same rule produced the committed replay
//     fixtures, so a framed row's text is byte-identical to the fixture line it cites.
//
// A FRAMED ROW MAKES NO CLAIM ABOUT ITS `meta`. Eliding a tail cuts the closing parenthesis off a
// balanced parenthetical, so a framed row's meta capture is a property of the TRANSCRIPTION rather
// than of the artifact. `expectedMeta` is therefore declared on verbatim rows only, and it is
// declared from a character state machine that walks the contract's two-space rule rather than from
// the shipped `splitRow`, so the two are independent implementations of one prose rule.
//
// THIS MODULE IS PURE DATA. It has one top-level side effect — the integrity throw below — performs
// no I/O until `unresolvedSources` is called with an explicit root, and imports NOTHING from
// `scripts/board-model.ts`. The disposition RESOLVER lives in the test, because a corpus that
// imported the module it exists to measure could not be evidence about it.

import { existsSync } from "node:fs";
import { join } from "node:path";

// ── The closed disposition set ───────────────────────────────────────────────────────────────────
//
// Every member is a bucket `agent-factory/contracts/board.md` names in its "Sections and the line
// partition" table, with the table's seventh row — "no bucket: a blank line, and every level-two
// heading line" — split into the three distinct things a reader needs told apart:
//
//   columnHeading      a level-two heading that OPENED a column
//   nonColumnHeading   a level-two heading that opened a non-column SECTION instead
//   blanked            a line the comment pre-pass replaced with spaces, so the grammar never saw it
//
// The split is what lets a mutation declare the bucket it is refused INTO. Refusing
// `## Blocked (2)` and refusing a mini-board inside a comment are different refusals with different
// consequences for a reader, and a corpus that recorded both as "not a column" would not know the
// difference.
export const DISPOSITIONS = [
  "row",
  "epicRow",
  "update",
  "preamble",
  "nonColumnSection",
  "unparsed",
  "nonColumnHeading",
  "columnHeading",
  "blanked",
] as const;

/** Two-sided. A tenth disposition is a bucket the contract's partition table names first. */
export const DISPOSITION_COUNT = 9;

export type Disposition = (typeof DISPOSITIONS)[number];

export type CorpusKind = "live" | "mutation" | "control";

export type Transcription = "verbatim" | "framed";

// ── The frames ───────────────────────────────────────────────────────────────────────────────────

/**
 * The closed set of documents a corpus line can be replayed inside.
 *
 * Each name is one of the contract's positional rules made runnable. The comment frames differ only
 * in the indentation of the mini-board they carry, because indentation is precisely the axis
 * research measured the transcribed corpus to be blind on.
 */
export const FRAMES = [
  "preamble",
  "column",
  "nonColumnSection",
  "blockedTwo",
  "heading",
  "commentIndent4",
  "commentIndent1",
  "commentIndentTab",
  "commentUnindented",
  "commentUnterminated",
  "commentInsideColumn",
] as const;

/** Two-sided. A twelfth frame is a positional rule recorded in the contract first. */
export const FRAME_COUNT = 11;

export type Frame = (typeof FRAMES)[number];

export type CorpusRow = {
  /** Unique within the corpus; it is what a failure message names. */
  readonly id: string;
  readonly kind: CorpusKind;
  /** Repository-relative path of the artifact that justifies this row. */
  readonly source: string;
  readonly transcription: Transcription;
  /** The document this line is replayed inside. */
  readonly frame: Frame;
  /** ONE line. The frame supplies everything around it. */
  readonly input: string;
  readonly expectedDisposition: Disposition;
  /**
   * Whether the contract's two-space rule captures a parenthetical from this line. Declared on
   * VERBATIM rows only, and only where the disposition is a row — see the header's honesty note.
   */
  readonly expectedMeta?: "captured" | "null";
  readonly note: string;
};

// ── Source paths, cited once each ────────────────────────────────────────────────────────────────

const CHESS = "scripts/fixtures/board-replay/chess-board.md";
const DOGFOOD = "scripts/fixtures/board-replay/dogfood-board.md";
const SPEC = "docs/initial/agent_factory_builder_spec_v2.md";
const EX02 = "examples/02-brownfield-bootstrap.md";
const EX05 = "examples/05-release-run.md";
const KIT = "plans/board.md";
const SEED = "agent-factory/seed/plans/board.md";
const CONTRACT = "agent-factory/contracts/board.md";

/**
 * Every source this corpus CLAIMS to draw from, spelled once.
 *
 * `citedSources()` derives the same list from the rows, and the replay compares the two in both
 * directions — a declared source with no row is as much a defect as a row citing an undeclared
 * path, and a one-sided check catches neither.
 */
export const BOARD_CORPUS_SOURCES: readonly string[] = [
  CHESS,
  DOGFOOD,
  SPEC,
  EX02,
  EX05,
  KIT,
  SEED,
  CONTRACT,
];

// ── The document builder ─────────────────────────────────────────────────────────────────────────

/** The mini-board heading every comment frame carries above the line under test. */
const MINI_HEADING = "## In Development (WIP 1/3)";

/**
 * Build the document a corpus row is replayed inside.
 *
 * Returns the document text and the ONE-BASED line number of the row's own input, so a failure can
 * say which line it measured rather than leaving the reader to count.
 */
export function frameDocument(row: CorpusRow): { readonly text: string; readonly subjectLine: number } {
  const comment = (indent: string): string[] => [
    "# Board",
    "<!--",
    `${indent}${MINI_HEADING}`,
    `${indent}${row.input}`,
    "-->",
    "## Backlog (WIP unlimited)",
  ];

  let lines: string[];
  let subjectLine: number;

  switch (row.frame) {
    case "preamble":
      lines = ["# Board", row.input];
      subjectLine = 2;
      break;
    case "column":
      lines = ["# Board", "## Backlog (WIP unlimited)", row.input];
      subjectLine = 3;
      break;
    case "nonColumnSection":
      lines = ["# Board", "## Notes (bootstrap, 2026-06-05)", row.input];
      subjectLine = 3;
      break;
    case "blockedTwo":
      lines = ["# Board", "## Blocked (2)", row.input];
      subjectLine = 3;
      break;
    case "heading":
      lines = ["# Board", row.input, "- [ABC-014] a row beneath the heading under test"];
      subjectLine = 2;
      break;
    case "commentIndent4":
      lines = comment("    ");
      subjectLine = 4;
      break;
    case "commentIndent1":
      lines = comment(" ");
      subjectLine = 4;
      break;
    case "commentIndentTab":
      lines = comment("\t");
      subjectLine = 4;
      break;
    case "commentUnindented":
      lines = comment("");
      subjectLine = 4;
      break;
    case "commentUnterminated":
      // No closing delimiter is emitted, so the opener blanks to end of file — the fail-closed
      // direction the contract's Comments section names.
      lines = ["# Board", "<!--", MINI_HEADING, row.input];
      subjectLine = 4;
      break;
    case "commentInsideColumn":
      lines = [
        "# Board",
        "## Backlog (WIP unlimited)",
        "- [ABC-014] a live row standing above the comment",
        "<!--",
        MINI_HEADING,
        row.input,
        "-->",
      ];
      subjectLine = 6;
      break;
  }

  return { text: lines.join("\n"), subjectLine };
}

// ── The corpus ───────────────────────────────────────────────────────────────────────────────────

/**
 * The live half's remaining buckets.
 *
 * The 141 ticket rows below reach `row` and `epicRow` and nothing else. These lines are drawn from
 * the same five artifacts and reach the other five live buckets, so the disposition-coverage check
 * in the replay measures the grammar rather than measuring which bucket happened to be popular.
 */
const LIVE_OTHER: readonly CorpusRow[] = [
  {
    id: "live-update-chess",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "preamble",
    input: "_Updated: 2026-08-21 by the Orchestrator (task `uat-ABC-115-signoff-2026-08-21`, Workflow 06) — **ONE TICKET MOVED: `ABC-115` `Ready for UAT` → `Done` ON THE PROJECT OWNER'S WORD IN SESSION, VERBATIM: ... [elided 1891 chars]",
    expectedDisposition: "update",
    note: "The chess board carries twenty-five canonical update lines, every one of them in its header region above the first column heading. An update entry is its own class wherever it appears, so a header of that size never competes with the rows for a bucket.",
  },
  {
    id: "live-update-dogfood",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "preamble",
    input: "_Updated: 2026-06-08 by Orchestrator — GATE-2026-06-08 audit found 2 P0 runtime escapes on main; both fixed + merged (lean): DOG-014 (Vite proxy missing `/categories`+`/orders` → `Unexpected token '<' ... [elided 366 chars]",
    expectedDisposition: "update",
    note: "The dogfood board's single canonical update line.",
  },
  {
    id: "live-update-kit-placeholder",
    kind: "live",
    source: KIT,
    transcription: "verbatim",
    frame: "preamble",
    input: "_Updated: <ISO date> by <role>_",
    expectedDisposition: "preamble",
    note: "The kit board ships this placeholder on line 2. It is NOT a canonical update line, and classing it by POSITION rather than by content is what keeps a fresh install off the findings list on day one.",
  },
  {
    id: "live-heading-column",
    kind: "live",
    source: KIT,
    transcription: "verbatim",
    frame: "heading",
    input: "## In Development (WIP 0/3)",
    expectedDisposition: "columnHeading",
    note: "The limited form, the first of the contract's three legal heading suffixes, as the kit board ships it.",
  },
  {
    id: "live-comment-mini-board-kit",
    kind: "live",
    source: KIT,
    transcription: "framed",
    frame: "commentIndent4",
    input: "- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)",
    expectedDisposition: "blanked",
    note: "The kit board ships a forty-eight-line documentation block carrying a structurally valid mini-board, four-space indented. This is that block's first row, with the frame re-supplying the four spaces the source line carries. It is the shape every real comment in every real board happens to have, and it is exactly why the mutation half below had to be derived rather than found: the anchored heading scan alone refuses it, so it cannot tell a working pre-pass from a no-op.",
  },
  {
    id: "live-heading-non-column",
    kind: "live",
    source: SEED,
    transcription: "verbatim",
    frame: "heading",
    input: "## Columns (spec §6.1)",
    expectedDisposition: "nonColumnHeading",
    note: "Both kit boards and both real boards carry this heading. It is the phantom column the pre-Phase-32 suffix strip invented, recorded as the deliberate deviation D-06.",
  },
  {
    id: "live-section-line-kit",
    kind: "live",
    source: KIT,
    transcription: "verbatim",
    frame: "nonColumnSection",
    input: "WIP limits come from config (`wip_limits`); the numbers above are the lean defaults.",
    expectedDisposition: "nonColumnSection",
    note: "Prose from under the kit board's own `## Columns (spec §6.1)` heading. Under the pre-Phase-32 strip that heading opened a phantom column and this line became content of it.",
  },
];
/**
 * The mutation half — shapes derived from the contract's REFUSAL rules.
 *
 * None of these reaches `row`, `epicRow` or `update`. Each declares the bucket it lands in, because
 * a refusal a reader cannot name is a refusal a reader cannot act on.
 */
const MUTATIONS: readonly CorpusRow[] = [
  {
    id: "mut-comment-unindented",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "commentUnindented",
    input: "- [ABC-777] a documented example promoted to live state by one missing pre-pass",
    expectedDisposition: "blanked",
    note: "THE SINGLE HIGHEST-VALUE INPUT IN THIS CORPUS. With the comment pre-pass deleted, this row and the mini-board heading above it open a live column and file a live row, because nothing but the pre-pass refuses them. Every transcribed comment in every real board happens to be four-space indented, so this shape exists nowhere on disk and had to be derived from the contract.",
  },
  {
    id: "mut-comment-indent1",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "commentIndent1",
    input: "- [ABC-778] the same block, indented by one space",
    expectedDisposition: "blanked",
    note: "One space is not four. A parser defending itself with an anchored scan rather than with the pre-pass would refuse this too, which is why it is here beside the un-indented shape rather than instead of it.",
  },
  {
    id: "mut-comment-indent-tab",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "commentIndentTab",
    input: "- [ABC-779] the same block, indented by a tab",
    expectedDisposition: "blanked",
    note: "A tab is one character. A left-trim that stripped whitespace rather than refusing it would promote this row.",
  },
  {
    id: "mut-comment-unterminated",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "commentUnterminated",
    input: "- [ABC-780] a row below an opener that never closes",
    expectedDisposition: "blanked",
    note: "An agent that opens `<!--` and never closes it would otherwise expose the remainder of the board to the grammar. Blanking to end of file is the fail-closed direction: the board renders visibly empty rather than partially and confidently.",
  },
  {
    id: "mut-comment-inside-column",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "commentInsideColumn",
    input: "- [ABC-781] a row inside a comment opened after a live column heading",
    expectedDisposition: "blanked",
    note: "The pre-pass runs over the whole document before the heading scan, so a comment opened mid-board blanks exactly as one opened in the header. A pre-pass applied per section would not.",
  },
  {
    id: "mut-blocked-two-row",
    kind: "mutation",
    source: SPEC,
    transcription: "verbatim",
    frame: "blockedTwo",
    input: "- [ABC-009] XETRA close dates  (blocked-by: missing market-calendar source, since: 2026-05-30)",
    expectedDisposition: "unparsed",
    note: "A legal row shape refused by the heading ABOVE it. The builder specification ships the `## Blocked (2)` form, so agents read it and real trees carry it; the contract names it documented non-grammar. The projector shows the refusal rather than guessing at intent.",
  },
  {
    id: "mut-blocked-two-heading",
    kind: "mutation",
    source: SPEC,
    transcription: "verbatim",
    frame: "heading",
    input: "## Blocked (2)",
    expectedDisposition: "nonColumnHeading",
    note: "The heading itself, measured separately from the row beneath it. Refusing the heading and refusing the row are two claims, and a corpus that only carried the row could not say which one failed.",
  },
  {
    id: "mut-blocked-wrong-name",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "heading",
    input: "## Stuck (visible, time-tracked)",
    expectedDisposition: "nonColumnHeading",
    note: "The blocked suffix admits the single name `Blocked`. A suffix match alone is not a column.",
  },
  {
    id: "mut-wip-not-an-integer",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "heading",
    input: "## Done (WIP 1.5/3)",
    expectedDisposition: "nonColumnHeading",
    note: "A WIP number is read as a base-ten integer from an anchored digits-only shape. It is never rounded and never coerced to zero; a refusal a reader can see beats a number nobody wrote.",
  },
  {
    id: "mut-id-lowercase",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [abc-014] a lowercase identifier",
    expectedDisposition: "unparsed",
    note: "An identifier opens with a capital letter. All 141 measured rows conform; the lowercase shape is derived from the rule rather than found.",
  },
  {
    id: "mut-id-no-dash",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [ABC014] an identifier with no dash before its digits",
    expectedDisposition: "unparsed",
    note: "An identifier ends in a hyphen followed by digits. Any other bracket content makes the line unparsed.",
  },
  {
    id: "mut-row-indented",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "  - [ABC-015] an indented bullet inside a live column",
    expectedDisposition: "unparsed",
    note: "The row scan is anchored at the start of the line, so an indented bullet is not a ticket row even where no comment is involved. The contract names the nested sub-bullet beneath a ticket row as NOT YET GRAMMAR, so a reader meets this outcome as a decision rather than as a defect; a nesting grammar was considered and not written this phase.",
  },
  {
    id: "mut-heading-indented",
    kind: "mutation",
    source: CONTRACT,
    transcription: "framed",
    frame: "preamble",
    input: "  ## Backlog (WIP unlimited)",
    expectedDisposition: "preamble",
    note: "The heading scan is anchored too. An indented heading opens no column, so this line is content classed by position — here, before the first heading, which makes it preamble.",
  },
];

/**
 * The control half — shapes whose outcome a reader would guess wrong.
 *
 * Each one is admitted by the SHIPPED grammar, and each carries the sentence of the contract that
 * says why. They sit here rather than in the mutation half because declaring them refused would
 * make the replay assert something untrue, and a corpus that asserts the code it measures is wrong
 * is a corpus that gets edited until it agrees rather than one that gets read.
 */
const CONTROLS: readonly CorpusRow[] = [
  {
    id: "ctl-gap-two-spaces",
    kind: "control",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "The two-space gap is what discriminates a real parenthetical from a title that happens to contain parentheses. This is the admitted half of that pair.",
  },
  {
    id: "ctl-gap-one-space",
    kind: "control",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-014] Asset allocation chart (owner: Software Engineer, since: 2026-06-01)",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "One space short of the gap. The row stays legal and its title absorbs the parentheses; what changes is the META CAPTURE, which is the only thing the gap rule decides. A corpus declaring this REFUSED would be declaring a grammar nobody shipped.",
  },
  {
    id: "ctl-gap-tab",
    kind: "control",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-014] Asset allocation chart\t(owner: Software Engineer, since: 2026-06-01)",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "A tab is not two spaces. Same outcome as the one-space shape, and it is here because a gap rule written against `\\s{2}` rather than against two literal spaces would part company with the contract exactly here.",
  },
  {
    id: "ctl-id-disagreeing-prefix",
    kind: "control",
    source: CONTRACT,
    transcription: "framed",
    frame: "column",
    input: "- [XYZ-014] an identifier whose prefix is not the configured one",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "THE GRAMMAR AND THE DIAL ARE DIFFERENT AUTHORITIES. The contract's identifier rule has two clauses: a SHAPE clause, which `scripts/board-model.ts` enforces, and a clause requiring the prefix to equal `factory.config.json#id_prefix`, which it cannot — the module is pure and reads no config, which is the property the DASH-06 import-graph guard exists to keep. The prefix comparison therefore belongs to the join layer that already holds the dial. Recorded here rather than left for a reader to discover as a defect.",
  },
  {
    id: "ctl-row-bare",
    kind: "control",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-016] Empty-state UI",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "A row with no parenthetical is legal; its meta is null and its trailer is empty. Five of the builder specification's eight rows are this shape, and D-01 as first written admitted them while refusing the trailing-prose shape beside them.",
  },
  {
    id: "ctl-row-trailing-prose",
    kind: "control",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input:
      "- [DOG-001] Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "THE SHAPE D-01 REFUSED AND D-22 ADMITS. Fourteen of the dogfood board's sixteen rows and nineteen of the chess board's carry prose after the parenthetical; under the end-of-line-anchored form the projector would have opened on a real board reporting thirty-eight unparsed rows a human considers well formed.",
  },
];

/**
 * The 141 measured live ticket rows.
 *
 * Generated by transcription from the five sources and committed as data. The per-source totals are
 * asserted in the replay against the research measurement: chess 113, dogfood 16, the builder
 * specification 8, the brownfield example 3, the release example 1.
 */
const LIVE_ROWS: readonly CorpusRow[] = [
  {
    id: "live-chess-001",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-116] The `T2` re-measure trigger has a ruling and no carrier — record it where a hop that changes an existing child will actually meet it  (BA/PM, **XS, P2**, epic: —, since: 2026-08-21, **DoR  ... [elided 975 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 179; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-002",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-117] The record says a failed non-`EPIPE` stdout write exits `1` = `USAGE_EXIT_CODE` — it does not, and the fix a future hop would reach for cannot work  (BA/PM, **XS, P3**, epic: EPIC-006, sin ... [elided 1152 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 181; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-003",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-114] Four false sentences ship in `EPIC-006`'s own instrument comments — the guards are right and their narration is not  (BA/PM, **S, P2**, epic: EPIC-006, since: 2026-08-20, **DoR 9/10 ⚠️x1 — ... [elided 4012 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 184; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-004",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-112] The product advertises `quit` in its own `help` output and does not honour it — the PROMISE, not the effect  (BA/PM, **XS, P1**, epic: EPIC-006, since: 2026-08-20, **DoR 9/10 ⚠️x1 — PULLAB ... [elided 2782 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 187; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-005",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-111] Settle the warm/cold measurement protocol for `NFR-008`'s wall clause — a verdict that flips with the cache is not a verdict  (BA/PM, **M, P1**, epic: —, since: 2026-08-20, **DoR 9/10 ⚠️x1 ... [elided 5292 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 189; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-006",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-110] Close the default lane's 1.480 s CPU deficit — `NFR-008` is BREACHED, and both levers that can close it change something the owner ruled  (BA/PM, **L, P0**, epic: —, since: 2026-08-19, **D ... [elided 3477 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 191; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-007",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-109] `AGENTS.md` is inside three edits of a 32,768-byte cap that truncates SILENTLY from the tail — restructure it under budget without losing a directive  (BA/PM, **M, P1**, epic: —, since: 20 ... [elided 2556 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 193; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-008",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-108] The default test lane's own budget is spent — `NFR-008`'s 13 s CPU clause, re-measured on a quiet machine and RULED  (BA/PM, **M, P1**, epic: —, since: 2026-08-18, **DoR 9/10 ⚠️x1 — the ⚠️ ... [elided 2007 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 195; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-009",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-107] The message region cannot show a 7-candidate ambiguity — the frame's answer when a list does not fit  (BA/PM, **M, P2**, epic: EPIC-002, since: 2026-08-18, **DoR 8/10 ⚠️x2 — NOT READY; ite ... [elided 881 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 197; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-010",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-105] Nothing observes the QE hop — a ticket can reach `Done` with no QE note and no one notices  (BA/PM, **M (5), P2**, epic: —, since: 2026-08-17, **DoR 9/10 ⚠️x1 — the ⚠️ IS A QUESTION FOR TH ... [elided 1172 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 199; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-011",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-104] `coordinate-move.ts`'s docblock claims a totality it does not have  (BA/PM, XS, P3, epic: EPIC-003, since: 2026-08-17; **blocked on `ABC-031` merging — now unblocked**; docblock only, beha ... [elided 50 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 201; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-012",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-057] Licence guard — the unwitnessed `toEqual` comparator, and the docblock still stating `ADR-0011` clause 3's struck sentence  (BA/PM, XS, P2, epic: EPIC-006, since: 2026-08-16, DoR 9/10 ⚠️ o ... [elided 143 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 203; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-013",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-058] Three security-bar instruments cannot observe their own clauses  (BA/PM, S, P2, epic: EPIC-006, since: 2026-08-16, DoR 9/10 ⚠️ same ordering; `S1`/`Q5`, `S4`, `S5` — **all Security/NFR's f ... [elided 119 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 204; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-014",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-059] The `AGENTS.md` runnability guard pins a spelling, not the fact  (BA/PM, XS, P3, epic: EPIC-006, since: 2026-08-16, DoR 9/10 ⚠️ same ordering; `S6` — the mechanism that let `Q13` through a green gate)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 205.",
  },
  {
    id: "live-chess-015",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-060] Four `EPIC-006` tickets copy `A12`'s diff-scoping clause without naming the diff  (BA/PM, XS, P2, epic: EPIC-006, since: 2026-08-16, **DoR 10/10 MET — the only one of the four NOT blocked on `ABC-042`**; `Q12`)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 206.",
  },
  {
    id: "live-chess-016",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-069] The `Dev / run` slot's guard requires two rendering conventions of `AGENTS.md` and neither is written where a Scribe would see it  (BA/PM, XS, P3, epic: —, since: 2026-08-16, **DoR 10/10** ... [elided 251 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 209; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-017",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-070] `ABC-065` § Dependencies still names a drained claim as live and forbids pulling a ticket that merged  (BA/PM, XS, P3, epic: —, since: 2026-08-16, **DoR 10/10**; `G12`, confirmed by three  ... [elided 220 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 210; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-018",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-072] `ABC-041` clause (b) is written as a STATE predicate, its instrument covers one of three limbs, and its stated prediction is falsified  (BA/PM, S, P1, epic: —, since: 2026-08-16, DoR 9/10  ... [elided 441 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 211; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-019",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-073] Eight ticket pages restate clause (b) and not one uses the test the clause states — two carry no fail-safe sentence  (BA/PM, S, **P1**, epic: —, since: 2026-08-16, DoR 9/10 ⚠️x1 — ordering ... [elided 343 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 212; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-020",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-079] Quiescence search on captures  (EPIC-004, S, P0, **DoR 10/10 — RE-SCORED 2026-08-18 by BA/PM against `main` HEAD `7ea9e1b`; was 8/10 ⚠️x2. ⚠️(3) DISCHARGED BY MEASUREMENT** — ABC-076 and A ... [elided 551 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 214; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-021",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-080] Move ordering — MVV-LVA, killers, hash move  (EPIC-004, M, P0, DoR 8/10, needs ABC-078)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 215.",
  },
  {
    id: "live-chess-022",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-081] Transposition table + in-tree repetition  (EPIC-004, M, P0, DoR 7/10, needs ABC-075 + ABC-077)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 216.",
  },
  {
    id: "live-chess-023",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-082] Evaluation — pawn structure  (EPIC-004, S, P1, DoR 9/10, needs ABC-076)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 217.",
  },
  {
    id: "live-chess-024",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-083] Evaluation — king safety and mobility  (EPIC-004, S, P1, DoR 8/10, needs ABC-076/082/078)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 218.",
  },
  {
    id: "live-chess-025",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-084] Tactical puzzle suite — strength regression gate  (EPIC-004, M, P0, DoR 8/10, needs ABC-078)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 219.",
  },
  {
    id: "live-chess-026",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-085] Self-play ladder — ≥ 90% over 100 games  (EPIC-004, M, P1, DoR 7/10, needs ABC-087 + ABC-086; ~5 h opt-in run)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 220.",
  },
  {
    id: "live-chess-027",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-086] Deterministic move selection under a fixed seed  (EPIC-004, S, P0, DoR 8/10, needs ABC-078)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 221.",
  },
  {
    id: "live-chess-028",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-087] Difficulty levels — mechanism only, choosing is EPIC-006's  (EPIC-004, M, P1, DoR 7/10, needs ABC-078/086/084)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 222.",
  },
  {
    id: "live-chess-029",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-092] Decide and record the opening-book source and its licence before a byte is copied  (BA/PM, S, P1, epic: EPIC-005, since: 2026-08-16, DoR 9/10 ⚠️ the CHOICE is the owner's + Architect/Desig ... [elided 130 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 223; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-030",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-093] Compile the opening lines into one static, data-only, reproducible book artifact  (BA/PM, M, P1, epic: EPIC-005, since: 2026-08-16, DoR 8/10 ⚠️ HARD-BLOCKED on ABC-092's ADR; ⚠️ format is  ... [elided 121 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 224; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-031",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-094] Book probe — lookup, weighted seeded choice, and no crash on a missing or corrupt file  (BA/PM, M, P1, epic: EPIC-005, since: 2026-08-16, DoR 8/10 ⚠️ ordering on ABC-093 only; **the larges ... [elided 125 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 225; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-032",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-095] Put the book in front of the engine's move choice and fall through cleanly when it leaves book  (BA/PM, S, P1, epic: EPIC-005, since: 2026-08-16, **DoR 8/10 ⚠️x2 — RE-SCORED 2026-08-18 by  ... [elided 628 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 226; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-033",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-096] Show the named opening when the book knows it — inside the frame's existing row identity  (BA/PM, S, P3, epic: EPIC-005, since: 2026-08-16, DoR 8/10 ⚠️ needs ABC-093's format to carry the  ... [elided 219 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 227; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-034",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-100] The distribution channel — a superseding ADR on the owner's word, not a packaging build  (BA/PM, S, P1, epic: EPIC-006, since: 2026-08-16, DoR 8/10 ⚠️x2 — **BLOCKED ON THE OWNER, not on an ... [elided 243 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 228; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-035",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-101] Difficulty — the user-facing selection only; the engine budget behind it is EPIC-004's  (BA/PM, M, P2, epic: EPIC-006, since: 2026-08-16, DoR 7/10 ⚠️x3 — **buildable today and it changes n ... [elided 294 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 229; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-036",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-102] `undo` — two plies back in one command, and the loop arm it has no home in  (BA/PM, S, P1, epic: EPIC-006, since: 2026-08-16, DoR 7/10 ⚠️x3 — **blocked by the SAME RULING as `ABC-046`, own ... [elided 192 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 230; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-037",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-045] `resign` — the one session command merged contracts already express  (BA/PM, XS, P1, epic: EPIC-006, since: 2026-08-13, DoR 8/10 ⚠️x1 blocker — ordering only: ABC-035 + ABC-037 + ABC-043; 0 new test files)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 231.",
  },
  {
    id: "live-chess-038",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-046] `quit` + `new` — the two commands the merged loop has no arm for  (BA/PM, S, P2, epic: EPIC-006, since: 2026-08-13, DoR 7/10 ⚠️x2 blockers — **blocked by a RULING, owner Architect/Design** ... [elided 74 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 232; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-039",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-051] ABC-021 left the turn loop's own records false in four places, and its per-ply bar blind to the derive the loop now makes  (BA/PM, S, P2, epic: EPIC-002, since: 2026-08-13, **DoR 10/10**;  ... [elided 109 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 233; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-040",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-052] The traceability Status column goes stale on every merge — 12 of 27 Done tickets, and it grew by two this morning  (BA/PM, S, P2, epic: —, since: 2026-08-13, DoR 8/10 ⚠️x2 NOT MET — orderi ... [elided 128 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 234; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-041",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-053] The frame-path probe measures LOAD-time closure, and NFR-002's premise is the PER-FRAME path  (BA/PM, S, P1, epic: —, since: 2026-08-13, DoR 9/10 ⚠️x1 — **the ruling is Architect/Design's  ... [elided 252 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 235; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-042",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-054] Two merged guards count import STATEMENTS, not consumers — one blind spot, a false GREEN on ABC-041 A8 and a false RED on the licence guard  (BA/PM, S, P1, epic: —, since: 2026-08-13, DoR  ... [elided 285 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 236; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-043",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-055] This board defines 13 columns and renders 10 — In Analysis, In Design and Ready for Dev have no heading  (BA/PM, S, P2, epic: —, since: 2026-08-13, **DoR 10/10**; three WIP limits — 2, 2,  ... [elided 200 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 237; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-044",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-056] AR-1's accepted-risk override has drifted — its reason covers brace-expansion only, and two of three advisories are nanoid and postcss  (BA/PM, XS, P2, epic: —, **owner: Release Manager**, ... [elided 308 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 238; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-045",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-039] Backward-move ordinals are uncitable — a false FIRST live on this board, and a double-booked SECOND  (BA/PM, S, P2, epic: —, since: 2026-08-13, DoR 9/10 ⚠️x1 — the register is citable but  ... [elided 408 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 240; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-046",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-040] Duplicate ABC-028/ABC-029 rows in traceability — 40 rows for 38 tickets  (BA/PM, S, P2, epic: —, since: 2026-08-13, **DoR 10/10**; the ABC-028 pair is a LOSSLESS DELETE and the ABC-029 pai ... [elided 177 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 241; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-047",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-034] Rejections that teach — a closed reason set computed from the generator  (BA/PM, M, P0, epic: EPIC-003, since: 2026-08-13, **DoR 10/10 — RE-SCORED 2026-08-18 by BA/PM against `main` HEAD ` ... [elided 481 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 243; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-048",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-036] The `moves` command — the count is exact, and the frame cannot show the list  (BA/PM, S, P1, epic: EPIC-003, since: 2026-08-13, **DoR 8/10 ⚠️x3; the third was a reduced user-facing promise ... [elided 197 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 244; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-049",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-038] Tab-completion of legal moves and commands — one derive per prompt  (BA/PM, S, P2, epic: EPIC-003, since: 2026-08-13, DoR 9/10 ⚠️x2; **the epic's stated negotiable slice — cut FIRST if EPI ... [elided 86 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 245; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-050",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-010] FEN semantic validation  (BA/PM, M, P1, epic: EPIC-003, since: 2026-07-29, **DoR re-verified 2026-08-13: 9/10, NOT the 10/10 the page claimed — NOT promoted.** Its page says `src/fen.ts` h ... [elided 327 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 246; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-051",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-024] Castling guards protected only by the opt-in deep lane  (BA/PM, S, P2, epic: EPIC-001, since: 2026-08-10, **DoR 8/10 → 9/10; both original ⚠️ discharged by ABC-023's merge, one NEW ⚠️ open ... [elided 306 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 247; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-052",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-030] NFR-justification comments cite a live sibling test count  (BA/PM, XS, P3, **epic: EPIC-002 — CORRECTED, this row read `—` against the ticket and trace which both read EPIC-002**, since: 2 ... [elided 203 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 248; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-053",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [EPIC-003] Move input and controls  (owner: BA/PM, **size: XL — corrected from M, 22 points over nine tickets against EPIC-002's 23; the no-XL rule binds TICKETS, largest here is M, no SPLIT_REQUIRE ... [elided 303 chars]",
    expectedDisposition: "epicRow",
    note: "cli-chess board, source line 249; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-054",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [EPIC-004] Engine and AI opponent  (owner: BA/PM, **size: XL — corrected from `L`, 37 points over 14 tickets; that is 1.7x `EPIC-003`, the epic this board already calls `XL`, and `XL` is the top of  ... [elided 597 chars]",
    expectedDisposition: "epicRow",
    note: "cli-chess board, source line 250; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-055",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [EPIC-005] Opening book  (owner: BA/PM, **size: M — corrected from `S`; the cutter stopped at `M` deliberately, refusing the M→XL/M→L precedent as \"a pattern, not evidence\", since `L` would claim th ... [elided 473 chars]",
    expectedDisposition: "epicRow",
    note: "cli-chess board, source line 251; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-056",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [EPIC-006] Game session and packaging  (owner: BA/PM, **size: XL — corrected from `L`; 9 tickets / 20 points across both halves, ~1.5x the 13 `L` was assigned, and it hit that ceiling BEFORE distrib ... [elided 671 chars]",
    expectedDisposition: "epicRow",
    note: "cli-chess board, source line 252; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-057",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-115] A piped session dies on `write EPIPE` with a raw Node stack and exits `1` — the code the product reserves for a refused command line  (BA/PM, **S, P1**, epic: EPIC-006, since: 2026-08-20,  ... [elided 33971 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 296; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-058",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-043] The live session — runTurnLoop wired, and [D31]'s top-level handler  (BA/PM, M, P0, epic: EPIC-006, since: 2026-08-13, DoR 7/10 ⚠️x2 blockers — ABC-037 open and **no EngineSeam exists anyw ... [elided 12283 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 298; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-059",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-050] The lane runner config has no guard — no static tool reads `vitest.config.ts`, and no assertion watches the containment it buys  (BA/PM, S, P2, epic: —, since: 2026-08-13, **DoR 10/10**; T ... [elided 3311 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 299; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-060",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-113] Two instrument residuals in `EPIC-006`'s own test files — one row that a wrong build passes, and two rows that cannot fail  (BA/PM, **XS, P2**, epic: EPIC-006, since: 2026-08-20, **DoR 9/1 ... [elided 27675 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 300; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-061",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-044] The result screen — eight reasons, two faults, the full move list  (BA/PM, S, P1, epic: EPIC-006, since: 2026-08-13, DoR 8/10 ⚠️x1 blocker — waits on ABC-043; **the reason count is SETTLED ... [elided 14288 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 301; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-062",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-037] The real prompt — a line reader over stdin that IS ABC-019's `InputSeam`  (BA/PM, M, P0, epic: EPIC-003, since: 2026-08-13, DoR 9/10 ⚠️x2 — ordering on ABC-033+ABC-035; **first production  ... [elided 7841 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 303; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-063",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-078] Iterative deepening + EngineSeam — RISK-002 discharged here  (M, P0, epic: EPIC-004, pulled 2026-08-18 by the Orchestrator at task `ticket-to-pr-ABC-078-2026-08-18`, branch `grugops/abc078 ... [elided 9396 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 305; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-064",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-035] In-game commands — `help`, `board`, `quit`, `claim`: grammar only, effects stay with EPIC-006/ABC-021  (S, P1, epic: EPIC-003, **→ In Development 2026-08-18.** Pulled by the Orchestrator a ... [elided 5791 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 307; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-065",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-033] One prompt, both formats, no mode switch — and the ambiguity outcome  (S, P0, epic: EPIC-003, moved to `In Review` 2026-08-18 by the Software Engineer at task `ticket-to-pr-ABC-033-2026-08 ... [elided 4292 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 309; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-066",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-103] `src/cli.test.ts` hard-codes the production-module count, and it reds on every new module  (**DONE 2026-08-18 under the 2026-08-17 ZERO-PRODUCTION-LINES UAT WAIVER — measured from git, not ... [elided 2278 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 312; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-067",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-106] The three QE rows call ruled tolerances \"CHARACTERIZATION\", which is now false and invites the next author to delete specification  (**DONE 2026-08-18 under the 2026-08-17 ZERO-PRODUCTION- ... [elided 1602 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 314; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-068",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-032] `parseSan` — SAN resolved against the legal move list, three closed outcomes  (M, P0, epic: EPIC-003, merged `main` 2026-08-18, **CLOSED ON THE OWNER'S WORD 2026-08-18 — NO UAT CONDUCTED,  ... [elided 372 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 316; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-069",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-077] Negamax with alpha-beta — the recursion core  (M, P0, epic: EPIC-004, merged `main` 2026-08-18, **CLOSED ON THE OWNER'S WORD 2026-08-18 — NO UAT CONDUCTED; production lines shipped so the  ... [elided 538 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 317; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-070",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-031] Coordinate move input — `e2e4`, `E2E4`, `e2-e4`, `e7e8q` against the legal move list  (S, P0, epic: EPIC-003, merged `main` 2026-08-17, **CLOSED on the owner's word 2026-08-17 — NO UAT CON ... [elided 234 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 319; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-071",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-076] Evaluation — material and piece-square tables  (M, P0, epic: EPIC-004, merged `main` 2026-08-17, **CLOSED on the owner's word 2026-08-17 — NO UAT CONDUCTED; 164 production lines so the wai ... [elided 209 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 320; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-072",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-063] UAT-16 names six commands and not one appears in any test  (XS, P2, merged `6aedb7e`, gate green on the branch tip AND on `main`: 865/865 on 30 files, skip 0, `No findings.`; A1/A2/A3/A4 M ... [elided 488 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 322; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-073",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-064] Frame shape pinned on one child of four; the status panel on none of the other three  (S, P2, merged `3b165ed`, gate green on the branch tip AND on `main`: 869/869 on 30 files, skip 0, `No ... [elided 811 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 323; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-074",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-062] Two command lines reach the refusal path untested, and one of them crashes there instead of refusing  (XS, P1, epic: —, merged `56a48bd`, closed 2026-08-17; gate green on the branch tip AN ... [elided 257 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 324; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-075",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-061] The resolver's accepting path is asserted by `.ok` alone — CLOSED  (S, P1, closed 2026-08-17, merged @ `682c9e8`, delivered `74900e7`; A1/A2/A3/A5/A6 MET and independently verified, **both ... [elided 487 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 325; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-076",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-068] Shared test helpers have no written contracts — `advertisedTextOf` returns garbage where its sibling throws  (XS, P2, closed 2026-08-17, merged @ `3232929`, delivered `30ea8f3`; A1-A7 all  ... [elided 443 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 326; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-077",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-067] `Dev / run` slot guard window has no upper bound — CLOSED  (XS, P2, `A1`-`A6` all met, merged @ `82133dd`, 2026-08-16; **no UAT — the owner WAIVED the step for this ticket, he did not sign one**)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 327.",
  },
  {
    id: "live-chess-078",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-071] `Dev / run` slot guard has no START anchor either — CLOSED  (XS, P2, `A1`-`A5` all met, same commit as `ABC-067`, 2026-08-16; **uniqueness ASSERTED, not accepted**; same waiver, same limit)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 328.",
  },
  {
    id: "live-chess-079",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-065] `AGENTS.md`'s `Dev / run` never shows the `--` separator, and its option list is compared to nothing  (owner: UAT Planner, S, P1, epic: —, since: 2026-08-15, **MERGED to `main` @ `460b9f5` ... [elided 1981 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 330; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-080",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-066] The usage line printed on every refusal is not a runnable command — the user who does what it says reproduces the error he is reading  (owner: UAT Planner, S, P1, epic: —, since: 2026-08-1 ... [elided 2068 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 332; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-081",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-042] The entry point — argv, the resolved colour, and the first frame  (M, P0, epic: EPIC-006, **MERGED to `main` @ `dbaf972` 2026-08-15 on the owner’s answer to `G1`; gates green on the branch ... [elided 628 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 334; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-082",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-041] Render-seam closure — four merged modules become one `RenderSeam`  (S, P0, epic: EPIC-006, **MERGED to `main` 2026-08-13; gate READY_FOR_HUMAN_REVIEW after TWO blocks, 827/827 on 29 files, ... [elided 300 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 335; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-083",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-021] Draw-claim interaction — the player having the move claims  (S, P1, epic: EPIC-002, **MERGED to `main` by fast-forward 2026-08-13; gate READY_FOR_HUMAN_REVIEW, 816/816 on 28 files, skip 0, ... [elided 860 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 336; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-084",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [EPIC-002] Terminal board and game loop  (XL, P0, **COMPLETE 2026-08-13 — all nine tickets `ABC-012`…`ABC-019` + `ABC-021` are in `Done`.** The second epic to close, 22 days after `EPIC-001`. **What ... [elided 268 chars]",
    expectedDisposition: "epicRow",
    note: "cli-chess board, source line 337; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-085",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-026] The default test lane has no cumulative budget  (S, P1, **MERGED to `main` by fast-forward 2026-08-13, `21f5a12`+`f4cde5a`; gate READY_FOR_HUMAN_REVIEW, gates green on the branch tip befor ... [elided 1230 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 339; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-086",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-028] The history pane's three unreached input classes — a length-preserving mutation, an odd slid window, and the during-render clause over the whole `GameHistory` graph  (owner: BA/PM, size: S ... [elided 26586 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 341; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-087",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-029] \"Production module\" is undefined — the two guards of `NFR-002`'s structural premise disagree about their own file set, and one shares a channel with the modules it measures  (owner: BA/PM  ... [elided 23405 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 342; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-088",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-019] Turn loop skeleton — ply dispatch, both seams stubbed, clean termination  (size: L, P0, epic: EPIC-002, promoted: 2026-08-11 by BA/PM at refinement-ABC-019; blocked-until: NONE — ABC-012/A ... [elided 19823 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 343; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-089",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-017] Bounded move-history pane — two-column SAN, constant height, constant width  (size: S, P2, epic: EPIC-002, promoted: 2026-08-10 by BA/PM at refinement-ABC-017; blocked-until: NONE — ABC-01 ... [elided 18875 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 344; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-090",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-027] The in-place frame writer clears each row as it writes it — a narrowing frame leaves stale columns on screen  (**merged: 2026-08-12 by fast-forward, no merge commit; gates on the branch ti ... [elided 1452 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 345; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-091",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-016] Status panel — side to move, check, material, move number, last move, thinking, draw-claim  (**merged: 2026-08-12 by fast-forward `98c8a8d` → `799adbf`, 16 commits, NO merge commit** — `br ... [elided 2158 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 347; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-092",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-025] SAN qualifier minimality — the acceptance net is exercised on white knights and white queens only  (merged: 2026-08-10 **on the owner's explicit instruction** by fast-forward `995d398` → ` ... [elided 1945 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 349; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-093",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-013] SAN rendering — src/san.ts with toSan only  (merged: 2026-08-10 **by the owner** by fast-forward `eb706f9` → `8dd8d22`, 14 commits, **no merge commit** — `git log --merges eb706f9..main` e ... [elided 3235 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 350; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-094",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-023] Castling precondition net — destination square, joint occupant pair, one-axis doubling  (merged: 2026-08-10 by fast-forward b2d3554 → f739a30, 13 commits, no merge commit — `git rev-list - ... [elided 2472 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 351; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-095",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-022] generateMoves offers en-passant captures its own preconditions forbid  (merged: 2026-08-09 by fast-forward cb6515f → 52c6443, 18 commits, no merge commit; 559/559 on 18 files + skip 0 + de ... [elided 244 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 352; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-096",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-009] legalMoves mutates the position it documents as unchanged  (merged: 2026-08-09 by fast-forward aad6d48 → 5ee84e8, 19 commits, no merge commit — `git rev-list --count HEAD..main` was 0 and  ... [elided 3197 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 353; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-097",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-018] Frame output and redraw — in-place on a TTY, append otherwise, constant height  (merged: 2026-08-09 by fast-forward 7e0923c → 364928b, 5 commits, no merge commit — `git rev-list --count br ... [elided 1374 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 354; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-098",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-015] Glyph mode selection — precedence, signal set, --unicode override  (merged: 2026-08-08 by fast-forward f1743a3 → f4d5d31, 12 commits, no merge commit — `git log --merges` empty and `git re ... [elided 1078 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 355; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-099",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-014] Board frame renderer — grid, labels, shading, orientation, both glyph modes  (merged: 2026-08-08 by fast-forward ed42d26 → c1d694f, 6 commits, no merge commit; 253/253 green + skip 0 re-ve ... [elided 559 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 356; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-100",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-012] Game history module — the move list is the authoritative state  (merged: 2026-08-06 by fast-forward 39e260d → 7355b51, 8 commits, no merge commit; 226/226 green + skip 0 re-verified ON mai ... [elided 355 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 357; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-101",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-011] Zobrist key hashes en passant when no capture is available  (merged: 2026-08-04 by fast-forward 4a73cf3 → d3efba6, 16 commits, no merge commit; 214/214 green + 0 skips re-verified ON main; ... [elided 216 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 358; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-102",
    kind: "live",
    source: CHESS,
    transcription: "framed",
    frame: "column",
    input: "- [ABC-020] FIDE 9.2/9.3 draws become claimable, FIDE 9.6 backstops land with them  (merged: 2026-08-02 by fast-forward d53ce31 → cb62c9f; 174/174 green re-verified ON main; QE PASS after 13 mutations ... [elided 175 chars]",
    expectedDisposition: "row",
    note: "cli-chess board, source line 359; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-chess-103",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [EPIC-001] Chess rules core  (complete: 2026-07-24, decomposed ABC-001..ABC-007 + ABC-008 spike, all merged; rule-complete and perft-proven)",
    expectedDisposition: "epicRow",
    expectedMeta: "captured",
    note: "cli-chess board, source line 360.",
  },
  {
    id: "live-chess-104",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-008] SPIKE — Node search throughput  (merged: 2026-07-23, outcome: GO WITH CONSTRAINT, RISK-002 answered)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 361.",
  },
  {
    id: "live-chess-105",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-001] Position state and FEN round-trip  (merged: 2026-07-23, 27 tests, ADR-0001)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 362.",
  },
  {
    id: "live-chess-106",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-002] Pseudo-legal move generation for all piece types  (merged: 2026-07-23, 22 tests, QE PASS no defects)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 363.",
  },
  {
    id: "live-chess-107",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-003] Apply and undo a move with full state restoration  (merged: 2026-07-23, 15 tests, QE PASS no defects, src/apply.ts 100% coverage)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 364.",
  },
  {
    id: "live-chess-108",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-004] Special moves — castling, en passant, promotion  (merged: 2026-07-24, review gate PASS, QE PASS, sec/NFR PASS; UAT deferred → EPIC-006)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 365.",
  },
  {
    id: "live-chess-109",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-005] Legal move filtering and attack detection  (merged: 2026-07-24, review gate PASS, QE PASS, sec/NFR PASS; UAT deferred → EPIC-006)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 366.",
  },
  {
    id: "live-chess-110",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-006] Perft verification harness  (merged: 2026-07-24, deep perft 32/32 exact, RISK-001 retired, NFR-001 ~6.2M nps; UAT deferred → EPIC-006)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 367.",
  },
  {
    id: "live-chess-111",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-007] Game-end detection  (merged: 2026-07-24, review gate PASS, QE PASS, sec/NFR PASS, EPIC-001 rule-complete; UAT deferred → EPIC-006)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 368.",
  },
  {
    id: "live-chess-112",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-074] SPIKE — depth-in-budget on non-M3 target hardware  (EPIC-004, S, P0, DoR 7/10, BLOCKED: no non-M3 machine)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 385.",
  },
  {
    id: "live-chess-113",
    kind: "live",
    source: CHESS,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-075] Incremental Zobrist key seam  (EPIC-004, M, P0, DoR 8/10, BLOCKED: Architect/Design owes the ep-component ruling)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "cli-chess board, source line 386.",
  },
  {
    id: "live-dogfood-001",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-016] Gate integrity — run integration tests in the gate + add e2e smoke + proxy-contract guard  (epic: EPIC-006, size: M, P1)  — filed 2026-06-08 from GATE-2026-06-08. **Item 1 DONE** (merged 2 ... [elided 299 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 39; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-002",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-001] Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 54.",
  },
  {
    id: "live-dogfood-003",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-002] Database schema & migrations  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (fc47944); gate green, QE PASS, Security/NFR PASS_WITH_RISKS",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 55.",
  },
  {
    id: "live-dogfood-004",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-003] Staff authentication (login)  (epic: EPIC-005, size: M, P0)  — merged to main 2026-06-06 (566bb2c); gate green, QE PASS, Security/NFR PASS_WITH_RISKS",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 56.",
  },
  {
    id: "live-dogfood-005",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-004] RBAC middleware + roles  (epic: EPIC-005, size: S, P0)  — merged to main 2026-06-06 (409bdfb); gate green (42✓), QE PASS, Security/NFR PASS_WITH_RISKS",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 57.",
  },
  {
    id: "live-dogfood-006",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-006] Admin category CRUD  (epic: EPIC-003, size: S, P2)  — merged to main 2026-06-06 (88c7bb5); gate green (57✓, 12 new), QE PASS, Security/NFR PASS_WITH_RISKS",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 58.",
  },
  {
    id: "live-dogfood-007",
    kind: "live",
    source: DOGFOOD,
    transcription: "verbatim",
    frame: "column",
    input: "- [DOG-012] UI foundation — PrimeVue v4 + PawPantry theme  (epic: EPIC-006, size: M, P1)  — merged to main 2026-06-06 (efbf3bc); gate green (web 16✓), QE PASS_WITH_GAPS, Security/NFR PASS_WITH_RISKS; bundle 159.5 kB gz",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "dogfood board, source line 59.",
  },
  {
    id: "live-dogfood-008",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-007] Public catalog browse + filter  (epic: EPIC-001, size: M, P1)  — merged to main 2026-06-07 (8dada12); gate green, DB-verified api 66✓ (8 products-integration) + web 24✓; QE PASS_WITH_GAPS, ... [elided 67 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 60; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-009",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-008] Product detail page  (epic: EPIC-001, size: S, P1)  — merged to main 2026-06-07 (5bd2436); gate green, DB-verified api 70✓ (4 product-detail-integration) + web 34✓; QE PASS_WITH_GAPS, Secu ... [elided 45 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 61; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-010",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-009] Cart + guest checkout (persist order)  (epic: EPIC-002, size: L, P1)  — merged to main 2026-06-07 (b7a76d5); gate green, DB-verified api 94✓ (15 order-pricing unit + 9 orders-integration i ... [elided 162 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 62; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-011",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-010] Staff order queue + status workflow  (epic: EPIC-004, size: M, P1)  — merged to main 2026-06-07 (19f027d); gate green (2/2 self-fix), DB-verified api 101✓ (7 orders-admin integration: tran ... [elided 221 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 63; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-012",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-005] Admin product CRUD  (epic: EPIC-003, size: L, P1)  — merged to main 2026-06-07 (f2b233b); gate green (3 fixes, all pre-merge), DB-verified api 114✓ (7 products-admin integration + 6 image- ... [elided 223 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 64; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-013",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-011] Product attribute model (size/age/breed) + filtering  (epic: EPIC-001, size: M, P2)  — merged to main 2026-06-07 (a653b58); gate green (1 fix, pre-merge), DB-verified api 133✓ (7 products- ... [elided 272 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 65; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-014",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-013] Login 500 (runtime `.env` not loaded) + API request/error logging  (epic: EPIC-005, size: S, P0, incident)  — merged to main 2026-06-08; gate green, DB-verified api 133✓ + web 70✓ + build  ... [elided 344 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 66; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-015",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-014] Dev Vite proxy missing `/categories` + `/orders`  (epic: EPIC-006, size: XS, P0, incident)  — merged to main 2026-06-08; gate green (api 133✓ + web 71✓ + shared 6✓ + build ✓), **live-verif ... [elided 377 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 67; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-dogfood-016",
    kind: "live",
    source: DOGFOOD,
    transcription: "framed",
    frame: "column",
    input: "- [DOG-015] Broken storefront images (seed `/img/*` served by nobody)  (epic: EPIC-001, size: S, P0, incident)  — merged to main 2026-06-08; gate green (web 71✓ incl. new fallback test), **live-verifi ... [elided 413 chars]",
    expectedDisposition: "row",
    note: "dogfood board, source line 68; tail elided on transcription, so no meta claim is made.",
  },
  {
    id: "live-spec-001",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "builder specification's board example, source line 607.",
  },
  {
    id: "live-spec-002",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "builder specification's board example, source line 610.",
  },
  {
    id: "live-spec-003",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-009] XETRA close dates  (blocked-by: missing market-calendar source, since: 2026-05-30)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "builder specification's board example, source line 613.",
  },
  {
    id: "live-spec-004",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-015] CSV export",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "builder specification's board example, source line 616.",
  },
  {
    id: "live-spec-005",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-016] Empty-state UI",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "builder specification's board example, source line 617.",
  },
  {
    id: "live-spec-006",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-017] ...",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "builder specification's board example, source line 620.",
  },
  {
    id: "live-spec-007",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-014] (M=3)",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "builder specification's board example, source line 668.",
  },
  {
    id: "live-spec-008",
    kind: "live",
    source: SPEC,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-015] (S=2)",
    expectedDisposition: "row",
    expectedMeta: "null",
    note: "builder specification's board example, source line 669.",
  },
  {
    id: "live-ex02-001",
    kind: "live",
    source: EX02,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-001] Add request validation to /charge endpoint  (owner: BA/PM, sized: S, P2)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "brownfield-bootstrap worked example, source line 64.",
  },
  {
    id: "live-ex02-002",
    kind: "live",
    source: EX02,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-002] Pin the unversioned base image in the Dockerfile  (owner: BA/PM, sized: XS, P1)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "brownfield-bootstrap worked example, source line 65.",
  },
  {
    id: "live-ex02-003",
    kind: "live",
    source: EX02,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-003] Document the known build/test commands in AGENTS.md  (owner: BA/PM, sized: S, P2)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "brownfield-bootstrap worked example, source line 66.",
  },
  {
    id: "live-ex05-001",
    kind: "live",
    source: EX05,
    transcription: "verbatim",
    frame: "column",
    input: "- [ABC-012] Portfolio FX conversion  (release: REL-0007, status: READY_TO_RELEASE)",
    expectedDisposition: "row",
    expectedMeta: "captured",
    note: "release-run worked example, source line 68.",
  },
];

export const BOARD_CORPUS: readonly CorpusRow[] = [
  ...LIVE_ROWS,
  ...LIVE_OTHER,
  ...MUTATIONS,
  ...CONTROLS,
];

// ── Integrity, derivations and the provenance self-check ─────────────────────────────────────────

// THE ROW TOTAL, AND WHY IT IS ASSERTED HERE RATHER THAN ONLY IN THE TEST.
//
// A corpus that silently loses the shapes it exists to replay is worse than no corpus: the replay
// still prints a green line, over fewer rows. The count therefore lives in the same file as the data
// and is checked at module load, so the two cannot drift apart even for a reader who never runs the
// test.
export const BOARD_CORPUS_COUNT = 167;

if (BOARD_CORPUS.length !== BOARD_CORPUS_COUNT) {
  throw new Error(
    `board-corpus: BOARD_CORPUS_COUNT is ${BOARD_CORPUS_COUNT} and the corpus holds ${BOARD_CORPUS.length} row(s). ` +
      "The count and the data are declared in one file precisely so this cannot be resolved by " +
      "changing whichever one is more convenient — establish which rows moved first.",
  );
}

/** Every distinct source path the ROWS cite — derived from the data, never from the declared list. */
export function citedSources(): readonly string[] {
  return [...new Set(BOARD_CORPUS.map((r) => r.source))].sort();
}

/**
 * Given a repository root, every cited source path that does not resolve on disk.
 *
 * IT SWALLOWS NOTHING. There is no try/catch and no default: a path either exists or it is
 * returned. A row whose citation has been deleted or renamed is a row nobody can check against its
 * record, and the replay fails on a non-empty return.
 */
export function unresolvedSources(root: string): readonly string[] {
  return citedSources().filter((rel) => !existsSync(join(root, rel)));
}

/** Rows of one kind, in corpus order. Derived, never hand-kept. */
export function rowsOfKind(kind: CorpusKind): readonly CorpusRow[] {
  return BOARD_CORPUS.filter((r) => r.kind === kind);
}

/** One row by id, or `undefined`. The discrimination proof plants rows BY ID. */
export function rowById(id: string): CorpusRow | undefined {
  return BOARD_CORPUS.find((r) => r.id === id);
}
