---
status: testing
phase: 34-model-effort-dial-pi-support
source: [34-VERIFICATION.md]
started: 2026-10-09T13:07:06Z
updated: 2026-10-09T13:07:06Z
---

## Current Test

number: 1
name: "HOST-02: push the HEAD of this phase and read the windows-latest job"
expected: |
  No test added or changed by Phase 34 is red on `test (windows-latest)`. 34-VALIDATION.md "Gap round 2 (D-21): prediction for the deferred run" predicts the two ledger.test.ts link-record tests turn green and the five carried reds (WINDOWS.md rows 316/317) stay red; record the run id, head sha and the verbatim `Tests` line.
awaiting: user response

## Tests

### 1. HOST-02: push the HEAD of this phase and read the windows-latest job
expected: No test added or changed by Phase 34 is red on `test (windows-latest)`. 34-VALIDATION.md "Gap round 2 (D-21): prediction for the deferred run" predicts the two ledger.test.ts link-record tests turn green and the five carried reds (WINDOWS.md rows 316/317) stay red; record the run id, head sha and the verbatim `Tests` line.
result: [pending]

### 2. Run `/grugops <request>` on a real Pi after a scripted install
expected: Command listed and expanded; Orchestrator reached (kit discovery after a scripted install is UNKNOWN - verify, backlog 999.4)
result: [pending]

### 3. Observe a real Claude Code sub-agent run with a configured `effort:` line
expected: Configured level applied; inherit leaves the session level
result: [pending]

### 4. Decide WR-11 and WR-12: fix in a round 3, or accept and record
expected: Either (a) a Windows-written marker on a POSIX checkout is read as "written for another directory" and replaced, as at base 620e419d, with the closing banner's ask-rules line conditioned on what writeAskRules did; or (b) a recorded decision that the stricter refusal stands, with the refusal text saying "another platform's path spelling" and giving the remedy.
result: [pending]

### 5. Windows product link ownership: install with --symlink on windows-latest, then uninstall
expected: `isOwnLink` (now through `sameRecordedPath`) answers true for the recorded source and the link is removed (WINDOWS.md row 319 product reach is UNKNOWN - verify; a mismatch fails closed and never deletes)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
