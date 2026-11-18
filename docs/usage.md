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
