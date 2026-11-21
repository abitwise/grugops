---
phase: "43"
slug: "story-and-layered-docs"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| STORY-01 | README opens with the tagline; no "simple software factory" | unit (text) | `npx vitest run scripts/check-story-docs.test.ts` | ✅ | ✅ green |
| STORY-01 | Moved and new claims verbatim at anchors | gate | `npm run check:claim-anchors && npm run check:audit-register` | ✅ | ✅ green |
| STORY-02 | Docs index links to every reference page | unit | `npx vitest run scripts/generate-catalog.test.ts` | ✅ (extend) | ✅ green |
| STORY-02 | Examples free of hand-trace shapes | unit | `npx vitest run scripts/trace-instructions.test.ts` | ✅ (extend scan set) | ✅ green |
| STORY-02 | Start table and host prose bound to the registry | unit | `npx vitest run install/host-entry-docs.test.ts install/host-tools-prose.test.ts` | ✅ (re-target) | ✅ green |
| STORY-03 | Page per role and skill; missing, extra or stale is red | gate + unit | `npm run freshness:catalog && npx vitest run scripts/catalog-freshness.test.ts` | ✅ (rewrite) | ✅ green |
| STORY-04 | New pages in the corpus before written; pins moved | gate | `npm run check:public-docs && npm run check:banned-claims` | ✅ | ✅ green |
| STORY-04 | Retired rows kept by id; text absent | gate + unit | `npm run check:claim-anchors && npx vitest run scripts/check-claim-anchors.test.ts scripts/audit-model.test.ts` | ✅ (extend) | ✅ green |
| STORY-05 | GAP-D1 sentence wherever "parallel"; `CLAUDE.md` names no `/grug`; no dead shipped links | gate + unit | `npm run check:story-docs && npx vitest run scripts/check-story-docs.test.ts` | ✅ | ✅ green |
| STORY-05 | No cost or token claims | gate | `npm run check:banned-claims` | ✅ | ✅ green |
| STORY-05 | `CLAUDE.md` line-83 citation intact | unit | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ | ✅ green |
| D-11 | Docs ship to the kit home; record, prune and update | integration | `npx vitest run install/installer-kit-home.test.ts install/installer-prune.test.ts install/installer-fs-census.test.ts install/ledger.test.ts install/installer-dry-run.test.ts` | ✅ (re-pin) | ✅ green (one installer-fs-census case fails on Node v26 `openAsBlobSync`; a 43-BASELINE.md failure that predates the phase) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Per-task map (from the plans, 2026-11-17; revised at plan revision 1, same day)

Plans in wave order. Plan revision 1 split 43-04 (role-page content and the levels section moved to 43-14) and 43-06 (the remaining
installer arms and the install guide moved to 43-15). Every plan that adds a `scripts/` module or import edge (02, 03, 04, 05, 11, 14)
runs `npx vitest run scripts/check-foundation-guards.test.ts` whole, compares failing names with 43-BASELINE.md and owns the pins it
moves; 43-06 runs it as detection only; 43-12 owns late pin moves.

**Same-wave plans share one working tree (plan revision 2).** Parallelization is on and worktrees are off, so the plans of waves 1, 3, 4
and 5 edit and run the same gates in one checkout at the same time. Each of those plans states, in its `<context>`, who in its wave writes
which shared gate state and this rule: a gate or test that goes red naming only paths in another same-wave plan's `files_modified` (its
new or deleted pages, a scan pin it is moving, its `.ts`/`.js` pair under `npm run freshness` or `npm run check:build-parity`, or a build
error in its `.ts`) is re-run after that plan's next commit; a red that names a path of the plan's own, or one still red once the other
plan's SUMMARY exists, is the plan's own failure. Each re-run is listed in the SUMMARY. Wave 1 also has a start order: 43-01 commits
43-BASELINE.md before any phase-43 edit, and 43-02 starts its edits on that commit, so the baseline measures the base commit.

| Wave | Plans | Writes the scan pins and adds or deletes shipped pages | Other shared state |
|------|-------|--------------------------------------------------------|--------------------|
| 1 | 43-01, 43-02 | 43-02 | 43-01: the claim registry, audit-model.ts, check-claim-anchors.ts, and 43-BASELINE.md first |
| 3 | 43-04, 43-06, 43-07, 43-08 | 43-04 (red on purpose between writing pages and moving pins) | 43-06: install/*.ts; 43-07, 43-08: examples only |
| 4 | 43-05, 43-15 | 43-05 (red on purpose between writing pages and moving pins) | 43-15: install/install.ts, install/README.md |
| 5 | 43-09, 43-14 | 43-09 (also CLAIM_KIND_CARDINALITY) | 43-14: the generator, the gate and the regenerated role pages |

**LIVE-3 set unchanged by generated pages (plan revision 2).** install/host-entry-docs.test.ts LIVE-3 pins its derived per-host launch
tables at CLAUDE.md, README.md and agent-factory/packaging/adapters.md until 43-10 retargets README.md to docs/usage.md. The generated
skill pages (43-05) and role pages (43-14) name each host in plain text in a row's first cell, never bold, so neither joins that set; each
plan runs that test file and checks with `git grep` that no row under docs/reference opens with a bold cell.

| Wave | Plan | Task | Requirement | Automated command (first verify line) | Status |
|------|------|------|-------------|----------------------------------------|--------|
| 1 | 43-01 | 1 tracer | STORY-04 | `npm run build && npx vitest run scripts/check-claim-anchors.test.ts scripts/audit-model.test.ts` | ✅ |
| 1 | 43-01 | 2 | STORY-04 | same files plus `scripts/check-audit-register.test.ts scripts/generate-guarantees.test.ts` | ✅ |
| 1 | 43-01 | 3 | STORY-04 | `node scripts/check-claim-anchors.js && node scripts/check-audit-register.js && npx vitest run scripts/audit-model.test.ts` | ✅ |
| 1 | 43-02 | 1 tracer | STORY-04 | `npx vitest run scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts`; guards file vs its own pre-edit run | ✅ |
| 1 | 43-02 | 2 | STORY-04 | `npx vitest run install/installer-kit-home.test.ts scripts/check-public-docs-vocabulary.test.ts scripts/check-banned-claims.test.ts` | ✅ |
| 2 | 43-03 | 1 tracer | STORY-05 | `npx vitest run scripts/check-story-docs.test.ts scripts/model-dial-consistency.test.ts install/host-entry-docs.test.ts …` | ✅ |
| 2 | 43-03 | 2 | STORY-05 | `npx vitest run scripts/check-story-docs.test.ts install/message-references.test.ts …` | ✅ |
| 2 | 43-03 | 3 | STORY-05, STORY-02 | `npx vitest run scripts/check-story-docs.test.ts scripts/skills-kit-text.test.ts scripts/check-claim-anchors.test.ts scripts/frontmatter.test.ts`; guards file whole | ✅ |
| 3 | 43-04 | 1 tracer | STORY-03 | `npm run generate:catalog`, then `git status --porcelain --untracked-files=all -- docs/reference` empty, then `npx vitest run scripts/catalog-freshness.test.ts scripts/generate-catalog.test.ts`; guards file whole | ✅ |
| 3 | 43-04 | 2 | STORY-03 | `npx vitest run scripts/catalog-freshness.test.ts scripts/generate-catalog.test.ts scripts/kit-model.test.ts scripts/frontmatter.test.ts …`; guards file whole | ✅ |
| 3 | 43-06 | 1 tracer | STORY-02 (D-11, D-27) | `npx vitest run install/installer-kit-home.test.ts install/ledger.test.ts` | ✅ |
| 3 | 43-06 | 2 | STORY-02 | `npx vitest run install/installer-fs-census.test.ts install/installer-cross-version.test.ts install/marker-binding.test.ts …`; guards file whole (detection) | ✅ |
| 3 | 43-07 | 1-3 | STORY-02 | the ad hoc four-pattern hand-trace scan over examples/01-03 plus `check:story-docs` and the corpus gates | ✅ |
| 3 | 43-08 | 1-2 | STORY-02, STORY-05 | the ad hoc four-pattern hand-trace scan over examples/04-05 plus the corpus gates | ✅ |
| 4 | 43-05 | 1 tracer | STORY-03 | `npm run generate:catalog`, porcelain check over docs/reference, `npx vitest run scripts/catalog-freshness.test.ts scripts/generate-catalog.test.ts`; guards file whole | ✅ |
| 4 | 43-05 | 2 | STORY-03 | `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts install/host-entry-docs.test.ts install/host-tools-prose.test.ts`; guards file whole | ✅ |
| 4 | 43-15 | 1 tracer | STORY-02 (D-11) | `npx vitest run install/installer-kit-home.test.ts install/installer-dry-run.test.ts install/installer-prune.test.ts install/ledger.test.ts` | ✅ |
| 4 | 43-15 | 2 | STORY-02 | `npx vitest run install/message-references.test.ts install/installer-cross-version.test.ts …` | ✅ |
| 5 | 43-14 | 1 tracer | STORY-03 | `npx vitest run scripts/generate-catalog.test.ts scripts/catalog-freshness.test.ts install/host-entry-docs.test.ts install/host-tools-prose.test.ts …`; guards file whole | ✅ |
| 5 | 43-14 | 2 | STORY-03 (D-13) | `npx vitest run scripts/generate-catalog.test.ts scripts/model-dial-consistency.test.ts scripts/catalog-freshness.test.ts`; guards file whole | ✅ |
| 5 | 43-09 | 1-3 | STORY-02, STORY-04 | `node scripts/check-claim-anchors.js && node scripts/check-audit-register.js && … && npm run check:story-docs` | ✅ |
| 6 | 43-10 | 1-3 | STORY-02, STORY-04 | `npx vitest run install/host-entry-docs.test.ts install/host-tools.test.ts scripts/check-uat-oracles.test.ts …` and the job-section check | ✅ |
| 7 | 43-11 | 1-3 | STORY-01, STORY-04 | the claim gates, `npm run freshness:guarantees`, `npx vitest run scripts/check-story-docs.test.ts …`; the retired-commit live case; guards file whole (Task 3) | ✅ |
| 8 | 43-12 | 1-3 | STORY-05 | `npx vitest run scripts/trace-instructions.test.ts`; the reader review; the phase gate against 43-BASELINE.md, with late guard pin moves | ✅ |
| 9 | 43-13 | 1-3 | SC-6 | evidence files exist and carry no home path; the human decides by typed name (manual) | ✅ manual: accepted 2026-11-18 (43-UAT.md) |

---

## Wave 0 Requirements

- [x] `scripts/check-story-docs.ts` + `scripts/check-story-docs.test.ts` (GAP-D1 sentence, `/grug` in `CLAUDE.md`, dead links in shipped docs), plus the `package.json` script and the ci.yml step
- [x] Shipped-docs derivation (`install/kit-source.ts` export) + unit test
- [x] Retired-claim status (open question 1, resolved by D-25) + tests in `scripts/check-claim-anchors.test.ts` and `scripts/audit-model.test.ts`
- [x] Baseline capture of every CI gate and the full suite by test name, before plan 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Unscored work is never auto-delegated to a junior, mid or senior engineer adapter; each level is reached only when the Tech Lead's plan names it | SC-6 (Phase 39 UAT test 10) | Needs a live Claude Code host; headless `claude -p` may not show spawns | Run on a live Claude Code host in a scratch repo; record evidence in the phase directory; human signs off with a typed name. Done: accepted 2026-11-18, see 43-UAT.md `## Human decision` (name added at the human's instruction, not typed) |
| A `grugops-designer` design note reaches `scripts/context-io.js` through Bash and is admitted, not refused as unsealed | SC-6 (Phase 39 UAT test 14) | Needs a live Claude Code host | Same scratch repo; record the admission outcome; human signs off with a typed name. Done: accepted 2026-11-18 with the route reworded to `tools/grugops/note.js`, see 43-UAT.md |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-18 by /gsd-validate-phase 43 (state A audit). Requirement commands re-run on HEAD bad96ba4: the eight gate commands exit 0; the requirement test files pass in the wave 9 full run (12031 tests, 21 failures, all in 43-BASELINE.md, 0 new). 43-13 (SC-6) is manual and human-accepted.

## Validation Audit 2026-11-18

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
