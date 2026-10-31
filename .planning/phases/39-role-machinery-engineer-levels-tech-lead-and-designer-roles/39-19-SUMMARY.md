---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 19
subsystem: kit-prose
tags: [workflow-04, tech-lead, escalation, checkpoints, disposition-register, gap-closure]
gap_closure: true
gap_ids: [G-39-71]

requires:
  - phase: 39 (plans 39-16, 39-17, 39-18)
    provides: step 15 as labelled sub-bullets, the CR-01 no-move stop and step 16 hold, the park-in-blocked outcome at notify/off
provides:
  - "Workflow 04 hand-off loop: a used-up or unadjudicable ticket goes to the role whose job covers its cause at every value of checkpoints.escalate_unadjudicable_result, at most three times per cause"
  - "One named-human stop after three disputed rounds on one cause or a fundamental change, recorded with a `Stop: human` line and held by step 16"
  - "Workflow 04 step 17: the receiving role answers `Resolved:`, `Disputed:` or `Fundamental:`"
  - "The same rule stated in tech-lead.md `## Hard limits`, the factory.config.md escalate paragraph and the tagged used-up stop (W1)"
  - "BA/PM and Architect pointers at Workflow 04 step 17"
  - "PROJECT.md Key Decisions row and 39-CONTEXT.md D-21 amended"
affects: [39-20, phase 40 role rewrite, phase 41 orchestrator flow, deferred follow-up for other checkpoints]

actuals:
  tokens: 18556
  tasks: 2
  commits: 5
plan_head_before: bae7fb38e1a922477ef99a5f8ee9c71c1931b43b
plan_head_after: 59b7ac68f2e8234a9015c18b807129cd061a159e

tech-stack:
  added: []
  patterns:
    - "A hand-off is a fifth `Move:` value with a `To:` line, so existing holds and the gate-failure stop cover it"
    - "A disagreement round is counted only from a `Disputed:` decision note, a fixed first line"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-19.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/architect-design.md
    - scripts/tier-kit-text.test.ts
    - .planning/PROJECT.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-CONTEXT.md

key-decisions:
  - "G-39-71 / D-21 amended: a blocked ticket the Tech Lead cannot resolve goes to the role whose job covers its cause at every value of escalate_unadjudicable_result, at most three times per cause; a named human only after three disputed rounds on one cause or a fundamental requirement or rule change (Olger Oeselg, 2026-10-31)"
  - "A hand-off is a fifth `Move:` value (`Move: hand-off`) and counts toward no move limit"
  - "A round is a `Disputed:` decision note naming a hand-off note for the same cause; a block with a new cause counts no round"
  - "A fundamental change alters what a requirement delivers (beyond a split or clearer acceptance), or a business rule, a hard limit, a checkpoints value or an ADR"
  - "At notify/off the final human stop parks the ticket in Blocked with no move (39-18 park-in-blocked carried to the one point where it still applies)"
  - "The gate-failure sub-bullet is kept byte for byte: it is Workflow 05's exhaust_self_fix_budget stop, and the hand-off, being a `Move:`, stays under it"

patterns-established:
  - "Route to the resolving role first, human after three disputed rounds or a fundamental change (applied to Workflow 04 only; other checkpoints are the human's deferred follow-up)"

requirements-completed: [TIER-04]

coverage:
  - id: D1
    description: "Workflow 04 steps 15-17 and the used-up stop implement the hand-off loop and the single human stop"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#A blocked ticket the Tech Lead cannot resolve goes to the role whose job covers its cause (G-39-71, 39-19) (a)-(j)"
        status: pass
      - kind: other
        ref: "grep -c 'checkpoint: ' agent-factory/workflows/04-ticket-to-pr.md (2) and the stop-bullet awk count (6)"
        status: pass
    human_judgment: false
  - id: D2
    description: "tech-lead.md, factory.config.md, the tagged stop and step 15 state the same rule at every value (W1); BA/PM and Architect point at step 17"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#A blocked ticket ... (G-39-71, 39-19) (k)-(n)"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#tech-lead.md D-21 amended, WR-15, WR-01; config E3; WR-01 (39-18) (e)(f)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every changed watched clause carries a disposition row; the gate is back at 721"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js | grep -c '721 finding(s)' (1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The design choices made under the human's decision (round definition, fundamental-change test, hand-off as a Move, park at notify/off) match the human's intent"
    verification: []
    human_judgment: true
    rationale: "Claude's discretion inside the human's G-39-71 decision; the UAT test 71 re-check (listed by plan 39-20) is where the human confirms them"

duration: 29min
completed: 2026-10-31
status: complete
---

# Phase 39 Plan 19: Route a blocked ticket to the role that can fix its cause (G-39-71) Summary

**A ticket the Tech Lead cannot resolve now goes to BA/PM, the Architect or another role whose job covers its cause, under every value of `checkpoints.escalate_unadjudicable_result`. A named human is asked only after three disputed rounds on one cause, or for a fundamental change to a requirement or a rule. Workflow 04 steps 15-17, the tagged used-up stop, tech-lead.md and factory.config.md now say the same thing (W1).**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-31T08:09:03Z
- **Completed:** 2026-10-31T08:38:24Z
- **Tasks:** 2 (Task 1 tracer, Task 2 expansion)
- **Files modified:** 9

## Accomplishments

- Recorded the human's 2026-10-31 decision as a PROJECT.md Key Decisions row (amends D-21; G-39-71, resolves W1), quoting the human's three statements, and added a **D-21 amended** bullet to 39-CONTEXT.md.
- Workflow 04 step 15: the re-score stop is replaced by two sub-bullets, the hand-off (every value, at most three times per cause, `## Blocked` owner named) and the human stop (three disputed rounds or a fundamental change; a round is a `Disputed:` note; a block with a new cause counts no round). Step 15 now has seven sub-bullets.
- The move record gains `Move: hand-off` with a `To:` line and a `Stop: human` resume line. The confirmation shows the human the move note before the answer is recorded (W4). Step 16 dispatches the receiving role from the `To:` line with the task reference only (D-20) and holds on `Stop: human` at `block` (the CR-01 hold, retargeted).
- New step 17 tells the receiving role to fix or dispute the cause and to answer `Resolved:`, `Disputed:` or `Fundamental:`. It defines a fundamental change and says which board exit follows.
- The tagged used-up stop (FROZEN) hands off first, keeps "never retry in a loop" and its `escalate_unadjudicable_result` tag, and still ends at a named human. WF04 keeps 2 `checkpoint:` tags and 6 stop bullets.
- tech-lead.md (3,667 B), factory.config.md, ba-pm.md (3,837 B) and architect-design.md (3,865 B) state the same rule; each role stays under its WARN tier with no ceiling change.
- 56 disposition rows in docs/audit/29-style-dispositions/39-19.md. Frozen-section rows carry companion cells, and check-diff-disposition is back at 721.

## Task Commits

1. **Task 1 (tracer): decision record, WF04 hand-off loop, pins, register**
   - `7c55d989` docs(39-19): record the G-39-71 decision (D-21 amended)
   - `d72d1758` test(39-19): pin the Workflow 04 hand-off loop for G-39-71 (RED)
   - `e0dfa40b` fix(39-19): hand a used-up ticket to the role whose job covers its cause (G-39-71, WF04)
2. **Task 2 (expansion): tech-lead.md, factory.config.md, receiving roles**
   - `1d4e185a` test(39-19): pin the hand-off rule in tech-lead.md, factory.config.md and the receiving roles (RED)
   - `59b7ac68` fix(39-19): state the hand-off rule in tech-lead.md, factory.config.md and the receiving roles (G-39-71, W1)

Fix-commit short shas: Task 1 `e0dfa40b`, Task 2 `59b7ac68`.

## TDD evidence

- **Task 1 RED (`d72d1758`):** `npx vitest run scripts/tier-kit-text.test.ts` gave 27 failed / 106 passed out of 133. Every failure was an assertion on missing Workflow 04 text (for example `no sub-bullet opening "Apply the human stop."`, `no step starting "Read the hand-off note (receiving role)."`, `expected [ …(6) ] to have a length of 7`). There was no load, syntax or collection error. Case (i), the byte-for-byte gate-failure guard, passed as designed because it pins text that must not change. Semantic assessment: valid RED; each target case failed on its planned assertion.
- **Task 1 GREEN (`e0dfa40b`):** 270/270 across tier-kit-text, checkpoints and config-governance-consistency. Tracer gate (row 3, interactive end-of-phase, automated-only verify): the whole Task 1 verify block was re-run and passed before expansion.
- **Task 2 RED (`1d4e185a`):** 11 failed / 125 passed out of 136. All 11 were assertions on tech-lead.md, factory.config.md, ba-pm.md and architect-design.md text that did not exist yet or had to go. Semantic assessment: valid RED.
- **Task 2 GREEN (`59b7ac68`):** 466/466 across the seven files in the plan's verify list.
- The RED-evidence classifier (`gsd_run check tdd-red-evidence`) was not run: this is a `type: execute` plan, `workflow.tdd_mode` is false, and the plan required only that "the new describe and the moved cases fail on missing text (no load or syntax error)". The vitest output above is that evidence.

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md`: receiving role in `## Agents involved`; step 15 hand-off, human stop, move record, confirmation and board sub-bullets; step 16 hand-off dispatch and `Stop: human` hold; new step 17; `## Board moves` sentence; used-up stop reworded (14,547 B).
- `agent-factory/roles/tech-lead.md`: Reads steps 14-17; item 5 points at the hand-off; `## Hard limits` never escalate twice on your own, plus the hand-off, human-stop and park sentences.
- `agent-factory/config/factory.config.md`: roster cell; Workflow 04 stop bullet; step 15 bullet with one sentence per value and the round definition; stale-blocker and fundamental-change licence sentences.
- `agent-factory/roles/ba-pm.md`, `agent-factory/roles/architect-design.md`: "Answer a Tech Lead hand-off per Workflow 04 step 17."
- `scripts/tier-kit-text.test.ts`: the G-39-71 describe (cases a-n), plus the moved literals in the WR-01, IN-04, D-21, CR-02, WR-12, E3, G-39-7, CR-01, WR-01 (39-18) and tech-lead describes, each with a G-39-71 comment. Every existing case is kept.
- `docs/audit/29-style-dispositions/39-19.md`: created; 48 Workflow 04 rows and 8 role rows.
- `.planning/PROJECT.md`, `39-CONTEXT.md`: the decision record.

## Decisions Made (design choices under the human's decision)

| Choice | Reason |
|---|---|
| A hand-off is a fifth `Move:` value (`Move: hand-off`) with a `To:` line, counted toward no move limit | The gate-failure stop, the `Confirmed: no` rule and the step 16 holds already key on a `Move:` note, so the hand-off is covered with no new mechanism. The per-ticket limits (one escalation plus one other move) stay unchanged. |
| A round is a `Disputed:` decision note naming a hand-off note for the same cause: the receiving role writes one when it disputes, and the Tech Lead writes one when the ticket blocks again for the cause a `Resolved:` fix addressed. A block with a new cause counts no round. | The human defined disagreement as "When roles have argued 3 times and not found resolution". A fixed first line is counted, never free text, so the human is never summoned without a recorded disagreement (checker revision 1). |
| A fundamental change alters what a requirement delivers (beyond a split or clearer acceptance), or alters a business rule, a hard limit, a `checkpoints` value or an ADR | It turns the human's "fundamental changes ... to requirements and rules" into a test the receiving role can apply in step 17. |
| At `notify`/`off` the final human stop parks the ticket in `Blocked` with no move; a later human answer re-enters at the move record | This carries the human's 2026-10-30 park-in-blocked choice (39-18) to the one point where it still applies. The hand-offs run under every value. |
| The gate-failure sub-bullet is kept byte for byte (pinned by case (i)) | It is Workflow 05's `exhaust_self_fix_budget` stop. Moving it to the new rule is the human's deferred follow-up (39-UAT.md). Because a hand-off is a `Move:`, a hand-off after a `Cause: gate` note still waits for that human. Step 14's human-only path is unchanged. |

## W1-W4 closure

| Finding | Closed by |
|---|---|
| W1 (four places disagree at `notify`/`off`) | The phrases "the role whose job covers its cause", "after three disputed rounds, or when the fix changes a requirement or a rule fundamentally" and "in `Blocked` with no move" appear in WF04 step 15, the used-up stop, tech-lead.md `## Hard limits` and the factory.config.md escalate paragraph, pinned by case (k). |
| W2 (exit from the parked state) | Step 17's `Resolved:` exit to `Backlog` or `Ready for Dev`; the human `## Blocked` owner at the human stop; the one-time `notify` observation naming the last hand-off note; the stale-blocker sentence in factory.config.md. |
| W3 (one human stop with a resume record) | One human stop with the `Stop: human` line and its step 16 hold; "Never escalate a ticket twice on your own."; "A move or hand-off the human names counts toward no limit." The round rule: "A block with a new cause counts no round." |
| W4 (the human sees the move before confirming) | "At the human stop, show the human the move note before recording the answer." and "Show the human the hand-off notes and the answers to them." |

## Deviations from Plan

None in kit text: every target sentence was written as the plan gave it, and none had to be shortened for the lexicon (check-imperative-lexicon passed on the first run).

**1. [Rule 1 - Bug] Test comments reused the acceptance literal**
- **Found during:** Task 1, acceptance check
- **Issue:** The plan asked for a comment naming G-39-71 and 39-19 beside each moved literal, and also for `grep -cF 'G-39-71, 39-19' scripts/tier-kit-text.test.ts` to print 1. The first draft wrote those comments as `G-39-71, 39-19:`, so the grep printed 20.
- **Fix:** Reworded the comments to `G-39-71 (plan 39-19)`. They still name both, and the exact string now appears only in the describe title.
- **Files modified:** scripts/tier-kit-text.test.ts
- **Commit:** e0dfa40b

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** cosmetic; it keeps one acceptance criterion literally true.

## Issues Encountered

- `npx vitest run --exclude '**/scripts/e2e/**'` (the whole suite) was killed by my 580 s timeout before printing a summary. In its place I ran the 27 `scripts/*.test.ts` files that read a file this plan touches: 2247 passed and 6 failed. All 6 are reds already logged in deferred-items.md: 5 in `scripts/uat-gate-exit-contract.test.ts` (the archived `.planning/phases/31-*` directory is gone) and 1 LANG-07 case in `scripts/check-foundation-guards.test.ts` (the stray untracked `~/` directory). The 12 `install/*.test.ts` files were not re-run; this plan changes no installer input other than role text, and `npm run freshness:adapters` and `npm run freshness:catalog` pass.
- New deferred item logged: comments in `scripts/checkpoints.ts` (around lines 126 and 790) still describe the "re-score stop" and a used-up ticket going straight to a named human. The plan forbids editing that file, so they were left as they are.

## Verification

- `npm run build && npm run typecheck`: pass.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/check-uat-oracles.test.ts scripts/voice-model.test.ts scripts/check-imperative-lexicon.test.ts`: 7 files, 466 passed.
- `check-imperative-lexicon`, `check-foundation-guards` (no WARN line for tech-lead.md, ba-pm.md or architect-design.md; no repeated clause), `validate-agent-factory` (with `VALIDATE_KIT_ROOT=.`), `check-kit-refs`, `check:claim-anchors`, `freshness:adapters`, `freshness:catalog` and `freshness` (88 `.js` fresh): all exit 0.
- `node scripts/check-diff-disposition.js`: 721 findings (721 at plan base, 769 after the WF04 edit, 729 after the role edits, 721 after the rows).
- `git diff 40d0743f --stat -- scripts/checkpoints.ts scripts/checkpoints.js hooks/ scripts/check-foundation-guards.ts agent-factory/workflows/05-pr-quality-gate.md agent-factory/workflows/16-context-read-write.md agent-factory/workflows/18-context-compaction.md`: empty.
- `git status --short docs/audit/28-prepass-evidence.md` still shows ` M`; the `~/` directory was not touched.

## User Setup Required

None.

## Next Phase Readiness

- Ready for plan 39-20, which lists the UAT test 71 re-check for the human.
- The same route-to-resolving-role rule for the kit's other checkpoints (Workflow 16's disagreement stop and the rest) stays deferred, as the human decided.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-31*

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/39-19.md, agent-factory/workflows/04-ticket-to-pr.md, agent-factory/roles/tech-lead.md, agent-factory/config/factory.config.md, agent-factory/roles/ba-pm.md, agent-factory/roles/architect-design.md, scripts/tier-kit-text.test.ts
- FOUND commits on HEAD: 7c55d989, d72d1758, e0dfa40b, 1d4e185a, 59b7ac68
