---
status: testing
phase: 41-orchestrator-flow-guidance
source: [41-VERIFICATION.md]
started: 2026-11-08T18:57:45Z
updated: 2026-11-08T18:57:45Z
---

## Current Test

number: 1
name: One live Claude Code run on a plugin install and one on a standalone install: spawn a role, have it publish a note with the command in Workflow 16 step 3, have it run `claim.js done`
expected: |
  The role writes through tools/grugops/note.js, `done` exits 0, the row leaves now-running.md and `free` rises
awaiting: user response

## Tests

### 1. One live Claude Code run on a plugin install and one on a standalone install: spawn a role, have it publish a note with the command in Workflow 16 step 3, have it run `claim.js done`
expected: The role writes through tools/grugops/note.js, `done` exits 0, the row leaves now-running.md and `free` rises
why_human: role-route.test.ts and my own scratch run execute the literal commands on lone copies. Neither shows what a host's permission model lets a spawned role run. R-41-01 stays open until a named human reads a live run.
result: [pending]

### 2. Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi (RUN-04)
expected: The Orchestrator claims, refills and sweeps from Workflow 17 alone; a role writes and closes with note.js
why_human: These CLIs are absent here (R-41-05, `UNKNOWN - verify`). RUN-04's 'reads the same on all six hosts' is proven for the text only.
result: [pending]

### 3. Windows run of note.js's trustedRepoRoot ladder
expected: Rung 1 and rung 2 spell a path the same way (for example RUNNER~1)
why_human: Windows is `UNKNOWN - verify`; Linux only was measured.
result: [pending]

### 4. Read the `pending (named human)` rows in docs/audit/29-style-dispositions/41-*.md (93 lines match the phrase, counted by grep; includes 41-14, 41-17 and 41-18), the last row of 41-16.md, and the Manual-Only rows of 41-VALIDATION.md
expected: A named human replies with a name, or rejects a row
why_human: The gate proves a row exists and cannot judge meaning. 41-SECURITY.md T-41-27 holds only on the plan's own definition of a safety row, and the T-41-27 ruling is the human's.
result: [pending]

### 5. Read residuals R-41-01 to R-41-09 in docs/audit/41-residuals.md, in particular R-41-07's fourth limit (T-41-74) and R-41-09 (T-41-81)
expected: A named human accepts each in a form that names its scope, or sends it back for closing
why_human: No agent may accept a residual. T-41-74 and T-41-81 read `pending (named human): accept`; T-41-73 needs its Accepted Risks Log row; T-41-66 has no log row. All five open threats are below the high threshold.
result: [pending]

### 6. Decide CR-03: ship a verdict verb for hosts, or state that a scripted host has no gate stamp, and fix Workflow 16 line 41 ('the workhorse path') accordingly
expected: A recorded decision that either closes CR-03 or records a residual
why_human: The plain fix lets any agent mint a green verdict on a host (the human's call, per the review). It fails closed today, so no false finding enters the context.
result: [pending]

### 7. Triage the 26 open rows of 41-REVIEW-DISPOSITION.md (CR-03, WR-09, WR-10, WR-12, WR-13, WR-14, WR-15 and the carried WR-05 to WR-08, WR-11)
expected: Each row fixed, accepted or sent to a later phase by a named human
why_human: Disposition is a human ruling. WR-12 (no host read verb) and WR-15 (changelog states the supersession rules without R-41-09's limits) bear most on a role's day-to-day route.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
