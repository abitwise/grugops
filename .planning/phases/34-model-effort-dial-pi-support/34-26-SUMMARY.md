---
phase: 34-model-effort-dial-pi-support
plan: 26
subsystem: installer
tags: [install, uninstall, closing-banner, exit-codes, DOC-1, G-34-4, typescript, vitest]

requires:
  - phase: 34-25
    provides: AskRulesOutcome and install/closing-claims.test.ts (scratch root, notesBlock, class-rule header)
provides:
  - "--update banner and status chosen together from VERIFY_FINDINGS (INCOMPLETE + exit 3 over a kit it could not copy)"
  - "migrateHandoffs(): boolean and recordBackupsInMarker(): boolean; the already-migrated --migrate closing built from them, DRY_RUN and VERIFY_FINDINGS"
  - "uninstall removeMarker(): MarkerOutcome and markerOutcomeLine(); the preserved block's marker line built from the outcome"
  - "closing-claims.test.ts: U1-U2, B1-B5, C1-C2, the argv-derived MODE_TABLE (17) and the 14-row acting-mode matrix with the snapshot oracle"
  - "install/README.md exit-code table naming --update and --migrate on codes 0 and 3"
affects: [34-verification, installer closing banners, uninstall closing, install/README.md exit codes]

actuals:
  tokens: 18100      # chars/4 over the realized diff c2f1c852..efe81f3e (72424 chars)
  tasks: 3
  commits: 3
plan_head_before: c2f1c85255ae2c6948fa7c1b42ec3f5c5f917067
plan_head_after: efe81f3e340b9bb913b28cb38a31bbd4cb0693ee

tech-stack:
  added: []
  patterns:
    - "A closing banner or sentence is chosen on the same branch as the exit status, from what the run did (27-13), now in the --update and already-migrated --migrate arms too"
    - "A mode census reads the argv loop's syntax tree, so an argument added later is red until it is classified and given rows"
    - "A no-change sentence is checked against byte snapshots of the target and the kit home taken before and after the run"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/closing-claims.test.ts
    - install/README.md

key-decisions:
  - "MarkerOutcome `kept` carries what updateKeptMarker did (rewritten / unchanged / would-rewrite / not-rewritten), so the marker line never says rewritten when the rewrite did not happen"
  - "A failed unlink of the marker (a counted verify) maps to the `left` outcome, because the marker is still there"
  - "The --migrate old-layout verify row uses a legacy config that is a directory (a pre-check refusal), and the --prune-old-kit verify row uses userModeEdit on the marker after an old-layout --migrate, so closing-claims.test.ts adds no chmod call and the mode census is unchanged"

patterns-established:
  - "Outcome-owned closing sentence in uninstall: removeMarker returns a discriminated union, and markerOutcomeLine prints it with an exhaustive never switch"

requirements-completed: [PI-03]

coverage:
  - id: D1
    description: "--update prints == update INCOMPLETE — N item(s) need verification == and exits 3 when a verify was counted; the --check hint and == update complete == only otherwise"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#U1 --update with a kit home that is a regular file / U2 --update with a fresh kit home"
        status: pass
      - kind: integration
        ref: "install/installer-dry-run.test.ts#flow 5: DRY_RUN --update over a real install whose kit VERSION was changed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The already-migrated --migrate names the handoffs backup and whether it was recorded, says what a DRY_RUN would back up, prints migrate INCOMPLETE with exit 3 over a verify, and says nothing was changed only when nothing was"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#B1-B5 (snapshot equality or difference asserted in each)"
        status: pass
    human_judgment: false
  - id: D3
    description: "uninstall's preserved block no longer claims the marker is removed; one line built from removeMarker's MarkerOutcome says what happened to .grugops/install.json"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#C1 clean uninstall / C2 uninstall after a user edit to AGENTS.md"
        status: pass
      - kind: other
        ref: "git grep -n MarkerOutcome install/uninstall.ts (type at :1582, removeMarker return type at :1503, closing use at :2190)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every argument the two argv loops accept is derived from the syntax tree and classified (17, count asserted); every acting mode has a verify row and a clean row; the snapshot oracle holds in every row"
    requirement: PI-03
    verification:
      - kind: unit
        ref: "install/closing-claims.test.ts#the derived argv literals of install.ts and uninstall.ts equal the classification table, count asserted"
        status: pass
      - kind: integration
        ref: "install/closing-claims.test.ts#closing claims: the acting-mode matrix (14 rows)"
        status: pass
    human_judgment: false
  - id: D5
    description: "install/README.md exit-code table and --update section match the new behaviour"
    requirement: PI-03
    verification: []
    human_judgment: true
    rationale: "README prose; no test reads these sentences. Whether they read correctly is a human reading judgment."

duration: 42min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 26: Closing claims for --update, --migrate and uninstall Summary

**`--update`, the already-migrated `--migrate` and uninstall's preserved block now print closing lines built from what the run did: INCOMPLETE with exit 3 over a counted verify, a named handoffs backup instead of "Nothing was changed.", and a marker line from removeMarker's returned MarkerOutcome. An argv-derived mode table and a 14-row matrix with a snapshot oracle test the whole class.**

## Performance

- **Duration:** 42 min (one full-suite run of about 28 minutes)
- **Started:** 2026-10-09T22:01:03Z
- **Completed:** 2026-10-09T22:43:17Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- **Sibling A (`install/install.ts`, the `--update` branch).** After `updateKitHome()`, a counted verify prints `== update INCOMPLETE — N item(s) need verification ==` and no `--check` hint. Otherwise the run prints the hint and `== update complete ==` as before. The branch's single exit call is now `process.exit(VERIFY_FINDINGS > 0 ? 3 : 0)`, the same form the `--prune-old-kit` branch uses. The header comment says the banner and the status are chosen on one branch.
- **Sibling B (`install/install.ts`, the already-migrated `--migrate` arm).**
  - `migrateHandoffs()` returns backupDir's boolean.
  - `recordBackupsInMarker()` returns true only when rewriteLedger rewrote the marker. It returns false when there was nothing to record or the marker could not be used.
  - The closing is built from those values, DRY_RUN and VERIFY_FINDINGS:
    - With a counted verify, it prints `== migrate INCOMPLETE ... ==` in the pre-check refusal's wording, and the run exits 3.
    - With a backup, it prints `This run backed up plans/handoffs/ to <path> and recorded the backup in .grugops/install.json.`, or says the backup was not recorded.
    - Under DRY_RUN, it prints `DRY_RUN: this run would back up plans/handoffs/ ... Nothing was changed.`
    - With neither, it keeps "Nothing to do." / "Nothing was changed.".
  - The leftover-kit advice still prints in every case where it applies, except the INCOMPLETE one. The arm's one exit call passes 3 or 0.
- **Sibling C (`install/uninstall.ts`).** `removeMarker(): MarkerOutcome` returns one outcome per arm, with no change to what it does on disk:
  - `removed`
  - `would-remove`
  - `kept` with what `updateKeptMarker` did; it now returns `KeptRewrite`
  - `left`
  - `absent`

  The preserved block now:
  - lists `agent-factory/  plans/  .planning/  docs/  src/` and the shared kit, plus "every byte in this repo that install did not record adding";
  - names `.grugops/` as seeded state;
  - adds one line built by `markerOutcomeLine()`: `.grugops/install.json (the install marker): <what happened>`.

  The header comment at :86-90 now says the marker "may be" removed and points to the outcome.
- **The mode class (`install/closing-claims.test.ts`).**
  - The typescript AST reads every literal that the install.ts and uninstall.ts argv loops compare the argument with (`===` or `startsWith`). Any other use of the argument variable fails the test.
  - The derived set must equal `MODE_TABLE`, with 17 entries (13 in install.ts, 4 in uninstall.ts). Each entry has a class (acting, reader or modifier) and a reason.
  - The acting modes are install, `--update`, `--migrate`, `--prune-old-kit` and uninstall. The test asserts that this list equals the table's acting flags plus install and uninstall, and that each mode has a verify row and a clean row.
  - The 14-row matrix asserts three things in every row:
    - When a verify line printed, the last banner is `== <mode> INCOMPLETE — N ...` with N equal to the number of verify lines, and the exit is 3.
    - When none printed, the exit is 0 and no INCOMPLETE appears.
    - A no-change sentence (`nothing to do|nothing was changed|nothing changed|nothing was migrated`) appears only when the target and kit-home snapshots are byte-identical before and after.
- **`install/README.md`.**
  - The code 0 row says `--update` prints complete only when the kit was copied, and an already-migrated `--migrate` says what it changed or that nothing was changed.
  - The code 3 row adds `--update` and `--migrate`.
  - The `--update` section adds that a kit that could not be copied is a verify line with exit 3.

## Task Commits

1. **Task 1 (tracer): --update banner and status from VERIFY_FINDINGS** — `afe94f40` (fix)
2. **Task 2: --migrate and uninstall closings from what the run did** — `39ff1558` (fix)
3. **Task 3: mode class, acting-mode matrix, exit-code table** — `efe81f3e` (test)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

`workflow.tdd_mode` is false and the round rules forbid a red commit. So each task is one green commit, and its RED run is recorded here instead of as a separate commit.

**Task 1 RED.** The tests were run against the unchanged build (committed install.js at c2f1c852):
- Command: `TMPDIR=/tmp/gd npx vitest run install/closing-claims.test.ts -t update`.
- Result: `Tests 1 failed | 1 passed | 13 skipped`.
- U1 failed at closing-claims.test.ts:291 with `Expected: "== update INCOMPLETE — 1 item(s) need verification =="` / `Received: "== update complete =="`. The stdout showed `verify ... agent-factory could not be read (ENOTDIR) ... the kit was not copied.` and then `== update complete ==`.
- U2 passed, because a clean update already read correctly.
- Semantic assessment: the target test ran and failed on the planned banner assertion, not on setup. RED is valid.
- **Staging used:** a scratch GRUGOPS_HOME that is a regular file. It reaches a counted verify on this machine (copyKit's `kindAtKitRoot` throws ENOTDIR), so the `userModeEdit` fallback was not needed.

**Task 2 RED.** The tests were run against the build at afe94f40, before the Task 2 change:
- Result: `Tests 6 failed | 1 passed | 15 skipped`. B1, the no-change case, already passed.
- First red lines:
  - B2: `expected +0 to be 1` at :360 (no closing line names the backup).
  - B3: `expected '\n-- handoffs backup (MIGR-04) --\n …' to match /DRY_RUN: this run would back…/`.
  - B4: `Expected "== migrate INCOMPLETE — 1 item(s) need verification ==" Received ""` at :390. The verify line printed and no banner followed.
  - B5: the stdout did not match `/This run backed up plans\/handoffs\//`.
  - C1: `markerLines(block)` was `[]`.
  - C2: `expected +0 to be 1` at :450. The `left ... (kept:` line was asserted and present first.
- Every failure was on the planned closing assertion. RED is valid.

**GREEN.**
- Task 1 verify: `Test Files 4 passed (4)`, `Tests 79 passed | 400 skipped (479)`.
- Task 2 verify: `Test Files 5 passed (5)`, `Tests 352 passed | 145 skipped (497)`.

## Mutation proofs

Each mutation was applied to the `.ts`, built with `npm run build`, and run against install/closing-claims.test.ts. Each was then restored from a saved copy and rebuilt. `cmp` checked install.ts/js and uninstall.ts/js against the saved copies, and `git diff --quiet` showed all four files clean after m7.

- **m4: the `--update` branch back to its unconditional hint, banner and exit 0.** `Tests 2 failed | 36 passed (38)`.
  - U1 failed at :293: `expected '== update complete ==' to be '== update INCOMPLETE — 1 item(s) need…'`.
  - The matrix row "--update, the kit home is a regular file" failed at :759: `the last banner is not INCOMPLETE: expected null not to be null`.
- **m5: "Nothing was changed." printed unconditionally at the start of the already-migrated arm's non-INCOMPLETE branch.** `Tests 3 failed | 35 passed (38)`.
  - The matrix backup row failed on the snapshot oracle at :770: `Expected: "--migrate already migrated, plans/handoffs/ backed up: snapshots identical=true"`, `Received: "... identical=false"`.
  - B2 (:365) and B5 (:408) also went red on their no-change assertions.
- **m6: the uninstall preserved block back to its old fixed lines ("only the install.json marker is removed").** `Tests 2 failed | 36 passed (38)`.
  - The kept-marker row C2 failed at :452: `expected +0 to be 1`, because no marker line was built from the outcome.
  - C1 failed at :439: `expected [] to deeply equal [ Array(1) ]`.
  - **m6b (extra):** a fixed `removed by this run.` marker line in place of the outcome. C2 alone went red at :453: `expected '  .grugops/install.json (the install …' to match /kept, and rewritten so its install le…/`.
- **m7: `} else if (a === "--fake-mode") {` added to the install.ts argv loop.** `Tests 1 failed | 37 passed (38)`. The derived-mode case failed at :550: `an argument the parser accepts is not in MODE_TABLE; classify it and add its rows: expected [ 'install.ts --fake-mode' ] to deeply equal []`.

## Regression gate (final, at the Task 3 tree)

- `npm run build`: exit 0.
- `npm run check:build-parity`: `ALL CHECKS PASSED`.
- `npm run typecheck`: exit 0.
- `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**'` (Node v26.11.0):
  - ` Test Files  1 failed | 103 passed (104)`
  - `      Tests  1 failed | 7573 passed | 2 skipped (7576)`
  - The one red is the known local red: install/installer-fs-census.test.ts, `UNCLASSIFIED node:fs export openAsBlobSync` (Node 26 runtime, deferred-items.md).
- `PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts` (Node v24.12.0): `Test Files 1 passed (1)`, `Tests 24 passed (24)`.
- Exit-site pins are unchanged:
  - install.ts has 9 comment-filtered `process.exit(` lines and 10 raw ones.
  - The forbidden exit-three literal appears 0 times in install.ts and install.js.
  - The install.test.ts MID-SCRIPT and FLUSHES cases pass.
- The mode-census and path-spelling-census tests pass unchanged. No installer test file was added (29), and closing-claims.test.ts makes no chmod call.
- No Windows result is claimed (D-25).

## Files Created/Modified

- `install/install.ts`:
  - the conditional `--update` closing and exit;
  - `migrateHandoffs(): boolean` and `recordBackupsInMarker(): boolean`;
  - the already-migrated `--migrate` closing and exit.
- `install/install.js`: the `tsc` build of the above.
- `install/uninstall.ts`:
  - the `KeptRewrite` and `MarkerOutcome` types;
  - `removeMarker(): MarkerOutcome` and `updateKeptMarker(): KeptRewrite`;
  - `markerOutcomeLine()`;
  - the new preserved block;
  - the header comment's "may be removed".
- `install/uninstall.js`: the `tsc` build of the above.
- `install/closing-claims.test.ts`:
  - U1-U2, B1-B5 and C1-C2;
  - `argvLiterals()` and `MODE_TABLE` (17);
  - the acting-mode matrix (14 rows) with `snapRow` and the `NO_CHANGE` oracle.
- `install/README.md`: the exit-code table (codes 0 and 3) and the `--update` section.

## Decisions Made

- `MarkerOutcome`'s `kept` carries `rewrite: KeptRewrite`. The plan named five kinds, and `kept` was described as "kept and rewritten". But `updateKeptMarker` can also find nothing to take out, preview under DRY_RUN, or fail with a verify. Saying "rewritten" in those cases would be the same class of claim this plan removes.
- A failed unlink of the marker is a counted verify in `unlinkPath`, and the outcome is `left`, because the marker is still there.
- The verify stagings avoid new chmod calls, so the mode census is unchanged:
  - the old-layout `--migrate` refusal uses a legacy config that is a directory;
  - the prune verify row uses `userModeEdit` on the marker, and prints a SKIP with its reason when the process can still write the file (for example as root).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `kept` would have said "rewritten" when updateKeptMarker did not rewrite**
- **Found during:** Task 2.
- **Issue:** The plan described `kept` as "kept and rewritten by updateKeptMarker". `updateKeptMarker` has four results, and only one of them is a rewrite.
- **Fix:** `updateKeptMarker` returns `KeptRewrite`, and the `kept` outcome carries it. Each value has its own sentence.
- **Files modified:** install/uninstall.ts, install/uninstall.js
- **Verification:** C2 asserts the "kept, and rewritten ..." sentence on a run that printed `edited`. The m6b mutation shows that a fixed sentence is caught.
- **Committed in:** 39ff1558

**2. [Rule 3 - Blocking] The matrix's clean rows could not require a `complete` banner**
- **Found during:** Task 3.
- **Issue:** The already-migrated `--migrate` arm prints no `== ... ==` banner at all, so a "complete banner" check went red on correct output. The plan asks only for exit 0 and no INCOMPLETE banner.
- **Fix:** Clean rows assert exit 0 and that no INCOMPLETE appears anywhere.
- **Files modified:** install/closing-claims.test.ts
- **Committed in:** efe81f3e

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** Both keep the closing claims matched to what the run did. Nothing changed in what `--update`, `--migrate` or uninstall do on disk.

## Issues Encountered

- One exploratory probe ran `npx tsx --version` to check for a local TypeScript runner. tsx is not a project dependency. It was already in the npx cache (dated Sep 25), so nothing was downloaded and the project was not touched. The experiments were then run as plain `.mjs` against the committed `.js`.
- When a `plans/handoffs.bak.<ISO>` backup name already exists, backupDir prints `aborted` (not a verify) and returns false. The already-migrated arm then prints "Nothing to do.". Nothing changed in that case, so the snapshot oracle holds. It is noted here as an adjacent wording point, not changed.

## Not covered (recorded, not fixed)

- Per the plan's prohibition, the `writeMarker` `created` label on every marker write is left for plan 34-31 to record in deferred-items.md.
- Windows behaviour is not claimed (D-25).

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

The three WR-12 siblings (A, B, C) of G-34-4 are closed on POSIX, and the class is tested over every mode the parsers accept. Ready for 34-27; its Task 1 is the D-26 checkpoint.

## Self-Check: PASSED

- FOUND: install/install.ts, install/install.js, install/uninstall.ts, install/uninstall.js, install/closing-claims.test.ts, install/README.md
- FOUND commits on HEAD: afe94f40, 39ff1558, efe81f3e (`git rev-list --count c2f1c852..HEAD` = 3)
- Acceptance checks:
  - `update INCOMPLETE` is in install.ts.
  - `MarkerOutcome` is in uninstall.ts (type, return type, closing use).
  - `--prune-old-kit` is in closing-claims.test.ts.
  - The README code 3 row names `--update` and `--migrate`.
  - The exit pins hold at 9 and 10.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*
