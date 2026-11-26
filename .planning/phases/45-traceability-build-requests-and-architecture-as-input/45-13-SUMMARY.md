---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 13
subsystem: kit-text
tags: [workflow-20, upstream, floors, build-requests, board, gap-closure]
gap_closure: true
gap_ids: [G-45-1, G-45-9]

requires:
  - phase: 45-12
    provides: "The `withdrawn, by human:<name>: <reason>` History form for an `open` build request"
  - phase: 45-14
    provides: "The floor exception in the role-facing given-input rule and the Orchestrator's Workflow 20 pointer"
provides:
  - "Workflow 20 floor paragraph pointing at the canonical floors (each SAFETY_FLOORS id) and naming the §14, security and NFR gates"
  - "The ordered floor-conflict path: observation, BA/PM filing per steps 1 to 5 with both bullets, the Orchestrator's check, then the stop; the human's decision and the lift"
  - "The human-stop bullet form in the board contract, written by BA/PM, raised by the observing role, owned by a named human"
  - "Human-only withdrawal of carried, deviation and floor-conflict requests (step 13, the human's-word stop bullet, the Done condition)"
  - "The WR-03 unblock rule: a ticket leaves Blocked only when no other bullet remains (step 12, Board moves)"
  - "flow-guidance-text 45-02 case (c) derived from SAFETY_FLOORS, and the plan 45-13 describe, cases (a)-(j)"
affects: [phase-45-verification, phase-45-uat]

actuals:
  tokens: 11200     # chars/4 over the realized diff (44728 chars, 3d939f41..4e3e163c)
  tasks: 2
  commits: 3        # MEASURED: git rev-list --count 3d939f41..HEAD
plan_head_before: 3d939f4111fcb79429cb940ea90a4c84dc7644f9
plan_head_after: 4e3e163c21551529d328dd5090c5209d16ff9f8a

tech-stack:
  added: []
  patterns:
    - "A durable ticket guard that names no request (the human-stop bullet), so no request lifecycle event can remove it"
    - "Text-test needles derived from the canonical list (SAFETY_FLOORS), never typed as a list"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-13.md
  modified:
    - agent-factory/workflows/20-upstream-sources.md
    - agent-factory/contracts/board.md
    - scripts/flow-guidance-text.test.ts
    - .planning/phases/45-traceability-build-requests-and-architecture-as-input/45-REVIEW-DISPOSITION.md

key-decisions:
  - "45-13: A deviation or floor-conflict request is told apart by the human-stop bullet on each affected ticket, which holds the property. BA/PM writes it at filing (steps 1 and 5), naming the observing role as raiser. The Orchestrator names the kind in the hand-off and confirms the bullet afterwards, and the observing role's sealed observation note records the kind. The bullet names no request, so neither a withdrawal nor step 12 removes it. BA/PM's `## Question` mark (step 4) is a second, weaker mark"
  - "45-13: No role file's `## Board moves` changed. The Architect only records the observation, which its `## Output` allows; BA/PM writes both `## Blocked` bullets; the Orchestrator hands off, confirms and stops"
  - "45-13: Accepted residual T-45-47: BA/PM omits the human-stop bullet and the Orchestrator also fails to confirm it. No program checks it (human decision 3, same family as T-45-35); the Done condition names the bullet and the UAT deviation probe exercises the path"
  - "45-13: Human UAT decision 2 supersedes the parenthetical floor list in D-17, REQUIREMENTS ARCH-02 and ROADMAP Phase 45 success criterion 5. Workflow 20 now points at the canonical floors (the `checkpoints` roster's floor rows, SAFETY_FLOORS) and names the §14, security and NFR gates. Amending those planning texts is left to the human"
  - "45-13: Review finding WR-03 is fixed by 9ba0b91e: step 12 and Board moves move a ticket to `Backlog` only when no other `## Blocked` bullet remains"
  - "45-13: Workflow 20 names the config reference as `factory.config.md`, not by its `agent-factory/config/` path, because check-kit-refs Assertion 1 (D-08.1) refuses that path in a workflow"

patterns-established:
  - "Human-stop bullet: a `## Blocked` bullet owned by a named human that names no request, so only that human's word removes it"

requirements-completed: [ARCH-02, ARCH-01, BR-02, BR-03]

coverage:
  - id: D1
    description: "Workflow 20 points at the canonical floors, names each SAFETY_FLOORS id and the §14, security and NFR gates; the write-verification term and the never-move claim are gone"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (c)"
        status: pass
      - kind: other
        ref: "node scripts/check-kit-refs.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "The floor-conflict path files the request per steps 1 to 5 before the stop, and only a named human lifts the stop"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the floor stop in Workflow 20 (plan 45-13, G-45-1, G-45-9, ARCH-02) (a), (b), (e)"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (WORKFLOW_STOP_BULLET_COUNT still derives 58)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The board contract shows the human-stop bullet form, owned by a named human"
    requirement: BR-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the floor stop in Workflow 20 (plan 45-13, G-45-1, G-45-9, ARCH-02) (c)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Withdrawal of a carried, deviation or floor-conflict request needs a named human; the deviation rule agrees with step 12"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the floor stop in Workflow 20 (plan 45-13, G-45-1, G-45-9, ARCH-02) (g), (h), (i), (j)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in Workflow 20 (plan 45-10, BR-03, BR-05, BR-06) (a), (b), (e)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A ticket leaves Blocked only when no other bullet remains (WR-03)"
    requirement: BR-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the floor stop in Workflow 20 (plan 45-13, G-45-1, G-45-9, ARCH-02) (f)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The given-input sentence, the ADR bullet, the Architect bullet and the Done condition carry the floor exception"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the floor stop in Workflow 20 (plan 45-13, G-45-1, G-45-9, ARCH-02) (d), (j)"
        status: pass
    human_judgment: false
  - id: D7
    description: "A live agent files BR-1 via BA/PM before the floor stop, writes both bullets, refuses a human-less withdrawal, and keeps a deviation ticket Blocked after a BA/PM-alone withdrawal"
    verification: []
    human_judgment: true
    rationale: "Agent behaviour on the text is not asserted by any test (human decision 3 rules out a program check). The plan's end-of-phase UAT re-test (the G-45-1 probe and the deviation probe) is the measure."

duration: 8min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 13: The floor stop with no side door Summary

**Workflow 20 now files a floor-conflict build request through BA/PM before the stop, points at the canonical floors, and holds every deviation or floor-conflict ticket under a human-stop bullet that names no request, so only a named human's word unblocks it.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-26T17:03:29Z
- **Completed:** 2026-11-26T17:11:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- The floor paragraph of `## Upstream architecture` points at the floor rows of the `checkpoints` roster and names `open_pr`, `test_integrity`, `production_requires_human_confirmation` and `protected_branch_merge`, plus the §14, security and NFR gates. It says no upstream decision moves a floor and that a floor cell is set only in `.grugops/factory.config.json`. The transcribed list, "verify-before-write" and "They never move." are gone.
- The floor-conflict path is a paragraph and six bullets in the debug session's proven order. The observing role records the observation, and the Orchestrator routes a conflict it finds to the Architect. BA/PM files per `## Build requests` steps 1 to 5 and writes both bullets. The Orchestrator confirms both, then stops. The bullets also say what the human decides and that only a named human lifts the stop.
- Steps 1, 4 and 5 carry the marks: the Orchestrator names the kind and confirms the bullet, BA/PM says the kind in `## Question`, and BA/PM writes the human-stop bullet raised by the observing role.
- Step 12 and `## Board moves` (WR-03): a ticket moves to `Backlog` only when no other `## Blocked` bullet remains.
- Step 13, the human's-word stop bullet and the Done condition reserve withdrawing a carried, deviation or floor-conflict request, and removing a human-stop bullet, to a named human.
- The deviation bullet gives each ticket the human-stop bullet and re-plans the tickets without the deviation when a named human withdraws the request (D-16).
- `agent-factory/contracts/board.md` shows the human-stop bullet: `- 2026-12-01, raised by Architect/Design: deviation from upstream DEC-12 (owner: named human)`.
- `scripts/flow-guidance-text.test.ts`: 45-02 case (c) derives its floor needles from `SAFETY_FLOORS`, and the new plan 45-13 describe has cases (a)-(j). `WORKFLOW_STOP_BULLET_COUNT` stays 58 and both reworded stop bullets stay untagged.
- `docs/audit/29-style-dispositions/45-13.md`: 44 rows (25 for Task 1, 19 for Task 2), with companions on the two `## Stop conditions` rows and the three `## Done condition` rows.

## Task Commits

1. **Task 1 (tracer): the floor-conflict path end to end** - `023d12c7` (fix)
2. **Task 2: close the side doors** - `9ba0b91e` (fix)
3. **WR-03 marked fixed** - `4e3e163c` (docs)

The tracer gate re-ran Task 1's automated verify chain after its commit (end-of-phase mode, automated-only verify) and passed before Task 2 started.

## Files Created/Modified

- `agent-factory/workflows/20-upstream-sources.md` - the floor rule, the ordered path, steps 1, 4, 5, 12 and 13, two stop bullets, Board moves, Done condition
- `agent-factory/contracts/board.md` - the human-stop bullet form under `### Ticket body sections`
- `scripts/flow-guidance-text.test.ts` - `SAFETY_FLOORS` import, rewritten 45-02 case (c), plan 45-13 describe (a)-(j)
- `docs/audit/29-style-dispositions/45-13.md` - disposition notes and rows
- `.planning/phases/45-traceability-build-requests-and-architecture-as-input/45-REVIEW-DISPOSITION.md` - WR-03 `fixed`, `open: 12`

Not changed, because their gate reported no drift: `docs/reference/README.md` and `docs/reference/agents/*` (`npm run freshness:catalog`: 27 pages, 0 differences). No role file changed (`git log 3d939f41..HEAD -- agent-factory/roles/` is empty), and `scripts/checkpoints.ts` is unchanged.

## Decisions Made

See `key-decisions` in the frontmatter. In short: the human-stop bullet is what holds the property. No role's `## Board moves` changed. T-45-47 is accepted. Human decision 2 supersedes the floor list in D-17, REQUIREMENTS ARCH-02 and ROADMAP Phase 45 success criterion 5, and the human amends those texts. WR-03 is fixed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The config reference is named by file name, not by its kit path**
- **Found during:** Task 1
- **Issue:** The plan's floor paragraph named `agent-factory/config/factory.config.md`. `node scripts/check-kit-refs.js` Assertion 1 (D-08.1) refuses any `agent-factory/config/` path in a workflow. Its exemption is counted and limited to the config reference's own self-references, and widening it needs an argued, recorded decision.
- **Fix:** The sentence reads "the `checkpoints` roster in the config reference, `factory.config.md`, marks `floor`". Test 45-02 (c) requires that phrase instead of the kit path, and also asserts that Workflow 20 holds no `agent-factory/config/` string. The plan's key_link pattern `agent-factory/config/factory.config.md` therefore does not match. The link itself holds through `factory.config.md` and the four `SAFETY_FLOORS` ids.
- **Files modified:** `agent-factory/workflows/20-upstream-sources.md`, `scripts/flow-guidance-text.test.ts`, `docs/audit/29-style-dispositions/45-13.md`
- **Commit:** `023d12c7`

**Total deviations:** 1 auto-fixed (1 blocking). **Impact:** wording only; every floor id and the roster pointer stay, and the gate stays green.

## Verification

- `npx vitest run scripts/flow-guidance-text.test.ts`: 195 passed (45-02, 45-10, 45-11, 45-14 and the new 45-13 describe).
- `npx vitest run scripts/checkpoints.test.ts scripts/floor-invariance.test.ts scripts/generate-catalog.test.ts scripts/trace-instructions.test.ts scripts/check-imperative-lexicon.test.ts scripts/check-diff-disposition.test.ts`: 616 passed (the stop count still derives 58).
- `npm run check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `node scripts/check-kit-refs.js`, `check:diff-disposition`, `check:audit-register`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: all exit 0, no FAIL line, ALL CHECKS PASSED.
- `npm run freshness:hook-manifest` and `npm run freshness:catalog`: fresh.
- Every acceptance grep of both tasks passes (for example `steps 1 to 5` 1, `human-stop bullet` 6, `The floor does not move.` 2, 13 contiguous build-request steps, `WR-03 | warning | fixed` 1).
- The full suite was not run, as the plan says; the orchestrator runs it after this last wave.
- Not run here, by design: the end-of-phase UAT live probes in Task 2's `<human-check>` (the G-45-1 floor-conflict probe and the deviation probe), and the UAT test 9 read-through.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This was the last plan of the wave. Phase 45 is ready for verification and for the end-of-phase UAT re-test of G-45-1 and G-45-9 (the live probes in the plan's `<human-check>`). The planning texts that still carry the old floor list (D-17 in 45-CONTEXT.md, REQUIREMENTS ARCH-02, ROADMAP Phase 45 success criterion 5) are left for the human to amend.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
