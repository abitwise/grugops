---
phase: 41-orchestrator-flow-guidance
plan: 03
subsystem: queue
tags: [claim, runnable, embed, installer, sealed-notes, typescript]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: plan 41-01's queue authority in scripts/claim.ts (claimPending, completeTask, claimRecordFields, subtaskRefFolder, noteSinceClaim)
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: scripts/generate-runnable-embeds.ts, the build stamp and the state-roll program shape
provides:
  - tools/grugops/claim.js on every host, with the claim, done and now-running commands
  - a fifth EMBED_SPECS row; claim.js joins RUNNABLE_SET and the build stamp
  - a RUNNABLES row and its RUNNABLES_MIRROR row, so install writes the program and uninstall removes it
  - the region roots plan 41-05 needs for free and sweep, already embedded
affects: [41-04, 41-05, 41-06, workflow-17, claim-cli, installer]

actuals:
  tokens: 45827
  tasks: 3
  commits: 5
plan_head_before: 3aa99063f4d36d914cd67110dce58932083144e9
plan_head_after: d3e3acb5c4f85996ef9e9a5b03b2d443a844085a

tech-stack:
  added: []
  patterns:
    - "A program whose first positional is a task takes its root as --root DIR, and refuses a root with no .grugops directory"
    - "A queue directory is created only on an absent answer and asked again afterwards, so a directory another claimant made first is judged"
    - "couldNotRun says nothing changed; stoppedUnexpectedly names the change that stands"

key-files:
  created:
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/claim.test.ts
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/generate-runnable-embeds.test.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/check-foundation-guards.test.ts
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-cross-version.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/ledger-provenance.test.ts
    - install/record-truth.test.ts
    - install/README.md
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md

key-decisions:
  - "claim runs ensureQueueDirs before claimPending, so a refused claim can leave empty stage directories; checking first would retype the level rule in the hand-written part"
  - "done creates no directory until every read has passed, so done on a repository with no queue writes nothing"
  - "A claim record whose at: is not a timestamp is exit 2: no note could ever pass it, so a not-done line would send the caller round for ever"
  - "A flag value that starts with -- is refused, because the owner allowlist would accept --root as an adapter name"

patterns-established:
  - "An installed-host case proves a program runs from tools/grugops/ with Node alone, beside the host-copy cases in its own test file"

requirements-completed: [RUN-01, RUN-02, RUN-05, RUN-06]

coverage:
  - id: D1
    description: "A real install writes tools/grugops/claim.js, and claim runs on the host with Node alone and renders the row"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#claim.js: a fresh install lays down the queue tool, and `claim` runs on the host and renders the row (plan 41-03, RUN-05, D-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "claim prints one line and exits 0, a second claim reads lost, and two processes racing give exactly one winner"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#two claims started together on one task give exactly one winner and one `lost`"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each refusal exits 2 with an empty stdout and one Error line, including every spelling of the Orchestrator as owner"
    requirement: RUN-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#claim TASK --by ADAPTER (RUN-05, D-01, D-02, D-08)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A directory with no .grugops is refused and gains no queue, and a symlinked queue is refused by name with nothing written"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#the root is a boundary (T-41-08, T-41-09)"
        status: pass
    human_judgment: false
  - id: D5
    description: "done moves the subtask, releases the claim and leaves a header-only log, and only a sealed note since the claim passes"
    requirement: RUN-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#done TASK finishes a task on a sealed note (RUN-01, D-05, D-07)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A bad ref: line, a tampered record, a link and unreadable notes each exit 2 with the task still in claimed/"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#done refuses what it cannot read (T-41-16)"
        status: pass
    human_judgment: false
  - id: D7
    description: "claim.js is in RUNNABLE_SET, and state-check reports a skewed claim.js as runnable-version-skew"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#one hex digit of the copied claim.js stamp changed: exit 1, one FINDING naming claim.js (plan 41-03, Open Question 4)"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds"
        status: pass
    human_judgment: false
  - id: D8
    description: "Uninstall removes an untouched claim.js and keeps a user-edited one, and the two mappings stay equal"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#claim.js: uninstall keeps and reports a user-edited copy (plan 41-03, T-41-10)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false

duration: 47 min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 03: Host Queue Tool Summary

**`tools/grugops/claim.js` now ships to host repositories: `claim` takes a task into the in-flight log, and `done` takes it out only on a sealed note written since the claim, with every refusal a separate exit and one plain line.**

## Performance

- **Duration:** 47 min, of which about 20 was the full suite
- **Started:** 2026-11-04T23:25:02Z
- **Completed:** 2026-11-05T00:12:36Z
- **Tasks:** 3
- **Files modified:** 27 in the task commits

## Accomplishments

- A fresh install writes `tools/grugops/claim.js`. With Node alone, `claim`, `done` and `now-running` each print one line and exit 0, 1 or 2 under the plan's contract.
- A claim, a finish and a render all use the rules from `scripts/claim.ts` through the generated region. The hand-written part holds only argv, the root checks, the exit codes and the output lines.
- `done` reads the folder from the subtask's `ref:` line and counts sealed notes only, through the embedded note walk. A host with no sealed-note writer gets a `not-done` line that names the unsealed notes it found, so the D-28 gap stays visible.
- `claim.js` joined the build stamp set, so `state-check` reports a skewed copy as `runnable-version-skew`, and the install guide lists the fourth program.
- Every count pin moved by its measured number, with a dated history line naming this plan.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `35fd8acb` test(41-03): add failing cases for the host queue tool
   - `3a6a1068` feat(41-03): ship claim.js to hosts with claim and now-running
2. **Task 2: Count pins, the skew check and the install guide**
   - `40fb585c` test(41-03): move every count pin for claim.js and prove the skew check sees it
3. **Task 3: `done` and the sealed-note check**
   - `5cb16c06` test(41-03): add failing cases for done and the sealed-note check
   - `d3e3acb5` feat(41-03): finish a task with done, on a sealed note since the claim

**Plan metadata:** the `docs(41-03)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `claim.js: a fresh install lays down the queue tool`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on its planned assertion, `tools/grugops/claim.js was not installed: expected false to be true`. The host-copy file could not be the RED target, because it copies a committed `.js` that did not exist yet, so it failed at load.
- **Task 3 RED:** the target was `the log keeps the row of a task still running`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK` before the test commit. Semantic assessment: the target ran and failed on `expected 2 to be +0`, because the program had no `done` command. A first record on another target returned `INVALID_RED`, because a multi-line actual value breaks vitest's TAP. The target was changed; the test did not change.
- **GREEN:** both tasks passed their `<verify>` commands. All 71 host cases passed on the first run after the Task 3 edit.
- **Tracer gate:** interactive, `end-of-phase`, automated-only verify, so no checkpoint. The Task 1 verify was re-run after its commit and passed before Task 2 started.
- **REFACTOR:** none as a separate commit.

## Plan Verification

- `npm run build && npm run typecheck`: pass.
- `npm run freshness:runnable-embeds`: 5 targets fresh. `npm run freshness`: 90 committed `.js` files match a rebuild.
- `node scripts/check-foundation-guards.js`: `ALL CHECKS PASSED`.
- `npx vitest run scripts/runnable-ref/claim.test.ts scripts/generate-runnable-embeds.test.ts`: 99 passed.
- The eight installer test files and `scripts/runnable-ref/state-check.test.ts`: the combined run left one failure, a pin the plan did not list. After the fix, its case and the `claim.js` cases passed in a filtered run. The eight files were then green in the full suite.
- `git diff --quiet 3fbe37fb -- scripts/context-io.ts`: exit 0.
- `npm run freshness:queue`: exit 0. This is a vacuous pass, because this repository has no `.grugops/queue/claimed/` tree.
- **Full suite at the plan head, with `TMPDIR` on the root disk:** 22 failed, 11,119 passed, 2 skipped, in 8 files. The 22 are exactly the measured baseline: `context-io` 7, `uat-gate-exit-contract` 5, `harness-instance-ledger` 4, `context-io-writer-set` 2, `canonical-corpus` 1, `capture-live` 1, `installer-fs-census` 1, and `check-foundation-guards` 1 from the user's `~/` directory. The comparison is by file and count. It was not re-run against a clean clone.

## Files Created/Modified

- `scripts/runnable-ref/claim.ts`, `.js` - the host program and its committed build
- `scripts/runnable-ref/claim.test.ts` - 72 host-copy cases for each command and refusal
- `scripts/generate-runnable-embeds.ts`, `.js`, `.test.ts` - the claim row, `EMBED_SPEC_COUNT` 5, the moved pins
- `scripts/runnable-ref/state-check.*`, `trace-render.*`, `state-roll.*` - regenerated stamp lines; `state-check` also has its sibling comment corrected and a skew case for `claim.js`
- `install/install.ts`, `install/uninstall.ts`, and their `.js` - the row pair
- `install/README.md` - the fourth program, in the list and the update instructions
- Eight `install/*.test.ts` files and `scripts/check-foundation-guards.test.ts` - measured pins and history lines
- `.planning/phases/41-orchestrator-flow-guidance/deferred-items.md` - one finding in the plan 41-01 authority

## Decisions Made

See `key-decisions` above. One more is worth a reader's time: `runDone` calls the embedded `assertSafeQueueTask` before it builds a path, because `rootChainPresence` would otherwise read `a/b` as a nested path. That is a call to the embedded rule, not a retyped one.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A verify command in the plan selects no test**
- **Found during:** Task 2
- **Issue:** `npx vitest run scripts/check-foundation-guards.test.ts -t "NON_TEST_MODULE_COUNT"` reports 344 skipped and 0 passed, because no case title holds that name. The plan's own `fails_when` reads 0 passed as a failure.
- **Fix:** ran the whole file instead. 343 passed. The one failure is the `~/` baseline case, and the cases that read the pin are among the passes.
- **Files modified:** none
- **Committed in:** not applicable

**2. [Rule 1 - Bug] A third program count pin the plan did not list**
- **Found during:** Task 2
- **Issue:** the plan names two `PROGRAM_RELS` sites. `programRows.length` at `install/install.test.ts` was a third pin on the same count, and it failed once the first two moved.
- **Fix:** moved it 7 to 8 by its measured number, with a history line.
- **Files modified:** `install/install.test.ts`
- **Committed in:** `40fb585c`

**3. [Rule 1 - Bug] `ensureQueueDirs` handles a directory another claimant made first**
- **Found during:** Task 1
- **Issue:** the plan creates a directory on `absent` and refuses the rest. Two racing claimants can both read `absent`, and the second `mkdir` throws EEXIST, which would turn a lost race into exit 2.
- **Fix:** EEXIST is not a failure, and every directory is asked again after the create, so a link planted in the gap is still refused.
- **Files modified:** `scripts/runnable-ref/claim.ts`
- **Committed in:** `3a6a1068`

**4. [Rule 2 - Missing critical] Argument checks the plan left open**
- **Found during:** Task 1
- **Issue:** `nodeFs.realpathSync("")` resolves to the working directory, so an empty `--root` would act on the wrong repository. `--by --level mid` would take `--level` as an owner, which the allowlist accepts.
- **Fix:** an empty `--root` and a flag value starting `--` are refused. Commands sit in a `Map`, so `constructor` is not a command.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/claim.test.ts`
- **Committed in:** `3a6a1068`

**5. [Rule 2 - Missing critical] A claim record whose `at:` is not a timestamp**
- **Found during:** Task 3
- **Issue:** `noteSinceClaim` returns false for an unparseable claim `at`, so `done` would print `not-done` for ever and tell the caller to publish a note that could never count.
- **Fix:** exit 2 by name, with the task left in `claimed/`. A missing claim record, a non-file record and a FIFO at the record are exit 2 as well.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/claim.test.ts`
- **Committed in:** `d3e3acb5`

**6. [Rule 1 - Bug] Stale counts in comments and titles**
- **Found during:** Tasks 1 and 2
- **Issue:** the `state-check.ts` header said `all three programs` and named three siblings, and several test titles said `three`. All became false when `claim.js` joined.
- **Fix:** corrected the wording. The cases' assertions are unchanged except the moved pins.
- **Files modified:** `scripts/runnable-ref/state-check.ts`, `scripts/generate-runnable-embeds.test.ts`, `scripts/runnable-ref/state-check.test.ts`
- **Committed in:** `3a6a1068`, `40fb585c`

---

**Total deviations:** 6 auto-fixed (1 blocking, 3 bugs, 2 missing critical)
**Impact on plan:** one verify command was replaced by a wider run, and the rest are small correctness fixes inside the plan's files. Scope did not change.

## Issues Encountered

- **The combined Task 2 run takes over four minutes.** It passed the tool's time limit twice, so it ran in the background, and the first measurement ran while later edits were being prepared. `install/README.md` and `scripts/runnable-ref/claim.test.ts` changed during that run. Neither explains a measured number, and the later runs covered both.
- **The combined Task 2 verify was not re-run whole after the last pin.** The failing case was re-run through a filter, and the full suite then covered all nine files.
- **A finding outside this plan.** `claimPending` can leave an empty claim directory when the record write fails. It comes from reading the code and was not reproduced. See `deferred-items.md`.

## Known Stubs

None. `free` and `sweep` are not stubs: plan 41-05 adds them, and `install/README.md` already says the program reports free capacity, which is true only once that plan lands.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 41-05 can add `free` and `sweep` with no generator change, because `claimedCount`, `freeSlots`, `parseQueueConfig` and `sweepQueue` are already in the region. It also owns the exit-contract rows and the read-site test for this program. RUN-05 stays open until the sibling plans that declare it finish.

## Self-Check: PASSED

The three created files exist. All five task commits are ancestors of HEAD, and `check evaluation-scope` lists them. The acceptance criteria of all three tasks were re-run and pass.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
