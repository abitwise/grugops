---
kind: workflow
order: 9
cadence: both
---
# Workflow: Daily sweep

## When to use
Run this on demand or on a schedule to reconcile the board and surface what is stuck. The daily sweep is the standup-equivalent and it applies to **both** cadences. It is the kanban reconciliation engine that keeps continuous pull honest, and the daily heartbeat in a scrum sprint. grug walk the board, see what move, see what stuck, say what next. The Orchestrator runs the sweep. The flow: the current board + the shared verified context -> per-ticket progress or blocker. The sweep produces a reconciled board, current metrics and progress, and a sweep report of done / next / blocked.

## Agents involved
- Orchestrator — reads the board and the shared verified context, then reconciles each ticket against its column. The Orchestrator updates the state files, escalates blockers, and recommends the next pull within WIP. No other role is activated; the sweep is the Orchestrator's WIP-and-throttle pass.

The Orchestrator reads the shared verified context before it works. The Orchestrator records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- `memory-bank/plans/board.md` — the current column state and per-column WIP.
- The shared verified context for each in-flight ticket — its recorded role outputs, read per Workflow 16. The context is what lets the board be checked against the real state of the work.
- `.grugops/factory.config.json` — `wip_limits` (the throttle) and `blocked_escalation_days` (the escalation threshold, default 2).

## Steps
1. Run `node tools/grugops/trace-render.js .`, then `node tools/grugops/state-check.js .`. The render rebuilds each ticket's trace file and the trace index from published note refs. state-check reads the state files and writes nothing. Read both exit codes as Workflow 05 Step 3 does. Exit `2` or no exit code is could-not-run, never a pass.
2. Run `node tools/grugops/state-roll.js .` when state-check prints a `ROLLABLE` line. Commit the moved lines. The Done column keeps the newest rows. Older Done rows move verbatim to `memory-bank/plans/archive/board-done.md`. The oldest dated progress entries move to `memory-bank/plans/archive/progress.md`. A progress file over budget with no dated entry to move goes to a human, with state-check's note.
3. Read `memory-bank/plans/board.md` and the shared verified context for each in-flight ticket, per Workflow 16. The read shows where every in-flight ticket actually stands.
4. Record the progress or the blocker for each in-flight ticket. Name what moved since the last sweep, and what is in the way.
5. Reconcile each ticket's recorded status against the column it sits in on `memory-bank/plans/board.md`. If the context shows a ticket exited `In Review` but the board still shows it there, fix the board. The column then matches the work, and the board never lies after a sweep.
6. Update `memory-bank/plans/board.md` (columns reconciled) and `memory-bank/plans/metrics.md` (the flow metrics below). Add one dated status entry, `## YYYY-MM-DD — <summary>`, at the end of `memory-bank/60-progress.md`. Write a standing directive or ruling as a decision record in `memory-bank/50-decisions/`, never as a progress section.
7. Escalate anything blocked longer than `factory.config.json#blocked_escalation_days`. Move its row into the `Blocked` column. Name the blocker in the ticket body's `## Blocked` section. Give the date, who raised it, the reason and the owner. The board row keeps the overview form, `- [ID] title  (owner, since)`. The blocker is then visible and time-tracked.
8. Recommend the next pull within `wip_limits` — name what moves next. Finish before you start. Never pull past a WIP limit without a written reason.
9. Produce the sweep report — a short done / next / blocked summary (wording is the Orchestrator's call).

Two record folders are archive-only: `.grugops/queue/done/` and `memory-bank/50-decisions/`. Move a record out of either folder only whole. `.grugops/queue/done/` records go to `.grugops/archive/queue-done/`. `memory-bank/50-decisions/` records go to `memory-bank/plans/archive/decisions/`. Never squash, prune or rewrite a record in either place. state-check reports a name found in both a record folder and its archive folder.

## Board moves
The sweep owns no single left→right transition — it is the reconciliation and throttle pass across **every** column on `memory-bank/plans/board.md`. It corrects any column whose contents drifted from the real ticket status, and moves blocked-past-threshold tickets into `Blocked`. It gates new pulls against `wip_limits` (from `factory.config.json#wip_limits`, mirrored on the board). The named columns it reconciles are the frozen set: `Backlog`, `Ready`, `In Analysis`, `In Design`, `Ready for Dev`, `In Development`, `In Review`, `In Security/NFR`, `Ready for UAT`, `In UAT`, `Ready to Release`, `Done`, `Blocked`.

## Output
None new — the sweep reads the shared verified context, it does not author a role's work note. Its output is the sweep report (done / next / blocked); `memory-bank/60-progress.md` is the durable record the sweep keeps current.

## Trace updates
None of its own. The sweep publishes no refs. Step 1 renders the trace from the refs other workflows published on notes per Workflow 16. The trace is then current when the board is reconciled.

## Metrics emitted
Update `memory-bank/plans/metrics.md` with the flow metrics from the frozen set. `Cycle time` is how long a ticket takes start→Done, the kanban optimization target. `WIP` is how many tickets are in flight per column against the throttle. `Blocked time` is how long blocked items have waited. Record the values as they stand; never fake a count or invent a metric.

## Stop conditions
- A ticket has been blocked longer than `blocked_escalation_days` — do not let it hide. Escalate it to the `Blocked` column with the blocker named, and raise it for a human to clear. `checkpoint: escalate_stale_blocker`
- A WIP limit is already breached — do not recommend a new pull into that column. Finish work in flight first, and only exceed a WIP limit with a written reason. `checkpoint: exceed_wip_limit`

## Done condition
A sweep report (done / next / blocked) is produced, and `memory-bank/plans/board.md`, `memory-bank/plans/metrics.md`, and `memory-bank/60-progress.md` are current. Every column matches the real ticket status, blockers past `blocked_escalation_days` are escalated, and the next pull respects `wip_limits`.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/daily-sweep-<id>`), then `type(scope): summary`. The artifacts are the reconciled `memory-bank/plans/board.md`, the flow metrics in `memory-bank/plans/metrics.md` and the `memory-bank/60-progress.md` record. They also include the rolled lines with their archive files, and the rendered trace files. Never merge, never deploy; humans hold both.
