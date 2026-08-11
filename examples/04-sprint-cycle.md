# Example: Sprint cycle

> Illustrative run — expected output, not a captured session

This narrates a full scrum cadence end to end: backlog refinement stocks `Ready`, sprint
planning commits a goal, two tickets are driven through `04-ticket-to-pr`, the daily sweep
keeps the board honest, sprint review counts what is real, and the retro mines the metrics.
IDs like `ABC-014` are obvious placeholders, not real artifacts. The flow renders the frozen
ceremonies `07-backlog-refinement -> 08-sprint-planning -> 04-ticket-to-pr (x2) ->
09-daily-sweep -> 10-sprint-review -> 11-retro`.

---

## Input

A team running `cadence=scrum` opens the sprint by asking the Orchestrator to refine and plan:

```text
/grugops "refine the backlog and plan the next sprint — goal is to ship FX conversion"
```

## Orchestrator decision

The Orchestrator reads `config.cadence=scrum`, classifies refinement, then planning, and emits
its inline decision for the planning step:

```markdown
# Orchestrator Decision
## Request type
sprint-planning — pull a committed set from a stocked Ready column into a sprint goal.
## Mode/Cadence/Autonomy in effect
mode=enterprise · cadence=scrum · autonomy=pr
## Activated agents
BA/PM (sprint goal + DoR), Orchestrator (pull to capacity)
## Why
grug pick the work for the box, write it down, then build.
## Required inputs
a stocked Ready column; factory.config.json (cadence + sprint_length_days);
definition-of-ready.md
## Workflow
08-sprint-planning.md  (refinement ran first via 07-backlog-refinement.md)
## Board moves
committed items leave Ready into the SPRINT-12 commitment; Orchestrator pulls each into
Ready for Dev as the box runs
## Expected notes
BA/PM publishes the refinement pass into the shared verified context (Workflow 16);
plans/sprints/SPRINT-12.md
## Stop conditions
Ready too thin to fill capacity (run 07 first); an item fails Definition of Ready
## Next action
write plans/sprints/SPRINT-12.md with the one-sentence goal and the committed list
```

## Refinement (07) and planning (08)

BA/PM pulls the top of `Backlog`, sizes (`XS`–`XL`) and prioritizes (`P0`–`P3`), splits any
`XL` (`SPLIT_REQUIRED` — no XL into dev), and promotes DoR-met items into `Ready`, publishing
the refinement pass as a typed note in the shared verified context (Workflow 16) so planning
starts from the verified state rather than from a summary someone passed it. Planning then
commits to a goal and writes the sprint file (representative snippet, not the full §6.2 field
list):

```markdown
# SPRINT-12
## Goal
Ship multi-currency FX conversion on the portfolio view.
## Dates
2026-06-08 -> 2026-06-19
## Capacity
8 points
## Committed
- ABC-014  Asset allocation chart        (size: M / 3)
- ABC-012  Portfolio FX conversion        (size: M / 3)
## Velocity
(filled at review)
```

## Board snapshots

**Day 2** — both committed tickets are in flight. The board uses the real frozen column
headings; `In Development` runs against its WIP limit of 3:

```text
## Ready for Dev (WIP 0/6)

## In Development (WIP 1/3)
- [ABC-014] Asset allocation chart   (owner: Software Engineer, since: 2026-06-09)

## In Review (WIP 1/3)
- [ABC-012] Portfolio FX conversion  (PR: <PR-link>, QE: running)
```

**Day 7** — both tickets cleared the gate and merged; the board reconciled by the daily sweep:

```text
## In Development (WIP 0/3)

## In Review (WIP 0/3)

## Done (WIP unlimited)
- [ABC-012] Portfolio FX conversion  (PR: <PR-link>, merged)
- [ABC-014] Asset allocation chart   (PR: <PR-link>, merged)
```

## Tickets through ticket-to-pr (04)

Each committed ticket follows the frozen `04-ticket-to-pr` path —
`Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. The two roles exchange
nothing directly. The Orchestrator enqueues the ticket's subtasks; the Software Engineer claims
one (`17-task-claim.md`) and publishes its implementation result into that ticket's shared
verified context; QE/E2E pulls that same context and publishes its own verdict back into it
(`16-context-read-write.md`); and the gate (per `05-pr-quality-gate.md`) returns
`READY_FOR_HUMAN_REVIEW`. A verdict asserted as measured is a `finding`, and it is admitted only
against the gate's own green `§14-gate#<id>` stamp — the gate is the root of that chain, so no
role can self-certify a pass. autonomy=pr — the agent opens a branch and a PR; it never merges.

## Daily sweep (09)

The Orchestrator runs `09-daily-sweep` to reconcile every column against the real ticket
status, escalate anything blocked past `blocked_escalation_days`, and recommend the next pull
within WIP. It emits the flow metrics from the frozen set — `Cycle time`, `WIP`, and
`Blocked time` — into `plans/metrics.md`, and produces a short done / next / blocked report:

```text
Sweep 2026-06-12 — done: ABC-012 merged · next: pull nothing (WIP healthy) · blocked: none
```

## Review (10), retro (11), and the velocity line

Sprint review validates each delivered item against its acceptance criteria and writes
`Velocity` back into `SPRINT-12.md`. Both committed tickets were accepted, so the velocity /
metrics line (drawn only from the frozen §6.5 vocabulary — no invented metric) reads:

```text
SPRINT-12 closed — Velocity 6 pts (2/2 committed accepted) · Throughput 2 · Cycle time 3.5d median
```

The retro (`11-retro`) reads `plans/metrics.md`, names the top 1–3 wastes from the values
(e.g. a `Cycle time` spike caused by a slow review), and publishes the metrics snapshot and
Keep / Stop / Start as typed notes in the shared verified context (Workflow 16), plus 1–3
improvement tickets tagged `factory` into `Backlog`. grug look at numbers, not vibes.

## Trace and done

Each accepted ticket's row in `plans/traceability.md` is confirmed complete through `Tests`
and `Status`:

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-012 | Portfolio FX conversion | EPIC-003 | FEAT-007 | NFR-002 | `<PR-link>` / src/fx/* | fx.spec.ts | — | — | Done |
| ABC-014 | Asset allocation chart | EPIC-003 | FEAT-008 | — | `<PR-link>` / src/alloc/* | alloc.spec.ts | — | — | Done |

The sprint is done: `SPRINT-12.md` carries its Velocity, the board shows both tickets in
`Done`, the metrics are current, and the retro produced its improvement tickets — every
finding cites a real value, none was faked.
