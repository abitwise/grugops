---
kind: checklist
tier: lean
---
# Complexity rubric

The Tech Lead scores every ticket with this rubric, in both modes, after the Definition of Ready check.
The Tech Lead writes the dev tasks first, so the factors read a written dev plan.
The score picks the engineer level.

## Factors

Each factor is an integer 0, 1 or 2.

| Factor | 0 | 1 | 2 | How to measure |
|---|---|---|---|---|
| F1 files touched | 1-2 | 3-5 | 6 or more | Count the dev plan's file list, with tests, fixtures and config. |
| F2 spec completeness | exact files, changes and test cases named | files and Given/When/Then known; approach open | approach still needs design | Read the dev plan. |
| F3 risk surface | none | data writes, public interface, config | auth, money, PII, security, migration, concurrency, test integrity | Write the tag list. |
| F4 novelty | same shape as existing code | new mix of known repo patterns | no precedent, or a new dependency or integration | Name the precedent file, or write "none". |
| F5 test burden | one existing or new unit test | new tests in one layer | cross-layer, E2E or new fixtures | Read the Given/When/Then cases. |
| F6 blast radius | one module, few callers | public signature change, several callers | shared contract or schema across modules | Count the callers with `grep`. |

## Mapping

Apply these rules in this order.

1. Size XL, or a file plan too large for one PR, gives `SPLIT_REQUIRED` and no level.
2. F2 = 2 is not dispatchable, so the ticket goes back to `In Design` for the Architect.
3. Sum the six scores. The sum is their plain total, with no weights and no rounding.
4. A sum of 0-3 gives junior only when F2 = 0 and F3 = 0, and otherwise gives mid.
5. A sum of 4-7 gives mid.
6. A sum of 8-12 gives senior.
7. F3 = 2 gives at least mid.

The bands are inclusive.
A sum of 0-3 with F2 = 1 or F3 = 1 maps to mid, never to junior.

## Junior exclusions

Security, migration, concurrency and test integrity are F3 = 2 risk tags, with auth, money and PII.
Any one of them makes the junior level impossible.
The F3 = 1 tags (data writes, public interface, config) also rule junior out, by mapping rule 4.

## Unknowns

A factor the Tech Lead cannot measure is recorded `UNKNOWN - verify` and scored 2.
A dev plan with no file list scores F2 = 2.

## Record

The decision note lists each factor in F1-F6 order, with its score and the fact behind it.
It then gives the sum, the level, the adapter `grugops-software-engineer-<level>` and any rule above that fired.

## Confidence

LOW confidence: these are starting values.
Calibrate them after about 30 scored tickets.
