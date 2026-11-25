---
phase: 44-upstream-source-declaration-and-pin-check
plan: 13
subsystem: kit-workflows
tags: [upstream, workflow-20, workflow-17, blocked-reason, lang-03, cr-02, up-04, up-05]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: "Plans 44-09 to 44-12: path grammar (one blob= per BEGIN line), positional and label-based reasons, the runnable-version-skew line, the partial-clone guard and the <listed path> redaction"
provides:
  - "Workflow 20 step 5, the read stop condition and the done condition set the fixed BLOCKED reason `upstream <source>: <cause>` (cause: blob-mismatch or UNKNOWN - verify)"
  - "Workflow 20 step 2 still reports every printed line, and states that outside the fence the reader prints no manifest or listed-file text except a grammar-checked ID"
  - "Workflow 20's END-line bullet names the one-blob= BEGIN line"
  - "Workflow 17 session-start step 4 reports BLOCKED with the reason Workflow 20 names, pinned by flow-guidance-text.test.ts"
  - "docs/audit/29-style-dispositions/44-13.md: 7 added rows replacing 5 stale 44-07/44-08 rows"
affects: [44-14, gsd-verify-work 44, UP-05 live red-team round]

actuals:
  tokens: 6770
  tasks: 2
  commits: 2
plan_head_before: 24cfc656f1a2de6cef03b86a1b7e6ca8fa29ec08
plan_head_after: e5c60883f8b5c184c78d94b30220f1c12c08d9d1

tech-stack:
  added: []
  patterns:
    - "A BLOCKED reason set from reader output is a fixed template that names only the source id and a closed cause word; the full line goes to the human report, never into board state"

key-files:
  created:
    - docs/audit/29-style-dispositions/44-13.md
  modified:
    - agent-factory/workflows/20-upstream-sources.md
    - agent-factory/workflows/17-task-claim.md
    - scripts/flow-guidance-text.test.ts
    - docs/audit/29-style-dispositions/44-07.md
    - docs/audit/29-style-dispositions/44-08.md

key-decisions:
  - "A BLOCKED reason for an untrusted upstream source is the fixed template `upstream <source>: <cause>`, where the cause is `blob-mismatch` or `UNKNOWN - verify`; no other printed text goes into a reason (CR-02, D-14, D-17)"
  - "The Workflow 20 step-2 sentence follows the reader header's own claim (no manifest or listed-file text outside the fence except a grammar-checked ID) instead of the plan's broader target wording, which would have been untrue"

patterns-established:
  - "Rewording a clause already dispositioned in an earlier plan: delete the stale row and write an added row in the new plan's file, checked against changedClauses (CHECK_ROOT set to the repo root)"

requirements-completed: [UP-05, UP-04]

coverage:
  - id: D1
    description: "Workflow 20 step 5, the read stop condition and the done condition set the fixed reason `upstream <source>: <cause>`; the old routing phrases are gone"
    requirement: UP-05
    verification:
      - kind: other
        ref: "grep -c 'printed line as its reason' = 0; grep -c 'with that line as its reason' = 0; grep -cF 'upstream <source>: <cause>' = 2; grep -cF 'upstream <source>: UNKNOWN - verify' = 1 (agent-factory/workflows/20-upstream-sources.md)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 20 keeps its 10 section headings and 6 stop bullets; the END-line bullet names exactly one blob= on the BEGIN line"
    requirement: UP-05
    verification:
      - kind: other
        ref: "heading diff and stop-bullet count against git show HEAD (exit 0); grep -c 'exactly one `blob=`' = 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Workflow 17 session-start step 4 reports BLOCKED with the reason Workflow 20 names, pinned by an exact-sentence test"
    requirement: UP-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#session start step 4 reports the pin check and routes untrusted sources to BLOCKED per Workflow 20 (D-14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every reworded clause has a disposition row, the stop-condition row has its companion cell, and no stale row remains"
    verification:
      - kind: other
        ref: "npm run check:diff-disposition (ALL CHECKS PASSED)"
        status: pass
      - kind: unit
        ref: "scripts/check-diff-disposition.test.ts, scripts/floor-invariance.test.ts (post-commit)"
        status: pass
    human_judgment: false
  - id: D5
    description: "An LLM Orchestrator actually writes the fixed reason, and no upstream text, into board state at session start"
    requirement: UP-05
    verification: []
    human_judgment: true
    rationale: "Kit text is guidance to a live agent; whether the agent follows it is runtime model behavior, covered by the UP-05 live red-team round still owed in 44-VERIFICATION.md"

duration: 12min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 13: Fixed BLOCKED reason in Workflows 20 and 17 (CR-02, kit half) Summary

**Workflow 20 and Workflow 17 now mark a subtask on an untrusted upstream source `BLOCKED` with the fixed reason `upstream <source>: <cause>` (cause `blob-mismatch` or `UNKNOWN - verify`). No step, stop condition or done condition copies a printed line into board state. The human still gets every line in the step-2 report, and the fence bullet names the one-`blob=` BEGIN line.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-25T15:10:58Z
- **Completed:** 2026-11-25T15:23:00Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 6 (1 created)

## Accomplishments

- The kit half of CR-02 is closed. Workflow 20 step 5 now reads: "Mark each such subtask `BLOCKED` with the reason `upstream <source>: <cause>` (Orchestrator). The cause is `blob-mismatch` or `UNKNOWN - verify`; never put other printed text in a reason." The `read` stop condition uses the reason `upstream <source>: UNKNOWN - verify`, and the done condition uses the same template. A reworded reader line can no longer reach board state, even if a later change let text leak into a check line.
- UP-04 still holds. A BLOCKED subtask still names its source and its cause, and step 2 still reports every printed line to the human. Step 2 also says: "Outside the fence, the reader prints no text from the manifest or a listed file, except a grammar-checked ID."
- The END-line bullet of `## Untrusted upstream text` now reads: "The BEGIN line holds exactly one `blob=`, and only the END line with that blob id closes the fence." Plan 44-09 made this true.
- The third sentence of Workflow 17 session-start step 4 now reads: "On `blob-mismatch` or `UNKNOWN - verify`, report each subtask reading that source as `BLOCKED` with the reason Workflow 20 names." flow-guidance-text.test.ts pins that sentence and asserts that `printed reason` is absent. The five-step order test is unchanged.
- LANG-03 records are current. Five stale rows are gone (four from 44-07.md, one from 44-08.md). 44-13.md holds 7 added rows, each checked against the gate's own `changedClauses` segmentation. The stop-condition row carries a companion cell for Workflow 20's `## Stop conditions`. `npm run check:diff-disposition` reports ALL CHECKS PASSED.
- Structure is unchanged: the same 10 section headings and 6 stop bullets as at HEAD, so WORKFLOW_STOP_BULLET_COUNT did not move. No new lexicon or banned-claims term had to be registered.

## Task Commits

1. **Task 1 (tracer): Workflow 20 fixed BLOCKED reason, fence sentence, 44-07 to 44-13 rows** - `597f0fc8` (fix)
2. **Task 2: Workflow 17 step 4 points to Workflow 20's reason, test pin, 44-08 to 44-13 row** - `e5c60883` (fix)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified

- `agent-factory/workflows/20-upstream-sources.md`: steps 2 and 5, the END-line bullet, the `read` stop condition, the done condition
- `agent-factory/workflows/17-task-claim.md`: session-start step 4, third sentence
- `scripts/flow-guidance-text.test.ts`: the step-4 exact-sentence pin with a dated comment (plan 44-13, CR-02), plus a `not.toContain("printed reason")` assertion
- `docs/audit/29-style-dispositions/44-13.md` (new): header naming plan 44-13, CR-02 and the five replaced rows; 7 added rows
- `docs/audit/29-style-dispositions/44-07.md`: 4 stale Workflow 20 rows removed (lines 28, 46, 52, 64)
- `docs/audit/29-style-dispositions/44-08.md`: 1 stale Workflow 17 row removed (line 87, third sentence)

## Decisions Made

- The BLOCKED reason is a closed template: the source id plus one of two cause words. This is defense in depth on top of plans 44-09 to 44-12. Reader output, however it is worded, stays in the human report.
- The step-2 sentence states the reader's actual guarantee, in the words of the upstream.ts header, not the plan's target wording (see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] The step-2 sentence states the grammar-checked ID exception**
- **Found during:** Task 1
- **Issue:** The target wording, "The reader prints no manifest or upstream file text outside the fence.", is not true. The reader prints manifest IDs outside the fence once they pass the ID grammar (for example `superseded <ID> by <successor>`, and reasons that name an ID). The upstream.ts header states that exception. The kit must not claim more than the code does.
- **Fix:** Step 2 now says "Outside the fence, the reader prints no text from the manifest or a listed file, except a grammar-checked ID." (18 words, within WP-02.) The meaning the plan asked for, that no free upstream text reaches the report outside the fence, is kept. Flagged assumption A2 allowed rewording to keep the meaning.
- **Files modified:** agent-factory/workflows/20-upstream-sources.md, docs/audit/29-style-dispositions/44-13.md
- **Verification:** check:diff-disposition, check:imperative-lexicon, check:banned-claims and check:claim-anchors all pass
- **Committed in:** 597f0fc8

**2. [Minor] A negative assertion in the step-4 test**
- **Found during:** Task 2
- **Issue:** An exact-sentence pin alone would not fail if a second sentence brought the old phrase back.
- **Fix:** Added `expect(step).not.toContain("printed reason")` beside the updated pin.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Committed in:** e5c60883

---

**Total deviations:** 2 (1 accuracy fix, 1 small test addition)
**Impact on plan:** Neither changes scope. The first stops the kit from overclaiming what the reader prints.

## Issues Encountered

- The first attempt to commit Task 1 stalled before it reached git. The command mistakenly ran `source` on a markdown reference file. The run was abandoned, nothing was staged or committed, and the retry, without that line, committed cleanly. The repository was not affected.

## Verification Run

- Before each commit: `npm run check:diff-disposition` (ALL CHECKS PASSED), `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `check:audit-register`, `node scripts/check-kit-refs.js`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. node scripts/validate-agent-factory.js`, and the full freshness chain (catalog, adapters, skill-twins, host-entries, guarantees, hook-manifest, context, traceability). Each exited 0.
- After the Task 1 commit (tracer gate): check-diff-disposition, floor-invariance, check-imperative-lexicon and trace-instructions tests. 4 files, 456 tests passed.
- After the Task 2 commit: check-diff-disposition, floor-invariance, tier-kit-text, skills-kit-text, install/kit-route, flow-guidance-text, check-imperative-lexicon, trace-instructions and check-foundation-guards tests. 9 files, 1395 tests passed.
- The full suite was not run (project note: shared /tmp quota and run time). The targeted files above cover every gate the plan names.

## Requirement Status

`requirements-completed` copies the plan's `[UP-05, UP-04]` as the template requires. As the plan instructs, UP-05 is **not** marked Complete in REQUIREMENTS.md. The live UP-05 red-team round (44-VERIFICATION.md `behavior_unverified_items`) is still owed, and only a human records it in /gsd-verify-work.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 44-14 is next in this round.
- No blockers. Plan 44-13 closed CR-02 in the kit text. The live red-team round and the human decisions listed in 44-VERIFICATION.md `human_verification` remain open for /gsd-verify-work.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/44-13.md
- FOUND: agent-factory/workflows/20-upstream-sources.md, agent-factory/workflows/17-task-claim.md, scripts/flow-guidance-text.test.ts
- FOUND commit 597f0fc8 and commit e5c60883, both ancestors of HEAD
- All Task 1 and Task 2 acceptance criteria re-run: PASS
