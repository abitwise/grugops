# Example: Sprint cycle

> Illustrative run — expected output, not a captured session

This walks one scrum sprint through the ceremony workflows: `07-backlog-refinement` stocks
`Ready`, `08-sprint-planning` sets a goal, the Tech Lead scores each committed ticket and names
an engineer level, `09-daily-sweep` keeps the board honest, and `10-sprint-review` and `11-retro`
read the metrics. The sample is a TypeScript portfolio app with a Vue front end and a Fastify API.
IDs, pull request numbers, note ids, names and dates are placeholders. The flow is
`07-backlog-refinement -> 08-sprint-planning -> Tech Lead -> 04-ticket-to-pr per ticket ->
09-daily-sweep -> 10-sprint-review -> 11-retro`.

---

## Input

On Claude Code, start the session from the sample repo with the Orchestrator as the main thread:

```text
claude --agent grugops-orchestrator
```

Other hosts start differently; see the start table in `README.md`. Then type the request:

```text
refine the backlog and plan the next sprint; the goal is to show where the portfolio's money sits
```

## Orchestrator decision

The Orchestrator reads `.grugops/factory.config.json` (`mode=lean`, `cadence=scrum`,
`sprint_length_days=10`, `checkpoints.open_pr=block`) and `memory-bank/plans/board.md`. `Ready`
holds too little to fill a sprint, so refinement runs first. The decision for the planning step:

```markdown
# Orchestrator Decision
## Request type
sprint-planning — commit a sprint goal and a set of Ready tickets.
## Mode/Cadence/Checkpoints
mode=lean · cadence=scrum · checkpoints.open_pr=block
## Activated agents
BA/PM (refinement, sprint goal, Definition of Ready); Orchestrator (pull up to capacity)
## Why
Ready is thin. Refinement stocks it, then planning fills a ten-day sprint from it.
## Required inputs
the top of Backlog; definition-of-ready.md; factory.config.json (cadence, sprint_length_days)
## Workflow
08-sprint-planning.md (07-backlog-refinement.md runs first)
## Board moves
Backlog -> Ready for items that meet the Definition of Ready; committed items stay in Ready
## Expected notes
BA/PM: one refinement note per ticket with the epic and feature refs; the sprint goal and the
committed list.
## Stop conditions
Ready too thin to fill capacity (run 07 first); an item fails the Definition of Ready
## Next action
Queue a refinement subtask for BA/PM.
```

## Refinement and planning

BA/PM takes the top of `Backlog`, shapes each item with testable acceptance criteria, sizes it
(`XS`–`XL`), sets its priority (`P0`–`P3`) and checks it against
`agent-factory/checklists/definition-of-ready.md`. Three items meet the bar and move to `Ready`.
Size and priority go in each ticket's frontmatter under `memory-bank/plans/tickets/`. BA/PM
publishes one `decision` note per ticket, with the epic and feature ids on the refs:

```text
$ node tools/grugops/note.js add abc-015 --kind decision --by ba-pm --confidence high \
    --ref ABC-015 --ref EPIC-004 --ref FEAT-010 --body-file /tmp/abc-015-refine.md
noted abc-015 20260605T100500Z-ba-pm-decision-18585c28
```

Planning then writes `memory-bank/plans/sprints/SPRINT-12.md`, and BA/PM publishes the goal and
the committed list as a `decision` note:

```markdown
# SPRINT-12
## Goal
Show the user where the portfolio's money sits.
## Dates
2026-06-08 -> 2026-06-19
## Capacity
7 points
## Committed
- ABC-014  Asset allocation chart   (size: S / 2)
- ABC-015  Holdings CSV export      (size: S / 2)
- ABC-016  Rebalance suggestion     (size: M / 3)
## Added mid-sprint
## Carried out
## Velocity
(filled at review)
## Burndown
## Notes for retro
```

The committed tickets stay in `Ready`; the sprint file records the commitment. As the sprint runs,
each ticket passes through analysis and design and reaches `Ready for Dev`.

## The Tech Lead scores each ticket

Before an engineer starts, the Orchestrator queues a plan subtask for each ticket in
`Ready for Dev` and claims it for the Tech Lead. The Tech Lead reads the ticket's shared context
(`node tools/grugops/note.js read abc-014`), writes the dev tasks, and scores them with
`agent-factory/checklists/complexity-rubric.md`:

| Factor | ABC-014 Asset allocation chart | ABC-015 Holdings CSV export |
|--------|-------------------------------|-----------------------------|
| F1 files touched | 1: `AllocationChart.vue`, its test, `PortfolioView.vue` | 1: the route, its test, `src/app.ts` |
| F2 spec completeness | 0: files, change and test cases named | 0: files, change and test cases named |
| F3 risk surface | 0: reads data the view already loads | 1: public interface, a new HTTP route |
| F4 novelty | 0: same shape as `PerformanceChart.vue` | 0: same shape as `src/routes/holdings.ts` |
| F5 test burden | 1: new component tests | 1: new route tests |
| F6 blast radius | 0: one view | 0: one module, no caller yet |
| Sum and level | 2, **junior** | 3, **mid** (F3 = 1 rules out junior) |

`ABC-016` scores F2 = 2: the rule that picks a rebalance suggestion is still open. A ticket with
F2 = 2 is not dispatchable, so it goes back to `In Design` for the Architect and gets no level.

The Tech Lead publishes the scores, the level and the dev tasks as a `decision` note, and writes
a short `## Tech Lead plan` section into the ticket body, here
`memory-bank/plans/tickets/ABC-014.md`:

```text
$ node tools/grugops/note.js add abc-014 --kind decision --by tech-lead --confidence high \
    --ref ABC-014 --body-file /tmp/abc-014-plan.md
noted abc-014 20260608T093000Z-tech-lead-decision-a34f0a7c
```

```markdown
## Tech Lead plan
- Level: junior. Adapter: `grugops-software-engineer-junior`. Sum: 2. Note: 20260608T093000Z-tech-lead-decision-a34f0a7c
- Scope: the allocation chart component, its tests, and its place on the portfolio view.
- Dropped: a drill-down per asset class; nobody asked for it.
- Floor: the acceptance criteria in this ticket; the existing portfolio view tests stay green.
```

`ABC-015` gets the same record with level mid and the adapter `grugops-software-engineer-mid`.

## Each ticket goes to a pull request

Each scored ticket then follows `04-ticket-to-pr.md`, as `examples/03-ticket-to-pr.md` shows in
full. The Orchestrator moves the ticket to `In Development` and claims the dev subtask for the
adapter the plan names:

```text
$ node tools/grugops/claim.js claim abc-014-dev --by grugops-software-engineer-junior --level junior
claimed abc-014-dev by grugops-software-engineer-junior
```

On Claude Code it spawns that adapter by name with the task reference only, and never re-decides
the level. On the other hosts the Software Engineer role reads the level from `## Tech Lead plan`.
The engineer publishes its work as an `observation` with the pull request and files on the refs.
QE/E2E records its result as a `claim` at `UNKNOWN - verify`, because this sample has a scripted
install and no gate stamp exists here. The gate publishes `READY_FOR_HUMAN_REVIEW` and stops at
the pull request. `checkpoints.open_pr=block`: Sam, the maintainer, reviews and merges each pull
request. No agent merges.

`ABC-015` bounced once: QE/E2E found that a holding name with a comma broke the CSV, so the ticket
went back from `In Review` to `In Development` before it passed.

## The daily sweep

The Orchestrator runs `09-daily-sweep.md` each day. It renders the trace, then runs the state
check, which reads the state files and writes nothing. On day 3 the check finds a problem: the
engineer added a second `_Updated:` line to the board instead of replacing the first.

```text
$ node tools/grugops/trace-render.js .
Rendered the trace: 4 task(s) and 11 note(s) read; skipped notes: unparseable 0, unopenable 0, not-a-regular-file 0, above-ceiling 0, vanished 0, unsealed 0; unreadable tasks 0; 0 file(s) written, 0 file(s) removed.
$ node tools/grugops/state-check.js .
FINDING  memory-bank/plans/board.md:3: 2 lines, budget 1 lines (BUDGETS.boardUpdatedLines)
...
```

The state check exits 1. The Orchestrator keeps one `_Updated:` line, replaced in place, and runs
the check again:

```text
$ node tools/grugops/state-check.js .
...
No findings.
```

Then it reads the shared context for each ticket in flight and checks each board row against it.
The board after the day 3 sweep:

```text
_Updated: 2026-06-10 by Orchestrator_

## In Design (WIP 1/2)
- [ABC-016] Rebalance suggestion  (owner: Architect/Design, since: 2026-06-09)

## In Development (WIP 1/3)
- [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-09)

## In Review (WIP 1/3)
- [ABC-015] Holdings CSV export  (owner: QE/E2E, since: 2026-06-10)
```

The sweep updates `Cycle time`, `WIP` and `Blocked time` in `memory-bank/plans/metrics.md`, adds a
dated entry to `memory-bank/60-progress.md`, and reports:

```text
Sweep 2026-06-10 — done: none · next: finish ABC-015 in review before a new pull · blocked: none
```

## Sprint review

At the end of the sprint the UAT Planner lists what reached `Done` against the committed list.
BA/PM checks each item against its acceptance criteria, and QE/E2E names the tests behind it.
`ABC-014` and `ABC-015` are merged and accepted. `ABC-016` is still `In Design` and is carried out
with its reason. The review notes go into `SPRINT-12.md`:

```markdown
## Carried out
- ABC-016  Rebalance suggestion — the suggestion rule still needs a design decision (F2 = 2)
## Velocity
4 points (2 of 3 committed accepted)
## Notes for retro
ABC-016 reached the sprint with its approach still open. ABC-015 went back to development once.
```

`memory-bank/plans/metrics.md` now reads, for this sprint:

```text
| Throughput | tickets reaching Done per period | 2 | SPRINT-12 |
| Cycle time | Ready for Dev -> Done, median | 3 days | SPRINT-12 |
| Rework rate | tickets bounced back a column (e.g. Review -> Development) | 1 of 2 | SPRINT-12 |
| Velocity | (scrum) size points per sprint | 4 | SPRINT-12 |
```

## Retro

The Factory Coach reads `memory-bank/plans/metrics.md` and the board history, and ties each waste
to a value:

- 3 of 7 committed points carried out, because `ABC-016` was committed before anyone scored its
  approach.
- `Rework rate` 1 of 2: a CSV quoting case was found in review, not in the dev tasks.

It publishes the metrics snapshot, the two wastes and Keep / Stop / Start as `decision` notes,
and creates one improvement ticket tagged `factory` in `Backlog`: `ABC-017 — Score each candidate
ticket's F2 during sprint planning`. The retro note carries `ABC-017` on its refs.

## The rendered trace

The trace for each ticket comes from the refs on its published notes. The rendered
`memory-bank/plans/traceability/ABC-015.md`, shown here as output:

```markdown
<!-- GENERATED by grugops trace-render from published note refs — do not hand-edit -->
# Trace: ABC-015

## Requirement

- EPIC-004
- FEAT-010

## Code

- #51
- src/routes/holdings-csv.ts

## Tests

- src/routes/holdings-csv.test.ts

## UAT

None recorded.

## Release

None recorded.
```

The index `memory-bank/plans/traceability.md` keeps one line per ticket, such as
`| ABC-015 | [ABC-015](traceability/ABC-015.md) |`. This is a lean sprint with no UAT run and no
release, so those sections read `None recorded.`

## Done

The sprint is done: `SPRINT-12.md` carries its velocity and its carried-out item with a reason,
the board shows `ABC-014` and `ABC-015` in `Done`, the metrics hold the values as they stand, and
the retro produced one improvement ticket. Sam merged each pull request. No agent merged, and no
agent deployed.
