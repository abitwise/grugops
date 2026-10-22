---
phase: 37-overview-board-per-file-records-and-budgets
plan: 12
subsystem: board-projector
tags: [board-read, board-model, done-archive, snapshot-version, golden, watch-layout, split-07]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-01 the contract's Done archive rule and BOARD_DONE_ARCHIVE_REL; 37-10/37-11 state-roll writing the archive with one ## Done (WIP unlimited) heading"
provides:
  - "The seventh joined source boardArchive (SOURCE_NAMES, SOURCE_COUNT = 7, FIXED_SUBPATHS.boardArchive = BOARD_DONE_ARCHIVE_REL)"
  - "joinSnapshot archive placement: archive rows place for ticket-unplaced only, board plus archive rows are ticket-duplicated naming both places"
  - "ticket-unplaced gated on an ok tickets source AND an ok boardArchive source"
  - "SCHEMA_VERSION = 3, the contract at 3, and the regenerated golden, in one commit"
  - "A seventh watched directory, memory-bank/plans/archive, reported against boardArchive"
affects: [37-13, 37-19, 38]

actuals:
  tokens: 23810
  tasks: 2
  commits: 3
plan_head_before: 084c512dc4b624a1835105333bd1e3147b12e0db
plan_head_after: 46db6beccfcbaeed064de00b3cd21595fc3cae8d

tech-stack:
  added: []
  patterns:
    - "An absent optional file source answered as an ok empty model inside its own reader, never through settleSource's fallback arm (which stays the config dial's)"
    - "A placement carries an archived flag, so the arms that must read the board only filter on it rather than on a second list"

key-files:
  created:
    - scripts/fixtures/board-snapshot/memory-bank/plans/archive/board-done.md
    - scripts/fixtures/board-snapshot/memory-bank/plans/tickets/ABC-201.md
  modified:
    - agent-factory/contracts/board.md
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-model.test.ts
    - scripts/board-read.test.ts
    - scripts/board-tracer.test.ts
    - scripts/board-dashboard.test.ts
    - scripts/board-watch.test.ts
    - scripts/fixtures/board-snapshot/README.md
    - scripts/fixtures/board-snapshot/expected-snapshot.json

key-decisions:
  - "An absent Done archive settles ok with the model of an empty document (parseBoard of the empty string), so it places nothing and suppresses nothing; an archive that was read before and is now absent is also ok and empty, because the contract says an absent archive is an empty archive"
  - "An unreadable archive on a first read settles unavailable with a readErrors entry (no fallback value), which the header badges as never read and the discriminant reports as stale; with a previous good read it settles stale carrying that value. Both suppress ticket-unplaced"
  - "ticket-duplicated counts board rows and archive rows together; an archived place is named as its column plus the archive path, and the expected sentence reads one row, on the board or in the Done archive only when an archive row is involved, so board-only duplicates keep their old sentence"
  - "The archive is read with the dial's id_prefix, the value the board is read with"
  - "The Done archive's directory gets its own watch (WATCH_DIR_COUNT 7), because the state root's watch is not recursive"

patterns-established:
  - "A seventh source lands with every derived pin re-derived by listing and given a dated reason: SOURCE_COUNT, WATCH_DIR_COUNT, the routing universe, PUBLISHED_SUBSTITUTION_COUNT and the byte-order-mark grammar set"

requirements-completed: [SPLIT-01, SPLIT-07]

coverage:
  - id: D1
    description: "The projector reads the Done archive as the seventh source boardArchive with parseBoard; an archived ticket raises no ticket-unplaced, and deleting the archive brings the conflict back"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#board-read — the Done archive is the seventh source (plan 37-12, D-15)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#board-read — the source set (D-12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Snapshot version 3: SCHEMA_VERSION = 3, the contract reads 3 and says version 3 added boardArchive, and the golden is regenerated with no ticket-unplaced for ABC-201, all in commit e3df41bf"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — the committed golden freezes schemaVersion 3 byte for byte (D-19)"
        status: pass
      - kind: other
        ref: "git show --stat e3df41bf lists scripts/board-model.ts, agent-factory/contracts/board.md and expected-snapshot.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every placement rule of the contract's Done archive section: board plus archive is one ticket-duplicated naming both places, 25 archive rows move no WIP number and raise no wip or column-missing conflict, an unavailable or stale archive suppresses ticket-unplaced and nothing else, an absent archive suppresses nothing"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — the Done archive in the join (plan 37-12, D-15)"
        status: pass
      - kind: integration
        ref: "scripts/board-read.test.ts#board-read — the Done archive source (plan 37-12, D-15)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The dashboard badges all seven sources and the watch layout includes memory-bank/plans/archive for boardArchive"
    requirement: SPLIT-01
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#board-dashboard — the Done archive is the seventh badged source (plan 37-12, D-15)"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#board-dashboard — the watched directory set (D-14)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The generated trace index is read as one TraceRow per index line through the Ticket header rule, with no per-ticket trace file opened"
    requirement: SPLIT-01
    verification:
      - kind: integration
        ref: "scripts/board-read.test.ts#reads the generated trace index as one TraceRow per index line, with no trace file opened"
        status: pass
    human_judgment: false
  - id: D6
    description: "SPLIT-07: TICKET_KEY_COUNT stays 8; blocked:, blocked_reason: and Status: are refused by name; empty and ## Blocked bodies, and either section order, admit with equal values"
    requirement: SPLIT-07
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — the ticket key set stays closed at eight (SPLIT-07, v3.0 D-9)"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 12: The Done archive as the projector's seventh source, snapshot version 3 Summary

**The projector reads `memory-bank/plans/archive/board-done.md` as a seventh source, `boardArchive`, with the same `parseBoard` grammar and the dial's `id_prefix`. A ticket whose only row was rolled into the archive stays placed. A ticket with a row on the board and a row in the archive is one `ticket-duplicated` naming both places. `ticket-unplaced` is derived only while the tickets source and the archive source are both `ok`. The published snapshot is version 3, and the contract and the regenerated golden say so in the same commit.**

## Performance

- **Duration:** about 23 min
- **Started:** 2026-10-22T15:03:38Z
- **Completed:** 2026-10-22T15:26:07Z
- **Tasks:** 2 (Task 1 the tracer; Task 2 TDD, RED then GREEN)
- **Files modified:** 16 (2 created, 14 modified)

## Accomplishments

- **The reader (`scripts/board-read.ts`):**
  - `SOURCE_NAMES` gains `boardArchive` after `config`, so the first six keep their order.
  - `SOURCE_COUNT` moves from 6 to 7, with a dated reason that cites D-15.
  - `FIXED_SUBPATHS.boardArchive` is `BOARD_DONE_ARCHIVE_REL`, a named import from `install/state-layout.js`.
  - `readBoardArchiveSource` reads the file through `gatherFile` and `settleSource`, inside `guarded` like every other source.
  - An absent file settles `ok` with an empty model.
  - Any other failure settles through the normal arms, so it raises a badge and a `readErrors` entry.
- **The join (`scripts/board-model.ts`):**
  - Archive ticket rows are kept in their own map, and each placement carries an `archived` flag.
  - `ticket-unplaced` skips a ticket that has an archive row. It is gated on `placementsComplete`, which means the tickets source and the archive source are both `ok`.
  - `ticket-duplicated` counts board rows and archive rows together. `placeOf` names an archived row as `Done in memory-bank/plans/archive/board-done.md`.
  - `board-vs-ticket`, `row-without-file`, the WIP arms and `column-missing` still read only the board.
  - `SCHEMA_VERSION = 3`, with a comment that names D-15 and the added source.
- **The contract (`agent-factory/contracts/board.md`):**
  - The snapshot version section now says "it is **3**" and states that version 3 added `boardArchive`. The version 2 sentence stays as history.
  - The Staleness section names `boardArchive` as the seventh joined source.
  - The Conflicts section says `ticket-unplaced` also needs the archive to be `ok`.
  - The Done archive section's "until that commit" sentence is now past tense.
- **The fixture and the golden:**
  - The archive file holds one row, which places `ABC-201`. `ABC-201.md` has status `done` and column `Done`.
  - Both files are in the README table.
  - `expected-snapshot.json` was regenerated with the documented command. It reads `"schemaVersion": 3`, has a `boardArchive` source in state `ok`, and has no `ticket-unplaced` for `ABC-201`. `ABC-200` still has one.
- **The dashboard (`scripts/board-dashboard.ts`):**
  - `deriveWatchDirs` already yielded `memory-bank/plans/archive` for `boardArchive`. `WATCH_DIR_COUNT` moves from 6 to 7 with a dated reason.
  - The docblock says why the archive needs its own watch: the state root's watch is not recursive.

## Task Commits

1. **Task 1 (tracer): the archived Done row keeps its ticket placed in the published snapshot.** `e3df41bf` (feat). This one commit holds SCHEMA_VERSION 3, the contract at 3 and the regenerated golden.
2. **Task 2 RED: failing cases for the archive watch directory, plus a case for every Done archive placement rule.** `b22309b7` (test).
3. **Task 2 GREEN: the seventh watched directory.** `46db6bec` (feat).

**Plan metadata:** recorded in the docs(37-12) completion commit.

**Tracer gate:** the run is interactive with `end-of-phase` mode, and the tracer's `<verify>` has `<automated>` steps only. So the gate re-ran verify instead of stopping. These all passed before the commit: build, typecheck, the four verify test files (656 tests), `runnable-embeds-freshness` (3 targets fresh), `npm run freshness` (86 files fresh) and the four prose gates (imperative-lexicon, banned-claims, claim-anchors, kit-refs; exit 0 each).

### RED evidence (Task 2)

- **Command:** `npx vitest run scripts/board-watch.test.ts --reporter=tap-flat`. It ran over HEAD `e3df41bf` with the new and updated tests.
- **Result:** exit 1, 55 tests, 3 failed.
  - The target case, `pins the watched-directory count two-sided against the derived list`, failed with "expected 6 to be 7".
  - `arms NOTHING before a read has resolved a root` failed: it wrote 7 records, and WATCH_DIR_COUNT is 6.
  - The seven-directory armed-set premise failed: 7 directories were armed, and WATCH_DIR_COUNT is 6.
- **Classifier:** `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format tap). The record is kept in the session scratchpad, not in the repository.
- **Semantic assessment:** each target ran and failed on its planned assertion, the watched-directory count. There was no load, fixture or syntax fault.
- The join, reader, dashboard-badge, trace-index and SPLIT-07 cases in the same commit passed on their first run. Task 1's commit already held the duplicate and gate rules (see Deviations), and the badge, trace-index and key-set behavior already existed. Those cases lock the behavior in place. They were not the RED target.

## Files Created/Modified

- `scripts/board-read.ts`, `.js`: the seventh source, its reader and its place in `readSnapshot` and `readErrors`.
- `scripts/board-model.ts`, `.js`: `SourceName`, `SourceValues.boardArchive`, the archive placement map, `placementsComplete`, the duplicate arm, `placeOf`, and `SCHEMA_VERSION = 3`.
- `scripts/board-dashboard.ts`, `.js`: `WATCH_DIR_COUNT = 7` and the docblock.
- `agent-factory/contracts/board.md`: version 3 and the boardArchive sentences.
- `scripts/fixtures/board-snapshot/...`: the archive, `ABC-201.md`, the README rows and the regenerated golden.
- Tests:
  - `board-tracer`: the version and source pins, plus 3 fixture cases.
  - `board-model`: the golden pin and an ABC-201 golden case, 7 join cases and 6 key-set cases.
  - `board-read`: 5 seam cases and a byte-order-mark archive case.
  - `board-dashboard`: the seven-badge case.
  - `board-watch`: the seven-directory pin, the archive-directory case, and the armed and refused sets.

## Decisions Made

See `key-decisions` above. The two rules a later reader is most likely to question:

- **An absent archive is `ok` and empty even when the previous read had one.** The contract says "An absent archive is an empty archive". The generic rule that a file gone since the last read is stale does not apply to this source. A roll creates the archive, and only a person can remove it.
- **An unreadable archive on a first read is `unavailable`, not `stale`.** No previous value exists to carry, and the `fallback` arm belongs to the config dial alone. The difference still shows: `unreadableSources` names it, the header badges it as "never read", and the discriminant reads `stale`. With a previous good read, it settles `stale` and carries that value.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan detail] Task 1 already held the duplicate and gate rules**
- **Found during:** Task 1.
- **Issue:** The join change for archive placement needs the archive placement map. `ticket-duplicated` over board plus archive reads the same map. Task 1's must-haves also list the D-15 duplicate rule.
- **Fix:** both rules landed in `e3df41bf`. Task 2's join and reader cases therefore passed on first run. Its RED target was the watch layout, which Task 1 had not touched.
- **Committed in:** e3df41bf, b22309b7.

**2. [Plan detail] Wording of "stale" for a directory at the archive path**
- The behavior line says "settles boardArchive stale". On a first read, the state is `unavailable` with a `readErrors` entry, and the discriminant and badge say stale (decision 2 above). A second read after a good one is `stale` with reason `unreadable`. Both are tested, and both suppress `ticket-unplaced` while `ticket-duplicated` and the board-only kinds are still derived.

**3. [Rule 2 - Missing critical] The census pins the seventh source moves**
- Each pin was re-derived by listing and given a dated reason (2026-10-22):
  - the routing universe: a second `parse`, `readBoardArchiveSource`, and 16 to 17 anonymous members (the `guarded` closure);
  - `PUBLISHED_SUBSTITUTION_COUNT` from 91 to 93, with `return:placeOf` classified as a published receiver, because its two substitutions reach a conflict's `actual`;
  - `GRAMMAR_SOURCES` gains `boardArchive`, with a byte-order-mark archive case that measures the claim;
  - `WATCH_DIR_COUNT` from 6 to 7;
  - the hand-written armed set (from six to seven) and refused set (from three to four) in `board-watch.test.ts`.
- **Committed in:** e3df41bf, b22309b7, 46db6bec.

**4. [Plan detail] Contract sentences the plan did not list**
- The plan pointed to "the sentence near line 363". That sentence is in Staleness, now line 444.
- A sentence was added to the Conflicts section's listing-completeness paragraph.
- The Done archive section's "Until that commit, the snapshot version stays 2" sentence was rewritten in the past tense, because it would otherwise be false.
- **Committed in:** e3df41bf.

**5. [Plan detail] Dated reasons carry 2026-10-22**
- The action text says 2026-10-21. The work ran on 2026-10-22, so the dated reasons carry that date, as the orchestrator's handoff asks.

**6. [Plan detail] Two archive rows of one identifier are also `ticket-duplicated`**
- Board rows and archive rows are counted together, so a duplicate inside the archive alone is reported too. state-roll refuses to create one, so only a hand edit can reach it. This shape has no dedicated test.

---

**Total deviations:** 6 (1 missing-critical census move, 5 plan details). **Impact:** every must-have truth holds, and the conflict kind set and the ticket key set are unchanged.

## Issues Encountered

- The first run of the new Task 2 tests had three faults in the tests themselves, each fixed before the RED commit:
  - the badge parser split inside `(age, reason)`;
  - the column case did not filter out the `row-without-file` its own board raised;
  - the directory case missed the board-vs-ticket and wip-count findings its own board raised. The board was changed to `WIP 2/3`, and the expected kinds now include `board-vs-ticket`.
  None of these was a code defect.

## Verification

- `npm run build`, `npm run typecheck`: exit 0.
- `npx vitest run` over the board files (model, read, tracer, dashboard, watch, readonly): 723 passed.
- Final run: the derived set, every test naming a changed file, and the census set. It ran once, with 1 worker, in two sequential calls over 28 files, after the GREEN code.
  - Files: board-corpus, board-oracle, board-watch-live, check-foundation-guards, check-state-paths, nonblocking-reader-parity, context-io-writer-set, board-readonly, validate, generate-guarantees, generate-runnable-embeds, state-check, state-roll, state-rules, trace-model, state-layout, mode-census, and others.
  - Result: 2,957 passed and 9 failed. All 9 are in 37-BASELINE.md: context-io-writer-set 31-14 (2) and context-io 31-23/31-29 (7). No new failure.
- `node scripts/runnable-embeds-freshness.js`: 3 targets fresh. The parseBoard closure did not change, so no regeneration was needed.
- `npm run freshness`: 86 files fresh.
- The four prose gates exit 0.
- Acceptance greps:
  - `boardArchive` appears 9 times in board-read.ts.
  - `SCHEMA_VERSION = 3;` appears once.
  - `and it is **3**` appears once and `and it is **2**` appears 0 times.
  - `"schemaVersion": 3` appears once.
  - `TICKET_KEY_COUNT = 8;` appears once and `= 9` appears 0 times.
  - `CONFLICT_KIND_COUNT = 7;` appears once and `= 8` appears 0 times.
- No vitest process is left running. `git branch --show-current` is main.

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-13's full run covers this plan's changes. The golden is at version 3, so a consumer of `--json` sees `boardArchive` beside the other six sources.
- Phase 38's migrate can roll Done rows without a false `ticket-unplaced`.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

- FOUND: scripts/fixtures/board-snapshot/memory-bank/plans/archive/board-done.md
- FOUND: scripts/fixtures/board-snapshot/memory-bank/plans/tickets/ABC-201.md
- FOUND: e3df41bf, b22309b7, 46db6bec (ancestors of HEAD; `evaluation-scope --plan 37-12 --commits-only` resolves all three)
