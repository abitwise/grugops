# Phase 24: Clean Handoff Removal & Traceability Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 24-clean-handoff-removal-traceability-migration
**Areas discussed:** Trace migration shape, Role Output → notes, Grep-to-zero + atomic cut, install --migrate UX

---

## Trace migration shape (MIGR-03)

| Option | Description | Selected |
|--------|-------------|----------|
| A — render + keep | `plans/traceability.md` survives as a deterministic, freshness-gated render of note `refs` (rides the task-done consolidation hook) | ✓ |
| B — delete + read-from-notes | Delete `traceability.md`; validator reads trace directly from note `refs` (purest decentralization) | |
| C — hand-maintained | Keep `traceability.md` hand-maintained, notes merely feed it | |

**Sub-decision — freshness posture:** freshness-gated **fail-closed** (stale trace trips the gate), not completeness-warning only.
**Sub-decision — row key/columns:** **ticket-keyed** rows (Claude's lean accepted), columns Requirement│Code│Tests│UAT│Release from note refs; validator completeness check re-points at the render.
**User's choice:** "1. A ; 2. yes ; 3. yes, select your lean"
**Notes:** Bias toward preservation + fail-closed because the trace is the proof.

---

## Role Output → typed notes (MIGR-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Relay fully dead | Delete handoff "Next agent/Next action"; Orchestrator owns sequencing; advisory finding/observation the only residue | ✓ |
| Several typed notes | One-kind-per-file notes per role-run, not a renamed mega-packet | ✓ |
| Uneven rewire depth | Full Output-section conversion where present, mention-removal elsewhere; all 18 roles → zero refs | ✓ |

**User's choice:** "1. yes ; 2. yes ; 3. I'm fine yes"
**Notes (verbatim sidenote — became the headline principle):** *"The idea is to produce software without large one-off handoffs, but rather have work output for each role and each role knows what they need to do in the large-scale workflow. Context for each role can be gathered based on its need how to solve the task."* → encoded as **pull-not-push**: job from workflow+subtask, role pulls context on-demand, publishes work as typed notes. Also locked: roles reference WF16, never restate (keeps `guard_context_writes` WR-01 green); clean cut, no transitional dual-write.

---

## Grep-to-zero + atomic cut (MIGR-01/02)

| Option | Description | Selected |
|--------|-------------|----------|
| Repurpose check-kit-refs Assertion 2 | Flip "every handoff ref is an allowed template" → "ZERO handoff refs" (explicit SCAN set, no repo-wide grep) | ✓ |
| New guard_no_handoffs | Add a fresh foundation guard in check-foundation-guards.ts | |

**Sub-decision — atomicity:** one atomic deletion change (17 templates incl. un-frozen `frontend-handoff.md` + validator `FROZEN_HANDOFFS`/trace re-point + catalog + gate flip + uat-oracles + fixtures), with a **both-direction adversarial proof vs the committed `.js`** (planted handoff ref fails RED).
**Sub-decision — fixtures:** delete `scripts/fixtures/*/agent-factory/handoffs/` in the same change.
**User's choice:** "1. repurpose assertion 2 (your lean) ; 2 yes ; 3 yes"
**Notes:** Mirrors the Phase-23 WR-05 atomic-flip discipline; green suite ≠ proof.

---

## install --migrate UX (MIGR-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone --migrate flag | New explicit flag, never auto/silent | ✓ |
| Fold into --update | Migration runs as part of the existing update track | |

**Sub-decision — content conversion:** **no conversion** — back up the directory only, do not parse legacy handoffs into notes.
**Sub-decision — installer behavior:** backup-not-delete (`plans/handoffs.bak-<ISO8601>/`), never clobber (abort on collision), dry-run capable, idempotent, reversible (`git revert` + backup dir).
**User's choice:** "1. standalone (your lean) ; 2. yes ; 3. yes"
**Notes:** A routine update must never silently mutate a user's `plans/` state.

---

## Claude's Discretion

- Trace render function location (`context-io.ts` extension vs new `trace-render.ts`) and whether it shares `freshness:context` or gets its own gate.
- Exact note shapes per role + per-role Output-section wording (voice rules apply).
- Per-workflow rewire ordering across the 16 SDLC workflows.
- ISO8601 precision in the backup dir name.
- Per-task-done vs Orchestrator-batch invocation of the trace render (so long as fail-closed freshness holds).

## Deferred Ideas

- Real-role dual-path equivalence oracle + token-cost measurement → Phase 26 (DOGF); A3/DOG-02 retires only on a passing oracle.
- `context.human_admission` / `context.audit_retention` governance dials → Phase 25.
- Heartbeat / advisory-lease claim liveness → v2.x (PAR-05).
