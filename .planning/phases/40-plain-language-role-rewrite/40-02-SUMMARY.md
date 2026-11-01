---
phase: 40-plain-language-role-rewrite
plan: 02
subsystem: roles
tags: [plain-language, reference-role, software-engineer, do-less, notice, ponytail]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory (check-role-rules), the D-30 disposition stand-in, the caveman-free corpus
provides:
  - agent-factory/roles/software-engineer.md, the approved reference role every wave-3 batch copies (new skeleton, `## Do less`, `## Stop when`)
  - the `shortcut: <the limit>, <when to upgrade>` code marker and the `Not checked:` observation-line rule
  - tier-kit-text describe "software-engineer.md plain rewrite (PLAIN-02, PLAIN-05; D-20..D-24)"
  - NOTICE / agent-factory/NOTICE ponytail MIT adaptation credit
  - the human-approved D-02 byte allocation and D-33 board-move pair tables (## Checkpoint outcome)
affects: [40-03, 40-04, 40-05, 40-06, 40-07, 40-08, 40-09, 40-10]

actuals:
  tokens: 43614
  tasks: 3
  commits: 2
plan_head_before: 20659cf4c078191ccaedc13b58ae954c053a0d8b
plan_head_after: 436c821ca34832d8586b581636f165ddb7f88a83

tech-stack:
  added: []
  patterns:
    - "Reference-role-first rewrite: one file written to the new skeleton and approved by a human before any batch copies it (D-16)"
    - "Do-less rules carried in the role's own text, credited in NOTICE, never an installed skill (D-20, D-26)"

key-files:
  created: []
  modified:
    - agent-factory/roles/software-engineer.md
    - scripts/tier-kit-text.test.ts
    - scripts/trace-instructions.test.ts
    - NOTICE
    - agent-factory/NOTICE

key-decisions:
  - "Human approved the reference role's voice, shape and length, the D-02 byte targets, the D-33 board-move pairs and the RW-4 orientation bullet unchanged (answer: approved)"
  - "Engineer role fits its 4,450 B target at 4,448 B with nothing moved out, so Workflow 04 and example-mapping.md stay unchanged and no 40-02 rows file exists"
  - "No lexicon addition (D-32): every mirror sentence-check finding was fixed by rewording"

patterns-established:
  - "Stop when items pair a trigger with the reported status and the role that gets the ticket, with no clause repeated elsewhere in the file"

duration: ~2h wall clock (10:19Z to 12:15Z, including the human checkpoint wait)
completed: 2026-11-01
---

# Phase 40 Plan 02: Plain-English reference role (software engineer) Summary

**software-engineer.md rewritten to the new eleven-section skeleton in second-person plain English, with a `## Do less` reuse-before-build ladder, a `shortcut:` marker and `Not checked:` line rule, two `## Stop when` hand-offs and its two board moves as code spans, at 4,448 B; ponytail credited under MIT in NOTICE; the human approved the role, the byte targets and the pair table unchanged.**

## Performance

- **Duration:** about 2 hours wall clock, including the human checkpoint wait
- **Started:** 2026-11-01T10:19Z (after 20659cf4)
- **Completed:** 2026-11-01T12:15Z
- **Tasks:** 3 of 3 (2 committed tasks plus the human checkpoint)
- **Files modified:** 5

## Phase 40 start commit

e8d7802ccf8ebf428a47703f6001327325e3aea3 (the inventory baseline and the disposition base both name it).

## Checkpoint outcome

Task 3 (checkpoint:human-verify, gate=blocking-human, D-16). The human's answer, verbatim:

> approved

No corrections. Wave-3 plans read this section first; the tables below are the approved tables, identical to 40-02-PLAN.md's.

### Approved D-02 byte allocation (sum 63,200 B; WARN 64,000 B; FAIL 67,383 B)

| File | Target |
|------|-----:|
| orchestrator.md | 5900 |
| software-engineer.md | 4450 |
| security-nfr.md | 3800 |
| tech-lead.md | 3700 |
| compliance-officer.md | 3300 |
| release-manager.md | 3150 |
| agents-md-scribe.md | 3000 |
| frontend-ui.md | 3000 |
| architect-design.md | 2950 |
| ba-pm.md | 2950 |
| qe-e2e.md | 2950 |
| incident-responder.md | 2950 |
| factory-coach.md | 2900 |
| installer.md | 2800 |
| uat-planner.md | 2800 |
| designer.md | 2650 |
| system-analyst.md | 2600 |
| _role-switch-protocol.md | 2600 |
| greenfield-mapper.md | 2450 |
| brownfield-mapper.md | 2300 |

### Approved D-33 canonical board-move pairs

| Role | Owned moves |
|------|-------------|
| BA/PM | `Backlog → Ready`, `Ready → In Analysis` |
| System Analyst | `In Analysis → In Design` |
| Architect/Design | `In Design → Ready for Dev` |
| Tech Lead | `Ready for Dev → In Design` (F2 = 2 return); `Blocked → Ready for Dev`, `Blocked → Backlog`, `Blocked → In Design` (dev-raised block, Workflow 04 step 15). All four are the declared exception list |
| Orchestrator | `Ready for Dev → In Development`; `In UAT → Done` (the lean-mode close, after `agent-factory/checklists/definition-of-done.md`) |
| Software Engineer | `In Development → In Review`, `In Development → Blocked` |
| QE/E2E | `In Review → In Security/NFR`, `In Review → Ready for UAT` |
| Security/NFR | `In Security/NFR → Ready for UAT` |
| UAT Planner | `Ready for UAT → In UAT`, `In UAT → Ready to Release` |
| Release Manager | `Ready to Release → Done` |
| Every other role | no move |

### Other confirmations

- The orientation bullet (`memory-bank/plans/board.md` and `memory-bank/00-index.md` on start) stays in every role, as written in RW-4: confirmed.
- No role edits were requested, so Task 1's files stay as committed in 805f0cbc. Task 1's verify block was re-run after the checkpoint and is green (see Recorded evidence).

## Accomplishments

- software-engineer.md in RW-1 order: `## One job`, `## Activates when`, `## Reads`, `## Responsibilities`, `## Levels`, `## Do less`, `## Output`, `## Board moves`, `## Trace updates`, `## Hard limits`, `## Stop when`. No heading suffix, no caveman section.
- The first sentences `Implement one ticket end to end.` and `Need code (one ticket).` are byte-identical, so the adapters, the catalog and the MODEL-01 baseline did not change (the freshness gates pass).
- `## Do less` holds the six-rung reuse-before-build ladder, the finish-the-whole-change rule, the never-cut floor (validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything the user asked for), the one-small-test rule, and says the rules are the same at every level.
- `## Output` states the `shortcut: <the limit>, <when to upgrade>` marker and the `Not checked:` line in an `observation` note per Workflow 16. It adds no new note kind and no ticket key.
- `## Reads` ends with the Workflow 16 / Workflow 18 pointer line (each file named once) and keeps the absent-config sentence verbatim and the coding-rules line.
- NOTICE adds the ponytail adaptation paragraph, `Copyright (c) 2026 DietrichGebert`, and the MIT permission and warranty paragraphs byte-exact from the fetched LICENSE. agent-factory/NOTICE is a byte copy. No benchmark, savings figure or line count appears.

## Recorded evidence

- Engineer role: 4,448 B (target 4,450; 4,442 B at 20659cf4 before the rewrite). check-role-rules: `software-engineer.md: facts before 21 / after 24`.
- Role corpus after this plan: 74,849 B (the wave-3 batches bring it down toward the 63,200 B allocation).
- Re-run after the checkpoint (2026-11-01, 12:14Z):
  - `npx vitest run scripts/tier-kit-text.test.ts scripts/adapter-byte-baseline.test.ts scripts/trace-instructions.test.ts scripts/model-tiers.test.ts scripts/compactor.test.ts`: 5 files, 721 passed, 0 failed.
  - check-foundation-guards, validate-agent-factory, check-role-rules, check-diff-disposition, check-kit-refs, check-banned-claims, check-state-paths: all exit 0, 0 FAIL lines.
  - adapters, catalog, skill-twins and host-entries freshness: all exit 0 (21 adapters, 7 skill twins, 0 byte differences).
  - Mirror sentence check for software-engineer: no `zrole-` line.
- Full suite at Task 1 time (e2e excluded): 10,748 passed, 21 failed. That is 20 failures already present at e8d7802 plus 1 caused by the stray untracked `~/` directory. This plan added no new failure.
- Workflow and checklist bytes (D-06): none touched. `git diff --stat e8d7802..HEAD -- agent-factory/workflows agent-factory/checklists` is empty.
- NOTICE: 627 B at e8d7802, 1,851 B now. Original lines 1-12 are unchanged; the ponytail LICENSE was fetched with curl on 2026-11-01.

## Task Commits

1. **Task 1: The engineer role in the new skeleton passes every gate that reads role text** - `805f0cbc` (docs)
2. **Task 2: NOTICE credits ponytail, with a byte copy in the kit** - `436c821c` (docs)
3. **Task 3: Human checkpoint (D-16)** - no code commit; the outcome is recorded above

**Plan metadata:** recorded in the final docs commit for this plan.

## Files Created/Modified

- `agent-factory/roles/software-engineer.md` - rewritten as the plain-English reference role
- `scripts/tier-kit-text.test.ts` - six plain-rewrite cases (Do less, Output marker, Board moves, Stop when, heading order, Levels pins)
- `scripts/trace-instructions.test.ts` - EXCLUSION_CONTROLS "the note route" row now points at the moved item-4 sentence
- `NOTICE` - ponytail MIT adaptation credit appended
- `agent-factory/NOTICE` - byte copy of NOTICE

## Decisions Made

- The human approved the role, the byte targets, the pair table and the orientation bullet unchanged.
- Nothing moved out of the role, so Workflow 04 and example-mapping.md are unchanged and `docs/audit/29-style-dispositions/40-02.md` was not created (RW-13: create the rows file only when a watched file changes).
- No lexicon addition (D-32).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] trace-instructions test pinned a sentence the rewrite moved**
- **Found during:** Task 1
- **Issue:** the EXCLUSION_CONTROLS "the note route" row in scripts/trace-instructions.test.ts pointed at an engineer sentence the rewrite moved into Responsibilities item 4. The file was not in the plan's `<files>` list.
- **Fix:** pointed the same assertion at the new item-4 sentence. The control was not weakened.
- **Files modified:** scripts/trace-instructions.test.ts
- **Commit:** 805f0cbc

### Notes against the plan's wording

- Two `## Hard limits` lines were shortened to fit the 4,450 B target. No rule was dropped: check-role-rules reports facts 21 before and 24 after.
- The plan says NOTICE had 14 original lines. It had 12. Lines 1-12 are unchanged and the credit is appended after them.
- The plan's `files_modified` lists Workflow 04, example-mapping.md and the 40-02 rows file as possible edits. None was needed (see Decisions Made).

## Issues Encountered

- The untracked `~/` directory in the working tree (not created by this plan, left alone as instructed) causes 1 full-suite failure. It is outside this plan's scope.

## User Setup Required

None.

## Next Phase Readiness

- The wave-3 batches (40-03 onward) can copy software-engineer.md as the approved reference and use the tables in `## Checkpoint outcome` as final.
- When 40-03 lands the Tech Lead's rules and the lean-review lens, it widens NOTICE's first ponytail paragraph to name them, so the credit never runs ahead of the content.

## Self-Check: PASSED

- FOUND: agent-factory/roles/software-engineer.md, scripts/tier-kit-text.test.ts, scripts/trace-instructions.test.ts, NOTICE, agent-factory/NOTICE
- FOUND: 805f0cbc, 436c821c (both ancestors of HEAD)
- Commit count measured: `git rev-list --count 20659cf4..HEAD` = 2
