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
// (PLAN 29-29, WR-03) SATISFIED IS NOT REACHED, AND THE DIFFERENCE COST THIS FILE AN INVARIANT.
// I5 was asserted 7200 times and never once evaluated against a document that could break it: the
// generator inserted the candidate exactly once, no fixed corpus line can equal any candidate
// spelling, and so no cell carried a SECOND occurrence of its own heading. An implementation
// returning the LAST unfenced match instead of the first would have swept clean, which means the
// ORDERING promise — the half that makes `unfencedHeadingIndex` correct rather than merely
// fence-aware — was untested while the sweep's cell count, its per-axis label coverage and its
// distinct-document count were all healthy. A vacuity floor catches an EMPTY denominator and has
// never caught a SILENTLY SHORT one.
//
// Two things follow, and both are permanent rather than transcribed:
//
//   * an EIGHTH AXIS inserts a second occurrence of the cell heading before the candidate, fenced or
//     unfenced. Crossed with the fencing axis it produces both orders, including the document WR-01
//     was actually written for — one that QUOTES its required heading in an example and also
//     declares it. A THIRD deliberately broken locator returns the last unfenced match and is
//     required to break I5 and nothing else;
//   * every invariant carries a REACH COUNT, restated from its DESCRIPTION as an expression that
//     never calls either violation collector, counted over the corpus and pinned as an equality. A
//     case reproduces round 3's own measurement by restricting the corpus to the axis's `none`
//     member — over those 7200 cells the last-match locator still sweeps clean and I5's reach is
//     still zero, so the finding is re-measured on every run rather than remembered.
//
// The review's own suggested fix — re-run the FENCE-BLIND probe and require it to break I5 too — is
// REFUTED rather than adopted, with the refutation asserted: that locator returns the first RAW
// match, an unfenced occurrence is itself a raw match, so no earlier line can satisfy I5's predicate
// for any input whatever. Writing the assertion anyway would have been a vacuous assertion inside
// the case correcting a vacuous assertion.
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
// EIGHT. Plan 29-26 names six; the seventh and eighth were both added because a parameter or a
// document shape the sweep never varies is a clean answer about half a surface.
//
// The seventh is the REQUESTED LEVEL, and it is added rather
// than assumed because every invariant above is phrased "at most the requested level": a sweep that
// asks only one of the parameter's two legal values tests half of the parameter and reports a clean
// answer for the other half. The addition is a WIDENING of the corpus, never a narrowing, and the
// cell count below states both the axis lengths and their product so the growth is visible.

// (Plan 29-29, WR-03) THE EIGHTH AXIS IS THE ONE THAT MAKES I5 REACHABLE AT ALL.
//
// Round 3 measured invariant I5 asserted 7200 times and never once EVALUATED against a document that
// could violate it: `buildCell` inserted the candidate exactly once, and no fixed line in
// `ORDINARY_HEAD` / `ORDINARY_TAIL` can equal any candidate spelling (every candidate carries the
// literal `Candidate`). So no cell carried a SECOND occurrence of its own heading, I5's loop body
// examined only lines that could not be the heading, and an implementation returning the LAST
// unfenced match instead of the first would have swept clean.
//
// A vacuity floor catches an EMPTY denominator and has never caught a SILENTLY SHORT one — this
// project's own recorded lesson, and I5 is its newest instance: the sweep's cell count, its
// per-axis label coverage and its distinct-document count were all healthy while one of the six
// invariants was unreachable. The eighth axis inserts a second occurrence BEFORE the candidate,
// fenced or unfenced, and crossing it with the FENCING axis produces both orders the review asks
// for: an unfenced occurrence before a fenced one, and a fenced occurrence before an unfenced one.
const AXIS_KEYS = [
  "level",
  "fencing",
  "trailing",
  "leading",
  "position",
  "shape",
  "request-level",
  "duplicate",
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

/**
 * Axis 8 — a SECOND occurrence of the cell's heading, placed BEFORE the candidate.
 *
 * `unfenced-before` is what makes I5's loop body enterable with something that could be the heading.
 * `fenced-before` is the ordering discrimination WR-01 was actually written for: a document that
 * QUOTES its own required heading inside an example and also declares it, where a fence-blind scan
 * picks the quoted line and the authority must pick the real one.
 */
const AXIS_DUPLICATE = [
  { label: "no second occurrence", kind: "none" },
  { label: "an earlier UNFENCED duplicate", kind: "unfenced-before" },
  { label: "an earlier FENCED duplicate", kind: "fenced-before" },
] as const;

/**
 * The duplicate block for a member, using the cell's OWN heading text so the two really are two
 * occurrences of one string rather than two similar lines.
 */
const duplicateBlock = (
  heading: string,
  kind: (typeof AXIS_DUPLICATE)[number]["kind"],
): string[] => {
  if (kind === "none") return [];
  if (kind === "unfenced-before") return [heading];
  return [FENCE, heading, FENCE];
};

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
  dup: (typeof AXIS_DUPLICATE)[number],
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
    duplicate: dup.label,
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

  // The duplicate sits between the head and the candidate's own block, so it is unambiguously
  // EARLIER than the candidate whatever the position axis then does with `from`.
  const dupLines = duplicateBlock(heading, dup.kind);
  const { block, offset } = wrapCandidate(candidate, fen.kind);
  const lines =
    pos.kind === "last-line"
      ? [...head, ...dupLines, ...block]
      : [...head, ...dupLines, ...block, ...ORDINARY_TAIL];
  const candidateIndex = head.length + dupLines.length + offset;
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
                for (const dup of AXIS_DUPLICATE) {
                  out.push(buildCell(lvl, fen, tra, lea, pos, sha, req, dup));
                }
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

  // (Plan 29-29, IN-01) THE `end >= 0` CONJUNCT MOVED HERE, WHERE A NEGATIVE ANSWER IS A REAL
  // VIOLATION. It used to guard I2's block, where it was unreachable-false: `sectionEndIndex`
  // returns either an index at least `Math.max(from, 0)` or the line count. In a file whose subject
  // is invariants that cannot fail, a CONDITION that cannot fail is noise. It is not dropped,
  // because `endViolations` takes an arbitrary locator and a future broken one may well answer -1 —
  // and for a cell whose `from` is 0 the range test alone would already catch that, while for a
  // `from` above 0 it would be caught for the wrong reason and reported as an out-of-range answer
  // rather than as a negative one. Stated separately, the failure says which it was.
  if (end < 0) {
    say("I1", "the answer is NEGATIVE — the locator returned no index at all");
    // Nothing below is meaningful for a negative answer, and `lines[end]` would be `undefined`, so
    // the report is I1 alone rather than I1 plus a crash inside I2's heading rule.
    return out;
  }
  if (end < cell.from || end > lines.length) {
    say("I1", "the answer is outside [from, lineCount]");
  }
  if (end < lines.length) {
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

/**
 * (Plan 29-29, WR-03) THE THIRD BROKEN LOCATOR: fence-aware, complete, and returns the LAST match.
 *
 * This is the implementation the sweep could not tell apart from the authority before the duplicate
 * axis existed. It satisfies I4 (every line it returns really is an unfenced occurrence of the
 * heading) and I6 (it answers -1 only when there is none), and it violates I5 alone — the ORDERING
 * promise the name `unfencedHeadingIndex` makes and the half that makes the authority correct rather
 * than merely fence-aware.
 *
 * It is not a reproduction of a shipped defect, unlike the two above, and that is stated rather than
 * glossed: what it reproduces is the shipped GAP — an invariant asserted seven thousand two hundred
 * times without ever being evaluated against a document that could break it.
 */
const headLastUnfenced: HeadLocator = (text, heading) => {
  const lines = text.split("\n");
  const flags = fencedLineFlags(text);
  let out = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!flags[i] && lines[i].trimEnd() === heading) out = i;
  }
  return out;
};

// ── THE PER-INVARIANT REACH EXPRESSIONS ───────────────────────────────────────────────────────
//
// THE LOAD-BEARING HALF OF THIS PLAN. A vacuity floor catches an EMPTY denominator and has never
// caught a SILENTLY SHORT one; WR-03 is that lesson's newest instance, and a sweep whose cell count,
// label coverage and distinct-document count were all healthy carried an invariant that was never
// once evaluated against a document able to violate it.
//
// So each invariant's PRECONDITION is restated here as a separate expression written from the
// invariant's DESCRIPTION, and the number of cells satisfying it is counted and floored. The
// restatements deliberately do NOT call `endViolations` or `headViolations`: a reach counter living
// inside the loop it audits is the same expression counting itself, which is precisely the defect
// being corrected. They DO call the locators, because four of the six preconditions are statements
// about the ANSWER and there is no way to ask about an answer without obtaining one.
//
// The file already sets this precedent with its hand-written truth table for the heading rule.

/** Every line of the cell whose `trimEnd()` equals the cell's heading, fenced or not. */
const occurrencesOf = (cell: Cell): number =>
  cell.text.split("\n").filter((l) => l.trimEnd() === cell.heading).length;

/** Reach predicates for I1..I6, keyed by invariant id. `true` means the cell EXERCISES it. */
const REACH: Readonly<Record<string, (c: Cell) => boolean>> = {
  // I1 bounds the answer. Its comparison runs for every cell in which a locator was asked at all,
  // so its reach is the whole corpus — stated rather than omitted, because an invariant whose reach
  // is trivially total is a fact about the invariant and not an excuse to leave it unmeasured.
  I1: () => true,
  // I2 speaks only when the answer is BELOW the line count — that is, when the section really ended
  // AT a line rather than by running out of document.
  I2: (c) => sectionEndIndex(c.text, c.from, c.level) < c.text.split("\n").length,
  // I3 examines the half-open range [from, answer). Its loop body runs only when that range is
  // NON-EMPTY; a cell whose section is zero lines long exercises nothing.
  I3: (c) => {
    const lineCount = c.text.split("\n").length;
    return (
      Math.min(sectionEndIndex(c.text, c.from, c.level), lineCount) > Math.max(c.from, 0)
    );
  },
  // I4 speaks when the head locator returned an INDEX rather than -1.
  I4: (c) => unfencedHeadingIndex(c.text, c.heading) !== -1,
  // I5 is the one round 3 measured at ZERO. Its loop body can only find an earlier occurrence in a
  // document that HAS a second occurrence, so its reach is: the answer is an index above zero AND
  // the document carries at least two occurrences of the heading text. Both halves are needed —
  // `at > 0` alone was true of thousands of cells while none of them could ever fail.
  //
  // (Plan 29-36, 29-REVIEW § WR-03) BOTH HALVES WERE WRONG, IN OPPOSITE DIRECTIONS.
  //
  // TOO WIDE. The occurrence half counted RAW occurrences — `occurrencesOf`, every line whose
  // `trimEnd()` equals the heading, FENCED OR NOT. I5's loop body reports only when an earlier line
  // is UNFENCED and equals the heading (`isTheHeading`, `:482-483`), so the whole fenced-before arm
  // of the duplicate axis was counted as exercise while being structurally incapable of violating
  // I5. That is the defect the review reported.
  //
  // TOO NARROW, AND THIS HALF NO REVIEW REPORTED. `at > 0` asked for the AUTHORITY's answer — but
  // `headViolations` takes an ARBITRARY locator, and this file says so at the negative-answer case.
  // I5 is not asked at the position the authority answers; it is asked at the position the locator
  // under test answers. A document whose FIRST unfenced occurrence is line ZERO makes the authority
  // answer `0`, so the old conjunct called it unexercised — while `headLastUnfenced` answers the
  // LAST occurrence and violates I5 on exactly that document. Measured: 360 cells on which the
  // probe breaks I5 sat OUTSIDE a reach set narrowed this way, and the review's own suggested fix
  // keeps the conjunct and so keeps the hole. A reach set that excludes its own counter-examples
  // leaves the invariant asserted over a population that cannot break it, which is a worse version
  // of the defect being corrected.
  //
  // SO THE PRECONDITION IS STATED WITHOUT REFERENCE TO ANY LOCATOR'S ANSWER. I5's loop body can
  // report iff some line BEFORE the answer is an unfenced occurrence of the heading, and a document
  // admits such an answer iff it carries AT LEAST TWO unfenced occurrences — necessary, because
  // with one or none no answer has an unfenced predecessor; sufficient, because an answer at the
  // later one does. The unfenced occurrences are COUNTED DIRECTLY rather than as `occurrencesOf`
  // minus a fenced tally: one expression minus a projection of its own output is the shape this
  // same round charges `readRegistry` with, and it would make two numbers agree by construction
  // instead of by measurement.
  I5: (c) => {
    const lines = c.text.split("\n");
    const flags = fencedLineFlags(c.text);
    let unfenced = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (!flags[i] && lines[i].trimEnd() === c.heading) unfenced += 1;
    }
    return unfenced >= 2;
  },
  // I6 is the completeness half: it speaks when the answer is -1 and the document is searched for a
  // line that would contradict it.
  I6: (c) => unfencedHeadingIndex(c.text, c.heading) === -1,
};
const INVARIANT_IDS = ["I1", "I2", "I3", "I4", "I5", "I6"] as const;

// ── THE PINNED CARDINALITIES ──────────────────────────────────────────────────────────────────
//
// DERIVE THE SET, ASSERT THE COUNT — this repository's own rule, and the reason it exists is
// recorded twice over: a vacuity floor catches an EMPTY denominator and has never once caught a
// SILENTLY SHORT one. So the cell count is derived TWICE by different means (the product of the
// pinned axis lengths, and a counter incremented inside the loop that consumes the corpus) and the
// two are compared, and the per-axis label coverage is floored PER ELEMENT rather than in total.
const EXPECTED_CELLS = 21600;
/**
 * Per-invariant REACH floors, measured in plan 29-29's session over the eight-axis corpus.
 *
 * Round 3's measurement of I5 was ZERO over 7200 cells. A non-zero number here is this plan's
 * closure condition, and every other invariant carries the same treatment so the next unreachable
 * one is caught by the same mechanism rather than by a reviewer noticing.
 *
 * (Plan 29-36, 29-REVIEW § WR-03) I5's FLOOR MOVED — 1800 -> 720 — AND THE DELTA IS THE FINDING.
 *
 * Read out of this file's own failure output after `REACH.I5` was restated from I5's predicate, in
 * the session that wrote this line, never incremented and never lowered to make a case pass. The
 * move is NOT a simple narrowing, and saying so is the point: the old set was wrong in BOTH
 * directions and the two errors partly cancelled, which is how it survived a round.
 *
 *   OLD  1800  = raw occurrences >= 2  AND  the AUTHORITY's answer > 0
 *   NEW   720  = UNFENCED occurrences >= 2
 *   1800 INTERSECT 720 = 360
 *
 * So 1440 cells left (they carry only a FENCED earlier occurrence and cannot make I5's loop body
 * report at all) and 360 cells JOINED (their first unfenced occurrence is line zero, so the
 * authority answers `0` and the old conjunct called them unexercised — while `headLastUnfenced`
 * violates I5 on every one of them). The second number is the one no review reported, and it is
 * the direction that matters: those 360 are counter-examples the published reach was excluding.
 *
 * A floor swapped silently would have erased the evidence for its own necessity, so all of it is
 * stated. Every other entry is UNCHANGED by this plan.
 */
const REACH_FLOORS: Readonly<Record<string, number>> = {
  I1: 21600,
  I2: 4340,
  I3: 14772,
  I4: 3600,
  I5: 720,
  I6: 18000,
};
/**
 * The corpus-shape counts the duplicate axis promises, measured rather than predicted.
 *
 * Round 3's number for the first of these was ZERO across all 7200 cells — the measurement that made
 * I5 unreachable. They are pinned as EQUALITIES rather than floors, so a generator that started
 * emitting more or fewer two-occurrence documents reds instead of drifting.
 *
 * (Plan 29-36, 29-REVIEW § WR-03) `TWO_UNFENCED_CELLS` WAS RE-DERIVED AGAINST THE SAME RULE AND DID
 * NOT MOVE: 720, before and after. The review reads it as carrying I5's over-count "in kind"; it
 * does not, and the reason is worth stating rather than leaving to be re-litigated. This number
 * answers a CORPUS-SHAPE question — how many cells carry two UNFENCED occurrences of the heading —
 * and it counted unfenced occurrences already. What it lacks is the `at > 0` half, and the finding
 * of this plan is that I5's reach should lack it too.
 *
 * SO THE TWO NUMBERS NOW COINCIDE, at 720, and the coincidence is a fact rather than a copy. Two
 * expressions written for two questions arrived at the same population because I5's structural
 * precondition IS the corpus-shape property the duplicate axis was added to deliver — which is the
 * argument for adding that axis, closing on itself. They are kept as SEPARATE constants and their
 * equality is asserted with its reason, so a future edit that moved one without the other reds
 * instead of leaving two plausible figures side by side.
 *
 * The 360/360 split of these 720 on the `at > 0` half is published by the case below, because that
 * split is the whole of the too-narrow half: it is exactly what an authority-anchored reach
 * predicate would have kept and dropped, and the dropped half is where `headLastUnfenced` breaks
 * I5.
 */
const TWO_UNFENCED_CELLS = 720;
const FENCED_BEFORE_UNFENCED_CELLS = 720;
const UNFENCED_BEFORE_FENCED_CELLS = 1440;

describe("the section-locator authority under a parser oracle (plan 29-26, LANG-07)", () => {
  it("the corpus is DERIVED and COUNTED — axis lengths pinned, the cell count derived twice, every axis label reached", () => {
    expect(AXIS_LEVEL.length, "axis 1 — heading level").toBe(5);
    expect(AXIS_FENCING.length, "axis 2 — fencing").toBe(3);
    expect(AXIS_TRAILING.length, "axis 3 — trailing residue").toBe(4);
    expect(AXIS_LEADING.length, "axis 4 — leading residue").toBe(3);
    expect(AXIS_POSITION.length, "axis 5 — position").toBe(5);
    expect(AXIS_SHAPE.length, "axis 6 — document shape").toBe(4);
    expect(AXIS_REQUEST_LEVEL.length, "axis 7 — requested level").toBe(2);
    expect(AXIS_DUPLICATE.length, "axis 8 — duplicate occurrence").toBe(3);

    // DERIVATION ONE — the product of the pinned lengths.
    const product =
      AXIS_LEVEL.length *
      AXIS_FENCING.length *
      AXIS_TRAILING.length *
      AXIS_LEADING.length *
      AXIS_POSITION.length *
      AXIS_SHAPE.length *
      AXIS_REQUEST_LEVEL.length *
      AXIS_DUPLICATE.length;
    expect(product, "the product of the eight pinned axis lengths").toBe(EXPECTED_CELLS);

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
      duplicate: AXIS_DUPLICATE.map((a) => a.label),
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
    // (Plan 29-29) Both numbers RE-DERIVED after the eighth axis, never adjusted until the case
    // passed: 2058 -> 6378 triples and 724 -> 2164 documents, against 7200 -> 21600 cells.
    const triples = new Set(corpus.map((c) => `${c.from}|${c.level}|${c.text}`));
    expect(triples.size, "distinct (text, from, level) triples in the corpus").toBe(6378);
    const texts = new Set(corpus.map((c) => c.text));
    expect(texts.size, "distinct documents in the corpus").toBe(2164);
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

  it("the corpus really carries TWO-OCCURRENCE documents, in both orders — counted, never inferred from a label", () => {
    // (Plan 29-29, WR-03) An axis LABEL is a promise; this case is the delivery. Round 3's finding
    // was that the corpus carried ZERO documents with a second occurrence of the cell heading, and a
    // label reading "an earlier UNFENCED duplicate" would look identical on a generator that quietly
    // dropped the block. Every count below is taken over the GENERATED TEXT.
    const corpus = buildCorpus();
    const flagsOf = (c: Cell): boolean[] => fencedLineFlags(c.text);
    const occurrences = (c: Cell): number[] =>
      c.text
        .split("\n")
        .map((l, i) => (l.trimEnd() === c.heading ? i : -1))
        .filter((i) => i !== -1);

    const twoUnfenced = corpus.filter((c) => {
      const f = flagsOf(c);
      return occurrences(c).filter((i) => !f[i]).length >= 2;
    });
    expect(
      twoUnfenced.length,
      "cells carrying TWO UNFENCED occurrences of the cell heading — round 3 measured this at ZERO over the whole corpus",
    ).toBe(TWO_UNFENCED_CELLS);

    // (Plan 29-36, WR-03) THE 360/360 SPLIT, MEASURED — the whole of this plan's too-narrow half.
    //
    // An authority-anchored reach predicate (the shipped one, and the review's suggested
    // replacement) keeps the `at > 0` part of these cells and drops the `at === 0` part. Both parts
    // are pinned here so the dropped population is a NUMBER on the record rather than an argument,
    // and so a corpus that stopped generating either shape says which.
    const headAtZero = twoUnfenced.filter(
      (c) => unfencedHeadingIndex(c.text, c.heading) === 0,
    );
    const headAboveZero = twoUnfenced.filter(
      (c) => unfencedHeadingIndex(c.text, c.heading) > 0,
    );
    expect(
      headAtZero.length + headAboveZero.length,
      "a cell with two unfenced occurrences cannot answer -1, so the two parts must exhaust the set",
    ).toBe(twoUnfenced.length);
    expect(headAboveZero.length, "the part an authority-anchored reach would KEEP").toBe(360);
    expect(
      headAtZero.length,
      "the part an authority-anchored reach would DROP — and `headLastUnfenced` breaks I5 on every one of them",
    ).toBe(360);

    // AND I5's REACH IS THIS WHOLE SET, not the kept part. Two expressions written for two
    // questions, asserted equal with the reason recorded at `TWO_UNFENCED_CELLS`: a future edit
    // moving one without the other reds here.
    expect(
      corpus.filter((c) => REACH.I5(c)).length,
      "I5's reach is the corpus-shape set entire — its precondition IS `two unfenced occurrences`",
    ).toBe(TWO_UNFENCED_CELLS);
    expect(REACH_FLOORS.I5, "…and the pinned floor says the same").toBe(TWO_UNFENCED_CELLS);

    // BOTH ORDERS, each counted separately. A single number could be satisfied by one order alone.
    const orderCounts = (wantFencedFirst: boolean): number =>
      corpus.filter((c) => {
        const f = flagsOf(c);
        const at = occurrences(c);
        const fenced = at.filter((i) => f[i]);
        const unfenced = at.filter((i) => !f[i]);
        if (fenced.length === 0 || unfenced.length === 0) return false;
        return wantFencedFirst
          ? Math.min(...fenced) < Math.min(...unfenced)
          : Math.min(...unfenced) < Math.min(...fenced);
      }).length;
    expect(
      orderCounts(true),
      "cells where a FENCED occurrence precedes an UNFENCED one — WR-01's real defect shape",
    ).toBe(FENCED_BEFORE_UNFENCED_CELLS);
    expect(
      orderCounts(false),
      "cells where an UNFENCED occurrence precedes a FENCED one — the other order",
    ).toBe(UNFENCED_BEFORE_FENCED_CELLS);

    // …and the `none` member really does produce single-occurrence documents, so the axis
    // discriminates rather than adding a duplicate to every cell.
    expect(
      corpus.filter(
        (c) => c.labels.duplicate === "no second occurrence" && occurrences(c).length >= 2,
      ).length,
      "the `none` member must add no second occurrence",
    ).toBe(0);
  });

  it("every invariant I1..I6 is REACHED — counted by an expression written outside the violation loop", () => {
    // (Plan 29-29, WR-03) THE CLOSURE CONDITION. I5's reach was measured at ZERO over 7200 cells:
    // asserted every time, evaluated against a document that could break it not once. Each count
    // below comes from `REACH`, whose predicates are restatements of the invariants' DESCRIPTIONS
    // and never call `endViolations` or `headViolations`.
    //
    // (Plan 29-36, WR-03) AND THE SENTENCE THIS CASE PUBLISHES WAS UNTRUE OF 1440 OF THE CELLS IT
    // NAMED, WHILE OMITTING 360 IT SHOULD HAVE. It reads "EXERCISED by N cell(s) — a zero here
    // means it has never been evaluated against a document that could break it". With I5's reach
    // counting RAW occurrences and the AUTHORITY's answer, N was 1800: 1440 of those carried their
    // only earlier occurrence inside a fence and could not make I5's loop body report at all, and a
    // further 360 cells that `headLastUnfenced` DOES break I5 on were not counted, because the
    // authority answers `0` on them. The floor is now 720 and the sentence is true of all of them
    // and of nothing else. Both old numbers are left standing on purpose — a reader meeting only
    // the new value would have no way to tell a correction from a value that always looked like
    // this.
    const corpus = buildCorpus();
    const reached: Record<string, number> = {};
    for (const id of INVARIANT_IDS) {
      reached[id] = corpus.filter((c) => REACH[id](c)).length;
    }
    for (const id of INVARIANT_IDS) {
      expect(
        reached[id],
        `invariant ${id} is asserted over the whole corpus and EXERCISED by ${reached[id]} cell(s) — a zero here means it has never been evaluated against a document that could break it`,
      ).toBeGreaterThan(0);
      expect(reached[id], `${id}'s reach against its pinned floor`).toBe(REACH_FLOORS[id]);
    }
    // I5's is the one this plan exists for, asserted by name so a future narrowing that took it back
    // to zero says WHICH invariant went quiet rather than only that a number moved.
    expect(
      reached.I5,
      "I5 — round 3 measured its reach at ZERO; a non-zero number here is plan 29-29's closure condition",
    ).toBeGreaterThan(0);

    // THE REACH EXPRESSIONS DO NOT CALL THE VIOLATION COLLECTORS. Asserted mechanically over their
    // own source, the way this file already proves its heading rule non-circular — a reach counter
    // living inside the loop it audits is the same expression counting itself.
    for (const id of INVARIANT_IDS) {
      const src = REACH[id].toString();
      expect(src, `${id}'s reach expression must not call endViolations`).not.toContain(
        "endViolations",
      );
      expect(src, `${id}'s reach expression must not call headViolations`).not.toContain(
        "headViolations",
      );
    }
    // NON-VACUITY OF THE CHECK ITSELF. The first draft asserted each source "contains the letter c",
    // which every one of them does by accident of spelling — a check that could not fail, inside the
    // case whose subject is checks that cannot fail. What is asserted instead is a property of the
    // ANSWERS: every reach predicate except I1's must be true for SOME cells and false for others.
    // A predicate that is constant over the corpus measures the corpus's existence, not the
    // invariant's exercise, and that is indistinguishable from the vacuity WR-03 recorded.
    for (const id of INVARIANT_IDS) {
      expect(REACH[id].toString().length, `${id}'s source must be non-empty`).toBeGreaterThan(5);
    }
    for (const id of INVARIANT_IDS) {
      if (id === "I1") continue;
      expect(
        reached[id],
        `${id}'s reach predicate must DISCRIMINATE — a constant predicate counts the corpus, not the invariant`,
      ).toBeGreaterThan(0);
      expect(
        reached[id],
        `${id}'s reach predicate must not be total — see above`,
      ).toBeLessThan(corpus.length);
    }
    // I1 is total ON PURPOSE and says so, rather than being quietly exempt.
    expect(reached.I1, "I1 bounds every answer, so its reach is the whole corpus").toBe(
      corpus.length,
    );
  });

  it("the invariants that speak about a NEGATIVE or OUT-OF-RANGE answer are REACHED too — the same defect, checked for elsewhere", () => {
    // (Plan 29-29) WR-03 was found at I5. The review enumerated one instance; round 3's own lesson
    // is that an enumeration in a review is not the SET, so the other branches of both collectors
    // were checked for the same disease. Two were unreachable over every locator this file carries:
    //
    //   * `endViolations`' negative-answer branch, which is where IN-01's dead `end >= 0` conjunct
    //     moved. Neither `sectionEndIndex` nor `endLevelTwoOnly` can answer below zero.
    //   * `headViolations`' "not -1 and not an index" branch of I4. Neither head locator can answer
    //     a negative other than -1.
    //
    // Both are legitimate — each collector takes an ARBITRARY locator — and both are now exercised
    // by a locator built to reach them, so neither is a branch nobody has ever seen fire.
    const cell: Cell = {
      labels: Object.fromEntries(AXIS_KEYS.map((k) => [k, "hand-built negative-answer control"])),
      where: AXIS_KEYS.map((k) => `${k}=[hand-built negative-answer control]`).join(" "),
      text: ["## Anchor section", "Body prose.", "# A later top-level section", "Tail."].join("\n"),
      from: 1,
      level: 2,
      heading: "## Anchor section",
      candidateIndex: 0,
    };
    // THE CONTROL FIRST: the same cell is clean under both shipped locators, so the reports below
    // are caused by the broken locators and not by the fixture.
    expect(endViolations(cell, sectionEndIndex), "the control cell is clean").toEqual([]);
    expect(headViolations(cell, unfencedHeadingIndex), "the control cell is clean").toEqual([]);

    const endAlwaysNegative: EndLocator = () => -1;
    const negative = endViolations(cell, endAlwaysNegative);
    expect(
      negative,
      "a locator answering -1 must be reported as a NEGATIVE answer, by I1, and must not crash inside I2's heading rule",
    ).toEqual([
      "I1 violated — the answer is NEGATIVE — the locator returned no index at all; end=-1 from=1 lineCount=4 " +
        cell.where,
    ]);
    // …and the report is I1 ALONE. Before IN-01's conjunct moved, a negative answer reached I2 and
    // `lines[-1]` was `undefined`, so the collector threw instead of reporting.
    expect(negative.every((v) => v.startsWith("I1")), "a negative answer is an I1 finding").toBe(true);

    const headMinusTwo: HeadLocator = () => -2;
    const bad = headViolations(cell, headMinusTwo);
    expect(
      bad.some((v) => v.startsWith("I4") && v.includes("not -1 and is not a line index")),
      "an answer that is neither -1 nor an index must be reported by I4",
    ).toBe(true);

    // AND THE OUT-OF-RANGE HALF OF I1, from the other direction.
    const endTooHigh: EndLocator = (text) => text.split("\n").length + 5;
    expect(
      endViolations(cell, endTooHigh).some((v) => v.includes("outside [from, lineCount]")),
      "an answer above the line count must be reported by I1",
    ).toBe(true);
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

    // (Plan 29-29) THIS ASSERTION WAS RESTATED, AND THE RESTATEMENT IS THE FINDING. Until the
    // duplicate axis existed the only occurrence of a cell's heading was the candidate, so "the
    // probe fails only fenced cells" and "the probe fails only cells carrying a fenced occurrence"
    // were the same sentence and the narrower one was written. They are no longer the same: a cell
    // whose CANDIDATE is outside any fence but which carries an earlier FENCED duplicate is exactly
    // the document WR-01 was written for — a file that quotes its own required heading in an example
    // and also declares it — and the fence-blind scan rightly fails it. Asserting the old wording
    // would now refuse the corpus for finally generating the shape the review said was missing.
    //
    // The true property is about the OCCURRENCES, not about the candidate's own axis value.
    const carriesFencedOccurrence = (c: Cell): boolean => {
      const flags = fencedLineFlags(c.text);
      return c.text.split("\n").some((l, i) => flags[i] && l.trimEnd() === c.heading);
    };
    for (const cell of corpus) {
      if (headViolations(cell, headFenceBlind).length === 0) continue;
      expect(
        carriesFencedOccurrence(cell),
        `a fence-blindness probe may only fail a cell carrying a FENCED occurrence of its heading: ${cell.where}`,
      ).toBe(true);
    }
    // BOTH ARMS ARE NON-EMPTY, so the property above is not satisfied by one of them alone.
    const failingCells = corpus.filter((c) => headViolations(c, headFenceBlind).length > 0);
    expect(
      failingCells.filter((c) => c.labels.fencing === "outside any fence").length,
      "WR-01's real shape — an UNFENCED candidate preceded by a FENCED quotation of the same heading — must be in the corpus and must fail",
    ).toBe(720);
    expect(
      failingCells.filter((c) => c.labels.fencing !== "outside any fence").length,
      "…and the original arm, a fenced candidate, must still fail too",
    ).toBe(2880);
    expect(failingCells.length, "the two arms must partition the failures").toBe(3600);
    // Every unfenced-candidate failure is attributable to the duplicate axis and to nothing else.
    expect(
      failingCells
        .filter((c) => c.labels.fencing === "outside any fence")
        .every((c) => c.labels.duplicate === "an earlier FENCED duplicate"),
      "an unfenced candidate can only fail this probe because of an earlier FENCED duplicate",
    ).toBe(true);
  });

  it("THE SWEEP IS FALSIFIABLE — a LAST-match locator breaks I5, the ordering promise nothing tested", () => {
    // (Plan 29-29, WR-03) Before the duplicate axis this probe would have swept CLEAN, which is the
    // finding in one sentence: `unfencedHeadingIndex` promises the FIRST unfenced match, and an
    // implementation returning the LAST satisfied every invariant the corpus could reach.
    const corpus = buildCorpus();
    const failures: string[] = [];
    for (const cell of corpus) {
      for (const v of headViolations(cell, headLastUnfenced)) failures.push(v);
    }
    expect(
      failures.length,
      "the last-match locator must fail at least one cell, or I5 is still decoration",
    ).toBeGreaterThan(0);

    const first = failures[0];
    for (const key of AXIS_KEYS) {
      expect(first, `the last-match failure must name axis ${key}`).toContain(`${key}=[`);
    }
    // ATTRIBUTION: it must break I5 and NOTHING ELSE. It is fence-aware, so I4 holds; it is
    // complete, so I6 holds. A probe that broke three invariants would prove nothing about which one
    // the corpus can now reach.
    const invariants = new Set(failures.map((f) => f.slice(0, 2)));
    expect(
      [...invariants].sort(),
      "the last-match locator is fence-aware and complete — it may break I5 alone",
    ).toEqual(["I5"]);
    // And every failing cell really does carry a second occurrence, which is the axis doing the work
    // rather than some other property of the corpus.
    const dupLabels = new Set(
      failures.map((f) => {
        const m = /duplicate=\[([^\]]+)\]/.exec(f);
        return m === null ? "?" : m[1];
      }),
    );
    expect(
      dupLabels.has("no second occurrence"),
      "a single-occurrence document cannot distinguish first from last",
    ).toBe(false);

    // ── WR-03 REPRODUCED AS A PERMANENT ASSERTION, NOT AS A TRANSCRIPT. ──────────────────────────
    // Round 3's corpus is this corpus restricted to the `none` member of the duplicate axis. Over
    // THAT sub-corpus the last-match locator sweeps CLEAN and I5's reach is ZERO — which is the
    // finding, measured here rather than quoted from the review, and re-measured on every run. A
    // future narrowing that took the axis away would red here rather than quietly restoring the gap.
    const roundThreeCorpus = corpus.filter(
      (c) => c.labels.duplicate === "no second occurrence",
    );
    expect(
      roundThreeCorpus.length,
      "the round-3 sub-corpus must be the 7200 cells the review measured",
    ).toBe(7200);
    expect(
      roundThreeCorpus.reduce(
        (n, c) => n + headViolations(c, headLastUnfenced).length,
        0,
      ),
      "over round 3's corpus the last-match locator sweeps CLEAN — that is WR-03, and it is why this axis exists",
    ).toBe(0);
    expect(
      roundThreeCorpus.filter((c) => REACH.I5(c)).length,
      "over round 3's corpus I5's reach is ZERO — asserted 7200 times, evaluated against a document that could break it not once",
    ).toBe(0);
  });

  it("the cells headLastUnfenced breaks I5 on lie INSIDE I5's reach — the narrowing kept its own counter-example", () => {
    // (Plan 29-36, 29-REVIEW § WR-03) THE HAZARD A NARROWING CARRIES, DISCHARGED BY ASSERTION.
    //
    // Correcting `REACH.I5` made a set SMALLER — 1800 cells to 360. A smaller set is only an
    // improvement if it still contains the evidence the claim stands on, and here that evidence is
    // exactly one thing: `headLastUnfenced`, the probe that proves I5 is breakable at all. A reach
    // set that had excluded the cells that probe fails on would leave the invariant asserted over a
    // population that cannot contain its own counter-example — which is a worse version of the
    // defect being corrected, arrived at while fixing it.
    //
    // So the containment is asserted rather than reasoned about, and the violating set is floored
    // for non-emptiness FIRST so the subset claim cannot be vacuously true.
    const corpus = buildCorpus();
    const breaksI5 = corpus.filter((c) =>
      headViolations(c, headLastUnfenced).some((v) => v.startsWith("I5")),
    );
    expect(
      breaksI5.length,
      "the last-match probe must break I5 on SOME cell, or the subset claim below is true of nothing",
    ).toBeGreaterThan(0);

    const outside = breaksI5.filter((c) => !REACH.I5(c));
    expect(
      outside.map((c) => c.where),
      "a cell on which I5 is VIOLATED and which I5's reach predicate says is not exercise — the reach was narrowed past its own counter-example",
    ).toEqual([]);

    // ── THE DELTA, AS A PERMANENT MEASUREMENT RATHER THAN A TRANSCRIPT. ──────────────────────────
    //
    // `HISTORICAL_I5_REACH` reconstructs the predicate this plan replaced. It is a FIXTURE, not a
    // live rule, and it is kept for one reason: a floor that moved 1800 -> 720 is only evidence for
    // its own necessity while the old population can still be counted. It is also the one live
    // consumer of `occurrencesOf`, whose raw-occurrence promise is correct for what it measures —
    // the defect was using it to stand for a different question, never the function itself.
    const HISTORICAL_I5_REACH = (c: Cell): boolean =>
      occurrencesOf(c) >= 2 && unfencedHeadingIndex(c.text, c.heading) > 0;

    const old = corpus.filter(HISTORICAL_I5_REACH);
    const now = corpus.filter((c) => REACH.I5(c));
    expect(old.length, "the OLD reach — raw occurrences and the authority's answer").toBe(1800);
    expect(now.length, "the NEW reach — two UNFENCED occurrences").toBe(720);

    const inBoth = new Set(old.filter((c) => REACH.I5(c)).map((c) => c.where));
    expect(inBoth.size, "the two sets OVERLAP in 360 cells — this was never a plain narrowing").toBe(
      360,
    );

    // THE TOO-WIDE HALF: 1440 cells the old predicate published as exercise, and the maximally
    // adversarial probe breaks I5 on NONE of them, which is what "incapable of violating I5" means
    // when it is measured instead of argued.
    const dropped = old.filter((c) => !REACH.I5(c));
    expect(dropped.length, "cells the OLD reach claimed and the new one refuses").toBe(1440);
    expect(
      dropped.filter((c) => breaksI5.includes(c)).map((c) => c.where),
      "not one dropped cell can break I5 — they carry only a FENCED earlier occurrence",
    ).toEqual([]);

    // THE TOO-NARROW HALF, WHICH NO REVIEW REPORTED: 360 cells the old predicate did NOT count, and
    // the probe breaks I5 on EVERY one of them. This is the direction that would have hollowed the
    // invariant out, and it is the reason the corrected predicate names no locator's answer.
    const gained = now.filter((c) => !HISTORICAL_I5_REACH(c));
    expect(gained.length, "cells the OLD reach missed").toBe(360);
    expect(
      gained.filter((c) => !breaksI5.includes(c)).map((c) => c.where),
      "every cell the old reach missed is one the probe really does break I5 on",
    ).toEqual([]);

    // AND THE CONTAINMENT IS AN EQUALITY, WHICH IS THE STRONGER CLAIM AND HAS A REASON.
    //
    // `headLastUnfenced` is MAXIMALLY ADVERSARIAL for I5: it is fence-aware and complete, so its
    // only possible error is picking a LATER unfenced occurrence than the first — which is exactly
    // what I5 forbids. It therefore fails on EVERY cell that carries a second unfenced occurrence,
    // and on no other. So the reach set and the probe's failure set coincide.
    //
    // That is not circular. The two are computed by expressions with nothing in common: one counts
    // unfenced occurrences of the heading, the other runs a locator through `headViolations`. An
    // equality between two independently written expressions is evidence; it would be circular only
    // if the reach predicate consulted the probe, which the source assertions in the reach case
    // forbid mechanically.
    const reached = corpus.filter((c) => REACH.I5(c));
    expect(reached.length, "the reach set is the pinned floor").toBe(REACH_FLOORS.I5);
    expect(
      [...breaksI5].map((c) => c.where).sort(),
      "the maximally adversarial probe must break I5 on EXACTLY the cells I5's reach names — a subset either way is a hole",
    ).toEqual([...reached].map((c) => c.where).sort());
  });

  it("the review's fence-blind-breaks-I5 recommendation is REFUTED, and the refutation is proven", () => {
    // (Plan 29-29, WR-03) The review recommends re-running the fence-blind probe and requiring it to
    // break I5 as well as I4. That assertion CANNOT be made true, and writing it anyway would be a
    // vacuous assertion of exactly the kind this plan exists to delete. The argument:
    //
    //   `headFenceBlind` returns the FIRST line whose `trimEnd()` equals the heading — a RAW match.
    //   I5 fires when some EARLIER line is unfenced AND equals the heading. An unfenced occurrence
    //   is itself a raw match, so an earlier one would have been returned instead. No earlier line
    //   can satisfy the predicate, for any input whatever.
    //
    // So the last-match probe carries I5 and the fence-blind probe keeps I4. The recommendation is
    // not silently dropped: it is answered, and the answer is asserted rather than argued.
    const corpus = buildCorpus();
    const failures: string[] = [];
    for (const cell of corpus) {
      for (const v of headViolations(cell, headFenceBlind)) failures.push(v);
    }
    expect(failures.length, "the fence-blind probe must still fail cells").toBeGreaterThan(0);
    expect(
      [...new Set(failures.map((f) => f.slice(0, 2)))].sort(),
      "the fence-blind probe breaks I4 ALONE, and no corpus can make it break I5 — see the argument above",
    ).toEqual(["I4"]);

    // THE ARGUMENT ITSELF, CHECKED RATHER THAN ASSERTED: over the whole corpus, the answer this
    // locator gives is never preceded by a raw match. That is the property the proof turns on, and
    // it holds on the two-occurrence documents the new axis generates as well as everywhere else.
    let checked = 0;
    for (const cell of corpus) {
      const at = headFenceBlind(cell.text, cell.heading);
      if (at === -1) continue;
      checked += 1;
      const lines = cell.text.split("\n");
      for (let i = 0; i < at; i += 1) {
        expect(
          lines[i].trimEnd() === cell.heading,
          `a first-raw-match locator cannot have an earlier raw match: ${cell.where}`,
        ).toBe(false);
      }
    }
    expect(
      checked,
      "the argument must have been checked on cells where the locator actually answered an index",
    ).toBeGreaterThan(0);
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
