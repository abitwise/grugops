# Board
_Updated: <ISO date> by <role>_

<!--
  FORMAT — read before you move a ticket. Clear voice: this is a technical file, not a role prompt.

  plans/board.md is grugops's SINGLE SOURCE OF WIP TRUTH. Every ticket sits in exactly one column.
  Each column has a definition (ENTRY MEANS), an EXIT OWNER (the role that signs off to move the
  ticket out), and a WIP limit. The Orchestrator refuses to pull work past a limit without a
  written reason.

  THE NORMATIVE GRAMMAR IS `agent-factory/contracts/board.md`, and its only sanctioned reader is
  `scripts/board-model.ts`. What follows is the short agent-facing copy of that contract. Where the
  two disagree the contract wins, and this block is the thing to fix.

  HEADINGS. A column heading is an H2 whose suffix is one of exactly THREE forms:

    ## In Development (WIP 1/3)         limited   — live count left, config limit right
    ## Backlog (WIP unlimited)          unlimited
    ## Blocked (visible, time-tracked)  blocked   — this exact name, and no WIP limit

  An H2 with any other suffix opens NO column: `## Columns (spec §6.1)` and `## Conventions` are
  ordinary sections, not empty columns. An H3 never opens a column. A heading starts at column one.

  ROWS. A ticket row is `- [<ID>] <title>`, and everything after the title is opaque:

    - [ABC-014] Asset allocation chart  (owner: Software Engineer, since: 2026-06-01)  — in flight

  The parenthetical opens at the first TWO-SPACE gap followed by `(` and runs to its balanced
  close; whatever remains after that is a trailer. Nothing inside either is interpreted, so both
  may carry whatever a role finds useful. A SINGLE space before `(` belongs to the title instead,
  which is what lets a title such as `Login 500 (env not loaded)` stay one title.

  IDS. `ABC-014` — a capital letter, capitals and digits, a hyphen, then digits. `EPIC-006` and
  `FEAT-007` are a SECOND CLASS: they record epics and features, they are never joined against
  `plans/tickets/`, and they never count toward a column's WIP number.

  UPDATES. `_Updated: <YYYY-MM-DD> by <actor>`. Any other shape is reported as an unparsed line.

  WIP NUMBERS COME FROM CONFIG. The per-column limits in each heading are the lean DEFAULTS,
  sourced from `agent-factory/config/factory.config.json#wip_limits`. Edit the dial, then update
  the heading to match — the two must agree. In lean mode the In Security/NFR and Ready to Release
  columns may stay empty unless a trigger fires; the columns still exist.

  BOARD <-> TICKET. Each ticket file (`plans/tickets/<prefix>-xxx.md`) carries `column:` equal to
  the board column it sits under, and `status:` as the kebab-case form of that column
  (`In Development` -> `in-development`). The validator reports drift between the two.

  THIS BLOCK IS NOT LIVE STATE. Every `<!-- … -->` span is blanked before the board is parsed, so
  the example above is invisible to the parser whether or not it is indented. The indentation is
  kept because it reads better; it is no longer what keeps the example out of the board.

  CADENCE: the Kanban columns ship by default (`cadence=kanban`). The scrum overlay — sprint goal,
  committed backlog, burndown — lives in `plans/sprints/SPRINT-xx.md` and is not pre-rendered here.
  The sizing, priority and Blocked conventions below are shared by both cadences.
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
