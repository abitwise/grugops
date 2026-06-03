---
phase: 04-workflows-cadence-backpressure
plan: 06
subsystem: workflows
tags: [markdown, ceremony, kanban, scrum, board-reconciliation, backlog-refinement, daily-sweep, retro]

# Dependency graph
requires:
  - phase: 04-01
    provides: check-structure.sh harness encoding V-01..V-13 (the running acceptance gate)
  - phase: 04-02
    provides: Wave-1 lifecycle workflows + the 10-section v2 template precedent (08/10 cadence-tag pattern)
  - phase: 03
    provides: 16 frozen roles, 16 handoffs, 10 checklists, board.md, traceability.md, metrics.md, factory.config.json
provides:
  - "07-backlog-refinement.md — both-cadence Ready-stocking ceremony (Backlog -> Ready after DoR, SPLIT_REQUIRED on XL)"
  - "09-daily-sweep.md — both-cadence board reconciliation engine (BOARD-02): board/metrics/60-progress reconciliation, escalation past blocked_escalation_days, WIP-respecting next-pull"
  - "11-retro.md — both-cadence retro ceremony (factory-coach -> retro-notes.md + factory-tagged improvement tickets; light in lean)"
affects: [04-07-enterprise-workflows, 06-validation-dogfood, phase-6-validator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ceremony workflows expand their §7.x one-liner into all 10 v2 template sections (FLOW-05)"
    - "Both-cadence ceremonies declare 'both' in frontmatter cadence: and explicitly in When to use (D-25)"
    - "Daily-sweep is the single board<->ticket-status reconciliation point keeping the board honest (BOARD-02)"

key-files:
  created:
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/11-retro.md
  modified: []

key-decisions:
  - "All three ceremonies carry cadence: both in frontmatter and declare both-cadence applicability in When to use (D-25); no cadence-suffixed second files"
  - "09-daily-sweep authored as the BOARD-02 reconciliation engine — depth on board<->ticket reconciliation across all 13 frozen columns, WIP throttle, escalation, and Cycle time/WIP/Blocked time metrics"
  - "Every Metrics-emitted section cites only a subset of the frozen 9 metrics; no metric invented (D-24)"

patterns-established:
  - "Ceremony 10-section expansion: one-liner When/Agents/Steps/Output maps to the full template, remaining sections derived tersely from frozen names"
  - "Board-reconciliation pass owns no single transition — it corrects every column and gates pulls against wip_limits"

requirements-completed: [FLOW-03, FLOW-05, BOARD-02]

# Metrics
duration: 6min
completed: 2026-06-03
---

# Phase 4 Plan 06: Both-cadence ceremonies (refinement, daily-sweep, retro) Summary

**Authored the three cadence-agnostic ceremony workflows — 07-backlog-refinement (Ready-stocking), 09-daily-sweep (the BOARD-02 board-reconciliation engine), and 11-retro (factory-coach retro) — each on the 10-section v2 template, all declaring both cadences, flipping the Wave-2 ceremony harness checks green and leaving only Wave-3 (12, 13) RED.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-03
- **Completed:** 2026-06-03
- **Tasks:** 3
- **Files modified:** 3 (all created)

## Accomplishments
- `07-backlog-refinement.md` — both-cadence Ready-stocking ceremony: BA/PM (+ System Analyst, + Architect/Design for spikes) clarify, split XL via `SPLIT_REQUIRED`, size (`XS`–`XL`), prioritize (`P0`–`P3`), mark security/NFR triggers, and promote DoR-met items `Backlog -> Ready`; produces `refinement-notes.md`.
- `09-daily-sweep.md` — the BOARD-02 reconciliation engine: the Orchestrator reads the board + open handoffs, reconciles each ticket's status against its column across all 13 frozen columns, updates `plans/board.md` + `plans/metrics.md` + `memory-bank/60-progress.md`, escalates blockers past `blocked_escalation_days`, recommends the next pull within `wip_limits` (continuous pull, finish before you start), and emits a done/next/blocked sweep report. Emits `Cycle time` / `WIP` / `Blocked time`.
- `11-retro.md` — both-cadence retro (light in lean): the Factory Coach reads `plans/metrics.md` + board history, names the top 1–3 wastes, writes `retro-notes.md` (metrics snapshot / wastes / Keep-Stop-Start), and creates 1–3 improvement tickets tagged `factory` into `plans/tickets/`.
- Harness failures dropped from 22 to 9; every check these three files own (V-02/V-03 sections+order, V-09 daily-sweep references, V-10 both-cadence tags, V-12 drift guard) is green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 07-backlog-refinement.md** - `00aaaa6` (feat)
2. **Task 2: Author 09-daily-sweep.md** - `64942ae` (feat)
3. **Task 3: Author 11-retro.md** - `8edcfb3` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `agent-factory/workflows/07-backlog-refinement.md` - both-cadence backlog refinement ceremony; Backlog -> Ready after definition-of-ready.md; SPLIT_REQUIRED on XL; produces refinement-notes.md
- `agent-factory/workflows/09-daily-sweep.md` - both-cadence board reconciliation engine (BOARD-02); updates board/metrics/60-progress; escalates past blocked_escalation_days; WIP-respecting next-pull; emits Cycle time/WIP/Blocked time
- `agent-factory/workflows/11-retro.md` - both-cadence retro ceremony; factory-coach reads metrics.md, writes retro-notes.md, creates factory-tagged improvement tickets

## Decisions Made
- All three ceremonies carry `cadence: both` in frontmatter and explicitly declare both-cadence applicability in `When to use` (D-25); single config-gated set, no cadence-suffixed duplicates.
- `09-daily-sweep` was given the depth its BOARD-02 role warrants — explicit board↔ticket-status reconciliation step, the full 13-column frozen set named, WIP throttle, escalation, and the three flow metrics — without inventing any name.
- Metrics-emitted sections cite only frozen-9 subsets (07: WIP of Ready; 09: Cycle time/WIP/Blocked time; 11: Throughput/Cycle time/Rework rate) per D-24.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Authentication Gates
None - markdown-authoring plan, no auth/network/runtime surface.

## Known Stubs
None - the three files are complete generic kit templates; the runtime outputs they name (refinement-notes.md, retro-notes.md, populated board/metrics/60-progress) are produced when the workflows RUN (Phase-6 dogfood), never seeded here.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FLOW-03 (ceremonies exist), FLOW-05 (10-section template), and BOARD-02 (Kanban reconciliation engine) satisfied by these three files plus the scrum-only 08/10 from plan 04-05.
- Remaining harness RED is exactly Wave-3: `12-release.md` and `13-incident.md` (plan 04-07). No other check is red.
- threat_model T-04-06-01 (reconciliation/escalation) and T-04-06-02 (cadence mis-tag) both mitigated and verified green by the harness V-09/V-10.

---
*Phase: 04-workflows-cadence-backpressure*
*Completed: 2026-06-03*
