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

<!-- claim: C-28-073 -->
Why `--agent`: the Orchestrator is the main thread, and Claude Code enforces the list of role agents the Orchestrator may spawn. With plain `/grugops` the session is a default one, so that list is held by instruction only. `install/README.md` §6 calls these the Full and Reduced tiers.

<!-- claim: C-28-074 -->
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

The plugin-form equivalents are the same words after the colon — `/grugops:map`, `/grugops:ticket`, `/grugops:release`, and so on. Each one starts at the Orchestrator and ends at a pull request or a human approval; the workflows tell the agent to leave merge and deploy to you.

The page for each command:

- `/grugops`: [grugops](reference/skills/grugops.md), the dispatcher
- `/grugops-map`: [map](reference/skills/map.md)
- `/grugops-plan`: [plan](reference/skills/plan.md)
- `/grugops-ticket`: [ticket](reference/skills/ticket.md)
- `/grugops-gate`: [gate](reference/skills/gate.md)
- `/grugops-uat`: [uat](reference/skills/uat.md)
- `/grugops-release`: [release](reference/skills/release.md)

## Jobs

Each job below gives the request to type, the roles that act, what lands on disk and where you step in. Type the request at your host's entry, as the [start table](#start-a-session) shows; on Codex CLI that is `$grugops <request>`. On Claude Code a job's skill also has its own command, named under the job. The Orchestrator reads the request, picks the workflow and wakes the roles; the requests below are examples, and plain words work too.

### Bootstrap a repository

**Request:** `bootstrap this repo as brownfield and propose safe first tickets` for an existing repository, or `plan this idea as greenfield: <idea>` for a new one. Skill: [map](reference/skills/map.md), `/grugops-map` on Claude Code.

**Who acts:** the [Orchestrator](reference/agents/orchestrator.md) runs [workflow 01](../agent-factory/workflows/01-bootstrap-brownfield.md) for an existing repository: the [Brownfield Mapper](reference/agents/brownfield-mapper.md) maps it, the [AGENTS.md Scribe](reference/agents/agents-md-scribe.md) writes `AGENTS.md`, [Architect/Design](reference/agents/architect-design.md) notes risks and constraints, [Security/NFR](reference/agents/security-nfr.md) runs a high-risk scan, and [BA/PM](reference/agents/ba-pm.md) writes the first tickets. For a new idea it runs [workflow 00](../agent-factory/workflows/00-bootstrap-greenfield.md) with the [Greenfield Mapper](reference/agents/greenfield-mapper.md), the AGENTS.md Scribe, BA/PM, the [System Analyst](reference/agents/system-analyst.md) and Architect/Design.

**What lands on disk:**

- `AGENTS.md` at the repository root, with its command slots at `UNKNOWN - verify` until the real commands are confirmed
- `memory-bank/brownfield-map.md` or `memory-bank/greenfield-plan.md`
- the first tickets in `memory-bank/plans/tickets/`; for a new idea also epics in `memory-bank/plans/epics/`, features in `memory-bank/plans/features/`, ADRs in `memory-bank/50-decisions/` and NFR files in `memory-bank/plans/nfr/`
- the board, `memory-bank/plans/board.md`, seeded with its columns and WIP limits
- the roles' notes in the shared verified context, under `.grugops/context/<task>/notes/`

<!-- claim: C-28-062 -->
**Where you step in:** if the high-risk scan of an existing repository returns `BLOCKED`, the run stops, and no first ticket that builds on that risk is cut until it is resolved, at the default setting of the `proceed_past_blocked_risk` checkpoint. If the idea or the repository is too unclear to map, the run stops and asks you for what is missing.

**Examples:** [Greenfield bootstrap](../examples/01-greenfield-bootstrap.md) and [Brownfield bootstrap](../examples/02-brownfield-bootstrap.md).

### Turn an idea into tickets

**Request:** `turn this idea into epics: <idea>`, then `turn the <name> epic into ready tickets`. Skill: [plan](reference/skills/plan.md), `/grugops-plan` on Claude Code.

**Who acts:** [BA/PM](reference/agents/ba-pm.md) finds the user, the pain and the value, sets the scope and splits the idea into epics ([workflow 02](../agent-factory/workflows/02-idea-to-epics.md)), then splits each epic into tickets, sizes them and sets their priority ([workflow 03](../agent-factory/workflows/03-epic-to-tickets.md)). The [System Analyst](reference/agents/system-analyst.md) clarifies behavior where it is unclear.

**What lands on disk:**

- epics in `memory-bank/plans/epics/`
- tickets in `memory-bank/plans/tickets/`, each with user value, scope, Given/When/Then acceptance criteria, a size from `XS` to `XL` and a priority from `P0` to `P3`
- the epics and tickets on `memory-bank/plans/board.md`, in `Backlog`, or in `Ready` once a ticket meets the Definition of Ready
- notes under `.grugops/context/<task>/notes/` with the product decisions and each ticket's epic, feature and NFR ids

<!-- claim: C-28-063 -->
**Where you step in:** if the idea is too vague to scope, the run stops and asks you for the user, the pain or the value instead of inventing them. A ticket sized `XL` is marked `SPLIT_REQUIRED` and goes back for splitting before development.

**Example:** [Greenfield bootstrap](../examples/01-greenfield-bootstrap.md) cuts the first ticket from an idea.

### Take a ticket to a pull request

**Request:** `implement ticket <id> via ticket-to-pr`. Skill: [ticket](reference/skills/ticket.md), `/grugops-ticket` on Claude Code.

**Who acts:** in [workflow 04](../agent-factory/workflows/04-ticket-to-pr.md) the [Orchestrator](reference/agents/orchestrator.md) checks the ticket against the Definition of Ready, the [Tech Lead](reference/agents/tech-lead.md) scores it and names the engineer level, the [Software Engineer](reference/agents/software-engineer.md) implements it on a branch, test first, [QE/E2E](reference/agents/qe-e2e.md) tries to break it, and [Security/NFR](reference/agents/security-nfr.md) reviews it when the change touches a risk.

**What lands on disk:**

- a branch with the change and its tests, and a pull request
- a `## Tech Lead plan` section in the ticket file
- the ticket's subtask records under `.grugops/queue/`, from pending through claimed to done
- notes under `.grugops/context/<task>/notes/`, and the ticket's trace file under `memory-bank/plans/traceability/`

<!-- claim: C-28-064 -->
**Where you step in:** the workflow tells the agent to open a branch and a pull request and to stop there; you review and merge. If the gate still fails after its self-fix attempts, a named person confirms the Tech Lead's next move before the ticket leaves `Blocked`, at the default setting of the `exhaust_self_fix_budget` checkpoint.

**Example:** [Ticket to PR](../examples/03-ticket-to-pr.md).

### Run the PR gate

**Request:** `run the PR quality gate for current changes`. Skill: [gate](reference/skills/gate.md), `/grugops-gate` on Claude Code.

**Who acts:** in [workflow 05](../agent-factory/workflows/05-pr-quality-gate.md) the [Orchestrator](reference/agents/orchestrator.md) gathers the context and emits the result, [QE/E2E](reference/agents/qe-e2e.md) tries to break the feature, [Security/NFR](reference/agents/security-nfr.md) reviews risk when triggered, and [Architect/Design](reference/agents/architect-design.md) joins only if the change altered structure. The gate runs your repository's own checks, with the commands taken from `AGENTS.md`.

**What lands on disk:**

- the rendered trace files under `memory-bank/plans/traceability/`, committed on the pull request branch
- notes under `.grugops/context/<task>/notes/` with the check results
- one result: `READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX` or `SPLIT_REQUIRED`

A short example, illustrative and not a captured run:

```text
run the PR quality gate for current changes
```

- the trace file for the ticket on the branch is rendered again and committed
- the gate's notes record each check's outcome; a check whose command is unknown is recorded as `UNKNOWN - verify`, not as a pass
- the run ends with `READY_FOR_HUMAN_REVIEW`

<!-- claim: C-28-065 -->
**Where you step in:** the result is a recommendation for a person, not a merge: you review the pull request against `agent-factory/checklists/pr-review-checklist.md` and decide whether to merge it.

### Build a UAT pack

**Request:** `build the UAT pack for feature <name>`. Skill: [uat](reference/skills/uat.md), `/grugops-uat` on Claude Code.

**Who acts:** in [workflow 06](../agent-factory/workflows/06-uat-pack.md) the [UAT Planner](reference/agents/uat-planner.md) assembles the pack, [BA/PM](reference/agents/ba-pm.md) checks it against the original value and scope, and [QE/E2E](reference/agents/qe-e2e.md) checks that the tests back the scenarios.

**What lands on disk:**

- the pack as notes under `.grugops/context/<task>/notes/`: the business scenarios, test data, pass and fail criteria, a signoff checklist naming the person who signs, and known limitations
- each validated scenario as a committed `<ticket-id>.uat.spec.ts`, under the `uat/` subfolder of the repository's end-to-end directory

A short example, illustrative and not a captured run:

```text
build the UAT pack for feature password reset
```

- notes holding the scenarios for a reset request, an expired link and a reused link, with their test data and pass and fail criteria
- the validated scenarios committed as `T-042.uat.spec.ts` under the `uat/` subfolder of the end-to-end directory
- a signoff checklist that names the person who signs

<!-- claim: C-28-066 -->
**Where you step in:** a named person signs off on the scenarios, at the default setting of the `sign_off_acceptance` checkpoint. If the acceptance criteria are missing or unclear, the run stops and sends the ticket back; the workflow tells the agent never to sign off for you.

### Cut a release

**Request:** `prepare release <version> for these tickets`. Skill: [release](reference/skills/release.md), `/grugops-release` on Claude Code.

**Who acts:** in [workflow 12](../agent-factory/workflows/12-release.md) the [Release Manager](reference/agents/release-manager.md) sets the version, compiles the changelog and release notes, confirms the migration, rollback and recovery plans, attaches the NFR, security and compliance evidence, and walks the release-readiness checklist.

**What lands on disk:**

- the release record `memory-bank/plans/releases/REL-xxxx.md`, with the status `READY_TO_RELEASE`, `BLOCKED` or `RELEASED`
- notes under `.grugops/context/<task>/notes/` with the release outcome

<!-- claim: C-28-067 -->
**Where you step in:** a release waits for a named person's approval and a named person's confirmation of the production action, at the default setting of the `production_requires_human_confirmation` checkpoint; the Release Manager prepares the release and does not deploy production. See [the safety guarantees](GUARANTEES.md) for where each control is enforced.

**Example:** [Release run](../examples/05-release-run.md).

### Run a sprint and the daily sweep

**Request:** `refine the backlog and promote ready items`, then `plan sprint <n> toward goal: <goal>`; each day, `run the daily sweep`. These go through the dispatcher, [grugops](reference/skills/grugops.md), `/grugops` on Claude Code.

**Who acts:** in [workflow 07](../agent-factory/workflows/07-backlog-refinement.md) [BA/PM](reference/agents/ba-pm.md) shapes, sizes and prioritizes the top `Backlog` items, with the [System Analyst](reference/agents/system-analyst.md) and [Architect/Design](reference/agents/architect-design.md) when an item is unclear. In [workflow 08](../agent-factory/workflows/08-sprint-planning.md) BA/PM sets the sprint goal and the [Orchestrator](reference/agents/orchestrator.md) commits `Ready` items up to capacity. The [daily sweep](../agent-factory/workflows/09-daily-sweep.md) is the Orchestrator's alone. Workflows [10](../agent-factory/workflows/10-sprint-review.md) and [11](../agent-factory/workflows/11-retro.md) close the sprint with the review and the retro.

**What lands on disk:**

- the sprint file `memory-bank/plans/sprints/SPRINT-xx.md`, with its goal, dates, capacity and committed items
- `memory-bank/plans/board.md` with its columns reconciled to the real ticket status, and `memory-bank/plans/metrics.md`
- one dated entry at the end of `memory-bank/60-progress.md` for each sweep

A short example of the daily sweep, illustrative and not a captured run:

```text
run the daily sweep
```

- the trace files under `memory-bank/plans/traceability/` are rendered again and the state files are checked
- a ticket the context shows has left `In Review` moves to its real column on `memory-bank/plans/board.md`, and `memory-bank/plans/metrics.md` is updated
- `memory-bank/60-progress.md` gains an entry such as `## 2026-11-18 — two in review, one blocked`, and the sweep report lists done, next and blocked

<!-- claim: C-28-068 -->
**Where you step in:** a ticket blocked longer than `blocked_escalation_days` moves to `Blocked` with its blocker named and is raised for a person to clear, and the sweep recommends no new pull into a column whose WIP limit is already breached.

**Example:** [Sprint cycle](../examples/04-sprint-cycle.md) walks one sprint from refinement to retro.

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
