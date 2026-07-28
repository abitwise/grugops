---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
plan: 01
subsystem: testing
tags: [dual-path-equivalence, oracle, tier-1, context-io, claim, convergence, uat, freshness]

# Dependency graph
requires:
  - phase: 23-convergence-spine
    provides: convergence-spine.test.ts deterministic parallel-spawn-sim vs sequential-drain replay engine
  - phase: 20-substrate
    provides: context-io appendNote/readContext/currentState + claim claimTask/transition primitives
  - phase: 19-tier1-oracles
    provides: check-uat-oracles.ts pass/fail/warn harness + uatOracleFails aggregator fold
provides:
  - scripts/dual-path-equivalence.ts single-source comparator (projectTaskState + assertEquivalent)
  - oracleDualPathEquivalence Tier-1 CI oracle replacing the structural-grep oracleParity
  - aggregator lockstep update (check-foundation-guards.ts imports + invokes the new oracle)
  - equivalence GREEN + non-vacuity RED tests proving the oracle can go red
affects: [26-02, 26-03, retirement-flip, DOG-02, A3-live]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-source equivalence comparator: one projectTaskState/assertEquivalent imported by BOTH the SC3 test and the Tier-1 oracle (no drift)"
    - "Frozen synthetic §14-gate stamp passes context-io validate() structurally (GATE_STAMP_RE) with NO live gate call (D-03)"
    - "Tier-1 self-seeding oracle: drives committed claim.js/context-io.js in hermetic mkdtempSync roots, reads no repo input"

key-files:
  created:
    - scripts/dual-path-equivalence.ts
    - scripts/dual-path-equivalence.js
  modified:
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/convergence-spine.test.ts
    - scripts/check-uat-oracles.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "Projected fingerprint drops the nonce id and carries {kind,at,verified_by,confidence,refs,body} (D-04, Pitfall 2)"
  - "oracleParity REPLACED not bare-deleted; aggregator import+invoke updated in the same change (D-12)"
  - "Frozen literal §14-gate#R26-DOGF01-0001 stamp + READY_FOR_HUMAN_REVIEW fixture constant — no emitVerdict/admit (D-03)"
  - "Retargeted the aggregator fail-closed test onto the A2 hooks-wiring oracle since the new A3 oracle self-seeds"

patterns-established:
  - "Pattern 1: promote a test's replay engine into a shared importable comparator (single-source, both sides import it)"
  - "Pattern 2: a Tier-1 oracle that self-seeds hermetic temp dirs needs a comparator-level RED non-vacuity test, not a mirror-input plant"

requirements-completed: [DOGF-01]

coverage:
  - id: D1
    description: "Single-source dual-path equivalence comparator (projectTaskState drops nonce id, assertEquivalent returns diff string[])"
    requirement: "DOGF-01"
    verification:
      - kind: unit
        ref: "scripts/convergence-spine.test.ts#parallel-spawn and sequential-drain replays produce order-independent identical substrate"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#equivalence non-vacuity: assertEquivalent returns a NON-empty diff when the two note-sets diverge"
        status: pass
    human_judgment: false
  - id: D2
    description: "oracleDualPathEquivalence replays one seed two ways in hermetic roots and asserts same admitted note-set + done/ artifact + frozen verdict, replacing oracleParity, folded into the aggregator"
    requirement: "DOGF-01"
    verification:
      - kind: integration
        ref: "node scripts/check-foundation-guards.js (exit 0, PASS dual-path equivalence)"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#equivalence: real aggregator GREEN and the dual-path equivalence oracle reports PASS"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#tier-1 wiring: a broken Tier-1 oracle input → aggregator nonzero + names the Tier-1 failure"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-07-01
status: complete
---

# Phase 26 Plan 01: Dual-Path Equivalence Oracle Summary

**Promoted convergence-spine's replay engine into a single-source comparator and shipped `oracleDualPathEquivalence` — a real on-disk substrate-convergence Tier-1 oracle that replaces the structural-grep `oracleParity`, folded into the foundation-guards aggregator and proven non-vacuous by a RED test.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-01T12:19:50Z
- **Completed:** 2026-07-01T12:28:29Z
- **Tasks:** 3 (+1 Rule 1 fix)
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments
- `scripts/dual-path-equivalence.ts` — the SINGLE-SOURCE comparator (`projectTaskState` replays via context-io `currentState()`, drops the nonce `id`, carries the finding fields; `assertEquivalent` returns a human-readable diff `string[]`, empty iff equivalent). Imported by BOTH `convergence-spine.test.ts` and the new oracle — no duplicated projection.
- `oracleDualPathEquivalence()` replaces `oracleParity` in `check-uat-oracles.ts`: seeds one minimal decomposition (soft note + one admitted finding carrying the frozen `§14-gate#R26-DOGF01-0001` stamp and the `READY_FOR_HUMAN_REVIEW` body), replays it parallel-spawn-sim vs sequential-drain in hermetic `mkdtempSync` roots, and asserts the same admitted note-set + same `done/` artifact + frozen verdict on disk — no `emitVerdict`/`admit`, no live gate (D-03).
- `check-foundation-guards.ts` imports and invokes the new oracle in the SAME change (D-12); the real-tree aggregator exits 0 with the oracle passing.
- Replaced the two parity-grep tests with an equivalence GREEN case (real aggregator + oracle PASS) and an `assertEquivalent`-based RED non-vacuity keystone (field-level + count divergence → non-empty diff; identical sets → empty diff).

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract single-source comparator + retrofit convergence-spine** - `696e855` (feat)
2. **Task 2: Replace oracleParity with oracleDualPathEquivalence + aggregator lockstep** - `087a9a2` (feat)
3. **Task 3: Equivalence GREEN + non-vacuity RED tests** - `4461fa3` (test)
4. **Rule 1 fix: retarget aggregator fail-closed test** - `6fd06e4` (fix)

_Note: TDD tasks 1 and 2 were implemented and verified as single passing commits (RED behavior for Task 1/2 is carried by Task 3's non-vacuity test; the comparator's diff contract is the keystone)._

## Files Created/Modified
- `scripts/dual-path-equivalence.ts` (+ `.js` twin) - `projectTaskState(contextRoot, task)` and `assertEquivalent(a, b)`; the single equivalence definition.
- `scripts/check-uat-oracles.ts` (+ `.js` twin) - `oracleDualPathEquivalence()` replacing `oracleParity`; fixture constants FIXED_ID / GATE_STAMP / FROZEN_VERDICT.
- `scripts/check-foundation-guards.ts` (+ `.js` twin) - import + invoke of the new oracle (lockstep).
- `scripts/convergence-spine.test.ts` - `canonical()` now calls the shared `projectTaskState`; assertions unchanged.
- `scripts/check-uat-oracles.test.ts` - equivalence GREEN + `assertEquivalent` RED non-vacuity cases; dropped the dead parity guard input.
- `scripts/check-foundation-guards.test.ts` - fail-closed test retargeted to the A2 hooks-wiring oracle; dropped the dead parity guard input.

## Decisions Made
- Followed CONTEXT decisions D-03 (frozen synthetic stamp, no live gate), D-04 (projection drops id, carries finding fields), D-12 (replace + update importer in lockstep) as specified.
- Kept the `warn` harness helper in place though now uncalled — it is part of the pass/fail/warn Tier-1 contract; removing it would be scope creep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Retargeted the aggregator fail-closed test to a surviving Tier-1 oracle**
- **Found during:** Task 3 (overall non-e2e regression)
- **Issue:** `scripts/check-foundation-guards.test.ts`'s "tier-1 wiring: a broken Tier-1 oracle input → aggregator nonzero" test broke the retired `oracleParity` by mutating `examples/03-ticket-to-pr.md`. The new `oracleDualPathEquivalence` self-seeds hermetic temp dirs and reads NO mirror input, so it cannot be broken that way — the test asserted the deleted "parity structural violation" string.
- **Fix:** Retargeted the fail-closed proof onto the A2 hooks-wiring oracle (mutate `hooks.json` matcher away from "Bash"), a crisp deterministic Tier-1 failure the aggregator still folds via `uatOracleFails()`. Dropped the now-dead `examples/03-ticket-to-pr.md` from both test files' guard-input lists.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts` (28 passed); full non-e2e suite 778 passed / 1 skipped.
- **Committed in:** 6fd06e4

---

**Total deviations:** 1 auto-fixed (1 bug — blocking test breakage from the oracle replacement)
**Impact on plan:** The fix was required for the same lockstep-replacement contract the plan mandates (D-12: update all sites in the same change). The plan enumerated the two oracle-owned test files but not this third aggregator test that also exercised the retired oracle. No scope creep.

## Issues Encountered
- Two `oracleParity` references initially survived in my own new comments in `check-uat-oracles.test.ts`, failing the `grep -c 'oracleParity' == 0` gate. Reworded to "parity-grep" — gate now returns 0.

## Verification Results
- `npx vitest run --exclude '**/scripts/e2e/**'` — 27 files, 778 passed / 1 skipped.
- `node scripts/check-foundation-guards.js` — exit 0, `PASS dual-path equivalence`.
- `npm run build && npm run freshness` — exit 0, "All build outputs fresh: 23 committed .js file(s) match a fresh tsc rebuild."
- All per-task grep gates hold (exports=2, no `id:` in projection, no `emitVerdict`/`admit` in non-comment lines, no deleted handoff filenames, aggregator has 0 `oracleParity` / ≥2 `oracleDualPathEquivalence`).
- The live e2e lane was NOT run (project guardrail #2 — bare `npm test`/e2e spends tokens; excluded deliberately).

## Next Phase Readiness
- DOGF-01's deterministic half is green: the equivalence oracle is the always-on Tier-1 gate.
- The RETIREMENT flip (A3/DOG-02) remains evidence-gated (D-01/D-02): it additionally requires one captured live dual-path run. That live capture and the N-agent worktree dogfood (DOGF-02) + cost harness (DOGF-03) are the remaining plans 02–05. The retired flip must NOT happen on the deterministic oracle alone.
- Loud Flag 2 (Tier-2 `A3-live` + human runbook still naming the Phase-24-deleted handoff filenames) is unaddressed here by design — it is the retirement/Tier-2 plans' scope, and this plan's oracle correctly references no deleted artifacts.

## Self-Check: PASSED

All created files exist on disk and all task commits are present in git history.

---
*Phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement*
*Completed: 2026-07-01*
