---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 14
subsystem: kit-text
tags: [roles, workflows, upstream, architecture, floors, gap-closure]
gap_closure: true
gap_ids: [G-45-9, G-45-1]

requires:
  - phase: 45-02
    provides: "Workflow 20 `## Upstream architecture` with the floor rule, Workflow 00 step 1, and the five one-line role pointers"
provides:
  - "The floor exception in every role-facing copy of the given-input rule (Architect, Greenfield Mapper, Workflow 00 step 1)"
  - "A Workflow 20 pointer on the Orchestrator's `upstream` config read"
  - "flow-guidance-text describe pinning both (plan 45-14 cases (a)-(c))"
affects: [45-13, phase-45-verification, phase-45-uat]

actuals:
  tokens: 31900
  tasks: 2
  commits: 2
plan_head_before: 6a15571f99ddc538c5919850d95804557cf6bebe
plan_head_after: 9ec61e9b7dabdda17748dd5f12b42cf9fdc130b0

tech-stack:
  added: []
  patterns:
    - "A role-facing copy of a rule carries its exception as one clause and points to the workflow that states the rule once"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-14.md
  modified:
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - scripts/flow-guidance-text.test.ts

key-decisions:
  - "orchestrator.md gets a Workflow 20 pointer on its `upstream` config read instead of a floor-conflict `## Stop when` entry: the file measured 6,170 B before and 6,184 B after (+14 B), against a WARN ceiling of 6,195 B and a FAIL ceiling of 6,546 B; a stop entry of about 100 B would cross WARN. The stop sequence is stated once in Workflow 20 (plan 45-13). A human may still ask for the entry as a recorded decision."
  - "The floor rule and the floor list stay in Workflow 20 alone; each role edit and the Workflow 00 sentence only name the exception and point there (D-17, D-18, Phase 40 D-05)."

patterns-established:
  - "Exception-carrying pointer: a role line that restates a rule's effect names its exception in one clause and points to the owning workflow"

requirements-completed: [ARCH-01, ARCH-02]

coverage:
  - id: D1
    description: "The Architect's and the Greenfield Mapper's one Workflow 20 line says a decision that conflicts with a floor is not taken"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the given-input rule carries the floor exception (plan 45-14, G-45-9, ARCH-01, ARCH-02) (a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 00 step 1 applies no upstream decision that conflicts with a floor and points to Workflow 20"
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the given-input rule carries the floor exception (plan 45-14, G-45-9, ARCH-01, ARCH-02) (b)"
        status: pass
      - kind: other
        ref: "npm run check:diff-disposition"
        status: pass
    human_judgment: false
  - id: D3
    description: "orchestrator.md names Workflow 20 in one line, its `upstream` config read, and states no floor rule"
    requirement: ARCH-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the given-input rule carries the floor exception (plan 45-14, G-45-9, ARCH-01, ARCH-02) (c)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#architecture as input (plan 45-02, ARCH-01, ARCH-02) (d)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Each edited role stays under its WARN ceiling, the role-rule inventory loses no fact, and the corpus-total fixture keeps its claim"
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js && npm run check:role-rules"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#corpus total"
        status: pass
    human_judgment: false
  - id: D5
    description: "Whether the given-input wording, with the exception, changes a live agent's outcome on a floor-conflicting upstream decision"
    verification: []
    human_judgment: true
    rationale: "The debug session showed the Workflow 20 wording flips the live outcome; this plan is hardening only. A live probe after plan 45-13 is the measure, and no test asserts agent behaviour."

duration: 6min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 14: The floor exception in the given-input rule Summary

**The Architect, the Greenfield Mapper and Workflow 00 step 1 each say an upstream decision that conflicts with a floor is not taken, pointing to Workflow 20, and the Orchestrator's `upstream` config read now names Workflow 20 (+14 B, under WARN).**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-26T16:55:36Z
- **Completed:** 2026-11-26T17:01:26Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `agent-factory/roles/architect-design.md` line 23 reads "taken as given input unless one conflicts with a floor, per Workflow 20" (2,968 B to 3,002 B; WARN 3,068).
- `agent-factory/roles/greenfield-mapper.md` line 20 reads "taken over `default_stack` unless one conflicts with a floor, per Workflow 20 and Workflow 00" (2,362 B to 2,396 B; WARN 2,410).
- Workflow 00 step 1 gains "Apply no decision that conflicts with a floor; Workflow 20 says what happens instead." (14 words, no modal verb, names no floor).
- `agent-factory/roles/orchestrator.md` line 17 ends "`compliance_regime` and `upstream` (Workflow 20)." (6,170 B to 6,184 B; WARN 6,195, FAIL 6,546). The `absent-config` fact keeps `documented defaults` and `agent-factory/README.md`.
- New describe in `scripts/flow-guidance-text.test.ts`, cases (a)-(c); the 45-02 describe is untouched and its cases (d) and (e) still pass, so only Workflow 20 holds "The floor does not move." and each of the five roles keeps one Workflow 20 line.
- `docs/audit/29-style-dispositions/45-14.md` with one **added** row for the new Workflow 00 clause; the three role clauses are admitted by the role-rule stand-in.

## Task Commits

1. **Task 1 (tracer): the floor exception reaches the Architect, the Greenfield Mapper and Workflow 00 step 1** - `4289685e` (fix)
2. **Task 2: orchestrator.md points at Workflow 20 from its `upstream` config read** - `9ec61e9b` (feat)

The tracer gate re-ran Task 1's verify chain after its commit (end-of-phase mode, automated-only verify) and passed before Task 2 started.

## Files Created/Modified

- `agent-factory/roles/architect-design.md` - floor exception on the Workflow 20 line
- `agent-factory/roles/greenfield-mapper.md` - floor exception on the Workflow 20 line
- `agent-factory/roles/orchestrator.md` - Workflow 20 pointer on the `upstream` config read
- `agent-factory/workflows/00-bootstrap-greenfield.md` - one step 1 sentence
- `scripts/flow-guidance-text.test.ts` - plan 45-14 describe, cases (a)-(c)
- `docs/audit/29-style-dispositions/45-14.md` - disposition notes and one row

Not changed, because their gates reported no drift: `docs/reference/agents/*` (`npm run freshness:catalog`: 27 pages, 0 differences) and `scripts/check-foundation-guards.test.ts` (corpus-total cases pass; role corpus 61,373 B, so ROLE_GROWTH was not re-measured).

## Decisions Made

- A Workflow 20 pointer on the Orchestrator's config read instead of a floor-conflict `## Stop when` entry. orchestrator.md: 6,170 B before, 6,184 B after; WARN 6,195 B, FAIL 6,546 B. A stop entry of about 100 B would cross WARN. The stop sequence is written once in Workflow 20 by plan 45-13, which the Orchestrator now reaches from its `upstream` read.

## UAT artifact status

The G-45-1 artifact `agent-factory/roles/orchestrator.md` is partly closed by choice. The Workflow 20 pointer is added. The floor-conflict `## Stop when` entry is not added: it would cross the WARN ceiling, and the stop sequence is stated once in Workflow 20 (plan 45-13). A human may still ask for the entry as a recorded decision. For the verifier and UAT, this file is then a recorded choice, not an open gap.

## Verification

- `npx vitest run scripts/flow-guidance-text.test.ts`: 185 passed (the 45-02, 45-10, 45-11 and new describes).
- `npm run check:role-rules`, `check:diff-disposition`, `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors`, `node scripts/check-kit-refs.js`, `check:audit-register`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: all exit 0, ALL CHECKS PASSED.
- `npx vitest run scripts/check-foundation-guards.test.ts scripts/check-role-rules.test.ts scripts/generate-catalog.test.ts scripts/check-diff-disposition.test.ts`: 629 passed.
- `npm run freshness:catalog` and `npm run freshness:adapters`: exit 0.
- `check-foundation-guards.js` prints one WARN, for the adapter `.claude/agents/grugops-orchestrator.md` (3,368 B against its 3,072 B pointer ceiling). This plan did not touch that file, and the WARN names no role file this plan edited.
- The full suite was not run, as the plan says; the orchestrator runs it after the last wave.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 45-13 rewrites Workflow 20 (the floor list and the stop sequence). The three role pointers and Workflow 00 step 1 point there and name no floor, so 45-13 needs no edit to them.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
