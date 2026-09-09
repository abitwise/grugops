---
phase: 31-autonomous-manual-testing
plan: 16
subsystem: uat-spec-integrity
tags: [uat, ast-ban, gap-closure, round-4, CR-09, CR-10, IN-10, D-20]
status: complete

requires:
  - "scripts/runnable-ref/uat-spec-integrity.ts — D-17's membership rule and D-18's shape resolution"
  - "scripts/runnable-ref/fixtures/playwright-test.d.ts — the declared surface the corpus compiles against"
provides:
  - "stripRoutingLinks — the ONE marker-aware normaliser both whole-path arms consume"
  - "chainEnabledOptionKeys — the enabled-option axis folded across the whole marked chain"
  - "deriveTestInfoParameterNames + TEST_INFO_CANONICAL_HEAD — the positional fixture-parameter binding"
  - "the DERIVED path-consumer set (cardinality 5) and DERIVED ban-set name axis (cardinality 4)"
  - "scripts/runnable-ref/fixtures/testinfo-fixture-param.uat.spec.ts — the fixture-parameter corpus"
affects:
  - "agent-factory/checklists/browser-uat-recipe.md — the quoted claim, re-quoted from the constants"
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md — decision D-20"
  - "scripts/check-foundation-guards.test.ts — NON_TEST_MODULE_COUNT 72 -> 73"

tech-stack:
  added: []
  patterns:
    - "one authority per predicate, consumed by a DERIVED and cardinality-asserted consumer set"
    - "derive BOTH axes — the arms AND the sets they read — never one derived and one hand-typed"
    - "parse-only positional reasoning (D-18 (3)'s ImportSpecifier argument, applied to a parameter position)"
    - "mutation proof with an asserted BUILD premise, so a mutant that does not compile cannot be measured"

key-files:
  created:
    - scripts/runnable-ref/fixtures/testinfo-fixture-param.uat.spec.ts
    - docs/audit/29-style-dispositions/31-16.md
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/playwright-test.d.ts
    - scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-20 (2026-09-09, gap-closure round 4): a routing call link is not part of the membership question for ANY arm; the enabled-option axis is asked of the WHOLE marked chain; a TestInfo fixture-parameter binding is decided from the parse and canonicalised to test.info(). No member added to any ban set."
  - "D-20 (1): stripRoutingLinks is the ONE normaliser; both whole-path arms obtain their operand from it, the head/tail arm stays as D-17 left it, and a MARKED HEAD is held distinct from an interior marked LINK in both directions."
  - "D-20 (2): arm (c) reports one finding per CHAIN, keyed on start position plus routing-stripped path — the same idiom arms (a) and (b) already use — because the chain-wide option fold would otherwise report the converse ordering twice."
  - "D-20 (3): precedence between the rename map and the fixture-parameter map is DECIDED and asserted — the file-scoped import rename wins over the callback-scoped fixture parameter."
  - "The disproved excuse is REMOVED, not relocated: the alias residual no longer claims to cover the fixture parameter, and two residuals with reasons true of their own shapes replace it."

requirements-completed: []

coverage:
  - deliverable: "Both CR-09 spellings are refused end to end through the committed .js"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses expect.configure({ retries: 2 }).soft(...) — the chained soft assertion"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses expect.configure({ retries: 2 }).configure({ soft: true })(...) — the chained pair"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js <probe> — EXIT=1, 1 finding, each spelling"
        status: pass
  - deliverable: "All three CR-10 fixture-parameter spellings are refused, and the non-banned member on the same binding is not"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses testInfo.skip() reached through the fixture parameter"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#does NOT refuse testInfo.slow() — a modifier outside the tail set"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js <probe> — EXIT=1 for skip/fail/fixme, EXIT=0 for slow"
        status: pass
  - deliverable: "No legitimate construct is newly refused, and the round-3 closures are intact"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL 1: a chained AND INVOKED configure carrying only an unrelated option stays admitted"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL 2: the marked-head assertion expect(locator).soft stays admitted"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#CONTROL 3: the two round-3 closures the round-4 verification re-measured still hold"
        status: pass
  - deliverable: "The path-consumer set and the ban-set name axis are DERIVED with asserted cardinalities and a watched-fail control"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the derived path-consumer set has the expected CARDINALITY"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a SEEDED fourth arm outside the normaliser moves the count by exactly one and arrives UNBOUND"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the BAN-SET axis is derived from the authorities, and its cardinality is asserted"
        status: pass
  - deliverable: "The corpus fixtures can fail for the reason they exist for (MUTATE-REMOVE contract)"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#configured-soft.uat.spec.ts reports every planted escape, chained ones included"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#testinfo-fixture-param.uat.spec.ts's CONTROL survives: the non-banned member on the same binding"
        status: pass
  - deliverable: "The recipe's claim equals the exported constants and residual register in both directions"
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's residual bullets are the exported residual array, verbatim"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the boundary list PARTITIONS into register members and the bounded remainder"
        status: pass
  - deliverable: "The recipe's corrected PROSE claim reads as the mechanism now behaves"
    human_judgment: true
    rationale: "Whether a reader of the call-link paragraph, the corrected completeness bullet and the refused list is told exactly what the checker decides — no more and no less — is the judgment UATX-06 exists to make, and no test asserts adequacy of the wording. The mechanical halves (constant equality, register equality, boundary-list partition) ARE asserted above; the prose adequacy is for the verifier."

metrics:
  duration: "56 min"
  completed: 2026-09-09
  tasks: 3
  files_changed: 9

actuals:
  tokens: 35573
  tasks: 3
  commits: 5

plan_head_before: b54153fb5d052084e262ae2b19b6080f60f8d18c
---

# Phase 31 Plan 16: Marker-aware whole-path arms and the positional TestInfo binding — Summary

CR-09 (both variants), CR-10 and IN-10 are closed structurally: `stripRoutingLinks` is the one
marker-aware normaliser both whole-path arms consume, the enabled-option axis is folded across the
whole marked chain, and a TestInfo binding reached through the second callback parameter is decided
from the parse and canonicalised to the `test.info()` spelling D-18 (1) already chose. No member was
added to any ban set.

## Pre-fix and post-fix measurements, side by side

All CLI measurements used the probe-repository shape the round-4 verifier used: a root under
`.temp/` inside this repository so `typescript` resolves from the probe's own `node_modules`, a spec
at `uat/p.uat.spec.ts`, and the COMMITTED `scripts/runnable-ref/uat-spec-integrity.js`. Every probe
directory was deleted immediately after measurement; `find .temp -name '*.uat.spec.ts' | wc -l`
returns `0` and `git status --short .temp` is empty.

| # | construct | pre-fix (HEAD `b54153f`) | post-fix (HEAD `bd38a2e`) |
|---|---|---|---|
| 1 | `expect.configure({ retries: 2 }).soft(locator).toBeVisible()` | `0 findings over 1/1 uat specs checked`, EXIT=0 | `1 finding(s) over 1/1 uat specs checked`, EXIT=1, naming `` `expect.configure().soft` `` |
| 2 | `expect.configure({ retries: 2 }).configure({ soft: true })(locator).toBeVisible()` | `0 findings over 1/1 uat specs checked`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure().configure` `` |
| 3 | `expect.configure({ soft: true }).configure({ retries: 2 })(locator).toBeVisible()` (converse) | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure` `` | `1 finding(s) over 1/1`, EXIT=1, naming `` `expect.configure().configure` `` |
| 4 | `test("a", async ({ page }, testInfo) => { testInfo.skip(); … })` | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `test.info().skip` `` |
| 5 | the same with `testInfo.fail()` | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `test.info().fail` `` |
| 6 | the same with `testInfo.fixme(true, "later")` | `0 findings over 1/1`, EXIT=0 | `1 finding(s) over 1/1`, EXIT=1, naming `` `test.info().fixme` `` |
| C1 | `expect.configure({ retries: 2 })(locator).toBeVisible()` (chained, invoked, legitimate) | `0 findings over 1/1`, EXIT=0 | `0 findings over 1/1`, EXIT=0 |
| C2 | `expect(locator).soft` (marked head) | `0 findings over 1/1`, EXIT=0 | `0 findings over 1/1`, EXIT=0 |
| C3a | `expect.configure({ soft: true })(locator).toBeVisible()` (un-chained, round-3 closure) | `1 finding(s) over 1/1`, EXIT=1 | `1 finding(s) over 1/1`, EXIT=1 |
| C3b | `test.info().skip()` (bare call link, round-3 closure) | `1 finding(s) over 1/1`, EXIT=1 | `1 finding(s) over 1/1`, EXIT=1 |
| C4 | `testInfo.slow()` on the same fixture binding | `0 findings over 1/1`, EXIT=0 | `0 findings over 1/1`, EXIT=0 |

Rows 1, 2 and 4 match `31-VERIFICATION.md` behavioral spot-check rows 4, 5 and 6 exactly; rows C3a
and C3b match its rows 2 and 1.

### The cause, MEASURED rather than inferred

Instrumented through the committed pre-fix module (`calleeDottedPath` → `enabledOptionKeys` →
`isBannedModifierCall`, one line per visited call node):

```
### expect.configure({ retries: 2 }).soft(locator).toBeVisible()
  "expect.configure().soft().toBeVisible" opts=null      -> banned: false
  "expect.configure().soft"               opts=null      -> banned: false
  "expect.configure"                      opts=[]        -> banned: false

### expect.configure({ retries: 2 }).configure({ soft: true })(locator)
  "expect.configure().configure()"        opts=null      -> banned: false
  "expect.configure().configure"          opts=["soft"]  -> banned: false
  "expect.configure"                      opts=[]        -> banned: false

### expect.configure({ soft: true })(locator)  [control]
  "expect.configure()"                    opts=null      -> banned: false
  "expect.configure"                      opts=["soft"]  -> banned: true

### expect(x).soft("m")  [control]
  "expect().soft"                         opts=null      -> banned: false

### test("a", async ({ page }, testInfo) => { testInfo.skip(); })
  "test"                                  opts=null      -> banned: false
  "testInfo.skip"                         opts=null      -> banned: false
```

This reproduces `31-REVIEW.md`'s own instrumented table line for line: the `()` marker segment turns
`expect.soft` into `expect.configure().soft` and `expect.configure` into
`expect.configure().configure`, and both whole-path arms compare the joined string. `testInfo.skip`
resolves cleanly — nothing is declined — and its head is simply not a banned head.

## Measured numbers, recorded as measured

| measurement | before this plan | after this plan |
|---|---|---|
| derived PATH-CONSUMER set (arms comparing a resolved path against a ban set) | 5 (3 of them unbound, comparing a RAW path) | **5**, all bound; 3 normalised, 2 raw with written dispositions |
| derived BAN-SET name axis (module constants the two membership authorities read) | not derived | **4** |
| derived DECLINE-site set | 14 | **16** (`chainEnabledOptionKeys`, `deriveTestInfoParameterNames`) |
| `UNRESOLVABLE_CALLEE_RESIDUALS` members | 7 | **9** (6 resolution axis + 3 membership axis; partition sums) |
| reverse-partition walked denominator | 26 | **26** — RE-MEASURED after the declared-surface change, not carried forward |
| reverse partition buckets | — | **14 refused + 12 dispositioned = 26**, disjoint, union equal, sizes summed |
| `configured-soft.uat.spec.ts` findings / after MUTATE-REMOVE | 1 / 0 | **4 / 0** |
| `testinfo-fixture-param.uat.spec.ts` findings / after MUTATE-REMOVE | (did not exist) | **3 / 0** |
| `NON_TEST_MODULE_COUNT` | 72 | **73** (one new corpus file, changelog entry written) |
| excluded-e2e suite | 62 files, 3566 passed \| 2 skipped (3568) | **62 files, 3601 passed \| 2 skipped (3603)** |
| `npm run check:diff-disposition` findings | 77 | **77** (0 of them in `browser-uat-recipe.md`, before or after) |

The reverse-partition denominator did not move, and the reason is a fact about the walk rather than
a coincidence: adding a PARAMETER to a call signature adds no PROPERTY to any declared type, and
`checker.getPropertiesOfType` reads properties only. That reason is written into the new
`the walked denominator's CARDINALITY is the number this round MEASURED` case, so a future change
that does move it turns red and has to say why.

## Mutation proofs

Every mutation run asserted its OWN premise first — that the mutant COMPILED and that the committed
`.js` actually differed from the base build. The first attempt at mutant C did not: `tsc` failed with
`TS6133: 'fixtureParams' is declared but its value is never read`, the `.js` stayed stale, and the
cases "passed" against the un-mutated build. That is the harness-premise failure this phase has now
recorded seven times across five rounds, caught here by adding the premise rather than by trusting
the green.

| mutant | change | cases that failed | reverted |
|---|---|---|---|
| A | `stripRoutingLinks`'s interior-link filter replaced by `return dottedPath` | 5 — the normaliser rule, the head/link separation, both CR-09 spellings, the folded-option case | ✓ all 17 pass again |
| B | the marked-HEAD guard deleted | 1 — `the normaliser drops an INTERIOR marked link and keeps a MARKED HEAD distinct` | ✓ |
| C | the fixture-parameter head rewrite replaced by `return dottedPath` | 6 — all three fixture-parameter spellings, the renamed-head composition, the precedence case, the canonical-head case | ✓ all 14 pass again |
| D | `chainEnabledOptionKeys` narrowed to the OUTERMOST call only | 1 — `the OUTER link of the converse chain is refused ON ITS OWN, by the folded option axis` | ✓ |

Mutant B initially passed, and that was a real finding about the TESTS rather than about the code:
the head guard was indistinguishable from the filter's own `i === 0` clause for a two-segment path.
A discriminating case was added — `stripRoutingLinks("expect().soft().toBe")` must be returned
unchanged, where the guardless version yields `expect().toBe` — and mutant B then failed on it.

## Deviations from Plan

### 1. [Rule 1 — measurement contradicting a plan premise] The converse ordering was ALREADY refused pre-fix

- **Found during:** Task 1, Movement 1.
- **Plan premise:** GREEN 3 and must-have truth 5 treat
  `expect.configure({ soft: true }).configure({ retries: 2 })(locator)` as an open mirror that
  deciding only the outer link would leave open.
- **Measured:** pre-fix it exited **1** with one finding naming `expect.configure` — because the
  inner link `expect.configure({ soft: true })` is itself a separately visited call node, and the
  un-chained rule D-18 (2) landed decides it. The walk asks the option question at EVERY link, so
  the "outermost call only" model the plan reasoned from does not describe the code.
- **Resolution:** the chain-wide fold was implemented anyway, and the reason is stated at the site
  and in D-20 (2): what the fold removes is the DEPENDENCE of the verdict on which nodes the walk
  happens to visit, which is the same structural coupling CR-09 exploited one register over. Its
  measured effect at the CLI is nil; its effect at the unit level is that the OUTER link is now
  refused on its own, asserted by a case that mutant D fails.
- **Consequence:** the fold made the converse ordering banned at two links of one chain, which would
  have reported it twice. Arm (c) therefore gained a per-chain emission key — position plus
  routing-stripped path — mirroring `reportedAssertionHeads`. Recorded as D-20 (2).

### 2. [Rule 2 — missing critical discrimination] Mutant B was an equivalent mutant until a case was added

Described above under Mutation proofs. Without the added case, the marked-head guard would have been
untested machinery.

### 3. [Rule 3 — blocking] `NON_TEST_MODULE_COUNT` had to move for the new corpus file

`scripts/check-foundation-guards.test.ts` pins the tree-wide non-test module count and cross-checks
it against `git ls-files '*.ts'`. The new fixture moved it 72 → 73. Bumped with a changelog entry in
the constant's existing documented style, and the fixture staged so both sides of the pin agree.

### 4. [Rule 3 — blocking] The new scope residual failed the WP-03 sentence-length bound

`npm run check:imperative-lexicon` reported the 36-word residual sentence against a 25-word bound.
Split into three sentences under the bound, in all three places that must agree (the exported
register, the test constant, the recipe bullet).

### 5. [Recorded, not fixed] The recipe is OUTSIDE `check:diff-disposition`'s watched corpus

Task 3 Movement 4 required a disposition file "for every clause this task changes in
`browser-uat-recipe.md`" and the before/after diff-disposition counts. Measured: the watched corpus
is `safetySurfaceUnion()` (register rows flagged `safety_surface: yes` ∪ registry rows of
`kind: safety`), and `agent-factory/checklists/browser-uat-recipe.md` is not a member. The counts are
**77 before and 77 after**, with **0** findings in that file either side — the 77 are the
pre-existing debt `deferred-items.md` already records for plans 31-05/31-06/31-08 and the round-3
workflow edits, and none of them is this plan's. `docs/audit/29-style-dispositions/31-16.md` was
written anyway, with all 15 recipe clause rows, and states this measured scope in its own header so
a later reader is not told the gate demanded it.

### 6. [Ordering] The recipe's residual bullets moved in Task 2 rather than Task 3

The plan puts every recipe edit in Task 3, but Task 2 changed the exported residual register, and the
both-directions equality case compares it to the recipe verbatim. Leaving the mechanical quote for
Task 3 would have left the suite red across a task boundary. The residual BULLETS moved with the
register in Task 2's commit; the recipe's PROSE claims (the call-link paragraph, the refused list,
the corrected completeness bullet) moved in Task 3 as planned.

**Total deviations:** 6 — 1 measurement contradicting a plan premise, 1 missing test discrimination,
2 blocking gate fixes, 1 recorded scope finding, 1 ordering change.
**Impact:** no scope was dropped. The one substantive design change (the per-chain emission key) is
recorded as a sub-decision of D-20 rather than left implicit.

## Authentication Gates

None.

## Known Stubs

None. Two boundaries are left OPEN and are NAMED rather than stubbed:

- the fixture-parameter and import-rename canonicalisations are not scope-aware (WR-20, owned by
  plan `31-17`) — a member of `UNRESOLVABLE_CALLEE_RESIDUALS` and a quoted recipe bullet;
- a destructured second callback parameter names no identifier to rewrite — likewise a member with
  its own sentence and its own membership-record entry.

Both are membership residuals; the two-axis partition sums to the register's length (6 + 3 = 9).

## Threat Flags

None. The declared-surface change adds a call-signature parameter and no new property, endpoint,
auth path or file access; the two new module functions parse and never evaluate, and neither
introduces a type checker into the shipped runnable (D-13 held).

## Verification commands, all green at commit `bd38a2e`

```
npm run build                                        # tsc, clean
npm run typecheck                                    # 3 targets, clean
npm run check:build-parity                           # "Build parity: no tracked build output moved when tsc ran."
npm run freshness                                    # "All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources."
node scripts/check-foundation-guards.js              # ALL CHECKS PASSED
node scripts/check-uat-oracles.js                    # ALL CHECKS PASSED
npm run check:imperative-lexicon                     # ALL CHECKS PASSED
npm run check:audit-register                         # ALL CHECKS PASSED
npm run check:residual-citations                     # ALL CHECKS PASSED
npm run check:public-docs / :banned-claims / :claim-anchors / :nul-bytes   # ALL CHECKS PASSED
npx vitest run --exclude '**/scripts/e2e/**'         # Test Files 62 passed (62); Tests 3601 passed | 2 skipped (3603)
```

`npm test` was NOT run: it launches the live claude-CLI e2e lane, which spends tokens on an
authenticated box. The excluded-e2e lane is this repository's documented regression command.

## Requirements

`UATX-06` stays UNCHECKED in `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`. This plan closes
three findings against it; only a verification round may flip it. `requirements-completed` is
deliberately empty.

## Next

Wave 1 of gap-closure round 4 is complete. `31-17` (WR-19 recursion bound, WR-20 scope analysis) is
sequenced behind this plan because both modify `scripts/runnable-ref/uat-spec-integrity.ts`, and
`31-18` behind it because both modify `31-CONTEXT.md`.

## Self-Check: PASSED

- `scripts/runnable-ref/fixtures/testinfo-fixture-param.uat.spec.ts` — FOUND
- `docs/audit/29-style-dispositions/31-16.md` — FOUND
- commits `18f8a04`, `d779592`, `45e3dc1`, `a3172f6`, `bd38a2e` — all FOUND in `git log --oneline --all`
- `git rev-list --count b54153f..HEAD` = 5, equal to the commits listed above
