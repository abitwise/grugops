---
status: testing
phase: 37-overview-board-per-file-records-and-budgets
source: [37-VERIFICATION.md]
started: 2026-10-24T16:11:07Z
updated: 2026-10-24T16:11:07Z
---

## Current Test

number: 1
name: CI reachability of the own-tree gates (carried from rounds 0 to 2; left out of every gap round by D-17, D-18, D-19)
expected: |
  On a pushed branch the ubuntu 'Freshness gates + repo gates' step reaches `node scripts/runnable-ref/state-check.js .` (ci.yml line 605) and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. Both sit after `node scripts/check-diff-disposition.js` (ci.yml line 512, 721 findings) and `node scripts/check-flip-manifest.js` (line 602) in one fail-fast run block; a human decides how to clear those findings (disposition rows or a moved base).
awaiting: user response

## Tests

### 1. CI reachability of the own-tree gates (carried from rounds 0 to 2; left out of every gap round by D-17, D-18, D-19)
expected: On a pushed branch the ubuntu 'Freshness gates + repo gates' step reaches `node scripts/runnable-ref/state-check.js .` (ci.yml line 605) and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. Both sit after `check-diff-disposition.js` (line 512, 721 findings) and `check-flip-manifest.js` (line 602) in one fail-fast run block; a human decides how to clear those findings. Locally both exit 0.
result: [pending]

### 2. Live host run of the PR-gate and daily-sweep sub-steps (37-VALIDATION Manual-Only)
expected: On a real host remote, trace-render exits 0, state-check prints the marker valid and exits 0, and the workflow step records the exit code without blocking the gate.
result: [pending]

### 3. Round-3 rule changes to keep or reverse (37-39 coverage item D6; deferred-items.md)
expected: A decision on each of the following. None contradicts a locked decision; each follows from D-20.
  - the `.grugops/queue` link refusal
  - the linked listed-folder rule: one finding, not exit 2
  - state-check stopping at the marker behind a root-chain link: exit 2, never WARN
  - the backslash-name refusal
  - for a regular file at a context root, state-check exits 2; the alternative is a finding with exit 1
result: [pending]

### 4. Round-3 review findings WR-12, WR-13, WR-14 and IN-14: a fourth (last) gap round, or recorded acceptance
expected: Either a round-4 plan scoped to these four, or a recorded acceptance in 37-REVIEW-DISPOSITION.md.
  - WR-12: a hole in the hand-trace scan created by the WR-11 fix (a comma list of objects; "per Workflow 16")
  - WR-13: verbs and nouns still listed by hand (14 of 24 sentences the verifier tried still pass)
  - WR-14: a stray entry whose name falls outside the task grammar gets exit 2 with no "move it out" remedy
  - IN-14: state-check follows an in-root link at board.md that state-roll refuses

None of the four makes a must-have false, and none deletes or fakes a trace file. The live tree has zero such sentences.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
