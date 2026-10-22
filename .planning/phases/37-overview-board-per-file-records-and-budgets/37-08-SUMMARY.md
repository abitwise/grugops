---
phase: 37-overview-board-per-file-records-and-budgets
plan: 08
subsystem: traceability
tags: [trace-render, trace-freshness, ci, directory-compare, split-03, full-run]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-07: scripts/runnable-ref/trace-render.js `<repo-root> [--check]` (exit 0 / 1 / 2), compareTraceTree and ownedTraceEntries in scripts/trace-model.ts"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-06: the host runnable and scripts/trace-model.ts"
provides:
  - "scripts/trace-render.ts: the own-tree command `node scripts/trace-render.js [--check]`, a wrapper that runs the committed host runnable on the repository root and exits with its code (TRACE_RUNNABLE_REL, childExitCode, runnableArgs)"
  - "scripts/trace-freshness.ts: a directory-compare freshness gate through the runnable's --check (freshnessVerdict); only exit 0 is fresh"
  - "grugops's own memory-bank/plans/traceability.md is the zero-row generated index; memory-bank/plans/traceability/.gitkeep keeps the trace directory"
  - "`npm run freshness:traceability` runs in the ubuntu gate block of .github/workflows/ci.yml"
affects: [37-09, 37-13, 37-19]

actuals:
  tokens: 27650
  tasks: 1
  commits: 4
plan_head_before: 8827dec0f21cd15154fe070d92c270b2ef8126f5
plan_head_after: e5fa1a999af12b970f8a7992b6dc1e75cb5782d8

tech-stack:
  added: []
  patterns:
    - "An own-tree command that has a host twin is a thin wrapper that spawns the committed runnable, so the repository and hosts run one program"
    - "A freshness gate maps exit codes through one exported verdict function: only the child's exit 0 is fresh, and a signal or spawn error is could-not-run"
    - "A census over source text admits a verbatim embedded copy by where it sits (inside a fresh generated region of an EMBED_SPECS target), never by file name, with a control case for stale, non-target and out-of-region copies"

key-files:
  created:
    - memory-bank/plans/traceability/.gitkeep
  modified:
    - scripts/trace-render.ts
    - scripts/trace-render.js
    - scripts/trace-render.test.ts
    - scripts/trace-freshness.ts
    - scripts/trace-freshness.js
    - scripts/trace-freshness.test.ts
    - scripts/context-io.test.ts
    - scripts/board-readonly.test.ts
    - memory-bank/plans/traceability.md
    - .github/workflows/ci.yml
    - scripts/board-corpus.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.test.ts
    - scripts/check-claim-anchors.test.ts
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/validate.test.ts

key-decisions:
  - "scripts/trace-render.ts accepts no argument or exactly `--check`; anything else is exit 2 before a spawn. It keeps a named import of TRACEABILITY_REL from install/state-layout.js (used in its could-not-run message), so it stays in AUTHORITY_IMPORTERS and scripts/check-state-paths.test.ts needed no edit"
  - "TRACE_RUNNABLE_REL is declared once, in scripts/trace-render.ts; scripts/trace-freshness.ts imports it"
  - "The trace-freshness test uses the kit seed matrix (agent-factory/seed/memory-bank/plans/traceability.md) as its hand-written index, so the no-vacuous-pass case does not depend on git history"
  - "The frontmatter local-grammar census applies the generated-region rule (37-03, 37-06, D-16) to the note reader embedded in scripts/runnable-ref/trace-render.ts, rather than adding the runnable to the expected member list"

patterns-established:
  - "Thin own-tree wrapper over a committed host runnable, with an exported exit-code mapping that a test drives directly"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "node scripts/trace-render.js writes the same index and trace files the runnable writes for the same notes (temp mirror built from jsImportClosure), passes --check's exit 0, 1 and 2 through, refuses other arguments with exit 2 and writes nothing, and maps a missing exit code or spawn error to exit 2; its closure holds neither trace-model.js nor context-io.js"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/trace-render.test.ts#trace-render.js — the own command runs the host runnable, and holds no trace logic (5 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "trace-freshness: fresh tree exit 0 with a fresh line; one changed byte, a deleted trace file and an extra generated trace file each exit 1 naming the file; a .gitkeep is not named and its bytes are unchanged; a hand-written index with no notes exits 1, the zero-row index exits 0, no index exits 1 naming it; an absent root and a root without the state directory exit 1 with the could-not-run line; the verdict mapping never turns 2, a signal or a spawn error into fresh"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/trace-freshness.test.ts (12 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "`npm run freshness:traceability` is one command line in the ubuntu gate block of ci.yml and package.json declares the script; the ubuntu-block reader pin moves to 6"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-freshness.test.ts#wired at both ends; scripts/check-foundation-guards.test.ts#(r-class-authority)"
        status: pass
    human_judgment: false
  - id: D4
    description: "This repository's memory-bank/plans/traceability.md is the zero-row generated index, the trace directory exists through .gitkeep, and both `npm run freshness:traceability` and `node scripts/runnable-ref/trace-render.js . --check` exit 0"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "npm run freshness:traceability && node scripts/runnable-ref/trace-render.js . --check (both exit 0); head -1 memory-bank/plans/traceability.md (generated header)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mid-phase full run 1 of 2: no failure outside 37-BASELINE.md after this plan's fixes; all 20 baseline failures still fail and none now passes"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1 --shard=N/6 for N=1..6, then a re-run of every file changed after its shard"
        status: pass
    human_judgment: false

duration: 48min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 08: The own tree renders its trace with the host program, and CI proves it fresh Summary

**`node scripts/trace-render.js` is now a wrapper that runs the committed host runnable `scripts/runnable-ref/trace-render.js` on this repository and exits with its code. `scripts/trace-freshness.ts` runs the runnable's `--check` and treats only its exit 0 as fresh. This repository's hand-written matrix is replaced by the zero-row generated index, and `npm run freshness:traceability` now runs in the CI ubuntu gate block. The mid-phase full run found 8 new failures in 6 files. All 8 are fixed, and 7 of them came from plans 37-02, 37-03 and 37-06.**

## Performance

- **Duration:** about 48 min, most of it the full suite (6 shards, about 28 min in all)
- **Started:** 2026-10-22T12:53:12Z
- **Completed:** 2026-10-22T13:41:16Z
- **Tasks:** 1 (tracer), plus 3 deviation-fix commits from the full run
- **Files modified:** 20

## Accomplishments

- **One program renders.** The body of `scripts/trace-render.ts` is now a spawn of `process.execPath` on the runnable, with stdio inherited. The repository root comes from `import.meta.dirname`.
  - The only argument it accepts is `--check`.
  - A run with no exit code, or a spawn error, is exit 2 with a line on stderr.
  - The old renderer is gone, together with its `buildRows` and `renderTraceability` exports.
- **A directory compare, wired in CI.** `scripts/trace-freshness.ts` keeps `main()`, the `isEntrypoint` guard and `CHECK_ROOT`. Its verdict is the exported `freshnessVerdict`:
  - exit 0 is fresh;
  - exit 1 is STALE, with the remedy `node scripts/trace-render.js` and commit;
  - anything else prints `Traceability freshness check FAILED: the render could not run (...)` and exits 1.
  - Deleted: the mirror copy, the greenfield vacuous pass ("nothing committed to drift") and the single-file byte compare.
- **The own tree.** The old matrix was removed with `git rm`. Git history keeps it, and the kit seed copy under `agent-factory/seed/` is untouched. `memory-bank/plans/traceability/.gitkeep` was created, and `node scripts/trace-render.js` wrote the zero-row index. The gate exits 0 with the keeper present. The 37-07 owned-entry rule holds, so `trace-model.ts` needed no change.
- **CI.** `npm run freshness:traceability` runs in the ubuntu gate run block after `freshness:runnable-embeds`, with a comment. No new step was added.
- **Tests.**
  - `scripts/trace-freshness.test.ts` and `scripts/trace-render.test.ts` are rewritten (17 cases).
  - The context-io R1 six-routes case now calls `trace-model.js` `buildTraceRows(mod.readContext(T, ctx))`. It still asserts that the hand-written note's ABC-002 yields no row.
  - Each board-readonly pin was re-derived by listing, with a dated reason:
    - the `scripts/trace-render.js` closure row is now 3 modules;
    - `WALKER_PRODUCTION_IMPORTER_COUNT` moves from 6 to 5 (trace-freshness.ts left);
    - `WALKER_IMPORTER_COUNT` stays at 10, but its members change (trace-freshness.ts left, trace-render.test.ts joined).

## Task Commits

1. **Task 1 (tracer): own command, own index, CI gate:** `96bdb0df` (feat)
2. **Full-run fixes: pins moved by the own index, and the pure lookahead from 37-02/37-03:** `e80c75bc` (fix)
3. **Full-run fixes: frontmatter census generated-region rule (37-06), isEntry pin (37-03):** `e951bf03` (fix)
4. **Full-run fix: the "two hosts" comment from 37-02:** `e5fa1a99` (fix)

**Plan metadata:** recorded in the docs(37-08) completion commit.

Tracer gate: the run is interactive, `human_verify_mode` is `end-of-phase`, and the verify block holds only automated checks. So the verify commands were re-run after the commit (all exit 0), with no checkpoint.

## Files Created/Modified

- `scripts/trace-render.ts`, `.js`: the wrapper.
- `scripts/trace-freshness.ts`, `.js`: the `--check` gate.
- `scripts/trace-render.test.ts`, `scripts/trace-freshness.test.ts`: rewritten.
- `scripts/context-io.test.ts`: the R1 trace route now goes through the model.
- `scripts/board-readonly.test.ts`: the closure row and walker pins, re-derived.
- `memory-bank/plans/traceability.md`: the generated index. `memory-bank/plans/traceability/.gitkeep`: the keeper.
- `.github/workflows/ci.yml`: one line and a comment in the ubuntu block.
- Full-run fixes: `scripts/board-corpus.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/frontmatter.test.ts`, `scripts/check-claim-anchors.test.ts`, `scripts/state-rules.ts`/`.js`, `scripts/runnable-ref/state-check.ts`/`.js` (regenerated region), `scripts/validate.test.ts`.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] board-corpus read a documentation block that this plan removed**
- **Found during:** full run, shard 1.
- **Issue:** `DOC_BLOCK_FILES` read the first comment block of the own `memory-bank/plans/traceability.md`. The generated index has no comment block.
- **Fix:** the third row now reads the seed matrix `agent-factory/seed/memory-bank/plans/traceability.md`, the same way the second row reads the seed board. A dated note explains why.
- **Committed in:** e80c75bc.

**2. [Rule 3 - Blocking] The ubuntu-block reader pin moved**
- **Found during:** full run, shard 1.
- **Issue:** the new wiring case in trace-freshness.test.ts imports the CI-block authority, so `UBUNTU_BLOCK_READER_COUNT` went from 5 to 6.
- **Fix:** the pin moved, with a dated reason.
- **Committed in:** e80c75bc.

**3. [Rule 1 - Bug, plans 37-02 and 37-03] A pure zero-width lookahead under scripts/**
- **Found during:** full run, shard 2 (`check-uat-oracles`, closed lookahead class).
- **Issue:** `grouped()` in `scripts/state-rules.ts` (37-02) used `/\B(?=(\d{3})+(?!\d))/g`. So did its embedded copy in `runnable-ref/state-check.ts` (37-03) and one line of `validate.test.ts` (37-02).
- **Fix:** `/(\d)(?=(\d{3})+$)/g` with `"$1,"`. It consumes a digit, and gives the same output for every integer; 15 values were compared, including negatives and 2^53-1. The region was regenerated and is fresh.
- **Committed in:** e80c75bc.

**4. [Rule 3 - Blocking, plan 37-03] The isEntry guard census pin**
- **Found during:** full run, shard 3 (`check-claim-anchors`).
- **Issue:** the pin expected 17 guard sources and found 19. The new ones are `generate-runnable-embeds.ts` and `runnable-embeds-freshness.ts`, and both delegate to `isEntrypoint`.
- **Fix:** the pin moves to 19 and was re-derived by grep, with a dated reason.
- **Committed in:** e951bf03.

**5. [Rule 3 - Blocking, plan 37-06] The frontmatter local-grammar census counted the embedded note reader**
- **Found during:** full run, shard 4 (3 cases in `frontmatter.test.ts`).
- **Issue:** `scripts/runnable-ref/trace-render.ts` carries context-io's note reader in its generated region, so the census saw a second grammar.
- **Fix:** the census reads each file with the fresh generated region of an EMBED_SPECS target set aside. This is the rule 37-03, 37-06 and D-16 use: a copy is admitted by where it sits, never by name. A new control case proves three things:
  - read whole, the runnable is a grammar site;
  - a stale region, a module that is not a target, and a grammar planted outside the region are all still counted;
  - the expected member set stays `["scripts/context-io.ts"]`.
- **Committed in:** e951bf03.

**6. [Rule 1 - Bug, plan 37-02] A host count in a comment**
- **Found during:** full run, shard 6 (`install/host-tools-prose.test.ts`, Rule A).
- **Issue:** the `compareCodeUnits` comment in `scripts/state-rules.ts` said "two hosts".
- **Fix:** reworded. Rule A takes no exemptions.
- **Committed in:** e5fa1a99.

**7. [Plan detail] `scripts/check-state-paths.test.ts` was not edited**
- The wrapper still imports `TRACEABILITY_REL` from state-layout, and `trace-freshness.ts` still imports `TRACE_DIR_REL`/`TRACEABILITY_REL`. So both stay in AUTHORITY_IMPORTERS and the list is unchanged.

---

**Total deviations:** 6 auto-fixed (3 bugs, 3 blocking) and 1 plan detail. Four of the six belong to plans 37-02, 37-03 and 37-06; their own targeted runs did not reach these censuses.
**Impact:** no behavior change outside the trace commands. The digit grouping prints the same output.

## Full-suite run (mid-phase run 1 of 2) against 37-BASELINE.md

- **Command:** `npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1`, run as `--shard=1/6` to `--shard=6/6`. These were six sequential foreground runs, because one shell call is capped at 10 minutes. One vitest process ran at a time, each with 1 worker.
  - Shard results: 1696, 1804, 789, 2120, 993 and 1520 tests, 8,922 in all.
  - The suite was not run as one process. Every file that changed after its shard ran was re-run afterwards (16 files): 1,578 passed, plus the 2 baseline failures of `context-io-writer-set`.
- **New failures (8 in 6 files), all fixed:**
  - board-corpus (1, this plan);
  - check-foundation-guards (1, this plan);
  - check-uat-oracles (1, 37-02/37-03);
  - check-claim-anchors (1, 37-03);
  - frontmatter (3, 37-06);
  - host-tools-prose (1, 37-02).
- **Baseline failures still failing (all 20):**
  - installer-fs-census 1;
  - canonical-corpus 1;
  - context-io-writer-set 2;
  - context-io 7;
  - harness-instance-ledger 4;
  - uat-gate-exit-contract 5.
- **Baseline failures that now pass:** none.

## Verification

- Task verify: `npm run build && npm run typecheck`: exit 0. The four named test files: 255 passed. `context-io.test.ts -t "six routes"`: 1 passed. `npm run freshness:traceability` and `node scripts/runnable-ref/trace-render.js . --check`: both exit 0.
- Plan verification:
  1. All 6 test files pass. The runnable test and the trace-model test give 61 passed.
  2. `npm run freshness` (85 fresh), `npm run freshness:traceability` and `node scripts/runnable-embeds-freshness.js` (2 fresh): all exit 0.
  3. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: ALL CHECKS PASSED.
  4. The full run: see above.
- `check-foundation-guards.js`, `check-state-paths.js` and `check-nul-bytes.js`: all exit 0.
- Acceptance criteria:
  - `head -1` of the index prints the generated header.
  - `grep -c freshness:traceability ci.yml` prints 1.
  - `grep -c 'nothing committed to drift' scripts/trace-freshness.ts` prints 0.
  - `git ls-files memory-bank/plans/traceability/.gitkeep` prints the path.
- No installer was run, no branch was created or switched, and bare `npm test` was never run. No vitest process of this repository is left running. One vitest process from another project (`grugops-examples/wt-ABC-168`) was running at the end and was not touched.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-09 can add trace freshness to the host state-check through the same `compareTraceTree`.
- The CI line runs `tsc --outDir .tmp-build` before the gate, like the other freshness scripts. No remote CI run was triggered.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All eight key created or rewritten files exist. Commits 96bdb0df, e80c75bc, e951bf03 and e5fa1a99 are ancestors of HEAD. The ledger count is 4 commits, from 8827dec0 to e5fa1a99.
