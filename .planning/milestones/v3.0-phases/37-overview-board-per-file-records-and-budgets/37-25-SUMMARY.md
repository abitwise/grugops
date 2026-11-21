---
phase: 37-overview-board-per-file-records-and-budgets
plan: 25
subsystem: testing
tags: [read-1, fault-injection, trace-render, state-check, state-roll, typescript-compiler-api, d-17]

requires:
  - phase: 37-20
    provides: the fault-injection harness (FS_READ_FNS, runFaulted, treeDigest, scriptUrl, the site-not-via count) and the EXIT-1 handlers
  - phase: 37-24
    provides: state-check's sibling stamp read (runnableSkewFindings), the last read site added before this plan
provides:
  - "READ-1 closed for the three host runnables by test: every node:fs read site, derived from the committed .js and counted (16, 19, 11), is failed with EIO under every calling call expression in every mode that reaches it (162 rows), and each failure is exit 2 by name or an added finding, never a pass and never a write"
  - "scripts/fault-inject.test-support.ts: deriveReadSites, callingSites, classifiedFsCalls, enclosingName, FS_OTHER_FNS"
  - "state-check: a failed realpath of its own directory is a runnable-version-skew finding by name; it was read as a directory outside the root, with exit 0 on a clean tree"
affects: [37-26, 37-27, phase-38]

actuals:
  tokens: 15224
  tasks: 2
  commits: 3
plan_head_before: 0fe96d62974e88706b0eda925f71d1f761e016ad
plan_head_after: a0dae3a2579279df1d89eada36fac1b2e6169c1d

tech-stack:
  added: []
  patterns:
    - "Read sites are derived from program text by the TypeScript compiler (createSourceFile only), through the file's own node:fs bindings; any shape the derivation cannot account for throws with file and line"
    - "A shared reader is failed once per calling call expression; a via is named `<scope>#<ordinal>` in the table and its line is derived at test time, so the table survives unrelated line moves"
    - "An exit-1 row must add a finding line the unfaulted run does not print; an exit-2 row must be refused by name, not by the unexpected-throw backstop"

key-files:
  created:
    - scripts/runnable-ref/read-sites.test.ts
  modified:
    - scripts/fault-inject.test-support.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js

key-decisions:
  - "A row that exits 1 must ADD a finding line to the unfaulted run's stdout. The plan's state-check fixture (progress over budget) and trace-render's --check fixture (an extra trace file) are exit 1 unfaulted, so 'exit 1 with a finding line' alone would pass with no fault handled"
  - "An exit-2 row must not reach the 37-20 unexpected-throw handler: a read failure is expected and is refused by name where it happens. Measured first: 0 of 162 rows reached the handler"
  - "state-check's unresolvable own directory is a named finding, not exit 2: the siblings are still compared, each named by its absolute path"
  - "callingSites counts a property-access call whose member is the function's name (`io.readText(...)`) as a direct entry, as the plan words it, so trace-render's readText is failed separately under the index read, the extra-file read and the outer call"

patterns-established:
  - "Two-sided table over a derived set: pin the derived count, hold the hand-written rows equal to the derived keys and to the derived (key, via) pairs, and run every mode a row omits to prove it fires nothing there"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "Every read site of trace-render.js, state-check.js and state-roll.js is derived from the committed .js through its node:fs bindings, counted against pins 16, 19 and 11, and the table equals the derived keys and (key, via) pairs both ways; existsSync is never a site; every node:fs name is classified two-sided; trace-model.js, state-rules.js and trace-freshness.js have no site"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 sites are derived and counted, and the table equals the derived set (plan 37-25, D-17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each of the 162 rows fails its site with EIO under its via in its mode: the fault fired; exit 1 or 2; exit 2 has an empty stdout and is refused by name; exit 1 adds a finding line; no V8 frame on stderr; the repository's treeDigest is unchanged. Each mode a row omits fires nothing (5 rows)"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 table: every derived read site fails as could-not-run or a named finding, never a pass or a write"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 table: a mode a row does not list reaches no fault there"
        status: pass
    human_judgment: false
  - id: D3
    description: "deriveReadSites and callingSites on synthetic programs: namespace and aliased named imports, keys stable under line moves, a read function or namespace used as a value refused by line, direct, split-over-lines, object-literal and plain-argument entries, two calls in one scope, a stored function refused by line, an io-member call direct and a self-call excluded"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#deriveReadSites and callingSites on synthetic programs (plan 37-25)"
        status: pass
    human_judgment: false
  - id: D4
    description: "state-check: a failed realpath of its own directory is a runnable-version-skew FINDING naming the directory (exit 1 under the marker); before the fix a clean marker tree gave exit 0 and `No findings.` with the fault fired"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 table: ... > state-check text: runnableSkewFindings:realpathSync#0"
        status: pass
    human_judgment: false
  - id: D5
    description: "TR-6 and SR-8 in runnable-exit-contract.test.ts find their sites by derived key (realDirectoryOrNull:statSync#0, <top>:realpathSync#1), not by a text line"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: a failing follow-up read after a symbolic link or a created directory is exit 2 by name"
        status: pass
    human_judgment: false

duration: 33min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 25: READ-1, every read site of the three host runnables failed under every caller Summary

**A compiler-derived table fails all 16, 19 and 11 node:fs read sites of trace-render, state-check and state-roll with EIO under each of their 95 calling paths (162 rows, every mode that reaches them), and every failure is exit 2 by name or an added finding with nothing written. The one row that found a defect was state-check's realpath of its own directory, which read a failure as "outside the root" and passed a clean tree with exit 0. It is now a named finding.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-10-23T15:38:06Z
- **Completed:** 2026-10-23T16:11:10Z
- **Tasks:** 2
- **Files modified:** 5 (1 created)

## Accomplishments

- `scripts/fault-inject.test-support.ts` (still never emitted; `git ls-files scripts/fault-inject.test-support.js` prints nothing): `deriveReadSites(jsPath)` returns `ReadSite` (`key`, `fn`, `line`, `enclosing`) for every call whose callee resolves through the file's own node:fs import bindings (namespace members, named imports, aliases) to FS_READ_FNS; `callingSites(jsPath, name)` returns `CallingSite` (`scope`, `line`, `kind`) from call expressions only; `classifiedFsCalls(jsPath)`; `FS_OTHER_FNS` (closeSync, constants, mkdirSync, renameSync, rmdirSync, unlinkSync, writeFileSync). Both derivations throw with file and line on a shape they cannot account for: a namespace or a read function used as a value, a reference to the function that is neither a call nor a call argument, a non-call member read with the function's name, or a second declaration.
- `scripts/runnable-ref/read-sites.test.ts` (190 cases): the tracer row, three pins, the two-sided equalities, the printed `UNREACHED_SITES` (size 0), the existsSync census, the two-sided node:fs classification, the zero-site assertions, six synthetic derivation cases, 162 table rows and 5 unlisted-mode rows.
- The state-check fix (below), and TR-6 and SR-8 found by derived key.

## Task Commits

1. **Task 1: Derive every read site of a runnable and fail one end to end (tracer)**: `d06e26dd` (test)
2. **Task 2: The table, every read site under every caller**: `76bb7951` (fix), then `a0dae3a2` (test: the backstop assertion, see deviation 2)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` had only automated checks. `npm run typecheck` and the tracer test were run after the commit's content was final (1 passed, together with the foundation guards and the exit-contract table, 355 passed), so the plan continued to Task 2 with no checkpoint.

## Pins

- `TRACE_RENDER_READ_SITES = 16`, `STATE_CHECK_READ_SITES = 19`, `STATE_ROLL_READ_SITES = 11` (2026-10-23, plan 37-25; at d9fa837c 16, 18 and 11). state-check gained the realpath of its own directory in plan 37-24.
- Derived (key, via) pairs: 30, 44 and 21. Rows: 60 (trace-render, write and --check), 44 (state-check, text with the D-14 marker), 58 (state-roll, write, --dry-run and write on a repository without the archive directory).
- `UNREACHED_SITES`: empty, size pinned at 0. Every site fired under at least one fixture.

## Final site table

Lines are the committed .js at `a0dae3a2`. Every outcome below was measured from the rows' own runs (a temporary logging edit, reverted), with `<tmp>` for the scratch path. Every row's tree digest was unchanged.

### trace-render (16 sites, 30 pairs; every row in write and --check, every outcome exit 2 with an empty stdout)

| Site key | Line | Via | Outcome on EIO |
|----------|------|-----|----------------|
| readRegularFileOrNull:openSync#0 | 488 | readRawNotesWithSkips#0 | the notes could not be read completely (0 task(s) and 2 note(s)) |
| readRegularFileOrNull:openSync#0 | 488 | readText#0 | memory-bank/plans/traceability.md cannot be read: ... could not be opened (EIO) |
| readRegularFileOrNull:fstatSync#0 | 502 | readRawNotesWithSkips#0 / readText#0 | notes incomplete (2 note(s)) / traceability.md cannot be read: EIO |
| readRegularFileOrNull:readSync#0 | 522 | readRawNotesWithSkips#0 / readText#0 | notes incomplete (2 note(s)) / traceability.md cannot be read: EIO |
| readRawNotesWithSkips:statSync#0 | 589 | (one caller) | notes incomplete (2 task(s)) |
| readRawNotesWithSkips:readdirSync#0 | 593 | (one caller) | notes incomplete (2 task(s)); the tracer row also asserts `UNREADABLE TASK .grugops/context/taskA` |
| `<top>`:realpathSync#0 | 756 | - | the repository root cannot be resolved (EIO) |
| `<top>`:statSync#0, `<top>`:accessSync#0 | 762, 766 | - | the root is not a readable (and writable, in write mode) directory (EIO) |
| realDirectoryOrNull:lstatSync#0 | 787 | `<top>`#0, #1, #2 | the context root .grugops/context / the state directory memory-bank/plans / the trace directory cannot be inspected |
| realDirectoryOrNull:realpathSync#0 | 796 | `<top>`#0, #1, #2 | the same three cannot be resolved |
| realDirectoryOrNull:statSync#0 | 806 | `<top>`#0, #1, #2 | .grugops/archive/context / memory-bank/plans / the trace directory cannot be inspected (the symbolic-link branch) |
| listTasks:readdirSync#0 | 829 | collectTraceNotes#0, `<top>`#0 | the context root .grugops/context cannot be listed |
| readTask:realpathSync#0 | 847 | collectTraceNotes#0, `<top>`#0 | notes incomplete (2 task(s)) |
| `<top>`:lstatSync#0 | 915 | - | memory-bank/plans/traceability.md cannot be inspected (the pre-write loop) |
| readText:lstatSync#0 | 937 | compareTraceTree#0, `<top>`#0 / compareTraceTree#1 | traceability.md cannot be inspected / traceability/ABC-099.md (the extra file) cannot be inspected |
| listDir:readdirSync#0 | 961 | compareTraceTree#0, `<top>`#0 | memory-bank/plans/traceability cannot be listed |

### state-check (19 sites, 44 pairs; text mode with the marker)

| Site key | Line | Via | Outcome on EIO |
|----------|------|-----|----------------|
| readRegularFileOrNull:openSync#0 / fstatSync#0 / readSync#0 | 1171 / 1185 / 1205 | readRawNotesWithSkips#0 | exit 1: FINDING .grugops/archive/context/taskB/notes/n2.md: the trace was not compared (unopenable) |
| same three | same | readState#0 | exit 2: the layout marker is present and cannot be read (unopenable / EIO) |
| same three | same | readTraceText#0 | exit 2: the trace file memory-bank/plans/traceability.md is present and cannot be read |
| same three | same | runnableSkewFindings#0 | exit 1: FINDING `<siblings dir>`/state-roll.js: it could not be read (unopenable / EIO) |
| readRawNotesWithSkips:statSync#0, readdirSync#0 | 1272, 1276 | (one caller) | exit 1: FINDING .grugops/archive/context/taskB: the trace was not compared (EIO) |
| `<top>`:realpathSync#0, statSync#0, accessSync#0 | 1449, 1455, 1457 | - | exit 2: the repository root cannot be resolved / is not a readable directory (EIO) |
| locate:realpathSync#0 | 1470 | readState#0 / traceDirectory#0 / readTraceText#0 | exit 2: cannot resolve the layout marker / the trace directory / the trace file (EIO) |
| locate:realpathSync#0 | 1470 | sizeFinding#0 / listDirectory#0 | exit 1: FINDING memory-bank/60-progress.md not measured (EIO) / FINDING .grugops/archive/queue-done could not be resolved (move-only-unlisted) |
| readState:statSync#0 | 1497 | readMarker#0, boardFindings#0, progressReport#0, `<top>`#0, `<top>`#1 | exit 2: cannot inspect the layout marker / board / progress file / traceability index / NFR catalog (EIO) |
| sizeFinding:lstatSync#0 | 1571 | directoryFindings#0 / progressReport#0 | exit 1: FINDING nfr/NFR-001.md / 60-progress.md not measured (EIO) |
| listDirectory:readdirSync#0 | 1597 | moveOnlyReport#0, #1 / `<top>`#0, #1, #2 | exit 1: FINDING the queue-done folders could not be listed (move-only-unlisted) / tickets, nfr, traceability not measured (EIO) |
| confirmListed:lstatSync#0 | 1642 | (one caller) | exit 2: the NFR file nfr/NFR-001.md was listed and then could not be inspected |
| traceDirectory:statSync#0 | 1724 | traceReport#0 / traceReport#1 | exit 2: cannot inspect the trace directory / the context root .grugops/context |
| readTraceTask:realpathSync#0 | 1743 | (one caller) | exit 1: FINDING .grugops/archive/context/taskB: the trace was not compared (notes directory cannot be resolved) |
| readTraceText:lstatSync#0 | 1774 | (one caller) | exit 2: cannot inspect the trace file traceability.md |
| listTasks:readdirSync#0 | 1826 | collectTraceNotes#0, traceReport#0 | exit 2: the context root .grugops/context cannot be listed |
| listDir:readdirSync#0 | 1838 | compareTraceTree#0, traceReport#0 | exit 2: the trace directory cannot be listed |
| runnableSkewFindings:realpathSync#0 | 1904 | (one caller) | exit 1: FINDING `<siblings dir>`: the directory of state-check.js could not be resolved (EIO) (fixed here) |

### state-roll (11 sites, 21 pairs; every outcome exit 2 with an empty stdout)

| Site key | Line | Via | Modes | Outcome on EIO |
|----------|------|-----|-------|----------------|
| readRegularFileOrNull:openSync#0 / fstatSync#0 / readSync#0 | 1013 / 1027 / 1047 | (one caller, readTextOrThrow) | all three | memory-bank/plans/board.md is present and cannot be read (unopenable / EIO). Nothing was rolled. |
| `<top>`:realpathSync#0, statSync#0, accessSync#0 | 1130, 1136, 1140 | - | all three | the repository root cannot be resolved / is not a readable (and writable) directory |
| realDirectoryOrNull:lstatSync#0 | 1168 | `<top>`#0, #1, #2, #3 | all three | the state directory (twice) / the archive directory / the memory bank directory cannot be inspected |
| realDirectoryOrNull:realpathSync#0, statSync#0 | 1177, 1186 | `<top>`#0, #1, #3 | all three | cannot be resolved / inspected |
| realDirectoryOrNull:realpathSync#0, statSync#0 | 1177, 1186 | `<top>`#2 (the archive directory) | write, --dry-run | the archive directory cannot be resolved / inspected; without an archive directory the function returns at its lstat (proven unreached there) |
| readTextOrThrow:lstatSync#0 | 1205 | readText#0 | all three | board.md cannot be inspected (EIO). Nothing was rolled. |
| readTextOrThrow:lstatSync#0 | 1205 | io.read#0 | write, write-new-archive | the files could not be re-read before the roll ... The Done roll wrote nothing. (not run in --dry-run, proven unreached) |
| `<top>`:realpathSync#1 | 1409 | - | write-new-archive | the archive directory cannot be resolved after it was created (EIO); the created directory was removed (proven unreached in write and --dry-run) |

## Rows that found a defect

1. **state-check `runnableSkewFindings:realpathSync#0`** (line 1901 before the fix, 1904 after). Observed in the table: the fault fired, the run was exit 1 only through the fixture's progress-file finding, and it added no finding line, so the row failed on "exit 1 adds a finding line". Reproduced on a clean marker tree with the pre-fix program (`d06e26dd`) and its two siblings: the fault fired, state-check printed `No findings.` and exited 0. The catch set `hereReal = null`, which the code reads as "this directory is outside the root". **Fix** (`76bb7951`): the catch pushes one `runnable-version-skew` finding naming the directory and its code (`the directory of state-check.js could not be resolved (EIO), so whether its sibling programs sit inside the repository root could not be told; each is named by its absolute path`). The siblings are still compared. On the same clean tree the fixed program exits 1 with that FINDING. No authority module was changed.

One row first failed on its premise, which was a fixture gap and not a defect: `readText:lstatSync#0 via compareTraceTree#1` fired no fault and the preload counted 3 calls at the site but not the via. The via is the trace model's read of a listed file the plan no longer holds (an extra file), and a fresh render has none. The fixture was fixed (a generated `ABC-099.md` copied from `ABC-001.md` after the render, the CR-01 shape the write mode would remove). The assertion was not changed.

## Mutation proofs (working tree only, each made after the task commits, then reverted with `git checkout --` and a rebuild)

- **(a) the try around trace-render's listTasks readdirSync removed**, then `npm run build`. With the current table, 4 failed and 186 passed: all four `listTasks:readdirSync#0` rows (write and --check, both vias) exited 2 through the 37-20 handler (`Error: the trace render stopped unexpectedly (EIO: injected fault, readdirSync). Nothing was written or removed. The trace render did not finish.`) and failed on "exit 2 by name, never through the unexpected-throw backstop". The plan predicted exit 1 with a stack. That was before plan 37-20's handler. The table at `76bb7951`, without the backstop assertion, was run under the same mutation: its 6 listTasks rows (trace-render and state-check) all passed. That measured gap is why `a0dae3a2` exists (deviation 2).
- **(b) the existence test brought back into the walk** (`if (!existsSync(notesDir)) return ...` at scripts/context-io.ts line 2160), then `npm run generate:runnable-embeds` (3 targets changed). 8 failed: the existsSync census (`Received "readRawNotesWithSkips:existsSync#0"`), the key and pair equalities of trace-render and state-check, and the three `readRawNotesWithSkips:statSync#0` rows, whose site no longer exists. The pins held because the count did not change.
- **(c) state-check's sizeFinding returns `[]` when its lstat fails**, then `npm run build`. 2 failed: `via progressReport#0` exited 0 ("exit 1 or 2, never 0"), and `via directoryFindings#0` exited 1 only through the fixture's progress finding with no added line ("exit 1 adds a finding line"). The plan predicted exit 0, which holds for the progress caller.
- After the reverts, `git status --porcelain scripts/runnable-ref scripts/context-io.ts` was empty, `npm run -s freshness` reported 87 fresh, `freshness:runnable-embeds` reported 3 fresh, and the table was 190 passed.

## Regression

The plan's derived subset (its `git grep -l -E` keyword and inventory union), run with the new test file staged so the `git ls-files` censuses see it: 36 files, 3,917 tests, 10 failed, 3,906 passed, 1 skipped, 700 s, one worker. The 10 failures are 37-BASELINE.md cases: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 and the six 31-29 cases (7). No failure is new. No authority module was edited, so no module name was added to the keyword list. The run was made before `a0dae3a2`, which changes only read-sites.test.ts (re-run: 190 passed). `pgrep -fl vitest` was empty after each run.

Gates at the end, all exit 0: `npm run build`, `npm run typecheck`, `npm run -s freshness` (87 fresh), `freshness:runnable-embeds` (3 fresh), `freshness:traceability`, `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js`, `node scripts/check-nul-bytes.js`, and `node scripts/runnable-ref/state-check.js .` (No findings).

## Files Created/Modified

- `scripts/fault-inject.test-support.ts`: the derivations (deriveReadSites, callingSites, classifiedFsCalls, enclosingName) and FS_OTHER_FNS; imports the TypeScript compiler (dev dependency; the module is never emitted)
- `scripts/runnable-ref/read-sites.test.ts` (new): the READ-1 table, pins, equalities, census, classification, synthetic cases and fixtures
- `scripts/runnable-ref/runnable-exit-contract.test.ts`: TR-6 and SR-8 find their sites by derived key; `lineOf` removed
- `scripts/runnable-ref/state-check.ts` / `.js`: runnableSkewFindings names an unresolvable own directory (hand-written part only; the region and the build stamp are unchanged)

## Decisions Made

See key-decisions in the frontmatter. In short: an exit-1 row must add a finding to the unfaulted run, an exit-2 row must be refused by name, the state-check fix is a finding rather than exit 2, and an `io.<name>(...)` member call counts as a direct entry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Test strength] An exit-1 row must add a finding line to the unfaulted run**
- **Found during:** Task 2
- **Issue:** the plan's state-check fixture has a progress file over budget, a finding, and trace-render's --check fixture has an extra file. Both are exit 1 unfaulted, so "exit 1 with a finding line" would pass with the fault unhandled
- **Fix:** each (runnable, mode) has an unfaulted baseline with a pinned status; an exit-1 row must print a finding line (`FINDING`, `ROLLED BACK`, or trace-render's `COLLISION|HAND-WRITTEN|MISSING|EXTRA|CHANGED`) that the baseline does not
- **Files modified:** scripts/runnable-ref/read-sites.test.ts
- **Verification:** mutation (c), the directoryFindings row
- **Committed in:** 76bb7951

**2. [Rule 2 - Test strength] An exit-2 row must not reach the unexpected-throw backstop**
- **Found during:** Task 2, while preparing mutation (a)
- **Issue:** with plan 37-20's handler, a site whose own try is removed still exits 2 with an empty stdout and no stack, so the plan's mutation (a) could not turn its row red
- **Fix:** every exit-2 row asserts stderr does not hold `stopped unexpectedly (`. Measured before asserting: 0 of 162 rows reached the handler
- **Files modified:** scripts/runnable-ref/read-sites.test.ts
- **Verification:** mutation (a): 4 rows red with the assertion, the same rows green without it
- **Committed in:** a0dae3a2

**3. [Rule 3 - Blocking] trace-render's fixture needed two more symbolic links and an extra trace file**
- **Found during:** Task 2
- **Issue:** realDirectoryOrNull's follow-up statSync runs only for a symbolic link, so with only the archive context root as a link, the state-directory and trace-directory vias of that site could not be reached. The extra-file read of compareTraceTree was not reached either
- **Fix:** `memory-bank/plans` and the trace directory are also in-root links, and a generated ABC-099.md is added after the render. A platform that cannot stage a link prints its skip line (stageSymlinkOrSkip) instead of passing silently
- **Files modified:** scripts/runnable-ref/read-sites.test.ts
- **Committed in:** 76bb7951

**4. [Rule 2 - Test strength] Unlisted modes are run and must fire nothing**
- **Found during:** Task 2
- **Issue:** a row lists its modes by hand, so a mode that reaches a site could be left out silently
- **Fix:** 5 rows run each omitted mode and assert no fault fired there (state-roll's archive-directory follow-ups without an archive, io.read in --dry-run, the post-create realpath in write and --dry-run)
- **Committed in:** 76bb7951

---

**Total deviations:** 4 auto-fixed (3 test strength, 1 blocking fixture). **Impact on plan:** all four make rows stricter or reachable. No row was weakened or skipped, and no site was moved to UNREACHED_SITES.

Plan-expectation differences, recorded and not changed: mutation (a) gives exit 2 through the handler, not exit 1 with a stack. state-roll's io.read row is exit 2 (`The Done roll wrote nothing`, the re-read before the roll fails), not the plan table's "restored roll, exit 1". Both are inside the rule.

## TDD Gate Compliance

Task 2 is `tdd="true"`, and `workflow.tdd_mode` is off. RED was observed before the fix: the state-check row failed on its planned assertion (exit 1 with no added finding, fault fired), and on a clean tree the pre-fix program exited 0. The brief forbids a red commit (§3), so the table and the fix share the `fix(37-25)` commit `76bb7951`, as in plans 37-20 to 37-24.

## Issues Encountered

- A first logging attempt used an unquoted heredoc, and bash expanded a template literal. The edit was discarded with `git checkout --` before anything ran. The second attempt used a quoted heredoc, and its edit was reverted after the measurement.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- READ-1 for the three host runnables is closed by test. Plan 37-26 covers scripts/validate-agent-factory.ts with its own table and can reuse deriveReadSites and callingSites.
- Plan 37-27 runs the full non-e2e suite for the round.
- REQUIREMENTS.md rows were not flipped (brief §3).

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*

## Self-Check: PASSED

- FOUND: scripts/runnable-ref/read-sites.test.ts, scripts/fault-inject.test-support.ts
- FOUND: d06e26dd, 76bb7951 and a0dae3a2 are ancestors of HEAD
- Acceptance: read-sites.test.ts asserts three pins and both equalities and passes (190); UNREACHED_SITES size 0; the three mutation proofs are recorded and `git status --porcelain scripts/runnable-ref scripts/context-io.ts` is empty; the regression subset shows no failure outside 37-BASELINE.md; `git ls-files scripts/fault-inject.test-support.js` prints nothing
