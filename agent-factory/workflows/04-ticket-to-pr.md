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
- Software Engineer — implements the one ticket on a branch (writes `plans/handoffs/<TICKET-ID>-implementation.md`).
- QE/E2E — breaks the feature and reports gaps (writes `plans/handoffs/<TICKET-ID>-qe.md`).
- Security/NFR — reviews risk if the change is triggered (writes `plans/handoffs/<TICKET-ID>-security-nfr.md`).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- A ticket with acceptance criteria, size, and priority.
- `agent-factory/checklists/definition-of-ready.md` — the readiness gate.
- The `autonomy` setting from `.grugops/factory.config.json`.

## Steps
1. The Orchestrator checks the ticket against `agent-factory/checklists/definition-of-ready.md`. If it is not ready, stop and name the missing input.
2. The Orchestrator pulls the ticket into development, respecting WIP limits.
3. The Software Engineer implements the one ticket on a branch — a small diff, test-first. Run the **inner loop** per unit behavior: write a FAILING unit test (red) -> minimal code to pass (green) -> refactor (still green), repeat. Honor the `quality.tdd` dial (`off` / `encouraged` / `required`, default `encouraged`). The **double-loop rule** (D-08): the outer acceptance scenario (QE-owned, from the handoff `## Acceptance scenarios` block) stays RED until the inner loop closes it, and NO SECOND acceptance scenario goes red before the first is green. The **contract-vs-logic seam** (D-09): the acceptance scenario asserts the observable business outcome once; the unit tests assert the internal logic and edge cases beneath it — the unit layer never re-asserts the same observable outcome. See `agent-factory/checklists/example-mapping.md` for the worked seam example (not restated here).
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there — this workflow references that gate and does not restate it. Mechanical no-second-red / one-behavior-one-layer enforcement is the §14 gate's concern, not this step.
5. QE/E2E breaks the feature and reports the result and gaps.
6. Security/NFR reviews the change if a risk-bearing surface is triggered.

## Board moves
On `plans/board.md`, the full path is `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. The Orchestrator owns `Ready for Dev -> In Development`; the Software Engineer owns `In Development -> In Review`; QE/E2E owns the `In Review` exit; Security/NFR owns the `In Security/NFR` exit when triggered.

## Handoffs produced
Under `plans/handoffs/` (filled from the templates in `agent-factory/handoffs/`): `<TICKET-ID>-implementation.md` (Software Engineer), `<TICKET-ID>-qe.md` (QE/E2E), and `<TICKET-ID>-security-nfr.md` (Security/NFR, if triggered).

## Trace updates
Append to `plans/traceability.md`: the `Code (PR/files)` link and the `Tests` link against the ticket row, and update `Status`.
<!-- The acceptance scenarios are carried forward to the UAT pack and release — they flow forward, NOT rewritten here. A deeper UAT-BDD treatment is its own later concern (D-13). -->


## Metrics emitted
Record `Cycle time` and `WIP` in `plans/metrics.md`.

## Stop conditions
- The ticket fails the Definition of Ready -> stop and name the missing input; do not pull it into development.
- The ticket is XL (too large for one PR) -> `SPLIT_REQUIRED`, routed back to BA/PM for splitting before it can enter `Ready for Dev`.

## Done condition
Code is changed per the `autonomy` setting, tests are added, the gate commands have run, the implementation and QE (and, when triggered, security-nfr) handoffs are written, and the trace is updated. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote (the board moves, the implementation / QE / security-nfr handoffs, the metrics, and the updated traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; the implementation already lives on a `grugops/ticket-to-pr-<id>` working branch per `autonomy=pr`), then `type(scope): summary`. Never merge, never deploy; humans hold both.
