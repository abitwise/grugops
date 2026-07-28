---
phase: 18-browsable-docs-catalog
plan: 02
subsystem: testing
tags: [typescript, vitest, freshness-gate, byte-diff, mirror-spawn, fail-closed, docs-catalog]

# Dependency graph
requires:
  - phase: 18-browsable-docs-catalog (plan 01)
    provides: "scripts/generate-catalog.ts + committed scripts/generate-catalog.js (OUT a fixed literal docs/catalog/README.md) and the committed docs/catalog/README.md (17 role rows + 16 workflow rows) the gate regenerates and byte-diffs against"
  - phase: 15-typescript-tooling-migration
    provides: "tsc-compiled committed .js + npm run freshness tsc-output drift gate that auto-covers the new committed catalog-freshness.js"
provides:
  - "scripts/catalog-freshness.ts — standalone fail-closed catalog drift gate (mirror-spawn regen + Buffer.equals byte-diff)"
  - "scripts/catalog-freshness.js — committed compiled gate driven by the test + the package.json script"
  - "scripts/catalog-freshness.test.ts — Vitest oracle: fresh / drift-RED-names-file / fail-closed-RED"
  - "package.json freshness:catalog script — a stale catalog now fails the build red on its own"
affects: [release, milestone-close, ci-gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mirror-spawn freshness gate: cpSync generator .js + kit source dirs into a mkdtempSync temp tree, spawnSync the mirrored generator so its OUT stays a fixed literal (path-traversal-safe), Buffer.equals byte-diff vs the committed artifact"
    - "Fail-closed exit discipline: a non-zero regeneration NEVER falls through to fresh; cleanup() before every process.exit"

key-files:
  created:
    - scripts/catalog-freshness.ts
    - scripts/catalog-freshness.js
    - scripts/catalog-freshness.test.ts
  modified:
    - package.json

key-decisions:
  - "Gate is STANDALONE — wired as its own freshness:catalog package.json script, NOT folded into scripts/check-foundation-guards.ts (D-07); guards file left byte-unchanged"
  - "Mirror-spawn (not OUT-override) regeneration keeps the generator's OUT a fixed literal — the gate arranges the temp mirror via cpSync (D-06 path-traversal mitigation)"
  - "Fail-closed: a broken mirrored generator (non-zero regen) ⇒ exit 1, never reporting fresh (D-07, T-18-06)"

patterns-established:
  - "Catalog drift gate mirrors the build-output drift gate (scripts/freshness.ts) retargeted from tsc .js outputs to docs/catalog/README.md content"
  - "Fail-closed RED test fixture plants a non-conforming kit file the mirrored generator rejects — and must use a non-underscore filename so the generator's D-03 _-prefix filter does not silently drop it"

requirements-completed: [DOCS-02]

# Metrics
duration: 3min
completed: 2026-06-15
---

# Phase 18 Plan 02: Catalog Freshness Gate Summary

**Standalone fail-closed catalog drift gate (`scripts/catalog-freshness.ts` → committed `.js`) that mirror-spawns the generator into a temp tree, `Buffer.equals` byte-diffs the regeneration against the committed `docs/catalog/README.md`, and exits non-zero on any drift OR a broken generator — wired as the `freshness:catalog` build script.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-15T09:45:57Z
- **Completed:** 2026-06-15T09:50Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- DOCS-02 delivered: a regenerate-to-temp / byte-diff freshness gate that catches a catalog drifting out of sync with the kit it documents — exit 0 when fresh, exit non-zero on drift OR on a broken generator (fail-closed).
- Authored the Vitest oracle test-first (RED), then built the gate that turns it green — correct Wave-0 / TDD sequencing across two atomic commits.
- The gate is standalone (`freshness:catalog` package.json script), zero new dependencies, `node:` builtins only, clear professional voice on stdout; `scripts/check-foundation-guards.ts` left byte-unchanged (D-07).
- Both compiled `.js` artifacts (`generate-catalog.js` + `catalog-freshness.js`) remain auto-covered by the existing `npm run freshness` tsc-output gate.

## Task Commits

Each task was committed atomically:

1. **Task 1: catalog-freshness.test.ts — the DOCS-02 oracle (authored first, RED)** - `b17c98d` (test)
2. **Task 2: catalog-freshness.ts — the standalone fail-closed drift gate + package.json wiring** - `b349be7` (feat; includes the Rule 1 fixture fix)

_Note: Task 2 (tdd="true") landed the implementation that turned the Task-1 RED oracle green; the fixture-bug fix rode in the same commit per the deviation rules._

## Files Created/Modified
- `scripts/catalog-freshness.ts` - Standalone fail-closed catalog drift gate: `mkdtempSync` temp mirror, `cpSync` the generator `.js` + `agent-factory/roles` + `agent-factory/workflows`, `spawnSync` the mirrored generator (OUT a fixed literal), `Buffer.equals` byte-diff vs committed `docs/catalog/README.md`, `toPosix` finding, `cleanup()` before every `process.exit`.
- `scripts/catalog-freshness.js` - Committed compiled gate (product of `tsc`); driven by the test + the `freshness:catalog` script; auto-covered by `npm run freshness`.
- `scripts/catalog-freshness.test.ts` - Vitest oracle: Test 1 fresh (exit 0 + "fresh"), Test 2 planted-drift RED (`STALE:` + `docs/catalog/README.md`, `afterEach` restore), Test 3 fail-closed RED (plant a non-conforming role → mirrored regen exits non-zero → gate never reports fresh).
- `package.json` - Added `freshness:catalog` script (`tsc --outDir .tmp-build && node scripts/catalog-freshness.js`), mirroring the existing `freshness` line; no new deps.

## Decisions Made
- Standalone gate, not folded into the foundation-guards aggregator (D-07) — kept `check-foundation-guards.ts` byte-identical (verified by git hash before/after).
- Mirror-spawn regeneration over OUT-override, keeping the generator path-traversal-safe (D-06).
- Asserted Test 3's "no success" condition against the success-only marker `matches a fresh regeneration` rather than the broader `catalog fresh`, because the fail-closed message ("Catalog **fresh**ness check FAILED…") also contains that substring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fail-closed RED fixture was silently a no-op (and the no-success assertion was too broad)**
- **Found during:** Task 2 (running the Task-1 oracle against the new gate)
- **Issue:** The Task-1 fail-closed fixture planted a bad role file named `__catalog_freshness_badrole__.md`. The generator's D-03 `_`-prefix filter (`!f.startsWith("_")`) silently drops `_`-prefixed files, so the mirrored regeneration succeeded and the gate (correctly) reported fresh — the test never exercised the fail-closed branch and went RED. Separately, the assertion `not.toContain("catalog fresh")` overlapped the fail-closed message "Catalog **fresh**ness check FAILED…", so even after the filename fix the assertion failed.
- **Fix:** Renamed the planted fixture to `zzz-catalog-freshness-badrole.md` (non-underscore, so the generator actually processes it and exits 1), and re-pointed the no-success assertion at the success-only marker `matches a fresh regeneration`. Added comments documenting both traps.
- **Files modified:** `scripts/catalog-freshness.test.ts`
- **Verification:** Confirmed empirically that the generator/gate fail-closed correctly on a non-underscore bad role (generator exit 1, gate exit 1, "refusing to report the catalog as fresh"); all 3 catalog tests then green; full suite 136 passed / 1 pre-existing skip.
- **Committed in:** `b349be7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix corrected the oracle so the fail-closed (T-18-06) behavior is genuinely proven rather than vacuously passing. The gate implementation itself matched the plan exactly — no scope creep. The verification confirmed the gate's fail-closed branch is the load-bearing correctness property and that it works.

## Issues Encountered
None beyond the Rule 1 fixture bug documented above — which, usefully, surfaced and confirmed the gate's fail-closed branch is correct (a non-underscore non-conforming kit file makes the mirrored generator exit non-zero and the gate refuses to report fresh).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DOCS-02 complete; the browsable docs catalog (DOCS-01, Plan 01) is now mechanically protected against drift by a fail-closed gate.
- Both Phase-18 plans are done; the phase is ready for `/gsd-verify-work`. The catalog is generated (DOCS-01) and its freshness is enforced (DOCS-02); both compiled `.js` artifacts are covered by `npm run freshness`.
- No blockers.

---
*Phase: 18-browsable-docs-catalog*
*Completed: 2026-06-15*

## Self-Check: PASSED

- FOUND: scripts/catalog-freshness.ts
- FOUND: scripts/catalog-freshness.js
- FOUND: scripts/catalog-freshness.test.ts
- FOUND: .planning/phases/18-browsable-docs-catalog/18-02-SUMMARY.md
- FOUND: package.json freshness:catalog script
- FOUND: commit b17c98d (Task 1, test)
- FOUND: commit b349be7 (Task 2, feat)
