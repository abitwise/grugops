---
phase: 13-frontend-ui-persona-design-build-workflow
plan: 02
subsystem: ui
tags: [workflow, frontend-ui, wcag-2.2-aa, reference-not-restate, single-source, design-contract]

# Dependency graph
requires:
  - phase: 13-01
    provides: "frontend-ui.md (17th role, design-authority/contract-only) — the persona this workflow routes activation to"
  - phase: 04 (workflow)
    provides: "04-ticket-to-pr.md — the engineering build loop this workflow references, never restates"
  - phase: 04 (workflow)
    provides: "05-pr-quality-gate.md — the single-source backpressure gate this workflow references for verification"
provides:
  - "agent-factory/workflows/14-ui-design-to-build.md — the practice-level, tool-neutral UI design→build workflow (UI-02)"
  - "The SC2 sequence walked once: design contract → component build → five states → accessibility → visual baseline"
affects: [13-03 (orchestrator wiring + guard registration adds ui-build → 14-ui-design-to-build.md), phase-15 (gate convergence — UI/E2E tooling lands in 05 step 3/4)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reference-not-restate: workflow 14 names 04 (build) + 05 (gate) by filename using 04's verbatim '…live there — this workflow references that … and does not restate it' phrasing; never inlines their loops"
    - "Tool-neutral workflow body: WCAG 2.2 AA is the only named standard; zero tool names (no Playwright/toHaveScreenshot/axe-core/vitest)"
    - "Append-not-insert workflow ordinal: order: 14 added without renumbering the frozen 00-13"

key-files:
  created:
    - agent-factory/workflows/14-ui-design-to-build.md
  modified: []

key-decisions:
  - "No Phase-15 forward-pointer in the workflow body (Open Question 2 — body stays clean and tool-neutral)"
  - "Reference accessibility-checklist.md for the a11y item list rather than re-enumerating (single-source, D-09); the checklist itself was left untouched"
  - "Branch policy delegated to the sequential-execution contract: committed on main as directed by the orchestrator (the workflow's own ## Commit section still mandates branch-guard-first / never-merge / never-deploy for grugops's users)"

patterns-established:
  - "Pattern 1: Two reference-not-restate links per workflow (build via 04, verify via 05) — the load-bearing single-source discipline"
  - "Pattern 2: Tool-neutral practice body + one named standard (WCAG 2.2 AA) in clear voice — tooling deferred"

requirements-completed: [UI-02]

# Metrics
duration: 7min
completed: 2026-06-11
---

# Phase 13 Plan 02: UI Design-to-Build Workflow Summary

**New workflow 14-ui-design-to-build.md (order 14, cadence both) walks design contract → component build → five states → WCAG 2.2 AA accessibility → visual baseline, tool-neutrally, referencing workflows 04 (build) and 05 (gate) by filename instead of restating their loops.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-11T19:23Z
- **Completed:** 2026-06-11
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments
- Authored `agent-factory/workflows/14-ui-design-to-build.md` as workflow 14 — appended, not renumbering the frozen 00-13 ordinals (the acceptance grep confirms exactly 14 files match the 00-13 prefix).
- Walked the full SC2 practice sequence: design contract (from the product `## Acceptance scenarios` + implementation-ready packet + architecture-handoff when present) → component build → five states (loading/empty/error/success/partial-data) → WCAG 2.2 AA accessibility → tool-neutral visual baseline → verification at the gate.
- Implemented the reference-not-restate discipline (D-03): two filename references — `04-ticket-to-pr.md` for the build and `05-pr-quality-gate.md` for verification — using 04's verbatim "…references that … and does not restate it" phrasing, plus a third reference to `accessibility-checklist.md` for the a11y item list.
- Kept the body tool-neutral (D-08): zero tool names; WCAG 2.2 AA is the only named standard (D-09), in clear professional voice.
- Carried the verbatim `_role-switch-protocol.md` no-spawn one-liner in `## Agents involved`; mirrored 04/05's terse closing sections (Board moves / Handoffs produced / Trace updates / Done condition / Commit) with the branch-guard-first, never-merge/never-deploy line.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 14-ui-design-to-build.md** - `0b7f7c8` (feat)

**Plan metadata:** committed with this SUMMARY + STATE.md + ROADMAP.md (docs commit)

## Files Created/Modified
- `agent-factory/workflows/14-ui-design-to-build.md` - The UI design→build workflow: practice-level, tool-neutral, references 04+05, names WCAG 2.2 AA as the only standard, carries the no-spawn role-switch line (UI-02).

## Decisions Made
- **No Phase-15 forward-pointer** in the workflow body — Open Question 2 resolved to "stay clean"; the body names no tooling and no future phase, only the tool-neutral practice.
- **Reference, don't edit, the a11y checklist** — `accessibility-checklist.md` is pointed to for the item list (semantic structure/labels, keyboard/focus, contrast, alt text, form labels); the checklist file itself was left untouched (D-09 single-source satisfied by naming WCAG 2.2 AA in the new artifact + referencing the hub).
- **Branch policy** — committed on `main` per the orchestrator's sequential-execution contract (worktree isolation deliberately disabled for this run); the workflow's own `## Commit` section still mandates branch-guard-first / `grugops/ui-design-to-build-<id>` / never-merge / never-deploy for grugops's end users.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The first acceptance-grep run printed blank `PASS/FAIL` cells for some checks due to an inline-subshell rendering quirk in the verification harness (not a content problem); a re-run with per-check `if grep -q` confirmed all six string checks plus the five-states regex PASS and the tool-neutral count is 0.

## Verification
- All 10 task acceptance criteria PASS: file exists; `order: 14`; `cadence: both`; five states walked; `WCAG 2.2 AA`; references `04-ticket-to-pr.md` + `05-pr-quality-gate.md` + `_role-switch-protocol.md`; tool-neutral count = 0; frozen 00-13 ordinals = 14 (unchanged).
- Gate step-labels (`install -> lint -> typecheck`) confirmed ABSENT — single-source held, the gate loop is not paraphrased.
- `sh scripts/check-foundation-guards.sh` exits 0 (`ALL CHECKS PASSED`); the new workflow file breaks no guard. Pre-existing advisory WARNs on ba-pm/qe-e2e/software-engineer role sizes are unchanged and not failures.

## Self-Check: PASSED

## Next Phase Readiness
- Workflow 14 exists and is referenced-ready for Plan 13-03, which wires the orchestrator (`ui-build` classification + routing-matrix row + workflow-map row `| ui-build | 14-ui-design-to-build.md |` + "15"→"16" count) and the foundation-guard registration. Plan 13-03 must also raise the orchestrator `role_ceiling()` (Pitfall 2: ~3B/380B headroom) in the same edit as the wiring.
- No blockers. The frozen 00-13 ordinals are intact; the gate (05) remains the single source of the backpressure loop.

---
*Phase: 13-frontend-ui-persona-design-build-workflow*
*Completed: 2026-06-11*
