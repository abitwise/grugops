---
phase: 44-upstream-source-declaration-and-pin-check
plan: 11
subsystem: upstream-reader
tags: [upstream, runnable-version-skew, wr-03, trc-02, d-13, d-14, typescript, vitest]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: "Plan 44-10: positional manifest reasons and the upstream.ts generated region this plan regenerates"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "Plan 37-24: state-check's sibling-stamp rule (runnableSkewFindings) and scripts/runnable-stamp.ts readRunnableStamp"
provides:
  - "upstream.js check prints one `runnable-version-skew <program>: <reason>; remove … and install them again together` line per sibling program from another build, after the source lines"
  - "The EMBED_SPECS upstream.ts row embeds entryPresence and readRunnableStamp"
  - "The `version skew` describe: every skew branch, the exit-code rule, the none-declared line and read's unchanged output"
affects: [44-12, 44-13, 44-14, workflow-17, install-upgrade]

actuals:
  tokens: 12900
  tasks: 2
  commits: 4
plan_head_before: 4c1e7c6d25b6f24bf07ecbbbb022b8a96b9174fd
plan_head_after: 92f5e8ce7eaf754e51cd5b966377699689a0d285

tech-stack:
  added: []
  patterns:
    - "A host runnable that cannot see a sibling's age checks the sibling's build stamp itself, by the one embedded rule (readRunnableStamp), and only reports"

key-files:
  created:
    - .planning/phases/44-upstream-source-declaration-and-pin-check/deferred-items.md
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.js
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js

key-decisions:
  - "44-11: upstream.js check reports each RUNNABLE_SET sibling whose stamp differs, is missing or appears more than once as a stdout `runnable-version-skew` line after the source lines; the exit code stays the pin decision (D-13), and read never prints the line (WR-03, TRC-02)"
  - "44-11: an unreadable sibling's reason carries only the errno code (and a fixed phrase for a dangling link), never entryPresence's reason text, which holds a filesystem path"

patterns-established:
  - "Every skew line ends in the same remedy, naming the whole RUNNABLE_SET; nothing is overwritten or removed to resolve it"

requirements-completed: [TRC-02]

coverage:
  - id: D1
    description: "A trace-render.js whose stamp differs, beside the committed upstream.js, gives `match design <commit>` then one runnable-version-skew line naming both stamps and the reinstall remedy, exit 0; the sibling's bytes and every watched tree are unchanged; the committed trace-render.js copied unchanged gives no line"
    requirement: "TRC-02"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#version skew: a trace-render.js whose stamp differs prints one runnable-version-skew line after the source line, exit 0, and the sibling is unchanged"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#version skew: the committed trace-render.js copied unchanged beside upstream.js prints no skew line (control)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every other branch: no stamp, two stamps, two skewed siblings in RUNNABLE_SET order beside a same-stamp one, a directory, a FIFO in bounded time and a dangling link, each one line naming the program"
    requirement: "TRC-02"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts -t \"version skew\" (11 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A skew line never moves the exit code (drift stays 1, UNKNOWN stays 2), never appears with no declaration, and never changes `read` output"
    requirement: "TRC-02"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#version skew: with a skewed sibling, a drifting source still exits 1 and an UNKNOWN source still exits 2"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#version skew: `read design DEC-1` prints the same bytes with and without a skewed sibling"
        status: pass
    human_judgment: false
  - id: D4
    description: "The config read fault still lands at the config read with a second caller of readRegularFileOrNull"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts -t \"config read\" (3 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Committed .js and every generated runnable region are fresh; typecheck, the foundation guard script and the stamp, exit-contract, state-check, trace-render and install upstream suites pass"
    verification:
      - kind: other
        ref: "npm run freshness && npm run freshness:runnable-embeds && npm run typecheck && node scripts/check-foundation-guards.js"
        status: pass
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/runnable-ref/trace-render.test.ts (491 passed) and install/install.test.ts -t upstream (3 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Whether TRC-02 needs a further edge beyond the upgrade skew (plan flagged assumption A1, the unclassified probe item)"
    requirement: "TRC-02"
    verification: []
    human_judgment: true
    rationale: "The plan leaves the unclassified TRC-02 probe item unresolved on purpose; a human reviewer decides whether another edge is needed"

duration: 11min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 11: upstream.js reports sibling programs from another build (WR-03) Summary

**`upstream.js check` now compares the build stamp of each sibling program in RUNNABLE_SET with its own, by state-check's rule. For each sibling from another build it prints one `runnable-version-skew <program>: <reason>; remove claim.js, note.js, state-check.js, state-roll.js, trace-render.js and upstream.js and install them again together` line after the source lines. An upgraded install whose older trace-render.js drops `upstream:` refs is therefore named at every session-start check, without touching the file and without changing the exit code.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-11-25T14:42:04Z
- **Completed:** 2026-11-25T14:53:09Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto; both TDD)
- **Files modified:** 15 (4 authored, 11 regenerated or rebuilt), plus deferred-items.md

## Accomplishments

- WR-03 closed for the case the review names. With a trace-render.js whose stamp line carries 64 zeros beside the committed upstream.js, `check` on a matching source prints `match design <commit>`, then `runnable-version-skew trace-render.js: it was built from different authorities (stamp sha256:000…0) than upstream.js (stamp sha256:<upstream>); remove … and install them again together`, at exit 0. The sibling's bytes, the host directory, the product and the upstream checkout are byte-identical before and after.
- The rule is state-check's, not a second one. entryPresence decides absence, the embedded non-blocking readRegularFileOrNull reads under a 16 MiB ceiling, and readRunnableStamp classifies the result as the same stamp, none, ambiguous or different. The EMBED_SPECS upstream.ts row gains `entryPresence` and a last authority, `scripts/runnable-stamp.ts` / `readRunnableStamp`. EMBED_SPEC_COUNT stays 7. RUNNABLE_SET_STAMP moved in all six runnables.
- Every branch is pinned: no stamp, two stamps, two skewed siblings in RUNNABLE_SET order beside a same-stamp one, a directory named state-check.js, a FIFO named note.js (ends within 15 s), and a dangling link named state-roll.js. Each gives exactly one line.
- The exit code is proven independent of skew lines. A drifting source still exits 1 and an UNKNOWN source still exits 2, with the skew line last. With no declaration, stdout is exactly `no upstream sources declared`. `read design DEC-1` gives byte-identical stdout, stderr and status with and without a skewed sibling.
- The `config read` fault case still injects its EIO at the config read. Its PREMISE now names both callers of readRegularFileOrNull (`configTextOrNull`, `siblingSkewLines`) and picks the config call by its scope.
- The upstream.ts header's D-13 check contract now states the skew line: its text, its place after the source lines, that it appears only when sources are declared, that `read` never prints it, and that it never changes the exit code.

## Task Commits

1. **Task 1 (tracer): a trace-render.js from another build, end to end**
   - RED: `1eba8456` (test): the `version skew` describe, its host-directory helper, the stale-stamp case and the same-stamp control
   - GREEN: `cf3c11fb` (feat): EMBED_SPECS row, siblingSkewLines, checkReport, config-read PREMISE, regenerated embeds
   - Tracer gate (interactive, `end-of-phase`, automated-only verify): the verify was re-run and passed (version skew 2/2, config read 3/3, the generator, exit-contract and state-check suites 271/271, freshness, runnable-embeds freshness and typecheck exit 0). Task 2 went ahead.
2. **Task 2: every skew branch, the exit-code rule and the header contract**
   - Tests: `b7a674a6` (test): nine more `version skew` cases
   - Header: `92f5e8ce` (docs): the skew line in the D-13 check contract, upstream.js rebuilt

No REFACTOR commit was needed. The plan metadata commit follows this SUMMARY.

## RED evidence

**Task 1, against the upstream.js plan 44-10 committed** (`npx vitest run scripts/runnable-ref/upstream.test.ts -t "version skew"`, exit 1, 1 failed, 1 passed, 82 skipped):

```
× version skew: a trace-render.js whose stamp differs prints one runnable-version-skew line after the source line, exit 0, and the sibling is unchanged
AssertionError: status 0
- Expected
+ Received
- match design 0a25cf18e5d49c025c22469c235991c47e39d96f
- runnable-version-skew trace-render.js: it was built from different authorities (stamp sha256:0000000000000000000000000000000000000000000000000000000000000000) than upstream.js (stamp sha256:e920f63cfc17a648b0859a9e161bcaebb17dc66dbd1e2922e556283c2823c3dd); remove claim.js, note.js, state-check.js, state-roll.js, trace-render.js and upstream.js and install them again together
+ match design 0a25cf18e5d49c025c22469c235991c47e39d96f
Tests  1 failed | 1 passed | 82 skipped (84)
```

The same run with `--reporter=tap-flat` reports `not ok 83` for the target test, and only that test fails. `gsd_run check tdd-red-evidence` returned `INVALID_RED` / `invalid_record` with `report_errors: ["Non-TAP data in report", "Malformed TAP"]`. This is the same classifier limit on Vitest's multi-line YAML failure block that 44-09 and 44-10 recorded. Its own evidence names one failing test, the target (`fail: 1`, `failing_tests` = the target).

**Semantic assessment:** the target test ran, and it failed on the planned stdout assertion. The program printed exactly `match design <commit>` and no skew line. The control case passed in the same run, so the fixture, the host directory and the matching source were all sound. The only missing behavior was the skew line. No setup, import, syntax or unrelated failure was involved. The classifier's rejection is a report-format limit, not a different failure, and it was not used to authorize GREEN on its own; the transcript above is the evidence.

**Task 2:** the nine new cases passed at first run, because Task 1 had already delivered every branch of siblingSkewLines. They pin the behavior (the plan's step "if a case shows siblingSkewLines missing a branch, fix it" found nothing to fix). Task 1's RED shows the describe tells a program without the check from one with it.

## Files Created/Modified

- `scripts/generate-runnable-embeds.ts` - the upstream.ts row gains `entryPresence` and the `scripts/runnable-stamp.ts` authority; a dated header line (plan 44-11)
- `scripts/runnable-ref/upstream.ts` - SIBLING_CEILING_BYTES, `listed`, `siblingSkewLines`, checkReport appends the lines; header contract; regenerated region
- `scripts/runnable-ref/upstream.test.ts` - the `version skew` describe (11 cases) and the updated `config read` PREMISE
- `scripts/generate-runnable-embeds.js`, `scripts/runnable-ref/upstream.js` and the claim, note, state-check, state-roll and trace-render `.ts`/`.js` pairs - regenerated by `npm run generate:runnable-embeds` (new RUNNABLE_SET_STAMP), not hand-edited
- `.planning/phases/44-upstream-source-declaration-and-pin-check/deferred-items.md` - one out-of-scope guard failure from plan 44-10

## Decisions Made

- The skew line goes to stdout at an unchanged exit code, as the plan's assumption A2 sets out. Workflow 17 step 4 reports each printed line, and exit 2 would block every upstream-reading subtask over a trace-tooling mismatch.
- An unreadable sibling's reason names only the errno code. For a dangling link it adds the fixed phrase `a symbolic link whose target cannot be reached`. entryPresence's own `reason` text holds a filesystem path, and the plan says every value in a line is a constant, a hex stamp or an errno code.
- Every skew line carries the remedy, including the unreadable and read-failure lines. state-check adds the remedy only to stamp lines, but the plan's line grammar puts it on every line.

## Deviations from Plan

### Execution note (not a code deviation)

**1. [Rule 3 - Blocking] Two-step regeneration**
- **Found during:** Task 1 step 6
- **Issue:** `npm run generate:runnable-embeds` first runs `tsc --outDir .tmp-build` with `noEmitOnError`, and then the committed generator `.js`. With the hand-written call to `entryPresence` and `readRunnableStamp` already in upstream.ts, tsc failed before the generator ran. Those names exist only once the generator has embedded them.
- **Fix:** I set the hand-written edit aside in the scratchpad and ran the generation twice. The first run rebuilt the generator `.js` with the new row; the second regenerated every region. I then re-applied the hand-written block outside the generated region and ran `npm run build`. Both freshness checks confirm that the result equals a fresh derivation.
- **Files modified:** none beyond the plan's list
- **Committed in:** `cf3c11fb`

**Total deviations:** 1 execution-order workaround (Rule 3). **Impact:** none on the delivered code. No scope creep.

## Issues Encountered

- A targeted run of the other test files that name upstream.js (10 files, 1,777 passed) found 2 failures in `scripts/check-foundation-guards.test.ts`. The cause is two adjacent byte-identical assertions at `scripts/upstream-model.test.ts:678`, added by plan 44-10 (commit 070d4efe), in a file this plan does not touch. This is out of scope here, so I recorded it in `deferred-items.md` with a suggested fix and did not change it. `node scripts/check-foundation-guards.js` (the plan's check) exits 0.
- No full-suite run was made here; the phase gate compares it by test name against the baseline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 44-12. upstream.ts, its generated region and every stamped runnable are fresh at `92f5e8ce`.
- Open for a human: flagged assumption A1 (whether TRC-02 needs a further edge), and the deferred guard failure from 44-10.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED

- Files: 44-11-SUMMARY.md, deferred-items.md and scripts/runnable-ref/upstream.ts exist.
- Commits: 1eba8456, cf3c11fb, b7a674a6 and 92f5e8ce are ancestors of HEAD.
- Acceptance greps: the upstream row names runnable-stamp.ts (1); readRunnableStamp in upstream.ts (2); runnable-version-skew in upstream.ts (2) and in its first 60 lines (1); `version skew` in the test (3+); `carries no build stamp` (2) and `no upstream sources declared` (4) in the test.
