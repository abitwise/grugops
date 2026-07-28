---
phase: 04-workflows-cadence-backpressure
plan: 05
subsystem: workflows
tags: [workflow, scrum, cadence, ceremony, markdown]
requires:
  - "agent-factory/roles/orchestrator.md (routing table + shape analog)"
  - "agent-factory/roles/ba-pm.md, uat-planner.md, qe-e2e.md (agents involved)"
  - "spec §6.2 SPRINT-xx.md format; spec §7.9/§7.11 ceremony spines"
  - "plans/sprints/ (runtime SPRINT-xx.md target); plans/metrics.md (Velocity)"
provides:
  - "agent-factory/workflows/08-sprint-planning.md — scrum sprint-planning ceremony"
  - "agent-factory/workflows/10-sprint-review.md — scrum sprint-review ceremony"
affects:
  - "Wave-2 ceremony set; the scrum half of the dual-cadence requirement (BOARD-03)"
tech-stack:
  added: []
  patterns:
    - "10-section v2 workflow template, headings in spec order (FLOW-05)"
    - "minimal kind: workflow frontmatter (3 fields: kind/order/cadence)"
    - "single config-gated set — cadence declared in body, no filename suffix (D-25)"
    - "frozen-name citation only; connective sections derived terse (D-24)"
key-files:
  created:
    - "agent-factory/workflows/08-sprint-planning.md"
    - "agent-factory/workflows/10-sprint-review.md"
  modified: []
decisions:
  - "08 reproduces the §6.2 SPRINT-xx.md field list verbatim (Goal/Dates/Capacity/Committed/Added mid-sprint/Carried out/Velocity/Burndown/Notes for retro); 10 appends review notes to the same file"
  - "both are ONE config-gated set members — no kanban/scrum filename suffix (D-25)"
  - "cadence=scrum token lives in the When-to-use body (harness V-08/V-10) plus a frontmatter cadence: scrum field"
metrics:
  duration: 3m
  completed: 2026-06-03
---

# Phase 04 Plan 05: Scrum Ceremonies (Sprint Planning & Review) Summary

Authored the Scrum half of the dual-cadence ceremony set: `08-sprint-planning.md` (writes `plans/sprints/SPRINT-xx.md` in the §6.2 format) and `10-sprint-review.md` (appends review notes to the same sprint file), both tagged `cadence=scrum`, single-set, on the 10-section v2 template.

## What Was Built

- **`08-sprint-planning.md`** — `cadence=scrum` ceremony, run at the start of a sprint, selected by the Orchestrator only when `config.cadence=scrum`. Agents: Orchestrator + BA/PM. Steps set a one-sentence sprint goal, pull from `Ready` by priority up to capacity (`sprint_length_days`), confirm each item against `definition-of-ready.md`, and write `plans/sprints/SPRINT-xx.md` reproducing the §6.2 field list verbatim: Goal / Dates / Capacity / Committed / Added mid-sprint / Carried out / Velocity / Burndown / Notes for retro. Stop condition routes a thin `Ready` column to `07-backlog-refinement.md`. Emits the `Velocity` metric. May optionally emit the `sprint-plan.md` one-off packet (§8.5).
- **`10-sprint-review.md`** — `cadence=scrum` ceremony, run at the end of a sprint. Agents: UAT Planner + BA/PM (+ QE/E2E). Steps assemble what reached `Done`, validate against acceptance criteria, draft demo/release notes, list carry-over with reasons, and append the review notes (Velocity / Carried out / Notes for retro) to `plans/sprints/SPRINT-xx.md`. Confirms items in the frozen `Done` column (no new transition). Emits `Velocity`. No new handoff — the sprint file is the artifact.

Both carry minimal `kind: workflow` frontmatter (3 fields: `kind` / `order` / `cadence`), all 10 template headings in spec order, and NO cadence filename suffix (single config-gated set, D-25). The `cadence=scrum` token appears in each `When to use` body (the harness-asserted form) in addition to the `cadence: scrum` frontmatter field.

## Verification

- Per-task automated checks `OK-08` and `OK-10` both passed.
- Structure harness `check-structure.sh`:
  - **V-02** (10 sections in order): PASS for 08 and 10.
  - **V-03** (minimal `kind: workflow` frontmatter, 3 fields): PASS for 08 and 10.
  - **V-08** (scrum cadence + SPRINT format): PASS — both carry `cadence=scrum`; 08 references `plans/sprints/SPRINT-xx.md` and names Goal/Committed/Velocity/Burndown.
  - **V-10** (cadence tagging, no suffix): PASS for the 08/10 scrum portion; no cadence-suffixed filenames.
  - **V-12** (drift guard): PASS — no `plans/*-handoff` cited; all cited `*-handoff` names in the frozen 16-file list.
- Expected partial-PASS: the harness still reports 22 failures, ALL of which are absent Wave-2/Wave-3 workflows not in this plan (07, 09, 11, 12, 13) plus the "found 9 *.md (want 14)" count. This is the documented expected state — those files land in later plans.

## Deviations from Plan

None - plan executed exactly as written. The two files map 1:1 to the spine table and pattern map; every cited name (board columns, `Ready`/`Done`, `definition-of-ready.md`, `plans/sprints/SPRINT-xx.md`, `plans/metrics.md`/`Velocity`, `sprint-plan.md`, `07-backlog-refinement.md`, `11-retro.md`) is a frozen artifact verified on disk.

## Notes

Per the orchestrator instruction, `.planning/config.json` was left untouched (the SDK's known `branching_strategy` duplicate-key strip is for the orchestrator to handle). Working tree carried no incidental config change. Only the two workflow files and the planning artifacts (SUMMARY/STATE/ROADMAP/REQUIREMENTS) were committed.

## Self-Check: PASSED
