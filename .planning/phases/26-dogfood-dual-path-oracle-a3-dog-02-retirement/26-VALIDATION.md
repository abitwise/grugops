---
phase: 26
slug: dogfood-dual-path-oracle-a3-dog-02-retirement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
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
| DOGF-01 | Two replay modes converge on-disk (same admitted-note set + verdict string) | T-26-repudiation (assert notes, not deleted handoffs) | Frozen synthetic §14 stamp only — no `emitVerdict`/`admit` (D-03) | unit (hermetic) | `npx vitest run scripts/check-uat-oracles.test.ts` | ⚠️ extend | ⬜ pending |
| DOGF-01 | New oracle folds RED into the aggregator | — | Replace `oracleParity`, update importer in lockstep (D-12) | unit | `npx vitest run scripts/check-uat-oracles.test.ts -t "parity\|equivalence"` | ⚠️ update | ⬜ pending |
| DOGF-01 | Aggregator invokes new oracle + exits red on defect | — | N/A | unit (smoke) | `node scripts/check-foundation-guards.js` | ✅ update sites | ⬜ pending |
| DOGF-02 | N distinct un-clobbered notes; each task claimed once; stale claim reclaimed; shared-root vs worktree-local | T-26-tampering (arg-array spawn, no `shell:true`) | One shared absolute contextRoot + queueRoot outside every worktree (D-07) | unit (hermetic, real `git worktree`) | `npx vitest run scripts/<new>-worktree-dogfood.test.ts` | ❌ W0 | ⬜ pending |
| DOGF-02 (live) | N-agent live `claude` spawn confirmation | T-26-repudiation (loud-skip never a pass) | Retarget off deleted handoff filenames (Pitfall 5) | e2e (gated, loud-skip) | `npm run test:e2e` | ⚠️ extend | ⬜ pending |
| DOGF-03 | Cost harness parses usage or returns `UNKNOWN - verify` | T-26-repudiation (never fabricate a number) | Default `UNKNOWN - verify`; never assert DeLM's numbers as grugops's (D-10) | unit (fixture) + e2e (real number) | `npx vitest run scripts/<new>-cost.test.ts` | ❌ W0 | ⬜ pending |
| Build integrity | Committed `.js` twins match source after edits | T-26-EoP (no prod-approval env set) | `npm run freshness` exit 0 after every `.ts` edit | gate | `npm run build && npm run freshness` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/dual-path-equivalence.ts` (+ committed `.js`) — shared `currentState()` comparator both the SC3 test and the new oracle import (single-source, no drift)
- [ ] `oracleDualPathEquivalence()` in `scripts/check-uat-oracles.ts` **replacing** `oracleParity` (line 329) + update `scripts/check-foundation-guards.ts` (import ~line 62, invoke ~line 643) in the SAME change
- [ ] Update `scripts/check-uat-oracles.test.ts` (lines 203, 221) from parity-string tests → equivalence RED/GREEN tests
- [ ] New `scripts/*-worktree-dogfood.test.ts` — real `git worktree` N-process dogfood (DOGF-02)
- [ ] New cost harness + fixture (DOGF-03) with `UNKNOWN - verify` default
- [ ] Extend `scripts/e2e/uat-live.test.ts` A3-live for N-agent live confirmation AND retarget it off the deleted handoff filenames
- [ ] Rebuild committed `.js` twins for every edited `.ts`; `npm run freshness` exit 0

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| One captured live dual-path run exists (evidence gate for the retired flip) | DOG-02 retirement / SC4 (D-01) | Real dual *dispatch* needs an authed `claude` or a human; the deterministic oracle drives the same code two ways and cannot exercise real dispatch | Run the authed Tier-2 lane (`npm run test:e2e`) on an authed box, OR follow `docs/dogfood-human-runbook.md`; record the capture (date + verdict) as evidence before flipping A3/DOG-02 to retired |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 new/extended files above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s (non-e2e loop)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
