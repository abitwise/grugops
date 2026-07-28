---
phase: 12-bdd-tdd-wiring
plan: 01
subsystem: testing
tags: [bdd, given-when-then, acceptance-scenarios, handoff-template, config-dial]

# Dependency graph
requires:
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "the frozen `bdd` config-dial key (off/lean/strict, lean default) + the foundation-guards gate this edit must keep GREEN"
  - phase: 11-senior-persona-overhaul
    provides: "the senior-BA / DoR substrate; the preserved `Given/When/Then` criteria line the scenarios block rides alongside (D-09)"
provides:
  - "A tiered, selector-free `## Acceptance scenarios (Given/When/Then)` block in product-handoff.md (beside the preserved criteria bar)"
  - "A byte-identical 1:1 mirror of that block in qe-handoff.md (QE owns the outer acceptance loop)"
  - "The D-14 additive scenario->trace convention note (in-cell, NOT a schema rename)"
affects: [12-02-three-amigos, 12-03-tdd-double-loop, 12-04-tdd-evidence, 15-test-integrity-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Empty-but-shaped handoff block: heading + tiered dial-read HTML comment + declarative G/W/T skeleton, no fake data"
    - "Tier-aware dial-read inline comment naming the `bdd` key, its three tiers, and the literal lean default (degrade-to-lean)"
    - "Hard no-selectors rule carried in the scenario template (declarative business language only; UI detail behind step definitions)"
    - "1:1 mirror across two handoff templates (byte-identical block) so the contract shape is identical role->role"

key-files:
  created: []
  modified:
    - "agent-factory/handoffs/product-handoff.md - added the Acceptance scenarios block + D-14 trace note"
    - "agent-factory/handoffs/qe-handoff.md - mirrored the Acceptance scenarios block"

key-decisions:
  - "Scenario block is the executable contract; the existing `## Acceptance criteria (Given/When/Then)` line stays as the terse DoR-style bar (D-02)"
  - "Block degrades to lean when the `bdd` dial is absent; strict tier references host scenario files + runner as `UNKNOWN - verify` (host-agnostic, no pinned layout/extension)"
  - "D-14 scenario->trace linkage is an additive in-cell comment convention, NOT a column/header rename of the frozen plans/traceability.md schema"
  - "No red/green acceptance-evidence field added to qe-handoff here — that is owned by plan 12-04 (coordinated non-overlap on the shared file)"

patterns-established:
  - "Tiered acceptance-scenarios block: off=omit / lean=inline declarative G/W/T / strict=link selector-free scenario files, default lean"
  - "1:1 block mirror across product + QE handoffs verified by a byte-parity diff"

requirements-completed: [BDD-01]

# Metrics
duration: 4min
completed: 2026-06-11
---

# Phase 12 Plan 01: BDD Acceptance-Contract Handoff Wiring Summary

**Tiered, selector-free `## Acceptance scenarios (Given/When/Then)` block added to the product and QE handoff templates as the executable-or-absent business->engineer contract, with the criteria bar preserved and a D-14 additive scenario->trace convention noted.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-11T09:43:00Z
- **Completed:** 2026-06-11T09:46:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added the tiered, declarative `## Acceptance scenarios (Given/When/Then)` block to `product-handoff.md`, inserted immediately after the preserved `## Acceptance criteria (Given/When/Then)` line — criteria stays the bar, scenarios are the executable contract (D-02).
- The block carries the `bdd` dial-read (off=omit / lean=inline / strict=link selector-free files, default lean — D-01) and the hard no-selectors rule (declarative business language only; UI detail behind step definitions; executable-or-absent — D-03).
- Mirrored the block byte-for-byte into `qe-handoff.md` near `## Unit/integration/E2E coverage` so QE carries the same acceptance contract it owns on the outer loop (D-07) — heading parity and full-block byte-parity verified by diff.
- Added the D-14 additive scenario->trace convention note near `## Trace updates` in product-handoff — a scenario can map 1:1 to a traceability row in-cell, with no schema/column rename of the frozen header.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the tiered Acceptance scenarios block to product-handoff.md (+ D-14 trace note)** - `6220539` (feat)
2. **Task 2: Mirror the Acceptance scenarios block into qe-handoff.md** - `1a3ea03` (feat)

**Plan metadata:** committed separately (docs: complete plan)

## Files Created/Modified
- `agent-factory/handoffs/product-handoff.md` - Added the `## Acceptance scenarios (Given/When/Then)` block (tiered dial-read comment + declarative G/W/T skeleton + strict-tier host-file reference) after the preserved criteria line, plus the D-14 scenario->trace convention comment near `## Trace updates`.
- `agent-factory/handoffs/qe-handoff.md` - Added the byte-identical `## Acceptance scenarios (Given/When/Then)` block near `## Unit/integration/E2E coverage`; no evidence/red-green field (owned by 12-04).

## Decisions Made
- None beyond the plan — followed D-01/D-02/D-03/D-14 as specified. The strict-tier reference deliberately leaves the host scenario-file layout/extension and the runner as `UNKNOWN - verify` (host-agnostic, per D-01 discretion / RESEARCH A1).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The Task 1 declarative-spot-check regex (`#[a-zA-Z]|\.[a-z-]+ |click |navigate to`) flagged two lines, but both were false positives matching filename references inside HTML comments (`traceability.md`, `features/<area>.feature`), not selectors in scenario steps. The example scenario itself is fully declarative (`Given <business precondition>` / `When <business action>` / `Then <observable business outcome>`) with no CSS/HTML/selectors, `click`, or `navigate to`. No change needed.

## User Setup Required
None - no external service configuration required (markdown-only kit, no runtime).

## Next Phase Readiness
- The acceptance-contract artifact (BDD-01) is landed in both product and QE handoffs; plans 12-02 (Three Amigos / example-mapping hub), 12-03 (TDD double-loop in workflow 04 + role hard-limits), and 12-04 (tiered test-first evidence fields) build on this.
- Plan 12-04 also touches `qe-handoff.md` to add the acceptance-side red/green evidence field — this plan deliberately left that out to avoid overlap.
- Mechanical enforcement of executable-or-absent / no-duplication is deferred to the Phase 15 test-integrity gate (this plan lands the rule + artifact only).
- Foundation guards (`sh scripts/check-foundation-guards.sh`) stay GREEN (exit 0); these handoff edits touch no role file or adapter.

## Self-Check: PASSED

- FOUND: agent-factory/handoffs/product-handoff.md
- FOUND: agent-factory/handoffs/qe-handoff.md
- FOUND: .planning/phases/12-bdd-tdd-wiring/12-01-SUMMARY.md
- FOUND commit: 6220539 (Task 1)
- FOUND commit: 1a3ea03 (Task 2)

---
*Phase: 12-bdd-tdd-wiring*
*Completed: 2026-06-11*
