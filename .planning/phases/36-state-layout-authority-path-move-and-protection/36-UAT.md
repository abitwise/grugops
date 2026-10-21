---
status: testing
phase: 36-state-layout-authority-path-move-and-protection
source: [36-VERIFICATION.md]
started: 2026-10-21T12:23:43Z
updated: 2026-10-21T12:23:43Z
---

## Current Test

number: 1
name: Live pre-v3 session fallback (36-13 Task 2 human-check)
expected: |
  In a live host-agent session on a repo with only `plans/board.md`, the agent reads `plans/` and says once to run `install --migrate`. With both boards present, it uses `memory-bank/plans/` and says once that `plans/` is stale.
awaiting: user response

## Tests

### 1. Live pre-v3 session fallback (36-13 Task 2 human-check)
expected: In a live session on a pre-v3 repo the agent reads plans/ and says once to run `install --migrate`; with both boards, it uses memory-bank/plans/ and says plans/ is stale. LAYOUT-04 stays unchecked until this passes.
result: [pending]

### 2. Decide the two-root (v2.x) pre-v3 dead end before v3.0 ships (WR-04)
expected: Either Phase 38 is confirmed to own it with a pin that turns red if the "already migrated ... Nothing to do." short-circuit survives, or the arm's wording is fixed now.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
