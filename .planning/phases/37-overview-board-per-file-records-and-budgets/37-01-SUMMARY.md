---
phase: 37-overview-board-per-file-records-and-budgets
plan: 01
subsystem: state-layout
tags: [board-contract, budgets, layout-marker, state-layout, done-archive]

requires:
  - phase: 36-state-layout-authority-path-move-and-protection
    provides: install/state-layout.ts as the one constants-only path authority, STATE_ROOTS
provides:
  - D-14 (layout marker path and content) and D-15 (archived Done placement) recorded in 37-CONTEXT.md
  - agent-factory/contracts/board.md sections Overview and budgets, Budgets, The layout marker, Ticket body sections, The Done archive, and the trace index, NFR catalog and record-entry rules
  - BUDGETS, BUDGET_COUNT, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT and 16 new path constants in install/state-layout.ts
  - install/state-layout.test.ts tie between the contract's Budgets table and BUDGETS
  - 37-BASELINE.md, the 20 known failing tests at the starting commit
affects: [37-02, 37-03, 37-05, 37-11, 37-12, 37-13, 37-18, 37-19, 38]

actuals:
  tokens: 9483
  tasks: 3
  commits: 4
plan_head_before: f527ec3abe1fd9002122070eea22f40c55b9ec3c
plan_head_after: b879f7f046c553165bebc3f54c02c88bb7101099

tech-stack:
  added: []
  patterns:
    - "Contract table read at run time by its heading and compared to the constant object in both directions"
    - "Parent-plus-one-segment rule checked on the syntax tree of the authority, with a probe-source control"

key-files:
  created:
    - .planning/phases/37-overview-board-per-file-records-and-budgets/37-BASELINE.md
  modified:
    - .planning/phases/37-overview-board-per-file-records-and-budgets/37-CONTEXT.md
    - agent-factory/contracts/board.md
    - install/state-layout.ts
    - install/state-layout.js
    - install/state-layout.test.ts

key-decisions:
  - "D-14: the layout marker is memory-bank/plans/.layout holding layout: v3, with or without exactly one trailing newline, after BOM removal and CRLF folding (human answer option-a, 2026-10-22)"
  - "D-15: an archived Done ticket stays placed through a seventh reader source boardArchive and snapshot version 3; archive rows place for ticket-unplaced only, board plus archive is ticket-duplicated, an unreadable archive suppresses ticket-unplaced, conflict kinds stay seven (human answer option-a, 2026-10-22; plan 37-12 implements)"
  - "LAYOUT_MARKER_CONTENT is the version line without a line ending (layout: v3); a reader accepts it with or without one trailing newline, so a writer may write either"

patterns-established:
  - "Budget numbers have one spelling (BUDGETS in install/state-layout.ts); the contract table is checked against it by test"
  - "New state paths are template literals off a declared parent constant, one segment each; only four *_REL constants are literals"

requirements-completed: [SPLIT-01, SPLIT-04, SPLIT-07]

coverage:
  - id: D1
    description: "D-14 and D-15 recorded in 37-CONTEXT.md as single-colon bullets before any contract or code edit"
    requirement: SPLIT-01
    verification:
      - kind: other
        ref: "grep -c '^- \\*\\*D-14:\\*\\*' and '^- \\*\\*D-15:\\*\\*' 37-CONTEXT.md print 1 each; commit efadaf11 precedes f8ff84f2 and b879f7f0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Board contract states the overview rule, the budgets, the marker rule, the ticket body sections, the Done archive placement and the trace and NFR index rules; Bounds and snapshot version unchanged"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "npx vitest run scripts/board-model.test.ts scripts/board-tracer.test.ts"
        status: pass
      - kind: other
        ref: "node scripts/check-imperative-lexicon.js && node scripts/check-banned-claims.js && node scripts/check-claim-anchors.js && node scripts/check-state-paths.js"
        status: pass
      - kind: other
        ref: "plan 37-18 hand-trace scan over the lines added since b13a9d45: zero hits"
        status: pass
    human_judgment: false
  - id: D3
    description: "BUDGETS and BUDGET_COUNT, the marker constants and the record and archive paths exported from install/state-layout.ts, constants only"
    requirement: SPLIT-04
    verification:
      - kind: unit
        ref: "install/state-layout.test.ts#BUDGETS is pinned two-sided (D-10, SPLIT-04)"
        status: pass
      - kind: unit
        ref: "install/state-layout.test.ts#each subpath constant is its declared parent constant plus exactly one segment"
        status: pass
      - kind: unit
        ref: "install/state-layout.test.ts#its syntax tree holds no import, no function and no class"
        status: pass
    human_judgment: false
  - id: D4
    description: "The contract's Budgets table and BUDGETS agree in both directions, and the contract spells LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT and BOARD_DONE_ARCHIVE_REL verbatim"
    requirement: SPLIT-07
    verification:
      - kind: unit
        ref: "install/state-layout.test.ts#the board contract and the constants agree (D-04, D-05, D-07, D-10, D-14)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Ticket body sections (## Blocked, ## Board notes) stated with the closed eight-key set unchanged"
    requirement: SPLIT-07
    verification: []
    human_judgment: true
    rationale: "The section wording is prose in the contract; no test asserts its content yet (plans 37-14 to 37-18 rewrite the roles that write it)"
  - id: D6
    description: "37-BASELINE.md lists the Node version and the 20 failing tests at the starting commit"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1 at f527ec3a: 20 failed in 6 files, matching the list"
        status: pass
    human_judgment: false

duration: 42min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 01: Board contract, budgets and layout constants Summary

**The board contract now states the overview row rule, nine budgets, the `memory-bank/plans/.layout` marker, the ticket body sections and the `boardArchive` placement rule, and `install/state-layout.ts` exports the same numbers and paths. A test reads the contract's Budgets table and fails if the table and `BUDGETS` disagree.**

## Performance

- **Duration:** 42 min (about 30 of them were the one full-suite baseline run on one worker)
- **Started:** 2026-10-22T06:58:49Z
- **Completed:** 2026-10-22T07:40:28Z
- **Tasks:** 3 (Tasks 1 and 2 were already answered by the human, so no stop was needed; Task 3 is the tracer)
- **Files modified:** 6

## Accomplishments

- Recorded D-14 (marker `memory-bank/plans/.layout`, content `layout: v3`, with or without exactly one trailing newline, after BOM removal and CRLF folding) and D-15 (seventh source `boardArchive`, snapshot version 3) in 37-CONTEXT.md.
- Contract first: `## Overview and budgets` with `### Budgets` (a nine-row table) and `### The layout marker`, `### Ticket body sections`, `## The Done archive`, plus the trace index, NFR catalog and record-entry rules in `## Reconciliation and non-goals`. The Bounds section and the snapshot version (2) are unchanged.
- `install/state-layout.ts` went from 17 to 37 exported constants: BUDGETS, BUDGET_COUNT = 9, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT, CONTEXT_ARCHIVE_REL (D-03) and the NFR, trace, progress, decision, queue and archive paths. Each path is its declared parent constant plus exactly one segment. The file still has no imports.
- `install/state-layout.test.ts` has 60 passing tests. They cover the BUDGET_COUNT pin with mutated-copy controls, the parent rule on the syntax tree with a probe control, and the contract-table tie in both directions, with controls for a missing key, an extra row and a changed value. Unreadable table rows are refused, not skipped. The test also checks that the contract spells the marker path, the marker content and the Done archive path verbatim.
- 37-BASELINE.md records the 20 known failures at f527ec3a (Node v26.11.1).

## Task Commits

1. **Baseline (Task 3 step 0)**: `33177831` (docs)
2. **Tasks 1 and 2: record D-14 and D-15**: `efadaf11` (docs)
3. **Task 3 contract commit**: `f8ff84f2` (docs)
4. **Task 3 constants and tie test**: `b879f7f0` (feat)

**Plan metadata:** recorded in the docs(37-01) completion commit

## Files Created/Modified

- `.planning/phases/37-overview-board-per-file-records-and-budgets/37-BASELINE.md`: the known-failing test baseline.
- `.planning/phases/37-overview-board-per-file-records-and-budgets/37-CONTEXT.md`: D-14 and D-15 under `### Recorded at plan 37-01 checkpoints`.
- `agent-factory/contracts/board.md`: the new sections (137 lines added, none removed).
- `install/state-layout.ts`, `install/state-layout.js`: the new constants and the rewritten header sentence.
- `install/state-layout.test.ts`: the amended parent rule, the budget pin, and the contract tie.

## Decisions Made

- `LAYOUT_MARKER_CONTENT` is `"layout: v3"`, the version line without a line ending. D-14 counts the content as valid with or without one trailing newline, so the constant holds the line and the reader (plan 37-02's `markerState`) accepts either form. Plans 37-13 and 37-19 write "exactly LAYOUT_MARKER_CONTENT", which is a valid marker.
- The contract says an absent marker is not itself a finding. This matches plan 37-02 (Pitfall 9): absence only prints one informational line.
- The table's index-entry row names "the trace index and the NFR catalog" and spells their paths in the next sentence. This keeps every added line clear of the plan 37-18 hand-trace scan pattern.
- `STATE_ROOTS` was not rewritten to use the new `MEMORY_BANK_REL` and `GRUGOPS_DIR_REL` constants. A test now asserts that both are members.

## Deviations from Plan

### Auto-fixed Issues

None. Three small differences, all inside the plan's intent:

- **Extra commit for the baseline.** The plan names three commits. 37-BASELINE.md went into its own docs commit (`33177831`) before the D-14/D-15 commit. The contract commit still comes before the constants commit.
- **Baseline worker count.** The human's mid-run CPU override set one worker, so the baseline ran with `--maxWorkers=1` rather than `--maxWorkers=50%`. The baseline started after an unrelated vitest run from another project on this machine had finished.
- **Starting commit.** The orchestrator's `f527ec3a` (vitest capped at one worker) landed after this plan's ledger was first written. The ledger was reset to `f527ec3a`, so `commits: 4` counts only this plan's commits.

**Total deviations:** 0 auto-fixed. **Impact:** none on scope.

## Issues Encountered

- `HEAD b13a9d45` in the plan is an ancestor of the starting commit, so the hand-trace scan diff (`git diff b13a9d45 -- agent-factory/contracts/board.md`) contains only this plan's additions. Zero hits.

## Verification

- `npm run build`, `npm run typecheck`: exit 0.
- `npx vitest run install/state-layout.test.ts scripts/board-model.test.ts scripts/board-tracer.test.ts`: 60 + 265 passed. The related set (path-spelling-census, mode-census, check-state-paths, state-path-scan, check-foundation-guards, board-model, board-tracer, state-layout): 721 passed. Board readers and voice gates that read the contract (board-oracle, board-read, board-dashboard, board-corpus, check-imperative-lexicon, check-banned-claims, check-claim-anchors): 538 passed.
- `npm run freshness`: 79 committed .js files fresh.
- Gates `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-state-paths`, `check-foundation-guards`: all exit 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: exit 0.
- `git branch --show-current`: main. The full suite was not re-run (project rule: one baseline run only).

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-02 can import BUDGETS, LAYOUT_MARKER_REL and LAYOUT_MARKER_CONTENT and implement `markerState` with the D-14 normalizations.
- Plan 37-12 implements D-15: the seventh source, SCHEMA_VERSION 3 and the regenerated golden, in one commit. The contract's Staleness section still names six sources until then; the Done archive section says so.
- Plan 37-18 Task 2 still owns the rewording of the old "traceability matrix" sentence in Reconciliation. This plan did not touch that line.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
