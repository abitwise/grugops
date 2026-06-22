---
kind: workflow
order: 11
cadence: both
---
# Workflow: Retro

## When to use
Run this to learn from the metrics and improve the factory itself. It applies to **both** cadences — at the end of a sprint in scrum, and monthly (light) in kanban; the Orchestrator selects when it fires based on `config.cadence` and `mode`. grug look at numbers, not vibes — find the waste, fix the factory. The flow: `plans/metrics.md` + board history -> Factory Coach -> the top 1–3 wastes recorded as verified context -> 1–3 improvement tickets tagged `factory`.

## Agents involved
- Factory Coach — reads the metrics, runs the retro from the values (not opinion), names the top wastes, records the retro notes, and creates the improvement tickets for the factory itself.

The Factory Coach reads the shared verified context before it works and records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- `plans/metrics.md` — the delivery metrics the retro acts on (the frozen 9, e.g. `Throughput`, `Cycle time`, `Rework rate`).
- The board history on `plans/board.md` — where flow stalled, what sat blocked, what was reworked.
- `.grugops/factory.config.json` for `mode` (the retro is light in lean) and `cadence`.

## Steps
1. Read `plans/metrics.md` and the board history (Factory Coach) — run the retro from the values, not the vibes.
2. Identify the top 1–3 wastes — rework, escaped defects, slow gates, or where flow stalled — each tied to a metric value.
3. Record the retro as typed notes per Workflow 16: the metrics snapshot (citing the frozen `plans/metrics.md` names), the top wastes, and Keep / Stop / Start.
4. Create 1–3 improvement tickets for the factory itself, written to `plans/tickets/` and tagged `factory`, each one tied to a waste the data showed.

## Board moves
None — the Factory Coach causes no column transition of its own on `plans/board.md`. The improvement tickets it creates enter the `Backlog` like any other captured work, to be refined and pulled later.

## Trace updates
In `plans/traceability.md`, record the `factory`-tagged improvement ticket IDs the retro created and their `Status`, so each factory improvement traces back to the metric or waste that prompted it.

## Metrics emitted
The retro reads `plans/metrics.md` rather than closing work; it surfaces a subset of the frozen 9 to ground its findings — for example `Throughput`, `Cycle time`, and `Rework rate`. Report the values exactly as they stand; never fake a count or a trend, and do not invent a metric.

## Stop conditions
- There is not enough metric history to identify a real waste — record that as a typed note per Workflow 16 and defer the finding; do not invent waste the data does not show or gold-plate the factory.

## Done condition
The retro is recorded as typed notes per Workflow 16 — the metrics snapshot, the top 1–3 wastes, and Keep / Stop / Start — and 1–3 improvement tickets tagged `factory` are created in `plans/tickets/`. Every finding cites a value in `plans/metrics.md`; in lean mode the retro is kept light.

## Commit
Commit the artifacts this workflow wrote (the retro notes recorded per Workflow 16, the `factory`-tagged improvement tickets, and the traceability rows linking them to their waste) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/retro-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
