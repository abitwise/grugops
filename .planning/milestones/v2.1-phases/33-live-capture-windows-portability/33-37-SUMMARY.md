---
phase: 33-live-capture-windows-portability
plan: 37
subsystem: live capture instrument (scoped tool grant)
status: complete
tags: [capture-live, windows, gap-closure, round-4, permissions, tdd]
requires:
  - phase: 33-29
    provides: "liveAllowedTools and Test C7 (the scoped Edit(//ABS/**) grant)"
  - phase: 33-31
    provides: "run 35760655144 windows red on Test C7 (WINDOWS.md row 260) and the platform-reference quote in 33-CI-MEASUREMENT § 4.3"
provides:
  - "editAnchor(realPath, separator = sep) in scripts/capture-live.ts: the one authority for the text after // in the scoped Edit rule"
  - "liveAllowedTools spells Edit(//<editAnchor(real)>/**) and nothing else"
  - "Test C7 derives its expectation through editAnchor; Test C7b pins the documented win32 form from synthesised drive-letter inputs on any host"
affects: ["33-40 (the pushed CI run is the windows measurement for row 260)"]
tech-stack:
  added: []
  patterns:
    - "one anchor authority branched on PATH SHAPE (drive-letter prefix), never on the host platform; the separator is a parameter so the win32 form is asserted on any host"
    - "a test derives its expectation through the module's authority instead of re-assembling the path"
key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts
key-decisions:
  - "The win32 spelling of the scoped grant is //c/Users/... (drive letter lower-cased, colon dropped, backslashes to forward slashes). It comes from code.claude.com/docs/en/permissions 'Read and Edit', re-read via Context7 on 2026-09-23. Whether a live Windows session matches it stays UNKNOWN - verify in the docblock."
  - "editAnchor refuses paths the reference documents no anchor for: relative, drive-relative (C:foo), UNC (\\\\server\\share) and device-namespace (\\\\?\\, \\\\.\\). realpathSync.native on POSIX never produces these, so the darwin/linux grant is unchanged."
  - "The drive branch rewrites backslashes whatever separator is named, because a drive-letter path is a win32 spelling by shape. The POSIX branch uses only the named separator, so a backslash in a POSIX filename is kept."
requirements-addressed: [CAP-02]
requirements-completed: []  # CAP-02 is phase-level and still Pending; plan 33-40's pushed CI run measures the windows leg
actuals:
  tokens: 4130
  tasks: 2
  commits: 2
plan_head_before: 0451b612fc4fac1cbca5c427badb7195df1b8629
coverage:
  - id: D1
    description: "One exported Edit-anchor authority decides the scoped grant's spelling; POSIX output is byte-identical to the pre-33-37 formula; win32 drive paths become c/Users/..."
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C7b (the Edit-anchor authority)"
        status: pass
      - kind: other
        ref: "node check on this host: liveAllowedTools(tmp)[4] === the pre-33-37 formula -> true"
        status: pass
    human_judgment: false
  - id: D2
    description: "Test C7 derives its expectation through editAnchor instead of the /${anchored} round trip"
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C7 (the scoped grant, form-checked)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The windows-latest leg reads Test C7 green, and a live Windows session matches Edit(//c/Users/.../**)"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "Unmeasured locally, by construction: this darwin host cannot produce a drive-letter real path. Plan 33-40's pushed CI run measures the offline suite's windows leg. No Windows session measures the platform's live matcher; the docblock keeps that UNKNOWN - verify."
duration: 13min
completed: 2026-09-23
---

# Phase 33 Plan 37: The win32 Edit-anchor authority Summary

**The scoped `Edit(//.../**)` grant now gets its spelling from one function, `editAnchor`. A win32 drive path `C:\Users\...` is published as the documented `//c/Users/...`, POSIX paths keep their exact old spelling, and Test C7 derives its expectation through the same function. The windows red in WINDOWS.md row 260 came from a comparator premise that only holds on POSIX, and that premise is gone.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-23T20:26:03Z
- **Completed:** 2026-09-23T20:39:00Z
- **Tasks:** 2 (Task 2 needed no code change; see below)
- **Files modified:** 3

## Accomplishments

- `editAnchor(realPath, separator = sep)` is exported from `scripts/capture-live.ts`. It branches on path shape (`^[A-Za-z]:[\\/]`) and never on the host platform. `grep -c 'process.platform\|os.platform()' scripts/capture-live.ts` gives 0 on the base and 0 on HEAD.
- `liveAllowedTools` builds `Edit(//${editAnchor(real)}/**)` from the authority only.
- The docblock gives the decided win32 form and its source, the permissions reference, quoted. It keeps the live matcher `UNKNOWN - verify` and names plan 33-40's windows leg as the measurement.
- On darwin the grant is byte-identical to the old one. Measured: `Edit(//private/var/folders/y3/.../T/g37-VviVJF/**)`, `byte-identical to pre-33-37 formula: true`.

## Task Commits

1. **Task 1: one win32 anchor authority; Test C7 derives through it.** `2991df16` (test, RED), then `d885c7b7` (feat, GREEN, with the rebuilt twin).
2. **Task 2: suite and blast radius.** No commit. The grep found no remaining hand-assembled anchor comparison (below), so no file changed.

## RED before the fix (quoted)

`npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts -t "Test C7"` against the committed module:

- Test C7: `AssertionError: the Edit-anchor authority is exported from the module that publishes the rule: expected 'undefined' to be 'function'`
- Test C7b: `AssertionError: the Edit-anchor authority is exported: expected 'undefined' to be 'function'`
- `Tests  2 failed | 67 skipped (69)`

`check tdd-red-evidence` on the TAP record (`-t 'Test C7b' --reporter=tap-flat`, exit 1): `"verdict": "RED_EVIDENCE_OK"`, `"reason": "target_test_failed"`, `tests 69 / pass 68 / fail 1`.

## GREEN and gates (quoted)

- `npx tsc --noEmit`: exit 0. `npm run build`, then `npm run check:build-parity` with the twin staged: `ALL CHECKS PASSED`.
- `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts`: `Test Files  1 passed (1)`, `Tests  69 passed (69)`.
- Mutation check. The suite imports the compiled `scripts/capture-live.js`, so the mutations were applied to the `.js`. Four mutations each turned C7b red with `Tests  1 failed | 1 passed | 67 skipped (69)`: keep the colon, keep the upper-case letter, drop the drive branch, drop the `//` refusal. The file was restored afterwards.
- Full excluded-lane suite, `npx vitest run --exclude '**/scripts/e2e/**'`: `Test Files  78 passed (78)`, `Tests  5764 passed | 2 skipped (5766)`, `Duration  540.72s`, exit 0. The 4 `FAIL` strings in the log are stderr text from checks that tests exercise on purpose. No test file failed.
- `npm run typecheck`: exit 0. `npm run check:nul-bytes`: `ALL CHECKS PASSED`. `npm run freshness:hook-manifest`: `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.`

## Task 2: the grep for independent anchor statements

`grep -n 'replace(/\^\\/+/\|`/\${\|Edit(//\|split(sep)' scripts/capture-live.test.ts` returned:
- C7 (:1252): now `toBe(\`Edit(//${editAnchor(real)}/**)\`)`, derived through the authority.
- C7 entry-shape regex (:1267) and the dry-run tool-grant row (:1977): these check shape only (`Edit\(\/\/.+\/\*\*\)`). They state no anchor text, so both forms pass them.
- C7b (:1294-1300): the authority's own unit cases. The plan requires these literals.

No other test file references `liveAllowedTools` or `Edit(//`. The unused `sep` import in the test was dropped in the RED commit.

## The axis this host cannot reach

The win32 axis stays **unmeasured locally, by construction**. This darwin host cannot produce a drive-letter real path, so C7 exercises only the POSIX branch here. C7b states the win32 form from synthesised inputs, and that proves the spelling the module publishes. **Plan 33-40's windows leg is the measurement** for WINDOWS.md row 260. This plan does not dispose of that row. Separately, no Windows session has run the instrument, so whether the platform's live matcher accepts `Edit(//c/Users/.../**)` is `UNKNOWN - verify`, as the docblock says.

## Files Created/Modified

- `scripts/capture-live.ts`: `editAnchor` added with its docblock. `liveAllowedTools` now points at it. The fact-2 docblock line now points at the authority instead of carrying the bare UNKNOWN sentence.
- `scripts/capture-live.js`: the committed build of the above.
- `scripts/capture-live.test.ts`: C7 derives through `editAnchor`. New C7b covers the POSIX, win32, mixed-separator and refusal cases. The `sep` import was dropped.

## Decisions Made

See `key-decisions` in the frontmatter. In short: the documented `//c/...` form, refusal of undocumented shapes, and a shape-based branch instead of a platform branch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Undocumented path shapes are refused rather than spelled**
- **Found during:** Task 1 (GREEN)
- **Issue:** The plan's authority falls back to "strip leading slashes" for any path without a drive letter. That would publish a relative path, a drive-relative `C:foo`, a UNC share or a `\\?\` device path as an absolute `Edit(//...)` rule, a spelling the reference does not document. On a safety surface that is a guess.
- **Fix:** `editAnchor` throws `capture-live.editAnchor: refusing ...` for anything that is not POSIX-absolute (single leading `/`) or drive-absolute. C7b asserts all five refusals.
- **Files modified:** scripts/capture-live.ts, scripts/capture-live.js, scripts/capture-live.test.ts
- **Verification:** C7b green. A mutation that drops the `//` refusal turns C7b red. The darwin grant is unchanged, because POSIX `realpathSync.native` output always has exactly one leading slash.
- **Committed in:** d885c7b7

**2. [Rule 3 - Blocking] The authority takes a `separator` parameter**
- **Found during:** Task 1 (RED design)
- **Issue:** On a POSIX host, `toPosix` is the identity, so the POSIX branch's behaviour on a `\`-bearing path (kept) versus a win32 host (rewritten) could not be asserted host-independently.
- **Fix:** `editAnchor(realPath, separator = sep)`, following `posix-path.toPosixWith`. Production calls it with the host default.
- **Committed in:** d885c7b7

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both stay inside the one authority. There is no scope creep and no platform conditional.

## Issues Encountered

- Mutating the `.ts` first left C7b green, because the suite imports the compiled `.js`. Re-running the mutations against the `.js` turned C7b red as expected. The RED run was valid for the same reason: the committed `.js` had no `editAnchor`.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Ready for 33-38. Plan 33-40's pushed run measures the windows leg for row 260.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-23*

## Self-Check: PASSED
