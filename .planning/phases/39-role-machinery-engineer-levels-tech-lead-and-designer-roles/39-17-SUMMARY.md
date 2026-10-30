---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 17
subsystem: docs
tags: [workflow-04, tech-lead, escalation, named-human-stop, model-dial, gap-closure]

requires:
  - phase: 39
    provides: "Workflow 04 step 15 sub-bullets (39-16), the escalation path and both named-human stops (39-08, 39-12, review fixes), LEVELS re-decided 2026-10-30 (39-14, 39-15)"
provides:
  - "Workflow 04 step 15 with the re-score stop before the move record; at `block` no move is recorded until the named human answers (CR-01)"
  - "The human's level at the re-score stop recorded on the move note (`Stop: re-score` line) and on the stamped `Confirmed: yes` finding (`Level:` line)"
  - "Workflow 04 step 16 holding the re-enqueue for both human stops, each naming its cell"
  - "CR-01 describe and moved literals in scripts/tier-kit-text.test.ts"
  - "docs/audit/29-style-dispositions/39-17.md rows and the 39-16.md correction; check-diff-disposition back at 721"
  - "factory.config.md `models` row stating the re-decided level pins, and WR-02 cases deriving every level-pin statement from LEVELS"
affects: [phase-39-uat, phase-39-verify, plan-39-18]

actuals:
  tokens: 7350
  tasks: 2
  commits: 4
plan_head_before: cccad9d930a8f2207cd36a1f2164a4f2a8f59773
plan_head_after: eb0100897a0e080f0e5bb340398bcd7d5ff18263

tech-stack:
  added: []
  patterns:
    - "A named-human stop sits before the record it holds, and the step that releases the work names the fixed body line and the config cell it waits on"
    - "Doc pin statements are tested by building every expected string from the imported table, two-sided where the doc lists pairs"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-17.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - scripts/tier-kit-text.test.ts
    - docs/audit/29-style-dispositions/39-16.md
    - agent-factory/config/factory.config.md
    - scripts/model-dial-consistency.test.ts

key-decisions:
  - "At the re-score stop at `block` the Tech Lead records no move until the named human answers; the human names a level or another move, and that level stands even past the move limits"
  - "A move note written after a re-score stop carries a fixed `Stop: re-score` line under `Move:`, so step 16 reads a fixed line (like `Cause:`), never free text"
  - "Step 16 names the cell in both holds: `checkpoints.exhaust_self_fix_budget: block` for a `Cause: gate` note, `checkpoints.escalate_unadjudicable_result: block` for a `Stop: re-score` move note"
  - "The WR-02 failure messages are joined into one line so vitest's TAP reporter emits well-formed YAML and the RED evidence classifier can read the run"

patterns-established:
  - "Human-stop-before-record: no artifact the release step reads exists until the human answers"

requirements-completed: [TIER-04, TIER-02]

coverage:
  - id: D1
    description: "Workflow 04 step 15 holds the re-score stop before any move note; step 16 holds the re-enqueue for both human stops; the human's level is recorded"
    requirement: "TIER-04"
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF04 step 15 holds the re-score stop before any move note, and step 16 holds for it (CR-01, 39-17)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js (721 findings)"
        status: pass
    human_judgment: true
    rationale: "UAT 7 re-run at end of phase: a first-time reader must find each named-human stop before the move it holds; no test asserts readability"
  - id: D2
    description: "factory.config.md `models` row states junior haiku/xhigh, mid sonnet/high, senior opus/medium, and every level-pin statement in that document is derived from LEVELS"
    requirement: "TIER-02"
    verification:
      - kind: unit
        ref: "scripts/model-dial-consistency.test.ts#model dial — every level-pin statement in factory.config.md equals the LEVELS rows (WR-02, G-39-5)"
        status: pass
    human_judgment: false

duration: 63min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 17: Re-score stop before the move record, two named step-16 holds, and the LEVELS-derived `models` row Summary

**At the default `block`, Workflow 04 now stops for the named human before any move note exists. Step 16 waits for a `Confirmed: yes` finding after a `Stop: re-score` move note, as it already did after a `Cause: gate` note, and both holds name their cell. The config field table states the shipped level pins, and a test built from LEVELS covers every pin statement in that file.**

## Performance

- **Duration:** about 63 min (most of it two full-suite runs)
- **Started:** 2026-10-30T18:10:28Z
- **Completed:** 2026-10-30T19:13Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- CR-01: step 15 now runs in this order: move limits, re-score stop, move record, gate-failure stop, confirmation, board. The re-score stop's `block` sentence says no move is recorded until the human answers. Three sentences follow it: the ticket stays `Blocked`, the human is asked for a level or another move, and the human's level stands.
- CR-01: the move record holds the human's level and a `Stop: re-score` line. The confirmation finding puts the level on a `Level:` line.
- CR-01: step 16 holds for both human stops. Each hold names its cell (`checkpoints.exhaust_self_fix_budget: block` and `checkpoints.escalate_unadjudicable_result: block`).
- 39-16.md has a correction paragraph. 39-17.md has nine rows. The disposition gate is back at 721.
- WR-02: the `models` row states `haiku`/`xhigh`, `sonnet`/`high` and `opus`/`medium`. Three LEVELS-derived cases now cover the row (two-sided), the Engineer levels paragraph and the Absent-means-inherit parenthetical.

## Task Commits

1. **Task 1 (tracer, CR-01) RED:** `20f58203` `test(39-17): pin the re-score stop before the move record and both step-16 holds (CR-01)`
2. **Task 1 GREEN:** `013b6012` `fix(39-17): hold the re-score stop before any move note and in step 16 (CR-01)`
3. **Task 2 (WR-02) RED:** `db51ba04` `test(39-17): derive every level-pin statement in factory.config.md from LEVELS (WR-02)`
4. **Task 2 GREEN:** `eb010089` `fix(39-17): state the re-decided level pins in the models field-table row (WR-02)`

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md`: steps 15 and 16 only. The sub-bullets are reordered, two sentences are reworded and seven are added.
- `scripts/tier-kit-text.test.ts`: a new CR-01 describe with 5 cases. The G-39-7 openings array, RESCORE_STOP, and the WR-01, E3 and CR-02 literals moved with the text.
- `docs/audit/29-style-dispositions/39-17.md` (new): the header and nine disposition rows.
- `docs/audit/29-style-dispositions/39-16.md`: the correction paragraph. No row cell changed.
- `agent-factory/config/factory.config.md`: line 28, the three pins only.
- `scripts/model-dial-consistency.test.ts`: the `LEVELS` import and the WR-02 describe with 3 cases.

## Meaning check (Task 1 step 3)

A throwaway node script (scratchpad, not committed) folded HEAD's and the new steps 15 and 16, split them on ". " and compared them. Output:

```
HEAD sentences not found exactly once in the new text:
  - At `block`, the default, stop for a named human.
  - After a `Cause: gate` note at `block`, wait also for a `Confirmed: yes` finding that names the move note.
New sentences not in HEAD:
  + At `block`, the default, stop for a named human, and record no move until the human answers.
  + Leave the ticket in `Blocked` while the human decides.
  + Ask the human for a level, or for another move.
  + The human's level stands, even past the move limits.
  + After a re-score stop at `block`, record the move and the level the human named.
  + Put the line `Stop: re-score` under the `Move:` line when the re-score stop applied.
  + At a re-score stop, put the level the human named on a `Level:` line.
  + After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding naming the move note.
  + After a `Stop: re-score` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it.
Step 15 sub-bullet openings, HEAD: ["Apply the move limits.","Record the move in a new `decision` note per Workflow 16.","Apply the re-score stop.","Apply the gate-failure stop.","Record the human's confirmation.","Update the board."]
Step 15 sub-bullet openings, new:  ["Apply the move limits.","Apply the re-score stop.","Record the move in a new `decision` note per Workflow 16.","Apply the gate-failure stop.","Record the human's confirmation.","Update the board."]
```

Exactly two HEAD sentences were replaced, by their two reworded forms. The seven planned sentences were added. Every other sentence appears exactly once.

## TDD / RED evidence

- **Task 1 RED:** `npx vitest run scripts/tier-kit-text.test.ts` gave 10 failed and 107 passed. Every failure was an assertion on missing text, the result the plan expected: the 5 CR-01 cases, the moved WR-01, CR-02 and E3 literals, the G-39-7 openings order, and the G-39-7 stop location. No load or syntax failure. GREEN: 117 passed.
- **Task 2 RED:** `npx vitest run scripts/model-dial-consistency.test.ts -t WR-02 --reporter=tap-flat` exited 1. The classifier (`gsd-tools check tdd-red-evidence`) returned `RED_EVIDENCE_OK` (`target_test_failed`). Target: WR-02 (a). It failed on its planned assertion and named three missing pins (junior `haiku`/`xhigh`, mid `sonnet`/`high`, senior `opus`/`medium`) and three stale pairs (haiku/medium, sonnet/medium, opus/high). (b) and (c) passed as controls. Semantic assessment: the target executed and failed for the intended reason, the stale line 28. GREEN: 3 passed.

## Verification

- `npm run build && npm run typecheck`: exit 0. Both builds were clean, no committed `.js` changed, and `npm run freshness` reports 88 committed `.js` files fresh.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts`: 5 files, 367 passed.
- `npx vitest run scripts/tier-kit-text.test.ts -t "CR-01, 39-17"`: 5 passed.
- `npx vitest run scripts/model-dial-consistency.test.ts scripts/tier-kit-text.test.ts scripts/config-governance-consistency.test.ts scripts/model-tiers.test.ts`: 4 files, 438 passed. The `-t WR-02` run: 3 passed.
- check-imperative-lexicon, check-foundation-guards, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-banned-claims, check-kit-refs, check:public-docs, check:claim-anchors, freshness:catalog and freshness: all exit 0.
- `node scripts/check-diff-disposition.js`: 721 findings, the same as the pre-plan baseline. It went to 730 before the 39-17 rows were written.
- `npx tsc --noEmit`: exit 0.
- Full non-e2e suite (`npx vitest run --exclude '**/scripts/e2e/**'`, JSON reporter): 10710 tests, 10687 passed, 21 failed. All 21 are the baseline already recorded in deferred-items.md and 39-16-SUMMARY.md:
  - context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4 and uat-gate-exit-contract 5. These tests read the archived phase 27 and 31 directories, which are gone.
  - installer-fs-census 1: `openAsBlobSync` on Node v26.12.1.
  - check-foundation-guards LANG-07 1: the stray untracked `~/` tree adds `.js` files to the walk.
  - None of them reads a file this plan changed. The pass count rose by the 8 new cases.
- `git status --short docs/audit/28-prepass-evidence.md` → ` M docs/audit/28-prepass-evidence.md` (untouched, unstaged). The untracked `~/` was not touched.
- Acceptance greps, Task 1: re-score stop before the move record 1, `record no move until the human answers` 1, `Stop: re-score` 2 lines, `checkpoints.exhaust_self_fix_budget: block` 1, `checkpoints.escalate_unadjudicable_result: block` 1, `Level:` 1, the old hold 0, sub-bullets 6, `checkpoint: ` 2, the 39-16 correction 1, 39-17 WF04 rows 9, `39-17` in the test 6. `git diff 29fa19d6 --stat` on WF05, checkpoints.ts and tech-lead.md is empty.
- Acceptance greps, Task 2: the new pins 1, `` `haiku`/`medium` `` 0, pairs exactly `haiku`/`xhigh`, `opus`/`medium` and `sonnet`/`high`, `^  LEVELS,$` 1, `WR-02` 5, closed-set markers 3 (unchanged).

## Tracer feedback gate

Task 1 is `type="tracer"`, and auto mode is off. `human_verify_mode` is `end-of-phase`. The tracer's automated `<verify>` passed after the commit. Its `<human-check>` is labelled as the end-of-phase UAT 7 re-run, so it is left to phase verification and does not stop work mid-plan. Expansion (Task 2) went ahead after the passing re-run.

## Decisions Made

See key-decisions in the frontmatter. These sentences carry the plan's flagged assumptions and were written as the plan specified: "The human's level stands, even past the move limits" and the `Stop: re-score` line. The 39-18 decision checkpoint shows the human the first one.

## Deviations from Plan

**1. [Rule 3 - Blocking] WR-02 failure messages joined into one line**
- **Found during:** Task 2 RED
- **Issue:** the plan-shaped `expect(array).toEqual([])` made vitest's TAP reporter write a multi-line `actual:` YAML block. The RED evidence classifier rejected the run as `invalid_record` (malformed TAP), even though the target test was the one that failed.
- **Fix:** cases (a) and (b) assert `problems.join("; ")` equals `""`. The message still names every stale or missing pin, on one line. The classifier then returned `RED_EVIDENCE_OK`.
- **Files modified:** scripts/model-dial-consistency.test.ts (in the RED commit `db51ba04`)

Placement note: the 39-16.md correction paragraph sits directly after the G-39-7 bullet. It comes before the "Two of the five openings" paragraph and the base-commit paragraph, so it is still "after the G-39-7 bullet, before the base-commit paragraph" as planned.

**Total deviations:** 1 auto-fixed (Rule 3). **Impact:** none on the shipped text. The test still checks every pin both ways.

## Issues Encountered

- One full-suite run with a 590 s timeout was killed before it finished (the suite runs about 20 min). It was re-run in the background with the JSON reporter and completed. The results are above.

## Known Stubs

None.

## Next Phase Readiness

- Plan 39-18 (WR-01, the used-up stop at `notify`/`off`, and the round-3 phase gate) is next. "The used-up stop below follows the same value." is unchanged, word for word, for that plan.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/39-17.md
- FOUND: agent-factory/workflows/04-ticket-to-pr.md, scripts/tier-kit-text.test.ts, docs/audit/29-style-dispositions/39-16.md, agent-factory/config/factory.config.md, scripts/model-dial-consistency.test.ts
- FOUND commits: 20f58203, 013b6012, db51ba04, eb010089 (all ancestors of HEAD; `git rev-list --count cccad9d9..HEAD` = 4)
