---
phase: 40-plain-language-role-rewrite
plan: 13
subsystem: roles
tags: [orchestrator, uat-planner, definition-of-done, workflow-06, board-moves, gap-closure, CR-02, WR-02]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "40-02 approved D-33 pair table (Orchestrator owns `In UAT → Done`, the lean-mode close); 40-11 safety facts and 40-12 Stop-when freeze in the gates"
provides:
  - "Orchestrator lean close conditioned on the named human's sign-off (`checkpoint: sign_off_acceptance`), a human merge and the lean DoD"
  - "Orchestrator `## Stop when` item holding the ticket in `In UAT` until merge and sign-off"
  - "Lean Definition of Done item: the PR merged by a human"
  - "UAT Planner's `In UAT → Ready to Release` limited to enterprise mode, with a lean hand-over to the Orchestrator"
  - "Workflow 06 `## Board moves` and `## Done condition` aligned with both roles, with disposition rows"
  - "Permanent text pins: describe `the lean close keeps its human conditions (CR-02, WR-02; D-33)` (8 cases)"
affects: [40-14, phase-40-verification]

actuals:
  tokens: 4334
  tasks: 2
  commits: 5
plan_head_before: 8efa9f8bd136d181646d26cc44b8ee81b0129ce4
plan_head_after: 9ec16998c6dac4b723de71efe6efa7c3d3ddd85c

tech-stack:
  added: []
  patterns:
    - "A pair's condition is pinned in tier-kit-text, since the partition guard checks only who owns a pair"
    - "An unchanged clause on a touched watched line takes a row with identical before and after cells"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-13.md
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/checklists/definition-of-done.md
    - agent-factory/workflows/06-uat-pack.md
    - scripts/tier-kit-text.test.ts

key-decisions:
  - "The lean close keeps the D-33 pair and now names all three conditions: named-human sign-off (`checkpoint: sign_off_acceptance`), a human merge, the lean DoD"
  - "Lean mode has one `In UAT` exit owner: the UAT Planner moves to `Ready to Release` only in enterprise mode; in lean mode it leaves the ticket for the Orchestrator"
  - "The real role byte budget is set by check-foundation-guards.test.ts's corpus-total growth cases (orchestrator.md about 6,061 B, uat-planner.md about 2,750 B), tighter than the ROLE_CEILINGS WARN lines; the new wording was compacted to fit, with ceilings and the test untouched"

patterns-established:
  - "Board-move conditions get their own text pins beside the ownership partition"

requirements-completed: [PLAIN-02, PLAIN-03, PLAIN-04, PLAIN-07]

coverage:
  - id: D1
    description: "Orchestrator lean close needs the named human's sign-off, a human merge and the lean DoD; Stop when holds the ticket in `In UAT`"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-02: the lean close needs the named human's sign-off, a human merge and the lean DoD"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-02: `## Stop when` leaves the ticket in `In UAT` until a human merges and the named human signs off"
        status: pass
    human_judgment: false
  - id: D2
    description: "Lean Definition of Done carries 'merged by a human'; seed board Done row unchanged"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-02: the lean Definition of Done needs the PR merged by a human"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-33: the seed board's Done entry is unchanged"
        status: pass
    human_judgment: false
  - id: D3
    description: "UAT Planner's forward move is enterprise-only, with a lean hand-over and a mode-split done stop"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-02: the UAT Planner owns `In UAT → Ready to Release` in enterprise mode only and hands the lean close to the Orchestrator"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-02: the UAT Planner's done stop names the Release Manager for enterprise and the Orchestrator for lean"
        status: pass
    human_judgment: false
  - id: D4
    description: "Workflow 06 Board moves and Done condition agree with the roles; frozen sections byte-unchanged; disposition rows present"
    requirement: PLAIN-07
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-02: Workflow 06 `## Board moves` and `## Done condition` name the Orchestrator's lean close"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-02: Workflow 06 no longer offers the UAT Planner a direct move to `Done` in lean mode"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both roles under their WARN lines, corpus under 64,000 B, corpus-total harness green, adapters and catalog unchanged"
    requirement: PLAIN-04
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts -t \"corpus total\" (7 cases)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js; npm run freshness:adapters; npm run freshness:catalog"
        status: pass
    human_judgment: false
  - id: D6
    description: "The restored wording reads as the plain-English meaning of the board rule, so no role allows `Done` before a human merge or an agent-recorded sign-off (PLAIN-03 prohibition, verification: judgment)"
    requirement: PLAIN-03
    verification: []
    human_judgment: true
    rationale: "The plan marks the PLAIN-03 and PLAIN-02 prohibitions as judgment checks; pins prove the words are present, not that the meaning reads correctly"

duration: 44min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 13: The Lean Close Keeps Its Human Conditions Summary

**The Orchestrator's lean `In UAT → Done` close now requires the named human's sign-off (`checkpoint: sign_off_acceptance`), a human merge and the lean DoD, which itself now requires "the PR merged by a human". The UAT Planner's `In UAT → Ready to Release` is enterprise-only, so lean mode has exactly one owner for the `In UAT` exit. Text pins cover all of it.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-11-01T21:34:06Z
- **Completed:** 2026-11-01T22:18:00Z
- **Tasks:** 2
- **Files modified:** 6 (1 created)

## Accomplishments

- CR-02 closed: orchestrator.md `## Board moves` states all three human conditions on the lean close, and `## Stop when` holds the ticket in `In UAT` until merge and sign-off.
- The lean Definition of Done gains "the PR merged by a human; agents never merge", matching the seed board's Done entry `merged + released (or merged, lean)`. The seed board is unchanged. definition-of-done-enterprise.md inherits the item through "All of lean DoD, plus".
- WR-02 closed: uat-planner.md owns `In UAT → Ready to Release` only in enterprise mode and leaves the lean ticket in `In UAT` for the Orchestrator. Its done stop names both next owners. Workflow 06 says the same in `## Board moves` and `## Done condition`.
- No `X → Y` pair was added, removed or re-owned; both code spans are byte-identical (D-33).
- Eight permanent text pins in `scripts/tier-kit-text.test.ts` go red if any condition is dropped.

## Final wording of every changed line

orchestrator.md `## Board moves` (line 68):
> You own `In UAT → Done`, the lean-mode close. Close only after the named human signs off acceptance (`checkpoint: sign_off_acceptance`), a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds.

orchestrator.md `## Stop when` (new last item):
> - If no human has merged the PR or the named human has not signed off, leave the ticket in `In UAT`.

definition-of-done.md (new bullet after "ticket scope implemented"):
> - the PR merged by a human; agents never merge

uat-planner.md `## Board moves` (lines 38-39):
> In enterprise mode, you own `In UAT → Ready to Release` once the named human signs off the scenarios.
> In lean mode, leave the ticket in `In UAT` for the Orchestrator.

uat-planner.md `## Stop when` (done item):
> - After the human signs off, stop done: the Release Manager takes it in enterprise mode, the Orchestrator in lean.

06-uat-pack.md `## Board moves` (line 31):
> On `memory-bank/plans/board.md`, the UAT Planner moves the ticket `Ready for UAT -> In UAT` to begin acceptance. In enterprise mode, the UAT Planner moves the ticket to `Ready to Release` once the named human signs off. In lean mode, the UAT Planner leaves the signed-off ticket in `In UAT`. The Orchestrator closes it to `Done` once a human has merged the PR and the lean Definition of Done holds.

06-uat-pack.md `## Done condition` (line 49):
> The scenarios, test data, pass/fail criteria, signoff checklist, and known limitations exist. The named human has signed off. In enterprise mode the ticket moves to `Ready to Release`; in lean mode it waits in `In UAT` for the Orchestrator's close.

## Bytes (`wc -c`, UTF-8)

| File | Before | After | Limit |
|---|---|---|---|
| agent-factory/roles/orchestrator.md | 5,844 | 6,057 | WARN 6,195 / FAIL 6,546 |
| agent-factory/roles/uat-planner.md | 2,651 | 2,747 | WARN 2,811 / FAIL 2,970 |
| role corpus (`cat agent-factory/roles/*.md`) | 59,505 | 59,814 | WARN 64,000 |
| agent-factory/checklists/definition-of-done.md (D-06) | 600 | 647 | — |
| agent-factory/workflows/06-uat-pack.md (D-06) | 5,820 | 6,012 | — |

## TDD: RED / GREEN

- **Task 1 RED** (`f59df507`): `npx vitest run scripts/tier-kit-text.test.ts` gave 3 failed / 175 passed. Failures: the lean close lacks "named human" (`expected 'You own \`In UAT → Done\`, the lean-mod…' to contain 'named human'`); no `## Stop when` item holds the ticket in `In UAT` (`expected [] to have a length of 1 but got +0`); no DoD bullet with "merged by a human" (`expected [] to have a length of 1`). The seed-board case passed, as planned. Semantic assessment: each target case ran and failed on its own planned assertion; there were no load, syntax or fixture faults.
- **Task 1 GREEN** (`16e7609c`): 178/178.
- **Task 2 RED** (`2d4230a6`): 4 failed / 178 passed. The forward sentence lacks "enterprise"; the done stop lacks "enterprise"; Workflow 06 Board moves lacks "Orchestrator"; Board moves still contains "or directly to `Done` in lean mode". Semantic assessment: each failure is the planned assertion on the target text.
- **Task 2 GREEN** (`ca2877ef`): 230/230 over tier-kit-text and check-role-rules tests.
- REFACTOR: the compaction commit `9ec16998` (see Deviations); all pins still green.

## Task Commits

1. **Task 1: tracer, the Orchestrator's lean close and the lean DoD**: `f59df507` (test, RED), `16e7609c` (fix, GREEN)
2. **Task 2: WR-02, UAT Planner enterprise-only, Workflow 06 and its rows**: `2d4230a6` (test, RED), `ca2877ef` (fix, GREEN)
3. **Deviation fix: compact the new wording for the corpus-total harness**: `9ec16998` (fix)

The tracer feedback gate ran in interactive, end-of-phase mode with an automated-only verify: the full Task 1 verify was re-run on the committed tree (tests 178/178, every gate and freshness check green) before expansion.

## Files Created/Modified

- `agent-factory/roles/orchestrator.md`: lean-close conditions in `## Board moves`; one `## Stop when` item
- `agent-factory/roles/uat-planner.md`: enterprise-only forward move, lean hand-over line, rewritten done stop
- `agent-factory/checklists/definition-of-done.md`: bullet "the PR merged by a human; agents never merge"
- `agent-factory/workflows/06-uat-pack.md`: `## Board moves` tail and `## Done condition` ending
- `docs/audit/29-style-dispositions/40-13.md`: 8 disposition rows for Workflow 06 (1 kept-verbatim, 3 removed, 4 added)
- `scripts/tier-kit-text.test.ts`: describe `the lean close keeps its human conditions (CR-02, WR-02; D-33)`, 8 cases, plus file-level reads

## Decisions Made

- The new wording was compacted rather than the corpus-total test being changed: the plan forbids editing ROLE_CEILINGS or cutting a fact, and says to compact.
- An unchanged clause that shares a touched line in a watched workflow gets a row with identical before and after cells, following the earlier `agents-md-scribe.md` and Workflow 06 rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Role growth broke two corpus-total cases in check-foundation-guards.test.ts**
- **Found during:** full-suite run after Task 2
- **Issue:** Two harness cases grow every role in a mirror by one common fraction (about 6.9%, and 8% in the discriminating case) and expect no per-file FAIL. At 6,086 B orchestrator.md grew to 6,572 B (FAIL 6,546), and at 2,782 B uat-planner.md grew to 2,974 B (FAIL 2,970). Both cases pass at the plan's base sizes. So the real budget is about 6,061 B and 2,750 B, tighter than the WARN lines the plan's must_haves name.
- **Fix:** Same conditions in fewer bytes. Orchestrator: "signs off acceptance" for "signs off the UAT scenarios", one sentence instead of two, and "If" for "When" in the new stop. UAT Planner: "leave the ticket in `In UAT` for the Orchestrator", and the done stop "After the human signs off, ... takes it ... in lean". No condition was dropped, and ROLE_CEILINGS and the test were not touched.
- **Files modified:** agent-factory/roles/orchestrator.md, agent-factory/roles/uat-planner.md
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts`: 343 passed, 1 failed (the recorded floor-item case); `-t "corpus total"`: 7/7. Every plan gate and acceptance criterion re-run green; adapters 0 byte differences.
- **Committed in:** `9ec16998`

**2. [Rule 3 - Blocking] One extra disposition row for an unchanged clause**
- **Found during:** Task 2, step 6
- **Issue:** `check-diff-disposition` reads every clause on a touched line from both sides, so the unchanged first sentence of Workflow 06 line 31 was reported as added and removed.
- **Fix:** A "kept verbatim, line rewritten" row with identical before and after cells.
- **Committed in:** `ca2877ef`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both were needed to keep every gate green. The wording is shorter than the plan's examples and carries the same conditions. No scope creep.

## Issues Encountered

- The full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, 1,371 s) had 23 failures. After the compaction fix, 21 remain, and none touches a file this plan changed: the 5 known `uat-gate-exit-contract` cases; the known floor-item case in check-foundation-guards; 14 cases in context-io, context-io-writer-set, harness-instance-ledger and canonical-corpus that read `.planning/phases/27-*` and `31-*` files archived by `91b4cbc6`; and 1 installer-fs-census case for Node v26's `openAsBlobSync`. The new ones are logged in `deferred-items.md` under "From plan 40-13".
- The first full-suite attempt hit my 580 s timeout (exit 143) and was re-run without one.

## Known Stubs

None.

## Threat Flags

None. No new network, auth, file-access or schema surface. T-40-36, T-40-37 and T-40-38 are mitigated as planned: conditions plus a Stop-when hold plus pins; enterprise-only move plus Workflow 06 alignment plus pins; disposition rows plus frozen-section checksums unchanged plus diff-disposition exit 0.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Gap 2 (CR-02 with WR-02) is closed in roles, DoD, Workflow 06 and pins. WR-03 and the Workflow 06 line 33 dial wording stay deferred to plan 40-14's ledger, as planned.
- The headroom is small: orchestrator.md is 4 B under its corpus-total harness limit (about 6,061 B) and uat-planner.md 3 B under its limit (about 2,750 B). Any later growth in either role will turn those harness cases red before it reaches the WARN lines.

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-01*

## Self-Check: PASSED

All 6 key files exist; all 5 task commits (f59df507, 16e7609c, 2d4230a6, ca2877ef, 9ec16998) are ancestors of HEAD; every task acceptance criterion and the plan-level verification re-ran green after the final commit.
