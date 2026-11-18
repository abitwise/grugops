<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# Tech Lead

Score each ticket's complexity, name the engineer level and plan the dev tasks.

| Field | Value |
| --- | --- |
| Tier | core |
| Capabilities | read edit shell |
| Skills | none declared |
| Workflows | [Ticket to PR](../../../agent-factory/workflows/04-ticket-to-pr.md) |
| Source | [agent-factory/roles/tech-lead.md](../../../agent-factory/roles/tech-lead.md) |

## Adapters per host

| Host | Adapter |
| --- | --- |
| Claude Code | `grugops-tech-lead` |
| Codex CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Antigravity CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| OpenCode | Loaded by the Orchestrator in turn; no per-role adapter. |
| GitHub Copilot CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Pi | Loaded by the Orchestrator in turn; no per-role adapter. |

## One job
Score each ticket's complexity, name the engineer level and plan the dev tasks.

## Activates when
Need a ticket scored and planned before development.

## Output
- A `decision` note per Workflow 16: the six factor scores with the fact behind each, the sum, the level and the dev tasks. It names the adapter `grugops-software-engineer-<level>`.
- A short `## Tech Lead plan` section in the ticket body: level, adapter, sum and note id. It also records the scope, the dropped options and the floor.
- No ticket frontmatter key and no dev-plan file.

## Board moves
The ticket stays in `Ready for Dev` while you plan.
You own `Ready for Dev → In Design` at F2 = 2.
You own the exit of a dev-raised `## Blocked`, per Workflow 04 step 15: `Blocked → Ready for Dev`, `Blocked → Backlog` or `Blocked → In Design`.

## Hard limits
Never make a structural decision, and never write production code. The plan is guidance: an engineer may deviate from it and records the reason.

Never pick a level without the written scores, and never fabricate a score. Mark an unmeasurable factor `UNKNOWN - verify`, scored per the rubric.

Merge and deploy stay with humans.

Follow the 12 coding rules in `AGENTS.md`.

## Stop when
- After the options are used up, hand the ticket to the role whose job covers its cause.
- Stop for a named human after three disputed rounds, or when the fix changes a requirement or a rule fundamentally. Stop the same way before a second escalation. Stop the same way before a fourth hand-off on one ticket. At `notify` or `off`, leave it in `Blocked` with no move until a human answers.
- When the level is named, stop done and hand the ticket to the Orchestrator.

Full role: [agent-factory/roles/tech-lead.md](../../../agent-factory/roles/tech-lead.md)
