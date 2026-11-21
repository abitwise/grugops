---
phase: 37-overview-board-per-file-records-and-budgets
plan: 36
subsystem: testing
tags: [read-1, cr-05, d-20, in-13, root-chain, symlink, state-roll, boundary, census]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "rootChainPresence, rootChainOf, ROOT_CHAIN_LINK_REFUSAL and the exported isWithin in scripts/context-io.ts (37-33); the trace-render and state-check halves of D-20 and IN-13 (37-34, 37-35)"
provides:
  - "state-roll's realDirectoryOrNull on the generated rootChainPresence with leaf `directory`: a link at or above the state directory, the archive directory or the memory bank directory is exit 2 by name in both modes, nothing rolled"
  - "state-roll's readTextOrThrow on rootChainPresence with leaf `entry`; every file rule kept"
  - "no hand-written boundary copy in state-roll (insideRoot deleted, the post-mkdir check asks isWithin) and no entryPresence anywhere in state-roll.js"
  - "the D-20 state-roll link table (3 positions x 4 links x 2 modes), the above-root control and the IN-13 census"
affects: [37-37, 37-38, 37-39]

actuals:
  tokens: 13731
  tasks: 2
  commits: 3
plan_head_before: 60f6cad956e88b6a8802ec5036d18d6337ae2e6f
plan_head_after: 050fc2b0fae5d717b190c898d9a132b13257c3f4

tech-stack:
  added: []
  patterns:
    - "Every state path of all three runnables is now asked of the one root-chain owner; entryPresence is embedded only where a position sits below a context root (trace-render, state-check)"
    - "A census over a whole committed .js (generated region included) asserts identifier absence on the syntax tree and asserts by text that a comment naming the identifier is still there, so the census is shown not to be a text count"

key-files:
  created: []
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.test.ts
    - scripts/runnable-ref/read-sites.test.ts

key-decisions:
  - "readTextOrThrow asks the owner with the repository-relative `rel` and still reads through the `path` its caller composed from the verified directory's real path; both name the same file because every directory on the chain was refused if it was a link"
  - "abs() was deleted with Task 1: its only caller was realDirectoryOrNull, and tsc noUnusedLocals made it a compile error"
  - "SR_PRESENCE_CALLERS was replaced by SR_ROOT_CHAIN_CALLERS, matching TR_ROOT_CHAIN_CALLERS and SC_ROOT_CHAIN_CALLERS; state-roll has no entryPresence caller left"

patterns-established:
  - "State-roll link positions derived as rootChainOf(ARCHIVE_REL), size asserted (3)"

requirements-completed: [SPLIT-06]

coverage:
  - id: D1
    description: "A link of four shapes (an empty outside directory, the moved content outside, the moved content in the root, dangling) at memory-bank, memory-bank/plans or memory-bank/plans/archive: --dry-run and write mode exit 2, stdout empty, stderr names the link with ROOT_CHAIN_LINK_REFUSAL and `Nothing was rolled.`, never `install grugops first`; the root and the outside directory digests unchanged"
    requirement: "SPLIT-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#D-20: a state-roll directory beneath a root-chain link is refused, nothing rolled (plan 37-36, CR-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CONTROL: no link and no archive directory, the roll creates the archive directory and rolls (exit 0); a dry run plans and writes nothing"
    requirement: "SPLIT-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#D-20: a state-roll directory beneath a root-chain link is refused, nothing rolled (plan 37-36, CR-05) CONTROL rows"
        status: pass
    human_judgment: false
  - id: D3
    description: "A root path through a link above the repository root plans and rolls with the same exit code, stdout and written bytes as the real path"
    requirement: "SPLIT-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#D-20: a root path through a link above the repository root still rolls (plan 37-36)"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-13 census: no insideRoot or entryPresence node in the hand-written part, rootChainPresence called with root first only from realDirectoryOrNull and readTextOrThrow, no startsWith on root, the post-mkdir check calls isWithin; no entryPresence node in the whole committed state-roll.js"
    requirement: "SPLIT-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/state-roll.test.ts#IN-13 census: state-roll keeps no hand-written boundary copy (plan 37-36)"
        status: pass
    human_judgment: false
  - id: D5
    description: "READ-1 tables re-derived for state-roll: 10 read sites, rootChainPresence under realDirectoryOrNull#0 and readTextOrThrow#0, the root-chain shape kind at realDirectoryOrNull#0, ENOENT keys moved, UNREACHED_SITES 0; file positions keep their refusals"
    requirement: "SPLIT-06"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (519 passed)"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 36: state-roll on the Root-Chain Owner Summary

**state-roll now asks rootChainPresence for every directory and file it reads or writes, so a symbolic link at `memory-bank`, `memory-bank/plans` or the archive directory is exit 2 by name with nothing rolled: the CR-05 shape no longer says "install grugops first", an in-root archive link is no longer rolled through, and the hand-written insideRoot copy and the embedded entryPresence are gone**

## Performance

- **Duration:** 35 min
- **Started:** 2026-10-24T12:31:50Z
- **Completed:** 2026-10-24T13:06:28Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `realDirectoryOrNull(rel, what)` asks `rootChainPresence(root, rel, "directory")`. Absent is null. Unreadable is `<what> <rel> cannot be inspected: <reason>.` A link is `<what> <rel> cannot be used: <reason>.` Outside is `<what> <rel> resolves outside the repository root, so it was not used.` A present entry that is not a directory is `<what> <rel> is not a directory.` The callers did not change.
- `readTextOrThrow(rel, path)` asks `rootChainPresence(root, rel, "entry")`. It throws `<rel> cannot be inspected: <reason>`, `<rel> cannot be used: <reason>` or `<rel> resolves outside the repository root, so it was not read`. The present-entry rules are unchanged: a symbolic link (`a roll would replace the link with a file`), a non-regular file, the reader-null refusal and U+FFFD.
- insideRoot is deleted. The check after the roll creates the archive directory is `isWithin(made, root)`, and SR-8 is unchanged.
- The generator's state-roll row gained `rootChainPresence`, `isWithin` and `ROOT_CHAIN_LINK_REFUSAL` (Task 1) and dropped `entryPresence` (Task 2), with dated plan 37-36 lines. trace-render and state-check changed only their stamp line.
- The header paragraph THE ROOT IS A BOUNDARY and the JSDoc of both functions now name the root-chain owner. Outside the generated region, state-roll.ts no longer names entryPresence anywhere: the prose criterion prints 0, against a baseline of 5.

## Task Commits

1. **Task 1: state-roll's directories on the root-chain owner (tracer)** - `8f4b1352` (fix)
2. **Task 2: state-roll's files on the owner, the boundary copy deleted, the round-2 owner out of the region, the above-root control** - `7a990c31` (fix)
3. **Regression fix: test titles reworded for the ticket-reader census** - `050fc2b0` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## Class sites: READ-1 / CR-05 and IN-13 in state-roll (final state)

These counts come from searching the hand-written part, everything after `// </runnable-embeds>`:

| Search | Count | Where |
|--------|-------|-------|
| `entryPresence(` | 0 | |
| `rootChainPresence(` | 2 | realDirectoryOrNull, readTextOrThrow |
| `realDirectoryOrNull(` | 5 | the declaration and 4 calls: the state directory twice, the archive directory, the memory bank directory |
| `readTextOrThrow(` | 3 | the declaration, readText, io.read |
| `insideRoot` | 0 | |
| `isWithin(` | 1 | the check after the archive directory is created |
| `realpathSync` | 2 | the root, and the realpath after mkdir (SR-8) |
| `startsWith(` | 1 | argv `--`; none on `root` |

| Site (by name) | Before (37-35) | After this plan | Test |
|----------------|----------------|-----------------|------|
| realDirectoryOrNull (state directory, archive directory, memory bank directory) | entryPresence, which followed the chain; the boundary was checked only on present | rootChainPresence, leaf `directory`; a link anywhere on the chain is exit 2 | the D-20 describe (24 runs), the rewritten T-37-18 and dangling rows, the read-sites root-chain cells, mutation (a) |
| readTextOrThrow (board, Done archive, progress file, progress archive, the re-reads under io.read) | entryPresence | rootChainPresence, leaf `entry`; the file rules are kept | read-sites file cells and the re-read rows, the census, mutation (c) |
| insideRoot (realDirectoryOrNull, the post-mkdir check) | hand-written boundary copy | deleted; the post-mkdir check uses isWithin | census, mutation (b) |
| Hand-written prose: the header (line 53), the realDirectoryOrNull JSDoc and the readTextOrThrow JSDoc | named entryPresence | names rootChainPresence | prose criterion (0) |
| The generated comment in readRegularFileOrNull (`asks entryPresence first`) | context-io's text about its own walk | unchanged, regenerated as is. It is a comment, so the syntax-tree census does not count it, and the whole-file case asserts it is present as its premise | none (not a code reference) |
| `<top>` realpath of the root; the post-mkdir realpath (SR-8) | unchanged | unchanged | runnable-exit-contract SR-8 |
| unlinkSync, renameSync, atomicWrite on the planned paths | writes under a verified chain | unchanged | EIO rows |

## RED runs

**Task 1, against the plan 37-35 build (60f6cad9), `-t "D-20"`: 24 failed and 4 passed.** The 4 that passed were the premise, the two controls and the run count. Per position and link shape, the outcome was the same in both modes except where noted:

| Position | Link to an empty outside directory | Link to the moved content outside | Link to the moved content in the root | Dangling link |
|----------|------------------------------------|-----------------------------------|---------------------------------------|---------------|
| `memory-bank` | exit 2, `Error: the state directory memory-bank/plans does not exist; install grugops first. Nothing was rolled.` (the measured CR-05 shape) | exit 2, `the state directory memory-bank/plans resolves outside the repository root` | **exit 0**: `--dry-run` planned, write mode rolled through the link (`MOVED   ABC-021` ...) | exit 2, `cannot be inspected: a symbolic link on the path has a target that cannot be reached: "<absolute path>"` |
| `memory-bank/plans` | exit 2, `resolves outside the repository root` | exit 2, `resolves outside the repository root` | **exit 0**, rolled through | exit 2, `it is a symbolic link whose target cannot be reached (ENOENT)` |
| `memory-bank/plans/archive` | exit 2, `the archive directory memory-bank/plans/archive resolves outside the repository root` | the same | **exit 0**, rolled through: `Rolled 5 Done row(s) ... to the top of memory-bank/plans/archive/board-done.md (a new file)` and `Rolled 2 progress entry(ies) ...`, both archives written at the in-root link target | exit 2, `it is a symbolic link whose target cannot be reached (ENOENT)` |

**Task 2, against the Task 1 build (8f4b1352), `-t "IN-13 census|above the repository root"`: 2 failed and 2 passed.**
- Both above-root cases passed, as expected for a control: every runnable resolves the root with realpath.
- Both census cases failed. The hand-written census failed on five clauses:
  - `an identifier named insideRoot`: 2 nodes, the declaration and the post-mkdir call `insideRoot(made)`. The plan expected one declaration and two calls; the realDirectoryOrNull call had already left with Task 1.
  - `an identifier named entryPresence`: 1 node, `entryPresence(path)` in readTextOrThrow. The plan expected two calls at bf3b0038; the realDirectoryOrNull call had left with Task 1.
  - `state-roll's root-chain positions`: only `realDirectoryOrNull`.
  - `a startsWith call whose argument mentions root`: `real.startsWith(root + nodePath.sep)`.
  - `the check after the archive directory is created asks the generated isWithin`.
- The whole-file census failed on 2 nodes: the generated `export function entryPresence(path)` and the call in readTextOrThrow.

## GREEN

- **After Task 1:** build, typecheck, freshness:runnable-embeds (3 targets) and freshness:hook-manifest all passed. state-roll.test.ts, read-sites.test.ts and runnable-exit-contract.test.ts: 614 passed. `-t "D-20"`: 33 passed and 0 failed. That is the premise, the 24 linked runs, the 2 controls, the run count, the rewritten T-37-18 and the 4 rewritten directory dangling rows. On darwin as non-root, no cell was skipped (asserted). The tracer gate (`end-of-phase`, automated-only verify) was met by re-running that verify; no checkpoint.
- **After Task 2:** state-roll.test.ts, read-sites.test.ts, runnable-exit-contract.test.ts and generate-runnable-embeds.test.ts: 641 passed. `-t "IN-13 census|above the repository root"`: 4 passed and 0 failed. `-t "D-20"`: 35 passed.

## Rewritten tests (old expectation to new)

| Test | Old expectation | New expectation |
|------|-----------------|-----------------|
| state-roll.test.ts T-37-18 "a symlinked archive directory pointing outside the repository root ..." (renamed "... is refused as a root-chain link before any write (T-37-18; plan 37-36, D-20)") | exit 2, `the archive directory memory-bank/plans/archive resolves outside the repository root` | exit 2, `the archive directory memory-bank/plans/archive cannot be used: memory-bank/plans/archive <ROOT_CHAIN_LINK_REFUSAL>`; the outside directory is still empty |
| state-roll.test.ts plan 37-30 dangling rows "the archive directory" and "the state directory", "the refusal carries ..." (both modes) | stderr matches the unreachable-target reason | stderr contains `<rel> <ROOT_CHAIN_LINK_REFUSAL>`. A new row field, `reason: "root-chain"`, holds this; the file rows keep `unreachable` |
| state-roll.test.ts plan 37-30 "a dangling memory-bank ... exit 2 by the link, never \"does not exist\"" (both modes; the title gains "with the root-chain reason") | stderr matches the unreachable-target reason | stderr contains `memory-bank <ROOT_CHAIN_LINK_REFUSAL>`; still never "does not exist" and the tree is unchanged |
| read-sites.test.ts SHAPE_POSITIONS state-roll `realDirectoryOrNull#0` (12 cells) | kind `directory-follow`: a link to a directory was followed and had to equal the unplanted run | kind `root-chain`: every link is refused with `<path> <ROOT_CHAIN_LINK_REFUSAL>`, exit 2, `Nothing was rolled.` |
| read-sites.test.ts "the roll's re-reads under the absence owner" (renamed "... under the root-chain owner") and the ENOENT re-read rows | site `entryPresence:lstatSync#0` under io.read | site `rootChainPresence:lstatSync#0` under io.read; the assertions are unchanged |

No test was deleted or weakened. The file-position rows of plans 37-30 and 37-31 are unchanged in outcome: the dangling rows at the Done archive, the progress file and the progress archive, and the read-sites file cells at the board, the progress file and both archives.

## read-sites.test.ts: removed rows and their replacements

| Removed (key, via) | Task 1 | Task 2 (final) |
|--------------------|--------|----------------|
| state-roll `entryPresence:lstatSync#0 via realDirectoryOrNull#0` | `rootChainPresence:lstatSync#0` (one caller, so no via) | `rootChainPresence:lstatSync#0 via realDirectoryOrNull#0` |
| state-roll `entryPresence:statSync#0 via realDirectoryOrNull#0` | `rootChainPresence:statSync#0` | `rootChainPresence:statSync#0 via realDirectoryOrNull#0` |
| state-roll `entryPresence:realpathSync#0 via realDirectoryOrNull#0` | `rootChainPresence:realpathSync#0` | `rootChainPresence:realpathSync#0 via realDirectoryOrNull#0` |
| state-roll `entryPresence:lstatSync#0 via readTextOrThrow#0` | `entryPresence:lstatSync#0` (one caller left) | `rootChainPresence:lstatSync#0 via readTextOrThrow#0` |
| state-roll `entryPresence:statSync#0 via readTextOrThrow#0` | `entryPresence:statSync#0` | `rootChainPresence:statSync#0 via readTextOrThrow#0` |
| state-roll `entryPresence:realpathSync#0 via readTextOrThrow#0` | `entryPresence:realpathSync#0` | `rootChainPresence:realpathSync#0 via readTextOrThrow#0` |
| ENOENT_EXEMPT `state-roll entryPresence:lstatSync#0 via realDirectoryOrNull#0` | `state-roll rootChainPresence:lstatSync#0` | `state-roll rootChainPresence:lstatSync#0 via realDirectoryOrNull#0` (same reason, plus "the root-chain owner answers absent only beneath real directories") |
| ENOENT_EXEMPT `state-roll entryPresence:lstatSync#0 via readTextOrThrow#0` | `state-roll entryPresence:lstatSync#0` | `state-roll rootChainPresence:lstatSync#0 via readTextOrThrow#0` (same reason) |
| SR_PRESENCE_CALLERS | removed | SR_ROOT_CHAIN_CALLERS `["realDirectoryOrNull#0", "readTextOrThrow#0"]` |

- **Pins, with dated history lines:**
  - State-roll read sites went from 10 to 13 in Task 1, then back to 10 in Task 2. The trace-render and state-check counts stay 15 and 18.
  - ENOENT_OWNERS state-roll is `[entryPresence, readRegularFileOrNull, rootChainPresence]` after Task 1 and `[readRegularFileOrNull, rootChainPresence]` after Task 2.
  - ENOENT_COMPARISONS state-roll is 3 after Task 1 and 2 after Task 2.
  - ENOENT_EXEMPT_SIZE stays 10, and owner callers stay 6/6/2.
- **Exemption key regex:** Task 1 widened it to accept an entryPresence key without a via, because entryPresence had one caller then. Task 2 restored it.
- **Unchanged:** SHAPE_ROW_COUNT stays 185 and UNREACHED_SITES stays 0. Both equalities still check both directions. read-sites.test.ts gave 519 passed after each task.

## Mutation proofs (working tree only)

Before each mutation, byte copies of the eight affected files were taken. Each revert restored those copies and then rebuilt. `cmp` showed every file equal to its copy, and the embeds and hook manifest were fresh. None was committed.

- **(a) Task 1: realDirectoryOrNull asks with leaf `entry`** (follows a link at the last component). 24 red, as follows. The 8 `memory-bank` link runs stayed green, because `memory-bank` is a middle component of every query.
  - 16 runs of the D-20 describe went red, among them **both in-root archive-link runs**: 8 at `memory-bank/plans/archive` and 6 at `memory-bank/plans`. The 2 in-root `memory-bank/plans` runs stayed green, because the archive query meets `memory-bank/plans` as a middle link and refuses it there.
  - The rewritten T-37-18.
  - The 4 rewritten directory dangling rows.
  - 5 read-sites root-chain cells, at the archive directory and at `memory-bank/plans`.
- **(b) Task 2: the hand-written root-prefix test restored at the post-mkdir check** (`made === root || made.startsWith(root + nodePath.sep)`). The hand-written census went red on 2 clauses: "a startsWith call whose argument mentions root" and "the check after the archive directory is created asks the generated isWithin". The other 3 cases passed.
- **(c) Task 2: `entryPresence` back in the state-roll row and called from readTextOrThrow.** Both censuses went red:
  - hand-written: `line 140: entryPresence(path)`
  - whole file: the generated declaration and the call
- **(d) Task 2: `entryPresence` back in the state-roll row only, with no caller.** Only the whole-file census went red, on `line 1076: export function entryPresence(path) {`. The hand-written census passed. The generated comment (`asks entryPresence first`) was present in every run, and was counted once by text in (d), and it never turned the census red.

## Regression run (Task 2 verify, once)

- **Run:** the derived subset was 50 test files (`git grep -l` over the plan's patterns, e2e excluded), run after the Task 2 commit on a clean tree with `npx vitest run --exclude '**/scripts/e2e/**'` on one worker in 922 s. 4 files failed; 14 tests failed, 5,453 passed and 1 was skipped.
- **Baseline failures (10, all in 37-BASELINE.md):**
  - canonical-corpus provenance (1)
  - context-io-writer-set 31-14 (2)
  - context-io 31-23 PROBE 5 (1)
  - context-io 31-29: PREMISE, DIRECTION 1 and 2, SEEDED, CONVERSE 1 and 2 (6)
- **Failures outside the baseline (4), caused by this plan and fixed in `050fc2b0`:** scripts/validate.test.ts "exactly ONE ticket-frontmatter reader exists in scripts/":
  - "TICKET_FRONTMATTER_READER_COUNT is 1"
  - "the exemption set has exactly the DERIVED members"
  - "with NO plant, the carrier count is exactly one"
  - "ADJACENCY ..."

  The census counts a file as a ticket-frontmatter carrier when its string literals name both ticket keys. state-roll.test.ts already named `column` in an existing title. The two new above-root titles said "the same status ...". The titles now say "exit code"; no assertion changed. After the fix, `npx vitest run scripts/validate.test.ts` gave 194 passed, and state-roll.test.ts gave 88 passed.

These gates all exit 0:
- build, typecheck, freshness (87 outputs), freshness:runnable-embeds and freshness:hook-manifest
- check-foundation-guards: `ALL CHECKS PASSED`
- check-state-paths, after Deviation 2
- check-nul-bytes
- `node scripts/runnable-ref/state-check.js .`: `No findings.`

The only vitest processes running afterwards belonged to another project (grugops-examples/wt-se-lane-ABC-212) and were left alone.

## Decisions Made

- readTextOrThrow asks the owner with `rel` and still reads `path`. Its callers compose `path` from a directory whose chain the owner has already verified link-free, so both name the same file. Its reads stay where they were.
- The census locates "the check after the roll creates the archive directory" as the one top-level `if` whose body calls mkdirSync. It asserts that exactly one such block exists before it asks that block for isWithin.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] abs() deleted in Task 1**
- **Found during:** Task 1, step 3
- **Issue:** realDirectoryOrNull was abs()'s only caller. Once it passed `rel` to the owner, `tsc` (noUnusedLocals) failed the build.
- **Fix:** removed the dead helper.
- **Files modified:** scripts/runnable-ref/state-roll.ts (+ .js)
- **Commit:** 8f4b1352

**2. [Rule 1 - Bug] The Task 1 CONTROL title tripped check-state-paths**
- **Found during:** Task 2 gates
- **Issue:** The title "the roll plans (exit 0)" spelled the pre-v3 state root `plans` as a word, which check-state-paths counts as a segment site outside its allow-list. Task 1's verify does not run that gate, so commit 8f4b1352 went in with check-state-paths failing.
- **Fix:** reworded the title to "the roll is planned and nothing is written".
- **Commit:** 7a990c31

**3. [Rule 1 - Bug] The above-root titles made state-roll.test.ts a second ticket-reader carrier**
- **Found during:** the regression run (above)
- **Fix:** reworded both titles; the assertions are unchanged.
- **Commit:** 050fc2b0

**4. [Plan premise] Measured RED clause counts and the mutation (a) span**
- The plan expected the Task 2 census RED to find insideRoot declared once and called twice, and entryPresence called twice, as at bf3b0038. Task 1 had already removed both realDirectoryOrNull calls, so the measured RED was 2 insideRoot nodes and 1 entryPresence call, as recorded above.
- Mutation (a) left the `memory-bank` runs and the in-root `memory-bank/plans` runs green: those positions are middle components of a later query. The in-root archive-link runs went red as the plan expected.

**5. [Plan premise] Task 1 interim state of read-sites**
- In Task 1, entryPresence still had one caller (readTextOrThrow), so its rows had no via. The ENOENT key regex was widened for that interim and restored in Task 2. The interim pins were 13 sites and 3 ENOENT comparisons.

---

**Total deviations:** 5: 1 blocking, 2 bugs found by gates or the regression run and fixed in this plan's files, and 2 premises recorded as measured. **Impact:** no file outside files_modified was edited. The conditional scripts/generate-runnable-embeds.test.ts was not edited; it passed unchanged.

## For 37-39's deferred-items.md

- Task 1's commit 8f4b1352 went in with check-state-paths failing (Deviation 2). The plan's Task 1 `<verify>` does not run that gate. Later tracer verifies could include it.
- The ticket-reader census in validate.test.ts counts test titles that name a ticket key. Any runnable test file that already says "column" will trip it the next time a title says "status".

## Issues Encountered

- See Deviations 2 and 3. Both were caught before the plan closed and fixed by name.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 37-37. All three runnables now ask the root-chain owner for every state path, and none keeps a hand-written boundary copy.
- 37-39 needs the deferred-items lines above and a full non-e2e run on a clean tree.

## Self-Check: PASSED

- FOUND: 8f4b1352, 7a990c31, 050fc2b0 (all ancestors of HEAD)
- FOUND: scripts/runnable-ref/state-roll.ts, scripts/runnable-ref/state-roll.js, scripts/runnable-ref/state-roll.test.ts, scripts/runnable-ref/read-sites.test.ts, scripts/generate-runnable-embeds.ts, scripts/generate-runnable-embeds.js
- Prose criterion: `awk ... state-roll.ts | grep -c entryPresence` prints 0

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
