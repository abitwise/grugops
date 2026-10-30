---
status: testing
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
source: [39-VERIFICATION.md]
started: 2026-10-30T09:50:00Z
updated: 2026-10-30T09:50:00Z
---

## Current Test

number: 1
name: Live level adapters and Designer on Claude Code >= 2.1.293
expected: |
  Install into a scratch repo on Claude Code >= 2.1.293 and spawn grugops-software-engineer-junior, -mid and -senior, and grugops-designer (publish a design note).
  /tasks shows haiku/medium, sonnet/medium and opus/high respectively; the Designer reaches scripts/context-io.js through Bash and its note is admitted (not refused as unsealed); a level adapter is not auto-delegated for unscored work.
awaiting: user response

## Tests

### 1. Live level adapters and Designer on Claude Code >= 2.1.293
expected: /tasks shows haiku/medium, sonnet/medium, opus/high for junior, mid, senior; the Designer reaches scripts/context-io.js through Bash and its note is admitted (not refused as unsealed); a level adapter is not auto-delegated for unscored work
result: [pending]

### 2. WF04 and WF14 read clearly
expected: Reading WF04 steps 2-4 and 14-16 plus the stop bullets, and WF14 step 1 plus the missing-token stop, a first-time reader follows score -> plan -> named level -> escalation (with the named-human stop before any re-enqueue after a spent self-fix budget), and Designer -> contract -> build
result: [pending]

### 3. Upgrade docs and cited Claude Code facts
expected: install/README.md level, retired-adapter and flattening sections and CHANGELOG [Unreleased] read clearly to an upgrading user and claim no detection or enforcement grugops lacks (see advisory WR-11); re-checking code.claude.com/docs/en/sub-agents confirms the cited precedence facts and the `agent.spawn` flattening claim
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
