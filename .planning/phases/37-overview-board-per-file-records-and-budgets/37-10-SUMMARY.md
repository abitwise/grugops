---
phase: 37-overview-board-per-file-records-and-budgets
plan: 10
subsystem: state-budgets
tags: [host-runnable, state-roll, done-archive, line-conservation, rollback, runnable-embeds, split-06, split-01]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-01: the Done archive contract (memory-bank/plans/archive/board-done.md, one `## Done (WIP unlimited)` heading, newest first) and BOARD_DONE_ARCHIVE_REL"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plans 37-03, 37-05, 37-06 and 37-09: the embed generator, the import-free scripts/state-rules.ts, the writer runnable conventions (trace-render) and the generated-region census rule"
provides:
  - "scripts/state-rules.ts: planDoneRoll, planArchiveInsert, assembleRoll, checkConservation, executeRoll (injected io), doneArchiveSkeleton and DONE_ARCHIVE_HEADING"
  - "scripts/runnable-ref/state-roll.ts and its committed .js: `node state-roll.js <repo-root> [--dry-run]`, D-12 exit 0/1/2"
  - "a third EMBED_SPECS row (EMBED_SPEC_COUNT 3)"
affects: [37-11, 37-12, 37-13, 37-19]

actuals:
  tokens: 39870
  tasks: 1
  commits: 1
plan_head_before: 09f132168cae233a0f75b16d5b954c9caad6121b
plan_head_after: a11c18f9d150b8f3db70c814431c793d8f336ea1

tech-stack:
  added: []
  patterns:
    - "A writer runnable's executor takes its file operations as a parameter, so the proof and the rollback are unit-tested with a faulty io and the host build plugs in the embedded atomicWrite"
    - "A conservation proof derives both expected files from the texts as read and the plan's lines, never from the plan's own new texts"
    - "Every io read during a roll throws instead of exiting, so a refused re-read still reaches the restore"

key-files:
  created:
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/state-roll.test.ts
  modified:
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/state-rules.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "planDoneRoll takes the board's three forms (BoardTexts) and its parse, not the raw text alone: state-rules.ts imports nothing, so it cannot blank comments itself, and a moved row that carries any part of an HTML comment is refused rather than moved"
  - "A board with two columns named Done is refused (the newest rows of two columns have no order). An archive that does not carry exactly one column headed `## Done (WIP unlimited)` is refused and never guessed at"
  - "Moved rows are copied as the raw lines they are, `\\r` included. A created archive's heading takes the moved rows' line ending; rows moved from a CRLF board into an existing LF archive keep their `\\r`, so that archive then has mixed line endings"
  - "executeRoll re-reads both files before writing and writes nothing when either differs from what was planned. A rollback that cannot restore both files is `restore-failed`, which the runnable reports as exit 2 naming both files"
  - "The runnable refuses a symlinked board or archive (a rename would replace the link with a file) and any text holding U+FFFD (a byte the decoder replaced would not be written back)"
  - "The archive directory is created only in write mode, under a parent whose realpath is inside the root, and removed again (when empty) after a rollback or a changed-file refusal"

patterns-established:
  - "Host writer runnables: plan in the import-free rules module, execute through an injected io, prove by re-read, restore byte for byte"

requirements-completed: [SPLIT-06, SPLIT-01]

coverage:
  - id: D1
    description: "planDoneRoll over 23 Done rows with keep 20 returns rows 21-23's line numbers, identifiers and exact raw texts; 20 rows, 0 rows or no Done column return none; CRLF texts keep their \\r and the byte-order mark stays on line 1"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#planDoneRoll: the Done rows past BUDGETS.doneRows (D-07)"
        status: pass
    human_judgment: false
  - id: D2
    description: "planArchiveInsert(null, rows) creates one `## Done (WIP unlimited)` heading with the rows directly under it in order; over an existing archive the new rows go above the older ones; a wrong heading, a second column or a comment-opening heading is refused"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#planArchiveInsert: the moved rows go to the top of the Done archive (D-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "checkConservation names a board with an extra line, a left-behind row or a changed byte, an archive missing or doubling a row, an absent file, and a plan whose texts are not the board's lines as read"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#checkConservation: the line-conservation proof (D-08)"
        status: pass
    human_judgment: false
  - id: D4
    description: "executeRoll with an io whose second read of the board returns one extra line reports a mismatch and restores both files to their old bytes, removing an archive it created; a throwing board write restores both; a changed board writes nothing; a failed restore is restore-failed"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#executeRoll: archive first, board second, proof, and a byte-exact rollback (D-08)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The committed state-roll.js copied alone into an empty temp dir, over a temp repo with 23 Done rows, exits 0, leaves 20 rows on the board and 3 at the top of a new archive, and every other board byte is unchanged; a CRLF board with a byte-order mark keeps CRLF on every remaining line"
    requirement: SPLIT-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — Done rows past BUDGETS.doneRows move to the archive on a host"
        status: pass
    human_judgment: false
  - id: D6
    description: "Refusals on a host are exit 2 with nothing on stdout and nothing written: no or bad arguments, a missing board, a moved row with a comment, a wrong archive heading (its control byte not printed), non-UTF-8 bytes, a symlinked archive directory outside the root, a symlinked board, a FIFO at the archive. --dry-run writes nothing; grugops's own tree dry-runs to exit 0 with `git status --porcelain memory-bank` empty"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — refusals: exit 2, nothing on stdout, nothing written"
        status: pass
      - kind: other
        ref: "node scripts/runnable-ref/state-roll.js . --dry-run (exit 0); node scripts/runnable-ref/state-roll.js (exit 2)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Exit 1 on a host (a proof that fails after a real write, followed by a restore) is not driven through the spawned runnable: no seam injects a faulty io into a spawned process. The runnable's exit-1 branch is the executeRoll `rolled-back` outcome, which the unit cases drive"
    requirement: SPLIT-06
    verification: []
    human_judgment: true
    rationale: "The exit-1 branch in state-roll.ts is a three-line mapping of executeRoll's rolled-back outcome; it is held by review, and the outcome itself is unit-tested with a faulty io"

duration: 25min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 10: state-roll moves old Done rows to the Done archive, proven conserved Summary

**`node state-roll.js <repo-root>` keeps the newest `BUDGETS.doneRows` (20) Done rows on the board and moves every older row, as the raw line it is and in board order, to the top of `memory-bank/plans/archive/board-done.md`. It creates that file with its one `## Done (WIP unlimited)` heading when it is absent. The archive is written first and the board second. Both are re-read, and a line-conservation proof checks them against the texts as read. On a mismatch, both files go back to their old bytes. The rules live import-free in `scripts/state-rules.ts` and reach the host through a third EMBED_SPECS row.**

## Performance

- **Duration:** about 25 min (2026-10-22T14:03:01Z to 14:28:42Z)
- **Tasks:** 1 (the tracer)
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- **The rules (`scripts/state-rules.ts`, still with no import):**
  - `planDoneRoll(texts, model, keep)` returns `none`, `refuse` or `roll`. A roll carries the 1-based raw line numbers, the identifiers and the exact raw lines.
  - `planArchiveInsert(archive | null, texts)` creates the archive or inserts the rows above the archive's first Done row. When the archive has no rows yet, they go directly under its heading.
  - `assembleRoll` builds one `RollPlan`. Lines are removed from the text split on `\n`, so each kept line keeps its `\r`.
  - `checkConservation` derives the expected board and archive from the texts as read and the plan's lines, texts and insert position. It returns the first mismatch by name.
  - `executeRoll(plan, io)`:
    1. re-reads both files and stops if either changed;
    2. writes the archive, then the board;
    3. re-reads both and runs the proof;
    4. on a mismatch or a throw, writes the board back, then the archive, or removes an archive that did not exist before;
    5. re-reads both to confirm the restore.
- **The runnable (`scripts/runnable-ref/state-roll.ts` and its committed `.js`):**
  - It follows the D-12 contract. Exit 0 means rolled and proven, or nothing to roll. Exit 1 means rolled back. Exit 2 means it could not run, was refused, or could not finish a restore. Exit 2 always leaves stdout empty.
  - It imports `node:fs` and `node:path` as namespaces only.
  - Every path goes through realpath and is checked against realpath(root). The board and the archive are lstat'ed before they are opened.
  - Writes go through the embedded `atomicWrite`. The archive directory is created only in write mode.
  - It prints one `MOVED   <id>` line per moved row, then a summary that names the archive path. Every printed value goes through `stripControlChars`.
- **The generator:** a third EMBED_SPECS row.
  - state-layout: `BOARD_REL`, `ARCHIVE_REL`, `BOARD_DONE_ARCHIVE_REL` and `BUDGETS`.
  - state-rules: the five roll functions and `stripControlChars`.
  - board-model: `parseBoard`, `normalizeDocument` and `stripHtmlComments`.
  - context-io: `readRegularFileOrNull` and `atomicWrite`.

  EMBED_SPEC_COUNT moved from 2 to 3 with a dated reason. `runnable-embeds-freshness` reports 3 targets fresh.

## Task Commits

1. **Task 1 (tracer): Done rows past N move to the archive on a host, proven conserved:** `a11c18f9` (feat)

**Plan metadata:** recorded in the docs(37-10) completion commit.

**Tracer gate:** the run is interactive with `end-of-phase` mode, and the tracer's `<verify>` has `<automated>` steps only, so the gate re-ran verify instead of stopping. Build, typecheck, the verify test files and the census set, freshness and the own-tree dry run all passed.

## Files Created/Modified

- `scripts/state-rules.ts`, `.js`: the Done-roll section (the planners, the assembly, the proof, the executor and its io and outcome types). The header now names plan 37-10.
- `scripts/state-rules.test.ts`: 22 unit cases, including the faulty-io rollback cases.
- `scripts/generate-runnable-embeds.ts`, `.js`: the third row, its doc paragraph and the pin.
- `scripts/runnable-ref/state-roll.ts`, `.js`: the runnable. Its generated region was generated, not edited.
- `scripts/runnable-ref/state-roll.test.ts`: 15 host-emulation and source cases.
- `scripts/check-foundation-guards.test.ts`: NON_TEST_MODULE_COUNT moved from 107 to 108, re-derived with `git ls-files`, with a dated reason (2026-10-22, plan 37-10).

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan detail] planDoneRoll takes the board's three forms, not the raw text alone**
- **Found during:** Task 1.
- **Issue:** the plan's signature was `planDoneRoll(rawText, model, keep)`. A row that carries part of an HTML comment cannot be moved safely, because moving it changes which lines the comment hides on both files. Finding such a row needs the comment-blanked text, and `state-rules.ts` imports nothing, so it cannot call `stripHtmlComments` itself.
- **Fix:** the function takes `BoardTexts` (raw, normalized, blanked), the shape `boardBudgetFindings` already takes.
- **Committed in:** a11c18f9.

**2. [Rule 2 - Missing critical] Refusals the action text did not list**
- These are refused: a moved row with a comment, two Done columns, an archive whose only column is not `## Done (WIP unlimited)`, and an archive heading that opens a comment.
- The runnable also refuses a symlinked board or archive (the rename would replace the link) and text holding U+FFFD (a replaced byte would not be written back).
- executeRoll re-reads both files before it writes and writes nothing when either changed since it was planned.
- A failed restore is reported as exit 2 naming both files, never as exit 1.
- **Committed in:** a11c18f9.

**3. [Plan detail] More exports and roots than the plan listed**
- `assembleRoll`, `doneArchiveSkeleton` and `DONE_ARCHIVE_HEADING` are exported beside the four named functions, and checkConservation uses the skeleton for a created archive.
- The EMBED_SPECS row also roots `assembleRoll`, `stripControlChars` and `stripHtmlComments`.

**4. [Plan detail] Census pins**
- `context-io-writer-set` and `nonblocking-reader-parity` admitted the embedded writer and reader by the generated-region rule with no edit.
- `nonblocking-reader-parity` was red only while the new files were untracked, and passed once they were staged.
- Two pins moved, each re-derived with a dated reason: NON_TEST_MODULE_COUNT (107 to 108) and EMBED_SPEC_COUNT (2 to 3). TRIPWIRE_MODULES did not move, because the new test sits under `scripts/runnable-ref/`.

---

**Total deviations:** 4: 1 missing-critical auto-fix and 3 plan details.
**Impact:** every must-have truth holds. The plan's behavior lines are covered.

## Known limitations

- Exit 1 is not driven on a spawned host process. No seam injects a faulty io into it. The `rolled-back` outcome it maps is unit-tested (coverage D7).
- Rows moved from a CRLF board into an existing LF archive keep their `\r`, so that archive ends up with mixed line endings. This is the verbatim rule applied literally. Plan 37-11 or a human may prefer to fold the moved rows to the archive's line ending.
- `--dry-run` prints one summary line. Plan 37-11 adds the PLAN lines for both surfaces.
- Two concurrent rolls are not locked against each other (plan Flagged assumptions). The duplicate refusal lands in 37-11.

## Verification

- `npm run build` and `npm run typecheck` exit 0.
- `node scripts/runnable-embeds-freshness.js` reports 3 targets fresh. After the commit, `npm run freshness` reports 86 committed `.js` fresh.
- `node scripts/runnable-ref/state-roll.js . --dry-run` exits 0 with "Nothing to roll: ... holds 0 row(s)". `node scripts/runnable-ref/state-roll.js` exits 2.
- Acceptance:
  - `grep -cE '^import ' scripts/state-rules.ts` prints 0.
  - With no argument, the runnable exits 2.
  - `git status --porcelain memory-bank` prints nothing after the dry run.
- These guards all exit 0 or report ALL CHECKS PASSED: `check-state-paths`, `check-foundation-guards`, `check-nul-bytes` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`.
- **The end-of-plan run:** one vitest process with 1 worker, over 15 files:
  - the plan's verify list (state-rules, state-roll, generate-runnable-embeds, context-io-writer-set, nonblocking-reader-parity, check-foundation-guards and install/mode-census);
  - the census set (check-state-paths, board-readonly and validate);
  - every other test naming a changed basename (check-claim-anchors, frontmatter, state-check and trace-model);
  - check-uat-oracles, for the lookahead class.

  Result: 1,608 passed and 2 failed. Both failures are the 37-BASELINE pair in `context-io-writer-set` (31-14). There is no new failure.
- Not run: the full non-e2e suite (project rule: plans 37-13 and 37-19 run it). No installer was run, bare `npm test` was never run, no branch was created or switched, and state-roll ran in write mode only against mkdtemp and scratchpad directories. No vitest process was left running.

## Issues Encountered

- Bootstrap order: the runnable was first committed to disk with only the empty region markers, then built and generated, and only then given its hand-written part, so `tsc` never saw an unresolved name.

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-11 can add the progress roll (D-09, with `sectionEndIndex` embedded per D-16), the duplicate refusal, the dry-run PLAN lines and the interrupted-roll re-run. The executor, the proof and the io seam are in place for both surfaces.
- Plan 37-12 reads the archive this plan writes, with the same parseBoard grammar.
- Plan 37-13 materializes `state-roll.js` into `tools/grugops/`. Until then no host runs it (T-37-17).

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All three created and six modified key files exist on disk. Commit a11c18f9 is an ancestor of HEAD, and the ledger counts 1 commit from 09f13216 to a11c18f9. Every acceptance criterion and plan verification command above passed, apart from the two 37-BASELINE failures noted.
