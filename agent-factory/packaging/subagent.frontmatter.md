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

The wrapper grants **no spawn tool**. grugops uses single-window sequential role-load via
`agent-factory/roles/_role-switch-protocol.md` — one window, drop prior context between
roles, the handoff packet is the only memory — NOT sub-agent spawning. So the `tools:` list
carries only the file/shell tools the Orchestrator actually uses, never a spawn tool. The
wrapper sets `model: inherit` so it keeps the user's session model choice.

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
#    "grugops kit not found at $KIT. Run install.sh (or install.sh --check) to install the kit."
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
- **`tools: Read, Grep, Glob, Bash, Edit, Write`** — file and shell tools only, **no spawn
  tool**. grugops activates each role via single-window sequential role-load
  (`agent-factory/roles/_role-switch-protocol.md`: one window, drop prior context between
  roles, the handoff packet is the only memory), NOT sub-agent spawning — so no spawn tool is
  granted. This keeps the same role-activation behavior portable across all five host CLIs,
  whether or not the host can spawn sub-agents.
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
