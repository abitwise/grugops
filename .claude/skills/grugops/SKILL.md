---
name: grugops
description: The grugops factory dispatcher — route any software-delivery request through the Orchestrator (bootstrap, plan, implement, gate, UAT, release).
argument-hint: "<request>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`.grugops/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`
(respect every column's WIP limit). Then classify the request, activate each role
through the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`), and
run the matching workflow under `agent-factory/workflows/`.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
