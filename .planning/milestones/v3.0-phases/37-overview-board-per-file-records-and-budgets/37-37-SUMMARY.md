---
phase: 37-overview-board-per-file-records-and-budgets
plan: 37
subsystem: testing
tags: [read-1, in-11, in-09, d-19, stray-entry, remedy, entry-presence, trace-render, state-check]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "listContextTasks and readTaskNoteRefs (37-28: every context-root entry is a task, a keeper or a failed task); the root-chain owner and the regenerated runnables of 37-33 to 37-36"
provides:
  - "STRAY_CONTEXT_ENTRY_REMEDY in scripts/context-io.ts, the one wording for a context-root entry a human must move"
  - "EntryPresence's `unreadable` answer carries `link: boolean`, true only when the path's own lstat showed a symbolic link"
  - "readTaskNoteRefs attaches the remedy to exactly its three non-task refusals (an unreadable link, a present link, a present non-directory)"
  - "TraceTaskFailure.remedy and TraceReadFailure.remedy (string | null), carried and never composed by the trace model"
  - "trace-render prints `; <remedy>` after the UNREADABLE TASK reason; state-check's trace-not-compared note says the entry is not a task and gives the remedy"
  - "the header paragraph ONE STRAY ENTRY STOPS EVERY RENDER (IN-09, IN-11) in trace-render.ts and the same rule in state-check.ts"
affects: [37-38, 37-39]

actuals:
  tokens: 14287
  tasks: 2
  commits: 3
plan_head_before: 74ab9e0d4be0fb5f1285fe2e327f367092d3a435
plan_head_after: 59614c1987cbddd51b9a9fb94b53c22af33e3675

tech-stack:
  added: []
  patterns:
    - "A remedy travels as data: the owner attaches it as an own `remedy` property on the thrown Error, the trace model copies it, the runnables print what is carried and never spell it"
    - "Which failed reads carry the remedy is decided by the entry's own lstat (EntryPresence `link`), never by the reason text"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/trace-model.test.ts
    - scripts/context-io.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "The remedy is an own `remedy` property on the thrown Error (strayEntryError in context-io.ts); collectTraceNotes reads it with Object.hasOwn and keeps it only when it is a non-empty string, so an inherited or non-string value is null"
  - "entryPresence sets `link` to `last && entry.isSymbolicLink()` on the stat failure and to `entry.isSymbolicLink()` on the realpath failure (reached only for the last component); every lstat failure and the ENOTDIR answer are false"
  - "STRAY_CONTEXT_ENTRY_REMEDY reaches both generated regions as a dependency of the embedded readTaskNoteRefs; the generator's EMBED_SPECS rows needed no change"

patterns-established:
  - "Stray-shape table: 9 shapes x 2 context roots, the row count and the platform skip count (0 on darwin and linux) asserted"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A regular file README.md in either context root: write and --check exit 2, nothing written, the UNREADABLE TASK line ends `; <STRAY_CONTEXT_ENTRY_REMEDY>`; state-check's one trace-not-compared finding says the entry is not a task, carries the remedy and never `until they can be read`"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-11: a stray context-root entry is named with its own remedy (README.md rows)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every stray shape in both roots gets the one remedy: FIFO, link to a file, link to an in-root task directory (CR-04), dangling link, self link (ELOOP), and a .gitkeep that is a live link, a dangling link or a FIFO; the dangling and looping rows keep the owner's reason"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-11 (18 shape rows, row and skip count case)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Controls keep their wording: a notes directory at mode 000 and a context root at mode 0444 keep `the render refuses to run until they can be read` with no remedy anywhere; a `my task` directory (IN-09) is byte-identical to the plan 37-36 build's output"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-11 CONTROL rows (6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "entryPresence `link` and readTaskNoteRefs's remedy set, unit level: link true for a dangling link, a self link and a link into a mode-000 directory; false beneath a dangling ancestor link, beneath a regular file and for an entry of a mode-0444 directory; no remedy for a vanished entry, a refused name, a mode-0444 root entry and a notes directory at mode 000"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#entryPresence `link` (6 cases) and readTaskNoteRefs: STRAY_CONTEXT_ENTRY_REMEDY (6 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The trace model carries the remedy and composes none: collectTraceNotes keeps an own non-empty string, traceReadFailures passes it and gives null for a skipped note"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#collectTraceNotes records a thrown value's own string remedy; traceReadFailures passes a failed task's remedy through"
        status: pass
    human_judgment: false
  - id: D6
    description: "state-check text mode prints the remedy on the stray entry's FINDING (and WARN) line"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#IN-11 text mode, and the 12 CR-04 rows"
        status: pass
    human_judgment: false
  - id: D7
    description: "One owner of the wording: the generated regions of the committed trace-render.js and state-check.js declare STRAY_CONTEXT_ENTRY_REMEDY with the owner's string (syntax tree), and neither hand-written part names it"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-11 syntax-tree cases (2)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 37: The Stray-Entry Remedy Summary

**A context-root entry that is not a task directory (a stray README.md, a FIFO, a symbolic link of any kind, a dot-named entry that is not a regular file) is still refused with exit 2 and nothing removed, but both programs now tell the human to move it, from one owner in context-io.ts. Which failed reads carry that remedy is decided by the entry's own lstat, through the new `link` field on entryPresence's unreadable answer.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-10-24T13:11:28Z
- **Completed:** 2026-10-24T13:46:54Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- `STRAY_CONTEXT_ENTRY_REMEDY` (context-io.ts) is `move it out of the context root or remove it: a context root holds only task directories and dot-named keeper files such as .gitkeep`. It is attached, as an own `remedy` property on the thrown Error, to three readTaskNoteRefs refusals:
  - an `unreadable` answer with `link` true; the owner's reason and code are kept
  - a present symbolic link
  - a present entry that is not a directory
- Every other throw carries none: a vanished entry, an `unreadable` answer with `link` false, assertSafeTask's refusal (IN-09), and every failure of the notes walk.
- `EntryPresence`'s `unreadable` variant gains `readonly link: boolean`. Of the four answers, the lstat failure and the ENOTDIR answer are always false. The stat failure is true only for the last component when its own lstat showed a link. The realpath failure is true when the last component is a link.
- The trace model carries `remedy: string | null` on TraceTaskFailure and TraceReadFailure, and composes nothing.
- trace-render prints `UNREADABLE TASK <at>: <reason>; <remedy>`. state-check's note for a failure that carries a remedy is `the trace was not compared: this context-root entry is not a task (<reason>); <remedy>`. Every other failure keeps its note.
- Both headers record the wider block beside IN-09: the trace-render paragraph ONE STRAY ENTRY STOPS EVERY RENDER (IN-09, IN-11), and the same rule in state-check.ts's TRACE FRESHNESS paragraph, naming trace-not-compared.

## Task Commits

1. **Task 1: end-to-end IN-11 in both programs (tracer)** - `56a1f40d` (fix)
2. **Task 2: every stray shape, the controls and the headers** - `c3da9305` (test)
3. **Regression fix: the WIN-2 chmod census pin** - `59614c19` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## Class sites: the remedy a failed task carries (final state)

| Site | Before | After this plan | Test |
|------|--------|-----------------|------|
| context-io entryPresence, the four `unreadable` answers | code and reason | plus `link`: lstat failure false, stat failure `last && isSymbolicLink`, ENOTDIR false, realpath failure `isSymbolicLink` (last component only) | context-io.test.ts `link` cases; mutation (d) |
| readTaskNoteRefs: the present symbolic-link and the present non-directory refusals | a reason only | the reason and STRAY_CONTEXT_ENTRY_REMEDY | IN-11 rows; mutation (a) |
| readTaskNoteRefs: an `unreadable` answer with `link` true (dangling, ELOOP, a target beneath an unsearchable directory; plain and dot-named) | the owner's reason and code | plus the remedy | IN-11 dangling, self-link and .gitkeep-dangling rows; unit cases; mutation (c) |
| readTaskNoteRefs: absent after the listing, an `unreadable` answer with `link` false, the notes walk's failures | a reason only | unchanged (no remedy) | mode-000 and mode-0444 controls, unit cases; mutation (b) |
| assertSafeTask refusal (IN-09) | a reason only | unchanged (IN-09 open) | IN-09 control, byte for byte |
| trace-model collectTraceNotes, traceReadFailures | reason only | `remedy` carried, never composed | trace-model.test.ts cases |
| trace-render couldNotRunIncomplete | reason only | reason, then `; <remedy>` when one is carried | IN-11 rows |
| state-check traceReport trace-not-compared note | one wording for every failure | the carried remedy when present, else unchanged | IN-11 rows, state-check.test.ts CR-04 rows and the text-mode case |
| trace-render and state-check headers | IN-09 not recorded | the wider block recorded beside IN-09 | grep criterion (1) |

The generator needed no change. STRAY_CONTEXT_ENTRY_REMEDY and strayEntryError arrived in both regions as dependencies of readTaskNoteRefs. state-roll's region changed only its stamp line, and hooks/hook-entry was regenerated because it pins context-io.js.

## RED runs

- **Task 1, against the plan 37-36 build (74ab9e0d), `-t IN-11`:** 2 failed (README.md in both roots). The refusal held in both: expectRefusedTask passed, with exit 2, nothing written and one trace-not-compared finding. The failure was the remedy line. The renderer printed `UNREADABLE TASK .grugops/context/README.md: it is not a directory, so it is not a task` with no remedy. A probe of the same build recorded state-check's note: `the trace was not compared: this task's notes could not be read (it is not a directory, so it is not a task); the render refuses to run until they can be read`. That is the reproduced IN-11.
- **Task 2:** the shape rows already passed on the Task 1 build, because Task 1 put the rule on the whole class (the tracer). So RED was taken by running the new rows against the plan 37-36 runnables. The working tree's trace-render.js and state-check.js were swapped for the 74ab9e0d copies and then restored with `git checkout --`.
  - trace-render.test.ts `-t IN-11`: 20 failed and 7 passed. The 18 shape rows and the 2 syntax-tree cases failed. The 6 controls passed on the old build, which is what proves their wording unchanged.
  - state-check.test.ts `-t "CR-04|IN-11"`: 13 failed (12 CR-04 rows and the text-mode case).
  - On the Task 2 build, all 27 IN-11 cases passed, and state-check gave 15 passed.

## Controls' recorded wording (IN-09, from the 37-36 build)

For `<root>/my task` (both roots), write and `--check` stderr:
`Error: the notes could not be read completely (1 task(s) and 0 note(s) could not be read), so the trace was not compared or rendered and nothing was written or removed. The trace render did not run.` then `UNREADABLE TASK <root>/my task: context-io: invalid task name "my task" — must match ^[A-Za-z0-9._-]+$ (no path separators, no .., no absolute paths)`.

The state-check note was `the trace was not compared: this task's notes could not be read (<that refusal>); the render refuses to run until they can be read`. The text stdout was that FINDING line, then the two MOVE-ONLY lines. The control asserts all of it byte for byte (whole result objects), and it passes on both builds.

## Rewritten tests (old to new)

| Test | Old | New |
|------|-----|-----|
| state-check.test.ts CR-04 rows (6 shapes x 2 roots) | note contains `this task's notes could not be read (` | note contains `this context-root entry is not a task (` and STRAY_CONTEXT_ENTRY_REMEDY, and not `until they can be read`. Task 2 adds: the text line holds the entry-not-a-task wording and ends `; <remedy> (trace-not-compared)` |
| trace-model.test.ts collectTraceNotes `toEqual` on failedTasks, and traceReadFailures `toEqual` on a failure | records without `remedy` | each record holds `remedy: null`. The TraceCollection literals at the old lines 439, 475 and 489 also gained `remedy: null`, for typecheck |

No test was deleted or weakened. The trace-render.test.ts CR-04, CR-03 and CR-01 rows were unchanged and still pass: they assert reason substrings that are still present.

## Mutation proofs (working tree only)

Before each mutation, the ten affected source and generated files were copied. Each mutation was regenerated and rebuilt. Each revert restored the copies and rebuilt, `cmp` showed every file equal to its copy, and the embeds and hook manifest were fresh. None was committed.

- **(a) Task 1: the non-directory refusal throws a plain Error (no `remedy`).** The 2 README.md IN-11 rows went red.
- **(b) Task 2: the remedy on every readTaskNoteRefs throw** (a try/catch around the body). 9 went red:
  - the mode-000 control, the mode-0444 control and the IN-09 control, in both roots
  - the unit cases "a vanished entry and a refused name carry no remedy", "an entry of a mode-0444 context root carries no remedy" and "a task whose notes directory is at mode 000 carries no remedy"
- **(c) Task 2: `link` ignored, so only the two present-entry refusals carry the remedy.** 9 went red:
  - the dangling taskD, self-link taskE and dangling .gitkeep rows, in both roots
  - the unit case for the dangling link and the self link
  - the state-check CR-04 dangling-link row, in both roots
- **(d) Task 2: `link` true for every `unreadable` answer.** 6 went red:
  - the mode-0444 control in both roots
  - the three `link` false unit cases (beneath a dangling ancestor, beneath a regular file, an entry of a mode-0444 directory)
  - the readTaskNoteRefs mode-0444 unit case

## Regression run (Task 2 verify, once)

- **Run:** the derived subset was 50 test files. It ran on the committed tree after the Task 2 commit, with `npx vitest run --exclude '**/scripts/e2e/**'` on one worker, in 929 s. 4 files failed; 11 tests failed, 5,498 passed and 1 was skipped.
- **Baseline failures (10, all in 37-BASELINE.md):**
  - canonical-corpus provenance (1)
  - context-io-writer-set 31-14 (2)
  - context-io 31-23 PROBE 5 (1)
  - context-io 31-29: PREMISE, DIRECTION 1 and 2, SEEDED, CONVERSE 1 and 2 (6)
- **Failure outside the baseline (1), caused by this plan and fixed in `59614c19`:** install/mode-census.test.ts "the chmod calls in the scripts tests are the number counted": expected 39, received 47. context-io.test.ts added four mode cases. Each is a denial and its restore in a `finally`, and none sets a mode as evidence. The pin is now 47, with a dated line giving the per-file counts. After the fix, mode-census.test.ts gave 15 passed.
- **Other gates, all exit 0:**
  - build, typecheck, freshness (87 outputs), freshness:runnable-embeds, freshness:traceability and freshness:hook-manifest
  - check-foundation-guards and check-nul-bytes
  - check-state-paths
  - validate.test.ts (194 passed)
  - `node scripts/runnable-ref/state-check.js .`: `No findings.`

## Acceptance criteria

- `npx vitest run scripts/runnable-ref/trace-render.test.ts -t IN-11`: 27 passed and 0 failed (at least 2 required). Every shape row ran, the platform skip count is 0 (asserted on darwin), and the controls passed.
- The phrase `move it out of the context root or remove it` outside the generated region (the awk criterion) prints 0 for both trace-render.ts and state-check.ts.
- The generated regions of the committed trace-render.js and state-check.js each declare STRAY_CONTEXT_ENTRY_REMEDY with the owner's string literal, shown on the syntax tree by a committed test. No hand-written part names the constant, and each reads the carried `.remedy` field.
- `grep -c "ONE STRAY ENTRY STOPS EVERY RENDER (IN-09, IN-11)" scripts/runnable-ref/trace-render.ts`: 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The state-check CR-04 rows were rewritten in Task 1, not Task 2**
- **Found during:** Task 1 (the whole-file run of the related tests)
- **Issue:** Task 1 changed state-check's note for a stray entry, so the 12 CR-04 rows of state-check.test.ts, which asserted `this task's notes could not be read (`, went red. That file is in Task 2's list, and a red commit is not allowed.
- **Fix:** the assertions were rewritten in Task 1's commit (see Rewritten tests). Task 2 added the text-mode assertions to the same rows.
- **Committed in:** 56a1f40d

**2. [Rule 3 - Blocking] install/mode-census.test.ts pin 39 to 47 (a file outside files_modified)**
- **Found during:** Task 2 regression run
- **Issue:** the WIN-2 census counts chmod calls in scripts tests, and the new context-io mode cases added 8.
- **Fix:** the pin is now 47, with a dated line naming each new pair as a denial and its restore.
- **Committed in:** 59614c19

**3. [Note] The syntax-tree acceptance test landed with Task 1, but the Task 2 commit message lists it**
- The Task 2 commit message (`c3da9305`) lists the syntax-tree check among its bullets. The test was in fact committed in `56a1f40d` (Task 1). The history was not rewritten.

**4. [Note] Generator unchanged**
- The conditional generator edit (scripts/generate-runnable-embeds.ts and .js) was not needed: the constant arrived as a dependency. No read-sites pin moved, and read-sites.test.ts passed unchanged (824 passed together with trace-render.test.ts and state-check.test.ts).

**Total deviations:** 2 auto-fixed (both Rule 3, blocking) and 2 notes. **Impact:** no scope change. The census update is required by the new mode cases.

## TDD Gate Compliance

Task 2 is `tdd="true"`. Its RED was not a separate `test(...)` commit before a `feat(...)` commit. The behavior was implemented by the Task 1 tracer, as the plan orders, so the RED evidence is the run of the new rows against the plan 37-36 runnables (20 + 13 failed, see RED runs) and mutations (b) to (d). The single Task 2 commit is `test(37-37)`.

## Issues Encountered

None beyond the deviations.

## For 37-39's deferred-items.md

- **IN-09 stays open** (37-REVIEW-DISPOSITION.md): a task directory with a refused name still blocks every render with the notes wording "until they can be read". That wording does not fit either: the fix is to rename the directory. This plan left it unchanged on purpose (out of round 3 scope).
- **The notes-failure note for an entry whose lstat fails** (a mode-0444 context root) still says "this task's notes could not be read". The task's own entry, not its notes, is what could not be inspected. The wording is unchanged by design (`link` false: it may be a task), and it is recorded here for human triage.

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-38.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*

## Self-Check: PASSED
