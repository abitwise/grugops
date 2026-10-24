---
phase: 37-overview-board-per-file-records-and-budgets
plan: 35
subsystem: testing
tags: [read-1, cr-05, d-20, in-13, root-chain, symlink, state-check, boundary, census]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "rootChainPresence, rootChainOf, ROOT_CHAIN_LINK_REFUSAL and the exported isWithin embedded into state-check (37-33); the trace-render half of IN-13 and the above-root control (37-34)"
provides:
  - "state-check's locate(rel, leaf) on the generated rootChainPresence, a `link` Located kind mapped by name at readState, sizeFinding, listDirectory and readTraceText"
  - "every folder state-check lists asked with leaf `directory` (flagged): a link at a listed folder is the folder's one finding and nothing beneath it is read"
  - "no hand-written boundary copy in state-check: insideRoot deleted, runnableSkewFindings and readTraceText ask isWithin"
  - "the marker sequence, the D-20 position table, the folder-link rows with real records beneath, the .grugops/queue row, the backslash-name rows and the IN-13 census"
affects: [37-36, 37-37, 37-38, 37-39]

actuals:
  tokens: 14606
  tasks: 2
  commits: 2
plan_head_before: 11cab9fd6978b4c7624691268087972c001b9e40
plan_head_after: eb49493e58f32a6528029aedcc41f2a0f6f05b2d

tech-stack:
  added: []
  patterns:
    - "One locate per runnable on the root-chain owner, with the leaf rule as an explicit argument (`entry` for files, `directory` for every listed folder)"
    - "Expected findings asserted as the exact sorted key|rel set, so a mutation that adds a per-file finding or hides one goes red"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/runnable-ref/trace-render.test.ts

key-decisions:
  - "locate pre-checks the path with the generated rootChainOf and answers a name it refuses (a backslash) as an error by name, so the owner's throw never reaches the unexpected-throw backstop; state-check now refuses such a trace-directory file with exit 2, as trace-render does since 37-34"
  - "A link at memory-bank/plans/archive leaves the trace compared and fresh: no trace path lies beneath it, so its row asserts the move-only-unlisted finding and trace.compared true instead of the plan's 'never The trace is fresh'"
  - "MARKER_FIRST_POSITIONS removed from read-sites.test.ts; state-check's root-chain link cells are pinned to one outcome each (exit 2 at the marker above it, exit 1 trace-not-compared elsewhere)"

patterns-established:
  - "D-20 position list derived as the union of rootChainOf over the trace and archive roots minus the marker chain, size asserted (6)"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A link of any of four shapes at memory-bank or memory-bank/plans makes state-check exit 2 at the layout marker, naming the marker and the position with the root-chain reason, never WARN mode, never No findings, never fresh; controls: no link is No findings, a really removed marker is WARN mode"
    requirement: "SPLIT-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#D-20: the layout marker behind a root-chain link is never read and never absent (plan 37-35, CR-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The six other root-chain positions, four link shapes each: exact named findings carrying the root-chain reason, exit 1 with the marker and WARN with exit 0 without it; file leaf rules kept (marker through an in-root link reads valid, a linked ticket file is still not measured)"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#D-20: every root-chain position as state-check sees it (plan 37-35)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Flagged folder rule: a link at each of the six listed folders, real records beneath, is exactly the folder's one finding with the root-chain reason and no finding beneath it; the tickets row under three more link shapes; the control measures ABC-2.md over budget and counts 2/2; a link at .grugops/queue is one move-only-unlisted finding"
    requirement: "SPLIT-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#flagged: a link at a listed folder is the folder's one finding, and no file beneath it is read (plan 37-35)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#flagged: a link at .grugops/queue (plan 37-35)"
        status: pass
    human_judgment: true
    rationale: "The two leaf-rule changes past D-20's list (a link at a listed folder, a link at .grugops/queue) are flagged for the human; the rows hold the behavior, the human judges whether to keep it"
  - id: D4
    description: "IN-13 census over state-check's hand-written syntax tree (no insideRoot node, entryPresence only in runnableSkewFindings, rootChainPresence only in locate and traceDirectory with root first, no startsWith on root, isWithin in runnableSkewFindings and readTraceText); above-root control extended with state-check --json"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/state-check.test.ts#IN-13 census: state-check keeps no hand-written boundary copy (plan 37-35)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#D-20: a root path through a link above the repository root still renders"
        status: pass
    human_judgment: false
  - id: D5
    description: "READ-1 tables re-derived for state-check: locate#0 under rootChainPresence, ENOENT keys moved, pins unchanged, UNREACHED_SITES 0"
    requirement: "SPLIT-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (519 passed)"
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 35: state-check's State Paths on the Root-Chain Owner Summary

**state-check's locate now asks rootChainPresence for every state path, so a symbolic link below the root on any path's parent chain is refused by name: the layout marker behind a linked `memory-bank` is exit 2 instead of WARN mode with exit 0, a link at a listed folder is that folder's one finding, and the hand-written insideRoot copy is gone**

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-24T11:51:57Z
- **Completed:** 2026-10-24T12:26:06Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `locate(rel, leaf = "entry")` asks `rootChainPresence(root, rel, leaf)` and maps absent, unreadable (to `error`), link, outside and present (to `inside`) one to one. `Located` gains `{ kind: "link"; reason }`. readState maps it to `cannot use the <what> <rel>: <reason>.` (exit 2), sizeFinding to an unmeasured finding `its size was not read: <reason>`, listDirectory to unlisted `the directory was not listed: <reason>`, readTraceText to `cannot use the trace file <rel>: <reason>.` (exit 2).
- listDirectory asks with leaf `directory` for every folder it lists (the flagged leaf-rule change).
- insideRoot deleted. runnableSkewFindings uses `isWithin(hereReal, root)`. readTraceText derives its path with `isWithin(path, root)` and `nodePath.relative`, `/`-joined; a path not below the root is could-not-run by name.
- The header's THE ROOT IS A BOUNDARY paragraph is rewritten for D-20. The TRACE FRESHNESS paragraph now says that a link above the marker stops the check at the marker.

## Task Commits

1. **Task 1: state-check's locate on the root-chain owner; the marker behind a link is exit 2 (tracer)** - `377b2a38` (fix)
2. **Task 2: the D-20 position table, the flagged folder and queue rows, the boundary copy deleted (IN-13)** - `eb49493e` (fix)

**Plan metadata:** recorded in the docs commit that adds this file.

## Class sites: READ-1 / CR-05 and IN-13 in state-check (final state)

Search over the hand-written part (after `// </runnable-embeds>`): `locate(` 5 (the declaration, readState, sizeFinding, listDirectory, readTraceText); `rootChainPresence(` 2 (locate, traceDirectory); `entryPresence(` 1 (runnableSkewFindings); `insideRoot` 0; `isWithin(` 2 (runnableSkewFindings, readTraceText); `realpathSync` 2 (the root, the runnable's own directory); `startsWith(` 2, both on argv (`--`), neither on `root`; `root.length` 0.

| Site (by name) | Before (after 37-34) | After this plan | Test |
|----------------|----------------------|-----------------|------|
| locate (readState: marker, board, both indexes, progress) | entryPresence, follows the chain | rootChainPresence, leaf `entry`; a chain link is exit 2 | marker sequence, position table, read-sites file/file-follow cells |
| locate (sizeFinding: progress, tickets, NFR files, trace files) | the same | leaf `entry`; a chain link is an unmeasured finding (never reached beneath a linked folder) | position table (traceability rows), backslash-name row |
| locate (listDirectory: tickets, NFR, queue-done, decisions, both archives, trace directory) | followed the chain and an in-root link at the folder | leaf `directory`: a link at the folder or on its chain is one unlisted finding; nothing beneath is listed, measured, counted or index-compared | folder-link rows, position table, dangling rows, `.grugops/queue` row |
| nfrFindings / confirmListed | ran on a listing through an in-root folder link | not run when the NFR folder is unlisted (unchanged rule) | NFR folder-link row (exactly one finding) |
| locate (readTraceText) | the same | leaf `entry`; relativizer on isWithin | backslash-name row, census |
| traceDirectory | on the owner (37-33) | unchanged | 37-33 rows |
| insideRoot (locate, runnableSkewFindings) | hand-written copy | deleted; isWithin in runnableSkewFindings | census, mutation (b) |
| readTraceText relativizer (`${root}/` prefix) | hand-written prefix test | isWithin + nodePath.relative | census, mutation (b) |
| runnableSkewFindings entryPresence and its own realpath | not a state path | unchanged | 37-31 program cells |
| confirmListed lstat | a listed NFR file re-checked | unchanged | EIO rows |
| `.grugops/queue` | followed | refused as the parent of a state path (flagged) | `.grugops/queue` row |

## RED runs

**Task 1, against the plan 37-34 build (11cab9fd), `-t "layout marker behind a root-chain link"`: 8 failed, 3 passed** (the premise and the two controls).

| Position, link shape | 37-34 build outcome |
|----------------------|---------------------|
| `memory-bank` to an empty outside directory | exit 0, WARN mode: `WARN` lines for the board, both indexes and the trace directory, then `LAYOUT   no layout marker at memory-bank/plans/.layout` (the reproduced CR-05 shape) |
| `memory-bank` to the moved content outside the root | exit 0, WARN mode: `layout marker not recognized: it resolves outside the repository root`, every state file "resolves outside the repository root" |
| `memory-bank` to the moved content in-root | the marker read through the link (valid), then exit 1 with one trace-not-compared finding |
| `memory-bank` dangling | exit 2 with entryPresence's reason (`a symbolic link on the path has a target that cannot be reached`), not the root-chain reason |
| `memory-bank/plans`, the same four shapes | the same four outcomes |

**Task 1, the other new or rewritten rows against the 37-34 build:**
- The rewritten outside-root ticket-directory row and the six rewritten folder rows of the plan 37-29 dangling table failed. The old build gave "outside the repository root" or the unreachable-target reason.
- The backslash ticket row failed: the old build measured the file, so there was no finding.
- The backslash trace-file row failed: the old build gave exit 1 with `memory-bank/plans/traceability/a\b.md: extra: a fresh render removes it (trace-stale)`.

**Task 2, against the Task 1 build (377b2a38), `-t "D-20|flagged|IN-13 census"`: 1 failed, 56 passed.** Only the census failed, as expected. It failed on four clauses:
- `an identifier named insideRoot`: 2 nodes, the declaration and the call in runnableSkewFindings. The plan's expectation said 3: one declaration and two calls. The locate call had already left with Task 1.
- `a startsWith call whose argument mentions root`: `path.startsWith(\`${root}/\`)`.
- `runnableSkewFindings asks the generated isWithin`.
- `readTraceText asks the generated isWithin`.

**Folder rows against the plan 37-34 build (11cab9fd): 10 failed, 3 passed.**
- The in-root-linked tickets folder was listed through the link and each file measured: `{"findings":[{"rel":"memory-bank/plans/tickets/ABC-2.md","key":"ticketBytes","measured":65537,...}], "moveOnly":[...liveCount 2, archivedCount 2...]}`. This is the round-2 outcome the flagged rule replaces.
- Every other in-root folder link was listed through the link too, with counts 2/2 and no folder finding.
- The tickets folder linked outside the root gave `it resolves outside the repository root, so it was not listed`.
- The dangling tickets link gave `the directory could not be resolved: it is a symbolic link whose target cannot be reached (ENOENT)`.
- The `.grugops/queue` link was followed: exit 0, liveCount 1, no finding.

## GREEN

- **After Task 1:** `npm run build && npm run typecheck && npm run -s freshness:runnable-embeds` passed. The embeds stayed fresh, 3 targets. state-check.test.ts, read-sites.test.ts and runnable-exit-contract.test.ts: 3 files, 674 passed. trace-render.test.ts: 91 passed. `node scripts/runnable-ref/state-check.js .` gave `No findings.` with exit 0, and `--json` gave `"compared":true`. The tracer gate (interactive, `end-of-phase`, automated-only verify) was met by re-running that verify.
- **After Task 2:** the four verify files gave 807 passed. `-t "D-20|flagged|IN-13 census"` gave 53 passed and 0 failed:
  - the marker describe: 11
  - the position table: 24 cells, plus the derivation case, 2 file-leaf controls and the run count
  - the folder rows: 9, plus the LISTED_FOLDERS case, the control and the run count
  - the queue row: 1
  - the census: 1

  Every cell asserts its WARN half too. On darwin as non-root, none was skipped (asserted).

## Flagged rows: observed output

`.grugops/queue` linked in-root to the moved queue directory (marker valid, one queue-done record):

```
FINDING  .grugops/queue/done: the directory was not listed: .grugops/queue is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path (move-only-unlisted)
MOVE-ONLY .grugops/queue/done: not listed live, 0 archived
MOVE-ONLY memory-bank/50-decisions: 0 live, 0 archived
TRACE    The trace is fresh: 0 task(s) and 0 note(s) read; ...
```
exit 1.

In-root-linked tickets folder holding ABC-1.md and ABC-2.md (65,537 bytes):

```
FINDING  memory-bank/plans/tickets: not measured, budget 65,536 bytes (BUDGETS.ticketBytes) — the directory was not listed: memory-bank/plans/tickets is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path
MOVE-ONLY ...
TRACE    The trace is fresh: ...
```
On the 37-34 build the same tree printed `FINDING  memory-bank/plans/tickets/ABC-2.md: 65,537 bytes, budget 65,536 bytes (BUDGETS.ticketBytes)`. The over-budget ticket is no longer reported until a human replaces the link with the folder, but the folder finding names why.

## Rewritten tests (old expectation to new)

| Test | Old expectation | New expectation |
|------|-----------------|-----------------|
| state-check.test.ts "a symlinked ticket directory pointing outside the repository root ..." (renamed: "... is refused as a root-chain link and never listed (plan 37-35)") | `FINDING  memory-bank/plans/tickets: not measured` containing "outside the repository root" | the same finding containing `memory-bank/plans/tickets <ROOT_CHAIN_LINK_REFUSAL>`; still no ABC-009, no 65,537 |
| state-check.test.ts DANGLING_STATE_ROWS `TICKETS_REL`, `NFR_DIR_REL`, `QUEUE_DONE_REL`, `QUEUE_DONE_ARCHIVE_REL`, `DECISIONS_REL`, `DECISIONS_ARCHIVE_REL` (plan 37-29) | exit 1, one FINDING naming the folder under its key, matching the unreachable-target reason | exit 1, the same one FINDING under the same key, containing `<folder> <ROOT_CHAIN_LINK_REFUSAL>` (new row field `reason: "root-chain"`); titles gain "with the root-chain reason" |
| read-sites.test.ts root-chain shape cells at `memory-bank` and `memory-bank/plans` (state-check) | MARKER_FIRST_POSITIONS waived the reason check when the run was exit 2 | the waiver and the set are removed; every link cell must carry `<position> <ROOT_CHAIN_LINK_REFUSAL>`, and state-check's root-chain link cells are pinned to one outcome: exit 2 naming the marker at the two positions above it, exit 1 elsewhere |

No test was deleted or weakened.

## read-sites.test.ts: removed rows and their replacements

| Removed (key, via) | Replacement |
|--------------------|-------------|
| state-check `entryPresence:lstatSync#0 via locate#0` | state-check `rootChainPresence:lstatSync#0 via locate#0` |
| state-check `entryPresence:statSync#0 via locate#0` | state-check `rootChainPresence:statSync#0 via locate#0` |
| state-check `entryPresence:realpathSync#0 via locate#0` | state-check `rootChainPresence:realpathSync#0 via locate#0` |
| state-check `rootChainPresence:lstatSync#0` (no via; one caller in 37-33) | state-check `rootChainPresence:lstatSync#0 via traceDirectory#0` |
| state-check `rootChainPresence:statSync#0` | state-check `rootChainPresence:statSync#0 via traceDirectory#0` |
| state-check `rootChainPresence:realpathSync#0` | state-check `rootChainPresence:realpathSync#0 via traceDirectory#0` |
| ENOENT_EXEMPT `state-check entryPresence:lstatSync#0 via locate#0` | `state-check rootChainPresence:lstatSync#0 via locate#0` (same reason, plus "the root-chain owner answers absent only beneath real directories") |
| ENOENT_EXEMPT `state-check rootChainPresence:lstatSync#0` | `state-check rootChainPresence:lstatSync#0 via traceDirectory#0` (same reason) |
| MARKER_FIRST_POSITIONS and its allowance (37-33 deviation 3) | removed; MARKER_CHAIN (derived from rootChainOf) pins the one outcome |

- SC_PRESENCE_CALLERS is now four entries: the walk, listContextTasks, readTaskNoteRefs and runnableSkewFindings.
- The new SC_ROOT_CHAIN_CALLERS is `["traceDirectory#0", "locate#0"]`.
- The pins are unchanged, with a dated history line. Read sites stay 15/18/10; only the pairs moved, -3 and +3. ENOENT_EXEMPT_SIZE stays 10. ENOENT_COMPARISONS stays 3/3/2. Owner callers stay 6/6/2: state-check has entryPresence's four callers and rootChainPresence's two.
- SHAPE_POSITIONS is unchanged. locate#0 keeps its `file` and `file-follow` kinds.
- SHAPE_ROW_COUNT stays 185, and UNREACHED_SITES stays 0. Both equalities still check both directions.
- read-sites.test.ts: 519 passed after each task.

## Mutation proofs (working tree only)

Each mutation was applied to the uncommitted task tree and then reverted. The revert restored a byte copy taken before the mutation and then rebuilt. `git checkout --` would also have discarded the task's own uncommitted change. After each revert, `cmp` showed the .ts (and for Task 2 the .js) equal to the copy, the embeds were fresh, and `git status --porcelain scripts/runnable-ref` was empty after each commit.

- **(a)** locate asks entryPresence, the round-2 owner. It follows parent links, keeps the leaf `directory` rule through rootChainPresence for a leaf link, and keeps its own boundary check. Result: all 8 marker rows went red, and the 3 controls passed.
- **(b)** The `${root}/` prefix test was restored in readTraceText. Result: the census went red on 2 clauses, "a startsWith call whose argument mentions root" and "readTraceText asks the generated isWithin". The other 52 cases passed.
- **(c)** listDirectory asks locate with leaf `entry`, round 2's folder rule. Result: 13 red.
  - All 9 folder-link rows. The in-root links were listed through the link, and each file beneath became its own finding. The outside, dangling and empty-outside tickets links lost the root-chain reason.
  - All 4 `memory-bank/plans/traceability` rows of the position table.
- **(d)** listDirectory maps `link` to `absent`. Result: 26 red.
  - All 9 folder-link rows. In the in-root tickets row the linked folder read as an empty set, ABC-2.md was hidden, and the run printed `No findings.` with exit 0.
  - The `.grugops/queue` row.
  - 16 position cells: `.grugops`, `.grugops/archive`, traceability and `memory-bank/plans/archive`, four shapes each.

## Regression run (Task 2 verify, once)

- **Run:** the derived subset was 50 test files (`git grep -l` over the plan's patterns, e2e excluded), run with `npx vitest run --exclude '**/scripts/e2e/**'` on one worker in 897 s. 4 files failed and 46 passed. 11 tests failed, 5,424 passed and 1 was skipped.
- **Baseline failures (10, all in 37-BASELINE.md):**
  - canonical-corpus provenance (1)
  - context-io-writer-set 31-14 (2)
  - context-io 31-23 PROBE 5 (1)
  - context-io 31-29: PREMISE, DIRECTION 1 and 2, SEEDED, CONVERSE 1 and 2 (6)
- **Failure outside the baseline (1): scripts/capture-live.test.ts "Test P5 (the polluted channel)".**
  - Cause: the run was made before the Task 2 commit. The working-tree row listed the uncommitted `scripts/runnable-ref/trace-render.test.ts`, and the case asserts that the row text does not contain "trace".
  - Not a defect in this plan's code. After the commit, `npx vitest run scripts/capture-live.test.ts` gave 76 passed.
  - The full non-e2e run in 37-39 will see a clean tree.

These gates all exit 0:
- build, typecheck, freshness (87 outputs), freshness:traceability and freshness:runnable-embeds
- check-foundation-guards, check-state-paths and check-nul-bytes
- the validator: `ALL CHECKS PASSED`
- `node scripts/runnable-ref/state-check.js .`: `No findings.`

No orphaned grugops vitest worker remained. The only vitest processes found belonged to another project, grugops-examples, and were left alone.

## Handover items

- **37-33 deviation 3 (MARKER_FIRST_POSITIONS):** this plan moved the marker read onto the root-chain owner. The set and its allowance are removed in 377b2a38, as listed above.
- **37-34 deviation 1 (backslash names), for 37-39's deferred-items.md:** state-check now refuses such a name by name.
  - A trace-directory file whose name holds a backslash is exit 2: `cannot resolve the trace file memory-bank/plans/traceability/a\b.md: context-io: the state path ... it holds a backslash.` trace-render gives exit 2 for the same file since 37-34, so the two runnables agree again. Before this plan, state-check gave exit 1 trace-stale `extra` for it.
  - A record in a listed folder (tickets, NFR, trace directory) whose name holds a backslash is one unmeasured finding naming it, where it used to be measured.
  - Both rows are skipped on win32.
  - The human should still decide whether refusing such a name is the right final rule.

## Decisions Made

- locate runs the generated rootChainOf before asking the owner. A name the state-layout ENCODING rule refuses is an `error` by name, with code `ENCODING` (an unused field, kept for the type), so the owner's throw never reaches the main try's backstop.
- `abs` is still computed for a present path, as the plan's Located shape lists it, though no caller reads it today.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan truth] A link at memory-bank/plans/archive leaves the trace compared and fresh**
- **Found during:** Task 2, step 1
- **Issue:** The plan's truth and the Task 2 behavior say "no run prints `The trace is fresh`" for all six positions. But `memory-bank/plans/archive` holds no trace path: not a context root, not the trace directory, not the index. So state-check compares the trace and finds it fresh beside the move-only-unlisted finding. Asserting "never fresh" there would be asserting something false. Making it true would need the compare to refuse for a link unrelated to the trace.
- **Fix:** TRACE_COMPARED_POSITIONS (that one position) asserts `trace.compared` true and `The trace is fresh`. Every other assertion of the row holds: the exact finding, the root-chain reason, exit 1 and WARN with exit 0, never `No findings.`, never `trace-stale`. The other five positions assert never fresh.
- **Committed in:** eb49493e

**2. [Rule 1 - Bug] A backslash name reached the owner's throw**
- **Found during:** Task 1, step 2
- **Issue:** locate hands every listed record and compared trace file to rootChainPresence, whose rootChainOf throws for a backslash. Such a file would have stopped state-check through the main try's "failed unexpectedly" backstop.
- **Fix:** the pre-check described under Decisions, plus two rows in the describe "a state path name the state layout cannot hold is refused by name (plan 37-35)". Both rows failed on the 37-34 build.
- **Committed in:** 377b2a38

**3. [Rule 2 - Additive] read-sites root-chain cells pinned to one outcome**
- Removing MARKER_FIRST_POSITIONS let the state-check root-chain link cells assert one exit code each: 2 above the marker, 1 elsewhere. Before, they accepted either.

**4. [Plan premise] census RED clause count; mutations reverted from a snapshot**
- The plan expected insideRoot to be declared once and called twice on the Task 1 build. Task 1 had already removed the locate call, so the census found 2 nodes, as recorded above.
- Mutations were reverted by restoring a byte copy, not `git checkout --`, because the mutated file held the task's uncommitted change.

---

**Total deviations:** 4 (2 plan-truth or bug fixes, 1 additive, 1 premise recorded as measured). **Impact:** there was no widening past the plan's files. The backslash refusal and the two flagged leaf-rule changes are for the human.

## Issues Encountered

- The capture-live P5 failure in the regression run came from running before the commit (above). It was resolved by the commit and confirmed by a one-file rerun.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 37-36 (state-roll on the root-chain owner).
- For 37-39 Task 3's deferred-items.md:
  - the two flagged leaf-rule changes: a link at a listed folder, and a link at `.grugops/queue`
  - the backslash-name outcome in both runnables
  - the memory-bank/plans/archive trace-fresh truth correction

## Self-Check: PASSED

- FOUND: 377b2a38, eb49493e (both ancestors of HEAD)
- FOUND: scripts/runnable-ref/state-check.ts, scripts/runnable-ref/state-check.js, scripts/runnable-ref/state-check.test.ts, scripts/runnable-ref/read-sites.test.ts, scripts/runnable-ref/trace-render.test.ts

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
