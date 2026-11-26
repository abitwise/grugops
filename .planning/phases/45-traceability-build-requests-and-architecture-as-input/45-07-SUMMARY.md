---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 07
subsystem: tooling
tags: [build-requests, upstream, requests, git, runnable-embeds, typescript, tdd]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-01: the requests tracer; plan 45-03: the build-request grammar and the five derivations; plan 45-06: escalation_days, upstreamIdFacts/upstreamChangedIds and the git reads at any commit"
provides:
  - "The complete read-only `upstream.js requests` verb: carry (open and changed since carried), wait, answer-candidate, pin-moved, not-descendant, overlap and UNKNOWN - verify lines in a fixed order"
  - "BuildRequestReportItem kinds carry-changed, wait, answer-candidate, pin-moved, not-descendant, overlap, unknown; buildRequestOverlaps; the 2/1/0 exit rule"
  - "buildRequestPartsAt in scripts/build-request-fixture.test-support.ts: dated open/carried requests and none-ID requests"
affects: [45-08, 45-09, 45-10]

actuals:
  tokens: 36313
  tasks: 2
  commits: 4
plan_head_before: 6d438d8c8ac38097374f001e4752b1d8da842897
plan_head_after: 909b23f74eed72fa55f25c80161e800384e04194

tech-stack:
  added: []
  patterns:
    - "The host verb reads each git answer once per (source, commit) in a run and turns any unknown answer into one UNKNOWN - verify line in place of the proposal"
    - "Integration cases date their requests from today's UTC date with the Date.UTC arithmetic the program uses"

key-files:
  created: []
  modified:
    - scripts/build-request-model.ts
    - scripts/build-request-model.test.ts
    - scripts/build-request-fixture.test-support.ts
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.test.ts
    - scripts/generate-runnable-embeds.ts
    - install/installer-cross-version.test.ts

key-decisions:
  - "requests reads the config at the start of every run, as check does, so an invalid declaration stops the run with exit 2 even when the folder is absent or holds no open or carried request"
  - "A request whose source is not declared (including every request when no config file exists) prints UNKNOWN - verify after its carry and wait lines, so exit is 2"
  - "The pin-length check reuses upstreamGitCommitProblem, so its UNKNOWN reason is the one the git module gives: `commit <pin> is 40-hex but source <s> is pinned with 64-hex object ids`"
  - "Only a carried request whose raising pin differs from the declared pin asks git; an open request or a carried one at the current pin spawns no git"
  - "In the upstream.ts embed row, scripts/frontmatter.ts now sits after scripts/context-io.ts and before scripts/upstream-model.ts (handoff from 45-06)"

patterns-established:
  - "requests line order: refused by file name, then per request in numeric order carry, wait, answer-candidate or pin-moved, not-descendant, UNKNOWN, then overlap lines"

requirements-completed: [BR-03, BR-04, BR-05, BR-06]

coverage:
  - id: D1
    description: "One format case per line kind and the 2/1/0 exit rule in the model; buildRequestOverlaps pairs open and carried requests by source and shared ID in numeric order, with the shared IDs in the first request's order"
    requirement: BR-04
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#requests report — (4 describes, 25 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "carry … changed since carried, cleared by a second carry; wait at escalation_days 10 (no line at 10 days, a line at 11), reset by the last carry, default 10 with no key"
    requirement: BR-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — requests: carry changed, waits, overlaps and an undeclared source (plan 45-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "overlap BR-1 BR-2 design: DEC-1 for two open requests; no overlap across sources or for an answered request"
    requirement: BR-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#[EDGE BR-04/adjacency] [EDGE BR-03/concurrency] two open requests … one overlap"
        status: pass
    human_judgment: false
  - id: D4
    description: "Undeclared source, no config, pin length mismatch and invalid declaration; the line order rule; a planted question marker never reaches stdout or stderr"
    requirement: BR-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#ghost, no config, pin length, invalid declaration, [EDGE BR-04/ordering], PLANTED-INJECTION-MARKER-45-07"
        status: pass
    human_judgment: false
  - id: D5
    description: "answer-candidate for a changed, superseded or newly listed ID in the request's order; pin-moved when none changed and for a none-ID request; nothing when the pin has not moved; not-descendant after the candidate line; UNKNOWN on a shallow clone and on an absent raising pin"
    requirement: BR-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — requests: the answer proposal after a pin move (plan 45-07)"
        status: pass
    human_judgment: false
  - id: D6
    description: "requests runs only rev-parse, ls-tree, cat-file, config, version and merge-base, and a run printing every line kind leaves the product, the config bytes and the upstream checkout unchanged"
    requirement: BR-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#subcommands … merge-base; [EDGE BR-04/concurrency] a run printing every line kind"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds && npm run freshness && npm run typecheck && node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D7
    description: "A pin moved again while a human is answering a request changes nothing already written; the next requests run reports against the newer pin"
    requirement: BR-05
    verification: []
    human_judgment: true
    rationale: "The plan marks this truth `verification: backstop`: a prose rule in Workflow 20, confirmed at UAT. No code path here writes an answer."

duration: 18min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 07: The complete requests verb Summary

**`node tools/grugops/upstream.js requests` now gives the human, from one computed source, the carry list (open and changed since carried), the requests waiting past `upstream.escalation_days`, an answer proposal for every carried request after a human moves a pin (`answer-candidate` or `pin-moved`, with a `not-descendant` warning), the overlap list for deduplication, and an `UNKNOWN - verify` line wherever it cannot decide. It writes nothing and prints no free text from a request or the upstream.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-11-26T12:13:13Z
- **Completed:** 2026-11-26T12:31:09Z
- **Tasks:** 2
- **Files modified:** 20 (counted by git diff, which includes the compiled .js and the regenerated regions)

## Accomplishments
- The model has seven new report kinds with the exact strings of the plan's must-haves, `buildRequestOverlaps`, and the exit rule: 2 for any `refused` or `UNKNOWN - verify` line, else 1 for any other report line, else 0.
- `requestsReport` reads the config once through `configTextOrNull` and `parseUpstreamConfig` (absent config: no sources, threshold 10; invalid declaration: exit 2) and reads today's UTC date once. For each `open` or `carried` request in numeric order it prints the carry line, the wait line, the answer proposal and the `UNKNOWN - verify` line in that order, then the overlap lines.
- For a carried request whose raising pin is not the declared pin, it reads the manifest and the listed blobs at both commits through `upstreamGitManifestAt` and `upstreamGitListedBlobs`, caches each answer per (source, commit), decides with `upstreamIdFacts` and `upstreamChangedIds`, then asks `upstreamGitDescends`. A shallow clone gives `UNKNOWN - verify BR-1 design: shallow clone; ancestry cannot be decided` and never `not-descendant`.
- THE REQUESTS CONTRACT header now lists every line kind, the order rule, the exit codes, the added git subcommand (`merge-base`, for the ancestry only) and the sentence that `requests` writes nothing and never moves a pin.

## Task Commits

1. **Task 1: Line kinds, config read, waits, overlaps, undeclared source**: `91370ce5` (test, RED), `566009b7` (feat, GREEN)
2. **Task 2: Answer proposal after a pin move**: `1067c26f` (test, RED), `909b23f7` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

RED evidence, classified by `gsd-tools check tdd-red-evidence`:
- **Task 1:** `RED_EVIDENCE_OK` (target_test_failed), tap-flat reporter, target-only run. Target: `requests report — overlaps between open and carried requests (D-09, BR-03) > two open requests for one source that both name DEC-1 give one overlap item`. Semantic assessment: the target ran and failed because `buildRequestOverlaps` was not exported yet (`TypeError: buildRequestOverlaps is not a function`). The module loaded. In the full-file run, 22 new cases failed and the 109 existing ones passed. The 11 new integration cases failed on their stdout or exit assertions against the 45-01 verb.
- **Task 2:** `RED_EVIDENCE_OK` (target_test_failed), vitest `junit` reporter. The tap-flat report was refused as `invalid_record` because the case's multiline assertion message is not valid TAP, so the target was run again with a JUnit XML report as tdd.md RED step 4 directs. Target: `upstream.js — requests: the answer proposal after a pin move (plan 45-07, BR-05, D-10, D-11) > DEC-1's listed file changed between the raising pin and the pin now: …`. Semantic assessment: the synthetic upstream with two commits was built, the program ran, and it printed `no build request needs a human (1 on file)` at exit 0 where the test expected the `answer-candidate` line at exit 1. No answer proposal existed yet.

The evidence records and the JUnit report were written inside the project for the classifier and deleted afterwards. None is committed.

## Files Created/Modified
- `scripts/build-request-model.ts`: the new report kinds, their lines, `buildRequestOverlaps`, the exit rule, and a header line naming the 45-07 kinds
- `scripts/build-request-model.test.ts`: 25 cases for the line formats, the exit code, the overlaps and the dated builder
- `scripts/build-request-fixture.test-support.ts`: `buildRequestPartsAt` and `BuildRequestFixtureEvent`
- `scripts/runnable-ref/upstream.ts`: `upstreamDeclaration` (the declaration and its threshold, read once), `requestItems`, `answerItems`, the per-run git caches, the extended `requestsReport`, and the updated header contract
- `scripts/runnable-ref/upstream.test.ts`: 26 new integration cases. The 45-01 cases now declare `design` and `ux-kit` (see Deviations).
- `scripts/generate-runnable-embeds.ts`: frontmatter.ts moved before upstream-model.ts in the upstream.ts row; new roots; two dated doc lines
- `install/installer-cross-version.test.ts`: the no-config concurrency case expects the undeclared-source line (see Deviations)
- Six runnables (`upstream`, `state-check`, `state-roll`, `trace-render`, `claim`, `note`) and the compiled `.js` files: regenerated regions and the set stamp, written by the generator and `tsc`

## Decisions Made
See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan 45-01 requests cases had no declared source and fixed future dates**
- **Found during:** Task 1 (RED)
- **Issue:** The 45-01 cases ran with no config, so under the new rule every request would also print `UNKNOWN - verify … source design is not declared`. They also use fixed dates (2026-12-01), so a `wait` line would appear in them from 2026-12-12 onward.
- **Fix:** `productWithRequests` now writes a config declaring `design` and `ux-kit` at the invented pin, with `escalation_days` 36500. A dated comment explains why. Each expected stdout, stderr and exit code is unchanged. The new 45-07 cases set their own threshold and date their requests from today.
- **Files modified:** scripts/runnable-ref/upstream.test.ts
- **Committed in:** 91370ce5

**2. [Rule 1 - Bug] The cross-version concurrency case (plan 45-05) expected the 45-01 output**
- **Found during:** Task 1 (GREEN)
- **Issue:** `install/installer-cross-version.test.ts` (not in files_modified) runs `requests` over a 3.1 tree with no config and expected `carry BR-1 design: open since 2026-11-20` at exit 1. The 45-05 SUMMARY said 45-07 might change this output.
- **Fix:** The case now expects the carry line, then a `wait` line when today is more than 10 days after 2026-11-20 (the day count computed as upstream.js computes it), then `UNKNOWN - verify BR-1 design: source design is not declared`, at exit 2. A dated note explains the change. The digest assertion is unchanged.
- **Files modified:** install/installer-cross-version.test.ts
- **Committed in:** 566009b7

**3. [Rule 3 - Blocking] The generator named two upstream-model names that were not roots**
- **Found during:** Task 2
- **Issue:** Making `upstreamGitManifestAt` a root pulled in its imports of `UpstreamManifestAt` and `upstreamManifestAtOf` from upstream-model.ts, and the generator refused the import by name.
- **Fix:** Both names were added to the scripts/upstream-model.ts roots, as the refusal message asked.
- **Committed in:** 909b23f7

**4. [Rule 1 - Test] The requests subcommand case asserted equality where the plan says "only"**
- **Found during:** Task 2 (GREEN)
- **Issue:** The case expected the exact set `cat-file, config, ls-tree, merge-base, rev-parse, version`. The git module runs `version` only for a partial clone, and this case's checkout is a full clone.
- **Fix:** The case asserts that every subcommand seen is in the allowed set, and that `cat-file`, `ls-tree`, `merge-base` and `rev-parse` all ran. The `check` and `read` subcommand cases are unchanged.
- **Committed in:** 909b23f7

**5. [Rule 3 - Blocking] The generator ran from its stale compiled copy**
- **Found during:** both tasks
- **Issue:** The generator runs from its committed `.js`, and `noEmitOnError` blocks `tsc` while the hand-written part names declarations that the region does not hold yet.
- **Fix:** `npx tsc --noEmitOnError false`, then `node scripts/generate-runnable-embeds.js`, then `npm run build`, then the generator again. That last run reported `0 changed`. No region was edited by hand. Plans 45-01, 45-03 and 45-04 used the same order.

---

**Total deviations:** 5 auto-fixed (3 bug or test, 2 blocking).
**Impact on plan:** None of them changes a line kind, a string or an exit code the plan fixed. Deviations 1 and 2 register the behavior change the plan asked for in tests that predate it.

## Issues Encountered
- The integration cases compute ages from the test's own UTC date. If a run crosses UTC midnight between the test's date read and the program's, a boundary case can be one day off. The plan accepted this ("the same `Date.UTC` arithmetic").
- The full suite was not run here, on the orchestrator's instruction. The targeted suites were run and all passed: build-request-model, upstream, runnable-exit-contract, upstream-git (318 cases); generate-runnable-embeds, check-foundation-guards, mode-census, upstream-model, validate, validate-read-sites, nonblocking-reader-parity, state-check, installer-cross-version, check-state-paths (1203 cases).
- No pin moved: no pinned count, census or frozen hook manifest entry changed (`npm run freshness:hook-manifest` fresh, `node scripts/check-foundation-guards.js` ALL CHECKS PASSED).

## Verification
- `npx vitest run scripts/runnable-ref/upstream.test.ts scripts/build-request-model.test.ts scripts/upstream-git.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts`: 318 passed
- `npx vitest run scripts/runnable-ref/upstream.test.ts -t requests`: 38 passed
- `npm run freshness:runnable-embeds` (7 targets fresh), `npm run freshness` (97 .js fresh), `npm run typecheck`, `npm run freshness:hook-manifest`, `npm run check:state-paths`, `node scripts/check-foundation-guards.js`: all exit 0
- Acceptance greps: `export function buildRequestOverlaps` 1; `changed since carried` 2 and `escalation_days` 3 in build-request-model.ts; `PLANTED-INJECTION-MARKER-45-07` 2 in upstream.test.ts; `upstreamGitDescends` 3 in upstream.js; `answer-candidate` 10, `not-descendant` 5 and `"merge-base"` 2 in upstream.test.ts

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-08 (the validator) can call `upstreamCitationFindings` with `upstreamGitManifestAt`. The upstream.ts row now embeds `upstreamGitManifestAt`, `upstreamManifestAtOf` and `UpstreamManifestAt`, and frontmatter.ts comes before upstream-model.ts in it.
- Plans 45-09 and 45-10 can quote the requests line vocabulary from THE REQUESTS CONTRACT in scripts/runnable-ref/upstream.ts.
- For the 45-10 UAT: confirm that a request whose source is not declared (including every request in a repository with no config) should be `UNKNOWN - verify` at exit 2. The plan specifies this behavior, and it changes the documented 45-05 cross-version exit from 1 to 2.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: scripts/build-request-model.ts, scripts/runnable-ref/upstream.ts, scripts/build-request-fixture.test-support.ts
- FOUND (ancestors of HEAD): 91370ce5, 566009b7, 1067c26f, 909b23f7
