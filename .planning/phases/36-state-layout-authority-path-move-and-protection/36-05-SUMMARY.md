---
phase: "36"
plan: "05"
subsystem: testing
tags: [state-layout, board, dashboard, board-model, fixed-subpaths, vitest]

requires:
  - phase: 36
    provides: "install/state-layout.ts (STATE_ROOT_REL, LEGACY_STATE_ROOT_REL) and scripts/state-path-scan.js from plan 36-01; the FIXED_SUBPATHS conversion pattern from plan 36-04"
provides:
  - "board-dashboard and board-model tests that plant, read and expect every state path through FIXED_SUBPATHS from scripts/board-read.js"
  - "board-model conflict-message expectations built from FIXED_SUBPATHS.tickets, so plan 36-06 flips the model's message prefix and the table together"
  - "The context-io no-board-move check asserts that neither STATE_ROOT_REL nor LEGACY_STATE_ROOT_REL exists under the governance root"
  - "Path-agnostic example strings in posix-path, voice-model, capture-live and uat-spec-integrity use the memory-bank/plans spelling"
affects: [36-06, 36-14]

actuals:
  tokens: 9400
  tasks: 2
  commits: 2
plan_head_before: c48ce35d0df5e4c51b68f1e90524cfe92b31ccf2
plan_head_after: ca3c43517b59207d25d3c239a3b217a9fc1943a2

tech-stack:
  added: []
  patterns:
    - "A conflict-message expectation is a template literal that starts with ${FIXED_SUBPATHS.tickets}/<id>.md, so the expectation moves when the table moves"
    - "A scratch tree that plants a board creates posix.dirname(FIXED_SUBPATHS.board) with recursive: true as well as the ticket directory"
    - "A mixed-separator sample spells the whole state root with backslashes (memory-bank\\plans\\tickets/ABC.md); a sample that mixes the two inside the root (memory-bank\\plans/...) reads to the scan as a pre-v3 plans/ root"

key-files:
  created: []
  modified:
    - scripts/board-dashboard.test.ts
    - scripts/board-model.test.ts
    - scripts/posix-path.ts
    - scripts/posix-path.js
    - scripts/posix-path.test.ts
    - scripts/voice-model.test.ts
    - scripts/capture-live.test.ts
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/context-io.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "board-model's location-token cases build the backslash board path as FIXED_SUBPATHS.board.split('/').join('\\\\'), so the case keeps its shape (a bare path value under the win32 separator) for any table value"
  - "Mixed-separator samples keep tickets in the path (memory-bank\\plans\\tickets/ABC.md) so every backslash sits inside the state root; the scan flags memory-bank\\plans/ABC.md as a pre-v3 plans/ site"
  - "Comments that named a state path by its pre-v3 spelling now name the artifact (the board file, the ticket file, the repository traceability file) rather than a v3 path, so they do not need a second edit in plan 36-06"

patterns-established:
  - "Expand-then-flip: every board test reaches state paths through FIXED_SUBPATHS while the table still holds its pre-v3 values, so plan 36-06 changes the table, the model's message prefix, the fixture and the repository, and no test spelling"

requirements-completed: []

coverage:
  - id: D1
    description: "board-dashboard and board-model tests reach every planted, read and expected state path through FIXED_SUBPATHS; conflict-message expectations build the ticket path from FIXED_SUBPATHS.tickets"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/board-dashboard.test.ts scripts/board-model.test.ts (80 + 181 = 261 passed; 261 at c48ce35d before the edit)"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js scripts/board-dashboard.test.ts scripts/board-model.test.ts (exit 0, zero sites; 57 at c48ce35d)"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- scripts/fixtures/board-snapshot/expected-snapshot.json (exit 0; golden case passed unregenerated)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Path-agnostic example strings use the memory-bank/plans spelling and posix-path.ts's comment example names no pre-v3 path"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/posix-path.test.ts scripts/voice-model.test.ts scripts/capture-live.test.ts scripts/runnable-ref/uat-spec-integrity.test.ts scripts/check-foundation-guards.test.ts (all passed)"
        status: pass
      - kind: other
        ref: "npm run freshness (exit 0, 78 committed .js files fresh)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The context-io no-board-move case asserts neither STATE_ROOT_REL nor LEGACY_STATE_ROOT_REL exists under the governance root"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/context-io.test.ts -t 'NO BOARD MOVE' (1 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No production board module changed, and the scan over every file in plans 36-04 and 36-05 files_modified is clean"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "git diff --name-only c48ce35d0df5e4c51b68f1e90524cfe92b31ccf2..HEAD -- scripts/board-read.ts scripts/board-model.ts scripts/board-dashboard.ts (exit 0, empty output)"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js over the 15 files of plans 36-04 and 36-05 (exit 0, zero sites and zero legacy paths)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 05: Dashboard and model tests follow the reader's path table; examples take the v3 spelling Summary

**The board-dashboard and board-model tests now reach every state path through `FIXED_SUBPATHS`, and board-model's conflict-message expectations build the ticket path from `FIXED_SUBPATHS.tickets`. All 261 cases pass, the same count as before, and the golden snapshot passed without being regenerated. The path-agnostic sample strings in five other files now use the `memory-bank/plans` spelling. The state-path scan over every file that plans 36-04 and 36-05 touched reports zero sites.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-21T07:54:52Z
- **Completed:** 2026-10-21T08:06:18Z
- **Tasks:** 2 (Task 1 a tracer)
- **Files modified:** 10

## Accomplishments

- **Dashboard (Task 1).** All 20 sites are converted:
  - Every board and ticket plant and read is `join(dir, FIXED_SUBPATHS.board)` or `join(dir, FIXED_SUBPATHS.tickets, …)`. This covers the remove and touch timers, `plantFirstLine`, the C1 and control-character copies, and the F-14 reproduction.
  - The F-14 `row-without-file` expectation starts with `${FIXED_SUBPATHS.tickets}/ABC-901.md`.
  - Three comments now name "the board file" or "the ticket file" instead of a path.
- **Model (Task 1).** All 37 sites are converted:
  - `REAL_DOCS`, the PREMISE message and the kit-board read use `FIXED_SUBPATHS.board` and `.traceability`.
  - Every conflict-message and `expected` assertion is a template literal starting with `${FIXED_SUBPATHS.tickets}/`. That covers the presence sentences, the `PRESENCE_AUDIT` `before` column and the F-14 case.
  - The location-token projector cases build both the backslash and the forward form from `FIXED_SUBPATHS.board`.
  - `withTicketTree` creates the board's state directory with `recursive: true`, then the ticket directory.
- **Examples (Task 2).**
  - posix-path.test.ts (8 sites), voice-model.test.ts:863, capture-live.test.ts:156 and uat-spec-integrity.test.ts:11437 use `memory-bank/plans/…` and `memory-bank\plans\…` forms. Each case keeps its shape: mixed, pure-backslash, drive-absolute or POSIX.
  - The comment example in `scripts/posix-path.ts` changed. `posix-path.js` was rebuilt and only that comment changed.
- **No-board-move (Task 2).** The context-io promotion case imports `STATE_ROOT_REL` and `LEGACY_STATE_ROOT_REL` from `../install/state-layout.js`. It asserts that neither exists under the governance root, so the case was strengthened rather than loosened.
- **Guards comments (Task 2).** Three comments in check-foundation-guards.test.ts now name the repository ticket files, the repository board and the repository traceability file.

## Task Commits

1. **Task 1 (tracer): the dashboard and model tests reach every state path through FIXED_SUBPATHS**: `a2d755ed` (test). Tracer gate: interactive mode, `end-of-phase`, automated-only verify. Typecheck, both files (261 of 261) and the scan were re-run and passed before Task 2 (`Tracer verified end-to-end — expanding`).
2. **Task 2: path-agnostic examples take the memory-bank/plans spelling, and no-board-move covers both layouts**: `ca3c4351` (test)

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Acceptance evidence

START recorded before Task 1: `c48ce35d0df5e4c51b68f1e90524cfe92b31ccf2`.

| Check | Baseline at c48ce35d | After |
|-------|----------------------|-------|
| scan, board-dashboard.test.ts | 20 sites | 0 |
| scan, board-model.test.ts | 37 sites (plan said 38) | 0 |
| vitest cases, board-dashboard / board-model | 80 / 181 (261 run together at the START version of both files) | 80 / 181 |
| `git diff --exit-code -- scripts/fixtures/board-snapshot/expected-snapshot.json` | n/a | exit 0 (golden passed unregenerated) |
| scan, the 8 Task 2 files | 19 sites | 0 |
| scan, all 15 files in plans 36-04 and 36-05 files_modified | n/a | exit 0, "PASS: 15 file(s) scanned, zero sites and zero legacy paths" |
| `npx vitest run scripts/runnable-ref/uat-spec-integrity.test.ts scripts/check-foundation-guards.test.ts` | n/a | exit 0, 708 of 708 |
| `git diff --name-only c48ce35d0df5e4c51b68f1e90524cfe92b31ccf2..HEAD -- scripts/board-read.ts scripts/board-model.ts scripts/board-dashboard.ts` | n/a | exit 0, empty output |

How the baseline case count was taken: the two edited test files were copied to the scratchpad, the START versions were written back with `git show HEAD:<file>`, vitest ran them (261 passed), and the edited copies were restored. No `git stash` was used.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The first spelling of the mixed-separator samples still failed the scan**
- **Found during:** Task 2
- **Issue:** The first form, `memory-bank\plans/ABC.md` (one backslash, then a slash, the same shape as the old `plans\tickets/ABC.md`), was counted by `state-path-scan` as a `plans/` site in posix-path.ts, posix-path.js, posix-path.test.ts and uat-spec-integrity.test.ts.
- **Fix:** The samples became `memory-bank\plans\tickets/ABC.md`. The state root is spelled entirely with backslashes and the forward slash comes after it, so the sample is still mixed. For consistency, the other posix-path.test.ts samples keep `tickets` as well.
- **Files modified:** scripts/posix-path.ts, scripts/posix-path.js, scripts/posix-path.test.ts, scripts/runnable-ref/uat-spec-integrity.test.ts
- **Committed in:** ca3c4351

---

**Total deviations:** 1 auto-fixed (1 blocking). **Impact on plan:** no scope creep, and no case changed what it asserts.

## Issues Encountered

- **The model baseline was 37 sites, not the 38 the plan stated.** The scan at START listed 37 sites in board-model.test.ts (36 slash and 1 backslash); line 1830 carried two of them. All 37 are converted.
- **Pre-existing failures, all already in deferred-items.md.**
  - In context-io.test.ts, 7 cases failed in the targeted run: 31-23 PROBE 5 and the six 31-29 register cases. They read the absent `31-CONTEXT.md` and `31-22-SUMMARY.md`.
  - In context-io-writer-set.test.ts, 2 cases failed, because `31-CONTEXT.md` is absent.
  - These are the same 7 and 2 recorded for plan 36-01. The case this plan changed, NO BOARD MOVE, passes.
- **Targeted runs only, per the project rules; no full suite was run.**
  - 18 files ran together, with 1718 of 1720 passing (the 2 failures are the context-io-writer-set cases above). The files were: the plan's eight board verification files, board-oracle, validate, freshness, check-nul-bytes, check-uat-oracles, install/mode-census, context-io-writer-set, check-kit-refs, floor-invariance and frontmatter. Each of these names or reads a file this plan changed.
  - posix-path, voice-model, capture-live and context-io ran together: 811 of 818 passed (the 7 failures are the context-io cases above).

## Plan-level verification

1. `npx vitest run` over the eight board files (tracer, corpus, read, watch, watch-live, dashboard, model, readonly): all passed, inside the 18-file run above.
2. `npm run freshness`: exit 0 after both commits ("All build outputs fresh: 78 committed .js file(s) match a rebuild of their sources").
3. `node scripts/check-nul-bytes.js` and `node scripts/check-uat-oracles.js`: each exit 0. `node scripts/check-foundation-guards.js` and `node scripts/check-platform-shapes.js` also exit 0.
4. `git branch --show-current`: `main`.

## User Setup Required

None.

## Next Phase Readiness

- Ready for 36-06. It flips `FIXED_SUBPATHS`, routes the `plans/tickets/` sentences in `scripts/board-model.ts` (lines 1467-1478 and 1750) through the table, moves `scripts/fixtures/board-snapshot` and the repository state, and regenerates the golden. After the flip, the board-model expectations built from `FIXED_SUBPATHS.tickets` agree with the model only if its message prefix moves too.
- LAYOUT-02 spans plans 01 to 14 and stays In Progress. It is not marked complete here.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: scripts/board-dashboard.test.ts, scripts/board-model.test.ts, scripts/posix-path.ts, scripts/posix-path.js, scripts/posix-path.test.ts, scripts/voice-model.test.ts, scripts/capture-live.test.ts, scripts/runnable-ref/uat-spec-integrity.test.ts, scripts/context-io.test.ts, scripts/check-foundation-guards.test.ts
- FOUND commits: a2d755ed, ca3c4351
