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
| 38-TBD | TBD | TBD | MIGRATE-01 | — | dry-run writes nothing (`snapshotTree` identical) | integration | `npx vitest run install/migrate-v3.test.ts -t "dry-run"` | ❌ W0 | ⬜ pending |
| 38-TBD | TBD | TBD | MIGRATE-02 | — | archive tree record equals original `plans/` | integration | `npx vitest run install/migrate-v3.test.ts -t "archive"` | ❌ W0 | ⬜ pending |
| 38-TBD | TBD | TBD | MIGRATE-03 | data loss by partial migrate | proof fails on every mutation; rollback leaves tree identical | unit + fault-inject | `npx vitest run install/state-migrate.test.ts -t "proof"` / `install/migrate-v3.test.ts -t "rollback"` | ❌ W0 | ⬜ pending |
| 38-TBD | TBD | TBD | MIGRATE-04 | — | both/claimed/neither refused or no-op; second run byte-identical | integration | `npx vitest run install/migrate-v3.test.ts -t "state machine"`; `npx vitest run install/agents-record.test.ts -t R17` | ❌ W0 / ✅ | ⬜ pending |
| 38-TBD | TBD | TBD | MIGRATE-05 | terminal escapes in previews | every trailer byte verbatim under `## Board notes` | unit | `npx vitest run install/state-migrate.test.ts -t "trailer"` | ❌ W0 | ⬜ pending |
| 38-TBD | TBD | TBD | MIGRATE-06 | symlink redirect | Done folders renamed; trace tree byte-identical | integration | `npx vitest run install/migrate-v3.test.ts -t "context archive"` | ❌ W0 | ⬜ pending |

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
