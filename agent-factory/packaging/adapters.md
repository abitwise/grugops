---
kind: packaging
tier: core
---
# Packaging: per-tool adapters

grug build factory once. grug not build it five times. so the roles, the workflows,
the shared context protocol, the gates — they live once, in `agent-factory/`, and every
host tool points at the same files. the wrapper is thin; the brain is shared.

**All work starts at `agent-factory/roles/orchestrator.md`.** every adapter below is a
pointer at that one entry rule — it never copies the role body, it just tells the host
tool how to reach it.

The single thing that changes from tool to tool is *which entry file the host reads* to reach
the Orchestrator. The dispatch model itself does NOT change: rather than **spawn** sub-agents
(not available across every host CLI; on Claude Code sub-agents can nest to the documented
depth, see below), grugops uses one uniform single-window sequential role-load — the
Orchestrator **loads** each role file into one context in turn. **Only the entry file differs, never the dispatch model and never the content.** Same
roles, same shared context, same gates.

> **Note on this document vs. `agent-factory/README.md`.** The README carries an earlier
> usage overview whose Claude Code row predates the command-form decision (D-29). **This
> file is the current, authoritative dispatch map.** Where they disagree, this file wins.

## The 5-tool dispatch map

Every row is flagged "verify against current tool docs" because host-tool conventions
(plugin/marketplace schema, slash-command namespacing, per-tool entry files) move fast.
The shape below was verified against the live docs at build time; re-confirm before you
ship — never assume a tool fact is permanent.

| Tool | Entry file it reads | Dispatch mode | Adapter | Verify |
| ---- | ------------------- | ------------- | ------- | ------ |
| **Claude Code** | `CLAUDE.md` one-line pointer + portable `AGENTS.md` | Coordinator spawns role agents, in three announced tiers — **Full** (started with `claude --agent grugops-orchestrator`: the coordinator adapter is the main thread and its enumerated `Agent(<allowlist>)` grant is runtime-enforced), **Reduced** (a default session, what the `/grugops` skill entry gets: still parallel to the same cap, grant NOT runtime-enforced), **Degraded** (`Agent` unavailable: the single-window sequential role-load). Nesting defaults to 3 layers, tuned by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; width capped by `queue.wip_limit`, a grugops discipline choice inside the platform's 20-concurrent cap | **Both forms.** Standalone `.claude/skills/grugops*` (dash → `/grugops-plan`) **and** the `.claude-plugin/` plugin colon form (`/grugops:plan`) | verify against current tool docs |
| **Codex CLI** | root `AGENTS.md` (+ global `~/.codex/AGENTS.md`) | Sequential role-load — no spawn; the Orchestrator loads each role file into one context in turn | **None — native.** Codex reads `AGENTS.md` directly | verify against current tool docs |
| **Gemini CLI** | `AGENTS.md` via `.gemini/settings.json` `context.fileName: ["AGENTS.md","GEMINI.md"]` | Sequential role-load — no spawn | **`settings.json` wiring** (`context.fileName` array; cleaner than a `GEMINI.md` pointer, which also works) | verify against current tool docs |
| **OpenCode** | root `AGENTS.md` (+ global `~/.config/opencode/AGENTS.md`) | Sequential role-load — no spawn (or its own native agents) | **None — native.** OpenCode reads `AGENTS.md` directly | verify against current tool docs |
| **GitHub Copilot CLI** | `AGENTS.md` (+ optional `.github/copilot-instructions.md`) | Sequential role-load — no spawn | **Optional pointer.** Ensuring `AGENTS.md` is present is sufficient; the `.github/` pointer is a convenience | verify against current Copilot CLI docs |
| **Pi** | `AGENTS.md` (one context file per directory, `AGENTS.md` before `CLAUDE.md`, read from the working directory and its ancestors) | Sequential role-load — no spawn; Pi ships no sub-agents | **Prompt template.** `.pi/prompts/grugops.md`, a pointer that gives `/grugops`; Pi loads it after project trust, from the directory Pi starts in | verify against current Pi docs |

The four non-spawning CLIs (Codex, Gemini, OpenCode, Copilot) use the single-window sequential
role-load (`_role-switch-protocol.md`): the Orchestrator is a single agent that *loads the
relevant role file into context* at the moment it would otherwise "wake" that role — no
sub-agent spawning, because those hosts cannot spawn. Claude Code adds coordinator spawning: the
`coordinator: true` orchestrator adapter holds the enumerated spawn grant and dispatches role
agents in parallel. Nesting defaults to 3 layers below the main conversation, tuned by
`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` — that default arrived in v2.1.219, and v2.1.217-v2.1.218
defaulted to 1, a known-bad window where nesting is effectively off. Width stays at
`queue.wip_limit`: a grugops discipline choice far inside the platform's 20-concurrent cap (200
per session), never a consequence of the depth cap — depth and width are independent axes. The
sequential role-load is still available as the fallback. What changes from tool to tool is the **entry file** the host reads
to reach `agent-factory/roles/orchestrator.md` (the column above) and — on Claude Code only — the
dispatch mode. **Same roles, same shared context, same gates — the four non-spawning CLIs stay
sequential; only Claude Code adds coordinator spawning.**

### The three entry tiers (Claude Code)

The coordinator announces its tier before it schedules anything, and it picks the tier by sensing
whether the `Agent` tool is available to it — never by reading a host name or a version string.
These are the same three names the coordinator body carries in
`agent-factory/packaging/subagent.frontmatter.md` and the same three `install/README.md` §6
documents, so a user reading the documentation and a user reading the runtime announcement see one
vocabulary, not two.

- **Full** — the session was started with `claude --agent grugops-orchestrator`. The main thread
  takes on the coordinator's system prompt and tool restrictions, roles are scheduled in parallel
  to `queue.wip_limit`, and the enumerated grant **is** runtime-enforced. Claude Code names the
  agent in the session startup header, which is how a user confirms the tier is live. This is the
  **full-capability path**.
- **Reduced** — `Agent` is available but the session is a default main thread, which is what the
  `/grugops` skill entry gets. Scheduling is still parallel, to the same cap; the grant is **not**
  runtime-enforced there, because a default session declares no allowlist. The coordinator says so
  and stays inside the grant by instruction.
- **Degraded** — `Agent` is unavailable: the four non-Claude-Code host CLIs, or a sub-agent already
  at the nesting limit (at the limit the platform withholds `Agent` rather than erroring, so a role
  agent simply does the work itself). The same queue drains at concurrency one through
  `agent-factory/roles/_role-switch-protocol.md`, announced.

**grugops writes no main-thread wiring into a target repository.** The installer lays down no
`.claude/settings.json` `agent` entry, in any form, not even sentinel-wrapped. Such an entry would
make *every* session in that repository run as the grugops coordinator — including a session opened
only to edit a readme — and settings files are user content the installer never overwrites. The flag
is therefore the full-capability path this kit documents. What is deliberately **not** claimed: the
platform documents the enumerated-allowlist rule for the `--agent` flag specifically, so whether the
settings key enforces that same allowlist is `UNKNOWN - verify`. grugops does not write that key, so
nothing here depends on the answer.

Doc links cite `code.claude.com/docs/en/*` (the current host) — for example
`code.claude.com/docs/en/plugins-reference`, `code.claude.com/docs/en/skills`,
`code.claude.com/docs/en/hooks`, `code.claude.com/docs/en/sub-agents`. Always cite the
`code.claude.com` host — the older documentation host now 301-redirects, so do not use it.

## Safety enforcement — where each rule is held

The hard safety rule is plain: **never merge a protected branch, never deploy to
production without named human confirmation.** Where that rule is held differs by tier, and by
tool. There are three tiers:

- **Hard floor — the git host.** Branch protection or rulesets on protected branches, and a
  production deployment environment, each meeting every item of the git-host setup checklist in
  `install/README.md` §5. It is the only tier that sees every
  push and merge, and every deployment that runs through its environments, whatever command
  started it. grugops never configures it. `tools/grugops/host-protection.js` reports read-only on
  the branch items; its production line reads `UNKNOWN - verify` by design (33.1 D-31), so the
  human confirms the production environment's settings on the host.
- **Speed bump — host CLI approval prompts.** They cover the usual command spellings and are
  not a security boundary.
- **Prose — the role and workflow rules.** The Orchestrator and Release Manager stop at a pull
  request, and a named human performs the merge and the production deploy. `checkpoints.open_pr`
  and `checkpoints.test_integrity` are prose only; no mechanism enforces them (33.1 D-26).

Per tool:

| Tool / install form | Hard floor | Speed bump | Prose |
|---|---|---|---|
| Claude Code, standalone install | git host | Claude Code ask rules the installer writes to `permissions.ask` in `.claude/settings.json`, from `checkpoints.protected_branch_merge` and `checkpoints.production_requires_human_confirmation` | role and workflow rules |
| Claude Code, plugin form only | git host | none: a plugin cannot carry permission rules | role and workflow rules |
| Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI | git host | the tool's own approval mode, which you configure; grugops generates no config and documents each mode in `install/README.md` §5 | role and workflow rules |

grugops ships no Bash hook. The Bash command guard earlier releases shipped was retired by
33.1 D-17, because no parser of shell text could be closed; the plugin's one hook is the MCP
admission gate for the shared verified context, which checks a structured tool call. Verify the
permission behaviour against current tool docs (`code.claude.com/docs/en/permissions`).

## What this file is not

This file is a **pointer map**, not a second copy of any role. It never reproduces the
Orchestrator's body or any specialist role text — single-source means the role lives once
in `agent-factory/roles/` and every adapter reaches for it by path. If you ever find a role
*instruction* in here, that is drift; delete it and point at the frozen file instead.
