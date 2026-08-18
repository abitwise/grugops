// check-banned-claims.ts — Phase 29 LANG-04 conformance/benefit-claim gate (D-29, D-44).
//
// Decides ONE literal question, and the scope of this sentence is the scope of the mechanism
// (round 8, D-55): whether any member of a pinned claim-literal list occurs on any SINGLE PHYSICAL
// LINE of a DERIVED document set — outside the registry-anchored blocks of one named exemption
// region, which is the disclaimer that has to be able to quote a claim in order to deny it. The
// corpus size and the list size are PUBLISHED BY THE RUN rather than stated here, because a count
// typed into prose goes stale and this phase has watched it do so at three addresses.
//
// What this gate does NOT decide is recorded below under RECORDED RESIDUAL, not implied away here.
//
//   node scripts/check-banned-claims.js
// Exit 0 = no pinned literal occurs on any single line of any scanned document, outside those
// blocks; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS GATE EXISTS, AND WHY IT IS MECHANICAL RATHER THAN DISCIPLINARY.
//
// LANG-04 forbids a class of claim the kit must never make. The voice guard is this project's own
// proof of what a prohibition without a mechanism does over a full milestone: the caveman voice
// drifted entirely out of all seventeen role blocks while the guard that was supposed to hold it
// stayed green, because it measured sentence SHAPE and not voice. A prohibition that lives only in
// a rule document is a prohibition nobody can fail.
//
// So the prohibition is a gate. What the gate decides is a LITERAL question — does a pinned string
// appear outside one named region — and the gate is named for exactly that predicate. It is NOT
// named for, and never presented as enforcing, conformance with any standard: a guard named for a
// predicate it does not decide is the guard_caveman_preserved mistake with new vocabulary.
//
// ---------------------------------------------------------------------------------------------
// THIS FILE OWNS ONE LIST, AND THE ADMISSION TEST IS THE ONE dead-vocabulary.ts ALREADY WROTE.
//
// The rule, quoted verbatim from scripts/dead-vocabulary.ts:50-51 —
//
//   "if going green would require deleting correct text, the literal does not belong in this file."
//
// Every candidate below was run against the WHOLE scan set before it was admitted, and the hit
// count was recorded. Two candidates were REJECTED on that measurement and their exclusions are
// recorded in BANNED_CLAIM_EXCLUDED below rather than left as silent absences. A literal is a
// separate pinned member per spelling variant — never a pattern that guesses at variants, because
// a pattern admits shapes nobody measured and a reader cannot tell which.
//
// THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET, INCLUDING ITS OWN. By construction it
// contains every literal it defines, so it would fail its own check. It lives under scripts/, which
// the derivation below structurally cannot reach — the kit part walks agent-factory/ and the
// public-docs part is the set check-public-docs-vocabulary.ts already owns. The exclusion holds by
// construction rather than by anyone remembering it, and a case in the test file asserts it.
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// A BRAND-NEW CONFORMANCE CLAIM WRITTEN WITHOUT ANY PINNED LITERAL IS NOT MECHANICALLY DETECTABLE.
// No grep recognizes an assertive sentence written in new words — a sentence asserting that this
// kit meets a published standard, phrased without naming it, passes this gate green. So be precise
// about what a green run here means:
//
//   THIS GATE PROVES that no pinned literal appears outside the one named exemption region.
//   IT DOES NOT PROVE that no conformance, token-economy or comprehension claim exists.
//
// A SECOND, NARROWER RESIDUAL, RECORDED FOR THE SAME REASON — and DIRECTED: FAIL-OPEN. Matching is
// line-oriented, so a pinned literal HARD-WRAPPED ACROSS A LINE BOUNDARY is not matched. The answer
// is deliberately NOT to normalize whitespace before comparing: that would make the comparison
// inexact for every literal in order to reach one wrapping, and an inexact comparison is how a gate
// starts admitting shapes nobody measured. That refusal stands, and it is not what changed here.
//
// WHAT CHANGED IS THE JUSTIFICATION, BECAUSE IT WAS FALSE. This paragraph used to argue that
// reaching the bypass takes a wrap falling INSIDE a word, which no reader would parse as a claim.
// It does not. Round 7's code review and round 7's verifier each independently reproduced it with a
// wrap falling BETWEEN TWO WORDS of a multi-word member — the shape markdown soft-joins back into a
// fully legible sentence, so a reader sees the claim this gate did not. Measured over this
// repository's own prose: 757 mid-sentence hard wraps across 2612 adjacent non-blank line pairs in
// 73 tracked agent-factory markdown files, roughly three pairs in ten. The stated definition of
// that figure and the command that produced it are in docs/audit/29-round8-residuals.md §4.4. It is
// the house style, not an exotic authoring act. An accepted bound argued from a false premise is
// worse than an undisclosed one, so the premise is DELETED rather than softened at this address.
//
// THE REACH IS THE DERIVED ONE, NOT THE MULTI-WORD COUNT. 11 of the 22 pinned members are
// wrap-reachable — 4 of 7 in standard-name, 6 of 7 in token-economy, 1 of 8 in comprehension. It is
// not 16, which is the multi-word count under another name: a split leaving another pinned member
// intact on one of the two lines is still matched, which is how the bare terms in this file's list
// defend their own longer phrasings. LIVE COUNT: 0, measured over the derived corpus rather than
// asserted. Both derivations are recorded, with their commands, at §4.2 and §4.3 of that record.
//
// OPEN, WITH AN ID: V-29-57-01. The named remedy — a SECOND, explicitly named wrap-joined input
// assembly, asked only of the multi-word members and carrying a per-line index so a finding still
// reports the ORIGINATING line — is NOT applied here. D-56 declines it for this round: it is new
// matcher surface against an axis with no live instance, in a phase where each round's fix produced
// the next round's finding. The axis stays visible and counted rather than closed by a heuristic.
//
// agent-factory/writing-profile.md states the same residual in its own prose, in the section this
// gate exempts, rather than letting a green run imply otherwise.
//
// ---------------------------------------------------------------------------------------------
// THE D-44 RED TRANSCRIPT — this guard was watched FAILING on a real claim in a real file.
//
// The standard's name appeared in ZERO kit files before this phase, so a check landed against this
// tree would have gone GREEN having never been watched fail. Plan 29-02 Task 1 therefore wrote one
// deliberate conformance sentence into agent-factory/writing-profile.md, outside the exemption
// region and marked with an HTML comment naming it as the draft claim. This gate landed against
// that tree. Measured 2026-08-13, `node scripts/check-banned-claims.js`:
//
//   banned literal                    group           hits  file:line:col
//   -------------------------------   -------------   ----  -------------------------------------
//   "token-economy"                   token-economy      1  agent-factory/workflows/
//                                                             18-context-compaction.md:27:231
//   "ASD-STE100"                      standard-name      1  agent-factory/writing-profile.md:32:29
//   "Simplified Technical English"    standard-name      1  agent-factory/writing-profile.md:32:40
//   -------------------------------   -------------   ----  -------------------------------------
//   TOTAL                                                3  over 82 scanned documents
//
//   exit code 1 — 1 CHECK(S) FAILED (one measured block carrying three findings)
//
// The planted line, quoted from the run:
//
//   agent-factory/writing-profile.md:32:29 — banned standard-name literal "ASD-STE100" —
//   "The grugops kit conforms to ASD-STE100 Simplified Technical English."
//
// TWO OF THE THREE WERE NOT PLANTED. The `token-economy` hit is a claim that was ALREADY in the
// shipped kit — agent-factory/workflows/18-context-compaction.md called the caveman voice "a token
// economy applied to memory", which project measurement on 2026-07-28 DISPROVED on this artifact.
// That is the drift this gate exists for, caught on its first run, and it is why the RED is
// evidence rather than theatre. Both the planted sentence and the pre-existing claim were deleted
// in the next commit.
//
// The third finding demonstrates the conditional arm and the adjacency rule at once: `ASD-STE100`
// and `Simplified Technical English` sit adjacently on ONE line and produce TWO findings, at
// columns 29 and 40, because the hit count is arithmetic over what was read.
//
// Task 2 then DELETED that sentence and re-ran the same committed .js to exit 0. The gate is
// BYTE-UNCHANGED across the transition — that is what makes the red credible, and `git diff` over
// the two commits shows the profile changed and this file not.
//
// The durable half is scripts/check-banned-claims.test.ts's PLANTED fixture. The tree can never
// again contain the claim, so without a hermetic mirror that plants it, this gate's only evidence
// would be one historical commit.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// The walk's WORK bound is taken from the ONE place this repository declares it rather than
// restated as a second literal.
import { MAX_WALK_ENTRIES } from "./kit-model.js";
// Plan 29-01's shared element-level vacuity rule (AP-1). This gate declares NO zero check of its
// own: the measurement is a required argument of reportMeasured, so a PASS line here cannot state a
// check that visited nothing.
import { reportMeasured } from "./vacuity.js";
// The public-document half of the scan set is DERIVED BY THE MODULE THAT ALREADY OWNS IT. Deriving
// root markdown and examples/ a second time here would be a second membership rule over one
// corpus, which is how two scan sets come to disagree about what a public document is. That reason
// still holds and is why the import stays.
//
// WHAT CHANGED IN ROUND 6, AND THE OBJECTION IT ANSWERS (CR-01). This import used to name
// `publicDocsScan`, which does not answer "which documents are public" — it answers "which public
// documents does the RETIRED-VOCABULARY check apply to". The difference is one file: that module
// classifies CHANGELOG.md as a root public document and then subtracts it, for a reason scoped to
// ITS predicate — the retired vocabulary in a changelog describes what the project used to ship,
// which is what a changelog is for. That reason has NO bearing on a conformance claim, a
// token-economy claim or a comprehension-benefit claim, none of which get truer for being written
// in a historical record. This gate inherited the subtraction anyway, and CHANGELOG.md sat outside
// its scan set carrying two live `token-economy` occurrences while the identical bytes in README.md
// went red. So this gate now names the question it is actually asking, and takes the CORPUS.
import {
  publicDocsCorpus,
  // (Round 7, WR-05) The corpus's DERIVATION-REFUSAL channel. Imported beside the corpus itself
  // because taking the one without the other is exactly the defect: the parts are built at import
  // time, so a refusal is already raised before this gate asks for a single member.
  publicDocsDerivationRefusals,
} from "./check-public-docs-vocabulary.js";
// THE ONE FENCE TOGGLE AND THE ONE SECTION LOCATOR (plans 29-18 and 29-23, WR-06 / WR-08).
// `locateExemptRegion` answers two section-extent questions, and this tree answers both in exactly
// one place. `unfencedHeadingIndex` gives the region's own heading and `sectionEndIndex` gives its
// end; `fencedLineFlags` is taken directly for the exactly-one heading COUNT, which is not a first
// index and therefore is not a question either locator answers. The delimiter class is NOT
// re-declared here, no second state machine is written, and this module now declares no section
// predicate of its own.
import {
  fencedLineFlags,
  unfencedHeadingIndex,
  sectionEndIndex,
} from "./frontmatter.js";
// ── THE CONTENT BOUND ON THE ONE CARVE-OUT (plan 29-52, D-54 / round-6 CR-01) ───────────────────
//
// THE ANCHORED BLOCK IS ASKED OF THE AUTHORITY, NEVER RE-DERIVED HERE. Plan 29-51 moved the anchor
// grammar, the line assembly and the extent-and-byte-identity function into audit-model so both
// gates ask ONE question of ONE implementation. This gate declares no anchor grammar of its own and
// performs no byte comparison of its own; it CONSUMES the verdict `anchoredBlockAt` returns. A copy
// here would be the duplicate-grammar defect this milestone has closed three times.
//
// `readRegistry` THROWS on an unparseable registry and this gate is a GATE, so the call is wrapped
// and the message REPORTED (the kit-model throw-versus-report split, and the WR-05 lesson about a
// refusal raised in an imported module that neither runner reports).
import {
  readRegistry,
  scanAnchoredDocument,
  anchoredBlockAt,
  type ClaimRow,
} from "./audit-model.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. When unset, resolve every
// path against the script-relative repo root (cwd does not matter). The truthiness ternary, not
// `??`: `CHECK_ROOT=""` must degrade to the repo root, exactly as every sibling gate does.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

/** Exported accessor so a later aggregator can fold this gate's verdict without a shared global. */
export const bannedClaimFails = (): number => FAILS;

const MARKDOWN_EXT = ".md";
const KIT_DIR = "agent-factory";
// (Round 6, WR-02) The three classes admitted in this round. Declared as path constants beside
// KIT_DIR so a reader meets the whole reach of this gate in one place.
const INSTALL_README = "install/README.md";
const SKILLS_DIR = "skills";
const CLAUDE_DIR = ".claude";
// (Round 7, CR-02) The fourth class, and the first that is NOT markdown. Declared here with the
// others for the same reason they are: a reader meets the whole reach of this gate in one place.
const PLUGIN_MANIFEST_DIR = ".claude-plugin";
const JSON_EXT = ".json";

// ---------------------------------------------------------------------------
// THE ONE LIST. Three groups, every member a separately pinned literal.
//
// Matching is CASE-INSENSITIVE over the raw file bytes, on both sides — a re-capitalised claim is
// the same claim. The needle is lowercased at the point of use rather than assumed lowercase
// upstream (the 28-REVIEW WR-06 correction), so adding a mixed-case member here cannot silently
// turn this gate into a no-op.
// ---------------------------------------------------------------------------

export type BannedClaimGroup =
  | "standard-name"
  | "token-economy"
  | "comprehension";

/**
 * A member of the one list. A literal and the group it belongs to — and NOTHING ELSE.
 *
 * ------------------------------------------------------------------------------------------------
 * THIS TYPE USED TO CARRY AN OPTIONAL MARKER FIELD, AND ITS REMOVAL IS THE WHOLE OF ROUND 6'S FIX
 * (D-48 extended by D-53). THE HISTORY IS RECORDED HERE BECAUSE A TYPE WITH A FIELD DELETED LOOKS
 * LIKE A TYPE THAT NEVER HAD ONE.
 *
 * A member could declare a list of co-occurrence words, and the matcher then reported the literal
 * ONLY on a line that also carried one of them. The argument was that the discipline's name and the
 * bare comprehension terms are TOPICS a document must be able to discuss in order to deny a claim
 * about them, so what should be pinned is the PAIR — the topic plus a verb that turns it into a
 * claim.
 *
 * THE ARGUMENT IS SOUND AND THE MECHANISM IS NOT, AND THIS REPOSITORY PAID FOR THE DIFFERENCE THREE
 * TIMES. Whatever list of verbs is written down, it is a hand-authored list over an open class:
 *
 *   1. The comprehension group was six fixed substrings. Matching here is plain case-insensitive
 *      substring, so ANY interposed word defeated all six at once. Five of six measured phrasings
 *      exited 0 with the planted file never named.
 *   2. Round 5 replaced the six substrings with a rule conditional on a hand-authored SEVEN-STEM
 *      verb list — the enumeration moved one slot to the left, not away. Five plants defeated it at
 *      exit 0 with the planted file never named: `increases comprehension`, `raises comprehension`,
 *      `gives models sharper comprehension`, `aids comprehension`, and `makes models understand
 *      prose faster`. Not one of those verbs was on the list, and there is no list that contains
 *      all the verbs English has for "makes better".
 *   3. The reviewer's proposed remedy was to pin the SUBJECT side instead — the topic paired with
 *      `controlled language`, `this profile`, `the kit`, `the voice`. REFUSED by D-48, because
 *      subject is an equally open class: `grugops`, `the factory`, `these roles`, a pronoun. It
 *      buys exactly one round.
 *   4. Authoring the round-6 plans then found the identical defect surviving on the group that
 *      gives this gate its name. The discipline's name was gated by a six-stem conformance list, so
 *      `conforms to` yielded one finding while `follows`, `meets`, `adheres to` and `is written in`
 *      each yielded ZERO. Measured against the pre-change committed build, one plant per reset
 *      `git archive HEAD` mirror, 2026-08-17.
 *
 * THE CONCLUSION IS STRUCTURAL, AND IT IS WHY THE FIELD IS GONE FROM THE TYPE RATHER THAN LEFT
 * EMPTY. Every axis a bare term can be paired against is an open class. The only bounded thing in
 * this design is the one named exemption region, and a region is POSITIONAL. So the carve-out
 * became positional and the lexical half was deleted: the terms are unconditional literals, and the
 * honest denial stays writable because it lives inside the region. An emptied marker list would
 * leave the mechanism standing for the next member to reach for, one line at a time; a removed
 * field makes reintroducing one a visible TYPE CHANGE in a diff — and a member that declares one
 * does not compile.
 *
 * WHAT THE GATE'S PREDICATE NOW IS, STATED SO NOTHING HAS TO BE INFERRED: a pinned literal list
 * plus one named exemption region. It enumerates WHAT IS BANNED and nothing about HOW IT IS SAID.
 * The surviving enumeration is the literal list itself, and it is named with its direction at its
 * own declaration below rather than implied away by the shape of a deletion.
 * ------------------------------------------------------------------------------------------------
 */
export interface BannedClaimLiteral {
  readonly literal: string;
  readonly group: BannedClaimGroup;
}

// ---------------------------------------------------------------------------
// WHERE TWO HAND-AUTHORED VERB LISTS USED TO SIT, AND THE MEASUREMENTS THAT OUTLIVE THEM.
//
// Round 6 deleted both (D-48, extended to the second by D-53). The reasoning is at the type above;
// what is kept here is the ARITHMETIC, because both lists were measured over corpora that no longer
// exist and nothing downstream can re-derive them. The full verbatim transcription, with the corpus
// size each was taken over, is in `.planning/.../29-44-SUMMARY.md`.
//
// THE CONFORMANCE-STEM LIST (six substring stems, gating the discipline's name). Measured over the
// then-current derived scan set, the stems hit 60, 18, 2 and 70 lines of entirely correct text
// about compliance regimes, release approvals and ASVS certification requirements. That is 150
// lines, and it is why those stems may never be promoted to banned literals in their own right —
// the refusal survives in `BANNED_CLAIM_EXCLUDED` below with the breakdown intact. What does NOT
// survive is the claim that they are retained as co-occurrence markers: there is no co-occurrence
// mechanism to retain them for.
//
// THE BENEFIT-VERB LIST (seven substring markers, gating the two bare comprehension terms).
// Measured 2026-08-17 over an 82-document / 5898-line derived scan set as the number of LINES
// carrying each marker: 17, 0, 0, 0, 3, 3 and 1 respectively, in declaration order. The zeros were
// recorded as SAFE (a marker that over-matches nothing) and the 17 as the reason its stem could
// never be a literal. Both readings were true and neither was the problem: the problem was that a
// verb the list did not contain defeated the whole rule, which five plants proved at exit 0.
//
// NEITHER LIST IS REPLACED. A third list on a third axis was proposed and refused; see the type.
// ---------------------------------------------------------------------------

/**
 * THE ONE ENUMERATION THAT SURVIVES ROUND 6, STATED WITH ITS DIRECTION RATHER THAN IMPLIED AWAY.
 *
 * ------------------------------------------------------------------------------------------------
 * A ROUND THAT CLOSES A DEFECT BY DELETION IS THE ROUND MOST LIKELY TO BE READ AS HAVING CLOSED THE
 * CLASS, SO THIS IS WRITTEN OUT INSTEAD OF LEFT TO INFERENCE.
 *
 * Round 6 deleted two hand-authored verb lists and the mechanism that consulted them, because every
 * axis a bare term can be paired against — verb, phrase, subject — is an open class. What remains is
 * a PINNED LITERAL LIST plus one named exemption region, and THIS LIST IS ITSELF AN ENUMERATION. It
 * is the enumeration of WHAT IS BANNED, which is the prohibition's own subject and cannot be derived
 * away: a prohibition with nothing enumerated forbids nothing.
 *
 * MEMBERS: 22, across 3 groups. The count is published on every green run and pinned by a case.
 *
 * DIRECTION: FAIL-OPEN, and the consequence stated plainly. A conformance, token-economy or
 * comprehension claim written in words this list does not contain PASSES THIS GATE. The gate proves
 * that no pinned literal appears outside the one named exemption region. It does NOT prove that no
 * such claim can be written, and no round has ever proved that.
 *
 * WHAT CHANGED IS WHICH KIND OF LIST IS LOAD-BEARING, AND THE DIFFERENCE IS THE POINT. A list of
 * VERBS was a list over how a claim is SAID, and any unlisted synonym defeated it — measured five
 * times on the comprehension group and four times on the standard's name. A list of BANNED SUBJECTS
 * is a list over WHAT IS FORBIDDEN, and adding to it is an act of deciding one more thing is
 * forbidden. The first kind of list has a wrong length and no correct one; the second has whatever
 * length this project has decided on, recorded with the measurement that admitted each member and
 * the admission log's record of every candidate refused.
 *
 * Cross-referenced in docs/audit/29-round5-residuals.md's register, so the source and the record
 * point at each other.
 * ------------------------------------------------------------------------------------------------
 */
export const BANNED_CLAIM_LITERALS: readonly BannedClaimLiteral[] = [
  // ── Group 1: the standard's name and its spelling variants ──────────────────────────────────
  // Measured over the scan set at admission time: 0 hits each. The kit named this standard in ZERO
  // files before this phase, which is exactly why the D-44 draft claim had to be planted.
  { literal: "ASD-STE100", group: "standard-name" },
  { literal: "ASD-STE 100", group: "standard-name" },
  { literal: "ASD STE100", group: "standard-name" },
  { literal: "ASD STE 100", group: "standard-name" },
  { literal: "ASDSTE100", group: "standard-name" },
  { literal: "STE-100", group: "standard-name" },
  // ── THE DISCIPLINE'S NAME, NOW UNCONDITIONAL (round 6, D-53) ────────────────────────────────
  //
  // WHAT THIS MEMBER USED TO BE, AND WHY IT STOPPED BEING IT. The name of an entire discipline is
  // not a claim, so this member used to fire only beside a conformance verb drawn from a six-stem
  // hand-authored list. Measured against the pre-change committed build on a `git archive HEAD`
  // mirror, one plant per reset mirror, 2026-08-17, planting the name into a governed workflow
  // document: `conforms to` produced ONE finding named at file:line:column, while `follows`,
  // `meets`, `adheres to` and `is written in` each produced ZERO with the planted file never
  // mentioned in the output at all. Four ordinary English conformance verbs defeated the member
  // that gives this gate its name.
  //
  // AND THE FIX WAS FREE ON THIS REPOSITORY'S OWN ARITHMETIC, WHICH IS WHY IT LANDED IN THE SAME
  // ROUND RATHER THAN THE NEXT ONE. Re-derived through this module's own counter over the
  // 115-document corpus and independently re-taken with `grep -a -i` over the same derived path
  // list, the two agreeing: the name occurs on exactly TWO lines, `agent-factory/writing-profile.md`
  // :239 and :241, and BOTH are inside the one named exemption region — the non-affiliation
  // disclaimer, which names the standard in order to deny it. Making the member unconditional
  // therefore costs ZERO findings on correct kit text. It does MOVE the exemption's suppressed
  // count, because those two lines begin matching; that movement is derived from the gate's own
  // refusal text at the pin below, never predicted into it.
  //
  // THE HONEST DENIAL IS STILL WRITABLE, AND THE CARVE-OUT IS NOW POSITIONAL RATHER THAN LEXICAL.
  // A document that needs to name this discipline in order to deny conforming to it writes that
  // sentence inside the exemption region, which is bounded, named and pinned two-sided. It no
  // longer depends on somebody having thought of the verb.
  { literal: "Simplified Technical English", group: "standard-name" },

  // ── Group 2: the token-economy win claim ────────────────────────────────────────────────────
  // `token-economy` hit ONCE at admission time, in agent-factory/workflows/18-context-compaction.md,
  // on the claim that the caveman voice is a token economy applied to memory. That is not correct
  // text being deleted to reach green — it is the disproven claim this gate exists to hold. Project
  // measurement (2026-07-28) found the fenced blocks RESTATE rather than compress. The sentence was
  // corrected in the same plan that landed this gate.
  { literal: "token economy", group: "token-economy" },
  { literal: "token-economy", group: "token-economy" },
  { literal: "fewer tokens", group: "token-economy" },
  { literal: "token savings", group: "token-economy" },
  { literal: "saves tokens", group: "token-economy" },
  { literal: "reduces token count", group: "token-economy" },
  { literal: "lowers token count", group: "token-economy" },

  // ── Group 3: the comprehension-benefit claim ────────────────────────────────────────────────
  // 0 hits each at admission time. No published evidence that controlled language improves
  // comprehension for a language model was located in either direction, so the kit must not ship
  // the claim.
  { literal: "improves comprehension", group: "comprehension" },
  { literal: "improve comprehension", group: "comprehension" },
  { literal: "comprehension benefit", group: "comprehension" },
  { literal: "easier for the model to understand", group: "comprehension" },
  { literal: "easier for a language model to understand", group: "comprehension" },
  { literal: "better understood by the model", group: "comprehension" },
  // ── THE BARE TERM, NOW UNCONDITIONAL: THE ENUMERATION DELETED RATHER THAN MOVED AGAIN ────────
  //
  // FOUR STAGES, IN ORDER, BECAUSE THE THIRD ONE LOOKED LIKE THE FIX.
  //
  //   1. This group was SIX FIXED SUBSTRINGS and nothing else. Matching here is plain
  //      case-insensitive substring, so any INTERPOSED WORD defeated all six at once: five of the
  //      six phrasings the UAT enumerated exited 0 with the planted file never named.
  //   2. Appending those five phrasings was measured and REFUSED — it closes the spellings somebody
  //      happened to write down and leaves the next interposed word green. That refusal stands and
  //      is recorded in the admission log below with the number that made it.
  //   3. Round 5 replaced the enumeration with a RULE conditional on a hand-authored seven-stem
  //      benefit-verb list. That relocated the enumeration from the PHRASE slot to the VERB slot;
  //      it did not delete it. Five plants defeated it at exit 0 with the planted file never named
  //      anywhere in the output: `increases comprehension`, `raises comprehension`, `gives models
  //      sharper comprehension`, `aids comprehension`, and `makes models understand prose faster`.
  //   4. Round 6 DELETED the conditional half instead of moving it a third time. The reviewer's
  //      proposal — pin the SUBJECT side — was considered and refused: subject is an equally open
  //      class, so it buys one round. Every axis a bare term can be paired against is open. The only
  //      bounded thing in this design is the one named exemption region, and a region is POSITIONAL.
  //
  // AND HERE IS WHAT IS STILL NOT PROVED, STATED WITHOUT HEDGING, BECAUSE THE SENTENCE ABOVE ABOUT
  // "a guard that holds a prohibition rather than the spellings somebody thought of" IS FINALLY TRUE
  // OF THIS CODE AND WAS NOT TRUE WHEN IT WAS FIRST WRITTEN. It became true by DELETION of the axis
  // it had been moved to, in round 6 — not by having been right all along in round 5, which shipped
  // that sentence about the very list it was shipping. A comprehension, conformance or
  // token-economy claim written WITHOUT ANY PINNED LITERAL still passes this gate. What the gate
  // proves is exactly what the module header claims and no more: no pinned literal appears outside
  // the one named exemption region. The surviving enumeration is named with its member count and its
  // direction at the list's own declaration above.
  //
  // THE ADMISSION COST, DERIVED BEFORE THE CHANGE AND THROUGH THIS MODULE'S OWN COUNTER. Over the
  // 115-document corpus, independently re-taken with `grep -a -i` over the same derived path list
  // and the two agreeing: this term occurs on exactly TWO lines,
  // `agent-factory/writing-profile.md:256` and `:288`, and BOTH are inside the one named exemption
  // region. Making it unconditional therefore produces ZERO new findings. The honest denial is still
  // writable — it is written where the carve-out is.
  //
  // THE SIX ENUMERATED LITERALS ABOVE STAY, AND DELETING THEM WOULD BE A FALSE GREEN. Two reasons,
  // both arithmetic rather than editorial. (1) They carry part of the exemption's suppressed
  // arithmetic: each denial line matches an enumerated literal AS WELL AS this term, so deleting
  // them would move `BANNED_CLAIM_EXEMPT_SUPPRESSED` by deleting what that pin measures — moving a
  // pin by removing its subject, which is the one route to green this file exists to refuse. (2)
  // This term does not subsume them: `easier for the model to understand`, `easier for a language
  // model to understand` and `better understood by the model` carry no occurrence of it at all.
  //
  // THREE RESIDUALS HAD THEIR SUBJECT REMOVED BY THIS DELETION, AND THAT IS RECORDED RATHER THAN
  // LEFT AS A SILENT DISAPPEARANCE. `V-29-42-01`, `V-29-42-02` and `V-29-42-04` in
  // docs/audit/29-round5-residuals.md all describe the CO-OCCURRENCE WINDOW: a claim whose bare term
  // and whose verb are separated by a hard wrap, by a table-cell boundary, or by an HTML comment,
  // each measured at 0 live. There is no co-occurrence window any more, so all three are moot by
  // construction rather than closed by an argument. The line-oriented residual this module's header
  // records for EVERY literal is unaffected and still stands.
  { literal: "comprehension", group: "comprehension" },
  // ── THE SECOND BARE TERM, NOW UNCONDITIONAL, AND THE ONE REAL COST OF THE DELETION ───────────
  //
  // WHY A SECOND TERM EXISTS AT ALL, STATED AS A FINDING AGAINST THE ROUND-5 PROTOTYPE RATHER THAN
  // AS A DESIGN CHOICE. `29-UAT.md` § G-29-2's `measured_probe` records that under a bare
  // `comprehension` member "ALL FIVE bypass sentences red". Reproduced against the committed `.js`
  // on a `git archive HEAD` mirror, one plant at a time, that claim is FALSE for one member of the
  // family: `...makes prose easier for LLMs to understand.` carries NO OCCURRENCE of the first term
  // at all, so no predicate over it can reach that sentence whatever it is conditioned on. A member
  // outside a predicate BY CONSTRUCTION cannot be closed by tuning that predicate.
  //
  // AND THE REMEDY IS A SECOND TERM, NOT A PHRASING. Appending `easier for LLMs to understand` would
  // close that spelling and leave `easier for agents to understand` open — option (b), refused in the
  // admission log below. This term is the CONCEPT the claim is about.
  //
  // THE ADMISSION COST, RE-DERIVED THROUGH THIS MODULE'S OWN COUNTER OVER THE 115-DOCUMENT CORPUS,
  // AND IT IS THE ONE PLACE THE DELETION ACTUALLY COSTS SOMETHING:
  //
  //   occurrences of the term across the derived scan set   : 1
  //   of those, inside the one named exemption region       : 0
  //   therefore new findings when made unconditional        : 1
  //
  // Independently re-taken with `grep -a -i` over the same derived path list; the two agree. The
  // single occurrence was `agent-factory/roles/incident-responder.md:29`, correct operational text
  // making no claim of any kind. Under the round-5 rule it carried no admitted verb and so produced
  // nothing; unconditional, it reds. THAT RED WAS CAPTURED FROM THE LIVE TREE AS A TRANSCRIPT BEFORE
  // ANYTHING WAS REPHRASED, and it is this change's acceptance evidence: the widened prohibition has
  // teeth against text nobody planted.
  //
  // AND IT WAS PAID IN PROSE, NEVER IN THE MATCHER. The sentence was rephrased so the operational
  // instruction survives intact and no narrower. The three weakenings that would each have made the
  // original line pass are named and forbidden in the exemption region's forbidden-alternative
  // paragraph below: no fenced-block skip, no whole-word-only match, no below-a-marker skip.
  //
  // ── `V-29-44-01`: THIS TERM IS A FALSE-RED SURFACE OVER THE WHOLE OF ORDINARY ENGLISH ─────────
  //
  // DIRECTION: FAIL-CLOSED. The gate over-reports here; nothing is hidden by it. That is the safe
  // direction and it is still a cost somebody pays, so it is named with a number rather than left
  // for the next author to discover as a surprise.
  //
  // THE REACH IS THE WHOLE TERM NOW, NOT A MARKER-GATED SLICE OF IT, AND THE DELETION IS WHAT
  // WIDENED IT. Matching is plain case-insensitive substring, so this member also reaches the
  // third-person form, the gerund and the negated form. Until round 6 the term only reported beside
  // an admitted verb, which is why one live occurrence cost nothing; unconditional, ANY sentence
  // about a human reader's grasp of anything reds — "the board helps a new joiner understand the
  // state" makes no claim about a language model and would be a finding.
  //
  // LIVE COUNT: 0, re-derived over the current 115-document corpus through this module's own
  // counter after the one occurrence was rephrased, and independently re-taken with `grep -a -i`
  // over the same derived path list; the two agree.
  //
  // THE REMEDY, WHICH IS THE SAME ONE THAT WAS APPLIED: rephrase the sentence, or admit a narrower
  // term with its own measurement. NEVER weaken the matcher. Recorded in
  // docs/audit/29-round5-residuals.md's register alongside the round-5 ids, so source and register
  // point at each other rather than at nothing.
  { literal: "understand", group: "comprehension" },
];

/**
 * WHAT A `hits` FIELD CARRIES WHEN THE CANDIDATE WAS REFUSED WITHOUT EVER BEING MEASURED.
 *
 * (Round 6, plan 29-45 — IN-01.) One entry below was refused on arithmetic rather than on a count:
 * `ste` is a substring of `system`, so nobody ran the scan. That entry used to carry a MAGIC
 * NEGATIVE in a field whose whole contract is "the measurement that rejected this candidate" — a
 * count field silently meaning "not a count". This module refuses that conflation everywhere else,
 * and a `-1` in a field typed `number` defeats every assertion an author would naturally write over
 * it: `>= 0` is false for a legitimate entry, and `is a number` is true for the sentinel.
 *
 * SO THE DISTINCTION IS IN THE TYPE, NOT IN THE VALUE. `hits` is `number | typeof
 * BANNED_CLAIM_UNMEASURED`, so a reader of the type meets both cases, `tsc` forces every consumer
 * to handle them apart, and the admission-log case can assert the contract exactly: every entry is
 * either this value or a NON-NEGATIVE count, with nothing in between.
 *
 * IT IS NOT A LICENCE TO SKIP MEASUREMENT. A candidate refused without a measurement is refused on
 * an argument, and the argument goes in `reason` where a reader can check it.
 */
export const BANNED_CLAIM_UNMEASURED = "refused-without-measurement" as const;

/**
 * THE ADMISSION LOG — candidates measured and REJECTED, with the hit count that rejected them.
 *
 * Recorded here rather than dropped silently, because an absent literal reads to the next editor as
 * an oversight worth fixing. Each of these would have gone red on text this project keeps on
 * purpose, and the only route back to green would have been deleting correct text.
 *
 * `hits` admits `BANNED_CLAIM_UNMEASURED` for the one entry refused without a scan — see that
 * constant's declaration above for why the sentinel is in the TYPE and not in the value.
 */
export const BANNED_CLAIM_EXCLUDED: readonly {
  readonly candidate: string;
  readonly hits: number | typeof BANNED_CLAIM_UNMEASURED;
  readonly reason: string;
}[] = [
  {
    candidate: "token count",
    hits: 0,
    reason:
      "zero hits today, but the honest hedge this project actually needs to be able to write is " +
      '"its effect on token count is UNKNOWN - verify in both directions". Banning the topic would ' +
      "make the honest sentence unsayable and leave only the claim-shaped alternatives",
  },
  {
    candidate: "token win",
    hits: 1,
    reason:
      "hits agent-factory/workflows/18-context-compaction.md's `aggressive` dial — \"Maximum token " +
      'win" — which is TRUE and is not a controlled-language claim at all: the dial transmits the ' +
      "compact gist instead of the raw trajectory, so it genuinely sends less text",
  },
  {
    candidate: "conformance / compliant / certified / endorsed / approved, as bare literals",
    hits: 150,
    reason:
      "60 + 18 + 2 + 70 hits across compliance-regime documentation, ASVS certification rows, " +
      "release-approval steps and the README's own non-affiliation disclaimer. THAT MEASUREMENT IS " +
      "STILL TRUE AND IS WHY THESE STEMS MAY NEVER BE PROMOTED TO LITERALS: each would report a " +
      "finding on scores of lines of entirely correct text, and the only route back to green would " +
      "be deleting it. WHAT THIS ENTRY USED TO ADD, AND WHICH ROUND 6 MADE FALSE IN BOTH HALVES: " +
      "that the stems survive as co-occurrence markers, and for exactly one conditional member. " +
      "There are no conditional members and no co-occurrence mechanism — both were deleted (D-48, " +
      "D-53), because a hand-authored verb list is a list over an open class and four ordinary " +
      "conformance verbs outside this one yielded ZERO findings against the pre-change build. The " +
      "stems are refused as literals on the count above and are retained for nothing; the number " +
      "outlives the construct, which is why this entry is corrected rather than deleted",
  },
  {
    candidate: "comprehension, as an UNCONDITIONAL literal",
    hits: 2,
    reason:
      "both hits are the honest DENIALS in agent-factory/writing-profile.md (256, 288) — \"No " +
      'comprehension benefit is claimed" and "There is no evidence that controlled language improves ' +
      'comprehension for a language model". That count refused it as an unconditional literal in plan ' +
      "29-41 and it is kept because it is the record. THE VERDICT WAS OVERTURNED IN ROUND 6 AND THE " +
      "MEMBER IS NOW UNCONDITIONAL. Re-measured through this module's own counter over the " +
      "115-document corpus and independently re-taken by grep, the two agreeing: 2 occurrences, BOTH " +
      "INSIDE the one named exemption region, so 0 new findings. The occurrences that made " +
      "unconditional look expensive were always inside the carve-out; what changed is that the " +
      "carve-out is now the whole of the mechanism instead of half of it. The topic stays writable " +
      "POSITIONALLY — the denial is written where the region is — rather than lexically",
  },
  {
    candidate: "understand, as an UNCONDITIONAL literal",
    hits: 1,
    reason:
      "hit ONE line of correct operational text in agent-factory/roles/incident-responder.md, " +
      "making no claim of any kind, so going green in plan 29-41 would have meant deleting it. That " +
      "count is kept because it is the record. THE VERDICT WAS OVERTURNED IN ROUND 6 AND THE MEMBER " +
      "IS NOW UNCONDITIONAL — BY REPHRASING THE TEXT, NEVER BY WEAKENING THE MATCHER, so a reader " +
      "does not read the reversal as a relaxation. The widened term reddened that line on the LIVE " +
      "TREE and the transcript is this change's acceptance evidence; the sentence was then rewritten " +
      "to state the temporal precondition as the act the step defers, with the instruction unchanged " +
      "in force and scope, and dispositioned under D-04. Re-measured after the rephrase through this " +
      "module's own counter over the 115-document corpus and independently by grep, the two " +
      "agreeing: 0 occurrences. The residual the widening opens is carried as `V-29-44-01` at the " +
      "member's declaration, fail-closed, 0 live",
  },
  {
    candidate: "to understand, as the narrower second bare term",
    hits: 0,
    reason:
      "zero hits, and it WOULD close the measured family member `...easier for LLMs to understand` — " +
      "so it was refused on generality rather than on cost. It pins the INFINITIVE GRAMMAR of the one " +
      "sentence somebody happened to write, leaving `the model understands it better` green, which is " +
      "the append-a-phrasing shape user decision (c) rejected. `understand` was admitted instead. " +
      "Recorded because a reader comparing the two would otherwise read the wider term as careless",
  },
  {
    candidate:
      "appending further fixed phrasings to the comprehension group — user decision option (b)",
    hits: 0,
    reason:
      "THE REJECTED REMEDY, RECORDED WITH THE NUMBER THAT REJECTED IT, because an absent literal " +
      "reads to the next editor as an oversight worth fixing and this is the fix that must NOT be " +
      "made. Measured 2026-08-17 over the 82-document derived scan set (5898 lines): appending the " +
      "measured family's phrasings gains ZERO findings and moves BANNED_CLAIM_EXEMPT_SUPPRESSED by " +
      "ZERO, so it was refused on MECHANISM and not on cost. The mechanism: matching here is plain " +
      "case-insensitive substring, so ANY interposed word defeats a fixed phrasing and each phrasing " +
      "added closes exactly itself. 29-UAT.md § G-29-2 states the consequence — option (b) \"closes " +
      'only the phrasings enumerated and leaves `improves agent comprehension` and `boosts ' +
      'comprehension for language models` green". User decision (c) replaced the enumeration with a ' +
      "RULE, and round 6 then deleted the rule's conditional half rather than move its enumeration a " +
      "third time; the two bare terms above are unconditional literals now. WHAT AN ASSERTION " +
      "ACTUALLY HOLDS, STATED NARROWLY BECAUSE THIS SENTENCE USED TO CLAIM MORE: " +
      "check-banned-claims.test.ts pins the enumerated-comprehension count two-sided at 6, so " +
      "APPENDING A PHRASING to that group reds by name. That pin holds the PHRASE list's cardinality " +
      "and says nothing about any other axis — it never did. What closes the axis an appended " +
      "phrasing would have exploited is not an assertion at all: the conditional half of this group " +
      "is DELETED, so there is no verb, phrase or subject list left to append to",
  },
  {
    candidate: "STE, as a bare literal",
    hits: BANNED_CLAIM_UNMEASURED,
    reason:
      "REFUSED WITHOUT MEASUREMENT, and the reason is arithmetic rather than editorial: `ste` is a " +
      "substring of `system`. A case-insensitive substring test on it would report a finding on " +
      "every occurrence of the most common noun in this repository. Recorded so it is not " +
      "rediscovered as an obvious omission",
  },
];

// ---------------------------------------------------------------------------
// THE ONE NAMED EXEMPTION REGION — a file, a section, and a reason.
//
// The disclaimer must be able to NAME the standard in order to deny affiliation with it, and to
// QUOTE a claim form in order to say the kit does not make it. A prohibition that made its own
// denial illegal would be unwritable.
//
// THE BOUND: this exempts one section of one file and nothing else. It is asserted TWO-SIDED at run
// time — exactly one region must exist and it must be non-empty. A VANISHED region would silently
// make the disclaimer illegal and red the build on correct text; a DUPLICATED region would widen
// the hole by adding a second heading. Both are FAILs.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: loosening the match so
// the disclaimer passes — skipping fenced blocks, skipping lines below some marker, matching only
// whole words — would delete the check for every other document to accommodate one section. If a
// second region ever earns an exemption, the answer is a second named triple with its own reason,
// never a weaker predicate.
// ---------------------------------------------------------------------------
export const BANNED_CLAIM_EXEMPT_REGION = {
  file: "agent-factory/writing-profile.md",
  heading: "## Disclaimer and honesty floor",
  reason:
    "the disclaimer must be able to name the standard, and to quote a claim form, in order to deny " +
    "both — a prohibition that makes its own denial illegal is unwritable",
} as const;

// ---------------------------------------------------------------------------
// docs/ IS EXCLUDED BY NAME, WITH ITS REASON, RATHER THAN BY SILENT OMISSION.
//
// docs/initial/ holds the historical specification, docs/catalog/ is generated, and docs/audit/
// holds the disposition register, the claim registry and the safety-surface list. Those are RECORDS
// OF WHAT WAS DECIDED, not claims the kit makes — and the claim registry in particular quotes
// public sentences verbatim by design, so scanning it would report the registry for holding the
// text it exists to hold. The same argument covers .planning/, which is the planning record and is
// archived at milestone close.
//
// ── THE STRUCTURAL CLAIM THAT USED TO STAND HERE IS REPLACED, NOT QUALIFIED (round 7, WR-01) ──
//
// It read: the parts below simply never reach docs/, so the exclusion is structural. That was true
// of the two-part corpus and STOPPED BEING TRUE the moment round 6 admitted .claude/ as a recursive
// disk walk — the exclusions were prefix tests on a derived RELATIVE PATH, and a nested copy of an
// excluded directory does not carry its prefix. The round-6 reviewer planted two files under
// `.claude/worktrees/phase-30/` (a directory this project's own execution tooling creates, inside a
// walked directory) and the gate reported findings on a claim-registry copy and on a planning
// document — verbatim the harm the paragraph above says this exclusion prevents.
//
// WHAT IS TRUE NOW: the guarantee is ENFORCED AT THE POINT OF EFFECT — `walkFiles` refuses to
// DESCEND into a directory whose own name is a SEGMENT-class entry of the list below, at any depth.
// The prefix reading remains the COVERAGE question's rule. The two are projections of ONE list.
// The transient checkout that made the old claim false is recorded here as a measured fact and is
// NOT named as a permanent exemption: it is a local checkout, not a class this repository ships.
//
// scripts/ IS EXCLUDED FOR A DIFFERENT AND STRONGER REASON: this module declares every banned
// literal, so scanning scripts/ would report the authority for holding the text it exists to hold.
// The cost is named rather than left implicit — a claim typed into a GENERATOR's own source is not
// read here. That cost is why .claude/ was ADMITTED in round 6 rather than excluded as
// "transitively covered": the generated output is where a generator-authored claim becomes
// readable, and the two freshness gates make the output a faithful build of its source.
//
// ── THE REMAINING CLASSES, DISPOSITIONED BY NAME (round 6, WR-02) ────────────────────────────
//
// DERIVED, NOT ADOPTED. The round-5 review enumerated four classes; the remainder was re-derived
// with `git ls-files '*.md'` minus `bannedClaimScan()` and disagreed with it twice, so both numbers
// below are this repository's rather than the review's:
//
//   memory-bank/  9 files  — the review said 9, a session measurement said 8. Derived: 9.
//   plans/        4 files  — the review said `plans/board.md`, 1 file. Derived: 4. board.md,
//                            metrics.md, nfr-catalog.md and traceability.md.
//   skills/       7 files  — named in NO round-5 finding. Found only by deriving the remainder,
//                            and ADMITTED above rather than listed here.
//
// memory-bank/ and plans/ are grugops's own RUNTIME DOGFOOD STATE, and D-16's build-time/runtime
// surface split places them outside a build-time gate over kit files. The kit tells a host repo to
// create both directories and then writes into them: plans/board.md is the visible board,
// plans/metrics.md, plans/nfr-catalog.md and plans/traceability.md are the trail the roles emit, and
// memory-bank/ is the project brief, product, architecture, contributing, progress, runbook and
// glossary prose a factory run maintains. They are the OUTPUT of using grugops, not part of what
// grugops ships — the same distinction that keeps .planning/ out. Measured with this gate's own
// matcher before the exclusion was written: 0 live occurrences across all 13 files.
//
// THE REMEDY IF THAT ARGUMENT EVER STOPS HOLDING, so the next reader is not left to invent one:
// they enter as a DERIVED PART with their own disk walk, their own vacuity floor and
// BANNED_CLAIM_SCAN_COUNT moved in the same commit — exactly as install/README.md, skills/ and
// .claude/ did in this round. Never as an ad hoc filename appended to somebody else's part.
//
// AND THE ENUMERATION IS HELD BY AN ASSERTION RATHER THAN BY THIS PARAGRAPH. A case in
// scripts/check-banned-claims.test.ts derives the tracked TEXT SURFACE, subtracts the scan, and
// requires every remaining path to be covered by an entry of this array. A class added tomorrow
// reds on the day it lands instead of surfacing as a finding four rounds later — which is how this
// block came to need rewriting.
//
// ══ THE CLASS BOUNDARY, DECLARED (round 7, CR-02) ════════════════════════════════════════════
//
// THE DENOMINATOR WAS THE FINDING. Round 6 dispositioned every unscanned class BY NAME — and its
// coverage case's denominator was `git ls-files '*.md'`. So every class it could possibly surface
// was a MARKDOWN class, and the markdown boundary itself was never a decision anybody made: it was
// the SHAPE OF A DENOMINATOR. The module dispositioned exactly one non-markdown path
// (.claude/settings.local.json, at its own derivation below) and said nothing about the boundary.
// Meanwhile `.claude-plugin/marketplace.json`'s `description` is the exact string a user meets
// running `/plugin marketplace add`, `.claude-plugin/plugin.json`'s is shown in the plugin manager,
// and docs/audit's own register already names plugin.json as a claim-bearing file. Both shipped.
// Neither was read by any gate. A three-finding string in any .md of the corpus exited 0, unnamed,
// on all seven.
//
// WHAT THIS GATE SCANS, STATED AS A CLASS RATHER THAN LEFT AS A SHAPE: the kit's hand-authored and
// generated MARKDOWN, plus the kit's SHIPPED JSON MANIFESTS. The rule that admits a surface is not
// its extension — it is whether the bytes SHIP AND MAKE A CLAIM A READER MEETS.
//
// AND EVERY TRACKED NON-MARKDOWN SURFACE IS DISPOSITIONED BY NAME. Derived, not adopted:
// `git ls-files '*.json'` minus the entries already covered above leaves exactly these, each named
// here with its reason (the derivation and its output are recorded in 29-53-SUMMARY.md):
//
//   .claude-plugin/plugin.json        ADMITTED — the sixth part below. Shipped; carries a claim.
//   .claude-plugin/marketplace.json   ADMITTED — the sixth part below. Shipped; carries a claim.
//   package.json, package-lock.json   TOOLCHAIN MANIFESTS. Dependency and script data consumed by
//   tsconfig.json, tsconfig.tests.json   npm and tsc. They ship to nobody and make no claim; their
//                                     free-text fields are names and versions.
//   .gemini/settings.json             TOOL CONFIGURATION. Adapter wiring for one host CLI.
//   hooks/hooks.json                  TOOL CONFIGURATION. The Claude Code hook wiring.
//   agent-factory/config/factory.config.json          KIT CONFIGURATION DATA. The dial. Keys and
//   agent-factory/seed/.grugops/factory.config.json   enum values, not prose a reader meets.
//   .planning/**, scripts/**          Already covered by the segment classes above.
//
// (.claude/settings.local.json is UNTRACKED and therefore outside the denominator entirely; the
// paragraph at `claudeAdapterMarkdown` explains the ASD-STE100 string a grep finds inside it.)
//
// ── THE LIST'S RULE, STATED PLAINLY, AND ITS THREE KINDS ─────────────────────────────────────
//
// ONE LIST. An entry's SYNTAX declares how it is anchored, so a reader sees the anchoring in the
// entry itself rather than having to find the predicate that consumes it:
//
//   `**/name/`   SEGMENT CLASS   — a directory called `name` is excluded AT ANY DEPTH. This is the
//                                  projection applied at the WALK, and it is what closes WR-01.
//   `name/`      ROOT DIRECTORY  — the root-relative directory `name/` and everything under it.
//                                  NOT projected to a segment. See the paragraph below; this
//                                  distinction is load-bearing and was nearly shipped wrong.
//   `a/b.json`   EXACT PATH      — that one root-relative path.
//
// The three kinds PARTITION the list: every entry falls in exactly one, and their cardinalities are
// asserted two-sided against the list's length, so an entry belonging to none could not sit here
// contributing to neither the walk nor the coverage answer — which is the same silence this block
// exists to prevent, moved somewhere new.
//
// ── WHY `memory-bank/` AND `plans/` ARE ROOT-ANCHORED AND NOT SEGMENT CLASSES ────────────────
//
// THE ROUND-6 REVIEW'S SUGGESTED FIX WAS A SET OF BARE SEGMENT NAMES INCLUDING `memory-bank` AND
// `plans`, AND IT IS WRONG. Measured on this tree before the change: `agent-factory/seed/plans/`
// and `agent-factory/seed/memory-bank/` hold 13 markdown files that are SCAN MEMBERS TODAY — the
// board, metrics, nfr-catalog and traceability templates, and the nine memory-bank templates the
// kit SHIPS for a host repo to copy. A segment projection over those two names would have deleted
// thirteen shipped documents from a safety scan inside the fix for a fail-open.
//
// The names mean DIFFERENT THINGS at different depths, which is exactly why the anchoring has to be
// per entry: at the ROOT, `plans/` and `memory-bank/` are grugops's own runtime dogfood state (the
// OUTPUT of using grugops, per D-16's build-time/runtime split); inside the kit they are the
// TEMPLATE grugops ships. `docs/`, `.planning/` and `scripts/` carry their reason wherever they
// appear — a copy of the record directory is a record directory, and a copy of this module's own
// source is still the authority that declares the literals — so those three, and only those three,
// are segment classes. A permanent case asserts that no member of the live scan contains a
// segment-class name below its root, so the day the kit ships an `agent-factory/**/docs/` this
// reds rather than silently dropping it.
//
// -- THE TRACKED-SET MEMBERSHIP RULE WAS CONSIDERED AND IS REJECTED, WITH ITS REASON ----------
//
// The round-6 review's second half asked for membership to be DERIVED FROM THE TRACKED SET rather
// than from the disk -- `git ls-files` instead of a walk. Recorded here, where a reader meets the
// walk and would reasonably wonder, rather than left for the next reviewer to re-propose.
//
// IT WOULD BREAK THE HARNESS THAT MAKES THIS GATE'S CLAIMS REPRODUCIBLE. Every behavioural case
// this gate owns runs against a HERMETIC MIRROR -- a synthesized tree, or a `git archive HEAD`
// export, driven through the committed .js via CHECK_ROOT. A mirror is NOT a git repository, so a
// git-derived membership rule would return nothing there and every one of those cases would
// evaporate into a vacuous pass. The only way to keep them is a FALLBACK to a walk when git is
// unavailable -- and a fallback is a SECOND MEMBERSHIP RULE, which is the defect class this whole
// phase has been unpicking. One rule, or two rules that will disagree; there is no third option.
//
// THE TRACKED QUESTION IS ASKED WHERE IT BELONGS: in the coverage case in
// scripts/check-banned-claims.test.ts, which runs IN THE REPOSITORY and therefore can ask git. It
// asks BOTH directions -- tracked minus scan is covered by an entry of this list (nothing this
// repository versions is unaccounted for), and every scan member is tracked (nothing
// unaccounted-for is being scanned as though it were). The second direction is what NAMES an
// intruder, and it is the direction WR-01's nested plant walked straight through.
//
// AND THE SIBLING THAT DOES DERIVE FROM TRACKED PATHS IS CORRECT TO. scripts/check-nul-bytes.ts
// takes `git ls-files` as its set, and the difference is not an inconsistency: its subject IS the
// tracked set (no TRACKED file carries a forbidden control byte), it has no mirror harness, and it
// guards a property of the REPOSITORY. This gate's subject is what the kit SHIPS, which is a
// question about a tree and not about an index.
// ---------------------------------------------------------------------------
export const BANNED_CLAIM_EXCLUDED_LOCATIONS: readonly string[] = [
  // SEGMENT CLASSES — excluded at any depth, enforced at the walk.
  "**/docs/",
  "**/.planning/",
  "**/scripts/",
  // ROOT DIRECTORIES — excluded at the root only, for the reasons above.
  ".gemini/",
  "memory-bank/",
  "plans/",
  // EXACT PATHS — the tracked non-markdown surfaces dispositioned by name above.
  "agent-factory/config/factory.config.json",
  "agent-factory/seed/.grugops/factory.config.json",
  "hooks/hooks.json",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
  "tsconfig.tests.json",
];

// The SEGMENT-class projection: entries written with the any-depth marker, reduced to the bare
// directory name. This is the projection applied at the walk.
export function bannedClaimExcludedSegments(): string[] {
  return BANNED_CLAIM_EXCLUDED_LOCATIONS.filter(
    (e) => e.startsWith("**/") && e.endsWith("/"),
  ).map((e) => e.slice(3, -1));
}

/** The ROOT-DIRECTORY projection: entries written `name/`, kept whole. Root-relative prefixes. */
export function bannedClaimExcludedRootDirs(): string[] {
  return BANNED_CLAIM_EXCLUDED_LOCATIONS.filter(
    (e) => !e.startsWith("**/") && e.endsWith("/"),
  );
}

/** The EXACT-PATH projection: entries with no trailing separator. */
export function bannedClaimExcludedExactPaths(): string[] {
  return BANNED_CLAIM_EXCLUDED_LOCATIONS.filter((e) => !e.endsWith("/"));
}

/**
 * Is this root-relative path covered by an entry of the one list? The COVERAGE question's rule, and
 * the only place the three projections are read together — so the coverage case and the walk cannot
 * come to disagree about what an entry means.
 */
export function bannedClaimExcluded(rel: string): boolean {
  return BANNED_CLAIM_EXCLUDED_LOCATIONS.some((e) =>
    bannedClaimExcludedBy(rel, e),
  );
}

/**
 * Does THIS ONE ENTRY cover this path? The per-entry form, and the ONE place an entry's syntax is
 * interpreted — `bannedClaimExcluded` folds it, the walk asks its segment projection, and the
 * dead-entry case asks it per entry. Three consumers, one grammar, so "covered" cannot come to mean
 * one thing in the coverage answer and another in the case that checks the list for fiction.
 *
 * The SEGMENT question is asked only of a path's DIRECTORY components, so a FILE named `docs` is
 * not silently excluded by a rule written about directories.
 */
export function bannedClaimExcludedBy(rel: string, entry: string): boolean {
  if (entry.startsWith("**/") && entry.endsWith("/")) {
    return rel.split("/").slice(0, -1).includes(entry.slice(3, -1));
  }
  if (entry.endsWith("/")) return rel.startsWith(entry);
  return rel === entry;
}

// Refusals raised while DERIVING the scan set. Collected rather than thrown: this is a GATE, and a
// gate's floor is to REPORT (the kit-model throw-versus-report split).
const DERIVATION_REFUSALS: string[] = [];

// ── ONE BUDGET FOR THE WHOLE GATE (round 7, IN-03) ──────────────────────────────────────────────
//
// This used to be a FRESHLY CONSTRUCTED zeroed tally per part, written inline at each call site —
// described rather than quoted, per this repository's retired-construct convention, because the
// permanent case below counts occurrences of that literal in this source and a quotation of a
// deleted construct re-registers as a live site of it. The constant was single-sourced and the BUDGET
// was not, so five parts meant five independent allowances and the gate's effective bound was
// 5 x MAX_WALK_ENTRIES — and adding a sixth part would have made it larger still. One object,
// created once, threaded through every in-module walk, so the bound limits THE GATE'S WORK.
//
// THE BOUNDARY THIS MODULE CANNOT THREAD, DECLARED RATHER THAN LEFT AS A GAP: the `publicDocs` part
// is `publicDocsCorpus()`, derived inside scripts/check-public-docs-vocabulary.ts AT THAT MODULE'S
// IMPORT TIME, and it carries its own budget because the walk belongs to that module's derivation
// and happens before this object exists. So the gate's EFFECTIVE bound is 2 x MAX_WALK_ENTRIES:
// this module's one, plus the imported derivation's one. A refusal raised on the other side is
// reported through the imported channel `runAll()` drains (round 6, WR-05), so an overflow there is
// diagnosed rather than lost. The number of budget objects IN THIS MODULE is pinned two-sided by a
// permanent case, so a seventh part cannot quietly acquire a seventh allowance.
const WALK_BUDGET = { examined: 0 };

// Recursively enumerate every file under a scan entry. Directory entries are `.sort()`ed so two
// runs over the same tree are byte-identical. The budget is ONE mutable tally threaded through the
// whole walk, counting entries EXAMINED — so the bound limits WORK and is independent of the tree's
// shape. A truncated scan set passes every guard exactly the way a vacuous one does, so an overflow
// is a named refusal and never a short return.
//
// ── THE EXCLUSION IS ENFORCED HERE, AT THE POINT DESCENT IS DECIDED (round 7, WR-01) ───────────
//
// A prefix test on the derived relative path is TRUE of `.claude/worktrees/x/docs/…` for no entry
// in the list, so a nested copy of an excluded directory carried none of its exclusion. The test
// belongs where descent is decided, not where the path is later read. The segment set is a
// PROJECTION of the one exclusion list — never a second array — and the entries that project are
// exactly those written with the any-depth marker, for the reasons recorded at the list.
function walkFiles(
  rel: string,
  budget: { examined: number },
  acc: string[],
): string | null {
  const a = abs(rel);
  if (!existsSync(a)) return null;
  const st = statSync(a);
  if (st.isDirectory()) {
    const segments = bannedClaimExcludedSegments();
    for (const entry of readdirSync(a).sort()) {
      // The entry WAS examined, so it is charged to the budget BEFORE any decision about it. A skip
      // that also skipped the tally would make the bound a function of what the tree happens to
      // contain, which is the property the budget exists to be independent of.
      budget.examined += 1;
      if (budget.examined > MAX_WALK_ENTRIES) {
        return (
          `the walk of ${rel} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} directory ` +
          `entries, reaching ${join(rel, entry)} — refusing to continue and refusing to report a ` +
          `verdict over the members collected so far, because a truncated scan set passes every ` +
          `guard exactly the way a vacuous one does`
        );
      }
      // Refuse to DESCEND. Asked of the entry's OWN NAME, so depth is irrelevant — which is the
      // whole difference between this and the prefix reading it replaces. Guarded on being a
      // DIRECTORY so the projection means the same thing here as it does in `bannedClaimExcluded`,
      // where the segment question is asked only of a path's directory components.
      if (
        segments.includes(entry) &&
        statSync(join(a, entry)).isDirectory()
      ) {
        continue;
      }
      const refusal = walkFiles(join(rel, entry), budget, acc);
      if (refusal !== null) return refusal;
    }
  } else if (st.isFile()) {
    acc.push(rel);
  }
  return null;
}

// Part `kit`: every markdown file under agent-factory/, walked. A new kit document enters this scan
// by EXISTING, not by someone remembering to add it.
function kitMarkdown(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(KIT_DIR, WALK_BUDGET, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

// Part `publicDocs`: the CORPUS check-public-docs-vocabulary.ts derives — every public document,
// before that module's own per-gate exemption. Taken WHOLE — never filtered, sliced or re-derived.
// The corpus rather than the scan, because the exemption the scan applies is argued for the
// retired-vocabulary predicate and not for this one; see the import paragraph at the head of this
// file for the defect that reasoning replaced.
function publicDocsMembers(): string[] {
  return publicDocsCorpus().slice().sort();
}

// Part `installReadme`: the hand-authored, user-facing install guide. ONE named literal, and still
// DERIVED AGAINST THE DISK — `kitReadmeMembers()`'s precedent in check-public-docs-vocabulary.ts,
// for its two reasons. A literal part can never reach the per-part vacuity floor (a one-element
// array is always length 1), so returning [] on an absent file is the only way this gate notices
// the document vanished; and readText() is called unguarded downstream, so an absent file would
// otherwise kill the gate with a node:internal stack trace instead of a verdict.
//
// ADMITTED IN ROUND 6 (WR-02). The reviewer's objection was specific: this "is exactly the kind of
// document a conformance claim gets written into, and its absence currently reads as an oversight".
// Measured before admission over the whole banned-literal set: 0 live occurrences. So admitting it
// costs zero reds on correct text today, which is this file's own admission test — and an exclusion
// entry would have had to argue that a hand-authored, user-facing, shipped document belongs outside
// a gate over hand-authored, user-facing, shipped documents. There is no such argument.
function installReadmeMembers(): string[] {
  if (!existsSync(abs(INSTALL_README))) {
    DERIVATION_REFUSALS.push(
      `${INSTALL_README} is a NAMED member of the banned-claim scan set and does not exist at ` +
        `${abs(INSTALL_README)} — refusing to report a verdict over a part whose one member could ` +
        `not be read. A missing document is not a clean one`,
    );
    return [];
  }
  return [INSTALL_README];
}

// Part `skillSources`: the hand-authored skill documents under skills/, walked.
//
// ADMITTED IN ROUND 6, AND THIS CLASS APPEARS IN NO ROUND-5 FINDING AT ALL. The review enumerated
// four unscanned classes; deriving the remainder rather than adopting the enumeration found this
// fifth one. These are hand-authored, they ship, and scripts/generate-skill-twins.ts reads them with
// readFileSync to render .claude/skills/*/SKILL.md — so they are also the upstream the twins'
// transitive-coverage argument would have to rest on, and that argument cannot rest on a document
// nothing scans. Measured before admission: 0 live occurrences.
function skillSourceMarkdown(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(SKILLS_DIR, WALK_BUDGET, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

// Part `claudeAdapters`: the generated Claude Code adapter surface under .claude/, walked.
//
// ── THE TRANSITIVE-COVERAGE ARGUMENT WAS TESTED AND IS REFUTED (round 6, WR-02) ──────────────
//
// The round-5 review offered these as "the generated adapters and skill twins (derived from role
// text, so covered transitively — but that transitivity is nowhere stated)". It is not merely
// unstated; it is FALSE, and the way to find that out was to read the two generators rather than to
// assert it.
//
// scripts/generate-role-adapters.ts composes an adapter body in `specialistBody()` and
// `coordinatorBody()` from STRING LITERALS IN ITS OWN TYPESCRIPT SOURCE. The file's header says the
// body is "single-sourced from agent-factory/packaging/subagent.frontmatter.md", and that is a
// documentation convention, not a data flow: the only runtime readFileSync in that generator reads
// agent-factory/roles/*.md for the DESCRIPTION and the capability line. Every shipped sentence of
// the adapter body — "Read `agent-factory/roles/<role>.md` now and act as that role", the Workflow
// 16 sentence, the hard-limit sentence, the whole three-tier Full/Reduced/Degraded block on the
// coordinator — is typed in scripts/generate-role-adapters.ts. And scripts/ is excluded from this
// gate by name, because this module declares the literals and would fail its own check. So a
// conformance, token-economy or comprehension claim typed into a body composer would ship into all
// seventeen adapters, and NOTHING in this repository would read it.
//
// scripts/generate-skill-twins.ts is a weaker version of the same. It DOES readFileSync its bodies,
// from skills/<dir>/SKILL.md — which was itself unscanned until this same commit admitted it — and
// it then INSERTS a kit-root resolver block of its own. So even the honest half of the argument
// pointed at a document outside the gate.
//
// The freshness gates `npm run freshness:adapters` and `npm run freshness:skill-twins` hold the
// derivation byte-for-byte, and they are why admitting the OUTPUT is sufficient rather than
// second-best: a claim typed into a generator cannot reach a host machine without appearing here
// first, and it now reds here when it does. Measured before admission: 0 live occurrences across
// all 24 files.
//
// .claude/settings.local.json IS NOT MARKDOWN and is outside this and every other markdown scan by
// construction. It carries `asd-ste100.org` inside a WebFetch tool permission — a research
// permission, not a claim. Recorded here so a later reader who greps for the standard's name and
// finds it does not mistake it for drift the gate missed.
function claudeAdapterMarkdown(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(CLAUDE_DIR, WALK_BUDGET, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

// Part `pluginManifests`: the kit's SHIPPED JSON MANIFESTS under .claude-plugin/, walked.
//
// ── WHAT THESE FILES ARE, WHICH IS THE WHOLE ARGUMENT FOR ADMITTING THEM (round 7, CR-02) ──────
//
// `.claude-plugin/marketplace.json`'s `description` is the EXACT STRING A USER MEETS RUNNING
// `/plugin marketplace add`. `.claude-plugin/plugin.json`'s is what the plugin manager shows, and
// marketplace.json carries a SECOND description nested inside its own plugin entry. All three ship.
// They are the claim surface furthest from this gate and closest to the reader — the sentences
// somebody reads BEFORE they install anything — and until this commit no gate in this repository
// read them. A string that is a three-finding red in any .md of the corpus exited 0, unnamed, on
// all seven. Measured with this gate's own matcher BEFORE admission: 0 live occurrences in each
// file and 0 across the group, so admitting them costs zero reds on correct text — this module's
// own admission test, applied here exactly as it was applied to install/README.md and skills/.
//
// DERIVED AGAINST THE DISK, NOT A LITERAL PAIR. A two-element constant would be this repository's
// SECOND documented systemic failure class — the hand-maintained set that rots while green, the one
// that produced seven granted names and zero adapter files — authored inside the fix for a
// fail-open. The directory is WALKED and filtered to the JSON extension, so a THIRD manifest enters
// by EXISTING and moves the pin, exactly as a new kit document does. It is also the only shape that
// can reach the per-part vacuity floor: a literal list is always its own length, so an absent
// directory would be invisible to it.
//
// AN ABSENT DIRECTORY IS A NAMED REFUSAL AND AN EMPTY PART, both — the refusal says what is missing
// and the empty list is what the floor below notices.
function pluginManifestMembers(): string[] {
  if (!existsSync(abs(PLUGIN_MANIFEST_DIR))) {
    DERIVATION_REFUSALS.push(
      `${PLUGIN_MANIFEST_DIR}/ holds the kit's SHIPPED plugin manifests — the descriptions a user ` +
        `meets in the plugin marketplace and the plugin manager — and does not exist at ` +
        `${abs(PLUGIN_MANIFEST_DIR)}. Refusing to report a verdict over a part whose members could ` +
        `not be derived. A missing manifest is not a clean one`,
    );
    return [];
  }
  const acc: string[] = [];
  const refusal = walkFiles(PLUGIN_MANIFEST_DIR, WALK_BUDGET, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(JSON_EXT)).sort();
}

// ── THE `encoding` PROBE ROW, ANSWERED IN CODE (round 7, LANG-04) ──────────────────────────────
//
// THE QUESTION: whose definition of the text applies — raw bytes, or the values a JSON parse
// decodes? It is live and concrete here, because a claim written into a JSON string as an escape is
// INVISIBLE to a raw-byte line scan and visible to a decoded-value scan.
//
// THE DECISION: the scan reads RAW BYTES, line-oriented, exactly as it reads every other member.
// One matcher, one input shape — a decoded-value scan would be a SECOND way of assembling the text
// a matcher is asked about, which is this phase's most expensive recurring defect. A line scan also
// reports file:line:column, which a human can check by hand; a value scan reports a field path,
// which nothing else in this gate's output speaks. And it covers the WHOLE file — keys, values, and
// the description nested inside the marketplace's plugin entry — so there is no claim-bearing field
// list to maintain, and therefore none to rot.
//
// THE BRANCH NOT TAKEN IS CLOSED BY A REFUSAL, NOT LEFT AS A HOLE. Every decoded string value must
// be BYTE-PRESENT in the raw text. A value written with any escape that changes its bytes — a
// unicode escape, a tab, a newline, an escaped backslash — is not byte-present, and the gate refuses
// BY NAME. Measured on today's manifests: neither file contains a backslash, so the assertion costs
// zero refusals on correct text at admission.
//
// WHICH SET THIS PREDICATE ENUMERATES: every string value in the parsed document, at any depth,
// keys included. WHAT DERIVES IT: the parse. WHAT ASSERTS ITS COUNT: nothing, and nothing should —
// the document's shape belongs to its author, not to this gate. Pinning a value count here would be
// a set literal over somebody else's data.
//
// A MANIFEST THAT DOES NOT PARSE IS REFUSED BY NAME AND STILL SCANNED. Parsing is what THIS
// assertion needs; the line scan needs nothing. So a parse failure removes the canonical-form
// GUARANTEE and says so, and never removes the scan.
//
// ASKED OF THE BYTES THE SCAN ACTUALLY READ, at the point the loop has them — never of a second
// read of its own. That is this module's own ONE-READ lesson (round 7, WR-02) applied to a new
// predicate on the day it lands: a canonical-form verdict measured over read #1 and a scan
// performed over read #2 are two questions about two documents that happen to share a path.
export function manifestCanonicalFormRefusals(
  rel: string,
  raw: string,
): string[] {
  const out: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    out.push(
      `${rel} is a SHIPPED plugin manifest and does not parse as JSON ` +
        `(${(e as Error).message}). The canonical-form guarantee is UNAVAILABLE for this file: ` +
        `the gate cannot check that its shipped strings are written literally. The line scan over ` +
        `its raw bytes STILL RAN, and any banned claim on a line of it is still a finding — a ` +
        `parse failure removes the guarantee, never the scan`,
    );
    return out;
  }
  for (const value of jsonStringValues(parsed)) {
    if (!raw.includes(value)) {
      out.push(
        `${rel} carries a string whose decoded value is NOT byte-present in the file: ` +
          `${JSON.stringify(value)}. A shipped string written with an escape is invisible to a ` +
          `line scan and fully visible to a reader, so this gate would publish a sentence about ` +
          `bytes it never compared. The remedy is to write the string LITERALLY, so that what the ` +
          `scan reads is what a user reads`,
      );
    }
  }
  return out;
}

/** Every string in a parsed JSON document, keys included, at any depth. */
function jsonStringValues(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(jsonStringValues);
  if (node !== null && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => [
      k,
      ...jsonStringValues(v),
    ]);
  }
  return [];
}

export const BANNED_CLAIM_SCAN_PARTS: readonly {
  name:
    | "kit"
    | "publicDocs"
    | "installReadme"
    | "skillSources"
    | "claudeAdapters"
    | "pluginManifests";
  members: readonly string[];
}[] = [
  { name: "kit", members: kitMarkdown() },
  { name: "publicDocs", members: publicDocsMembers() },
  { name: "installReadme", members: installReadmeMembers() },
  { name: "skillSources", members: skillSourceMarkdown() },
  { name: "claudeAdapters", members: claudeAdapterMarkdown() },
  { name: "pluginManifests", members: pluginManifestMembers() },
];

/**
 * The DEDUPED union of the two parts, sorted.
 *
 * The parts OVERLAP by exactly one member today — agent-factory/README.md is both a kit document
 * and a public document — and the overlap is real rather than a derivation bug. Deduping is what
 * makes a finding in that file one finding instead of two identical ones; the arithmetic
 * `kit + publicDocs - overlap = total` is reported in the PASS line so a reader can check it rather
 * than take it. Sorted, so two runs over one tree produce byte-identical output.
 */
export function bannedClaimScan(): string[] {
  const seen = new Set<string>();
  for (const part of BANNED_CLAIM_SCAN_PARTS) {
    for (const m of part.members) seen.add(m);
  }
  return [...seen].sort();
}

/**
 * The number of DUPLICATE memberships across the parts — reported, never subtracted silently. It is
 * exactly the quantity that makes `sum(parts) − overlap = total` hold, so a reader can check the
 * PASS line's arithmetic rather than take it.
 *
 * GENERALISED FROM A TWO-PART SUBTRACTION IN ROUND 6, AND THE OLD SHAPE WAS A LATENT SET-LITERAL
 * DEFECT. It read `BANNED_CLAIM_SCAN_PARTS[0]` against `[1]` by index, so the day a third part
 * landed the reported arithmetic would have stopped adding up while every pin stayed green — the
 * hand-maintained-index version of the drift this repository has already been bitten by. This
 * counts duplicates over ALL parts, whatever their number.
 */
export function bannedClaimScanOverlap(): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const part of BANNED_CLAIM_SCAN_PARTS) {
    for (const m of part.members) {
      if (seen.has(m)) duplicates += 1;
      else seen.add(m);
    }
  }
  return duplicates;
}

/**
 * The pinned cardinality of the deduped union. 115 today: 73 kit markdown files + 11 public
 * documents + 1 install README + 7 skill sources + 24 Claude Code adapters − 1 overlap
 * (agent-factory/README.md, a member of both the kit part and the public-document part).
 *
 * TWO-SIDED. A set that silently SHRANK reports a clean pass over the documents it stopped reading;
 * a set that silently GREW is a scan nobody reviewed.
 *
 * MOVED 82 → 83 IN ROUND 6, AND THE ENTRANT IS NAMED RATHER THAN LEFT AS ARITHMETIC: `CHANGELOG.md`.
 * The arithmetic is restated from the run that produced it, not computed by hand — this gate's own
 * refusal on the intermediate build read, verbatim:
 *
 *   FAIL  the banned-claim scan set derived 83 document(s), expected exactly 82
 *         (kit 73, publicDocs 11, overlap 1)
 *
 * WHY IT WAS OUTSIDE THE SET UNTIL NOW, WHICH IS THE PART WORTH RECORDING: not by decision. This
 * gate consumed `publicDocsScan()` and inherited a subtraction that
 * `check-public-docs-vocabulary.ts` applies for ITS OWN predicate, so `CHANGELOG.md` was excluded by
 * INHERITANCE and appeared in no exclusion list, in no reason, and in nobody's review. It is now a
 * member because this gate asks for the corpus, and the two live `token-economy` occurrences it was
 * hiding (`CHANGELOG.md:30:49` and `:68:20`) were rewritten in the same commit.
 *
 * MOVED AGAIN 83 → 115 IN THE SAME ROUND (WR-02), WITH ALL THREE ENTRANT CLASSES NAMED:
 * `install/README.md` (1), `skills/` (7) and `.claude/` (24). Read off this gate's own refusal on
 * the intermediate build rather than computed by hand, verbatim:
 *
 *   FAIL  the banned-claim scan set derived 115 document(s), expected exactly 83
 *         (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24, overlap 1)
 *
 * That run reported ZERO banned-claim findings, which is the admission test: all 32 entrants cost
 * zero reds on correct text. Each class's reason sits at its derivation function above;
 * `.claude/` in particular is admitted because its transitive-coverage argument was tested against
 * scripts/generate-role-adapters.ts and REFUTED.
 *
 * MOVED AGAIN 115 → 117 IN ROUND 7 (CR-02), AND THE TWO ENTRANTS ARE NAMED: the kit's SHIPPED JSON
 * MANIFESTS, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. THE FIRST NON-
 * MARKDOWN MEMBERS THIS GATE HAS EVER HAD, which is why the class boundary is now declared in prose
 * beside BANNED_CLAIM_EXCLUDED_LOCATIONS rather than left as the shape of a denominator.
 *
 * Read off this gate's own refusal on the intermediate build rather than computed by hand — the
 * paragraph above exists precisely because typing a predicted number in place of a measured one is
 * this module's own recorded failure. Verbatim:
 *
 *   FAIL  the banned-claim scan set derived 117 document(s), expected exactly 115
 *         (kit 73, publicDocs 11, installReadme 1, skillSources 7, claudeAdapters 24,
 *          pluginManifests 2, overlap 1)
 *
 * That run reported ZERO findings over 117/117 elements, which is the admission test: both entrants
 * cost zero reds on correct text. Measured with this gate's own matcher BEFORE admission, per file
 * and per group: plugin.json 0 (standard-name 0, token-economy 0, comprehension 0),
 * marketplace.json 0 (standard-name 0, token-economy 0, comprehension 0), group total 0.
 *
 * AND `kit` STAYED AT 73 ACROSS THE SAME BUILD, which is the number that proves the round's OTHER
 * change moved nothing: the walk now refuses to descend into a segment-class directory, and the
 * thirteen kit documents under agent-factory/seed/plans/ and agent-factory/seed/memory-bank/ are
 * still members. See the anchoring paragraph at BANNED_CLAIM_EXCLUDED_LOCATIONS for why those two
 * names are root-anchored and not segment classes.
 */
export const BANNED_CLAIM_SCAN_COUNT = 117;

// ---------------------------------------------------------------------------
// The exemption region, located by EXACT heading line.
// ---------------------------------------------------------------------------

export interface ExemptRegion {
  /** 0-based line index of the heading itself. */
  readonly headingAt: number;
  /** 0-based index one past the last line of the region. */
  readonly endBefore: number;
}

/**
 * Locate the region and report every way it can be wrong. Returns the region when exactly one
 * well-formed region exists, and null otherwise — the caller then scans the file WHOLE, which is
 * the fail-closed direction: a broken exemption means more is checked, never less.
 *
 * EXPORTED (plan 29-18) so a case can assert the region's EXTENT as a NUMBER. No exit code can
 * express "the region ends AFTER the fenced heading rather than at it": a gate that exempts the
 * right lines and a gate that exempts too few both report through findings, and the two are
 * distinguishable only by where the region actually stops. This is the same disclosure phase 27
 * made for the grant-occurrence balance arm — a predicate a case cannot reach is a predicate
 * nothing pins — and it widens no behaviour: the function is unchanged apart from the keyword.
 *
 * ------------------------------------------------------------------------------------------------
 * (Plans 29-18 and 29-23, WR-06 / WR-08) BOTH SECTION-EXTENT QUESTIONS ARE ASKED OF THE ONE
 * SHARED LOCATOR, AND THIS MODULE DECLARES NO SECTION PREDICATE OF ITS OWN.
 *
 * This function used to answer two questions — "which line carries the region's own heading" and
 * "which same-level heading ends the region" — with predicates written here: an exact-equality
 * heading comparison and a private `/^## /` close. `scripts/frontmatter.ts` is the single place this
 * tree answers both, and three sibling gates already consume it. Both are DELETED. The heading comes
 * from `unfencedHeadingIndex` and the end from `sectionEndIndex` at level two, so the `trimEnd()`
 * normalisation — the axis on which the four locators of this class disagreed — is now applied in
 * exactly one place. A second grammar over bytes an authority already answers for is a defect in
 * this repository even while the two happen to agree.
 *
 * WHAT PLAN 29-18 ACTUALLY DID TO THIS EXEMPTION, STATED PLAINLY BECAUSE THE PARAGRAPH THAT USED TO
 * SIT HERE DENIED IT.
 *
 * The text this replaces asserted that nothing below was relaxed and that both truncation directions
 * were fail-closed. The first half was false. Making the close fence-aware moved the region's END
 * LATER, so strictly FEWER lines of the disclaimer document are scanned. Measured on the fixture the
 * round-2 review used, and reproduced in scripts/check-banned-claims.test.ts, the region's body went
 * from FOUR exempt lines to NINE. A LONGER EXEMPTION IS LESS CHECKING, NOT MORE. That is a
 * relaxation of a safety exemption, and a header claiming otherwise is a prose claim wider than the
 * assertion behind it — this repository's second systemic failure class wearing a sentence instead
 * of a set literal.
 *
 * WHY THE RELAXATION IS NONETHELESS RIGHT. A `## ` line the author wrote INSIDE a fenced example is
 * documentation and never structure. A region that stopped at one was not exempting fewer lines on
 * purpose; it was measuring the wrong bytes, and it truncated the disclaimer at the first heading
 * the disclaimer happened to QUOTE. The extra lines were always meant to be inside the region.
 *
 * AND THE RELAXATION IS GIVEN A MECHANISM RATHER THAN AN ARGUMENT. `BANNED_CLAIM_EXEMPT_SUPPRESSED`
 * below pins how many banned-claim occurrences this region actually lifts the prohibition on, the
 * gate publishes that number on every green run, and the two are compared two-sided. A future
 * widening is then an acknowledged edit with a reason, never a side effect of a heading landing
 * somewhere new — which is exactly how the widening above went unnoticed.
 *
 * THE ASYMMETRY WITH ITS SIBLING SURVIVES, AND IT IS THE HALF THAT WAS ALWAYS TRUE. Truncating THIS
 * region causes MORE of the document to be checked, so truncation here is fail-CLOSED. The sibling
 * locator in check-diff-disposition answers the same shape of question about a FROZEN region, and
 * truncation there is fail-OPEN — LESS gets protected. The two are NOT one bug at two addresses, and
 * a reader meeting both fixes in one round should not have to infer which is which.
 *
 * THE TWO NAMED REFUSALS AND THE EMPTY-REGION REFUSAL ARE UNCHANGED, wording and fail-closed null
 * return alike, because they are what this guard already gets right and a locator change is not
 * licence to touch them. No delimiter class is re-declared here and there is no opt-out parameter:
 * an opt-out is a second grammar with extra steps.
 * ------------------------------------------------------------------------------------------------
 */
export function locateExemptRegion(
  lines: readonly string[],
): ExemptRegion | null {
  const text = lines.join("\n");

  // ── (Plan 29-32, WR-04 / IN-02) ONE ARRAY UNDER BOTH TRAVERSALS ─────────────────────────────
  //
  // THIS LINE IS THE STRUCTURAL HALF OF THE FIX, AND THE GUARDS BELOW IT ARE BELT AND BRACES.
  //
  // What used to sit here counted the region's heading over the CALLER'S `lines` while locating it
  // over `text` — two arrays assembled by two expressions — and consulted `fencedLineFlags(text)`,
  // an array indexed in TEXT coordinates, at a LINES index. The two agreed only by the accident
  // that `text === lines.join("\n")` round-trips for arrays whose elements carry no separator. When
  // a caller assembles its array on a different newline rule (`split("\r\n")` over a document with
  // one bare LF is enough) the coordinate systems shear, the count reads a fence flag belonging to
  // an unrelated line, and `unfencedHeadingIndex` answers `-1` for a heading the count just found.
  //
  // A GUARD ON A DISAGREEMENT THAT CAN STILL OCCUR IS A SMALLER FIX THAN A DISAGREEMENT THAT
  // CANNOT. So the route is deleted: BOTH traversals below walk `scanLines`, derived from the same
  // string the authority is asked about, and the flags array is the one computed from that string.
  // Count and locate are then provably over the same lines, and `-1` is unreachable by arithmetic
  // rather than by inspection.
  const scanLines = text.split("\n");

  // AND THE CALLER'S ARRAY IS HELD TO THE SAME COORDINATES, because the indices this function
  // RETURNS are spent against it. `runAll` slices the caller's own `lines` with `headingAt` and
  // `endBefore`, so an array that disagrees with `text.split("\n")` about where the lines are would
  // have the region applied one or more lines off its real position — a widening in exactly the
  // direction this whole block exists to close, and one the two guards below would not see because
  // both indices are perfectly valid IN TEXT COORDINATES. Refused by name rather than reconciled:
  // reconciling would pick a winner between two disagreeing assemblies of one document, which is a
  // second grammar with extra steps.
  if (scanLines.length !== lines.length) {
    fail(
      `the exemption document was handed to \`locateExemptRegion\` as ${lines.length} line(s) while ` +
        `\`lines.join("\\n")\` splits back into ${scanLines.length} — the caller's array was ` +
        `assembled on a different newline rule from the one the shared locator uses, so at least ` +
        `one element carries an embedded line separator. Every index this function returns is spent ` +
        `against the CALLER'S array, so the two must be the same array; refusing rather than ` +
        `returning a region measured in one coordinate system and applied in another. Fix the ` +
        `caller's split; do not reconcile the two here`,
    );
    return null;
  }

  // THE COUNT TAKES THE PER-LINE TOGGLE; THE BOUND TAKES THE SHARED LOCATOR. Both are projections of
  // the SAME authority over the SAME array, and both apply the authority's own `trimEnd()`
  // equality, so the heading this gate COUNTS and the heading it LOCATES can never come to
  // disagree. `unfencedHeadingIndex` answers "the FIRST such line" and a count is not a first
  // index; wrapping it in a "find the next one after i" loop is deliberately NOT done, because a
  // second traversal with its own termination behaviour is precisely the shape this round is
  // deleting.
  const fenced = fencedLineFlags(text);
  let headingCount = 0;
  for (let i = 0; i < scanLines.length; i++) {
    // Only an UNFENCED occurrence is the region's own heading. A fenced one is a quotation of it.
    if (
      !fenced[i] &&
      scanLines[i].trimEnd() === BANNED_CLAIM_EXEMPT_REGION.heading
    )
      headingCount += 1;
  }
  if (headingCount !== 1) {
    fail(
      `the one named exemption region is declared as \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\`, and that heading occurs ${headingCount} ` +
        `time(s) in the file. Exactly one is required, asserted two-sided: a VANISHED region makes ` +
        `the disclaimer illegal and reds the build on correct text, and a DUPLICATED region widens ` +
        `the hole by adding a second heading. Fix the document; do not relax this assertion`,
    );
    return null;
  }
  const headingAt = unfencedHeadingIndex(
    text,
    BANNED_CLAIM_EXEMPT_REGION.heading,
  );
  // ── THE AUTHORITY'S `-1` CONTRACT, HONOURED AT THE CONSUMER (plan 29-32, WR-04) ─────────────
  //
  // `-1` IS A LEGAL ANSWER, NOT AN ERROR CODE AND NOT AN INDEX. `unfencedHeadingIndex` documents it
  // as "the document carries no such unfenced line", and a consumer that does ARITHMETIC on it
  // before checking it has quietly reintroduced a SECOND BEHAVIOUR over bytes this tree has exactly
  // one authority for — which is the LANG-07 argument applied at the consumer rather than at the
  // parser. Unchecked, `headingAt + 1` is `0`, the region is bounded from the top of the document,
  // and the scan's `i >= region.headingAt` test is true for EVERY line from zero: a safety
  // exemption silently widened to the whole file.
  //
  // The refusal states the SITUATION rather than the symptom, and it names the DIRECTION, because
  // the obvious "repair" — defaulting the index to zero — is precisely the failure this guard
  // exists to prevent, written out as a remedy. scripts/frontmatter.test.ts turns this one site
  // into a tree-wide class assertion; the sibling posture is `readDispositionRows` in
  // scripts/check-diff-disposition.ts, copied rather than reinvented.
  //
  // After the structural half above, this is UNREACHABLE through the public signature: the count
  // and the locate walk one array, so a count of exactly one implies an index that exists. It is
  // kept because unreachability is a property of today's code and a guard is a property of the
  // contract; scripts/check-banned-claims.test.ts watches it fire on a build with that one
  // expression reverted, so it is a live assertion rather than a comment.
  if (headingAt === -1) {
    fail(
      `the exempt heading \`${BANNED_CLAIM_EXEMPT_REGION.heading}\` in ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.file}\` was COUNTED once and LOCATED zero times — the count ` +
        `predicate and the shared locator disagree about which lines are the region's heading. ` +
        `\`-1\` is the authority's legal answer for "no such unfenced line", never an index, so the ` +
        `gate is refusing rather than exempting from line 0. Do NOT repair this by defaulting the ` +
        `index to zero: that turns a one-section exemption into a whole-document one, which is the ` +
        `exact failure this guard exists to prevent`,
    );
    return null;
  }
  const endBefore = sectionEndIndex(text, headingAt + 1, 2);
  const body = scanLines.slice(headingAt + 1, endBefore);
  if (body.every((l) => l.trim() === "")) {
    fail(
      `the exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` is EMPTY — the heading is present and carries no ` +
        `disclaimer beneath it. An empty exemption region exempts nothing and denies nothing, so it ` +
        `reads as a satisfied requirement while the disclaimer it names is gone`,
    );
    return null;
  }
  return { headingAt, endBefore };
}

// ================================================================================================
// THE CONTENT BOUND — plan 29-52, D-54, closing round-6 CR-01.
//
// WHAT WAS WRONG, MEASURED RATHER THAN ARGUED. `BANNED_CLAIM_EXEMPT_REGION` was pinned by two
// CARDINALITIES and by nothing else: how many occurrences it lifts, and how far it reaches. Nothing
// pinned what was WRITTEN inside it. Reproduced independently by the round-6 reviewer and the
// round-6 verifier on `git archive HEAD` mirrors with sha256-verified gate binaries, and reproduced
// a third time by this plan before a line of it was written: swapping the honest comprehension
// denial for the live assertion — `There is no evidence that controlled language improves
// comprehension...` for `Measurement shows that controlled language improves comprehension...` —
// leaves `suppressed` at exactly 14 and `extent` at exactly 66, and the gate exits 0 with the
// profile never named. The same holds for the token-economy denial. The wholesale form is worse:
// replacing the region's entire body with banned claims plus filler ALSO holds both pins and exits
// 0 here, and the only thing that reds is a verbatim freeze on two paragraphs owned by a DIFFERENT
// gate. A carve-out whose only content bound lives in another gate is a carve-out this gate cannot
// speak for.
//
// WHY A SEVENTH PIN WAS REFUSED. Four residuals stand on this axis — CR-01, `V-29-47-02` (the region
// unbounded at the bottom), `V-29-47-03` (its position pinned by nothing) and `V-29-32-01` (a
// closed-fence count-preserving swallow) — and all four exist because the carve-out is defined by
// POSITION OVER A CARDINALITY. Six rounds of one-more-pin is what failed here. A CONTENT bound is
// invariant under translation and needs no bottom boundary, so it SUBSUMES the other three rather
// than adding a fifth beside them.
//
// WHAT DID NOT CHANGE, STATED SO THIS IS NOT READ AS A LICENCE. The matcher is byte-identical. No
// lexical axis returns: no verb list, no subject list, no co-occurrence window, no conditional field
// on `BannedClaimLiteral`. D-48's three forbidden weakenings — no fenced-block skip, no
// whole-word-only match, no below-a-marker skip — stay forbidden, and D-53's deletion of the
// conditional mechanism is not partially undone to make a denial writable. The region is STILL
// positional; a line outside it is still never exempt. AND NO DIGEST IS TAKEN OVER THE WHOLE
// DOCUMENT: this module has already reasoned that a frozen digest over a document authors
// legitimately edit is a false-red generator rather than a pin, so the frozen surface is the union
// of registry-anchored blocks and nothing else. The rest of the disclaimer stays freely editable.
//
// THE COST, ACCEPTED WITH D-54 RATHER THAN DISCOVERED LATER: editing a denial sentence inside the
// region is now a TWO-FILE change under D-04 — the prose and its registry row, in the SAME commit,
// with no override tier.
// ================================================================================================

/**
 * How many registry-anchored blocks sit inside the one named exemption region. TWO-SIDED.
 *
 * WHAT MOVES IT: a registry row naming the exemption document whose anchor falls inside the region
 * being ADDED or REMOVED, and nothing else. It is a function of exactly which rows anchor inside the
 * region — not of the document's length, not of how many occurrences the region carries, and not of
 * how many anchors the document carries in total (four of this document's eight sit ABOVE the
 * region and are correctly excluded).
 *
 * MOVING IT IS HOW A DELIBERATE CHANGE IS ACKNOWLEDGED AND NEVER HOW A FAILURE IS CLEARED. A row
 * dropped from the registry already reds LOUDLY through the conjunction below — its block's lines
 * stop being exempt and their occurrences become findings at file:line:column. This pin is the OTHER
 * direction: a row silently ADDED inside the region WIDENS the frozen-and-therefore-exempt surface,
 * and a widened safety exemption that nothing counts is precisely the shape round 2 shipped when
 * this region grew from four exempt lines to nine without anything noticing.
 *
 * WHY IT IS NOT A SET LITERAL. The BLOCKS are DERIVED — from the registry rows, through the
 * authority, filtered by the region's own indices. This constant is a CARDINALITY over that
 * derivation, which is the shape D-25 admits and the shape this repository's set-literal-drift class
 * is not: a hand-listed array of exempt claim ids would rot while green, inside the fix for the
 * other systemic failure. A case asserts that no such array exists in this file.
 */
export const BANNED_CLAIM_EXEMPT_ANCHORS = 6;

/** The frozen, anchored, registry-backed line set inside the region, with the refusals it raised. */
export interface ExemptBlockSet {
  /** 0-based indices into the exemption document's line array. Exempt lines and nothing else. */
  readonly lines: ReadonlySet<number>;
  /** The ids of the blocks that were found inside the region, in document order. */
  readonly ids: readonly string[];
  /** The ids whose bytes DIVERGED from their registry row. Their lines are NOT in `lines`. */
  readonly diverged: readonly string[];
  /** Named refusals. Collected rather than thrown: this is a GATE, and a gate REPORTS. */
  readonly refusals: readonly string[];
}

/**
 * Which lines inside the region are FROZEN — anchored to a registry row whose bytes still match.
 *
 * THE DERIVATION, IN ONE SENTENCE: take the registry's rows that name the exemption document, ask
 * the authority where each one's anchor sits and whether its bytes still match, keep the ones whose
 * ANCHOR falls inside the located region, and return the union of the surviving blocks' extents.
 * There is no step in that chain that a human types.
 *
 * THE INPUT'S BOUND, NAMED BECAUSE THIS PHASE HAS PAID FOR NOT NAMING IT. The indices this function
 * returns are spent against the CALLER'S line array, and the authority assembles its own. The two
 * rules differ by exactly one element — the authority POPS the empty element a terminating newline
 * produces and `split("\n")` does not — so the premise is ASSERTED elementwise here rather than
 * assumed from plan 29-51's measurement, which was a measurement of one tree on one day.
 *
 * THE FAIL DIRECTION IS CLOSED IN EVERY ARM. An unreadable registry, a sheared assembly, a diverged
 * block and an anchor with no row all REMOVE lines from the exempt set, so the prohibition applies to
 * MORE bytes and never to fewer. Nothing here can widen the carve-out by failing.
 */
export function deriveExemptBlocks(
  root: string,
  exemptText: string,
  callerLines: readonly string[],
  region: ExemptRegion,
): ExemptBlockSet {
  const refusals: string[] = [];
  const empty = (): ExemptBlockSet => ({
    lines: new Set<number>(),
    ids: [],
    diverged: [],
    refusals,
  });

  let claims: readonly ClaimRow[];
  try {
    claims = readRegistry(root).claims;
  } catch (e) {
    refusals.push(
      `the claim registry could not be parsed, so NO line inside the one named exemption region is ` +
        `frozen and NO line inside it is exempt — every occurrence in the region is reported below. ` +
        `That is the fail-CLOSED direction and it is deliberate: an unreadable registry is not an ` +
        `empty one, and a carve-out whose content bound cannot be read is a carve-out with no ` +
        `content bound. The parse said: ${(e as Error).message}`,
    );
    return empty();
  }

  const scan = scanAnchoredDocument(exemptText);

  // ── THE COORDINATE PREMISE, ASSERTED ELEMENTWISE RATHER THAN INHERITED ──────────────────────
  //
  // The authority's assembly may legally be ONE element shorter than the caller's (the popped
  // terminator) and must otherwise agree element for element. Anything else means the two arrays are
  // not the same document, and every index traded between them would name a different line — the
  // coordinate shear `locateExemptRegion`'s own length refusal exists to make unreachable, arriving
  // one module over. Refused rather than reconciled: reconciling picks a winner between two
  // assemblies of one document, which is a second grammar with extra steps.
  if (
    scan.lines.length !== callerLines.length &&
    scan.lines.length !== callerLines.length - 1
  ) {
    refusals.push(
      `the exemption document assembles into ${callerLines.length} line(s) for this gate and ` +
        `${scan.lines.length} for the anchored-block authority. The two may differ by at most the ` +
        `one empty element a terminating newline produces, and these differ by ` +
        `${Math.abs(callerLines.length - scan.lines.length)}. Every block extent below is spent ` +
        `against THIS gate's array, so the two must be the same array; refusing rather than ` +
        `exempting lines measured in one coordinate system and applied in another`,
    );
    return empty();
  }
  for (let i = 0; i < scan.lines.length; i++) {
    if (scan.lines[i] !== callerLines[i]) {
      refusals.push(
        `the exemption document's two assemblies first disagree at index ${i}: the authority reads ` +
          `${JSON.stringify(scan.lines[i])} and this gate reads ` +
          `${JSON.stringify(callerLines[i])}. A length that matches is not an array that matches, ` +
          `and an index traded between two documents that merely have the same shape names a ` +
          `different line in each. Refusing rather than exempting`,
      );
      return empty();
    }
  }

  // The rows that name the exemption document, keyed by id. A row naming any OTHER file freezes
  // bytes in that file and has no bearing on this region.
  const rows = new Map<string, ClaimRow>();
  for (const c of claims) {
    if (c.file === BANNED_CLAIM_EXEMPT_REGION.file) rows.set(c.id, c);
  }

  const ids: string[] = [];
  const diverged: string[] = [];
  const lines = new Set<number>();
  for (const anchor of scan.anchors) {
    // OUTSIDE THE REGION IS NOT THIS FUNCTION'S SUBJECT. Four of this document's eight anchors sit
    // above the region; they freeze bytes for check-claim-anchors and they exempt nothing here,
    // because a line outside the region is never exempt however well frozen it is.
    if (anchor.index < region.headingAt || anchor.index >= region.endBefore) {
      continue;
    }
    const row = rows.get(anchor.id);
    if (row === undefined) {
      // AN ANCHOR WITH NO ROW FREEZES NOTHING, and saying so is not the same as ignoring it. The
      // anchors gate refuses this shape by name (its bijection); here the consequence is simply
      // that the bytes beneath it are NOT exempt, which is the fail-closed direction, and the
      // cardinality assertion below reports the shortfall.
      continue;
    }
    let block;
    try {
      block = anchoredBlockAt(scan, anchor, row.verbatim);
    } catch (e) {
      // A blank verbatim. `readRegistry` refuses it at parse time and strictly dominates this arm,
      // so it is a CONTRACT GUARD with zero live call paths — kept because a stack trace is not a
      // verdict and this gate has committed to producing one.
      refusals.push(
        `${anchor.id}'s anchored block could not be measured (${(e as Error).message}), so its ` +
          `lines are NOT exempt and its occurrences are reported below`,
      );
      continue;
    }
    ids.push(block.id);
    if (!block.matches) {
      diverged.push(block.id);
      continue;
    }
    for (let i = block.start; i < block.end; i++) lines.add(i);
  }

  // ── THE EMPTY CASE IS DECIDED, NOT DISCOVERED ───────────────────────────────────────────────
  //
  // A located region with ZERO anchored blocks inside it is neither a total exemption nor an empty
  // one — it is a carve-out that READS as live and freezes nothing, and under the conjunction it
  // would suppress nothing while both cardinality pins went on being satisfiable by a document that
  // exempts no line at all. Named here rather than left to the cardinality assertion below, because
  // "6 expected, 0 found" states an arithmetic disagreement and this states what is actually wrong.
  //
  // A VACUITY FLOOR CATCHES AN EMPTY SET AND NEVER A SILENTLY SHORT ONE. That is what the two-sided
  // count below is for, and it is why both exist.
  if (ids.length === 0) {
    refusals.push(
      `the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` is LOCATED and contains ZERO registry-anchored ` +
        `block(s). An exemption with no frozen block inside it exempts nothing while still reading ` +
        `as a live carve-out, and both of this region's cardinality pins would then be satisfiable ` +
        `by a document that suppresses nothing. Restore the anchors, or delete the exemption; do ` +
        `not lower BANNED_CLAIM_EXEMPT_ANCHORS to ${ids.length}`,
    );
  } else if (ids.length !== BANNED_CLAIM_EXEMPT_ANCHORS) {
    refusals.push(
      `the one named exemption region contains ${ids.length} registry-anchored block(s) ` +
        `[${ids.join(", ")}], and BANNED_CLAIM_EXEMPT_ANCHORS in scripts/check-banned-claims.ts ` +
        `declares ${BANNED_CLAIM_EXEMPT_ANCHORS}. A block ADDED widens the frozen-and-therefore-` +
        `exempt surface of a safety carve-out, and a block REMOVED narrows it — the second already ` +
        `reds through the findings below, and this is what names the first. Say in the commit which ` +
        `registry row entered or left the region, then move the constant; do not move the constant ` +
        `to make this line go away`,
    );
  }

  for (const id of diverged) {
    refusals.push(
      `${id}'s anchored block inside the one named exemption region no longer matches its registry ` +
        `row in \`docs/audit/28-claim-registry.md\` byte for byte, so its lines are NOT exempt and ` +
        `every banned-claim occurrence on them is reported below. The CAUSE and the SYMPTOM are ` +
        `both here on purpose: a finding whose reason lives in another gate's output is a finding ` +
        `the reader has to go looking for. If the prose change is correct, update ${id}'s verbatim ` +
        `in the SAME commit (D-01(a) / D-04, no override tier); if it is not, restore the bytes`,
    );
  }

  return { lines, ids, diverged, refusals };
}

/**
 * How many banned-claim occurrences the one named exemption region lifts the prohibition on, today.
 *
 * TWO-SIDED, AND PINNED ON SUPPRESSED OCCURRENCES RATHER THAN ON EXEMPT LINES. A line count moves
 * every time the disclaimer is reflowed, so it would red the gate on a change that lifted nothing —
 * and a pin that reds for no reason is a pin authors learn to move without reading, which is how a
 * pin stops being a pin. The suppressed count is exactly the quantity an exemption is a decision
 * about: it is the number of sentences the rest of the kit is forbidden to write and this one
 * section may.
 *
 * A GROWING number means the exemption now covers claims it did not cover before, whether because
 * the disclaimer gained a line or because the region's END MOVED. Plan 29-18 moved that end later
 * and nothing anywhere noticed; this constant is what makes the next such move an acknowledged edit.
 * A SHRINKING number is equally a change somebody made and is refused just as loudly, because a
 * disclaimer that quietly stopped quoting what it denies is a disclaimer that stopped working.
 *
 * MOVING THIS NUMBER IS HOW YOU ACKNOWLEDGE A CHANGE YOU MADE ON PURPOSE, NEVER HOW YOU CLEAR A
 * FAILURE. Read the region first and say in the commit which claim entered or left it.
 *
 * ------------------------------------------------------------------------------------------------
 * MOVED 10 -> 12 BY PLAN 29-41 (G-29-2). THE REGION WAS READ AND BOTH ENTRANTS WERE NAMED.
 *
 * The value was DERIVED FROM THE RUN and not typed: the rule landed first, the gate was run on a
 * clean tree, and the number was the one its own refusal text reported ("suppressed 12 banned-claim
 * occurrence(s) ... declares 10"). No document inside the region was edited — the exemption lifted
 * the prohibition on two MORE occurrences because the PROHIBITION got wider, which is the one
 * direction this pin's paragraph above had not yet seen. The two entrants were
 * `agent-factory/writing-profile.md:256` and `:288`, both honest denials, each already suppressed
 * once through an enumerated literal and gaining a SECOND occurrence because the hit count is
 * arithmetic over what was read and never a per-line boolean.
 *
 * ------------------------------------------------------------------------------------------------
 * MOVED 12 -> 14 BY PLAN 29-44 (CR-02, D-53). SAME DIRECTION, SAME REASON, DIFFERENT MEMBER.
 *
 * DERIVED, NOT PREDICTED — AND THE DISTINCTION IS THE WHOLE POINT OF THIS ENTRY. D-53 predicted 14
 * before the change. A prediction is a hypothesis; writing it down because a decision paragraph said
 * it is WR-01's exact failure repeated inside its own fix. So the change landed first and the number
 * below is the one the gate's OWN REFUSAL TEXT reported on the live tree:
 *
 *   "the one named exemption region `agent-factory/writing-profile.md` § `## Disclaimer and honesty
 *    floor` suppressed 14 banned-claim occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED in
 *    scripts/check-banned-claims.ts declares 12"
 *
 * The prediction and the measurement agreed. The TRANSCRIPT is the criterion, not the agreement.
 *
 * The two entrants, each derived through the gate's own `countBannedClaimOccurrences` over the
 * region rather than by reading the prose:
 *
 *   agent-factory/writing-profile.md:239  +1 via "Simplified Technical English", which stopped being
 *                                            conditional — "…ideas of ASD-STE100 Simplified Technical
 *                                            English Issue 9, and it is **not** ASD-STE100."
 *   agent-factory/writing-profile.md:241  +1 via the same member — "…or the Simplified Technical
 *                                            English Maintenance Group (STEMG), and…"
 *
 * BOTH ARE THE NON-AFFILIATION DISCLAIMER NAMING THE STANDARD IN ORDER TO DENY IT, which is exactly
 * what this region exists for. Neither line changed by a byte. They entered because the PROHIBITION
 * GOT WIDER — the second time this pin has moved in that direction, and the first time it moved for
 * the standard-name group.
 *
 * THE BREAKDOWN BY GROUP IS PUBLISHED BY THE RUN, SO IT IS NOT RESTATED HERE (round 6, plan 29-45 —
 * WR-01). `runAll()` tallies the suppressed occurrences per group at the point of suppression, out
 * of the same per-line matcher result the total above is accumulated from, and prints them beside
 * the total in the PASS line. Read the run.
 *
 * WHY THE SENTENCE WAS DELETED RATHER THAN CORRECTED, WHICH IS THE WHOLE FINDING. A per-group
 * breakdown used to be typed here, INSIDE a paragraph whose own opening sentence says the entrants
 * were derived through the gate's counter rather than read out of prose — and its three components
 * did not sum to the pin beside them. It was then corrected by hand and went stale AGAIN within two
 * plans, when the corpus widened and three terms became unconditional. A number restated in a
 * comment is a second declaration of a measurement, and a second declaration can only rot; the fix
 * is to move the number to the run, not to retype it a third time.
 *
 * WHAT THIS PIN IS A FUNCTION OF, NOW THAT IT IS NOT A FUNCTION OF ANYTHING ELSE. Exactly two
 * things, and a future editor of either should expect this number to move: (1) WHICH LITERALS ARE
 * PINNED — admitting a member that occurs inside the region raises this count while producing no
 * finding, which is how it last moved; and (2) WHERE THE REGION'S BOUNDARY FALLS — a heading landing
 * somewhere new changes which lines are inside it, which is how it moved the time before that.
 * Nothing else reaches it.
 * ------------------------------------------------------------------------------------------------
 */
export const BANNED_CLAIM_EXEMPT_SUPPRESSED = 14;

/**
 * The SAME total, broken out by group. A SECONDARY MEASURE, and this paragraph says what it is not.
 *
 * WHAT IT DOES. `BANNED_CLAIM_EXEMPT_SUPPRESSED` is one integer, so any substitution that preserves
 * the occurrence count passes it — including one that swaps a `comprehension` denial for a
 * `token-economy` assertion. Pinning the COMPOSITION reduces the admissible substitution class from
 * ANY-GROUP to SAME-GROUP.
 *
 * WHAT IT DOES NOT DO, STATED WITHOUT HEDGING BECAUSE THE ROUND-6 REVIEW SAYS SO EXPLICITLY: IT
 * DOES NOT CLOSE CR-01. A same-group substitution — the honest comprehension denial replaced by a
 * live comprehension claim, which is the exact plant both round-6 passes reproduced — moves neither
 * this breakdown nor the total. What closes CR-01 is `deriveExemptBlocks` above and the frozen-block
 * conjunction in `runAll`: a line lifts the prohibition only if its BYTES are frozen. This pin sits
 * beside that fix and is not it. A secondary measure presented as the fix is how a round ships a
 * heuristic wearing a structural fix's clothes.
 *
 * ITS VALUES ARE TAKEN FROM THE RUN, never from a plan document: the gate's own PASS line reported
 * `standard-name 8, token-economy 2, comprehension 4` on the live tree, and the sum is asserted
 * against `BANNED_CLAIM_EXEMPT_SUPPRESSED` so the two numbers cannot drift apart.
 */
export const BANNED_CLAIM_EXEMPT_COMPOSITION: readonly {
  readonly group: BannedClaimGroup;
  readonly count: number;
}[] = [
  { group: "standard-name", count: 8 },
  { group: "token-economy", count: 2 },
  { group: "comprehension", count: 4 },
];

/**
 * How far the one named exemption region REACHES, in lines — `endBefore - headingAt`.
 *
 * ---------------------------------------------------------------------------------------------
 * (Plan 29-32, variant C1 / T-29-23-05) A SECOND NUMBER, BESIDE THE ONE ABOVE, ANSWERING A
 * DIFFERENT QUESTION. THE TWO ARE NEVER FOLDED TOGETHER.
 *
 *   * `BANNED_CLAIM_EXEMPT_SUPPRESSED` asks HOW MANY banned claims sit inside the region.
 *   * this constant asks HOW FAR the region reaches.
 *
 * FOLDING ONE INTO THE OTHER WOULD RECREATE THE CONFLATION THIS ROUND EXISTS TO UNPICK. Round 2
 * dismissed variant C1 — an unterminated fence opened inside the region, with a real `## ` section
 * appended after it, so the fence-aware bound walks straight past that heading and the appended
 * section joins the exemption — as "nothing new", on the grounds that the reach pin above reds the
 * moment the swallowed text carries a banned claim. That is true and it is not the property. THE
 * REACH PIN MEASURES OCCURRENCES, AND A CARDINALITY IS BLIND TO MEMBERSHIP BY CONSTRUCTION: a
 * section swallowed into a safety exemption while carrying NO banned claim moves nothing the reach
 * pin can see, and the prohibition is then switched off over bytes nobody reviewed. This constant
 * is the number such a swallow moves.
 *
 * THE ACCEPTED COST, STATED RATHER THAN DISCOVERED. A line count moves when the disclaimer is
 * reflowed, which is exactly the objection recorded above for putting the REACH pin on lines. It is
 * the right objection and it does not transfer: reach is a question a line count answers badly,
 * while extent is a question ONLY a line count answers. So this pin will red on a deliberate edit
 * to the disclaimer, and that is the pin working. MOVING IT IS HOW YOU ACKNOWLEDGE AN EDIT YOU MADE
 * ON PURPOSE, NEVER HOW YOU CLEAR A FAILURE: an extent that has moved means the exemption now
 * covers different bytes than the ones it was measured over, so restore the region's boundary, or
 * re-measure deliberately and say in the commit which lines entered or left it. Do not widen the
 * pin until it stops firing.
 *
 * WHAT THIS PIN STILL CANNOT SEE, NAMED WITH ITS LIVE COUNTS RATHER THAN LEFT IMPLIED:
 *
 *   1. A SETEXT BOUNDARY (V-29-26-01). The shared authority recognises ATX headings only, so a
 *      `Heading` / `-------` pair does not end the region. Re-measured on the live exemption
 *      document: 0 setext level-two underlines in its body.
 *   2. AN INDENTED BOUNDARY (V-29-26-04). The delimiter class and the heading test are both
 *      column-zero anchored. Re-measured live: 0 indented fence delimiters against 4 column-zero
 *      ones in the exemption document.
 *
 * Both are tree-wide floors of the SHARED AUTHORITY, answered here exactly as they are answered for
 * every other consumer, and deliberately not repaired in the plan that measures them.
 *
 * ── WHAT LEFT THIS LIST IN ROUND 7 (plan 29-52, D-54), AND WHAT REPLACED IT ─────────────────────
 *
 * `V-29-32-01` — a CLOSED-fence, count-preserving swallow — used to head this list, and the entry
 * ended by saying that closing it "would need a CONTENT pin". Round 7 built one. `deriveExemptBlocks`
 * conjoins the suppression with membership of a registry-anchored, byte-frozen block, so bytes that
 * arrive in the region by ANY route — a swallow, an append past a bottom the region never had, or a
 * rigid translation — are not inside a frozen block, and a banned claim written on them is a finding.
 * That entry, `V-29-47-02` and `V-29-47-03` are SUBSUMED rather than pinned, and each was closed by
 * walking its own route on a hermetic mirror under the re-pin protocol.
 *
 * WHAT IS LEFT OF ALL THREE, STATED WITHOUT OVERSTATING THE CLOSURE: a swallow, an append or a
 * translation carrying NO BANNED CLAIM still moves nothing this gate can see, because this gate
 * decides banned claims and not section membership. That is a smaller and differently-shaped
 * residual than the one recorded — it can no longer switch the prohibition off over reviewed-looking
 * bytes, only enlarge a region whose extra bytes are scanned anyway — and it is carried in the
 * round-7 register with that narrowed wording. A permanent case in
 * scripts/check-banned-claims.test.ts asserts the narrowed half stays GREEN, so the remainder is a
 * measured property rather than a paragraph.
 *
 * The DIGEST objection is unchanged and is why the fix is a union of anchored blocks rather than a
 * whole-file hash: a frozen digest over a document authors legitimately edit is a false-red
 * generator, not a pin. 22 of the region's 66 lines are frozen; the other 44 stay freely editable
 * and are SCANNED.
 *
 * ── 62 -> 66 (plan 29-52, D-54). WHICH LINES ENTERED THE REGION, AND WHY. ────────────────────────
 *
 * FOUR ANCHOR LINES ENTERED AND NOTHING LEFT. `<!-- claim: C-28-043 -->` .. `<!-- claim: C-28-046 -->`
 * were inserted above the four paragraphs inside this region that carried a banned-claim occurrence
 * and sat inside NO registry-anchored block: the ASD-STE100 Issue 9 citation, the `UNKNOWN - verify`
 * trademark report, the caveman-as-token-economy disproof, and the comprehension-evidence denial.
 * That is the whole of the change to the document — `git diff` reports 0 modified lines and 4 added
 * ones — and it is what makes D-54's frozen-block conjunction below cover every suppressed
 * occurrence rather than nine of fourteen.
 *
 * THE NUMBER WAS TAKEN FROM THE GATE'S OWN REFUSAL, NOT PREDICTED INTO THIS LINE. The expectation
 * was 62 + 4; the run said `reaches 66 line(s), and BANNED_CLAIM_EXEMPT_EXTENT ... declares 62`, and
 * 66 is that measured number. `BANNED_CLAIM_EXEMPT_SUPPRESSED` did NOT fire in the same run, which
 * is the independent confirmation that an anchor line carries no banned literal.
 *
 * -- 66 -> 67 (plan 29-58, D-55). ONE LINE ENTERED, AND WHICH ONE. --------------------------------
 *
 * THE ENTRANT IS A WRAPPED LINE OF `C-28-042`'s OWN BLOCK, NOT A NEW SECTION. D-55 narrows the
 * profile's mechanism sentence to the predicate this gate publishes -- one physical line, a derived
 * document set, a pinned literal list, outside the registry-anchored blocks of this region -- and
 * the narrower claim is a longer sentence, so the block wraps to 6 lines where it wrapped to 5.
 * Nothing was added to the region and nothing was swallowed into it: the heading, the closing
 * boundary and the other five anchored blocks are where they were.
 *
 * THE NUMBER IS AGAIN THE GATE'S, NOT ARITHMETIC. On the PAIRED tree -- profile block and registry
 * verbatim moved together -- the run said `reaches 67 line(s), and BANNED_CLAIM_EXEMPT_EXTENT in
 * scripts/check-banned-claims.ts declares 66`, and 67 is that measured number. In the SAME run
 * `BANNED_CLAIM_EXEMPT_SUPPRESSED` and `BANNED_CLAIM_EXEMPT_COMPOSITION` did NOT fire, which is the
 * independent confirmation that the replacement sentence introduces no pinned literal: a longer
 * block that carried one would have moved the total and its per-group breakdown as well.
 * ---------------------------------------------------------------------------------------------
 */
export const BANNED_CLAIM_EXEMPT_EXTENT = 67;

// ---------------------------------------------------------------------------
// The scan.
// ---------------------------------------------------------------------------

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly literal: string;
  readonly group: BannedClaimGroup;
  readonly text: string;
  /**
   * (Plan 29-52, D-54) An overriding remedy, for the one finding class whose default remedy is
   * wrong. "Delete the claim" is right everywhere in the corpus except INSIDE the exemption region,
   * where a denial sentence is the thing that is supposed to be there — what is wrong is that its
   * bytes are not frozen. A remedy that tells an author to delete the disclaimer would be this
   * gate's own advice defeating the reason the exemption exists.
   */
  readonly remedy?: string;
}

/**
 * Every occurrence, not every line. Two banned literals sitting adjacently on one line produce TWO
 * findings, and the same literal twice on one line produces two — the hit count is arithmetic over
 * what was read, never a per-line boolean collapsed into one report.
 */
function occurrences(haystackLower: string, needleLower: string): number[] {
  const out: number[] = [];
  let i = haystackLower.indexOf(needleLower);
  while (i !== -1) {
    out.push(i);
    i = haystackLower.indexOf(needleLower, i + needleLower.length);
  }
  return out;
}

interface LineHit {
  readonly member: BannedClaimLiteral;
  /** 0-based offset of the occurrence within the line. */
  readonly at: number;
}

/**
 * Every banned-claim occurrence on ONE line, in literal declaration order then column order.
 *
 * ONE MATCHER, TWO CALLERS. The scan renders these as findings and the exemption's REACH counts
 * them. Written as two loops they would disagree the first time either moved, and the number
 * published for the exemption would then describe a prohibition nobody was applying — the same
 * two-grammar defect this file's locator was rewired to delete, one level down.
 *
 * A CO-OCCURRENCE ARM USED TO SIT HERE AND SKIP A MEMBER ON A LINE THAT CARRIED NO WORD FROM THAT
 * MEMBER'S OWN MARKER LIST. It went with the lists and with the field (round 6, D-48 / D-53; the
 * reasoning is at `BannedClaimLiteral`). Its removal makes this matcher report STRICTLY MORE and
 * never less: every line that produced a hit before produces the same hit now, and lines that were
 * skipped are now read. There is no direction in which deleting the arm can hide a finding.
 */
function lineHits(line: string): LineHit[] {
  const lower = line.toLowerCase();
  const out: LineHit[] = [];
  for (const member of BANNED_CLAIM_LITERALS) {
    for (const at of occurrences(lower, member.literal.toLowerCase())) {
      out.push({ member, at });
    }
  }
  return out;
}

/**
 * How many banned-claim occurrences fall in `lines[from, to)`.
 *
 * EXPORTED so a case can derive the exemption's reach INDEPENDENTLY of the run that publishes it. A
 * pin whose expected value is produced by the same statement as its actual value pins nothing.
 */
export function countBannedClaimOccurrences(
  lines: readonly string[],
  from: number,
  to: number,
): number {
  let n = 0;
  for (let i = Math.max(from, 0); i < Math.min(to, lines.length); i++) {
    n += lineHits(lines[i]).length;
  }
  return n;
}

/**
 * The same measurement as above, PROJECTED BY GROUP over `lines[from, to)`.
 *
 * (Round 6, plan 29-45 — WR-01.) EXPORTED FOR EXACTLY THE REASON `countBannedClaimOccurrences` IS,
 * and it stands in exactly the same relationship to `runAll()`. The gate accumulates its per-group
 * tally at the POINT OF SUPPRESSION, inside the scan loop, off the `lineHits` result it already
 * has — one traversal, no re-read. A case cannot assert against that accumulation using the
 * accumulation itself, so this is the independent statement it holds it against: a different fold,
 * over the same one matcher, with no rules of its own. That is the precise arrangement the reach
 * pin already uses, and it is why neither side is a second grammar.
 *
 * It is NOT a second walk with different rules and must never become one. If the two ever disagree,
 * the answer is that one of the two folds is wrong — never that this one should be relaxed.
 */
export function bannedClaimGroupTally(
  lines: readonly string[],
  from: number,
  to: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of BANNED_CLAIM_LITERALS) out[l.group] = 0;
  for (let i = Math.max(from, 0); i < Math.min(to, lines.length); i++) {
    for (const h of lineHits(lines[i])) out[h.member.group] += 1;
  }
  return out;
}

function renderFinding(f: Finding): string {
  return (
    `        ${f.file}:${f.line}:${f.column} — banned ${f.group} literal "${f.literal}" — ` +
    `${JSON.stringify(f.text)}\n` +
    `        Remedy: ${
      f.remedy ??
      `delete the claim. Do NOT add an exemption and do NOT narrow the scan set: ` +
        `there is exactly one named exemption region and BANNED_CLAIM_SCAN_COUNT is two-sided ` +
        `pinned, precisely so neither route to green is available`
    }`
  );
}

/**
 * The remedy for an occurrence INSIDE the region and OUTSIDE every frozen block (plan 29-52, D-54).
 *
 * THE FAIL-CLOSED DIRECTION, WRITTEN OUT RATHER THAN LEFT TO BE INFERRED. Under the conjunction, an
 * unfrozen line inside the carve-out is REPORTED. That is deliberate and it is the safe direction:
 * the alternative — exempting a line nothing freezes — is the hole this closes.
 */
const UNFROZEN_IN_REGION_REMEDY =
  `this line is INSIDE the one named exemption region and OUTSIDE every registry-anchored block, ` +
  `so it is not exempt. A denial belongs inside an anchored block with a row in ` +
  `docs/audit/28-claim-registry.md, never in an unanchored line of the region: add the anchor and ` +
  `its row in the SAME commit (D-01(a) / D-04), or delete the claim. Do NOT widen the region and do ` +
  `NOT relax the freeze — a carve-out bounded only by POSITION is the defect this conjunction closes`;

function runAll(): void {
  // ── THE PUBLISHED SENTENCE IS THE ONE THIS GATE DECIDES (round 8, D-55) ────────────────────────
  //
  // This line used to open with a quantifier over the whole shipped artifact and over the whole
  // user-facing document set, and to assert the ABSENCE OF A CLASS OF CLAIM. The mechanism below
  // decides something much smaller: whether a member of a pinned literal list occurs on ONE
  // physical line of a derived document set, outside the registry-anchored blocks of one named
  // region. The distance between those two statements is not a defect with a fix; it is an
  // unbounded class. Seven verification rounds each closed one axis of it — an unlisted benefit
  // verb, then an unlisted conformance verb, then a hard-wrapped multi-word literal — and each
  // closure exposed the next, because no matcher over free prose can satisfy a totality claim about
  // meaning.
  //
  // D-55 therefore moves the SENTENCE to the mechanism rather than the mechanism to the sentence. A
  // prohibition that publishes a wider scope than its mechanism is the exact defect LANG-04 exists
  // to prevent, and until this round LANG-04's own guard was committing it. Nothing about the
  // matcher changes here; what changes is what a green run is allowed to be read as.
  //
  // BOTH NUMBERS ARE INTERPOLATED, NEVER TYPED. A count typed into published prose has gone stale
  // at three addresses in this phase already. `bannedClaimScan()` is called here rather than the
  // derivation's pinned cardinality constant read (it is declared below, and this comment does not
  // spell it, so the count of that identifier's occurrences stays a count of its USE sites): the
  // constant is the PIN the derivation is asserted against below, and publishing the pin would
  // print the expectation in place of the measurement.
  //
  // The superseded sentence is deliberately not quoted here — these gates scan source text without
  // stripping comments, and this repository's retired-construct convention is to describe a removed
  // construct rather than re-register a live copy of it.
  process.stdout.write(
    `\n[guard_banned_claims] no single physical line of the ${bannedClaimScan().length} derived ` +
      `document(s) this gate scans carries any of the ${BANNED_CLAIM_LITERALS.length} pinned claim ` +
      `literal(s), outside the registry-anchored blocks of one named exemption region ` +
      `(LANG-04 / D-29, D-44)\n`,
  );

  for (const refusal of DERIVATION_REFUSALS) {
    fail(`banned-claim scan derivation refused: ${refusal}`);
  }

  // ── THE IMPORTED CHANNEL, REPORTED BY THE GATE THAT IS RUNNING (round 6, WR-05) ────────────────
  //
  // This gate's `publicDocs` part IS `publicDocsCorpus()`, derived in another module at IMPORT
  // time. A refusal raised there — an unreadable repository root, a walk that blew its budget, a
  // missing `agent-factory/README.md` — used to be reported by neither runner: not by that module,
  // which is not the process running, and not by this one, which never asked. The verdict stayed
  // fail-closed and the DIAGNOSIS was lost.
  //
  // TWO LOOPS, TWO PREFIXES, AND THE ARRAYS ARE NEVER CONCATENATED. A refusal raised here and one
  // raised there have different remedies — fix a document this gate derives, versus fix a document
  // another module derives — and a reader who cannot tell which module refused has to open both
  // files to find out. Merging them would save four lines and cost exactly that.
  //
  // WHY IT SITS HERE AND NOT LOWER. The per-part vacuity floor and the aggregate cardinality pin
  // both run immediately below, and the pin's own remedy text tells an author to walk every part's
  // derivation. A derivation that REFUSED is precisely what that instruction would otherwise omit,
  // so the diagnosis is printed before the symptom it explains.
  for (const refusal of publicDocsDerivationRefusals()) {
    fail(
      `public-document corpus derivation refused (raised in ` +
        `scripts/check-public-docs-vocabulary.ts, while deriving the public documents this gate ` +
        `consumes): ${refusal}`,
    );
  }

  // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN. A floor over the concatenated total could be
  // reached by one part while the other emptied out entirely, and the gate would report a verdict
  // over a corpus half of which it never opened.
  for (const part of BANNED_CLAIM_SCAN_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the banned-claim scan set derived ZERO members — refusing to ` +
          `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
          `passes every guard. This floor is per-part on purpose: any one part could empty out ` +
          `while the total still cleared a floor written over the concatenation`,
      );
    }
  }

  const scan = bannedClaimScan();
  const overlap = bannedClaimScanOverlap();

  // TWO-SIDED PIN, worded so that moving it is visibly not the remedy.
  if (scan.length !== BANNED_CLAIM_SCAN_COUNT) {
    fail(
      `the banned-claim scan set derived ${scan.length} document(s), expected exactly ` +
        `${BANNED_CLAIM_SCAN_COUNT} (${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `overlap ${overlap}) — walk every part's derivation and the BANNED_CLAIM_EXCLUDED_LOCATIONS ` +
        `reasons BEFORE updating BANNED_CLAIM_SCAN_COUNT in scripts/check-banned-claims.ts. A new ` +
        `kit document is supposed to enter this scan by existing; moving the pin is how you ` +
        `acknowledge that it did, not how you make the failure go away`,
    );
  }

  // THE EXEMPTION REGION IS ASSERTED UP FRONT, NOT INSIDE THE SCAN LOOP.
  //
  // Located inside the loop, the assertion could only fire while the exempt FILE was a member of
  // the scan — so deleting the file outright skipped every one of its refusals, and the only thing
  // left naming the loss was the aggregate pin, which says "one document short" and never says
  // which document or that the disclaimer is gone. A vanished exemption file is not an absent
  // exemption; it is the disclaimer that has to exist for the prohibition to be writable at all.
  let exemptRegion: ExemptRegion | null = null;
  // ── ONE READ OF THE EXEMPTION DOCUMENT, AND EVERY QUESTION BELOW IS ASKED OF IT ────────────────
  //
  // WHAT MAKES THE INVARIANT TRUE, rather than merely asserted: `exemptText` is ONE assembly of the
  // document, `locateExemptRegion` measures the region's indices over THAT assembly, and the scan
  // loop below spends those indices against THAT SAME assembly — it does not read the file again.
  //
  // WHY THE LOOP'S SECOND READ WAS A DEFECT AND NOT A REDUNDANCY (round 6, WR-02). The loop used to
  // re-read every scan member including this one, split that second read, and index the resulting
  // array with `headingAt` / `endBefore` measured over the first. That is the same coordinate shear
  // `locateExemptRegion`'s `scanLines.length !== lines.length` refusal exists to make unreachable,
  // and that refusal could not see it: both arrays were internally consistent, and simply were not
  // the same document. A refusal comparing two assemblies cannot catch a case where only one of
  // them was ever handed to it.
  //
  // THE BOUND ON THE SUBSTITUTION, WHICH IS THE HALF THAT IS EASY TO GET WRONG. The cached text is
  // taken ONLY when the read that produced it succeeded, so `exemptReadOk` is a conjunct of the
  // loop's selection rather than the filename alone. Keyed on the filename alone, the selection
  // hands the loop an empty string on every path where the read did not happen: zero lines, zero
  // findings, and one increment of `visited` — a silently short scan wearing the shape of a
  // one-read fix, and one that clears the vacuity floor because the denominator still counts it.
  let exemptText = "";
  // Raised beside the read that justifies it, and never initialised true. This is the flag the
  // selection above is conjoined with.
  let exemptReadOk = false;
  const exemptAbs = abs(BANNED_CLAIM_EXEMPT_REGION.file);
  if (!existsSync(exemptAbs)) {
    fail(
      `the document carrying the one named exemption region, ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.file}\`, does not exist at ${exemptAbs}. That document is ` +
        `the disclaimer this prohibition is only writable because of — ${BANNED_CLAIM_EXEMPT_REGION.reason}. ` +
        `A missing exemption document is refused by name here, because every other document is ` +
        `still scanned and the loss would otherwise read as a clean run`,
    );
  } else {
    // PRESENT IS NOT THE SAME QUESTION AS READABLE, and `existsSync` only answers the first. A
    // directory at this path, a broken permission or an I/O error makes `readFileSync` RAISE rather
    // than return, and an unguarded raise here dies inside `runAll` — a stack trace where this gate
    // has committed to producing a verdict. Refused by name instead.
    try {
      exemptText = readFileSync(exemptAbs, "utf8");
      exemptReadOk = true;
    } catch (e) {
      fail(
        `the document carrying the one named exemption region, ` +
          `\`${BANNED_CLAIM_EXEMPT_REGION.file}\`, exists at ${exemptAbs} but could not be read ` +
          `(${(e as Error).message}). The exemption region is therefore NOT located and the ` +
          `document is scanned whole, so this refusal is fail-CLOSED — nothing is under-reported. ` +
          `The remedy is to fix the file, never to relax the exemption`,
      );
    }
    if (exemptReadOk) {
      exemptRegion = locateExemptRegion(exemptText.split("\n"));
    }
  }

  // ── THE CONTENT BOUND, DERIVED ONCE AND OVER THE SAME ASSEMBLY (plan 29-52, D-54) ──────────────
  //
  // Derived here rather than inside the loop for the same reason the region is: a derivation inside
  // the loop could only run while the exempt file was a member of the scan, so a vanished document
  // would skip every one of its refusals. It is derived over `exemptText.split("\n")` — the SAME
  // array `locateExemptRegion` was handed and the SAME array the loop spends the indices against.
  let exemptBlocks: ExemptBlockSet | null = null;
  if (exemptReadOk && exemptRegion !== null) {
    exemptBlocks = deriveExemptBlocks(
      ROOT,
      exemptText,
      exemptText.split("\n"),
      exemptRegion,
    );
    for (const r of exemptBlocks.refusals) fail(r);
  }
  // FAIL-CLOSED WHEN THE DERIVATION DID NOT HAPPEN. An empty set exempts nothing, so every
  // occurrence inside the region is reported. There is no path on which a failure here widens the
  // carve-out.
  const exemptLineSet: ReadonlySet<number> =
    exemptBlocks?.lines ?? new Set<number>();

  // The findings, in derived-sorted scan order, then by line, then by literal declaration order.
  const findings: Finding[] = [];
  let visited = 0;
  // The exemption's REACH, accumulated at the point where the suppression actually happens. Derived
  // afterwards by a second traversal it would be a different question asked of the same bytes, and
  // this file has just finished deleting one of those.
  let suppressed = 0;
  // …AND THE SAME MEASUREMENT, PROJECTED BY GROUP (round 6, plan 29-45 — WR-01).
  //
  // ONE TRAVERSAL, ONE MATCHER CALL, TWO PROJECTIONS. This is filled from the SAME `lineHits` result
  // the total above consumes, on the same pass over the same bytes — never by walking the region a
  // second time. A second walk would be a different question asked of the same lines, and the two
  // answers would part company the first time either moved.
  //
  // It is seeded from the literal list rather than from the tally loop, so a group whose count is
  // ZERO is still PUBLISHED as zero. A tally that simply omitted an empty group would publish a
  // shorter breakdown that still summed correctly, and a reader could not tell an absent group from
  // a group nobody counted.
  const suppressedByGroup = new Map<BannedClaimGroup, number>(
    BANNED_CLAIM_LITERALS.map((l) => [l.group, 0]),
  );

  // Which members the canonical-form assertion applies to, DERIVED from the part rather than from
  // the extension. `?? []` is fail-open by construction only if the part vanished — and a vanished
  // part is already a named refusal and a vacuity red above, so the empty set here cannot be the
  // only thing that noticed.
  const manifestMembers = new Set(
    BANNED_CLAIM_SCAN_PARTS.find((p) => p.name === "pluginManifests")
      ?.members ?? [],
  );

  for (const file of scan) {
    let text: string;
    // The exempt member takes the text its region's indices were MEASURED over, and takes it only
    // when that read succeeded. See the ONE-READ block above for why both halves are load-bearing.
    if (file === BANNED_CLAIM_EXEMPT_REGION.file && exemptReadOk) {
      text = exemptText;
    } else {
      try {
        text = readFileSync(abs(file), "utf8");
      } catch (e) {
        // A stack trace is not a verdict. The file is NOT counted as visited, so the shared vacuity
        // rule's denominator floor reports the short scan by name.
        fail(
          `${file} is a member of the banned-claim scan set and could not be read ` +
            `(${(e as Error).message}) — refusing to report a verdict over a document that was ` +
            `never opened. A missing document is not a clean one`,
        );
        continue;
      }
    }
    visited += 1;

    // ── THE CANONICAL-FORM ASSERTION, ON THE BYTES THE SCAN JUST READ (round 7, CR-02) ─────────
    //
    // The membership question is asked of the PARTS ARRAY rather than of the path's extension, so
    // the predicate's input is the derived part and never a second rule about what a manifest is.
    if (manifestMembers.has(file)) {
      for (const refusal of manifestCanonicalFormRefusals(file, text)) {
        fail(refusal);
      }
    }

    const lines = text.split("\n");
    const region =
      file === BANNED_CLAIM_EXEMPT_REGION.file ? exemptRegion : null;

    for (let i = 0; i < lines.length; i++) {
      // The matcher runs on EVERY line, including exempt ones. An exempt line that skipped it would
      // be an exemption whose reach nothing could measure, which is a hole with a comment on it.
      const hits = lineHits(lines[i]);
      // ── THE CARVE-OUT'S TWO HALVES, CONJOINED (plan 29-52, D-54) ───────────────────────────
      //
      // THE POSITIONAL HALF — `inRegion` — is what D-48 and D-53 decided, unchanged: the region is a
      // file, a section and a reason, and a line outside it is never exempt.
      //
      // THE CONTENT HALF — `exemptLineSet.has(i)` — is what round-6 CR-01 showed the positional half
      // lacks: the line's bytes must sit inside a registry-anchored block that still matches its row.
      // Neither half is sufficient. The region says WHERE a denial may be written; the freeze says
      // WHICH BYTES were reviewed when the exemption was granted.
      //
      // THE CONSEQUENCE, NAMED RATHER THAN LEFT TO BE INFERRED: an occurrence inside the region and
      // outside every frozen block is REPORTED, with `UNFROZEN_IN_REGION_REMEDY`. That is the
      // fail-closed direction — the alternative is exempting a line nothing froze, which is the hole.
      const inRegion =
        region !== null && i >= region.headingAt && i < region.endBefore;
      if (inRegion && exemptLineSet.has(i)) {
        suppressed += hits.length; // inside the region AND inside a frozen anchored block
        // The projection, off the SAME `hits` array — not a re-read of the line.
        for (const h of hits) {
          suppressedByGroup.set(
            h.member.group,
            (suppressedByGroup.get(h.member.group) ?? 0) + 1,
          );
        }
        continue;
      }
      for (const h of hits) {
        findings.push({
          file,
          line: i + 1,
          column: h.at + 1,
          literal: h.member.literal,
          group: h.member.group,
          text: lines[i].trim(),
          ...(inRegion ? { remedy: UNFROZEN_IN_REGION_REMEDY } : {}),
        });
      }
    }
  }

  // THE EXEMPTION'S REACH IS PINNED TWO-SIDED, MEASURED AT THE POINT OF SUPPRESSION.
  //
  // Guarded on a located region: when the region refused, `suppressed` is zero for a reason that has
  // already been reported by name, and a second refusal saying the exemption shrank would name the
  // wrong cause.
  if (exemptRegion !== null && suppressed !== BANNED_CLAIM_EXEMPT_SUPPRESSED) {
    fail(
      `the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` suppressed ${suppressed} banned-claim ` +
        `occurrence(s), and BANNED_CLAIM_EXEMPT_SUPPRESSED in scripts/check-banned-claims.ts ` +
        `declares ${BANNED_CLAIM_EXEMPT_SUPPRESSED}. An exemption GROWING is a decision, recorded ` +
        `here with its reason — never a side effect of a heading landing somewhere new, which is ` +
        `exactly how this region grew once already without anything noticing. An exemption ` +
        `SHRINKING is equally a change somebody made. Read the region, say in the commit which ` +
        `claim entered or left it, and then move the constant; do not move the constant to make ` +
        `this line go away`,
    );
  }

  // ── THE COMPOSITION PIN — A SECONDARY MEASURE, NOT THE FIX (plan 29-52, D-54) ────────────────
  //
  // Two-sided per group, and the SUM is asserted against the total so the two numbers cannot drift
  // apart. Its limitation is written at its declaration and is repeated here in one line because a
  // reader meets the assertion before the constant: this narrows the admissible substitution class
  // from any-group to same-group, and the thing that closes CR-01 is the frozen-block conjunction in
  // the loop above.
  if (exemptRegion !== null) {
    let declaredSum = 0;
    for (const c of BANNED_CLAIM_EXEMPT_COMPOSITION) {
      declaredSum += c.count;
      const live = suppressedByGroup.get(c.group) ?? 0;
      if (live !== c.count) {
        fail(
          `the one named exemption region suppressed ${live} \`${c.group}\` occurrence(s), and ` +
            `BANNED_CLAIM_EXEMPT_COMPOSITION in scripts/check-banned-claims.ts declares ` +
            `${c.count}. This pin is a SECONDARY measure: it reduces the substitution class from ` +
            `any-group to same-group and does NOT close CR-01 — a same-group swap moves neither ` +
            `this number nor the total, which is why the frozen-block conjunction exists. Say in ` +
            `the commit which claim entered or left this group, then move the entry`,
        );
      }
    }
    if (declaredSum !== BANNED_CLAIM_EXEMPT_SUPPRESSED) {
      fail(
        `BANNED_CLAIM_EXEMPT_COMPOSITION sums to ${declaredSum} and ` +
          `BANNED_CLAIM_EXEMPT_SUPPRESSED declares ${BANNED_CLAIM_EXEMPT_SUPPRESSED}. A breakdown ` +
          `that loses a group takes that group's occurrences out of the measurement with it and ` +
          `every remaining per-group equality still holds — the set-literal-drift class one level ` +
          `up. Walk the groups before treating either number as the one to move`,
      );
    }
  }

  // ── THE REGION'S BOUNDARY MUST NOT HAVE BEEN DECIDED BY AN UNCLOSED FENCE ────────────────────
  //
  // FOUND BY ATTACKING THIS PLAN'S OWN EXTENT PIN, AND CLOSED RATHER THAN RECORDED. The extent pin
  // below is a NUMBER, and a number is blind to membership by construction — this repository has
  // now paid for that sentence twice. A COUNT-PRESERVING COMPENSATING EDIT defeats it outright:
  // delete seven neutral lines from inside the disclaimer, append a seven-line section behind a
  // fence opened inside the region and never closed, and the region reaches exactly as far as it
  // did, suppresses exactly as many occurrences as it did, and has quietly swallowed a section
  // nobody reviewed. Measured on a hermetic mirror of the live tree, both pins stayed green and the
  // gate exited 0.
  //
  // SO THE SWALLOW IS ALSO CHECKED WHERE IT HAPPENS, NOT ONLY BY ITS SIZE. A region whose LAST LINE
  // is inside a fenced block did not end at a heading; it ended because the document ran out while
  // a fence was still open, and every heading between the open delimiter and end of file was hidden
  // from the bound. That is the swallow, stated structurally, and it is decided from the ONE fence
  // toggle this module already imports — no heading pattern is declared here, no delimiter class is
  // re-declared, no second projection of the document is built, and no delimiter PARITY is counted
  // (plan 29-28 measured what parity cannot see: two errors that cancel).
  //
  // IT DOES NOT REFUSE THE LEGITIMATE CASE, WHICH IS THE HALF THAT MAKES IT USABLE. A `## ` line
  // QUOTED inside a properly closed fenced example is documentation, the region deliberately
  // continues past it (WR-06, plan 29-18), and the lines following that example's close are outside
  // any fence — so the region's last line is unflagged and this check is silent. Re-measured on the
  // live exemption document: zero fenced lines inside the region at all.
  //
  // THE ONE FALSE-RED SHAPE, NAMED: a disclaimer whose region ENDS exactly on a fenced example's
  // closing delimiter, with no line after it before the next heading. The refusal says so, and the
  // remedy is one blank line — an authoring fix, not a reason to weaken the check.
  if (exemptRegion !== null) {
    const exemptFlags = fencedLineFlags(exemptText);
    if (exemptFlags[exemptRegion.endBefore - 1] === true) {
      fail(
        `the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
          `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` ENDS INSIDE A FENCED BLOCK — its last line ` +
          `(line ${exemptRegion.endBefore}) is flagged by the shared fence toggle. A region that ` +
          `ends inside a fence did not end at a heading: it ended because the document ran out ` +
          `while a fence was still open, so every heading between that open delimiter and end of ` +
          `file was invisible to the bound and every section after it has been SWALLOWED into a ` +
          `safety exemption. Close the fence. This is checked separately from the extent pin below ` +
          `because a swallow paired with a compensating deletion moves no number at all. If the ` +
          `region legitimately ends on a fenced example's closing delimiter, put one blank line ` +
          `after it; do not delete this check`,
      );
    }
  }

  // THE EXEMPTION'S EXTENT IS PINNED TWO-SIDED, BESIDE THE REACH AND NEVER FOLDED INTO IT.
  //
  // The reach above asks HOW MANY banned claims the region lifts the prohibition on. This asks HOW
  // FAR the region reaches. They are different questions and a swallow moves only the second: an
  // unterminated fence opened inside the region makes the fence-aware bound walk straight past the
  // heading that should have ended it, and an appended section carrying NO banned claim joins the
  // exemption without moving a single occurrence count. Round 2 dismissed that variant on the
  // grounds that the reach pin covers it. It does not, and it cannot: a cardinality is blind to
  // membership by construction.
  //
  // Guarded on a located region for the same reason the reach pin is — when the region refused, a
  // second refusal about its size would name the wrong cause.
  const exemptExtent =
    exemptRegion === null ? 0 : exemptRegion.endBefore - exemptRegion.headingAt;
  if (exemptRegion !== null && exemptExtent !== BANNED_CLAIM_EXEMPT_EXTENT) {
    fail(
      `the one named exemption region \`${BANNED_CLAIM_EXEMPT_REGION.file}\` § ` +
        `\`${BANNED_CLAIM_EXEMPT_REGION.heading}\` reaches ${exemptExtent} line(s), and ` +
        `BANNED_CLAIM_EXEMPT_EXTENT in scripts/check-banned-claims.ts declares ` +
        `${BANNED_CLAIM_EXEMPT_EXTENT}. An extent that has moved means the exemption now ` +
        `covers different bytes than the ones it was measured over — which is what a section ` +
        `SWALLOWED into the region looks like when it carries no banned claim of its own, and ` +
        `therefore moves no occurrence count. The fix is to restore the region's boundary (look ` +
        `first for a fence opened inside the region and never closed, which walks the bound past ` +
        `the heading that should have ended it), or to re-measure deliberately and say in the ` +
        `commit which lines entered or left the region. Do NOT widen the pin until it stops firing`,
    );
  }

  // The shared element-level vacuity rule (AP-1). This gate declares no zero check of its own; the
  // measurement is a required argument, so a PASS line cannot be printed over a loop that never ran.
  FAILS += reportMeasured(
    {
      label: "banned claims",
      visited,
      expected: scan.length,
      findings,
    },
    { pass, fail },
    renderFinding,
  );

  if (FAILS === 0) {
    // ── THE CLAUSE THAT REPORTED CONDITIONAL MEMBERS IS DELETED, NOT EMPTIED (round 6, AP-1) ────
    //
    // A PASS line must never state a check the gate did not perform. A clause counting and
    // rendering members of a shape the TYPE no longer admits has no subject: it could only ever
    // print zero, and a permanently-zero clause on a green run reads as a live check. So it went
    // with the mechanism it described. (What was removed is described rather than quoted, per this
    // repository's retired-construct convention: these gates scan source text without stripping
    // comments, so a verbatim quotation of a deleted construct re-registers as a live site of it.)
    //
    // WHAT THE PASS LINE NOW CLAIMS, AND IT IS THE WHOLE OF WHAT THE GATE DID: a count of documents
    // read with the per-part breakdown, the size of the pinned literal list and how many groups it
    // spans, the one named exemption region with its reason and its two pinned numbers, and the
    // size of the admission log. Every number is read from the run that just happened.
    pass(
      `LANG-04: ${scan.length} document(s) carry zero banned claim literal outside the one named ` +
        `exemption region — ${BANNED_CLAIM_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `overlap ${overlap}; ${BANNED_CLAIM_LITERALS.length} pinned literal(s) across ` +
        `${new Set(BANNED_CLAIM_LITERALS.map((l) => l.group)).size} group(s), matched ` +
        `UNCONDITIONALLY — the gate enumerates what is banned and nothing about how it is said; ` +
        `1 exemption region (${BANNED_CLAIM_EXEMPT_REGION.file} § ${BANNED_CLAIM_EXEMPT_REGION.heading} ` +
        `— ${BANNED_CLAIM_EXEMPT_REGION.reason}), which suppresses ${suppressed} banned-claim ` +
        // THE BREAKDOWN IS PUBLISHED, NOT RESTATED (round 6, plan 29-45 — WR-01). A total whose
        // components nobody can see is a number a reader has to trust; rendered per group beside it,
        // the arithmetic can be checked by hand against the region, which is what makes a fabricated
        // component visible. This is the same argument D-08 makes for the voice guard's per-block
        // line, and the components come from the run's own tally rather than from a comment.
        `occurrence(s) (${[...suppressedByGroup.entries()]
          .map(([g, n]) => `${g} ${n}`)
          .join(", ")}), pinned at ${BANNED_CLAIM_EXEMPT_SUPPRESSED}, and reaches ` +
        `${exemptExtent} line(s), pinned at ${BANNED_CLAIM_EXEMPT_EXTENT} (two numbers, two ` +
        `questions: how much prohibition the region lifts, and how far it reaches — a section ` +
        `swallowed into it moves only the second); ` +
        // THE THIRD NUMBER, ANSWERING THE QUESTION NEITHER CARDINALITY ASKS (plan 29-52, D-54):
        // WHICH BYTES. Published for the same reason the breakdown above is — a content bound
        // nobody can see is a bound a reader has to trust — and it is what makes the sentence at
        // the head of this run true of any tree it passes.
        `every suppressed occurrence sits inside one of ${exemptBlocks?.ids.length ?? 0} ` +
        `registry-anchored block(s) [${(exemptBlocks?.ids ?? []).join(", ")}] frozen byte-for-byte ` +
        `against docs/audit/28-claim-registry.md, pinned at ${BANNED_CLAIM_EXEMPT_ANCHORS}, ` +
        `covering ${exemptLineSet.size} of the region's ${exemptExtent} line(s) — the other ` +
        `${exemptExtent - exemptLineSet.size} stay freely editable and are SCANNED, so a claim ` +
        `written on one of them is a finding (the carve-out is bounded in POSITION and in CONTENT); ` +
        `${BANNED_CLAIM_EXCLUDED.length} candidate ` +
        `literal(s) refused at admission and recorded with their hit counts`,
    );
  }

  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-banned-claims.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
