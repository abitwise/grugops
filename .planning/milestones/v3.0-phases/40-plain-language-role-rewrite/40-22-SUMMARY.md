---
phase: 40-plain-language-role-rewrite
plan: 22
subsystem: tooling
status: complete
tags: [check-role-rules, board-move-partition, rule-6, in-01, shallow-history, hook-manifest]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "rule 6 arms (a) to (c) (plan 40-18), the IN-01 git content check (plan 40-19), check-role-rules.js in the hook decider closure (plan 40-21)"
provides:
  - "Rule 6 arm (d): a board move written as two code spans around an arrow, with the glyphs → -> => ⇒ ⟶, or as from/to prose, is one finding tagged (WR-07)"
  - "isShallowRepository(root) and the IN-05 FAIL: a shallow history fails the IN-01 content check by name"
  - "DECIDER_MANIFEST regenerated over the rebuilt check-role-rules.js"
affects: [40-25, check-diff-disposition stand-in, admission hook manifest]

actuals:
  tokens: 5375
  tasks: 2
  commits: 4
plan_head_before: 8671f636cdfb75c8d4861358d6635504f60ac5e4
plan_head_after: 1d9c2598c30cc5003279da45a526c98d5d3f6663

tech-stack:
  added: []
  patterns:
    - "Arm (d) builds an unspanned copy of the line: a span holding exactly one column becomes that column's text, every other span a blank"
    - "A move that two arms both see is counted once, matched by its text with spaces collapsed"
    - "A shallow repository is a named FAIL. A tree with no git history keeps the NOTE. The CI variable is never the trigger"

key-files:
  created: []
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "WR-07: in arm (d), a single-column span is matched against the column list without regard to case, using the same alternation arm (c) builds. The live tree stays green with this stricter test."
  - "IN-05: only a shallow repository triggers the FAIL. process.env.CI is not used, because the hermetic mirrors run in CI with CI=true and have no git history."

patterns-established:
  - "A unit case that compares a multi-line array is written as a length check followed by a string check, so that vitest's TAP report stays parseable for the RED evidence classifier"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "Rule 6 arm (d) names a two-span move, an ASCII-arrow two-span move, a from/to move and the ⇒ and ⟶ glyphs, each as exactly one (WR-07) finding"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): the human's red case, `In Development` → `Done` planted into orchestrator.md, is red"
        status: pass
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): `In Development`->`Done` planted into software-engineer.md is red"
        status: pass
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): from `In Development` to `Done` planted into software-engineer.md is red"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): an arrow glyph outside the ASCII set, In Development ⇒ Done, is one finding"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nothing that is right today turns red: the canonical span, a non-column two-span arrow, a one-column from/to, an empty section, every IN-02 and WR-02 case, and the 19 shipped roles"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): the canonical span, a non-column two-span arrow and a one-column from/to add no finding"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-07): a two-span move next to a canonical span is one finding, and an empty section is none"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js (board-move partition: 0 findings over 19/19 elements)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A shallow history fails the IN-01 content check, naming fetch-depth: 0 (IN-05). A repository that is not shallow and lacks the start commit, and a plain mirror, keep the NOTE"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#a depth-1 clone of a two-commit mirror repository is red naming the shallow history and fetch-depth: 0"
        status: pass
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#the non-shallow mirror repository, whose history lacks the start commit, stays green with one IN-01 NOTE"
        status: pass
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#a plain mirror with no git history stays green and prints the IN-01 NOTE"
        status: pass
    human_judgment: false
  - id: D4
    description: "The hook manifest and every freshness gate agree with the rebuilt check-role-rules.js"
    verification:
      - kind: other
        ref: "npm run freshness:hook-manifest && npm run freshness && npm run freshness:guarantees && npm run freshness:context"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-03
---

# Phase 40 Plan 22: Rule 6 two-span moves (WR-07) and the shallow-history FAIL (IN-05) Summary

**Rule 6 now has an arm (d) that unspans single-column code spans. With it, `` `In Development` → `Done` ``, `` `X`->`Y` ``, "from `X` to `Y`" and the ⇒ and ⟶ glyphs are each one named (WR-07) finding. A shallow git history now fails the IN-01 baseline check by name instead of passing with a NOTE.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-03T19:51:34Z
- **Completed:** 2026-11-03T19:59:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- WR-07 is closed. The human's red case is red. When the line "You own `In Development` → `Done`." is planted directly under `## Board moves` in a mirror orchestrator.md, `node scripts/check-role-rules.js` exits 1 and prints:
  `orchestrator.md: rule 6: `In Development → Done` is a board move written as separate code spans or as from/to prose; write it as one `X → Y` code span (WR-07)`
- The reviewer's other spellings give exactly one rule 6 line each: `` `In Development`->`Done` ``, "from `In Development` to `Done`", "In Development ⇒ Done" and "In Development ⟶ Done".
- Nothing that is right today turns red. The canonical span `` `Ready for UAT → In UAT` ``, "Keep the `input` → `output` order." and "Move it from `Blocked` to the owner." each give `[]`. Every IN-02 and WR-02 case passes unchanged, including the cases that assert exactly one rule 6 line.
- Live gate partition line: `PASS  board-move partition: 0 findings over 19/19 elements`. The IN-01 line also stays a PASS: `PASS  docs/audit/40-role-rule-inventory.json equals a fresh derivation out of git objects at e8d7802 (IN-01)`.
- IN-05 is closed in the narrow form. On a depth-1 clone, the gate exits 1 with:
  `git objects at <PHASE_40_START_COMMIT> are not reachable under <ROOT> because the history is shallow, so docs/audit/40-role-rule-inventory.json cannot be compared with git (IN-05). Fetch the full history (on CI, `fetch-depth: 0`); do not re-record the baseline`
- The hook manifest was regenerated after each rebuild. `freshness:hook-manifest` reports 1 decider and 15 module hashes matching.

## Task Commits

1. **Task 1 RED:** `a3fc0409` test(40-22): add failing WR-07 cases for two-span and from/to board moves
2. **Task 1 GREEN:** `2c5f4d41` fix(40-22): rule 6 names two-span and from/to board moves (WR-07). `git show --name-only` lists only check-role-rules.ts/.js and hook-entry.ts/.js
3. **Task 2 RED:** `4757f559` test(40-22): add failing IN-05 case for a shallow history
4. **Task 2 GREEN:** `1d9c2598` fix(40-22): a shallow history fails the IN-01 content check by name (IN-05)

## TDD evidence

**Task 1 RED.** The command was `npx vitest run scripts/check-role-rules.test.ts --reporter=tap-flat`. It exited 1 with 88 tests: 83 passed and 5 failed. The 5 failures were the three WR-07 mirror cases (the gate exited 0 with no rule 6 line), the ⇒ unit case (it returned `[]`) and the adjacency case (it returned `[]`). The sixth new case, the no-finding control, passed, as a control should before the change. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK (target_test_failed)` on the ⇒ unit target. Semantic assessment: the target ran and failed on its planned length assertion, because arm (c) knew only →, -> and =>.

**Task 1 GREEN.** 88 passed and 0 failed. With `-t "rule 6"`, 16 passed.

**Task 2 RED.** The shallow-clone case passed its premise (`--is-shallow-repository` printed `true`), then failed on the status assertion: the gate printed the IN-01 NOTE and exited 0. The non-shallow control passed. The classifier was not run on this record. The failure message embeds the multi-line gate output, which vitest's TAP reporter does not indent, so the report cannot be parsed. Semantic assessment was done by reading the report: the right target failed for the planned reason. `workflow.tdd_mode` is false, so this gate is advisory.

**Task 2 GREEN.** 90 passed and 0 failed. With `-t "IN-05|IN-01"`, 7 passed.

**Pass counts:** 82 before the plan, 88 after Task 1, 90 after Task 2. The plan's verification suite across six files ran 673 tests, all passing.

## Files Created/Modified

- `scripts/check-role-rules.ts` / `.js`
  - Arm (d) in `moveSpanFindings`.
  - Docstring item "(d) WR-07".
  - A WR-07 sentence in the header's rule 6 entry.
  - `isShallowRepository(root)`.
  - The IN-05 FAIL branch in `check()`.
  - Header paragraph "IN-05 (plan 40-22, decision 2026-11-03)".
- `scripts/check-role-rules.test.ts`
  - Six cases named "partition rule 6 (WR-07): ...": three mirror cases and three unit cases.
  - The describe "IN-05: a shallow history is a FAIL, not a NOTE (gap round 3)", which holds the shallow-clone case and the non-shallow case.
  - The `gitIn` and `mirrorRepo` helpers and the `pathToFileURL` import.
- `hooks/hook-entry.ts` / `.js`: the `DECIDER_MANIFEST` hash for `scripts/check-role-rules.js` was regenerated.

## Decisions Made

- In arm (d), a span counts as a single column when its contents match the column list without regard to case, using the same alternation arm (c) builds. The reviewer's sketch used `columns.has`, which is case-sensitive. The test is stricter, and the live tree stays green.
- When arm (c) and arm (d) find the same move on one line, it is counted once. The match text is compared with spaces collapsed, one occurrence at a time, so two separate moves on one line are still two findings.
- The IN-05 trigger is a shallow repository only. `grep -c "process.env.CI" scripts/check-role-rules.ts` prints 0.

## Deviations from Plan

- **Test shape (no behavior change).** The ⇒ unit case is written as a loop over ⇒ and ⟶ that checks the length, then the string, instead of comparing the whole array with `toEqual`. vitest's TAP reporter writes a multi-line `expected` array without YAML indentation, and the RED classifier rejects that report as malformed. The behavior asserted is the same, and the ⟶ glyph is now covered too.
- **Coverage added beyond the plan.** One more unit case covers the adjacency edge (a two-span move next to a canonical span gives one finding) and the empty edge (an empty `## Board moves` gives none). The plan's flagged assumptions listed both edges as unresolved.
- **Counting the RED failures.** The plan says the six new Task 1 cases fail at RED. Five fail. The sixth is the no-finding control, which is correct before the change, so it passes.

**Total deviations:** 3, all test-side. None touched SAFETY_RULE_FACTS, carriesSafetyFact, claimedPairs, the partition rules 1 to 5, BOARD_MOVE_EXCEPTIONS, D33_NON_FORWARD_PAIRS or the baseline JSON. All of these were confirmed unchanged by diff.

## Issues Encountered

The RED evidence classifier cannot parse vitest TAP output when a failure message spans several lines, which happens in every mirror case because the gate's stdout is the assertion message. The Task 1 classifier run used a unit target instead. The Task 2 evidence was assessed by reading the report.

## Prohibitions honored

- SAFETY_RULE_FACTS, carriesSafetyFact, claimedPairs, rules 1 to 5, both declared pair lists and `docs/audit/40-role-rule-inventory.json` are byte-unchanged.
- No existing test case was weakened or deleted.
- The IN-05 FAIL does not depend on `process.env.CI`.
- No role, workflow, adapter or disposition file was edited.
- `.planning/REQUIREMENTS.md` was not changed (`git diff --quiet` exits 0), and no PLAIN requirement was marked Complete.

## User Setup Required

None.

## Next Phase Readiness

Plan 40-25 records the WR-07 and IN-05 dispositions in `40-REVIEW-DISPOSITION.md`, using the evidence above. Plans 40-23 and 40-24 can proceed.

## Self-Check: PASSED

- Every modified file exists on disk.
- Commits a3fc0409, 2c5f4d41, 4757f559 and 1d9c2598 are ancestors of HEAD.
- The four commits match `git rev-list --count` from plan_head_before.
- Every acceptance criterion and every plan verification command passed. Gates checked: check-role-rules, check-diff-disposition, check-foundation-guards, validate-agent-factory, and freshness, hook-manifest, guarantees and context.
