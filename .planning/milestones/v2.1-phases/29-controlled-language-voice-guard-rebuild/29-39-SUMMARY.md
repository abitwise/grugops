---
phase: 29-controlled-language-voice-guard-rebuild
plan: 39
subsystem: guard-harness
tags: [lang-03, lang-07, wr-07, census, d-25, d-08, gap-closure-round-4]
status: complete
requires:
  - scripts/check-foundation-guards.test.ts (the duplicate-assertion tripwire and its census, plan 29-25 / 29-29)
  - scripts/audit-model.ts (the IN-02 and IN-04 source notes left by plan 29-37, read and confirmed)
  - 29-REVIEW.md round 4 (the thirteen findings this plan disposes of)
provides:
  - censusRelationshipFindings — ONE authority for every volume relationship, consulted by the live case and by the discrimination case
  - censusAtCommit — one git-backed reader for both commit-pinned observations
  - TRIPWIRE_CLASSIFIED_FLOOR_PER_MODULE and three sibling RATE floors replacing exact volume equalities
  - PLAN_29_39_TRIPWIRE — the seven exact volumes relocated behind a fixed commit
  - a permanent case proving the census reds on breakage and stays quiet on growth
  - docs/audit/29-round4-residuals.md — the round's disposition record, deferrals, residual roll-up and probe arithmetic
affects:
  - scripts/check-foundation-guards.test.ts
  - docs/audit/29-round4-residuals.md
tech-stack:
  added: []
  patterns:
    - an exact number is legitimate only where it cannot drift; relocate it behind a fixed commit rather than deleting it (D-25)
    - a floor expressed as a RATE grows with the corpus it floors; a floor expressed as a total must be bumped
    - one authority per predicate — the live case and the discrimination case must not hold two implementations of one rule
    - measure the drift, never quote the review's account of it
    - a relationship with no witness is prose wearing an assertion; measure the absence rather than claiming it (D-08)
    - a case name that survives the deletion of the thing it names is the claim-wider-than-its-assertion class
key-files:
  created:
    - docs/audit/29-round4-residuals.md
  modified:
    - scripts/check-foundation-guards.test.ts
decisions:
  - The review says one added assertion moves three of the seven pins. Measured, that is wrong in BOTH directions - a single-line assertion moves TWO, a multi-line one moves FIVE, an added file moves THREE. The conversion set was taken from the measurement, not from the review.
  - counterDisagreements was converted even though it does NOT move on an ordinary added assertion, because it moved once historically (14 to 15, plan 29-37) and because as a SHARE it is the only assertion in the block able to contradict the quote-aware counter.
  - The relationships were collapsed into ONE function rather than left as inline assertions. The discrimination case has to decide the same question about a broken census, and two implementations of one predicate is how this phase spent four rounds finding its two answers disagreed.
  - The identity was KEPT and LABELLED rather than deleted. Its absence of a witness is now MEASURED by the discrimination case across seven mutations, which is stronger evidence than deleting it would have left.
  - The new discrimination case was RENAMED to carry the word tripwire, because the plan's own acceptance command filters on that word and would not have run the artifact it exists to prove.
  - LANG-03 and LANG-07 were NOT marked complete, holding the pattern every plan of this round followed. Round-5 verification decides.
metrics:
  duration: 30m
  completed: 2026-08-16
actuals:
  tokens: 15864
  tasks: 3
  commits: 4
---

# Phase 29 Plan 39: Round-4 Census Conversion and Disposition Record Summary

The duplicate-assertion tripwire keeps its vacuity floor and loses its unread reds, the seven exact
volumes are relocated behind a fixed commit where they cannot drift, and round 4's thirteen findings
each have a written disposition — nine closed with a re-run reproduction, four deferred by recorded
user decision.

---

## Task 1 — WR-07: the census reds on a broken measurement, not on a growing corpus

### The measurement that decided the conversion set

The review states that adding a single assertion "moves three of them". That was not taken on trust.
Scratch copies of all 47 test modules were made and edited, and the census re-derived over each.
**The review is wrong in both directions.**

**EDIT 1 — one ordinary SINGLE-LINE assertion appended to `voice-model.test.ts`:**

| value | before | after | delta |
|---|---|---|---|
| modules | 47 | 47 | 0 (UNMOVED) |
| occurrences | 5600 | 5601 | +1 |
| classified | 5527 | 5528 | +1 |
| multiLineStatements | 1153 | 1153 | 0 (UNMOVED) |
| multiLineStatementsQuoteAware | 1146 | 1146 | 0 (UNMOVED) |
| counterDisagreements | 15 | 15 | 0 (UNMOVED) |
| multiLineSubjects | 641 | 641 | 0 (UNMOVED) |

**EDIT 2 — one ordinary MULTI-LINE assertion, the same module:**

| value | before | after | delta |
|---|---|---|---|
| modules | 47 | 47 | 0 (UNMOVED) |
| occurrences | 5600 | 5601 | +1 |
| classified | 5527 | 5528 | +1 |
| multiLineStatements | 1153 | 1154 | +1 |
| multiLineStatementsQuoteAware | 1146 | 1147 | +1 |
| counterDisagreements | 15 | 15 | 0 (UNMOVED) |
| multiLineSubjects | 641 | 642 | +1 |

**EDIT 3 — one added test FILE carrying one assertion:**

| value | before | after | delta |
|---|---|---|---|
| modules | 47 | 48 | +1 |
| occurrences | 5600 | 5601 | +1 |
| classified | 5527 | 5528 | +1 |
| multiLineStatements | 1153 | 1153 | 0 (UNMOVED) |
| multiLineStatementsQuoteAware | 1146 | 1146 | 0 (UNMOVED) |
| counterDisagreements | 15 | 15 | 0 (UNMOVED) |
| multiLineSubjects | 641 | 641 | 0 (UNMOVED) |

**EDIT 4 — one added test FILE carrying NO assertion:** only `modules` moves, 47 to 48, and the new
file lands in `barren`. This is the edit that shows why the two vacuity pins are the right two to
keep exact.

**So the counts are 2, 5, 3 and 1 — never 3 across the board.** A single-line assertion, which is
the commonest edit in the repository, moves **two** values. A multi-line assertion moves **five**.
The five that move on an unrelated assertion are exactly the five converted.

### What changed

- **The vacuity floor stays EXACT.** `TRIPWIRE_MODULES` and the `census.barren` equality are
  unchanged, with a declaration paragraph stating why: they answer whether the scan ran at all, a
  scan that read no modules or classified nothing in one is a broken measurement rather than a grown
  corpus, and a module count moves a handful of times a year where assertions move daily.
- **The five drifting values became relationships and RATE floors**, all decided by ONE authority,
  `censusRelationshipFindings`. Three relationships already in the file were kept and reused rather
  than a second set written beside them; what was added is the corpus-derived floor
  `TRIPWIRE_CLASSIFIED_FLOOR_PER_MODULE` and the two share floors that catch a lost CLASS.
- **The floors are RATES, not magic constants**, so the floor itself grows with the corpus. Measured
  headroom: 117.6 classified lines per module against a floor of 20; a 20.86% statement share
  against 5%; an 11.60% subject share against 2%; a 0.271% disagreement share against a 1% ceiling.
- **The exact volumes were RELOCATED, not deleted.** `PLAN_29_39_TRIPWIRE` pins all seven against
  the tree at `b76a65e`, asserted through `censusAtCommit`. The census run over that commit by git
  returns exactly the seven values that were pinned live, so this is a **move** and not a
  re-measurement.
- **The cost paragraph the review says is missing** is written at the declaration as a nine-row
  table naming, for each surviving pin, what it fires on and what it deliberately does not.

### The discrimination, proven end-to-end against the SHIPPED file

Not against a transliteration. Each perturbation was applied to
`scripts/check-foundation-guards.test.ts` itself, the live census case run, and the file restored
from a checksummed backup (`162a7e35…`, verified identical at the end).

| perturbation | live census case | finding ids |
|---|---|---|
| C0 unmutated (control) | GREEN | none |
| G1 one SINGLE-LINE assertion added | **GREEN** | none |
| G2 one MULTI-LINE assertion added | **GREEN** | none |
| B1 classifier recognises NOTHING | RED | R2, R3 |
| B7 classifier drops the MULTI-LINE class | RED | R5, R6 |
| B3 naive paren counter always 0 | RED | R4, R5, R7 |
| B4 quote-aware paren counter always 0 | RED | R7 |
| B5 subject counter always false | RED | R6 |
| B6 occurrence counter matches nothing | RED | R1 |

Against the same rows, the OLD design reds on **all three** growth edits (G1 on occurrences and
classified; G2 on five values; twenty added assertions on two) as well as on every breakage.
**Zero discrimination was lost and every unread red was removed.**

`B7` is the row that justifies the two share floors. A classifier that still reads four fifths of
the corpus but loses the multi-line class leaves `classified` at 4319 of 5527 — comfortably above
every total floor — while the statement share collapses from 20.86% to 0.35%. Without R5 and R6 the
census would report that break as healthy.

### The finding this plan made about its own instructions

`|naive − quoteAware| ≤ counterDisagreements` — one of the three relationships the plan's action
names as a conversion target — **is a tautology**. For every line each counter contributes 0 or 1,
so the inequality holds by the triangle inequality for every possible input. It is the same shape
round 4 raised as WR-02 one module over in `readRegistry`, arriving here under a different spelling.
Leaning on it as a converted pin would have shipped the defect this round closed elsewhere.

It was **kept and labelled** rather than deleted, and its lack of a witness is now **measured**: the
discrimination case asserts `I1` fires on **none** of the seven mutations, including both that break
a paren counter outright. The disagreement SHARE ceiling (R7) is the assertion that does the work,
and it reds under both. Per D-08, every number left published carries either a witness that can
contradict it or a recorded statement that it has none — here, a measured one.

### Two smaller corrections made along the way

- The disclosed-floor prose at item 4 cited `TRIPWIRE_MULTILINE_STATEMENTS` and
  `TRIPWIRE_CLASSIFIED_LINES`, constants this plan removes. It was rewritten to name the share as a
  floor plus a dated observation. A comment citing a deleted symbol is the stale-prose class.
- The case name "four numbers, each derived, each pinned two-sided" survived the deletion of the
  two-sided volume pins in the first draft. Renamed, with the reason recorded at the case.

**An unexpected consequence worth recording.** This block carried three separate warnings telling a
later editor not to spell the scanned token in prose, because the census counted raw occurrences
over these very bytes — an effect measured twice, in plans 29-35 and 29-37. Pinning the exact
figures against a fixed commit **dissolves that hazard**: a census over git blobs cannot be moved by
a byte written afterwards. The warnings are kept as the record of why the pins moved.

---

## Task 2 — the round's deferrals, residuals and probe arithmetic

`docs/audit/29-round4-residuals.md`, 13 disposition rows — CR-01, WR-01 through WR-08, IN-01 through
IN-04 — nine closed with plan and evidence pointer, four deferred by user decision.

- **WR-08 says explicitly that it folds into the LANG-07 closure** rather than appearing
  unaddressed: it asked for §9.3 of the locator document to name both axes and the consumer, which
  §9.3a does, and the repair went further — both copies of the third grammar deleted.
- **The four deferrals** each carry file, re-measured line, a plain statement, the risk if never
  closed, live-or-latent status, and the explicit sentence that this is neither a closure nor a drop.
- **Line numbers were re-measured on today's tree**, with the review's cited ranges kept beside them.
  IN-01 moved `15496` to `15776` and IN-02 moved `1288` to `930`, because this round's own plans
  edited those modules. Addressing a site by coordinates rather than by code is this phase's own
  `D-38-2`.
- **IN-02 and IN-04 point at plan 29-37's source notes**, at `scripts/audit-model.ts:922-929` and
  `:1152-1157`. **Both confirmed present by reading**, and both records agree. IN-04's note carries
  the sharper half of the reasoning: newly asserting the figure somewhere else would have shut a
  deferred finding silently.
- **The residual roll-up carries both directions** — `V-29-29-01` CLOSED by 29-35, `V-29-35-01`
  OPENED by 29-35. The record states the consequence plainly: **net movement zero.** A round that
  closes a duplicated grammar and opens a duplicated parser has moved the duplication one level
  down, not removed it.
- **The LANG-08 override is repeated verbatim** with reason, acceptor (Olger Oeselg) and date
  (2026-08-15T09:57:04Z), and the prohibition half is **measured rather than asserted**:

| check | result |
|---|---|
| `roleCeiling()`'s body at `57affa1^` and at `HEAD`, hashed | **byte-identical**, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7` |
| files under a ceiling touched this round | **0** — `git diff --name-only 57affa1^..HEAD -- agent-factory/roles/` is empty |
| the one `agent-factory/` file that grew | `writing-profile.md`, 16833 B to 17961 B — **not under a ceiling**, `roleCeiling()` has no entry for it |

- **The probe arithmetic** is restated with its equality: 22 surfaced = 9 authored into this round's
  plans + 11 attributed to already-executed plans + 2 flagged planner assumptions. 9 + 11 + 2 = 22,
  zero dropped. Both unclassified edges are named with their assumptions, and **LANG-07's assumption
  is recorded as PARTLY FALSIFIED** — it claimed the edge was covered by named work, and the named
  work (29-35) found another instance of the same class.

---

## Task 3 — every closed finding re-tested against the tree that ships

### The premise, asserted before the evidence

```
$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
exit=0
```

### The nine reproductions

Re-run on a `git archive HEAD` mirror at `5038b80` (1579 files), each against the finding's own
recipe rather than against the SUMMARY that claimed it. **None still reproduces.** Full transcripts
in `docs/audit/29-round4-residuals.md` §7.2. In brief:

| id | result |
|---|---|
| CR-01 | closed at the layer the finding names; the `.js`-only route is bounded below |
| WR-01 | the review's inert plant is now `UNGUARDED` in a three-way verdict triple |
| WR-02 | the tautology survives only inside the comment recording its deletion |
| WR-03 | `REACH_FLOORS.I5` is **720**, and the review's projected 360 was wrong |
| WR-04 | both `bodyLines.length === 0` occurrences are comments; the one live `split.length > 0` is asserted true deliberately, to SHOW the retired form's acceptance |
| WR-05 | four reconciled numbers published per file, observed live on the mirror |
| WR-06 | reverting the row reds **2 of 62** naming `profile/wp04` |
| WR-07 | growth GREEN, all six breakages RED (table above) |
| WR-08 | the round-4 lookahead regexp occurs **0** times in production sources |

### The one boundary, drawn with a measurement

**CR-01's `.js`-only route still passes the gate**, by construction rather than by regression: the
membership pin reads the `.ts` source while round 4's reproduction edited the committed `.js`. Plan
29-33 disclosed exactly this. The half that covers it was measured rather than asserted —
substituting one member token in the committed `.js` of the real tree makes `npm run freshness` exit
**1** naming the file, and restoring returns it to **0**.

### A FALSE GREEN INSIDE THIS TASK'S OWN HARNESS

Recorded rather than quietly corrected. That freshness check was **first** run as
`cd $MIRROR && node $REPO/scripts/freshness.js` and reported `All build outputs fresh` at exit 0 over
a mirror whose `.js` had just been substituted. It read the repo's files rather than the mirror's
and skipped the `tsc` rebuild the npm script performs first — so it measured the wrong tree under
the wrong premise **and agreed with the answer being hoped for**. Re-run correctly in the repo with
backup and restore.

This is the **seventh** instance in five rounds of a harness in this phase producing a false result,
and the **fourth** where the false result pointed at the comfortable conclusion. The scratch census
harness used throughout task 1 was guarded against exactly this by asserting its own premise first —
it had to reproduce all seven shipped pins over the live tree before any measurement from it was
believed, and it did. The check that failed was the one written without that discipline.

### The sweep

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run freshness` | 0 — 48 committed `.js` fresh |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run typecheck` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **2029 passed / 2 skipped over 52 files** |
| `npm run check:public-docs` | 0 |
| `npm run check:banned-claims` | 0 |
| `npm run check:audit-register` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run check:diff-disposition` | 0 |
| `npm run check:imperative-lexicon` | 0 |
| `npm run check:nul-bytes` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `git diff --exit-code 57affa1^..HEAD -- package.json package-lock.json` | 0 |
| `git status --porcelain` | clean of plants |

The suite total moved 2027 to 2029 passing, which is this plan's two new cases and nothing else.

---

## Deviations from Plan

### Auto-fixed and corrected

**1. [Rule 1 - Bug] The plan's third named conversion target is a tautology**

- **Found during:** Task 1
- **Issue:** The plan's action names "the two paren counters cannot differ by more than the recorded
  disagreement" as one of four relationships to convert to. That inequality is true for every
  possible input by the triangle inequality and can never fire — WR-02's shape, in the file the
  round was fixing.
- **Fix:** Implemented as `I1`, explicitly labelled an identity, with its lack of a witness MEASURED
  across seven mutations; a genuine witness (the disagreement SHARE ceiling, R7) added beside it and
  proven to red under both paren-counter mutations.
- **Commit:** `490e3c9`

**2. [Rule 2 - Missing critical functionality] The plan's acceptance command would not have run the
plan's central artifact**

- **Found during:** Task 1
- **Issue:** The plan's artifact table names the new case "the census reds on a broken classifier
  and NOT on an added assertion", while its stated verify command is
  `npx vitest run scripts/check-foundation-guards.test.ts -t "tripwire"`. That filter does not match
  that name. Measured: with the plan's name the filter ran 4 cases and skipped the new one.
- **Fix:** The case name carries the word `tripwire`, with the reason recorded at the case. The
  filter now runs 5.
- **Commit:** `490e3c9`

**3. [Rule 1 - Bug] Stale prose citing constants this plan deletes**

- **Found during:** Task 1
- **Issue:** The disclosed-floor list at item 4 named `TRIPWIRE_MULTILINE_STATEMENTS` and
  `TRIPWIRE_CLASSIFIED_LINES` in prose. Both are removed by this plan.
- **Fix:** Rewritten to name the share as a floor plus a dated observation.
- **Commit:** `490e3c9`

**4. [Rule 1 - Bug] A false green in this plan's own verification harness**

- **Found during:** Task 3
- **Issue:** The freshness-catches-the-js-edit check was run against the wrong tree with the wrong
  premise and returned a false green.
- **Fix:** Re-run correctly; **the false result is recorded in the artifact and in this summary
  rather than replaced by the correct one**.
- **Commit:** `edb48b0`

### Scope decisions

- **The plan's `<behavior>` was treated as a hypothesis, not an instruction.** Deviation 1 is the
  case where it was wrong.
- **IN-01 through IN-04 were NOT fixed.** They are recorded. The plan's prohibition is explicit that
  fixing a deferred finding silently is the same accounting error as dropping it.
- **No byte ceiling was raised**, and the prohibition half is measured in Task 2 rather than
  asserted.
- **No package was installed**; the manifest and lockfile are byte-unchanged across the whole round.

---

## Requirements

`LANG-03` and `LANG-07` were **NOT** marked complete, and `gsd requirements mark-complete` was not
run. Every plan of round 4 declined to mark its own requirement, leaving the judgement to round-5
verification. That pattern is deliberate for a phase whose last four verification rounds each
returned `gaps_found` against a green tree, and this plan holds it.

---

## Known Stubs

None. No placeholder, hardcoded empty value, or unwired component was introduced.

---

## Residuals this plan leaves

1. **The rate floors carry margins chosen by this plan.** 20 classified lines per module, a 5%
   statement share, a 2% subject share, a 1% disagreement ceiling. Each sits far below its measured
   live value and each is proven to red under the mutation it exists for, but the margins themselves
   are judgements rather than derivations. A corpus that legitimately shifted toward single-line
   assertions by a factor of four would red R5 without anything being broken.
2. **`B2` — the classifier that recognises every line — was proven only through the recorded census**
   in the discrimination case, not end-to-end against the shipped file. Applying that mutation to the
   real file breaks dozens of unrelated cases, so the run would not have isolated the census's
   verdict. The other six mutations were all proven end-to-end.
3. **The commit-pinned snapshot depends on `b76a65e` remaining reachable.** This is the same posture
   the round-3 premise case already takes with `0ec8b61`, and the same exposure.
4. **The tripwire's disclosed misses are unchanged.** Converting the denominators changed nothing
   about what the scan can pair up; the multi-line miss is still an asserted intended verdict.

---

## Self-Check: PASSED

- `docs/audit/29-round4-residuals.md` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- Commit `490e3c9` — FOUND
- Commit `5038b80` — FOUND
- Commit `edb48b0` — FOUND
- 13 disposition rows present, all of CR-01 / WR-01..WR-08 / IN-01..IN-04 — VERIFIED
- `grep -c 'IN-0' docs/audit/29-round4-residuals.md` returns 9, at or above the required 8 — VERIFIED
