---
kind: workflow
order: 2
cadence: both
---
# Workflow: Idea to epics

## When to use
When a raw idea or request needs to become epics the team can plan against. grug no build everything — first find the user, the pain, the value, then cut to a defensible MVP. The idea flows idea -> BA/PM -> product-handoff -> epics.

## Agents involved
- BA/PM — finds the user, the pain, and the value; defines the MVP scope, non-goals, and risks; breaks the idea into epics (`product-handoff.md`).

## Inputs required
- A raw idea or business request — the thing to scope.
- `agent-factory/config/factory.config.json` for `mode` / `cadence`.
- `plans/board.md` and `memory-bank/00-index.md` for orientation.

## Steps
1. BA/PM clarifies the idea — who is the user, what is the pain, what is the value worth building.
2. BA/PM defines the MVP scope plus the explicit non-goals and the known risks; says no to bloat.
3. BA/PM writes `agent-factory/handoffs/product-handoff.md` with the user value, scope, non-goals, and risks.
4. BA/PM breaks the idea into epics and adds them to `Backlog` (epics written to `plans/epics/`).

## Board moves
On `plans/board.md`, the new epics enter `Backlog`. BA/PM owns the `Backlog -> Ready` exit and moves an item to `Ready` once it meets the Definition of Ready.

## Handoffs produced
Under `agent-factory/handoffs/`: `product-handoff.md` (BA/PM).

## Trace updates
Append to `plans/traceability.md`: the `Epic` and `Feature` rows for the new epics, and set `Status`, so every downstream ticket traces back to a product epic.

## Metrics emitted
Record `Throughput` and `Lead time` in `plans/metrics.md` as epics land in `Backlog`.

## Stop conditions
- The idea is too vague to scope — stop and request the missing clarity from the requester; do not invent the user, the pain, or the value.

## Done condition
The MVP scope is clear; the epics, the non-goals, and the risks are written; the epics are added to `Backlog`. The `product-handoff.md` is filled and the trace rows are appended.
