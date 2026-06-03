---
phase: 03-roles-agents-md-substrate
plan: 03
subsystem: roles
tags: [roles, ba-pm, system-analyst, role-01, caveman-prompt, handoffs]
requires:
  - "agent-factory/handoffs/product-handoff.md (Phase 2)"
  - "agent-factory/handoffs/system-handoff.md (Phase 2)"
  - "agent-factory/config/factory.config.json (Phase 1)"
  - "plans/board.md, plans/traceability.md (Phase 1)"
  - "agent-factory/roles/orchestrator.md (Wave 1, plan 03-01) — routing contract"
provides:
  - "agent-factory/roles/ba-pm.md — BA/PM role (product clarity → epics/features/tickets), ROLE-01"
  - "agent-factory/roles/system-analyst.md — System Analyst role (flows/actors/states/edge cases), ROLE-01"
affects:
  - "Phase-4 workflows (sequence Backlog→Ready and the In Analysis exit)"
  - "Phase-6 validator (9-section presence + tier counts)"
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-15): verbatim caveman prompt + terse frozen-path connective tissue"
    - "Real on-disk handoff citation (D-15): agent-factory/handoffs/<name>.md, never plans/-prefixed (drift fix)"
    - "D-17 universal v2 lines rendered identically (config-first / plans/board.md / plans/traceability.md)"
    - "D-19 single-source 12 rules — one-line pointer to AGENTS.md, no rule restatement"
key-files:
  created:
    - "agent-factory/roles/ba-pm.md"
    - "agent-factory/roles/system-analyst.md"
  modified: []
decisions:
  - "Both files cite the REAL agent-factory/handoffs/ paths — resolving the HIGH-impact §5 plans/-prefix drift (D-15 / T-03-Tamper mitigation)"
  - "ba-pm.md owns Backlog → Ready and names plans/epics|features|tickets; system-analyst.md owns the In Analysis exit"
metrics:
  duration: "4m"
  completed: "2026-06-03"
  tasks: 2
  files: 2
---

# Phase 3 Plan 03: BA/PM + System Analyst Roles Summary

Authored the two product/analysis front-end core roles — `ba-pm.md` (product clarity → epics/features/tickets + product handoff) and `system-analyst.md` (flows/actors/states/edge cases → system handoff) — each to the §5 nine-section skeleton with a byte-verbatim caveman prompt and terse frozen-path connective tissue. Both emit the REAL on-disk handoff under `agent-factory/handoffs/`, never the spec's `plans/`-prefixed drift.

## What Was Built

### Task 1 — `agent-factory/roles/ba-pm.md` (commit 37713a1)
- `kind: role` + `tier: core` frontmatter; all 9 §5 headings in order.
- `## Caveman prompt` reproduced byte-identical to spec L428–431 (verified via `diff`).
- `## Activates when`: "Need product clarity".
- `## Output (file + format)`: `agent-factory/handoffs/product-handoff.md` (real path) + tickets in `plans/tickets/` with parents in `plans/epics/` / `plans/features/`. Cites the universal-header `## Scope`/`## Risks` as authoritative (Phase-2 duplicate-header decision).
- `## Board moves`: owns the `Backlog → Ready` exit; sizes + prioritizes at refinement.
- Three D-17 universal lines (config-first read, `plans/board.md`, `plans/traceability.md`); one-line `AGENTS.md` 12-rules pointer.
- `## Hard limits`: cut scope / protect MVP / say no to bloat (clear voice).

### Task 2 — `agent-factory/roles/system-analyst.md` (commit d121a40)
- `kind: role` + `tier: core`; all 9 §5 headings in order.
- `## Caveman prompt` byte-identical to spec L439–442 (verified via `diff`).
- `## Activates when`: "Need flows or system rules".
- `## Output (file + format)`: `agent-factory/handoffs/system-handoff.md` (real path).
- `## Board moves`: owns the `In Analysis` exit → design readiness (`In Design`).
- Three D-17 universal lines; one-line `AGENTS.md` 12-rules pointer.
- `## Hard limits`: do not choose framework, do not code (reflects the prompt).

## Verification

- Both plan-supplied per-task verification greps return `PASS` / `TASK2_VERIFY_PASS`.
- `check-structure.sh` per-file checks for these two files: `[a]` 9/9 sections each; `[c]` all three D-17 universal lines present in all roles; `[f]` drift guard PASS (no role cites `plans/*-handoff`).
- Caveman prompts confirmed byte-identical to spec via `diff` (empty diff).
- Rule-restatement guard clean: neither file restates any distinctive 12-rules phrase (D-19).
- The harness overall remains RED (`13 CHECK(S) FAILED`) **by design** — this is Wave 2; the remaining 10 roles + root `AGENTS.md` land in later waves. The RED checks (`[b]` tier counts 6/11, `[d]` orchestrator-only subset, `[e]` AGENTS.md absent) are all out-of-scope for plan 03. My two files raised `tier: core` from 4 → 6, exactly as intended.

## Threat Mitigations Applied

- **T-03-Tamper (handoff path citations):** both files cite the REAL `agent-factory/handoffs/<name>.md` paths; the `[f]` drift guard confirms zero `plans/*-handoff` citations.
- **T-03-Info (12-rules single source):** one-line pointer to `AGENTS.md` only; the `[g]`-equivalent restatement guard confirms no rule text is restated.

## Deviations from Plan

None — plan executed exactly as written. No bugs, no missing critical functionality, no blocking issues, no architectural changes. No authentication gates encountered.

## Known Stubs

None. Both files are complete role prompts citing only frozen, on-disk Phase-1/2 paths. The `memory-bank/` runtime outputs are not relevant here; neither role references an unseeded file. (`agent-factory/handoffs/product-handoff.md` and `system-handoff.md` both exist on disk and were read this session.)

## Self-Check: PASSED

- FOUND: agent-factory/roles/ba-pm.md
- FOUND: agent-factory/roles/system-analyst.md
- FOUND: .planning/phases/03-roles-agents-md-substrate/03-03-SUMMARY.md
- FOUND commit: 37713a1
- FOUND commit: d121a40
