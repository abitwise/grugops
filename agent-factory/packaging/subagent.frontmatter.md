---
kind: packaging
tier: core
---
# Template: Claude Code sub-agent wrapper

grug keep wrapper thin. wrapper point at role file, role file do the thinking. one copy,
no drift.

This is the copy-ready template for a standalone Claude Code sub-agent wrapper
(`.claude/agents/<name>.md`). It is **pointer-text only** — it tells the agent to read the
frozen role file and act as that role. It never copies the role body. Fix one role, fix it
in one place.

Spawning is **coordinator-only**. On the four non-spawning host CLIs (Codex, Gemini, OpenCode,
Copilot) grugops uses single-window sequential role-load via
`agent-factory/roles/_role-switch-protocol.md` — one window, drop prior context between roles,
the handoff packet is the only memory. On Claude Code the one designated coordinator (the
orchestrator adapter) may instead spawn role agents. So a plain specialist wrapper's `tools:`
list carries only the file/shell tools that role uses and no spawn tool, while the coordinator
adapter alone carries the marker plus the enumerated spawn grant (see the coordinator example
below). The wrapper sets `model: inherit` so it keeps the user's session model choice.

## Copy-ready template

```markdown
---
name: grugops-orchestrator
description: Single entry point for the grugops software factory. Use for any SDLC delivery request — bootstrap a repo, turn ideas into tickets, implement a ticket, run a quality gate, plan UAT, cut a release. Routes to the specialist factory roles.
tools: Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Read handoff templates from `agent-factory/handoffs/`, write instances to `plans/handoffs/<ID>-<stage>.md`. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

You follow `agent-factory/roles/orchestrator.md` exactly. Read it now, then read
`.grugops/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`
(respect every column's WIP limit). Then act as the Orchestrator: classify the request,
activate each role through the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`)
— one window, drop prior context, the handoff is the only memory — demand a handoff packet from
each, update the board and traceability, and produce the next action.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and
deploy.
```

## Why each field is shaped this way

- **`name`, `description`** — the only required frontmatter. `description` drives
  auto-routing, so write it as a clear "use for / use when" sentence.
- **`tools: Read, Grep, Glob, Bash, Edit, Write`** — for a plain specialist wrapper, file and
  shell tools only, **no spawn tool**. A specialist role never spawns; it does its one job and
  hands off. The spawn grant is reserved for the coordinator adapter alone (below). On the four
  non-spawning host CLIs every role — coordinator included — activates via single-window
  sequential role-load (`agent-factory/roles/_role-switch-protocol.md`: one window, drop prior
  context between roles, the handoff packet is the only memory); on Claude Code the coordinator
  may spawn instead.
- **`model: inherit`** — the documented default; keeps the user's session model rather than
  pinning cost/capability.
- **Body** — repo-relative pointer-text. It cites `agent-factory/roles/orchestrator.md` (the
  frozen role) and the read order, then hands off to that role. It echoes the hard limit in
  clear voice. It contains **no copied role instructions**.

The hard-limit line ("Never merge to a protected branch. Never deploy to prod.") is repeated
in clear professional English, not caveman voice — safety lines are always plain.

> Adapt this template per role (e.g. a `grugops-software-engineer` wrapper points at
> `agent-factory/roles/software-engineer.md`), but keep it pointer-only: read the frozen
> role file, then act as that role. Reference: `code.claude.com/docs/en/sub-agents`.

## The coordinator wrapper (Claude Code only)

Exactly one wrapper — the orchestrator adapter — is the coordinator. On Claude Code it carries
the `coordinator: true` marker plus an enumerated, least-privilege spawn grant listing only the
specialist wrappers it may schedule (never a broad unparenthesized grant). Its frontmatter:

```markdown
---
name: grugops-orchestrator
description: Single entry point for the grugops software factory. Routes to the specialist factory roles.
coordinator: true
tools: Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, …), Read, Grep, Glob, Bash, Edit, Write
model: inherit
---
```

- **`coordinator: true`** — the greppable marker the foundation guard keys on to decide which
  wrapper MUST hold the spawn grant and which MUST NOT. The Claude Code loader ignores unknown
  frontmatter keys, so the marker is inert except as grugops's own signal.
- **The enumerated grant** — lists only the specialist wrappers the coordinator schedules. The
  parenthesized allowlist is honored **only because the orchestrator runs as the main-thread
  agent** (the plugin/`agent` setting). Inside a *spawned* subagent the parenthesized list is
  ignored — a subagent merely gains the ability to spawn nested agents up to the depth cap — so
  do not rely on a nested allowlist to scope a spawned role's further spawns.
- **The other four CLIs** — no host spawn mechanism, so the coordinator there simply runs the
  sequential role-load; the grant is a Claude-Code-only capability.
