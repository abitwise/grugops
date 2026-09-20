---
phase: 33-live-capture-windows-portability
plan: 06
subsystem: testing
tags: [windows, cap-02, tmpdir, realpath, 8.3-short-name, symlink, d-16, esm-file-url, crlf, freshness, tsc, npx, precheck, vitest]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-02's `.temp` tolerance and its Open Question 5 answer (the freshness reds are NOT `.temp`-downstream); 33-03's `scripts/posix-path.ts` normalizer; 33-04's three-variable temp-root plant and its `install.test.ts:2632` diagnosis; 33-05's `stageSymlinkOrSkip` / `skipLine` D-16 helpers and its VERSION LF pin
  - phase: 32.1-board-dashboard-deferred-residuals
    provides: review 32.1-14 IN-01's in-repo record that a shell-less `spawnSync("npx")` on Windows fills neither stream and sets `error` (scripts/check-build-parity.ts:134)
provides:
  - "`install/install.test.ts`: `canonicalPath` (realpathSync.native + toPosix, BOTH sides) and `expectMaterializedKit` (published KIT= extracted from the block, forward-slash spelling asserted separately from canonical identity) at every kit-root comparison; the two `ln -s` fixtures staged through `stageSymlinkOrSkip`; ARM 1 plants `TMPDIR`, `TMP` and `TEMP`; the pinned-clock wrapper imports by `pathToFileURL`; the source VERSION compared trimmed"
  - "`scripts/freshness.ts` (+ committed `.js`): the compiler is `typescript/lib/tsc.js` resolved through the module's own require chain and run under `process.execPath` — no `npx` shim, no shell, no host branch; a launch that produced no child and an entry that cannot be resolved are each a named refusal distinct from a compile that ran and refused, whose text is forwarded on both streams with its exit status"
  - "`scripts/freshness.test.ts`: `transcript()` carries stderr; Test 3 asserts the compiler's OWN diagnostic code (derived from `ts.Diagnostics`) and the absence of the launch/locate sentences, so a compiler that never ran no longer satisfies 'not fresh'"
  - "`scripts/coordinator-resolution-precheck.test.ts`: Case 2 anchors on the stable sentence fragment; Case 2b compares the printed kit path canonically to the kit under the script's own kept home; the script is byte-unchanged"
  - "the diagnosis RESEARCH assumption A4 asked for: the eight freshness reds were the gate's LAUNCH of the compiler, not the clone, not dependency resolution, not the compiler's diagnostics (below)"
affects: [33-09 pushed CI run, the CAP-02 gap round, 33-01 dry run (invokes the untouched precheck)]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 10453
  tasks: 3
  commits: 3
plan_head_before: ba52cd506cba96ce837ee99e807abc90eac52396

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two temp-path classes, two fixes, one helper: resolve through the platform's real-path call FIRST (identity: 8.3 vs long name, /var vs /private/var), THEN spell forward-slashed (separator); both sides of the comparison, and the comment says which class each step answers so neither is swapped for the other later"
    - "Read the CI log's Received text before the class name RESEARCH gave it: three of the eight installer reds were separator-only (RUNNER~1 on both sides), two were an MSYS `ln` that exited 0 and left a copy, one was a Windows path read as a URL scheme, one was a premise never planted, one was a CRLF checkout"
    - "Time is evidence: a rebuild that 'failed' in 282 ms never ran a compiler; ask what LAUNCHED before asking what compiled"
    - "Launch a dev-dependency's CLI as a node script through its resolved entry and process.execPath, never through the npm/npx shim: one launch on every platform, no shell on the data path, no host branch"
    - "A fail-closed case that only asserts the negative ('not fresh') passes vacuously when the mechanism never runs; assert the positive evidence the mechanism alone can produce (the compiler's own diagnostic code)"

key-files:
  created: []
  modified:
    - install/install.test.ts
    - scripts/freshness.ts
    - scripts/freshness.js
    - scripts/freshness.test.ts
    - scripts/coordinator-resolution-precheck.test.ts
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "The install suite's kit-root comparisons go through realpathSync.native AND the 33-03 normalizer on both sides, even though the CI log shows the three windows reds there were separator-only (RUNNER~1 on both sides): RESEARCH item 2's claim that the 8.3/long-name class affects install.test.ts is DISPROVEN by the log (that class is confined to scripts/context-io.test.ts), but a host that returns the long form from one call is exactly the next red, and the comment records both classes so the realpath step is not deleted as redundant"
  - "The two `spawnSync(\"ln\", [\"-s\", …])` fixtures are staged through stageSymlinkOrSkip (D-16), not `symlinkSync` with a win32 early return: on windows-latest the MSYS `ln` exited 0 and left a COPY, and the cases asserted `isSymbolicLink()` over a fixture they never had; a refused link is now one printed, counted row and the case returns; the install suite's `process.platform` count stays at 15 (all pre-existing)"
  - "The exit-status site (:2632) is a PREMISE failure, not a contract disagreement: the installer's exit-3 contract for an unusable temp root is asserted unchanged; what was wrong is that `TMPDIR` alone plants nothing on win32 (node's os.tmpdir reads TEMP, TMP, never TMPDIR), so the dead root is now planted as all three — the 33-04 plant, the deferred entry closed"
  - "The freshness reds are fixed at the LAYER the diagnosis named — the gate's launch of the compiler in scripts/freshness.ts — and at no other: the clone was intact (every clone checked out and `npm run build` succeeded under the harness's shell), dependency resolution was never reached, and no compiler diagnostic was ever produced; the fix resolves `typescript/lib/tsc.js` through the gate's own require chain and runs it under process.execPath, which is also how the harness's clone under .temp/ finds the checkout's node_modules (as `npx` found the ancestor .bin)"
  - "The gate's compile-failure sentence is unchanged and gains the exit status; two NEW sentences name the two layers that are not a compile failure ('could not be launched (<spawn error>)', 'could not be located from this checkout (<resolve error>)'); both arms were driven on darwin"
  - "Test 3 asserts the compiler's own code for the planted error, derived from ts.Diagnostics by message name (33-02's compilerDeclaredCode reading), never a typed 2322: RED against the pre-fix gate with npx unreachable — the windows shape — and GREEN on the fixed gate"
  - "The precheck script is untouched (git diff exit 0); its `scratch install:` and `kept at:` lines print host-shaped LOCATIONS that only its own test consumes as locations, which D-15's location-vs-spelling partition does not classify as a publishing defect — recorded for the census, not fixed"

patterns-established:
  - "Watch every new skip arm fire on the host you have (FORCE_ABSENT), and every new refusal arm of a gate (an outside clone for 'could not be located', a mutated copy for 'could not be launched') — a branch nobody has watched is a branch nobody has tested"
  - "When a windows red has no compiler text, reproduce the SILENCE offline (make the shim unreachable) before touching the compiler layer"

requirements-completed: [CAP-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The installer suite compares its kit root canonically on both sides with the forward-slash spelling asserted separately, stages its symlink fixtures through the D-16 helper, plants the dead temp root on every host, and imports the pinned-clock wrapper by file URL; no host branch added"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts (136 passed, 1 skipped pre-existing, exit 0)"
        status: pass
      - kind: unit
        ref: "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT='symlink to a regular file (CONTROL — it resolves to one)' … -t 'symlink adapter|user-owned AGENTS.md symlink|old-layout fixture is shaped' (3 passed, 3 SKIPPED rows printed)"
        status: pass
      - kind: other
        ref: "grep -c 'realpath' install/install.test.ts = 11; grep -c 'process\\.platform' install/install.test.ts = 15 (baseline 15); grep -n '\"ln\"' finds comment mentions only"
        status: pass
    human_judgment: false
  - id: D2
    description: "The freshness gate launches the compiler's own entry under process.execPath, names a launch or locate failure as its own refusal, and quotes a compile that refused; the harness transcript carries stderr and Test 3 demands the compiler's own diagnostic"
    requirement: CAP-02
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts with .temp present (11 passed) and after rm -rf .temp (11 passed, 0 ENOENT lines)"
        status: pass
      - kind: integration
        ref: "npm run freshness on HEAD ea95afdf (All build outputs fresh: 69 committed .js file(s), exit 0); the gate with npx unreachable on PATH also exits 0"
        status: pass
      - kind: unit
        ref: "Test 3 against HEAD~'s pre-fix freshness.js with npx unreachable: 1 failed (assertion carries the compiler-less sentence); against the fixed gate: passes"
        status: pass
    human_judgment: false
  - id: D3
    description: "The precheck test anchors on the stable sentence and compares the kit path canonically; the precheck script is byte-unchanged"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/coordinator-resolution-precheck.test.ts (8 passed; Case 2b mutation against the home instead of the kit: 1 failed)"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- scripts/coordinator-resolution-precheck.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three clusters are green on the windows-latest leg"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Not measurable on this host. Each mechanism was reproduced on darwin by its mechanism (the shim made unreachable, the D:\\ import specifier, the FORCE_ABSENT seam, the /var vs /private/var collapse) and the fixes carry no host branch, but the windows outcome is read from the pushed CI run plan 33-09 makes — CAP-02's literal bar"

# Metrics
duration: 28min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 06: Installer temp-dir identity, the freshness clone rebuild, and the precheck anchor Summary

**The eight installer reds re-read from the CI log and closed at their real classes (three separator-only kit-root comparisons now canonical on both sides through realpath + the 33-03 normalizer, two `ln -s` fixtures that left a copy now staged through the D-16 skip helper, one never-planted `TMPDIR` premise now planted as three variables, one Windows path refused as a URL scheme now a `file://` import, one CRLF-era version expectation now trimmed); the eight freshness reds DIAGNOSED — the gate's `npx` launch never started a compiler on Windows, reproduced on darwin as the same sentence in 0.18 s — and fixed at that one layer by running `typescript/lib/tsc.js` under `process.execPath`, with two new refusal sentences that name a launch or locate failure and a Test 3 that now demands the compiler's own diagnostic; and the precheck test re-anchored on the stable sentence with a canonical path comparison while the script it tests is byte-unchanged.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-09-20T02:08:09Z
- **Completed:** 2026-09-20T02:36:24Z
- **Tasks:** 3
- **Files modified:** 6 (5 source/test + deferred-items.md)

## Accomplishments

- `install/install.test.ts`: every kit-root comparison is `expectMaterializedKit(body, home)` — the KIT= line is extracted from the materialized block, asserted forward-slash spelled (no backslash, on any host), and compared to `join(home, "agent-factory")` with `canonicalPath` (= `toPosix(realpathSync.native(p))`) on BOTH sides. The helper's comment separates class (1), identity (8.3 short name vs long name; `/var` vs `/private/var`), which only the real-path call collapses, from class (2), separator, which only the normalizer answers, so a later reader does not replace one with the other.
- The two `spawnSync("ln", ["-s", …])` fixtures (the user-owned AGENTS.md link; the old-layout LANDMINE adapter) are staged through 33-05's `stageSymlinkOrSkip`; a refusal prints one `SKIPPED shape=… position=… platform=…` row naming the surviving route and the case returns. All three arms were driven on darwin through the `FORCE_ABSENT` seam.
- ARM 1 of the R-5 case plants `TMPDIR`, `TMP` and `TEMP` together; the exit-3 contract is asserted unchanged. The pinned-clock migrate wrapper imports the installer by `pathToFileURL(INSTALL_JS).href` and asserts it reached the installer (stderr in the message). The downgrade case compares the source VERSION `.trim()`med with a premise that it is a bare token.
- `scripts/freshness.ts` (+ `.js`): the compiler entry is `createRequire(import.meta.url).resolve("typescript/lib/tsc.js")`, run as `spawnSync(process.execPath, [entry, "--outDir", tmp])`. `build.error` set → `the compiler could not be launched (<message>)`; entry unresolvable → `the compiler could not be located from this checkout (<message>)`; non-zero exit → the original sentence plus `(tsc exit N)`, with both child streams forwarded first.
- `scripts/freshness.test.ts`: `transcript()` appends `stderr: …`; Test 3 derives the planted error's code from `ts.Diagnostics.Type_0_is_not_assignable_to_type_1` and asserts `TS<code>` is in the output and neither new refusal sentence is.
- `scripts/coordinator-resolution-precheck.test.ts`: Case 2's anchor is `/^materialized kit path: \S.*$/m`; new Case 2b asserts the printed path `isAbsolute` and canonically equal to `<kept home>/agent-factory` over the `--keep-scratch-target` run. `git diff --exit-code -- scripts/coordinator-resolution-precheck.ts` exits 0.
- Full regression lane on the final tree: 78 files, 5340 passed, 2 skipped, 0 failed, 483.22 s. `npm run freshness` 69/69 fresh. `check:nul-bytes` ALL CHECKS PASSED.

## Task Commits

1. **Task 1: Temporary-directory identity and line endings in the installer suite** - `fe5d7c0d` (fix)
2. **Task 2: The temporary-clone rebuild — diagnose the layer, then fix that layer** - `8e19fb23` (fix)
3. **Task 3: The precheck script's own anchor matches what the script prints** - `ea95afdf` (fix)

## Task 1 — the eight installer reds, read from the log rather than from the class names

The windows-latest job log (run 35394268365, job 105759397857, `--log-failed`) names the eight failing sites. Their real classes, against the four the plan enumerated:

| Site | Assertion text (Received) | Class | Fix |
|---|---|---|---|
| `:593` two-root materialize | body contains `KIT="C:/Users/RUNNER~1/…"`; expected `C:\Users\RUNNER~1\…` | **separator only** — `RUNNER~1` on BOTH sides | `expectMaterializedKit` |
| `:3128` migrate converts | same shape | separator only | `expectMaterializedKit` |
| `:3721` KIT-02 seventeen adapters | `KIT="C:/…"` vs `KIT="C:\…"` | separator only | `expectMaterializedKit` |
| `:996` user-owned AGENTS.md symlink | `isSymbolicLink()` false after `spawnSync("ln", ["-s", …])` | **`ln` left a copy** (MSYS `ln` in PATH exits 0 without a link) | `stageSymlinkOrSkip` + premise |
| `:3095` old-layout fixture, symlink variant | same, via `makeOldLayoutFixture({ symlink: true })` | `ln` left a copy | `stageOldLayoutSymlinkAdapter` at both callers |
| `:2632` R-5 ARM 1 | `tmpdir: status=0` vs `status=3` | **premise never planted** (win32 `os.tmpdir` never reads `TMPDIR`) | plant `TMPDIR`+`TMP`+`TEMP` |
| `:3380` backup-name collision | `expected '' to match /aborted/` — EMPTY stdout | **ESM refused the import specifier**: `import("D:\\a\\…\\install.js")` → `ERR_UNSUPPORTED_ESM_URL_SCHEME … Received protocol 'd:'`, exit 1 (reproduced on darwin with a `D:\` string) | `pathToFileURL(...).href` + a premise naming the wrapper's layer |
| `:3589` downgrade warns | `'2.1.0\r'` from `split("\n")[0]` over a CRLF checkout | **CRLF checkout of VERSION** (unpinned until 33-05) | `.trim()` + bare-token premise |

**RESEARCH item 2 disproven for this file.** "8.3 short-name vs long-name tmpdir … affects `context-io.test.ts` and `install/install.test.ts`": every `RUNNER~1`/`runneradmin` disagreement in the log is in `scripts/context-io.test.ts` (`:11243`, `:11311`, `:11324` and the `:9149` home-walk premise). In the install suite both sides of every failing comparison carried `RUNNER~1`; the disagreement was `\` versus `/`. The canonical real-path step is kept on both sides anyway — it is what answers the next red, when a call returns the long form — and the comment says which class it is for.

**The exit-status contract.** The plan asked that a contract-versus-behavior disagreement be recorded rather than edited away. There is none: the installer's documented behavior for an unusable temp root is exit 3 with `install INCOMPLETE`, it does that on this host, and the windows `status=0` was the test's premise failing (no dead root was ever planted), not the installer returning something else. The assertion is unchanged; the plant is fixed.

**No host branch added.** `grep -c 'process\.platform' install/install.test.ts` = 15 before and after (all pre-existing, fourteen of them silent `if (process.platform === "win32") return;` early returns on symlink cases — recorded, not this plan's to convert). `grep -c 'realpath'` = 11.

**Class (1) exercised on this host.** `mkdtempSync(tmpdir())` returns `/var/folders/…` and `realpathSync.native` returns `/private/var/folders/…` (measured); Case 2b of Task 3 shows the collapse in its mutation output. Class (2) is a POSIX no-op by construction (33-04's posture); the windows spelling of the normalizer is `toPosixWith(p, "\\")` → `C:/Users/RUNNER~1/Temp/x` (measured).

## Task 2 — the diagnosis (RESEARCH assumption A4, Open Question 5)

**Step one — the cheaper hypothesis.** Plan 33-02 already answered Open Question 5 in the negative: `scripts/freshness.test.ts` creates `.temp/freshness-clones` itself (`rmSync` + `mkdirSync` in `beforeAll`). Re-measured here: the suite is 11/11 with `.temp` present and 11/11 after `rm -rf .temp`, 0 `ENOENT` lines. Absence alone reproduces nothing. The eight are a separate class.

**Step two — which layer answered.** Evidence, in the order it was read:

1. The CI log: every one of the eight assertion messages is the gate's own `BUILD-OUTPUT CHECK FAILED: the rebuild did not compile cleanly …` with **no compiler text at all**, and `Test 1 (control, real tree)` failed in **282 ms** — a `tsc` rebuild of 69 outputs cannot finish in that time. `Test 3 (fail-closed, surviving)` PASSED on the same leg: "not fresh" is also what a compiler that never ran produces.
2. The harness's own comment (`scripts/freshness.test.ts:112-114`, pre-existing): "npm and npx resolve to .cmd shims on Windows, which node:child_process refuses to spawn without a shell. The gate itself is unchanged in this respect; only the harness opts in." Every clone's `npm run build` therefore succeeded (the harness spawns `npm` with a shell on win32; `beforeAll` would have thrown otherwise), so the clone and the dependency resolution inside it were both fine.
3. The gate: `spawnSync("npx", ["tsc", "--outDir", tmp], { cwd: ROOT })` — no shell. On Windows `npx` is `npx.cmd`; libuv's PATH search tries no `.cmd`, so the child never runs, `status` is `null`, `error` is `ENOENT` (or the `.cmd`-without-shell `EINVAL`); `null !== 0` takes the compile-failure branch, and `build.stdout`/`build.stderr` are `undefined` because no process produced them.
4. The in-repo precedent: `scripts/check-build-parity.ts:134-139` (review 32.1-14 IN-01) records the identical case — "a compiler that never started — `npx` resolving as `npx.cmd` on Windows is the recorded case — fills neither and sets `error` instead, leaving `status` null."
5. **Reproduced offline on darwin** by making `npx` unreachable (`PATH=<dir with node only>:/usr/bin:/bin node scripts/freshness.js`): the same sentence, no compiler text, exit 1, **0.18 s**; `spawnSync("npx", …)` under that PATH returns `{ status: null, error: 'ENOENT', stdout: undefined, stderr: undefined }`.

**The layer: the gate's LAUNCH of the compiler.** Not the clone (intact, checked out, built), not dependency resolution (never reached — the compiler process was never created), not the compiler's diagnostics (none exist). The plan's three candidates presuppose a compiler that ran; the answer is the step before all three.

**Step three — the fix, at that layer and nowhere else.** `scripts/freshness.ts` now resolves `typescript/lib/tsc.js` (what `bin/tsc` requires; typescript 6.0.3 has no `exports` map) through `createRequire(import.meta.url)` and runs it under `process.execPath`. Node's resolution walks up from the gate's own directory, so the harness's clone under `<checkout>/.temp/freshness-clones/<name>/` finds `<checkout>/node_modules` exactly as `npx` found the ancestor `.bin` — and a fresh checkout finds its own. One launch on every platform; `tmp` rides an argv array (no shell on the data path); no `process.platform`. The compile-failure sentence is unchanged (anchored nowhere else in the tree — grep) and gains `(tsc exit N)`; a launch failure and an unresolvable entry are each their own sentence. Both new arms watched: an outside `git clone --local` (no ancestor `node_modules`) prints `could not be located from this checkout (Cannot find module 'typescript/lib/tsc.js' …)`, exit 1; a throwaway mutated copy with an unrunnable node prints `could not be launched (spawnSync /nonexistent/node-33-06 ENOENT)`, exit 1. The gate on the real tree is 69/69 fresh with `npx` reachable AND unreachable.

**The harness names its layer too (T-33-29).** `transcript()` now appends the gate's stderr. Test 3 asserts the compiler's own code for the planted error (`ts.Diagnostics.Type_0_is_not_assignable_to_type_1.code`, read from the host compiler's table, never typed) is in the output and neither refusal sentence is. Discrimination: against `HEAD~`'s pre-fix `freshness.js` with `npx` unreachable — the windows shape — Test 3 is **RED** (its assertion message is the compiler-less sentence); against the fixed gate it is green. So a host where the rebuild does not happen now reds Test 3 by name instead of passing it.

**Why no other layer was touched.** `scripts/check-build-parity.ts:132` carries the same `spawnSync("npx", ["tsc"])`, but it already reads `build.error`, it runs only in the ubuntu-scoped parity step, and it is not this plan's file — recorded in `deferred-items.md`. `vitest.config.ts`, `scripts/catalog-freshness.ts` (a mirror rebuild that spawns `node` on a JS entry — the shape this gate now matches) and the clone/`npm run build` harness are untouched.

**What remains `UNKNOWN - verify`.** The windows leg itself. The mechanism is measured here by reproduction of the silence, and the fix launches the compiler the same way on every host, but a compile that RUNS on windows-latest and refuses for a reason of its own (a diagnostic this tree does not show on darwin) would now print that diagnostic in the CI log — the observation that distinguishes "launch" from "compiler" on the next run, and the reason the improved reporting is in place either way. Read from plan 33-09's pushed run.

## Task 3 — the anchor, and a census note

Case 2's `/^materialized kit path: \/.+$/m` demanded a leading `/` — a POSIX-absolute spelling the script never promised. The value it prints is the coordinator adapter's materialized `KIT=` line, which the installer publishes forward-slashed (`install.ts` `toPosix`), so on windows-latest it read `C:/Users/RUNNER~1/AppData/Local/Temp/grugops-coordinator-precheck-home-SFjzSR/agent-factory` and failed the regex while being exactly right. The anchor is now the stable fragment and a non-empty remainder; Case 2b asserts the path-bearing part over the `--keep-scratch-target` run (the only run whose kit still exists on disk): `isAbsolute(printed)` (the host's own notion, no branch) and `canonicalPath(printed) === canonicalPath(join(keptHome, "agent-factory"))`. Mutation (compare against the home instead of the kit): RED, and the message shows both sides collapsed to `/private/var/…` — the identity class at work on this host.

**Publishing-census note (for 33-03's partition, not fixed here).** The script prints three path-bearing lines: `materialized kit path: <KIT=>` (:451 — the installer's forward-slash publication, correct under D-15); `scratch install: … into <target> with an isolated kit home at <home>` (:313) and `scratch target kept at:` / `scratch kit home kept at:` (:575-576), which are host-separated **locations** (`C:\Users\RUNNER~1\…` on the windows log). Their only consumer is this test, which opens them as locations; `scripts/capture-live.ts` (plan 33-01) reads the precheck's exit status and its last line only. Under D-15's location-vs-spelling partition this is not a published-spelling defect. The script's three hard rules and its wording are untouched: `git diff --exit-code -- scripts/coordinator-resolution-precheck.ts` exits 0.

## Files Created/Modified

- `install/install.test.ts` - `canonicalPath`, `materializedKit`, `expectMaterializedKit`, `stageOldLayoutSymlinkAdapter`; the eight sites above
- `scripts/freshness.ts` / `scripts/freshness.js` - the compiler launch and the three refusal sentences
- `scripts/freshness.test.ts` - `transcript()` with stderr; Test 3's positive evidence
- `scripts/coordinator-resolution-precheck.test.ts` - stable anchor; Case 2b; `keptRun` / `keptHome`
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - the parity twin recorded; the `:2632` entry marked resolved

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two of the eight installer reds were `ln -s` fixtures that left a copy, not any of the plan's four named classes**
- **Found during:** Task 1 (reading the windows job log rather than RESEARCH's summary of it)
- **Issue:** `:996` and `:3095` asserted `isSymbolicLink()` over a link `spawnSync("ln", ["-s", …])` never made; the MSYS `ln` exits 0 and copies
- **Fix:** staged through `stageSymlinkOrSkip` (D-16) with a premise and a printed, counted skip row
- **Files modified:** install/install.test.ts
- **Verification:** 136 passed; all three arms driven with `FORCE_ABSENT`
- **Committed in:** fe5d7c0d

**2. [Rule 1 - Bug] The `:3380` red was the test wrapper's ESM import specifier, an empty stdout, not an exit-status or path class**
- **Found during:** Task 1
- **Issue:** `await import("D:\\a\\…\\install.js")` is refused as protocol `d:` before the installer loads; the test read only stdout
- **Fix:** `pathToFileURL(INSTALL_JS).href`; a premise that names the wrapper's stderr on failure
- **Files modified:** install/install.test.ts
- **Verification:** reproduced on darwin with a `D:\` string (`ERR_UNSUPPORTED_ESM_URL_SCHEME`, exit 1, empty stdout); case green
- **Committed in:** fe5d7c0d

**3. [Rule 1 - Bug, plan-directed] `scripts/freshness.ts` (+ committed `.js`) modified although the plan's `files_modified` lists only test files**
- **Found during:** Task 2, step three ("fix the layer the diagnosis named, and nothing else")
- **Issue:** the diagnosed layer is the gate's own compiler launch; a test-only change could make the failure name its layer but could not make the compiler run on Windows
- **Fix:** the launch through the resolved entry and `process.execPath`; the `.js` rebuilt with `npm run build` and freshness-checked
- **Files modified:** scripts/freshness.ts, scripts/freshness.js
- **Verification:** `npm run freshness` 69/69 on HEAD; the gate green with `npx` unreachable; both new refusal arms driven; full lane green
- **Committed in:** 8e19fb23

---

**Total deviations:** 3 auto-fixed (3 × Rule 1; one of them the plan's own step three reaching a file outside its list)
**Impact on plan:** All three close measured windows reds inside the plan's three clusters. No scope creep; no host branch; no package installed; the precheck script untouched.

## Issues Encountered

- RESEARCH's per-file class labels for `install/install.test.ts` ("8.3 short name, `KIT=…`, `'2.1.0\r'`, exit-code") named one class the file does not have (8.3) and missed two it does (`ln` copies, the ESM URL scheme). The log's Received text, not the class name, decided each fix.
- The `FORCE_ABSENT` drive printed nothing under the default reporter's `-t` filter on the first attempt; the rows are there under `--reporter=verbose` (three, one per arm).

## Deferred Issues

- `scripts/check-build-parity.ts:132` — the parity twin of the `npx` launch (ubuntu-only step, not this plan's file). Recorded in `deferred-items.md`.
- The fourteen pre-existing `if (process.platform === "win32") return;` silent skips on `install/install.test.ts`'s symlink cases — not measured reds, not in this plan's scope; the D-16 helper now in the file is the route.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema surface. T-33-29 (both streams forwarded; launch and locate named), T-33-30 (no contract adjusted; the `:2632` premise fixed, the contract asserted unchanged), T-33-31 (canonical both sides; the two classes told apart in the comment), T-33-32 (`git diff --exit-code` on the script exits 0), T-33-33 (no package installed) are as the register states.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-09's pushed run is the windows measurement for D4: the numbers to watch are `install/install.test.ts` (8 → 0, or SKIPPED symlink rows if the runner loses SeCreateSymbolicLink), `scripts/freshness.test.ts` (8 → 0 — and if a compile now RUNS there and refuses, the CI log carries the compiler's own diagnostic, which names the next layer), `scripts/coordinator-resolution-precheck.test.ts` (1 → 0).
- The CAP-02 gap round owns the parity twin and the fourteen silent win32 early returns if it wants them.

## Self-Check: PASSED

Files: 5/5 found. Commits: fe5d7c0d, 8e19fb23, ea95afdf found. SUMMARY carries no control byte.
