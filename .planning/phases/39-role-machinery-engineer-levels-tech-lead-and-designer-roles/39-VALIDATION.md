---
phase: "39"
slug: "role-machinery-engineer-levels-tech-lead-and-designer-roles"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-29"
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 |
| **Config file** | `vitest.config.ts` (`fileParallelism: false`) |
| **Quick run command** | `npm run build && npx vitest run scripts/<file>.test.ts` (many tests spawn committed `.js`; rebuild first) |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Gates** | `node scripts/check-foundation-guards.js`, `node scripts/validate-agent-factory.js`, `npm run freshness:adapters`, `npm run freshness:catalog`, `npm run freshness:hook-manifest`, `node scripts/check-imperative-lexicon.js`, `node scripts/check-banned-claims.js`, `node scripts/check-audit-register.js`, `node scripts/check-kit-refs.js`, `npm run check:build-parity`, `npm run typecheck` |
| **Estimated runtime** | ~300 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** the quick command for the touched file + `node scripts/check-foundation-guards.js`
- **After every plan wave:** full suite + all gates above
- **Before `/gsd-verify-work`:** full suite green; every gate green except the two pre-existing reds (`check-diff-disposition` at its pre-phase count, `check-flip-manifest`), recorded, never marked passing
- **Max feedback latency:** ~60 seconds per task quick run

---

## Per-Task Verification Map

Filled by the planner per task; the requirement → test map from RESEARCH.md is the seed.

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| TIER-01 | tech-lead.md has required sections, ceiling, register row, one WF16 ref; rubric checklist governed and indexed | guard + unit | `node scripts/validate-agent-factory.js && node scripts/check-foundation-guards.js && npx vitest run scripts/admission-protocol-docs.test.ts` | ✅ (C3 derived first) | ✅ green |
| TIER-02 | 21 adapters; three level adapters with D-14 model/effort; grant = 20 names; per-level and role overrides; preset none keeps pins | unit + gate | `npx vitest run scripts/model-tiers.test.ts scripts/generate-role-adapters.test.ts scripts/kit-model.test.ts && npm run freshness:adapters` | ✅ (created) | ✅ green |
| TIER-02 | MODEL-01 re-pinned, effort lines exactly on levels | unit | `npx vitest run scripts/adapter-byte-baseline.test.ts` | ✅ (rewrite) | ✅ green |
| TIER-03 | rubric F3 lists the four exclusions; `## Levels` text; D-2 record present | text assertion | `npx vitest run scripts/<new tier-text>.test.ts` | ✅ (created) | ✅ green |
| TIER-04 | WF04 escalation names `failed-attempt`, `Blocked`, new pending task, no `model` parameter; stop counts | text + count | `npx vitest run scripts/checkpoints.test.ts` | ✅ | ✅ green |
| TIER-05 | designer.md sections; WF14 order; frontend-ui reads tokens | guard + text | `node scripts/check-foundation-guards.js` | ✅ (created) | ✅ green |
| TIER-06 | KIT-03 over derived names; ceiling table two-sided; counts | guard + unit | `npx vitest run scripts/check-foundation-guards.test.ts` | ✅ (extend) | ✅ green |
| TIER-07 | role files admitted under ROLE_SCHEMA; `skills` fixture admitted; adapter with `skills:` refused; flow and `:` refused | unit | `npx vitest run scripts/canonical-frontmatter.test.ts` | ✅ (created) | ✅ green |
| RSI | installed target keeps no unreported stale base adapter | integration | `npx vitest run install/install.test.ts` | ✅ (created) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Per-task map (planner, 2026-10-29)

| Task | Req | Automated command | Status |
|------|-----|-------------------|--------|
| 39-01 T1 (tracer) | TIER-02, TIER-06 | `npm run build && npm run typecheck && npx vitest run scripts/kit-model.test.ts scripts/model-tiers.test.ts scripts/board-readonly.test.ts` | ✅ |
| 39-01 T2 | TIER-02 | `npx vitest run scripts/kit-model.test.ts scripts/model-tiers.test.ts` (refusals, precedence matrix) | ✅ |
| 39-01 T3 | TIER-06 | `npx vitest run scripts/model-tiers.test.ts && node scripts/check-foundation-guards.js` | ✅ |
| 39-02 T1 (tracer) | TIER-02, TIER-06 | `npm run generate:adapters && git diff --quiet HEAD -- .claude/agents && npx vitest run scripts/generate-role-adapters.test.ts scripts/adapters-freshness.test.ts` | ✅ |
| 39-02 T2 | TIER-06 | `npx vitest run scripts/check-foundation-guards.test.ts scripts/generate-role-adapters.test.ts scripts/adapters-freshness.test.ts` (RED plants) | ✅ |
| 39-03 T1 (tracer) | TIER-06 | `npx vitest run scripts/check-foundation-guards.test.ts -t "ceiling" && npx vitest run scripts/admission-protocol-docs.test.ts` | ✅ |
| 39-03 T2 | TIER-06 | `npx vitest run install/install.test.ts` + the five script test files | ✅ |
| 39-03 T3 | TIER-06 | `npx vitest run scripts/adapter-byte-baseline.test.ts` (re-pin) | ✅ |
| 39-04 T1 (tracer) | TIER-07 | `npx vitest run scripts/canonical-frontmatter.test.ts && node scripts/check-foundation-guards.js` | ✅ |
| 39-04 T2 | TIER-07 | `npx vitest run scripts/canonical-frontmatter.test.ts scripts/check-foundation-guards.test.ts scripts/generate-role-adapters.test.ts` | ✅ |
| 39-05 T1 (tracer) | TIER-01, TIER-03, TIER-06 | `npx vitest run scripts/tier-kit-text.test.ts ...` + all structure/lexicon/register gates + disposition count 721 | ✅ |
| 39-06 T1 (tracer) | TIER-05, TIER-06 | same gate set as 39-05 T1, plus `scripts/generate-catalog.test.ts` | ✅ |
| 39-07 T1 (tracer) | TIER-02, TIER-03, TIER-06 | `npx vitest run scripts/adapter-byte-baseline.test.ts scripts/tier-kit-text.test.ts ...` + freshness gates + human-check (live effort) | ✅ |
| 39-07 T2 | TIER-03 | `npx vitest run scripts/tier-kit-text.test.ts scripts/model-tiers.test.ts` | ✅ |
| 39-08 T1 (tracer) | TIER-01 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts` | ✅ |
| 39-08 T2 | TIER-04 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts && npm run freshness:guarantees` | ✅ |
| 39-09 T1 (tracer) | TIER-05 | `npx vitest run scripts/tier-kit-text.test.ts` + gates | ✅ |
| 39-09 T2 | TIER-05 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts` | ✅ |
| 39-10 T1 (tracer) | TIER-06 (RSI) | `npx vitest run install/install.test.ts -t "no longer ships"` | ✅ |
| 39-10 T2 | TIER-03 | `npx vitest run install/install.test.ts -t "no longer ships" && npx vitest run scripts/tier-kit-text.test.ts` | ✅ |
| 39-11 T1 (tracer, gap) | TIER-05 | `npx vitest run scripts/tier-kit-text.test.ts scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts scripts/kit-model.test.ts` + foundation/structure/register gates + disposition count 721 | ✅ |
| 39-11 T2 (gap) | TIER-02 | `npx vitest run scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/tier-kit-text.test.ts scripts/model-tiers.test.ts scripts/kit-model.test.ts` + freshness gates | ✅ |
| 39-11 T3 (gap) | TIER-05 | `npx vitest run scripts/tier-kit-text.test.ts` + gates | ✅ |
| 39-12 T1 (tracer, gap) | TIER-04 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts` + lexicon/claims/kit-ref gates + disposition count 721 | ✅ |
| 39-12 T2 (gap) | TIER-01 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts` + gates | ✅ |
| 39-12 T3 (gap) | TIER-01, TIER-03 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts` + gates + disposition count 721 | ✅ |
| 39-13 T1 (tracer, gap) | TIER-06 | `npx vitest run install/install.test.ts -t "no longer ships" && npx vitest run install/agents-record.test.ts install/installer-dry-run.test.ts install/installer-special-files.test.ts scripts/tier-kit-text.test.ts` + build-parity gate | ✅ |
| 39-13 T2 (gap) | TIER-02, TIER-03 | `npx vitest run scripts/tier-kit-text.test.ts scripts/model-dial-consistency.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts` + public-docs/claim-anchor gates | ✅ |
| 39-13 T3 (gap) | TIER-02, TIER-03 | phase gate: full non-e2e suite against the recorded baseline (20 known reds in deferred-items.md) + disposition count 721 | ✅ |
| 39-14 T1 (tracer, gap 2) | TIER-02, TIER-06 | `npx vitest run scripts/model-tiers.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts` + freshness/build-parity/foundation gates | ✅ |
| 39-14 T2 (gap 2) | TIER-02 | `npx vitest run scripts/generate-role-adapters.test.ts install/install.test.ts scripts/check-foundation-guards.test.ts` | ✅ |
| 39-14 T3 (gap 2) | TIER-03 | grep record checks (PROJECT, REQUIREMENTS, ROADMAP, CONTEXT D-14 amended) | ✅ |
| 39-15 T1 (tracer, gap 2) | TIER-02, TIER-03 | `npx vitest run scripts/tier-kit-text.test.ts scripts/model-dial-consistency.test.ts scripts/check-public-docs-vocabulary.test.ts` + public-docs/claim-anchor gates | ✅ |
| 39-15 T2 (gap 2) | TIER-02 | `npx vitest run scripts/model-dial-consistency.test.ts -t "G-39-6"` + config-governance + disposition count 721 | ✅ |
| 39-16 T1 (tracer, gap 2) | TIER-04 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts` + language gates + disposition count 721 | ✅ |
| 39-16 T2 (gap 2) | TIER-04 | phase gate: every repo gate + full non-e2e suite against the recorded baseline | ✅ |
| 39-17 T1 (tracer, gap 3) | TIER-04 | `npx vitest run scripts/tier-kit-text.test.ts -t "CR-01, 39-17"` + WF04 text/checkpoint suites + language gates + disposition count 721 | ✅ |
| 39-17 T2 (gap 3) | TIER-02 | `npx vitest run scripts/model-dial-consistency.test.ts -t "WR-02"` (cases derived from `LEVELS`) + config-governance/model-tiers suites | ✅ |
| 39-18 T1 (gap 3) | TIER-04 | human decision checkpoint (park-in-blocked, Olger Oeselg, 2026-10-30) — recorded, not automated | ✅ |
| 39-18 T2 (tracer, gap 3) | TIER-04 | `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts` (WR-01 one-outcome cases) + language gates + disposition count 721 | ✅ |
| 39-18 T3 (gap 3) | TIER-04 | phase gate: every repo gate + full non-e2e suite against the recorded baseline (21 known reds) | ✅ |

The `scripts/<new tier-text>.test.ts` row above is `scripts/tier-kit-text.test.ts`, created by 39-05 T1 and extended by 39-06..39-10.

---

## Wave 0 Requirements

- [x] RED cases first: KIT-03 with a `levels:` role (a missing level adapter, a leftover base adapter, a hand-added grant name each red)
- [x] `ROLE_CEILINGS` two-sided case (stale key red, missing key red)
- [x] `listAgentAdapterNames` refusals (dup key, empty, dup token, collision)
- [x] precedence matrix for level resolution (none / tiered / role override / level override / effort)
- [x] canonical ROLE_SCHEMA / ADAPTER_SCHEMA cases + `skills` fixture
- [x] derive `ROLE_BASENAMES` in `admission-protocol-docs.test.ts`
- [x] stale-adapter install probe

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A level adapter's `effort` is honored by a live Claude Code session (v2.1.293 floor) | TIER-02, TIER-03 | needs a live host run; no automated host in CI | Install into a scratch repo on Claude Code ≥ 2.1.293, spawn each level adapter, record the observed model/effort or mark `UNKNOWN - verify` |
| Tech Lead dispatch and escalation text (WF04 steps 2–4, 14–16, four new stop bullets) reads clearly | TIER-01, TIER-04 | reader judgment | Read agent-factory/workflows/04-ticket-to-pr.md; confirm a first-time reader can follow score → plan → named level → escalation |
| WF14 Designer step 1 and missing-token stop read clearly | TIER-05 | reader judgment | Read agent-factory/workflows/14-ui-design-to-build.md step 1 and the missing-token stop bullet |
| install/README.md level + retired-adapter wording reads clearly to an upgrading user; `agent.spawn` flattening claim matches current sub-agents docs | TIER-03, TIER-06 | reader judgment + external doc not re-read by executor | Read install/README.md level sections; re-check code.claude.com/docs/en/sub-agents for the `agent.spawn` claim |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s per task
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-30 (validate-phase; 13 mapped test files 1735 passed, 12 gates exit 0, disposition 721)

## Validation Audit 2026-10-30

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
