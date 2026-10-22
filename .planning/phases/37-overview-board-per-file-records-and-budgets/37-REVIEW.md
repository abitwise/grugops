---
phase: 37-overview-board-per-file-records-and-budgets
reviewed: 2026-10-22T20:10:40Z
depth: standard
files_reviewed: 70
files_reviewed_list:
  - .github/workflows/ci.yml
  - agent-factory/contracts/board.md
  - agent-factory/seed/memory-bank/60-progress.md
  - agent-factory/seed/memory-bank/plans/.layout
  - agent-factory/seed/memory-bank/plans/board.md
  - agent-factory/seed/memory-bank/plans/nfr-catalog.md
  - agent-factory/seed/memory-bank/plans/traceability.md
  - install/install.test.ts
  - install/install.ts
  - install/installer-cross-version.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/ledger-provenance.test.ts
  - install/mode-census.test.ts
  - install/README.md
  - install/record-truth.test.ts
  - install/state-layout.test.ts
  - install/state-layout.ts
  - install/uninstall-removal.test.ts
  - install/uninstall.ts
  - memory-bank/60-progress.md
  - memory-bank/plans/.layout
  - memory-bank/plans/board.md
  - memory-bank/plans/nfr-catalog.md
  - memory-bank/plans/traceability.md
  - package.json
  - scripts/board-corpus.test.ts
  - scripts/board-dashboard.test.ts
  - scripts/board-dashboard.ts
  - scripts/board-model.test.ts
  - scripts/board-model.ts
  - scripts/board-read.test.ts
  - scripts/board-read.ts
  - scripts/board-readonly.test.ts
  - scripts/board-tracer.test.ts
  - scripts/board-watch.test.ts
  - scripts/check-claim-anchors.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-state-paths.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.test.ts
  - scripts/fixtures/board-snapshot/expected-snapshot.json
  - scripts/fixtures/board-snapshot/memory-bank/plans/archive/board-done.md
  - scripts/fixtures/board-snapshot/memory-bank/plans/tickets/ABC-201.md
  - scripts/fixtures/board-snapshot/README.md
  - scripts/frontmatter.test.ts
  - scripts/generate-runnable-embeds.test.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/nonblocking-reader-parity.test.ts
  - scripts/runnable-embeds-freshness.ts
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.test.ts
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.test.ts
  - scripts/runnable-ref/trace-render.ts
  - scripts/state-rules.test.ts
  - scripts/state-rules.ts
  - scripts/trace-freshness.test.ts
  - scripts/trace-freshness.ts
  - scripts/trace-instructions.test.ts
  - scripts/trace-model.test.ts
  - scripts/trace-model.ts
  - scripts/trace-render.test.ts
  - scripts/trace-render.ts
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
findings:
  critical: 2
  warning: 6
  info: 5
  total: 13
status: issues_found
---

# Phase 37: Code Review Report

**Reviewed:** 2026-10-22T20:10:40Z
**Depth:** standard
**Files Reviewed:** 70
**Status:** issues_found

## Summary

The review covered the source files of the phase (the three host runnables `state-check`, `trace-render` and
`state-roll` with their generated regions, `state-rules.ts`, `trace-model.ts`, the embed generator and its
freshness gate, the validator's budget check, the board reader's seventh source, the installer's marker
seeding and RUNNABLES rows, and the CI wiring). Tests, seeds and fixtures were read second, for intent and for
test reliability. Role and workflow prose was out of scope.

`state-roll` is the strongest part of the phase. Every refusal is planned before the first write, both files
are re-read before the write, the line-conservation proof derives its own expectation, and the rollback
leaves a file alone when it already holds its old bytes. No path was found by which it deletes or
overwrites user content.

The trace path is weaker. Two defects were reproduced against the committed `.js` in a scratch directory
(no tracked file touched, no installer run):

- CR-01: a ticket whose task cannot be read (EACCES on its `notes/` directory) has its rendered trace file
  REMOVED by the write mode with exit 0, and both `trace-render --check` and `state-check` then report the
  trace as fresh. An I/O failure is turned into "this ticket has no trace" on the audit trail.
- CR-02: an unreadable context root makes `trace-render` crash with an uncaught exception and exit 1 (a
  "finding"), not exit 2 (could not run). `trace-freshness` then calls it STALE and tells the user to
  re-render and commit.

The warnings are one-authority splits (the ticket-ID shape, the "is this a dated entry" question), a board
reader that was not moved to the new index shape, a false realpath-boundary claim for note files, runnable
version skew on hosts, and a progress-roll duplicate refusal whose remedy can tell a human to delete a
distinct entry.

## Critical Issues

### CR-01: An unreadable task silently deletes its ticket's trace file, and `--check` / `state-check` then report the trace fresh

**File:** `scripts/runnable-ref/trace-render.ts:841`, `:953`, `:962-970`; `scripts/runnable-ref/state-check.ts:2021-2053`; `scripts/trace-model.ts:230-251`
**Issue:** `collectTraceNotes` catches a task whose read throws (an unsafe task name, a notes directory that
cannot be listed, EACCES, EIO) and records it in `failedTasks`. Neither caller treats a failed task as a
finding or as could-not-run. The task's notes therefore contribute nothing, its ticket's row drops out of
`buildTraceRows`, `compareTraceTree` classifies the existing generated trace file as `extra`, and the write
mode removes it and rewrites the index without that ticket, then exits 0. On the next run `--check` exits 0
("The trace is fresh") and `state-check` raises no `trace-stale` finding, so on a migrated repository the gate
passes. The same holds for the note-level I/O skip arms (`unopenable`, `not-a-regular-file`, `above-ceiling`,
`vanished`): those are read failures, not trust decisions like `unsealed`, but they are handled as absence.
The only signal is an `UNREADABLE TASK` line and a count. Reproduced on the committed `trace-render.js`:
render with one sealed note (ABC-1.md written), `chmod 000` the task's `notes/`, render again:
`REMOVED memory-bank/plans/traceability/ABC-1.md ... unreadable tasks 1`, exit 0; then `--check` exit 0
"The trace is fresh". WF12 (release) reads these rendered files, so the release trail loses a ticket because a
directory was briefly unreadable. That conflicts with the "never fake a passing gate" constraint and the D-12
rule that a could-not-run is never read as a pass. The existing tests
(`trace-render.test.ts:206-224`, `:392-411`) assert exit 0 only for a refused task NAME and never check what
happens to a previously rendered file.
**Fix:** treat an unreadable task (and the I/O skip arms) as could-not-run in the write mode, and as a
finding in `--check` and `state-check`. At minimum, refuse to remove or rewrite anything when the read was
incomplete:
```ts
// trace-render.ts, before the write section
if (collection.failedTasks.length > 0 || collection.skipped.some((s) => s.arm !== "unsealed" && s.arm !== "unparseable")) {
  if (CHECK) finish(1, [], `The trace could not be compared completely: ${counts}.`);
  couldNotRun(`${collection.failedTasks.length} task(s) could not be read, so the trace was not rendered and nothing was removed.`);
}
// state-check.ts traceReport: push one integrityFinding(..., "trace-not-compared", ...) per failed task
```
Add a test that renders, makes a task unreadable, re-renders, and asserts the old trace file still exists and
the exit code is not 0.

### CR-02: An unreadable context root crashes `trace-render` with exit 1 instead of exit 2

**File:** `scripts/runnable-ref/trace-render.ts:810-815` (`listTasks`), reached from `scripts/trace-model.ts:236`
**Issue:** `listTasks` calls `nodeFs.readdirSync(real, ...)` with no try/catch, and `collectTraceNotes` calls
`io.listTasks(root)` outside its per-task try. `realDirectoryOrNull` only lstat's and realpath's the root, so a
root that exists but cannot be listed (mode 000, EACCES, EIO) throws out of the top level. Node prints a stack
trace and exits 1. Exit 1 is the "finding" code. Reproduced: `.grugops/context` at mode 000 makes
`trace-render.js <root>` and `trace-render.js <root> --check` both exit 1 with a `node:fs` stack trace, while
`state-check.js` on the same tree correctly exits 2. `trace-freshness.ts:56-62` maps exit 1 to `stale` and
prints "run `node scripts/trace-render.js` and commit the result", which is the wrong remedy for a
could-not-run. The header (lines 18-22) promises exit 2 for this case and an empty stdout.
**Fix:** mirror state-check's lister:
```ts
function listTasks(real: string): string[] {
  try {
    return nodeFs.readdirSync(real, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (e) {
    couldNotRun(`the context root ${relOfRoot(real)} cannot be listed (${codeOf(e)}).`);
  }
}
```
Also wrap the top level of the hand-written part in a `try { ... } catch (e) { couldNotRun(...) }` as
state-check does, so no other unexpected throw can surface as exit 1.

## Warnings

### WR-01: The trace's ticket-ID shape is wider than the board's, so compliance refs become tickets and a long ref breaks the render

**File:** `scripts/trace-model.ts:57-65`, `:150-152`, `:172-186`; compare `scripts/board-model.ts:151`
**Issue:** `isTicketRef` uses `ID_SHAPE = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/` minus eight reserved prefixes; the
board grammar's `TICKET_ID` is `/^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/`. Two answers to "is this a ticket" now decide
file names, which is new in this phase (before, the ID was only a matrix cell). Reproduced: a sealed note with
refs `ABC-1`, `CWE-79` and a 300-letter prefix plus `-1`. The render wrote `CWE-79.md` as a ticket trace file
(the security reference got its own trace row and the note's other refs), then failed with ENAMETOOLONG and
exit 2 after writing 3 files, contradicting the header's "every check that can refuse runs before the first
write". Once the trace directory exists, the lstat pre-check meets the same ENAMETOOLONG and every later run
exits 2, so one malformed ref blocks the render permanently. Lowercase IDs (`utf-8`, `abc-1`) also match, and an
ID longer than about 55 characters makes its index line exceed `BUDGETS.indexEntryBytes`.
**Fix:** take the ticket shape from the board grammar's one authority (embed `TICKET_ID` or an
`isTicketId` export from board-model.ts through the generator) instead of a second regex. Validate every
planned file name before the first write.

### WR-02: state-check says progress is ROLLABLE from a fence-blind classification that state-roll then refuses

**File:** `scripts/state-rules.ts:580-592` (`progressEntries`), `:626-647` (`rollableSurfaces`), `:659-684` (`progressBytesFinding`); `scripts/runnable-ref/state-roll.ts:563-569`
**Issue:** `progressEntries` does not ask whether a heading sits inside a fenced block, but `planProgressRoll` does
(through `sectionEndIndex`) and refuses the whole roll when the oldest "dated" heading is fenced. Reproduced: a
progress file over budget with a fenced example `## 2020-01-01 example entry`. state-check prints
`ROLLABLE progress ... run node tools/grugops/state-roll.js`, and state-roll exits 2 ("sits inside a fenced
block"). WF09 runs state-roll whenever ROLLABLE appears, so it fails every day. The fenced heading also counts as
`dated > 0`, so `progressBytesFinding` drops the D-09 note that names the standing sections and where they belong.
The question "which headings are dated status entries" has two answers.
**Fix:** classify dated entries in one place that is fence-aware: pass `sectionEndIndex` (already embedded
in state-roll and allowed by D-16) into `progressEntries`, or have `rollableSurfaces` and the roll planner both
use `blockOf`'s "opens an entry" test. Add a test for this case in both runnables.

### WR-03: The board reader's traceability source still reads the old matrix shape; the new index publishes link markup as `title` and `status`

**File:** `scripts/board-read.ts:1919-1943`; `scripts/fixtures/board-snapshot/memory-bank/plans/traceability.md`; `scripts/fixtures/board-snapshot/expected-snapshot.json:621-660`
**Issue:** `parseTraceability` maps `cells[1]` to `title` and the last cell to `status`. On the new two-column
index (`| Ticket | Trace |`), both fields become `[ABC-1](traceability/ABC-1.md)`, and the published
`--json` snapshot (version 3) carries that as a ticket's trace title and status. The board contract
(`board.md:645-650`) now says every cell is opaque, but the published `TraceRow` type still claims `title` and
`status`. The snapshot fixture and golden still model the retired ten-column matrix, so the version-3 golden never
reads the shape that every seeded repository now has.
**Fix:** move the fixture's `traceability.md` to the generated index shape and regenerate the golden. Either
publish `cells` only for the index, or make `title` and `status` nullable when the header is not the matrix
header, and record that in the contract.

### WR-04: Note files are opened through symlinks without a realpath check, so the "root is a boundary" claim is false for notes

**File:** `scripts/runnable-ref/trace-render.ts:821-839` (`readTask`), `scripts/runnable-ref/state-check.ts` (`readTraceTask`), embedded walk from `scripts/context-io.ts:2181`
**Issue:** both runnables check only the realpath of `<task>/notes`. Each note file is then opened with
`openSync(path, O_RDONLY | O_NONBLOCK)`, which follows a symbolic link. A committed
`notes/x.md -> /abs/path/elsewhere.md` (for example in a PR to a host repository whose CI runs WF05) is read,
and if it is a sealed note its refs enter the rendered trace. The headers of both runnables say "Every path is
resolved with realpath before it is used ... a path that resolves outside realpath(root) is refused".
**Fix:** in the runnables' `readTask`, lstat each listed note name (or realpath it and check `insideRoot`)
before handing the directory to the walk, and count an outside or symlinked note under a named skip arm.
Alternatively pass `O_NOFOLLOW` in the reader for this position.

### WR-05: The three state runnables carry independent copies of one model and are never updated in place, so a host can run a mismatched pair

**File:** `install/install.ts:5795-5800`; `install/README.md:410-417`; `scripts/generate-runnable-embeds.ts:87-222`
**Issue:** `state-check.js` and `trace-render.js` each embed their own copy of the trace model and note reader,
and the installer never overwrites an existing copy ("an updated program reaches your repository only after you
remove the old copy"). A host that removes and re-installs one of them, or whose installs happened at different
kit versions, runs a renderer and a checker built from different `trace-model.ts` revisions. Any change to the
rendered bytes (the header, the index sentence, a sort) then makes `state-check` report `trace-stale` on a
tree the renderer just wrote, and on a migrated repository that is exit 1 every run. The same applies to
`BUDGETS` between `state-check.js` and `state-roll.js`. Nothing records which kit version generated each copy,
so the mismatch cannot be diagnosed.
**Fix:** stamp each generated region with a digest of its authorities (the generator already has the text),
have `state-check` read the sibling `trace-render.js` stamp and report a named `runnable-version-skew`
finding when they differ, and document that the three files are updated together.

### WR-06: The progress-roll duplicate refusal matches by heading text, so two distinct same-heading entries block the roll, and its remedy says to delete one

**File:** `scripts/state-rules.ts:1343-1406` (`planProgressAppend`, the `doubled` check); embedded at `scripts/runnable-ref/state-roll.ts:660-672`
**Issue:** the refusal fires when any archive line equals `## <heading>` of an entry about to move. Bare date
headings (`## 2026-10-01`) repeat naturally: one roll moves the first, and once the second is due the roll refuses
forever. The message says an earlier roll was interrupted and tells the human to "delete the progress file's
copy by hand and run state-roll again". The entries are not copies, and following that remedy deletes a
distinct status entry. The "once each copy is confirmed equal" clause depends on the human noticing.
**Fix:** compare whole blocks, not heading lines: refuse only when the archive contains the entry's full line
sequence contiguously. Otherwise allow the move, since the conservation proof already proves nothing is lost.
Reword the remedy so it never tells a human to delete without an equality the tool has checked.

## Info

### IN-01: `stripControlChars` leaves bidi overrides and line/paragraph separators in printed values

**File:** `scripts/state-rules.ts:1496-1504`
**Issue:** only C0, C1 and DEL are removed. U+202E (right-to-left override), U+2066-U+2069 and U+2028/U+2029 in a
task name, heading or path still reach the terminal and can reorder or split what a human reads in a report.
**Fix:** also drop Unicode format controls (category Cf bidi range) and U+2028/U+2029 in the single-line form.

### IN-02: `atomicWrite` does not keep the replaced file's mode

**File:** `scripts/context-io.ts` `atomicWrite` (embedded in state-roll and trace-render)
**Issue:** the temp file is created with the default mode and renamed over the target, so a board or archive a
user made read-only (0444) is silently replaced with a writable file, and any non-default mode is lost.
**Fix:** `fstat` the destination before the write and `chmod` the temp file to its mode, or refuse a target
the user cannot write.

### IN-03: The validator's `directoryFindings` reads an unreachable directory as absent

**File:** `scripts/validate-agent-factory.ts` `directoryFindings` (`existsSync` guard), added in plan 37-02
**Issue:** `existsSync` answers false for EACCES on a parent component as well as for ENOENT, so the
ticket, NFR or trace directory then gets no finding at all. That contradicts the comment "A directory that
exists and cannot be listed is reported by name". `state-check`'s `listDirectory` gets this right.
**Fix:** use `lstatSync` and treat only ENOENT and ENOTDIR as absent, as `state-check`'s `locate` does.

### IN-04: Rolling the final progress entry of a file with no trailing newline drops the newline of the line before it

**File:** `scripts/state-rules.ts:931-937` (`removeLines`), `:1226-1315`
**Issue:** for `A\n## 2020-01-01\nx` (no final newline) the roll leaves `A`, losing `A`'s line feed. The proof is
line-based, so it passes, while the header's "nothing else changes" claim is false at byte level.
**Fix:** when the moved block ends the file, keep the source's final-newline state (re-append `\n` if the old
text ended with one at that boundary), or state the exception in the header.

### IN-05: The installer writes the layout marker whenever no board exists, whatever else is already there

**File:** `install/install.ts:5734-5741`, `:870-893` (`stateLayout`)
**Issue:** "fresh" means only that neither board file exists. A repository that already has
`memory-bank/60-progress.md`, tickets or NFR files but no board gets the marker and is switched to FAIL mode at
once. The marker (`.layout`) also sorts before `board.md`, so a board seed that fails (`verify`) still leaves a
marker with no board, and state-check then exits 1 on the absent board.
**Fix:** treat "fresh" for the marker as no board AND no existing file under the seeded state paths, and write
the marker after the board seed has succeeded.

---

_Reviewed: 2026-10-22T20:10:40Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
