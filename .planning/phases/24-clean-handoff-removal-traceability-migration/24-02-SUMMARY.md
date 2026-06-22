---
phase: 24-clean-handoff-removal-traceability-migration
plan: 02
subsystem: agent-factory/workflows
tags: [handoff-removal, shared-context, wf16, grep-to-zero, validator]
requires:
  - agent-factory/workflows/16-context-read-write.md (the reference note-I/O protocol)
  - agent-factory/workflows/17-task-claim.md (note-native example)
  - agent-factory/workflows/18-context-compaction.md (note-native example)
provides:
  - "16 SDLC workflows (00-15) with zero agent-factory/handoffs/ references, recording role outputs as typed notes per Workflow 16"
  - "the workflow half of the grep-to-zero needed before Stage 2 (24-05) can flip check-kit-refs Assertion 2"
affects:
  - scripts/validate-agent-factory.ts (WORKFLOW_SECTIONS no longer requires ## Handoffs)
  - scripts/check-kit-refs.ts SCAN set (now handoff-free for the workflow surface)
tech-stack:
  added: []
  patterns:
    - "workflow names what work output a role records (typed notes) — never a handoff file to read/write (D-05/D-06)"
    - "reference Workflow 16 by name; never restate a raw .grugops/ write path next to a write token (D-10)"
    - "clean cut — 'Handoffs produced' sections removed entirely, no transitional dual-write (D-11)"
key-files:
  created: []
  modified:
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - agent-factory/workflows/01-bootstrap-brownfield.md
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/workflows/08-sprint-planning.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/10-sprint-review.md
    - agent-factory/workflows/11-retro.md
    - agent-factory/workflows/12-release.md
    - agent-factory/workflows/13-incident.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/workflows/15-security-audit.md
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
decisions:
  - "[24-02] Removing '## Handoffs' from the validator's WORKFLOW_SECTIONS list is in-scope here as a Rule-3 blocking-issue fix — the clean-cut (D-11) removal of every 'Handoffs produced' section directly broke the structural assertion; 24-05's validator work is scoped to FROZEN_HANDOFFS + the trace check and never mentioned WORKFLOW_SECTIONS, so this would otherwise be an orphan gap"
  - "[24-02] Legitimate planning artifacts (plans/sprints/SPRINT-xx.md, plans/releases/REL-xxxx.md, memory-bank/*) were KEPT — only handoff templates/instances were removed; these are not handoffs"
  - "[24-02] In 08/09/10/12/15 the former 'Handoffs produced' heading was renamed to '## Output' where a non-handoff artifact still exists (sprint file / release record / sweep report); in 00-07/11/13/14 it was removed entirely as it folded into Steps + Trace updates"
metrics:
  duration_minutes: 11
  tasks: 2
  files_changed: 18
  completed: 2026-06-22
status: complete
---

# Phase 24 Plan 02: Rewire 16 SDLC workflows off handoffs onto Workflow 16 Summary

Rewired all 16 SDLC workflows (00 through 15) off static handoff templates/instances and onto the shared verified context — each role now reads the verified context and records its results as typed notes (decision / finding / artifact-ref) per Workflow 16, driving the `agent-factory/handoffs/` reference count across the workflow surface to zero while keeping `guard_context_writes` green and the single-source §14 gate loop intact.

## What was built

- **Task 1 — the 4 heaviest workflows** (`00`, `04`, `05`, `14`): removed every "Handoffs produced" section and handoff template/instance reference; roles now reference Workflow 16 for note I/O. In `05-pr-quality-gate.md` the single-source §14 backpressure loop (`self_fix_attempts`, default 2) and the three terminal verdicts (`READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`) were preserved verbatim — only the handoff references were stripped. `14-ui-design-to-build.md` dropped its `frontend-handoff` mention so the 17th template (deleted in Stage 2 / Plan 24-05) has no workflow orphan (Pitfall 1).
- **Task 2 — the remaining 12 workflows** (`01`, `02`, `03`, `06`, `07`, `08`, `09`, `10`, `11`, `12`, `13`, `15`): same WF16 conversion. `12-release.md` keeps the named-human deploy gate verbatim, `13-incident.md` keeps the blameless postmortem framing, `15-security-audit.md` keeps the clear-voice `PASS | PASS_WITH_RISKS | BLOCKED` result — only handoff references were removed (the safety floor is untouched). `09-daily-sweep.md` now reconciles from the shared verified context instead of named handoff inputs.
- The 3 substrate workflows `16` / `17` / `18` were left byte-untouched — they are already note-native and are the reference shape, not a rewire target.

## How it works

Each rewired workflow now carries a single line under "## Agents involved": *each role reads the shared verified context before it works and records its results as typed notes (decision / finding / artifact-ref, with trace ids on refs) per `agent-factory/workflows/16-context-read-write.md`*. Step-level prose that previously said "fill the `<x>-handoff.md` template into `plans/handoffs/<ID>-<stage>.md`" now says "record the work as typed notes per Workflow 16". No workflow restates a raw `.grugops/` write path next to a write token (D-10), names a successor to act (D-07), or instructs a single mega-note (D-08).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `validate-agent-factory` required a `## Handoffs` workflow section**
- **Found during:** Task 2 verification (full unit suite)
- **Issue:** The structural validator's `WORKFLOW_SECTIONS` list asserted every workflow (00-13) contains a `## Handoffs` section. The plan's clean-cut removal of every "Handoffs produced" section (D-11) made all 14 fail that assertion — `validate-agent-factory.js` exited 1 with 14 missing-section errors, and 2 vitest cases (`validate.test.ts`) went red.
- **Fix:** Dropped `"## Handoffs"` from `WORKFLOW_SECTIONS` in `scripts/validate-agent-factory.ts` (with a comment recording the Phase-24 rationale) and rebuilt the committed `scripts/validate-agent-factory.js` via `tsc` so `npm run freshness` stays at 0 drift.
- **Scope note:** Plan 24-05 owns other `validate-agent-factory.ts` edits (dropping `FROZEN_HANDOFFS`, re-pointing the trace-completeness check), but its plan body never mentions `WORKFLOW_SECTIONS`. This `## Handoffs`-section removal is a direct consequence of THIS plan's workflow edits, so fixing it here (rather than leaving an orphan red gate for the next executor) is the correct ownership. 24-05 runs in wave 2 after this plan and will rebuild the `.js`, preserving this change.
- **Files modified:** `scripts/validate-agent-factory.ts`, `scripts/validate-agent-factory.js`
- **Commit:** `0bd4e78`

## Verification

| Check | Result |
|-------|--------|
| `grep -c agent-factory/handoffs/` across all workflows 00-18 | 0 (sum) |
| `grep -c agent-factory/handoffs` over substrate 16/17/18 | 0 (untouched) |
| no `plans/handoffs` leftover in any workflow | confirmed (zero matches) |
| no "Handoffs produced" section remains | confirmed (zero matches) |
| `grep -q self_fix_attempts` in 05-pr-quality-gate.md | pass (§14 loop intact) |
| `grep -c "frontend-handoff"` in 14 | 0 (Pitfall 1) |
| `grep -c "named human"` in 12-release.md | 4 (deploy gate preserved) |
| `node scripts/check-foundation-guards.js` | exit 0 (guard_context_writes green) |
| `node scripts/check-kit-refs.js` | exit 0 (Stage-2 flip not regressed) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `npm run freshness` | exit 0 (18 committed .js match a fresh rebuild) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 451 passed, 1 skipped, 0 failed |

## Known Stubs

None. The grep-to-zero for the workflow surface is intentionally only half of the cut-over — the `check-kit-refs.ts` Assertion 2 flip and the template deletion are Stage 2 (Plan 24-05), by design (D-12 two-stage cut-over). This is not a stub; it is the planned wave boundary, and `check-kit-refs.js` stays GREEN through it.

## Self-Check: PASSED

- modified files all present on disk (16 workflows + validator .ts/.js)
- commit `5d0b49b` (Task 1) and `0bd4e78` (Task 2) both in `git log`
