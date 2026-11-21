---
phase: 41-orchestrator-flow-guidance
plan: 26
subsystem: kit-text
tags: [workflow-16, workflow-17, workflow-05, role-switch, propose_note, admission-hook, sweep, wording-pins, override-round]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "plan 41-25: the plugin install counted as a host (D-44) and Workflow 16 step 4 scoped to a repository holding grugops's own scripts/context-io.js"
provides:
  - "Workflow 16, the note contract, both CHANGELOG bullets and R-41-11 scope propose_note and the hook to a Claude Code plugin install, and say a standalone Claude Code install has no hook"
  - "Workflow 17 session start step 3 stops on each kept or left line and never re-spawns a task named there"
  - "The role-switch protocol routes a deliverable by step 3 of Workflow 16"
  - "Workflow 05's escape hatch scopes the Step-4 stamp route and names the host route"
  - "17 pending (named human) disposition rows in docs/audit/29-style-dispositions/41-26.md"
  - "WR-18, WR-19, IN-19 and IN-20 recorded fixed with plan 41-26; open: 0"
affects: [gsd-verify-work 41, phase 41 UAT re-run, later phase for WR-16, WR-17, IN-16, IN-17, IN-18]

actuals:
  tokens: 9829
  tasks: 3
  commits: 5
plan_head_before: a9557964e3550f16151706b09da2e8706606a43c
plan_head_after: 44c276794706429454c07bd3d321959af09f6d6d

tech-stack:
  added: []
  patterns:
    - "A moved pin carries a comment naming the plan, the decision and the review id"
    - "A moved pin that would still pass on the old text gets a negative order assertion so it fails RED"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-26.md
  modified:
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/contracts/context-note.md
    - CHANGELOG.md
    - docs/audit/41-residuals.md
    - scripts/flow-guidance-text.test.ts
    - docs/audit/29-style-dispositions/41-11.md
    - docs/audit/29-style-dispositions/41-20.md
    - docs/audit/29-style-dispositions/41-23.md
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "WR-18: the STRUCTURED-tool sentence of Workflow 16 step 3 is scoped to a plugin install too, because it made the same claim on the line the gap names"
  - "WR-18: the line-43 route sentence is 18 words, not the review's 22, to keep the WP-02 bound of 20 for a Steps bullet"
  - "WR-19: the existing 18-word stop sentence moves word for word to the front, plus 'Never re-spawn a task named on such a line.'; the optional claim refusal is code and was not made (D-45)"
  - "IN-19 and IN-20: the condition defers to Workflow 16 steps 3 and 4, because under D-44 'where a gate stamp exists' reads true on a plugin install"

patterns-established:
  - "Pattern: a pointer note under an older disposition table names the clauses a later plan rewrote and the file holding their new rows"

requirements-completed: [RUN-01, RUN-02, RUN-03, RUN-04, RUN-05]

coverage:
  - id: D1
    description: "Workflow 16 step 3 and its third admission outcome, the note contract, both CHANGELOG bullets and R-41-11 name a Claude Code plugin install for propose_note and the hook, and say a standalone Claude Code install has no hook (WR-18)"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the text-only four of the override round (plan 41-26; WR-18, WR-19, IN-19, IN-20, D-45)"
        status: pass
      - kind: other
        ref: "R-41-11 decision, why and what-closes-it cells diffed against 260eed07 with awk: identical"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 17 session start step 3 opens with the stop on a kept or left line and forbids the re-spawn of such a task before any re-spawn instruction (WR-19)"
    requirement: RUN-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#session start step 3 opens with the stop on a kept or left line, before any re-spawn (WR-19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The role-switch protocol sends a deliverable to artifact-ref only where step 3 of Workflow 16 admits one, and Workflow 05 scopes the Step-4 stamp route and names the host route (IN-19, IN-20)"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the role-switch protocol routes a deliverable by step 3 of Workflow 16 (IN-19, D-44)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 05 scopes the escape-hatch stamp route and names the host route, before the closing sentences (IN-20, D-44)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The 17 pending (named human) disposition rows of 41-26.md, and R-41-11 as rewritten, read against the diff and Olger's acceptance"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js (0 findings over 28/28 elements)"
        status: pass
    human_judgment: true
    rationale: "No agent may accept a residual or a disposition row; the gate proves each changed clause has a row and cannot prove a disposition is right"

duration: 33min
completed: 2026-11-12
status: complete
---

# Phase 41 Plan 26: The text-only four of the override round Summary

**The kit now says `propose_note` and the admission hook exist only on a Claude Code plugin install, that a standalone Claude Code install has no hook, that session start never re-spawns a kept claim, and that a host routes deliverables and the gate stamp by Workflow 16. Olger's acceptance of R-41-11 is unchanged, and no program code changed.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-11-12T20:45:53Z
- **Completed:** 2026-11-12T21:19:41Z
- **Tasks:** 3
- **Files modified:** 13 (1 created, 12 modified)

## Accomplishments

- **WR-18:** Workflow 16 step 3 (the route sentence and the STRUCTURED-tool sentence), its third admission outcome, the note contract, the CHANGELOG `### Changed` and `### Security` bullets and R-41-11's what-stays-open cell now name a Claude Code plugin install. Workflow 16 step 3, the third admission outcome and R-41-11 say a standalone Claude Code install has no hook. R-41-11's decision, why and what-closes-it cells are byte-identical to `260eed07`. Its ruling bullet says plan 41-26 did not edit the acceptance.
- **WR-19:** Workflow 17 session start step 3 opens with `Stop and name each entry ... so a human resolves it. Never re-spawn a task named on such a line. Finish each other claim still in now-running.md.`
- **IN-19:** role-switch step 4 is now two lines. Deliverables go to `artifact-ref` where step 3 of Workflow 16 admits one, and otherwise to an `observation` carrying their refs.
- **IN-20:** the Workflow 05 escape hatch now says `This route exists only where emitVerdict runs, in a repository holding grugops's own scripts/context-io.js. On a host, degrade to a claim or escalate, per Workflow 16 step 4.` These two sentences sit straight after the stamp sentence.
- 17 `pending (named human)` rows in `41-26.md`, with no `accepted` row. 41-11.md, 41-20.md and 41-23.md each point to it. The four ledger rows read `fixed | 41-26`, `open: 0`, and the eight `deferred` rows are unchanged.

## Task Commits

1. **Task 1 (tracer): the admission route scoped to a plugin install.** RED `93a3f77c` (test), GREEN `1635335b` (docs)
2. **Task 2: session start, the role-switch route and the Workflow 05 scope, plus disposition rows.** RED `38240e86` (test), GREEN `0be05dff` (docs)
3. **Task 3: ledger fixed, older rows point to 41-26.md, phase gate by name.** `44c27679` (docs)

## TDD record

- **Task 1 RED:** `npx vitest run scripts/flow-guidance-text.test.ts --reporter=tap-flat` failed 10 tests: the 5 moved pins and the 5 new ones, all on `toContain`/`not.toContain` assertions. The full-file TAP report was refused by the classifier as `invalid_record` (`Malformed TAP`), because vitest writes multi-line actual strings into the YAML block. The target was therefore re-run alone with `-t "scopes the route to a plugin install and says a standalone install has no hook"`, and that run returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on its assertion because step 3 still read "on Claude Code". GREEN: the 4 test files passed 416/416.
- **Task 2 RED:** 8 failed: the 3 moved session-start pins and the 5 new ones. The moved empty-`by` pin at first still passed on the old text, so it gained `not.toContain("holds no usable record. Stop and name each entry")` and then failed. Target `session start step 3 opens with the stop on a kept or left line, before any re-spawn (WR-19)` returned `RED_EVIDENCE_OK`. Semantic assessment: it failed its `startsWith` assertion because step 3 still opened with `Finish each claim`. GREEN: 421/421.

## Full-suite comparison

- Command: `npx vitest run --exclude '**/scripts/e2e/**'` at `44c27679`, run in the background on the default `TMPDIR`. It took 1,578.77 s and exited 1.
- Result: 7 files failed, 137 passed. 21 tests failed, 11,729 passed and 2 were skipped.
- Compared by name (`comm` over the sorted `FAIL <file> > <describe> > <test>` lines and the table in 41-VALIDATION.md § Known baseline reds): **all 21 failed names are the 21 baseline names**. No failed name falls outside the table, and no baseline name passed.
- The log has no `Unknown system error -122` or EDQUOT line. No name fell outside the table, so no file was re-run alone and no pre-plan worktree run was needed.
- The 21 names: `install/installer-fs-census.test.ts` (1), `scripts/canonical-corpus.test.ts` (1), `scripts/check-foundation-guards.test.ts` LANG-07 LIVE COUNT (1, which stays red while the user's untracked `~/` exists), `scripts/context-io-writer-set.test.ts` (2), `scripts/context-io.test.ts` (7), `scripts/harness-instance-ledger.test.ts` (4) and `scripts/uat-gate-exit-contract.test.ts` (5). Each matches its row in § Known baseline reds word for word.

## Gates run

All exited 0: `npm run build`, `npm run typecheck`, `check-imperative-lexicon`, `check-role-rules`, `check-kit-refs`, `check-diff-disposition` (0 findings over 28/28 elements with 41-26.md in place; 15 without it), `check-banned-claims`, `check:residual-citations`, `check:audit-register`, `check:public-docs`, `check:claim-anchors`, `validate-agent-factory`, `check-foundation-guards`, `check-state-paths`, `check-uat-oracles`, the adapters, catalog, skill-twins, host-entries and guarantees freshness checks, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:queue` and `freshness:context`. After the Task 3 commit, `npm run freshness` and `scripts/floor-invariance.test.ts` (136/136) also passed.

Scope checks: the only `.ts`, `.js` or `.json` path in `git diff --name-only a9557964 HEAD` is `scripts/flow-guidance-text.test.ts`. 41-SECURITY.md, 41-UAT.md, 41-VERIFICATION.md and 41-VALIDATION.md have no diff. `docs/audit/28-prepass-evidence.md` is still modified and unstaged. No commit of this plan names it, `brand/readme-art.txt` or `~/`.

## Files Created/Modified

- `agent-factory/workflows/16-context-read-write.md`: step 3 has the route and STRUCTURED-tool sentences scoped, plus the standalone sentence. The third admission outcome has the route and no-hook sentences.
- `agent-factory/workflows/17-task-claim.md`: session start step 3 reordered, with the never-re-spawn sentence added.
- `agent-factory/workflows/05-pr-quality-gate.md`: two IN-20 sentences in the escape-hatch paragraph.
- `agent-factory/roles/_role-switch-protocol.md`: step 4 line 21 split into lines 21 and 22.
- `agent-factory/contracts/context-note.md`, `CHANGELOG.md`: route clauses scoped and rewrapped. The renamed-file phrase and the plugin-install phrase each stay on one line.
- `docs/audit/41-residuals.md`: R-41-11's what-stays-open cell, the `**Written:**` line and the ruling bullet.
- `scripts/flow-guidance-text.test.ts`: 8 moved pins and the new plan 41-26 describe with 10 cases.
- `docs/audit/29-style-dispositions/41-26.md` (new) and the pointer notes in 41-11.md, 41-20.md and 41-23.md.
- `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md`: four rows fixed, `open: 0`.

## Decisions Made

Each wording that differs from the review's suggested fix is listed with its reason in the header of `41-26.md` and in key-decisions above. All of them follow the plan's `<planning_notes>`.

## Older sites left for a later ruling

The plan left these alone, so they are listed here for the human to rule on later:
- Workflow 16 line 32: the finding sub-bullet, with the per-call hook sentence and "The Claude Code primary tier".
- `agent-factory/contracts/context-note.md` line 138.
- Workflow 04 line 53 ("Only the Claude Code `propose_note` tool binds it"). It names the tool, not where the tool exists.
- Role files that name `artifact-ref` for a deliverable, such as software-engineer.md. R-41-10 records these, and Olger accepted the scripted-install limit on 2026-11-12.
- The CHANGELOG has no line for WR-19, IN-19 or IN-20. The review names no changelog site for them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The moved empty-`by` pin did not fail RED**
- **Found during:** Task 2 RED
- **Issue:** After the move, the pin still passed on the old text, because both empty-`by` sentences and the stop sentence were already present. It could not catch a wrong order.
- **Fix:** Added `not.toContain("holds no usable record. Stop and name each entry")`, the old stop-last order. The pin then failed RED and passed GREEN.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Committed in:** 38240e86

**2. [Rule 3 - Blocking] The RED evidence report was refused as malformed TAP**
- **Found during:** Task 1 RED
- **Issue:** The `tap-flat` report of the whole file held multi-line YAML actual strings, so the classifier returned `invalid_record`.
- **Fix:** Re-ran the target alone with `-t`, which gave a clean report and `RED_EVIDENCE_OK`. The test and the kit text did not change.

The plan names five moved pins in Task 1: the 41-11 STRUCTURED-tool pin, the three WR-14 pins of 41-20 and the WR-13 pin of 41-23. Its text calls them "four"; this plan moved all five.

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). **Impact:** neither touched kit text or scope.

## Issues Encountered

None.

## Owed to a named human (not filled by any agent)

- The 17 `pending (named human)` rows of `41-26.md`, and the earlier ones in 41-19.md to 41-25.md.
- A read of R-41-11 as rewritten, against Olger's reply in 41-UAT.md test 8. It should confirm that his acceptance covers a standalone Claude Code install having no route.
- The live runs on other hosts (R-41-05) and the Windows check stay `UNKNOWN - verify`.

## User Setup Required

None.

## Next Phase Readiness

All 26 plans of phase 41 have summaries. `/gsd-verify-work 41` can reconcile gaps G-41-9-WR-18, G-41-9-WR-19, G-41-9-IN-19 and G-41-9-IN-20. WR-16, WR-17, IN-16, IN-17 and IN-18 stay deferred to a later phase (D-45).

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-26.md, scripts/flow-guidance-text.test.ts
- FOUND commits: 93a3f77c, 1635335b, 38240e86, 0be05dff, 44c27679 (all ancestors of HEAD; `check evaluation-scope --plan 41-26` resolves them)
- Every acceptance criterion of Tasks 1 to 3 was re-run and passed. The plan-level verification passed. The suite ends on the 21 baseline names.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*
