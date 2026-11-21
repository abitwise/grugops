---
phase: 40-plain-language-role-rewrite
plan: 08
subsystem: tooling
tags: [role-rule-inventory, board-move-partition, validator, role-sections, typescript, tdd]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "40-01 check-role-rules inventory and D-30 stand-in; 40-02 approved D-33 pair table; 40-03..40-07 the 19 rewritten roles and the protocol"
provides:
  - "check-role-rules --check: the board-move partition (rules 1-5) derived from role `## Board moves` code spans and the seed board table"
  - "BOARD_MOVE_EXCEPTIONS: the four D-33 Tech Lead pairs, each with a reason and its own test"
  - "check-role-rules --check: end-state role checks (D-35 two-sided, D-36 required facts, D-10 non-empty Stop when, D-08 heading order)"
  - "ROLE_SECTIONS requires `## Activates when` and `## Stop when` (D-09); 187 fixture role files carry both"
affects: [40-09, 40-10, phase-41, phase-42]

actuals:
  tokens: 49425
  tasks: 3
  commits: 6
plan_head_before: 7b1b4e90a6e3b63fecd81b418d1b922cbdd1c1da
plan_head_after: 558d2d926a4eec9faaf1c5373dbf8c8337ee5554

tech-stack:
  added: []
  patterns:
    - "Partition guard: flow, owners and terminal column derived from the board table; a short declared exception list made two-sided by a stale-entry rule"
    - "End-state checks run on the current tree only, beside a baseline inventory, adding no fact kind to the baseline derivation"

key-files:
  created: []
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/fixtures/*/agent-factory/roles/*.md (187 files)

key-decisions:
  - "A board Exit owner in parentheses ((raiser)) is outside the flow; any other owner that is no role's `# Role:` name fails the derivation closed, so a misspelt owner cannot silently shrink the flow"
  - "Rule 4 treats every column with no role owner like Blocked: a claim out of it is red unless declared"
  - "boardColumns is now derived from boardRows, so the locator call-site census (11 sites) and the baseline derivation are unchanged"
  - "The 11 protocol fixture files also gained both headings, because the plan's acceptance grep counts all 187 files; the validator reads them only for existence"

patterns-established:
  - "A declared exception list carries one test per entry: admitted for its role (live claim present) and red when planted into another role"

requirements-completed: [PLAIN-02, PLAIN-03]

coverage:
  - id: D1
    description: "Board-move ownership guarded as a partition of the seed board, with the four D-33 Tech Lead exceptions declared and tested"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts -t partition (14 cases)"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js (board-move partition: 0 findings over 19/19; 18 claimed pairs) and node scripts/check-diff-disposition.js (stand-in PASS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "End-state role checks: D-35 two-sided, D-36 unknown-verify and no-fabrication in every role, non-empty Stop when, D-08 heading order"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts -t end-state (8 cases)"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js (role end state: 0 findings over 19/19); node scripts/check-foundation-guards.js (role clause uniqueness 0 findings over 19/19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ROLE_SECTIONS requires Activates when and Stop when, seen red first; fixtures updated so each bad fixture still fails for exactly its one reason"
    requirement: PLAIN-02
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts (196 passed, incl. the two D-09 cases and the INTENT table)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js; npm run freshness"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 08: Board-move partition, end-state role checks and the two new role sections Summary

**check-role-rules now guards board-move ownership as a partition derived from each role's `X → Y` code spans and the seed board table (18 pairs, 4 declared Tech Lead exceptions), holds all 19 roles to their end state (D-35 both ways, D-36 facts, a real Stop when, the D-08 order), and the validator requires `## Activates when` and `## Stop when`, seen red first on the unchanged `good` fixture.**

## Performance

- **Duration:** 35 min (including a 23-minute full-suite run)
- **Started:** 2026-11-01T15:30:07Z
- **Completed:** 2026-11-01T16:05:00Z
- **Tasks:** 3
- **Files modified:** 193 (6 tooling files + 187 fixture role files)

## Accomplishments

- The partition (D-29, D-33): rule 1 one owner per pair; rule 2 each non-terminal flow column's owner claims
  its forward pair; rule 3 the terminal column's owner claims a pair into it; rule 4 a claim out of another
  role's column or out of `Blocked` is red unless declared or a close into `Done` by its owner; rule 5 a
  declared exception its role no longer claims is red. Flow, owners and terminal come from the board table.
- End-state checks (D-08, D-10, D-35, D-36) over the 19 roles; the protocol keeps its own shape (D-15).
- D-09: ROLE_SECTIONS gains the two headings; 187 fixture role files updated; the D-12 comments name bare headings.
- The D-30 stand-in in check-diff-disposition spawns `check-role-rules.js --check`, so both new checks now gate
  role-clause admission too (`1129 role clause(s) admitted by the role-rule inventory stand-in (D-30)`).

## Recorded evidence

**Partition pair count (live tree):**

```
INFO  board-move partition: 18 claimed pair(s) over 12 flow column(s), terminal Done, 4 declared exception(s)
PASS  board-move partition: 0 findings over 19/19 elements
```

**ROLE_SECTIONS red transcript (Task 3, validator changed, fixtures unchanged,
`VALIDATE_KIT_ROOT=scripts/fixtures/good VALIDATE_ROOT=scripts/fixtures/good`):** exit 1, `32 ERROR(S)`, one
`## Activates when` and one `## Stop when` finding for each of the 16 fixture roles, e.g.

```
ERROR    agent-factory/roles/agents-md-scribe.md: missing required role section "## Activates when"
ERROR    agent-factory/roles/agents-md-scribe.md: missing required role section "## Stop when"
...
ERROR    agent-factory/roles/uat-planner.md: missing required role section "## Stop when"
32 ERROR(S)
```

**Per-role facts (D-31), `node scripts/check-role-rules.js` after this plan (no role text changed here):**

| File | Facts before | After | Note |
|------|-----:|-----:|------|
| _role-switch-protocol.md | 6 | 6 | |
| agents-md-scribe.md | 8 | 12 | |
| architect-design.md | 9 | 12 | floor 8, 1 intended D-13 removal |
| ba-pm.md | 10 | 14 | floor 9, 1 intended D-13 removal |
| brownfield-mapper.md | 7 | 11 | floor 6, 1 intended D-13 removal |
| compliance-officer.md | 10 | 12 | floor 9, 1 intended D-13 removal |
| designer.md | 9 | 12 | floor 8, 1 intended D-13 removal |
| factory-coach.md | 8 | 11 | floor 7, 1 intended D-13 removal |
| frontend-ui.md | 11 | 16 | |
| greenfield-mapper.md | 8 | 12 | |
| incident-responder.md | 8 | 10 | floor 7, 1 intended D-13 removal |
| installer.md | 8 | 12 | |
| orchestrator.md | 11 | 18 | |
| qe-e2e.md | 9 | 12 | |
| release-manager.md | 11 | 12 | floor 10, 1 intended D-13 removal |
| security-nfr.md | 11 | 14 | floor 10, 1 intended D-13 removal |
| software-engineer.md | 21 | 24 | |
| system-analyst.md | 9 | 12 | floor 8, 1 intended D-13 removal |
| tech-lead.md | 10 | 16 | |
| uat-planner.md | 11 | 14 | floor 10, 1 intended D-13 removal |

`role-rule inventory: 0 findings over 20/20`, `role end state: 0 findings over 19/19`,
`board-move partition: 0 findings over 19/19`.

## TDD

- **Task 1 (tracer):** one `feat` commit with its 14 partition cases. Tracer gate (interactive, end-of-phase,
  automated-only verify): verify re-run green, then expansion continued.
- **Task 2 RED** (`f10eaca9`): 7 of 8 new end-state cases failed. Classifier on the JUnit report (Vitest's TAP
  reporter emits unescaped multi-line YAML, so the classifier refused it as malformed; rerun with `--reporter=junit`):
  `RED_EVIDENCE_OK`, target `D-35: the coding-rules line planted into ba-pm.md (a non-member) is red`.
  Semantic assessment: the target ran and failed on `expect(r.status).toBe(1)` with actual 0, because no
  non-member check existed; the other six failed on their planned assertions (missing message or exit 0); the
  installer case passed already, since the member side was built in 40-01. **GREEN** `d35fa57c`: 33/33.
- **Task 3 RED** (`41d54faa`): both D-09 cases failed. Classifier on the JUnit report: `RED_EVIDENCE_OK`, target
  `D-09: GOOD copy with ## Stop when deleted from one role → ...`. Semantic assessment: the target ran and failed
  on `expect(r.status).not.toBe(0)`: the validator exited 0 (`ALL CHECKS PASSED`) because ROLE_SECTIONS did not
  list the heading. **GREEN** `2221c163`: validate.test.ts 196/196.
- No REFACTOR commit was needed.

## Task Commits

1. **Task 1: board-move partition tracer** - `5f97680a` (feat)
2. **Task 2: end-state role checks** - `f10eaca9` (test, RED), `d35fa57c` (feat, GREEN)
3. **Task 3: ROLE_SECTIONS and fixtures (D-09)** - `41d54faa` (test, RED), `2221c163` (feat, GREEN)
4. **Suite follow-up** - `558d2d92` (test): the partition owner case names the board through `BOARD_REL`

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `scripts/check-role-rules.ts` / `.js` - boardRows, BOARD_MOVE_EXCEPTIONS, claimedPairs, partitionModel,
  checkPartition, ROLE_HEADING_ORDER, D36_REQUIRED_FACTS, checkHeadingOrder, checkEndState, two new report lines
- `scripts/check-role-rules.test.ts` - 14 partition cases, 8 end-state cases (33 total)
- `scripts/validate-agent-factory.ts` / `.js` - ROLE_SECTIONS + 2 headings; D-12 comments
- `scripts/validate.test.ts` - two D-09 planted-heading cases
- `scripts/fixtures/*/agent-factory/roles/*.md` - 187 files gain `## Activates when` and `## Stop when`

## Decisions Made

See `key-decisions` above. No change to the board flow, the board contract or the D-33 exception list; the
baseline JSON was not touched, and the source_commit equality case stays green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Unknown board owner fails closed**
- **Found during:** Task 1
- **Issue:** As specified, any owner that is not a role is "outside the flow", so a misspelt owner in the board
  table would silently drop a column from the partition.
- **Fix:** only a parenthesized owner (`(raiser)`) is outside the flow; any other non-role owner throws naming
  the column and the owner. One extra test case covers it.
- **Committed in:** 5f97680a

**2. [Plan detail] No new frontmatter call site**
- **Found during:** Task 1
- **Issue:** frontmatter.test.ts pins the locator contract at 11 call sites; a second `unfencedHeadingIndex`
  call for the Exit owner cell would move it.
- **Fix:** boardColumns now maps over a new boardRows that reads both cells at the one existing site.
- **Committed in:** 5f97680a

**3. [Plan detail] Protocol fixture files**
- The plan's acceptance grep counts all 187 files, which includes the 11 `_role-switch-protocol.md` fixtures, so
  those also gained both headings (appended at the end). The validator reads them only for existence.
- **Committed in:** 2221c163

**4. [Rule 1 - Bug] Partition test spelled the pre-v3 state root**
- **Found during:** the full-suite run after Task 3
- **Issue:** the fail-closed owner case joined `"memory-bank", "plans", "board.md"`, which check-state-paths
  refuses outside its allow-list.
- **Fix:** the case joins `BOARD_REL` from install/state-layout.js, the same constant check-role-rules uses.
- **Committed in:** 558d2d92

---

**Total deviations:** 4 (1 fail-closed addition, 1 bug in this plan's own test, 2 plan details). **Impact:** none on scope.

## Issues Encountered

- Full suite (e2e excluded, run after Task 3): 10787 passed, 22 failed. 21 are the known set (installer-fs-census 1,
  canonical-corpus 1, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5,
  and the `~/` case in check-foundation-guards). The 22nd, check-state-paths, was this plan's own test spelling the
  pre-v3 state-root segment; fixed in 558d2d92 (deviation 4) and re-run green with check-role-rules,
  check-foundation-guards, installer-fs-census and mode-census (only the known failures remain).
- `scripts/capture-live.test.ts` P5 failed once while Task 3's 187 fixture edits were uncommitted: its message
  lists the dirty paths, and `warn-only-no-trace` contains the word `trace`. It passes on the committed tree.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 40-09 (byte budget guard) and 40-10 can rely on the partition and end-state checks; any later role edit that
  breaks board ownership, the D-08 order, Stop when, D-35 or D-36 is red in `check-role-rules --check` and so in
  the D-30 stand-in.

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-01*

## Self-Check: PASSED

- FOUND: scripts/check-role-rules.ts/.js/.test.ts, scripts/validate-agent-factory.ts/.js, scripts/validate.test.ts;
  `grep -L "^## Stop when" scripts/fixtures/*/agent-factory/roles/*.md | wc -l` = 0
- FOUND commits: 5f97680a, f10eaca9, d35fa57c, 41d54faa, 2221c163, 558d2d92
- Acceptance re-run: BOARD_MOVE_EXCEPTIONS count 6; partition tests 14 passed; partition lines in the gate output 3;
  D-35/D-36 count 11; "0 findings over 19/19" in check-foundation-guards; "file + format" count 0;
  `"## Stop when"` and `"## Activates when"` 1 each in the validator
- Plan verification: build + typecheck clean; vitest check-role-rules + validate + check-diff-disposition 347/347;
  check-role-rules, validate-agent-factory (kit root), check-foundation-guards, check-diff-disposition all exit 0;
  `npm run freshness` (89 .js fresh) and `npm run freshness:hook-manifest` fresh
