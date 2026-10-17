---
phase: 29-controlled-language-voice-guard-rebuild
plan: 42
subsystem: tooling-guards
tags: [LANG-04, guard_banned_claims, gap-closure, G-29-2, adversarial-pass, residual-record, harness-premise]
status: complete

requires:
  - "scripts/check-banned-claims.ts :: BENEFIT_VERB_MARKERS, the two conditional bare-term members, BANNED_CLAIM_EXCLUDED — plan 29-41's rule, held rather than re-derived"
  - "scripts/check-banned-claims.ts :: countBannedClaimOccurrences — the exported matcher, used to DERIVE expected finding counts instead of retyping them"
  - "scripts/check-banned-claims.test.ts :: the CHECK_ROOT mirror harness and profileDoc — reused, not reinvented"
provides:
  - "scripts/check-banned-claims.test.ts :: HISTORICAL_ENUMERATED_COMPREHENSION — the pre-fix grammar as a fixture-only shape, DERIVED from the authority, count pinned two-sided at 6"
  - "scripts/check-banned-claims.test.ts :: one permanent case per member of the measured family (6), each asserting the pre-fix and shipped verdicts DISAGREE"
  - "scripts/check-banned-claims.test.ts :: one discrimination case per admitted benefit marker (7), plus the no-marker CONTROL"
  - "scripts/check-banned-claims.test.ts :: the conditional-member cardinality assertion RELAXED 1 -> 3, still an equality, reason at the assertion"
  - "scripts/check-banned-claims.test.ts :: the empty-marker-array refusal, with the member count derived from the SOURCE TEXT"
  - "scripts/check-banned-claims.test.ts :: the grep-visibility PREMISE case — no control byte outside \\n and \\t in either file"
  - "scripts/check-banned-claims.ts :: BANNED_CLAIM_EXCLUDED entry for the rejected enumeration alternative, hits 0, measured"
  - "docs/audit/29-round5-residuals.md :: the round's disposition record — both gaps, 13 attack attempts, 4 new residuals, the two-direction roll-up, the LANG-08 override, 2 + 20 = 22"
affects:
  - "the next verification round — LANG-04 and LANG-07 remain Gaps Found; this plan marks nothing complete"

tech-stack:
  added: []
  patterns:
    - "a fixture is evidence only if it DISAGREES with the pre-fix build on its planted document; the pass alone is decoration"
    - "the pre-fix control is DERIVED from the live authority, so taking the rejected alternative reds the control's own pin"
    - "a property-based selector is identity-ASSERTED, so a declaration reorder reds at the selection and not at a distant case"
    - "the element count is derived from the SOURCE TEXT, independently of the loop that consumes the array"
    - "a pin that fires is RE-MEASURED with its reason at the assertion, never deleted, and stays an equality"
    - "assert the harness's own premise: grep-visibility is now a permanent case, because a NUL byte made two acceptance greps return a confident false 0"

key-files:
  created:
    - docs/audit/29-round5-residuals.md
  modified:
    - scripts/check-banned-claims.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js

decisions:
  - "The two reds plan 29-41 handed over are cleared by DERIVATION, not by re-pinning: the conditional-member count relaxed 1 -> 3 with the reason at the assertion, and findingCount's stale 2 replaced by countBannedClaimOccurrences rather than retyped as 3."
  - "The pre-fix control is DERIVED from BANNED_CLAIM_LITERALS (the comprehension group's unconditional members) rather than retyped, which makes the refusal of option (b) an ASSERTION: appending a phrasing moves the two-sided count of 6 and reds."
  - "FIVE surfaces encoded the one-conditional-member singular, not the three the plan named. Surfaces 4 (a describe title asserting a count) and 5 (the conformance-marker entry's own reason) were undiscovered, plus the CONDITIONAL_NAME selector itself."
  - "The profile is NOT edited. Its sentence about what the gate proves is LIVE-FALSE at a count of 1, escalated as V-29-42-03 with its edit cost, because an edit inside the region moves BANNED_CLAIM_EXEMPT_EXTENT and needs a D-04 row."
  - "Four residuals opened by the adversarial pass are measured, counted, directional and LEFT OPEN. One (V-29-42-01) is fail-OPEN; three are fail-CLOSED at 0 live."
  - "A NUL byte this plan introduced is FIXED, not escalated — a defect a plan causes is not a residual to carry — and the premise it broke is now a permanent assertion."

metrics:
  duration: ~35m
  completed: 2026-08-17
  tasks: 3
  commits: 3

actuals:
  tokens: 16102
  tasks: 3
  commits: 3
---

# Phase 29 Plan 42: G-29-2 — the test surface, the refusal on the record, and the attack Summary

Plan 29-41's rule is now held by cases proven able to FAIL rather than observed passing: 21 new
assertions including one permanent case per member of the measured family, each asserting the
reconstructed pre-fix grammar and the shipped gate DISAGREE on its planted line; the pin that encoded
the singular re-measured rather than removed; the rejected enumeration alternative on the record with
the measured 0 that refused it; and the new co-occurrence window attacked over 13 recorded attempts,
two of which succeeded and are escalated by name with a live corpus count.

## What was built

| # | Task | Commit | Key change |
|---|------|--------|-----------|
| 1 | the family held by cases proven able to fail; the pin relaxed not deleted; the plants made unambiguous (tracer) | `eb29ed5` | `HISTORICAL_ENUMERATED_COMPREHENSION` + 6 family cases + 7 marker cases + the empty-marker refusal + identity-asserted selectors; cardinality 1 -> 3 |
| 2 | the rejected alternative and every refusal on the record | `1c9354e` | `BANNED_CLAIM_EXCLUDED` entry for option (b) at a measured 0; surface 5 corrected; `V-29-42-03` escalated, the profile unedited |
| 3 | the predicate attacked on the axis it introduces, and the round's record | `481054c` | 13-attempt adversarial log, 4 named residuals with live counts, `docs/audit/29-round5-residuals.md` |

## The harness premise, asserted before anything was believed — and it FAILED

```
npm run freshness
  -> All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.   exit 0
```

`git archive HEAD` mirror at `1c9354e`, gate `.js` proven byte-identical before the first plant:

```
4bb7712b732aa898d8b5858960cd9e130b7225ab814ad2e998d0db8fd1c8dc6d  scripts/check-banned-claims.js         (repo)
4bb7712b732aa898d8b5858960cd9e130b7225ab814ad2e998d0db8fd1c8dc6d  <mirror>/scripts/check-banned-claims.js
clean-mirror control: exit 0
```

**And then the premise broke anyway, inside this plan's own acceptance checks — the seventh false
harness result in this phase.** A raw NUL byte was written into
`scripts/check-banned-claims.test.ts` during task 1. BSD `grep` classified the whole file as binary and
reported **ZERO matches with no warning** and exit status 1 — indistinguishable from "the string is
absent". Two of this plan's acceptance greps returned a confident, false `0`:

| grep | reported | truth (`grep -a`) |
|---|---|---|
| `grep -c 'Exactly one conditional member'` | 0 | 0 — correct by luck |
| `grep -c 'the one conditional literal'` | 0 | **1** — the removal comment QUOTED the stale phrase |

The second is the one that matters. The comment written to explain deleting a stale singular quoted it
verbatim — which this module's own source forbids by name, at its PASS-line rewrite: *"this
repository's gates scan source text without stripping comments, so a verbatim quotation of a deleted
expression re-registers as a live site of the very thing that was deleted."* The quotation is now a
description.

Both fixed in-plan. **A defect a plan introduces is not a residual to escalate**, and the premise it
broke is now a permanent case: `PREMISE: this gate's source and this file are grep-visible — no
control byte hides them`, over BOTH files, with a non-empty-file floor beneath it. `file -b` reports
`Unicode text, UTF-8 text` for both. Proven able to fail: injecting a NUL into the gate source on the
mirror reds that case by name.

Also note the check that FOUND it was itself broken: `grep -c $'\x00' file` reports nothing useful,
because bash cannot pass a NUL in argv, so the pattern degrades to empty. The byte was found by
`grep -anP '[\x00-\x08...]'`.

## Task 1 — the family, held by cases that would have failed a week ago

### The pre-fix control, derived rather than retyped

`HISTORICAL_ENUMERATED_COMPREHENSION` is the comprehension group's **unconditional** members — exactly
the pre-fix grammar — obtained by filtering the live authority. Retyping six strings would have been
the second copy of the list this file exists to refuse. The derivation buys a second property the plan
did not ask for: **if a later editor takes the rejected option (b) and appends a phrasing, that
phrasing enters the historical shape, the affected family row's historical verdict flips, and two
assertions red.** Measured on the mirror as mutation M5 — the count pin AND row F2 both red.

### The six permanent cases, and the one place the plan's wording had to be refused

The plan asked each case to assert "the control finds nothing on the planted line". That is **false for
row F1**, whose phrasing IS an enumerated literal and which 29-41 measured as already caught. So the
pre-fix verdict is carried as DATA (`historicallyOpen`) and asserted in **both directions** against
29-41's baseline column — a stronger assertion than the plan's, and one that does not require agreeing
with a claim the measurement contradicts. Writing a fixture that agrees with a false claim is how six
false results were produced in this phase.

| case name (from the vitest reporter) | plant composed from | pre-fix | shipped |
|---|---|---|---|
| `F1 the one phrasing the enumeration already held` | `COMPREHENSION_CLAIM.literal` | named | named |
| `F2 one interposed word: LLM` | `${MARKER_IMPROVE}s LLM ${BARE_COMPREHENSION.literal}` | NOT named | named |
| `F3 one interposed word: model` | `${MARKER_IMPROVE}s model ${BARE_COMPREHENSION.literal}` | NOT named | named |
| `F4 one interposed word: agent` | `${MARKER_IMPROVE}s agent ${BARE_COMPREHENSION.literal}` | NOT named | named |
| `F5 no occurrence of the first bare term at all` | `makes prose ${MARKER_EASIER} for LLMs to ${BARE_UNDERSTAND.literal}` | NOT named | named |
| `F6 the term first, the marker trailing` | `${MARKER_BOOST}s ${BARE_COMPREHENSION.literal} for language models` | NOT named | named |

Every plant is COMPOSED from a pinned member and a pinned marker; the only typed words are the
interposed ones (`LLM`, `model`, `agent`, `for language models`), which are precisely the words that
are in no pinned list and are the whole reason the enumeration failed.

**Two independent vacuity floors** beneath the table, because a hand-written list is this repository's
second systemic failure class: a COVERAGE floor derived from the authority (every conditional
comprehension member must be the attributing literal of some row — the row that would go missing first
is F5) and a DISCRIMINATION floor (five of six rows must be historically open, or the whole block is
decoration).

### The quieter half — the selectors, and a defanging that was already latent

Every selector took the FIRST property match. Two admitted more than one member:

| selector | old predicate | members it now matched | consequence |
|---|---|---|---|
| `CONDITIONAL_NAME` | `requiresOnSameLine !== undefined` | **3** (was 1 when written) | a reorder picks a comprehension term for a conformance-verb plant |
| `COMPREHENSION_CLAIM` | `group === "comprehension"` | **8** (2 of them conditional) | **a RED case going green while proving nothing** |

The second is the live one. Had a reorder put the bare term `comprehension` first, `COMPREHENSION_PLANT`
would have carried no benefit marker, produced no finding — and its case would still have **PASSED**,
because the gate's own banner line contains the word "comprehension" and the case asserts `toContain`.
Set-literal drift arriving inside the assertions written to prevent it.

Both predicates now name a DISTINGUISHING property, and every selection is identity-pinned in a case
that reds at the selection. Confirmed reorder-proof by mutation M3.

### The pin, re-measured rather than removed

`toBe(1)` → `toBe(3)`, still an equality, with the reason **at the assertion**: what changed, that plan
29-41 changed it under user decision (c), that the second and third members were recorded decisions
with measured counts rather than silent arrivals, and that a FOURTH still reds. No `toBeGreaterThan`
or `toBeLessThan` on that count — verified by grep (`-a`, after the premise was repaired).

### The empty-marker refusal, with an independently derived denominator

A conditional member with an empty marker array passes straight through `lineHits`'s existing arm —
`[].some(...)` is false — and ships as a prohibition matching NOTHING, forever, silently, while the
PASS line goes on counting it. The refusal walks the conditional members and asserts each marker array
is non-empty; **the count it walks is derived from the SOURCE TEXT** by counting member declarations
that name a marker list, so a silently short walk cannot satisfy it vacuously. A member written on ONE
line makes the two numbers disagree and reds — the safe direction, stated at the function.

### Per-marker discrimination — every admitted marker earns its assertion

Seven cases from one marker-agnostic template, so an eighth marker gets a case without anybody writing
one. Each asserts the marker under test is the ONLY one present **before** the plant is used, so a red
cannot be credited to a marker that was not under test, and each asserts the pre-fix grammar does NOT
name the line so the red is the RULE's and not the enumeration's. Plus `CONTROL: the same line with NO
marker at all is GREEN, so the rule stayed conditional` — the discrimination proving the rule did not
quietly become unconditional, which is what keeps the honest denial writable. Plus a case asserting the
marker list the cases walked is the one the SOURCE declares.

### MUTATION-PROVEN, on a `git archive HEAD` mirror with symlinked deps

Baseline on the mirror: **77 passed**. Then five mutations of the shipped source, each red:

| mutation | result |
|---|---|
| M1 delete the second bare term (`understand`) | module-load refusal by name, **vitest exit 1** |
| M2 make the first bare term unconditional | module-load refusal by name, **vitest exit 1** |
| M3 REORDER — declare the bare term above the enumerated ones | `REFUSES a conditional member declared with an EMPTY marker array` reds — the derived source count disagrees. The SELECTORS do not red, which is the point: they are now reorder-proof |
| M4 a conditional member with an EMPTY marker array | **3** named reds: the selector identity case, `F5`, and the empty-marker refusal |
| M5 APPEND a phrasing (option (b)) | **2** named reds: the historical count pin and `F2` |
| restore | 77 passed |

**Recorded honestly rather than presented as clean:** M1 and M2 red as a MODULE-LOAD refusal, so the
reporter prints "no tests" with vitest exiting 1 and the named message in the error, not as a named
case. That guard pre-dates this plan and is correct (without it every plant becomes the string
`"undefined"`, which matches nothing, and every RED case passes as green) — but the failure mode is a
collection error, which would go green under `--passWithNoTests`. Direction is fail-closed; noted, not
fixed.

## Task 2 — the refusal on the record, with the number that refused it

### Option (b), measured rather than cited

The UAT and plan both state option (b) "was measured to cost 0 findings and move no pin". Re-measured
here rather than quoted, over the set `bannedClaimScan()` derives — **82 documents, 5898 lines**:

| measurement | value |
|---|---|
| findings the six candidate phrasings would GAIN outside the exemption region | **0** |
| occurrences they would add INSIDE the region (i.e. pin movement) | **0** |

So it was refused on **MECHANISM, not on cost**, and the entry says so: substring matching is defeated
by any interposed word, so each phrasing added closes exactly itself. The reason names the two
phrasings that stay green under it — `improves agent comprehension` and `boosts comprehension for
language models` — **quoted from `29-UAT.md` § G-29-2** rather than invented, and clears the
forty-character floor the admission-log case already enforces.

Admission log **7 → 8**; the PASS line emits `8 candidate literal(s) refused at admission and recorded
with their hit counts`.

### The "every refused marker has an entry" criterion is VACUOUSLY satisfied, and that is stated

Plan 29-41 dropped **no** marker — all seven earned a family member or a warrant plant. Its three
actual refusals (`comprehension` and `understand` as unconditional literals, `to understand` as the
narrower second term) were already logged with their counts. Saying so is what keeps the criterion from
looking skipped.

### The profile question settled by MEASUREMENT, and the profile not edited

`git diff --exit-code agent-factory/writing-profile.md` exits **0** for the whole plan.

Sentences read: the `guard_banned_claims` parity paragraph, the "What a green run does not prove"
paragraph, and the honesty floor's four claims. One is **live-false**, quoted verbatim:

> The gate proves that no pinned literal appears outside this section; it does not prove that no such
> claim exists.

**Live count: 1.** `agent-factory/roles/incident-responder.md:29:103` carries the pinned bare term
`understand` outside the region and the gate is green, because that line carries no benefit marker. The
module's header already states the accurate form — no pinned literal **or pinned pair**.

**The distinction is recorded rather than collapsed.** The sentence has been *structurally* imprecise
since plan 29-02 (a conditional member has existed since the discipline's name was pinned) but that
member has **zero** unpaired occurrences outside the region, so the sentence was *vacuously true on the
live tree* until 29-41 admitted `understand`. It became live-false in round 5, not earlier.

Escalated as `V-29-42-03`, not edited: the sentence sits INSIDE the region, so an edit moves
`BANNED_CLAIM_EXEMPT_EXTENT` (pinned two-sided at 62) and requires its D-04 diff-disposition row; an
edit introducing a pinned literal would move `BANNED_CLAIM_EXEMPT_SUPPRESSED` (pinned at 12) too.

## The DERIVED set of singular-encoding surfaces — five, not the three the plan named

The plan required deriving these rather than working from its list of three, because this phase's record
contains a fix for a three-site finding that missed a fourth site nobody had derived.

| # | surface | status |
|---|---|---|
| 1 | the conditional-member cardinality assertion (`check-banned-claims.test.ts`) | **FIXED here** — relaxed to 3, reason at the assertion |
| 2 | the `requiresOnSameLine` field-doc heading (`check-banned-claims.ts:187`) | already truthful — **CONFIRMED, not rewritten**: reads "WHY SOME MEMBERS ARE CONDITIONAL" since 29-41's `c209c03` |
| 3 | the PASS line's conditional clause | already truthful — **CONFIRMED**: rendered per member from one `flatMap`, with verb and possessive agreeing with the derived count |
| **4** | **NOT NAMED BY THE PLAN** — a `describe` title asserting a count of one conditional literal | **FIXED here** — titled for the ARM. A case name is what a reporter prints and what the next reader greps |
| **5** | **NOT NAMED BY THE PLAN** — the conformance-marker admission-log entry's own reason, `check-banned-claims.ts:502` | **FIXED in task 2** — now says the markers bear on exactly ONE of the three, and names the other list |
| (6) | the `CONDITIONAL_NAME` selector, matching on `requiresOnSameLine !== undefined` alone | **FIXED here** — a selector is a singular-encoding surface too |

Derivation method, recorded so it is re-runnable: `grep -rn -iE "one conditional\|single conditional\|the conditional literal\|conditional on a conformance"` plus every `requiresOnSameLine`,
`CONFORMANCE_VERB_MARKERS` and `BENEFIT_VERB_MARKERS` reference, across `--include=*.ts --include=*.js
--include=*.md`. Two occurrences at `check-banned-claims.ts:910/913` describe the historical pin-move
event via one specific member and are **correct as singulars** — checked and left alone.

## Task 3 — the attack, and what it found

Thirteen attempts against the committed gate on the mirror, resetting between each, adjudicated on the
rendered finding line. Full log in `docs/audit/29-round5-residuals.md` §2. The two-line summary:

- **11 of 13 behaved as designed.** Case variance, CRLF, a fenced example, a link label, and both
  exemption boundaries (one line apart, distinguishable) all red by name; the bare term alone and the
  clean mirror are green.
- **2 succeeded** — the hard wrap in BOTH directions — and are escalated, not absorbed.

Three attempts were aimed at the **mechanism** rather than at its inputs, which is what the round
needed: `A1/A2` found the fail-open bound, `A10/A11` found a fail-closed one.

`A7` is worth naming separately: the claim planted one line INSIDE the exemption region produced **no
finding** (correctly suppressed) while the run exited 1 on the suppressed-pin refusal — the designed
re-pin protocol firing for an unrelated reason, which is precisely why every verdict in this round is
read off the finding line and not the exit code.

### Four residuals, measured and LEFT OPEN

| id | residual | direction | live count |
|---|---|---|---|
| `V-29-42-01` | a claim split across a hard wrap is outside the co-occurrence window | **FAIL-OPEN** | **1983 of 5898 lines** end mid-sentence (33.6%) — highly reachable — and **0** live instances of the shape |
| `V-29-42-02` | a markdown table row puts marker and term on one physical line | fail-closed | 0 |
| `V-29-42-03` | the exempt document's description of this gate is behind the source's | fail-closed | **1** |
| `V-29-42-04` | a marker whose only occurrence is inside an HTML comment or a link target | fail-closed | 0 |

The soft-wrap count's predicate is stated in full in the record (non-empty line, followed by a non-empty
line, not ending in `.!?:;|>`) because it is an operationalization of "hard wrap" and its bound should
be visible — it over-counts list continuations and structural rows. **Both numbers matter:** the first
is why the residual cannot be dismissed, the second is why it did not have to be fixed this round.

**None is fixed here.** Each carries both addresses, its direction, its live count, and an explicit
out-of-scope-by-the-same-user-decision statement — the UAT recorded exactly two gaps and decisions (b)
and (c) on those two, and nothing else.

### The roll-up, in both directions

All eleven `V-` markers listed with status: six carried unchanged, `V-29-29-01` closed in round 4,
**`V-29-35-01` CLOSED THIS ROUND by plan 29-40** (this is `G-29-1`), and four opened here. **Net
movement: +3**, stated plainly rather than presented as progress, with the honest reading recorded —
the round attacked a NEW predicate on an axis nothing had attacked before, so four of the five items are
the output of having looked, and three of the four are fail-closed at 0 live.

### The LANG-08 override, repeated verbatim; its prohibition half MEASURED

The override is quoted from `29-VERIFICATION.md`'s frontmatter with `accepted_by: "Olger Oeselg"` and
`accepted_at: "2026-08-15T09:57:04Z"`. Prohibition half over `803b9c1..HEAD`:

| check | result |
|---|---|
| `roleCeiling()` body hash at both ends | **byte-identical**, sha256 `c4d66b0e224299f9c797714886e4bbc5953d9c6138c18f035b77a8d9750f30e7` — the SAME hash round 4 recorded |
| `git diff --name-only 803b9c1..HEAD -- agent-factory/` | **0 files** — not one plan of round 5 touched a document under a ceiling |
| `git diff --exit-code agent-factory/writing-profile.md` | exit 0 |

Plans checked: 29-40, 29-41, 29-42. No ceiling raised, lowered or re-baselined.

### Probe arithmetic

**2 authored + 20 flagged = 22 surfaced ✓** — LANG-01 4, LANG-02 1, LANG-03 4, LANG-04 2, LANG-05 3,
LANG-06 3, LANG-07 1, LANG-08 4. The 2 authored are LANG-04 `empty` and `encoding`, discharged here as
the vacuity/empty-marker cases (task 1) and the case/CRLF arms of the attack (`A4`, `A5`). Plan 29-40's
harness-premise catch about a predicted "LANG-07 ×2" is carried forward, not dropped.

## Verification

| check | result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | exit 0 — 48 committed `.js` match a fresh `tsc` rebuild |
| `npm run freshness:catalog` | exit 0 |
| `npm run freshness:adapters` | exit 0 |
| `npm run freshness:skill-twins` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **2054 passed / 0 failed / 2 skipped = 2056** across 52 files |
| `node scripts/check-banned-claims.js` (clean tree) | exit 0, `ALL CHECKS PASSED` |
| `check-foundation-guards` | exit 0 |
| `check-kit-refs` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `dead-vocabulary` | exit 0 |
| `validate-agent-factory` (`VALIDATE_KIT_ROOT=.`) | exit 0 |
| `git diff --exit-code 803b9c1..HEAD -- package.json package-lock.json` | exit 0 — byte-unchanged (T-29-42-SC asserted absence) |
| `git status --porcelain` | **no plant on the tree** — every plant went to a mirror or a temp dir |
| `git diff --exit-code agent-factory/writing-profile.md` | exit 0 — unedited |
| `file -b` on both gate files | `Unicode text, UTF-8 text` — grep-visible |

### The suite total reconciled, not left as a bare number

| | value |
|---|---|
| 29-41 baseline | 2031 passed / **2 failed** / 2 skipped = **2035** |
| this plan | 2054 passed / **0 failed** / 2 skipped = **2056** |
| delta | **+21** total, all new cases |

2031 + 2 (the handed-over reds, both cleared) + 21 (new) = **2054** ✓. The +21 breaks down as 4
selection/premise cases, 6 family cases + 1 family floor, 7 marker cases + 1 marker control + 1 marker
source-count case, and 1 empty-marker refusal. Round-4's baseline of 1987 is cleared.

## Deviations from Plan

### 1. [Rule 1 — Bug, self-inflicted] A NUL byte in the test source, and two false acceptance greps

- **Found during:** task 1 acceptance checking, only because a grep result was cross-checked.
- **Issue:** a raw NUL byte written into `scripts/check-banned-claims.test.ts` made `file -b` report
  `data` and BSD `grep` report zero matches with no warning. Two of this plan's acceptance greps
  returned a confident false `0`; one of them was verifying that a stale singular had been removed, and
  it had not been — the removal comment quoted it verbatim.
- **Fix:** the byte removed (`markerPlant("")`), the quotation replaced by a description, and a
  permanent premise case added over both files with a non-empty-file floor. Proven able to fail by
  injecting a NUL on the mirror.
- **Why fixed rather than escalated:** a defect this plan introduced is not a residual to carry.
- **Commits:** `eb29ed5` (fix + case), recorded in `docs/audit/29-round5-residuals.md` §3.5.

### 2. [Reported] The plan's per-case control wording is false for one family row

- **Issue:** the plan requires each case to "assert the control finds nothing on the planted line". Row
  F1's phrasing IS an enumerated literal and 29-41 measured it as already caught BEFORE the fix.
- **Action:** the pre-fix verdict is carried as data and asserted in BOTH directions against 29-41's
  baseline column — strictly stronger than the plan's wording, and it does not require a fixture that
  agrees with a false claim. A discrimination floor (5 of 6 rows historically open) keeps the block from
  drifting into decoration.

### 3. [Reported, not fixed] M1/M2 red as a collection error, not as a named case

- The module-level non-vacuity guard (which pre-dates this plan and is correct) throws when a plant
  literal cannot be selected, so deleting a conditional member reds with vitest exit 1 and the named
  message in the error rather than as a named case; the reporter prints "no tests".
- Direction is fail-closed, but the outcome would go green under `--passWithNoTests`. Recorded, not
  changed — softening the guard would let a plant become the string `"undefined"`.

### 4. [Scope, recorded] `V-29-42-01`'s id added to the gate source

- Task 3's `<files>` names only the residuals doc. One paragraph was added at the member declaration in
  `check-banned-claims.ts` giving the already-written cost paragraph its residual id and its two live
  numbers, so source and record point at each other in both directions.
- Not a fix: the residual is unchanged and still open. `scripts/check-banned-claims.js` rebuilt in the
  same commit per D-13.

### 5. [Process] Tracer feedback gate not raised as an interactive checkpoint

- Auto mode is off (`workflow.auto_advance` and `workflow._auto_chain_active` both `false`), which would
  normally make a `type="tracer"` task stop for human verification before any expansion task.
- The plan declares `autonomous: true` and carries no `checkpoint:*` task, and the gate's substance was
  met: the tracer's `<verify>` re-ran green (77 passed) and the tracer's fixtures were mutation-proven
  able to fail before task 2 began, so no layer was poured onto a broken foundation.
- Recorded because the decision was mine, not the plan's. Same disposition 29-41 recorded.

### 6. [Out of scope, not fixed] `validate-agent-factory` exits 1 without `VALIDATE_KIT_ROOT`

- Pre-existing and unchanged: bare `node scripts/validate-agent-factory.js` refuses with
  `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. Exits 0 with the env var.
  Not caused by this plan and not touched.

## Threat mitigations discharged

| Threat | Disposition | Evidence |
|---|---|---|
| T-29-42-01 a case that passes against the pre-fix build too | mitigated | every family row asserts the reconstructed pre-fix control and the shipped gate DISAGREE, in both directions, plus a 5-of-6 discrimination floor; five mutations each red |
| T-29-42-02 a plant defanged by a declaration reorder | mitigated | every selector identity-pinned in its own case; plants composed from pinned members; mutation M3 confirms the selectors are now reorder-proof |
| T-29-42-03 a conditional member with an empty marker array | mitigated | refused by an assertion, with the member count derived from the SOURCE TEXT independently of the loop; mutation M4 reds it |
| T-29-42-04 a pin deleted because it fired | mitigated | relaxed 1 → 3, still an equality, reason at the assertion; `toBeGreaterThan`/`toBeLessThan` absent by grep |
| T-29-42-05 a claim split across a soft wrap | mitigated as required | attacked in both directions, both GREEN, escalated as `V-29-42-01` with a live corpus count of 1983 hard wraps / 0 live instances — measured, named, left open |
| T-29-42-06 the rejected alternative absent from the log | mitigated | `BANNED_CLAIM_EXCLUDED` 7 → 8 with the measured 0, the mechanism, and the two still-green phrasings quoted from the UAT |
| T-29-42-07 a transcript against a stale build or a mirror not at HEAD | mitigated | freshness quoted first; mirror gate `.js` byte-identical at `4bb7712b…`; clean-mirror control exit 0 |
| T-29-42-08 the profile's description left stale | mitigated | measured against the new rule, live-false at a count of 1, escalated as `V-29-42-03` with its edit cost; profile unedited (exit 0) |
| T-29-42-SC package installs | accepted | `package.json` + lockfile byte-unchanged across `803b9c1..HEAD`; no dependency added |

## Requirements

**LANG-04 and LANG-07 are NOT marked complete, and this plan marks nothing.** Round-5 re-verification
has not run; that verdict belongs to the verifier. `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`
were checked after this plan's own writes to confirm neither was flipped.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired surface was introduced.

## What a green run here does and does not prove

Restated because this plan's whole subject is the difference. The gate proves **no pinned literal or
pinned pair appears outside the one named exemption region**. It does not prove no comprehension claim
exists: a brand-new claim in words this list does not contain still passes, and `V-29-42-01` is open by
construction of the line window, measured reachable across a third of the corpus's lines. This suite
being green is a floor, not a proof — and this plan's own seventh false harness result is the argument.

## Self-Check: PASSED

- `scripts/check-banned-claims.test.ts` — FOUND
- `scripts/check-banned-claims.ts` — FOUND
- `scripts/check-banned-claims.js` — FOUND
- `docs/audit/29-round5-residuals.md` — FOUND
- commit `eb29ed5` — FOUND
- commit `1c9354e` — FOUND
- commit `481054c` — FOUND
