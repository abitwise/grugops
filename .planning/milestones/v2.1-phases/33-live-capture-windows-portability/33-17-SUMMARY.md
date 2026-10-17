---
phase: 33-live-capture-windows-portability
plan: 17
subsystem: testing
tags: [windows, ubuntu, uat-spec-integrity, parseFaults, faultKey, d-11, d-14, d-15, cap-02, stack-boundary, derived-depth, tdd, mutation-proof]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-02's test-internal compiler-representation precedent (`compilerRefusalCodes` compares by SourceFile identity); 33-04's `path.win32`-driven windows-spelling cases on darwin; 33-09's CI measurement (run 35499800942 § 2.4 rows W-30, W-31, U-1, U-2; § 2.5 (b)); `scripts/posix-path.ts` (`toPosixWith`) as the rule `faultKey` mirrors"
provides:
  - "`faultKey(path, separator = sep)` exported from `scripts/runnable-ref/uat-spec-integrity.ts`: THE ONE PLACE a parse-fault key is formed, applied at the compiler host's `parseFaults.set` and the checker's `parseFaults.get` — the fault recorded on win32 is the fault the checker prints (W-30; WINDOWS.md row 227's module defect)"
  - "POINT 2 compares the Program's `fileName`s and `join(root, rel)` through `faultKey` on BOTH sides, plus the same lookup under a `path.win32` spelling on this host (W-31)"
  - "`parseBoundaryFor(arrangement)` — the one bisection, per arrangement; `parseBoundary()` delegates to it; a measurement case prints both pairs"
  - "`mixedArrangementDepth(boundary) = 2 * boundary.overflow` — the derived doubled depth every mixed-arrangement site plants (GREEN 1b, ORDERING (b), PROBE 2 (b)); test AD pins the margin relation"
  - "The `Diagnosis — U-1 / U-2` section below: cause class SUITE, the § 2.4 evidence, this host's two measured boundary pairs, the parse-order observation, and the distinguishing observation for each neighbouring class"
affects: [33-20 pushed CI run (GREEN 1, POINT 2 expected green on windows; GREEN 1b, ORDERING expected green on ubuntu), 33-23 ledgers (WINDOWS.md rows 227 and 230; deferred-items.md two items), 33-CI-MEASUREMENT § 2.4 rows W-30/W-31/U-1/U-2]

# Actuals (#2632) — chars/4 over the realized diff (three files, ledger 85901388..HEAD), never a harness token count.
actuals:
  tokens: 7541
  tasks: 3
  commits: 5
plan_head_before: 859013886a18ab7c8eee375a1f60c6adb37b0507

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A map keyed at one site and looked up at another is keyed through ONE exported key-forming function at BOTH sites; the function takes the separator as a parameter so the win32 spelling is exercised — and mutation-proven — on darwin (D-15, the `scanKey` shape)"
    - "A kit-shipped runnable that cannot import the shared normalizer REIMPLEMENTS the rule, names the origin in its docblock, and the suite holds the two spellings equal over discriminating inputs (the `reportMeasured` precedent in the same module)"
    - "A depth measured by bisection in one arrangement is never planted bare in another: the mixed depth DERIVES from the measured boundary with a stated margin, and a test pins the relation so the margin cannot shrink without a red (D-14)"
    - "A CI red is diagnosed BEFORE it is fixed: cause class, the log's own assertion texts, a measurement on this host, and the observation that distinguishes each neighbouring class (D-11)"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts

key-decisions:
  - "`faultKey` is REIMPLEMENTED inline (three lines, the same rule as `toPosixWith`, same empty-separator refusal) rather than imported from `../posix-path.js` as the plan's action said: this runnable is materialized ALONE onto host repos (`install/install.ts` RUNNABLES → `tools/grugops/uat-spec-integrity.js`) with node: builtins only, so a relative import fails at load on every installed copy and reds the file's own `host-emulation` case. Test AA holds the inline rule equal to the shared normalizer over five discriminating spellings, so the two cannot drift silently (deviation, Rule 3)"
  - "`program.getSourceFile(join(repoRoot, rel))` is left as it is (the plan's instruction): the compiler canonicalises its own argument and the CI log shows that lookup succeeding on win32"
  - "ONE bisection: `parseBoundary()` is `parseBoundaryFor({})`, cached per arrangement — a second copy of the adjacency search would be the second authority the file's own comment warns against; the measurement case's equality assertion is therefore stated as a one-authority check, not a measurement"
  - "`mixedArrangementDepth` is typed on `{ overflow }` alone (a `{ safe, overflow }` pair satisfies it structurally) so PROBE 2 (b)'s in-process doubling-search number takes the same rule — its margin over the worker thread's true boundary is anywhere in [1, depth/2]"
  - "Task 3's RED is a characterization: `mixedArrangementDepth` was introduced as today's effective depth (the bare one-file overflow every mixed site planted) so test AD's margin assertion measured the current state (`expected 628 to be greater than or equal to 1256`); the behavioural half cannot be red on this host (shift 0) and is the pushed run's expected green"

patterns-established:
  - "RED evidence for vitest: run with `--reporter=tap-flat`, append `# tests/pass/fail` counted from the same output's non-SKIP lines, set `targetTest` to the full `file > describe > title` chain — `check tdd-red-evidence` then returns RED_EVIDENCE_OK"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "W-30 — the parse fault recorded by the compiler host is found by the checker on every host through one key (`faultKey` at set and get); the diagnostic `Maximum call stack size exceeded` is printed, never the fallback sentence"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#AA: faultKey spells a backslash path and its forward-slash twin identically under win32, and is toPosix on the host"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#AB: a Map keyed by faultKey(hostFileName) is found by faultKey(win32.join(root, rel)) — and NOT without the key"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#host-emulation: the materialized .js runs from a bare temp dir and still exits 1"
        status: pass
      - kind: other
        ref: "grep -a -c 'parseFaults.get(faultKey(' scripts/runnable-ref/uat-spec-integrity.ts → 2 (the site and its docblock); MUTANT-A (faultKey as identity) reds AA, AB, POINT 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "W-31 — POINT 2 compares the Program's included files and the derived spec set through `faultKey` on both sides, and the same lookup under a win32 spelling"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#POINT 2: the Program's included files are a SUPERSET of the derived spec set"
        status: pass
    human_judgment: false
  - id: D3
    description: "U-1 / U-2 diagnosis — cause class SUITE, evidence rows, both boundary pairs measured on this host, distinguishing observations; written before the fix"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#parseBoundaryFor: the one-file and the mixed-arrangement boundaries, measured on this host"
        status: pass
      - kind: other
        ref: "git show --stat 387fa0fd → only scripts/runnable-ref/uat-spec-integrity.test.ts (no fix in the diagnosis commit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "U-1 / U-2 fix — every mixed-arrangement site plants `mixedArrangementDepth(boundary)`; the one-file adjacency cases keep the exact boundary; test AD pins the 2x margin; whole file 389/389 green on this host"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#AD: the mixed arrangement is refused at mixedArrangementDepth(boundary), which is at least twice the one-file overflow"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#ORDERING: the per-file could-not-run reason precedes reportMeasured's output"
        status: pass
      - kind: other
        ref: "grep -a -c 'mixedArrangementDepth(' scripts/runnable-ref/uat-spec-integrity.test.ts → 6; grep -a -cE 'nestedSpec\\([0-9]+\\)' → 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The ubuntu mechanism itself (the direction and size of the arrangement shift on node 22 / x64) — CONSISTENT with this host, not confirmed by it"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "This host measured shift 0 (node 24, darwin/arm64) and carries no node 22 binary; the observation that settles the diagnosis is plan 33-20's pushed run reading GREEN 1b and ORDERING green on ubuntu. UNKNOWN - verify until then."

# Metrics
duration: 24min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 17: One parse-fault key on every host; the two-file cases off the zero-margin boundary Summary

**`faultKey` — one exported key-forming rule at the compiler host's `set` and the checker's `get` — makes the parse fault recorded on win32 the fault the checker prints (W-30, W-31), and `mixedArrangementDepth` — a doubled depth DERIVED from the measured boundary — takes GREEN 1b and ORDERING off the adjacent pair they were planted on in a different arrangement (U-1, U-2), after a written diagnosis that names cause class SUITE and marks the ubuntu mechanism `UNKNOWN - verify`.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-09-20T21:21:18Z
- **Completed:** 2026-09-20T21:45:33Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- W-30 closed in the MODULE: `parseFaults` is keyed and looked up through `faultKey`, so on a backslash host the recorded `Maximum call stack size exceeded` is found and printed instead of `the program did not include it`. Proven on darwin with a `path.win32` pair (test AB's converse shows the raw-keyed map does NOT find the lookup) and mutation-proven (MUTANT-A: identity reds AA, AB, POINT 2).
- W-31 closed in the TEST: POINT 2 compares through `faultKey` on both sides, plus a win32-spelled lookup keyed the same way.
- U-1 / U-2 diagnosed at zero fabrication BEFORE the fix (commit `387fa0fd` touches the test file only): cause class SUITE; this host's two pairs measured and quoted (`one-file {627, 628} · mixed {627, 628} · shift 0`); the compiler's parse order in the mixed arrangement observed (`clean` before `nested`); the ubuntu direction marked `UNKNOWN - verify` with the pushed run named as the settling observation.
- U-1 / U-2 fixed by DERIVATION: `mixedArrangementDepth(boundary) = 2 * boundary.overflow` at GREEN 1b, ORDERING (b) and PROBE 2 (b); nine one-file sites keep the exact boundary; test AD pins `>= 2 * overflow`; no depth literal (`nestedSpec\([0-9]+\)` → 0); no platform conditional.
- Post-wave gate green: `npx tsc --noEmit` exit 0; `tsc -p tsconfig.tests.json` exit 0; full suite (e2e excluded) `78 passed (78)` files, `5362 passed | 2 skipped (5364)`, 491 s, exit 0; `check:nul-bytes` ALL CHECKS PASSED; `npm run build && npm run check:build-parity` ALL CHECKS PASSED.

## Task Commits

Each task was committed atomically (RED before GREEN where TDD applies):

1. **Task 1: one fault key for the host and the checker (W-30, W-31)** — RED `ef6b6de9` (test), GREEN `1dcce77b` (feat; `.ts` + rebuilt `.js` in one commit)
2. **Task 2: diagnose the two ubuntu reds** — `387fa0fd` (test; `parseBoundaryFor` + the measurement case; `git show --stat 387fa0fd` → `scripts/runnable-ref/uat-spec-integrity.test.ts | 49 ++++++++++++++++++++++---`, `1 file changed, 44 insertions(+), 5 deletions(-)`)
3. **Task 3: mixed-arrangement cases plant a derived depth with margin (U-1, U-2)** — RED `94f3a792` (test), GREEN `500cbfd6` (feat)

**Plan metadata:** see the final `docs(33-17)` commit.

TDD gate compliance: `test(33-17)` precedes `feat(33-17)` for both TDD tasks; both RED records returned `RED_EVIDENCE_OK` from `check tdd-red-evidence` (Task 1 target AA: `expected 'undefined' to be 'function'`; Task 3 target AD: `expected 628 to be greater than or equal to 1256`). No REFACTOR commit — no cleanup was needed after either GREEN.

## Diagnosis — U-1 / U-2

Written 2026-09-20 after Task 2's measurement commit `387fa0fd` and BEFORE any change that closes the reds (D-11's shape applied to a CI red). Zero fabrication: every number below is quoted from a command's own output or from `33-CI-MEASUREMENT.md` § 2.4; what the log cannot confirm is marked `UNKNOWN - verify`.

### Cause class: SUITE — a zero-margin boundary used outside the arrangement it was measured in

**Hypothesis.** `parseBoundary()` bisects the overflow depth under a ONE-file program (the nested spec alone) and returns an ADJACENT pair (`hi - lo === 1`, asserted by GREEN 2, Test 2 and CONTROL C). `GREEN 1b` and `ORDERING (b)` then plant `nestedSpec(overflow)` BESIDE `clean.uat.spec.ts` — a two-file program — at that same depth, i.e. with ZERO margin. The depth at which a recursive-descent parse exhausts the interpreter's stack depends on the stack already consumed, and on the per-frame size of the parser functions, at the moment the compiler reaches the pathological file; a program with a second root file reaches that file through a different history. A shift of a few frames in either direction flips the outcome at an adjacent boundary. The direction and size of the shift are properties of the V8 build, the platform ABI's frame sizes and the tier-up state of the parser functions — `UNKNOWN - verify` on the ubuntu runner (node 22, x64), which this host (node 24, arm64) cannot observe. No platform CONDITION is involved: the same suite runs the same bytes on every leg; only the margin is wrong.

### Evidence (33-CI-MEASUREMENT.md § 2.4, run 35499800942)

| Row | Case | Assertion text (from the log) | What it shows |
|---|---|---|---|
| U-1 | `GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr` (`:6748`) | `AssertionError: expected +0 to be 2` (`expect(r.status).toBe(2)`) | at the one-file `overflow` depth, the two-file program EXITED 0 — the parser FINISHED the nested file it could not finish alone |
| U-2 | `ORDERING: the per-file could-not-run reason precedes reportMeasured's output` (`:7089`) | `AssertionError: expected -1 to be greater than or equal to 0` (`mr.stderr.indexOf("e2e/uat/nested.uat.spec.ts")`) | same arrangement (`plant(mixed, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC)`): the file is never named on stderr because it was never refused |
| — | `GREEN 1` (the pathological spec ALONE) | PASSED on the same ubuntu leg in 9 943 ms | the single-file refusal path works on the runner: the RangeError is raised, caught in the host wrapper, printed as `could not be PARSED (…)`, exit 2 |
| — | both cases on windows-latest | green on both runs (baseline 35394268365 and 35499800942) | the flip is not universal; it is where the shift happens to cross the adjacent pair |
| — | both texts on the baseline run (`:6691`, `:7032`) | byte-identical | not a regression of any phase-33 change; the boundary was zero-margin from the day it was written |

### Measured on this host (Task 2's case, from its own `console.log`)

```
[33-17 boundary] one-file {safe: 627, overflow: 628} · mixed {safe: 627, overflow: 628} · shift 0 · node v24.12.0 darwin/arm64
```

The two pairs are EQUAL on darwin, so the mechanism is CONSISTENT with this host but NOT CONFIRMED by it: the hypothesis predicts a shift whose sign and size are host-specific, and this host's shift is 0. The observation that settles it is the pushed run (plan 33-20): `GREEN 1b` and `ORDERING` green on ubuntu with the doubled derived depth (Task 3) and green nowhere else changed. If they stay red at 2× the one-file overflow, the cause is not a few-frame shift and this diagnosis is falsified.

One further zero-cost observation on this host (a node one-liner over the repo's own `typescript`, the target's `include: ["**/*.ts"]`): in the mixed arrangement the compiler's `getSourceFile` order is `clean.uat.spec.ts`, `nested.uat.spec.ts`, `types/foreign-framework.d.ts`, `types/playwright-test.d.ts`; in the one-file arrangement `nested.uat.spec.ts` is the FIRST file parsed. So the pathological parse runs with the parser's functions already invoked once (one small file) and one root-file iteration deeper in the compiler's own loop — the concrete difference between the two arrangements. Which way that moves the boundary on node 22 / x64 is what this host cannot measure.

### What would distinguish the next class

- **KIT (the checker not refusing a parse fault in a multi-file program):** `GREEN 1b` would be red on EVERY leg, since the checker's code is the same bytes everywhere; the windows leg is green on both runs. Not this class.
- **PLATFORM (ubuntu's node not raising the RangeError):** `GREEN 1` (one file, same depth) would be red on ubuntu too; it PASSED in 9.9 s. Not this class.
- **`.temp` ENOENT (the class round 1 filed these under):** the assertion text would name a scandir error, not `expected +0 to be 2`; and 33-02's fix landed while the texts stayed byte-identical. Not this class.
- **SUITE (this diagnosis):** `GREEN 1` green, `GREEN 1b` red on one leg only, texts unchanged across runs, and the case's depth taken from a bisection performed in a different arrangement. All four hold.

### Every `nestedSpec(overflow)` site, classified (Task 2's read of the file at `387fa0fd`)

| Site (case) | Arrangement | Disposition (Task 3) |
|---|---|---|
| GREEN 1 | one file | exact boundary — the measurement |
| GREEN 1b | MIXED (nested + clean) | `mixedArrangementDepth(parseBoundary())` |
| GREEN 2 | one file, both sides | exact boundary — the adjacency measurement |
| CONTROL 2 tail (`cnr`) | one file | exact boundary |
| ORDERING (a) `solo` | one file | exact boundary |
| ORDERING (b) `mixed` | MIXED (nested + clean) | `mixedArrangementDepth({ overflow })` |
| D-28 `shapeCases()` / Test 2 (`driveShape`) | one file (`shape.uat.spec.ts` alone in a probe root) | exact boundary — the corpus partition straddles it |
| PROBE 2 (b) | MIXED (nested + clean), IN-PROCESS: depth from `inProcessOverflowDepth()` (a doubling search, not a bisection — its margin over the thread's true boundary is anywhere in [1, depth/2]) | `mixedArrangementDepth({ overflow: inProcessOverflowDepth() })` |
| PROBE 2 (c) tail | one file | exact boundary |
| PROBE 3 (i)(ii)(iii) | one file each | exact boundary |
| RED 6 (`driveSpec`) | one file (`p.uat.spec.ts`) | exact boundary |
| CONTROL C (`driveSpec`, both sides) | one file | exact boundary — the adjacency re-measurement |

## Per-case record: the pushed-run title, the mechanism, the closure

| Row | Case title (pushed run) | Mechanism | Closure | Expected on 33-20 |
|---|---|---|---|---|
| W-30 | `GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr` | module: `parseFaults.set(fileName)` (forward slashes) vs `.get(join(repoRoot, rel))` (host separator) | `faultKey` at both sites; AB reproduces the defect and its fix with `path.win32` on darwin | green (windows) |
| W-31 | `POINT 2: the Program's included files are a SUPERSET of the derived spec set` | test: `included.has(join(root, rel))` over forward-slashed `fileName`s | both sides through `faultKey`; a win32-spelled lookup added | green (windows) |
| U-1 | `GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr` | suite: zero-margin depth from a one-file bisection planted in a two-file program | `mixedArrangementDepth(parseBoundary())` | green (ubuntu) — the settling observation |
| U-2 | `ORDERING: the per-file could-not-run reason precedes reportMeasured's output` | same arrangement as U-1 | `mixedArrangementDepth({ overflow })` at (b); (a) unchanged | green (ubuntu) |

## Mutation proofs (each restored before its commit; `grep MUTANT-A` → 0)

- MUTANT-A: `faultKey` returns its input (identity) in the built `.js` → `× POINT 2`, `× AA`, `× AB` (3 failed); restored, 5 passed.
- Task 3's RED is its own mutation proof for the margin: `mixedArrangementDepth` returning the bare `overflow` reds AD (`expected 628 to be greater than or equal to 1256`).

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` — `faultKey` (exported, docblock in `scanKey`'s shape naming the CI row, the two sites, the reimplementation reason); applied at the wrapped `host.getSourceFile` catch and at the `analyzeSpecs` lookup; `ProgramContext.parseFaults` doc updated
- `scripts/runnable-ref/uat-spec-integrity.js` — rebuilt twin (parity ALL CHECKS PASSED)
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — imports `sep`, `win32` and the shared normalizer; `faultKey` on the `CheckerModule` interface; POINT 2 through `faultKey`; `parseBoundaryFor` (the one bisection) + `parseBoundary()` delegating; `mixedArrangementDepth`; the 33-17 (U-1 / U-2) block (measurement case, AD); the 33-17 (D-15) block (AA, AB); three mixed sites re-pointed

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: `faultKey` is reimplemented inline rather than imported, because the runnable ships alone (recorded as the deviation below).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `faultKey` reimplements `toPosixWith` inline instead of importing `../posix-path.js`**
- **Found during:** Task 1 (read_first of the module header, lines 14–20: "this file's ONLY top-level imports are node: builtins"; `install/install.ts` RUNNABLES materializes `scripts/runnable-ref/uat-spec-integrity.js` alone to `tools/grugops/uat-spec-integrity.js`)
- **Issue:** the plan's action says "import from `../posix-path.js`". On an installed host there is no `posix-path.js` beside the materialized runnable, so the import fails at module load (`ERR_MODULE_NOT_FOUND`) on every host copy, and the file's own `host-emulation: the materialized .js runs from a bare temp dir and still exits 1` case goes red. The plan's acceptance criterion "it imports from `../posix-path.js`" is therefore NOT met, deliberately.
- **Fix:** `faultKey` carries the same three-line rule and the same empty-separator refusal as `toPosixWith`, with a docblock naming the origin and the reason (the module's `reportMeasured` precedent: "REIMPLEMENTED here rather than imported. It cannot be imported: this runnable is node:-builtins-only"). The TEST file imports `toPosix`/`toPosixWith` and test AA asserts `faultKey(p) === toPosix(p)` and `faultKey(p, win32.sep) === toPosixWith(p, win32.sep)` over five discriminating spellings plus the `"/"` identity and the empty-separator throw, so the two spellings of one rule cannot drift apart without a red.
- **Files modified:** scripts/runnable-ref/uat-spec-integrity.ts, scripts/runnable-ref/uat-spec-integrity.test.ts
- **Verification:** host-emulation case passes; AA passes; MUTANT-A reds AA/AB/POINT 2
- **Committed in:** `1dcce77b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** the plan's mechanism (one key, both sites, win32-proven on darwin) lands exactly; only the physical home of the three-line rule differs, with the equality to the shared normalizer asserted by test instead of by import.

## Issues Encountered

- `check tdd-red-evidence` parses node-runner TAP (`# tests N` summary lines, exact target names). Vitest's `--reporter=tap` (nested) classified as `zero_tests_discovered`; `--reporter=tap-flat` lacks the summary lines. Resolution: append `# tests/pass/fail` counted from the same tap-flat output's non-SKIP lines (a derivation of the run's own output, labelled as such inside the record) and set `targetTest` to the full `file > describe > title` chain. Both records then returned `RED_EVIDENCE_OK`.
- `npm run check:build-parity` reports the `.js` as "moved" while it is modified-but-uncommitted (it compares against the committed tree); it passes once `.ts` and `.js` are committed together, which is what the GREEN commit does.
- Vitest 4 hides `console.log` from passing tests by default; the measurement line is read with `--silent=false --reporter=verbose`.

## Ledger state (for plan 33-23)

WINDOWS.md rows 227 (W-30/W-31, module + test) and 230 (U-1/U-2, ubuntu) stay `open` — both flip only on plan 33-20's pushed run reading green (row 227 on windows, row 230 on ubuntu). `deferred-items.md` items "Two windows reds in `scripts/runnable-ref/uat-spec-integrity.test.ts` are NOT ADDRESSED" and "Two UBUNTU reds in `scripts/runnable-ref/uat-spec-integrity.test.ts` (`GREEN 1b` :6748, `ORDERING` :7089)" are addressed here by mechanism and likewise stay open until 33-20. No new WINDOWS.md entry: no stub, skipped test or unrun verify was left behind; the one deviation is recorded above.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-83 (lost diagnostic) mitigated by `faultKey`; T-33-84 (fabricated diagnosis) mitigated by the measured pairs and `UNKNOWN - verify` markings; T-33-85 (host-flipping mixed case) mitigated by the derived margin and test AD; T-33-SC: no package installed.

## Known Stubs

None.

## Next Phase Readiness

- The four rows W-30, W-31, U-1, U-2 are closed by mechanism on this host; the windows and ubuntu greens are plan 33-20's expected observations, and U-1/U-2 is additionally the observation that confirms or falsifies the SUITE diagnosis.
- Plan 33-18 (wave 8) is next in the round.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- `[ -f scripts/runnable-ref/uat-spec-integrity.ts ]`, `.js`, `.test.ts` — FOUND
- commits `ef6b6de9`, `1dcce77b`, `387fa0fd`, `94f3a792`, `500cbfd6` — FOUND in `git log --oneline 85901388..HEAD` (5 = `git rev-list --count`)
- `parseFaults.get(faultKey(` → 2; `mixedArrangementDepth(` → 6; `nestedSpec\([0-9]+\)` → 0
