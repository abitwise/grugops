---
phase: 37-overview-board-per-file-records-and-budgets
plan: 20
subsystem: testing
tags: [exit-contract, could-not-run, fault-injection, trace-render, state-check, state-roll, typescript]

requires:
  - phase: 37-19
    provides: the three phase-37 host runnables (trace-render, state-check, state-roll) and trace-freshness
provides:
  - "CR-02 closed: an unlistable context root is exit 2 (named, empty stdout) in trace-render write and --check; trace-freshness reports could-not-run, never the STALE remedy"
  - "EXIT-1 closed for the phase-37 runnables: one uncaughtException handler each, registered before argv, exit 2 with one sanitized line"
  - "scripts/fault-inject.test-support.ts: the one fault-injection harness (FS_READ_FNS, FaultSpec, writeFaultPreload, runFaulted, treeDigest, hasNodeStack, scriptUrl) for plans 37-25 and 37-26"
  - "TR-6 (trace-render symbolic-link follow-up statSync) and SR-8 (state-roll post-create archive refusal removes the directory)"
affects: [37-25, 37-26, 37-27]

actuals:
  tokens: 17537
  tasks: 2
  commits: 2
plan_head_before: ac2973175287733ed8b7eec0e6dd46a1a6de40d3
plan_head_after: 0304268b851dd3c2ac745b919bd3826080e39e87

tech-stack:
  added: []
  patterns:
    - "Fault injection from outside the program: a generated ES-module preload loaded with `node --import`, matching a fault by stack frame (site and optional via line); no shipped runnable reads a fault switch"
    - "Process-level uncaughtException handler as the first statement of a runnable's hand-written part, before argv; every binding it reads is declared above it"

key-files:
  created:
    - scripts/fault-inject.test-support.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
  modified:
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/trace-freshness.test.ts
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "state-roll's unexpected-throw line names every roll written and proven by surface (not only the Done roll through doneStands), so a proven progress roll is never left unnamed; every handler line ends with the runnable's own sentence (`The roll did not finish.`)"
  - "A handler-removal mutation must neutralise the function reference (`void stoppedUnexpectedly;`): a bare delete fails tsc under noEmitOnError and the .js would not change, so the mutation would prove nothing"

patterns-established:
  - "EXIT-1 table: per (runnable, mode) row, a stdout-throw preload, assert fired > 0, exit 2, empty stdout, one `Error: ` line ending in the runnable's sentence, no V8 frame"
  - "Fault rows assert `fired > 0` before any verdict, so a harness mismatch is never read as an unreached site"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "CR-02: trace-render maps an unlistable context root to exit 2 with an empty stdout and a named EACCES line, in write and --check mode, with no stack and no write"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-02: an unreadable context root is could-not-run (exit 2), in both modes"
        status: pass
    human_judgment: false
  - id: D2
    description: "trace-freshness reports could-not-run (exit 1) and never the `and commit the result` STALE remedy for a tree whose context root cannot be listed"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/trace-freshness.test.ts#a rendered tree whose .grugops/context is at mode 000: exit 1, could not run, no re-render remedy"
        status: pass
    human_judgment: false
  - id: D3
    description: "EXIT-1: trace-render (write, --check), state-check (text, --json) and state-roll (write, --dry-run) map an unexpected throw to exit 2 with one honest sanitized line; census: one handler each, before argv, no fault switch"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: an unexpected throw past every inner catch is exit 2 in every runnable and mode"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1 census: one handler per runnable, before argv, and no fault switch in any shipped file"
        status: pass
    human_judgment: false
  - id: D4
    description: "TR-6 (symbolic-link follow-up statSync refused by name) and SR-8 (state-roll removes the archive directory it created before a post-create refusal; tree digest unchanged)"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: a failing follow-up read after a symbolic link or a created directory is exit 2 by name"
        status: pass
    human_judgment: false
  - id: D5
    description: "The fault-injection harness exists, is type-checked and is never emitted"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run -s freshness (86 committed .js match; no fault-inject .js)"
        status: pass
    human_judgment: false
  - id: D6
    description: "EXIT-1 siblings outside phase 37 recorded in deferred-items.md for triage; and the backstop truth that a throw inside the handler's own stderr write ends with Node's non-zero code (7), never exit 0"
    verification: []
    human_judgment: true
    rationale: "The deferred entry is for human triage (D-17 scope), and no test forces a failing stderr write portably (the plan's backstop truth)"

duration: 26min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 20: Overview board, per-file records and budgets, gap round 1 (CR-02 and EXIT-1) Summary

**An unlistable context root is now exit 2 by name in trace-render, and every phase-37 runnable maps any unexpected throw to exit 2 through one process-level handler, proven by a `node --import` fault preload that makes the final stdout write throw.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-23T12:45:59Z
- **Completed:** 2026-10-23T13:12:04Z
- **Tasks:** 2
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments

- CR-02 fixed at its site: `listTasks` in trace-render maps a listing failure to `couldNotRun` (`the context root <rel> cannot be listed (<code>).`), mirroring state-check's lister.
- One `uncaughtException` handler per phase-37 runnable, registered as the first statement of the hand-written part, before argv: exit 2, empty stdout, one sanitized `Error: ` line.
- Honest handler messages: trace-render says `Nothing was written or removed.` before its write phase and `<n> file(s) written and <m> file(s) removed before it stopped; run with --check to compare.` after it; state-roll names each roll written and proven, names a started roll with the version-control remedy, and says `No roll had started.` only when none had.
- TR-6: trace-render's symbolic-link follow-up `statSync` is refused by name. SR-8: state-roll removes the archive directory it created before a post-create refusal.
- The fault-injection harness for the READ-1 tables (plans 37-25, 37-26), never emitted, and the EXIT-1 table test (11 cases).

## Task Commits

1. **Task 1: CR-02 end to end (tracer)** - `6efa6ca8` (fix)
2. **Task 2: EXIT-1 for the class: harness, handlers, table, messages** - `0304268b` (fix)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: interactive run, `human_verify_mode: end-of-phase`, automated-only `<verify>`; the verify was re-run and passed, so the plan expanded without a checkpoint.

## RED runs

**Task 1, against the committed trace-render.js at `ac297317`:** both CR-02 cases failed with status 1 (expected 2). stderr began `node:fs:1956`, then `Error: EACCES: permission denied, scandir '<tmp>/.grugops/context'` and the frame `at Module.readdirSync (node:fs:1956:26)`, then `at Object.listTasks (.../trace-render.js:724:10)`: the reproduced CR-02. The trace-freshness case failed: its output held the STALE remedy (`... run \`node scripts/trace-render.js\` and commit the result.`) and no `could not run`. 3 failed.

**Task 2, against the unchanged state-check and state-roll (trace-render at `6efa6ca8`):** 8 failed, 3 passed. The state-check text and --json rows and the state-roll write and --dry-run rows each fired their fault and exited 1 with a stack (`at Socket.injectedStdoutWrite [as write] (.../fault-preload.mjs:22:11)`, then `at .../state-check.js:1806:16` or `.../state-roll.js:1352:20`). TR-6 fired and exited 2 through the Task 1 handler but did not name the root (`stopped unexpectedly (EIO: injected fault, statSync)`). SR-8 left the archive directory behind (digest 4 entries vs 3). The census found 0 registrations in state-check.ts and state-roll.ts. The 3 passing cases were the two trace-render stdout rows and the trace-render census, already covered by Task 1's handler.

Semantic assessment: every RED case ran its target, its fault fired (`fired > 0` asserted first), and it failed on the planned assertion (status, named line, digest, census count), not on a setup or load fault.

## Mutation proof

After `0304268b`, working tree only: the state-roll registration line was replaced by `void stoppedUnexpectedly;` (a bare deletion fails tsc with TS6133 under `noEmitOnError`, so the `.js` would not change and the mutation would prove nothing), then `npx tsc`. The table went 3 failed / 8 passed: the state-roll write and --dry-run rows exited 1 with a stack (`at Socket.injectedStdoutWrite ...`, `state-roll.js:1490:16` and `:1383:20`) and the state-roll census found 0 registrations. Reverted with `git checkout -- scripts/runnable-ref/state-roll.ts scripts/runnable-ref/state-roll.js`, rebuilt; `git status --porcelain` on both is empty and the table is 11 passed. No mutation was committed.

## EXIT-1 class table (final state)

| Site | State after 37-20 | Covered by |
|------|-------------------|------------|
| trace-render.ts `listTasks` | try → couldNotRun, exit 2 by name | CR-02 cases (trace-render.test.ts) |
| trace-render.ts `realDirectoryOrNull` symbolic-link follow-up statSync | try → couldNotRun `cannot be inspected (<code>)` | TR-6 row |
| trace-render.ts top level | uncaughtException handler before argv | stdout-throw rows (write, --check), census |
| state-check.ts output tail (outside its try) | uncaughtException handler before argv | stdout-throw rows (text, --json), census |
| state-roll.ts top level | uncaughtException handler before argv; post-create realpath refusal removes the created directory | stdout-throw rows (write, --dry-run), SR-8 row, census |
| trace-freshness.ts `freshnessVerdict` | unchanged; maps 2 to could-not-run, now exercised on a real could-not-run | trace-freshness behavior case |
| scripts/trace-render.ts `childExitCode` | compliant, unchanged | existing scripts/trace-render.test.ts cases |
| WF05 line 41, WF09 line 22 | compliant, unchanged | evidence only (plan 37-16) |
| reference-check, test-skip-integrity, uat-spec-integrity, board-dashboard, host-protection, check-state-paths with state-path-scan | out of round 1 scope (D-17) | deferred-items.md `EXIT-1 siblings outside phase 37` |
| hooks/admission-guard.ts, check-platform-shapes.ts, validate-agent-factory.ts | not in the class | n/a |

The search was re-run before writing the deferred entry (first 80 lines holding `exit 2`, `exits 2` or `could not run`, tracked non-test `.ts` under scripts/, install/, hooks/): it found no program beyond the plan's table. board-dashboard.ts states its exit-2 rule at line 167, below the 80-line window, and stays listed.

## Regression

Regression scope reason (the plan's recorded deviation from brief §3): this plan changes only the hand-written parts of the three runnables (no generated region, no EMBED_SPECS or RUNNABLES row), adds one never-emitted test-support module and one test file, so the subset is the keyword list (trace-render, state-check, state-roll, trace-freshness) united with the inventory guard; the full non-e2e suite runs at 37-24 and 37-27.

- **Union list:** 34 test files from the one `git grep -l -E` (33 tracked before the new test file was staged; the new `runnable-exit-contract.test.ts` names trace-render and joins the list once staged). The first run was stopped and repeated with the new files staged, because the inventory censuses read `git ls-files` and would not have seen untracked files.
- **Result:** 34 files, 3653 tests: 17 failed, 3635 passed, 1 skipped (670 s). 10 failures are in 37-BASELINE.md (canonical-corpus 1, context-io-writer-set 2, context-io 7). 7 were new, all in `scripts/check-foundation-guards.test.ts` LANG-07: module-count pins that count tracked non-test `.ts` by file shape (108 vs 109, 69 vs 70, and the 69 * 3 comparison count). Fixed (Rule 3, below); `check-foundation-guards.test.ts` then ran 320 passed.
- **Gates:** `npm run build`, `npm run typecheck`, `npm run -s freshness` (86 outputs fresh), `freshness:runnable-embeds` (3 targets), `freshness:traceability`, `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js`, `node scripts/check-nul-bytes.js`: all exit 0.
- `pgrep -fl vitest` after each run: one orphaned worker (parent launchd) was left by the stopped first run; it had exited by the time it was checked again.

## Files Created/Modified

- `scripts/fault-inject.test-support.ts` - the one fault-injection harness: a generated `fault-preload.mjs` loaded with `node --import`; `FS_READ_FNS`, `FaultSpec`, `writeFaultPreload`, `runFaulted`, `treeDigest`, `hasNodeStack`, `scriptUrl`; environment names `GRUGOPS_FAULT_SPEC` and `GRUGOPS_FAULT_LOG`, read only by the preload
- `scripts/runnable-ref/runnable-exit-contract.test.ts` - the EXIT-1 table: six stdout-throw rows, TR-6, SR-8 and the three-runnable census (11 cases)
- `scripts/runnable-ref/trace-render.ts` (+ `.js`) - listTasks fix, TR-6 fix, handler with `writtenCount`, `removedCount`, `writePhaseStarted`; header D-12 contract
- `scripts/runnable-ref/state-check.ts` (+ `.js`) - handler and `stoppedUnexpectedly`; header D-12 contract
- `scripts/runnable-ref/state-roll.ts` (+ `.js`) - handler with `proven` and `rollInFlight`; SR-8 removal; header D-12 contract
- `scripts/runnable-ref/trace-render.test.ts` - CR-02 describe (write and --check)
- `scripts/trace-freshness.test.ts` - the unlistable-context-root behavior case
- `scripts/check-foundation-guards.test.ts` - three module-count pins moved, each with its re-derivation
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md` - `EXIT-1 siblings outside phase 37`

## Decisions Made

- state-roll's handler names every roll written and proven by surface instead of reusing only `doneStands()`: doneStands is silent when only a progress roll was proven (it reads `done`), which would leave a written roll unnamed. As a result the handler reads only `proven` and `rollInFlight`, which are declared above it; `written` and `done` stay where they were.
- Every handler line ends with that runnable's own sentence: `The trace render did not finish.`, `The state check did not run.`, `The roll did not finish.` state-roll's `couldNotRun` sentence (`Nothing was rolled.`) would deny a write, so the handler uses its own.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] state-roll handler names a proven progress roll too**
- **Found during:** Task 2
- **Issue:** the plan's message used the sentence `doneStands()` builds, which is empty when only a progress roll was written and proven, so that write would go unnamed (truth: "names the rolls already written and proven").
- **Fix:** a `proven` list filled on each successful roll; the handler names each entry. ` The roll did not finish.` was appended so the line ends with a state-roll sentence that never denies a write.
- **Files modified:** scripts/runnable-ref/state-roll.ts, scripts/runnable-ref/state-roll.js
- **Verification:** the state-roll write row asserts `The Done roll was written and proven and stays: 1 Done row(s)` and the moved identifier.
- **Committed in:** 0304268b

**2. [Rule 3 - Blocking] Module-count pins in check-foundation-guards.test.ts**
- **Found during:** Task 2 regression
- **Issue:** the new tracked test-support module moved the counts its censuses pin by file shape (`NON_TEST_MODULE_COUNT` 108, the `scripts/`-scoped corpus 69 in two places, and the comparison count 69 * 3). The file is not in the plan's files_modified.
- **Fix:** each pin moved by one, with its re-derivation recorded in the established docblock style (`git ls-files '*.ts'` minus tests and `.d.ts` = 109; `ls scripts/*.ts` minus tests = 70). No guard's predicate changed.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Verification:** 320 passed.
- **Committed in:** 0304268b

**3. [Rule 1 - Test strength] trace-render write-mode stdout-throw row uses an unrendered repository**
- **Found during:** Task 2
- **Issue:** on an already rendered repository the write mode writes 0 files, so the row could not show that the message names written files.
- **Fix:** the write row runs on an unrendered two-root repository and asserts `3 file(s) written and 0 file(s) removed before it stopped`; the --check row keeps the rendered repository and asserts the tree digest is unchanged.
- **Files modified:** scripts/runnable-ref/runnable-exit-contract.test.ts
- **Committed in:** 0304268b

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 blocking, 1 test strength)
**Impact on plan:** all within the plan's truths; no scope creep. The harness also exports `scriptUrl` (V8 prints the real path, `/private/var/...` on macOS, so a site URL must come from realpath) and the two environment-name constants, which the census reads.

## TDD Gate Compliance

Task 2 is `tdd="true"`. RED was run and recorded above, but not committed separately: the gap-planning brief (§3) forbids a red commit, and `workflow.tdd_mode` is off. The test and the implementation are in one `fix(37-20)` commit. No `test(37-20)` / `feat(37-20)` pair exists.

## Issues Encountered

- The first regression run would have missed the `git ls-files` censuses because the new files were untracked; it was stopped and re-run with them staged.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 37-25 and 37-26 can import `FS_READ_FNS`, `runFaulted` and `treeDigest`; 37-25 replaces the two line lookups (`lineOf`) in the TR-6 and SR-8 rows with the derived site table.
- The EXIT-1 siblings outside phase 37 wait for human triage in deferred-items.md.
- REQUIREMENTS.md rows were not flipped (brief §3: do not flip ROADMAP/REQUIREMENTS rows; SPLIT-03/05/06 are shared with later round-1 plans).

## Self-Check: PASSED

- FOUND: scripts/fault-inject.test-support.ts, scripts/runnable-ref/runnable-exit-contract.test.ts
- FOUND: 6efa6ca8 and 0304268b are ancestors of HEAD
- Acceptance: CR-02 `-t CR-02` 2 passed; exit-contract 11 passed, 0 failed; state-roll porcelain empty after the mutation revert; deferred entry names all six programs and state-path-scan.ts; freshness 0

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
