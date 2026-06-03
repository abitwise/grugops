# AGENTS.md

## Mission

This repo runs a file-based agent factory for software delivery. One Orchestrator (the head grug) routes work through the full lifecycle; a few single-job grug agents execute within hard limits. The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.

## How to work here

All work starts with the Orchestrator: `agent-factory/roles/orchestrator.md`.

Read in this order:

1. `agent-factory/config/factory.config.json` — the dial (mode, cadence, autonomy, WIP limits). Runs lean with documented defaults when absent.
2. `agent-factory/roles/orchestrator.md` — the routing contract; act as the Orchestrator.
3. `plans/board.md` — the visible state; respect every column's WIP limit before pulling new work.

The Orchestrator classifies the request, activates the right specialist role(s), demands a handoff packet from each, updates the board and traceability, and produces the next action.

## Role / workflow / handoff files

- Roles:      `agent-factory/roles/`
- Workflows:  `agent-factory/workflows/`
- Handoffs:   `agent-factory/handoffs/`
- Checklists: `agent-factory/checklists/`

## Commands

Real commands only, with flags, preferring fast single-file variants. If a command is unknown, ship `UNKNOWN - verify` — never fabricate. Do not enforce here what a linter or CI already enforces.

### Install

- Install / bootstrap: `UNKNOWN - verify`

### Development

- Dev / run: `UNKNOWN - verify`

### Test

- Test (all): `UNKNOWN - verify`
- Test (single file): `UNKNOWN - verify`

### Lint

- Lint (all): `UNKNOWN - verify`
- Lint (single file, autofix): `UNKNOWN - verify`
- Format (single file): `UNKNOWN - verify`

### Typecheck

- Typecheck (single file): `UNKNOWN - verify`

### Build

- Build (use sparingly): `UNKNOWN - verify`
- Docs build / link-check: `UNKNOWN - verify`
- Clean / reset: `UNKNOWN - verify`

### E2E

- E2E: `UNKNOWN - verify`

## Delivery

- Board: `plans/board.md`
- Cadence + WIP: `agent-factory/config/factory.config.json`
- Traceability: `plans/traceability.md`

## Safety rules

- Do not read or expose secrets.
- Do not run destructive commands.
- Never merge a protected branch. Never deploy prod without human confirmation.
- Do not change dependencies without reason. No unrelated refactors. No fake results.

## Coding rules (the 12)

<!-- Filled in Task 2: Karpathy's 4 principles / 12 rules, verbatim, clear voice. -->

## Definition of ready / done

- Definition of Ready: `agent-factory/checklists/definition-of-ready.md`
- Definition of Done: `agent-factory/checklists/definition-of-done.md`
- Enterprise Definition of Done (applies when `mode=enterprise`): `agent-factory/checklists/definition-of-done-enterprise.md`

## Memory bank & plans

- `memory-bank/*` — the agent-maintained working memory: read on start; `60-progress.md` is the running plan-of-record, `50-decisions/` holds ADRs, plus project brief, product, architecture, contributing, runbook, glossary.
- `plans/*` — the delivery state: `board.md` (status), `traceability.md` (requirement→ticket→code→test→UAT→release), `nfr-catalog.md`, plus `sprints/`, `releases/`, `epics/`, `features/`, `tickets/`.

## When uncertain

Stop. Write the open question or the assumption. Do not guess silently.
