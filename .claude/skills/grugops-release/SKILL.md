---
name: grugops-release
description: Cut a release with the grugops Release Manager. Human-confirmed deploy only — a named human must approve the production deploy.
argument-hint: "<request>"
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `memory-bank/` (planning state in `memory-bank/plans/`) and `.grugops/` = STATE in this repo. If `memory-bank/plans/board.md` is absent and `plans/board.md` exists, use `plans/` and say once: run `install --migrate`. If both exist, use `memory-bank/plans/` and say once that `plans/` is stale. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Act as the grugops Orchestrator and hand off to the Release Manager: read
`agent-factory/roles/orchestrator.md`, then `agent-factory/roles/release-manager.md`,
then run the release workflow `agent-factory/workflows/12-release.md`.

The shared verified context is the only memory — require typed notes per `agent-factory/workflows/16-context-read-write.md`, and never relay data between agents.

A named human must approve the production deploy. Never merge to a protected branch.
Never deploy to prod without that named human confirmation. Humans always hold merge
and deploy.

Request: $ARGUMENTS
