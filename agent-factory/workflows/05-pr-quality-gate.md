---
kind: workflow
order: 5
cadence: both
---
# Workflow: PR quality gate

## When to use
When a change is implemented and needs to pass the gate before a human reviews it. grug no merge on a green guess — the gate runs, the result is recorded, a human decides. This workflow is the single source of the backpressure loop: when an implementation is ready, the change flows implementation -> QE/E2E -> Security/NFR -> Architect/Design (if structure changed) -> Orchestrator recommendation. Every other workflow that needs the gate references this file rather than restating the loop.

## Agents involved
- QE/E2E — breaks the feature, reports coverage and gaps (`qe-handoff.md`).
- Security/NFR — reviews risk when triggered (`security-nfr-handoff.md`).
- Architect/Design — only if the change altered structure (`architecture-handoff.md`).
- Orchestrator — runs the deterministic prefetch and emits the recommendation. The Orchestrator recommends; it never auto-merges.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The implemented change on a branch and `agent-factory/handoffs/implementation-handoff.md`.
- The ticket and its acceptance criteria; relevant prior ADRs in `memory-bank/50-decisions/`.
- Gate commands pulled from the root `AGENTS.md` command slots at runtime.
- Quality knobs from `agent-factory/config/factory.config.json#quality`.
- `agent-factory/checklists/pr-review-checklist.md`.

## Steps
The backpressure loop, in clear voice. Run it in this order:

1. **Deterministic prefetch.** Before the model writes code, the Orchestrator gathers the context the change needs — the ticket, the open handoffs, the gate commands from `AGENTS.md`, the relevant files, and any prior ADRs. The agent starts focused, not drowning.
2. **Implement on a branch** (`autonomy=branch` or `autonomy=pr`).
3. **Run the gate** in order: `install -> lint -> typecheck -> unit -> build -> e2e`. The commands come from the root `AGENTS.md` command slots — they are never invented. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. `mandatory_gates` (`["lint","typecheck","unit","build"]`) must pass; `coverage_threshold` (`0.8`) is the coverage floor; `e2e_when` (`"ui-or-critical-path"`) decides when e2e runs.
4. **Bounded self-fix.** If the gate fails, the agent gets a small, fixed number of self-fix attempts — `self_fix_attempts` from config (default `2`, "two rounds then human"). After that, STOP and hand to a human. Do not loop forever. The same gate and the same "two rounds then human" rule apply in headless or CI use.
5. **Result.** The gate produces exactly one terminal result: `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`.
6. **Human gate.** A human reviews the PR against `agent-factory/checklists/pr-review-checklist.md`. A human merges. A human (or a human-confirmed pipeline) deploys. This step is human-only.

## Board moves
On `plans/board.md`, the gate runs while the ticket sits in `In Review`. When a triggered Security/NFR review is needed, the QE/E2E exit moves it on to `In Security/NFR`. The gate does not move work to `Done` — only a human-approved merge (and release, in enterprise mode) does.

## Handoffs produced
Under `agent-factory/handoffs/`: `qe-handoff.md` (QE/E2E) and `security-nfr-handoff.md` (Security/NFR, when triggered). `architecture-handoff.md` is produced only if the change altered structure and the Architect/Design review re-runs.

## Trace updates
Append to `plans/traceability.md`: the `Tests` link (from the QE result) and the `Code (PR/files)` link, against the ticket row, and update `Status`.

## Metrics emitted
Record `Gate pass rate` in `plans/metrics.md`.

## Stop conditions
- The self-fix budget (`self_fix_attempts`) is exhausted and the gate still fails -> `BLOCKED_NEEDS_FIX`. Stop and hand to a human.
- The ticket is too large to land cleanly through the gate -> `SPLIT_REQUIRED`. Stop and route it back for splitting.

## Done condition
The gate produces one of the three terminal results — `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, or `SPLIT_REQUIRED`. This workflow emits a recommendation that a human reviews; it never auto-merges and never deploys. Humans hold merge and deploy.
