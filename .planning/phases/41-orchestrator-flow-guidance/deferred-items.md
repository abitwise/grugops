## Deferred Items

- `scripts/context-io-writer-set.test.ts` fails two cases in the 31-14 describe (found during 41-01)
  status: open
  **What:** both cases read `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`, which is absent. The phase moved out of `.planning/phases/` in the archive commit `91b4cbc6`.
  **Why deferred:** not caused by plan 41-01. The cases need the archived path, and plan 41-01 changes no planning path.
- `scripts/worktree-dogfood.test.ts` did not run in the executor session (found during 41-01)
  status: open
  **What:** the suite's `git worktree add --detach` setup stopped with `unable to write file` on 972 to 1698 files, in `/tmp` and in the scratchpad alike, so both cases were skipped.
  **Why deferred:** the failure is in the fixture setup, before any queue code runs. The cause was not established; it may be the session sandbox. The suite calls `claimTask` and `transition` with their unchanged signatures. Re-run it outside the sandbox.
- `install/installer-write-set.test.ts` could not be verified in the 41-02 executor session (found during 41-02)
  status: open
  **What:** the file failed 66 cases in the full run and 178 when run alone, with `Unknown system error -122` (EDQUOT) in its output. One of the failing cases passed when run by itself. `/tmp/claude-1000` held about 9.5 GB, mostly other projects' session files.
  **Why deferred:** plan 41-02 changes no installer code, and the failure comes from disk quota. The count moves from run to run, so the file proves nothing either way. Re-run it with room on the volume, or with `CLAUDE_CODE_TMPDIR` on another volume.
- Five test files fail 14 cases with the same names in clean clones at `bfd7f9d3` and at the 41-02 head (found during 41-02)
  status: open
  **What:** `scripts/uat-gate-exit-contract.test.ts` (6), `scripts/harness-instance-ledger.test.ts` (4), `scripts/context-io-writer-set.test.ts` (2, already listed above), `scripts/canonical-corpus.test.ts` (1) and `install/installer-fs-census.test.ts` (1). `scripts/context-io.test.ts` also fails 7 cases whose titles read Phase 31 documents.
  **Why deferred:** not caused by plan 41-02. The cases fail the same way before its first commit. The cause of each was not established, beyond the archived Phase 31 documents named above.
- The untracked `~/` directory at the repository root fails one case in `scripts/check-foundation-guards.test.ts` (found during 41-02)
  status: open
  **What:** `every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose` walks `.js` files and finds `~/projects/hacks/grugops-example-01/tools/grugops/*.js`, which git does not track.
  **Why deferred:** the directory belongs to the user and was left alone. The case should pass once that directory is gone.
