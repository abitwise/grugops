---
phase: "45"
slug: "traceability-build-requests-and-architecture-as-input"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-26"
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `45-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run scripts/build-request-model.test.ts scripts/upstream-model.test.ts scripts/runnable-ref/upstream.test.ts scripts/state-rules.test.ts scripts/runnable-ref/state-check.test.ts install/state-layout.test.ts` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (compare by test name against the baseline) |
| **Estimated runtime** | quick ~40 s; full suite over 600 s |

---

## Sampling Rate

- **After every task commit:** quick run command plus `npx tsc --noEmit`
- **After every plan wave:** quick run, `npm run freshness`, `npm run freshness:runnable-embeds`, and the guard chain (`node scripts/check-foundation-guards.js`, `npm run check:audit-register`, `npm run check:imperative-lexicon`, `npm run check:banned-claims`, `npm run check:claim-anchors`, `npm run check:role-rules`, `npm run check:diff-disposition`, `npm run check:state-paths`, `node scripts/check-kit-refs.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/runnable-ref/state-check.js .`)
- **Before `/gsd-verify-work`:** full suite, compared by name with the baseline
- **Max feedback latency:** 60 seconds (quick run)

---

## Per-Task Verification Map

Filled by the planner per task; requirement-level map from research:

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| TRC-01 | refs or statement; contradiction; duplicate heading; fenced heading ignored; no `upstream` key → no git call, no finding | unit + fixture | `npx vitest run scripts/validate.test.ts -t "upstream statement"` | ✅ file, new cases | ⬜ pending |
| TRC-03 | decision table, every row; older-commit ref; superseded chain end; Done ticket silent; absent checkout UNKNOWN at exit 0 bare and `--strict`; superseding note clears an error | unit + integration | `npx vitest run scripts/upstream-model.test.ts -t citation` and `npx vitest run scripts/validate.test.ts -t citation` | ✅ files, new cases | ⬜ pending |
| TRC-03 | one launcher: adversarial git cases still pass after extraction | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts` | ✅ | ⬜ pending |
| BR-01, BR-03 | grammar: each refusal code; each legal and illegal transition; History/status agreement; exactly one recommended option | unit | `npx vitest run scripts/build-request-model.test.ts` | ❌ W0 | ⬜ pending |
| BR-03 | dedupe candidates listed for same source and overlapping IDs; kit text names the rule | integration + text | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ file | ⬜ pending |
| BR-02 | v3.0 tree under new validator and `state-check` unchanged; v3.0.0 `state-check.js` over a 3.1 tree unchanged; skew reported beside new siblings | integration | `npx vitest run install/installer-cross-version.test.ts` | ✅ file, new cases | ⬜ pending |
| BR-04 | carry list lines; BR folder and upstream tree digests unchanged | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ file | ⬜ pending |
| BR-05 | answered needs a human and a different pin; answer-candidate, pin-moved, not-descendant, shallow UNKNOWN | unit + integration | `npx vitest run scripts/build-request-model.test.ts scripts/runnable-ref/upstream.test.ts` | partly W0 | ⬜ pending |
| BR-06 | `escalation_days` parse (default, 0, 1.5, "10", negative); day boundary n = m and m + 1; carried date resets age | unit | `npx vitest run scripts/upstream-model.test.ts -t escalation` | ✅ file | ⬜ pending |
| BR-07 | planter in both tables; marker severity; hidden file and `.gitkeep` unmeasured; link/FIFO at folder and file | unit + integration | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/validate.test.ts -t budget` | ✅ files | ⬜ pending |
| BR-07 | seed `.gitkeep` on fresh, re-install and `--migrate` | integration | `npx vitest run install/install.test.ts install/migrate-v3-states.test.ts` | ✅ files | ⬜ pending |
| ARCH-01 | template value; WF00 step; pointer lines present; role ceilings | text + guards | `npx vitest run scripts/flow-guidance-text.test.ts` and `node scripts/check-foundation-guards.js` | ✅ | ⬜ pending |
| ARCH-02 | WF20 states the floor rule once, and no other kit file restates it | text | `npx vitest run scripts/flow-guidance-text.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/build-request-model.test.ts` — BR-01, BR-03, BR-05
- [ ] a small committed v3.0-shaped state fixture under `install/fixtures/` — BR-02 (`pre-v3-chess` is pre-v3, not v3.0, so it does not serve)
- [ ] BR file builders in a test-support module (no framework install needed)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A live Orchestrator follows the build-request and architecture-as-input procedure | ARCH-01, ARCH-02, BR-04, BR-05 | Agent behavior under a real host CLI cannot be asserted by a unit test | End-of-phase UAT: declare an upstream source, raise a build request, carry it, set a new pin, confirm the answer lands as a `claim` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
