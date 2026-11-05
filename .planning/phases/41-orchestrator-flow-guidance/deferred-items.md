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
  **What:** `scripts/uat-gate-exit-contract.test.ts` (5 after the wave 1 fix; see the last entry), `scripts/harness-instance-ledger.test.ts` (4), `scripts/context-io-writer-set.test.ts` (2, already listed above), `scripts/canonical-corpus.test.ts` (1) and `install/installer-fs-census.test.ts` (1). `scripts/context-io.test.ts` also fails 7 cases whose titles read Phase 31 documents.
  **Why deferred:** not caused by plan 41-02. The cases fail the same way before its first commit. The cause of each was not established, beyond the archived Phase 31 documents named above.
- The untracked `~/` directory at the repository root fails one case in `scripts/check-foundation-guards.test.ts` (found during 41-02)
  status: open
  **What:** `every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose` walks `.js` files and finds `~/projects/hacks/grugops-example-01/tools/grugops/*.js`, which git does not track.
  **Why deferred:** the directory belongs to the user and was left alone. The case should pass once that directory is gone.
- Wave 1 gate result, measured with `TMPDIR` on the root disk (recorded by the orchestrator)
  status: closed for wave 1
  **What:** the full suite finished at the 41-02 head and at `6d05da1f`, the last commit before the phase. The head had 23 failures and the baseline 24. Two failures were new at the head. The earlier clone comparison started at `bfd7f9d3`, after plan 41-01, so it could not show either.
  **Regression, fixed:** `scripts/claim.test.ts` spawned `mkfifo` itself, which `scripts/uat-gate-exit-contract.test.ts` forbids. Plan 41-01 introduced this. The case now stages the FIFO through `stageShapeOrSkip`.
  **Not code:** the `check-foundation-guards` case fails only because of the 7 `.js` files in the untracked `~/` directory (96 walked against 89 tracked).
  **Also settled:** `install/installer-write-set.test.ts`, `scripts/worktree-dogfood.test.ts` and `scripts/uat-spec-integrity` were not among the failures once `/tmp` quota was out of the way.
- `claimPending` can leave an empty claim directory when the record write fails (found during 41-03)
  status: closed by the orchestrator after plan 41-05
  **Fix:** `takeClaim` removes the directory when the `claim.md` write throws, and `scripts/runnable-ref/runnable-exit-contract.test.ts` holds it with a fault-injection case that also proves a retry wins. One case stays open: if that removal also fails, the slot stays and the message still says no task moved. It needs two disk faults in a row.
  **What:** `takeClaim` makes `claimed/TASK/` and then writes `claim.md`. When that write throws, `claimPending` returns `refused` with no removal, so the directory holds a slot and a retry reads `lost`.
  **Reproduced in plan 41-05:** with an EIO at the `claim.md` write, `claim` printed `Error: claim of t1 failed: EIO: injected. The queue was not changed.` and exited 2, and `claimed/t1/` stayed. A retry printed `lost t1`, and `free` counted the slot (`free 2`). `sweep` cannot clear it, because it skips a directory with no record. So this one path still breaks plan 41-05's truth that no message denies a change that stands.
  **Why deferred:** the rule lives in the plan 41-01 authority, and plan 41-05 holds the generated regions unchanged. It needs a disk failure between the two calls. A fix belongs in `scripts/claim.ts`: remove the directory when the write throws, regenerate, and add a fault-injection case.
- The render and `free` read through a symbolic link directly under `claimed/` (found during 41-05)
  status: open
  **What:** `sweep` now refuses such a link before it moves anything. `renderNowRunning` still reads `claim.md` through it, so a planted link adds a row taken from a file outside the root, and `free` counts it as a claim. Neither writes outside the queue. This comes from reading the code; it was not reproduced.
  **Why deferred:** the read is in the generated region, and plan 41-05 holds the regions unchanged. A fix belongs in `scripts/claim.ts`: skip an entry whose lstat is not a directory in `sweepStale`, `sweepQueue` and `renderNowRunning`. That would also make `refuseClaimLinks` in `scripts/runnable-ref/claim.ts` a second check rather than the only one.
- IN-05, the coordinator adapter's size WARN, is re-deferred (decided in plan 41-06, Open Question 5)
  status: open
  **What:** `check-foundation-guards` warns that `.claude/agents/grugops-orchestrator.md` is 3,368 B, past the 3,072 B pointer ceiling. The `tools:` line with the enumerated grant is 576 B, so the file is 2,792 B without it. The WARN marks the grant, not a copied role body.
  **Why deferred:** plan 41-06 touches `scripts/generate-role-adapters.ts`, but only the level line in `specialistBody`. That line changes neither the coordinator body nor the grant. A coordinator-only warn tier would be a guard change with no link to this work.
  **Trigger:** the next grant change decides between a warn tier and a shorter grant rendering.
- The two ideas `41-CONTEXT.md` § Deferred Ideas holds stay deferred, by reference (recorded in plan 41-06)
  status: open
  **What:** the three-rounds rule for the kit's other agent-resolvable checkpoints, and the host-specific speed-ups declined under the no-host-only-mechanism decision. That section holds the wording and what reopens each one.
