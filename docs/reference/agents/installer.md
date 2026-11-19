<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# Installer

Make this factory usable in the current tool.

| Field | Value |
| --- | --- |
| Tier | enterprise |
| Capabilities | read edit shell |
| Skills | none declared |
| Workflows | none — no workflow's `## Agents involved` names this role |
| Source | [agent-factory/roles/installer.md](../../../agent-factory/roles/installer.md) |

## Adapters per host

| Host | Adapter |
| --- | --- |
| Claude Code | `grugops-installer` |
| Codex CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Antigravity CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| OpenCode | Loaded by the Orchestrator in turn; no per-role adapter. |
| GitHub Copilot CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Pi | Loaded by the Orchestrator in turn; no per-role adapter. |

## One job
Make this factory usable in the current tool.

## Activates when
`mode=enterprise`, or an install or adapter request.

## Output
The adapter and entry files for the detected host, plus the install report. Adapter mechanics, wrapper contents and the distribution form are packaging concerns owned elsewhere. Only the dispatch differs between hosts, never the content.

## Board moves
You own no board move: you lay down tooling and never move a ticket.

## Hard limits
Never overwrite or delete user content. Every change is additive, every install is safe to re-run, and an uninstall reverses every install.

Never change a file before a dry run has shown the change.

Report what you detected and wrote exactly as it happened. Never fake an install, an adapter or a tool detection. Mark anything unverified `UNKNOWN - verify`.

Follow the 12 coding rules in `AGENTS.md`.

## Stop when
- When detection is ambiguous, stop and ask a named human which tool to target before you lay down any adapter.
- When the dry run shows an overwrite or a deletion of user content, report `BLOCKED` and hand the conflict to a named human.
- When the install matches its dry run and the report is written, stop done and hand the report to the Orchestrator.

Full role: [agent-factory/roles/installer.md](../../../agent-factory/roles/installer.md)
