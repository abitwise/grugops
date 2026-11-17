---
phase: "43"
slug: "story-and-layered-docs"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-17"
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (`fileParallelism: false`, `maxWorkers` 1) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run <file(s)>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` |
| **Estimated runtime** | more than 600 seconds for the full suite; compare by test name against the baseline |

Gate commands (each runs `tsc --outDir .tmp-build` first): `npm run freshness:catalog`, `npm run check:claim-anchors`, `npm run check:audit-register`, `npm run check:public-docs`, `npm run check:banned-claims`, `npm run freshness:guarantees`, `npm run freshness:skill-twins`, and `npm run freshness && npm run check:build-parity` after any `.ts` change.

Baseline measured during research: `check-claim-anchors`, `check-public-docs-vocabulary`, `check-banned-claims`, `check-audit-register` and `catalog-freshness` exit 0. `check-flip-manifest` exits 1 before this phase starts (its manifest moved to the milestones archive). `check-diff-disposition` has 721 open findings before this phase starts.

---

## Sampling Rate

- **After every task commit:** the quick test files for the task plus the gates it touches
- **After every plan wave:** all gate commands above plus `npm run freshness && npm run check:build-parity`
- **Before `/gsd-verify-work`:** the full suite compared by test name against the baseline taken before plan 1, and every CI gate against its baseline exit code
- **Max feedback latency:** about 120 seconds for a task's quick files and gates

---

## Per-Task Verification Map

Filled in by the planner from the plans. Requirement-to-command map from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| STORY-01 | README opens with the tagline; no "simple software factory" | unit (text) | `npx vitest run scripts/check-story-docs.test.ts` | ❌ W0 | ⬜ pending |
| STORY-01 | Moved and new claims verbatim at anchors | gate | `npm run check:claim-anchors && npm run check:audit-register` | ✅ | ⬜ pending |
| STORY-02 | Docs index links to every reference page | unit | `npx vitest run scripts/generate-catalog.test.ts` | ✅ (extend) | ⬜ pending |
| STORY-02 | Examples free of hand-trace shapes | unit | `npx vitest run scripts/trace-instructions.test.ts` | ✅ (extend scan set) | ⬜ pending |
| STORY-02 | Start table and host prose bound to the registry | unit | `npx vitest run install/host-entry-docs.test.ts install/host-tools-prose.test.ts` | ✅ (re-target) | ⬜ pending |
| STORY-03 | Page per role and skill; missing, extra or stale is red | gate + unit | `npm run freshness:catalog && npx vitest run scripts/catalog-freshness.test.ts` | ✅ (rewrite) | ⬜ pending |
| STORY-04 | New pages in the corpus before written; pins moved | gate | `npm run check:public-docs && npm run check:banned-claims` | ✅ | ⬜ pending |
| STORY-04 | Retired rows kept by id; text absent | gate + unit | `npm run check:claim-anchors && npx vitest run scripts/check-claim-anchors.test.ts scripts/audit-model.test.ts` | ✅ (extend) | ⬜ pending |
| STORY-05 | GAP-D1 sentence wherever "parallel"; `CLAUDE.md` names no `/grug`; no dead shipped links | gate + unit | `npm run check:story-docs && npx vitest run scripts/check-story-docs.test.ts` | ❌ W0 | ⬜ pending |
| STORY-05 | No cost or token claims | gate | `npm run check:banned-claims` | ✅ | ⬜ pending |
| STORY-05 | `CLAUDE.md` line-83 citation intact | unit | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ | ⬜ pending |
| D-11 | Docs ship to the kit home; record, prune and update | integration | `npx vitest run install/installer-kit-home.test.ts install/installer-prune.test.ts install/installer-fs-census.test.ts install/ledger.test.ts install/installer-dry-run.test.ts` | ✅ (re-pin) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-story-docs.ts` + `scripts/check-story-docs.test.ts` (GAP-D1 sentence, `/grug` in `CLAUDE.md`, dead links in shipped docs), plus the `package.json` script and the ci.yml step
- [ ] Shipped-docs derivation (`install/kit-source.ts` export) + unit test
- [ ] Retired-claim status (after the open-question-1 decision) + tests in `scripts/check-claim-anchors.test.ts` and `scripts/audit-model.test.ts`
- [ ] Baseline capture of every CI gate and the full suite by test name, before plan 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Unscored work is never auto-delegated to a junior, mid or senior engineer adapter; each level is reached only when the Tech Lead's plan names it | SC-6 (Phase 39 UAT test 10) | Needs a live Claude Code host; headless `claude -p` may not show spawns | Run on a live Claude Code host in a scratch repo; record evidence in the phase directory; human signs off with a typed name |
| A `grugops-designer` design note reaches `scripts/context-io.js` through Bash and is admitted, not refused as unsealed | SC-6 (Phase 39 UAT test 14) | Needs a live Claude Code host | Same scratch repo; record the admission outcome; human signs off with a typed name |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
