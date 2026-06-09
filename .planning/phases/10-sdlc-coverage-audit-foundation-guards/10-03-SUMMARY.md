---
phase: 10-sdlc-coverage-audit-foundation-guards
plan: 03
subsystem: infra
tags: [config-dial, schema, json, enterprise-escalation, asvs, tdd, bdd, test-integrity]

# Dependency graph
requires:
  - phase: 10-sdlc-coverage-audit-foundation-guards
    provides: "10-02 foundation-guards aggregator incl. the cmp -s config-JSON byte-identity assertion that protects the tri-file edit"
provides:
  - "8 new config-dial keys with LOCKED lean defaults across both JSON config files: bdd (top-level), security.asvs_level, security.block_on (new security object), quality.tdd, quality.lint, quality.ui_e2e, quality.test_integrity, quality.gate_enforcement"
  - "quality.e2e_when renamed to quality.ui_e2e across every reference site (both JSON files, the .md twin, the 05-pr-quality-gate.md workflow) — zero e2e_when remaining"
  - "lean→enterprise escalation contract documented per key in the human twin (factory.config.md)"
  - "config/ and seed/ JSON kept byte-identical (cmp -s exit 0); both valid JSON"
affects: [phase-12-bdd-tdd, phase-14-security-asvs, phase-15-gate-convergence, plan-10-04-validator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config-dial keys ship as REAL schema with documented lean defaults; only the BEHAVIOR they switch is downstream (correct scoping, not scope reduction)"
    - "Tri-file atomic config edit: config/factory.config.json + seed/.grugops/factory.config.json stay byte-identical; the .md twin documents every key"
    - "lean→enterprise escalation contract as a dedicated table section in the human twin (D-11)"

key-files:
  created: []
  modified:
    - agent-factory/config/factory.config.json
    - agent-factory/seed/.grugops/factory.config.json
    - agent-factory/config/factory.config.md
    - agent-factory/workflows/05-pr-quality-gate.md

key-decisions:
  - "bdd placed top-level after autonomy; security as a new top-level object after nfr (per D-12 / RESEARCH target shape)"
  - "quality.test_integrity documented as warn|block with an explicit never-off note (TINT-03 trace-integrity safety carve-out)"
  - "Both 'lint' in mandatory_gates AND quality.lint object kept (D-13: gate-presence vs strictness, complementary not duplicate)"
  - "gate_enforcement enterprise escalation noted as already-strict-at-lean (blocking); advisory is the relaxed direction, not the escalation"

patterns-established:
  - "Config-dial contract table (lean → enterprise): key · allowed values · lean default · enterprise escalation — one row per dialable key"

requirements-completed: [SDLC-03]

# Metrics
duration: 7min
completed: 2026-06-09
---

# Phase 10 Plan 03: Config-Dial Contract & 8 New Dial Keys Summary

**Eight new config-dial keys (bdd, quality.tdd/lint/ui_e2e/test_integrity/gate_enforcement, security.asvs_level/block_on) landed atomically across both JSON configs with LOCKED lean defaults, e2e_when renamed to ui_e2e everywhere, and a per-key lean→enterprise escalation contract documented in the human twin.**

## Performance

- **Duration:** ~7 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added all 8 new dial keys with their LOCKED lean defaults to both `config/factory.config.json` and the byte-identical `seed/.grugops/factory.config.json` (D-12/D-15): top-level `bdd: "lean"`; a new top-level `security` object with `asvs_level: "L1"` and `block_on: "high"`; and `quality.tdd: "encouraged"`, `quality.lint: { strict: false, autofix: true }`, `quality.test_integrity: "warn"`, `quality.gate_enforcement: "blocking"`.
- Renamed `quality.e2e_when` → `quality.ui_e2e` (same enum) across all four reference sites — both JSON files, the `.md` twin (two sites), and the `05-pr-quality-gate.md` workflow line — leaving **zero** `e2e_when` references anywhere in the tree (T-10-03-O orphan check, D-13).
- Documented every new key in the human twin (`factory.config.md`): updated the top-level `quality` row, added top-level `bdd` + `security` rows, extended the `### quality sub-fields` table, added a new `### security sub-fields` table, and added a dedicated **"Config-dial contract (lean → enterprise)"** section with the per-key escalation contract (D-11).
- Updated the "Zero-config defaults" prose so SC4 is documented: every one of the 8 new keys degrades to its lean default when absent; a missing key is never an error.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the 8 keys to both JSON config files + rename e2e_when across all sites** - `236fc6f` (feat)
2. **Task 2: Document the 8 keys + the Enterprise escalation contract in factory.config.md** - `9799769` (docs)

## Files Created/Modified
- `agent-factory/config/factory.config.json` - 8 new keys with lean defaults; `e2e_when` → `ui_e2e` rename
- `agent-factory/seed/.grugops/factory.config.json` - byte-identical companion of the above (cmp -s exit 0)
- `agent-factory/config/factory.config.md` - human twin: 8 key rows + `### security` table + the lean→enterprise escalation contract section; zero-config prose updated for SC4
- `agent-factory/workflows/05-pr-quality-gate.md` - the 4th `e2e_when` site (step 3) renamed to `ui_e2e`, value + prose preserved

## Decisions Made
- **bdd top-level / security new object:** placed `bdd` after `autonomy` and `security` after `nfr`, matching the RESEARCH target shape (D-12). No behavior wired — Phase 10 only seeds the schema + contract.
- **test_integrity never-off:** documented `warn|block` with an explicit clear-voice note that `off` is not a valid value in any mode (TINT-03 carve-out). Mirrors the prod-deploy hook's refuse-self-set safety stance.
- **lint complementary:** kept `"lint"` in `mandatory_gates` (gate presence) AND added the `quality.lint` object (strictness) per D-13 — not a duplicate.
- **gate_enforcement escalation:** noted that `blocking` is already the strict lean default; `advisory` is the relaxed direction, so there is no "stricter" enterprise setting for this key.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed a self-introduced `e2e_when` orphan in the twin**
- **Found during:** Task 2 (documenting the `ui_e2e` row)
- **Issue:** A parenthetical I added on the new `ui_e2e` row — "(Renamed from `e2e_when`; same enum.)" — re-introduced a literal `e2e_when` string into `factory.config.md`. This violated both Task 2's acceptance (`grep -n 'e2e_when'` must return no hits) and the full-tree orphan check (T-10-03-O, D-13: zero `e2e_when` anywhere).
- **Fix:** Removed the parenthetical from the `ui_e2e` row; the `### Config-dial contract` section's `quality.ui_e2e` row already documents the enum without naming the old key.
- **Files modified:** agent-factory/config/factory.config.md
- **Verification:** `grep -rn 'e2e_when' agent-factory/ AGENTS.md` returns zero hits; foundation guards still exit 0.
- **Committed in:** `9799769` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was necessary to honor the hard "zero `e2e_when` references" contract (D-13/T-10-03-O). No scope creep.

## Issues Encountered
- Task 1's `<verify>` block runs the full-tree `e2e_when` sweep, but the two twin (`.md`) hits are intentionally Task 2's edit target. Task 1's *scoped* files (both JSON + the workflow) were confirmed clean before committing; the full-tree sweep went green only after Task 2 renamed the twin. This is a plan ordering artifact, not a defect — handled by verifying Task 1's scoped files individually before its commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The config schema now carries every dial key that later v1.2 capabilities build against: BDD/TDD (Phase 12), UI/E2E + lint + test-integrity (Phase 15 gate convergence), ASVS (Phase 14). Each can wire behavior into a key that already exists with a documented lean default and enterprise escalation.
- **Plan 10-04** (validator) is the immediate consumer: it adds active-when-present, lenient-when-absent enum recognition for these 8 keys (D-14) and enforces the `test_integrity` no-`off` carve-out mechanically. SC3's validator-recognition half is 10-04's scope; this plan delivered SC3's schema + contract half.
- No blockers. The `cmp -s` byte-identity guard (from 10-02) protects the two JSON files against future drift.

---
*Phase: 10-sdlc-coverage-audit-foundation-guards*
*Completed: 2026-06-09*
