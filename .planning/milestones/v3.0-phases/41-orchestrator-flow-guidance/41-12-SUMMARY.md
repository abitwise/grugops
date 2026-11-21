---
phase: 41-orchestrator-flow-guidance
plan: 12
subsystem: tooling
tags: [runnable, note-writer, fault-injection, read-sites, census, auto-06, verdict-census]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "scripts/runnable-ref/note.ts and note.js (plan 41-07), and the 14 census cases it left red for this plan"
provides:
  - "scripts/runnable-ref/note-read-sites.test.ts: READ-1 over all 64 derived (site, via) pairs of the committed note.js"
  - "SECOND_SOURCE: a pinned map of 9 rows, each proven equal to an unfaulted run in fixtures where a lost dial changes the outcome"
  - "The exit contract rows for note.js, and a note.js that reads a note back before it prints noted"
  - "The AUTO-06 fresh-region rule, the whole-line comment skip in the verdict census, and the moved pins"
affects: [41-10, 41-11, the new gap plan for the root ladder]

actuals:
  tokens: 17870
  tasks: 2
  commits: 5
plan_head_before: b44a8423c3a915ca89b2d18984519fb74bb1a162
plan_head_after: 849e1f687097746e865ee322c24dbdc97d1d659d

tech-stack:
  added: []
  patterns:
    - "A row exempt from a rule must meet a stricter one: it equals an unfaulted run in the exit code, the output and every file, and a fixture holds the dial where a lost answer changes the outcome"

key-files:
  created:
    - scripts/runnable-ref/note-read-sites.test.ts
  modified:
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/fault-inject.test-support.ts
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/chrome-lane-bar.test.ts

key-decisions:
  - "Human ruling, 2026-11-05: the 21 red READ-1 rows split. 9 rows with a designed second source are proven equal to an unfaulted run. 12 rows that take a failed read as absence stay red by name and go to a new gap plan"
  - "A SECOND_SOURCE row is proven in governed fixtures, two of which hold the dial in a repository the working directory is not in, because a lean fixture ends noted whichever root the ladder picks"
  - "RUN-02 and RUN-05 are not recorded as complete here, because Group B keeps READ-1 from being met"

patterns-established:
  - "Two-sided pin of an exception map: its size, its membership against the derivation, and the exact modes each row reaches"

requirements-completed: []
requirements-open: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "READ-1: a failed read in the shipped note.js never reports a note. OPEN: 12 Group B rows end noted, exit 0, and stay red by name"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/note-read-sites.test.ts"
        status: fail
    human_judgment: false
  - id: D2
    description: "The 9 Group A rows equal an unfaulted run, in the exit code, the output and every file, in every mode that reaches them"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#SECOND_SOURCE equals the derived set, two-sided: every reached rung of the ladder, and the ledger's stat"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts#the dial is in force in every governed mode: the run refuses, and the same finding with no dial is noted"
        status: pass
    human_judgment: false
  - id: D3
    description: "EXIT-1: an EIO at the render's rename and a throw at the output after the render each exit 2 and say the note stands"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: note.js, an unexpected throw past every inner catch is exit 2, and no message denies a note (plan 41-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The governance reader case still names one reader; a fresh region is a copy, and keys outside it or in an edited region count"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#exactly ONE site is the governance reader, and it is scripts/context-io.ts (AUTO-06)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the same two dial keys outside a region, in a mirror text, count as a second reader"
        status: pass
    human_judgment: false
  - id: D5
    description: "The verdict census names one author; only a whole-line comment is skipped, and no region is exempt"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts#a real call inside region markers is an author"
        status: pass
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts#a whole-line comment holding the invocation is not an author"
        status: pass
    human_judgment: false
  - id: D6
    description: "The 14 cases plan 41-07 named for this plan. PARTLY MET: 13 are green on the main tree; LIVE COUNT stays red there because of the untracked ~/ directory, and passes in a clean clone"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose"
        status: fail
    human_judgment: false

duration: 47min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 12: note.js failure paths and censuses Summary

**READ-1 now fails all 64 derived read pairs of the shipped `note.js`: 9 rows are proven equal to an unfaulted run, 12 ladder rows stay red by name for a new gap plan, and 13 of the 14 census cases are green. READ-1, CR-01 and the fail-open are not closed.**

`status: complete` means both tasks ran under the human ruling. It does not mean the plan's success criterion holds: a failed read in the shipped program can still report a note.

## Performance

- **Duration:** 47 min of work: 16 min before the checkpoint and 31 min after it
- **Started:** 2026-11-05T11:49:02Z (the plan's base commit)
- **Checkpoint:** stopped 2026-11-05T12:05:04Z, resumed 2026-11-05T12:26:56Z
- **Completed:** 2026-11-05T12:58:00Z
- **Tasks:** 2, with the ruling applied to Task 1
- **Files modified:** 11 (code and tests), plus the planning records

## Human Ruling (2026-11-05, at this plan's checkpoint)

Split the rows, and run Task 2 now. The no-widening rule was lifted for the 9 Group A rows and nothing else. Group B stays red and goes to a new gap plan. The tracer's failure did not halt Task 2. Every other prohibition stood, and each held: `scripts/context-io.ts`, `scripts/checkpoints.ts`, the generated region and `hooks/` are unchanged, note.ts is on no exception list, and no generated region is exempt from the verdict census.

## Truths of 41-12

| # | Truth | State | Evidence |
| --- | --- | --- | --- |
| 1 | READ-1, CR-01: a failed read never prints `noted`, on every derived pair | **Open** | 12 Group B rows end `noted`, exit 0, and stay red. The 9 Group A rows also end `noted` when their mode does, by ruling. 26 reached pairs meet the rule as written |
| 2 | A failed read may end `refused`, and never ends exit 0 | **Open** | The `refused` half holds, for the config read and the note walk. The "never exit 0" half is false for the same rows |
| 3 | EXIT-1: the render's rename and a throw at the output each exit 2 and say the note stands | Holds | Both note.js rows pass |
| 4 | EXIT-1 census: one `uncaughtException` handler before `process.argv`, no fault switch | Holds | The census case passes for `note` |
| 5 | D-35, AUTO-06: the reader case names exactly one reader | Holds | Passes on the committed tree |
| 6 | A control proves that rule discriminates | Holds | Three controls pass, and removing the freshness check or the name check turns one control red each |
| 7 | `CONFIG_PATH_SITES` holds a row for note.ts, and the history answers the second-reader question | Holds | The row is in, the count is 14, and the paragraph cites D-35 |
| 8 | The verdict census names one author, and a call or declaration inside a region still counts | Holds | A region-exempting mutation turns both region cases red |
| 9 | `note.js` declares none of the privileged writers | Holds | The acceptance grep prints 0 |
| 10 | `state-check` names `note.js` in a skew finding, and the pinned line says so | Holds | The case passes |
| 11 | Each of the 14 cases is green | **Partly met** | 13 green on the main tree. `LIVE COUNT` is red there and green in a clean clone |

The plan's success criterion, "no failed read in the shipped program reports a note", is **not met**.

### Group B: the 12 rows that stay red

Each ends `noted`, exit 0, after its read fails. None has a skip, `.fails`, `.todo` or an exception entry, and none is named in the test file:

- `directoryIdentity:statSync#0 via namedHomeDirectory#0`
- `directoryIdentity:statSync#0 via homeBoundary#0`
- `directoryIdentity:statSync#0 via homeBoundary#1`
- `directoryIdentity:statSync#0 via homeBoundary#2`
- `directoryIdentity:statSync#0 via isAboveHome#0`
- `directoryIdentity:statSync#0 via isHomeItself#0`
- `projectRootFromWorkingDirectory:existsSync#0 via trustedRepoRoot#0`
- `projectRootFromWorkingDirectory:existsSync#0 via governanceRootOf#0`
- `projectRootFromWorkingDirectory:existsSync#1 via trustedRepoRoot#0`
- `projectRootFromWorkingDirectory:existsSync#1 via governanceRootOf#0`
- `hostDeliveredRoot:statSync#0`
- `hostDeliveredRoot:existsSync#0`

They are assigned to a new gap plan, not yet written, that will make the ladder fail closed in `scripts/context-io.ts`.

For that plan, measured with a governed fixture that refuses a `security-nfr` finding stamped `human:eve`. Five rows lost the dial, ending `noted` where the unfaulted run refuses:

- `directoryIdentity:statSync#0 via namedHomeDirectory#0`
- `projectRootFromWorkingDirectory:existsSync#0 via trustedRepoRoot#0`
- `projectRootFromWorkingDirectory:existsSync#1 via trustedRepoRoot#0`, when the home directory is the repository
- `hostDeliveredRoot:statSync#0`
- `hostDeliveredRoot:existsSync#0`

The other seven refused in the same fixtures. They still end `noted` on an ungoverned run, so they stay red under the ruling. This run did not prove them equal to an unfaulted run.

### Group A: the 9 rows proven equal

All 9 stayed in Group A; none had to move to Group B. Each row in `SECOND_SOURCE` must equal an unfaulted run in every mode that reaches it: the exit code, stdout, stderr and the text of every file, with only the run's root, note id, timestamps and seals masked.

| Row | What answers |
| --- | --- |
| `canonicalDirectoryPath:realpathSync.native#0` via `<top>#0`, `canonicalWorkingDirectory#0`, `homeBoundary#0`, `homeConfigPositionIsProjectOwned#0`, `hostDeliveredRoot#0`, `hostDeliveredRoot#1`, `trustedRepoRoot#0` | Rung 2 gives the same path |
| `canonicalDirectoryPath:realpathSync#0 via <top>#0` | Rung 3 gives the path rung 2 reaches anyway for an absent position |
| `appendRegularFileLine:statSync#0` | The open that follows classifies the ledger |

Three limits on that proof:

- **The platform.** It ran on Linux only. The comments in `homeBoundary` say rung 1 and rung 2 can spell a path differently on Windows (`RUNNER~1`). Equality there is `UNKNOWN - verify`.
- **The ledger row's wording.** With a directory or a FIFO at the ledger, both runs refuse with exit 1 and write nothing, but the last clause differs: the unfaulted run says `is not a regular file`, the faulted run says `could not be opened for append`. The comparison leaves out only that clause, only in those two cases, and asserts that both lines hold it.
- **One fault at a time.** Both rungs failing together is not tested.

The proof can fail. Moving `hostDeliveredRoot:statSync#0` and `projectRootFromWorkingDirectory:existsSync#0 via trustedRepoRoot#0` into the map turned those rows red with `a failed read changed the outcome`, and turned both pin cases red. That mutation was not committed.

## The 14 Owned Cases

| File | Case | Result |
| --- | --- | --- |
| `scripts/check-foundation-guards.test.ts` | `the OWNER set is derived tree-wide, floored for vacuity, and pinned two-sided at the authority alone` | Green |
| | `the CONSUMER set is derived, sorted and pinned two-sided with its cardinality` | Green |
| | `the module set is TREE-WIDE — derived recursively, counted by a second independent enumeration` | Green |
| | ``floor item 1 is a MEASUREMENT: every `new RegExp`-built section bound in the tree is derived and named`` | Green |
| | `every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose` | **Red on the main tree, green in a clean clone** |
| | `no module outside the authority declares the frontmatter parser's name` | Green |
| `scripts/context-io.test.ts` | `the derived site count equals the pinned count` | Green |
| | `the derived set and the annotated set agree, and a disagreement names its direction` | Green |
| | `exactly ONE site is the governance reader, and it is scripts/context-io.ts (AUTO-06)` | Green |
| `scripts/context-io-writer-set.test.ts` | `the appendNote call sites in tracked non-test sources are counted` | Green |
| `scripts/runnable-ref/state-check.test.ts` | `one hex digit of the copied trace-render.js stamp changed: exit 1, one FINDING naming trace-render.js and both stamps; --json carries it` | Green |
| `scripts/chrome-lane-bar.test.ts` | `the derived author set has the expected COUNT` | Green |
| | `the derived author set has the expected MEMBER` | Green |
| | `a SECOND author in the tree breaks the count` | Green |

`LIVE COUNT` is also on the `41-VALIDATION.md` baseline list. The pin moved it past its module count, and it now stops on a later check: the `.js` walk finds 7 files under the untracked `~/` directory that git's index does not hold. At `849e1f68` in a clean clone with no `~/` directory, the case passes. That directory belongs to the user and was left alone.

## Moved Pins

Each number was read from a failing run or a direct count before it moved, and each moved by the measured amount.

| Pin | Before | After | Reason |
| --- | --- | --- | --- |
| `CONFIG_PATH_SITE_COUNT` | 13 | 14 | note.ts spells the config path in its region. It is a held copy of the reader, not a second reader (D-35) |
| `EXPECTED_APPEND_NOTE_CALL_SITES` | 6 | 8 | The embedded declaration and the one call in `runAdd`. D-35 ships this writer to hosts |
| `NON_TEST_MODULE_COUNT` | 113 | 114 | note.ts is tracked; `git ls-files` minus tests and declarations reports 114 |
| Skew remedy line | no `note.js` | names `note.js` | `state-check` now lists the fifth program |

`EXPECTED_VERDICT_AUTHORS` and its count did not move.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `3c6f8402` (test): the READ-1 file, the `note` exit rows, and the derivation extended to `realpathSync.native`
   - `073df58d` (fix): `note.js` reads a note back before it says `noted`
   - `98029cab` (docs): the dial loss logged
   - `61d72f36` (test): the Group A map, proven and pinned, under the ruling
2. **Task 2: The census holds the new copy** - `849e1f68` (test)

Task 1 is a tracer whose `<verify>` stays red on Group B. By ruling, that did not halt Task 2.

## Files Created/Modified

- `scripts/runnable-ref/note-read-sites.test.ts` - READ-1, `SECOND_SOURCE`, the proof modes and the controls
- `scripts/runnable-ref/note.ts`, `note.js` - the read-back in the hand-written part; the region and the stamp did not move
- `scripts/runnable-ref/runnable-exit-contract.test.ts` - the `note` rows and two EXIT-1 cases
- `scripts/runnable-ref/read-sites.test.ts`, `scripts/fault-inject.test-support.ts` - the derivation sees `realpathSync.native`
- `scripts/context-io.test.ts` - the fresh-region rule, 4 control cases, the note.ts row, the count
- `scripts/context-io-writer-set.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/runnable-ref/state-check.test.ts` - the moved pins
- `scripts/chrome-lane-bar.test.ts` - the whole-line comment skip and 3 cases

## Decisions Made

- **Governed proof modes.** A lean fixture ends `noted` whichever root the ladder picks, so it cannot show that a dial survived. Four governed modes refuse a finding the dial would otherwise admit, and two of them hold the dial in a repository the working directory is not in.
- **`requirements-completed` is empty.** The template says to copy the plan's requirement ids. This plan's RUN-02 and RUN-05 truth is READ-1, and Group B keeps it from being met, so they are listed under `requirements-open` and not marked complete.

## Deviations from Plan

### By human ruling

**1. Group A rows are judged by equality with an unfaulted run, not by the READ-1 rule**
- **Found during:** Task 1, at the checkpoint
- **Fix:** `SECOND_SOURCE` in the READ-1 test, pinned two-sided, with the exact modes per row
- **Committed in:** `61d72f36`

**2. Task 2 ran with the tracer red**
- **Found during:** Task 1, at the checkpoint
- **Effect:** Group B stays red in the suite until the new gap plan lands

### Auto-fixed Issues

**3. [Rule 1 - Bug] `noted` was printed for a note that could not be read back**
- **Found during:** Task 1
- **Issue:** `render()` files a note it cannot read under its skipped entries and returns, so a failed read of the new note still printed `noted`
- **Fix:** `add` asks the read `done` makes; a note that does not read back is exit 2 with a line naming the note
- **Files modified:** `scripts/runnable-ref/note.ts`, `scripts/runnable-ref/note.js`
- **Committed in:** `073df58d`

**4. [Rule 3 - Blocking] The derivation could not see `realpathSync.native`**
- **Found during:** Task 1
- **Issue:** The embedded ladder reads it through a local, so `deriveReadSites` missed the site
- **Fix:** The derivation and the preload see it. This touched two files outside `files_modified`
- **Files modified:** `scripts/fault-inject.test-support.ts`, `scripts/runnable-ref/read-sites.test.ts`
- **Committed in:** `3c6f8402`

**Total deviations:** 2 by ruling, 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** The plan's success criterion is not met. Everything else ran as written.

## Issues Encountered

- `T-41-43` stays open. Task 2 as planned has no case that damages a `note.js` stamp, so no committed case covers it. Plan 41-09 checked it once by hand. The plan was not widened for it.
- `T-41-52` is only partly mitigated: READ-1 fails every derived site, and 12 rows of it are red.

## Test Results

- `scripts/context-io.test.ts`, `scripts/context-io-writer-set.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/runnable-ref/state-check.test.ts`, `scripts/chrome-lane-bar.test.ts`: before 23 failed and 1,471 passed; after 10 failed, 1,491 passed, 1 skipped. No new failed name.
- The 10 still failing, each on the `41-VALIDATION.md` § Known baseline reds list:
  - `scripts/check-foundation-guards.test.ts`: the `LIVE COUNT` case above
  - `scripts/context-io-writer-set.test.ts`, 31-14: `every derived decline clause is enumerated, and the document names no other`; `the disposition document exists and carries the enumeration heading`
  - `scripts/context-io.test.ts`, 31-23 PROBE 5: `the WAVE-2 verdicts are QUOTED from 31-22-SUMMARY.md, and agree with this plan's expectation`
  - `scripts/context-io.test.ts`, 31-29: `CONVERSE 1`, `CONVERSE 2`, `DIRECTION 1`, `DIRECTION 2`, `PREMISE: the document was read and it names residual ids at all`, `a SEEDED undispositioned member turns the equality RED`
- `scripts/runnable-ref/` whole, plus `scripts/uat-gate-exit-contract.test.ts`, `scripts/check-platform-shapes.test.ts`, `scripts/generate-runnable-embeds.test.ts` and `scripts/harness-instance-ledger.test.ts`: 21 failed, 2,512 passed. The 21 are the 12 Group B rows and 9 baseline names (5 and 4 in the last two failing files). No EDQUOT line in the run.
- The full suite was not run here. The orchestrator's end-of-wave gate runs it.

## Gates

All exit 0 at `849e1f68`'s content: `npm run build`, `npm run typecheck`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-state-paths.js`, `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:hook-manifest`. `git diff --quiet dabdcf9e` exits 0 for `hooks/`, `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/checkpoints.ts` and `scripts/checkpoints.js`.

Every Task 2 acceptance criterion printed its expected value. Task 1's first `<verify>` command does not pass: its vitest run fails the 12 Group B rows, by ruling.

## Open Items

- A new gap plan for Group B, not yet written. It owns the fail-open: with no fault at all, a real `note.js` copy under `human_admission: all` notes a `security-nfr` finding stamped `human:eve` when `HOME=/nonexistent`.
- CR-01, READ-1 and the fail-open stay open. The deferred entry and `.planning/WINDOWS.md` both record them.
- `LIVE COUNT` turns green once the untracked `~/` directory is gone.
- `T-41-43` has no committed case.
- Group A equality on Windows is `UNKNOWN - verify`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans 41-10 and 41-11 list 41-12 in `depends_on`. Group B does not gate their work, but the suite keeps 12 red rows until the new gap plan lands. Phase verification should not pass on READ-1 before then.

## Self-Check: PASSED

The created file exists, all five commits are ancestors of HEAD, and `git rev-list --count b44a8423..HEAD` is 5. The Group B rows fail by name, and the test file holds no skip, `.fails` or `.todo`.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
