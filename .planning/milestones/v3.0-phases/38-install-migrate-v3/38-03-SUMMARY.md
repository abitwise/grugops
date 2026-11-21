---
phase: 38-install-migrate-v3
plan: 03
subsystem: install
tags: [migrate, state-move, staging, commit-journal, conservation-proof, layout-marker]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-02: planStateMigrate, proveStateMigrate, movedRel, formatFinding, MIGRATE_STAGING_REL, PRE_V3_* constants; 38-01: the frozen pre-v3 fixture"
provides:
  - "install/install.ts: readMigrateInputs, stateMigrateRefusals, runStateMigrate, the commit journal (MigrateJournalEntry) and undoStateMigrate, the `-- state migrate --` section, the D-07 closing (printMigrateBudgets), MIGRATE_COMMIT_PLAN_NAME"
  - "The v3 refusals joined into the one --migrate pre-check, for the vendored-kit and the clean kit arms"
  - "install/migrate-v3.test.ts cases (M1)-(M4)"
affects: [38-04, 38-05, 38-06, 38-07, 38-08, 38-09, 38-11]

actuals:
  tokens: 18600
  tasks: 2
  commits: 2
plan_head_before: e9ea6267172b601c4310560f3fd75a7729c43e9d
plan_head_after: c9bdfa5dbe5f17a3636a947fb7d1db720de81a4e

tech-stack:
  added: []
  patterns:
    - "Stage in MIGRATE_STAGING_REL (non-recursive mkdir), re-read through readUserFile and re-prove, then commit by journaled renames each preceded by an lstat that requires an absent destination"
    - "A failure before the commit takes away only the staging directory; a failure after the first rename undoes the journal in reverse; an undo step that fails is its own verify and leaves the staging directory and commit-plan.txt"
    - "The layout marker is written by the state migrate with flag wx, last, after both proofs; the state seed then reports it as already there"

key-files:
  created:
    - .planning/phases/38-install-migrate-v3/38-03-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/migrate-v3.test.ts
    - install/installer-fs-census.test.ts
    - install/pre-v3-layout.test.ts
    - install/install.test.ts
    - install/message-references.test.ts

key-decisions:
  - "The v3 arm runs when the repository is not installed two-root (isMigrated false) and stateLayout() answers pre-v3, so it covers the vendored-kit arm, the clean arm and the remaining unmarked shape; isMigrated still stops at the already-migrated arm (plan 38-07)"
  - "The D-21 option-b set-aside removal is not built: D-21 is option-a, the planner never emits a set-aside move, and the arm never deletes a user file. The post-commit proof still checks a `prefix` home generically"
  - "MEMORY_BANK_REL created in step (a) is tracked outside the commit journal and taken away (rmdir, only when empty) after the staging directory, so an undo never tries to remove a directory that still holds the staging directory"
  - "The post-commit proof also re-reads every written file and requires the planned bytes, beside the per-original treeRecord check"
  - "Staging subdirectories are cleared bottom-up with rmdirSync only after the marker is written, so a file left in staging is a note naming it, never a deletion"
  - "The pre-check refusals that name a by-hand step do not repeat the re-run instruction: the migrate INCOMPLETE banner prints the --migrate command"

patterns-established:
  - "runStateMigrate's DRY_RUN branch lists one would-<verb> line per plan step and the marker, and prints the budget closing, then returns before any mutation"

requirements-completed: [MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-04]

coverage:
  - id: D1
    description: "install --migrate on the materialized frozen fixture (no install marker, the clean kit arm) exits 0 with no verify line; the pre-v3 root is gone; every original is at its D-21 home; BOARD_REL is the split board; the ABC-115 trailer is under Board notes; the marker is `layout: v3` plus LF; the staging directory is gone"
    requirement: MIGRATE-01
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M1) --migrate moves the fixture to the v3 layout: every original at its D-21 home, the split board, Board notes, the marker, no staging"
        status: pass
    human_judgment: false
  - id: D2
    description: "Originals are unchanged at their archive or moved homes; a zero-byte file and an empty subdirectory survive at their moved paths; an existing state root (an empty directory) is a pre-check refusal with nothing written"
    requirement: MIGRATE-02
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M4) a zero-byte file and an empty subdirectory under the pre-v3 root are found unchanged at their moved paths"
        status: pass
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M3) an empty directory already at the v3 state root is a pre-check refusal: exit 3, one verify naming it, nothing written"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-11: on a vendored-kit repository holding the pre-v3 board, one pre-check covers both arms, the two-root steps run, then the state migrate before the state seed; --check after it prints one ok state-layout line; uninstall keeps the v3 state root byte-identical"
    requirement: MIGRATE-03
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(e), (j), (m)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#layout marker: a both layout never writes the marker, and a pre-v3 --migrate writes it only through the state migrate (T-37-21)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A second --migrate on the migrated fixture writes nothing in the target or the kit home"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M2) a second --migrate on the migrated fixture writes nothing in the target or the kit home"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every new mutating fs call site is classified with its DRY_RUN gate; the exit-site pin still holds twelve"
    verification:
      - kind: unit
        ref: "install/installer-fs-census.test.ts#the mutating call-site multiset equals CLASSIFIED_SITES two-sided, with counts"
        status: pass
      - kind: unit
        ref: "npx vitest run install/install.test.ts -t MID-SCRIPT (1 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The undo journal and the post-commit failure paths (rename back, journal-created directories, an undo step that fails)"
    verification: []
    human_judgment: true
    rationale: "No test injects a failure after the first commit rename yet; plan 38-06 adds the fault-injected rollback tests. The code paths were reviewed, not run"
  - id: D7
    description: "Wording of the pre-check refusals, the state migrate lines and the D-07 closing (clear professional voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 45min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 03: install --migrate moves pre-v3 state to the v3 layout Summary

**`install --migrate` now reads the pre-v3 root once by lstat, joins its refusals to the one migrate pre-check, stages and re-proves the split in `memory-bank/.grugops-migrate-v3`, commits by journaled renames that each require an absent destination, proves every original's home by its content record, writes `layout: v3` last, and changes nothing on a second run.**

## Performance

- **Duration:** about 45 min (22 of it the full-suite run)
- **Started:** 2026-10-28T11:04:31Z
- **Completed:** 2026-10-28T11:49:14Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `readMigrateInputs` walks the pre-v3 root with `kindAt`/`readdirSync` and follows no link. It reads every regular file through `readUserFile` and records `treeRecord` for the root and for each file. It also reads the progress file and the kit seed's NFR catalog and traceability bytes, and takes the run's UTC date. A link, a special file or an unreadable entry is a refusal naming its path.
- The one pre-check (D-11) now covers the vendored-kit arm and the v3 arm together. It collects the input refusals, the planner's refusals, the proof's reasons, any entry at `STATE_ROOT_REL` (up to ten of its entries are named), an existing staging directory (its `commit-plan.txt` is named), and the kit plan with its KIT_WRITE decision. It uses the existing pre-check exit and adds no `process.exit`.
- `runStateMigrate` runs steps (a)-(i) in the order the plan gives. On the fixture it moves 23 files and archives the board and 7 tickets. It writes the split board, 7 appended tickets, the updates file and the orphan notes file, then the marker. It then prints 12 over-budget findings and says the budgets do not block the migration (D-07).
- When the v3 arm will run, the legacy handoffs directory is not backed up. One ok line says it moves with the state.
- On the fixture, a second `--migrate` leaves the target and the kit home byte-identical.

## Task Commits

1. **Task 1 (tracer): end-to-end v3 arm** - `58b11848` (feat). Tracer gate: interactive, end-of-phase, automated-only verify. Both `<verify>` commands were re-run before the commit and passed, apart from the baseline `openAsBlobSync` case. Expansion continued.
2. **Task 2: pre-v3 entry-point tests and the regression net** - `c9bdfa5d` (test)

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified

- `install/install.ts` (+ `.js`): the v3 arm block (types, `readMigrateInputs`, `stateMigrateRefusals`, journal helpers, `runStateMigrate`), the restructured `--migrate` pre-check, the handoffs step and the `-- state migrate --` section.
- `install/migrate-v3.test.ts`: cases (M1)-(M4) and the header.
- `install/installer-fs-census.test.ts`: 9 CLASSIFIED_SITES rows (runStateMigrate mkdirSync x3, writeFileSync x3, unlinkSync x1; migrateMkdirs, migrateRename, undoStateMigrate x2, discardMigrateStaging, clearEmptyMigrateDirs).
- `install/pre-v3-layout.test.ts`: cases (e), (j) and (m) and the header.
- `install/install.test.ts`: the T-37-21 layout-marker case (see deviation 2).
- `install/message-references.test.ts`: rows for the pre-check report's v3 reading (see deviation 1).

## Decisions Made

See `key-decisions` in the frontmatter. The most important: the v3 arm runs whenever the repository is not installed two-root and its layout is pre-v3. The option-b set-aside deletion is not built, because D-21 is option-a and the arm must never delete a user file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The message-reference census counted the v3 pre-check report**
- **Found during:** Task 1 verification.
- **Issue:** The v3 reading of the pre-check report adds two fragments that point at the verify loop ("refusal(s) above…", "…Resolve each verify above and re-run --migrate.").
- **Fix:** Added two REFERENCE_TABLE rows and one RERUN_TABLE row (class `same-run command (a migrate banner)`, via `report`). Counts changed as follows: install.ts 25 -> 27, "printed reference" 45 -> 47, re-run install.ts 65 -> 66, migrate-banner class 3 -> 4. Each change carries a dated note. Three other new fragments were reworded so they point at nothing: the handoffs line, the undo-incomplete clause, and the by-hand refusals (the INCOMPLETE banner already prints the command).
- **Files modified:** install/message-references.test.ts, install/install.ts
- **Committed in:** `58b11848`

**2. [Task 2 rule - expectation described the replaced pre-v3 skip] install.test.ts T-37-21**
- **Found during:** the Task 2 regression net.
- **Issue:** `install/install.test.ts:922` "layout marker: a both layout and a pre-v3 --migrate run never write the marker" asserted that a pre-v3 `--migrate` writes no marker and seeds nothing under STATE_ROOT_REL. That is the skip this phase replaces.
- **Fix:** The pre-v3 half now asserts the following. The marker is `layout: v3` plus LF. The pre-v3 root is gone. PRE_V3_BOARD_REL holds the user board. There is exactly one `created` line for the marker (from the state migrate) and exactly one `skipped … (target already has it)` line (from the seed). The `both` half did not change. The unused `LEGACY_BOARD_REL` import was dropped.
- **Committed in:** `c9bdfa5d`

**3. [Rule 2 - Safety] No option-b set-aside removal**
- **Issue:** Step (i) of the plan unlinks D-21 option-b set-aside originals. Under option-a (D-21) the planner never emits one, and unlinking would contradict the plan's own prohibition on deleting a user file.
- **Fix:** Not built. Anything left in staging after the commit is named in a note, and only empty directories are taken away (rmdirSync).

**4. [Rule 3 - Hygiene] Path-spelling census (t3)**
- (M3) checks the verify line with `lineNamesPath` and not with `toContain(join(...))`.

---

**Total deviations:** 4 (1 census, 1 replaced expectation, 1 safety omission, 1 hygiene).
**Impact on plan:** No scope creep. The agents-record removal census needed no row: the one "delete by hand" note was reworded.

## Issues Encountered

- The full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, GRUGOPS_HOME and HOME set to a scratch directory, JSON report) gave 10,309 passed, 20 failed and 2 skipped. All 20 failures are the 38-BASELINE.md set, in its 6 files. Nothing new failed.
- Plan verification item 1 cannot exit 0 because `install/installer-fs-census.test.ts` carries the baseline `openAsBlobSync` case (Node 26). Every other case in the four files passed (84/85).

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-38-06, T-38-07 and T-38-08 are mitigated as planned: the staged re-proof, the journal and its undo, the post-commit proof, and the marker written last. Every rename requires an absent destination by lstat, and an existing STATE_ROOT_REL is a pre-check refusal. The only removals are this run's staging directory, its commit-plan.txt, and directories the journal or step (a) made.

## User Setup Required

None.

## Next Phase Readiness

- Plan 38-04 can add NFR and traceability writes and archive moves to the plan. `runStateMigrate` executes any `writes` and `archiveMoves` in plan order, including a write outside STATE_ROOT_REL (research A9) after its archive move.
- Plan 38-06 should fault-inject failures in steps (f)-(h) to cover the undo paths (D6 above).
- Plan 38-07 changes the isMigrated gate. `v3State` excludes isMigrated today.

## Self-Check: PASSED

- FOUND: install/install.ts, install/install.js, install/migrate-v3.test.ts, install/pre-v3-layout.test.ts, install/installer-fs-census.test.ts
- FOUND commits: 58b11848, c9bdfa5d
- Acceptance: `function runStateMigrate` 1, `function readMigrateInputs` 1, `commit-plan.txt` 1, scripts/ import grep 0, `-t M1` 1 passed. `npx vitest run install/pre-v3-layout.test.ts` 13 passed. The PRE_V3_BOARD_REL grep in pre-v3-layout.test.ts prints 3.
- Verification: freshness (88 fresh), check-state-paths, check-foundation-guards and `validate-agent-factory --strict` all pass. The branch is `main`.

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
