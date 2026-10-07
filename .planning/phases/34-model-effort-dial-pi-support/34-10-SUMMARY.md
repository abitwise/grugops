---
phase: 34-model-effort-dial-pi-support
plan: 10
subsystem: testing
tags: [effort-dial, installer, windows-latest, host-02, d-09, d-18, ci, records]
status: complete

requires:
  - phase: 34-01
    provides: "models.effort resolution (resolveEfforts) and effort: emission in the adapter generator"
  - phase: 34-04
    provides: "the Pi prompt template install path (PI_PROMPT_REL), ledger-recorded and uninstall-reversed"
  - phase: 34-09
    provides: "derived host-prose scan; the last code plan before the phase's push"
provides:
  - "install/install.test.ts 'effort delivery': five installer-level cases proving a target's models.effort reaches the installed Claude Code adapters through the committed install.js (zero config and model-only tiered emit no effort: line; an illegal level refuses the adapter class by name)"
  - "docs/audit/29-style-dispositions/34-06.md and 34-08.md disposition rows (check-diff-disposition back to exit 0)"
  - "ROADMAP Phase 34 'Depends on' line stating the Windows-leg dependency is unmet and the phase proceeds under D-09; backlog Phases 999.2, 999.3, 999.4"
  - "34-VALIDATION.md map, D-18 Residual, and the windows-latest measurement of run 37521787426 with a per-file (a)/(b)/(c) classification"
  - "CHANGELOG [Unreleased] entries for the effort dial and Pi"
  - ".planning/WINDOWS.md rows 316 (HOST-02 unmet, phase 34) and 317 (33.1 installer suites red on windows-latest, never recorded)"
affects: [phase-34-verification, phase-34-gap-closure, 33.1-windows-reds]

actuals:
  tokens: 11885
  tasks: 3
  commits: 4
plan_head_before: ceeaa9fe2f72c68e2b5038579bca00581bb6afc4
plan_head_after: b9c02288b734533eb02bc90cccdc6986985a3806

tech-stack:
  added: []
  patterns:
    - "A CI result is recorded only from `gh run view` output, with the run id and head sha, and every red test classified by evidence (same name red in the previous measured run, the introducing commit, the phase's diff hunks)"

key-files:
  created:
    - docs/audit/29-style-dispositions/34-06.md
    - docs/audit/29-style-dispositions/34-08.md
  modified:
    - install/install.test.ts
    - .planning/ROADMAP.md
    - .planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md
    - .planning/WINDOWS.md
    - CHANGELOG.md

key-decisions:
  - "HOST-02 is recorded NOT MET: run 37521787426 (head dc2c7581, equal to the pushed main HEAD) is red on windows-latest with 5 tests this phase added or changed. Nothing was fixed in 34-10 (plan prohibition); gap closure decides."
  - "A red test counts as (b) when this phase added it or changed its body or its inputs, even when it was already red before the phase with the same assertion (installer-dry-run 'flow 10's tree'): HOST-02 counts changed tests, and whether the change caused the failure is a separate fact, stated beside it."
  - "The 139 other windows reds are recorded as carried, not as this phase's: 60 have the same name as a red in the previous measured run 36716255097 (head 3fd78e60, 2026-09-30), and the rest were added or made red by 33.1 gap round 3 (33.1-36..40), never measured on windows before this run. That earlier red run was not recorded anywhere in .planning/; WINDOWS.md row 317 records it."

patterns-established:
  - "Classifying windows reds by name-diff against the previous measured run, then by introducing commit (`git log -S`), then by the phase's diff hunks per test"

requirements-completed: []

duration: ~45min (Task 3 continuation); Tasks 1-2 by the previous executor
completed: 2026-10-07
---

# Phase 34 Plan 10: Installer Effort Delivery, Phase Records and the Windows-latest Measurement Summary

**Effort delivery proven through the shipped install.js (5 mutation-proved cases); D-09, the D-18 residual and backlog 999.2-999.4 recorded; the human-pushed run 37521787426 is red on windows-latest with 5 tests this phase added or changed, so HOST-02 is not met.**

## Performance

- **Duration:** Tasks 1-2 2026-10-06 (previous executor); Task 3 continuation 2026-10-07, about 45 minutes
- **Started:** 2026-10-06T16:45Z (plan ledger base ceeaa9fe)
- **Completed:** 2026-10-07
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- Five installer-level "effort delivery" cases in `install/install.test.ts`: a target's `models.effort` reaches every installed adapter as `resolveEfforts` gives it; zero config and the model-only `tiered` preset give no `effort:` line; an illegal level refuses the adapter class by name while other classes complete; a second install writes no adapter. Mutation-proved both ways.
- ROADMAP Phase 34 "Depends on" line states the Windows-leg dependency is unmet and the phase proceeds under D-09; backlog 999.2 (D-18, DC-3), 999.3 (`fable` alias), 999.4 (kit discovery on non-Claude hosts).
- 34-VALIDATION.md carries the requirement and task map, the D-18 Residual and the windows-latest measurement; CHANGELOG `[Unreleased]` entries added.
- Windows-latest result of the human-pushed run read from GitHub and classified per file and per test.

## Task Commits

1. **Task 1: Effort delivery through the shipped installer** - `2c69971f` (test)
   - Rule 3 deviation in the same task: `206c26f0` (docs) disposition rows for 34-06 and 34-08
2. **Task 2: D-09, D-18 residual, backlog, CHANGELOG, validation map** - `dc2c7581` (docs)
3. **Task 3: windows-latest read from GitHub and recorded (HOST-02)** - `b9c02288` (docs)

## Task 3: the windows-latest measurement (HOST-02)

Read with `gh run view 37521787426 --json conclusion,headSha,jobs` and `gh run view --job 112468804112 --log`.

- **Run id:** 37521787426 (workflow `ci`, push to `main`, 2026-10-06T19:49:51Z)
- **Head sha:** `dc2c7581d4710aed1e288bcab01872a71b38d3e6`. It equals `git rev-parse HEAD` at the push and `origin/main`.
- **Run conclusion:** failure
- **`test (ubuntu-latest)`:** success
- **`test (windows-latest)`:** failure, failed step "Vitest (e2e lane excluded)". GitHub printed `Test Files 13 failed | 87 passed (100)` and `Tests 144 failed | 7165 passed | 28 skipped (7337)`.

**Row (a) check.** WINDOWS.md row 274 is `scripts/board-watch-live.test.ts`; GitHub printed it green (6 tests). Row 315 is the chmod-skipped cases of `install/installer-marker-retention.test.ts` (printed green, 10 tests, 3 skipped) and one skipped case of `install/installer-prune.test.ts`. No red test is a row 274 or 315 case: **(a) = 0**.

**Baseline.** The previous windows-latest measurement of `main` is run 36716255097 (head `3fd78e60`, 2026-09-30, 72 commits before phase 34's first commit). It was red on windows too (67 tests, 9 files) and is recorded nowhere in `.planning/`. 60 of today's 144 reds carry the same full name as a red there.

| Red file | Red | File class | Class (b) tests in it |
|---|---|---|---|
| `install/install.test.ts` | 3 | (b) file | none: all 3 red pre-phase by name; phase hunks touch none of them |
| `install/installer-dry-run.test.ts` | 5 | (b) file | 1: "subset: ... (flow 10's tree)", input `FLOW10_CREATED` changed (d6c2e96a); red pre-phase with the same assertion and value (`expected 3 to be +0`) |
| `install/installer-never-installed.test.ts` | 4 | (b) file | none: 2 carried, 2 added by 33.1-36; the phase-changed count test is green |
| `install/installer-user-edit.test.ts` | 60 | (b) file | 1: the `.pi/prompts/grugops.md` row (exists because install now writes the Pi template; re-pin c20ce923); `exit 3`, marker bound in the other path spelling, like 56 other newly red rows |
| `install/ledger-provenance.test.ts` | 1 | (b) file | none: carried; the phase-changed test is green |
| `install/record-truth.test.ts` | 45 | (b) file | 1: the L1 `.pi/prompts/grugops.md` chmod row (c20ce923); `expected 438 to be 502`, like the 35 L1 rows red pre-phase |
| `install/uninstall-removal.test.ts` | 2 | (b) file | 2: the never-installed blocks/settings/directories case, real and DRY_RUN; body changed (Pi plant, d6c2e96a); printed failure is about `.claude/agents`, not the Pi file; added by 33.1-38 and first run on windows here, so red-before-the-change is `UNKNOWN - verify` |
| `install/installer-kit-home.test.ts` | 2 | (c) | not in either set; added by 33.1-37 |
| `install/installer-prune.test.ts` | 4 | (c) | file named by row 315, but the red cases are not row 315's skipped case; added by 33.1-40 |
| `install/installer-write-set.test.ts` | 2 | (c) | carried by name |
| `install/kit-plan-limits.test.ts` | 2 | (c) | carried by name |
| `install/ledger.test.ts` | 9 | (c) | added by 33.1-36/37/40; this phase did not change `install/ledger.ts` |
| `install/marker-binding.test.ts` | 5 | (c) | carried by name |

**How (b) was decided per test:** (1) a name diff against run 36716255097; (2) `git log -S` on each newly red test name for its introducing commit (all inside 33.1 gap round 3, 2026-10-02..05, except the two `.pi` rows); (3) the phase's diff hunks (`git diff 7030a26f^..HEAD`) mapped to the `it(...)` blocks they sit in. A test is (b) when this phase added it or changed its body or inputs.

**Verdict: HOST-02 NOT MET.** 5 tests this phase added or changed are red on windows-latest. It is reported as a gap and not fixed here (plan prohibition). Two printed message families cover most of the 144 reds: a marker or kit-home path compared in backslash and forward-slash spellings, and Windows file modes (`expected 438 to be 502`). Their cause is not established from the log (`UNKNOWN - verify`).

## Files Created/Modified

- `install/install.test.ts` - "effort delivery" describe (Task 1)
- `docs/audit/29-style-dispositions/34-06.md`, `34-08.md` - disposition rows (Task 1, Rule 3)
- `.planning/ROADMAP.md` - Phase 34 "Depends on" (D-09); backlog 999.2-999.4 (Task 2)
- `CHANGELOG.md` - `[Unreleased]` Added/Changed (Task 2)
- `.planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md` - map, Residuals (Task 2); HOST-02 rows and the windows-latest measurement (Task 3)
- `.planning/WINDOWS.md` - rows 316 and 317 (Task 3)

## Decisions Made

See `key-decisions` in the frontmatter. In short: HOST-02 recorded not met from GitHub's data; a changed test counts as (b) even when it was red before the change; the 139 non-(b) reds are recorded as carried from 33.1 with their evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-diff-disposition red with 6 findings left by plans 34-06 and 34-08**
- **Found during:** Task 1 (whole CI gate chain)
- **Issue:** the CI gate exited 1 with 6 "no disposition row" findings from commits 6ed22d5c, e266afd3, 4e7c02cc
- **Fix:** disposition rows in `docs/audit/29-style-dispositions/34-06.md` and `34-08.md`; the gate exits 0
- **Commit:** 206c26f0

**2. [Rule 2 - Record] WINDOWS.md rows for the windows reds**
- **Found during:** Task 3
- **Issue:** the plan lists 34-VALIDATION.md and the SUMMARY as the record; the broken-windows ledger is the cross-phase record that the ship gate reads, and the earlier red run 36716255097 was in no record at all
- **Fix:** appended row 316 (HOST-02 unmet, phase 34) and row 317 (33.1 installer suites red on windows-latest, phase 33.1). Rows 274 and 315 were not touched.
- **Commit:** b9c02288

## Issues Encountered

- The windows-latest leg was already red on `main` before this phase (run 36716255097, 67 tests) and that result was in no record. It is surfaced here and in WINDOWS.md row 317; who owns it is for the human or the 33.1 follow-up to decide.
- The CHANGELOG first draft (Task 2, previous executor) said AGENTS.md documents Pi; corrected before commit.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 34 verification should read HOST-02 as not met (5 class-(b) windows reds) and route it to gap closure.
- No requirement checkbox was ticked by this plan (plan prohibition; verification decides). The phase is not marked complete.

## Self-Check: PASSED

- FOUND: `.planning/phases/34-model-effort-dial-pi-support/34-10-SUMMARY.md`, `34-VALIDATION.md`, `install/install.test.ts`, `docs/audit/29-style-dispositions/34-06.md`, `34-08.md`, `.planning/WINDOWS.md`
- FOUND commits: 2c69971f, 206c26f0, dc2c7581, b9c02288 (all ancestors of HEAD)
