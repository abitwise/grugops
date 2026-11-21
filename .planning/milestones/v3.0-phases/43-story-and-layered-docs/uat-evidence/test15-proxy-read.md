# Test 15 evidence: a model proxy for the fresh reader

This is not a fresh human reader. It is one headless Claude Code run (2.1.325, `claude -p --tools "" --no-session-persistence --system-prompt …`), started from a scratch directory outside this checkout, so no project CLAUDE.md, no tools and no files other than the four pages pasted into the prompt. The model was told to answer only from the pages and to say where they fall short. The model has no memory between sessions, but it may still know grugops from training data, so this run is only a stand-in for a reader who has never seen grugops.

Pages, in order: README.md, docs/concepts.md, docs/how-it-works.md, docs/usage.md (6,002 words), at HEAD c7e0d51b (README.md and docs/ clean in the working tree).

## Executor spot-checks of the proxy's findings

- README Quickstart install command has no host flag (`README.md:26`): confirmed.
- No page among the four names the config file (`factory.config.json`): confirmed, `grep factory.config` finds nothing.
- No page among the four says how to install the Claude Code plugin form: confirmed, no `plugin install` or `marketplace add`.
- `single-job "grug" agents` is not defined further (`docs/concepts.md:8`). The human kept this wording under F-08.

## The proxy's answer, verbatim

**1. What is grugops?**
grugops is a kit of plain markdown files (role prompts, workflows, a board, a shared notes store and a config) plus installers. It adds a team of specialist roles to a coding-agent CLI you already use. An Orchestrator splits each request into subtasks, role agents each do one job and write their results as notes, and a quality gate recommends an outcome. Every workflow stops at a pull request or at a person's approval.

**2. What does it run on, and what do I need already?**
It runs inside one of these coding-agent CLIs: Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI or Pi. You need Node 22 or later and the project you want to use it in. The install command uses `git clone`, so you need git, though no document lists git as a requirement. For the merge and deploy protections to actually hold, you also need a git host where you set up branch protection and required reviewers yourself; the documents never name a specific git host.

**3. How do I install it? (Host: Claude Code)**
1. Run `git clone https://github.com/abitwise/grugops.git ~/grugops`.
2. Run `node ~/grugops/install/install.js --target /path/to/your-project --claude`. You can set `DRY_RUN=1` first to preview the changes, and you can leave out `--target` if you run it from inside the project.
3. If you skip `--claude`, the installer shows a checkbox list at a terminal, where you tick Claude Code.

I had to piece step 2 together. The README's command has no host flag, and `--claude` appears only in usage.md. No document shows `--target` and `--claude` used together.

**4. What do I type to start a job?**
From the project directory, run `claude --agent grugops-orchestrator`, then type the request, for example "bootstrap this repo and propose safe first tickets". The startup header should show `@grugops-orchestrator`. In a session that is already open, type `/grugops "<request>"` instead, or a job-specific command such as `/grugops-ticket "T-042"`.

**5. Who decides on merge and production deploy?**
A person does. Agents are told to stop at a pull request, and a release waits for a named person's approval and a named person's confirmation of the production action. These are only written instructions, though. What actually blocks a merge or deploy is the branch protection and required reviewers you configure on your git host, which grugops never sets up for you. On Claude Code, the ask rules are only a "speed bump".

**6. What confused me or made me re-read**
- **Who claims work.** concepts.md ("In one paragraph") says single-job "grug" agents "claim that work". how-it-works.md ("The queue and claims") says the Orchestrator claims each subtask in the role's name. "Grug agents" is never defined.
- **The install command is split across two documents.** The README Quickstart never mentions host flags, but usage.md says the installer writes entries only for the hosts you choose. usage.md (C-28-030) also writes the command as `node install/install.js`, while the README uses `node ~/grugops/install/install.js`.
- **Two Claude Code forms.** usage.md mentions a "standalone installer" and a "Claude Code plugin form" that "ships no agents". Nothing says how to install the plugin form, or what the plugin form of the plain `/grugops` dispatcher is called.
- **"Only the dispatch differs, never the content"** (usage.md, C-28-027). The same page says plain `/grugops` holds the role list "by instruction only", while `--agent` has Claude Code enforce it (the "Full and Reduced tiers"). That is a difference in enforcement, not just dispatch.
- **OpenCode.** The usage.md table says OpenCode does "Sequential role-load (or its own native agents)". how-it-works.md "Open gaps" says OpenCode has no spawn tool the kit uses.
- **Unexplained terms.** "`coordinator: true` adapter holds the grant", "own-session capture… (GAP-D1)", "sealed note" and "checkpoint" are used without being defined.
- **The config file is never named.** Settings like `wip_limits`, `queue.wip_limit`, `self_fix_attempts` and the checkpoints all live in "the config", but no document gives its path. Neither does the "single config flag" that turns on enterprise mode (concepts.md). There are also two separate WIP limits: one for board columns and one for the queue.
- **Where the tools live.** The README says the shared kit goes in `~/.grugops` and the project gets "only per-repo state". how-it-works.md, however, runs `node tools/grugops/claim.js` as if that folder were in the project.
- **Is release enterprise-only?** The copy-paste prompt labels the release workflow "(workflow 12, enterprise)". The "Cut a release" job never says it needs enterprise mode.
- **Stopping points.** The README says the workflows "stop at a pull request", but the release workflow goes past the PR to production confirmation. usage.md describes it more accurately: each workflow ends "at a pull request or a human approval".

**7. Which questions couldn't I answer from the documents alone?**
None completely; Question 3 was the weakest. Getting the host-specific install step meant combining the README with usage.md and assuming the two flags can be used together. The README also points to `install/README.md` for every flag, and I wasn't given that file. Question 2 is also incomplete: the documents name Node 22+ but never list git, an operating system, or the git host as requirements.
