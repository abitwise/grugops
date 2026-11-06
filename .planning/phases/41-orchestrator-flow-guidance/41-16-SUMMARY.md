---
phase: 41-orchestrator-flow-guidance
plan: 16
subsystem: tooling
tags: [supersession, workflow-16, note-contract, residuals, review-ledger, cr-02]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "admit() refuses a supersedes target that is a green verdict or a gated finding, and D-37 (41-15)"
provides:
  - "Workflow 16 step 3 and the note contract state the supersession rule where a role reads it"
  - "Workflow 16 step 3 also says a target that names no note is still admitted, on Olger's direction"
  - "R-41-09, the CHANGELOG bullet, and CR-02 recorded as fixed with open: 22"
  - "A full-suite result compared by name at 1f9a28ac"
affects: [gsd-verify-work, gsd-secure-phase]

actuals:
  tokens: 5989
  tasks: 2
  commits: 6
plan_head_before: cc7c256b9b4687f399734e53101f2efa1163a4b5
plan_head_after: 1f9a28ac9085e1d203030cea59c9b411a6de5b4c

tech-stack:
  added: []
  patterns:
    - "A text pin whose needle starts with an apostrophe breaks the TAP report: Vitest truncates the needle into a message and writes an escape YAML refuses, so start the needle earlier"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-16.md
  modified:
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/contracts/context-note.md
    - scripts/flow-guidance-text.test.ts
    - docs/audit/41-residuals.md
    - CHANGELOG.md
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "Olger's reply at the Task 1 check, on 2026-11-06, verbatim: `flag 1: add the R-41-09 sentence; accept 2 3, Olger`"
  - "Row 1 of 41-16.md is recorded as flagged, not accepted. The added sentence's row keeps `pending (named human)`, because it has not been read against the diff"
  - "R-41-09 says that D-37 does not speak of a dial raised after a retirement, so no human has accepted that case"

patterns-established:
  - "A flagged disposition row states the flag and its answer, and writes no acceptance"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "Workflow 16 step 3 and the note contract state the supersession rule"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the kit says what a note cannot supersede (plan 41-16; CR-02, RUN-05, D-37)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sentence Olger directed says a target that names no note is still admitted, and cites R-41-09"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#says, straight after the rule, what a target that names no note leaves open"
        status: pass
    human_judgment: true
    rationale: "Its disposition row stays pending. Olger directed the sentence and has not read it against the diff"
  - id: D3
    description: "41-REVIEW-DISPOSITION.md reads fixed for CR-02 in frontmatter and table, with open: 22 and no other row moved"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "the four acceptance greps of Task 2, plus 22 open entries counted in both the frontmatter and the table"
        status: pass
    human_judgment: false
  - id: D4
    description: "R-41-09 says what D-37 left open"
    requirement: RUN-05
    verification: []
    human_judgment: true
    rationale: "No agent may accept a residual. A named human owes the read of R-41-09 against D-37"
  - id: D5
    description: "The full suite ends on exactly the 21 names in § Known baseline reds, compared by name"
    requirement: RUN-02
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' at 1f9a28ac, JSON report compared by name"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every gate the plan names passes on the committed tree, and npm run freshness passes after the commit"
    requirement: RUN-02
    verification:
      - kind: other
        ref: "the <verify> commands of Tasks 1 and 2, run at 1f9a28ac"
        status: pass
    human_judgment: false

duration: 31min
completed: 2026-11-06
status: complete
---

# Phase 41 Plan 16: Supersession rule in the kit text, CR-02 recorded Summary

**Workflow 16 step 3 and the note contract now state that a note cannot supersede a green verdict or a gated finding. Step 3 also says, on Olger's direction, that a target naming no note is still admitted. CR-02 reads fixed, R-41-09 names what stays open, and the full suite ends on exactly the 21 baseline names.**

## Performance

- **Duration:** 31 min for this continuation, of which 25 min was the full suite. The first dispatch ran on 2026-11-05 and stopped at Task 1's human check.
- **Started:** 2026-11-06T20:52:29Z
- **Completed:** 2026-11-06T21:23:30Z
- **Tasks:** 2
- **Files modified:** 7

## The human's word at Task 1

Olger's reply, on 2026-11-06, verbatim: `flag 1: add the R-41-09 sentence; accept 2 3, Olger`

| Row of 41-16.md | Recorded as |
|-----------------|-------------|
| 1, `A note cannot supersede ...` | Flagged by Olger, not accepted. The answer was the added sentence. |
| 2, `Only a named human's disposition retires one.` | Accepted by Olger |
| 3, the context-note.md sentence | Accepted by Olger |
| 4, the added sentence | Directed by Olger. Still `pending (named human)`, because nobody has read it against the diff. |

The new row is last, so the numbers Olger replied with still match the table. The row 1 sentence is byte-identical. The reply is quoted in a `## Named-human read` section, in the form of 40-23.md, and no other disposition file changed.

## Accomplishments

- A role reads the rule at the sentence that names `--supersedes`, before it meets the refusal.
- The same step says what the rule does not reach, so `cannot` no longer stands alone there.
- CR-02 moved to `fixed` on a recorded fix. The ledger counts 22 open in both its frontmatter and its table, and no other row moved.
- R-41-09 records the two gaps of D-37. It also records the refusal plan 41-15 measured, and says no human has accepted that case.

## Task Commits

1. **Task 1: the tracer**
   - `75a33e5f` (test, RED for the rule)
   - `02207d4f` (feat, the rule and 41-16.md)
   - `3a86e2a4` (test, RED for the added sentence)
   - `dc360741` (feat, the added sentence and its row)
   - `3fee450b` (docs, Olger's word)
2. **Task 2: the records and the phase gate** - `1f9a28ac` (docs)

## RED evidence

**The rule (first dispatch):** `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK`, `target_test_failed`, for both pins under `--reporter=tap-flat`. 84 other cases passed, and both targets failed on their text assertions.

**The added sentence:** the target was `says, straight after the rule, what a target that names no note leaves open`. The check returned `RED_EVIDENCE_OK`, `target_test_failed`, with 86 passed and 1 failed. Semantic assessment: the target ran and failed on its `toContain`, because step 3 did not hold the sentence. The amended earlier pin passed.

## Full suite

`npx vitest run --exclude '**/scripts/e2e/**'` at `1f9a28ac`, on the default `TMPDIR`, 1,503 s: 21 failed, 11,568 passed, 2 skipped. No EDQUOT appeared, and no file was re-run alone, because no failure fell outside the table.

Compared by name, added 0 and missing 0. The failed names are the 21 of 41-VALIDATION.md § Known baseline reds, each in this table:

| File | Failed test |
|------|-------------|
| `install/installer-fs-census.test.ts` | installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER |
| `scripts/canonical-corpus.test.ts` | canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS > provenance: every cited source artifact resolves on disk |
| `scripts/check-foundation-guards.test.ts` | LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24) > every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > every derived decline clause is enumerated, and the document names no other |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > the disposition document exists and carries the enumeration heading |
| `scripts/context-io.test.ts` | 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > DIRECTION 2: every WRITTEN id is a member the module still exports |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > PREMISE: the document was read and it names residual ids at all |
| `scripts/context-io.test.ts` | 31-29 — the write path's residuals are an EXPORTED register, bound in both directions > a SEEDED undispositioned member turns the equality RED |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every FILE a row cites exists in the tree it names |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — the harness-instance ledger's own premise is asserted before it is believed > every MECHANISM a row claims is greppable in the evidence that row itself names |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > PREMISE: the live tree's own reading, printed before any mirror is believed |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — the replacement floors can FAIL, watched against two confirmed mirrors > a mirror with a MAJORITY of rows stripped turns the new CEILING red |
| `scripts/uat-gate-exit-contract.test.ts` | every plan of round 6 carries the debt-does-not-grow acceptance criterion > all five round-6 PLAN files state it, and the count is asserted at five |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split("/") key see ONE spelling on every host |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > every ordinal-claiming sentence in the scanned set appears in the tracked list |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally is ONE list with the numbering read off it > the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red |

## Verification

All of these ran at `1f9a28ac` and exited 0:

- **Task 1:** `npx vitest run scripts/flow-guidance-text.test.ts scripts/tier-kit-text.test.ts` (310 passed), `check-imperative-lexicon`, `check-role-rules`, `check-kit-refs`, `check-diff-disposition`, `check-banned-claims`
- **Task 2:** `check:residual-citations`, `check:audit-register`, `check:claim-anchors`, `check:public-docs`, `check-foundation-guards`, `validate-agent-factory`, `check-state-paths`, `check-uat-oracles`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:queue`
- **After the commit:** `npm run freshness` (91 `.js` fresh), `npx vitest run scripts/floor-invariance.test.ts` (136 passed)

Every acceptance grep gave its expected value. `pending (named human)` still appears in 41-16.md, on the row that is owed and in the prose. 41-SECURITY.md, Workflow 18 and every other disposition file are unchanged.

## Decisions Made

- The added sentence's row keeps `pending (named human)` as its first words. Olger directed the sentence, and nobody has read it against the diff.
- R-41-09's `why it was accepted` cell separates what D-37 decided from the repeated-append case, which D-37 does not mention. The phrase `no human has accepted` follows R-41-07 and R-41-08.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A multi-line array diff broke the TAP report**
- **Found during:** Task 1, first dispatch
- **Issue:** the first two records returned `INVALID_RED` (`invalid_record`).
- **Fix:** the contract pin now compares the two lines as one joined string, with the same assertion.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Verification:** `RED_EVIDENCE_OK`, `target_test_failed`, for both pins
- **Committed in:** `75a33e5f`

**2. [Rule 3 - Blocking] An apostrophe in a pin's needle broke the TAP report**
- **Found during:** Task 1, the added sentence's RED
- **Issue:** the record returned `INVALID_RED` (`invalid_record`, `Malformed TAP`). The needle began `Only a named human's`, and the report's `message` line carried `human\'s` inside a double-quoted scalar. `\'` is not a valid YAML escape.
- **Fix:** the needle now starts one sentence earlier, at `A note cannot supersede`. The assertion only gets stricter.
- **Files modified:** scripts/flow-guidance-text.test.ts
- **Verification:** `RED_EVIDENCE_OK`, `target_test_failed`, with no report errors
- **Committed in:** `3a86e2a4`

### Directed by the human

**3. The added sentence and its pin, on Olger's direction at the Task 1 check**
- **Change:** Workflow 16 step 3 gains `A target that names no note is still admitted, and residual R-41-09 records what that leaves open.` directly after `Only a named human's disposition retires one.` The plan's artifact list names two sentences in that step, and there are now three.
- **Pins:** the earlier pin stops at the rule, and a new case holds the rule through to `The program stamps`.
- **Committed in:** `3a86e2a4`, `dc360741`

### Directed by the orchestrator

**4. R-41-09 carries more than the plan's wording**
- **Change:** it adds the measured refusal of a repeated append after the dial moves to `all`, as the dispatch directed, and says no test pins it. It also says a finding the dial gates can leave the current state through a note naming its id, and that nothing plans a close for the repeated append.
- **Committed in:** `1f9a28ac`

### Order of work

**5. The suite ran after the commit, not before it**
- **Why:** the plan orders suite, gates, commit. Plan 41-15 saw two false reds from an uncommitted tree, so the records were committed first and the suite read the committed tree. The change touches records only.

---

**Total deviations:** 5 (2 auto-fixed blocking, 1 directed by the human, 1 directed by the orchestrator, 1 order of work).
**Impact on plan:** none moved the rule or the row 1 sentence. No pin moved to clear a failure.

## Issues Encountered

- **The CHANGELOG bullet keeps the strength of row 1.** It uses the plan's wording, `can no longer supersede`. That is the strength Olger flagged in row 1, and the bullet has no sentence about a target that names no note. Nobody directed a change to it, so it stands as the plan wrote it. A named human may want to read it with R-41-09.
- **Workflow 18's stop is unchanged.** It still says `Record the new result as a NEW note that supersedes the old one`, and its deferred-items.md entry stays open, as directed.

## Owed to a named human

- **The read of R-41-09 against D-37.** This is Task 2's human check. Nothing here accepts it, and the human expects it at end of phase.
- **The read of the added sentence's row** against the diff, and what Olger wants to record for row 1 once that is done.
- The reads of R-41-01 to R-41-08, the other `pending (named human)` rows, the live Claude Code run, the live runs on five hosts, and the Windows check, which stays `UNKNOWN - verify`.

The first two are in `.planning/WINDOWS.md` as `unrun-verify` entries. /gsd-secure-phase still re-audits T-41-30, T-41-55 and `T-41-56` to `T-41-70`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All 16 plans of phase 41 have a SUMMARY, so the phase is ready for verification. Under `narrow`, `--supersedes nosuchid` still ends `noted`. That is the decided residual, not a defect of this plan.

## Self-Check: PASSED

All six commits are ancestors of HEAD, and every file in `key-files` exists. `git rev-list --count cc7c256b..1f9a28ac` is 6.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-06*
