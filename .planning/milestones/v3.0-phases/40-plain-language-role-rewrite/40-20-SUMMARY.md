---
phase: 40-plain-language-role-rewrite
plan: 20
subsystem: audit
tags: [style-dispositions, cr-01, d-30-stand-in, named-human-read, safety-sentences, gap-closure]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "carriesSafetyFact over SAFETY_RULE_FACTS (plan 40-19); the orchestrator lean-close rewrite (plan 40-17); the row-file shape (plan 40-13) and the named-human read shape (plan 40-16)"
provides:
  - "docs/audit/29-style-dispositions/40-20.md: 36 rows covering the 52 Phase 40 safety clauses the narrowed D-30 stand-in will hold back, each accepted by the named human"
  - "A recorded owed-row listing that mirrors the gate's two stand-in admission points and prints `owed 0 structural 0 ordinary 0`"
affects: [40-21, phase-40-verification]

actuals:
  tokens: 5530
  tasks: 3
  commits: 2
plan_head_before: f2a945265659033948b615c20071d69aaef97d24
plan_head_after: e6272c7ba8db521c59db8ca6b8ab9106aabc8fba

tech-stack:
  added: []
  patterns:
    - "Rows written before the gate is narrowed, so the live gate never goes red; the narrowing plan then proves completeness with the real gate"
    - "Disposition cells hold `pending (named human): <agent comparison>` until a named reply, then `accepted by <name>:` with the comparison kept as advice"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-20.md
  modified: []

key-decisions:
  - "The named human (Olger, 2026-11-03) accepted all 36 Phase 40 safety-sentence rows (reply: `accept-all, Olger`); no row is flagged, so plan 40-21 has no CR-01 follow-ups to copy into deferred-items.md"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "Every Phase 40 safety clause the narrowed stand-in will hold back has a matching row (frozen-section rows with a filled companion), so the listing owes nothing"
    requirement: PLAIN-03
    verification:
      - kind: command
        ref: "owed-row listing (node --input-type=module, recorded in 40-20.md) prints `owed 0 structural 0 ordinary 0`, exit 0"
        status: pass
      - kind: command
        ref: "node scripts/check-diff-disposition.js exits 0, ALL CHECKS PASSED, no refusal naming 40-20.md"
        status: pass
      - kind: command
        ref: "scratchpad adjacency check: 0 rows covering nothing or with a wrong companion, 0 owed clauses uncovered"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every disposition is the named human's, with name, date and the verbatim reply recorded"
    requirement: PLAIN-03
    verification:
      - kind: command
        ref: "grep -c 'pending (named human)' docs/audit/29-style-dispositions/40-20.md prints 0; 36 of 36 role rows carry `accepted by`; grep -c '^Read by: ' prints 1"
        status: pass
    human_judgment: true
    rationale: "Whether each row truly keeps or tightens its rule is the named human's judgment; the record shows the reply, not the reasoning behind it"

duration: "Task 1 on 2026-11-02, checkpoint answered and Tasks 2-3 closed on 2026-11-03"
completed: 2026-11-03
---

# Phase 40 Plan 20: Phase 40 safety-sentence disposition rows, read by a named human Summary

**36 disposition rows covering all 52 Phase 40 safety clauses that plan 40-21's narrowed D-30 stand-in will refuse, each accepted by Olger on 2026-11-03 ("accept-all, Olger"); the owed-row listing went from 52 to 0 and check-diff-disposition stays green.**

## Performance

- **Started:** 2026-11-02 (Task 1, commit 91180e43)
- **Completed:** 2026-11-03
- **Tasks:** 3 of 3 (Task 2 was a `blocking-human` decision answered by the named human)
- **Files modified:** 1 (`docs/audit/29-style-dispositions/40-20.md`, created)

## Accomplishments

- Listed the owed clauses with the shipped `carriesSafetyFact` and the gate's own exports (`changedClauses`, `deriveFrozenSet`, `readDispositionRows`, `isCompanionFilled`). Before the rows, on HEAD `f2a94526`: `owed 52 structural 35 ordinary 17`, over 10 role files. That is 54 at planning time minus the two orchestrator lean-close clauses plan 40-17 replaced. 62 changed role clauses carry a safety fact; 10 already matched older rows.
- Wrote 36 rows. 24 are in frozen `## Hard limits` / `## Stop when` sections and cover 35 clauses, each with a companion cell. 12 are outside frozen sections, cover 17 clauses, and have `—` as the companion.
- After the rows: `owed 0 structural 0 ordinary 0`. `node scripts/check-diff-disposition.js` exits 0 (ALL CHECKS PASSED). The adjacency check finds no row covering nothing and no owed clause uncovered.
- Recorded the named human's read. All 36 cells read `accepted by Olger:` with the agent's comparison kept. `## Named-human read` gives "Read by: Olger, 2026-11-03" and quotes the reply verbatim:

  > accept-all, Olger

## Task Commits

1. **Task 1: list the safety clauses and write one row per clause or reword pair** - `91180e43` (docs)
2. **Task 2: the named human disposes of the rows** - checkpoint, no commit (reply: `accept-all, Olger`)
3. **Task 3: record the dispositions, name, date and verbatim reply** - `e6272c7b` (docs)

## Files Created/Modified

- `docs/audit/29-style-dispositions/40-20.md` - the CR-01 rows (seven-column table), the listing command, the before and after totals, and `## Named-human read`

## Flagged rows for plan 40-21

None. The human accepted every row, so there is no "Open follow-ups (CR-01 rows)" section and nothing to copy into `deferred-items.md`.

## Decisions Made

- The human's reply accepts all rows, so each cell gets the `accepted by Olger:` prefix. The agent's comparison stays after the colon as advice.
- The record says plainly that no row is flagged, so plan 40-21 knows there are no follow-ups to carry.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Ready for plan 40-21. It wires `carriesSafetyFact` into the two stand-in admission points and re-proves with the real gate that this row set is complete. If the wired gate names a clause this listing missed, 40-21 adds the row here and asks the human to read that row.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/40-20.md
- FOUND: 91180e43 (ancestor of HEAD)
- FOUND: e6272c7b (ancestor of HEAD)
- `pending (named human)` count 0; `accepted by` on 36 of 36 role rows; one `Read by:` line
- Listing `owed 0 structural 0 ordinary 0`; check-diff-disposition exit 0
- No changes under `agent-factory/`, `scripts/` or `docs/audit/29-style-dispositions/00-base.md`
