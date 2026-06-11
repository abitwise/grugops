---
kind: handoff
stage: product
---
# Handoff: product

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
<!-- Scenario→trace (additive convention, NOT a schema rename): an Acceptance scenario below
     can map 1:1 to one plans/traceability.md row, recorded in-cell via the existing comment
     convention. Lean at the lean tier; 1:1 linkage is the enterprise direction. -->

## Next agent
## Next action

---

## User value
## Scope
## Out of scope
## Acceptance criteria (Given/When/Then)
<!-- criteria = the terse pass/fail bar; the Acceptance scenarios block below is the executable contract — do not duplicate -->
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
## Dependencies
## Risks
## Test notes
## Security/NFR triggers
## Size estimate
## Priority
