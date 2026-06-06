---
kind: workflow
order: 9
cadence: both
---
# Workflow: Daily sweep

## When to use
Run this on demand or on a schedule to reconcile the board and surface what is stuck. This is the standup-equivalent and it applies to **both** cadences — it is the kanban reconciliation engine that keeps continuous pull honest, and the daily heartbeat in a scrum sprint. grug walk the board, see what move, see what stuck, say what next. The Orchestrator runs the sweep: the current board + open handoffs -> per-ticket progress or blocker -> a reconciled board, current metrics and progress -> a sweep report of done / next / blocked.

## Agents involved
- Orchestrator — reads the board and the open handoffs, reconciles each ticket against its column, updates the state files, escalates blockers, and recommends the next pull within WIP. No other role is activated; the sweep is the Orchestrator's WIP-and-throttle pass.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- `plans/board.md` — the current column state and per-column WIP.
- The open handoffs in `agent-factory/handoffs/` — each in-flight ticket's latest packet, so the board can be checked against the real state of the work.
- `agent-factory/config/factory.config.json` — `wip_limits` (the throttle) and `blocked_escalation_days` (the escalation threshold, default 2).

## Steps
1. Read `plans/board.md` and the open handoffs in `agent-factory/handoffs/` to see where every in-flight ticket actually stands.
2. For each in-flight ticket, note its progress or its blocker — what moved since the last sweep, and what is in the way.
3. Reconcile each ticket's front-matter status against the column it sits in on `plans/board.md` — if a handoff says a ticket exited `In Review` but the board still shows it there, fix the board so the column matches the work. The board never lies after a sweep.
4. Update `plans/board.md` (columns reconciled), `plans/metrics.md` (the flow metrics below), and `memory-bank/60-progress.md` (the plan-of-record kept current).
5. Escalate anything blocked longer than `factory.config.json#blocked_escalation_days` — move it to (or flag it in) the `Blocked` column with the blocker named, so it is visible and time-tracked.
6. Recommend the next pull: respecting `wip_limits`, name what should move next — finish before you start, never pull past a WIP limit without a written reason.
7. Produce the sweep report — a short done / next / blocked summary (wording is the Orchestrator's call).

## Board moves
The sweep owns no single left→right transition — it is the reconciliation and throttle pass across **every** column on `plans/board.md`. It corrects any column whose contents drifted from the real ticket status, moves blocked-past-threshold tickets into `Blocked`, and gates new pulls against `wip_limits` (from `factory.config.json#wip_limits`, mirrored on the board). The named columns it reconciles are the frozen set: `Backlog`, `Ready`, `In Analysis`, `In Design`, `Ready for Dev`, `In Development`, `In Review`, `In Security/NFR`, `Ready for UAT`, `In UAT`, `Ready to Release`, `Done`, `Blocked`.

## Handoffs produced
None new — the sweep reads the open handoffs, it does not author one. Its output is the sweep report (done / next / blocked); `memory-bank/60-progress.md` is the durable record the sweep keeps current.

## Trace updates
In `plans/traceability.md`, keep each in-flight ticket's `Status` current so the trail matches the reconciled board; the sweep links no new code/test/UAT/release rows of its own — it ensures the existing rows tell the truth.

## Metrics emitted
Update `plans/metrics.md` with the flow metrics from the frozen set: `Cycle time` (how long a ticket takes start→Done — the kanban optimization target), `WIP` (how many tickets are in flight per column against the throttle), and `Blocked time` (how long blocked items have waited). Record the values as they stand; never fake a count or invent a metric.

## Stop conditions
- A ticket has been blocked longer than `blocked_escalation_days` — do not let it hide; escalate it to the `Blocked` column with the blocker named and raise it for a human to clear.
- A WIP limit is already breached — do not recommend a new pull into that column; finish work in flight first, and only exceed a WIP limit with a written reason.

## Done condition
A sweep report (done / next / blocked) is produced, and `plans/board.md`, `plans/metrics.md`, and `memory-bank/60-progress.md` are current — every column matches the real ticket status, blockers past `blocked_escalation_days` are escalated, and the next pull respects `wip_limits`.

## Commit
Commit the artifacts this workflow wrote (the reconciled `plans/board.md`, the flow metrics in `plans/metrics.md`, the `memory-bank/60-progress.md` record, and the kept-current traceability statuses) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/daily-sweep-<id>`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
