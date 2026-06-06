---
kind: workflow
order: 13
tier: enterprise
---
# Workflow: Incident

## When to use
Run this when a production incident is detected or an SLO is failing after release. This is an enterprise, post-release workflow — it runs whenever `mode=enterprise`. grug stop the bleeding first, then grug learn — never grug point finger. The flow: `incident detected -> Incident Responder -> mitigate/rollback -> blameless postmortem -> follow-up tickets`.

## Agents involved
- Incident Responder — assesses the blast radius, proposes the mitigation and rollback, captures the timeline, writes the blameless postmortem, and creates the follow-up tickets. The Incident Responder feeds the lessons to the Factory Coach for the retro.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The release and runbook context for the affected change — `plans/releases/` and `memory-bank/70-runbook.md`.
- The NFR/SLO budgets in `plans/nfr-catalog.md`.
- `agent-factory/config/factory.config.json` for `mode` and `environments`.

## Steps
1. Assess the blast radius — what is affected, who is affected, and how widely.
2. Propose the mitigation and the rollback to limit harm; stop the bleeding before the analysis.
3. Capture the incident timeline (detection, impact, what was done and when).
4. Write `agent-factory/handoffs/incident-postmortem.md` as a blameless postmortem — it focuses on the systemic root cause and never blames a person, mirroring the postmortem's `## Root cause (systemic, not personal)` framing.
5. Create follow-up tickets in `plans/tickets/` so they enter the `Backlog`, and hand the lessons to the Factory Coach for the retro.

## Board moves
None new on `plans/board.md` — the Incident Responder runs post-release and causes no column transition of its own. The follow-up tickets it creates enter the `Backlog` like any other captured work, to be refined and pulled later.

## Handoffs produced
Under `agent-factory/handoffs/`: `incident-postmortem.md` (Incident Responder) — the blameless postmortem: timeline, impact, detection, root cause (systemic, not personal), mitigation taken, rollback used, what went well, what to improve, and the follow-up ticket IDs created.

## Trace updates
Append to `plans/traceability.md`: record the incident ID (`INC-xxxx`) and the follow-up ticket IDs against the affected release and tickets, and update `Status`, so the incident and its remediation trace back to the change that caused it.

## Metrics emitted
Record `Escaped defects` in `plans/metrics.md` for the incident, if applicable. Report the timeline and root cause exactly as observed; never fake a root cause, a rollback that did not run, or a remediation that did not happen — mark anything unverified `UNKNOWN - verify`.

## Stop conditions
- The blast radius is unclear — mitigate or roll back first to limit harm, and write the postmortem after. Production action is always human-confirmed; the postmortem is blameless and examines the system, never a person.

## Done condition
The blameless postmortem `agent-factory/handoffs/incident-postmortem.md` is written, and the follow-up tickets are created in `plans/tickets/` so they enter the `Backlog`. The postmortem never blames a person; it examines the system and the process.
