---
name: ticket
description: Drive a ready ticket to a pull request with the grugops factory — implement on a branch, run the gate, stop at the PR.
argument-hint: "<request>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---
Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`agent-factory/config/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`.
Then run the delivery workflow `agent-factory/workflows/04-ticket-to-pr.md` to take a
ready ticket through implementation to a pull request.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
