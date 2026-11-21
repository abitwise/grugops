---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 12
subsystem: role-machinery
tags: [tech-lead, escalation, wf04, engineer-levels, junior-exclusions, routing, gap-closure, CR-02]
status: complete

requires:
  - phase: 39
    provides: "WF04 escalation path (39-08), tech-lead.md (39-05), engineer `## Levels` (39-07), complexity rubric (39-05), 39-11 gap closure"
provides:
  - "WF04 step 15 stops for a named human after a gate BLOCKED_NEEDS_FIX, before the return to Ready for Dev; step 16 waits for that human"
  - "WF04 gate-failure stop bullet cites only what Workflow 05 says; tag kept once"
  - "Per-ticket move bound: one escalation plus one other move; a level-raising re-score is the escalation"
  - "Write-then-score order in tech-lead.md, WF04 step 2 and the rubric"
  - "Engineer failed-attempt trigger in WF04's words; junior stops on every rubric risk tag"
  - "Orchestrator route `ready-ticket dev plan -> Tech Lead`"
affects: [phase-39-verification, 39-13, TIER-04, TIER-03, TIER-01]

actuals:
  tokens: 8180
  tasks: 3
  commits: 4
plan_head_before: 518e4d73228beef973a454c43af1716d17f44dfe
plan_head_after: 7aa36bc51f5f880dff3754bfc8427cddcf1b085b

tech-stack:
  added: []
  patterns:
    - "A human stop that a `## Stop conditions` bullet tags is also named, untagged, in the numbered step an agent follows"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-12.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/checklists/complexity-rubric.md
    - scripts/tier-kit-text.test.ts
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-DISPOSITION.md

key-decisions:
  - "39-12: CR-02 is fixed by rewording WF04 (step 15 names the human stop, step 16 waits for it, the stop bullet states what WF05 says); WF05 and every checkpoint count stay unchanged"
  - "39-12: The Tech Lead makes at most one escalation and one other move per ticket; a re-score that raises the level is the escalation; moves are counted from the ticket's decision notes (WR-01, D-19, D-21)"

patterns-established:
  - "Numbered step + tagged stop bullet: the step carries the untagged stop sentence, the bullet carries the only checkpoint tag"

requirements-completed: [TIER-04, TIER-03, TIER-01]

coverage:
  - id: D1
    description: "After a gate BLOCKED_NEEDS_FIX, WF04 step 15 stops for a named human before the return to Ready for Dev, step 16 waits for that human, and the stop bullet's reference to Workflow 05 is accurate"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-02: after a gate failure the numbered steps stop for a named human before any re-enqueue"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#T-39-16: the gate-failure stop keeps the WF05 human stop, tagged `exhaust_self_fix_budget`"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (WORKFLOW_STOP_BULLET_COUNT 48, RECORDED_TOTAL_SITES 19)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One escalation and one other move per ticket; a level-raising re-score is the escalation; the used-up stop bullet matches"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-01: one escalation and one other move per ticket, counted from the decision notes, then a named human"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-01: besides the one escalation the Tech Lead makes at most one other move, and a level-raising re-score is the escalation"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Tech Lead writes the dev tasks before scoring them, in tech-lead.md, WF04 step 2 and the rubric"
    requirement: TIER-01
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-07: Responsibilities write the dev tasks (item 2) before scoring them (item 3)"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-07: the Tech Lead step writes the dev tasks before it scores them"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-07: the Tech Lead writes the dev tasks before it scores, so the factors read a written dev plan"
        status: pass
    human_judgment: false
  - id: D4
    description: "The engineer's failed-attempt trigger uses WF04's words; a junior stops BLOCKED on every rubric risk tag, F3 = 1 included"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-18 / WR-04: a blocked engineer, or one whose gate ends `BLOCKED_NEEDS_FIX` after its bounded self-fix, publishes a `failed-attempt` note per WF04"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-02 / TIER-03: a junior also stops on every other rubric risk tag, F3 = 1 included"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Orchestrator routes `ready-ticket dev plan -> Tech Lead`, keeps every earlier route and stays at or under 7,359 B"
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-30: the Orchestrator routes plan, code and design system to the Tech Lead, the engineer and the Designer"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-30: orchestrator.md did not grow past its 7,359 bytes before plan 39-08"
        status: pass
    human_judgment: false
  - id: D6
    description: "A first-time reader following WF04 steps 14-16 on a gate failure reaches the named-human stop before any re-enqueue"
    requirement: TIER-04
    verification: []
    human_judgment: true
    rationale: "Reader comprehension is a backstop truth in the plan; the text assertions prove the words and their order, not how a first-time reader takes them"
  - id: D7
    description: "Six review findings recorded fixed; diff disposition held at the pre-phase 721"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)'"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-30
---

# Phase 39 Plan 12: WF04 named-human stop, Tech Lead move bound and engineer trigger (gap closure round 1) Summary

**WF04 step 15 now stops for a named human after a gate `BLOCKED_NEEDS_FIX`, before the ticket goes back to `Ready for Dev`. Step 16 creates no new subtask until that human confirms. The stop bullet now says only what Workflow 05 says, and no checkpoint count moved. Each ticket gets at most one escalation and one other move. The Tech Lead writes the dev tasks before it scores them. The engineer's trigger uses WF04's own words, a junior stops on every rubric risk tag, and the Tech Lead route reads `ready-ticket dev plan`.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-30T07:02:41Z
- **Completed:** 2026-10-30T07:11:48Z
- **Tasks:** 3
- **Files modified:** 8 (1 created)

## Accomplishments
- **CR-02 / TIER-04 closed (gap 2).** Step 15 gains `After a gate \`BLOCKED_NEEDS_FIX\`, stop until a named human confirms the move.` before the return to `Ready for Dev`. Step 16 gains `Create it only once the step 15 move is recorded and, after a gate failure, confirmed by that human.` The stop bullet now reads `A named human confirms the Tech Lead's decision before the re-enqueue (step 15). Workflow 05 sets this human stop when the self-fix budget is spent.` and still ends with `checkpoint: exhaust_self_fix_budget`.
- **T-39-16 kept.** WF04 carries each of its two checkpoint tags once, both in `## Stop conditions`, and no `## Steps` text has a `checkpoint:` tag. WF05 and `scripts/checkpoints.ts` are untouched: last commit `0f11ad70` both before and after, and `git diff --quiet` passes. `WORKFLOW_STOP_BULLET_COUNT` is still 48 and `RECORDED_TOTAL_SITES` is still 19.
- **WR-01.** tech-lead.md item 5 and WF04 step 15 now say: `Besides the escalation, make at most one other move per ticket. A re-score that raises the level is the escalation.` Step 15 also counts earlier moves from the ticket's `decision` notes. The used-up bullet now reads `Used up means the one escalation is spent and the one other move is spent too.`
- **WR-07.** tech-lead.md Responsibilities now has item 2 `Write the dev tasks…` and item 3 `Score the dev tasks and the ticket per the rubric.` WF04 step 2 states the write-then-score order, and so does the rubric's opening.
- **WR-04.** The `## Levels` trigger now uses WF04 step 14's words. The phrase "fails a second time" is gone.
- **WR-02.** A junior also stops on auth, money, PII, data writes, a public interface or config. The rubric's `## Junior exclusions` names the F3 = 1 tags, citing mapping rule 4.
- **WR-05.** The Orchestrator route is now `structure/tradeoffs -> Architect  ready-ticket dev plan -> Tech Lead`. The file is 7,272 B, under the 7,359 B cap, and every earlier route is still asserted.
- 39-REVIEW-DISPOSITION.md records CR-02, WR-01, WR-02, WR-04, WR-05 and WR-07 as `fixed`, and `open: 7`.

## Task Commits

1. **Task 1 (tracer): WF04 named-human stop and accurate WF05 reference (CR-02).** Commit `a1fd04dd` (fix). The tracer gate re-ran `<verify>` green. The run was in end-of-phase mode with automated-only checks, so execution expanded with no checkpoint.
2. **Task 2: Tech Lead move bound and write-then-score order (WR-01, WR-07).** Commit `34f92ff7` (fix).
3. **Task 3: engineer trigger, junior stop rule, routing name (WR-04, WR-02, WR-05) and review dispositions.** Commits `e0fdc899` (fix) and `7aa36bc5` (docs).

## Files Created/Modified
- `agent-factory/workflows/04-ticket-to-pr.md`: the step 2 order sentence, the step 15 bound and human stop, the step 16 wait sentence, and the reworded gate-failure and used-up stop bullets. No new bullet and no new tag.
- `agent-factory/roles/tech-lead.md`: items 2 and 3 swapped, item 3 reworded, and the item 5 bound sentences. The file is 3,323 B, under the 3,381 B WARN tier.
- `agent-factory/roles/software-engineer.md`: the WF04 trigger sentence and the extra junior stop sentence. The file is 4,631 B, under the 4,712 B WARN tier.
- `agent-factory/roles/orchestrator.md`: `ready-ticket dev plan -> Tech Lead`, at 7,272 B.
- `agent-factory/checklists/complexity-rubric.md`: the write-first line and the F3 = 1 junior-exclusion line.
- `scripts/tier-kit-text.test.ts`: new CR-02, WR-01 (×2), WR-07 (×3) and WR-02 cases. The T-39-16 and D-18 pins moved to the new wording, with negative checks for the old phrases. The routing case now asserts the new route. Every existing case is kept.
- `docs/audit/29-style-dispositions/39-12.md` (new): 15 rows. The four `## Stop conditions` rows each carry a companion cell.
- `39-REVIEW-DISPOSITION.md`: six rows set to `fixed`.

## Verification (plan-level)
- `npm run build && npm run typecheck`: exit 0.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts scripts/check-foundation-guards.test.ts`: 6 files, **680 passed**, 0 failed.
- These gates all exit 0 with no FAIL: check-foundation-guards, validate-agent-factory (with `VALIDATE_KIT_ROOT=.`), check-audit-register, check-imperative-lexicon, check-banned-claims, check-kit-refs, check:claim-anchors, freshness:adapters/catalog/guarantees/hook-manifest, freshness (88 `.js`) and check:build-parity. The orchestrator.md WARN was already there before this plan (7,272 B ≤ 7,359 B).
- `node scripts/check-diff-disposition.js`: 721 findings, the pre-existing red, unchanged. Each edit pushed the count up (725, 729, 724) and it fell back to 721 once the rows were added.
- `git status --short docs/audit/28-prepass-evidence.md`: still ` M`. It was never staged or touched.

## Decisions Made
- CR-02 is fixed by rewording WF04, not WF05, as the plan's flagged assumption says.
- WR-01 bound: one escalation plus one other move, and a level-raising re-score counts as the escalation.

## Deviations from Plan

**1. [Rule 3 - Blocking] `validate-agent-factory.js` needs `VALIDATE_KIT_ROOT`.** This is the same as in 39-11: run bare, the script refuses by design. It was run as `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and printed `ALL CHECKS PASSED`. No file changed.

**2. [Process] Task 3 committed as two commits (fix + docs).** The review-disposition Source cells name each fix by its short commit, so the docs commit has to come after the Task 3 fix commit. Plan 39-11 used the same split.

**Total deviations:** 2 (1 invocation detail, 1 commit split). **Impact on plan:** no scope change.

## Issues Encountered
None.

## Known Stubs
None.

## User Setup Required
None.

## Next Phase Readiness
- Gap 2 (CR-02, TIER-04) is closed in text. Whether a first-time reader reaches the stop is a backstop truth left for the end-of-phase reader check.
- Plan 39-13 owns the remaining open findings: WR-06, WR-09, WR-10, IN-03..IN-06.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*

## Self-Check: PASSED
- FOUND: docs/audit/29-style-dispositions/39-12.md, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/roles/software-engineer.md, agent-factory/roles/orchestrator.md, agent-factory/checklists/complexity-rubric.md
- FOUND commits: a1fd04dd, 34f92ff7, e0fdc899, 7aa36bc5 (all ancestors of HEAD)
