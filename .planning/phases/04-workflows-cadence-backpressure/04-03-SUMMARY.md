---
phase: 04-workflows-cadence-backpressure
plan: 03
subsystem: workflows
tags: [workflows, lifecycle, markdown, frozen-names, traceability]
requires:
  - "agent-factory/roles/{ba-pm,system-analyst,uat-planner,qe-e2e,orchestrator}.md (frozen Phase-3 roles composed)"
  - "agent-factory/handoffs/{product,system,uat}-handoff.md (frozen Phase-2 handoffs cited)"
  - "agent-factory/checklists/{definition-of-ready,uat-checklist}.md (frozen Phase-2 gates cited)"
  - "plans/{traceability,metrics,board}.md, plans/{epics,tickets}/ (frozen Phase-1 state plane)"
provides:
  - "agent-factory/workflows/02-idea-to-epics.md — idea -> epics lifecycle workflow"
  - "agent-factory/workflows/03-epic-to-tickets.md — epic -> tickets, DoR-gated, trace-row producing"
  - "agent-factory/workflows/06-uat-pack.md — UAT pack lifecycle workflow"
affects:
  - "Wave-1 lifecycle backbone (02-06) now complete alongside Plan 02's 04/05"
tech-stack:
  added: []
  patterns:
    - "10-section v2 workflow template, headings in spec §7 order (FLOW-05)"
    - "kind: workflow + order + cadence frontmatter (3 fields, D-27)"
    - "clear voice for operational content; light grug wink only in When-to-use opener"
    - "cite frozen names only — no invented handoff/column/metric (D-24)"
key-files:
  created:
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/06-uat-pack.md
  modified: []
decisions:
  - "Metrics emitted cite a real subset of the frozen 9 (Throughput/Lead time/Cycle time) — no invented metric"
  - "02 frontmatter cadence: both; 03 cadence: both; 06 cadence: both — all lifecycle workflows fire regardless of cadence"
metrics:
  duration: 4m
  completed: 2026-06-03
---

# Phase 4 Plan 03: Wave-1 Lifecycle Workflows (02/03/06) Summary

Authored the three remaining Wave-1 lifecycle workflow files — `02-idea-to-epics.md`, `03-epic-to-tickets.md`, `06-uat-pack.md` — each a one-screen file on the 10-section v2 template, reproducing its §7.3/§7.4/§7.7 `Flow:`/`Done when:` spine and deriving the connective sections tersely from frozen Phase-1/2/3 names (D-24).

## What Was Built

- **02-idea-to-epics.md** — composes BA/PM (`Backlog -> Ready`, `product-handoff.md`, epics to `plans/epics/`); reproduces §7.3 Flow `idea -> BA/PM -> product-handoff -> epics` and Done-when (MVP scope clear; epics/non-goals/risks written; epics in `Backlog`). Trace: Epic/Feature rows to `plans/traceability.md`. Metrics: Throughput / Lead time.
- **03-epic-to-tickets.md** — composes BA/PM (sizes XS-XL, prioritizes P0-P3, tickets to `plans/tickets/`) + System Analyst (`In Analysis` exit, `system-handoff.md` when behavior unclear); DoR-gated via `definition-of-ready.md`; `SPLIT_REQUIRED` on XL (no XL into dev). Reproduces §7.4 Done-when including size, priority, and one traceability row per ticket. Metrics: Throughput.
- **06-uat-pack.md** — composes UAT Planner (`Ready for UAT -> In UAT`, owns `In UAT` exit, `uat-handoff.md`, works `uat-checklist.md`) + BA/PM + QE/E2E validation; reproduces §7.7 Done-when (scenarios/test-data/pass-fail/signoff/known-limitations; ticket -> `Ready to Release`, or `Done` in lean). Metrics: Lead time.

Each carries `kind: workflow` + `order` + `cadence: both` frontmatter (3 fields), all 10 template headings in spec order, clear-voice operational content with a single light grug wink in the `When to use` opener (D-27).

## Verification

Ran `sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh` after each file. The harness baseline was 47 FAILs (RED). After authoring it flipped V-01/V-02/V-03 green for 02, 03, and 06 (file present, 10/10 sections in order, frontmatter <=3 fields). The V-12 drift guard reports both sub-checks PASS (no `plans/*-handoff` cited; all cited `*-handoff` names in the frozen 16-file list). No FAIL line references 02/03/06.

Failure count fell 47 -> 44 (02) -> 41 (03) -> 38 (06). The remaining 38 failures are entirely later-wave files (00, 01, 07-13) that are not yet authored — partial PASS is the expected Wave-1 state as documented in the plan note. Full harness green is the Wave-1 gate once those land.

Per-task automated `verify` blocks all returned `OK-02`, `OK-03`, `OK-06`.

## Deviations from Plan

None — plan executed exactly as written. All three files authored on the 10-section template, reproducing their §7.x spines, deriving connective sections from frozen names only. Metrics sections name a real subset of the frozen 9 (the plan explicitly permitted this and forbade inventing a metric).

## Authentication Gates

None.

## Commits

- `fc3d72f` feat(04-03): author 02-idea-to-epics lifecycle workflow
- `c3a2f5d` feat(04-03): author 03-epic-to-tickets lifecycle workflow
- `efdc4e0` feat(04-03): author 06-uat-pack lifecycle workflow

## Self-Check: PASSED

- FOUND: agent-factory/workflows/02-idea-to-epics.md
- FOUND: agent-factory/workflows/03-epic-to-tickets.md
- FOUND: agent-factory/workflows/06-uat-pack.md
- FOUND commit: fc3d72f
- FOUND commit: c3a2f5d
- FOUND commit: efdc4e0
