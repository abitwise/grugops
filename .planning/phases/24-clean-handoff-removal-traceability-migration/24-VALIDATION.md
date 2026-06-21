---
phase: 24
slug: clean-handoff-removal-traceability-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-22
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

> Task IDs are assigned by the planner / finalized in Wave 0. Rows below are the requirement→test contract from `24-RESEARCH.md`; the executor binds each to concrete task IDs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-W0 | TBD | 1 | MIGR-01 | T-faked-gate | Zero `agent-factory/handoffs/` refs after rewire (flipped Assertion 2) | gate | `node scripts/check-kit-refs.js` | ✅ script / ❌ test | ⬜ pending |
| TBD | TBD | 1 | MIGR-01 | T-raw-write | `guard_context_writes` green on rewired prose (reference WF16, never restate) | gate | `node scripts/check-foundation-guards.js` | ✅ `check-foundation-guards.test.ts` | ⬜ pending |
| TBD | TBD | 2 | MIGR-02 | — | 17 templates + 8 fixture dirs deleted; validator/catalog updated SAME change | unit + gate | `npx vitest run scripts/validate-agent-factory.test.ts` + `node scripts/validate-agent-factory.js` | ⚠️ expectations MOVE | ⬜ pending |
| TBD | TBD | 2 | MIGR-02 | — | install no longer seeds `plans/handoffs/` (invert `install.test.ts:299-308`) | unit | `npx vitest run install/install.test.ts` | ⚠️ assertion inverts | ⬜ pending |
| TBD-W0 | TBD | 1 | MIGR-03 | T-trace-loss | Trace preserved on note `refs`; `traceability.md` is a deterministic render | unit | `npx vitest run scripts/trace-render.test.ts` | ❌ Wave 0 | ⬜ pending |
| TBD-W0 | TBD | 1 | MIGR-03 | T-trace-loss | Stale trace fails closed | gate | `node scripts/<trace-freshness>.js` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | 2 | MIGR-04 | T-clobber | `--migrate` backs up `plans/handoffs/` → `.bak.<ISO>`, never delete-first, abort on collision | unit | `npx vitest run install/install.test.ts` | ⚠️ extend existing migrate cases | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-kit-refs.test.ts` — **NEW** (the gate is currently untested); covers MIGR-01 grep-to-zero + the **D-15 both-direction adversarial proof** (planted `agent-factory/handoffs/` ref → exit 1; clean kit → exit 0; backpressure RED-vs-committed-`.js`). Use the `now-running-freshness.test.ts` `spawnSync` + hermetic `CHECK_ROOT` idiom.
- [ ] `scripts/trace-render.ts` + `scripts/trace-render.test.ts` — **NEW**; covers MIGR-03 deterministic render (D-01, clone `context-io.ts render`).
- [ ] `scripts/<trace-freshness>.ts` + test + `freshness:traceability` package.json script — **NEW**; covers D-03 fail-closed (clone `now-running-freshness.ts`; `plans/`-rooted twin, NOT the committed-`.js` freshness kind).
- [ ] Move/invert `install.test.ts:299-308` (asserts `plans/handoffs/` IS seeded) + `validate-agent-factory.test.ts` fixture expectations (8 fixture dirs lose `handoffs/`).
- [ ] Extend `install/install.test.ts` migrate cases (`:568+`) with the 4 D-18/D-20 handoffs-backup cases (backup / idempotent / dry-run / collision-abort).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-15 adversarial RED reproduction vs committed `.js` | MIGR-01 | Green suite ≠ proof on a trace/safety surface ([[grugops-safety-invariant-green-suite-insufficient]]); an independent probe + code-review must reproduce the bypass | After the flip, run `node scripts/check-kit-refs.js` against a mirror with a planted `agent-factory/handoffs/` ref → assert exit 1; confirm a separate code-review of the SCAN input surface, not just the gate logic |
| `git revert` rollback documented for `--migrate` | MIGR-04 | Rollback is a documentation + out-of-band-backup guarantee | Confirm `install/README.md` documents: `.bak.<ISO>` dir + `git revert` = lossless rollback |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 NEW/inverted files above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
