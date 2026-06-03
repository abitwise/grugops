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
- System Analyst — clarifies flows and system rules when the behavior is unclear (`system-handoff.md`).

## Inputs required
- An epic from `Backlog` and the `product-handoff.md` that scoped it.
- `agent-factory/checklists/definition-of-ready.md` — the gate each ticket must meet.
- `agent-factory/config/factory.config.json` for `sizing` / `priority_scheme`.

## Steps
1. BA/PM breaks the epic into tickets, each with user value, scope, and Given/When/Then acceptance criteria.
2. BA/PM sizes each ticket (`XS`/`S`/`M`/`L`/`XL`) and prioritizes it (`P0`-`P3`).
3. When the behavior is unclear, the System Analyst maps the flows and system rules into `agent-factory/handoffs/system-handoff.md` (the `In Analysis` exit).
4. Each ticket is checked against `agent-factory/checklists/definition-of-ready.md`. A ticket sized `XL` is not pulled into dev — emit `SPLIT_REQUIRED` and split it first.
5. Tickets are written to `plans/tickets/` and a traceability row is appended per ticket.

## Board moves
On `plans/board.md`, a ticket whose behavior needs analysis sits in `In Analysis`; the System Analyst owns that exit. Tickets land in `Backlog` and BA/PM moves a Definition-of-Ready-met ticket to `Ready`.

## Handoffs produced
Under `agent-factory/handoffs/`: `system-handoff.md` (System Analyst, when the behavior is unclear).

## Trace updates
Append to `plans/traceability.md`: one row per ticket — `Ticket`, `Title`, `Epic`, `Feature`, `NFRs`, and `Status` — so each ticket traces back to its epic and forward to code/test/UAT/release.

## Metrics emitted
Record `Throughput` in `plans/metrics.md` as tickets are created.

## Stop conditions
- The behavior is ambiguous and the System Analyst cannot resolve it — stop and request the missing decision; do not fabricate the flow.
- A ticket is sized `XL` — `SPLIT_REQUIRED`; route it back to BA/PM for splitting before it enters `Ready for Dev`.

## Done condition
Each ticket has user value, scope, acceptance criteria, test notes, security/NFR triggers, a size, a priority, and a traceability row. Tickets are written to `plans/tickets/`.
