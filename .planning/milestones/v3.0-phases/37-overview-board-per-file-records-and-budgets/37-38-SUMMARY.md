---
phase: 37-overview-board-per-file-records-and-budgets
plan: 38
subsystem: testing
tags: [read-1, d-20, root-chain, in-12, in-13, shape-table, mutation-proof, vitest]

requires:
  - phase: 37-33 to 37-37
    provides: rootChainPresence in all three runnables, isWithin as the one boundary, the stray-entry remedy
provides:
  - root-chain positions derived from rootChainOf over each runnable's root kinds (7, 7, 3), equal to the table both ways
  - two outside link shapes at every root-chain, notes and task position (SHAPE_ROW_COUNT 235)
  - one derived outcome per refused state-check root-chain, notes or task cell
  - absent-root controls for all three runnables
  - ENOENT-exempt rows compared with a really absent fixture (IN-12); shape skips counted apart
  - IN-13 census over the three hand-written parts, and a realpath census
  - the walk's outside-boundary refusal names the notes directory
affects: [37-39]

actuals:
  tokens: 9811
  tasks: 2
  commits: 3
plan_head_before: d731584135bb9608c5509d9f5427e41566b2b28b
plan_head_after: 5aca642704d9a33acc3d1f13862531077aa49493

tech-stack:
  added: []
  patterns:
    - "root-chain positions come from the owner's own rootChainOf over named root kinds, with the count pinned and two-way equality to the table"
    - "an exempt row proves itself: same exit status and same writes outside its absent paths as a run on a fixture where those paths are really removed"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/context-io.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "The walk's outside-boundary refusal now names the notes directory, in the same form as the walk's other refusals; found by the new outside-link cells at the notes position (8 cells, RED before e6143a42)"
  - "A regular file at a root kind that state-check's traceDirectory asks (.grugops/context, .grugops/archive/context, memory-bank/plans/traceability) is exit 2 'is present and is not a directory', not exit 1. The plan derived exit 1 there and was wrong; the committed outcome follows 37-33's 'refused at the trace directory stays could-not-run'. The table pins exit 2 from CHAIN_ROOT_KINDS and the shape, not from an either-or"
  - "The state-roll archives (in all modes) and the archive directory (in write-new-archive) are on their rows' absent lists but not in the base fixture. FIXTURE_WITHOUT names them, and the PREMISE checks that they are absent instead of present"

patterns-established:
  - "Exempt rows carry { reason, absent, in? } and a really absent comparison"
  - "Hand-written-part censuses read the .ts after EMBED_CLOSE as a syntax tree and pin `<scope>:<arguments>` per call"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "Every D-20 link shape is planted at every root-chain position derived from the owner, and below a context root. Each is refused by name with nothing written, with one derived outcome per state-check cell"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 shapes (plan 37-31, D-18; plan 37-38, D-20)"
        status: pass
    human_judgment: false
  - id: D2
    description: "With no link on the chain, a really absent root or archive directory is still read as absent"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#D-20 control: an absent root with no link on its chain is still an absent root (plan 37-38)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ENOENT-exempt rows prove their outcome against a really absent fixture, and shape skips are counted apart (IN-12)"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 ENOENT (plan 37-31, D-18)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#every cell ran or was skipped for the platform, counted apart, and on darwin and linux none was skipped"
        status: pass
    human_judgment: false
  - id: D4
    description: "One boundary predicate across the three runnables (IN-13), with realpath used only at the pinned positions, and both owners correct for a root of /"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#IN-13: one boundary predicate across the three runnables (plan 37-38, D-19)"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#D-20: realpathSync after the generated region is called only at the pinned positions (plan 37-38)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#isWithin and rootChainPresence on a root of `/` (plan 37-38, IN-13)"
        status: pass
    human_judgment: false
  - id: D5
    description: "State-check exits 2 for a regular file at a context root or the trace directory, where the plan derived exit 1. A human should confirm this is intended"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#state-check traceDirectory#0 .grugops/context: regular file -> refused, text"
        status: pass
    human_judgment: true
    rationale: "The plan derived exit 1 (trace-not-compared). The committed program exits 2 (could-not-run), and the table now pins that. Whether a non-directory context root should stop state-check or only stop the trace comparison is a product decision"

duration: 39min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 38: The READ-1 Table in the D-20 Canonical Form Summary

**The READ-1 shape table now takes its root-chain positions from `rootChainOf` over each runnable's root kinds (7, 7 and 3). It plants six link shapes at each of them, including two that leave the root, and the two outside shapes at the notes and task positions too: 235 cells, all refused by name with nothing written. Absent-root controls show that absence is still read as absence. ENOENT-exempt rows are compared with a fixture where the path is really absent, skipped cells are counted apart, and one syntax-tree census holds isWithin as the only boundary test in all three runnables. One row found a naming defect, fixed in e6143a42.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-10-24T13:50:26Z
- **Completed:** 2026-10-24T14:29:26Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- **Tracer (end-to-end premise of the table).** Take a rendered two-root repository and replace `.grugops/archive` with a link to an empty directory outside the root. trace-render `--check` and the write mode both exit 2 with an empty stdout. stderr names `.grugops/archive/context` and `.grugops/archive <ROOT_CHAIN_LINK_REFUSAL>`, and the tree digest is unchanged. This passed on the committed runnables on its first run, as expected since plan 37-33.
- **Derived chain positions.** `CHAIN_ROOT_KINDS` comes from the install/state-layout constants. The union of `rootChainOf` over those kinds is pinned in `CHAIN_POSITION_COUNTS` at 7, 7 and 3. The root-chain paths of SHAPE_POSITIONS equal that union both ways. The hand-listed TRACE_DIRECTORIES and the hand-listed state-roll list are gone.
- **Two new shapes:** `link to an empty directory outside the root` and `link to an outside directory holding the child`. For the second, the original is renamed onto a fresh sibling mkdtempSync directory. Both shapes are planted at every root-chain, notes (directory-follow) and task (directory-refuse) position.
- **One outcome per refused state-check cell** of the root-chain, notes and task kinds:
  - at a path in `STATE_CHECK_MARKER_POSITIONS`, exit 2 naming the layout marker and the path. The set is `rootChainOf` of the marker's directory, asserted to be `[memory-bank, memory-bank/plans]`.
  - for a regular file at a state-check root kind, exit 2 with "is present and is not a directory" (see Deviations 2).
  - everywhere else, exit 1 with a trace-not-compared finding naming the path.
  - the file, listing and file-follow kinds keep plan 37-31's either-or, with a comment saying why.
- **Controls:**
  - trace-render and state-check, with `.grugops/archive/context` really removed and no link on either chain: state-check reports ABC-002.md as trace-stale (exit 1), `--check` reports it as EXTRA (exit 1), and the write removes it (exit 0) while keeping ABC-001.md.
  - state-roll, with no archive directory: the roll creates it, rolls, and writes both archives (exit 0).
- **IN-12, exempt rows prove their outcome.** Each `ENOENT_EXEMPT` entry is `{ reason, absent, in? }`. Each exempt row, in each of its modes, compares two things with an unfaulted run on a fresh fixture where its `absent` paths are really removed: the exit status, and the set of paths created, changed or removed outside the absent paths. That is 18 compared runs, and all 18 are equal (table below).
- **IN-12, shape counter.** A cell counts as run only after its shape is planted. The final case asserts that run plus skipped equals SHAPE_ROW_COUNT, and that skipped is 0 on darwin and linux. This run printed `SHAPE cells run: 235 of 235; skipped for the platform: 0`.
- **IN-13 census.** It reads the syntax tree of the hand-written part of trace-render.ts, state-check.ts and state-roll.ts (the code after `// </runnable-embeds>`). It finds no `insideRoot` identifier and no `startsWith` whose receiver or arguments mention `root`. isWithin is called only at the ISWITHIN_CALLS positions, and each committed .js defines isWithin exactly once. A synthetic case shows that a comment is not a node and that a root-prefix check is caught on either side.
- **Realpath census.** After the generated region, realpathSync is called only at the REALPATH_CALLS positions: the root in each runnable, state-check's own directory, and state-roll's newly created archive directory.
- **Root of `/` (context-io).** `isWithin("/", "/")`, `isWithin("/a", "/")` and `isWithin("/a/b", "/a")` are true, and `isWithin("/ab", "/a")` is false. `rootChainPresence("/", <real tmp dir without its leading />, leaf)` is present for both leaves, and `real` has no `//`.

## Task Commits

1. **Defect found by a Task 1 row:** `e6143a42` (fix). The walk's outside-boundary refusal now names the notes directory.
2. **Task 1: chain positions derived, D-20 shapes, absent-root controls:** `f7cfd92c` (test).
3. **Task 2: IN-12 comparison and counter, IN-13 and realpath censuses, root-`/` cases:** `5aca6427` (test).

## Final position table (root-chain, notes, task kinds; the other kinds are unchanged from 37-31)

| Runnable | Via | Paths | Kind | Shapes | Cells |
|----------|-----|-------|------|--------|-------|
| trace-render | realDirectoryOrNull#0 | `.grugops`, `.grugops/context`, `.grugops/archive`, `.grugops/archive/context`, `memory-bank`, `memory-bank/plans`, `memory-bank/plans/traceability` (derived) | root-chain | 6 | 42 |
| trace-render | readRawNotesWithSkips#0 | both notes directories | directory-follow | 6 | 12 |
| trace-render | readTaskNoteRefs#0 | taskA, taskB | directory-refuse | 7 | 14 |
| state-check | traceDirectory#0 | the same 7 (derived) | root-chain | 6 | 42 |
| state-check | readRawNotesWithSkips#0 | both notes directories | directory-follow | 6 | 12 |
| state-check | readTaskNoteRefs#0 | taskA, taskB | directory-refuse | 7 | 14 |
| state-roll | realDirectoryOrNull#0 | `memory-bank`, `memory-bank/plans`, `memory-bank/plans/archive` (derived) | root-chain | 6 | 18 |

Per-runnable totals:

- **trace-render 93:** notes 12, listing 10, task 14, chain 42, planned paths 10, extra trace file 5.
- **state-check 104:** shared 36, chain 42, index and trace file 10, extra trace file 5, marker 5, siblings 6.
- **state-roll 38:** chain 18, files 20.

The total is **235**.

## Pins (final values and history lines)

| Pin | Value | History line (2026-10-24, plan 37-38) |
|-----|-------|-----------------------------------|
| CHAIN_POSITION_COUNTS | 7, 7, 3 | new; derived union of rootChainOf over CHAIN_ROOT_KINDS |
| SHAPE_ROW_COUNT | 235 | 185 → 235 (93 + 104 + 38); two outside shapes on three kinds, derived chain |
| STATE_CHECK_MARKER_POSITIONS | `memory-bank`, `memory-bank/plans` | new; asserted equal to the literal pair (replaces MARKER_CHAIN) |
| ENOENT_EXEMPT_SIZE | 10 | unchanged; each entry gained `absent` |
| ENOENT_COMPARISONS | 3, 3, 2 | re-checked, unchanged, each inside ENOENT_OWNERS |
| Read-site pins | 15, 18, 10 | unchanged; the fix was a message |
| OWNER_CALLER pins | 6, 6, 2 | unchanged (re-derived: trace-render readRawNotesWithSkips, listContextTasks, readTaskNoteRefs, realDirectoryOrNull, `<top>`, readText; state-check readRawNotesWithSkips, listContextTasks, readTaskNoteRefs, runnableSkewFindings, locate, traceDirectory; state-roll realDirectoryOrNull, readTextOrThrow) |
| ISWITHIN_CALLS | trace-render `relOfPath:path,root`; state-check `readTraceText:path,root`, `runnableSkewFindings:hereReal,root`; state-roll `<top>:made,root` | new |
| REALPATH_CALLS | trace-render `<top>:rootArg`; state-check `<top>:rootArg`, `runnableSkewFindings:here`; state-roll `<top>:rootArg`, `<top>:archiveDirPath` | new |

## The ten exempt rows, compared (faulted / really absent)

| Row | Absent paths | Mode: faulted exit, really absent exit; writes outside the absent paths |
|-----|--------------|------------------------------------------|
| trace-render entryPresence:lstatSync#0 via readRawNotesWithSkips#0 | both notes directories | write 0/0, both [the index, ABC-001.md, ABC-002.md, ABC-099.md]; check 1/1, none |
| trace-render rootChainPresence:lstatSync#0 via realDirectoryOrNull#0 | both context roots, the state directory, the trace directory | write 2/2; check 2/2; none |
| trace-render rootChainPresence:lstatSync#0 via `<top>#0` | the index, ABC-001.md, ABC-002.md | write 0/0, both [ABC-099.md]; check 1/1, none |
| trace-render rootChainPresence:lstatSync#0 via readText#0 | the planned three and ABC-099.md | write 0/0; check 1/1; none |
| state-check entryPresence:lstatSync#0 via readRawNotesWithSkips#0 | both notes directories | text 1/1; none |
| state-check rootChainPresence:lstatSync#0 via locate#0 | the 16 paths locate asks in stateCheckRepo (marker, board, index, NFR catalog, tickets dir and ABC-001, nfr dir and NFR-001, trace dir, two trace files, progress, four move-only folders) | text 0/0; none |
| state-check rootChainPresence:lstatSync#0 via traceDirectory#0 | both context roots, the trace directory | text 1/1; none |
| state-check entryPresence:lstatSync#0 via runnableSkewFindings#0 | `state-roll.js`, `trace-render.js` (in a fresh host) | text 1/1; none |
| state-roll rootChainPresence:lstatSync#0 via realDirectoryOrNull#0 | state, archive and memory-bank directories | write 2/2; dry-run 2/2; write-new-archive 2/2; none |
| state-roll rootChainPresence:lstatSync#0 via readTextOrThrow#0 | the board, the progress file, both archives | write 2/2; dry-run 2/2; write-new-archive 2/2; none |

The `absent` lists came from a scratch probe that logged every question each caller asked of the owners in the base fixtures. They were written before the comparison first ran. No row moved into or out of ENOENT_EXEMPT.

## Mutation proofs (working tree only; each restored with `git checkout --` or a file copy; `git status --porcelain scripts` showed only this plan's uncommitted test files after each)

| Proof | Mutation | Result |
|-------|----------|--------|
| (a') | `.filter((p) => p !== "memory-bank")` on STATE_CHECK_MARKER_POSITIONS (test file) | 7 red: the 6 state-check cells at `memory-bank` (they exit 2, not 1) and the literal-pair assertion; 244 green |
| (a) | trace-render.js and state-check.js: the embedded rootChainPresence follows a link at the last component of a `directory` query when the target is a directory whose real path is inside the root (the round-2 policy) | 5 red, all `link to a directory` cells at chain leaves: trace-render `.grugops/context` and `.grugops/archive/context`; state-check `.grugops/context`, `.grugops/archive/context` and `memory-bank/plans/traceability`. 246 green, including every outside-target cell. trace-render's `memory-bank/plans/traceability` cell stays refused because the pre-write check's entry queries treat it as a non-last component. So the in-root link is the shape that only the canonical form catches |
| (b) | state-roll.js realDirectoryOrNull returns `join(root, ...rel.split("/"))` for an absent answer | New comparison: 16 red. Old assertions (HEAD test file): 14 red. The difference is the exempt realDirectoryOrNull row in `write` and `dry-run`, where the faulted exit is 0 against the really absent exit 2; it is green under the old assertions. The other 14 red under both because the write-new-archive baseline premise fails |
| (c) | plantShape reports the FIFO shape as a platform skip | the final case goes red: `SHAPE cells run: 218 of 235; skipped for the platform: 17`, "expected 17 to be 0" |
| (d) | state-roll.ts: a hand-written `insideRoot` (`p.startsWith(root + nodePath.sep)`) replaces `isWithin(made, root)`, then built | IN-13 state-roll case red (insideRoot at lines 390 and 473) |
| (d2) | the same function named `withinRepository` | IN-13 red on the root-prefix startsWith arm (`p.startsWith(root + nodePath.sep)`) |
| (e) | trace-render.ts realDirectoryOrNull gains `nodeFs.realpathSync(root)`, then built | realpath census red: `REALPATH_CALLS trace-render: 2 (<top>:rootArg; realDirectoryOrNull:root)` |
| (f) | context-io.js isWithin always appends the separator | the root-`/` case is red |

## Files Created/Modified

- `scripts/runnable-ref/read-sites.test.ts`: CHAIN_ROOT_KINDS, chainPositions, CHAIN_POSITION_COUNTS, the two shapes, STATE_CHECK_MARKER_POSITIONS and the one-outcome rule, the tracer, the controls, ExemptRow with `absent`, FIXTURE_WITHOUT, the really-absent comparison, the counter, and the IN-13 and realpath censuses.
- `scripts/context-io.test.ts`: the root-`/` case, and the boundary refusal's new message.
- `scripts/context-io.ts` and `.js`: readRawNotesWithSkips names the notes directory in its outside-boundary refusal.
- `scripts/runnable-ref/{trace-render,state-check,state-roll}.{ts,js}`: regions regenerated (for state-roll, the stamp only).
- `hooks/hook-entry.{ts,js}`: the hook manifest regenerated for the new context-io.js hash.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

**1. [Rule 1 - Bug] The walk's outside-boundary refusal did not name the position**
- **Found during:** Task 1, step 7, on the first whole run of the extended table.
- **RED evidence:** 8 cells failed, all at the notes position (taskA and taskB, both outside shapes, trace-render and state-check). Each was refused (exit 2 in trace-render, exit 1 with trace-not-compared in state-check), but the message was `UNREADABLE TASK .grugops/context/taskA: its notes directory resolves outside the repository root, so it was not read`. It never named `.grugops/context/taskA/notes`, which every other notes refusal names.
- **Fix:** `context-io: the notes directory "<path>" resolves outside the repository root, so it was not read`. The regions and the hook manifest were regenerated. The context-io boundary case was updated to the new message.
- **Files outside files_modified (the plan's conditional list allows these):** context-io.ts/.js, the three runnables' .ts/.js, hooks/hook-entry.ts/.js.
- **Commit:** e6143a42.

**2. [Wrong derivation, not a defect] A regular file at a state-check root kind**
- **Found during:** Task 1, step 5.
- **Derived (plan):** exit 1 with trace-not-compared at every root-chain position off the marker chain.
- **Observed (committed):** for the `regular file` shape at `.grugops/context`, `.grugops/archive/context` and `memory-bank/plans/traceability`, the result is exit 2 with an empty stdout and `the context root <p> is present and is not a directory` (or `the trace directory <p> ...`), `The state check did not run.`
- **Why the observed outcome stands:** the owner answers `present` there, because the leaf is not a link. traceDirectory's leaf-type rule then makes it could-not-run, which matches 37-33 ("refused at the trace directory stays could-not-run"). This is READ-1-compliant (exit 2 by name, nothing written).
- **Resolution:** a derived third outcome keyed on `CHAIN_ROOT_KINDS["state-check"]` and the shape, never an either-or. The other root-chain cells keep the plan's derivation, and all pass: the regular file at `.grugops` and `.grugops/archive` is exit 1 through ENOTDIR on the chain.
- **Flagged for the human** (coverage D5): should a non-directory context root stop state-check or only stop the trace comparison?

**3. [Rule 3 - Blocking] The absent-list PREMISE was false for three state-roll positions**
- **Issue:** the plan requires every `absent` path to exist in the base fixture. stateRollRepo plants no Done archive and no progress archive in any mode, and no archive directory in write-new-archive. Those are still positions the caller asks about.
- **Fix:** FIXTURE_WITHOUT (by `<runnable> <mode>`) names them, and the PREMISE checks that they are absent in the base fixture. Every other absent path is checked as present. No list was shortened.

**4. [Rule 3 - Blocking] Renamed the shapes describe**
- **Issue:** Task 2's `-t` pattern selects the "every cell ran" case but would not run the 235 cells, so the counter would read 0 of 235.
- **Fix:** the describe title now reads "... derived from the callers of entryPresence and rootChainPresence ..." (both true owners), so the pattern runs the cells too.

**5. [Extra proof] Mutations (d2) and (f)**
- Added beyond the plan, to show each arm of the IN-13 census and the root-`/` unit case going red on its own.

**Total deviations:** 1 auto-fixed bug (Rule 1), 1 derivation correction recorded with both outcomes, 2 blocking test-harness fixes (Rule 3), 1 extra proof. **Impact:** no row was dropped, skipped or loosened. The production change is a message only.

## TDD Gate Compliance

Task 2 is `tdd="true"`. Its assertions tighten tests over behavior that already exists, so they passed against the committed runnables on their first run (an expected green, not a RED). The RED evidence for each tightening is the mutation table above: (b), (c), (d), (d2), (e) and (f). The one production change (e6143a42) has its RED in the 8 failing cells recorded above. No `feat` commit exists because no feature was added.

## Issues Encountered

- `npm run generate:runnable-embeds` changed context-io.js, so the hook manifest had to be regenerated. Before that, the `31-37 WR-36 route 0` context-io case failed with "does not match the frozen manifest". It passed after `npm run generate:hook-manifest`, before the fix commit.
- Vitest's default reporter hides console output for passing tests, so the pin lines were read with `--reporter=verbose`.

## Regression comparison

- **Task 1 verify:** `npm run typecheck` passed. `npx vitest run scripts/runnable-ref/read-sites.test.ts -t "READ-1 shapes|D-20 control"`: 251 passed, 0 failed.
- **Task 2 verify 1:** typecheck, then the two files with `-t "ENOENT|IN-13|realpathSync|every cell ran|isWithin|rootChainPresence|one owner"`: 552 passed, 0 failed.
- **Task 2 verify 2 (derived subset):** 50 files, run on the committed tree after 5aca6427, with `--exclude '**/scripts/e2e/**'` and one worker. Result: 5,567 passed, 10 failed, 1 skipped (921 s). All 10 failures are in 37-BASELINE.md: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 (1), and context-io 31-29 (6). None is new.
- `npm run freshness`, `freshness:runnable-embeds` and `freshness:hook-manifest` all passed, and so did `check:state-paths`.

## Class sites re-searched (before this SUMMARY)

- **Owners:** the callingSites of rootChainPresence and entryPresence give OWNER_CALLERS 6, 6, 2 (listed in the pins table).
- **Read sites:** deriveReadSites gives 15, 18, 10.
- **Hand-written parts:** `insideRoot` 0/0/0; `isWithin(` 1/2/1; root-prefix `startsWith(` 0/0/0 (the remaining startsWith calls are `a.startsWith("--")` and trace-render's `rel.startsWith(`${TRACE_DIR_REL}/`)`); `realpathSync` 1/2/2 at the pinned positions.

## For 37-39's deferred-items.md

- **Human triage (coverage D5):** state-check treats a non-directory at a context root or at the trace directory as could-not-run (exit 2), not trace-not-compared (exit 1). The plan expected exit 1. The table now pins exit 2. Decide whether that stays.
- The file, listing and file-follow kinds still accept plan 37-31's either-or for state-check (exit 2 by name, or exit 1 with trace-not-compared). Round 3 did not change those outcomes, so the cells were not pinned to one.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-39 (the full non-e2e suite run, plus deferred-items.md).

## Self-Check: PASSED

- Commits e6143a42, f7cfd92c and 5aca6427 are on HEAD.
- `scripts/runnable-ref/read-sites.test.ts` contains CHAIN_POSITION_COUNTS.
- The working tree had no leftover mutation in `scripts/` or `hooks/` before this SUMMARY.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
