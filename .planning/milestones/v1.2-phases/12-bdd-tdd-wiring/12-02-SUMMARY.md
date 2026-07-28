---
phase: 12-bdd-tdd-wiring
plan: 02
subsystem: testing
tags: [bdd, three-amigos, example-mapping, gherkin, checklist-hub, workflow-07, dial-gated]

# Dependency graph
requires:
  - phase: 11-senior-persona-overhaul
    provides: "definition-of-ready.md single-source hub pattern + the senior-BA INVEST ceremony in workflow 07 that the Three Amigos step rides on top of"
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "the frozen `bdd` config key (off/lean/strict, lean default) + the foundation guards the markdown edits must keep GREEN"
  - phase: 12-bdd-tdd-wiring
    provides: "12-01 — the `## Acceptance scenarios (Given/When/Then)` block in product+QE handoffs that the Example Mapping conversation feeds; the hard no-selectors rule (D-03)"
provides:
  - "agent-factory/checklists/example-mapping.md — single-source Three Amigos / Example Mapping hub (BDD-02)"
  - "the contract-vs-logic seam worked example (D-09) housed in the hub, not a role file (byte-ceiling-safe)"
  - "a dial-gated Three Amigos step folded into 07-backlog-refinement.md that produces scenarios before code (BDD-02/BDD-03)"
affects: [phase-12 (12-03 software-engineer/qe-e2e double-loop lines point back to this seam example), phase-15 (test-integrity gate will mechanically enforce the no-duplication rule this hub lands)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "checklist-hub: a terse single-source ceremony file mirroring definition-of-ready.md, referenced (never restated) by the workflow"
    - "dial-gated pointer step: a single workflow line that reads the bdd dial inline and degrades to lean when absent"

key-files:
  created:
    - agent-factory/checklists/example-mapping.md
  modified:
    - agent-factory/workflows/07-backlog-refinement.md

key-decisions:
  - "[12-02] Example Mapping hub authored mirroring the DoR hub (D-04): frontmatter kind: checklist/tier: lean, terse flat bullets, one fenced worked example — NOT a wall of text"
  - "[12-02] The contract-vs-logic seam worked example (D-09) lives in the hub, never in a role file — the role byte-ceiling (~2-17 B headroom) cannot hold prose"
  - "[12-02] Workflow 07 Three Amigos step inserted as new Step 3 (after INVEST, before sizing per RESEARCH OQ2); steps 3-6 renumbered to 4-7; the Phase-11 senior-BA INVEST step left untouched"
  - "[12-02] Step is a single dial-gated pointer line (bdd off=skip / lean=BA self-runs all three voices / strict=named participants; absent=lean) — the four-card ceremony is NOT restated in the workflow (single-source)"

patterns-established:
  - "checklist-hub: terse single-source ceremony, DoR-shaped, pointed-to by the workflow"
  - "dial-gated pointer step: read the dial inline + name its literal lean default + point to the hub"

requirements-completed: [BDD-02, BDD-03]

# Metrics
duration: 2min
completed: 2026-06-11
---

# Phase 12 Plan 02: Three Amigos / Example Mapping Hub Summary

**A single-source `example-mapping.md` checklist hub (Three Amigos + the contract-vs-logic seam worked example) folded into backlog refinement as a dial-gated step that produces declarative scenarios before code.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-11T09:46:47Z
- **Completed:** 2026-06-11T09:49:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 edited)

## Accomplishments
- Created `agent-factory/checklists/example-mapping.md` — a terse DoR-shaped hub carrying the bdd dial-read, the discovery-first rule (D-06), the three voices (D-05), the four-card structure, a Done-when line, and the stack-neutral contract-vs-logic seam worked example (D-09).
- Folded a single dial-gated Three Amigos step into `07-backlog-refinement.md` (new Step 3) that points to the hub, reads the `bdd` dial inline, and runs discovery before sizing — the Phase-11 senior-BA INVEST step preserved verbatim.
- Added the hub to the workflow's `## Inputs required` list beside the existing `definition-of-ready.md` line, matching that line's style.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the example-mapping.md hub** - `f6dbd60` (feat)
2. **Task 2: Fold the dial-gated Three Amigos step into workflow 07** - `d0f4436` (feat)

**Plan metadata:** see final docs commit (this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified
- `agent-factory/checklists/example-mapping.md` - NEW single-source Three Amigos / Example Mapping hub; carries the dial-read, discovery-first rule, three voices, four cards, Done-when line, and the contract-vs-logic seam worked example (the discount-code example, OUTER acceptance vs INNER unit).
- `agent-factory/workflows/07-backlog-refinement.md` - Added a dial-gated Three Amigos step (Step 3, renumbering 3-6 to 4-7) pointing to the hub; added the hub to `## Inputs required`. INVEST step untouched; ceremony not restated.

## Decisions Made
- The seam worked example is housed in the hub (not workflow 04 — the plan offered either), so the single-source ceremony hub owns both the discovery cards and the layering rule in one place, and the role byte-ceiling stays safe.
- Step ordering: discovery (Example Mapping) sits after the INVEST-shape step and before sizing, per RESEARCH Open Question 2's recommendation — you map examples once a ticket is shaped, but before you can size it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The Task-1 acceptance check `! grep -nE '#[a-zA-Z]|click |navigate to'` reported a match — but the only match is the hub's own no-selectors *rule line*, which names the forbidden tokens (`#id`/`.class`/`click`/`navigate to`) precisely to prohibit them. This mirrors the DoR hub's "never works/looks right" phrasing pattern: stating the prohibition is not a violation of it. The actual example scenarios in the hub (the discount-code Given/When/Then) are fully declarative business language with zero selectors. No change needed; the criterion's intent (declarative scenarios) is met.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BDD-02 + BDD-03 satisfied: the Three Amigos ceremony exists as a single-source hub and is wired into refinement as a dial-gated step that degrades to lean when the `bdd` dial is absent; the seam worked example is in place.
- The contract-vs-logic seam example is now the canonical reference that plan 12-03's `software-engineer.md` / `qe-e2e.md` double-loop hard-limit lines can point to (no need to restate the seam in a byte-constrained role file).
- Mechanical no-duplication / dead-Gherkin enforcement remains the Phase 15 test-integrity gate — this plan landed the followable rule + artifact, as scoped (T-12-02-DG, deferred per threat register).

## Self-Check: PASSED

- FOUND: `agent-factory/checklists/example-mapping.md`
- FOUND: `.planning/phases/12-bdd-tdd-wiring/12-02-SUMMARY.md`
- FOUND commit `f6dbd60` (Task 1)
- FOUND commit `d0f4436` (Task 2)

---
*Phase: 12-bdd-tdd-wiring*
*Completed: 2026-06-11*
