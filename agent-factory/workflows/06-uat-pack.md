---
kind: workflow
order: 6
cadence: both
---
# Workflow: UAT pack

## When to use
When a feature is complete and a named human must accept it before release. grug speak business now — turn the acceptance criteria into scenarios a person can sign off. The change flows feature complete -> UAT Planner -> BA/PM validation -> QE validation -> UAT pack.

## Agents involved
- UAT Planner — assembles the scenarios, test data, pass/fail criteria, signoff checklist, and known limitations.
- BA/PM — validates the business acceptance against the original value and scope.
- QE/E2E — validates that the test coverage backs the scenarios.

Each role reads the shared verified context before it works and records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The completed feature and the Security/NFR scan result that gated it (read from the shared verified context per Workflow 16).
- The ticket's acceptance criteria.
- `agent-factory/checklists/uat-checklist.md` — the UAT gate this role works through.

## Steps
1. The UAT Planner assembles the UAT pack — business scenarios, test data, pass/fail criteria, the signoff checklist naming the human role, and the known limitations — recording the pack as typed notes per Workflow 16, working through `agent-factory/checklists/uat-checklist.md`.
2. BA/PM validates the business acceptance: do the scenarios cover the user value and scope.
3. QE/E2E validates coverage: do the tests back the scenarios, and what gaps remain.
4. The named human signs off the scenarios; the ticket moves on toward release.

## Board moves
On `plans/board.md`, the UAT Planner moves the ticket `Ready for UAT -> In UAT` to begin acceptance, and owns the `In UAT` exit: once the named human signs off, the ticket moves to `Ready to Release` (or directly to `Done` in lean mode).

## Trace updates
Append to `plans/traceability.md`: the `UAT` link and the human signoff result against the ticket row, and update `Status`, so acceptance traces back to the test row and forward to the release row.

## Metrics emitted
Record `Lead time` in `plans/metrics.md` as the ticket clears acceptance.

## Stop conditions
- The acceptance criteria are missing or ambiguous — stop and route the ticket back; never self-sign or fake a pass. A named human signoff is required.

## Done condition
The scenarios, test data, pass/fail criteria, signoff checklist, and known limitations exist; the named human has signed off; the ticket moves to `Ready to Release` (or to `Done` in lean mode).

## Commit
Commit the artifacts this workflow wrote (the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics, and the updated traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/uat-pack-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
