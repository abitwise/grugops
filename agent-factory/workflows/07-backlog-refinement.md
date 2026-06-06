---
kind: workflow
order: 7
cadence: both
---
# Workflow: Backlog refinement

## When to use
Run this regularly to keep the `Ready` column stocked, or right before planning. This ceremony applies to **both** cadences — in kanban it runs on a steady rhythm so the continuous pull never starves; in scrum it runs ahead of `08-sprint-planning.md` so the box can be filled. grug keep the larder full so dev never go hungry. The flow: the top of `Backlog` -> BA/PM (+ System Analyst, + Architect/Design for spikes) -> sized, prioritized, DoR-met items -> a stocked `Ready` column.

## Agents involved
- BA/PM — clarifies the work, sizes (`XS`–`XL`), prioritizes (`P0`–`P3`), marks security/NFR triggers, and takes items to the Definition of Ready.
- System Analyst — clarifies behavior when a ticket's acceptance is unclear.
- Architect/Design — investigates spikes when an item needs a technical answer before it can be sized.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The top of the `Backlog` column on `plans/board.md` — the captured ideas to refine.
- `.grugops/factory.config.json` for `mode`, `cadence`, sizing (tshirt), and `priority_scheme` (`P0`–`P3`).
- `agent-factory/checklists/definition-of-ready.md` — the bar each item must meet before it can be promoted.

## Steps
1. Pull the top items off the `Backlog` column by priority (BA/PM).
2. Clarify each item — user value, scope, and acceptance criteria; pull in the System Analyst when behavior is unclear, or Architect/Design for a spike.
3. Split `XL` work into smaller tickets — the Orchestrator enforces `SPLIT_REQUIRED`; no `XL` ticket enters dev.
4. Size each item (`XS`–`XL`) and prioritize it (`P0`–`P3`).
5. Mark any security/NFR triggers on the ticket so the gate fires later.
6. Promote items that meet `agent-factory/checklists/definition-of-ready.md` into the `Ready` column; record the refinement in `agent-factory/handoffs/refinement-notes.md`.

## Board moves
On `plans/board.md`, BA/PM owns the `Backlog -> Ready` exit: items that meet the Definition of Ready move from `Backlog` to `Ready`. `XL` items do not advance — they are split back into the `Backlog` as smaller tickets via `SPLIT_REQUIRED`. The `Ready` column WIP limit (from `factory.config.json#wip_limits`) caps how many items sit ready at once.

## Handoffs produced
Under `agent-factory/handoffs/`: `refinement-notes.md` (BA/PM) — items reviewed, split decisions, sizes and priorities assigned, the IDs promoted to `Ready`, and anything still blocked.

## Trace updates
In `plans/traceability.md`, confirm or extend the rows for the refined tickets — the requirement→epic→feature→ticket linkage and `Status` — so every promoted ticket already traces back to a product requirement before dev pulls it.

## Metrics emitted
None new — refinement stocks the `Ready` column and does not close work. Surfacing the `WIP` of `Ready` against its limit (from the frozen `plans/metrics.md` set) is enough to show whether the larder is full; do not invent a refinement metric.

## Stop conditions
- An item cannot be made Ready because an input is missing (unclear value, undefined behavior, an unanswered spike) — leave it in `Backlog` with the named gap recorded in `refinement-notes.md`; never fake readiness or promote an item that fails the Definition of Ready.

## Done condition
`refinement-notes.md` is written and the `Ready` column is stocked — enough sized, prioritized, DoR-met work that dev (continuous pull in kanban, the next sprint in scrum) never starves. Every `XL` item was split, and no item was promoted that did not meet the Definition of Ready.

## Commit
Commit the artifacts this workflow wrote (the `refinement-notes.md`, the re-sized/re-prioritized tickets, the `Backlog -> Ready` board moves, and the confirmed traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/backlog-refinement-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
