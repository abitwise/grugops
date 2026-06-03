---
phase: 03-roles-agents-md-substrate
plan: 04
subsystem: agent-factory/roles
tags: [roles, markdown, reproduce-from-spec, ROLE-01]
requires:
  - "agent-factory/handoffs/architecture-handoff.md (Phase 2)"
  - "agent-factory/handoffs/implementation-handoff.md (Phase 2)"
  - "agent-factory/handoffs/implementation-ready-packet.md (Phase 2)"
  - "memory-bank/50-decisions/ADR-template.md (Phase 2)"
  - "plans/nfr-catalog.md, plans/board.md, plans/traceability.md (Phase 1)"
provides:
  - "agent-factory/roles/architect-design.md — Architect/Design core role (ROLE-01)"
  - "agent-factory/roles/software-engineer.md — Software Engineer core role (ROLE-01)"
affects:
  - "Phase 4 workflows (sequence these roles' board moves)"
  - "Phase 6 validator (9-section presence)"
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-08 -> D-15): verbatim caveman prompt + terse frozen-path connective tissue"
    - "Universal v2 lines (D-17) rendered identically: config-first Reads, board move, traceability append"
    - "Single-source 12 rules (D-19): one-line pointer to AGENTS.md, no restatement"
key-files:
  created:
    - "agent-factory/roles/architect-design.md"
    - "agent-factory/roles/software-engineer.md"
  modified: []
decisions:
  - "[03-04] architect-design.md emits architecture-handoff.md + ADRs from the frozen ADR-template into memory-bank/50-decisions/ADR-000X-<slug>.md and seeds plans/nfr-catalog.md; owns the In Design exit"
  - "[03-04] software-engineer.md reads implementation-ready-packet first, emits implementation-handoff.md, owns In Development -> In Review; the no-fake-results hard limit (spec L468) is reproduced in CLEAR voice per D-21"
metrics:
  duration: 4m
  completed: 2026-06-03
---

# Phase 3 Plan 04: Architect/Design + Software Engineer Roles Summary

Authored the design+build core role prompts — `architect-design.md` (structure/boundaries, ADRs, NFR catalog seeding) and `software-engineer.md` (one ticket → small diff + tests) — each to the §5 9-section skeleton with the spec's caveman prompt reproduced verbatim and the connective tissue citing only frozen Phase-1/2 on-disk paths. ROLE-01 advanced by 2 of the 11 core roles.

## What Was Built

### Task 1 — `agent-factory/roles/architect-design.md` (commit e545ed5)
- 9-section skeleton; frontmatter `kind: role` + `tier: core`.
- `## Caveman prompt` reproduced verbatim from spec §5.A.7 (L450–453), byte-exact.
- `## Activates when`: "Need structure or tradeoffs".
- `## Output`: `agent-factory/handoffs/architecture-handoff.md`; ADRs authored from `memory-bank/50-decisions/ADR-template.md` into `memory-bank/50-decisions/ADR-000X-<slug>.md`; seeds/updates `plans/nfr-catalog.md`.
- `## Board moves`: owns the `In Design` exit (→ ready for dev).
- Three D-17 universal lines present (config-first read, `plans/board.md` move, `plans/traceability.md` append); one-line 12-rules pointer to `AGENTS.md`.
- Hard limits reflect the prompt: keep design just enough, prefer boring tech, protect future change, no production code, `UNKNOWN - verify` over fabrication.

### Task 2 — `agent-factory/roles/software-engineer.md` (commit 11d9435)
- 9-section skeleton; frontmatter `kind: role` + `tier: core`.
- `## Caveman prompt` reproduced verbatim from spec §5.A.8 (L461–466), byte-exact.
- `## Activates when`: "Need code (one ticket)".
- `## Reads`: config first, then `agent-factory/handoffs/implementation-ready-packet.md` / the ticket (read the handoff first per the prompt).
- `## Output`: `agent-factory/handoffs/implementation-handoff.md`, citing the universal-header `## Scope` / `## Risks` as authoritative (carries the Phase-2 duplicate-header decision).
- `## Board moves`: owns `In Development → In Review`.
- `## Hard limits`: reflect spec L468 — small diff, no big rewrites, no unrequested dependency changes, no architecture change without an ADR, no hidden scope, stop on scope growth. The "never fake a test result" guardrail is written in CLEAR voice (D-21).

## Verification

- Task 1 automated grep: **PASS** (9 headings + `tier: core` + `architecture-handoff.md` + `50-decisions` + `nfr-catalog.md`; drift guard `plans/*-handoff` empty).
- Task 2 automated grep: **PASS** (9 headings + `tier: core` + `implementation-handoff.md` + `In Development`; drift guard empty).
- `check-structure.sh`: both files report `PASS … 9/9 sections`. The drift guard (`no role cites plans/*-handoff`) and single-source 12-rules check pass across all roles. Remaining `FAIL`s in the suite are the expected RED for role files created by later Phase-3 waves (qe-e2e, security-nfr, uat-planner, the 5 enterprise roles) and the not-yet-authored root `AGENTS.md` — the gate goes green as those waves land.

Manual-only checks (caveman prompts byte-exact vs spec L450–453 / L461–466): confirmed against `docs/initial/agent_factory_builder_spec_v2.md`.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes, no architectural decisions, no authentication gates.

## Threat Surface

The plan's `<threat_model>` mitigations were applied as authored:
- **T-03-Tamper (Engineer hard limit):** spec L468 hard limits reproduced (no fake test results, small diff, stop on scope growth) in clear voice (D-21).
- **T-03-Tamper (handoff paths):** both roles cite real `agent-factory/handoffs/<name>.md` paths; the `plans/*-handoff` drift guard is empty in both files.
- **T-03-Info (12-rules single-source):** each role carries only a one-line pointer to `AGENTS.md`; no rule text is restated.

No new security surface beyond the plan's threat model.

## Self-Check: PASSED

- FOUND: agent-factory/roles/architect-design.md
- FOUND: agent-factory/roles/software-engineer.md
- FOUND commit: e545ed5
- FOUND commit: 11d9435
