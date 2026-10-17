---
phase: 31-autonomous-manual-testing
plan: 02
subsystem: testing
tags: [typescript-ast, playwright, uat, runnable, loud-skip, vacuity-floor, mutation-testing]

requires:
  - phase: 16-test-integrity
    provides: the materialized-runnable contract (exit 0/1/2) and the RUNNABLES install path
  - phase: 19-uat-live
    provides: the exported-marker + injectable fail-closed probe + single-emission-point loud-skip idiom
  - phase: 29-language-guards
    provides: scripts/vacuity.ts reportMeasured — the four ordered branches this runnable reimplements
provides:
  - a node:-builtins-only UAT spec-integrity checker resolving typescript from the TARGET repository
  - BANNED_CONSTRUCTS — the single D-14 arm (c) set the Plan 03 recipe will quote
  - PARSER_ABSENT_MARKER and BROWSER_ABSENT_MARKER + BROWSER_ABSENT_STAGES — the two D-15/D-13 loud skips
  - UAT_SPEC_GLOB_SUFFIX and SKIPPED_DIRECTORIES — the D-05 recognition key and the walker input boundary
  - a five-file *.uat.spec.ts fixture corpus with a mutation harness proving per-arm discrimination
  - tools/grugops/uat-spec-integrity.js as a materialized, removable install artifact
affects: [31-03 browser-uat-recipe, 31-04 chrome-lane, 05-pr-quality-gate wiring]

actuals:
  tokens: 27520
  tasks: 3
  commits: 6
plan_head_before: d12f3f497fe78b90bb47537924d8fb4d43541002
# commits MEASURED with `git rev-list --count d12f3f4..HEAD` including this SUMMARY's own docs
# commit (5 production + 1 docs), so re-running the same command reproduces the same number.
# tokens is chars/4 over `git diff d12f3f4..HEAD` (110079 chars) — the estimate's scale, not a
# harness token count. The plan estimated 76000; the realized diff is 2.8x smaller.

tech-stack:
  added: []
  patterns:
    - "Parser-from-target via createRequire: a library a runnable needs is resolved from the host repo, never shipped"
    - "Fail-towards-running entry-point guard: an inconclusive is-this-the-entrypoint answer runs main(), because a silent exit 0 is the fabricated green"
    - "Marked-region mutation harness: a fixture marks its banned construct and nothing else; deleting exactly those lines must clear the finding"

key-files:
  created:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - scripts/runnable-ref/fixtures/clean.uat.spec.ts
    - scripts/runnable-ref/fixtures/caught-assertion.uat.spec.ts
    - scripts/runnable-ref/fixtures/conditional-assertion.uat.spec.ts
    - scripts/runnable-ref/fixtures/modifier-call.uat.spec.ts
    - scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts
  modified:
    - install/install.ts
    - install/uninstall.ts
    - install/install.test.ts
    - scripts/check-foundation-guards.test.ts
    - tsconfig.json
    - tsconfig.tests.json
    - vitest.config.ts

key-decisions:
  - "The browser probe is opt-in behind --check-browser; the AST check never depends on a browser"
  - "The five *.uat.spec.ts fixtures are a parse corpus: excluded from tsc and vitest, but COUNTED in the foundation guards' module corpus"
  - "Stage 2 resolves the Playwright browsers directory from PLAYWRIGHT_BROWSERS_PATH or the platform cache, because `playwright --version` does not report one"
  - "The module is exported functions plus a fail-towards-running main() guard, so the injectables the plan requires are reachable by test rather than only present in source"

patterns-established:
  - "Two containment predicates, not one: a path the walk BUILT is compared against the lexical root, a path realpathSync RETURNED against the expanded root"
  - "Deliberate exclusions are written down beside the closed set they are excluded from, named as deferred with the reason"

requirements-completed: [UATX-06]

coverage:
  - id: D1
    description: "The runnable honours the exit 0 / 1 / 2 contract and derives its spec set from the .uat.spec.ts suffix under a uat/ path segment"
    requirement: "UATX-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#exits 0 on a clean uat spec and reports the derived count on the pass line"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#requires both the uat path segment and the suffix"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#derives the spec set in sorted repo-relative order"
        status: pass
    human_judgment: false
  - id: D2
    description: "All three D-14 arms are decided over the TypeScript AST and reported as a union, and each finding is proven by mutation to be caused by the construct it names"
    requirement: "UATX-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses an expect inside a try block and an assert inside a catch clause"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#refuses an expect under an if, an else, a conditional expression, each logical operand and an optional call"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#reports findings from ALL THREE arms on the union fixture, not only the first arm reached"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#mutation: <fixture> is accepted once its banned constructs, and only those, are removed (3 cases)"
        status: pass
      - kind: other
        ref: "adversarial mutation of the implementation: 6 mutants, 6 killed (transcript in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An unresolvable parser or an unusable browser lane produces a distinctly-marked loud skip at exit 2, so the UAT stays pending"
    requirement: "UATX-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#exits 2 with the parser-absent marker when typescript cannot be resolved from the target"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#stage 1 unavailable emits the marker plus the stage-1 clause byte-for-byte and returns false"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#stage 2 unavailable emits the marker plus the stage-2 clause byte-for-byte and returns false"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#--check-browser exits 2 with the stage-1 clause when @playwright/test is absent from the target"
        status: pass
    human_judgment: false
  - id: D4
    description: "A vacuous or short scan cannot print a pass line; both sides of the walker's input boundary are tested"
    requirement: "UATX-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a stubbed-out loop (visited 0 of a non-empty derived set) exits 2 rather than passing"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#forcing the reader to throw on one file yields visited < expected and exit code 2 naming both numbers"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#does not count a uat spec planted under node_modules"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#counts a uat spec in a legitimate deeply nested uat directory"
        status: pass
    human_judgment: false
  - id: D5
    description: "The runnable is materialized into a host repo and removable again through the mirrored RUNNABLES pair"
    verification:
      - kind: integration
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false
  - id: D6
    description: "The stage-2 browser-binaries probe against a real Playwright installation (a machine that has @playwright/test and downloaded browsers)"
    verification: []
    human_judgment: true
    rationale: "No host in reach has @playwright/test installed, so stage 2 has only ever been exercised through the injected probe and its fail-closed catch. The directory-resolution half (PLAYWRIGHT_BROWSERS_PATH, the per-platform cache paths) is UNKNOWN - verify against a real installation, and the Windows leg is unverified per the standing WINDOWS.md posture."

duration: 35 min
completed: 2026-09-07
status: complete
---

# Phase 31 Plan 02: UAT Spec-Integrity Runnable Summary

**A node:-builtins-only `tools/grugops/uat-spec-integrity.js` that derives the `*.uat.spec.ts` set, parses each one with the target repository's own `typescript`, refuses D-14's three arms of caught and conditional assertions over the AST, and loud-skips at exit 2 with a distinct marker whenever the parser or the browser lane is unusable.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-07T11:52:00Z
- **Completed:** 2026-09-07T12:27:00Z
- **Tasks:** 3
- **Files modified:** 17 (8 created, 9 modified)

## Accomplishments

- The ban is decided over the TypeScript AST, never by regex. The adversarial clean fixture carries an `if`, a `try`, a `finally`, a comment naming a banned member and a string literal shaped like an assertion, and is accepted at exit 0 — a textual matcher fails that fixture.
- All three D-14 arms report as a **union**: the union fixture yields three findings, one per arm, not the first arm reached.
- Each per-arm finding is **mutation-proven**: every fixture marks its banned construct and nothing else, and deleting exactly those lines clears the finding while the try/catch/finally, the if/else and the straight-line assertions survive.
- Both loud skips are single-emission frozen constants asserted byte-for-byte through an injected failing probe, and both exit 2 — never 0, never 1.
- The vacuity and short-set floors are **reachable by test**, not merely present: an injected throwing reader forces `visited < expected` and the run exits 2 naming both numbers.
- The runnable is materialized and removable through the mirrored `RUNNABLES` / `RUNNABLES_MIRROR` pair, edited together.

## Task Commits

1. **Task 1 RED: failing contract tests and fixtures** — `6c2c9dc` (test)
2. **Task 1 GREEN: the runnable and its materialization** — `1a28c6a` (feat)
3. **Task 2: arms (a) and (b), union and mutation proofs** — `3bf132b` (test)
4. **Task 3: the vacuity and short-set floors, and the walker boundary** — `201f1fd` (test)
5. **Derived-set pins moved for the new runnable and its corpus** — `803fc43` (fix)

**Plan metadata:** see the `docs(31-02)` commit that carries this file.

## Files Created/Modified

- `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` — the checker: derivation, containment, parser-from-target, the three-arm AST walk, the two loud skips, the four-branch reporter.
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — 32 cases: spawnSync against the committed `.js` for the exit-code contract, plus direct imports of that same `.js` for the injectable probe and reader.
- `scripts/runnable-ref/fixtures/*.uat.spec.ts` (5) — the parse corpus: one adversarial clean, one per arm, one union.
- `install/install.ts`, `install/uninstall.ts` — one `RUNNABLES` row each, added together.
- `install/install.test.ts` — runnable cardinality pin 2 → 3.
- `scripts/check-foundation-guards.test.ts` — `NON_TEST_MODULE_COUNT` 60 → 66.
- `tsconfig.json`, `tsconfig.tests.json`, `vitest.config.ts` — exclude the fixture corpus from compilation and test collection.

## Decisions Made

- **The browser probe is opt-in behind `--check-browser`.** The AST check reads spec *source* and needs no browser. Probing unconditionally would make every repository without Playwright exit 2, putting the pass path out of reach and training a reader to ignore exit 2. Either way an unusable lane is exit 2 and never exit 0.
- **The module is exported functions plus a `main()` guarded by a fail-towards-running entry-point check.** The plan requires an injectable probe and an injectable reader that a test can actually reach; a straight top-level script cannot be imported without executing. The guard **fails towards running**: an inconclusive answer runs `main()`, because failing to run when invoked as a CLI would exit 0 with no output — the fabricated green this file exists to prevent.
- **The fixtures are excluded from `tsc` and `vitest` but counted in the guards' module corpus.** The two are not inconsistent: the guards' walk is pinned equal to `git ls-files '*.ts'`, so narrowing it would mean two edits to one predicate's input — the drift shape D-24 exists to prevent. Leaving them in only widens a scan, which is the fail-safe direction.
- **Findings are keyed on the callee's head identifier node.** `expect(x)` and `expect(x).toBe(y)` share one `expect` identifier, so one assertion yields one finding rather than one per link in the chain.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The fixture corpus broke both `tsc` and `vitest` before it could be used**

- **Found during:** Task 1 (before writing the RED test)
- **Issue:** Measured, not assumed: `tsc --noEmit --listFiles` picked up a probe `*.uat.spec.ts` fixture and reported `TS2307: Cannot find module '@playwright/test'`, and `vitest list` collected it as a test file (Vitest's default include is `**/*.spec.ts`). The plan mandates both the fixture location and the `.uat.spec.ts` naming, so neither could be changed away from the collision.
- **Fix:** Excluded `scripts/runnable-ref/fixtures/**` from `tsconfig.json`, `tsconfig.tests.json` and (spreading `configDefaults.exclude`, not replacing it) `vitest.config.ts`, each with the reason recorded in place.
- **Files modified:** `tsconfig.json`, `tsconfig.tests.json`, `vitest.config.ts`
- **Verification:** `npm run typecheck` and the full suite green; the fixtures are neither compiled nor collected.
- **Committed in:** `6c2c9dc`

**2. [Rule 1 - Bug] The containment check refused every path on macOS**

- **Found during:** Task 1 (caught by the RED tests going the wrong colour)
- **Issue:** `deriveSpecPaths` compared a lexically-built path against a `realpathSync`-expanded root. Under a temp root at `/var/folders/...` (which expands to `/private/var/folders/...`) every collected spec "escaped" the root, so a target with a perfectly ordinary spec exited 2 with a containment refusal instead of checking it. In a host repository reached through any symlinked path this would have refused the whole scan.
- **Fix:** Two named predicates — `containedLexically` against the resolved root for paths the walk builds, `containedReal` against the expanded root for paths `realpathSync` returns — with the reason recorded beside them.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`
- **Verification:** the pass, finding, `--json` and host-emulation cases all moved from exit 2 to their asserted statuses.
- **Committed in:** `1a28c6a`

**3. [Rule 1 - Bug] The mutation harness deleted the fixtures' imports**

- **Found during:** Task 2
- **Issue:** The harness matched its region markers with `includes`, which also matched the fixture *header's prose description* of those markers. That opened a region at the top of the file and silently deleted the imports; the mutated file then produced four parse diagnostics and an exit 2 that read as a checker defect rather than a harness defect.
- **Fix:** A marker is recognised only as a comment line that *opens* with it. The prose mention no longer matches, and the harness additionally refuses a fixture with zero regions or an unterminated region rather than silently mutating nothing.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.test.ts`
- **Verification:** all three mutation cases pass; a fixture with no marked region now fails loudly (this is what surfaced the missing region in `modifier-call.uat.spec.ts`).
- **Committed in:** `3bf132b`

**4. [Rule 2 - Missing Critical] `playwright --version` does not report a browsers directory**

- **Found during:** Task 1
- **Issue:** The plan's stage 2 says to run `npx playwright --version` and "check that the browsers directory it reports exists and is non-empty". The command reports a version and no directory, so the check as written could not be implemented and would have been quietly dropped.
- **Fix:** Stage 2 requires the CLI to exit 0 *and* resolves the browsers directory from `PLAYWRIGHT_BROWSERS_PATH` when set, otherwise from the documented per-platform cache location, then checks it exists and is non-empty. The divergence from the plan text is recorded in the source beside the probe.
- **Files modified:** `scripts/runnable-ref/uat-spec-integrity.ts`
- **Verification:** the stage-2 clause is asserted byte-for-byte through the injected probe; the real directory-resolution half is flagged `UNKNOWN - verify` (see Known Stubs).
- **Committed in:** `1a28c6a`

**5. [Rule 3 - Blocking] Two derived-set pins went red on the new files**

- **Found during:** plan-level verification (full suite)
- **Issue:** `install.test.ts` pins the runnable-mapping cardinality at 2 on purpose ("a pair that shrinks together still fails"), and `check-foundation-guards.test.ts` pins `NON_TEST_MODULE_COUNT` at 60. The new runnable plus the five fixture files moved the latter by six.
- **Fix:** Both pins moved explicitly, each with the files named and the reasoning recorded — including why the fixtures are counted rather than excluded.
- **Files modified:** `install/install.test.ts`, `scripts/check-foundation-guards.test.ts`
- **Verification:** `install.test.ts` 131 passed, `check-foundation-guards.test.ts` 268 passed, `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`.
- **Committed in:** `803fc43`

**6. [Scope note, not a defect] Arms (a) and (b) landed in Task 1 rather than Task 2**

- The plan assigned arm (c) to Task 1 and arms (a)/(b) to Task 2. The context-walk that decides arm (a) is the same walk that decides arm (b), and splitting it would have meant writing it twice. Task 2 therefore contributed the fixtures, the union proof, the mutation proofs and the boundary case rather than new detection code. Discrimination is proven by mutation (below), which is a stronger claim than RED-first ordering would have made.

---

**Total deviations:** 5 auto-fixed (2 bugs, 1 missing critical, 2 blocking) + 1 scope note.
**Impact on plan:** every fix was necessary for the plan's own criteria to be reachable or correct. No scope creep: no dependency added, no `package.json` change, no new config key.

## Adversarial verification (a green suite is not proof)

Per this repository's standing rule, the implementation was mutated and the suite re-run. **Six mutants, six killed**, each reverted with `git checkout` and rebuilt afterwards:

| Mutant | What it defeats | Result |
|---|---|---|
| `visited++` → `visited = specRelPaths.length` | the short-set floor | 1 failed / 31 passed |
| vacuity branch returns 0 instead of 2 | the zero-element floor | 4 failed / 28 passed |
| arm (a) catch-clause test → tryBlock | caught assertions in a `catch` | 2 failed / 30 passed |
| `hasUatSegment` always true | the D-05 recognition key | 2 failed / 30 passed |
| optional-call detection returns null | arm (b) optional call | 1 failed / 31 passed |
| truncate findings to the first one | the union-of-arms guarantee | 3 failed / 29 passed |
| *(control, unmutated)* | — | **32 passed** |

What this does **not** prove: that the ban set is complete. `.catch()` handlers, `finally` blocks and zero-`expect` bodies are outside D-14's locked set by decision, are written down as deferred beside `BANNED_CONSTRUCTS`, and are pinned by a test asserting they are **not** refused — so a future widening has to move a visible assertion rather than slip through.

## Issues Encountered

- **`gsd_run check tdd-red-evidence` cannot classify this repository's runner.** The verb parses `node --test` TAP summary lines (`# tests`, `# pass`, `# fail`); Vitest's TAP reporter emits none of them, so the RED record returned `INVALID_RED (zero_tests_discovered)` against a run that genuinely discovered 15 tests. Synthesizing those summary lines would have been fabricating a gate input, so it was not done. The RED gate is therefore recorded as **`UNKNOWN - verify` at the tooling level and satisfied manually**: the captured transcript shows 15 tests discovered and the target case failing on an assertion for the planned behaviour (`expected 1 to be +0` at `uat-spec-integrity.test.ts:103`), which is what #3770 asks for.
- **Commits were made on `main`.** The executor's generic pre-commit guard reports `main` as protected and there is no `git.allow_default_branch_commits` key. This project is configured `branching_strategy: "none"` and `use_worktrees: false`, the dispatch explicitly placed this executor on `main`, and every prior phase commit is on `main`. Proceeding was the assigned task; the config was **not** edited to self-authorize.

## Known Stubs

| Stub | File | Reason |
|---|---|---|
| Stage-2 browsers-directory resolution is unexercised against a real Playwright installation | `scripts/runnable-ref/uat-spec-integrity.ts` (`playwrightBrowsersDirectory`) | No reachable host has `@playwright/test` installed. Stage 2 is proven only through the injected probe and its fail-closed catch. Marked `UNKNOWN - verify`; the Windows leg is unverified per the standing WINDOWS.md posture. It is fail-closed by construction: any inconclusive answer returns the stage and exits 2. |

Nothing here blocks the plan's goal — a skip is the honest outcome and leaves the UAT `pending`, which is the requirement.

## User Setup Required

None — no external service configuration required. `package.json` gained no dependency and the runnable ships zero imports outside `node:` builtins.

## Next Phase Readiness

- **Ready for 31-03.** `BANNED_CONSTRUCTS`, `PARSER_ABSENT_MARKER`, `BROWSER_ABSENT_MARKER` and `BROWSER_ABSENT_STAGES` are exported constants the browser-UAT recipe can quote so the documented claim and the decided set share one source.
- **For whoever wires workflow 05:** invoke as `node tools/grugops/uat-spec-integrity.js <repo-root>` **before** the e2e lane (RESEARCH Pitfall 5 — this checker consumes no run output). Add `--check-browser` only at the point the gate is about to run the specs.
- **UATX-05 is not yet marked complete** — a sibling plan in this phase also declares it, and the shared-ID gate correctly holds it until that plan finishes. UATX-06 is marked complete.
- **Carry-forward:** the stage-2 residual above, and the `tdd-red-evidence`/Vitest runner mismatch, which affects every TDD plan in this repository and is not specific to this one.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-07*

## Self-Check: PASSED

- All 8 files listed under `key-files.created` exist on disk (`[ -f ]`, 8/8 FOUND).
- All 6 commits resolve in `git log --all` (`6c2c9dc`, `1a28c6a`, `3bf132b`, `201f1fd`, `803fc43`, `91bd94f`).
- `git rev-list --count d12f3f4..HEAD` = 6, matching the recorded `actuals.commits`.
- Plan `<verification>` re-run at close-out: suite 3182 passed / 2 skipped over 60 files; `npm run build`, `npm run typecheck`, `npm run check:build-parity`, `npm run freshness` (60 committed `.js` fresh) and `node scripts/check-foundation-guards.js` (`ALL CHECKS PASSED`) all exit 0. Bare `npm test` was never run.
