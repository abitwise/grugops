---
phase: "36"
plan: "07"
subsystem: state-layout
tags: [state-layout, traceability, fixtures, note-seal, vitest]

requires:
  - phase: 36
    provides: "install/state-layout.ts (STATE_ROOT_REL, TRACEABILITY_REL, TICKETS_REL, BOARD_REL) from plan 36-01; the repository and fixture state under memory-bank/plans/ and FIXED_SUBPATHS on the authority from plan 36-06"
provides:
  - "scripts/trace-render.ts DEFAULT_PLANS_ROOT = join(ROOT, STATE_ROOT_REL); its message names TRACEABILITY_REL"
  - "scripts/trace-freshness.ts reads, mirrors and reports the traceability file under STATE_ROOT_REL for the real root and CHECK_ROOT alike"
  - "Trace tests plant their scratch state root at STATE_ROOT_REL; the drift case asserts TRACEABILITY_REL in the message"
  - "board-snapshot fixture notes and index.jsonl name memory-bank/plans/tickets/ABC-104.md, each re-sealed with noteSeal"
  - "Comments and help text under scripts/ name state paths through the constants or in prose; fixture content and the repository board and NFR catalog prose use memory-bank/plans/"
affects: [36-08, 36-10, 36-11, 36-14]

actuals:
  tokens: 49029
  tasks: 2
  commits: 2
plan_head_before: e5dac9f7966bde869d059f6e2b5525ffe6c06668
plan_head_after: a0444a9aa482beee55a40436c1a1a20e1658d6ab

tech-stack:
  added: []
  patterns:
    - "A fixture note's ref is changed by a script that strips the seal line, recomputes it with noteSeal, puts it back as the last fence line and checks sealVerdict; a derived index is checked against a fresh `context-io.js render` in a scratch copy"
    - "A frame cell is not a published position: a path constant in a dashboard cell is a plain template, not a `spelled` one (the 32.1-07 ownership census reds otherwise)"

key-files:
  created: []
  modified:
    - scripts/trace-render.ts
    - scripts/trace-freshness.ts
    - scripts/trace-render.test.ts
    - scripts/trace-freshness.test.ts
    - scripts/board-readonly.test.ts
    - scripts/check-platform-shapes.ts
    - scripts/board-read.ts
    - scripts/board-model.ts
    - scripts/board-model.test.ts
    - scripts/board-dashboard.ts
    - scripts/validate-agent-factory.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.test.ts
    - scripts/fixtures/board-snapshot/README.md
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.jsonl
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T090500Z-decision-a1b2c3d4.md
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T091000Z-decision-e5f6a7b8.md
    - scripts/fixtures/board-replay/chess-board.md
    - scripts/fixtures/bad-ticket-bad-column/memory-bank/plans/tickets/ABC-001.md
    - scripts/fixtures/bad-ticket-body-column/memory-bank/plans/tickets/ABC-001.md
    - scripts/fixtures/bad-ticket-no-region/memory-bank/plans/tickets/ABC-001.md
    - memory-bank/plans/board.md
    - memory-bank/plans/nfr-catalog.md

key-decisions:
  - "board-dashboard's no-board line names FIXED_SUBPATHS.board (the reader's layout) rather than importing BOARD_REL, keeping the dashboard's rule that it reads the layout from board-read and never spells it a fourth time"
  - "scripts/kit-model.ts INVARIANT and the scripts/generate-role-adapters.ts coordinator line keep their pre-v3 spelling here: plan 36-10 owns both and changes them in one regeneration of every adapter and skill twin; changing them here would regenerate those outputs out of order"
  - "The golden snapshot did not move: the board-model golden case passed after the fixture note edits, so no regeneration was run"

patterns-established:
  - "The trace tools are rooted at the state-layout authority; their mirror picks up install/state-layout.js through jsImportClosure with no hand list"

requirements-completed: []

coverage:
  - id: D1
    description: "The trace render and its freshness gate read and write the traceability file under memory-bank/plans/, for the real root and CHECK_ROOT, and their tests plant at the same constant"
    requirement: LAYOUT-02
    verification:
      - kind: unit
        ref: "npx vitest run scripts/trace-render.test.ts scripts/trace-freshness.test.ts scripts/board-readonly.test.ts scripts/check-platform-shapes.test.ts (4 files, 251 passed)"
        status: pass
      - kind: other
        ref: "npm run build && npm run typecheck && node scripts/check-platform-shapes.js && npm run freshness:traceability (all exit 0); test ! -e plans (exit 0)"
        status: pass
      - kind: other
        ref: "grep -c 'join(ROOT, STATE_ROOT_REL)' scripts/trace-render.ts prints 1; node scripts/state-path-scan.js 'scripts/trace-*' scripts/check-platform-shapes.ts scripts/check-platform-shapes.js exits 0 (baseline 49 sites)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The board-snapshot notes and index name memory-bank/plans/tickets/ABC-104.md and both seals verify"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "node -e sealVerdict over both board-snapshot notes prints {\"ok\":true} twice; a scratch `node scripts/context-io.js render abc-104-implement <copy>` equals the committed index.jsonl and index.md"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts golden case (passes with no regeneration)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Comments, help text and fixture prose under scripts/ and memory-bank/ use the v3 spelling, apart from the fixture role headings (36-08) and the kit-model INVARIANT and adapter-generator line (36-10)"
    requirement: LAYOUT-02
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js scripts memory-bank ':!scripts/fixtures/*/agent-factory/roles/*.md' ':!scripts/kit-model.ts' ':!scripts/kit-model.js' ':!scripts/generate-role-adapters.ts' ':!scripts/generate-role-adapters.js' exits 0 (685 files; baseline 192 sites)"
        status: pass
      - kind: unit
        ref: "npx vitest run board-model, board-dashboard, board-corpus, validate, check-banned-claims, context-io (only the 7 deferred context-io failures) plus board-oracle, board-read, board-tracer, board-watch, board-watch-live, board-readonly, check-imperative-lexicon, check-foundation-guards, check-public-docs-vocabulary, frontmatter, state-path-scan, install/state-layout (all passed)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js, check-foundation-guards, check-kit-refs, check-claim-anchors, check-banned-claims, check-imperative-lexicon, check-nul-bytes, check-uat-oracles (each exit 0)"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 07: The trace tools use the state root, and the remaining old paths in scripts/ and memory-bank/ are cleaned up Summary

**`trace-render` now writes the traceability file under `memory-bank/plans/`, and `trace-freshness` mirrors and compares it there, both through `STATE_ROOT_REL` and `TRACEABILITY_REL`. Their tests set up the scratch state root with the same constant. Comments, help text and fixture prose under scripts/ and memory-bank/ now use the v3 paths. The two board-snapshot fixture notes point at `memory-bank/plans/tickets/ABC-104.md`, and both were re-sealed with `noteSeal` and pass `sealVerdict`. Two things were left on purpose: the fixture role headings, which belong to plan 36-08, and four kit-model and adapter-generator sites, which belong to plan 36-10.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-10-21T08:51:03Z
- **Completed:** 2026-10-21T09:07:22Z
- **Tasks:** 2 (one tracer, one auto)
- **Files changed:** 31 (13 sources and their compiled .js, 5 tests, 9 fixture files, 2 repository state files)

## Accomplishments

- **Trace tools use the state-layout constants.**
  - `DEFAULT_PLANS_ROOT` is `join(ROOT, STATE_ROOT_REL)`.
  - In `trace-freshness`, `PLANS_ROOT` (in both the CHECK_ROOT and the real-root branch), the mirrored root, and the `relPath` it reports (`toPosix(TRACEABILITY_REL)`) all come from the constants. Its success line names the same path.
  - The mirror copies `install/state-layout.js` automatically, because the file list comes from `jsImportClosure` and is not typed by hand.
- **Tests.**
  - `trace-render.test` and `trace-freshness.test` set up their scratch state root at `STATE_ROOT_REL`. The drift case now checks that the message contains `TRACEABILITY_REL`, not just any `traceability.md`.
  - The board-readonly closure row for `scripts/trace-render.js` gained `install/state-layout.js`. The row was copied from `jsImportClosure`. `CLOSURE_BASELINE_COUNT` and the fs-symbol pins did not change.
  - The control-byte probe in `check-platform-shapes` now creates `STATE_ROOT_REL` under its control-byte directory.
- **Prose.**
  - These files had comments using the old paths: board-read (18 sites), board-model (13), board-dashboard (11), validate-agent-factory (5) and check-banned-claims. The comments now use the constants or plain wording ("the tickets directory", "the state root").
  - The check-banned-claims block that explains its file counts now says memory-bank/ holds 13 files, including the four state files moved there.
  - The dashboard's user-facing `no board:` line names `FIXED_SUBPATHS.board`. 36-06 had flagged this as the one user-visible string still showing the old path.
- **check-banned-claims.test.** The segment-name case now compares path components with `posix.dirname` and `posix.basename` of `STATE_ROOT_REL`, not quoted literals. A guard checks that the constant has two segments. The 13-member pin still holds.
- **Fixture content.**
  - board-snapshot README: 21 path references. The line numbers did not change, and I spot-checked lines 36 and 43 and the ticket's line 5.
  - chess-board.md: 26 links.
  - The three bad-ticket bodies.
  - The repository's board and NFR catalog prose. The board's FORMAT comment now matches the seed's first 60 lines exactly.
- **Sealed notes (D-08, T-36-09).**
  - A script in the scratchpad swapped the ref line, removed the seal line, recomputed the seal with `noteSeal` from `scripts/context-io.js`, and put the seal back as the last line inside the fence. No digest was typed by hand.
  - The edited `index.jsonl` is byte-identical to a fresh `node scripts/context-io.js render abc-104-implement <scratch copy>`, and so is `index.md`.
  - The golden case passed without being regenerated.

## Task Commits

1. **Task 1 (tracer): the trace render and its freshness gate use the state-layout constants**: `3b325136` (feat).
   - Tracer gate result: interactive mode, `end-of-phase`, verify is automated only.
   - Every `<automated>` step passed on the committed content. That was vitest (4 files, 251 passed), build, typecheck, `check-platform-shapes.js` and `freshness:traceability`, plus check-foundation-guards (test and gate). Expansion continued: Tracer verified end-to-end.
2. **Task 2: prose, fixture content and the re-sealed notes use the v3 state layout**: `a0444a9a` (feat).

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Acceptance evidence

Commit before this plan started: `e5dac9f7966bde869d059f6e2b5525ffe6c06668`.

| Check | Baseline | After |
|-------|----------|-------|
| `grep -c 'join(ROOT, STATE_ROOT_REL)' scripts/trace-render.ts` | 0 | 1 |
| `node scripts/state-path-scan.js 'scripts/trace-*' scripts/check-platform-shapes.ts scripts/check-platform-shapes.js` | 49 sites, exit 1 | PASS, exit 0 |
| `test ! -e plans` after the verify commands | n/a | exit 0 |
| `node scripts/state-path-scan.js scripts memory-bank ':!scripts/fixtures/*/agent-factory/roles/*.md'` | 192 sites | 4 sites, all in plan 36-10's files (see Deviations); with those 4 files also excluded: PASS, 685 files, exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-banned-claims.js` | n/a | both exit 0 |

Seal check, as the acceptance criterion requires:

```
$ node --input-type=module -e "
import {readFileSync} from 'node:fs'; import {sealVerdict} from './scripts/context-io.js';
for (const f of ['2026-09-14T090500Z-decision-a1b2c3d4.md','2026-09-14T091000Z-decision-e5f6a7b8.md']) console.log(f, JSON.stringify(sealVerdict(readFileSync('scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/'+f,'utf8'))));"
2026-09-14T090500Z-decision-a1b2c3d4.md {"ok":true}
2026-09-14T091000Z-decision-e5f6a7b8.md {"ok":true}
```

The new seals, from `noteSeal`, are `sha256:fde9f30d…afb9b1` (a1b2c3d4) and `sha256:adebe522…991089` (e5f6a7b8). Before the edit, both old seals also returned `{"ok":true}`, which confirmed the approach on the bytes as they were.

## Plan-level verification

1. **Not run: `npx vitest run scripts/ --exclude '**/scripts/e2e/**'`.** That is effectively the whole scripts suite, and this run's rules forbid a full suite here because the orchestrator schedules full runs at plans 10 and 14. Instead I ran every test file that covers or reads a changed file:
   - trace-render, trace-freshness, board-readonly, check-platform-shapes
   - board-model, board-dashboard, board-corpus, validate, check-banned-claims, context-io
   - board-oracle, board-read, board-tracer, board-watch, board-watch-live
   - check-imperative-lexicon, check-foundation-guards, check-public-docs-vocabulary, frontmatter, state-path-scan, install/state-layout

   The only failures were the 7 context-io rows already listed in deferred-items.md (the absent 31-CONTEXT.md and 31-22-SUMMARY.md).

   Before the Task 2 commit, board-dashboard and board-watch-live failed only their afterAll check that the committed fixture tree was left unmodified, because the fixture edits were still uncommitted. After the commit both passed: 86 of 86.
2. `npm run freshness` passed (78 committed .js files fresh). `freshness:context` and `freshness:traceability` both passed with a vacuous pass, because the repository has no `.grugops/context/`.
3. Each of these exited 0: validate-agent-factory, check-foundation-guards, check-kit-refs, check-claim-anchors, check-banned-claims, check-imperative-lexicon, check-nul-bytes and check-uat-oracles.
4. `test ! -e plans && git branch --show-current` printed `main`.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A frame cell cannot be built through `spelled`**
- **Found during:** Task 2
- **Issue:** My first version of the new `no board:` line used `spelled`. The 32.1-07 ownership census flags `spelled` used outside a published position. It reported `board-dashboard.ts:758`, and the published/owned counts became 92 and 91.
- **Fix:** The line is a plain template over `FIXED_SUBPATHS.board`. The value is a constant and needs no escaping. The census pin stays at 91.
- **Files modified:** scripts/board-dashboard.ts
- **Verification:** board-model.test.ts 181 of 181 passed, census cases included.
- **Committed in:** a0444a9a

**2. [Rule 3 - Blocking] board-model.test.ts carried one comment with the old path**
- **Found during:** Task 2 (the scan over scripts/)
- **Issue:** The dated comment for the 86 to 91 census change, written by 36-06, used the old tickets path. This file is not in the plan's file list, and the scan has to exit 0.
- **Fix:** The comment now says "a hand-spelled pre-v3 tickets prefix".
- **Files modified:** scripts/board-model.test.ts
- **Committed in:** a0444a9a

### Not done, with reason

**3. The scan over scripts/ and memory-bank/ still finds 4 sites, all owned by plan 36-10**
- The 4 sites are `scripts/kit-model.ts:283` and `scripts/kit-model.js:266` (INVARIANT), and `scripts/generate-role-adapters.ts:530` and `scripts/generate-role-adapters.js:459` (the coordinator body line).
- Plan 36-10's frontmatter lists all four files. Its truths change INVARIANT and the coordinator line "in ONE regeneration of the adapters and skill twins", tied to a stated byte-baseline transform. Editing them here would regenerate every `.claude/agents` adapter and skill twin ahead of that plan and break its single-regeneration contract. That would be an ordering problem, not a fix.
- Effect: the must-have truth "`node scripts/state-path-scan.js scripts memory-bank ':!scripts/fixtures/*/agent-factory/roles/*.md'` exits 0" is **not met as written**. It exits 1 on those 4 sites. With the four files also excluded, it exits 0.
- It should hold once plan 36-10 lands. Whoever verifies 36-10 should re-run the plan's exact command.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking), plus 1 scope item deferred to its owning plan.

**Impact on plan:** no assertion was loosened. The census pin, the closure baseline and the seal predicate are unchanged. The one unmet truth is a scope overlap in the plan set, not a defect.

## Issues Encountered

- The `freshness:traceability` script builds into `.tmp-build/`. I removed that directory after the run; it is not tracked.
- The real-root branch of `trace-freshness` can only pass vacuously in this repository, because there is no `.grugops/context/`. Only the CHECK_ROOT tests exercise the non-vacuous path under `STATE_ROOT_REL`.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 36-08:** the fixture role headings (`scripts/fixtures/*/agent-factory/roles/*.md`) and the rest of `agent-factory/contracts/board.md`.
- **Plan 36-10:** the kit-model INVARIANT and the adapter-generator coordinator line, the last 4 old-path sites under scripts/.
- **LAYOUT-02:** stays unchecked until plan 36-14.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: scripts/trace-render.ts (contains `join(ROOT, STATE_ROOT_REL)`), scripts/trace-freshness.ts, scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.jsonl (contains `memory-bank/plans/tickets/ABC-104.md`)
- FOUND commits: 3b325136, a0444a9a (both ancestors of HEAD)
