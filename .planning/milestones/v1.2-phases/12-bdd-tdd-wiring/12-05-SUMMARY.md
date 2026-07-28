---
phase: 12-bdd-tdd-wiring
plan: 05
subsystem: testing
tags: [bdd, tdd, role-prompt, agents-md, double-loop, contract-vs-logic-seam, byte-ceiling]

# Dependency graph
requires:
  - phase: 12-bdd-tdd-wiring (plan 12-03)
    provides: "workflow 04 inner-loop + double-loop + seam sequence, which the new role lines POINT to"
  - phase: 12-bdd-tdd-wiring (plan 12-02)
    provides: "agent-factory/checklists/example-mapping.md hub carrying the worked contract-vs-logic seam example"
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "guard_role_size / guard_voice / guard_caveman_preserved / guard_agents_bytes / guard_adapter_size foundation guards + byte ceilings"
  - phase: 11-senior-persona-overhaul
    provides: "the senior software-engineer + QE personas the double-loop discipline rides on; the locked per-file role-size ceilings"
provides:
  - "software-engineer.md: a single terse inner-loop + contract-vs-logic-seam hard-limit line pointing to example-mapping.md"
  - "qe-e2e.md: a single terse outer-loop / acceptance-contract hard-limit line pointing to the QE handoff scenarios block + workflow 04"
  - "AGENTS.md: a minimal `### Acceptance` command slot valued `UNKNOWN - verify` (host runner names in a comment only)"
affects: [phase-15-test-integrity-gate, phase-13-frontend-ui, phase-14-security-asvs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reference-not-embed role guardrail: the role carries the one-line owner + rule; the worked example + loop sequence live in the workflow/hub"
    - "AGENTS.md acceptance slot: value is UNKNOWN - verify; host runner names are non-binding examples in a trailing HTML comment only (D-12)"

key-files:
  created: []
  modified:
    - "agent-factory/roles/software-engineer.md"
    - "agent-factory/roles/qe-e2e.md"
    - "AGENTS.md"

key-decisions:
  - "Under the ~2B headroom, software-engineer.md carries the seam guardrail (D-09) as the one line + a pointer; workflow 04 (plan 12-03) carries the inner-loop sequence — exactly the plan's stated FAIL-ceiling fallback"
  - "qe-e2e.md names the handoff `## Acceptance scenarios` block as the contract and points to workflow 04 for the double-loop rather than restating it"
  - "AGENTS.md gets a new `### Acceptance` micro-slot (D-12 Open Question 1) rather than an extra `### Test` bullet — reads cleaner; value `UNKNOWN - verify`, runner names in a comment"

patterns-established:
  - "Pattern 1: A byte-ceilinged role line POINTS to the hub/workflow; it never restates the loop or pastes the worked example (paid for in single sharp sentences)"
  - "Pattern 2: The AGENTS.md acceptance command is single-source and host-agnostic — `UNKNOWN - verify` + example runner names in a comment, never a hard fabricated command"

requirements-completed: [TDD-01, BDD-01]

# Metrics
duration: 6min
completed: 2026-06-11
---

# Phase 12 Plan 05: Role-Enforced Double-Loop Guardrails + AGENTS.md Acceptance Slot Summary

**The "role enforces" half of D-08/D-09 + the runnable acceptance command slot of D-12: single terse pointer lines in software-engineer.md (inner-loop + contract-vs-logic seam) and qe-e2e.md (outer acceptance loop), plus a minimal `### Acceptance` slot in AGENTS.md valued `UNKNOWN - verify` — all foundation guards GREEN under the role byte ceilings.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-11T09:51Z
- **Completed:** 2026-06-11T09:57Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `software-engineer.md` now carries one sharp `## Hard limits` line: the engineer owns the inner red-green loop; the unit layer proves the logic beneath the acceptance scenario, never its observable outcome (the contract-vs-logic seam, D-09) — pointing to `example-mapping.md` for the worked seam. 3295B, under the 3307B FAIL ceiling.
- `qe-e2e.md` now carries one sharp `## Hard limits` line: QE owns the outer acceptance loop; the handoff's `## Acceptance scenarios` block is the contract, red until the engineer's inner loop closes it (D-07/D-08) — pointing to workflow 04 for the double-loop. 3220B, under the 3224B FAIL ceiling.
- `AGENTS.md` now carries a new `### Acceptance` command slot (D-12): `Acceptance / BDD scenarios: UNKNOWN - verify`, with host runner names (cucumber-js / behave / `bddgen && playwright test`) confined to a trailing HTML comment as examples — never a hard command. 6257B, well under budget; no per-tool adapter touched.

## Task Commits

Each task was committed atomically:

1. **Task 1: inner-loop + seam pointer to software-engineer.md** - `567dc20` (feat)
2. **Task 2: outer-loop / acceptance-contract pointer to qe-e2e.md** - `c8d7a8f` (feat)
3. **Task 3: minimal acceptance/BDD command slot in AGENTS.md** - `74c2938` (feat)

**Plan metadata:** committed separately (docs: complete plan).

## Files Created/Modified
- `agent-factory/roles/software-engineer.md` - added one inner-loop + contract-vs-logic-seam hard-limit line pointing to `example-mapping.md`
- `agent-factory/roles/qe-e2e.md` - added one outer-loop / acceptance-contract hard-limit line pointing to the QE handoff scenarios block + workflow 04
- `AGENTS.md` - added a `### Acceptance` micro-slot under `## Commands` (`UNKNOWN - verify`); runner names in a comment only

## Decisions Made
- **Seam-first under the byte ceiling (software-engineer.md).** The plan flagged ~2B headroom and was explicit: if a single line covering both inner-loop + seam trips the FAIL ceiling, prefer the seam guardrail (D-09) and let workflow 04 carry the sequence. The first draft (a full inner-loop restatement) tripped FAIL at 3452B; the line was iteratively tightened to a single seam-owning sentence at 3295B (advisory WARN, build GREEN). Inner-loop ownership is named in one clause; the loop sequence stays in workflow 04, the worked example in `example-mapping.md`.
- **`### Acceptance` micro-slot over an extra `### Test` bullet (AGENTS.md).** D-12 / RESEARCH Open Question 1 left this to planner/executor discretion. A dedicated `### Acceptance` heading reads cleaner alongside `### Test` / `### E2E` and makes the BDD command slot discoverable. Runner names live in a trailing comment per D-12 to avoid per-stack bloat and keep single-source.

## Deviations from Plan

None - plan executed exactly as written. (The byte-ceiling tightening on Task 1 was the plan's own stated FAIL-ceiling fallback path, not an unplanned deviation: "prefer the seam guardrail (D-09) as the one line and let workflow 04 carry the sequence.")

## Issues Encountered
- **Task 1 byte ceiling.** The initial inner-loop + seam line landed at 3452B (FAIL ceiling 3307B). Resolved by following the plan's stated fallback: tighten to the seam guardrail + pointer. Five tightening passes brought it from 3452B → 3387B → 3368B → 3339B → 3308B → 3295B (final). The final line names inner-loop ownership in one clause and the seam rule (`logic beneath the acceptance scenario, never its observable outcome`), pointing to `example-mapping.md`. All edits were on the single Task-1 line within the planned scope; foundation guards GREEN at the final state. (Within the 3-attempt-per-task fix budget intent — the byte trims were refinements of the single planned line, not separate auto-fixes.)

## User Setup Required
None - no external service configuration required. The AGENTS.md acceptance slot is intentionally `UNKNOWN - verify`: the host project supplies the real BDD runner command (by design, D-12 / no-fabrication floor).

## Next Phase Readiness
- The "role enforces" guardrails (D-08/D-09) and the runnable acceptance slot (D-12) are now in place. The role lines POINT to the workflow 04 loop (plan 12-03) and the `example-mapping.md` seam (plan 12-02) — single-source held.
- This is the LAST plan of Phase 12 (plans 12-01 through 12-05). With 12-04 (evidence fields) and this plan complete, the BDD+TDD wiring (BDD-01/02/03, TDD-01/02) lands the rules + artifacts; Phase 15's test-integrity gate is where they mechanically bite (executable-or-absent, no-second-red, one-behavior-one-layer) — explicitly deferred, not pre-empted here.
- No blockers. All foundation guards (guard_role_size, guard_voice, guard_caveman_preserved, guard_agents_bytes, guard_adapter_size) GREEN.

## Known Stubs
None. The AGENTS.md `Acceptance / BDD scenarios: UNKNOWN - verify` value is the intentional, by-design no-fabrication placeholder per D-12 (the host supplies the runner) — it is the correct artifact, not a stub.

## Self-Check: PASSED
- `agent-factory/roles/software-engineer.md` — FOUND, seam line present (3295B < 3307B FAIL ceiling)
- `agent-factory/roles/qe-e2e.md` — FOUND, acceptance-contract line present (3220B < 3224B FAIL ceiling)
- `AGENTS.md` — FOUND, `### Acceptance` slot present, value `UNKNOWN - verify`, no adapter touched
- Commits `567dc20`, `c8d7a8f`, `74c2938` — all FOUND in git log
- `sh scripts/check-foundation-guards.sh` — exit 0, ALL CHECKS PASSED

---
*Phase: 12-bdd-tdd-wiring*
*Completed: 2026-06-11*
