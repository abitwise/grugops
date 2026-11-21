---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 16
subsystem: docs
tags: [workflow-04, tech-lead, escalation, controlled-language, gap-closure]

requires:
  - phase: 39
    provides: "Workflow 04 step 15 escalation path with both named-human stops (plans 39-08, 39-12, review fixes); level pin docs (39-14, 39-15)"
provides:
  - "Workflow 04 step 15 as a lead line plus six labelled sub-bullets: move limits, move record, re-score stop, gate-failure stop, the human's confirmation, board update (G-39-7)"
  - "numbered() in scripts/tier-kit-text.test.ts folds indented sub-bullet lines into their step's text"
  - "G-39-7 structure cases in scripts/tier-kit-text.test.ts"
  - "docs/audit/29-style-dispositions/39-16.md rows for the three counted openings; check-diff-disposition back at 721"
  - "Phase gate record for gap closure round 2"
affects: [phase-39-uat, phase-39-verify]

actuals:
  tokens: 3624
  tasks: 2
  commits: 2
plan_head_before: bb386762c3801457b8d42ca25180ab0fcb7d4cee
plan_head_after: 8d5505c27a89ff6947ab8b9fb8a8e02966803aa2

tech-stack:
  added: []
  patterns:
    - "A long numbered step is split into indented sub-bullets, each opening with a short sentence that starts with an approved step verb (WP-01 forbids a bold label)"
    - "Text tests read a numbered step through numbered(), which folds the step's indented lines, so the step can be restructured without losing any pinned sentence"

key-files:
  created:
    - docs/audit/29-style-dispositions/39-16.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - scripts/tier-kit-text.test.ts

key-decisions:
  - "Only three of the five added openings get a disposition row: 'Apply the move limits.' and 'Update the board.' normalize to fewer than CLAUSE_MIN_WORDS (4) words, so check-diff-disposition does not count them as clauses"
  - "The second sub-bullet opens with HEAD's own sentence 'Record the move in a new `decision` note per Workflow 16.', so step 15 gains five sentences, not six"

patterns-established:
  - "numbered() fold: indented, non-blank lines after a numbered line join its text; a blank line, the next numbered line or an unindented line ends the fold"

requirements-completed: [TIER-04]

coverage:
  - id: D1
    description: "Workflow 04 step 15 is a lead line plus six labelled sub-bullets, each named-human stop opening its own sub-bullet, with every HEAD sentence kept word for word"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#WF04 step 15 is a lead line and labelled sub-bullets (G-39-7)"
        status: pass
      - kind: other
        ref: "one-shot meaning check (scratchpad meaning.mjs): 32 of 32 HEAD sentences found exactly once, 5 added openings"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every existing WF04 step-15 case (D-19, WR-01, CR-02, WR-12, N2, E3) still reads every pinned sentence through the numbered() fold"
    requirement: TIER-04
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts (112 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Language and disposition gates agree: check-imperative-lexicon passes, check-diff-disposition back at 721"
    verification:
      - kind: other
        ref: "node scripts/check-imperative-lexicon.js; node scripts/check-diff-disposition.js (721 finding(s))"
        status: pass
    human_judgment: false
  - id: D4
    description: "Step 15 is readable to a first-time reader (UAT test 7)"
    verification: []
    human_judgment: true
    rationale: "Readability for a first-time reader is a human judgment; the tests only prove structure and that no sentence changed"

duration: 28min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 16: Workflow 04 step 15 split into labelled sub-bullets Summary

**Workflow 04 step 15 is now a lead line plus six labelled sub-bullets (move limits, move record, re-score stop, gate-failure stop, the human's confirmation, board update), with all 32 sentences kept word for word, and a numbered() fold keeps every step-15 test reading them.**

## Performance

- **Duration:** 28 min (most of it the 23-minute full suite run)
- **Started:** 2026-10-30T15:22:03Z
- **Completed:** 2026-10-30T15:50:16Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Step 15 keeps its first two sentences on the numbered line (read the note, choose one of four moves). Below it are six indented sub-bullets. The re-score stop and the gate-failure stop each open their own sub-bullet, and the lead line names neither.
- `numbered()` folds indented sub-bullet lines into the step's text. Every existing step-15 case (D-19, WR-01, CR-02, WR-12, N2, E3) passes unchanged.
- The CR-02 ordering still holds: the gate-failure stop comes before "On an escalation or a re-plan, return the ticket to `Ready for Dev`."
- Step numbers, `## Stop conditions`, both `checkpoint:` tags (count 2) and the steps that tech-lead.md and factory.config.md cite are unchanged. Workflow 05 and scripts/checkpoints.ts are not edited.
- WF04 grew from 11,062 to 11,226 bytes (+164, under the 300-byte budget).

## Task Commits

1. **Task 1 RED: G-39-7 structure cases**: `bd2900c6` (test)
2. **Task 1 GREEN: step 15 split, numbered() fold, 39-16.md dispositions**: `8d5505c2` (fix)
3. **Task 2: phase gate**: verification only, recorded here (no code commit)

**Plan metadata:** see the final docs(39-16) commit

## Fold load-bearing proof (Task 1 step 3)

After the split and before the fold, `npx vitest run scripts/tier-kit-text.test.ts` reported `Tests 7 failed | 105 passed (112)`. The failures were D-19, WR-01, CR-02, WR-12 (WF04 escalation path), N2 and E3 (factory.config.md checkpoints wording), and the G-39-7 fold case. After the fold: `Tests 112 passed (112)`.

## Meaning check (Task 1 step 5)

Throwaway script output (scratchpad `meaning.mjs`, not committed). It compares `git show HEAD:` step 15 with the folded new step 15, both split on ". ":

```
HEAD step 15 sentences: 32
found exactly once in new step 15: 32 of 32
not found exactly once: []
new step 15 sentences: 37
added sentences (5): ["Apply the move limits","Apply the re-score stop","Apply the gate-failure stop","Record the human's confirmation","Update the board"]
```

## Acceptance criteria (Task 1)

- `grep -c "^    - "` WF04 → 6 (PASS)
- `grep -c "^    - Apply the re-score stop\. "` → 1 (PASS)
- `grep -c "^    - Apply the gate-failure stop\. "` → 1 (PASS)
- `grep -c "checkpoint: "` → 2 (PASS)
- `wc -c` → 11226, which is at most 11362 (PASS)
- `npx vitest run scripts/tier-kit-text.test.ts -t "G-39-7"` → 5 passed (PASS)
- Meaning check: 32 of 32 found exactly once, 5 added openings (PASS)

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md`: step 15 is now a lead line plus six indented sub-bullets
- `scripts/tier-kit-text.test.ts`: the numbered() fold plus the describe "WF04 step 15 is a lead line and labelled sub-bullets (G-39-7)" with 5 cases
- `docs/audit/29-style-dispositions/39-16.md`: header (base 4d2b8f07 not moved, 721 → 724 → 721) and three **added.** rows

## Decisions Made

- Two of the five openings ("Apply the move limits.", "Update the board.") fall below `CLAUSE_MIN_WORDS = 4` (scripts/voice-model.ts), so the gate does not name them. Only the three counted openings get rows, and the 39-16.md header says why.
- The planner's six openings were kept: check-imperative-lexicon accepted all of them (Apply, Record, Update are in APPROVED_STEP_VERBS), so no verb was swapped.

## Deviations from Plan

None. The plan was executed as written.

## Phase Gate

- Foreground gates, run in order, all exit 0 with no FAIL line: `npm run build`, `npm run typecheck`, check-foundation-guards, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-audit-register, check-imperative-lexicon, check-banned-claims, check-kit-refs, check:public-docs, check:claim-anchors, freshness:adapters, freshness:catalog, freshness:hook-manifest, freshness:guarantees, freshness, check:build-parity.
- `node scripts/check-diff-disposition.js`: exit 1, `721 finding(s) over 42 elements`. This is the recorded pre-existing red, at its pre-phase count. It is not marked passing.
- `npm run check:flip-manifest`: exit 1, "the flip manifest does not exist at .../33-FLIP-MANIFEST.md". This is the recorded pre-existing red. It is not marked passing.
- Full non-e2e suite (`timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`, background): `Test Files 7 failed | 130 passed (137)`, `Tests 21 failed | 10679 passed | 2 skipped (10702)`, `Duration 1389.56s`.
  - 20 of the 21 failures are the deferred-items.md baseline in its six files: context-io 7, context-io-writer-set 2, canonical-corpus 1, harness-instance-ledger 4, uat-gate-exit-contract 5, installer-fs-census 1.
  - The 21st is the known environmental red in `scripts/check-foundation-guards.test.ts`: "every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose" (LANG-07). Its `.js` walk enumerates 7 files under the stray untracked `~/projects/hacks/grugops-example-01/tools/grugops/`, which git's index does not list. Plan 39-14 logged it in deferred-items.md. It is not caused by plans 39-14..39-16, and the folder was left alone. **So the suite does not match the plan's literal "exactly 20" acceptance line.** It does match the 20-failure baseline plus that one recorded environmental case. Deleting the `~/` folder is the human's call.
  - No other failure was found, so plans 39-14..39-16 introduced no regression.
- `git status --short docs/audit/28-prepass-evidence.md` → ` M docs/audit/28-prepass-evidence.md` (untouched and unstaged).

## Human items for verify-work

- UAT test 5 is re-run by a human and expects haiku/xhigh, sonnet/high and opus/medium.
- UAT test 7 (G-39-7): a human judges whether step 15 now reads clearly to a first-time reader.
- UAT tests 10 and 14 stay blocked until the milestone's remaining phases land. They are not gaps.
- Removing the stray untracked `~/` folder at the repo root is the human's call. Until then, one check-foundation-guards case stays red.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- This is the last plan of gap closure round 2 (G-39-5, G-39-6, G-39-7). The phase is ready for the verifier and the human UAT re-run.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*

## Self-Check: PASSED

- Commits found on HEAD: bd2900c6, 8d5505c2
- Files present: agent-factory/workflows/04-ticket-to-pr.md, scripts/tier-kit-text.test.ts, docs/audit/29-style-dispositions/39-16.md
