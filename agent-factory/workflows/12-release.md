---
kind: workflow
order: 12
tier: enterprise
---
# Workflow: Release

## When to use
Run this when a ticket reaches `Ready to Release` and a release must be cut. This is an enterprise workflow — it runs whenever `mode=enterprise`, and is optional in lean. grug cut release, not corner — but grug never push the big red button alone. The flow: `Ready to Release -> Release Manager -> approval gate -> deploy plan -> (human-confirmed) deploy -> Done`. The deploy gate here is prose: it states who must approve and that the production action is human-confirmed; the mechanical enforcement is a later phase, so this workflow stays neutral about how a given tool dispatches it.

## Agents involved
- Release Manager — sets the version, compiles the changelog and release notes, confirms the deploy/rollback/DR plans, attaches the evidence, works the readiness checklist, records the named approval, and writes both the release record and the release handoff. The Release Manager prepares the release and requires approval; it never deploys prod itself.

Roles activate via the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`): one window, drop prior context, the handoff is the only memory.

## Inputs required
- The implementation, QE, security/NFR, and UAT filled handoffs in `plans/handoffs/` (the `<TICKET-ID>-implementation.md` / `-qe.md` / `-security-nfr.md` / `-uat.md` instances) for the tickets going into the release — the gate results that prove the work is ready.
- `plans/nfr-catalog.md` — the NFR budgets and evidence to attach.
- `agent-factory/checklists/release-readiness-checklist.md` — the enterprise readiness gate this workflow works through.
- `.grugops/factory.config.json` for `mode`, `environments`, and `production_requires_human_confirmation`.

## Steps
1. Set the version (SemVer) and pick the scope — the tickets included in this release.
2. Compile the changelog and the release notes from the included tickets.
3. Confirm the migration plan, the rollback plan, and the DR notes (RTO/RPO) for the `dev -> staging -> prod` path.
4. Attach the NFR, security, and compliance evidence from `plans/nfr-catalog.md`.
5. Work through `agent-factory/checklists/release-readiness-checklist.md` and record the result.
6. Record a named human approval, then a named human confirms the production action. This is keyed to `production_requires_human_confirmation: true`: deploy to production happens only after a named human approves, the production action is always human-confirmed, and this workflow never deploys prod itself.

## Board moves
On `plans/board.md`, the Release Manager owns the `Ready to Release` exit: while the release is being cut and approved the ticket sits in `Ready to Release`, and only after a named human approves the deploy does the ticket move to `Done`.

## Handoffs produced
Under `plans/handoffs/` (filled from the templates in `agent-factory/handoffs/`): `<REL-ID>-release.md` (Release Manager), the release handoff filled per release. The release record itself — version, scope, changelog, release notes, the `dev -> staging -> prod` path, the migration/rollback plan, the DR notes, and the approval record — is written to `plans/releases/REL-xxxx.md`.

## Trace updates
Append to `plans/traceability.md`: record the release ID (`REL-xxxx`) against each ticket in the release and update `Status`, so every shipped change traces back through its UAT, test, and implementation rows to its product ticket. The enterprise definition of done is not met until the `Release` column of the row is complete.

## Metrics emitted
Record `Lead time` in `plans/metrics.md` as the release clears. Report the values exactly as they stand; never fake a passing gate, a clean release, or an approval that did not happen — mark anything unverified `UNKNOWN - verify`.

## Stop conditions
- The `release-readiness-checklist.md` fails, or there is no named human approval — set the status to `BLOCKED` and do not deploy. The release waits for a named human; this workflow never deploys prod itself.

## Done condition
The release handoff `plans/handoffs/<REL-ID>-release.md` and the release record `plans/releases/REL-xxxx.md` are written, and the status is one of `READY_TO_RELEASE | BLOCKED | RELEASED`. A release reaches `RELEASED` only after a named human approves and confirms the production action.

## Commit
Commit the artifacts this workflow wrote (the `plans/handoffs/<REL-ID>-release.md`, the `plans/releases/REL-xxxx.md` record with its approval entry, the board move, the metric, and the release-linked traceability rows) per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch; switch to `grugops/release-<id>`), then `type(scope): summary`. The commit records the release; it does not deploy it — never merge, never deploy; the production action stays human-confirmed and humans hold both.
