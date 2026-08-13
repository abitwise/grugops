---
kind: workflow
order: 3
cadence: both
---
# Workflow: Epic to tickets

## When to use
When an epic needs to become small, ready, traceable tickets. grug make tickets small — each one has value, scope, acceptance, test notes, size, priority, and a trace row before it can be pulled. The epic flows epic -> BA/PM -> System Analyst (if behavior unclear) -> tickets.

## Agents involved
- BA/PM — breaks the epic into tickets, sizes them (`XS`/`S`/`M`/`L`/`XL`), and prioritizes them (`P0`-`P3`).
- System Analyst — clarifies flows and system rules when the behavior is unclear.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- An epic from `Backlog` and the BA/PM's recorded product context that scoped it (read per Workflow 16).
- `agent-factory/checklists/definition-of-ready.md` — the gate each ticket must meet.
- `.grugops/factory.config.json` for `sizing` / `priority_scheme`.

## Steps
1. Split the epic into tickets, each with user value, scope and Given/When/Then acceptance criteria (BA/PM).
2. Size each ticket `XS`, `S`, `M`, `L` or `XL` (BA/PM).
3. Set each ticket's priority `P0` to `P3` (BA/PM).
4. Walk the flows and system rules where the behavior is unclear (System Analyst).
5. Record the clarified behavior as typed notes per Workflow 16 — the `In Analysis` exit.
6. Confirm each ticket against `agent-factory/checklists/definition-of-ready.md`. A ticket sized `XL` is not pulled into dev — emit `SPLIT_REQUIRED` and split it first.
7. Write each ticket to `plans/tickets/`.
8. Append a traceability row per ticket.

## Board moves
On `plans/board.md`, a ticket whose behavior needs analysis sits in `In Analysis`; the System Analyst owns that exit. Tickets land in `Backlog` and BA/PM moves a Definition-of-Ready-met ticket to `Ready`.

## Trace updates
Append to `plans/traceability.md` one row per ticket — `Ticket`, `Title`, `Epic`, `Feature`, `NFRs` and `Status`. Each ticket then traces back to its epic and forward to code/test/UAT/release.

## Metrics emitted
Record `Throughput` in `plans/metrics.md` as tickets are created.

## Stop conditions
- The behavior is ambiguous and the System Analyst cannot resolve it — stop and request the missing decision; do not fabricate the flow.
- A ticket is sized `XL` — `SPLIT_REQUIRED`; route it back to BA/PM for splitting before it enters `Ready for Dev`.

## Done condition
Each ticket has user value, scope, acceptance criteria, test notes, security/NFR triggers, a size, a priority, and a traceability row. Tickets are written to `plans/tickets/`.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/epic-to-tickets-<id>`), then `type(scope): summary`. The artifacts are the tickets, the board moves, the system-analysis notes recorded per Workflow 16 when produced, and the traceability rows. Never merge, never deploy; humans hold both.
