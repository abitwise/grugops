---
phase: 41-orchestrator-flow-guidance
plan: 14
subsystem: tooling
tags: [note-writer, role-name-fold, admission, governance-root, kit-text, residuals]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "The fail-closed trustedRepoRoot ladder and namedRootAnswers (plan 41-13), whose behaviour this plan writes down"
provides:
  - "canonicalRoleName: the one fold of a role name, asked by isHighSeverityRole and by note.js --by"
  - "A note.ts header, TRUSTED_ROOT_TIERS and three residuals that say what the ladder does"
  - "Workflow 16 states the two ladder rules and a stop for a root that cannot be named, and Workflow 17 points at it"
  - "R-41-07 closed with its limits, and R-41-08 recorded as Not accepted"
affects: [41-15, 41-16]

actuals:
  tokens: 10596
  tasks: 3
  commits: 6
plan_head_before: 5ae6480b183d66d7624f77152e979c9f9fb73b12
plan_head_after: 95bb1a2bf5a3a14b3328ab6b5bdecd2e3a6da2a6

tech-stack:
  added: []
  patterns:
    - "A fold a host program needs enters through the EMBED_SPECS root, so it is the authority's and is not retyped"
    - "A new stop bullet moves WORKFLOW_STOP_BULLET_COUNT and carries a written re-walk of the tagging list"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-14.md
  modified:
    - scripts/context-io.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.test.ts
    - scripts/context-io.test.ts
    - scripts/flow-guidance-text.test.ts
    - scripts/checkpoints.ts
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - docs/audit/41-residuals.md
    - CHANGELOG.md
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "The root-refusal stop carries no checkpoint tag: the program refuses at every dial value, so a tag would say a checkpoint can lower it"
  - "The residuals say a delivered root with no configuration can also stand, because the code does that where the walk finds nothing; the plan's wording named only two outcomes"
  - "The admit arity message drops 'Set CLAUDE_PROJECT_DIR to move it', because a name with no configuration moves nothing and no text coaches a variable"

patterns-established:
  - "A text pin for a stop asserts what the stop must not name, so it cannot grow into a recipe"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "T-41-30: the five spellings end exit 2 with one Error line naming security-nfr, and no note is written, on a lone host copy under human_admission: all"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#--by folds as the classifier folds, so no spelling of an adapter name steps around it (T-41-30)"
        status: pass
    human_judgment: false
  - id: D2
    description: "An honest role name is unchanged: qe-e2e ends noted with its by field as given, and the 41-07 adapter refusal still names the fix"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/note.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each new Workflow 16 and 17 sentence is pinned word for word, and the stop names no project-directory variable"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/flow-guidance-text.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "TRUSTED_ROOT_TIERS and R-31-19-02, -05 and -06 match the code, and the admit arity message tells no caller to set a variable"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the published order says when the kit answers and what happens to a root with no configuration (plan 41-14)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#each residual that said tier 0 never reaches the walk states the condition plan 41-13 added"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#a caller-supplied contextRoot/repoRoot is refused as an arity error"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 17 rows of docs/audit/29-style-dispositions/41-14.md read true against the diff"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves a row exists and cannot judge the meaning, so a named human reads each pending row against the diff"
  - id: D6
    description: "R-41-07's closure and its stated limits, and R-41-08 accepted or rejected by name"
    requirement: RUN-05
    verification: []
    human_judgment: true
    rationale: "No agent may accept a residual, and 41-SECURITY.md records that no human has signed the accepted-risks log"

duration: 63min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 14: One role-name fold and text that matches the ladder Summary

**`note.js --by` now folds with the classifier's own `canonicalRoleName`, so all five T-41-30 spellings stop at argv on a lone host copy, and the note.ts header, Workflows 16 and 17, the published order and the residuals say what plan 41-13 built.**

## Performance

- **Duration:** 63 min, of which about 49 min was two full-suite runs
- **Started:** 2026-11-05T18:45:26Z
- **Completed:** 2026-11-05T19:49:22Z
- **Tasks:** 3
- **Files modified:** 28 (14 by hand, 14 by the generators, the build and `gsd_run windows`)

## Accomplishments

- Each of the five spellings ended `noted`, exit 0, at the start. Each now ends exit 2, names `security-nfr`, and leaves no note.
- The fold exists once. `isHighSeverityRole` and `noteAuthor` both ask `canonicalRoleName`, and `noteAuthor` adds no severity rule and names no role. `admit()` was not touched.
- The false sentence 41-SECURITY.md names is gone from the note.ts header. It now says an environment variable can move the dial (`R-31-15-03`).
- A role that meets the root refusal has a written stop, and the stop tells it not to set a project-directory variable.
- R-41-07 says what closed it and what stays open. R-41-08 records the rename route as Not accepted. Ledger rows 327 and 328 are fixed, and row 329 stays open for the live run.

## Task Commits

1. **Task 1: every spelling the classifier folds to an adapter name is refused**
   - `1e5e4411` (test, RED)
   - `e40b93af` (feat, GREEN)
2. **Task 2: the header, the published order and Workflows 16 and 17**
   - `9c35cb8e` (test, RED)
   - `a1c1d059` (feat, GREEN)
3. **Task 3: the records** - `07900407` (docs)

**Deviation fix:** `95bb1a2b` (fix), the stop-bullet count. See Deviations.

The tracer gate ran after Task 1: its `<verify>` passed end to end, and expansion went ahead.

## RED evidence

Each RED run went through `gsd_run check tdd-red-evidence` and returned `RED_EVIDENCE_OK`, `target_test_failed`. `tap-flat` emits only the full `file > suite > test` name, so a first record of each task with a shorter target returned `INVALID_RED`, and the target was corrected. The test did not change.

- **Task 1:** the target was the T-41-30 case. It failed on `expected +0 to be 2`, with `noted`, exit 0, for the first spelling. That is the planned behaviour. The loop stops at its first failure, so all five were also run by hand on a lone copy of `note.js` under `all`, and each ended `noted`, exit 0.
- **Task 2:** the target was the published-order case. It failed on `expected '4. The kit this module ships in.' to be '4. The kit this module ships in, only…'`, which is the old tier text. The full RED run had 7 failed in scripts/flow-guidance-text.test.ts and 3 in scripts/context-io.test.ts.

## Measured after the fix

On a lone copy of `note.js` from this plan's commits, under `human_admission: all`:

- `x-security-nfr`, `security-nfr-x` and `securitynfr` end `noted`, exit 0. That is the route R-41-08 records.
- `se<ZWSP>curity-nfr`, `ｓecurity-nfr`, `security－nfr`, `secu rity-nfr`, `SECURITY-NFR` and ` security-nfr` end refused, exit 1, so a spelling of a real role name stays with the authority.
- `HOME=/nonexistent` and `HOME=` refuse every note, an observation included, in a repository with no configuration as well. That is the behaviour the CHANGELOG names.

## Verification

- All three tasks' `<automated>` commands passed, and every acceptance grep gave its expected value.
- Task 2's `scripts/context-io.test.ts` run: 7 failed, 745 passed, 1 skipped. All 7 are in 41-VALIDATION.md § Known baseline reds.
- `node scripts/check-foundation-guards.js`, the validator, `npm run freshness:runnable-embeds`, `npm run freshness:hook-manifest` and `npm run freshness` passed at `95bb1a2b`, with 91 committed `.js` files fresh.
- **Full suite** (`npx vitest run --exclude '**/scripts/e2e/**'`, at `95bb1a2b`, 1,470 s): 21 failed, 11,544 passed, 2 skipped. Compared by name, the 21 failures are exactly the 21 names in § Known baseline reds, with none added and none missing. No EDQUOT appeared in the output.
- The first full run, at `07900407`, gave 22 failures. The extra one is deviation 2 below.

## Decisions Made

- The root-refusal stop carries no `checkpoint:` tag. The program refuses at every value of every dial, so no human disposes it, and a tag would say a checkpoint value can lower it.
- The disposition rows use D-35 as their rule, the gap closure of the note writer. A row for `WF16 names the stop.` is added though the gate raised no finding for it, so the file has 17 rows for 16 findings.
- R-41-07's `why it was accepted` cell stays word for word. A fix needs no acceptance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The `admit` arity message still told a caller to set a variable**
- **Found during:** Task 2, from the `For plan 41-14` list of 41-13-SUMMARY.md
- **Issue:** the message said to set `CLAUDE_PROJECT_DIR` to move the root. Since plan 41-13 a name with no configuration moves nothing, and the plan named no fix for this line.
- **Fix:** the message now says the named root answers when it carries a configuration, and it no longer tells a caller to set anything. The arity case pins both.
- **Files modified:** scripts/context-io.ts, scripts/context-io.test.ts
- **Verification:** the arity case passes
- **Committed in:** `9c35cb8e`, `a1c1d059`

**2. [Rule 1 - Bug] The new stop bullet moved a count the plan did not name**
- **Found during:** the full suite after Task 3
- **Issue:** `scripts/checkpoints.test.ts > walks every workflow and locates every stop section, at full cardinality` went red: 49 stop bullets against the recorded 48. The plan's measurements did not run this file, and neither did Task 2's verify.
- **Fix:** `WORKFLOW_STOP_BULLET_COUNT` moved to 49 with a written re-walk of the tagging list, and the stop's disposition row says the bullet is untagged and why. This adds `scripts/checkpoints.ts` and `.js` to the plan's 26 files.
- **Files modified:** scripts/checkpoints.ts, scripts/checkpoints.js, hooks/hook-entry.ts, hooks/hook-entry.js, docs/audit/29-style-dispositions/41-14.md
- **Verification:** scripts/checkpoints.test.ts passes, and the full suite was run again at `95bb1a2b`
- **Committed in:** `95bb1a2b`

**3. [Rule 1 - Bug] The plan's residual wording named two outcomes where the code has three**
- **Found during:** Task 2
- **Issue:** the plan asked the residuals to say a delivered root with no configuration runs the walk, "which can only name a configured root or refuse". `trustedRepoRoot` has a third outcome: where the walk finds nothing, the delivered root stands.
- **Fix:** `R-31-19-02` and `R-31-19-06` state all three. No `id`, `hosts` value or disposition changed.
- **Files modified:** scripts/context-io.ts
- **Verification:** the residual case in scripts/context-io.test.ts passes, and Workflow 16 says `Otherwise the named root stands.`
- **Committed in:** `a1c1d059`

---

**Total deviations:** 3 auto-fixed (3 Rule 1).
**Impact on plan:** Each one keeps a sentence or a count true. No behaviour moved past the plan's design.

## Issues Encountered

- `status: closed by plan 41-13` in deferred-items.md is the value the plan asks for, and the scanner treats only `status: resolved` as resolved. That entry will keep surfacing in `audit-open`. CR-01 stays open inside it, so this seems right, and a human can change it.
- Two out-of-scope items are logged in deferred-items.md. The hook's catch in hooks/admission-guard.ts tells a reader to export the approval variable, which does not help when a root cannot be named. The CLI comment in scripts/context-io.ts still lists `admit ... [root]`.
- The `R-31-15-01` citations stand as the plan asked. Step 3 of Workflow 16 now carries `R-31-15-01` and `R-31-15-03` for one capability, and the row names T-41-34 for a human to see the pair.

## Requirements

RUN-02 and RUN-05 are declared by plans 41-15 and 41-16 too, so `requirements.ready-ids` blocks them until the last of those finishes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 41-15. A named human owes three reads: the 17 pending rows of 41-14.md, R-41-07's closure, and R-41-08. This plan wrote no acceptance, filled no earlier `pending (named human)` row, and changed neither 41-SECURITY.md nor 41-REVIEW-DISPOSITION.md. The rename route and a root a process names with its own configuration stay open. Windows stays `UNKNOWN - verify`.

## Self-Check: PASSED

All six commits are ancestors of HEAD. Every file in `key-files` exists. `git diff --quiet 0e780dfc` on 41-02, 41-04, 41-06, 41-08 and 41-11 dispositions, 41-SECURITY.md and 41-REVIEW-DISPOSITION.md exits 0.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
