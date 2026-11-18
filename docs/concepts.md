# The core concept

grugops is a kit of markdown files that sits on top of the coding-agent CLI you already use. The coding agent does the work; grugops gives it roles, rules, a shared memory, a visible state and gates. Five ideas carry the kit, and this page explains each one. [How grugops works](how-it-works.md) follows one request through them step by step.

## In one paragraph

<!-- claim: C-28-001 -->
grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI, Pi). One Orchestrator decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them. It is lean by default and scales to enterprise governance on a single config flag. Merge and deploy are human decisions. Your git host enforces them through branch protection and required reviewers, which you set up; on Claude Code, grugops's ask rules are a speed bump.

## Specialist roles

<!-- claim: C-28-056 -->
Each role is one markdown file with one job, the files it reads, what it writes, where it moves work on the board, and the hard limits it must not cross. The Orchestrator splits each request into subtasks and draws on the roles the work needs: business analysis and product, system analysis, architecture and design, engineering, QE and end-to-end tests, security, compliance, UAT and release, among others. The [reference](reference/README.md) has a page for every role, with its one job and a link to its role file.

A role is plain text, so you can read the rules an agent was given. See [The Orchestrator splits the request](how-it-works.md#the-orchestrator-splits-the-request) for how work reaches a role.

## The shared verified context

<!-- claim: C-28-057 -->
The shared verified context is the only memory between roles. Roles do not hand data to each other: a role reads the notes for its task before it starts, and publishes typed notes when it is done. Each note is one of six kinds: a `finding`, a `claim`, a `decision`, a `failed-attempt`, an `observation` or an `artifact-ref`. A note enters the context only through the sanctioned writer, and a note written any other way is refused on read. "Verified" means the writer checks each note on the way in: a `finding` without a real stamp from a green gate run or a named person is refused, and a softer result is recorded as a `claim` or an `observation` instead of passing as a finding.

See [Role agents publish notes](how-it-works.md#role-agents-publish-notes) for the commands and the admission rules.

## The board is the state

<!-- claim: C-28-058 -->
The board, `memory-bank/plans/board.md`, is a markdown file in your repository. Each ticket sits in one column, from Ready to Done, and the column is its status. Each column has a work-in-progress limit, set by `wip_limits` in the config, and the Orchestrator's role file tells it never to pull work past one without a written reason.

Because the board is a file, you read it, diff it and review it like any other change. See [How work flows](how-it-works.md#how-work-flows) for the board, the trace and the lifecycle together.

## The gate is the backpressure

<!-- claim: C-28-059 -->
The gate is the PR quality gate. It runs your repository's own checks, install, lint, typecheck, unit tests, build and the end-to-end checks the config turns on, with the commands taken from `AGENTS.md`. If a command is unknown, the gate records `UNKNOWN - verify` rather than faking a pass. A failing check sends the work back: the agent gets a small, fixed number of self-fix attempts, then stops and hands the problem to a person. The gate's result is a recommendation for a person, not a merge.

See [The gate recommends](how-it-works.md#the-gate-recommends) for the order of the checks and the three results.

## Humans decide

<!-- claim: C-28-060 -->
grugops is designed so that people make the merge and release decisions. The role files and workflows tell agents to stop at a pull request and leave the review and the merge to a person. A release waits for a named person's approval and a named person's confirmation of the production action, at the default setting of the `production_requires_human_confirmation` checkpoint. Those are written rules, and they hold only as well as an agent follows them. The hard floor is your git host: branch protection or rulesets on protected branches, and deployment environments with required reviewers for production. grugops never configures your git host; you set those protections yourself. On Claude Code, the standalone installer also writes ask rules, so the CLI asks before the usual merge and deploy commands; they are a speed bump, not a security boundary.

[GUARANTEES.md](GUARANTEES.md) shows which safety claims hold on this repository, joined to the live checkpoint settings. See [A person merges and deploys](how-it-works.md#a-person-merges-and-deploys) for where each control lives.
