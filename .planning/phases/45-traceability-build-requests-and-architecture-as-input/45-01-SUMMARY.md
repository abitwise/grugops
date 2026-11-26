---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 01
subsystem: tooling
tags: [build-requests, upstream, runnable-embeds, git, typescript]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: upstream.js check/read, scripts/upstream-model.ts, the upstream.ts EMBED_SPECS row
provides:
  - scripts/build-request-model.ts (the one build-request frontmatter grammar and the requests report lines)
  - scripts/upstream-git.ts (the one hardened git launcher and object reader, embeddable)
  - BUILD_REQUESTS_REL in install/state-layout.ts
  - the `upstream.js requests` verb (carry list, exit 0/1/2)
affects: [45-03, 45-04, 45-06, 45-07, 45-08, 45-09]

actuals:
  tokens: 53505
  tasks: 3
  commits: 3
plan_head_before: 52045d5651c06b09413c7f5c1e500078407720ae
plan_head_after: 61b613dc5df19a6c7b48af4e465248184adc31e4

tech-stack:
  added: []
  patterns:
    - "pure authority + generated embed + host verb, applied to build requests"
    - "an I/O authority (upstream-git.ts) embedded into a runnable through the generator, all names prefixed"

key-files:
  created:
    - scripts/build-request-model.ts
    - scripts/upstream-git.ts
    - .planning/phases/45-traceability-build-requests-and-architecture-as-input/deferred-items.md
  modified:
    - install/state-layout.ts
    - scripts/state-rules.ts
    - scripts/runnable-ref/upstream.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/validate.test.ts
    - hooks/hook-entry.ts

key-decisions:
  - "Each build-request record is lstat'ed before it is read; any non-regular entry (link, FIFO, directory) is `refused <name>: not-a-regular-file`, because readRegularFileOrNull follows a link"
  - "A record the reader cannot open, or one that vanished after the listing, is `refused <name>: unopenable`"
  - "isTicketId is not imported into build-request-model.ts yet (noUnusedLocals); plan 45-03 adds it with the Blocks section"
  - "runnable-ref/upstream.ts joins NOT_A_SECOND_AUTHORITY (10 -> 11): its generated region carries `status` (BUILD_REQUEST_KEYS) beside `column` (manifest reasons); it reads no ticket"

patterns-established:
  - "requests report: refused lines by name, then carry lines by numeric id, then a single none/quiet line; exit = 2 if refused, else 1 if carry, else 0"

requirements-completed: [BR-01, BR-04, TRC-03]

coverage:
  - id: D1
    description: "An open BR-1.md prints `carry BR-1 design: open since 2026-12-01` and exits 1 through the committed upstream.js"
    requirement: BR-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — requests: the carry list (plan 45-01, BR-04, D-12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Empty folder / .gitkeep only, numeric ordering, refused grammar and bad file names, carried-only quiet line, zero git calls and an unchanged tree"
    requirement: BR-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#requests cases (b)-(f), link and argument cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "The build-request frontmatter grammar (five keys, value-silent refusal codes)"
    requirement: BR-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#(d) unknown-key, id-mismatch, bad-file-name"
        status: pass
    human_judgment: false
  - id: D4
    description: "The hardened git read moved to scripts/upstream-git.ts with no behavior change; every pre-existing check/read/adversarial case passes"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts (110 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Pins re-derived (NON_TEST_MODULE_COUNT 121, flat reader corpus 77) and the exit contract covers requests"
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts; scripts/runnable-ref/runnable-exit-contract.test.ts; node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false

duration: 49min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 01: Build-request tracer and git-read extraction Summary

**`upstream.js requests` prints the carry list from `memory-bank/plans/build-requests/BR-<n>.md` through a new pure build-request grammar authority. The hardened git launcher now lives in its own embeddable module, `scripts/upstream-git.ts`, and the git read behaves exactly as before.**

## Performance

- **Duration:** 49 min
- **Started:** 2026-11-26T09:06:14Z
- **Completed:** 2026-11-26T09:55:23Z
- **Tasks:** 3
- **Files modified:** 30 (counted by git diff, which includes the generated regions and the compiled .js)

## Accomplishments
- `node upstream.js requests [--root <dir>]` prints `refused …`, `carry <BR> <source>: open since <date>`, `no build requests` and `no build request needs a human (<n> on file)`, and exits 2, 1 or 0. It spawns no git and writes nothing.
- `scripts/build-request-model.ts` is the one authority for the five-key frontmatter (`id, status, source, pin, raised`). Its refusal codes never quote text from the file. It reaches the host reader through the generator.
- `scripts/upstream-git.ts` holds the launcher, the pin answers and the object reads. Each name now carries the `upstreamGit` prefix, and `upstreamGitAnswers(root, …)` takes the root as its first argument. The hand-written part of upstream.ts no longer starts any process.
- Every pin these changes moved was re-measured, given a date and turned green. The frozen hook manifest was regenerated.

## Task Commits

1. **Task 1: Tracer, an open build request reaches the carry list** - `a1c969b3` (feat)
2. **Task 2: Move the hardened git read into scripts/upstream-git.ts** - `ee28d132` (refactor)
3. **Task 3: Move the pins** - `61b613dc` (test)

## Files Created/Modified
- `scripts/build-request-model.ts`: the build-request grammar, the report lines and the exit code
- `scripts/upstream-git.ts`: the git launcher and object reads, moved from upstream.ts
- `install/state-layout.ts`: `BUILD_REQUESTS_REL`
- `scripts/state-rules.ts`: `isCalendarDate` is now exported
- `scripts/runnable-ref/upstream.ts`: the `requests` verb, the REQUESTS CONTRACT header and the extended USAGE; the git launcher is removed from the hand-written part
- `scripts/generate-runnable-embeds.ts`: two new authorities in the upstream.ts row, plus new roots
- All six stamped runnables and `install/state-migrate.ts`: regenerated regions (by the generator, not by hand)
- `hooks/hook-entry.ts`/`.js`: the regenerated frozen manifest hash for install/state-layout.js
- Tests: upstream.test.ts, runnable-exit-contract.test.ts, check-foundation-guards.test.ts, validate.test.ts

### Edited lines in scripts/runnable-ref/upstream.test.ts outside the new requests describe
1. Import of `BUILD_REQUESTS_REL, STATE_ROOT_REL` from install/state-layout.js. It is used only by the new describe; check:state-paths forbids spelling the path as literals.
2. The `USAGE` constant now ends with ` or node upstream.js requests [--root <dir>]`. This follows from the USAGE change the plan specified, in the same way plan 44-06 extended it.
3. A PREMISE in the config-read EIO case: the callers of the reader are now `["configTextOrNull", "requestsReport", "siblingSkewLines"]`. This locator names the new caller, and the case still injects at the config read.
4. The EACCES case's locator: `enclosing === "upstreamGitAnswers"` (Task 2, as the plan specified).

No expected stdout, stderr or exit code of a pre-existing case changed.

## Decisions Made
See key-decisions in the frontmatter. The most important is the lstat before reading each record. Without it, a link named `BR-1.md` would be followed and read, which T-45-02 forbids.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] isTicketId not imported or embedded**
- **Found during:** Task 1
- **Issue:** `noUnusedLocals` refuses an unused import. The frontmatter-only grammar in this plan never calls `isTicketId`.
- **Fix:** The import and the board-model root are left out. Plan 45-03 adds them with the Blocks section.
- **Committed in:** a1c969b3

**2. [Rule 2 - Missing critical] Linked or non-regular records refused before the read**
- **Found during:** Task 1
- **Issue:** `readRegularFileOrNull` opens through a symbolic link, so a linked `BR-<n>.md` would have been read (T-45-02).
- **Fix:** Each record is lstat'ed first; anything that is not a regular file is `refused <name>: not-a-regular-file`. The test case "a linked record is refused" covers it.
- **Committed in:** a1c969b3

**3. [Rule 3 - Blocking] Generator chicken-and-egg**
- **Found during:** Task 1
- **Issue:** `npm run generate:runnable-embeds` runs `tsc` first, and `noEmitOnError` blocked that step because upstream.ts referenced names the region did not declare yet.
- **Fix:** `npx tsc --noEmitOnError false` once, to emit the edited generator, then `node scripts/generate-runnable-embeds.js` and `npm run build`. No region was edited by hand.

**4. [Rule 1 - Bug] Reader-caller PREMISE in upstream.test.ts**
- **Found during:** Task 1
- **Issue:** The config-read fault case pins the set of `readRegularFileOrNull` callers, and the new `requestsReport` caller changed that set.
- **Fix:** The new caller is added to the set, with a dated comment. The fault still targets the config read.
- **Committed in:** a1c969b3

**5. [Rule 3 - Blocking] Frozen hook manifest stale**
- **Found during:** Task 3 (context-io and nonblocking-reader-parity suites, floor-invariance)
- **Issue:** install/state-layout.js is in the hook decider's frozen manifest. Changing it made the wrapper fail closed, and 8 cases went red.
- **Fix:** `npm run generate:hook-manifest`; hooks/hook-entry.ts and .js are committed with Task 3. All three suites now pass.
- **Committed in:** 61b613dc

**6. [Rule 3 - Blocking] Ticket-key census names runnable-ref/upstream.ts**
- **Found during:** Task 3 (scripts/validate.test.ts)
- **Issue:** The generated region now carries `"status"` (BUILD_REQUEST_KEYS) beside `column` (the manifest reasons that upstream-model and upstream-git share). The whole-file census therefore counted upstream.ts as a second ticket reader.
- **Fix:** A NOT_A_SECOND_AUTHORITY entry naming the exact literals, and NOT_A_SECOND_AUTHORITY_COUNT 10 -> 11 with a dated note. I read the file before writing the exemption; it parses no ticket document.
- **Committed in:** 61b613dc

---

**Total deviations:** 6 auto-fixed (1 bug, 1 missing critical, 4 blocking).
**Impact on plan:** None of them changes the plan's architecture or output grammar. Deviations 5 and 6 are registrations the plan did not foresee.

## Issues Encountered
- Full suite (1688 s): 2 failures. `floor-invariance › hook-entry.ts has no uncommitted modification` failed only because hook-entry.ts was not committed yet when the suite ran; after the Task 3 commit that file passes (136 tests). `install/installer-fs-census.test.ts` fails on `UNCLASSIFIED node:fs export openAsBlobSync`. That export comes from the local Node v26.12.1 runtime, and no file this plan changed causes it. It is logged in `deferred-items.md` and left out of scope.

## Verification
- `npx vitest run` on upstream, exit-contract, generate-runnable-embeds, state-check and check-foundation-guards: 726 passed
- `npm run freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `typecheck`, `check:state-paths`: all exit 0
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED
- Tracer gate: after commit a1c969b3, `-t requests` and `freshness` were run again and passed. Tracer verified end to end before expansion.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-03 extends `parseBuildRequestDocument` with the sections and History. It should add `isTicketId` (import and board-model root) at that point.
- Plans 45-06, 45-07 and 45-08 have one git launcher (`scripts/upstream-git.ts`) to extend or import.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
