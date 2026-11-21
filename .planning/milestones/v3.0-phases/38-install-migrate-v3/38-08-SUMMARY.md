---
phase: 38-install-migrate-v3
plan: 08
subsystem: install
tags: [migrate, hazards, symlink, fifo, size-bound, path-limit, exdev, staging, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-03: readMigrateInputs, the one --migrate pre-check and the staging directory; 38-06: the EXDEV fault case that undoes the journal; 38-07: stagingRefusal on every layout"
provides:
  - "install/install.ts readMigrateInputs: the roots pass (wayTo plus lstat) for the pre-v3 root, MEMORY_BANK_REL, PROGRESS_REL and CONTEXT_REL before anything under them is read"
  - "readMigrateInputs: the size bound (USER_FILE_MAX_BYTES, by lstat, before open) and the entry bound (TREE_MAX_ENTRIES, the walk stops) named in one refusal each"
  - "readMigrateInputs: the device comparison of the pre-v3 root and MEMORY_BANK_REL with the target directory"
  - "migratePathLimitRefusals: pathLimitProblem of every moved original, archive destination, planned write and staged copy"
  - "The plain-install refusal: an entry of any kind at MIGRATE_STAGING_REL refuses a plain install before any write (exit 1, one stderr sentence)"
  - "install/migrate-v3-hazards.test.ts: (H1) (H2) (H2b) (H2c) (H3)-(H9)"
affects: [38-09, 38-10, 38-11]

actuals:
  tokens: 13900
  tasks: 2
  commits: 4
plan_head_before: 76c0c12677ca93fd90b05f225df34d7c0e21cc5b
plan_head_after: a00d4a4a57be5f59f2ba0f126007ed86bac535fe

tech-stack:
  added: []
  patterns:
    - "A migrate input root is asked by wayTo (the way) and lstat (the entry) before any read under it; a later root blocked at a path already refused gets no second refusal"
    - "A bound the input walk enforces is named with its value in the refusal, so a user sees which limit and by how much"

key-files:
  created:
    - install/migrate-v3-hazards.test.ts
    - .planning/phases/38-install-migrate-v3/38-08-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/message-references.test.ts
    - install/agents-record.test.ts
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "The roots pass also asks the leaf of each root (lstat), not only the directories on the way: a progress file that is a link was read through by readUserFile before (H2b found it), and a context root that is a link refuses too"
  - "The memory-bank check moved from stateMigrateRefusals into the roots pass, so a link there is one refusal, not two"
  - "The 'could not be recorded whole' refusal is added only when no other refusal explains it, so an oversized file or a too-large tree prints one verify"
  - "The device comparison covers MEMORY_BANK_REL as well as the pre-v3 root (when it exists): the staging directory and the v3 state root are made inside it, so every commit rename lands there. The target directory is asked with statSync, each root with lstatSync"
  - "The plain-install staging refusal tells the user to read commit-plan.txt, put back any rename it lists, remove the directory, then run --migrate. Telling them to run --migrate with the directory still there would loop: --migrate refuses a staging directory (plan 38-07)"
  - "pathLimitProblem is also asked of each staged copy's path (inside MIGRATE_STAGING_REL), which is longer than its destination"

patterns-established:
  - "A hazard refusal of --migrate joins the one pre-check through MigrateRead.refusals or stateMigrateRefusals; none adds an exit"

requirements-completed: [MIGRATE-04, MIGRATE-02]

coverage:
  - id: D1
    description: "A link under the pre-v3 root, the pre-v3 root as a link, the progress file as a link, and the context root as a link are each a pre-check refusal: exit 3, one verify naming the link, the target and the linked-to files unchanged"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H1) (H2) (H2b) (H2c)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A FIFO under the pre-v3 root refuses without hanging; a file over USER_FILE_MAX_BYTES refuses naming the file and the bound; a tree past TREE_MAX_ENTRIES refuses naming the count and the bound"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H3) (H4) (H5)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A board with mixed line endings reaches the pre-check through the planner's refusal: exit 3, one verify naming the board"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A moved path past this platform's path limit is a pre-check refusal naming it and the limit"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H9)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A plain install over a leftover staging directory: exit 1, stdout empty, one stderr sentence naming the directory and its commit plan, target and kit home unchanged"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H7)"
        status: pass
    human_judgment: false
  - id: D6
    description: "--prune-old-kit and uninstall leave a leftover staging directory and its file byte-identical"
    requirement: MIGRATE-02
    verification:
      - kind: integration
        ref: "install/migrate-v3-hazards.test.ts#(H8)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The device comparison refuses a pre-v3 root or memory-bank root on another filesystem than the target"
    requirement: MIGRATE-04
    verification: []
    human_judgment: true
    rationale: "A second filesystem needs a mount, so there is no end-to-end case; the check was reviewed by reading, and plan 38-06's EXDEV fault case proves the commit-time undo"
  - id: D8
    description: "Wording of the new refusals (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 44min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 08: Hazards of a real repository Summary

**Every unsafe shape a real repository can have now stops `install --migrate` in its one pre-check, before the first write, with one verify naming the path. That covers a link anywhere under or on the way to the pre-v3 state (including the progress file and the context root), a FIFO, a file over 8 MiB, a tree over 20,000 entries, a moved path past the platform's path limit, a second filesystem, and a board with mixed line endings. A plain install over a staging directory left by an interrupted migrate is refused too. Uninstall and `--prune-old-kit` leave that directory alone.**

## Performance

- **Duration:** about 44 min (about 23 of it the full-suite run)
- **Started:** 2026-10-28T15:02:13Z
- **Completed:** 2026-10-28T15:45:40Z
- **Tasks:** 2
- **Files modified:** 7 (plus this SUMMARY)

## Accomplishments

- **The roots pass.** Before the input walk reads anything, `readMigrateInputs` checks four roots: the pre-v3 root, `MEMORY_BANK_REL`, the progress file and `CONTEXT_REL`. `wayTo` checks the directories on the way and lstat checks the entry itself. A link or a non-directory on the way is one refusal in `blockedAt`'s words. So is an entry of the wrong kind. A refused root is not read.
- **A real gap closed.** `readUserFile` follows a link, so a progress file that was a link to a file outside the target used to be read through. The migrate then went on and wrote. Case (H2b) found this, and it now refuses.
- **The bounds.**
  - A file whose lstat size is over `USER_FILE_MAX_BYTES` is refused by name and bound before it is opened.
  - The walk counts entries the way `treeRecord` does. Once the count passes `TREE_MAX_ENTRIES` it stops, with one refusal naming the count and the bound.
  - A FIFO, socket or device is refused by its lstat kind and never opened.
- **Path limits.** `migratePathLimitRefusals` runs `pathLimitProblem` on four kinds of path: every moved original, every archive destination, every planned write, and every staged copy.
  - The `pathLimitProblem` count in `install/install.ts` was 3 at the start of the plan and is 5 now.
- **One filesystem.** The pre-v3 root and `MEMORY_BANK_REL` (when it exists) must be on the target directory's device. There is no copy-and-delete fallback.
- **A plain install over a leftover staging directory** is refused through the existing refusal variable and its exit. Nothing new reaches `process.exit`, and the pin of twelve holds.

## Task Commits

1. **Task 1 (tracer): links on the way to and under the pre-v3 state**
   - `bae5b0cb` feat(38-08): the roots pass, plus (H1) (H2) (H2b) (H2c), and the test-file censuses 43 → 44
   - Before the change, (H1) and (H2) already passed: plan 38-03's walk refused them. (H2b) and (H2c) failed: the run went past the pre-check.
   - Tracer gate: the run was interactive, mode end-of-phase, and the verify was automated-only, so I re-ran it with no checkpoint. `npm run build && npm run typecheck && npx vitest run install/migrate-v3-hazards.test.ts -t "H1|H2"` passed 4 of 4. `install.test.ts -t MID-SCRIPT` passed. Then expansion continued.
2. **Task 2 (tdd): special files, bounds, path limits, a second filesystem, mixed endings, a leftover staging directory**
   - `24f494c7` test(38-08): (H3)-(H9) (RED)
   - `ac35f6c1` feat(38-08): the size, entry, path-limit and device refusals, the plain-install staging refusal, and the message-references census (GREEN)
   - `a00d4a4a` test(38-08): the removal-matcher census in agents-record.test.ts

## TDD Gate Compliance

- A `test(38-08)` commit (`24f494c7`) comes before the Task 2 `feat(38-08)` commit (`ac35f6c1`). There is no REFACTOR commit.
- I checked RED by hand, because `gsd_run check tdd-red-evidence` rejects vitest output (a phase fact). Semantic assessment of the run at `24f494c7`: 4 failed, 7 passed.
  - **(H4)** failed on the planned assertion. The one verify said "is larger than the size bound (8388609 bytes)" and did not contain the bound "8388608 bytes".
  - **(H5)** failed on the planned assertion. The verify said "could not be recorded whole" and named neither the count nor the bound.
  - **(H7)** failed on the exit code. The plain install ran ("== grugops install ==") instead of exiting 1.
  - **(H9)** failed: the run passed the pre-check (no "-- migrate pre-check" section) and reached the handoffs backup.
  - Three cases passed at RED, as expected: (H3), (H6) and (H8).
    - (H3): plan 38-03's walk already refuses a FIFO by its kind, and the run did not hang.
    - (H6): the planner's mixed-endings refusal reaches the pre-check.
    - (H8): the memory-bank root is protected.
    - The plan asks these three to be proven end to end, not built.
- GREEN: all 11 cases pass. Neither `migrate-v3-states.test.ts`, `migrate-v3.test.ts` nor `migrate-v3-rollback.test.ts` regresses.

## Files Created/Modified

- `install/install.ts` (+ `.js`):
  - in `readMigrateInputs`: the roots pass, the bounds and the device comparison;
  - `migratePathLimitRefusals`;
  - the staging check in the plain-install refusal;
  - `MIGRATE_COMMIT_PLAN_NAME`, moved up above that refusal (a `const` used before its declaration is in the temporal dead zone);
  - the memory-bank check, moved out of `stateMigrateRefusals`.
- `install/migrate-v3-hazards.test.ts`: new. One case per hazard.
- `install/message-references.test.ts`: two COMMAND_TABLE rows (the staging refusal is "builder in the same expression", its cannot-be-asked variant is "message prefix"). Counts: install.ts 43 → 45, builder-in-expression 15 → 16, message prefix 7 → 8, non-command rows 13 → 14.
- `install/agents-record.test.ts`: two REMOVAL_EXEMPT rows. Counts: hits 135 → 137, table 88 → 90, install.ts 48 → 50.
- `install/mode-census.test.ts`: INSTALL_TEST_FILE_COUNT 43 → 44.
- `install/path-spelling-census.test.ts`: TEST_SCANNED_FILE_COUNT 43 → 44.

## Decisions Made

See `key-decisions` in the frontmatter. The device check has no end-to-end case, because a second filesystem needs a mount. I reviewed it by reading: `statSync(TARGET).dev` is compared with `lstatSync(root).dev` for the pre-v3 root and, when it exists, `MEMORY_BANK_REL`. A difference is a refusal naming both paths and both devices. Plan 38-06's EXDEV fault case proves the commit-time undo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The leaf of each root is asked, not only the way to it**
- **Found during:** Task 1 (H2b).
- **Issue:** `wayTo` asks only the directories on the way. A progress file that is itself a link passed it, and `readUserFile` followed the link.
- **Fix:** lstat asks the entry too, which must be absent or of the expected kind. Cases (H2b) and (H2c) were added.
- **Commit:** `bae5b0cb`

**2. [Rule 1 - Bug] The plain-install staging refusal's remedy would have looped**
- **Found during:** Task 2.
- **Issue:** The plan's wording said to run `install --migrate` again after reading commit-plan.txt. Plan 38-07's `stagingRefusal` refuses `--migrate` while that directory exists, so the printed remedy could not succeed.
- **Fix:** The refusal now says to read commit-plan.txt, put back any rename it lists, remove the directory once its contents are not needed, and then run the printed `--migrate` command (`migrateCommand`).
- **Commit:** `ac35f6c1`

**3. [Rule 3 - Blocking] Two census tests outside the plan's file list**
- **Found during:** the full suite (agents-record) and Task 2 (message-references).
- **Fix:** The new printed fragments and removal sentences are classed. `installer-fs-census.test.ts` needed no new row: no mutating call site was added.
- **Commits:** `ac35f6c1`, `a00d4a4a`

**4. [Order] (H8) runs `--prune-old-kit` before uninstall**
- The plan said uninstall, then `--prune-old-kit`. After an uninstall there is no marker, so prune has nothing to act on. Running prune first, on the installed and migrated repository, tests it on a real ledger. Both runs are asserted byte-identical on the staging directory.

**5. [Scope] Beyond the plan's H1-H8:**
- (H2b) and (H2c) cover the roots-pass truth (the progress file and the context root).
- (H9) covers the path-limit truth, which had no case in the plan's behavior list.

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 bug, 1 blocking), plus 1 order change and 3 added cases.
**Impact on plan:** All needed for correctness or for the census gates. Nothing outside the plan's subject changed.

## Issues Encountered

- **The full suite** ran once with GRUGOPS_HOME and HOME in a scratch directory. It took 1,364 s and gave 21 failed / 10,391 passed / 2 skipped. 20 of the 21 are exactly the 38-BASELINE.md set.
  - The 21st was the removal-matcher census in `install/agents-record.test.ts`, which the new refusal wording tripped. It was fixed in `a00d4a4a`, and the whole file was re-run: 213 of 213 passed.
- **Plan verification:**
  - 1: hazards, states, migrate-v3, install.test and the census files pass. `installer-fs-census` fails only on its baseline `openAsBlobSync` case.
  - 2: `npm run freshness` and `node scripts/check-state-paths.js` both exit 0.
  - 3: the branch is `main`, and no branch was created or switched.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

The pre-check now covers every repository hazard named in the research's Security Domain. The remaining phase 38 plans (38-09 to 38-11) build on a migrate that cannot follow a link or write half a tree. This plan was the last one that declares MIGRATE-04 and MIGRATE-02, so both are now marked complete in REQUIREMENTS.md.

## Self-Check: PASSED

- FOUND: install/migrate-v3-hazards.test.ts, install/install.ts, install/install.js
- FOUND: bae5b0cb, 24f494c7, ac35f6c1, a00d4a4a (all ancestors of HEAD)
- Acceptance: `-t "H1|H2"` passed 4; `-t "H7"` passed 1; the `pathLimitProblem` count went from 3 to 5

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
