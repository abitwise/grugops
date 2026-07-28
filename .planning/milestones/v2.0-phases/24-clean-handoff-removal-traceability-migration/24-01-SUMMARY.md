---
phase: 24-clean-handoff-removal-traceability-migration
plan: 01
subsystem: infra
tags: [handoff-removal, shared-context, wf16, role-prose, packaging, agents-md, guard_context_writes]

# Dependency graph
requires:
  - phase: 20-shared-verified-context
    provides: Workflow 16 (context read/write protocol) + the typed-note schema roles now publish into
  - phase: 23-parallel-execution-orchestrator-as-decomposer
    provides: decompose→enqueue sequencing (the relay's replacement) + guard_wr05 coordinator marker
provides:
  - All 18 roles + 3 packaging templates + AGENTS.md rewired off static handoff packets onto WF16 typed notes
  - _role-switch-protocol.md step 4 is the task-done consolidation seam (D-02) — the call site Plan 24-03 trace render rides
  - Zero agent-factory/handoffs/ and plans/handoffs/ references across the role + packaging surface (the role half of the Stage-2 grep-to-zero)
affects: [24-02 (workflow half of grep-to-zero), 24-03 (trace render rides the step-4 seam), 24-05 (Stage-2 template deletion + grep flip)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Roles PULL shared context per Workflow 16 and PUBLISH typed notes (decision/finding/observation/artifact-ref + refs), never push a curated packet to a named successor"
    - "Reference Workflow 16 by name in prose; keep exactly one full `16-context-read-write` path token per role (the Context I/O footer) to satisfy the VFY-03 single-source test"
    - "Kit-vs-state invariant blockquote keeps the SC2 marker 'STOP — do not hunt' byte-identical across all 4 canonical sites while its handoff sentence is replaced with the WF16 reference"

key-files:
  created: []
  modified:
    - agent-factory/roles/_role-switch-protocol.md (step 4 consolidation seam; invariant reframed)
    - agent-factory/roles/orchestrator.md (decompose→enqueue owns sequencing; reads notes per WF16)
    - agent-factory/roles/software-engineer.md, qe-e2e.md (+ 11 more roles: Output → typed notes)
    - agent-factory/packaging/adapters.md, slash-command.template.md, subagent.frontmatter.md
    - AGENTS.md (Mission + Role/workflow files + kit-vs-state reframed; 7046 B)
    - docs/catalog/README.md (regenerated — content drift)

key-decisions:
  - "Restored the canonical kit-vs-state SC2 marker in orchestrator.md ('STOP — do not hunt') — a pre-existing drift that failed check-kit-refs SC2 at the phase baseline (840bcc6)"
  - "New Output/Reads WF16 references use the name 'Workflow 16' (no path token) so each role keeps exactly one `16-context-read-write` path — preserves the VFY-03 single-source contract"

patterns-established:
  - "Pattern 1: typed-note publishing replaces handoff-packet writing in every role Output section (D-05/D-06)"
  - "Pattern 2: no successor-naming relay directive survives (D-07); only advisory finding/observation that does not name who acts"

requirements-completed: [MIGR-01]

# Metrics
duration: 64min
completed: 2026-06-22
status: complete
---

# Phase 24 Plan 01: Stage-1 role + packaging handoff removal Summary

**All 18 roles, the 3 packaging templates, and AGENTS.md rewired off static handoff packets onto Workflow 16 typed-note publishing — zero `agent-factory/handoffs/` / `plans/handoffs/` / `frontend-handoff` references, guard_context_writes green, AGENTS.md under the Codex cap.**

## Performance

- **Duration:** ~64 min
- **Started:** 2026-06-22T19:12:00Z (approx)
- **Completed:** 2026-06-22T20:16:11Z
- **Tasks:** 3
- **Files modified:** 19 (18 kit files + regenerated catalog)

## Accomplishments
- `_role-switch-protocol.md` step 4 ("Produce the handoff") rewritten into the task-done consolidation seam (D-02): do the one job, then publish typed notes per WF16 — the natural call site the Plan 24-03 trace render will ride. The invariant reframed to "the shared verified context is the only memory."
- All 18 roles reach zero `agent-factory/handoffs/`, `plans/handoffs/`, and `frontend-handoff` references; the 3 already-clean roles (installer, greenfield-mapper, brownfield-mapper) verified still 0 (no orphan, Pitfall 1 closed).
- The 3 packaging templates + AGENTS.md reach zero `handoff` substring; AGENTS.md stayed at 7046 B (well under the 32768 B Codex cap and the guard's 28672 B FAIL tier).
- guard_context_writes (WR-01 / D-10) and all foundation guards stayed GREEN; guard_wr05 unaffected (fenced coordinator example untouched); check-kit-refs went from a pre-existing 1-FAIL to ALL CHECKS PASSED.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire role-switch step 4 + 3 heaviest roles** - `948b534` (refactor)
2. **Task 2: Mention-remove the remaining 11 roles + verify 3 already-clean** - `76e23be` (refactor)
3. **Task 3: Rewire 3 packaging templates + AGENTS.md** - `83f9f20` (refactor)

_Task 2 also carried the orchestrator SC2-marker bug fix; Task 3 carried the cross-role WF16 path-dedup + catalog regeneration (both Rule-3 fixes to satisfy test contracts touched by the rewrite)._

## Files Created/Modified
- `agent-factory/roles/_role-switch-protocol.md` - step 4 is now the pull-context / publish-notes consolidation seam (D-02); invariant = shared verified context
- `agent-factory/roles/orchestrator.md` - decompose→enqueue owns sequencing; reads role notes per WF16; SC2 marker restored; Output = typed notes
- `agent-factory/roles/software-engineer.md`, `qe-e2e.md`, `uat-planner.md`, `system-analyst.md`, `security-nfr.md`, `release-manager.md`, `frontend-ui.md`, `factory-coach.md`, `compliance-officer.md`, `architect-design.md`, `incident-responder.md`, `ba-pm.md`, `agents-md-scribe.md` - Reads pull shared context per WF16, Output sections publish typed notes
- `agent-factory/packaging/adapters.md` - "same handoffs" → "same shared context"
- `agent-factory/packaging/slash-command.template.md`, `subagent.frontmatter.md` - kit-vs-state invariant reframed (SC2 marker kept byte-identical), release skill "hand off to" → "activate"
- `AGENTS.md` - Mission/Role-files/kit-vs-state reframed to WF16; 7046 B
- `docs/catalog/README.md` - regenerated (content drift from the role/packaging edits)

## Decisions Made
- New Output/Reads WF16 references use the name "Workflow 16" (no path token); the single full `16-context-read-write` path per role lives in the Context I/O footer — preserves the VFY-03 single-source contract.
- The pre-existing orchestrator SC2-marker drift (`STOP.` vs the canonical `STOP — do not hunt.`) was fixed while the line was being edited anyway — brings check-kit-refs fully green at zero risk (the other 3 sites already carried the canonical marker).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored canonical kit-vs-state SC2 marker in orchestrator.md**
- **Found during:** Task 2 (after the role rewrites, check-kit-refs SC2 reported a marker-missing FAIL)
- **Issue:** orchestrator.md's kit-vs-state blockquote read `If the kit dir is absent, STOP.` while the canonical SC2 marker (byte-identical at the other 3 sites — AGENTS.md, the orchestrator adapter, SKILL.md) is `If the kit dir is absent, STOP — do not hunt.`. Confirmed pre-existing by running check-kit-refs against a pristine `git archive` of the phase baseline (840bcc6) — it failed there too, before any of my edits.
- **Fix:** Restored the canonical marker clause; trimmed compensating bytes elsewhere in my edits to hold the orchestrator role byte ceiling (7562 B < 7570 B FAIL).
- **Files modified:** agent-factory/roles/orchestrator.md
- **Verification:** `node scripts/check-kit-refs.js` → ALL CHECKS PASSED (SC2 marker present at all four canonical sites); foundation guards green.
- **Committed in:** 76e23be (Task 2 commit)

**2. [Rule 3 - Blocking / VFY-03 contract] Deduplicated WF16 path references across the 17 roles**
- **Found during:** Task 3 (full unit regression after the rewrites)
- **Issue:** `admission-protocol-docs.test.ts` VFY-03 asserts each of the 17 canonical roles contains *exactly one* `16-context-read-write` path token (single-source). My Output/Reads rewrites added a second path token on top of the existing Context I/O footer, failing 12 role assertions.
- **Fix:** Stripped the parenthetical `(\`agent-factory/workflows/16-context-read-write.md\`)` from the new Output/Reads sentences, leaving "Workflow 16" by name; the single full path token now lives only in the Context I/O footer.
- **Files modified:** all 17 role files (the Reads/Output sentences)
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**'` → 451 passed; per-role `grep -o 16-context-read-write | wc -l` = 1 for every role.
- **Committed in:** 83f9f20 (Task 3 commit)

**3. [Rule 3 - Blocking / DOCS-02 catalog freshness] Regenerated docs/catalog/README.md**
- **Found during:** Task 3 (full unit regression — `generate-catalog` / `catalog-freshness` byte-reproducibility tests failed)
- **Issue:** The docs catalog is generated from role/workflow content; the rewrites changed that content, so the committed catalog drifted and the freshness gate failed RED.
- **Fix:** Ran `node scripts/generate-catalog.js` to regenerate the committed catalog from the rewritten sources.
- **Files modified:** docs/catalog/README.md
- **Verification:** Catalog freshness + byte-reproducibility tests pass; full suite 451 green.
- **Committed in:** 83f9f20 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 pre-existing bug fix, 2 blocking test-contract / freshness fixes)
**Impact on plan:** All three were necessary to land the rewrite without regressing a committed test contract or the SC2 marker; none expanded scope beyond the plan's role + packaging surface. The deviations are corrections WITHIN the plan's files, not new functionality.

## Issues Encountered
- Several role byte ceilings (orchestrator, security-nfr) sat close to their guard_role_size limits before the phase; the typed-note prose is slightly longer than the handoff prose, so I trimmed each rewritten sentence to hold every ceiling. Final: all roles within their FAIL tiers (some at WARN, which does not fail the build).

## User Setup Required
None - no external service configuration required (markdown-only rewrite, `[no-install]`).

## Next Phase Readiness
- Role + packaging half of the Stage-2 grep-to-zero is complete (this plan). Plan 24-02 supplies the workflow half; only when BOTH land can Plan 24-05 flip the check-kit-refs Assertion-2 gate and delete the 17 templates.
- The `_role-switch-protocol.md` step-4 consolidation seam is in place for Plan 24-03's trace render to ride.
- No blockers. guard_context_writes is green on all rewritten prose, so the WR-01 false-positive watch is clear for this surface.

## Self-Check: PASSED

- SUMMARY.md present at `.planning/phases/24-clean-handoff-removal-traceability-migration/24-01-SUMMARY.md`
- Commits 948b534, 76e23be, 83f9f20 all present in git log
- Key modified files present on disk
- Plan verification block: handoffs=0, frontend-handoff=0, foundation guards exit 0, AGENTS.md 7046 B (<32768), check-kit-refs PASS

---
*Phase: 24-clean-handoff-removal-traceability-migration*
*Completed: 2026-06-22*
