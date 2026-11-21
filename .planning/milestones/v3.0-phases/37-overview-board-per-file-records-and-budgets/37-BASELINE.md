# Phase 37: known-failing test baseline

Recorded by plan 37-01 before any phase-37 edit. Later plans compare their regression runs against
this list: a failure listed here is known, and any other failure is new.

## Run

- **Starting commit:** `f527ec3a` (chore(test): cap vitest at one worker), on top of `9dc3f602`
- **Node version:** v26.11.1
- **Command:** `npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1`
- **Date:** 2026-10-22, started 10:01:21 local, duration 1,824 s
- **Result:** exit 1. Test files: 6 failed, 112 passed (118). Tests: 20 failed, 8,569 passed,
  2 skipped (8,591).

## Causes

- 19 failures read phase-27 and phase-31 records by their old path under `.planning/phases/`.
  Those records moved to `.planning/milestones/v2.1-phases/` when v2.1 was archived, so each read
  finds no file: an ENOENT on `.planning/phases/31-autonomous-manual-testing/` (its `31-CONTEXT.md`,
  its `31-22-SUMMARY.md` and the directory listing), and citations of
  `.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW*.md` and of phase-31
  SUMMARY files that resolve to no file.
- 1 failure is the Node 26 census row: Node 26 exports `openAsBlobSync` from `node:fs`, and
  `install/installer-fs-census.test.ts` requires every `node:fs` export to be classified.

None is fixed in phase 37. Phase 36's `deferred-items.md` records this class of failure.

## Failing tests (20)

### install/installer-fs-census.test.ts (1)

- installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may
  mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER

### scripts/canonical-corpus.test.ts (1)

- canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS > provenance:
  every cited source artifact resolves on disk

### scripts/context-io-writer-set.test.ts (2)

- 31-14 — the register's decline enumeration equals the derived set > every derived decline clause
  is enumerated, and the document names no other
- 31-14 — the register's decline enumeration equals the derived set > the disposition document
  exists and carries the enumeration heading

### scripts/context-io.test.ts (7)

- 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one > the WAVE-2
  verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > a SEEDED
  undispositioned member turns the equality RED
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE
  1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE
  2: a mirror of the register with ONE member removed names the orphaned disposition
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION
  1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION
  2: every WRITTEN id is a member the module still exports
- 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > PREMISE:
  the document was read and it names residual ids at all

### scripts/harness-instance-ledger.test.ts (4)

- 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every
  FILE a row cites exists in the tree it names
- 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every
  MECHANISM a row claims is greppable in the evidence that row itself names
- 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > a mirror
  with a MAJORITY of rows stripped turns the new CEILING red
- 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > PREMISE:
  the live tree's own reading, printed before any mirror is believed

### scripts/uat-gate-exit-contract.test.ts (5)

- every plan of round 6 carries the debt-does-not-grow acceptance criterion > all five round-6 PLAN
  files state it, and the count is asserted at five
- the harness-false-result tally is ONE list with the numbering read off it > every
  ordinal-claiming sentence in the scanned set appears in the tracked list
- the harness-false-result tally is ONE list with the numbering read off it > SEPARATOR SEAM (test
  AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter
  and the split("/") key see ONE spelling on every host
- the harness-false-result tally is ONE list with the numbering read off it > the round-5 collision
  is ANNOTATED in the list rather than repaired in either SUMMARY
- the harness-false-result tally is ONE list with the numbering read off it > the scanned document
  set is DERIVED and its cardinality is asserted, so a short scan is red
