<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# grugops Catalog

This is the generated, browsable index of the grugops kit: 17 role personas and
16 workflows. Each row links to its source file. The catalog is produced by
`scripts/generate-catalog.js` and is never hand-edited — re-run the generator and commit the
result. Any unverified field is marked `UNKNOWN - verify` rather than invented.

## Roles

| Role | Tier | One job | Source |
| --- | --- | --- | --- |
| AGENTS.md Scribe | core | Author and maintain the root `AGENTS.md` substrate — short, high-signal, real commands only — and own the 12 coding rules that live within it. | [agent-factory/roles/agents-md-scribe.md](/agent-factory/roles/agents-md-scribe.md) |
| Architect/Design | core | Make the structure and boundaries — expose tradeoffs, write ADRs, and seed the NFR catalog — keeping design just enough so the work is ready for dev. | [agent-factory/roles/architect-design.md](/agent-factory/roles/architect-design.md) |
| BA/PM | core | Find the user, the pain, and the value, then cut scope to a defensible MVP — turn an idea into epics, features, and tickets whose acceptance is testable and measurable. | [agent-factory/roles/ba-pm.md](/agent-factory/roles/ba-pm.md) |
| Brownfield Mapper | core | Inspect an existing repo and produce a read-only map — structure, commands, architecture, tests, risks, and safe first tickets. | [agent-factory/roles/brownfield-mapper.md](/agent-factory/roles/brownfield-mapper.md) |
| Frontend/UI | core | Author the UI/design contract the engineer builds against and QE verifies — design tokens, component inventory, the five states, and the accessibility bar. | [agent-factory/roles/frontend-ui.md](/agent-factory/roles/frontend-ui.md) |
| Greenfield Mapper | core | Shape empty land — choose a boring stack unless told otherwise, lay out the folder and docs plan, and sketch a first architecture. | [agent-factory/roles/greenfield-mapper.md](/agent-factory/roles/greenfield-mapper.md) |
| Orchestrator | core | Route each incoming request to the right role agent within hard limits — read the config and board first, keep scope small, enforce WIP, demand a handoff, and make the next step obvious. | [agent-factory/roles/orchestrator.md](/agent-factory/roles/orchestrator.md) |
| QE/E2E | core | Break the feature — test happy, sad, and edge paths, write E2E where useful with stable selectors, avoid flaky tests, and report the gaps. | [agent-factory/roles/qe-e2e.md](/agent-factory/roles/qe-e2e.md) |
| Security/NFR | core | Look for danger across a change — review authentication, data, secrets, performance, reliability, logging, and compliance notes — and return a clear result with required fixes and accepted risks. | [agent-factory/roles/security-nfr.md](/agent-factory/roles/security-nfr.md) |
| Software Engineer | core | Implement one ticket — read the handoff first, make a small diff, add tests, run checks, and update docs. | [agent-factory/roles/software-engineer.md](/agent-factory/roles/software-engineer.md) |
| System Analyst | core | Take product tickets and map the system behavior — actors, flows, states, inputs, outputs, edge cases — so the work is design-ready. | [agent-factory/roles/system-analyst.md](/agent-factory/roles/system-analyst.md) |
| UAT Planner | core | Speak business — make the test scenarios, signoff checklist, test data, and pass/fail criteria so a named human can accept the work. | [agent-factory/roles/uat-planner.md](/agent-factory/roles/uat-planner.md) |
| Compliance Officer | enterprise | Protect people and the audit trail: classify the data a change touches, map the PII flow, check the applicable regime, and record the controls in place and the gaps that remain. | [agent-factory/roles/compliance-officer.md](/agent-factory/roles/compliance-officer.md) |
| Factory Coach | enterprise | Read the metrics, run the retro, find the waste — rework, escaped defects, slow gates — and write improvement tickets for the factory itself. | [agent-factory/roles/factory-coach.md](/agent-factory/roles/factory-coach.md) |
| Incident Responder | enterprise | Stop the bleeding first, find the blast radius, propose mitigation and rollback, then write a blameless postmortem and turn its lessons into tickets. | [agent-factory/roles/incident-responder.md](/agent-factory/roles/incident-responder.md) |
| Installer | enterprise | Make this factory usable in the current tool — detect the host coding agent, lay down the right adapter and entry file, and stay additive. | [agent-factory/roles/installer.md](/agent-factory/roles/installer.md) |
| Release Manager | enterprise | Cut a release — set the version, write release notes and the changelog, make a deploy plan and a rollback plan — and hand it to a named human for approval. | [agent-factory/roles/release-manager.md](/agent-factory/roles/release-manager.md) |

## Workflows

| # | Workflow | Cadence | When to use | Source |
| --- | --- | --- | --- | --- |
| 0 | Bootstrap greenfield | both | When you have a new idea and an empty (or near-empty) repo and want the factory to stand up the project plane from scratch. | [agent-factory/workflows/00-bootstrap-greenfield.md](/agent-factory/workflows/00-bootstrap-greenfield.md) |
| 1 | Bootstrap brownfield | both | When you drop the factory onto an existing repo and want it mapped, documented, and made safe to work in before any change lands. | [agent-factory/workflows/01-bootstrap-brownfield.md](/agent-factory/workflows/01-bootstrap-brownfield.md) |
| 2 | Idea to epics | both | When a raw idea or request needs to become epics the team can plan against. | [agent-factory/workflows/02-idea-to-epics.md](/agent-factory/workflows/02-idea-to-epics.md) |
| 3 | Epic to tickets | both | When an epic needs to become small, ready, traceable tickets. | [agent-factory/workflows/03-epic-to-tickets.md](/agent-factory/workflows/03-epic-to-tickets.md) |
| 4 | Ticket to PR | both | When a ready ticket needs to become a pull request a human can review. | [agent-factory/workflows/04-ticket-to-pr.md](/agent-factory/workflows/04-ticket-to-pr.md) |
| 5 | PR quality gate | both | When a change is implemented and needs to pass the gate before a human reviews it. | [agent-factory/workflows/05-pr-quality-gate.md](/agent-factory/workflows/05-pr-quality-gate.md) |
| 6 | UAT pack | both | When a feature is complete and a named human must accept it before release. | [agent-factory/workflows/06-uat-pack.md](/agent-factory/workflows/06-uat-pack.md) |
| 7 | Backlog refinement | both | Run this regularly to keep the `Ready` column stocked, or right before planning. | [agent-factory/workflows/07-backlog-refinement.md](/agent-factory/workflows/07-backlog-refinement.md) |
| 8 | Sprint planning | scrum | At the start of a sprint, when the team works in time-boxed iterations. | [agent-factory/workflows/08-sprint-planning.md](/agent-factory/workflows/08-sprint-planning.md) |
| 9 | Daily sweep | both | Run this on demand or on a schedule to reconcile the board and surface what is stuck. | [agent-factory/workflows/09-daily-sweep.md](/agent-factory/workflows/09-daily-sweep.md) |
| 10 | Sprint review | scrum | At the end of a sprint, when the box closes and the team accepts what got done. | [agent-factory/workflows/10-sprint-review.md](/agent-factory/workflows/10-sprint-review.md) |
| 11 | Retro | both | Run this to learn from the metrics and improve the factory itself. | [agent-factory/workflows/11-retro.md](/agent-factory/workflows/11-retro.md) |
| 12 | Release | UNKNOWN - verify | Run this when a ticket reaches `Ready to Release` and a release must be cut. | [agent-factory/workflows/12-release.md](/agent-factory/workflows/12-release.md) |
| 13 | Incident | UNKNOWN - verify | Run this when a production incident is detected or an SLO is failing after release. | [agent-factory/workflows/13-incident.md](/agent-factory/workflows/13-incident.md) |
| 14 | UI design to build | both | When a ticket needs UI/frontend work — a design contract authored once, then built and verified. | [agent-factory/workflows/14-ui-design-to-build.md](/agent-factory/workflows/14-ui-design-to-build.md) |
| 15 | Security audit (OWASP ASVS) | both | When a deep, standalone security audit is wanted — on demand, per phase, or per milestone. | [agent-factory/workflows/15-security-audit.md](/agent-factory/workflows/15-security-audit.md) |
