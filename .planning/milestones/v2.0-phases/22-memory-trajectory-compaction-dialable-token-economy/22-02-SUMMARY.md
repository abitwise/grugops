---
phase: 22-memory-trajectory-compaction-dialable-token-economy
plan: 02
subsystem: docs
tags: [compaction, workflow, single-source, role-pointer, catalog, foundation-guard]

# Dependency graph
requires:
  - phase: 21-verify-before-write-admission-the-14-gate-as-the-un-cheatabl
    provides: WF16 admission rules + the §14-gate, the WF16 one-line role-pointer pattern, the refuse/escape-hatch posture
  - plan: 22-01
    provides: scripts/compactor.ts carve-out checker + the context.compaction dial WF18 references
provides:
  - agent-factory/workflows/18-context-compaction.md — the single-source two-tier compaction protocol (clear voice, order:18)
  - the one-line WF18 pointer in all 17 role files (D-10 additive pattern)
  - generate-catalog.test.ts bumped 17->18 workflows + "context compaction" in WORKFLOW_NAMES
  - regenerated docs/catalog/README.md (WF18 row, byte-fresh)
  - re-baselined guard_role_size ceilings for the 5 roles the WF18 pointer pushed over
affects: [phase-23-parallel-fan-out, phase-24-deep-rewiring-and-validator-floor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-source workflow + one-line role pointer (D-10): WF18 authored once, referenced (not restated) by every role"
    - "Reference-not-restate: WF18 names WF16 + 05-pr-quality-gate.md for the admission rules / self_fix_attempts loop instead of copying them"
    - "Additive role pointer re-baselines guard_role_size per-role ceilings to new-baseline +12%/+6% (the Phase-21 WF16-pointer convention)"

key-files:
  created:
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/22-memory-trajectory-compaction-dialable-token-economy/22-02-SUMMARY.md
  modified:
    - scripts/generate-catalog.test.ts
    - docs/catalog/README.md
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/frontend-ui.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/incident-responder.md
    - agent-factory/roles/installer.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/uat-planner.md
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js

key-decisions:
  - "WF18 keeps order:18 despite WF17 being absent on disk (00-16 present) — generator tolerates the gap, validator floor stops at 13; NOT renumbered to 17 (it would collide with the Phase-23 WF17 deliverable — Pitfall 2)"
  - "WF18 references WF16 admission rules + 05-pr-quality-gate.md self_fix_attempts loop rather than restating them (D-10 single-source)"
  - "The WF18 pointer tripped guard_role_size on 5 near-ceiling roles — re-baselined their ceilings to +12%/+6% mirroring the locked Phase-21 WF16-pointer convention (D-07: ceilings are locked, not derived)"

patterns-established:
  - "WF18 single-source compaction protocol: body=agent / structure=tool seam, two ephemeral/committed tiers, dial=body-verbosity-only, un-dialable carve-out, sanctioned appendNote write path, re-verify via admit() + honest degrade-to-claim"

requirements-completed: [CMP-03]

# Metrics
duration: 8min
completed: 2026-06-18
status: complete
---

# Phase 22 Plan 02: Context Compaction Protocol (WF18 + role pointers + catalog) Summary

**Authored `agent-factory/workflows/18-context-compaction.md` — the single-source, clear-voice two-tier compaction protocol that owns the agent's semantic body-compression behavior and hands structure off to Plan 01's `compactor.ts` carve-out check and the `admit()` re-verify — wired it into all 17 roles with the cheap one-line WF18 pointer, and defused the catalog-count landmine (17→18 workflows) so the freshness gate stays green.**

## Performance

- **Duration:** ~8 min
- **Tasks:** 3 (+1 in-scope deviation fix)
- **Files modified:** 24 (2 created, 22 modified)

## Accomplishments
- **SC4 / CMP-03 — WF18 single-source protocol:** `18-context-compaction.md` exists with `order: 18` (NOT renumbered despite the missing WF17 — Pitfall 2), clear professional voice (trace/safety/token surface), and the full WF16 section shape (`## When to use` / `## Steps` / `## Stop conditions` / `## Done condition` / `## Commit`). It documents the body/structure seam (D-01), the two ephemeral/committed tiers (CMP-01/D-07/D-08), the write-after-verify/handback primary trigger + opportunistic mid-task secondary (D-11), the three dial behaviors as body-verbosity-only with an un-dialable carve-out (D-04/D-05), the sole `appendNote` write path (D-02.3), and the `admit()` re-verify + honest degrade-to-`claim` with `confidence: UNKNOWN - verify` (D-12). It **references** WF16 and `05-pr-quality-gate.md` for the admission rules and the bounded `self_fix_attempts` loop — it restates none of them (D-10).
- **17 role pointers (D-10):** every role file carries one new `Compaction:` pointer line to WF18, placed directly after its existing WF16 pointer; `_role-switch-protocol.md` is untouched (it carries no WF16 pointer). No role restates the protocol — pointer only.
- **Catalog landmine defused (Pitfall 1):** `generate-catalog.test.ts` now asserts `countRowsLinkingInto(text, "workflows")).toBe(18)` (roles stay `toBe(17)`), with `"context compaction"` in `WORKFLOW_NAMES`; `docs/catalog/README.md` was regenerated (not hand-edited) and includes the WF18 row; `freshness:catalog` is green.
- **Guard re-baseline (in-scope deviation):** the additive WF18 pointer pushed 5 near-ceiling roles over `guard_role_size`; their per-role ceilings were re-baselined to new-baseline +12%/+6% exactly as Phase 21 did for the WF16 pointer.

## Task Commits

Each task committed atomically:

1. **Task 1: Author 18-context-compaction.md (single-source protocol, clear voice)** — `4160d43` (feat)
2. **Task 2: Catalog landmine — bump generate-catalog.test.ts 17→18 + regenerate catalog** — `b9ff2d3` (test)
3. **Task 3: Add the one-line WF18 pointer to all 17 role files** — `946df5b` (docs)
4. **Deviation fix: re-baseline guard_role_size ceilings for the WF18 pointer** — `9c32946` (fix)

## Files Created/Modified
- `agent-factory/workflows/18-context-compaction.md` — new single-source compaction protocol (order:18, clear voice)
- `scripts/generate-catalog.test.ts` — workflow count 17→18, `"context compaction"` added to `WORKFLOW_NAMES`, header/test-name comments updated (roles stay 17)
- `docs/catalog/README.md` — regenerated with the WF18 row (byte-fresh vs the generator)
- `agent-factory/roles/*.md` (17 files) — one WF18 pointer line each, adjacent to the WF16 pointer
- `scripts/check-foundation-guards.ts` + `.js` — `roleCeiling()` re-baselined for the 5 roles the WF18 pointer pushed over; committed `.js` rebuilt and freshness-checked

## Decisions Made
- **`order: 18` despite no WF17 on disk:** the generator sorts by `order` and tolerates the 16→18 gap; the validator floor stops at 13. Renumbering to 17 would collide with the Phase-23 WF17 deliverable (Pitfall 2). Kept 18.
- **Reference-not-restate:** WF18 names WF16 (admission rules) and `05-pr-quality-gate.md` (the `self_fix_attempts` loop) and points; it copies neither, so there is one protocol, not a drift-prone fork (D-10, mitigates T-22-06/T-22-07).
- **Guard ceiling re-baseline over trimming role prose:** the ceilings are locked constants that are intentionally bumped when a single-source pointer lands (the documented Phase-21 precedent). Re-baselining to +12%/+6% is the established convention; trimming unrelated role prose to "fit" would be scope creep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Re-baselined guard_role_size ceilings broken by the WF18 pointer**
- **Found during:** Task 3 verification (the full regression lane after committing the 17 role pointers).
- **Issue:** The one-line WF18 pointer (~160 B) pushed 5 already-near-ceiling roles (`agents-md-scribe`, `architect-design`, `compliance-officer`, `installer`, `release-manager`) over their locked `guard_role_size` per-file byte ceilings, turning `check-foundation-guards.js` red (3 failing test cases, including the real-tree smoke test). This is a direct, in-scope consequence of the plan's Task-3 pointer — the identical collateral Phase 21 handled when it added the WF16 pointer.
- **Fix:** Re-baselined the 5 roles' FAIL/WARN ceilings in `roleCeiling()` to new-baseline +12%/+6%, annotated `+Phase-22 WF18 pointer` exactly like the `+Phase-21 WF16 pointer` entries. Rebuilt the committed `.js`; freshness green.
- **Files modified:** `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`
- **Commit:** `9c32946`

The plan's PLAN.md did not list `check-foundation-guards.ts` in `files_modified`, but the re-baseline is mechanically required by the plan's own Task-3 pointer (the same way Phase 21's plan handled the WF16-pointer collateral). Documented here as the single deviation.

## Issues Encountered
- None beyond the guard re-baseline above. The catalog regeneration writes only `docs/catalog/README.md` (its `tsc` output goes to the gitignored `.tmp-build/`), so no stray `.js` drift.

## User Setup Required
None — no external service configuration, zero external packages installed (zero-host-runtime-dep, D-13/D-15).

## Known Stubs
None — WF18 is a complete single-source protocol; the role pointers are intentional one-liners (the D-10 pattern), not stubs.

## Self-Check: PASSED

- `agent-factory/workflows/18-context-compaction.md` present on disk; `order: 18`, exact H1, references WF16 + `05-pr-quality-gate.md`, not renumbered to 17.
- All 17 role files carry exactly one WF18 pointer (`grep -rln '18-context-compaction.md' agent-factory/roles/ | grep -v _role-switch-protocol | wc -l` = 17); `_role-switch-protocol.md` unmodified.
- `docs/catalog/README.md` includes the `18-context-compaction.md` row; `npm run freshness:catalog` green.
- `npx vitest run scripts/generate-catalog.test.ts` → 5 passed (18-workflow count + `context compaction` name).
- `npx vitest run --exclude '**/scripts/e2e/**'` → 227 passed, 1 skipped, 0 failed.
- `node scripts/check-foundation-guards.js` → ALL CHECKS PASSED.
- `npm run build && npm run freshness` → 17 committed `.js` fresh.
- All four task commits exist: `4160d43` (feat), `b9ff2d3` (test), `946df5b` (docs), `9c32946` (fix).

---
*Phase: 22-memory-trajectory-compaction-dialable-token-economy*
*Completed: 2026-06-18*
