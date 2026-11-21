---
phase: 37-overview-board-per-file-records-and-budgets
plan: 30
subsystem: state-roll
tags: [read-1, d-18, state-roll, entry-presence, enoent-census, gap-closure]
status: complete

requires:
  - phase: 37
    provides: "plan 37-28 entryPresence (the one absence owner), plan 37-29 ENOENT census over trace-render.js and state-check.js, plan 37-25 READ-1 EIO table"
provides:
  - "state-roll's realDirectoryOrNull and readTextOrThrow ask the generated entryPresence: a dangling link at a state path or at an ancestor is a refusal by name with the owner's reason, never absent"
  - "The ENOENT one-owner census covers all three committed runnables (2, 2 and 2)"
  - "The readRegularFileOrNull comment no longer calls a dangling link's open ENOENT 'nothing here'; the regions and the hook manifest are regenerated"
affects: [37-31, 37-32]

actuals:
  tokens: 13900
  tasks: 2
  commits: 3
plan_head_before: 7380e947db2dc327324f2600212b6d111c9dfad5
plan_head_after: 4e5f48cfe1fb6db844a42d41a428f70bf7464c72

tech-stack:
  added: []
  patterns:
    - "All three runnables take every absence answer from the one generated entryPresence; a reader null after a present answer is a refusal (vanished)"
    - "A position whose own via collapsed into the owner's direct caller keeps an EIO row by matching the derived caller line anywhere on the stack"

key-files:
  created: []
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/context-io.ts
    - hooks/hook-entry.ts

key-decisions:
  - "state-roll's unreadable message reads `<what> <rel> cannot be inspected: <owner reason>.` in realDirectoryOrNull and `<rel> cannot be inspected: <owner reason>` in readTextOrThrow, the same shape as trace-render's"
  - "The dangling-link rows also cover the state directory and the memory bank directory (an ancestor of every state path), besides the plan's four positions (brief §2.1: the whole class)"
  - "The roll's re-read position keeps its own EIO row (fault on entryPresence:lstatSync#0 while the stack holds io.read's derived call line), because the owner's rows are keyed by its direct caller and fire at the first planning read"

patterns-established:
  - "Only the owner's absent is missing, in all three runnables"

requirements-completed: [SPLIT-03, SPLIT-06]

coverage:
  - id: D1
    description: "A dangling link at the archive directory, the Done archive, the progress file, the progress archive and the state directory is exit 2 naming the path with the owner's reason, in write mode and --dry-run, tree digest unchanged; a dangling memory-bank (an ancestor) is exit 2 by the link, never 'does not exist'"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — a dangling link at an archive or progress position is refused by name, never absent (plan 37-30, D-18)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every pre-existing state-roll refusal and outcome is unchanged (symbolic-link board, outside-root archive directory, FIFO Done archive, U+FFFD, rollbacks)"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts (56 tests, 34 pre-existing unchanged)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One-owner census over trace-render.js, state-check.js and state-roll.js: ENOENT compared only in entryPresence and readRegularFileOrNull (2, 2, 2), no throwIfNoEntry or withFileTypes property"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/read-sites.test.ts#READ-1 one owner (plan 37-29, D-18): ENOENT is compared only inside entryPresence and readRegularFileOrNull"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 EIO table re-derived for state-roll (11 to 10 sites), both equalities held, SR-8 found by its derived key, the re-read position kept by its own row"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/read-sites.test.ts (176 tests)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#SR-8"
        status: pass
    human_judgment: false
  - id: D5
    description: "readRegularFileOrNull's comment states the owner rule (behavior unchanged); regions, stamps and the hook manifest fresh"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "npm run -s freshness:runnable-embeds && npm run -s freshness:hook-manifest && npm run -s freshness"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-23
---

# Phase 37 Plan 30: state-roll on the one absence owner, and the census over all three runnables Summary

**state-roll's `realDirectoryOrNull` and `readTextOrThrow` now ask the generated `entryPresence`, so "is this path present" has one answer in trace-render, state-check and state-roll. A dangling link at an archive, progress or state-directory position is refused with the owner's reason. A dangling `memory-bank` used to print "the state directory memory-bank/plans does not exist; install grugops first". It now names the unreachable link. The ENOENT census covers all three committed runnables.**

## Performance

- **Duration:** about 30 min
- **Started:** 2026-10-23T21:37:22Z
- **Completed:** 2026-10-23T22:07:32Z
- **Tasks:** 2 of 2 (plus one test-only follow-up commit)
- **Files modified:** 14 distinct paths over three commits

## Accomplishments

- The state-roll row of EMBED_SPECS now lists `entryPresence` among its context-io roots, and the comment has a dated plan 37-30 line. All three regions and stamp lines were regenerated. `realDirectoryOrNull` uses trace-render's mapping: absent is null, unreadable is could-not-run naming the position, the path and the owner's reason, and outside-root and not-a-directory are refused as before. `readTextOrThrow`: absent is null and unreadable throws the owner's reason. A present link keeps `a roll would replace the link with a file`, and a present non-regular entry keeps its refusal. A reader null after a present answer throws `<rel> was present and then could not be found, so it was not read`. The U+FFFD refusal stays. The hand-written lstat decisions are removed, and the header's THE ROOT IS A BOUNDARY paragraph is updated.
- New dangling-link rows: the plan's four positions plus the state directory, each in write mode and in `--dry-run`. Each asserts exit 2, empty stdout, the path named, `Nothing was rolled.` and an unchanged `treeDigest`, and a second row per case asserts the owner's reason. Two more rows cover a dangling `memory-bank` (an ancestor of every state path).
- The census (`ONE_OWNER_RUNNABLES`) now includes `state-roll`, with `ENOENT_COMPARISONS` pinned at 2: `readRegularFileOrNull:1023` and `entryPresence:1087`.
- The readRegularFileOrNull comment now says that open(2) reports a dangling link's target as ENOENT, so this reader cannot tell a missing path from a dangling link, and that a caller asks entryPresence first and treats a later null as a vanished path. The function's behavior is unchanged. The hook manifest pins the new `scripts/context-io.js` hash (`e14c8a49…` became `6e7e9ef8…`).

## Task Commits

| Commit | Task | Hand-edited files | Generated or compiled files |
|--------|------|-------------------|-----------------------------|
| `a20d6052` (fix) | 1: state-roll on the owner, its dangling rows, the census (tracer) | 4 (generate-runnable-embeds.ts, state-roll.ts, state-roll.test.ts, read-sites.test.ts) | 6 (generate-runnable-embeds.js, state-roll.js, the regions and stamps of trace-render.ts and state-check.ts with their .js) |
| `394e665d` (fix) | 2: the reader's comment, regions and hook manifest | 1 (context-io.ts) | 9 (context-io.js, the three regions with their .js, hook-entry.ts and .js) |
| `4e5f48cf` (test) | follow-up to Task 1: the roll's re-read EIO row | 1 (read-sites.test.ts) | 0 |

Tracer feedback gate: after `a20d6052`, the tracer verify was re-run on the committed tree (interactive, end-of-phase, automated-only verify). Typecheck, freshness:runnable-embeds, freshness and the 4 test files (250 tests) all passed.

## Outcome of each new row before the change (committed runnables at 7380e947)

| Row | Before | Message before |
|-----|--------|----------------|
| archive directory, both modes: exit 2 naming the path, digest unchanged | green | `the archive directory memory-bank/plans/archive cannot be resolved (ENOENT).` |
| Done archive, progress file, progress archive, both modes: same | green | `<rel> is a symbolic link, and a roll would replace the link with a file.` |
| state directory, both modes: same | green | `the state directory memory-bank/plans cannot be resolved (ENOENT).` |
| each of the five positions, both modes: carries the owner's reason | red (10) | wording only; none named the unreachable target |
| dangling `memory-bank`, both modes | **red (2): defect found** | `the state directory memory-bank/plans does not exist; install grugops first.` The dangling ancestor was read as absence. The exit code was 2, but the message told the human to install grugops |
| census, state-roll.js | red | 3 comparisons: `readRegularFileOrNull:1017`, `realDirectoryOrNull:1171`, `readTextOrThrow:1208` |

After the change, all rows pass. The memory-bank row now reads `the state directory memory-bank/plans cannot be inspected: a symbolic link on the path has a target that cannot be reached: "…/memory-bank" (ENOENT).`

## Mutation proofs (working tree only, never committed)

| Proof | Mutation | Result | Restore |
|-------|----------|--------|---------|
| (a) | a hand-written `try { nodeFs.lstatSync(path) } catch (e) { if (codeOf(e) === "ENOENT") return null; }` at the top of `readTextOrThrow` | census red: `state-roll.js decides absence outside the owner: expected [ 'readTextOrThrow:1265' ] to deeply equal []` | restored from a scratch copy and rebuilt; sha1 of state-roll.ts and .js matched the pre-mutation copies |
| (b) | `readTextOrThrow` returns null for the owner's unreadable | 12 of the 22 dangling rows in state-roll.test.ts red. The re-read row stayed green, because executeRoll's pre-write re-read compares the text it reads with the planned text and refuses a mismatch, so a null is refused there too (defense in depth, not a gap) | `git checkout -- scripts/runnable-ref/state-roll.ts` on the committed file, rebuilt |

After each restore, `git status --porcelain scripts/runnable-ref scripts/generate-runnable-embeds.ts` showed only this plan's own uncommitted edits, and none after the last commit.

## READ-1 table: removed (key, via) rows and their replacements

| Removed (state-roll) | Replaced by |
|----------------------|-------------|
| `realDirectoryOrNull:lstatSync#0` via `<top>#0`, `#1`, `#2`, `#3` | `entryPresence:lstatSync#0 via realDirectoryOrNull#0` |
| `realDirectoryOrNull:realpathSync#0` via `<top>#0`, `#1`, `#3` (all modes) and `<top>#2` (write, dry-run) | `entryPresence:realpathSync#0 via realDirectoryOrNull#0` |
| `realDirectoryOrNull:statSync#0` via the same | `entryPresence:statSync#0 via realDirectoryOrNull#0` |
| `readTextOrThrow:lstatSync#0 via readText#0` | `entryPresence:{lstatSync,statSync,realpathSync}#0 via readTextOrThrow#0` |
| `readTextOrThrow:lstatSync#0 via io.read#0` (write, write-new-archive) | the new row `READ-1 table: the roll's re-reads under the absence owner`: `entryPresence:lstatSync#0` with the stack holding io.read's call line, found by `callingSites`. Write and write-new-archive give exit 2 (`the files could not be re-read before the roll: … "/" cannot be inspected (EIO). The Done roll wrote nothing.`); dry-run is not reached |

Pins: state-roll went from 11 to 10 read sites, with a dated history line. trace-render (12) and state-check (15) are unchanged. Both two-sided equalities hold, and UNREACHED_SITES stays at 0. The owner's callers are named once in `SR_PRESENCE_CALLERS`. SR-8 (`<top>:realpathSync#1`) is found by its derived key, so runnable-exit-contract.test.ts is unchanged. Task 2's comment moved no pin. read-sites.test.ts has 176 tests, all passing.

## Class table (READ-1, the rows this plan closes), final state

| Runnable | Site | Final state | Covered by |
|----------|------|-------------|------------|
| state-roll | `<top>` root reads, post-mkdir realpath (SR-8) | unchanged, compliant | EIO rows; SR-8 |
| state-roll | realDirectoryOrNull | on entryPresence; a dangling path or ancestor is exit 2 with the owner's reason | a20d6052: dangling rows (state directory, archive directory, memory-bank), EIO rows via realDirectoryOrNull#0 |
| state-roll | readTextOrThrow | on entryPresence; a reader null after present is a refusal; link, non-regular and U+FFFD refusals unchanged | a20d6052: dangling rows (Done archive, progress file, progress archive), census, mutation (a); 4e5f48cf: re-read row; ENOENT vanish rows in 37-31 |
| region (all three) | readRegularFileOrNull open ENOENT null | behavior unchanged (kit-wide authority); every runnable caller asks the owner first and refuses a null; comment corrected | 394e665d; ENOENT rows 37-31 |
| census (each committed runnable .js) | ENOENT comparisons, throwIfNoEntry, withFileTypes | trace-render 2, state-check 2, state-roll 2; no forbidden property | a20d6052 |

## Census edits (Task 1 step 5)

None. The four census test files (nonblocking-reader-parity, context-io-writer-set, check-foundation-guards, generate-runnable-embeds) were run after the Task 1 build: 555 passed and 2 failed. The 2 failures are the 37-BASELINE.md entries `31-14 — the register's decline enumeration equals the derived set` (2). No census counted the new root.

## Regression comparison

The derived subset was 38 files, the same as in plan 37-29. It ran once, with one worker, on the final Task 2 content before its commit, in 967 s: 4,056 passed, 10 failed, 1 skipped (4,067). All 10 failures are 37-BASELINE.md entries: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 (1) and 31-29 (6). No failure falls outside the baseline. The re-read row commit (4e5f48cf) came after this run. It adds 4 tests to read-sites.test.ts, and that file passed on its own (176 tests).

Gates on the committed tree: `npm run build`, `npm run typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest` and `freshness:traceability` all exit 0. `check-foundation-guards.js`, `check-state-paths.js` and `check-nul-bytes.js` each print `ALL CHECKS PASSED`, and so does `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. `node scripts/runnable-ref/state-check.js .` prints `No findings.`, and `--json` gives `trace.compared` true.

Acceptance: `sed -n '/function readRegularFileOrNull/,/^}/p' scripts/context-io.ts | grep -c 'correctly "nothing here"'` prints 0, and the same region piped to `grep -c entryPresence` prints 1.

## Decisions Made

- The unreadable refusal keeps trace-render's shape: `<what> <rel> cannot be inspected: <reason>.` The owner's reason already carries the errno code.
- The dangling rows cover the state directory and memory-bank besides the plan's four positions. The memory-bank row is the one that found the defect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A dangling memory-bank ancestor was read as absence in state-roll's message**
- **Found during:** Task 1 step 1 (the tests-first run)
- **Issue:** With `memory-bank` a dangling link, `realDirectoryOrNull`'s lstat of `memory-bank/plans` got ENOENT and returned null, so state-roll printed "does not exist; install grugops first". The exit code was 2, but the reason was wrong.
- **Fix:** Closed by the planned move to entryPresence. Two new rows assert the link is named and "does not exist" is never printed.
- **Files modified:** scripts/runnable-ref/state-roll.ts, scripts/runnable-ref/state-roll.test.ts
- **Committed in:** a20d6052

**2. [Rule 2 - Missing critical] The roll's re-read position kept its own EIO row**
- **Found during:** writing the removed-to-replacement map
- **Issue:** The owner's rows are keyed by its direct caller `readTextOrThrow#0`, and the preload fires at the first match (the board's planning read). So the former `readTextOrThrow:lstatSync#0 via io.read#0` position would no longer be failed by any row, which weakens the table, against the plan's prohibition.
- **Fix:** A row that fails `entryPresence:lstatSync#0` only while the stack holds io.read's derived call line (from `callingSites`), in all three modes.
- **Files modified:** scripts/runnable-ref/read-sites.test.ts
- **Committed in:** 4e5f48cf (a third commit, test-only; the plan named one commit per task)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical). **Impact on plan:** both close READ-1 arms of the same class. No file outside files_modified changed.

## Issues Encountered

- `pgrep -fl vitest` showed vitest processes of another project (`oeselg-labs/platform`) and shells in `grugops-examples`. None was a grugops worker, and all were left alone.
- One scratch shell command was blocked by the harness's rm safety check (an unquoted variable target). It was rewritten with `unlink "${R:?}/…"` and did not touch the repository.

## Known Stubs

None.

## Threat Flags

None. T-37-67 is mitigated as planned: readTextOrThrow is on entryPresence, a reader null after present is a refusal, the dangling rows compare treeDigest, and the census covers state-roll.js. The vanish window itself is reached by plan 37-31's ENOENT rows.

## User Setup Required

None.

## Next Phase Readiness

Ready for 37-31, which adds the ENOENT rows that reach the vanish window, and 37-32, which runs the full non-e2e suite.

## Self-Check: PASSED

- FOUND: scripts/runnable-ref/state-roll.ts, scripts/runnable-ref/state-roll.test.ts, scripts/runnable-ref/read-sites.test.ts, scripts/generate-runnable-embeds.ts, scripts/context-io.ts, hooks/hook-entry.ts
- FOUND: a20d6052, 394e665d, 4e5f48cf (all ancestors of HEAD)
- Commits measured: `git rev-list --count 7380e947..4e5f48cf` = 3

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
