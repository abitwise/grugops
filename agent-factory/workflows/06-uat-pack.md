---
kind: workflow
order: 6
cadence: both
---
# Workflow: UAT pack

## When to use
When a feature is complete and a named human must accept it before release. grug speak business now — turn the acceptance criteria into scenarios a person can sign off. The change flows feature complete -> UAT Planner -> BA/PM validation -> QE validation -> UAT pack.

## Agents involved
- UAT Planner — assembles the scenarios, test data, pass/fail criteria, signoff checklist, and known limitations (`uat-handoff.md`).
- BA/PM — validates the business acceptance against the original value and scope.
- QE/E2E — validates that the test coverage backs the scenarios.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The completed feature and the `security-nfr-handoff.md` that gated it.
- The ticket's acceptance criteria.
- `agent-factory/checklists/uat-checklist.md` — the UAT gate this role works through.

## Steps
1. The UAT Planner assembles the UAT pack — business scenarios, test data, pass/fail criteria, the signoff checklist naming the human role, and the known limitations — into `agent-factory/handoffs/uat-handoff.md`, working through `agent-factory/checklists/uat-checklist.md`.
2. BA/PM validates the business acceptance: do the scenarios cover the user value and scope.
3. QE/E2E validates coverage: do the tests back the scenarios, and what gaps remain.
4. The named human signs off the scenarios; the ticket moves on toward release.

## Board moves
On `plans/board.md`, the UAT Planner moves the ticket `Ready for UAT -> In UAT` to begin acceptance, and owns the `In UAT` exit: once the named human signs off, the ticket moves to `Ready to Release` (or directly to `Done` in lean mode).

## Handoffs produced
Under `agent-factory/handoffs/`: `uat-handoff.md` (UAT Planner).

## Trace updates
Append to `plans/traceability.md`: the `UAT` link and the human signoff result against the ticket row, and update `Status`, so acceptance traces back to the test row and forward to the release row.

## Metrics emitted
Record `Lead time` in `plans/metrics.md` as the ticket clears acceptance.

## Stop conditions
- The acceptance criteria are missing or ambiguous — stop and route the ticket back; never self-sign or fake a pass. A named human signoff is required.

## Done condition
The scenarios, test data, pass/fail criteria, signoff checklist, and known limitations exist; the named human has signed off; the ticket moves to `Ready to Release` (or to `Done` in lean mode).

## Commit
Commit the artifacts this workflow wrote (the `uat-handoff.md` pack, the recorded human signoff, the board move, the metrics, and the updated traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/uat-pack-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
