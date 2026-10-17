---
phase: 34-model-effort-dial-pi-support
plan: 22
subsystem: installer
tags: [installer, uninstall, win-2, mode-census, pointer-file, removeOwnedEmptyFile, d-23, wr-10, doc-1]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "recordMatches / modeMatches / modeText (34-13), the mode census (34-14), the capability 'POSIX permission bits beyond read-only' and hostCapabilityOrSkip (34-13), record-truth L1 rows"
provides:
  - "record-truth.test.ts CREATED_POINTERS: the pointer files install created, derived from the marker (a block entry and a file entry at one path), count 2 asserted"
  - "one capability-gated end-to-end row per created pointer file: a writable chmod-only edit reaches removeOwnedEmptyFile's recorded-mode comparison; exit 0, blank file kept with the user's mode, left line naming the path and both modes"
  - "mode census posix-bits count 1 -> 2, kind description names the second asker"
  - "check-platform-shapes capability note names both askers (DOC-1)"
  - "WINDOWS.md row 321: the Windows skip of the two pointer rows"
affects: [install/record-truth.test.ts, install/mode-census.test.ts, scripts/check-platform-shapes.ts, .planning/WINDOWS.md]

actuals:
  tokens: 2200
  tasks: 2
  commits: 2
plan_head_before: 96e00e0e2e1d0ffa04981d9806337acd5c07dea5
plan_head_after: dda5664e4d8c8be6cb09de7ade346e9c277edbab

tech-stack:
  added: []
  patterns:
    - "A writable mode change for an end-to-end row: toggle the other-read bit of the stored mode (owner write kept), premises assert the stored change and the write bit; both modes read back and rendered with modeText, never a literal"
    - "The capability name is passed to hostCapabilityOrSkip as a string literal: the census's structural gate matches the literal, not an identifier"

key-files:
  created: []
  modified:
    - install/record-truth.test.ts
    - install/mode-census.test.ts
    - scripts/check-platform-shapes.ts
    - scripts/check-platform-shapes.js
    - .planning/WINDOWS.md

key-decisions:
  - "m1 as planned (null in place of result.beforeMode) does not delete the file: recordMatches fails closed on a null mode when the record carries one, so the file is left with the reason 'its file mode could not be read'. The rows still go red (no left line carries the mode). The deletion the truth names is proven by m1b, a comparison with the mode removed (the record's ;mode= suffix stripped): the file is deleted and the rows go red on existsSync"
  - "The pointer rows' skip lines reference the plan 34-22 WINDOWS.md row by plan, not by number, so the test file did not need a second edit after the row was appended (row 321)"

patterns-established:
  - "End-to-end mode rows: read-only edit where every platform stores it; a writable POSIX-bits edit, capability-gated, where the product must write the file before it compares the mode"

requirements-completed: [HOST-02, PI-03]

coverage:
  - id: D1
    description: "The created pointer files are derived from the base install's marker (block entry and file entry at one path); 2 asserted (CLAUDE.md, .github/copilot-instructions.md), each in REMOVABLE"
    requirement: HOST-02
    verification:
      - kind: integration
        ref: "install/record-truth.test.ts#the pointer files install created are taken from the marker (a block entry and a file entry at one path) and are CREATED_POINTER_COUNT"
        status: pass
    human_judgment: false
  - id: D2
    description: "A writable chmod-only edit to each created pointer file reaches removeOwnedEmptyFile's recorded-mode comparison end to end: exit 0, the file stays blank with the user's mode, a left line names it with 'its file mode is <edited>, not the <installed> install wrote'"
    requirement: HOST-02
    verification:
      - kind: integration
        ref: "install/record-truth.test.ts#CLAUDE.md (a pointer file install created): a writable chmod-only edit reaches the recorded-mode comparison; the file stays blank with the user's mode, exit 0"
        status: pass
      - kind: integration
        ref: "install/record-truth.test.ts#.github/copilot-instructions.md (a pointer file install created): a writable chmod-only edit reaches the recorded-mode comparison; the file stays blank with the user's mode, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "With the capability forced absent, each pointer row prints its SKIPPED line and returns; the run stays green"
    requirement: PI-03
    verification:
      - kind: other
        ref: "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT='POSIX permission bits beyond read-only' npx vitest run install/record-truth.test.ts --silent=false --reporter=verbose | grep -c 'L1 pointer' -> 2, 75 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The mode census holds the new posix-bits chmod (count 2) inside a capability-gated case; the capability note names both askers"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/mode-census.test.ts#every tag names a kind from the closed set, and the per-kind counts are the ones measured"
        status: pass
      - kind: unit
        ref: "install/mode-census.test.ts#a row-315 tag is only in the files WINDOWS.md row 315 names, and a posix-bits chmod is inside a case gated on the POSIX-bits capability"
        status: pass
    human_judgment: false
  - id: D5
    description: "Windows behaviour of the pointer rows (skip expected where the capability is absent) is not measured; WINDOWS.md row 321 is open"
    verification: []
    human_judgment: true
    rationale: "No human-pushed windows-latest run measured this plan (D-21, WIN-3); agents never push"

duration: 32min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 22: Writable chmod-only pointer-file rows (WR-10) Summary

**End-to-end rows for CLAUDE.md and the Copilot file that toggle the other-read bit (owner write kept), so uninstall's block removal writes and removeOwnedEmptyFile's recorded-mode comparison is reached; capability-gated on "POSIX permission bits beyond read-only", mutation-proven, Windows skip ledgered as WINDOWS.md row 321**

## Performance

- **Duration:** 32 min
- **Started:** 2026-10-09T10:33:37Z
- **Completed:** 2026-10-09T11:06:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `CREATED_POINTERS` in install/record-truth.test.ts: the paths holding both a `block` and a `file` entry in the base install's ledger, derived, count 2 asserted (CLAUDE.md, .github/copilot-instructions.md), each asserted to be in REMOVABLE.
- One row per created pointer file. It asks `hostCapabilityOrSkip("POSIX permission bits beyond read-only", "install/record-truth.test.ts: L1 pointer <rel>")` and prints `skipLine(...)` where the capability is absent. Otherwise it reads `before = storedMode(p)`, sets `chmodSync(p, before ^ 0o004)` (tagged `// mode-census: posix-bits`), and checks two premises: the stored mode changed, and the owner write bit is still set. Then it runs uninstall and asserts exit 0, that the file exists and holds only spaces, tabs, CR and LF, that its stored mode is the edited one, and that a `left` line naming `rel` (through `pathText`) carries `its file mode is ${modeText(edited)}, not the ${modeText(before)} install wrote`. On macOS it printed `its file mode is 0640, not the 0644 install wrote`.
- The comment above the direct modeMatches / recordMatches case now says the pointer rows reach the comparison through uninstall where the host stores the bits, and the direct case stays for every host.
- install/mode-census.test.ts: `TAG_KIND_COUNTS["posix-bits"]` 1 -> 2; the posix-bits description names the record-truth asker.
- scripts/check-platform-shapes.ts (+ rebuilt .js): the capability note "Asked only by the two IN-03 cases" now names both askers (DOC-1).
- WINDOWS.md row 321 (open, phase 34, unrun-verify, install/record-truth.test.ts) appended through `gsd-tools windows append`.

## Task Commits

1. **Task 1: End-to-end writable chmod-only pointer-file rows, derived pointer set, capability gate, census count, capability note** - `adab0500` (test)
2. **Task 2: Mutation proofs, WINDOWS.md row 321, regression gate** - `dda5664e` (docs)

## Files Created/Modified

- `install/record-truth.test.ts` - CREATED_POINTERS derivation and count; two capability-gated writable-mode pointer rows; comment above the direct case rewritten
- `install/mode-census.test.ts` - posix-bits count 2; kind description names the second asker
- `scripts/check-platform-shapes.ts` / `.js` - capability note names both askers
- `.planning/WINDOWS.md` - row 321 via `gsd-tools windows append`

## WIN-2 sibling sites (brief §2.4), searches re-run at plan start (HEAD 96e00e0e)

`git grep -n -e "recordMatches(" -e "modeMatches(" -e beforeMode -- install/uninstall.ts install/install-marker.ts install/install.ts`:

| # | Site | Covered by |
|---|------|------------|
| M1 | uninstall.ts:901 removeOwnedEmptyFile `recordMatches(own.entry.content, result.before, result.beforeMode)` (beforeMode set at :829, :833; type at :706, null at :710) | the new pointer rows (end to end); m1, m1b |
| M2 | uninstall.ts:1176 `modeMatches(recordedMode, read.mode)` | existing read-only L1 rows |
| M3 | uninstall.ts:1417 `modeMatches(led.fileMode, read.mode)` | existing L1 `.claude/settings.json` row |
| M4 | install-marker.ts:412 recordMatches, :419 modeMatches call, :444 modeMatches, :528 recordMatches call (checkRecord) | record-truth direct case |

`git grep -n -e "mode-census: posix-bits" -e "POSIX permission bits beyond read-only" -- install scripts` at plan start: installer-prune.test.ts:210 and :218 (M5, IN-03, unchanged), mode-census.test.ts:34 and :80 (M7), check-platform-shapes.ts:683 / .js:540 (M6). After this plan, record-truth.test.ts adds one capability question and one tagged chmod. The census counts 2 posix-bits sites and both are gated. No site was found that the plan's table did not list.

## Mutation proofs

Each was applied, rebuilt where it touched a product file, watched red, then restored byte for byte (`cmp` against a scratch copy of the .ts and .js; `git status --porcelain -- install/uninstall.ts install/uninstall.js` printed nothing) and rebuilt.

| ID | Mutation | Result (first red line) |
|----|----------|-------------------------|
| m1 | uninstall.ts:901 `result.beforeMode` -> `null` | Both pointer rows red: `AssertionError: CLAUDE.md: no left line carries "its file mode is 0640, not the 0644 install wrote"` (the same for the Copilot file). The file was **not** deleted (see the deviation below) |
| m1b | uninstall.ts:901 record with the mode taken out: `own.entry.content.replace(/;mode=.*$/, "")` (the comparison stops asking the mode) | Both pointer rows red: `AssertionError: CLAUDE.md was removed although the user changed its mode`. Under m1b the rest of record-truth (73 tests, including the read-only L1 pointer rows) and installer-marker-retention, installer-prune, ledger, installer-user-edit and uninstall-removal (5 files, 201 tests) stayed green, so no other test caught a deleted blank chmod-only pointer file before this plan |
| m2 | the capability question (5 lines) removed from the pointer rows (one call site serves both rows) | mode-census red: `a posix-bits chmod outside a case that asks hostCapabilityOrSkip("POSIX permission bits beyond read-only", …)` -> `"record-truth.test.ts:392 (in <top-level>) chmodSync(p, before ^ 0o004)"` |
| m3 | the row's edit replaced by `userModeEdit(p)` (clears the write bits) | Both rows red on the premise: `AssertionError: CLAUDE.md: the edited mode 0444 lost the owner write bit, so the block removal could not write` |
| m3b | m3 with that premise also removed | Both rows red on exit: `uninstall did not exit 0 (a 3 means the block removal did not write; read the verify line)`, with `verify  CLAUDE.md start-here pointer: …/CLAUDE.md could not be rewritten (EACCES)`. This is WR-10: the write-failure path |

## Verification

- Task 1 verify: `npm run build && npx vitest run --exclude '**/scripts/e2e/**' install/record-truth.test.ts install/mode-census.test.ts`: 2 files, 90 tests passed.
- Forced-absent verify: run exactly as written (default reporter), `grep -c` printed **0**, because the reporter in this environment does not print console output from passing tests. Rerun with `--reporter=verbose` (`GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT="POSIX permission bits beyond read-only" npx vitest run --exclude '**/scripts/e2e/**' install/record-truth.test.ts --silent=false --reporter=verbose`): `grep -c "L1 pointer"` prints **2**, 75 passed, and both lines read `SKIPPED shape="POSIX permission bits beyond read-only" position="install/record-truth.test.ts: L1 pointer <rel>" platform=darwin: …`.
- Tracer gate (interactive, human_verify_mode end-of-phase, automated-only verify): verify re-run green before Task 2.
- `npm run check:build-parity`: ALL CHECKS PASSED after the Task 1 commit. Before the commit it failed, because the check compares against the committed .js.
- `npm run typecheck`: passed.
- `node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status`: exit 0. `grep -c "34-22" .planning/WINDOWS.md` printed 2 (the table row and the JSON entry).
- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`): 103 files, 7537 tests: **7530 passed, 5 failed, 2 skipped** (3 files failed). The failures:
  - `install/installer-fs-census.test.ts` "UNCLASSIFIED node:fs export openAsBlobSync": known, pre-existing (Node v26.11.0), already in deferred-items.md.
  - `scripts/check-foundation-guards.test.ts` (2) and `scripts/generate-catalog.test.ts` (2): **environmental**. A stray `package.json` appeared at 13:51:38 in the system temp dir (`$TMPDIR/package.json`, 86 bytes, not written by this repository: no tracked file holds its content). Every child `node` run of a script copied under `$TMPDIR` then printed a `[MODULE_TYPELESS_PACKAGE_JSON]` warning to stderr, which the byte-exact output assertions read. Rerun with a clean `TMPDIR` (the scratchpad): both files, 332 tests passed. This plan touches neither file. The stray file is outside the project and was left in place.
- `git diff --name-only 96e00e0e..HEAD -- install/uninstall.ts install/uninstall.js` printed nothing, and so did `git status --porcelain` on the same files.
- No Windows result is claimed (D-21, WIN-3).

## Decisions Made

- The capability name is a string literal at the call. Passing a const identifier failed the census's structural gate (it matches `ts.isStringLiteralLike`), so the identifier was dropped.
- The skip text names "the plan 34-22 row" rather than a row number, so the test is complete before the ledger row exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in the plan's premise] m1 does not delete the file; added m1b, which does**
- **Found during:** Task 2 (mutation proofs), predicted while reading install-marker.ts recordMatches before the mutation.
- **Issue:** The plan said m1 (null in place of `result.beforeMode`) makes the pointer rows red because "the file is removed". recordMatches fails closed on a null mode when the record carries one (`holds: false`, why "its file mode could not be read"), so the file is left. The rows did go red, but on the left-line assertion, not on removal.
- **Fix:** Recorded m1 as observed. Added m1b, the comparison with the mode removed (record suffix stripped), which deletes the blank chmod-only file and turns both rows red on `existsSync`. This proves the must-have truth "a user's blank, chmod-only pointer file would be deleted". Also showed that no other test in record-truth or in the 5 mode-related installer files catches m1b.
- **Files modified:** none (the mutation was restored byte for byte)
- **Committed in:** n/a (SUMMARY record)

**2. [Rule 3 - Blocking] Forced-absent verify count printed 0 under the default reporter**
- **Found during:** Task 1 verify.
- **Issue:** The default reporter here hides console output from passing tests, so the planned `grep -c` printed 0 although both rows skipped.
- **Fix:** Reran with `--reporter=verbose` (the plan allows this) and recorded it above: count 2.
- **Files modified:** none

**3. [Rule 2 - Correctness] m3b added beside m3**
- **Found during:** Task 2.
- **Issue:** Under m3 the row's own owner-write premise fires before the exit and `left`-line assertions the plan named.
- **Fix:** Recorded m3 (premise red) and m3b (premise removed too: exit 3, the EACCES verify line, the WR-10 write-failure path itself).
- **Files modified:** none

---

**Total deviations:** 3 (1 plan-premise correction with an added mutation, 1 verify-reporter adjustment, 1 extra mutation)
**Impact on plan:** No scope change and no product code change. The must-have truths are each proven by a recorded red.

## Issues Encountered

- A stray `$TMPDIR/package.json` from outside this repository made 4 byte-exact output tests in scripts/ red during the full-suite run. They are green with a clean TMPDIR. The file was not removed: it is outside the project and not this plan's to delete. A human may want to look at it: it holds a registry value pointing at `evil.example`, and it appeared mid-run at 13:51:38.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 34-23. WINDOWS.md row 321 joins rows 318 and 320 as open Windows skips for the human-pushed measurement.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*

## Self-Check: PASSED

- Commits adab0500 and dda5664e are ancestors of HEAD; the modified files exist; uninstall.ts and uninstall.js are unchanged since plan_head_before.
