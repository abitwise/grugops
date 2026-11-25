---
phase: 44-upstream-source-declaration-and-pin-check
plan: 03
subsystem: installer
tags: [upstream, installer, runnable, census, permissions, typescript]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01's scripts/runnable-ref/upstream.js (the host upstream reader) and its NOT_YET_INSTALLED hand-over
provides:
  - tools/grugops/upstream.js installed by every scripted install, recorded in the ledger, removed by uninstall when unedited
  - the D-20 proof that no installer-written host file names a declared upstream source
  - the install census pins re-measured for one more installed program
affects: [44-05, 44-06, 44-07, 44-08, phase-45]

actuals:
  tokens: 7368
  tasks: 2
  commits: 2
plan_head_before: 9663319cc8b9ea061982ac45a18ba25e8e098f60
plan_head_after: cf190c5c0116bf96b3187532572a0efc437c6650

tech-stack:
  added: []
  patterns:
    - "One more RUNNABLES row and its RUNNABLES_MIRROR twin, edited together; every census pin moved by one, measured from the failing run"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-cross-version.test.ts
    - install/installer-never-installed.test.ts
    - install/record-truth.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/ledger-provenance.test.ts
    - scripts/generate-runnable-embeds.test.ts
    - install/README.md

key-decisions:
  - "The D-20 case searches every file in the target (but .git) and in the scratch HOME for the source path, with the declaration itself as the positive control, rather than only the files the plan named"
  - "upstream.js gets an OWN_BODY row (check --root <t> prints the none-declared line, exit 0), measured on an installed commonjs host; without the package file it throws at its first import, exit 1, like the other programs"
  - "NOT_YET_INSTALLED stays in generate-runnable-embeds.test.ts as an empty list, so a future runnable added before its installer row has one named place to wait"

patterns-established:
  - "An installed-runnable addition touches: RUNNABLES, RUNNABLES_MIRROR, install.test.ts mapping integers, OWN_BODY, the never-installed derived list, RUNNABLE_PATH_COUNT and six census files"

requirements-completed: [UP-02]

coverage:
  - id: D1
    description: "A scripted install copies scripts/runnable-ref/upstream.js to tools/grugops/upstream.js byte for byte, and `node tools/grugops/upstream.js check` run from the target root prints `no upstream sources declared` and exits 0 with only PATH set"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "install/install.test.ts#upstream reader on a host (UP-02, D-20) > a fresh install lays down tools/grugops/upstream.js byte-identical to its source, and `check` runs on the host with Node alone"
        status: pass
    human_judgment: false
  - id: D2
    description: "Uninstall removes an unedited tools/grugops/upstream.js; RUNNABLES and RUNNABLES_MIRROR are the same 12-row mapping"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "install/install.test.ts#upstream reader on a host (UP-02, D-20) > uninstall removes an unedited tools/grugops/upstream.js"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false
  - id: D3
    description: "An install for every agent over a target declaring an upstream source at ../design-x writes no rule naming it: opencode.json keeps exactly one external_directory key, and no file in the target or the scratch HOME but the declaration contains design-x"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "install/install.test.ts#upstream reader on a host (UP-02, D-20) > an install for every agent writes no rule naming a declared upstream source: opencode.json keeps only the kit-path external_directory entry (D-20)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every install census pin moved by the new installed file is re-measured, moved by exactly one, and dated with plan 44-03"
    verification:
      - kind: unit
        ref: "npx vitest run install/installer-cross-version.test.ts install/installer-never-installed.test.ts install/record-truth.test.ts install/installer-special-files.test.ts install/installer-user-edit.test.ts install/ledger-provenance.test.ts (464 passed)"
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 03: Install the Host Upstream Reader Summary

**The installer now copies `upstream.js` to `tools/grugops/upstream.js` and records it, and the uninstaller removes it. Tests show the installed copy runs on the host with only Node, and that no installer-written file grants read access to a declared upstream source.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-11-25T08:56:52Z
- **Completed:** 2026-11-25T09:18:15Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- RUNNABLES and RUNNABLES_MIRROR each gained `scripts/runnable-ref/upstream.js` -> `tools/grugops/upstream.js`, with a dated comment (plan 44-03, UP-02, D-08). The two mappings are still equal: 12 rows, 10 programs.
- New describe `upstream reader on a host (UP-02, D-20)` with three cases:
  - after an install, the copy is byte-identical to its source, and `check` prints `no upstream sources declared` and exits 0
  - uninstall removes an unedited copy
  - an install for every agent writes no rule naming a declared source at `../design-x`, and the declaration itself is the positive control
- Every census pin moved by exactly one and carries a dated plan 44-03 line.

## Task Commits

1. **Task 1: install and uninstall upstream.js; prove the installed reader runs and no source read rule is written** - `cffde3ba` (feat)
2. **Task 2: re-measure every install census pin the new installed file moves** - `cf190c5c` (test)

TDD evidence for Task 1: the new describe was first run against the HEAD build of `install.js` and `uninstall.js`, restored with `git show HEAD:...`. Two cases failed: the copy was not installed, so there was nothing to remove. The D-20 case passed at HEAD, as it should, because that prohibition already held. After `npm run build` all three passed.

## Pins moved (before -> after, each measured from the failing run)

| File | Pin | Before | After |
|------|-----|--------|-------|
| install/install.test.ts | RUNNABLE_RELS / mirror / srcSideInstall | 11 | 12 |
| install/install.test.ts | PROGRAM_RELS (two sites) / programRows | 9 | 10 |
| install/install.test.ts | never-installed derived list `rec.files.length` | 21 | 22 |
| install/uninstall-removal.test.ts | RUNNABLE_PATH_COUNT | 9 | 10 |
| install/installer-cross-version.test.ts | RECORDED_FILE_COUNT (and its why-string "10 runnables") | 49 | 50 |
| install/installer-never-installed.test.ts | WRITE_PATH_COUNT | 121 | 122 |
| install/record-truth.test.ts | REMOVABLE_COUNT | 51 | 52 |
| install/installer-special-files.test.ts | READ_PATH_COUNT | 83 | 84 |
| install/installer-user-edit.test.ts | INSTALLED_FILE_COUNT | 81 | 82 |
| install/ledger-provenance.test.ts | CREATED (and the case title: 22 files, 10 runnables) | 21 | 22 |

Each delta is exactly one, and each failure listing that printed paths names `tools/grugops/upstream.js`.

## Files Created/Modified

- `install/install.ts` (+ `.js`): RUNNABLES row for the host upstream reader
- `install/uninstall.ts` (+ `.js`): the RUNNABLES_MIRROR twin row
- `install/install.test.ts`: the new describe, the moved mapping pins, and the `upstream.js` OWN_BODY row
- `install/uninstall-removal.test.ts`: RUNNABLE_PATH_COUNT 9 -> 10
- six census test files: one pin each, dated
- `scripts/generate-runnable-embeds.test.ts`: NOT_YET_INSTALLED emptied (deviation 1)
- `install/README.md`: upstream.js named among the installed programs and in the update-together list (deviation 3)

## Decisions Made

- The D-20 search reads every regular file under the target (except `.git`) and under the scratch HOME. That is stronger than checking the named permission files, and it includes the kit home copy.
- No permission, read or external-directory rule for upstream sources was added anywhere in the installer (D-20, T-44-25).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] NOT_YET_INSTALLED in scripts/generate-runnable-embeds.test.ts (handed over by plan 44-01, deviation 4)**
- **Found during:** Task 1
- **Issue:** the two-sided case asserted that upstream.js is not installed, so it went red as soon as the row landed (measured: 6 installed against 5 expected).
- **Fix:** emptied the list, added a dated comment, and made the assertion message general.
- **Files modified:** scripts/generate-runnable-embeds.test.ts
- **Verification:** the file passes, as part of the 569-test Task 1 run.
- **Committed in:** cffde3ba

**2. [Rule 3 - Blocking] install.test.ts pins beyond the named mapping integers**
- **Found during:** Task 1
- **Issue:** two kinds of install.test.ts pin also moved. First, the `tools/grugops/package.json` invocation table (OWN_BODY) is checked two-sided against PROGRAM_RELS, and it threw for the program with no row. That red four package.json cases. Second, the never-installed zero-byte case pins the derived file list (measured 22 against 21).
- **Fix:** added the `upstream.js` OWN_BODY row, measured on an installed commonjs host: `check --root <t>` prints `no upstream sources declared` and exits 0. With the package file removed it throws at its first import and exits 1, so the premise case holds. Also moved the derived-list pin 21 -> 22 with a dated line.
- **Files modified:** install/install.test.ts
- **Verification:** install/install.test.ts passes.
- **Committed in:** cffde3ba

**3. [Rule 2 - Missing critical] install/README.md update-together instruction**
- **Found during:** Task 1 (a sweep for every file that names the installed programs)
- **Issue:** state-check's RUNNABLE_SET includes `upstream.js`, so state-check compares its build stamp. The README told users to remove five programs and install again to update. Following that would have left a stale `upstream.js` behind and caused a `runnable-version-skew` finding. The README also did not list the new installed file.
- **Fix:** added a short paragraph about `tools/grugops/upstream.js`, including that install writes no read rule for a declared source. Made the update-together list and the skew sentence name six programs.
- **Files modified:** install/README.md
- **Verification:** check:public-docs, check:banned-claims, check:claim-anchors, check:imperative-lexicon, check:state-paths, check:story-docs and check:residual-citations all exit 0. The five README-reading test files (251 tests) pass.
- **Committed in:** cffde3ba

---

**Total deviations:** 3 auto-fixed (2 Rule 3, 1 Rule 2)
**Impact on plan:** No scope creep. Deviation 1 was expected and sanctioned by the orchestrator. Deviations 2 and 3 follow directly from installing one more program.

## Issues Encountered

- `install/installer-fs-census.test.ts` fails on `openAsBlobSync` under local Node 26. This is the known DI-03 environment issue (CI pins Node 22) and is not related to this plan.

## Verification

- `npx vitest run install/install.test.ts -t "upstream reader on a host"`: 3 passed
- `npx vitest run install/install.test.ts install/uninstall-removal.test.ts scripts/generate-runnable-embeds.test.ts`: 569 passed, 1 skipped
- the six census files: 464 passed
- regression sweep over the 44 other test files that name `tools/grugops`, RUNNABLES or `runnable-ref`: 6188 passed, 1 skipped, and 1 failed (the known DI-03 case above)
- `npm run typecheck`, `npm run freshness` (95 committed `.js` fresh) and `node scripts/check-foundation-guards.js` (ALL CHECKS PASSED): all exit 0
- The full suite was not run, because it takes over 20 minutes (per the orchestrator's testing notes)

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Workflow 20 and the Workflow 17 session start (plans 44-07 and 44-08) can name `node tools/grugops/upstream.js check`, because the path now exists on every scripted install.
- Any later runnable needs the same set of changes. The pin table above is that checklist.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
