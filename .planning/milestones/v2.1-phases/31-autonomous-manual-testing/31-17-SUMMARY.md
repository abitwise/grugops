---
phase: 31-autonomous-manual-testing
plan: 17
subsystem: uat-spec-integrity
tags: [gap-closure, uat, ast, resolver, exit-code-contract, residual-register]
status: complete

requires:
  - "31-16 (D-20): the marker-aware normaliser, the chain-wide option fold and the TestInfo fixture-parameter map"
  - "31-13 (D-18): the recursive call-link resolution and the import-rename canonicalisation"
provides:
  - "CALLEE_CHAIN_STEP_BOUND / CalleeStepBudget: one authority for the chain bound's VALUE and one for its UNIT"
  - "forEachDescendant: the one non-recursive AST walk both spec walks use"
  - "a fail-closed per-spec analysis boundary in analyzeSpecs, so the D-12 exit code is held BY DECISION on every path"
  - "deriveDeclaredNames: the per-file declared-name census the ONE canonicaliser asks before EITHER map"
  - "scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts: the false-positive control fixture"
affects:
  - "agent-factory/checklists/browser-uat-recipe.md (the quoted boundary list and the exit-code contract)"
  - "the derived decline-site set (16 -> 17) and its binding record"

tech-stack:
  added: []
  patterns:
    - "one authority for a VALUE and a separate authority for its UNIT, because a bound whose unit drifts is a bound that stops bounding"
    - "a residual sentence INTERPOLATES the constant it describes, so disclosed prose cannot drift from the mechanism"
    - "an explicit worklist instead of a self-recursive AST walk, so untrusted input costs no interpreter stack"
    - "a fail-closed per-element boundary that records a could-not-run reason and does NOT increment the visited counter"
    - "a scope rule written for the ONE consumer rather than for each producing map"

key-files:
  created:
    - scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts
    - docs/audit/29-style-dispositions/31-17.md
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-21 (1): the chain bound is ONE shared budget for a whole resolution, threaded through calleeDottedPath's own recursion and charged on the descent into a call link; the walk that ASKS the resolver uses an explicit stack; and a spec the walk cannot finish is a could-not-run reason rather than an escaping throw, so the D-12 exit code is inside { 0, 1, 2 } BY DECISION on every path"
  - "D-21 (2): the scope rule lives in the ONE canonicaliser and covers EVERY map that feeds it. deriveDeclaredNames is a per-file census of parameters, const/let/var bindings, binding elements, function names and class names; an import binding is deliberately NOT counted, and a function's SECOND parameter is exempt as a POSITION so the census does not depend on the map it constrains"
  - "The scope rule's coarseness is FILE-SCOPED rather than lexical, and that cost is asserted as a MEASURED case rather than only described"

requirements-completed: [UATX-05, UATX-06]

coverage:
  - deliverable: "A callee chain past the bound yields no path, reaches reportMeasured, prints the measurement line and exits inside the D-12 contract"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a spec whose callee chain exceeds the bound prints the measurement line and exits inside the contract"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the pathological callee yields no path, so the run attributes no finding to it"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/wr19-mid  ->  EXIT=0, 'UAT spec integrity: 0 findings over 1/1 uat specs checked', empty stderr"
        status: pass
    human_judgment: false
  - deliverable: "The vacuity and denominator floors are reachable on the pathological path — the branch WR-19 records as bypassed by construction"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the short-set diagnostic still fires when one of the derived specs is the pathological one"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a spec whose analysis throws is a could-not-run reason and never increments visited"
        status: pass
    human_judgment: false
  - deliverable: "The bound is ONE allowance for a whole resolution, with one authority for its value, asserted at both adjacency edges"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#ADJACENCY: a chain of EXACTLY the bound resolves"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#ADJACENCY: a chain of the bound PLUS ONE yields no path"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#ONE BUDGET: interleaving call links no longer buys a chain more steps than a pure one"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the bound's value has exactly ONE authority — no resolver carries a second literal"
        status: pass
    human_judgment: false
  - deliverable: "A head with a nearer declaration is not canonicalised through EITHER map, and every genuine spelling 31-13 and 31-16 closed is still refused"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the review's legitimate shadowing spec reports ZERO findings"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#BOTH MAPS: a fixture-parameter name ALSO declared elsewhere in the file is not canonicalised"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#PRECEDENCE: a name in BOTH maps that also has a declaration is canonicalised by NEITHER"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#STILL REFUSED: a renamed head, because a spec that CALLS a renamed import does not declare it"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#STILL REFUSED: a TestInfo fixture-parameter head"
        status: pass
      - kind: command
        ref: "node scripts/runnable-ref/uat-spec-integrity.js .temp/wr20-postfix  ->  EXIT=0, '0 findings over 1/1 uat specs checked'"
        status: pass
    human_judgment: false
  - deliverable: "The shadowed-rename control fixture exists, is reached by the disk-derived corpus and the fixtures typecheck target, and stays at zero findings"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the shadowed-rename control fixture is on disk and reports ZERO findings"
        status: pass
      - kind: command
        ref: "npm run typecheck (tsc -p tsconfig.fixtures.json)"
        status: pass
    human_judgment: false
  - deliverable: "The residual register and the recipe's boundary list are equal in both directions, and every register member binds to a derived decline site or a membership disposition"
    verification:
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's residual bullets are the exported residual array, verbatim"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the boundary list PARTITIONS into register members and the bounded remainder"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#THE CONVERSE: every member of UNRESOLVABLE_CALLEE_RESIDUALS is accounted for"
        status: pass
      - kind: test
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the binding record's KEY SET equals the derived set, in BOTH directions"
        status: pass
    human_judgment: false
  - deliverable: "D-21 is recorded in the three places that must agree"
    human_judgment: true
    rationale: "That three artifacts say the same thing is a reading judgment. The mechanical half — the register's text quoted verbatim into the recipe — is asserted by the equality cases above; the prose half is not, and no test can assert that 31-CONTEXT.md's paragraph and the runnable's decision header agree in substance."

metrics:
  duration: "52 min"
  started: "2026-09-09T08:16:00Z"
  completed: "2026-09-09T09:08:42Z"
  tasks: 3
  files: 8

actuals:
  tokens: 36000
  tasks: 3
  commits: 5

plan_head_before: 2973d8a5eb3df6a92669af0b44de6c28bbb061e4
---

# Phase 31 Plan 17: Bounded Chain Resolution and a Scope-Aware Canonicaliser Summary

Closed WR-19 and WR-20 structurally: `calleeDottedPath` now threads ONE step budget through its own
recursion (and both AST walks use an explicit stack, because bounding the resolver alone was not
sufficient), while a single per-file declared-name census in the ONE canonicaliser stops both
canonicalisation maps from rewriting a head the spec itself declares.

## Accomplishments

- **WR-19, the floor bypass.** `CALLEE_CHAIN_STEP_BOUND` is the one authority for the bound's VALUE
  and `CalleeStepBudget` for its UNIT. `calleeDottedPath` carries one budget through the whole
  resolution and charges the descent into a call link explicitly, so interleaving calls buys no extra
  steps. `forEachDescendant` replaced both self-recursive AST walks with an explicit worklist, and
  `analyzeSpecs` now records a spec it cannot finish as a could-not-run reason instead of letting the
  throw escape.
- **WR-20, the false refusal.** `deriveDeclaredNames` is a per-source-file census of the names the
  file DECLARES. `canonicaliseHeadSegment` consults it BEFORE either map and returns its input
  unchanged for a declared head, so the rule covers both maps and introduces no decline site.
- **The corpus grew a control with the inverse contract.** `shadowed-rename.uat.spec.ts` carries no
  mutation region; its whole job is to stay at zero findings.
- **The register and the recipe were re-derived from the mechanism**, and D-21 was recorded in
  `31-CONTEXT.md`, in the runnable's decision header and in this summary's key-decisions block.

## The measurements, verbatim

### WR-19, end to end (probe repo `.temp/wr19-prefix/`, spec `uat/p.uat.spec.ts`, 4000-link chain `chain.a().a()…`)

**Before**, against the committed `.js` at `2973d8a`:

```
EXIT=1
stdout: (empty)
stderr:
file:///Users/olgeroeselg/Projects/public/grugops/scripts/runnable-ref/uat-spec-integrity.js:686
export function calleeDottedPath(ts, expr) {
                                ^

RangeError: Maximum call stack size exceeded
    at calleeDottedPath (…/scripts/runnable-ref/uat-spec-integrity.js:686:33)
    at calleeDottedPath (…/scripts/runnable-ref/uat-spec-integrity.js:704:27)
```

This matches `31-VERIFICATION.md` behavioral spot-check row 8 and WR-19's own reproduction: EXIT=1,
empty stdout, no `visited/expected` line, `reportMeasured` never reached.

**After**:

```
EXIT=0
stdout: UAT spec integrity: 0 findings over 1/1 uat specs checked
stderr: (empty)
```

The same spec at **200 000 links** also returns `EXIT=0` with the same measurement line, which is the
evidence that the depth left the interpreter's stack rather than being pushed further out.

### WR-19, the two module-level shapes the review recorded

Reproduced through the committed module before any source change:

```
600 pure property links                       -> null
the SAME 600 links, 6 call links interleaved  -> resolved, 1216 chars, head "test"
```

The review recorded 1209 characters; the 7-character difference is this plan's own interleaving
construction (a call link after every 100th property link, plus the outer call), not a different
behaviour. The fact being measured is identical: the same chain resolved when call links were
interleaved and did not when they were not, which is the bound restarting per frame. After the fix
both answers are `null`, asserted as the `ONE BUDGET` case.

Adjacency, measured before the change and preserved by it exactly: 511 property links resolve (512
segments), 512 property links yield `null`.

### WR-20, the review's legitimate spec (probe repo `.temp/wr20-prefix/`)

**Before**:

```
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality gate
re-runs and how their results are read, so a green lane could certify a scenario nobody exercised or
one whose acceptance criterion failed.
EXIT=1
```

This matches `31-VERIFICATION.md` behavioral spot-check row 7: a legitimate spec refused, naming
`test.skip`, a construct that does not appear in the file.

**After**:

```
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

## Mutation proofs

Each mutant was applied to the `.ts`, rebuilt, measured, then reverted; after every revert the `.ts`
was compared with `cmp` against its pre-mutation copy and the rebuilt `.js` was `cmp`-identical to
the pre-mutation build.

| # | mutant | cases that failed | what it proves |
|---|---|---|---|
| A | the recursive descent starts a FRESH allowance (`newCalleeStepBudget()`) and is not charged | 4 | the SHARED budget is load-bearing: the end-to-end case, the no-finding case, the short-set case and the ONE-BUDGET module case all return to their pre-fix answers |
| B | `forEachDescendant` restored to a self-recursive walk | 3 | bounding the resolver alone is NOT sufficient. With the budget intact the run still could not finish; the fail-closed boundary then held the contract at `EXIT=2` with stdout empty and stderr naming the file — `The UAT spec uat/p.uat.spec.ts could not be analysed (Maximum call stack size exceeded); …` followed by `UAT spec integrity: ZERO uat specs were visited (1 derived) — this check was NOT performed.` That is the layering working as designed, and it is why B fails 3 cases rather than 0 |
| C | the declared-name census emptied | 11 | the census is load-bearing: the review's spec, the coarseness case, all six declaration kinds, the census's own membership cases and the control fixture |
| D | the second-parameter exemption forced false | 8 | the exemption is scoped to exactly the position it claims. Dropping it reopens CR-10 — the three `testInfo.*` cases, the renamed-binding case, the `testinfo-fixture-param` fixture and its mutation case all fail |

Mutant D's first draft did not compile (`isFixtureBindingPosition` became unused, TS6133) and the
mutation run silently measured the previous mutant's `.js`. It was caught because the failure list was
identical to mutant A's; the corrected mutant preserved the call and forced its result. Recorded
because a mutation proof that measures a stale artifact is a false proof, and this one nearly was.

## The four cardinalities, measured on this tree

| set | measured | vs `31-16-SUMMARY.md` | why |
|---|---|---|---|
| derived decline-site set | **17** | 16 → 17, **+1** | `deriveDeclaredNames`'s parser-predicate guard. Dispositioned as a `residual` under the existing parser-surface sentence, so the register did not grow. |
| two-axis residual partition total (`UNRESOLVABLE_CALLEE_RESIDUALS.length`) | **9** | unchanged | Two members were REWRITTEN to be true of the changed mechanism; none was added and none removed. The resolution/membership partition still sums to 9. |
| derived path-consumer set | **5** | unchanged | This plan touched no arm that compares a resolved path against a ban set. |
| reverse partition's walked denominator | **26** | unchanged | The declared surface gained no property; `checker.getPropertiesOfType` reads properties only. |

The watched-fail control still moves the decline count by exactly one and the seeded signature
arrives unbound. Its seed anchor moved with the loop it seeds into (`for (let guard = 0; guard < 512;
guard++)` → `for (; budget.left > 0; budget.left--)`), and its one-occurrence premise still holds.

Also re-measured: `NON_TEST_MODULE_COUNT` 73 → **74**, for the one new corpus file, with its
provenance paragraph written beside the twelve before it. `npm run check:diff-disposition` findings:
**77 before, 77 after**, **0** of them in `browser-uat-recipe.md` — the recipe is outside the gate's
watched corpus, as `31-16.md` already recorded. The 77 are the pre-existing debt in
`deferred-items.md`, spanning `05-pr-quality-gate.md` (38), `06-uat-pack.md` (25),
`16-context-read-write.md` (12) and `17-task-claim.md` (2), none of which this plan touches.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] Bounding the resolver's recursion was necessary and not sufficient; the AST walk that asks it was itself unbounded**

- **Found during:** Task 1, MOVEMENT 3, when the end-to-end case still failed after the budget landed.
- **Issue:** The plan (and WR-19) frame the defect as "the 512-step bound restarts per recursion
  frame". That is true and it is not the whole cause. `findBannedConstructs`'s `visit` and
  `deriveTestInfoParameterNames`'s `visit` were both self-recursive `ts.forEachChild` walks, so the
  interpreter's stack was consumed in proportion to the spec's AST depth — which for a call chain is
  the chain length. Measured: with the shared budget in place, a 4000-link chain still produced
  `RangeError: Maximum call stack size exceeded` at `calleeDottedPath`, because the walk had already
  descended thousands of frames before the resolver was asked. No step budget can reach that cost.
- **Fix:** `forEachDescendant` — one non-recursive walk with an explicit worklist, used by both
  callers. Order is not part of either caller's contract (arm (c) sorts its findings by source
  position; the fixture derivation accumulates into a set), and every descendant is still visited
  exactly once, so no residual is created.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`
- **Verification:** mutation proof B above; 200 000 links exit 0 with the measurement line.
- **Commit:** `64c6209`

**2. [Rule 2 — missing critical functionality] The exit-code contract needed a fail-closed boundary, not only an absence of throws**

- **Found during:** Task 1, MOVEMENT 3.
- **Issue:** The plan's prohibition is that the runnable "must never throw outside the D-12 exit-code
  contract's { 0, 1, 2 }". Removing the two known throw sources satisfies that for the two shapes we
  know about. It does not make the property hold BY DECISION, which is what the truth statement asks
  for — an unknown future throw would again exit 1 through Node's default and again bypass both
  floors with a silent stdout.
- **Fix:** `analyzeSpecs` wraps the per-spec analysis and records a failure as a could-not-run reason.
  The `visited` increment moved AFTER the analysis, so such a file does not count as checked and the
  denominator floor reports the short scan set.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`
- **Verification:** `a spec whose analysis throws is a could-not-run reason and never increments
  visited`; and mutation proof B, where the boundary is what holds the contract.
- **Commit:** `64c6209`

**3. [Rule 1 — bug in this plan's own first draft] The declaration-kind cases were vacuous as first written**

- **Found during:** Task 2, RED.
- **Issue:** Five of the six declaration-kind cases declared the shadowed name but never CALLED
  `.skip` on it, so they passed against the un-fixed tree — the canonicalisation only matters where a
  path is resolved. A case that is green before the fix proves nothing about the fix.
- **Fix:** every kind now carries a call on the shadowed binding, and the call site is held constant
  while only the declaration kind varies. All six then failed RED and passed GREEN.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Commit:** `d028b5d`

**4. [Rule 1 — bug in this plan's own first draft] A test assumed lexical scoping the rule does not have**

- **Found during:** Task 2, GREEN.
- **Issue:** The plan's Test 2 ("a genuine `test.skip` beside the shadowing binding is still named")
  was written assuming the shadowed name's declaration would only suppress the rewrite inside the
  declaring function. The rule is FILE-SCOPED, so it suppresses it for the whole file and the case
  measured zero findings.
- **Fix:** the case was split rather than weakened. One case shadows a DIFFERENT name and asserts the
  genuine renamed modifier is still refused exactly once at its own line — which is what discriminates
  a per-name census from a global off switch. A second case asserts the coarseness itself, as a
  MEASURED outcome with a premise message saying what a future green-to-red flip would mean.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Commit:** `0dce2e0`

**5. [Rule 3 — blocking issue] The rewritten residual sentences exceeded the 25-word descriptive bound**

- **Found during:** Task 3, MOVEMENT 5.
- **Issue:** `guard_sentence_form` (WP-03) measured the new chain-bound sentence at 30 words and the
  new scope sentence at 53 and 36 words, all against a 25-word bound. The register's own prose is
  inside the governed corpus because the recipe quotes it verbatim. A first re-split then tripped
  WP-06 with a bare `That is` subject.
- **Fix:** both members split into short sentences, propagated to all three places that must carry
  them byte-identically (the exported register, the test file's hand-typed copy, the recipe bullet),
  and the disposition rows record the split with its rule ids.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`, `…test.ts`,
  `agent-factory/checklists/browser-uat-recipe.md`, `docs/audit/29-style-dispositions/31-17.md`
- **Commit:** `2f7c1c5`

**6. [Rule 3 — blocking issue] `NON_TEST_MODULE_COUNT` moved with the new fixture**

- **Found during:** Task 3, MOVEMENT 5, running the whole suite.
- **Issue:** the pin is derived tree-wide and two-sided against `git ls-files '*.ts'`, so the new
  control fixture moved it from 73 to 74. This is the pin behaving as designed, not a defect.
- **Fix:** the number was updated with a provenance paragraph in the same shape as the twelve before
  it, naming the file, its contract and why both owner answers are unchanged.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `2f7c1c5`

**Total deviations:** 6 auto-fixed (2 × Rule 2 missing critical functionality, 2 × Rule 1 bug in this
plan's own draft, 2 × Rule 3 blocking). **Impact:** deviations 1 and 2 materially widened the fix —
without them the plan's own acceptance criterion (a measurement line on stdout for a pathological
spec) was unreachable, and the exit-code prohibition would have held only by absence of the two
throws we happened to know about.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None. The two changes remove surface rather than adding it: no new network endpoint, no new file
access pattern, no schema change. `deriveDeclaredNames` reads the same already-parsed AST every other
derivation reads, and the fail-closed boundary narrows what can escape `analyzeSpecs`.

## Verification results

| command | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | 194 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **Test Files 62 passed (62)**, **Tests 3632 passed \| 2 skipped (3634)** |
| `npm run build` | exit 0 |
| `npm run typecheck` | exit 0 (three targets, fixtures included) |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-imperative-lexicon.js` | `ALL CHECKS PASSED` |
| `git status --short .temp` | empty; no `*.uat.spec.ts` remains anywhere under `.temp` |

The suite's file count matches the 62 the round-4 verification measured. The test count rose from
3566 to 3632 (this plan's 21 new cases plus the parameterised expansions), and the "derives zero specs
from grugops's own repository root" case passes, which is the leftover-probe canary.

## What this plan does NOT close

- `UATX-05` and `UATX-06` stay unchecked in `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`.
  Only a verification round may flip them; this plan touched neither file.
- The scope rule is file-scoped, so a spec that both declares the renamed name and genuinely calls
  the modifier through the rename is not refused. Asserted as a measured case and named in the
  register and the recipe.
- A name shadowed only at a second-parameter position is still canonicalised. Named in the same
  register member.
- The head and tail sets are still hand-authored; the declared surface is still a hand transcription
  whose drift from the released package stays an open `UNKNOWN - verify` (`R-07`).
- `WR-17`, `WR-18` and `WR-21` of `31-REVIEW.md` are other plans' work and are untouched here.

## Next

Ready for `31-18`.

## Self-Check: PASSED

- `scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts` — FOUND
- `docs/audit/29-style-dispositions/31-17.md` — FOUND
- `a058c73` — FOUND
- `64c6209` — FOUND
- `d028b5d` — FOUND
- `0dce2e0` — FOUND
- `2f7c1c5` — FOUND
