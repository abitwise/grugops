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
Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`agent-factory/config/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`
(respect every column's WIP limit). Then classify the request, activate each role
through the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`), and
run the matching workflow under `agent-factory/workflows/`.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
