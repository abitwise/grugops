---
phase: 40-plain-language-role-rewrite
plan: 15
subsystem: testing
tags: [fixtures, validator, writing-profile, gap-closure, drift]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: ROLE_SECTIONS at nine prefixes (plan 40-08) and the IN-01/IN-03 review findings (40-REVIEW.md)
provides:
  - 176 fixture role headers that type no section count
  - A permanent pin in scripts/validate.test.ts refusing a number before "prefix-matched section checks"
  - writing-profile.md lines 8 and 304 stated without internal ids
affects: [validator fixtures, writing-profile, claim registry C-28-045]

actuals:
  tokens: 27400
  tasks: 2
  commits: 2
plan_head_before: 3c46165fb1b32d515f14b83a54db70f178398e84
plan_head_after: d1b7043795732502397b42d10a8df1fbf9e9d2af

tech-stack:
  added: []
  patterns:
    - "Remove a typed count from prose rather than re-type it, and pin its absence"

key-files:
  created: []
  modified:
    - scripts/validate.test.ts
    - scripts/fixtures/*/agent-factory/roles/*.md (176 files, one header line each)
    - agent-factory/writing-profile.md

key-decisions:
  - "IN-03 fixed by removing the count, not re-typing it to 9; a test refuses any number (digits or number word) before the phrase"
  - "IN-01 third point (line 302, 'the fenced blocks restate rather than compress') closed by decision, not edit: lines 300-302 are the C-28-045 frozen disproof record held by check-claim-anchors and the D-54 frozen-block rule"
  - "Optional part of IN-03 (drop the retired caveman heading from the good fixture) deferred: fixtures prove validator behavior, not the shipped shape"

patterns-established:
  - "Fixture-header pin: walk scripts/fixtures/*/agent-factory/roles, require >= 176 files checked so an empty walk cannot pass"

requirements-completed: [PLAIN-01, PLAIN-02, PLAIN-07]

coverage:
  - id: D1
    description: "No fixture role header types a section count, and a permanent case keeps it so (IN-03)"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#fixture role headers type no section count (IN-03)"
        status: pass
      - kind: other
        ref: "grep -rl '8 prefix-matched' scripts/fixtures | wc -l -> 0; numstat 176 176"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every fixture keeps its verdict (good and warn-only pass, each bad fixture fails for its one reason)"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/validate.test.ts (197 passed)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && npm run typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "writing-profile.md lines 8 and 304 cite no internal id and state the current fact; C-28-045 anchor byte-unchanged; file stays 317 lines (IN-01)"
    requirement: PLAIN-07
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js && npm run check:claim-anchors && node scripts/check-imperative-lexicon.js && node scripts/check-foundation-guards.js"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/check-banned-claims.test.ts scripts/check-claim-anchors.test.ts scripts/voice-model.test.ts (223 passed)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 15: IN-01 and IN-03 info findings closed Summary

**176 fixture role headers lose the typed "8" before "prefix-matched section checks" and a validate.test.ts case refuses any number coming back; the writing profile's line 8 and line 304 drop their internal ids, and the C-28-045 anchor stays byte-exact.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-11-01T22:20:43Z
- **Completed:** 2026-11-01T22:23:47Z
- **Tasks:** 2
- **Files modified:** 178 (176 fixture role files, scripts/validate.test.ts, agent-factory/writing-profile.md)

## Accomplishments

- IN-03: every fixture role header now reads "just enough to satisfy the validator's / prefix-matched section checks." with no count, so it cannot drift from ROLE_SECTIONS (nine entries) again.
- IN-03 pin: `fixture role headers type no section count (IN-03)` walks every `.md` under `scripts/fixtures/*/agent-factory/roles/`, refuses a number (digits or number word) before the phrase, and requires at least 176 files checked.
- IN-01: line 8 and line 304 of `agent-factory/writing-profile.md` state current facts without internal ids; the C-28-045 block is untouched.

## Evidence the plan asked for

**RED output of the IN-03 pin (before the fixture edit):** `Tests 1 failed | 196 skipped`; the offenders array listed 176 entries of the form `"<fixture>/agent-factory/roles/<role>.md: \"8 prefix-matched section checks\""` (counted: 176).

**Changed-file count printed by the fixture script:** `changed 176 files`. `git diff --numstat HEAD -- scripts/fixtures` summed to `176 176` before the commit (one line per file). The protocol fixtures and every other fixture line are untouched.

**The two new writing-profile lines:**

- Line 8: `files carry no caveman block; the grug voice appears only in light brand copy.`
- Line 304: `Role bodies are a governed surface of this profile, reached by the build-time gate like the other kit files.` (matches the `role bodies | build-time gate` row of the § *Governed surfaces* table; no banned-claims literal).

**The decision that keeps line 302:** IN-01's third point is closed by decision, not by edit. Lines 300-302 (the `<!-- claim: C-28-045 -->` marker and the two anchored lines ending "the fenced blocks restate rather than compress.") are a frozen disproof record: check-claim-anchors compares them byte for byte, and the D-54 frozen-block rule in check-banned-claims holds them. They record a historical measurement and stay exactly as they were (verified identical to HEAD). Each edit replaced one line with one line, so the file stays 317 lines and `BANNED_CLAIM_EXEMPT_EXTENT` stays 73; `scripts/check-banned-claims.ts` was not edited.

## Task Commits

1. **Task 1: fixture headers stop typing a section count, pinned** - `45b0a7f5` (fix). Tracer gate: interactive run, `human_verify_mode: end-of-phase`, automated-only verify; verify re-run green, so expansion continued with no checkpoint.
2. **Task 2: IN-01 writing profile lines without internal ids** - `d1b70437` (fix)

**Plan metadata:** see the docs(40-15) commit that carries this SUMMARY.

## Files Created/Modified

- `scripts/fixtures/{bad-config-no-mode,bad-plugin-noname,bad-role-missing-section,bad-ticket-bad-column,bad-ticket-body-column,bad-ticket-duplicate-key,bad-ticket-mismatch,bad-ticket-no-region,bad-workflow-no-commit,good,warn-only-no-trace}/agent-factory/roles/*.md` - header line 4 drops the leading "8 " (16 files per directory, 176 total)
- `scripts/validate.test.ts` - new case `fixture role headers type no section count (IN-03)`
- `agent-factory/writing-profile.md` - line 8 and line 304 rewritten

## Decisions Made

- Remove the count rather than re-type it to 9 (a typed count is this repo's known drift class).
- Keep lines 300-302 byte-exact as the C-28-045 frozen anchor (see above).
- Defer the optional IN-03 part (drop the retired caveman heading from the `good` fixture).

## Deviations from Plan

**1. [Acceptance criterion wording] `-t "IN-03"` matches 5 tests, not 1**
- **Found during:** Task 1
- **Issue:** The criterion says `npx vitest run scripts/validate.test.ts -t "IN-03"` reports 1 passed test. `scripts/validate.test.ts` already has a describe from plan 37-26 named `IN-03: an unreachable state directory or layout marker is a named finding, never absent`, whose 4 tests also match the filter. The run reports `5 passed | 192 skipped`.
- **Fix:** None to the code; renaming a plan 37-26 describe is out of scope. The new case alone was run with `-t "type no section count"`: `1 passed | 196 skipped`. The test name carries "(IN-03)" as the plan specified.
- **Files modified:** none
- **Commit:** n/a

**Total deviations:** 1 (a criterion-wording mismatch, no code change). **Impact:** none on the delivered behavior.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `npx vitest run scripts/validate.test.ts scripts/check-banned-claims.test.ts scripts/check-claim-anchors.test.ts scripts/voice-model.test.ts scripts/adapter-byte-baseline.test.ts` - 5 files, 428 passed
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` - ALL CHECKS PASSED
- `node scripts/check-banned-claims.js`, `npm run check:claim-anchors`, `node scripts/check-imperative-lexicon.js`, `node scripts/check-foundation-guards.js` - each ALL CHECKS PASSED
- `npm run typecheck` - exit 0
- Acceptance greps: `8 prefix-matched` in fixtures 0; `prefix-matched section checks` in fixtures 176; `(PLAIN-01)` in the profile 0; `in plan 40-10` 0; the C-28-045 sentence 1; `wc -l` 317; `files carry no caveman block; the grug voice` 1

## Next Phase Readiness

Both cheap info findings of the round are closed; no stale count or internal id is left in the named lines.

## Self-Check: PASSED

- FOUND: scripts/validate.test.ts, agent-factory/writing-profile.md
- FOUND: 45b0a7f5, d1b70437 (both ancestors of HEAD)
