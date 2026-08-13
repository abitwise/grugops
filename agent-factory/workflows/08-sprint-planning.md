---
kind: workflow
order: 8
cadence: scrum
---
# Workflow: Sprint planning

## When to use
At the start of a sprint, when the team works in time-boxed iterations. Sprint planning is a `cadence=scrum` ceremony — the Orchestrator selects it only when `config.cadence=scrum`; in kanban it never fires. grug pick the work for the box, write it down, then build. The plan flows: a stocked `Ready` column -> Orchestrator + BA/PM -> a committed sprint goal -> `plans/sprints/SPRINT-xx.md`.

## Agents involved
- Orchestrator — reads `config.cadence` and capacity, pulls committed items from `Ready` by priority up to capacity, enforces the Definition of Ready before each pull.
- BA/PM — frames the one-sentence sprint goal and confirms each pulled item is Ready (value, scope, acceptance, size, priority).

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A stocked `Ready` column on `plans/board.md` — enough sized, prioritized, DoR-met work to fill the box.
- `.grugops/factory.config.json` for `cadence` and capacity (`sprint_length_days`, default 10).
- `agent-factory/checklists/definition-of-ready.md` — the gate each committed item must meet.

## Steps
1. Set a one-sentence sprint goal — the outcome the box delivers (BA/PM).
2. Pull from the `Ready` column by priority, up to capacity, until the box is full. The Orchestrator respects `sprint_length_days` and the Definition of Ready.
3. Confirm each pulled item is Ready against `agent-factory/checklists/definition-of-ready.md`. If an item is not Ready, leave it in `Ready` and do not commit it.
4. Write `plans/sprints/SPRINT-xx.md` in the §6.2 format — reproduce the field list exactly:
   - Record **Goal** as a one-sentence outcome.
   - Record **Dates** as start -> end.
   - Record **Capacity** as points or ticket count.
   - Record **Committed** as the pulled items, each with its size.
   - Record **Added mid-sprint** with the reason (filled as the sprint runs).
   - Record **Carried out** with the reason (filled at close).
   - Record **Velocity** as points completed (filled at review).
   - Record **Burndown** as remaining at day 1..n.
   - Record **Notes for retro** as anything to carry into `11-retro.md`.

## Board moves
On `plans/board.md`, committed items leave the `Ready` column into the sprint commitment recorded in `plans/sprints/SPRINT-xx.md`. The Orchestrator pulls each forward into `Ready for Dev` as the box runs, respecting WIP limits. No new column is introduced — the sprint file is the scrum overlay on top of the same board.

## Output
The primary output is `plans/sprints/SPRINT-xx.md` (the sprint file). The sprint goal and committed list are recorded as typed notes per Workflow 16 for the team.

## Trace updates
None new beyond the committed tickets' existing rows. Each committed ticket already carries its row in `plans/traceability.md`; sprint planning commits to those rows, it does not author new code/test/UAT links.

## Metrics emitted
Record `Velocity` in `plans/metrics.md` — the scrum size points per sprint, measured against this committed set; the actual count is filled at sprint review.

## Stop conditions
- The `Ready` column is too thin to fill capacity — STOP and run `07-backlog-refinement.md` first to stock `Ready`. Do not invent or commit work that is not Ready.
- An item fails the Definition of Ready — leave it in `Ready` and do not commit it; never fake readiness.

## Done condition
`plans/sprints/SPRINT-xx.md` is written with the Goal, Dates, Capacity, and the Committed list (each item sized). The Velocity / Burndown / Notes-for-retro fields are present to be filled as the box runs. The sprint goal is one sentence and every committed item met the Definition of Ready.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/sprint-planning-<id>`), then `type(scope): summary`. The artifacts are the `plans/sprints/SPRINT-xx.md` file, the sprint-plan notes recorded per Workflow 16, the board moves and the velocity metric. Never merge, never deploy; humans hold both.
