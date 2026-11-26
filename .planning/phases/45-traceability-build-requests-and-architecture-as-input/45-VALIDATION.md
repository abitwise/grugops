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

### Planned per-task map (from the 45-NN-PLAN.md verify blocks)

| Task | Wave | Requirement | Test type | Automated command | File exists | Status |
|------|------|-------------|-----------|-------------------|-------------|--------|
| 45-01 T1 (tracer) | 1 | BR-01, BR-04 | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ file, new describe | ⬜ pending |
| 45-01 T2 | 1 | TRC-03 (D-02) | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts` | ✅ | ⬜ pending |
| 45-01 T3 | 1 | pins | unit + guards | `npx vitest run scripts/runnable-ref/runnable-exit-contract.test.ts scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/check-foundation-guards.test.ts` and `node scripts/check-foundation-guards.js` | ✅ | ⬜ pending |
| 45-02 T1 | 1 | ARCH-01, ARCH-02 | text gates | `npm run check:imperative-lexicon && … && npm run check:diff-disposition` and `npx vitest run scripts/checkpoints.test.ts scripts/floor-invariance.test.ts` | ✅ | ⬜ pending |
| 45-02 T2 | 1 | ARCH-01, ARCH-02 | text | `npx vitest run scripts/flow-guidance-text.test.ts -t "architecture as input"` and `node scripts/check-foundation-guards.js` | ✅ file, new describe | ⬜ pending |
| 45-03 T1 | 2 | BR-01, BR-03, BR-05 | checkpoint:decision | human answer recorded in 45-03-SUMMARY | — | ⬜ pending |
| 45-03 T2 | 2 | BR-01, BR-03, BR-05 | unit (TDD) | `npx vitest run scripts/build-request-model.test.ts` | ❌ W0 (created by this task) | ⬜ pending |
| 45-03 T3 | 2 | BR-06 | unit (TDD) | `npx vitest run scripts/build-request-model.test.ts` and `npm run freshness:runnable-embeds` | ❌ W0 | ⬜ pending |
| 45-04 T1 | 3 | BR-07 | unit + integration | `npx vitest run scripts/runnable-ref/state-check.test.ts scripts/validate.test.ts -t budget` | ✅ | ⬜ pending |
| 45-04 T2 | 3 | BR-01, BR-03 | unit + integration | `npx vitest run scripts/validate.test.ts scripts/runnable-ref/state-check.test.ts -t build-request` | ✅ | ⬜ pending |
| 45-05 T1 | 3 | BR-07 | integration | `npx vitest run install/install.test.ts install/migrate-v3-states.test.ts` | ✅ | ⬜ pending |
| 45-05 T2 | 3 | BR-02 | integration | `npx vitest run install/installer-cross-version.test.ts -t "build requests across versions"` | ✅ file; ❌ W0 fixture `install/fixtures/v3.0-blocked-board/` (created by this task) | ⬜ pending |
| 45-06 T1 | 4 | BR-06 | unit | `npx vitest run scripts/upstream-model.test.ts -t escalation` | ✅ | ⬜ pending |
| 45-06 T2 | 4 | TRC-01, TRC-03 | unit | `npx vitest run scripts/upstream-model.test.ts -t citation` | ✅ | ⬜ pending |
| 45-06 T3 | 4 | TRC-03, BR-05 | integration | `npx vitest run scripts/upstream-git.test.ts` | ❌ (created by this task) | ⬜ pending |
| 45-07 T1 | 5 | BR-03, BR-04, BR-06 | unit + integration | `npx vitest run scripts/build-request-model.test.ts` and `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ | ⬜ pending |
| 45-07 T2 | 5 | BR-05 | integration | `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests` | ✅ | ⬜ pending |
| 45-08 T1 | 5 | TRC-01 | unit + fixture | `npx vitest run scripts/validate.test.ts -t "upstream statement"` | ✅ | ⬜ pending |
| 45-08 T2 | 5 | TRC-03 | integration | `npx vitest run scripts/validate.test.ts -t citation` | ✅ | ⬜ pending |
| 45-09 T1 | 6 | BR-01, BR-03, BR-04, BR-07 | text gates | `npx vitest run scripts/check-imperative-lexicon.test.ts scripts/trace-instructions.test.ts scripts/generate-catalog.test.ts` | ✅ | ⬜ pending |
| 45-09 T2 | 6 | TRC-01, TRC-03, BR-02 | text gates | `npm run check:claim-anchors && npm run check:public-docs` | ✅ | ⬜ pending |
| 45-10 T1 | 7 | BR-03, BR-05, BR-06, ARCH-02 | text | `npx vitest run scripts/flow-guidance-text.test.ts -t "build requests in Workflow 20"` | ✅ file, new describe | ⬜ pending |
| 45-10 T2 | 7 | BR-06 | text | `npx vitest run scripts/config-governance-consistency.test.ts scripts/tier-kit-text.test.ts` | ✅ | ⬜ pending |
| 45-11 T1 | 8 | TRC-01, BR-06 | text gates | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts` | ✅ | ⬜ pending |
| 45-11 T2 | 8 | BR-02, BR-04 | text + full gate sweep | `npx vitest run scripts/flow-guidance-text.test.ts` and the guard and freshness chains | ✅ | ⬜ pending |

Sampling continuity: every task above has an automated command except the 45-03 decision checkpoint, which is followed directly by two TDD tasks; no three consecutive tasks lack an automated verify.

---

## Wave 0 Requirements

- [ ] `scripts/build-request-model.test.ts` — BR-01, BR-03, BR-05 (plan 45-03 Task 2, RED first)
- [ ] a small committed v3.0-shaped state fixture under `install/fixtures/` — BR-02 (`pre-v3-chess` is pre-v3, not v3.0, so it does not serve) (plan 45-05 Task 2: `install/fixtures/v3.0-blocked-board/`)
- [ ] BR file builders in a test-support module (no framework install needed) (plan 45-03 Task 2: `scripts/build-request-fixture.test-support.ts`)
- [ ] `scripts/upstream-git.test.ts` — TRC-03, BR-05 git facts (plan 45-06 Task 3, RED first)

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
