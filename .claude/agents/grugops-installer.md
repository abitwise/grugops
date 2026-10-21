---
name: grugops-installer
description: "Make this factory usable in the current tool. Use when: `mode=enterprise`, or an install or adapter request."
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---
<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-role-adapters.js -->

> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE in this repo. If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Resolve the kit root (this adapter is the sole resolver):

```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run node install/install.js (or node install/install.js --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```

Read `agent-factory/roles/installer.md` now and act as that role. The role file does the
thinking; this adapter only points at it.

Publish your typed notes per `agent-factory/workflows/16-context-read-write.md`. The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and
deploy.
