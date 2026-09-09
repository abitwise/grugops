---
phase: 31-autonomous-manual-testing
plan: 18
subsystem: shared-verified-context
tags: [gap-closure, round-4, wave-3, UATX-01, UATX-04, append-only, admission, governance-dial]
status: complete

requires:
  - "31-14 (D-19): the proof-gated re-binding route promoteAdmitted"
  - "31-09 (CR-05): appendNote consults the admission authority unconditionally"
  - "31-15 (WR-15): trustedRepoRoot()'s documented resolution order"
  - "31-17: wave-2 of this round, merged at 261e096"
provides:
  - "an append-only invariant enforced at writeNoteFile, the module's single note-write chokepoint"
  - "PROMOTE_ADMITTED_DECLINES clauses destination-id-occupied, origin-outside-trusted-store, human-stamp-not-gated-at-destination"
  - "PROMOTE_ADMITTED_RESIDUALS member T-31-18-01"
  - "a derived destination-liveness axis over every note writer, with an asserted cardinality and a watched-fail control"
  - "a derived governance-dial set read off isGatedNote's own parsed body"
  - "a checked GOV-02 ledger premise with a re_bound-marked event"
  - "decision D-22, a dated sub-decision of D-19"
affects:
  - scripts/context-io.ts
  - scripts/compactor.ts (behaviour, through the pass-through)
  - agent-factory/workflows/18-context-compaction.md
  - hooks/hook-entry.ts (frozen decider manifest)
  - scripts/checkpoints.ts (stop-bullet cardinality anchor)

tech-stack:
  added: []
  patterns:
    - "enforce at the point of effect, not in the route the reviewer reached"
    - "derive the set, assert the cardinality separately, watch it fail"
    - "assert the verification harness's own premise before believing its result"
    - "one authority per predicate — consult it, never recompose it"
    - "an unchecked premise carrying an audit claim becomes a check or a named residual"

key-files:
  created:
    - docs/audit/29-style-dispositions/31-18.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/compactor.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
    - .planning/phases/31-autonomous-manual-testing/deferred-items.md

key-decisions:
  - "D-22 (2026-09-09, gap-closure round 4 wave 3): the shared verified context is APPEND-ONLY as a property of the write; the proof's left operand is bytes the module has independent reason to trust; the governance dial's VALUE decides through the one gated authority. A dated sub-decision of D-19, extending (2), (3) and (4) and editing none of them."
  - "The append-only check lives at writeNoteFile, not in promoteAdmitted alone, because the doctrine is to ask how a chokepoint is REACHED — a check in the one reached route leaves the capability for the next writer that accepts a caller-chosen id."
  - "Identical destination bytes are a DECIDED idempotent re-promotion that proceeds as a no-op, not a refusal: a re-run compaction has nothing to destroy and the caller's post-condition already holds."
  - "The origin operand is recognised by SHAPE or by trustedRepoRoot(), never by the route's repoRoot test seam — a caller able to supply both the governance root and the origin would be choosing the location its own proof is judged inside."
  - "The GOV-02 ledger premise became a CHECK rather than a named residual, because the destination repository's ledger is a file the route already holds the root for, so the premise cost one read."
  - "The decline register's prose enumeration was RE-HOMED from 31-14-SUMMARY.md to 31-CONTEXT.md: a summary is one round's history, and the derived clause set is a standing answer a later round may move."

requirements-completed: []

coverage:
  - deliverable: "The append-only invariant at the write chokepoint (CR-11)"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#31-18 — CR-11: a promotion cannot destroy admitted evidence"
        status: pass
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#31-18 — the destination-liveness axis is derived, and every writer is driven at a live destination"
        status: pass
      - kind: command
        ref: "node prefix-probe.mjs — the verifier's four-step reproduction, re-run against the committed .js"
        status: pass
    human_judgment: false
  - deliverable: "The constrained proof operand and the named residual (WR-17)"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#31-18 — WR-17: the proof's left operand comes from a location the module trusts"
        status: pass
      - kind: command
        ref: "the review's four-row per-dial table, re-run against the committed .js"
        status: pass
    human_judgment: false
  - deliverable: "The dial's value through the one authority, and the decided ledger premise (WR-18)"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#31-18 — WR-18: the dial's value decides, through the one gated authority"
        status: pass
      - kind: command
        ref: "postfix-wr18.mjs — both routes driven per dial with a trusted origin"
        status: pass
    human_judgment: false
  - deliverable: "Workflow 18's prose moved with the mechanism"
    verification:
      - kind: command
        ref: "npm run check:diff-disposition — 0 clauses owed for 18-context-compaction.md"
        status: pass
      - kind: command
        ref: "npm run check:imperative-lexicon — ALL CHECKS PASSED"
        status: pass
    human_judgment: true
    rationale: "Whether the moved prose reads as one protocol to an agent following it is a judgment no test asserts. The gates prove every changed clause is dispositioned and profile-clean; they do not prove it is well said."
  - deliverable: "D-22 recorded in the three places that must agree"
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#31-14 — the register's decline enumeration equals the derived set"
        status: pass
    human_judgment: true
    rationale: "The suite binds the decline enumeration in both directions; that the three prose statements of D-22 say the same thing is a reading, not an assertion."

metrics:
  duration: "2h 55m"
  completed: 2026-09-09
  tasks: 3
  files: 13

commits: 7
plan_head_before: 261e096ce387c7daa7a955727018347ef89b694d

actuals:
  tokens: 46551
  tasks: 3
  commits: 7
---

# Phase 31 Plan 18: Append-only at the point of effect, a trusted proof operand, and one answer per rule Summary

The re-binding route stops being able to destroy admitted evidence, stops accepting a proof whose
bytes the benefiting caller authored, and stops disagreeing with `admitAndAppend` about whether a
`human:NAME` disposition is meaningful — with the append-only property enforced at the module's
single note-write chokepoint rather than in the one route the reviewer walked.

## What was wrong, measured before anything changed

All three findings were reproduced against the **committed** `scripts/context-io.js` and
`scripts/compactor.js` at `261e096`, with no admission grant in the environment, before a single
source line moved.

### CR-11 — the pre-fix transcript, verbatim

Matching `31-VERIFICATION.md` behavioural spot-check row 9:

```
=== PROBE 1 — CR-11 (31-VERIFICATION.md behavioural spot-check row 9) ===
1. legitimate note admitted the normal way -> 20260908T010000Z-qe-observation-bb6438d9
2. forged note REUSING that id promoted -> 20260908T010000Z-qe-observation-bb6438d9
   threw: null
3. notes in the shared context: ["20260908T010000Z-qe-observation-bb6438d9.md"]
   its contents are now:
       ---
       id: 20260908T010000Z-qe-observation-bb6438d9
       kind: finding
       by: security-nfr
       at: 2026-09-08T01:00:00Z
       verified_by: human:mallory
       confidence: high
       refs:
       supersedes:
       ---

       The login lane passed cleanly. Nothing to see here.
```

The same id returned, nothing thrown, one file at the destination, and the admitted `observation`'s
text and provenance gone from the permanent audit trail.

### WR-17 — the pre-fix per-dial table, verbatim

Forged origin outside `.grugops/` entirely, matching the four rows `31-REVIEW.md` WR-17 recorded:

```
DIAL = high-severity appendNote REFUSED (D-04)  | admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = all           appendNote REFUSED (D-04)  | admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = off           appendNote WROTE           | admitAndAppend REFUSED (W3)   | promoteAdmitted WROTE
DIAL = absent        appendNote WROTE           | admitAndAppend REFUSED (W3)   | promoteAdmitted WROTE
```

### WR-18 — the pre-fix disagreement, verbatim

Both routes driven on the **identical** note, per dial value:

```
DIAL = "high-severity"          isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = "all"                    isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = "off"                    isGatedNote=false  admitAndAppend REFUSED (W3)   | promoteAdmitted WROTE
DIAL = a present typo string    isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = a present NON-STRING     isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = ABSENT (no config)       isGatedNote=false  admitAndAppend REFUSED (W3)   | promoteAdmitted WROTE
```

## What changed, and what it now measures

### CR-11 — the post-fix transcript, verbatim

```
1. legitimate note admitted the normal way -> 20260908T010000Z-qe-observation-805b27fa
2. forged note REUSING that id promoted -> null
   threw: context-io.promoteAdmitted: DECLINED (destination-id-occupied). The destination already
   holds a DIFFERENT note under id "20260908T010000Z-qe-observation-805b27fa". Nothing was written.
   The destination already holds a DIFFERENT note under this id. The shared verified context is
   APPEND-ONLY: a supersession is a NEW note, never a rewrite of an existing one, and a promotion
   that replaced a note would delete admitted evidence from the permanent audit trail rather than
   supersede it. Destination bytes IDENTICAL to the proven origin bytes are a different case and are
   decided as an idempotent re-promotion that proceeds — a re-run compaction has nothing to destroy —
   so this clause names only the destructive one.
3. notes in the shared context: ["20260908T010000Z-qe-observation-805b27fa.md"]
   its contents are now:
       kind: observation
       by: qe
       verified_by:
       The login lane FAILED on 3 of 5 scenarios.
```

The destination file is byte-identical to what it held before the refused promotion, and `render()`
and `currentState()` still report the original note — each asserted as its own case.

### WR-17 — the post-fix per-dial table

```
DIAL = high-severity appendNote REFUSED (D-04)  | admitAndAppend WROTE          | promoteAdmitted REFUSED (origin-outside-trusted-store)
DIAL = all           appendNote REFUSED (D-04)  | admitAndAppend WROTE          | promoteAdmitted REFUSED (origin-outside-trusted-store)
DIAL = off           appendNote WROTE           | admitAndAppend REFUSED (W3)   | promoteAdmitted REFUSED (origin-outside-trusted-store)
DIAL = absent        appendNote WROTE           | admitAndAppend REFUSED (W3)   | promoteAdmitted REFUSED (origin-outside-trusted-store)
```

### WR-18 — the post-fix table, re-measured so the DIAL is what discriminates

The first post-fix run of the original probe read `REFUSED (origin-outside-trusted-store)` on the
four gating rows — WR-17's clause fires one step earlier, so that run was measuring the operand, not
the dial. Re-run with a recognised context store as the origin:

```
DIAL = "high-severity"          isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = "all"                    isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = "off"                    isGatedNote=false  admitAndAppend REFUSED (W3)   | promoteAdmitted REFUSED (human-stamp-not-gated-at-destination)
DIAL = a present typo string    isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = a present NON-STRING     isGatedNote=true   admitAndAppend WROTE          | promoteAdmitted WROTE
DIAL = ABSENT (no config)       isGatedNote=false  admitAndAppend REFUSED (W3)   | promoteAdmitted REFUSED (human-stamp-not-gated-at-destination)
```

The two routes agree on all six dial values.

## Derived decline clauses and their dispositions

The standing enumeration now lives in `31-CONTEXT.md`, where the suite reads it. It was re-homed
from `31-14-SUMMARY.md` in this plan: a plan summary records what one round did, and the derived
clause set is a standing answer a later round may move, so the old binding made the current answer
depend on a historical document nobody may rewrite. `31-14-SUMMARY.md` keeps its own six-row table
as the history of that round; the suite no longer reads it.

| Clause | Round |
|---|---|
| `empty-source-id` | 31-14 |
| `unreadable-governance-config` | 31-14 |
| `no-such-origin-note` | 31-14 |
| `origin-note-not-live` | 31-14 |
| `field-differs-from-origin` | 31-14 |
| `body-differs-from-origin` | 31-14 |
| `destination-id-occupied` | 31-18 (CR-11) |
| `origin-outside-trusted-store` | 31-18 (WR-17) |
| `human-stamp-not-gated-at-destination` | 31-18 (WR-18) |

## Measured cardinalities

Every number below was produced by re-running the derivation and READING its output, never by
adjusting a constant until a case passed.

| Derived set | Before | After | What moved it |
|---|---|---|---|
| decline clauses in `promoteAdmitted`'s own body | 6 | **9** | CR-11, WR-17, WR-18 each add one |
| exported note writers reaching `writeNoteFile` | 5 | **5** | unchanged |
| note writers a caller can AIM at a destination id | — | **2** | new axis: `appendNote`, `promoteAdmitted` |
| dial literals `isGatedNote` discriminates by name | — | **3** | new derivation: `all`, `high-severity`, `off` |
| dial cases driven (literals + structural postures) | — | **6** | the three literals plus absent, non-string, unnamed-present |
| `appendPreAdmittedNote` call sites | 3 | **3** | unchanged — no new caller of the private route |
| `WORKFLOW_STOP_BULLET_COUNT` | 39 | **42** | three new stop conditions, tagging list re-walked |
| disposition rows for workflow 18 | 0 owed | **30 written, 0 owed** | the prose moved with the mechanism |

The re-measured decider digest, moved into `DECIDER_MANIFEST`'s two `scripts/context-io.js` entries
rather than the freeze being relaxed:

```
cc1ad1629f3f68a117393498e1c33c994a2aa3d6c626ee196361edaf0cf6e63d  scripts/context-io.js
```

## Mutation proofs

Five mutants, each with the **harness's own premise asserted** before its result was believed: the
build must exit clean and the mutant must be present in the EMITTED `.js`.

| Mutant | Fails | Leaves green | Revert |
|---|---|---|---|
| A — the route's destination read neutralised | the 3 CR-11 destination cases + the `destination-id-occupied` clause probe | the 2 chokepoint cases | all pass |
| B — the write chokepoint's append-only check neutralised | the 2 aimed-at-occupied cases | the route's decline cases | all pass |
| C — the operand constraint neutralised | exactly the 2 WR-17 cases | everything else (501/503) | 503/503 |
| D — the dial's value consultation neutralised | 8 cases across three files | the four gating postures | 723/723 |
| E — the ledger look neutralised | exactly the absent-ledger case | everything else (722/723) | 723/723 |

A and B failing **disjoint** sets is the defense in depth measured rather than claimed: the class is
closed at the chokepoint for every writer, and the route names its own refusal on top.

### The harness caught itself once, which is the point

The first attempt at mutant A reported **PASS** — a false result. The mutant put `false &&` first in
the condition, which killed TypeScript's narrowing of `destinationEntry`, so `tsc` errored, the build
output was suppressed, and the run measured the STALE unmutated `.js`. This repository has logged a
false verification-harness premise six times across four rounds. The harness was rewritten to assert
its own premise — build exits clean, and the mutant string occurs exactly once in the emitted `.js` —
before every subsequent mutant. Both facts are printed by the harness, not assumed.

## The axis nobody drove

Every promotion probe in rounds 1 through 4 of this phase promoted into a **fresh** destination. So
"what does this writer do when the destination already holds a note at the id it is about to write?"
was never asked of any writer, and a green suite never saw CR-11.

`scripts/context-io-writer-set.test.ts` PART SIX-E now derives each writer's destination-id **source**
from its own parsed body — a writer whose body calls `noteId` mints behind a `randomUUID` nonce and
can only ADD; one that does not takes its id from elsewhere — binds every derived writer in both
directions with the two cardinalities asserted separately, drives all five **beside** a pre-existing
note asserting its bytes are untouched, and drives the two caller-id writers **at** the occupied id
asserting the refusal and the survivor. The seeded-mirror control moves the derived count by exactly
one, classifies the seed `caller`, and reports it **unbound**, with the same computation over the
un-seeded source finding nothing unbound.

## Deviations from Plan

### 1. [Rule 3 — Blocker] The decline enumeration's binding pointed at a historical summary

- **Found during:** Task 1
- **Issue:** `scripts/context-io-writer-set.test.ts` asserted the derived clause set EQUAL to a table
  in `31-14-SUMMARY.md`. Adding a clause made that case red, and the only two ways to green it were
  to add a row about a 31-18 clause to a 31-14 record (falsifying history) or to weaken the check.
- **Fix:** re-homed the binding to `31-CONTEXT.md`, the phase's standing decisions file, with the
  reason written at the site. The fail-closed premise (document exists, heading present) is
  unchanged; `31-14-SUMMARY.md` keeps its own table and is no longer read by the suite.
- **Files modified:** `scripts/context-io-writer-set.test.ts`, `31-CONTEXT.md`
- **Commit:** `f3d833a`

### 2. [Rule 3 — Blocker] The frozen decider manifest had to move in Task 1, not only Task 3

- **Found during:** Task 1
- **Issue:** the plan assigns the `DECIDER_MANIFEST` move to Task 3 MOVEMENT 5, but the committed
  `.js` and the manifest must agree at **every** commit or `floor-invariance` and both hook suites go
  red mid-plan.
- **Fix:** ran `npm run generate:hook-manifest` and re-measured with `shasum -a 256` at each of the
  three GREEN commits. Moved, never relaxed; no entry removed or widened.
- **Commit:** `f3d833a`, `f3111c7`, `52d73ad`

### 3. [Rule 2 — Missing critical] Existing probes modelled origins as arbitrary temp directories

- **Found during:** Task 2
- **Issue:** every existing promotion probe passed a bare `mkdtemp` directory as the origin — which
  is exactly the shape WR-17 says a caller must not be able to name. Left alone, the operand
  constraint would have been unverifiable against the legitimate case.
- **Fix:** the origins in `scripts/context-io.test.ts`, `scripts/compactor.test.ts` and
  `scripts/context-io-writer-set.test.ts` are now real `<X>/.grugops/context` stores, which is what a
  compaction actually names.
- **Commit:** `f3111c7`

### 4. [Rule 1 — Bug] Two corpus-derived cardinality guards went red on the workflow prose

- **Found during:** Task 3
- **Issue:** the three new stop conditions moved `WORKFLOW_STOP_BULLET_COUNT` 39→42, and three of the
  added sentences violated the writing profile (`WP-03` descriptive bound ×2, `WP-06` bare
  demonstrative subject ×1).
- **Fix:** the anchor was moved **with the tagging list re-walked** — all three bullets are
  stop-and-fix conditions whose remedy is in the bullet, so none earns a `checkpoint:` tag and the
  roster is unchanged — and the three sentences were **rewritten**, not suppressed. The disposition
  rows were re-split per sentence to match.
- **Files modified:** `scripts/checkpoints.ts`, `agent-factory/workflows/18-context-compaction.md`,
  `docs/audit/29-style-dispositions/31-18.md`
- **Commit:** `52d73ad`

### 5. [Correction] The Task 3 commit message says 32 disposition rows; the measured count is 30

- The commit message was written before the per-sentence re-split settled. The file carries **30**
  rows and `check:diff-disposition` reports **0** owed for workflow 18. The number here is the
  measured one.

**Total deviations:** 4 auto-fixed (2 × Rule 3, 1 × Rule 2, 1 × Rule 1) plus 1 recorded correction.
**Impact:** none widens the plan's scope; three of the four are the plan's own changes colliding with
guards this repository built for exactly this purpose, and each was closed by moving the guard with a
measured value rather than by weakening it.

## Deferred Issues

`npm run check:diff-disposition` reports **77 changed clauses with no disposition row** across four
workflows this plan does not touch — `05-pr-quality-gate.md` (38), `06-uat-pack.md` (25),
`16-context-read-write.md` (12), `17-task-claim.md` (2). The count is **identical before and after**
this plan's prose change, and workflow 18 went from 0 rows owed to 30 written and 0 owed. Pre-existing
and out of scope per the executor scope boundary; recorded in
`.planning/phases/31-autonomous-manual-testing/deferred-items.md`.

## Known Stubs

None. Every clause this plan added is reached by a probe that asserts the refusal and asserts nothing
was written; every residual it leaves is a named member of `PROMOTE_ADMITTED_RESIDUALS` with a reason
true of it and a statement of what would force it closed.

## Frozen floors, asserted

- `hooks/guard.ts` is **untouched** — `git diff 261e096..HEAD -- hooks/guard.ts` is empty, and
  `scripts/floor-invariance.test.ts`'s frozen-blob case passes. `FROZEN_GUARD_BLOB` was not re-based.
- `admit()`'s frozen human-stamp arm is **unedited** — no line of it appears in the plan's diff.
- `DECIDER_MANIFEST` hashes were **moved**, never relaxed: 26 module hashes across 2 deciders, none
  removed, none widened to a wildcard.

## Verification

At `52d73ad`, one commit, all green:

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 test files, 3682 passed, 2 skipped** — matching the 62 files the round-4 verification measured |
| `npm run typecheck` | clean (`tsc --noEmit` + tests + fixtures projects) |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `hooks/guard.test.ts` + `hooks/admission-guard.test.ts` + `scripts/floor-invariance.test.ts` | 439 passed |
| `npm run check:imperative-lexicon` | `ALL CHECKS PASSED` |

## Requirements

`UATX-01` and `UATX-04` remain **unchecked** in `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`.
Only a verification round may flip them; this plan closes findings, it does not certify a requirement.

## Next

Ready for `31-19` (wave 3 continues; it also modifies `scripts/context-io.ts` and was sequenced behind
this plan for that reason).

## Self-Check: PASSED

Created files verified present on disk (`31-18-SUMMARY.md`, `docs/audit/29-style-dispositions/31-18.md`);
all 7 commits verified present in `git log --oneline --all`; `git rev-list --count 261e096..HEAD`
returns **7**, matching the `commits:` frontmatter.
