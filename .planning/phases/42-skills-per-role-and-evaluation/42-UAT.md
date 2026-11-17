---
status: testing
phase: 42-skills-per-role-and-evaluation
source: [42-VERIFICATION.md]
started: 2026-11-17T00:00:00Z
updated: 2026-11-17T00:00:00Z
---

## Current Test

number: 1
name: Live per-host skill discovery on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi
expected: |
  A skill placed in the folders the docs/skills.md host table names is listed by that host, and the doctor's `found` line agrees with what the host loads
awaiting: user response

## Tests

### 1. Live per-host skill discovery on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi
expected: A skill placed in the folders the docs/skills.md host table names is listed by that host, and the doctor's `found` line agrees with what the host loads
result: [pending]

### 2. Read docs/skills.md as a user
expected: Nothing implies grugops vets or vouches for a third-party skill, and the one-sentence reasons for declining the four skills reads as fair to the maintainer's reply ('security, complexity/performance and licensing reasons')
result: [pending]

### 3. Resolve every `pending (named human)` row in docs/audit/29-style-dispositions/42-03.md and 42-06.md
expected: A named human replaces each `pending (named human)` with a disposition by typed name
result: [pending]

### 4. Review the three review fixes marked `requires human verification` in 42-REVIEW-FIX.md (WR-01 override-variable condition, WR-02 real-path containment rule, WR-03 advisory wording)
expected: A named human confirms each condition change and the new wording are the behavior wanted
result: [pending]

### 5. Accept or reject the open risk R-42-01 recorded in 42-SECURITY.md
expected: A named human accepts it by typed name
result: [pending]

### 6. Run `install.js --check` on Windows (CR-01 absolute-PATH probe, WR-04 `claude.cmd`)
expected: A planted `claude.exe` in the target repo is not run; an npm-installed `claude.cmd` is found or reported as not checked with a correct reason
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
