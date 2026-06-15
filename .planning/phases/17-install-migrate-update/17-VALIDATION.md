---
phase: 17
slug: install-migrate-update
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `17-RESEARCH.md` → ## Validation Architecture. Task IDs are assigned by the planner; rows below are keyed by SC / requirement and appended to the existing `install/install.test.ts` harness.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `~4.1.8` (devDependency — never shipped to hosts) |
| **Config file** | `vitest.config.ts` (`defineConfig({ test: {} })`, `globals: false` → import test fns explicitly) |
| **Quick run command** | `npx vitest run install` |
| **Full suite command** | `npm test` (`vitest run`) |
| **Build/freshness gate (must pass before any commit of `.js`)** | `npm run build && npm run freshness` |
| **Estimated runtime** | ~15 seconds (install suite; spawnSync into mkdtemp fixtures) |

The harness drives the **committed `install.js` / `uninstall.js`** (NOT the `.ts`) via `spawnSync` into `mkdtempSync` fixtures, snapshots BOTH `$TARGET` and `$GRUGOPS_HOME` with the content-addressed `snapshot()` helper, and cleans up in `afterEach`. New cases reuse `makeFixture()`, `snapshot()`, `runInstall()`, `runUninstall()` and add `runInstall(target, home, "--migrate")` etc. One genuinely new helper is required: `makeOldLayoutFixture()` (vendored in-repo `agent-factory/` + repo-relative — and a symlink variant — `.claude` adapters + NO `.grugops/install.json` marker), added beside `makeFixture` (~install.test.ts:69).

---

## Sampling Rate

- **After every task commit:** `npx vitest run install` + `npm run freshness` (the committed `.js` must be fresh — non-negotiable; the harness runs the `.js`, not the `.ts`)
- **After every plan wave:** `npm test` (full suite) + `npm run freshness`
- **Before `/gsd-verify-work`:** Full suite green + freshness green
- **Max feedback latency:** ~15 seconds (install suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement / SC | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (planner) | — | — | SC1 / MIGR-01 | — | additive-then-relocate; old kit renamed to timestamped backup, never deleted | integration | `npx vitest run install -t "migrate: converts old in-repo layout to two-root"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC1 | — | re-run is a true no-op (zero new artifacts; backup count unchanged by glob, not filename) | integration | `npx vitest run install -t "migrate: a second migrate is a no-op"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC1 / D-11 | — | clean repo → falls through to fresh install (migrate is a superset) | integration | `npx vitest run install -t "migrate: clean repo falls through to fresh install"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC1 / D-12 | — | already-migrated + leftover `agent-factory/` → no-op + warn + hint `--prune-old-kit` | integration | `npx vitest run install -t "migrate: half-state no-op + warn"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC3 / D-04 | — | user-edited config survives (moved to `.grugops/`, original `.bak` retained); checks BOTH legacy locations | integration | `npx vitest run install -t "migrate: user-edited config survives"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC3 | — | uninstall-after-migrate restores pre-migrate state (documented manual `.bak` rename restore) | integration | `npx vitest run install -t "migrate: uninstall-after-migrate restores pre-migrate state"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC3 / CR-01 | — | bounded marker-strip — unterminated open marker loses no following lines | integration | `npx vitest run install -t "migrate: bounded marker-strip"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | Pitfall 1 (LANDMINE) | — | symlink `.claude` adapter migrate does NOT corrupt the source clone (RED-by-design proof) | integration | `npx vitest run install -t "migrate: symlink adapter does not corrupt source clone"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC2 / UPD-01 | — | `--update` refreshes `$GRUGOPS_HOME` in place; per-repo state UNTOUCHED | integration | `npx vitest run install -t "update: refreshes kit, leaves per-repo state untouched"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC2 / D-06 | — | `--update` retains displaced kit as a timestamped backup (reversible) | integration | `npx vitest run install -t "update: displaced kit retained as backup"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC2 / D-07 | — | `--update` on a downgrade warns (with version delta) then proceeds | integration | `npx vitest run install -t "update: downgrade warns then proceeds"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | SC2 | — | doctor names the specific unresolved path on failure (confirm NOT regressed) | integration | `npx vitest run install -t "doctor: a missing kit"` | ✅ exists | ⬜ pending |
| TBD (planner) | — | — | D-10 | — | `--prune-old-kit` removes ONLY grugops backups; default never prunes; user `.bak` + protected dirs intact | integration | `npx vitest run install -t "prune: removes only grugops backups, default preserves"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | Contract (DRY_RUN) | — | `--migrate`/`--update`/`--prune-old-kit` honor `DRY_RUN=1` (mutate nothing; `would-*` lines) | integration | `npx vitest run install -t "DRY_RUN: new modes mutate nothing"` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | Contract (arg parse) | — | 3 new flags recognized; unknown args still exit 2 | integration | `npx vitest run install -t "unknown-arg"` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No new test FILE needed — all new cases append to `install/install.test.ts`.
- [ ] `makeOldLayoutFixture()` — the one genuinely new harness helper: vendored in-repo `agent-factory/` + repo-relative (and a symlink-variant) `.claude` adapters + NO `.grugops/install.json` marker (the migrate-from shape). Add beside `makeFixture` (~install.test.ts:69).
- [ ] Framework install: none — Vitest is already a devDependency and the baseline suite is green (21 passed, 1 skipped).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | — | — | All phase behaviors have automated Vitest verification. |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`makeOldLayoutFixture()`)
- [ ] No watch-mode flags (use `vitest run`, never `vitest --watch`)
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
