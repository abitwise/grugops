---
phase: "36"
plan: "04"
subsystem: testing
tags: [state-layout, board, dashboard, watch, fixed-subpaths, vitest]

requires:
  - phase: 36
    provides: "install/state-layout.ts (LEGACY_BOARD_REL, LEGACY_STATE_ROOT_REL) and scripts/state-path-scan.js, from plan 36-01; the board-corpus seed row from plan 36-02"
provides:
  - "board-tracer, board-corpus, board-read, board-watch and board-watch-live tests that reach every state path through FIXED_SUBPATHS from scripts/board-read.js"
  - "The board-tracer table case compares FIXED_SUBPATHS with an independent authority (LEGACY_BOARD_REL and the LEGACY_STATE_ROOT_REL tickets/traceability spellings); plan 36-06 flips both sides"
  - "Test-local STATE_DIR_REL (the POSIX dirname of FIXED_SUBPATHS.board) in board-tracer, board-read and board-watch tests; link plants AT the state directory create its parent first"
affects: [36-05, 36-06, 36-14]

actuals:
  tokens: 23100
  tasks: 2
  commits: 2
plan_head_before: 798ef03cdaf12e57c2749819272881219e1ce2d9
plan_head_after: 23180b4064db4081bb529fc9afdd9cf3b7d622f5

tech-stack:
  added: []
  patterns:
    - "A board test names the state directory as STATE_DIR_REL = posix.dirname(FIXED_SUBPATHS.board) and creates it with recursive: true"
    - "A link planted AT the state directory is preceded by mkdirSync(dirname(join(root, STATE_DIR_REL)), { recursive: true })"
    - "A relative climb-out symlink is computed with relative(<link directory>, <target>), never a typed count of '..' segments"
    - "A test name that quotes a state path is a template literal over the table, so it prints the same name today"

key-files:
  created: []
  modified:
    - scripts/board-tracer.test.ts
    - scripts/board-corpus.test.ts
    - scripts/board-read.test.ts
    - scripts/board-watch.test.ts
    - scripts/board-watch-live.test.ts

key-decisions:
  - "The table case compares tickets and traceability with `${LEGACY_STATE_ROOT_REL}/tickets` and `${LEGACY_STATE_ROOT_REL}/traceability.md` (state-layout has no LEGACY_TICKETS_REL); plan 36-06 flips them to TICKETS_REL and TRACEABILITY_REL"
  - "The tracer's claimed-first sentence reader is a RegExp built from the escaped FIXED_SUBPATHS.tickets; a mutation (prefixing the subpath) turned one tracer case red, so the reader still discriminates"
  - "board-watch ALL_SIX is sorted because armedRel is sorted, and the name-order case gained a PREMISE that STATE_DIR_REL sorts after .grugops/context, so a table value that sorts first reds the premise instead of passing vacuously"
  - "Host-path checks over armed watch directories go through toPosix (d.includes / d.endsWith STATE_DIR_REL), so a two-segment state directory cannot pass vacuously on a backslash host"
  - "board-watch-live.test.ts names the state directory only in a comment, so it gets no STATE_DIR_REL constant; its two board reads use FIXED_SUBPATHS.board"

patterns-established:
  - "Convert a state-path test spelling to the reader's table while the table still holds its pre-v3 values, so the suite stays green before and after the flip"

requirements-completed: [LAYOUT-02]

coverage:
  - id: D1
    description: "The board tracer reads the repository board, plants boards and tickets, and parses the claimed-first sentence through FIXED_SUBPATHS; the table case compares FIXED_SUBPATHS.board with LEGACY_BOARD_REL"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts (84 of 84, same count as before)"
        status: pass
      - kind: other
        ref: "grep -c 'FIXED_SUBPATHS.board).toBe(LEGACY_BOARD_REL)' scripts/board-tracer.test.ts (prints 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The corpus documentation-block rows name the repository board and traceability matrix through FIXED_SUBPATHS"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/board-corpus.test.ts (34 of 34, same count as before)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The read-seam and watch tests derive every planted, read and expected state path from FIXED_SUBPATHS and a test-local STATE_DIR_REL, with multi-segment-safe plants"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts (172 of 172), scripts/board-watch.test.ts (54 of 54), scripts/board-watch-live.test.ts (6 of 6), all the same counts as before"
        status: pass
      - kind: other
        ref: "node scripts/state-path-scan.js over all five files (exit 0, zero sites)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No production board module changed in this plan"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "git diff --name-only 798ef03cdaf12e57c2749819272881219e1ce2d9..HEAD -- scripts/board-read.ts scripts/board-model.ts scripts/board-dashboard.ts (exit 0, empty output)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 04: Board tracer, corpus, read-seam and watch tests follow the reader's path table Summary

**The five board test files now reach the board, the ticket tree, the traceability matrix and the state directory only through `FIXED_SUBPATHS` from `scripts/board-read.js`. All 350 cases still pass with the same per-file counts, and the state-path scan over the five files went from 242 sites to 0. Plan 36-06 can now move the state root by changing the table, the fixture and the repository, without editing these tests.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-21T07:39:04Z
- **Completed:** 2026-10-21T07:52:35Z
- **Tasks:** 2 (Task 1 a tracer)
- **Files modified:** 5

## Accomplishments

- **Tracer (Task 1).** `readBoard()`, the four PREMISE messages, every board and ticket plant and `repoSubpath` use `FIXED_SUBPATHS`. Its local `BOARD_REL` literal is deleted. The table case now reads `expect(FIXED_SUBPATHS.board).toBe(LEGACY_BOARD_REL)`, with tickets and traceability compared against `${LEGACY_STATE_ROOT_REL}/...`. A comment says plan 36-06 flips both sides. The claimed-first sentence reader is a RegExp built from the escaped `FIXED_SUBPATHS.tickets`.
- **Corpus (Task 1).** The repository-board and traceability documentation-block rows use `FIXED_SUBPATHS.board` and `.traceability`. Two comments no longer spell the old path.
- **Read seam (Task 2).**
  - `STATE_DIR_REL` is used for the 82 sites: plants, `settleSource` display paths, expected message substrings, the denied-listing label, the routing-census probe programs (now built with `JSON.stringify` of the table values), seven test names (now template literals that print the same names) and comments.
  - The ancestor-symlink case creates the state directory's parent before it links.
  - The relative climb-out symlink is `relative(<ticket dir>, outsideFile)` instead of two typed `".."` segments. The old form assumed a one-segment state directory.
- **Watch (Task 2).**
  - All 135 sites are converted, including the 59 harness `"plans"` arguments and the three linked-state-directory plants (each now creates parents on both sides).
  - The renamed-subpath case uses `${STATE_DIR_REL}/cards`. `ALL_SIX` is sorted.
  - The name-order case gained a PREMISE. `includes`/`endsWith` over host paths go through `toPosix`.
- **Watch live (Task 2).** The two board reads use `FIXED_SUBPATHS.board`, and one comment was reworded.

## Task Commits

1. **Task 1: tracer, the board tracer reads the repository board through the reader's table**: `9ab8a163` (test). Tracer gate: interactive mode, `end-of-phase`, automated-only verify. Typecheck, both files and the scan were re-run end-to-end and passed (`⚡ Tracer verified end-to-end — expanding`) before Task 2.
2. **Task 2: the read-seam and watch tests derive every state path from the table**: `23180b40` (test)

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Acceptance evidence

| Check | Baseline at 798ef03c | After |
|-------|----------------------|-------|
| `grep -c 'FIXED_SUBPATHS.board).toBe(LEGACY_BOARD_REL)' scripts/board-tracer.test.ts` | 0 | 1 |
| scan, board-tracer.test.ts | 17 sites | 0 |
| scan, board-corpus.test.ts | 4 sites (plan said 5; plan 36-02 already converted the seed row) | 0 |
| scan, board-read.test.ts | 82 sites | 0 |
| scan, board-watch.test.ts | 135 sites | 0 |
| scan, board-watch-live.test.ts | 4 sites | 0 |
| vitest cases, tracer / corpus / read / watch / watch-live | 84 / 34 / 172 / 54 / 6 | 84 / 34 / 172 / 54 / 6 |
| `git diff --name-only 798ef03c..HEAD -- scripts/board-read.ts scripts/board-model.ts scripts/board-dashboard.ts` | n/a | exit 0, empty output |

START recorded before Task 1: `798ef03cdaf12e57c2749819272881219e1ce2d9`.

## Probe: the derivation under the v3 table values (informational, reverted)

To check the plants work for a two-segment state directory, the committed `scripts/board-read.js` table was temporarily set to `memory-bank/plans/...` and then restored with `git checkout -- scripts/board-read.js`. The diff was empty afterwards. Board-read, board-watch and board-tracer: 28 failed, 282 passed. Every failure belongs to work plan 36-06 owns:

- **The repository's own board and traceability matrix are still at the pre-v3 root.** Tracer real-board cases, the CLI cases, and the read case for the "REAL traceability" file.
- **`scripts/fixtures/board-snapshot` still has the pre-v3 layout.** Every `withLinkedTree` and `withFixtureCopy` case, and "6. the committed fixture tree".
- **The table case itself fails**, as designed, until both sides flip.
- **`scripts/board-model.ts` hard-codes `plans/tickets/` in published sentences.** Example: `plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)`, which reddened two read cases. The claimed-first sentence at board-model.ts:1476 is spelled the same way. Plan 36-06 has to route those messages through the table, or these tests correctly stay red.

Every scratch-tree plant passed under the two-segment values. That covers the link at the state directory, the relative climb-out link, and the in-root directory link.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The relative climb-out symlink assumed a one-segment state directory**
- **Found during:** Task 2
- **Issue:** `join("..", "..", relative(dir, outsideFile))` counts two levels from the ticket directory to the tree root. Under a two-segment state directory the link would point inside the tree, and the "refuses a RELATIVE symlink" case would stop measuring an escape.
- **Fix:** `relative(join(dir, FIXED_SUBPATHS.tickets), outsideFile)`. This gives the same string today and climbs the right number of levels for any depth.
- **Files modified:** scripts/board-read.test.ts
- **Committed in:** 23180b40

**2. [Rule 2 - Missing critical] Two watch assertions would pass vacuously under a different table value**
- **Found during:** Task 2
- **Issue:** `ALL_SIX` was hand-ordered to match the sorted `armedRel`. The name-order case also relied, without saying so, on the state directory sorting after `.grugops/context`. With derived values, either one could silently change meaning.
- **Fix:** `ALL_SIX` is `.sort()`ed, and a PREMISE assertion states the sort relationship. Both are equal or stronger than before; no case was loosened.
- **Files modified:** scripts/board-watch.test.ts
- **Committed in:** 23180b40

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical). **Impact on plan:** no scope creep. Both keep a converted case meaning the same thing when the table changes.

## Issues Encountered

- **Targeted runs only.** No full suite, per the project rules. The orchestrator schedules full runs at plans 06, 10 and 14.
- **Related files run green.**
  - Ten test files passed 1059 of 1059: the plan's six verification files, plus validate.test.ts, check-foundation-guards.test.ts, board-oracle.test.ts and install/mode-census.test.ts, which each name these test files.
  - Each of these exited 0: `node scripts/check-foundation-guards.js`, `node scripts/check-platform-shapes.js`, `node scripts/check-nul-bytes.js` and `node scripts/check-uat-oracles.js`.

## Plan-level verification

1. `npx vitest run` over board-tracer, board-corpus, board-read, board-watch, board-watch-live and board-readonly: all passed (inside the ten-file run above).
2. `npm run freshness`: exit 0 ("All build outputs fresh: 78 committed .js file(s) match a rebuild of their sources").
3. `node scripts/check-nul-bytes.js` and `node scripts/check-uat-oracles.js`: each exit 0.
4. `git branch --show-current`: `main`.

## User Setup Required

None.

## Next Phase Readiness

- Plan 36-05 converts the dashboard and model tests and the path-agnostic examples.
- Plan 36-06 flips `FIXED_SUBPATHS` and both sides of the tracer table case. Per the probe above, it also has to move the repository state, move `scripts/fixtures/board-snapshot`, and change the `plans/tickets/` sentences in `scripts/board-model.ts`.
- LAYOUT-02 spans plans 01 to 14 and stays In Progress. It is not marked complete here.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: scripts/board-tracer.test.ts, scripts/board-corpus.test.ts, scripts/board-read.test.ts, scripts/board-watch.test.ts, scripts/board-watch-live.test.ts
- FOUND commits: 9ab8a163, 23180b40
