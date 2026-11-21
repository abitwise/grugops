---
phase: 37-overview-board-per-file-records-and-budgets
plan: 17
subsystem: workflows
tags: [workflows, trace-render, split-03, prose]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-16 the trace section form (a role publishes refs on a note per Workflow 16, the note names the ticket, the render builds the trace) and the ten workflows it rewrote"
provides:
  - "WF06, WF07, WF11, WF14 and WF15 name which role publishes which refs on a note per Workflow 16 and say the trace render turns them into each ticket's trace file and index line"
  - "WF08, WF10 and WF17 publish no refs of their own and say the trace is rendered from published refs; WF17's invoking-workflow sentence names the roles publishing refs and the render adding them"
  - "WF18 forbids hand-editing a trace file; one sentence changed, every bound phrase intact"
  - "No workflow in agent-factory/workflows/ matches the 37-18 hand-trace scan pattern; every edited Commit section names the rendered trace files"
affects: [37-18, 37-19]

actuals:
  tokens: 6955
  tasks: 2
  commits: 2
plan_head_before: f5b6b6904a512f00c208905d3f0b504a6d8ab4d2
plan_head_after: 08762bbb55c3fcdf57dc782b3cbfcbec0b64d2d7

tech-stack:
  added: []
  patterns:
    - "Same trace section form as 37-16. A workflow that publishes nothing says so, and says the trace is rendered from the refs other workflows' notes published"

key-files:
  created: []
  modified:
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/workflows/08-sprint-planning.md
    - agent-factory/workflows/10-sprint-review.md
    - agent-factory/workflows/11-retro.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/workflows/15-security-audit.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md

key-decisions:
  - "WF06 names tools/grugops/trace-render.js by path, so the plan's artifact check for the literal trace-render holds; the other eight say the trace render"
  - "The old trace Status column is dropped from WF06, WF07, WF11, WF14 and WF15: the rendered trace has no Status column (scripts/trace-model.ts TRACE_COLUMNS), and status stays on the board"
  - "WF10's sprint review confirms refs in the rendered trace file and sends a missing ref back to the role that owns it, which publishes it on a note"
  - "WF18 keeps its stale path mention and its 'never removes a row' sentence because the plan allows one sentence of change there; 37-18 or a later plan can reword them"

patterns-established:
  - "A workflow that publishes no refs: `None of its own. <whose refs the trace is rendered from>.`"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "Five workflows (UAT pack, backlog refinement, sprint planning, sprint review, retro) publish refs or say they publish none, and their Commit sections name the rendered trace files"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "grep -liE '<37-18 scan pattern>' over WF06/07/08/10/11 | wc -l -> 0 (baseline 4); grep -ci 'carries its row' 08-sprint-planning.md -> 0 (baseline 1); grep -c trace-render 06-uat-pack.md -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "WF14, WF15, WF17 publish refs or none; WF18's one sentence changed and its bound phrases still pass their tests"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "scan pattern over all git-tracked agent-factory/workflows/*.md: grep exit 1 (no file matches; baseline 17 files); grep -ci 'appended by the invoking workflow' 17-task-claim.md -> 0; 19 workflows keep one ## Trace updates heading"
        status: pass
      - kind: unit
        ref: "npx vitest run over the 7 test files git grep derives from the nine workflow names, plus scripts/validate.test.ts: 1599 passed, 9 failed (all 37-BASELINE: 2 in context-io-writer-set, 7 in context-io)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generators re-run with no derived file changed; every freshness, validator and prose gate exits 0; the census set passes"
    verification:
      - kind: other
        ref: "npm run generate:{catalog,adapters,skill-twins,host-entries}; npm run freshness; freshness:{catalog,adapters,skill-twins,host-entries,traceability}; VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict; check-{imperative-lexicon,banned-claims,claim-anchors,kit-refs,public-docs-vocabulary,foundation-guards,state-paths} -> all exit 0"
        status: pass
      - kind: unit
        ref: "census set, 25 files in two sequential groups: 1209 passed, 1 skipped, 0 failed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten trace sections read clearly to a host agent"
    verification:
      - kind: other
        ref: "reading review of git diff f5b6b690..08762bbb"
        status: pass
    human_judgment: true
    rationale: "Whether the sentences read clearly is a reading judgment; the gates check structure and wording rules only"

duration: 10min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 17: The last nine workflows publish trace refs on notes, and no workflow edits the trace by hand Summary

**The UAT pack, backlog refinement, retro, UI design-to-build and security audit workflows now each name the role that publishes their refs on a note per Workflow 16, and say the trace render turns those refs into each ticket's trace file and index line. Sprint planning, sprint review and task claim publish no refs of their own and say the trace is rendered from refs other workflows published. Workflow 18 changes one sentence: never hand-edit a trace file to preserve a trace the compaction broke. No workflow file matches the hand-trace scan pattern any more.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-22T18:06:02Z
- **Completed:** 2026-10-22T18:15:19Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- **Task 1 (WF06, WF07, WF08, WF10, WF11):**
  - WF06: the UAT Planner publishes the `UAT` link and the human signoff result as refs on a note. `tools/grugops/trace-render.js` turns them into the ticket's trace file and index line.
  - WF07: BA/PM publishes each refined ticket's epic, feature and NFR ids as refs.
  - WF08: "None of its own". Each committed ticket's trace file is rendered from refs its notes already published. "Carries its row" is gone.
  - WF10: sprint review publishes no refs. BA/PM confirms each accepted ticket's rendered trace file names its `UAT` ref and, where released, its release ref. A missing ref goes back to the role that owns it.
  - WF11: the Factory Coach publishes each `factory`-tagged improvement ticket ID as a ref on a retro note that also names the waste behind it.
  - The Commit sections of WF06, WF07, WF10 and WF11 name the rendered trace files. WF08's Commit section had no trace wording.
- **Task 2 (WF14, WF15, WF17, WF18):**
  - WF14: Frontend/UI publishes the design-contract link as a ref. The build (04) and gate (05) publish the code and test refs.
  - WF15: Security/NFR publishes the audit result and the reviewed ASVS requirement ids as refs.
  - WF17: ownership stays out of the trail ("the rendered trace records what was built and verified"). The invoking-workflow sentence now reads: "The invoking workflow's roles publish the refs on notes per Workflow 16, and the render adds them."
  - WF18: only "Never edit a traceability row to preserve a trace the compaction actually broke." changed, to "Never hand-edit a trace file to preserve a trace the compaction actually broke." No other byte of the paragraph changed (word diff: two words).
  - The Commit sections of WF14 and WF15 name the rendered trace files. The WF17 and WF18 Commit sections had no trace wording.

## Task Commits

1. **Task 1: five workflows publish trace refs; commit trail names the rendered trace files** - `e0e4451f` (docs)
2. **Task 2: WF14, WF15, WF17 publish refs; WF18 forbids hand-editing a trace file** - `08762bbb` (docs)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `agent-factory/workflows/06-uat-pack.md`, `07-backlog-refinement.md`, `10-sprint-review.md`, `11-retro.md`, `14-ui-design-to-build.md`, `15-security-audit.md`: Trace updates and one Commit phrase each.
- `agent-factory/workflows/08-sprint-planning.md`: Trace updates only.
- `agent-factory/workflows/17-task-claim.md`: two sentences of Trace updates.
- `agent-factory/workflows/18-context-compaction.md`: one sentence of Trace updates.
- No derived file changed. The catalog, adapter, skill-twin and host-entry generators ran after each task and produced no diff.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- WF06 names the render by its path, so the plan's `contains: "trace-render"` artifact check holds.
- The old trace `Status` column is dropped, because the rendered trace has none.
- WF18 keeps two older phrases ("`memory-bank/plans/traceability.md` is rendered from the admitted notes" and "A promotion never removes a row either") because the plan allows only one sentence of change there. Neither matches the scan pattern.

## Deviations from Plan

None. The plan ran as written, and no gate refused a draft.

## Issues Encountered

- The derived test run failed on exactly 9 37-BASELINE cases: 2 in `scripts/context-io-writer-set.test.ts` (31-14 decline enumeration) and 7 in `scripts/context-io.test.ts` (31-23 PROBE 5 and 31-29). No other test failed.

## Verification

- Generators: `generate:catalog`, `generate:adapters`, `generate:skill-twins` and `generate:host-entries` ran after each task. None changed a file.
- Freshness: `npm run freshness`, `freshness:catalog`, `freshness:adapters`, `freshness:skill-twins`, `freshness:host-entries` and `freshness:traceability` all exit 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` exits 0 (ALL CHECKS PASSED).
- Prose and guard gates exit 0: `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-public-docs-vocabulary`, `check-foundation-guards` and `check-state-paths`.
- Acceptance criteria, re-run after the last edit:
  - Task 1: the scan over the five workflows matches 0 files (baseline 4). `carries its row` count is 0.
  - Task 2: the scan over every tracked workflow exits 0, meaning grep matched no file (baseline 17). `appended by the invoking workflow` count is 0. 19 workflows keep exactly one `## Trace updates` heading.
- No edited markdown file holds a control byte (each file compared with a copy that has the C0 and DEL bytes stripped).
- Targeted run, sequential foreground calls, one worker, no full-suite run:
  - The 7 test files `git grep` derives from the nine workflow names, plus `scripts/validate.test.ts`: 1,599 passed, 9 failed. All 9 are 37-BASELINE.
  - Census set (adapter, catalog, skill-twin and host-entry generator and freshness tests, board-readonly, board-tracer, check-state-paths, nonblocking-reader-parity, checkpoints, the prose-gate tests, trace-model, trace-render, trace-freshness, voice-model, state-check and state-roll): 25 files, 1,209 passed, 1 skipped, 0 failed.
- No vitest process of this plan is left running.
- No installer ran. `~/.grugops` is unchanged: the same entries with the same dates, before and after.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 37-18 lands the permanent scan test (`scripts/trace-instructions.test.ts`). Every git-tracked workflow already passes its pattern.
- Plan 37-18 may reword WF18's older trace path mention (`memory-bank/plans/traceability.md`) and the "never removes a row" sentence. Neither matches the scan, so neither blocks.
- SPLIT-03 stays Pending in REQUIREMENTS.md, because later plans also declare it.

## Self-Check: PASSED

- All nine modified files exist.
- Commits `e0e4451f` and `08762bbb` are ancestors of HEAD.
- `git rev-list --count f5b6b690..HEAD` returns 2 before this SUMMARY's commit.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
