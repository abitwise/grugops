# Phase 26: Dogfood, Dual-Path Oracle & A3/DOG-02 Retirement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 26-dogfood-dual-path-oracle-a3-dog-02-retirement
**Areas discussed:** Retirement bar, Seeded fixture & equivalence, N-agent dogfood & worktree crux, Cost measurement & retirement mechanics

> Style: concrete-proposal-first (orchestrator proposed a recommended resolution per area in prose; AskUserQuestion used as confirm/steer). User selected all four areas to dig into, then confirmed the recommended option on every fork.

---

## ① Retirement bar — what flips A3/DOG-02 to "retired"

| Option | Description | Selected |
|--------|-------------|----------|
| Oracle green + captured live run | Deterministic oracle is the always-on CI gate; the retirement flip ALSO requires one captured live dual-path run (authed CI or human runbook). Honest — doesn't mark a never-run live path resolved; DOG-02 stays pending (loud-skip) until captured. | ✓ |
| Deterministic oracle alone | Retire as soon as the deterministic seeded-replay oracle is green; no live run. CI-enforceable, but both sim paths share code → doesn't exercise real dispatch; risks soft-over-claiming the CC-native column. | |

**User's choice:** Oracle green + captured live run
**Notes:** The deterministic oracle proves substrate convergence on disk (new, real) but drives the same code two ways, so it doesn't exercise real dual dispatch — which is what DOG-02 was about. Phase completion carries a live-capture dependency on the retired flip only; the deterministic/mechanical deliverables complete independently.

---

## ② Seeded fixture & equivalence definition

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen synthetic stamp | Bake a fixed `verified_by: §14-gate#<id>` + verdict into the fixture; oracle proves both paths admit the SAME finding+verdict via currentState(). Keeps Tier-1 scope tight — gate logic tested elsewhere. | ✓ |
| Invoke the real gate in-process | Run emitVerdict/admission during the oracle. Stronger end-to-end, but re-tests admission logic the harness scopes out and risks non-determinism in Tier-1. | |

**User's choice:** Frozen synthetic stamp
**Notes:** Equivalence asserted via currentState() canonical projection; seeded decomposition must include ≥1 stamped admitted finding (stronger than convergence-spine's soft-only notes). "Artifact" = on-disk note-set + verdict, not byte-identical generated code.

---

## ③ N-agent dogfood realism & the worktree crux

| Option | Description | Selected |
|--------|-------------|----------|
| Real worktrees, shared contextRoot | N node processes, each cwd'd into its own real git worktree, all pinned to ONE shared absolute contextRoot. Exercises the flagged isolation:worktree↔shared-context UNKNOWN; deterministic, no tokens. | ✓ |
| N processes, one shared dir | Skip real worktrees; N processes against one shared dir. Faster, proves un-clobbered/claimed-once/stale-reclaim, but leaves worktree-shadowing unexercised — the one thing the SC names. | |

**User's choice:** Real worktrees, shared contextRoot
**Notes:** Crux finding to confirm & document — DEFAULT_CONTEXT_ROOT is script-relative, so a worktree gets a worktree-LOCAL context by default; the dogfood must pin a single shared absolute contextRoot (queue + context outside the worktrees; only code edits isolated). Reuse claim.sweepStale (the DOGF-02 seed); width honors queue.wip_limit. Live N-agent claude spawn = Tier-2 confirmation only.

---

## ④ Cost measurement (DOGF-03) — gate and number

| Option | Description | Selected |
|--------|-------------|----------|
| Harness + UNKNOWN, doesn't gate | Ship the token-cost harness; default to UNKNOWN - verify with no authed run; never fabricate, never quote DeLM's ~50%. Cost does NOT block retirement (SC4 gates on the oracle); real number fills later. | ✓ |
| Produce a grugops number now | Run an authed parallel-vs-sequential measurement this phase and commit a real ratio. More concrete, but adds a live/authed dependency to phase completion. | |

**User's choice:** Harness + UNKNOWN, doesn't gate
**Notes:** Retirement mechanics (locked discipline, not a fork): replace — not delete — oracleParity; update its importer check-foundation-guards.ts in the same change; flip DOG-02/A3 to resolved only after the oracle is green + the live capture exists; preserve the requirement→trace (Phase-24 discipline — never assert against deleted artifacts).

## Claude's Discretion

- Exact seeded decomposition shape (task count, note kinds/bodies) — minimal but includes the stamped finding; model on convergence-spine.test.ts.
- Whether the new oracle is a new exported function in check-uat-oracles.ts reusing convergence-spine's replay logic, or a shared helper both import — cleanest single-source factoring is the planner's call.
- TTL value used to demonstrate sweepStale reclaim (generous, deterministic).

## Deferred Ideas

- pid/host claim liveness — out (v2.x PAR-05); sweepStale stays wall-clock-TTL only.
- A grugops-measured cost ratio as a hard phase deliverable — deferred to a later authed run.
- Re-testing §14-gate admission/guard logic — out of scope; covered by existing suites.
