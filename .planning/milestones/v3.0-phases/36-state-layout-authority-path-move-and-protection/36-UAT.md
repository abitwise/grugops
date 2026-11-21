---
status: complete
phase: 36-state-layout-authority-path-move-and-protection
source: [36-VERIFICATION.md]
started: 2026-10-21T12:23:43Z
updated: 2026-10-21T12:43:43.802Z
---

## Current Test

[testing complete]

## Tests

### 1. Live pre-v3 session fallback (36-13 Task 2 human-check)
expected: In a live session on a pre-v3 repo the agent reads plans/ and says once to run `install --migrate`; with both boards, it uses memory-bank/plans/ and says plans/ is stale. LAYOUT-04 stays unchecked until this passes.
result: pass
evidence: "Run by Claude 2026-10-21 on Claude Code 2.1.304 in a scratch repo (scratch GRUGOPS_HOME; fresh install, then memory-bank/plans moved to plans/ with marker ticket UAT-777). Plain install exit 1, names --migrate, nothing written; --update refreshed kit only; --check WARN. Live `claude -p \"/grugops show me the board\"` (project skill): (a) plans/ only -> read plans/board.md, showed UAT-777, said once to run `install --migrate`, git status clean, no memory-bank/plans/ created; (b) both boards (memory-bank/plans/board.md with UAT-888) -> used memory-bank/plans/, showed UAT-888, said once plans/ is stale. One run per case, Claude Code only; the other five hosts are not exercised."

### 2. Decide the two-root (v2.x) pre-v3 dead end before v3.0 ships (WR-04)
expected: Either Phase 38 is confirmed to own it with a pin that turns red if the "already migrated ... Nothing to do." short-circuit survives, or the arm's wording is fixed now.
result: pass
evidence: "Claude reproduced the dead end in the scratch repo (plain install refuses naming --migrate; --migrate prints 'already migrated to the two-root layout. Nothing to do.', exit 0). Human chose 'Pin in Phase 38' 2026-10-21: ROADMAP Phase 38 SC 6 and REQUIREMENTS MIGRATE-04 now name the v2.x two-root case and the short-circuit, so Phase 38's verification fails if it survives; 36-REVIEW-DISPOSITION WR-04 set to deferred."

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
