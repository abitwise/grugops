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
## Acceptance red/green evidence
<!-- quality.tdd dial: off = omit this field · encouraged = note the acceptance scenario was run
     honestly · required = record the outer scenario's red→green sequence as QE actually ran it
     against the host runner; default encouraged (a missing key reads as encouraged). This is the
     QE-owned OUTER-loop evidence; the engineer's inner-loop red/green lives in implementation-handoff. -->
<!-- Floor (no-fabrication): if a step was not run, write `UNKNOWN - verify`. Never record a red or a
     green that did not actually happen — a green that was never run is the most expensive lie in the trace. -->
- Red (acceptance scenario failing first): <what failed, or `UNKNOWN - verify`>
- Green (acceptance scenario passing): <what passed, or `UNKNOWN - verify`>
- Scenario / runner: <the observable business behavior this proves + host runner, or `UNKNOWN - verify`>
## Gaps
