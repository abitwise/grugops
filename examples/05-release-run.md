# Example: Release run

> Illustrative run — expected output, not a captured session

This narrates the frozen `12-release` enterprise flow: a ticket that reached
`Ready to Release` is cut into a release by the Release Manager — version, changelog,
rollback, evidence, readiness checklist, and a named human approval — and only after a named
human confirms the production action does it reach `Done`. `REL-0007` and `<PR-link>` are
obvious placeholders, not real artifacts. The flow is `Ready to Release -> Release Manager ->
approval gate -> deploy plan -> (human-confirmed) deploy -> Done`.

---

## Input

With the FX conversion work signed off through UAT and sitting in `Ready to Release`, a
release lead asks the Orchestrator to cut the release:

```text
/grugops "cut release REL-0007 for the FX conversion work that passed UAT"
```

In the plugin distribution form the same operation is also reachable as `/grugops:release`
(colon form); the dash-standalone `/grugops-release` is disabled from model auto-invocation,
so a release is never fired without an explicit human request.

## Orchestrator decision

The Orchestrator classifies the request as `release`, confirms `mode=enterprise`, and routes
to the Release Manager:

```markdown
# Orchestrator Decision
## Request type
release — cut REL-0007 for the UAT-signed FX conversion ticket.
## Mode/Cadence/Autonomy in effect
mode=enterprise · cadence=scrum · autonomy=pr
## Activated agents
Release Manager
## Why
grug cut release, not corner — but grug never push the big red button alone.
## Required inputs
the implementation/QE/security-NFR/UAT handoffs for the included tickets; plans/nfr-catalog.md;
release-readiness-checklist.md; factory.config.json (production_requires_human_confirmation)
## Workflow
12-release.md
## Board moves
Release Manager owns the Ready to Release exit; ticket moves to Done only after a named human
approves the deploy
## Expected handoffs
agent-factory/handoffs/release-handoff.md; plans/releases/REL-0007.md
## Stop conditions
release-readiness-checklist fails, or there is no named human approval -> BLOCKED, do not deploy
## Next action
Release Manager sets the SemVer version and compiles the changelog
```

## Board moves

The Release Manager owns the `Ready to Release` exit. While the release is being cut and
approved, the ticket sits in `Ready to Release`; only after a named human approves and
confirms the production action does it move to `Done`:

```text
## Ready to Release (WIP 1/4)
- [ABC-012] Portfolio FX conversion  (release: REL-0007, status: READY_TO_RELEASE)

## Done (WIP unlimited)
```

## Expected files and handoffs

The Release Manager prepares the release and requires approval; it never deploys prod itself.
It writes the release record `plans/releases/REL-0007.md` (representative snippet):

```markdown
# REL-0007
## Version
1.4.0  (SemVer — MINOR: adds FX conversion, no breaking change)
## Scope
- ABC-012  Portfolio FX conversion
## Changelog
### Added
- Multi-currency FX conversion on the portfolio view.
## Path
dev -> staging -> prod
## Rollback plan
Re-deploy 1.3.2; FX feature flag off; no schema migration to reverse.
## DR notes
RTO 30m · RPO 5m
## Readiness checklist
release-readiness-checklist.md — PASS (evidence attached from plans/nfr-catalog.md)
## Status
READY_TO_RELEASE
```

and the handoff `agent-factory/handoffs/release-handoff.md` carrying the version, scope,
evidence, and the approval record.

## The deploy gate (named-human confirmation)

The following is stated in clear, professional English — it is a safety topic, so there is no
caveman voice here.

This release is keyed to `production_requires_human_confirmation: true`. Deployment to
production happens only after a named human approves the release, and the production action
is always confirmed by a named human. This workflow never deploys to production itself, and
it never self-approves. If the readiness checklist fails, or if there is no named human
approval, the release status is set to `BLOCKED` and no deployment occurs — the release waits
for a named human to act.

The approval record in `REL-0007.md` captures who approved and who confirmed:

```markdown
## Approval record
- Approved by:  <release-lead name> (release lead) — <approval-date>
- Confirmed by: <named human> (production action) — <confirmation-date>
## Status
RELEASED
```

A release reaches `RELEASED` only after a named human approves and confirms the production
action. Humans hold merge and deploy.

## Trace updates (completed rows)

On `RELEASED`, the Release Manager records `REL-0007` against each included ticket in
`plans/traceability.md` and updates `Status` to `Done`, so every shipped change traces back
through its UAT, test, and implementation rows to its product ticket. The enterprise
definition of done is met only when the row is complete through the `Release` column:

| Ticket | Title | Epic | Feature | NFRs | Code (PR/files) | Tests | UAT | Release | Status |
|--------|-------|------|---------|------|-----------------|-------|-----|---------|--------|
| ABC-012 | Portfolio FX conversion | EPIC-003 | FEAT-007 | NFR-002 | `<PR-link>` / src/fx/* | fx.spec.ts, e2e/fx | UAT-12 pass | REL-0007 | Done |

## Metrics and done

`plans/metrics.md` records `Lead time` as the release clears — reported exactly as it stands,
never faking a passing gate, a clean release, or an approval that did not happen; anything
unverified is marked `UNKNOWN - verify`. The release is done: the release handoff and
`plans/releases/REL-0007.md` are written, the status is `RELEASED`, the traceability row is
complete through `Release`, and a named human approved and confirmed the production action.
