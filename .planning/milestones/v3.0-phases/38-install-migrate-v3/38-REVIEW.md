---
phase: 38-install-migrate-v3
reviewed: 2026-10-28T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - install/install.ts
  - install/state-migrate.ts
  - install/state-layout.ts
  - install/installer-paths.test-support.ts
  - scripts/check-banned-claims.ts
  - scripts/check-state-paths.ts
  - scripts/fault-inject.test-support.ts
  - scripts/generate-runnable-embeds.ts
  - install/migrate-v3.test.ts
  - install/migrate-v3-context.test.ts
  - install/migrate-v3-dryrun.test.ts
  - install/migrate-v3-hazards.test.ts
  - install/migrate-v3-rollback.test.ts
  - install/migrate-v3-states.test.ts
  - install/state-migrate.test.ts
  - install/state-layout.test.ts
  - docs/pre-v3-state-layout.md
  - install/README.md
  - CHANGELOG.md
findings:
  critical: 1
  warning: 8
  info: 5
  total: 14
status: issues_found
---

# Phase 38: Code Review Report

**Reviewed:** 2026-10-28
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The review covered the phase-38 v3 state migrate: the pure planner and stage-A proof (the hand-written part of
`install/state-migrate.ts`, after the generated region), the installer's read, pre-check, stage, commit, undo, render
and context-archive code in `install/install.ts`, the new state-layout constants, the support-script changes, and the
user docs. In `install/install.ts`, only the phase-38 hunks were read.

The proof machinery is careful, but it conserves lines as a multiset. It cannot see that moving a line changes what
the remaining lines mean. One finding of that kind was reproduced (CR-01): it turns commented-out board text into live
ticket rows, and the proof passes. The other main concerns:

- The pre-check misses destination collisions that the planner can already see, so they fail late, mid-commit.
- The undo after a passing trace render leaves a rendered file behind.
- The context archive moves the folder of a ticket that was reopened.
- After an incomplete undo, the same run keeps installing into the half-moved tree.
- The docs promise "the repository is left as it was" on failure, and the code does not deliver that.

Known items the caller listed (the board over budget because of the code-span `<!-- RUN -->`, trace order depending on
the context root, no automated test for a failed undo step or for the device comparison) are not reported again.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Moving an `_Updated:` line that opens an HTML comment uncomments board lines and turns them into live ticket rows

**File:** `install/state-migrate.ts:2251-2255, 2298-2306`
**Issue:** The update lines are chosen from the comment-blanked text (`blankedLines[i].startsWith("_Updated:")`).
Every such line is then removed from the board whole, raw text included. Take an update line that carries a comment
opener with no close on the same line, such as `_Updated: 2026-01-01 by me <!-- example rows, not real:`. Its blanked
form still starts with `_Updated:`, so it is removed, and its `<!--` goes with it. Every line up to the matching
`-->` then becomes visible on the migrated board. Commented-out example rows become real ticket rows, and a stray
`-->` stays behind.

The row loop guards against exactly this hazard: line 2264 skips rows that touch a comment, and the comment at
2181-2182 explains why ("moving a comment's opener off the board would uncomment the lines after it"). The update
lines get no such guard. The stage-A proof passes, because the multiset of lines is conserved.

Reproduced against the committed `install/state-migrate.js`. The board below gives `before rows: [ABC-1]`,
`after rows: [ABC-1, ABC-2]`, `proof { ok: true }`:
```
## Ready (WIP 0/5)
- [ABC-1] One  (size: S) trailer one
_Updated: 2026-01-01 by me <!-- example rows below, not real:
- [ABC-2] Ghost  (size: S)
-->
```
**Fix:** Treat update lines the way rows are treated. Move only an update line whose blanked form equals its
normalized form. Leave any other update line on the board and add a note:
```ts
blankedLines.forEach((l, i) => {
  if (!l.startsWith(UPDATED_PREFIX)) return;
  if (l !== normalizedLines[i]) {
    notes.push(`line ${i + 1} of ${LEGACY_BOARD_REL} is an \`_Updated:\` line that touches an HTML comment, so it stays on the board`);
    return;
  }
  updateAt.add(i);
});
```
Then add a regression test with the board above, asserting that `parseBoard` reads the same rows before and after.
To be robust, the proof should also show that the planned board's comment-blanked text, with the moved lines taken
out, equals the original's.

## Warnings

### WR-01: The pre-check misses destination collisions the planner can already see, so they fail mid-commit

**File:** `install/state-migrate.ts:2342-2344, 2429-2436, 2576`; `install/install.ts:7091-7099, 7697-7702`
**Issue:** `planStateMigrate` checks collisions only for NFR files (`planNfrSplit`, line 2089) and for the two roll
archives (lines 1856, 1894). Nothing checks whether the pre-v3 tree already holds a file at:

- an archive-move destination: `PRE_V3_BOARD_REL`, `PRE_V3_TICKETS_REL/{name}`, `PRE_V3_NFR_CATALOG_REL` or
  `PRE_V3_TRACEABILITY_REL` (each a `plans/archive/pre-v3/...` path);
- the marker path `LAYOUT_MARKER_REL` (`plans/.layout`).

The walk reads dot-files too, so a legacy `plans/.layout` moves to `memory-bank/plans/.layout`, and the marker's `wx`
create then fails with EEXIST every time.

Each of these cases gets through the pre-check and the in-memory proof. It is found only at commit time: the archive
renames at (f), the marker after the trace render at (h). The journal is then undone. That breaks D-11's contract that
"every refusal of either arm is found before the first change", and the doc's line 67: "If anything is refused,
nothing is written".

Reproduced: a legacy `plans/archive/pre-v3/board.md` gives `refusals: []`. A legacy `plans/archive/pre-v3/board-updates.md`
is caught, but only as "the planned split of plans/board.md failed its proof: ... is not identical to its original",
which does not tell the user that a path is taken.
**Fix:** In `planStateMigrate`, refuse every planned destination that `movedPaths` already holds, naming the file:
each `archiveMoves[].to`, each `writes[].rel` that is not itself the source of an archive move, and
`LAYOUT_MARKER_REL`. Use the wording `planNfrSplit` uses ("... already exists in the pre-v3 tree ...; move or rename
that file first").

### WR-02: An undo after the trace render leaves rendered files behind, so the repository is not as it was

**File:** `install/install.ts:7282-7304, 7634-7652, 7508-7518`
**Issue:**
- **Cause:** `discardRenderedTrace` removes only the *new names* in `TRACE_DIR_REL`. The renderer also writes the
  index `TRACEABILITY_REL`, and in write mode it rewrites changed trace files and deletes extra ones.
- **State migrate:** When the pre-v3 tree has no `traceability.md`, the plan stages no `TRACEABILITY_REL` write
  (line 2433). The renderer then creates `memory-bank/plans/traceability.md` itself. If a later step fails (the
  marker, as in WR-01, or a render exit 2 after its write phase started), `commitFailed` leaves that file in place.
  The root-rename undo then carries it into `plans/traceability.md`, a file that did not exist before the run. The
  next `--migrate` archives it as though it were the user's hand-written matrix.
- **Context archive:** In `runContextArchive`, a render that fails part way through its write phase leaves the
  changed and removed trace files as they are, while the folders are moved back. The trace is then stale.

The docs say the repository "is as it was before the run" (docs/pre-v3-state-layout.md:58-59, 159-160;
install/README.md "If any step fails, the move is undone and the repository is left as it was").
**Fix:** Before the render, record whether `TRACEABILITY_REL` exists. If the render created it, remove it in
`discardRenderedTrace` (only when it carries the generated header). For the context-archive arm, take a byte snapshot
of the files the render may change (the index and the existing trace files) before the render and restore it on
failure. Or narrow the docs to say exactly which generated files can be left behind.

### WR-03: The context archive moves the live folder of a reopened ticket

**File:** `install/state-migrate.ts:3183-3207, 3264`
**Issue:** `contextTicketIds` adds a ticket to `done` if it appears in a Done column *or* anywhere in the Done
archive. It never removes a ticket that also has a row in a non-Done column. A ticket that was rolled to
`board-done.md` and later reopened (back in `In Progress`) therefore counts as Done, and its context folder is moved
to `.grugops/archive/context/` while work on it is live.

Reproduced: a board with `ABC-5` under `In Progress`, plus an archive with `ABC-5`, gives
`moves: [{name: "abc-5-work", ids: ["ABC-5"]}]`. The queue guard catches this only if the task's pending entry has
exactly the folder's name, or if a claim exists.
**Fix:** Build a set of tickets that have a row in any non-Done board column, and treat a ticket in that set as not
Done:
```ts
const live = new Set<string>();
for (const column of parseBoard(board).columns)
  for (const row of column.rows) if (isTicketId(row.id) && column.name !== DONE_COLUMN) live.add(row.id);
for (const id of live) done.delete(id);
```
Document the rule in docs/pre-v3-state-layout.md.

### WR-04: After an incomplete undo, the same run keeps seeding and installing into the half-moved tree

**File:** `install/install.ts:9335-9342, 7634-7652`
**Issue:** When `commitFailed` cannot undo every rename, it leaves the staging directory and `commit-plan.txt` "for
you", and `runStateMigrate` returns false. The install run then goes on to `seedState()`, `materializeRunnable()`,
the permission rules and `writeMarker()`. If the root rename was not undone, `stateLayout()` now answers `current` or
`both`, so `seedState` adds missing seed files into `memory-bank/plans/`. One example is a fresh `nfr-catalog.md`
where the original was archived. Those new files then block the manual reverse renames the human is told to perform.

A plain install refuses in exactly this state (install.ts:3096-3117, "a plain install over that state would seed and
refresh beside a half-moved tree"). The run that caused the state does not apply the same rule to itself.
**Fix:** If `commitFailed` reports any failed undo step (or the staging directory was left), stop the run: print the
INCOMPLETE banner and exit 3 before `seedState()`, as `refuseOverMarker` does. Or have `seedState` skip
`MEMORY_BANK_REL` while `MIGRATE_STAGING_REL` exists.

### WR-05: User file names reach the terminal unsanitized on the commit, undo and staging failure paths

**File:** `install/install.ts:7096-7103, 7118-7135, 7589, 7597, 7672, 7679, 7684, 7626`
**Issue:**
- **Unsanitized lines:** The messages built by `migrateRename`, `undoStateMigrate`, `stageFailed` ("`${p} could not
  be written`"), the staged read-back check and the post-commit `homeProblems` all put absolute paths into `verify()`
  lines. Those paths contain file names from the pre-v3 tree (ticket file names, any file under `plans/`). `verify`
  and `report` print as-is (install.ts:895-907), and none of these sites calls `oneLine`.
- **Effect:** A file named with an ESC sequence can therefore drive the terminal on exactly the failure paths a human
  reads most closely. That contradicts the module header's promise that "every printed user value passes through the
  embedded stripControlChars".
- **Commit plan:** `commit-plan.txt` writes `${from}\t${to}\n` raw. A POSIX file name that contains a TAB or a
  newline makes the recovery list, which the docs tell the human to follow by hand, ambiguous.

**Fix:** Wrap every path in these messages with `oneLine(...)`. Either refuse legacy file names that contain C0/C1
control characters in `readMigrateInputs` (which also removes the TAB/LF ambiguity), or write the commit plan in a
form that escapes them, such as JSON lines.

### WR-06: After a successful run, the leftover-staging note says "nothing reads it", but the directory blocks every later run

**File:** `install/install.ts:7704-7710`
**Issue:**
- **The note:** After the marker is written, a commit plan that cannot be unlinked gets the note "it only lists this
  run's renames, and nothing reads it". Anything left in the staging directory gets only "the staging directory ...
  was left".
- **The effect:** Any entry at `MIGRATE_STAGING_REL` makes every later plain install refuse with exit 1
  (install.ts:3110-3114). It also refuses every later `--migrate`, on every layout (`stagingRefusal`, install.ts:7761).
  The plain-install refusal then tells the user that an earlier migrate "stopped before it finished", which is false
  for this successful run.

**Fix:** Change the note to say that the directory must be removed by hand before the next install, and that the
migrate itself completed. Or write a completion sentinel that the later refusals recognize, and word them
accordingly.

### WR-07: The printed re-run command drops `--archive-done-context`

**File:** `install/install.ts:658-660, 7834`
**Issue:** When `--migrate --archive-done-context` is refused in the pre-check (for example, by a claimed task),
`printMigrateIncomplete(true, SELECTION)` prints `migrateCommand(...)`. That command is always
`["--migrate"]` plus agent flags. Running it as printed, which is what the banner says to do, migrates without
archiving any context folder. The flag the user chose is silently lost.
**Fix:** Have `migrateCommand` append `--archive-done-context` when `ARCHIVE_DONE_CONTEXT` is set. It may only read
argv-level flags, not selection constants, so either pass it as a parameter or read the module-level `let`, which is
assigned before any caller runs.

### WR-08: The docs claim a failed migrate leaves the repository as it was, and that no layout marker is written

**File:** `docs/pre-v3-state-layout.md:13-14, 57-59`; `install/README.md` ("If any step fails, the move is undone and the repository is left as it was")
**Issue:**
- **Failure claim:** `runStateMigrate` runs at install step 6b (install.ts:9335), *after* the kit copy, the adapters
  and, on a v1.0 repository, `migratePreSteps()` (the `agent-factory/` backup and the config carry). A failed state arm
  "never exits" (install.ts:6658-6660), so the run then also seeds state, materializes runnables, writes permission
  rules and writes `.grugops/install.json`. Only the state move is undone. The sentence "If any step fails, the
  repository is left as it was before the run" (doc line 58) is therefore false for the run as a whole, and the
  README repeats it.
- **Marker claim:** Line 13-14 still says "Nothing else is read, and no layout marker is written". That sentence was
  written before phase 38. The same page now documents `memory-bank/plans/.layout` being written last (lines 175-181).

**Fix:** Change the doc and README sentences to say that the *state move* is undone and the repository's planning
state is left as it was, and that the kit refresh steps of the same run are not undone. Change line 13-14 to say that
the layout is *decided* from the board's location alone, and that `--migrate` writes the marker.

## Info

### IN-01: `parseNfrIndex` is embedded but never used

**File:** `install/state-migrate.ts:815-830`; `scripts/generate-runnable-embeds.ts` (state-migrate row, `roots`)
**Issue:** `parseNfrIndex`, together with `NFR_INDEX_LINE` and `NFR_LINE_START`, is generated into the module, but no
code in `install/state-migrate.ts` or `install/install.ts` calls it. It adds generated surface for nothing, and the
row's comment says the roots are "the whole set phase 38 needs".
**Fix:** Drop `parseNfrIndex` from the EMBED_SPECS row and regenerate, or add the use it was meant for (for example, a
proof check that the new catalog's index parses with no malformed lines).

### IN-02: A literal invisible U+FEFF in the source

**File:** `install/state-migrate.ts:2270`
**Issue:** `raw.startsWith("<U+FEFF>") ? "<U+FEFF>" : ""` embeds the byte-order mark as a literal character. It is invisible in
review, and an editor or formatter can strip it, which would silently make the check always match the empty string.
**Fix:** Spell it `"\uFEFF"`.

### IN-03: The docs say the traceability matrix is "split", while the code archives it and renders a fresh trace

**File:** `docs/pre-v3-state-layout.md:55-56`; `CHANGELOG.md` (Changed, first bullet); `install/README.md` ("The v3 state move")
**Issue:** All three say `--migrate` splits "the board, the traceability matrix and the NFR catalog". The code (and
the same doc at line 126) archives `traceability.md` unsplit and writes the kit seed, which the renderer then
overwrites. The README also says it "keeps every original file unchanged under `memory-bank/plans/archive/pre-v3/`".
Most originals move to their own path under `memory-bank/plans/`, not to the archive.
**Fix:** Say "splits the board and the NFR catalog, archives the traceability matrix and renders the trace afresh",
and "keeps every original file unchanged, the split ones under `archive/pre-v3/`".

### IN-04: Removing a trailing `_Updated:` line drops the board's final newline

**File:** `install/state-migrate.ts:2299-2306`
**Issue:** On a board with no final newline whose last line is an `_Updated:` line, the planned board ends without a
newline. The line before it had one in the original. Reproduced: `...(size: S)\n_Updated: ...` becomes
`...(size: S)`. The proof ignores terminators, so this is cosmetic only.
**Fix:** If the removed line was the last element and the line before it was terminated, keep one trailing `""`
element so that `join("\n")` gives the terminator back.

### IN-05: Duplicate refusal for a linked `.grugops/context/` with `--archive-done-context`

**File:** `install/install.ts:6808, 7413`
**Issue:** On a pre-v3 repository, `readMigrateInputs` refuses a link at `CONTEXT_REL` (`rootRefused`). When
`--archive-done-context` is given and the plan has no refusals, `readContextArchive` refuses the same link again
through `contextDirNames`, so the user sees two verify lines for one cause.
**Fix:** Skip `readContextArchive` when `read.refusals` is non-empty, or deduplicate by path.

---

_Reviewed: 2026-10-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
