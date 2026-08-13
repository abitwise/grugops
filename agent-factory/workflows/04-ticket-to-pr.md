---
kind: workflow
order: 4
cadence: both
---
# Workflow: Ticket to PR

## When to use
When a ready ticket needs to become a pull request a human can review. grug no rush — the ticket gets a readiness check, then one engineer makes one small change. The change flows ticket -> Orchestrator readiness check -> Software Engineer -> QE/E2E -> Security/NFR (if triggered) -> final implementation packet.

## Agents involved
- Orchestrator — checks readiness against the Definition of Ready and pulls the ticket into development.
- Software Engineer — implements the one ticket on a branch.
- QE/E2E — breaks the feature and reports gaps.
- Security/NFR — reviews risk if the change is triggered.

Each role reads the shared verified context before it works. Each role records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- A ticket with acceptance criteria, size, and priority.
- `agent-factory/checklists/definition-of-ready.md` — the readiness gate.
- The `autonomy` setting from `.grugops/factory.config.json`.

## Steps
1. Confirm the ticket against `agent-factory/checklists/definition-of-ready.md` (Orchestrator). Stop and name the missing input when the ticket is not ready.
2. Pull the ticket into development, respecting WIP limits (Orchestrator).
3. Implement the one ticket on a branch — a small diff, test-first (Software Engineer).
4. Run the **inner loop** per unit behavior. Write a FAILING unit test (red), add the minimal code to pass (green), then refactor while it stays green. Repeat per behavior.
5. Apply the `quality.tdd` dial (`off` / `encouraged` / `required`, default `encouraged`).
6. Meet the **double-loop rule** (D-08). The outer acceptance scenario is QE-owned and read from the shared verified context per Workflow 16. That scenario stays RED until the inner loop closes it. NO SECOND acceptance scenario goes red before the first is green.
7. Meet the **contract-vs-logic seam** (D-09). The acceptance scenario asserts the observable business outcome once. The unit tests assert the internal logic and edge cases beneath it. The unit layer never re-asserts the same observable outcome.
8. Read `agent-factory/checklists/example-mapping.md` for the worked seam example, which this workflow does not restate.
9. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix and the terminal result live there. This workflow references that gate and does not restate it. Mechanical no-second-red / one-behavior-one-layer enforcement is planned for that quality gate; this step does not enforce it.
10. Assess the feature by trying to break it (QE/E2E). Report the result and the gaps.
11. Assess the change for risk when a risk-bearing surface is triggered (Security/NFR).

## Board moves
On `plans/board.md`, the full path is `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. The Orchestrator owns `Ready for Dev -> In Development`; the Software Engineer owns `In Development -> In Review`; QE/E2E owns the `In Review` exit; Security/NFR owns the `In Security/NFR` exit when triggered.

## Trace updates
Append to `plans/traceability.md`: the `Code (PR/files)` link and the `Tests` link against the ticket row, and update `Status`.
<!-- The acceptance scenarios are carried forward to the UAT pack and release — they flow forward, NOT rewritten here. A deeper UAT-BDD treatment is its own later concern (D-13). -->


## Metrics emitted
Record `Cycle time` and `WIP` in `plans/metrics.md`.

## Stop conditions
- The ticket fails the Definition of Ready -> stop and name the missing input; do not pull it into development.
- The ticket is XL (too large for one PR) -> `SPLIT_REQUIRED`, routed back to BA/PM for splitting before it can enter `Ready for Dev`.

## Done condition
Code is changed per the `autonomy` setting and tests are added. The gate commands have run. The implementation and QE results are recorded as typed notes per Workflow 16, with the security-nfr result when triggered. The trace is updated. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first, then `type(scope): summary`. Never a protected branch: the implementation already lives on a `grugops/ticket-to-pr-<id>` working branch per `autonomy=pr`. The artifacts are the board moves, the metrics and the updated traceability rows. They also include the implementation, QE and security-nfr context notes recorded per Workflow 16. Never merge, never deploy; humans hold both.
