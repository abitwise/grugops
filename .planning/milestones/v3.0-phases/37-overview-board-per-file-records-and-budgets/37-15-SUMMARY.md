---
phase: 37-overview-board-per-file-records-and-budgets
plan: 15
subsystem: roles
tags: [roles, trace-render, split-03, prose, commit-convention]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-14 the trace section form (refs on a note per Workflow 16, rendered by tools/grugops/trace-render.js) and its tracer through every generator and gate"
provides:
  - "The last seven role files publish refs on a note instead of editing the trace; no role file in agent-factory/roles/ matches the 37-18 scan pattern"
  - "agent-factory/_commit-convention.md names the rendered trace files in the trail it lists"
affects: [37-16, 37-17, 37-18, 37-19, 40]

actuals:
  tokens: 2849
  tasks: 2
  commits: 2
plan_head_before: 17961cfb4f93dc9c1fc6526a6dfb27cfd341634c
plan_head_after: 7b57129ef4d3ce3e38c85d63968e2e1fda32399f

tech-stack:
  added: []
  patterns:
    - "Size-tight roles use the Orchestrator's shorter rendered-by sentence; a role whose note names several tickets says each ticket's trace file"

key-files:
  created: []
  modified:
    - agent-factory/roles/frontend-ui.md
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/installer.md
    - agent-factory/_commit-convention.md

key-decisions:
  - "Frontend/UI and the two mappers use the shorter rendered-by sentence that orchestrator.md uses. With the long form, greenfield-mapper.md came to 3044 B against its 3045 B FAIL ceiling; the short form brings it to 2929 B, and brings frontend-ui.md back under its WARN line"
  - "Brownfield Mapper names each ticket the map seeds among the refs, and Greenfield Mapper publishes the proposed tickets themselves as refs, because the trace model drops a note that names no ticket (scripts/trace-model.ts: a note naming no ticket contributes nothing)"
  - "The two mappers and Factory Coach say each ticket's trace file, since one note names several tickets"

patterns-established:
  - "Trace section form, short variant: `Publish <role refs> as refs on a note per Workflow 16[, with the ticket identifier among the refs]. tools/grugops/trace-render.js renders the ticket's trace file and the trace index from those refs, and overwrites hand edits.`"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "No role file and not the commit convention pairs a write verb with traceability or names a traceability row, matrix or column; all 17 roles keep a `## Trace updates` heading"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "grep -liE '<37-18 scan pattern>' agent-factory/roles/*.md agent-factory/_commit-convention.md | wc -l -> 0; grep -c '^## Trace updates' agent-factory/roles/*.md | grep -c ':1$' -> 17"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict -> ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every generator re-run with no derived file changed; every freshness and prose gate exits 0; every role stays under its guard_role_size FAIL ceiling"
    verification:
      - kind: other
        ref: "npm run generate:{adapters,catalog,skill-twins,host-entries}; npm run freshness:{adapters,catalog,skill-twins,host-entries}; npm run freshness; node scripts/check-{imperative-lexicon,banned-claims,claim-anchors,kit-refs,public-docs-vocabulary,foundation-guards,state-paths}.js -> all exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Targeted regression over the 10 git-grep-derived test files plus the census set (35 files) shows no failure outside 37-BASELINE.md"
    verification:
      - kind: unit
        ref: "npx vitest run over five explicit groups of 7 files: 3,082 passed, 1 skipped, 9 failed (the 9 37-BASELINE cases in context-io and context-io-writer-set)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The new trace sentences read clearly to a host agent"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "reading review of the eight changed lines (git diff 17961cfb..HEAD)"
        status: pass
    human_judgment: true
    rationale: "Whether the wording reads clearly is a reading judgment; the gates check structure and wording rules only"

duration: 9min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 15: The last seven role prompts publish trace refs on notes, and the commit trail names the rendered trace files Summary

**No role prompt tells an agent to append to the trace any more. Frontend/UI, AGENTS.md Scribe, Brownfield Mapper, Greenfield Mapper, Compliance Officer, Factory Coach and Installer each name the refs they publish on a note per Workflow 16. Each says that `tools/grugops/trace-render.js` renders the trace file and the trace index from those refs and overwrites hand edits. `_commit-convention.md` lists "rendered trace files" in the trail where it said "traceability".**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-10-22T17:23:22Z
- **Completed:** 2026-10-22T17:32:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- **Task 1 (four roles):** each heading is now `## Trace updates`. The parenthetical that named the old single trace file is gone.
  - Frontend/UI publishes the design contract, with the ticket identifier among the refs.
  - AGENTS.md Scribe publishes the `AGENTS.md` substrate change and the commands, rules and safety lines it now reflects.
  - Brownfield Mapper publishes the map and the areas and risks it surfaced, with each ticket the map seeds among the refs.
  - Greenfield Mapper publishes the plan and the first tickets or slices it proposes.
- **Task 2 (three roles and the commit convention):**
  - Compliance Officer publishes the compliance result and the controls or gaps.
  - Factory Coach publishes the `factory`-tagged improvement ticket ids the retro creates.
  - Installer publishes the install or adapter request and its outcome.
  - `_commit-convention.md` line 9 now reads "tickets, board, rendered trace files, metrics, and context notes". The rest of the file is unchanged.

## Task Commits

1. **Task 1: Frontend/UI, AGENTS.md Scribe and the two mappers** - `39514a59` (docs)
2. **Task 2: the last three roles and the commit convention** - `7b57129e` (docs)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- The seven role files: the `## Trace updates` section only.
- `agent-factory/_commit-convention.md`: one word group in line 9.
- No derived file changed. The adapter, catalog, skill-twin and host-entry generators ran after each task and produced no diff.

### Role sizes (guard_role_size, measured 2026-10-22)

| Role | Before | After | WARN | FAIL |
|------|--------|-------|------|------|
| frontend-ui.md | 3787 | 3738 | 3757 | 3969 |
| agents-md-scribe.md | 3827 | 3949 | 4301 | 4544 |
| brownfield-mapper.md | 2643 | 2683 | 2693 | 2845 |
| greenfield-mapper.md | 2936 | 2929 | 2882 | 3045 |
| compliance-officer.md | 4355 | 4378 | 4555 | 4813 |
| factory-coach.md | 3595 | 3625 | 3633 | 3839 |
| installer.md | 3388 | 3458 | 3727 | 3938 |

frontend-ui.md moved out of the WARN tier. greenfield-mapper.md was already in it and got 7 bytes smaller. No role entered the WARN tier, and no ceiling was changed.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- The roles with little room use the Orchestrator's shorter rendered-by sentence.
- The mapper notes name tickets, because the render ignores a note that names no ticket.
- Where one note names several tickets, the sentence says each ticket's trace file.

## Deviations from Plan

None that changed scope. The plan asked for "the same sentence plan 37-14 used". Three roles use the shorter form that 37-14 itself used in orchestrator.md, to stay within the size budget the plan's must-haves require. Two roles and Factory Coach say "each ticket's" instead of "the ticket's". All three changes are recorded as decisions above.

## Issues Encountered

- The 37-BASELINE failures appeared and nothing else: 7 in `scripts/context-io.test.ts` and 2 in `scripts/context-io-writer-set.test.ts`.

## Verification

- All four generators ran after each task. `freshness:adapters`, `freshness:catalog`, `freshness:skill-twins`, `freshness:host-entries` and `npm run freshness` exit 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` exits 0 (ALL CHECKS PASSED).
- These gates all exit 0: `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-public-docs-vocabulary`, `check-foundation-guards` and `check-state-paths`.
- Acceptance criteria:
  - The Task 1 scan over the four roles prints 0.
  - The Task 2 scan over `agent-factory/roles/*.md` and `_commit-convention.md` prints 0. The baseline at HEAD was 18, and 37-14 had already cleared ten of them.
  - 17 roles carry `## Trace updates`.
- No edited markdown file holds a control byte.
- Targeted run: 35 files in five sequential foreground groups of 7, with one worker.
  - The 10 test files `git grep` derives from the changed file names.
  - `scripts/validate.test.ts`.
  - The census set: check-foundation-guards, check-state-paths, nonblocking-reader-parity, context-io-writer-set, board-readonly, the adapter, catalog, skill-twin, host-entry and voice tests, the prose-gate tests, and the trace-model, trace-render and trace-freshness tests.
  - The only failures were the 9 baseline cases.
- No installer ran. `~/.grugops` is unchanged: the same three entries with the same dates, before and after.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Every role prompt now publishes trace refs. Plans 37-16..37-18 cover the workflows and kit docs. Workflow 16's own `## Trace updates` still says the invoking workflow appends its own rows. 37-18 also lands the permanent scan test, which this plan's role and convention files already pass.

## Self-Check: PASSED

- All eight modified files exist.
- Commits `39514a59` and `7b57129e` are ancestors of HEAD.
- `git rev-list --count 17961cfb..HEAD` returns 2 before this SUMMARY's commit.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
