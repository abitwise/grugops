---
phase: 37-overview-board-per-file-records-and-budgets
plan: 31
subsystem: trace
tags: [read-1, d-18, shapes, enoent, entry-presence, concurrency, gap-closure]
status: complete

requires:
  - phase: 37
    provides: "plans 37-28 to 37-30: entryPresence, the one absence owner, embedded in all three runnables; plan 37-25 READ-1 EIO table"
provides:
  - "READ-1 shape table: 185 cells over every read position, derived from the owner's callers (6, 5, 2), pinned and held equal both ways"
  - "READ-1 ENOENT variant: every READ_SITE_ROWS row in each mode with ENOENT (140 runs), plus the roll's re-read; ENOENT_EXEMPT of 9 owner-rule rows, pinned and printed"
  - "One READ-1 rule (assertReadRule) for both codes, now refusing an added trace difference"
  - "SPLIT-03, SPLIT-05 and SPLIT-06 concurrency edges as tested truths (the vanish window opened by ENOENT at the reads after a presence answer)"
affects: [37-32]

actuals:
  tokens: 10500
  tasks: 2
  commits: 2
plan_head_before: 93a015e5072cb3c40c35360c96bcd9999535160f
plan_head_after: e42e915e0c92ed95aa0c666cdfbfd5f38ed20642

tech-stack:
  added: []
  patterns:
    - "Read positions are derived from callingSites over the owner, so a new caller of entryPresence turns the equality red until its paths and shapes are listed"
    - "A follow or keeper cell compares status, stdout and written bytes with the unplanted run, so reading a present entry as absent cannot pass"
    - "A dangling cell must carry the owner's unreachable-target reason, so a caller that reads absence and is refused later for another reason is red"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/read-sites.test.ts

key-decisions:
  - "The layout marker is a file-follow position: readState's shape test is the owner's stat of the target (plan 37-04), so an in-root link to a regular file holding the same marker is read through; every other shape is refused"
  - "readText#0's position is an extra trace file: the pre-write check refuses every planned path first in both modes, so the extra file is the only path readText alone reaches"
  - "The READ-1 rule refuses an added trace difference (MISSING, EXTRA, CHANGED, trace-stale) for EIO and ENOENT alike: a difference means the failed read was compared as data or as nothing"
  - "ENOENT_EXEMPT is the owner's lstat under the 9 callers whose positions may be absent by design, decided before any row ran; no row through readTaskNoteRefs or listContextTasks is exempt"

patterns-established:
  - "Shape table: (runnable, via) from callingSites; kinds carry their shapes and expected outcomes; cell count pinned and computed"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "Every read position of the three runnables, derived from the owner's callers, refuses a dangling link, a link, a wrong type, a FIFO or a refused listing entry by name (exit 2, or trace-not-compared in state-check, never fresh, nothing written), and reads through a follow or keeper cell with output equal to the unplanted run (185 cells, 0 platform skips)"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 shapes (plan 37-31, D-18): every read position, derived from the owner's callers, refuses a non-error shape by name or reads through"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every READ_SITE_ROWS row in each mode with ENOENT, plus the roll's re-read: exit 2 by name or a named finding, no trace difference, nothing written; 9 exempt rows named, reasoned, pinned, fired and printed"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 ENOENT (plan 37-31, D-18): every derived read site, faulted with ENOENT, is could-not-run or a named finding unless absence is the correct answer there"
        status: pass
    human_judgment: false
  - id: D3
    description: "SPLIT-06 concurrency: a file that vanishes during the roll (ENOENT at the owner's lstat under io.read) is refused, nothing changed"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#state-roll write: entryPresence:lstatSync#0 under io.read, ENOENT"
        status: pass
    human_judgment: false
  - id: D4
    description: "The EIO table still holds under the tightened rule, and the exit contract is unchanged"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts (524 passed)"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-10-23
---

# Phase 37 Plan 31: READ-1 shapes and ENOENT at every derived read position Summary

**The READ-1 table now plants the shapes that raise no error. That gives 185 cells over every path a caller hands to `entryPresence`, with the callers taken from the committed .js (6, 5 and 2). Every READ_SITE_ROWS row now runs a second time with ENOENT, under one shared rule, with a pinned list of 9 exemptions. No row found a defect in a runnable. Two mutation proofs found the table's own assertions too loose, and both were tightened.**

## Performance

- **Duration:** about 28 min
- **Started:** 2026-10-23T22:15:17Z
- **Completed:** 2026-10-23T22:43:48Z
- **Tasks:** 2 of 2
- **Files modified:** 1 (scripts/runnable-ref/read-sites.test.ts, 851 lines added and 27 removed across both commits)

## Accomplishments

- **Shape table (Task 1).** `callingSites(committed(runnable), "entryPresence")` gives 6 callers in trace-render, 5 in state-check and 2 in state-roll. Those counts are pinned, and SHAPE_POSITIONS is held equal to the derived (runnable, via) set in both directions. The cell count is 185: pinned, computed from the positions and SHAPES_BY_KIND, and counted as run (185 run, 0 skipped for the platform).
- **ENOENT variant (Task 2).** All 140 (row, mode) runs of READ_SITE_ROWS repeat with `code: "ENOENT"`, plus the roll's re-read under `io.read` in both write modes. ENOENT_EXEMPT has 9 entries, a pinned size and a printed list. Each entry is the owner's lstat under a caller whose position may be absent by design.
- **One rule.** The EIO table's per-row assertions are now one function, `assertReadRule`, which both codes use. That function now also refuses an added trace difference.
- **Concurrency edges, tested.**
  - SPLIT-03: a vanished entry is exit 2 by name with nothing written or removed. This is proven by the ENOENT rows at the owner's stat and realpath, the walk's readdirSync and the reader's openSync, under every trace-render caller.
  - SPLIT-05: state-check never writes, and a vanished path is exit 2 by name or a named finding, never fresh and never a trace difference. This is proven by the same rows over state-check.
  - SPLIT-06: state-roll refuses a path that vanishes after planning (the re-read ENOENT rows) and between the owner's answer and the read (the owner's stat, its realpath and the reader's open under readTextOrThrow). Nothing is rolled.

## Task Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: the shape table (tracer) | `0c05bcae` (test) | scripts/runnable-ref/read-sites.test.ts |
| 2: the ENOENT variant and the exemption list | `e42e915e` (test) | scripts/runnable-ref/read-sites.test.ts |

**Tracer feedback gate:** this was an interactive run in end-of-phase mode, with an automated-only verify. After `0c05bcae`, the tracer verify ran again on the committed tree: `npm run typecheck` passed, and `-t "READ-1 shapes"` gave 194 passed. The gate logged "Tracer verified end-to-end — expanding."

No runnable, authority, region or hook manifest changed. `freshness:runnable-embeds` reported "3 target(s) match a fresh derivation" after each build.

## Pins

| Pin | Value | History line |
|-----|-------|--------------|
| TRACE_RENDER_OWNER_CALLERS | 6 | readRawNotesWithSkips, listContextTasks, readTaskNoteRefs, realDirectoryOrNull, `<top>` (the pre-write check), readText |
| STATE_CHECK_OWNER_CALLERS | 5 | readRawNotesWithSkips, listContextTasks, readTaskNoteRefs, locate, runnableSkewFindings |
| STATE_ROLL_OWNER_CALLERS | 2 | realDirectoryOrNull, readTextOrThrow |
| SHAPE_ROW_COUNT | 185 | trace-render 71, state-check 82, state-roll 32 |
| ENOENT_EXEMPT_SIZE | 9 | trace-render 4, state-check 3, state-roll 2 |

The existing pins are unchanged: the read sites are 12, 15 and 10, UNREACHED_SITES is 0, and the ENOENT census is 2, 2 and 2.

## Final position table

Kinds and their shapes (the expected outcome follows the arrow):

- **directory-follow:** dangling link → refused, link to a directory → follow, link to a regular file → refused, regular file → refused.
- **directory-refuse:** dangling link, link to a directory, link to a regular file, regular file, FIFO → all refused.
- **listing:** regular `.gitkeep` → keeper, regular `.DS_Store` → keeper; `.gitkeep` as a link to a regular file, as a dangling link, or as a FIFO → refused.
- **file:** dangling link, link to a directory, link to a regular file, directory, FIFO → all refused.
- **file-follow:** link to a regular file → follow; the other four file shapes → refused.
- **program:** dangling link, directory, FIFO → refused (a `runnable-version-skew` finding).

| Runnable | Via | Concrete paths | Kind | Modes | Cells |
|----------|-----|----------------|------|-------|-------|
| trace-render | readRawNotesWithSkips#0 | `.grugops/context/taskA/notes`, `.grugops/archive/context/taskB/notes` | directory-follow | check, write | 8 |
| trace-render | listContextTasks#0 | `.grugops/context`, `.grugops/archive/context` (a dot entry inside each) | listing | check, write | 10 |
| trace-render | readTaskNoteRefs#0 | `.grugops/context/taskA`, `.grugops/archive/context/taskB` | directory-refuse | check, write | 10 |
| trace-render | realDirectoryOrNull#0 | `.grugops`, `.grugops/archive`, `.grugops/context`, `.grugops/archive/context`, `memory-bank`, `memory-bank/plans`, `memory-bank/plans/traceability` | directory-follow | check, write | 28 |
| trace-render | `<top>#0` (pre-write check) | `memory-bank/plans/traceability.md`, `memory-bank/plans/traceability/ABC-001.md` | file | check, write | 10 |
| trace-render | readText#0 | `memory-bank/plans/traceability/ABC-099.md` (extra) | file | check, write | 5 |
| state-check | readRawNotesWithSkips#0, listContextTasks#0, readTaskNoteRefs#0 | as trace-render's | as trace-render's | text | 28 |
| state-check | locate#0 | the 7 directories above | directory-follow | text | 28 |
| state-check | locate#0 | the index, `ABC-001.md` | file | text | 10 |
| state-check | locate#0 | `ABC-099.md` (extra) | file | text | 5 |
| state-check | locate#0 | `memory-bank/plans/.layout` | file-follow | text | 5 |
| state-check | runnableSkewFindings#0 | `state-roll.js`, `trace-render.js` beside a fresh state-check copy | program | text | 6 |
| state-roll | realDirectoryOrNull#0 | `memory-bank/plans`, `memory-bank`, `memory-bank/plans/archive` | directory-follow | dry-run, write | 12 |
| state-roll | readTextOrThrow#0 | `memory-bank/plans/board.md`, `memory-bank/60-progress.md` | file | dry-run, write | 10 |
| state-roll | readTextOrThrow#0 | `memory-bank/plans/archive/board-done.md`, `memory-bank/plans/archive/progress.md` (after one roll) | file | dry-run, write | 10 |

What each cell asserts:

- **Refused, trace-render and state-roll:** exit 2 with an empty stdout, stderr naming the path, and `Nothing was rolled.` for state-roll.
- **Refused, state-check:** exit 2 by name, or exit 1 with a `trace-not-compared` FINDING naming the path. "The trace is fresh" never appears. A sibling cell gives a `runnable-version-skew` finding instead.
- **Every refused cell:** no `stopped unexpectedly (`, no Node stack trace, and a treeDigest equal to the planted tree. A dangling cell must also carry the owner's reason, `symbolic link .*target (that )?cannot be reached`.
- **Follow and keeper cells:** status, stdout and the written bytes (the trace, or the four roll files read through links) equal the unplanted run's. For the trace runnables, the bytes also equal the unlinked render.

A temporary log line confirmed that the follow cells are not vacuous. It was removed before the commit. Every follow cell planted a real link (`planted="link:…/shape-targets/…"`), the trace cells printed "The trace is fresh" or "0 file(s) written, 0 file(s) removed", and the state-roll follow cells actually rolled (`Rolled 2 progress entry(ies)`, `1 Done row(s) would move`).

The non-trace state paths of state-check are listed here and not duplicated. They are the board, both indexes' budgets, the progress file, tickets, NFR files and the move-only folders. Their dangling rows come from plan 37-29 Task 2, and their FIFO, directory and link cases from plans 37-04 and 37-05. The note files (`n1.md`, reached through readRegularFileOrNull, not the owner) keep plan 37-21's arm table. A link to a regular file note is read through, which is out of round 2 scope (WR-04, see 37-REVIEW-DISPOSITION.md).

## ENOENT exemption list (printed outcome per mode)

| Row | Reason (owner rule) | Outcome |
|-----|---------------------|---------|
| trace-render `entryPresence:lstatSync#0 via readRawNotesWithSkips#0` | a task's notes directory may be absent: a task with no notes | check exit 1, write exit 0 |
| trace-render `… via realDirectoryOrNull#0` | context roots, the state directory and the trace directory may be absent | check exit 2, write exit 2 |
| trace-render `… via <top>#0` | a planned trace file or index may be absent before its first render | check exit 1, write exit 0 |
| trace-render `… via readText#0` | a planned trace file or index may be absent: missing in the compare, written by the write mode | check exit 1, write exit 0 |
| state-check `… via readRawNotesWithSkips#0` | a task's notes directory may be absent | text exit 1 |
| state-check `… via locate#0` | every state path locate serves may be absent (no marker is WARN mode, an absent board is a finding, the progress file and the folders may be missing) | text exit 0 |
| state-check `… via runnableSkewFindings#0` | a sibling program may be absent: state-check runs alone | text exit 1 (the baseline's progress finding) |
| state-roll `… via realDirectoryOrNull#0` | the archive and memory-bank directories may be absent; an absent state directory is could-not-run by its caller | dry-run, write and write-new-archive exit 2 |
| state-roll `… via readTextOrThrow#0` | the archives and the progress file may be absent; an absent board is could-not-run by its caller | dry-run, write and write-new-archive exit 2 |

Each exempt row fired its fault and printed `<row> <mode>: exempt (<reason>) exit <code>`. The exemptions were written from the owner rule before the ENOENT describe first ran, and no failing row was moved into the list. Every non-exempt run passed the rule on its first run: 123 runs, plus 2 re-read runs.

## Rows that found a defect

None in a runnable or an authority. No cell or ENOENT row read a shape or a vanished path as absence or as a pass on the committed runnables, so no runnable, `scripts/context-io.ts`, region or hook manifest changed.

Two mutation proofs did find that the table's own assertions were too loose. Both were tightened before the commits (see Deviations 1 and 2):

| Found by | Observed | Fix |
|----------|----------|-----|
| mutation (a), first run | 12 dangling cells stayed green. The mutated owner said "absent", and a later check then refused for another reason: "it was listed and is no longer there", or "the state directory … does not exist; install grugops first" | a dangling cell must carry the owner's unreachable-target reason |
| mutation (e), first run | `--check` and state-check stayed green. The vanished task read as "no notes" gave `EXTRA` and `trace-stale` findings at exit 1, which "adds a finding line" accepted | assertReadRule refuses an added trace difference, for both codes |

## Mutation proofs (working tree only; each restored with `git checkout --` on the mutated committed .js; `git status --porcelain scripts hooks` showed only the uncommitted read-sites.test.ts after each)

Each mutation edited the embedded copy in the committed .js, which is what every cell and row runs. The .ts sources were never touched, and `npm run build` with `freshness:runnable-embeds` ran clean afterwards.

| Proof | Mutation | Went red |
|-------|----------|----------|
| (a) | entryPresence returns `absent` when the stat of a link fails with ENOENT (all three .js) | 43: every dangling cell (42) and the tracer, nothing else. On the first run, before the reason assertion, it was 30 (see above) |
| (b) | listContextTasks treats a symbolic link named `.gitkeep` as a keeper (trace-render.js, state-check.js) | 4: the `.gitkeep`-as-a-link cells, both roots, both runnables |
| (c) | state-roll's readTextOrThrow follows a link to a regular file (the link refusal removed, the shape taken from the target) | 4: the link-to-a-regular-file cells at the board, the progress file, the Done archive and the progress archive |
| (d) | trace-render's readText returns null for a reader null after "present" | 2: the ENOENT row `readRegularFileOrNull:openSync#0 via readText#0`, check and write. The first run turned only the write row red (exit 0, 3 files written); check showed `MISSING` at exit 1 |
| (e) | readTaskNoteRefs returns an empty read for an absent task entry (trace-render.js, state-check.js) | 3: the ENOENT row `entryPresence:lstatSync#0 via readTaskNoteRefs#0`, trace-render check and write, and state-check text. The first run turned only the write row red |

## Regression comparison

As the plan requires (its regression-scope deviation), only read-sites.test.ts and runnable-exit-contract.test.ts ran. No runnable or authority changed, so the derived subset of plans 37-29 and 37-30 was not needed. The full non-e2e suite runs in plan 37-32 Task 3.

- `npx vitest run scripts/runnable-ref/read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts`: 524 passed, 0 failed (143 s). Before this plan, read-sites.test.ts had 176 tests. It now has 513, and runnable-exit-contract has 11.
- Gates on the final tree all exited 0: `npm run build`, `npm run typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest` and `freshness:traceability`. `check-foundation-guards.js`, `check-state-paths.js` and `check-nul-bytes.js` each printed `ALL CHECKS PASSED`. `node scripts/runnable-ref/state-check.js .` printed `No findings.`.
- `pgrep -fl vitest` after the runs showed only another project's vitest (`grugops-examples/wt-ABC-205`), which was left alone.

## Decisions Made

- SHAPE_POSITIONS may hold more than one entry per (runnable, via), because state-check's locate serves directories, files and the marker, which are different kinds. The two-sided equality is over the distinct pairs.
- A cell runs all of its modes on one planted tree: trace-render `--check` then write, and state-roll `--dry-run` then write. A refused run never writes, and that is asserted after each mode. A follow cell's runs are compared with unplanted runs made in the same order.
- The originals of planted shapes move to `<root>/shape-aside/`, and link targets live in `<root>/shape-targets/`. No runnable reads either directory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A dangling cell asserts the owner's reason**
- **Found during:** Task 1, mutation proof (a)
- **Issue:** 12 dangling cells (the task entry, the `.gitkeep` link, `memory-bank` and `memory-bank/plans`, and the state-roll board) stayed green while entryPresence answered "absent". A second check refused them, but for the wrong reason.
- **Fix:** For every dangling cell, the output must match `symbolic link .*target (that )?cannot be reached`. All 185 cells pass on the committed runnables, and (a) now turns all 42 dangling cells red.
- **Committed in:** 0c05bcae

**2. [Rule 2 - Missing critical] The READ-1 rule refuses an added trace difference**
- **Found during:** Task 2, mutation proofs (e) and (d)
- **Issue:** "Exit 1 adds a finding line" accepted `EXTRA`, `MISSING` and `trace-stale`, which are exactly what a read of "no data" prints.
- **Fix:** `assertReadRule` (one function for the EIO table and the ENOENT variant) also requires that no added line matches `^(MISSING|EXTRA|CHANGED) ` or `(trace-stale)`. The EIO table passes under the stronger rule, with all 513 tests in the file passing.
- **Committed in:** e42e915e

**3. [Rule 3 - Blocking] New base fixtures for the shape cells**
- **Found during:** Task 1
- **Issue:** The file's builders carry links, an extra trace file and an over-budget progress file. Their unplanted `--check` is exit 1, so a follow cell could not be compared with a fresh unlinked render.
- **Fix:** `shapeTraceRepo` (one rendered two-root repository for trace-render and state-check, with an `extra` variant) and `shapeRollRepo` (stateRollRepo, plus an `archived` variant after one roll). Both reuse `plant`, `noteText`, `renderOk` and `stateRollRepo`. fault-inject.test-support.ts is unchanged.
- **Committed in:** 0c05bcae

**4. [Rule 2 - Missing critical] Corrections to the plan's class-sites table, found from what the callers really pass**
- **Found during:** Task 1
- **Corrections:**
  - readText#0 serves an extra trace file, because the pre-write check refuses every planned path first.
  - `memory-bank` (an ancestor of the state directory) was added to the directory positions of both trace runnables.
  - The marker is file-follow, not file: readState follows an in-root link to a regular file (plan 37-04).
  - The siblings have their own `program` kind with the plan's three shapes.
  - state-roll's archive positions start from a repository after one roll, so that an original exists to replace.
- **Committed in:** 0c05bcae

**5. [Rule 2 - Missing critical] The roll's re-read row gets its ENOENT variant**
- **Found during:** Task 2
- **Issue:** Plan 37-30's re-read row sits outside READ_SITE_ROWS, so iterating that table alone would skip the vanish window during a roll (SPLIT-06).
- **Fix:** Two non-exempt ENOENT rows under `io.read` (write, write-new-archive), asserted by `assertReadRule`.
- **Committed in:** e42e915e

---

**Total deviations:** 5 auto-fixed (4 missing critical, 1 blocking). **Impact on plan:** every one strengthens or completes the class test. No runnable changed and no assertion was weakened.

## TDD Gate Compliance

Task 2 carries `tdd="true"`. The plan's commit subjects are `test(37-31):` or `fix(37-31):`, and no row found a runnable defect, so there is no `feat(37-31)` GREEN commit. On the committed runnables, the ENOENT rows were green on their first run. That is expected for a class test over behaviour that plans 37-28 to 37-30 had already fixed, and it is not an unexpected GREEN for a feature. The RED evidence that the rows discriminate is mutation proofs (d) and (e), which turned the target rows red for the planned reason. Those runs were not passed through the `tdd-red-evidence` classifier, so whether it would accept them is UNKNOWN - verify. `workflow.tdd_mode` is false, so this is advisory.

## Issues Encountered

- A background mutation run outlasted the 120 s foreground timeout. It finished on its own, restored both mutated files, and `git status` was clean afterwards.

## Known Stubs

None.

## Threat Flags

None. The plan changes only test code, and every fixture and runnable copy is in an mkdtempSync directory (T-37-69).

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-32, which runs the full non-e2e suite (Task 3) and records the out-of-scope READ-1 sites (validate-agent-factory.ts, the kit-side readRegularFileOrNull callers) in deferred-items.md.

## Self-Check: PASSED

- FOUND: scripts/runnable-ref/read-sites.test.ts (SHAPE_POSITIONS, SHAPE_ROW_COUNT, ENOENT_EXEMPT_SIZE present)
- FOUND: 0c05bcae, e42e915e (both ancestors of HEAD)
- Commits measured: `git rev-list --count 93a015e5..HEAD` = 2
- `git status --porcelain scripts/runnable-ref scripts/context-io.ts hooks` empty: no leftover mutation

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
