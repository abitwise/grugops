---
name: grugops-gate
description: Run the grugops PR quality gate — install, lint, typecheck, unit, build, e2e, bounded self-fix, then report. Recommendation only; never merges.
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
Then run the quality-gate workflow `agent-factory/workflows/05-pr-quality-gate.md` and
report its result. The gate recommends; it never merges.

Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy.

Request: $ARGUMENTS
