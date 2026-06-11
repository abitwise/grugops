---
phase: 12-bdd-tdd-wiring
plan: 04
subsystem: testing
tags: [tdd, test-first, red-green, evidence-field, no-fabrication, config-dial, handoff-template]

# Dependency graph
requires:
  - phase: 12-bdd-tdd-wiring
    plan: 01
    provides: "the `## Acceptance scenarios (Given/When/Then)` block in qe-handoff.md (this plan adds the acceptance-side red/green evidence beside `## Result` without touching that block)"
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "the frozen `quality.tdd` config-dial key (off/encouraged/required, encouraged default) + the foundation-guards gate this edit keeps GREEN"
provides:
  - "A tiered, dial-aware `## Test-first evidence` field in implementation-handoff.md (engineer inner-loop red/green) with the clear-voice no-fabrication floor"
  - "A `## Acceptance red/green evidence` field in qe-handoff.md near `## Result` (QE outer-loop) with the same clear-voice no-fabrication floor"
  - "The machine-readable test-first evidence artifact the Phase 15 test-integrity gate will later check"
affects: [15-test-integrity-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tiered test-first evidence field extending an existing handoff evidence section (D-10: extend, don't invent)"
    - "quality.tdd dial-read HTML comment naming the key, its three tiers, and the literal encouraged default (degrade-to-encouraged)"
    - "Clear-voice no-fabrication floor as an HTML comment ending in the literal `UNKNOWN - verify` token — safety line, never caveman (two-voice discipline)"
    - "Inner-loop (engineer) vs outer-loop (QE) evidence split across the two handoffs — D-07 ownership encoded in the field comments"
    - "Empty-but-shaped skeleton (Red / Green / Layer | Scenario / runner) — no fake data"

key-files:
  created: []
  modified:
    - "agent-factory/handoffs/implementation-handoff.md - added the tiered `## Test-first evidence` field extending `## Tests added` / `## Commands run`"
    - "agent-factory/handoffs/qe-handoff.md - added the `## Acceptance red/green evidence` field near `## Result` (12-01 scenarios block untouched)"

key-decisions:
  - "Chose a distinct `## Test-first evidence` heading (acceptable per plan) over inlining into `## Tests added`, keeping it adjacent to the existing evidence pair so it reads as an extension, not a new artifact (D-10)"
  - "Engineer inner-loop evidence (Red/Green/Layer) lives in implementation-handoff; QE outer-loop acceptance evidence (Red/Green/Scenario+runner) lives in qe-handoff — D-07 ownership made explicit in each field's HTML comment"
  - "The no-fabrication floor reuses the kit's established clear-voice line (`a green that was never run is the most expensive lie in the trace`, from software-engineer.md line 46) so the two handoffs share one honesty register"

patterns-established:
  - "Tiered test-first evidence field: off=omit / encouraged=honest tests-written / required=red->green sequence, default encouraged, with the `UNKNOWN - verify` floor"

requirements-completed: [TDD-02]

# Metrics
duration: 5min
completed: 2026-06-11
---

# Phase 12 Plan 04: Tiered Test-First / Red-Green Evidence Fields Summary

**Added the dial-aware test-first / red-green evidence field to both handoffs — the engineer's inner-loop red/green in implementation-handoff and QE's outer-loop acceptance red/green in qe-handoff — each reading `quality.tdd` (off/encouraged/required, default encouraged) and carrying the clear-voice no-fabrication floor that never records a red/green that did not run (`UNKNOWN - verify`).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-11T10:00:00Z
- **Completed:** 2026-06-11T10:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added the `## Test-first evidence` field to `implementation-handoff.md`, placed immediately after the existing `## Commands run` so it extends the `## Tests added` / `## Commands run` evidence pair rather than inventing a new top-level artifact (D-10 "extend, don't invent").
- The implementation field carries the `quality.tdd` dial-read HTML comment (off = omit / encouraged = honest "tests written" / required = record the red->green sequence as run; default encouraged — degrades to encouraged when the key or the whole file is absent) — TDD-02.
- Added the `## Acceptance red/green evidence` field to `qe-handoff.md` near `## Result` — QE owns the outer acceptance loop (D-07), so the acceptance red/green lives here, distinct from the engineer's inner-loop evidence. Each field's HTML comment states which loop it owns so the seam is unambiguous.
- Both fields carry the same clear-voice no-fabrication floor ending in the literal `UNKNOWN - verify` token ("if a step was not run, write `UNKNOWN - verify`; never record a red or a green that did not actually happen"), mirroring the kit's established honesty line. This is the phase's one safety-relevant control (T-12-04-FAB) and the artifact the Phase 15 gate will later check.
- Skeleton lines only (Red / Green / Layer for the inner loop; Red / Green / Scenario+runner for the outer loop) — empty-but-shaped, no fake data, matching the handoff template register.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the tiered test-first / red-green evidence field to implementation-handoff.md** - `a772979` (feat)
2. **Task 2: Add the acceptance-side red/green evidence to qe-handoff.md (QE outer loop)** - `ef2c36b` (feat)

**Plan metadata:** committed separately (docs: complete plan)

## Files Created/Modified
- `agent-factory/handoffs/implementation-handoff.md` - Added the `## Test-first evidence` field (quality.tdd dial-read comment + clear-voice no-fabrication floor comment + Red/Green/Layer skeleton) after `## Commands run`, extending the existing evidence section.
- `agent-factory/handoffs/qe-handoff.md` - Added the `## Acceptance red/green evidence` field (same dial-read + floor + Red/Green/Scenario-and-runner skeleton) after `## Result`; the 12-01 `## Acceptance scenarios` block was left untouched.

## Decisions Made
- Used a distinct `## Test-first evidence` heading rather than appending bullets under `## Tests added` — the plan explicitly allows either, and a named heading reads cleaner as the future Phase-15-checkable artifact while still sitting adjacent to the existing evidence pair (so it remains an extension, not a new artifact).
- The QE field's skeleton third line is `Scenario / runner:` (the observable business behavior + host runner) rather than the engineer's `Layer:` — the outer loop proves a business scenario through a host runner, the inner loop proves a unit behavior, so the two skeletons differ to reinforce the D-09 contract-vs-logic seam.

## Deviations from Plan

None - plan executed exactly as written. Both auto tasks ran clean; no Rule 1-4 deviations.

## Threat Model Discharge
- **T-12-04-FAB (Repudiation/Tampering):** Mitigated — the no-fabrication floor is present in both new fields in clear professional voice; a step not run is marked `UNKNOWN - verify`, and the field never asserts a red/green that did not happen. Mechanical detection of fabricated evidence remains deferred to the Phase 15 test-integrity gate; this plan makes the field honest by construction.
- **T-12-04-VOICE (clarity erosion):** Mitigated — the floor sentence is clear professional voice; `guard_voice` stays GREEN (no caveman markers in either handoff). Verified by `! grep -niE 'grug|smash|shiny|me think'` on both files (CLEAN).

## Issues Encountered
- None. The qe-handoff `UNKNOWN - verify` count is 5 (4 new in this plan's field skeleton/floor + 1 pre-existing in the 12-01 strict-tier scenario comment) — expected; the 12-01 block was intentionally preserved.

## User Setup Required
None - markdown-only kit, no runtime. The host project supplies the actual test runner; the evidence fields are filled in by the engineer/QE roles when they run tests.

## Next Phase Readiness
- TDD-02 is landed: the tiered test-first / red-green evidence field now exists on both the engineer (inner) and QE (outer) sides, reads `quality.tdd`, and degrades to encouraged when absent, each carrying the clear-voice no-fabrication floor.
- The evidence field is the machine-readable artifact the **Phase 15 test-integrity gate** will mechanically check (fabricated-evidence detection is deferred there; this plan lands the honest-by-construction field).
- Foundation guards (`sh scripts/check-foundation-guards.sh`) stay GREEN (exit 0); these handoff edits touch no role file or adapter, and `guard_voice` confirms the clear-voice floor carries no caveman markers.

## Self-Check: PASSED

- FOUND: agent-factory/handoffs/implementation-handoff.md
- FOUND: agent-factory/handoffs/qe-handoff.md
- FOUND: .planning/phases/12-bdd-tdd-wiring/12-04-SUMMARY.md
- FOUND commit: a772979 (Task 1)
- FOUND commit: ef2c36b (Task 2)

---
*Phase: 12-bdd-tdd-wiring*
*Completed: 2026-06-11*
