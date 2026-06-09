---
phase: 10-sdlc-coverage-audit-foundation-guards
plan: 04
subsystem: testing
tags: [validator, enum-check, zero-config, lenient-when-absent, tint-03, asvs, byte-identity]

# Dependency graph
requires:
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "10-03 seeded the 8 new config-dial keys + their LOCKED lean defaults across both byte-identical JSON config files — the schema this validator now enum-recognizes"
provides:
  - "checkConfig() extended with ACTIVE-WHEN-PRESENT / LENIENT-WHEN-ABSENT enum recognition of all 8 v1.2 dial keys (D-14): bdd; quality.tdd/ui_e2e/test_integrity/gate_enforcement; security.asvs_level/block_on"
  - "quality.lint shape-checked as { strict:bool, autofix:bool } (D-12), not enum-checked"
  - "test_integrity enum is warn|block only — disabling is mechanically rejected (TINT-03 carve-out)"
  - "An invalid PRESENT value is err() (always nonzero, even bare); a MISSING key is its lean default (no error) — preserves SC4 zero-config"
  - "validate.test.sh proves the gate fails red on an invalid enum + names the key, passes when the 8 keys are absent (SC4), and asserts the two config JSONs are byte-identical (cmp -s)"
affects: [phase-12-bdd-tdd, phase-14-security-asvs, phase-15-gate-convergence]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-contract config validation in one function: a required-and-string loop (mode/cadence/autonomy) sits alongside a presence-guarded optional-and-enum block (the 8 new keys) — recognized when present, lean-defaulted when absent"
    - "Enum maps as small const lookup tables (ENUMS/Q_ENUMS/SEC_ENUMS) iterated with `if (key in obj)` guards — never the unconditional required loop"
    - "Hermetic enum fail-proof: mktemp -d a kit copy from fixtures/good, mutate ONE config key via node -e, run the validator over the copy, assert nonzero + the key name — no committed bad-fixture dir (RESEARCH Open Question 2)"

key-files:
  created: []
  modified:
    - scripts/validate-agent-factory.mjs
    - scripts/validate.test.sh

key-decisions:
  - "Carve-out comments reworded so no literal `test_integrity ... \"off\"` adjacency survives in the source — honors the plan's acceptance grep (grep -nE 'test_integrity.*\"off\"' returns nothing) while keeping the TINT-03 documentation honest and clear-voice"
  - "Reused the existing hermetic $WORK / expect_pass / cmp -s machinery; the absent-keys-pass assertion reuses expect_pass over the UNMODIFIED fixtures/good (which carries none of the 8 keys)"
  - "Byte-identity cmp -s anchored to $REPO_ROOT absolute paths (the one sanctioned real-tree read), so the assertion holds regardless of CWD"

patterns-established:
  - "Active-when-present / lenient-when-absent enum recognition (D-14): the validator recognizes a dial key when present (invalid value = error) but treats absence as the lean default (never an error) — the canonical shape for every future dial key"

requirements-completed: [SDLC-03]

# Metrics
duration: 6min
completed: 2026-06-09
---

# Phase 10 Plan 04: Validator Enum-Recognition of the 8 New Dial Keys Summary

**The validator's checkConfig() now enum-recognizes all 8 v1.2 dial keys active-when-present / lenient-when-absent (D-14) — an invalid present value errors and names the key, a missing key is its lean default (SC4 preserved), test_integrity rejects "off" (TINT-03), and validate.test.sh proves all three contracts plus cmp -s config byte-identity.**

## Performance

- **Duration:** ~6 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended `checkConfig()` (Check 4) with a presence-guarded optional-enum block covering all 8 new keys: top-level `bdd` (off|lean|strict); `quality.tdd` (off|encouraged|required), `quality.ui_e2e` (off|ui-or-critical-path|always), `quality.test_integrity` (warn|block), `quality.gate_enforcement` (advisory|blocking); `security.asvs_level` (L1|L2|L3), `security.block_on` (none|low|medium|high). `quality.lint` is shape-checked as `{strict:bool, autofix:bool}`, not enum-checked.
- Every check is `if (key in obj)`-guarded, so a config missing the keys (or a zero-config user) still passes — SC4 preserved mechanically. Each `quality.*`/`security.*` block is additionally gated on the parent being a non-null, non-array object (reuses the existing fail-closed null-guard's protection).
- Made the TINT-03 carve-out mechanical: `test_integrity`'s enum is `["warn","block"]` only, so `test_integrity: "off"` is rejected (a config trying to disable trace-integrity fails red). Invalid enum is always `err()` (nonzero even without `--strict`), never `warn()`.
- Added three hermetic assertions to `validate.test.sh`: (1) `security.asvs_level: "L4"` fails red + names `asvs_level`; (2) `quality.test_integrity: "off"` fails red + names `test_integrity` (TINT-03); (3) `fixtures/good` (none of the 8 keys) still exits 0 (SC4); plus a `cmp -s` byte-identity assertion over the real `config/` vs `seed/.grugops/` JSONs. Harness ships GREEN.
- Updated the file-header doc comment (the spec) to describe the new optional-enum keys honestly; kept the stdlib-only / read-only / no-`package.json` invariants unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend checkConfig() with active-when-present / lenient-when-absent enum checks** - `7a1b81f` (feat)
2. **Task 2: Extend validate.test.sh with invalid-enum, absent-keys-pass, and byte-identity assertions** - `23b6be1` (test)

_Task 1 carried `tdd="true"`: the RED state was confirmed (the pre-edit validator does not name `asvs_level` on an `L4` fixture) before the GREEN implementation. The MVP+TDD runtime gate was not active (config `tdd_mode: false`, no MVP_MODE passed), so RED/GREEN were proven via probes rather than separate test→feat commits — the test artifact (the three new assertions) lands in Task 2 by plan design._

## Files Created/Modified
- `scripts/validate-agent-factory.mjs` - Check 4 (`checkConfig()`) extended with the optional-enum block (`ENUMS`/`Q_ENUMS`/`SEC_ENUMS` maps, presence-guarded top-level `bdd` / `quality.*` / `security.*` checks, `quality.lint` shape-check); header doc comment updated for the 8 keys + TINT-03
- `scripts/validate.test.sh` - section (h): hermetic invalid-enum fail-proof (`asvs_level: "L4"` + `test_integrity: "off"`), absent-keys-pass (SC4) via `expect_pass` over `fixtures/good`, and a `cmp -s` config-JSON byte-identity assertion over the real tree

## Decisions Made
- **Reword carve-out comments to satisfy the acceptance grep.** The plan's acceptance criterion requires `grep -nE 'test_integrity.*"off"' scripts/validate-agent-factory.mjs` to return nothing. My first-pass comments documented TINT-03 with the literal phrase `test_integrity ... "off"`, which tripped the grep. I reworded every comment to "the trace-integrity enum is warn|block — disabling is excluded" (and the enum's trailing comment to "disabling EXCLUDED — TINT-03 carve-out"), keeping the documentation honest and clear-voiced while honoring the literal contract. This is a contract-driven refinement, not a deviation.
- **Hermetic enum fixtures over a committed bad-fixture dir** (RESEARCH Open Question 2): each invalid-enum case is built with `mktemp -d` + `cp -R` from `fixtures/good` and one `node -e` config mutation, matching the repo's newer null-literal/split pattern; a guard assertion proves `scripts/fixtures/bad-config-bad-asvs` was NOT committed.
- **Byte-identity assertion uses `$REPO_ROOT` absolute paths** so the one sanctioned real-tree read resolves regardless of CWD; complements the same `cmp -s` guard added to the foundation-guards harness in Plan 10-02 (two gates catch a JSON/JSON drift).

## Deviations from Plan

None - plan executed exactly as written. (The carve-out comment rewording above is a refinement required to satisfy a stated acceptance criterion, not unplanned work; no deviation rule was invoked.)

## Issues Encountered
- The honest TINT-03 carve-out comments initially contained the literal `test_integrity ... "off"` adjacency, failing the plan's `grep -nE 'test_integrity.*"off"'` acceptance check. Resolved by rewording the comments and the enum's trailing comment so the literal pattern no longer appears in source, while the enum array (`["warn","block"]`) — the actual safety mechanism — still excludes `off`. Re-verified: the grep is clean and the `off` fixture is still rejected with the `test_integrity` finding named.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SC3 is now fully closed: Plan 10-03 delivered the schema + lean-default contract; this plan delivered the validator-recognition half (D-14 active-when-present / lenient-when-absent). Phases 12 (BDD/TDD), 14 (security/ASVS), and 15 (gate convergence) can each wire behavior into a key that already exists with a lean default, an enterprise escalation, AND a mechanical enum guard that rejects illegal values.
- SC4 is locked mechanically: the absent-keys-pass assertion proves a config without the 8 keys (and zero-config with no file) still exits 0.
- TINT-03 is enforced: `test_integrity: "off"` is rejected by the enum, proven by the harness `off` case.
- Full regression suite GREEN: `node scripts/validate-agent-factory.mjs` (real tree), `sh scripts/check-foundation-guards.test.sh`, `sh scripts/validate.test.sh`, `sh scripts/check-kit-refs.sh` all exit 0. No blockers.

## Self-Check: PASSED

All claimed files exist and both task commits are present in git history (verified below).

---
*Phase: 10-sdlc-coverage-audit-foundation-guards*
*Completed: 2026-06-09*
