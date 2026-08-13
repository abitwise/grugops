---
kind: workflow
order: 15
cadence: both
---
# Workflow: Security audit (OWASP ASVS)

## When to use
When a deep, standalone security audit is wanted — on demand, per phase, or per milestone. The audit is anchored to OWASP ASVS 5.0 and is distinct from the lightweight per-ticket Security/NFR check that already runs in the `In Security/NFR` column. The per-ticket check looks for danger on the change in front of it. This audit walks the full checklist at the configured level and produces a formal, severity-tagged report. The Orchestrator routes here via the `security-audit` classification.

## Agents involved
- Security/NFR — runs the deep ASVS audit and records the severity-tagged findings.

The Security/NFR role reads the shared verified context before it works. The Security/NFR role records its results as typed notes (finding / decision / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`. Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context; the shared verified context is the memory.

## Inputs required
- `security.asvs_level` and `security.block_on` from `.grugops/factory.config.json` — the active level filters the checklist; the block threshold is read at the gate, not here.
- `agent-factory/checklists/security-nfr-checklist.md` — the full ASVS 5.0 checklist this audit works through.
- The change or scope under review.
- The `autonomy` setting from `.grugops/factory.config.json`.

## Steps
1. Read `security.asvs_level` and filter the full checklist to the active tier at read time. ASVS levels are cumulative. Keep every requirement whose level is less than or equal to the configured level. The counts are L1 = 70 requirements, L2 = 253, L3 = 345. State the filter honestly in the report; the checklist file is not regenerated when the dial changes.
2. Walk the filtered checklist against the change or scope under review. Every pass cites evidence; anything unverified reads `UNKNOWN - verify` — no unbacked ticks.
3. Emit severity-tagged findings using the default map. An L1 failure is `high`, an L2 failure is `medium`, and an L3 failure is `low`. A missing baseline control is the most dangerous. The auditor overrides a finding's severity only with a stated reason and a named owner. That override reuses the role's existing rule that an accepted risk needs a named owner.
4. Verify enforcement against the change per `agent-factory/workflows/05-pr-quality-gate.md`. The gate reads `security.block_on` to decide which severities block. The bounded self-fix and the terminal result live there — this workflow references that gate and does not restate it. The audit produces the findings; the gate enforces. This workflow never blocks on its own.

## Board moves
On `plans/board.md`, the audit runs in the `In Security/NFR` column. It is the deep, standalone audit and is distinct from the lightweight per-ticket Security/NFR check that also runs in that column. The column is shared, the depth is not.

## Output
The severity-tagged ASVS audit — its findings, evidence, and `PASS | PASS_WITH_RISKS | BLOCKED` result — is recorded as typed notes per Workflow 16.

## Trace updates
Append to `plans/traceability.md`: the audit result and the reviewed ASVS requirement IDs against the row, and update `Status`.

## Stop conditions
- A checklist requirement cannot be evidenced either way → do not tick it and do not fail it silently. Record it `UNKNOWN - verify` and continue. An unbacked tick is a fabricated gate.
- A finding's severity is overridden without a stated reason and a named owner → stop; the override is not admissible until both are present.
- The audit would have to block the change itself → stop. This workflow produces findings; `security.block_on` is read at the gate (workflow 05), and enforcement lives there.
- `security.asvs_level` is unreadable or holds a value outside `L1 | L2 | L3` → stop and get it fixed. Auditing at a guessed level misreports the coverage.

## Done condition
The filtered checklist is walked, and every pass cites evidence or reads `UNKNOWN - verify`. The findings carry their default-or-overridden severity, and the report is handed off for enforcement at the gate. This workflow honors `autonomy=pr` — the agent opens a branch and a PR; it never merges. Humans hold merge and deploy.

## Commit
Commit the artifacts this workflow wrote per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/security-audit-<id>`), then `type(scope): summary`. The artifacts are the board context, the security-nfr audit notes recorded per Workflow 16, and the updated traceability rows. Never merge, never deploy; humans hold both.
