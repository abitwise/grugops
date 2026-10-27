---
status: testing
phase: 37-overview-board-per-file-records-and-budgets
source: [37-VERIFICATION.md]
started: 2026-10-27T10:12:19Z
updated: 2026-10-27T10:12:19Z
---

## Current Test

number: 1
name: WR-15 — state-check prints ROLLABLE for a board that state-roll refuses
expected: |
  A decision: accept and record (37-REVIEW-DISPOSITION.md + deferred-items.md), narrow the readState docblock and the plan 37-41 "never prints a ROLLABLE line" wording, or close the other roll refusals in state-check as a follow-up outside the 4-round cap. Reproduced: a non-UTF-8 board, or an in-root link at memory-bank/plans/archive/board-done.md, makes state-check print ROLLABLE (exit 1), and then state-roll exits 2 and writes nothing. This is not a regression: the build from 78416b71 prints the same line for the non-UTF-8 board.
awaiting: user response

## Tests

### 1. WR-15 — state-check prints ROLLABLE for a board that state-roll refuses
expected: A decision: accept and record, narrow the docblock and plan wording, or close the other roll refusals as a follow-up. Reproduced: a non-UTF-8 board, or an in-root archive/board-done.md link, makes state-check print ROLLABLE (exit 1), and state-roll then exits 2. Not a regression.
result: [pending]

### 2. WR-16 — a pre-existing tools/grugops/package.json without "type":"module" disables every program while install exits 0
expected: A decision: keep "skipped, never-overwrite, exit 0" (what D-21 and plan 37-40 pin), or make a differing package file that does not set "type":"module" an install verify finding (exit 3). Reproduced: a pre-existing {"type":"commonjs","private":true} is left untouched, install exits 0, and state-check then exits 1 with "Failed to load the ES module".
result: [pending]

### 3. CI reachability of the own-tree gates (deferred to backlog 999.12)
expected: On a pushed branch the ubuntu "Freshness gates + repo gates" step reaches node scripts/runnable-ref/state-check.js . and the validator. Both are blocked by check-diff-disposition (721 findings) and check-flip-manifest. Already deferred by the human (3c617d72); confirm the deferral stands.
result: [pending]

### 4. Live commonjs-host run of the PR-gate and daily-sweep sub-steps after the fix
expected: On a real host remote whose package.json says "type":"commonjs", trace-render exits 0, state-check prints marker valid and exits 0, and the workflow step records the exit code without blocking the gate. The programs half is reproduced locally; the workflow half needs a live run.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
