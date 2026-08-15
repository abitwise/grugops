// voice-model.ts — the ONE place that says what the grugops caveman voice IS, and where a caveman
// block LIVES (Phase 29 / LANG-05, LANG-06, LANG-07 — D-22, D-23, D-24, D-38).
//
// Two different guards now have to know both facts: guard_voice strips the caveman block and scans
// the CLEAR-VOICE REMAINDER for caveman tokens, and guard_caveman_voice keeps only the block and
// requires caveman tokens inside it. Those are genuinely different predicates over different halves
// of the same file, so a second CHECK is justified — a second READER is not, and a second LEXICON is
// not. This module is that one reader and that one lexicon; both guards import from here and neither
// holds a fence state machine or a voice literal inline.
//
// Before this module existed the aggregator carried TWO fence machines over the same bytes —
// `stripCavemanBlock` and `extractCavemanBlock` — and they DISAGREED on two of the three malformed
// forms. Measured and recorded in 29-RESEARCH.md §A-6:
//
//   malformed input                    stripCavemanBlock (guard_voice)   extractCavemanBlock (caveman)
//   ---------------------------------  -------------------------------   -----------------------------
//   unterminated fence                 sentinel -> FAIL RED, names file   returns the WHOLE FILE TAIL
//                                                                         as "the block" -> PASSES
//   a second `## Caveman prompt`       strips BOTH blocks                 `break` already fired at
//                                                                         fence 2 -> second block
//                                                                         silently ignored
//   heading present, no fence at all   sentinel -> FAIL RED               returns "" -> FAIL
//                                                                         (they agree by accident)
//
// Same bytes, two grammars, opposite verdicts. `readCavemanFence` returns ONE verdict that both
// consumers see.
//
// ---------------------------------------------------------------------------------------------
// THIS IS NOT A SECOND FENCE PARSER, AND THE DIFFERENCE IS THE QUESTION EACH ASKS.
//
// `frontmatter.ts`'s `stripFencedBlocks` owns "WHICH LINES ARE INSIDE *ANY* fence" — the toggle, the
// state, and the fail-safe on an unterminated fence, where it DROPS the tail so a malformed document
// can never leak an unguarded grant. It remains the only implementation of that in the tree, and
// nothing here duplicates it.
//
// `readCavemanFence` owns a different predicate: "WHERE IS THE SECTION-ANCHORED CAVEMAN FENCE, AND IS
// IT WELL-FORMED". It has a different input (a document with a `## Caveman prompt` anchor), a
// different output (a two-sided verdict, not a filtered string), and — the part that matters — the
// OPPOSITE FAIL DIRECTION: `stripFencedBlocks` is fail-safe by silently dropping what it cannot
// vouch for; this reader REFUSES BY NAME. A reader that silently dropped would reproduce the exact
// defect above.
//
// One authority per predicate. Two predicates, two functions, ONE delimiter class —
// `FENCE_DELIMITER_LINE` is imported from `frontmatter.ts` rather than written out a second time,
// because writing that expression again is the set-literal drift this repository has corrected three
// times, and declaring the state machine a second time anywhere is forbidden outright.
// ---------------------------------------------------------------------------------------------
//
// THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET. By construction it contains every literal
// it defines — every caveman token, every banned construction — so it would fail its own check. It
// lives under scripts/, which is outside the role corpus, outside the voice-file list and outside
// every governed-corpus part, so the exclusion holds structurally rather than by anyone remembering
// it.
//
// No I/O and no side effects: every function here is a pure transform over a passed-in string, and
// every constant is declarative. Node stdlib is not imported at all. Zero npm dependencies.

import {
  FENCE_DELIMITER_LINE,
  fencedLineFlags,
  sectionEndIndex,
  unfencedHeadingIndex,
} from "./frontmatter.js";

// ---------------------------------------------------------------------------
// The fence reader (D-22, D-23)
// ---------------------------------------------------------------------------

// The section anchor. The heading `scripts/validate-agent-factory.ts` pins as a required role-file
// section — D-10's rule that the anchor is not re-engineered still holds; only the machinery around
// it changed.
//
// (Plan 29-14, CR-01) ANCHORED AT BOTH ENDS. It was `/^## Caveman prompt/` — a PREFIX match, so
// `## Caveman prompted` was a heading hit. That had two live consequences, not one: a document
// carrying only the near-miss heading read as a real caveman section, and a WELL-FORMED document that
// also carried the near-miss counted TWO headings and was refused `multiple` on correct bytes. The
// whole-line form is what makes the section anchor mean one line and not a family of them. All 17
// live role headings are exactly this string, verified against the corpus before the tightening.
//
// (Plan 29-20, WR-01) A STRING RATHER THAN A REGEX, BECAUSE THE EQUALITY IS THE AUTHORITY'S TO
// DECIDE. It was `/^## Caveman prompt$/`. Both questions asked below — WHERE is the anchor, and HOW
// MANY are there — must apply the SAME equality, or the module disagrees with itself about which
// lines are anchors: a heading carrying one trailing space would be counted by one half and located
// by the other. `unfencedHeadingIndex` normalizes with `trimEnd()`, so the count is written the same
// way and the whole-line property above is preserved exactly — `## Caveman prompted` is still not
// this string.
const CAVEMAN_HEADING = "## Caveman prompt";

// ---------------------------------------------------------------------------------------------
// (Plan 29-14, CR-01 · Plan 29-20, CR-02) THE BOUND. THIS IS THE FOUNDING DEFECT OF PHASE 29,
// REINTRODUCED BY THE ONE READER THAT EXISTS TO CLOSE IT, AND THEN HALF-CLOSED AGAIN — so read the
// argument before touching either scan.
//
// The predicate this reader answers is "WHERE IS THE FENCE IN **THIS SECTION**". It is not "where is
// the first fence after this heading". Before 29-14 the two scans below ran to END OF FILE, so a
// role whose caveman section had been reworded into plain senior prose ADOPTED AN UNRELATED LATER
// FENCED BLOCK as the caveman block and returned `ok: true`. Both consumers then measured the wrong
// bytes and passed: guard_caveman_voice printed `tokens 4 / content words 4` over a `## Notes` code
// block, guard_voice scanned the real caveman prose as if it were clear-voice remainder, and the gate
// printed ALL CHECKS PASSED. Nothing else in the repository caught it.
//
// 29-14 BOUNDED IT WITH A PRIVATE `/^## /` AND THAT WAS A HALF-FIX, IN TWO SEPARATE WAYS.
//
// The LEVEL half: a `# ` heading starts a sibling section at least as surely as a `## ` one, and it
// closed nothing. The identical bypass survived one character to the left, still returning `ok: true`
// with `inside` taken from a level-one successor's block. Measured against the committed build before
// plan 29-20 and pinned by a case in voice-model.test.ts and by a whole-gate case in
// check-foundation-guards.test.ts.
//
// The AUTHORITY half, which is why the remedy is not a wider regex: FOUR modules answered "where does
// this section end" four private, disagreeing ways, and this module's copy was one of them. Widening
// it here would have made a fifth heuristic in a phase whose founding rule is that a predicate has one
// authority. So THE BOUND IS NO LONGER THIS MODULE'S TO DECIDE. `frontmatter.ts` — which already owns
// the fence toggle the question depends on — exports `sectionEndIndex`, this module CONSUMES it, and
// the private `SECTION_END` constant and its bounding loop are DELETED rather than corrected. The
// level and fence axes, and the argument for each, live at the declaration there.
//
// A DELIMITER UNDER A LATER HEADING BELONGS TO A DIFFERENT SECTION. That sentence is the whole rule.
// The section runs from the anchor to the next UNFENCED heading of level one or two, or to end of
// file when the caveman section is the document's last, and both scans are bounded by it. Not finding
// a delimiter inside the bound is a REFUSAL BY NAME — never a licence to keep looking.
//
// 29-20's REWIRE THEN REOPENED THE DEFECT, AND THE MECHANISM IS A CIRCULARITY — plan 29-27, CR-01.
//
// `sectionEndIndex` SKIPS lines the one fence toggle flags, which is correct for its own question and
// fatal for this one: THE CAVEMAN FENCE'S OWN INTERIOR IS FLAGGED BY THAT TOGGLE. Asking a
// fence-aware authority where this section ends, over a text whose fence is the very thing being
// measured, is asking the block to decide its own extent. A `#` or `##` heading written BETWEEN the
// delimiters therefore closed nothing, the close scan ran past it, every intervening section landed
// in `inside`, and `outside` — the whole scan surface of guard_voice — could be driven to the EMPTY
// STRING. Measured against the committed build before 29-27, on 29-REVIEW.md CR-01's document:
// `ok:true` with `outside` = "", where `3ed76c1` had refused the same bytes `unterminated`.
//
// THE FIX KEEPS ONE AUTHORITY AND DELETES THE CIRCULARITY: the bound is taken from `sectionEndIndex`
// called over a DELIMITER-NEUTRALISED PROJECTION of the document — every `FENCE_DELIMITER_LINE` line
// replaced by an empty line, line COUNT and every other line's bytes preserved exactly. Over that
// text `fencedLineFlags` is all-false, so the answer is the fence-blind level-at-most-two successor:
// exactly the bound `3ed76c1` computed, now produced by the SHARED authority rather than by a private
// regex. Neutralising is a THIRD use of the already-imported `FENCE_DELIMITER_LINE` class, not a new
// grammar — the same class the two scans below already test directly.
//
// THE AUTHORITY'S SCOPE, STATED BECAUSE UNIFYING TWO PARSERS MAKES SCOPE A NEW DEGREE OF FREEDOM AND
// THAT IS PRECISELY HOW 29-20 REOPENED THIS: the section is `[heading + 1, sectionEnd)` over the
// neutralised projection. The reader never looks before `heading`, never reports a section the caller
// did not ask about, and a delimiter under a later heading belongs to that section and is never
// adopted here.
//
// THE COST, STATED SO IT IS NOT LATER "FIXED", AND THIS IS THE SHIPPED DIRECTION: a level-ONE-or-TWO
// ATX line INSIDE the fence interior truncates the section before the closing delimiter, so such a
// document is refused `unterminated` BY NAME rather than returning a shortened `inside` or a swollen
// one. That is deliberate and it is the FAIL-CLOSED direction — a short interior is a measured number
// about the wrong bytes, which is the defect, while a refusal is a red gate naming a file. Do not add
// a second arm that reaches PAST the bound to find something it can vouch for: reaching past IS the
// defect (it is what `ok:true, outside:""` was), not the remedy.
//
// THE ACCEPTED COST, MEASURED RATHER THAN DESCRIBED: 0 of the 17 live role files carry a level-one-or
// -two ATX line inside their caveman interior, so the refusal has ZERO live instances on the shipped
// tree. Re-measure that number rather than trusting this sentence; a non-zero count is a shipped
// bypass to escalate, not a residual to absorb.
//
// Level THREE headings still do not bound the section: a subsection structures a section and does not
// leave it, so `### ` stays inside a caveman block. Both directions are pinned by cases, because a
// bound tested from one side only is exactly the half-fix recorded above.
//
// The open and close scans keep testing `FENCE_DELIMITER_LINE` DIRECTLY. "Is this line a fence
// delimiter" is a different question from "where does this section end", and folding one into the
// other would be a new defect rather than a further unification.
// ---------------------------------------------------------------------------------------------

/**
 * The verdict. A discriminated union with no third outcome and no catch-all: either the caveman
 * fence was located and is well-formed, or it was refused under one NAMED reason.
 *
 * `inside` may legally be the empty string — a well-formed fence with a zero-line interior is a
 * SUCCESS for this reader (the bytes are exactly what a caveman fence looks like) and a FAILURE for
 * guard_caveman_voice's positive arm (a block with no tokens carries no voice). Keeping those two
 * questions apart is what lets one verdict serve both consumers.
 */
export type CavemanFenceResult =
  | { ok: true; inside: string; outside: string }
  | { ok: false; reason: "missing" | "unterminated" | "multiple" };

/**
 * THE ONE READER (D-23). Line-oriented, single pass per phase, no regex with nested quantifiers.
 *
 * - Two or more `## Caveman prompt` headings is `multiple`. This is LOAD-BEARING, not a nicety:
 *   today a second heading re-triggers `stripCavemanBlock` (which then strips both blocks) and is
 *   INVISIBLE to `extractCavemanBlock` (whose `break` already fired). Neither merging the blocks nor
 *   ignoring the second one is a verdict a reader can defend, so it refuses.
 * - Zero headings, or a heading with no following fence delimiter line, is `missing`.
 * - A first fence delimiter opened and never closed before EOF is `unterminated` — the reader
 *   REFUSES rather than returning the file tail as the block.
 *
 * (Plan 29-14, 29-20) Every scan below is bounded to the caveman SECTION — see the argument above.
 * The reader answers about the fence in THIS section only; a delimiter under a later `# ` or `## `
 * heading is another section's and is never adopted here. The bound itself comes from
 * `frontmatter.ts`'s `sectionEndIndex`, the one authority for it.
 */
export function readCavemanFence(text: string): CavemanFenceResult {
  const lines = text.split("\n");

  // THE ANCHOR SCAN, FENCE-AWARE (plan 29-20, WR-01). A line INSIDE a fenced example is showing
  // documentation, not declaring a section, so it donates no heading. Testing raw lines refused a
  // correct role file `multiple` merely for QUOTING its own required heading in an example, and — in
  // the other direction — let a fence-blind anchor sit beside a fence-aware bound, so an anchor
  // hidden under an open fence was still found while its section's boundary was not, and the reader
  // reached into a later section again.
  //
  // THE COUNT TAKES THE PER-LINE TOGGLE DIRECTLY, AND THAT IS NOT A SECOND GRAMMAR. This scan needs a
  // COUNT, not a first index, so it cannot be `unfencedHeadingIndex`. Wrapping that helper in a
  // "find the next one after i" loop WOULD be a second traversal with its own termination behaviour —
  // the shape this round is deleting — so it is deliberately not done. The module takes the toggle
  // for the count and the shared locator for the position; both are projections of the ONE fence
  // authority, and both apply the SAME `trimEnd()` equality to `CAVEMAN_HEADING`.
  const flags = fencedLineFlags(text);
  let anchors = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!flags[i] && lines[i].trimEnd() === CAVEMAN_HEADING) anchors += 1;
  }
  // Two REAL unfenced anchors is still a refusal — load-bearing for both consumers, and untouched by
  // the fence-awareness fix.
  if (anchors > 1) return { ok: false, reason: "multiple" };

  const heading = unfencedHeadingIndex(text, CAVEMAN_HEADING);
  if (heading === -1) return { ok: false, reason: "missing" };

  // THE DELIMITER-NEUTRALISED PROJECTION (plan 29-27, CR-01). Every fence delimiter line becomes an
  // EMPTY line; the line COUNT and every other line's bytes are preserved exactly, so an index into
  // `blindText` is the same index into `lines`. `FENCE_DELIMITER_LINE` is the class the two scans
  // below already test directly — this is a third use of that one imported class, not a second
  // grammar, and no state machine is declared here.
  //
  // WHY THE BOUND IS ASKED OVER THIS TEXT AND NOT OVER `text`: the fence toggle flags the caveman
  // fence's OWN INTERIOR, so a fence-aware bound over `text` lets the block being measured decide
  // where its own section ends. Over the neutralised projection `fencedLineFlags` is all-false and
  // the authority returns the fence-blind level-at-most-two successor.
  const blindText = lines
    .map((l) => (FENCE_DELIMITER_LINE.test(l) ? "" : l))
    .join("\n");

  // THE BOUND, asked ONCE of the shared authority and consulted by BOTH scans (see the argument
  // above). One bound, two consumers — computing it twice, or bounding only the open scan, would
  // recreate the disagreement this module exists to delete. Level TWO: both `# ` and `## ` close the
  // caveman section, `### ` does not.
  //
  // SCOPE: `[heading + 1, sectionEnd)`. Never before `heading`, never a section the caller did not
  // ask about, and a delimiter under a later heading is another section's.
  const sectionEnd = sectionEndIndex(blindText, heading + 1, 2);

  // The OPEN scan, bounded. No delimiter inside this section is `missing`; it does NOT continue past
  // `sectionEnd` looking for one, because a delimiter under a later heading is a different section's.
  let open = -1;
  for (let i = heading + 1; i < sectionEnd; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) {
      open = i;
      break;
    }
  }
  if (open === -1) return { ok: false, reason: "missing" };

  // The CLOSE scan, bounded by the SAME end. A fence opened in this section and not closed in it is
  // `unterminated` — including when a `## ` line inside the interior pulled the bound in front of the
  // closing delimiter. Fail-closed by name, never a silently shortened interior.
  let close = -1;
  for (let i = open + 1; i < sectionEnd; i++) {
    if (FENCE_DELIMITER_LINE.test(lines[i])) {
      close = i;
      break;
    }
  }
  if (close === -1) return { ok: false, reason: "unterminated" };

  const inside = lines.slice(open + 1, close).join("\n");
  const outside = lines
    .filter((_l, i) => i !== heading && !(i >= open && i <= close))
    .join("\n");
  return { ok: true, inside, outside };
}

// ---------------------------------------------------------------------------
// The positive arm — the committed caveman lexicon (D-07)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// THE BOUNDARY A FUTURE EDITOR IS MOST LIKELY TO GET WRONG.
//
// Every term below is read by BOTH voice guards, in OPPOSITE directions: guard_caveman_voice
// requires at least CAVEMAN_LEXICON_MIN of them INSIDE the fence, and guard_voice fails on any of
// them OUTSIDE it. So a term that also occurs in the kit's ordinary clear-voice prose does not merely
// weaken the positive arm — it makes guard_voice FAIL RED ON CORRECT TEXT, and the only way back to
// green would be to delete prose the project keeps on purpose.
//
// `good`, `bad` and `ugly` are grugbrain.dev coinages and were EXCLUDED for exactly that reason.
// They are ordinary English adjectives that a quality/trace surface uses constantly.
//
// The admission test, measured rather than assumed: before a term is added here, grep it over the
// clear-voice REMAINDER (`readCavemanFence(...).outside`) of every file in the aggregator's
// VOICE_FILES list and require ZERO hits. The sixteen terms below were measured that way on
// 2026-08-13 and returned zero hits across all 19 voice surfaces.
//
// The rule this boundary shares with dead-vocabulary.ts's two: if going green would require deleting
// correct text, the literal does not belong in this file.
// ---------------------------------------------------------------------------------------------
//
// Matching is word-boundary and case-insensitive (see `countLexiconTokens` below, which is the ONE
// implementation of that match — a consumer must never build its own). A term whose inflected forms
// should count is admitted BY STEM ONLY IF THE STEM IS LISTED; there is deliberately no stemmer,
// because a stemmer would make the admitted set unenumerable and this list is the whole point.
export const CAVEMAN_LEXICON: readonly string[] = [
  // The ten terms the deleted VOICE_MARKERS regex already carried, retained so that the two guards
  // read ONE list rather than two — LANG-07's argument applied to the lexicon rather than the fence.
  "grug",
  "club",
  "rock",
  "cave",
  "smash",
  "shiny",
  "brain hurt",
  "me think",
  "no think",
  "big think",
  // grugbrain.dev coinages. The attribution at NOTICE:4-7 and README.md:57-59 stays visible; these
  // are the vocabulary of the source the brand credits, not a borrowed asset.
  "big brain",
  "spirit",
  "demon",
  "swamp",
  "shiny rock",
  "sharp stick",
];

// N — the number of distinct lexicon HITS a caveman block must carry.
//
// TWO, NOT ONE. One token per block is precisely the sprinkle-to-green defect D-07 names one level
// up: an author can satisfy a floor of 1 by dropping a single `grug` into the opener and leaving the
// rest of the block as senior prose. Two forces a token in the opener AND in the body, which is the
// smallest floor that cannot be met by decoration.
export const CAVEMAN_LEXICON_MIN = 2;

// ---------------------------------------------------------------------------
// The negative arm — banned constructions (D-07)
// ---------------------------------------------------------------------------

export type BannedCategory = "article" | "copula" | "modal" | "subordinator";

// Four CLOSED token sets, matched over word boundaries. No threshold, no ratio, no tuning knob —
// D-10 records the rejected alternative (a tokens-per-content-word ratio with a cutoff) so a later
// phase does not re-propose a tunable number.
//
// The copula set makes the conventional opener `You are <Role>.` illegal, in all seventeen blocks.
// That is intended and it is the largest single consequence of this arm: a rewritten block says
// `You <Role>.` D-07 states "zero banned constructions" with no exemption, and an exemption for the
// first line would be a second grammar for one position.
export const BANNED_CONSTRUCTIONS: Readonly<
  Record<BannedCategory, readonly string[]>
> = {
  article: ["the", "a", "an"],
  copula: ["is", "are", "was", "were", "be", "been", "being", "am"],
  modal: ["should", "may", "might", "could", "would", "must", "shall", "can"],
  subordinator: [
    "which",
    "that",
    "because",
    "although",
    "while",
    "whereas",
    "unless",
    "whether",
  ],
};

export const BANNED_CATEGORIES: readonly BannedCategory[] = [
  "article",
  "copula",
  "modal",
  "subordinator",
];

// ---------------------------------------------------------------------------
// The counters. ONE implementation of each match, so a consumer cannot come to disagree with the
// list about what a hit is.
//
// Every regex here is a single `\b(alternation of literal tokens)\b` group. There is deliberately no
// nested quantifier over the same character class — the superlinear-backtracking incident recorded
// in project memory (a 0.47 s guard that took 383 s) is DORMANT, not fixed, and prose scanners are
// where it creeps back in. A fresh RegExp is built per call rather than shared, so no `lastIndex`
// state can leak between callers.
// ---------------------------------------------------------------------------

// Regex-escape a literal token. The lexicon and the banned sets contain only letters and spaces
// today; escaping is here so that adding a term with punctuation cannot silently become a pattern.
const escapeLiteral = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * How many DISTINCT lexicon terms occur in `text`. Distinct rather than total: repeating one term
 * six times is decoration, and the floor asks for vocabulary breadth, not repetition.
 */
export function countLexiconTokens(text: string): number {
  let n = 0;
  for (const term of CAVEMAN_LEXICON) {
    const re = new RegExp(`\\b${escapeLiteral(term)}\\b`, "i");
    if (re.test(text)) n += 1;
  }
  return n;
}

/** Total banned-construction hits in `text`, per category. */
export function countBannedConstructions(
  text: string,
): Record<BannedCategory, number> {
  const out = {} as Record<BannedCategory, number>;
  for (const category of BANNED_CATEGORIES) {
    const tokens = BANNED_CONSTRUCTIONS[category].map(escapeLiteral).join("|");
    const re = new RegExp(`\\b(${tokens})\\b`, "gi");
    out[category] = (text.match(re) ?? []).length;
  }
  return out;
}

/**
 * Content words in `text`: whitespace-separated runs that carry at least one alphanumeric character.
 * The denominator of D-08's per-block measurement line — reported, never thresholded.
 */
export function countContentWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

// ---------------------------------------------------------------------------
// Sentence identity (D-38) — consumed by guard_role_clause_uniqueness (plan 29-01) and by
// check-diff-disposition (plan 29-04). ONE function; a second would let two gates disagree about
// whether two sentences are the same sentence.
// ---------------------------------------------------------------------------

/**
 * The ONE sentence-identity function.
 *
 * Step order is the specification, and the FIRST step is the encoding decision: `normalize("NFC")`
 * runs before anything else, so an NFD spelling and an NFC spelling of the same clause are ONE
 * clause. Without it the guard would report two distinct clauses that render identically, and a
 * duplicate could hide behind a combining mark.
 *
 * Dropping the articles and a leading `you` is not cosmetic either — it is what makes the caveman
 * block's telegraphic `You stop if scope grows or architecture must change.` identical to
 * `## One job`'s `You stop if scope grows or the architecture must change.`, which is the entire
 * point of D-20.
 */
export function normalizeSentence(s: string): string {
  let t = s.normalize("NFC"); // FIRST — the encoding decision (D-38)
  t = t.replace(/`([^`]*)`/g, "$1"); // code span -> contents
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // [text](url) -> text; the TARGET is dropped
  t = t.replace(/\*\*([^*]*)\*\*/g, "$1"); // bold -> contents
  t = t.replace(/\*([^*]*)\*/g, "$1"); // italic -> contents
  t = t.toLowerCase();
  t = t.replace(/[^a-z0-9 ]+/g, " "); // every other character folds to a space
  t = t.replace(/\s+/g, " ").trim();
  let w = t.split(" ").filter(Boolean);
  w = w.filter((x) => x !== "the" && x !== "a" && x !== "an");
  if (w[0] === "you") w = w.slice(1);
  return w.join(" ");
}

// A clause is discarded below this many normalized words. Fragments shorter than this are list
// markers, table cells and headings, which repeat legitimately and would drown the finding set.
export const CLAUSE_MIN_WORDS = 4;

/**
 * Split `text` into NORMALIZED clauses with their 1-based source line numbers (D-38 Variant C).
 *
 * Variant C — sentence split, THEN clause split — is not a refinement. Measured over the whole role
 * corpus in 29-RESEARCH.md §B-3: sentence-level equality alone finds 2 duplicate groups in 17 files
 * and ZERO in software-engineer.md, the file this phase cites as its worked example. Clause-level
 * segmentation finds 12 groups across 9 files including all four software-engineer.md occurrences.
 * The choice is the difference between a guard that catches the defect and one that lands green.
 *
 * `String.prototype.split` throughout, never a match-all regex — see the counters' note on
 * backtracking.
 */
export function segmentClauses(
  text: string,
): { clause: string; line: number }[] {
  const out: { clause: string; line: number }[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    // Sentence terminators followed by whitespace. The lookbehind is fixed-width and consumes
    // nothing, so there is no quantifier to backtrack over.
    for (const sentence of lines[i].split(/(?<=[.!?])\s+/)) {
      // Clause separators: em dash, en dash, semicolon and colon, each SURROUNDED BY SPACES. The
      // surrounding spaces are what keep `A/B`, `9:30` and hyphenated compounds intact.
      for (const fragment of sentence.split(/ — | – | ; | : /)) {
        const clause = normalizeSentence(fragment);
        if (clause.split(" ").filter(Boolean).length < CLAUSE_MIN_WORDS) continue;
        out.push({ clause, line: i + 1 });
      }
    }
  }
  return out;
}
