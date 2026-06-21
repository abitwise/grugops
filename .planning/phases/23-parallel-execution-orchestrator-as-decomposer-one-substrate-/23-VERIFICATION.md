---
phase: 23-parallel-execution-orchestrator-as-decomposer-one-substrate-
verified: 2026-06-21T11:32:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
requirements_resolved:
  - "CLAIM-03: SATISFIED — queue.wip_limit width cap on 3 surfaces; width-not-depth spine assertion non-vacuous"
  - "PAR-01: SATISFIED IN CODEBASE (REQUIREMENTS.md still marks Pending — recommend flip to Complete)"
  - "PAR-02: SATISFIED — coordinator-only spawn enabled; WF17 present; parallel-mode prose + adapter grant"
  - "PAR-03: SATISFIED IN CODEBASE (REQUIREMENTS.md still marks Pending — recommend flip to Complete)"
  - "PAR-04: SATISFIED — both-direction guard_wr05 inverted, proven RED vs committed .js + asymmetry repro + independent probe"
---

# Phase 23: Parallel Execution & Orchestrator-as-Decomposer Verification Report

**Phase Goal:** Run both execution paths — parallel on Claude Code, sequential on the four other CLIs — on the one shared substrate: redefine the Orchestrator from router to decomposer/scheduler/gate, invert the WR-05 guard, and cap concurrent width.
**Verified:** 2026-06-21T11:32:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Orchestrator decomposes work into queued subtasks, holds `Agent(<allowlist>)` + human merge/deploy gate, sets `queue.wip_limit`, does NOT relay data | ✓ VERIFIED | `orchestrator.md:48` decompose→enqueue→schedule→gate→sweep spine; `:95` clear-voice hard limit names `Agent(<allowlist>)`, width cap, "does NOT relay data", merge/deploy human-held. `decompose-spine.test.ts` asserts thin pending refs + no agent-to-agent relay (on-disk only). |
| SC2 | On Claude Code, role agents claim+run in parallel via nested spawning (depth ≤5); concurrent *width* never exceeds `queue.wip_limit` (CLAIM-03) | ✓ VERIFIED | `decompose-spine.test.ts` proves WIDTH (count in claimed/) ≤ budget, NON-vacuously (widthHighWater === WIP_LIMIT AND a freed slot reused) — a WIDTH not a depth assertion (Pitfall 4). Adapter carries enumerated `Agent(...)` grant; `orchestrator.md:95` documents depth ≤5 / width-capped. 57/57 phase tests green. |
| SC3 | Four non-spawning CLIs drain the same queue at concurrency-1 via rewired `_role-switch-protocol.md` step-4, producing identical on-disk artifacts (one substrate, two modes converge) | ✓ VERIFIED | `_role-switch-protocol.md:36` step-4 rewired to "claim per WF17 → context per WF16 → mark done"; sequential single-window load preserved (`:7,:50`). `convergence-spine.test.ts` drives committed claim.js+context-io.js through parallel-spawn AND sequential-drain and asserts order-independent substrate equality via `currentState()`. PASSES. |
| SC4 | `guard_wr05` inverted from "no role grants Agent" to "only the coordinator grants `Agent(<allowlist>)`"; flips atomically with packaging templates + docs catalog (a planted non-coordinator grant fails RED) | ✓ VERIFIED | Independently reproduced against COMMITTED `check-foundation-guards.js`: planted non-coordinator grant → exit 1 "rogue spawner"; dropped coordinator grant → exit 1 "kills Claude Code parallelism"; removed marker → exit 1 + "found 0" cardinality; live 2nd coordinator → exit 1 "found 2"; fenced doc example → guard PASSES (fence-immune). Asymmetry oracle: non-CC row gains spawn/fan-out → exit 1. Catalog fresh. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

(The phase PLAN must_haves map onto these four roadmap SCs plus CLAIM-03; all five requirement IDs are covered below. No PLAN must_have reduced roadmap scope.)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-foundation-guards.ts/.js` | Both-direction marker-keyed guard_wr05 + fence-strip + cardinality | ✓ VERIFIED | `WR05_COORDINATOR = /^coordinator:\s*true\b/` (marker, never filename); both grant EREs retain `Agent\|Task`; `stripFencedBlocks` + `matchesOutsideFences`; exactly-one-coordinator cardinality. Committed .js byte-fresh. |
| `scripts/check-uat-oracles.ts/.js` | B3 oracle flip + four-CLI asymmetry assertion (broadened) | ✓ VERIFIED | `ASYM_SPAWN_WORDING` broadened to concept (`parallel\|concurren\|fan-?out\|(?<!no )\bspawn`); per-tool all-row validation; missing-file fail-red preserved. Reproduced RED on Codex + Gemini drift. |
| `.claude/agents/grugops-orchestrator.md` | `coordinator: true` + enumerated grant, ≤4096 B | ✓ VERIFIED | `coordinator: true` (line 4); `tools: Agent(7 specialist roles), Read, Grep, Glob, Bash, Edit, Write`; 1948 B < 4096. |
| `agent-factory/roles/orchestrator.md` | Augmented decompose/schedule/gate + hard limit (in place) | ✓ VERIFIED | Spine + clear-voice hard limit present; 7542 B (WARN-tolerated by guard_role_size, exit 0); 17-type classification + routing matrix preserved. |
| `agent-factory/workflows/17-task-claim.md` | Single-source claim+schedule protocol, order:17, chains WF16 | ✓ VERIFIED | `kind: workflow`, `order: 17`; references claim.js claimTask/transition/sweepStale; chains WF16, never inlines note I/O. |
| `agent-factory/roles/_role-switch-protocol.md` | "No Agent tool" absolute dropped; sequential preserved; step-4 rewired | ✓ VERIFIED | "No Agent tool / does NOT spawn" absolute GONE; step-4 references WF17+WF16; sequential single-window load preserved verbatim; coordinator-only-on-CC framing. |
| `agent-factory/config/factory.config.{json,md}` + seed | queue object {wip_limit:3,claim_cap:2,stale_ttl_minutes:30}, 3-surface byte-consistent | ✓ VERIFIED | kit==seed byte-equal; defaults 3/2/30; twin documents all 3 keys + width-vs-flow distinction (11 mentions). |
| `scripts/now-running-freshness.ts/.js` | Queue-rooted drift gate, fail-closed, import-safe (WR-04) | ✓ VERIFIED | Walks `.grugops/queue/`; entry-guarded `main()` behind import.meta-vs-argv; real-tree exit 0. |
| `scripts/claim.ts` renderNowRunning | Deterministic render w/ first-at-trusted carve-out | ✓ VERIFIED | Reuses sweepStale multi-`at` tamper discipline; no permissive parser (REVIEW cleared). |
| `docs/catalog/README.md` | Regenerated reflecting WF17 | ✓ VERIFIED | Contains task-claim row; catalog-freshness exit 0. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `check-foundation-guards.ts` | `.claude/agents/grugops-orchestrator.md` | guard asserts coordinator MUST grant; non-coordinators MUST NOT | ✓ WIRED | Real tree PASS; all 3 half-flips + cardinality FAIL RED vs committed .js |
| `check-uat-oracles.ts` | `adapters.md` + `README.md` | asymmetry beat scans 5-tool rows | ✓ WIRED | Codex/Gemini drift → RED; only CC row carries spawn wording |
| `orchestrator.md` | `17-task-claim.md` | scheduler references WF17; WF17 chains WF16 | ✓ WIRED | grep-confirmed references, no inlining |
| `convergence-spine.test.ts` | `claim.js` + `context-io.js` | drives committed .js both modes | ✓ WIRED | currentState() order-independent equality, PASSES |

### Behavioral Spot-Checks / Adversarial Reproduction (independent, vs COMMITTED .js)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Real-tree guard | `node scripts/check-foundation-guards.js` | exit 0, "exactly one coordinator holds the spawn grant" | ✓ PASS |
| Real-tree oracle | `node scripts/check-uat-oracles.js` | exit 0, asymmetric flip OK | ✓ PASS |
| Half-flip (a) non-coordinator grant planted | hand-built tree | exit 1 "rogue spawner" names file | ✓ PASS |
| Half-flip (b) coordinator grant dropped | hand-built tree | exit 1 "kills Claude Code parallelism" | ✓ PASS |
| Half-flip (c) marker removed | hand-built tree | exit 1 "rogue spawner" + "found 0" | ✓ PASS |
| Cardinality: live 2nd coordinator | hand-built tree | exit 1 "found 2" | ✓ PASS |
| Fence-immunity (CR-01) | real tree w/ fenced example | guard exit 0 (fenced marker NOT counted) | ✓ PASS |
| Asymmetry drift Codex/Gemini | hand-built tree | oracle exit 1 names the row | ✓ PASS |
| Freshness (all 18 committed .js) | `npm run freshness` | exit 0 | ✓ PASS |
| now-running-freshness real tree | `node scripts/now-running-freshness.js` | exit 0 | ✓ PASS |
| catalog-freshness | `node scripts/catalog-freshness.js` | exit 0 | ✓ PASS |
| Full non-e2e regression | `npx vitest run --exclude '**/scripts/e2e/**'` | 451 passed, 1 skipped | ✓ PASS |
| Phase-23 suites direct | 6 suites | 57/57 passed | ✓ PASS |

**Note (green-suite-insufficient discipline):** Per CLAUDE.md + the project safety rule, the WR-05 inversion was NOT accepted on a green suite. I independently rebuilt half-flip trees and confirmed the COMMITTED `.js` (not the source, not the SUMMARY's RED txt) fails RED on every direction, and confirmed fence-immunity + cardinality structurally close CR-01.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLAIM-03 | 23-01, 23-02, 23-03 | queue.wip_limit width cap | ✓ SATISFIED | queue object 3 surfaces; non-vacuous WIDTH assertion |
| PAR-01 | 23-02 | Orchestrator → decomposer/scheduler/gate, holds Agent(<allowlist>), no-relay | ✓ SATISFIED IN CODEBASE | orchestrator.md spine + hard limit verified; **REQUIREMENTS.md still marks Pending** |
| PAR-02 | 23-02, 23-03 | Parallel role-agent spawn on CC + WF17 | ✓ SATISFIED | WF17 present; adapter grant; parallel-mode prose |
| PAR-03 | 23-02, 23-03 | Degraded sequential path, rewired step-4, converges | ✓ SATISFIED IN CODEBASE | _role-switch-protocol.md step-4 rewired; convergence oracle PASSES; **REQUIREMENTS.md still marks Pending** |
| PAR-04 | 23-03 | guard_wr05 inverted, atomic flip | ✓ SATISFIED | both-direction guard proven RED vs committed .js + asymmetry repro + independent probe |

**PAR-01 and PAR-03 are DELIVERED in the codebase** (the specific concern raised in the verification brief). They span plans 23-02 (orchestrator augment + no-relay/two-mode hard limit + SC3 convergence oracle) and 23-03 (the `Agent(<allowlist>)` grant on the orchestrator adapter + the `_role-switch-protocol.md` step-4 rewire) — all components verified present and wired above. The `Pending` status in `.planning/REQUIREMENTS.md` (lines 52, 54, 121, 123) is a stale traceability-table entry, not a missing deliverable. **Recommend flipping PAR-01 and PAR-03 to Complete in REQUIREMENTS.md.** This is a documentation-bookkeeping note, not a goal gap — no code is missing.

No orphaned requirements: all five phase IDs are claimed by plans and verified.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD/FIXME/XXX in phase-modified files | — | Clean |

### Code Review Disposition (23-REVIEW.md)

- **CR-01 (BLOCKER)** — guard mis-classified a fenced doc example as a live coordinator → **FIXED** structurally in commit `b32613b` (`stripFencedBlocks` + exactly-one-coordinator cardinality). Independently confirmed fence-immune + cardinality-enforcing against the committed .js.
- **WR-01** (broaden ASYM_SPAWN_WORDING) → **FIXED** (concept-level matcher with `(?<!no )` lookbehind; confirmed catches "parallel fan-out").
- **WR-03** (validate every table row) → **FIXED** (`lines.filter`, one-row-per-tool assertion).
- **WR-04** (now-running-freshness entry guard) → **FIXED** (main() + import.meta-vs-argv; confirmed import-safe).
- **WR-02** (oracleParity advisory regex whole-file not cell-scoped) → **DEFERRED** — advisory WARN, recorded in 23-03-GAP-SUMMARY.md and STATE.md; not load-bearing for this phase's goal.
- **IN-01/IN-02/IN-03** (cosmetic) → **DEFERRED**, recorded.

### Constraint Adherence (safety-critical)

- `hooks/guard.ts` / `hooks/guard.js` — **UNCHANGED** across all phase-23 commits (verified via `git show --stat` over every commit; last touched in Phase 15). The humans-hold-merge/deploy floor survives parallelism.
- Four non-CC rows (Codex/Gemini/OpenCode/Copilot) retain "Sequential role-load — no spawn" verbatim; only the Claude Code row carries coordinator-spawn wording.
- All 18 committed `.js` byte-match a fresh `tsc` rebuild (`npm run freshness` exit 0).
- Working tree clean; no uncommitted phase work.

### Human Verification Required

None. All success criteria are mechanically verifiable and were independently reproduced against the committed artifacts.

### Gaps Summary

No goal gaps. All four ROADMAP success criteria and all five requirement IDs are achieved in the codebase. The headline deliverable — the atomic both-direction WR-05 safety-guard inversion — was held to the project's green-suite-insufficient standard and passed: every half-flip and asymmetry-drift direction fails RED against the COMMITTED `.js`, the CR-01 fence/cardinality fix is structurally confirmed, and the merge/deploy floor (`hooks/guard.ts`) is untouched.

The only follow-up is bookkeeping: flip PAR-01 and PAR-03 from `Pending` to `Complete` in `.planning/REQUIREMENTS.md` (their deliverables are verified present). WR-02 + three INFO items remain intentionally deferred and tracked.

---

_Verified: 2026-06-21T11:32:00Z_
_Verifier: Claude (gsd-verifier)_
