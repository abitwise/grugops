---
kind: workflow
order: 4
cadence: both
---
# Workflow: Ticket to PR

## When to use
When a ready ticket needs to become a pull request a human can review. grug no rush — the ticket gets a readiness check, then one engineer makes one small change. The change flows ticket -> Orchestrator readiness check -> Tech Lead plan -> Software Engineer (named level) -> QE/E2E -> Security/NFR (if triggered) -> final implementation packet.

## Agents involved
- Orchestrator — checks readiness against the Definition of Ready and pulls the ticket into development.
- Tech Lead — scores the ticket on the complexity rubric, names the engineer level, plans the dev tasks and decides the exit of a dev-raised block.
- Software Engineer — implements the one ticket on a branch, at the level the Tech Lead names.
- QE/E2E — breaks the feature and reports gaps.
- Security/NFR — reviews risk if the change is triggered.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A ticket with acceptance criteria, size, and priority.
- `agent-factory/checklists/definition-of-ready.md` — the readiness gate.
- `agent-factory/checklists/complexity-rubric.md` — the scoring rules the Tech Lead applies.
- The `checkpoints` matrix from `.grugops/factory.config.json`.

## Steps
1. Confirm the ticket against `agent-factory/checklists/definition-of-ready.md` (Orchestrator). Stop and name the missing input when the ticket is not ready.
2. Assess the ticket per `agent-factory/checklists/complexity-rubric.md` (Tech Lead). Write the dev tasks first, then score them; the rubric reads the dev plan. Record the six scores, sum, level, adapter and dev tasks in a `decision` note per Workflow 16. Write a short `## Tech Lead plan` section into the ticket body.
3. Pull the ticket into development once the plan note is published, respecting WIP limits (Orchestrator).
4. Create one `pending/` subtask for the exact adapter the plan note names (Orchestrator). Spawn that adapter by name as a non-fork sub-agent. Pass no `model` or `effort` parameter on the spawn call. Never re-decide the level. One engineer works one ticket. On hosts without the `Agent` tool, the engineer role reads its level from `## Tech Lead plan`.
5. Implement the one ticket on a branch — a small diff, test-first (Software Engineer).
6. Run the **inner loop** per unit behavior. Write a FAILING unit test (red), add the minimal code to pass (green), then refactor while it stays green. Repeat per behavior.
7. Apply the `quality.tdd` dial (`off` / `encouraged` / `required`, default `encouraged`).
8. Meet the **double-loop rule** (D-08). The outer acceptance scenario is QE-owned and read from the shared verified context per Workflow 16. That scenario stays RED until the inner loop closes it. NO SECOND acceptance scenario goes red before the first is green.
9. Meet the **contract-vs-logic seam** (D-09). The acceptance scenario asserts the observable business outcome once. The unit tests assert the internal logic and edge cases beneath it. The unit layer never re-asserts the same observable outcome.
10. Read `agent-factory/checklists/example-mapping.md` for the worked seam example, which this workflow does not restate.
11. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix and the terminal result live there. This workflow references that gate and does not restate it. Mechanical no-second-red / one-behavior-one-layer enforcement is planned for that quality gate; this step does not enforce it.
12. Assess the feature by trying to break it (QE/E2E). Report the result and the gaps.
13. Assess the change for risk when a risk-bearing surface is triggered (Security/NFR).
14. Record a `failed-attempt` note per Workflow 16 when the engineer reports `BLOCKED` (Software Engineer). Record the same note when the gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, for an agent-fixable reason. Open its body with `Cause: engineer` for a `BLOCKED` report, or `Cause: gate` for a gate failure. Move the ticket to the `Blocked` column. Add a `## Blocked` bullet naming the Tech Lead as the owner who clears it. A human-only gate failure (visual baseline, test integrity) never takes this path; Workflow 05 hands it to its human.
15. Read the `failed-attempt` note (Tech Lead). Choose one: escalate one level at most once per ticket, re-plan and re-score, split, or return it to the Architect.
    - Apply the move limits. Besides the escalation, make at most one other move per ticket. A re-score that raises the level is the escalation, and it moves the ticket one level only. Count the earlier moves from the Tech Lead's `decision` notes for this ticket that carry a `Move:` line. Skip a move that a `Confirmed: no` finding names. The plan note from step 2 carries none.
    - Apply the re-score stop. When the scores call for more than one level, or for a raise after the escalation is spent, read `checkpoints.escalate_unadjudicable_result`. The used-up stop below follows the same value. At `block`, the default, stop for a named human, and record no move until the human answers. Leave the ticket in `Blocked` while the human decides. Ask the human for a level, or for another move. The human's level stands, even past the move limits. At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level. Record the scored level in the move note. At `notify`, also record an `observation` per Workflow 16 that names the move note.
    - Record the move in a new `decision` note per Workflow 16. Open its body with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`. Mark a re-score that raises the level `Move: escalate`. After a re-score stop at `block`, record the move and the level the human named. Put the line `Stop: re-score` under the `Move:` line when the re-score stop applied.
    - Apply the gate-failure stop. When the note opens with `Cause: gate`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows. At `block`, the default, stop until a named human confirms the move. Leave the ticket in `Blocked` until then. At `notify`, make the move and record an `observation` per Workflow 16 that names the move note. At `off`, make the move without that human.
    - Record the human's confirmation. Once the named human answers, the Tech Lead records the answer as a `finding` per Workflow 16. Open its body with `Confirmed: yes` or `Confirmed: no`. At a re-score stop, put the level the human named on a `Level:` line. Stamp it `human:<name>`, with the move note's id among its refs. Never write that stamp without the human's answer. Only at `context.human_admission: all` does admission check that stamp, and only Claude Code binds it to the human's session grant. At the default `off` it is a prose-tier record. A `Confirmed: no` move is neither carried out nor counted. Record a new move, or stop for a named human once the options are used up.
    - Update the board. On an escalation or a re-plan, return the ticket to `Ready for Dev`. On a split, move it to `Backlog` for BA/PM. On an Architect pass, move it to `In Design`.
16. Create a new `pending/` subtask for the adapter the new note names (Orchestrator). Create it only after an escalation or a re-plan. Create it only once the step 15 move is recorded. After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding naming the move note. After a `Stop: re-score` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it. A split or an Architect pass dispatches no engineer. Point its `ref:` at the same per-task context. Never re-pend a `done/` subtask. Spawn the adapter as step 4 does. The spawn prompt carries the task reference and nothing else. Every fact travels through published notes and the queue.

## Board moves
On `memory-bank/plans/board.md`, the full path is `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. The ticket stays in `Ready for Dev` while the Tech Lead plans. The Orchestrator owns `Ready for Dev -> In Development`; the Software Engineer owns `In Development -> In Review`; QE/E2E owns the `In Review` exit; Security/NFR owns the `In Security/NFR` exit when triggered. The Orchestrator makes its move only once the Tech Lead's plan note is published. When the engineer reports `BLOCKED`, or the gate ends `BLOCKED_NEEDS_FIX`, the Software Engineer moves the ticket to `Blocked`. The Tech Lead owns its exit: `Ready for Dev` after an escalation or a re-plan, `Backlog` after a split, `In Design` after an Architect pass.

## Trace updates
The Software Engineer publishes the PR and the files changed, and QE/E2E publishes the tests, as refs on notes per Workflow 16. Each note names the ticket identifier among its refs. The trace render in Workflow 05 turns those refs into the ticket's trace file and index line.
<!-- The acceptance scenarios are carried forward to the UAT pack and release — they flow forward, NOT rewritten here. A deeper UAT-BDD treatment is its own later concern (D-13). -->


## Metrics emitted
Record `Cycle time` and `WIP` in `memory-bank/plans/metrics.md`.

## Stop conditions
- The ticket fails the Definition of Ready -> stop and name the missing input; do not pull it into development.
- The ticket is XL, or the Tech Lead's file plan is too large for one PR -> `SPLIT_REQUIRED`. It goes back to BA/PM for splitting before it can enter `Ready for Dev`.
- The Tech Lead finds the approach not designed (F2 = 2) -> record the gap and send the ticket back to `In Design` for the Architect. Dispatch no engineer.
- The engineer reports `BLOCKED` -> publish a `failed-attempt` note and move the ticket to `Blocked`, naming the Tech Lead as its owner. Wait for the Tech Lead's new decision note.
- The gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, for an agent-fixable reason -> the same `failed-attempt` note and `Blocked` move. A named human confirms the Tech Lead's move before the ticket leaves `Blocked` (step 15) and before any re-enqueue (step 16). Workflow 05 sets this human stop when the self-fix budget is spent. `checkpoint: exhaust_self_fix_budget`
- The Tech Lead's options are used up -> stop and hand the ticket to a named human; never retry in a loop. Used up means the one escalation is spent and the one other move is spent too. It also means the scores call for more than one level, or for a raise after the escalation is spent. `checkpoint: escalate_unadjudicable_result`

## Done condition
Code is changed per the `checkpoints` matrix and tests are added. The gate commands have run. The implementation and QE results are recorded as typed notes per Workflow 16, with the security-nfr result when triggered. The trace is updated. This workflow honors `checkpoints.open_pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first, then `type(scope): summary`. Never a protected branch: the implementation already lives on a `grugops/ticket-to-pr-<id>` working branch per `checkpoints.open_pr`. The artifacts are the board moves, the metrics and the rendered trace files. They also include the implementation, QE and security-nfr context notes recorded per Workflow 16. Never merge, never deploy; humans hold both.
