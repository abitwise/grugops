---
phase: "36"
plan: "01"
subsystem: installer
tags: [state-layout, installer, uninstaller, prune, protection, old-spelling-scan, typescript]

requires:
  - phase: 35
    provides: v3.0 milestone decisions (D-4 fallback), the carried-forward STATE_ROOTS decision
provides:
  - install/state-layout.ts, the constants-only state path authority (STATE_ROOT_REL, subpaths incl. UAT_REL, the pre-v3 root and its board and handoffs, STATE_ROOTS, STATE_ROOT_COUNT, LEGACY_FALLBACK_CLAUSE)
  - one exported STATE_ROOTS read by install.ts isPruneProtected and uninstall.ts isProtected (memory-bank now protected on both removal paths)
  - scripts/state-path-scan.ts, the counting core of the old-spelling gate, with a scoped CLI (exit 0 / 1 / 2)
affects: [36-02, 36-03, 36-04, 36-05, 36-06, 36-07, 36-08, 36-09, 36-10, 36-11, 36-12, 36-13, 36-14, phase-37, phase-38]

actuals:
  tokens: 22100
  tasks: 3
  commits: 6
plan_head_before: 3d684620a8cdbf1a088ed995cbb9a09548a33fde
plan_head_after: 7bc29ef9672deaa0ad5210738321a4fb835dd800

tech-stack:
  added: []
  patterns:
    - "Constants-only authority module: no import, no function, no class, asserted on its syntax tree"
    - "Count pin compared with .length two-sided, with an in-test mutated-copy control (no bare number)"
    - "Scan patterns built only from imported constants, so the scanner and its test spell the old path nowhere"
    - "Exit 2 = could not run (git failed, unreadable file, empty scan set), never a pass over an empty set"

key-files:
  created:
    - install/state-layout.ts
    - install/state-layout.js
    - install/state-layout.test.ts
    - scripts/state-path-scan.ts
    - scripts/state-path-scan.js
    - scripts/state-path-scan.test.ts
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/kit-source.ts
    - install/kit-source.js
    - install/installer-prune.test.ts
    - install/uninstall-removal.test.ts
    - install/install.test.ts
    - install/agents-record.test.ts
    - install/path-spelling-census.test.ts
    - install/mode-census.test.ts
    - install/message-references.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "STATE_ROOTS order is agent-factory, the pre-v3 root, .planning, .grugops, docs, src, memory-bank; uninstall's preserved banner prints it in that order, so .grugops/ and memory-bank/ now appear in the banner line"
  - "The scan's segment spelling matches the pre-v3 root between two MATCHING quote characters (a backreference), as the plan states; on the live tree this gives 270 segment sites, consistent with research's mixed-quote 273 minus the three sites this plan removed"
  - "countSpellings splits the text at each exact LEGACY_FALLBACK_CLAUSE and counts each piece on its own instead of joining the pieces, so removing a clause can never join text into a hidden site or hide one beside it (the prohibition is: never report fewer sites than the tree holds)"
  - "The scan CLI resolves the repository root with git rev-parse --show-toplevel and reads pathspecs relative to it; a symlink or gitlink is not special-cased (the tree tracks none), and any read error other than ENOENT stops the run with exit 2"
  - "agents-record.test.ts gets one named PRODUCT_MODULE_COUNT replacing five typed 9s, rather than five separate bumps"

patterns-established:
  - "A new state path is added to install/state-layout.ts first; every later plan proves its slice with node scripts/state-path-scan.js <pathspecs>"

requirements-completed: [LAYOUT-02, LAYOUT-03]

coverage:
  - id: D1
    description: "install/state-layout.ts is the constants-only state path authority with every named export, POSIX-relative values and the 199-byte fallback clause tied to its constants"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "install/state-layout.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Prune and uninstall both read the one exported STATE_ROOTS; a recorded path under every root, memory-bank/plans/ included, survives byte-identical with the protected line; prefix-sharing siblings are not protected"
    requirement: LAYOUT-03
    verification:
      - kind: integration
        ref: "install/installer-prune.test.ts#a recorded backup under every STATE_ROOTS root (memory-bank/plans/ included) is left byte-identical, its entry kept"
        status: pass
      - kind: integration
        ref: "install/uninstall-removal.test.ts#a recorded file under every root (memory-bank/plans/ included) is left byte-identical with `(protected path — never removed)`"
        status: pass
      - kind: integration
        ref: "install/uninstall-removal.test.ts#a recorded file under a prefix-sharing sibling of a root is removed; the same record under the root is refused"
        status: pass
      - kind: unit
        ref: "install/state-layout.test.ts#both removal paths read the one list (LAYOUT-03, T-36-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "scripts/state-path-scan.js counts the three old spellings from the constants, subtracts only the exact clause, names the .planning/ exclusion, sorts its output and exits 2 on an empty or unlistable set"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/state-path-scan.test.ts"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js install/uninstall.ts install/kit-source.ts (exit 0)"
        status: pass
    human_judgment: false

duration: 56min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 01: State-layout authority, one protected root list and the old-spelling counting core Summary

**A constants-only `install/state-layout.ts` now spells every state path and exports one `STATE_ROOTS` (memory-bank included) that both prune and uninstall loop over, and `scripts/state-path-scan.js` counts the slash, segment and backslash spellings of the pre-v3 root from those constants, with exit 0/1/2.**

## Performance

- **Duration:** 56 min
- **Started:** 2026-10-21T05:47:58Z
- **Completed:** 2026-10-21T06:43:42Z
- **Tasks:** 3 (plus one pin re-derivation found by the full regression)
- **Files modified:** 20

## Accomplishments

- `install/state-layout.ts` (17 exports, no import, no function, no class): `STATE_ROOT_REL = "memory-bank/plans"` as one literal, ten state subpaths including `UAT_REL` (D-17), the pre-v3 root with its board and handoffs subpaths, `STATE_ROOTS` frozen in the planned order, `STATE_ROOT_COUNT = 7`, and `LEGACY_FALLBACK_CLAUSE`, exactly the 199-byte sentence (D-14, D-06).
- `isPruneProtected` (install.ts) and `isProtected` (uninstall.ts) keep their names and loop over the imported `STATE_ROOTS`. `isSeededState` is deleted, so `reverseDir` asks `isProtected` alone. The preserved banner is generated from the list.
- Integration proof for LAYOUT-03: a recorded backup under every root is left by `--prune-old-kit` with its `under a protected path` line and its ledger entry kept. A recorded file under every root is refused by uninstall with `(protected path — never removed)`. Every planted file is byte-identical afterwards. `docs2/` and `memory-bank-notes/` are not protected.
- `scripts/state-path-scan.ts`: three patterns built from the constants, exact-clause subtraction (D-15), the named `.planning/` exclusion (D-11), latin1 reads of `git ls-files --cached --others --exclude-standard`, sites printed sorted as `path:line: spelling`, totals read from the run, and exit 2 when git fails, a file cannot be read, or the scan set is empty.
- Read-only scan of the whole tree at 2e35f545 (informational; the gate is plan 36-14's): slash 1264, segment 270, backslash 15, 1549 sites in 342 files, 88 legacy paths, 1177 files scanned. `install/uninstall.ts` and `install/kit-source.ts` now report 0. At HEAD before this plan they had 11 sites and 1 site.

## Task Commits

1. **Task 1: tracer, one exported list keeps memory-bank/plans/ out of both removal paths**: `5574304d` (feat). Tracer gate: verify re-run end-to-end and passed before expansion.
2. **Task 2: the list cannot shrink, split or drift; installer sources stop spelling the pre-v3 root**: `3f0eeb03` (test), `59e3468f` (feat)
3. **Task 3: the counting core**: `4cc3bcb9` (test, RED), `2e35f545` (feat, GREEN)
4. **Pin re-derivation found by the full regression**: `7bc29ef9` (test)

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## TDD Gate Compliance

- **Task 2 RED (`3f0eeb03`).** `install/state-layout.test.ts` and the prefix-sibling case passed when first run. This was not a valid RED: the tracer (Task 1) had already delivered the behavior. To check that the tests can fail, the mutation control is built into the test (a copy of the list one root short and one root long both fail the pin). Separately, deleting `memory-bank` from the built `install/state-layout.js` made the prune case and the uninstall case fail, and restoring it made them pass. The module-count pins were red on the tree Task 1 left (11 failures across path-spelling-census, mode-census, message-references and check-foundation-guards), and `59e3468f` made them green.
- **Task 3 RED (`4cc3bcb9`).** The test was run against an uncommitted stub that has the exported surface and no behavior, so it fails on assertions, not on a missing module. Full file: 20 of 24 cases failed on assertions. The classifier refused the full-file vitest TAP as `invalid_record` (one multi-line `actual` value is malformed TAP), so the target was rerun alone: `npx vitest run scripts/state-path-scan.test.ts --reporter=tap-flat -t "one committed file holding each spelling once"`, exit 1. `gsd-tools check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`). Record: `tdd-evidence/36-01-task3-red.json`. Semantic assessment: the target test ran and failed on its first planned assertion (exit status expected 1, got 0) because the stub counts nothing. There was no load, syntax or fixture fault.
- **Task 3 GREEN (`2e35f545`).** 24 of 24 pass.

## Files Created/Modified

- `install/state-layout.ts` / `.js`: the authority (new).
- `install/state-layout.test.ts`: two-sided count pin with a mutated-copy control, POSIX shape, clause-to-constant ties, constants-only AST check, one-list AST check with its own discrimination control (new).
- `scripts/state-path-scan.ts` / `.js`: the counting core and CLI (new).
- `scripts/state-path-scan.test.ts`: plants built from the constants in scratch git repos (new).
- `install/install.ts` / `.js`: STATE_ROOTS import; isPruneProtected loops over it; comment names the constants.
- `install/uninstall.ts` / `.js`: STATE_ROOTS and LEGACY_HANDOFFS_REL import; isProtected loops over the list; isSeededState deleted; the banner is generated from the list; every pre-v3 spelling in comments rewritten; the handoffs backup label is a template literal (same printed text).
- `install/kit-source.ts` / `.js`: one comment no longer spells the pre-v3 root.
- `install/installer-prune.test.ts`: every-root protected-backup case; the five legacy handoffs spellings now use LEGACY_HANDOFFS_REL.
- `install/uninstall-removal.test.ts`: every-root refusal case and the prefix-sibling case.
- `install/install.test.ts`: the runnable-removal decoys come from STATE_ROOTS.
- `install/agents-record.test.ts`, `install/path-spelling-census.test.ts`, `install/mode-census.test.ts`, `install/message-references.test.ts`, `scripts/check-foundation-guards.test.ts`: module-count pins moved with dated reasons.

## Pins moved (each re-derived by listing, with a dated reason line)

| File | Pin | Move |
|------|-----|------|
| install/path-spelling-census.test.ts | SCANNED_FILE_COUNT | 9 -> 10 |
| install/path-spelling-census.test.ts | TEST_SCANNED_FILE_COUNT | 37 -> 38 (not named in the plan) |
| install/mode-census.test.ts | SOURCE_FILE_COUNT | 9 -> 10 |
| install/mode-census.test.ts | INSTALL_TEST_FILE_COUNT | 37 -> 38 |
| install/mode-census.test.ts | SCRIPTS_TEST_FILE_COUNT | 73 -> 74 |
| install/message-references.test.ts | PRODUCT_MODULE_COUNT | 9 -> 10 |
| scripts/check-foundation-guards.test.ts | NON_TEST_MODULE_COUNT | 98 -> 99 -> 100 |
| scripts/check-foundation-guards.test.ts | TRIPWIRE_MODULES | 73 -> 74 (not named in the plan) |
| scripts/check-foundation-guards.test.ts | scripts-scoped reader corpus | 63 -> 64, and 63*3 -> 64*3 (not named in the plan) |
| install/agents-record.test.ts | five typed 9s -> one PRODUCT_MODULE_COUNT | 9 -> 10 (not named in the plan) |

## Decisions Made

See `key-decisions` in the frontmatter. The main ones: segment matching uses matching quotes; clause subtraction counts each piece on its own instead of joining the pieces; agents-record now has one named pin instead of five typed 9s.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Four module-count pins the plan did not name**
- **Found during:** Tasks 2 and 3, and the full regression
- **Issue:** Adding `install/state-layout.ts`, `install/state-layout.test.ts`, `scripts/state-path-scan.ts` and `scripts/state-path-scan.test.ts` turned more pins red than the plan listed: TEST_SCANNED_FILE_COUNT, TRIPWIRE_MODULES, the scripts-scoped reader corpus (two assertions), and five typed product-module counts in agents-record.test.ts.
- **Fix:** Each was re-derived by listing and moved with a dated reason. agents-record's five sites now share one PRODUCT_MODULE_COUNT. The plan allows this: "If any other pin goes red ... re-derive it the same way and record it in the SUMMARY".
- **Files modified:** install/path-spelling-census.test.ts, scripts/check-foundation-guards.test.ts, install/agents-record.test.ts
- **Verification:** each file passes, and agents-record.test.ts passes 212 of 212.
- **Committed in:** 59e3468f, 2e35f545, 7bc29ef9

**2. [Rule 2 - Missing critical] The scan refuses a state-root shape its lookbehinds cannot handle**
- **Found during:** Task 3
- **Issue:** The new-root lookbehinds are correct only while STATE_ROOT_REL is `<parent>/<pre-v3 root name>`. With any other shape the scan would quietly count the new root as old, or the reverse.
- **Fix:** `spellingPatterns()` throws a ScanError (CLI exit 2) when STATE_ROOT_REL has another shape.
- **Files modified:** scripts/state-path-scan.ts
- **Committed in:** 2e35f545

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical). **Impact on plan:** no scope creep. Both keep the plan's derive-and-assert rule.

## Issues Encountered

- Full non-e2e regression (`npx vitest run --exclude '**/scripts/e2e/**'`, one run, at 2e35f545): 7 files failed, 25 tests failed, 8508 passed, 2 skipped.
  - 5 of the 25 failures were this plan's agents-record pins, fixed in 7bc29ef9 (the file then passes 212 of 212).
  - The other 20 have causes outside this plan:
    - 19 read phase-27 and phase-31 records that are no longer under `.planning/phases/` (the milestone archive): context-io 7, context-io-writer-set 2, uat-gate-exit-contract 5, harness-instance-ledger 4, canonical-corpus 1.
    - 1 is the known DI-03 `openAsBlobSync` row on local Node v26.
  - All 20 are logged in `deferred-items.md`. The full run was not repeated after 7bc29ef9; only agents-record.test.ts was rerun.
- The plan's Task 3 verify baseline said uninstall.ts held 11 sites at HEAD. After Task 1 removed the banner line, the list literal and the isSeededState comment, Task 2 found 9 left to rewrite.

## Plan-level verification

1. The seven named test files: 7 passed, 182 tests passed.
2. `npm run freshness`: exit 0 ("All build outputs fresh: 78 committed .js file(s) match a rebuild of their sources").
3. `node scripts/check-foundation-guards.js`, `node scripts/check-nul-bytes.js`, `node scripts/check-uat-oracles.js`: each exit 0.
4. `git branch --show-current`: `main`.

## User Setup Required

None.

## Next Phase Readiness

- Plans 36-02 onward can import the constants and prove each slice with `node scripts/state-path-scan.js <pathspecs>`.
- LAYOUT-02 spans plans 01 to 14 and stays In Progress. LAYOUT-03 is delivered by this plan.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: install/state-layout.ts, install/state-layout.js, install/state-layout.test.ts, scripts/state-path-scan.ts, scripts/state-path-scan.js, scripts/state-path-scan.test.ts
- FOUND commits: 5574304d, 3f0eeb03, 59e3468f, 4cc3bcb9, 2e35f545, 7bc29ef9
