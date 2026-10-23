---
phase: 37-overview-board-per-file-records-and-budgets
plan: 28
subsystem: trace
tags: [read-1, trace-render, state-check, context-io, runnable-embeds, gap-closure]
status: complete

requires:
  - phase: 37
    provides: "plan 37-21 planCompleteTraceTree (the one completeness predicate), plan 37-25 READ-1 EIO table"
provides:
  - "scripts/context-io.ts entryPresence: the one absence owner (only an lstat ENOENT is absent)"
  - "scripts/context-io.ts readTaskNoteRefs and listContextTasks: the one task read and context-root listing, embedded in both runnables"
  - "CR-03 and CR-04 closed: a dangling notes link and every non-directory context-root entry is a failed task, never no data"
affects: [37-29, 37-30, 37-31, 37-32]

actuals:
  tokens: 34000
  tasks: 2
  commits: 2
plan_head_before: 07a1d36ad5578adf368fe6723b99aac27e9f3dcf
plan_head_after: df44fb9729c8c190ddf37bed717cf3a2740dec9a

tech-stack:
  added: []
  patterns:
    - "Absence owner: entryPresence walks every path prefix from the filesystem root with one lstat, one stat and one realpath site"
    - "Runnables delegate the task read and listing to generated copies; the hand-written wrappers make no node:fs call"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts

key-decisions:
  - "entryPresence stats the last path component always (the link's target, or the entry itself), so its one stat site serves every caller and a regular .gitkeep keeper reaches it in the READ-1 table"
  - "A notes link inside the repository root is still read through (the notes position follows an in-root link); the task position never follows a link (37-06 trust decision), now a failed task by name"
  - "A keeper is a regular, non-link file whose name begins with a dot; a dot-named directory is a task, and a dot-named link or FIFO is a failed task"

patterns-established:
  - "Only an lstat ENOENT is absence: callers ask entryPresence and decide nothing about absence themselves"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A dangling notes link is a failed task in both runnables and both context roots: write exit 2 with nothing written or removed, --check exit 2, state-check trace-not-compared, never fresh (CR-03)"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-03: a dangling notes link is a failed task, never a task with no notes"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#CR-03: a dangling notes link is trace-not-compared naming the task"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every context-root entry that is not a task directory (a link of any kind, a regular file, a FIFO, a .gitkeep link) is a failed task by name; keepers stay keepers; a dot-named directory is a task (CR-04)"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-04: a context-root entry that is not a task directory is a failed task, never dropped"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#CR-04"
        status: pass
    human_judgment: false
  - id: D3
    description: "One generated owner for absence, the task read and the listing; no hand-written copy in either runnable (syntax-tree census)"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-04 census: no hand-written part of either runnable decides whether a task or its notes are present"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#entryPresence: the one absence owner (plan 37-28, D-18)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#listContextTasks and readTaskNoteRefs"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 EIO table re-derived and green with both equalities (17, 20, 11 read sites)"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (206 tests)"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-10-23
---

# Phase 37 Plan 28: one absence owner, one task read and one listing (CR-03, CR-04) Summary

**`entryPresence` in scripts/context-io.ts is now the only place that decides a path is absent, and only an lstat ENOENT counts. Both runnables embed it, plus the generated `readTaskNoteRefs` and `listContextTasks`. So a dangling `notes` link, or any context-root entry that is not a task directory, is now a failed task: trace-render exits 2, state-check reports `trace-not-compared`, and no trace file or index line is removed.**

## Performance

- **Duration:** about 47 min
- **Started:** 2026-10-23T20:08:38Z
- **Completed:** 2026-10-23T20:56Z
- **Tasks:** 2 of 2
- **Files modified:** 21 distinct paths over two commits (Task 1: 17, Task 2: 16)

## Accomplishments

- CR-03 closed. A task whose `notes` link dangles fails by name, for example `UNREADABLE TASK .grugops/context/taskA: context-io: the notes directory "..." could not be read: it is a symbolic link whose target cannot be reached (ENOENT)`. The tree digest is unchanged, and `--check` exits 2. state-check exits 1 with the marker and 0 with a WARN without it. This holds in both context roots.
- CR-04 closed. A task directory replaced by a symbolic link is a failed task (`it is a symbolic link, and a symbolic link is never read as a task`). So are a link to a file, a dangling link, a non-dot regular file, a FIFO and a `.gitkeep` link. All of these are tested in both roots.
- IN-06 closed. The walk no longer reads ENOTDIR as "no notes". The false `missing path only` comment is replaced by the D-18 rule.
- The hand-written `readTask`, `readTraceTask` and both `listTasks` are now one-line wrappers. A syntax-tree census confirms that each runnable calls `readTaskNoteRefs` once and `listContextTasks` once, that the wrappers make no node:fs call, and that nothing passes `withFileTypes`.

## Task Commits

| Task | Commit | Hand-edited sources | Hand-edited tests | Generated or compiled |
|------|--------|---------------------|-------------------|-----------------------|
| 1: one absence owner, the walk asks it (tracer) | `daefd0c0` (fix) | 2 (context-io.ts, generate-runnable-embeds.ts) | 5 (trace-render, state-check, read-sites, context-io, context-io-writer-set tests) | 10 (context-io.js, generate-runnable-embeds.js, trace-render.ts/.js, state-check.ts/.js, state-roll.ts/.js, hook-entry.ts/.js) |
| 2: one generated task read and listing | `df44fb97` (fix) | 4 (context-io.ts, generate-runnable-embeds.ts, trace-render.ts, state-check.ts) | 4 (trace-render, state-check, read-sites, context-io tests) | 8 (context-io.js, generate-runnable-embeds.js, trace-render.js, state-check.js, state-roll.ts/.js, hook-entry.ts/.js; the regions of trace-render.ts and state-check.ts were regenerated as well as hand-edited) |

The tracer feedback gate ran after Task 1 (interactive run, end-of-phase mode, automated-only verify). The tracer verify was re-run on the committed tree and passed: typecheck, freshness:runnable-embeds, freshness:hook-manifest, freshness, and 19 CR-03, readContext and entryPresence tests.

## RED runs (recorded, not committed, as the plan requires)

- **CR-03, before Task 1** (committed runnables at 07a1d36a): `npx vitest run scripts/runnable-ref/trace-render.test.ts -t CR-03` had 2 failures. In both roots the second render exited 0 with `REMOVED memory-bank/plans/traceability/ABC-1.md ... 1 task(s) and 0 note(s) read; ... unreadable tasks 0; 1 file(s) written, 1 file(s) removed.` (the assertion expected 2 and got 0). A scratch reproduction with the same committed `.js` showed: write exit 0 with the REMOVED line, `--check` exit 0 `The trace is fresh: 1 task(s) and 0 note(s) read`, and `state-check` exit 0 printing `TRACE    The trace is fresh: 1 task(s) and 0 note(s) read ...` and `No findings.` with the marker present. Semantic assessment: the target tests ran and failed on the planned exit-code assertion, for the CR-03 reason. This is the defect, not a load or fixture fault.
- **CR-04, on the Task 1 build** (daefd0c0): 14 failures. The CR-04 render in both roots exited 0 with `REMOVED memory-bank/plans/traceability/ABC-1.md` and `0 task(s) and 0 note(s) read`. Each task-position shape exited 0 with `1 task(s) and 1 note(s) read`, which means the entry was dropped without being counted. Both census cases found 0 `readTaskNoteRefs` calls. A scratch reproduction showed `--check` exit 0 `The trace is fresh: 0 task(s)` and state-check exit 0 `TRACE    The trace is fresh: 0 task(s) and 0 note(s) read` with `No findings.`. The keeper and `.hidden-task` controls passed before the change, as controls should. Semantic assessment: the targets failed on the planned assertions for the CR-04 reason.

## Mutation proofs (working tree only; each reverted with `git checkout -- scripts/context-io.ts` and a rebuild)

| Proof | Mutation | Went red |
|-------|----------|----------|
| (a) | entryPresence returns `absent` when the stat of the last component's link target fails with ENOENT | 6: both CR-03 trace-render rows, both CR-03 state-check rows, the readContext dangling-link case, the entryPresence dangling-link case |
| (b) | listContextTasks drops entries whose lstat is a symbolic link | 12: CR-04 link-to-directory, link-to-file and `.gitkeep`-link rows, trace-render and state-check, both roots (a dangling link is `unreadable`, not `present`, so it is still refused) |
| (c) | readTaskNoteRefs accepts a symbolic-link task entry (only `target.isDirectory()` is asked) | 8: the CR-04 link-to-directory sequence in trace-render and state-check in both roots, plus the trace-render link-to-file and `.gitkeep`-link rows, whose reason changes from "symbolic link" to "not a directory" |
| (d) | the keeper exemption removed (`&& false`) | 4: the keeper CONTROL rows of trace-render and state-check, both roots. This shows the exemption carries weight and does not quietly filter out task data. |

After each revert, `git status --porcelain scripts/context-io.ts scripts/runnable-ref hooks` was empty, and freshness:runnable-embeds, freshness:hook-manifest and freshness exited 0.

## READ-1 table: removed (key, via) rows and their replacements

| Removed | Replaced by |
|---------|-------------|
| trace-render `readRawNotesWithSkips:statSync#0` (Task 1) | `entryPresence:lstatSync#0`, `entryPresence:statSync#0`, `entryPresence:realpathSync#0`. Each is under `readRawNotesWithSkips#0`, `listContextTasks#0` and `readTaskNoteRefs#0` after Task 2. |
| state-check `readRawNotesWithSkips:statSync#0` (Task 1) | the same three owner sites under the same three callers |
| trace-render `listTasks:readdirSync#0` via `collectTraceNotes#0` and via `<top>#0` | `listContextTasks:readdirSync#0` (one caller, so no via) |
| trace-render `readTask:realpathSync#0` via `collectTraceNotes#0` and via `<top>#0` | `entryPresence:{lstatSync,statSync,realpathSync}#0 via readTaskNoteRefs#0` (the task entry) and `via readRawNotesWithSkips#0` (the notes directory and its boundary real path) |
| state-check `listTasks:readdirSync#0` via `collectTraceNotes#0` and via `traceReport#0` | `listContextTasks:readdirSync#0` |
| state-check `readTraceTask:realpathSync#0` | `entryPresence:* via readTaskNoteRefs#0` and `via readRawNotesWithSkips#0` |

Pins: 16/19/11 became 18/21/11 after Task 1 and 17/20/11 after Task 2. Each change has a dated history line. Both equalities stay two-sided. UNREACHED_SITES stays at 0. The fixtures gained a `taskA/notes` link (reaches the owner's stat of a link) and a regular `.gitkeep` in each context root (reaches the owner under listContextTasks). The file has 206 tests, all passing.

## Class table (READ-1, the task and notes positions), final state

| Site | Final state | Covered by |
|------|-------------|------------|
| context-io.ts readRawNotesWithSkips stat with throwIfNoEntry false (embedded in both runnables) | deleted; the walk asks entryPresence; a dangling link or ENOTDIR throws, which is a failed task | daefd0c0: CR-03 sequences (both roots), context-io walk cases, mutation (a) |
| trace-render.ts readTask realpathSync(notesDir), ENOENT read as no notes | deleted; one call `readTaskNoteRefs(task, real, root)` | df44fb97: census, CR-03 and CR-04 sequences, mutation (c) |
| state-check.ts readTraceTask, the same realpath decision | deleted; `readTaskNoteRefs(task, contextReal, root)` | df44fb97: census, state-check CR-03 and CR-04 rows |
| trace-render.ts listTasks Dirent filter (CR-04) | generated listContextTasks inside the CR-02 try | df44fb97: CR-04 sequences, task-position shapes, mutations (b), (d) |
| state-check.ts traceReport listTasks Dirent filter | the same generated listing | df44fb97: state-check CR-04 rows |
| the walk's readdirSync | unchanged, under the notes directory path | read-sites `readRawNotesWithSkips:readdirSync#0` |
| the walk's `.md` name filter | unchanged, not in the class (the writer publishes only `<id>.md`) | none needed |
| the walk's `vanished` arm | unchanged, compliant | 37-21 arm table |
| trace-model.ts collectTraceNotes, traceReadFailures, planCompleteTraceTree | unchanged; refused entries reach them as failed tasks | CR-04 sequence |
| every other position (context roots and ancestors, including state-check `locate`, IN-10; state and trace directories; trace files; the index; state-roll; the sibling-stamp read) | not changed here | plans 37-29 (trace-render, state-check) and 37-30 (state-roll) |
| scripts/validate-agent-factory.ts statAt, textAt, namesAt, canonicalBase | out of round 2 scope | 37-32 Task 3 (deferred-items.md entry) |

## Rewritten tests

None. Running trace-render.test.ts (71) and state-check.test.ts (114) whole after Task 2 found no test whose expectation depended on a link or non-directory entry being silently dropped. The plan 37-21 readContext EACCES case is unchanged and still passes (code EACCES, now carried on the error by `codedError`).

## Census edits

- `scripts/context-io-writer-set.test.ts`: the node:fs binding count went from 15 to 17 with a dated classification line. `lstatSync` is a read that never opens the path, and `Stats` is type-only. This edit is in Task 1 (see Deviations).
- `scripts/nonblocking-reader-parity.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/generate-runnable-embeds.test.ts`: run after both tasks and needed no edit. Their only failures are the 37-BASELINE.md entries.

## Regression comparison

The derived subset was 50 files (the plan's keyword list plus the inventory guard). It ran once on the Task 2 working tree before the commit, with one worker, in 1,129 s: 12 failed, 4,939 passed, 1 skipped.
- 10 of the failures are 37-BASELINE.md entries: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 and 31-29 (7).
- 2 came from the run being on an uncommitted tree. `floor-invariance` asserts that hooks/hook-entry.ts has no uncommitted change. `capture-live` P5 reads the dirty-tree message, which lists `trace-render` file names, and asserts it does not contain "trace". I re-ran both files on the committed tree (df44fb97) and they passed, 212 of 212.
- No failure falls outside the baseline.

Gates on the committed tree all exited 0: `npm run build`, `npm run typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:traceability`, `check-foundation-guards.js`, `check-state-paths.js`, `check-nul-bytes.js` and `state-check.js .` (`trace.compared` true on grugops's own tree).

## Decisions Made

- entryPresence walks every path prefix, including the filesystem root, with one loop. That gives exactly one lstat, one stat and one realpath site, and every site is reachable from the READ-1 fixtures.
- The last component is always stat'ed (see key-decisions). For a non-link entry, `target` is the entry's own stat rather than the same object.
- The repository-root boundary check uses a separator-aware prefix (`isWithin`), so a boundary of `/` works.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The context-io node:fs alphabet census was edited in Task 1, not Task 2**
- **Found during:** Task 1, before the commit
- **Issue:** Adding `lstatSync` and `type Stats` to context-io's node:fs import turned `context-io-writer-set.test.ts` "the filesystem alphabet ... is itself bounded" red (17, not 15). The plan listed that file only among Task 2's conditional files, and a red commit is forbidden.
- **Fix:** I re-classified both bindings with a dated line and changed the count from 15 to 17.
- **Files modified:** scripts/context-io-writer-set.test.ts
- **Committed in:** daefd0c0

**2. [Rule 3 - Blocking] entryPresence stats the last component always, not only when it is a link**
- **Found during:** Task 2, re-deriving read-sites
- **Issue:** With the stat only on links, `entryPresence:statSync#0 via listContextTasks#0` could be reached only through a dot-named link. That link is itself a failed task, which would break the unfaulted baseline. UNREACHED_SITES is pinned at 0.
- **Fix:** The last component is stat'ed whatever it is. For a non-link the stat names the entry itself, and the failure reason names the entry instead of a link. The plan's artifact text said "the same object when the entry is not a link"; the JSDoc now says "the stat of the entry itself". The plan's entryPresence cases are unchanged and pass.
- **Files modified:** scripts/context-io.ts (with regenerated regions)
- **Committed in:** df44fb97

**3. [Rule 3 - Blocking] One prefix loop in place of a separate root lstat**
- **Found during:** Task 1, re-deriving read-sites
- **Issue:** The first draft lstat'ed the filesystem root in a second branch, which was a second lstat site that no fixture can reach.
- **Fix:** One loop over all prefixes, the filesystem root included.
- **Committed in:** daefd0c0

**4. [Rule 3 - Blocking] READ-1 fixtures gained a `taskA/notes` link in Task 1**
- **Found during:** Task 1
- **Issue:** The owner's stat of a link is reached only through a link on a walked path. The runnables walk real paths, so no existing fixture reached it.
- **Fix:** trace-render's and state-check's READ-1 repositories now make `taskA/notes` an in-root link (trace-render through its existing `linkOrSkip`; state-check returns a skip when a link cannot be staged).
- **Committed in:** daefd0c0

---

**Total deviations:** 4 auto-fixed (4 blocking). **Impact on plan:** each was needed to keep a green commit or to keep every derived read site reachable. Nothing outside the plan's scope changed.

## TDD Gate Compliance

Task 2 carries `tdd="true"`, but the plan says "One commit per task ... the RED runs are recorded, never committed alone" and that subjects start with `fix(37-28):` or `test(37-28):`. So there is no separate `test(37-28)` RED commit or `feat(37-28)` GREEN commit. The RED evidence is the recorded runs above. The GREEN state is commit df44fb97. `workflow.tdd_mode` is false, so this is advisory. The RED runs were not passed through the `tdd-red-evidence` classifier. Whether that classifier would accept them is UNKNOWN - verify.

## Issues Encountered

- One header anchor in trace-render.ts did not match on the first edit, because the paragraph continues on the same line. The script stopped before writing either runnable, I corrected the anchors and re-ran it, and the regions and stamps were regenerated afterwards.

## Known Stubs

None.

## Threat Flags

None. The change narrows behavior: a refused entry now stops the render where before it was dropped. T-37-64 (a stray entry stops every render until a human moves it) is accepted in the plan's threat model.

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-29, which covers the remaining READ-1 positions in trace-render and state-check, including IN-10 (state-check `locate` reads a dangling context-root link as absent). entryPresence is exported from scripts/context-io.ts, and that plan can embed it as the context-root presence owner.

## Self-Check: PASSED

- FOUND: scripts/context-io.ts, scripts/runnable-ref/trace-render.ts, scripts/runnable-ref/state-check.ts, scripts/runnable-ref/read-sites.test.ts
- FOUND: daefd0c0, df44fb97 (both ancestors of HEAD)
- Commits measured: `git rev-list --count 07a1d36a..HEAD` = 2

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
