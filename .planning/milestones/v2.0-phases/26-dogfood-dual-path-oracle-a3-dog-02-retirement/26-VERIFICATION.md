---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
verified: 2026-07-24T00:00:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement Verification Report

**Phase Goal:** Turn "degrade, never break" and "verified means verified" from prose into proof — a dual-path equivalence oracle on on-disk artifacts, an N-agent parallel dogfood, and an honest token-cost measurement — and retire A3/DOG-02 only when the oracle passes.
**Verified:** 2026-07-24
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criteria) | Status | Evidence |
|---|---|---|---|
| 1 | A dual-path equivalence oracle (replacing `oracleParity` A3) runs the same seeded task parallel-spawn-sim vs sequential-drain and asserts ON-DISK equivalence — same admitted `finding`s, same gate verdict, same artifact. | ✓ VERIFIED | `scripts/dual-path-equivalence.ts` (single-source `projectTaskState`/`assertEquivalent`, id-dropped, totally-ordered sort per WR-02 fix). `scripts/check-uat-oracles.ts:408-` `oracleDualPathEquivalence()` replays Mode A (parallel-spawn-sim) vs Mode B (sequential-drain), asserts same `done/` set anchored to the expected set (WR-01 fix), same per-task `projectTaskState`, same frozen verdict `READY_FOR_HUMAN_REVIEW`. Wired into `check-foundation-guards.ts:62,648`. **Ran it live:** `node scripts/check-foundation-guards.js` → exit 0, `[oracleDualPathEquivalence] ... PASS`. `npx vitest run scripts/check-uat-oracles.test.ts scripts/check-foundation-guards.test.ts` → all green, including the non-vacuity RED case (comparator returns non-empty diff on deliberate divergence). |
| 2 | A parallel N-agent dogfood produces N distinct un-clobbered notes, each task claimed exactly once, a stale claim reclaimed — confirming `isolation: worktree` ↔ shared-context-path interaction. | ✓ VERIFIED | `scripts/worktree-dogfood.test.ts` (257 lines): N=`queue.wip_limit`=3 real `git worktree add` checkouts + N node children pinned to one shared absolute `SHARED_QUEUE`/`SHARED_CONTEXT` outside every worktree; asserts exactly-once claim, N distinct un-clobbered `notes/<id>.md`, a negative shadow-check (no worktree grew its own populated context), and `sweepStale` reclaim of a deliberately stale claim (returned + moved to `pending/`) while a fresh claim is untouched. **Ran it live:** `npx vitest run scripts/worktree-dogfood.test.ts` → 2/2 passed. |
| 3 | Aggregate token cost is measured so the ~50% claim is DEMONSTRATED with grugops's own numbers or honestly marked `UNKNOWN - verify` (DeLM's numbers never asserted as grugops's). | ✓ VERIFIED | `scripts/measure-cost.ts` — `measureCost(json)` returns `UNKNOWN - verify` on: no usage object, a usage-shaped-but-schema-unconfirmed payload, and malformed/garbage input (never throws). No branch ever populates a numeric field this session (D-10). `grep -cE '10\.5\|~?50%\|DeLM' scripts/measure-cost.ts` = 0 (no borrowed DeLM benchmark). **Ran it live:** `npx vitest run scripts/measure-cost.test.ts` → 4/4 passed. `npm run build && npm run freshness` → exit 0, 25/25 committed `.js` twins fresh. |
| 4 | A3/DOG-02 is marked retired ONLY after the equivalence oracle passes — never on handoff deletion alone. | ✓ VERIFIED (gating behavior, correctly DEFERRED) | Plan 26-05's blocking human-verify checkpoint required BOTH (a) oracle green AND (b) one captured live dual-path run. (a) is met; (b) is absent (live e2e lane deliberately not run — real tokens/hang risk, GAP-D1). Human replied `defer` (26-05-SUMMARY.md, confirmed again in 26-UAT.md Test 4, 2026-07-24). Verified nothing flipped: `.planning/REQUIREMENTS.md:75` carries an honest "PENDING — DEFERRED (2026-07-02)" note; `examples/03-ticket-to-pr.md` parity table cells still read `pending human` (grep confirms 5 occurrences incl. the CC-native column) and still names the deleted MIGR-02 handoff filenames + the stale `.mjs` reference — untouched, exactly as the DEFER branch requires. `ROADMAP.md:76` correctly shows the Phase 26 checkbox unchecked with an explicit "phase NOT complete — retirement DEFERRED" note (no premature-complete). |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/dual-path-equivalence.ts` (+ `.js` twin) | Single-source `projectTaskState`/`assertEquivalent` comparator | ✓ VERIFIED | 95 lines; exports both functions; imported by both `convergence-spine.test.ts` and `check-uat-oracles.ts` (single-source, no duplicated projection logic) |
| `scripts/check-uat-oracles.ts` | `oracleDualPathEquivalence()` replacing `oracleParity` | ✓ VERIFIED | `oracleParity` no longer present (grep = 0 hits); `oracleDualPathEquivalence` exported and self-seeds hermetic temp dirs |
| `scripts/check-foundation-guards.ts` | Imports + invokes the new oracle | ✓ VERIFIED | Import at line 62, invocation at line 648; real run folds it into `ALL CHECKS PASSED` |
| `scripts/check-uat-oracles.test.ts` | Equivalence RED/GREEN tests replacing oracleParity mirror tests | ✓ VERIFIED | GREEN convergence case + RED non-vacuity case present and passing |
| `scripts/worktree-dogfood.test.ts` | Hermetic real-worktree N-agent dogfood | ✓ VERIFIED | 257 lines, no committed `.js` twin needed (test file, tsconfig-excluded); 2/2 tests passing |
| `scripts/measure-cost.ts` (+ `.js` twin) + `scripts/measure-cost.test.ts` | Honest cost harness | ✓ VERIFIED | 94-line harness, 81-line fixture test, 4/4 passing, freshness clean |
| `scripts/e2e/uat-live.test.ts` | A3-live retargeted off deleted handoffs + gated N-agent live case + repaired timeouts/matcher (26-04, 26-06) | ✓ VERIFIED | Static verification only (per instruction — never run the live lane): 0 handoff-filename/FROZEN_HANDOFFS refs; `READY_FOR_HUMAN_REVIEW`, `LOUD_SKIP_MARKER` present; `GRUGOPS_PROD_DEPLOY_APPROVED` never set; `shell: *true` = 0; `liveTimeoutMs`/`WIP_LIMIT`/`prodDeployDenyFired` all wired on all 4 live cases |
| `docs/dogfood-human-runbook.md` | Retargeted onto on-disk note-set + verdict equivalence | ✓ VERIFIED | Names `READY_FOR_HUMAN_REVIEW` + shared-context findings as the artifact; no deleted handoff filenames; Step 4 records capture date + verdict evidence |
| `scripts/prod-deploy-deny-match.ts` (+ `.js` twin) + `.test.ts` | Structural deny matcher (26-06 gap closure) | ✓ VERIFIED | 126-line matcher anchored on `"permissionDecision":"deny"` + guard attribution; 223-line offline non-vacuity RED/GREEN test (23 cases across `check-uat-oracles.test.ts`/`worktree-dogfood.test.ts`/`measure-cost.test.ts`/`prod-deploy-deny-match.test.ts` combined run: 54/54 passing) |
| `examples/03-ticket-to-pr.md` | Untouched (defer branch) | ✓ VERIFIED (correctly untouched) | Still names deleted handoffs + stale `.mjs` + `pending human` cells — exactly as required by the DEFER outcome |
| `.planning/REQUIREMENTS.md` | DOGF-01/02/03 done + honest DEFERRED retirement note | ✓ VERIFIED | Lines 71-75: all three checked `[x]`, deferral note present and accurate |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `check-foundation-guards.ts` | `oracleDualPathEquivalence` | import (line 62) + invoke (line 648) | ✓ WIRED | Real run: `node scripts/check-foundation-guards.js` exit 0, oracle PASS logged |
| `convergence-spine.test.ts` | `dual-path-equivalence.ts` | `import { projectTaskState } from "./dual-path-equivalence.js"` | ✓ WIRED | Single-source comparator confirmed shared by both consumers |
| `check-uat-oracles.ts` | `dual-path-equivalence.ts` | imports `projectTaskState`/`assertEquivalent` | ✓ WIRED | Used inside `oracleDualPathEquivalence()` at lines 460-470 |
| `worktree-dogfood.test.ts` | `scripts/claim.js` / `scripts/context-io.js` (main checkout committed twins) | absolute-path import by every worktree child | ✓ WIRED | Confirmed by header comment + passing exactly-once/un-clobbered assertions |
| `uat-live.test.ts` A2 case | `prod-deploy-deny-match.ts` | `import { prodDeployDenyFired } from "../prod-deploy-deny-match.js"` (line 63) | ✓ WIRED | Grep confirms import + usage at line 363 |

### Anti-Patterns Found

None. Scanned all key phase-modified files (`dual-path-equivalence.ts`, `worktree-dogfood.test.ts`, `measure-cost.ts`, `prod-deploy-deny-match.ts`, `uat-live.test.ts`, `dogfood-human-runbook.md`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and prose stub markers — zero hits.

Prior code-review findings (26-REVIEW.md, 2026-07-02, status `issues_found`):
- **CR-01** (critical — Windows entry-point false-green): fixed. `scripts/check-uat-oracles.ts:516-523` uses the canonical `pathToFileURL` comparison with an inline comment citing CR-01.
- **WR-01** (vacuity gap in `done/` sub-check): fixed. `check-uat-oracles.ts:448-455` anchors `doneA`/`doneB` against the expected seeded-task set (`doneExpected`), not just to each other.
- **WR-02** (non-total sort key, order-fragile comparator): fixed. `dual-path-equivalence.ts:59-63` extends the tiebreak chain to a full `JSON.stringify` comparison, making the sort total.
- **WR-03** (bare `>` false-positive in `guard_context_writes`): pre-existing from Phase 20, out of this phase's scope — not a Phase 26 blocker.

### Behavioral Spot-Checks / Live Runs

| Behavior | Command | Result | Status |
|---|---|---|---|
| Deterministic aggregator (incl. new oracle) | `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED`, `oracleDualPathEquivalence` PASS logged | ✓ PASS |
| Full deterministic phase-26 test set | `npx vitest run scripts/check-uat-oracles.test.ts scripts/worktree-dogfood.test.ts scripts/measure-cost.test.ts scripts/prod-deploy-deny-match.test.ts scripts/check-foundation-guards.test.ts` | 5 files, 54/54 passed | ✓ PASS |
| Build + freshness (committed `.js` twins fresh) | `npm run build && npm run freshness` | exit 0, "All build outputs fresh: 25 committed .js file(s) match a fresh tsc rebuild." | ✓ PASS |
| Full regression suite (context-provided, cross-checked) | `npx vitest run --exclude '**/scripts/e2e/**'` | 794 passed / 1 skipped | ✓ PASS (context-provided, consistent with the narrower runs above) |
| Live e2e lane (`scripts/e2e/uat-live.test.ts`) | — | NOT RUN (per instruction — real tokens/hang risk) | ? SKIP — verified statically only |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DOGF-01 | 26-01 | Dual-path equivalence oracle replacing `oracleParity` | ✓ SATISFIED | `oracleDualPathEquivalence` live-run PASS + tests green |
| DOGF-02 | 26-02, 26-04, 26-06 | N-agent parallel dogfood, exactly-once claim, un-clobbered notes, stale reclaim | ✓ SATISFIED | `worktree-dogfood.test.ts` 2/2 passing; live A3-live-N case statically verified |
| DOGF-03 | 26-03 | Honest token-cost measurement, no fabrication | ✓ SATISFIED | `measure-cost.test.ts` 4/4 passing; no numeric field ever populated |

No orphaned requirements — `.planning/REQUIREMENTS.md:133-135` maps only DOGF-01/02/03 to Phase 26, all accounted for by plans 26-01/02/03 (+ 04/06 extending 02).

### Human Verification Required

None. All observable truths verified programmatically against real, executed test/build output (not SUMMARY.md claims). The SC4 evidence-gate behavior (correctly deferred) was independently confirmed by re-reading `.planning/REQUIREMENTS.md`, `examples/03-ticket-to-pr.md`, and `ROADMAP.md`, and cross-checked against the human's own 2026-07-24 confirmation already recorded in `26-UAT.md` Test 4 (pass) — no new human action is required to close this phase.

### Gaps Summary

No gaps. All four ROADMAP success criteria hold:
1. The dual-path equivalence oracle is real, single-sourced, non-vacuous (RED-proven), wired into the aggregator, and passes on a real run.
2. The N-agent worktree dogfood is real (genuine `git worktree` checkouts, real node children, real shared-root pinning) and proves exactly-once claim, un-clobbered notes, no shadowing, and stale-claim reclaim — all via a live test run, not a claim.
3. The cost harness never fabricates a number and is honestly `UNKNOWN - verify` in every current branch (DOGF-03 is measurement-only and does not gate anything, per D-11).
4. The A3/DOG-02 retirement gate is honored: nothing flipped without both the oracle-green condition AND a captured live run; the deferral is correctly recorded and the ROADMAP is correctly NOT marked complete for this phase.

Two prior code-review WARNINGs (WR-01, WR-02) that could have undermined the oracle's non-vacuity/order-independence guarantees are confirmed fixed in the current code. The one prior CRITICAL (CR-01, Windows false-green) is confirmed fixed. The 26-06 gap-closure plan's four live-harness defects (A1/A2/A3/A3-N) are confirmed offline-fixed and red-team-hardened, without touching the still-correctly-deferred retirement.

---

_Verified: 2026-07-24_
_Verifier: Claude (gsd-verifier)_
