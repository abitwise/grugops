# Using grugops

This page shows how to start grugops on each coding agent the installer can set up, and how to get each job done: what to type, which roles act, what lands on disk and where you step in. Each job links a worked example or shows a short one.

## Start a session

What to type on each coding agent the installer can set up:

| Host | How to start | Talks to the Orchestrator directly? |
|---|---|---|
| **Claude Code** | `claude --agent grugops-orchestrator` from your project, then type the request. In an open session: `/grugops "<request>"`. | Yes with `--agent`: the Orchestrator is the main thread. With `/grugops`, a default session acts as the Orchestrator. |
| **Codex CLI** | Type `$grugops <request>`, or pick `grugops` from `/skills`. | Through the skill, which points the session at the Orchestrator role. Roles load one at a time. |
| **Antigravity CLI** | Pick `grugops-orchestrator` in the `/agents` panel, or type `/grugops <request>` from the repository root. | The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18 on Antigravity CLI 1.4.2). Picked there, it points the session at the Orchestrator role. Otherwise the skill points the session at the Orchestrator role. Roles load one at a time. |
| **OpenCode** | Start OpenCode at the repository root, then pick `grugops-orchestrator` in the `/agents` panel or Tab to it, or type `/grugops <request>`. | The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18 on OpenCode 2.0.26). Picked there, or reached with Tab, it points the session at the Orchestrator role. Otherwise the command points the session at the Orchestrator role. Roles load one at a time. |
| **GitHub Copilot CLI** | `copilot --agent grugops-orchestrator`, or `/agent` in a session. Otherwise ask for the work you want done. | With `--agent` or `/agent`, the launch agent is documented to start the session as the Orchestrator; grugops has made no live run of it (`UNKNOWN - verify`). Otherwise its instructions point the session at the Orchestrator role. Roles load one at a time. |
| **Pi** | From the repository root: `pi --append-system-prompt .pi/grugops-orchestrator.md`, or type `/grugops <request>`. The flag reads the file into Pi's system prompt without Pi's project-trust check, so only use it in a repository you trust. | With the flag, Pi loads the launch file into its system prompt (verified live by a human on 2026-10-18 on Pi 1.1.0), and the file points the session at the Orchestrator role. Otherwise the prompt template points the session at the Orchestrator role. Roles load one at a time. |

The installer writes the entries of the coding agents you choose: one flag per agent (`--claude`, `--codex`, `--antigravity`, `--opencode`, `--copilot`, `--pi`), or, at a terminal with no flag, a checkbox list. Each agent's invocation and its source are in `install/README.md`, in the "Using grugops on" sections. After this scripted install the kit sits in the shared kit root, and the pointers the installer writes and `AGENTS.md` name where it is: the `kitRoot` field of `.grugops/install.json`. Whether a live run on a host CLI other than Claude Code follows that route is `UNKNOWN - verify`, in a default session and in one started with a launch agent; see `install/README.md`, section "How a host finds the kit after a scripted install". A launch form a human ran on the live host is marked verified live in its row of the table above and in its "Using grugops on" section of `install/README.md`, with the date and the host version, or "host version not recorded". A launch form not marked so is `UNKNOWN - verify`. Codex CLI has no launch agent.

On Claude Code, the recommended start makes the Orchestrator the session's main thread. Run it from your project:

```bash
claude --agent grugops-orchestrator
```

Then type your request, for example: bootstrap this repo and propose safe first tickets. Claude Code shows `@grugops-orchestrator` in the session's startup header, which confirms the Orchestrator is the main thread. In a session that is already open, use the command instead: `/grugops "bootstrap this repo and propose safe first tickets"`.

Why `--agent`: the Orchestrator is the main thread, and Claude Code enforces the list of role agents the Orchestrator may spawn. With plain `/grugops` the session is a default one, so that list is held by instruction only. `install/README.md` §6 calls these the Full and Reduced tiers.

`claude --agent grugops-orchestrator` needs an install that chose Claude Code (`--claude`, or Claude Code ticked in the checkbox list), because that install writes `.claude/agents/grugops-orchestrator.md`. The Claude Code plugin form ships no agents, so it gives the commands only. To start every session in a project this way, you can set `"agent": "grugops-orchestrator"` in your own `.claude/settings.json`. The installer never writes that key, and whether it enforces the same list is `UNKNOWN - verify` (`install/README.md` §6).

## Usage across the supported host tools

<!-- claim: C-28-027 -->
grugops works on Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, and Pi. The
single rule to remember: **only the dispatch differs, never the content.** The roles, the
workflows, and the gates are identical everywhere. The only difference is whether the host
tool can *spawn* sub-agents or must *load* role files into context one at a time.

<!-- claim: C-28-028 -->
| Tool                  | Entry file it reads                              | Role dispatch                                            |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Claude Code**       | `CLAUDE.md` (+ portable `AGENTS.md`)             | Coordinator spawns role agents — the `coordinator: true` adapter holds the grant |
| **Codex CLI**         | `AGENTS.md` (+ `.agents/skills/grugops/SKILL.md` skill) | Sequential role-load — no spawn                   |
| **Antigravity CLI**   | `AGENTS.md` (+ the same `.agents/skills/grugops/SKILL.md` skill) | Sequential role-load — no spawn          |
| **OpenCode**          | `AGENTS.md` (+ `.opencode/commands/grugops.md` command) | Sequential role-load (or its own native agents)   |
| **GitHub Copilot CLI**| `AGENTS.md` (+ `.github/copilot-instructions.md`)| Sequential role-load — no spawn                          |
| **Pi**                | `AGENTS.md` (+ `.pi/prompts/grugops.md` template) | Sequential role-load — no spawn                          |

<!-- claim: C-28-029 -->
On Claude Code the coordinator (the `coordinator: true` orchestrator adapter) spawns a role
agent when it would otherwise "wake" that role. On the non-spawning host CLIs the Orchestrator
is a single agent that *loads the relevant role file into context* at that moment. Same roles,
same workflows, same gates, same shared verified context — only the dispatch differs.

<!-- claim: C-28-030 -->
The detailed per-tool **adapters** (thin wrappers, slash commands, entry-file pointers, and
the Claude Code plugin form) ship now — the installer (`node install/install.js`) lays them
down. This table is the usage overview; the adapters are the mechanical conveniences layered
on top.

## Commands

<!-- claim: C-28-061 -->
On Claude Code each grugops skill has its own command. On another host, start grugops from the [start table](#start-a-session) and name the job in your request; the page linked after each command below shows how to start that skill on each host.

Example commands (Claude Code), one per grugops skill:

```text
/grugops "add password reset by email"                      # dispatcher: the Orchestrator routes it
/grugops-map "survey this repo and seed the factory board"  # greenfield scaffold or brownfield survey
/grugops-plan "turn the checkout epic into ready tickets"   # idea to epics, or epic to tickets
/grugops-ticket "T-042"                                     # ready ticket to branch, gate, PR; stops at the PR
/grugops-gate "run the PR gate on the current branch"       # install, lint, typecheck, unit, build, e2e; recommendation only
/grugops-uat "build the UAT pack for the checkout epic"     # acceptance scenarios a human runs
/grugops-release "cut v1.3.0"                               # a named human must approve any production deploy
```

<!-- claim: C-28-007 -->
In the versioned Claude Code plugin form the same operations are namespaced with a colon — `/grugops:<op>` (for example `/grugops:plan`, `/grugops:ticket`, `/grugops:release`). Both forms coexist; only the dispatch differs, never the content.

The plugin-form equivalents are the same words after the colon — `/grugops:map`, `/grugops:ticket`, `/grugops:release`, and so on. Each one starts at the Orchestrator and ends at a pull request or a human approval; merge and deploy stay with you.

The page for each command:

- `/grugops`: [grugops](reference/skills/grugops.md), the dispatcher
- `/grugops-map`: [map](reference/skills/map.md)
- `/grugops-plan`: [plan](reference/skills/plan.md)
- `/grugops-ticket`: [ticket](reference/skills/ticket.md)
- `/grugops-gate`: [gate](reference/skills/gate.md)
- `/grugops-uat`: [uat](reference/skills/uat.md)
- `/grugops-release`: [release](reference/skills/release.md)

## Copy-paste Orchestrator prompts

Paste any of these to your coding agent. Replace the `<...>` placeholders with your own
values. Each one starts the Orchestrator and runs the named workflow.

```text
# Bootstrap an existing repository (brownfield)
Use the Orchestrator. Bootstrap this repo as brownfield. Create AGENTS.md, memory-bank,
  brownfield map, the board, config, and safe first tickets.

# Plan a new idea from scratch (greenfield)
Use the Orchestrator. Plan this idea as greenfield: <idea>. Produce product/system/architecture
  notes in the shared verified context, epics, first tickets, and seed the board.

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
