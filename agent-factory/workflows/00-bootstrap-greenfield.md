---
kind: workflow
order: 0
cadence: both
---
# Workflow: Bootstrap greenfield

## When to use
When you have a new idea and an empty (or near-empty) repo and want the factory to stand up the project plane from scratch. grug start with idea, not with bloat. Shape the idea, write the substrate, then cut the first safe tickets. The work flows idea -> Orchestrator -> Greenfield Mapper -> AGENTS.md Scribe -> BA/PM -> System Analyst -> Architect/Design -> initial tickets. Tell the Orchestrator: "Plan this idea as greenfield: `<idea>`. Record the product, system, and architecture work as verified context, draft epics, first tickets, and seed the board."

## Agents involved
- Greenfield Mapper — shapes the raw idea into a plan (`memory-bank/greenfield-plan.md`); no board move.
- AGENTS.md Scribe — writes the root `AGENTS.md` substrate; no board move.
- BA/PM — defines product, breaks the idea into epics, sizes and prioritizes the first tickets.
- System Analyst — clarifies behavior where the design is unclear.
- Architect/Design — sets the structure, records ADRs, seeds the NFR catalog.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A raw idea or business request — the thing to stand up.
- `.grugops/factory.config.json` for `mode` / `cadence` / `default_stack` (present after bootstrap; the kit ships it).
- An empty (or near-empty) repo and `memory-bank/00-index.md` for orientation.

## Steps
1. Draft `memory-bank/greenfield-plan.md` from the raw idea (Greenfield Mapper) — the project plan of record. Leave `plans/initial-plan.md` a thin stub; the greenfield plan is the planning output.
2. Write the root `AGENTS.md` (AGENTS.md Scribe). Leave the command slots at `UNKNOWN - verify` — the Scribe fills them per-project once the real commands are confirmed. Never fabricate a command here.
3. Establish the product definition (BA/PM). Record the product decisions and findings as typed notes per `agent-factory/workflows/16-context-read-write.md`.
4. Split the idea into epics and features (BA/PM).
5. Write the first epics, features and tickets to `plans/epics/`, `plans/features/` and `plans/tickets/` (BA/PM).
6. Clarify the behavior where the design is unclear (System Analyst). Record the clarified behavior as typed notes per Workflow 16.
7. Set the structure (Architect/Design). Record the structural decisions as typed notes per Workflow 16, and the ADRs into `memory-bank/50-decisions/`.
8. Seed `plans/nfr-catalog.md` (Architect/Design).
9. Seed `plans/board.md` with the standard columns and WIP limits.
10. Confirm `.grugops/factory.config.json` is present.

## Board moves
On `plans/board.md`, seed the board with its columns and per-column WIP limits. BA/PM owns the `Backlog -> Ready` exit for the first epics. The System Analyst owns the `In Analysis` exit and Architect/Design owns the `In Design` exit as the first tickets walk the early columns.

## Trace updates
Seed `plans/traceability.md` rows for the first tickets — `Epic` / `Feature` and `Status`. Record the ADR ids beside them. Every first ticket then traces back to a product epic and an architecture decision.

## Metrics emitted
None beyond seeding. The board and metrics counters start empty; `plans/metrics.md` records `Throughput` and `Lead time` once real work begins.

## Stop conditions
- The idea is too vague to map — stop and request the missing clarity from the requester. Do not invent the user, the pain, or the value.

## Done condition
The root `AGENTS.md`, the memory-bank, `memory-bank/greenfield-plan.md` and the first tickets all exist. The product, system and architecture work is recorded as typed notes in the shared verified context per Workflow 16. `plans/board.md` is seeded and `.grugops/factory.config.json` is present. The `AGENTS.md` command slots remain `UNKNOWN - verify` until verified per-project.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/bootstrap-greenfield-<id>`), then `type(scope): summary`. The artifacts are the seeded board, the first tickets, the context notes recorded per Workflow 16, the memory-bank and the traceability rows. Never merge, never deploy; humans hold both.
