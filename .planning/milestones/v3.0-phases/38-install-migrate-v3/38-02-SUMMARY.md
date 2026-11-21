---
phase: 38-install-migrate-v3
plan: 02
subsystem: install
tags: [migrate, board-split, conservation-proof, embed-generator, state-layout, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-01: the frozen pre-v3 fixture (install/fixtures/pre-v3-chess/), PRE_V3_CHESS_DIR, D-21 option-a, the 20-test baseline"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: board-model splitRow/parseBoard, state-rules budgets and roll planners, the runnable-embeds generator
provides:
  - "install/state-layout.ts: PRE_V3_ARCHIVE_REL and its eight file constants, PRE_V3_TICKETS_REL, QUEUE_PENDING_REL, QUEUE_CLAIMED_REL, MIGRATE_STAGING_REL"
  - "scripts/generate-runnable-embeds.ts: EmbedSpec.kind ('runnable' | 'module'), embedKind, runnableSpecs, the install/state-migrate.ts module row with every root phase 38 needs, EMBED_SPEC_COUNT 4"
  - "install/state-migrate.ts: planStateMigrate, proveStateMigrate, cutRow, movedRel, provenanceLine, BOARD_NOTES_HEADING, BOARD_UPDATES_TITLE, ORPHAN_NOTES_TITLE, MIGRATE_GENERATED_LINE_KINDS, TASK_NAME_RE re-export, and the plan types (MigratePlan with cuts and appended)"
  - "install/state-migrate.test.ts with chessInputs(): cases (S1)-(S7), 39 tests"
affects: [38-03, 38-04, 38-05, 38-09, 38-10, 38-11]

actuals:
  tokens: 64750
  tasks: 2
  commits: 5
plan_head_before: fddce55e6aa5eaafaa3d30848a6abb1fdba45bbd
plan_head_after: 6452cc5e0ed4e581463f369886e956f32a4188ef

tech-stack:
  added: []
  patterns:
    - "An EMBED_SPECS row of kind `module` gives an install/ module a freshness-checked generated region with no build stamp, so install/ keeps importing nothing under scripts/"
    - "A census over install/ sources reads a FRESH generated region as blank (line numbers kept); a stale region is read whole"
    - "The conservation proof takes the written bytes as a parameter and removes generated lines by declared position, each checked against its kind's template"

key-files:
  created:
    - install/state-migrate.ts
    - install/state-migrate.js
    - install/state-migrate.test.ts
  modified:
    - install/state-layout.ts
    - install/state-layout.js
    - install/state-layout.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/generate-runnable-embeds.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/path-spelling-census.test.ts
    - install/mode-census.test.ts
    - install/agents-record.test.ts
    - install/message-references.test.ts

key-decisions:
  - "A board row whose line touches an HTML comment is not cut; the plan says so in notes (cutting could move a comment opener off the board and uncomment the lines after it)"
  - "MigratePlan carries two fields beyond the plan's list, `cuts` (board line, kept line, note file and line) and `appended` (ticket write and its original), because the proof needs the pairing and the prefix check, and plan 38-03 executes from them"
  - "The updates and orphan files use the board's own line ending; an appended Board notes section uses its ticket's own ending"
  - "Two ticket files with one identity are refused whether or not either gets notes, as the plan states"
  - "The path-spelling census reads a fresh generated region of an EMBED_SPECS target as blank, instead of classing generated copies one by one; a stale region is still read whole"
  - "The two state-roll refusal sentences in the module's region are classed in agents-record's REMOVAL_EXEMPT: install may print them once plan 38-05 runs the roll"

patterns-established:
  - "provenanceLine(boardLine | null, date) is the one provenance sentence; null names the whole board for a file-level line"
  - "Generated line kinds: board-notes-heading, provenance, updates-title, orphan-title, orphan-heading (pinned by a test)"

requirements-completed: [MIGRATE-05, MIGRATE-03, MIGRATE-02]

coverage:
  - id: D1
    description: "Each fixture row's trailer is cut from the raw line and appended verbatim under a new `## Board notes` section in its ticket, after the provenance line; the 34,171-character ABC-115 trailer appears whole"
    requirement: MIGRATE-05
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S1) every cut trailer rejoins its raw board line and sits on one line under a new Board notes heading, after the provenance line"
        status: pass
      - kind: unit
        ref: "install/state-migrate.test.ts#(S2) the fixture's longest trailer, over 1,024 characters, appears whole in its ticket"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-09 stage-A proof: passes on the fixture plan, fails naming file and line on every listed mutation, and covers the four edge cases"
    requirement: MIGRATE-03
    verification:
      - kind: unit
        ref: "npx vitest run install/state-migrate.test.ts -t proof (11 passed)"
        status: pass
      - kind: unit
        ref: "install/state-migrate.test.ts#(S7) the edge cases of MIGRATE-01 and MIGRATE-03"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every original has one declared home (D-17, D-21 option-a): the board and each ticket that gets notes are archived unchanged, every other file moves unchanged"
    requirement: MIGRATE-02
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S6) where every original lives (D-17, D-21 option-a)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-03 orphan notes, D-04 board updates, refusals by name, overBudget, CRLF and BOM handling, determinism"
    requirement: MIGRATE-05
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts (39 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The module embed: EMBED_SPEC_COUNT 4, the module region has no stamp line, the three runnable regions are byte-identical to af72d248"
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#a module row is generated and fresh but never stamped (plan 38-02)"
        status: pass
      - kind: other
        ref: "node scripts/runnable-embeds-freshness.js && git diff --quiet af72d248 -- scripts/runnable-ref/ && npm run freshness"
        status: pass
    human_judgment: false
  - id: D6
    description: "Wording of the provenance line, the two file titles, refusals and notes (clear voice, names the file)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts; the tests pin only the templates' use and the file names in each refusal"

duration: 1h 15m
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 02: The migrate planner and its stage-A proof Summary

**A pure `planStateMigrate` that cuts each board row's trailer from the raw line into its ticket's new `## Board notes` section (or the orphan file), moves every `_Updated:` line to the updates file, places every original under D-21 option-a, and is checked by a position-based, rejoining multiset proof that fails by file and line on every loss. It reaches the board grammar and state rules through a new stamp-free `module` embed.**

## Performance

- **Duration:** 1h 15m (about 45 minutes of it was two full-suite runs)
- **Started:** 2026-10-28T09:46:38Z
- **Completed:** 2026-10-28T11:02:05Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- On the frozen fixture the planner cuts 7 rows into ticket Board notes (ABC-162, -160, -074, -115, -103, -106, -139) and 1 orphan row (ABC-209). It moves the fixture's `_Updated:` lines to `archive/pre-v3/board-updates.md` and plans a 17,899-byte board. The proof passes.
- `proveStateMigrate(inputs, plan, written)`: it removes generated lines by declared position, and each one must equal its kind's template. It rejoins each cut (kept row + trailer = the original line), compares the two multisets, checks that each appended ticket begins with its original bytes, and checks every original home that `written` holds.
- Refusals are collected and never thrown, and a refused plan writes nothing. The planner refuses a board, or a ticket that would get notes, that is not valid UTF-8 or mixes LF and CRLF. It also refuses two ticket files with one identity.
- `overBudget` lists, after the cut, every ticket row still over 160 characters (named by ID), the board bytes, and each ticket over 64 KiB. ABC-115 is 84,032 bytes after its append.
- The generator's `module` kind: the region is fresh and has no stamp line. The stamp and RUNNABLE_SET cover only the runnable rows, and the three runnable regions did not change.

## Task Commits

1. **Task 1 (tracer): end-to-end, one row's trailer into its ticket's Board notes**
   - `48dd56d3` test(38-02): failing tracer tests. RED was a load failure: `planStateMigrate` was not exported yet.
   - `b70c651a` feat(38-02): constants, module embed, planner and proof. The tracer gate re-ran both `<verify>` commands: both green.
2. **Task 2 (tdd): the whole board split**
   - `41ced049` test(38-02): failing tests (14 of 39 red). RED evidence: the target "a board that is not valid UTF-8 is refused by name" failed on its assertion; `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK`.
   - `e0a00669` feat(38-02): updates, orphans, refusals, budgets. GREEN: 39 passed.
   - No refactor commit. The header comment was tidied inside the GREEN commit.
3. `6452cc5e` test(38-02): product-module censuses (deviation 3).

**Plan metadata:** the docs commit that follows this SUMMARY.

## TDD Gate Compliance

- Task 2 RED `41ced049` comes before GREEN `e0a00669`.
- RED: 14 cases failed. The target failed on its planned assertion: no refusal named the board, because the board was decoded loosely. 25 cases already passed at RED: the edge cases, CRLF/BOM handling and determinism, which Task 1's code already met. The semantic assessment is a valid RED for the new behaviour.
- Task 1 is a tracer task with no `tdd="true"`. Its test-first commit was red by a module-load failure, not by an assertion. That is recorded here and not presented as classifier-valid RED.

## Files Created/Modified

- `install/state-migrate.ts` (+ `.js`): the planner, the proof and the generated region (about 1,420 lines).
- `install/state-migrate.test.ts`: (S1)-(S7) over the fixture and test-time mutations.
- `install/state-layout.ts` (+ `.js`, test): 12 new constants, each its parent plus one segment.
- `scripts/generate-runnable-embeds.ts` (+ `.js`, test): the module kind, the row and the count.
- `scripts/check-foundation-guards.test.ts`: NON_TEST_MODULE_COUNT 110 -> 111.
- `install/path-spelling-census.test.ts`, `install/mode-census.test.ts`, `install/agents-record.test.ts`, `install/message-references.test.ts`: census dispositions.

## Decisions Made

See `key-decisions` in the frontmatter. The most important: a row whose line touches an HTML comment is not cut. Two fields are added to the plan, `cuts` and `appended`. A census reads a fresh generated region as blank.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] A row inside or beside an HTML comment is not cut**
- **Found during:** Task 1.
- **Issue:** The trailer is cut from the raw line. If a row's raw line holds a comment opener or closer, moving the trailer could take the `<!--` off the board and uncomment the lines after it.
- **Fix:** When the comment-blanked line differs from the normalized line, the row is left whole and the plan adds a note naming it. The fixture has no such row.
- **Committed in:** `b70c651a`

**2. [Rule 3 - Blocking] Three repository censuses counted the new module**
- **Found during:** Task 1 verification.
- **Fix:** `check-foundation-guards` NON_TEST_MODULE_COUNT 110 -> 111. mode-census source count 10 -> 11 and test count 40 -> 41. path-spelling-census source count 10 -> 11 and test count 40 -> 41. These were re-derived by listing, with dated notes. The path-spelling census flagged two regexes inside the generated region (`blankKeepingNewlines`, `strictFenceRun`), so a fresh EMBED_SPECS region is now read as blank, with a test that pins this.
- **Committed in:** `b70c651a`

**3. [Rule 1 - Bug from my own new file] Product-module censuses in agents-record and message-references**
- **Found during:** the first full-suite run, with 7 failures not in the baseline.
- **Fix:** PRODUCT_MODULE_COUNT 10 -> 11 in both files. The two state-roll refusal sentences in the region ("delete the board's row by hand…", "delete the progress file's copy by hand…") are classed in REMOVAL_EXEMPT, each removing a duplicated copy and never the marker.
- **Committed in:** `6452cc5e`

**4. [Rule 3 - Hygiene] The test seed path is built from STATE_ROOT_REL**
- `check-state-paths` counted a quoted `plans` segment in the test helper. The path is now built from `STATE_ROOT_REL`.

---

**Total deviations:** 4 auto-fixed (1 correctness, 2 blocking census counts, 1 hygiene).
**Impact on plan:** No scope creep. The EMBED_SPECS row has every root the plan listed, and no root was dropped: no closure reached a non-`node:` import.

## Issues Encountered

- The first full-suite run had one vitest "Worker exited unexpectedly" error, and no file was named. A second full run with a JSON report had no error. It failed exactly the 20 baseline tests in 6 files: 10,305 passed, 2 skipped, 131 files. Both runs had `GRUGOPS_HOME` and `HOME` set to a scratch directory.
- `npm run generate:runnable-embeds` runs the committed `scripts/generate-runnable-embeds.js`, so `npm run build` must run first after a generator edit.

## Known Stubs

None. `progress`, `seedNfrCatalog` and `seedTraceability` are inputs the planner does not read yet. Plans 38-04 and 38-05 read them, as this plan states.

## Threat Flags

None. No new I/O, endpoint or trust boundary. T-38-03/04/05 are mitigated as planned: the trailer comes from the raw line and the proof rejoins it; generated lines are removed by position and checked against their template; every user value in a reason passes through stripControlChars.

## User Setup Required

None.

## Next Phase Readiness

- Plan 38-03 can execute `writes`, `archiveMoves` and `steps`, and call `proveStateMigrate` over the bytes it re-reads from staging. Paths follow the D-17 convention: an archive move's `from` is the path after the whole root rename.
- Plan 38-04 extends `MIGRATE_GENERATED_LINE_KINDS` (NFR titles and header copies) and the proof's output parts. The pinned-kinds test moves with it.

## Self-Check: PASSED

- FOUND: install/state-migrate.ts, install/state-migrate.js, install/state-migrate.test.ts
- FOUND commits: 48dd56d3, b70c651a, 41ced049, e0a00669, 6452cc5e
- Acceptance: `kind: "module"` count 1; EMBED_SPEC_COUNT check exits 0; the PRE_V3_ARCHIVE_REL and MIGRATE_STAGING_REL greps each print 1; the scripts/ import grep prints 0; `-t trailer` 5 passed, `-t proof` 11 passed, `-t orphan` 5 passed, `-t updates` 4 passed; the `orphan-heading` grep prints 4; `npm run freshness` exits 0.
- Verification: runnable-embeds-freshness, check-state-paths, check-foundation-guards and freshness all exit 0; the runnable sources match af72d248; the branch is `main`; the full suite fails only the 20 baseline tests.

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
