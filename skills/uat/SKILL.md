---
name: uat
description: Build a UAT pack with the grugops factory — assemble the acceptance scenarios a human runs before sign-off.
argument-hint: "<request>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`.grugops/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`.
Then run the UAT workflow `agent-factory/workflows/06-uat-pack.md` to assemble the
user-acceptance pack for human sign-off.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
