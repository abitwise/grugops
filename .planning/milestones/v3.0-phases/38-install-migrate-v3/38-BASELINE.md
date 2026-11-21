# Phase 38: test baseline before any code edit (plan 38-01)

**Recorded:** 2026-10-28, before any phase 38 code edit, so later plans can tell a new failure from a known one.

- **Node:** v26.12.1
- **Starting commit:** `bdac8848cc928e5a09a2fb2598b5f6cc69cad31e` (`docs(38): record phase 38 planned`). The working tree
  held only the orchestrator's uncommitted `.planning/STATE.md` position update; `npm ci` and `npm run build` ran first
  and the build changed no committed `.js`.
- **Command:** `npx vitest run --exclude '**/scripts/e2e/**'`, run once over the whole suite with `GRUGOPS_HOME` and
  `HOME` set to a scratch directory, then the six failing files re-run with neither set. Both runs give the same 20
  failures, so the scratch home causes none of them.
- **Result:** Test Files 6 failed, 123 passed (129). Tests 20 failed, 10246 passed, 2 skipped (10268). Duration
  1,345 s (the suite runs one file at a time, `fileParallelism: false`).

## Known failing tests at the starting commit

Every one of them reads an artifact that is not in the tree (an archived `.planning/phases/` directory from an earlier
milestone), except the `installer-fs-census` case, which reads the running Node: Node 26 exports `openAsBlobSync` from
`node:fs`, and the test's two-sided classification does not list it. None touches the install migrate path.

| Test file | Test name |
|-----------|-----------|
| `install/installer-fs-census.test.ts` | installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER (UNCLASSIFIED node:fs export `openAsBlobSync`) |
| `scripts/canonical-corpus.test.ts` | canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS > provenance: every cited source artifact resolves on disk (11 phase 27 review files absent) |
| `scripts/context-io.test.ts` | 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > PREMISE: the document was read and it names residual ids at all |
| `scripts/context-io.test.ts` | 31-29 — … > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md |
| `scripts/context-io.test.ts` | 31-29 — … > DIRECTION 2: every WRITTEN id is a member the module still exports |
| `scripts/context-io.test.ts` | 31-29 — … > a SEEDED undispositioned member turns the equality RED |
| `scripts/context-io.test.ts` | 31-29 — … > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member |
| `scripts/context-io.test.ts` | 31-29 — … > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > the disposition document exists and carries the enumeration heading |
| `scripts/context-io-writer-set.test.ts` | 31-14 — … > every derived decline clause is enumerated, and the document names no other |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every FILE a row cites exists in the tree it names |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — … > every MECHANISM a row claims is greppable in the evidence that row itself names |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > PREMISE: the live tree's own reading, printed before any mirror is believed |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — … > a mirror with a MAJORITY of rows stripped turns the new CEILING red |
| `scripts/uat-gate-exit-contract.test.ts` | every plan of round 6 carries the debt-does-not-grow acceptance criterion > all five round-6 PLAN files state it, and the count is asserted at five |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is … > every ordinal-claiming sentence in the scanned set appears in the tracked list |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is … > SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split("/") key see ONE spelling on every host |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is … > the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY |

`…` stands for the `describe` name written in full in the row above it.

## The dogfood copy (D-15, D-16)

- **Path:** `/home/olger/projects/public/skytalix` (the human renamed `cli-chess-example` to `skytalix`; Task 1's answer).
  The copy holds `plans/board.md`, no `memory-bank/plans/board.md`, `memory-bank/60-progress.md` and `.grugops/context/`.
- **Size against the research:** `du -sh plans` prints 11M, not the about 3 MB the research measured. The repository has
  grown since the research was done; this is recorded here, not treated as a failure. `38-FIXTURE-CENSUS.md` holds the
  measured per-file sizes (board 885,097 bytes, 207 tickets, 1,022 trace rows, 1,000 context folders).
- **Read-only:** `git -C <copy> status --porcelain` printed nothing before the census and the trim. The plan 38-01
  SUMMARY records the after reading.
