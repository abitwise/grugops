---
phase: 20-shared-context-substrate-concurrency-foundation
plan: 02
subsystem: concurrency-foundation
tags: [queue, atomic-claim, mkdirSync, stale-sweep, ttl, node-fs, committed-js, tdd]
requires:
  - scripts/freshness.ts (build-output gate auto-covers the new committed .js)
  - the D-13 committed-.js tooling layer (tsc → committed .js → freshness-checked → vitest oracle)
provides:
  - "scripts/claim.ts — claimTask (atomic mkdirSync claim, EEXIST=lost) + transition (pending→claimed→done atomic rename) + claim.md now-running record + sweepStale (explicit generous wall-clock TTL reclaim)"
  - "scripts/claim.js — committed compiled output (fresh under npm run freshness)"
  - "the .grugops/queue/{pending,claimed,done}/ layout DEFINED (not yet seeded — install.ts seeding is Phase 24)"
affects:
  - Phase 23 (parallel agents drain this queue; per-delegation claim cap MAX_CLAIMS_PER_DELEGATION)
  - Phase 22/25 (the config dial that wires the sweep TTL value)
  - Phase 26 (DOGF-02 — the real concurrency/equivalence oracle that exercises the stale reclaim under a true parallel run)
tech-stack:
  added: []   # zero new dependencies (node:fs + node:path stdlib only)
  patterns:
    - "mkdirSync atomic create-or-fail as the coordination signal (EEXIST = claim lost, never an error)"
    - "atomic rename for queue-state transitions; the directory IS the state — no central lock manager"
    - "Windows unlink-then-rename branch on EPERM/EEXIST/EACCES (MoveFileEx case)"
    - "explicit wall-clock TTL stale-sweep — caller-supplied TTL, injectable now, NO pid/host liveness"
    - "task-name allowlist ^[A-Za-z0-9._-]+$ before any join (ASVS V12 path-traversal mitigation)"
key-files:
  created:
    - scripts/claim.ts
    - scripts/claim.js
    - scripts/claim.test.ts
  modified: []
decisions:
  - "claimTask signature is (queueRoot, task, by) — queue root first, matching the plan action and the oracle calls"
  - "transition signature is (queueRoot, task, from, to); the subtask under a claimed task lives at claimed/<task>/<task>.md (inside the claim dir, beside claim.md)"
  - "sweepStale returns the subtask to pending/ by atomic rename BEFORE rmSync-ing the claim dir (else rmSync would delete it); conservative — skips a missing/unparseable `at`"
  - "claimTask uses mkdirSync NON-recursively so a missing claimed/ parent surfaces as a real ENOENT (rethrown), never swallowed into a false claim-lost"
metrics:
  duration: 3m
  completed: 2026-06-17
---

# Phase 20 Plan 02: File-Based Queue & Atomic Work-Claim Primitive Summary

Filesystem-native task queue with a lock-free atomic work-claim (`mkdirSync`→`EEXIST`), `pending→claimed→done` atomic-rename transitions, a `claim.md` now-running registry, and an explicit generous wall-clock TTL stale-sweep — all `node:fs`-only on the D-13 committed-`.js` tooling layer, with no central lock manager. Satisfies SC-3 (CLAIM-01 + CLAIM-02) and seeds DOGF-02.

## What Was Built

`scripts/claim.ts` (+ committed `scripts/claim.js`) — the concurrency net under the shared-context substrate. Each task is claimed exactly once, so within-task writing is normally single-writer (the partition that keeps `context-io.ts`'s write path safe). Exports:

- **`claimTask(queueRoot, task, by)`** — `mkdirSync(claimed/<task>)` atomic create-or-fail (NFS-safe, preferred over `O_EXCL`). First claimant wins (returns `true`, writes `claimed/<task>/claim.md` with `by`/`at`/`task` frontmatter — the now-running registry). A second claimant on the same task gets `EEXIST` → returns `false` (claim lost, NOT an error). Any other code (`ENOENT` parent-missing via non-recursive `mkdir`, `EACCES`, …) is rethrown — a real failure is never swallowed into a false "lost".
- **`transition(queueRoot, task, from, to)`** — moves the subtask file `pending/<task>.md` → `claimed/<task>/<task>.md` → `done/<task>.md` by atomic rename. The directory IS the state; no daemon, no lock manager.
- **`atomicRename(src, dst)`** (internal) — `renameSync` plus the Windows `unlink`-then-`rename` branch on `EPERM`/`EEXIST`/`EACCES` (the `MoveFileEx` case); other errors rethrow.
- **`sweepStale(queueRoot, ttlMs, now=Date.now())`** — `readdirSync` `claimed/`, read each `claim.md` `at`, and when `now - Date.parse(at) > ttlMs` reclaim the task (return its subtask to `pending/` by atomic rename, then `rmSync` the claim dir). Returns the reclaimed task list. **Wall-clock TTL only** — reads no pid/host/liveness signal (rejected: not portable cross-machine/NFS; heartbeat/lease deferred to v2.x PAR-05). TTL value is caller-supplied (the config dial is a later phase); default must be generous (exceed a real agent turn), explicitly NOT DeLM's 300s.

The `.grugops/queue/{pending,claimed,done}/` layout (CLAIM-01) is DEFINED here; `install.ts` seeding is out of scope (Phase 24).

`scripts/claim.test.ts` — the spawn/import-compiled-`.js` oracle (drives `claim.js`, never the `.ts`), proving SC-3a exclusivity (2nd claimant `EEXIST`=false), SC-3b real-error distinction (missing `claimed/` parent throws + traversal task name rejected), SC-3c rename transitions (file gone from source / present at destination at each step), the `claim.md` record, and the TTL sweep (expired claim reclaimed; fresh claim NOT reclaimed — a real no-op path, no-fabrication).

## TDD Execution

Followed the RED→GREEN flow (Task 1 `tdd="true"`):
1. **RED** (`1127b33`): wrote `claim.test.ts` first; it failed with `Cannot find module .../claim.js` (test-first contract).
2. **GREEN — Task 1** (`750797a`): `claimTask` + `transition` + `claim.md` record + `atomicRename`; 5/5 non-sweep tests pass.
3. **GREEN — Task 2** (`9e71887`): appended `sweepStale`; full suite 7/7 green.

## Verification

- `npm run build` — clean `tsc` compile, emits `scripts/claim.js`.
- `npx vitest run scripts/claim.test.ts` — **7 passed** (exclusivity, claim.md record, ENOENT real-error, traversal rejection, rename transitions, sweep reclaim, sweep no-op).
- `npm run freshness` — **All build outputs fresh: 15 committed .js file(s)** match a fresh `tsc` rebuild (the committed `claim.js` is provably a faithful build of `claim.ts`).
- No file deletions across the plan's commits; working tree clean.

## Acceptance Criteria (all met)

- `claim.ts` contains `mkdirSync` + an explicit `EEXIST`-returns-false branch distinct from a rethrow of other codes ✓
- writes `claim.md` with `by`/`at`/`task` under `claimed/<task>/` ✓
- validates the task name against `^[A-Za-z0-9._-]+$` (rejects `..`/separators) ✓
- references `renameSync` + `unlinkSync` (the Windows unlink-then-rename branch) ✓
- `claim.js` committed and fresh ✓
- `sweepStale(` takes `ttlMs`, reads the `at` field, uses NO pid/host/liveness in the sweep path (grep: only explanatory comments document the rejection) ✓
- the oracle proves both the expired-reclaim and the fresh-no-op paths ✓
- `npm run build && npx vitest run scripts/claim.test.ts && npm run freshness` exits 0 ✓

## Deviations from Plan

None — plan executed exactly as written. The only choice within Claude's discretion was the subtask's on-disk location while claimed (`claimed/<task>/<task>.md`, inside the claim dir beside `claim.md`), which the rename-transition test asserts explicitly.

## True-NFS Posture (honest `UNKNOWN - verify`)

Per the plan's `<verification>` and the locked design: `mkdirSync`/rename atomicity on a true NFS mount is NOT claimed — carried as `UNKNOWN - verify`. The deterministic unit tests prove the LOGIC unconditionally; the real Windows `unlink`-then-`rename` runtime leg is added by plan 20-04's CI matrix. DOGF-02 (Phase 26) is the eventual real concurrency oracle; PAR-05 (advisory leases) is the documented fallback if `mkdir` races on NFS.

## Self-Check: PASSED

- FOUND: scripts/claim.ts
- FOUND: scripts/claim.js
- FOUND: scripts/claim.test.ts
- FOUND commit 1127b33 (RED test)
- FOUND commit 750797a (Task 1 GREEN)
- FOUND commit 9e71887 (Task 2 GREEN)
