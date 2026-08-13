---
kind: workflow
order: 2
cadence: both
---
# Workflow: Idea to epics

## When to use
When a raw idea or request needs to become epics the team can plan against. grug no build everything — first find the user, the pain, the value, then cut to a defensible MVP. The idea flows idea -> BA/PM -> product decisions recorded as verified context -> epics.

## Agents involved
- BA/PM — finds the user, the pain, and the value; defines the MVP scope, non-goals, and risks; breaks the idea into epics.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A raw idea or business request — the thing to scope.
- `.grugops/factory.config.json` for `mode` / `cadence`.
- `plans/board.md` and `memory-bank/00-index.md` for orientation.

## Steps
1. Clarify the idea — who is the user, what is the pain, what is the value worth building.
2. Set the MVP scope with its explicit non-goals and known risks.
3. Record the user value, scope, non-goals and risks as typed notes (decision / finding) per Workflow 16.
4. Split the idea into epics, written to `plans/epics/`.
5. Promote the new epics into `Backlog`.

## Board moves
On `plans/board.md`, the new epics enter `Backlog`. BA/PM owns the `Backlog -> Ready` exit and moves an item to `Ready` once it meets the Definition of Ready.

## Trace updates
Append to `plans/traceability.md`: the `Epic` and `Feature` rows for the new epics, and set `Status`, so every downstream ticket traces back to a product epic.

## Metrics emitted
Record `Throughput` and `Lead time` in `plans/metrics.md` as epics land in `Backlog`.

## Stop conditions
- The idea is too vague to scope — stop and request the missing clarity from the requester. Do not invent the user, the pain, or the value.

## Done condition
The MVP scope is clear; the epics, the non-goals, and the risks are written; the epics are added to `Backlog`. The product decisions are recorded as typed notes per Workflow 16 and the trace rows are appended.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/idea-to-epics-<id>`), then `type(scope): summary`. The artifacts are the epics, the board update, the product notes recorded per Workflow 16 and the traceability rows. Never merge, never deploy; humans hold both.
