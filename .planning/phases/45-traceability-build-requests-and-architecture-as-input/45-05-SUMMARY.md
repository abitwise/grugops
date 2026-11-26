---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 05
subsystem: installer
tags: [build-requests, seed, install, migrate, cross-version, runnable-version-skew, fixtures]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-03: buildRequestText and validBuildRequestParts (scripts/build-request-fixture.test-support.ts); plan 45-04: the build-request budget and grammar in the validator and state-check, and the absent-folder-is-clean rule"
provides:
  - "agent-factory/seed/memory-bank/plans/build-requests/.gitkeep: every fresh install and every re-install seeds the build-request folder"
  - "install/fixtures/v3.0-blocked-board/: a committed v3.0.0-seed planning state with one blocked ticket"
  - "The BR-02 cross-version cases and the deliberate skew run in install/installer-cross-version.test.ts"
affects: [45-07, 45-10]

actuals:
  tokens: 10200
  tasks: 2
  commits: 2
plan_head_before: 886642a7dc06e553e6d08d4e64f279df14e2b793
plan_head_after: d06e30c9d7822ce6d881d9c48addd6aa83e65afa

tech-stack:
  added: []
  patterns:
    - "A cross-version fixture is taken from the tag's seed once, committed with a README naming its source and date, and copied to a scratch target per case"
    - "A comparison with an old release that needs the tag reads the old program with `git show` and skips with a printed reason when the tag is absent; the old validator's verdict is a measured literal, so that case needs no tag"

key-files:
  created:
    - agent-factory/seed/memory-bank/plans/build-requests/.gitkeep
    - install/fixtures/v3.0-blocked-board/README.md
    - install/fixtures/v3.0-blocked-board/memory-bank/plans/tickets/ABC-1.md
    - install/fixtures/v3.0-blocked-board/memory-bank/plans/board.md
  modified:
    - install/install.test.ts
    - install/migrate-v3-states.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/installer-cross-version.test.ts

key-decisions:
  - "`install --migrate` on an installed v3 repository does not seed the build-request folder: its already-migrated arm exits before the install run (install.ts, the `layout.isMigrated && state !== \"pre-v3\"` arm). The plan assumed a fall-through to seedState and allowed no installer change, so S14 pins the measured behavior: --migrate writes nothing, state-check stays clean on the folder-less tree, and the next plain install adds only the keeper. Open for the 45-10 UAT: whether --migrate should also seed"
  - "The fixture holds the whole v3.0.0 seed of memory-bank/plans/ (metrics.md and the ten .gitkeep keepers too), not only the four files the plan listed, as the plan's own rule says when the archive differs"
  - "The validator prints its ERROR and WARNING lines on stderr, so the cross-version cases read the verdict lines from both streams"

patterns-established:
  - "Census pins moved by a seed file get a dated line naming the plan, the requirement, the path and the measured value"

requirements-completed: [BR-02, BR-07]

coverage:
  - id: D1
    description: "A fresh install seeds memory-bank/plans/build-requests/.gitkeep, and the installed state-check reads the keeper as no record"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "install/install.test.ts#layout marker: a fresh install writes LAYOUT_MARKER_CONTENT, and the installed state-check (marker valid, no finding) and trace-render --check pass (D-04, SPLIT-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A re-install over a repository without the folder adds the keeper; an existing BR-1.md is left byte for byte and is named on no write line"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "install/install.test.ts#re-install seeds the build-request folder and never overwrites a request (plan 45-05, BR-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "--migrate on a 3.0.0-shaped installed repository (valid marker, no build-request folder) writes nothing; the next plain install adds only the keeper under memory-bank/"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S14) a current layout with a valid marker and no build-request folder: --migrate writes nothing, and the next install adds only the folder's keeper under memory-bank/"
        status: pass
    human_judgment: true
    rationale: "The plan's must-have said --migrate itself creates the keeper. The installer's already-migrated arm exits before seeding, and the plan forbade installer changes, so the test pins the measured behavior instead. A human decides whether that is acceptable or whether --migrate should seed (a follow-up installer change)"
  - id: D4
    description: "Every install census pin the seed file moves is re-derived from its failing run and dated: WRITE_PATH_COUNT 122 -> 124, READ_PATH_COUNT 84 -> 85, INSTALLED_FILE_COUNT 82 -> 83"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "npx vitest run install/installer-never-installed.test.ts install/installer-special-files.test.ts install/installer-user-edit.test.ts install/record-truth.test.ts install/ledger-provenance.test.ts install/installer-dry-run.test.ts install/installer-write-set.test.ts (1122 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The v3.0 board fixture validates under the current validator (exit 0, ALL CHECKS PASSED, the v3.0.0 validator's one WARNING line) and the current state-check (No findings.); the 3.1 tree gives the same verdict and findings"
    requirement: BR-02
    verification:
      - kind: integration
        ref: "install/installer-cross-version.test.ts#build requests across versions (plan 45-05, BR-02) > (a) and (b)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The v3.0.0 state-check prints No findings. and exits 0 over the v3.0 tree and over the 3.1 tree (blind but silent)"
    requirement: BR-02
    verification:
      - kind: integration
        ref: "install/installer-cross-version.test.ts#build requests across versions (plan 45-05, BR-02) > (c)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The deliberate skew run: the v3.0.0 state-check beside the current siblings reports runnable-version-skew and exits 1; the current upstream.js check in that directory prints one `runnable-version-skew state-check.js:` line and exits 0"
    requirement: BR-02
    verification:
      - kind: integration
        ref: "install/installer-cross-version.test.ts#build requests across versions (plan 45-05, BR-02) > (d)"
        status: pass
    human_judgment: false
  - id: D8
    description: "state-check and upstream.js requests run at the same time over the 3.1 tree exit 0 and 1 (one carry line) and leave its digest unchanged"
    requirement: BR-02
    verification:
      - kind: integration
        ref: "install/installer-cross-version.test.ts#build requests across versions (plan 45-05, BR-02) > [EDGE BR-02/concurrency]"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 05: Build-request seed and cross-version proof Summary

**The seed now carries `memory-bank/plans/build-requests/.gitkeep`, so a fresh install and a re-install create the folder and never touch an existing request. A committed v3.0.0-seed fixture with a blocked ticket validates unchanged under the current validator and state-check, the v3.0.0 state-check is shown silent over 3.1 state, and a mixed `tools/grugops/` is reported by both state-check and `upstream.js check`.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-26T11:36:36Z
- **Completed:** 2026-11-26T11:51:01Z
- **Tasks:** 2
- **Files modified:** 23 (git diff, 16 of them the new fixture)

## Accomplishments
- The seed keeper `agent-factory/seed/memory-bank/plans/build-requests/.gitkeep`. No installer code changed: seedState already walks the seed with per-file skip-if-exists.
- install.test.ts: the fresh-install keeper loop names `BUILD_REQUESTS_REL`, and a new re-install case covers two targets. One has the folder removed and gets the keeper back. The other holds only a `BR-1.md`, which stays byte for byte while the keeper is added.
- migrate-v3-states.test.ts (S14) pins what `--migrate` does on a 3.0.0-shaped installed repository (see Deviations). S9 is unchanged and passes.
- Three census pins re-derived from their failing runs, each with a dated line.
- `install/fixtures/v3.0-blocked-board/`: the v3.0.0 seed's `memory-bank/plans/` (14 files from `git archive v3.0.0`), plus `tickets/ABC-1.md` (the eight-key v3.0 form, column `Blocked`, one `## Blocked` bullet), its board row and a README.
- installer-cross-version.test.ts, describe `build requests across versions (plan 45-05, BR-02)`, cases (a) to (e). With tag v3.0.0 present, all five ran and passed: `Tests 5 passed | 8 skipped` under `-t`, where the 8 skipped are the file's other cases, filtered out by `-t`.

## Task Commits

1. **Task 1: Seed the build-request folder; fresh install, re-install and --migrate** - `72ac1543` (feat)
2. **Task 2: The v3.0 board under v3.1, the old state-check, the skew run** - `d06e30c9` (test)

## Files Created/Modified
- `agent-factory/seed/memory-bank/plans/build-requests/.gitkeep` (new, empty): the folder's keeper
- `install/install.test.ts`: the keeper loop entry and the re-install case
- `install/migrate-v3-states.test.ts`: case (S14), imports `BUILD_REQUESTS_REL` and `spawnSync`
- `install/installer-never-installed.test.ts`: `WRITE_PATH_COUNT` 122 → 124 (83 files and links + 41 directories, measured)
- `install/installer-special-files.test.ts`: `READ_PATH_COUNT` 84 → 85 (measured)
- `install/installer-user-edit.test.ts`: `INSTALLED_FILE_COUNT` 82 → 83 (measured)
- `install/fixtures/v3.0-blocked-board/**` (new, 16 files): the fixture and its README
- `install/installer-cross-version.test.ts`: the new describe and a header paragraph; `RECORDED_FILE_COUNT` did not move

## Decisions Made
See key-decisions in the frontmatter. One needs a human: whether `--migrate` should seed the build-request folder (deviation 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan premise] `--migrate` on an installed v3 repository does not reach seedState**
- **Found during:** Task 1 (case S14)
- **Issue:** The plan said a `--migrate` on a current layout "falls through to" the seedState call, and its first must-have says `install --migrate` creates the keeper. Measured: on an installed two-root repository, install.ts takes the already-migrated arm (`layout.isMigrated && state !== "pre-v3"`). That arm prints the current-layout ok line and `This repo is already migrated to the two-root layout. Nothing to do.`, then exits before the install run. The plan also said "No installer code changes".
- **Fix:** No installer change. S14 asserts the measured behavior:
  - `--migrate` prints the ok line, exits 0 and leaves the target byte-identical.
  - The installed state-check prints `No findings.` on the folder-less tree.
  - The next plain install adds only the keeper under `memory-bank/`.
  
  So a 3.0.0 repository gets the folder on its next install and has no finding before then. A `--migrate` that seeds on that arm would also need a decision about which seed it reads: on that arm the kit home is not refreshed, so it may hold the old kit's seed. That is left to a human.
- **Files modified:** install/migrate-v3-states.test.ts
- **Verification:** `npx vitest run install/install.test.ts install/migrate-v3-states.test.ts`: 501 passed, 1 skipped (502), exit 0
- **Committed in:** 72ac1543

**2. [Rule 3 - Blocking] The state-path gate flagged a quoted path segment in the new test**
- **Found during:** Task 2
- **Issue:** `npm run check:state-paths` failed on `join(target, "memory-bank", "plans", "build-requests")` (a segment spelling outside the allow-list).
- **Fix:** The test names every state path through `install/state-layout.ts` (`BUILD_REQUESTS_REL`, `TICKETS_REL`, `MEMORY_BANK_REL`). The allow-list was not widened.
- **Files modified:** install/installer-cross-version.test.ts
- **Verification:** `npm run check:state-paths`: PASS, before and after the commit
- **Committed in:** d06e30c9

**3. [Plan rule - fixture file list] The archive holds more than the four seed files the plan named**
- **Found during:** Task 2
- **Issue:** `git archive v3.0.0 agent-factory/seed/memory-bank/plans` holds 14 files: board.md, .layout, traceability.md, nfr-catalog.md, metrics.md and nine `.gitkeep` keepers (archive, epics, features, nfr, releases, sprints, tickets, traceability, uat).
- **Fix:** As the plan directs, the fixture uses the archive's list. With ABC-1.md and README.md it holds 16 files.
- **Committed in:** d06e30c9

---

**Total deviations:** 3 (1 plan premise, 1 blocking, 1 the plan's own file-list rule).
**Impact on plan:** Deviation 1 means one must-have truth holds in a changed form: the folder arrives by install, not by `--migrate`. It is recorded as D3 with `human_judgment: true`. The other two do not change the plan's outcome.

## Issues Encountered
- The validator prints its WARNING lines on stderr, so the first run of case (a) saw none. The case now reads both streams. The v3.0.0 validator was checked the same way: its one WARNING line is also on stderr.
- `npm run check:flip-manifest` fails because `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` does not exist. It is not in this plan's scope and not caused by it.

## Verification
- `npx vitest run install/install.test.ts install/migrate-v3-states.test.ts`: 501 passed, 1 skipped, exit 0
- `npx vitest run install/installer-never-installed.test.ts install/installer-special-files.test.ts install/installer-user-edit.test.ts install/record-truth.test.ts install/ledger-provenance.test.ts install/installer-dry-run.test.ts install/installer-write-set.test.ts`: 1122 passed, exit 0
- `npx vitest run install/installer-cross-version.test.ts`: 13 passed; with `-t "build requests across versions"`: 5 passed, and (c) and (d) ran because tag v3.0.0 is present
- `npm run check:state-paths` (PASS) and `npx vitest run install/path-spelling-census.test.ts install/pre-v3-layout.test.ts` (29 passed)
- Also run: `npm run typecheck` (exit 0); `node scripts/check-foundation-guards.js` (exit 0); check:public-docs, banned-claims, nul-bytes, residual-citations, claim-anchors, story-docs, audit-register, diff-disposition, platform-shapes, imperative-lexicon and role-rules (each exit 0); scripts/check-state-paths, check-banned-claims, check-nul-bytes and check-public-docs-vocabulary tests (229 passed)
- Acceptance greps:
  - `git ls-files` lists the keeper.
  - `BUILD_REQUESTS_REL` occurs 10 times in install.test.ts.
  - `(S14)` occurs once in migrate-v3-states.test.ts, and `plan 45-05` once in installer-user-edit.test.ts.
  - `git ls-files install/fixtures/v3.0-blocked-board` lists 16 files.
  - `build requests across versions` occurs once in installer-cross-version.test.ts, and `runnable-version-skew` 3 times.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-07 (`upstream.js requests` lines) can reuse the 3.1 tree in case (e). Its exact stdout today is `carry BR-1 design: open since 2026-11-20`, which 45-07 may change on purpose.
- Plan 45-10 UAT has a second open item next to 45-04's per-file budget: whether `--migrate` on an installed repository should seed the build-request folder (deviation 1).

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: agent-factory/seed/memory-bank/plans/build-requests/.gitkeep, install/fixtures/v3.0-blocked-board/README.md, install/fixtures/v3.0-blocked-board/memory-bank/plans/tickets/ABC-1.md
- FOUND commits on HEAD: 72ac1543, d06e30c9
