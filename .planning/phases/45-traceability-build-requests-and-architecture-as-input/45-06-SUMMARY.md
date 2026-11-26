---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 06
subsystem: tooling
tags: [upstream, traceability, build-requests, git, runnable-embeds, typescript, tdd]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-01: scripts/upstream-git.ts (the one launcher); plan 45-03/45-04: the build-request grammar and the embed rows"
provides:
  - "`upstream.escalation_days` in the closed key set: optional, default 10, a safe integer of at least 1"
  - "upstreamStatementOf: the `## Upstream` statement reader (absent / none / malformed)"
  - "upstreamCitationFindings: the TRC-03 decision table, pure, with the manifest read as a parameter"
  - "upstreamIdFacts and upstreamChangedIds: the D-10 changed-ID rule"
  - "upstreamGitOpen, upstreamGitManifestAt, upstreamGitListedBlobs, upstreamGitDescends in scripts/upstream-git.ts"
affects: [45-07, 45-08]

actuals:
  tokens: 37051
  tasks: 3
  commits: 6
plan_head_before: 48aad980cf960a4ea2bf8e2557ac7bcb65a554a7
plan_head_after: d0cee87160a7f6d75d75c3f2d7dec00d5e245b3d

tech-stack:
  added: []
  patterns:
    - "A pure decision takes its git read as a parameter (manifestAt), so the validator and the host reader share one answer"
    - "Every new git read runs the same opening checks (upstreamGitOpen) and returns an answer instead of throwing"

key-files:
  created:
    - scripts/upstream-git.test.ts
  modified:
    - scripts/upstream-model.ts
    - scripts/upstream-model.test.ts
    - scripts/upstream-git.ts
    - scripts/validate.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/upstream.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "The citation decision treats only refs that start with `upstream:` as citations; any other ref on a ticket note is ignored"
  - "A malformed `## Upstream` statement is an error for every ticket, Done or not; only the missing-statement case is a warning (not Done, notes complete) or nothing"
  - "UNKNOWN lines name no ticket and are counted per (source, commit, reason); they follow every ticket finding in the output"
  - "A commit of another length than the source's pin is refused before git runs (upstreamGitCommitProblem); a value outside the grammar is never quoted"
  - "upstreamManifestAtOf was added so upstream-git.ts words a malformed manifest exactly as pinState does"

patterns-established:
  - "upstreamGitUnknownOf: an UpstreamGitUnknown becomes its unknown answer; any other error is named by its kind only"

requirements-completed: [TRC-01, TRC-03, BR-05, BR-06]

coverage:
  - id: D1
    description: "`upstream.escalation_days` is optional with default 10; 1, 10, 365 admitted; 0, -1, 1.5, \"10\", null, true, 2**53 refused by one finding naming the key; the allowed keys are quoted as `sources, escalation_days`"
    requirement: BR-06
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#config: escalation_days (12 cases)"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#a config declaring upstream.escalation_days: 10 passes; refuses upstream.escalation_days: 0 with one ERROR"
        status: pass
    human_judgment: false
  - id: D2
    description: "upstreamStatementOf reads `## Upstream` through the section owner: absent, none, malformed (two headings, empty, other text); a fenced heading is not a heading"
    requirement: TRC-01
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#statement: (9 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "upstreamCitationFindings decides every Pattern 3 row and the statement rules, reads each (source, commit) once, and sorts its output"
    requirement: TRC-03
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#citation: (23 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "upstreamIdFacts and upstreamChangedIds compare status, successor and blob, never the path"
    requirement: BR-05
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#changed IDs: (6 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "upstreamGitManifestAt, upstreamGitListedBlobs and upstreamGitDescends against synthetic upstreams: older commits, absent commits, non-regular and malformed entries, blob mismatch, shallow, graft, replace ref, partial clone under git 2.44, the subcommand set and the argument grammar"
    requirement: TRC-03
    verification:
      - kind: integration
        ref: "npx vitest run scripts/upstream-git.test.ts (20 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The opening-check split changes no check or read answer; embeds, build outputs and every moved pin are fresh"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts scripts/upstream-model.test.ts scripts/check-foundation-guards.test.ts install/mode-census.test.ts (all passed)"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds && npm run freshness && npm run typecheck && node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D7
    description: "GIT_GRAFT_FILE set to the null device on Windows git"
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify: research A6. No Windows git run was made; the graft case is skipped nowhere but was only run on Linux."

duration: 17min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 06: Upstream decisions and git facts Summary

**`upstream.escalation_days` parses with a default of 10 in the shared model. The pure model now decides the `## Upstream` statement, every citation case of the TRC-03 table and the changed-ID rule. The one git module answers the manifest at any commit, the listed blobs and ancestry. These reads run the same opening checks as `check`, and a shallow clone, a graft file or a replace ref cannot produce a false `not-descendant`.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-26T11:53:29Z
- **Completed:** 2026-11-26T12:10:53Z
- **Tasks:** 3
- **Files modified:** 24 (counted by git diff, which includes the compiled .js and the regenerated regions)

## Accomplishments
- `parseUpstreamConfig` admits `escalation_days` as an optional key. Its `ok` result carries `escalationDays`, which is 10 when the key is absent. Any value that is not a safe integer of at least 1 is refused by one finding that names `upstream.escalation_days`. The `upstream` object message now reads `upstream must be an object with the key "sources" and, optionally, "escalation_days"`.
- `upstreamStatementOf` finds the heading only through `unfencedHeadingIndices` and the section end only through `sectionEndIndex`. Its reasons name the rule and never quote ticket text.
- `upstreamCitationFindings({ sources, tickets, manifestAt, notesComplete })` decides each row of research Pattern 3. It reads the manifest once per (source, commit). It compares `entry_blob` only through the read at the current pin. It names the supersession chain in full (for example `DEC-2 → DEC-3`). It never quotes a ref that failed the grammar. Output order is stable.
- `upstreamGitOpen` holds the former opening checks of `upstreamGitAnswers` with no change in behavior or message. Every case in the plan 45-01 suite still passes.
- `upstreamGitManifestAt`, `upstreamGitListedBlobs` and `upstreamGitDescends` check their commit and path grammar before git runs and never throw. In a partial clone under git 2.44 they answer unknown and run no `cat-file`, `ls-tree` or `merge-base`. Only the ancestry read runs `merge-base`, and it runs with `GIT_GRAFT_FILE` set to `devNull`.

## Task Commits

1. **Task 1: `upstream.escalation_days` in the closed key set**: `5758facf` (test, RED), `c8d93d3c` (feat, GREEN)
2. **Task 2: Statement reader, citation decision, changed-ID decision**: `ecca2591` (test, RED), `028c16f6` (feat, GREEN)
3. **Task 3: Manifest at any commit, listed blobs, ancestry; embeds and counts**: `70eb0fd6` (test, RED), `d0cee871` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

RED evidence, classified by `gsd-tools check tdd-red-evidence` (tap-flat reporter, target-only rerun):
- **Task 1:** `RED_EVIDENCE_OK` (target_test_failed). Target: `config: escalation_days absent gives the default of 10`. Semantic assessment: the target ran and failed on its planned assertion (`expected undefined to be 10`), because `UPSTREAM_ESCALATION_DAYS_DEFAULT` was not exported yet. The 11 other upstream cases in the same run passed.
- **Task 2:** `RED_EVIDENCE_OK` (target_test_failed). Target: `citation: listed, not Done, superseded at the current pin is a warning naming the chain end`. Semantic assessment: the target failed because `upstreamCitationFindings` was not a function yet. The module loaded, and the other 218 model cases passed in the same file.
- **Task 3:** `RED_EVIDENCE_OK` (target_test_failed). Target: `descends: an ancestor gives descendant; reversed gives not-descendant`. Semantic assessment: the target failed because `upstreamGitDescends` was not a function yet. The fixture repositories were built and the import of the module resolved.

The evidence records were written inside the project for the classifier and deleted after classification. None is committed.

## Files Created/Modified
- `scripts/upstream-model.ts`: escalation_days, the statement reader, the citation decision, `upstreamManifestAtOf`, the changed-ID rule. It now imports the section owner and `compareCodeUnits`.
- `scripts/upstream-git.ts`: `upstreamGitOpen`, `upstreamGitManifestAt`, `upstreamGitListedBlobs`, `upstreamGitDescends`, `upstreamGitCommitProblem`, `upstreamGitCommitPresent`, `upstreamGitUnknownOf`, type `UpstreamGitAncestry`. `upstreamGitRun` and `upstreamGitAnswer` take an optional extra environment.
- `scripts/upstream-git.test.ts` (new): 20 integration cases.
- `scripts/upstream-model.test.ts`, `scripts/validate.test.ts`: the moved escalation_days cases and the new cases.
- `scripts/generate-runnable-embeds.ts`: a dated header line. No root was added, because the generator named no missing one.
- Six runnables (`upstream`, `state-check`, `state-roll`, `trace-render`, `claim`, `note`): regenerated regions and set stamp, written by the generator.
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts`, `scripts/runnable-ref/upstream.test.ts`: re-derived, dated pins.

## Decisions Made
See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two consumer pins the plan did not list**
- **Found during:** Task 3 (check-foundation-guards.test.ts)
- **Issue:** upstream-model.ts now imports `unfencedHeadingIndices` and `sectionEndIndex`, as the plan required, so it joined two derived sets: the frontmatter.js consumer list and `LOCATOR_CONSUMERS`. Plan 45-03 hit the same pins for build-request-model.ts.
- **Fix:** Each set was re-derived with its own command (`git ls-files … | xargs grep -l 'from "./frontmatter.js"'`), which reported 17 consumers. The frontmatter consumer list moved 16 → 17 and `LOCATOR_CONSUMER_COUNT` 10 → 11, each with a dated note. A new assertion limits upstream-model.ts to the two locator symbols.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Committed in:** d0cee871

**2. [Rule 3 - Blocking] The tripwire module count moved**
- **Found during:** Task 3
- **Issue:** `TRIPWIRE_MODULES` counts `scripts/*.test.ts` exactly, and the new test file is one more.
- **Fix:** 88 → 89, re-derived with `ls scripts/*.test.ts | wc -l`, with a dated note. The plan named the test-module count in this file; this is that count.
- **Committed in:** d0cee871

**3. [Rule 1 - Locator] The stat fault case in scripts/runnable-ref/upstream.test.ts**
- **Found during:** Task 3
- **Issue:** The EACCES case finds the `statSync` site by its enclosing function. The plan moved that stat, unchanged, into `upstreamGitOpen`.
- **Fix:** The locator names `upstreamGitOpen`, with a dated comment. The expected stdout, stderr and exit code are unchanged. The file was not in `files_modified`.
- **Committed in:** d0cee871

---

**Total deviations:** 3 auto-fixed (all registrations of changes the plan asked for).
**Impact on plan:** None changes a grammar, a message the plan fixed, or a reader's output.

## Issues Encountered
- Between Task 2 and Task 3, the committed runnable regions were stale, which the plan accepted (its "Accepted risk" section). Task 3 regenerated them, and a second generator run reported `0 changed`.
- The full suite was not run here, on the orchestrator's instruction. The targeted suites were run: upstream, upstream-model, upstream-git, validate, context-io, read-sites, runnable-exit-contract, generate-runnable-embeds, check-foundation-guards, mode-census and floor-invariance. All passed: 1789 + 344 + 136 + 20 + 256 cases, with 1 skip that was already there.

## Verification
- `npx vitest run scripts/upstream-model.test.ts scripts/upstream-git.test.ts scripts/runnable-ref/upstream.test.ts scripts/validate.test.ts -t upstream`: 247 passed
- `npm run freshness:runnable-embeds`, `npm run freshness` (97 .js fresh), `npm run typecheck`, `npm run freshness:hook-manifest`, `npm run check:state-paths`: all exit 0
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED
- Acceptance greps: `export const UPSTREAM_ESCALATION_DAYS_DEFAULT = 10;` (1 line); `the allowed keys are: sources, escalation_days` (1); `export function upstreamCitationFindings` (1); `export function upstreamStatementOf` (1); `spawnSync` outside comments in upstream-model.ts (0); `export function upstreamGitDescends` (1); `GIT_GRAFT_FILE` (4); `merge-base` in upstream-git.test.ts (7)

## Open items
- **`UNKNOWN - verify`:** `GIT_GRAFT_FILE` set to `devNull` (`\\.\nul` on Windows) is untested on Windows git (research A6). The graft and recording cases ran on Linux only. The recording and partial-clone cases are skipped on win32 because their git wrapper is a POSIX shell script.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 45-07 (`requests`) can call `upstreamGitManifestAt`, `upstreamGitListedBlobs`, `upstreamIdFacts`, `upstreamChangedIds` and `upstreamGitDescends`. It will need to add them as roots of the upstream.ts embed row. For upstream-model's new decisions, scripts/frontmatter.ts and scripts/trace-model.ts must come before scripts/upstream-model.ts in that row, or the generator refuses the sibling import. Today frontmatter.ts comes after it.
- Plan 45-08 (the validator) can call `upstreamCitationFindings` with `upstreamGitManifestAt` as `manifestAt`, and `upstreamStatementOf`.

## Self-Check: PASSED
- FOUND: scripts/upstream-git.test.ts, scripts/upstream-model.ts, scripts/upstream-git.ts
- FOUND (ancestors of HEAD): 5758facf, c8d93d3c, ecca2591, 028c16f6, 70eb0fd6, d0cee871

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*
