---
kind: workflow
order: 7
cadence: both
---
# Workflow: Backlog refinement

## When to use
Run this regularly to keep the `Ready` column stocked, or right before planning. This ceremony applies to **both** cadences. In kanban it runs on a steady rhythm so the continuous pull never starves. In scrum it runs ahead of `08-sprint-planning.md` so the box can be filled. grug keep the larder full so dev never go hungry. The flow: the top of `Backlog` -> BA/PM (+ System Analyst, + Architect/Design for spikes) -> sized, prioritized, DoR-met items -> a stocked `Ready` column.

## Agents involved
- BA/PM — shapes each item INVEST (independent, negotiable, valuable, estimable, small, testable) and writes testable + measurable acceptance. BA/PM also sizes (`XS`–`XL`), prioritizes (`P0`–`P3`), marks security/NFR triggers with measurable targets, and takes items to the Definition of Ready.
- System Analyst — clarifies behavior when a ticket's acceptance is unclear.
- Architect/Design — investigates spikes when an item needs a technical answer before it can be sized.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The top of the `Backlog` column on `plans/board.md` — the captured ideas to refine.
- `.grugops/factory.config.json` for `mode`, `cadence`, sizing (tshirt), and `priority_scheme` (`P0`–`P3`).
- `agent-factory/checklists/definition-of-ready.md` — the bar each item must meet before it can be promoted.
- `agent-factory/checklists/example-mapping.md` — the Three Amigos / Example Mapping ceremony, when the `bdd` dial is not `off`.

## Steps
1. Pull the top items off the `Backlog` column by priority (BA/PM).
2. Clarify each item to INVEST shape — the user value, the scope, and testable, measurable acceptance criteria. Testable and measurable means a number, a state, or an observable outcome, never "works". Pull in the System Analyst when behavior is unclear, or Architect/Design for a spike.
3. Run the Three Amigos / Example Mapping conversation per `agent-factory/checklists/example-mapping.md` when the `bdd` dial is not `off`. Surface the declarative scenarios BEFORE the item is sized. Read the dial inline. `off` skips the step, `lean` has the BA self-run all three voices, and `strict` requires named participants. An absent dial reads as lean. Discovery first, scenarios after; declarative business language, never selectors.
4. Split `XL` work into smaller tickets — the Orchestrator enforces `SPLIT_REQUIRED`; no `XL` ticket enters dev. A ticket that needs a long dependency chain to deliver is not yet independent — split it.
5. Size each item (`XS`–`XL`) and prioritize it (`P0`–`P3`). A story that cannot be estimated is not yet small or clear enough — clarify it first.
6. Mark any security/NFR triggers on the ticket, each with a measurable target (p95 latency, error budget, concurrency). The measurable target makes the gate fire on a real number, not "fast"/"secure".
7. Promote items that meet `agent-factory/checklists/definition-of-ready.md` into the `Ready` column. Record the refinement as typed notes per Workflow 16. The record names the items reviewed, the split decisions, and the assigned sizes and priorities. It also names the IDs promoted and anything still blocked.

## Board moves
On `plans/board.md`, BA/PM owns the `Backlog -> Ready` exit: items that meet the Definition of Ready move from `Backlog` to `Ready`. `XL` items do not advance — they are split back into the `Backlog` as smaller tickets via `SPLIT_REQUIRED`. The `Ready` column WIP limit (from `factory.config.json#wip_limits`) caps how many items sit ready at once.

## Trace updates
In `plans/traceability.md`, confirm or extend the rows for the refined tickets — the requirement→epic→feature→ticket linkage and `Status`. Every promoted ticket then traces back to a product requirement before dev pulls it.

## Metrics emitted
None new — refinement stocks the `Ready` column and does not close work. Surfacing the `WIP` of `Ready` against its limit (from the frozen `plans/metrics.md` set) is enough to show whether the larder is full. Do not invent a refinement metric.

## Stop conditions
- An item cannot be made Ready because an input is missing — leave it in `Backlog` with the named gap recorded. A missing input is an unclear value, an undefined behavior, or an unanswered spike; record the gap as a typed note per Workflow 16. Never fake readiness or promote an item that fails the Definition of Ready.

## Done condition
The refinement is recorded as typed notes per Workflow 16 and the `Ready` column is stocked. The column holds enough sized, prioritized, DoR-met work that dev never starves — continuous pull in kanban, the next sprint in scrum. Every `XL` item was split, and no item was promoted that did not meet the Definition of Ready.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/backlog-refinement-<id>`), then `type(scope): summary`. The artifacts are the refinement notes recorded per Workflow 16, the re-sized/re-prioritized tickets, the `Backlog -> Ready` board moves and the confirmed traceability rows. Never merge, never deploy; humans hold both.
