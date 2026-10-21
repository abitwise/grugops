---
phase: "36"
plan: "12"
subsystem: installer
tags: [state-layout, installer, refusal, pre-v3, typescript, vitest]

requires:
  - phase: 36
    provides: "install/state-layout.ts constants (BOARD_REL, LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL, STATE_ROOT_REL) from plan 36-01; makeFixture planting the board at BOARD_REL from plan 36-02"
provides:
  - "install.ts stateLayout(): current | pre-v3 | both | fresh | { unreadable, code }, decided from board-file presence by one lstatSync per board path (D-01)"
  - "The pre-v3 refusal of a plain install: one stderr sentence naming the pre-v3 board, the v3 state root and migrateCommand() over the agents named by flag, exit 1, nothing on stdout, nothing written; an unreadable layout refuses the same way naming the path and code (D-05, D-06)"
  - "makePreV3StateFixture(d) plus PRE_V3_TICKET_REL, PRE_V3_BOARD_TEXT and PRE_V3_TICKET_TEXT in install/installer-paths.test-support.ts (D-08)"
  - "install/pre-v3-layout.test.ts with cases (a) to (d); plan 36-13 adds its --migrate, both, doctor, --update and uninstall cases"
affects: [36-13, 36-14, phase-38]

actuals:
  tokens: 5800
  tasks: 1
  commits: 1
plan_head_before: eba5a861e2781fe8fc308eefb2b6799394585486
plan_head_after: 9d663750960583c885bd2308046024b6c5382476

tech-stack:
  added: []
  patterns:
    - "A layout probe asks each path one lstatSync question: success is present (any entry kind), ENOENT/ENOTDIR is absent, any other code is unreadable and never absent"
    - "A refusal that must precede every write sits beside the existing read-only guards (self-checkout, kit-home overlap), before the --migrate branch and the agent list"

key-files:
  created:
    - install/pre-v3-layout.test.ts
  modified:
    - install/install.ts
    - install/install.js
    - install/installer-paths.test-support.ts
    - install/install.test.ts
    - install/mode-census.test.ts
    - install/message-references.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "stateLayout() refuses when EITHER board path is unreadable (the current board is asked first), following research Pattern 4: an EACCES or ELOOP path is never read as absent, so no second board can be seeded beside unreadable state"
  - "The unreadable refusal names the absolute probed path (join(TARGET, rel)) and the lstat code; the test matches the path through lineNamesPath, as the path-spelling census rule (t3) requires"
  - "The pre-v3 refusal's message fragment is classed 'builder in the same expression' (it prints migrateCommand() in the same string expression); the unreadable refusal's fragment is classed 'message prefix' (it prints no command)"
  - "stateLayout() is a function declaration placed right after errCode, so the doctor (which runs after errCode is initialized) can call it in plan 36-13"

patterns-established:
  - "Pre-v3 state is planted only through makePreV3StateFixture, built from the state-layout constants at run time; no tracked file holds a pre-v3 path for it"

requirements-completed: []

coverage:
  - id: D1
    description: "A plain install on a pre-v3 repository exits 1, prints nothing on stdout and one stderr sentence naming the pre-v3 board, the v3 state root and the --migrate command with the agents named by flag; the target and the kit home are byte-identical by snapshotTree (kit home absent before and after)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(a) refuses with exit 1, nothing on stdout, one stderr sentence naming --migrate, and the target and kit home unchanged"
        status: pass
    human_judgment: false
  - id: D2
    description: "A repeat run refuses again with byte-identical stderr and writes nothing either time (idempotency)"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(b) the same run twice refuses twice with byte-identical stderr and writes nothing either time"
        status: pass
    human_judgment: false
  - id: D3
    description: "DRY_RUN does not exempt the refusal"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(c) DRY_RUN does not exempt the refusal: a preview refuses the same way and writes nothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "An unreadable layout (EACCES on the pre-v3 root) refuses with exit 1, naming the path and the code, and writes nothing"
    requirement: LAYOUT-04
    verification:
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(d) an unreadable layout (EACCES on the pre-v3 root) refuses with exit 1, naming the path and the code, and writes nothing"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every install/ pin the edits moved is re-derived with a dated reason: exit sites 11 -> 12 and raw 12 -> 13, mode-census file count 38 -> 39 and access-denial/restore 16/25 -> 17/26, path-spelling test file count 38 -> 39, message-references install.ts fragments 41 -> 43 with two classified rows"
    verification:
      - kind: unit
        ref: "install/install.test.ts#the twelve MID-SCRIPT exit sites are NOT swept"
        status: pass
      - kind: unit
        ref: "install/mode-census.test.ts, install/path-spelling-census.test.ts, install/message-references.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Edge LAYOUT-04 concurrency: an interrupted plain install on a pre-v3 target leaves it byte-identical because the refusal precedes every write"
    requirement: LAYOUT-04
    verification: []
    human_judgment: true
    rationale: "Backstop truth (verification: backstop in the plan): no test interrupts the process; it follows from the refusal's placement before the first write, which cases (a) to (d) show leaves zero bytes changed"

duration: 20min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 12: Pre-v3 state-layout refusal of a plain install Summary

**A plain install on a repository whose board is still at the pre-v3 root now refuses before any write: one stderr sentence naming the old board, `memory-bank/plans/` and the exact `--migrate` command, exit 1. An unreadable board path refuses too, so it can never be read as absent and seeded over.**

## Performance

- **Duration:** about 20 min (14 of them the install/ suite run)
- **Started:** 2026-10-21T10:34:57Z
- **Completed:** 2026-10-21T10:55:00Z
- **Tasks:** 1 (tracer)
- **Files modified:** 8 (1 created)

## Accomplishments

- `stateLayout()` in `install/install.ts` gives `current`, `pre-v3`, `both`, `fresh` or `{ unreadable, code }`. It decides from board-file presence alone, with one `lstatSync` per board path. `ENOENT` and `ENOTDIR` mean absent. Any other code makes the layout unreadable, never absent. It never uses `existsSync` and writes no layout marker (D-01).
- The refusal block sits directly after the kit-home overlap guard. It comes before the `--migrate` branch, the agent list, the run banner and every write. `--migrate` skips it; `--check`, `--update` and `--prune-old-kit` branch off above it. DRY_RUN does not exempt it. Both arms share one `process.exit(1)` (D-05, D-06). `migrateCommand`'s comment now names this caller.
- `makePreV3StateFixture(d)` plants a user board at `LEGACY_BOARD_REL` and one ticket under the pre-v3 tickets directory. Both are built from the constants, so no tracked file holds a pre-v3 path (D-08).
- `install/pre-v3-layout.test.ts` covers four cases, all passing on this machine: (a) the refusal, (b) a repeat run, (c) DRY_RUN and (d) an unreadable layout. Case (d) ran; it is skipped only on win32 or as root.
- A manual scratch run (GRUGOPS_HOME and HOME both scratch) confirmed the printed command. It names `--claude --migrate` when `--claude` is given, and plain `--migrate` when no agent flag is given.

## Task Commits

1. **Task 1: End-to-end tracer: a plain install on a pre-v3 repository refuses, names --migrate and writes nothing** - `9d663750` (feat)

**Plan metadata:** see the docs(36-12) commit that adds this file.

## Files Created/Modified

- `install/install.ts` / `install/install.js`: the `StateLayout` type, `stateLayout()`, the refusal block, two more state-layout imports, and the `migrateCommand` comment.
- `install/installer-paths.test-support.ts`: `makePreV3StateFixture`, `PRE_V3_TICKET_REL`, `PRE_V3_BOARD_TEXT` and `PRE_V3_TICKET_TEXT`.
- `install/pre-v3-layout.test.ts`: new, cases (a) to (d).
- `install/install.test.ts`: exit-site pins 11 -> 12 (mid-script) and 12 -> 13 (raw), and the title now says "twelve".
- `install/mode-census.test.ts`: INSTALL_TEST_FILE_COUNT 38 -> 39, and access-denial/restore 16/25 -> 17/26 for case (d)'s tagged chmods.
- `install/path-spelling-census.test.ts`: TEST_SCANNED_FILE_COUNT 38 -> 39.
- `install/message-references.test.ts`: two COMMAND_TABLE rows. Class counts: builder in the same expression 14 -> 15, message prefix 6 -> 7. Non-command rows 12 -> 13; install.ts fragments 41 -> 43.

## Decisions Made

- When either board path is unreadable, the layout is unreadable and a plain install refuses (research Pattern 4). This applies even beside a readable v3 board. A board that cannot be asked about is never treated as absent.
- The pre-v3 message fragment is classed "builder in the same expression" because it prints `migrateCommand()`. The unreadable one is classed "message prefix" because it prints no command.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Path-spelling census rule (t3) rejected a raw path comparison in case (d)**
- **Found during:** Task 1
- **Issue:** The first draft of case (d) used `toContain` against a `join(...)`-built path, which `path-spelling-census.test.ts` (t3) forbids.
- **Fix:** Case (d) now matches the path with `lineNamesPath`, and the code with `": EACCES)"`.
- **Files modified:** install/pre-v3-layout.test.ts
- **Committed in:** 9d663750

**2. [Plan expectation] installer-fs-census.test.ts needed no re-pin**
- **Found during:** Task 1
- **Issue:** The plan expected `stateLayout()`'s `lstatSync` site to move an fs-census pin. None moved. `lstatSync` is already classified, and the census has no per-site count that the new call changes. The file's only failure is the pre-existing `openAsBlobSync` (below).
- **Fix:** None needed; the file is not modified.

---

**Total deviations:** 1 auto-fixed (Rule 3), 1 planned edit not needed.
**Impact on plan:** None on scope.

## Issues Encountered

- **The `npx vitest run install/` gate did not exit 0 on this machine** (it exited 1). Result: 37 files, 1 failed, 36 passed; 2616 tests, 1 failed, 2614 passed, 1 skipped. The one failure is `install/installer-fs-census.test.ts`'s check that every `node:fs` export is classified. `openAsBlobSync` is a `node:fs` export on Node v26 only; this machine runs v26.11.1. It is listed in deferred-items.md (DI-03; CI pins Node 22) and existed before this phase. The one skip is the pre-existing `it.skip` at install/install.test.ts:645 (the retired sh-vs-Node parity check). No failure comes from this plan's changes.
- Plan-level gates: `npm run freshness` passes (78 fresh). `check-foundation-guards`, `check-nul-bytes`, `check-uat-oracles` and `validate-agent-factory` each print ALL CHECKS PASSED. `git branch --show-current` prints `main`. `node scripts/state-path-scan.js` over the four plan files exits 0 with zero sites.

## Acceptance Criteria

- `grep -c 'function stateLayout' install/install.ts` -> 1 (PASS)
- `grep -c 'export function makePreV3StateFixture' install/installer-paths.test-support.ts` -> 1 (PASS)
- `grep -c 'mid-script exit sites: 12' install/install.test.ts` -> 1, and the 11 pin -> 0 (PASS)
- `node scripts/state-path-scan.js install/install.ts install/install.js install/pre-v3-layout.test.ts install/installer-paths.test-support.ts` -> exit 0 (PASS)
- Cases (a) to (d) are named in install/pre-v3-layout.test.ts: (a) pass, (b) pass, (c) pass, (d) pass (not skipped)

## User Setup Required

None.

## Next Phase Readiness

- Plan 36-13 can call `stateLayout()` from the doctor and from `seedState()`. It will add the `--migrate` seed skip, the `both` stale-root note and the doctor layout line. It will also add the --migrate, both, doctor, --update and uninstall cases to pre-v3-layout.test.ts.
- LAYOUT-04 stays open until 36-13; it was not marked complete.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED
