---
phase: "36"
slug: "state-layout-authority-path-move-and-protection"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-20"
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (`globals: false`, import explicitly) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run <changed test files>` plus `npm run build && npm run typecheck` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (never `npm test`: it starts the live e2e lane) |
| **Estimated runtime** | quick ~30-120 s; full ~31 min |

---

## Sampling Rate

- **After every task commit:** the changed test files, plus `npm run build && npm run typecheck`
- **After every plan wave:** `npx vitest run install/` or `npx vitest run scripts/` (whichever the wave touched), plus the repo gates: `npm run freshness`, `node scripts/check-foundation-guards.js`, `node scripts/check-kit-refs.js`, `node scripts/check-claim-anchors.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `npm run freshness:adapters`
- **Before `/gsd-verify-work`:** full suite (excluding e2e) must be green, run once
- **Max feedback latency:** 120 seconds per task
- **Every scratch install sets `GRUGOPS_HOME`** to a scratch path

---

## Per-Task Verification Map

Filled by the planner per task. Requirement → test map from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| LAYOUT-01 | Fresh install seeds the whole set under `memory-bank/plans/`; nothing under `plans/` | integration (scratch, `GRUGOPS_HOME`) | `npx vitest run install/install.test.ts -t "two-root"` | ✅ edit | ⬜ pending |
| LAYOUT-01 | Kit, docs and tooling name new paths | gate | `node scripts/check-state-paths.js` | ❌ W0 | ⬜ pending |
| LAYOUT-02 | Only `state-layout.ts` spells state paths; gate fails on a planted site per spelling; allow-list entries are live | unit + mutation | `npx vitest run scripts/check-state-paths.test.ts` | ❌ W0 | ⬜ pending |
| LAYOUT-02 | Readers, validator, trace tools import the authority | unit | `npx vitest run scripts/board-read.test.ts scripts/validate.test.ts scripts/trace-freshness.test.ts scripts/trace-render.test.ts` | ✅ edit | ⬜ pending |
| LAYOUT-03 | Prune and uninstall refuse every protected root incl. `memory-bank/`; one list | integration + structural | `npx vitest run install/installer-prune.test.ts install/uninstall-removal.test.ts` | ✅ add cases | ⬜ pending |
| LAYOUT-04 | Plain install on old layout: exit 1, stderr names `--migrate`, target byte-identical | integration | new case (install/state-layout test) | ❌ | ⬜ pending |
| LAYOUT-04 | `--migrate` on old target does not seed `memory-bank/plans/board.md`; "both" proceeds with one note; `--check` WARNs | integration | same file | ❌ | ⬜ pending |
| LAYOUT-04 | Fallback clause carried verbatim by INVARIANT, AGENTS.md and the kit-home orchestrator | unit | new case (e.g. `scripts/kit-model.test.ts`) | ❌ | ⬜ pending |
| LAYOUT-05 | Repo state at `memory-bank/plans/`; validator passes | gate | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && test ! -e plans` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `install/state-layout.ts` + compiled `.js`; `install/path-spelling-census.test.ts` re-pin 9 → 10
- [ ] Named pre-v3 (old-layout) fixture builder in `install/installer-paths.test-support.ts`, built at run time from the legacy board constant
- [ ] `scripts/check-state-paths.ts` + `.test.ts` (wired last, D-13)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real old-layout repo keeps working after `--update` (role prints the migrate notice) | LAYOUT-04 | Needs a live host-agent session reading the kit-home Orchestrator | In a scratch repo on the old layout with `GRUGOPS_HOME` set, run `--update`, start `/grugops`, confirm it reads `plans/` and prints the one-line `install --migrate` notice |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
