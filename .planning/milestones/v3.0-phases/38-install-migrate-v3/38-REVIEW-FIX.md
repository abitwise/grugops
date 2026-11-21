---
phase: 38-install-migrate-v3
fixed_at: 2026-10-28T20:47:41Z
review_path: .planning/phases/38-install-migrate-v3/38-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 38: Code Review Fix Report

**Fixed at:** 2026-10-28T20:47:41Z
**Source review:** .planning/phases/38-install-migrate-v3/38-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (1 critical, 8 warnings; the 5 Info findings are out of scope for `critical_warning`)
- Fixed: 9
- Skipped: 0

**Where the work and verification ran:** `workflow.use_worktrees` is `false`, so every edit, build, test
and commit ran in the main checkout (`/home/olger/projects/public/grugops`, branch `main`). No worktree
was created. You can reproduce every result below from this tree.

## Fixed Issues

### CR-01: Moving an `_Updated:` line that opens an HTML comment uncomments board lines and turns them into live ticket rows

**Files modified:** `install/state-migrate.ts`, `install/state-migrate.js`, `install/state-migrate.test.ts`
**Commit:** 10b9a641
**Status:** fixed: requires human verification (a logic fix)
**Applied fix:** `planStateMigrate` now moves an `_Updated:` line only when its comment-blanked form equals
its normalized form. Any other `_Updated:` line stays on the board, and the plan adds a note naming it,
the same rule rows already follow. The doc comment says so. Regression test: the review's board (an
`_Updated:` line that opens `<!--` over a ghost row) gives the same `parseBoard` rows before and after.
The opener stays on the board, no updates file is planned, and the proof passes. The test failed before
the fix (`[ABC-1, ABC-2]`) and passes after it.
**Not applied:** the optional proof hardening (show that the planned board's comment-blanked text,
without the moved lines, equals the original's). That would change the stage-A proof's contract over
the rolled board and every archive output, which needs its own design. The planner guard closes the
reproduced hazard.

### WR-01: The pre-check misses destination collisions the planner can already see, so they fail mid-commit

**Files modified:** `install/state-migrate.ts`, `install/state-migrate.js`, `install/state-migrate.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** d11ee160
**Applied fix:** after it builds `archiveMoves`, `planStateMigrate` refuses a plan in three cases, naming
the file each time:
- the pre-v3 tree already holds an archive destination;
- it already holds a written file that is not itself the source of an archive move;
- it already holds `LAYOUT_MARKER_REL`.

The refusal uses `planNfrSplit`'s wording ("... already exists in the pre-v3 tree ...; move or rename
that file first"). Regression test: each of `PRE_V3_BOARD_REL`, a `PRE_V3_TICKETS_REL/{name}`,
`PRE_V3_NFR_CATALOG_REL`, `PRE_V3_TRACEABILITY_REL`, `PRE_V3_BOARD_UPDATES_REL` and `LAYOUT_MARKER_REL`,
planted as a legacy file, is refused by name with no writes. The test failed before the fix and passes
after it. The doc's refusal list has a new bullet.

### WR-02: An undo after the trace render leaves rendered files behind, so the repository is not as it was

**Files modified:** `install/install.ts`, `install/install.js`, `install/migrate-v3-rollback.test.ts`, `install/migrate-v3-context.test.ts`, `install/installer-fs-census.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** 39ca18b7
**Applied fix:**
- **Snapshot:** just before the render runs, `renderMigratedTrace` reads `TRACEABILITY_REL` (or records
  that it is absent) and each regular file directly in `TRACE_DIR_REL`, with their bytes and modes. A
  file it cannot read is named in `unread`.
- **Restore:** on failure, `discardRenderedTrace` puts back each snapshot file that the render changed or
  removed: it takes away the regular file that is there (kindAt asked first), then creates the file
  again with `wx`, so it never writes through a link. An index the render created where there was none
  is taken away.
- **Scope:** both arms run this, the state migrate's `commitFailed` and `runContextArchive`'s undo.

Two regression tests, each failed before the fix and passes after it:
- **R6b (rollback file):** on a pre-v3 tree without `traceability.md`, the marker write fails. The state
  digest is as before, and no `plans/traceability.md` is carried back.
- **C7 (context file):** the renderer's first write fails inside the renderer's own process, after it
  removed an extra trace file. The fault preload reaches that process through `NODE_OPTIONS`. The trace
  directory and the index are byte-identical to before.

Census: `install.ts:discardRenderedTrace:unlinkSync` 1 -> 2, and a new `writeFileSync` row.
**Design note:** the review asked to remove a created index only when it carries the generated header.
That check was not added. The snapshot is taken just before the render in the same process, so a file
that was absent then and is present after a failed render was created by that render.

### WR-03: The context archive moves the live folder of a reopened ticket

**Files modified:** `install/state-migrate.ts`, `install/state-migrate.js`, `install/state-migrate.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** c329f7b1
**Status:** fixed: requires human verification (a rule change)
**Applied fix:** `contextTicketIds` collects every ticket with a row in a non-Done board column and drops
those tickets from `done`. The `not-done` keep reason now says what a finished ticket is: a row in a Done
column or the Done archive, and no row in another column. The rule is documented in the WHAT MOVES header
and in docs/pre-v3-state-layout.md. Regression test: `ABC-5` in `In Progress` and in the archive is not
Done, and `abc-5-work` stays with reason `not-done`. The test failed before the fix and passes after it.

### WR-04: After an incomplete undo, the same run keeps seeding and installing into the half-moved tree

**Files modified:** `install/install.ts`, `install/install.js`, `install/migrate-v3-rollback.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** aee110f2
**Applied fix:** this uses the review's second option, because the first option (exit 3 before
`seedState`) would add a `process.exit`, and the pin of twelve forbids that. `commitFailed` sets
`STATE_MIGRATE_HALF_MOVED` when its undo is incomplete (an undo step failed, or the staging directory
could not be taken away). `seedState` then seeds nothing under `MEMORY_BANK_REL` and prints one
`skipped` line. The run still ends INCOMPLETE with exit 3 through its verify lines. Regression test R8:
a test-only preload makes a directory at the pre-v3 root when the marker is written, then fails that
write with EIO. The undo is incomplete, the staging directory is left, and the state root holds exactly
the pre-v3 files. Before the fix, 18 seeded entries appeared there. The test failed before the fix and
passes after it. The rollback file's "NOT TESTED HERE" header is updated.

### WR-05: User file names reach the terminal unsanitized on the commit, undo and staging failure paths

**Files modified:** `install/install.ts`, `install/install.js`, `install/migrate-v3-hazards.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** 5312eed8
**Applied fix:** `readMigrateInputs` refuses a pre-v3 entry whose name holds a C0 or C1 control
character or DEL (`CONTROL_CHAR_IN_NAME`). It names the entry through `oneLine` and does not read it.
That removes the TAB and newline ambiguity from `commit-plan.txt`. Every path in these messages now
passes through `oneLine`:
- `migrateMkdirs`, `migrateRename`, `undoStateMigrate` and `discardMigrateStaging`;
- the staging write and the read-back check;
- the post-commit `homeProblems`;
- the `(undo)` verify's staging and commit-plan paths;
- the leftover-staging note.

The doc's refusal list has a new bullet. Regression test: a ticket named with ESC and TAB is a
pre-check refusal (exit 3), the verify names it, stdout carries no control character, and nothing is
staged. The test failed before the fix (the migrate ran) and passes after it.
**Residual:** the commit plan still writes `TARGET`-based paths raw. A `TARGET` whose own path holds a
TAB or a newline would still make the plan ambiguous. The finding covered pre-v3 file names, and
`TARGET` is outside it.

### WR-06: After a successful run, the leftover-staging note says "nothing reads it", but the directory blocks every later run

**Files modified:** `install/install.ts`, `install/install.js`, `install/migrate-v3-rollback.test.ts`, `install/agents-record.test.ts`, `docs/pre-v3-state-layout.md`
**Commit:** 91518820
**Applied fix:**
- **The notes:** the commit-plan note now says the plan's renames need no putting back. The
  leftover-staging note says the migrate completed and that nothing in the directory is needed. It also
  says every later install and `--migrate` refuses while the directory exists: "remove it by hand
  before the next install".
- **Docs:** "The marker, written last" says the same.
- **Census:** the removal-matcher census has a new REMOVAL_EXEMPT row (hits 137 -> 138, table 90 -> 91,
  install.ts 50 -> 51).

Regression test: an `unlinkSync` fault on the commit plan after a successful migrate gives exit 0, the
marker, and the new note. The old "nothing reads it" wording is gone. The test failed before the fix and
passes after it.

### WR-07: The printed re-run command drops `--archive-done-context`

**Files modified:** `install/install.ts`, `install/install.js`, `install/host-tools.ts`, `install/migrate-v3-context.test.ts`
**Commit:** eaa0bd75
**Applied fix:** `migrateCommand` appends `--archive-done-context` after `--migrate` when the module-level
`ARCHIVE_DONE_CONTEXT` is set. The argument parse assigns that flag before any caller runs, and it is an
argv flag, not a selection const. `CommandMode` in `install/host-tools.ts` gains `--archive-done-context`.
Regression test (C2): the command in the banner after a refused `--migrate --archive-done-context` ends
`--migrate --archive-done-context`. The test failed before the fix and passes after it.
(`host-tools.js` did not change, because the edit is type-only.)

### WR-08: The docs claim a failed migrate leaves the repository as it was, and that no layout marker is written

**Files modified:** `docs/pre-v3-state-layout.md`, `install/README.md`, `CHANGELOG.md`
**Commit:** 7114c849
**Applied fix:**
- **The layout section** says the layout is decided from the board alone. It also says that
  `install --migrate` writes the marker `memory-bank/plans/.layout` and that the marker does not decide
  the layout.
- **"What `--migrate` does" and "The undo"** say three things. The state move is undone and the planning
  state is left as it was. The steps of the same run before it are not undone. The steps after it still
  run: the state seed adds missing standing files outside `memory-bank/plans/`, and the kit tools, ask
  rules and `.grugops/install.json` are written.
- **The undo's list of failing steps** now includes the marker write.
- **README and CHANGELOG** match these sentences.

## Verification

All of it ran in the main checkout, with `GRUGOPS_HOME` and `HOME` set to a scratch directory.

- After every TypeScript change, `npm run build` ran, and `npm run freshness` exited 0 (88 committed
  `.js` files match a rebuild). `npm run typecheck` passes.
- These test files pass: install/state-migrate.test.ts, install/migrate-v3*.test.ts (all six),
  install/state-layout.test.ts, install/pre-v3-layout.test.ts, install/host-tools.test.ts,
  install/agent-flag-census.test.ts, install/record-truth.test.ts, install/installer-dry-run.test.ts,
  scripts/runnable-ref/read-sites.test.ts and scripts/runnable-ref/runnable-exit-contract.test.ts. The
  doc-reading tests pass too: host-tools-prose, host-entry-docs, check-kit-refs and generate-guarantees.
- The census files message-references, agents-record, closing-claims, mode-census and
  path-spelling-census pass. The rows they asked for were added (REMOVAL_EXEMPT, CLASSIFIED_SITES).
- `node scripts/check-state-paths.js`, `node scripts/check-imperative-lexicon.js`, check-banned-claims,
  check-public-docs-vocabulary, check-claim-anchors and check-residual-citations all exit 0.
- **One census check fails, and it failed before these fixes:**
  `installer-fs-census.test.ts > every node:fs export whose name may mark a content read is classified`
  reports `UNCLASSIFIED node:fs export openAsBlobSync`. This host runs Node v26.12.1, whose `node:fs`
  exports `openAsBlobSync`. The check fails the same way on the commit before any fix (82be8ebe, checked
  with `git stash`). It has nothing to do with these fixes. It needs a CONTENT_READER or
  NOT_CONTENT_READER row for `openAsBlobSync`.
- install/install.test.ts passes (455 passed, 1 skipped), including the pin of twelve `process.exit`
  sites. No fix added a `process.exit`.

---

_Fixed: 2026-10-28T20:47:41Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
