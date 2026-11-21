---
phase: 38-install-migrate-v3
plan: 07
subsystem: install
tags: [migrate, state-machine, wr-04, pre-check, layout-marker, queue-claim, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-03: the v3 arm (readMigrateInputs, stateMigrateRefusals, runStateMigrate) joined to the one --migrate pre-check; 38-06: the trace render and the three commit step classes"
provides:
  - "install/install.ts: the already-migrated arm answers only `layout.isMigrated && state !== \"pre-v3\"`; an installed two-root repository whose state is pre-v3 runs the v3 arm with the kit plan and its KIT_WRITE decision in the one pre-check, then the install run (WR-04, D-19)"
  - "noteMovedBackups: after a successful state migrate, one note per recorded backup under the pre-v3 root, naming its new path, that it is no longer recorded, and that uninstall never touches the memory-bank root"
  - "migrateLayoutRefusal: both and unreadable state layouts are pre-check refusals on every kit arm (D-13)"
  - "claimedQueueRefusal: a non-empty QUEUE_CLAIMED_REL, or anything but a real directory there, refuses the v3 arm (D-13, MIGRATE-01), so it stops the two-root steps too (D-11)"
  - "stagingRefusal: an existing MIGRATE_STAGING_REL refuses on every state layout, not only pre-v3"
  - "The fresh line (D-12) and currentLayoutNote (ok for a valid layout marker, a note for an absent or invalid one, no marker written)"
  - "install/migrate-v3-states.test.ts (S1)-(S13) plus (S5b); the WR-04 case in install/agents-record.test.ts; pre-v3-layout.test.ts case (i) now a pre-check refusal"
affects: [38-08, 38-09, 38-10, 38-11]

actuals:
  tokens: 19500
  tasks: 2
  commits: 7
plan_head_before: 806e0bff8e86bc75dd7530fc03910e37f7a208a1
plan_head_after: d6ef1f02c3ad62c08867b291017a664fe3ea9c20

tech-stack:
  added: []
  patterns:
    - "The --migrate branch takes stateLayout() once (state) and every arm reads that one answer"
    - "Every --migrate refusal joins the one pre-check before the handoffs backup, whatever the kit arm, so a refusal is never preceded by a write"

key-files:
  created:
    - install/migrate-v3-states.test.ts
    - .planning/phases/38-install-migrate-v3/38-07-SUMMARY.md
  modified:
    - install/install.ts
    - install/install.js
    - install/agents-record.test.ts
    - install/pre-v3-layout.test.ts
    - install/message-references.test.ts
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "The fresh row (D-12) is asserted on an installed two-root repository, where the already-migrated arm then answers and no layout marker is written. On a clean target (no install marker) --migrate prints the same line and still falls through to the install run, whose seed writes the marker for the state that run creates (plan 37-13); that arm runs as it did before (D-12: the other --migrate arms run as they do today)"
  - "A current layout with an absent or invalid marker gets one note and no marker (research open question 5, the plan's flagged assumption)"
  - "Recorded backups under the pre-v3 root are not re-pathed in the ledger; one note per entry (research open question 6, the plan's flagged assumption)"
  - "The staging-directory refusal is asked on every state layout: a migrate interrupted after its first commit rename leaves the state current, and without this the run would have answered it as already on the v3 layout (MIGRATE-01 concurrency truth)"
  - "On a vendored-kit repository with a both or unreadable layout the kit plan is still built (read only); on the other kit arms only the layout refusal is asked"

patterns-established:
  - "A state-layout refusal of --migrate goes in migrateLayoutRefusal, asked once before the pre-check; a refusal of the v3 arm alone goes in stateMigrateRefusals"

requirements-completed: [MIGRATE-04, MIGRATE-01]

coverage:
  - id: D1
    description: "WR-04 (roadmap criterion 6): an installed two-root repository holding the pre-v3 board migrates under --migrate, never 'already migrated' or 'Nothing to do.'; the install banner prints; BOARD_REL, PRE_V3_BOARD_REL and LAYOUT_MARKER_REL exist; the ticket is at its moved path; tools/grugops/trace-render.js is the kit source's bytes; R17 stays green"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/agents-record.test.ts#WR-04 (already installed two-root, state still pre-v3)"
        status: pass
      - kind: integration
        ref: "install/agents-record.test.ts#R17 (rewriteLedger, already-migrated --migrate)"
        status: pass
    human_judgment: false
  - id: D2
    description: "both, a held claim, a link at the claim directory, staging (pre-v3 and current), and unreadable are pre-check refusals: exit 3, one verify naming the paths (and the code), the target and kit home byte-identical; an empty claim directory does not refuse"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S1) (S2) (S3) (S4) (S5) (S5b) (S6)"
        status: pass
      - kind: integration
        ref: "install/pre-v3-layout.test.ts#(i) --migrate over an unreadable pre-v3 root (EACCES) is a pre-check refusal"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-11: on a vendored-kit repository a non-empty claimed queue stops the two-root arm: agent-factory/ not backed up, no configuration moved, target unchanged"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S7)"
        status: pass
    human_judgment: false
  - id: D4
    description: "fresh prints the no-planning-state line and writes no marker; current with a valid marker prints one ok line; with no marker or an invalid one, one note and no marker written (invalid content sanitized, bytes unchanged)"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S8) (S9) (S10) (S11)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A second --migrate after a successful one leaves the target and kit home byte-identical"
    requirement: MIGRATE-04
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S12)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A recorded backup under the pre-v3 root moves with the state; one note names its new path and says it is no longer recorded; the stale ledger entry is dropped"
    verification:
      - kind: integration
        ref: "install/migrate-v3-states.test.ts#(S13)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Wording of the new refusals, the fresh line, the current-layout ok line and notes, and the moved-backup note (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 55min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 07: Every arm of the --migrate state machine Summary

**`install --migrate` no longer answers an installed two-root repository whose state is still pre-v3 with "Nothing to do." It moves the state, then runs the install run, which refreshes the kit and the runnables. Every other state layout gets one named answer. Both, unreadable, a held queue claim, a link at the claim directory and a leftover staging directory are refused in the one pre-check, before any write, on every kit arm. The layout marker is written only on state this run migrated.**

## Performance

- **Duration:** about 55 min (about 22 of it the full-suite run)
- **Started:** 2026-10-28T14:04:17Z
- **Completed:** 2026-10-28T14:59:17Z
- **Tasks:** 2
- **Files modified:** 8 (plus this SUMMARY)

## Accomplishments

- The WR-04 path, end to end: a plain install, the v3 state root removed, a pre-v3 board and ticket planted, then `--migrate`. The v3 arm moves the state, the install run follows, and the materialized `trace-render.js` matches the kit source byte for byte. R17 stays green.
- One `stateLayout()` answer (`state`) drives every arm. The already-migrated arm's gate is `layout.isMigrated && state !== "pre-v3"`.
- Refusals before any write:
  - `both` names both boards and says the run cannot choose between them.
  - `unreadable` names the path and the error code.
  - A claim directory holding entries names it and up to ten entries. A link, or anything but a directory, at that path also refuses. An empty claim directory does not.
  - A staging directory refuses on every layout, naming the directory and its `commit-plan.txt`.
- On a vendored-kit repository, a v3 refusal stops the two-root steps as well (D-11).
- `fresh` prints one line (D-12).
- `current` checks the marker through `readUserFile` and `markerState`. A valid marker gets one ok line. An absent or invalid marker gets one note, and no marker is written. Invalid content is printed through `stripControlChars`.
- After a successful migrate, a backup recorded under the pre-v3 root gets one note naming its new path.

## Task Commits

1. **Task 1 (tracer): WR-04, D-19**
   - `5fc0b035` test(38-07): the WR-04 case, failing on "already migrated to the two-root layout"
   - `794c1eef` feat(38-07): the gate change and noteMovedBackups
   - Tracer gate (interactive, end-of-phase, automated-only verify). `npm run build && npm run typecheck && npx vitest run install/agents-record.test.ts -t "R17|WR-04"` passed 2 of 2. `install.test.ts -t MID-SCRIPT` passed. closing-claims and install.test.ts passed 494 tests with 1 skipped. Expansion continued.
2. **Task 2 (tdd): the remaining rows**
   - `b43b2618` test(38-07): (S1)-(S13). Ten fail and three pass (see TDD Gate Compliance).
   - `7f6de8ce` feat(38-07): migrateLayoutRefusal, claimedQueueRefusal, the fresh line, currentLayoutNote; case (i) and three census updates
   - `f433ef1e` test(38-07): (S5b), staging on a current layout, failing on "already on the v3 layout"
   - `911cb7c8` feat(38-07): stagingRefusal on every layout
   - `d6ef1f02` test(38-07): the planted commit-plan text no longer spells the pre-v3 root (check-state-paths)

## TDD Gate Compliance

- A `test(38-07)` commit comes before each `feat(38-07)` commit. There is no REFACTOR commit.
- RED was checked by hand. `gsd_run check tdd-red-evidence` rejects vitest output (phase fact). Semantic assessment:
  - **WR-04:** failed on the planned assertion. Stdout contained "already migrated to the two-root layout" and "Nothing to do.". R17 passed.
  - **(S1)-(S13):** ten failed on missing behaviour.
    - (S1), (S2) and (S4) expected exit 3 and got 0.
    - (S6) and (S7) failed on the target snapshot, because the run went on and wrote.
    - (S8)-(S12) found no fresh line, ok line or note.
  - Three cases passed at RED, as expected:
    - (S3) is the empty-claim control.
    - (S5) is the staging refusal plan 38-03 built.
    - (S13) is the backup note Task 1 had already committed.
  - **(S5b):** failed on exit 0, answered "already on the v3 layout".

## Files Created/Modified

- `install/install.ts` (+ `.js`): the changes to the `--migrate` branch, plus `claimedQueueRefusal`, `migrateLayoutRefusal`, `currentLayoutNote`, `stagingRefusal` and `noteMovedBackups`. It imports QUEUE_CLAIMED_REL, QUEUE_PENDING_REL and markerState.
- `install/migrate-v3-states.test.ts`: new. One case per state-machine row.
- `install/agents-record.test.ts`: the WR-04 case beside R17.
- `install/pre-v3-layout.test.ts`: case (i) and its header line.
- `install/message-references.test.ts`: two REFERENCE rows and one RERUN row for the pre-check report's state-layout-refusal reading. Counts: install.ts 27 → 29, printed reference 47 → 49, re-run install.ts 66 → 67, migrate banner class 4 → 5.
- `install/mode-census.test.ts`: INSTALL_TEST_FILE_COUNT 42 → 43, access-denial 18 → 19, restore 27 → 28.
- `install/path-spelling-census.test.ts`: TEST_SCANNED_FILE_COUNT 42 → 43.

## Decisions Made

See `key-decisions` in the frontmatter. The most important: the fresh row is tested on an installed two-root repository. On a clean target, `--migrate` still seeds and marks the state that run creates, as a plain install does.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The staging refusal on every state layout**
- **Found during:** Task 2.
- **Issue:** The MIGRATE-01 truth says a migrate started after an interrupted one refuses, naming the staging directory. A run interrupted after its root rename leaves the state `current`. Only the v3 arm asked for the staging directory, so that run was answered "already on the v3 layout".
- **Fix:** `stagingRefusal` is now asked by the one pre-check on every layout the v3 arm does not move, and (S5b) pins it.
- **Commits:** `f433ef1e`, `911cb7c8`

**2. [Rule 3 - Blocking] Census counts**
- The new report reading and the new test file moved three censuses: message-references, mode and path-spelling. Rows and counts were added with dated notes.
- The fragment "readable by the user who runs the installer" matched the re-run pattern, so it was reworded to "readable to your user account".
- **Commit:** `7f6de8ce`

**3. [Rule 3 - Blocking] check-state-paths**
- The planted commit-plan text `"... plans\n"` read as a backslash spelling of the pre-v3 root, so the text was changed.
- **Commit:** `d6ef1f02`

**4. Not needed: CLASSIFIED_SITES**
- The new code adds no mutating fs call site. `lstatSync` and `readdirSync` are not classified rows, so installer-fs-census.test.ts was not edited.

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking), 1 planned file not needed.
**Impact on plan:** No scope creep. The process.exit pin of twelve holds: no exit was added, and the refusals use the existing pre-check exit.

## Issues Encountered

- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, GRUGOPS_HOME and HOME set to a scratch directory, JSON report): 10,381 passed, 20 failed, 2 skipped. The 20 failures are exactly the 38-BASELINE.md set in its 6 files (1 + 1 + 7 + 2 + 4 + 5). Nothing new failed.
- The full `install/` directory: 2,891 passed, 1 failed, 1 skipped. The one failure is the baseline `openAsBlobSync` case.
- Plan verification:
  - Item 1 cannot exit 0 because installer-fs-census.test.ts carries the baseline `openAsBlobSync` case. Everything else in those six files passed.
  - Item 2: `npm run freshness`, `check-state-paths` and `check-foundation-guards` all pass.
  - Item 3: the branch is `main`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register.
- T-38-17: a held claim and an existing staging directory are pre-check refusals, now on every layout for staging.
- T-38-18: the marker is written only by a successful v3 arm, and (S8), (S10) and (S11) pin it.
- T-38-19: ledger paths and marker content pass through `stripControlChars`, and (S11) checks that no ESC is printed.

## Next Phase Readiness

Ready for 38-08. The state machine is complete. The edge probe's MIGRATE-04 row stays unclassified, as the plan says.

## Self-Check: PASSED

- FOUND: install/migrate-v3-states.test.ts, install/install.ts, install/install.js, install/agents-record.test.ts, .planning/phases/38-install-migrate-v3/38-07-SUMMARY.md
- FOUND (ancestors of HEAD): 5fc0b035, 794c1eef, b43b2618, 7f6de8ce, f433ef1e, 911cb7c8, d6ef1f02
