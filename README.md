# grugops

<!-- claim: C-28-001 -->
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi). One Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.

> grug keep it simple.

---

<!-- claim: C-28-002 -->
**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.

<!-- claim: C-28-003 -->
Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.

```bash
# install for Claude Code (Node 22+), from a grugops checkout (Quickstart step 1)
node install/install.js --target /path/to/your-project --claude
# then start Claude Code in that project, with the Orchestrator as the main thread (recommended)
cd /path/to/your-project && claude --agent grugops-orchestrator
# or, in a Claude Code session that is already open
/grugops "bootstrap this repo and propose safe first tickets"
```

On another coding agent, see **Start a session** in Quickstart step 2.

## Quickstart

<!-- claim: C-28-004 -->
grugops version `2.1.0`.

<!-- claim: C-28-005 -->
1. **Install** — clone grugops once, then run its idempotent, additive, reversible installer (Node 22+) against the project you want it in:

   ```bash
   git clone https://github.com/abitwise/grugops.git ~/grugops
   node ~/grugops/install/install.js --target /path/to/your-project
   ```

   From inside the project you can drop `--target`; the installer then asks you to confirm the current directory. It refuses to install into the grugops checkout itself. The shared kit lands in `~/.grugops` and only per-repo state is written into your project. Every flag, including `--check` and `--update`, is in [`install/README.md`](install/README.md).

<!-- claim: C-28-006 -->
   The installer never overwrites or deletes your content; re-running it is safe, and `node ~/grugops/install/uninstall.js --target /path/to/your-project` removes only what was added. Set `DRY_RUN=1` to preview the changes first.

2. **Drive it** — start a session in your coding agent. On Claude Code, the recommended start makes the Orchestrator the session's main thread. Run it from your project:

   ```bash
   claude --agent grugops-orchestrator
   ```

   Then type your request, for example: bootstrap this repo and propose safe first tickets. Claude Code shows `@grugops-orchestrator` in the session's startup header, which confirms the Orchestrator is the main thread. In a session that is already open, use the command instead: `/grugops "bootstrap this repo and propose safe first tickets"`.

   Why `--agent`: the Orchestrator is the main thread, and Claude Code enforces the list of role agents the Orchestrator may spawn. With plain `/grugops` the session is a default one, so that list is held by instruction only. `install/README.md` §6 calls these the Full and Reduced tiers.

   `claude --agent grugops-orchestrator` needs an install that chose Claude Code (`--claude`, or Claude Code ticked in the checkbox list), because that install writes `.claude/agents/grugops-orchestrator.md`. The Claude Code plugin form ships no agents, so it gives the commands only. To start every session in a project this way, you can set `"agent": "grugops-orchestrator"` in your own `.claude/settings.json`. The installer never writes that key, and whether it enforces the same list is `UNKNOWN - verify` (`install/README.md` §6).

   **Start a session** — what to type on each coding agent the installer can set up:

| Host | How to start | Talks to the Orchestrator directly? |
|---|---|---|
| **Claude Code** | `claude --agent grugops-orchestrator` from your project, then type the request. In an open session: `/grugops "<request>"`. | Yes with `--agent`: the Orchestrator is the main thread. With `/grugops`, a default session acts as the Orchestrator. |
| **Codex CLI** | Type `$grugops <request>`, or pick `grugops` from `/skills`. | Through the skill, which points the session at the Orchestrator role. Roles load one at a time. |
| **Antigravity CLI** | Pick `grugops-orchestrator` in the `/agents` panel, or type `/grugops <request>` from the repository root. | The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18 on Antigravity CLI 1.4.2). Picked there, it points the session at the Orchestrator role. Otherwise the skill points the session at the Orchestrator role. Roles load one at a time. |
| **OpenCode** | Start OpenCode at the repository root, then pick `grugops-orchestrator` in the `/agents` panel or Tab to it, or type `/grugops <request>`. | The `/agents` panel lists the launch agent and picking it works (verified live by a human on 2026-10-18 on OpenCode 2.0.26). Picked there, or reached with Tab, it points the session at the Orchestrator role. Otherwise the command points the session at the Orchestrator role. Roles load one at a time. |
| **GitHub Copilot CLI** | `copilot --agent grugops-orchestrator`, or `/agent` in a session. Otherwise ask for the work you want done. | With `--agent` or `/agent`, the launch agent is documented to start the session as the Orchestrator; grugops has made no live run of it (`UNKNOWN - verify`). Otherwise its instructions point the session at the Orchestrator role. Roles load one at a time. |
| **Pi** | From the repository root: `pi --append-system-prompt .pi/grugops-orchestrator.md`, or type `/grugops <request>`. The flag reads the file into Pi's system prompt without Pi's project-trust check, so only use it in a repository you trust. | With the flag, Pi loads the launch file into its system prompt (verified live by a human on 2026-10-18 on Pi 1.1.0), and the file points the session at the Orchestrator role. Otherwise the prompt template points the session at the Orchestrator role. Roles load one at a time. |

   The installer writes the entries of the coding agents you choose: one flag per agent (`--claude`, `--codex`, `--antigravity`, `--opencode`, `--copilot`, `--pi`), or, at a terminal with no flag, a checkbox list. Each agent's invocation and its source are in `install/README.md`, in the "Using grugops on" sections. After this scripted install the kit sits in the shared kit root, and the pointers the installer writes and `AGENTS.md` name where it is: the `kitRoot` field of `.grugops/install.json`. Whether a live run on a host CLI other than Claude Code follows that route is `UNKNOWN - verify`, in a default session and in one started with a launch agent; see `install/README.md`, section "How a host finds the kit after a scripted install". A launch form a human ran on the live host is marked verified live in its row of the table above and in its "Using grugops on" section of `install/README.md`, with the date and the host version, or "host version not recorded". A launch form not marked so is `UNKNOWN - verify`. Codex CLI has no launch agent.

<!-- claim: C-28-007 -->
   In the versioned Claude Code plugin form the same operations are namespaced with a colon — `/grugops:<op>` (for example `/grugops:plan`, `/grugops:ticket`, `/grugops:release`). Both forms coexist; only the dispatch differs, never the content.

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

   The plugin-form equivalents are the same words after the colon — `/grugops:map`, `/grugops:ticket`, `/grugops:release`, and so on. Each one starts at the Orchestrator and ends at a pull request or a human approval; merge and deploy stay with you.

<!-- claim: C-28-008 -->
3. **Go deep** — the internal start-here guide explains how to point any supported host tool at the Orchestrator and walk a ticket from idea to PR. See **[`agent-factory/README.md`](agent-factory/README.md)**.

## Changelog

<!-- claim: C-28-009 -->
The release history lives in [`CHANGELOG.md`](CHANGELOG.md) and follows Keep a Changelog.

## Safety guarantees

<!-- generated: guarantees-pointer -->
Which safety claims still hold on this repository, joined to the live checkpoint matrix: [`docs/GUARANTEES.md`](docs/GUARANTEES.md).

## Acknowledgements

grugops is inspired by **The Grug Brained Developer** (https://grugbrain.dev) by Carson Gross —
the philosophy of fighting complexity with simplicity. grugops is an independent project and is
not affiliated with or endorsed by the author; we simply stand in that lineage. Thank you, grug.

---

_grugops is an independent, open-source developer tool. "grugops" uses "grug" in the
software-culture sense (the grug-brained-developer philosophy). grugops is **not affiliated
with, endorsed by, or connected to** the "Grug" children's book series by Ted Prior or its
publishers. All grugops artwork is original._
