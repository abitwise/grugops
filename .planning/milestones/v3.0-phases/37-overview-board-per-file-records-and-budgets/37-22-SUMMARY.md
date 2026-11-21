---
phase: 37-overview-board-per-file-records-and-budgets
plan: 22
subsystem: testing
tags: [auth-1, wr-01, trace-model, board-model, trace-render, state-check, generate-runnable-embeds, typescript]

requires:
  - phase: 37-21
    provides: planCompleteTraceTree, the one completeness predicate both trace runnables call
provides:
  - "WR-01 closed: the board grammar's isTicketId (scripts/board-model.ts) is the one answer to 'is this a ticket identifier' for the board, the trace model and both trace runnables"
  - "trace-model.ts: TicketIdTest parameter on isTicketRef, classifyRef, buildTraceRows and planCompleteTraceTree; TRACE_FILE_NAME_MAX_BYTES (255); traceFileNameRefusals"
  - "trace-render checks every planned trace file name before its first lstat or write, in both modes (exit 2 on a refused name)"
  - "The 18-member AUTH-1 agreement corpus, the isTicketRef syntax-tree check and the trace-render call-order census"
affects: [37-24, 37-27]

actuals:
  tokens: 13160
  tasks: 2
  commits: 2
plan_head_before: 86e3d04456e56612a8fea386dda3ba03e7db1cb3
plan_head_after: 5fc564923fddd827ba5c281ee452840b14fa50cf

tech-stack:
  added: []
  patterns:
    - "One authority passed as a parameter: the import-free trace model takes the board grammar's predicate (TicketIdTest), and each runnable passes its generated copy (the D-16 sectionEndIndex precedent)"
    - "A runnable's statement order proven by a syntax-tree census over the committed .js (ScriptKind.JS), counting only statements after EMBED_CLOSE"

key-files:
  created: []
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/trace-model.test.ts
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/context-io.test.ts

key-decisions:
  - "isTicketId is TICKET_ID and not EPIC_ID; matchRow keeps its epic arm first, then asks isTicketId, so the board's answers did not move (board-model, board-read and board-corpus tests pass unchanged)"
  - "isTicketRef takes the reserved prefix as the text before the last hyphen, with no regular expression of its own; ID_SHAPE stays only in classifyRef's column choice for refs that are not tickets"
  - "Refs the board grammar refuses (utf-8, abc-1, a 300-letter ref) are no longer tickets, but classifyRef's any-other-identifier arm still lists them under Requirement in the trace file of a ticket on the same note, as the plan's step 3 says"
  - "traceFileNameRefusals has two arms: the grammar arm (not <board id>.md) and the byte-limit arm; the byte-limit arm is unreachable with the real isTicketId and is unit-tested with a predicate that admits everything"

patterns-established:
  - "Call-order census: one call, its top-level statement index, no enclosing branch on CHECK, a const-guard if before the first top-level path effect whose then-branch calls couldNotRun"

requirements-completed: [SPLIT-03]

coverage:
  - id: D1
    description: "WR-01 end to end: a sealed note with ABC-1, CWE-79, utf-8, abc-1, a 300-letter ref and #41 renders exit 0 with exactly ABC-1.md and CWE-79.md and two index ticket lines, empty stderr; --check exit 0; state-check with the D-14 marker exit 0 with no trace finding"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#WR-01: a ref the board grammar refuses is never a ticket, so it never becomes a trace file name"
        status: pass
    human_judgment: false
  - id: D2
    description: "AUTH-1 agreement corpus (18 members): isTicketRef equals isTicketId minus the reserved prefixes; the trace never accepts what the board refuses; today's tickets pinned; the longest board identifier fits BUDGETS.indexEntryBytes and TRACE_FILE_NAME_MAX_BYTES; no fold collision among board identifiers; isTicketRef asks its predicate and holds no regex literal"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#AUTH-1 agreement: the trace's ticket test is the board grammar's, minus the reserved prefixes (plan 37-22, WR-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pre-write name check: traceFileNameRefusals gives one reason per illegal planned key in code-unit order (model), and the committed trace-render.js calls it once at top level, outside any CHECK branch, before the first lstat or write, with a guard that reaches couldNotRun (census)"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#traceFileNameRefusals: every planned trace file name is legal before the first write (plan 37-22, WR-01)"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/trace-render.test.ts#WR-01 call order: trace-render checks every planned file name before the first path effect, in both modes"
        status: pass
    human_judgment: false
  - id: D4
    description: "Generator and gates: isTicketId embedded in the trace-render and state-check regions (state-roll's region follows matchRow); freshness, runnable-embeds, traceability, hook-manifest, foundation guards and state paths all exit 0; grugops's own trace unchanged"
    verification:
      - kind: other
        ref: "npm run -s freshness:runnable-embeds; npm run -s freshness; npm run -s freshness:traceability; node scripts/check-foundation-guards.js; node scripts/check-state-paths.js"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 22: WR-01, the board grammar decides the trace's tickets Summary

**The trace takes its ticket answer from the board grammar: `isTicketId` (TICKET_ID and not EPIC_ID) is exported from scripts/board-model.ts, embedded into both trace runnables, and passed into every trace-model function that decides a ticket. A lowercase or over-long ref no longer becomes a trace file. trace-render now checks every planned file name before its first lstat or write.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-10-23T13:47:33Z
- **Completed:** 2026-10-23T14:11:31Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- `scripts/board-model.ts`: `export function isTicketId(id)` returns `TICKET_ID.test(id) && !EPIC_ID.test(id)`. matchRow's ticket arm now calls it, so the module states the ticket rule in one place.
- `scripts/trace-model.ts`: `TicketIdTest` type. These now take the predicate: `isTicketRef(ref, isTicketId)`, `classifyRef(ref, isTicketId)`, `buildTraceRows(notes, isTicketId)` and `planCompleteTraceTree(collection, isTicketId, traceabilityRel, traceDirRel)`. isTicketRef's body has no regular expression. ID_SHAPE only picks the column of a ref that is not a ticket. The docstrings of traceFileName, ownedTraceEntries and caseFoldCollisions now name the board grammar.
- `TRACE_FILE_NAME_MAX_BYTES = 255` and `traceFileNameRefusals(plan, traceDirRel, isTicketId)`. trace-render calls it right after the complete plan and before the pre-write lstat loop, in both modes. A non-empty result is could-not-run (exit 2): it names each key and says nothing was written. The header's D-12 exit-2 list now includes this case.
- `EMBED_SPECS`: the trace-render row gains `{ module: "scripts/board-model.ts", roots: ["isTicketId"] }` and `traceFileNameRefusals` in its trace-model roots. The state-check row's board-model roots gain `isTicketId`. A dated plan 37-22 comment was added. The trace-render region now has a `// from scripts/board-model.ts` block that holds isTicketId. State-roll's region follows the matchRow change.

## Task Commits

1. **Task 1: End-to-end WR-01, the board grammar decides the trace's tickets (tracer)**: `fe7cd669` (fix)
2. **Task 2: The agreement corpus and the pre-write name check**: `5fc56492` (fix)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the `<verify>` block has only automated checks. Both automated blocks were run: build, typecheck, runnable-embeds and 7 test files (598 passed), then freshness, traceability and own-tree state-check (exit 0). The plan then continued to Task 2 with no checkpoint.

## RED runs

**Task 1, against the committed runnable at `86e3d044`.** The new WR-01 case failed on its first assertion (status 0). The run exited 1 with `COLLISION ABC-1, abc-1: these ticket identifiers name one trace file on a case-insensitive disk...` because abc-1 was a ticket. A standalone run with the same committed `.js` and the note refs without abc-1 (ABC-1, CWE-79, utf-8, the 300-letter ref, #41) reproduced 37-REVIEW WR-01:
- Render 1 exited 2: `Error: memory-bank/plans/traceability/AAAA...A-1.md cannot be written (ENAMETOOLONG); 1 file(s) were written`. The 300-letter name sorts before ABC-1, so the index was the one file written.
- Render 2 exited 2 at the pre-write check: `... AAAA...A-1.md cannot be inspected (ENAMETOOLONG). The trace render did not run.` So one malformed ref blocks every later render.

**Task 2.** The new cases ran against `fe7cd669`'s committed `trace-model.js` and `trace-render.js`, written into the working tree from HEAD and rebuilt afterwards. 5 failed and 4 passed:
- The census failed on its planned assertion: `expected [] to have a length of 1` (no traceFileNameRefusals call).
- The three refusal cases and the budget case failed on `traceFileNameRefusals is not a function` and on `TRACE_FILE_NAME_MAX_BYTES` being undefined. The target was absent: each test ran and failed at its own call, not at setup or load.
- The 4 agreement cases passed: the corpus, the pin, the fold check and the syntax-tree check. Task 1 had already delivered the agreement, so these cases pin it and their RED is the mutation (a) below.

## Rewritten tests (none deleted)

| Case | Old expectation | New expectation |
|---|---|---|
| `scripts/trace-model.test.ts` `THREE_ROWS` (renamed `INDEX_ROWS`), used by the index, budget, hand-trace and plan cases | rows ABC-2, ABC-10, abc-3; index lines for all three; plan keys include `abc-3.md`; it.each labels "three rows" | rows ABC-2, ABC-10; index lines and plan keys for those two; labels "two rows" |
| `scripts/trace-model.test.ts` `rows sort by code units, so the order does not depend on the locale` (now `...; a lowercase ref is no ticket (plan 37-22)`) | `buildTraceRows([abc-3],[ABC-2],[ABC-10])` ids `["ABC-10","ABC-2","abc-3"]` | ids `["ABC-10","ABC-2"]` |
| `scripts/runnable-ref/trace-render.test.ts` `notes carrying ABC-1 and abc-1 make the run exit 1 naming both, and nothing is written` -> `abc-1 is not a ticket under the board grammar: one trace file, no collision, exit 0` | write and --check exit 1 with `COLLISION ABC-1, abc-1`, nothing written | write exit 0, no COLLISION, trace directory `["ABC-1.md"]`, index without abc-1; --check exit 0 |
| `scripts/runnable-ref/trace-render.test.ts` `a ticket re-cased from abc-1 to ABC-1 renders once and --check is then fresh` | first render exit 0, which wrote abc-1.md | first render exit 0, asserts no `abc-1.md` and no abc-1 in the index; the re-cased half is unchanged |
| `scripts/runnable-ref/state-check.test.ts` `two ticket identifiers that fold to one file name are a finding` (retitled `...: ABC-1 with abc-1 is none, since abc-1 is no ticket under the board grammar`) | render --check exit 1; state-check exit 1 with one trace-collision naming `ABC-1, abc-1` | render exit 0, --check exit 0; state-check exit 0, no trace-collision, `trace` equals `{ compared: true, findings: [] }` |

The pure `caseFoldCollisions` unit cases did not change. Signature-only updates: every `classifyRef`, `isTicketRef`, `buildTraceRows` and `planCompleteTraceTree` call in trace-model.test.ts, and the one `buildTraceRows` call in `scripts/context-io.test.ts` (R1 route 5), which now imports `isTicketId` from the committed board-model.js. Case-definition counts against HEAD: trace-model.test.ts 29 -> 29 (Task 1), then +8 in Task 2. trace-render.test.ts 32 -> 34 (Task 1), then +1. state-check.test.ts 69 -> 69. None fell.

## Own trace

`npm run -s freshness:traceability` was fresh after Task 1, because grugops's own tree has 0 tasks and 0 notes. No trace file was rendered or removed, and `memory-bank/plans/traceability/` still holds only `.gitkeep`.

## Mutation proofs (working tree only, each reverted with `git checkout --` and a rebuild)

- **(a)** isTicketRef used a local `/^([A-Za-z][A-Za-z0-9]*)-\d+$/` instead of its parameter, emitted with `npx tsc --noEmitOnError false` (TS6133 unused parameter). 5 trace-model cases failed:
  - the corpus: first mismatch `"utf-8": expected true to be false`; the disagreeing members were utf-8, abc-1, the 300-letter ref, the 17-character prefix and the 10-digit number
  - the pin: the accepted list grew from 3 to 8
  - the syntax-tree case: `expected [] to include 'isTicketId'`
  - the corpus-plan refusal case
  - the rewritten code-unit sort case: `abc-3` came back
- **(b)** trace-render's `traceFileNameRefusals` statement and its `if` were moved after the pre-write lstat loop and rebuilt. The census failed: `traceFileNameRefusals runs after the first path effect: expected 43 to be less than 42`.
- After both reverts, `git status --porcelain scripts/trace-model.ts scripts/runnable-ref/trace-render.ts` (and all of `scripts/`) is empty. runnable-embeds and freshness are fresh, and the three trace test files pass 186 of 186. No mutation was committed.

## AUTH-1 class table: "is this a ticket identifier" (final)

| Site | Before | After this plan | Covered by |
|------|--------|-----------------|------------|
| scripts/board-model.ts TICKET_ID and EPIC_ID, used by matchRow | the authority, spelled inline in matchRow | `isTicketId` exported; matchRow asks it | board-model, board-read and board-corpus tests unchanged and passing; WR-01 board case |
| scripts/trace-model.ts RESERVED_PREFIXES with ID_SHAPE in isTicketRef | a second answer | the passed predicate plus reserved prefixes; no regex in the body | agreement corpus; syntax-tree case; mutation (a) |
| scripts/trace-model.ts classifyRef ID_SHAPE | decided tickets through isTicketRef | picks only the column of a non-ticket ref | classifyRef cases |
| Generated copies: state-check region (TICKET_ID, ID_SHAPE), trace-render region (ID_SHAPE), state-roll region (TICKET_ID via parseBoard) | independent copies | regenerated from the authorities; trace-render and state-check carry isTicketId and pass it | `npm run freshness:runnable-embeds` |
| scripts/context-io.test.ts:17712 traceModel.buildTraceRows | caller | passes boardModel.isTicketId | context-io R1 case (in regression run) |
| scripts/validate-agent-factory.ts checkTickets | ticket id = file name without `.md`, then a substring test on the trace | not a shape answer; not in the class | out of round 1 scope, see 37-REVIEW-DISPOSITION.md (WR-03) |
| scripts/board-read.ts parseTraceability | reads index cells, decides no shape | unchanged | out of round 1 scope, see 37-REVIEW-DISPOSITION.md (WR-03) |
| scripts/state-rules.ts NFR_INDEX_LINE and NFR_FILE_NAME | the NFR identifier, a different question | unchanged | not in the class |

## Regression

Scope reason: this is the plan's recorded deviation from brief §3. The subset is the deduplicated union of the keyword list and the inventory guard, derived by the plan's `git grep -l -E` command. The full non-e2e suite runs at 37-24 and 37-27.

- **Union list:** 44 test files.
- **Result (Task 2 uncommitted, Task 1 committed):** 44 files, 4512 tests: 10 failed, 4501 passed, 1 skipped, in 767 s.
- **All 10 failures are in 37-BASELINE.md:** canonical-corpus 1 (provenance), context-io-writer-set 2 (31-14), context-io 7 (31-23 PROBE 5 and the six 31-29 cases). No new failure. The `FAIL  the exemption document ...` lines in the log are console output from mirror cases that passed.
- **Gates (exit 0):** `npm run build`, `npm run typecheck`, `npm run -s freshness` (86 outputs), `freshness:runnable-embeds` (3 targets), `freshness:traceability`, `freshness:hook-manifest` (13 module hashes, no context-io change), `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js`, `node scripts/check-nul-bytes.js`. On grugops's own tree, `node scripts/runnable-ref/state-check.js .` prints `No findings.` and exits 0.
- `pgrep -fl vitest` after each run found no orphaned worker.

## Files Created/Modified

- `scripts/board-model.ts` (+ `.js`): isTicketId; matchRow uses it; idPrefixOf docstring
- `scripts/trace-model.ts` (+ `.js`): TicketIdTest parameter through the classification; TRACE_FILE_NAME_MAX_BYTES; traceFileNameRefusals; header and docstrings
- `scripts/generate-runnable-embeds.ts` (+ `.js`): isTicketId in the trace-render and state-check rows; traceFileNameRefusals in the trace-render row; dated comment
- `scripts/runnable-ref/trace-render.ts` (+ `.js`): passes isTicketId; the pre-write name refusal; D-12 header; regenerated region
- `scripts/runnable-ref/state-check.ts` (+ `.js`): passes isTicketId; regenerated region
- `scripts/runnable-ref/state-roll.ts` (+ `.js`): regenerated region only (matchRow calls isTicketId)
- `scripts/trace-model.test.ts`: signatures, rewritten old-shape cases, the AUTH-1 corpus describe and the traceFileNameRefusals describe
- `scripts/runnable-ref/trace-render.test.ts`: WR-01 describe, two rewritten cases, the call-order census
- `scripts/runnable-ref/state-check.test.ts`: one rewritten case
- `scripts/context-io.test.ts`: the R1 buildTraceRows call passes isTicketId

## Decisions Made

- isTicketRef's reserved-prefix test reads the text before the last hyphen, without `toUpperCase`, because every identifier the board admits is already upper case.
- `traceFileNameRefusals` reports one reason per key, and the grammar arm takes precedence over the byte-limit arm. Keys outside `<traceDirRel>/` (the index) are not asked.
- The plan's "rows become ABC-10 and ABC-2" was applied to the shared index fixture too. It was renamed `INDEX_ROWS` so its name does not claim three rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Embed regeneration while the hand-written part already names a new root (process only)**
- **Found during:** Tasks 1 and 2
- **Issue:** `npm run generate:runnable-embeds` begins with a full `tsc`. That fails under `noEmitOnError` while a runnable calls `isTicketId` or `traceFileNameRefusals` before it is embedded.
- **Fix:** `npx tsc --noEmitOnError false`, then `node scripts/generate-runnable-embeds.js`, then `npm run build`, the same sequence 37-21 used. The committed `.js` come from the final clean build, and freshness confirms them.
- **Committed in:** n/a (no code change)

**2. [Order] Task 2 committed before its mutation proofs**
- **Found during:** Task 2
- **Issue:** The mutation reverts use `git checkout -- <file>`, which would have thrown away uncommitted Task 2 work in the same files.
- **Fix:** Task 2 was committed after its verify and regression run. Both mutations were then applied and reverted against the committed state. The acceptance check (porcelain empty after the reverts) holds.

---

**Total deviations:** 1 auto-fixed (Rule 3, process) and 1 ordering note.
**Impact on plan:** no scope change. No pin or guard predicate was changed, and the hook manifest, mode census and LANG-07 counts did not move.

## TDD Gate Compliance

Task 2 is `tdd="true"`. Its RED was run and recorded above but not committed on its own: brief §3 forbids a red commit, and `workflow.tdd_mode` is off. Each task is one `fix(37-22)` commit. There is no `test(37-22)` / `feat(37-22)` pair.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. The plan's T-37-49 mitigation is in place: the board grammar bounds identifiers, and traceFileNameRefusals runs before the first write. T-37-50 (CWE-79 as a ticket) stays accepted, and the corpus pins it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 37-23. The regression failures plan 37-24 finds in its full run can be compared against this subset's baseline-only result.
- REQUIREMENTS.md rows were not flipped (brief §3). SPLIT-03 is shared with later round-1 plans.

## Self-Check: PASSED

- FOUND: `export function isTicketId` in scripts/board-model.ts; `traceFileNameRefusals` in scripts/trace-model.ts; `isTicketId` in scripts/generate-runnable-embeds.ts
- FOUND: fe7cd669 and 5fc56492 are ancestors of HEAD
- Acceptance: `-t WR-01` passes; the corpus asserts 18 members; the census passes on the committed `.js` and fails under mutation (b); porcelain is empty after the reverts; the regression subset shows only the baseline failures

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*
