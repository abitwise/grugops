---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 16
subsystem: workflows
tags: [workflow-20, build-request, contract, human-stop, reservation]
gap_closure: true
gap_ids: [G-45-9b]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "Workflow 20 human-stop bullet and step 13 reservation (45-13), the bootstrap floor path (45-15)"
provides:
  - "Workflow 20 step 13 reserves a request to a named human when a ticket in its `## Blocks` holds a human-stop bullet, whatever its `## Question` says"
  - "Workflow 20 step 3 marks a merged deviation or floor-conflict request in `## Question`, named in the same `edited` line"
  - "Build-request contract `## Lifecycle`: an edit never removes the `## Question` statement or a held ticket from `## Blocks`"
affects: [end-of-phase UAT, review WR-08, review WR-09]

actuals:
  tokens: 3760
  tasks: 2
  commits: 3
plan_head_before: 45718d13137d1eeb49fe7d6fb6b850223bffb70c
plan_head_after: a322c6b0299a747261d52256abec32583b7520b9

tech-stack:
  added: []
  patterns:
    - "Reserve a human decision on a mark only a named human removes, with the request text as a second mark"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-16.md
  modified:
    - agent-factory/workflows/20-upstream-sources.md
    - agent-factory/contracts/build-request.md
    - scripts/flow-guidance-text.test.ts
    - .planning/phases/45-traceability-build-requests-and-architecture-as-input/45-REVIEW-DISPOSITION.md

key-decisions:
  - "Reservation key: a ticket in the request's `## Blocks` that holds a human-stop bullet, which only a named human's word removes; the `## Question` statement is a second mark, written by step 3 (merge) and step 4 (new)"
  - "Planner addition, reversible: the contract also forbids an edit that removes from `## Blocks` a ticket holding a human-stop bullet. Without it BA/PM could edit the held ticket out and then withdraw alone. It fails closed: a request sharing a held ticket is reserved even when its own question is ordinary, until the human lifts the stop"
  - "No program check: a request file has no field for its kind (D-05), a check on `## Question` wording would be a heuristic detector, and one on ticket bullets misses probe case d2; human decision 3 chose text-only fixes. The residual that the programs accept `withdrawn, by BA/PM` on any `open` request is accepted as T-45-54"
  - "WR-07 is recorded fixed by commit cd31ae5d (with a3c57814); WR-08, WR-09 and IN-12 stay open as the human ruled"

patterns-established:
  - "Each path that can file or change a reserved request carries the same mark: filed new (step 4), merged (step 3), edited (contract Lifecycle)"

requirements-completed: [BR-03, ARCH-02]

coverage:
  - id: D1
    description: "Step 13 reserves a request whose `## Blocks` names a ticket with a human-stop bullet, whatever `## Question` says; `## Question` marks one too"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the reservation holds on every path (plan 45-16, G-45-9b, WR-07, BR-03) (a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Step 3 marks a merged deviation or floor-conflict request in `## Question`, in the same `edited` line"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the reservation holds on every path (plan 45-16, G-45-9b, WR-07, BR-03) (b)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The contract Lifecycle keeps both marks through an edit; the Done condition clause stands"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the reservation holds on every path (plan 45-16, G-45-9b, WR-07, BR-03) (c), (d)"
        status: pass
    human_judgment: false
  - id: D4
    description: "An agent refuses to withdraw or edit away a merged or edited deviation or floor-conflict request without a named human"
    requirement: ARCH-02
    verification: []
    human_judgment: true
    rationale: "Agent behaviour on the text is asserted by no program (human decision 3 family); only the live side-door re-probe at end-of-phase UAT shows it"

duration: 4min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 16: The reservation holds on every path Summary

**Workflow 20 step 13 now reserves a deviation or floor-conflict request to a named human whenever a ticket in its `## Blocks` holds a human-stop bullet; step 3 marks a merged request, and the contract forbids an edit that removes either mark (WR-07, G-45-9b)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-26T20:53:28Z
- **Completed:** 2026-11-26T20:57:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Workflow 20 step 13: the first sentence is unchanged. Three new sentences follow. A `carried`, deviation or floor-conflict request is withdrawn only on a named human's word, recorded in the `human:<name>` form. A request whose `## Blocks` names a ticket with a human-stop bullet is one, whatever its `## Question` says. A `## Question` that names the deviation or floor conflict marks one too (steps 3 and 4).
- Workflow 20 step 3: two appended sentences. A merged deviation or floor conflict also says so in `## Question`, and the same `edited` line names that change.
- Build-request contract `## Lifecycle`: one new bullet. An edit never removes a deviation or floor-conflict statement from `## Question`, and never removes from `## Blocks` a ticket that holds a human-stop bullet (Workflow 20).
- Text tests: describe "the reservation holds on every path (plan 45-16, ...)", cases (a) to (d). Disposition rows: `docs/audit/29-style-dispositions/45-16.md` (5 rows, no frozen companion).
- WR-07 is recorded fixed in 45-REVIEW-DISPOSITION.md (open 18 -> 17).

## Task Commits

1. **Task 1: Tracer, step 13 keyed on the human-stop bullet** - `cd31ae5d` (fix)
2. **Task 2: Step 3 marks a merged request, the contract keeps both marks** - `a3c57814` (fix)
3. **WR-07 disposition** - `a322c6b0` (docs)

**Plan metadata:** recorded in the SUMMARY commit (docs)

## Files Created/Modified
- `agent-factory/workflows/20-upstream-sources.md` - steps 3 and 13
- `agent-factory/contracts/build-request.md` - the `## Lifecycle` edit rule
- `scripts/flow-guidance-text.test.ts` - plan 45-16 describe, cases (a) to (d)
- `docs/audit/29-style-dispositions/45-16.md` - 5 disposition rows
- `.planning/phases/45-.../45-REVIEW-DISPOSITION.md` - WR-07 fixed

## Decisions Made
- The reservation keys on the human-stop bullet on a ticket in `## Blocks`. BA/PM does not control it through the request text. The `## Question` statement stays a second mark.
- The planner's `## Blocks` edit rule is kept. It fails closed: a request that shares a held ticket is reserved too, until the human lifts the stop.
- No program check was added (D-05 closed key set, no heuristic detector, probe case d2, human decision 3). T-45-54 is the accepted residual.
- WR-08, WR-09 and IN-12 stay open as the human ruled.

## Deviations from Plan

None - plan executed exactly as written. `npm run freshness:catalog` reported no drift (27 pages, 0 differences), so `docs/reference/README.md` and `docs/reference/agents/ba-pm.md` were not regenerated or committed.

## Issues Encountered
None.

## Verification
- `npx vitest run scripts/flow-guidance-text.test.ts`: 203 passed. The 45-10, 45-13 and 45-15 cases pass unchanged.
- checkpoints, build-request-model, trace-instructions, check-imperative-lexicon, check-diff-disposition and generate-catalog tests: 614 passed.
- Passed: freshness (97 .js fresh), freshness:runnable-embeds and freshness:catalog.
- Gates: imperative-lexicon, banned-claims, claim-anchors, check-kit-refs, diff-disposition, audit-register, foundation-guards and validate-agent-factory all printed ALL CHECKS PASSED.
- No program file changed: `git diff --quiet` over `scripts/build-request-model.ts`, its `.js`, the runnable embeds and `scripts/checkpoints.ts` succeeds. `WORKFLOW_STOP_BULLET_COUNT` stays 59.
- Every acceptance grep of both tasks matched its target.
- The full suite was not run. The orchestrator runs it after this last wave.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 45 gap round complete (45-15, 45-16). The orchestrator runs the full suite next.
- End-of-phase UAT holds the live side-door re-probe (Task 2 `<human-check>`), the 45-15 bootstrap probe and the UAT test 9 re-read.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
