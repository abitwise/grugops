---
phase: 37-overview-board-per-file-records-and-budgets
plan: 13
subsystem: installer
tags: [installer, runnables, seed, layout-marker, state-check, trace-render, state-roll, split-05, split-01, split-02, split-06]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-01 LAYOUT_MARKER_REL and LAYOUT_MARKER_CONTENT, the record directories and BUDGETS; 37-03 the state-check runnable; 37-08 the trace-render runnable and the zero-row index; 37-10/37-11 the state-roll runnable; 37-12 the Done archive source"
provides:
  - "RUNNABLES and RUNNABLES_MIRROR rows for tools/grugops/state-check.js, trace-render.js and state-roll.js"
  - "seedState writes the layout marker only on a fresh layout; every other layout gets one skipped line naming it"
  - "The v3 seed: overview board comment, NFR index with no table, dated-entry progress file, the render's zero-note trace index, nfr/ traceability/ archive/ keepers and the marker"
  - "install/README.md entries for the three state runnables"
affects: [37-14, 37-15, 37-16, 37-17, 37-18, 37-19, 38]

actuals:
  tokens: 10763
  tasks: 2
  commits: 4
plan_head_before: c52b765bdaf94abb0ecf9b04218b936aa705024e
plan_head_after: 17c6d288b0cb3e116eed57d3f432e0dbd61c16a8

tech-stack:
  added: []
  patterns:
    - "A seed file whose presence changes severity is gated on the layout probe inside the seed loop, so the preview and the real run take one branch"
    - "A seed file that must equal a generator's output is held to it by a test that runs the committed generator, not by a second copy"

key-files:
  created:
    - agent-factory/seed/memory-bank/plans/.layout
    - agent-factory/seed/memory-bank/plans/nfr/.gitkeep
    - agent-factory/seed/memory-bank/plans/traceability/.gitkeep
    - agent-factory/seed/memory-bank/plans/archive/.gitkeep
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/record-truth.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-cross-version.test.ts
    - install/installer-user-edit.test.ts
    - install/installer-special-files.test.ts
    - install/ledger-provenance.test.ts
    - install/README.md
    - agent-factory/seed/memory-bank/plans/board.md
    - agent-factory/seed/memory-bank/plans/nfr-catalog.md
    - agent-factory/seed/memory-bank/plans/traceability.md
    - agent-factory/seed/memory-bank/60-progress.md
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/trace-freshness.test.ts
    - scripts/board-corpus.test.ts

key-decisions:
  - "D-14 recorded option a, so the seed marker sits at the planned path agent-factory/seed/memory-bank/plans/.layout, which listSeedFiles maps to LAYOUT_MARKER_REL; code and tests name it only through LAYOUT_MARKER_REL"
  - "On a layout that is not fresh, the marker line reads `(target already has it)` when a readable file is there (a re-install over a fresh install) and `not seeded ...` otherwise; the marker is never written in either case"
  - "The not-seeded line says the marker is written when the state is migrated to the v3 layout, and does not name install --migrate or Phase 38: today's --migrate does not write it, and the installer's message rule forbids planning IDs"
  - "The seed trace index carries the render's GENERATED line, so the imperative-lexicon gate's generated set moves 1 -> 2 and its corpus 49 -> 48; the plan's SPLIT-03 truth is the decision this records"
  - "The seed board names the Done budget as BUDGETS.doneRows and points at the contract's Budgets table rather than retyping 20, 24 KiB or 160"

patterns-established:
  - "Census pins moved by listing, each with a dated (2026-10-22) reason naming the entrant"

requirements-completed: [SPLIT-05, SPLIT-02, SPLIT-01, SPLIT-06]

coverage:
  - id: D1
    description: "A fresh install materializes tools/grugops/state-check.js, trace-render.js and state-roll.js byte-identical to scripts/runnable-ref/, the installed state-check exits 0 with Node alone, and uninstall removes untouched copies and keeps a user-edited one"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#state runnables: a fresh install materializes state-check, trace-render and state-roll byte-identical to scripts/runnable-ref/ (SPLIT-05)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#state runnables: the installed state-check runs with Node alone on the freshly installed target and exits 0 (SPLIT-05)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#state runnables: uninstall removes untouched copies of all three, and keeps and reports a user-edited one (SPLIT-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "RUNNABLES and RUNNABLES_MIRROR hold the same eight-row mapping (seven programs plus LICENSE)"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false
  - id: D3
    description: "A fresh install writes the marker with exactly LAYOUT_MARKER_CONTENT, and the installed state-check reports the marker valid, enforced and no finding, and trace-render --check exits 0, with the nfr/ and traceability/ keepers present"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#layout marker: a fresh install writes LAYOUT_MARKER_CONTENT, and the installed state-check (marker valid, no finding) and trace-render --check pass (D-04, SPLIT-05)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A target with a board and no marker, a both layout and a pre-v3 --migrate run never receive the marker, each printing one skipped line naming it; DRY_RUN previews the same decision; a second install changes no seed byte"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#layout marker: an install into a target that holds the board and no marker leaves the marker absent and prints one skipped line naming it (research Pitfall 1)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#layout marker: a both layout and a pre-v3 --migrate run never write the marker (T-37-21)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#layout marker: DRY_RUN previews the decision the real run makes, and writes nothing"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#layout marker: a second install over a fresh-installed target changes no seed byte (never-overwrite)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The seed trace index is byte-identical to what the committed trace-render runnable writes for an empty repository"
    requirement: SPLIT-01
    verification:
      - kind: integration
        ref: "install/install.test.ts#layout marker: the seed trace index is byte-identical to what the committed trace-render runnable writes for an empty repository (SPLIT-03)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The seed board, NFR catalog and progress file read clearly as the v3 overview, index and dated-log forms for a host user"
    requirement: SPLIT-02
    verification:
      - kind: other
        ref: "acceptance greps: '— in flight' 0, '^| ID | Category' 0, '^## What works' 0, board.md 7154 bytes; node scripts/check-imperative-lexicon.js, check-banned-claims.js, check-claim-anchors.js, check-kit-refs.js, check-state-paths.js all exit 0"
        status: pass
    human_judgment: true
    rationale: "The gates check structure and wording rules; whether the comments explain the overview and index rules well enough to a host agent is a reading judgment"
  - id: D7
    description: "Mid-phase full run 2 of 2: no failure outside 37-BASELINE.md after this plan's fixes; all 20 baseline failures still fail and none now passes"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1 --shard=N/6 for N=1..6, then a re-run of every file changed after its shard"
        status: pass
    human_judgment: false

duration: 78min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 13: The three state runnables in tools/grugops/, the v3 seed, and a fresh-only layout marker Summary

**The installer now copies `state-check.js`, `trace-render.js` and `state-roll.js` into `tools/grugops/` beside the other four programs, and uninstall removes untouched copies. A fresh repository is born on the v3 forms: an overview board, an NFR index with no table, a dated progress log, the trace render's own zero-note index, and the layout marker. A repository that already holds planning state never receives the marker from an install, so no install can switch an existing board's budget findings to failures.**

## Performance

- **Duration:** about 78 min, about 35 min of it the six-shard full run
- **Started:** 2026-10-22T15:29:59Z
- **Completed:** 2026-10-22T16:47:48Z
- **Tasks:** 2 (Task 1 the tracer; Task 2 TDD, RED then GREEN), plus one census-fix commit from the full run
- **Files modified:** 26 (4 created, 22 modified)

## Accomplishments

- **The runnables (Task 1, D-01, D-08):**
  - `RUNNABLES` in `install/install.ts` and `RUNNABLES_MIRROR` in `install/uninstall.ts` gain the same three rows, before the LICENSE row.
  - A fresh install copies each program byte for byte from `scripts/runnable-ref/`.
  - The installed `state-check.js` exits 0 on the fresh target, run with only `PATH` in its environment.
  - Uninstall removes an untouched copy of each. A user-edited `state-roll.js` is kept and reported.
  - `install/README.md` lists the three programs and says an existing copy is never overwritten, so an updated program arrives only after the old copy is removed.
- **The marker gate (Task 2, D-04, research Pitfall 1):**
  - `seedState` asks `stateLayout()` once. It writes the seed file at `LAYOUT_MARKER_REL` only when the layout is `fresh`.
  - On any other layout (current, both, pre-v3 under `--migrate`, unreadable) the new `skipLayoutMarker` prints one `skipped` line and writes nothing.
  - That line reads `(target already has it)` when a readable file is there, and otherwise says the marker is written when the state is migrated to the v3 layout.
  - DRY_RUN takes the same branch, so the preview shows the decision the real run makes.
- **The v3 seed (Task 2, D-09, D-13, SPLIT-01, SPLIT-02, SPLIT-03):**
  - `board.md`: the ROWS example has no trailer. A new OVERVIEW block states the rules:
    - one row per ticket;
    - detail and blocked reasons go in the ticket body's `## Blocked` and `## Board notes` sections;
    - one `_Updated:` line, replaced in place;
    - the newest Done row goes first;
    - `BUDGETS.doneRows` Done rows stay on the board, and `tools/grugops/state-roll.js` moves older ones to the Done archive;
    - `tools/grugops/state-check.js` checks the budgets.
    The Blocked policy bullet now puts the reason and date in the ticket body. The file is 7,154 bytes.
  - `nfr-catalog.md`: a title, one `_Updated:` line and a comment, with no table and no index line. The comment gives the index form `- [NFR-xxx](nfr/NFR-xxx.md) <category>: <target>`, the 200-byte line budget, what an NFR file holds, and that state-check checks the index both ways.
  - `traceability.md`: the exact bytes `scripts/runnable-ref/trace-render.js` writes for an empty repository.
  - `60-progress.md`: a dated status entry is `## 2026-10-21 — <summary>`, added at the end. The comment says older entries roll to `memory-bank/plans/archive/progress.md` past the budget, and that standing directives go in `memory-bank/50-decisions/` as decision records. The file ships with no `##` section.
  - New seed files: `.gitkeep` in `plans/nfr/`, `plans/traceability/` and `plans/archive/`, and `plans/.layout` holding `layout: v3` with no line ending.
- **Verified end to end:** a scratch install with GRUGOPS_HOME and HOME set to scratch paths. Its `state-check.js --json` reports `marker: "valid"`, `enforced: true` and no finding, and `trace-render.js --check` exits 0.

## Task Commits

1. **Task 1: the three runnables in the installer and uninstaller (tracer)** - `94d70874` (feat)
2. **Task 2 RED: failing cases for the marker gate and the v3 seed** - `642b6f53` (test)
3. **Task 2 GREEN: the v3 seed and the fresh-only marker** - `1449fe3a` (feat)
4. **Full-run fixes: installer censuses and the board-corpus witness** - `17c6d288` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## Files Created/Modified

- `install/install.ts`, `install/install.js`: three RUNNABLES rows; the LAYOUT_MARKER_REL import; the fresh-only branch in `seedState`; `skipLayoutMarker`; a corrected stateLayout comment.
- `install/uninstall.ts`, `install/uninstall.js`: three RUNNABLES_MIRROR rows.
- `install/install.test.ts`: three state-runnable cases and six layout-marker cases; the parity counts 5 -> 8 (programs 4 -> 7) and the never-installed record 15 -> 18.
- `install/record-truth.test.ts`, `install/uninstall-removal.test.ts`, `install/installer-never-installed.test.ts`, `install/installer-cross-version.test.ts`, `install/installer-user-edit.test.ts`, `install/installer-special-files.test.ts`, `install/ledger-provenance.test.ts`: pins re-derived (table below).
- `install/README.md`: the three state runnables and the never-overwrite sentence.
- `agent-factory/seed/memory-bank/plans/board.md`, `nfr-catalog.md`, `traceability.md`, `agent-factory/seed/memory-bank/60-progress.md`: the v3 forms.
- `agent-factory/seed/memory-bank/plans/.layout`, `plans/nfr/.gitkeep`, `plans/traceability/.gitkeep`, `plans/archive/.gitkeep`: new seed files. The marker is at the planned option-a path, because D-14 recorded option a.
- `scripts/check-imperative-lexicon.ts`, `.js`, `.test.ts`: the generated set 1 -> 2 and the corpus 49 -> 48, each with a named entrant, and a corrected printed reason.
- `scripts/trace-freshness.test.ts`: the hand-written-matrix case uses a literal of the old seed shape.
- `scripts/board-corpus.test.ts`: the non-board documentation-block witness reads the seed progress file.

### Pins moved (all re-derived by listing, dated 2026-10-22)

| Pin | File | From | To | Entrants |
|-----|------|------|----|----------|
| REMOVABLE_COUNT | install/record-truth.test.ts | 41 | 44 | the three runnables |
| RUNNABLE_PATH_COUNT | install/uninstall-removal.test.ts | 4 | 7 | the three runnables |
| WRITE_PATH_COUNT | install/installer-never-installed.test.ts | 104 | 114 | the three runnables (Task 1), then three keepers, the marker and three directories (Task 2) |
| RUNNABLES parity | install/install.test.ts | 5 (4 programs) | 8 (7 programs) | the three runnables |
| never-installed record files | install/install.test.ts | 15 | 18 | the three runnables |
| RECORDED_FILE_COUNT | install/installer-cross-version.test.ts | 39 | 42 | the three runnables |
| INSTALLED_FILE_COUNT | install/installer-user-edit.test.ts | 67 | 74 | the three runnables, three keepers, the marker |
| READ_PATH_COUNT | install/installer-special-files.test.ts | 69 | 76 | the same seven |
| CREATED | install/ledger-provenance.test.ts | 15 | 18 | the three runnables |
| GOVERNED_CORPUS_COUNT | scripts/check-imperative-lexicon.ts | 49 | 48 | the seed trace index left, now generated |
| GENERATED_EXEMPT_COUNT | scripts/check-imperative-lexicon.ts | 1 | 2 | the seed trace index |

## TDD record (Task 2)

- **RED (`642b6f53`):** six new cases, run with `-t "layout marker"` against the installer and seed at `94d70874`. All six failed on the assertion each targets, and no load or syntax error occurred:
  - the marker file was absent after a fresh install;
  - no marker `skipped` line was printed (three cases);
  - the seed directory snapshot had no `plans/.layout`;
  - the seed trace index bytes differed from the render.
  The record is semantic only. `workflow.tdd_mode` is false, so the classifier was not run.
- **GREEN (`1449fe3a`):** all six pass.
  - One test needed a fix in the same commit. The text form of state-check also prints the MOVE-ONLY and TRACE report lines, so the case now asserts the last line is `No findings.` and that no FINDING, WARN or LAYOUT line appears.
- **REFACTOR:** none.

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- The planned marker path stands, because D-14 recorded option a.
- A re-install over a fresh install prints `(target already has it)`, not the migrate wording.
- The not-seeded line does not promise `install --migrate` behavior that ships in Phase 38.
- The seed trace index joins the imperative-lexicon gate's generated set, because SPLIT-03 makes it a render output.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The marker's skipped line does not name Phase 38 or install --migrate**
- **Found during:** Task 2, step 1
- **Issue:** The plan asks the line to say "the marker is written by `install --migrate` (Phase 38)". Today's `--migrate` does not write the marker, so that would describe behavior the shipped installer does not have. `install/message-references.test.ts` also forbids planning IDs in printed text.
- **Fix:** The line says the marker is written when the state is migrated to the v3 layout. A re-install over a fresh install prints `(target already has it)` rather than the migrate wording, because the marker is already there.
- **Files modified:** install/install.ts
- **Verification:** install/install.test.ts layout-marker cases; install/message-references.test.ts passes.
- **Committed in:** `1449fe3a`

**2. [Rule 3 - Blocking] The imperative-lexicon gate refused a second GENERATED document**
- **Found during:** Task 2, prose gates
- **Issue:** The seed trace index now carries the render's `GENERATED` line. The gate's two-sided pin refused the second generated file, and its corpus count was one short.
- **Fix:** GENERATED_EXEMPT_COUNT 1 -> 2 and GOVERNED_CORPUS_COUNT 49 -> 48, each with a dated paragraph naming the file and the plan truth that decides it. The printed exclusion reason now covers both files.
- **Files modified:** scripts/check-imperative-lexicon.ts, .js, .test.ts
- **Verification:** `node scripts/check-imperative-lexicon.js` exits 0; scripts/check-imperative-lexicon.test.ts 62/62.
- **Committed in:** `1449fe3a`

**3. [Rule 3 - Blocking] trace-freshness read the seed as its hand-written matrix**
- **Found during:** Task 2, related tests
- **Issue:** The "no vacuous pass" case used the seed traceability.md as the hand-written matrix. The seed is now the generated index, so the gate reported it fresh.
- **Fix:** The case writes a literal of the pre-v3 seed shape (title, update line, table header).
- **Files modified:** scripts/trace-freshness.test.ts
- **Verification:** scripts/trace-freshness.test.ts 12/12.
- **Committed in:** `1449fe3a`

**4. [Rule 3 - Blocking] board-corpus's third documentation block disappeared**
- **Found during:** the full run, shard 1
- **Issue:** The D-03 PREMISE case read the seed traceability.md's documentation block, which the generated index no longer has.
- **Fix:** The third row reads the seed `60-progress.md` block, which is a comment with nothing board-shaped in it, so the row keeps its role as the non-board witness.
- **Files modified:** scripts/board-corpus.test.ts
- **Verification:** scripts/board-corpus.test.ts 34/34.
- **Committed in:** `17c6d288`

**5. [Rule 3 - Blocking] Four installer censuses outside the planned files moved**
- **Found during:** the full run, shards 1, 3, 4 and 6
- **Issue:** RECORDED_FILE_COUNT, INSTALLED_FILE_COUNT, READ_PATH_COUNT and ledger-provenance's CREATED count each counted the new runnables, and the last three also counted the new seed files.
- **Fix:** Each re-derived from its printed listing, with a dated reason (pins table above).
- **Files modified:** install/installer-cross-version.test.ts, installer-user-edit.test.ts, installer-special-files.test.ts, ledger-provenance.test.ts
- **Verification:** each file re-run whole after the change: 8/8, 125/125, 43/43, 113/113.
- **Committed in:** `17c6d288`

---

**Total deviations:** 5 auto-fixed (1 bug, 4 blocking).
**Impact on plan:** All were needed for correctness or to keep the suite green. None widened scope: every pin moved by listing, with its entrant named.

## Full-suite run (mid-phase run 2 of 2) against 37-BASELINE.md

- **Command:** `npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1`, run as `--shard=1/6` to `--shard=6/6`. The shards ran one after another, one vitest process at a time, each with 1 worker. Shards 2 to 6 ran as background jobs, each waited on before the next began.
  - Shard results: 1751, 1874, 800, 2148, 1019 and 1535 tests, 9,127 in all.
  - The suite was not run as one process. No product file changed after shard 1 began. Every test file changed after its shard was re-run whole: board-corpus 34/34, installer-cross-version 8/8, installer-user-edit 125/125, installer-special-files 43/43, ledger-provenance 113/113.
- **New failures (9 in 5 files), all traced to this plan and fixed in `17c6d288`:**
  - install/installer-cross-version.test.ts (5): RECORDED_FILE_COUNT.
  - scripts/board-corpus.test.ts (1): the seed traceability documentation block.
  - install/installer-user-edit.test.ts (1): INSTALLED_FILE_COUNT.
  - install/installer-special-files.test.ts (1): READ_PATH_COUNT.
  - install/ledger-provenance.test.ts (1): CREATED.
  - No failure traced to plans 37-09 to 37-12.
- **Baseline failures still failing (all 20):** installer-fs-census 1, canonical-corpus 1, context-io-writer-set 2, context-io 7, harness-instance-ledger 4, uat-gate-exit-contract 5.
- **Baseline failures that now pass:** none.

## Verification

1. `npx vitest run install/install.test.ts install/record-truth.test.ts install/uninstall-removal.test.ts`: 578 passed, 1 skipped, run on the final product code. `install/installer-never-installed.test.ts`: 41/41.
2. `npm run build`, `npm run typecheck` and `npm run freshness` (86 committed `.js` fresh) all exit 0. `node scripts/runnable-embeds-freshness.js` reports 3 targets fresh.
3. The prose gates `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs`, `check-state-paths` and `check-public-docs-vocabulary` exit 0. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` exits 0.
4. Acceptance greps:
   - Task 1: the runnable paths appear 4 times in install.ts and 3 times in uninstall.ts, and `state-roll.js` once in README.md.
   - Task 2: `— in flight` 0, `^| ID | Category` 0, `^## What works` 0, `LAYOUT_MARKER_REL` 5 times in install.ts; board.md is 7,154 bytes, under 24,576.
5. The tracer gate: auto mode is off, the mode is end-of-phase, and the tracer's verify is automated only, so the verify was re-run. It passed, and Task 2 went ahead with no checkpoint.
6. ~/.grugops: the sha listing of its 180 files was taken before the first installer run and again at the end, and it is unchanged. Every scratch install set GRUGOPS_HOME to a temp path.
7. Bare `npm test` was never run, no branch was created or switched, and nothing was pushed. No vitest process of this plan is left running. The vitest processes seen at the end belong to another project's scratchpad and were not touched.

## Issues Encountered

- One foreground shard call passed the 10-minute shell limit and moved to the background. Its output still went to the scratch file, and the next shard started only after it finished.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Ready for 37-14. Workflows and roles still say to append rows to `memory-bank/plans/traceability.md`. That wording is outside this plan, and the later prose plans of this phase cover it.
- Phase 38's migrate must write `LAYOUT_MARKER_REL` as its last step. The install leaves it absent on every migrated or existing repository.

## Self-Check: PASSED

- FOUND agent-factory/seed/memory-bank/plans/.layout, plans/nfr/.gitkeep, plans/traceability/.gitkeep, plans/archive/.gitkeep, plans/traceability.md, install/install.ts
- FOUND commits 94d70874, 642b6f53, 1449fe3a, 17c6d288 (each an ancestor of HEAD)

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
