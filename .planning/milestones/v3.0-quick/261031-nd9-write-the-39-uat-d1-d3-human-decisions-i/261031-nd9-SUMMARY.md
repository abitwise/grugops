---
phase: quick-261031-nd9
plan: 01
subsystem: agent-factory workflow 04 hand-off loop
tags: [tier-04, 39-uat, hand-off, human-stop, cause-id]
status: complete
requires: [39-19 G-39-71 hand-off loop]
provides:
  - "WF04 step 17 queues the Tech Lead after Disputed:/Fundamental: (D3, CR-01)"
  - "WF04 step 17 binds the step 2 re-plan to the step 15 move limits (D3, CR-03)"
  - "A fundamental change is a proposal a named human approves; the Tech Lead checks every Resolved: note (D1, CR-02)"
  - "Cause-id: line and the per-ticket ceiling of three hand-offs (D2, CR-04)"
affects:
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/config/factory.config.md
tech-stack:
  added: []
  patterns: [verbatim-sentence pins in tier-kit-text, disposition rows with FROZEN companion cells]
key-files:
  created:
    - docs/audit/29-style-dispositions/quick-261031-nd9.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - CHANGELOG.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-DISPOSITION.md
decisions:
  - "39-UAT D1-D3 written as the plan gave them; the lexicon and guards refused no sentence, so none was shortened"
  - "39-REVIEW-DISPOSITION.md frontmatter `open:` count lowered from 20 to 16 to match the four findings now fixed"
requirements: [TIER-04, 39-UAT-D1, 39-UAT-D2, 39-UAT-D3]
metrics:
  started: 2026-10-31T17:01:00Z
  completed: 2026-10-31T17:31:00Z
  duration: ~30 min (23 min of it the full suite)
actuals:
  tokens: 9625     # chars/4 over the realized diff 40d9af20..f97c3985 (38499 chars)
  tasks: 3
  commits: 3
plan_head_before: 40d9af204782e0cfbdd21d4b8c7415c85c6808da
plan_head_after: f97c3985329f8d50406131210c40daaa6a36d810
---

# Quick 261031-nd9: 39-UAT D1-D3 hand-off decisions Summary

The Workflow 04 hand-off loop is now closed. Step 17 puts the Tech Lead back on the queue after a dispute
and keeps the re-plan inside the move limits. A role only proposes a fundamental change, and the change
waits until a named human approves it. Every cause carries a stable `Cause-id:`. Three hand-offs on one
ticket reach the human stop. Test cases (o)-(r) pin all of it. Review findings CR-01..CR-04 are fixed.

## Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 (tracer, D3) | c1ecc7eb | fix(quick-261031-nd9): step 17 queues the Tech Lead after a dispute and binds the re-plan to the move limits (39-UAT D3) | WF04, tier-kit-text.test.ts, quick-261031-nd9.md |
| 2 (D1, D2) | 11125f3a | fix(quick-261031-nd9): a fundamental change waits for human approval, causes carry a Cause-id, and three hand-offs on one ticket reach the human stop (39-UAT D1, D2) | WF04, tech-lead.md, factory.config.md, tier-kit-text.test.ts, quick-261031-nd9.md |
| 3 (docs) | f97c3985 | docs(quick-261031-nd9): changelog and review register for the 39-UAT D1-D3 hand-off decisions | CHANGELOG.md, 39-REVIEW-DISPOSITION.md |

The tracer gate after Task 1 re-ran its automated `<verify>` end to end. It passed, so Task 2 went ahead.

## RED and GREEN transcripts

RED, Task 1 (`npx vitest run scripts/tier-kit-text.test.ts -t "D3"`, `2 failed | 137 skipped`):
```
FAIL ... (o) D3 / CR-01: ... AssertionError: step 17 lacks "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 15.": expected false to be true
FAIL ... (p) D3 / CR-03: ... AssertionError: step 17 lacks "The step 15 move limits bind that plan: record a level raise in it as `Move: escalate`.": expected false to be true
```
RED, Task 2 (`-t "D1|D2"`, `2 failed | 139 skipped`):
```
FAIL ... (q) D1 / CR-02: ... AssertionError: step 17 lacks "Only propose a fundamental fix: leave the requirement, rule, ADR or `checkpoints` value unchanged until a named human approves.": expected false to be true
FAIL ... (r) D2 / CR-04: ... AssertionError: move-record sub-bullet lacks "Add a `Cause-id:` line: the id of the `failed-attempt` note that first raised the cause.": expected false to be true
```
Each case failed only because its sentence was missing. GREEN (`-t "quick 261031-nd9"`, `4 passed | 137 skipped`):
```
✓ (o) D3 / CR-01: after `Disputed:` or `Fundamental:` the Orchestrator queues the Tech Lead (quick 261031-nd9)
✓ (p) D3 / CR-03: the step 15 move limits bind the step 2 re-plan after `Resolved:` (quick 261031-nd9)
✓ (q) D1 / CR-02: a fundamental change is a proposal a named human approves, and every `Resolved:` note is checked (quick 261031-nd9)
✓ (r) D2 / CR-04: a `Cause-id:` line names the cause, and three hand-offs on one ticket reach the human stop (quick 261031-nd9)
```
The whole tier-kit-text file then passed (141/141). Every existing case, (a)-(n) included, ran unedited.

## Decision-to-sentence table

| Decision | Finding | Where | Sentence |
|---|---|---|---|
| D3 | CR-01 | WF04 step 17 | The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 15. |
| D3 | CR-03 | WF04 step 17 | The step 15 move limits bind that plan: record a level raise in it as `Move: escalate`. |
| D1 | CR-02 | WF04 step 17 | Only propose a fundamental fix: leave the requirement, rule, ADR or `checkpoints` value unchanged until a named human approves. |
| D1 | CR-02 | WF04 step 17 | Before step 16 dispatches, the Tech Lead checks every `Resolved:` note against this definition. It treats a fundamental one as `Fundamental:` and returns the ticket to `Blocked`. |
| D1 | CR-02 | WF04 step 15 human stop | After a `Fundamental:` note, ask the human to approve or reject the proposed change. On approval, hand the ticket back to the proposing role to make the change. |
| D1 | CR-02 | tech-lead.md Responsibility 5 | Check every `Resolved:` note per step 17. |
| D1 | CR-02 | factory.config.md escalate paragraph | A role only proposes such a change and leaves it unmade until a named human approves, and the Tech Lead checks every `Resolved:` note against that definition. (Also: `block` sub-bullet "...asks the human to approve or reject a `Fundamental:` proposal.") |
| D2 | CR-04 | WF04 step 15 move record | Add a `Cause-id:` line: the id of the `failed-attempt` note that first raised the cause. |
| D2 | CR-04 | WF04 step 17 | Copy the hand-off note's `Cause-id:` line into a `Disputed:` answer. |
| D2 | CR-04 | WF04 step 15 human stop | Apply it also after three hand-offs on one ticket. Two notes share a cause when they carry the same `Cause-id:` line. |
| D2 | CR-04 | WF04 `## Stop conditions` used-up bullet (FROZEN) | The same stop applies after three hand-offs on one ticket. |
| D2 | CR-04 | tech-lead.md `## Hard limits` (FROZEN) | Stop the same way after three hand-offs on one ticket. |
| D2 | CR-04 | factory.config.md roster row, `## Stop conditions` bullet, step 15 bullet, `block` sub-bullet | ", or after three hand-offs on one ticket" / "The same holds after three hand-offs on one ticket." / "Two notes share a cause when they carry the same `Cause-id:` line, the id of the `failed-attempt` note that first raised it." / "It stops the same way after three hand-offs on one ticket, ..." |

## Sentences shortened by the lexicon or a guard

None. The imperative lexicon, foundation guards, validator and kit-refs accepted every sentence as the
plan gave it.

## Measurements

- Disposition gate (`node scripts/check-diff-disposition.js`): 721 at the start. The D3 edits took it to
  723 and the two D3 rows brought it back to 721. The D1 and D2 edits took it to 733 (12 new clauses) and
  the twelve rows brought it back to 721. The rows in the frozen sections, WF04 `## Stop conditions` (1
  row) and tech-lead.md `## Hard limits` (1 row), carry the companion cells from the plan.
- tech-lead.md: 3667 B before, 3764 B after (WARN 3786, FAIL 4000). Foundation guards print no WARN line
  for it and no repeated clause inside it. The nine WARN lines are on other files and were there before.
- WF04: still 2 `checkpoint: ` matches and 6 `## Stop conditions` bullets. `git diff 40d9af20 --
  scripts/checkpoints.ts scripts/checkpoints.js hooks` is empty. No config key, default or ROLE_CEILINGS
  value changed.
- Literal counts after: `three hand-offs on one ticket` is on 2 lines in WF04, 1 in tech-lead.md and 3 in
  factory.config.md. `Cause-id:` is on 3 lines in WF04 and 1 in factory.config.md.
- Gates, all exit 0: build, typecheck, check-imperative-lexicon, check-foundation-guards,
  validate-agent-factory, check-kit-refs, check:claim-anchors, check:public-docs, check-banned-claims,
  freshness, freshness:adapters, freshness:catalog. The targeted Task 2 vitest set passed 470/470.

## Full non-e2e suite

`timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`: `Test Files 7 failed | 130 passed (137)`,
`Tests 21 failed | 10711 passed | 2 skipped (10734)`, 1384 s.

Failures by file, against the 39-20-SUMMARY baseline:

| File | Failed | Baseline |
|---|---|---|
| scripts/context-io.test.ts | 7 | 7 |
| scripts/context-io-writer-set.test.ts | 2 | 2 |
| scripts/canonical-corpus.test.ts | 1 | 1 |
| scripts/harness-instance-ledger.test.ts | 4 | 4 |
| scripts/uat-gate-exit-contract.test.ts | 5 | 5 |
| install/installer-fs-census.test.ts | 1 | 1 (`node:fs` read-axis census, Node 26) |
| scripts/check-foundation-guards.test.ts | 1 | 1 (environmental: "every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose", from the untracked `~/` directory) |

Every failure is in the recorded set and none is new. The total went from 10730 to 10734 and the pass
count from 10707 to 10711. Both rose by exactly 4, the cases (o)-(r). The 21 failures were already
there before this task and are still failing. None is counted as passing.

## Deviations from Plan

**1. [Rule 1 - Bug] Review register `open:` count**
- **Found during:** Task 3
- **Issue:** The frontmatter of 39-REVIEW-DISPOSITION.md has an `open: 20` count. With CR-01..CR-04
  marked fixed, 20 would be wrong.
- **Fix:** Lowered it to 16. Now 16 entries say `disposition: open`.
- **Files modified:** 39-REVIEW-DISPOSITION.md
- **Commit:** f97c3985

Apart from that, the plan ran as written. The repo config sets `git.allow_default_branch_commits: true`,
so the commits went straight onto `main`. `docs/audit/28-prepass-evidence.md` (still ` M`, never staged)
and the untracked `~/` directory were not touched.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/quick-261031-nd9.md
- FOUND commits: c1ecc7eb, 11125f3a, f97c3985 (all ancestors of HEAD; `git rev-list --count 40d9af20..HEAD` = 3)
