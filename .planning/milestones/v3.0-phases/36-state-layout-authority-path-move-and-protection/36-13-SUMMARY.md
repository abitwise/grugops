---
phase: "36"
plan: "13"
subsystem: installer
tags: [state-layout, installer, doctor, migrate, pre-v3, typescript, vitest, docs]

requires:
  - phase: 36
    provides: "stateLayout() and the plain-install refusal from plan 36-12; makePreV3StateFixture and install/pre-v3-layout.test.ts cases (a) to (d); LEGACY_FALLBACK_CLAUSE in every carrier and the kit-home Orchestrator (plans 36-08, 36-10, 36-11); docs/pre-v3-state-layout.md (plan 36-09)"
provides:
  - "seedState asks stateLayout() once: pre-v3 skips every seed path under STATE_ROOT_REL with one `skipped` line; unreadable skips them with one verify naming the path and code; both seeds as always with one stale `note`, never a verify"
  - "The doctor (install --check) prints one state-layout line from stateLayout(): ok for current; WARN naming the pre-v3 board and migrateCommand([]) for pre-v3; WARN that the pre-v3 root is stale for both; WARN with no verdict for unreadable; never docFail. The board stat reads LEGACY_BOARD_REL on a pre-v3 layout"
  - "install/pre-v3-layout.test.ts cases (e) to (m): --migrate skip, both, fresh, ENOTDIR, unreadable --migrate, doctor (pre-v3, both, current), --update fallback and uninstall"
  - "PROJECT.md Key Decisions row [v3.0, D-11]: the pre-v3 fallback is a v3.x transition removed in v4.0 (D-04)"
  - "docs/pre-v3-state-layout.md sections on layout detection, the agent rule, the refusal, --migrate in this release, install --check, both layouts and the v4.0 end; CHANGELOG [Unreleased] Changed and Deprecated entries; install/README.md pointers"
affects: [36-14, phase-38]

actuals:
  tokens: 8137
  tasks: 2
  commits: 4
plan_head_before: bb95ca37ac10c742ee2b03742395e363b0b4b5d0
plan_head_after: e4d13b568e80322365c0a63da2c95c6c57aea1f0

tech-stack:
  added: []
  patterns:
    - "Every entry point that touches per-repo state asks the one layout probe (stateLayout()) once: the plain-install refusal, the seed and the doctor"
    - "A layout note on a healthy-but-stale repository is a `note`, never a `verify`, so it cannot turn a complete run INCOMPLETE"

key-files:
  created:
    - .planning/phases/36-state-layout-authority-path-move-and-protection/tdd-evidence/36-13-task1-red.json
  modified:
    - install/install.ts
    - install/install.js
    - install/pre-v3-layout.test.ts
    - install/mode-census.test.ts
    - install/agents-record.test.ts
    - docs/pre-v3-state-layout.md
    - CHANGELOG.md
    - install/README.md
    - .planning/PROJECT.md

key-decisions:
  - "A fresh layout (no board at either path) prints no doctor layout line: the board stat already FAILs on the absent board, and an `ok` layout line there would report an empty repository as healthy"
  - "The doctor's pre-v3 WARN prints migrateCommand([]) (no agent flag), like the doctor's other flag-less commands; --migrate with no agent flag chooses the agents the marker records"
  - "Seed paths outside STATE_ROOT_REL (the factory configuration, the memory-bank pages) are still seeded on a pre-v3 --migrate run, never-overwrite as always; only the v3 state root is skipped"
  - "LAYOUT-04 is left unchecked: its role-fallback clause is agent behavior, and the live check of it (Task 2's human-check) has not been run"

patterns-established:
  - "Tests in install/pre-v3-layout.test.ts match layout wording (\"pre-v3 layout\", \"state layout: pre-v3 (\"), never the bare word \"pre-v3\", because the scratch directory's own name holds it"

requirements-completed: []

coverage:
  - id: D1
    description: "--migrate on a v1.0 vendored-kit repository holding the pre-v3 board seeds nothing under the v3 state root, keeps the pre-v3 board and ticket byte-identical, prints one `skipped` line naming the pre-v3 state, no verify, exit 0"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(e) --migrate on a v1.0 vendored-kit repository holding the pre-v3 board seeds nothing under the v3 state root and reports one skipped line"
        status: pass
    human_judgment: false
  - id: D2
    description: "A repository with both boards installs on the v3 layout: exit 0, exactly one stale `note` naming the pre-v3 root, both boards, and 'merges or deletes nothing', no verify, both boards byte-identical (D-02)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(f) a repository with both boards installs on the v3 layout with exactly one stale note, no verify, and both boards byte-identical"
        status: pass
    human_judgment: false
  - id: D3
    description: "A fresh repository installs with no layout note; a regular file at the pre-v3 root (ENOTDIR) is not pre-v3 and installs normally, the file byte-identical"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(g) a fresh repository installs with no layout note"
        status: pass
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(h) a regular file at the pre-v3 root (ENOTDIR on its board path) is not pre-v3 and installs normally"
        status: pass
    human_judgment: false
  - id: D4
    description: "--migrate over an unreadable pre-v3 root (EACCES) seeds nothing under the v3 state root and prints exactly one verify naming the path and the code; the run exits 3 (INCOMPLETE)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(i) --migrate over an unreadable pre-v3 root (EACCES) seeds nothing under the v3 state root and reports a verify naming the path and the code"
        status: pass
    human_judgment: false
  - id: D5
    description: "install --check after the --migrate case: exit 0, no FAIL, one state-layout WARN naming the pre-v3 board, the v3 board and a printed --migrate command; the board stat reports the pre-v3 board ok; --strict exits 1; a second --check prints the same line. On a both repository one WARN that the pre-v3 root is stale; on a current install one `ok state layout: memory-bank/plans/` line (D-07)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(j) --check after (e) WARNs once on the pre-v3 layout, names --migrate, never FAILs on it, and says the same twice"
        status: pass
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(k) --check WARNs once that the pre-v3 root is stale on a both repository, and prints one ok layout line on a current install"
        status: pass
    human_judgment: false
  - id: D6
    description: "--update into a scratch kit home leaves a pre-v3 repository byte-identical, and the kit home's roles/orchestrator.md holds LEGACY_FALLBACK_CLAUSE; uninstall on the migrated pre-v3 repository is not refused by the layout and keeps the pre-v3 state (D-05)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(l) --update into a scratch kit home leaves a pre-v3 repository byte-identical, and the kit home's Orchestrator carries the fallback clause"
        status: pass
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(m) uninstall on the migrated pre-v3 repository of (e) is not refused by the layout and keeps the pre-v3 state"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-04 recorded and published: PROJECT.md row [v3.0, D-11] after [v3.0, D-10] with Outcome '— Pending'; docs/pre-v3-state-layout.md states the v4.0 end and quotes LEGACY_FALLBACK_CLAUSE verbatim; CHANGELOG [Unreleased] Changed and Deprecated entries; install/README.md points to the doc with no pre-v3 path spelled"
    verification:
      - kind: other
        ref: "grep -c '^| \\*\\*\\[v3.0, D-11\\]\\*\\* ' .planning/PROJECT.md -> 1; grep -c 'v4.0' CHANGELOG.md 0 -> 1; node scripts/state-path-scan.js install/README.md -> PASS; node scripts/check-uat-oracles.js -> ALL CHECKS PASSED"
        status: pass
      - kind: unit
        ref: "install/message-references.test.ts, install/host-entry-docs.test.ts (61 passed)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Live agent behavior on an unmigrated repository after --update: the Orchestrator reads plans/board.md and says once to run install --migrate, and creates nothing under memory-bank/plans/"
    requirement: LAYOUT-04
    verification: []
    human_judgment: true
    rationale: "Task 2's human-check: the fallback is agent behavior driven by the kit-home Orchestrator text, and only a live host-agent session shows it. The installer half (a plain install refuses and names --migrate) is case (a) of plan 36-12."

duration: 20min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 13: The other entry points to a pre-v3 repository, and the fallback's v4.0 end Summary

**`--migrate` no longer seeds a second board beside a pre-v3 one, a repository holding both boards installs with one stale note, and `install --check` prints one state-layout line (WARN naming `--migrate` on pre-v3, never FAIL), all from the one `stateLayout()` probe; the fallback's removal in v4.0 is recorded as `[v3.0, D-11]` and published.**

## Performance

- **Duration:** about 20 min (plus the 14-min install/ suite run in the background)
- **Started:** 2026-10-21T10:57:18Z
- **Completed:** 2026-10-21T11:17:39Z
- **Tasks:** 2 (Task 1 tracer, TDD)
- **Files modified:** 10 (1 created)

## Accomplishments

- `seedState()` asks `stateLayout()` once before seeding. On pre-v3 (reachable only under `--migrate` since plan 36-12) it skips every seed path under `memory-bank/plans/` and prints one `skipped` line naming the pre-v3 state. On an unreadable layout it skips the same paths and raises one verify naming the path and code (exit 3). On both it seeds as always and prints one `note` that the pre-v3 root is stale, never a verify (D-02, D-05, D-06; T-36-17).
- `doctor()` prints one state-layout line before its stat set: `ok` for current; `WARN` naming the pre-v3 board and `migrateCommand([])` for pre-v3; `WARN` that the pre-v3 root is stale for both; `WARN` with no verdict for unreadable. It never calls docFail for the layout. The board entry of the stat set reads `LEGACY_BOARD_REL` on a pre-v3 layout, so the board checked is the board in use (D-07; T-36-19).
- `install/pre-v3-layout.test.ts` gained cases (e) to (m). All 13 cases in the file pass on this machine; (d) and (i) ran (not skipped).
- `[v3.0, D-11]` sits directly after `[v3.0, D-10]` in PROJECT.md Key Decisions. `docs/pre-v3-state-layout.md` now covers layout detection, the agent rule (verbatim), the refusal, `--migrate` in this release, `install --check`, both layouts and the v4.0 end. `CHANGELOG.md` `[Unreleased]` has Changed and Deprecated entries. `install/README.md` exit-code row `1` and the `--check` section point to the doc (D-04).

## Task Commits

1. **Task 1 RED: failing --migrate, both, doctor, --update and uninstall cases** - `9082bcf5` (test)
2. **Task 1 GREEN: --migrate, a both repository and the doctor ask the state layout** - `9b180951` (feat)
3. **Task 1 pin re-derivation found by the install/ suite (agents-record censuses)** - `7b727eea` (test)
4. **Task 2: record the v4.0 end and publish the pre-v3 behavior** - `e4d13b56` (docs)

**Plan metadata:** the docs(36-13) commit that adds this file.

## TDD Gate Compliance

- **RED:** `9082bcf5`. Record `.planning/phases/36-state-layout-authority-path-move-and-protection/tdd-evidence/36-13-task1-red.json`, classifier verdict `RED_EVIDENCE_OK` (`target_test_failed`). Target: case (e). It ran alone (`-t "v1.0 vendored-kit repository holding"`, tap-flat) and failed on its planned assertion: after an exit-0 `--migrate`, `memory-bank/plans/` existed, because the fall-through into the install run seeded beside the pre-v3 board. The first unfiltered TAP run was refused as `invalid_record` (malformed TAP: vitest's tap-flat prints a multi-line assertion message, case (f)'s stdout, without indenting it), so the record was re-taken from the filtered run. The unfiltered run failed (e), (f), (i), (j), (k) and (m) on their planned assertions and passed (a) to (d), (g), (h) and (l), which describe behavior plans 36-08 to 36-12 already deliver.
- **GREEN:** `9b180951`. All 13 cases pass.
- **REFACTOR:** none.

## Behavior-to-case map (acceptance criterion 3)

| Behavior line | Case in install/pre-v3-layout.test.ts | Status |
|---|---|---|
| --migrate on old-layout + pre-v3: nothing under STATE_ROOT_REL, state byte-identical, one skipped line, exit 0 | (e) | pass |
| both: exit 0, one stale note, no verify, both boards byte-identical | (f) | pass |
| fresh: no layout note | (g) | pass |
| pre-v3 root a regular file (ENOTDIR): installs normally | (h) | pass |
| unreadable --migrate: nothing under STATE_ROOT_REL, verify naming path and code | (i) | pass (ran) |
| --check after --migrate: exit 0, one WARN naming LEGACY_BOARD_REL and --migrate, no FAIL; --strict exits 1; twice the same | (j) | pass |
| --check on both: one stale WARN; on current: one ok layout line | (k) | pass |
| --update: target byte-identical, kit-home orchestrator.md holds LEGACY_FALLBACK_CLAUSE | (l) | pass |
| uninstall on a pre-v3 target: not refused, pre-v3 board byte-identical | (m) | pass |

## Acceptance Criteria

- `grep -c 'stateLayout()' install/install.ts`: 6 (baseline 2: the declaration and the 36-12 refusal; now also seedState, the doctor, and two comments). At least 3: PASS.
- `grep -c 'docFail' install/install.ts`: 13 at the start of Task 1 and 13 after. Unchanged: PASS.
- Every behavior line maps to a named case (table above), all passing: PASS.
- `grep -c '^| \*\*\[v3.0, D-11\]\*\* ' .planning/PROJECT.md`: 1 (baseline 0), Outcome `— Pending`: PASS.
- `grep -c 'v4.0' docs/pre-v3-state-layout.md`: 3; `grep -c 'v4.0' CHANGELOG.md`: 0 -> 1: PASS.
- `node scripts/check-uat-oracles.js`: ALL CHECKS PASSED. The longest line of .planning/STATE.md stayed 2524 characters: PASS.

## Files Created/Modified

- `install/install.ts` / `install/install.js`: the seedState layout branch, the doctor's state-layout line and pre-v3 board stat, and the `LEGACY_STATE_ROOT_REL` import.
- `install/pre-v3-layout.test.ts`: cases (e) to (m) and their helpers.
- `install/mode-census.test.ts`: access-denial/restore 17/26 -> 18/27 for case (i), dated reason.
- `install/agents-record.test.ts`: DOCTOR_REACH_SIZE 54 -> 57, WR24_REACH_SIZE 46 -> 48, one REMOVAL_EXEMPT row (hits 132 -> 133, table 85 -> 86, install.ts 47 -> 48), each with a dated reason.
- `docs/pre-v3-state-layout.md`: seven new sections.
- `CHANGELOG.md`: `[Unreleased]` Changed and Deprecated entries. Nothing above `[Unreleased]` changed (D-09).
- `install/README.md`: two pointer sentences, no pre-v3 path.
- `.planning/PROJECT.md`: the `[v3.0, D-11]` row.
- `tdd-evidence/36-13-task1-red.json`: the RED record.

## Decisions Made

- A fresh layout prints no doctor layout line. The board stat already FAILs on the absent board, and an `ok` line would call an empty repository healthy.
- The doctor's pre-v3 WARN prints the flag-less `--migrate` command, `migrateCommand([])`, as the doctor's other remedies do.
- On a pre-v3 `--migrate` run, seed files outside `memory-bank/plans/` (`.grugops/factory.config.json` and the memory-bank pages) are still seeded, never-overwrite. Only the v3 state root is skipped, as the plan specified.
- LAYOUT-04 is left unchecked in REQUIREMENTS.md (see Next Phase Readiness).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The install/ suite found three agents-record census pins the plan did not list**
- **Found during:** Task 1 (the plan's `npx vitest run install/` verify)
- **Issue:** `install/agents-record.test.ts` pins the doctor's function reach (DI-19 and the WR-24 census) and every removal sentence (D-37). The doctor's new layout line reaches `stateLayout`, its nested `boardAt` and `migrateCommand`, and the both note says "merges or deletes nothing".
- **Fix:** I re-derived each pin from the census's own failure message and gave each a dated reason. I read each new reached function: none reads the marker or this run's kit home, so the DI-19 rows and the C3 table are unchanged. The removal row is negated ("deletes nothing").
- **Files modified:** install/agents-record.test.ts
- **Verification:** install/agents-record.test.ts 212/212 pass.
- **Committed in:** 7b727eea

**2. [Rule 3 - Blocking] The old-layout --migrate fixture needs --backup-edited-kit**
- **Found during:** Task 1 RED
- **Issue:** With every agent flag, `--migrate` on makeOldLayoutFixture refuses (exit 3), because the fixture's `.claude` files differ from the kit and the run cannot ask before overwriting them.
- **Fix:** Cases (e), (i), (j) and (m) pass `--backup-edited-kit`, as install/agents-record.test.ts does for the same fixture.
- **Files modified:** install/pre-v3-layout.test.ts
- **Committed in:** 9082bcf5

**3. [Plan expectation] message-references, installer-fs-census and path-spelling-census needed no re-pin**
- The new doctor WARN prints `migrateCommand([])`, but the message census still passes unchanged; no new fs site and no moved classified path site exist. All three files pass except the pre-existing `openAsBlobSync` row below.

---

**Total deviations:** 2 auto-fixed (Rule 3), 1 planned re-pin not needed.
**Impact on plan:** None on scope.

## Issues Encountered

- **The `npx vitest run install/` verify did not exit 0** (one run, in the background, at 9b180951): 37 files, 2 failed; 2625 tests, 4 failed, 2620 passed, 1 skipped. Three of the failures were the agents-record pins above, fixed in 7b727eea; the file then passed 212/212 on its own. The fourth is `install/installer-fs-census.test.ts`'s unclassified `openAsBlobSync` (Node v26 only; deferred-items.md DI-03, pre-existing). The skip is the pre-existing `it.skip` at install/install.test.ts:645. The suite was not re-run in full after 7b727eea; only the changed file was.
- Plan-level gates after the last commit: `npm run freshness` (78 fresh), `check-foundation-guards`, `check-nul-bytes`, `check-uat-oracles` and `validate-agent-factory` each pass; `check-public-docs-vocabulary`, `check-banned-claims` and `check-imperative-lexicon` pass on the new doc text; `git branch --show-current` prints `main`.

## User Setup Required

None.

## Next Phase Readiness

- Plan 36-14 can wire the old-spelling gate. `docs/pre-v3-state-layout.md` and `CHANGELOG.md` hold pre-v3 paths and are on its planned allow-list. `install/README.md`, `install/install.ts` and the test files scan clean.
- **LAYOUT-04 is not marked complete.** Two parts are delivered and tested: a plain install refuses and names the command (36-12 cases (a)-(d)), and the fallback clause reaches the kit-home Orchestrator after `--update` (case (l), plus the 36-11 carrier test). The third part, an agent actually falling back to `plans/` and printing the one-line notice, is agent behavior. Only Task 2's human-check (a live `/grugops` session on a pre-v3 scratch repository after `--update`) shows it, and that check has not been run. Tick LAYOUT-04 once that check passes, at verification or UAT.
- Phase 38 owns moving the state. The doctor WARN and the `--migrate` skipped line already name the final command (D-06).

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED
