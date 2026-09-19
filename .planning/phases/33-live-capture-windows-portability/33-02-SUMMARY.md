---
phase: 33-live-capture-windows-portability
plan: 02
subsystem: testing
tags: [vitest, testTimeout, hookTimeout, slowTestThreshold, cap-02, windows, ci, uat-spec-integrity]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-01's deferred-items ledger (the DASH-04 wall-clock flake this plan's bounds were to measure) and the wave-1 census re-pins the full lane now runs against
  - phase: 31-uat-spec-integrity
    provides: the iterative `deriveSpecPaths` walk (D-21) and the classified `SKIPPED_DIRECTORIES` / `could-hide-evidence` boundary this plan tolerates absence at
provides:
  - "`vitest.config.ts` `testTimeout: 180_000`, `hookTimeout: 120_000`, `slowTestThreshold: 5_000`, each with its measured justification and no host-OS predicate (D-14)"
  - "the ENOENT-tolerant `.temp` residue premise in `uat-spec-integrity.test.ts` POINT 7 — absent and empty are one fact (D-13)"
  - "GREEN 4 rewritten: depth derived from two run-time measurements, printed, level-by-level teardown; the literal 4096 and the direction-pinned residual assertion are gone"
  - "`compilerRefusalCodes` / `compilerDeclaredCode` helpers: diagnostics filtered by SourceFile identity, expected code derived from the compiler's own table by message name"
  - "the origin of the windows RangeError, established and reproduced offline: the fixture teardown under node 22's JS-recursive rimraf, not the walk"
affects: [33-06 freshness clone, 33-09 pushed CI run, 33-04, 33-05, 33-03]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 4526
  tasks: 3
  commits: 3
plan_head_before: a3139d224e00460708d67895d1cc12ccada794aa

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A bound is a choice above a measured floor, cited by run id, never an arithmetic derivation from a cut test's elapsed time"
    - "Tolerate absence at the boundary that already classifies the path; re-throw every other error; keep the planted-entry red"
    - "A depth is derived from whichever of two measured limits the host reaches first, and both numbers plus the bound that answered are printed"
    - "A test that builds a pathological tree tears it down itself, iteratively, before any runtime's recursive remover can see it"
    - "Compare a file across the compiler boundary by SourceFile identity through the Program, never by string against a host-spelled path"

key-files:
  created: []
  modified:
    - vitest.config.ts
    - scripts/runnable-ref/uat-spec-integrity.test.ts

key-decisions:
  - "testTimeout 180000 ms is a choice above the 85568 ms measured floor (windows leg, run 35394268365), not a derivation: the failing set's true durations are unmeasured because vitest reports elapsed time on a cut test"
  - "hookTimeout 120000 ms lands beside testTimeout because the check-foundation-guards.test.ts:3574 red is a beforeAll dying at the inherited 10000 ms hook bound, which testTimeout does not govern — the gap RESEARCH found in D-14"
  - "The .temp premise tolerates ENOENT only, at the premise (the boundary that already classifies .temp as could-hide-evidence); no mkdir step in CI, no created directory on a fresh clone"
  - "The windows RangeError origin is the FIXTURE TEARDOWN — node 22.23.2's rmSync is lib/internal/fs/rimraf.js, three JS frames per directory level — so the fix is a level-by-level rmdir inside the case; the module walk (iterative since D-21) is untouched and its .js twin unchanged"
  - "GREEN 4's depth is bounded by whichever measured limit the host reaches first: the platform's create refusal or one level past the like-for-like recursion overflow; the literal 4096 is deleted and the residual (was the old walk reachable to exhaustion) becomes a printed measurement instead of a direction-pinned assertion that only held on hosts whose path limit refuses first"
  - "The diagnostic-code cases keep asserting the compiler's OWN code for the construct (derived by message name from ts.Diagnostics), not 'every seen code belongs to a declared set': the compiler reports incidental codes (7031, 2550, 2454, 2339, 18046) beside the refusal on this host, so that containment is not a fact anywhere; the windows [] was the host-separator filter, not a different code"

patterns-established:
  - "Where does the stack exhaustion originate: ask the teardown, not only the construction and the walk — a RangeError with no project frames is a runtime-internal recursion"
  - "Reproduce a platform-only failure by its MECHANISM on the host you have: a like-for-like of the runtime's recursive shape plus --stack-size standing in for the deeper tree"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Three bounds in the root vitest config with measured justifications and no host-OS predicate; the previously hook-bounded file runs clean"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts (300 passed, 0 'Hook timed out' lines, exit 0)"
        status: pass
      - kind: other
        ref: "grep -c 'testTimeout\\|hookTimeout\\|slowTestThreshold' vitest.config.ts = 5; grep -c 'process\\.platform' vitest.config.ts = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "An absent .temp and an empty .temp are the same fact for the residue premise; a planted stray entry still reds it; ci.yml untouched"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "rm -rf .temp && npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts (385 passed, 0 ENOENT lines, exit 0)"
        status: pass
      - kind: unit
        ref: "mkdir -p .temp && npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts (385 passed, exit 0)"
        status: pass
      - kind: unit
        ref: "planted .temp/stray-33-02.txt then -t 'POINT 7': 1 failed, `expected 1 to be +0`"
        status: pass
    human_judgment: false
  - id: D3
    description: "GREEN 4 derives its depth from the host, prints it, tears the tree down without recursion, and exits without a RangeError; the two diagnostic-code cases compare in the compiler's representation and name the codes seen"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts -t 'as deep as this platform permits' (1 passed; prints `GREEN 4 derived depth: 466 directory levels built, bounded by the platform's create refusal (ENAMETOOLONG); ... overflows at 7608`)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts (385 passed, 0 RangeError, exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The windows leg's RangeError and the two `expected [] to include` reds are closed on windows-latest itself"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Not measurable on this host: node 24 implements rmSync in C++ and this platform refuses at 477 levels, so the exact windows failure cannot reproduce here. The mechanism was reproduced like-for-like (below); the windows outcome is read from the pushed CI run plan 33-09 makes."

# Metrics
duration: 30min
completed: 2026-09-19
status: complete
---

# Phase 33 Plan 02: CI Bounds and the Absent Scratch Root Summary

**Three measured bounds in the root vitest config (test 180 s, hook 120 s, slow-warning 5 s, no host-OS branch), a `.temp` residue premise that treats absence and emptiness as one fact, and a deepest-directory probe whose depth is derived from two run-time measurements and torn down without recursion — with the windows stack exhaustion traced to node 22's JS-recursive `rmSync` in the fixture teardown, not the walk.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-19T21:42:29Z
- **Completed:** 2026-09-19T22:13:10Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- `vitest.config.ts` gains `testTimeout: 180_000`, `hookTimeout: 120_000`, `slowTestThreshold: 5_000`, each justified in the file's established style; `exclude` and `fileParallelism` are byte-identical (the diff is 28 insertions, 0 deletions). `check-foundation-guards.test.ts` — the file whose `beforeAll` died at `Hook timed out in 10000ms` — runs 300/300 with no hook-timeout line.
- `uat-spec-integrity.test.ts` POINT 7 lists `.temp` inside a `try`, treats ENOENT as a zero-length listing, re-throws every other error, and still reds on a planted entry. Both states green on the full file (385/385, absent and empty), planted state red (`expected 1 to be +0`). No CI step creates the directory: `git status --porcelain -- .github/workflows/ci.yml` is empty.
- GREEN 4's origin was established and reproduced offline (below). The case now measures the like-for-like recursion overflow first, builds the tree until the platform refuses OR one level past that overflow — whichever comes first — prints both numbers and the bound that answered, and unwinds the tree deepest-first with one `rmdirSync` per level before `afterEach` runs. On this host: `466 directory levels built, bounded by the platform's create refusal (ENAMETOOLONG); the spec was planted at level 457; a like-for-like recursive walk overflows at 7608`.
- The two curiosity cases (`declare const it` -> TS2440, `using` / `await using` -> TS2448) no longer filter diagnostics by `d.file?.fileName === specPath`; they look the spec up through the Program, filter by SourceFile identity, derive the expected code from the compiler's own diagnostics table by message name, and name every code seen in the failure message.
- Full regression lane on the final tree: 76 files, 5274 passed, 2 skipped, 0 failed, 475.68 s. Build parity, freshness (67/67), nul-bytes, platform shapes and all three typecheck targets green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Three bounds in the root vitest config** - `ea295150` (chore)
2. **Task 2: An absent scratch root and an empty one are the same fact** - `f11c6da7` (fix)
3. **Task 3: The deepest-directory probe derives its depth and cannot throw** - `97a59cc5` (fix)

**Plan metadata:** see the docs commit that carries this SUMMARY.

## Files Created/Modified

- `vitest.config.ts` - the three bounds and their justification; nothing else changed
- `scripts/runnable-ref/uat-spec-integrity.test.ts` - POINT 7 premise; GREEN 4 rewrite; `compilerRefusalCodes` / `compilerDeclaredCode` helpers; `rmdirSync` import

`scripts/runnable-ref/uat-spec-integrity.ts` and its `.js` twin are unchanged: the walk was not the origin (see below), so the module needed no depth bound.

## Task 1 — pre-task values, quoted

`exclude` before and after: `[...configDefaults.exclude, "**/scripts/runnable-ref/fixtures/**", "**/.temp/**"]`. `fileParallelism` before and after: `false`. `git diff` on the task commit reports 28 insertions and 0 deletions. `grep -c 'process\.platform' vitest.config.ts` = 0.

## Task 2 — RESEARCH Open Question 5, answered

**The eight `scripts/freshness.test.ts` windows failures are NOT downstream of the `.temp` absence.** The suite creates its own working directory unconditionally — `rmSync(CLONE_ROOT, { recursive: true, force: true }); mkdirSync(CLONE_ROOT, { recursive: true })` at `scripts/freshness.test.ts:264-265`, where `CLONE_ROOT = join(ROOT, ".temp", "freshness-clones")` — so `.temp/` is created whether or not it exists. Its failure is the `tsc`-in-the-clone exit 1 that RESEARCH assumption A4 names (`clone HEAD … exit 1` / `the rebuild did not compile cleanly`), a separate class owned by plan 33-06. Not touched here.

## Task 3 — where the stack exhaustion originates

**Origin: the fixture TEARDOWN, not the walk and not the construction.** Evidence:

- The windows log (run 35394268365, job 105759397857, node v22.23.2) reports GREEN 4 twice: `Test timed out in 5000ms` (elapsed 33354 ms), then `RangeError: Maximum call stack size exceeded` with **no frame in any project file** — vitest prints project frames when there are any, so every frame was in node internals.
- The module walk cannot recurse: `deriveSpecPaths` is driven by an explicit LIFO `pending` array (D-21, `uat-spec-integrity.ts` ~L2070). The construction is a flat `for` loop.
- `lib/fs.js` at tag `v22.23.2` (read from the tagged source): `rmSync` -> `rimrafSync` in `lib/internal/fs/rimraf.js`, whose `rimrafSync -> _rmdirSync -> ArrayPrototypeForEach(readdirSync(...), child => rimrafSync(child))` recurses three JS frames per directory level. This host's node v24.12.0 implements `rmSync` as `binding.rmSync` (C++), which is why the exact failure cannot reproduce here.
- On windows node honours long paths, so the create loop never refused before the literal cap: 4095 levels (the 33 s elapsed is consistent with thousands of NTFS mkdirs; a 260-char refusal at ~100 levels would have taken milliseconds). `afterEach` then handed a 4095-level tree to the recursive remover.

**Offline reproduction, both origins the plan named:**

| Probe | Result on this host (darwin/arm64, node 24.12.0) |
|---|---|
| Total path length approaching the host limit (the existing construction, uncapped) | refuses at **477** levels with `ENAMETOOLONG` at path length 1015; `deriveSpecPaths` derives the tree without a throw — this origin does **not** reproduce a RangeError here |
| Nesting depth approaching the recursion limit — a like-for-like of node 22's rimraf shape (`stat -> rmdir -> forEach -> recurse`) | overflows at **1940** levels on the default stack; the windows tree was 4095. With `--stack-size=120` standing in for the deeper tree, the like-for-like removal throws `RangeError` at level 209 over a real 468-level tree, while an iterative deepest-first `rmdirSync` unwind removes all 477 levels — **this origin reproduces** |
| The like-for-like recursive *walk* frame the case already carried | overflows at 7007-7608 on this host, above 477 — the old walk was not reachable on this platform; on windows (16 000+ permitted levels) it was |

**Why the fixture is bounded by two measurements rather than by the refusal alone.** On windows the platform permits roughly 16 000 one-character levels (32767-char limit), and one NTFS operation per level costs milliseconds in CI: a probe that runs to the refusal there would take minutes and prove nothing about the stack beyond what one level past the interpreter's recursion budget already proves. A tree deeper than that budget is exactly the tree the old recursive walk could not derive. So the depth is `min(platform refusal, like-for-like overflow + 1)`, both measured at run time, and the printed line names which bound answered. No depth literal remains in the case.

**The residual assertion changed direction into a measurement.** The old `expect(recursionDepth).toBeGreaterThan(fsDepth)` asserted "the old walk was NOT reachable to exhaustion on this platform" — true on hosts whose path limit refuses first (macOS, Linux), false on windows, and kept true there only by the `4096` literal. It is now printed as `The old recursive walk was REACHABLE / NOT reachable to exhaustion on this platform` with both numbers.

**Diagnostic-code cases.** Pre-task `grep -c 'process\.platform' scripts/runnable-ref/uat-spec-integrity.test.ts` = 0; post-task = 0. The windows `expected [] to include 2440` / `... 2448` was the filter, reproduced here: with a differently-spelled `specPath` the old `fileName === specPath` filter returns `[]` while the identity filter returns `[2440]`. On this host the compiler reports `[2440, 18046, 7031]` for the `declare` spelling and `[2448, 2454, 2339, 7031, 2550]` for both `using` spellings — the incidental codes are why the assertion is "non-empty and contains the compiler's own code for the construct", not "every code seen is in a declared set" (see Deviations).

## Decisions Made

See `key-decisions` in the frontmatter. One addition: the printed GREEN 4 measurement uses the file's existing `console.log` idiom (the 31-42 swallow-sites print); vitest's default reporter shows it in CI logs (the windows log carries the 31-42 print at line 1657) and under `--reporter=verbose` locally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The diagnostic-code assertion is "non-empty and contains the compiler's own code", not "every code seen belongs to the declared set"**
- **Found during:** Task 3 (measuring what the compiler reports before rewriting the assertion)
- **Issue:** the plan's wording asks that each reported code belong to the compiler's declared set for the construct. Measured on this host, the compiler reports incidental diagnostics beside the refusal (`7031` implicit-any on the fixture's `page`, `2550` on `Symbol.dispose` under the ES2022 lib, `2454`, `2339`, `18046`), so that containment fails on every host and would have shipped a red that no platform can turn green.
- **Fix:** the expected code is derived from the compiler's own `Diagnostics` table by message name (`Import_declaration_conflicts_with_local_declaration_of_0`, `Block_scoped_variable_0_used_before_its_declaration`) with a premise that the entry exists, the seen set is asserted non-empty, containment of the derived code is asserted, and every code seen is named in the failure message. The plan's principle — a different code for the same refusal is a measurement — holds: a host that reports differently shows what it reported.
- **Files modified:** scripts/runnable-ref/uat-spec-integrity.test.ts
- **Verification:** `-t "CURIOSITIES|ambient"` 5 passed; the old filter's `[]` reproduced against a differently-spelled path
- **Committed in:** 97a59cc5

**2. [Rule 1 - Bug] The depth bound is the smaller of two measurements, not the create refusal alone**
- **Found during:** Task 3 (estimating the windows cost of an uncapped refusal probe)
- **Issue:** the plan says "create progressively deeper directories until the create refuses, and take the refusal depth". On windows that is ~16 000 levels at milliseconds per NTFS operation — a multi-minute test on the leg CAP-02 exists to make green, against a 180 s bound, and levels beyond the interpreter's recursion budget prove nothing further about the walk's stack behaviour.
- **Fix:** the like-for-like overflow is measured first and the construction stops at whichever of {platform refusal, overflow + 1} the host reaches first; both are printed with the bound that answered. Neither is a literal.
- **Files modified:** scripts/runnable-ref/uat-spec-integrity.test.ts
- **Verification:** the case prints its derived numbers; full file 385/385
- **Committed in:** 97a59cc5

**3. [Rule 1 - Bug] The direction-pinned residual assertion became a printed measurement**
- **Found during:** Task 3
- **Issue:** `expect(recursionDepth).toBeGreaterThan(fsDepth)` was only ever true on hosts whose path limit refuses before the recursion budget; on windows it is false, and only the `4096` literal kept it green — a literal converting an unmeasured outcome into a green, the exact prohibition in this plan's frontmatter.
- **Fix:** printed as `REACHABLE` / `NOT reachable` with both numbers; the case asserts what the walk guarantees (derived without a throw, refusals empty, the one spec found, the tree fully torn down).
- **Files modified:** scripts/runnable-ref/uat-spec-integrity.test.ts
- **Verification:** the printed line on this host reads `NOT reachable ... (its path limit refuses first)`
- **Committed in:** 97a59cc5

---

**Total deviations:** 3 auto-fixed (3 bugs — each a plan-literal that measurement showed could not hold on some host), 0 blocking.
**Impact on plan:** every `<done>` criterion holds; the module and its `.js` twin are unchanged because the walk was not the origin. No scope was added.

## Verification (plan level)

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` (full lane, final tree) | 76 files, 5274 passed, 2 skipped, 0 failed, 475.68 s, exit 0 |
| `npm run build && npm run check:build-parity` | ALL CHECKS PASSED; working tree clean after build |
| `npm run typecheck` (shipped, tests, fixtures) | exit 0 |
| `npm run freshness` | 67 committed .js fresh |
| `npm run check:nul-bytes` | ALL CHECKS PASSED |
| `node scripts/check-platform-shapes.js` | ALL CHECKS PASSED |
| `rm -rf .temp && npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts` | 385 passed, 0 ENOENT lines, exit 0 |
| `grep -c 'process\.platform' vitest.config.ts` | 0 |
| `git status --porcelain -- .github/workflows/ci.yml` | empty |
| `npm test` | never run (prohibition honored) |

The `board-watch-live.test.ts` DASH-04 case from `deferred-items.md` was green on this run; the item stays open for the CI-leg measurement plan 33-09 makes.

## Issues Encountered

- vitest's default reporter does not surface `console.log` output of passing tests on this TTY; the printed GREEN 4 measurement was confirmed under `--reporter=verbose` and the same idiom's output is present in the CI logs. RESEARCH A7 (whether `slowTestThreshold` prints a distinct warning line rather than a duration highlight) stands as stated: the durations are printed per test in CI's non-TTY output, and the threshold governs the slow highlight; no separate WARNING line was observed.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-08/09/10 mitigations are in place as the plan's register states (derived depth bound with an iterative teardown; no host-OS conditional on any bound, `grep` count 0; ENOENT-only tolerance with every other error re-thrown and the planted-file red reproduced). T-33-12: no package installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-09's pushed CI run is the first measurement of these bounds on both legs; it reports the new slowest test (the `testTimeout` is a choice above the 85568 ms floor, falsifiable there) and answers coverage D4 (the windows GREEN 4 and diagnostic-code reds) — the assumption to watch is that the windows GREEN 4 build of ~7 600 levels (one past the recursion budget) completes within 180 s.
- Plan 33-06 can take the freshness clone class as a `tsc`-in-the-clone problem (A4) with the `.temp`-downstream hypothesis (Open Question 5) closed in the negative here.
- The untracked `.planning/milestone.lock` and `.planning/phases/34-*` present at dispatch were not touched.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-19*

## Self-Check: PASSED

- 2 modified files present on disk; 3 task commits present in history (ea295150, f11c6da7, 97a59cc5); commits measured from the plan ledger = 3; no control byte in this file.
