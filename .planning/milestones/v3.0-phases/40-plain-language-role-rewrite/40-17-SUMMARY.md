---
phase: 40-plain-language-role-rewrite
plan: 17
subsystem: kit-prose
tags: [orchestrator, uat, lean-close, sign_off_acceptance, checkpoints, vitest, text-pins]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "Plan 40-13's lean close (Orchestrator owns `In UAT → Done`) and its CR-02/WR-02 cases"
provides:
  - "Workflow 06 dial paragraph that governs both the enterprise move and the lean close, with the human merge outside the dial"
  - "orchestrator.md lean close and Stop-when hold that name the sign-off `sign_off_acceptance` requires"
  - "Exact-sentence pins (CLOSE_SENTENCE, HOLD_ITEM, leanCloseViolations) and WR-01 mutation cases"
  - "docs/audit/29-style-dispositions/40-17.md rows for the Workflow 06 clauses"
affects: [40-21, phase-41, uat-planner, definition-of-done]

actuals:
  tokens: 3164
  tasks: 2
  commits: 3
plan_head_before: 2c130e572cf3797237a39fbf421c78887b367286
plan_head_after: da9392899dfcf1b0409b899ecd8168d34eae16ad

tech-stack:
  added: []
  patterns:
    - "Exact-sentence pin plus in-memory mutation cases whose plants must change the text (a vacuous plant fails)"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-17.md
  modified:
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/roles/orchestrator.md
    - scripts/tier-kit-text.test.ts

key-decisions:
  - "The lean close follows the sign_off_acceptance dial like the enterprise move (human decision 2, 2026-11-02); the human merge stays outside the dial in the close, the hold, Workflow 06 and the lean DoD"
  - "WR-01 property delivered by exact-sentence pins on orchestrator.md lines 68 and 89, not by a second safety-fact floor (deferred by plan 40-21)"
  - "uat-planner.md and definition-of-done.md left unchanged after the consistency check; uat-planner per-dial wording stays an open question for plan 40-21"

patterns-established:
  - "leanCloseViolations(text): returns 'close' / 'hold' when the exact sentence or item is not present exactly once"

requirements-completed: [PLAIN-02, PLAIN-03, PLAIN-04, PLAIN-07]

coverage:
  - id: D1
    description: "Workflow 06 line 33: stale lean-path sentence replaced; the dial governs both moves, never removes the human merge, and states notify and off"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#the lean close follows the dial (WR-03, WR-01; human decision 2026-11-02)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "orchestrator.md lean close and Stop-when hold pinned as exact sentences; dropping the sign-off or merge condition is red"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WR-01: dropping a lean-close condition is red (mutation cases)"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#CR-02, WR-03: the lean close is the exact sentence"
        status: pass
    human_judgment: false
  - id: D3
    description: "orchestrator.md did not grow (6,057 B to 6,046 B); role corpus 59,803 B; corpus-total growth cases pass"
    requirement: PLAIN-04
    verification:
      - kind: unit
        ref: "npx vitest run scripts/check-foundation-guards.test.ts -t \"corpus total|ROLE_CEILINGS\""
        status: pass
    human_judgment: false
  - id: D4
    description: "Gates and freshness checks green: role rules, foundation guards, validator, imperative lexicon, banned claims, kit refs, state paths, claim anchors, adapters, catalog, skill twins, host entries, guarantees"
    requirement: PLAIN-07
    verification:
      - kind: other
        ref: "node scripts/check-imperative-lexicon.js && node scripts/check-diff-disposition.js && npm run freshness:adapters && npm run freshness:catalog"
        status: pass
    human_judgment: false
  - id: D5
    description: "The new wording reads correctly to a human: the dial never lowers the human merge and no agent can record a named human's sign-off (PLAIN-03 prohibition)"
    verification: []
    human_judgment: true
    rationale: "The prohibition is marked verification: judgment in the plan; pins hold the words, but whether the meaning is safe is a human read"

duration: 39min
completed: 2026-11-02
status: complete
---

# Phase 40 Plan 17: The lean close follows the dial Summary

**The Orchestrator's lean close and Workflow 06 now both say the sign-off follows `sign_off_acceptance` (block / notify / off) while the human merge is never lowered, and exact-sentence pins plus the reviewer's own mutation make dropping either condition red.**

## Performance

- **Duration:** 39 min (about 30 of them waiting on the full suite)
- **Started:** 2026-11-02T20:47:42Z
- **Completed:** 2026-11-02T21:27:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Workflow 06 line 33: the stale sentence from the removed design is gone, and the dial paragraph now covers the enterprise move and the lean close, keeps the human merge outside the dial, and says what `notify` and `off` do.
- orchestrator.md: the close and the Stop-when hold name "the sign-off `sign_off_acceptance` requires" and keep the human merge unconditional. The file shrank from 6,057 B to 6,046 B.
- WR-01 property: `leanCloseViolations()` pins both lines as exact sentences. The reviewer's mutation, and each single dropped condition, is a permanent red case.

## Final wording of every changed line

- `agent-factory/workflows/06-uat-pack.md:33` (one line). The fourth sentence is now "In lean mode, the Orchestrator's close to `Done` stops at the same checkpoint." Three sentences come after "Only a value the repository actually wrote can lower it; absence reads as the documented default.": "The dial governs both the enterprise `In UAT -> Ready to Release` move and the lean close, and it never removes the human merge." "At `notify` the move or close proceeds and is recorded per Workflow 16, as an `observation` when the agent cannot stamp it." "At `off` it proceeds silently." Every other sentence is unchanged and in order.
- `agent-factory/roles/orchestrator.md:68`: "You own `In UAT → Done`, the lean-mode close. Close only after the sign-off that `checkpoint: sign_off_acceptance` requires, a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds."
- `agent-factory/roles/orchestrator.md:89`: "- If a human has not merged the PR or `sign_off_acceptance` is not met, leave the ticket in `In UAT`."

The sentence and lexicon gates passed this wording on the first run, so nothing was reworded.

## Bytes (`wc -c`, UTF-8)

- orchestrator.md: 6,057 B before, 6,046 B after (limit 6,057; the corpus-total growth cases allow about 6,061).
- Role corpus: 59,814 B before, 59,803 B after.
- Workflow 06: 6,012 B before, 6,328 B after (D-06).
- Section checksums unchanged: orchestrator `## Hard limits`..`## Stop when` aa9f396e8178f0a2, `## One job`..`## Reads` 78ab24559dbf5ee6; Workflow 06 `## Stop conditions`..`## Done condition` 3c72c8ddbfd0fedd, `## Commit`..end 94a042e542d9df4e.

## RED evidence (Task 1)

`npx vitest run scripts/tier-kit-text.test.ts` before the prose edits: **7 failed | 180 passed (187)**. Each failure was on its planned assertion:

- CR-02, WR-03 close: `expected [ 'close', 'hold' ] to not include 'close'` (the old close sentence did not match CLOSE_SENTENCE)
- CR-02, WR-03 hold: `expected [ 'close', 'hold' ] to not include 'hold'`
- WR-02: `Board moves keeps the stale lean-path sentence: ... not to contain 'straight to \`Done\`'`
- WR-03 lean close sentence missing, "never removes the human merge" missing, `` `observation` `` missing (`notify` and `off` already appeared in the vocabulary sentence)
- WR-01 live: `expected [ 'close', 'hold' ] to deeply equal []`

Semantic assessment: every target ran and failed on the missing or stale wording it names. No load, syntax or fixture failure occurred. GREEN after the prose edits: 187 passed.

## Watched fail (Task 2)

The mutation cases passed at once, as expected, because Task 1's pins already existed. To see one fail, I pointed the case "WR-01: dropping only the merge clause from the close is red" at the unmutated `ORCHESTRATOR` for one run. It failed with `expected [] to deeply equal [ 'close' ]` (1 failed | 18 passed). I then restored the file from a byte copy, and all 193 tests passed again.

## Rows written (docs/audit/29-style-dispositions/40-17.md)

Four rows, all on `agent-factory/workflows/06-uat-pack.md:33`, rule `WR-03, D-19, human decision 2026-11-02`, companion `—`:

1. **replaced:** "The lean path straight to `Done` is unchanged." became "In lean mode, the Orchestrator's close to `Done` stops at the same checkpoint."
2. **added:** "The dial governs both the enterprise ... and it never removes the human merge."
3. **added:** "At `notify` the move or close proceeds ... as an `observation` when the agent cannot stamp it."
4. **added:** "At `off` it proceeds silently."

The gate reported four clauses with no row. Existing rows in 32.1-03.md already cover the unchanged sentences on line 33, so no "kept verbatim, line rewritten." row was needed. After the rows were added, check-diff-disposition exited 0.

## Consistency check: uat-planner.md and definition-of-done.md (no edit)

- **definition-of-done.md:** its only merge item, "the PR merged by a human; agents never merge" (line 12), does not depend on the dial, so it does not contradict the dial-following close. It has no sign-off item. Unchanged.
- **uat-planner.md:** lines 38, 45, 49 and 50 state the human sign-off at the checkpoint's default `block`. Its Reads line names `checkpoints` (`sign_off_acceptance`), the same convention the frozen Workflow 06 stop condition uses. None of these lines speaks about the lean close, which the UAT Planner does not own: line 39 leaves the lean ticket for the Orchestrator. Unchanged. Lines 45 and 49 are frozen safety-fact sentences and the file has about 3 B of growth room, so plan 40-21 records rewording them per dial value as an open question for the human.

## Task Commits

1. **Task 1 RED: failing pins for the dial-following lean close** - `d72ee8e4` (test)
2. **Task 1 GREEN: lean close follows the sign_off_acceptance dial, plus rows** - `aaa92ccc` (fix)
3. **Task 2: WR-01 mutation cases** - `da939289` (test)

## Files Created/Modified

- `agent-factory/workflows/06-uat-pack.md` - the line-33 dial paragraph now governs the enterprise move and the lean close
- `agent-factory/roles/orchestrator.md` - the close sentence (line 68) and the hold item (line 89)
- `scripts/tier-kit-text.test.ts` - CLOSE_SENTENCE, HOLD_ITEM, occurrences(), leanCloseViolations(), two rewritten CR-02 cases, the extended WR-02 negative pin, and two new describes (19 cases match "WR-01"; the file has 193 tests, up from 182)
- `docs/audit/29-style-dispositions/40-17.md` - the Workflow 06 disposition rows

## Decisions Made

- Task 1 was committed as RED (`test`) and GREEN (`fix`) so the failing pins are on the record before the prose changed.
- The live-Orchestrator `[]` case appears in both new describes: once as the WR-03 positive case and once as the base case for the mutation cases.
- The mutation describe has 6 cases, one more than planned: dropping only the merge condition from the hold gets its own case, so all four single drops are covered.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hold-mutation plant from the plan matched nothing**
- **Found during:** Task 2
- **Issue:** The plan's plant `"or \`sign_off_acceptance\` is not met "` (trailing space) does not occur in HOLD_ITEM, because a comma follows "met". The `mutate()` guard caught it: the replace changed nothing, so the case failed.
- **Fix:** I changed the plant to `" or \`sign_off_acceptance\` is not met"` (leading space). The mutated hold reads "- If a human has not merged the PR, leave the ticket in `In UAT`.", and leanCloseViolations returns `["hold"]`.
- **Files modified:** scripts/tier-kit-text.test.ts
- **Verification:** 193 passed. The guard proved it refuses a vacuous plant.
- **Committed in:** da939289

---

**Total deviations:** 1 auto-fixed (1 bug in plan text)
**Impact on plan:** None on scope. The vacuous-plant guard worked as designed.

## Issues Encountered

- The full suite (`npx vitest run --exclude '**/scripts/e2e/**'`) gives **21 failed | 10,855 passed | 2 skipped** over 138 files. None of the failures comes from this plan, and all of them are already recorded in deferred-items.md (plans 40-09 and 40-13):
  - 20 failures in `uat-gate-exit-contract` (5), `context-io` (7), `context-io-writer-set` (2), `harness-instance-ledger` (4), `canonical-corpus` (1) and `installer-fs-census` (1). The same 20 failures reproduce at the plan base 2c130e57 in a temporary detached worktree, which has since been removed.
  - 1 failure in check-foundation-guards, "LIVE COUNT is DERIVED". It comes from the pre-existing untracked `~/` directory: its `.js` files enter the walk. It also carries the 40-08 regression recorded in deferred-items.md.
- The plan-level verification set passes in full: 5 named test files (528 passed), the corpus-total and ROLE_CEILINGS cases (10 passed), 9 gates and 5 freshness checks.

## Threat Flags

None. No new surface; T-40-46..48 are mitigated as planned.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

Gap 2 (WR-03) and the WR-01 property are closed. Plan 40-21 still owes the deferred second safety-fact floor and the open uat-planner.md per-dial question.

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/40-17.md, agent-factory/workflows/06-uat-pack.md, agent-factory/roles/orchestrator.md, scripts/tier-kit-text.test.ts
- FOUND commits: d72ee8e4, aaa92ccc, da939289 (ancestors of HEAD)
- All Task 1 and Task 2 acceptance criteria re-run: PASS
