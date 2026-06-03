---
name: map
description: Map or bootstrap a repo with the grugops factory — greenfield scaffold or brownfield survey, then seed the factory state.
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
Then run the bootstrap workflow — `agent-factory/workflows/00-bootstrap-greenfield.md`
for a new repo, or `agent-factory/workflows/01-bootstrap-brownfield.md` for an existing one.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
