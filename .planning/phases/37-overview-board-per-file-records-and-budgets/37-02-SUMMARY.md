---
phase: 37-overview-board-per-file-records-and-budgets
plan: 02
subsystem: state-budgets
tags: [budgets, layout-marker, validator, state-rules, record-rule]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-01: BUDGETS, BUDGET_COUNT, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT and the record and archive paths in install/state-layout.ts"
provides:
  - scripts/state-rules.ts, the import-free owner of all nine budget rules, the record rule and the layout marker reader
  - checkBudgets() in the structure validator, with marker severity routing (D-04, D-05) and the informational LAYOUT line
  - A planter table in validate.test.ts typed over the BUDGETS keys and sized against BUDGET_COUNT
affects: [37-03, 37-04, 37-05, 37-06, 37-13, 37-19, 38]

actuals:
  tokens: 23197
  tasks: 2
  commits: 3
plan_head_before: 8ca725ff11cb1c1249d58854774ac49f697c5dda
plan_head_after: 6afb5d1f83caac6c765ea7f46200cbef2a3fa9bf

tech-stack:
  added: []
  patterns:
    - "Budget rules are pure functions over text or sizes the caller passes in; the validator reads, the rules decide"
    - "Byte budgets on record files are measured from lstat size; a non-regular entry is a finding by name, never opened"
    - "A planter table typed Record<keyof typeof BUDGETS, ...> and counted against BUDGET_COUNT keeps coverage from shrinking"

key-files:
  created:
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/state-rules.test.ts
    - .planning/phases/37-overview-board-per-file-records-and-budgets/37-02-RED-EVIDENCE.json
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "indexLineFindings takes the normalized text as well as the comment-blanked text. stripHtmlComments turns each comment code unit into a space, so measuring the blanked line alone would count a long comment line as a long entry. The rule leaves out each run of spaces under which the source line held a comment."
  - "The marker is checked to be a regular file before it is read, so a FIFO or a directory at the marker path is an invalid marker reported by name, never opened"
  - "doneRows counts the ticket rows of every column named Done together; the finding's line is the first row past the budget"
  - "A trace-file finding names the file stem as the ticket identifier and says to split the ticket's work, not to edit the generated file"

patterns-established:
  - "unmeasuredFinding: a file that cannot be measured is still a finding naming its path and budget, with measured null"
  - "UNITS in state-rules.ts is typed over the budget keys, so a budget added without a unit fails typecheck"

requirements-completed: [SPLIT-04, SPLIT-01]

coverage:
  - id: D1
    description: "scripts/state-rules.ts owns all nine budget rules, the record rule and the marker reader; it imports nothing and names no runtime global"
    requirement: SPLIT-04
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts (61 tests: boundary at and one past each budget, marker states, record rule, AST import-free proof)"
        status: pass
      - kind: other
        ref: "grep -cE '^import ' scripts/state-rules.ts prints 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The validator enforces every BUDGETS key: a warning on an unmarked tree, an error with a valid marker, an invalid marker named; grugops's own tree stays green bare and --strict"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#validate-agent-factory.js — state budgets and the layout marker (plan 37-02, SPLIT-04)"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#validate-agent-factory.js — every BUDGETS key is checked (plan 37-02, D-10, D-11)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict exits 0 with no WARNING or ERROR line"
        status: pass
    human_judgment: false
  - id: D3
    description: "Board budgets for SPLIT-01: board size, ticket-row length in UTF-16 code units, at most one _Updated: line"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#boardBudgetFindings: BUDGETS.boardRowChars / boardUpdatedLines / boardBytes"
        status: pass
    human_judgment: false
  - id: D4
    description: "Record files are measured from lstat size and never opened; a FIFO or directory entry is reported by name; .gitkeep and dot-prefixed .md files are not records"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#a FIFO ending .md in the NFR directory is reported by name in bounded time, never opened"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#a .gitkeep in each of the ticket, NFR and trace directories of a clean fixture is no finding"
        status: pass
    human_judgment: false
  - id: D5
    description: "The reader bounds in scripts/board-model.ts are unchanged"
    verification:
      - kind: other
        ref: "grep of LARGE_BOARD_BYTES = 1_048_576, LONG_LINE_CHARS = 65_536, MAX_META_CHARS = 1_024 in scripts/board-model.ts: 1 each; git diff of board-model.ts over the plan is empty"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 02: State budgets and the layout marker Summary

**All nine budgets now have one owner, `scripts/state-rules.ts`, a pure module with no imports. The structure validator enforces every one of them: a broken budget is a warning on a tree with no layout marker and an error on a tree with a valid `memory-bank/plans/.layout`. An unrecognized marker is a warning that names the marker.**

## Performance

- **Duration:** about 28 min
- **Started:** 2026-10-22T07:44Z
- **Completed:** 2026-10-22T08:12Z
- **Tasks:** 2 (Task 1 tracer, Task 2 TDD)
- **Files modified:** 9 in the task commits (plus the SUMMARY and deferred-items in the docs commit)

## Accomplishments

- **`scripts/state-rules.ts`** (new, with its committed `.js`) exports `markerState`, `formatMarkerWarning`, `boardBudgetFindings` (boardBytes, boardRowChars, boardUpdatedLines), `doneRowFindings`, `indexLineFindings`, `fileBytesFinding`, `unmeasuredFinding`, `formatFinding`, `sortFindings`, `recordEntryNames`, `budgetEntryNames` and `utf8Bytes`. It imports nothing, not even a type, and calls no file-system API. A test parses its syntax tree to check this.
- **The marker reader** follows D-14. It removes one BOM and folds CRLF, then accepts `layout: v3` with or without exactly one trailing newline. Any other content is invalid, and the reason never repeats the content.
- **`checkBudgets()` in the validator** runs after `checkTickets()` and measures:
  - the board: bytes, row lengths, `_Updated:` lines and Done rows;
  - both index files: each line, outside HTML comments;
  - every record `budgetEntryNames` keeps in the ticket, NFR and trace directories, by lstat size;
  - the progress file.
- **Routing.** Findings are sorted, then routed by the marker. If the marker is absent and at least one budget is broken, the validator prints one `LAYOUT` line on stderr. That line is not a warning. grugops's own tree and the seed show no budget findings and no new stderr line.
- **Coverage that cannot shrink.** `validate.test.ts` has a planter table typed `Record<keyof typeof BUDGETS, (dir) => void>`, and a test checks its size equals `BUDGET_COUNT`. Each planter breaks only its own budget. The test asserts the finding names `BUDGETS.<key>`, as a WARNING with no marker and as an ERROR with a valid one. Other tests cover:
  - `.gitkeep` and dot-prefixed `.md` files are never measured, and a record name is;
  - a directory or FIFO entry is reported by name and never opened;
  - two runs over the same tree give byte-identical stderr in sorted order.
- **Pins re-derived by listing.** This changed four test files' pins: NON_TEST_MODULE_COUNT 101 to 102 and TRIPWIRE_MODULES 75 to 76 (check-foundation-guards), SCRIPTS_TEST_FILE_COUNT 75 to 76 (mode-census), and the scripts-scoped import-reader corpus 65 to 66, which also moved its comparison pin to 66 * 3.

## Task Commits

1. **Task 1: tracer, board bytes and the marker end to end:** `0622a2dd` (feat)
2. **Task 2 RED: failing tests for every other budget and the record rule:** `44464bad` (test)
3. **Task 2 GREEN: every budget has one rule and the validator enforces all nine:** `6afb5d1f` (feat)

**Plan metadata:** recorded in the docs(37-02) completion commit.

## TDD Gate Compliance

- RED `44464bad` comes before GREEN `6afb5d1f`. No REFACTOR commit: the GREEN commit already updated the header sentence.
- **RED evidence:** `37-02-RED-EVIDENCE.json`. The classifier verdict is `RED_EVIDENCE_OK` (`target_test_failed`). The target was `doneRowFindings: BUDGETS.doneRows > one row more yields one finding with the measured row count`, which expected length 1 and got 0.
- **Semantic assessment:** the target ran and failed on its planned assertion, because the RED commit held only a signature stub. The full RED run had 16 unit failures and 22 validator failures, every one on an assertion. The control cases passed.
- **Why the evidence uses a single-test rerun:** vitest's `tap-flat` reporter writes multi-line YAML values without indenting them, so the full report is not well-formed TAP. The classifier refused that report as `invalid_record`, so the evidence comes from a rerun of the target test alone.
- **Signature stubs in the RED commit:** the RED commit includes the new exports as stubs. Without them the tests would fail at import, which is not a valid RED.

## Files Created/Modified

- `scripts/state-rules.ts`, `scripts/state-rules.js`: the budget, record and marker rules.
- `scripts/state-rules.test.ts`: 61 unit tests.
- `scripts/validate-agent-factory.ts`, `.js`: `checkBudgets()` and its readers (`readLayoutMarker`, `boardFindings`, `indexFindings`, `sizeFinding`, `directoryFindings`).
- `scripts/validate.test.ts`: the marker and budget validator cases and the planter table.
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts`: the moved pins, each with a dated reason (2026-10-22, plan 37-02).
- `37-02-RED-EVIDENCE.json`, `deferred-items.md`: the RED record and one pre-existing hazard.

## Decisions Made

- **`indexLineFindings(rel, { normalized, blanked }, budgets)`** takes both texts, where the plan's text named only the blanked one. `stripHtmlComments` keeps every comment code unit as a space, so measuring the blanked line alone would count a long comment line as a long entry. That would break the behavior that lines inside comments are never measured. The rule therefore leaves out each run of blanked spaces under which the source held a comment. The only non-comment text it leaves out is whitespace next to a comment.
- **`boardBudgetFindings(rel, { raw, normalized, blanked }, model, budgets)`.** The caller passes all three forms, built with board-model's own `normalizeDocument` and `stripHtmlComments`, so state-rules never restates the comment grammar.
- **The marker, the board and the two index files are checked with `statSync().isFile()` before they are read.** The marker is a new read path, and a FIFO there would otherwise hang the validator. The board and index reads got the same guard. A non-regular file at any of these paths is reported by name.
- **`unmeasuredFinding` and `formatMarkerWarning` were added** to the planned exports. The validator and plan 37-04's state-check can then spell an unmeasured file and an unrecognized marker the same way.
- **doneRows** counts the ticket rows of every column named `Done` together. Its finding points at the first row past the budget.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Regular-file guard on the marker, board and index reads**
- **Found during:** Task 1 and Task 2
- **Issue:** the plan said to read the marker with `stateExists`/`stateRead`. `readFileSync` on a FIFO blocks forever, and checkBudgets reads the marker, the board and both index files on every run.
- **Fix:** `stateIsRegularFile()` (`statSync().isFile()`) runs before each read. A non-regular file becomes an invalid marker, or an unmeasured finding, named by path.
- **Files modified:** scripts/validate-agent-factory.ts
- **Verification:** a test with a directory at the marker path; a test with a FIFO in the NFR directory, which answers in bounded time.
- **Committed in:** 0622a2dd, 6afb5d1f

**2. [Rule 1 - Bug] Index lines are measured outside comments, not on the blanked line**
- **Found during:** Task 2
- **Issue:** described under Decisions Made. A blanked comment line has the same length as the comment.
- **Fix:** `bytesOutsideComments(line, blankedLine)` in state-rules.ts.
- **Verification:** `lines inside an HTML comment are never measured, on their own lines or beside an entry`, and `the part of a line outside a comment is still measured`.
- **Committed in:** 6afb5d1f

**3. [Rule 3 - Blocking] Two more census pins moved**
- **Found during:** Task 1
- **Issue:** the plan named three pins. check-foundation-guards also pins the scripts-scoped import-reader corpus (65) and its comparison count (65 * 3), and both went red when the new module landed.
- **Fix:** both re-derived by listing (`ls scripts/*.ts` minus tests: 66), with dated reasons.
- **Committed in:** 0622a2dd

**Total deviations:** 3 auto-fixed (1 missing critical, 1 bug, 1 blocking). **Impact:** no scope change. The pin dates say 2026-10-22, the day the pins were re-derived, not the plan's 2026-10-21.

## Issues Encountered

- New `.ts` files fail two census tests in validate.test.ts until git tracks them. Staging the files cleared both.
- Vitest loads the committed `.js` twin, so the first RED run showed `is not a function` errors until `npm run build` ran. The RED evidence was taken after the rebuild.
- **Pre-existing hazard, logged to `deferred-items.md`, not fixed:** `checkTickets` opens every ticket `.md` with readFileSync, so a FIFO at a ticket path hangs the validator. For that reason the FIFO case for this plan sits in the NFR directory, which checkTickets does not read.

## Verification

- `npx vitest run scripts/state-rules.test.ts scripts/validate.test.ts scripts/board-model.test.ts scripts/check-foundation-guards.test.ts install/mode-census.test.ts --maxWorkers=1`: 761 passed.
- Related: `install/opencode-permission.test.ts scripts/check-state-paths.test.ts install/state-layout.test.ts`: 126 passed.
- `npm run build`, `npm run typecheck`: exit 0. `npm run freshness`: 80 committed `.js` files fresh.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: exit 0, no WARNING, ERROR or LAYOUT line.
- `node scripts/check-state-paths.js`, `node scripts/check-foundation-guards.js`, `node scripts/check-nul-bytes.js`: exit 0.
- All 11 validator fixtures give byte-identical output, with `--strict`, before and after the plan.
- Acceptance greps:
  - `^import ` in state-rules.ts: 0.
  - `checkBudgets`: 2.
  - No retyped budget number in either file.
  - `Record<keyof typeof BUDGETS`: 1.
  - `budgetEntryNames` in the validator: 3.
  - `endsWith(".md")` in the validator: still 1.
  - The three board-model reader bounds: unchanged.
- Not run: the full non-e2e suite (project rule: phase plans 37-08, 37-13 and 37-19 run it).

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-03 can embed `scripts/state-rules.ts` verbatim (no imports).
- Plan 37-04's state-check can call the same functions with the raw listing and lstat sizes, and reuse `formatFinding`, `formatMarkerWarning` and `unmeasuredFinding`.
- Plan 37-05 should use `recordEntryNames` for its integrity rules.
- D-06 (giving grugops's own tree the marker) is still open for a later plan. The own tree has zero budget findings today, so adding a valid marker changes nothing in its output.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All five created key files exist on disk, and the three task commits 0622a2dd, 44464bad and 6afb5d1f are ancestors of HEAD. All acceptance criteria and plan verification commands passed.
