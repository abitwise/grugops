---
phase: 01-substrate-config-state-skeleton
plan: 03
subsystem: state-plane
tags: [board, wip-limits, sizing, priority, blocked-policy, kanban]
requires:
  - "agent-factory/config/factory.config.json#wip_limits (Plan 02)"
  - "agent-factory/config/factory.config.json#blocked_escalation_days, #sizing, #priority_scheme (Plan 02)"
provides:
  - "plans/board.md — the 13-column WIP source of truth"
  - "Board <-> ticket status-line contract (status/column/size/priority/epic/feature)"
  - "Sizing/priority/Blocked conventions shared by both cadences"
affects:
  - "Phase 4 ceremony workflows (refinement, sprint planning, daily sweep) that move tickets across these columns"
  - "Phase 4 scrum cadence (plans/sprints/) which references the shared Conventions block"
  - "Phase 6 validator (board<->ticket status match check)"
tech-stack:
  added: []
  patterns:
    - "Title + `_Updated: <ISO date> by <role>_` line + clear-voice `<!-- FORMAT -->` comment, matching sibling state files (metrics.md, traceability.md)"
    - "Zero live data rows; example shapes live inside comments only (generic ABC- prefix)"
key-files:
  created:
    - "plans/board.md"
  modified: []
decisions:
  - "[01-03] board.md ships Kanban columns only; scrum overlay deferred to plans/sprints/ (Claude's-discretion)"
  - "[01-03] Per-column WIP headings carry live/limit form (e.g. `(WIP 0/3)`); limits sourced verbatim from factory.config.json#wip_limits"
  - "[01-03] Sizing/priority/Blocked defined once in a Conventions block explicitly shared by both cadences (BOARD-04)"
metrics:
  duration: 4m
  completed: 2026-06-02
---

# Phase 1 Plan 03: WIP Board + Sizing/Priority/Blocked Conventions Summary

The 13-column WIP board (`plans/board.md`) reproducing spec §6.1 exactly, with per-column WIP limits sourced from `factory.config.json#wip_limits`, the board↔ticket status-line contract, and the sizing/priority/Blocked conventions defined once for both cadences.

## What Was Built

- **Task 1 — `plans/board.md` (the board):** All 13 §6.1 columns in flow order — Backlog, Ready, In Analysis, In Design, Ready for Dev, In Development, In Review, In Security/NFR, Ready for UAT, In UAT, Ready to Release, Done, Blocked. Each limited column is an H2 heading carrying its live/limit WIP count (e.g. `## In Development (WIP 0/3)`), with the limit taken verbatim from `factory.config.json#wip_limits` (Ready 8, In Analysis 2, In Design 2, Ready for Dev 6, In Development 3, In Review 3, In Security/NFR 2, Ready for UAT 4, In UAT 4, Ready to Release 4). Backlog/Done are `unlimited`; Blocked is `visible, time-tracked`. A reference table lists each column's entry-means + exit-owner. The clear-voice FORMAT comment documents that WIP numbers come from config, shows the ticket front-matter status-line contract (`status`/`column`/`size`/`priority`/`epic`/`feature`) so board and ticket never disagree, and notes Kanban-only / scrum-overlay-in-`plans/sprints/`. ZERO live ticket rows (D-03).
- **Task 2 — Conventions section:** Sizing map `XS=1, S=2, M=3, L=5, XL=8` with the "XL must be split" rule (spec §6.3); priority `P0..P3` with WSJF as the config alternative (spec §6.3); Blocked policy — `blocked-by` reason + date + escalation past `blocked_escalation_days` (default 2) (spec §6.4). The section explicitly states these apply to BOTH cadences (BOARD-04).

## Key Decisions

- Followed sibling state-file style (`metrics.md`, `traceability.md`): `# Title` + `_Updated_` line + a single clear-voice `<!-- FORMAT -->` comment, lowercase `grugops`, example shapes inside comments only, zero live data rows.
- Rendered the WIP heading as `(WIP <live>/<limit>)` per the §6.1 example (`## In Development (WIP 3/3)`), seeded with `0` live count since the board is empty.
- Kept the columns + the shared Conventions block in one file so both cadences cite one source (BOARD-04); the scrum cadence will reference this block rather than redefine it.

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, blocking issues, or architectural changes encountered. Both task verifications passed on first run.

## Threat Model Outcome

The plan's threat register (T-01-09, T-01-10) assigned `mitigate` to board WIP-drift and accidental live ticket rows:
- **T-01-09 (WIP drift):** mitigated — the ten WIP defaults match `factory.config.json#wip_limits` verbatim and the file states the numbers come from config (edit the dial, not the board).
- **T-01-10 (accidental live rows):** mitigated — zero live ticket rows confirmed by `grep -nE "^- \["` returning none; examples live only inside the comment block.
- **T-01-11 (info disclosure):** accepted as LOW — plain markdown, no secrets/code/network.

No new security surface introduced. No threat flags.

## Verification Evidence

- Task 1 automated check: `BOARD_OK` — file exists, all 13 columns present, WIP-number format present, `status:` and `column:` present.
- WIP headings audited against config: all 10 limited columns match exactly; Backlog/Done unlimited; Blocked time-tracked.
- Live ticket rows: `ZERO_LIVE_ROWS` (no `^- [` lines outside the comment).
- Task 2 automated check: `CONVENTIONS_OK` — sizing map, XL-split rule, P0/P3, `blocked-by`, `blocked_escalation_days`, and "both cadence(s)" all present.

## Requirements Satisfied

- **BOARD-01:** `plans/board.md` is the WIP source of truth with the §6.1 columns, per-column WIP sourced from config, and the ticket status↔column contract.
- **BOARD-04:** sizing (XL must split) and priority (P0–P3) shared by both cadences; Blocked policy records `blocked-by` + date and escalates past the config threshold.

## Commits

- `33225ee` feat(01-03): add 13-column WIP board with config-sourced limits
- `887e090` feat(01-03): define sizing, priority, and Blocked conventions for both cadences

## Self-Check: PASSED

- FOUND: plans/board.md
- FOUND: .planning/phases/01-substrate-config-state-skeleton/01-03-SUMMARY.md
- FOUND commit: 33225ee
- FOUND commit: 887e090
