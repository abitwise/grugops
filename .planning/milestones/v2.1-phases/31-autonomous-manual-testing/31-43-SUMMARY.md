---
phase: 31-autonomous-manual-testing
plan: 43
subsystem: verification-harness
tags: [gap-closure, round-9, platform-shapes, control-observability, record-accuracy, WR-41, IN-20, D-43]
status: complete

requires:
  - "scripts/check-platform-shapes.ts as plans 31-30 and 31-36 left it (the shape corpus, the positive CONTROL assertion, the stale-control and forced-absent seams)"
  - "scripts/context-io.js as plans 31-39 through 31-41 left it (the write chokepoint's decided identical-bytes branch, appendNote's split governance/ledger parameters)"
  - "scripts/is-entry.ts — the ONE entrypoint predicate (RA6-1)"
provides:
  - "a note-position CONTROL that observes its own effect at the target and reads the planted position from the harness's own side"
  - "PLATFORM_SHAPE_OUTCOMES — the closed, exported vocabulary of outcomes a position's driver can report (11 members)"
  - "controlOutcomeLabel / CONTROL_OUTCOME_LABELS / ROW_LABELS — the printed label derived from the outcome, with cardinality asserted in both directions inside the gate"
  - "GRUGOPS_PLATFORM_SHAPES_MIRROR_DRIVER — a named mirror seam with 8 kinds, printing both drivers' digests so a red is known to come from a seeded defect"
  - "D-43 — the changed label semantics and the transcript-comparison warning for the round-6 and round-7 residual records"
affects:
  - "scripts/check-platform-shapes.ts / .js / .test.ts"
  - "scripts/context-io.ts / .js — RD-31-40-03's published coordinate only"
  - "hooks/hook-entry.ts / .js — the re-derived per-module manifest hash"
  - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"

tech-stack:
  added: []
  patterns:
    - "a control observes its own effect: the driver reports what happened AT THE TARGET, and the harness reads the target itself"
    - "a printed label is DERIVED from a closed outcome vocabulary, with the label set's cardinality asserted in both directions"
    - "the row and the failure entry beside it are asserted to agree, in both directions"
    - "a seeded mirror declares itself and proves its difference from the live artifact before any result is read"

key-files:
  created:
    - ".planning/phases/31-autonomous-manual-testing/red-evidence/31-43-task1-red.json"
    - ".planning/phases/31-autonomous-manual-testing/red-evidence/31-43-task2-red.json"
  modified:
    - "scripts/check-platform-shapes.ts"
    - "scripts/check-platform-shapes.js"
    - "scripts/check-platform-shapes.test.ts"
    - "scripts/context-io.ts"
    - "scripts/context-io.js"
    - "scripts/context-io-writer-set.test.ts"
    - "hooks/hook-entry.ts"
    - "hooks/hook-entry.js"
    - ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md"

key-decisions:
  - "D-43 (1) — a control observes its own effect; `the call did not throw` is not evidence that the call did anything. The in-child driver snapshots the target before and after and reports `write` / `identical-no-op` / `no-write` from its state, and the harness reads the planted position from its own side after every CONTROL drive."
  - "D-43 (2) — the note position's ordinary outcome is the IDENTICAL-BYTES NO-OP. `write` was unreachable under that position's own staging, so the old expectation could only be satisfied by a driver reporting on the absence of a throw."
  - "D-43 (3) — a record names the condition that is true: the printed label is DERIVED from the reported outcome over an 11-member closed vocabulary, with a 13-label CONTROL set whose cardinality the gate asserts against that vocabulary in both directions, plus a no-label-is-a-suffix-of-another premise."
  - "D-43 (4) — the row and the failure entry beside it must say the same thing, asserted in both directions; a driver whose report the disk contradicts prints a NOT-ORDINARY label rather than the ordinary one."
  - "D-43 (5) — a label nobody has watched being printed is a label nobody has watched: 8 mirror kinds, each printing both driver digests, drive 11 of the 13 labels live; the 2 unreachable ones are disclosed and driven through the exported derivation, with a live-coverage case asserting they are the ONLY two."
  - "The gate module now runs its CLI behind `isEntrypoint` (the RA6-1 authority), so its vocabulary and derivation can be ASKED of the committed .js rather than re-spelled in the test."

requirements-completed: [UATX-01, UATX-04]

coverage:
  - deliverable: "The note-position CONTROL observes its own effect: the driver reports what happened at the target, and the harness reads the planted position"
    verification:
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#MIRROR: a driver that reports the write value WITHOUT WRITING turns the note CONTROL red"
        status: pass
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#MIRROR: a driver that OVERWRITES the target and reports a no-op is caught by the harness's own read"
        status: pass
      - kind: command
        ref: "node scripts/check-platform-shapes.js"
        status: pass
    human_judgment: false
  - deliverable: "The printed label is derived from the outcome, over a closed vocabulary whose cardinality is asserted in both directions"
    verification:
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#PREMISE: the label set is DERIVED from the vocabulary, with its cardinality asserted both ways"
        status: pass
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#ONE CASE PER LABEL: the module's own derivation produces exactly that label for that outcome"
        status: pass
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#EVERY row's label agrees with the failure entries recorded beside it, in every run"
        status: pass
    human_judgment: false
  - deliverable: "Every reachable label is watched being printed by a seeded mirror confirmed different from the live driver"
    verification:
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#COVERAGE: every label was WATCHED live except the two this platform cannot stage"
        status: pass
      - kind: test
        ref: "scripts/check-platform-shapes.test.ts#COVERAGE: every mirror kind the module publishes was driven by a case above"
        status: pass
    human_judgment: false
  - deliverable: "D-43 records the changed label semantics where a round comparing transcripts across this commit will find them"
    human_judgment: true
    rationale: "Whether the recorded warning is legible enough for a future verification round reading an old transcript against a new one is a judgement no test can take. The table of old-vs-new meanings and the two named residual records are in 31-CONTEXT.md; a human decides whether that is sufficient."

metrics:
  duration: "2h 5m"
  completed: "2026-09-13"
  tasks: 2
  files: 11

actuals:
  tokens: 36359
  tasks: 2
  commits: 6

commits: 6
plan_head_before: 072e542e8aafc2fa63e95dc555c3d34d5d893b21
---

# Phase 31 Plan 43: The Platform-Shapes Control Observes Its Own Effect Summary

The note-position CONTROL now reports what happened AT THE TARGET — observed from the target's own
state and confirmed by the harness's own read of the planted position — instead of reporting that
the writer did not throw over a staging that guaranteed nothing would be written; and every printed
outcome label is derived from an eleven-member closed vocabulary whose cardinality the gate asserts
against its label set in both directions, so a crashed driver no longer prints the refusal label.

**Duration:** 2h 5m (start 2026-09-13T03:50Z, end 2026-09-13T05:55Z) · **Tasks:** 2 · **Files:** 11 ·
**Commits:** 6

---

## The MOVEMENT 1 RED reading — what this plan exists for

Taken at the round-9 base (`072e542`), BEFORE anything was changed, by reproducing the module's own
note-position ORDINARY staging against the committed `scripts/context-io.js`: compose the note by
driving the writer into a throwaway store, plant those exact bytes at the note position in a fresh
store, read the target's stat and bytes immediately before and immediately after the drive.

| | reading |
|---|---|
| note id | `20260913T005235Z-qe-observation-7223f262` |
| ordinary content | 162 bytes |
| verdict the driver reported | **`write`** |
| **label the row printed at the previous commit** | **`ordinary outcome (correct)`** |
| before — size / inode / mtime | 162 / 217606675 / `2026-09-13T00:52:35.370Z` |
| before — sha256 | `2f60f0bbda45c28727c3f5a2d05b0976e368027def4192858d4984b5268f8c98` |
| after — size / inode / mtime | 162 / 217606675 / `2026-09-13T00:52:35.370Z` |
| after — sha256 | `2f60f0bbda45c28727c3f5a2d05b0976e368027def4192858d4984b5268f8c98` |
| changed | bytes **no** · size **no** · inode **no** · mtime **no** · ctime **no** |

Nothing was written at the planted position, the disk was never inspected, and the row printed its
ordinary-outcome label. That is `WR-41`, measured rather than argued.

---

## Accomplishments

### Task 1 — `WR-41`: a note-position control that observes its own effect

- **The in-child driver snapshots the target itself**, before and after the call, and reports
  `write`, `identical-no-op` or `no-write` from what it observed. `statSync` never blocks on a
  non-regular file, and the bytes are read ONLY when the position is a regular file, so the bound
  every drive rests on is unchanged — a planted FIFO is statted, never read.
- **The note position's expected CONTROL outcome is now `identical-no-op`.** `write` was unreachable
  there: the staging plants exactly the bytes the writer would write, so the drive takes
  `writeNoteFile`'s decided identical-bytes no-op branch. The one drive in the module that DOES
  observe a real write is `composeOrdinaryNote`'s, into an empty store — so both outcomes are
  exercised on every ordinary run, by the same driver, from the target's own state.
- **The harness reads the planted position from its own side** after every CONTROL drive, at both
  positions, comparing the bytes against what it planted. A driver's report is not evidence that
  anything happened at a position the harness itself staged.
- **The module runs its CLI behind `isEntrypoint(import.meta.url)`** — the one predicate
  `scripts/is-entry.ts` owns — so the vocabulary and the derivation can be ASKED of the committed
  `.js` instead of re-spelled in the test. The test asserts that importing it does NOT run the gate
  before it reads any answer the import gives.
- **The manifest position is unchanged and re-driven.** Its verdict genuinely discriminated the
  wrapper's own fail-closed deny from the decider's answer; that half of `WR-31`'s fix is the half
  that was already honest.

### Task 2 — `IN-20`: the printed label names the outcome that happened

- **`PLATFORM_SHAPE_OUTCOMES`** publishes the closed vocabulary — 11 members, verified from the
  artifact: `write, identical-no-op, no-write, refuse, answered, fail-closed, no-answer,
  nonzero-exit, signalled, crashed, unclassifiable`.
- **`controlOutcomeLabel` builds the label FROM the outcome.** `CONTROL_OUTCOME_LABELS` = 13,
  `ROW_LABELS` = 16 (verified from the artifact). The gate asserts, before any row is read: the set
  is the vocabulary's size plus two; it repeats nothing; every outcome has a label naming it; every
  non-fixed label belongs to exactly one outcome; and **no published label is a suffix of another**.
- **The row and the record beside it are asserted to agree**, in both directions — an expected label
  with a failure recorded beside it, an unexpected label with none, or a `NOT ORDINARY (x)` whose
  neighbouring entry does not name `verdict=x`, each becomes a named failure.
- **Eight mirror kinds**, each printing both drivers' sha256 and whether they differ. An unknown kind
  is a failure, never a silent fall-through to the shipped driver; a mirror that turned out identical
  to the live driver is a failure too.
- **`D-43`** recorded in `31-CONTEXT.md` with the full old-vs-new label table and the
  transcript-comparison warning.

---

## The outcome vocabulary and the label set, with their cardinalities

Read from the committed `scripts/check-platform-shapes.js`, not typed here:

```
outcomes        11  ["write","identical-no-op","no-write","refuse","answered","fail-closed",
                     "no-answer","nonzero-exit","signalled","crashed","unclassifiable"]
control labels  13  (the ordinary label + the named-refusal label + one per outcome)
row labels      16  (those + "named refusal" + "NOT REFUSED" + "HUNG")
mirror kinds     8
```

## Every label whose text or meaning changed

| Label | What it used to read / mean | What it reads / means now |
|---|---|---|
| `ordinary outcome (correct)` (note position) | the driver's `appendNote` call did not throw | the driver observed the position's ordinary outcome AT THE TARGET **and** the harness read the planted position and found the composed note |
| `ordinary outcome (correct)` (manifest position) | the wrapper returned the decider's own decision | unchanged, **plus** the harness's read of the planted module |
| `REFUSED (wrong)` | EVERY outcome that was not the expected one — a crash, a no-answer, a non-zero exit and a genuine refusal alike | ONLY a CONTROL refused by that position's own named clause |
| `NOT ORDINARY (<outcome>)` | did not exist | the outcome the driver actually reported, named |
| `named refusal` / `NOT REFUSED` / `HUNG` | unchanged | unchanged — the refusal rows' text is deliberately unmoved |

**Assertion texts changed deliberately**, recorded because a future round may diff them:

- `scripts/check-platform-shapes.test.ts` (31-36 case): `/verdict=refuse, expected write/` →
  `/verdict=refuse, expected identical-no-op/`.
- `scripts/check-platform-shapes.test.ts` header: the paragraph stating "The module cannot be
  IMPORTED … it is a CLI that calls `process.exit(main())` at load" now records that this was true
  until plan 31-43 and states what replaced it.

## Both mirrors' results — and the six more that were added

Every row below is the note position's `ordinary regular file (CONTROL)` row, measured on this
repository. Every mirror printed `differ  yes` with two distinct sha256 digests before any row was
read. The `DECIDER_MANIFEST` CONTROL row printed `ordinary outcome (correct)` in all eight, which is
the control that a note-position mirror does not reach the other position.

| Mirror kind | Row label | Gate |
|---|---|---|
| `reports-write-without-writing` (plan-required) | `NOT ORDINARY (write)` | 4 CHECK(S) FAILED |
| `overwrites-the-target-and-reports-a-no-op` | `NOT ORDINARY (identical-no-op)` | 6 CHECK(S) FAILED |
| `deletes-the-target-and-reports-what-it-observed` | `NOT ORDINARY (no-write)` | 6 CHECK(S) FAILED |
| `reports-the-positions-own-refusal-clause` | `REFUSED (wrong)` | 2 CHECK(S) FAILED |
| `crashes-without-printing` (plan-required) | `NOT ORDINARY (nonzero-exit)` | 4 CHECK(S) FAILED |
| `exits-silently-without-reporting` | `NOT ORDINARY (crashed)` | 4 CHECK(S) FAILED |
| `signals-itself` | `NOT ORDINARY (signalled)` | 4 CHECK(S) FAILED |
| `reports-a-token-outside-the-vocabulary` | `NOT ORDINARY (unclassifiable)` | 4 CHECK(S) FAILED |
| *(the pre-existing stale-control seam)* | `NOT ORDINARY (refuse)`; manifest `NOT ORDINARY (fail-closed)` | 5 CHECK(S) FAILED |

Under the old label derivation every one of those rows printed **`REFUSED (wrong)`**. That is the
`IN-20` defect, and it is now watched being absent.

## The module's own counts on this repository

```
node scripts/check-platform-shapes.js  → EXIT 0
DRIVEN (13)
SKIPPED SHAPES (0):
  (none) — this platform constructed every shape in the corpus
ALL CHECKS PASSED
```

`DRIVEN (13)` is unchanged from the previous commit; `SKIPPED SHAPES (0)` is unchanged.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-platform-shapes.test.ts` | **25 passed (25)**, 1 file |
| `node scripts/check-platform-shapes.js` | **EXIT 0**, `DRIVEN (13)`, `SKIPPED SHAPES (0)`, `ALL CHECKS PASSED` |
| `npm run build` | clean |
| `npm run typecheck` | clean (3 projects) |
| `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | `All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources.` |
| `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **Test Files 66 passed (66)**, **Tests 4349 passed \| 2 skipped (4351)** |
| `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` | **byte-unchanged** by this plan (`git diff --quiet` → yes) |

RED evidence: `red-evidence/31-43-task1-red.json` (5 failed / 7 passed) and
`red-evidence/31-43-task2-red.json` (13 failed / 12 passed). `gsd_run check tdd-red-evidence` cannot
parse vitest's reporter output, so both files record the MEASURED red with the quoted assertion
messages; no tool verdict is claimed.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical] The gate module was made importable behind the one entrypoint predicate**

- **Found during:** Task 1, writing the RED cases.
- **Issue:** the plan requires the label set to be DERIVED and its cardinality asserted. The module
  called `process.exit(main())` at load, so a test could only re-spell the vocabulary beside it —
  the set-literal drift class this phase has already paid for twice. Importing it in a vitest worker
  would have called `process.exit` inside the worker.
- **Fix:** the CLI now runs behind `isEntrypoint(import.meta.url)`, the single authority
  `scripts/is-entry.ts` owns and that `check-foundation-guards.test.ts` requires (no per-file
  spelling was introduced). The test asks the COMMITTED `.js` for its exports in a child process and
  asserts first that the import did not run the gate.
- **Files:** `scripts/check-platform-shapes.ts`, `scripts/check-platform-shapes.test.ts`.
- **Verification:** the export-probe premise case; `node scripts/check-platform-shapes.js` still
  exits 0 and drives 13 rows.
- **Commit:** `36b124a`.

**2. [Rule 1 — Bug] `RD-31-40-03`'s published coordinate named a function the code had left**

- **Found during:** Task 1, on the full-suite run.
- **Issue:** the assembled write-path call moved from `writeContextDriver` into `contextDriverBody`
  when the driver gained mirror arms. The published residual in `scripts/context-io.ts` quotes its
  site's own source, and its quotation-binding case in `context-io-writer-set.test.ts` went red:
  `a register entry attributes words to a file that does not contain them`.
- **Fix:** the entry's `site` and its quoted signature follow the code, and the census case's
  expected handle was updated deliberately with a comment naming this plan. A published coordinate
  that names the function it used to be in is a residual nobody can find.
- **Files:** `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io-writer-set.test.ts`.
- **Verification:** `context-io-writer-set.test.ts` 195 passed.
- **Commit:** `d77c306`.

**3. [Rule 3 — Blocking] The hook manifest went stale when `context-io.js` was rebuilt**

- **Found during:** Task 2 RED, on the gate's own re-drive.
- **Issue:** deviation 2 rebuilt `scripts/context-io.js`, so `hooks/hook-entry`'s frozen per-module
  hash no longer matched. The `DECIDER_MANIFEST` CONTROL then drew a fail-closed deny instead of the
  decider's answer, and the gate exited 1 — caught by the gate this plan is fixing, on the position
  whose discriminant `WR-31` made honest.
- **Fix:** `npm run generate:hook-manifest`, rebuild, commit. `FROZEN_GUARD_BLOB` was not re-based
  and `hooks/guard.ts` was not touched.
- **Files:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`.
- **Verification:** `npm run freshness:hook-manifest` → fresh, 2 deciders / 26 module hashes;
  `node scripts/check-platform-shapes.js` → exit 0.
- **Commit:** `719eb4d`.

**4. [Rule 2 — Missing critical] Six mirror kinds beyond the two the plan named**

- **Found during:** Task 2.
- **Issue:** the plan requires "one case per label". Two mirrors reach two labels. A label nobody has
  watched being printed is the same unmeasured premise `WR-41` is about, one register over.
- **Fix:** six further kinds — delete-the-target, report-this-position's-own-clause, crash,
  exit-silently, self-signal and report-a-token-outside-the-vocabulary — so 11 of the 13 CONTROL
  labels are watched live. The two that no staging on this platform can reach are disclosed below
  and in `D-43`, and a live-coverage case asserts they are the ONLY unwatched labels.
- **Files:** `scripts/check-platform-shapes.ts`, `scripts/check-platform-shapes.test.ts`.
- **Verification:** the coverage cases; the mirror table above.
- **Commit:** `b549b3d`.

**Total deviations:** 4 auto-fixed (2 × Rule 2 missing-critical, 1 × Rule 1 bug, 1 × Rule 3 blocking).
**Impact:** none on production behaviour. Three touch only this gate and its test; one moves a
published residual's coordinate and one re-derives a manifest hash that a rebuild invalidated.

## Authentication Gates

None.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

---

## Boundaries this plan leaves open

| Boundary | Why it is open | What would force it closed |
|---|---|---|
| **`NOT ORDINARY (answered)` and `NOT ORDINARY (no-answer)` are not watched live** — 2 of the 13 CONTROL labels | `answered` is the MANIFEST position's own ordinary outcome, and the mirror seam replaces the NOTE position's driver only; `no-answer` needs a child producing neither an exit code nor a signal, which no driver mirror can arrange. Both are driven through the module's exported derivation, and the live-coverage case asserts these two are the only unwatched labels, so a fourteenth undrivable label reds that case rather than joining them quietly. | A mirror seam at the manifest position, and a child the harness can suspend without killing. Recorded in `.planning/WINDOWS.md` (`unrun-verify`). |
| **The GOV-02 audit-ledger position is still not driven here** | Unchanged from plan 31-30: reaching `appendAuditLedger` requires spelling a governance-dial name, which the AUTO-06 assertion admits from exactly one module. The position was dropped rather than smuggled past the scan. | Publishing the two governance dial key names from the one authority, the way plan 30-10 published `GOVERNANCE_CONFIG_RELPATHS`. Carried in `deferred-items.md` with an owner. |
| **The Windows leg — `R-03`** | Every reading in this plan was taken on darwin. This module exists precisely because the Windows leg's skip list is the thing nobody can read from here. | The `windows-latest` CI leg's own transcript, which is what `REQUIRE_SKIPS_ENV` asserts against. |
| **The `reports-the-positions-own-refusal-clause` mirror FABRICATES the clause** | It is the only way a CONTROL shape draws this position's own not-a-regular-file refusal: a regular file and a symlink resolving to one never do. The mirror exercises the harness's classification path, not the writer's refusal. | A staging mirror that plants a dangling symlink at a CONTROL position, so the refusal is raised by `readRegularFileOrNull` rather than typed by the mirror. |
| **The contents read is bounded by the SHAPE, not by a timeout** | Only CONTROL shapes reach `verifyAfter`, and both are regular files or resolve to one, so `readFileSync` cannot block. A future CONTROL shape that is not a regular file would change that. | A CONTROL shape whose position is not a regular file — at which point the read must move into the child or behind a bound. |
| **`agent-factory/workflows/05-pr-quality-gate.md`'s narrower exit-2 claim** | Inherited open item from plan 31-42, untouched here. | See `deferred-items.md`; the workflow's `## Stop conditions` section is frozen and owes disposition rows. |

## Issues Encountered

None beyond the four deviations above, each of which was fixed and verified in its own commit.

## Next Phase Readiness

`31-44-PLAN.md` is the remaining plan in this phase. `UATX-01` through `UATX-06` remain UNCHECKED,
every traceability row still reads `Gaps Found`, and Phase 31 remains In Progress — this plan flipped
no requirement checkbox, no traceability row and no phase checkbox.

## Self-Check: PASSED

- `.planning/phases/31-autonomous-manual-testing/red-evidence/31-43-task1-red.json` — FOUND
- `.planning/phases/31-autonomous-manual-testing/red-evidence/31-43-task2-red.json` — FOUND
- Commits `1ddf92d`, `36b124a`, `d77c306`, `719eb4d`, `e1a211e`, `b549b3d` — all FOUND in
  `git log --oneline 072e542..HEAD` (6 commits, measured, not narrated)
- `git diff --quiet .planning/REQUIREMENTS.md .planning/ROADMAP.md` — clean
