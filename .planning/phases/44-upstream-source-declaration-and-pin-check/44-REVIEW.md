---
phase: 44-upstream-source-declaration-and-pin-check
reviewed: 2026-11-25T16:25:13Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/upstream.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/workflows/20-upstream-sources.md
  - docs/audit/29-style-dispositions/44-07.md
  - docs/audit/29-style-dispositions/44-08.md
  - docs/audit/29-style-dispositions/44-13.md
  - install/README.md
  - scripts/flow-guidance-text.test.ts
  - scripts/generate-runnable-embeds.js
  - scripts/generate-runnable-embeds.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
  - scripts/runnable-ref/note.js
  - scripts/runnable-ref/note.ts
  - scripts/runnable-ref/state-check.js
  - scripts/runnable-ref/state-check.ts
  - scripts/runnable-ref/state-roll.js
  - scripts/runnable-ref/state-roll.ts
  - scripts/runnable-ref/trace-render.js
  - scripts/runnable-ref/trace-render.ts
  - scripts/runnable-ref/upstream-fixture.test-support.ts
  - scripts/runnable-ref/upstream.js
  - scripts/runnable-ref/upstream.test.ts
  - scripts/runnable-ref/upstream.ts
  - scripts/upstream-model.js
  - scripts/upstream-model.test.ts
  - scripts/upstream-model.ts
  - scripts/validate.test.ts
findings:
  critical: 0
  warning: 0
  info: 5
  total: 5
status: issues_found
---

# Phase 44: Code Review Report

**Reviewed:** 2026-11-25T16:25:13Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

This is an incremental re-review of gap-closure round 1 (plans 44-09 to 44-14, plus the orchestrator fixes 4920f2e5 and d3a0869d). It covers the changes since `d0805332`. I read the hand-written part of `scripts/runnable-ref/upstream.ts` in full, and the changed parts of `scripts/upstream-model.ts`, the generator row, the fixture support and the new test cases. I checked the contract, Workflow 20, Workflow 17 step 4, the config row and the install README against the code.

On the compiled files: `tsc` into a scratch directory produced byte-identical copies of all eight committed `.js` files in scope, and `runnable-embeds-freshness.js` reports all 7 targets fresh. `scripts/upstream-model.test.ts` passes (207 tests). I did not run the full suite.

Re-check of the findings recorded as fixed:
- **CR-01:** fixed. `isManifestPath` is now an ASCII allowlist (`upstream-model.ts:360-363`), and `fenceLines` refuses any argument outside its grammar (`:501-513`). The BEGIN line can carry only one ` blob=`.
- **CR-02:** fixed. Manifest reasons name the column and line, and the successor is held to the ID grammar (`upstream-model.ts:407-432`). The sweep and `read` name a row by its ID (`upstream.ts:1084,1257`). Workflows 20 and 17 use the fixed `upstream <source>: <cause>` reason.
- **WR-01:** fixed. The promisor/`extensions.partialclone` guard (`upstream.ts:1038-1057`) runs before the first object-reading call (`:1059`).
- **WR-03:** fixed as a report. `check` prints `runnable-version-skew` lines (`upstream.ts:1148-1186`). See IN-10 for the kit-side gap.
- **WR-04, IN-02:** fixed in the contract (`upstream.md:72-85,193-195`). See IN-09 for one remaining imprecision.
- **IN-03:** fixed (header line 15).
- **IN-04:** fixed (`upstream.ts:1013-1019`).
- **IN-06:** fixed (`upstream.test.ts:596-602,684`).

None of these fixes regressed. Of the four findings still open:
- **IN-05** and **IN-07** still stand in `upstream.ts`, so I re-report them under their original ids.
- **WR-02** and **IN-01** sit in `scripts/trace-model.ts` and `scripts/board-model.ts`, which are outside this review's scope. I did not re-check them, and they remain open in the ledger.

The three new items are info level:
- the git-message redaction matches substrings, so it can garble messages;
- the `--manifest` refusal branches can never be reached, and the header still lists them as live;
- the kit text gives no action for the new skew line.

## Info

### IN-05: `owns.prefixes` is validated but never applied to reads or refs

**File:** `scripts/runnable-ref/upstream.ts:1248-1254`
**Issue:** This is unchanged since the previous review. `readReport` looks up `target` in the manifest without checking that its prefix is one of the source's `owns.prefixes`. So `read design Q-1` serves a `Q-1` row even when another source declares `Q`. The hand-written part of the file never reads `owns`. The contract (`upstream.md:43-45`) still describes prefix ownership as if it had an effect.
**Fix:** Before the manifest lookup, refuse an ID whose prefix the source does not own, for example `refused <source> <ID>: <ID> has a prefix <source> does not own`. Alternatively, record in the contract that phase 45 (TRC-03) applies ownership.

### IN-07: Large listed-path sweeps fail with misleading reasons

**File:** `scripts/runnable-ref/upstream.ts:946-955,1080`
**Issue:** This is unchanged since the previous review. `modesAtPin` still passes every listed path in one `ls-tree -r` argv. A listed directory with a large subtree goes past the 256 KiB `maxBuffer` (`:886`), and the reason then reads `git ls-tree printed more than 262144 bytes`, not that the file listed for the ID is not a regular file. On Windows, a long manifest can also go past the command-line limit. Both cases fail closed, but they name the wrong cause.
**Fix:** Drop `-r` for the sweep, since `ls-tree --full-tree <commit> -- <path>` already reaches a nested path and does not expand a directory. Also pass the paths in batches.

### IN-08: The git-message redaction replaces substrings, so a short listed path garbles the rest of git's line

**File:** `scripts/runnable-ref/upstream.ts:911-922`
**Issue:** `gitComplaint` builds one regex alternation from the raw pathspecs and replaces every match anywhere in the line, with no boundary. The path grammar accepts one-character and common-word paths (`x`, `a`, `md`). With a listed path `a`, the line `fatal: path 'a' does not exist in 'abc123'` becomes `f<listed path>t<listed path>l: p<listed path>th '<listed path>' does not exist in '<listed path>bc123'`, which I reproduced with the same regex. The header (`:905-906`) promises that "the rest of git's line stays, so the human still learns which call failed and why". For such a path that promise breaks, and an object id in the line can be corrupted. This fails safe: no path text leaks, but the message loses its diagnosis.
**Fix:** Match a path only where it is not part of a longer path-grammar token. Use lookarounds on the path alphabet:
```ts
return line.replace(new RegExp(`(?<![A-Za-z0-9._/-])(?:${alternation})(?![A-Za-z0-9._/-])`, "g"), () => "<listed path>");
```
Then add a case with a one-letter listed path to the `git message` describe block.

### IN-09: The `--manifest` refusal branches can never be reached, and the entry-manifest rule omits the blob-mismatch precedence

**File:** `scripts/runnable-ref/upstream.ts:45-52,1259-1279`, `agent-factory/contracts/upstream.md:78-85`
**Issue:** For `--manifest`, `path` is `source.entry`. `gitAnswers` has already refused a non-regular entry (`:1075-1077`) and has already decoded it through `blobText` (`:1078`), which turns an oversize, NUL-bearing or non-UTF-8 manifest into `SourceUnknown`. So the four `refused … the entry manifest …` branches at `:1260-1279` are dead for `--manifest`. Plan 44-14 added a caveat for this to the contract (`upstream.md:193-195`). The file's own header (`:45-52`) still lists `<L>` = `the entry manifest` under exit 1 with no caveat, so the header and the contract now disagree.

Separately, `upstream.md:78-85` says that a manifest that is not a regular file, is too large, holds a NUL or is not UTF-8 "makes the source `UNKNOWN - verify` at exit 2, in `check` and in `read`". That holds only when the blob at the pin equals `entry_blob`. Otherwise `gitAnswers` skips those checks, and the result is a `blob-mismatch` drift: exit 1 in `check`, and a `refused` line in `read`. One example is an entry that became a directory or a symbolic link in a new commit while `entry_blob` still names the old file.
**Fix:** Copy the contract's caveat into the header comment. Either drop the dead branches for `--manifest` or comment that they guard only the ID case. In `upstream.md:78-80`, add: "when the blob of `entry` at the pin equals `entry_blob`; otherwise `check` reports `blob-mismatch` first."

### IN-10: No kit text says what to do with a `runnable-version-skew` line, and the contract row misdescribes the program it names

**File:** `agent-factory/workflows/20-upstream-sources.md:23-29`, `agent-factory/workflows/17-task-claim.md:87`, `agent-factory/contracts/upstream.md:139`
**Issue:** WR-03's harm was that an older `trace-render.js` silently drops every `upstream:` ref that Workflow 20 step 10 asks for. Plan 44-11 makes `check` print a skew line, but neither Workflow 20 nor Workflow 17 (nor the Orchestrator role) mentions `runnable-version-skew` (grep finds nothing). Step 2 lists the line to the human. No step says that citations made meanwhile will not reach the trace, or that the remedy is a reinstall before citing. So the Orchestrator keeps producing notes whose refs vanish from the trace.

The contract row also opens with "A program built with upstream.js sits beside it". The program the line names is one that was not built with upstream.js. The rest of the row and the README (`install/README.md:548-550`, "built apart from it") say the opposite.
**Fix:** Add one line to Workflow 20, after step 2 or as a stop condition: "On a `runnable-version-skew` line, tell the human that `upstream:` citations may not reach the trace until the six programs are reinstalled together." Reword the contract row to "A program of the same set, built apart from upstream.js, sits beside it: …".

---

_Reviewed: 2026-11-25T16:25:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
