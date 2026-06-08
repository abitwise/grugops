---
phase: 09-doctor-two-root-validator
plan: 06
subsystem: testing
tags: [validator, fail-closed, null-guard, json, gap-closure, cr-03, val-02, javascript, posix-sh]

# Dependency graph
requires:
  - phase: 06-validation-brand-dogfood
    provides: scripts/validate-agent-factory.mjs (VAL-01 structure validator) + validate.test.sh self-test harness
  - phase: 09-doctor-two-root-validator
    provides: two-root validator split (VAL-02 / D-08) — VALIDATE_KIT_ROOT (no default, C3 guard) + STATE_ROOT
provides:
  - "Fail-closed invariant restored (CR-03): a null-literal / array / primitive JSON config or plugin manifest degrades to a greppable 'not a JSON object' finding + nonzero exit, never an uncaught TypeError"
  - "Two null-literal regression cases in validate.test.sh (config + plugin), RED-before / GREEN-after, locking the crash path"
affects: [validator, structure-gate, future validator extensions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guard non-object JSON.parse results (null/array/primitive) BEFORE dereferencing — JSON.parse('null') is valid ECMAScript that returns null without throwing, so a try/catch alone is not fail-closed"
    - "No-fabrication test gate: feed the EXACT crashing input (printf 'null') and assert finding + nonzero + NO TypeError — RED before the guard, GREEN after"

key-files:
  created: []
  modified:
    - scripts/validate-agent-factory.mjs
    - scripts/validate.test.sh

key-decisions:
  - "Guard message is the greppable literal '{rel}: not a JSON object', consistent with the adjacent '{rel}: not valid JSON' finding style"
  - "Guard predicate is cfg === null || typeof cfg !== 'object' || Array.isArray(cfg) — catches null AND array AND primitive (typeof [] === 'object', so Array.isArray is the array catch)"
  - "Regression fixtures built hermetically under $WORK from $FIX/good (cp -R, trap-cleaned); no new committed fixture trees"

patterns-established:
  - "Pattern 1: any JSON.parse whose result is later dereferenced must be followed by a null/non-object guard, not just a try/catch (JSON.parse('null') === null does not throw)"
  - "Pattern 2: a fail-closed test feeds the literal crashing input and asserts the absence of a stack trace (! grep TypeError) in addition to the presence of the finding"

requirements-completed: [VAL-02]

# Metrics
duration: 5min
completed: 2026-06-08
---

# Phase 9 Plan 6: Validator Fail-Closed Null-Guard (CR-03) Summary

**JSON.parse('null') null-object guard in checkConfig + checkPackaging — a null/array/primitive config or plugin manifest now degrades to a greppable 'not a JSON object' finding instead of an uncaught TypeError, with two RED-before/GREEN-after regression cases locking the crash path.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-08T08:38Z
- **Completed:** 2026-06-08T08:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Restored the validator's documented fail-closed invariant (CR-03): the file header promises "every read/JSON.parse … becomes a finding, never an unhandled throw", but `JSON.parse('null')` returns `null` without throwing, slipping past the try/catch and crashing the later `cfg[key]` / `manifest.name` deref with an uncaught `TypeError` (Node stack trace, not the documented greppable finding, and every subsequent check skipped).
- Added a null/non-object guard to **checkConfig** and a twin to **checkPackaging** — `cfg === null || typeof cfg !== "object" || Array.isArray(cfg)` → `err(\`${rel}: not a JSON object\`); return;` — placed between the `JSON.parse` and the deref, so a null/array/primitive parse result becomes a finding and a nonzero exit.
- Added two null-literal regression cases to `validate.test.sh` (a `null` `factory.config.json` and a `null` `.claude-plugin/plugin.json`), each asserting the validator exits nonzero, emits the `not a JSON object` finding, and prints NO `TypeError` / stack trace.
- Proved the no-fabrication contract: with the Task-1 guards stripped (throwaway copy), both inputs produce a `TypeError` and NO finding — both new checks would FAIL — so they are genuine RED-before / GREEN-after gates.

## Task Commits

Each task was committed atomically:

1. **Task 1: null/non-object guard in checkConfig + checkPackaging** - `26b5bd5` (fix)
2. **Task 2: null-literal regression cases for config + plugin** - `f76068e` (test)

**Plan metadata:** (final docs commit — this SUMMARY + STATE.md + ROADMAP.md)

## Files Created/Modified
- `scripts/validate-agent-factory.mjs` - Added the null/non-object guard after `JSON.parse(raw)` in both `checkConfig` (before the `mode/cadence/autonomy` loop) and `checkPackaging` (before the `manifest.name` check). Emits `${rel}: not a JSON object` and returns before any deref. No other logic touched — the two-root split, kit*/state* helpers, the C3 unset-kit guard, and the two-tier render are unchanged. Still stdlib-only; no package.json.
- `scripts/validate.test.sh` - Appended section (g) with two hermetic null-literal checks after the three-way parity block and before the Result block. Each builds a kit tree under `$WORK` from `$FIX/good`, corrupts one file to the literal `null`, and asserts nonzero exit + `not a JSON object` finding + NO `TypeError` / `at Object.<anonymous>`.

## Decisions Made
- **Guard message** uses the greppable literal `${rel}: not a JSON object`, deliberately consistent with the adjacent `${rel}: not valid JSON` and `${rel}: present but unreadable` finding style (the verification `missing:` bullets specified this wording).
- **Guard predicate** is `cfg === null || typeof cfg !== "object" || Array.isArray(cfg)`. Beyond `null`, it fails-closed an array literal (`typeof [] === "object"`, so the `Array.isArray` clause is the catch) and any primitive — all are structurally wrong inputs that lack usable keys.
- **Hermetic fixtures**: the two regression kit trees are built under `$WORK=$(mktemp -d)` via `cp -R` from `$FIX/good` (trap-cleaned). No new fixture trees are committed; `git status` is clean after a run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `mkdir -p` before `cp -R … <dest>/agent-factory` in both new test checks**
- **Found during:** Task 2 (null-literal regression cases)
- **Issue:** The plan's modeled build did `cp -R -- "$FIX/good/agent-factory" "$NULLCFG_KIT/agent-factory"` without first creating the `$NULLCFG_KIT` parent directory. Unlike the existing split-fixture block (which `mkdir -p`s its roots at lines 153-155), `cp` errored with `No such file or directory`, the kit tree was never built, and the first new check FAILed (suite exited 1).
- **Fix:** Added `mkdir -p "$NULLCFG_KIT"` and `mkdir -p "$NULLPLG_KIT"` before the `cp -R` of each kit, matching the existing split-fixture pattern.
- **Files modified:** scripts/validate.test.sh
- **Verification:** Full suite green (exit 0) with both new checks PASS; re-confirmed RED when guards stripped.
- **Committed in:** f76068e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was a mechanical prerequisite for the modeled `cp -R` to run inside a fresh `$WORK`. No scope change — the two checks assert exactly what the plan specified.

## Issues Encountered
- None beyond the `mkdir -p` deviation above. The RED reproduction (both null inputs crashing with a `TypeError` and `exit=0` shown by the piped `head`, while the node process itself exits nonzero) matched the plan's diagnosis exactly. The fix and the regression gates behaved as designed on the first guarded run.

## User Setup Required
None - no external service configuration required. The validator stays stdlib-only (node:fs / node:path / node:url), read-only, and creates no package.json.

## Next Phase Readiness
- CR-03 closed: the last of the three Phase-09 verification blockers (09-05 closed CR-01 + CR-02; this plan closes CR-03). The validator's fail-closed invariant now holds for the null-literal / non-object case.
- Phase 09 is ready for re-verification (`/gsd-verify-phase 9`). All three regression harnesses for the validator are green; the existing 16+ checks are unaffected by the guards.

## Self-Check: PASSED

- SUMMARY.md present at `.planning/phases/09-doctor-two-root-validator/09-06-SUMMARY.md`
- Task 1 commit `26b5bd5` exists (fix — validator guard)
- Task 2 commit `f76068e` exists (test — regression cases)
- `node --check scripts/validate-agent-factory.mjs` → OK; `sh -n scripts/validate.test.sh` → OK; `sh scripts/validate.test.sh` → ALL CHECKS PASSED (exit 0)
- No package.json created; no untracked files; no unexpected deletions

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*
