---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 03
subsystem: tooling
tags: [build-requests, grammar, lifecycle, runnable-embeds, typescript, tdd]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-01: scripts/build-request-model.ts (five-key frontmatter), the upstream.ts EMBED_SPECS row, `upstream.js requests`"
provides:
  - "The complete build-request grammar in scripts/build-request-model.ts: six sections, closed History forms, closed lifecycle, nine new refusal codes"
  - "Pure derivations for the carry list and the escalation: buildRequestChangedSinceCarried, buildRequestLastMoveDate, buildRequestAgeDays, buildRequestWaitDays, buildRequestIsOverdue"
  - "HUMAN_STAMP_RE exported from scripts/context-io.ts"
  - "scripts/build-request-fixture.test-support.ts (buildRequestText, validBuildRequestParts)"
affects: [45-04, 45-07, 45-09, 45-10]

actuals:
  tokens: 42670
  tasks: 3
  commits: 4
plan_head_before: a6f22601b29faec1a1407793062e0c903d4af3e2
plan_head_after: 0530469f1d474bb6af9cf4df199196b1268cc778

tech-stack:
  added: []
  patterns:
    - "Closed History grammar: one regex per line shape, then a state machine over the entries; the status is derived and compared, never trusted"
    - "Section discovery through the one section owner only: unfencedHeadingIndices for each section, a sectionEndIndex walk for every other heading"

key-files:
  created:
    - scripts/build-request-model.test.ts
    - scripts/build-request-fixture.test-support.ts
  modified:
    - scripts/build-request-model.ts
    - scripts/context-io.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts
    - hooks/hook-entry.ts

key-decisions:
  - "Task 1 checkpoint answered option-a by the human on 2026-11-26: adopt the research forms as listed (History lines `- YYYY-MM-DD: <event>` with open/edited/carried/answered/withdrawn, `human:<name>` per HUMAN_STAMP_RE, `- (recommended) ` marker, `none` in Upstream IDs, highest-plus-one numbering, the Blocked bullet wording, open to answered refused)"
  - "A second `carried` entry is a re-send: it is allowed from `carried` and clears the changed-since-carried flag"
  - "An `open` request may be withdrawn only by BA/PM, and a `carried` one only by a `human:<name>` stamp; a human-stamped withdrawal of an open request is bad-transition"
  - "A body may hold at most one level-one title line before `## Question`, and nothing else outside the six sections"
  - "Duplicate IDs in `## Upstream IDs` and `## Blocks` are refused, and `none` must stand alone and unbulleted"

patterns-established:
  - "BuildRequestStep<T>: section parsers return a value or the narrowed refusal type, with no casts"
  - "Reasons name a line and a rule and print only constants of the grammar, never file text"

requirements-completed: [BR-01, BR-03, BR-05]

coverage:
  - id: D1
    description: "The six sections in D-05 order, found only through the section owner; extra, missing, duplicated, renamed, near-miss, out-of-order and cut-short files are refused"
    requirement: BR-01
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#build-request grammar — the six sections (bad-section)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Upstream IDs (or `none`), options with exactly one recommended marker, and blocked ticket IDs with reserved prefixes refused"
    requirement: BR-01
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#build-request grammar — upstream IDs, options and blocked tickets"
        status: pass
    human_judgment: false
  - id: D3
    description: "The closed History line forms chosen at the checkpoint, the order rule, the closed lifecycle and status-mismatch; BA/PM never records carried or answered"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#the closed History line forms / History order / the closed lifecycle / status-mismatch"
        status: pass
    human_judgment: false
  - id: D4
    description: "An answer needs a new pin of the raising pin's length, different from it, and a non-empty `## Answer` only once answered"
    requirement: BR-05
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#[EDGE BR-05/adjacency] and [EDGE BR-05/empty]"
        status: pass
    human_judgment: false
  - id: D5
    description: "Derivations: changed since carried, last move date, whole UTC day age, wait days, strict overdue boundary"
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#build-request derivations"
        status: pass
    human_judgment: false
  - id: D6
    description: "The installed upstream.js embeds the full grammar; embeds, build outputs, hook manifest and every moved pin are fresh"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#(e) the installed reader applies the full body grammar"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds && npm run freshness && npm run typecheck && node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 03: The build-request grammar Summary

**`parseBuildRequestDocument` now admits a build request only in the closed form a human chose: six sections in D-05 order, History lines in five event forms where only a `human:<name>` stamp can carry or answer, a closed lifecycle the frontmatter status must match, and an answer that needs a new pin. Five pure derivations give the carry list and the escalation what they need.**

## Performance

- **Duration:** 22 min (this continuation; the previous executor stopped at the Task 1 checkpoint before any code)
- **Started:** 2026-11-26T10:50:24Z
- **Completed:** 2026-11-26T11:11:49Z
- **Tasks:** 3 (Task 1 a decision checkpoint, Tasks 2 and 3 test first)
- **Files modified:** 25 (counted by git diff, which includes the compiled .js and the regenerated regions)

## Accomplishments
- The body grammar: `BUILD_REQUEST_SECTIONS`, `BUILD_REQUEST_RECOMMENDED_MARKER`, `BUILD_REQUEST_NONE_IDS`, `BUILD_REQUEST_EVENTS`, `BUILD_REQUEST_AGENT_ACTOR`. Nine new refusal codes: `bad-section`, `bad-upstream-ids`, `bad-options`, `bad-blocks`, `bad-history-line`, `bad-history-order`, `bad-transition`, `status-mismatch`, `bad-answer`. The plan 45-01 codes are unchanged.
- `BuildRequestDocument` gains `upstreamIds`, `options`, `blocks`, `history` (`BuildRequestHistoryEntry`: date, event, actor, pin, notDescendant, line) and `hasAnswer`.
- Derivations: `buildRequestChangedSinceCarried`, `buildRequestLastMoveDate`, `buildRequestAgeDays`, `buildRequestWaitDays` and `buildRequestIsOverdue`. None reads a clock and none stores anything in the file.
- The installed `upstream.js` embeds the full grammar (frontmatter.ts joins its row), and all six runnables were regenerated. A new upstream.test.ts case shows the installed reader refuses `status-mismatch`.

## Task Commits

1. **Task 1: Choose the History line forms (checkpoint:decision)** - no commit; option-a, recorded below
2. **Task 2: Sections, History grammar, closed lifecycle** - `71bd0d28` (test, RED), `f747e97c` (feat, GREEN)
3. **Task 3: Derivations, regenerated embeds, moved pins** - `a479d12f` (test, RED), `0530469f` (feat, GREEN)

No REFACTOR commit: the GREEN code needed no cleanup.

## Files Created/Modified
- `scripts/build-request-model.ts`: the body grammar, the lifecycle and the derivations
- `scripts/build-request-model.test.ts` (new): 106 cases, one per behavior bullet and refusal code
- `scripts/build-request-fixture.test-support.ts` (new): `buildRequestText`, `validBuildRequestParts` (eight lifecycle shapes), invented IDs only
- `scripts/context-io.ts`: `HUMAN_STAMP_RE` is exported (no other change)
- `hooks/hook-entry.ts`/`.js`: regenerated frozen manifest hash for `scripts/context-io.js`
- `scripts/generate-runnable-embeds.ts`: frontmatter.ts in the upstream.ts row, four new roots, a dated doc line
- Six runnables (`upstream`, `state-check`, `state-roll`, `trace-render`, `claim`, `note`): regenerated regions, written by the generator
- `scripts/runnable-ref/upstream.test.ts`: the fixture writes the History each status implies; one new case
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts`: re-derived, dated pins

## Decisions Made

**Task 1 checkpoint (`checkpoint:decision`, gate blocking): the human (Olger) chose option-a on 2026-11-26, through the orchestrator's checkpoint prompt: adopt the proposed forms as listed.** Plans 45-07, 45-09 and 45-10 quote these forms:

- History entry: one line `- YYYY-MM-DD: <event>`, UTC date. Events:
  - `open, by BA/PM`
  - `edited, by BA/PM: <what changed>`
  - `carried, by human:<name>`
  - `answered, by human:<name>, pin <commit>`, optionally followed by `, not-descendant`
  - `withdrawn, by BA/PM: <reason>` (from `open`)
  - `withdrawn, by human:<name>: <reason>` (from `carried`)
- `<name>` follows the note schema's stamp rule `human:[A-Za-z0-9._-]+` (`HUMAN_STAMP_RE` in `scripts/context-io.ts`, now exported). Names cannot contain spaces.
- The recommended option starts with `- (recommended) `.
- `## Upstream IDs` may hold the single line `none`.
- `<n>` = the highest number already in the folder plus one. Numbers are never reused, and finished files stay.
- Bullet added to a blocked ticket: `- <date>, raised by <role>: waiting on build request BR-<n> (owner: human carrier)`.
- No direct `open` → `answered`. Such a request is withdrawn instead.

Grammar details settled while implementing, inside those forms (also in key-decisions):
- A second `carried` entry after `carried` is allowed. It records a re-send and clears "changed since carried" (research Pattern 2).
- Only BA/PM opens a request and records an edit. A human-stamped `open` or `edited` line is `bad-transition`.
- At most one level-one title line may come before `## Question`. Any other text or heading outside the six sections is `bad-section`. An empty `## Question` is also `bad-section`, because the plan names no separate code for it.
- An answer pin that is not a 40- or 64-character object id is `bad-history-line`. One of the other length, or equal to the raising pin, is `bad-transition`.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 2 | `71bd0d28`: 79 of 82 failed; target `a missing section is bad-section` | `f747e97c`: 82 of 82 pass | none needed |
| 3 | `a479d12f`: 24 of 106 failed; target `[EDGE BR-06/precision] 2026-12-01 to 2026-12-11 is 10 days` | `0530469f`: 106 of 106 pass | none needed |

RED evidence, classified by `gsd-tools check tdd-red-evidence`:
- **Task 2:** `RED_EVIDENCE_OK` (target_test_failed). The full-file run used vitest's `tap-flat` reporter, which writes multiline expected/actual strings that are not valid TAP. The classifier rejected that report as `invalid_record`, so the target was run again alone (`-t "a missing section is bad-section"`) as tdd.md RED step 4 directs. Semantic assessment: the target ran and failed on its planned assertion. The frontmatter-only parser admitted a file with no `## Options`, and the test expected a `bad-section` refusal. The other 81 tests loaded and ran in the same run.
- **Task 3:** `RED_EVIDENCE_OK` (target_test_failed). Semantic assessment: the target ran and failed because `buildRequestAgeDays` was not exported yet (`TypeError: buildRequestAgeDays is not a function`). The module loaded and the 82 grammar tests passed in the same file, so the failure came from the missing planned behavior, not from setup, import or syntax.

The three tests that passed in the Task 2 RED run passed vacuously against the old parser: the fenced-heading case, the two-entries-on-one-date case, and the edited-does-not-move-status case. Each one asserts an admission.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The frozen hook manifest went stale when context-io.js changed**
- **Found during:** Task 2 (GREEN)
- **Issue:** `scripts/context-io.js` is in the hook decider's frozen manifest, so exporting `HUMAN_STAMP_RE` changed its hash.
- **Fix:** `npm run generate:hook-manifest`. hooks/hook-entry.ts and .js were committed with the GREEN commit, and `scripts/floor-invariance.test.ts` passed after the commit (136 tests).
- **Committed in:** f747e97c

**2. [Rule 1 - Bug] The 45-01 requests fixture wrote an open-only History for every status**
- **Found during:** Task 3 (after regenerating the embeds)
- **Issue:** `buildRequestText` in scripts/runnable-ref/upstream.test.ts wrote `- <raised>: open, by BA/PM` whatever the status was. Under the full grammar, cases (e) `carried` and (f) `answered` became `refused …: status-mismatch`.
- **Fix:** a `buildRequestHistoryFor(status, raised)` helper writes the History each status implies, and for `answered` a second invented pin and an answer. No expected stdout, stderr or exit code of an existing case changed. One new case shows the installed reader refuses `status-mismatch`.
- **Committed in:** 0530469f

**3. [Rule 3 - Blocking] Two pins the plan did not list**
- **Found during:** Task 3
- **Issue:** build-request-model.ts now imports the section owner, so it joined two derived consumer sets in check-foundation-guards.test.ts: the frontmatter.js consumer list (15 → 16) and `LOCATOR_CONSUMERS` (9 → 10, through `sectionEndIndex`). The flat reader corpus also moved 77 → 78 and the tripwire module count 87 → 88, both measured.
- **Fix:** each pin was re-derived by its own command (`git ls-files … | xargs grep -l 'from "./frontmatter.js"'`, `ls scripts/*.ts`, `ls scripts/*.test.ts`, `git ls-files '*.ts'`) and given a dated note. A new assertion pins build-request-model.ts to the two locator symbols only.
- **Committed in:** 0530469f

**4. [Rule 3 - Blocking] The generator ran from its stale compiled copy**
- **Found during:** Task 3
- **Issue:** `npm run generate:runnable-embeds` runs the committed `scripts/generate-runnable-embeds.js`, which did not yet include the row edit.
- **Fix:** `npm run build`, then `node scripts/generate-runnable-embeds.js`, then `npm run build` again. No region was edited by hand. This is the same ordering 45-01 recorded.

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking).
**Impact on plan:** None of them changes the grammar or its forms. Deviations 1 and 3 are registrations of the import changes the plan asked for.

## Issues Encountered
- vitest's TAP reporters print multiline strings unindented, so a whole-file report cannot be classified. RED evidence was taken from a target-only rerun instead.
- The full suite was not run here, as the orchestrator instructed (it runs once after the last wave). Targeted runs, all green after the last commit: build-request-model, upstream, check-foundation-guards, mode-census, context-io-writer-set, note (858 tests); generate-runnable-embeds, runnable-exit-contract, nonblocking-reader-parity, read-sites, check-state-paths, path-spelling-census, frontmatter, trace-model, floor-invariance, check-claim-anchors, chrome-lane-bar, trace-render (1426); state-check, state-roll, context-io (1051, 1 skipped); validate (213).

## Verification
- `npx vitest run scripts/build-request-model.test.ts scripts/runnable-ref/upstream.test.ts scripts/check-foundation-guards.test.ts install/mode-census.test.ts`: all pass (with context-io-writer-set and note, 858 passed)
- `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:hook-manifest`, `npm run typecheck`, `npm run check:state-paths` and `node scripts/check-foundation-guards.js`: all exit 0
- Acceptance greps: `export const HUMAN_STAMP_RE` (context-io.ts:188); `sectionEndIndex` 6 and `unfencedHeadingIndices` 4 in build-request-model.ts; 40 `it(` in the test file; `export function buildRequestAgeDays` 1; `export function buildRequestIsOverdue` 1; `const SCRIPTS_TEST_FILE_COUNT = 88;` (mode-census.test.ts:160)

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-04 (validator and state-check) imports `parseBuildRequestDocument` and gets the full grammar and codes.
- Plan 45-07 (`upstream.js requests` lines) can call `buildRequestChangedSinceCarried`, `buildRequestWaitDays` and `buildRequestIsOverdue`. They are already exported, but they are not yet roots of the upstream.ts row, so 45-07 adds them to that row's roots.
- Plans 45-09 and 45-10 quote the History forms listed under Decisions Made.
- RUNNABLE_SET_STAMP moved. This is expected when the embeds change; the runnable-version-skew research flag stays with the plan that ships state-check's new folder.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: scripts/build-request-model.test.ts, scripts/build-request-fixture.test-support.ts
- FOUND commits on HEAD: 71bd0d28, f747e97c, a479d12f, 0530469f
