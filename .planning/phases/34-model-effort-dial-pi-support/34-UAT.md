---
status: testing
phase: 34-model-effort-dial-pi-support
source: [34-VERIFICATION.md]
started: 2026-10-10T17:55:51Z
updated: 2026-10-10T17:55:51Z
---

## Current Test

number: 1
name: Live Pi re-run (round-2 UAT test 2, gap G-34-2) on the round-4 tree
expected: |
  Install grugops into a scratch repository with the scripted installer (own GRUGOPS_HOME), start Pi from
  the repository root, grant project trust, type /grugops hello. Pi expands the template, reads
  .grugops/install.json, reads <kitRoot>/roles/orchestrator.md and acts as the Orchestrator; no ENOENT, no STOP.
awaiting: user response

## Tests

### 1. Live Pi re-run (round-2 UAT test 2, gap G-34-2) on the round-4 tree
expected: Orchestrator reached after a scripted install, kit in a separate kit home (steps in 34-VALIDATION.md)
result: [pending]

### 2. Live runs on Copilot, Codex, OpenCode and Gemini (one Gemini run with context.fileName listing AGENTS.md)
expected: Each follows the AGENTS.md / pointer route to the kit; Gemini actually loads AGENTS.md when its settings list it
result: [pending]

### 3. HOST-02: Windows measurement
expected: No Phase 34 test red on windows-latest (needs a human push; out of scope during active development per D-21/D-25; no macOS result substitutes)
result: [pending]

### 4. Decide round-4 review findings WR-13..WR-16 and IN-14..IN-17 (cap of four gap rounds is spent)
expected: Record them as deferred with a reason (deferred-items.md plus 34-REVIEW-DISPOSITION.md), or accept a round 5 beyond the cap, or apply an override. WR-13 is the same class (VERDICT-1/AUTH-1) as round 4, on a state the class matrix does not build.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

(The round-2 UAT and its diagnosed gaps G-34-2/G-34-4 are kept in 34-UAT-ROUND2.md.)
