---
phase: 37-overview-board-per-file-records-and-budgets
plan: 11
subsystem: state-budgets
tags: [host-runnable, state-roll, progress-archive, done-archive, line-conservation, duplicate-refusal, runnable-embeds, lang-07, split-06, split-01]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-10: the Done roll, assembleRoll, checkConservation, executeRoll (injected io) and the third EMBED_SPECS row"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-05: progressEntries (classification only, no extents); D-16 (the human, 2026-10-22): entry extents come from the embedded sectionEndIndex"
provides:
  - "scripts/state-rules.ts: planProgressRoll, planProgressAppend, progressArchiveSkeleton, PROGRESS_ARCHIVE_TITLE, doneDuplicateRefusal, lineEndings, lineEndingRefusal, SectionEndFn and ProgressBlock; RollPlan gains surface and insertOrder"
  - "scripts/runnable-ref/state-roll.ts and its committed .js: Done then progress, each atomic on its own; every planner refusal before the first write; --dry-run PLAN lines"
  - "the LANG-07 census (scripts/check-foundation-guards.test.ts) admits a generated copy of the section-extent owner only inside a fresh region of an EMBED_SPECS target, with a control case"
affects: [37-12, 37-13, 37-19]

actuals:
  tokens: 49319
  tasks: 1
  commits: 2
plan_head_before: 96c7927b45b54b3c9b14415b162e1d78d5af0350
plan_head_after: c2f612fe441797765d467f76e113a64ddd41ee48

tech-stack:
  added: []
  patterns:
    - "An import-free rules module that needs a second module's rule takes that rule as a function parameter; the host runnable passes the generated copy, the unit tests pass the authority itself"
    - "A census admits a generated copy by four conjoined conditions (EMBED_SPECS target, one region, region equal to a fresh deriveRegion, no site outside the region), each falsified by its own control"
    - "A planner proves its output reads back: the appended archive text is put through the same view and extent function, and every moved heading must still open an entry there"

key-files:
  created: []
  modified:
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/state-rules.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/state-roll.test.ts
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "D-16 changed the plan's extent wording: a progress entry ends where sectionEndIndex(view, heading + 1, 2) says (fence-aware, and it also closes on a level-1 heading), not at a hand-written next-`##` scan. The view is the normalized, comment-blanked text that progressEntries classifies"
  - "planProgressRoll lives in the import-free scripts/state-rules.ts, so it takes the extent function as a parameter (SectionEndFn). The runnable passes its generated copy of sectionEndIndex, and the unit tests pass the authority from scripts/frontmatter.ts. Nothing reimplements it"
  - "Line endings: refused, not folded. lineEndingRefusal refuses a source or archive that already mixes LF and CRLF, and a roll that would leave either file mixed. That covers CRLF rows into an LF archive, LF rows into a CRLF archive, and a moved last line that has no line ending. Applied to the Done roll too, which changes 37-10's verbatim-into-mismatched-archive behavior from a silent mixed archive to exit 2"
  - "An entry is refused when it carries any part of an HTML comment, when its heading sits inside a fence, or when progressEntries sees a `##` heading inside its extent that sectionEndIndex does not close on (a fenced one or a bare `##`). Each is named; none is guessed at"
  - "The progress archive must start with `# Progress archive`. When it is created, it gets that title, a blank line and one comment naming the source"
  - "Every planner refusal for both surfaces is found before the first write. A Done roll that was rolled back stops the run (exit 1, progress not attempted). A progress failure after a proven Done roll leaves the Done roll written. A rollback reports exit 1 with the Done MOVED lines on stdout. A changed-file refusal reports exit 2 with stdout empty, and stderr says that the Done roll stands"
  - "executeRoll's restore does not write a file that already holds its old bytes. A file whose directory refuses writes therefore no longer turns a clean rollback into restore-failed. This change is also what makes exit 1 reachable from a spawned process"
  - "The message for a file that is over budget and holds only standing sections names memory-bank/50-decisions/ through one typed string, DECISION_RECORDS_DIR. Embedding DECISIONS_REL would break the plan's acceptance grep (the move-only constants must not appear in state-roll.ts). A host test binds the string to DECISIONS_REL and asserts that it is the file's only spelling"

patterns-established:
  - "Rollers refuse every ambiguous shape before the first write and make an interrupted run refuse rather than double"

requirements-completed: [SPLIT-06, SPLIT-01]

coverage:
  - id: D1
    description: "planProgressRoll over the plan's 17,000-byte fixture moves 2026-09-15 then 2026-10-01 (400 and 5,000 bytes), whole. The standing section and 2026-10-10 stay, and 2026-10-10 is the entry nearest the top. Ties go to the entry nearer the top. Within budget, or with standing sections only, nothing rolls. Extents come from the passed function (spy and substitute cases), and a level-1 heading closes an entry. CRLF lines keep their \\r"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#planProgressRoll: dated entries roll oldest first until the file is within budget (D-09, D-16)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Refused: a fenced `##` inside a moved entry, a fenced dated heading, a moved entry with an HTML comment (CONTROL: the same comment on a kept entry rolls), an archive with no title or ending inside a fence or comment, a heading line already in the progress archive, a Done row already in the Done archive, a Done column with a prose line, a Done archive with another `##` heading, mixed line endings"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#planProgressAppend / doneDuplicateRefusal / lineEndingRefusal / planDoneRoll and planArchiveInsert: the plan 37-11 refusals"
        status: pass
    human_judgment: false
  - id: D3
    description: "The proof over a progress roll passes for a created and an existing archive. An archive in file order rather than oldest first fails the proof, and so does an order that places one line twice. A source write that always throws rolls back without needing a second write"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#checkConservation and executeRoll over a progress roll (D-08)"
        status: pass
    human_judgment: false
  - id: D4
    description: "On a host (the committed .js copied alone): the progress roll writes the expected bytes. A file of standing sections only exits 0 unchanged, naming the sections and DECISIONS_REL/. Both surfaces roll in one run, Done first. --dry-run prints PLAN lines with line numbers and byte counts and writes nothing"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — the progress roll on a host / --dry-run prints every planned move"
        status: pass
    human_judgment: false
  - id: D5
    description: "Interrupted-roll re-runs exit 2 and write nothing. The Done case names ABC-021, ABC-022 and ABC-023. The progress case names the entry heading. A progress refusal with a Done roll due writes neither surface"
    requirement: SPLIT-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — every ambiguous shape is refused before the first write"
        status: pass
    human_judgment: false
  - id: D6
    description: "Files planted under .grugops/queue/done/ and memory-bank/50-decisions/ keep their bytes and mtime through a real roll of both surfaces. The runnable's source names none of the four move-only constants"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — the move-only surfaces are never touched (v3.0 D-7)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Exit 1 on a spawned host process. A board directory that refuses writes rolls the Done roll back, and both files keep their old bytes. A memory-bank directory that refuses writes rolls the progress roll back after a proven Done roll, which stays. A probe write skips the case on a host that does not enforce 0555"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-roll.test.ts#state-roll.js — exit 1 on a host: a write that fails part way is rolled back"
        status: pass
    human_judgment: false
  - id: D8
    description: "LANG-07 still has one owner. The state roll's generated copy is admitted only inside a fresh region of an EMBED_SPECS target. Each of these makes the module an owner again: a hand-edited copy, a copy outside the region, the same region in a non-target, unbalanced markers, doubled markers. Removing the freshness check or the outside-region check from the rule turns the control red (mutation-run by hand)"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#D-16 (plan 37-11): a generated copy is admitted only inside a FRESH region of an EMBED_SPECS target, never by name"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 11: state-roll rolls dated progress entries oldest first and refuses every ambiguous shape before a write Summary

**`node state-roll.js <repo-root>` now rolls two surfaces, Done first, then progress, and each roll is atomic on its own. Progress rolls only when `memory-bank/60-progress.md` is over BUDGETS.progressBytes. Its dated `## YYYY-MM-DD` entries then move whole, oldest first, to the end of `memory-bank/plans/archive/progress.md`. An entry ends where the embedded copy of `sectionEndIndex` says (D-16). Every ambiguous shape is refused before the first write, including the leftovers of an interrupted roll, so a re-run cannot double a row or an entry. `--dry-run` prints one PLAN line per move, with line numbers and byte counts.**

## Performance

- **Duration:** about 18 min of execution (2026-10-22T14:41:31Z to 14:59:19Z), after the reading
- **Tasks:** 1 (TDD: a RED test commit, then the GREEN feat commit)
- **Files modified:** 10

## Accomplishments

- **The rules (`scripts/state-rules.ts`, still with no import):**
  - `planProgressRoll(texts, budgetBytes, sectionEnd)`:
    - classifies the comment-blanked view with `progressEntries`;
    - orders the dated entries by date, with ties going to the entry nearer the top;
    - takes each extent from `sectionEnd`;
    - moves whole entries until the file is within budget or no dated entry remains.
    It returns the blocks in move order, the moved lines ascending, their raw texts and the archive order.
  - `planProgressAppend` creates the archive or appends to it, and refuses a heading line the archive already holds. It then proves that the entries read back from the new archive: none sits in a comment, and every moved heading still opens an entry.
  - `doneDuplicateRefusal` names every moved Done row that the Done archive already holds.
  - `lineEndingRefusal` refuses mixed endings, before or after a roll, for either surface.
  - `planDoneRoll` refuses a Done column that holds a line other than ticket rows. `planArchiveInsert` refuses a Done archive with any other `##` heading.
  - `RollPlan` gains `surface` and `insertOrder`. `checkConservation` derives the created archive's skeleton for each surface itself, and requires the order to place every moved line exactly once.
- **The runnable (`scripts/runnable-ref/state-roll.ts` and its committed `.js`):**
  - It reads the board, both archives and the progress file. Each one is lstat'ed, realpath-checked and read through the embedded non-blocking reader.
  - It plans both surfaces before writing anything, then runs `executeRoll` for Done and then for progress.
  - The D-12 mapping covers the mixed case: Done written and proven, then progress rolled back or refused.
  - Every printed value goes through `stripControlChars`.
- **The generator:** the state-roll row now roots the progress planners, the two refusals, the line-ending rule, `utf8Bytes`, `PROGRESS_REL`, `PROGRESS_ARCHIVE_REL` and `scripts/frontmatter.ts`'s `sectionEndIndex`. EMBED_SPEC_COUNT stays 3. The move-only constants are not roots.
- **The census:** the LANG-07 `sectionExtentOwnersAmong` applies D-16's admission rule. A control case proves that a hand-edited copy and an out-of-region copy still fail. So do a non-target holding the same region and bad markers.

## Task Commits

1. **Task 1 RED: failing cases for the progress roll, the refusals and the dry-run PLAN lines:** `d31977fc` (test)
2. **Task 1 GREEN: the progress roll, the refusals, the dry-run PLAN lines and the census rule:** `c2f612fe` (feat)

**Plan metadata:** recorded in the docs(37-11) completion commit.

### RED evidence

- **Command:** `npx vitest run scripts/runnable-ref/state-roll.test.ts --reporter=tap-flat`. It ran with the new tests over HEAD's `state-roll.js` (96c7927b), swapped into the working tree for the run and restored afterwards (confirmed with `cmp`).
- **Result:** exit 1, 32 tests, 13 failed (the tap-flat count; the earlier default-reporter run read 15 rows as `not ok`). The failures are the new behavior cases: progress roll, standing-only message, both surfaces, dry-run PLAN lines, prose refusal, both interrupted-roll refusals, refusal before the first write, mixed endings, move-only surfaces and both exit-1 cases. Each failed on its assertion. The target `EDGE SPLIT-01` case failed because HEAD moved rows 21-23 again (exit 0) where the test expected exit 2. HEAD already passed the second-column archive case, because 37-10 refused that shape.
- **Classifier:** `gsd_run check tdd-red-evidence` returned INVALID_RED (`invalid_record`, "Malformed TAP"). Vitest's tap-flat reporter writes multi-line assertion messages unescaped into the YAML block, so the record cannot be parsed. This is not a semantic fault.
- **Semantic assessment:** each target ran and failed on its planned assertion. There was no load, fixture or syntax fault.
- The record is kept in the session scratchpad, not in the repository.

## Files Created/Modified

- `scripts/state-rules.ts`, `.js`: the progress-roll section, the Done refusals, the order-aware proof and the restore that skips unchanged files.
- `scripts/state-rules.test.ts`: 30 new unit cases. They pass `sectionEndIndex` from `scripts/frontmatter.ts`.
- `scripts/generate-runnable-embeds.ts`, `.js`: the row's new roots and a dated doc paragraph.
- `scripts/runnable-ref/state-roll.ts`, `.js`: a new header and hand-written part. The region was regenerated, never edited.
- `scripts/runnable-ref/state-roll.test.ts`: 17 new host and source cases (32 in total).
- `scripts/check-foundation-guards.test.ts`: the D-16 admission rule, its control case and the witness filter in the conjunction case.
- `deferred-items.md`: the 37-05 LANG-07 entry is marked resolved by D-16 and this plan.

## Decisions Made

See `key-decisions` above. **D-16 changed the plan's extent wording** ("the heading line through the line before the next `##` heading"). This is a recorded human decision (37-CONTEXT.md, commit 0a7c33dc), not a drift. An entry ends where `sectionEndIndex(view, heading + 1, 2)` says, so a fenced `##` never ends one and a level-1 heading does.

## Deviations from Plan

### Auto-fixed Issues

**1. [Decision override, D-16] Entry extents come from the embedded sectionEndIndex, passed as a parameter**
- **Found during:** Task 1.
- **Issue:** the plan's action text described a next-`##` scan. The LANG-07 census forbids a second section-extent owner, and `state-rules.ts` imports nothing.
- **Fix:** `planProgressRoll(texts, budgetBytes, sectionEnd)` and `planProgressAppend(..., sectionEnd, view)` take the function. The runnable passes its generated copy. The census admits that copy by the 37-03 rule, with a control case.
- **Commit:** c2f612fe.

**2. [Plan detail] Planner signatures**
- The plan named `planProgressRoll(rawText, budgetBytes)`. The planner takes the three forms (raw, normalized, comment-blanked), for the same reason `planDoneRoll` does: the comment check needs the blanked text, which this module cannot compute. It also takes the extent function (deviation 1).

**3. [Rule 2 - Missing critical] Refusals the action text did not list**
- A fenced dated heading, an inner `##` heading the extent function does not close on, a moved entry with a comment, and a byte-order mark on a moved line.
- An archive with no title, or one the entries would not read back from.
- A Done archive with a non-column `##` heading.
- Mixed line endings for both surfaces (the 37-10 open item, decided as refuse).
- **Commit:** c2f612fe.

**4. [Rule 1 - Bug] A rollback could report restore-failed for a file it never changed**
- **Found during:** Task 1, while writing the exit-1 host case.
- **Issue:** when the source write threw because its directory refuses writes, the restore tried to write the unchanged source again and failed. A clean rollback was then reported as restore-failed (exit 2).
- **Fix:** the restore reads each file first and writes only one that does not hold its old bytes. The 37-10 faulty-io cases still pass, and a new unit case covers it.
- **Commit:** c2f612fe.

**5. [Plan detail] One typed path in the runnable**
- The behavior line asks the standing-only message to name `memory-bank/50-decisions/`. The acceptance grep forbids `DECISIONS_REL` in `state-roll.ts`.
- The message uses `DECISION_RECORDS_DIR`, which a host test binds to `DECISIONS_REL`. The test also asserts that the path appears exactly once in the source.

**6. [Plan detail] Census edits beyond the rule**
- The LANG-07 conjunction case derives its witnesses from recognised modules that are not owners. It now also excludes modules the region rule admitted, because they are excluded by that rule and not by the conjunction.
- No pin moved. NON_TEST_MODULE_COUNT, SECTION_EXTENT_OWNERS, EMBED_SPEC_COUNT and the fence-machine set all stay. The fence-machine census in `scripts/frontmatter.test.ts` stayed green with the embedded `blockContextFlags`, so it needed no change.

---

**Total deviations:** 6: 1 decision override, 1 missing-critical auto-fix, 1 bug auto-fix and 3 plan details.
**Impact:** every must-have truth and both acceptance criteria hold.

## Known limitations

- Two concurrent rolls are still not locked against each other. Once the first run has written an archive, the second refuses through the duplicate checks or the changed-file check.
- An entry that carries a fully closed HTML comment is refused rather than moved. This is conservative; a human moves such an entry by hand.
- Exit 1 through a failed proof, as opposed to a failed write, is still driven only through the `executeRoll` unit cases. The host cases drive exit 1 through a failed write.

## Verification

- `npm run build` and `npm run typecheck` exit 0. `node scripts/runnable-embeds-freshness.js` reports 3 targets fresh. `npm run freshness` reports 86 committed `.js` fresh.
- Acceptance: the grep for the move-only constants prints 0, and `export function planProgressRoll` appears once in `state-roll.ts`.
- `node scripts/runnable-ref/state-roll.js . --dry-run` exits 0 ("nothing would move"), and `git status --porcelain memory-bank` is empty afterwards. With no argument, the runnable exits 2.
- These guards exit 0 or report ALL CHECKS PASSED: `check-state-paths`, `check-foundation-guards`, `check-nul-bytes` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`.
- **The end-of-plan run:** 24 test files in two sequential vitest processes, with 1 worker each.
  - The plan's verify list.
  - The census set: check-foundation-guards, check-state-paths, nonblocking-reader-parity, context-io-writer-set, board-readonly, validate and frontmatter.
  - Every test that names `state-rules`, `generate-runnable-embeds`, `state-roll` or `check-foundation-guards.test`/`.js`.
  - The result is 2,162 passed and 7 failed. All 7 are 37-BASELINE entries: the two in `context-io-writer-set` (31-14) and the five in `uat-gate-exit-contract`. No failure is new.
- **Not run:** the full non-e2e suite (plans 37-13 and 37-19 run it). No installer was run, bare `npm test` was never run, and no branch was created or switched. state-roll ran in write mode only against mkdtemp directories. No vitest process was left running.

## Issues Encountered

- The TAP classifier could not parse vitest's tap-flat output (see RED evidence). A filtered single-test run did not help, because the assertion messages themselves carry newlines.

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-12 can read `memory-bank/plans/archive/board-done.md` with `parseBoard` and report a row on both the board and the archive as ticket-duplicated. That is the shape this plan's refusal leaves for a human to resolve.
- Plan 37-13 materializes `state-roll.js` into `tools/grugops/`.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

Every modified key file exists on disk. Commits d31977fc and c2f612fe are ancestors of HEAD, and the ledger counts 2 commits from 96c7927b to c2f612fe.
