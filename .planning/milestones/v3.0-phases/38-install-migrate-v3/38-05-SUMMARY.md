---
phase: 38-install-migrate-v3
plan: 05
subsystem: install
tags: [migrate, state-roll, done-roll, progress-roll, conservation-proof, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-02: planStateMigrate, proveStateMigrate and the module embed of scripts/state-rules.ts; 38-03: runStateMigrate executes any planned writes and archive moves; 38-04: the NFR split and the proof regrouped per original"
provides:
  - "install/state-migrate.ts: the in-memory Done and progress rolls through the embedded planners and executeRoll (Done first, then progress), plan.beforeRoll, plan.rolls (stage B), BoardCut.keptRel, the kinds done-archive-skeleton and progress-archive-skeleton"
  - "The progress original archived unchanged at PRE_V3_PROGRESS_REL when the progress roll moves entries; PROGRESS_REL and PROGRESS_ARCHIVE_REL are new writes"
  - "A roll the embedded planner refuses (or a progress file that is not UTF-8) is one note naming the reason and `node tools/grugops/state-roll.js <repo-root>`, never a migrate refusal"
  - "overBudget adds doneRowFindings over the planned board and progressBytesFinding over the planned progress file"
  - "install/install.ts records the progress file's content record so the post-commit check proves its archived home"
  - "install/state-migrate.test.ts (S9), (S10); install/migrate-v3.test.ts (M6), (M7)"
affects: [38-06, 38-07, 38-09, 38-11]

actuals:
  tokens: 16974
  tasks: 2
  commits: 4
plan_head_before: 54b6634679f2bc7d6a18e0ce1271f924da4c5761
plan_head_after: 9de134c8ac38619980726bcb941d247b60e13b1a

tech-stack:
  added: []
  patterns:
    - "The migrate plan runs the roll through the embedded state-rules planners and executeRoll over a RollIo backed by a Map of rel to text; no roll rule is restated, and parity tests with the committed state-roll.js hold the two equal"
    - "A cut row's kept line follows its row through the roll (rolledLineAt over the RollPlan's lines, insertAt and insertOrder), so the stage-A rejoin reads the line where the roll put it"
    - "A created archive's skeleton lines are generated lines by position; their template is the embedded skeleton function called with no rows, so the proof never takes it from the plan"

key-files:
  created:
    - .planning/phases/38-install-migrate-v3/38-05-SUMMARY.md
  modified:
    - install/state-migrate.ts
    - install/state-migrate.js
    - install/state-migrate.test.ts
    - install/migrate-v3.test.ts
    - install/install.ts
    - install/install.js

key-decisions:
  - "The frozen fixture rolls nothing: its Done column holds 18 ticket rows (the six epic rows are not ticket rows) and its progress file holds no dated entry. Every roll test adds the shape it needs at test time (five Done rows at the top of the Done column, three dated progress entries), never in the fixture (D-15)"
  - "Stage B is recorded in plan.rolls and checked by proveStateMigrate, so the installer's re-proof over the staged bytes fails on a roll outcome that is not ok, as the in-memory proof does"
  - "A pre-v3 tree that already holds a file moving to BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL or PRE_V3_PROGRESS_REL skips that roll with a note, because the commit's rename would refuse to replace it"
  - "A progress file that is not valid UTF-8 or holds U+FFFD is not rolled (a note): a roll writes text, and state-roll refuses the same file"
  - "The progress original is an OriginalHome { original: PROGRESS_REL, at: PRE_V3_PROGRESS_REL, identical }; the installer records its treeRecord at read time so the post-commit home check can prove it (Rule 3)"

patterns-established:
  - "skippedRollNote(what, reason): the one wording for a roll that is not run, naming the command that runs it once the cause is fixed"

requirements-completed: [MIGRATE-03, MIGRATE-02]

coverage:
  - id: D1
    description: "The Done roll runs inside the migrate plan with the embedded planners and executeRoll; the board keeps BUDGETS.doneRows Done rows; the board and BOARD_DONE_ARCHIVE_REL bytes equal what the committed state-roll.js writes over the split board"
    requirement: MIGRATE-03
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S9) parity: the planned board and Done archive equal what the committed state-roll.js writes over the split board"
        status: pass
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M6) --migrate rolls the Done column with the state rules: BOARD_DONE_ARCHIVE_REL holds the older rows and state-roll --dry-run moves nothing more"
        status: pass
    human_judgment: false
  - id: D2
    description: "The progress roll: dated entries go oldest first to PROGRESS_ARCHIVE_REL, standing sections stay, the original moves unchanged to PRE_V3_PROGRESS_REL, PROGRESS_REL is a new write; parity of all four files with state-roll.js; nothing is written when the file is within budget, absent, or holds no dated entry"
    requirement: MIGRATE-02
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S10) progress parity: state-roll.js over the split board and the original progress file writes the same four files"
        status: pass
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M7) --migrate rolls the dated progress entries: the original sits unchanged at PRE_V3_PROGRESS_REL and PROGRESS_ARCHIVE_REL holds the entries"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-09 over the rolled outputs: the proof passes on both rolling plans and fails, naming file and line, on a rolled Done row dropped, a progress entry duplicated, a progress line dropped, an altered skeleton line in either archive, and a stage-B outcome that is not ok"
    requirement: MIGRATE-03
    verification:
      - kind: unit
        ref: "npx vitest run install/state-migrate.test.ts -t 'proof' (S9 and S10 proof cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Research A6 and D-07: a refused Done roll is one note naming the reason and state-roll, with the doneRows finding in overBudget; the progress-bytes finding is listed over the planned progress file"
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S10) A6 and the two overBudget cases"
        status: pass
    human_judgment: false
  - id: D5
    description: "Wording of the skipped-roll note and the new write and archive step notes (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 34min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 05: The Done and progress rolls inside the migrate plan Summary

**`install --migrate` now runs the same Done and progress rollover as `state-roll.js`, in memory, through the embedded state-rules planners and `executeRoll` (Done first, then progress). Older Done rows go to `archive/board-done.md`. Dated progress entries go to `archive/progress.md`, and the progress original is archived unchanged at `archive/pre-v3/60-progress.md`. A roll the planner refuses becomes a note that names `state-roll`; it does not refuse the migrate. The proof now covers the rolled archives (stage A), and each roll's own conservation check is stage B.**

## Performance

- **Duration:** about 34 min (about 22 of it the full-suite run)
- **Started:** 2026-10-28T12:41:15Z
- **Completed:** 2026-10-28T13:15:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- On the fixture with five Done rows added, the plan moves the three oldest Done rows (ABC-006, ABC-007, ABC-139) to a new BOARD_DONE_ARCHIVE_REL, and the board keeps 20. The ABC-139 row was cut, so its kept part now rejoins its trailer from the archive. The board and archive bytes equal what the committed state-roll.js writes over `plan.beforeRoll`.
- With three dated entries added to the progress file, all three move oldest first. The two standing sections stay. The original moves unchanged to PRE_V3_PROGRESS_REL, and all four files equal state-roll.js's output. After a real `--migrate` (M7), the original sits unchanged in the pre-v3 archive, and `state-roll.js --dry-run` says nothing would move.
- The stage-A proof covers the progress file as its own multiset and treats BOARD_DONE_ARCHIVE_REL as a board output. It removes skeleton lines by position (Done archive line 1; progress archive lines 1 and 3) and checks them against the embedded skeleton functions. Stage B is `plan.rolls`; an outcome that is not ok fails the proof with its stage and reason.
- overBudget lists the doneRows finding when a Done roll is refused, and the progressBytes finding over the planned progress file. On the frozen fixture that is 16,894 bytes, and the note names the standing sections.

## Task Commits

1. **Task 1 (tracer): the Done roll end to end**
   - `822b68d4` test(38-05): (S9) and (M6) failing tracer tests
   - `74d7a9f4` feat(38-05): the Done roll, beforeRoll, keptRel, rolls, done-archive-skeleton. Tracer gate (interactive, end-of-phase, automated-only verify): `npm run build && npm run typecheck && npx vitest run install/state-migrate.test.ts install/migrate-v3.test.ts` was re-run green (76/76) before the commit. Expansion continued.
2. **Task 2 (tdd): the progress roll, notes, budgets, proof failures**
   - `a18b6960` test(38-05): (S10) and (M7), 10 failing
   - `9de134c8` feat(38-05): the progress roll, the original archived, the findings, and the installer's record of the progress file

No REFACTOR commit. One clean-up landed before the Task 2 GREEN commit: the moved-entry count comes from the planner's `blocks.length`, not from re-reading headings.

## TDD Gate Compliance

- RED and GREEN commits exist for both tasks (`test(38-05)` before each `feat(38-05)`).
- RED evidence was checked by hand (the phase fact: `gsd_run check tdd-red-evidence` rejects vitest tap-flat output as malformed). Semantic assessment:
  - **Task 1:** 9 failures. The kinds pin missed `done-archive-skeleton`. Five assertions failed on missing behaviour: `beforeRoll` undefined, 23 Done rows where 20 were expected, `beforeRoll` not a Uint8Array, no skeleton generated line, and no Done archive in M6. Two failed on the helper's `PREMISE: the plan writes …/board-done.md` throw, which is also missing behaviour, not a setup fault.
  - **Task 2:** 10 failures, all on planned behaviour: the kinds pin, no PRE_V3_PROGRESS_REL move, progress parity, no progress skeleton lines, no UTF-8 note, no doneRows finding, no progressBytes finding, three `PREMISE: the plan writes` throws for the progress outputs, and M7's `the progress original is archived` assertion.
  - **Passed at once (Task 2):** six cases, because Task 1 already built the parts they test (the note path, stage B, the Done-archive proof) or because they assert "no progress roll" (within budget, absent).

## Files Created/Modified

- `install/state-migrate.ts` (+ `.js`) changes:
  - roll plumbing: formsOf, viewOf, mapIo, rolledLineAt, skeletonGenerated
  - the two roll planners and their notes: planMigrateDoneRoll, planMigrateProgressRoll, skippedRollNote
  - budgets: rollBudgetFindings
  - types: the RollRecord type, `beforeRoll`, `rolls`, `BoardCut.keptRel`
  - proof: two new kinds and their templates, the `progress` proof group, stage B
- `install/state-migrate.test.ts`: (S9) has 7 cases and (S10) has 15; the kinds pin is updated.
- `install/migrate-v3.test.ts`: (M6), (M7).
- `install/install.ts` (+ `.js`): readMigrateInputs records the progress file's treeRecord; the archived report shows its size.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The installer could not prove the progress original's new home**
- **Found during:** Task 2 (M7)
- **Issue:** The post-commit check (g) looks up `read.records.get(h.original)`. readMigrateInputs recorded only files under the pre-v3 root, so the PRE_V3_PROGRESS_REL home failed as "not unchanged", and every rename was undone. The plan said install.ts would run unchanged.
- **Fix:** readMigrateInputs records `treeRecord(TARGET, PROGRESS_REL)` when the progress file is present, and refuses when it cannot record it. The archived report gives the file's real size.
- **Files modified:** install/install.ts, install/install.js
- **Commit:** `9de134c8`

**2. [Plan premise] The frozen fixture rolls nothing**
- **Found during:** Task 1, before RED
- **Issue:** The plan expected the fixture to roll: its board to keep BUDGETS.doneRows Done rows, and its progress file (which is over budget) to roll. In fact the census's "24 Done rows" counts six epic rows, which parseBoard does not treat as ticket rows, so 18 ≤ 20. The progress file has 0 dated entries (38-FIXTURE-CENSUS.md § Progress).
- **Fix:** The roll cases add the missing shape at test time, as the fixture rules require: five Done rows in the planner inputs and the materialized board, and three dated entries in the progress inputs and the materialized progress file. M7 compares PRE_V3_PROGRESS_REL with the materialized progress file, which includes the added entries. A separate case shows the frozen fixture plans no roll, and M1 still finds the progress file unchanged.

**3. [Rule 2 - Correctness] Archive path collisions and non-UTF-8 progress**
- **Found during:** Task 1/2
- **Issue:** A pre-v3 file that moves to BOARD_DONE_ARCHIVE_REL, PROGRESS_ARCHIVE_REL or PRE_V3_PROGRESS_REL would make the commit's rename refuse. A progress file that is not UTF-8 would be rewritten with U+FFFD.
- **Fix:** In each case the roll is skipped with a note, as in A6. The non-UTF-8 case has a test.
- **Commits:** `74d7a9f4`, `9de134c8`

---

**Total deviations:** 3 (1 Rule 3, 1 plan premise, 1 Rule 2). **Impact:** no scope creep; the installer change is 8 lines.

## Issues Encountered

- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, GRUGOPS_HOME and HOME set to a scratch directory, JSON report): 10,377 tests, 10,355 passed, 20 failed, 2 skipped. The 20 failures are exactly the 38-BASELINE.md set, in its 6 files (installer-fs-census 1, canonical-corpus 1, context-io-writer-set 2, context-io 7, harness-instance-ledger 4, uat-gate-exit-contract 5). Nothing new failed.
- Plan verification:
  1. The three named files pass.
  2. `npm run freshness` (88 fresh), `node scripts/runnable-embeds-freshness.js` (4 fresh) and `git diff --quiet af72d248 -- scripts/runnable-ref/` all exit 0.
  3. The branch is `main`.
  - `npm run check:state-paths` also passes.

## Known Stubs

None.

## Threat Flags

None beyond the register.
- **T-38-11 (mitigated):** stage B is executeRoll's own checkConservation. Stage A covers the rolled outputs. Parity tests run against state-roll.js. Mutation tests cover a dropped rolled row, a duplicated entry, a dropped progress line, altered skeleton lines and a failed stage B.
- **T-38-12 (mitigated):** the original moves unchanged to PRE_V3_PROGRESS_REL, and the installer's post-commit check proves its content record.

## User Setup Required

None.

## Next Phase Readiness

- Plan 38-06's trace render runs after the commit renames; the rolled files are already in place by then.
- `node tools/grugops/state-roll.js <repo-root>` after a skipped roll is the human follow-up the note names.

## Self-Check: PASSED

- FOUND: install/state-migrate.ts, install/state-migrate.js, install/state-migrate.test.ts, install/migrate-v3.test.ts, install/install.ts, install/install.js
- FOUND commits: 822b68d4, 74d7a9f4, a18b6960, 9de134c8
- Acceptance:
  - `executeRoll(` outside the generated region: 1 line (baseline 0).
  - `-t parity`: 1 passed. `-t progress`: 11 passed. `-t M7`: 1 passed.
  - `grep -c progress-archive-skeleton install/state-migrate.ts` = 4.
  - `npm run freshness` exits 0.

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
