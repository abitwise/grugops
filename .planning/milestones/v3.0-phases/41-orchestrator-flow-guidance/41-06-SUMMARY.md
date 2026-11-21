---
phase: 41-orchestrator-flow-guidance
plan: 06
subsystem: roles
tags: [orchestrator, role-switch, claim-registry, software-engineer, adapters, disposition-rows, phase-gate]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: plan 41-04's Workflow 17 text and plan 41-05's `free` and `sweep`, which the pointer line sends the Orchestrator to
provides:
  - "`orchestrator.md` responsibility 6, the one pointer to Workflow 17, and the D-13 and D-32 limit in `## Hard limits`"
  - "`_role-switch-protocol.md` step 4: the Orchestrator already claimed, and the role runs `done`"
  - the README lifecycle bullet and claim C-28-033 changed together, with C-28-001, C-28-010, C-28-022 and C-28-029 re-measured
  - one senior line in all three engineer adapters, the plan read on every host, and the plan-keyed junior stop
  - the Phase 41 D-31 revision of Phase 39 D-13 in PROJECT.md and 39-CONTEXT.md
  - IN-05 re-deferred with its measured reason
  - the phase gate, run in full at the plan head
affects: [workflow-17, orchestrator-role, software-engineer-role, claim-registry, phase-43-story, milestone-uat]

actuals:
  tokens: 17643
  tasks: 3
  commits: 8
plan_head_before: 3ed1925c7b9b04181a860f3809dfb4c58a10521d
plan_head_after: 8c006127ecd6a52017eec623f070ec599c4accdd

tech-stack:
  added: []
  patterns:
    - "A rule that keys on a tier reads the tier from the plan, because a sub-agent is shown its body and not its frontmatter"
    - "A case whose failure would print a whole file asserts a boolean with a one-line message, so the TAP report parses as RED evidence"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-06.md
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/README.md
    - agent-factory/packaging/subagent.frontmatter.md
    - docs/audit/28-claim-registry.md
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - .claude/agents/grugops-software-engineer-junior.md
    - .claude/agents/grugops-software-engineer-mid.md
    - .claude/agents/grugops-software-engineer-senior.md
    - scripts/flow-guidance-text.test.ts
    - scripts/tier-kit-text.test.ts
    - scripts/generate-role-adapters.test.ts
    - scripts/adapter-byte-baseline.test.ts
    - scripts/check-foundation-guards.test.ts
    - CHANGELOG.md
    - .planning/PROJECT.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-CONTEXT.md
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md

key-decisions:
  - "orchestrator.md keeps a `## Reads` bullet naming `_role-switch-protocol.md`, so it ends at 6,176 B and not the planned 6,087 B: the removed responsibility 7 was the role's only reference, and the validator requires one"
  - "The two corpus-total cases grow every role by 0.05 and let the protocol take the rest, because ROLE_CEILINGS is held and two roles now have about 6% to their per-file FAIL"
  - "`.planning/REQUIREMENTS.md` is left unchanged, as the plan's prohibition says: marking RUN requirements is the post-verification step"

patterns-established:
  - "Removing a role sentence can remove the only path to a file: run the validator as well as the text gates before calling a target text safe"

requirements-completed: [RUN-02, RUN-03, RUN-04, RUN-06]

coverage:
  - id: D1
    description: "`orchestrator.md` holds the one pointer line, 10 unbroken responsibilities and none of the old spawn, drain, claim or sweep lines, and it stays under its WARN"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#orchestrator.md points at Workflow 17 and states the limit (plan 41-06; RUN-04, RUN-06, D-12, D-13, D-32)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "`## Hard limits` carries the D-13 and D-32 sentences, and those sentences carry the decision"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#holds the D-13 and D-32 sentences in `## Hard limits`, word for word"
        status: pass
    human_judgment: true
    rationale: "A change to `## Hard limits` owes a named human's read. The rows stay `pending (named human):` until that read."
  - id: D3
    description: "The role-switch step says the Orchestrator already claimed and gives the role the `done` command"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the role-switch step agrees with Workflow 17 (plan 41-06; D-04, D-05)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The README says who claims, C-28-033 changed in the same commit, and every cited responsibility number points at text that exists"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the README says who claims (plan 41-06; D-04)"
        status: pass
      - kind: other
        ref: "npm run check:claim-anchors"
        status: pass
      - kind: other
        ref: "node scripts/check-audit-register.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "The three engineer adapters differ only in `name`, `description`, `model` and `effort`, and every tier is told to work at senior level"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#Phase 41 D-31: the three engineer adapters differ only in name, description, model and effort"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#Phase 41 D-31: every tier works as a senior engineer, and the tiers differ in adapter name, model and effort"
        status: pass
      - kind: other
        ref: "node scripts/adapters-freshness.js"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every host reads the plan before it starts, and the junior stop still binds under a junior plan"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#Phase 41 D-31: every host reads the plan before it starts, and no sentence scopes that read to some hosts"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js"
        status: pass
    human_judgment: true
    rationale: "A change to `## Stop when` owes a named human's read, and the tests hold the words, not whether an engineer on Claude Code follows them to the plan."
  - id: D7
    description: "A host with no sealed-note writer leaves `done` refused and the slot busy, and that residual is acceptable as shipped"
    requirement: RUN-02
    verification: []
    human_judgment: true
    rationale: "Task 2's human-check asks the human to read R-41-01 in docs/audit/41-residuals.md and accept it. It is a judgment on a recorded consequence."
  - id: D8
    description: "The phase gate: the full suite adds no failure to the measured baseline, and every text gate, freshness gate and oracle exits 0"
    requirement: RUN-02
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' at 8c006127"
        status: fail
    human_judgment: true
    rationale: "The run ends with 22 failures, all named as pre-existing in the dispatch. One of them, capture-live, is not in 41-VALIDATION.md's table, so a reader must accept the dispatch's list for that case."

duration: 59 min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 06: The Orchestrator's Pointer, the Registry and the Senior Engineer Prompt Summary

**`orchestrator.md` now points at Workflow 17 and limits its claim to dispatch in the adapter's name, the README and registry say who claims, and every engineer tier gets one senior instruction with the junior stop keyed on the plan.**

## Performance

- **Duration:** 59 min, of which about 24 was the final full suite. Two earlier suite runs add to it: one stopped early and one finished.
- **Started:** 2026-11-05T02:29:47Z
- **Completed:** 2026-11-05T03:28:53Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments

- Responsibility 6 is one pointer line. The spawn, drain, claim and sweep lines left the role, and the gate item stayed.
- `## Hard limits` says the Orchestrator claims only at dispatch and only in the adapter's name, never as itself, and never does a task's work. Where the `Agent` tool does not exist, it does the work only after a role switch.
- `_role-switch-protocol.md` step 4 agrees: the claim is already made, and the role runs `done` once its notes are published.
- The README bullet and C-28-033 changed in one commit. Five registry mechanisms were re-measured, and no `status` line moved.
- The three engineer adapters are byte-identical apart from `name`, `description`, `model` and `effort`.
- `## Levels` sends every host to the plan before work starts, so a junior plan stays discoverable with identical adapter bodies.
- A full run of the suite caught three faults the plan's per-task gates did not show. All three are fixed.

## The Review of the Engineer Prompt (Phase 41 D-31)

**Changed, each confirmed by reading it first:**

1. The adapter line `Work at the <level> level` gave a persona by tier. It is now one fixed line.
2. `## Levels` did not say every tier works as a senior engineer. It does now.
3. The plan read reached only `the other hosts`, so an engineer on Claude Code had no instruction to read the name the stop keys on. It now opens `On every host`.
4. Three `A junior ...` sentences keyed the stop on a persona. They now key on a junior plan, and every risk tag stays.
5. The `## Stop when` junior item made the same mistake. It now reads `a junior plan`.

**Needed no change:**

- `On Claude Code this role runs as ...`: a routing fact, not a persona.
- `At any level you may deviate from the plan`, and `These rules hold at every level.`: both address every tier alike.
- `complexity-rubric.md sets the scope of each level`: the tier choice stays with the rubric.
- The `levels:` frontmatter, the `Level:` description text, `claim.js --level` and the `models` dial.
- `## Do less`, `## Output`, `## Hard limits` and the rest of the role.

`scripts/adapters-freshness.test.ts`, `scripts/check-foundation-guards.ts` and the skill twins did not need a change. No failing run named them.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `b40f44b0` test(41-06): add failing cases for the Orchestrator pointer and the role-switch step
   - `ebebf472` feat(41-06): point the Orchestrator at Workflow 17 and state the claim limit
2. **Task 2: README, registry and records**
   - `a53ce933` docs(41-06): say who claims in the README, and re-measure the registry
3. **Task 3: The software engineer prompt**
   - `bbe43be6` test(41-06): move the engineer pins to the senior instruction and the plan read
   - `0e000143` feat(41-06): give every engineer tier one senior instruction, and key the junior stop on the plan
4. **Found by the phase gate**
   - `c052d53d` test(41-06): add a failing case for the Orchestrator's path to the role-switch protocol
   - `fc969df3` feat(41-06): keep the Orchestrator's path to the role-switch protocol
   - `8c006127` test(41-06): keep the corpus-total cases true now that two roles have less headroom

**Plan metadata:** the `docs(41-06)` commit that carries this file.

## TDD Evidence

- **Task 1 RED:** the target was `holds the pointer line as item 6, word for word`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed because item 6 was still the old `Agent` spawn line. The full RED run had 8 failed of 56.
- **Task 3 RED:** the target was the plan-read case, `Phase 41 D-31: every host reads the plan before it starts, and no sentence scopes that read to some hosts`. `RED_EVIDENCE_OK`. Semantic assessment: it failed on the old text with `a sentence naming the plan opens On every host: expected false to be true`, because the sentence opened `On the other hosts`. The full RED run had 10 failed of 301: six moved pins, the byte baseline among them, and four new cases.
- **Protocol reference RED:** the target was `still names the role-switch protocol, because the pointer carries the role no path to it`. A first record returned `INVALID_RED` (`invalid_record`), because a `toContain` over a section prints a multi-line value. The assertion became a boolean with a one-line message, and the record then returned `RED_EVIDENCE_OK`. Semantic assessment: it failed on `the Reads section names the protocol`, the planned absence.
- **GREEN:** each case passed after its text landed.
- **Tracer gate:** interactive, `end-of-phase`, automated-only verify, so no checkpoint. The Task 1 verify was re-run after its commit and passed before Task 2 started. The plan's Task 1 verify does not run the validator, so this gate did not catch deviation 1.
- **REFACTOR:** none.

## Plan Verification

**Full suite at `8c006127`, the plan's last code commit, with `TMPDIR` on the root disk:** 22 failed, 11,292 passed, 2 skipped, 1,442 s.

| File | Failed | Against the baseline |
|------|--------|----------------------|
| `scripts/context-io.test.ts` | 7 | in 41-VALIDATION.md |
| `scripts/uat-gate-exit-contract.test.ts` | 5 | in 41-VALIDATION.md |
| `scripts/harness-instance-ledger.test.ts` | 4 | in 41-VALIDATION.md |
| `scripts/context-io-writer-set.test.ts` | 2 | in 41-VALIDATION.md |
| `scripts/canonical-corpus.test.ts` | 1 | in 41-VALIDATION.md |
| `install/installer-fs-census.test.ts` | 1 | in 41-VALIDATION.md |
| `scripts/check-foundation-guards.test.ts` | 1 | in 41-VALIDATION.md, the `~/` case |
| `scripts/capture-live.test.ts` | 1 | **not in 41-VALIDATION.md**; named as pre-existing in the dispatch and in the 41-04 and 41-05 summaries |

The comparison was by full test name. All 21 cases of the table in 41-VALIDATION.md failed, and the one name outside it is the `capture-live` case. That case was not investigated, as the dispatch directs, so its cause is not established here.

**Every gate exits 0 at `8c006127`:** `build`, `typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:queue`, `freshness:hook-manifest`, `adapters-freshness`, `catalog-freshness`, `skill-twins-freshness`, `host-entries-freshness`, `guarantees-freshness`, `check-foundation-guards`, `validate-agent-factory` (with `VALIDATE_KIT_ROOT=.`), `check-role-rules`, `check-diff-disposition`, `check-imperative-lexicon`, `check-banned-claims`, `check-kit-refs`, `check-state-paths`, `check-audit-register`, `check:claim-anchors`, `check:residual-citations`, `check-uat-oracles`.

**Acceptance:**

- `orchestrator.md` is 6,176 B, under 6,195. `software-engineer.md` is 4,698 B, under 4,715. No WARN or FAIL line names either role file.
- `scripts/check-foundation-guards.ts`, `complexity-rubric.md` and `scripts/model-tiers.ts` have no diff from `3fbe37fb`.
- `git diff 3fbe37fb -- docs/audit/28-claim-registry.md` shows no added or removed `- status:` line.
- `git grep "Work at the"` finds nothing in `.claude/agents` or `scripts/generate-role-adapters.ts`.
- The three adapters hash the same once the four lines are removed.
- The `~` directory exists, and `.planning/REQUIREMENTS.md` has no change from this plan.
- The `docs/audit/28-prepass-evidence.md` change is the user's, and it was not staged.

## Files Created/Modified

- `agent-factory/roles/orchestrator.md` - the pointer, the limit and the `## Reads` bullet
- `agent-factory/roles/_role-switch-protocol.md` - step 4
- `agent-factory/roles/software-engineer.md` - `## Levels` and `## Stop when`
- `agent-factory/README.md`, `docs/audit/28-claim-registry.md` - the bullet and the re-measured mechanisms
- `agent-factory/packaging/subagent.frontmatter.md`, `scripts/generate-role-adapters.ts`, `.js`, `.claude/agents/grugops-software-engineer-*.md` - the senior line
- `docs/audit/29-style-dispositions/41-06.md` - 8 rows, 5 of them pending a named human
- `scripts/flow-guidance-text.test.ts`, `scripts/tier-kit-text.test.ts`, `scripts/generate-role-adapters.test.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/check-foundation-guards.test.ts` - the cases and pins
- `CHANGELOG.md`, `.planning/PROJECT.md`, `39-CONTEXT.md`, `deferred-items.md` - the records

## Decisions Made

See `key-decisions` above. Every other sentence is applied as `41-TARGET-TEXT.md` wrote it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The target text removed the Orchestrator's only reference to the role-switch protocol**
- **Found during:** the phase gate, `validate-agent-factory`
- **Issue:** responsibility 7 was the only line naming `_role-switch-protocol`, and the validator requires that reference. The planning mirror checked the size and the lexicon gate, not this one. The plan's Task 1 verify does not run the validator, so `ebebf472` carries the failure.
- **Fix:** one `## Reads` bullet, worded by capability. The plan said to keep the `Reads` line as it is, and that line is unchanged. The bullet is new, sits outside the frozen sections and carries no safety fact.
- **Effect:** `orchestrator.md` ends at 6,176 B, not the 6,087 B in the must-haves. It is still under the 6,195 B WARN, with 19 B to spare.
- **Files modified:** `agent-factory/roles/orchestrator.md`, `docs/audit/29-style-dispositions/41-06.md`, `scripts/flow-guidance-text.test.ts`
- **Verification:** `validate-agent-factory` exits 0, and a case pins the bullet.
- **Committed in:** `c052d53d`, `fc969df3`

**2. [Rule 1 - Bug] Two corpus-total cases assumed +12% per-file headroom that no longer exists**
- **Found during:** the full suite at `fc969df3`, 24 failed
- **Issue:** `orchestrator.md` and `software-engineer.md` grew with `ROLE_CEILINGS` held, so each has about 6% to its per-file FAIL. One fraction could not reach the 64,001 B WARN, and 0.08 passed the FAIL. By calculation the 0.08 case fails at the planned 6,087 B too, so the `## Reads` bullet is not the only cause. The ceilings stay held, as the plan requires.
- **Fix:** both cases grow every role by 0.05 and let the protocol, which only the total holds, take the remainder. Each still proves that the total goes off while no role fails alone. The first case's title changed to say so.
- **Files modified:** `scripts/check-foundation-guards.test.ts`, which the plan does not list
- **Verification:** the 7 `corpus total` cases passed, and the final suite has one failure in that file, the `~/` case.
- **Committed in:** `8c006127`

**3. [Rule 3 - Blocking] `deferred-items.md` already existed**
- **Found during:** Task 2
- **Issue:** the plan says to create the file. Earlier plans of this phase already had.
- **Fix:** IN-05 and the two CONTEXT ideas were appended, and the existing entries were left alone.
- **Committed in:** `a53ce933`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** one must-have's byte figure moved by 89 B, one test file outside the plan's list took a fix, and `ROLE_CEILINGS` did not move.

## Issues Encountered

- **Human reads are owed.** Neither `<human-check>` was run, under the `end-of-phase` mode. Task 3's read covers the five rows marked `pending (named human)` in `docs/audit/29-style-dispositions/41-06.md`, and the first paragraph of `## Levels`. Task 2's read covers R-41-01 in `docs/audit/41-residuals.md`. No human acceptance is written anywhere in this plan's files.
- **`orchestrator.md` has 19 B left under its WARN.** Any further sentence needs a cut or a ceiling decision. `software-engineer.md` has 17 B.
- **The first full-suite run was stopped.** Its gates had shown the validator failure, so it would have measured a tree about to change. The processes were stopped and checked, and no result from that run is used here. A timed-out wait also gave an empty comparison once; that output was discarded.
- **`41-TARGET-TEXT.md` still says 6,087 B.** It is an input to execution, so it was left as written.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All six plans of phase 41 have a SUMMARY, so the phase is ready for `/gsd-verify-work`.
- The verifier should collect the two human reads above.
- RUN-02, RUN-03, RUN-04 and RUN-06 are not marked in `.planning/REQUIREMENTS.md`; that is the post-verification step.
- Phase 43 owns any rewording of `agents claim that work` in C-28-001, C-28-010 and C-28-022.

## Self-Check: PASSED

The created disposition file and the key files exist. All eight commits are ancestors of HEAD and none deletes a file. The acceptance criteria of all three tasks were re-run at the plan head and pass, apart from the 6,087 B figure in deviation 1.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
