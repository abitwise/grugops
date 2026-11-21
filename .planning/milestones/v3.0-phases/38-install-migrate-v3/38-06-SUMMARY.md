---
phase: 38-install-migrate-v3
plan: 06
subsystem: install
tags: [migrate, trace-render, rollback, fault-injection, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-03: runStateMigrate with staging, re-proof, journaled commit renames, undo and the marker; 38-05: the Done and progress rolls inside the plan"
provides:
  - "install/install.ts renderMigratedTrace: the kit-source trace-render.js (the RUNNABLES row for tools/grugops/trace-render.js, joined to GRUGOPS_SRC) run with process.execPath, [script, TARGET] and no shell, after the post-commit proof and before the marker"
  - "Only exit 0 is a pass: exit 1, exit 2, a signal or a spawn error undoes the commit and writes no marker; the verify names the exit or signal and up to 20 sanitized stderr lines"
  - "discardRenderedTrace: before an undo, the files the render added to TRACE_DIR_REL go, and the directory too when the render made it"
  - "traceBudgetFindings: each rendered trace file over BUDGETS.traceBytes joins the D-07 closing list"
  - "The commit is three calls (the state root rename, each archive move, each staged write), so a failure names its step class"
  - "scripts/fault-inject.test-support.ts: FaultSpec fn accepts FS_OTHER_FNS mutators; deriveFsCallSites derives a mutator's call sites from the syntax tree"
  - "install/migrate-v3-rollback.test.ts (R1)-(R7); install/migrate-v3.test.ts (M8), (M9), (M10)"
affects: [38-07, 38-08, 38-09, 38-11]

actuals:
  tokens: 11367
  tasks: 2
  commits: 5
plan_head_before: 94e5b4855bb2999abb97525ae2d5a72e3e767987
plan_head_after: 82436915df17f23d3e595800759bc4f095280ec2

tech-stack:
  added: []
  patterns:
    - "A child program the installer runs on the user's state is the kit-source copy, found by its RUNNABLES row, never the repository's materialized copy"
    - "Whatever a step after the commit adds to the committed tree is recorded (names added, directory made) and taken away before the journal is undone"
    - "A fault site for a shared commit helper is chosen by the via frame of its call in the step class's own loop, picked by the loop variable named on that source line"

key-files:
  created:
    - install/migrate-v3-rollback.test.ts
    - .planning/phases/38-install-migrate-v3/38-06-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/migrate-v3.test.ts
    - install/installer-fs-census.test.ts
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts
    - scripts/fault-inject.test-support.ts

key-decisions:
  - "Exit 1 from the renderer (a finding, nothing written) is a failure too, because the index would not be fresh; only exit 0 is a pass (the plan's flagged assumption, kept)"
  - "The renderer makes TRACE_DIR_REL itself when the migrate plan stages none, so the undo takes that directory away once its added files are gone; otherwise an undo carries an empty traceability/ into the pre-v3 root"
  - "The commit runs as three calls, one per step class, so the verify names the class ('commit, the state root rename', 'commit, an archive move', 'commit, a staged write') and each class has its own fault site"
  - "A failure inside the undo itself cannot be injected (the harness injects one fault per run); it is reviewed by reading, not claimed as tested"

patterns-established:
  - "deriveFsCallSites(js, fn): the mutator twin of deriveReadSites, for failing one write step from outside the program"

requirements-completed: [MIGRATE-03, MIGRATE-02]

coverage:
  - id: D1
    description: "After --migrate on the fixture, TRACE_DIR_REL holds a generated trace file for each ticket the fixture's notes reference, TRACEABILITY_REL begins with the generated header, the kit-source trace-render --check exits 0, and the marker is written"
    requirement: MIGRATE-03
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M8) --migrate renders a fresh trace tree with the kit-source renderer"
        status: pass
    human_judgment: false
  - id: D2
    description: "A render that exits 2 (a stray file under the context root) undoes the commit: exit 3, one verify naming exit 2, the pre-v3 root and the progress file unchanged, no marker, no staging"
    requirement: MIGRATE-03
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M9) a render the kit-source renderer refuses with exit 2 undoes the commit"
        status: pass
    human_judgment: false
  - id: D3
    description: "A rendered trace file over BUDGETS.traceBytes is listed in the closing, and the marker is still written (D-07)"
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M10) a rendered trace file over BUDGETS.traceBytes is listed in the closing"
        status: pass
    human_judgment: false
  - id: D4
    description: "An EIO or EXDEV fault at each commit step class (the root rename, an archive move, a commit mkdir, a staged write, the marker after the render) leaves the pre-v3 root, the memory bank with the progress file, and the context root byte-identical by treeDigest, with no state root, marker or staging, and one verify naming the step"
    requirement: MIGRATE-02
    verification:
      - kind: integration
        ref: "npx vitest run install/migrate-v3-rollback.test.ts -t rollback ((R1)-(R6) and the R6 premise)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A change to the pre-v3 board after the read stops the arm before any commit rename: exit 3, one verify saying the state changed after it was read, the root not renamed and holding the appended byte, no staging"
    requirement: MIGRATE-02
    verification:
      - kind: integration
        ref: "install/migrate-v3-rollback.test.ts#rollback (R7) a change to the pre-v3 board after the read stops the arm"
        status: pass
    human_judgment: false
  - id: D6
    description: "Wording of the render verify, the would-run dry-run line and the step-class names (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 40min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 06: The trace render inside the migrate, and a rollback at every commit step Summary

**`install --migrate` now runs the kit's own `trace-render.js` against the migrated repository after the commit renames and before the layout marker. It runs the copy in the kit source, never the repository's `tools/grugops/` copy, with `process.execPath`, an argument array and no shell. Any outcome but exit 0 undoes the commit and writes no marker. Fault-injected EIO and EXDEV at each commit step class, a failed render, and a change made after the read each leave the state byte-identical.**

## Performance

- **Duration:** about 40 min (about 22 of it the full-suite run)
- **Started:** 2026-10-28T13:20:51Z
- **Completed:** 2026-10-28T14:00:52Z
- **Tasks:** 2
- **Files modified:** 8 (plus this SUMMARY)

## Accomplishments

- On the fixture, the render writes 9 trace files and the index. `trace-render --check` on the migrated target exits 0. The closing prints the renderer's summary line as an `ok` line.
- A stray regular file under the context root makes the renderer exit 2. The verify names the renderer's path, `exited 2` and its stderr lines. Every rename is undone and no marker is written.
- Rendered trace files are measured against BUDGETS.traceBytes, and those over budget join the D-07 closing list (M10).
- Seven rollback cases drive the committed install.js through the fault-injection preload. Every site is derived from the install.js syntax tree, and each case asserts that the fault fired exactly once.
- Under DRY_RUN, a `would-run` line says the render runs after the move and before the marker.

## Task Commits

1. **Task 1 (tracer): the render step and its rollback**
   - `427bd5be` test(38-06): (M8), (M9) failing; (M5) now checks the generated header in place of the seed bytes
   - `c9f037b4` feat(38-06): renderMigratedTrace, discardRenderedTrace, traceBudgetFindings, (M10), CLASSIFIED_SITES row
   - Tracer gate (interactive, end-of-phase, automated-only verify). Before the commit, `npm run build && npm run typecheck && npx vitest run install/migrate-v3.test.ts install/installer-fs-census.test.ts` and the SPAWNING pin were re-run. Everything passed except the baseline `openAsBlobSync` case. Expansion continued.
2. **Task 2 (tdd): every commit step fails safe**
   - `51186ab4` test(38-06): the FaultSpec widening, deriveFsCallSites, and (R1)-(R7). Six fail and two pass.
   - `7392085d` feat(38-06): the three commit calls by step class; the trace directory the render made is taken away on undo
   - `82436915` test(38-06): the installer test censuses count the new file (41 → 42), and its two direct spawns use withAgentFlags inline

## TDD Gate Compliance

- A `test(38-06)` RED commit comes before each `feat(38-06)` GREEN commit. No REFACTOR commit.
- RED was checked by hand, because `gsd_run check tdd-red-evidence` rejects vitest tap-flat output. Semantic assessment:
  - **Task 1:** two failures, both on missing behaviour.
    - (M8): `the render wrote trace files: expected 0 to be greater than 0`.
    - (M9): `expected 0 to be 3`; the migrate passed because no render ran.
    - (M5) passed: its new header assertion also holds for the seed bytes.
  - **Task 2:** six failures.
    - (R1)-(R5) failed on `exactly one call of migrateRename in runStateMigrate whose line contains "rootRename"/"archiveMove"/"stagedWrite": expected [] length 1`. The commit was one loop over all renames, so no step class could be failed or named on its own. This RED is structural, not an assertion on the verify text.
    - (R6), the marker fault after the render, failed on the state digest: an empty `traceability` directory was carried back into the pre-v3 root. That is a real defect in Task 1's undo (deviation 1).
    - (R7) and the R6 premise passed at once. The changed-after-read re-check (d) from plan 38-03 already met (R7).
  - **(M10)** was written after Task 1's GREEN and passed at once. It tests the trace budget, which the plan's M8/M9 did not cover.

## Files Created/Modified

- `install/install.ts` (+ `.js`): the (g2) render step and its helpers (kitTraceRenderer, traceDirNames, renderMigratedTrace, discardRenderedTrace, traceBudgetFindings). Also the three commit calls by step class, the dry-run listing line, and printMigrateBudgets taking the rendered findings.
- `install/migrate-v3.test.ts`: (M8), (M9), (M10); (M5) changed to check the rendered header.
- `install/migrate-v3-rollback.test.ts`: new, (R1)-(R7) plus the R6 premise.
- `scripts/fault-inject.test-support.ts`: FsOtherFn, FsFaultFn, FsCallSite, deriveFsCallSites; FaultSpec's `fn` widened. FS_READ_FNS and FS_OTHER_FNS are unchanged.
- `install/installer-fs-census.test.ts`: CLASSIFIED_SITES rows for discardRenderedTrace's unlinkSync and rmdirSync.
- `install/mode-census.test.ts`, `install/path-spelling-census.test.ts`: the file counts 41 → 42, each argued.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The render makes the trace directory, and the undo carried it into the pre-v3 root**
- **Found during:** Task 2 (R6)
- **Issue:** The migrate plan stages no file under TRACE_DIR_REL, so the renderer makes the directory itself. After a later failure (the marker), the undo renamed `memory-bank/plans/` back to `plans/` with an empty `traceability/` inside it.
- **Fix:** renderMigratedTrace records whether the directory existed before the render. discardRenderedTrace takes it away with rmdirSync after the files the render added.
- **Commit:** `7392085d`

**2. [Rule 2 - Correctness] The files the render wrote must go before the journal is undone**
- **Found during:** Task 1
- **Issue:** The plan said "undo the journal in reverse". The rendered trace files are not journaled, so an undo after the render would fail to remove the directory and carry the files into the pre-v3 root.
- **Fix:** renderMigratedTrace returns the names it added. commitFailed removes them first, through discardRenderedTrace, which also has a CLASSIFIED_SITES row.
- **Commit:** `c9f037b4`

**3. [Rule 3 - Blocking] One commit loop gave one `via` frame for three step classes**
- **Found during:** Task 2
- **Issue:** migrateRename was called from one loop over the root rename, the archive moves and the staged writes. A `via` frame could not tell them apart, so the archive-move and staged-write faults could not be placed, and every failure was named "commit".
- **Fix:** The commit runs as three calls, `rootRename`, `archiveMove` and `stagedWrite`, and the verify names the class. The commit order and commit-plan.txt are unchanged.
- **Commit:** `7392085d`

**4. [Rule 3 - Blocking] The harness derived only read sites**
- **Issue:** deriveReadSites returns FS_READ_FNS calls only, and callingSites needs a function declaration, so a renameSync, mkdirSync or writeFileSync site could not be derived.
- **Fix:** deriveFsCallSites, the same derivation for one named node:fs function. It sits beside the FaultSpec widening and leaves both lists unchanged.
- **Commit:** `51186ab4`

**5. [Test setup] The memory bank holds the seed's standing files before each rollback run**
- **Issue:** A failed state migrate does not stop the install run. The state seed runs next and creates the standing memory-bank files that are absent, so a digest of MEMORY_BANK_REL would differ for reasons that have nothing to do with the migrate.
- **Fix:** The rollback world copies the kit seed's memory-bank files, without the state root, before the run. The digest then shows anything the migrate left and nothing else.

**6. [Test census] The new test file, and its spawns' agent flags**
- **Found during:** the full-suite run
- **Issue:** agent-flag-census, mode-census and path-spelling-census failed on the new file.
- **Fix:** The two direct spawns call withAgentFlags inline, and the counts are re-derived to 42 with a reason each.
- **Commit:** `82436915`

---

**Total deviations:** 6 (1 Rule 1, 1 Rule 2, 2 Rule 3, 2 test setup/census). **Impact:** all needed for correct rollback or for the tests to express the plan. No scope creep.

## Reviewed by reading, not tested

- **A failure inside the undo itself.** Examples are a rename back that fails, or discardRenderedTrace failing to remove a file after a commit step has already failed. The harness injects one fault per run, so this cannot be expressed. By reading:
  - each failed undo step is its own verify;
  - `left` stays true, so the staging directory and commit-plan.txt are kept for the human;
  - the final verify says the undo is incomplete.
- **A renderer that dies part-way through its write section** (its unexpected-error arm). Files it added are taken away. A pre-v3 `plans/traceability/` file with the generated header that it changed or removed before dying would not be restored. The fixture has no such directory, and a hand-written file there makes the renderer exit 1 before any write.

## Issues Encountered

- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, GRUGOPS_HOME and HOME set to a scratch directory, JSON report), run before the census fix in `82436915`: 10,388 tests, 10,363 passed, 23 failed, 2 skipped.
  - 20 of the failures are exactly the 38-BASELINE.md set.
  - The other 3 were the census cases above (agent-flag-census, mode-census, path-spelling-census). After the fix, those three files plus the rollback file pass (54/54).
- Plan verification:
  1. The six named files pass, apart from the baseline installer-fs-census `openAsBlobSync` case.
  2. `npm run freshness` (88 fresh), `node scripts/check-foundation-guards.js` and `node scripts/check-state-paths.js` exit 0. `runnable-embeds-freshness` (4 fresh) and `check-banned-claims` pass too.
  3. The branch is `main`.
- Acceptance greps:
  - `shell: true` in install.ts: 0
  - `function renderMigratedTrace`: 1
  - `runFaulted` in the rollback test: 7
  - `GRUGOPS_FAULT|FAULT_SPEC` in install.ts: 0

## Known Stubs

None.

## Threat Flags

None beyond the register. T-38-13: the kit-source renderer runs with no shell. T-38-14: (R7) covers the change made after the read. T-38-15: undo failures are reviewed by reading. T-38-16: (R2) shows EXDEV is undone, and no copy fallback exists.

## Next Phase Readiness

Ready for 38-07 (the already-migrated gate for an installed two-root repository).

## Self-Check: PASSED

- FOUND: install/migrate-v3-rollback.test.ts, install/install.ts, install/install.js, scripts/fault-inject.test-support.ts
- FOUND commits: 427bd5be, c9f037b4, 51186ab4, 7392085d, 82436915
