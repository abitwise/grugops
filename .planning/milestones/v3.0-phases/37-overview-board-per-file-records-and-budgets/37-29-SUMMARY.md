---
phase: 37-overview-board-per-file-records-and-budgets
plan: 29
subsystem: trace
tags: [read-1, in-10, trace-render, state-check, entry-presence, gap-closure]
status: complete

requires:
  - phase: 37
    provides: "plan 37-28 entryPresence (the one absence owner, embedded in both runnables), plan 37-25 READ-1 EIO table"
provides:
  - "IN-10 closed: trace-render and state-check give one answer to whether a context root is present; a dangling context root or ancestor is exit 2 in the renderer and trace-not-compared in state-check"
  - "Every absence decision of trace-render and state-check goes through the generated entryPresence; ENOENT is compared only inside entryPresence and readRegularFileOrNull (syntax-tree census, pinned 2 and 2)"
  - "A dangling link at any state path is never absent to state-check: exit 2 at a required file or a trace position, an unmeasured finding at a measured file, an unlisted finding at a folder, a runnable-version-skew finding at a sibling program"
affects: [37-30, 37-31, 37-32]

actuals:
  tokens: 22300
  tasks: 2
  commits: 2
plan_head_before: 3eded848b6553e6effbdfaabd320549e4f80b87b
plan_head_after: d34d0d1dc20eb59342d26599626da7c38a211960

tech-stack:
  added: []
  patterns:
    - "state-check's Located carries the owner's entry and target stats, so no caller makes a stat or lstat of its own"
    - "A reader null after the owner said present is a refusal (the file vanished), never absence"
    - "ENOENT census: a syntax-tree scan of the committed .js for === / !== / case comparisons with the ENOENT literal, by enclosing function"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts

key-decisions:
  - "A context root that entryPresence refuses is trace-not-compared in state-check, named by the root, the way an outside root already was; the trace directory, a trace file and the index stay could-not-run (exit 2)"
  - "TR-6 removes the live context root from its fixture, because the owner stats the last component of every path, so the first owner stat under realDirectoryOrNull would otherwise be the live root and not the archive link"
  - "The sibling-program read gives a finding for a reader null after a present answer (vanished), not only for the owner's unreadable"

patterns-established:
  - "Only the owner's absent is missing: every caller maps unreadable to exit 2 or a named finding"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "IN-10: with .grugops/context, .grugops/archive/context, .grugops or .grugops/archive a dangling link after a render, trace-render write and --check exit 2 naming the context root and the unreachable link target, nothing removed; state-check reports one trace-not-compared finding naming the root (exit 1 with the marker, WARN without), never fresh; a live in-root archive link still reads through"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-10: a dangling context root or ancestor is never an absent root"
        status: pass
    human_judgment: false
  - id: D2
    description: "A dangling link at each state path state-check reads (marker, board, both indexes, progress, a ticket, an NFR file, the tickets, NFR, queue-done and decision folders and their archives, a trace file, the trace directory) and at a sibling program is exit 2 or a named finding, never absent"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#READ-1 round 2: a dangling link at a state path is never absent (plan 37-29, D-18, IN-10)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#READ-1 round 2: a dangling link at a planned trace file or at the index is refused by name"
        status: pass
    human_judgment: false
  - id: D3
    description: "One-owner census over the committed trace-render.js and state-check.js: ENOENT compared only in entryPresence and readRegularFileOrNull (2 and 2), no throwIfNoEntry or withFileTypes property"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 one owner (plan 37-29, D-18): ENOENT is compared only inside entryPresence and readRegularFileOrNull"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 EIO table re-derived, both equalities held (12, 15 and 11 read sites), TR-6 re-keyed onto the owner's stat under realDirectoryOrNull"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (194 tests)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#TR-6"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-23
---

# Phase 37 Plan 29: one absence owner for trace-render and state-check (IN-10) Summary

**trace-render's `realDirectoryOrNull` and state-check's `locate` now both ask the generated `entryPresence`, so the two programs give one answer to "is this path present". A dangling `.grugops` link used to make the renderer delete every trace file with exit 0. It is now exit 2, and state-check reports `trace-not-compared`. Every other absence decision in the two runnables goes through the same owner, and a syntax-tree census confirms that ENOENT is compared only inside `entryPresence` and `readRegularFileOrNull`.**

## Performance

- **Duration:** about 30 min
- **Started:** 2026-10-23T21:03:26Z
- **Completed:** 2026-10-23T21:33:51Z
- **Tasks:** 2 of 2
- **Files modified:** 8 distinct paths over two commits

## Accomplishments

- IN-10 closed. For each of `.grugops/context`, `.grugops/archive/context`, `.grugops` and `.grugops/archive` replaced by a dangling link after a render, the write mode and `--check` both exit 2. The message has the form `the context root .grugops/context cannot be inspected: a symbolic link on the path has a target that cannot be reached: ".../.grugops" (ENOENT)`, and the tree digest is unchanged. state-check exits 1 with exactly one `trace-not-compared` finding naming the context root, and without the marker it prints a WARN line. A live in-root link at `.grugops/archive/context` still reads through.
- Every state path is covered. A dangling layout marker, board, trace index or NFR catalog is exit 2 naming the path, so a dangling marker can no longer turn a migrated repository's findings into warnings. A dangling progress file, ticket file or NFR file is an unmeasured finding that carries the owner's reason. A dangling tickets, NFR, queue-done or decisions folder, or its archive, is an unlisted or move-only-unlisted finding. A dangling trace file or trace directory is exit 2. A dangling sibling program is a `runnable-version-skew` finding.
- Every remaining absence decision moved to the owner. Removed: trace-render's pre-write lstat, `readText`'s lstat and ENOENT arm, and `listDir`'s ENOENT arm; state-check's `locate` realpath, the `readState` stat with `throwIfNoEntry: false`, the `sizeFinding` lstat, the `traceDirectory` stat and the `readTraceText` lstat. A reader that returns null after the owner said "present" is now a refusal (the file vanished), never absence.
- New census `READ-1 one owner (plan 37-29, D-18)` in read-sites.test.ts. Over each committed .js it finds every `===`/`!==`/`==`/`!=` with an ENOENT literal operand and every `case "ENOENT":`. Each must sit in `entryPresence` or `readRegularFileOrNull`, and the counts are pinned: trace-render 2 (`readRegularFileOrNull:505`, `entryPresence:616`) and state-check 2 (`readRegularFileOrNull:1188`, `entryPresence:1299`). No object-literal property may be named `throwIfNoEntry` or `withFileTypes`. A synthetic program shows that a comment or a message string naming ENOENT does not count and a `case` label does.

## Task Commits

| Task | Commit | Hand-edited sources | Hand-edited tests | Compiled (by `npm run build`) |
|------|--------|---------------------|-------------------|-------------------------------|
| 1: IN-10 end to end (tracer) | `74db6eed` (fix) | 2 (trace-render.ts, state-check.ts) | 4 (trace-render, state-check, read-sites, runnable-exit-contract tests) | 2 (trace-render.js, state-check.js) |
| 2: the other positions and the census | `d34d0d1d` (fix) | 2 (trace-render.ts, state-check.ts) | 3 (trace-render, state-check, read-sites tests) | 2 (trace-render.js, state-check.js) |

Neither commit changed a generated region, an EMBED_SPECS root or scripts/context-io.ts (`freshness:runnable-embeds` was fresh after each build). After Task 1, the tracer feedback gate re-ran the tracer verify on the committed tree (interactive run, end-of-phase mode, automated-only verify): typecheck, freshness:runnable-embeds, freshness, and the 21 IN-10 and state-path rows all passed.

## RED runs (recorded, not committed)

- **IN-10, before Task 1** (committed runnables at 3eded848): `npx vitest run scripts/runnable-ref/trace-render.test.ts -t IN-10` gave 4 failed and 1 passed (the live-link control passed, as a control should).
  - `.grugops` and `.grugops/archive`: the write mode exited 0 with `REMOVED memory-bank/plans/traceability/ABC-1.md: a generated trace file no published note names any more.` and `Rendered the trace: 0 task(s) and 0 note(s) read; ... 1 file(s) written, 1 file(s) removed.`
  - `.grugops/context` and `.grugops/archive/context`: the write mode already exited 2, but with `cannot be resolved (ENOENT)`, which does not name an unreachable link.
  - A scratch run of the same committed .js on all four shapes: state-check exited 1 with `compared=true` and two `trace-stale` findings (the index and ABC-1.md changed or extra), so state-check read the dangling root as absent. For `.grugops` and `.grugops/archive`, `--check` exited 1 with `EXTRA memory-bank/plans/traceability/ABC-1.md`.
  - Semantic assessment: each target ran and failed on its planned assertion (the exit code, or the named refusal) for the IN-10 reason. None was a load or fixture fault.
- **State paths, before Task 1:** `npx vitest run scripts/runnable-ref/state-check.test.ts -t "READ-1 round 2"` gave 15 failed. By the first failed assertion:
  - Marker: exit 0, `No findings.`. The dangling marker ran the check in WARN mode.
  - Board, trace index, NFR catalog: exit 1 with `... is absent` findings.
  - Progress file, tickets folder, NFR folder, queue-done, queue-done archive, decisions, decisions archive: exit 0, `No findings.`, so each was silently clean.
  - Ticket file and NFR file: exit 1, but the note read `its size could not be read (ENOENT)`. These were already findings; they failed only on the owner's reason.
  - Trace file and trace directory: exit 1 with `missing: a fresh render writes it` (trace-stale) where the renderer refuses.
- **Sibling program, on the Task 1 build** (74db6eed): exit 0 with no finding, because the reader's null read as an absent sibling. The two trace-render rows (a dangling link at a planned trace file and at the index) passed before Task 2, as the plan expected: the pre-write lstat already refused them. They are regression rows for the replacement.
- The first draft of the state-path table also asserted "not fresh" on rows that do not touch the trace. That premise was wrong (the trace is genuinely fresh there), so it was dropped. The ancestor reason reads "has a target that cannot be reached", so the shared regex is `/symbolic link .*target (that )?cannot be reached/`. Both corrections came before the GREEN run, and the RED outcomes above hold under the corrected assertions.

## Mutation proofs (working tree only; each restored from a scratch copy, rebuilt, and checked by sha against the pre-mutation files)

| Proof | Mutation | Went red |
|-------|----------|----------|
| (a) | state-check `locate` returns `absent` for the owner's `unreadable` | 19: all four IN-10 dangling rows and all 15 state-path rows. The live-link control and the table-count row stayed green. |
| (b) | a hand-written `if (codeOf(e) === "ENOENT") return null;` in trace-render's `readText` catch | the census: `trace-render.js decides absence outside the owner: expected [ 'readText:1034' ] to deeply equal []` |
| (c) | state-check `readState` returns `absent` for a reader null; run once with `runFaulted`, ENOENT at `readRegularFileOrNull:openSync#0` via `readState`, on a clean repository with the marker | without the mutation: exit 2, `the layout marker memory-bank/plans/.layout was present and then could not be found, so it was not read.` With it: exit 0, WARN mode, the board and both indexes "absent", and `TRACE The trace is fresh` |
| (d) | `runnableSkewFindings` skips an `unreadable` with code ENOENT, as if absent | the sibling-program row. A first attempt that put an unreachable `continue` in the unreadable branch did not type-check and was never built; the third form did build. |

`git status --porcelain scripts/runnable-ref` showed only the plan's own uncommitted edits after each restore, and none after the Task 2 commit.

## READ-1 table: removed (key, via) rows and their replacements

| Removed | Replaced by |
|---------|-------------|
| trace-render `realDirectoryOrNull:lstatSync#0` via `<top>#0`, `<top>#1`, `<top>#2` (Task 1) | `entryPresence:lstatSync#0 via realDirectoryOrNull#0` |
| trace-render `realDirectoryOrNull:realpathSync#0` via the same three | `entryPresence:realpathSync#0 via realDirectoryOrNull#0` |
| trace-render `realDirectoryOrNull:statSync#0` via the same three | `entryPresence:statSync#0 via realDirectoryOrNull#0` (TR-6's new key) |
| state-check `locate:realpathSync#0` via `readState#0`, `sizeFinding#0`, `listDirectory#0`, `traceDirectory#0`, `readTraceText#0` (Task 1) | `entryPresence:{lstatSync,statSync,realpathSync}#0 via locate#0` |
| trace-render `<top>:lstatSync#0` (the pre-write loop, Task 2) | `entryPresence:* via <top>#0` |
| trace-render `readText:lstatSync#0` via `compareTraceTree#0`, `compareTraceTree#1`, `<top>#0` | `entryPresence:* via readText#0` |
| state-check `readState:statSync#0` via `readMarker#0`, `boardFindings#0`, `progressReport#0`, `<top>#0`, `<top>#1` (Task 2) | `entryPresence:statSync#0 via locate#0` (the owner's target stat) |
| state-check `sizeFinding:lstatSync#0` via `directoryFindings#0`, `progressReport#0` | `entryPresence:lstatSync#0 via locate#0` |
| state-check `traceDirectory:statSync#0` via `traceReport#0`, `traceReport#1` | `entryPresence:statSync#0 via locate#0` |
| state-check `readTraceText:lstatSync#0` | `entryPresence:lstatSync#0 via locate#0` |
| (new caller) | `entryPresence:* via runnableSkewFindings#0`, the presence of each sibling program. The existing `readRegularFileOrNull:* via runnableSkewFindings#0` rows stay. |

Pins: 17/20/11 became 14/19/11 after Task 1 and 12/15/11 after Task 2, each with a dated history line. Both two-sided equalities hold and UNREACHED_SITES stays at 0. The callers are named once in `TR_PRESENCE_CALLERS` and `SC_PRESENCE_CALLERS`. A collapsed via loses nothing. The fault-injection preload matches the site line together with the direct caller's line, so a row under `realDirectoryOrNull#0` fires at the first context root, and the injected EIO is exit 2 by name in every mode, as the table requires. The file has 194 tests, all passing.

TR-6 now finds `entryPresence:statSync#0` by its derived key, and its via is the `realDirectoryOrNull` line from `callingSites`. SR-8 (state-roll) is unchanged.

## Class table (READ-1, every absence decision of the three runnables), final state

| Runnable | Site | Final state | Covered by |
|----------|------|-------------|------------|
| trace-render | `<top>` realpath, stat, access of the root | unchanged, compliant | EIO rows; ENOENT rows 37-31 |
| trace-render | realDirectoryOrNull (context roots, state directory, trace directory) | on entryPresence; a dangling path or ancestor is exit 2 by name | 74db6eed: IN-10 rows, TR-6, mutation (a) through state-check |
| trace-render | listTasks, readTask | generated (plan 37-28) | 37-28 |
| trace-render | pre-write loop | on entryPresence | d34d0d1d: trace-position rows, census |
| trace-render | readText | on entryPresence; a reader null is a refusal | d34d0d1d: census, mutation (b); ENOENT rows 37-31 |
| trace-render | listDir | any readdirSync failure is could-not-run | d34d0d1d: census, EIO rows |
| trace-render | unlinkSync, mkdirSync, atomicWrite | writes, out of class | none |
| region (all three) | readRegularFileOrNull open ENOENT null and its comment | behavior unchanged; each trace-render and state-check caller asks the owner first and refuses a null; the comment correction is plan 37-30's | 37-30 Task 2; ENOENT rows 37-31 |
| region (trace-render, state-check) | the walk | entryPresence (plan 37-28) | 37-28 |
| state-check | `<top>` root reads | unchanged, compliant | EIO rows |
| state-check | locate | on entryPresence; `Located` carries `entry`, `target` and the owner's `reason` | 74db6eed: state-path rows, mutation (a) |
| state-check | readState | the owner's target stat; a reader null is could-not-run | d34d0d1d: mutation (c) |
| state-check | sizeFinding | the owner's entry stat; dangling is an unmeasured finding | 74db6eed and d34d0d1d: progress, ticket and NFR rows |
| state-check | listDirectory | absence through locate; dangling is unlisted | 74db6eed: folder rows |
| state-check | confirmListed | unchanged, compliant (decides no absence) | EIO rows |
| state-check | traceDirectory | the owner's target stat; a refused context root is trace-not-compared, a refused trace directory exit 2 | 74db6eed: IN-10 rows, trace-directory row |
| state-check | readTraceTask, listTasks | generated (plan 37-28) | 37-28 |
| state-check | readTraceText | the owner's entry stat; a reader null is could-not-run | d34d0d1d: census, trace-file row |
| state-check | traceReport listDir | unchanged, compliant | EIO rows |
| state-check | runnableSkewFindings | the owner per sibling; dangling or vanished is a runnable-version-skew finding; the own-directory realpath is unchanged (any failure is a finding) | d34d0d1d: sibling row, mutation (d) |
| state-roll | `<top>` reads, post-mkdir realpath (SR-8), realDirectoryOrNull, readTextOrThrow | handed to plan 37-30 | 37-30 Task 1 |
| trace-model.ts, state-rules.ts, trace-freshness.ts | pure or no read site | unchanged, compliant | their own tests |
| validate-agent-factory.ts statAt, textAt, namesAt, lstatAt, canonicalBase | same class, a separate program | out of round 2 scope (D-18), deferred-items.md entry by plan 37-32 Task 3 | 37-32 Task 3 |
| context-io.ts kit-side callers of readRegularFileOrNull | the WR-04 family | out of round 2 scope, see 37-REVIEW-DISPOSITION.md WR-04; deferred-items.md entry by plan 37-32 Task 3 | 37-32 Task 3 |

## Census edits (step 7)

None. scripts/nonblocking-reader-parity.test.ts, scripts/context-io-writer-set.test.ts, scripts/check-foundation-guards.test.ts and scripts/generate-runnable-embeds.test.ts were run after the Task 2 build: 555 passed and 2 failed. The 2 failures are the 37-BASELINE.md entries `31-14 — the register's decline enumeration equals the derived set` (2). The plan removed no import and no counted read call from a hand-written part.

## Regression comparison

The derived subset was 38 files: the plan's keyword list plus the inventory guard, the same as at 45c04b27. It ran once with one worker on the final Task 2 content, before the commit, in 738 s: 4,056 passed, 10 failed, 1 skipped. All 10 failures are 37-BASELINE.md entries: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 (1) and 31-29 (6). No failure falls outside the baseline.

Gates on the committed tree all exited 0: `npm run build`, `npm run typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:traceability`, `check-foundation-guards.js`, `check-state-paths.js` and `check-nul-bytes.js` (each `ALL CHECKS PASSED`), `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` (`ALL CHECKS PASSED`), and `node scripts/runnable-ref/state-check.js .` (`No findings.`, `trace.compared` true).

## Decisions Made

- A context root the owner refuses maps to `trace-not-compared` in state-check, so the rest of the check still reports, the same way an outside root is handled. A refused trace directory, trace file or index stays could-not-run. This is the plan's flagged assumption, applied as written.
- `realDirectoryOrNull`'s refusal reads `<what> cannot be inspected: <owner reason>.`. The owner's reason already carries the errno code in parentheses.
- The state-path table also covers the decisions folder and its archive. The plan named only the queue-done pair, but all four go through the same `moveOnlyReport` and `listDirectory` (brief §2.1: test the whole class).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The TR-6 fixture removes the live context root**
- **Found during:** Task 1, re-keying TR-6
- **Issue:** The owner stats the last component of every path. So a fault at `entryPresence:statSync#0` under `realDirectoryOrNull` would fire first at the live context root, not at the archive link that TR-6 is about. TR-6's assertion names `.grugops/archive/context`.
- **Fix:** TR-6 now removes `.grugops/context` from its fixture. The owner's first stat under realDirectoryOrNull is therefore the archive link's follow-up stat, and the row still asserts exit 2 naming the archive root with `(EIO)`. The via comes from `callingSites`, never from a line lookup.
- **Files modified:** scripts/runnable-ref/runnable-exit-contract.test.ts
- **Committed in:** 74db6eed

**2. [Rule 2 - Missing critical] A sibling program that vanished after the owner saw it is a finding**
- **Found during:** Task 2
- **Issue:** The plan named the owner's `unreadable` as the sibling finding. A reader null after a `present` answer would otherwise still read as "absent sibling", which is the same READ-1 hole one step later.
- **Fix:** That null is a `runnable-version-skew` finding with "it was present and then could not be found". The header's SIBLINGS paragraph says so.
- **Files modified:** scripts/runnable-ref/state-check.ts (and .js)
- **Committed in:** d34d0d1d

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical). **Impact on plan:** both keep a row on its intended site or close a READ-1 arm of the same class. Nothing outside the plan's files changed.

## TDD Gate Compliance

Task 2 carries `tdd="true"`, but the plan says "One commit per task ... the RED runs are recorded, never committed alone", with subjects `fix(37-29):`. So there is no separate `test(37-29)` RED commit or `feat(37-29)` GREEN commit. The RED evidence is the recorded runs above, and the GREEN states are 74db6eed and d34d0d1d. `workflow.tdd_mode` is false, so this is advisory. The RED runs were not passed through the `tdd-red-evidence` classifier, so whether it would accept them is UNKNOWN - verify.

## Issues Encountered

- `pgrep -fl vitest` showed an unrelated `vitest run --project unit --project web` process. It did not belong to this plan's runs and was left alone.

## Known Stubs

None.

## Threat Flags

None. T-37-65 and T-37-66 are mitigated as planned. The change only narrows behavior: a path that read as absent is now refused or named.

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-30, which puts state-roll's realDirectoryOrNull and readTextOrThrow on entryPresence, corrects the readRegularFileOrNull comment, and extends the ENOENT census (`ONE_OWNER_RUNNABLES`, `ENOENT_COMPARISONS`) to state-roll.js.

## Self-Check: PASSED

- FOUND: scripts/runnable-ref/trace-render.ts, scripts/runnable-ref/state-check.ts, scripts/runnable-ref/read-sites.test.ts, scripts/runnable-ref/runnable-exit-contract.test.ts
- FOUND: 74db6eed, d34d0d1d (both ancestors of HEAD)
- Commits measured: `git rev-list --count 3eded848..d34d0d1d` = 2

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
