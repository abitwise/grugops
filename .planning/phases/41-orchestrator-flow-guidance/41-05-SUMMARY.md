---
phase: 41-orchestrator-flow-guidance
plan: 05
subsystem: queue
tags: [claim, free, sweep, read-1, exit-contract, fault-injection, typescript]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: plan 41-03's tools/grugops/claim.js and the embedded parseQueueConfig, claimedCount, freeSlots and sweepQueue
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: scripts/fault-inject.test-support.ts and the READ-1 and EXIT-1 rules
provides:
  - "`free`: queue.wip_limit minus the claimed/ count from disk, exact or refused"
  - "`sweep`: reclaims stale claims, releases finished ones, renders the log, and refuses a symbolic link under claimed/"
  - claim.js rows in the exit contract test
  - scripts/runnable-ref/claim-read-sites.test.ts, READ-1 over all 55 derived (site, via) pairs of claim.js
affects: [41-06, workflow-17, claim-cli, orchestrator-role]

actuals:
  tokens: 20168
  tasks: 3
  commits: 9
plan_head_before: 9177c630ef9e6a4d9566b3bf440d42107524619b
plan_head_after: 7918e2d1c6dd3488e6f9bd06cf66dc21d22753df

tech-stack:
  added: []
  patterns:
    - "A message that follows a queue change is set before the render starts, so a stop in the render names the change and says the log is behind it"
    - "A function that asks a question twice judges the last answer, and refuses a failed first answer before it asks again"
    - "A read-site test derives every pair and runs each in every mode, so no hand table is needed"

key-files:
  created:
    - scripts/runnable-ref/claim-read-sites.test.ts
  modified:
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/claim.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/context-io.test.ts
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md

key-decisions:
  - "readQueueConfig reuses recordTextOrNull, which already asks the root-chain owner, refuses every non-file position before any open, and reads under a ceiling"
  - "sweep reads the config first, so a config it cannot read stops it before anything moves"
  - "sweep says `may have moved tasks` before sweepQueue runs, because that function reports only at the end and a throw from it can leave moves this program cannot list"
  - "A symbolic link under claimed/ stops the whole sweep, by name, rather than being skipped: T-41-08 says a link is refused with nothing written"
  - "The claimPending write-failure bug stays deferred: it needs a change to the generated region, which this plan holds unchanged"

patterns-established:
  - "A new reader of the config moves CONFIG_PATH_SITE_COUNT in scripts/context-io.test.ts, and the history line must answer whether it is a second governance reader"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "free prints the limit minus the claimed/ count at every boundary, and writes nothing"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#free (RUN-02, D-01, D-08)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A missing config, key or malformed value falls back to the default and the line says so; a FIFO, a link or a directory at the config path is exit 2"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#a FIFO at the config path exits 2 and never hangs (T-41-19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "sweep reclaims, releases and leaves a fresh claim, reads queue.stale_ttl_minutes, and renders the log"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#sweep (RUN-02, D-02, D-08, D-11)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A symbolic link under claimed/ stops the sweep before anything moves, and nothing outside the root changes"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#a symbolic link under claimed/ stops it before anything moves, and nothing outside the root is touched (T-41-08)"
        status: pass
    human_judgment: false
  - id: D5
    description: "An escaped throw is exit 2 with one Error line, and a stop after a claim, a finish or a sweep names the change and says the log was not rendered"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: claim.js, an unexpected throw past every inner catch is exit 2, and no message denies a change (plan 41-05)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every derived read site of claim.js, failed with EIO, ends non-zero with no success line; the 55 pairs are all reached and UNREACHED is empty"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim-read-sites.test.ts#READ-1 on claim.js: every derived pair, failed, is never a pass (plan 41-05, RUN-02, T-41-22)"
        status: pass
    human_judgment: false
  - id: D7
    description: "claim.js holds no existence test, and every node:fs name it uses is classified, with FS_OTHER_FNS unchanged"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/claim-read-sites.test.ts#READ-1 on claim.js: the derivation (plan 41-05, T-41-22)"
        status: pass
    human_judgment: false

duration: 40 min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 05: free, sweep and the Read Rules for claim.js Summary

**`claim.js` now prints a `free` number that is exact or refused, reclaims stale work with `sweep`, and is held to the read and exit rules: all 55 derived read pairs, failed, end non-zero with no success line.**

## Performance

- **Duration:** 40 min, of which about 18 was the full suite
- **Started:** 2026-11-05T01:20:36Z
- **Completed:** 2026-11-05T02:00:37Z
- **Tasks:** 3
- **Files modified:** 6 in the task commits

## Accomplishments

- `free` prints `free N` from `queue.wip_limit` and the `claimed/` count on disk. It shows an over-spawn, names any fallback and writes nothing.
- `sweep` reclaims stale claims, releases finished ones, renders the log and prints one line per task in name order.
- A stop after a queue change now names that change and says when `now-running.md` was not rendered. A stop at stdout after a good render does not say the log is behind.
- The derived read test found a real failure on its first run: `claim` printed a success line after a failed read. That is fixed.
- A symbolic link under `claimed/` no longer lets `sweep` move a file from outside the repository into `pending/`.
- `scripts/fault-inject.test-support.ts`, `scripts/claim.ts` and the generator have no diff, so the three generated regions stayed as they were.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `eb1b82bb` test(41-05): add failing cases for free and sweep
   - `d3b9b0d4` feat(41-05): add free and sweep to the host queue tool
2. **Task 2: The exit contract**
   - `92744d03` test(41-05): add the exit contract rows for claim.js
   - `86e42103` feat(41-05): say when a change stands and the log was not rendered
3. **Task 3: READ-1 covers claim.js**
   - `bb04c43e` test(41-05): hold every derived read site of claim.js to READ-1
   - `7688b802` feat(41-05): refuse a failed first ask of a queue directory
   - `44ce45cd` test(41-05): add a failing case for a symbolic link under claimed/
   - `c7e0c9b5` feat(41-05): refuse a symbolic link under claimed/ before a sweep moves anything
   - `7918e2d1` test(41-05): count claim.ts as a config-resolving site, and say why it is no governance reader

**Plan metadata:** the `docs(41-05)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `with limit 3 and 2 claimed it prints free 1`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on `expected 2 to be +0`, because the program had no `free` command. A first record over the whole file returned `INVALID_RED`, because a multi-line actual value breaks vitest's TAP, so the record was taken again on the target alone.
- **Task 2 RED:** the target was `claim: an EIO at the render's rename after a won claim says the claim stands and the log was not rendered`. `RED_EVIDENCE_OK`. Semantic assessment: the fault fired, exit 2 and the claim line held, and the target failed on the planned `was not rendered` clause. The assertion message was made single-line so the report would parse.
- **Task 3 RED, first:** the target was `rootChainPresence:lstatSync#0 via ensureQueueDirs#0`. `RED_EVIDENCE_OK`. Semantic assessment: the fault fired and the run ended exit 0 with `claimed t1 by grugops-qe-e2e`, which is the failure READ-1 exists to catch.
- **Task 3 RED, second:** the target was `a symbolic link under claimed/ stops it before anything moves, and nothing outside the root is touched (T-41-08)`. `RED_EVIDENCE_OK`. Semantic assessment: the target failed on `expected 0 to be 2`, because the sweep followed the link. A plain status line was added ahead of `expectRefused` so the report would parse.
- **GREEN:** each task passed its `<verify>` commands.
- **Tracer gate:** interactive, `end-of-phase`, automated-only verify, so no checkpoint. The Task 1 verify was re-run after its commit, and `free` and `sweep` were run on a host copy. Both passed before Task 2 started.
- **REFACTOR:** none as a separate commit.

## Plan Verification

Run at `7918e2d1`:

- `npm run build && npm run typecheck`: pass.
- `npx vitest run` on `claim.test.ts`, `claim-read-sites.test.ts`, `runnable-exit-contract.test.ts` and `read-sites.test.ts`: 789 passed, 0 skipped.
- `npm run freshness:runnable-embeds`: 5 targets fresh. `npm run freshness`: 90 committed `.js` files match a rebuild.
- `node scripts/check-foundation-guards.js`: `ALL CHECKS PASSED`.
- Printed by the read test: `claim.js: 18 read sites, 55 (site, via) pairs`, `55 pairs reached, 0 unreached`, `UNREACHED (0): none`. The default reporter in this environment hides that output, so it was read with `--reporter=default --silent=false`.
- Acceptance: `CONFIG_NAME` occurs twice. `"claim"` occurs 19 times in the exit contract test. `git diff --quiet HEAD -- scripts/fault-inject.test-support.ts` exits 0. `existsSync` occurs 0 times in `claim.js`.

**Full suite, run once at `c7e0c9b5` with `TMPDIR` on the root disk:** 24 failed, 11,273 passed, 2 skipped. Two failures were this plan's: `the derived site count equals the pinned count` and `the derived set and the annotated set agree` in `scripts/context-io.test.ts`, both from `claim.ts` naming the config file. `7918e2d1` fixes them. The other 22 match the measured baseline by file and count: `context-io` 7, `uat-gate-exit-contract` 5, `harness-instance-ledger` 4, `context-io-writer-set` 2, `canonical-corpus` 1, `capture-live` 1, `installer-fs-census` 1, and `check-foundation-guards` 1 from the user's `~/` directory.

**The full suite was not re-run after `7918e2d1`.** That commit changes one test file. That file was re-run alone: 7 failed, 735 passed, 1 skipped, and the 7 are the Phase 31 document cases. The expected count at the plan head is 22, by that reasoning and not by a measurement.

## Files Created/Modified

- `scripts/runnable-ref/claim.ts`, `.js` - `free`, `sweep`, `readQueueConfig`, `CONFIG_NAME`, `renderAfter`, `refuseClaimLinks`, `whatStands`, and the `ensureQueueDirs` fix
- `scripts/runnable-ref/claim.test.ts` - 37 new host-copy cases
- `scripts/runnable-ref/runnable-exit-contract.test.ts` - `claim` in `RUNNABLES`, `STOPPED` and `HOST`, and eight rows
- `scripts/runnable-ref/claim-read-sites.test.ts` - the derived read test, 61 cases
- `scripts/context-io.test.ts` - `CONFIG_PATH_SITE_COUNT` 12 to 13, a table row and a history line
- `.planning/phases/41-orchestrator-flow-guidance/deferred-items.md` - one entry updated with a reproduction, and one added

## Decisions Made

See `key-decisions` above. The note lines of `sweep` and `free` use the same parenthesis form, because the plan gives the shape for `free` only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `ensureQueueDirs` let a second ask hide a failed first ask**
- **Found during:** Task 3, the first run of the derived test
- **Issue:** the first ask only tested for `absent`, and the second ask made the judgment. An EIO on the first ask fell through to a second ask that passed, so `claim` printed a success line after a failed read.
- **Fix:** the last answer asked is the one judged, and the second ask runs only after a create.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `.js`
- **Verification:** all `via ensureQueueDirs` pairs pass. The second ask is reached only in the mode `now-running-new-queue`, which the plan did not list and which was added for that reason.
- **Committed in:** `7688b802`

**2. [Rule 2 - Missing critical] `sweep` read and renamed through a symbolic link under `claimed/`**
- **Found during:** Task 3, while checking the T-41-08 claim in the program's header
- **Issue:** measured on the committed program: a link `claimed/t1` to an outside directory gave exit 0 and `swept 1`, and the outside `t1.md` moved into `pending/`. The header says the program writes nowhere outside the queue.
- **Fix:** `refuseClaimLinks` asks the root-chain owner about each entry before anything moves. This adds one read site, so the pin is 18, not the 17 first measured.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `.js`, `claim.test.ts`, `claim-read-sites.test.ts`
- **Verification:** a case proves both tree digests are unchanged, and a stray file in `claimed/` does not stop the sweep.
- **Committed in:** `44ce45cd`, `c7e0c9b5`

**3. [Rule 1 - Bug] `The queue was not changed` was false after a directory was created**
- **Found during:** Task 3
- **Issue:** a failure after `ensureQueueDirs` created a directory still printed that sentence over a changed tree.
- **Fix:** `whatStands` feeds both messages, and a run that created directories says `Empty queue directories were created, and no task moved.` A refused `claim` on a repository with no stage directories now prints that sentence too.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `.js`
- **Committed in:** `7688b802`

**4. [Rule 2 - Missing critical] `done` named nothing when `completeTask` stopped between its two steps**
- **Found during:** Task 2
- **Issue:** the move and the release are two steps, so a failed release left a finished task with a message that named no change.
- **Fix:** `queueChange` says the task may already have moved before `completeTask` runs, and is cleared on a refusal, which comes before any move.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `.js`
- **Committed in:** `86e42103`, `7688b802`

**5. [Rule 3 - Blocking] A count pin the plan did not list**
- **Found during:** the full suite
- **Issue:** `CONFIG_NAME` in `claim.ts` makes it a config-resolving site, which `scripts/context-io.test.ts` pins. The plan does not list that file.
- **Fix:** the pin moved 12 to 13 with a table row and a history line. That guard exists to ask whether a new site is a second governance reader. It is not: `claim.ts` reads only the `queue` block and decides no checkpoint, and the guard's governance-key case passes.
- **Files modified:** `scripts/context-io.test.ts`
- **Committed in:** `7918e2d1`

---

**Total deviations:** 5 auto-fixed (2 bugs, 2 missing critical, 1 blocking)
**Impact on plan:** two real defects were fixed in the hand-written part, one test file outside the plan's list took a pin, and the generated regions did not change.

## Issues Encountered

- **One must-have holds with a stated exception.** The truth says a throw after a queue change never says nothing changed. It holds for every read fault and for each row of the exit contract. It does not hold when the `claim.md` write fails inside `claimPending`. Measured: `Error: claim of t1 failed: EIO: injected. The queue was not changed.`, with `claimed/t1/` left behind. A retry reads `lost`, `free` counts the slot, and `sweep` cannot clear it. The fix is in `scripts/claim.ts` and the generated region, which this plan holds unchanged, so it stays in `deferred-items.md` with the measurement. It needs a decision before the milestone closes.
- **`sweep` cannot name its moves after a partial stop.** A throw inside `sweepQueue` prints `The sweep may have moved tasks before it stopped; run sweep again.` That never denies a change, but it does not list the tasks, because that function reports only at the end. The read test accepts this sentence as naming the change.
- **The render and `free` still read through a link under `claimed/`.** Neither writes outside the queue. This comes from reading the code and is in `deferred-items.md`.
- **A killed run left one orphaned vitest worker.** The first full-suite run was stopped so the fix for deviation 2 could land. The worker it left, with this repository as its working directory, was found and stopped. No result from that run is used here.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Workflow 17's `free` and `sweep` lines now point at commands a host has, once it installs this `claim.js`.
- Plan 41-06 can point `orchestrator.md` and `_role-switch-protocol.md` at Workflow 17.
- RUN-02 and RUN-05 stay open until any sibling plan that declares them finishes, under `requirements.ready-ids`.

## Self-Check: PASSED

The created file exists. All nine task commits are ancestors of HEAD. The acceptance criteria of all three tasks were re-run and pass.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
