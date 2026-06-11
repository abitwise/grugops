---
kind: handoff
stage: qe
---
# Handoff: qe

## Source
Request:
Repo:
Branch:
Ticket ID:        # (v2) for traceability
Date:

## Goal
## Scope
### In scope
### Out of scope
## Inputs used
## Decisions
## Risks
## Trace updates   # (v2) IDs/files this links in plans/traceability.md
## Next agent
## Next action

---

## Test scope
## Unit/integration/E2E coverage
## Acceptance scenarios (Given/When/Then)
<!-- bdd dial: off = omit · lean = inline declarative G/W/T below · strict = link selector-free
     scenario files wired to host step definitions; default lean. Declarative business language
     only — NO CSS/HTML/selectors in Given/When/Then; UI detail lives behind step definitions.
     Executable-or-absent. -->

Scenario: <one observable business behavior>
  Given <business precondition>
  When  <business action>
  Then  <observable business outcome>

<!-- strict tier: reference the host scenario file + runner instead of inlining, e.g.
     features/<area>.feature  (host runner: UNKNOWN - verify — Cucumber / Behave / playwright-bdd) -->
## Manual test cases
## Regression risks
## Test data
## Commands run
## Flaky risk
## Coverage vs threshold
## Result
## Gaps
