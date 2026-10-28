---
phase: "38"
slug: "install-migrate-v3"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-28"
---

# Phase 38 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ~4.1.8 (`globals: false`) |
| **Config file** | `vitest.config.ts`, `tsconfig.tests.json` |
| **Quick run command** | `npm run build && npx vitest run install/state-migrate.test.ts` (plus the touched test files) |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` plus `npx tsc --noEmit`, `npm run freshness:runnable-embeds`, `npm run check:state-paths` (never bare `npm test`: it runs the live e2e lane) |
| **Estimated runtime** | quick ~30 seconds; full non-e2e ~30 minutes |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the touched file plus `npx tsc --noEmit`
- **After every plan wave:** Run the full suite plus the freshness and state-path gates
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds (quick command)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 38-01-T3 | 38-01 | 1 | MIGRATE-05, MIGRATE-07 | T-38-01, T-38-02 | frozen real-shaped fixture; the copy is only read | integration | `npx vitest run install/migrate-v3.test.ts -t "F1\|F2"` | ❌ W0 (created here) | ⬜ pending |
| 38-02-T1 | 38-02 | 2 | MIGRATE-05 | T-38-03 | every trailer byte verbatim under `## Board notes` | unit | `npx vitest run install/state-migrate.test.ts -t "trailer"` | ❌ W0 (created here) | ⬜ pending |
| 38-02-T2 | 38-02 | 2 | MIGRATE-03 | T-38-04, T-38-05 | stage-A proof fails on every mutation | unit | `npx vitest run install/state-migrate.test.ts -t "proof"` | ❌ | ⬜ pending |
| 38-03-T1 | 38-03 | 3 | MIGRATE-01, MIGRATE-02, MIGRATE-04 | T-38-06, T-38-07, T-38-08 | migrate end to end; every original at its home; marker last; second run byte-identical | integration | `npx vitest run install/migrate-v3.test.ts -t "M1\|M2\|M3\|M4"` | ❌ | ⬜ pending |
| 38-03-T2 | 38-03 | 3 | MIGRATE-02 | — | pre-v3 entry points describe the state move | integration | `npx vitest run install/pre-v3-layout.test.ts` | ✅ | ⬜ pending |
| 38-04-T1 | 38-04 | 4 | MIGRATE-02 | T-38-09 | NFR files and index accepted by state-check; trace original archived | integration | `npx vitest run install/migrate-v3.test.ts -t "M5"` | ❌ | ⬜ pending |
| 38-04-T2 | 38-04 | 4 | MIGRATE-03 | T-38-09, T-38-10 | catalog residue verbatim; proof catches misplacement | unit | `npx vitest run install/state-migrate.test.ts -t "NFR"` | ❌ | ⬜ pending |
| 38-05-T1 | 38-05 | 5 | MIGRATE-03 | T-38-11 | Done roll equals state-roll.js | unit + integration | `npx vitest run install/state-migrate.test.ts -t "parity"` | ❌ | ⬜ pending |
| 38-05-T2 | 38-05 | 5 | MIGRATE-02, MIGRATE-03 | T-38-11, T-38-12 | progress original archived; roll proof failures | unit + integration | `npx vitest run install/state-migrate.test.ts -t "progress"` | ❌ | ⬜ pending |
| 38-06-T1 | 38-06 | 6 | MIGRATE-03 | T-38-13 | kit-source render before the marker; failed render undoes | integration | `npx vitest run install/migrate-v3.test.ts -t "M8\|M9"` | ❌ | ⬜ pending |
| 38-06-T2 | 38-06 | 6 | MIGRATE-02, MIGRATE-03 | T-38-14, T-38-15, T-38-16 | fault at each commit step leaves state identical; changed-after-read stops | fault-inject | `npx vitest run install/migrate-v3-rollback.test.ts -t "rollback"` | ❌ | ⬜ pending |
| 38-07-T1 | 38-07 | 7 | MIGRATE-04 | — | WR-04: installed two-root + pre-v3 migrates, never "Nothing to do." | integration | `npx vitest run install/agents-record.test.ts -t "R17\|WR-04"` | ✅ / ❌ | ⬜ pending |
| 38-07-T2 | 38-07 | 7 | MIGRATE-04, MIGRATE-01 | T-38-17, T-38-18, T-38-19 | both/claimed/unreadable/staging refused; neither and unmarked current get no marker | integration | `npx vitest run install/migrate-v3-states.test.ts -t "state machine"` | ❌ | ⬜ pending |
| 38-08-T1 | 38-08 | 8 | MIGRATE-04 | T-38-20 | a link under or on the way to the state refuses | integration | `npx vitest run install/migrate-v3-hazards.test.ts -t "H1\|H2"` | ❌ | ⬜ pending |
| 38-08-T2 | 38-08 | 8 | MIGRATE-02, MIGRATE-04 | T-38-21, T-38-22 | special files, bounds, endings, leftover staging refused | integration | `npx vitest run install/migrate-v3-hazards.test.ts` | ❌ | ⬜ pending |
| 38-09-T1 | 38-09 | 9 | MIGRATE-01 | T-38-23 | `--migrate --dry-run` lists moves with bytes; writes nothing | integration | `npx vitest run install/migrate-v3-dryrun.test.ts -t "D1"` | ❌ | ⬜ pending |
| 38-09-T2 | 38-09 | 9 | MIGRATE-01 | T-38-23, T-38-24 | listing complete, ordered, sanitized, deterministic; flag equals DRY_RUN=1 | unit + integration | `npx vitest run install/migrate-v3-dryrun.test.ts -t "D2\|D3"` | ❌ | ⬜ pending |
| 38-10-T2 | 38-10 | 10 | MIGRATE-06 | T-38-25 | Done folder renamed unchanged; trace tree byte-identical | integration | `npx vitest run install/migrate-v3-context.test.ts -t "C1"` | ❌ | ⬜ pending |
| 38-10-T3 | 38-10 | 10 | MIGRATE-06 | T-38-26, T-38-27 | selection reasons; claimed refusal; rollback; current layout; second run | integration | `npx vitest run install/migrate-v3-context.test.ts -t "context archive"` | ❌ | ⬜ pending |
| 38-11-T1 | 38-11 | 11 | MIGRATE-07 | T-38-28, T-38-29 | dogfood on a scratch copy under scratch GRUGOPS_HOME; sizes recorded | manual-assisted | `test -f .planning/phases/38-install-migrate-v3/38-DOGFOOD.md` + human-check | — | ⬜ pending |
| 38-11-T3 | 38-11 | 11 | all | — | phase gate: full non-e2e suite and every CI gate | suite | `npx vitest run --exclude '**/scripts/e2e/**'` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky* — the planner fills Task IDs, plans and waves.

---

## Wave 0 Requirements

- [ ] Frozen fixture + materializing helper (`install/fixtures/pre-v3-chess/`, helper in `installer-paths.test-support.ts`)
- [ ] `install/state-migrate.test.ts`, `install/migrate-v3.test.ts`
- [ ] Update `install/pre-v3-layout.test.ts` (e)(i)(j)(m), `installer-fs-census.test.ts` rows, `installer-dry-run.test.ts`, `generate-runnable-embeds.test.ts` (new target kind, count 4)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dogfood migration of a real old-layout repo, before/after size table | MIGRATE-07 | runs on a user-owned copy of a real repo | run `--migrate --dry-run` then `--migrate` on the copy; record the before/after size table in the plan SUMMARY |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
