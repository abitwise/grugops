---
phase: 37-overview-board-per-file-records-and-budgets
plan: 14
subsystem: roles
tags: [roles, trace-render, nfr, board-overview, split-03, split-02, split-01, prose]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-06/37-07/37-08 the trace render (tools/grugops/trace-render.js) that builds the trace index and per-ticket trace files from published note refs; 37-13 the v3 seed NFR index form and the board OVERVIEW rules"
provides:
  - "Ten role files whose `## Trace updates` section publishes refs on a note per Workflow 16 and says the trace file and trace index are rendered by tools/grugops/trace-render.js, with hand edits overwritten"
  - "Architect/Design authors each NFR as memory-bank/plans/nfr/NFR-xxx.md with one hand-kept index line in nfr-catalog.md (D-13)"
  - "Security/NFR, Release Manager and Incident Responder read NFR targets from the files the index lists; Release Manager attaches evidence in the NFR file"
  - "orchestrator.md Board moves points at the contract's overview rule, and its Reads line names the trace index and per-ticket trace files"
affects: [37-15, 37-18, 37-19, 40]

actuals:
  tokens: 6081
  tasks: 3
  commits: 3
plan_head_before: d3397dbf91a918fe01c8e55c9e22fd19b89575aa
plan_head_after: 252efa5021f8ab98e5c6e18d58b0018c1e84ecb5

tech-stack:
  added: []
  patterns:
    - "A role's trace section names the refs the role publishes and the program that renders them; it never names a write verb next to the trace path"

key-files:
  created: []
  modified:
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/incident-responder.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/system-analyst.md

key-decisions:
  - "The size budget a role must stay within is its guard_role_size FAIL ceiling. orchestrator.md (7359 B, ceiling 7570) and incident-responder.md (3666 B, ceiling 3802) moved into the WARN tier; no existing text was trimmed to offset, because the plan limits edits to the mechanical minimum and Phase 40 owns the prose rewrite"
  - "orchestrator.md uses a shorter form of the rendered-by sentence (trace-render.js renders the trace file and index and overwrites hand edits) to keep its growth to 260 bytes"
  - "The overview sentence says one row per ticket, under its column, matching the contract's wording, instead of the plan's 'one row per ticket per column'"

patterns-established:
  - "Trace section form: `Publish <role refs> as refs on a note per Workflow 16, with the ticket identifier among the refs.` followed by the rendered-by-trace-render sentence"

requirements-completed: [SPLIT-03, SPLIT-02, SPLIT-01]

coverage:
  - id: D1
    description: "None of the ten edited role files pairs a write verb with traceability or names a traceability row, matrix or column; every role but the switch protocol keeps a `## Trace updates` heading"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "grep -liE '<37-18 scan pattern>' over the ten roles | wc -l -> 0; grep -c '^## Trace updates' agent-factory/roles/*.md | grep -c ':1$' -> 17"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict (ROLE_SECTIONS prefix check) -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Architect/Design authors NFRs one file each with a hand-kept index line; the three reader roles read targets from the NFR files and Release Manager attaches evidence there"
    requirement: SPLIT-02
    verification:
      - kind: other
        ref: "grep -c 'nfr/NFR-' agent-factory/roles/architect-design.md -> 1"
        status: pass
    human_judgment: true
    rationale: "Whether the NFR sentences read clearly to a host agent is a reading judgment; the gates check only structure and wording rules"
  - id: D3
    description: "orchestrator.md states the board overview rule in Board moves and reads the trace through the index"
    requirement: SPLIT-01
    verification:
      - kind: other
        ref: "grep -c '## Blocked' agent-factory/roles/orchestrator.md -> 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every generator re-run with no derived file changed, and every freshness and prose gate exits 0"
    verification:
      - kind: other
        ref: "npm run generate:{adapters,catalog,skill-twins,host-entries}; npm run freshness:{adapters,catalog,skill-twins,host-entries}; npm run freshness; node scripts/check-{imperative-lexicon,banned-claims,claim-anchors,kit-refs,public-docs-vocabulary,foundation-guards,state-paths}.js -> all exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Targeted regression: the 46 test files that name an edited role, plus the 12-file census set, show no failure outside 37-BASELINE.md"
    verification:
      - kind: unit
        ref: "npx vitest run over the 45 git-grep-derived files plus scripts/validate.test.ts (shard 1/4, then three explicit groups of 9 and one of 7), and the 12 census files"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 14: Ten role prompts publish trace refs on notes, author NFRs one file each, and state the board overview rule Summary

**Ten role prompts no longer tell an agent to append to the trace. Each `## Trace updates` section names the refs that role publishes on a note per Workflow 16, and says that `tools/grugops/trace-render.js` renders the ticket's trace file and the trace index from those refs and overwrites hand edits. Architect/Design now writes each NFR as its own file with one hand-kept index line. The Orchestrator states the board overview rule where it describes board moves.**

## Performance

- **Duration:** about 25 min, most of it the targeted test run
- **Started:** 2026-10-22T16:55:14Z
- **Completed:** 2026-10-22T17:20:00Z
- **Tasks:** 3 (Task 1 the tracer)
- **Files modified:** 10

## Accomplishments

- **Task 1, the tracer (Software Engineer):**
  - The heading is now `## Trace updates`. The old parenthetical named the monolithic trace file.
  - The body publishes the PR or branch, the files changed and the tests added as refs on an `artifact-ref` note, with the ticket identifier among the refs.
  - All four generators ran and changed no derived file, so no generated surface reads this section. Every gate exited 0.
- **Task 2, the four NFR roles:**
  - Architect/Design publishes the ADR ids and the NFR ids touched. Its Output line now says each NFR the design adds is its own file, `memory-bank/plans/nfr/NFR-xxx.md`. The author adds one line for it to `nfr-catalog.md` by hand, in the form the catalog's comment shows. Its Reads line calls the catalog the NFR index.
  - Security/NFR publishes the NFR ids reviewed and the gate result. It reads each target from the NFR file the index lists, and checks performance against that file's target.
  - Release Manager publishes the `REL-xxxx` id with each ticket in the release among the refs. It reads targets from the NFR files and attaches NFR evidence in each NFR file.
  - Incident Responder publishes the incident and follow-up ticket ids with the affected release and tickets among the refs. It reads NFR/SLO targets from the NFR files the index lists.
- **Task 3, the Orchestrator and four more roles:**
  - The Orchestrator's `## Board moves` gains one sentence that points at `agent-factory/contracts/board.md` § Overview and budgets. The rule it names:
    - one row per ticket, under its column;
    - blocked reasons and other detail in the ticket body's `## Blocked` and `## Board notes`;
    - one `_Updated:` line, replaced in place;
    - the newest Done row first.
  - The Orchestrator's Reads line names the trace index and the per-ticket trace files it links. Its trace section publishes the requirement-to-ticket link and the routing or close decision.
  - QE/E2E publishes the tests added and the QE result. UAT Planner publishes the UAT id, the result and the human signoff. BA/PM publishes the requirement, epic and feature ids for each new ticket. System Analyst publishes the analyzed behavior.

## Task Commits

1. **Task 1: Software Engineer trace section (tracer)** - `fc88e515` (docs)
2. **Task 2: the four NFR roles** - `81130208` (docs)
3. **Task 3: the Orchestrator overview rule and four more roles** - `252efa50` (docs)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `agent-factory/roles/software-engineer.md`, `qe-e2e.md`, `uat-planner.md`, `ba-pm.md`, `system-analyst.md`: the trace section only.
- `agent-factory/roles/architect-design.md`: the trace section, the NFR-per-file Output line and the NFR index Reads entry.
- `agent-factory/roles/security-nfr.md`, `release-manager.md`, `incident-responder.md`: the trace section and the NFR read (and, for Release Manager, the evidence) sentences.
- `agent-factory/roles/orchestrator.md`: the trace section, the overview sentence in Board moves, and the trace index Reads line.
- No derived file changed. The adapter, catalog, skill-twin and host-entry generators all ran after each task and produced no diff.

### Role sizes (guard_role_size, measured 2026-10-22)

| Role | Before | After | WARN | FAIL |
|------|--------|-------|------|------|
| software-engineer.md | 3584 | 3639 | 3697 | 3906 |
| architect-design.md | 3661 | 3809 | 4016 | 4243 |
| security-nfr.md | 5018 | 5022 | 4830 | 5102 |
| release-manager.md | 4100 | 4165 | 4510 | 4765 |
| incident-responder.md | 3596 | 3666 | 3598 | 3802 |
| orchestrator.md | 7099 | 7359 | 7165 | 7570 |
| qe-e2e.md | 3671 | 3706 | 3617 | 3822 |
| uat-planner.md | 3379 | 3447 | 3350 | 3540 |
| ba-pm.md | 3704 | 3781 | 3901 | 4180 |
| system-analyst.md | 3025 | 3077 | 3000 | 3170 |

security-nfr, qe-e2e, uat-planner and system-analyst were already in the WARN tier. incident-responder and orchestrator entered it with this plan. Every file stays under its FAIL ceiling, and no ceiling was changed.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- The FAIL ceiling is the size budget. Two roles entered the WARN tier, and no other text was trimmed to offset that.
- The Orchestrator uses a shorter form of the rendered-by sentence.
- The overview sentence follows the contract's wording, "one row per ticket, under its column".

## Deviations from Plan

None that changed scope. Two wording adjustments are recorded as decisions above: the shorter rendered-by sentence in the Orchestrator, and the contract's row wording.

**Note on the plan's "Keep orchestrator.md within its existing size":** the overview sentence and the longer trace sentence add 260 bytes. The file is now 7359 bytes, inside its 7570-byte FAIL ceiling and above its 7165-byte WARN line. Getting back under the WARN line would mean cutting text this plan does not own (the coordinator hard-limit paragraph or the routing matrix). The orchestrator.md size obligation from v2.0 still stands, and Phase 40's prose rewrite is the place to settle it.

## Issues Encountered

- The first targeted run used `--shard=1/4` and took 562 s for 12 files, close to the 600 s call limit. The vitest reporter does not name the files in a shard, so the 12 files were found by repeating vitest's own shard order (SHA-1 of each path, then sorted). `vitest list` over those 12 returned 1745 tests, which matches the run. The other 34 files then ran as explicit groups of 9, 9, 9 and 7.
- The targeted run failed on exactly the 37-BASELINE cases: 7 in `scripts/context-io.test.ts` and 2 in `scripts/context-io-writer-set.test.ts`. No other test failed.
- Another project's vitest was running on the machine (`grugops-examples-cli-chess-example`). It was not touched.

## Verification

- All four generators ran after each task. `freshness:adapters`, `freshness:catalog`, `freshness:skill-twins`, `freshness:host-entries` and `npm run freshness` exit 0.
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` exits 0 (ALL CHECKS PASSED).
- `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-public-docs-vocabulary`, `check-foundation-guards` and `check-state-paths` all exit 0.
- Acceptance criteria, all re-run after the last edit:
  - The Task 1 greps print 0, 1 and 1.
  - The 37-18 scan pattern over the ten roles matches no file.
  - `nfr/NFR-` appears once in architect-design.md.
  - 17 roles carry `## Trace updates`.
  - `## Blocked` appears once in orchestrator.md.
- No markdown file holds a control byte.
- The targeted run covered the 45 git-grep-derived test files plus `scripts/validate.test.ts`, then the census files the derived set missed: `board-readonly`, `check-state-paths`, `nonblocking-reader-parity`, `check-imperative-lexicon`, `check-claim-anchors`, `check-banned-claims`, `catalog-freshness`, `adapters-freshness`, `skill-twins-freshness`, `host-entries-freshness`, `generate-skill-twins` and `install/host-entry-docs`. The only failures were the 9 baseline cases above.
- No installer ran, and `~/.grugops` is unchanged (same four entries, same dates, before and after).

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 37-15 finishes the other seven roles with the same section form.
- Plan 37-18 does the kit docs and lands the permanent scan test. Workflow 16's own `## Trace updates` still says the invoking workflow appends its own rows, and that is 37-18's to fix.

## Self-Check: PASSED

- All ten modified files exist.
- Commits `fc88e515`, `81130208` and `252efa50` are ancestors of HEAD.
- `git rev-list --count d3397dbf..HEAD` returns 3 before this SUMMARY's commit.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
