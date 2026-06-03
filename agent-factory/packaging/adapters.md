---
kind: packaging
tier: core
---
# Packaging: per-tool adapters

grug build factory once. grug not build it five times. so the roles, the workflows,
the handoffs, the gates — they live once, in `agent-factory/`, and every host tool
points at the same files. the wrapper is thin; the brain is shared.

**All work starts at `agent-factory/roles/orchestrator.md`.** every adapter below is a
pointer at that one entry rule — it never copies the role body, it just tells the host
tool how to reach it.

The single thing that changes from tool to tool is *how the Orchestrator reaches its
specialist roles* — whether the host can **spawn** sub-agents or must **load** role files
into one context in sequence. **Only the dispatch differs, never the content.** Same
roles, same handoffs, same gates — only the dispatch differs.

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
| **Claude Code** | `CLAUDE.md` one-line pointer + portable `AGENTS.md` | Native sub-agents — the Orchestrator runs as the **main thread** (plugin `settings.json` `agent:`) and spawns role agents with the `Agent` tool (sub-agents cannot nest, so it must be main-thread) | **Both forms.** Standalone `.claude/skills/grugops*` (dash → `/grugops-plan`) **and** the `.claude-plugin/` plugin colon form (`/grugops:plan`) | verify against current tool docs |
| **Codex CLI** | root `AGENTS.md` (+ global `~/.codex/AGENTS.md`) | Sequential role-load — no spawn; the Orchestrator loads each role file into one context in turn | **None — native.** Codex reads `AGENTS.md` directly | verify against current tool docs |
| **Gemini CLI** | `AGENTS.md` via `.gemini/settings.json` `context.fileName: ["AGENTS.md","GEMINI.md"]` | Sequential role-load — no spawn | **`settings.json` wiring** (`context.fileName` array; cleaner than a `GEMINI.md` pointer, which also works) | verify against current tool docs |
| **OpenCode** | root `AGENTS.md` (+ global `~/.config/opencode/AGENTS.md`) | Sequential role-load — no spawn (or its own native agents) | **None — native.** OpenCode reads `AGENTS.md` directly | verify against current tool docs |
| **GitHub Copilot CLI** | `AGENTS.md` (+ optional `.github/copilot-instructions.md`) | Sequential role-load — no spawn | **Optional pointer.** Ensuring `AGENTS.md` is present is sufficient; the `.github/` pointer is a convenience | verify against current Copilot CLI docs |

Where a tool supports real sub-agents (Claude Code), the Orchestrator spawns a role agent
when it would otherwise "wake" that role. Where it does not, the Orchestrator is a single
agent that *loads the relevant role file into context* at that moment. **Only the dispatch
differs, never the content.**

Doc links cite `code.claude.com/docs/en/*` (the current host) — for example
`code.claude.com/docs/en/plugins-reference`, `code.claude.com/docs/en/skills`,
`code.claude.com/docs/en/hooks`, `code.claude.com/docs/en/sub-agents`. Always cite the
`code.claude.com` host — the older documentation host now 301-redirects, so do not use it.

## Mechanical prod-deploy guard — Claude Code only

The hard safety rule is plain: **never merge a protected branch, never deploy to
production without named human confirmation.** grugops makes that rule *mechanical* where
the host tool allows it.

- **Claude Code (mechanical):** a plugin-level `hooks/hooks.json` `PreToolUse` Bash matcher
  runs a pure-Node guard that **denies** any configured production-deploy command unless a
  human has set the approval session environment variable, and **refuses** any command that
  tries to inline-set that variable (so the agent cannot self-approve). The guard **fails
  closed**. This pairs with config `production_requires_human_confirmation: true`. The guard
  lives **only** in plugin-level `hooks/hooks.json` — plugin sub-agent frontmatter
  `hooks` / `mcpServers` / `permissionMode` are silently ignored, so a guard placed there
  does nothing.
- **The other four tools (procedural fallback):** Codex CLI, Gemini CLI, OpenCode, and
  GitHub Copilot CLI have no equivalent pre-tool hook system, so they rely on the
  **`autonomy=pr`** posture plus `production_requires_human_confirmation: true` — the
  Orchestrator and Release Manager stop at a pull request and require a named human to
  perform the merge and the production deploy. This is the procedural rendering of the same
  rule the Claude Code hook enforces mechanically.

Both facts must stay documented together: the mechanical guard is Claude-Code-only; the
`autonomy=pr` procedural fallback is what protects production on the other four tools.
Verify the hook schema and the per-tool autonomy behavior against current tool docs.

## What this file is not

This file is a **pointer map**, not a second copy of any role. It never reproduces the
Orchestrator's body or any specialist role text — single-source means the role lives once
in `agent-factory/roles/` and every adapter reaches for it by path. If you ever find a role
*instruction* in here, that is drift; delete it and point at the frozen file instead.
