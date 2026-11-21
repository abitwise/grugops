---
phase: 40-plain-language-role-rewrite
plan: 07
subsystem: roles
tags: [plain-language, orchestrator, role-switch-protocol, board-moves, d-33, stop-when, workflow-17, workflow-08]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory baseline and check-role-rules; 40-02's approved reference role, D-02 byte targets and D-33 pair table
provides:
  - agent-factory/roles/orchestrator.md rewritten in plain English at 5,844 B (target 5,900), with `Ready for Dev → In Development` and `In UAT → Done` as code spans, no `… → Done` wildcard, clear-voice coordinator limits, a no-fabrication sentence, `UNKNOWN - verify` and `## Stop when`
  - agent-factory/roles/_role-switch-protocol.md rewritten in plain English at 2,340 B (target 2,600), five numbered steps, announce and exit lines kept, no persona phrase
  - agent-factory/workflows/17-task-claim.md `## Platform depth and width`, holding the platform depth and width detail moved out of the Orchestrator
  - agent-factory/workflows/08-sprint-planning.md aligned with the D-33 pairs (the 40-04 follow-up)
  - docs/audit/29-style-dispositions/40-07.md, rows for every changed watched clause
affects: [40-08, 40-09, 40-10]

actuals:
  tokens: 7522    # chars/4 over the realized diff (git diff 67100889..HEAD before this summary, 30,091 chars)
  tasks: 2
  commits: 3
plan_head_before: 67100889eb6b75c4481e7f648e6a10718ecdd6ac
plan_head_after: 4ebededf9489a2315db947985132f90811d1a019

tech-stack:
  added: []
  patterns:
    - "A registry-anchored clause removed from a frozen `## Hard limits` section needs a row whose `before` cell is exactly the clause as the gate split it (at the em dash), not the whole old sentence"
    - "Platform facts that are not grugops rules move into the workflow that owns the mechanism; the role keeps a one-sentence pointer"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-07.md
    - .planning/phases/40-plain-language-role-rewrite/deferred-items.md
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/08-sprint-planning.md

key-decisions:
  - "Orchestrator owns exactly `Ready for Dev → In Development` and `In UAT → Done` (the lean-mode close, once definition-of-done.md holds), per the approved D-33 table; the wildcard close is gone"
  - "The platform depth and width detail (three-layer default since v2.1.219, CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, the v2.1.217-v2.1.218 window, the 20 concurrent and 200 per session caps, the withheld-Agent degrade) moved to Workflow 17 `## Platform depth and width`; orchestrator.md points there in one sentence"
  - "Workflow 08 brought into line with D-33 in this plan rather than deferred: committed items stay in `Ready`, BA/PM moves them to `In Analysis`, the Orchestrator pulls from `Ready for Dev`"
  - "The kit-vs-state blockquote stays byte-identical on line 8 of orchestrator.md: kit-model.test.ts reads line 8 for LEGACY_FALLBACK_CLAUSE and check-kit-refs pins the do-not-hunt marker"
  - "No lexicon addition (D-32): both mirror sentence checks were clean"

patterns-established:
  - "The protocol keeps its protocol shape (opening, `## The 5 steps`, `## The invariant`); each numbered step is one short action, and detail sits on unnumbered lines beneath it"

requirements-completed: []

duration: ~55 min wall clock (about 14:35Z to 15:30Z, most of it two full-suite runs)
completed: 2026-11-01
---

# Phase 40 Plan 07: Orchestrator and role-switch protocol in plain English Summary

**The Orchestrator now reads as a plain numbered spine, at 5,844 B. It closes tickets through two named board pairs instead of a wildcard, keeps its coordinator limits in clear voice and marks unknowns. Its platform depth and width facts now live in Workflow 17. The role-switch protocol states its five steps and its invariant in 2,340 B, with no persona phrase.**

## Performance

- Duration: about 55 minutes
- Tasks: 2 of 2
- Files: 4 kit files modified, 1 disposition file and 1 deferred-items file created

## Accomplishments

- orchestrator.md: the sections now run in the RW-1 order. One job, the Activates-when sentence, the frontmatter and the heading are byte-identical to before. `## Responsibilities` has 13 numbered single actions: read config, read the board and notes, classify, split, enqueue thin `pending/` refs, spawn up to `queue.wip_limit` where `Agent` exists, drain one at a time through `_role-switch-protocol.md` where it does not, claim, work and close per Workflow 17, gate, sweep stale claims, require notes and trace refs, check the Definition of Ready, and give one next action. `### Routing matrix` (heading now exact) keeps every route and is followed by `### WIP gate`, then `### XL split` with `SPLIT_REQUIRED`.
- `## Hard limits`: never merge a protected branch, never deploy to production, merge and deploy stay with humans. Never pass a WIP limit or the queue width without a written reason. Never route around a stop condition. The Orchestrator is the only spawner and holds `Agent(<allowlist>)`. It honors `queue.claim_cap` and never relays data between agents. Faking a gate result, note or board move is never allowed, and anything unverified is marked `UNKNOWN - verify`.
- `## Stop when` has three items: input that fails the Definition of Ready goes back to BA/PM; a pull past a WIP limit with no written reason stops and is reported; a missing kit directory stops without a search.
- check-role-rules: orchestrator.md facts went from 11 before to 18 after, and the protocol from 6 to 6.

## Task Commits

1. **Task 1 (tracer): Orchestrator rewrite, Workflow 17 move, Workflow 08 alignment, rows**: `fd03c053`
2. **Task 2: role-switch protocol rewrite**: `80b996dc`
3. **Fix found by the full suite (protocol trace-ids line)**: `4ebededf`

The tracer feedback gate ran in interactive mode with `human_verify_mode: end-of-phase` and an automated-only verify block. It re-ran green before Task 2 started, so no checkpoint was raised.

## Measured bytes (D-02, D-06)

| File | Before | After | Target or note |
|------|-----:|-----:|------|
| agent-factory/roles/orchestrator.md | 7,035 | 5,844 | ≤ 5,900 (56 B headroom kept for Phase 41) |
| agent-factory/roles/_role-switch-protocol.md | 3,512 | 2,340 | ≤ 2,600 |
| agent-factory/workflows/17-task-claim.md | 7,168 | 8,183 | moved-in platform section |
| agent-factory/workflows/08-sprint-planning.md | 4,577 | 4,672 | D-33 alignment |
| agent-factory/checklists/definition-of-done.md | 600 | 600 | not edited |
| agent-factory/checklists/definition-of-done-enterprise.md | 1,115 | 1,115 | not edited |

## Decisions Made

See `key-decisions` in the frontmatter. In short: the D-33 pairs are the only board moves. Platform facts moved to Workflow 17. Workflow 08 was fixed here rather than deferred. The blockquote on line 8 stays byte-identical. No lexicon addition.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-diff-disposition refused two registry-anchored Hard limits clauses**
- **Found during:** Task 1 verify
- **Issue:** two clauses in the old coordinator paragraph equal README claim-registry anchors: "humans always hold merge and deploy" (docs/audit/28-claim-registry.md line 399) and "the shared verified context is the only channel" (line 382). The D-30 stand-in never admits a registry anchor, so rewriting the paragraph reported both as removed from a frozen `## Hard limits` region.
- **Fix:** two rows in 40-07.md with companion cells. The only-channel clause is kept byte-identical. The merge and deploy rule is reworded to "merge and deploy stay with humans" and sits beside the protected-branch and production rules.
- **Files modified:** docs/audit/29-style-dispositions/40-07.md
- **Commit:** fd03c053

**2. [Rule 1 - Bug] The protocol's trace-ids line matched the hand-trace instruction pattern**
- **Found during:** full-suite run after Task 2
- **Issue:** "Put the trace ids on each note's `refs` field." matched `HAND_TRACE_PATTERNS` (a write verb reaching "the trace"). This turned `scripts/trace-instructions.test.ts` "zero lines and zero paragraphs across the scan set match any pattern" red. The plan's Task 2 verify list did not include that test.
- **Fix:** reworded to "Each note carries the trace ids in its `refs` field." The test passes and every gate stays green.
- **Files modified:** agent-factory/roles/_role-switch-protocol.md
- **Commit:** 4ebededf

### Notes against the plan's wording

- Workflow 08 was edited for D-33 only, not to receive moved detail. The plan allowed that file "only if detail moves there", and the orchestrator's dispatch asked for the D-33 fix if this plan touched it. It is in files_modified, and it has rows.
- The two Definition of Done checklists were not edited. They already say the Orchestrator applies the lean list in lean mode and the superset in enterprise mode, which agrees with the D-33 pairs: the Orchestrator's `In UAT → Done` in lean mode, and the Release Manager's `Ready to Release → Done` in enterprise mode.
- Reads drops the separate "roles' published notes" bullet. Responsibilities item 2 reads them, and the pointer line names Workflow 16.
- Workflow 08 still has the caveman sentence "grug pick the work for the box, write it down, then build." on line 9. It is outside D-19 scope and was left alone, as 40-06 left the same pattern in other workflows.

## Recorded evidence

- Task 1 verify: the 7 named vitest files plus check-role-rules.test.ts: 498 passed. The foundation guards, the validator, check-role-rules, check-diff-disposition, the imperative lexicon, check-kit-refs, check-state-paths and check-banned-claims all exit 0. All four freshness gates exit 0. The orchestrator mirror sentence check prints no `zrole-` line.
- Task 1 acceptance values: 5844 B; `In UAT → Done` 1; `… → Done` 0; `UNKNOWN - verify` 1; `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in Workflow 17 1; `^### Routing matrix$` 1; `^### WIP gate` 1; `^## Stop when$` 1.
- Task 2 verify after the fix: audit-prepass, audit-model, kit-model, validate, check-role-rules, generate-role-adapters and trace-instructions: 614 passed. The foundation guards, the validator, check-role-rules, check-diff-disposition, check-audit-register, check-kit-refs and the lexicon all exit 0, and the protocol mirror check is clean. uat-gate-exit-contract has its 5 known pre-existing failures, which read missing phase-31 SUMMARY files.
- Task 2 acceptance values: 2340 B; `Fresh head` 0; `▶ entering <ROLE>` 1; `■ exiting <ROLE>` 1; `^[1-5]\. ` 5.
- Full suite (e2e excluded), run after 80b996dc: 10,763 passed, 22 failed, 2 skipped. 21 of the failures match the known set one for one: installer-fs-census 1, canonical-corpus 1, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5, and the `~/` case in check-foundation-guards. The 22nd was trace-instructions, caused by this plan and fixed in 4ebededf. That file was re-run green after the fix, and no other file changed in the fix.

### Sibling-caused reds

None. 40-03 to 40-06 were committed before this plan started, so every whole-tree gate read only this plan's edits.

## Deferred Issues

- Recorded in `.planning/phases/40-plain-language-role-rewrite/deferred-items.md`: claim-registry mechanism text (C-28-001, C-28-010 and the rows at lines 260 and 494) still quotes the old Orchestrator wording, such as `Decompose → enqueue → schedule → gate → sweep`, `does NOT relay data between agents` and `PARALLEL where Agent is available`. The rules still hold in plain English, and no gate reads these quotes. Plan 40-10 owns the registry.

## Issues Encountered

- The first full-suite run was cut off by a 590 s timeout before vitest printed its summary. It was re-run without a timeout (1,374 s) to get the counts above.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 40-08 (board-move ownership as a partition) can now read all 19 roles. The Orchestrator claims exactly `Ready for Dev → In Development` and `In UAT → Done`, and check-role-rules derives `board-from:Ready for Dev` and `board-from:In UAT`.
- PLAIN-02 now covers all 19 roles and the protocol. PLAIN-02 and PLAIN-03 still stay unchecked until 40-08's partition guard and the phase verification run.

## Self-Check: PASSED
