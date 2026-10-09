---
phase: 34-model-effort-dial-pi-support
plan: 23
subsystem: testing
tags: [windows, win-1, win-2, symlink, census, typescript-ast, prediction, d-21, host-02]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-18 measured run 37733716975 and WINDOWS.md row 319; 34-19..34-22 round-2 tests; 34-12 test-side census (t1)-(t5)"
provides:
  - "install/ledger.test.ts link fixtures with host-built absolute targets under the scratch directory (row 319 fixtures, no platform branch)"
  - "install/path-spelling-census.test.ts rule (t6): no installer test links to a rooted, drive-less literal target; link makers and local wrappers derived; classified sites must skip win32 first"
  - "34-VALIDATION.md 'Gap round 2 (D-21): prediction for the deferred run': masked-assertion audit of the 139 earlier WIN-1/WIN-2 reds and a prediction for every round-2 test"
  - "WINDOWS.md row 319 annotated (stays open); HOST-02 Manual-Only cell names D-21"
affects: [34-24, HOST-02, WINDOWS.md row 319, the human's deferred windows-latest run]

actuals:
  tokens: 13160
  tasks: 2
  commits: 2
plan_head_before: bf1553f46a8e9dc3b7ae688faf65ee8e8ec9bbcf
plan_head_after: ab1df659984e8c061f2cba75e7a252ecd0d264f4

tech-stack:
  added: []
  patterns:
    - "A link fixture's target is an absolute path built with join under the test's scratch directory, and the expected record is built from that same value"
    - "Census link makers are derived to a fixed point (a local function that hands its first parameter to a link maker is one); a classified exemption must be backed by a structural check (process.platform === \"win32\" tested before the link)"
    - "Masked-assertion audit: red names from the job log, located with the TypeScript parser, diff hunks intersected with each test's syntax-tree range plus one level of same-file helpers"

key-files:
  created: []
  modified:
    - install/ledger.test.ts
    - install/path-spelling-census.test.ts
    - .planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Rule (t6) derives its link makers (symlinkSync, symlink, stageSymlinkOrSkip and their local wrappers to a fixed point) and follows a target through a local variable, so a rooted literal handed to a wrapper is seen; the plan's text search missed two such sites"
  - "The three /dev/zero link sites are classified (map size 3), and each must test process.platform === \"win32\" before it links; a classification without that skip is an offender"
  - "A rooted literal is one beginning with / or \\, including a template whose literal head does"
  - "The audit treats a test as changed by round 2 when a 9de784e8..HEAD hunk falls in its it( range or in a module- or describe-level declaration it names; two name-collision hits (canonical-path (11) and the printed-rel rows) were read and left out"
  - "Predicted Windows totals: Test Files 3 failed | 100 passed (103); Tests 5 failed | 7505 passed | 28 skipped (7538)"

patterns-established:
  - "Write the prediction for a deferred CI run before the run, per test, with the reason and the evidence it rests on"

requirements-completed: []

coverage:
  - id: D1
    description: "The row 319 link fixtures read back their own host-built targets, and census rule (t6) refuses a rooted, drive-less literal link target in any installer test"
    requirement: "HOST-02"
    verification:
      - kind: unit
        ref: "install/ledger.test.ts#treeRecord gives a file its file record, a link its link record, and null for a FIFO, nothing, or a walk past TREE_MAX_ENTRIES"
        status: pass
      - kind: unit
        ref: "install/ledger.test.ts#backupContentRecord: a file's bytes and mode, a tree, a link; null for a hard link, a FIFO, nothing, or a link on the way"
        status: pass
      - kind: unit
        ref: "install/path-spelling-census.test.ts#(t6) no test links to a rooted, drive-less literal target: every link target is built by the host (or classified with its reason)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A written prediction for the human's deferred windows-latest run: every earlier WIN-1/WIN-2 red classified and every masked assertion predicted, every round-2 test predicted"
    requirement: "HOST-02"
    verification:
      - kind: other
        ref: "grep -n \"Gap round 2 (D-21): prediction for the deferred run\" .planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md"
        status: pass
    human_judgment: true
    rationale: "A prediction is read against the human's later windows-latest run (D-21); no macOS run can confirm a Windows result (WIN-3)"
  - id: D3
    description: "WINDOWS.md row 319 carries the gap round 2 sentence in table and JSON and stays open"
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 23: Row 319 link fixtures, census rule (t6) and the prediction for the deferred Windows run Summary

**The two ledger.test.ts tests that were red on windows-latest (WINDOWS.md row 319), and the treeRecord walk fixture, now link to absolute targets built with `join` under the test's scratch directory. The expected record is built from the same value, with no platform branch. A new census rule (t6) derives every link-making call and its local wrappers from the syntax tree and refuses a rooted, drive-less literal target. 34-VALIDATION.md now holds a written prediction for the human's deferred run. It covers each of the 139 earlier WIN-1/WIN-2 reds, every assertion that has never run on windows-latest, and all 51 round-2 test calls (132 instances). Nothing here is a Windows result, and HOST-02 stays unchecked (D-21).**

## Performance

- **Duration:** 39 min
- **Started:** 2026-10-09T11:09:18Z
- **Completed:** 2026-10-09T11:48:36Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 4

## Accomplishments

- **Fixtures (F1 to F3).**
  - ledger.test.ts :465/:466 and :650/:651 now use `const linkTo = join(root, "some", "where")`, then `symlinkSync(linkTo, …)`, and expect `linkRecord(linkTo)`.
  - The `tree` walk fixture's two targets are `join(root, "nowhere", "target")` and `join(t.root, "nowhere", "else")`.
  - One comment at the first fixture gives the row 319 cause, the expected byte-identical readback (read from Node v24 internals, a prediction for the deferred run), and why the canonical spelling is not used.
- **Rule (t6)** in path-spelling-census.test.ts, scanning the 28 installer test and test-support files:
  - The link makers are `symlinkSync`, `symlink` and `stageSymlinkOrSkip`, plus every local function that hands its own first parameter to a link maker. These wrappers are derived to a fixed point.
  - A target is rooted and drive-less when it is a string literal, or a template whose literal head, beginning with `/` or `\`. It counts directly, or through a local variable that the checker resolves.
  - Vacuity floors: at least one link-making call is seen, and the derivation must find the `link` wrapper in installer-write-set.test.ts.
  - `CLASSIFIED_ROOTED_LINKS` holds 3 `/dev/zero` sites, and its size and the use of each key are asserted. Each classified site must test `process.platform === "win32"` before it links.
- **34-VALIDATION.md**, section "Gap round 2 (D-21): prediction for the deferred run":
  - the row 319 cause and fix;
  - the audit by class (counts below);
  - table (b), with every assertion after the old red line;
  - the (c) re-prediction;
  - the five carried other-family reds, still masked and not predicted;
  - the 51-row round-2 table, with reason keys P1 to P7;
  - the predicted printed totals;
  - the `UNKNOWN - verify` list.
- **HOST-02 Manual-Only result cell:** one sentence added, "**Gap round 2 (34-23): no run.**", deferred by the human (D-21).
- **WINDOWS.md row 319:** one sentence appended through `parseLedger` / `renderLedger`. `git diff` shows exactly 2 changed lines, the table cell and the JSON description. The status stays `open`, and `windows status` exits 0.

## Task Commits

1. **Task 1 (tracer): host-built link targets and census rule (t6)** - `cbe97597` (test). Tracer gate: the run is interactive, `end-of-phase`, and the verify step is automated only. The verify (`npm run build && npx vitest run … install/ledger.test.ts install/path-spelling-census.test.ts`, 2 files, 58 tests passed) was re-run green, so expansion went ahead.
2. **Task 2: masked-assertion audit, prediction, row 319, HOST-02 cell, regression gate** - `ab1df659` (docs)

## Fixture search (brief §2.4), re-run as written in the plan

`git grep -n -E 'symlinkSync\(\s*"' -- 'install/*.test.ts' 'install/*.test-support.ts' 'scripts/*.test.ts' 'scripts/**/*.test.ts'` (before Task 1):

| # | Site (line at search time) | Shape | Verdict |
|---|---|---|---|
| F1 | ledger.test.ts:453 (readback compared at :454) | rooted drive-less literal | changed (Task 1): host-built target, expect `linkRecord(linkTo)` |
| F2 | ledger.test.ts:637 (:638) | rooted drive-less literal | changed (Task 1), as F1 |
| F3 | ledger.test.ts:422, :442 | rooted drive-less literals, inequality only | changed (Task 1): two host-built targets that differ by name |
| F4 | record-truth.test.ts:194, 202, 211, 228, 240, 241, 249, 257, 265, 279, 292, 300 (the plan's 192..298) | relative targets | unchanged. No readback is compared; Windows turns `/` into `\` in a relative target, and no assertion reads it |
| F5 | install.test.ts:5249, :5441 (the plan's :4853/:5045); scripts/kit-model.test.ts:619 | `..` | unchanged (no separator) |
| F6 | scripts/runnable-ref/host-protection.test.ts:2703 `/dev/zero` | POSIX device | unchanged. It lies outside the (t6) scan set (scripts/) and skips on win32 |
| F7 | host-built absolute targets read back (installer-write-set :212-257, installer-kit-home :248, install.test.ts readlink cases, installer-paths.test-support :710, installer-user-edit :514/:526) | `join`-built | unchanged |

`git grep -n -E 'readlinkSync|linkRecord\(' -- 'install/*.test.ts' 'install/*.test-support.ts'`: ledger.test.ts:160 `linkRecord("/x")` is a grammar fixture. No link is made for it and nothing is read back, so it is unchanged. The other hits are host-built readbacks (F7) or the census's own `PATH_PRODUCERS` set.

**Found by (t6)'s derivation and missed by the text search** (the target goes through `stageSymlinkOrSkip`, not a `symlinkSync("` spelling):
- install.test.ts:7760, the readUserFile character-device case (`/dev/zero`). It prints `SKIPPED readUserFile character-device case` and returns on win32 before linking.
- installer-write-set.test.ts:480, `installedWithVersion` (`/dev/zero`). It returns `SKIPPED /dev/zero VERSION case on win32` before linking.

Both are classified, together with the plan's F6 site installer-write-set.test.ts `plantAt` (through the local `link` wrapper). After Task 1 the search finds 0 rooted literal targets in ledger.test.ts.

## (t6) mutation proofs (each restored byte for byte from a scratch copy, checked with `cmp`)

| # | Mutation | First red line |
|---|---|---|
| m1 | `/some/where` put back in the F1 fixture (`symlinkSync("/some/where", join(root, "l"))`) | `× (t6) no test links to a rooted, drive-less literal target …` / `+   "ledger.test.ts:465 (in <top-level>) links to \"/some/where\""` |
| m2 | the same literal through a variable (`const linkTo = "/some/where"`) | `+   "ledger.test.ts:465 (in <top-level>) links to \"/some/where\""` |
| m3 | the `process.platform === "win32"` return removed from installer-write-set.test.ts `installedWithVersion` | `+   "installer-write-set.test.ts:479 (in installedWithVersion) links to \"/dev/zero\" and is classified, but its function does not test process.platform === \"win32\" before the link"` |

## Masked-assertion audit (method and sources)

- **Source:** `gh` was available and authenticated, so the logs were read with `gh run view --job 112468804112 --log` and `gh run view --job 113168427323 --log`, read-only. 34-VALIDATION.md's tables were not needed as a fallback. These logs carry the colour codes as literal `^[[…m` text, not ESC bytes, so both forms were stripped.
- **Family rule reproduced:** run 37521787426 gave 144 blocks: 91 WIN-1 recorded, 5 WIN-1 printed, 43 WIN-2, 5 other. Run 37733716975 gave 7 blocks: 5 other and 2 unmatched.
- **Location:** each name was located with the TypeScript parser, by describe chain and title, with template titles read as patterns. 138 of the 139 names match exactly one `it(`. The marker-binding B2 remedy name matches none; plan 34-12 split it into two successors.
- **Classes:**
  - (a) green and unchanged: 135 (90 / 5 / 40).
  - (a) renamed: 1.
  - (b) red on run 37733716975: 2.
  - (c) changed by round 2: 1.
  - Total 139 = 91 / 5 / 43.
- **Unrun by design in (a):** the readKitHomeRecord FIFO tail (2 assertions) and IN-03 0600/0664 (6 assertions each). Their skip lines were printed in run 37733716975.
- **Round-2 enumeration:** `git diff -U0 030af957 HEAD`; no test file changed between 9de784e8 and 030af957. It found 53 calls; 2 were name-collision hits, read and left out. That leaves 51 calls and 132 instances, counted with `npx vitest list --json`, which collects and runs nothing.

## Regression gate

- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED) and `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'` with `TMPDIR=<scratch>` (to keep clear of the stray `$TMPDIR/package.json`) printed `Test Files 2 failed | 101 passed (103)` and `Tests 3 failed | 7533 passed | 2 skipped (7538)`, in 1463.7 s. The 3 failures:
  - `install/installer-fs-census.test.ts` "UNCLASSIFIED node:fs export openAsBlobSync": known and pre-existing (Node v26.11.0), already in deferred-items.md.
  - `scripts/context-io.test.ts`, 2 deep-fixture cases: `PREMISE: the deep fixture's composed path is 281 characters, over the 240-character ceiling …`. The scratch TMPDIR path is long, so this comes from that path, not from this plan. The file was rerun with the default TMPDIR: **687 passed**.
- So the tree has no failure caused by this plan; the only red is the known openAsBlobSync row. scripts/check-foundation-guards.test.ts and scripts/generate-catalog.test.ts were green in this run, under the scratch TMPDIR.
- Plan acceptance:
  - `git diff --name-only bf1553f4..HEAD -- install/` lists only install/ledger.test.ts and install/path-spelling-census.test.ts.
  - The WINDOWS.md diff is the row 319 description only (table and JSON).
  - HOST-02 is not ticked anywhere.

## Decisions Made

See key-decisions in the frontmatter. In short:
- (t6) asks at every link-making call, including wrappers and one-step variables, not only at a `symlinkSync("` spelling.
- A classified exemption must show its win32 skip in the syntax tree.
- The audit's "changed" includes one level of same-file helpers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing coverage of the class] (t6) widened beyond a direct literal argument of `symlinkSync`**
- **Found during:** Task 1
- **Issue:** The plan's rule as written (a `symlinkSync` call with a literal first argument) would miss a rooted literal handed to `stageSymlinkOrSkip`, to a local wrapper, or through a variable. Brief §2.2 asks tests to cover the whole class.
- **Fix:**
  - The link makers and their wrappers are derived to a fixed point, and variables are resolved with the checker.
  - `\`-rooted literals and template heads count too.
  - The derivation found two pre-existing `/dev/zero` sites that the plan's text search missed. They are classified with the plan's F6 site (map size 3), and each classification is checked for a `process.platform === "win32"` test before the link.
  - m2 and m3 prove the variable path and the skip check.
- **Files modified:** install/path-spelling-census.test.ts
- **Committed in:** cbe97597

**2. [Rule 3 - Blocking, environment] The full suite under a scratch TMPDIR reddened two context-io deep-fixture premises**
- **Found during:** Task 2 regression gate
- **Issue:** The scratch TMPDIR, used to avoid the stray `$TMPDIR/package.json`, is a long path. The context-io deep fixture asserts its composed path stays under 240 characters.
- **Fix:** context-io.test.ts was rerun with the default TMPDIR: 687 passed. No file was changed.
- **Committed in:** n/a

**3. [Method] Two round-2 name-lookup hits left out after reading**
- **Found during:** Task 2
- **Issue:** The one-level helper lookup matched `scratch` and `rel` declared in a different describe of canonical-path.test.ts.
- **Fix:** They are recorded as left out, with the reason, in the VALIDATION section and here. The count is 51, not 53.

**4. [Prohibition] `requirements.mark-complete` is not run for HOST-02**
- The plan lists `requirements: [HOST-02]`, but its prohibitions forbid ticking HOST-02 (D-21, WIN-3). The state step that ticks requirements is skipped. The REQUIREMENTS.md HOST-02 traceability cell (D-21 reason) belongs to plan 34-24 (its must-have).

**Total deviations:** 4 (1 coverage widening, 1 environment rerun, 1 method note, 1 prohibition honoured). **Impact:** there was no product code change and no Windows claim. The class rule is stronger than written.

## Issues Encountered

- `gh run view --log` output carries the colour codes as literal `^[[…m` text, so a strip of ESC bytes alone finds 0 blocks. Both forms were stripped.

## Known Stubs

None.

## User Setup Required

None. The windows-latest measurement is the human's, at a later date (D-21).

## Next Phase Readiness

- Ready for 34-24, which ticks the seven SATISFIED requirements and writes the HOST-02 D-21 reason in REQUIREMENTS.md.
- The human's later push can be read against "Gap round 2 (D-21): prediction for the deferred run". WINDOWS.md rows 319, 320 and 321 stay open until then.

*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*

## Self-Check: PASSED

- Commits cbe97597 and ab1df659 are ancestors of HEAD.
- install/ledger.test.ts, install/path-spelling-census.test.ts, 34-VALIDATION.md and .planning/WINDOWS.md exist and carry the changes described above.
