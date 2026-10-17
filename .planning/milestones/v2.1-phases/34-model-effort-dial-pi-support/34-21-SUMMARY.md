---
phase: 34-model-effort-dial-pi-support
plan: 21
subsystem: installer
tags: [installer, win-1, canonical-path, census, isOwnLink, marker, d-23, wr-09, doc-1]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "canonicalPathSpelling / sameRecordedPath / absoluteSpelling and the WIN-1 census (34-11, 34-12); install.ts as left by 34-20"
provides:
  - "user-file.ts isRecordedAbsolute(p, flavor): the one absoluteness rule for a recorded path (the flavor's own isAbsolute)"
  - "installMarkerProblems(marker, flavor?) asks it for grugopsHome, kitRoot and target; the hand-written leading-/ or drive-letter predicate is deleted"
  - "isOwnLink(dest, src, flavor) compares readlink with src through sameRecordedPath"
  - "census rules (e) and (f) derive their sites from the syntax tree, with counts, classified maps and stale-key checks"
affects: [install/install-marker.ts installMarkerProblems, install/user-file.ts isOwnLink, install/path-spelling-census.test.ts]

actuals:
  tokens: 14400
  tasks: 2
  commits: 2
plan_head_before: 8ec04dd5304626b27ed9bc2b8f46686d8ffacc9c
plan_head_after: 6d8cdaead072440c5747123798d745950cc5bb43

tech-stack:
  added: []
  patterns:
    - "A census derives its sites by operand shape (recorded-path names, path producers, the spelling's own call), then holds each to an owner function, an all-operands-spelled rule, or a classified key with a reason; count, map size and stale keys asserted"
    - "Host link cases staged through stageSymlinkOrSkip, with a printed SKIPPED line naming the pure table that still pins the rule"

key-files:
  created: []
  modified:
    - install/user-file.ts
    - install/user-file.js
    - install/install-marker.ts
    - install/install-marker.js
    - install/install.ts
    - install/install.js
    - install/canonical-path.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "Census rule (e) counts canonicalPathSpelling's own call as a path operand, so a comparison spelled on both sides (uninstall.ts:1985, P6) is derived and passes by the all-spelled rule instead of being invisible"
  - "Two comparison sites the plan's sibling table did not list were derived: p === TARGET in install.ts isPruneProtected and uninstall.ts isProtected (protected-path denylists). Classified with their reason, not changed"
  - "isOwnLink keeps the plan's exact predicate (lstat link plus sameRecordedPath); no extra absoluteness requirement was added, because every caller's src is absolute (resolve / join of GRUGOPS_SRC, or a linkRecord of one)"

patterns-established:
  - "Rule (e)/(f) shape: derive, own-or-spell-or-classify, assert counts and stale keys"

requirements-completed: [HOST-02]

coverage:
  - id: D1
    description: "isRecordedAbsolute is the one absoluteness rule: 15-row table over win32 and posix (native UNC and long form absolute under win32; C:/x relative under posix), size asserted"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/canonical-path.test.ts#isRecordedAbsolute — the one absoluteness rule for a recorded path (plan 34-21, WR-09)"
        status: pass
    human_judgment: false
  - id: D2
    description: "installMarkerProblems judges marker paths by the one rule, per flavor: posix target C:/x refused; win32 native UNC target with C:/ home and kit root accepted; control and value checks kept"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/canonical-path.test.ts#installMarkerProblems — a marker path is absolute by the one rule, per flavor (plan 34-21, WR-09)"
        status: pass
    human_judgment: false
  - id: D3
    description: "isOwnLink compares through sameRecordedPath and still fails closed (other directory, relative target, regular file, absent path), on this host"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/canonical-path.test.ts#isOwnLink — a link's readback compared with the recorded source through the one spelling (plan 34-21)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Census rules (e) and (f) derive every comparison and absoluteness site with asserted counts; m1 to m4 recorded red"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/path-spelling-census.test.ts#(e) every derived comparison ... and (f) every derived absoluteness decision ..."
        status: pass
    human_judgment: false
  - id: D5
    description: "Windows behaviour of isOwnLink against a real windows-latest readlink"
    verification: []
    human_judgment: true
    rationale: "WIN-3: only a human-pushed windows-latest run can show it; D-21 defers that run this round. WINDOWS.md rows 319 and 320 stay open."

duration: 34min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 21: One absoluteness rule for recorded paths, isOwnLink through the one spelling, and a derived WIN-1 census

**`install/user-file.ts` now owns one absoluteness rule for recorded paths, `isRecordedAbsolute`. It is the path flavor's own `isAbsolute`. The install marker check asks it for `grugopsHome`, `kitRoot` and `target`, and the hand-written leading-`/`-or-drive-letter predicate in `install-marker.ts` is gone. `isOwnLink` now compares the link's readback with the recorded source through `sameRecordedPath`; under posix that is still byte equality. The WIN-1 census now finds its comparison and absoluteness sites by syntax tree, and asserts the counts (5 and 7), the classified maps (3 and 5) and that no classified key is stale.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-09T09:56:56Z
- **Completed:** 2026-10-09T10:30:39Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 8

## Accomplishments

- **One rule (P1, P2).** `isRecordedAbsolute(p, flavor = host)` sits beside `canonicalPathSpelling`. `absoluteSpelling` asks it. `installMarkerProblems(marker, flavor?)` still checks that each path is a string, trimmed and non-empty, then asks `isRecordedAbsolute`. Its problem sentences are unchanged.
  - A native UNC marker target (`\\srv\share\repo`) is now accepted under win32.
  - `C:/x` is now refused under posix.
- **isOwnLink (P3).** The predicate is now `lstat` says link AND `sameRecordedPath(readlinkSync(dest), src, flavor)`.
  - Under posix the spelling is the identity, so no POSIX behaviour changes.
  - The write side is unchanged: `linkRecord(src)` keeps the exact string handed to `symlinkSync`, and no ledger format changed.
  - Ownership still needs the install record (`checkRecord`'s `link:` arm, uninstall's recorded link), so DC-2 holds.
- **Tests in canonical-path.test.ts:**
  - an `isRecordedAbsolute` table, 15 rows, size asserted;
  - four marker cases per flavor;
  - five isOwnLink host cases, with links staged through `stageSymlinkOrSkip`.
  - The file header no longer says the file is pure apart from case (11).
- **Census rules (e) and (f), derived.** They are listed below with every site and its verdict. The rule (e) caller set of `sameRecordedPath` is pinned as `markerBinding`, `readKitHomeRecord`, `isOwnLink`. The header names `treeRecord`'s readbacks as not a comparison site (P11).
- **DOC-1.** The user-file.ts sentence "No other installer site may spell or compare a recorded path another way; install/path-spelling-census.test.ts holds that" is replaced by a block, "WHAT THE CENSUS HOLDS". The block names rules (a) to (d), the derived sites of (e) and (f), and the classified exemptions. The isOwnLink wording siblings were updated:
  - install-marker.ts: the content-record grammar (:364), :369, the header (:84) and owns' docstring (:930);
  - install.ts: :776 and the materialize comment (about :3640; the plan said :3525);
  - install.ts :1030 (docAbspath's absolute test).
  - install/README.md was read and not edited. Its "non-empty absolute paths" is still true.

## Task Commits

1. **Task 1 (tracer): one absoluteness rule and isOwnLink through the one spelling, with flavor tables** - `03428cc1` (feat).
   - Tracer gate: the run is interactive, `end-of-phase`, and the verify is automated only. The verify was re-run green after the commit (5 files, 190 tests), so expansion went ahead.
2. **Task 2: derived census rules (e) and (f), DOC-1 sentence, wording siblings** - `6d8cdaea` (test).

## WIN-1 sibling searches (re-run as written in the plan)

`git grep -n -e isAbsolute -e 'startsWith("/")' -e '\[A-Za-z\]:' -- 'install/*.ts' ':!install/*.test.ts' ':!install/*.test-support.ts'`

- **Before:** install-marker.ts :354, :1154-1155 (the hand-written predicate), :1162, :1167; install.ts :76 (import), :607, :720, :1030 (comment); uninstall.ts :101 (import), :210; user-file.ts :77 (import), :242, :310, :314, :321, :322, :338/:341 (comments), :344.
- **After, code lines only:**
  - install-marker.ts: :354, and :1168/:1172/:1177 (`isAbsolutePathValue`, which delegates to `isRecordedAbsolute`; the name only contains the search string);
  - install.ts: :607, :720;
  - uninstall.ts: :210;
  - user-file.ts: :242, :321 (interface), :325 (`HOST_FLAVOR`), :332, :333, :350 (`isRecordedAbsolute`'s body).

`git grep -n -e readlinkSync -e sameRecordedPath -e isOwnLink -e canonicalPathSpelling -- (same pathspec)`

- **Before:** 48 lines including imports.
- **After:** 45 code lines.
- **Changes:** user-file.ts isOwnLink now calls `sameRecordedPath`, and `absoluteSpelling` calls `isRecordedAbsolute`. Every other site is unchanged in kind.

### Rule (e): the derived comparison sites (5)

| Site | Code | Verdict |
|------|------|---------|
| user-file.ts:360 (sameRecordedPath) | `canonicalPathSpelling(recorded, flavor) === canonicalPathSpelling(here, flavor)` | inside a spelling function |
| uninstall.ts:1985 (top level) | `canonicalPathSpelling(resolve(TARGET)) === canonicalPathSpelling(GRUGOPS_SRC)` (P6) | every path operand spelled |
| install.ts:1605 (top level) | `TARGET === canonicalPathSpelling(GRUGOPS_SRC)` (P5) | classified: TARGET is canonical at its one assignment (resolveTarget returns canonicalPathSpelling on every arm) |
| install.ts:1980 (isPruneProtected) | `p === TARGET` | classified: protected-path denylist, a path this run composed from TARGET against TARGET; no recorded value or readback |
| uninstall.ts:334 (isProtected) | `p === TARGET` | classified: same reason |

The two protected-path rows were not in the plan's table. They were found by the derivation. Plus the `sameRecordedPath` callers: markerBinding (install-marker.ts:334), readKitHomeRecord (:1124) and isOwnLink (user-file.ts, P3, P4).

### Rule (f): the derived absoluteness sites (7)

| Site | Code | Verdict |
|------|------|---------|
| user-file.ts:333 (canonicalPathSpelling) | `/^[A-Za-z]:/` (P10) | owner |
| user-file.ts:350 (isRecordedAbsolute) | `flavor.isAbsolute(p)` (P2) | owner |
| install.ts:607 (targetRel) | `isAbsolute(rel)` (P7) | classified: containment test on a fresh `relative()` result |
| install.ts:720 (mkdirp) | `isAbsolute(rel)` (P7) | classified: same |
| user-file.ts:242 (wayTo) | `isAbsolute(rel)` (P7) | classified: same |
| uninstall.ts:210 (abspath) | `isAbsolute(p)` (P8) | classified: argv/env/cwd path the process opens on this host |
| install-marker.ts:354 (isLedgerPath) | `entry.startsWith("/")` (P9) | classified: the ledger entry's relative grammar |

The other `canonicalPathSpelling` pattern, `/^\/\/\?\/[A-Za-z]:/` (user-file.ts:332), does not match `C:/` or `C:\` from index 0. It is therefore not a drive-letter prefix site under the plan's definition. It lies inside the owner anyway. The docAbspath and process.platform assertions are kept unchanged, in their own `it`.

## Mutation proofs

Each mutation was applied to the `.ts`, built, watched red, then restored byte for byte and rebuilt. The sha256 over `install/*.ts` and `install/*.js` was the same before and after each one: `a7265ce6...`.

| ID | Mutation | Red | First red line |
|----|----------|-----|----------------|
| m1 | the old predicate back in `installMarkerProblems` (`v.startsWith("/") \|\| /^[A-Za-z]:[\\/]/.test(v)`; `flavor` and the import voided so the build compiles) | census (f); posix `C:/x` marker case; win32 UNC marker case | `AssertionError: expected [] to deeply equal [ 'target is not an absolute path' ]` (posix C:/x); census (f): `install-marker.ts:1168 (in isAbsolutePathValue) startsWith("/")` and `... drive-letter pattern` |
| m2 | isOwnLink back to `readlinkSync(dest) === src` (`flavor` voided) | census (e); the win32-normalized isOwnLink case | `AssertionError: expected false to be true` (win32 case); census (e): `sameRecordedPath must decide markerBinding, readKitHomeRecord and isOwnLink, once each`. The derivation also lists `user-file.ts:577 isOwnLink === :: readlinkSync(dest) === src` as an unspelled site |
| m3 | `if (boundTo === here) return null;` added to markerBinding | census (e) only | `a raw comparison of a recorded path: ... + "install-marker.ts:334 (in markerBinding) boundTo === here"` |
| m4 | absoluteSpelling calls `flavor.isAbsolute(p)` directly | census (f) only | `a second absoluteness rule: ask user-file.ts isRecordedAbsolute: ... + "user-file.ts:371 (in absoluteSpelling) isAbsolute"` |

## Regression gate

- `npx vitest run --exclude '**/scripts/e2e/**'` on the Task 2 tree (later committed byte-identical as 6d8cdaea):
  - Test Files: 1 failed, 102 passed (103).
  - Tests: 1 failed, 7531 passed, 2 skipped (7534).
  - Run time: 1428.7 s.
  - The one failure is the known pre-existing `install/installer-fs-census.test.ts` "UNCLASSIFIED node:fs export openAsBlobSync" under Node v26.11.0, already in deferred-items.md.
- Task 1 verify: 5 files, 190 tests passed. Task 2 targeted verify: 4 files, 140 passed, and 1 failed (the same openAsBlobSync row).
- Other checks:
  - `npm run build`: exit 0.
  - `npm run check:build-parity`: ALL CHECKS PASSED after each commit.
  - `npm run typecheck`: exit 0.
  - `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED.
- No Windows result is claimed (WIN-3). This host is macOS. The isOwnLink host cases did not skip here.

## Decisions Made

- **The spelling's own call is a path operand in rule (e).** So a comparison spelled on both sides is found and passes by the all-spelled rule, rather than being invisible to the census.
- **The two protected-path guards are classified, not changed.** They compare a path this run composed from `TARGET` with `TARGET` itself.
- **isOwnLink keeps the plan's exact predicate.** No extra absoluteness requirement was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 had to update census rule (e)'s caller list to keep its commit green**
- **Found during:** Task 1
- **Issue:** Once isOwnLink called `sameRecordedPath`, the old census rule (e) failed: its caller set listed two functions.
- **Fix:** Task 1 added `user-file.ts:isOwnLink` to that list. Task 2 then replaced rule (e) with the derived rule.
- **Files modified:** install/path-spelling-census.test.ts
- **Committed in:** 03428cc1

**2. [Scope] Two comparison sites outside the plan's table**
- **Found during:** Task 2
- **Issue:** The derivation found `p === TARGET` in install.ts isPruneProtected and uninstall.ts isProtected.
- **Fix:** Both are classified with their reason, and the count (5) includes them.
- **Not examined:** whether these denylists catch a path composed with a native backslash join on Windows. That question is `UNKNOWN - verify` and is recorded for human triage. It was not fixed in this round (brief §3).
- **Committed in:** 6d8cdaea

**3. [Mutation harness] m1 and m2 had to compile**
- **Issue:** The first m1/m2 runs failed `tsc` (`noUnusedLocals`/`noUnusedParameters`, `noEmitOnError`). The committed `.js` was therefore not rebuilt, and only the census (which reads `.ts`) went red.
- **Fix:** The mutations were re-run with the now-unused names voided. With that, the behavioural rows went red too, as recorded above.

**4. [Line drift] The plan's :3525 sibling is at about :3640**
- The materialize comment moved. It was updated at its current place.

---

**Total deviations:** 4 (1 blocking, 3 scope or harness notes). **Impact:** product behaviour is as planned.

## Issues Encountered

None beyond the pre-existing openAsBlobSync census row.

## Known Stubs

None.

## WINDOWS.md

- **Row 320 appended (skipped-test).** The isOwnLink host cases skip with a printed SKIPPED line where the host cannot make a link. The pure `sameRecordedPath` table still pins the rule. Whether they run on windows-latest is `UNKNOWN - verify`.
- **Row 319 stays open.** This plan makes the product's link comparison spelling-tolerant, but no windows-latest run measured it (D-21).

## User Setup Required

None.

## Next Phase Readiness

- WR-09 is closed: there is one absoluteness rule, isOwnLink compares through the one spelling, and the census rules are derived.
- Ready for 34-22.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*

## Self-Check: PASSED
