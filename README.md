```text
          ____ ______ __  ______ ____  ____  _____       (
         / __ `/ ___/ / / / __ `/ __ \/ __ \/ ___/      )\
    ____/ /_/ / /  / /_/ / /_/ / /_/ / /_/ (__  )    ( /  )
   /____\__, /_/   \__,_/\__, /\____/ .___/____/      /   (
       /____/           /____/     /_/              (  /\  )
                                                     \/  \/
```

<!-- claim: C-28-069 -->
# grugops — Specialist agents. Shared context. Coordinated work.

<!-- claim: C-28-070 -->
grugops gives the coding agent you already use a team of specialist roles for software delivery. One Orchestrator splits each request into subtasks on a shared queue and claims each one for a role agent, which does one job within hard limits and publishes what it found as notes to a shared verified context. A quality gate checks the work and makes a recommendation, and the workflows stop at a pull request and leave merge and deploy to a person. The roles, workflows, board and trace are plain markdown files you can read and diff.

<!-- claim: C-28-001 -->
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi). One Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.

## Quickstart

<!-- claim: C-28-004 -->
grugops version `2.2.0`.

<!-- claim: C-28-005 -->
1. **Install** — clone grugops once, then run its idempotent, additive, reversible installer (Node 22+) against the project you want it in:

   ```bash
   git clone https://github.com/abitwise/grugops.git ~/grugops
   node ~/grugops/install/install.js --target /path/to/your-project
   ```

   From inside the project you can drop `--target`; the installer then asks you to confirm the current directory. It refuses to install into the grugops checkout itself. The shared kit lands in `~/.grugops` and only per-repo state is written into your project. Every flag, including `--check` and `--update`, is in [`install/README.md`](install/README.md).

<!-- claim: C-28-006 -->
   The installer never overwrites or deletes your content; re-running it is safe, and `node ~/grugops/install/uninstall.js --target /path/to/your-project` removes only what was added. Set `DRY_RUN=1` to preview the changes first.

2. **Drive it** — start a session in your coding agent. The start table for every host is in [`docs/usage.md`](docs/usage.md#start-a-session).

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
