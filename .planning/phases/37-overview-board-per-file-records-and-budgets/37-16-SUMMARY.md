---
phase: 37-overview-board-per-file-records-and-budgets
plan: 16
subsystem: workflows
tags: [workflows, trace-render, state-check, state-roll, split-03, split-05, split-06, split-01, split-02, prose]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-13 the host runnables tools/grugops/trace-render.js, state-check.js and state-roll.js; 37-14 and 37-15 the trace section form the roles use"
provides:
  - "WF05 (PR gate) runs trace-render then state-check after test-integrity, commits the rendered files, and reads state-check's exit codes per D-12"
  - "WF09 (daily sweep) renders, checks, rolls on a ROLLABLE line, adds dated progress entries only, names blockers in the ticket body, and states the move-only rule for queue/done and 50-decisions"
  - "WF12 reads each ticket's rendered trace file through the index and publishes the REL id as a ref; WF16 says no workflow edits a trace file or the index"
  - "WF00 seeds each NFR as its own file with one index line; WF13 reads NFR targets from those files"
  - "None of the ten workflows this plan edits tells an agent to append to the trace; each Commit section names the rendered trace files"
affects: [37-17, 37-18, 37-19, 38, 40]

actuals:
  tokens: 5232
  tasks: 3
  commits: 3
plan_head_before: f14fa3476cab5dfdb87f14919cc304e5475bfd35
plan_head_after: b0869b44f381acc2cef6a225934acf2981a42cdf

tech-stack:
  added: []
  patterns:
    - "A workflow's Trace updates section names which role publishes which refs on a note per Workflow 16, with the ticket identifier among the refs, and names the render that turns them into the trace"
    - "A host runnable's exit codes are read in the workflow as backticked arms: exit 2 and no exit code are could-not-run, never a pass"

key-files:
  created: []
  modified:
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/12-release.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - agent-factory/workflows/13-incident.md
    - agent-factory/workflows/01-bootstrap-brownfield.md
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/04-ticket-to-pr.md

key-decisions:
  - "WF05's never-a-stop-condition clause is folded into the existing SPLIT_REQUIRED bullet. A new bullet moved the stop-bullet census in scripts/checkpoints.ts from 43 to 44, a file outside this plan"
  - "WF03 step 8 starts with Record, not Publish: Publish is not in the approved step-verb set (WP-01), and the verb set is 37-18's writing-profile to change"
  - "WF02's epic and feature refs name no ticket, so the render ignores them; WF02 says so and points at WF03, which publishes each ticket's epic and feature ids"
  - "WF09 points at Workflow 05 Step 3 for reading the render and state-check exit codes instead of restating the arms"

patterns-established:
  - "Workflow trace section form: `<Role> publishes <refs> as refs on a note per Workflow 16. Each note names the ticket identifier among its refs. The next trace render turns those refs into each ticket's trace file and index line.`"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06, SPLIT-01, SPLIT-02]

coverage:
  - id: D1
    description: "WF05 runs tools/grugops/trace-render.js then tools/grugops/state-check.js, commits the rendered files, and reads state-check exit 1 as a non-blocking observation, exit 2 and a signal-ended run as could-not-run"
    requirement: SPLIT-05
    verification:
      - kind: other
        ref: "grep -c tools/grugops/state-check.js -> 1; grep -c tools/grugops/trace-render.js -> 1; grep -i state-check | grep -ci signal -> 1 (05-pr-quality-gate.md)"
        status: pass
      - kind: unit
        ref: "npx vitest run over the 8 test files that name 05-pr-quality-gate: 1674 passed, 12 failed (all 37-BASELINE)"
        status: pass
    human_judgment: false
  - id: D2
    description: "WF09 renders, checks, runs state-roll on a ROLLABLE line, adds dated progress entries, sends standing directives to 50-decisions, names blockers in ## Blocked, and states the move-only rule"
    requirement: SPLIT-06
    verification:
      - kind: other
        ref: "09-daily-sweep.md: grep -c state-roll.js -> 1; grep -c 50-decisions -> 2; grep -c queue-done -> 1; grep -c '## Blocked' -> 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "WF00 seeds each NFR as its own file with one index line; WF13 reads NFR targets from those files"
    requirement: SPLIT-02
    verification:
      - kind: other
        ref: "grep -c 'nfr/' 00-bootstrap-greenfield.md -> 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "None of the ten edited workflows matches the hand-trace scan pattern; 19 workflows keep one ## Trace updates heading"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "grep -liE '<37-18 scan pattern>' over the ten workflows | wc -l -> 0; grep -c '^## Trace updates' agent-factory/workflows/*.md | grep -c ':1$' -> 19"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict -> ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every generator re-run with no derived file changed; every freshness and prose gate exits 0; the targeted run shows only 37-BASELINE failures"
    verification:
      - kind: other
        ref: "npm run generate:{catalog,adapters,skill-twins,host-entries}; npm run freshness; freshness:{catalog,adapters,skill-twins,host-entries,traceability}; check-{imperative-lexicon,banned-claims,claim-anchors,kit-refs,public-docs-vocabulary,foundation-guards,state-paths} -> all exit 0"
        status: pass
      - kind: unit
        ref: "npx vitest run over 33 files in five sequential groups: 3188 passed, 1 skipped, 14 failed (the 14 37-BASELINE cases in context-io, uat-gate-exit-contract and context-io-writer-set)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The rewritten workflow steps read clearly to a host agent"
    verification:
      - kind: other
        ref: "reading review of git diff f14fa347..b0869b44"
        status: pass
    human_judgment: true
    rationale: "Whether the steps read clearly is a reading judgment; the gates check structure and wording rules only"

duration: 25min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 16: The PR gate and the daily sweep run the trace render, state-check and state-roll, and ten workflows publish trace refs on notes Summary

**Workflow 05 now runs `tools/grugops/trace-render.js` and then `tools/grugops/state-check.js`, and commits the rendered trace files on the PR branch. It records a state-check exit 1 as an `observation` note that never blocks the gate. Exit 2 and a run ended by a signal are could-not-run, never a pass. Workflow 09 renders, checks and runs `tools/grugops/state-roll.js` when state-check prints a `ROLLABLE` line. It adds dated progress entries only, names blockers in the ticket body, and states that `.grugops/queue/done/` and `memory-bank/50-decisions/` are move-only. Workflow 12 reads the rendered trace through the index. Workflow 00 seeds each NFR as its own file. None of the ten workflows tells an agent to append to the trace.**

## Performance

- **Duration:** about 25 min, most of it the targeted test run
- **Started:** 2026-10-22T17:37:38Z
- **Completed:** 2026-10-22T18:02:19Z
- **Tasks:** 3 (Task 1 the tracer)
- **Files modified:** 10

## Accomplishments

- **Task 1, the tracer (WF05):**
  - Step 3 gains one sub-bullet after test-integrity. It runs the render and then state-check, and gives each runnable its exit arms.
  - The render: exit 1 is a refusal, such as a hand-written index, recorded as an `observation` note. Exit 2 or no exit code is could-not-run.
  - state-check: exit 0 is recorded. Exit 1 findings go in an `observation` note and never block the gate or change the terminal result. Exit 2 is could-not-run and never read as a pass. No exit code means a signal ended the run, so it is could-not-run.
  - The sub-bullet says grugops's own validator still FAILs a migrated tree that breaks a budget.
  - `## Trace updates` names the refs QE/E2E and the Software Engineer publish. The Commit section names the rendered trace files.
  - Stop conditions gains the clause that a state-check result is never a stop condition.
  - The tracer gate re-ran the plan's verify commands, which passed, before Task 2 began.
- **Task 2 (WF09, WF12, WF16, WF00, WF13):**
  - WF09:
    - Steps 1 and 2 are new: render and state-check, then state-roll on a `ROLLABLE` line, with the moved lines committed. The Done column keeps the newest rows and older rows move to `memory-bank/plans/archive/board-done.md`.
    - A progress file over budget with no dated entry to move goes to a human, with state-check's note.
    - Step 6 adds one `## YYYY-MM-DD — <summary>` entry at the end of `60-progress.md`. A standing directive or ruling goes to `50-decisions/` instead.
    - Step 7 names the blocker in the ticket body's `## Blocked` section, and the board row keeps the overview form.
    - A paragraph after the steps states the move-only rule and the two archive folders, and says state-check reports a name found in both places.
  - WF12 reads each ticket's rendered trace file through the trace index and reads NFR targets from the NFR files. It publishes the `REL-xxxx` id as a ref on the release note, and the next render adds it.
  - WF16's `## Trace updates` says the render reads admitted notes' refs and that no workflow edits a trace file or the index. The sentence against hand-editing in place of a refused note keeps its meaning.
  - WF00 step 8 writes each NFR as its own file under `memory-bank/plans/nfr/` with one index line in `nfr-catalog.md`. WF13 reads NFR/SLO targets from the files the index lists.
  - The trace and commit sentences of WF00 and WF13 changed too, because Task 3's scan covers them.
- **Task 3 (WF01 to WF04):** each `## Trace updates` names which role publishes which refs and says the render builds the trace. WF03 step 8 records each ticket's epic, feature and NFR ids as refs on a note. Its Done condition no longer names a trace row. Every Commit section names the rendered trace files.

## Task Commits

1. **Task 1: the PR gate renders, then runs state-check per D-12 (tracer)** - `1d6f94c6` (docs)
2. **Task 2: the sweep rolls, the release reads the rendered trace, NFRs one file each** - `889e3bef` (docs)
3. **Task 3: WF01 to WF04 trace and commit sentences** - `b0869b44` (docs)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `agent-factory/workflows/05-pr-quality-gate.md`: the new step 3 sub-bullet, Trace updates, one Commit phrase and one Stop clause. Every other sentence is unchanged word for word, including the step 3 host-protection opener and the UAT arm run that tests bind.
- `agent-factory/workflows/09-daily-sweep.md`: Steps (now nine), the move-only paragraph, Trace updates and Commit.
- `agent-factory/workflows/12-release.md`: two Inputs lines, steps 1 and 4, Trace updates and Commit.
- `agent-factory/workflows/16-context-read-write.md`: Trace updates only.
- `agent-factory/workflows/00-bootstrap-greenfield.md`: the Architect/Design agent line, step 8, Trace updates and Commit.
- `agent-factory/workflows/13-incident.md`: the NFR input line, Trace updates and Commit.
- `agent-factory/workflows/01-bootstrap-brownfield.md`, `02-idea-to-epics.md`, `04-ticket-to-pr.md`: Trace updates and Commit.
- `agent-factory/workflows/03-epic-to-tickets.md`: step 8, Trace updates, the Output sentence and Commit.
- No derived file changed. The catalog, adapter, skill-twin and host-entry generators ran after each task and produced no diff.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- WF05's stop clause goes into an existing bullet, so the 43-bullet stop census holds.
- WF03 step 8 uses the approved verb Record, not Publish.
- WF02 says its epic-level refs name no ticket and points at WF03.
- WF09 reads exit codes as WF05 Step 3 does, rather than restating them.

## Deviations from Plan

None that changed scope. Each is a wording adjustment made so the plan's own gates pass:

**1. [Rule 3 - Blocking] WF05 stop clause folded into an existing bullet**
- **Found during:** Task 1
- **Issue:** a separate Stop conditions bullet turned `scripts/checkpoints.test.ts` red. The live stop corpus held 44 bullets against the 43 that `scripts/checkpoints.ts` records, and that file is outside this plan.
- **Fix:** the plan asked for "one clause". It is now the last sentence of the `SPLIT_REQUIRED` bullet: "A state-check result is never a stop condition; Step 3 records it."
- **Verification:** `scripts/checkpoints.test.ts` 118/118 passes.
- **Committed in:** `1d6f94c6`

**2. [Rule 3 - Blocking] WF03 step 8 verb**
- **Found during:** Task 3
- **Issue:** the plan's step 8 starts "publish", which `check-imperative-lexicon` refuses: Publish is not in the approved step-verb set (WP-01).
- **Fix:** step 8 reads "Record each ticket's epic, feature and NFR ids as refs on a note per Workflow 16. The ticket identifier is among the refs."
- **Committed in:** `b0869b44`

**3. Sentence-form splits.** The lexicon gate refused several drafts: procedural sentences over 20 words, descriptive sentences over 25 words, and one sentence that chained two instructions in WF12 step 4 (WP-08). Each was split into shorter sentences. Meaning is unchanged.

---

**Total deviations:** 2 auto-fixed (both Rule 3), plus wording splits for the prose gate.
**Impact on plan:** none on scope. Every must-have truth holds.

## Issues Encountered

- The targeted runs failed on exactly the 37-BASELINE cases:
  - 7 in `scripts/context-io.test.ts`
  - 5 in `scripts/uat-gate-exit-contract.test.ts`
  - 2 in `scripts/context-io-writer-set.test.ts`
- No other test failed.

## Verification

- All four generators ran after each task. `freshness:catalog`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries`, `freshness:traceability` and `npm run freshness` all exit 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` exits 0 (ALL CHECKS PASSED).
- These gates all exit 0: `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-public-docs-vocabulary`, `check-foundation-guards` and `check-state-paths`.
- Acceptance criteria, all re-run after the last edit:
  - Task 1 prints 1, 1, 1 and 0.
  - Task 2 prints 1, 2, 1, 1 and 1.
  - Task 3: the scan over the ten workflows matches 0 files (baseline 10), and 19 workflows carry `## Trace updates`.
- No edited markdown file holds a control byte (each file compared with a copy that has the C0 and DEL bytes stripped).
- Targeted run: 33 files in five sequential foreground groups, one worker, with no full-suite run.
  - The 12 test files `git grep` derives from the ten workflow names, plus `scripts/validate.test.ts`.
  - The census set: board-readonly, board-tracer, check-state-paths, nonblocking-reader-parity, context-io-writer-set, the adapter, catalog, skill-twin and host-entry generator and freshness tests, the prose-gate tests, and the trace-model, trace-render, trace-freshness and state-check tests.
  - Result: 3,188 passed, 1 skipped, 14 failed. All 14 failures are 37-BASELINE cases.
- No installer ran. `~/.grugops` is unchanged: the same four entries with the same dates, before and after. Only the home directory's own mtime moved.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 37-17 does the same trace and commit edits in Workflows 06, 07, 08, 10, 11, 14, 15, 17 and 18. It can use this plan's trace section form.
- Plan 37-18 lands the permanent scan test. The ten workflows edited here already pass its pattern. If it wants WF03 step 8 to start with Publish, it must add Publish to the approved step-verb set in `agent-factory/writing-profile.md`.
- SPLIT-01/02/03/05/06 stay Pending in REQUIREMENTS.md, because later plans also declare them.

## Self-Check: PASSED

- All ten modified files exist.
- Commits `1d6f94c6`, `889e3bef` and `b0869b44` are ancestors of HEAD.
- `git rev-list --count f14fa347..HEAD` returns 3 before this SUMMARY's commit.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
