# grugops — the agent factory

grugops is a file-based **agent factory** for software delivery. It is a small kit of
markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible
Kanban/Sprint board, and a traceability trail — that drops on top of a coding-agent CLI you
already use. One **Orchestrator** routes work through the full software-delivery lifecycle
(business analysis → product → system analysis → architecture → engineering → QE/E2E →
security/NFR/compliance → UAT → release), while a few single-job "grug" agents execute
within hard limits. The intelligence lives in the host coding agent; grugops only supplies
the role, the guardrail, the memory, the state, the dial, the proof, and the gates. Humans
always hold merge and deploy.

## Start here

**All work starts at `agent-factory/roles/orchestrator.md`.** Tell your coding agent:

> Read `agent-factory/roles/orchestrator.md`, then `.grugops/factory.config.json`,
> then `plans/board.md`. Act as the Orchestrator.

The Orchestrator reads the config, classifies your request, respects the board's WIP limits,
activates the right specialist roles, demands handoff packets, updates the board and
traceability, and produces the next action.

> **Note:** The portable root `AGENTS.md` substrate — the other entry point most host tools
> read automatically — **lands in Phase 3** (the "Roles & AGENTS.md Substrate" phase). It
> does **not** exist yet. Until it ships, point your agent directly at
> `agent-factory/roles/orchestrator.md` as shown above. The role prompts and workflow bodies
> referenced throughout this guide also ship in later phases (roles in Phase 3, workflows in
> Phase 4); this README documents how to use them and locks the frozen paths they will live at.

## Usage across the five tools

grugops works on Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
handoffs, and the gates are identical everywhere. The only difference is whether the host
tool can *spawn* sub-agents or must *load* role files into context one at a time.

| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`, Phase 3)    | Native sub-agents — the Orchestrator spawns role agents  |
| **Codex CLI**         | `AGENTS.md` (root + nested, global)              | Sequential role-load — no spawn                          |
| **Gemini CLI**        | `GEMINI.md` (or `AGENTS.md` via `context.fileName`) | Sequential role-load — no spawn                       |
| **OpenCode**          | `AGENTS.md` (+ its agent config)                 | Sequential role-load (or its own native agents)          |
| **GitHub Copilot CLI**| `AGENTS.md` (+ `.github/copilot-instructions.md`)| Sequential role-load — no spawn                          |

Where a tool supports real sub-agents (Claude Code), the Orchestrator spawns a role agent
when it would otherwise "wake" that role. Where it does not, the Orchestrator is a single
agent that *loads the relevant role file into context* at that moment. Same roles, same
handoffs, same gates — only the dispatch differs.

The detailed per-tool **adapters** (thin wrappers, slash commands, entry-file pointers, and
the Claude Code plugin form) ship in Phase 5 under `agent-factory/packaging/`. This table is
the usage overview; the adapters are the mechanical conveniences layered on top.

## Configuration

At runtime the Orchestrator reads the per-repo config dial at `.grugops/factory.config.json`.
The kit ships the lean default as the **seed source** at `agent-factory/config/factory.config.json`
(the installer seeds it into `.grugops/`), and it is documented field by field in
`agent-factory/config/factory.config.md`. The config is visible and editable — change a
value, change the factory's behavior.

The **zero-config baseline** is `mode=lean`, `cadence=kanban`, `autonomy=pr`. grugops runs
lean with no config at all, because every role falls back to these same documented defaults
when the file is absent. Edit the dial to scale up to enterprise governance (scrum cadence,
compliance regimes, release gates) on a single flag.

## How work flows

- **The board** — `plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — `plans/traceability.md` is the audit trail: one row per requirement,
  linking requirement → ticket → code → test → UAT → release, so every shipped change is
  accountable end to end.
- **The lifecycle** — the Orchestrator routes each request through the relevant stages
  (analysis → design → engineering → QE → security/NFR → UAT → release), demanding a handoff
  packet at each step so the next role inherits exactly what it needs.

## Copy-paste Orchestrator prompts

Paste any of these to your coding agent. Replace the `<...>` placeholders with your own
values. Each one starts the Orchestrator and runs the named workflow.

```text
# Bootstrap an existing repository (brownfield)
Use the Orchestrator. Bootstrap this repo as brownfield. Create AGENTS.md, memory-bank,
  brownfield map, the board, config, and safe first tickets.

# Plan a new idea from scratch (greenfield)
Use the Orchestrator. Plan this idea as greenfield: <idea>. Produce product/system/architecture
  handoffs, epics, first tickets, and seed the board.

# Refine the backlog and promote ready items                       (workflow 07)
Use the Orchestrator. Refine the backlog and promote ready items.

# Plan a sprint toward a goal                                       (workflow 08, scrum)
Use the Orchestrator. Plan sprint <n> toward goal: <goal>.

# Run the daily sweep (reconcile the board, surface blockers)       (workflow 09)
Use the Orchestrator. Run the daily sweep.

# Implement a ticket via ticket-to-pr                               (workflow 04)
Use the Orchestrator. Implement ticket <id> via ticket-to-pr.

# Run the PR quality gate for current changes                       (workflow 05)
Use the Orchestrator. Run the PR quality gate for current changes.

# Create the UAT pack for a feature                                 (workflow 06)
Use the Orchestrator. Create the UAT pack for feature <name>.

# Prepare a release for a set of tickets                            (workflow 12, enterprise)
Use the Orchestrator. Prepare release <version> for these tickets.
```

## Install

The minimal "just install the markdown" path works for any tool: copy the portable
`AGENTS.md` (ships in Phase 3) and the `agent-factory/` folder into your repo, then tell the
agent *"start at `agent-factory/roles/orchestrator.md`."* That is the floor — no scripts
required.

For per-tool conveniences (thin sub-agent wrappers, a slash command, entry-file pointers, and
the Claude Code plugin form), grugops ships idempotent, additive, dry-run-capable, reversible
installers under `install/`. **The installers themselves ship in Phase 5** — until then, use
the minimal markdown path above.

The exact install commands and the slash-command shape are tool-specific and move quickly;
they will be documented with the installers in Phase 5. `UNKNOWN - verify` against current
tool docs at install time.
