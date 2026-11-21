---
phase: 38-install-migrate-v3
plan: 09
subsystem: install
tags: [migrate, dry-run, preview, listing, sanitization, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-02 to 38-05: planStateMigrate, plan.steps, the board split, the NFR split and the rolls; 38-03: runStateMigrate and its DRY_RUN branch; 38-08: the hazard pre-check"
provides:
  - "install/install.ts: the `--dry-run` argument (ARG_DRY_RUN); DRY_RUN is the environment test or the argument, for every mode"
  - "install/state-migrate.ts migrateListing(plan): the pure dry-run listing, one string per printed line, each through stripControlChars"
  - "plan.steps step classes orphan (one per row, by ID and board line), split (the `_Updated:` count and bytes) and roll (one per surface); an append names its board lines"
  - "runStateMigrate's DRY_RUN branch prints migrateListing's lines and nothing else, then returns before any write"
  - "install/migrate-v3-dryrun.test.ts: (D1) (D2) (D3)"
affects: [38-10, 38-11]

actuals:
  tokens: 10650
  tasks: 2
  commits: 3
plan_head_before: 205ed6afc7ba1aa53cbcf920f9c4cc93efeef2d0
plan_head_after: cc0c607e494ea5c1955e014bd5bde712af9633b9

tech-stack:
  added: []
  patterns:
    - "A preview is a pure function of the plan the real run executes, so the two cannot disagree; the installer prints its lines and adds none"
    - "Every printed listing line passes through stripControlChars whole, so no user value inside it can carry a control sequence"

key-files:
  created:
    - install/migrate-v3-dryrun.test.ts
    - .planning/phases/38-install-migrate-v3/38-09-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/state-migrate.ts
    - install/state-migrate.js
    - install/state-migrate.test.ts
    - install/installer-dry-run.test.ts
    - install/closing-claims.test.ts
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "`--dry-run` is an install-wide modifier (closing-claims MODE_TABLE row), the argument spelling of DRY_RUN=1 for every install.js mode; uninstall.js is unchanged and still exits 2 on it"
  - "migrateListing returns the exact stdout lines (two spaces, label padded to 14, text), including the closing 'nothing was written' line, so install.ts adds no line to the state migrate section"
  - "The render line names the trace directory and file the render writes and says they cannot be previewed; it no longer prints the kit renderer's absolute path, which the pure listing does not know (the real run still refuses when no renderer is mapped)"
  - "Whole-stdout equality between two dry runs, and between --dry-run and DRY_RUN=1, is asserted with the one per-run name replaced: the adapter render's mkdtemp mirror (`grugops-install-render-XXXXXX`), which an existing install-wide `render` line prints. The state migrate section is compared exactly as printed"
  - "A roll the embedded planner refuses gets its one roll line, with the reason inline, rather than a line pointing at the note"

patterns-established:
  - "Listing group order follows the commit: moves, archive moves, writes and appends, then the splits and rolls those writes hold, notes, render, marker, budgets, and last the nothing-written line; paths in code-unit order within the path groups"

requirements-completed: [MIGRATE-01]

coverage:
  - id: D1
    description: "`node install/install.js --migrate --dry-run` is accepted and lists each pre-v3 file's moved path and byte count; target and kit home unchanged; no staging directory"
    requirement: MIGRATE-01
    verification:
      - kind: integration
        ref: "install/migrate-v3-dryrun.test.ts#(D1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "`--dry-run` and DRY_RUN=1 print the same stdout for --migrate and for a plain install, a second run prints the same, and none writes"
    requirement: MIGRATE-01
    verification:
      - kind: integration
        ref: "install/migrate-v3-dryrun.test.ts#(D2)"
        status: pass
      - kind: integration
        ref: "install/installer-dry-run.test.ts#a plain install with --dry-run writes nothing and prints the stdout DRY_RUN=1 prints"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#unknown-arg"
        status: pass
    human_judgment: false
  - id: D3
    description: "migrateListing holds a line of every step class (move, archive, new file, ticket append with board lines, each orphan row, `_Updated:` count and bytes, NFR file, both rolls, render, marker, each over-budget finding), in commit order, deterministic, with no control character"
    requirement: MIGRATE-01
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S11)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-11 under the dry run: a vendored-kit repository holding the pre-v3 state previews both arms and writes nothing, agent-factory/ included"
    requirement: MIGRATE-01
    verification:
      - kind: integration
        ref: "install/migrate-v3-dryrun.test.ts#(D3)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Wording and readability of the dry-run listing (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 49min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 09: The --dry-run preview Summary

**`node install/install.js --migrate --dry-run` now works. It prints every planned move and split with per-file byte counts, in the order the commit runs: each file moved with the pre-v3 root, each archive move, each new file and ticket append (with its board lines), each orphan row by ID and board line, the `_Updated:` count and bytes, both rolls, the trace render that cannot be previewed, the marker, and the over-budget list. It then says nothing was written, and it writes nothing. The listing is one pure function of the plan, `migrateListing`, so the preview and the real run cannot disagree. `--dry-run` is the same flag as `DRY_RUN=1` for every install mode.**

## Performance

- **Duration:** about 49 min (about 23 of it the full-suite run)
- **Started:** 2026-10-28T15:48:29Z
- **Completed:** 2026-10-28T16:37:00Z
- **Tasks:** 2
- **Files modified:** 10 (plus this SUMMARY)

## Accomplishments

- **The argument.** `--dry-run` sets `ARG_DRY_RUN` in the argument loop, and `DRY_RUN` is now `process.env.DRY_RUN === "1" || ARG_DRY_RUN`. It is not an agent flag. An unknown argument still exits 2.
- **migrateListing(plan).** It reads only the plan and returns the exact stdout lines. `runStateMigrate`'s DRY_RUN branch prints them and returns before the first mutation, replacing the one-line-per-step output plan 38-03 left.
- **Complete step classes.** `plan.steps` gains `orphan` (one per row with no ticket file, by ID and board line, D-03), `split` (the `_Updated:` count and the bytes of their text, D-04) and `roll` (one per surface, always: nothing rolls, N rows or entries roll with the archive's bytes, or not rolled with the reason). An append names every board line its Board notes come from, and a write step names its write's source.
- **Commit order and determinism.** Moves, archive moves, then writes and appends, each sorted by path in code-unit order. Then come orphans in board order, the split, the rolls (Done, then progress), notes, render, marker, budgets, and the closing line.
- **Sanitization.** Every line passes through `stripControlChars` whole. Two tests cover this: a ticket file name with ESC (through the planner), and a crafted plan with ESC in a path and in a note naming a ticket ID.

## Task Commits

1. **Task 1 (tracer): the argument, migrateListing, the DRY_RUN branch, (D1)** - `38ed3e51` (feat)
   - Also includes these census updates: closing-claims MODE_TABLE 17 → 18 typed rows (`--dry-run`, a modifier), and the installer test file counts 44 → 45 in mode-census and path-spelling-census.
   - **Tracer gate:** the run was interactive, mode end-of-phase, and the verify was automated-only, so I re-ran it with no checkpoint. Build, typecheck, then `migrate-v3-dryrun.test.ts` with `state-migrate.test.ts`: 83 of 83 passed. `install.test.ts -t "unknown-arg|MID-SCRIPT"`: 3 passed. Then expansion continued.
2. **Task 2 (tdd): complete, ordered, sanitized listing; the flag held equal to DRY_RUN=1**
   - `71270520` test(38-09) (RED)
   - `cc0c607e` feat(38-09) (GREEN)

## TDD Gate Compliance

- RED `71270520` comes before GREEN `cc0c607e`. There is no REFACTOR commit.
- I checked RED by hand, because `gsd_run check tdd-red-evidence` rejects vitest output (a phase fact). Command: `npx vitest run install/state-migrate.test.ts -t S11`, exit 1, 6 failed and 6 passed. Each failure was on its planned assertion:
  - **new-file line:** there was no write line for `memory-bank/plans/board.md` that carries the write's source. The step note differed from the source.
  - **append line:** "expected '…ABC-074… (681 bytes; 1 Board notes section(s) appended to the ticket ABC-074)' to contain 'line 47 of plans/board.md'".
  - **D-03:** "expected [] to have a length of 2". There was no orphan line.
  - **D-04:** no `would-split` line.
  - **rolls:** no `would-roll` line.
  - **commit order:** the archive paths were not in code-unit order (board, tickets, then nfr-catalog).
- Six S11 cases passed at RED, as expected:
  - move lines, archive lines, render, marker and budgets, determinism, and the two ESC cases;
  - Task 1 already listed those classes and stripped every line.
- (D2), (D3) and the installer-dry-run case also passed at RED, once the per-run render path was normalized (see Deviations). Task 1's flag already delivered them, and Task 2 holds them as regressions.
- GREEN: all 13 S11 cases, D1-D3 and the installer-dry-run case pass.

## Files Created/Modified

- `install/install.ts` (+ `.js`): `ARG_DRY_RUN`, the `--dry-run` branch of the argument loop, `DRY_RUN` from both, the usage comment, and the DRY_RUN branch of `runStateMigrate` printing `migrateListing`.
- `install/state-migrate.ts` (+ `.js`):
  - the `MigrateStep` verbs orphan, split and roll;
  - the steps that record them;
  - `migrateListing`, `stepLine` and `listingLine`;
  - imports of `LAYOUT_MARKER_REL`, `LAYOUT_MARKER_CONTENT` and `TRACE_DIR_REL`.
- `install/migrate-v3-dryrun.test.ts`: new, with (D1) (D2) (D3).
- `install/state-migrate.test.ts`: (S11), 13 cases.
- `install/installer-dry-run.test.ts`: the plain-install `--dry-run` case.
- `install/closing-claims.test.ts`: the `--dry-run` MODE_TABLE row; MODE_TABLE_COUNT 17 → 18 typed rows.
- `install/mode-census.test.ts`, `install/path-spelling-census.test.ts`: the installer test file count 44 → 45.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two runs never print byte-identical whole stdout**
- **Found during:** Task 2 RED, (D2) and the installer-dry-run case.
- **Issue:** The install run's existing `render` line names the adapter render's fresh mkdtemp mirror (`/tmp/grugops-install-render-XXXXXX`), which differs on every run. This holds for both spellings and for a plain DRY_RUN, and it was there before this plan.
- **Fix:** The tests replace that one name and compare every other byte of stdout. The state migrate section, which holds no temporary path, is compared exactly as printed. The installer's render line was left as it is, because it is outside the migrate listing.
- **Commit:** `71270520`

**2. [Rule 3 - Blocking] Three census tests outside the plan's file list**
- **closing-claims argv census:** it failed on the new argv literal. I added the MODE_TABLE row.
- **message-references (b):** it flagged the first wording of a skipped roll ("the note below says why") as a line reference. The roll line now states the reason inline.
- **mode-census and path-spelling-census:** each counts installer test files, so both moved 44 → 45.
- **Commits:** `38ed3e51`, `cc0c607e`

**3. [Scope] The render line no longer prints the renderer's absolute path**
- The pure listing does not know `GRUGOPS_SRC`. The line now names `TRACE_DIR_REL/` and `TRACEABILITY_REL`, and says what the render writes cannot be previewed.

**4. [Added case]** A roll the planner refuses: its one roll line carries the reason (S11).

---

**Total deviations:** 2 auto-fixed (blocking), 1 scope note, 1 added case.
**Impact on plan:** None on scope. The whole-stdout determinism truth holds with the one per-run temp name replaced.

## Issues Encountered

- **The full suite** ran once with GRUGOPS_HOME and HOME in a scratch directory (1,374 s):
  - Test Files: 6 failed, 129 passed (135).
  - Tests: 20 failed, 10,409 passed, 2 skipped.
  - The 20 failures are exactly the 38-BASELINE.md set:
    - `installer-fs-census` 1 (`openAsBlobSync`);
    - `canonical-corpus` 1;
    - `context-io` 7;
    - `context-io-writer-set` 2;
    - `harness-instance-ledger` 4;
    - `uat-gate-exit-contract` 5.
- **Plan verification:**
  - 1: the five named test files pass, except the baseline `installer-fs-census` case.
  - 2: `npm run freshness` (88 fresh), `check-state-paths` and `check-imperative-lexicon` all exit 0.
  - 3: the branch is `main`. No branch was created or switched.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 38-10 (the context-archive arm) can add its own step class to `plan.steps`, and `migrateListing` will list it.
- Plan 38-11 documents `--dry-run` in install/README.md and runs the dogfood preview.
- MIGRATE-01 is declared by this plan. Whether it can be marked complete depends on sibling plans that also declare it.

## Self-Check: PASSED

- FOUND: install/migrate-v3-dryrun.test.ts, install/state-migrate.ts, install/install.ts
- FOUND: 38ed3e51, 71270520, cc0c607e (all ancestors of HEAD)
- Acceptance:
  - `grep -c '"--dry-run"' install/install.ts` = 1;
  - `grep -c 'export function migrateListing'` = 1;
  - `-t "D1"` passed, and `-t "D2|D3"` passed;
  - freshness exit 0.

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
