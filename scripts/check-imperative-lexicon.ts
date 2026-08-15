// check-imperative-lexicon.ts — Phase 29 controlled-language gate (LANG-01, LANG-02, LANG-04).
//
// Ships TWO named predicates over ONE derived corpus, because naming one guard for three unrelated
// predicates re-creates at the output line exactly the defect LANG-04 exists to fix (D-39, D-11):
//
//   [guard_imperative_lexicon]  a `## Steps` bullet begins with an approved verb at position zero.
//   [guard_sentence_form]       sentence length by section anchor, plus four banned constructions.
//
//   node scripts/check-imperative-lexicon.js
// Exit 0 = both predicates hold over the whole governed corpus; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHAT THIS GATE IS NOT, STATED FIRST BECAUSE IT IS THE THING A READER WILL ASSUME.
//
// IT DOES NOT ENFORCE CONFORMANCE WITH ANY PUBLISHED CONTROLLED-LANGUAGE STANDARD, and it must
// never be described as doing so. It decides a small, named, decidable subset: membership of a
// closed verb set at one syntactic position, two sentence-length bounds selected by section anchor,
// and four closed-token-set constructions. `agent-factory/writing-profile.md` is the contract; the
// rule ids `WP-01`..`WP-08` this gate cites are that document's, so a finding points a reader at
// the rule it broke. The conformance prohibition itself is mechanical and lives in a different
// gate — scripts/check-banned-claims.ts.
//
// ---------------------------------------------------------------------------------------------
// THIS MODULE DECLARES NO SECOND FENCE MACHINE, NO SECOND VACUITY RULE, AND NO SECOND CORPUS WALK.
//
// The tree carries exactly THREE fence state machines, derived and pinned in
// scripts/frontmatter.test.ts, and plan 29-01 spent a task DELETING the two that had drifted apart.
// This gate needs per-LINE fence knowledge (it reports `file:line`), and it gets it from
// `fencedLineFlags` in scripts/frontmatter.ts — the same toggle `stripFencedBlocks` is now a
// projection of. One machine, two projections, no fourth grammar.
//
// The element-level vacuity rule is plan 29-01's `reportMeasured`, folded ONCE PER PREDICATE. This
// module declares no `if (n === 0)` check of its own: the measurement is a required argument, so a
// PASS line here cannot state a check that visited nothing.
//
// The workflow part of the corpus is `listWorkflows()` from scripts/kit-model.ts, not a second
// directory walk — deriving membership twice is how two derivations come to disagree.
//
// The Technical Names half is `listRoleDisplayNames()` / `listWorkflowDisplayNames()`, added in the
// same plan for exactly this consumer (D-40) and pinned two-sided in `guard_kit_counts`.
//
// The modal token set and the copula token set are taken WHOLE from scripts/voice-model.ts. They
// are not filtered, sliced or re-declared here: a filtered copy of one list is a second list, and a
// second list is how the one list goes stale.
//
// ---------------------------------------------------------------------------------------------
// PASSIVE VOICE IS DELIBERATELY NOT BANNED (D-15) — A DECISION WITH A REASON, NOT AN OMISSION.
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │ BOUNDARY WARNING. Do not add a passive-voice check to this gate.                              │
// │                                                                                               │
// │ The kit's own correct prose is saturated with the passive, and much of it is correct BECAUSE  │
// │ it is passive — a rule about what must be true of an artifact has no actor to name. A passive  │
// │ detector would therefore go red across large volumes of accurate text, and the only route      │
// │ back to green would be tuning the detector until it stopped noticing. That is a gate that      │
// │ measures its own tolerance rather than the corpus, and it is the heuristic-strict-subset shape │
// │ this repository has closed at eight rounds three separate times.                               │
// │                                                                                               │
// │ agent-factory/writing-profile.md records the same decision in its own prose, under             │
// │ § Deliberate omissions, so it is met as a decision rather than rediscovered as an oversight.   │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
//
// ---------------------------------------------------------------------------------------------
// RECORDED RESIDUALS, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// THE NUMBERING STARTS AT 2, AND THE GAP IS A DECISION RATHER THAN A DELETION (plan 29-24, WR-04).
// Residual 1 recorded that a step written as prose with no list marker was not seen, and that
// widening the predicate to every line under `## Steps` would report the section's own explanatory
// prose as non-conforming steps. That statement and this gate's own behaviour had come to
// contradict each other: the set-equality refusal below REDs a `## Steps` section that contributes
// no bullet, which is exactly the shape the residual documented as out of scope. A guard whose
// enforcement and whose documentation give opposite answers for an ordinary authoring shape is not
// enforcing the subset it names, which is the standard LANG-04 applies to everything else here.
//
// THE HUMAN DECIDED, AND THE ANSWER IS THE RULE RATHER THAN THE WIDENED PREDICATE. The residual is
// RETIRED and its replacement is published where an author will meet it: `WP-11` in
// agent-factory/writing-profile.md, "A steps section carries at least one list item." The predicate
// is unchanged — a paragraph under `## Steps` is still not measured as a step — and the denominator
// is still the HEADING scan rather than the bullet loop, which is the independence WR-02 landed.
// What changed is that the refusal now names the rule, so a red tells an author what to write
// instead of only what the gate computed. Measured on the live corpus before the retirement:
// 19 of 19 governed files carrying a `## Steps` heading contribute at least one list item, so the
// published rule was already satisfied at every member and zero verdicts moved.
//
// The remaining residuals KEEP their original numbers. Renumbering them would silently rewrite
// every reference to them, and a reader meeting a gap here meets a decision with its reason.
//
// 2. THE SENTENCE SPLIT IS LINE-ORIENTED. A sentence hard-wrapped across a line boundary is
//    measured as two short sentences rather than one long one, so it can pass a length bound it
//    would breach if joined. Joining lines before splitting would merge list items, table rows and
//    headings into sentences nobody wrote, which is the larger error.
//
// 3. `guard_sentence_form`'s modal arm is BROADER THAN WP-05'S ORIGINAL WORDING and the profile was
//    aligned to the shipped predicate rather than the reverse. The set is voice-model.ts's closed
//    `modal` category taken whole; filtering it to an "obligation" subset would have created a
//    second modal list in the tree. The broader direction reds more text and never less, which is
//    the safe direction for a gate whose corpus is about to be rewritten anyway.
//
// 4. A FOUR-SPACE-INDENTED CODE BLOCK DONATES STEP BULLETS, AND THE ONE FENCE AUTHORITY CANNOT SEE
//    IT (plan 29-24, WR-09). `LIST_MARKER` and `ORDERED_MARKER` are depth-unbounded, which round 1
//    made them so a CommonMark sub-bullet under a numbered step is measured rather than skipped
//    (CR-03). An INDENTED code block carries no delimiter, so `fencedLineFlags` reports its lines
//    unfenced and the marker test is asked of them exactly as if they were steps. A shell
//    transcript written as an indented block under `## Steps` therefore donates phantom bullets,
//    and `ORDERED_MARKER` decides `procedural` with no section anchor at all, so an indented
//    numbered line ANYWHERE in the corpus takes the 20-word bound.
//
//    THE REASON THIS IS RESIDUAL AND NOT FIXED IS A DEPENDENCY CONFLICT, NOT A DIFFICULTY
//    JUDGEMENT. The structural remedy — teaching the one fence authority the indented-code-block
//    form, so `is this line documentation` has a single answer for both spellings — makes every
//    line indented four or more spaces documentation. A CommonMark sub-bullet under a numbered step
//    IS indented four or more spaces, so that change reverses CR-03 for this same guard and stops
//    measuring the very bullets round 1 shipped a fix to reach. Two shipped requirements cannot
//    both hold under it. Resolving that is a behaviour change to the shared authority with its own
//    corpus measurement, and it belongs in a plan that owns both requirements.
//
//    THE DIRECTION IS FAIL-CLOSED: a false red on correct text, never a silent pass. Measured on
//    the live corpus at plan 29-24: ZERO indented list-marker lines under any `## Steps` heading and
//    ZERO indented ordered-marker lines anywhere in the 47 governed documents, so the admission has
//    an empty input set on the shipped tree. The verdict is nonetheless PINNED by a permanent case
//    in scripts/check-imperative-lexicon.test.ts, so this disclosure is a measurement rather than a
//    belief.
//
//    WHAT WOULD FORCE THE PROMOTE: the first governed workflow that legitimately carries an
//    indented code block under a `## Steps` heading. At that point the residual has a live victim,
//    the two requirements have to be reconciled rather than ordered, and the fix moves into the
//    shared authority.
//
// A green run here says what these two predicates measured, and nothing wider.
//
// ---------------------------------------------------------------------------------------------
// THE D-24 RED TRANSCRIPTS — both predicates were watched FAILING against the real tree before a
// single word of the corpus was rewritten, because a guard that passes the moment it appears has
// never been watched fail. Measured 2026-08-13 on the tree at HEAD,
// `node scripts/check-imperative-lexicon.js`:
//
//   [guard_imperative_lexicon]
//
//     finding kind             count  what it is
//     ----------------------   -----  --------------------------------------------------------
//     bold-label                  41  `**Deterministic prefetch.** Before the model writes …`
//     actor-subject               15  `BA/PM defines the product — recording the product …`
//     determiner-subject          15  `The Orchestrator pulls the ticket into development …`
//     not-an-approved-verb         7  `Tickets are written to \`plans/tickets/\` and a …`
//     conditional-clause           3  `When the behavior is unclear, the System Analyst …`
//     ----------------------   -----  --------------------------------------------------------
//     TOTAL                       81  over 125 `## Steps` bullets in 19 files (findings in 16)
//
//   [guard_sentence_form]
//
//     rule    finding kind                      count
//     -----   -------------------------------   -----
//     WP-03   descriptive-sentence-too-long       127
//     WP-02   procedural-sentence-too-long         86
//     WP-06   bare-demonstrative-subject           33
//     WP-05   modal-in-procedural-step             15
//     WP-08   more-than-one-instruction             3
//     WP-07   and-slash-or                          0
//     -----   -------------------------------   -----
//     TOTAL                                       264  over 1,816 sentences (236 procedural,
//                                                      1,580 descriptive) in 47 files, findings
//                                                      in 32 of them
//
//   exit code 1 — 2 CHECK(S) FAILED, one measured block per predicate
//
// RECONCILED AGAINST 29-RESEARCH §A-10, BECAUSE THE TWO SETS OF NUMBERS ARE NOT THE SAME QUESTION
// AND A LATER READER WOULD OTHERWISE READ THE DIFFERENCE AS A DEFECT. The research reports "273
// sentences over 20 words, 190 over 25". Those are ONE sentence set measured at TWO thresholds, so
// they OVERLAP; the numbers above are two DISJOINT arms selected by section anchor (WP-04), which
// is what D-35 actually ships. Asked the research's question of this same corpus with this same
// counter, this gate's inputs give 269 over 20 words and 188 over 25 — the four- and two-sentence
// differences are exactly the multi-word Technical Names that count as one term here and as N words
// there. The research figure is reproduced; it is simply not the figure a two-bound rule reports.
//
// Plans 29-08 through 29-12 land the rewrites that turn both of these green. A red build on this
// gate before then is the ACCEPTANCE EVIDENCE for Phase 28's D-24, not a regression.
//
// The durable half is scripts/check-imperative-lexicon.test.ts. Once the corpus conforms, the tree
// can no longer reproduce a RED, so every shape above is planted into a hermetic mirror — together
// with the clean-mirror GREEN control, without which a RED verdict proves nothing at all.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// The ONE fence state machine, asked per line so a finding can carry its source line number, and
// the ONE section-locator authority (plan 29-20) this module now asks EVERY section-extent question
// of. It declares no heading-equality test and no section-end predicate of its own.
import {
  fencedLineFlags,
  unfencedHeadingIndex,
  sectionEndIndex,
} from "./frontmatter.js";
// The workflow corpus and the two display-name derivations (D-40). MAX_WALK_ENTRIES is the walk's
// WORK bound, taken from the one place this repository declares it.
import {
  listWorkflows,
  listRoleDisplayNames,
  listWorkflowDisplayNames,
  MAX_WALK_ENTRIES,
} from "./kit-model.js";
// The shared element-level vacuity rule (AP-1, plan 29-01), folded once per predicate.
import { reportMeasured } from "./vacuity.js";
// Two CLOSED token sets, taken whole. Never filtered, never re-declared.
import { BANNED_CONSTRUCTIONS } from "./voice-model.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror. The truthiness ternary, not
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

/** Exported accessor so a later aggregator can fold these verdicts without a shared global. */
export const imperativeLexiconFails = (): number => FAILS;

const MARKDOWN_EXT = ".md";
const WORKFLOWS_DIR = "agent-factory/workflows";
const CHECKLISTS_DIR = "agent-factory/checklists";
const SEED_DIR = "agent-factory/seed";
const CONTRACTS_DIR = "agent-factory/contracts";

// ---------------------------------------------------------------------------
// THE DERIVED EXCLUSION (D-42) — a MARKER, never a filename.
//
// One kit file is machine-generated: agent-factory/checklists/security-nfr-checklist.md, 89,840
// bytes, 82% of its directory, and 345 rows copied verbatim from a third-party standard. A style
// pass over it would (a) be reverted on the next `npm run generate:asvs` run, (b) falsify the
// document's own verbatim-copy claim, and (c) triple this gate's denominator so the reported
// numbers stopped meaning anything.
//
// THE EXCLUSION IS DERIVED FROM THE MARKER THE GENERATOR WRITES, and the excluded set's cardinality
// is asserted TWO-SIDED. That assertion is the whole point: a SECOND generated kit file arriving
// later would otherwise vanish from the denominator in complete silence. Excluding by filename
// would be the hand-listed set-literal this milestone exists to delete.
// ---------------------------------------------------------------------------
export const GENERATED_MARKER = "GENERATED";
/** How many lines of a file's opening region carry the generator's marker, if it has one. */
const GENERATED_MARKER_SCAN_LINES = 20;
/** Two-sided. One generated kit document today. */
export const GENERATED_EXEMPT_COUNT = 1;

// ---------------------------------------------------------------------------
// THE LOCATIONS EXCLUDED BY NAME, WITH THEIR REASONS — never by silent omission.
//
// These are DOCUMENTATION ABOUT THE KIT rather than instructions an agent executes, which is the
// line D-36 draws. They are structurally outside the four parts below (nothing walks them), and the
// reason is recorded here and named inline in the PASS line so a reader meets it rather than
// inferring it from a directory's absence.
// ---------------------------------------------------------------------------
export const GOVERNED_CORPUS_EXCLUDED_LOCATIONS: readonly {
  readonly location: string;
  readonly label: string;
  readonly reason: string;
}[] = [
  {
    location: "agent-factory/packaging/",
    label: "packaging documents",
    reason:
      "adapter, subagent-frontmatter and slash-command templates describe how the kit is PACKAGED " +
      "for a host tool. They are documentation about the kit, not instructions an agent executes, " +
      "and several are literal frontmatter specimens whose bytes are the subject",
  },
  {
    location: "agent-factory/config/factory.config.md",
    label: "the config-dial documentation",
    reason:
      "reference documentation for every dial in factory.config.json. It is documentation about " +
      "the kit rather than a procedure, and its rows are key definitions rather than steps",
  },
  {
    location: "agent-factory/roles/",
    label: "the role corpus",
    reason:
      "the roles are governed by guard_voice, guard_caveman_voice and guard_role_clause_uniqueness " +
      "in scripts/check-foundation-guards.ts. A second predicate over the same bytes from a second " +
      "module is how two gates come to disagree about one corpus",
  },
];

// Refusals raised while DERIVING the corpus. Collected rather than thrown: this is a GATE, and a
// gate's floor is to REPORT (the kit-model throw-versus-report split).
const DERIVATION_REFUSALS: string[] = [];

// Recursively enumerate every file under a scan entry. Directory entries are `.sort()`ed so two
// runs over one tree are byte-identical. The budget counts entries EXAMINED, so the bound limits
// WORK and is independent of the tree's shape. A truncated corpus passes every guard exactly the
// way a vacuous one does, so an overflow is a named refusal and never a short return.
function walkFiles(
  rel: string,
  budget: { examined: number },
  acc: string[],
): string | null {
  const a = abs(rel);
  if (!existsSync(a)) return null;
  const st = statSync(a);
  if (st.isDirectory()) {
    for (const entry of readdirSync(a).sort()) {
      budget.examined += 1;
      if (budget.examined > MAX_WALK_ENTRIES) {
        return (
          `the walk of ${rel} examined more than MAX_WALK_ENTRIES=${MAX_WALK_ENTRIES} directory ` +
          `entries, reaching ${join(rel, entry)} — refusing to continue and refusing to report a ` +
          `verdict over the members collected so far, because a truncated scan set passes every ` +
          `guard exactly the way a vacuous one does`
        );
      }
      const refusal = walkFiles(join(rel, entry), budget, acc);
      if (refusal !== null) return refusal;
    }
  } else if (st.isFile()) {
    acc.push(rel);
  }
  return null;
}

/** Markdown directly in `dir`, sorted. Used for the two flat parts. */
function flatMarkdown(dir: string): string[] {
  const a = abs(dir);
  if (!existsSync(a)) {
    DERIVATION_REFUSALS.push(
      `the governed-corpus directory ${dir} does not exist at ${a} — refusing to report a verdict ` +
        `over a part whose directory could not be read. A missing directory is not an empty one`,
    );
    return [];
  }
  return readdirSync(a)
    .filter((f) => f.endsWith(MARKDOWN_EXT))
    .filter((f) => {
      try {
        return statSync(join(a, f)).isFile();
      } catch {
        return false; // a vanished entry between the readdir and the stat is a race, not a member
      }
    })
    .sort()
    .map((f) => `${dir}/${f}`);
}

/** The workflow part, through the ONE workflow derivation. */
function workflowMembers(): string[] {
  try {
    return listWorkflows(ROOT).map((f) => `${WORKFLOWS_DIR}/${f}`);
  } catch (e) {
    DERIVATION_REFUSALS.push(
      `the workflow part could not be derived through kit-model's listWorkflows() — ` +
        `${(e as Error).message}`,
    );
    return [];
  }
}

/** The seed-template part: markdown anywhere under agent-factory/seed/, walked. */
function seedMembers(): string[] {
  const acc: string[] = [];
  const refusal = walkFiles(SEED_DIR, { examined: 0 }, acc);
  if (refusal !== null) DERIVATION_REFUSALS.push(refusal);
  return acc.filter((f) => f.endsWith(MARKDOWN_EXT)).sort();
}

/** True when the file's opening region carries the generator's marker. */
function isGenerated(rel: string): boolean {
  try {
    return readFileSync(abs(rel), "utf8")
      .split("\n")
      .slice(0, GENERATED_MARKER_SCAN_LINES)
      .some((l) => l.includes(GENERATED_MARKER));
  } catch {
    return false; // an unreadable file is reported by the read loop, never silently exempted
  }
}

// The CANDIDATE corpus, before the derived exclusion. Kept as its own value so the exclusion can be
// measured rather than assumed: the excluded set is `candidates minus members`, so its cardinality
// is arithmetic over what was read.
const CANDIDATE_PARTS: readonly {
  readonly name: "workflows" | "checklists" | "seedTemplates" | "contracts";
  readonly members: readonly string[];
}[] = [
  { name: "workflows", members: workflowMembers() },
  { name: "checklists", members: flatMarkdown(CHECKLISTS_DIR) },
  { name: "seedTemplates", members: seedMembers() },
  { name: "contracts", members: flatMarkdown(CONTRACTS_DIR) },
];

/** Every candidate carrying the generator's marker, in candidate order. */
export const GENERATED_EXEMPT: readonly string[] = CANDIDATE_PARTS.flatMap((p) =>
  [...p.members].filter(isGenerated),
);

/**
 * The four named parts, AFTER the derived exclusion.
 *
 * The per-part vacuity floor below is evaluated over THESE, and it is per-part on purpose: a floor
 * written over the concatenated total could be cleared by three parts while the fourth vanished
 * entirely, and the gate would report a verdict over a corpus a quarter of which it never opened.
 */
export const GOVERNED_CORPUS_PARTS: readonly {
  readonly name: "workflows" | "checklists" | "seedTemplates" | "contracts";
  readonly members: readonly string[];
}[] = CANDIDATE_PARTS.map((p) => ({
  name: p.name,
  members: p.members.filter((m) => !GENERATED_EXEMPT.includes(m)),
}));

/** The concatenation, in part order. */
export function governedCorpus(): string[] {
  return GOVERNED_CORPUS_PARTS.flatMap((p) => [...p.members]);
}

/**
 * The pinned cardinality. 47 today: 19 workflows + 13 hand-authored checklists + 13 seed templates
 * + 2 contracts.
 *
 * TWO-SIDED. A corpus that silently SHRANK reports a clean pass over the documents it stopped
 * reading; one that silently GREW is a scan nobody reviewed.
 */
export const GOVERNED_CORPUS_COUNT = 47;

// ---------------------------------------------------------------------------
// APPROVED_STEP_VERBS — the CLOSED verb set (WP-01).
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │ BOUNDARY WARNING — THE ADMISSION TEST FOR THIS LIST.                                          │
// │                                                                                               │
// │ A member must be a verb a grugops procedural step ALREADY USES in bare imperative position.    │
// │ A candidate whose admission would require deleting or reshaping correct text does not belong   │
// │ here — the rule scripts/dead-vocabulary.ts already wrote, applied from the positive side.      │
// │                                                                                               │
// │ THIS IS NOT A FREQUENCY CUTOFF, AND ONE IS NOT AVAILABLE. Measured over the governed corpus:   │
// │ 222 distinct first words across 421 bullets, 176 of them occurring exactly once, and the nine  │
// │ most frequent are all NON-VERBS (`The` 69, `A` 25, `BA` 16 …). Restricted to `## Steps`, 59 of │
// │ 84 first words are hapax. The distribution has NO HEAD TO ADOPT, so any cutoff either admits   │
// │ almost nothing or admits almost everything.                                                    │
// │                                                                                               │
// │ So this is the move that closed three earlier multi-round problems in this repository: DECLARE │
// │ THE CANONICAL FORM AND REFUSE EVERYTHING OUTSIDE IT. A step bullet has one legal shape and     │
// │ conformance is MEASURED against it, rather than a parser being widened once per counter-       │
// │ example until it accepts everything.                                                           │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
//
// Every member below is attested in this corpus in bare imperative position, and every member is
// one-meaning-and-one-part-of-speech, which is the determinism mechanism this profile actually
// adopts.
// ---------------------------------------------------------------------------
export const APPROVED_STEP_VERBS: readonly string[] = [
  "Append",
  "Apply",
  "Assemble",
  "Assess",
  "Attach",
  "Capture",
  "Claim",
  "Clarify",
  "Compile",
  "Confirm",
  "Create",
  "Degrade",
  "Distill",
  "Draft",
  "Emit",
  "Escalate",
  "Establish",
  "Hand",
  "Identify",
  "Implement",
  "List",
  "Mark",
  "Meet",
  "Obtain",
  "Produce",
  "Promote",
  "Propose",
  "Pull",
  "Read",
  "Recommend",
  "Reconcile",
  "Record",
  "Run",
  "Seed",
  "Set",
  "Size",
  "Split",
  "Transition",
  "Update",
  "Validate",
  "Verify",
  "Walk",
  "Write",
];

const APPROVED_STEP_VERBS_LOWER = new Set(
  APPROVED_STEP_VERBS.map((v) => v.toLowerCase()),
);

// The two sentence-length bounds (WP-02, WP-03). Two numbers, selected by section anchor (WP-04),
// which is decidable with no tuning and no per-sentence heuristic.
export const PROCEDURAL_SENTENCE_MAX_WORDS = 20;
export const DESCRIPTIVE_SENTENCE_MAX_WORDS = 25;

// ---------------------------------------------------------------------------
// The line grammar. Every construct below is a bounded quantifier over a single character class,
// and every split is `String.prototype.split` rather than a match-all regex — the superlinear
// backtracking incident recorded in project memory (a 0.47 s guard that took 383 s) is DORMANT, not
// fixed, and a prose scanner over 47 files is exactly where it creeps back in.
//
// Declared HERE, above the derivations that consume it, because the Technical Names parts below are
// evaluated at module load and a `const` referenced before its initializer is a temporal-dead-zone
// throw — which this gate would report as a derivation refusal rather than as the wiring error it is.
// ---------------------------------------------------------------------------

/**
 * An ATX heading line — "IS THIS LINE A HEADING AT ALL", which is a THIRD question and is kept.
 *
 * This decides that a heading is not prose: a heading is never a sentence and never a step, so the
 * line is skipped before any sentence split. That is not the section-extent question
 * (`sectionEndIndex`) and not the anchor question (`STEPS_HEADING`), and the difference is stated
 * here so a later reader does not "unify" three predicates of which only two were ever the same.
 *
 * AND IT IS THE ONE SURVIVING MEMBER OF PLAN 29-22'S DERIVED LOCATOR-SITE SCAN OVER THIS MODULE,
 * RECORDED HERE RATHER THAN LEFT FOR A TREE-WIDE DERIVATION TO TRIP OVER. That classifier's third
 * construct is `CLOSE by heading PREFIX`, spelled `/\^#\{?[\d,]*\}?[ \\]/`, and it cannot tell a
 * section terminator from a heading RECOGNISER — both are `/^#{n,m} /`. Measured at plan 29-24 with
 * that classifier over this module: FOUR sites before the rewire (`HEADING_LINE`,
 * `SECTION_HEADING_LINE`, `unfencedIndexOf`'s equality and `tableFirstCellsUnderHeading`'s
 * `startsWith("## ")` close) and ONE after — this line. Plan 29-24's own acceptance criterion says
 * the answer here must be ZERO; measured, it is ONE, and the one is the predicate the same plan
 * instructs this module to KEEP. Plan 29-25, which extends the scan tree-wide, therefore needs a
 * stated exemption for a heading RECOGNISER rather than a widened classifier, exactly as plan 29-23
 * recorded for `check-banned-claims.ts`'s heading COUNT.
 */
const HEADING_LINE = /^#{1,6} /;
/**
 * The section anchor that makes a bullet procedural (WP-04) — WHICH heading opens the section.
 *
 * This is this module's own legitimate question and it stays here. Where the section it opens ENDS
 * is a different question, and that one is answered by `sectionEndIndex` in scripts/frontmatter.ts
 * (plan 29-24, WR-08). The private `SECTION_HEADING_LINE = /^#{1,2} /` that used to sit below this
 * line was a fourth section-extent grammar in a tree that had unified the other three, and it is
 * DELETED. Its behaviour is preserved exactly: `sectionEndIndex(..., 2)` closes on a heading of
 * level at most two, so a `### ` under `## Steps` still STRUCTURES the section rather than leaving
 * it — which matters because treating every heading as an exit silently releases every bullet below
 * the first sub-heading, with no number moving anywhere to say so.
 */
const STEPS_HEADING = /^## Steps\s*$/;
/**
 * THE RESIDUAL'S MECHANISM: a steps heading at ANY ATX level, and one at an UNDECIDED level (WR-05).
 *
 * `STEPS_HEADING` above decides level two and nothing else, and `WP-11`/`WP-04` are published at
 * exactly that spelling. Every other spelling is a DISCLOSED FLOOR: a `# Steps` or `### Steps`
 * section carrying no list item is outside the rule, and no gate decides it. A floor recorded only
 * in prose becomes live the first time somebody writes the shape, silently — which is how every
 * latent fail-open this phase found got here. These two patterns turn it into a number that moves.
 *
 * THREE PATTERNS, NOT TWO AND A SUBTRACTION. `ANY` and `UNDECIDED` are written independently and the
 * decided level is counted by `STEPS_HEADING` itself, so `any === decided + undecided` is a PREMISE
 * the gate asserts rather than a definition it cannot violate. A tally derived by subtracting one
 * count from another can only ever agree with itself, and agreement with itself is what the round-3
 * review charged against the last tally that audited its own loop.
 *
 * DISCLOSED LIMIT, STATED RATHER THAN REPAIRED. Both patterns see ATX headings at column zero only,
 * because that is the disclosed floor of every heading consumer in this tree (V-29-26-01). A setext
 * steps heading — `Steps` followed by a `---` rule — is invisible here exactly as it is to
 * `unfencedHeadingIndex`, `sectionEndIndex` and the caveman reader. Repairing it is a tree-wide
 * change to the shared locator and is deliberately not attempted from this module.
 */
const STEPS_HEADING_ANY_LEVEL = /^#{1,6} Steps\s*$/;
const STEPS_HEADING_UNDECIDED_LEVEL = /^(?:#|#{3,6}) Steps\s*$/;
/**
 * An ordered or unordered list marker at the head of a line, AT ANY INDENTATION DEPTH.
 *
 * THE LEADING BOUND IS A POSITION QUESTION, NOT A CHARACTER QUESTION (CR-03). A bound of three
 * leading spaces is not a stricter rule — it is a rule that is never ASKED of a CommonMark
 * sub-bullet, which is indented four or more under a numbered step. The guard's banner claims every
 * `## Steps` bullet is measured; a depth bound makes that claim false for a construct the kit's own
 * workflows are free to use, and makes it false INVISIBLY, because an uncounted bullet is also
 * absent from the denominator that would have reported the loss.
 *
 * The class is the TWO CHARACTERS space and tab rather than the general whitespace class `\s`, and
 * the reason is recorded so it is not "simplified" later: `\s` also matches a line terminator and a
 * range of Unicode spaces, while the predicate here is leading indentation ON A SINGLE LINE.
 * CommonMark indentation is spaces or tabs, so those are the two characters, and admitting a line
 * terminator into a leading-indent class would let the marker test reach across a line boundary.
 *
 * The quantifier is unbounded over a TWO-CHARACTER class that cannot match a newline, applied per
 * line — no match-all regex and no nested quantifier, because the superlinear-backtracking incident
 * recorded in project memory (a 0.47 s guard that took 383 s) is DORMANT, not fixed. The trailing
 * whitespace requirement after the marker is deliberately byte-unchanged: the only thing this
 * widening moves is the DEPTH.
 */
const LIST_MARKER = /^[ \t]*(?:[-*+]|\d{1,3}[.)])\s+/;
/**
 * An ORDERED list marker specifically — a numbered procedural line (WP-04).
 *
 * Carries the IDENTICAL widening, and must: this decides `procedural` independently of the section
 * anchor, so a depth bound here would reclassify an indented numbered step exactly the way the
 * unordered bound reclassified an indented bullet.
 */
const ORDERED_MARKER = /^[ \t]*\d{1,3}[.)]\s+/;
/** A markdown table rule row, tested on the TRIMMED line as one anchored class. */
const TABLE_RULE_BODY = /^[\s:|-]+$/;
function isTableRule(trimmed: string): boolean {
  return trimmed.startsWith("|") && TABLE_RULE_BODY.test(trimmed);
}
/** Sentence terminators followed by whitespace. Fixed-width lookbehind; nothing to backtrack over. */
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

/** Unwrap code spans. The contents are the words a reader reads; the backticks are not. */
const unwrapCodeSpans = (s: string): string => s.replace(/`([^`]*)`/g, "$1");

/** Strip leading and trailing non-letters, for comparing a token against a closed word set. */
const bareWord = (w: string): string =>
  w.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z]+$/, "");

// ---------------------------------------------------------------------------
// TECHNICAL_NAMES (LANG-01 / D-13, as corrected by D-40) — DERIVED FROM THE KIT, NEVER PASTED.
//
// Five sources, each already the authority for its own half of the kit:
//   • role display names        — kit-model's listRoleDisplayNames()      (17 today)
//   • workflow display names    — kit-model's listWorkflowDisplayNames()  (19 today)
//   • config keys               — the SHIPPED agent-factory/config/factory.config.json (21 today)
//   • note kinds                — the context-note contract's six-kind table (6 today)
//   • board columns             — the seed board's column table (13 today)
//
// WHERE THE SET IS ACTUALLY USED, stated so it is not decoration:
//   (1) `guard_imperative_lexicon` reads a first token that is a Technical Name as an ACTOR SUBJECT
//       rather than as an unrecognised word. It is still a finding — WP-01 admits a verb at
//       position zero and nothing else — but the finding NAMES the shape, so the remedy is
//       "re-narrate the step as an instruction" rather than "add this word to the verb list".
//   (2) `guard_sentence_form` counts a MULTI-WORD Technical Name as ONE term. This is the standard's
//       own documented extension point for subject-specific nouns used as designed: `Security audit
//       (OWASP ASVS)` is one concept, and charging a sentence four words for naming it once would
//       penalise using the kit's own vocabulary correctly. This use is load-bearing — it moves
//       sentences across the length bounds — which is what keeps the derivation honest.
// ---------------------------------------------------------------------------

const CONFIG_JSON = "agent-factory/config/factory.config.json";
const NOTE_CONTRACT = "agent-factory/contracts/context-note.md";
const NOTE_KINDS_HEADING = "## The six note kinds";
const BOARD = "agent-factory/seed/plans/board.md";
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";

/** A markdown table's first cell, unwrapped from backticks and bold. Empty when the row has none. */
function firstCell(row: string): string {
  const cells = row.split("|");
  if (cells.length < 2) return "";
  return cells[1]
    .trim()
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .trim();
}

function derivedNamePart(
  name: string,
  derive: () => string[],
): { name: string; members: string[] } {
  try {
    return { name, members: derive() };
  } catch (e) {
    DERIVATION_REFUSALS.push(
      `the "${name}" part of the Technical Names set could not be derived — ${(e as Error).message}`,
    );
    return { name, members: [] };
  }
}

function configKeys(): string[] {
  const a = abs(CONFIG_JSON);
  if (!existsSync(a)) throw new Error(`${CONFIG_JSON} does not exist at ${a}`);
  const parsed: unknown = JSON.parse(readFileSync(a, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`${CONFIG_JSON} did not parse to an object`);
  }
  return Object.keys(parsed as Record<string, unknown>).sort();
}

// ---------------------------------------------------------------------------
// THE TWO TABLE LOCATORS, BOTH DECIDED BY THE SINGLE SHARED AUTHORITY (WR-06, as corrected by
// WR-08 in plan 29-24).
//
// THE CLAIM THIS BLOCK USED TO MAKE WAS WIDER THAN THE ASSERTION BEHIND IT, AND THE CORRECTION IS
// THE POINT OF THIS NOTE. It said these two scans were "the last place in this module that answered
// a SECTION-EXTENT question with a SECOND GRAMMAR". They were not: `deriveElements`' step anchor
// carried a private `SECTION_HEADING_LINE = /^#{1,2} /` reset, a THIRD grammar over the same
// question, and it sat below this paragraph the whole time round 1 was congratulating itself. A
// prose claim wider than the assertion behind it is this repository's recorded second systemic
// failure class wearing a sentence instead of a set literal, and it is corrected here rather than
// quietly overwritten.
//
// ALL THREE ARE NOW DELETED. `unfencedHeadingIndex` answers which line is the anchor and
// `sectionEndIndex` answers where the section ends, both from scripts/frontmatter.ts, both composed
// on the ONE fence toggle. The fence delimiter class is not re-declared here, and there is no
// parameter that asks for the old behaviour, because an opt-out is a second grammar with extra
// steps.
//
// THE NORMALIZATION AXIS MOVED, AND THAT IS THE AXIS THE FOUR DELETED PREDICATES DISAGREED ON. The
// helper this replaces compared a line to the heading with EXACT equality; the authority compares
// `trimEnd()`. So a heading carrying one trailing space is now FOUND where it used to be missed —
// a real widening, and the one the round-2 review tabulated as the disagreement nobody had pinned.
// `TECHNICAL_NAMES_COUNT` is re-derived after the change and is required to stay at 76: if it
// moved, one of the two table sources carries a trailing-whitespace heading and the movement is
// REPORTED with its cause, never absorbed.
//
// NOT CURRENTLY REACHABLE ON THE LIVE CORPUS, AND FIXED ANYWAY. Both documents carry zero fenced
// heading lines and zero fenced table rows today, re-derived at execution rather than assumed — so
// this change is provably behaviour-preserving and its proof is therefore a PLANTED input, never a
// moved number. It is fixed because the phase's thesis is that a second grammar over the same bytes
// is a defect even while the two grammars agree, and because THIS SET IS LOAD-BEARING: countWords
// collapses a multi-word Technical Name to ONE term, so a term injected by a fenced example or
// dropped by a fenced heading moves sentences across the length bounds and changes verdicts in a
// guard that never mentions tables at all.
// ---------------------------------------------------------------------------

/** Every first cell of the table under a named `## ` heading, up to where the SHARED authority ends it. */
function tableFirstCellsUnderHeading(rel: string, heading: string): string[] {
  const a = abs(rel);
  if (!existsSync(a)) throw new Error(`${rel} does not exist at ${a}`);
  const text = readFileSync(a, "utf8");
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const at = unfencedHeadingIndex(text, heading);
  if (at === -1) throw new Error(`${rel} carries no \`${heading}\` heading`);
  // The section's END, from the authority. The private `startsWith("## ")` break that used to sit
  // in this loop is DELETED. The authority closes on a heading of level AT MOST two, so a `# ` now
  // ends the section where the deleted test walked straight past it — the CR-02 axis, one module
  // over, and the reason the two locators are unified rather than corrected in place.
  const end = sectionEndIndex(text, at + 1, 2);
  const out: string[] = [];
  for (let i = at + 1; i < end; i++) {
    if (flags[i]) continue; // a fenced line is an example: it neither ends the section nor donates a row
    const row = lines[i].trim();
    if (!row.startsWith("|")) continue;
    if (isTableRule(row)) continue;
    const cell = firstCell(lines[i]);
    if (cell === "" || cell.toLowerCase() === "kind") continue;
    out.push(cell);
  }
  return out;
}

/**
 * Every first cell of the board's column table, located by its exact UNFENCED header row.
 *
 * THE ANCHOR GOES TO THE AUTHORITY; THE TERMINATOR DELIBERATELY DOES NOT, AND THE DIFFERENCE IS
 * STATED SO A LATER READER DOES NOT UNIFY TWO PREDICATES THAT WERE NEVER THE SAME. The authority
 * answers "the first unfenced line whose trimmed text equals this string", which is exactly what
 * finding the header row is — the operand happens to be a table header rather than a heading, and
 * the question is identical. But the loop below terminates at THE FIRST LINE THAT IS NOT A TABLE
 * ROW, which is asking where a TABLE ends, not where a SECTION ends. A table can end long before
 * its section does, and replacing this with `sectionEndIndex` would harvest every later table in
 * the same section as board columns.
 */
function boardColumns(): string[] {
  const a = abs(BOARD);
  if (!existsSync(a)) throw new Error(`${BOARD} does not exist at ${a}`);
  const text = readFileSync(a, "utf8");
  const flags = fencedLineFlags(text);
  const lines = text.split("\n");
  const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
  if (at === -1) {
    throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  }
  const out: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    // A FENCED LINE IS SKIPPED RATHER THAN TREATED AS THE TABLE'S END. The end test below is
    // "the first line that is not a row", and a fenced example's delimiter is not a row — so
    // without this the table would end at an example that merely sits inside it.
    if (flags[i]) continue;
    const row = lines[i].trim();
    if (!row.startsWith("|")) break;
    if (isTableRule(row)) continue;
    const cell = firstCell(lines[i]);
    if (cell !== "") out.push(cell);
  }
  return out;
}

export const TECHNICAL_NAME_PARTS: readonly {
  readonly name: string;
  readonly members: readonly string[];
}[] = [
  derivedNamePart("roleDisplayNames", () => listRoleDisplayNames(ROOT)),
  derivedNamePart("workflowDisplayNames", () => listWorkflowDisplayNames(ROOT)),
  derivedNamePart("configKeys", configKeys),
  derivedNamePart("noteKinds", () =>
    tableFirstCellsUnderHeading(NOTE_CONTRACT, NOTE_KINDS_HEADING),
  ),
  derivedNamePart("boardColumns", boardColumns),
];

/** The deduped union, longest first so a longer name is matched before a prefix of it. */
export function technicalNames(): string[] {
  const seen = new Set<string>();
  for (const part of TECHNICAL_NAME_PARTS) {
    for (const m of part.members) if (m !== "") seen.add(m);
  }
  return [...seen].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export const TECHNICAL_NAMES: readonly string[] = technicalNames();

/**
 * The pinned cardinality of the deduped union. 76 today: 17 role display names + 19 workflow
 * display names + 21 config keys + 6 note kinds + 13 board columns, with no member shared by two
 * sources. TWO-SIDED, for the same reason every other set here is.
 */
export const TECHNICAL_NAMES_COUNT = 76;

/**
 * THE WORD COUNT, DECIDED ONCE AND USED EVERYWHERE.
 *
 * Unwrap code spans, collapse every multi-word Technical Name to a single placeholder token, split
 * on whitespace, count non-empty tokens. Stated here rather than at each call site so two arms
 * cannot come to disagree about what a word is.
 */
export function countWords(sentence: string): number {
  let t = unwrapCodeSpans(sentence);
  for (const name of TECHNICAL_NAMES) {
    if (name.indexOf(" ") === -1) continue; // a one-word name already counts as one word
    while (t.includes(name)) t = t.replace(name, "TECHNICALNAME");
  }
  return t.split(/\s+/).filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// The two element derivations. Both walk the corpus ONCE, together, so the two predicates cannot
// come to disagree about which lines are fenced, which section a line is in, or where a line is.
// ---------------------------------------------------------------------------

interface StepBullet {
  readonly file: string;
  readonly line: number;
  /** The bullet text with its list marker stripped. */
  readonly text: string;
}

interface Sentence {
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly procedural: boolean;
}

interface CorpusElements {
  readonly bullets: StepBullet[];
  readonly sentences: Sentence[];
  /**
   * Governed files in which a `## Steps` HEADING was seen — recorded from the HEADING branch, NOT
   * from finding a bullet beneath it (WR-02).
   *
   * THIS IS THE POINT OF THE FIELD: it is produced by a code path the bullet loop does not run, so
   * it can disagree with the bullet loop's own attribution. A denominator taken from the bullet
   * array instead would make a corpus in which seventeen files stopped producing step bullets
   * indistinguishable, in the gate's published output, from one in which every file still does.
   */
  readonly stepsFiles: string[];
  /**
   * THE DISCLOSED FLOOR, AS A NUMBER (WR-05). Steps headings across the governed corpus counted by
   * ATX level: `any` at any level, `decided` at the level `WP-11` and `WP-04` are published for, and
   * `undecided` at every other level. `undecidedSites` names them so the refusal can point at a file
   * and a line rather than at a total.
   *
   * The three counts come from three independent patterns over the same fence-aware lines, so
   * `any === decided + undecided` is a premise the gate checks. `anchors` is the count the
   * `stepsRanges` loop below produced from `STEPS_HEADING`, kept separately so the tally and the
   * loop it sits beside can be made to disagree.
   */
  readonly stepsHeadings: {
    readonly any: number;
    readonly decided: number;
    readonly undecided: number;
    readonly anchors: number;
    readonly undecidedSites: string[];
  };
  /** Files actually opened. Short of the corpus size means a member could not be read. */
  readonly filesRead: number;
  readonly unreadable: string[];
}

/**
 * The per-document steps-heading tally, DERIVED SEPARATELY FROM THE LOOP IT AUDITS.
 *
 * This walks the lines a second time on purpose. Folding it into the `stepsRanges` loop would make
 * the decided count a restatement of that loop's own control flow — the tally would report what the
 * loop did rather than what the document says, and the two could never disagree. Independence is the
 * whole value: the gate asserts the two agree, and an assertion between a value and itself is not
 * one.
 *
 * Fence-awareness comes from the shared toggle. A `## Steps` written inside a fenced example in a
 * workflow is documentation about the kit and must not enter either tally, exactly as it must not
 * open a governed step section.
 */
function tallyStepsHeadings(
  file: string,
  text: string,
  flags: readonly boolean[],
): {
  any: number;
  decided: number;
  undecided: number;
  undecidedSites: string[];
} {
  let any = 0;
  let decided = 0;
  let undecided = 0;
  const undecidedSites: string[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (flags[i]) continue;
    const raw = lines[i];
    if (STEPS_HEADING_ANY_LEVEL.test(raw)) any += 1;
    if (STEPS_HEADING.test(raw)) decided += 1;
    if (STEPS_HEADING_UNDECIDED_LEVEL.test(raw)) {
      undecided += 1;
      undecidedSites.push(`${file}:${i + 1} \`${raw.trim()}\``);
    }
  }
  return { any, decided, undecided, undecidedSites };
}

function deriveElements(corpus: readonly string[]): CorpusElements {
  const bullets: StepBullet[] = [];
  const sentences: Sentence[] = [];
  const unreadable: string[] = [];
  const stepsFiles: string[] = [];
  const stepsHeadings = {
    any: 0,
    decided: 0,
    undecided: 0,
    anchors: 0,
    undecidedSites: [] as string[],
  };
  let filesRead = 0;

  for (const file of corpus) {
    let text: string;
    try {
      text = readFileSync(abs(file), "utf8");
    } catch (e) {
      unreadable.push(`${file} (${(e as Error).message})`);
      continue;
    }
    filesRead += 1;

    const flags = fencedLineFlags(text);
    const lines = text.split("\n");

    // THE RESIDUAL'S TALLY, taken over the same fence-aware lines by its own three patterns.
    const tally = tallyStepsHeadings(file, text, flags);
    stepsHeadings.any += tally.any;
    stepsHeadings.decided += tally.decided;
    stepsHeadings.undecided += tally.undecided;
    stepsHeadings.undecidedSites.push(...tally.undecidedSites);

    // THE STEP SECTION'S EXTENT, COMPUTED PER FILE BY THE SHARED AUTHORITY (plan 29-24, WR-08).
    //
    // This used to be a streaming `inSteps` flag reset by a private `/^#{1,2} /` test on every line
    // — the module's THIRD section-extent grammar, and the one the WR-06 block above wrongly
    // claimed did not exist. The anchor question ("which heading opens a step section") is this
    // module's own and stays here as `STEPS_HEADING`; the extent question is the shared one and is
    // now answered ONCE, by `sectionEndIndex` at level two.
    //
    // The ranges are half-open `[from, to)` and there is one per anchor, because a document may
    // open more than one step section and a single index pair would silently govern only the first.
    const stepsRanges: { readonly from: number; readonly to: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (flags[i]) continue; // a `## Steps` line QUOTED in an example opens nothing
      if (!STEPS_HEADING.test(lines[i])) continue;
      stepsRanges.push({ from: i + 1, to: sectionEndIndex(text, i + 1, 2) });
      stepsHeadings.anchors += 1;
      // The independent denominator's source (WR-02). A file is recorded as carrying a step section
      // the moment its HEADING is seen — whether or not a single list item ever follows. WP-11 is
      // the published rule that makes the follow-up mandatory; this scan stays independent of the
      // bullet loop either way, which is the property that makes a short denominator visible.
      if (!stepsFiles.includes(file)) stepsFiles.push(file);
    }

    for (let i = 0; i < lines.length; i++) {
      if (flags[i]) continue; // inside a fence: documentation, not governed prose
      const raw = lines[i];
      // A heading is not a sentence and is never a step. This is the "is this a heading at all"
      // question — a third predicate, distinct from the anchor and from the extent.
      if (HEADING_LINE.test(raw)) continue;
      const inSteps = stepsRanges.some((r) => i >= r.from && i < r.to);
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      if (trimmed.startsWith("<!--")) continue; // an HTML comment is not prose a reader reads
      if (isTableRule(trimmed)) continue;

      const isBullet = LIST_MARKER.test(raw);
      const procedural = (inSteps && isBullet) || ORDERED_MARKER.test(raw);

      if (inSteps && isBullet) {
        bullets.push({
          file,
          line: i + 1,
          text: raw.replace(LIST_MARKER, "").trim(),
        });
      }

      // A TABLE ROW IS SPLIT INTO CELLS, AND THE REASON IS STATED SO IT IS NOT READ AS LENIENCY.
      // A row is not a sentence: it is N independent cells that happen to share a line. Measuring a
      // four-column row as one 40-word sentence would report correct tabular text as over-long, and
      // the only route back to green would be rewriting tables into prose — which is the
      // heuristic-strict-subset shape this project refuses. The cell is the honest unit.
      const chunks = trimmed.startsWith("|")
        ? raw
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "")
        : [raw.replace(LIST_MARKER, "")];

      for (const chunk of chunks) {
        for (const s of chunk.split(SENTENCE_SPLIT)) {
          if (s.trim() === "") continue;
          sentences.push({ file, line: i + 1, text: s.trim(), procedural });
        }
      }
    }
  }
  return {
    bullets,
    sentences,
    stepsFiles,
    stepsHeadings,
    filesRead,
    unreadable,
  };
}

/**
 * Name every member of one side absent from the other, IN BOTH DIRECTIONS, or return null.
 *
 * THE REPOSITORY'S OWN RULE, APPLIED TO A DENOMINATOR RATHER THAN TO A SCAN SET: a per-part
 * assertion is SET equality against each lister, never a count (kit-model.ts). A mismatch that
 * names no member is a number a reader cannot act on — "visited 18 of 19" says a file was lost and
 * refuses to say which. The two directions are DIFFERENT DEFECTS and must read differently: a file
 * that should have been reached and was not is a narrowed check, while a file reached that the
 * independent side never listed is a scan that wandered outside its own corpus.
 */
function setRefusal(
  expectedSide: { label: string; members: readonly string[]; missingReason: string },
  visitedSide: { label: string; members: readonly string[]; extraReason: string },
): string | null {
  const missing = expectedSide.members.filter((m) => !visitedSide.members.includes(m));
  const extra = visitedSide.members.filter((m) => !expectedSide.members.includes(m));
  if (missing.length === 0 && extra.length === 0) return null;
  const parts: string[] = [];
  if (missing.length > 0) {
    parts.push(
      `${expectedSide.label} but NOT ${visitedSide.label} (${missing.length}): ` +
        `${missing.join(", ")} — ${expectedSide.missingReason}`,
    );
  }
  if (extra.length > 0) {
    parts.push(
      `${visitedSide.label} but NOT ${expectedSide.label} (${extra.length}): ` +
        `${extra.join(", ")} — ${visitedSide.extraReason}`,
    );
  }
  return parts.join("\n        ");
}

// ---------------------------------------------------------------------------
// guard_imperative_lexicon (WP-01) — a `## Steps` bullet begins with an approved verb at position 0.
//
// SCOPED TO `## Steps` ON PURPOSE, AND THE REASON IS A MEASUREMENT RATHER THAN A PREFERENCE.
// `## Inputs required` bullets are NOUN PHRASES by design ("A ticket with acceptance criteria, size
// and priority.") and `## Stop conditions` bullets are CONDITIONALS ("The ticket fails the
// Definition of Ready -> stop…"). An imperative-verb rule applied to those two sections would report
// 72 CORRECT bullets as findings, and the only route back to green would be weakening the rule —
// the heuristic-strict-subset shape D-03 and D-15 both refuse and this repository has closed at
// eight rounds three separate times. `## Steps` (125 bullets, 19 files) is the honest surface.
// ---------------------------------------------------------------------------

type StepFindingKind =
  | "bold-label"
  | "actor-subject"
  | "determiner-subject"
  | "conditional-clause"
  | "not-an-approved-verb";

/** Determiners a step bullet opens with when it has become a description of who does what. */
const DETERMINERS = new Set([
  "the",
  "a",
  "an",
  "this",
  "that",
  "these",
  "those",
  "each",
  "every",
  "any",
  "all",
  "both",
  "its",
  "their",
]);
/** Subordinators a step bullet opens with when it has become a conditional. */
const CONDITIONAL_OPENERS = new Set([
  "when",
  "if",
  "before",
  "after",
  "once",
  "while",
  "unless",
  "whenever",
  "given",
  "with",
]);

interface StepFinding {
  readonly file: string;
  readonly line: number;
  readonly token: string;
  readonly kind: StepFindingKind;
  readonly rule: string;
  readonly text: string;
}

function classifyStep(b: StepBullet): StepFinding | null {
  const firstToken = b.text.split(/\s+/)[0] ?? "";
  if (APPROVED_STEP_VERBS.includes(firstToken)) return null;

  let kind: StepFindingKind;
  if (b.text.startsWith("**")) kind = "bold-label";
  else if (TECHNICAL_NAMES.some((n) => b.text.startsWith(n)))
    kind = "actor-subject";
  else if (DETERMINERS.has(bareWord(firstToken).toLowerCase()))
    kind = "determiner-subject";
  else if (CONDITIONAL_OPENERS.has(bareWord(firstToken).toLowerCase()))
    kind = "conditional-clause";
  else kind = "not-an-approved-verb";

  return {
    file: b.file,
    line: b.line,
    token: firstToken,
    kind,
    rule: "WP-01",
    text: b.text,
  };
}

const STEP_REMEDY: Readonly<Record<StepFindingKind, string>> = {
  "bold-label":
    "delete the bold label and start with the verb it was decorating — `**Run the gate** in order: …` becomes `Run the gate in order: …`",
  "actor-subject":
    "the first token is a project Technical Name used as a SUBJECT. Re-narrate the step as an instruction to the agent that performs it; name the actor later in the sentence if it is load-bearing",
  "determiner-subject":
    "the bullet describes what happens rather than instructing. Re-narrate it as an instruction beginning with an approved verb",
  "conditional-clause":
    "move the condition after the instruction, or state it as a `## Stop conditions` bullet, which this predicate deliberately does not govern",
  "not-an-approved-verb":
    "begin the bullet with a verb from APPROVED_STEP_VERBS. Do NOT add this token to that list unless it is a verb a grugops procedural step already uses in bare imperative position",
};

function renderStepFinding(f: StepFinding): string {
  return (
    `        ${f.file}:${f.line} — ${f.rule} [${f.kind}] first token "${f.token}" is not an ` +
    `approved step verb — ${JSON.stringify(f.text)}\n` +
    `        Remedy: ${STEP_REMEDY[f.kind]}. Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is ` +
    `two-sided pinned, precisely so removing a member to reach green is not available`
  );
}

// ---------------------------------------------------------------------------
// guard_sentence_form (WP-02..WP-08) — two length bounds by section anchor, four banned
// constructions over closed token sets. No threshold anywhere, and no tuning knob.
// ---------------------------------------------------------------------------

/** The closed modal set, TAKEN WHOLE from voice-model.ts. Never filtered — a filtered copy is a second list. */
const MODALS = new Set(BANNED_CONSTRUCTIONS.modal);
/** The closed copula set, taken whole from the same authority. */
const COPULAS = new Set(BANNED_CONSTRUCTIONS.copula);
/**
 * The finite auxiliary class the bare-demonstrative rule keys on, together with the two sets above.
 *
 * This is a CLOSED FUNCTION-WORD class rather than a verb list, which is what makes the rule
 * decidable without a dictionary: `This is the drift` is a bare demonstrative subject, while
 * `This workflow runs at release` is a demonstrative DETERMINER modifying a noun and is correct.
 */
const AUXILIARIES = new Set([
  "has",
  "have",
  "had",
  "does",
  "do",
  "did",
  "will",
]);
const DEMONSTRATIVES = new Set(["this", "that", "these", "those"]);
/** Conjunctions that chain a second instruction onto a step (WP-08). */
const INSTRUCTION_CHAINS = new Set(["and", "then"]);
/** The and-slash-or construction (WP-07), matched as a literal. */
const AND_SLASH_OR = "and/or";

type FormFindingKind =
  | "procedural-sentence-too-long"
  | "descriptive-sentence-too-long"
  | "modal-in-procedural-step"
  | "bare-demonstrative-subject"
  | "and-slash-or"
  | "more-than-one-instruction";

interface FormFinding {
  readonly file: string;
  readonly line: number;
  readonly kind: FormFindingKind;
  readonly rule: string;
  readonly detail: string;
  readonly text: string;
}

const FORM_REMEDY: Readonly<Record<FormFindingKind, string>> = {
  "procedural-sentence-too-long":
    "split the step into two steps. A procedural sentence is bounded at 20 words (WP-02) and the section anchor decides that the bound applies here (WP-04)",
  "descriptive-sentence-too-long":
    "split the sentence. A descriptive sentence is bounded at 25 words (WP-03)",
  "modal-in-procedural-step":
    "delete the modal. The step is the obligation (WP-05); if the action is conditional, state the condition rather than hedging the verb",
  "bare-demonstrative-subject":
    "name the antecedent. A sentence opening with a bare demonstrative followed by a copula, an auxiliary or a modal has no subject a reader can resolve without the previous sentence (WP-06)",
  "and-slash-or":
    "write the one meaning intended (WP-07). `and/or` asks the reader to pick",
  "more-than-one-instruction":
    "split the sentence at the conjunction. One instruction per sentence (WP-08)",
};

function renderFormFinding(f: FormFinding): string {
  return (
    `        ${f.file}:${f.line} — ${f.rule} [${f.kind}] ${f.detail} — ` +
    `${JSON.stringify(f.text.length > 160 ? `${f.text.slice(0, 157)}…` : f.text)}\n` +
    `        Remedy: ${FORM_REMEDY[f.kind]}. Do NOT narrow the scan set: GOVERNED_CORPUS_COUNT is ` +
    `two-sided pinned, precisely so removing a member to reach green is not available`
  );
}

function classifySentence(s: Sentence): FormFinding[] {
  const out: FormFinding[] = [];
  const base = { file: s.file, line: s.line, text: s.text };

  // WP-02 / WP-03 / WP-04 — one bound, selected by the section anchor. A sentence is never measured
  // against both, and it is never measured against neither.
  const n = countWords(s.text);
  const limit = s.procedural
    ? PROCEDURAL_SENTENCE_MAX_WORDS
    : DESCRIPTIVE_SENTENCE_MAX_WORDS;
  if (n > limit) {
    out.push({
      ...base,
      kind: s.procedural
        ? "procedural-sentence-too-long"
        : "descriptive-sentence-too-long",
      rule: s.procedural ? "WP-02" : "WP-03",
      detail: `${n} words, bound ${limit}`,
    });
  }

  const tokens = unwrapCodeSpans(s.text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const words = tokens.map((w) => bareWord(w).toLowerCase());

  // WP-05 — a modal inside a procedural step.
  if (s.procedural) {
    const modal = words.find((w) => MODALS.has(w));
    if (modal !== undefined) {
      out.push({
        ...base,
        kind: "modal-in-procedural-step",
        rule: "WP-05",
        detail: `modal "${modal}" in a procedural step`,
      });
    }
  }

  // WP-06 — a bare demonstrative as subject. The demonstrative must be at position ZERO: anything
  // before it in the sentence is a candidate antecedent, and this rule only claims to decide the
  // case where there is nothing before it at all.
  if (
    words.length > 1 &&
    DEMONSTRATIVES.has(words[0]) &&
    (COPULAS.has(words[1]) || MODALS.has(words[1]) || AUXILIARIES.has(words[1]))
  ) {
    out.push({
      ...base,
      kind: "bare-demonstrative-subject",
      rule: "WP-06",
      detail: `"${tokens[0]} ${tokens[1]}" opens the sentence with no antecedent in it`,
    });
  }

  // WP-07 — the and-slash-or construction.
  if (unwrapCodeSpans(s.text).toLowerCase().includes(AND_SLASH_OR)) {
    out.push({
      ...base,
      kind: "and-slash-or",
      rule: "WP-07",
      detail: `the "${AND_SLASH_OR}" construction`,
    });
  }

  // WP-08 — more than one instruction. Decidable BECAUSE the verb set is closed: an approved verb at
  // position zero, and a second approved verb immediately after a chaining conjunction.
  if (s.procedural && APPROVED_STEP_VERBS_LOWER.has(words[0])) {
    for (let i = 1; i < words.length - 1; i++) {
      if (
        INSTRUCTION_CHAINS.has(words[i]) &&
        APPROVED_STEP_VERBS_LOWER.has(words[i + 1])
      ) {
        out.push({
          ...base,
          kind: "more-than-one-instruction",
          rule: "WP-08",
          detail: `"${words[0]} … ${words[i]} ${words[i + 1]}" chains a second instruction`,
        });
        break;
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------

/**
 * The two measured labels, DECLARED ONCE AND EXPORTED.
 *
 * The element grain of a published PASS line is a contract readers rely on, so both labels now NAME
 * the element they count — a governed FILE, not a bullet and not a sentence. They are constants
 * rather than inline strings for the reason 29-16 recorded when it moved the sibling gate's grain:
 * six cases asserting the old spelling had to move together, and a seventh spelling would otherwise
 * be free to drift in through a test that quietly kept asserting the old one.
 */
export const LEXICON_MEASURED_LABEL =
  "imperative lexicon — governed file(s) carrying a `## Steps` section";
export const SENTENCE_MEASURED_LABEL = "sentence form — governed file(s)";

/**
 * THE PUBLISHED RULE THE STEP-SET REFUSAL NAMES — THE WHOLE RULE (plan 29-24 WR-04; plan 29-31 WR-05).
 *
 * These THREE constants are the rule id, the rule sentence and the remedy sentence exactly as
 * agent-factory/writing-profile.md publishes them. They are DELIBERATELY NOT EXPORTED. A case in
 * scripts/check-imperative-lexicon.test.ts asserts the same sentences appear in the gate's refusal
 * AND in the profile's rule table, written as literals in both places — importing the constant into
 * that case would prove only that one file reads another, when the property being pinned is that the
 * guard and the kit's own documentation SAY THE SAME THING TO AN AUTHOR. That contradiction between
 * a gate and its own recorded prose is the whole of WR-04, and a shared constant would hide the next
 * one exactly as the retired Residual 1 hid this one.
 *
 * WHY THERE ARE NOW TWO SENTENCES HERE, AND WHY THE ROW MOVED (WR-05).
 *
 * `WP-11` is a two-sentence rule and only its FIRST sentence was ever held. The two artifacts'
 * remedy halves therefore disagreed on the day they landed — the profile said "a heading that is not
 * a steps heading", this file said "a heading that is not `## Steps`" — and no assertion could see
 * it, because the pin covered one sentence while its own comment claimed to cover the rule. A claim
 * wider than the assertion beneath it is the defect class this repository removes, and it had landed
 * inside the mechanism built to prevent it.
 *
 * The row was also published LEVEL-AGNOSTICALLY ("a steps section") while `STEPS_HEADING` anchors on
 * level two exactly, so a `### Steps` section carrying no list item violated the published rule,
 * contributed no member to `stepsFiles`, and produced no refusal. The published rule was narrowed to
 * the spelling this gate decides rather than the anchor widened: widening makes the heading level and
 * the SECTION-END level disagree, so a `### Steps` section's bullets would be scanned to the next
 * level-at-most-two heading and would silently adopt sibling `###` sections' bullets. A genuine
 * widening needs the shared locator's level parameter widened with it — four gates at once, with its
 * own corpus measurement — and belongs in its own plan. The spellings the narrowing leaves undecided
 * are not left to a promise: `stepsHeadingTally` below counts them and refuses by name when the count
 * leaves zero.
 */
const STEPS_SECTION_RULE_ID = "WP-11";
const STEPS_SECTION_RULE =
  "A `## Steps` section carries at least one list item.";
const STEPS_SECTION_REMEDY =
  "Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`.";

function corpusBreakdown(): string {
  return GOVERNED_CORPUS_PARTS.map((p) => `${p.name} ${p.members.length}`).join(
    ", ",
  );
}

function runAll(): void {
  for (const refusal of DERIVATION_REFUSALS) {
    fail(`governed-corpus derivation refused: ${refusal}`);
  }

  // VACUITY FLOOR, PER PART, BEFORE THE AGGREGATE PIN. A part contributing nothing FAILS BY NAME
  // rather than shrinking the denominator, because a floor over the concatenated total could be
  // cleared by three parts while the fourth vanished entirely.
  for (const part of GOVERNED_CORPUS_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the governed corpus derived ZERO members — refusing to report ` +
          `a verdict over a part that contributes nothing, because a vacuous scan set passes every ` +
          `guard. This floor is per-part on purpose: three parts could clear a floor written over ` +
          `the concatenated total while the fourth vanished entirely`,
      );
    }
  }

  const corpus = governedCorpus();

  // TWO-SIDED PIN, worded so that moving it is visibly not the remedy.
  //
  // THIS REFUSAL STAYS, AND IS DELIBERATELY NOT FOLDED INTO THE TWO PER-GUARD DENOMINATOR REFUSALS
  // BELOW, because it answers a different question. This one asks whether the SCAN SET IS THE RIGHT
  // SIZE — did the four-part walk assemble the corpus it claims to govern. Those two ask whether the
  // LOOP REACHED IT — did every member the walk found actually produce an element. Folding them
  // together would make a corpus that silently SHRANK and a loop that silently SKIPPED report the
  // same failure, and the remedies for those are opposite: one is a derivation bug, the other is a
  // classification bug.
  if (corpus.length !== GOVERNED_CORPUS_COUNT) {
    fail(
      `the governed corpus derived ${corpus.length} document(s), expected exactly ` +
        `${GOVERNED_CORPUS_COUNT} (${corpusBreakdown()}) — walk all four parts' derivations, the ` +
        `${GENERATED_MARKER} exclusion and the GOVERNED_CORPUS_EXCLUDED_LOCATIONS reasons BEFORE ` +
        `updating GOVERNED_CORPUS_COUNT in scripts/check-imperative-lexicon.ts. A new workflow is ` +
        `supposed to enter this scan BY EXISTING; moving the pin is how you acknowledge that it ` +
        `did, not how you make the failure go away`,
    );
  }

  // THE DERIVED EXCLUSION'S OWN CARDINALITY, TWO-SIDED. This is what stops a SECOND generated kit
  // file arriving unexcluded and unnoticed: without it, the generated set could grow and the only
  // visible symptom would be a corpus count nobody could explain.
  if (GENERATED_EXEMPT.length !== GENERATED_EXEMPT_COUNT) {
    fail(
      `${GENERATED_EXEMPT.length} candidate document(s) carry the \`${GENERATED_MARKER}\` marker, ` +
        `expected exactly ${GENERATED_EXEMPT_COUNT} (derived: ${GENERATED_EXEMPT.join(", ") || "none"}) ` +
        `— a generated document is excluded because a style pass over it would be reverted on the ` +
        `next generation and would falsify its own verbatim-copy claim. A SECOND generated file is ` +
        `a deliberate decision about what this corpus governs, not a number to move`,
    );
  }

  // THE TECHNICAL NAMES SET, per part and then two-sided. A short set silently stops exempting
  // multi-word names from the word count and starts reporting the actor-subject shape as an
  // unrecognised word; a grown set silently starts exempting text nobody reviewed.
  for (const part of TECHNICAL_NAME_PARTS) {
    if (part.members.length === 0) {
      fail(
        `the "${part.name}" part of the Technical Names set derived ZERO members — the set is ` +
          `DERIVED from the kit rather than listed (LANG-01), and a part that derives nothing ` +
          `silently removes a whole vocabulary from both predicates`,
      );
    }
  }
  if (TECHNICAL_NAMES.length !== TECHNICAL_NAMES_COUNT) {
    fail(
      `the Technical Names set derived ${TECHNICAL_NAMES.length} member(s), expected exactly ` +
        `${TECHNICAL_NAMES_COUNT} (${TECHNICAL_NAME_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}, ` +
        `deduped) — walk both consumers in this file BEFORE updating TECHNICAL_NAMES_COUNT`,
    );
  }

  const elements = deriveElements(corpus);
  for (const u of elements.unreadable) {
    fail(
      `${u} is a member of the governed corpus and could not be read — refusing to report a ` +
        `verdict over a document that was never opened. A missing document is not a clean one`,
    );
  }

  // ── guard_imperative_lexicon ────────────────────────────────────────────────────────────────
  process.stdout.write(
    "\n[guard_imperative_lexicon] every `## Steps` bullet begins with a verb from the closed " +
      "approved set, in bare imperative form, at position zero (LANG-04 / WP-01, D-12, D-39)\n",
  );

  const stepFindings: StepFinding[] = [];
  // THE VISIT SET, ACCUMULATED BY THE LOOP THAT DOES THE WORK. `visited` must never be a count read
  // off the array the loop was handed: a guard that skipped its loop entirely would then still
  // report a full denominator, and vacuity.ts's first branch — the one that exists to catch exactly
  // that — could not fire.
  const bulletFilesVisited: string[] = [];
  for (const b of elements.bullets) {
    if (!bulletFilesVisited.includes(b.file)) bulletFilesVisited.push(b.file);
    const f = classifyStep(b);
    if (f !== null) stepFindings.push(f);
  }
  const stepFiles = bulletFilesVisited.length;
  process.stdout.write(
    `        corpus: ${corpus.length} file(s) in 4 part(s) — ${corpusBreakdown()}; ` +
      `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker ` +
      `(${GENERATED_EXEMPT.join(", ") || "none"} — machine-generated from a third-party standard, ` +
      `so a style pass would be reverted on the next generation and would falsify its own ` +
      `verbatim-copy claim)\n`,
  );
  process.stdout.write(
    `        ${elements.bullets.length} \`## Steps\` bullet(s) across ${stepFiles} file(s); ` +
      `${APPROVED_STEP_VERBS.length} approved verb(s); ${TECHNICAL_NAMES.length} derived Technical ` +
      `Name(s)\n`,
  );
  // ── THE DISCLOSED FLOOR, PUBLISHED AS TWO NUMBERS AND PINNED ON BOTH SIDES (WR-05) ──────────
  //
  // `WP-11` and `WP-04` are published for the level-two spelling and decided for that spelling
  // only. Every other ATX level is a floor, and a floor nothing measures becomes live in silence.
  // The size of the floor is printed here so a reader can check it by hand rather than take a
  // sentence for it.
  const heads = elements.stepsHeadings;
  process.stdout.write(
    `        steps headings by ATX level: ${heads.decided} at the decided \`## Steps\` level, ` +
      `${heads.undecided} at any other level, ${heads.any} seen in total — ` +
      `${STEPS_SECTION_RULE_ID} and WP-04 are decided for the level-two spelling only, and the ` +
      `undecided count is refused above zero rather than recorded\n`,
  );
  // PREMISE, ASSERTED RATHER THAN ASSUMED. Three independent patterns produced these three numbers.
  // If they do not reconcile, one pattern is admitting a line another rejects and NEITHER tally can
  // be trusted — including the zero that would otherwise read as a clean floor.
  if (heads.any !== heads.decided + heads.undecided) {
    fail(
      `the steps-heading tallies do not reconcile: ${heads.any} at any level, but ` +
        `${heads.decided} decided + ${heads.undecided} undecided = ` +
        `${heads.decided + heads.undecided}. The three patterns are written independently so this ` +
        `sum is a CHECK and not a definition — a mismatch means one pattern admits a line another ` +
        `refuses, and the undecided count cannot be read as a floor until they agree`,
    );
  }
  // THE SECOND INDEPENDENT PATH. `anchors` is what the section-extent loop counted from
  // `STEPS_HEADING`; `decided` is what the tally counted from the same pattern over its own walk.
  // They are produced by two loops that share no state, so a scan that silently stopped visiting
  // lines shows up here as a disagreement rather than as a smaller, plausible-looking number.
  if (heads.decided !== heads.anchors) {
    fail(
      `the steps-heading tally counted ${heads.decided} decided-level heading(s) while the ` +
        `section-extent loop anchored on ${heads.anchors} — two independent walks over the same ` +
        `lines disagree, so neither the WP-11 denominator nor the level floor below covers what it ` +
        `claims`,
    );
  }
  // THE VACUITY SIDE OF THE TWO-SIDED PIN. A zero undecided count is only meaningful if the scan
  // saw any steps heading at all: a walk that reached nothing reports zero undecided and reads
  // exactly like a clean corpus. This is the same element-level floor vacuity.ts applies to the
  // findings below, applied to the tally that has no findings to be short of.
  if (heads.any === 0) {
    fail(
      `the steps-heading tally saw ZERO steps headings across ${corpus.length} governed ` +
        `document(s) — refusing to publish a level floor over a walk that reached nothing, because ` +
        `an empty scan reports the same zero undecided headings as a conforming corpus`,
    );
  }
  // THE REFUSAL SIDE. The remedy is named, so the next reader cannot clear the red by deleting the
  // tally: the choice is to spell the heading at the decided level, or to widen the rule AND the
  // shared locator's level parameter together in a plan with its own corpus measurement.
  if (heads.undecided > 0) {
    fail(
      `${heads.undecided} steps heading(s) in the governed corpus sit at an ATX level ` +
        `${STEPS_SECTION_RULE_ID} does not decide — the profile publishes the rule for \`## Steps\` ` +
        `and this gate anchors on that spelling, so the section(s) below are governed by nothing. ` +
        `Spell the heading at the decided level, or widen the published rule AND the shared section ` +
        `locator's level parameter together in a plan of their own — a widened anchor alone makes ` +
        `the heading level and the SECTION-END level disagree, and a sub-level steps section would ` +
        `silently adopt its siblings' bullets. Deleting this tally is not the remedy` +
        `\n        ${heads.undecidedSites.join("\n        ")}`,
    );
  }
  // THE SET-LEVEL REFUSAL, ABOVE THE REPORT. The count below says HOW MANY files disagreed; this
  // says WHICH, in both directions, because those two directions are different defects.
  const stepSetRefusal = setRefusal(
    {
      label: "carries a `## Steps` heading",
      members: elements.stepsFiles,
      missingReason:
        "each of these files opens a step section and contributed no bullet to the loop, so no " +
        "WP-01 verdict was reported over any step it declares",
    },
    {
      label: "contributed a bullet",
      members: bulletFilesVisited,
      extraReason:
        "each of these files was attributed a step bullet without the heading scan ever seeing a " +
        "step section in it, so the two scans disagree about where the section is",
    },
  );
  if (stepSetRefusal !== null) {
    // THE REFUSAL NAMES THE WHOLE RULE, NOT ONLY THE SET ARITHMETIC (WR-04; widened at WR-05). Set
    // equality is what the gate COMPUTED; it is not something an author can act on. BOTH sentences
    // below come from the constants above — the rule and its remedy — and NEITHER is spelled inline
    // here. An inline remedy is exactly how the two artifacts came to disagree: the half held by a
    // constant stayed pinned while the half typed into this call drifted, unwatched.
    fail(
      `the step-heading file set and the bullet-bearing file set are not equal, so the element ` +
        `count published below covers less than the corpus declares. THE RULE IS ` +
        `${STEPS_SECTION_RULE_ID}: ${STEPS_SECTION_RULE} ${STEPS_SECTION_REMEDY}` +
        `\n        ${stepSetRefusal}`,
    );
  }
  FAILS += reportMeasured(
    {
      label: LEXICON_MEASURED_LABEL,
      visited: stepFiles,
      expected: elements.stepsFiles.length,
      findings: stepFindings,
    },
    { pass, fail },
    renderStepFinding,
  );

  // ── guard_sentence_form ─────────────────────────────────────────────────────────────────────
  process.stdout.write(
    "\n[guard_sentence_form] sentence length by section anchor — 20 words procedural, 25 " +
      "descriptive — plus four banned constructions over closed token sets (LANG-04 / WP-02..WP-08, " +
      "D-14, D-35, D-39)\n",
  );

  // The corpus line is repeated under EACH guard header rather than printed once above both. The two
  // predicates report two separate verdicts, and a reader who scrolls to the second one must meet
  // its denominator and its exclusions there — a verdict whose corpus is stated only beside a
  // different verdict is a verdict a reader has to reconstruct.
  process.stdout.write(
    `        corpus: ${corpus.length} file(s) in 4 part(s) — ${corpusBreakdown()}; ` +
      `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker ` +
      `(${GENERATED_EXEMPT.join(", ") || "none"} — machine-generated from a third-party standard, ` +
      `so a style pass would be reverted on the next generation and would falsify its own ` +
      `verbatim-copy claim)\n`,
  );

  const formFindings: FormFinding[] = [];
  // Same shape as the lexicon guard above: the visit set is built BY the classification loop, so a
  // loop that stopped running reports an empty set rather than the corpus size.
  const sentenceFilesVisited: string[] = [];
  for (const s of elements.sentences) {
    if (!sentenceFilesVisited.includes(s.file)) sentenceFilesVisited.push(s.file);
    for (const f of classifySentence(s)) formFindings.push(f);
  }
  const byKind = new Map<FormFindingKind, number>();
  for (const f of formFindings) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
  const proceduralSentences = elements.sentences.filter(
    (s) => s.procedural,
  ).length;
  process.stdout.write(
    `        ${elements.sentences.length} sentence(s) — ${proceduralSentences} procedural, ` +
      `${elements.sentences.length - proceduralSentences} descriptive; by finding kind: ` +
      `${[...byKind].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}\n`,
  );
  process.stdout.write(
    `        passive voice is deliberately NOT checked (D-15) — the kit's own correct prose is ` +
      `saturated with it, so a passive check reds large volumes of accurate text and the only ` +
      `route back to green is tuning the detector\n`,
  );
  const sentenceSetRefusal = setRefusal(
    {
      label: "in the derived governed corpus",
      members: corpus,
      missingReason:
        "each of these files is a member of the governed corpus and yielded not one sentence, so " +
        "no WP-02..WP-08 verdict was reported over any prose it carries",
    },
    {
      label: "yielded a sentence",
      members: sentenceFilesVisited,
      extraReason:
        "each of these files produced a sentence without being a member of the derived corpus, so " +
        "the scan reached outside the set it publishes a verdict over",
    },
  );
  if (sentenceSetRefusal !== null) {
    fail(
      `the governed-corpus file set and the sentence-bearing file set are not equal, so the ` +
        `element count published below covers less than the corpus does\n        ${sentenceSetRefusal}`,
    );
  }
  FAILS += reportMeasured(
    {
      label: SENTENCE_MEASURED_LABEL,
      visited: sentenceFilesVisited.length,
      expected: corpus.length,
      findings: formFindings,
    },
    { pass, fail },
    renderFormFinding,
  );

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened, and every exclusion is named inline with its reason so a reader
    // meets it here rather than inferring it from a file's absence.
    pass(
      `LANG-02: ${corpus.length} governed document(s) in 4 derived part(s) — ${corpusBreakdown()}; ` +
        `${GENERATED_EXEMPT.length} excluded by the derived \`${GENERATED_MARKER}\` marker; ` +
        `${GOVERNED_CORPUS_EXCLUDED_LOCATIONS.length} location(s) excluded by name (` +
        `${GOVERNED_CORPUS_EXCLUDED_LOCATIONS.map((e) => `${e.location} — ${e.label}: ${e.reason}`).join("; ")}); ` +
        `${elements.filesRead} of ${corpus.length} opened`,
    );
    pass(
      `LANG-01: ${TECHNICAL_NAMES.length} Technical Name(s) DERIVED from the kit, never listed — ` +
        `${TECHNICAL_NAME_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}`,
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
// `node scripts/check-imperative-lexicon.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
