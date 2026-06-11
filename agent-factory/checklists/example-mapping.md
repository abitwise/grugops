---
kind: checklist
tier: lean
---
# Example Mapping (Three Amigos)

The discovery conversation that produces the acceptance scenarios before code. The
BA/PM runs it in `07-backlog-refinement.md` after a ticket is INVEST-shaped; the
declarative scenarios it surfaces feed the `## Acceptance scenarios (Given/When/Then)`
block in the product and QE handoffs.

<!-- bdd dial: off = skip this step · lean = BA self-runs all three voices · strict = named participants. Absent = lean. -->

- run the discovery conversation FIRST; write the Given/When/Then AFTER, not live during the workshop — the value is the conversation, not the syntax
- three voices: product decides scope · QE generates edge cases · engineer adds detail (lean = the BA plays all three)
- map with four cards:
  - story (yellow) — the one thing being mapped
  - rule (blue) — an acceptance constraint summarizing examples
  - example (green) — a concrete case under a rule → later a declarative scenario
  - question (red) — an open unknown; defer it, do not block on it
- declarative business language only — no `#id`/`.class`/`click`/`navigate to`; UI detail lives behind step definitions
- Done when: each rule has ≥1 example, open questions are captured, and the scenarios that follow read as observable business outcomes (no selectors)

## The contract-vs-logic seam (one behavior, one layer)

One scenario asserts one observable business outcome — once. The unit tests beneath it
assert the internal logic and edge cases, never re-asserting the same outcome. A worked
example, stack-neutral:

```
Behavior: "A discount code reduces the order total."

OUTER (BDD acceptance — asserts the OBSERVABLE outcome, ONCE):
  Given an order of 100 and a valid 10%-off code
  When the code is applied
  Then the order total is 90

INNER (TDD unit — asserts the LOGIC + EDGE CASES beneath, never re-asserting "total is 90"):
  - percentage math rounds half-up        (unit)
  - an expired code is rejected           (unit)
  - a code below the minimum-spend fails  (unit)
  - stacking two codes is disallowed      (unit)
```

Seam: the acceptance scenario owns "the total is 90" once; the unit tests own how the
discount engine behaves. The same end-state asserted at both layers is the duplication
smell to avoid. (Mechanical no-duplication enforcement is planned for the quality gate
(`agent-factory/workflows/05-pr-quality-gate.md`); this hub lands the rule.)
