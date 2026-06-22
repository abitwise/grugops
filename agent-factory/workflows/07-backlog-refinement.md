---
kind: workflow
order: 7
cadence: both
---
# Workflow: Backlog refinement

## When to use
Run this regularly to keep the `Ready` column stocked, or right before planning. This ceremony applies to **both** cadences — in kanban it runs on a steady rhythm so the continuous pull never starves; in scrum it runs ahead of `08-sprint-planning.md` so the box can be filled. grug keep the larder full so dev never go hungry. The flow: the top of `Backlog` -> BA/PM (+ System Analyst, + Architect/Design for spikes) -> sized, prioritized, DoR-met items -> a stocked `Ready` column.

## Agents involved
- BA/PM — shapes each item INVEST (independent, negotiable, valuable, estimable, small, testable), writes testable + measurable acceptance, sizes (`XS`–`XL`), prioritizes (`P0`–`P3`), marks security/NFR triggers with measurable targets, and takes items to the Definition of Ready.
- System Analyst — clarifies behavior when a ticket's acceptance is unclear.
- Architect/Design — investigates spikes when an item needs a technical answer before it can be sized.

Each role reads the shared verified context before it works and records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- The top of the `Backlog` column on `plans/board.md` — the captured ideas to refine.
- `.grugops/factory.config.json` for `mode`, `cadence`, sizing (tshirt), and `priority_scheme` (`P0`–`P3`).
- `agent-factory/checklists/definition-of-ready.md` — the bar each item must meet before it can be promoted.
- `agent-factory/checklists/example-mapping.md` — the Three Amigos / Example Mapping ceremony, when the `bdd` dial is not `off`.

## Steps
1. Pull the top items off the `Backlog` column by priority (BA/PM).
2. Clarify each item to INVEST shape — user value, scope, and acceptance criteria that are testable and measurable (a number, a state, an observable outcome, never "works"); pull in the System Analyst when behavior is unclear, or Architect/Design for a spike.
3. When the `bdd` dial is not `off`, run the Three Amigos / Example Mapping conversation per `agent-factory/checklists/example-mapping.md` to surface the declarative scenarios BEFORE the item is sized — read the dial inline (`off` = skip the step · `lean` = the BA self-runs all three voices · `strict` = named participants; absent = lean). Discovery first, scenarios after; declarative business language, never selectors.
4. Split `XL` work into smaller tickets — the Orchestrator enforces `SPLIT_REQUIRED`; no `XL` ticket enters dev. A ticket only a long dependency chain can deliver is not yet independent — split it.
5. Size each item (`XS`–`XL`) and prioritize it (`P0`–`P3`); a story that cannot be estimated is not yet small or clear enough — clarify it first.
6. Mark any security/NFR triggers on the ticket, each with a measurable target (p95 latency, error budget, concurrency) so the gate fires on a real number, not "fast"/"secure".
7. Promote items that meet `agent-factory/checklists/definition-of-ready.md` into the `Ready` column; record the refinement — items reviewed, split decisions, sizes and priorities assigned, the IDs promoted, anything still blocked — as typed notes per Workflow 16.

## Board moves
On `plans/board.md`, BA/PM owns the `Backlog -> Ready` exit: items that meet the Definition of Ready move from `Backlog` to `Ready`. `XL` items do not advance — they are split back into the `Backlog` as smaller tickets via `SPLIT_REQUIRED`. The `Ready` column WIP limit (from `factory.config.json#wip_limits`) caps how many items sit ready at once.

## Trace updates
In `plans/traceability.md`, confirm or extend the rows for the refined tickets — the requirement→epic→feature→ticket linkage and `Status` — so every promoted ticket already traces back to a product requirement before dev pulls it.

## Metrics emitted
None new — refinement stocks the `Ready` column and does not close work. Surfacing the `WIP` of `Ready` against its limit (from the frozen `plans/metrics.md` set) is enough to show whether the larder is full; do not invent a refinement metric.

## Stop conditions
- An item cannot be made Ready because an input is missing (unclear value, undefined behavior, an unanswered spike) — leave it in `Backlog` with the named gap recorded as a typed note per Workflow 16; never fake readiness or promote an item that fails the Definition of Ready.

## Done condition
The refinement is recorded as typed notes per Workflow 16 and the `Ready` column is stocked — enough sized, prioritized, DoR-met work that dev (continuous pull in kanban, the next sprint in scrum) never starves. Every `XL` item was split, and no item was promoted that did not meet the Definition of Ready.

## Commit
Commit the artifacts this workflow wrote (the refinement notes recorded per Workflow 16, the re-sized/re-prioritized tickets, the `Backlog -> Ready` board moves, and the confirmed traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/backlog-refinement-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
