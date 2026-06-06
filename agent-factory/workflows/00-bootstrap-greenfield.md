---
kind: workflow
order: 0
cadence: both
---
# Workflow: Bootstrap greenfield

## When to use
When you have a new idea and an empty (or near-empty) repo and want the factory to stand up the project plane from scratch. Tell the Orchestrator: "Plan this idea as greenfield: `<idea>`. Produce product/system/architecture handoffs, epics, first tickets, and seed the board." grug start with idea, not with bloat — shape the idea, write the substrate, then cut the first safe tickets. The work flows idea -> Orchestrator -> Greenfield Mapper -> AGENTS.md Scribe -> BA/PM -> System Analyst -> Architect/Design -> initial tickets.

## Agents involved
- Greenfield Mapper — shapes the raw idea into a plan (`memory-bank/greenfield-plan.md`); no board move.
- AGENTS.md Scribe — writes the root `AGENTS.md` substrate; no board move.
- BA/PM — defines product, breaks the idea into epics, sizes and prioritizes the first tickets (`product-handoff.md`).
- System Analyst — clarifies behavior where the design is unclear (`system-handoff.md`).
- Architect/Design — sets the structure, records ADRs, seeds the NFR catalog (`architecture-handoff.md`).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- A raw idea or business request — the thing to stand up.
- `agent-factory/config/factory.config.json` for `mode` / `cadence` / `default_stack` (present after bootstrap; the kit ships it).
- An empty (or near-empty) repo and `memory-bank/00-index.md` for orientation.

## Steps
1. The Greenfield Mapper shapes the idea into `memory-bank/greenfield-plan.md` — the project plan of record. Leave `plans/initial-plan.md` a thin stub; the greenfield plan is the planning output.
2. The AGENTS.md Scribe writes the root `AGENTS.md`. The command slots stay `UNKNOWN - verify` — they are filled per-project later by the Scribe once the real commands are confirmed; never fabricate a command here.
3. BA/PM defines the product into `agent-factory/handoffs/product-handoff.md`, breaks the idea into epics, and writes the first tickets (epics/features/tickets to `plans/epics/`, `plans/features/`, `plans/tickets/`).
4. The System Analyst clarifies behavior where it is unclear and writes `agent-factory/handoffs/system-handoff.md`.
5. Architect/Design sets the structure, writes `agent-factory/handoffs/architecture-handoff.md`, records ADRs into `memory-bank/50-decisions/`, and seeds `plans/nfr-catalog.md`.
6. Seed `plans/board.md` with the standard columns and WIP limits, and confirm `agent-factory/config/factory.config.json` is present.

## Board moves
On `plans/board.md`, seed the board with its columns and per-column WIP limits. BA/PM owns the `Backlog -> Ready` exit for the first epics. The System Analyst owns the `In Analysis` exit and Architect/Design owns the `In Design` exit as the first tickets walk the early columns.

## Handoffs produced
Under `agent-factory/handoffs/`: `product-handoff.md` (BA/PM), `system-handoff.md` (System Analyst), `architecture-handoff.md` (Architect/Design).

## Trace updates
Seed `plans/traceability.md` rows for the first tickets — `Epic` / `Feature` and `Status` — and record the ADR ids, so every first ticket traces back to a product epic and an architecture decision.

## Metrics emitted
None beyond seeding. The board and metrics counters start empty; `plans/metrics.md` records `Throughput` and `Lead time` once real work begins.

## Stop conditions
- The idea is too vague to map — stop and request the missing clarity from the requester; do not invent the user, the pain, or the value.

## Done condition
The root `AGENTS.md`, the memory-bank, `memory-bank/greenfield-plan.md`, the `product-handoff.md` / `system-handoff.md` / `architecture-handoff.md`, and the first tickets all exist; `plans/board.md` is seeded; `agent-factory/config/factory.config.json` is present. The `AGENTS.md` command slots remain `UNKNOWN - verify` until verified per-project.
