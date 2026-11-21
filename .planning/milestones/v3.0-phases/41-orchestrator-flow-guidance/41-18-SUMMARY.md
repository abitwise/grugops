---
phase: 41-orchestrator-flow-guidance
plan: 18
subsystem: context-admission
tags: [context-io, admit, supersedes, human_admission, T-41-64, D-39, note.js, vitest]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "plan 41-15's supersession block in admit() (CR-02, D-37) and plan 41-17's committed tree"
provides:
  - "admit() refuses a supersedes target that is in the store and cannot be read, at every dial, through one walk (readRawNotesWithSkips)"
  - "the ninth re-base of ADMIT_FROZEN_SHA256, quoting the human's reply recorded as D-39"
  - "refusal census S11 with a probe that needs no privilege; EXPECTED_ADMIT_REFUSAL_SITE_COUNT 10 -> 11"
  - "host-copy cases for every unreadable shape, D-37's control, the adjacency case, both Workflow 18 routes, the READ-1 EIO route and the LIMIT"
  - "Workflow 16 step 3, R-41-09, CHANGELOG and one pending (named human) disposition row"
affects: [gsd-secure-phase T-41-64 re-audit, R-41-09, T-41-81]

actuals:
  tokens: 8537
  tasks: 3
  commits: 4
plan_head_before: c226b4e41bc06c752c1c9420e725d861e512ad83
plan_head_after: 7d2e8e0d67da06d9ce2c5db97ecaecd2e89efaa6

tech-stack:
  added: []
  patterns:
    - "One walk answers both questions: the readable note and the skipped entry for a target come from the same read"
    - "A chmod-000 case is skipped by name through hostCapabilityOrSkip and asserts its premise when it runs"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-18.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/runnable-ref/note.test.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - scripts/compactor.test.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - docs/audit/41-residuals.md
    - CHANGELOG.md
    - "generated: scripts/context-io.js, scripts/runnable-ref/{note,claim,state-check,trace-render,state-roll}.{ts,js}, hooks/hook-entry.{ts,js}"

key-decisions:
  - "41-18: admit() refuses a supersedes target when no readable note carries the id and the walk skipped a file named <id>.md, at every dial (D-39); it asks no other skipped entry, so D-37 stands"
  - "41-18: the ninth re-base of the admit() freeze rests on Olger's reply of 2026-11-07, recorded as D-39; the span moved once, for one read and one refusal"
  - "41-18: a renamed note file that cannot be read is matched by nothing and reads as naming no note; R-41-09 and T-41-81 record it as not accepted"

patterns-established:
  - "expectUnreadableRefused(root, id) beside expectSupersessionRefused: the refusal phrase and an unchanged tree"

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "The audit's route: a target at mode 000 under all is refused, exit 1, no note, and the finding stays in the current state once the mode is restored (T-41-64)"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#the audit's route: a target at mode 000 is refused, and the finding stays once the mode is restored (T-41-64, D-39)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every other unreadable shape refuses with no privilege: broken seal, not a note, directory, above the ceiling, FIFO, dangling link; and at off too"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#a target that is ${shape} is refused, because it is in the store and cannot be read (T-41-64, D-39)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#a target that is a FIFO is refused, and never waited on (T-41-64, D-39)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#a target that is a dangling link is refused (T-41-64, D-39)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#an unreadable target is refused at off too, because it may be a green verdict (D-39)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A failed read of the target refuses on any account: EIO at each read of the walk in mode supersede ends exit 1, no note"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#a failed read of a supersedes target refuses the note on any account: exit 1, and no note is written (T-41-64, D-39)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-37 stands and the rule still judges a readable note; both Workflow 18 routes hold"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#CONTROL: a target that names no note stays admitted while a different note cannot be read (D-37 stands)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#a readable note under the id outranks an unreadable file of that name, so the rule still judges it (edge RUN-02 adjacency)"
        status: pass
      - kind: unit
        ref: "scripts/compactor.test.ts#promote refuses a note whose target is in the destination and cannot be read (T-41-64, D-39)"
        status: pass
      - kind: unit
        ref: "scripts/compactor.test.ts#promoteAdmitted refuses on its fall-through when the destination holds the target and cannot read it (T-41-64, D-39)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The admit() span moved once (ninth re-base, quoting D-39) and the census holds S11 at every writer"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#admit()'s function span byte-hash equals the pinned pre-25-09 baseline (frozen, not green-inferred)"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts (196 cases; the 2 failures are 31-14 baseline names)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The limit that stays open: a renamed file that cannot be read reads as no note (R-41-09, T-41-81)"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#LIMIT (R-41-09): a target is matched by its file name, so a renamed file that cannot be read reads as no note"
        status: pass
    human_judgment: true
    rationale: "The test pins the behaviour; whether the route is acceptable is a residual only a named human may accept or send back for closing"
  - id: D7
    description: "Workflow 16, R-41-09, the CHANGELOG and the 41-18 disposition row say what is fixed and what stays open"
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#says, straight after the target that names no note, that an unreadable target is refused (T-41-64, D-39)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "Task 3 <human-check>: a named human reads R-41-09 against D-37 and D-39 and the pending (named human) row against the diff; the gate proves a row exists, not that it is right"

duration: 41min
completed: 2026-11-07
status: complete
---

# Phase 41 Plan 18: An unreadable supersedes target is refused Summary

**`admit()` now reads a `supersedes` target through one walk, `readRawNotesWithSkips`, and refuses at every dial when no readable note carries the id and the walk skipped a file named for it: `admission REFUSED: note "ID" under task "TASK" is in the store and cannot be read (ARM) ...`. The audit's mode-`000` route, and a broken seal, text that is not a note, a directory, a FIFO, a dangling link and a file above the ceiling, each end exit 1 with no note. A target that names no note is still admitted (D-37).**

## The limit the human must see (R-41-09, T-41-81, not accepted)

D-39 says a target in the store that cannot be read. The walk files a skipped entry by its file name, and an unreadable file
gives no frozen id. So **a note file that was renamed and made unreadable reads as naming no note**: `renamed.md` with a broken
seal, and a claim naming the frozen id, ends `noted`, exit 0, and the finding leaves `## Current state` once the file reads
again. The case `LIMIT (R-41-09)` in `scripts/runnable-ref/note.test.ts` pins it. Closing it means refusing a target that names no
note whenever any entry cannot be read, which D-37 rules out (mutant `any-skip` shows the D-37 control going red). R-41-09 records
the route, and T-41-81 stays `pending (named human): accept`. **No human has accepted it.** Only a named human can trade one for
the other.

## Performance

- **Duration:** 41 min
- **Started:** 2026-11-07T21:47:28Z
- **Completed:** 2026-11-07T22:28:07Z
- **Tasks:** 3
- **Files modified:** 24 (11 hand-edited, 13 generated)

## Accomplishments

- The authority refuses an unreadable target, with one read and one refusal added to the `admit()` span on the human's
  recorded word (D-39), and the refusal reaches every host through the regenerated embeds and hook manifest.
- Every unreadable shape refuses on a lone host copy with no privilege, and the EIO route covers root.
- D-37's control, the adjacency case and both Workflow 18 routes hold. The census names S11 at every writer.
- The text says the rule beside the one it qualifies, and the limit is pinned and recorded for the human.

## Task Commits

1. **Task 1 (tracer, TDD): the audit's mode-000 route ends refused on a lone host copy**
   - RED: `12221471` (test)
   - GREEN: `98bbdafd` (feat)
2. **Task 2 (TDD): every unreadable shape, D-37 stands, both Workflow 18 routes** - `ccff130a` (test)
3. **Task 3: the text and records, and the phase gate** - `7d2e8e0d` (docs)

## TDD record

**RED (Task 1).** Two cases in `--supersedes never retires a verdict or a governed finding (CR-02)`: the mode-`000` route and the
broken seal. Run as `npx vitest run scripts/runnable-ref/note.test.ts -t "T-41-64" --reporter=tap-flat` at `c226b4e4` plus the
test: exit 1, 59 tests, 2 failed, both targets. Each failed on `expected +0 to be 1` on the status, with stdout
`noted t1 <id>`. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format `tap`) for each
target. Semantic assessment: both targets ran and failed for the intended reason, the unreadable target was retired; the
mode-`000` premise (`readFileSync` throws `EACCES`) held before the run, so the case did not pass on a readable file; no load,
fixture or collection fault.

**GREEN (Task 1).** The one walk and the refusal in `admit()`; note.test.ts 59 of 59, compactor and note 280 of 280.

**Task 2** adds cases over behaviour that landed in Task 1, so its RED evidence is the mutants below.

**Task 3 RED.** The new pin and the moved `The program stamps` string failed (2 failed, 86 passed) before Workflow 16 was edited,
and passed after.

## Mutants (Task 2), each seeded once in scripts/context-io.ts, built, regenerated, run on the three files, restored

| Mutant | Edit | Cases turned red | Restored |
|---|---|---|---|
| `no-refusal` | `unreadable` always `undefined` | 11: the mode-`000` case, the four table shapes, FIFO, dangling link, `at off too`, the READ-1 supersede case, and both compactor `T-41-64` cases | yes |
| `any-skip` | `unreadable` from `stored.skipped[0]` | 2: `CONTROL: ... (D-37 stands)` and `LIMIT (R-41-09) ...` | yes |
| `only-unopenable` | the find also requires `entry.arm === "unopenable"` | 9: the four table shapes, FIFO, dangling link, `at off too`, both compactor cases; the mode-`000` and READ-1 cases stayed green | yes |

Each set is the one `<measured_at_planning>` names. After each restore the 14 generated and source paths were checked out by name,
`npm run build` and `generate:runnable-embeds` were re-run, `git status` showed no change, and a grep for each mutant's text in
`context-io.ts`, `context-io.js` and `note.js` found 0.

## Verification

- Task 1: build, typecheck, note and compactor 280 of 280; `-t "byte-freeze"` 3 passed; writer-set 194 passed, 2 failed, both
  31-14 baseline names; both freshness checks fresh. All ten acceptance greps print the expected value.
- Task 2: the five files of the first command 546 of 546; `context-io` and `context-io-writer-set` 940 passed, 1 skipped, 9 failed,
  each a baseline name (two 31-14, one 31-23 PROBE 5, six 31-29); foundation guards, validate-agent-factory and both freshness
  checks pass. `SECOND_SOURCE` 9, `UNREACHED` 17 and `NOTE_READ_SITES` 19 unchanged; no `.fails` or `.todo`.
- Task 3: flow-guidance-text and tier-kit-text 311 of 311; imperative-lexicon, role-rules, kit-refs, diff-disposition,
  banned-claims, residual-citations, audit-register, claim-anchors, public-docs, foundation-guards, validate-agent-factory,
  state-paths and uat-oracles each `ALL CHECKS PASSED`; runnable-embeds, hook-manifest and queue fresh. After the commit:
  `npm run freshness` reports 91 committed `.js` fresh, and floor-invariance 136 of 136.
- `git diff --quiet d926f3cd` over 41-SECURITY.md, 41-VERIFICATION.md and 41-REVIEW-DISPOSITION.md exits 0.

### Full suite (phase gate), compared by name

`npx vitest run --exclude '**/scripts/e2e/**'` in the background with a 3,600 s limit, `TMPDIR=$HOME/.cache/grug-tmp`, on the
committed tree at `7d2e8e0d`: 144 files, 11,625 tests, 11,601 passed, 2 skipped, 22 failed, 1,520 s.

Compared by name with 41-VALIDATION.md § Known baseline reds: all 21 baseline names failed, and one name outside the table failed:

| File | Failed test | Baseline |
|---|---|---|
| install/installer-fs-census.test.ts | installer fs census — the read axis ... > every node:fs export whose name may mark a content read is classified ... | yes |
| scripts/canonical-corpus.test.ts | ... > provenance: every cited source artifact resolves on disk | yes |
| scripts/check-foundation-guards.test.ts | LANG-07 ... > every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose | yes |
| scripts/context-io-writer-set.test.ts | 31-14 ... > every derived decline clause is enumerated, and the document names no other | yes |
| scripts/context-io-writer-set.test.ts | 31-14 ... > the disposition document exists and carries the enumeration heading | yes |
| scripts/context-io.test.ts | 31-23 PROBE 5 ... > the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md ... | yes |
| scripts/context-io.test.ts | 31-29 ... > CONVERSE 1 ... | yes |
| scripts/context-io.test.ts | 31-29 ... > CONVERSE 2 ... | yes |
| scripts/context-io.test.ts | 31-29 ... > DIRECTION 1 ... | yes |
| scripts/context-io.test.ts | 31-29 ... > DIRECTION 2 ... | yes |
| scripts/context-io.test.ts | 31-29 ... > PREMISE: the document was read and it names residual ids at all | yes |
| scripts/context-io.test.ts | 31-29 ... > a SEEDED undispositioned member turns the equality RED | yes |
| scripts/harness-instance-ledger.test.ts | 31-37 WR-34 ... > every FILE a row cites exists in the tree it names | yes |
| scripts/harness-instance-ledger.test.ts | 31-37 WR-34 ... > every MECHANISM a row claims is greppable ... | yes |
| scripts/harness-instance-ledger.test.ts | 31-40 IN-21 ... > PREMISE: the live tree's own reading ... | yes |
| scripts/harness-instance-ledger.test.ts | 31-40 IN-21 ... > a mirror with a MAJORITY of rows stripped turns the new CEILING red | yes |
| scripts/uat-gate-exit-contract.test.ts | every plan of round 6 ... > all five round-6 PLAN files state it, and the count is asserted at five | yes |
| scripts/uat-gate-exit-contract.test.ts | the harness-false-result tally ... > SEPARATOR SEAM (test AE, plan 33-18) ... | yes |
| scripts/uat-gate-exit-contract.test.ts | the harness-false-result tally ... > every ordinal-claiming sentence in the scanned set appears in the tracked list | yes |
| scripts/uat-gate-exit-contract.test.ts | the harness-false-result tally ... > the round-5 collision is ANNOTATED in the list ... | yes |
| scripts/uat-gate-exit-contract.test.ts | the harness-false-result tally ... > the scanned document set is DERIVED and its cardinality is asserted ... | yes |
| scripts/capture-live.test.ts | --dry-run walks every phase against the committed fixture and makes no model call (D-10) > exits 0, prints GO-READINESS ... and its artifacts re-check | **no** |

The capture-live case is the false failure the plan names for a `TMPDIR` on the root disk. `scripts/capture-live.test.ts` was
re-run alone on the default `TMPDIR`: 77 of 77 passed. No other file was re-run alone. The `LIVE COUNT` name stays on the baseline
while the user's untracked `~/` directory exists. So the suite ends on exactly the 21 baseline names once that one case is read on
the default `TMPDIR`.

## Files Created/Modified

- `scripts/context-io.ts` - the one walk, the `unreadable` binding and the S11 refusal in `admit()`; `reaches neither arm` became `reaches no arm`
- `scripts/context-io.test.ts` - the ninth re-base with the `PLAN 41-18 DELIBERATE UNFREEZE + RE-BASELINE (T-41-64)` paragraph quoting D-39
- `scripts/context-io-writer-set.test.ts` - S11 row, `MOVED 10 -> 11` paragraph, `unreadableTargetProbe`
- `scripts/runnable-ref/note.test.ts` - `fileOf`, `expectUnreadableRefused`, the mode-`000` case, the shapes table, FIFO, link, `off`, CONTROL, adjacency, LIMIT
- `scripts/runnable-ref/note-read-sites.test.ts` - the READ-1 supersede case
- `scripts/compactor.test.ts` - the two Workflow 18 cases
- `scripts/flow-guidance-text.test.ts` - the new pin, and the moved `The program stamps` string
- `agent-factory/workflows/16-context-read-write.md` - one sentence on line 31
- `docs/audit/41-residuals.md` - line 6 and R-41-09
- `CHANGELOG.md` - one `### Security` bullet
- `docs/audit/29-style-dispositions/41-18.md` - one row, `pending (named human)`
- Generated, never hand-edited: `scripts/context-io.js`, `scripts/runnable-ref/{note,claim,state-check,trace-render,state-roll}.{ts,js}`, `hooks/hook-entry.{ts,js}`

## Decisions Made

- The block sits below the D-14 read and above the D-04 arm and the GOV-02 append, so a refusal writes no ledger line. Its code
  names no `human_admission` field, so it refuses at every dial, which the existing 41-15 structural case also checks.
- The two other `readContext` calls in `admit()` stay. No parameter, flag or exported name was added.
- The broken-seal case of Task 1 was folded into the Task 2 shapes table, keeping its title.
- The dangling-link case is titled `a target that is a dangling link is refused (T-41-64, D-39)`: a link cannot be waited on, so
  the FIFO title's `and never waited on` was not repeated.
- The LIMIT case restores the sealed bytes and re-renders, so it pins that the finding leaves the current state once the read
  recovers, not only that the claim is noted.

## Deviations from Plan

### Ordering

**1. [Rule 3 - Blocking] Task 3 was committed before the full suite ran**
- **Found during:** Task 3
- **Issue:** the plan's text runs the suite, then commits Task 3. `Test P5 (the polluted channel)` in `scripts/capture-live.test.ts`
  reads the words of uncommitted paths, so uncommitted text could fail it falsely.
- **Fix:** committed `7d2e8e0d` first, then ran the suite on the committed tree, then the last gate that reads HEAD.
- **Verification:** the disposition row existed before the suite ran, and the three `check-diff-disposition` cases passed.

---

**Total deviations:** 1 (ordering only). **Impact on plan:** none on behaviour or on what was measured.

## Issues Encountered

None.

## Owed to a named human (not answered by the agent)

- Task 3 `<human-check>`: read R-41-09 in `docs/audit/41-residuals.md` against D-37 and D-39, and the `pending (named human)` row
  in `docs/audit/29-style-dispositions/41-18.md` against the diff; reply with a name and accept or flag each.
- T-41-81 (the renamed-file route) stays `pending (named human): accept`. The agent wrote no acceptance, supplied no name, and
  edited none of 41-SECURITY.md, 41-VERIFICATION.md or 41-REVIEW-DISPOSITION.md.
- The reads of R-41-07 and R-41-09 with their new limits, the live host runs and the Windows check stay owed; Windows stays
  `UNKNOWN - verify`. `/gsd-secure-phase` re-audits T-41-55, T-41-64 and `T-41-71` to `T-41-83`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 41-18 is the last plan of phase 41. `docs/audit/28-prepass-evidence.md` and `~/` are untouched and named by no commit of
this plan.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-07*

## Self-Check: PASSED

All key files exist; commits 12221471, 98bbdafd, ccff130a and 7d2e8e0d are ancestors of HEAD.
