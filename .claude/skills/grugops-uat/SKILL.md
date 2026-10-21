---
name: grugops-uat
description: Build a UAT pack with the grugops factory — assemble the acceptance scenarios a human runs before sign-off.
argument-hint: "<request>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE in this repo. If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`.grugops/factory.config.json`, the root `AGENTS.md`, and `memory-bank/plans/board.md`.
Then run the UAT workflow `agent-factory/workflows/06-uat-pack.md` to assemble the
user-acceptance pack for human sign-off.

The shared verified context is the only memory — require typed notes per `agent-factory/workflows/16-context-read-write.md`, and never relay data between agents.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
