---
phase: 37-overview-board-per-file-records-and-budgets
reviewed: 2026-10-23T17:36:12Z
depth: standard
files_reviewed: 43
files_reviewed_list:
  - agent-factory/_commit-convention.md
  - agent-factory/workflows/02-idea-to-epics.md
  - agent-factory/workflows/03-epic-to-tickets.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/mode-census.test.ts
  - install/README.md
  - scripts/board-model.js
  - scripts/board-model.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/fault-inject.test-support.ts
  - scripts/generate-runnable-embeds.js
  - scripts/generate-runnable-embeds.test.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/progress-agreement.test.ts
  - scripts/runnable-ref/read-sites.test.ts
  - scripts/runnable-ref/runnable-exit-contract.test.ts
  - scripts/runnable-ref/state-check.js
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.js
  - scripts/runnable-ref/state-roll.test.ts
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.js
  - scripts/runnable-ref/trace-render.test.ts
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-stamp.js
  - scripts/runnable-stamp.ts
  - scripts/state-rules.js
  - scripts/state-rules.test.ts
  - scripts/state-rules.ts
  - scripts/trace-freshness.test.ts
  - scripts/trace-instructions.test.ts
  - scripts/trace-model.js
  - scripts/trace-model.test.ts
  - scripts/trace-model.ts
  - scripts/validate-agent-factory.js
  - scripts/validate-agent-factory.ts
  - scripts/validate-read-sites.test.ts
  - scripts/validate.test.ts
findings:
  critical: 2
  warning: 4
  info: 5
  total: 11
status: issues_found
---

# Phase 37: Code Review Report (gap round 1)

**Reviewed:** 2026-10-23T17:36:12Z
**Depth:** standard
**Files Reviewed:** 43
**Status:** issues_found

## Summary

This review covers gap round 1 (plans 37-20 to 37-27), diffed against 51fa4c77. It checks the round-0 closures
and hunts the four classes in 37-GAP-PLANNING-BRIEF.md (READ-1, EXIT-1, AUTH-1, SCAN-1) across the whole changed
set. The repros ran the committed `.js` copies of the three runnables, copied into a scratch host directory,
against scratch repositories under the session scratchpad with `HOME` and `GRUGOPS_HOME` pointing there. No
installer was run and no tracked file was touched. Script: `/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/f182d521-ebf7-4465-be45-bf4c5c6c1714/scratchpad/repro.mjs`.

**Closures that hold:**

- **CR-01 (EACCES arm):** closed. With `chmod 000` on a task's `notes/`, the render exits 2 and names the task. The
  old trace file stays, `--check` exits 2, and `state-check` reports `trace-not-compared` and exits 1 under the
  marker.
- **CR-02:** closed by code. `listTasks` maps a failed listing to could-not-run, and all three runnables register
  an `uncaughtException` handler before argv is read. I confirmed that a top-level ESM throw reaches that
  handler and gives exit 2.
- **WR-01:** closed for the cases that were reported. Lowercase refs and 300-letter refs are no longer tickets,
  and planned names are checked before the first write. CWE-79 still being a ticket is accepted as T-37-50.
- **WR-02:** closed. `progressEntries` asks `sectionEndIndex` (`/^#{1,2} /` outside flagged blocks), and so does
  the roll planner. Removing the old "inner heading" refusal is sound: no heading `progressEntries` returns can
  fall inside an extent the owner computes.
- **IN-03:** closed. The validator's primitives read only ENOENT as absence.
- **The three Gap 3 sentences:** reworded.

**Where the round falls short:**

- **READ-1 is closed only for the failure the review named (EACCES, EIO).** Two other ways for a read to
  produce nothing still remove a ticket's trace file with exit 0, after which `--check` and `state-check`
  report the trace fresh. These are CR-03 and CR-04, and they have the same effect as CR-01.
  - The READ-1 fault table injects error codes (EIO) at each read site. It never produces an ENOENT that comes
    from a symbolic link, and it never produces an entry the lister drops, so it could not see either case.
- **WR-05 is partly closed.** The build stamp covers only the generated regions. Every round-1 READ-1 and EXIT-1
  fix in the runnables lives in the hand-written parts, which no stamp covers.
- **SCAN-1 is still narrower than its truth.** Plain write-the-trace wording that does not say "traceability" or
  "trace row" passes the scan.
- **The Gap 3 rewording created a new defect at the same spot.** The new WF02 Done condition contradicts the same
  file's Trace updates section again.

## Critical Issues

### CR-03: A dangling `notes` symlink reads as "no notes", so the render removes the ticket's trace file (exit 0) and both checks then say fresh

**File:** `scripts/runnable-ref/trace-render.ts:956-973` (`readTask`), `scripts/runnable-ref/state-check.ts:2112-2129` (`readTraceTask`), `scripts/context-io.ts:2160` (embedded at `trace-render.ts:696` and in state-check)
**Issue:** Two reads in a row treat an ENOENT that comes from a link's target as absence:

1. `readTask` calls `realpathSync(<task>/notes)` and treats `ENOENT` as "no notes directory".
2. The embedded walk then calls `statSync(notesDir, { throwIfNoEntry: false })`. That call follows the link, so a
   dangling link also returns `undefined`, which the walk reads as `{ notes: [], skipped: [] }`.

The same walk files a dangling symlink at the note level under the `vanished` arm (`context-io.ts`, "a DANGLING
SYMLINK whose ENOENT is about its target"), and `traceReadFailures` counts `vanished` as a read failure. So one
walk gives two answers to the same condition, one level apart.

Reproduced with the committed `.js`:

1. Render a task whose `notes` is a symlink to `real-notes/` holding a sealed ABC-1 note. ABC-1.md is written.
2. Rename `real-notes`, which leaves `notes` dangling.
3. `trace-render.js <root>` exits 0 with `REMOVED memory-bank/plans/traceability/ABC-1.md` and
   `1 task(s) and 0 note(s) read; ... vanished 0 ...; unreadable tasks 0`.
4. `state-check.js <root>`, with the marker present, prints `TRACE The trace is fresh` and raises no trace
   finding.

This is CR-01's effect: a tracked audit file is deleted on an incomplete read and the gate passes. It breaks
DC-2 ("removed only when a COMPLETE read shows its ticket has no published refs").

The hand-written boundary check is duplicated in both runnables (`readTask` and `readTraceTask`), so the defect
sits in two places. `read-sites.test.ts` fails each site with an injected code, which is never ENOENT-through-a-link,
so the class test cannot reach this case.
**Fix:** decide absence with `lstat` on the entry itself. Only an `lstat` ENOENT is absent. An entry that exists
and whose target cannot be reached is a failed task. Do this once, in the walk, so both runnables embed it rather
than keeping two hand-written copies:
```ts
// context-io.ts readRawNotesWithSkips
const entry = lstatSync(notesDir, { throwIfNoEntry: false });
if (entry === undefined) return { notes: [], skipped: [] };       // nothing at the path
const st = statSync(notesDir);                                    // a dangling link throws ENOENT here -> failed task
if (!st.isDirectory()) throw new Error(`${notesDir} is not a directory`);
// readTask / readTraceTask: realpath ENOENT is absent only when lstat(notesDir) is ENOENT too
```
Add a READ-1 row that plants a dangling `notes` link and an ENOENT-at-target fault (not only EIO), and assert
that the old trace file survives with exit 2. Also assert that state-check reports `trace-not-compared`.

### CR-04: A task directory that is a symbolic link is dropped without a count or a name, so its tickets' trace files are removed (exit 0) and the checks say fresh

**File:** `scripts/runnable-ref/trace-render.ts:940-949` (`listTasks`), `scripts/runnable-ref/state-check.ts:2191-2200`
**Issue:** `listTasks` keeps only entries where `Dirent.isDirectory()` is true, "so a symlinked entry is never a
task". The refusal itself is a valid trust decision. But it is silent:

- it is not a failed task and not a skip arm;
- the counts line, which the header says hides nothing, does not show it;
- the dropped task's notes never reach `buildTraceRows`.

Reproduced:

1. Render with a real `.grugops/context/taskA/notes/n1.md` naming ABC-1. ABC-1.md is written.
2. Replace `taskA` with a symlink to a directory inside the repository that holds the same note.
3. `trace-render.js` exits 0 with `REMOVED memory-bank/plans/traceability/ABC-1.md` and `0 task(s) and 0 note(s)
   read; ...; unreadable tasks 0`.
4. `state-check.js`, with the marker, prints `The trace is fresh: 0 task(s)`.

This is the same DC-2 breach as CR-03: a trace is removed because the read produced nothing, not because a
complete read showed the ticket has no refs. The trigger, a hand-made link inside `.grugops/context`, is less
likely than an EACCES. The effect is identical to CR-01.
**Fix:** report every context-root entry that `listTasks` refuses. The simplest form returns refused names
beside the tasks, and `traceReadFailures` treats them as failures:
```ts
const entries = nodeFs.readdirSync(real, { withFileTypes: true });
const refused = entries.filter((e) => e.isSymbolicLink()).map((e) => e.name);
// collectTraceNotes: push { root, task: name, reason: "a symbolic link is never read as a task" } into failedTasks
```
Alternatively, make it a named trust arm that blocks removal of any trace file whose ticket is unknown. Give
both runnables the same answer from one embedded owner.

## Warnings

### WR-07: The build stamp hashes only the generated regions, so runnables whose hand-written parts differ count as "built together"

**File:** `scripts/generate-runnable-embeds.ts:626-645` (`stampOver`, `runnableSetStamp`), `scripts/runnable-stamp.ts:9`, `install/README.md:417-422`
**Issue:** `stampOver` hashes each target's path and its `deriveBody` output, which is only the import lines and
the authorities' closures. It never reads the hand-written half of a runnable. Yet this round's READ-1 and EXIT-1
fixes all landed in hand-written code:

- `listTasks` (CR-02);
- `readTask` and `couldNotRunIncomplete` (CR-01);
- the `uncaughtException` handlers;
- state-check's retyped counts line.

A host with a pre-37-20 `trace-render.js` and a state-check built from the same authorities would get equal stamps
and no `runnable-version-skew` finding. Meanwhile the old renderer still crashes with exit 1 on an unlistable root.

`runnable-stamp.ts` says "Equal stamps mean the three were built together", and the README tells users the
programs "carry one build stamp" so the stamp check detects a mixed set. Neither claim is true for skew in the
hand-written code. That is WR-05 again, one level over: the stamp proves the same authorities, not the same
build.
**Fix:** compute the stamp over each target's whole source with its three stamp lines blanked. The freshness gate
already holds `.ts` equal to `.js`, so hashing the `.ts` text minus the region's stamp lines is deterministic and
not circular. Otherwise, reword the two claims to "built from the same authorities", and add a hand-written
version constant that the stamp includes.

### WR-08: SCAN-1 is not closed: the hand-trace patterns still need the word "traceability" or "trace row/matrix/column"

**File:** `scripts/trace-model.ts:58-62` (`HAND_TRACE_PATTERNS`), `scripts/trace-instructions.test.ts`
**Issue:** The truth the patterns claim to come from is "no kit file tells an agent to write the trace by hand".
Pattern 1 aims a write verb only at `traceability`. Patterns 2 and 3 only name the retired matrix shape. I ran
the committed `trace-model.js` against these sentences:

| Sentence | Result |
|----------|--------|
| "Append the PR link to the trace." | pass |
| "Hand-edit the trace." | pass |
| "Update the trace file for the ticket." | pass |
| "Add a line to the trace index." | pass |
| "Write the trace entry for each ticket." | pass |
| "Fill in the Release column of the trace." | pass |
| "Add the test path to ./memory-bank/plans/traceability.md." | pass (the `.` in `./` stops pattern 1's `[^.]{0,120}`) |

Every one of these violates the truth. No live kit sentence matches today; a `grep` for write verbs near
"trace" found only "with trace ids on refs". But a scan this narrow is the round-0 Gap 3 shape again: it is
built from the sentences it caught, not from the truth's wording. `KNOWN_VIOLATIONS` has no row for any of the
sentences above.
**Fix:** add a pattern that aims a write verb at the trace itself, for example
`/\b(append|add|write|update|fill|record|edit|hand-edit|modify)\w*\b[^\n]{0,120}\b(the|a|its|ticket'?s?) trace\b(?! render)/i`,
with RENDERED_WORDING negatives such as "the trace render", "feed the trace" and "the rendered trace". Replace
`[^.]` with a bound that does not stop at a path's dot, and add every sentence above to `KNOWN_VIOLATIONS`.

### WR-09: The Gap 3 rewording reintroduces the contradiction it was meant to remove (WF02), and WF03 drops the ticket-id condition

**File:** `agent-factory/workflows/02-idea-to-epics.md:41`, `agent-factory/workflows/03-epic-to-tickets.md:9`
**Issue:**

- **WF02.** Round 0 flagged WF02:41 because it contradicted the same file's Trace updates section (lines 31-32).
  The new Done condition says "the epic and feature ids they publish as refs feed the trace render". Line 31 of
  the same file says "A note that names no ticket adds nothing to the trace", and WF02 creates no ticket. That
  matches the trace model: `buildTraceRows` drops a note whose refs name no ticket, and EPIC/FEAT are excluded
  from tickets by `isTicketId` and `RESERVED_PREFIXES`. So the Done condition claims an effect the render never
  has.
- **WF03.** Line 9 says that the epic and feature ids are "published as refs on a note (Workflow 16), so the
  trace render gives the ticket a trace file". It leaves out the condition that line 36 states ("The ticket
  identifier is among the refs"). An agent that follows line 9 literally publishes `[EPIC-1, FEAT-2]` and gets
  no trace file.

**Fix:**

- WF02:41: "...recorded as typed notes per Workflow 16. Their epic and feature ids reach the trace once Workflow 03
  publishes them on each ticket's note."
- WF03:9: "...and its epic and feature ids, published with the ticket identifier as refs on a note (Workflow 16),
  before it can be pulled."

Then regenerate the adapters, catalog and skill twins.

### WR-10: AUTH-1 is still split: the trace keeps its own reserved-prefix set, so board tickets with those prefixes never get a trace file

**File:** `scripts/trace-model.ts:85-86`, `:98-100` (`RESERVED_PREFIXES`, `isTicketRef`); compare `scripts/board-model.ts:161-163` (`isTicketId`)
**Issue:** `isTicketRef` is defined as `isTicketId(ref)` minus `RESERVED_PREFIXES`. The board grammar admits
`INC-7`, `ADR-3`, `RISK-2`, `REL-5`, `UAT-4` and `NFR-1` as ticket rows, since only `EPIC_ID` is excluded. The
trace treats the same identifiers as requirement, release or UAT links. So the question "is this a ticket"
still has two answers.

Reproduced: a sealed note with refs `INC-7` and `src/fix.ts` renders no `INC-7.md`. A host whose `id_prefix` is
one of the six reserved prefixes, for example an incident team using `INC`, gets an empty trace for every
ticket. The trace stays "fresh" and no finding says why. The corpus test pins this split rather than removing it.
**Fix:** have the board grammar own the reserved set. For example, export `isTicketId` with the reserved
structural prefixes excluded, the way `EPIC_ID` is today, so the board refuses `INC-7` as a ticket row. The
alternative is to have the trace treat every identifier the board admits as a ticket, with the reserved-prefix
classification applied only to refs the board refuses. Record the decision either way.

## Info

### IN-06: The context-io comment says `throwIfNoEntry: false` returns undefined "for a missing path only"; it also does so for ENOTDIR

**File:** `scripts/context-io.ts:2154-2160`
**Issue:** On Node 26.11.1, `statSync("<file>/notes", { throwIfNoEntry: false })` returns `undefined`. A task path
that is a regular file, for example one replaced between the listing and the read, therefore reads as "no
notes". This is the same family as CR-03, and the comment that justifies the line states a false premise.
**Fix:** use `lstat` and treat only `ENOENT` as absent, as CR-03 proposes, and correct the comment.

### IN-07: Write-phase refusals say "The trace render did not run" after files were removed, and a write failure does not name the removals

**File:** `scripts/runnable-ref/trace-render.ts:1140`, `:1159`
**Issue:** The header promises that an exit 2 after the write section has started names "the files already
written and removed". The `couldNotRun` for a failed `atomicWrite` reports only `writtenCount`, after
`diff.extra` was already unlinked. Both messages end with `couldNotRun`'s fixed "The trace render did not run."
That is false once anything has been removed. The unexpected-throw path (`stoppedUnexpectedly`) gets this right.
**Fix:** route write-phase failures through one helper that prints both counts and "did not finish", as
`stoppedUnexpectedly` does.

### IN-08: Refs the board refuses as tickets now fall into the Requirement column

**File:** `scripts/trace-model.ts:121-133` (`classifyRef`)
**Issue:** Since `isTicketRef` uses the board grammar, `utf-8`, `abc-12` and a 300-letter `AAA...-1` no longer
match as tickets. They then match `ID_SHAPE` and fall through to "Any other ID-shaped token ... is a Requirement
link". Reproduced: ABC-3.md lists `utf-8` and `abc-12` under `## Requirement`. A mistyped ticket ref is thus
recorded in the audit trail as a requirement link, with no signal.
**Fix:** limit the Requirement fallback to identifiers whose prefix is upper case, or to the reserved structural
prefixes. Leave any other ref unclassified, or put it in a named "Other" column.

### IN-09: A context-root directory with a name `assertSafeTask` refuses now blocks every render (exit 2)

**File:** `scripts/runnable-ref/trace-render.ts:957`, `scripts/runnable-ref/state-check.ts:2113`, `scripts/trace-model.ts` (`traceReadFailures`)
**Issue:** A directory such as `.grugops/context/my task` cannot hold a note written by the sanctioned writer.
Since plan 37-21 it is a failed task, so the render and `--check` exit 2 on every run until a human renames it.
That is a trust decision (the name is not one the writer creates), but it is handled as an I/O failure. The
refusal is safe in that nothing is removed, but one stray directory stops the trace gate.
**Fix:** either keep it as a failure and document it in the header and in WF05 as a named blocker, or add a
counted trust arm (`refused-task-name`) together with a rule that a ticket whose rows could come from a refused
task is never removed.

### IN-10: state-check and trace-render disagree on a dangling context-root link

**File:** `scripts/runnable-ref/state-check.ts:1816-1828` (`locate`) vs `scripts/runnable-ref/trace-render.ts:899-924` (`realDirectoryOrNull`)
**Issue:** `locate` reads `realpathSync` ENOENT as `absent`, so a dangling `.grugops/context` or archive-root link
is "no root" for state-check. The renderer `lstat`s first and refuses the same path with exit 2. No false pass
was found, because the extra files then read as `trace-stale`. But "is this context root present" has two
answers, and state-check's remedy (re-render) cannot work while the renderer refuses.
**Fix:** use one embedded "real directory or absent" owner in both runnables. Only an `lstat` ENOENT is absent.

---

_Reviewed: 2026-10-23T17:36:12Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
