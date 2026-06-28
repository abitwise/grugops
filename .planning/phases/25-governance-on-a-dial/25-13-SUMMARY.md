---
phase: 25-governance-on-a-dial
plan: 13
status: interim-executor-handoff
note: NOT a closure verdict — the orchestrator authors the closure/gaps verdict from the independent red-teams (no-fabrication, D-12)
---

# Phase 25 Plan 13: GAP-R7-1 round-8 — INTERIM executor handoff (NOT a closure)

**Tasks 1–3 complete; HARD-STOPPED at blocking checkpoint 25-13-04; SC1 closure NOT declared; orchestrator red-teams pending.**

This is an INTERIM handoff written by the authoring executor. It is explicitly NOT a
pass/closure verdict. Per the plan's `<output>` and the D-12 lesson (a green author suite
has been necessary-but-insufficient 12 straight times), the closure or gaps_found verdict
MUST be authored by the orchestrator from ≥2 independent bash-grounded opus red-teams +
orchestrator self-reproduction against the COMMITTED `.js`. The author suite below is green
but does not, on its own, close SC1.

## What was built (Tasks 1–3)

- **Task 1 (Lever-1, commit `a521444`):** Added exported `normalizeKind(raw)` in
  `scripts/context-io.ts` — the single kind authority, byte-identical to `parseNote`'s
  persisted trim semantics. `parseNote`, `isGatedNote`, the admission-guard hook, and the
  admission-server boundary all consult it. The hook normalizes the kind once at the source;
  the server enforces `NOTE_KINDS` at the boundary (normalize-then-treat-consistently).
- **Task 2 (Lever-2, commit `444b839`):** `admit()`'s D-04 now classifies severity via the
  single-source `isHighSeverityRole(scalars.by ?? "")` instead of an inline weaker
  `.trim().toLowerCase()` membership test. Deliberate, recorded unfreeze; `ADMIT_FROZEN_SHA256`
  re-pinned to the new span hash with a round-8 rationale in the freeze comment.
- **Task 3 (proof + rebuild, commit `4c54354`):** Held-out RED→GREEN cases vs the committed
  `.js` (hook Lever-1 + end-to-end Lever-2 + kind×by structural sweep + ledger-honesty
  positives + enum-at-boundary). Rebuilt the committed `.js`; captured `25-13-RED-baseline.txt`
  and `25-13-GREEN-proof.txt`.

## Verification evidence (author suite — necessary, NOT sufficient)

- New admit() span hash (re-pinned `ADMIT_FROZEN_SHA256`): `dbf66ac76f577ce848b9f6c2d3422ba39694c9c7a775c4524e8976ee4893ebf7` (prior `b7998cbd…be3d`); freeze test GREEN at the new baseline.
- Single-source greps: `normalizeKind` consulted in context-io.ts (5), admission-guard.ts (2), admission-server.ts (2); the ONLY `HIGH_SEVERITY_ROLES … .includes(...)` site is inside `isHighSeverityRole` (1).
- RED→GREEN vs the committed `.js`: Lever-1 hook ALLOW→DENY; Lever-2 end-to-end ADMITTED+ledger`routine` → REFUSED + 0 ledger lines.
- Gates: `npm run freshness` 0 drift (22 `.js` fresh); `git diff --quiet hooks/guard.ts` exit 0, hash `3501810e21308e4b7e219679a6ca30dace9b5d66`; `liveTokens` grep = 0; SC2 `cmp` byte-identical; full non-e2e suite 778 passed / 1 skipped (pre-existing runtime conditional; no source-level skips).

## What the executor did NOT do (by design)

- Did NOT run Task 4 / dispatch the red-teams (orchestrator's job).
- Did NOT self-approve or declare SC1 closure.
- Did NOT flip the ROADMAP, did NOT mark GOV-01/GOV-02 complete, did NOT edit STATE.md/ROADMAP.md/REQUIREMENTS.md.
- Did NOT author a closure/gaps verdict — that is the orchestrator's, from the red-teams.

## Self-Check: PASSED

- Commits exist: `a521444`, `444b839`, `4c54354` (verified in `git log`).
- Files exist: `25-13-RED-baseline.txt`, `25-13-GREEN-proof.txt` (captured in the phase dir).
