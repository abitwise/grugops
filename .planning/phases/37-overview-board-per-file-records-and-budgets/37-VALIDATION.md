---
phase: "37"
slug: "overview-board-per-file-records-and-budgets"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-21"
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (`globals: false`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run build && npx vitest run <changed test files>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (never bare `npm test`: it runs the live e2e lane) |
| **Estimated runtime** | quick ~30 seconds; full non-e2e ~30 minutes |

---

## Sampling Rate

- **After every task commit:** Run the quick command on the touched test files
- **After every plan wave:** Run the full non-e2e suite plus the freshness gates, `node scripts/check-state-paths.js`, `node scripts/check-foundation-guards.js`, and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`
- **Before `/gsd-verify-work`:** Full non-e2e suite green against the captured baseline of known failures
- **Max feedback latency:** 60 seconds for the quick command

---

## Per-Task Verification Map

Filled by the planner per task. Requirement → test map from 37-RESEARCH.md § Validation Architecture:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| SPLIT-01 | Board budget, row length, single `_Updated:` line; WARN without marker, ERROR with it | unit + spawn | `npx vitest run scripts/state-rules.test.ts scripts/validate.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-01 | Archived Done row keeps its ticket placed; duplicate and unreadable-archive cases | unit | `npx vitest run scripts/board-model.test.ts scripts/board-read.test.ts scripts/board-tracer.test.ts` | ✅ extend | ⬜ pending |
| SPLIT-02 | NFR index↔file integrity both directions | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-03 | Per-ticket trace render, skip counts, collision refusal, reproducible bytes | spawn | `npx vitest run scripts/runnable-ref/trace-render.test.ts scripts/trace-render.test.ts` | ❌ W0 / ✅ rewrite | ⬜ pending |
| SPLIT-03 | Trace directory freshness compare | spawn | `npx vitest run scripts/trace-freshness.test.ts` | ✅ rewrite | ⬜ pending |
| SPLIT-03 | No role/workflow/checklist/AGENTS.md append-to-traceability instruction; derived scan set counted | unit | `npx vitest run scripts/trace-instructions.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-04 | Every budget in `BUDGETS` checked by the validator; count asserted | unit | `npx vitest run scripts/validate.test.ts install/state-layout.test.ts` | ✅ extend | ⬜ pending |
| SPLIT-05 | Embedded regions equal fresh derivation; drift and non-builtin closure refused | unit + spawn | `npx vitest run scripts/generate-runnable-embeds.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-05 | `state-check.js` runs in a bare temp dir; exit codes 0/1/2 | spawn | `npx vitest run scripts/runnable-ref/state-check.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-05 | Install materializes runnables; uninstall removes them; marker only on `fresh` (GRUGOPS_HOME temp) | spawn | `npx vitest run install/install.test.ts install/record-truth.test.ts` | ✅ extend | ⬜ pending |
| SPLIT-06 | Roll moves rows/entries, conservation proven, forced mismatch restores bytes | spawn | `npx vitest run scripts/runnable-ref/state-roll.test.ts` | ❌ W0 | ⬜ pending |
| SPLIT-07 | Ticket key set stays eight; contract names body sections | unit | `npx vitest run scripts/board-model.test.ts` | ✅ existing pin | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/state-rules.test.ts` — budget, index-line, marker, progress-entry, Done-roll and conservation predicates
- [ ] `scripts/generate-runnable-embeds.test.ts` — derivation, non-builtin closure refusal, drift detection
- [ ] `scripts/runnable-ref/state-check.test.ts`, `trace-render.test.ts`, `state-roll.test.ts` — spawn and host-emulation cases
- [ ] `scripts/trace-instructions.test.ts` — derived scan set, zero append instructions
- [ ] Baseline capture of the known failing tests before the first plan

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PR gate and daily-sweep workflows call `state-check.js` on a real host | SPLIT-05 | Needs a live CI run on a host repo | Install into a scratch host repo (GRUGOPS_HOME temp), push a branch, confirm the workflow step runs `node tools/grugops/state-check.js` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
