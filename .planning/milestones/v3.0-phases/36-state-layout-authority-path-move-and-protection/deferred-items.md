# Phase 36 deferred items

Out-of-scope failures seen during plan execution. They are not caused by this phase's changes and are not fixed here.

## Found during 36-01 (full non-e2e regression, 2026-10-21, macOS, Node v26.11.1)

`npx vitest run --exclude '**/scripts/e2e/**'` at 2e35f545 (before the agents-record pin fix): 7 files failed, 25 tests
failed, 8508 passed, 2 skipped. Five of the 25 were agents-record.test.ts product-module pins that this plan moved;
they are fixed in plan 36-01. The other 20 are below.

| File | Failed | Cause | Why out of scope | Status |
|------|-------:|-------|------------------|--------|
| `scripts/context-io.test.ts` | 7 | reads `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` and `31-22-SUMMARY.md`, which are absent (ENOENT) | phase 31 records left `.planning/phases/` when milestones were archived; no file this plan touched is read **Resolved in phase 43.1** by plan 43.1-01, commit `76cb009a` (the readers use `.planning/milestones/v2.1-phases/`). | resolved |
| `scripts/context-io-writer-set.test.ts` | 2 | same absent `31-CONTEXT.md` | same **Resolved in phase 43.1** by plan 43.1-01, commit `76cb009a`. | resolved |
| `scripts/uat-gate-exit-contract.test.ts` | 5 | scans the absent `.planning/phases/31-autonomous-manual-testing/` directory | same **Resolved in phase 43.1** by plan 43.1-01, commit `76cb009a`. | resolved |
| `scripts/harness-instance-ledger.test.ts` | 4 | cites phase-31 SUMMARY files and `deferred-items.md` that no longer resolve | same **Resolved in phase 43.1** by plan 43.1-01, commit `76cb009a`. | resolved |
| `scripts/canonical-corpus.test.ts` | 1 | cites eleven absent `.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW*.md` files | phase 27 records archived; same class **Resolved in phase 43.1** by plan 43.1-01, commit `cba0b729` (`scripts/canonical-corpus.ts` reads phase 27 from the v2.1 archive). | resolved |
| `install/installer-fs-census.test.ts` | 1 | `openAsBlobSync` is an unclassified `node:fs` export on Node v26 | known DI-03 (local Node v26 only; CI pins Node 22); STATE.md records it from phase 34 on |

## Found during 36-02 (CI gate scripts run by hand, 2026-10-21)

| Gate | Result | Cause | Why out of scope | Status |
|------|--------|-------|------------------|--------|
| `node scripts/check-flip-manifest.js` | exit 1, no verdict | reads `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md`, which is absent | phase 33 records left `.planning/phases/` when milestones were archived (same class as the 36-01 rows); no file plan 36-02 touched is read **Resolved in phase 43.1** by plan 43.1-01, commit `ce0025fa`: the gate left the CI gate block by decision 43.1 D-01 (a `CI_EXEMPT` entry records why); its test still runs in the suite. | resolved |
