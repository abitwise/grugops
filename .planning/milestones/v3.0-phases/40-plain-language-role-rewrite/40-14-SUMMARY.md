---
phase: 40-plain-language-role-rewrite
plan: 14
subsystem: testing
tags: [check-role-rules, board-move-partition, wr-01, in-02, security-evidence, review-disposition]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "plan 40-11 safety facts and git-object baseline; 40-12 Stop-when freeze and stand-in pin; 40-13 lean close with human conditions; 40-15 IN-01/IN-03; 40-16 WR-06 named-human read"
provides:
  - "Partition rule 4 narrowed: an owned-column pair must target the next flow column, a column outside the flow, or a declared pair; the terminal-owner close exemption is gone (WR-01)"
  - "D33_NON_FORWARD_PAIRS: the two non-forward pairs of the D-33 table approved at the 40-02 checkpoint, two-sided through rules 4 and 5"
  - "Partition rule 6 and moveSpanFindings: a Board moves span holding → that is not a column pair is a named finding (IN-02)"
  - "40-SECURITY.md re-verified on red-on-deletion evidence for T-40-02, T-40-13, T-40-15, T-40-16, T-40-18, T-40-21"
  - "40-REVIEW-DISPOSITION.md: all 12 findings dispositioned, open: 0"
  - "deferred-items.md: gap-round section (WR-03, optional IN-03 part, 40-11 residual)"
affects: [phase-40-verification, gsd-secure-phase-40, phase-41-flow-guidance]

actuals:
  tokens: 12603
  tasks: 3
  commits: 4
plan_head_before: 09abad2953c3d273a5145195541417b3644d9440
plan_head_after: dafa5f3c915be8321aec5f72b349c5c76a4e666e

tech-stack:
  added: []
  patterns:
    - "Declared-pair lists (BOARD_MOVE_EXCEPTIONS, D33_NON_FORWARD_PAIRS) are two-sided: rule 4 refuses an unlisted claim, rule 5 refuses a stale entry"
    - "Flow adjacency and outside-flow columns are derived from the seed board table, never typed"

key-files:
  created:
    - .planning/phases/40-plain-language-role-rewrite/40-14-SUMMARY.md
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts
    - .planning/phases/40-plain-language-role-rewrite/40-SECURITY.md
    - .planning/phases/40-plain-language-role-rewrite/40-REVIEW-DISPOSITION.md
    - .planning/phases/40-plain-language-role-rewrite/deferred-items.md

key-decisions:
  - "D33_NON_FORWARD_PAIRS holds only the two non-forward pairs of the human-approved D-33 table (orchestrator In UAT → Done, qe-e2e In Review → Ready for UAT); BOARD_MOVE_EXCEPTIONS is unchanged at the four Tech Lead entries"
  - "deriveRoleFacts keeps its lenient bare-→ split so the Phase 40 baseline does not move; rule 6 makes any span the two parsers read differently fail loudly instead"
  - "PLAIN-03 is not re-marked in REQUIREMENTS.md; the post-gap verifier does that"

patterns-established:
  - "Security evidence cites observed test passes and gate runs, never token presence; a one-off deletion probe counts as a gate run and is labelled as such"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "Partition rule 4 refuses every gate-skipping pair the reviewer measured, admits only the approved non-forward pairs, and keeps the live board green (WR-01)"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts -t \"partition\" (24 passed after Task 1; 27 with IN-02)"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js: board-move partition: 0 findings over 19/19"
        status: pass
    human_judgment: false
  - id: D2
    description: "A Board moves span holding → that is not a column pair is a named rule 6 finding; the baseline is byte-identical (IN-02)"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts -t \"IN-02\" (3 passed)"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#the committed baseline equals a fresh derivation at its recorded source_commit, read out of git"
        status: pass
      - kind: other
        ref: "git diff --quiet HEAD -- docs/audit/40-role-rule-inventory.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "40-SECURITY.md evidence for six safety threats rests on red-on-deletion tests and gate runs"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "grep -c red-on-deletion 40-SECURITY.md (2); the quoted vitest and gate commands all exit 0"
        status: pass
    human_judgment: true
    rationale: "Whether each evidence bullet backs its threat's mitigation is a reading judgment; automation only shows the cited commands pass"
  - id: D4
    description: "All 12 review findings carry a disposition; WR-03 deferred with its reason; open: 0"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "node -e check in the plan's Task 3 verify (open: 0, no disposition: open, WR-03 deferred)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-02
status: complete
---

# Phase 40 Plan 14: Narrowed board-move partition and the closed review round Summary

**Partition rule 4 now refuses a gate-skipping pair out of a role's own column, unless the target is the next flow column, `Blocked`, or a declared pair. The terminal-owner close exemption is gone, and the two approved non-forward pairs live in `D33_NON_FORWARD_PAIRS`. A new rule 6 names an arrow span that is not a column pair. With these in place, the security evidence was rewritten on red-on-deletion proof and all 12 review findings were dispositioned (`open: 0`).**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-02T14:02:15Z
- **Completed:** 2026-11-02T14:14:18Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- WR-01: `checkPartition(model, claims, exceptions, approved)`. A pair declared for its role in `BOARD_MOVE_EXCEPTIONS` or `D33_NON_FORWARD_PAIRS` passes. Otherwise, a pair out of a column the role owns passes only into the next flow column or into a column outside the flow; a pair out of another role's column, or out of a column with no owner, is red. Rule 5 now also covers `D33_NON_FORWARD_PAIRS`. Gap 2 is now guarded by the structure too: only the Orchestrator may claim `In UAT → Done`.
- IN-02: `moveSpanFindings(raw, columns, role)` reads the spans the same way `claimedPairs` does. `checkBoardPartition` folds its findings into the same report as rules 1 to 5. `deriveRoleFacts` and the baseline are unchanged.
- 40-SECURITY.md: the mitigations for T-40-02, T-40-13, T-40-15, T-40-16, T-40-18 and T-40-21 were rewritten. A "Gap-closure evidence (red-on-deletion)" list replaces the old "tokens are present" bullet. Every threat stays closed and `threats_open: 0`.
- 40-REVIEW-DISPOSITION.md: 11 findings are `fixed`, each naming its plan and the test or gate that proves it. WR-03 is `deferred` with its reason. `open: 0`, `total: 12`, and the titles are unchanged.
- deferred-items.md: "## From the gap round (plans 40-11 to 40-16)" lists WR-03 with its eight `## Stop when` bullets, the optional IN-03 part, and the 40-11 residual about non-fact sentences.

## Task Commits

1. **Task 1: tracer, narrowed rule 4 and D33_NON_FORWARD_PAIRS (WR-01)** - `ad8e7a16` (feat)
2. **Task 2: IN-02 rule 6 (TDD)** - `4965927a` (test, RED), `fc32a90e` (feat, GREEN)
3. **Task 3: security evidence, review dispositions, deferred items** - `dafa5f3c` (docs)

**Plan metadata:** in the docs(40-14) commit that carries this file.

## RED evidence

**Task 1 (tracer).** Run first against the committed `.js`. The real test file could not link because `D33_NON_FORWARD_PAIRS` did not exist yet, so the RED run used a throwaway probe copy with a tolerant import (deleted afterwards). Result: 10 failed, 14 passed. All five WR-01 planted cases failed on assertions:
- `software-engineer.md` `In Development → Done`, `orchestrator.md` `In Review → Done`, `orchestrator.md` `Blocked → Done` and `qe-e2e.md` `In Review → Ready to Release`: the gate exited 0 with `INFO  board-move partition: 19 claimed pair(s) ... 4 declared exception(s)` and `PASS  board-move partition: 0 findings over 19/19 elements` (`expected +0 to be 1`).
- `uat-planner.md` `In UAT → Done`: exit 1, but only on rule 1 (`1 finding(s)`); no rule 4 line, so the containment assertion failed.
- The green control (missing "2 approved non-forward pair(s)"), the rule 3+5 case (no rule 5 line), the rewritten lean-close unit case and the adjacency case also failed on their assertions.

Tracer feedback gate: interactive run, `human_verify_mode: end-of-phase`, automated-only verify. The verify was re-run green (build, typecheck, 58/58 tests, live gate 0 findings), so expansion continued with no checkpoint.

**Task 2 (`tdd="true"`).** RED command: `npx vitest run scripts/zz-red-probe.test.ts -t "IN-02.: .In UAT→Done. .no spaces." --reporter=tap-flat`, exit 1. It ran a probe copy with a tolerant import and the multi-line `r.stdout` assertion message dropped, because vitest's TAP output broke on that embedded text and the classifier rejected it as `invalid_record` twice. Target `not ok 35 ... partition rule 6 (IN-02): \`In UAT→Done\` (no spaces) planted into orchestrator.md is red naming the span`: `expected +0 to be 1`, actual `0`. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran with no load, syntax or fixture fault. It failed on its planned exit-status assertion, because the gate exited 0 on a span that yields `board-from:In UAT` but no partition claim, which is the IN-02 defect. The companion `… → Done` case in release-manager.md failed the same way (exit 0). The record is kept outside the repository at `/tmp/claude-1000/-home-olger-projects-public-grugops/02c866cb-1796-4667-aa2b-a881de121da6/scratchpad/40-14-in02-red.json`. GREEN: 61/61. No REFACTOR commit was needed.

## Live partition INFO line

```
  INFO  board-move partition: 18 claimed pair(s) over 12 flow column(s), terminal Done, 4 declared exception(s), 2 approved non-forward pair(s)
  PASS  board-move partition: 0 findings over 19/19 elements
```

## Security evidence commands (Task 3 step 1, all observed)

| Command | Result |
|---|---|
| `npx vitest run scripts/check-role-rules.test.ts -t "lost fact\|CR-01"` | 11 passed |
| `npx vitest run scripts/check-diff-disposition.test.ts -t "WR-04\|stand-in"` | 13 passed |
| `npx vitest run scripts/tier-kit-text.test.ts -t "CR-02"` | 10 passed |
| `npx vitest run scripts/check-role-rules.test.ts -t "partition\|IN-02"` | 27 passed |
| `node scripts/check-role-rules.js` | exit 0, ALL CHECKS PASSED |
| `node scripts/check-diff-disposition.js` | exit 0, `PASS  1137 role clause(s) admitted by the role-rule inventory stand-in (D-30)`, frozen set includes ``roles `## Stop when` 19/19`` |
| One-off mirror deletion probe (8 runs) | each exit 1 naming the role and the lost fact: release-manager named-human, production-human; installer dry-run; orchestrator no-deploy, wip-limit, claim-cap, only-spawner; uat-planner named-human |

## Files Created/Modified

- `scripts/check-role-rules.ts` / `.js`: `D33_NON_FORWARD_PAIRS`; the fourth `approved` parameter of `checkPartition`; the narrowed rule 4; rule 5 over both lists; `moveSpanFindings` and rule 6; the INFO line; the partition header rule list.
- `scripts/check-role-rules.test.ts`: five WR-01 planted red cases, the approved-pair list case, two "red when planted into designer.md" cases, the adjacency and empty edges, the rewritten lean-close unit case, rule 5 in the rule 3 case, and three IN-02 cases. Total: 48 to 61.
- `.planning/phases/40-plain-language-role-rewrite/40-SECURITY.md`: six mitigation cells and the red-on-deletion evidence list.
- `.planning/phases/40-plain-language-role-rewrite/40-REVIEW-DISPOSITION.md`: all 12 dispositions, `open: 0`.
- `.planning/phases/40-plain-language-role-rewrite/deferred-items.md`: the gap-round section.

## Decisions Made

- `D33_NON_FORWARD_PAIRS` holds exactly the two non-forward pairs of the approved D-33 table. Each reason cites D-33 and the 40-02 checkpoint, and a test pins the list. Declaring them codifies a human decision already made; it is not a new one.
- `deriveRoleFacts` keeps its lenient split, as the plan required, so the baseline at `PHASE_40_START_COMMIT` and plan 40-11's byte-equality test stay untouched.
- PLAIN-03 is left for the post-gap verifier to re-mark. REQUIREMENTS.md is not edited, per this plan's prohibition.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `moveSpanFindings` takes the role name as a third parameter**
- **Found during:** Task 2
- **Issue:** The plan names the export `moveSpanFindings(raw, columns)` but wants each finding to read `<role>: rule 6: ...`. The raw text does not carry the role name.
- **Fix:** Signature `moveSpanFindings(raw, columns, role)`. `checkBoardPartition` passes the basename.
- **Files modified:** scripts/check-role-rules.ts / .js, scripts/check-role-rules.test.ts
- **Verification:** the IN-02 cases assert the role-prefixed message; the live loop over every role returns `[]`.
- **Committed in:** fc32a90e

**2. [Rule 1 - Accuracy] deferred-items.md wording about frontend-ui.md line 48**
- **Found during:** Task 3
- **Issue:** My first draft said frontend-ui.md line 48 carries the same tier-kit-text pin as line 47. A grep showed only line 47 is pinned (the D-10 Frontend/UI case).
- **Fix:** The entry now says line 48 has the same shape but no pin.
- **Files modified:** deferred-items.md
- **Committed in:** dafa5f3c

### Additions

**3. [Rule 2 - Evidence] One-off mirror deletion probe for facts with no test of their own**
- **Found during:** Task 3
- **Issue:** The permanent CR-01 family tests delete one sentence per safety family. Facts such as dry-run, wip-limit, claim-cap, only-spawner and production-human have no deletion test of their own, so citing them as "red on deletion" without a run would be a claim I had not observed.
- **Fix:** A scratchpad script (not committed) ran the committed gate on a mirror with each trigger phrase replaced: 8 runs, each exit 1 naming the fact. 40-SECURITY.md labels this as a one-off gate run, not a permanent test.
- **Committed in:** dafa5f3c (evidence text only)

---

**Total deviations:** 3 (1 blocking, 1 accuracy, 1 evidence addition). **Impact on plan:** none on scope. No board flow, seed board, role pair or declared-list entry beyond the approved table was changed.

## TDD Gate Compliance

Task 2: `test(40-14)` `4965927a` comes before `feat(40-14)` `fc32a90e`. Task 1 is a tracer task, so its tests and code share one `feat` commit, as tracer tasks allow.

## Issues Encountered

- Plan verification over the six named test files: 475 passed, 5 failed. All 5 failures are in `scripts/uat-gate-exit-contract.test.ts`, the recorded pre-existing set.
- `scripts/check-foundation-guards.test.ts`: 1 failure, the known "LIVE COUNT is DERIVED" case caused by the untracked `~/` directory. The `.js` walk lists `~/projects/hacks/grugops-example-01/...`. Not caused by this plan.
- Every gate in the plan's verification chain exits 0, and all five freshness checks pass.

## Next Phase Readiness

- Phase 40's gap round is complete: all 16 plans have a SUMMARY. Next: post-gap verification (`/gsd-verify-work 40`), which re-marks PLAIN-03, then `/gsd-secure-phase 40` to audit T-40-28 onward, including this plan's T-40-39 to T-40-41.
- WR-03 is recorded for the backlog (candidate: Phase 41 flow guidance).

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: ad8e7a16, 4965927a, fc32a90e, dafa5f3c (each an ancestor of HEAD)
- FOUND: scripts/check-role-rules.ts, scripts/check-role-rules.js, scripts/check-role-rules.test.ts, 40-14-SUMMARY.md
