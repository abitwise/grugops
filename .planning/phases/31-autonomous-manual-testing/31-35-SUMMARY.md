---
phase: 31-autonomous-manual-testing
plan: 35
subsystem: testing
tags: [gap-closure, round-7, uat-spec-integrity, fail-closed, bounded-walk, could-not-run, CR-25]
requires:
  - phase: 31-autonomous-manual-testing
    provides: "D-28's {0,1,2} exit-code partition, held at TWO decided boundaries — this plan adds a CAUSE at one of them, never a third boundary"
  - phase: 31-autonomous-manual-testing
    provides: "D-30 sub-decision 2 and 4: the could-not-run route (PROGRAM_UNAVAILABLE_REASON, exit 2) that replaced RR-07's silent degrade"
  - phase: 31-autonomous-manual-testing
    provides: "D-33's row() marker, CORPUS_ROW_FLOOR and the removed manifest axis (there is no corpus manifest file to extend)"
  - phase: 31-autonomous-manual-testing
    provides: "D-35's four-arm identity vocabulary and IDENTITY_BAN_OPERAND — the `foreign-declared` arm is what masks CR-25's filed spelling"
provides:
  - "a truncated framework-surface walk routed to could-not-run at exit 2 with its own named cause (SURFACE_TRUNCATED_CAUSE)"
  - "both walk bounds EXPORTED, published as register members and as verbatim recipe bullets, asserted in both directions"
  - "a two-sided corpus boundary pair — refused just under, could-not-run just over — so the direction cannot regress to an accept"
  - "a surface walk that stops at the standard library's edge, which is what gives either bound any headroom at all"
  - "D-36, with the reconciled boundary number, its construction, and the remainder it does not establish"
  - "a DERIVED spawning-helper set for the corpus's POINT-1 gate, replacing a four-name literal"
affects: [scripts/runnable-ref/uat-spec-integrity.ts, scripts/runnable-ref/uat-spec-integrity.js, scripts/runnable-ref/uat-spec-integrity.test.ts, agent-factory/checklists/browser-uat-recipe.md]
actuals:
  tokens: 22470
  tasks: 3
  commits: 5
  commits_instrument: "git rev-list --count 140fbf4..HEAD at the plan's closing (metadata) commit, which is the sixth; the five before it are listed in Task Commits below"
  tokens_instrument: "chars/4 over `git diff 140fbf4..HEAD` added/removed lines (89,881 chars). The plan's 90,000-token estimate is on a different, larger instrument; the two are not compared here."
tech-stack:
  added: []
  patterns:
    - "a bound that is REACHED is reported, never absorbed: every arm that stops the walk writes into ONE truncation record, and the cause names which arm"
    - "a LEAF at a bound is not a truncation — the report answers the question it claims to answer (were declarations left unreached?) rather than the cheaper one (did the counter hit its limit?)"
    - "probe your own fix at the coordinate the gate is REACHED from: two of three adversarial probes answered yes, and one of those was a regression the fix itself created"
    - "derive the helper set by fixed point from the one function that does the thing, instead of listing its names"
key-files:
  created:
    - docs/audit/29-style-dispositions/31-35.md
    - .planning/phases/31-autonomous-manual-testing/red-evidence/31-35-task1-red.json
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md
key-decisions:
  - "D-36: a bound that is reached is a check that did not run — the walk records which limit stopped it and the run exits 2 through the EXISTING could-not-run boundary with its own cause"
  - "The walk stops at the standard library's edge. Without it the depth bound was already reached on an ORDINARY run (16 of 17 framework files were typescript/lib/*.d.ts), so the truncation route would have blocked every target."
  - "A library CONTAINER is descended into by its type ARGUMENTS only. This closes a regression the narrowing above created, found by this plan's own probe and measured against the base artifact."
  - "The reconciled boundary number belongs to ONE written-down construction: 7 hops refused / 8 accepted, which is 31-VERIFICATION.md's number and not 31-REVIEW.md's. Neither prior document was edited."
patterns-established:
  - "when a fix narrows a derived set, probe the narrowing itself against the PREVIOUS artifact — the regression it creates looks exactly like the defect it closed"
  - "a disclosed remainder carries a corpus row that asserts the ACCEPT, so the disclosure cannot quietly stop being true"
requirements-completed: [UATX-05, UATX-06]
coverage:
  - deliverable: "a truncated walk exits 2 with a named cause instead of accepting"
    kind: automated-test
    ref: "scripts/runnable-ref/uat-spec-integrity.test.ts — rows CR25-OVER-BOUND-could-not-run, CR25-NODE-BOUND-could-not-run, CR25-CONFOUND-single-file-layout, CR25-SPELLING-BACKSTOP-plain-head"
    status: verified
    human_judgment: false
  - deliverable: "the refusing half of the boundary pair is unchanged"
    kind: automated-test
    ref: "scripts/runnable-ref/uat-spec-integrity.test.ts — row CR25-UNDER-BOUND-refused, plus CR25-BAND-no-accept over six chain lengths"
    status: verified
    human_judgment: false
  - deliverable: "both bounds are register members and verbatim recipe bullets, bound in both directions"
    kind: automated-test
    ref: "scripts/runnable-ref/uat-spec-integrity.test.ts — 'the boundary list PARTITIONS into register members and the bounded remainder'; watched RED in both directions and reverted"
    status: verified
    human_judgment: false
  - deliverable: "the {0,1,2} partition gains no fourth code"
    kind: automated-test
    ref: "scripts/uat-gate-exit-contract.test.ts — the reachable-return derivation, green unchanged; plus the in-band assertion in CR25-BAND-no-accept"
    status: verified
    human_judgment: false
  - deliverable: "the headroom claim over the transcribed surface"
    kind: automated-test
    ref: "scripts/runnable-ref/uat-spec-integrity.test.ts — row CR25-LIB-NOT-FRAMEWORK (no typescript/lib file in frameworkFiles; typePaths well under the node bound)"
    status: verified
    human_judgment: false
  - deliverable: "the installed-package magnitude"
    kind: unmeasured
    ref: "UNKNOWN - verify — CLAUDE.md fixes the dev dependency set, so @playwright/test cannot be installed to measure whether a real surface approaches either bound"
    status: open
    human_judgment: true
    rationale: "No mechanism in this repository can take the measurement. Whether the fail-closed direction is operationally acceptable on a real Playwright repository is a human's call on a risk this plan can only bound, not resolve."
  - deliverable: "D-36 and the disposition record"
    kind: document
    ref: ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md (D-36); docs/audit/29-style-dispositions/31-35.md"
    status: verified
    human_judgment: true
    rationale: "Whether the recorded decision states the price and the remainder honestly is a reading, not a test. The gates check form (claim anchors, residual citations, sentence bounds); they cannot check candour."
duration: 83m
completed: 2026-09-11
status: complete
---

# Phase 31 Plan 35: A Bound That Is Reached Is A Check That Did Not Run Summary

`frameworkSurface`'s two bounds now report themselves and route the run to could-not-run at exit 2
with a named cause, instead of silently returning a partial surface over which every unreached
framework declaration resolved `foreign` — accept.

## Performance

- Duration: 83 minutes (2026-09-11T14:45Z → 16:09Z)
- Tasks: 3 (plus two probe-driven fix commits inside Task 3's scope)
- Commits: 5, plus this plan's metadata commit
- Full excluded-e2e suite at the closing commit: **64 files, 4183 passed, 2 skipped** — green

## Accomplishments

### The defect, re-bisected to ONE construction

`CR-25` was bisected twice before this plan, at two different numbers (`31-REVIEW.md` 6/7,
`31-VERIFICATION.md` 7/8). The disagreement is a property of how each measurement declared the
framework surface across FILES. This plan built one construction, wrote it into the suite's own
block header, and re-bisected at the plan's base (`140fbf4`):

```
j  hops  callee                        tsc  stdout                   exit  stderr
3  4     t.deep.p.p.skip               0    1 finding(s) over 1/1     1     0 bytes
4  5     t.deep.p.p.p.skip             0    1 finding(s) over 1/1     1     0 bytes
5  6     t.deep.p.p.p.p.skip           0    1 finding(s) over 1/1     1     0 bytes
6  7     t.deep.p.p.p.p.p.skip         0    1 finding(s) over 1/1     1     0 bytes
7  8     t.deep.p.p.p.p.p.p.skip       0    0 findings over 1/1       0     0 bytes   <- the bypass
8  9     t.deep.p.p.p.p.p.p.p.skip     0    0 findings over 1/1       0     0 bytes
9  10    t.deep.p.p.p.p.p.p.p.p.skip   0    0 findings over 1/1       0     0 bytes
```

**The flip pair is 7 hops / 8 hops** in this construction, which is `31-VERIFICATION.md` row 6's
number and not `31-REVIEW.md`'s. Both prior measurements are correct about their own layouts and
both demonstrate the same defect. **Neither prior document was edited.**

**The confound was ruled out BY MEASUREMENT, before the bisection was read.** The same chain with
every hop declared in ONE file reported `1 finding(s)` / EXIT=1 at j=6, 7 and 8 — a single-file
chain never reaches the bound at all, because `frameworkFiles` holds FILES and one file is added
whole the moment the walk reaches the first declaration in it.

**A second reconciliation the plan did not anticipate.** With a plain `test` head, CR-25's FILED
spelling no longer reproduces at this base: measured at chain lengths 6 through 9, `1 finding(s)` /
EXIT=1 at every length. `D-35`'s `foreign-declared` arm asks the SPELLING rule, and `test`…`skip` is
banned on head and tail alone, so the spelling rule backstops the identity failure for that
spelling. The defect was MASKED, not closed. The construction above uses a local alias head
(`const t = test`), which is not an import rename, so the spelling rule reads `t` — in no ban set —
while identity rewrites the same head to `test` from the walked surface. That is the pair: identity
refuses it, spelling does not, and the bound decides which one answers.

### The measurement that changed the shape of the fix

The plan asked for a headroom measurement against the transcribed surface, expecting to record a
margin. There was none:

```
BEFORE any narrowing, over scripts/runnable-ref/fixtures/playwright-test.d.ts:
  frameworkFiles = 17   — SIXTEEN of them node_modules/typescript/lib/*.d.ts
  typePaths      = 79
  deepest path   = expect().toHaveText().__@toStringTag@52.length.toString   — SIX links
```

The depth bound was **already being reached on an ORDINARY run**, by walking `String`, `Number`,
`Array` and `Promise`. A truncation route added without narrowing the walk would have turned EVERY
run into a could-not-run at exit 2. So the walk now stops at the standard library's edge. After it:
**1 framework file, 17 recorded paths, deepest at depth 2**, against bounds of 4096 and 6.

### The fix

- `frameworkSurface` returns `truncated`, set by FOUR arms in ONE record
  (`SURFACE_TRUNCATION_REACHED`): the node bound (moved out of the loop condition into an explicit
  stop), the depth bound, the seeding failure (`getExportsOfModule` throwing — previously the one
  silent early return), and a container whose type arguments the checker does not publish.
  `SURFACE_TRUNCATION_ARMS` is derived from the record, so an arm without a sentence does not
  compile.
- A **LEAF** at the depth bound is not a truncation: a node with no properties and no call
  signatures cut nothing off. The predicate fails CLOSED — a checker that throws answers
  "expandable".
- `createProgramForTarget` returns `ok: false` with `surfaceTruncatedCause(...)`, so the run takes
  the could-not-run boundary D-28 already decided. **No new exit code, no second boundary.**
- Both bounds and the one remaining open shape are members of `UNRESOLVABLE_CALLEE_RESIDUALS`
  (7 → 10) and verbatim bullets in the recipe's boundary list, with `RESIDUAL_COVERAGE` extended by
  index and the cardinality assertion re-taken.

### The probe of this plan's own fix — and the regression it found

Three adversarial probes, each asking: *can a framework declaration be left UNREACHED without the
walk reporting a truncation?*

| probe | at HEAD (with the narrowing) | at the base `140fbf4` | verdict |
|---|---|---|---|
| a framework type behind a library container (`Held[]`) | `0 findings` EXIT=0, tsc 0 | `1 finding(s)` EXIT=1 | **a regression this plan created** — CLOSED |
| a framework member behind an INDEX SIGNATURE | `0 findings` EXIT=0, tsc 0 | `0 findings` EXIT=0 | pre-existing — DISCLOSED, with a row |
| the walk's inner `catch` blocks | read, not reproduced | — | deferred item, not claimed closed |

The container regression is closed by descending into a container's TYPE ARGUMENTS only, never into
its own members, and kept closed by the corpus row `CR25-CONTAINER-still-refused`. The
index-signature shape REPLACED the container sentence as the register's third new member: the
sentence that predicted it said the route was *"reasoned rather than measured"*, and it is measured
now, so that sentence was retired rather than left standing.

## Task Commits

| Task | Commit | What |
|---|---|---|
| 1 | `d107805` | `test(31-35)`: the re-bisection, the confound, the boundary pair — RED |
| 2 | `6be4cee` | `feat(31-35)`: truncation reported and routed to exit 2; register and recipe |
| 3 | `197544b` | `docs(31-35)`: the recipe's fourth could-not-run cause, the disposition file, D-36 |
| 3 (fix) | `1da7107` | `fix(31-35)`: WP-03 sentence bounds on the new member text, all three copies |
| 3 (fix) | `adbbde5` | `fix(31-35)`: close the regression this plan's own narrowing created |
| — | this commit | plan metadata: SUMMARY, STATE, ROADMAP |

## Files Created/Modified

Created: `docs/audit/29-style-dispositions/31-35.md`,
`.planning/phases/31-autonomous-manual-testing/red-evidence/31-35-task1-red.json`.
Modified: `scripts/runnable-ref/uat-spec-integrity.{ts,js,test.ts}`,
`agent-factory/checklists/browser-uat-recipe.md`, `31-CONTEXT.md` (D-36), `deferred-items.md`.

## Decisions Made

**D-36** (full text in `31-CONTEXT.md`): a bound that is reached is a check that did not run; the
walk records which limit stopped it; the run exits 2 through the existing could-not-run boundary.
Its four refinements, its reconciled boundary number with the construction that produces it, the
operational price, and what it does NOT establish — the installed-package magnitude
(`UNKNOWN - verify`), the index-signature shape, and the Windows leg (`R-03`) — are recorded there.

## Deviations from Plan

**[Rule 2 - Missing critical] The walk had to stop at the standard library's edge, or the fix was unshippable**
- **Found during:** Task 2, while taking the headroom measurement the plan asked for.
- **Issue:** The depth bound was already reached on an ORDINARY run — 16 of the 17 files identity
  was decided against were `node_modules/typescript/lib/*.d.ts`. Routing truncation to exit 2
  without narrowing the walk would have made every target a could-not-run, including this
  repository's own corpus.
- **Fix:** A symbol whose every declaration is default-library is not walked and its file is not
  added. Fail-OPEN towards walking (an unreadable probe reaches the loud outcome, not a quieter
  walk).
- **Files:** `scripts/runnable-ref/uat-spec-integrity.ts`. **Verification:** headroom re-measured
  (1 file, 17 paths, depth 2); all 390 pre-existing cases in the two target suites unmoved.
- **Committed in:** `6be4cee`.

**[Rule 1 - Bug] The narrowing above created a regression, and this plan's own probe measured it**
- **Found during:** the adversarial probe after Task 3.
- **Issue:** `t.many[0].skip(...)` behind a `GrugHeld[]` on the framework's own `Test` type was
  accepted at exit 0 with the narrowing in, and refused at exit 1 by the artifact at the plan's
  base.
- **Fix:** descend into a library container's TYPE ARGUMENTS only. A checker that does not publish
  `getTypeArguments` is the fourth truncation arm.
- **Files:** `scripts/runnable-ref/uat-spec-integrity.{ts,js,test.ts}`. **Verification:** probe
  re-run (exit 1 restored), corpus row `CR25-CONTAINER-still-refused`, mutation proof below.
- **Committed in:** `adbbde5`.

**[Rule 1 - Bug] Six new register sentences exceeded the WP-03 descriptive bound**
- **Found during:** the plan-level full-suite run (`scripts/check-imperative-lexicon.test.ts` red).
- **Issue:** the register members are published VERBATIM as recipe bullets, and the recipe is inside
  the lexicon gate's governed corpus. Measured at the base: 0 findings over 48 elements.
- **Fix:** sentences split, all three copies rewritten from ONE source so they stay byte-identical
  by construction. **Verification:** gate green, 0 findings over 48 elements.
- **Committed in:** `1da7107`.

**[Rule 3 - Blocking] Two corpus gates were keyed to hand-typed sets this plan's new rows fell outside**
- **Found during:** Task 2.
- **Issue:** POINT 1 ("no corpus row decides a ban without spawning the committed .js") tested for a
  four-name literal of spawning helpers, so every row using this plan's new helper read as an
  offender. The register cardinality assertion pinned 7.
- **Fix:** the spawning-helper set is now DERIVED by fixed point from the one function that passes
  `CHECK_JS` to `spawnSync` (seed 2, closure 10, out of 80 function declarations); the cardinality
  assertion is re-taken at 10 with the history in its message.
- **Committed in:** `6be4cee`.

**[Plan-text substitution] No manifest, no new fixture files, no `tsconfig.fixtures.json` change**
- The plan's file list names `docs/audit/31-review-corpus-manifest.md`, three new fixtures and a
  `tsconfig.fixtures.json` edit. Under `D-33: remove-axis` (a named human's answer in 31-32) **there
  is no manifest file**, and one was NOT created. The boundary-pair construction needs ONE INTERFACE
  PER FILE, which a single `deep-surface.d.ts` fixture cannot express; and planting a deep chain
  into `equipTarget` would change the surface every pre-existing row is measured against. The probe
  files are therefore generated per row through `driveSpec`'s `extraFiles`, which is the established
  precedent (`ARM-CR23-declaration-file`, 31-34) and leaves the equipping authority single. The
  acceptance criterion "both new fixtures type-check under `tsconfig.fixtures.json`" is substituted
  by an in-suite type-check of both flip-pair members through the host compiler
  (`CR25-PREMISE-pair-typechecks`, zero diagnostics) plus `tsc --noEmit` exit 0 recorded for every
  bisection row. `npx tsc -p tsconfig.fixtures.json` still exits 0.
- The plan's Task 3 MOVEMENT 2 asks to "extend" the recipe-to-register binding. It already asserts
  set-equality in BOTH directions through one authority, so extending it would have been a second
  authority for one question. It was WATCHED red in both directions instead (a member with no
  bullet; a bullet with no member) and reverted — both transcripts in Verification below.
- The recipe's boundary bullets landed in Task 2's commit rather than Task 3's, because the
  both-directions binding makes the register member and its bullet ONE atomic change: a commit
  carrying only one side is red by design.
- `scripts/uat-gate-exit-contract.test.ts` is unchanged. It DERIVES the runnable's reachable return
  values from its own syntax tree, and the new outcome reuses exit 2, so it re-measured the
  partition automatically and stayed green.

**[Accepted, per the orchestrator's binding instruction] Commits landed on `main`**
- `branching_strategy: "none"` and the sequential-executor instruction. The generic
  protected-branch assertion in the executor workflow would otherwise have blocked; this is the same
  route plans 31-32 through 31-34 took.

Totals: 3 auto-fixed issues, 1 plan-text substitution set, 1 accepted process deviation. Impact: the
fix is materially larger than the plan drew it, and one register member was retired because a probe
disproved its own wording.

## Issues Encountered

- The plan's premise that headroom existed was false; see the Rule 2 deviation. The plan's own
  instruction ("If the measured headroom is thin, record it as a fact and an owner rather than
  silently raising a bound") was followed — no bound value moved.
- The `check:diff-disposition` gate remains a **pre-existing FAIL** on this tree: 78 findings over
  39 elements, the same count `31-31` recorded and `31-32`, `31-33` and `31-34` re-measured unmoved.
  Zero findings name any file this plan authored (`grep -c browser-uat-recipe.md` → 0). Already an
  open deferred item; not cleared here.

## Verification

| check | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **64 files, 4183 passed, 2 skipped — green** |
| `npm run typecheck` | exit 0 (three tsconfig targets) |
| `npx tsc -p tsconfig.fixtures.json` | exit 0 |
| `npm run check:build-parity` / `npm run freshness` | no tracked output moved; 61 committed `.js` fresh |
| `node scripts/runnable-ref/uat-spec-integrity.js <repo root>` | `EXIT=2`, ZERO uat specs derived — **byte-identical output to the base artifact run on the same tree** |
| `{0,1,2}` partition | re-derived from the runnable's own AST, no fourth code; every band row asserted in-contract |
| `check:claim-anchors` / `check:residual-citations` / `check:banned-claims` / `check:public-docs` / `check:imperative-lexicon` | ALL CHECKS PASSED |
| `git diff .planning/REQUIREMENTS.md .planning/ROADMAP.md` | byte-unchanged; no UATX box, no traceability row, no phase box moved |
| `git diff package.json package-lock.json` | EMPTY — no package-manager install was run |
| `hooks/guard.ts` | untouched; `FROZEN_GUARD_BLOB` not re-based |

**RED evidence (Task 1):** `gsd_run check tdd-red-evidence` →
`RED_EVIDENCE_OK` / `target_test_failed`, 8 tests, 2 pass, 6 fail, target test
"OVER the bound: the walk stops early and the run COULD NOT RUN, at exit 2". The classifier parses
`node:test` TAP and this repository runs vitest, so the TAP body is DERIVED from the same run's
`--reporter=json` transcript — one `ok`/`not ok` line per executed assertion result plus the three
counters, nothing hand-written. The adapter is disclosed in the record itself.

**The one-sided binding watch (Task 3 MOVEMENT 2), both directions:**

```
A: register member with no bullet  -> FAIL "the register member is not a boundary BULLET: THE
                                      FRAMEWORK-SURFACE WALK IS BOUNDED IN SIZE. …"
B: bullet with no register member  -> FAIL "1 boundary bullet(s) are neither a member of
                                      UNRESOLVABLE_CALLEE_RESIDUALS nor a decided non-residual …"
reverted                           -> 1 passed
```

**Mutation proof, at the final artifact, in order:**

```
MUTANT 1 — the truncation flag is never set (both bound arms)
  mutant applied to the .ts, rebuilt
  grep GRUG_MUTANT_31_35 in the REBUILT .js -> 4   (read BEFORE any result)
  over-bound row  -> `0 findings over 1/1`, EXIT=0     (the defect, restored)
  the 31-35 block -> 5 failed | 5 passed
MUTANT 2 — the container descent is removed
  mutant applied, rebuilt
  grep GRUG_MUTANT_31_35_C in the REBUILT .js -> 2  (read BEFORE any result)
  container probe -> `0 findings`, EXIT=0             (the regression, restored)
  the container row -> 1 failed
REVERT
  rebuilt; grep GRUG_MUTANT -> 0; `git diff` over the .ts and .js -> EMPTY (byte-identical to HEAD)
  over-bound row  -> EXIT=2, 516 bytes on stderr      (restored)
```

## User Setup Required

None.

## Next Phase Readiness

`CR-25` is closed at the mechanism and published at the boundary list, with the boundary pair driven
in both directions. Round 7's remaining gap-closure plans (`31-36` … `31-38`) are unblocked: the
full excluded-e2e suite is green at this commit, so each can measure its own fix against a green
harness.

Two items are handed to the next verification round rather than claimed closed, both found by this
plan's own probe and both recorded in `deferred-items.md`: `frameworkSurface`'s inner `catch` blocks
(a silent-subtree shape, read but not reproducible here) and the index-signature route (measured
open at HEAD and at the base, disclosed as a register member with a driven row). The installed
`@playwright/test` surface's magnitude stays `UNKNOWN - verify`.

## Self-Check: PASSED

- Key files: all 6 FOUND on disk.
- Commits: `git log --oneline --all --grep="31-35"` → 6.
- TDD scopes: `^test\(31-35\):` → 1, `^feat\(31-35\):` → 1.
- `docs/audit/31-review-corpus-manifest.md` correctly ABSENT (D-33: remove-axis).
- `grep -c "^- \[x\] UATX" .planning/REQUIREMENTS.md` → 0.
- Every acceptance criterion re-run at the closing commit; all green or explicitly substituted with
  the substitution recorded above.
