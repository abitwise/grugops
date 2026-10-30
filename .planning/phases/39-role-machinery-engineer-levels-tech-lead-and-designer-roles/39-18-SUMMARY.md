---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 18
subsystem: docs
tags: [workflow-04, tech-lead, used-up-stop, checkpoint-cell, named-human-stop, gap-closure, phase-gate]

requires:
  - phase: 39
    provides: "Workflow 04 step 15 as plan 39-17 left it (re-score stop before the move record, 'The used-up stop below follows the same value.' unchanged), the used-up stop tagged `escalate_unadjudicable_result` (39-08), Workflow 09's stale-blocker stop"
provides:
  - "One used-up outcome under every value of `checkpoints.escalate_unadjudicable_result`, stated in WF04 step 15, the tagged WF04 stop, tech-lead.md `## Hard limits` and the factory.config.md paragraph (WR-01, option park-in-blocked)"
  - "A kept level at the re-score stop at `notify`/`off` is named `Move: re-plan`"
  - "WR-01 describe (6 cases) and the moved D-21 and CR-02 literals in scripts/tier-kit-text.test.ts"
  - "docs/audit/29-style-dispositions/39-18.md with 7 rows; check-diff-disposition back at 721"
  - "WR-01 recorded `fixed` in 39-REVIEW-DISPOSITION.md"
  - "The gap closure round 3 phase gate record"
affects: [phase-39-uat, phase-39-verify]

actuals:
  tokens: 4743
  tasks: 3
  commits: 3
plan_head_before: e141f5f835fbb09f5cd79f277cc170dce7dab951
plan_head_after: 5bacd2eb83bad96c3336e542f99214e38f08301d

tech-stack:
  added: []
  patterns:
    - "A stop that is tagged with a checkpoint cell states its outcome for every value of that cell, in the step, the tagged stop, the role and the config reference"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-18.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-DISPOSITION.md

key-decisions:
  - "WR-01, option park-in-blocked (Olger Oeselg, 2026-10-30): at `block` a named human takes a used-up ticket; at `notify`/`off` the Tech Lead makes no move, nothing is re-enqueued, the ticket stays in `Blocked` (at `notify` with an `observation` naming its `failed-attempt` note), and Workflow 09 raises it for a human after `blocked_escalation_days`"
  - "A level kept at the re-score stop at `notify`/`off` is a `Move: re-plan`, so 'never retry in a loop' holds under every value of the cell"
  - "The 39-17 sentence 'The human's level stands, even past the move limits.' is confirmed by the human (Olger Oeselg, 2026-10-30)"

patterns-established:
  - "Cell-complete stop: a tagged human stop names what happens at block, notify and off wherever it is stated"

requirements-completed: [TIER-04]

coverage:
  - id: D1
    description: "WF04 step 15, the tagged used-up stop, tech-lead.md `## Hard limits` and the factory.config.md paragraph state one used-up outcome under every value of the cell, and a kept level is `Move: re-plan`"
    requirement: "TIER-04"
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF04, tech-lead.md and factory.config.md give a used-up ticket one outcome under every value (WR-01, 39-18)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js (721 findings)"
        status: pass
    human_judgment: true
    rationale: "UAT 7 re-run at end of phase: a first-time reader must find the used-up outcome reading the same in the step, the stop condition and tech-lead.md; no test asserts readability"
  - id: D2
    description: "Gap closure round 3 phase gate: every repo gate exits 0 apart from the two recorded pre-existing reds, and the full non-e2e suite shows only the 21 recorded baseline failures"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (10716 tests, 10693 passed, 21 failed = recorded baseline)"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 18: One used-up outcome under every value of its checkpoint cell (WR-01) and the round-3 phase gate Summary

**A Tech Lead whose options are used up now gets the same outcome in Workflow 04 step 15, the tagged stop, tech-lead.md and the config reference. At `block` a named human takes the ticket. At `notify` or `off` the Tech Lead makes no move, nothing is re-enqueued, and the ticket waits in `Blocked` until Workflow 09 raises it for a human. A level kept at the re-score stop is a `Move: re-plan`. The round-3 phase gate matches the recorded baseline.**

## Performance

- **Duration:** about 28 min, about 20 of it the full-suite run
- **Started:** 2026-10-30T19:21:37Z
- **Completed:** 2026-10-30T19:49:55Z
- **Tasks:** 3 (Task 1 answered through the orchestrator)
- **Files modified:** 6 (1 created, 5 modified)

## Task 1: Human decision (WR-01)

The orchestrator relayed the human's answers, quoted word for word from the answer form (2026-10-30):

- Q: "WR-01: when checkpoints.escalate_unadjudicable_result is lowered to notify/off, what happens to a blocked ticket whose Tech Lead options are used up? ..." A: "park-in-blocked (Recommended)"
- Q: "39-17 added this to WF04 step 15's re-score stop: \"The human's level stands, even past the move limits.\" Confirm it? ..." A: "confirm"

- **Option chosen:** `park-in-blocked`
- **Named human:** Olger Oeselg (git user; no other name was given)
- **Date:** 2026-10-30
- **The 39-17 human-level sentence:** confirmed
- **Kit state when the answer was recorded:** `git status --short agent-factory/` was empty, checked by the orchestrator at dispatch and again at the start of this run. Nothing in the kit had changed since 39-17's last commit.

Only the park-in-blocked option was implemented.

## Accomplishments

- WF04 step 15, move limits: "Once the escalation and the other move are both spent, apply the used-up stop."
- WF04 step 15, re-score stop: "Mark a kept level `Move: re-plan`." follows the sentence about the level move at `notify`/`off`. "At `notify` or `off`, a used-up ticket stays in `Blocked` until Workflow 09 raises it for a human." and "At `notify`, a used-up ticket also gets an `observation` per Workflow 16 naming its `failed-attempt` note." follow the sentence about the `notify` observation. "The used-up stop below follows the same value." is unchanged.
- WF04 step 15, confirmation: "Record a new move, or apply the used-up stop once the options are used up."
- WF04 `## Stop conditions` (FROZEN), the used-up bullet only: "At `notify` or `off`, the ticket stays in `Blocked` with no move and no re-enqueue." now sits just before the tag. No bullet was added and no tag moved. `grep -c "checkpoint: "` still prints 2.
- tech-lead.md `## Hard limits` (FROZEN): "After the options are used up, make no move of your own; at the default `block`, stop for a named human." The file is now 3,489 B, under its WARN tier of 3,786 B, and the foundation guards pass.
- factory.config.md, the **What `escalate_unadjudicable_result` gates.** paragraph: the Workflow 04 `## Stop conditions` bullet now states the outcome at each value, and "Under every value it is never retried in a loop." The `notify` and `off` sub-bullets each name the kept-level `Move: re-plan` and the used-up outcome.
- 39-18.md has 7 rows. The two FROZEN rows carry companion cells. The disposition gate went from 728 back to 721.
- 39-REVIEW-DISPOSITION.md: WR-01 is now `fixed`, with Source "plan 39-18 (71f0a9f2), option park-in-blocked decided by Olger Oeselg on 2026-10-30".

## Task Commits

1. **Task 1:** no commit (the human's decision, recorded above)
2. **Task 2 (tracer) RED:** `08c1f435` `test(39-18): pin one used-up outcome under every value of the cell (WR-01)`
3. **Task 2 GREEN:** `71f0a9f2` `fix(39-18): give a used-up ticket one outcome under every value of its cell (WR-01)`
4. **Task 3:** `5bacd2eb` `docs(39-18): record WR-01 as fixed by plan 39-18, option park-in-blocked`

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md`: step 15 (3 sub-bullets) and the used-up bullet in `## Stop conditions`. Five sentences added, one reworded.
- `agent-factory/roles/tech-lead.md`: one `## Hard limits` sentence reworded.
- `agent-factory/config/factory.config.md`: the escalate paragraph. One sentence replaced, and appended text in the `notify` and `off` sub-bullets.
- `scripts/tier-kit-text.test.ts`: the WR-01 describe with 6 cases, (a) to (f). The D-21 and CR-02 literals moved with the text.
- `docs/audit/29-style-dispositions/39-18.md` (new): the header, the decision record and 7 rows.
- `39-REVIEW-DISPOSITION.md`: the WR-01 frontmatter entry, its table row, and the `open:` counter.

## TDD / RED evidence

- **RED:** `npx vitest run scripts/tier-kit-text.test.ts` gave 8 failed and 115 passed. The failures were the 6 new cases plus the moved D-21 and CR-02 literals. Each one failed an assertion on missing text, which is the expected result. There were no load or syntax failures.
- **GREEN:** `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts` gave 260 passed. N2 (each notify-comma sentence names `observation` and "per Workflow 16") and E3 still pass.

## Tracer feedback gate

Task 2 is `type="tracer"`. Auto mode is off, `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` has only `<automated>` steps. After the commit, the targeted run was re-run and gave 260 passed, so expansion (Task 3) went ahead.

## Phase gate (gap closure round 3)

Each command was run in the foreground, in plan order, after the Task 3 commit:

| Gate | Exit |
|---|---|
| `npm run build` | 0 |
| `npm run typecheck` | 0 |
| `node scripts/check-foundation-guards.js` | 0 (ALL CHECKS PASSED) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 (ALL CHECKS PASSED) |
| `node scripts/check-audit-register.js` | 0 |
| `node scripts/check-imperative-lexicon.js` | 0 |
| `node scripts/check-banned-claims.js` | 0 |
| `node scripts/check-kit-refs.js` | 0 |
| `npm run check:public-docs` | 0 |
| `npm run check:claim-anchors` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:hook-manifest` | 0 (1 decider, 13 module hashes match) |
| `npm run freshness:guarantees` | 0 |
| `npm run freshness` | 0 (88 committed `.js` fresh) |
| `npm run check:build-parity` | 0 |
| `npx tsc --noEmit` | 0 |
| `node scripts/check-diff-disposition.js` | 1, **721 findings**: the recorded pre-existing red, not marked passing |
| `npm run check:flip-manifest` | 1, "the flip manifest does not exist at .../33-FLIP-MANIFEST.md": the recorded pre-existing red, not marked passing |

Targeted plan verification: `npx vitest run` on tier-kit-text, checkpoints, config-governance-consistency, model-dial-consistency, check-uat-oracles, voice-model and check-imperative-lexicon gave 7 files and 452 passed.

**Full non-e2e suite** (`timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`, JSON reporter, background run): 10716 tests, 10693 passed, 21 failed, 2 skipped. The failures are exactly the recorded baseline:

- context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4, uat-gate-exit-contract 5: these read the archived phase 27 and 31 directories, which are gone (deferred-items.md).
- installer-fs-census 1: `openAsBlobSync` on Node 26.
- check-foundation-guards.test.ts 1 ("every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose"): environmental, caused by the untracked `~/` directory.

No failure is outside that set. The total and the pass count each rose by 6 (from 39-17's 10710 and 10687), the 6 new WR-01 cases.

`git status --short docs/audit/28-prepass-evidence.md` gives ` M docs/audit/28-prepass-evidence.md`, so the file is untouched and unstaged. The untracked `~/` directory was not touched.

## Acceptance greps

- `checkpoint: ` in WF04: 2. `git diff 29fa19d6 --stat -- scripts/checkpoints.ts scripts/checkpoints.js hooks/` prints nothing.
- "a used-up ticket stays in": 1. "with no move and no re-enqueue": 1. "Mark a kept level": 1 (all WF04).
- "make no move of your own" in tech-lead.md: 1. Lines with "Move: re-plan" in factory.config.md: 2.
- Rows in 39-18.md (`^| agent-factory/`): 7. "WR-01, 39-18" in the test: 1.
- `^| WR-01 | warning | open |` in 39-REVIEW-DISPOSITION.md: 0.
- Word counts of the added WF04 step sentences: 14, 6, 18, 16 and 15 (the reworded one). None is over 20 words and none has a modal.

## Human items for verify-work

- **UAT 7 re-run:** read Workflow 04 step 15 as a first-time reader. The sub-bullets come in this order: move limits, re-score stop, move record, gate-failure stop, confirmation, board. Check that each named-human stop sits before the move it holds, and that the used-up outcome reads the same in the step, the stop condition and tech-lead.md.
- **UAT 5 re-run:** haiku/xhigh, sonnet/high and opus/medium on a live host.
- **UAT 10 and 14:** these stay blocked until the milestone's remaining phases land. They are not gaps.
- **The stray `~/` folder:** removing it is the human's call. It causes the environmental check-foundation-guards case.

## Decisions Made

See key-decisions in the frontmatter. These came from the human through the Task 1 checkpoint. The executor made no policy choice.

## Deviations from Plan

**1. [Rule 1 - Bug] The `open:` counter in 39-REVIEW-DISPOSITION.md follows the entries**
- **Found during:** Task 3, step 0
- **Issue:** after WR-01 moved to `fixed`, the frontmatter `open: 9` no longer matched the 8 entries still `open`.
- **Fix:** set `open: 8`. No other row or entry changed. CR-01 and WR-02 still read `open` even though 39-17 fixed them. The plan says to change no other row, so they are left for whoever owns that update.
- **Files modified:** 39-REVIEW-DISPOSITION.md (commit `5bacd2eb`)

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** none on the kit text.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- All 18 Phase 39 plans have SUMMARYs. The phase is ready for re-verification and the end-of-phase UAT 7 and UAT 5 re-runs.
- 39-REVIEW-DISPOSITION.md still lists CR-01 and WR-02 as `open`, although plan 39-17 fixed them (commits `013b6012` and `eb010089`). The verifier or the review-disposition tool should set them.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/39-18.md
- FOUND: agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/config/factory.config.md, scripts/tier-kit-text.test.ts, 39-REVIEW-DISPOSITION.md
- FOUND commits: 08c1f435, 71f0a9f2, 5bacd2eb (all ancestors of HEAD; `git rev-list --count e141f5f8..HEAD` = 3)
