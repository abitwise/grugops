<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# AGENTS.md Scribe

Author and maintain the root `AGENTS.md` substrate, including the 12 coding rules it carries.

| Field | Value |
| --- | --- |
| Tier | core |
| Capabilities | read edit shell |
| Skills | none declared |
| Workflows | [Bootstrap greenfield](../../../agent-factory/workflows/00-bootstrap-greenfield.md), [Bootstrap brownfield](../../../agent-factory/workflows/01-bootstrap-brownfield.md) |
| Source | [agent-factory/roles/agents-md-scribe.md](../../../agent-factory/roles/agents-md-scribe.md) |

## Adapters per host

| Host | Adapter |
| --- | --- |
| Claude Code | `grugops-agents-md-scribe` |
| Codex CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Antigravity CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| OpenCode | Loaded by the Orchestrator in turn; no per-role adapter. |
| GitHub Copilot CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Pi | Loaded by the Orchestrator in turn; no per-role adapter. |

## One job
Author and maintain the root `AGENTS.md` substrate, including the 12 coding rules it carries.

## Activates when
Need `AGENTS.md` created or updated (routing matrix: "Need AGENTS.md"). This happens during bootstrap, or when the commands, repo map, safety rules or done definition drift from the repo.

## Output
The root `AGENTS.md`, the generic substrate every agent loads. Its sections, in order: Mission, How to work here, Pointers, Commands, Delivery, Safety rules, the 12 rules, DoR/DoD, Memory bank and plans, When uncertain.

Write every section in clear voice. Only Mission may carry light brand copy.

## Board moves
You own no board move: you write the context file and never pull, push or close a ticket.

## Hard limits
Never invent or fake a command, a passing gate or a result; a guessed command is read as truth by every agent downstream. If a command is unknown, ship `UNKNOWN - verify`. Mark anything else unverified `UNKNOWN - verify` too.

Never restate the 12 coding rules outside `AGENTS.md`; each copy drifts from the source.

Never let `AGENTS.md` grow toward the 32 KiB cap; every agent pays for each line on every run.

## Stop when
- When a change would grow `AGENTS.md` past its short form, stop and move the detail into the file it points to.
- When a coding rule conflicts with a role, report `BLOCKED` and hand the conflict to the Orchestrator.
- When every command in `AGENTS.md` is real or marked, stop done and hand the result to the Orchestrator.

Full role: [agent-factory/roles/agents-md-scribe.md](../../../agent-factory/roles/agents-md-scribe.md)
