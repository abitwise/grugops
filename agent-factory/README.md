# grugops — the agent factory

<!-- claim: C-28-021 -->
grugops is a file-based **agent factory** for software delivery. It is a small kit of
markdown — role prompts, workflows, a shared verified context, checklists, a config dial,
a visible Kanban/Sprint board, and a traceability trail — that drops on top of a coding-agent CLI you
<!-- claim: C-28-022 -->
already use. One **Orchestrator** decomposes each request into subtasks and enqueues them on
a shared queue, drawing on whichever specialist roles the work needs (business analysis,
product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT,
release), while a few single-job "grug" agents claim that work and execute within hard
limits. No agent hands data to another — the shared verified context is the only channel.
The intelligence lives in the host coding agent; grugops only supplies
<!-- claim: C-28-023 -->
the role, the guardrail, the memory, the state, the dial, the proof, and the gates. Humans
always hold merge and deploy.

## Start here

<!-- claim: C-28-024 -->
**All work starts at `agent-factory/roles/orchestrator.md`.** Tell your coding agent:

> Read `agent-factory/roles/orchestrator.md`, then `.grugops/factory.config.json`,
> then `plans/board.md`. Act as the Orchestrator.

<!-- claim: C-28-025 -->
The Orchestrator reads the config, classifies your request, respects the board's WIP limits,
activates the right specialist roles, requires each to publish typed notes into the shared
verified context, updates the board and traceability, and produces the next action.

<!-- claim: C-28-026 -->
> **Note:** The portable root `AGENTS.md` substrate — the other entry point most host tools
> read automatically — ships now at the repo root, so most tools can pick up grugops from
> `AGENTS.md` directly; pointing your agent at `agent-factory/roles/orchestrator.md` as shown
> above works everywhere. The role prompts ship under `agent-factory/roles/` and the workflow
> bodies under `agent-factory/workflows/`; this guide documents how to use them and the frozen
> paths they live at.

## Usage across the five tools

<!-- claim: C-28-027 -->
grugops works on Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
workflows, and the gates are identical everywhere. The only difference is whether the host
tool can *spawn* sub-agents or must *load* role files into context one at a time.

<!-- claim: C-28-028 -->
| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`)             | Coordinator spawns role agents — the `coordinator: true` adapter holds the grant |
| **Codex CLI**         | `AGENTS.md` (root + nested, global)              | Sequential role-load — no spawn                          |
| **Gemini CLI**        | `GEMINI.md` (or `AGENTS.md` via `context.fileName`) | Sequential role-load — no spawn                       |
| **OpenCode**          | `AGENTS.md` (+ its agent config)                 | Sequential role-load (or its own native agents)          |
| **GitHub Copilot CLI**| `AGENTS.md` (+ `.github/copilot-instructions.md`)| Sequential role-load — no spawn                          |

<!-- claim: C-28-029 -->
On Claude Code the coordinator (the `coordinator: true` orchestrator adapter) spawns a role
agent when it would otherwise "wake" that role. On the four non-spawning CLIs the Orchestrator
is a single agent that *loads the relevant role file into context* at that moment. Same roles,
same workflows, same gates, same shared verified context — only the dispatch differs.

<!-- claim: C-28-030 -->
The detailed per-tool **adapters** (thin wrappers, slash commands, entry-file pointers, and
the Claude Code plugin form) ship now — the installer (`node install/install.js`) lays them
down. This table is the usage overview; the adapters are the mechanical conveniences layered
on top.

## Configuration

<!-- claim: C-28-031 -->
At runtime the Orchestrator reads the per-repo config dial at `.grugops/factory.config.json`.
The kit ships the lean default as the **seed source** at `agent-factory/seed/.grugops/factory.config.json`
(the installer walks `seed/**` and seeds it into the target's `.grugops/`; D-01/D-02). A
byte-identical copy lives at `agent-factory/config/factory.config.json` as the field-reference
companion to `agent-factory/config/factory.config.md`. The config is visible and editable —
change a value, change the factory's behavior.

<!-- claim: C-28-032 -->
The **zero-config baseline** is `mode=lean`, `cadence=kanban`, `autonomy=pr`. grugops runs
lean with no config at all, because every role falls back to these same documented defaults
when the file is absent. Edit the dial to scale up to enterprise governance (scrum cadence,
compliance regimes, release gates) on a single flag.

## How work flows

<!-- claim: C-28-033 -->
- **The board** — `plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — `plans/traceability.md` is the audit trail: one row per requirement,
  linking requirement → ticket → code → test → UAT → release, so every shipped change is
  accountable end to end.
- **The lifecycle** — the Orchestrator decomposes each request into subtasks and enqueues
  them for whichever stages the work actually needs (analysis, design, engineering, QE,
  security/NFR, UAT, release); each role claims its subtask, pulls the shared verified
  context and publishes typed notes back into it (Workflow 16), so the next role inherits
  exactly what it needs — never a relay from the role before it.

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

<!-- claim: C-28-034 -->
The minimal "just install the markdown" path works for any tool: copy the portable
`AGENTS.md` and the `agent-factory/` folder into your repo, then tell the agent *"start at
`agent-factory/roles/orchestrator.md`."* That is the floor — no scripts required.

<!-- claim: C-28-035 -->
For per-tool conveniences (thin sub-agent wrappers, a slash command, entry-file pointers, and
the Claude Code plugin form), grugops ships a single idempotent, additive, dry-run-capable,
reversible installer. **Node 22+ is a prerequisite** for the scripted path:

```sh
node install/install.js --target /path/to/repo
```

<!-- claim: C-28-036 -->
See **[`install/README.md`](../install/README.md)** for the full flag set (`--target`,
`--yes`, `DRY_RUN`, `--symlink`, `--migrate`, `--update`, `--prune-old-kit`) and the two-root
kit/state layout.

<!-- claim: C-28-037 -->
The Claude Code plugin form (colon-namespaced `/grugops:<op>` commands) installs from the
marketplace; its exact install commands move with the plugin schema, so confirm them against
current tool docs — `UNKNOWN - verify`.

## Writing profile

The kit's prose is written to a controlled-language profile that ships with it at
[`agent-factory/writing-profile.md`](writing-profile.md). It enumerates the rules with stable ids,
marks each one decidable or advisory, derives the project Technical Names set rather than listing
it, and states which surfaces are gated at build time and which carry the profile as instruction.
Read it before rewriting a workflow, a checklist, a seed template or a contract.
