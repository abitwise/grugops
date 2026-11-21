---
phase: 37-overview-board-per-file-records-and-budgets
plan: 41
subsystem: runnables
tags: [context-io, trace-render, state-check, state-roll, read-sites, symlink, gap-closure, D-21]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-37's STRAY_CONTEXT_ENTRY_REMEDY (IN-11); plan 37-35's root-chain locate in state-check; plan 37-38's read-sites shape table; plan 37-40 (round 4, G-37-2)"
provides:
  - "readTaskNoteRefs: a one-component guard, then entryPresence, then the name rule for directories only (WR-14)"
  - "state-check readState: a leaf-link refusal at every state file except the layout marker, with LEAF_LINK_READ_THROUGH as the one named exception (IN-14)"
  - "IN-14 agreement rows across state-check, state-roll and trace-render, with a no-link control and a marker control"
  - "a read-sites state-check position for readState's board, trace index and NFR catalog, with one outcome (exit 2 by name)"
affects: [37-42, 37-REVIEW-DISPOSITION.md, deferred-items.md]

actuals:
  tokens: 17062
  tasks: 2
  commits: 2
plan_head_before: 31bf286ee5c59772dda1e9d5a69c73d021d414c9
plan_head_after: 4e980eb31436b5dbeef3f786f21f106203dcb91e

tech-stack:
  added: []
  patterns:
    - "Ask the entry's own lstat before any name rule; refuse only names that are not one path component before the join"
    - "A read-through exception is a named one-member set in the hand-written part, pinned by a source test"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/context-io.test.ts
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts

key-decisions:
  - "WR-14: readTaskNoteRefs refuses a name that is not one path component (empty, ., .., /, the platform separator, NUL) by assertSafeTask before any join; then entryPresence decides the stray remedy whatever the name; assertSafeTask then refuses only a directory (IN-09 wording unchanged)"
  - "IN-14: state-check readState refuses a live in-root leaf link at the board, the trace index and the NFR catalog with exit 2; LEAF_LINK_READ_THROUGH = {LAYOUT_MARKER_REL} keeps plan 37-04's marker file-follow rule (flagged for the human)"

patterns-established:
  - "One-outcome read-sites branch keyed on a set derived from one named position, never a second hand list"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A stray context-root entry with an out-of-grammar name (regular file, FIFO, live link, dangling link) carries the stray-entry remedy in trace-render and state-check, in both context roots"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#WR-14: a regular file, a FIFO, a live link and a dangling link with out-of-grammar names carry the remedy"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-11: a stray context-root entry is named with its own remedy (13 shapes x 2 roots)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#CR-04 shape rows (10 shapes x 2 roots)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A name that is not one path component is refused by name before any filesystem call"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#WR-14: a name that is not one path component is refused by name before any filesystem call"
        status: pass
    human_judgment: false
  - id: D3
    description: "state-check refuses a leaf link at the board, the trace index and the NFR catalog (exit 2), and never prints a ROLLABLE line pointing at a roll that refuses; the progress file keeps its not-measured finding"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#IN-14 (plan 37-41, D-21) describe (8 rows)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#state-check locate#0 readState cells (3 paths x 5 shapes)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The layout marker keeps plan 37-04's file-follow rule as the one named read-through exception"
    verification: []
    human_judgment: true
    rationale: "D-21 kept the rule and asked that it be flagged for the human; whether the marker should be refused like the board is a human decision"

duration: 50min
completed: 2026-10-27
status: complete
---

# Phase 37 Plan 41: WR-14 and IN-14 (one answer at the leaf) Summary

**The stray-entry remedy is now decided by the entry's own lstat whatever its name (`foo bar.txt` and `foo.txt` get the same answer). state-check now refuses a live in-root link at the board, the trace index and the NFR catalog with exit 2, the same answer state-roll and trace-render give. The layout marker is the one exception, kept by name.**

## Performance

- **Duration:** about 50 min
- **Started:** 2026-10-27T07:40:41Z
- **Completed:** 2026-10-27
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 14

## Accomplishments

- `readTaskNoteRefs` (scripts/context-io.ts) runs in three steps. (1) A name that is not one path component is refused by assertSafeTask before any join. (2) entryPresence decides, with its four arms unchanged. (3) assertSafeTask refuses a directory whose name the writer never creates (the IN-09 wording is byte for byte the same). There is no second copy of TASK_NAME_RE.
- The docblock of readTaskNoteRefs and the stray-entry paragraphs of the trace-render.ts and state-check.ts headers now state this order.
- I regenerated the embeds, the hook manifest and the build. The three runnables' stamps moved together.
- state-check `readState` refuses a leaf link, unless the path is in `LEAF_LINK_READ_THROUGH = new Set([LAYOUT_MARKER_REL])`. The new message reads `cannot use the <what> <rel>: it is a symbolic link, and state-check reads no state file through a link at its own path (state-roll and trace-render refuse it too); replace the link with the file it points to.` I updated the header's "file leaf rules" sentence, which plan 37-35 had written as "the marker, the board and the indexes follow an in-root link", and readState's docblock.
- read-sites has one state-check position for readState's three paths. Those paths have one outcome (exit 2, empty stdout, stderr naming the path), keyed on a set derived from that position.

## Task Commits

1. **Task 1 (tracer): WR-14** - `46840428` (fix)
2. **Task 2 (TDD): IN-14** - `4e980eb3` (fix)

The RED tests and the implementation of each task went into one commit, because a red commit is forbidden. The RED transcripts below were recorded before the implementation.

## RED transcripts

**Task 1, unit** (`npx vitest run scripts/context-io.test.ts -t "readTaskNoteRefs"`, before the reorder): `Tests 3 failed | 12 passed`.
- `WR-14: a regular file, a FIFO, a live link and a dangling link ...`: `foo bar.txt: expected 'context-io: invalid task name "foo bar.txt" — must match ...' to be 'it is not a directory, so it is not a task'`
- `WR-14: an out-of-grammar name with nothing on disk reads as vanished`: received the invalid-task-name refusal
- the rewritten 37-28 row: `gone name` received the invalid-task-name refusal, not `it was listed and is no longer there`
- `WR-14: a name that is not one path component ...` passed at HEAD, as expected: it guards the reorder.

**Task 1, programs**: trace-render.test.ts `-t "IN-11"` gave `Tests 8 failed | 27 passed`. Those are the 4 new shapes in 2 roots, e.g. `UNREADABLE TASK .grugops/context/foo bar.txt: context-io: invalid task name "foo bar.txt" — must match ^[A-Za-z0-9._-]+$ (...)` with no remedy. state-check.test.ts `-t "CR-04"` gave `Tests 8 failed | 15 passed`. Its note was `this task's notes could not be read (context-io: invalid task name "foo bar.txt" ...); the render refuses to run until they can be read`.

**Task 2** (`-t "IN-14"`, before the readState change): `Tests 4 failed | 4 passed`.
- board link: `status 1`, stdout holds `FINDING memory-bank/plans/board.md:29: 21 rows ... (BUDGETS.doneRows)` and `ROLLABLE  done: 21 rows ... — run node tools/grugops/state-roll.js <root>`. This is IN-14 reproduced: state-roll exits 2 on the same tree.
- trace index link: `status 2` with `Error: the trace file memory-bank/plans/traceability.md is present and is not a regular file` (the later readTraceText refusal), not the leaf-link refusal
- NFR catalog link: `status 1`, read through, ROLLABLE lines printed
- read-through list source pin: no declaration found
- The no-link control, the progress row, the marker control and the skip count passed at HEAD.

## Mutation transcripts (recorded, never committed)

1. **WR-14:** I moved `assertSafeTask(task)` back above entryPresence and regenerated the embeds. context-io `-t WR-14` gave `2 failed | 2 passed`: the four-shape row and the vanished row. trace-render `-t "foo bar"` gave `2 failed`, both roots. state-check `-t "foo bar"` gave `2 failed`, both roots. I restored the file and regenerated, and both freshness gates passed.
2. **IN-14, check removed:** I made the readState leaf-link condition never true (`&& rel === "MUTATION-1-never"`; a `false &&` form did not type-check, so tsc did not emit and that first attempt is void). state-check `-t IN-14` gave `3 failed | 5 passed`: board, trace index and NFR catalog. The trace-index row's stderr then said `the trace file memory-bank/plans/traceability.md is present and is not a regular file` instead of naming a symbolic link. read-sites gave `2 failed | 594 passed`: the `memory-bank/plans/board.md: link to a regular file` and `memory-bank/plans/nfr-catalog.md: link to a regular file` cells. As the plan predicted, the trace-index cell stays green under this mutation, because readTraceText refuses it later with exit 2 naming the path.
3. **IN-14, board added to the read-through list:** state-check `-t IN-14` gave `2 failed`: the board row and the source pin. read-sites `-t board.md` gave `1 failed`: the board `link to a regular file` cell. I restored the file and rebuilt. `grep -c MUTATION` gave 0 in state-check.ts and state-check.js.

## Rewritten tests (premise changed by the reorder, same strength)

| Test | Old expectation | New expectation |
|------|-----------------|-----------------|
| context-io.test.ts `readTaskNoteRefs refuses a link entry, a regular file, a FIFO and a vanished entry` (37-28) | `bad name`, nothing on disk, gives `invalid task name` | a planted directory `bad name` gives `invalid task name`; an absent `gone name` gives `it was listed and is no longer there` |
| context-io.test.ts `a vanished entry and a refused name carry no remedy` (37-37) | `my task`, nothing on disk, matches `/invalid task name/`, no remedy | a planted directory `my task` gives the exact IN-09 message byte for byte, no remedy (stronger: exact match instead of a regex) |
| state-check.test.ts CR-04 shape row regex | escaped only `.` in the entry name | escapes every regex metacharacter (the new names hold spaces and parentheses) |

trace-render.test.ts's IN-09 control (`my task` directory, wording byte for byte) is unchanged and green.

## Moved pins

- trace-render.test.ts `STRAY_SHAPES`: 9 -> 13 (dated 2026-10-27). The rows follow as 13 shapes x 2 roots = 26, and the skip count is 0 on darwin.
- state-check.test.ts `CR04_SHAPES`: 6 -> 10. Its new count test asserts `cr04RowsRun == 10 x 2` and 0 skips on darwin and linux. That table was not counted before.
- state-check.test.ts IN-14: `in14LinksStaged + in14LinksSkipped == 5`, and 0 skips on darwin and linux.
- read-sites.test.ts `SHAPE_ROW_COUNT`: 235 -> 245. Dated breakdown: trace-render 93 (unchanged) + state-check 114 + state-roll 38 (unchanged). state-check's 114 is the 36 shared cells, the root chain 7x6, a trace file 1x5 (the index left that position: -5), readState's board, trace index and NFR catalog 3x5 (+15), the extra trace file 1x5, the marker 1x5 and the siblings 2x3. Net +10. The skip count is 0 on darwin. The base fixture is `trace` (shapeTraceRepo), which holds all three files.

## Sibling table 1: assertSafeTask calls (`git grep -n "assertSafeTask("`)

| Site | Before an lstat decision on a listed entry? | Covered by |
|------|---------------------------------------------|------------|
| context-io.ts readTaskNoteRefs step 1 (one-component guard) | before; it is the guard, and it makes no filesystem call | context-io.test.ts `WR-14: a name that is not one path component ...` |
| context-io.ts readTaskNoteRefs step 3 (IN-09) | after entryPresence (fixed by this plan) | context-io.test.ts `WR-14: a directory with an out-of-grammar name ...`; trace-render.test.ts IN-09 control |
| context-io.ts readRawNotesWithSkips | after: it is reached from readTaskNoteRefs only for a directory that already passed step 3; other callers pass a caller-supplied task | context-io.test.ts walk cases |
| context-io.ts composeValidatedNote, promoteAdmitted, emitVerdict, admit, render, admitAndAppend | not a listed entry: a caller-supplied task name on the write and admission paths, checked before any join (out of D-21's scope) | the existing T-20-01 path-traversal cases |
| trace-render.ts and state-check.ts generated regions (readRawNotesWithSkips, readTaskNoteRefs, both steps) | the same as the owner: these are generated copies, and freshness:runnable-embeds is green | the program rows above |
| scripts/claim.ts (its own assertSafeTask, two calls) | not a listed entry: a claim's task argument (out of D-21's scope; a separate copy of the name rule, listed for the round gate) | claim tests |

## Sibling table 2: state files and a live in-root link at the file itself

| Runnable | State file | Read site | Before | After | Covered by |
|----------|------------|-----------|--------|-------|------------|
| state-check | layout marker | readState | read through | read through (LEAF_LINK_READ_THROUGH, flagged) | state-check.test.ts `CONTROL, file leaf rule kept ...` (unchanged) and `IN-14 CONTROL: the layout marker ...`; read-sites file-follow position |
| state-check | board | readState | read through | refused, exit 2 | IN-14 board row; read-sites readState position |
| state-check | trace index | readState, then readTraceText | refused later by readTraceText (exit 2, "not a regular file") | refused at readState, exit 2 | IN-14 trace-index row; read-sites readState position |
| state-check | NFR catalog | readState | read through | refused, exit 2 | IN-14 NFR row; read-sites readState position |
| state-check | progress file | sizeFinding (lstat), then readState only if measured | not-measured finding | unchanged; readState now also refuses if the file changes between the two reads | IN-14 progress row |
| state-check | tickets, NFR files, trace files (sizes) | sizeFinding | not-measured finding | unchanged | `CONTROL, file leaf rule kept: a link at a ticket file ...` |
| state-check | trace files (compare) | readTraceText | refused, exit 2 | unchanged | read-sites `a trace file` and `an extra trace file` positions |
| trace-render | trace index, trace files | regularFileAt (pre-write check), readText | refused, exit 2 | unchanged | read-sites trace-render file positions; IN-14 trace-index row |
| state-roll | board, progress file, Done archive, progress archive | readTextOrThrow | refused, exit 2 | unchanged | state-roll.test.ts `a symlinked board is refused`; read-sites state-roll file positions; IN-14 board and progress rows |

After this plan, the only read-through at a leaf is the marker in state-check.

## Verification

- `npm run -s freshness:runnable-embeds`, `npm run -s freshness:hook-manifest`, `npm run -s check:build-parity` (after each commit) and `npm run -s typecheck` all exit 0.
- `node scripts/runnable-ref/state-check.js .` on grugops's own tree printed `No findings.` and exited 0.
- Task 1 mid run (14 files: context-io, generate-runnable-embeds, trace-model, scripts/trace-render, runnable-exit-contract, read-sites, state-roll, admission-guard and the census set) gave `27 failed | 2532 passed`. Nine of those failures are 37-BASELINE.md cases. The other 18 were scripts/nonblocking-reader-parity.test.ts: `ENOENT ... mkdtemp '<repo>/.temp/31-27-parity-XXXXXX'`, because the `.temp/` directory did not exist. Plan 37-40 had removed `.temp`. A later test in the same run created `.temp/` again (empty), and nonblocking-reader-parity then passed alone (26/26). This was not caused by this plan.
- The plan-final run covered 47 files: every `*.test.ts` that names a changed basename (context-io, trace-render, state-check, state-roll, hook-entry, read-sites), with scripts/e2e excluded, plus the census set. It took 25m52s and gave `Test Files 2 failed | 45 passed; Tests 9 failed | 5560 passed | 1 skipped`. All 9 failures are 37-BASELINE.md cases: context-io 31-23 PROBE 5 and 31-29 (7), and context-io-writer-set 31-14 (2).
- After each vitest run I checked `pgrep -fl vitest`. No orphaned grugops worker was left; the only vitest processes belonged to grugops-examples. The `~/.grugops` mtime stayed at Oct 18.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The CR-04 shape table had no run/skip count**
- **Found during:** Task 1
- **Issue:** The acceptance criterion says "every run or skip is counted". state-check.test.ts's CR04_SHAPES rows returned on a skip with only a warning, and nothing counted them.
- **Fix:** I added `cr04RowsRun` and `cr04RowsSkipped` and a count test (10 shapes x 2 roots, 0 skips on darwin and linux).
- **Files modified:** scripts/runnable-ref/state-check.test.ts
- **Commit:** 46840428

**2. [Rule 1 - Bug] The CR-04 row regex escaped only `.`**
- **Found during:** Task 1
- **Issue:** The new names hold `(`, `)` and spaces, and the line regex would have read the parentheses as a group.
- **Fix:** I escape every regex metacharacter.
- **Commit:** 46840428

**3. [Rule 2] The state-check header still said the board and the indexes follow an in-root link**
- **Found during:** Task 2
- **Issue:** Plan 37-35's sentence at state-check.ts lines 106-107 contradicted the new rule.
- **Fix:** I rewrote it to name the marker as the one read-through, flagged.
- **Commit:** 4e980eb3

No conditional file was touched: state-roll.test.ts is unchanged. The IN-14 rows sit in state-check.test.ts and run state-roll.js from a host copy. state-roll.ts and state-roll.js changed only by the generator (region and stamp).

## For the round gate (plan 37-42)

- **Marker rule flag (D-21):** the layout marker is still read through an in-root link at its own path. It is the one member of `LEAF_LINK_READ_THROUGH` in state-check.ts, and no other runnable reads the marker. A human decides whether to keep it.
- **Outside-root leaf link (observation, not in D-21):** a leaf link to a regular file OUTSIDE the root, at the board or an index, is still state-check's `outside` finding (exit 1, not measured, never read). state-roll and trace-render refuse the same path with exit 2. Nothing is read through, so no ROLLABLE line is printed for the board. Still, the exit codes differ: this is one more case of the IN-14 class, and it goes to deferred-items.md.
- **Separate name-rule copy:** scripts/claim.ts keeps its own assertSafeTask (TASK_NAME_RE). It is outside D-21's scope, and it is a second copy of the name rule (AUTH-1).
- **`.temp/` premise:** scripts/nonblocking-reader-parity.test.ts needs `<repo>/.temp/` to exist, and 37-40's cleanup removed it. The run here passed only because another test created the directory again. That test's premise is environmental, and it goes to deferred-items.md.

## Known Stubs

None.

## Threat Flags

None. The change adds no new surface: T-37-97, T-37-98 and T-37-99 are mitigated as planned (the rows and the mutation proofs are above).

## Self-Check: PASSED

- FOUND: scripts/context-io.ts, scripts/runnable-ref/state-check.ts, scripts/runnable-ref/read-sites.test.ts
- FOUND: 46840428, 4e980eb3 (ancestors of HEAD)
