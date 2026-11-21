---
phase: 37-overview-board-per-file-records-and-budgets
plan: 06
subsystem: traceability
tags: [trace-render, trace-model, host-runnable, embed-generator, atomic-write, writer-census, split-03]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-03: scripts/generate-runnable-embeds.ts (EMBED_SPECS, regionSpans, rewriteRunnable) and the freshness gate"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-02/37-04: state-rules indexLineFindings and stripControlChars; state-layout CONTEXT_ARCHIVE_REL, TRACE_DIR_REL, TRACEABILITY_REL"
provides:
  - "scripts/trace-model.ts: the one trace model (TRACE_GENERATED_HEADER, HAND_TRACE_PATTERNS, classifyRef, isTicketRef, buildTraceRows, renderTicketTrace, renderTraceIndex, traceFileName, collectTraceNotes, planTraceTree, plus TRACE_LINK_DIR, TRACE_COLUMNS, compareCodeUnits, traceCell)"
  - "scripts/runnable-ref/trace-render.ts and its committed .js: `node trace-render.js <repo-root>` writes memory-bank/plans/traceability/<ID>.md per ticket and the one-line index, reading .grugops/context and .grugops/archive/context"
  - "A second EMBED_SPECS row (EMBED_SPEC_COUNT 2)"
  - "A tree-wide, shape-derived writer census in scripts/context-io-writer-set.test.ts that admits a temp-sibling-plus-rename writer inside a fresh generated region of an EMBED_SPECS target only"
affects: [37-07, 37-08, 37-09, 37-13, 37-18, 37-19]

actuals:
  tokens: 43640
  tasks: 1
  commits: 1
plan_head_before: a757e01ecaf4ec5a5076cb688ccdead2583c440d
plan_head_after: fc66553d67161c1d69ad2ffec82a47281acc2573

tech-stack:
  added: []
  patterns:
    - "A trace model with no imports: the note reader and every state path are passed in, so the generator can embed it into any runnable"
    - "Every refusal a write mode can make runs before its first write; each write is a temp sibling plus a rename"
    - "A writer census matches the temp-sibling-plus-rename SHAPE (a write primitive and renameSync in one function body), not the name atomicWrite, so a renamed copy is still seen"

key-files:
  created:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-model.test.ts
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/trace-render.test.ts
  modified:
    - scripts/trace-render.ts
    - scripts/trace-render.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/generate-runnable-embeds.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/board-readonly.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "The write mode never exits 1. Exit 1 is reserved for the read-only check mode plan 37-07 adds; skipped notes are reported by arm on every run and never fail the render, because about 9% of dogfood notes are sealed (research open question 4)"
  - "A repository with no memory-bank/plans/ is exit 2 (`install grugops first`). The renderer creates only the trace directory, never the state directory"
  - "Every planned path is lstat'ed before the first write; a present entry that is not a regular file (a directory, a FIFO, a link) is exit 2 and nothing is written"
  - "A context root, a task's notes directory or the trace directory that resolves outside realpath(root) is refused by name. A context root is exit 2; a notes directory is a named unreadable task"
  - "The writer census is tree-wide and shape-derived. Outside generated regions it is pinned to three measured members with written dispositions: install/install.ts backupEditedKitFiles and scripts/claim.ts atomicWrite (both pre-existing, outside note scope) and the scripts/context-io.ts authority"
  - "scripts/trace-render.ts keeps its localeCompare row order (outside the model) so its monolithic file keeps its bytes until plan 37-08 makes it a wrapper; the per-ticket render sorts by code units"
  - "The index links each ticket as `traceability/<ID>.md` through TRACE_LINK_DIR; a test holds `dirname(TRACEABILITY_REL)/TRACE_LINK_DIR` equal to TRACE_DIR_REL, so the link is not a second spelling of the path"

patterns-established:
  - "A host write-mode runnable: realpath the root, refuse outside paths by name, lstat every planned path, then write each file through the embedded atomicWrite, then print one summary line"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "classifyRef keeps the column mapping (UAT, Release, Requirement for NFR/EPIC/FEAT, Tests for test/spec/e2e paths, Code for #41 and source paths, none for the ticket id); buildTraceRows merges two notes' refs first-seen and de-duplicated and sorts by code units"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#classifyRef and buildTraceRows describe blocks"
        status: pass
    human_judgment: false
  - id: D2
    description: "renderTraceIndex starts with the command-neutral header, has a `| Ticket | Trace |` table and one `| <ID> | [<ID>](traceability/<ID>.md) |` line per ticket in code-unit order; renderTicketTrace lists every slot or `None recorded.`"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#renderTraceIndex and renderTicketTrace describe blocks"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cross-plan contract (37-13, 37-18): the zero-row and three-row index pass state-rules' indexLineFindings with the imported BUDGETS after board-model's comment blanking, and no emitted line matches either HAND_TRACE_PATTERNS member; the pattern list has exactly two members, each proven on its own control line"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#CROSS-PLAN (37-13) and CROSS-PLAN (37-18) cases, and the HAND_TRACE_PATTERNS control case"
        status: pass
    human_judgment: false
  - id: D4
    description: "The committed trace-render.js, copied alone into an empty directory, renders ABC-001 from .grugops/context and ABC-002 from .grugops/archive/context only, writes both trace files and an index naming both, exits 0 and prints read counts, every skip arm and the unreadable-task count; a second run is byte-identical and leaves no temp sibling"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts (11 cases, host emulation)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Unsealed and unparseable notes are counted under their arms and never rendered; a task the reader refuses is named on its own line with control characters removed; no argument, two arguments, an unknown option, a missing root, a missing state directory, a directory or FIFO at a planned path, and a symlinked trace directory or context root leaving the root are each exit 2 with nothing on stdout and nothing written"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#skipped notes and could-not-run describe blocks"
        status: pass
    human_judgment: false
  - id: D6
    description: "The writer census admits the embedded atomicWrite only inside a regionSpans span of a fresh EMBED_SPECS target; outside regions the set is the measured three with dispositions; a control shows a writer outside a region and a renamed copy both stay in the outside set"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#37-06 — the temp-sibling-plus-rename writer is admitted inside a generated region only by rule (3 cases)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Edge concurrency truth: an interrupted render leaves each file either its old or its new bytes"
    requirement: SPLIT-03
    verification: []
    human_judgment: true
    rationale: "Atomicity rests on the embedded atomicWrite's temp-sibling-plus-rename shape, which the census and freshness gate hold equal to the authority; no test interrupts a render mid-rename. Held by review."

duration: 29min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 06: Per-ticket trace files and a one-line index on a host Summary

**The trace model now lives once in the import-free `scripts/trace-model.ts`. `scripts/runnable-ref/trace-render.js` is a single builtins-only file generated from that model and the context-io note read path. It reads published notes from the live and the archive context roots and writes one `memory-bank/plans/traceability/<ID>.md` per ticket, plus `traceability.md` as a one-line-per-ticket index. Re-running it gives the same bytes, and every write is a temp sibling plus a rename.**

## Performance

- **Duration:** about 29 min
- **Started:** 2026-10-22T09:45:35Z
- **Completed:** 2026-10-22T10:14:51Z
- **Tasks:** 1 (tracer)
- **Files modified:** 15 (6 created, 9 modified)

## Accomplishments

- **The model** (`scripts/trace-model.ts`). The code moved here from `scripts/trace-render.ts`:
  - classification (`RESERVED_PREFIXES`, `ID_SHAPE`, `isTicketRef`, `isTestRef`, `isCodeRef`, and `classifyRef`, formerly `classify`);
  - the cell escaper (`traceCell`);
  - the row merge (`buildTraceRows`, which takes `{ refs }[]`).

  New in the module:
  - `TRACE_GENERATED_HEADER`: names no command, so this repository and a host render the same bytes;
  - `renderTicketTrace`, `renderTraceIndex`, `traceFileName` and `planTraceTree`;
  - `collectTraceNotes(contextRoots, io)`: catches, counts and names a task whose read throws;
  - `HAND_TRACE_PATTERNS`: exactly two frozen, case-insensitive patterns with no `g` flag.

  The module imports nothing. Every sort uses `compareCodeUnits`, and the file has no `localeCompare` call.
- **The host renderer** (`scripts/runnable-ref/trace-render.ts`, second EMBED_SPECS row). Its generated region holds:
  - from state-layout: CONTEXT_REL, CONTEXT_ARCHIVE_REL, TRACE_DIR_REL and TRACEABILITY_REL;
  - from state-rules: stripControlChars;
  - the trace model;
  - from context-io: readRawNotesWithSkips, recordFromParsed, readRegularFileOrNull, atomicWrite and NOTE_SKIP_ARMS.

  The committed `.js` imports `node:crypto`, `node:fs` and `node:path` only. The CLI is `node trace-render.js <repo-root>`. A run goes in this order:
  - realpath the root;
  - read both context roots (an absent root counts as empty);
  - plan the tree;
  - lstat every planned path;
  - create the trace directory only after its parent resolves inside the root;
  - write each file through atomicWrite;
  - print one summary line, with tasks, notes, each skip arm in the reader's own order, unreadable tasks and files written, followed by one `UNREADABLE TASK` line for each unreadable task.
- **The writer census** (`scripts/context-io-writer-set.test.ts`, dated 2026-10-21, plan 37-06). Until now it read `scripts/context-io.ts` alone, so an embedded copy was invisible to it. It now has a tree-wide derivation of every function whose own body calls `writeFileSync`/`writeSync` and `renameSync`:
  - A copy is admitted only when it starts inside a `regionSpans` span of an EMBED_SPECS target whose region is fresh.
  - Outside regions, the set is pinned two-sided to the three measured members, each with a disposition.
  - A control shows that a copy outside a region, and a renamed copy, both stay in the outside set.

  The reader census (nonblocking-reader-parity) already admitted the embedded reader by the 37-03 rule, and it passed unchanged.

## Task Commits

1. **Task 1 (tracer): notes in two roots become per-ticket trace files and an index on a host:** `fc66553d` (feat)

**Plan metadata:** recorded in the docs(37-06) completion commit.

## Files Created/Modified

- `scripts/trace-model.ts`, `.js`, `.test.ts`: the model and 30 pure cases, including both cross-plan contracts. Those cases import indexLineFindings, normalizeDocument, stripHtmlComments and BUDGETS rather than retyping them.
- `scripts/runnable-ref/trace-render.ts`, `.js`, `.test.ts`: the host renderer and 11 host-emulation cases.
- `scripts/trace-render.ts`, `.js`: the moved declarations are deleted and imported from `./trace-model.js`. `buildRows(contextRoot)` and the monolithic `renderTraceability` keep their output.
- `scripts/generate-runnable-embeds.ts`, `.js`: the second row. EMBED_SPEC_COUNT 1 → 2, with a dated reason.
- `scripts/generate-runnable-embeds.test.ts`: the freshness-drift mirror now copies every target and every authority, and asserts that an unedited target is not reported.
- `scripts/context-io-writer-set.test.ts`: the generated-region writer rule and its control.
- `scripts/check-foundation-guards.test.ts`:
  - NON_TEST_MODULE_COUNT 105 → 107;
  - the `scripts/`-scoped corpus 68 → 69 (and 69 * 3);
  - the flat-reader pin 68 → 69;
  - TRIPWIRE_MODULES 77 → 78;
  - the LANG-07 issue-reference premises move from `trace-render.ts` to `trace-model.ts`.

  Each change carries a dated reason and was re-derived by listing.
- `scripts/board-readonly.test.ts`: the trace-render.js closure row gains `scripts/trace-model.js`, as jsImportClosure reports.
- `install/mode-census.test.ts`: SCRIPTS_TEST_FILE_COUNT 77 → 78 for `scripts/trace-model.test.ts`, which has no chmod call and reads no `.mode`.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The freshness-drift test mirrored only the first EMBED_SPECS row**
- **Found during:** Task 1, the first census run
- **Issue:** the gate re-derives every row, so a mirror of the state-check row alone reported the trace-render target as missing (ENOENT).
- **Fix:** the mirror copies every target and every authority, and edits only the first. The test also asserts that the other targets are not named.
- **Committed in:** fc66553d

**2. [Rule 2 - Missing critical] The writer census could not see any copy outside context-io.ts**
- **Found during:** Task 1
- **Issue:** the plan expected the embedded atomicWrite to show up as a new census member. The census derived writers only from `scripts/context-io.ts`, so it stayed green over any copy, inside a region or not.
- **Fix:** a tree-wide derivation by shape (a write primitive plus renameSync in one body). It found two pre-existing writers outside every region, `scripts/claim.ts:atomicWrite` and `install/install.ts:backupEditedKitFiles`. Both are now written dispositions in the pinned set, rather than being silently admitted.
- **Committed in:** fc66553d

**3. [Rule 2 - Missing critical] Boundary checks the action text did not spell out**
- The runnable calls the embedded `assertSafeTask` before it resolves a task's notes directory. A notes directory that resolves outside the root is a named unreadable task.
- A present non-regular entry at any planned path is exit 2 before the first write, so a FIFO or directory there is never opened and the render never stops half-written.
- A missing `memory-bank/plans/` is exit 2. The renderer does not create a state tree in a repository without grugops installed.
- **Committed in:** fc66553d

**4. [Rule 1 - Bug] The first draft of the host test hung on its own FIFO case**
- **Issue:** the test's `snapshot` helper used `readFileSync` on the index path, which the FIFO case had made a FIFO. The runnable itself refused correctly. The hung vitest run was killed.
- **Fix:** `snapshot` lstats each entry and records a non-regular one by kind, without opening it. The helper reads no `.mode`, so the mode census is not touched.
- **Committed in:** fc66553d

**5. [Plan detail] The model takes no text reader yet**
- One must-have truth says the model "receives the note reader and the text reader as parameters". This plan only needs the note reader (`collectTraceNotes`'s io). The text reader belongs to the tree comparison plan 37-07 adds to the same module, so it is not added here as an unused parameter.

**6. [Plan detail] Extra exports and roots**
- `TRACE_LINK_DIR`, `TRACE_COLUMNS`, `compareCodeUnits` and `traceCell` are exported from the model.
- `stripControlChars` (state-rules) and `NOTE_SKIP_ARMS` (context-io) were added as roots, so the printed values are sanitized and the arm order is the reader's own, never retyped.
- `traceCell` also flattens a lone CR. The monolithic render therefore differs only for a ref that contains a lone CR.

---

**Total deviations:** 6 (1 blocking, 2 missing critical, 1 bug, 2 plan details).
**Impact:** every must-have truth holds except the text-reader clause, which waits on plan 37-07 (deviation 5). No write-mode run touched this repository's tree: `git status --porcelain memory-bank` is empty.

## Issues Encountered

- Bootstrap order, as in 37-03: the runnable was first written with an empty region, then built, then filled by the generator, and the hand-written part was written last.
- `git ls-files 'scripts/**/*.ts'` does not match top-level files without `:(glob)` magic. The census uses `scripts/*.ts`, where git's `*` already crosses `/`.

## Verification

- `npm run build` and `npm run typecheck`: exit 0.
- Plan verify 1, with `scripts/freshness.test.ts` added after the commit: 10 files, 830 passed and 2 failed. Both failures are the 37-BASELINE `context-io-writer-set` pair, which reads archived phase-31 records.
- `npx vitest run scripts/context-io.test.ts -t "six routes"`: 1 passed.
- `node scripts/runnable-embeds-freshness.js`: 2 targets fresh. `npm run freshness`: 85 committed `.js` fresh.
- Related censuses:
  - validate, check-state-paths, check-platform-shapes, uat-spec-integrity: pass.
  - uat-gate-exit-contract: 5 failures, all baseline.
- These guards all exit 0: `check-state-paths`, `check-foundation-guards`, `check-nul-bytes` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`.
- Acceptance greps:
  - relative imports in both files: 0 and 0;
  - `function classify|function isTicketRef` in trace-render.ts: 0;
  - `.localeCompare(` in trace-model.ts: 0;
  - `CONTEXT_ARCHIVE_REL` in the runnable: 2;
  - `git status --porcelain memory-bank`: empty;
  - `export const HAND_TRACE_PATTERNS`: 1;
  - `indexLineFindings` in the test: 4;
  - `HAND_TRACE_PATTERNS` in the test: 8.
- Tracer gate (interactive, end-of-phase, automated-only verify): verify re-run on the committed tree, green apart from the baseline.
- Not run: the full non-e2e suite (project rule: plans 37-08, 37-13 and 37-19 run it).

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-07 can add `--check` (exit 1 on drift) and collision detection and tree comparison to `scripts/trace-model.ts`, plus a refusal to overwrite a hand-written `traceability.md` or trace file. Until 37-07 lands, this write mode has no header refusal and must not be run on an unmigrated tree.
- The runnable is not yet copied into `tools/grugops/` by the installer (plan 37-13).
- Flagged for the user before Phase 38's dogfood run: about 9% of dogfood notes are sealed, so a render over the dogfood tree will be sparse and its `unsealed` count large. This is reported, never fixed by weakening the seal.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All six created key files exist on disk, and the task commit fc66553d is an ancestor of HEAD. Every acceptance criterion and plan verification command above passed, apart from the two 37-BASELINE failures noted.
