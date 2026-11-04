## Deferred Items

- `scripts/context-io-writer-set.test.ts` fails two cases in the 31-14 describe (found during 41-01)
  status: open
  **What:** both cases read `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`, which is absent. The phase moved out of `.planning/phases/` in the archive commit `91b4cbc6`.
  **Why deferred:** not caused by plan 41-01. The cases need the archived path, and plan 41-01 changes no planning path.
- `scripts/worktree-dogfood.test.ts` did not run in the executor session (found during 41-01)
  status: open
  **What:** the suite's `git worktree add --detach` setup stopped with `unable to write file` on 972 to 1698 files, in `/tmp` and in the scratchpad alike, so both cases were skipped.
  **Why deferred:** the failure is in the fixture setup, before any queue code runs. The cause was not established; it may be the session sandbox. The suite calls `claimTask` and `transition` with their unchanged signatures. Re-run it outside the sandbox.
