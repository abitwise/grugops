---
phase: 35-graph-memory-decision-record
plan: 01
subsystem: planning-decisions
tags: [graph-memory, decision-record, key-decisions]

requires: []
provides:
  - "[v3.0, D-10] graph-memory decision record (35-DECISION.md): not adopted, nothing built, nothing reserved"
  - "One PROJECT.md Key Decisions pointer row [v3.0, D-10] directly after [v3.0, D-9], Outcome — Pending"
affects: [phase-37, phase-39, phase-40, phase-41, phase-42, phase-43]

actuals:
  tokens: 2420
  tasks: 2
  commits: 2
plan_head_before: 25de4abe1b7be2ef1e0f0c97cf7f70eab3a0b9cc
plan_head_after: 1caa31b60d711e1a1c95e0caa0c338787669c413

tech-stack:
  added: []
  patterns:
    - "Phase decision record in its own file, with one pointer row in PROJECT.md Key Decisions"

key-files:
  created:
    - .planning/phases/35-graph-memory-decision-record/35-DECISION.md
  modified:
    - .planning/PROJECT.md

key-decisions:
  - "[v3.0, D-10] Graph memory is not adopted and nothing is built; a user may run such a tool themselves, a role may read its output only as an exploration aid, the output never enters the shared context, and the decision reopens only when both trigger conditions in 35-DECISION.md hold"

patterns-established:
  - "Decision IDs that collide across milestones are always written with the milestone tag, e.g. [v3.0, D-10] vs [v2.0, D-10/D-11]"

requirements-completed: [GRAPH-01, GRAPH-02]

coverage:
  - id: D1
    description: "35-DECISION.md states graph memory is not adopted and nothing is built, names the five evaluated tools in a table from STACK.md section (d), and gives the posture and the both-conditions revisit trigger"
    requirement: "GRAPH-01"
    verification:
      - kind: other
        ref: "Task 2 acceptance greps (9 sections, 5 tool rows, LOW/UNKNOWN - verify per row, 2026-10-20, user may install, exploration aid)"
        status: pass
    human_judgment: true
    rationale: "Meaning of a prose record (no reservation, no schedule, no follow-up) is checked by reading, per the plan"
  - id: D2
    description: "The record states the verified_by stamp rule and carries no token-saving figure; vendors self-report, grugops has measured none"
    requirement: "GRAPH-02"
    verification:
      - kind: other
        ref: "grep verified_by / self-report / measured none; reader review of record and row"
        status: pass
    human_judgment: true
    rationale: "D-07: .planning/ is outside check-banned-claims, so the no-figure rule is checked by reading"
  - id: D3
    description: "PROJECT.md gains exactly one [v3.0, D-10] row directly after [v3.0, D-9], pointing to 35-DECISION.md, Outcome — Pending"
    verification:
      - kind: other
        ref: "Task 1 acceptance greps (row count 1, line after D-9, path count 1)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-10-20
status: complete
---

# Phase 35 Plan 01: Graph-memory decision record Summary

**[v3.0, D-10] recorded: five graph/code-index tools evaluated from STACK.md section (d), graph memory not adopted, nothing built or reserved, posture and verified_by stamp rule written only in 35-DECISION.md, reopened only when both event-based trigger conditions hold.**

## Performance

- **Duration:** about 2 min (measured wall clock, 2026-10-20T13:52:37Z start)
- **Tasks:** 2/2
- **Files:** 1 created, 1 modified (both under `.planning/`)

## Accomplishments

- `35-DECISION.md` with the title, status line (as of 2026-10-20, facts not re-checked, labels kept), and the nine sections: Decision, Origin, Tools evaluated (as of 2026-10-20), Why it is not adopted, What a user and a role may do, Verification-stamp rule, Vendor claims, When to revisit, Not to be confused with.
- One PROJECT.md Key Decisions row `[v3.0, D-10]` on the line directly after `[v3.0, D-9]`, three cells, Outcome `— Pending`, pointing to the record by repo-root path. Inserted with a scoped Edit (1 line added, nothing else in PROJECT.md changed).

## Task Commits

1. **Task 1 (tracer): ledger row leads to a record that says not adopted, nothing built** - `561138c2`
2. **Task 2: tools table, reasons, posture, stamp rule, vendor claims, trigger, clarifier** - `1caa31b6`

Tracer gate: the Task 1 `<verify>` was re-run after the commit (both counts 1) before expanding into Task 2.

## Reader review (Task 2 step 2)

Read the whole record and the `[v3.0, D-10]` row and ran the aid grep on each (the row alone, never all of PROJECT.md). The row has no hit. The record's hits are all acceptable: negations (no reservation, no follow-up, no schedule or milestone-audit step, Phases 39-43 add nothing, "makes no claim about what that layer costs or spares"), the self-report sentence, trigger (b) and its measurement paragraph, and Serena's own LSP runtime. No figure of any kind is tied to tokens, cost or savings; the only digits in the row are the tag (3.0, 10), the path (35) and "Phase 37". No sentence asserts a saving for grugops, schedules a review, reserves a path or creates a follow-up. Wording adjusted while drafting: the index-layer sentence says the record "makes no claim about what that layer costs or spares" rather than using any saving verb.

## Label audit (D-08)

Each table row compared with STACK.md lines 133-139: Graphify has no label (its only STACK.md label sat on the vendor sentence, which is omitted whole; the fit cell ends at "(Python toolchain + native wheels)."); CodeGraph none; code-graph-rag keeps `LOW` on the Docker detail; Serena keeps `UNKNOWN - verify` on its license; the MCP memory server keeps `UNKNOWN - verify` on its repo license. No label added, dropped or upgraded. Serena's fit cell says only that it is not a fit and overlaps CC's (Claude Code's) LSP plugins. No third-party URL cited.

## Boundary and regression

- `git diff --name-only 4f282a25..HEAD -- . ':(exclude).planning/'`: empty. `git status --porcelain --untracked-files=all -- . ':(exclude).planning/'`: empty. `human-notes.txt` unchanged.
- `node scripts/check-uat-oracles.js` and `node scripts/check-nul-bytes.js`: both ALL CHECKS PASSED, exit 0. `npm test` was not run. No check script was written.
- Branch stayed `main`.

## For a human

REQUIREMENTS.md line 103 (the out-of-scope row "Adopting or building graph memory") says every candidate needs Python, SQLite or a graph DB. That is not true of the MCP memory server (Node + JSONL) or of CodeGraph's install (bundled binary or `npm i -g`, though it stores data in SQLite). The record gives the accurate per-tool reasons. REQUIREMENTS.md was not edited, because CONTEXT limits this phase to the record and one row.

## Deviations from Plan

None - plan executed exactly as written. The stamp-rule section cites PROJECT.md "Core Value" (where line 13 sits) instead of a bare line number, so the reference survives later edits.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: .planning/phases/35-graph-memory-decision-record/35-DECISION.md
- FOUND: .planning/PROJECT.md row `[v3.0, D-10]`
- FOUND: 561138c2, 1caa31b6 (ancestors of HEAD)
