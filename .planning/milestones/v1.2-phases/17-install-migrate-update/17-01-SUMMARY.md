---
phase: 17-install-migrate-update
plan: 01
subsystem: install-tooling
tags: [installer, typescript, backup, migrate, update, tdd, wave-0]
requires:
  - install/install.ts (single TypeScript installer, Phase 15)
  - install/install.test.ts (TOOL-01 Vitest harness, Phase 15)
  - scripts/freshness.ts (committed-.js drift gate, Phase 15)
provides:
  - "isoStamp(): filesystem-safe millisecond ISO timestamp (no colon)"
  - "dirsSameContent(): recursive byte-equality, fail-safe-to-differs"
  - "backupIfDiffers(): single rename-to-backup primitive, differs-only no-op, DRY_RUN-safe"
  - "copyKit(retainBackup): retain-the-displaced-kit-as-backup parameter (default unchanged)"
  - "3 recognized flags: --migrate / --update / --prune-old-kit (recognized, not yet wired)"
  - "makeOldLayoutFixture(): the v1.0 migrate-FROM fixture helper (symlink + rootConfig variants)"
affects:
  - install/install.ts
  - install/install.js
  - install/install.test.ts
tech-stack:
  added: []
  patterns:
    - "RED-then-GREEN TDD: failing flag-recognition + presence cases land before the helpers"
    - "single-source backup primitives so Plans 02/03 do not re-invent timestamp/backup logic (no drift)"
    - "never-delete-first: rename-to-backup; deletion stays behind the (still-unwired) --prune-old-kit"
    - "differs-only no-op guard (D-09): a byte-identical re-copy leaves no backup artifact"
    - "clear professional voice on every backup/report string (safety surface, CLAUDE.md)"
key-files:
  created:
    - .planning/phases/17-install-migrate-update/17-01-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
decisions:
  - "D-13 honored: NO install.sh — the modes are flags on the single TS installer; install.js stays fresh via the freshness gate"
  - "Flags recognized only (NOT wired into a branch) — Plans 02/03 own the mode behavior; any other unknown arg still exits 2 (T-17-01-AP)"
  - "copyKit default path (retainBackup=false) is behaviorally unchanged — proven by the baseline idempotency + two-root cases staying green"
  - "makeOldLayoutFixture plants config at BOTH the v1.0 in-repo location and (opt-in) the CONTEXT D-04 repo-root location — Plan 02 handles both (RESEARCH D-04 discrepancy left unresolved by design)"
metrics:
  duration: 9m
  completed: 2026-06-15
  tasks: 2
  files: 3
---

# Phase 17 Plan 01: Install --migrate / --update Wave-0 Foundation Summary

The Wave-0 keystone for `--migrate` (Plan 02) and `--update` (Plan 03): the three recognized mode flags, the single shared `backupIfDiffers()` / `isoStamp()` / `dirsSameContent()` backup primitives, the `copyKit(retainBackup)` parameter (default path unchanged), and the one genuinely new test helper `makeOldLayoutFixture()` — all landed RED-harness-first with the committed `install.js` rebuilt and freshness-green.

## What Was Built

**Task 1 — flag recognition + backup helpers (RED-then-GREEN):**
- Three boolean flag vars (`MIGRATE`, `UPDATE`, `PRUNE_OLD_KIT`) plus arg-parse cases for `--migrate` / `--update` / `--prune-old-kit`, inserted BEFORE the unknown-arg `process.exit(2)` branch so the three are recognized while any other unknown arg still exits 2.
- `isoStamp()` — `new Date().toISOString().replace(/:/g, "-")`, a filesystem-safe (no colon), millisecond-precision timestamp (D-08).
- `dirsSameContent(a, b)` — recursive byte-equality over the sorted relative file set; fail-safe-to-differs (any read error, missing tree, set mismatch, or symlink → `false`), so a true no-op is declared ONLY when provably identical.
- `backupIfDiffers(target, replacement, label)` — returns `false` if `target` is absent; reports `skipped (identical — no backup, D-09)` and returns `false` when byte-identical; otherwise renames `target` → `${target}.bak.<ISO>`, reports `backed-up`, returns `true`. DRY_RUN reports a `would-backup` line and mutates nothing.
- The flags are recognized only — NOT wired into any branch (Plans 02/03 own that).

**Task 2 — copyKit(retainBackup) + makeOldLayoutFixture() (RED-by-design):**
- `copyKit()` → `copyKit(retainBackup = false)`. The default path (install) deletes the displaced kit after the atomic swap, exactly as before (regression-safe). With `retainBackup=true` AND the displaced kit differing from the freshly staged kit (`dirsSameContent` after the swap), the displaced kit is renamed to `${KIT_ROOT}.bak.<ISO>` instead of deleted (D-06/D-09). True atomicity is preserved on both paths; the retain path reuses the shared helpers (no fork). Call site updated to `copyKit(false)`.
- `makeOldLayoutFixture(opts?: { symlink?, rootConfig? })` — the v1.0 migrate-FROM shape: in-repo vendored `agent-factory/` (roles/config/workflows), repo-relative `.claude` adapters with NO `grugops:materialized-kit` block, and NO `.grugops/install.json` marker. `rootConfig` also plants a repo-root `factory.config.json` (CONTEXT D-04 location); `symlink` makes the orchestrator adapter a symlink into a planted `source-clone/` SENTINEL file (the Plan-02 LANDMINE case).
- A RED-by-design `it` (`migrate: old-layout fixture is shaped correctly`) proves the fixture's three D-03 signals plus both variants before Plan 02 consumes it.

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | OK (clean tsc compile) |
| `npm run freshness` | exit 0 — 10 committed .js match a fresh tsc rebuild |
| `npx vitest run install` | 24 passed / 1 skipped (the intentional D-08 retired-parity skip) |
| `npx vitest run` (full project) | 115 passed / 1 skipped |
| `function backupIfDiffers` (comment-stripped, via Node) | 1 |
| `function copyKit(retainBackup` (via Node) | 1 |
| `const isoStamp` (via Node) | 1 |
| `install.js` contains `backupIfDiffers` / `isoStamp` / `retainBackup` | true |
| baseline `idempotent` + `two-root: the shared kit is copied` | still green (default path unchanged) |

Note: the shell `grep` tool returned spurious empty results against these files in this environment; all grep-style acceptance checks were verified with Node `readFileSync` + regex, which is authoritative (and matches what the `source-presence` Vitest case asserts).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Relative symlink target resolved against the wrong base directory**
- **Found during:** Task 2 (writing `makeOldLayoutFixture`'s symlink variant).
- **Issue:** The orchestrator-adapter symlink was created with target `source-clone/orchestrator-src.md` and `cwd: .claude/agents/`. A relative symlink target resolves against the symlink's OWN directory, so it pointed at the nonexistent `.claude/agents/source-clone/...` and `readFileSync` through it threw ENOENT — the fixture-shape test's SENTINEL read failed.
- **Fix:** Changed the target to `../../source-clone/orchestrator-src.md` so it climbs back to the fixture root before descending.
- **Files modified:** install/install.test.ts
- **Commit:** 68dc704

## Known Stubs

None. The three flags are intentionally recognized-but-unwired (the documented Wave-0 contract: Plans 02/03 wire them into the `--migrate` / `--update` / `--prune-old-kit` branches). This is not a stub that blocks the plan's goal — the plan's goal is to establish the recognized flags and single-source primitives, which is achieved and proven.

## TDD Gate Compliance

Gate sequence satisfied:
- RED: `test(17-01)` — 5c1f491 (failing flag-recognition + helper-presence cases)
- GREEN: `feat(17-01)` — a4357fc (Task 1) and 68dc704 (Task 2)
No REFACTOR commit was needed (the GREEN implementations were already minimal and clean).

## Self-Check: PASSED

- Files: install/install.ts, install/install.js, install/install.test.ts — all FOUND.
- Commits: 5c1f491, a4357fc, 68dc704 — all FOUND in git log.
