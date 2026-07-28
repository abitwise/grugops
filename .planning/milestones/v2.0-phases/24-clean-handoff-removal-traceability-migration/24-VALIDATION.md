---
phase: 24
slug: clean-handoff-removal-traceability-migration
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-22
audited: 2026-07-21
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `24-RESEARCH.md` §Validation Architecture (all source files verified live).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 |
| **Config file** | `vitest.config.*` (project root; `test` script = `vitest run`) |
| **Quick run command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Full suite command** | `npm test` (⚠️ triggers the live claude-CLI e2e lane — see `[[grugops-npm-test-triggers-live-e2e]]`; prefer the excluded form for regression) |
| **Estimated runtime** | ~30 seconds (non-e2e); full suite spends tokens + ~8 min on the e2e lane |

**Freshness gates (committed-`.js` drift + render drift):** `npm run freshness` + `npm run freshness:context` + `npm run freshness:queue` + **(NEW) `npm run freshness:traceability`**.

---

## Sampling Rate

- **After every task commit:** `npx vitest run --exclude '**/scripts/e2e/**'` + `npm run freshness`
- **After every plan wave:** full non-e2e suite + all four freshness gates + `node scripts/check-kit-refs.js` + `node scripts/check-foundation-guards.js` + `node scripts/validate-agent-factory.js`
- **Before `/gsd-verify-work`:** full non-e2e suite green + the **D-15 adversarial RED-vs-committed-`.js` reproduction run independently** (orchestrator probe + code-review — a logic-probe ≠ the input-surface code-review, per the Phase-23 lesson)
- **Max feedback latency:** ~30 seconds (non-e2e suite)

---

## Per-Task Verification Map

> Task IDs bound at audit (2026-07-21) from the executed plans. All commands re-run green on audit day. Note: validator unit tests live in `scripts/validate.test.ts` (the draft's `validate-agent-factory.test.ts` name never existed).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-05 T1+T2 | 24-05 | 2 | MIGR-01 | T-faked-gate | Zero `agent-factory/handoffs/` refs after rewire (flipped Assertion 2) | gate + unit | `node scripts/check-kit-refs.js` + `npx vitest run scripts/check-kit-refs.test.ts` | ✅ `check-kit-refs.test.ts` (5 tests: GREEN / RED-plant / former-template-name / BACKPRESSURE / round-trip) | ✅ green |
| 24-01 T1–T3, 24-02 T1–T2 | 24-01, 24-02 | 1 | MIGR-01 | T-raw-write | `guard_context_writes` green on rewired prose (reference WF16, never restate) | gate | `node scripts/check-foundation-guards.js` | ✅ `check-foundation-guards.test.ts` | ✅ green |
| 24-05 T2 | 24-05 | 2 | MIGR-02 | — | 17 templates + 8 fixture dirs deleted; validator/catalog updated SAME change (commit `2e44c31`) | unit + gate | `npx vitest run scripts/validate.test.ts` + `node scripts/validate-agent-factory.js` | ✅ `validate.test.ts` (fixture expectations moved) | ✅ green |
| 24-04 T2 | 24-04 | 1 | MIGR-02 | — | install no longer seeds `plans/handoffs/` (inverted at `install.test.ts:303-312`) | unit | `npx vitest run install/install.test.ts` | ✅ assertion inverted | ✅ green |
| 24-03 T1 | 24-03 | 1 | MIGR-03 | T-trace-loss | Trace preserved on note `refs`; `traceability.md` is a deterministic render | unit | `npx vitest run scripts/trace-render.test.ts` | ✅ `trace-render.ts` + `.test.ts` | ✅ green |
| 24-03 T2 | 24-03 | 1 | MIGR-03 | T-trace-loss | Stale trace fails closed | gate + unit | `npm run freshness:traceability` + `npx vitest run scripts/trace-freshness.test.ts` | ✅ `trace-freshness.ts` + `.test.ts` + package script | ✅ green |
| 24-04 T1+T2 | 24-04 | 1 | MIGR-04 | T-clobber | `--migrate` backs up `plans/handoffs/` → `.bak.<ISO>`, never delete-first, abort on collision | unit | `npx vitest run install/install.test.ts` | ✅ 4 cases at `install.test.ts:742+` (backup / idempotent / dry-run / collision) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/check-kit-refs.test.ts` — **DELIVERED** (24-05 T1); covers MIGR-01 grep-to-zero + the **D-15 both-direction adversarial proof** (planted `agent-factory/handoffs/` ref → exit 1; clean kit → exit 0; backpressure RED-vs-committed-`.js`) via the `spawnSync` + hermetic `CHECK_ROOT` idiom. 5 tests green.
- [x] `scripts/trace-render.ts` + `scripts/trace-render.test.ts` — **DELIVERED** (24-03 T1); covers MIGR-03 deterministic render (D-01, clone of `context-io.ts render`).
- [x] `scripts/trace-freshness.ts` + test + `freshness:traceability` package.json script — **DELIVERED** (24-03 T2); covers D-03 fail-closed (`plans/`-rooted twin, standalone gate — NOT the committed-`.js` freshness kind).
- [x] Inverted `install.test.ts` seed assertion (now `:303-312`, asserts `plans/handoffs/` is NOT created) + `scripts/validate.test.ts` fixture expectations updated (8 fixture dirs lost `handoffs/`) — delivered 24-04 T2 / 24-05 T2.
- [x] Extended `install/install.test.ts` migrate cases with the 4 D-18/D-20 handoffs-backup cases (backup / idempotent / dry-run / collision-abort) at `:742+` — delivered 24-04 T2.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| D-15 adversarial RED reproduction vs committed `.js` | MIGR-01 | Green suite ≠ proof on a trace/safety surface ([[grugops-safety-invariant-green-suite-insufficient]]); an independent probe + code-review must reproduce the bypass | After the flip, run `node scripts/check-kit-refs.js` against a mirror with a planted `agent-factory/handoffs/` ref → assert exit 1; confirm a separate code-review of the SCAN input surface, not just the gate logic | ✅ DONE — reproduced from scratch in a hermetic mirror (both directions, committed `.js`, tree left clean) during verification 2026-06-22; SCAN input surface confirmed explicit (lines 45-54, CHECK_ROOT seam only). See `24-VERIFICATION.md` §D-15. |
| `git revert` rollback documented for `--migrate` | MIGR-04 | Rollback is a documentation + out-of-band-backup guarantee | Confirm `install/README.md` documents: `.bak.<ISO>` dir + `git revert` = lossless rollback | ✅ DONE — `install/README.md:216-231` documents the `.bak.<ISO>` restore + `git revert` lossless rollback (re-confirmed at audit 2026-07-21). |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (12/12 tasks across 5 plans carry `<automated>` blocks)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (5 NEW/inverted files above — all delivered)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (non-e2e suite ~33s on audit box; per-file runs well under)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated — audit 2026-07-21

---

## Validation Audit 2026-07-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Retroactive Nyquist audit against the executed phase (all 5 plans, 12 tasks). Every requirement row re-run green on audit day: full non-e2e suite 30 files / 794 passed / 1 skipped / 0 failed; `npm run freshness` (25 committed `.js` fresh), `npm run freshness:traceability` (vacuous greenfield pass), `node scripts/check-kit-refs.js`, `node scripts/check-foundation-guards.js`, `node scripts/validate-agent-factory.js`, `node scripts/check-uat-oracles.js` — all EXIT 0. Corrections folded in: task IDs bound (draft had TBDs), validator unit-test filename fixed (`scripts/validate.test.ts`, not the never-existing `validate-agent-factory.test.ts`), install seed-assertion line range updated to `:303-312`, migrate-backup cases located at `install.test.ts:742+`. Both manual-only rows were performed and evidenced in `24-VERIFICATION.md` (D-15 hermetic reproduction; rollback doc at `install/README.md:216-231`). No new tests needed — Wave 0 delivered the full contract during execution.
