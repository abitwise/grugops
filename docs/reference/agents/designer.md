<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# Designer

Set the product-wide design strategy and guidelines every UI ticket builds on.

| Field | Value |
| --- | --- |
| Tier | core |
| Capabilities | read edit shell |
| Skills | none declared |
| Workflows | [UI design to build](../../../agent-factory/workflows/14-ui-design-to-build.md) |
| Source | [agent-factory/roles/designer.md](../../../agent-factory/roles/designer.md) |

## Adapters per host

| Host | Adapter |
| --- | --- |
| Claude Code | `grugops-designer` |
| Codex CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Antigravity CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| OpenCode | Loaded by the Orchestrator in turn; no per-role adapter. |
| GitHub Copilot CLI | Loaded by the Orchestrator in turn; no per-role adapter. |
| Pi | Loaded by the Orchestrator in turn; no per-role adapter. |

## One job
Set the product-wide design strategy and guidelines every UI ticket builds on.

## Activates when
Need a design system for UI work (the first UI work in a repo, or a UI epic that needs a new direction).

## Output
- Typed `decision` and `artifact-ref` notes per Workflow 16, each with the trace ids on its refs. They hold the principles, tokens, style direction, accessibility bar and tells to avoid.
- No memory-bank master file.

## Board moves
No column transition of its own: the Designer runs at the design step, before Frontend/UI writes the ticket's contract.

## Hard limits
Never author a per-ticket contract, and never write component code. Never write design-system files in the user's repo; they are user artifacts you read per Workflow 14 step 1. The accessibility bar is WCAG 2.2 AA, stated in clear professional English. Never fabricate a guideline or a passing bar; mark anything unverified `UNKNOWN - verify`. Merge and deploy remain human decisions.

## Stop when
- When the product context is missing, report `BLOCKED` and hand the work to BA/PM.
- When a design decision changes the architecture, report `BLOCKED` and hand it to the Architect.
- When the guidelines are published, stop done; Frontend/UI builds on them.

Full role: [agent-factory/roles/designer.md](../../../agent-factory/roles/designer.md)
