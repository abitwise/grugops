---
phase: 37-overview-board-per-file-records-and-budgets
plan: 34
subsystem: testing
tags: [read-1, cr-05, d-20, in-13, root-chain, symlink, trace-render, boundary, census]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "rootChainPresence, RootChainPresence, rootChainOf and the exported isWithin, embedded into trace-render (37-33)"
provides:
  - "trace-render's pre-write check and readText on rootChainPresence(root, rel, \"entry\"); relOfPath on the generated isWithin; no hand-written boundary copy left in trace-render"
  - "IN-13 census over trace-render's hand-written part (syntax tree), the tracer row, the backslash-name row and the above-root control"
  - "read-sites rows re-derived: TR_ROOT_CHAIN_CALLERS, the ENOENT exemptions keyed on the root-chain owner's lstat"
affects: [37-35, 37-36, 37-38, 37-39]

actuals:
  tokens: 10858
  tasks: 2
  commits: 2
plan_head_before: c5a28f06c645fabe7a96bd8e42e0d5082062de03
plan_head_after: f04d09e4bd0d1e075eea4930a2e3121e4efee0cf

tech-stack:
  added: []
  patterns:
    - "Each position calls the root-chain owner itself (so READ-1 rows stay one per position); one mapping function (regularFileAt) turns the owner's answer into a refusal"
    - "A census written with expect.soft names every clause a source breaks in one run"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts

key-decisions:
  - "The pre-write check and readText each call rootChainPresence themselves and share one mapping, regularFileAt(rel, presence), so the READ-1 rows keep their two positions (<top>#0, readText#0) instead of collapsing into one helper's"
  - "relOfPath refuses by name a listed trace-directory name that rootChainOf refuses (a backslash), so it never reaches the owner as an unexpected throw (exit 2 by name, not the backstop)"

patterns-established:
  - "IN-13 census shape: no identifier node named like the deleted copy, no call of the old owner, the new owner's first argument is the resolved root, no startsWith on the root, the relativizer calls isWithin"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A dangling link at memory-bank/plans/traceability/ABC-1.md after a render: write and --check exit 2, stdout empty, stderr exactly the owner's reason line, treeDigest unchanged (the tracer row, now answered by rootChainPresence)"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#READ-1 round 2: the tracer row on the root-chain owner (plan 37-34, D-20)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The five shapes (dangling link, link to a regular file, link to a directory, directory, FIFO) at the index, a planned trace file and an extra trace file are refused by name in both modes, nothing written (plan 37-31 shape cells, unchanged in outcome, now under rootChainPresence)"
    requirement: "SPLIT-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (519 passed)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#READ-1 round 2: a dangling link at a planned trace file or at the index is refused by name"
        status: pass
    human_judgment: false
  - id: D3
    description: "IN-13 census: the hand-written part of trace-render.ts has no insideRoot node, no entryPresence call, no startsWith call on root; every rootChainPresence call passes root first, from realDirectoryOrNull, the pre-write check and readText; relOfPath calls isWithin. Red under mutations (a), (b) and (c)"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/trace-render.test.ts#IN-13 census: trace-render keeps no hand-written boundary copy"
        status: pass
    human_judgment: false
  - id: D4
    description: "A root path through a link above the repository root: trace-render write 0, --check 0 fresh, state-check 0 fresh, each output equal to the real-path run"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#D-20: a root path through a link above the repository root still renders"
        status: pass
    human_judgment: false

duration: 26min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 34: The Renderer's File Positions on the Root-Chain Owner Summary

**trace-render's pre-write check and readText now ask rootChainPresence(root, rel, "entry"), relOfPath asks the generated isWithin, and the renderer keeps no boundary test of its own; a syntax-tree census holds this and goes red under each of three mutations, and a root path through a link above the repository root still renders and checks fresh**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-24T11:19:42Z
- **Completed:** 2026-10-24T11:45:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- The pre-write loop calls `rootChainPresence(root, rel, "entry")` for each planned path. readText calls it for each compared path (the planned paths and an extra trace file). One function, `regularFileAt(rel, presence)`, maps the answer: absent is false; unreadable is `<rel> cannot be inspected: <reason>.`; link is `<rel> cannot be used: <reason>.`; outside is `<rel> resolves outside the repository root, so nothing was written.`; and a present entry that is not a regular file goes to notRegular(rel).
- relOfPath decides the boundary with `isWithin(path, root)` and `nodePath.relative`, joined with `/`. A path that is not below the root is could-not-run by name. trace-render has no hand-written boundary copy left.
- The header's THE ROOT IS A BOUNDARY paragraph was rewritten for D-20 to cover the context roots, the state directory, the trace directory, a trace file and the index. THE D-12 CONTRACT's exit 2 list now names a symbolic link on the path to a trace file or the index, and a listed name the state layout cannot hold.
- Two tests added: the tracer row and the IN-13 census. A backslash-name row was also added (see Deviations). The above-root control and three mutation proofs are recorded below.

## Task Commits

1. **Task 1: The renderer's file positions on the root-chain owner, its boundary copy deleted (tracer)** - `9e256cad` (fix)
2. **Task 2: The above-root control and the boundary mutation proofs** - `f04d09e4` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## Class sites: READ-1 / CR-05 and IN-13 in trace-render (final state)

Search over the hand-written part (after `// </runnable-embeds>`): `entryPresence(` 0, `rootChainPresence(` 3, `insideRoot` 0, `isWithin(` 1, `startsWith(` 2 (argv `--` and the `${TRACE_DIR_REL}/` test in the write section, neither on `root`), `relOfPath(` 3, `realpathSync` 1 (the root, once).

| Site (by name) | After 37-33 | After this plan | Test |
|----------------|-------------|-----------------|------|
| realDirectoryOrNull (both context roots, the state directory, the trace directory) | rootChainPresence, leaf `directory` | unchanged | 37-33 CR-05 rows |
| the pre-write check (`<top>`, each planned path) | entryPresence | rootChainPresence(root, rel, "entry") through regularFileAt | tracer row, trace-position rows, read-sites `<top>#0` cells, census, mutation (c) |
| readText (the planned paths, an extra trace file) | entryPresence | rootChainPresence(root, relOfPath(path), "entry") through regularFileAt | read-sites `readText#0` cells, census |
| insideRoot | already deleted by 37-33 (dead code) | absent; census holds it | census, mutation (b) |
| relOfPath | `${root}/` prefix test | isWithin + nodePath.relative, `/`-joined; a name rootChainOf refuses is could-not-run by name | census, mutation (a), backslash-name row |
| `<top>` realpath of the root; listDir, mkdirSync, unlinkSync, atomicWrite | root resolved once; writes under a verified chain | unchanged | read-sites EIO rows |

## RED run (Task 1, step 1, against the plan 37-33 build at c5a28f06)

The census was written with `expect.soft`, so one run names every clause that fails:
`npx vitest run scripts/runnable-ref/trace-render.test.ts -t "IN-13 census|tracer row"` gave 1 failed, 1 passed. The census failed on four clauses:

- `a call of the round-2 owner`: `["entryPresence(abs(rel))", "entryPresence(path)"]` (the pre-write check and readText)
- `the renderer's root-chain positions`: `["realDirectoryOrNull"]`, expected `["<top>", "readText", "realDirectoryOrNull"]`
- `a startsWith call whose argument mentions root`: `["path.startsWith(\`${root}/\`)"]` (relOfPath)
- `relOfPath asks the generated isWithin`: relOfPath called `["startsWith", "slice"]`

The clause "no identifier named insideRoot" already passed on the 37-33 build. The plan expected it to fail ("at bf3b0038 the hand-written part declares insideRoot once and calls it once"), but plan 37-33 had already deleted insideRoot, because tsc noUnusedLocals made it a compile error once it had no caller (37-33 Deviation 1). So the census is red at c5a28f06 on the other four clauses.

**The tracer row passed on the 37-33 build.** entryPresence and rootChainPresence give the same reason text for a dangling link at the last component: `Error: memory-bank/plans/traceability/ABC-1.md cannot be inspected: it is a symbolic link whose target cannot be reached (ENOENT). The trace render did not run.`. So the 37-33 build printed exactly the line the row now asserts. The tracer row shows the outcome stayed the same. It cannot tell which owner answered; the census does that.

## GREEN

After Task 1: `npm run build && npm run typecheck && npm run -s freshness:runnable-embeds && npx vitest run scripts/runnable-ref/trace-render.test.ts scripts/runnable-ref/state-check.test.ts scripts/runnable-ref/read-sites.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts` gave 4 files and 750 tests passed. The embed regions did not change (`Runnable embeds fresh: 3 target(s)`). The tracer row passed in the commit-time run. The plan's tracer gate (interactive, `end-of-phase`, automated verify) was met by that same run; no checkpoint.

## read-sites.test.ts: removed rows and their replacements

| Removed (key, via) | Replacement |
|--------------------|-------------|
| trace-render `entryPresence:lstatSync#0 via <top>#0` | trace-render `rootChainPresence:lstatSync#0 via <top>#0` |
| trace-render `entryPresence:statSync#0 via <top>#0` | trace-render `rootChainPresence:statSync#0 via <top>#0` |
| trace-render `entryPresence:realpathSync#0 via <top>#0` | trace-render `rootChainPresence:realpathSync#0 via <top>#0` |
| trace-render `entryPresence:lstatSync#0 via readText#0` | trace-render `rootChainPresence:lstatSync#0 via readText#0` |
| trace-render `entryPresence:statSync#0 via readText#0` | trace-render `rootChainPresence:statSync#0 via readText#0` |
| trace-render `entryPresence:realpathSync#0 via readText#0` | trace-render `rootChainPresence:realpathSync#0 via readText#0` |
| trace-render `rootChainPresence:lstatSync#0` (no via; one caller in 37-33) | trace-render `rootChainPresence:lstatSync#0 via realDirectoryOrNull#0` |
| trace-render `rootChainPresence:statSync#0` | trace-render `rootChainPresence:statSync#0 via realDirectoryOrNull#0` |
| trace-render `rootChainPresence:realpathSync#0` | trace-render `rootChainPresence:realpathSync#0 via realDirectoryOrNull#0` |
| ENOENT_EXEMPT `trace-render entryPresence:lstatSync#0 via <top>#0` | `trace-render rootChainPresence:lstatSync#0 via <top>#0` (same reason) |
| ENOENT_EXEMPT `trace-render entryPresence:lstatSync#0 via readText#0` | `trace-render rootChainPresence:lstatSync#0 via readText#0` (same reason) |
| ENOENT_EXEMPT `trace-render rootChainPresence:lstatSync#0` | `trace-render rootChainPresence:lstatSync#0 via realDirectoryOrNull#0` (same reason) |

TR_PRESENCE_CALLERS is now the three entryPresence callers (the walk, listContextTasks, readTaskNoteRefs). The new TR_ROOT_CHAIN_CALLERS is `["realDirectoryOrNull#0", "<top>#0", "readText#0"]`. Pins are unchanged, with dated history lines: read sites 15/18/10 (only the pairs moved, -6 and +6); ENOENT_EXEMPT_SIZE 10; ENOENT_COMPARISONS 3/3/2; owner callers 6/6/2. The distinct (runnable, via) set is the same, so SHAPE_POSITIONS is unchanged and `<top>#0` and `readText#0` keep the `file` kind. UNREACHED_SITES stays 0, and both equalities stay two-sided. read-sites.test.ts: 519 passed.

## Rewritten tests (old expectation to new)

| Test | Old expectation | New expectation |
|------|-----------------|-----------------|
| runnable-exit-contract.test.ts TR-6 premise | `callingSites(trace-render.js, "rootChainPresence")` scopes equal `["realDirectoryOrNull"]` | the sorted scopes equal `["<top>", "readText", "realDirectoryOrNull"]`; the fault's via is the one realDirectoryOrNull call. The EIO assertions (exit 2 naming the archive root, `(EIO)`, tree unchanged) are unchanged |

No case asserted a reason text at a trace-render file position that the owner now words differently (the dangling-link reason is the same), so state-check.test.ts was not edited. No test was deleted or weakened.

## Above-root control (Task 2)

`D-20: a root path through a link above the repository root still renders` is a scratch directory S holding `real/repo` (board, NFR catalog, progress file, marker, one note in each context root) and a link `S/alias -> S/real`. Through `S/alias/repo`:

- The first render exits 0, writes 2 tasks, has an empty stderr, and its output equals a twin repository rendered through its real path. The two trees' digests are equal.
- A second render through the alias equals the real-path run (`0 file(s) written, 0 file(s) removed`).
- `--check` through the alias exits 0 with `The trace is fresh` and equals the real-path run.
- state-check through the alias exits 0 with `The trace is fresh` and equals the real-path run.
- The tree did not change after the first render.

It passed before Task 2's commit, as expected, on the Task 1 build. With the committed trace-render.js swapped for the c5a28f06 copy in the working tree only, it also passed, because every runnable resolves the root with realpath. It is the control D-20 asks for, not a RED test. darwin, non-root: no skip.

## Mutation proofs (working tree only, each reverted with `git checkout --`; .ts byte-equal to the pre-mutation copy afterwards, then rebuilt)

- **(a) restore the root-prefix test in relOfPath** (`const rel = path.startsWith(\`${root}/\`) ? path.slice(root.length + 1) : path;`): census red on 2 clauses, "a startsWith call whose argument mentions root" and "relOfPath asks the generated isWithin".
- **(b) re-declare a hand-written insideRoot and call it from relOfPath** in place of isWithin: census red on 3 clauses, "an identifier named insideRoot" (2 nodes: the declaration and the call), "a startsWith call whose argument mentions root" and "relOfPath asks the generated isWithin".
- **(c) make the pre-write check ask entryPresence again** (the 37-29 loop): census red on 2 clauses, "a call of the round-2 owner" (`entryPresence(abs(rel))`) and "the renderer's root-chain positions" (`["readText", "realDirectoryOrNull"]`).

`git status --porcelain scripts/runnable-ref` was empty after the Task 2 commit. No mutation was committed.

## Regression run (Task 2 verify, once)

The derived subset was 50 test files (`git grep -l` over the plan's patterns, e2e excluded), run with `npx vitest run --exclude '**/scripts/e2e/**'` on one worker in 15m02s. 3 files failed and 47 passed; 10 tests failed, 5370 passed and 1 skipped. Every failure is in 37-BASELINE.md:

- canonical-corpus provenance (1)
- context-io-writer-set 31-14: "every derived decline clause is enumerated" and "the disposition document exists" (2)
- context-io 31-23 PROBE 5: "WAVE-2 verdicts are QUOTED" (1)
- context-io 31-29: "a SEEDED undispositioned member", CONVERSE 1, CONVERSE 2, DIRECTION 1, DIRECTION 2 and PREMISE (6)

No new failure.

These gates all exit 0: build, typecheck, freshness, freshness:traceability, freshness:runnable-embeds, freshness:hook-manifest, check-foundation-guards, check-state-paths, check-nul-bytes, and `node scripts/runnable-ref/state-check.js .`. No orphaned grugops vitest worker remained after any run.

## Decisions Made

- Each position calls the root-chain owner itself, and regularFileAt maps the answer. A single helper that called the owner would have merged `<top>#0` and `readText#0` into one READ-1 position, and the plan pins them as two.
- relOfPath also treats the root itself as not below the root. The trace model never composes it, and rootChainOf refuses an empty path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A backslash in a listed trace-directory name reached the unexpected-throw backstop**
- **Found during:** Task 1, step 2
- **Issue:** readText now hands the owner the path relative to the root, and rootChainOf throws for a name holding a backslash, which the state-layout ENCODING rule refuses. An owned extra trace file named `a\b.md` therefore exited 2 through the backstop: `the trace render stopped unexpectedly (context-io: the state path ... it holds a backslash)`. On the 37-33 build the same tree gave `--check` exit 1 `EXTRA memory-bank/plans/traceability/a\b.md`, and the write mode removed the file.
- **Fix:** relOfPath runs the generated rootChainOf on the relative path and refuses by name: `<rel> cannot be used: <rootChainOf's message>.`, exit 2, nothing written. A new row, "a listed trace-directory name the state layout cannot hold is refused by name (plan 37-34)", fails on the 37-33 build and passes now. It is skipped on win32, where a backslash is a separator (Windows is out of scope).
- **Outcome change to triage:** for this one name shape the renderer now refuses (exit 2) where it used to report or remove the file. state-check still reads such a file through its own relativizer until plan 37-35, so the two runnables can disagree on it for now. This is outside D-19's item list, so plan 37-39 Task 3 should record it in deferred-items.md for human triage (keep the refusal, or have state-check refuse the same way in 37-35).
- **Files modified:** scripts/runnable-ref/trace-render.ts (+ .js), scripts/runnable-ref/trace-render.test.ts
- **Committed in:** 9e256cad

**2. [Rule 3 - Blocking] runnable-exit-contract.test.ts TR-6 premise (conditional file, edited)**
- **Found during:** Task 1, step 5
- **Issue:** TR-6 asserted that realDirectoryOrNull is the only caller of rootChainPresence. Now there are three callers, so the premise failed. It was not a reason-text case, but this file is in the plan's conditional list.
- **Fix:** the premise names the three callers, and the fault stays scoped to realDirectoryOrNull's call. The case's assertions are unchanged.
- **Committed in:** 9e256cad

**3. [Plan premise] insideRoot was already gone; the tracer row cannot tell the two owners apart**
- The plan expected the census RED to include a declared insideRoot, and the tracer row to print "the round-2 owner's reason" as something different. Both differences are recorded as measured above. The census is red at c5a28f06 on four other clauses, and the tracer row's text is the same under both owners.

---

**Total deviations:** 3 (1 bug fix, 1 blocking test premise, 1 plan premise recorded as measured). **Impact:** no scope widening beyond the backslash refusal, which is flagged for triage.

## Issues Encountered

- Under this repository's vitest configuration, `console.log` output from a passing case was not shown. The tracer row's output is therefore recorded from its exact-match assertion (`toBe(expected)`), not from a printed line.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 37-35: state-check's locate, its insideRoot and its readTraceText relativizer go onto the owner. The above-root describe is in place for 37-35 to extend with state-check `--json`.
- For 37-39 Task 3: the backslash-name outcome change (Deviation 1) goes in deferred-items.md.

## Self-Check: PASSED

- FOUND: 9e256cad, f04d09e4 (both ancestors of HEAD)
- FOUND: scripts/runnable-ref/trace-render.ts, scripts/runnable-ref/trace-render.js, scripts/runnable-ref/trace-render.test.ts, scripts/runnable-ref/read-sites.test.ts, scripts/runnable-ref/runnable-exit-contract.test.ts

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
