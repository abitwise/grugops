---
phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement
plan: 02
subsystem: testing
tags: [git-worktree, claim, context-io, sweepStale, vitest, concurrency, dogfood]

# Dependency graph
requires:
  - phase: 20-substrate-claim-context-io
    provides: claim.claimTask/transition/sweepStale + context-io.appendNote/readContext atomic primitives
  - phase: 23-convergence-spine
    provides: hermetic mkdtempSync + committed-.js-driven dual-path equivalence test pattern
provides:
  - "scripts/worktree-dogfood.test.ts — real-worktree N-agent dogfood proving DOGF-02/SC2"
  - "Deterministic proof that one shared absolute contextRoot/queueRoot is authoritative across N git worktrees (D-07 UNKNOWN closed)"
  - "sweepStale reclaim property proven non-vacuously (stale reclaimed + moved to pending/, fresh left alone)"
affects: [26-03 cost harness, 26-04/26-05 retirement flip, DOGF-02 live confirmation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "N real `git worktree add --detach` checkouts + N node child processes pinned to ONE shared absolute root outside every worktree"
    - "Shadow negative-check: assert no worktree-local .grugops/context grew for the shared task (D-07)"
    - "Injected-clock sweepStale reclaim proof (returned array contains task AND subtask back in pending/)"

key-files:
  created:
    - scripts/worktree-dogfood.test.ts
  modified: []

key-decisions:
  - "N worktree child processes import the MAIN checkout's committed .js and pass shared absolute roots (Open-Q2); correctness comes from the roots, not the importer"
  - "N = queue.wip_limit read from agent-factory/config/factory.config.json at runtime (honors D-08, not hard-coded)"
  - "Reused claim.sweepStale/claimTask/transition + context-io.appendNote unchanged — measured, did not re-architect (D-08)"
  - "Reworded security comments to avoid the literal strings `shell:true` / prod-approval-env so acceptance greps reflect the real (zero) usage"

patterns-established:
  - "Real-worktree hermetic dogfood: mkdtempSync shared root, N detached worktrees, arg-array git + node spawns, torn down in afterAll"
  - "Concurrency proof via Promise.all over spawn() children, then filesystem + result-file assertions"

requirements-completed: [DOGF-02]

coverage:
  - id: D1
    description: "N=wip_limit real git worktrees + N node children, all pinned to one shared absolute queue+context root outside every worktree; a single-slot task is claimed exactly once (one atomic-mkdir winner, rest EEXIST→false)"
    requirement: "DOGF-02"
    verification:
      - kind: unit
        ref: "scripts/worktree-dogfood.test.ts#claims a task exactly once and accretes N un-clobbered notes with no worktree shadowing"
        status: pass
    human_judgment: false
  - id: D2
    description: "A shared multi-writer note task accretes N distinct un-clobbered notes/<id>.md files, and the negative shadow-check proves no worktree grew its own populated .grugops/context for the shared task (D-07 authoritative shared root)"
    requirement: "DOGF-02"
    verification:
      - kind: unit
        ref: "scripts/worktree-dogfood.test.ts#claims a task exactly once and accretes N un-clobbered notes with no worktree shadowing"
        status: pass
    human_judgment: false
  - id: D3
    description: "sweepStale reclaims a deliberately stale claim (returned array contains the task AND subtask moved back to pending/) while leaving a fresh claim untouched — non-vacuous against an injected clock"
    requirement: "DOGF-02"
    verification:
      - kind: unit
        ref: "scripts/worktree-dogfood.test.ts#sweepStale reclaims a deliberately stale claim while leaving a fresh claim alone"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-01
status: complete
---

# Phase 26 Plan 02: Real-Worktree N-Agent Dogfood Summary

**Hermetic, token-free DOGF-02 dogfood: N=3 real `git worktree` checkouts + N node children pinned to ONE shared absolute queue+context root prove exactly-once claiming, N un-clobbered notes, no worktree context-shadowing (D-07 closed), and non-vacuous `sweepStale` reclaim via an injected clock.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-01
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments
- Real `git worktree add --detach` × N (N read from `queue.wip_limit`=3), each the cwd of its own node child process, all pinned to ONE shared absolute `SHARED_QUEUE` + `SHARED_CONTEXT` outside every worktree — the script-relative defaults are never referenced (D-07).
- Exactly-once claim proven: exactly one child observes `claimTask===true`, the other N-1 see EEXIST→false; the claimed task ends in `done/`.
- N distinct un-clobbered `notes/<id>.md` files for a shared multi-writer note task (appendNote temp+rename fresh-unique write).
- Negative shadow-check (mirrors convergence-spine.test.ts:175-182): no worktree grew its own populated `.grugops/context`/`.grugops/queue` for the shared task — the shared root is authoritative, closing the flagged v2.0 UNKNOWN.
- `sweepStale` reclaim property proven non-vacuously: a claim seeded with an old `at` is reclaimed (returned array CONTAINS the task AND its subtask is back in `pending/`) while a fresh claim is left alone — via an injected `now`, no wall-clock dependency (Pitfall 6).

## Task Commits

Both tasks are one hermetic test file, committed atomically:

1. **Task 1 (exactly-once claim + N un-clobbered notes + shadow negative-check) & Task 2 (sweepStale reclaim property)** - `2301d4a` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `scripts/worktree-dogfood.test.ts` - Hermetic Vitest dogfood: real detached worktrees, arg-array git + node spawns, Promise.all concurrency, exactly-once + un-clobbered-notes + shadow negative-check + injected-clock sweepStale reclaim. tsconfig-excluded (`**/*.test.ts`) — no committed `.js` twin, no freshness impact.

## Decisions Made
- **Import the MAIN checkout's committed `.js`, pass shared absolute roots (Open-Q2):** correctness is a property of the roots passed to every call, not of which script copy is imported. Simplest and removes any doubt about worktree-local script copies.
- **N from config at runtime (D-08):** `N = queue.wip_limit` is read from `agent-factory/config/factory.config.json`, honoring the concurrency width rather than hard-coding 3.
- **Reused substrate primitives unchanged (D-08):** no new reclaim/claim/note code — the phase measures, it does not re-architect.

## Deviations from Plan

None - plan executed exactly as written. (One micro-adjustment during verification, not a scope change: two security comments originally contained the literal strings `shell:true` and the prod-deploy approval env name, which tripped the naive acceptance-criteria greps that require those literals to be absent. The harness never used either; the comments were reworded so the greps reflect the real zero usage.)

## Issues Encountered
None. The test passed on first run (2/2); the only follow-up was the comment rewording above so the acceptance greps read true.

## User Setup Required
None - no external service configuration required. The dogfood is deterministic, token-free, and needs only `git` + Node (both present).

## Next Phase Readiness
- DOGF-02 (the deterministic gating dogfood) is complete and green — the `isolation:worktree` ↔ shared-context-path interaction is confirmed, closing the D-07 UNKNOWN on local filesystems (true-NFS atomicity remains the standing `UNKNOWN - verify` per STATE.md).
- Independent of plans 26-01 (oracle), 26-03 (cost harness); the DOGF-02 *live* N-agent confirmation (Tier-2 loud-skip) and the A3/DOG-02 retirement flip remain separate, evidence-gated steps.

## Verification
- `npx vitest run scripts/worktree-dogfood.test.ts` — 2 passed.
- `npx vitest run --exclude '**/scripts/e2e/**'` — 28 files, 780 passed, 1 skipped (no regression).
- `npm run freshness` — exit 0 (23 committed `.js` fresh; test file has no twin).
- Acceptance greps: `SHARED_QUEUE|SHARED_CONTEXT`=18 (≥4), `DEFAULT_*`=0, `worktree add`=1 (≥1), `shell: *true`=0, `sweepStale`=3 (≥1 with injected `now`).

## Self-Check: PASSED
- FOUND: scripts/worktree-dogfood.test.ts
- FOUND commit: 2301d4a

---
*Phase: 26-dogfood-dual-path-oracle-a3-dog-02-retirement*
*Completed: 2026-07-01*
