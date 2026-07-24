---
phase: 26
slug: dogfood-dual-path-oracle-a3-dog-02-retirement
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-01
validated: 2026-07-24
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Transcribed from `26-RESEARCH.md` § Validation Architecture (read from source 2026-07-01).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (`globals:false` — import test fns explicitly) |
| **Config file** | none dedicated — driven by `package.json` scripts; tests co-located as `scripts/*.test.ts` |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**'` (Tier-1 + hermetic, NO live lane) |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (regression) + `npm run test:e2e` (gated live lane, separate) |
| **Estimated runtime** | ~30–90 seconds (non-e2e); live lane ~8 min and token-spending — never in the quick loop |

> ⚠️ NEVER use bare `npm test` for regression — it includes `scripts/e2e/` (the live `claude` lane): token burn + can hang ~8 min (Pitfall 4 / project memory).

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` **and** `npm run freshness` (exit 0)
- **After every plan wave:** full non-e2e suite **and** `node scripts/check-foundation-guards.js` (exit 0)
- **Before `/gsd-verify-work`:** full non-e2e suite green + `npm run freshness` exit 0
- **Phase gate (retired flip only):** non-e2e green + freshness 0 + **one captured live run** (Tier-2 authed OR human runbook) recorded as evidence (D-01/D-02)
- **Max feedback latency:** ~90 seconds (non-e2e loop)

---

## Per-Task Verification Map

> Task IDs are assigned by the planner (per-task rows filled at plan time). Mapped here by requirement from RESEARCH.md § Phase Requirements → Test Map.

| Req | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|------------|-----------------|-----------|-------------------|-------------|--------|
| DOGF-01 | Two replay modes converge on-disk (same admitted-note set + verdict string) | T-26-repudiation (assert notes, not deleted handoffs) | Frozen synthetic §14 stamp only — no `emitVerdict`/`admit` (D-03) | unit (hermetic) | `npx vitest run scripts/check-uat-oracles.test.ts scripts/convergence-spine.test.ts` | ✅ | ✅ green |
| DOGF-01 | New oracle folds RED into the aggregator (non-vacuity: `assertEquivalent` returns non-empty diff on divergence) | — | Replace `oracleParity`, update importer in lockstep (D-12) | unit | `npx vitest run scripts/check-uat-oracles.test.ts -t "equivalence"` | ✅ | ✅ green |
| DOGF-01 | Aggregator invokes new oracle + exits red on defect | — | N/A | unit (smoke) | `node scripts/check-foundation-guards.js` | ✅ | ✅ green |
| DOGF-02 | N distinct un-clobbered notes; each task claimed once; stale claim reclaimed; shared-root vs worktree-local | T-26-tampering (arg-array spawn, no shell) | One shared absolute contextRoot + queueRoot outside every worktree (D-07) | unit (hermetic, real `git worktree`) | `npx vitest run scripts/worktree-dogfood.test.ts` | ✅ | ✅ green |
| DOGF-02 (live) | N-agent live `claude` spawn confirmation (`A3-live` + `A3-live-N`, confirmation-only per D-09) | T-26-repudiation (loud-skip never a pass) | Retargeted off deleted handoff filenames (Pitfall 5, done in 26-04) | e2e (gated, loud-skip) | `npm run test:e2e` (authed box only) | ✅ | ⏸ gated — manual-only (GAP-D1) |
| DOGF-03 | Cost harness parses usage or returns `UNKNOWN - verify` | T-26-repudiation (never fabricate a number) | Default `UNKNOWN - verify`; never assert DeLM's numbers as grugops's (D-10) | unit (fixture) | `npx vitest run scripts/measure-cost.test.ts` | ✅ | ✅ green |
| A2 harness (26-06) | Prod-deploy-deny matcher is structural, point-of-effect-sound, non-vacuous both directions (real guard deny TRUE; admission-guard deny / doc-quotes / forged-prose FALSE) | T-26-A2 (fabricated live green) | Parse envelope; same-object PreToolUse+deny+`GRUGOPS_PROD_DEPLOY_APPROVED` signature; live A2 confirmation-only (D-09) | unit (offline) | `npx vitest run scripts/prod-deploy-deny-match.test.ts` | ✅ | ✅ green |
| Build integrity | Committed `.js` twins match source after edits | T-26-EoP (no prod-approval env set) | `npm run freshness` exit 0 after every `.ts` edit | gate | `npm run build && npm run freshness` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⏸ gated (manual-only)*

---

## Wave 0 Requirements

- [x] `scripts/dual-path-equivalence.ts` (+ committed `.js`) — shared `currentState()` comparator both the SC3 test and the new oracle import (single-source, no drift) — 26-01
- [x] `oracleDualPathEquivalence()` in `scripts/check-uat-oracles.ts` **replacing** `oracleParity` + update `scripts/check-foundation-guards.ts` (import + invoke) in the SAME change — 26-01
- [x] Update `scripts/check-uat-oracles.test.ts` from parity-string tests → equivalence RED/GREEN tests — 26-01
- [x] New `scripts/worktree-dogfood.test.ts` — real `git worktree` N-process dogfood (DOGF-02) — 26-02
- [x] New cost harness + fixture (DOGF-03) with `UNKNOWN - verify` default — `scripts/measure-cost.ts` + `.test.ts`, 26-03
- [x] Extend `scripts/e2e/uat-live.test.ts` A3-live for N-agent live confirmation AND retarget it off the deleted handoff filenames — 26-04 (repaired in 26-06)
- [x] Rebuild committed `.js` twins for every edited `.ts`; `npm run freshness` exit 0 — verified 2026-07-24 (25 twins fresh)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| One captured live dual-path run exists (evidence gate for the retired flip) | DOG-02 retirement / SC4 (D-01) | Real dual *dispatch* needs an authed `claude` or a human; the deterministic oracle drives the same code two ways and cannot exercise real dispatch | Run the authed Tier-2 lane (`npm run test:e2e`) on an authed box, OR follow `docs/dogfood-human-runbook.md`; record the capture (date + verdict) as evidence before flipping A3/DOG-02 to retired |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (all 7 items delivered across plans 26-01…26-06)
- [x] No watch-mode flags
- [x] Feedback latency < 90s (non-e2e loop; targeted phase-26 files run in ~3.5 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-24 (retroactive Nyquist audit)

---

## Validation Audit 2026-07-24

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Retroactive audit after phase completion (all 6 plans complete; phase VERIFIED 4/4, UAT 12 passed).
Every automated requirement re-verified green on this box:

- `npx vitest run scripts/check-uat-oracles.test.ts scripts/convergence-spine.test.ts scripts/worktree-dogfood.test.ts scripts/measure-cost.test.ts scripts/prod-deploy-deny-match.test.ts` — 5 files, 28 passed.
- `node scripts/check-foundation-guards.js` — exit 0 (`oracleDualPathEquivalence` folded in, D-12).
- `npm run freshness` — exit 0 (25 committed `.js` twins fresh).
- `scripts/e2e/uat-live.test.ts` — 4 gated `it.skipIf(!LIVE)` cases, 8 `LOUD_SKIP_MARKER` sites; loud-skip keystone intact (never run here — token guardrail).

Map reconciled with reality: planned placeholder filenames (`scripts/<new>-worktree-dogfood.test.ts`, `scripts/<new>-cost.test.ts`) replaced with the shipped `scripts/worktree-dogfood.test.ts` / `scripts/measure-cost.test.ts`; added the 26-06 A2 structural-matcher row (`scripts/prod-deploy-deny-match.test.ts`) which post-dated this document.

The single non-automated item — ONE captured live dual-path run (D-01/D-02, GAP-D1) — remains correctly in Manual-Only: it requires an authed `claude` box or a human runbook run by definition, and no generated test can close it. The A3/DOG-02 retirement flip stays DEFERRED on that evidence (user-confirmed in 26-UAT).
