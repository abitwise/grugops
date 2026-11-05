---
phase: 41-orchestrator-flow-guidance
plan: 15
subsystem: tooling
tags: [admission, supersession, admit-freeze, refusal-census, workflow-18, cr-02]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "The fail-closed root ladder (41-13) and one role-name fold (41-14), which this plan re-measured against before the span moved"
provides:
  - "admit() refuses a supersedes target that is a green gate verdict or a finding the human_admission dial gates (site S10)"
  - "D-37: the named human's decision and word for the eighth admit() re-base"
  - "S10 in the refusal census, the READ-1 mode supersede, and Workflow 18's two routes proved against the rule"
affects: [41-16]

actuals:
  tokens: 13815
  tasks: 3
  commits: 5
plan_head_before: 7da16b6a9025da496c77b62e8227043028278037
plan_head_after: 3d8ebf0b596c6bbba35747be1035e1109a6a3eb7

tech-stack:
  added: []
  patterns:
    - "A probe whose note needs an id minted at seed time closes over that id, because every consumer stages the probe before it asks for the note"
    - "A test that may not import the authority gets a sealed finding from note.js at off, then moves the dial"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/compactor.test.ts
    - scripts/runnable-ref/note.test.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - .planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md
    - .planning/phases/41-orchestrator-flow-guidance/deferred-items.md

key-decisions:
  - "D-37: option narrow, by Olger, on 2026-11-05: admit() refuses a green verdict or a gated finding as a supersedes target, and a target that names no note is admitted"
  - "The plan's measurements were re-taken at 7da16b6a before the span moved, and they still described what the human decided on"

patterns-established:
  - "A pin that claims a truth is watched failing on a mutant before it counts"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "CR-02: under human_admission: all, a note naming a sealed security-nfr finding stamped human:olger ends refused, exit 1, writes nothing, and the finding stays in the current state"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#--supersedes never retires a verdict or a governed finding (CR-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A green verdict is refused as a target at off and all, and a finding stamped with its run is still admitted afterwards"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#under human_admission: all, a green verdict is refused as a target, and a finding stamped with its run is still admitted"
        status: pass
    human_judgment: false
  - id: D3
    description: "Workflow 18's two routes hold: promote and promoteAdmitted admit a target the destination never held, and refuse a verdict or a governed finding it does hold"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/compactor.test.ts#Workflow 18 — both promotion routes hold against the supersession rule (41-15, D-37)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A named human's route stands: a finding the gated branch persists may name a governed finding"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/compactor.test.ts#a finding the gated branch persists may name a governed finding, because a named human's route stands"
        status: pass
    human_judgment: false
  - id: D5
    description: "S10 is held at every derived writer, the count moved 9 to 10, and a failed read of the new lookup never ends noted"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "npx vitest run scripts/context-io-writer-set.test.ts scripts/runnable-ref/note-read-sites.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "The decision that a target naming no note is admitted, and what stays open under it"
    verification: []
    human_judgment: true
    rationale: "No agent may accept a residual. D-37 records Olger's decision, and plan 41-16 writes R-41-09 for a named human to read"

duration: 49min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 15: Supersession decided in admit() Summary

**`admit()` now refuses a note that names a green gate verdict or a dial-gated finding in `supersedes`, on every route that reaches it, and regenerated `note.js` carries the rule to a lone host copy. Workflow 18's two promotion routes still work, on Olger's word for the eighth re-base of the freeze.**

## Performance

- **Duration:** 49 min, of which about 25 min was the full suite and about 10 min the re-measurement
- **Started:** 2026-11-05T20:16:48Z
- **Completed:** 2026-11-05T21:06:00Z
- **Tasks:** 3 (Task 1 was answered before this dispatch)
- **Files modified:** 21 (7 by hand, 14 by the generators and the build)

## The decision

- **Option taken:** `narrow`
- **Name given:** Olger
- **Date:** 2026-11-05, at plan 41-15's Task 1 checkpoint
- The human's reply, verbatim: `narrow, Olger`. It said nothing further about the freeze.

D-37 records this in 41-CONTEXT.md, committed before any byte of the span moved.

## Accomplishments

- The CR-02 reproduction now ends `refused t1:`, exit 1. The tree is unchanged, including the ledger, and the finding stays in `## Current state`.
- A green verdict cannot be retired at any dial, so later findings stamped with that run are still admitted.
- What counts as governed is `isGatedNote`. `admit()` writes no second statement of the composition.
- Honest supersession is unchanged, and under `off` a finding folds out as it did.
- The D-03 duplicate-verdict clause no longer promises a supersession that no route offers.

## Re-measured before the span moved

The plan's measurements were taken at 0e780dfc. They were re-taken at 7da16b6a in a throwaway clone, because the authorisation covers the change as described.

| Case | HEAD | Three arms | Two arms (`narrow`) |
|------|------|-----------|---------------------|
| `promote`, target in no store | admitted | refused | admitted |
| `promoteAdmitted`, destination lacks target | admitted | refused | admitted |
| `promote`, target a governed finding under `all` | admitted, finding retired | refused | refused |
| `promote`, target a green verdict at `off` | admitted, verdict retired | refused | refused |
| `promote`, target an ordinary note | admitted, folds out | admitted | admitted |

Across 22 test files, the two-arm variant added 12 failures to HEAD's 9, all named: 1 freeze hash case, 9 census cases, and 2 from an uncommitted tree. Those two (`hooks/hook-entry.ts has no uncommitted modification` and `capture-live` P5, whose message picked up `trace-render`) passed once the variant was committed in the clone. So the first arm still breaks Workflow 18, and the other two arms still break nothing. The plan proceeded.

One prediction differed. The plan names `the extracted span` among the moved cases, and that case stayed green here.

## Pins moved

| Pin | From | To | Reason |
|-----|------|----|--------|
| `ADMIT_FROZEN_SHA256` | `1bc759a5…813f` | `4750c1aa…0e7b` | The eighth re-base, cited to D-37 |
| `EXPECTED_ADMIT_REFUSAL_SITE_COUNT` | 9 | 10 | Site S10, with a `MOVED` paragraph naming the decision |
| S4's signature | `until the duplicate is superseded` | `until a named human resolves the duplicate` | The reworded clause |
| READ-1 `MODES` | 7 modes | 8 modes | The mode `supersede` |

`SECOND_SOURCE_SIZE` stays 9 and `UNREACHED_SIZE` stays 17, with no edit to either map. `hooks/hook-entry.ts`'s manifest moved by its generator.

## Task Commits

1. **Task 1: the checkpoint** - answered before this dispatch, with no commit
2. **Task 2: the tracer**
   - `01c27aa3` (docs, D-37, written first)
   - `1f2f4567` (test, RED)
   - `fe51aa46` (feat, GREEN and the re-base)
3. **Task 3: the census and Workflow 18** - `18f33a03` (test)

**Deviation:** `3d8ebf0b` (test), three more pins. See Deviations.

The tracer gate ran after Task 2. Its `<verify>` carries only `<automated>` under `end-of-phase`, so it was re-run on the committed tree. It passed, and expansion went ahead.

## RED evidence

**Task 2:** the target was `under human_admission: all, a claim that names a human-disposed security finding is refused and the finding stays`. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK`, `target_test_failed`. It failed on `status 0; stdout noted t1 ...: expected +0 to be 1`, which is the planned behaviour. The 5 cases that assert a refusal failed, and the cases pinning unchanged behaviour passed. The first record returned `INVALID_RED`, because a multi-line Map diff broke the TAP report. The case now asserts the refusal first through `expectRefused`, and the planned assertion did not change.

**Task 3:** no `test`-then-`feat` pair exists, because the behaviour landed in Task 2. Its RED was the 9 census cases Task 2 left red by design, and the Workflow 18 cases passed on their first run. Passing first proves little, so each was then watched failing on a mutant.

## Mutants, each in the clone

| Mutant | What went red |
|--------|---------------|
| First arm added back | 4 Workflow 18 cases and the `nosuchid` case |
| Rule removed | 2 Workflow 18 cases and 5 CR-02 cases |
| New lookup fails open | READ-1, through the `supersede` mode |
| Composition written out in the block | the one-predicate pin and the freeze hash |
| A predicate added to the hand-written part of note.ts | the hand-written-part pin |
| The gated branch refuses a `supersedes` | the human-route pin |

## Verification

- All `<automated>` commands of Tasks 2 and 3 passed, and every acceptance grep gave its expected value.
- `scripts/context-io.test.ts` and `scripts/context-io-writer-set.test.ts`: 9 failed, all in § Known baseline reds.
- **Full suite** (`npx vitest run --exclude '**/scripts/e2e/**'`, at `18f33a03`, 1,472 s): 21 failed, 11,562 passed, 2 skipped. Compared by name, the 21 failures are exactly § Known baseline reds, with none added and none missing. No EDQUOT appeared.
- `3d8ebf0b` came after that run and changes three test files only. Those were re-run: `scripts/compactor.test.ts` and `scripts/runnable-ref/note.test.ts` gave 278 passed, and the `byte-freeze` block gave 3 passed.
- At `3d8ebf0b`: `npm run freshness` (91 `.js` fresh), `node scripts/check-diff-disposition.js` and `node scripts/check-foundation-guards.js` passed.

## Decisions Made

- D-37 has its own commit ahead of the RED commit, so the history shows the word came before the span moved.
- The refusal's closing sentence is the plan's, word for word, and the string is split so `may be superseded only through` stays on one line.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Three stated truths had no test**
- **Found during:** review of the plan's truths after Task 3
- **Issue:** the plan states that a human's gated route stands, and it marks two prohibitions `verification: test`: no second composition in `admit()`, and no predicate in the hand-written part of note.ts. Task 2's greps covered the last two only at one moment, and nothing drove the first.
- **Fix:** three cases, each watched failing on a mutant
- **Files modified:** scripts/compactor.test.ts, scripts/context-io.test.ts, scripts/runnable-ref/note.test.ts
- **Verification:** the three files pass. The full suite ran one commit earlier.
- **Committed in:** `3d8ebf0b`

**2. [Rule 3 - Blocking] The sealed finding is written by note.js, not built with `ctxio.noteSeal`**
- **Found during:** Task 2
- **Issue:** the plan's `read_first` points at `sealedNote`, and scripts/runnable-ref/note.test.ts's header forbids importing the authority.
- **Fix:** `note.js` seals the finding at `off`, and the case then moves the dial. The note is real and sealed, and only the dial's history differs.
- **Files modified:** scripts/runnable-ref/note.test.ts
- **Verification:** the CR-02 cases went RED, then GREEN
- **Committed in:** `1f2f4567`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking).
**Impact on plan:** Neither moved the rule past what the human decided. The span moved once.

## Issues Encountered

- My first draft of the CR-02 cases matched the note id against `index.md`, whose rows carry no id. That made two cases red for the wrong reason and made every `not.toContain(id)` vacuous. They now match the row's kind and author, and each folds-out case first asserts that the row is present.
- **A dial raised after a retirement.** Measured: a note admitted at `off` that names a finding, when appended again with identical bytes after the dial moves to `all`, is now refused. Re-promotion stays idempotent at `off`. Nothing is lost, because the note is already stored, and the case is outside this plan's design. No test pins it, and it is not in R-41-09's planned wording.
- **Workflow 18's stop still says `Record the new result as a NEW note that supersedes the old one`.** The rule can now refuse that note. Plan 41-16 covers Workflow 16 and does not name this sentence, so it is logged in deferred-items.md.

## Requirements

RUN-02 and RUN-05 are declared by plan 41-16 too, so `requirements.ready-ids` blocks them until that plan finishes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 41-16, which owes R-41-09, Workflow 16 step 3, the CHANGELOG bullet and CR-02's ledger row. Quote the name from D-37 and add nothing to it. A named human still owes the read of R-41-09. `--supersedes nosuchid` still ends `noted`, and a note naming an id that arrives later still folds that note out on arrival. That is the decided residual, not a defect of this plan.

## Self-Check: PASSED

All five commits are ancestors of HEAD, and every file in `key-files` exists. `git rev-list --count 7da16b6a..3d8ebf0b` is 5.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
