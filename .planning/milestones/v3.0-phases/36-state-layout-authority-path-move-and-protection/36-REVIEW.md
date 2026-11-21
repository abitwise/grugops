---
phase: 36-state-layout-authority-path-move-and-protection
reviewed: 2026-10-21T12:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - install/state-layout.ts
  - install/install.ts
  - install/uninstall.ts
  - install/kit-source.ts
  - scripts/state-path-scan.ts
  - scripts/check-state-paths.ts
  - scripts/board-read.ts
  - scripts/board-model.ts
  - scripts/board-dashboard.ts
  - scripts/board-corpus.ts
  - scripts/validate-agent-factory.ts
  - scripts/trace-render.ts
  - scripts/trace-freshness.ts
  - scripts/kit-model.ts
  - scripts/generate-role-adapters.ts
  - scripts/check-banned-claims.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-platform-shapes.ts
  - scripts/posix-path.ts
  - hooks/hook-entry.ts
  - install/state-layout.test.ts
  - scripts/state-path-scan.test.ts
  - scripts/check-state-paths.test.ts
  - install/pre-v3-layout.test.ts
  - install/installer-paths.test-support.ts
  - install/closing-claims.test.ts
  - scripts/adapter-byte-baseline.test.ts
  - docs/pre-v3-state-layout.md
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 36: Code Review Report

**Reviewed:** 2026-10-21T12:00:00Z
**Depth:** standard (diff 3d684620..HEAD)
**Files Reviewed:** 28
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I found no data-loss path. `stateLayout()` lstat's each board once. It treats only ENOENT and ENOTDIR as absent, and every other code is unreadable (fail closed). The plain-install refusal sits after the self-checkout and kit-home guards. It runs before the `--migrate` branch, `INSTALL_REFUSAL`, the run banner, `copyKit` and every write. `--check`, `--update` and `--prune-old-kit` exit before it, and DRY_RUN is not exempt. `isProtected` and `isPruneProtected` both iterate `STATE_ROOTS` with an exact-or-`<root>/` prefix test, so `memory-bank-notes/` and `docs2/` are not matched. Deleting the uninstall `isSeededState` is behavior-neutral because `memory-bank` is now in `STATE_ROOTS`. In `seedState`, skipping the state root on pre-v3 and unreadable layouts keeps `--migrate` from writing a second board. The `kit-model.js` hash in `hooks/hook-entry.ts` matches the committed file (sha256 `308e701c…`).

The defects are in the gate and in the messages:
- The old-spelling gate misses real spellings of the pre-v3 root. Two such sites exist on the live tree.
- The wired gate scans relative to the cwd, not the repository root. From a subdirectory it passes vacuously.
- The uninstall banner now says `.grugops/` is never touched, then reports removing the marker inside it.
- The refusal's remedy leads nowhere on the most common upgrade path. D-06 defers the fix, but nothing pins the gap.

## Warnings

### WR-01: The old-spelling gate does not count the pre-v3 root as a final path segment, or after an underscore

**File:** `scripts/state-path-scan.ts:106-108`
**Issue:** The `slash` pattern needs a separator *after* the root name. The `segment` pattern needs a quote immediately on *both* sides. The `backslash` pattern needs a trailing backslash. So any spelling that names the directory itself as the last segment is never counted. I measured this with `countSpellings` against the committed `.js`. The root name is written `P` below. All of these report `{slash:0, segment:0, backslash:0}`:
- `` existsSync(`${root}/P`) ``
- `join(root, "./P")`
- `resolve(root, "../P")`
- `root + "/P"`
- `C:\repo\P` and the escaped form `"C:\\repo\\P"`
- `cd ./P`

These are the spellings code uses when it acts on the directory itself, for example `rmSync`, `existsSync`, or the protected-root checks this phase rewrote.

Separately, the lookbehind class `[A-Za-z0-9_.\-]` contains `_`. So the Markdown italic `_P/board.md_` is not counted either, while `*P/board.md*` is.

There are live misses on the tree today, which the gate passes:
- `scripts/check-platform-shapes.ts:581` spells `C:\…\repo^Ax\P` (the root name as the final segment).
- `scripts/check-platform-shapes.ts:727` spells `repo\u0001x/P` (the root name as the final segment).

Both are comments, and they also no longer match the code at line 672, which now creates `d\u0001x/memory-bank/plans`. The header's claim that "no file … spells the pre-v3 state root" is therefore not what the gate checks.
**Fix:** Count the root name as a whole path segment on either side of a separator, not only before one. For example, add a `tail` spelling:
```ts
// the root name ending a path: preceded by a separator, followed by a quote, whitespace, ) or end of text
tail: new RegExp(`(?<=[/\\\\])(?<!${parent}[/\\\\])(?<!${parent}\\\\\\\\)${old}(?=["'\`\\s)]|$)`, "gm"),
```
Also drop `_` from the slash and backslash lookbehind classes, or special-case a leading `_` that is itself preceded by whitespace. Add a plant for each new shape to `state-path-scan.test.ts`. Then fix the two `check-platform-shapes.ts` comments at their source, or record why the run they cite is history.

### WR-02: `check-state-paths` scans the cwd's subtree, not the repository, and passes vacuously from a subdirectory

**File:** `scripts/check-state-paths.ts:225` (`evaluate(process.cwd())`), `scripts/check-state-paths.ts:182-184`
**Issue:** `evaluate` hands `process.cwd()` straight to `scanTracked`, which runs `git -C <cwd> ls-files`. git then lists only the files under the cwd, as paths relative to the cwd. The allow-list globs are repository-relative, so they no longer line up.

Reproduced: running `node ../scripts/check-state-paths.js` from `agent-factory/` printed `PASS: 92 file(s) scanned … 0 site(s) inside it, in 6 entr(ies)` and `ALL CHECKS PASSED`. All six allow-list entries matched nothing and held nothing. From `install/`, the authority's own sites would show as `state-layout.ts`, so they would fall *outside* the allow-list.

`state-path-scan.ts` resolves `git rev-parse --show-toplevel` first (`repositoryRoot`, line 264). The wired gate dropped that step. `deadEntries` exists, but only the test calls it, so the CLI never refuses a run where the whole allow-list is dead. CI runs from the repository root today, so CI is green for the right reason. But `npm run check:state-paths` from a subdirectory, or a future CI `working-directory:`, would give a vacuous pass.
**Fix:** Resolve the top level in `main()` before `evaluate`. Export `repositoryRoot` from `state-path-scan.ts`:
```ts
function main(): void {
  let result: GateResult;
  try {
    result = evaluate(repositoryRoot(process.cwd()));
  } catch (err) { couldNotRun(err instanceof Error ? err.message : String(err)); }
  const dead = deadEntries(result);
  if (dead.length > 0) couldNotRun(`allow-list entries match no file or hold no site: ${dead.map((e) => e.entry.glob).join(", ")}`);
  ...
}
```
Add a CLI case that spawns the gate with a subdirectory of a scratch repository as cwd.

### WR-03: The uninstall "preserved (never touched)" banner now lists `.grugops/`, then reports removing the marker inside it

**File:** `install/uninstall.ts:2881-2885`
**Issue:** The banner line used to be hand-typed. It deliberately left `.grugops/` off the "never touched" list and named it on its own line ("`.grugops/` (seeded state) is kept; its install.json marker is reported on the next line"). It now prints `STATE_ROOTS.map(...)`, which includes `.grugops`. The closing therefore reads `-- preserved (never touched) --  agent-factory/  plans/  .planning/  .grugops/  docs/  src/  memory-bank/ …`, and two lines later it reports `.grugops/install.json` removed (`markerOutcomeLine`).

That is a published claim the same run contradicts. It is the closing-claims class this repository already tests (`closing-claims.test.ts`), and no test pins this banner. On a v3 install the banner also lists `plans/`, which is absent there. That part is harmless but noisy.
**Fix:** Print the protected roots without `.grugops`. Keep the dedicated `.grugops/` line as the one statement about that root:
```ts
console.log(`  ${STATE_ROOTS.filter((d) => d !== ".grugops").map((d) => `${d}/`).join("  ")}  the shared kit at $GRUGOPS_HOME,`);
```
Add a closing-claims case: after an uninstall that removes the marker, no "never touched" line names `.grugops/`.

### WR-04: The refusal's printed remedy is a no-op on a two-root (v2.x) pre-v3 repository, and no test pins the gap

**File:** `install/install.ts:3010-3029` (refusal), `install/install.ts:6542-6585` (`layout.isMigrated` arm)
**Issue:** Every repository installed by v2.x is on the two-root layout with its board at the pre-v3 path. On that repository:
1. A plain install refuses with exit 1 and says ``Run `<cmd> --migrate` to migrate it.``
2. `--migrate` reaches `detectOldLayout().isMigrated`, runs only the handoffs backup, prints "This repo is already migrated to the two-root layout." and "Nothing to do.", and exits 0.
3. The next plain install refuses again.

The user cannot re-run install, for example to add an agent or refresh adapters, and the doctor keeps telling them to run the command that just said "Nothing to do". `docs/pre-v3-state-layout.md:62` documents this, and D-06 assigns the fix to Phase 38. But `pre-v3-layout.test.ts` covers `--migrate` only on the v1.0 vendored-kit fixture (`oldLayoutPreV3`). No case covers the two-root arm, so nothing turns red if Phase 38 leaves the short-circuit in place. The "Nothing to do." sentence is also a false closing on a repository whose doctor WARNs pre-v3.
**Fix:** Until Phase 38 lands, make the `isMigrated` arm say what it did not do on a pre-v3 layout. Do not say "Nothing to do." For example:
```ts
if (stateLayout() === "pre-v3") console.log(`Your planning state is still under ${LEGACY_STATE_ROOT_REL}/; this build does not move it yet (the v3 migrate step lands in a later v3.0 phase).`);
else if (!handoffsBackedUp) console.log("Nothing to do.");
```
Add a pre-v3-layout case on a two-root installed repository plus `makePreV3StateFixture`. It should assert the current output, and carry a named `it.todo`/`it.fails` row that Phase 38 must flip (D-06: "must make sure the existing short-circuit does not swallow the v3 move").

## Info

### IN-01: The doctor FAILs "board missing" when the pre-v3 root is unreadable, against D-07's never-FAIL rule

**File:** `install/install.ts:2441-2477`
**Issue:** `stateLayout()` checks the v3 board first. If it is absent and the pre-v3 board path returns EACCES, the answer is `{ unreadable }`. The layout line WARNs "NO VERDICT", but the board ref uses `BOARD_REL` (`layout === "pre-v3"` is false), so the board stat FAILs as absent. The doctor then says both "no verdict on the layout" and "the board is missing", and exits non-zero, although the user's board may be at the unreadable pre-v3 path.
**Fix:** When `layout` is `{ unreadable }`, make the board entry a WARN without a verdict, or skip it, instead of a FAIL. Alternatively, record in the layout WARN that the board check below concerns only the v3 path.

### IN-02: trace-render's message names `TRACEABILITY_REL` whatever directory it actually wrote, and the file name is spelled twice

**File:** `scripts/trace-render.ts:184,194`; `scripts/trace-freshness.ts:148,165`
**Issue:** `renderTraceability` writes `join(plansRoot, "traceability.md")`, where `plansRoot` can come from argv. The CLI still prints `rendered memory-bank/plans/traceability.md`. trace-freshness passes its temp mirror as `plansRoot`, so that message names a file the run did not write. The leaf name `"traceability.md"` is also hand-typed in three places beside `TRACEABILITY_REL`, which is the drift `state-layout.ts` says it exists to prevent.
**Fix:** Derive the leaf with `basename(TRACEABILITY_REL)`, and print the path actually written (`join(plansRoot, basename(TRACEABILITY_REL))`).

### IN-03: The STATE_ROOT_COUNT "discriminates" case tests `===`, not the code

**File:** `install/state-layout.test.ts:58-63`
**Issue:** `holdsTheCount(dropped)` and `holdsTheCount(added)` only confirm that 6 and 8 are not equal to 7. They would pass for any pin, so they add no evidence beyond line 54. The real protection evidence is in the behavioral cases in `installer-prune.test.ts:507` and `uninstall-removal.test.ts:644`.
**Fix:** Delete the case, or replace it with a mutation probe that runs the protection predicate over a list with one root dropped.

### IN-04: The scan counts a tracked dangling symlink as "not on disk" and never scans the link text

**File:** `scripts/state-path-scan.ts:228-236`
**Issue:** `readFileSync` follows links. A tracked link whose target is missing returns ENOENT and lands in `notOnDisk`, and the run still PASSes. A link whose target text spells the pre-v3 root (for example `docs/board.md -> ../<root>/board.md`) is never counted, because only the link's own path goes through `legacyPathHit`. No tracked link exists today (`git ls-files -s` shows no mode 120000).
**Fix:** `lstat` first. For a symbolic link, count `readlinkSync(path)` as text. Report "not on disk" only when the `lstat` itself returns ENOENT.

---

_Reviewed: 2026-10-21T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
