---
phase: 37-overview-board-per-file-records-and-budgets
reviewed: 2026-10-24T15:49:57Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - agent-factory/workflows/03-epic-to-tickets.md
  - hooks/hook-entry.ts
  - install/mode-census.test.ts
  - scripts/context-io.ts
  - scripts/context-io.test.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/read-sites.test.ts
  - scripts/runnable-ref/runnable-exit-contract.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/state-roll.test.ts
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-ref/trace-render.test.ts
  - scripts/trace-instructions.test.ts
  - scripts/trace-model.ts
  - scripts/trace-model.test.ts
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 37: Code Review Report (gap round 3, diff e82bd43f..HEAD)

**Reviewed:** 2026-10-24T15:49:57Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Scope: the round-3 diff (`git diff e82bd43f HEAD`): the D-20 root-chain owner, the IN-11 stray-entry remedy, the IN-13 single boundary predicate, and the WR-11 widening of hand-trace pattern 4. New IDs start at WR-12 and IN-14, so none collides with the 37-REVIEW-DISPOSITION.md ledger (CR-01..CR-05, WR-01..WR-11, IN-01..IN-13).

**D-20 core: no defect found.** `rootChainPresence` (scripts/context-io.ts:2340-2385) lstat's every component of a validated repository-relative path below the already-real root. It refuses a link before the last component (and at the last component for leaf `directory`) from the lstat alone, and answers `absent` only on an lstat ENOENT beneath components it has seen as real directories. I traced every hand-written read and write site of the three runnables:

- trace-render: `realDirectoryOrNull` covers both context roots, the state directory and the trace directory. The pre-write loop and `readText` cover each planned path and each listed extra. The removals, the trace-directory `mkdirSync` and the writes act only on paths the owner already answered.
- state-check: `locate` (marker, board, indexes, measured files, folders, trace files) and `traceDirectory` (context roots, trace directory).
- state-roll: `realDirectoryOrNull` (state, archive and memory-bank directories) and `readTextOrThrow` (planning reads and the reads during the roll).

Only two raw fs reads remain off the owner, and neither is a D-20 position:
- state-check `confirmListed` (state-check.ts:2246), a post-listing lstat beneath a folder the owner already cleared;
- `runnableSkewFindings`, which reads the tools directory and not a state path.

Every link refusal comes before the first write or removal. I ran adversarial reproductions against the committed `trace-render.js` in scratch fixtures with HOME and GRUGOPS_HOME pointed at a temp dir:
- `.grugops` linked to an empty directory outside the root;
- a dangling `.grugops/context`;
- `.grugops/archive` linked to an in-root directory;
- the trace directory linked to an in-root directory;
- `.grugops` as a regular file.

Each case exited 2 by name, and the existing generated trace file survived. Only the really-absent baseline removed it, as D-20 defines.

The `entryPresence` `link` field, the `remedy` plumbing through the trace model, and the generator rows check out. The hook manifest hash matches `sha256(scripts/context-io.js)`. The census arithmetic adds up (10+22+2+3+6+2+2 = 47).

**Defects found.** The round-3 WR-11 fix created a new bypass of the hand-trace scan (WR-12). The scan is still a hand-enumerated verb and noun list, the same class as WR-11 (WR-13). The IN-11 remedy contract is false for one reachable arm of the union (WR-14).

## Warnings

### WR-12: Pattern 4's comma-list and `per Workflow 16` exclusions reach the whole 120-character run, so a plain list of objects aimed at the trace passes (created by the round-3 WR-11 fix)

**File:** `scripts/trace-model.ts:122-133` (the `(?!\bper Workflow 16\b)` and `(?!, ${LIST_ITEM_DETERMINER}\b)` lookaheads inside pattern 4's bounded run)

**Issue:** The two exclusions plan 37-39 added are checked at every step of the lazy `{0,120}?` run between the verb and the trace. Any `, the` / `, its` / `, each` … or any `per Workflow 16` anywhere between the verb and the trace therefore stops the match, wherever it sits. The intended scope was the end of a commit-convention artifact list. The commonest shape of a hand-trace instruction is a verb with several objects, and it now matches no pattern. Run against the committed `scripts/trace-model.js`, each of these matches none of the four `HAND_TRACE_PATTERNS`:

- `Append the PR link, the test path and the release to the trace.`
- `Add the PR link, the test path and the release note to each ticket's trace file.`
- `Update the PR link, its tests and the release in the trace file.`
- `Append, per Workflow 16, the PR link to the trace file.`

Before plan 37-39, pattern 4 caught the first three. This is the "fix created the bypass" class: the exclusion was reasoned from the false hit it removes (the 06/10 commit-convention lines) but not from the union of sentences it admits. Removing each exclusion in isolation shows what it actually exempts in the live scan set: only the `rendered trace files` commit lines in workflows 01, 02, 03, 06, 10, 14 and 15.

**Fix:** Delete both lookaheads and exempt the real false hit at the noun instead. A determiner phrase whose word just before `trace` is `rendered` names the render's output, the same reasoning the determiner-less alternative already uses:

```ts
// in PATTERN_4, drop:
//   String.raw`(?!\bper Workflow 16\b)`,
//   String.raw`(?!, ${LIST_ITEM_DETERMINER}\b)`,
// and in the determiner alternative:
String.raw`\b${TRACE_DETERMINER}\s+(?:(?!(?:and|or|but|nor)\b)[\w'-]+\s+){0,2}?(?<!\brendered )traces?\b`,
```

Checked in a scratch copy of the patterns: with this change the live scan set has 0 line hits and the four sentences above are hits. Re-point the two `EXCLUSION_CONTROLS` rows (trace-instructions.test.ts:385-397) at the `rendered` rule. Add the four sentences to `KNOWN_VIOLATIONS`, and re-run the paragraph scanner.

### WR-13: The hand-trace scan still enumerates its verbs and nouns by hand, so common write verbs and determiner-less shapes pass (same defect class as WR-11, one register over)

**File:** `scripts/trace-model.ts:50-74` (`HAND_TRACE_VERB_GROUPS`), `:104` (`TRACE_DETERMINER`), `:139-147` (the two noun alternatives)

**Issue:** WR-11 was closed by adding forms (gerunds, `copy`, `paste`) and determiners to hand-written lists. The truth the scan guards ("no kit file tells an agent to write the trace by hand") is not bounded by those lists. Each of these matches none of the four patterns in the committed `trace-model.js`:

- missing verbs: `Note the release in the trace file.`, `Commit the PR link to the trace file.`, `Store …`, `Save …`, `Set …`, `Mark …`, `Type the PR link into the trace file.`
- three describing words between determiner and noun (the `{0,2}` cap): `Append the PR link to the newly generated ABC-1 trace.`
- determiner-less `trace` without a listed artifact noun: `Append the PR link to trace ABC-1.`
- a colon clause bound before the object clause: `Record the release: the trace file gets the PR link.`

This is the P29 lesson recorded for this repo: a seven-stem verb list let `increases/raises/aids` through. The structural move is to stop enumerating the verb.

**Fix:** Invert pattern 4's anchor. Flag any sentence that names a trace artifact (determiner phrase or `trace file/index/entry/line`) as the object of a preposition of placement (`to|into|in|on|onto` + optional determiner + up to N words + `trace`). Keep the existing reasoned exclusions (negation, `render` subject, copula, `rendered`, `trace back/forward`). If the verb list stays, derive its completeness check from an external lexicon rather than the scan's own corpus, and at least add `note`, `commit`, `store`, `save`, `set`, `mark` and `type` with their forms. Raise the `{0,2}` cap to match the 120-character bound, or replace it with "any words not crossing a conjunction". Add each sentence above to `KNOWN_VIOLATIONS`.

### WR-14: The stray-entry remedy is not decided by the entry's own lstat: a non-directory context-root entry whose name falls outside the task grammar gets no remedy (IN-11 union arm)

**File:** `scripts/context-io.ts:2616-2626` (`readTaskNoteRefs`: `assertSafeTask(task)` runs before `entryPresence`); the claim is stated at `scripts/context-io.ts:2600-2609`, `scripts/runnable-ref/trace-render.ts:57-64` and `scripts/runnable-ref/state-check.ts:61-68`

**Issue:** The docblocks state that whether a failed read carries `STRAY_CONTEXT_ENTRY_REMEDY` "is decided by the entry's own lstat, never by a reason text". They also state that every entry that is not a task directory "as the entry's own lstat shows (a regular file, a FIFO, a symbolic link of any kind …)" is named with the remedy. `assertSafeTask` throws first, so any stray entry whose name fails `^[A-Za-z0-9._-]+$` never reaches the lstat. A Finder or editor artefact (`foo bar.txt`, `notes (1).md`, `Icon\r`), a FIFO or a symbolic link with such a name gets the bare `invalid task name` refusal and no remedy. Reproduced against the committed `trace-render.js` with two regular files in `.grugops/context`:

```
UNREADABLE TASK .grugops/context/foo bar.txt: context-io: invalid task name "foo bar.txt" — must match ^[A-Za-z0-9._-]+$ (...)
UNREADABLE TASK .grugops/context/foo.txt: it is not a directory, so it is not a task; move it out of the context root or remove it: ...
```

Both entries are regular files and both stop every render. Only one is told how to unblock it, and the documented union ("decided by the entry's lstat") is false for the other. The IN-09 carve-out ("a task directory whose name the sanctioned writer never creates keeps its own wording") covers directories only, not this arm. No test plants a non-directory entry with an out-of-grammar name.

**Fix:** Ask the entry's lstat before the name rule. Keep the name refusal for directories (the IN-09 arm) only:

```ts
export function readTaskNoteRefs(task, contextRoot, boundary) {
  const presence = entryPresence(join(contextRoot, task)); // task comes from readdir, so it holds no separator
  if (presence.kind === "absent") throw new Error("it was listed and is no longer there");
  if (presence.kind === "unreadable") {
    if (presence.link) throw strayEntryError(presence.reason, presence.code);
    throw codedError(presence.reason, presence.code);
  }
  if (presence.entry.isSymbolicLink()) throw strayEntryError("it is a symbolic link, and a symbolic link is never read as a task", null);
  if (!presence.entry.isDirectory()) throw strayEntryError("it is not a directory, so it is not a task", null);
  assertSafeTask(task); // IN-09 arm: a directory the writer never creates
  ...
}
```

If `assertSafeTask` must stay first, because `task` could hold `..` or a separator from a non-readdir caller, run the lstat only when `task` holds no `/` or NUL. Then add a context-io.test.ts row for a regular file, a FIFO and a link, each with an out-of-grammar name.

## Info

### IN-14: The three runnables answer "may this state file be used" differently at the leaf, so state-check can point at a command that exits 2

**File:** `scripts/runnable-ref/state-check.ts:2078` (`locate` defaults to leaf `entry` and `readState` reads `at.real`), compared with `scripts/runnable-ref/state-roll.ts:1508-1510` (`readTextOrThrow` refuses a leaf link) and `scripts/runnable-ref/trace-render.ts:1265-1273` (`regularFileAt` refuses a leaf link)

**Issue:** An in-root symbolic link at `memory-bank/plans/board.md` is followed by state-check (board findings, a `ROLLABLE … run node tools/grugops/state-roll.js` line) and refused by state-roll with exit 2. An in-root link at `memory-bank/plans/traceability.md` is read as the index by state-check's `readState`, then refused by its own `readTraceText` (exit 2) and by trace-render (exit 2). This predates round 3. However, plan 37-35 re-stated it as intended ("The file leaf rules are unchanged: the marker, the board and the indexes follow an in-root link"), and D-20's stated aim is that the runnables give one answer to "may this path be used".

**Fix:** Either refuse a leaf link at the board and the indexes in state-check too (in `readState`, check `at.entry.isSymbolicLink()` the way `sizeFinding` and `readTraceText` already do), or record the asymmetry as a flagged decision beside the `.grugops/queue` flag.

---

_Reviewed: 2026-10-24T15:49:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
