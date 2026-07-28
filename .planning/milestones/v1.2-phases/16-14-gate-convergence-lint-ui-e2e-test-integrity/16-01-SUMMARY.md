---
phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity
plan: 01
subsystem: kit-shipped-runnable / test-integrity gate
tags: [tooling, typescript, vitest, gate, test-integrity, security]
requires:
  - "scripts/runnable-ref/reference-check.ts (TOOL-02 contract reference, Phase 15)"
  - "install/install.ts materializeRunnable() + RUNNABLES seam (Phase 15)"
  - "scripts/freshness.ts (OUTPUT_DIRS watches scripts/** + install/**)"
provides:
  - "scripts/runnable-ref/test-skip-integrity.js — the committed, node:builtins-only test-integrity checker (exit 0/1/2)"
  - "the .grugops/test-skips.md registry FORMAT (D-03 columns + D-04 closed-list categories), embodied in the checker's parser and the four fixtures"
  - "tools/grugops/test-skip-integrity.js materialization (one RUNNABLES tuple in install.ts)"
affects:
  - "Plan 16-03 (the 05-pr-quality-gate.md test-integrity step that invokes this checker)"
tech-stack:
  added: []
  patterns:
    - "kit-shipped-runnable D-12 contract (exit 0/1/2 + clear-voice stdout + --json)"
    - "node:builtins-only markdown-table parse (String.split, no markdown library — D-03)"
    - "RED-fixture Vitest harness spawning the committed .js (host-emulation in a bare temp dir)"
key-files:
  created:
    - "scripts/runnable-ref/test-skip-integrity.ts"
    - "scripts/runnable-ref/test-skip-integrity.js"
    - "scripts/runnable-ref/test-skip-integrity.test.ts"
    - "scripts/runnable-ref/fixtures/clean-test-skips.md"
    - "scripts/runnable-ref/fixtures/hollow-test-skips.md"
    - "scripts/runnable-ref/fixtures/expired-test-skips.md"
    - "scripts/runnable-ref/fixtures/quarantine-test-skips.md"
  modified:
    - "install/install.ts"
    - "install/install.js"
decisions:
  - "Added a dedicated missing-skip-count Vitest case (UNKNOWN - verify → exit 1) on top of the plan's eight cases — proves the T-16-01-03 / D-14 mitigation the plan's <behavior> block requires (Rule 2 hardening, not a deviation in intent)."
  - "Registry parser identifies the header by a /test\\s*id/i match on the first cell and skips |---| separator rows, so a leading title line or blank lines in the .md never feed a phantom data row."
  - "Expiry parse is strict YYYY-MM-DD with a Date round-trip (rejects 2024-13-40); an expired-but-well-formed row blocks (D-05) and does NOT count toward valid justifications."
metrics:
  duration: ~4m
  tasks: 3
  files: 9
  completed: "2026-06-14"
---

# Phase 16 Plan 01: Test-Integrity Checker Summary

The un-cheatable test-integrity checker — the second kit-shipped runnable — built as a node:builtins-only near-clone of `reference-check.ts` that validates grugops's own justification registry (format + expiry + count) and is proven by a RED-fixture Vitest harness whose "hollow" case (placeholder owner → exit 1) is the SC3 keystone.

## What Was Built

- **`test-skip-integrity.ts` (Task 1)** — a `node:fs`-only checker speaking the D-12 contract (exit `0` pass / `1` findings / `2` error; clear-voice stdout; optional `--json`). It parses the `.grugops/test-skips.md` markdown table with plain `String.split` (no markdown library, D-03), validates each row (placeholder/blank Owner, off-list Category, empty Test ID or Ticket/REQ, or unparseable/past Expiry → invalid), counts VALID (well-formed + unexpired) justifications, and compares a `--skip-count <N>` against that count. Missing/non-integer skip count emits `UNKNOWN - verify` → exit 1 (never a silent zero, D-14). A `--today YYYY-MM-DD` testing affordance is documented; the gate path uses the real wall-clock date.
- **Four D-03 fixtures (Task 1)** — `clean-test-skips.md` (GREEN: 3 well-formed rows incl. a `flaky-quarantine` row, far-future expiries), `hollow-test-skips.md` (RED/SC3: placeholder owner `agent`), `expired-test-skips.md` (far-past `2000-01-01` Expiry), `quarantine-test-skips.md` (valid unexpired flaky-quarantine). Far-past/far-future dates keep the `today` comparison non-boundary-flaky (Pitfall 4).
- **`test-skip-integrity.test.ts` + committed `.js` (Task 2)** — a Vitest harness cloned from `reference-check.test.ts`, spawning the COMMITTED `.js` via `spawnSync`. Nine cases: clean (exit 0), hollow (SC3, exit 1), expired (exit 1 even with balanced count), quarantine (exit 0, non-blocking lane), over-count (exit 1), missing-path (exit 2), missing-skip-count (UNKNOWN → exit 1), `--json` block, and host-emulation (run from a bare temp dir with no `node_modules`).
- **One RUNNABLES tuple in `install.ts` + rebuilt `install.js` (Task 3)** — appends `["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"]`; `materializeRunnable()` (additive/idempotent/never-overwrite/DRY_RUN) is unchanged.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| SC3 keystone | `vitest run …test-skip-integrity.test.ts -t "hollow"` | exit 0 (pass) |
| Full checker suite | `vitest run …test-skip-integrity.test.ts` | 9/9 pass |
| Reference suite undisturbed (Pitfall 1) | `vitest run …reference-check.test.ts` | pass |
| Direct CLI: clean `--skip-count 1` | `node …test-skip-integrity.js clean… --skip-count 1` | exit 0, "No findings." |
| Direct CLI: hollow `--skip-count 1` | `node …test-skip-integrity.js hollow… --skip-count 1` | exit 1 |
| Direct CLI: missing path | `node …test-skip-integrity.js nope.md` | exit 2 |
| No `§14` literal | `grep -c '§14' …test-skip-integrity.ts` | 0 |
| node:builtins only | import scan | only `node:fs` |
| Freshness | `npm run freshness` | all 10 committed .js fresh |
| Full suite | `npm test` | 112 passed, 1 skipped |

The 1 skipped test is the pre-existing intentional D-08 retired-parity skip in `install.test.ts`; not introduced by this plan.

## Deviations from Plan

### Auto-added Functionality

**1. [Rule 2 - Missing critical functionality] Explicit missing-skip-count test case**
- **Found during:** Task 2
- **Issue:** The plan listed eight harness cases but the `<behavior>` block and threat T-16-01-03 (D-14) require proving that an absent/non-integer skip count emits `UNKNOWN - verify` and exits 1 (never a silent pass). The checker already implements this; the harness needed a case to lock it.
- **Fix:** Added a ninth case `it("exits 1 when no skip count is provided …")` asserting exit 1 + `UNKNOWN - verify` in stdout.
- **Files modified:** `scripts/runnable-ref/test-skip-integrity.test.ts`
- **Commit:** 2563fe4

No other deviations — the checker is a faithful near-clone of `reference-check.ts`, the installer change is exactly one tuple, and the reference suite was not touched.

## Authentication Gates

None.

## Threat Surface Scan

No new security-relevant surface beyond the plan's `<threat_model>`. The checker reads exactly the one path it is handed (no glob, no shell, no eval) and fails closed on missing/unreadable input (exit 2) — matching T-16-01-04/T-16-01-05. No package was installed (T-16-01-SC).

## Known Stubs

None. The checker is fully wired; the registry format is embodied in the parser and the four fixtures. Note: the `05-pr-quality-gate.md` gate step that *invokes* this checker is Plan 16-03's scope (declared in the `affects` frontmatter), not a stub of this plan.

## Self-Check: PASSED

All nine created files exist on disk and all three task commits (`cab0841`, `2563fe4`, `31bc48e`) are present in git history.
