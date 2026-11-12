---
phase: 41-orchestrator-flow-guidance
plan: 24
subsystem: kit-text
tags: [supersession, R-41-09, root-ladder, named-root, factory-config, review-disposition, WR-15, IN-14, WR-08, D-42, D-43]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "plans 41-19 to 41-23, which fixed the other 19 gap rows this plan records"
provides:
  - "Both supersession bullets under ### Security name the three routes R-41-09 records"
  - "Workflow 16 step 3: an unreadable target is refused unless its file was renamed (R-41-09)"
  - "The home-directory refusals in CHANGELOG.md, Workflow 16 and R-41-07 are qualified by a named root carrying a configuration"
  - "factory.config.md names the Tech Lead as the role that hands back after a Fundamental: ruling"
  - "41-REVIEW-DISPOSITION.md: 22 gap rows fixed with their plans, open: 0"
affects: [gsd-verify-work phase 41, gsd-secure-phase phase 41, milestone UAT]

actuals:
  tokens: 13000
  tasks: 3
  commits: 3
plan_head_before: 9eb29ef5606d61707d489720e0c06c5fd830514e
plan_head_after: 0c1d2db736bd065f01c409fb5b57af7e508df320

tech-stack:
  added: []
  patterns:
    - "A moved pin cites its written reason: 41-UAT.md test 7, Olger, 2026-11-11"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-24.md
  modified:
    - CHANGELOG.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/config/factory.config.md
    - docs/audit/41-residuals.md
    - docs/audit/29-style-dispositions/41-18.md
    - scripts/flow-guidance-text.test.ts
    - scripts/tier-kit-text.test.ts
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "The plan's Workflow 16 sentence for IN-14 (35 words) was split for WP-03: the above-HOME case reads 'The same holds for a working directory above the home directory, where tier 3 inspects nothing.', so it stays under the named-root condition"
  - "The renamed-file route is stated, not closed: R-41-09's ruling note says it stays open and no human has accepted it (D-43)"

patterns-established: []

requirements-completed: [RUN-02, RUN-05, RUN-06]

coverage:
  - id: D1
    description: "Both supersession bullets in CHANGELOG.md and Workflow 16 step 3 state the limits R-41-09 records (WR-15)"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the supersession rules carry their limits (plan 41-24; WR-15, D-43)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The home-directory refusal is qualified by a named root carrying a configuration in CHANGELOG.md, Workflow 16 and R-41-07 (IN-14)"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#Workflow 16 says the order stops on an undeterminable home only with no named root carrying a configuration (IN-14)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the changelog home-directory sentences say a named root with a configuration pre-empts the refusal (IN-14, D-42)"
        status: pass
    human_judgment: false
  - id: D3
    description: "factory.config.md names the Tech Lead for the hand-back after a Fundamental: ruling (WR-08)"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#factory.config.md names the Tech Lead as the role that hands the ticket back after a `Fundamental:` ruling (WR-08, D-42)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The pending (named human) rows of 41-24.md and the R-41-09 ruling note"
    verification: []
    human_judgment: true
    rationale: "No agent may accept a disposition row or a residual; a named human reads the rows against the diff"
  - id: D5
    description: "41-REVIEW-DISPOSITION.md records the 22 gap rows fixed, open: 0, and the full suite ends on the 21 baseline names"
    verification:
      - kind: other
        ref: "grep -c '^open: 0$' 41-REVIEW-DISPOSITION.md = 1; npx vitest run --exclude '**/scripts/e2e/**' failed names = 41-VALIDATION.md Known baseline reds"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-11-12
status: complete
---

# Phase 41 Plan 24: the supersession limits, the named root that pre-empts a home refusal, the Tech Lead's hand-back, and the 22 rows recorded fixed

**Both supersession bullets in the changelog and Workflow 16 step 3 now name the routes R-41-09 leaves open, including the renamed-file route, which stays unaccepted. The home-directory refusals in CHANGELOG.md, Workflow 16 and R-41-07 now hold only when no named root carries a factory configuration. factory.config.md names the Tech Lead as the role that hands the ticket back. All 22 gap rows of 41-REVIEW-DISPOSITION.md read `fixed` with their plans (`open: 0`), and the full suite fails only the 21 known baseline names, compared by name.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-11-12T09:37:34Z
- **Completed:** 2026-11-12T10:09:24Z
- **Tasks:** 3
- **Files modified:** 9 (8 modified, 1 created)

## Accomplishments

- WR-15 (D-43): both `### Security` supersession bullets end with `Residual R-41-09 records the routes that stay open: a target that arrives later, a dial raised after a retirement, and a note file that was renamed and cannot be read.` Workflow 16 step 3 reads `A target in the store that cannot be read is refused, unless its file was renamed (R-41-09).` R-41-09's ruling note says plan 41-24 stated the routes, and that the renamed-file route stays open with no human acceptance.
- IN-14 (D-42): the changelog's HOME-does-not-exist and above-HOME sentences end `unless a named root such as `CLAUDE_PROJECT_DIR` carries a factory configuration`. In Workflow 16, `When the order cannot finish` now reads: a failed read stops the order, and the other three stops apply only with no named root carrying a factory configuration. R-41-07's second limit is qualified the same way. Its accepted fourth limit is unchanged.
- WR-08 (D-42): factory.config.md now reads `On approval the Tech Lead hands ...` and `On rejection the Tech Lead applies ...`. Workflow 04 step 15 (actor: Tech Lead) holds both moves.
- 41-REVIEW-DISPOSITION.md: the 22 gap rows read `fixed` in the frontmatter and the table, each naming its plan. `open: 22` is now `open: 0`. IN-02, IN-03 and IN-06 are still `deferred`, and CR-01 and CR-02 are unchanged.

## Task Commits

1. **Task 1: the supersession rules carry their limits (tracer)**: `8535c451` (docs). The tracer gate re-ran `<verify>` (interactive, end-of-phase, automated-only verify) and it passed, so expansion went ahead.
2. **Task 2: the named root and the Tech Lead**: `25e466bd` (docs)
3. **Task 3: the 22 rows recorded fixed, and the phase gate**: `0c1d2db7` (docs)

## Files Created/Modified

- `CHANGELOG.md`: four `### Security` sentences extended: two by WR-15, two by IN-14
- `agent-factory/workflows/16-context-read-write.md`: step 3 clause (line 31) and the `When the order cannot finish` paragraph (line 65)
- `agent-factory/config/factory.config.md`: the `block` bullet's approval and rejection subjects
- `docs/audit/41-residuals.md`: the `Written` line, the R-41-07 second limit, and the R-41-09 ruling note
- `docs/audit/29-style-dispositions/41-18.md`: one closing line pointing to 41-24.md (no row changed)
- `docs/audit/29-style-dispositions/41-24.md`: four `pending (named human)` rows, one per gate finding
- `scripts/flow-guidance-text.test.ts`: new describe `the supersession rules carry their limits (plan 41-24; WR-15, D-43)` with 7 pins. The two plan 41-18 pins and the plan 41-14/41-17 `unfinished` pin moved, each citing 41-UAT.md test 7.
- `scripts/tier-kit-text.test.ts`: the quick 261031-oxi defect 2 pin moved to the Tech Lead wording
- `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md`: the 22 rows and the `open` count

## Phase gate: full suite, compared by name

The suite ran after Tasks 1 and 2 were committed, on the default `TMPDIR`, with `npx vitest run --exclude '**/scripts/e2e/**'`. The pre-plan commit is `9eb29ef5`.

- **Totals:** 7 files failed, 137 passed (144). Tests: **21 failed, 11,699 passed, 2 skipped** (11,722), in 1,561 s. The output has no `-122` (EDQUOT) line.
- **Comparison:** the failed names were extracted from the ` FAIL ` lines and compared with `comm` against the 21 names of 41-VALIDATION.md § Known baseline reds. Failed names outside the table: **none**. Baseline names not failing: **none**.
- **Re-runs alone and pre-plan runs:** no name fell outside the table, so no file needed a re-run alone and no throwaway worktree run was needed.

Every failed name, each classified as **baseline (41-VALIDATION.md § Known baseline reds)**:

| File | Test | Classification |
|---|---|---|
| `install/installer-fs-census.test.ts` | installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER | baseline |
| `scripts/canonical-corpus.test.ts` | canonical-corpus: the rounds-1-11 bypass corpus replays as NAMED LOUD REFUSALS > provenance: every cited source artifact resolves on disk | baseline |
| `scripts/check-foundation-guards.test.ts` | LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24) > every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose | baseline (the user's untracked `~/` directory) |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > every derived decline clause is enumerated, and the document names no other | baseline |
| `scripts/context-io-writer-set.test.ts` | 31-14 — the register's decline enumeration equals the derived set > the disposition document exists and carries the enumeration heading | baseline |
| `scripts/context-io.test.ts` | 31-23 PROBE 5 — the cross-plan intended-change list is a declared set of size one > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > CONVERSE 1: a mirror of 31-CONTEXT.md with ONE written disposition removed names the orphaned member | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > CONVERSE 2: a mirror of the register with ONE member removed names the orphaned disposition | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > DIRECTION 1: every EXPORTED member has a WRITTEN disposition in 31-CONTEXT.md | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > DIRECTION 2: every WRITTEN id is a member the module still exports | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > PREMISE: the document was read and it names residual ids at all | baseline |
| `scripts/context-io.test.ts` | 31-29 — … > a SEEDED undispositioned member turns the equality RED | baseline |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — … > every FILE a row cites exists in the tree it names | baseline |
| `scripts/harness-instance-ledger.test.ts` | 31-37 WR-34 — … > every MECHANISM a row claims is greppable in the evidence that row itself names | baseline |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — … > PREMISE: the live tree's own reading, printed before any mirror is believed | baseline |
| `scripts/harness-instance-ledger.test.ts` | 31-40 IN-21 — … > a mirror with a MAJORITY of rows stripped turns the new CEILING red | baseline |
| `scripts/uat-gate-exit-contract.test.ts` | every plan of round 6 carries the debt-does-not-grow acceptance criterion > all five round-6 PLAN files state it, and the count is asserted at five | baseline |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally … > SEPARATOR SEAM (test AE, plan 33-18): scannedDocumentsWith(win32) publishes POSIX members, so the docs/audit/ filter and the split("/") key see ONE spelling on every host | baseline |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally … > every ordinal-claiming sentence in the scanned set appears in the tracked list | baseline |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally … > the round-5 collision is ANNOTATED in the list rather than repaired in either SUMMARY | baseline |
| `scripts/uat-gate-exit-contract.test.ts` | the harness-false-result tally … > the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red | baseline |

(`…` shortens a describe name that the table in 41-VALIDATION.md gives in full; the comparison used the full names.)

All other Task 3 gates passed: the lexicon, role-rule, kit-ref, diff-disposition and banned-claim checks; residual-citations, audit-register, claim-anchors and public-docs; foundation guards, the validator, state paths, UAT oracles and the four freshness checks; and, after the Task 3 commit, `npm run freshness` with `scripts/floor-invariance.test.ts` (136 passed).

## Decisions Made

- The IN-14 Workflow 16 sentence was split to meet WP-03 (see Deviations).
- WR-08: Workflow 04 step 15 was read first. Its actor is the Tech Lead, and its human-stop sub-bullet holds `On approval, hand the ticket back to the proposing role` and `On rejection, apply the move the human names.`. So the edit went ahead and no stop was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's IN-14 Workflow 16 sentence failed WP-03**
- **Found during:** Task 2
- **Issue:** `check-imperative-lexicon` failed: `16-context-read-write.md:65 — WP-03 [descriptive-sentence-too-long] 35 words, bound 25`
- **Fix:** split it into `With no named root carrying a factory configuration, an undeterminable home directory or an unreadable working directory stops it too.` and `The same holds for a working directory above the home directory, where tier 3 inspects nothing.`. `The same holds` keeps the above-HOME case under the named-root condition. The acceptance grep (`With no named root carrying a factory configuration, an undeterminable home directory`) still prints 1. Both pins carry the split wording. No check was weakened.
- **Files modified:** agent-factory/workflows/16-context-read-write.md, scripts/flow-guidance-text.test.ts
- **Committed in:** `25e466bd`

**Total deviations:** 1 auto-fixed (Rule 3, wording only). **Impact:** the clause reads the same, in two sentences.

## Issues Encountered

- Observation, not changed: the first sentence of the first `### Security` bullet still reads `A failed read or a home directory that cannot be determined refuses the note`, with no qualifier. The plan and IN-14 target the `every note is refused` sentence, which closes the same bullet and now carries the named-root qualifier. A named human may want the earlier sentence qualified too.
- The rows in 41-17.md (`So does a working directory above ...`) and 41-18.md (`A target in the store that cannot be read is refused.`) now match no added clause. The gate does not flag them, and they were left as records of what those plans wrote.

## Owed to a named human (unfilled by this plan)

- The `pending (named human)` rows of `docs/audit/29-style-dispositions/41-19.md` to `41-24.md`
- The reads of residuals R-41-10 and R-41-11
- The acceptance or close of the renamed-file route (R-41-09 (c), T-41-81). No agent wrote an acceptance.
- The live runs on other hosts (R-41-05). The Windows check stays `UNKNOWN - verify`.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

This is the last plan of the gap round. /gsd-secure-phase re-audits T-41-84 to T-41-106, and /gsd-verify-work reconciles the 22 gaps.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-24.md
- FOUND: 8535c451, 25e466bd, 0c1d2db7 (each an ancestor of HEAD)
- No commit of this plan names docs/audit/28-prepass-evidence.md, brand/readme-art.txt or `~/`. The first is still modified and unstaged.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*
