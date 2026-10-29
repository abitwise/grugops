# Deferred Items — Phase 39

## Deferred Items

- Pre-existing suite reds from archived phase directories (found during plan 39-01, Task 1)
  status: open
  **What:** `scripts/context-io.test.ts` (7), `scripts/context-io-writer-set.test.ts` (2), `scripts/canonical-corpus.test.ts` (1), `scripts/harness-instance-ledger.test.ts` (4) and `scripts/uat-gate-exit-contract.test.ts` (5) fail because they read planning artifacts under `.planning/phases/27-*` and `.planning/phases/31-*` (for example `31-CONTEXT.md`, `31-22-SUMMARY.md`, `27-REVIEW*.md`), and those phase directories are no longer in the tree.
  **Why deferred:** not caused by plan 39-01; the failing cases cite files no Phase 39 change touches.
- Pre-existing `install/installer-fs-census.test.ts` red on Node 26 (found during plan 39-01, Task 1)
  status: open
  **What:** "every node:fs export whose name may mark a content read is classified" fails with `UNCLASSIFIED node:fs export openAsBlobSync` on the local Node v26.12.1; the census has no row for that newer `node:fs` export.
  **Why deferred:** a Node-version census gap, unrelated to plan 39-01.
