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
the role, the guardrail, the memory, the state, the dial, the proof, and the gates. Merge and
deploy are human decisions. Your git host enforces them through branch protection and required
reviewers, which you set up. A required reviewer gates a deploy only when the
deploy credentials live solely in the production environment:
a stored deploy secret lives only in its secrets, and an OIDC trust policy
accepts only tokens whose subject names it. On Claude Code,
grugops's ask rules are a speed bump. [`docs/GUARANTEES.md`](../docs/GUARANTEES.md) shows which
safety claims hold in the grugops source checkout at its default settings. Your own floors are
set in `.grugops/factory.config.json`.

## Start here

<!-- claim: C-28-024 -->
**All work starts at `agent-factory/roles/orchestrator.md`.** Tell your coding agent:

> Read `agent-factory/roles/orchestrator.md`, then `.grugops/factory.config.json`,
> then `memory-bank/plans/board.md`. Act as the Orchestrator.

<!-- claim: C-28-025 -->
The Orchestrator reads the config, classifies your request, respects the board's WIP limits,
activates the right specialist roles, requires each to publish typed notes into the shared
verified context, updates the board, and produces the next action. The trace is rendered
from those notes.

<!-- claim: C-28-026 -->
> **Note:** The portable root `AGENTS.md` substrate — the other entry point most host tools
> read automatically — ships now at the repo root, so most tools can pick up grugops from
> `AGENTS.md` directly; pointing your agent at `agent-factory/roles/orchestrator.md` as shown
> above works everywhere. The role prompts ship under `agent-factory/roles/` and the workflow
> bodies under `agent-factory/workflows/`; this guide documents how to use them and the frozen
> paths they live at.

After a scripted install the kit sits in the shared kit root, not in the repository. The pointers the
installer writes and `AGENTS.md` name where it is: the `kitRoot` field of `.grugops/install.json`.
Whether a live run on a host other than Claude Code follows that route is `UNKNOWN - verify`; see
`install/README.md`, section "How a host finds the kit after a scripted install".

## Usage across the supported host tools

See [Usage across the supported host tools](../docs/usage.md#usage-across-the-supported-host-tools) in Using grugops.

## Configuration

<!-- claim: C-28-031 -->
At runtime the Orchestrator reads the per-repo config dial at `.grugops/factory.config.json`.
The kit ships the lean default as the **seed source** at `agent-factory/seed/.grugops/factory.config.json`
(the installer walks `seed/**` and seeds it into the target's `.grugops/`; D-01/D-02). A
byte-identical copy lives at `agent-factory/config/factory.config.json` as the field-reference
companion to `agent-factory/config/factory.config.md`. The config is visible and editable —
change a value, change the factory's behavior.

<!-- claim: C-28-032 -->
The **zero-config baseline** is `mode=lean`, `cadence=kanban`, and every `checkpoints`
cell at its documented default. grugops runs lean with no config at all, because every role
falls back to these same documented defaults when the file is absent. Edit the dial to scale
up to enterprise governance (scrum cadence, compliance regimes, release gates) on a single flag.

<!-- generated: guarantees-pointer -->
Which safety claims hold in the grugops source checkout at its default settings: [`docs/GUARANTEES.md`](../docs/GUARANTEES.md). Your own floors are set in `.grugops/factory.config.json`.

## How work flows

See [How work flows](../docs/how-it-works.md#how-work-flows) in How grugops works.

## Copy-paste Orchestrator prompts

See [Copy-paste Orchestrator prompts](../docs/usage.md#copy-paste-orchestrator-prompts) in Using grugops.

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
See **[`install/README.md`](https://github.com/abitwise/grugops/blob/main/install/README.md)** for the full flag set (`--target`,
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
