---
phase: 37-overview-board-per-file-records-and-budgets
plan: 09
subsystem: traceability
tags: [state-check, trace-freshness, host-runnable, runnable-embeds, split-05, split-03]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-07: compareTraceTree, ownedTraceEntries, caseFoldCollisions, isGeneratedTraceText and TRACE_FILE_MAX_BYTES in scripts/trace-model.ts; trace-render.js --check"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-08: this repository's zero-row generated index and memory-bank/plans/traceability/.gitkeep"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plans 37-03..37-05: the read-only state-check runnable, its EMBED_SPECS row and its host-emulation tests"
provides:
  - "state-check.js compares a host's rendered trace with its published notes, using the renderer's embedded model and note reader, over both context roots (D-01, D-03)"
  - "Finding keys trace-stale (missing, extra, changed), trace-hand-written, trace-collision and trace-not-compared, all under the marker's severity"
  - "--json field trace { compared, findings }; a `TRACE` report line that is the renderer's own --check summary"
affects: [37-13, 37-18, 37-19]

actuals:
  tokens: 23673
  tasks: 1
  commits: 2
plan_head_before: e501b26de905a8e73535e45dd77d2b5aa2cd2d32
plan_head_after: 3e595e12802fd794a3cf501916b8d6ce770cd077

tech-stack:
  added: []
  patterns:
    - "A read-only runnable embeds the same model and reader as the writer it checks, and leaves the writer out of its EMBED_SPECS row, so it can compare without being able to write"
    - "A check that cannot compare says so by name and sets compared false; it never reports fresh"

key-files:
  created: []
  modified:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts
    - scripts/state-rules.ts
    - scripts/state-rules.js

key-decisions:
  - "A hand-written index is one trace-hand-written finding and nothing else is read for the trace: no notes are collected, so an unmigrated repository cannot exit 2 on its notes"
  - "A trace directory, an index or a context root that resolves outside the root stops the compare with one trace-not-compared finding by name (state-check's locate convention). A link, FIFO or directory at a compared file path is exit 2, as the renderer treats it"
  - "Case-fold collisions and hand-written trace files are findings too, so state-check is not fresh where the renderer's --check is not"
  - "The four trace keys are added to IntegrityKey in scripts/state-rules.ts, so integrityFinding builds every trace finding; the private compareCodeUnits in state-rules.ts is renamed codeUnitOrder, because the generator refuses two embedded declarations of one name and trace-model.ts exports a compareCodeUnits"
  - "The renderer's counts line is retyped in state-check, because trace-model.ts exports no formatter. A test holds state-check's TRACE line equal to the renderer's --check summary on the same repository"

patterns-established:
  - "Freshness parity between two runnables is proven by running both committed .js copies on one repository and comparing their summary lines"

requirements-completed: [SPLIT-05, SPLIT-03]

coverage:
  - id: D1
    description: "A repository rendered by trace-render.js has no trace finding, and --json carries trace { compared: true, findings: [] }. With .gitkeep and .DS_Store in the trace directory it is still fresh, through the embedded compareTraceTree's owned-entry rule"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a repository the renderer just rendered prints no trace finding; CONTROL: a fresh render plus .gitkeep and .DS_Store"
        status: pass
    human_judgment: false
  - id: D2
    description: "A new sealed note for a new ticket, without a re-render, names the missing trace file and the changed index as trace-stale with the remedy `node tools/grugops/trace-render.js <root>`: WARN and exit 0 with no marker, FINDING and exit 1 with the D-14 marker. A removed note names the extra generated file"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a new sealed note for a new ticket; the same with the D-14 marker; a note removed after the render"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-03: a note only in .grugops/archive/context counts exactly like one in .grugops/context (moving a rendered note there keeps the tree fresh; a new archive-only note makes it stale)"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#D-03: a note only in the archive context root counts exactly like one in the live root"
        status: pass
    human_judgment: false
  - id: D4
    description: "A hand-written traceability.md is one WARN line naming it and no TRACE line without a marker, one finding and exit 1 with the marker, and trace.compared false. A hand-written trace file, a case-fold collision and a context root linked outside the root are each findings; the outside root also sets compared false"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#a hand-written traceability.md; the same hand-written index with the D-14 marker; a hand-written file in the trace directory; two ticket identifiers that fold; a context root linked outside"
        status: pass
    human_judgment: false
  - id: D5
    description: "Read-only and never hangs: the plan 37-04 syntax-tree cases still pass (imports now node:crypto, node:fs and node:path); the region holds compareTraceTree once and atomicWrite never; a FIFO at a planned trace file is exit 2 naming it, with nothing on stdout, in text and --json"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.ts is read-only (5 cases); the embedded region carries the comparison and no writer; a FIFO at a planned trace file"
        status: pass
    human_judgment: false
  - id: D6
    description: "The TRACE line equals the renderer's --check summary on the same repository, read and skip counts included; on this repository's own tree `node scripts/runnable-ref/state-check.js . --json` gives trace.compared true with no finding"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#the TRACE line is the renderer's own --check summary"
        status: pass
      - kind: other
        ref: "node scripts/runnable-ref/state-check.js . (exit 0); the plan's --json acceptance one-liner (exit 0)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 09: state-check reports whether a host's rendered trace is fresh Summary

**`state-check.js` now compares a host's rendered trace files with its published notes, using the renderer's own embedded code: `collectTraceNotes` over the live and the archive context roots, through `readRawNotesWithSkips` and `recordFromParsed`, then `planTraceTree` and `compareTraceTree`. It still writes nothing. Each missing, extra or changed file is a `trace-stale` finding that names `node tools/grugops/trace-render.js <root>`. A hand-written index is reported by name and the trace is not compared. `--json` gains `trace { compared, findings }`.**

## Performance

- **Duration:** about 10 min measured from the start stamp (2026-10-22T13:48:43Z to 13:58:22Z), after the protocol and context reads
- **Tasks:** 1 (TDD: a RED commit, then a GREEN commit)
- **Files modified:** 7

## Accomplishments

- **EMBED_SPECS**: the state-check row gains these roots, with a dated comment (2026-10-22):
  - `CONTEXT_REL` and `CONTEXT_ARCHIVE_REL`;
  - the trace model: `TRACE_GENERATED_HEADER`, `buildTraceRows`, `collectTraceNotes`, `planTraceTree`, `caseFoldCollisions`, `isGeneratedTraceText`, `compareTraceTree` and `TRACE_FILE_MAX_BYTES`;
  - the note read path: `readRawNotesWithSkips`, `recordFromParsed` and `NOTE_SKIP_ARMS`.

  `atomicWrite` is not a root. The region was regenerated, and `runnable-embeds-freshness` reports 2 targets fresh.
- **state-check** runs the trace check last, after the budget, integrity and move-only checks:
  1. **Hand-written index.** If the index does not start with the generated header, the result is one `trace-hand-written` finding and nothing more is read.
  2. **Paths.** The trace directory and both context roots are resolved with realpath. A path outside the root gives one `trace-not-compared` finding by name.
  3. **Compare.** Notes are collected, the tree is planned and compared. Files are read with realpath, then lstat, then the embedded non-blocking reader under `TRACE_FILE_MAX_BYTES`. A link, FIFO or directory at a compared path is exit 2, naming it.
  4. **Findings.** A case-fold collision is `trace-collision`. A hand-written trace file is `trace-hand-written`. A missing, extra or changed file is `trace-stale`, with the remedy. All of them take the marker's severity.
  5. **Report lines.** After a compare, a `TRACE` line prints the renderer's own `--check` summary, with read and skip counts, and one `UNREADABLE TASK` line follows per task whose read failed.
- **Tests** (`scripts/runnable-ref/state-check.test.ts`): 15 new host-emulation cases. Each run uses the committed `state-check.js`, and the fixture is rendered by the committed `trace-render.js`, each copied alone into its own temporary directory. The fixtures `repo()` and `cleanRepo()` now plant the zero-row generated index, so their cases still measure only what they plant.

## Task Commits

1. **Task 1 RED: failing host cases for trace freshness:** `044bf55e` (test)
2. **Task 1 GREEN: trace freshness in state-check:** `3e595e12` (feat)

**Plan metadata:** recorded in the docs(37-09) completion commit.

## TDD Gate Compliance

- **RED** (`044bf55e`): 15 of 82 cases failed, and all 15 were new or changed for this plan. Each failed on its own assertion against the old committed `.js`: `trace` was undefined, there was no `trace-` line or `TRACE` line, the FIFO case got exit 1 instead of exit 2, and the region held no `compareTraceTree`. The fixtures rendered with exit 0 in every case, so there was no load or fixture fault. Semantic assessment: every target ran and failed because the planned behavior was missing. `workflow.tdd_mode` is false, so the RED-evidence classifier was not run.
- **GREEN** (`3e595e12`): 82 of 82 pass.
- **REFACTOR**: none needed.

## Files Created/Modified

- `scripts/generate-runnable-embeds.ts`, `.js`: the state-check row's new roots.
- `scripts/runnable-ref/state-check.ts`, `.js`: the trace check, the `trace` JSON field, the `TRACE` and `UNREADABLE TASK` lines, and header notes. The generated region was regenerated, not edited.
- `scripts/runnable-ref/state-check.test.ts`: 15 new cases, fixtures with the zero-row index, the `trace` field in the clean JSON case, and the dated `node:crypto` admission.
- `scripts/state-rules.ts`, `.js`: four trace keys in `IntegrityKey` (type only), and the private `compareCodeUnits` renamed `codeUnitOrder`.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two embedded declarations named compareCodeUnits**
- **Found during:** Task 1, the first regeneration.
- **Issue:** the generator refused the region. `scripts/state-rules.ts` declares a private `compareCodeUnits`, used by `sortFindings` and `recordEntryNames`, and `scripts/trace-model.ts` exports one of the same name.
- **Fix:** the private one in state-rules is renamed `codeUnitOrder`. It has the same body and behavior, and no other file named it.
- **Files modified:** scripts/state-rules.ts, scripts/state-rules.js.
- **Committed in:** 3e595e12.

**2. [Rule 3 - Blocking] The read-only case's import list**
- **Found during:** Task 1, after regeneration.
- **Issue:** the embedded note reader's seal check imports `createHash` from `node:crypto`. The plan 37-04 case required exactly `node:fs` and `node:path`.
- **Fix:** the case now expects `node:crypto`, `node:fs` and `node:path`, with a dated (2026-10-22) reason. Every import is still a `node:` builtin, and the mutating-call and open-flag cases are unchanged and still pass.
- **Committed in:** 3e595e12.

**3. [Rule 2 - Missing critical] Findings the action text did not list**
- A case-fold collision (`trace-collision`) and a hand-written trace file in a rendered tree (`trace-hand-written`) are findings. Without them, state-check would report fresh where the renderer's `--check` exits 1.
- An index, a trace directory or a context root outside the root gives `trace-not-compared` with `compared: false`. This follows state-check's rule that such a path is a finding by name.
- **Committed in:** 3e595e12.

**4. [Plan detail] IntegrityKey extended in scripts/state-rules.ts**
- The plan named only the runnable, its test and the generator. The trace keys were added to the type that `integrityFinding` takes, rather than building a finding object by hand in the runnable. The change is type-only; `state-rules.js` changes only for the rename in item 1.

**5. [Plan detail] Read trace-render.ts's hand-written part for the counts line**
- 37-07-SUMMARY.md describes the counts line but does not quote it. To get the exact text, the hand-written part of `scripts/runnable-ref/trace-render.ts` was read, not its generated region. The text is retyped once in state-check. A test runs both committed `.js` files on one repository and holds the two lines equal.

**6. [Plan detail] No census amendment was needed**
- `nonblocking-reader-parity`, `context-io-writer-set`, `frontmatter` (local grammar), `check-state-paths`, `board-readonly` and `check-foundation-guards` all passed without edits. The embedded reader and grammar sit inside the fresh generated region of an EMBED_SPECS target, which the 37-03, 37-08 and D-16 rule admits.

---

**Total deviations:** 6: 3 auto-fixed (2 blocking, 1 missing critical) and 3 plan details.
**Impact:** state-check's output for a fresh tree changes in three ways. It adds a `TRACE` line. It adds a finding for a hand-written index, which is a warning without the marker. Its JSON gains the `trace` field. Nothing else changes.

## Verification

- `npm run build` and `npm run typecheck`: exit 0.
- `node scripts/runnable-embeds-freshness.js`: 2 targets fresh. `npm run freshness`: 85 committed `.js` fresh.
- `node scripts/runnable-ref/state-check.js .` exits 0 and prints `TRACE    The trace is fresh: 0 task(s) and 0 note(s) read; ...`. `node scripts/runnable-ref/trace-render.js . --check` exits 0.
- Acceptance:
  - `grep -c 'export function compareTraceTree' scripts/runnable-ref/state-check.ts` prints 1.
  - `grep -c 'function atomicWrite' scripts/runnable-ref/state-check.ts` prints 0.
  - The `--json` one-liner exits 0, with `{"compared":true,"findings":[]}`.
- `check-foundation-guards.js`, `check-state-paths.js`, `check-nul-bytes.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: all exit 0 or ALL CHECKS PASSED.
- **The end-of-plan run:** one vitest process with 1 worker, over 17 files:
  - every test file that names a changed basename (state-check, generate-runnable-embeds, state-rules);
  - the census set (check-foundation-guards, check-state-paths, nonblocking-reader-parity, context-io-writer-set, board-readonly, validate);
  - trace-model, check-uat-oracles (lookahead class), install/host-tools-prose (Rule A) and section-locator-oracle.

  Result: 1,631 passed and 2 failed. Both failures are the 37-BASELINE pair in `context-io-writer-set` (31-14). There is no new failure.
- Not run: the full non-e2e suite (project rule: plans 37-13 and 37-19 run it). No installer was run, bare `npm test` was never run, and no branch was created or switched. No vitest process was left running.

## Issues Encountered

- The first end-of-plan vitest call ran past the 2-minute shell default and moved to the background. It was the only vitest process, and a foreground wait loop held until it finished, so no second process was started.

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-13 can ship `state-check.js` and `trace-render.js` together under `tools/grugops/`. The remedy text already names `node tools/grugops/trace-render.js`.
- Any later fixture that runs state-check with the marker needs a generated index (`renderTraceIndex([])`), or it gets a `trace-hand-written` finding.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All seven modified files exist. Commits 044bf55e and 3e595e12 are ancestors of HEAD. The ledger count is 2 commits, from e501b26d to 3e595e12. Every acceptance criterion and plan verification command above passed, apart from the two 37-BASELINE failures noted.
