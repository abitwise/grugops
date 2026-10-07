---
phase: 34-model-effort-dial-pi-support
plan: 13
subsystem: testing
tags: [win-2, windows, file-mode, test-helpers, host-capability, gap-closure]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-11/34-12: WIN-1 canonical path spelling (product and tests), so copied markers bind on Windows and the L1 rows reach the mode assertion"
provides:
  - "modeText: one file-mode renderer, in install/user-file.ts (modeOctal deleted). install-marker.ts re-exports it, so install.ts is unchanged"
  - "recordedModeOf(record) and modeMatches(recordedMode, mode) in install/install-marker.ts. recordMatches and both uninstall created-file checks (Gemini, ask rules) compare through them"
  - "storedMode(p) and userModeEdit(p) in install/installer-paths.test-support.ts. userModeEdit clears the write bits, which every platform stores, and throws when nothing was stored"
  - "record-truth L1 rows use userModeEdit and storedMode, plus one direct case of the comparison on the stored change"
  - "ledger.test.ts W4-W9 and installer-prune.test.ts W3 take expected modes from storedMode and make mode edits through userModeEdit"
  - "HOST_CAPABILITIES entry 'POSIX permission bits beyond read-only', asked only by the two IN-03 cases, with a printed skip"
  - "WINDOWS.md row 318 (unrun-verify) for the gated IN-03 cases"
affects: [34-14, 34-18, HOST-02, PI-03, WINDOWS.md rows 316/317/318]

actuals:
  tokens: 12260
  tasks: 2
  commits: 2
plan_head_before: 8244872c0576e90fa3e1753633ca51563c32cef2
plan_head_after: 5a11fc9f4b78a69885371b4a5e876bf960b870ac

tech-stack:
  added: []
  patterns:
    - "A test models 'the user changed the mode' only through userModeEdit (clear the write bits) and reads every expected mode back with storedMode. It never writes a literal mode"
    - "Product code renders a mode only through modeText and compares a recorded mode only through modeMatches"
    - "A claim that needs POSIX bits beyond read-only is gated on a measured HOST_CAPABILITIES probe with skipLine, never on process.platform"

key-files:
  created: []
  modified:
    - install/user-file.ts
    - install/install-marker.ts
    - install/uninstall.ts
    - install/installer-paths.test-support.ts
    - install/record-truth.test.ts
    - install/ledger.test.ts
    - install/installer-prune.test.ts
    - scripts/check-platform-shapes.ts
    - .planning/WINDOWS.md

key-decisions:
  - "recordedModeOf returns the whole text after ';mode=' (four octal digits in a well-formed record), not a regex capture of exactly four digits. A malformed suffix then never matches, so the check fails closed, and recordMatches behaves exactly as before. The regex the Gemini site used would have treated a malformed suffix as 'no mode' (fail open). Every ledger record is validated by isFileRecord, so no well-formed input changes behaviour"
  - "A direct case was added in record-truth.test.ts that runs modeMatches, recordMatches and recordedModeOf against a userModeEdit change. A read-only pointer file (CLAUDE.md, the Copilot file) stops uninstall's block removal before the mode is compared, so those two L1 rows no longer test the comparison (see Deviations)"
  - "The IN-03 chmod line is tagged 'mode-census: posix-bits'. Plan 34-14's closed tag set {access-denial, restore, row-315} has no kind for a chmod that a capability gates; 34-14 must add this kind or reclassify the line"
  - "The capability's skipLine names the route that still covers the claim: the same case on a host that stores POSIX bits. It points at WINDOWS.md row 318 for the gap"

patterns-established:
  - "WIN-2 test authority: installer-paths.test-support.ts owns storedMode and userModeEdit. WIN-2 product authority: user-file.ts modeText plus install-marker.ts modeMatches"

requirements-completed: [HOST-02, PI-03]

coverage:
  - id: D1
    description: "Product mode handling: one renderer (modeText in user-file.ts) and one recorded-mode comparison (modeMatches), used by recordMatches and both uninstall created-file checks. No behaviour or message change"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/record-truth.test.ts#modeMatches / recordMatches: a mode the user cleared the write bits of no longer matches the recorded mode"
        status: pass
      - kind: integration
        ref: "npx vitest run install/record-truth.test.ts install/ledger.test.ts install/sentinel-block-record.test.ts install/installer-marker-retention.test.ts (183 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The record-truth L1 rows, including the HOST-02 row '.pi/prompts/grugops.md: a chmod-only edit survives uninstall', edit the mode through userModeEdit and pass on this host"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/record-truth.test.ts#.pi/prompts/grugops.md: a chmod-only edit survives uninstall (the file stays, with the user's mode)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ledger.test.ts W4-W9 and installer-prune.test.ts W3 expect stored modes and edit through userModeEdit. The IN-03 cases are gated on the new capability and ran on this host"
    verification:
      - kind: integration
        ref: "npx vitest run install/ledger.test.ts install/installer-prune.test.ts install/settings-json-provenance.test.ts scripts/check-platform-shapes.test.ts (141 passed)"
        status: pass
      - kind: other
        ref: "node scripts/check-platform-shapes.js: HOST CAPABILITIES (4), all present, ALL CHECKS PASSED, exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The windows-latest effect of this plan on the WIN-2 reds of run 37521787426 (43 tests)"
    verification: []
    human_judgment: true
    rationale: "WIN-3: Windows behaviour is measured only by a windows-latest run the human pushes (plan 34-18). This macOS run proves the helpers and the comparison. It does not show a green Windows leg."

duration: 26min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 13: WIN-2, a user mode edit every platform stores, one mode renderer and one mode comparison Summary

**Installer tests now model "the user changed the file mode" by clearing the write bits, through one helper (`userModeEdit`), and read back every expected mode with `storedMode`. Clearing the write bits is the one mode change Windows stores, as its read-only attribute. The product has one mode renderer (`modeText` in user-file.ts) and one recorded-mode comparison (`modeMatches`). The two IN-03 cases need 0600/0664 bits, so they are gated on a measured host capability with a printed skip and WINDOWS.md row 318.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-07T20:06:31Z
- **Completed:** 2026-10-07T20:32:29Z
- **Tasks:** 2 of 2
- **Files modified:** 13, including 3 compiled .js (256 insertions, 77 deletions)

## Accomplishments

- **Product (Task 1):**
  - `modeText` is now defined once, in install/user-file.ts. `modeOctal` is deleted, and the tree and file record lines render through `modeText`.
  - install-marker.ts imports `modeText` and re-exports it under the same name, so install.ts and install.js are untouched.
  - New in install-marker.ts: `recordedModeOf(record)` and `modeMatches(recordedMode, mode)`.
  - `recordMatches` uses both. uninstall.ts:1175-1176 (created Gemini file) and :1417 (created settings file) call `modeMatches` instead of comparing inline. No message changed.
- **Test helpers:** `storedMode(p)` and `userModeEdit(p)` in install/installer-paths.test-support.ts. The doc comment is in clear voice and cites run 37521787426. `userModeEdit` throws, naming the path and both modes, when the platform stored no change.
- **record-truth L1 rows:** `const mode = userModeEdit(p)`, then the assertions are status in {0, 3}, the file still exists, and `storedMode(p)` equals `mode`. The local `modeOf` and the `chmodSync`/`statSync` imports are gone.
- **ledger.test.ts:**
  - W4: `scratch()` returns the stored mode, and the expected records are built from it.
  - W5: `before = storedMode`, `after = userModeEdit`. The reason must contain `file mode is ${modeText(after)}, not the ${modeText(before)}`.
  - W6: the tree's file is changed with `userModeEdit`.
  - W7: the expected record is built from `storedMode`.
  - W8: `kitFile` returns `mode` and `rec` built from `storedMode`. "a record of another mode" uses `mode ^ 0o200`.
  - W9: the backup gets `userModeEdit` and the expected record uses the mode that comes back.
- **installer-prune.test.ts:**
  - W3: "a chmod" is now `userModeEdit`.
  - W2: both IN-03 cases first call `hostCapabilityOrSkip("POSIX permission bits beyond read-only", …)`. When the capability is absent they print `skipLine` and return.
  - W10: the raw chmod lines are tagged: `access-denial` (1), `restore` (3), `row-315` (2).
  - The local `modeOf` now renders through `modeText(storedMode(p))`.
- **Capability:** one new `HOST_CAPABILITIES` entry, with `reasonWhenAbsent` in clear voice. Its probe chmods a scratch file to 0o600 and then to 0o664, and returns true only if each mode reads back exactly. No count pin needed updating: check-platform-shapes.test.ts asserts only that the set is non-empty, and uat-gate-exit-contract.test.ts derives its count from `HOST_CAPABILITIES.length`.
- **WINDOWS.md row 318** was appended through `gsd-tools windows append` (kind unrun-verify, phase 34, file install/installer-prune.test.ts). Totals went from 317 to 318, and open from 242 to 243.

## Task Commits

1. **Task 1 (tracer): one mode renderer, one comparison, the user-mode-edit helper, the L1 rows.** Commit `b5af3a02` (fix). It leaves install/install.ts and install/install.js unchanged. Tracer gate: end-of-phase mode with an automated-only verify. The verify was re-run (197 passed with the path-spelling census included) and passed, so expansion went ahead.
2. **Task 2: W3-W10, the POSIX-bits capability for IN-03, WINDOWS.md row 318, regression gate.** Commit `5a11fc9f` (test).

## Sibling searches (re-run at execution HEAD 8244872c)

- `git grep -n chmodSync -- '*.test.ts' '*.test-support.ts'`: this matches the plan's table, with line numbers moved by 34-12. ledger.test.ts had 6 chmod sites (:286, :338, :430, :444, :543, :623). After this plan it has 0. installer-prune.test.ts now has 7 chmod lines, all tagged. install.test.ts, installer-marker-retention.test.ts, settings-json-provenance.test.ts and the scripts tests are untouched; their tags belong to plan 34-14.
- `fileRecord(…, 0o…)` literals still in place after this plan:
  - ledger.test.ts:79 `FILE_REC = fileRecord("x", 0o644)`. This is a grammar fixture and is never compared with a file on disk.
  - ledger.test.ts:565 `fileRecord("other", mode)`. Its mode is no longer a literal.
  - installer-user-edit.test.ts:464 is a forged record with other bytes.
  - Plan 34-14 rule (d) forbids a numeric literal second argument, so it will flag :79 and installer-user-edit.test.ts:464. Both are outside this plan's W-list.
- `toBe(0o…)` and `file mode is 0` / `mode=0…` text: only installer-marker-retention.test.ts:350 and :354 remain. They are row-315 cases and belong to plan 34-14.
- Installer sources: `modeText` is defined in user-file.ts:437 and nowhere else. `modeOctal` has no hits. The only `toString(8)` in install/*.ts outside tests is `modeText`.

## Mutation proofs (each restored; `git diff` clean afterwards)

| # | Mutation | Result |
|---|----------|--------|
| m1 | `modeMatches` returns `true` | 32 of the 34 L1 chmod rows fail ("was removed after a mode change"). The direct comparison case fails with `expected true to be false` |
| m2 | tree record file line drops `modeText(r.mode)` | ledger "treeRecord walks with lstat … any change moves the record" (W6) and prune "a recorded backup with a chmod since …" (W3) fail |
| m3 | `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT="POSIX permission bits beyond read-only"` | both IN-03 cases print `SKIPPED shape="POSIX permission bits beyond read-only" position="install/installer-prune.test.ts: IN-03 0600" platform=darwin: this platform keeps only the read-only attribute …` and return |

Without the seam, both IN-03 cases **ran** on this host (macOS): `IN-03 … 0600 … 133ms` and `IN-03 … 0664 … 129ms`, with no skip line printed.

## Regression gate (final tree, HEAD 5a11fc9f)

- `npm run build`: exit 0. `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: **102 files passed, 7414 tests passed, 2 skipped** (972 s).
- `npm run check:build-parity`: ALL CHECKS PASSED.
- `npm run freshness`: exit 0, 73 committed .js match a rebuild.
- `node scripts/check-platform-shapes.js`: exit 0, HOST CAPABILITIES (4) all present.
- `gsd-tools windows status`: total_count 318, open_count 243.

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- `recordedModeOf` fails closed on a malformed suffix.
- A direct comparison case was added (it closes the coverage gap described under Deviations).
- The IN-03 line is tagged `posix-bits`, and plan 34-14 needs to know about it.
- The skip line names the route that still covers the claim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing coverage] Direct case for the comparison on the stored change**
- **Found during:** Task 1, mutation m1.
- **Issue:** With the read-only edit, the CLAUDE.md and .github/copilot-instructions.md L1 rows stay green even when `modeMatches` is mutated. uninstall cannot write the read-only pointer file, so the block removal fails and the file is kept before `recordMatches` is ever asked. Those two rows still pass, but they no longer test the comparison. Brief §2.2 requires that "the comparison is tested on that change".
- **Fix:** one case in record-truth.test.ts covering `fileRecord`, `recordedModeOf`, `modeMatches` and `recordMatches` before and after `userModeEdit`, plus the no-mode and malformed-suffix arms. m1 turns it red.
- **Files modified:** install/record-truth.test.ts
- **Committed in:** b5af3a02

**2. [Rule 1 - Fail-closed] recordedModeOf does not use a regex capture**
- **Found during:** Task 1.
- **Issue:** The plan's wording ("the four digits after `;mode=`, or undefined") read as the Gemini site's regex. Inside `recordMatches`, that regex would treat a malformed mode suffix as "no mode", where the old code had reported a mode change.
- **Fix:** return the text after `;mode=`. A record validated by `isFileRecord` gives exactly the four digits, so no well-formed input changes behaviour.
- **Committed in:** b5af3a02

**3. [Rule 2] The IN-03 chmod line carries a `mode-census: posix-bits` tag**
- The plan tags only the W10 lines. The gated IN-03 chmod is not a W10 line, and none of 34-14's three kinds describes it. Recorded here as a handoff to plan 34-14.

**Total deviations:** 3 (1 coverage, 1 fail-closed correction, 1 tag handoff). **Impact:** no scope creep. No `process.platform` branch was added, and install/install.ts is not edited.

## Issues Encountered

- `npm run check:build-parity` fails on an uncommitted tree by design: it compares against the committed .js. It was run after each commit and passed both times.
- The capability name is 38 characters, longer than the 36-character pad in check-platform-shapes' HOST CAPABILITIES block, so that line has a single space before `present`. This is cosmetic and was left alone.

## Known Stubs

None.

## Threat Flags

None. No new surface. T-34-39 is mitigated on this host: the L1 rows use a stored change and the product compares stored modes through `modeMatches`. Windows still has to be measured in 34-18. T-34-41 is mitigated by the capability probe, `skipLine`, and row 318.

## User Setup Required

None.

## Next Phase Readiness

- Plan 34-14 (WIN-2 census) can now be built on `userModeEdit`, `storedMode`, `modeText` and `modeMatches`.
- Its rule (a) closed set needs `posix-bits`, or another disposition, for installer-prune.test.ts:218.
- Its rule (d) will flag ledger.test.ts:79 `FILE_REC` and installer-user-edit.test.ts:464.
- Windows status: `UNKNOWN - verify`, to be measured on windows-latest in plan 34-18 (WIN-3).

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*

## Self-Check: PASSED

- FOUND: b5af3a02, 5a11fc9f (ancestors of HEAD)
- FOUND: install/installer-paths.test-support.ts (`export function userModeEdit`), install/install-marker.ts (`export function modeMatches`), scripts/check-platform-shapes.ts (`reasonWhenAbsent` of the new capability)
