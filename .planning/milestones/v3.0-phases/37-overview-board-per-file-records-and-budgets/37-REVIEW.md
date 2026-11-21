---
phase: 37-overview-board-per-file-records-and-budgets
reviewed: 2026-10-27T12:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - hooks/hook-entry.ts
  - install/install.ts
  - install/uninstall.ts
  - install/runnable-package.json
  - install/install.test.ts
  - install/installer-cross-version.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/ledger-provenance.test.ts
  - install/record-truth.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-banned-claims.test.ts
  - scripts/context-io.ts
  - scripts/context-io.test.ts
  - scripts/runnable-ref/read-sites.test.ts
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-check.test.ts
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-ref/trace-render.test.ts
  - scripts/trace-instructions.test.ts
  - scripts/trace-model.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 37: Code Review Report (gap round 4)

**Reviewed:** 2026-10-27T12:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Scope: the gap round 4 diff `78416b71..HEAD` (plans 37-40, 37-41, 37-42) over the 23 listed files, plus the code
those changes call (materializeRunnable, readForWrite's skip arms, the uninstall ledger walk and
reportUnrecordedFile, assertSafeTask and listContextTasks, locate and rootChainPresence, state-roll's
readTextOrThrow, and pattern 4 as a whole).

What holds:
- The RUNNABLES and RUNNABLES_MIRROR rows match. The kit file is 18 bytes with `eol=lf` pinned by .gitattributes.
  The DECIDER_MANIFEST hash for `scripts/context-io.js` matches the committed build (`3bff331a...` recomputed).
- readTaskNoteRefs step 1 can only throw: TASK_NAME_RE refuses every name step 1 catches (`/`, `\`, NUL, empty,
  `.`, `..`), so nothing reaches `join` with a multi-component name. The reorder gives the remedy to every
  non-directory, whatever its name, and keeps IN-09 for directories.
- readState's new leaf-link refusal reads the owner's lstat (`at.entry`), not a reason text. `rel` is compared to
  the same `LAYOUT_MARKER_REL` constant that readMarker passes in.
- Pattern 4's two run-wide lookaheads are gone. All four WR-12 sentences now hit (re-probed against
  `scripts/trace-model.js`).

The two warnings are the round-4 fixes' own claims failing one step further out. IN-14's stated purpose ("never
prints a ROLLABLE line pointing at a roll that would refuse the same board") is met only for a leaf link at the
board. Two other refusals state-roll makes still leave state-check printing ROLLABLE (both reproduced). And
G-37-2's failure (every program exits 1 at load) is still reachable when a file already sits at
`tools/grugops/package.json`. Install then reports `skipped` and exits 0.

Not re-reported, because they are accepted residuals or already in deferred-items.md: the layout marker read
through a link; the outside-root board or index link exit-code split; the claim.ts copy of the task-name rule; every
pattern 4 shape `rendered` lets through ("Append the PR link to the rendered trace file." is the same class as the
recorded "Edit the rendered trace files by hand."); the remaining run-wide `as refs`, `on a note` and `because`
lookaheads (deferred-items.md, round 4 entry); the nameless workspace package; uninstall removing the package file
beside a kept edited program; pre-fix installs needing a re-run.

## Warnings

### WR-15: state-check still prints ROLLABLE for a board that state-roll refuses (IN-14 fixed for one refusal of several)

**File:** `scripts/runnable-ref/state-check.ts:2117-2124` (the readState docblock claim), `scripts/runnable-ref/state-check.ts:2700` (rollableSurfaces input); refusals at `scripts/runnable-ref/state-roll.ts:1521-1537` and `:1569`
**Issue:** Plan 37-41 says readState now refuses a leaf link "so state-check ... never prints a ROLLABLE line
pointing at a roll that would refuse the same board". The roll refuses for more reasons than a leaf link, and
state-check checks none of the others before it prints `ROLLABLE ... run node tools/grugops/state-roll.js`. Both of
these were reproduced on the committed builds, run from a scratch directory that holds a `{"type":"module"}`
package file:

1. A board holding bytes that are not UTF-8 (an `\xff\xfe` pair in a Ready row) with 21 Done rows: state-check
   prints `ROLLABLE  done: 21 rows, keeps 20 rows` and exits 1. state-roll then exits 2 with `board.md holds U+FFFD
   or bytes that are not UTF-8 ... Nothing was rolled.`
2. A clean board with 21 Done rows and `memory-bank/plans/archive/board-done.md` as an in-root link: state-check
   prints the same ROLLABLE line and exits 1. state-roll exits 2 with `archive/board-done.md is a symbolic link, and
   a roll would replace the link with a file.` state-check never reads BOARD_DONE_ARCHIVE_REL (`grep -c` gives 0).

So the remedy line still names a command that refuses, which is the IN-14 defect, and the new docblock states a
guarantee the code does not have. The progress file has the same exposure through PROGRESS_ARCHIVE_REL.
**Fix:** Pick one of two options.
- Derive the rollable decision from the roll's own read rule. Have the runnable-embeds generator embed state-roll's
  read-refusal predicate (the readTextOrThrow checks: leaf link, not a regular file, U+FFFD) into state-check. Then
  ask it of the board, the progress file and both archive paths before a surface goes into `rollable`. Turn a refusal
  into a finding naming the path, not a ROLLABLE line.
- Or narrow the docblock to what is true. Make the ROLLABLE line conditional, for example "the roll may still refuse
  a file it cannot keep byte for byte; run it with --dry-run first", and record the remaining refusals as a residual.

Either way, add the two reproductions above as red-first cases in the IN-14 describe block of state-check.test.ts.

### WR-16: a file already at tools/grugops/package.json silently disables every installed program (G-37-2 still reachable, install exits 0)

**File:** `install/install.ts:5838-5845` (materializeRunnable's differing-file arm), row at `install/install.ts:5816`
**Issue:** The package row follows the license rule: never written over an existing file. A differing file gets
`report("skipped", "... a file that differs from this kit version's is already there — left untouched,
never-overwrite")` and install exits 0. That is harmless for the license. For this row the existing file decides
whether any of the seven programs can load. If it says `"type":"commonjs"`, as the install.test.ts case "a user's own
file at that path" plants (`{"type":"commonjs","private":true}`), it is the nearest package.json and every program
dies at its first import with exit 1. Exit 1 is the finding code, so WF05 and WF09 read a program that never ran as
a finding, which is exactly G-37-2. Reproduced: with that file beside the committed state-check.js, `node
state-check.js <root>` prints the Node load stack and exits 1.

The test asserts exit 0 and the `skipped` wording, so this outcome is now pinned as intended. Nothing tells the
user the programs cannot run. "Never write over a user's file" is the right rule, but leaving the file must not
mean claiming success.
**Fix:** Keep the never-overwrite rule, but treat a differing package file whose module type is not `module` as a
verify finding (exit 3), not a `skipped` line:
```ts
if (destRead.state === "ok" && destRel === "tools/grugops/package.json" && destRead.text !== srcRead.text) {
  let type: unknown;
  try { type = (JSON.parse(destRead.text) as { type?: unknown }).type; } catch { type = undefined; }
  if (type !== "module") {
    verify(
      `${destRel}: a package file that does not set "type": "module" is already there and was left untouched; ` +
        `Node will load every program in tools/grugops/ as CommonJS and each will exit 1 before it runs. ` +
        `Add "type": "module" to it, or move it aside and re-run install.`,
    );
    continue;
  }
}
```
Change the install.test.ts case to expect exit 3 and the verify line. Add a control case where a differing file
that does set `"type":"module"` stays `skipped` with exit 0. Even better, drive the check from a column on the
RUNNABLES row ("the programs need this file") instead of a path literal, so the rule cannot drift from the row.

## Info

### IN-15: state-check's new leaf-link refusal says state-roll and trace-render refuse the NFR catalog, but neither reads it

**File:** `scripts/runnable-ref/state-check.ts:2136-2141` (message), `:2103-2109` (LEAF_LINK_READ_THROUGH docblock), `:2684` (the NFR catalog read)
**Issue:** The refusal message is the same for every `what`: "state-check reads no state file through a link at
its own path (state-roll and trace-render refuse it too)". For `NFR_CATALOG_REL` that parenthesis is false:
`grep -i nfr-catalog\|NFR_CATALOG` finds no read in state-roll.ts or trace-render.ts. The docblock says the same
("as state-roll and trace-render refuse the same paths"). IN-14's parity reason does not cover the NFR catalog, so a
linked NFR catalog that state-check read last round is now exit 2 for a reason the message misstates. The project's
no-fabrication rule applies to printed claims.
**Fix:** Word the parenthesis per path, for example name the runnable that reads it (state-roll for the board,
trace-render for the index). For the NFR catalog, either drop the parenthesis or give the rule its own reason ("a
link at a state file is never followed"), and correct the docblock to match.

### IN-16: the "not one path component" test proves step 1 for only two of its six names

**File:** `scripts/context-io.test.ts` (the case "WR-14: a name that is not one path component is refused by name before any filesystem call")
**Issue:** The test claims step 1 refuses each name before any filesystem call. Without step 1, `..`, `.` and `""`
would join to a real directory (the parent, or ctx itself). Step 3's assertSafeTask would then refuse them with the
same message and no remedy, so those three rows pass whether step 1 exists or not. On POSIX `a${sep}b` is the
string `a/b` again. Only `a/b` (the planted regular file) and the NUL name tell the two orders apart, so a mutation
that dropped the `.`, `..` or empty arms from the step 1 condition would stay green.
**Fix:** For `..`, `.` and `""`, plant something at the joined path that would get a different answer, for example
a regular file named by a test-only context root whose parent position is a FIFO. Or spy on `entryPresence` (or
`lstatSync`) and assert it is never called for these names. Drop the `a${sep}b` row on POSIX, or keep it only where
`sep !== "/"`.

---

_Reviewed: 2026-10-27T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
