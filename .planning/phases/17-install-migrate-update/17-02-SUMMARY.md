---
phase: 17-install-migrate-update
plan: 02
subsystem: install-tooling
tags: [installer, migrate, typescript, backup, symlink-safety, tdd, landmine, wave-1]
requires:
  - install/install.ts (single TypeScript installer + the run sequence, Phase 15)
  - "isoStamp() / backupIfDiffers() / copyKit(retainBackup) (Plan 17-01 Wave-0 primitives)"
  - "makeOldLayoutFixture() (Plan 17-01 migrate-FROM fixture helper)"
  - "MIGRATE flag var (recognized in Plan 17-01)"
provides:
  - "--migrate (MIGR-01): old in-repo layout → two-root, additive-then-relocate, never-delete"
  - "detectOldLayout(): D-03 classification — isOldLayout / isMigrated / isClean / leftoverKit"
  - "migratePreSteps(): config-move (both legacy locations) + in-repo-kit backup + symlink-unlink LANDMINE fix"
  - "the symlink-corruption LANDMINE fix (Pitfall 1 / T-17-02-SYM) — unlink any live symlink adapter before re-materialize"
  - "documented manual .bak-rename migrate-rollback path (README) proving SC3"
affects:
  - install/install.ts
  - install/install.js
  - install/install.test.ts
  - install/uninstall.ts
  - install/uninstall.js
  - install/README.md
tech-stack:
  added: []
  patterns:
    - "RED-then-GREEN TDD: 8 failing migrate cases land before detectOldLayout/migratePreSteps/branch"
    - "migrate as single-source orchestration (D-02): pre-steps then FALL THROUGH into the unchanged install run, no forked path"
    - "never-write-through-a-live-symlink: rmSync(force) any isSymlink adapter dest before materializeAdapter (Pitfall 1)"
    - "never-delete-first: displaced in-repo agent-factory/ renamed to a timestamped backup; original config left as a .bak"
    - "minimal-change uninstall: no automated migrate-rollback, no new flag — restore is the user's documented manual .bak rename"
key-files:
  created:
    - .planning/phases/17-install-migrate-update/17-02-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/uninstall.ts
    - install/uninstall.js
    - install/README.md
decisions:
  - "D-02 honored: --migrate is orchestration around the unchanged copyKit→materializeAdapter→seedState→writeMarker run; the branch only adds pre-steps + early-exit, it never forks the install sequence"
  - "D-04 config discrepancy RESOLVED as the orchestrator-ratified HANDLE-BOTH: migratePreSteps checks BOTH the v1.0 in-repo agent-factory/config/factory.config.json AND the repo-root factory.config.json, carrying whichever exists forward to .grugops/ (only if absent — never-overwrite seeded state) and leaving the original as a .bak"
  - "SC3 restore is the user's DOCUMENTED MANUAL .bak rename (README), NOT new automated uninstall logic — uninstall.ts gained only a clear-voice comment (rebuilt so it ships in a fresh .js); no new flag, no migrate-rollback code"
  - "3 RED cases adjusted to their faithful shapes during GREEN: clean-repo uses a BARE target (makeFixture plants an in-repo kit = old-layout, not clean); the kit-location config .bak travels inside the wholesale agent-factory.bak backup (step 2 renames the dir aside); CR-01 is exercised via a minimal fake GRUGOPS_SRC whose source adapter carries an unterminated marker (migrate re-materializes from SOURCE, so an unterminated marker in the target is replaced, not bounded — the bounded-removal lives in materializeAdapter reading the source)"
  - "SC3 snapshot scoped to the user-owned agent-factory/ tree: the grugops-owned .claude adapters are wiring uninstall removes by design in BOTH layouts and migrate replaces in place (not backed up), so they are not part of the restored user state"
metrics:
  duration: 26m
  completed: 2026-06-15
  tasks: 2
  files: 6
---

# Phase 17 Plan 02: Install `--migrate` (MIGR-01) Summary

`--migrate` converts an already-installed v1.0 in-repo layout to the two-root layout as
single-source orchestration around the unchanged install run (D-02): a small `detectOldLayout()`
classifier + a `migratePreSteps()` relocation step (carry the edited config forward, back up the
displaced in-repo kit, and — the HIGH-severity headline — unlink any live symlink adapter before
re-materialize so the write never corrupts the source clone) wired into a `--migrate` branch that
sits after the always-on self-checkout guard and falls through into the existing
copyKit→materializeAdapter→seedState→writeMarker sequence. All 8 RED-by-design migrate cases plus
the DRY_RUN-migrate arm are green; the symlink LANDMINE (Pitfall 1) is proven fixed; SC3 is proven
via the documented manual `.bak`-rename rollback path with a minimal-change uninstall.

## What Was Built

**Task 1 — `detectOldLayout()` + `migratePreSteps()` + the `--migrate` branch (RED→GREEN):**

- **`detectOldLayout(): OldLayout`** — D-03 classification computed from the same fail-closed
  readers the doctor uses (`readMarker` / `readAdapterKit`), so detection never throws on a garbled
  marker/adapter. Derives `isOldLayout = hasInRepoKit && marker===null && !adapterMaterialized`,
  `isMigrated = marker!==null`, `isClean = !hasInRepoKit && marker===null`, `leftoverKit = hasInRepoKit`.
- **`migratePreSteps(): void`** — runs ONLY when `isOldLayout`, three never-delete-first /
  DRY_RUN-safe steps:
  1. **config-move (D-04, BOTH legacy locations):** checks both the repo-root
     `factory.config.json` and the v1.0 in-repo `agent-factory/config/factory.config.json`; COPIES
     whichever exists to `.grugops/factory.config.json` only if that seeded target is absent
     (never-overwrite seeded state), then renames the original aside to `<original>.bak.<ISO>`.
  2. **in-repo kit backup (D-08/D-09):** `backupIfDiffers(TARGET/agent-factory, GRUGOPS_SRC/agent-factory, …)`
     renames the displaced in-repo `agent-factory/` to a timestamped, differs-only backup.
  3. **LANDMINE (Pitfall 1 / T-17-02-SYM):** for each resolver-adapter dest, if `isSymlink(dest)`,
     `rmSync(dest, {force:true})` BEFORE the install run re-materializes it — never `writeFileSync`
     through a live symlink into the source clone.
- **The `--migrate` branch** — placed AFTER the self-checkout guard + doctor early-exit, BEFORE the
  `-- kit --` block (Pitfall 4). `isMigrated` → no re-mutate (D-12), warn + hint `--prune-old-kit`
  when a leftover in-repo kit remains, else report already-migrated, exit 0. `isOldLayout` → run
  `migratePreSteps()` then FALL THROUGH into the existing install run (fresh kit from source, D-01).
  `isClean`/other → fall through to a normal fresh install (D-11). No forked install sequence (D-02).
- **8 migrate test cases + the DRY_RUN-migrate arm** in `install.test.ts`, titles matched to the
  validation map: convert, no-op, clean fall-through, half-state warn, config-survives (both
  locations), bounded marker-strip, symlink-no-corruption, plus the DRY_RUN arm.

**Task 2 — SC3 uninstall-after-migrate restore (minimal uninstall.ts) + README:**

- **`migrate: uninstall-after-migrate restores pre-migrate state`** — snapshots the user-owned
  in-repo `agent-factory/` BEFORE migrate; migrate; uninstall; then performs the EXACT documented
  manual restore (rename the `agent-factory.bak.<ISO>` backup back, restore the config `.bak` inside
  it, remove the migrate-seeded `.grugops/factory.config.json`) and asserts the restored
  `agent-factory/` snapshot equals pre-migrate with the edited config intact and the grugops wiring
  + marker fully removed.
- **uninstall.ts — minimal change:** confirmed (by reading the restore sequence) that NO automated
  migrate-rollback is required — uninstall already removes only the grugops-owned wiring + marker
  while preserving the migrate backups and seeded config (D-06). Added ONLY a clear-voice comment
  near `removeMarker()` pointing to the documented restore path; rebuilt `uninstall.js` so the
  comment ships fresh. No new flag, no rollback logic.
- **README** — a `### Migrating an existing install (--migrate)` section: what `--migrate` backs up
  (timestamped `agent-factory.bak.<ISO>` + the config `.bak`), both legacy config locations, the
  `--prune-old-kit` companion, the D-11 clean-repo fall-through, and the exact manual `.bak`-rename
  rollback steps (all local `mv`/`rm`/`node` — nothing marked `UNKNOWN - verify`).

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | OK (clean tsc compile) |
| `npm run freshness` | exit 0 — 10 committed .js match a fresh tsc rebuild |
| `npx vitest run install -t "migrate"` | 10 passed / 24 skipped (all migrate cases incl. SC3 restore) |
| `npx vitest run install -t "DRY_RUN: new modes mutate nothing"` | 1 passed (migrate arm) |
| `npx vitest run install -t "uninstall round-trip"` | 1 passed (no regression to reversal contract) |
| `npx vitest run install` | 33 passed / 1 skipped (the intentional D-08 retired-parity skip) |
| `npx vitest run` (full project) | 124 passed / 1 skipped |
| `function detectOldLayout` (comment-stripped, via Node) | 1 |
| `install.js` contains `detectOldLayout` + `migratePreSteps` | true |
| README contains `--migrate` AND `.bak` rollback steps | true |
| uninstall.ts: no new flag, no automated migrate-rollback | confirmed (only `--target` flag; `--purge-kit` is a comment mention) |

Note: per the Plan-01 note, shell `grep` returns spurious empty output against `install.ts` /
`install.js` in this environment; all grep-style acceptance checks were verified with Node
`readFileSync` + regex (authoritative), and the behavioral assertions are proven by the Vitest
cases driving the committed `.js`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Three RED-by-design test cases asserted the wrong shape; corrected to the faithful behavior during GREEN**
- **Found during:** Task 1 (running the RED cases against the GREEN implementation).
- **Issue:** (a) `migrate: clean repo falls through` used `makeFixture()`, which plants an in-repo
  `agent-factory/roles/orchestrator.md` — that is an OLD-layout shape, not a clean repo, so
  `migratePreSteps` correctly fired and backed up the kit, failing the "no backup" assertion.
  (b) `migrate: user-edited config survives` asserted the config `.bak` lands in
  `agent-factory/config/` — but step 2 renames the whole in-repo `agent-factory/` aside, so the
  kit-location config `.bak` correctly travels INSIDE `agent-factory.bak.<ISO>/config/`.
  (c) `migrate: bounded marker-strip` planted an unterminated marker in the TARGET adapter — but
  migrate re-materializes the adapter from SOURCE (`materializeAdapter` reads `GRUGOPS_SRC`, writes
  the target), so the target's content is replaced, not bounded; the CR-01 bounded-removal lives in
  `materializeAdapter` reading the source.
- **Fix:** (a) clean-repo now uses a BARE target (no `agent-factory/`); (b) the assertion checks the
  config `.bak` inside the wholesale `agent-factory.bak.*` backup (the kit-location case) and at the
  repo root (the root-location case); (c) CR-01 is now exercised via a minimal fake `GRUGOPS_SRC`
  whose orchestrator-adapter SOURCE carries an unterminated open marker + a sentinel line, asserting
  the sentinel survives the re-materialize — the faithful CR-01-through-migrate proof.
- **Files modified:** install/install.test.ts
- **Commit:** 6b05cad
- **Note:** No production-code change resulted from these — the implementation behavior was correct
  and safe (nothing is ever lost); the RED cases simply encoded the wrong expected file locations
  before the real behavior was observed. The contract (config carried forward + original preserved;
  unterminated marker loses no following lines) is fully satisfied.

**2. [Plan-discretion] SC3 snapshot scoped to the user-owned `agent-factory/` tree**
- **Found during:** Task 2 (designing the restore assertion).
- **Issue:** Exact whole-target snapshot equality with pre-migrate is not achievable because migrate
  legitimately REPLACES the `.claude` resolver adapters in place (materializeAdapter overwrites them
  without backing up the old repo-relative content) and uninstall then removes them — the same wiring
  a v1.0 uninstall would remove. The user's restorable state is `agent-factory/` + the config.
- **Fix:** The SC3 test snapshots the user-owned `agent-factory/` subtree (the content migrate backs
  up and the documented restore renames back) and asserts that subset matches pre-migrate exactly,
  plus the edited-config content survived and the grugops wiring + marker are gone. This is the
  honest, achievable SC3 proof and is documented in the test + the README restore steps.
- **Files modified:** install/install.test.ts, install/README.md
- **Commit:** a63bdbe

## Known Stubs

None. `--migrate` is fully wired (branch + pre-steps), the symlink LANDMINE is fixed and proven, and
the `--prune-old-kit` hint points at the companion flag wired in a sibling plan (Plan 17-03 owns
`--prune-old-kit` / `--update` behavior; `--migrate` only emits the hint string, which is the
documented contract). No placeholder/TODO/empty-default patterns flow to behavior.

## Threat Flags

None. The plan's `<threat_model>` enumerated the migrate surface (symlink-corruption, config/kit
loss, unbounded marker-strip, wrong-target, re-mutate no-op, EoP env var, package installs); every
`mitigate` disposition is implemented and proven by a RED-by-design case, and no NEW security-
relevant surface beyond the register was introduced (migrate only relocates files on the user's
machine and never touches the deploy-approval env var).

## TDD Gate Compliance

Gate sequence satisfied:
- RED: `test(17-02)` — e0157bd (8 failing migrate cases + the DRY_RUN-migrate arm)
- GREEN: `feat(17-02)` — 6b05cad (Task 1: detectOldLayout + migratePreSteps + branch) and
  a63bdbe (Task 2: SC3 restore + README)
No REFACTOR commit was needed (the GREEN implementations were minimal and clean).

## Self-Check: PASSED

- Files: install/install.ts, install/install.js, install/install.test.ts, install/uninstall.ts,
  install/uninstall.js, install/README.md, 17-02-SUMMARY.md — all FOUND.
- Commits: e0157bd (RED), 6b05cad (GREEN Task 1), a63bdbe (GREEN Task 2) — all FOUND in git log.
