<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# grugops reference

This is the generated reference for the grugops kit: 19 roles and 7 skills, each with its
own page, and 20 workflows. The pages are generated from the role, skill and workflow files
by `scripts/generate-catalog.js` and are never hand-edited; re-run the generator and commit the
result. Any unverified field reads `UNKNOWN - verify` rather than an invented value.

## Roles

| Role | Tier | One job | Page | Source |
| --- | --- | --- | --- | --- |
| AGENTS.md Scribe | core | Author and maintain the root `AGENTS.md` substrate, including the 12 coding rules it carries. | [agents-md-scribe](agents/agents-md-scribe.md) | [agent-factory/roles/agents-md-scribe.md](../../agent-factory/roles/agents-md-scribe.md) |
| Architect/Design | core | Make the structure and boundaries the work is built on. | [architect-design](agents/architect-design.md) | [agent-factory/roles/architect-design.md](../../agent-factory/roles/architect-design.md) |
| BA/PM | core | Cut a product idea down to a defensible MVP of testable, measurable tickets. | [ba-pm](agents/ba-pm.md) | [agent-factory/roles/ba-pm.md](../../agent-factory/roles/ba-pm.md) |
| Brownfield Mapper | core | Inspect an existing repo and produce a read-only map of it. | [brownfield-mapper](agents/brownfield-mapper.md) | [agent-factory/roles/brownfield-mapper.md](../../agent-factory/roles/brownfield-mapper.md) |
| Designer | core | Set the product-wide design strategy and guidelines every UI ticket builds on. | [designer](agents/designer.md) | [agent-factory/roles/designer.md](../../agent-factory/roles/designer.md) |
| Frontend/UI | core | Author the UI/design contract the engineer builds against and QE verifies. | [frontend-ui](agents/frontend-ui.md) | [agent-factory/roles/frontend-ui.md](../../agent-factory/roles/frontend-ui.md) |
| Greenfield Mapper | core | Shape empty land into a repo structure, a stack choice, and a first architecture sketch. | [greenfield-mapper](agents/greenfield-mapper.md) | [agent-factory/roles/greenfield-mapper.md](../../agent-factory/roles/greenfield-mapper.md) |
| Orchestrator | core | Decompose each request into subtasks and route each to the right role agent over the shared queue. | [orchestrator](agents/orchestrator.md) | [agent-factory/roles/orchestrator.md](../../agent-factory/roles/orchestrator.md) |
| QE/E2E | core | Break the feature with tests and report the gaps. | [qe-e2e](agents/qe-e2e.md) | [agent-factory/roles/qe-e2e.md](../../agent-factory/roles/qe-e2e.md) |
| Security/NFR | core | Review a change for security and non-functional risk, and return a result with required fixes and accepted risks. | [security-nfr](agents/security-nfr.md) | [agent-factory/roles/security-nfr.md](../../agent-factory/roles/security-nfr.md) |
| Software Engineer | core | Implement one ticket end to end. | [software-engineer](agents/software-engineer.md) | [agent-factory/roles/software-engineer.md](../../agent-factory/roles/software-engineer.md) |
| System Analyst | core | Map the system behavior a product ticket implies, so the work is design-ready. | [system-analyst](agents/system-analyst.md) | [agent-factory/roles/system-analyst.md](../../agent-factory/roles/system-analyst.md) |
| Tech Lead | core | Score each ticket's complexity, name the engineer level and plan the dev tasks. | [tech-lead](agents/tech-lead.md) | [agent-factory/roles/tech-lead.md](../../agent-factory/roles/tech-lead.md) |
| UAT Planner | core | Plan business acceptance so a named human can accept the work. | [uat-planner](agents/uat-planner.md) | [agent-factory/roles/uat-planner.md](../../agent-factory/roles/uat-planner.md) |
| Compliance Officer | enterprise | Protect people and the audit trail: classify the data a change touches and record the controls and gaps. | [compliance-officer](agents/compliance-officer.md) | [agent-factory/roles/compliance-officer.md](../../agent-factory/roles/compliance-officer.md) |
| Factory Coach | enterprise | Turn the delivery metrics into improvement tickets for the factory itself. | [factory-coach](agents/factory-coach.md) | [agent-factory/roles/factory-coach.md](../../agent-factory/roles/factory-coach.md) |
| Incident Responder | enterprise | Stop the bleeding first, then write a blameless postmortem. | [incident-responder](agents/incident-responder.md) | [agent-factory/roles/incident-responder.md](../../agent-factory/roles/incident-responder.md) |
| Installer | enterprise | Make this factory usable in the current tool. | [installer](agents/installer.md) | [agent-factory/roles/installer.md](../../agent-factory/roles/installer.md) |
| Release Manager | enterprise | Cut a release and hand it to a named human for approval. | [release-manager](agents/release-manager.md) | [agent-factory/roles/release-manager.md](../../agent-factory/roles/release-manager.md) |

## Skills

| Skill | What it does | Page | Source |
| --- | --- | --- | --- |
| gate | Run the grugops PR quality gate — install, lint, typecheck, unit, build, e2e, bounded self-fix, then report. Recommendation only; never merges. | [gate](skills/gate.md) | [skills/gate/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/gate/SKILL.md) |
| grugops | The grugops factory dispatcher — route any software-delivery request through the Orchestrator (bootstrap, plan, implement, gate, UAT, release). | [grugops](skills/grugops.md) | [skills/grugops/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/grugops/SKILL.md) |
| map | Map or bootstrap a repo with the grugops factory — greenfield scaffold or brownfield survey, then seed the factory state. | [map](skills/map.md) | [skills/map/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/map/SKILL.md) |
| plan | Plan work with the grugops factory — turn an idea into epics, or turn an epic into ready tickets. | [plan](skills/plan.md) | [skills/plan/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/plan/SKILL.md) |
| release | Cut a release with the grugops Release Manager. Human-confirmed deploy only — a named human must approve the production deploy. | [release](skills/release.md) | [skills/release/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/release/SKILL.md) |
| ticket | Drive a ready ticket to a pull request with the grugops factory — implement on a branch, run the gate, stop at the PR. | [ticket](skills/ticket.md) | [skills/ticket/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/ticket/SKILL.md) |
| uat | Build a UAT pack with the grugops factory — assemble the acceptance scenarios a human runs before sign-off. | [uat](skills/uat.md) | [skills/uat/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/uat/SKILL.md) |

## Workflows

| # | Workflow | Cadence | When to use | Source |
| --- | --- | --- | --- | --- |
| 0 | Bootstrap greenfield | both | When you have a new idea and an empty (or near-empty) repo and want the factory to stand up the project plane from scratch. | [agent-factory/workflows/00-bootstrap-greenfield.md](../../agent-factory/workflows/00-bootstrap-greenfield.md) |
| 1 | Bootstrap brownfield | both | When you drop the factory onto an existing repo and want it mapped, documented, and made safe to work in before any change lands. | [agent-factory/workflows/01-bootstrap-brownfield.md](../../agent-factory/workflows/01-bootstrap-brownfield.md) |
| 2 | Idea to epics | both | When a raw idea or request needs to become epics the team can plan against. | [agent-factory/workflows/02-idea-to-epics.md](../../agent-factory/workflows/02-idea-to-epics.md) |
| 3 | Epic to tickets | both | When an epic needs to become small, ready, traceable tickets. | [agent-factory/workflows/03-epic-to-tickets.md](../../agent-factory/workflows/03-epic-to-tickets.md) |
| 4 | Ticket to PR | both | When a ready ticket needs to become a pull request a human can review. | [agent-factory/workflows/04-ticket-to-pr.md](../../agent-factory/workflows/04-ticket-to-pr.md) |
| 5 | PR quality gate | both | When a change is implemented and needs to pass the gate before a human reviews it. | [agent-factory/workflows/05-pr-quality-gate.md](../../agent-factory/workflows/05-pr-quality-gate.md) |
| 6 | UAT pack | both | When a feature is complete and a named human must accept it before release. | [agent-factory/workflows/06-uat-pack.md](../../agent-factory/workflows/06-uat-pack.md) |
| 7 | Backlog refinement | both | Run this regularly to keep the `Ready` column stocked, or right before planning. | [agent-factory/workflows/07-backlog-refinement.md](../../agent-factory/workflows/07-backlog-refinement.md) |
| 8 | Sprint planning | scrum | At the start of a sprint, when the team works in time-boxed iterations. | [agent-factory/workflows/08-sprint-planning.md](../../agent-factory/workflows/08-sprint-planning.md) |
| 9 | Daily sweep | both | Run this on demand or on a schedule to reconcile the board and surface what is stuck. | [agent-factory/workflows/09-daily-sweep.md](../../agent-factory/workflows/09-daily-sweep.md) |
| 10 | Sprint review | scrum | At the end of a sprint, when the box closes and the team accepts what got done. | [agent-factory/workflows/10-sprint-review.md](../../agent-factory/workflows/10-sprint-review.md) |
| 11 | Retro | both | Run this to learn from the metrics and improve the factory itself. | [agent-factory/workflows/11-retro.md](../../agent-factory/workflows/11-retro.md) |
| 12 | Release | UNKNOWN - verify | Run this when a ticket reaches `Ready to Release` and a release must be cut. | [agent-factory/workflows/12-release.md](../../agent-factory/workflows/12-release.md) |
| 13 | Incident | UNKNOWN - verify | Run this when a production incident is detected or an SLO is failing after release. | [agent-factory/workflows/13-incident.md](../../agent-factory/workflows/13-incident.md) |
| 14 | UI design to build | both | When a ticket needs UI/frontend work — a design contract authored once, then built and verified. | [agent-factory/workflows/14-ui-design-to-build.md](../../agent-factory/workflows/14-ui-design-to-build.md) |
| 15 | Security audit (OWASP ASVS) | both | When a deep, standalone security audit is wanted — on demand, per phase, or per milestone. | [agent-factory/workflows/15-security-audit.md](../../agent-factory/workflows/15-security-audit.md) |
| 16 | context read/write | both | Whenever a role is about to act on, or record into, the shared verified context. | [agent-factory/workflows/16-context-read-write.md](../../agent-factory/workflows/16-context-read-write.md) |
| 17 | task claim + schedule | both | Whenever the Orchestrator schedules the queue, or a role takes or finishes a queued subtask. | [agent-factory/workflows/17-task-claim.md](../../agent-factory/workflows/17-task-claim.md) |
| 18 | context compaction | both | Whenever an agent has accumulated a verbose local trajectory for a task and is about to promote results into the shared verified context. | [agent-factory/workflows/18-context-compaction.md](../../agent-factory/workflows/18-context-compaction.md) |
| 20 | upstream sources | both | Whenever `.grugops/factory.config.json` declares upstream sources under `upstream.sources`, and the work needs what a source decides. | [agent-factory/workflows/20-upstream-sources.md](../../agent-factory/workflows/20-upstream-sources.md) |
