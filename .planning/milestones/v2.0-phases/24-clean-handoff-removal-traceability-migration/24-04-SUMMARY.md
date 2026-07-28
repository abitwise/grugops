---
phase: 24-clean-handoff-removal-traceability-migration
plan: 04
subsystem: infra
tags: [installer, typescript, migration, backup, never-delete-first, dry-run]

# Dependency graph
requires:
  - phase: 17-install-migrate-update
    provides: "the --migrate orchestration + never-delete-first primitives (isoStamp, GRUGOPS_BACKUP_SUFFIX, backupIfDiffers)"
provides:
  - "install.ts --migrate now backs up a user's runtime plans/handoffs/ → plans/handoffs.bak.<ISO> (never-delete-first, abort on collision, no content conversion, DRY_RUN/idempotent)"
  - "seedState no longer creates plans/handoffs/ on fresh installs (MIGR-02 install half)"
  - "install.ts is now single-owner for Phase 24 — the atomic-deletion plan 24-05 never re-touches it"
affects: [24-05, install, migration-rollback]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Never-delete-first backup with collision guard (backupDir: rename-to-backup, abort on .bak.<ISO> collision, DRY_RUN-safe, idempotent no-op when absent)"
    - "Deterministic clock pinning in a spawnSync test via a throwaway ESM wrapper that stubs Date.prototype.toISOString before importing the committed installer"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/README.md

key-decisions:
  - "D-17 reconcile: folded the handoffs-backup into the EXISTING --migrate orchestration (one migrateHandoffs() call before the isMigrated early-exit) — fires on every --migrate path, no colliding new flag"
  - "Removed plans/handoffs from the doctor refs set in lockstep with the seed-mkdir removal so --check still passes a clean install (Rule 3 blocking cross-effect of MIGR-02)"
  - "Never-clobber test pins the clock via an ESM wrapper (not -e/-- which drops --yes) to force the exact-name backup collision deterministically"

patterns-established:
  - "backupDir: the no-replacement sibling of backupIfDiffers — relocates a directory without content conversion (D-19), aborts rather than overwrite an existing backup (D-18)"

requirements-completed: [MIGR-04, MIGR-02]

# Metrics
duration: 6min
completed: 2026-06-22
status: complete
---

# Phase 24 Plan 04: install --migrate handoffs-backup + seed-mkdir removal Summary

**install.ts --migrate now renames a user's runtime plans/handoffs/ aside to plans/handoffs.bak.<ISO> (never-delete-first, abort-on-collision, no content conversion, DRY_RUN/idempotent), and fresh installs no longer seed the plans/handoffs/ dir at all.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-22T20:45:16Z
- **Completed:** 2026-06-22T20:51:04Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `backupDir` + `migrateHandoffs` to install.ts: a never-delete-first directory backup with no `replacement` arg (D-19 no content conversion), an abort-without-clobber path on a `.bak.<ISO>` name collision (D-18), and a clean DRY_RUN/idempotent no-op when the dir is absent (D-20).
- Folded the handoffs-backup into the EXISTING `--migrate` orchestration (D-17) — one `migrateHandoffs()` call before the `isMigrated` early-exit, so it runs on every `--migrate` path (already-two-root, old-layout, and clean fall-through); `grep -c '=== "--migrate"'` stays exactly 1 (no colliding flag).
- Removed the `seedState` `plans/handoffs/` mkdir so fresh installs never recreate the dir (MIGR-02 install half), and dropped the stale `plans/handoffs` entry from the doctor refs set in lockstep so `--check` still passes a clean install.
- Inverted the two-root seed test (now asserts `plans/handoffs/` is NOT created), added 4 new MIGR-04 cases (backup, idempotent no-op, DRY_RUN would-backup, never-clobber collision-abort), and documented the `.bak.<ISO>` + `git revert` lossless rollback in install/README.md.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fold the plans/handoffs/ backup into --migrate + remove the seedState mkdir (install.ts)** - `76de2a0` (feat)
2. **Task 2: Invert the seed assertion + add the 4 D-18/D-20 migrate cases + document the rollback** - `3d3af3f` (test)

_Plan metadata commit follows this summary._

## Files Created/Modified
- `install/install.ts` - Added `backupDir` (never-delete-first dir backup, no content conversion, collision-abort) + `migrateHandoffs`; wired into the `--migrate` branch; removed the `seedState` `plans/handoffs/` mkdir; removed the `plans/handoffs` doctor ref.
- `install/install.js` - Committed faithful `tsc` rebuild of install.ts (freshness 0 drift).
- `install/install.test.ts` - Inverted the seed assertion; 4 new MIGR-04 handoffs-backup cases; `handoffsBackupGlob` helper.
- `install/README.md` - Documented the `plans/handoffs` backup behavior + the `.bak.<ISO>` and `git revert` lossless rollback; dropped 2 stale `plans/handoffs/`-is-seeded mentions.

## Decisions Made
- **D-17 reconcile (handoffs-backup placement):** put a single `migrateHandoffs()` call at the top of the `MIGRATE` branch, before the `isMigrated` early-exit, rather than duplicating it per-arm. This guarantees the backup fires on every `--migrate` path (already-migrated repos can also carry an accumulated `plans/handoffs/`) while keeping exactly one `--migrate` parse.
- **Doctor ref removal (Rule 3):** removing the seed mkdir would have made the doctor's `refs` array (which asserted `plans/handoffs` exists) FAIL every clean `--check`. Removed that ref in the same change to keep `--check` green — a blocking cross-effect of MIGR-02, fixed inline.
- **Never-clobber test clock pinning:** `node -e <script> -- --yes --migrate` drops `--yes` from `argv.slice(2)`, so used a throwaway ESM wrapper file that stubs `Date.prototype.toISOString` then imports the committed `install.js`, preserving correct argv and making the exact-name collision deterministic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the `plans/handoffs` entry from the doctor refs set**
- **Found during:** Task 1 (seedState mkdir removal)
- **Issue:** The `--check` doctor's ordered first-failure `refs` array (install.ts ~line 359) asserted `join(TARGET, "plans", "handoffs")` exists. Once the seed mkdir was removed, a fresh install no longer creates that dir, so the existing test `doctor: a good split install → --check exits 0` would FAIL.
- **Fix:** Removed the `[join(TARGET, "plans", "handoffs"), adapterFile]` entry from the doctor refs array (replaced with an explanatory comment), in lockstep with the seedState removal.
- **Files modified:** install/install.ts
- **Verification:** `doctor: a good split install → --check exits 0` test passes; full install suite green; freshness 0 drift.
- **Committed in:** `76de2a0` (Task 1 commit)

**2. [Rule 1 - Bug] Corrected stale README descriptions of the seeded state plane**
- **Found during:** Task 2 (README rollback documentation)
- **Issue:** Two README lines (the two-root overview and the "what install does" list) described the seeded per-repo state as including `plans/handoffs/` — now incorrect after MIGR-02.
- **Fix:** Removed the `incl. plans/handoffs/` clauses from both lines so the docs match the new behavior.
- **Files modified:** install/README.md
- **Verification:** Manual read; the only remaining `plans/handoffs/` README mentions are the new `--migrate` backup behavior + rollback docs.
- **Committed in:** `3d3af3f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes are correctness requirements directly caused by this plan's MIGR-02 change (the doctor would otherwise fail every clean install; the README would otherwise be wrong). No scope creep — both stay within install.ts/install.test.ts/README.md, the plan's owned files.

## Issues Encountered
- The first never-clobber test draft used `node -e <script> -- --yes --migrate`, which drops `--yes` from `argv.slice(2)` (the eval placeholder occupies argv[1]). Verified the argv shape with a probe, then switched to a throwaway ESM wrapper file so argv is correct and the clock is pinned deterministically. Resolved before commit; the test passes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- install.ts is now single-owner for Phase 24: plan 24-05 (the atomic handoff-template/fixture deletion + check-kit-refs Assertion-2 flip) does NOT need to touch install.ts.
- MIGR-04 (the `--migrate` data migration) and the install half of MIGR-02 (no seed mkdir) are complete and green; the committed install.js is fresh.
- No blockers.

---
*Phase: 24-clean-handoff-removal-traceability-migration*
*Completed: 2026-06-22*

## Self-Check: PASSED
- install/install.ts, install/install.js, install/install.test.ts, install/README.md modified and committed.
- Commits 76de2a0 (Task 1) + 3d3af3f (Task 2) present in git history.
