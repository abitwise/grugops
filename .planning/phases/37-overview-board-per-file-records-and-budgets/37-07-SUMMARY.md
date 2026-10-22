---
phase: 37-overview-board-per-file-records-and-budgets
plan: 07
subsystem: traceability
tags: [trace-render, trace-model, host-runnable, check-mode, hand-written-refusal, case-fold, split-03]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-06: scripts/trace-model.ts (planTraceTree, TRACE_GENERATED_HEADER), the write-mode host runnable scripts/runnable-ref/trace-render.ts and its EMBED_SPECS row"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-03: scripts/generate-runnable-embeds.ts and the runnable-embeds freshness gate"
provides:
  - "scripts/trace-model.ts: ownedTraceEntries (the trace tree's record rule), caseFoldCollisions, isGeneratedTraceText, compareTraceTree (takes the text reader and the directory lister) and TRACE_FILE_MAX_BYTES"
  - "scripts/runnable-ref/trace-render.js `<repo-root> [--check]`: --check is read-only and exits 0 fresh, 1 naming each missing, extra, changed or hand-written file, or 2 could not run"
  - "The write mode refuses (exit 1, nothing written) a hand-written index or trace file and two identifiers that fold to one file name; it removes extra generated files and writes only missing and changed files"
affects: [37-08, 37-09, 37-13, 37-18, 37-19]

actuals:
  tokens: 15540
  tasks: 1
  commits: 2
plan_head_before: 0a7c33dc296ccbab32173071fa71a7847f6c7a17
plan_head_after: d64ecc809b9ef1d8701edafc46e74999fa1bccfc

tech-stack:
  added: []
  patterns:
    - "A host runnable acts only on the sets the model's comparison returns; it never lists the directory it writes into on its own"
    - "A file is the renderer's to replace or remove only when its first line is the generated header; every other file stops the run before the first write"
    - "On a case-insensitive disk, removals run before writes, so removing a stale name cannot delete a file just written under another case"

key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-model.test.ts
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js

key-decisions:
  - "compareTraceTree takes the index path and the trace directory as two more parameters (plan, repoRoot, io, traceabilityRel, traceDirRel). The model imports nothing, so the state paths are passed in, as planTraceTree already does"
  - "A collision or a hand-written file is exit 1 in both modes, with the summary line still printed. The write mode writes nothing on either finding. --check adds MISSING, EXTRA and CHANGED lines"
  - "The write mode writes only the missing and changed files (from compareTraceTree), so a fresh file keeps its mtime. It removes extra generated files before it writes anything, because on APFS a rename onto `abc-1.md` keeps the old name's case (seen in this plan's RED run)"
  - "A first line equal to the header with a trailing CR still counts as generated, so a checkout that converted line ends does not turn its generated files into hand-written ones"
  - "--check needs only read access to the root. A missing memory-bank/plans/ is exit 2 in both modes"
  - "A trace file is read under TRACE_FILE_MAX_BYTES (8 MiB, in the model) through the embedded non-blocking reader, after an lstat; a FIFO, a link or a directory at a compared path is exit 2 by name and is never opened"

patterns-established:
  - "Read-only check mode for a generated tree: compute the plan, compare it through the shared model, print each difference by path, exit 0 or 1, write nothing"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "ownedTraceEntries keeps names not beginning with `.` in code-unit order (the record rule for the trace tree); caseFoldCollisions groups identifiers whose lower-cased file names collide; isGeneratedTraceText reads the first line only"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#ownedTraceEntries, caseFoldCollisions and compareTraceTree describe blocks"
        status: pass
    human_judgment: false
  - id: D2
    description: "compareTraceTree returns missing, extra, changed and hand-written paths. A keeper is never read; an absent trace directory still compares the index, so a hand-written index fails; a reader refusal propagates"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#compareTraceTree: the one comparison render and state-check share (7 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "--check on the committed .js (host emulation): exit 0 and a fresh line after a render, with bytes and mtimes unchanged; exit 1 naming a deleted file (Edge SPLIT-03 concurrency), an extra generated file and a one-byte change; the zero-row index passes and a hand-written index fails; .gitkeep and .DS_Store are never named or touched in either mode; skip counts by arm and the refused task by name, exit 0; a FIFO at a planned or an unplanned trace path is exit 2 by name"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#trace-render.js --check describe block (9 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The write mode refuses a hand-written traceability.md and a hand-written trace file (exit 1, every byte and mtime unchanged, each named). It removes an extra generated file and reports it. Notes carrying ABC-1 and abc-1 are exit 1 naming both, with nothing written. A ticket re-cased from abc-1 to ABC-1 renders once and is fresh"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#never destroys hand-written content, never folds two tickets into one file (5 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "On this repository's own tree, `node scripts/runnable-ref/trace-render.js . --check` exits 1 and names memory-bank/plans/traceability.md as hand-written. With no argument it exits 2. `git status --porcelain memory-bank` is empty afterwards"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "node scripts/runnable-ref/trace-render.js . --check (exit 1); node scripts/runnable-ref/trace-render.js (exit 2); git status --porcelain memory-bank (empty)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 07: Read-only trace --check and the refusals that protect hand-written content Summary

**`trace-render.js <repo-root> --check` now compares the index and every owned file in the trace directory with a fresh render, through the new `compareTraceTree` in `scripts/trace-model.ts`. It exits 0 when they match and 1 when they do not, naming each missing, extra, changed or hand-written file, and it never writes. The write mode refuses with exit 1, before any write, when the index or a trace file was written by hand or when two ticket identifiers fold to one file name. It removes stale generated files and writes only the files that differ.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-10-22T12:38:27Z
- **Completed:** 2026-10-22T12:50:01Z
- **Tasks:** 1 (TDD: RED commit, then GREEN commit)
- **Files modified:** 8

## Accomplishments

- **The model** (`scripts/trace-model.ts`) gains five exports:
  - `ownedTraceEntries(names)`: the trace tree's one statement of the record rule. It keeps the names that do not begin with `.`, in code-unit order.
  - `caseFoldCollisions(ids)`: groups of distinct identifiers whose lower-cased file names are equal. ID_SHAPE is ASCII-only, so lower-casing is the whole fold.
  - `isGeneratedTraceText(text)`: true when the first line is `TRACE_GENERATED_HEADER`, allowing one trailing CR.
  - `compareTraceTree(plan, repoRoot, io, traceabilityRel, traceDirRel)` returns `{ missing, extra, changed, handWritten }`. `io.readText` is the text reader the 37-06 handoff said was missing, and `io.listDir` lists the trace directory. The raw listing goes through `ownedTraceEntries` first, so a keeper never reaches the read.
  - `TRACE_FILE_MAX_BYTES`: the ceiling a trace file is read under.
- **The host runnable** (`scripts/runnable-ref/trace-render.ts`) runs in this order:
  1. argv: `--check` may come before or after the root. Giving it twice, or any other `--` option, is exit 2.
  2. Collect notes, build rows and plan the tree.
  3. The existing boundary checks.
  4. Compare.
  5. Report the findings.

  In write mode, a finding is exit 1 and nothing is written. Otherwise the run removes the extra set, then writes the missing and changed sets. Every compared path is lstat'ed before it is opened, then read through the embedded `readRegularFileOrNull`. Every printed value goes through `stripControlChars`. The summary line, with counts per skip arm and one `UNREADABLE TASK` line per unreadable task, is printed on every run that does not exit 2.
- **EMBED_SPECS**: the trace-render row gains the five new roots, with a dated (2026-10-22) comment. The region was regenerated, and `runnable-embeds-freshness` reports 2 targets fresh.
- **Censuses**: `context-io-writer-set` and `nonblocking-reader-parity` passed with no change, apart from the 37-BASELINE pair. The embedded writer and reader are still admitted by the generated-region rule, so no census pin moved.

## Task Commits

1. **Task 1 RED: failing cases for --check, the hand-written refusal and case-fold collisions:** `1a1f36a4` (test)
2. **Task 1 GREEN: read-only --check and the refusals:** `d64ecc80` (feat)

**Plan metadata:** recorded in the docs(37-07) completion commit.

## TDD Gate Compliance

- **RED** (`1a1f36a4`): 25 of 61 cases failed. Each of the 15 runnable cases failed on its own assertion; most report the old exit code or `unknown option --check`. The 10 model cases each failed with `TypeError: <name> is not a function`. They read the new exports through a namespace import, so the file still loaded and each target case failed by itself. Semantic assessment: every target ran and failed because the planned behavior was missing. There was no load, syntax or fixture fault. `workflow.tdd_mode` is false, so the RED-evidence classifier was not run.
- **GREEN** (`d64ecc80`): 61 of 61 pass.
- **REFACTOR**: none needed.

## Files Created/Modified

- `scripts/trace-model.ts`, `.js`: the five exports above, plus header notes on the text reader.
- `scripts/trace-model.test.ts`: 10 pure cases, using a fake tree that records every read.
- `scripts/runnable-ref/trace-render.ts`, `.js`: the `--check` mode, the refusals, and removal of extra generated files. The header now states the full D-12 contract. The generated region was regenerated, not edited.
- `scripts/runnable-ref/trace-render.test.ts`: 14 new host-emulation cases. The unknown-option case now uses `--bogus` and also tests a doubled `--check`. A `snapshotWithTimes` helper (lstat first) proves that nothing was written.
- `scripts/generate-runnable-embeds.ts`, `.js`: the trace-render row's new roots.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removing an extra file after the writes could delete the new file on a case-insensitive disk**
- **Found during:** Task 1, RED run.
- **Issue:** On APFS, a re-cased ticket (`abc-1` → `ABC-1`) left the listing as `abc-1.md` after the rename. The rename kept the old name's case. Unlinking the stale `abc-1.md` after writing `ABC-1.md` would have deleted the new file.
- **Fix:** the write mode removes the extra set before it writes. A host case re-cases a ticket and asserts that the directory then holds exactly `ABC-1.md` and that `--check` is fresh.
- **Files modified:** scripts/runnable-ref/trace-render.ts.
- **Committed in:** d64ecc80.

**2. [Plan detail] compareTraceTree takes two path parameters beyond `(plan, repoRoot, io)`**
- The model imports nothing, so it is passed the index path and the trace directory (as `planTraceTree` already is). It also throws when the plan does not hold the index, so it cannot run a vacuous compare.

**3. [Rule 2 - Missing critical] Three checks the action text did not spell out**
- A FIFO, link or directory at an unplanned name in the trace directory is exit 2 by name. The text reader lstats it before opening, as it does for planned paths.
- `--check` needs only read access to the root.
- The write mode writes only missing and changed files and creates the trace directory only when a trace file is to be written, so a fresh tree keeps its mtimes.
- **Committed in:** d64ecc80.

---

**Total deviations:** 3 (1 bug, 1 plan detail, 1 missing critical).
**Impact:** every must-have truth holds. The text-reader clause that 37-06 left open is now met by `compareTraceTree`'s `io.readText`. No write-mode run touched this repository's tree.

## Issues Encountered

None. No vitest run hung, and no vitest process was left running.

## Verification

- `npm run build`, `npm run typecheck`: exit 0.
- Plan verification 1 (10 files, including check-foundation-guards and mode-census): 1311 passed and 9 failed. All 9 failures are in 37-BASELINE: 2 in `context-io-writer-set` (31-14) and 7 in `context-io` (31-23, 31-29). `scripts/trace-render.test.ts` and `scripts/trace-freshness.test.ts` pass.
- `scripts/board-readonly.test.ts` and `scripts/freshness.test.ts`: 227 passed.
- `node scripts/runnable-embeds-freshness.js`: 2 targets fresh. `npm run freshness`: 85 committed `.js` fresh.
- `check-state-paths`, `check-foundation-guards`, `check-nul-bytes` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: all exit 0.
- Acceptance:
  - `node scripts/runnable-ref/trace-render.js . --check`: exit 1, `HAND-WRITTEN memory-bank/plans/traceability.md`.
  - The same script with no argument: exit 2.
  - `git status --porcelain memory-bank`: empty.
- Not run: the full non-e2e suite (project rule: plans 37-08, 37-13 and 37-19 run it).

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-08 can replace this repository's hand-written `memory-bank/plans/traceability.md`. The write mode refuses it while it is hand-written, so 37-08 has to move the old matrix aside on purpose. `--check` on this tree turns 0 only after that.
- Plan 37-09 (state-check) can embed `compareTraceTree` and `ownedTraceEntries` from the same model, so the render and the state check cannot disagree about freshness.
- The runnable is not yet copied into `tools/grugops/` by the installer (plan 37-13).

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All eight modified key files exist, and commits 1a1f36a4 and d64ecc80 are ancestors of HEAD. Every acceptance criterion and plan verification command above passed, apart from the nine 37-BASELINE failures noted.
