# Phase 43 — deferred items

Out-of-scope findings logged by executors. Each names who found it, where, and why it was not fixed there.

## The hook-entry manifest no longer matches scripts/audit-model.js (found by plan 43-02, 2026-11-17)

- **What fails:** `npm run freshness:hook-manifest` exits 1 ("hooks/hook-entry.ts's manifest is not a derivation
  of the current emitted import graph"), and `scripts/context-io.test.ts` case "31-37 WR-36 — one shared candidate
  corpus, the wrapper's accept set INSIDE the reader's route 0 …" fails with "Blocked (fail-closed): the grugops
  hook module "scripts/audit-model.js" does not match the frozen manifest". Re-run alone, it fails the same way.
- **Cause:** `scripts/audit-model.js` is in the admission-guard import closure that `hooks/hook-entry.ts`
  `DECIDER_MANIFEST` freezes by hash. Plan 43-01 changed it (commits 5c281053 and 680b2958) and the manifest
  was not regenerated. Neither gate is in 43-BASELINE.md (`freshness:hook-manifest` was not run there; the WR-36
  case passed at base).
- **Not plan 43-02's:** the manifest names none of the files plan 43-02 changes (`install/kit-source.js`,
  `scripts/check-public-docs-vocabulary.js`, `scripts/check-banned-claims.js`), and plan 43-02 does not own
  `scripts/audit-model.ts`.
- **Remedy (from the gate's own message):** `npm run generate:hook-manifest`, then commit `hooks/hook-entry.ts`,
  `hooks/hook-entry.js` and the D-24 freeze together.

## The checkout-only dogfood runbook still points at example 03 as real proof (found by plan 43-07, 2026-11-18)

- **What:** `docs/dogfood-human-runbook.md` (checkout-only, not shipped) says the sequential path was
  "captured as REAL proof in `examples/03-ticket-to-pr.md` and `examples/01-greenfield-bootstrap.md`" (lines 6-8),
  compares against example 03 (line 157), and its Step 4 sends the reader to the "Dual-path parity (DOG-02)" table
  in example 03 (lines 165-170). Plan 43-07 relabeled examples 01 and 03 as illustrative v3 walkthroughs and dropped
  that table, which had no v3 equivalent. The original capture and table stay in commit
  ab0cda98416c24310c02c180cb2a917889d413e6.
- **Not fixed here:** the runbook is in no 43-07 `files_modified`, and its other text is pre-v3 too (`autonomy=pr`,
  handoff filenames), so the fix is a runbook rewrite or retirement, not a one-line edit. No gate reads it.
- **Remedy:** point the runbook at the commit for the captured run, or retire its parity step, for human triage.
