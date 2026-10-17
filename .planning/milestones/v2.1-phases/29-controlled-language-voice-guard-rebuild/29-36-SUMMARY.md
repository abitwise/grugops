---
phase: 29-controlled-language-voice-guard-rebuild
plan: 36
subsystem: guard-harness
tags: [lang-07, wr-01, wr-03, contract-classifier, reach-predicate, d-24, gap-closure-round-4]
status: complete
requires:
  - scripts/frontmatter.ts (the `-1` contract prose — read, unchanged)
  - scripts/frontmatter.test.ts (the `-1` contract classifier, plan 29-32)
  - scripts/section-locator-oracle.test.ts (the eight-axis corpus and REACH map, plan 29-29)
provides:
  - a contract classifier that requires a guarded branch to LEAVE THE SCOPE, proven by a third plant
  - the exit test's arm RECORDED per site, with both arms proven reached over the live tree
  - a blind-spot list corrected in both directions
  - REACH.I5 restated from I5's own predicate and naming NO locator's answer
  - the 1800 -> 720 delta as a PERMANENT measurement, both directions attributed
  - the probe/reach set equality — headLastUnfenced breaks I5 on EXACTLY I5's reach
affects:
  - scripts/frontmatter.test.ts
  - scripts/section-locator-oracle.test.ts
  - scripts/check-foundation-guards.test.ts
tech-stack:
  added: []
  patterns:
    - "a predicate is only as good as the POSITION it is asked at — `at > 0` was true of the authority's answer while the invariant is asked of an arbitrary locator"
    - "a narrowing must prove it kept its own counter-example, by assertion; the assertion is what found the second defect"
    - "a comparison is not a guard: the guarded branch must leave the scope, and the consequent is bounded by INDENTATION so a sibling is never mistaken for it"
    - "when a predicate's only consumer changes, the predicate goes dead — keep it byte-unchanged and give it a live consumer that makes the delta measurable"
    - "an equality between two independently written expressions is evidence; it is circular only if one consults the other"
    - "record WHICH arm of a split predicate answered, then assert the live tree reaches both"
key-files:
  created: []
  modified:
    - scripts/frontmatter.test.ts
    - scripts/section-locator-oracle.test.ts
    - scripts/check-foundation-guards.test.ts
decisions:
  - "`fail(` was DELIBERATELY EXCLUDED from the exit set, against 29-REVIEW § WR-01's own suggestion. A refusal helper that records a finding and returns does not LEAVE THE SCOPE, so admitting it would re-open the exact shape being closed (`if (at === -1) { fail(...); } use(at)`). This is the narrower reading and narrower is the safe direction; the tree's one site that calls `fail` in its consequent also `return`s there, so nothing live depends on the wider rule. The gap is disclosed as blind spot 6 rather than silently accepted."
  - "REACH.I5 names NO locator's answer at all — it is `two UNFENCED occurrences of the heading`, full stop. The plan's stated behaviour and the review's suggested fix both keep an `at > 0` conjunct anchored on the AUTHORITY, and that conjunct excludes 360 cells `headLastUnfenced` really does violate I5 on. `headViolations` takes an ARBITRARY locator, so a reach predicate that consults one particular locator's answer is measuring that locator, not the invariant."
  - "REACH_FLOORS.I5 moved 1800 -> 720, NOT 1800 -> 360 as the review projected. The old set was wrong in BOTH directions and the two errors partly cancelled: 1440 cells left and 360 JOINED, with an overlap of 360. All four numbers are asserted permanently rather than quoted."
  - "`occurrencesOf` went unreferenced when REACH.I5 stopped calling it. It was NOT deleted (a plan prohibition) and NOT left dead: it is the one live consumer inside `HISTORICAL_I5_REACH`, the fixture that keeps the 1800 population countable. A floor that moved is only evidence for its own necessity while the old population can still be measured."
  - "The exit test reports WHICH arm admitted a guard (`same-line` / `consequent`) and a new case asserts the live tree reaches both. Splitting a predicate into arms creates an arm nobody has seen fire, and the plants alone cannot settle it — they are written by the same hand as the rule."
metrics:
  duration: 35m
  completed: 2026-08-16
actuals:
  tokens: 14200
  tasks: 3
  commits: 3
---

# Phase 29 Plan 36: WR-01 and WR-03 — predicates asked at the wrong position Summary

A comparison that does nothing is no longer counted as a guard, and I5's reach is derived from I5's
own loop body instead of from one particular locator's answer — a correction that turned out to run
in **both** directions, not the one the review reported.

## What was built

| Artifact | File | Kind |
|---|---|---|
| the exit requirement (`EXIT_RE` + `guardLeavesScope`) | `scripts/frontmatter.test.ts` | narrowed classifier arm |
| `guarded-but-inert-plant.ts` | written to a temp dir by `scripts/frontmatter.test.ts` | third plant fixture |
| "THE CLASSIFIER DISCRIMINATES ACROSS THREE PLANTS" | `scripts/frontmatter.test.ts` | extended case, one sorted verdict triple |
| `ExitArm` + `ContractSite.exitArm` | `scripts/frontmatter.test.ts` | which arm answered, recorded per site |
| "BOTH ARMS OF THE EXIT TEST ARE ASKED OVER THE LIVE TREE" | `scripts/frontmatter.test.ts` | new case |
| blind spot 6 + the DECIDED paragraph | `scripts/frontmatter.test.ts` | list corrected in both directions |
| the restated `REACH.I5` | `scripts/section-locator-oracle.test.ts` | corrected reach predicate |
| `HISTORICAL_I5_REACH` | `scripts/section-locator-oracle.test.ts` | fixture-only control, the old predicate |
| "the cells headLastUnfenced breaks I5 on lie INSIDE I5's reach" | `scripts/section-locator-oracle.test.ts` | new case |
| the 360/360 partition | `scripts/section-locator-oracle.test.ts` | five assertions in the corpus-shape case |

## Task 1 — WR-01: a comparison that does nothing

### RED FIRST, against the SHIPPED classifier

The third plant and the verdict triple were written and run **before** the classifier changed. This
is the shipped rule's own answer, not a description of it:

```
$ npx vitest run scripts/frontmatter.test.ts -t "DISCRIMINATES ACROSS THREE PLANTS"
[29-36 WR-01 three-plant verdicts] guarded-but-inert-plant.ts line 3 bound at guarded true
                                 | guarded-plant.ts line 3 bound at guarded true
                                 | unguarded-plant.ts line 3 bound at guarded false
AssertionError: expected [ …(3) ] to deeply equal [ …(3) ]
-   "guarded-but-inert-plant.ts=UNGUARDED"
+   "guarded-but-inert-plant.ts=GUARDED"
```

After the change, same plants, same `contractScan`:

```
[29-36 WR-01 three-plant verdicts] guarded-but-inert-plant.ts line 3 bound at guarded false
                                 | guarded-plant.ts line 3 bound at guarded true
                                 | unguarded-plant.ts line 3 bound at guarded false
Tests  7 passed | 287 skipped        exit 0
```

The two pre-existing plants keep their verdicts, and they are asserted **as one sorted triple**
rather than three separate expectations — asserting each bucket alone is how a rule that flips two
plants at once passes two of three assertions.

### The rule, and the bound that carries it

After a `guardRe` hit the branch must LEAVE THE SCOPE — `return`, `throw` or `continue`, on the
comparison line or inside its consequent. The consequent is bounded by **indentation** (`<= gi`
closes it), which is not decoration: the inert plant's own `return` sits in a following **sibling**
at the same indentation as the comparison. Mutation-proved in-session:

```
$ perl -pi -e 's/<= gi/< gi/'    # weaken the bound to the obvious spelling
[29-36 WR-01 three-plant verdicts] guarded-but-inert-plant.ts … guarded true
AssertionError: +   "guarded-but-inert-plant.ts=GUARDED"
$ # reverted, cmp byte-identical
```

An inert comparison is **stepped over** rather than treated as a stop, so a later comparison that
really does exit still counts. Reporting a live consumer UNGUARDED because a redundant comparison
sits above its real guard would be a false red, and the plan's prohibition names that as a finding
to fix rather than a rule to relax.

### The live UNGUARDED set is still EMPTY

All nine live sites stay GUARDED. Seven exit on the comparison line
(`if (at === -1) return null;`, `throw`, …); two exit inside an indentation-bounded consequent
(`check-banned-claims.ts:613` via `return null` after its `fail(`, `check-diff-disposition.ts:1261`
via `continue`). The narrowing reported **no** live site, so there was no hidden unguarded consumer
to fix.

### Both arms, because an arm nobody has seen fire is an arm with no evidence

The narrowing split one question into two arms. `guardLeavesScope` now returns **which** arm
answered, the arm is recorded on every `ContractSite`, and a new case asserts the live tree reaches
`["consequent", "same-line"]` — the union, not each alone. That is the WR-01 lesson turned on the
fix itself: the question is at which POSITIONS a predicate is asked, never only which tokens it
accepts.

### The blind-spot list, corrected in both directions

The inert-comparison shape was in **no** item and is now DECIDED, recorded as such at the
declaration so it cannot be re-added as an unknown. Item 6 is added for what the exit test genuinely
cannot see: a guard that leaves the scope only through a helper. A list that keeps a closed item is
as unreliable as one that omits an open item.

## Task 2 — WR-03: the reach predicate was wrong in BOTH directions

### The review's number reproduced, then found to be the wrong correction

Restating `REACH.I5` the way the review suggests reproduces its number exactly:

```
AssertionError: I5's reach against its pinned floor: expected 360 to be 1800
```

And then this plan's own narrowing-hazard case — written because the plan required the narrowing to
prove it kept its evidence — went **RED on that very predicate**:

```
AssertionError: a cell on which I5 is VIOLATED and which I5's reach predicate says is not
exercise — the reach was narrowed past its own counter-example: expected [ …(360) ] to deeply
equal []
```

**360 cells that `headLastUnfenced` really does violate I5 on sat outside the corrected reach.**

The cause is the same species as WR-01. `at > 0` asks for the **authority's** answer, but
`headViolations` takes an **arbitrary** locator — this file says so at its own negative-answer case.
A document whose first unfenced occurrence is line **zero** makes the authority answer `0`, so the
conjunct called it unexercised; `headLastUnfenced` answers the *last* occurrence and breaks I5 on
exactly that document. The predicate was being asked at a position I5 is never evaluated at.

### The corrected predicate names no locator's answer

I5's loop body can report iff some line **before** the answer is an unfenced occurrence of the
heading, and a document admits such an answer iff it carries **at least two unfenced occurrences** —
necessary (with one or none no answer has an unfenced predecessor) and sufficient (an answer at the
later one does). Counted directly, never as `occurrencesOf` minus a fenced tally: one expression
minus a projection of its own output is the shape this same round charges `readRegistry` with.

### The delta, published as four permanent assertions

```
OLD  1800  = raw occurrences >= 2  AND  the AUTHORITY's answer > 0
NEW   720  = UNFENCED occurrences >= 2
     1800 INTERSECT 720 = 360      dropped 1440      gained 360
```

Not a transcript — `HISTORICAL_I5_REACH` reconstructs the old predicate as a fixture and the case
asserts all four numbers every run, plus both attributions: **not one** of the 1440 dropped cells
can break I5 (they carry only a fenced earlier occurrence), and **every one** of the 360 gained
cells does. A floor swapped silently would have erased the evidence for its own necessity.

That fixture is also `occurrencesOf`'s one live consumer, so the function stays byte-unchanged and
does not go dead — see the deviation below.

### The narrowing kept its evidence, and the containment is an EQUALITY

The probe's I5-violating set is asserted non-empty **first**, then asserted equal — not merely a
superset — to the narrowed reach. `headLastUnfenced` is maximally adversarial for I5: fence-aware
and complete, its only possible error is picking a later unfenced occurrence, which is precisely
what I5 forbids. So it fails on every cell carrying a second unfenced occurrence and on no other.
The equality is between two expressions with nothing in common (one counts unfenced occurrences,
the other runs a locator through `headViolations`), so it is evidence rather than circularity.

Mutation-proved: restoring the `at > 0` conjunct reds the case with the same 360 escaped cells.

### `TWO_UNFENCED_CELLS` re-derived — UNCHANGED at 720, and now coinciding

It answers a corpus-shape question and already counted unfenced occurrences only; what it lacks is
the `at > 0` half, and this plan's finding is that I5's reach should lack it too. The two numbers
now **coincide** at 720, and the coincidence is a fact rather than a copy: I5's structural
precondition *is* the corpus-shape property the duplicate axis was added to deliver. They are kept
as separate constants with their equality asserted, so an edit moving one without the other reds.

The 360/360 split of those 720 on the `at > 0` half is pinned in the corpus-shape case — it is the
whole of the too-narrow half, on the record as a number rather than an argument.

### Everything else in the oracle is byte-unchanged

```
$ git diff f9ba84a..HEAD -- scripts/section-locator-oracle.test.ts | grep -E "^[+-] *(I1|I2|I3|I4|I5|I6):|..."
-  I5: (c) => occurrencesOf(c) >= 2 && unfencedHeadingIndex(c.text, c.heading) > 0,
+  I5: (c) => {
-  I5: 1800,
+  I5: 720,
```

`EXPECTED_CELLS`, every other `REACH_FLOORS` entry, `FENCED_BEFORE_UNFENCED_CELLS`,
`UNFENCED_BEFORE_FENCED_CELLS` and `occurrencesOf` do not appear in the diff at all. The round-3
sub-corpus assertions still hold: 7200 cells, a clean last-match sweep, I5 reach **0** over it.

## Task 3 — the premises beneath both narrowings, and the sweep

Task 3 produced **no diff**: both premise assertions already exist and both still hold, which is the
outcome the task was written to establish.

| Premise | Where | Result |
|---|---|---|
| the contract scan's classifier count vs. its INDEPENDENT second count (a `g`-flagged match that never runs the classifier) | `frontmatter.test.ts` | agree — the narrowing changed WHICH sites are guarded, not HOW MANY exist |
| both contract-scan vacuity floors refuse an empty answer | `frontmatter.test.ts` | both fire by name |
| the oracle's cell count derived TWICE (axis-length product, and a counter inside the consuming loop) + the array's own length | `section-locator-oracle.test.ts` | all three equal 21600 — a reach predicate change did not touch the corpus |

### Plan 29-35's consumer values, confirmed untouched

```
$ git diff f9ba84a..HEAD -- scripts/check-foundation-guards.test.ts scripts/frontmatter.test.ts \
    | grep -E "LOCATOR_CONSUMER|CONTRACT_CONSUMER|CONTRACT_SITE_COUNT"
NONE — all three pins byte-untouched by plan 29-36
```

`LOCATOR_CONSUMERS` 7, `CONTRACT_CONSUMERS` 7, `CONTRACT_SITE_COUNT` 9 — the same numbers plan
29-35's SUMMARY published. Two plans moving the same pin in one round, one of them silently, is how
a set literal comes to be wrong while every case is green.

### The census, re-measured at BOTH task boundaries

| number | 29-35 | task 1 | task 2 | delta |
|---|---|---|---|---|
| occurrences | 5492 | 5494 | 5510 | +18 |
| classified lines | 5419 | 5421 | 5437 | +18 (the SAME delta at both boundaries) |
| statement-level multi-line | 1123 | 1125 | 1134 | +11 |
| quote-aware multi-line | 1117 | 1119 | 1128 | +11 (the SAME delta — the counters did not diverge) |
| counter disagreements | 14 | 14 | 14 | UNCHANGED |
| subject-only multi-line | 621 | 623 | 631 | +10 |
| modules | 47 | 47 | 47 | UNCHANGED |

Every figure read out of the census's own answer, never incremented. The spread is accounted for at
the declaration: task 1's four added and two removed assertions are all in the same multi-line
spelling so all counters move together; seven of task 2's sixteen are single-line, so the paren
counters move by nine, and one of the remaining nine names a short subject inline, so the
subject-only counter moves by eight.

### The sweep

| Check | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 48 committed .js file(s)" |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **2007 passed / 2 skipped across 52 files** (round-4 baseline 1987; 29-35 left 2005; +2 = this plan's two new cases) |
| `check-foundation-guards` | exit 0 |
| `check-imperative-lexicon` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `check-banned-claims` | exit 0 |
| `check-audit-register` | exit 0 |
| `check-claim-anchors` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `git diff --exit-code -- package.json package-lock.json` | exit 0 |
| `git diff --exit-code f9ba84a..HEAD -- package.json package-lock.json` | exit 0 — no package installed |
| `git status --porcelain` | no stray plant — every plant is written to a temp directory |

No `.ts` production source was edited, so no committed `.js` changed; freshness confirms all 48
still match a fresh rebuild.

**A green suite is not proof.** What is offered as evidence is the two RED transcripts (the shipped
classifier calling an inert comparison a guard; the review's own suggested reach predicate excluding
360 of its own counter-examples), the two reverted mutation proofs, and the four permanently
asserted delta numbers — not the passing count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] The plan's and the review's stated `REACH.I5` keeps a 360-cell hole**

- **Found during:** Task 2, by this plan's own narrowing-hazard case, on its first run.
- **Issue:** both the plan's `<behavior>` ("the head answer is an index above zero AND …") and the
  review's suggested code keep an `at > 0` conjunct evaluated against `unfencedHeadingIndex`. I5 is
  asked of an **arbitrary** locator. On a document whose first unfenced occurrence is line zero the
  authority answers `0` while `headLastUnfenced` answers the last occurrence and violates I5 — so
  360 counter-examples fall outside the reach that is supposed to be the evidence they exist.
- **Fix:** `REACH.I5` names no locator's answer at all: two UNFENCED occurrences, counted directly.
  Floor 1800 -> **720**, not the projected 360. Both directions of the delta are asserted
  permanently.
- **Files modified:** `scripts/section-locator-oracle.test.ts`
- **Commit:** `5983ed3`

**2. [Rule 2 — Missing correctness] `fail(` excluded from the exit set, and disclosed**

- **Found during:** Task 1, writing the rule.
- **Issue:** the review suggests admitting a `fail(` call as an exit. `fail()` records a finding and
  returns; it does not leave the scope, so `if (at === -1) { fail("..."); } use(at)` would have been
  classified GUARDED — the same defect wearing a helper.
- **Fix:** the exit set is `return | throw | continue`. The tree's one site calling `fail` in its
  consequent also `return`s there, so no live site depends on the wider rule. The genuine gap — a
  guard that exits ONLY through a helper — is added as blind spot 6 rather than accepted silently.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `0286db3`

**3. [Rule 3 — Blocking] `occurrencesOf` went dead when its only consumer changed**

- **Found during:** Task 2, after restating `REACH.I5`.
- **Issue:** the plan prohibits deleting or redefining `occurrencesOf` because "the corpus-shape
  case promises RAW occurrences". That case in fact uses a local `occurrences` helper —
  `REACH.I5` was `occurrencesOf`'s **only** caller. Correcting the predicate left an unreferenced
  function, which is the shape that rots while a suite stays green.
- **Fix:** kept byte-unchanged and given a live consumer: `HISTORICAL_I5_REACH`, the reconstructed
  old predicate, which is what makes the 1800 population countable and the delta a permanent
  measurement rather than a comment.
- **Files modified:** `scripts/section-locator-oracle.test.ts`
- **Commit:** `5983ed3`

**4. [Rule 3 — Blocking] The tripwire census pins had to be re-derived at both boundaries**

- **Found during:** Tasks 1 and 2, running `check-foundation-guards.test.ts`.
- **Issue:** the census counts assertions across all test modules and is pinned two-sided, so any
  added or removed assertion reds it. Not a defect — the tripwire working.
- **Fix:** all six live numbers read out of the census's own answer at each boundary (via a
  temporary print that was removed before commit), pinned, and the spread accounted for in prose.
  Never adjusted-until-green.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commits:** `0286db3`, `5983ed3`

### Additions beyond the plan

- **The exit test reports WHICH arm answered**, and a new case asserts the live tree reaches both.
  The plan asked for a rule; a rule split into arms creates an arm nobody has seen fire, and the
  three plants cannot settle it because they are written by the same hand as the rule.
- **The probe/reach containment is asserted as an EQUALITY** rather than a subset, with the
  maximal-adversary argument recorded. The plan asked for a subset; the equality is strictly
  stronger and its two sides are independently written.

### Execution-flow note

The plan's task 1 is `type="tracer"`, whose interactive protocol is to stop at a
`checkpoint:human-verify` after committing. It was run end to end instead, because the plan
frontmatter declares `autonomous: true` and `.planning/config.json` sets
`workflow.human_verify_mode: "end-of-phase"`. The tracer's `<verify>` was re-run in full after its
commit and exited 0, which is the gate the checkpoint exists to enforce. This matches plan 29-35's
recorded precedent.

### What this plan did NOT do

- **No byte ceiling was raised.** LANG-08's prohibition half is untouched.
- **No reach floor was LOWERED to make a case pass.** I5's moved because the predicate changed, and
  it moved UP relative to the review's projection.
- **No live call site was reclassified GUARDED by widening the guard recogniser.** The recogniser
  was narrowed and the live set stayed empty on its own.
- **`occurrencesOf` was neither deleted nor redefined**, and the corpus-shape case's raw-occurrence
  promise is intact.
- **No production `.ts` was edited**, so no committed `.js` moved; freshness re-confirmed anyway.
- **No package was installed.** Manifest and lockfile byte-unchanged across the plan.
- **LANG-07 was NOT marked complete.** Round-5 verification decides that, not this plan.

## Known Stubs

None. No placeholder, empty value or TODO was introduced. `HISTORICAL_I5_REACH` is a fixture-only
control, named as such at its declaration and explicitly not a live rule — the same posture plan
29-35 used for `HISTORICAL_LOOKAHEAD_GRAMMAR`.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.

The plan's register is discharged as follows: **T-29-36-01** (`mitigate`) — the exit requirement is
in `contractSitesIn`, proven by a third plant with an exit-0 pre-fix transcript and a reverted
mutation proof of its indentation bound; **T-29-36-02** (`mitigate`) — the blind-spot list corrected
in both directions, with the inert shape recorded as DECIDED and the helper-expressed exit added;
**T-29-36-03** (`mitigate`) — `REACH.I5` restated from the invariant, the floor re-derived in-session
and the delta published as four permanent assertions with both attributions; **T-29-36-04**
(`mitigate`) — the `headLastUnfenced` violating set asserted non-empty and EQUAL to the narrowed
reach, which is the assertion that found deviation 1. **T-29-36-SC** (`accept`) — discharged by
asserted absence: `package.json` and `package-lock.json` byte-unchanged across the plan.

## Self-Check

- `scripts/frontmatter.test.ts` — FOUND
- `scripts/section-locator-oracle.test.ts` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- `.planning/phases/29-controlled-language-voice-guard-rebuild/29-36-SUMMARY.md` — FOUND
- commit `0286db3` — FOUND
- commit `5983ed3` — FOUND

## Self-Check: PASSED
