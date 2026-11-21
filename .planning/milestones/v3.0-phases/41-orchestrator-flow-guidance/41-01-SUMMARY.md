---
phase: 41-orchestrator-flow-guidance
plan: 01
subsystem: queue
tags: [claim, queue, now-running, embed, dual-path-oracle, typescript]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: scripts/generate-runnable-embeds.ts and its refusals, which set the shape of scripts/claim.ts
provides:
  - claimPending and completeTask, the whole queue lifecycle in scripts/claim.ts, with the in-flight log emptying on done
  - optional agent and level lines in claim.md, and agent and level columns in now-running.md
  - claimOwnerRefusal, CLAIM_LEVELS, claimRecordFields, claimedCount, freeSlots, QUEUE_DEFAULTS, parseQueueConfig, subtaskRefFolder, noteSinceClaim and sweepQueue for the CLI in plans 41-03 and 41-05
  - a dual-path oracle and convergence spine on the claim-at-dispatch shape
affects: [41-03, 41-05, workflow-17, claim-cli, freshness-queue]

actuals:
  tokens: 27686
  tasks: 3
  commits: 5
plan_head_before: 6d05da1f004de07b18797780fcb145d3fc15294b
plan_head_after: 0ee62e3b7acbac40e36a05416f927b9ec250f482

tech-stack:
  added: []
  patterns:
    - "Queue entries are asked by lstat through queueEntry; a claim record is read only through readClaimRecord"
    - "A claim record has one reading, claimRecordFields, shared by the render and the sweep"
    - "Mutators do not render; the calling program renders after each one (D-02)"

key-files:
  created:
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md
  modified:
    - scripts/claim.ts
    - scripts/claim.js
    - scripts/claim.test.ts
    - scripts/now-running-freshness.test.ts
    - scripts/config-queue-consistency.test.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/convergence-spine.test.ts

key-decisions:
  - "queueEntry treats ENOTDIR as nothing there, as well as ENOENT, because a keeper file in claimed/ gives ENOTDIR for claimed/.gitkeep/claim.md"
  - "claimPending turns a real failure from the claim step or the rename into a refusal and removes its own claim directory; only a bad task name throws"
  - "subtaskRefFolder counts every ref: line, so a good line beside a bad one is refused"
  - "claimRecordFields stops a value at its own line, so an empty by: no longer reads the next line as its value"

patterns-established:
  - "Keeper rule in the library: a dot-named regular file in claimed/ is no claim; every other entry counts"

requirements-completed: [RUN-01, RUN-02, RUN-05, RUN-06]

coverage:
  - id: D1
    description: "One subtask goes pending, claimed, done through claimPending and completeTask, and the in-flight log empties"
    requirement: RUN-01
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#claim.js — completeTask: done releases the claim (RUN-01, Pitfall 1)"
        status: pass
      - kind: unit
        ref: "scripts/now-running-freshness.test.ts#after the last completeTask the render holds its table header and no data row"
        status: pass
    human_judgment: false
  - id: D2
    description: "A lost race reads as lost, a real failure as a refusal, and a level or owner outside the rule is refused before any directory exists"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#claim.js — claimPending: one call claims and moves the subtask (RUN-01, D-04)"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#claim.js — claimOwnerRefusal: the Orchestrator never owns a claim (D-13, T-41-04)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The free count, the config read, the ref read, the note comparison and the sweep release, each with a unit case per named edge"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/claim.test.ts scripts/config-queue-consistency.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The library can be embedded: the claim row derives with no refusal on a scratch copy"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "scratch copy with the 41-03 claim row: node scripts/generate-runnable-embeds.js, then npx tsc --noEmit (557 lines, no import.meta, one atomicWrite, one cell)"
        status: pass
    human_judgment: false
  - id: D5
    description: "claim.md carries agent and level with the tamper rule and the by newline guard unchanged, and a link or FIFO at claim.md is never opened"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#claim.js — the record carries agent and level (D-03, D-30, T-41-01)"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#claim.js — queue entries are asked by lstat, never opened blind (T-41-03)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both dispatch paths end with an empty claimed/ and the same header-only render, and the oracle goes red if done stops releasing the claim"
    requirement: RUN-01
    verification:
      - kind: integration
        ref: "node scripts/check-uat-oracles.js"
        status: pass
      - kind: unit
        ref: "scripts/convergence-spine.test.ts#parallel-spawn and sequential-drain replays produce order-independent identical substrate"
        status: pass
    human_judgment: false

duration: 12 min
completed: 2026-11-04
status: complete
---

# Phase 41 Plan 01: Queue Lifecycle Authority Summary

**`scripts/claim.ts` now takes a subtask from pending through claimed to done and releases the claim, so `now-running.md` empties; it also holds every rule the CLI needs and embeds into a host program with no generator refusal.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-04T21:54:38Z
- **Completed:** 2026-11-04T22:06:30Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `claimPending` makes the claim directory first and then moves the subtask, so a second claimant reads `lost`, never a refusal. `completeTask` moves the subtask to `done/` and removes `claimed/TASK/`.
- Every existence test in `scripts/claim.ts` is gone. An lstat asks first, so a FIFO or a link at `claim.md` is never opened.
- The record gained optional `agent:` and `level:` lines. Old records still render and sweep, and a multi-`at` record is still skipped by the render and reclaimed by the sweep.
- The two embed hazards are gone. On a scratch copy, the claim row from plan 41-03 derived with no refusal, and the result compiled.
- The dual-path oracle and the convergence spine run the claim-at-dispatch shape, and both assert an empty `claimed/` and a byte-identical header-only render.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `2893934c` test(41-01): add failing cases for the queue lifecycle
   - `d129d088` feat(41-01): take a subtask through the whole queue lifecycle
2. **Task 2: The record, the owner rule, the free count, the config read and the sweep release**
   - `905afd63` test(41-01): add failing cases for the record, owner rule, free count and sweep
   - `853c314c` feat(41-01): add the record fields and every rule the CLI needs
3. **Task 3: The dual-path oracle and the convergence spine**
   - `0ee62e3b` feat(41-01): run the dual-path oracle and the spine on claim at dispatch

**Plan metadata:** the `docs(41-01)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `the task-name pattern equals the one in scripts/context-io.ts, read as text`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on its planned assertion, `expected undefined to be '^[A-Za-z0-9._-]+$'`, because the export did not exist. In the full RED run of the two test files, 15 other new cases failed too, most with `claimPending is not a function`.
- **Task 2 RED:** the target was `claimTask refuses a newline in agent or level, so neither can smuggle an at line`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on its planned `toThrow`, because `claimTask` took no fields yet.
- **GREEN:** both tasks passed their `<verify>` commands. The tracer gate re-ran the Task 1 verify, and it passed before Task 2 started (interactive, `end-of-phase`, automated-only verify, so no checkpoint).
- **REFACTOR:** none as a separate commit.

## Mutation Run (Task 3 acceptance)

A temporary edit to `scripts/claim.js` made `completeTask` skip the directory removal.

- `node scripts/check-uat-oracles.js` exited 1 with `FAIL dual-path equivalence violation:` and `claimed/ is not empty after the last done: A=["t1","t2","t3"] B=["t1","t2","t3"]`.
- `scripts/convergence-spine.test.ts` failed one case.
- The edit was reverted with `git checkout -- scripts/claim.js`. The oracle then exited 0.

## Plan Verification

- `npm run build && npm run typecheck`: pass.
- The four named vitest files: pass. `scripts/claim.test.ts` holds the new cases, and the last combined run of the first three files was 116 passed.
- `node scripts/check-uat-oracles.js`: exit 0, with the dual-path PASS line.
- `npm run freshness:queue`: exit 0. This is a vacuous pass, because this repository has no `.grugops/queue/claimed/` tree. The header change is proven by `scripts/now-running-freshness.test.ts`.
- `npm run freshness`: exit 0, 89 committed `.js` files match a rebuild.
- `git diff --quiet 3fbe37fb -- scripts/context-io.ts`: exit 0.

The board-reader case the plan offers as a choice was added as a new case: `the board reader takes a record with agent and level lines as one row (D-30)` in `scripts/claim.test.ts`.

## Files Created/Modified

- `scripts/claim.ts`, `scripts/claim.js` - the queue authority and its committed build
- `scripts/claim.test.ts` - unit cases for the lifecycle, the record and each rule
- `scripts/now-running-freshness.test.ts` - the moved header pin, the new columns, row order and the emptying log
- `scripts/config-queue-consistency.test.ts` - the `QUEUE_DEFAULTS` binding
- `scripts/check-uat-oracles.ts`, `scripts/check-uat-oracles.js` - the dual-path oracle on the new shape
- `scripts/convergence-spine.test.ts` - the spine on the new shape
- `.planning/phases/41-orchestrator-flow-guidance/deferred-items.md` - two out-of-scope test results

## Decisions Made

- `claimPending` gets its `at` from a private `takeClaim`, which `claimTask` also wraps. The plan says to call `claimTask`, which returns only a boolean. The order the plan sets is unchanged.
- `isSafeQueueName` holds the allowlist check once, because the check now has six callers.
- The note text for invalid JSON is `queue.KEY not read, the config is not valid JSON, default N`. The plan fixed the other two wordings and left this one open.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `queueEntry` also returns null on ENOTDIR**
- **Found during:** Task 1
- **Issue:** the plan says null on ENOENT and rethrow the rest. `claimed/.gitkeep` passes the task-name allowlist, so `claimed/.gitkeep/claim.md` gives ENOTDIR, and the render and the sweep would throw in any repository that keeps a keeper there. `existsSync` hid this.
- **Fix:** ENOTDIR reads as nothing there, as `claimedQueueRefusal` in `install/install.ts` already does. Added the case `a keeper file in claimed/ is no claim`.
- **Files modified:** `scripts/claim.ts`, `scripts/claim.test.ts`
- **Committed in:** `d129d088`

**2. [Rule 1 - Bug] A claim record value stops at its own line**
- **Found during:** Task 2
- **Issue:** the old `^by:\s*(.+)$` lets `\s` cross a newline, so an empty `by:` read the next line as its value, and an empty `at:` read `task: ...` as a timestamp.
- **Fix:** `claimRecordFields` uses `[ \t]*`. An empty `at:` is now `no-at`.
- **Files modified:** `scripts/claim.ts`, `scripts/claim.test.ts`
- **Committed in:** `853c314c`

**3. [Rule 2 - Missing critical] A claim failure of any kind rolls back**
- **Found during:** Task 1
- **Issue:** the plan rolls back on ENOENT from the rename only. Any other rename failure would have left an empty claim holding a slot, and must-have "a real failure is a refusal" also covers a throw from the claim step.
- **Fix:** every failure of the claim step or the rename returns `refused`, and a failed rename removes the claim directory. A bad task name still throws, as the plan orders. The CLI contract in plan 41-03 gives exit 2 to both.
- **Files modified:** `scripts/claim.ts`, `scripts/claim.test.ts`
- **Committed in:** `d129d088`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** all three are correctness fixes inside `scripts/claim.ts`, with no change of scope.

## Issues Encountered

- **The pin guard ran late.** The `<project_root_pin>` guard ran first just before the Task 1 RED commit, after the first test edits, not before them as ordered. It passed, and the edits were in the pinned checkout. It ran before every later edit batch and every commit.
- **A RED commit preceded its evidence.** The Task 2 `test(41-01)` commit landed while the classifier still said `INVALID_RED`, because one chained command did not stop on the verdict. The cause was the report, not the test: a multi-line `expected` value makes vitest's TAP malformed. The record was redone on a one-line target and returned `RED_EVIDENCE_OK` before any GREEN edit. Task 1 met the same report problem and was re-recorded before its commit.
- **Two test files outside this plan are not green here.** See `deferred-items.md`. Of the eight test files that name the queue, six passed. `scripts/context-io-writer-set.test.ts` fails two cases on a file archived long before this plan. `scripts/worktree-dogfood.test.ts` did not run, because `git worktree add` failed in setup, so its cases are unverified in this session. The full suite was not run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans 41-03 and 41-05 can build on the library. Requirements RUN-01, RUN-02, RUN-05 and RUN-06 stay open for now: `requirements.ready-ids` blocks all four, because sibling plans declare them too. RUN-05 ships only with plan 41-03.

## Self-Check: PASSED

All eight modified files exist, and all five task commits are ancestors of HEAD (`git rev-list` and `check evaluation-scope` both list them).

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-04*
