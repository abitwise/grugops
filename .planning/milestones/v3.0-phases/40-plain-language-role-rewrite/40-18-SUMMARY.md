---
phase: 40-plain-language-role-rewrite
plan: 18
subsystem: testing
tags: [check-role-rules, board-move-partition, rule-6, fact-kinds, gap-closure]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "the board-move partition guard (rules 1-6), FACT_KINDS and the kind-floor test (plans 40-02, 40-11, 40-13)"
provides:
  - "Rule 6 names a `## Board moves` code span holding `->` or `=>` (WR-02)"
  - "Rule 6 names a move between two board columns written outside a code span (WR-02)"
  - "check-role-rules.ts header and checkPartition doc comment describe six rules and two declared lists (IN-02)"
  - "Kind-floor tests hold every derived fact (baseline and deriveAll) inside FACT_KINDS (IN-02)"
affects: [40-21, phase-40-verification]

actuals:
  tokens: 4900
  tasks: 2
  commits: 4
plan_head_before: 1fe5c02da3d0f817cb12a88ace6357ad5dea16c2
plan_head_after: 1235baec62293a1d0ebf8a8c271ed6873af4ba00

tech-stack:
  added: []
  patterns:
    - "A prose pattern built from the seed board columns at call time: escaped, longest first, word-bounded, case-insensitive"

key-files:
  created: []
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts

key-decisions:
  - "Rule 6 word-bounds each column name ((?<![A-Za-z0-9]) ... (?![A-Za-z0-9])) so that `Already → Done` is not read as the column `Ready`. This is how the plan's 'matched whole' truth is met"
  - "The IN-02 case that pinned 'a prose arrow adds no finding' was split. Its no-arrow-span half is kept and its prose half is reversed on purpose (WR-02)"
  - "Overlapping prose chains (`A → B → C`) give one finding for the first match. One finding is enough to make the gate red, and the canonical span is the only fix"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "A board move written as an ASCII-arrow code span (`In Development -> Done`, `=> `) is one rule 6 finding naming the role, the span and WR-02, and the CLI exits 1"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): `In Development -> Done` planted into software-engineer.md is red naming the span"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): `In Development => Done` planted into software-engineer.md is red naming the span"
        status: pass
    human_judgment: false
  - id: D2
    description: "A prose move between two board columns around →, -> or => outside a code span is a rule 6 finding. A non-column prose arrow and a no-arrow span add none. Columns are matched whole and longest first"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): an arrow in prose between two board columns is red"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): the prose move \"You own In Development → Done when the change is small.\" planted into software-engineer.md is red"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): a prose arrow between words that are not both board columns adds no finding"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (WR-02): column names are matched whole and longest first"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition rule 6 (IN-02): a span with no arrow adds no finding"
        status: pass
    human_judgment: false
  - id: D3
    description: "The live tree stays green: 18 claimed pairs, 0 findings over 19/19, no rule 6 line. The baseline JSON and agent-factory/ are byte-unchanged"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "node scripts/check-role-rules.js && git diff --quiet HEAD -- docs/audit/40-role-rule-inventory.json agent-factory/"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#partition green control: the live mirror passes and prints the claimed pair count"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every derived fact in the committed baseline and in deriveAll(ROOT) is a FACT_KINDS kind, and the matcher refuses an unknown kind"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#kind floor (IN-02): kindOf matches an exact kind and a prefix kind, and refuses an unknown kind"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#kind floor (IN-02): every fact in the committed baseline is a FACT_KINDS kind"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#kind floor (IN-02): every fact in deriveAll(ROOT) is a FACT_KINDS kind"
        status: pass
    human_judgment: false
  - id: D5
    description: "The header and doc comments describe the guard as it is: six rules, two declared lists, and the FACT_KINDS subset test"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "grep -c 'five rules' / 'five partition rules' = 0; grep -c 'six rules' = 1 in scripts/check-role-rules.ts"
        status: pass
    human_judgment: true
    rationale: "Grep proves the stale phrases are gone. Whether the new comments read accurately and plainly is a reading judgment"

duration: 27min
completed: 2026-11-02
status: complete
---

# Phase 40 Plan 18: Board-move spelling guard (WR-02) and partition header (IN-02) Summary

**Rule 6 of the board-move partition now reports a move written with `->` or `=>` in a code span, and a move between two seed-board columns written outside a code span. So `In Development -> Done` can no longer get past rules 4 and 6 unread. The header now says six rules and two declared lists, and a test holds every derived fact inside FACT_KINDS.**

## Performance

- **Duration:** 27 min (the full-suite run accounts for most of it)
- **Started:** 2026-11-02T21:30:23Z
- **Completed:** 2026-11-02T21:57:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `moveSpanFindings` (rule 6) has three arms. (a) A code span holding `->` or `=>` is one WR-02 finding, checked before the IN-02 test. (b) The IN-02 finding is unchanged. (c) With each code span blanked, an unfenced `## Board moves` line naming two board columns around `→`, `->` or `=>` is a WR-02 finding. The pattern is built from the `columns` argument; no column name is typed.
- The verifier's reproduction (`In Development -> Done` planted into software-engineer.md) is now a permanent red case through the CLI.
- `claimedPairs`, `deriveRoleFacts`, the baseline JSON, `BOARD_MOVE_EXCEPTIONS` and `D33_NON_FORWARD_PAIRS` are unchanged. No role file was edited.
- Header (THE BOARD-MOVE PARTITION), rule list, `moveSpanFindings` and `checkPartition` doc comments, and the FACT_KINDS comment now match the guard.
- A test-local `kindOf(fact)` matcher and two subset cases hold every fact in the baseline and in `deriveAll(ROOT)` inside FACT_KINDS.

## Task Commits

1. **Task 1 (tracer): ASCII-arrow and prose moves are rule 6 findings**
   - RED: `1ac8e736` (test)
   - GREEN: `e13f932d` (feat)
2. **Task 2 (tdd): six rules, two lists, every fact a declared kind**
   - tests: `b03dda86` (test)
   - comments: `1235baec` (docs)

## RED evidence (Task 1)

`npx vitest run scripts/check-role-rules.test.ts` against the unchanged committed `.js`: **68 tests, 6 failed, 62 passed**.

```
× partition rule 6 (WR-02): an arrow in prose between two board columns is red
× partition rule 6 (WR-02): `In Development -> Done` planted into software-engineer.md is red naming the span
× partition rule 6 (WR-02): `In Development => Done` planted into software-engineer.md is red naming the span
× partition rule 6 (WR-02): the prose move "You own In Development → Done when the change is small." planted into software-engineer.md is red
× partition rule 6 (WR-02): the prose move "In Development -> Done is the short path." planted into software-engineer.md is red
× partition rule 6 (WR-02): column names are matched whole and longest first
```

Semantic assessment: every failure is on the planned assertion. The five CLI cases fail with `expected +0 to be 1` on the gate's exit status: the plant ran and the gate passed it, which is exactly the WR-02 hole. The unit case fails with `expected [] to deeply equal [ Array(1) ]`, meaning no prose finding. No load, syntax or fixture fault. The two green-behaviour cases (no-arrow span, `input → output`) passed before the edit, as they should.

## Task 2 RED note

As the plan expects, the subset cases pass on today's data, so they have no failing RED run. The matcher case shows they can fail: `kindOf("made-up-kind")` is null, and a planted `made-up-kind` fact is reported. A scratch proof against the built module with `board-from:` dropped from FACT_KINDS in memory gives 14 unknown facts (for example `architect-design.md: board-from:In Design`), so the subset assertion turns red when a kind is missing.

## Live partition (after)

```
  INFO  board-move partition: 18 claimed pair(s) over 12 flow column(s), terminal Done, 4 declared exception(s), 2 approved non-forward pair(s)
  PASS  board-move partition: 0 findings over 19/19 elements
ALL CHECKS PASSED
```

`node scripts/check-role-rules.js | grep -c "rule 6"` prints 0.

## Test counts

| Run | Before | After |
|-----|--------|-------|
| `npx vitest run scripts/check-role-rules.test.ts` | 61 passed | 71 passed |
| `-t "WR-02"` | 0 | 7 passed |
| `-t "kind"` | 1 | 4 passed |
| `check-role-rules` + `check-diff-disposition` tests | n/a | 195 passed |
| Full suite (`--exclude '**/scripts/e2e/**'`, 1,373 s) | 21 known failures | 21 failed / 10,865 passed / 2 skipped. The same 21 known failures in the same 7 files (deferred-items.md), none new |

## Files Created/Modified

- `scripts/check-role-rules.ts`: rule 6 extended (WR-02); header, rule list and doc comments corrected (IN-02)
- `scripts/check-role-rules.js`: the committed build of the above (Task 2 changes it only in comments)
- `scripts/check-role-rules.test.ts`: IN-02 case split and its prose half reversed; WR-02 red cases; non-column and adjacency cases; `kindOf` matcher and the FACT_KINDS subset cases

## Decisions Made

- Column names are word-bounded as well as longest-first. Without the bounds, the case-insensitive pattern reads `Already → Done` as `Ready → Done`.
- The prose arm blanks code spans line by line, so a canonical `X → Y` span is never also a prose finding, and an ASCII-arrow span yields exactly one finding. Both are pinned.

## Deviations from Plan

None in the plan's scope. Small additions, all inside the plan's files:
- Task 1 has two commits (test, then feat) rather than one, so the RED run is recorded in git.
- A unit case was added for the adjacency truth ("matched whole and longest first"), which the behaviour list did not name directly.

**Total deviations:** 0 auto-fixed. **Impact:** none.

## Issues Encountered

None. The full suite shows the 21 failures already recorded in deferred-items.md (uat-gate-exit-contract 5, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, canonical-corpus 1, installer-fs-census 1, and the check-foundation-guards "LIVE COUNT is DERIVED" case 1). This plan adds no `.indexOf("# ...")` heading test, fence loop or `/^## /` regex, and `node scripts/check-foundation-guards.js` exits 0.

## Threat Flags

None. No new network, auth, file-access or schema surface. T-40-49 and T-40-50 are mitigated as planned (four planted red cases plus the reversed prose case; a non-column prose arrow stays green; live tree 0 findings).

## User Setup Required

None.

## Next Phase Readiness

WR-02 and IN-02 are closed. check-role-rules.js is still outside the admission hook's decider closure, which plan 40-21 adds, so no manifest was regenerated here. PLAIN-03's empty and adjacency edges are authored as truths and pinned by tests; per the plan's flagged assumption they stay `unresolved` until the verifier checks them.

## Self-Check: PASSED

- FOUND: scripts/check-role-rules.ts, scripts/check-role-rules.js, scripts/check-role-rules.test.ts
- FOUND commits: 1ac8e736, e13f932d, b03dda86, 1235baec (all ancestors of HEAD)
- Plan verification: build + typecheck OK; 195 tests passed; check-role-rules, check-diff-disposition, check-foundation-guards exit 0; freshness 89/89 fresh; baseline and voice-model unchanged
