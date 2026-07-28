---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
plan: 03
subsystem: testing
tags: [cost-measurement, dogfood, honest-default, unknown-verify, vitest, typescript, committed-js-twin]

# Dependency graph
requires:
  - phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
    provides: Tier-1 deterministic / Tier-2 loud-skip honesty split; the committed-.ts→.js twin + freshness gate contract
provides:
  - "scripts/measure-cost.ts — measureCost(json) aggregate token-cost harness with an honest UNKNOWN - verify default (DOGF-03)"
  - "scripts/measure-cost.js — committed compiled twin (freshness-fresh)"
  - "scripts/measure-cost.test.ts — fixture test proving the honest default and defensive-parse branches without the live CLI"
affects: [dogfood-cost-story, tier-2-authed-capture, retirement-evidence]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Honest UNKNOWN - verify default: a measurement harness that refuses to emit a number until a real authed schema is confirmed, never fabricating or borrowing an external benchmark (D-10)"
    - "Defensive candidate-path parse of untrusted --output-format json (json.usage / json.result.usage) that never throws on missing/unexpected shape"

key-files:
  created:
    - scripts/measure-cost.ts
    - scripts/measure-cost.js
    - scripts/measure-cost.test.ts
  modified: []

key-decisions:
  - "Harness defaults to UNKNOWN - verify even for a usage-shaped payload because the claude --output-format json usage field schema is unconfirmed this session (D-10); numeric fields stay undefined until a real authed capture is mapped in with a recorded date."
  - "No numeric field is EVER populated in any current branch — the strongest structural no-fabrication proof (a benchmark number cannot leak in if no number is returned)."
  - "Cost is measurement-only and does not gate the phase or the A3/DOG-02 retirement (D-11)."

patterns-established:
  - "Structural no-fabrication proof: assert every numeric field is undefined across absent / usage-shaped / malformed inputs, rather than blacklisting specific benchmark literals."
  - "Pure, side-effect-free harness that parses a value the caller already holds — never invokes the live claude CLI in the unit/fixture lane (D-11)."

requirements-completed: [DOGF-03]

coverage:
  - id: D1
    description: "measureCost(json) returns an honest UNKNOWN - verify note with no fabricated number when no aggregate usage object is present"
    requirement: "DOGF-03"
    verification:
      - kind: unit
        ref: "scripts/measure-cost.test.ts#returns UNKNOWN - verify with no numeric total when no usage object is present"
        status: pass
    human_judgment: false
  - id: D2
    description: "measureCost still returns UNKNOWN - verify for a usage-shaped payload because the field schema is unconfirmed this session (D-10)"
    requirement: "DOGF-03"
    verification:
      - kind: unit
        ref: "scripts/measure-cost.test.ts#STILL returns UNKNOWN - verify for a usage-shaped payload (schema unconfirmed this session)"
        status: pass
    human_judgment: false
  - id: D3
    description: "measureCost never throws and returns UNKNOWN - verify for malformed / garbage input (defensive parse)"
    requirement: "DOGF-03"
    verification:
      - kind: unit
        ref: "scripts/measure-cost.test.ts#never throws and returns UNKNOWN - verify for malformed / garbage input"
        status: pass
    human_judgment: false
  - id: D4
    description: "The harness never fabricates a number — no branch populates a numeric field; committed .js twin is freshness-fresh"
    requirement: "DOGF-03"
    verification:
      - kind: unit
        ref: "scripts/measure-cost.test.ts#never fabricates a number — no branch ever populates a numeric field"
        status: pass
      - kind: other
        ref: "npm run build && npm run freshness (exit 0, 24 committed .js twins fresh)"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-07-01
status: complete
---

# Phase 26 Plan 03: DOGF-03 Honest Token-Cost Measurement Harness Summary

**measureCost(json) parses the aggregate usage object from `claude --output-format json` defensively and defaults to `UNKNOWN - verify` — never fabricating a number and never borrowing an external tool's benchmark — proven by a fixture test that asserts no numeric field is ever emitted.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-01
- **Completed:** 2026-07-01
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments
- `measureCost(json)` cost harness that reads usage at candidate schema paths (`json.usage`, `json.result.usage`) without ever throwing, and returns the honest `UNKNOWN - verify` note whenever no usage object exists or the field schema is unconfirmed (D-10).
- The harness populates NO numeric field in any current branch — the strongest structural guarantee that no fabricated or borrowed benchmark number can ever be returned.
- Fixture test covers all three honesty branches (absent usage, usage-shaped-but-unconfirmed, malformed/garbage) and never invokes the live `claude` CLI (D-11); full non-e2e suite stays green (784 passed / 1 skipped) and the committed `.js` twin is freshness-fresh.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cost-measurement harness with an honest UNKNOWN - verify default** - `bf39386` (feat)
2. **Task 2: Fixture test proving the UNKNOWN - verify default and the defensive parse branch** - `810d498` (test)

_Note: Task 1 carried a `tdd="true"` flag; the plan decomposed the harness (Task 1) and its fixture test (Task 2) into separate atomic commits, so the RED/GREEN split lands across the two task commits rather than within one._

## Files Created/Modified
- `scripts/measure-cost.ts` - Exports `measureCost(json)` and the `CostMeasurement` type; defensive candidate-path usage lookup; honest `UNKNOWN - verify` default; no numeric field populated; no external benchmark literal.
- `scripts/measure-cost.js` - Committed compiled twin (rebuilt via `npm run build`; freshness-fresh).
- `scripts/measure-cost.test.ts` - Fixture test for the absent / usage-shaped / malformed branches; asserts numeric fields stay undefined; spawns no child process or live CLI.

## Decisions Made
- Followed the plan and D-10/D-11 exactly: the harness returns `UNKNOWN - verify` even for a plausible usage-shaped payload because the exact `claude --output-format json` usage field schema was not captured this session. Mapping real fields (with a recorded capture date) is explicitly deferred future work and does not gate this phase.
- Chose a structural no-fabrication assertion (every numeric field `undefined`) over blacklisting specific benchmark literals — a stronger, drift-proof proof that no number can be fabricated.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial draft of the fixture test contained the literal word `spawnSync` in a header comment, which tripped Task 2's acceptance criterion (`grep -c 'spawnSync'` must return 0). Reworded the comment to "spawns NO child process or live CLI"; the criterion then returned 0 and the test remained green. This was a same-task wording fix within planned work, not a deviation.

## User Setup Required

None - no external service configuration required. (A future authed Tier-2 capture will map the real usage schema and fill in grugops's own number — deferred, does not gate this phase per D-11.)

## Next Phase Readiness
- DOGF-03 is met: the honest cost instrument exists and is proven by a fixture test. The grugops number is honestly deferred to a later authed capture and never gates the phase or the A3/DOG-02 retirement.
- Remaining phase-26 work (DOGF-01 oracle wiring, DOGF-02 worktree dogfood, and the evidence-gated retirement flip) is independent of this plan.

## Self-Check: PASSED

- Files: scripts/measure-cost.ts, scripts/measure-cost.js, scripts/measure-cost.test.ts, 26-03-SUMMARY.md — all FOUND
- Commits: bf39386, 810d498, 64e93c8 — all FOUND

---
*Phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement*
*Completed: 2026-07-01*
