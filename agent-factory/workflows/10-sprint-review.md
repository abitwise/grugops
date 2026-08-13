---
kind: workflow
order: 10
cadence: scrum
---
# Workflow: Sprint review

## When to use
At the end of a sprint, when the box closes and the team accepts what got done. Sprint review is a `cadence=scrum` ceremony — the Orchestrator selects it only when `config.cadence=scrum`; in kanban it never fires. grug show the work, count what is real, note what slid. The review flows: the active sprint -> UAT Planner + BA/PM (+ QE/E2E) -> validated outcomes and demo notes -> review notes appended to `plans/sprints/SPRINT-xx.md`.

## Agents involved
- UAT Planner — assembles what reached `Done` and frames the demo from the business scenarios.
- BA/PM — validates the delivered work against the original acceptance criteria, value, and scope.
- QE/E2E — confirms the tests back what is being accepted and names any remaining gaps.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The active `plans/sprints/SPRINT-xx.md` written at `08-sprint-planning.md` — the committed goal and items.
- The items that reached the `Done` column on `plans/board.md`.
- The ticket acceptance criteria for each committed item.

## Steps
1. Assemble what reached the `Done` column against the sprint's committed list (UAT Planner).
2. Validate each delivered item against its acceptance criteria — accept only what genuinely met the bar (BA/PM). QE/E2E confirms the coverage.
3. Draft the demo and release notes for what was accepted.
4. List the carry-over — every committed item that did not reach `Done` — with a one-line reason for each.
5. Append the review notes to `plans/sprints/SPRINT-xx.md`. Fill **Velocity** (points completed), the **Carried out** entries (with reasons), and the **Notes for retro**. Do not start a new file.

## Board moves
On `plans/board.md`, the review confirms items already in the frozen `Done` column — it introduces no new transition. Carry-over items stay where they sit (or return to `Ready` at the next planning), recorded as Carried out in the sprint file.

## Output
None new. The sprint file `plans/sprints/SPRINT-xx.md` is the artifact — the review notes are appended to it. The validated outcomes are recorded as typed notes per Workflow 16.

## Trace updates
Confirm the reviewed tickets' rows in `plans/traceability.md` are complete for each accepted item — `UAT`, `Status`, and (where released) the release link. Do not author new rows here.

## Metrics emitted
Record `Velocity` in `plans/metrics.md` — the scrum size points completed in this sprint. Take the value from the accepted items and write it back into the sprint file's Velocity field.

## Stop conditions
- A committed item's acceptance is ambiguous or unmet — do not mark it `Done`. Flag it as carry-over with a reason, and leave acceptance to a named human. Never self-sign or fake a pass.

## Done condition
The review notes are appended to `plans/sprints/SPRINT-xx.md`. Velocity is filled, the Carried out items carry reasons, and the demo / release notes and Notes-for-retro are captured. Every accepted item genuinely met its acceptance criteria.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/sprint-review-<id>`), then `type(scope): summary`. The artifacts are the review notes appended to `plans/sprints/SPRINT-xx.md`, the velocity metric and the confirmed traceability rows. Never merge, never deploy; humans hold both.
