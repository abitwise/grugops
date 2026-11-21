---
phase: 37-overview-board-per-file-records-and-budgets
plan: 33
subsystem: testing
tags: [read-1, cr-05, d-20, root-chain, symlink, trace-render, state-check, context-io, embeds]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "entryPresence, the round-2 absence owner (37-28..37-30), and the READ-1 EIO/ENOENT/shape tables (37-25, 37-31)"
provides:
  - "rootChainPresence, rootChainOf, ROOT_CHAIN_LINK_REFUSAL and an exported isWithin in scripts/context-io.ts, embedded into trace-render and state-check"
  - "trace-render's realDirectoryOrNull(rel, what) and state-check's traceDirectory on the root-chain owner: a link on the path to a context root, the state directory or the trace directory is exit 2 / trace-not-compared"
  - "CR-05a and CR-05b sequences with four link targets, the absent-root control, and unit cases for the owner"
affects: [37-34, 37-35, 37-36, 37-37, 37-38, 37-39]

actuals:
  tokens: 22920
  tasks: 2
  commits: 2
plan_head_before: e82bd43f374e39fd7b4847e7a5af7c871e595dfe
plan_head_after: 7dcb64a5760b26c770c70d0697283306f6c1c698

tech-stack:
  added: []
  patterns:
    - "Canonical form on the root chain (D-20): below the real root, lstat every component of a state path and refuse a link from the lstat alone, whatever it points to"
    - "One presence-owner table per runnable (ENOENT_OWNERS) drives both the ENOENT census and the shape-table caller derivation"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/context-io.test.ts

key-decisions:
  - "trace-render's hand-written insideRoot was deleted in this plan, not in 37-34: once realDirectoryOrNull stopped calling it, tsc noUnusedLocals made it a compile error (relOfPath's root-prefix copy stays for 37-34)"
  - "rootChainPresence has one calling call expression per runnable, so derivedPairs names its READ-1 rows without a via (rootChainPresence:<fn>#0), and the ENOENT exemption keys follow that spelling"
  - "state-check's memory-bank and memory-bank/plans shape cells may stop at the layout marker (exit 2 by name) until plan 37-35, as the plan's truth allows; every other root-chain link cell must carry ROOT_CHAIN_LINK_REFUSAL"

patterns-established:
  - "root-chain shape kind: dangling link, link to a directory, link to a regular file and regular file all refused; a link cell carries `<position> <ROOT_CHAIN_LINK_REFUSAL>`"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "A context root beneath a symbolic link (CR-05b at .grugops, CR-05a at .grugops/archive), with the link to an empty outside directory, to an outside directory holding the content, to an in-root directory holding it, or dangling: trace-render write and --check exit 2 naming the root with the root-chain reason, every trace file and index line kept, state-check trace-not-compared (marker) or WARN (no marker), never fresh, never REMOVED, never trace-stale"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-05: a context root beneath a symbolic link below the repository root is refused, never an absent root"
        status: pass
    human_judgment: false
  - id: D2
    description: "An absent context root with real ancestors is still absence: render 0 removes ABC-2.md, state-check fresh"
    requirement: "SPLIT-03"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CONTROL: an absent archive context root with real ancestors and no link anywhere is still absence"
        status: pass
    human_judgment: false
  - id: D3
    description: "The root-chain owner's contract (rootChainOf, rootChainPresence, isWithin) on a synthetic tree, each discriminating by mutation"
    requirement: "SPLIT-05"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#rootChainPresence: the root-chain owner (plan 37-33, D-20)"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 tables re-derived: pins 15/18/10, root-chain shape kind at trace-render realDirectoryOrNull#0 and state-check traceDirectory#0, per-runnable ENOENT owners (3/3/2), ENOENT exemptions 10, owner callers 6/6/2, UNREACHED_SITES 0"
    requirement: "SPLIT-05"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (519 passed)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#TR-6"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 33: Root-Chain Owner for the Renderer and State-Check Summary

**rootChainPresence in scripts/context-io.ts, embedded into trace-render and state-check, refuses a symbolic link on the path to a context root, the state directory or the trace directory by lstat alone; the CR-05 deletion (render exit 0 removing ABC-1.md / ABC-2.md) is now exit 2 with every trace file kept, and state-check reports trace-not-compared**

## Performance

- **Duration:** 47 min
- **Started:** 2026-10-24T10:27:46Z
- **Completed:** 2026-10-24T11:15:00Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- One root-chain owner (D-20): `rootChainPresence(realRoot, rel, leaf)` lstat's every component of a repository-relative state path below the real root; a link before the last component, or at the last for a `directory` query, is `link` with the reason `<prefix> is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path`; only an lstat ENOENT beneath real directories is `absent`; the last component is always stat'ed and realpath'ed, and a real path outside the root is `outside`.
- trace-render: `realDirectoryOrNull(rel, what)` asks the owner for both context roots, the state directory and the trace directory; `link` is `couldNotRun("<what> cannot be used: <reason>.")`.
- state-check: `traceDirectory` asks the owner; `linked` at the trace directory or at either context root is one trace-not-compared finding naming it; `refused` at the trace directory stays could-not-run.
- CR-05a and CR-05b closed with four link targets each, plus the absent-root control; unit cases for the owner with two mutation proofs.

## Task Commits

1. **Task 1: End-to-end CR-05 (tracer)** - `bd8aa543` (fix)
2. **Task 2: The root-chain owner's own contract** - `7dcb64a5` (test)

**Plan metadata:** recorded in the docs commit that adds this file.

## RED run (Task 1, step 1, against the committed runnables at e82bd43f)

The CR-05 describe was first run with the test-local phrase `is a symbolic link`: 8 failed, 1 passed (the control). A
probe that runs `--check` and state-check before the write mode (scratch script, committed `.js` copied to a host
directory, links to an empty outside directory) recorded the reproduced CR-05:

| Sequence | --check | state-check | write mode |
|----------|---------|-------------|------------|
| CR-05b (`.grugops` linked to an empty outside directory) | exit 1, `EXTRA memory-bank/plans/traceability/ABC-1.md`, `CHANGED ...traceability.md`, 0 task(s) read | exit 1, `trace-stale` for the index and ABC-1.md, remedy names the render | exit 0, `REMOVED memory-bank/plans/traceability/ABC-1.md` |
| CR-05a (`.grugops/archive` linked to an empty outside directory) | exit 1, `EXTRA memory-bank/plans/traceability/ABC-2.md`, 1 task(s) read | exit 1, `trace-stale` for the index and ABC-2.md | exit 0, `REMOVED memory-bank/plans/traceability/ABC-2.md` |

Per link target in the RED run of the test itself: the empty-outside variants wrote with exit 0 (REMOVED, then `--check`
and state-check fresh on the reduced tree); the outside-holding-content variants exited 2 with "resolves outside the
repository root" (the reason did not match); the in-root variants rendered through the link (exit 0, fresh); the
dangling variants exited 2 with the round-2 "target that cannot be reached" reason (the reason did not match).

## GREEN

After Task 1: `npx vitest run scripts/runnable-ref/trace-render.test.ts -t CR-05` 9 passed, 0 failed (darwin, non-root,
no skips). `node scripts/runnable-ref/state-check.js . --json` reports `trace.compared` true on grugops's own tree.
deriveReadSites over the committed `.js` finds `rootChainPresence:lstatSync#0`, `rootChainPresence:statSync#0` and
`rootChainPresence:realpathSync#0` in both trace-render.js and state-check.js (the read-sites pins and two-sided
equalities hold).

## Class table rows this plan closed (final state after 37-33)

| Site | Before | After 37-33 | Test |
|------|--------|-------------|------|
| trace-render realDirectoryOrNull (context roots, state directory, trace directory) | entryPresence; absent beneath an outside link; boundary only on present | rootChainPresence, leaf `directory`; a link anywhere on the chain is exit 2 | trace-render.test.ts CR-05 (8 rows + control), IN-10 rows, read-sites root-chain cells |
| state-check traceDirectory (trace directory, both context roots) | locate (entryPresence); absent beneath an outside link | rootChainPresence, leaf `directory`; `linked` is trace-not-compared | CR-05 state-check halves, state-check.test.ts trace-directory row, read-sites root-chain cells |
| context-io isWithin | private boundary predicate of the walk | exported, embedded into trace-render and state-check | context-io.test.ts isWithin case |
| trace-render insideRoot | hand-written boundary copy (IN-13) | deleted (dead after realDirectoryOrNull moved; see Deviations) | tsc |

Unchanged here and left to later plans: trace-render's pre-write check, readText and relOfPath (37-34); state-check's
locate, insideRoot and readTraceText relativizer (37-35); state-roll (37-36, stamp line only here).

## Rewritten tests (old expectation to new)

| Test | Old expectation | New expectation |
|------|-----------------|-----------------|
| trace-render.test.ts "a symlinked trace directory pointing outside the repository root is refused by name" | exit 2, "the trace directory memory-bank/plans/traceability resolves outside the repository root" | exit 2, "the trace directory memory-bank/plans/traceability cannot be used: memory-bank/plans/traceability <ROOT_CHAIN_LINK_REFUSAL>" |
| trace-render.test.ts "a symlinked context root pointing outside the repository root is refused by name" | exit 2, "the context root .grugops/context resolves outside the repository root" | exit 2, "the context root .grugops/context cannot be used: .grugops/context <ROOT_CHAIN_LINK_REFUSAL>" |
| trace-render.test.ts IN-10 rows (dangling link at .grugops/context, .grugops/archive/context, .grugops, .grugops/archive) | write stderr and the state-check note match the round-2 reason (symbolic link whose target cannot be reached) | both contain `<link position> <ROOT_CHAIN_LINK_REFUSAL>`; exit codes, digests and findings unchanged |
| trace-render.test.ts IN-10 CONTROL (live in-root link at .grugops/archive/context) | render 0, --check 0 fresh, state-check fresh (the link was followed) | renamed; write and --check exit 2 with the root-chain reason, nothing written, state-check exit 1 with exactly `trace-not-compared\|.grugops/archive/context`, never fresh |
| state-check.test.ts DANGLING_STATE_ROWS `memory-bank/plans/traceability` (plan 37-29) | exit 2 naming it with the unreachable-target reason | new outcome `trace-not-compared`: exit 1, one `FINDING  memory-bank/plans/traceability: ... (trace-not-compared)` line containing `memory-bank/plans/traceability <ROOT_CHAIN_LINK_REFUSAL>`, never fresh |
| runnable-exit-contract.test.ts TR-6 | EIO at `entryPresence:statSync#0` via realDirectoryOrNull on a symbolic-link archive context root (live root removed): exit 2 naming the archive root with (EIO) | EIO at `rootChainPresence:statSync#0` (its one caller realDirectoryOrNull asserted) on a plain archive context root, live root removed: the same exit-2 assertions |
| read-sites.test.ts shape cells "link to a directory" at TRACE_DIRECTORIES (7 trace-render cells under realDirectoryOrNull#0, 7 state-check cells under locate#0) | `follow`: output and bytes equal the unplanted run | `refused` under the new `root-chain` kind (state-check's position moved to traceDirectory#0), carrying the root-chain reason |

## read-sites.test.ts: removed rows and their replacements

| Removed (key, via) | Replacement |
|--------------------|-------------|
| trace-render `entryPresence:lstatSync#0 via realDirectoryOrNull#0` | trace-render `rootChainPresence:lstatSync#0` (one caller, so no via) |
| trace-render `entryPresence:statSync#0 via realDirectoryOrNull#0` | trace-render `rootChainPresence:statSync#0` |
| trace-render `entryPresence:realpathSync#0 via realDirectoryOrNull#0` | trace-render `rootChainPresence:realpathSync#0` |
| (none removed in state-check; locate keeps its entryPresence rows for the state files) | state-check `rootChainPresence:{lstatSync,statSync,realpathSync}#0` added |
| ENOENT_EXEMPT `trace-render entryPresence:lstatSync#0 via realDirectoryOrNull#0` | `trace-render rootChainPresence:lstatSync#0` |
| (new) | ENOENT_EXEMPT `state-check rootChainPresence:lstatSync#0` (a context root and the trace directory may be absent) |
| SHAPE_POSITIONS state-check `locate#0` TRACE_DIRECTORIES, `directory-follow` | state-check `traceDirectory#0` TRACE_DIRECTORIES, `root-chain` |
| SHAPE_POSITIONS trace-render `realDirectoryOrNull#0`, `directory-follow` | same via, `root-chain` |

Pins moved with dated history lines: read sites 12/15/10 to 15/18/10; ENOENT_EXEMPT_SIZE 9 to 10; ENOENT_COMPARISONS
2/2/2 to 3/3/2; owner callers 6/5/2 to 6/6/2 (trace-render loses realDirectoryOrNull from entryPresence and gains it
under rootChainPresence). SHAPE_ROW_COUNT stays 185; UNREACHED_SITES stays 0; both equalities stay two-sided.
ENOENT_OWNERS became a per-runnable table and ownerCallers derives the callers of every presence owner in it. The
traceRenderRepo fixture no longer plants links at the archive context root, the state directory or the trace
directory (taskA's `notes` link below a context root stays). read-sites.test.ts: 519 passed.

## Census edits

None of the conditional files was edited: scripts/nonblocking-reader-parity.test.ts, scripts/context-io-writer-set.test.ts,
scripts/check-foundation-guards.test.ts and scripts/generate-runnable-embeds.test.ts passed unchanged (their only
failures are the baseline's).

## Mutation proofs (working tree only, each reverted with `git checkout --`, rebuilt and re-embedded)

- **(a) follow a middle link (stat it and continue, as entryPresence does):** 15 red. The five middle-component unit
  cases (in-root holding the child, outside holding the child, empty outside, dangling, to a file); all eight CR-05
  rows (CR-05a and CR-05b, four targets each); IN-10 `.grugops` and `.grugops/archive` dangling rows.
- **(a') stat a last-component link of a `directory` query and answer present (round-2 policy):** 11 red. The five
  last-component `directory` link unit cases; state-check.test.ts `memory-bank/plans/traceability` trace-not-compared
  row; trace-render.test.ts both "symlinked ... pointing outside" refusals; IN-10 `.grugops/context` and
  `.grugops/archive/context` dangling rows; the rewritten IN-10 in-root link row. The plan expected the in-root
  variants of CR-05a and CR-05b to go red here too; they did not, because their link sits at `.grugops` or
  `.grugops/archive`, a middle component of every path the runnables ask, so (a) is what they discriminate.

After revert: `scripts/context-io.ts` byte-equal to the pre-mutation copy, freshness of build outputs, embeds and the
hook manifest clean, `git status --porcelain scripts/context-io.ts scripts/runnable-ref` empty.

## Regression run (Task 2 verify, once)

Derived subset: 50 test files (`git grep -l` over the plan's patterns, e2e excluded), `npx vitest run --exclude
'**/scripts/e2e/**'`, 914.65 s, one worker: 3 files failed, 47 passed; 10 tests failed, 5366 passed, 1 skipped.
Every failure is in 37-BASELINE.md: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23
PROBE 5 (1) and 31-29 (6). No new failure. Gates: build, typecheck, freshness, freshness:traceability,
freshness:runnable-embeds, freshness:hook-manifest, check-foundation-guards, check-state-paths, check-nul-bytes and
state-check on the own tree all exit 0. No orphaned vitest worker after any run.

## Decisions Made

- The owner's reasons name repository-relative prefixes (`"a/b" on the path is not a directory (ENOTDIR)`), not
  absolute paths, so a refusal reads the same on every host.
- state-check's `linked` at a context root reuses the existing context-root trace-not-compared wording ("the context
  root cannot be used: <reason>; the render refuses to run until it can").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] trace-render's insideRoot deleted in this plan**
- **Found during:** Task 1, step 4
- **Issue:** after realDirectoryOrNull moved to rootChainPresence, insideRoot had no caller and `tsc` (noUnusedLocals)
  failed the build. The plan kept the copy for 37-34.
- **Fix:** the dead function was removed; relOfPath's `${root}/` prefix test (the other IN-13 copy in trace-render)
  is untouched for 37-34.
- **Files modified:** scripts/runnable-ref/trace-render.ts (+ .js)
- **Committed in:** bd8aa543

**2. [Rule 1 - Spec mismatch] READ-1 rows for the new owner carry no via**
- **Found during:** Task 1, step 7
- **Issue:** the plan names the rows "under realDirectoryOrNull#0 / traceDirectory#0", but derivedPairs gives a via
  only for a reader entered from two or more call expressions, and rootChainPresence has one caller per runnable.
- **Fix:** rows are `rootChainPresence:<fn>#0`; the ENOENT_EXEMPT key check accepts `rootChainPresence:lstatSync#0`
  with or without a via; TR-6 asserts the single caller is realDirectoryOrNull.
- **Committed in:** bd8aa543

**3. [Rule 2 - Plan truth] state-check marker-first positions**
- **Found during:** Task 1, step 7
- **Issue:** a dangling link or a link to a file at `memory-bank` or `memory-bank/plans` stops state-check at the
  layout marker (exit 2 with entryPresence's reason) before traceDirectory runs, so those link cells cannot carry
  ROOT_CHAIN_LINK_REFUSAL until plan 37-35.
- **Fix:** MARKER_FIRST_POSITIONS (those two paths, state-check only) waives the reason check only when the run is exit
  2 naming the position; exit 1 there still requires the root-chain reason. Every other root-chain link cell requires
  it. This is the outcome the plan's truth allows until 37-35.
- **Committed in:** bd8aa543

**4. [Rule 2 - Additive] two more rewritten tests and extra unit cases**
- The two "symlinked ... pointing outside the repository root" refusals encoded the round-2 reason at a chain position
  and were rewritten (listed above). Task 2 adds middle-link cases for an outside directory holding the child and an
  empty outside directory (the CR-05 shape), a plain-file case and an isWithin separator case beyond the behavior list.

---

**Total deviations:** 4 (1 blocking, 1 spec mismatch, 2 plan-truth/additive). **Impact:** no scope widening; the
mutation (a') expectation for the CR-05 in-root variants was wrong in the plan and is recorded as measured.

## Issues Encountered

- The first `npm run generate:runnable-embeds` ran the previously compiled generator, so the new roots were not
  embedded until the script's own trailing build had compiled the edited generator; a second run embedded them.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 37-34: the renderer's file positions (pre-write check, readText) onto rootChainPresence with leaf `entry`,
  relOfPath onto isWithin, and the above-root control.
- 37-35 must move state-check's marker read onto the owner; then MARKER_FIRST_POSITIONS in read-sites.test.ts can be
  removed and the memory-bank cells pinned to one outcome.

## Self-Check: PASSED

- FOUND: bd8aa543, 7dcb64a5 (both ancestors of HEAD)
- FOUND: scripts/context-io.ts, scripts/runnable-ref/trace-render.ts, scripts/runnable-ref/state-check.ts,
  scripts/runnable-ref/read-sites.test.ts, scripts/context-io.test.ts

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
