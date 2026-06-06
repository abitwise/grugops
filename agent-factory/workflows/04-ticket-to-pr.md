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
- Software Engineer — implements the one ticket on a branch (`implementation-handoff.md`).
- QE/E2E — breaks the feature and reports gaps (`qe-handoff.md`).
- Security/NFR — reviews risk if the change is triggered (`security-nfr-handoff.md`).

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- A ticket with acceptance criteria, size, and priority.
- `agent-factory/checklists/definition-of-ready.md` — the readiness gate.
- The `autonomy` setting from `agent-factory/config/factory.config.json`.

## Steps
1. The Orchestrator checks the ticket against `agent-factory/checklists/definition-of-ready.md`. If it is not ready, stop and name the missing input.
2. The Orchestrator pulls the ticket into development, respecting WIP limits.
3. The Software Engineer implements the one ticket on a branch — a small diff, with tests.
4. Run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`. The gate loop, the bounded self-fix, and the terminal result live there — this workflow references that gate and does not restate it.
5. QE/E2E breaks the feature and reports the result and gaps.
6. Security/NFR reviews the change if a risk-bearing surface is triggered.

## Board moves
On `plans/board.md`, the full path is `Ready for Dev -> In Development -> In Review (-> In Security/NFR)`. The Orchestrator owns `Ready for Dev -> In Development`; the Software Engineer owns `In Development -> In Review`; QE/E2E owns the `In Review` exit; Security/NFR owns the `In Security/NFR` exit when triggered.

## Handoffs produced
Under `agent-factory/handoffs/`: `implementation-handoff.md` (Software Engineer), `qe-handoff.md` (QE/E2E), and `security-nfr-handoff.md` (Security/NFR, if triggered).

## Trace updates
Append to `plans/traceability.md`: the `Code (PR/files)` link and the `Tests` link against the ticket row, and update `Status`.

## Metrics emitted
Record `Cycle time` and `WIP` in `plans/metrics.md`.

## Stop conditions
- The ticket fails the Definition of Ready -> stop and name the missing input; do not pull it into development.
- The ticket is XL (too large for one PR) -> `SPLIT_REQUIRED`, routed back to BA/PM for splitting before it can enter `Ready for Dev`.

## Done condition
Code is changed per the `autonomy` setting, tests are added, the gate commands have run, the implementation and QE (and, when triggered, security-nfr) handoffs are written, and the trace is updated. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.
