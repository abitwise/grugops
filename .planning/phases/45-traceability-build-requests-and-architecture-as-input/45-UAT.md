---
status: testing
phase: 45-traceability-build-requests-and-architecture-as-input
source: [45-VERIFICATION.md]
started: 2026-11-26T15:10:00Z
updated: 2026-11-26T15:10:00Z
---

## Current Test

number: 1
name: In-flight floor conflict stop (ARCH-02, backstop)
expected: |
  Give the Orchestrator an in-flight ticket whose upstream architecture decision conflicts with a floor.
  The ticket goes to `Blocked` naming the build request, and the Orchestrator stops for a named human
  before any further dispatch on it. The floor does not move.
awaiting: user response

## Tests

### 1. In-flight floor conflict stop (ARCH-02, backstop)
expected: A floor conflict found while work is in flight sends the affected tickets to `Blocked` with a bullet naming the build request, and the Orchestrator stops for a named human before further dispatch on them (45-02; a prose rule in Workflow 20 that no program exercises).
result: [pending]

### 2. Pin moved again mid-answer (BR-05, backstop)
expected: Move a pin, begin recording an answer, move the pin again, run `upstream.js requests`. The recorded answer keeps the pin the human named, and the next run reports against the newer pin; nothing already written changes (45-07; prose rule).
result: [pending]

### 3. Budget is per file (45-04 A5, BR-07)
expected: The human accepts the 8,192-byte budget measured per build-request file, not as a folder total, as the reading of BR-07's byte budget.
result: [pending]

### 4. `install --migrate` does not seed build-requests/ (45-05 D3)
expected: The human accepts that an already-migrated v3 repository gets `memory-bank/plans/build-requests/` on its next plain install (the `--migrate` already-migrated arm prints "Nothing to do"), and that the missing folder is never a finding meanwhile — or asks for a follow-up installer change.
result: [pending]

### 5. Windows ancestry graft protection (45-06 A6)
expected: On a Windows host with git, a local graft file (or replace ref) cannot make `upstream.js requests` treat a non-descendant pin as a descendant (`GIT_GRAFT_FILE` set to the null device). Cannot be exercised on the Linux dev host.
result: [pending]

### 6. Undeclared source exits 2 (45-07)
expected: The human accepts that an open or carried request naming a source not declared under `upstream` prints `UNKNOWN - verify ... source <s> is not declared` and exits 2 (so every request in a repository with no `upstream` config does), rather than passing quietly.
result: [pending]

### 7. Citation readings (45-08 A2 and A4, TRC-01/TRC-03)
expected: The human accepts that a citation counts from any current note that names the ticket (A2), and that whether a finding is a warning, an error or `UNKNOWN - verify` depends on whether the ticket is Done (A4).
result: [pending]

### 8. Sweep lists a waiting ticket under blocked (45-11 D5)
expected: In a live daily-sweep report, a ticket waiting on a build request is listed under blocked with its `BR-<n>` named, and `Blocked time` still counts it.
result: [pending]

### 9. Judgment-tier prohibitions (non-authoritative verifier reading)
expected: Reading Workflow 20, the build-request contract and the five roles once confirms the text holds each prohibition: no floor is moved by an upstream decision; no upstream text is copied into an ADR; `human:<name>` is not presented as authentication; no agent records its own request carried or answered; nothing is written into an upstream repository; the `blocked_escalation_days` exemption stays per bullet.
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
