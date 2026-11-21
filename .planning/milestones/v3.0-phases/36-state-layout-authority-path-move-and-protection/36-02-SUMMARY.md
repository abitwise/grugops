---
phase: "36"
plan: "02"
subsystem: installer
tags: [state-layout, installer, seed, doctor, memory-bank, typescript]

requires:
  - phase: 36
    provides: "install/state-layout.ts (BOARD_REL and the state subpath constants) and scripts/state-path-scan.js, from plan 36-01"
provides:
  - "The seed tree at agent-factory/seed/memory-bank/plans/ (moved with git mv) plus uat/.gitkeep, so a fresh install seeds memory-bank/plans/ and creates no top-level pre-v3 state directory"
  - "The doctor's board stat at join(TARGET, BOARD_REL)"
  - "Both makeFixture copies planting the user board at BOARD_REL, ahead of plan 36-12's old-layout refusal"
  - "board-corpus.ts and check-imperative-lexicon.ts reaching the seed board through BOARD_REL"
affects: [36-03, 36-06, 36-12, 36-13, 36-14, phase-37, phase-38]

actuals:
  tokens: 11700
  tasks: 1
  commits: 1
plan_head_before: e7e288f0a9428049b62e88cc0a90c07a09944559
plan_head_after: 731c772a4958495158ca5967aa8c99bf3749f709

tech-stack:
  added: []
  patterns:
    - "A seed-path reader in scripts/ builds the path as `agent-factory/seed/${BOARD_REL}` (a POSIX template string, never node:path join, so the cited source stays a forward-slash key)"
    - "A test that copies scripts/*.js into a scratch build keeps the repository layout (scripts/ beside install/) once the module imports ../install/state-layout.js"

key-files:
  created:
    - agent-factory/seed/memory-bank/plans/uat/.gitkeep
  modified:
    - agent-factory/seed/memory-bank/plans/board.md (moved from agent-factory/seed/plans/)
    - agent-factory/seed/memory-bank/plans/nfr-catalog.md (moved)
    - agent-factory/seed/memory-bank/plans/{metrics.md,traceability.md,epics,features,releases,sprints,tickets} (moved, bytes unchanged)
    - agent-factory/writing-profile.md
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/installer-paths.test-support.ts
    - install/installer-never-installed.test.ts
    - install/installer-write-set.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/host-entries.test.ts
    - install/ledger-provenance.test.ts
    - scripts/board-corpus.ts
    - scripts/board-corpus.js
    - scripts/board-corpus.test.ts
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/board-model.test.ts

key-decisions:
  - "board-corpus.ts KIT keeps its value (the repository's own pre-v3 board) but is spelled LEGACY_BOARD_REL, because the plan's acceptance scan includes board-corpus.ts and must exit 0; plan 36-06 changes it to BOARD_REL when the repository's state moves"
  - "The two-root test asserts the seeded files are files and the seeded trees are directories (statSync), uat/.gitkeep included, and that no top-level LEGACY_STATE_ROOT_REL exists; this replaces the narrower handoffs-absent assertion, which it implies"
  - "The three LAYOUT-01 edge truths (empty target, interrupted-seed re-run, DRY_RUN ordering) got their own install.test.ts cases named `two-root: ...`, so the plan's `-t two-root` filter runs them"

patterns-established:
  - "A seed move is proved by asserting every seeded path from the state-layout constants, never by listing literal paths"

requirements-completed: [LAYOUT-01, LAYOUT-02]

coverage:
  - id: D1
    description: "A fresh install seeds board, NFR catalog, traceability, metrics and the tickets/epics/features/sprints/releases/uat trees under memory-bank/plans/ and creates no top-level pre-v3 state directory; the user board at BOARD_REL keeps its bytes"
    requirement: LAYOUT-01
    verification:
      - kind: integration
        ref: "install/install.test.ts#two-root: the per-repo state plane is seeded under memory-bank/plans/ and no pre-v3 state root is created (config + marker + memory-bank/; MIGR-02, LAYOUT-01)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#two-root: an empty target and a target holding only an empty memory-bank/ both get the full memory-bank/plans/ set from one install (LAYOUT-01)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#two-root: a re-run after an interrupted seed restores only the missing memory-bank/plans/ files and overwrites none (LAYOUT-01)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#two-root: two DRY_RUN previews of one target print identical memory-bank/plans/ seed lines (LAYOUT-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The doctor's board stat reads join(TARGET, BOARD_REL); a FIFO or a directory planted at BOARD_REL is never reported ok"
    requirement: LAYOUT-02
    verification:
      - kind: integration
        ref: "install/installer-write-set.test.ts#--check: a FIFO at memory-bank/plans/board.md is never reported ok"
        status: pass
      - kind: other
        ref: "grep -c 'join(TARGET, BOARD_REL)' install/install.ts (prints 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every seed-board reader names the path through the authority: the scan over agent-factory/seed, board-corpus.ts/.js and check-imperative-lexicon.ts/.js/.test.ts reports zero sites"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js agent-factory/seed scripts/board-corpus.ts scripts/board-corpus.js scripts/check-imperative-lexicon.ts scripts/check-imperative-lexicon.js scripts/check-imperative-lexicon.test.ts (exit 0, 25 files)"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts, scripts/check-imperative-lexicon.test.ts, scripts/board-model.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three write/read/installed-file pins re-derived from each test's printed measurement with a dated reason"
    requirement: LAYOUT-01
    verification:
      - kind: integration
        ref: "install/installer-never-installed.test.ts, install/installer-special-files.test.ts, install/installer-user-edit.test.ts"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 02: Seed move to memory-bank/plans/ and the seed-board readers Summary

**`git mv` put the seed at `agent-factory/seed/memory-bank/plans/` (plus `uat/.gitkeep`), so `seedState` now writes every state file under `memory-bank/plans/` with no installer code change. The doctor checks `join(TARGET, BOARD_REL)`, both `makeFixture` copies plant the user board at `BOARD_REL`, and the seed-board readers in `scripts/` name the path through `install/state-layout.js`.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-10-21T06:47:28Z
- **Completed:** 2026-10-21T07:17:03Z
- **Tasks:** 1 (tracer)
- **Files modified:** 28 in the task commit (10 of them seed renames)

## Accomplishments

- **Seed move.** Ten seed paths are renamed by `git mv`, and `git log --follow` reaches the pre-move history of `board.md`. `uat/.gitkeep` is added (D-17). The five pre-v3 path mentions in the seed `board.md` and `nfr-catalog.md` prose now read `memory-bank/plans/...`; nothing else in those files changed.
- **Doctor.** The board entry in the `--check` refs table is `join(TARGET, BOARD_REL)`. Its PRESENCE IS NOT PROOF comment names the board through the constant. Plan 36-13 makes this entry layout-aware.
- **Fixtures.** Both `makeFixture` copies plant `user board\n` at `BOARD_REL`, using a recursive mkdir of its dirname. Every survival assertion reads the board there: install.test.ts uninstall, runnable removal, prune and closing cases; host-entries; and the DC-1 FIFO/directory doctor plant in installer-write-set.
- **The two-root test** checks every seeded path from `BOARD_REL`, `NFR_CATALOG_REL`, `TRACEABILITY_REL`, `METRICS_REL`, `TICKETS_REL`, `EPICS_REL`, `FEATURES_REL`, `SPRINTS_REL`, `RELEASES_REL` and `UAT_REL`, by kind. It also checks that no top-level `LEGACY_STATE_ROOT_REL` exists after a fresh install. Three edge cases were added:
  - An empty target and a target with only an empty `memory-bank/` both get the full set, with seed bytes, from one install.
  - A re-run after a simulated interrupted seed restores the missing `metrics.md` and `uat/` and keeps a user-edited `traceability.md`.
  - Two DRY_RUN previews print identical, non-empty seed lines.
  - **Mutation check:** moving the seed's `uat/` aside made 3 of the 4 LAYOUT-01 cases fail, and restoring it made all 4 pass. The ordering case is not about uat/, so it was expected to keep passing.
- **scripts/.**
  - `board-corpus.ts` SEED and `check-imperative-lexicon.ts` BOARD (and the test copies) are `` `agent-factory/seed/${BOARD_REL}` ``. The lexicon test's mirror directory is `` `agent-factory/seed/${STATE_ROOT_REL}` ``.
  - The lexicon's `runScratchGate` now builds `scripts/` beside `install/state-layout.js`, because the gate imports `../install/state-layout.js`.

## Task Commits

1. **Task 1: tracer, a fresh install seeds memory-bank/plans/ and the doctor checks the board there**: `731c772a` (feat).
   - Tracer gate (interactive, `end-of-phase`, automated-only verify): the verify was re-run end-to-end and passed before the plan closed. There are no expansion tasks.

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Pins moved (each re-derived from the test's own printed measurement, dated 2026-10-21, plan 36-02)

| File | Pin | Move | Measured |
|------|-----|------|----------|
| install/installer-never-installed.test.ts | WRITE_PATH_COUNT | 102 -> 104 | 67 files and links + 37 directories |
| install/installer-special-files.test.ts | READ_PATH_COUNT | 68 -> 69 (not named in the plan) | READ_PATHS (69) |
| install/installer-user-edit.test.ts | INSTALLED_FILE_COUNT | 66 -> 67 (not named in the plan) | INSTALLED_FILES (67) |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two install/ pins the plan did not name**
- **Found during:** Task 1, the `npx vitest run install/` run
- **Issue:** `uat/.gitkeep` is one more seeded file, so READ_PATH_COUNT (installer-special-files) and INSTALLED_FILE_COUNT (installer-user-edit) went red.
- **Fix:** Each pin was re-derived from the test's printed set, with a dated reason. The plan allows this ("If any other install/ pin goes red ... re-derive it").
- **Verification:** both files pass, 158 of 158.
- **Committed in:** 731c772a

**2. [Rule 3 - Blocking] The lexicon scratch build could not resolve the new import**
- **Found during:** Task 1, before running the lexicon tests
- **Issue:** `runScratchGate` copied `scripts/*.js` into a flat temporary directory. The gate now imports `../install/state-layout.js`, which would not resolve there.
- **Fix:** The scratch build now holds `scripts/` with `install/state-layout.js` beside it.
- **Verification:** scripts/check-imperative-lexicon.test.ts passes.
- **Committed in:** 731c772a

**3. [Rule 1 - Bug] A kit document pointed at the moved seed board**
- **Found during:** Task 1, grep for the old seed path
- **Issue:** `agent-factory/writing-profile.md:199` names the board-column source as the old seed path, which no longer exists after the move.
- **Fix:** The line now reads `agent-factory/seed/memory-bank/plans/board.md`. The line count is unchanged.
- **Verification:** `node scripts/check-kit-refs.js` exits 0 and `scripts/check-banned-claims.test.ts` passes.
- **Committed in:** 731c772a

**4. [Rule 3 - Blocking] board-corpus.ts KIT spelled through the authority**
- **Found during:** Task 1, the acceptance scan
- **Issue:** The plan says KIT stays as it is until plan 36-06. But its acceptance scan covers `scripts/board-corpus.ts`, and the literal pre-v3 board path there counts as a site. One comment (line 22) also spelled it.
- **Fix:** KIT keeps its value and is now written `LEGACY_BOARD_REL`. The comment says "the repository's own board". Plan 36-06 changes KIT to BOARD_REL.
- **Verification:** the scan exits 0, and board-corpus.test.ts passes.
- **Committed in:** 731c772a

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug). **Impact on plan:** no scope creep. Each fix follows the plan's derive-and-assert rule or keeps its acceptance scan honest.

## Issues Encountered

- **`npx vitest run install/` (one full run, 815 s):** 36 files, 3 failed tests, 2608 passed, 1 skipped.
  - Two failures were this plan's pins (deviation 1). They were fixed and both files re-run green, 158 of 158. The full install/ run was not repeated after that fix.
  - The third is the known DI-03 `openAsBlobSync` row in installer-fs-census (local Node v26.11.1 only; CI pins Node 22), already logged in `deferred-items.md`.
  - So `npx vitest run install/` exits 1 on this machine, and only because of the DI-03 row.
- **Scripts tests:** 13 files that read or import a changed file, 2079 tests.
  - The only failures were the 7 known context-io failures (absent phase-31 records, already deferred).
  - The scripts tests were run before the writing-profile line fix. `check-banned-claims.test.ts` and `check-imperative-lexicon.test.ts` read writing-profile and are among the 13.
- **CI gate scripts run by hand:**
  - Exit 0: check-foundation-guards, check-imperative-lexicon, check-nul-bytes, check-uat-oracles, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-audit-register, check-banned-claims, check-claim-anchors, check-kit-refs, check-platform-shapes, check-public-docs-vocabulary, check-residual-citations.
  - `check-build-parity` exit 0 after the commit.
  - `check-flip-manifest` exits 1 because it reads an archived phase-33 manifest. This failure was there before this plan and is logged in `deferred-items.md`.

## Plan-level verification

1. `npx vitest run install/ scripts/board-corpus.test.ts scripts/check-imperative-lexicon.test.ts scripts/board-model.test.ts`: green except the DI-03 row (see above).
2. `npm run freshness`: exit 0 ("All build outputs fresh: 78 committed .js file(s) match a rebuild of their sources").
3. check-foundation-guards, check-imperative-lexicon, check-nul-bytes and check-uat-oracles: each exit 0.
4. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: exit 0.
5. `git branch --show-current`: `main`.

Acceptance criteria:
- the seed directory test: PASS.
- `git log --follow` on the moved board: more than one commit, PASS.
- `grep -c 'join(TARGET, BOARD_REL)' install/install.ts`: 1, PASS.
- the scoped state-path scan: exit 0, PASS.
- `npx vitest run install/`: green except the deferred DI-03 row.

## User Setup Required

None.

## Next Phase Readiness

- Plan 36-03 can move install.ts and the remaining installer tests onto the authority. The handoffs assertions (install.test.ts around lines 4380-4560) and closing-claims `handoffsBackups` still spell the pre-v3 root. They stage their own handoffs directory, so they stay green after this plan.
- LAYOUT-01 and LAYOUT-02 continue in later plans (last contributor 36-14). They stay unchecked in REQUIREMENTS.md.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: agent-factory/seed/memory-bank/plans/board.md, agent-factory/seed/memory-bank/plans/uat/.gitkeep, install/installer-paths.test-support.ts (contains BOARD_REL)
- FOUND commit: 731c772a
