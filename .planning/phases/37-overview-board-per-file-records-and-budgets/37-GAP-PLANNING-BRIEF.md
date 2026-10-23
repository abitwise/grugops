# Phase 37 — Gap-Planning Brief (read before any `--gaps` planning, checking, executing, reviewing or verifying)

Written 2026-10-23 after the first verification (37-VERIFICATION.md, `gaps_found` 9/13). The scope of
round 1 is fixed by the human in 37-CONTEXT.md D-17. This brief is guidance for agents, not a decision
record: decisions stay in 37-CONTEXT.md. Gap rounds are capped at 4.

## 1. The defect classes and their rules

A later finding that matches one of these is **the same class again**, not a new gap. Fix the class,
not the site.

| ID | Class | Rule that must hold everywhere | Evidence so far |
|----|-------|--------------------------------|-----------------|
| READ-1 | An incomplete or failed read is treated as absence, or as a pass (33.1 DC-1, "absent evidence read as proof") | In the three host runnables (`scripts/runnable-ref/state-check.ts`, `trace-render.ts`, `state-roll.ts`), the shared models they embed (`scripts/trace-model.ts`, `scripts/state-rules.ts`, the embedded `context-io` walk), `scripts/trace-freshness.ts` and `scripts/validate-agent-factory.ts`, a read that fails (EACCES, EIO, ENOTDIR, a vanished or non-regular file, an above-ceiling file) is either a could-not-run (exit 2, per each header's exit contract) or a named finding. It is never counted as "no data", never lets a compare report fresh, and never lets a write mode write or remove anything. Trust decisions (`unsealed`, `unparseable`) stay skips; I/O skip arms (`unopenable`, `not-a-regular-file`, `above-ceiling`, `vanished`) are read failures | CR-01 (an unreadable task's trace file is REMOVED, then `--check` and `state-check` say fresh, exit 0), IN-03 (`directoryFindings` reads an unreachable directory as absent) |
| EXIT-1 | An unexpected throw surfaces with the finding code | Every runnable and every gate script whose header promises exit 2 for could-not-run maps any uncaught throw at its top level to exit 2 with that header's stdout rule; exit 1 means only "a finding". Callers that map exit codes (`trace-freshness.ts`, WF05, WF09) never read a could-not-run as stale, and their remedy text matches the code | CR-02 (`listTasks` readdirSync outside any try; exit 1 + stack trace; `trace-freshness` then prints the re-render remedy) |
| AUTH-1 | Two answers to one question (one authority per rule) | Each question has one owner, and every copy is generated from it and checked fresh. A copy that lives separately on a host (the three materialized runnables) carries a stamp of the authorities it was built from, and `state-check` reports a named finding when its siblings' stamps differ from its own | WR-01 (trace `ID_SHAPE` vs the board grammar's `TICKET_ID`), WR-02 (`progressEntries` is fence-blind, `planProgressRoll` is fence-aware through `sectionEndIndex`), WR-05 (three runnables, independent copies, no stamp, never updated in place) |
| SCAN-1 | A guard scan's predicate is narrower than the truth it guards | A permanent scan is derived from the truth's wording, not from the first sentences it caught. Its corpus holds every known violating sentence as a positive case, and its scanned file set is derived (by search) and counted, with the count asserted | Gap 3 (`HAND_TRACE_PATTERNS` needs the word "traceability"; WF02:41, WF03:9 and `_commit-convention.md`:52 pass it) |

33.1's DC-2 (delete by record, not by presence) applies to the trace write mode: a rendered trace file
is removed only when a COMPLETE read shows its ticket has no published refs, never because a read
produced nothing. DC-3 (bounded reads; lstat before opening, no FIFO hang) applies to every new test
fixture. Read `.planning/milestones/v2.1-phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md` §1.

### 1.1 Round 2 addendum (2026-10-23, scope D-18)

READ-1 recurred after round 1 in a form the round-1 fault table could not reach: CR-03 (a dangling
`notes` link: `realpathSync` ENOENT and `statSync(..., { throwIfNoEntry: false })` both say "absent",
so the task reads as zero notes) and CR-04 (a symlinked task directory is filtered out of `listTasks`
with no count). Neither raises an error, so injecting error codes never finds them. IN-06 (ENOTDIR also
returns undefined) and IN-10 (two "is the context root present" answers) are the same family. Two
consequences for every round-2 plan:

- **Absence has one owner.** Only an `lstat` ENOENT on the entry itself is "absent". An entry that
  exists but whose target is missing, is a link, or is the wrong type is a failed read (or a named,
  counted trust arm), never "no data". The renderer, `state-check` and the embedded walk use that one
  owner; no caller decides absence from `realpathSync`, `statSync` with `throwIfNoEntry: false`, or a
  `Dirent` type filter.
- **The READ-1 table also plants non-error shapes.** Besides injected error codes, each read site
  gets rows for a dangling link, a link to a directory, a link to a file, a regular file where a
  directory is expected, and (for directory listings) a refused entry. Each asserts the old trace
  file and index line survive, exit 2, and `state-check` reports `trace-not-compared`. The site list
  is re-derived by search, and the row count asserted.

SCAN-1 recurred too (WR-08). The round-2 scan is derived from the truth "no kit file tells an agent to
write the trace by hand": a write verb aimed at "the trace" in any spelling is a positive, and every
sentence in 37-REVIEW.md WR-08's table is a `KNOWN_VIOLATIONS` row. A site outside D-18's scope is
listed with "out of round 2 scope, see 37-REVIEW-DISPOSITION.md", not dropped.

## 2. Required in every gap-round plan set

### 2.1 Tests that catch any member of the class
- **READ-1:** one table-driven test over every read site in the runnables, the embedded walk and the
  validator. The site list is derived by search (`readdirSync`, `openSync`, `readFileSync`,
  `lstatSync`, `realpathSync`, `statSync` and the skip arms of `collectTraceNotes`), and the count is
  asserted. Each row makes its site fail and asserts the exit code is not 0 and, for a write mode,
  that no file was written, changed or removed (compare a before/after listing with content digests).
  The CR-01 sequence is one required row: render, make a task unreadable, render again, assert the
  old trace file and its index line still exist and the exit code is 2; then `--check` and
  `state-check` are not exit 0.
- **EXIT-1:** a test per runnable that forces an unexpected throw past every inner catch and asserts
  exit 2 with the header's stdout rule; a test that `trace-freshness` maps exit 2 to could-not-run and
  never prints the re-render remedy for it.
- **AUTH-1:** a test that the trace ticket test and the board grammar agree on a corpus that includes
  `ABC-1`, `CWE-79`, `utf-8`, `abc-1`, a 300-letter prefix and the longest ID that fits
  `BUDGETS.indexEntryBytes`; a test that `state-check` and `state-roll` agree on ROLLABLE for a progress
  file with a fenced dated heading; a test that mismatched stamps produce the named skew finding and
  matching stamps produce none.
- **SCAN-1:** the three known sentences are positive rows; reworded passive forms ("trace rows are
  written", "add a trace row", "write trace row") are positive rows; the rendered-from-refs wording is a
  negative row; the scanned file set count is asserted.

Each class test needs a mutation proof: break the rule, watch the test go red, record it in the SUMMARY.

### 2.2 One authority per rule
- READ-1: one predicate decides "the read was complete" for the trace (used by the write mode,
  `--check` and `state-check`); no caller re-derives it from counts.
- AUTH-1: the ticket shape comes from the board grammar's owner through the generator; dated-entry
  classification has one fence-aware owner used by both `state-check` and `state-roll`; the stamp is
  computed by the generator, never hand-written.

### 2.3 Sibling search before execution
The planner and the checker each list, for every class touched, **all** sites in that class, found by
search, not taken from the review or the verifier. For each site, name the plan and test that covers it.
A site outside D-17's scope is listed with "out of round 1 scope, see 37-REVIEW-DISPOSITION.md", not
dropped.

## 3. Required in every gap-round execution

- Test subset first while coding, then one regression run per plan:
  `npx vitest run --exclude '**/scripts/e2e/**'` (vitest is capped at one worker; never pass
  `--maxWorkers` above 1), plus `npm run build`, `npm run typecheck`, `npm run freshness`,
  `npm run freshness:runnable-embeds` and, when a workflow or role changes,
  `npm run freshness:adapters`, `freshness:catalog`, `freshness:skill-twins`. Never a red commit. Do not
  run `npm test` (it triggers the live e2e lane). The 20 failures in 37-BASELINE.md are a baseline, not
  new failures. After each run, `pgrep -fl vitest`; kill an orphaned grugops worker whose parent is
  launchd.
- Every scratch install sets `GRUGOPS_HOME=<scratch dir>` and `HOME=<scratch dir>`; without them the
  installer overwrites the user's real `~/.grugops` kit.
- Permission-denied fixtures (`chmod 000`) restore their mode in a `finally`/`afterEach`, so a failed
  test never leaves an undeletable tree.
- No per-plan red-team (retired 2026-10-04). New adversarial findings go to deferred-items.md for human
  triage, not into the next plan's scope.
- Do not flip ROADMAP/REQUIREMENTS rows; restore STATE.md frontmatter if a gsd tool strips it. Stage
  files by name (no `git add -A`). No agent runs `git push`.
- Windows stays out of scope.
