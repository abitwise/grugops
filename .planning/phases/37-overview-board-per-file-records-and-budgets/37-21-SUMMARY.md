---
phase: 37-overview-board-per-file-records-and-budgets
plan: 21
subsystem: testing
tags: [read-1, cr-01, trace-render, state-check, trace-model, context-io, could-not-run, typescript]

requires:
  - phase: 37-20
    provides: the fault-injection harness (treeDigest), the EXIT-1 handlers, and the CR-02 fix in trace-render listTasks
provides:
  - "CR-01 closed: an incomplete note read is exit 2 in both trace-render modes with nothing compared, written or removed, and one named trace-not-compared finding per failure in state-check (trace.compared false, no fresh line)"
  - "trace-model.ts: TRACE_TRUST_SKIP_ARMS, TraceReadFailure, traceReadFailures, CompleteTracePlan, planCompleteTraceTree: the one predicate that the note read was complete"
  - "context-io.ts note walk: only ENOENT is an absent notes directory; EACCES on a parent throws (a failed task)"
  - "The READ-1 arm table: every I/O arm of the note reader (plus a directory named like a note) in both context roots, with the trust arms as controls"
affects: [37-24, 37-25, 37-27]

actuals:
  tokens: 22270
  tasks: 2
  commits: 2
plan_head_before: 273569b6626d2b85c524dd36831546b9b495bb12
plan_head_after: 608e4dff6ab7cfdd597b92573fdbbb58eb5bd646

tech-stack:
  added: []
  patterns:
    - "A plan only from a complete read: planCompleteTraceTree returns { complete: false, failures } with no plan, so no caller can compare, write or remove from a partial read"
    - "Trust arms are an allow-list (TRACE_TRUST_SKIP_ARMS); any other reader arm, including one added later, is a read failure by default"
    - "Arm-table rows derived from NOTE_SKIP_ARMS minus TRACE_TRUST_SKIP_ARMS, one builder per arm in a Record keyed by arm, row count asserted"

key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/trace-model.test.ts
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/context-io.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "A note skipped under an I/O arm with an empty detail (vanished) carries the reason `the reader could not read it (<arm>)`, so every UNREADABLE NOTE line and every trace-not-compared note has a non-empty reason"
  - "state-check's trace-not-compared note for a skipped note carries `<arm>: <reason>` inside the parentheses, so the finding names the arm as trace-render's stderr line does"
  - "The arm table runs all three commands (write, --check, state-check with the marker) from scripts/runnable-ref/trace-render.test.ts, with the committed state-check.js host copy; state-check.test.ts holds the CR-01 two-shape cases with and without the marker"

patterns-established:
  - "READ-1 table row: render clean, plant the shape, digest, activate (chmod), run write/--check/state-check in try, deactivate in finally, assert exit 2/2/1 and the digest unchanged"

requirements-completed: [SPLIT-03, SPLIT-05]

coverage:
  - id: D1
    description: "CR-01 sequence: notes directory and task directory at mode 000; write exit 2 with stdout empty, stderr naming the task, tree digest and index line unchanged; --check exit 2; state-check with the marker exit 1, trace.compared false, one trace-not-compared finding naming the task, no fresh line; without the marker a WARN line and no fresh line"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#CR-01: an incomplete read never removes a trace file"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#CR-01: the notes directory / the task directory at mode 000 is trace-not-compared naming the task, with and without the D-14 marker, never fresh"
        status: pass
    human_judgment: false
  - id: D2
    description: "READ-1 arm table: unopenable, not-a-regular-file (FIFO and directory), above-ceiling, vanished, in the live and archive context roots (10 rows): write exit 2 digest unchanged, --check exit 2, state-check trace-not-compared naming the note; unsealed and unparseable controls render exit 0 (4 rows)"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#READ-1: every I/O arm of the note reader stops the render and the compare by name, in both context roots"
        status: pass
    human_judgment: false
  - id: D3
    description: "One predicate: the partition (NOTE_SKIP_ARMS minus TRACE_TRUST_SKIP_ARMS is the four I/O arms), traceReadFailures, planCompleteTraceTree, and the census that each runnable's hand-written part calls planCompleteTraceTree once and never names buildTraceRows or planTraceTree"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#traceReadFailures and planCompleteTraceTree: an incomplete read gives no plan (plan 37-21, CR-01)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The note walk reads only ENOENT as absent: readContext on a task directory at mode 000 throws EACCES; a missing task returns []"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#readContext: an unreadable task directory throws, a missing task reads as no notes (plan 37-21, READ-1)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A complete read is unchanged: grugops's own tree state-check --json reports trace.compared true with no finding; freshness, runnable-embeds, traceability and hook-manifest gates exit 0"
    verification:
      - kind: other
        ref: "node scripts/runnable-ref/state-check.js . --json; npm run -s freshness:runnable-embeds; npm run -s freshness:traceability"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 21: CR-01, an incomplete note read never removes a trace file Summary

**One trace-model predicate, planCompleteTraceTree, now decides that the note read was complete: a task that cannot be read, or a note skipped under an I/O arm, makes trace-render exit 2 in both modes with nothing written or removed, and gives one named trace-not-compared finding in state-check, which never says the trace is fresh. The note walk no longer reads EACCES as absence.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-10-23T13:14:55Z
- **Completed:** 2026-10-23T13:44:41Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- `scripts/trace-model.ts`: `TRACE_TRUST_SKIP_ARMS` (frozen `["unparseable", "unsealed"]`), `TraceReadFailure`, `traceReadFailures`, `CompleteTracePlan`, `planCompleteTraceTree`. Any arm not on the trust list is a read failure, so a new reader arm cannot become a silent skip.
- trace-render takes its plan only from `planCompleteTraceTree`. On an incomplete read, `couldNotRunIncomplete` runs before any compare, pre-write check or write. It prints the counts line and one `UNREADABLE TASK <root>/<task>: <reason>` or `UNREADABLE NOTE <root>/<task>/notes/<file> (<arm>): <detail>` line per failure on stderr, every value through `printable()`, leaves stdout empty and exits 2. The stdout UNREADABLE TASK lines are gone, and the counts line is unchanged.
- state-check's `traceReport` takes its plan only from `planCompleteTraceTree`. An incomplete read returns `compared: false` with one `trace-not-compared` finding per failure (rel `<root>/<task>` or `<root>/<task>/notes/<file>`) and no TRACE line.
- `context-io.ts` `readRawNotesWithSkips` now uses `statSync(notesDir, { throwIfNoEntry: false })`: a missing directory reads as absent and any other failure throws. Both runnable regions follow, and their merged `node:fs` import no longer has `existsSync`.
- `EMBED_SPECS`: `planCompleteTraceTree` was added to the trace-model roots of the state-check and trace-render rows, with a dated plan 37-21 line.

## Task Commits

1. **Task 1: CR-01 end to end (tracer)** - `29af2135` (fix)
2. **Task 2: the whole read-failure class** - `608e4dff` (fix)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the `<verify>` block is automated only. The verify was re-run, both automated blocks passed, and the plan went on to expansion with no checkpoint.

## RED runs

**Task 1, against the committed runnables at `273569b6`.** The four new CR-01 cases failed. Both write-mode cases exited 0, with stdout `REMOVED memory-bank/plans/traceability/ABC-1.md: a generated trace file no published note names any more.`, then `Rendered the trace: 1 task(s) and 0 note(s) read; ... unreadable tasks 1; 1 file(s) written, 1 file(s) removed.`, then `UNREADABLE TASK .grugops/context/taskA: EACCES: permission denied, scandir '<tmp>/.grugops/context/taskA/notes'`. With the task directory at mode 000, the reason was `its notes directory cannot be resolved (EACCES)`. A standalone reproduction with the same committed `.js` files (sealed ABC-1 note, render, notes at mode 000, render again) gave: render 2 exit 0 with the REMOVED line, then `--check` exit 0 `The trace is fresh: ... unreadable tasks 1.`, then state-check with the marker exit 0 `TRACE    The trace is fresh: ...` and `No findings.` That is CR-01 reproduced end to end.

**Task 2, context-io walk case, against the committed context-io.js:** `AssertionError: readContext read an unsearchable task directory as a task with no notes: expected null to be an instance of Error`, on the target assertion.

Semantic assessment: each RED case ran its target, and each failed on its planned assertion (exit status, the REMOVED or fresh output, or the walk returning instead of throwing). None failed on a setup or load fault.

## Rewritten tests (none deleted)

| Case (file `scripts/runnable-ref/trace-render.test.ts`) | Old expectation | New expectation |
|---|---|---|
| `a task whose name the reader refuses is counted and named on its own line, with control characters removed` -> retitled `a task whose name the reader refuses stops the render: exit 2, named on stderr with control characters removed, the earlier render unchanged` | exit 0; stdout `unreadable tasks 1` and `UNREADABLE TASK .grugops/context/bad[31mtask: `; the other tickets rendered | renders first; exit 2; empty stdout; stderr `(1 task(s) and 0 note(s) could not be read)` and `UNREADABLE TASK .grugops/context/bad[31mtask: ` with no C0, C1 or DEL code point; ABC-001.md byte-unchanged; tree digest unchanged apart from the planted task |
| `an unsealed note and a refused task name are counted and named, and --check still exits 0` -> `... and --check exits 2` | --check exit 0; stdout `unsealed 1`, `unreadable tasks 1`, `UNREADABLE TASK .grugops/context/badtask: ` | the render before the bad task exits 0 with `unsealed 1` on stdout; --check with the bad task exits 2, empty stdout, stderr `(1 task(s) and 0 note(s) could not be read)` and `UNREADABLE TASK .grugops/context/badtask: `, no UNREADABLE NOTE; on a platform that refuses the name, --check exits 0 with `unsealed 1` |

No other case in the file expected exit 0 with an UNREADABLE TASK line on stdout. No state-check.test.ts case asserted an UNREADABLE TASK line. trace-render.test.ts went from 27 to 47 cases.

## Mutation proofs (working tree only, each reverted with `git checkout --` and a rebuild)

- **(a)** `traceReadFailures` returns `failures.slice(0, 0)`, embeds regenerated: 21 failed across trace-render, state-check and trace-model tests. That covers all 10 I/O arm rows, all 4 CR-01 sequence cases in trace-render.test.ts, both state-check CR-01 cases, both rewritten cases and 3 unit cases.
- **(b)** `vanished` added to `TRACE_TRUST_SKIP_ARMS`, embeds regenerated: 7 failed. These were the partition case, the failure-list and order cases, `the I/O arms are the four the brief names`, the table-count case (the vanished rows left the table) and the two trust-arm control rows.
- **(c)** The `existsSync` absence test was restored in the walk and rebuilt: the context-io walk case failed (`expected null to be an instance of Error`).
- After the reverts: `git status --porcelain scripts/trace-model.ts scripts/context-io.ts` is empty, runnable-embeds and hook-manifest are fresh, and the three trace test files are 175 passed. No mutation was committed.

## READ-1 class table (final state)

| Site | Before | After this plan | Covered by |
|------|--------|-----------------|------------|
| trace-model.ts `collectTraceNotes` failedTasks | counted, then ignored; the ticket's file was removed (CR-01) | a read failure; no plan | CR-01 sequence (trace-render, state-check tests); trace-model unit cases |
| `collectTraceNotes` skip arm unopenable | absence | read failure | arm table (mode-000 note), both roots |
| skip arm not-a-regular-file | absence | read failure | arm table (FIFO `x.md` and directory `y.md`), both roots |
| skip arm above-ceiling | absence | read failure | arm table (sparse NOTE_FILE_MAX_BYTES + 1 file), both roots |
| skip arm vanished | absence | read failure | arm table (dangling symbolic link `z.md`), both roots |
| skip arms unsealed, unparseable | trust skip | trust skip (unchanged) | 4 control rows (2 arms x 2 roots) |
| context-io.ts `readRawNotesWithSkips` absence test | `existsSync`; EACCES on a parent read as an empty task | ENOENT only is absent; anything else throws (a failed task) | context-io walk case; mutation (c) |
| `readRawNotesWithSkips` readdirSync | threw, became a failed task, then ignored | a failed task stops the render | CR-01 sequence, notes directory row |
| trace-render.ts `readTask` realpathSync(notesDir) | threw, failed task, ignored | stops the render | CR-01 sequence, task directory row |
| state-check.ts `readTraceTask` realpathSync(notesDir) | same | trace-not-compared | CR-01 sequence, task directory row (both test files) |
| trace-model.ts `compareTraceTree` read returning null after the listing | ENOENT only (nothing to remove) | unchanged, compliant | evidence: readText returns null only for ENOENT |
| trace-render.ts readText, listDir; state-check.ts readTraceText and its listDir | a refusal is couldNotRun | unchanged, compliant | plan 37-25 rows |
| trace-render.ts listTasks | fixed in plan 37-20 | compliant | 37-20 Task 1 |
| state-check.ts traceReport listTasks | couldNotRun | compliant | plan 37-25 rows |

## Regression

Scope reason (the plan's recorded deviation from brief §3): the subset is the deduplicated union of the keyword list and the inventory guard, run with the changed files staged so the `git ls-files` censuses see them. The full non-e2e suite runs at 37-24 and 37-27.

- **Union list:** 47 test files from the plan's one `git grep -l -E` command.
- **Result (before the Task 2 commit):** 47 files, 4594 tests, 13 failed, 4580 passed and 1 skipped, in 841 s.
  - 10 of the failures are in 37-BASELINE.md: canonical-corpus 1, context-io-writer-set 2, context-io 7.
  - 2 came from the uncommitted tree: `floor-invariance.test.ts` (hook-entry.ts differs from HEAD) and `capture-live.test.ts` P5 (`11 entry(ies) differ from HEAD`). After the commit, both files re-ran 212 passed.
  - 1 was new: `install/mode-census.test.ts` `the chmod calls in the scripts tests are the number counted` (33 expected, 37 measured), fixed below.
- **Gates after the commits:** these all exit 0: `npm run build`, `npm run typecheck`, `npm run -s freshness` (86 outputs), `freshness:runnable-embeds` (3 targets), `freshness:traceability`, `freshness:hook-manifest`, `freshness:context`, `freshness:guarantees`, `freshness:host-entries`, `freshness:queue`, `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js` and `node scripts/check-nul-bytes.js`. On grugops's own tree, `node scripts/runnable-ref/state-check.js . --json` reports `{"compared":true,"findings":[]}`.
- `pgrep -fl vitest` after each run found no orphaned worker.

## Files Created/Modified

- `scripts/trace-model.ts` (+ `.js`) - the completeness predicate and the gated plan; collectTraceNotes docstring and header updated
- `scripts/generate-runnable-embeds.ts` (+ `.js`) - planCompleteTraceTree in both trace rows, dated comment line
- `scripts/runnable-ref/trace-render.ts` (+ `.js`) - couldNotRunIncomplete; plan only from planCompleteTraceTree; stdout UNREADABLE lines dropped; header D-12 contract and NOTHING IS HIDDEN updated; regenerated region
- `scripts/runnable-ref/state-check.ts` (+ `.js`) - traceReport trace-not-compared per failure; TRACE FRESHNESS header; regenerated region
- `scripts/context-io.ts` (+ `.js`) - ENOENT-only absence test in the note walk
- `hooks/hook-entry.ts` (+ `.js`) - decider manifest regenerated for the new context-io.js hash
- `scripts/trace-model.test.ts` - partition, traceReadFailures, order, planCompleteTraceTree, two-runnable census
- `scripts/runnable-ref/trace-render.test.ts` - CR-01 describe, the READ-1 arm table, two rewritten cases
- `scripts/runnable-ref/state-check.test.ts` - CR-01 two-shape cases with and without the marker
- `scripts/context-io.test.ts` - the readContext walk case
- `install/mode-census.test.ts` - SCRIPTS_CHMOD_COUNT re-derived 33 -> 37

`scripts/nonblocking-reader-parity.test.ts` and `scripts/context-io-writer-set.test.ts` were not edited. Both ran with only their baseline failures (writer-set 2), so neither census counted the walk's changed call.

## Decisions Made

- When a note skip has an empty detail (vanished), the failure reason is `the reader could not read it (<arm>)`, so no stderr line or finding ends in an empty reason.
- state-check puts the arm in a note's finding text (`(<arm>: <reason>)`), matching trace-render's `UNREADABLE NOTE ... (<arm>)`.
- 37-REVIEW.md's suggestion of exit 1 for --check on an incomplete read was not adopted, as the plan says. Exit 2 is could-not-run, and trace-freshness and Workflow 05 already read it that way.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hook decider manifest regenerated**
- **Found during:** Task 2 (context-io related test run)
- **Issue:** `hooks/hook-entry.ts` pins the hash of every decider module, and `scripts/context-io.js` is one of them. After the walk change, the wrapper refused to run (`31-37 WR-36 route 0`: `Blocked (fail-closed): ... "scripts/context-io.js" does not match the frozen manifest`), and `freshness:hook-manifest` failed. The file is not in the plan's files_modified.
- **Fix:** `npm run generate:hook-manifest` (1 decider, 13 module hashes), committed with the change. Earlier phases did the same, for example 287aec2e.
- **Files modified:** hooks/hook-entry.ts, hooks/hook-entry.js
- **Verification:** WR-36 7 passed; `freshness:hook-manifest` fresh; floor-invariance passes once committed.
- **Committed in:** 608e4dff

**2. [Rule 3 - Blocking] Scripts chmod census pin**
- **Found during:** Task 2 regression
- **Issue:** `install/mode-census.test.ts` pins the chmod calls in top-level `scripts/*.test.ts` at 33, and it measured 37. Plan 37-20 added two calls in `trace-freshness.test.ts` and left this pin red, because its subset did not include the census. This plan added two in `context-io.test.ts`. All four are an access denial and its restore in a `finally`, and none sets a mode as evidence.
- **Fix:** pin moved to 37 with the per-file re-derivation in its docblock. No predicate changed.
- **Files modified:** install/mode-census.test.ts
- **Verification:** mode-census 15 passed.
- **Committed in:** 608e4dff

**3. [Rule 3 - Blocking] Regenerating embeds when the hand-written part already names a new root**
- **Found during:** Task 1
- **Issue:** the first step of `npm run generate:runnable-embeds` is a full `tsc`, which fails under `noEmitOnError` while the runnables call `planCompleteTraceTree` before it is embedded. That leaves the generator's own `.js` stale.
- **Fix (process only):** `npx tsc --noEmitOnError false`, then `node scripts/generate-runnable-embeds.js`, then `npm run build`. The committed `.js` files come from the final clean build, and freshness confirms them.
- **Committed in:** n/a (no code change)

**4. [Placement] Where the state-check assertions of the arm table live**
- The arm table runs the committed state-check.js host copy from inside `scripts/runnable-ref/trace-render.test.ts`, so each row checks all three commands against one fixture. `state-check.test.ts` holds the CR-01 two-shape cases with and without the marker. The census case is in `scripts/trace-model.test.ts`.

---

**Total deviations:** 3 auto-fixed (all Rule 3 blocking) and 1 placement note.
**Impact on plan:** all stay within the plan's truths, with no scope creep. The mode-census pin also clears a red that 37-20 left behind.

## TDD Gate Compliance

Task 2 is `tdd="true"`. Its RED was run and recorded above but not committed on its own: brief §3 forbids a red commit, and `workflow.tdd_mode` is off. Each task is one `fix(37-21)` commit. There is no `test(37-21)` / `feat(37-21)` pair.

## Issues Encountered

- Two regression failures (floor-invariance, capture-live P5) measure the working tree against HEAD. They are expected for any staged-but-uncommitted run and passed after the commit.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 37-25's read-site table can now rely on the trace read's single completeness predicate.
- REQUIREMENTS.md rows were not flipped (brief §3). SPLIT-03 and SPLIT-05 are shared with later round-1 plans.
- Ready for 37-22.

## Self-Check: PASSED

- FOUND: scripts/trace-model.ts holds `planCompleteTraceTree`; both runnables call it after EMBED_CLOSE (census case passes)
- FOUND: 29af2135 and 608e4dff are ancestors of HEAD
- Acceptance: `-t CR-01` 4 passed; the arm table ran 10 I/O rows plus 4 controls with the count asserted; the partition asserts 4 named members; freshness:runnable-embeds exits 0; own-tree state-check `trace.compared` true; trace-render.test.ts case count 27 -> 47; mutation reverts leave porcelain empty

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
