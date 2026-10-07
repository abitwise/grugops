---
phase: 34-model-effort-dial-pi-support
plan: 12
subsystem: testing
tags: [win-1, windows, path-spelling, test-helpers, typescript-ast-census, gap-closure]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-11: canonicalPathSpelling, sameRecordedPath, realTargetPath spelled canonically, product half of the census"
provides:
  - "pathText, lineNamesPath, printedRel, nativeRealPath (install/installer-paths.test-support.ts): one way for a test to compare a path the product PRINTED"
  - "Every expected RECORDED path in the installer tests taken from user-file.ts realTargetPath"
  - "install.test.ts canonicalPath delegates to realTargetPath (the second test-side spelling via scripts toPosix is gone)"
  - "marker-binding remedy case proven in two spellings (realTargetPath and the host-native spelling)"
  - "Test-side describe of install/path-spelling-census.test.ts: rules t1-t5 over 27 files, each mutation-proven"
  - "Masked-assertion audit of the WIN-1 reds of job 112468804112 (list below)"
affects: [34-18, HOST-02, PI-03, WINDOWS.md rows 316/317]

actuals:
  tokens: 11750
  tasks: 3
  commits: 3
plan_head_before: 0da52f24d6c6dbacb5fc3f3784ce6427d20e8974
plan_head_after: f4cb60bc0439932131803df32a29777da4999046

tech-stack:
  added: []
  patterns:
    - "A printed path is compared through lineNamesPath / pathText / printedRel, which apply the product's canonicalPathSpelling to both sides"
    - "A recorded path's expected value comes from realTargetPath, never from realpathSync.native or a SCRATCH string"
    - "AST census rule resolved through the type checker (noResolve, noLib) to follow a path built into a variable"

key-files:
  created: []
  modified:
    - install/installer-paths.test-support.ts
    - install/canonical-path.test.ts
    - install/path-spelling-census.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-dry-run.test.ts
    - install/marker-binding.test.ts
    - install/installer-kit-home.test.ts
    - install/ledger.test.ts
    - install/install.test.ts
    - install/ledger-provenance.test.ts
    - install/installer-user-edit.test.ts
    - install/installer-prune.test.ts
    - install/installer-write-set.test.ts
    - install/record-truth.test.ts

key-decisions:
  - "lineNamesPath treats a space, (, ) or : after the path as a delimiter, and also , ; . when whitespace or the end of the line follows, because the installer's prose ends clauses right after a path"
  - "Census t2 flags a replace or replaceAll only when the pattern consumes a backslash and the replacement is a separator (\"/\" or any sep). The plan's wider wording also flagged regex-escape helpers and anchored trims"
  - "Census t1 allows nativeRealPath in canonical-path.test.ts case (11) (2 uses) as well as in marker-binding.test.ts (1 use). That case proves realTargetPath is the canonical spelling of the native real path"
  - "Census t3 also follows + concatenation, parentheses, RegExp templates and variables resolved by the type checker; atRel joins the native builder set"

patterns-established:
  - "Test-side spelling authority: installer-paths.test-support.ts owns pathText/lineNamesPath/printedRel and calls the product's canonicalPathSpelling; no test folds a path by hand"

requirements-completed: []

coverage:
  - id: D1
    description: "pathText / lineNamesPath / printedRel proven under path.win32 and path.posix, including the exact uninstall line from job 112468804112 and delimiter negatives (agents-old, agents.md, a comma inside a name)"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/canonical-path.test.ts#pathText / lineNamesPath / printedRel"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three HOST-02 printed-path tests (uninstall-removal never-installed real and DRY_RUN, installer-dry-run flow-10 subset) compare through the helpers and pass on this host"
    requirement: HOST-02
    verification:
      - kind: integration
        ref: "npx vitest run install/uninstall-removal.test.ts install/installer-dry-run.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Recorded-path expectations come from realTargetPath; the remedy binds in both spellings (two iterations)"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/marker-binding.test.ts#B2: after the remedy"
        status: pass
    human_judgment: false
  - id: D4
    description: "Test-side census rules t1-t5 over 27 files, each mutation-proven (m1-m5)"
    verification:
      - kind: unit
        ref: "install/path-spelling-census.test.ts#WIN-1 path-spelling census — tests"
        status: pass
    human_judgment: false
  - id: D5
    description: "The windows-latest effect of this plan on the WIN-1 reds of run 37521787426"
    verification: []
    human_judgment: true
    rationale: "WIN-3: Windows behaviour is measured only by a human-pushed windows-latest run (plan 34-18). This macOS run proves the helpers with win32 inputs. It does not show a green Windows leg."

duration: 45min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 12: Test-side WIN-1, one spelling for every printed and recorded path in the installer tests Summary

**Installer tests now compare paths the product prints through `lineNamesPath` / `pathText` / `printedRel`. All three apply the product's `canonicalPathSpelling` to both sides. Expected recorded paths now come from `realTargetPath`. A test-side AST census with five rules, each mutation-proven, holds every installer test to this. As a result, the mixed line `C:\…\target/.claude/agents` that uninstall prints on Windows and `join(target, ".claude", "agents")` now compare as one path.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-10-07T19:17:03Z
- **Completed:** 2026-10-07T20:02:54Z
- **Tasks:** 3 of 3
- **Files modified:** 14 (no file created; 574 insertions, 97 deletions)

## Accomplishments

- **Helpers** (install/installer-paths.test-support.ts), each with a doc comment naming run 37521787426:
  - `pathText(s, flavor)` applies `canonicalPathSpelling`.
  - `lineNamesPath(line, absPath, flavor)` is true when the path in the line is followed by a delimiter.
  - `printedRel(root, printed, flavor)` returns a POSIX relative path, the canonicalized relative path, or `OUTSIDE:`. Absoluteness is decided by `flavor.isAbsolute`.
  - `nativeRealPath(p)` returns the host spelling of a real path.
- **The three HOST-02 printed-path tests** now compare through the helpers: uninstall-removal never-installed (real and DRY_RUN) and the installer-dry-run flow-10 subset. `linesFor` substitutes on `pathText` of the message and both roots. The leading-`/` test in installer-dry-run is gone.
- **Recorded paths (T3-T7):**
  - marker-binding takes expected targets from `realTargetPath`. The B2 moved cases read it before the rename.
  - The remedy case runs once per spelling: the remedy's own spelling and the host-native spelling.
  - kit-home `grugopsHome` and the ledger fixtures `grugopsHome`/`target` come from `realTargetPath`.
  - install.test.ts `canonicalPath` now returns `realTargetPath(p)` and throws when that is null. The `toPosix` import is dropped.
  - ledger-provenance compares the printed rmdir paths through `printedRel`.
- **Printed paths (T8-T13), plus siblings found by AST search:** all of these now go through the helpers:
  - every install.test.ts T11 site
  - installer-prune :358/:359/:366, plus the verify lines in the failed-rewrite case
  - installer-user-edit `linesNaming`, so a mixed print is matched instead of skipped
  - installer-write-set :605 and the `--check` sites at :559/:563
  - record-truth `namingLines` and the kit-files guard
  - the subjects in installer-dry-run flow 11
  - uninstall-removal's `--prune-old-kit` `bak` line
- **Census, test side:** `describe("WIN-1 path-spelling census — tests …")` with the scanned set derived by `readdirSync` and its size asserted at 27. The rules are:
  - (t1) `realpathSync.native` is called only inside `nativeRealPath`, and `nativeRealPath` uses are pinned per file.
  - (t2) no hand fold.
  - (t3) no natively built path matched against output. This covers direct calls, `+` concatenation, templates, `new RegExp` templates, and variables resolved through the type checker.
  - (t4) no `.startsWith("/")`.
  - (t5) no `toPosix` declaration, and the one `canonicalPath` delegates to `realTargetPath`.

## Task Commits

1. **Task 1 (tracer): helpers, pure cases, and the three HOST-02 printed-path tests.** `937c07a5` (test). Tracer gate: end-of-phase mode with an automated-only verify. The verify was re-run and passed, so expansion went ahead.
2. **Task 2: recorded-path expectations from realTargetPath (T3-T7).** `de7e07ec` (test)
3. **Task 3: remaining printed-path sites, test-side census, masked-assertion audit, regression gate.** `f4cb60bc` (test)

## Files Created/Modified

- `install/installer-paths.test-support.ts`: the four helpers and `PATH_END` / `PATH_END_PUNCTUATION`. Imports `canonicalPathSpelling` and `type PathFlavor`.
- `install/canonical-path.test.ts`:
  - NAMES table (16 rows) and REL table (9 rows), both sizes asserted.
  - Case (11) now calls `nativeRealPath` instead of `realpathSync.native`.
- `install/path-spelling-census.test.ts`: the test-side `describe` and its header paragraph.
- `install/uninstall-removal.test.ts`: `linesFor`, EMPTY_DIRS and the `--prune-old-kit` line.
- `install/installer-dry-run.test.ts`: `rel`/`fileRel` through `printedRel`. The `would` values are now relative without a leading `/`, and the flow-11 subjects also go through `printedRel`.
- `install/marker-binding.test.ts`: `recordedTarget` helper, the B2 cases, and the two-spelling remedy loop with its length asserted.
- `install/installer-kit-home.test.ts`, `install/ledger.test.ts`: expected values from `realTargetPath`.
- `install/install.test.ts`:
  - `canonicalPath` now delegates to `realTargetPath`.
  - New `namesPath` helper.
  - T11 sites and their siblings converted.
- `install/ledger-provenance.test.ts`, `install/installer-user-edit.test.ts`, `install/installer-prune.test.ts`, `install/installer-write-set.test.ts`, `install/record-truth.test.ts`: printed-path sites now go through the helpers.

## Sibling searches (re-run on the final tree over the 27 install/*.test.ts and *.test-support.ts files)

1. `git grep -n realpathSync.native`: one code hit, installer-paths.test-support.ts:266, inside `nativeRealPath`. Every other hit is a comment or a test-name string. Planning-time hits at marker-binding :73/:114/:139/:150, installer-kit-home :178/:318, ledger :500/:658, install.test.ts :181 and canonical-path :121/:122 are all gone.
2. `git grep -n -E "(includes|toContain|startsWith|endsWith)\((join|resolve|at|abs)\("`: no hits. At planning there were 11: install.test.ts ×6, installer-prune ×3, uninstall-removal ×1, plus the template at :5983.
3. `git grep -n 'startsWith("/")'`: no hits.
4. `git grep -n -e "split(sep)" -e 'split("\\\\")'`: no code hit. Only census rule names match. The ledger-provenance :91 hand fold is gone.
5. `git grep -n -e "function canonicalPath" -e toPosix`: install.test.ts:191 `canonicalPath`, which delegates to `realTargetPath`. Otherwise only comments and the census rule text.
6. Helpers that match stdout lines against a built path: `linesFor` (uninstall-removal), `rel`/`fileRel` (installer-dry-run), `linesNaming` (installer-user-edit) and `namingLines` (record-truth) all go through the helpers. A checker-resolved AST search for comparison calls whose argument is a variable built by join/at/atRel found 13 more sites. All 13 are converted, and census t3 now holds them:
   - install.test.ts: `plantedAbs` ×4, `leafAbs`, `expectedSuffix`, `dest`, `foreign`, `ro`, `at` ×2, `staged`
   - installer-write-set: `at` ×2
   - uninstall-removal: `bak`
   - Also converted: install.test.ts `new RegExp(... join(target, leg.rel) ...)` and the `${atRel(...)}${BACKUP_MARK}` prefix.

## Masked-assertion audit (WIN-1 reds of job 112468804112)

**Method.** Each red's first error and location was taken from `gh run view --job 112468804112 --log`, read-only. The log lists 144 red tests. They are classified here by failure text only; the family rule belongs to plan 34-18 Task 1.

**Not WIN-1, so outside this audit:**
- the mode family: record-truth L1 ×36, installer-prune IN-03 ×2 and the chmod-backup case
- ledger.test :313/:343/:432/:445/:548/:621, where the record content or mode differs and no path appears in the message
- kit-plan-limits ×2
- the readUserFile ENOTDIR cases (install.test.ts, installer-write-set)
- install.test.ts W1 "incomplete copy cannot be removed"

**The WIN-1 test bodies and the assertions after each red:**

| Test (red at) | Assertion after the red that compares a path | Action |
|---|---|---|
| uninstall-removal never-installed, real and DRY_RUN (:577 EMPTY_DIRS) | `linesFor` labels for the three pointers; the EMPTY_DIRS `left` line | both go through `pathText` / `lineNamesPath` (Task 1); the final `not.toMatch` on labels compares no path |
| installer-dry-run flow 11 (:297, real status after `rebindMarker`) | :292/:293 would-edit/would-remove subjects vs `MARKER_REL`; :300 edited subjects | converted to `printedRel(target / copy, subject(m))`; :301/:302 are filesystem checks |
| installer-dry-run subset ×4 (inside `expectPreviewSubsetOfRealRun`, real status) | `rel`/`fileRel`; `would`/`done`/`files` membership; `would` contains `.claude`; `dirEntries.has(d)` | `printedRel` (Task 1); `would` is now relative POSIX, so `.claude` (not `/.claude`) and `dirEntries.has(d)` are confirmed |
| installer-kit-home first install (:178), bound-to-another (:318) | the failing assertion itself (recorded `grugopsHome`) | `realTargetPath` (Task 2); the later ledger/backup/readdir checks compare no spelling |
| installer-never-installed round trip (:181), FN real/DRY (:313), real round trip (:322) | :183 snapshot rows (test-built relative); :323/:324 relative `.grugops/install.json` | confirmed. The log shows the product prints that name with forward slashes. The `rebindMarker` callers (:178/:305/:320) are covered by 34-11 T1 |
| installer-prune after `--migrate` (:358) | :359, :366 `would-remove`/`removed` lines; :373 `target: ${e.path} (` | `lineNamesPath` for :359/:366; `pathText(l)` for :373; :378-:385 compare records and prose |
| installer-user-edit edit bodies (exit 3 in `expectMarkerAfterEdit`) and the `settings.json` row (`expectNoWholeFileRemoval`) | `linesNaming` (T10); `holdingKeys` vs the product ledger; stdout contains the relative `MARKER_REL` | `linesNaming` goes through `lineNamesPath` and `pathText`; the rest are confirmed (product-relative values). Exception 12/13 compare ask rules and ledger fields, not paths |
| installer-write-set `--migrate` directory (:605) | the failing assertion itself | `pathText(l).includes(".grugops/factory.config.json")`; the later status and FIFO checks compare no path |
| ledger-provenance copied tree (:378) | :381 `existsSync(abs(copy, rel))` over `REMOVED_DIRS` | `REMOVED_DIRS` is built through `printedRel` (Task 2); confirmed |
| ledger.test `readKitHomeRecord` (:502), six-record (:675), bound marker (:696) | only states after the red | the fixtures come from `realTargetPath` (Task 2) |
| marker-binding :73, B2/B3 copied, B2 real/DRY (:138), remedy (:153) | recorded targets, the verify line's two directories | `realTargetPath` / `recordedTarget`, plus the two-spelling remedy (Task 2); the relative regexes are confirmed |
| record-truth B1 ×6 (:155/:167) | `entry ${garbled}:` (an index, not a path) | confirmed |
| record-truth B2 guard CLAUDE.md (:226), kit files (:298) | the verify line names the file | :226 `"CLAUDE.md"` has no separator, so it is confirmed; :298 converted to `pathText(l)` |
| record-truth L1 REMOVABLE (:327) | `existsSync` only | confirmed |
| record-truth L3 with a marker (:441) | `expectHonestBackupLines` → `namingLines` | `namingLines` goes through `pathText`, and so does the l3-kitversion `tools/` filter |
| install.test.ts IN-04 directory at the marker (:7617) | the failing assertion itself (doctor regex) | matched against `pathText(r.stdout)`; `expectMarkerUntouched` is a filesystem check |

## Mutation proofs

Each mutation was applied, watched go red, and then the file was restored byte for byte from a scratch copy (checked with `cmp`). The Task 3 edits were not yet committed at that point, so `git checkout` would have discarded them.

| # | Mutation | First red line |
|---|----------|----------------|
| m1 | `rebindMarker` back to `realpathSync.native(t)` | `× (t1) realpathSync.native is called only inside nativeRealPath …` / `+   "installer-paths.test-support.ts:187 (in rebindMarker)"` |
| m2 | uninstall-removal back to `l.includes(join(target, ...d.split("/")) + " (")` | First attempt: **not red**. The rule saw a call or template, not `join(...) + " ("`. After widening `beginsWithNativePath` to `+` and parentheses: `× (t3) no test matches a natively built path against output …` / `+   "uninstall-removal.test.ts:581 (in <top-level>)"` |
| m3 | installer-dry-run `fileRel` with `s.startsWith("/") ? … : s` | `× (t4) no test decides absoluteness by a leading / …` / `+   "installer-dry-run.test.ts:371 (in fileRel)"` |
| m4 | `lineNamesPath` without its delimiter check (`if (end >= 0) return true;`) | `× (h2) the log line with agents-old in place of agents does not name .claude/agents (the delimiter decides): does not name` (5 failed: that row, the parent `.claude` row, posix agents-old, agents.md, the comma-inside-a-name row) |
| m5 (extra) | a hand fold `l.replace(/\\/g, "/")` added in install.test.ts | `× (t2) no test folds a path by hand …` / `+   "install.test.ts:6516 (in <top-level>)"` |

## Regression gate (final tree, content of f4cb60bc staged)

- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED), `npm run typecheck` (exit 0)
- `npx vitest run --exclude '**/scripts/e2e/**'`: **Test Files 102 passed (102); Tests 7413 passed, 2 skipped (7415)**, 978.86 s. No file was edited during the run. The `FAIL` text in the log is fixture output from passing tests.
- Task 1 verify: 3 files, 101 tests passed. Task 2 verify: 5 files, 562 passed and 1 skipped. Task 3 verify (plus install.test.ts, uninstall-removal, canonical-path): 8 files, 1108 passed and 1 skipped.
- Prohibitions:
  - `git diff 45766c2d -- install/kit-plan-limits.test.ts` is empty (0 lines).
  - The bodies of install.test.ts "readUserFile: an absent path is …" (753 bytes), install.test.ts "W1: when the incomplete copy cannot be removed either …" (1522 bytes) and installer-write-set.test.ts "readUserFile: a path under a regular file is …" (297 bytes) are byte-identical to plan base 0da52f24. This was checked by an AST extract plus `cmp`.
  - No `process.platform` line was added (0 in the diff).
  - No package was installed, nothing was pushed, and no scratch install ran.
- **Windows: not measured here (WIN-3).** The effect on windows-latest is `UNKNOWN - verify` until the human-pushed run in plan 34-18.

## Decisions Made

- **Delimiters in `lineNamesPath`.** The plan's set (end of line, space, `(`, `)`, `:`) made 3 install.test.ts cases fail on this host. The installer prints `…/agents, so the install set is unknown` and `….json; any path inside …`. A `,`, `;` or `.` therefore counts as a delimiter, but only when whitespace or the end of the line follows it. `agents.md` and `a,b` still do not name `agents` and `a`; pure rows (h5) prove it.
- **The `would` values are relative.** `printedRel` returns `.claude`, not `/.claude`, so the subset case asserts `would` contains `.claude`, and the `replace(/^\//, "")` strips are gone. The relation asserted is unchanged.
- **Census t2 scope.** A fold is a replace whose pattern consumes a backslash and whose replacement is `"/"` or a `sep`. Read literally, the plan's "a backslash pattern" also flagged the regex-escape idiom `s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`, slug replaces (`/\W+/g`) and anchored trims (`/^\s*…/`, which match the empty string). Any `.split` whose argument consumes a backslash is flagged, as is any `split(sep).join("/")` chain.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Census gap] m2 did not go red on the first try**
- **Found during:** Task 3 (mutation proofs)
- **Issue:** The original red site was `l.includes(join(...) + " (")`, a binary concatenation. Rule t3 only looked at a call or template as the first argument.
- **Fix:** `beginsWithNativePath` now follows `+` concatenation and parentheses. t3 also gained a `new RegExp` template arm and a variable arm resolved through the checker. `atRel` was added to the builder set.
- **Files modified:** install/path-spelling-census.test.ts
- **Committed in:** f4cb60bc

**2. [Rule 1 - Vacuous negative] the win32 `agents-old` row passed without the delimiter check**
- **Found during:** Task 3 (m4)
- **Issue:** "The log line does not name `.claude/agents-old`" was true because the path was absent from the line, not because of the delimiter.
- **Fix:** Added a win32 row where the line names `agents-old` and the path is `agents`. Under m4 it goes red.
- **Committed in:** f4cb60bc

**3. [Rule 3 - Blocking] the delimiter set was too narrow for the installer's prose**
- **Found during:** Task 3 (install.test.ts T11 conversion: 3 failed)
- **Fix:** Clause punctuation counts when whitespace or the end of the line follows (see Decisions). Pure rows (h5) were added.
- **Committed in:** f4cb60bc

**4. [Rule 2 - Class, not site] sibling sites beyond T1-T14 converted**
- **Found during:** Task 3 (checker-resolved AST search and the masked-assertion audit)
- **Issue:** Some sites compared a host-spelled path against output through a variable, a RegExp or a prefix template, and the plan table did not list them.
- **Fix:** All of them were converted (see Sibling searches item 6). The audit also converted record-truth (`namingLines`, :298, the l3-kitversion filter) and the installer-dry-run flow-11 subjects.
- **Files modified:** install/install.test.ts, install/installer-write-set.test.ts, install/uninstall-removal.test.ts, install/installer-prune.test.ts, install/record-truth.test.ts, install/installer-dry-run.test.ts
- **Committed in:** f4cb60bc

**5. [Rule 1 - Plan premise] census t1: `nativeRealPath` is used outside marker-binding.test.ts**
- **Found during:** Task 3
- **Issue:** canonical-path.test.ts case (11), from 34-11, proves `realTargetPath === canonicalPathSpelling(native real path)`, so it needs the native spelling. The plan's t1 forbids `realpathSync.native` outside the helper and allowed helper uses in marker-binding only.
- **Fix:** Case (11) calls `nativeRealPath`. t1 pins the uses per file: `{ canonical-path.test.ts: 2, marker-binding.test.ts: 1 }`. marker-binding passes the function as a value and calls it once per spelling.
- **Committed in:** 937c07a5 (case 11), f4cb60bc (rule)

**6. [Rule 1 - False positives] census t2 narrowed** (see Decisions). Committed in f4cb60bc.

---

**Total deviations:** 6 auto-fixed (3 Rule 1 census/test precision, 1 Rule 1 plan premise, 1 Rule 2 class coverage, 1 Rule 3 blocking).
**Impact on plan:** Every change is test-side. The product code and the committed `.js` are unchanged. The census is stricter than planned in t3 and narrower than planned in t2 only where a literal reading would flag non-folds.

## Issues Encountered

- `gh run view --job 112468804112 --log` uses literal `^[[…m` text for its colour codes, so they were stripped with a node script before parsing (read-only, scratch only).
- `realTargetPath`/`canonicalPathSpelling` are the identity spelling on macOS. So on this host the helpers' win32 behaviour is proven only by the pure `path.win32` rows, not by the integration tests.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 34-13..34-17 can rely on the test-side helpers. A new installer test that compares a path is held to them by the census.
- HOST-02 and PI-03 are not marked complete: `requirements.ready-ids` reports 0/2 ready, and per D-19 HOST-02 closes only on the measured windows-latest run in 34-18.

## Self-Check: PASSED

- FOUND: install/installer-paths.test-support.ts (exports `lineNamesPath`), install/path-spelling-census.test.ts (contains `lineNamesPath`), install/uninstall-removal.test.ts (contains `lineNamesPath(`), install/canonical-path.test.ts
- FOUND: 937c07a5, de7e07ec, f4cb60bc (ancestors of HEAD); `git rev-list --count 0da52f24..HEAD` = 3

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*
