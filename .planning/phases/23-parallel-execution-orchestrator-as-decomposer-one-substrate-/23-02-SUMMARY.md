---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate
plan: 02
subsystem: orchestrator-decomposer-spine-and-convergence-oracle
tags: [orchestrator, decompose-schedule-gate, workflow-17, claim, convergence, width-cap, no-relay, two-modes]
status: complete
requires:
  - scripts/claim.js (claimTask / transition / sweepStale — Phase 20, consumed unchanged)
  - scripts/context-io.js (appendNote / readContext / currentState — consumed unchanged)
  - queue config object (queue.wip_limit / claim_cap / stale_ttl_minutes — Plan 23-01)
provides:
  - orchestrator.md augmented to the decompose → enqueue → schedule → gate → sweep spine (D-11/D-12)
  - orchestrator.md clear-voice coordinator hard limit (Agent(<allowlist>) / width cap / no-relay / two modes — D-13)
  - agent-factory/workflows/17-task-claim.md — single-source claim+schedule protocol (D-05)
  - scripts/decompose-spine.test.ts — SC1 enqueue + SC2/CLAIM-03 width-cap + exclusivity oracle
  - scripts/convergence-spine.test.ts — SC3/D-04 dual-path order-independent substrate-equality oracle
affects:
  - Plan 23-03 (the atomic WR-05 flip — this plan deliberately did NOT touch _role-switch-protocol.md, guard_wr05, or the WR-05 wording surfaces; scope seam D-01)
tech-stack:
  added: []
  patterns:
    - single-source workflow referenced never restated (WF17 mirrors WF18's shape; chains WF16)
    - in-place role augment under a per-file byte ceiling (guard_role_size)
    - hermetic temp-dir substrate test driving the committed .js (never .ts, never e2e lane)
    - WIDTH assertion (count in claimed/ ≤ wip_limit) NOT a depth check (Pitfall 4)
key-files:
  created:
    - agent-factory/workflows/17-task-claim.md
    - scripts/decompose-spine.test.ts
    - scripts/convergence-spine.test.ts
  modified:
    - agent-factory/roles/orchestrator.md
    - scripts/generate-catalog.test.ts
    - docs/catalog/README.md
decisions:
  - "orchestrator.md augmented IN PLACE (D-11) — caveman cadence + 17-type classification + routing matrix preserved; routing matrix repurposed as subtask→which-role-claims-it"
  - "the augment was kept under guard_role_size FAIL (7570B): existing prose was compressed (One job, routing matrix, workflow grid, Output block) to fund the new spine + hard-limit prose; final 7542B"
  - "WF17 single-sources the CLAIM mechanics (claim.js claimTask/transition/sweepStale) and INCLUDES the coordinator stale-sweep (planner discretion); it chains to WF16 for ALL note I/O and never inlines it (D-05/Pitfall 6)"
  - "SC2 proves WIDTH not depth: claimedWidth counts claim dirs whose subtask file is still present (transition(claimed→done) leaves the claim dir until sweep — production-faithful), and the test proves the budget was touched AND a freed slot reused (non-vacuous)"
  - "convergence oracle uses soft note kinds (observation/decision) so no §14-gate stamp is required (WF16 admits soft kinds), with deterministic per-task `at` values so currentState() replay is mode-independent"
metrics:
  duration: ~15m
  completed: 2026-06-21
  tasks: 2
  files: 6
---

# Phase 23 Plan 02: Orchestrator-as-Decomposer Spine + Convergence Oracle Summary

The PAR-01/PAR-02/PAR-03 prose machinery and its deterministic Nyquist evidence: `orchestrator.md` augmented from router to decompose/schedule/gate coordinator (D-11/D-12/D-13), the single-source claim+schedule Workflow 17 (D-05), and the SC1/SC2 decomposition+width spine plus the SC3 dual-path convergence oracle (D-04). This plan deliberately did NOT touch the WR-05 wording surface, `_role-switch-protocol.md`'s "No Agent tool" absolute, or `guard_wr05` — those are the atomic flip in Plan 03 (scope seam D-01).

## What was built

### Task 1 — orchestrator.md augment + Workflow 17 (commit fc4e5ac)

**`orchestrator.md` augmented in place** (D-11 — not rewritten; caveman prompt cadence and the 17-type classification + routing matrix preserved):

- **§ Caveman prompt** (inside the `guard_caveman_preserved` fence): added four tight `You …` lines — split work into queued subtasks, never run wider than the width cap, never pass data agent-to-agent, spawn agents only on Claude Code. Voice/token economy kept (caveman IS the token-economy mechanism here).
- **§ Reads:** added `queue` (`wip_limit` / `claim_cap` / `stale_ttl_minutes`) to the config-keys line (D-06, consuming Plan 01's config object).
- **§ Responsibilities:** the new spine — decompose → **enqueue** each subtask as a thin `pending/` file that is only a `ref:` to its per-task `.grugops/context/` folder (no inlined data) → **schedule** (on Claude Code spawn role-agents via the `Agent` tool up to `queue.wip_limit` concurrent WIDTH; on the four other CLIs drain the queue concurrency-1 via the role-switch protocol) → each role claims+works+marks-done per WF17 → **gate** → run the stale-claim **sweep** (TTL `queue.stale_ttl_minutes`). The routing matrix was repurposed as "subtask → which role claims it" (D-11) and kept.
- **§ Hard limits (clear voice — D-13, a safety/capability surface, NOT caveman):** the Orchestrator holds `Agent(<allowlist>)` and is the only role that may spawn; sets `queue.wip_limit` and **never exceeds that concurrent WIDTH**; honors `queue.claim_cap` per delegation; **does NOT relay data between agents** — the shared verified context is the only channel. One substrate, two modes documented: PARALLEL on Claude Code (nested spawn; platform DEPTH ≤5 fixed/not-configurable, WIDTH capped by grugops at `queue.wip_limit` since the platform does NOT cap width — Pitfall 4); SEQUENTIAL on Codex/Gemini/OpenCode/Copilot (concurrency-1, no spawn, degrade-never-break). The main-thread-only allowlist nuance (Pitfall 1) is stated: the enumerated `Agent(<allowlist>)` is honored because the Orchestrator runs as the main-thread agent; nested spawning by role-agents is bounded by depth+width, not a nested allowlist. Merge/deploy limits unchanged.

**`agent-factory/workflows/17-task-claim.md`** (new, `order: 17`, `cadence: both`) mirrors WF18's section shape verbatim: `## When to use` (with the single-source note), the claim/note seam (queue CLAIM vs the soft `claim` note-KIND — different code paths), `## Steps` (read-state-first → claim atomically via `claim.js` `claimTask` first-claimant-wins/EEXIST=lost → transition into claimed → work + write-after-verify via WF16 → mark done → coordinator stale-sweep via `sweepStale`), `## Stop conditions`, `## Done condition`, `## Commit` (branch guard first, never merge/deploy). It single-sources the claim mechanics and chains to WF16 for ALL note I/O — never inlining it (D-05/Pitfall 6). Clear voice (a protocol surface).

### Task 2 — SC1/SC2 spine + SC3 convergence oracle (commit cace2d3, TDD)

`scripts/decompose-spine.test.ts` (hermetic, drives committed `claim.js`):
- **SC1 decompose→enqueue:** each seeded subtask is a THIN `pending/` file carrying ONLY a `ref:` to its per-task `.grugops/context/` folder (≤2 meaningful lines — no inlined data).
- **SC2/CLAIM-03 WIDTH (Pitfall 4):** with `WIP_LIMIT=2` draining a 3-subtask decomposition, the count of tasks SIMULTANEOUSLY in `claimed/` NEVER exceeds the budget; a third claim proceeds only after a prior task transitions to `done/`. `claimedWidth` counts claim dirs whose subtask file is still present (production-faithful — `transition(claimed→done)` leaves the claim dir until sweep). The assertion proves the budget was actually touched (`widthHighWater === WIP_LIMIT`) and a freed slot reused (`reuseObserved`) — non-vacuous.
- **Exclusivity (T-23-06):** a second `claimTask` on a held task returns false (EEXIST = claim lost).

`scripts/convergence-spine.test.ts` (the SC3/D-04 dual-path oracle, drives committed `claim.js` + `context-io.js`): the SAME seeded 2-3-subtask decomposition is replayed through (a) a parallel-spawn simulation (claim all up to width, work in reverse order, then mark all done) and (b) a sequential drain (claim one, work, done, repeat). The final on-disk substrate is asserted EQUAL order-independently: the same set of `done/` records, and the same per-task `.grugops/context/<task>/notes/` content via `context-io.js` `currentState()` canonical replay. Notes use soft kinds (observation/decision) so no §14-gate stamp is required; deterministic per-task `at` values make the replay mode-independent. A second test proves isolation (each substrate writes only under its own root — no agent-to-agent relay).

Both tests are hermetic, drive the committed `.js`, and are OUT of the e2e lane.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] New WF17 made the committed docs catalog stale**
- **Found during:** Task 2 (full non-e2e regression).
- **Issue:** adding `agent-factory/workflows/17-task-claim.md` grew the kit from 18→19 workflows. `scripts/generate-catalog.js` auto-discovers workflows, so the committed `docs/catalog/README.md` (18 rows) drifted and the `catalog-freshness` + DOCS-01 gates failed (byte-parity + "exactly 18 workflow rows" + the hard-coded 18-name list).
- **Fix:** regenerated `docs/catalog/README.md` (now 19 workflows, incl. the "task claim + schedule" row) via `node scripts/generate-catalog.js`, and updated `scripts/generate-catalog.test.ts` hard-coded literals (18→19 in the comment, the WORKFLOW_NAMES list, the assertion count, and the test title). This is queue-mechanics-adjacent to the Plan-03 catalog regen note in the pattern map but was forced NOW because WF17 is a Plan-02 artifact.
- **Files modified:** `docs/catalog/README.md`, `scripts/generate-catalog.test.ts`.
- **Commit:** cace2d3.

**2. [Rule 1 - Bug] decompose-spine width measure over-counted freed slots (test logic)**
- **Found during:** Task 2 (first test run — ENOENT on a second done transition).
- **Issue:** my initial `claimedWidth` counted bare `claimed/` directory entries. Because `transition(claimed→done)` moves only the subtask FILE and leaves the claim dir + claim.md behind (production behavior, swept later), the bare count over-reported a freed slot and re-selected an already-done task to "complete" → ENOENT.
- **Fix:** `claimedWidth`/`inFlight` now count claim dirs whose `<task>.md` subtask file is still present (the genuinely in-flight tasks). This is the production-faithful width measure.
- **Commit:** cace2d3 (test landed correct).

The scope seam (D-01) held: no edit touched the WR-05 wording surface, `_role-switch-protocol.md`, or `guard_wr05`. The byte-ceiling constraint (D-11/Pattern map) was the dominant pressure — the augment was funded by compressing existing prose (One job, routing matrix, the Output workflow mapping collapsed to a `NN`+slug grid, the Output decision block list) to stay under guard_role_size FAIL (7570B); final orchestrator.md is 7542B (WARN-level, which the guard tolerates at exit 0).

## Verification

- `npx vitest run scripts/decompose-spine.test.ts scripts/convergence-spine.test.ts scripts/check-foundation-guards.test.ts` — 30 passed.
- `node scripts/check-foundation-guards.js` — exit 0 (guard_role_size: orchestrator.md 7542B < FAIL 7570B; guard_caveman_preserved green; SCTX-05 green after rewording the context path to avoid the `<task>` `>`-token false-positive).
- `npm run freshness` — exit 0 (18 committed `.js` byte-match a fresh tsc rebuild; the new files are `.test.ts`-only with no `.js` twin).
- `npx vitest run --exclude '**/scripts/e2e/**'` — 444 passed, 1 skipped, 0 failed (no regression; baseline was 439+ before this plan, now includes the 5 new spine/convergence tests).

## Threat surface

All five plan threat-register dispositions are honored:
- **T-23-04 (DoS — unbounded width):** mitigated — orchestrator.md prose sets `queue.wip_limit` as the width cap and `queue.claim_cap` per delegation; the spine fixture asserts concurrent WIDTH never exceeds the budget (width, not depth).
- **T-23-05 (info-disclosure/spoofing — agent-to-agent relay):** mitigated — orchestrator.md clear-voice hard limit states "does NOT relay data … shared verified context is the only channel"; both spine tests coordinate purely through the on-disk substrate and the convergence isolation test proves no cross-root leak.
- **T-23-06 (tampering — re-claimed task):** mitigated — the spine exclusivity test asserts a second `claimTask` on a held task returns false (EEXIST).
- **T-23-07 (EoP — auto-merge/deploy):** accept (floor unchanged) — `hooks/guard.ts` untouched; orchestrator.md restates merge/deploy stay human-held.
- **T-23-SC (package installs):** accept — no package installs this plan.

No new security surface beyond the plan's threat model was introduced.

## Self-Check: PASSED

- Created files exist: `agent-factory/workflows/17-task-claim.md`, `scripts/decompose-spine.test.ts`, `scripts/convergence-spine.test.ts` — all FOUND.
- Commits exist: `fc4e5ac` (Task 1), `cace2d3` (Task 2) — both FOUND in git log.
