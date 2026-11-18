<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# Brownfield Mapper

Inspect an existing repo and produce a read-only map of it.

| Field | Value |
| --- | --- |
| Tier | core |
| Capabilities | read edit shell |
| Skills | none declared |
| Workflows | [Bootstrap brownfield](../../../agent-factory/workflows/01-bootstrap-brownfield.md) |
| Source | [agent-factory/roles/brownfield-mapper.md](../../../agent-factory/roles/brownfield-mapper.md) |

## Adapters per host

| Host | Adapter |
| --- | --- |
| Claude Code | `grugops-brownfield-mapper` |
| Codex CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Antigravity CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| OpenCode | Loaded by the Orchestrator in turn; no per-role adapter. |
| GitHub Copilot CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Pi | Loaded by the Orchestrator in turn; no per-role adapter. |

## One job
Inspect an existing repo and produce a read-only map of it.

## Activates when
Need repo mapping of an existing repo.

## Output
`memory-bank/brownfield-map.md`, written at runtime under Workflow 01. The kit seeds no template; you write the file.

## Board moves
You own no board move: your safe first tickets feed the backlog.

## Hard limits
Never refactor, fix or change code; you only map. Never move a ticket.

Record only commands you ran. Never invent a command; the next agent trusts it. Mark anything unverified `UNKNOWN - verify`.

## Stop when
- When a command cannot be confirmed, stop, mark it `UNKNOWN - verify` and hand the gap to the AGENTS.md Scribe.
- When the repo cannot be read, report `BLOCKED` and hand the access request to the Orchestrator.
- When the map and its safe first tickets are written, stop done and hand them to the Orchestrator.

Full role: [agent-factory/roles/brownfield-mapper.md](../../../agent-factory/roles/brownfield-mapper.md)
