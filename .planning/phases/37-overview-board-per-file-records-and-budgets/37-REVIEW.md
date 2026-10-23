---
phase: 37-overview-board-per-file-records-and-budgets
reviewed: 2026-10-23T23:51:03Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - agent-factory/workflows/02-idea-to-epics.md
  - agent-factory/workflows/03-epic-to-tickets.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/generate-runnable-embeds.js
  - scripts/generate-runnable-embeds.ts
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
  - scripts/trace-instructions.test.ts
  - scripts/trace-model.js
  - scripts/trace-model.test.ts
  - scripts/trace-model.ts
findings:
  critical: 1
  warning: 1
  info: 3
  total: 5
status: issues_found
---

# Phase 37: Code Review Report (gap round 2)

**Reviewed:** 2026-10-23T23:51:03Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This review covers gap round 2 (plans 37-28 to 37-32, scope D-18), diffed against a98ae51c, at HEAD 3c9e5f9f.
It re-checks the round-1 findings in D-18's scope and asks the brief's four class questions (READ-1, EXIT-1,
AUTH-1, SCAN-1) of every change.

How the repros ran: the committed `.js` of the three runnables were copied into a scratch host directory and run
against scratch repositories under the session scratchpad. No installer was run and no tracked file was changed.
The harness is
`/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/58363b4a-5d6f-4c33-9956-bf1876318d31/scratchpad/repro.mjs`,
with the probe modules `p2.mjs` to `p5.mjs` and the scan probes `scan.mjs` to `scan4.mjs` in the same directory.

These checks were green at HEAD:

- `node scripts/freshness.js`, `runnable-embeds-freshness.js`, `hook-manifest-freshness.js`,
  `adapters-freshness.js`, `skill-twins-freshness.js` and `catalog-freshness.js`, after a `tsc --outDir .tmp-build`;
- `npx vitest run scripts/trace-instructions.test.ts scripts/trace-model.test.ts` (116 tests).

`read-sites.test.ts` and the other runnable tests were read, not run.

**What holds.** The one absence owner (`entryPresence`) is sound for every shape round 1 named:

- A dangling `notes` link, a symlinked task entry, a dangling context root and a dangling ancestor (`.grugops`)
  all exit 2 in the renderer, with the old trace file kept. `state-check` reports `trace-not-compared` for each.
- Dangling links at a ticket record, the progress file and the two move-only folders become named unmeasured or
  unlisted findings in `state-check`.
- After this round, ENOENT is compared only inside `entryPresence` and `readRegularFileOrNull` in all three
  runnables.

**What does not hold:**

- **CR-05.** The owner's `absent` is answered beneath a link that leaves the repository root. That is the one
  boundary the runnables' headers promise to refuse. The render then removes a ticket's trace file with exit 0.
- **WR-11.** SCAN-1 recurs. Pattern 4 accepts only eleven determiners directly before the word `trace`, and the
  verb list has no `-ing` forms. So plain wordings such as "Edit trace files by hand" and "Keep updating the
  trace file by hand" pass.
- **WR-09 is only partly closed.** WF03's Done condition still leaves out the ticket identifier (see the prior
  findings section).

WR-07, WR-10, IN-07, IN-08 and IN-09 stay open outside D-18's scope, as 37-CONTEXT.md D-18 records. They are not
re-reported.

## Prior findings re-checked

| ID | Status | Evidence |
|----|--------|----------|
| CR-03 | closed | Repro `dangling-notes`: render 1 writes `ABC-1.md`. Renaming the link target makes `--check` and the write mode exit 2 with `UNREADABLE TASK .grugops/context/taskA: ... it is a symbolic link whose target cannot be reached (ENOENT)`, and `ABC-1.md` survives. `state-check` exits 1 with a `trace-not-compared` finding naming the task. |
| CR-04 | closed | Repro `symlink-task`: the symlinked `taskA` is `UNREADABLE TASK ... it is a symbolic link, and a symbolic link is never read as a task`. Exit 2, nothing removed, and `state-check` reports `trace-not-compared`. |
| IN-06 | closed | The walk no longer calls `statSync(..., { throwIfNoEntry: false })`. `context-io.ts:2274-2290` asks `entryPresence`, and a task path that is a regular file throws ENOTDIR (context-io.test.ts). The comment premise is corrected, and `readRegularFileOrNull`'s comment now says that its null does not prove absence. |
| IN-10 | closed for the reported shape | Repros `dangling-root` and `dangling-grugops`: the renderer exits 2 naming the root. `state-check` reports `trace-not-compared` naming the same root with the same owner reason. Both now also agree on the CR-05 case, but there they are both wrong (see CR-05). |
| WR-08 | closed for its table | Every sentence in WR-08's table, including the path-dot case, now matches (KNOWN_VIOLATIONS rows, green). The class recurs in shapes the table did not list: WR-11. |
| WR-09 | **partly closed** | WF02:41 and WF03:9 are fixed. The adapters, catalog and skill twins are fresh. One position is still unfixed in the same file: `agent-factory/workflows/03-epic-to-tickets.md:46`, the Done condition, says "Its epic, feature and NFR ids are published as refs on a note." It leaves out the condition that Step 8 (line 30) and Trace updates (line 37) state: "The ticket identifier is among the refs". An agent that checks the Done condition literally can publish `[EPIC-1, FEAT-2, NFR-3]` and get no trace file. **Fix:** "Its epic, feature and NFR ids are published, with the ticket identifier, as refs on a note." Then regenerate the adapters, catalog and skill twins. |

## Critical Issues

### CR-05: An absent context root under a link that leaves the repository root reads as "no tasks", so the render removes the tickets' trace files (exit 0); with the folder present, the same link is refused as outside the root

**File:** `scripts/context-io.ts:2194-2211` (`entryPresence`, the `absent` return), `scripts/runnable-ref/trace-render.ts:1028-1040` (`realDirectoryOrNull`, `CONTEXT_ROOTS`), `scripts/runnable-ref/state-check.ts:1954-1961` (`locate`), `:2225-2231` (`traceDirectory`)

**Issue:** `entryPresence` returns `absent` as soon as an lstat of any path component gives ENOENT. It follows
every link on the way down and never asks where the followed prefix resolved. So a missing path beneath an
ancestor link that leaves the root is `absent`.

Every caller checks `insideRoot` only on a `present` answer. The renderer's `realDirectoryOrNull` and
state-check's `locate` therefore return "absent" for such a context root. An absent root holds no tasks, and the
render removes every trace file whose notes lived there.

The same link with the folder present is refused as "resolves outside the repository root" (exit 2). The answer
to "may this root be used" therefore depends on what sits outside the root, the place the header says is never
read ("THE ROOT IS A BOUNDARY").

This breaks 33.1 DC-2. A trace file is removed because a read at a refused position produced nothing, not
because a complete read showed that no note names the ticket. The trigger is an ancestor link that leaves the
root and whose target lacks the child. One example is `.grugops/archive` linked to external storage whose mount
point is empty while the volume is unmounted. Another is a half-done move. The effect is CR-01's.

Reproduced with the committed `.js` (`p4.mjs`):

1. A repository with `.grugops/context/taskA` naming ABC-1 and `.grugops/archive/context/taskB` naming ABC-2.
   The render exits 0 and writes `ABC-1.md,ABC-2.md`.
2. Move `.grugops/archive` away, and make `.grugops/archive` a link to an empty directory outside the root.
3. `trace-render.js --check` exits 1 with `EXTRA memory-bank/plans/traceability/ABC-2.md: a fresh render removes it.`
   It reports `1 task(s) ... unreadable tasks 0`.
4. `state-check.js` exits 1 with `trace-stale` "extra: a fresh render removes it; run node tools/grugops/trace-render.js <root>".
   Its remedy is the deletion.
5. `trace-render.js` exits 0 with `REMOVED memory-bank/plans/traceability/ABC-2.md`, and only `ABC-1.md` remains.
6. Control: put a `context/` folder inside the outside target. `--check` then exits 2 with
   `the context root .grugops/archive/context resolves outside the repository root, so it was not used.`

The read-sites ENOENT table cannot see this case. It lists `trace-render ... via realDirectoryOrNull#0` and
`state-check ... via locate#0` as exempt, on the grounds that an absent root "holds no task". The shape table
plants a link only to an in-root directory, so no row ever links outside the root.

**Fix:** have the owner report where the deepest present component resolved. Then a caller that enforces the
boundary refuses an absent answer beneath an outside link, as it refuses a present one:

```ts
// context-io.ts
export type EntryPresence =
  | { readonly kind: "absent"; readonly realParent: string }   // realpath of the last present component
  | ...;
// in the loop, before `return { kind: "absent" }`:
//   const realParent = i === 0 ? at : realpathSync(prefixes[i - 1]);   // a failure here is `unreadable`
//   return { kind: "absent", realParent };

// trace-render.ts realDirectoryOrNull, state-check.ts locate, state-roll.ts realDirectoryOrNull:
if (presence.kind === "absent") {
  if (!insideRoot(presence.realParent)) couldNotRun(`${what} resolves outside the repository root, so it was not used.`);
  return null;
}
```

Add two READ-1 shape rows for every directory-follow position: an ancestor linked outside the root with the child
present, and with the child absent. Both must be refused, with the old trace file and index line kept. Keep the
in-root absent case exempt.

## Warnings

### WR-11: SCAN-1 recurs: pattern 4 needs one of eleven determiners directly before `trace`, and the shared verb list has no `-ing` forms, so plain hand-write instructions pass

**File:** `scripts/trace-model.ts:49-72` (`HAND_TRACE_WRITE_VERBS`), `:86-108` (`PATTERN_4`, the determiner list at line 103), `scripts/trace-instructions.test.ts` (`KNOWN_VIOLATIONS`)

**Issue:** The brief's truth for this scan is "a write verb aimed at 'the trace' in any spelling is a positive"
(37-GAP-PLANNING-BRIEF.md §1.1). Pattern 4 stops short of that in two ways:

- It needs exactly one of `the|a|an|its|this|that|each|every|ticket|tickets|ticket's`, then whitespace, then
  `trace`.
- Patterns 1 and 4 share a verb list that holds only base, `-s` and past forms.

I ran each of these sentences against the committed `scripts/trace-model.js` (`scan.mjs`, `scan2.mjs`,
`scan4.mjs`). Each tells an agent to write the trace by hand, and each matches no pattern:

| Sentence | Shape that escapes |
|----------|--------------------|
| "Edit trace files by hand when the render is late." | no determiner (the artifact's own name, "trace files") |
| "Update trace files directly." | no determiner |
| "Update your trace file." / "Append the PR link to our trace." / "... to their trace." | a possessive the list leaves out |
| "Append the PR link to the generated trace file." | an adjective between the determiner and `trace` |
| "Record the release in the matching trace file." / "Write the release id into the ticket's own trace." | the same |
| "Update the ticket traces by hand." / "Edit these traces." | the plural `traces` (`trace\b` fails before the `s`) |
| "Keep updating the trace file by hand." / "Finish by adding the PR link to the trace." | the gerund of a listed verb |
| "Start by appending the PR link to traceability.md." | the gerund, in pattern 1 too |

None of these is among the three shapes that the 37-32 entry in deferred-items.md records: the note/ref stop, a
ticket id as the determiner, and verbs outside the list (copy, paste).

No live kit sentence has these shapes today. I ran a widened grep over the 77-file scan set, and the only near
hits are prohibitions ("No step edits a trace file") and observability "traces". This is the shape WR-08 had: a
scan built from the spellings it was shown, not from the truth.

**Fix:**

- Allow an optional run of up to two words between the determiner and `trace`, add the possessives `your|our|their`,
  accept `traces?`, and allow a bare plural `\btrace files?\b` without a determiner.
- Add the `-ing` form of every member of `HAND_TRACE_WRITE_VERBS`: generate it (`append` gives `appending`,
  `write` gives `writing`, `put` gives `putting`), or list each one. Hold the list complete with a test that each
  base verb has its gerund.
- Add every sentence above to `KNOWN_VIOLATIONS`.
- Where a widened shape needs an exclusion, add it as an `EXCLUSION_CONTROLS` row (negative plus control). Example:
  "this workflow feeds the trace rather than editing it" in `16-context-read-write.md:78`.

## Info

### IN-11: A stray regular file or FIFO at the top of a context root now blocks every render, and the remedy text names the wrong fix

**File:** `scripts/context-io.ts:2424-2434` (`listContextTasks`), `:2449-2459` (`readTaskNoteRefs`), `scripts/runnable-ref/state-check.ts:2343-2344`

**Issue:** Since plan 37-28, every non-keeper entry of a context root is a task or a failed task. A regular file
whose name does not start with `.` (for example `.grugops/context/README.md`) cannot hold a ticket's notes, yet
it stops the render on every run. Reproduced (`p5.mjs`):

- the render exits 2 with `UNREADABLE TASK .grugops/context/README.md: it is not a directory, so it is not a task`;
- `state-check` reports `trace-not-compared`: "this task's notes could not be read (...); the render refuses to run
  until they can be read".

The brief asks for this (a wrong-type entry is a failed read), and refusing is safe because nothing is removed.
Two problems remain:

- **IN-09's blast radius has widened.** Before, only a directory with a refused name could block the gate. Now any
  stray file in the context root can.
- **The remedy text is wrong for this case.** "until they can be read" tells a human to make a file readable,
  when the fix is to move it out of the context root.

**Fix:** give non-directory entries their own remedy wording, for example "remove or move it out of the context
root; only task directories and dot-named keepers belong there". Record the wider block in the header next to
IN-09.

### IN-12: Two read-sites assertions are looser than the rules they state

**File:** `scripts/runnable-ref/read-sites.test.ts:888-893` and `:967-977` (ENOENT-exempt rows), `:1656` and `:1771-1774` (`shapeCellsRun`)

**Issue:**

- **ENOENT-exempt rows.** The comment says an exempt row's program "must answer it as absence". The test asserts
  only that the fault fired, with no stack trace and no unexpected-throw line. It never checks that the outcome
  equals the outcome for a truly absent path. A program that answered an exempt ENOENT with a pass for some other
  reason (for example, by exiting 0 before the read) would stay green.
- **Shape-cell counter.** `shapeCellsRun` is incremented before the platform-skip test. So "every cell ran" holds
  even if every symlink and FIFO cell was skipped.

**Fix:**

- For each exempt row, compare the faulted run's exit status and written bytes with a run on a fixture where the
  path is really absent.
- Count skipped cells apart from run cells, and assert on darwin and linux that `shapeCellsSkipped === 0`.

### IN-13: The repository boundary has four hand copies that disagree on a root ending in the separator

**File:** `scripts/context-io.ts` (`isWithin`, embedded into trace-render and state-check by this round), `scripts/runnable-ref/trace-render.ts:1012-1014`, `scripts/runnable-ref/state-roll.ts:1455-1457`, `scripts/runnable-ref/state-check.ts:2204-2207`

**Issue:** The question "is this real path inside the root" now has four implementations. `isWithin` and
state-check's `insideRoot` treat a boundary that ends in `/` as its own prefix. The `insideRoot` copies in
trace-render and state-roll build `root + sep`. For a root of `/`, these give `//` and refuse every path, while
the embedded walk's `isWithin` admits the same paths.

This is benign today: it refuses, and a repository at `/` is unrealistic. It is still an AUTH-1 split that this
round widened rather than closed: it added a generated boundary predicate beside the three hand-written ones
instead of making those call it.

**Fix:** have the three hand-written parts call the embedded `isWithin(real, root)`, and delete their
`insideRoot` copies.

---

_Reviewed: 2026-10-23T23:51:03Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
