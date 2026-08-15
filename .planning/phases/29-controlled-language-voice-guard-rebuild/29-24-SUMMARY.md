---
phase: 29-controlled-language-voice-guard-rebuild
plan: 24
subsystem: tooling / controlled-language gates
tags: [LANG-02, LANG-04, LANG-07, WR-04, WR-07, WR-08, WR-09, section-locator, fence-authority, residual]
requires:
  - "scripts/frontmatter.ts — fencedLineFlags, unfencedHeadingIndex, sectionEndIndex (plan 29-20's one authority)"
  - "agent-factory/writing-profile.md — the rule table WP-01..WP-10, which the new WP-11 row joins"
provides:
  - "agent-factory/writing-profile.md :: WP-11 — a steps section carries at least one list item (decidable)"
  - "scripts/check-imperative-lexicon.ts — zero private section-extent predicates; every extent question delegated"
  - "scripts/check-imperative-lexicon.ts :: Residual 4 — the indented-code-block admission, with its conflict and its promote trigger"
affects:
  - "scripts/check-foundation-guards.test.ts (this module's frontmatter consumer-symbol pin moves from one symbol to three — the FOURTH and final entry)"
  - "plan 29-25 (its tree-wide locator-site scan meets a STATED exemption here, not a zero)"
tech-stack:
  added: []
  patterns:
    - "when a guard and its own recorded prose disagree, a HUMAN picks one answer and it is written in BOTH places"
    - "hold the enforcement and the documentation to ONE SENTENCE in TWO artifacts, asserted as a literal in both — a shared constant proves only that one file imports another"
    - "a residual is legitimate when it names a shipped requirement it would REVERSE, never when the fix is merely hard"
    - "one range per anchor: a document may open the same section twice, and a single index pair silently governs only the first"
    - "mutate the rewire before believing the suite — six axes this rewire MOVED were owned by nothing"
key-files:
  created: []
  modified:
    - agent-factory/writing-profile.md
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "WR-04 resolved by HUMAN DECISION `retire-residual`: Residual 1 is retired and its replacement ships as WP-11 in agent-factory/writing-profile.md, marked decidable. The human was shown and accepted the cost — a new constraint on every future workflow author, and a steps section written as explanatory prose becomes illegal rather than merely unmeasured."
  - "The rule sentence is written as a LITERAL in the gate and in the profile, deliberately not shared through an export — the property being pinned is that the two artifacts SAY THE SAME THING to an author (D-24 style, WR-04)."
  - "`boardColumns`' terminator is deliberately NOT unified: where a TABLE ends is not where a SECTION ends, stated in source so a later reader does not merge two predicates that were never the same."
  - "The derived locator-site scan over this module reports ONE member, not the zero the plan's acceptance criterion asserts. The member is `HEADING_LINE`, the predicate the same plan instructs the module to KEEP; the exemption is recorded at the declaration for plan 29-25."
  - "The consumer-symbol pin moved in Task 3's commit rather than Task 4's, so no commit in this plan leaves the suite red — the same correction plans 29-22 and 29-23 made."
metrics:
  duration: 45m
  completed: 2026-08-15
actuals:
  tokens: 21000
  tasks: 4
  commits: 3
status: complete
---

# Phase 29 Plan 24: The Last Locator, and a Guard That No Longer Contradicts Itself Summary

`check-imperative-lexicon.ts` declares no section-extent predicate of its own — the fourth and last
consumer to move — and both places where this guard's enforcement disagreed with its own recorded
documentation are settled in writing: one by a human decision that publishes a new rule, one by a
residual that names the shipped requirement its fix would reverse.

## Task 1 — The Human Decision, Recorded and Attributed

**Decision: `retire-residual`. Made by the human**, presented by the execute-phase orchestrator, not
by the planner and not by this executor.

Residual 1 is retired. "A steps section carries at least one list item" ships as a new numbered,
**decidable** rule in `agent-factory/writing-profile.md`, joining WP-01 through WP-10. The
denominator stays independent of the bullet loop — the WR-02 property round 1 landed — and the
guard's enforcement and its documentation now agree.

The human was shown, and accepted, this cost: **it publishes a new constraint on every future
workflow author, and a steps section written as explanatory prose becomes illegal rather than merely
unmeasured.** Reversing it later means unpublishing a rule agents have been following. That is why
the plan rates the task `one-way` and why the corpus was measured before a word of it was written.

The alternative the plan offered (`keep-residual`) was declined. The planner had already recorded its
own assessment that it does not resolve the contradiction — a prose-only steps section carries
non-blank non-heading lines, so it would still sit in the denominator and still red.

## The Pre-Retirement Measurement — 19 of 19, Taken Before the Rule Was Written

The plan requires execution to STOP if the live corpus does not already satisfy the rule being
published. Derived at execution over the gate's own `GOVERNED_CORPUS_PARTS`:

```
corpus: 47
files carrying a ## Steps HEADING: 19
files contributing a step BULLET: 19
INDENTED (4+ sp / tab) list-marker lines under ## Steps: 0
INDENTED ordered-marker lines ANYWHERE in the corpus: 0
```

**19 of 19.** Retiring the residual and publishing the rule moved **zero verdicts** on the day it was
adopted. The second and third numbers are Residual 4's live-corpus facts, measured rather than
assumed.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | WR-04 decision (human: `retire-residual`) | recorded in `6d4623c` | — |
| 2 | Record the decision and the new residual, RED-plant every unpinned verdict | `6d4623c` | writing-profile.md, check-imperative-lexicon.ts/.js/.test.ts |
| 3 | Every section-extent question goes to the shared authority | `42d6430` | check-imperative-lexicon.ts/.js/.test.ts, check-foundation-guards.test.ts |
| 4 | WR-07 — the case that claimed a property asserts one | `dc2b032` | check-imperative-lexicon.test.ts |

## HEAD Transcripts, Verbatim — All Four Task 2 Cases

Written before any fix, run against the committed `.js` at `74e67e4`. **Three of the four PASSED at
HEAD**, which is precisely the shape WR-04 is about: the behaviour was right and nothing pinned it.

### WR-04, the prose-only steps section — FAILED at HEAD

```
 FAIL  scripts/check-imperative-lexicon.test.ts > WR-04 / WR-09 — the shapes this guard's own prose names, each with its verdict pinned > WR-04: a prose-only `## Steps` section is RED, and the refusal names the RULE — the same sentence the writing profile publishes
AssertionError: expected '\n[guard_imperative_lexicon] every `#…' to contain 'WP-11'

- Expected
+ Received

- WP-11
+   FAIL  the step-heading file set and the bullet-bearing file set are not equal, so the element count published below covers less than the corpus declares
+         carries a `## Steps` heading but NOT contributed a bullet (1): agent-factory/workflows/01-fixture.md — each of these files opens a step section and contributed no bullet to the loop, so no WP-01 verdict was reported over any step it declares
+   FAIL  imperative lexicon — governed file(s) carrying a `## Steps` section: visited 18 of 19 elements — the scan set is short, so the result covers less than it claims
```

The exit code and the file naming already held at HEAD. **What failed is the half that matters:** the
refusal told an author what the gate had COMPUTED and never what to WRITE, and the rule it was
enforcing existed nowhere in the kit's documentation.

### The three WR-09 cases — PASSED at HEAD

```
 ✓ WR-09 / Residual 4: a FOUR-SPACE-INDENTED numbered line under `## Steps` IS admitted as a step bullet — the disclosed verdict, measured
 ✓ WR-09: the ORDERED arm decides `procedural` with NO section anchor — the marker character is the only variable
 ✓ WR-09: the two `procedural` arms, their UNION and its complement — all four cells asserted
```

Recorded as PASSED and **kept**, per the plan. Each is now a permanent pin on a verdict that until
this plan nothing anywhere asserted. Their liveness is not taken on faith — M7 and M8b below red all
three.

## The New Profile Rule, Verbatim

`agent-factory/writing-profile.md:54`, in the existing table's own voice:

```
| `WP-11` | A steps section carries at least one list item. Write the procedure as list items, or move the explanatory paragraphs under a heading that is not a steps heading. | decidable |
```

With a new `### Why a steps section carries at least one list item` subsection stating the reason:
`WP-01` is scoped to list items, so a steps section written as paragraphs is measured by the
imperative predicate **not at all** — a heading that claims to hold procedure and holds none is a
section no rule in the profile reaches. The subsection also states the rule's narrowness (one list
item; explanatory prose beside them is welcome) and its cost, in the profile's own voice.

## Residual 4, Verbatim

```
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
```

The retired Residual 1 leaves a **numbering gap that is a decision, not a deletion** — a note above
residual 2 records what was retired, why, where the rule now lives, and that the remaining residuals
keep their original numbers because renumbering silently rewrites every reference to them.

## The Derived Locator-Site Scan, Before and After — and Where the Plan Is Wrong

Plan 29-22's classifier, run over `check-imperative-lexicon.ts` at execution:

```
--- BEFORE (74e67e4) ---
governedCorpus :: const HEADING_LINE = /^#{1,6} /;
governedCorpus :: const SECTION_HEADING_LINE = /^#{1,2} /;
unfencedIndexOf :: if (!flags[i] && lines[i] === heading) return i;
tableFirstCellsUnderHeading :: if (lines[i].startsWith("## ")) break;
count: 4

--- AFTER (42d6430) ---
governedCorpus :: const HEADING_LINE = /^#{1,6} /;
count: 1
```

**The plan's acceptance criterion says this must report ZERO. Measured, it reports ONE.** The survivor
is `HEADING_LINE`, the "is this line a heading at all" predicate the same plan explicitly instructs
this module to **keep** — the classifier's third construct is `CLOSE by heading PREFIX` and cannot
tell a section terminator from a heading recogniser, because both are spelled `/^#{n,m} /`.

The number is not narrowed to reach the criterion and the predicate is not deleted to reach it. The
exemption is **recorded at the declaration in source**, naming the classifier construct that produces
it and directing plan 29-25 to state an exemption rather than widen the classifier — the same shape
plan 29-23 used for `check-banned-claims.ts`'s heading COUNT.

## The Seven Published Numbers, Before and After

| Measurement | Before (`74e67e4`) | After (`dc2b032`) |
|---|---|---|
| `## Steps` bullets / files | 139 across 19 | **139 across 19** |
| approved verbs | 43 | **43** |
| derived Technical Names | 76 | **76** |
| lexicon verdict | 0 findings over 19/19 | **0 findings over 19/19** |
| sentences | 2166 — 414 procedural, 1752 descriptive | **2166 — 414 / 1752** |
| sentence-form verdict | 0 findings over 47/47 | **0 findings over 47/47** |
| documents opened | 47 of 47 | **47 of 47** |

**Not one number moved.** `TECHNICAL_NAMES_COUNT` was re-derived after the `trimEnd()` widening and
is still **76** (roleDisplayNames 17, workflowDisplayNames 19, configKeys 21, noteKinds 6,
boardColumns 13) — so neither table source carries a trailing-whitespace heading and there is nothing
to escalate. This fix is behaviour-preserving on the live corpus, so its proof is a planted input and
never a moved number.

### The other gates

| Gate | Before | After |
|---|---|---|
| `check-foundation-guards` | exit 0 | exit 0 |
| `check-banned-claims` | exit 0 | exit 0 |
| `check-diff-disposition` | exit 0, `37 watched file(s) changed since 4d2b8f0; 1880 changed clause(s); 1532 disposition row(s) across 8 file(s)` | **identical** |
| `check-claim-anchors` | exit 0 | exit 0 |
| `check-public-docs-vocabulary` | exit 0 | exit 0 |
| `check-audit-register` | exit 0 | exit 0 |
| `npm run freshness` | 48 committed `.js` fresh | 48 committed `.js` fresh |
| `npx tsc --noEmit` | exit 0 | exit 0 |

Full regression: `npx vitest run --exclude '**/scripts/e2e/**'` → **51 files, 1857 passed, 2 skipped**
(both skips pre-existing). 29-23 left 1847; this plan adds exactly the 10 cases below, and
1847 + 10 = 1857.

## The Disposition Obligation, Confirmed Absent by Measurement

`agent-factory/writing-profile.md` **was** modified by this plan, so the obligation was checked rather
than assumed:

```bash
node -e 'import("./scripts/generate-safety-surface.js").then(m=>{
  const arr = m.safetySurfaceUnion();
  console.log("union size:", arr.length);
  console.log("writing-profile present:", JSON.stringify(arr).includes("writing-profile"));
});'
→ union size: 41
→ writing-profile present: false
```

Confirmed a second time by the gate itself: `check-diff-disposition` still reports **37 watched files
changed / 1880 clauses / 1532 rows**, byte-identical to before the edit. The file is also absent from
`GOVERNED_CORPUS_PARTS` (workflows, checklists, seedTemplates, contracts), so
`GOVERNED_CORPUS_COUNT` stays **47**.

**No disposition row is owed under `docs/audit/29-style-dispositions/` and none was invented.**

## Mutation Proof — Ten Runs, Each With Its Own Premise Asserted

The harness refuses to report unless the committed `.js` **hash actually moved** and `tsc` accepted
the mutation. Both are the failure modes that produced false results in 29-20 and 29-22, and both
fired here.

| Mutation | Premise | Cases that failed |
|---|---|---|
| M1 table section bound restored to EOF | artifact moved, tsc ok | the two real-later-heading cases (2) |
| M2 heading equality loses `trimEnd()` | artifact moved, tsc ok | the trailing-space case (1) |
| M3 step-range close narrowed to level ONE | artifact moved, tsc ok | **20**, including the clean-mirror control |
| M4 step anchor made fence-blind | artifact moved, tsc ok | the fenced-anchor case (1) |
| M5 only the FIRST steps range kept | artifact moved, tsc ok | the two-sections case (1) |
| M6 rule naming deleted from the refusal | **PREMISE FAILED** — both constants became unused, tsc rejected, artifact did not move | — |
| M6b rule naming emptied, constants still READ | artifact moved, tsc ok | the WR-04 case (1) |
| M7 `LIST_MARKER` depth-bounded again (CR-03 reversed) | artifact moved, tsc ok | **9**, including all three WR-09 cases |
| M8 ordered arm dropped from `procedural` | **PREMISE FAILED** — `ORDERED_MARKER` became unused, tsc rejected | — |
| M8b ordered arm made dead, `ORDERED_MARKER` still READ | artifact moved, tsc ok | the ordered-arm and union cases (3) |
| M9 CORPUS: the `WP-11` row deleted from the profile | row removed from the live file | the WR-04 case (1) |
| M10 HARNESS: the WR-07 fixture planted OUTSIDE the corpus | fixture path moved | the premise assertion, `expected +0 to be 1` (1) |

M6 and M8 are recorded rather than dropped: the harness caught its own bad mutations instead of
reporting a green for a build that never happened — the same class 29-22's M2 caught. M9 is what
makes WR-04's closure mechanical: **deleting the rule from the documentation reds the gate's own
test.** M10 is what makes the WR-07 premise non-vacuous, and it fails at the PREMISE rather than at
the verdict, which is the whole point of putting it first.

## The Ten New Cases

| Case | What it pins |
|---|---|
| WR-04 prose-only steps section | exit 1, the file named, **the RULE named**, and the same sentence present in the profile with a `decidable` mark |
| WR-09 indented numbered line under `## Steps` | the disclosed admission, with a bullet-count delta of **exactly one** and a false red |
| WR-09 ordered arm, no anchor | the marker character is the only variable; the procedural count moves by exactly one |
| WR-09 the arms' UNION | all four cells — both arms, each arm alone, and **neither** |
| WR-08 a real later `## ` ends the table section | the section bound, which M1 proved nothing owned |
| WR-08 a real later `# ` also ends it | **the level widening this plan introduced**, pinned in the direction it moved |
| WR-08 trailing-space heading located | **the `trimEnd()` widening this plan introduced** |
| WR-08 leading-space heading refused by name | the bound on that same equality — the column-zero convention four gates share |
| WR-08 a fenced `## Steps` opens no section | the anchor scan reads the same toggle its extent does |
| WR-08 two `## Steps` sections, both governed | one range per anchor — the degree of freedom the range design introduced |

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] SIX AXES THIS REWIRE MOVED WERE OWNED BY NOTHING

- **Found during:** Task 3, by running mutations after the suite went green — not by reading.
- **Issue:** the first mutation sweep of the rewire produced **four mutations that reddened nothing**:
  the table section bound restored to end of file, the authority's `trimEnd()` equality replaced by
  the deleted exact-equality scan, the step anchor made fence-blind, and every step section after the
  first silently ignored. Two of those are behaviour this plan **changed** — the close went from
  level-two-only to level-at-most-two, and the heading equality went from exact to normalized. An
  unpinned change is indistinguishable from an accident, and this is the round whose entire subject
  is unpinned widenings. It is the same defect 29-23 recorded as its Deviation 3, one module over,
  and the plan text for this task describes the `trimEnd()` axis in prose while specifying no case
  for it.
- **Fix:** six cases, covering both directions of each axis (a later `## ` and a later `# ` end the
  table section; a trailing space is located and a leading space is refused BY NAME; a fenced anchor
  opens nothing; two steps sections are both governed).
- **Proven, not argued:** the same five mutations were re-run against the new cases and every one
  now reds, with the artifact-moved and tsc-accepted premises asserted on each run.

### 2. [Rule 1 — the plan asserts a fact this repository falsifies] The derived scan reports ONE, not the zero the acceptance criterion states

- **Found during:** Task 3, immediately after the rewire, by running 29-22's classifier rather than
  reading the module.
- **Criterion affected:** *"the derived locator-site scan added in plan 29-22 … must report zero
  members here."*
- **Measured:** **4 before, 1 after.** The survivor is `const HEADING_LINE = /^#{1,6} /`, matched by
  the classifier's `CLOSE by heading PREFIX` construct, which cannot distinguish a section terminator
  from a heading RECOGNISER — both are `/^#{n,m} /`. That predicate answers "is this line a heading at
  all", a third question, and the same plan's Task 3 text explicitly says to keep it. The criterion
  and the task text disagree; the task text is right.
- **Resolution:** neither the number nor the predicate was moved to reach the criterion. The exemption
  is recorded **at the declaration in source**, with the before/after counts, the construct that
  produces it, and a direction for plan 29-25 to state an exemption for a heading recogniser rather
  than widen the classifier. Recorded here as well, so 29-25 does not meet it as a surprise.

### 3. [Rule 1 — the plan asserts a fact its own repository falsifies] The "missing" behavioural sibling for the sentence denominator already existed

- **Found during:** Task 4, by reading `check-imperative-lexicon.test.ts:1117` before writing
  anything.
- **Task text affected:** *"The sentence-form guard's denominator has only the substring claim. Plant
  its behavioural sibling: a governed file present in the derived corpus that yields no sentence…"*
- **Measured:** the case `"REDs a governed file that yields no sentence at all, naming it"` — landed
  by the WR-02 work in round 1 — already plants exactly that fixture, already requires the mismatch,
  already names the file through the `missing` arm specifically, and already asserts the published
  denominator at `GOVERNED_CORPUS_COUNT - 1`. The plan's premise is false.
- **What WAS genuinely missing is the half the plan states next, and it was implemented:** *"Assert
  the fixture's premise first — that the planted file really is a member of the mirror's derived
  corpus."* Nothing anywhere asserted that. A plant that landed outside the corpus would still red,
  through the **opposite arm** of the same refusal, and the case would report a green for a property
  it never measured.
- **Fix:** a premise sub-run added ahead of the verdict — the SAME path, carrying an over-long
  descriptive sentence, must be reached and named by the sentence loop with exactly one finding.
  M10 proves it non-vacuous: moving the fixture to `agent-factory/packaging/` reds at
  `expected +0 to be 1`, at the premise, before the verdict is ever consulted.

### 4. [Rule 3 — blocking] The `.js` had to be rebuilt in Task 2's commit, which the plan assigns to Task 3

Task 2 edits `scripts/check-imperative-lexicon.ts` (the residual block, the refusal text, the two new
constants) while the plan's "rebuild and commit the `.js`" instruction sits in Task 3. Committing the
`.ts` without its build output breaks `npm run freshness`, which is a repository hard rule. The
committed `.js` therefore moved in `6d4623c` as well as in `42d6430`, each rebuild verified with
`npm run freshness` reporting 48 fresh outputs.

### 5. The consumer-symbol pin moved in Task 3's commit, not Task 4's

The plan assigns the `check-foundation-guards.test.ts` pin move to Task 4, but Task 3's import is what
makes the pin red, so deferring it would have committed a tree with a failing suite. The pin — and the
full comment the plan specifies, including the `boardColumns` direction note and the record that this
is the fourth and final entry — landed in `42d6430`. This is the same correction plans 29-22 and 29-23
made for the same reason. Verified by `git diff 74e67e4 -- scripts/check-foundation-guards.test.ts`:
the three sibling equalities are byte-unchanged.

### 6. The new rule is `WP-11`, not a row "beside WP-01 through WP-09"

The plan's must-have describes the profile table as carrying `WP-01` through `WP-09`. It carries
`WP-01` through **`WP-10`** (`WP-10`, advisory: a prohibition is stated once, in the section that owns
it). The new row is therefore `WP-11`, which keeps the table's own stated invariant that ids are
listed in ascending order. Nothing else about the row changed.

## What Was Deliberately Not Touched

Confirmed by `git diff 74e67e4`:

- `scripts/frontmatter.ts` — the authority is consumed, never widened. No opt-out parameter was added
  and none exists.
- `boardColumns`' terminator. Where a TABLE ends is not where a SECTION ends; unifying it would
  harvest every later table in the same section as a board column. The difference is stated in one
  sentence beside it.
- `LIST_MARKER` and `ORDERED_MARKER`. Round 1's CR-03 widening is correct and is **kept**; Residual 4
  is the honest disclosure of its cost, not a reversal of it.
- Every existing refusal wording other than the step-set one, `APPROVED_STEP_VERBS`,
  `GOVERNED_CORPUS_PARTS`, `TECHNICAL_NAME_PARTS`, the two length bounds and the four banned
  constructions. This is a locator-and-honesty change, not a semantics change.
- Every file in the LANG-03 watched corpus (measured above, 41-entry union, `writing-profile.md`
  absent).

## Residuals Named, Not Absorbed

- **Residual 4 is a live, disclosed false red** with an empty input set today. Its promote trigger is
  the first governed workflow that legitimately carries an indented code block under a `## Steps`
  heading. Reconciling it requires owning both CR-03 and the fence-authority widening in one plan.
- **The derived locator-site scan over this module reports ONE**, and plan 29-25 must state an
  exemption for a heading RECOGNISER rather than widen the classifier. Recorded at the declaration.
- **`scripts/audit-model.ts::tableUnder` still carries a private section locator of this class.**
  Logged by 29-22, re-logged by 29-23, still out of scope, still unfixed. It is now the ONLY known
  remaining member of the class outside the four reconciled consumers.
- **`WP-11` is a new constraint on future authors, accepted with its cost stated.** It is decidable
  and enumerable and the corpus satisfies it at 19 of 19 today, but it is a rule the kit did not have
  yesterday. That is the one-way half of this plan.
- **The `WP-11` sentence is duplicated in two artifacts on purpose.** The gate and the profile each
  carry it as a literal, and a case holds them equal. Keeping them equal is now a maintenance
  obligation, and the case is what makes forgetting it loud rather than silent.

## Known Stubs

None. No placeholder, no `TODO`, no unwired data path was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
`T-29-24-SC` had an empty input set as predicted: no package-manager install occurred and
`package.json` is unchanged. `T-29-24-02` (the indented-block admission) is **accepted** with its
measurement recorded and its verdict pinned, exactly as the register directs. `T-29-24-05` (the
trailing-whitespace normalization) is **mitigated**: `TECHNICAL_NAMES_COUNT` was re-derived and is
still 76, and both directions of the equality now carry a case.

## Self-Check: PASSED

- `agent-factory/writing-profile.md` — FOUND. The `WP-11` row is at line 54 and is marked
  `decidable`; the `### Why a steps section carries at least one list item` subsection is present.
- `scripts/check-imperative-lexicon.ts` — FOUND. **Both declarations are gone, and the counts below
  are the measured ones rather than the ones this section first claimed.** `unfencedIndexOf` has
  exactly **one** occurrence — line 541, inside the `HEADING_LINE` docblock recording the deletion —
  and `SECTION_HEADING_LINE` has exactly **three** — lines 541, 554 and 678, every one inside a
  comment block recording its deletion. **None of the four is a declaration**, which is the property
  that matters; the first draft of this self-check asserted "zero" and "two" from memory and was
  corrected by running the grep. `Residual 1` is gone and a note records where the rule now lives;
  `Residual 4` is present with its conflict, direction, live-corpus fact and promote trigger.
- `scripts/check-imperative-lexicon.js` — FOUND, fresh (48 committed `.js` match a fresh rebuild).
- `scripts/check-imperative-lexicon.test.ts` — FOUND. **42 → 52 `it(` literals** (10 added), which
  vitest executes as **45 → 55 tests** because two loop-generated blocks are unchanged. Both counts
  are stated because they are different numbers and quoting only one invites the next reader to
  reconcile them against the wrong denominator.
- `scripts/check-foundation-guards.test.ts` — FOUND. This module's pin lists three symbols; all four
  consumer entries now list their post-rewire sets; the consumer list is unchanged at eight members.
- commit `6d4623c` — FOUND
- commit `42d6430` — FOUND
- commit `dc2b032` — FOUND
