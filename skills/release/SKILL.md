---
name: release
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
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Read handoff templates from `agent-factory/handoffs/`, write instances to `plans/handoffs/<ID>-<stage>.md`. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Act as the grugops Orchestrator and hand off to the Release Manager: read
`agent-factory/roles/orchestrator.md`, then `agent-factory/roles/release-manager.md`,
then run the release workflow `agent-factory/workflows/12-release.md`.

A named human must approve the production deploy. Never merge to a protected branch.
Never deploy to prod without that named human confirmation. Humans always hold merge
and deploy.

Request: $ARGUMENTS
