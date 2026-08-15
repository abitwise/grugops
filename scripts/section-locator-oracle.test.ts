// ─────────────────────────────────────────────────────────────────────────────────────────────
// section-locator-oracle.test.ts — A PARSER ORACLE OVER THE ONE SECTION-LOCATOR AUTHORITY
// (plan 29-26, LANG-07, D-24).
//
// WHAT THIS FILE IS, AND WHY IT IS NOT A SECOND PILE OF EXAMPLES. Plans 29-20 through 29-25 deleted
// FIVE private "where does this section start and end" predicates and replaced them with the pair
// `unfencedHeadingIndex` / `sectionEndIndex` in scripts/frontmatter.ts. Each of those plans pinned
// the axes IT moved, with cases it wrote beside the fix. That is exactly the shape this phase has
// paid for twenty-four times: a fix believed on the strength of the test written next to it. The
// missing question is not "does the new authority do what plan N intended" but "what BOUNDS its
// input" — the question none of round 1's executors asked, and the reason round 1 closed nine
// findings and still shipped three bypasses.
//
// So this file does not test the authority by example. It generates a CROSS-PRODUCT over the axes
// on which the five deleted predicates measurably disagreed, and checks every cell against
// STRUCTURAL INVARIANTS — properties of the ANSWER that hold by construction, whatever the input.
// No expected output is transcribed anywhere below, and no reference implementation of either
// locator exists in this file except the two DELIBERATELY BROKEN ones used to prove the sweep can
// fail.
//
// THE THREE INVARIANTS OVER `sectionEndIndex`, STATED AS PROPERTIES OF THE ANSWER:
//
//   I1  the answer is at least `from` and at most the document's line count;
//   I2  when the answer is below the line count, the line AT it is unflagged by the one fence
//       authority and is an ATX heading of level at most the requested level;
//   I3  no line in `[from, answer)` is BOTH unflagged AND a heading of level at most the requested
//       level.
//
// I3 IS THE FOUNDING DEFECT OF THIS PHASE STATED AS A CHECKABLE PROPERTY. A predicate satisfying it
// cannot walk past a heading that closes the caller's section, and therefore cannot adopt bytes
// belonging to a later section — which is what `readCavemanFence` did at exit 0 for an entire
// milestone. The plan words I3 as "strictly between `from` and the end"; it is implemented over the
// half-open range `[from, answer)`, which is STRONGER and is the range the authority documents
// itself over (the search is inclusive at `from`). The stronger form is used deliberately, and the
// difference is recorded here rather than left for a reader to notice.
//
// THE THREE INVARIANTS OVER `unfencedHeadingIndex`:
//
//   I4  the answer is minus one, or an index whose line is unflagged and whose `trimEnd()` equals
//       the requested heading;
//   I5  when the answer is an index, NO EARLIER line satisfies those same two conditions — it is
//       the FIRST such line, which is what the name promises;
//   I6  when the answer is minus one, NO line anywhere satisfies them — the completeness half,
//       without which a locator that simply gave up early would satisfy I4 and I5 vacuously.
//
// WHERE THE INDEPENDENCE LIES, AND WHERE IT DELIBERATELY DOES NOT. The heading-level predicate used
// by I2 and I3 (`headingLevelAtColumnZero` below) is written from the RULE the authority's own
// header states in prose — a run of hashes at column zero followed by a literal space — and never
// from either regex. A case below reads its source back and requires it to name no symbol of the
// module, the way scripts/frontmatter.test.ts already proves its cross-product rule non-circular.
//
// The FENCE predicate is the opposite and on purpose: I2 and I3 consult `fencedLineFlags`, the one
// fence authority, rather than a second fence parser written here. The property being checked is
// "the locator agrees with the ONE fence toggle", not "the locator agrees with a rival toggle", and
// writing a rival toggle in this file would be the exact defect the phase exists to delete —
// scripts/frontmatter.test.ts derives and pins the fence-machine set at three members, and a fourth
// machine landing inside the oracle that watches for fourth machines would be a joke this
// repository has already stopped finding funny.
//
// WHAT THIS SWEEP DOES NOT COVER. It is a floor over the shapes the five deleted predicates
// plausibly differed on, never a proof of correctness. Named rather than left undisclosed:
//
//   1. SETEXT headings (`Title` over a run of `=` or `-`). No consumer recognises them and the
//      authority does not either; whether that is right is a corpus question, not this file's.
//   2. Heading TEXT containing a fence delimiter run, e.g. a heading that itself carries three
//      backticks, which toggles the one fence authority mid-heading.
//   3. Fence delimiters other than exactly three backticks at column zero: tilde fences, runs longer
//      than three, and indented or tab-indented delimiters. `FENCE_DELIMITER_LINE` is `/^```/`, so
//      an indented CODE BLOCK is invisible to it — the live residual plan 29-24 records as Residual
//      4, and this sweep cannot see it either.
//   4. Documents whose line endings are not line-feed. The trailing-residue axis carries a lone
//      carriage return so the RESIDUE form is swept, but no cell is a CRLF document; `.gitattributes`
//      pins every text extension to LF, so a CRLF document is a checkout artifact rather than an
//      input this tree produces.
//   5. Any input larger than the generated cells — long documents, many sections, deeply nested
//      fences, and headings of level four through six used as CLOSERS (the `level` parameter has
//      exactly two legal values and both are swept).
//   6. A `from` ABOVE the line count or below zero. Both are outside the documented contract, and
//      the first is the one place I1 does NOT hold: `sectionEndIndex(text, 999, 2)` returns the line
//      count, which is below `from`. Measured at plan 29-26 and recorded in
//      docs/audit/29-locator-unification.md as an observation; NOT fixed here, because this is a
//      measurement plan and a plan that repairs what it measures has graded its own paper.
//   7. Concurrency, encoding and any property of the file system. Every cell is built in memory.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import {
  fencedLineFlags,
  sectionEndIndex,
  unfencedHeadingIndex,
} from "./frontmatter.js";

// ── THE INDEPENDENT HEADING RULE ──────────────────────────────────────────────────────────────
//
// Derived from the authority's stated rule, never from its regexes. `HEADING_AT_MOST_1` and
// `HEADING_AT_MOST_2` are module-private and are not imported here even though they are in the same
// package: importing them would make every invariant below a restatement of the implementation.

/** The ATX level of `line` at column zero, or 0 when the line is not a heading by that rule. */
const headingLevelAtColumnZero = (line: string): number => {
  let hashes = 0;
  while (hashes < line.length && line.charAt(hashes) === "#") hashes += 1;
  if (hashes === 0) return 0;
  // A bare `#` line and a `#foo` line are NOT headings under this authority's disclosed floor. The
  // trailing space is required, and `charAt` past the end returns the empty string, so a document
  // ending in a bare hash run falls out here rather than through a length special case.
  if (line.charAt(hashes) !== " ") return 0;
  return hashes;
};

/** True when `line` is an ATX heading whose level is at most `level`. */
const closesSectionOfLevel = (line: string, level: number): boolean => {
  const found = headingLevelAtColumnZero(line);
  return found >= 1 && found <= level;
};

// ── THE AXES ──────────────────────────────────────────────────────────────────────────────────
//
// Seven, not the six the plan names. The seventh is the REQUESTED LEVEL, and it is added rather
// than assumed because every invariant above is phrased "at most the requested level": a sweep that
// asks only one of the parameter's two legal values tests half of the parameter and reports a clean
// answer for the other half. The addition is a WIDENING of the corpus, never a narrowing, and the
// cell count below states both the axis lengths and their product so the growth is visible.

const AXIS_KEYS = [
  "level",
  "fencing",
  "trailing",
  "leading",
  "position",
  "shape",
  "request-level",
] as const;

/** Axis 1 — the candidate line's heading level, including the two non-heading spellings. */
const AXIS_LEVEL = [
  { label: "a level-one heading", spell: "# Candidate" },
  { label: "a level-two heading", spell: "## Candidate" },
  { label: "a level-three heading", spell: "### Candidate" },
  { label: "a hash run with NO following space", spell: "##Candidate" },
  { label: "not a heading at all", spell: "Candidate prose line" },
] as const;

/** Axis 2 — where the candidate sits relative to a fence. */
const FENCE = "```";
const AXIS_FENCING = [
  { label: "outside any fence", kind: "open" },
  { label: "inside a TERMINATED fence", kind: "terminated" },
  { label: "inside an UNTERMINATED fence running to EOF", kind: "unterminated" },
] as const;

/**
 * The candidate wrapped for its fencing member. `offset` is how far the candidate sits below the
 * first line of the block, so the caller can compute the candidate's index without re-deriving the
 * wrapper's shape.
 */
const wrapCandidate = (
  candidate: string,
  kind: (typeof AXIS_FENCING)[number]["kind"],
): { block: string[]; offset: number } => {
  if (kind === "open") return { block: [candidate], offset: 0 };
  if (kind === "terminated") {
    return { block: [FENCE, candidate, FENCE], offset: 1 };
  }
  // No closing delimiter is emitted, so the toggle stays set and every line below stays flagged —
  // the fail-safe direction `fencedLineFlags` documents at its declaration.
  return { block: [FENCE, candidate], offset: 1 };
};

/** Axis 3 — trailing residue on the candidate line. */
const AXIS_TRAILING = [
  { label: "no trailing residue", text: "" },
  { label: "one trailing space", text: " " },
  { label: "one trailing tab", text: "\t" },
  { label: "a trailing carriage return", text: "\r" },
] as const;

/** Axis 4 — leading residue on the candidate line. */
const AXIS_LEADING = [
  { label: "no leading residue", text: "" },
  { label: "one leading space", text: " " },
  { label: "four leading spaces", text: "    " },
] as const;

/**
 * Axis 5 — WHERE the predicate is asked, which is a different question from WHICH CHARACTERS it
 * accepts. This project has recorded the distinction as a probe that catches bypasses (plan 27-10):
 * a predicate's accepted character set and its consulted positions are two questions, and a sweep
 * that varies only the first reports a clean answer about half a surface.
 */
const AXIS_POSITION = [
  { label: "the candidate is AT `from` itself", kind: "at-from" },
  { label: "the candidate is three lines after `from`", kind: "three-after" },
  { label: "the candidate is the document's LAST line, `from` at zero", kind: "last-line" },
  { label: "no candidate at all, `from` at zero", kind: "absent-low" },
  { label: "no candidate at all, `from` EQUAL to the line count", kind: "absent-high" },
] as const;

/** Axis 6 — the document the candidate lives in, including two degenerate shapes. */
const ORDINARY_HEAD = [
  "# Document title",
  "Some preamble prose.",
  "",
  "## Anchor section",
  "Body prose under the anchor.",
];
const ORDINARY_TAIL = [
  "Trailing prose after the candidate.",
  "",
  "## A later real section",
  "Final line of the document.",
];
const AXIS_SHAPE = [
  { label: "an empty string", kind: "degenerate", text: "" },
  { label: "a single blank line", kind: "degenerate", text: "\n" },
  { label: "the candidate is the document's FIRST line", kind: "first", text: "" },
  { label: "an ordinary multi-section document", kind: "ordinary", text: "" },
] as const;

/** Axis 7 — the requested level. Both legal values, for the reason stated above the axis block. */
const AXIS_REQUEST_LEVEL = [
  { label: "level 1", value: 1 as const },
  { label: "level 2", value: 2 as const },
] as const;

// ── THE CELL ──────────────────────────────────────────────────────────────────────────────────

interface Cell {
  readonly labels: Readonly<Record<string, string>>;
  readonly where: string;
  readonly text: string;
  readonly from: number;
  readonly level: 1 | 2;
  readonly heading: string;
  /** The candidate's line index, or -1 when the cell carries no candidate. */
  readonly candidateIndex: number;
}

/**
 * TWO AXIS INTERACTIONS, DECLARED HERE RATHER THAN DISCOVERED AS A CONFUSING CELL.
 *
 *  * A fenced candidate cannot be the document's first line, because the opening delimiter has to
 *    precede it. In those cells the candidate sits at index one and the shape's promise is met by
 *    the unfenced members of the same shape, which a premise case below asserts explicitly.
 *  * A candidate inside a TERMINATED fence cannot be the document's last line, because the closing
 *    delimiter has to follow it. In those cells the candidate sits one line above the end, and the
 *    true last-line position is reached by the other two fencing members — also asserted.
 *
 * Neither interaction is a defect in the corpus; both are consequences of crossing two axes that
 * constrain the same coordinate, and the premise case is what keeps "asserted" from meaning
 * "assumed".
 */
const buildCell = (
  lvl: (typeof AXIS_LEVEL)[number],
  fen: (typeof AXIS_FENCING)[number],
  tra: (typeof AXIS_TRAILING)[number],
  lea: (typeof AXIS_LEADING)[number],
  pos: (typeof AXIS_POSITION)[number],
  sha: (typeof AXIS_SHAPE)[number],
  req: (typeof AXIS_REQUEST_LEVEL)[number],
): Cell => {
  const candidate = `${lea.text}${lvl.spell}${tra.text}`;
  // The heading looked up is the candidate's OWN `trimEnd()`-normalized text. That is what makes
  // the residue axes reach `unfencedHeadingIndex` at all: a trailing tab must still locate the
  // line, and a leading space must still not.
  const heading = candidate.trimEnd();
  const labels: Record<string, string> = {
    level: lvl.label,
    fencing: fen.label,
    trailing: tra.label,
    leading: lea.label,
    position: pos.label,
    shape: sha.label,
    "request-level": req.label,
  };
  const where = AXIS_KEYS.map((k) => `${k}=[${labels[k]}]`).join(" ");
  const base = { labels, where, level: req.value, heading };

  if (sha.kind === "degenerate") {
    const lineCount = sha.text.split("\n").length;
    // The degenerate shapes carry no candidate at any position, so the position axis contributes
    // the one coordinate that survives: WHERE `from` sits, including the line count itself.
    const from =
      pos.kind === "absent-high"
        ? lineCount
        : pos.kind === "last-line"
          ? Math.max(0, lineCount - 1)
          : 0;
    return { ...base, text: sha.text, from, candidateIndex: -1 };
  }

  const head = sha.kind === "first" ? [] : ORDINARY_HEAD;
  if (pos.kind === "absent-low" || pos.kind === "absent-high") {
    const lines = [...head, ...ORDINARY_TAIL];
    const from = pos.kind === "absent-low" ? 0 : lines.length;
    return { ...base, text: lines.join("\n"), from, candidateIndex: -1 };
  }

  const { block, offset } = wrapCandidate(candidate, fen.kind);
  const lines =
    pos.kind === "last-line"
      ? [...head, ...block]
      : [...head, ...block, ...ORDINARY_TAIL];
  const candidateIndex = head.length + offset;
  const from =
    pos.kind === "at-from"
      ? candidateIndex
      : pos.kind === "three-after"
        ? Math.max(0, candidateIndex - 3)
        : 0;
  return { ...base, text: lines.join("\n"), from, candidateIndex };
};

/** The whole corpus, generated by crossing the seven axes. */
const buildCorpus = (): Cell[] => {
  const out: Cell[] = [];
  for (const lvl of AXIS_LEVEL) {
    for (const fen of AXIS_FENCING) {
      for (const tra of AXIS_TRAILING) {
        for (const lea of AXIS_LEADING) {
          for (const pos of AXIS_POSITION) {
            for (const sha of AXIS_SHAPE) {
              for (const req of AXIS_REQUEST_LEVEL) {
                out.push(buildCell(lvl, fen, tra, lea, pos, sha, req));
              }
            }
          }
        }
      }
    }
  }
  return out;
};

// ── THE INVARIANT CHECKERS ────────────────────────────────────────────────────────────────────
//
// ONE checker, called with different locators — the same reason plan 29-23 gave for exporting
// `countBannedClaimOccurrences`: the falsifiability probe must run THE RULE against a broken
// implementation, and a second spelling of the rule would measure the copy instead of the rule.

type EndLocator = (text: string, from: number, level: 1 | 2) => number;
type HeadLocator = (text: string, heading: string) => number;

/** I1, I2 and I3 over one cell. Returns one string per violated invariant. */
const endViolations = (cell: Cell, endAt: EndLocator): string[] => {
  const lines = cell.text.split("\n");
  const flags = fencedLineFlags(cell.text);
  const end = endAt(cell.text, cell.from, cell.level);
  const out: string[] = [];
  const say = (id: string, detail: string): void => {
    out.push(`${id} violated — ${detail}; end=${end} from=${cell.from} lineCount=${lines.length} ${cell.where}`);
  };

  if (end < cell.from || end > lines.length) {
    say("I1", "the answer is outside [from, lineCount]");
  }
  if (end >= 0 && end < lines.length) {
    if (flags[end]) {
      say("I2", `the line the section ENDS at is inside a fence: ${JSON.stringify(lines[end])}`);
    }
    if (!closesSectionOfLevel(lines[end], cell.level)) {
      say(
        "I2",
        `the line the section ENDS at is not a heading of level at most ${cell.level}: ${JSON.stringify(lines[end])}`,
      );
    }
  }
  for (let i = Math.max(cell.from, 0); i < Math.min(end, lines.length); i += 1) {
    if (!flags[i] && closesSectionOfLevel(lines[i], cell.level)) {
      say(
        "I3",
        `line ${i} is an unfenced heading of level at most ${cell.level} INSIDE the returned section: ${JSON.stringify(lines[i])} — the section adopted bytes belonging to a later one`,
      );
      break;
    }
  }
  return out;
};

/** I4, I5 and I6 over one cell. Returns one string per violated invariant. */
const headViolations = (cell: Cell, headAt: HeadLocator): string[] => {
  const lines = cell.text.split("\n");
  const flags = fencedLineFlags(cell.text);
  const at = headAt(cell.text, cell.heading);
  const out: string[] = [];
  const isTheHeading = (i: number): boolean =>
    !flags[i] && lines[i].trimEnd() === cell.heading;
  const say = (id: string, detail: string): void => {
    out.push(`${id} violated — ${detail}; at=${at} heading=${JSON.stringify(cell.heading)} ${cell.where}`);
  };

  if (at !== -1) {
    if (at < 0 || at >= lines.length) {
      say("I4", "the answer is not -1 and is not a line index");
    } else if (!isTheHeading(at)) {
      say(
        "I4",
        `the located line is fenced or is not the requested heading: ${JSON.stringify(lines[at])}`,
      );
    }
    for (let i = 0; i < Math.min(at, lines.length); i += 1) {
      if (isTheHeading(i)) {
        say("I5", `line ${i} is an EARLIER unfenced occurrence of the same heading`);
        break;
      }
    }
  } else {
    for (let i = 0; i < lines.length; i += 1) {
      if (isTheHeading(i)) {
        say("I6", `the answer is -1 while line ${i} is an unfenced occurrence of the heading`);
        break;
      }
    }
  }
  return out;
};

// ── THE TWO DELIBERATELY BROKEN LOCATORS ──────────────────────────────────────────────────────
//
// NEVER EXPORTED, and each is a REPRODUCTION of a defect this phase actually shipped rather than an
// invented one. A sweep that passes against a known-broken implementation is measuring nothing, and
// "known-broken" is worth more when the break is one the tree really had.

/** CR-02, verbatim: the close recognises `## ` and nothing else, whatever level was requested. */
const endLevelTwoOnly: EndLocator = (text, from) => {
  const lines = text.split("\n");
  const flags = fencedLineFlags(text);
  for (let i = Math.max(from, 0); i < lines.length; i += 1) {
    if (!flags[i] && /^## /.test(lines[i])) return i;
  }
  return lines.length;
};

/** WR-01, verbatim: the anchor scan reads raw lines, so a QUOTED heading is taken as a real one. */
const headFenceBlind: HeadLocator = (text, heading) => {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trimEnd() === heading) return i;
  }
  return -1;
};

// ── THE PINNED CARDINALITIES ──────────────────────────────────────────────────────────────────
//
// DERIVE THE SET, ASSERT THE COUNT — this repository's own rule, and the reason it exists is
// recorded twice over: a vacuity floor catches an EMPTY denominator and has never once caught a
// SILENTLY SHORT one. So the cell count is derived TWICE by different means (the product of the
// pinned axis lengths, and a counter incremented inside the loop that consumes the corpus) and the
// two are compared, and the per-axis label coverage is floored PER ELEMENT rather than in total.
const EXPECTED_CELLS = 7200;

describe("the section-locator authority under a parser oracle (plan 29-26, LANG-07)", () => {
  it("the corpus is DERIVED and COUNTED — axis lengths pinned, the cell count derived twice, every axis label reached", () => {
    expect(AXIS_LEVEL.length, "axis 1 — heading level").toBe(5);
    expect(AXIS_FENCING.length, "axis 2 — fencing").toBe(3);
    expect(AXIS_TRAILING.length, "axis 3 — trailing residue").toBe(4);
    expect(AXIS_LEADING.length, "axis 4 — leading residue").toBe(3);
    expect(AXIS_POSITION.length, "axis 5 — position").toBe(5);
    expect(AXIS_SHAPE.length, "axis 6 — document shape").toBe(4);
    expect(AXIS_REQUEST_LEVEL.length, "axis 7 — requested level").toBe(2);

    // DERIVATION ONE — the product of the pinned lengths.
    const product =
      AXIS_LEVEL.length *
      AXIS_FENCING.length *
      AXIS_TRAILING.length *
      AXIS_LEADING.length *
      AXIS_POSITION.length *
      AXIS_SHAPE.length *
      AXIS_REQUEST_LEVEL.length;
    expect(product, "the product of the seven pinned axis lengths").toBe(EXPECTED_CELLS);

    // DERIVATION TWO — a counter incremented by the loop that walks the generated corpus. This is
    // computed INDEPENDENTLY of the product above, which is the whole point: a generator that
    // silently produced fewer cells must fail here rather than report a clean sweep.
    const corpus = buildCorpus();
    let counted = 0;
    for (const cell of corpus) {
      if (typeof cell.text === "string") counted += 1;
    }
    expect(counted, "the cells the consuming loop actually walked").toBe(product);
    expect(corpus.length, "the generated array's own length, a third witness").toBe(product);

    // PER-ELEMENT NON-VACUITY. Every declared label of every axis must be carried by at least one
    // cell. A total that stays healthy while one axis silently contributes one member is the
    // silently-short shape a bare count cannot see.
    const declared: Record<string, string[]> = {
      level: AXIS_LEVEL.map((a) => a.label),
      fencing: AXIS_FENCING.map((a) => a.label),
      trailing: AXIS_TRAILING.map((a) => a.label),
      leading: AXIS_LEADING.map((a) => a.label),
      position: AXIS_POSITION.map((a) => a.label),
      shape: AXIS_SHAPE.map((a) => a.label),
      "request-level": AXIS_REQUEST_LEVEL.map((a) => a.label),
    };
    for (const key of AXIS_KEYS) {
      const seen = new Set(corpus.map((c) => c.labels[key]));
      expect([...seen].sort(), `axis ${key} — every declared label must be reached`).toEqual(
        [...declared[key]].sort(),
      );
    }

    // AND THE CELLS MUST BE DISTINCT ENOUGH TO BE SEVEN THOUSAND MEASUREMENTS RATHER THAN ONE
    // MEASUREMENT REPEATED. The two degenerate shapes carry no candidate, so their cells collapse
    // onto a handful of `(text, from, level)` triples by construction — that collapse is expected
    // and is exactly why the distinct count is asserted as a NUMBER rather than assumed to equal
    // the cell count. Measured at plan 29-26 and pinned; a generator that started emitting one
    // document would fail here and not only at a coverage floor.
    const triples = new Set(corpus.map((c) => `${c.from} ${c.level} ${c.text}`));
    expect(triples.size, "distinct (text, from, level) triples in the corpus").toBe(2058);
    const texts = new Set(corpus.map((c) => c.text));
    expect(texts.size, "distinct documents in the corpus").toBe(724);
  });

  it("the corpus reaches the POSITION edges the invariants are about — asserted, never assumed", () => {
    const corpus = buildCorpus();
    const linesOf = (c: Cell): string[] => c.text.split("\n");

    // A heading at index ZERO. The shape axis promises one; the fencing axis can displace it, so
    // the promise is checked on the members that can keep it rather than taken on the label's word.
    const atZero = corpus.filter(
      (c) =>
        c.candidateIndex === 0 &&
        !fencedLineFlags(c.text)[0] &&
        headingLevelAtColumnZero(linesOf(c)[0]) > 0,
    );
    expect(atZero.length, "cells whose line ZERO is an unfenced heading").toBeGreaterThan(0);

    // A heading at the document's LAST line.
    const atLast = corpus.filter(
      (c) =>
        c.candidateIndex >= 0 &&
        c.candidateIndex === linesOf(c).length - 1 &&
        headingLevelAtColumnZero(linesOf(c)[c.candidateIndex]) > 0,
    );
    expect(atLast.length, "cells whose LAST line is the candidate heading").toBeGreaterThan(0);

    // `from` EQUAL to the line count — the position at which the search cannot run at all.
    const fromAtEnd = corpus.filter((c) => c.from === linesOf(c).length);
    expect(fromAtEnd.length, "cells whose `from` equals the line count").toBeGreaterThan(0);

    // The two degenerate documents.
    expect(
      corpus.some((c) => c.text === ""),
      "the empty document must be a cell",
    ).toBe(true);
    expect(
      corpus.some((c) => c.text === "\n"),
      "the one-blank-line document must be a cell",
    ).toBe(true);

    // THE UNION OF THE ARMS, not each arm alone. After splitting a predicate into arms the arms'
    // UNION is what a case must cover — a line that is simultaneously fenced, trailing-whitespaced
    // and level-one is one cell, not three.
    const union = corpus.filter(
      (c) =>
        c.labels.level === "a level-one heading" &&
        c.labels.fencing === "inside a TERMINATED fence" &&
        c.labels.trailing === "one trailing space" &&
        c.labels.leading === "no leading residue",
    );
    expect(union.length, "the fenced + trailing-whitespaced + level-one union cell").toBeGreaterThan(0);
  });

  it("the invariants' heading rule is NON-CIRCULAR — it names no symbol of the module under test", () => {
    // The claim "this rule was not read off the implementation" is CHECKABLE rather than merely
    // asserted, the way scripts/frontmatter.test.ts already proves its own cross-product rule.
    const MODULE_SYMBOLS = [
      "sectionEndIndex",
      "unfencedHeadingIndex",
      "fencedLineFlags",
      "FENCE_DELIMITER_LINE",
      "HEADING_AT_MOST_1",
      "HEADING_AT_MOST_2",
      "stripFencedBlocks",
      "parseFrontmatter",
    ] as const;
    const source = `${headingLevelAtColumnZero.toString()}\n${closesSectionOfLevel.toString()}`;
    for (const symbol of MODULE_SYMBOLS) {
      expect(source, `the heading rule must not name ${symbol}`).not.toContain(symbol);
    }

    // And the rule is a PURE function of its argument — same input, same answer, no hidden state.
    for (const line of ["# a", "## a", "### a", "#a", "a", "#", "", "   # a", "###### a"]) {
      expect(headingLevelAtColumnZero(line), `purity: ${JSON.stringify(line)}`).toBe(
        headingLevelAtColumnZero(line),
      );
    }

    // A SECOND, INDEPENDENTLY WRITTEN TRUTH TABLE for the rule itself, so the rule and the table are
    // two statements of the same fact rather than one statement checked against itself. Written by
    // hand from the authority's disclosed floor, never by evaluating anything.
    const TABLE: readonly [string, number][] = [
      ["# a", 1],
      ["## a", 2],
      ["### a", 3],
      ["###### a", 6],
      ["#a", 0],
      ["#", 0],
      ["", 0],
      [" # a", 0],
      ["    # a", 0],
      ["a # b", 0],
      ["#  a", 1],
      ["## ", 2],
    ];
    expect(TABLE.length, "the hand-written truth table must not be empty").toBeGreaterThanOrEqual(12);
    for (const [line, level] of TABLE) {
      expect(headingLevelAtColumnZero(line), `truth table: ${JSON.stringify(line)}`).toBe(level);
    }
    // The level-bounded form, both sides, on the two values the parameter legally takes.
    expect(closesSectionOfLevel("# a", 1), "a level-one heading closes a level-one section").toBe(true);
    expect(closesSectionOfLevel("## a", 1), "a level-two heading does NOT close a level-one section").toBe(false);
    expect(closesSectionOfLevel("## a", 2), "a level-two heading closes a level-two section").toBe(true);
    expect(closesSectionOfLevel("### a", 2), "a level-three heading does NOT close a level-two section").toBe(false);
  });

  it("THE SWEEP — every cell satisfies I1..I6 against the shipped authority", () => {
    const corpus = buildCorpus();
    let swept = 0;
    const failures: string[] = [];
    for (const cell of corpus) {
      swept += 1;
      for (const v of endViolations(cell, sectionEndIndex)) failures.push(v);
      for (const v of headViolations(cell, unfencedHeadingIndex)) failures.push(v);
    }
    // The sweep's OWN denominator, derived by the loop that consumed the corpus rather than read off
    // the array it walked.
    expect(swept, "cells actually swept").toBe(EXPECTED_CELLS);
    expect(
      failures.slice(0, 5),
      "a failing cell names EVERY axis value that produced it, so a future failure says WHICH cell regressed rather than only that a count moved",
    ).toEqual([]);
    expect(failures.length, "total invariant violations over the whole corpus").toBe(0);
  });

  it("THE SWEEP IS FALSIFIABLE — CR-02's level-two-only close fails cells, and the failure names every axis value", () => {
    // A sweep that passes against a known-broken implementation is measuring nothing. This is not a
    // hypothetical break: it is `voice-model.ts`'s `SECTION_END = /^## /` as it shipped, which
    // measured the wrong bytes at exit 0 for a whole milestone.
    const corpus = buildCorpus();
    const failures: string[] = [];
    for (const cell of corpus) {
      for (const v of endViolations(cell, endLevelTwoOnly)) failures.push(v);
    }
    expect(
      failures.length,
      "the level-two-only close must fail at least one cell, or the invariants are decoration",
    ).toBeGreaterThan(0);

    // The failure MESSAGE is part of the property: a failing cell that names only its index tells
    // nobody anything. Every axis key must appear in the first failure.
    const first = failures[0];
    for (const key of AXIS_KEYS) {
      expect(first, `the failing cell must name axis ${key}`).toContain(`${key}=[`);
    }
    expect(first, "the failing cell must name the invariant it broke").toMatch(/^I[123] violated/);

    // ATTRIBUTION, AND THE PREMISE THIS CASE'S FIRST DRAFT GOT WRONG. The first draft asserted that
    // every failing cell carries a level-one CANDIDATE, on the reasoning that level one is the axis
    // CR-02 is about. Run, it reported five candidate levels rather than one — because the ordinary
    // document shape opens with its own unfenced `# Document title`, so the broken close walks past
    // a level-one heading whatever the candidate happens to be. The draft's attribution was a
    // statement about the axis somebody had in mind rather than about the axis the defect is on,
    // and only running it said so. What is TRUE is stated instead, on the axis that governs:
    //
    //   at requested level TWO the broken close WALKS PAST a `# ` heading, which is I3;
    //   at requested level ONE it STOPS AT a `## ` heading it should not close on, which is I2.
    //
    // A probe producing only one of the two would leave half of the two-valued parameter unexercised
    // while reporting a healthy failure count.
    const atRequest = (label: string): string[] =>
      failures.filter((f) => f.includes(`request-level=[${label}]`));
    expect(
      atRequest("level 1").some((f) => f.startsWith("I2")),
      "at requested level 1 the broken close must STOP AT a level-two heading — I2",
    ).toBe(true);
    expect(
      atRequest("level 2").some((f) => f.startsWith("I3")),
      "at requested level 2 the broken close must WALK PAST a level-one heading — I3",
    ).toBe(true);
    const invariants = new Set(failures.map((f) => f.slice(0, 2)));
    expect([...invariants].sort(), "the broken close must break BOTH I2 and I3").toEqual(["I2", "I3"]);
  });

  it("THE SWEEP IS FALSIFIABLE — WR-01's fence-blind anchor scan fails cells, and the failure names every axis value", () => {
    // The second half of the authority gets its own probe, because a sweep proven able to fail on
    // `sectionEndIndex` says nothing about whether `unfencedHeadingIndex` is checked at all.
    const corpus = buildCorpus();
    const failures: string[] = [];
    for (const cell of corpus) {
      for (const v of headViolations(cell, headFenceBlind)) failures.push(v);
    }
    expect(
      failures.length,
      "the fence-blind anchor scan must fail at least one cell",
    ).toBeGreaterThan(0);
    const first = failures[0];
    for (const key of AXIS_KEYS) {
      expect(first, `the fence-blind failure must name axis ${key}`).toContain(`${key}=[`);
    }
    expect(first, "the fence-blind failure must break I4 — it locates a FENCED line").toMatch(
      /^I4 violated/,
    );

    // Every failing cell must be a fenced one. A fence-blind scan that failed an UNFENCED cell would
    // mean the probe is breaking something other than fence-awareness.
    const fencings = new Set(
      failures.map((f) => {
        const m = /fencing=\[([^\]]+)\]/.exec(f);
        return m === null ? "?" : m[1];
      }),
    );
    expect([...fencings].every((f) => f.includes("fence")), "only fenced cells may fail").toBe(true);
    expect(fencings.has("outside any fence"), "no UNFENCED cell may fail a fence-blindness probe").toBe(
      false,
    );
  });

  it("the invariant checkers are themselves reached — a control proving neither returns the empty list by construction", () => {
    // The checkers return `[]` on every live cell, and an empty answer from a checker that examines
    // nothing is indistinguishable from an empty answer from a checker that works. Both are proven
    // able to speak, on a hand-built cell rather than on a generated one.
    const cell: Cell = {
      labels: Object.fromEntries(AXIS_KEYS.map((k) => [k, "hand-built control"])),
      where: AXIS_KEYS.map((k) => `${k}=[hand-built control]`).join(" "),
      text: ["## Anchor section", "Body prose.", "# A later top-level section", "Tail."].join("\n"),
      from: 1,
      level: 2,
      heading: "## Anchor section",
      candidateIndex: 0,
    };
    expect(endViolations(cell, sectionEndIndex), "the control cell is clean under the authority").toEqual(
      [],
    );
    expect(endViolations(cell, endLevelTwoOnly).length, "and dirty under the broken close").toBeGreaterThan(
      0,
    );

    const quoted: Cell = {
      ...cell,
      text: ["# Role", FENCE, "## Anchor section", FENCE, "Tail."].join("\n"),
    };
    expect(headViolations(quoted, unfencedHeadingIndex), "the quoted-anchor cell is clean").toEqual([]);
    expect(
      headViolations(quoted, headFenceBlind).length,
      "and dirty under the fence-blind anchor scan",
    ).toBeGreaterThan(0);
  });
});
