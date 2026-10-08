---
phase: 34-model-effort-dial-pi-support
plan: 18
subsystem: testing
tags: [windows-latest, ci, host-02, d-19, gap-closure, broken-windows-ledger]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "gap round 1 fixes 34-11..34-17 (WIN-1 canonical path spelling, WIN-2 stored modes, censuses, WR-03/06/07)"
provides:
  - "34-VALIDATION.md 'Gap round 1 (D-19): diagnosis and prediction', committed before the push"
  - "34-VALIDATION.md 'Gap round 1 (D-19): measured result' from CI run 37733716975"
  - "WINDOWS.md rows 316 and 317 annotated with the run (both left open), new row 319 for the link-target cause"
  - "HOST-02 decision: NOT MET, recorded in REQUIREMENTS.md traceability"
affects: [34-verification, gap-round-2, HOST-02, WINDOWS.md]

actuals:
  tokens: 10070
  tasks: 3
  commits: 2
plan_head_before: 17fd6be28b4b8468d564e631fe891fbc2d7efae5
plan_head_after: d9d5080d05c5a8b57fa54f59aa363577933280e2

tech-stack:
  added: []
  patterns:
    - "Predict the windows-latest result in a committed record before the human pushes, then read the run against it"
    - "A red the prediction did not expect is a new cause, diagnosed from the printed failure and the source, not fitted into a family"

key-files:
  created:
    - .planning/phases/34-model-effort-dial-pi-support/34-18-SUMMARY.md
  modified:
    - .planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md
    - .planning/WINDOWS.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "HOST-02 NOT MET on run 37733716975: two tests changed by 34-13 (ledger.test.ts treeRecord and backupContentRecord link records) are red on windows-latest; HOST-02 left unchecked, row 316 left open"
  - "Row 317 left open: two of its earlier reds (the same ledger.test.ts pair) are still red by name, so the plan's close condition is not met; no other-family rows appended"
  - "The ledger.test.ts link-record reds are a new cause (rooted symlink target respelled D:\\some\\where by Node on Windows), recorded as WINDOWS.md row 319, not a missed WIN-1/WIN-2 site"

requirements-completed: []

coverage:
  - id: D1
    description: "Prediction section committed before the push (local CI chain green on 17fd6be2; family counts 91/5/43/5 reproduced)"
    requirement: "HOST-02"
    verification:
      - kind: other
        ref: "grep -n 'Gap round 1 (D-19): diagnosis and prediction' 34-VALIDATION.md; commit 9de784e8 is the pushed head"
        status: pass
    human_judgment: false
  - id: D2
    description: "Measured windows-latest result of run 37733716975 recorded with printed counts, per-file table, every red classified, unchanged-body check"
    requirement: "HOST-02"
    verification:
      - kind: other
        ref: "gh run view 37733716975 --json conclusion,headSha,jobs; gh run view --job 113168427323 --log"
        status: pass
    human_judgment: false
  - id: D3
    description: "HOST-02 itself (no phase-34 test red on windows-latest)"
    requirement: "HOST-02"
    verification:
      - kind: other
        ref: "CI run 37733716975 windows-latest: Tests 7 failed, 2 of them changed by 34-13"
        status: fail
    human_judgment: true
    rationale: "HOST-02 is NOT MET on the measured run; a later gap round must fix the ledger.test.ts link-record reds and a human must push a new run"
  - id: D4
    description: "PI-03 Windows record (the Pi rows in the installer lanes on windows-latest)"
    requirement: "PI-03"
    verification:
      - kind: other
        ref: "run 37733716975: installer-user-edit, record-truth, installer-dry-run, uninstall-removal files printed green on windows-latest"
        status: pass
    human_judgment: false

duration: 7h50m
completed: 2026-10-08
status: complete
---

# Phase 34 Plan 18: Gap round 1 measured on windows-latest Summary

**The human pushed CI run 37733716975 (head 9de784e8). windows-latest printed `Tests  7 failed | 7402 passed | 28 skipped (7437)`, against a prediction of 5. The five carried other-family reds are red as predicted, and the five HOST-02 gap tests are green. Two ledger.test.ts link-record tests that 34-13 changed are red on a new cause (a rooted symlink target comes back as `D:\some\where`), so HOST-02 is NOT MET.**

## Performance

- **Duration:** 7h50m wall clock (2026-10-07T22:53:27Z to 2026-10-08T06:43Z). Most of it was the human push and the 53-minute CI run.
- **Started:** 2026-10-07T22:53:27Z
- **Completed:** 2026-10-08T06:43:17Z
- **Tasks:** 3 (Task 2 was the human's push)
- **Files modified:** 3 planning files (34-VALIDATION.md, WINDOWS.md, REQUIREMENTS.md), plus this SUMMARY

## Accomplishments

- Task 1 (before the push): the local CI chain exited 0 on `17fd6be2`. Vitest printed `Test Files  103 passed (103)` and `Tests  7435 passed | 2 skipped (7437)`. The family counts 91 / 5 / 43 / 5 were reproduced from job 112468804112. The prediction was committed as `9de784e8`, which is the head the human pushed.
- Task 3 (after the push), read only through `gh`:
  - Run 37733716975, conclusion failure.
  - headSha `9de784e863280e9510a50e122bf0d8ff12f5a833`, which equals the local HEAD at the push.
  - `test (ubuntu-latest)` (job 113168427533): success.
  - `test (windows-latest)` (job 113168427323): failure at "Vitest (e2e lane excluded)".
  - GitHub printed, verbatim: `Test Files  4 failed | 99 passed (103)` and `Tests  7 failed | 7402 passed | 28 skipped (7437)`.
- Every red classified with the family rule:
  - 5 other family: install.test.ts readUserFile ENOTDIR, install.test.ts W1, installer-write-set.test.ts readUserFile ENOTDIR, kit-plan-limits.test.ts PATH_MAX and NAME_MAX. All five were predicted red, and `git diff 45766c2d..9de784e8` has 0 hunks inside their bodies.
  - 2 match no family: ledger.test.ts:454 and :638, printed `expected 'link:D:\some\where' to be 'link:/some/where'`. Both were predicted green. They are a new cause, diagnosed from the printed failure and the source, and recorded as WINDOWS.md row 319.
- Prediction checks:
  - All 5 predicted reds are red. 2 predicted greens are red.
  - The IN-03 `SKIPPED shape="POSIX permission bits beyond read-only"` lines printed for 0600 and 0664. The predicted vitest skip count was wrong: each case prints and returns, so vitest counts it as passed and the count stays at 28.
  - Two of the three `UNKNOWN - verify` items are partly answered and one is fully answered (see 34-VALIDATION.md).
- HOST-02: **NOT MET**, left unchecked. Its traceability row names the run and the two tests. Rows 316 and 317 are annotated and stay open. No fix was made (plan prohibition).

## Task Commits

1. **Task 1: local CI chain green; windows-latest prediction committed before the push.** `9de784e8` (docs)
2. **Task 2: the human pushes.** No commit. This was the human's act. This continuation executor ran no `git push`. The human reported run 37733716975 from `gh run list --branch main --limit 5`.
3. **Task 3: read the run, record it, re-disposition rows 316/317, classify, decide HOST-02.** `d9d5080d` (docs). `git show --stat` lists only 34-VALIDATION.md, WINDOWS.md and REQUIREMENTS.md.

**Plan metadata:** recorded in the final docs commit (SUMMARY, STATE.md, ROADMAP.md).

## Files Created/Modified

- `.planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md`: the prediction section (Task 1) and the "Gap round 1 (D-19): measured result" section (Task 3). The latter holds the run facts, the verbatim counts, the per-file table, every red with its family, the new-cause diagnosis, the IN-03 skip lines, the answered `UNKNOWN - verify` items, the unchanged-body table and the HOST-02 decision. The HOST-02 Manual-Only row is updated.
- `.planning/WINDOWS.md`: rows 316 and 317 each get one appended sentence naming run 37733716975, head 9de784e8 and the outcome. Their status is unchanged (open). Row 319 was appended through `gsd-tools windows append` (phase 34, `unmet-truth`, install/ledger.test.ts:454).
- `.planning/REQUIREMENTS.md`: the HOST-02 checkbox is still unchecked. The traceability status names the run, the two red tests and row 319.

## Decisions Made

- **HOST-02 NOT MET.** The two red ledger.test.ts tests have bodies that 34-13 changed: hunk `-444,2 +452,1` and hunk `-620,2 +630,3`, both from commit `5a11fc9f`. Under the plan's rule a red counts as carried only if it is one of the five named other-family tests with no hunk in its body, so these two count against HOST-02.
- **Row 317 stays open.** The plan closes it only when none of its earlier reds is still red apart from the five other-family tests. The ledger.test.ts pair were among its earlier reds and are still red by name. So no other-family rows were appended, and `windows fixed 317` was not run.
- **Row 316 stays open.** HOST-02 is not met.
- **The new reds are a new cause, not a missed WIN-1/WIN-2 site.** The printed message matches no family-rule pattern. Its producer is the platform's symlink target preprocessing: a rooted `/some/where` is resolved against the `D:` working drive. It is not the recorded marker/kit-home path that WIN-1 covers, and not a mode.
- **Rows 316/317 annotated through the ledger's own renderer.** The annotation went through `parseLedger`/`renderLedger` of gsd-core's broken-windows module, not a hand edit of the table cell alone. The table is re-rendered from the JSON block, so a table-only edit would be lost on the next ledger write. The diff is exactly the two description changes (table and JSON) plus row 319.

## Deviations from Plan

### Auto-fixed Issues

None in code. One method choice is recorded as a deviation:

**1. [Rule 3 - Blocking] Row annotations written through the ledger renderer instead of a single Edit of the table cell**
- **Found during:** Task 3
- **Issue:** The plan says a description cell "may be annotated with Edit". WINDOWS.md keeps each entry twice, in a rendered table and in a JSON block, and gsd-tools re-renders the table from the JSON on every write. An Edit to the table cell alone would disagree with the JSON and be lost at the next `windows append` or `windows fixed`.
- **Fix:** appended one sentence to each description through `parseLedger` and `renderLedger` (gsd-core broken-windows.cjs). Status and counts were not touched.
- **Files modified:** .planning/WINDOWS.md
- **Verification:** `git diff` shows only the two description lines (table and JSON) plus row 319. `gsd-tools windows status` exits 0.
- **Committed in:** d9d5080d

**Total deviations:** 1 (method only, Rule 3). **Impact:** none on the record. The annotation lasts across ledger writes.

## Issues Encountered

- **The prediction missed two reds.** The prediction itself flagged the masked assertions after each earlier first failure as `UNKNOWN - verify`. Plan 34-12's masked-assertion audit covered WIN-1 reds only. It explicitly put ledger.test :432 and :621 (the earlier first failures of these two tests) outside its scope. Gap round 2 should audit the masked assertions of every earlier WIN-2 red.
- **Product reach of the new cause is `UNKNOWN - verify`.** `linkRecord(src)` (install/install.ts:2482, :3718) and `isOwnLink` (install/user-file.ts:536) compare against `readlinkSync`. The link cases that would show a Windows respelling are `describe.skipIf(!canSymlink)` with `canSymlink = process.platform !== "win32"` in uninstall-removal.test.ts, so this run says nothing about the product side.
- **The Node internals were read locally, not from the leg's Node.** `preprocessSymlinkDestination` was read from local Node v24.12.0 with `--expose-internals`. The leg ran Node v22.23.3, whose copy was not read, so that half is `UNKNOWN - verify`. The printed `D:\some\where` and the `D:` working directory are consistent with that reading.

## Known Stubs

None. This plan changed planning records only.

## Threat Flags

None. No source, network, auth or schema surface was touched. The threat-model mitigations held:
- T-34-48: the result was read only through `gh run view` by run id, with the head sha and the verbatim counts recorded.
- T-34-49: no agent push.
- T-34-50: each red was counted as carried only after the recorded diff check.
- T-34-SC: no installs.

## User Setup Required

None.

## Next Phase Readiness

- Phase 34 is **not** complete. HOST-02 is NOT MET on the measured run, and verification decides what comes next. This was gap round 1 of a maximum of 4.
- Gap round 2 inputs:
  - WINDOWS.md row 319: the ledger.test.ts link-record fixture, plus the product-reach question.
  - The masked-assertion audit of the earlier WIN-2 reds.
  - Row 317's five carried other-family causes, which stay under row 317 until it can close.
- HOST-02 then needs a new human-pushed run.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-08*

## Self-Check: PASSED

- FOUND: .planning/phases/34-model-effort-dial-pi-support/34-18-SUMMARY.md
- FOUND: 9de784e8 (Task 1), d9d5080d (Task 3), 5a11fc9f (the 34-13 commit cited for the two changed bodies), all ancestors of HEAD
- evaluation-scope for 34-18 resolves both task commits on this branch
- Task 3 acceptance: the measured-result section exists; `gsd-tools windows status` exits 0; rows 316/317 annotated, status unchanged (open); HOST-02 unchecked (condition not met); `git show --stat d9d5080d` lists only the three planning files
