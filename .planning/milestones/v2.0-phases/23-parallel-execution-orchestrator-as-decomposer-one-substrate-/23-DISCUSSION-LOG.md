# Phase 23: Parallel Execution & Orchestrator-as-Decomposer (One Substrate, Two Modes) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 23-parallel-execution-orchestrator-as-decomposer-one-substrate-two-modes
**Areas discussed:** 23/24 scope seam, queue.wip_limit config, Orchestrator redefinition, WR-05 inversion mechanics

---

## 23/24 scope seam

| Option | Description | Selected |
|--------|-------------|----------|
| A — dual-running spine | Phase 23 rewires only the execution machinery; roles keep writing handoffs; Phase 24 deletes them | ✓ |
| B — converged now | step-4 replaces handoff production immediately; forces pulling MIGR-01's bulk rewire into 23 | |

**User's choice:** Option A (dual-running) — *"confirm, although i prefer no handoffs."*
**Notes:** User's preference for no handoffs recorded as a directional decision. Phase 23 adds no new
handoff coupling and makes context notes the authoritative memory; Phase 24's handoff removal is the
prioritized next step. Two discretion calls: (#2) convergence proof = fixture/spine-level test in 23,
full real-role dogfood in Phase 26; (#3) rewired step-4 references WF17 (claim) + WF16 (note I/O),
never inlines — keeping claim mechanics single-sourced.

---

## queue.wip_limit config

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level `queue` object | New `queue: { wip_limit, claim_cap, stale_ttl_minutes }` sibling to `wip_limits` | ✓ |
| Nest width cap inside `wip_limits` | Reuse the per-column WIP key for the new width concept | |

**User's choice:** Top-level `queue` object; fold in `claim_cap` now; surface `stale_ttl` as a dial now.
**Notes:** Defaults `wip_limit: 3 / claim_cap: 2 / stale_ttl_minutes: 30` accepted as a starting point —
*"ok for now, we need to test with dogfood and if needed adjust later. It would be nice if user can
configure these."* They are config keys (user-configurable by design); Phase 26 measurement informs
tuning. `queue.wip_limit` (concurrent width) documented as independent from per-column `wip_limits`
(board flow).

---

## Orchestrator redefinition

| Option | Description | Selected |
|--------|-------------|----------|
| Surgical augmentation | Keep + repurpose the classification/routing matrix; add decompose/schedule/gate + Agent grant + no-relay | ✓ |
| Fuller rewrite | Retire router language entirely | |

**User's choice:** Augmentation. Now-running projection = **separate derived `.grugops/queue` view**.
Caveman prompt's ~4 added lines approved.
**Notes:** The now-running view is a deterministic, zero-token, freshness-gated render of
`claimed/*/claim.md` (mirrors the Phase-20 `index.md` render), NOT folded into `plans/board.md`.

---

## WR-05 inversion mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Coordinator detection | `coordinator: true` frontmatter marker (✓) vs filename hard-coded in guard | ✓ marker |
| Assertion strength | Both-direction (coordinator must / non-coordinator must-not) (✓) vs negative-only | ✓ both |
| Allowlist | Explicit enumerated `Agent(grugops-<role>, …)` (✓) vs broad `Agent` | ✓ enumerated |
| Atomic flip set | The ~7-file coordinated change | ✓ (Claude's judgment) |

**User's choice:** `coordinator: true` marker; both-direction assertion; explicit enumerated allowlist;
flip set left to Claude's judgment.
**Notes:** Flip set = guard (+ `.js` + test) · WR-05 wording oracle in `check-uat-oracles.ts` ·
`_role-switch-protocol.md` "No Agent tool" absolute · packaging templates · `adapters.md` + `README.md`
5-tool tables (asymmetric) · orchestrator adapter · `generate-catalog.ts`. The inversion is asymmetric:
only Claude Code's coordinator changes; the four non-spawning CLIs keep "no spawn."

## Claude's Discretion

- Convergence-proof level (chose fixture/spine-level for 23).
- step-4 reference-vs-inline (chose reference WF17 + WF16).
- The exact atomic flip-set file list (WR-05 area #4).
- Derived-artifact filenames/placement, `stale_ttl` key/unit, the spawnable-role enumeration, WF17
  section shape, and whether the now-running render needs its own freshness gate.

## Deferred Ideas

- Handoff deletion + 18-role/16-workflow bulk rewire + traceability migration → Phase 24 (prioritized).
- Real-role dual-path equivalence oracle + token-cost measurement → Phase 26.
- Heartbeat/advisory-lease claim liveness → v2.x (PAR-05).
- `isolation: worktree` ↔ shared-context-path interaction → `UNKNOWN - verify` (Phase 26 dogfood).
- Default (`3/2/30`) tuning → Phase 26 measurement.
