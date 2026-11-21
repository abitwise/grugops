---
phase: 37-overview-board-per-file-records-and-budgets
plan: 18
subsystem: kit-docs
tags: [agents-md, readme, writing-profile, board-contract, checklists, trace-render, split-03, split-02, scan-test]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-06 HAND_TRACE_PATTERNS in scripts/trace-model.ts; 37-13 tools/grugops/trace-render.js; 37-14 to 37-17 roles, the commit convention and all 19 workflows already clear of the scan patterns"
provides:
  - "AGENTS.md, agent-factory/README.md and agent-factory/writing-profile.md describe a trace rendered per ticket from published note refs, with an index, and NFRs as one file each under nfr/ with an index"
  - "The board contract's Reconciliation non-goal names the trace index; the three checklists read the rendered trace file and the NFR files the catalog index lists"
  - "scripts/trace-instructions.test.ts: a permanent scan over every tracked agent-factory markdown file plus AGENTS.md (77 files, counted two ways, every role and workflow a member) that fails on any line matching HAND_TRACE_PATTERNS"
  - "TRIPWIRE_MODULES and SCRIPTS_TEST_FILE_COUNT moved 78 -> 79 by re-derivation"
affects: [37-19]

actuals:
  tokens: 7124
  tasks: 3
  commits: 3
plan_head_before: ced5e6e44a37510a5a64f40517ba37ae9de96791
plan_head_after: bfa163e4134082aba4937a82375f0bacb96da11e

tech-stack:
  added: []
  patterns:
    - "A scan test takes its file set from one git ls-files call and checks its size against a second listing taken directory by directory from a walk of the disk (`:(glob)<dir>/*.md` per directory)"
    - "A test failure message that lists hits joins them with ' | ' so it stays on one line and the TAP report parses"

key-files:
  created:
    - scripts/trace-instructions.test.ts
  modified:
    - AGENTS.md
    - agent-factory/README.md
    - agent-factory/writing-profile.md
    - agent-factory/contracts/board.md
    - agent-factory/checklists/definition-of-done.md
    - agent-factory/checklists/definition-of-done-enterprise.md
    - agent-factory/checklists/observability-slo-checklist.md
    - docs/audit/28-claim-registry.md
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "The claim registry (docs/audit/28-claim-registry.md) changed in the Task 1 commit: four claims (C-28-013, C-28-020, C-28-025, C-28-033) sit on the reworded lines, and check-claim-anchors requires the verbatim block to change in the same commit. Their mechanism sentences now name the render; the README rows' line fields are corrected to the lines the claims now occupy"
  - "Publish is not added to the approved step-verb set: this plan's writing-profile edit is the governed-surfaces row only, and WF03 step 8 keeps Record (37-16)"
  - "WF18's `memory-bank/plans/traceability.md` mention and 'A promotion never removes a row either' are left as they are: WF18 is outside this plan's files and neither matches a scan pattern"
  - "The scan test's failure message joins hits with ' | ': vitest's TAP reporter writes a multi-line message unindented, which the RED-evidence classifier refuses as malformed"

patterns-established:
  - "Kit trace wording: 'the trace is rendered from those notes'; the trace index is `memory-bank/plans/traceability.md` and the per-ticket files sit under `memory-bank/plans/traceability/`"

requirements-completed: [SPLIT-03, SPLIT-02]

coverage:
  - id: D1
    description: "AGENTS.md, agent-factory/README.md and writing-profile.md describe the rendered trace and one file per NFR; AGENTS.md stays minimal"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "Task 1 scan grep over the three files | wc -l -> 0 (baseline 3); wc -c < AGENTS.md -> 8582 (limit 8653, HEAD 8453); check-claim-anchors exit 0 (47 rows byte-identical)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The board contract names the trace index; the checklists read the rendered trace file and the NFR files through the index"
    requirement: SPLIT-02
    verification:
      - kind: other
        ref: "scan grep over every tracked agent-factory/*.md outside workflows plus AGENTS.md: grep exit 1 (baseline 25 files); grep -ciE 'nfr/|NFR file' -> 1 (enterprise DoD) and 2 (observability-slo)"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/board-model.test.ts: 195 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "scripts/trace-instructions.test.ts fails the build on any hand-trace line across a derived, counted kit file set"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts: 9 passed on the live tree"
        status: pass
      - kind: unit
        ref: "mutation: pre-plan text of five kit files -> target case fails on 5 hits (gsd check tdd-red-evidence RED_EVIDENCE_OK); a planted line per pattern in qe-e2e.md and 09-daily-sweep.md -> fails on 2 hits; workflows dropped from the scan set -> size (58 vs 77) and membership cases fail; every plant restored"
        status: pass
    human_judgment: false
  - id: D4
    description: "Pins moved by re-derivation; generators, freshness, validator and prose gates green; targeted run shows only 37-BASELINE failures"
    verification:
      - kind: other
        ref: "npm run build; npm run typecheck; npm run freshness; freshness:{catalog,adapters,skill-twins,host-entries,traceability}; VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict; check-{imperative-lexicon,banned-claims,claim-anchors,kit-refs,public-docs-vocabulary,foundation-guards,state-paths} -> all exit 0"
        status: pass
      - kind: unit
        ref: "91 test files in six sequential groups (the 48 the plan's git grep derives plus every test naming a changed file's basename and the census set): 6982 passed, 2 skipped, 8 failed, all 8 in 37-BASELINE"
        status: pass
    human_judgment: false
  - id: D5
    description: "The reworded kit sentences read clearly to a host agent and a human reader"
    verification:
      - kind: other
        ref: "reading review of git diff ced5e6e4..bfa163e4"
        status: pass
    human_judgment: true
    rationale: "Whether the sentences read clearly is a reading judgment; the gates check structure and wording rules only"

duration: 39min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 18: The kit docs say the trace is rendered, and a permanent test keeps every kit file free of hand-trace instructions Summary

**AGENTS.md, the kit README and the writing profile now say the Orchestrator updates the board and the trace is rendered from published notes. They name the trace index `memory-bank/plans/traceability.md`, the per-ticket trace files under `memory-bank/plans/traceability/`, and one NFR file each under `nfr/` with `nfr-catalog.md` as the index. The board contract and the three checklists follow. A new test, `scripts/trace-instructions.test.ts`, scans all 77 tracked kit markdown files plus AGENTS.md with the two patterns imported from `scripts/trace-model.ts`, and fails on any line that matches.**

## Performance

- **Duration:** about 39 min, most of it the targeted test run
- **Started:** 2026-10-22T18:20:52Z
- **Completed:** 2026-10-22T19:00:05Z
- **Tasks:** 3
- **Files modified:** 11 (1 created, 10 modified)

## Accomplishments

- **Task 1 (AGENTS.md, README, writing profile):**
  - AGENTS.md line 21: "... updates the board, and produces the next action; the trace is rendered from those notes."
  - AGENTS.md Delivery: "Trace: index `memory-bank/plans/traceability.md`, one file per ticket in `memory-bank/plans/traceability/`".
  - AGENTS.md plans line: `traceability.md` (rendered index; per-ticket trace files under `traceability/`) and `nfr-catalog.md` (index; one file per NFR under `nfr/`).
  - AGENTS.md is 8,582 bytes, against 8,453 at HEAD and a limit of 8,653. No section was added.
  - README: the Orchestrator sentence ends "The trace is rendered from those notes." The Traceability bullet says the trail is rendered per ticket from published note refs, each ticket's file sits under `traceability/`, and `traceability.md` indexes them one line per ticket. Every claim anchor stayed in place.
  - writing-profile governed-surfaces row: "board rows written at run time; trace files rendered by tools/grugops/trace-render.js".
- **Task 2 (board contract, checklists):**
  - The board contract's Reconciliation non-goal now reads "absent from the trace index". This changes wording only; the rule is the same.
  - Lean DoD: "the ticket's refs are published on notes and its trace file renders".
  - Enterprise DoD: NFR budget and SLO targets are read from the NFR files under `memory-bank/plans/nfr/` that the index lists. The trace item reads "trace complete in the ticket's rendered trace file".
  - Observability/SLO checklist: the SLO/target is cited from its NFR file, found through the index.
- **Task 3 (the scan test and pins):**
  - The scan set comes from `git ls-files -z -- agent-factory AGENTS.md`, filtered to `.md`: 77 files.
  - A second listing walks every directory under `agent-factory/` on disk, asks git for the tracked markdown directly inside each one (`:(glob)<dir>/*.md`), and adds AGENTS.md. The two lists must be equal.
  - The set must hold every `listRoles` and `listWorkflows` member, and those lists must have `ROLE_COUNT` (17) and `WORKFLOW_COUNT` (19) members.
  - `HAND_TRACE_PATTERNS` is imported from `./trace-model.js`. The file holds no copy of either pattern.
  - Seeded lines prove each pattern and the line scanner.
  - A hit prints `path:line: text`.
  - `TRIPWIRE_MODULES` and `SCRIPTS_TEST_FILE_COUNT` each moved 78 -> 79. `ls scripts/*.test.ts | wc -l` reports 79. Each move has a dated reason (2026-10-22, plan 37-18).

## Task Commits

1. **Task 1: the substrate and the kit docs say the trace is rendered** - `9f4c0dff` (docs)
2. **Task 2: the board contract names the trace index; checklists read the rendered trace and the NFR files** - `e4c9bf21` (docs)
3. **Task 3: a permanent scan that no kit file tells an agent to hand-edit the trace** - `bfa163e4` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## TDD note (Task 3)

- **RED:** the test was run against the pre-plan text of the five kit files Tasks 1 and 2 changed (`git checkout ced5e6e4 -- <five files>`, restored with `git checkout HEAD -- <five files>`). The target case "zero lines across the scan set match either pattern" failed with 5 hits and the other 8 cases passed. `gsd check tdd-red-evidence` on the TAP report returned `RED_EVIDENCE_OK` (`target_test_failed`).
- **Semantic assessment:** the target executed and failed on its planned assertion, `expected 5 to be +0`. The message named exactly the five pre-plan lines (AGENTS.md:21, README.md:29, definition-of-done.md:18, board.md:642, writing-profile.md:219). There was no load, syntax or fixture fault.
- **GREEN:** the kit fix is the Task 1 and Task 2 commits, which landed before the test. The test is green on the tree at `bfa163e4`.
- **More mutation checks:**
  - A line for pattern one planted in `agent-factory/roles/qe-e2e.md` and a line for pattern two planted in `agent-factory/workflows/09-daily-sweep.md` turned the case red with 2 hits.
  - Dropping `/workflows/` from the scan set turned the size case red (58 vs 77) and the membership case red (19 missing).
  - Every plant was restored. `git status` was clean afterwards.
- The plan is `type: execute` and `workflow.tdd_mode` is false. The single `test(37-18)` commit carries the test and the pins. No `feat` commit exists, because the green side is prose that landed in `docs(37-18)` commits first, as the plan ordered.

## Files Created/Modified

- `scripts/trace-instructions.test.ts`: the permanent scan (new).
- `AGENTS.md`, `agent-factory/README.md`, `agent-factory/writing-profile.md`: the trace and NFR wording.
- `docs/audit/28-claim-registry.md`: the verbatim blocks and mechanisms of C-28-013, C-28-020, C-28-025 and C-28-033, in the same commit as the prose.
- `agent-factory/contracts/board.md`: one Reconciliation sentence.
- `agent-factory/checklists/definition-of-done.md`, `definition-of-done-enterprise.md`, `observability-slo-checklist.md`: trace and NFR items.
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts`: pins 78 -> 79 with dated reasons.
- No derived file changed. The catalog, adapter, skill-twin and host-entry generators ran and produced no diff.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- The claim registry changes in the same commit as the claimed prose, as check-claim-anchors requires.
- Publish stays out of the approved step-verb set, and WF03 keeps Record.
- WF18's two older phrases stay. Neither matches a scan pattern, and WF18 is outside this plan.

## Deviations from Plan

**1. [Rule 3 - Blocking] docs/audit/28-claim-registry.md edited with the Task 1 prose**
- **Found during:** Task 1
- **Issue:** four of the reworded lines carry claim anchors. `check-claim-anchors` failed with 4 findings, because each registry block must stay byte-identical to its anchored text. The registry is not in the plan's file list.
- **Fix:** updated the four verbatim blocks and their mechanism sentences. The README rows' `line` fields were corrected to 27-30 and 97-108.
- **Verification:** `check-claim-anchors` reports 47 rows, all byte-identical. `check-banned-claims` and `check-public-docs-vocabulary` exit 0.
- **Committed in:** `9f4c0dff`

**2. [Rule 1 - Bug] The scan test's failure message**
- **Found during:** Task 3, RED evidence
- **Issue:** a multi-line failure message made vitest's TAP output malformed, and the RED-evidence classifier returned `INVALID_RED (invalid_record)`.
- **Fix:** hits are joined with " | " and the case asserts `hits.length` is 0. The RED was re-run and classified `RED_EVIDENCE_OK`.
- **Committed in:** `bfa163e4`

---

**Total deviations:** 2 auto-fixed (1 Rule 3, 1 Rule 1).
**Impact on plan:** none on scope. Every must-have truth holds.

## Issues Encountered

- The end-of-plan targeted run had 8 failures, all in 37-BASELINE: 1 in `install/installer-fs-census.test.ts`, 2 in `scripts/context-io-writer-set.test.ts` and 5 in `scripts/uat-gate-exit-contract.test.ts`.
- `scripts/validate.test.ts` failed 2 cases while the new test file was still untracked. Its ticket-frontmatter-reader scan requires every `scripts/*.ts` on disk to be tracked. It passed (185/185) once the file was staged, and it passes on the committed tree.
- `node scripts/check-diff-disposition.js` exits 1 with 707 findings since base `4d2b8f0`. This is pre-existing and phase-wide, and the gate is not in this plan's list. It is recorded in `deferred-items.md`.

## Verification

- Generators: `generate:catalog`, `generate:adapters`, `generate:skill-twins` and `generate:host-entries` ran with no diff.
- Freshness: `npm run freshness` (86 committed .js files fresh), `freshness:catalog`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries` and `freshness:traceability` all exit 0.
- `npm run build` changed no file. `npm run typecheck` exits 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` exits 0 (ALL CHECKS PASSED).
- Gates exit 0: `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-public-docs-vocabulary`, `check-foundation-guards` and `check-state-paths`.
- Acceptance criteria, all re-run after the last edit:
  - Task 1: 0 files match (baseline 3). AGENTS.md is 8,582 bytes.
  - Task 2: the scan over the kit outside workflows plus AGENTS.md exits 0 (grep matched no file; baseline 25). The NFR count is 1 and 2.
  - Task 3: the scan over every tracked `agent-factory/*.md` plus AGENTS.md exits 0 (baseline 42). The test file is tracked. `HAND_TRACE_PATTERNS` appears 7 times and `matrix|column` 0 times.
- No edited markdown file holds a control byte (each file compared with a copy that has the C0 and DEL bytes stripped).
- Plan verification 1 (`trace-instructions`, `kit-model`, `validate`, `check-foundation-guards`, `mode-census`) passes.
- Plan verification 3, the 48-file `git grep` set, is inside the 91-file targeted run.
- Targeted run: 91 files in six sequential foreground groups, one worker, no full-suite run. The set is the plan's 48, every test naming a changed file's basename, and the census set. Result: 6,982 passed, 2 skipped, 8 failed, all 37-BASELINE.
- No vitest process of this plan is left running.
- No installer ran directly. The installer tests in the targeted run use their own fixtures. `~/.grugops` is unchanged: the same `ls -la` listing before and after.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 37-19 is the phase gate. Its full non-e2e run picks up `scripts/trace-instructions.test.ts` and the moved pins.
- SPLIT-03 is complete: this plan is the last to declare it, and the scan is green and mutation-checked. SPLIT-02 stays Pending, because 37-19 also declares it.
- Open for a later plan or a human: the check-diff-disposition backlog (`deferred-items.md`), and WF18's two older phrases.

## Self-Check: PASSED

- `scripts/trace-instructions.test.ts` and all ten modified files exist.
- Commits `9f4c0dff`, `e4c9bf21` and `bfa163e4` are ancestors of HEAD.
- `git rev-list --count ced5e6e4..HEAD` returns 3 before this SUMMARY's commit.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
