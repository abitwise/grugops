---
phase: 34-model-effort-dial-pi-support
plan: 11
subsystem: installer
tags: [win-1, windows, path-spelling, install-marker, kit-home, typescript-ast-census, gap-closure]

requires:
  - phase: 33.1-phase-33-leftovers-guard-bypasses-first
    provides: install marker bound to realTargetPath, kit-home record, readForWrite, the installer fs census pattern
provides:
  - canonicalPathSpelling(p, flavor), the one spelling of every recorded path (install/user-file.ts)
  - sameRecordedPath(recorded, here, flavor), the one recorded-path comparison
  - absoluteSpelling(p, cwd, flavor), the doctor's kit-root spelling
  - markerBinding and readKitHomeRecord decided by sameRecordedPath
  - rebindMarker writes the product's realTargetPath spelling
  - install/canonical-path.test.ts (pure win32/posix cases)
  - install/path-spelling-census.test.ts (product describe; plan 34-12 adds the test-side half)
affects: [34-12, 34-18, HOST-02, WINDOWS.md rows 316/317]

actuals:
  tokens: 17600
  tasks: 3
  commits: 3
plan_head_before: a507208c1b2dedac097e4a92b218b97818a36ab6
plan_head_after: 3d1c41bca5f5b9d419d1ee466491d0227203e4fb

tech-stack:
  added: []
  patterns:
    - "Path flavor injected as a parameter (path.win32 / path.posix); branch only on flavor.sep, never on process.platform"
    - "Write side and compare side both pass a recorded path through one function"
    - "AST census with a derived scanned set (size asserted) and per-rule mutation proofs"

key-files:
  created:
    - install/canonical-path.test.ts
    - install/path-spelling-census.test.ts
  modified:
    - install/user-file.ts
    - install/user-file.js
    - install/install-marker.ts
    - install/install-marker.js
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/installer-paths.test-support.ts
    - install/install.test.ts

key-decisions:
  - "canonicalPathSpelling folds separators first, then reads the long-form prefix (//?/UNC/ to //, //?/X: to X:), then upper-cases a leading drive letter; posix flavor is the identity"
  - "Census rule (f) pins the one pre-existing process.platform read (user-file.ts PATH_MAX_BYTES, plan 33.1-31, a path-length limit) instead of requiring zero, and forbids any platform read inside the five spelling functions"

patterns-established:
  - "One spelling authority per rule: canonicalPathSpelling owns recorded-path spelling; no installer module declares a second fold"

requirements-completed: []

coverage:
  - id: D1
    description: "canonicalPathSpelling / sameRecordedPath: the exact job 112468804112 pair compares equal under win32; posix keeps a backslash as a byte; different directories never compare equal"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/canonical-path.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "markerBinding and readKitHomeRecord decide by sameRecordedPath; rebindMarker writes realTargetPath; installer-user-edit Pi row passes on this host"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/installer-user-edit.test.ts#pi/prompts/grugops.md .edited in the default install"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' install/ (25 files, 1612 passed, 1 skipped)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every installer spelling site (P7-P10) routed through the one function; AST census rules (a)-(f) hold it, each mutation-proven"
    verification:
      - kind: unit
        ref: "install/path-spelling-census.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The windows-latest effect of this plan (the 91 recorded-path reds of run 37521787426)"
    verification: []
    human_judgment: true
    rationale: "WIN-3: Windows behaviour is measured only by a human-pushed windows-latest run (plan 34-18). This macOS run proves the spelling rule with win32 inputs, not a green Windows leg."

duration: 45min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 11: One canonical spelling for recorded installer paths (WIN-1) Summary

**`canonicalPathSpelling` in install/user-file.ts now spells every path the installer records (marker `target`, kit-home `grugopsHome`, marker `grugopsHome`/`kitRoot`, ledger-relative paths) and `sameRecordedPath` compares through it on both sides, so a marker target in `C:\Users\...` binds the directory whose real path is `C:/Users/...`, while on POSIX a backslash stays a filename byte. An AST census with six rules holds this, and each rule has a mutation proof.**

## Performance

- **Duration:** about 45 min (two full-suite runs of about 17 min each)
- **Started:** 2026-10-07T18:28:50Z
- **Completed:** 2026-10-07T19:13:51Z
- **Tasks:** 3 of 3
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments

- Root cause confirmed from the printed log before any edit. `gh run view --job 112468804112 --log` (read-only) prints `written for another directory (C:\Users\runneradmin\AppData\Local\Temp\grugops-useredit-tesGCj\edit-default-1), not this one (C:/Users/runneradmin/AppData/Local/Temp/grugops-useredit-tesGCj/edit-default-1)` 4 times. The same shape appears for `grugops-dry-d8UUXm\copy`. Both precondition sites were present: rebindMarker assigned `realpathSync.native(t)`, and markerBinding compared `boundTo !== here`.
- Write side and compare side now go through one function. `realTargetPath` and `realPathThroughExisting` return `canonicalPathSpelling(...)`. `markerBinding` uses `!sameRecordedPath(boundTo, here)` and `readKitHomeRecord` uses `here === null || !sameRecordedPath(parsed.grugopsHome, here)`. Message strings are unchanged.
- `rebindMarker` writes `realTargetPath(t)` and throws an error naming `t` when that returns null.
- Sibling sites P7-P10 are routed through the function. The two local `toPosix` arrows are deleted. `docAbspath` now uses `absoluteSpelling(p, process.cwd())`, so a Windows `C:/...` kitRoot counts as absolute. The eight `split(sep).join("/")` ledger-relative spellings use `canonicalPathSpelling(rel)`.
- The rules are proven on this macOS host with `path.win32` and `path.posix` inputs (canonical-path.test.ts, 36 tests). The census adds 7 tests.

## Task Commits

1. **Task 1 (tracer): one canonical spelling, written, compared and re-bound.** `69c262be` (fix). The tracer gate (end-of-phase mode, automated-only verify) re-ran the verify. It passed, so expansion continued.
2. **Task 2: route every other installer spelling site through the one function (P7-P10).** `97cd1619` (fix)
3. **Task 3: product half of the WIN-1 census, mutation-proven.** `3d1c41bc` (test)

## Files Created/Modified

- `install/user-file.ts` / `.js`: adds `PathFlavor`, `canonicalPathSpelling`, `sameRecordedPath` and `absoluteSpelling`. realTargetPath and realPathThroughExisting now spell through `canonicalPathSpelling`. The clear-voice header explains why the function exists, why the recorded side goes through it, why posix is the identity, and why it lives in install/.
- `install/install-marker.ts` / `.js`: both bindings are decided by `sameRecordedPath`. The installMarkerProblems comment now names `canonicalPathSpelling` instead of `toPosix`.
- `install/install.ts` / `.js`: `toPosix` is removed. GRUGOPS_HOME, KIT_ROOT, TARGET, the prompt defaults and the self-checkout compare (P7, P9) go through `canonicalPathSpelling`. `docAbspath` goes through `absoluteSpelling` (P8). targetRel, CREATED_DIRS, the kit-home backup `made.path` and the kit-plan `relOf` (P10) go through `canonicalPathSpelling`.
- `install/uninstall.ts` / `.js`: the local `toPosix` in the self-checkout guard (P9) is removed. The four ledger-relative spellings (P10) go through `canonicalPathSpelling`. The now-unused `sep` import is dropped.
- `install/installer-paths.test-support.ts`: `rebindMarker` uses `realTargetPath`. The unused `realpathSync` import is dropped.
- `install/install.test.ts`: comment only. A stale reference to install.ts `toPosix` now names `canonicalPathSpelling`.
- `install/canonical-path.test.ts` (new): a spelling table (15 rows), a comparison table (8 rows, each checked in both argument orders), an absolute-spelling table (8 rows), an idempotence case and the real-directory case (11). Each table's size is asserted.
- `install/path-spelling-census.test.ts` (new): the product `describe` with the scanned-set size (8) and rules (a)-(f).

## Sibling searches (re-run on the final tree; tracked `install/*.ts` minus `*.test.ts` and `*.test-support.ts`)

1. **`git grep -n realpathSync`**
   - install.ts: :74 (import), :858 and :878 (R1: adapter containment, JS `realpathSync`, left unchanged).
   - kit-source.ts: :86 (import), :377 (R3: cycle set).
   - user-file.ts: :76 (import), :359 `canonicalPathSpelling(realpathSync.native(target))`, :393 `canonicalPathSpelling(join(realpathSync.native(cur), ...rest))`, plus comment lines :350, :353, :370.
2. **`git grep -n -e realTargetPath -e realPathThroughExisting`**
   - install-marker.ts: :157 (import), :302 `here = realTargetPath(target)`, :1100 `here = realTargetPath(home)`, :1047 (comment).
   - install.ts: :184-185 (import), :1621-1623 root-overlap compare through realPathThroughExisting (via P2), :2842 kit-home record write (P4), :4203 marker target write (P3), :1607 and :4173 (comments).
   - user-file.ts: the definitions at :357 and :377, plus comments.
3. **`git grep -n toPosix`**: one hit, the comment in user-file.ts:293 that explains the removed helper. No code.
4. **`git grep -n "split(sep)"`**: install.ts:721, user-file.ts:246 and :594. All three iterate over path components and none joins with `/`, so none is a spelling.
5. **`git grep -n -e boundTo -e grugopsHome -e kitRoot`**: 41 lines (install-marker.ts 23, install.ts 15, uninstall.ts 1, user-file.ts 2).
   - Compare sites: install-marker.ts markerBinding and readKitHomeRecord (now `sameRecordedPath`), and the install.ts doctor cross-check :1137-1144 (through `docAbspath`, so `absoluteSpelling`).
   - Write sites: install.ts :2857 kit-home record, and :4288-4289 marker `grugopsHome`/`kitRoot` through `kept(...)` from the now-canonical GRUGOPS_HOME and KIT_ROOT.
   - Everything else is a type field, a message that quotes a value (install.ts:4211-4212, uninstall.ts:2041), or a comment.
6. **`git grep -n -e 'startsWith("/")' -e isAbsolute`**
   - install-marker.ts:354 `isLedgerPath` and :1131-1144 `isAbsoluteMarkerPath` (R4: shape validation, no compare).
   - install.ts:596 and :709, user-file.ts:242: containment tests that stay on the host spelling on purpose.
   - uninstall.ts:208 `abspath` (R2).
   - user-file.ts:310-344: the new `PathFlavor` and `absoluteSpelling`.
   - The leading-`/` test in `docAbspath` is gone.

**R1-R4 were read and left unchanged:**
- **R1 (install.ts:853-890, adapter containment):** both operands come from one JS `realpathSync` call on one input, and the containment test reasons about the host spelling on purpose.
- **R2 (uninstall.ts:208 `abspath`/TARGET and the `${TARGET}/...` compositions, `isProtected`, install.ts `isPruneProtected`):** these build paths and do not compare a recorded path. Both operands come from the same template. Changing uninstall's TARGET spelling would move every printed uninstall path on Windows before any run could measure it. Plan 34-12 owns printed paths.
- **R3 (kit-source.ts:377):** the cycle set compares within one walk.
- **R4 (install-marker.ts `isAbsoluteMarkerPath`, `isLedgerPath`):** shape validation only. `isAbsoluteMarkerPath` already accepts `/...`, `//srv/...` and `X:/` / `X:\`.

## Mutation proofs (Task 3; each one applied, watched red, restored with `git checkout -- <file>`, then rebuilt; build parity reports ALL CHECKS PASSED afterwards)

| # | Mutation | First failing line |
|---|----------|--------------------|
| m1 | markerBinding back to `if (boundTo !== here)` | `FAIL install/path-spelling-census.test.ts > ... > (e) install-marker.ts decides both bindings by sameRecordedPath, and never compares 'here' raw` / `AssertionError: sameRecordedPath must decide markerBinding and readKitHomeRecord, once each: expected [ Array(1) ] to deeply equal [ …(2) ]` |
| m1b (extra) | readKitHomeRecord keeps sameRecordedPath and adds `\|\| parsed.grugopsHome !== here` | rule (e): `AssertionError: a raw comparison of a recorded path against 'here': decide it with sameRecordedPath: expected [ Array(1) ] to deeply equal []` |
| m2 | canonicalPathSpelling without the separator fold (`let s = p;`) | `FAIL install/canonical-path.test.ts > ... > (1) the log's recorded spelling ...` / `AssertionError: expected 'C:\Users\runneradmin\AppData\Local\Te…' to be 'C:/Users/runneradmin/AppData/Local/Te…'` (cases 2, 3 and 4 also red) |
| m3 | posix flavor folds backslashes | `FAIL install/canonical-path.test.ts > ... > (7) posix backslash is a filename byte ...` / `AssertionError: expected '/tmp/a/b' to be '/tmp/a\b'` (3 failed, 33 passed) |
| m4 | `const toPosix = (p) => p.replace(/\\/g, "/")` declared in uninstall.ts | rule (b) `expected [ 'uninstall.ts:1983 (in toPosix)' ] to deeply equal []`, and rule (d) `AssertionError: a second fold helper: ...` (2 failed) |
| m5 | a third `realpathSync.native` call in install.ts | rule (a) `AssertionError: a real-path call outside the two spelling functions: ... expected [ 'install.ts:1022 (in m5Probe)' ] to deeply equal []` |

After restoring: census plus canonical-path report 2 files and 43 tests passed.

## Regression gate (final tree)

- `npx vitest run --exclude '**/scripts/e2e/**'`: **Test Files 102 passed (102); Tests 7378 passed, 2 skipped (7380)**, 1001 s. This ran on the Task 2 and Task 3 content while it was staged. That content is byte-identical to commits 97cd1619 and 3d1c41bc: only the census file was un-staged and re-staged, and mutation files were restored with git checkout and rebuilt, with parity clean.
- `npx vitest run --exclude '**/scripts/e2e/**' install/` (Task 2 verify): **Test Files 25 passed (25); Tests 1612 passed, 1 skipped (1613)**.
- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED), `npm run typecheck` (exit 0).
- Task 1 targeted verify: 4 files and 114 tests passed. The installer-user-edit Pi row reports 1 passed and 98 skipped (the filter matched exactly the one row).
- **Windows: not measured here (WIN-3).** The effect on windows-latest is `UNKNOWN - verify` until the human-pushed run in plan 34-18.

## Decisions Made

- **Order inside canonicalPathSpelling.** It folds separators first, then reads the long-form prefix (`//?/UNC/` becomes `//`, and `//?/` before `X:` is dropped), then upper-cases the drive letter. Folding first handles mixed-separator long forms and keeps the function idempotent (case 10).
- **The flavor parameter** is a structural `PathFlavor { sep, isAbsolute }`, which `path.win32` and `path.posix` satisfy. The default is built from the host's own `sep`/`isAbsolute` imports, so no new import form was added to user-file.ts.
- **Census rule (c)** also catches a `.split(<backslash pattern>).join("/")` chain, not only `split(sep)`. **Rule (d)** also catches parameters, import specifiers and binding elements named `toPosix`. These are wider than the plan wording, so a renamed door is still caught.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan premise] Census rule (f): user-file.ts already read process.platform**
- **Found during:** Task 3
- **Issue:** The plan asked for "install/user-file.ts reads process.platform zero times". user-file.ts:578 `PATH_MAX_BYTES = process.platform === "linux" ? 4096 : 1024` predates this plan (plan 33.1-31). It is a path-length limit, not a spelling. Removing it is out of scope, and the plan's own prohibition is about *adding* a branch.
- **Fix:** Rule (f) now asserts that no `process.platform` read sits inside the five spelling functions. It pins the full set of platform reads across all eight scanned modules to exactly that one classified site, matched by its line content, so any second read anywhere turns the census red. That is stricter on every module except the one pre-existing line.
- **Files modified:** install/path-spelling-census.test.ts
- **Committed in:** 3d1c41bc

**2. [Rule 1 - Stale references] Comments naming the deleted toPosix**
- **Found during:** Task 2
- **Issue:** The install-marker.ts installMarkerProblems comment (`toPosix(resolve(...))`) and the install.test.ts header comment (install.ts `toPosix`) named a helper this plan deletes (class DOC-1).
- **Fix:** Both comments now name `canonicalPathSpelling`. install.test.ts is outside files_modified, but the change is comment-only.
- **Committed in:** 97cd1619

**3. [Rule 3 - Blocking] Unused imports after the reroute**
- `realpathSync` in installer-paths.test-support.ts and `sep` in uninstall.ts became unused, which `noUnusedLocals` rejects. Both were removed (69c262be, 97cd1619).

---

**Total deviations:** 3 auto-fixed (1 plan premise, 1 stale doc reference, 1 blocking).
**Impact on plan:** No scope creep. The rule (f) adjustment keeps the plan's intent (no platform branch in the spelling) and pins the pre-existing read.

## Issues Encountered

- The first full-suite run (started after the Task 1 changes were staged) failed 10 tests in 3 files: `nonblocking-reader-parity` listed the untracked `install/path-spelling-census.test.ts`, and other tests saw unbuilt Task 2 `.ts` edits. Cause: I edited Task 2 and 3 files in the working tree while that run was in progress. That run is discarded as contaminated. After the edits were built and staged, the full suite was re-run: 102 files and 7378 tests passed.
- Out of scope, for plan 34-12 (the test-side half): `install/install.test.ts` `canonicalPath()` spells test-side paths with scripts' `toPosix(realpathSync.native(p))`, a second spelling on the test side. It does not upper-case a drive letter. This is not changed here. It is the test-side census rule 34-12 adds.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 34-12 can add the test-side half of the census to `install/path-spelling-census.test.ts` in its own `describe`, and can compare printed paths through one helper.
- HOST-02 and PI-03 are not marked complete. Both are declared by later plans (`requirements.ready-ids`: 0/2 ready), and per D-19, HOST-02 closes only on the measured windows-latest run (34-18).

## Self-Check: PASSED

- FOUND: install/user-file.ts, install/install-marker.ts, install/installer-paths.test-support.ts, install/canonical-path.test.ts, install/path-spelling-census.test.ts, install/install.ts, install/uninstall.ts
- FOUND: 69c262be, 97cd1619, 3d1c41bc (ancestors of HEAD)

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*
