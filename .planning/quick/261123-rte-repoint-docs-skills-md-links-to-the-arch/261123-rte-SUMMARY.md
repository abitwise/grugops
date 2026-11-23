---
phase: quick-261123-rte
plan: 01
subsystem: docs
tags: [docs, links, claim-registry, ci-fix]
status: complete
requires: []
provides:
  - docs/skills.md names the phase 42 evaluation record by its archived path (3 occurrences)
  - claim row C-28-086 verbatim mirrors docs/skills.md line 66 byte for byte
affects: [check-story-docs STORY-05 shipped links, skills-kit-text tests, check-claim-anchors]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - docs/skills.md
    - docs/audit/28-claim-registry.md
decisions:
  - "Registry row C-28-086's verbatim line changes in the same commit as docs/skills.md line 66, because check-claim-anchors compares them byte for byte; the row's mechanism line and every other stale .planning/phases/ reference in docs/audit/ stay unchanged (no check reads them)"
metrics:
  duration: 2m
  completed: 2026-11-23
actuals:
  tokens: 1000
  tasks: 2
  commits: 2
plan_head_before: 1791c1c89424f026bf1722bf25c99f391055c510
plan_head_after: e1732cdf7b482ee909d06805ae56acb7dd73f0df
---

# Quick 261123-rte Plan 01: Repoint docs/skills.md to the archived 42-EVALUATION.md Summary

docs/skills.md now names the phase 42 evaluation record at `.planning/milestones/v3.0-phases/42-skills-per-role-and-evaluation/42-EVALUATION.md` (link text, repository URL, and § How these were chosen), with claim row C-28-086 updated in step, turning the five CI-red tests green.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (tracer) | § How these were chosen names the archived record; C-28-086 verbatim mirrors it | a312fc69 | docs/skills.md (line 66), docs/audit/28-claim-registry.md (line 1376) |
| 2 | § Recommended skills link text and URL name the archived record | e1732cdf | docs/skills.md (line 22) |

Total: 2 files, 3 insertions, 3 deletions. Nothing pushed (`main...origin/main [ahead 2]`).

## Verification

- `npx vitest run` over the six named files (check-story-docs, skills-kit-text, check-claim-anchors, check-public-docs-vocabulary, check-banned-claims, check-audit-register): `Test Files 6 passed (6)`, `Tests 385 passed (385)`, 14.68 s. Baseline at 1791c1c8 was 5 failed / 380 passed.
- Task 1 verify: `node scripts/check-claim-anchors.js` ALL CHECKS PASSED (87 verbatim comparisons, all byte-identical); skills-kit-text + check-claim-anchors tests 90/90 passed; docs/skills.md still 66 lines.
- Task 2 verify: check-story-docs + skills-kit-text tests 114/114 passed; `node scripts/check-story-docs.js` prints `PASS  STORY-05 shipped links ... 0 findings over 41/41 elements`.
- `node scripts/check-claim-anchors.js`, `node scripts/check-audit-register.js`, `node scripts/check-story-docs.js` all exit 0.
- `git grep -n "\.planning/phases/42-" docs/skills.md` prints nothing; the archived path appears exactly 3 times.
- The record is still tracked at its archived path and neither commit touches `.planning/`.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: docs/skills.md, docs/audit/28-claim-registry.md
- FOUND: a312fc69, e1732cdf (both ancestors of HEAD)
