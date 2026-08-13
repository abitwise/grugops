# Board
_Updated: <ISO date> by <role>_

<!--
  FORMAT — read before you move a ticket. (clear voice; this is a technical file, not a role prompt.)

  plans/board.md is grugops's SINGLE SOURCE OF WIP TRUTH. Every ticket sits in exactly one
  column. Each column has a definition (ENTRY MEANS), an EXIT OWNER (the role that signs off
  to move the ticket out), and a WIP limit (max tickets allowed in that column at once). The
  Orchestrator refuses to pull new work past a WIP limit without a written reason.

  WIP NUMBERS COME FROM CONFIG. The per-column limits shown in each heading are the lean
  DEFAULTS, sourced from `agent-factory/config/factory.config.json#wip_limits`. Edit the dial,
  not this file, to change a limit — then update the heading to match. The two must agree.
  In lean mode the In Security/NFR and Ready to Release columns may be skipped unless a
  trigger fires (the columns still exist; they just stay empty).

  HEADING FORMAT (spec §6.1): each column is an H2 heading carrying its live/limit WIP count,
  e.g. `## In Development (WIP 1/3)` — the left number is how many tickets are in the column
  now, the right number is the limit from config. Unlimited columns read `(WIP unlimited)`;
  Blocked is visible and time-tracked (no WIP limit) and reads `(visible, time-tracked)`.

  TICKET ROWS: this board ships EMPTY — column structure only, ZERO live ticket rows. It is a
  clean append target. Roles append a one-line ticket row under the matching column as work
  moves. Example row shape (this is a comment, NOT a live row — the generic `ABC-` prefix shows format only):

    ## In Development (WIP 1/3)
    - [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)

    ## In Review (WIP 1/3)
    - [ABC-012] Portfolio FX conversion  (PR: #41, QE: running)

  BOARD <-> TICKET CONTRACT: each ticket file (`plans/tickets/<prefix>-xxx.md`) carries a
  status line in its front matter so the board column and the ticket never disagree (spec §6.1).
  The shape (example only, NOT a live ticket):

    status: in-development
    column: In Development
    size: M
    priority: P2
    epic: EPIC-003
    feature: FEAT-007

  A ticket's `column:` value MUST equal the board column it sits under, and `status:` is the
  kebab-case form of that column. The validator can check the two for drift.

  CADENCE: this board ships the Kanban columns (the default cadence, `cadence=kanban`). The
  scrum overlay (sprint goal / committed backlog / burndown) lives in `plans/sprints/SPRINT-xx.md`
  and is NOT pre-rendered here. The sizing, priority, and Blocked conventions below are shared
  by BOTH cadences.
-->

## Columns (spec §6.1)

The 13 columns in flow order, each with what entry means, who owns the exit, and the WIP
limit (default from `factory.config.json#wip_limits`):

| Column | Entry means | Exit owner | WIP (default) |
|--------|-------------|-----------|---------------|
| Backlog | idea captured | BA/PM | unlimited |
| Ready | Definition of Ready met | BA/PM | 8 |
| In Analysis | behavior being mapped | System Analyst | 2 |
| In Design | structure/ADR being decided | Architect/Design | 2 |
| Ready for Dev | analysis and design recorded as typed notes per Workflow 16, ticket sized | Orchestrator | 6 |
| In Development | code being written | Software Engineer | 3 (== max parallel tickets) |
| In Review | PR + QE running | QE/E2E | 3 |
| In Security/NFR | risk/compliance gate | Security/NFR | 2 |
| Ready for UAT | gates passed | UAT Planner | 4 |
| In UAT | business acceptance | UAT Planner | 4 |
| Ready to Release | UAT signed off | Release Manager | 4 |
| Done | merged + released (or merged, lean) | Orchestrator | unlimited |
| Blocked | waiting on a dependency/decision | (raiser) | visible, time-tracked |

WIP limits come from config (`wip_limits`); the numbers above are the lean defaults.

## Backlog (WIP unlimited)

## Ready (WIP 0/8)

## In Analysis (WIP 0/2)

## In Design (WIP 0/2)

## Ready for Dev (WIP 0/6)

## In Development (WIP 0/3)

## In Review (WIP 0/3)

## In Security/NFR (WIP 0/2)

## Ready for UAT (WIP 0/4)

## In UAT (WIP 0/4)

## Ready to Release (WIP 0/4)

## Done (WIP unlimited)

## Blocked (visible, time-tracked)

## Conventions

These sizing, priority, and Blocked conventions are defined ONCE here and apply to BOTH
cadences (kanban and scrum) — BOARD-04. The Phase-4 scrum cadence references this same block;
it is not redefined per cadence.

### Sizing (spec §6.3)

T-shirt size maps to points: `XS=1, S=2, M=3, L=5, XL=8`. **XL must be split** — the
Orchestrator enforces "no XL into dev". BA/PM sizes (and prioritizes) at refinement. The
sizing scheme is set in config (`sizing`, default `tshirt`).

### Priority (spec §6.3)

`P0` (drop everything) `..` `P3` (someday). Use WSJF instead if config says so
(`priority_scheme`, default `P0-P3`).

### Blocked policy (spec §6.4)

- Any agent can move a ticket to Blocked with a `blocked-by` reason and a date.
- The daily sweep counts blocked time and escalates anything blocked past the config
  threshold `blocked_escalation_days` (default 2).
- A blocker is a decision, a dependency, or a missing input. Name it. Assign a human if needed.
