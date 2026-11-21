---
phase: 41-orchestrator-flow-guidance
plan: 04
subsystem: workflows
tags: [workflow-17, workflow-16, flow-guidance, session-compaction, queue, disposition-rows, residuals]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: plan 41-02's Workflow 04 text and the ask-once rule; plan 41-03's tools/grugops/claim.js with claim, done and now-running
provides:
  - Workflow 17 as the one home of the flow guidance, with one command per step
  - "`## Keep capacity full`, `## Session start` and `## Session compaction` with `### Operator tips (optional)`"
  - Workflow 16 step 5, the path by which a spawned role learns its last act
  - the `queue` rows of factory.config.md agreeing with Workflow 17
  - docs/audit/41-residuals.md, R-41-01 to R-41-05 and assumptions A1, A2
  - scripts/flow-guidance-text.test.ts, the text pins for RUN-02, RUN-03, RUN-04 and RUN-06
affects: [41-05, 41-06, workflow-17, orchestrator-role, role-switch-protocol, milestone-uat]

actuals:
  tokens: 23748
  tasks: 3
  commits: 7
plan_head_before: 99a563c2587b2a210ed0fd257a9a54204829b629
plan_head_after: 31f8a4f77739e13229d042527a6866e749d1621b

tech-stack:
  added: []
  patterns:
    - "A host-name pattern in a test is built from the six names as plain words, because `\\bPi\\b` reads to the prose scan as a list with Pi left out"
    - "A line naming the context path holds no `<task>` placeholder, because SCTX-05 reads that `>` as a redirect"

key-files:
  created:
    - scripts/flow-guidance-text.test.ts
    - docs/audit/41-residuals.md
    - docs/audit/29-style-dispositions/41-04.md
  modified:
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/config/factory.config.md
    - docs/catalog/README.md
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "Workflow 17 step 1 sets the pending file's two lines in sub-bullets, and line two gives an example id (`abc-104`): the target text's `<task>` beside the context path fails the SCTX-05 guard, so the sentence was reworded and the guard left alone"
  - "The row for the Claude Code host limit carries rule RUN-04, not a decision id: no human decision set that figure, so the row says it corrects a host fact from research Pitfall 10"

patterns-established:
  - "A new scripts/*.test.ts file moves two count pins: SCRIPTS_TEST_FILE_COUNT in install/mode-census.test.ts and TRIPWIRE_MODULES in scripts/check-foundation-guards.test.ts"

requirements-completed: [RUN-01, RUN-02, RUN-03, RUN-04, RUN-05, RUN-06]

coverage:
  - id: D1
    description: "Workflow 17 reads as one command per step, records the D-04 reversal and names no library function"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 17 reads as one command per step (plan 41-04; RUN-05, D-01, D-03, D-04, D-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 16 step 5 tells a spawned role to run `done` as its last act"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 16 tells a spawned role its last act (plan 41-04; D-05)"
        status: pass
    human_judgment: false
  - id: D3
    description: "`## Keep capacity full` gives the refill one trigger and no timer, and keeps a slot busy until `done`"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 17 keeps capacity full (plan 41-04; RUN-02, D-06, D-09, D-10, D-26)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The sweep command sits only in `## Session start`, and a long claim in a live session is reported and left"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 17 sweeps only at session start (plan 41-04; RUN-02, D-11, D-29)"
        status: pass
    human_judgment: false
  - id: D5
    description: "`## Session compaction` covers the Orchestrator only, with three triggers, a written order, no question to the human and no token claim"
    requirement: RUN-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 17 holds session compaction (plan 41-04; RUN-03, RUN-04, D-14 to D-20, D-29)"
        status: pass
      - kind: other
        ref: "node scripts/check-banned-claims.js"
        status: pass
    human_judgment: false
  - id: D6
    description: "Host names occur only in `## Platform depth and width` and `### Operator tips (optional)`"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#names a host only in the Platform section and the operator tips, across the whole file"
        status: pass
    human_judgment: false
  - id: D7
    description: "The `queue` rows of factory.config.md agree with Workflow 17, and no config key was added"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#factory.config.md agrees with Workflow 17 (plan 41-04; D-01, D-04, D-11)"
        status: pass
      - kind: other
        ref: "git diff --quiet 3fbe37fb -- agent-factory/seed/.grugops/factory.config.json agent-factory/config/factory.config.json"
        status: pass
    human_judgment: false
  - id: D8
    description: "The eight frozen rows in `## Stop conditions` keep each stop's meaning in the CLI's terms"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "A change to a frozen section owes a named human's read. The gate proves each row exists and cannot judge whether the meaning held. Every row stays `pending (named human):` until that read."
  - id: D9
    description: "The 174 disposition rows say truly what changed and why, and the residual record is complete"
    requirement: RUN-06
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves each changed clause has a row, not that a disposition is right. The README names a human read of the rows against the diff as the check."
  - id: D10
    description: "The guidance works on hosts other than Claude Code"
    requirement: RUN-04
    verification: []
    human_judgment: true
    rationale: "No live run exists on Codex, Antigravity, OpenCode, Copilot or Pi, and those CLIs are absent on this machine. Recorded as R-41-05, `UNKNOWN - verify`, carried to the milestone UAT."

duration: 37 min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 04: Flow Guidance in Workflow 17 Summary

**Workflow 17 now tells the Orchestrator what to run, when to refill, when to sweep and when to compact, in text that turns on whether the `Agent` tool exists, and Workflow 16 step 5 gives a spawned role its last act: `claim.js done`.**

## Performance

- **Duration:** 37 min, of which about 24 was the full suite
- **Started:** 2026-11-05T00:15:12Z
- **Completed:** 2026-11-05T00:52:30Z
- **Tasks:** 3
- **Files modified:** 9 in the task commits

## Accomplishments

- Each Workflow 17 step is one command. The Orchestrator runs `free` and `claim` at dispatch, and the role runs `done` as its last act. No step names a library function.
- The D-04 reversal is recorded in `## Agents involved`, and the seam section says `by` stays for the render, the sweep and the board reader.
- `## Keep capacity full` gives the refill one trigger, no timer, a board-priority order with a tie rule, and a slot that stays busy until `done`.
- `## Session start` is the only place the sweep runs, so a live session cannot reclaim a slow agent's task.
- `## Session compaction` is named apart from Workflow 18. It lists three triggers the Orchestrator can see, then pause, confirm, compact, otherwise checkpoint. It never asks the human.
- Workflow 16 step 5 closes the gap found at planning: no adapter names Workflow 17, so a spawned role had no way to learn `done`.
- The Platform section gives the current limit: 20 concurrent by default and no session total.
- Five residuals and two assumptions are recorded in `docs/audit/41-residuals.md`.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `382ecf2d` test(41-04): add failing cases for one command per step
   - `a8156dac` docs(41-04): make each Workflow 17 step one command, and give a role its last act
2. **Task 2: The refill and close loop, and a sweep that cannot steal running work**
   - `2454592c` test(41-04): add failing cases for the refill and the session-start sweep
   - `983b399d` docs(41-04): write the refill loop and the session-start sweep into Workflow 17
3. **Task 3: Session compaction, the operator tips, the config rows and the residual record**
   - `0f1b809f` test(41-04): add failing cases for session compaction and the queue rows
   - `d99801bb` docs(41-04): add session compaction, the queue rows and the residual record
   - `31f8a4f7` test(41-04): count the new test module and name every host in its pattern

**Plan metadata:** the `docs(41-04)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `starts a tiered engineer by adapter name in step 4, with no per-call override (D-13)`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on `expected '4. Implement the subtask. Write only …' to contain 'as a non-fork sub-agent'`, because step 4 was still the old implement step. A first record on another target returned `INVALID_RED`, because an apostrophe in the actual value makes vitest emit `\'`, which the strict TAP parser refuses. The target was changed; the test did not change.
- **Task 2 RED:** the target was `keeps the TTL key named`. `RED_EVIDENCE_OK`. Semantic assessment: the target failed on `no "## Session start" section`, the planned absence. The full RED run had 15 failed of 29.
- **Task 3 RED:** the target was `lists exactly the three observable triggers`. `RED_EVIDENCE_OK`. Semantic assessment: the target failed on `no "## Session compaction" section`, the planned absence. The full RED run had 17 failed of 46.
- **GREEN:** each task passed its `<verify>` commands, apart from the foundation-guard finding described under Deviations.
- **Tracer gate:** interactive, `end-of-phase`, automated-only verify, so no checkpoint. The Task 1 verify was re-run after its commit and passed before Task 2 started.
- **REFACTOR:** none.

## Plan Verification

- `npx vitest run scripts/flow-guidance-text.test.ts scripts/checkpoints.test.ts scripts/config-queue-consistency.test.ts scripts/admission-protocol-docs.test.ts`: 203 passed, run at the plan head.
- `check-imperative-lexicon`, `check-diff-disposition`, `check-kit-refs`, `check-banned-claims`, `check-foundation-guards`: each exit 0, run at the plan head.
- `check-claim-anchors`, `check-role-rules`, `check-audit-register`, `check-residual-citations`: each exit 0, run at `d99801bb`.
- `npm run typecheck`, `npm run freshness` (90 committed `.js` files match a rebuild) and `freshness:catalog`, `:adapters`, `:skill-twins`, `:host-entries`, `:guarantees`: each exit 0, run at `d99801bb`.
- Acceptance: `scripts/checkpoints.ts` has no diff from `3fbe37fb`, so `WORKFLOW_STOP_BULLET_COUNT` stays 48. No config JSON changed. Each section heading occurs once. `grep -c "R-41-0"` prints 5.
- Workflow 17 equalled the target between its two markers, and `## Commit` matched HEAD, when Task 3's text landed. The step 1 reword below is the only difference from the target since.

**Full suite, run once at `d99801bb` with `TMPDIR` on the root disk:** 25 failed, 11,162 passed, 2 skipped. Three failures were this plan's, from adding a test file: `install/host-tools-prose`, `install/mode-census` and one `check-foundation-guards` case. All three are fixed in `31f8a4f7`. The other 22 match the measured baseline by file and count: `context-io` 7, `uat-gate-exit-contract` 5, `harness-instance-ledger` 4, `context-io-writer-set` 2, `canonical-corpus` 1, `capture-live` 1, `installer-fs-census` 1, and `check-foundation-guards` 1 from the user's `~/` directory.

**The full suite was not re-run after `31f8a4f7`.** That commit changes three test files only. Those files were re-run instead: 426 of 427 passed, and the one failure is the `~/` baseline case. The expected count at the plan head is 22, by that reasoning and not by a measurement.

## Files Created/Modified

- `agent-factory/workflows/17-task-claim.md` - the flow guidance
- `agent-factory/workflows/16-context-read-write.md` - step 5
- `agent-factory/config/factory.config.md` - the `wip_limit`, `claim_cap` and `stale_ttl_minutes` rows
- `docs/catalog/README.md` - the regenerated Workflow 17 row
- `docs/audit/41-residuals.md` - the residual record
- `docs/audit/29-style-dispositions/41-04.md` - 174 rows, 8 of them frozen and pending a named human
- `scripts/flow-guidance-text.test.ts` - 46 cases
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts` - count pins, with dated history lines

## Decisions Made

See `key-decisions` above. Every other sentence is applied as `41-TARGET-TEXT.md` wrote it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The target text for step 1 fails the SCTX-05 guard**
- **Found during:** Task 3, the first `check-foundation-guards` run
- **Issue:** `ref: .grugops/context/<task>/` puts a `>` beside the context path, and `Write` opens the same line, so the guard reads a raw context write. Tasks 1 and 2 do not list that guard in their verify, so commits `a8156dac` and `983b399d` carry the failing line. The target was checked against the lexicon gate only.
- **Fix:** step 1 now holds two sub-bullets, each opening with the approved verb `Set`, and line two gives an example: `ref: .grugops/context/abc-104/` for task `abc-104`. The two-line contract is unchanged. `claim.js` accepts that shape. The guard was not changed.
- **Files modified:** `agent-factory/workflows/17-task-claim.md`, `scripts/flow-guidance-text.test.ts`
- **Verification:** `check-foundation-guards` and `check-imperative-lexicon` exit 0, and a case pins both lines.
- **Committed in:** `d99801bb`

**2. [Rule 3 - Blocking] The catalog row follows `## When to use`**
- **Found during:** Task 1
- **Issue:** `docs/catalog/README.md` renders the first sentence of `## When to use`, so the new opening made it stale. The plan does not list that file.
- **Fix:** ran `node scripts/generate-catalog.js`. One row changed.
- **Committed in:** `a8156dac`

**3. [Rule 3 - Blocking] Two count pins the plan did not list**
- **Found during:** the full suite
- **Issue:** a new `scripts/*.test.ts` file moves `SCRIPTS_TEST_FILE_COUNT` and `TRIPWIRE_MODULES`.
- **Fix:** both moved 82 to 83, re-derived with `ls scripts/*.test.ts | wc -l`, with dated history lines. The new file has no chmod call and reads no `.mode`.
- **Committed in:** `31f8a4f7`

**4. [Rule 1 - Bug] The new test file tripped the host prose scan**
- **Found during:** the full suite
- **Issue:** the scan read the regex `\bPi\b` as a host list with Pi left out, and a test title said `three hosts`.
- **Fix:** one `HOST_NAME` pattern is built from the six names, and the title no longer gives a count. The scan's own exemption table is unchanged.
- **Committed in:** `31f8a4f7`

**5. [Rule 2 - Missing critical] A row that could not honestly cite a human decision**
- **Found during:** Task 1
- **Issue:** the plan asks each row to cite the human decision of 2026-11-04, but no decision set the Claude Code limit. It comes from research Pitfall 10.
- **Fix:** that row carries rule `RUN-04` and says it corrects a host fact.
- **Committed in:** `a8156dac`

---

**Total deviations:** 5 auto-fixed (2 bugs, 2 blocking, 1 missing critical)
**Impact on plan:** two files outside the plan's list took count pins and one took a generated row. One kit sentence differs from the target, with its decision kept.

## Issues Encountered

- **A human read is owed.** The `<human-check>` in Task 3 was not run. The eight rows marked `pending (named human)` in `docs/audit/29-style-dispositions/41-04.md` wait for a named human, under the `end-of-phase` mode. No human acceptance is written anywhere in that file.
- **`41-TARGET-TEXT.md` still holds the old step 1.** It is an input to execution, so it was left as written.
- **The row count is larger than the change.** The gate compares whole lines, so 17 of the 174 rows record sentences kept word for word on an edited line.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Workflow 17 names `free` and `sweep`, which reach hosts only with plan 41-05. Until then those two lines point at commands a host does not have.
- Plan 41-06 can now point `orchestrator.md` and `_role-switch-protocol.md` at Workflow 17.
- RUN-02 to RUN-06 stay open until the sibling plans that declare them finish, under `requirements.ready-ids`.

## Self-Check: PASSED

The three created files exist. All seven task commits are ancestors of HEAD, and `check evaluation-scope` lists them. The acceptance criteria of all three tasks were re-run at the plan head and pass.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
