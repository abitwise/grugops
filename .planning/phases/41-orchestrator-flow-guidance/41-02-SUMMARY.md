---
phase: 41-orchestrator-flow-guidance
plan: 02
subsystem: workflows
tags: [workflow-04, human-stop, stop-precedence, tech-lead, disposition-rows, tier-kit-text]

requires:
  - phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
    provides: the Workflow 04 hand-off loop and the residuals carried from UAT test 71
provides:
  - one ask-once rule for both Workflow 04 human stops, with the Tech Lead's queued subtask as the wake-up
  - a numbered stop precedence in step 15, so two stops can no longer both claim one ticket
  - `Approved:` and `Rejected:` lines that name the `Fundamental:` note they answer
  - the `claim.js claim` line in step 4, ahead of the spawn
  - the `step15Subs` test helper, which folds six-space lines into the sub-bullet above them
affects: [41-03, 41-04, 41-06, workflow-04, tech-lead-role, factory-config]

actuals:
  tokens: 23986
  tasks: 3
  commits: 5
plan_head_before: bfd7f9d35385f884ef6459833aacc860ce20439f
plan_head_after: 34fc0b94daa33b2b3bae21f673a34b5cf296eefa

tech-stack:
  added: []
  patterns:
    - "A disposition row file is regenerated whole from the gate's findings, so its line numbers stay true across tasks"
    - "A clause kept word for word on an edited line owes a row with the same text on both sides"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-02.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md

key-decisions:
  - "Workflow 04 step 15 keeps its own narrowed trigger, while the used-up stop, tech-lead.md and the config paragraph keep the general wording; case (k) pins each place to its own phrase"
  - "The stamp sentence gains the answer note's id as the target text says; the `human:<name>` wording and the three admission sentences stay word for word"

patterns-established:
  - "An indented numbered list under a step sub-bullet carries six spaces, and each line takes the 20-word step bound"

requirements-completed: [RUN-06]

coverage:
  - id: D1
    description: "One ask-once rule covers both human stops: only the Orchestrator asks, its queued subtask wakes the Tech Lead, and the double ask is gone"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF04 asks a human once, and the answer note wakes the Tech Lead at both human stops (plan 41-02; D-21, D-26)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Step 15 carries one numbered stop precedence, and the human stop covers a proposed `Fundamental:` note only"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF04 gives competing stops one order, an approval names its proposal, and step 4 claims (plan 41-02; D-04, D-22 to D-25, D-27)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An approval names the `Fundamental:` note it answers, and step 17 passes a change only against that approval"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-24: step 17 reads the pass rule and then binds it to the `Fundamental:` note behind the change"
        status: pass
    human_judgment: false
  - id: D4
    description: "Step 4 claims before the spawn and still passes no `model` or `effort` parameter"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-04: step 4 claims before the spawn and still passes no `model` or `effort` parameter"
        status: pass
    human_judgment: false
  - id: D5
    description: "tech-lead.md and factory.config.md agree that the Orchestrator asks, and tech-lead.md stays under its 3,907 B WARN ceiling at 3,775 B"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#tech-lead.md and the config paragraph say who asks the human (plan 41-02; D-21)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D6
    description: "The 99 disposition rows say truly what changed and why"
    requirement: RUN-06
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves each changed clause has a row, not that the disposition is right. The README names a human read of the rows against the diff as the check."

duration: 24 min
completed: 2026-11-04
status: complete
---

# Phase 41 Plan 02: Workflow 04 Hand-off Residuals Summary

**Workflow 04 now asks a human once at both stops, orders competing stops in one numbered list, binds each `Approved:` line to the `Fundamental:` note it answers, and claims before the spawn; `## Stop conditions`, the checkpoint tags and the `human:<name>` wording are unchanged.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-11-04T22:08:46Z
- **Completed:** 2026-11-04T22:32:30Z
- **Tasks:** 3
- **Files modified:** 6 (5 in the task commits, plus `deferred-items.md`)

## Accomplishments

- Only the Orchestrator asks the human. It records the answer once, and the Tech Lead's queued subtask is the wake-up. The sentence that showed the human the move note a second time is gone.
- The Tech Lead records its `Confirmed:` finding from the answer note and cites that note's id in its refs.
- Step 15 has a numbered stop precedence: an unapproved fundamental change takes the revert hand-off, the hand-off comes before the raise stop, and the gate hold binds only the move that answers its note.
- `Approved:` and `Rejected:` lines name the `Fundamental:` note they answer, and step 17 passes a change only against that approval.
- While one ticket waits on a human, Workflow 04 says the Orchestrator keeps refilling other ready work.
- `tech-lead.md` responsibility 6 and the config paragraph now agree on who asks.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `1463958d` test(41-02): add failing cases for the ask-once rule
   - `82154266` docs(41-02): ask the human once at both Workflow 04 human stops
2. **Task 2: Stop precedence, the narrowed human stop, the bound approval and the claim step**
   - `a703db5d` test(41-02): add failing cases for the stop precedence and the bound approval
   - `07cd11ef` docs(41-02): give Workflow 04 stops one order and bind each approval
3. **Task 3: The Tech Lead role and the config paragraph**
   - `34fc0b94` docs(41-02): say who asks the human in the Tech Lead role and the config

**Plan metadata:** the `docs(41-02)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `the ask-once sub-bullet names who asks, what wakes the Tech Lead and that the Tech Lead never asks again`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed because Workflow 04 had no ask-once sub-bullet yet, which is the planned behavior. The full RED run had 14 failed of 209.
- **Task 2 RED:** the target was ``D-22: the human stop applies to a proposed `Fundamental:` note only``. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target failed because the human stop still held the old trigger sentence. The full RED run had 13 failed of 218.
- **GREEN:** both tasks passed their `<verify>` commands. The tracer gate re-ran the Task 1 verify before Task 2 started, and it passed (interactive, `end-of-phase`, automated-only verify, so no checkpoint).
- **REFACTOR:** none.

## Plan Verification

- `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-role-rules.test.ts scripts/check-diff-disposition.test.ts`: 581 passed.
- `check-role-rules`, `check-diff-disposition`, `check-imperative-lexicon`, `check-foundation-guards`, `check-kit-refs`, `check-banned-claims`: each exit 0.
- `node scripts/check-uat-oracles.js`: exit 0, run after plan 41-01's Task 3 had landed.
- `npm run typecheck`, `npm run freshness` (89 committed `.js` files match a rebuild) and `npm run freshness:catalog`: each exit 0.
- Eight more test files that read the changed kit files: 561 passed.
- Acceptance: `tech-lead.md` is 3,775 B, `scripts/checkpoints.ts` has no diff from `3fbe37fb`, and no `## Stop conditions` bullet changed.

**The full suite did not finish, so it gives no result for this plan.** It ran out of disk quota on `/tmp` and hit its 540-second limit with no final summary. The failures it showed before stopping sort like this:

| Test file | Failed | Status |
|---|---|---|
| `uat-gate-exit-contract`, `harness-instance-ledger`, `context-io-writer-set`, `canonical-corpus`, `installer-fs-census` | 14 | Same 14 names in clean clones at `bfd7f9d3` and at the plan head, so not caused by this plan |
| `context-io` | 7 | Titles read Phase 31 documents. Not proven in a clean clone: both clones failed over 100 cases here, under quota pressure |
| `check-foundation-guards` | 1 | The walk finds `.js` files in the user's untracked `~/` directory. Same clone limit |
| `runnable-ref/uat-spec-integrity` | 96 | Passed when run alone |
| `install/installer-write-set` | 66, then 178 alone | **Unverified.** EDQUOT in the output; one failing case passed alone. This plan changes no installer code |

All of this is logged in `deferred-items.md`.

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md` - steps 4, 15 and 17
- `agent-factory/roles/tech-lead.md` - responsibility 6
- `agent-factory/config/factory.config.md` - the `escalate_unadjudicable_result` paragraph
- `scripts/tier-kit-text.test.ts` - the helper, the moved pins and the new cases
- `docs/audit/29-style-dispositions/41-02.md` - 99 disposition rows
- `.planning/phases/41-orchestrator-flow-guidance/deferred-items.md` - three out-of-scope test results

## Decisions Made

- `tech-lead.md` gets the matching sentence, as the plan decided from the discretion CONTEXT left open.
- Every kit sentence is applied as `41-TARGET-TEXT.md` wrote it. No gate refused one, so none was reworded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two pins the plan did not list had to move**
- **Found during:** Tasks 2 and 3
- **Issue:** case (k) requires the phrase "or when the fix changes a requirement or a rule fundamentally" in step 15, and case (x) pins the config sentence that Task 3 splits. The plan's list named neither.
- **Fix:** case (k) now pins each place to its own phrase: step 15 to the new trigger, the other three to the unchanged wording. Case (x) pins both halves of the split sentence. Neither case lost strength.
- **Files modified:** `scripts/tier-kit-text.test.ts`
- **Committed in:** `a703db5d`, `34fc0b94`

**2. [Rule 3 - Blocking] The stop-count case could not index past folded lines**
- **Found during:** Task 1
- **Issue:** the case found step 16 at `at15 + 1 + subs.length`, which is wrong once numbered lines fold into a sub-bullet.
- **Fix:** it now counts the lines between steps 15 and 16 exactly: nine sub-bullets, three numbered lines, nothing else.
- **Files modified:** `scripts/tier-kit-text.test.ts`
- **Committed in:** `1463958d`, `a703db5d`

**3. [Rule 2 - Missing critical] A hand-written row for `tech-lead.md`**
- **Found during:** Task 3
- **Issue:** the gate raised no finding for this clause, because the role-rule stand-in (D-30) admits it. The plan asks for the row anyway.
- **Fix:** one row written by hand, and the file's method section says so.
- **Files modified:** `docs/audit/29-style-dispositions/41-02.md`
- **Committed in:** `34fc0b94`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** all three stay inside the planned files, with no change of scope.

## Issues Encountered

- **The plan reads two ways on the stamp sentence.** Task 1 says to leave the `human:<name>` stamp sentences word for word, and the target text adds the answer note's id to `Stamp it ...`. The must-have asks for that id, so the target text was applied. The stamp wording and the three admission sentences are unchanged.
- **The row count is larger than the change.** The gate compares whole lines, so 68 of the 99 rows record sentences kept word for word on an edited line.
- **`/tmp` ran out of quota.** `/tmp/claude-1000` held about 9.9 GB, of which 7.0 GB belonged to the skytalix project's sessions. The two comparison clones made here (403 MB) added to the pressure and were deleted. No other session's files were touched, so the quota is still tight.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Step 4 names `node tools/grugops/claim.js claim`, which reaches host repositories only with plan 41-03. Until then the line points at a command a host does not have.
- `--level` and the claim-at-dispatch rule also need Workflow 17's text from plan 41-04.
- RUN-06 stays open for now: `requirements.ready-ids` blocks it, because sibling plans declare it too.
- A named human still owes the read of the rows in `41-02.md`.

## Self-Check: PASSED

`docs/audit/29-style-dispositions/41-02.md` exists, and all five task commits are ancestors of HEAD.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-04*
