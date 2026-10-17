---
phase: 34-model-effort-dial-pi-support
reviewed: 2026-10-09T00:10:00Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - agent-factory/packaging/adapters.md
  - agent-factory/README.md
  - agent-factory/workflows/16-context-read-write.md
  - CHANGELOG.md
  - docs/audit/29-style-dispositions/34-16.md
  - docs/audit/29-style-dispositions/34-17.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/canonical-path.test.ts
  - install/install-marker.js
  - install/install-marker.ts
  - install/install.js
  - install/install.test.ts
  - install/install.ts
  - install/installer-dry-run.test.ts
  - install/installer-kit-home.test.ts
  - install/installer-marker-retention.test.ts
  - install/installer-paths.test-support.ts
  - install/installer-prune.test.ts
  - install/installer-user-edit.test.ts
  - install/installer-write-set.test.ts
  - install/ledger-provenance.test.ts
  - install/ledger.test.ts
  - install/marker-binding.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/README.md
  - install/record-truth.test.ts
  - install/settings-json-provenance.test.ts
  - install/uninstall-removal.test.ts
  - install/uninstall.js
  - install/uninstall.ts
  - install/user-file.js
  - install/user-file.ts
  - README.md
  - scripts/check-platform-shapes.js
  - scripts/check-platform-shapes.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 34: Code Review Report (gap round 1, plans 34-11..34-18)

**Reviewed:** 2026-10-09T00:10:00Z
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Scope: `git diff 64123a25..HEAD` over the 40 listed files, with the surrounding code read where needed.
The round-1 work covers four things: the WIN-1 single spelling (`canonicalPathSpelling`,
`sameRecordedPath`, `absoluteSpelling` in `install/user-file.ts`), the WIN-2 mode renderer and comparison
(`modeText`, `recordedModeOf`, `modeMatches`), the WR-03 effort arm of the announcement cross-check
(`oneAnnouncement`, `readRenderedDials`), and the DOC-1 corrections for WR-06 and WR-07.

What holds up:
- The spelling function is pure and takes the path flavor as a parameter. Both binding sites in
  install-marker.ts use `sameRecordedPath`.
- The decider hash in `hooks/hook-entry.ts` and `.js` matches the committed `scripts/context-io.js`
  (`848bb808…`).
- The `GRUGOPS_PROJECT_DIR` corrections leave no tracked sentence outside `docs/audit/` saying the
  installer sets the variable.
- `npx vitest run` passed 91/91 on canonical-path, path-spelling-census and mode-census (macOS; this
  says nothing about windows-latest, per WIN-3).

Three warnings:
1. The new effort level-set check does not catch every dropped `effort:` line, although its comments
   say it does. This is an RC-1 gap left inside the WR-03 fix.
2. The WIN-1 census checks only a hand-picked list of comparison sites. A second absoluteness rule over
   recorded paths sits outside that list (DOC-1 plus WIN-1).
3. The switch to a read-only "user mode edit" removed the only end-to-end coverage of the pointer-file
   mode check in uninstall (WIN-2 test coverage).

Finding IDs continue after the round-0 IDs (WR-08 onward, IN-06 onward). The disposition ledger drops
an earlier decision when an ID is reused, so reusing WR-01..WR-07 or IN-01..IN-05 would destroy recorded
dispositions.

## Narrative Findings (AI reviewer)

## Warnings

### WR-08: The effort level-set cross-check misses a dropped `effort:` line whenever the set does not change, but three comments say such a drop is refused

**File:** `install/install.ts:3325-3346` (readRenderedDials docstring), `install/install.ts:4931-4935` and `5005-5008` (call-site comments), `install/install.ts:5052-5068` (level-set check)

**Issue:** The model arm has an exactly-one floor: an adapter that loses its `model:` line is refused by
name. The effort arm's floor is "zero or one" (`efforts.length > 1`), and zero lines is read as
`inherit` (`ABSENT_EFFORT_LEVEL`). So a dropped `effort:` line is refused only if it changes the set of
distinct levels (`readLevels` against `announced.effort.levels`). The docstring says otherwise
("Reading the transformed text rather than the render is what lets a transform that drops or
duplicates either line be refused"), and so does the check's own comment ("an adapter that lost or
gained an `effort:` line between the generator and the write moves the read set, and is refused").

Configurations the dial accepts where a drop leaves the set unchanged:
- `models.effort.roles` sets two roles to `high` and the rest stay `inherit`. The announced set is
  `[high, inherit]`. If one adapter loses its `effort: high` line, the read set is still
  `[high, inherit]`, and the adapter is installed at session effort with no refusal.
- Preset `tiered` with one role overridden to `inherit`. The announced set is
  `[high, inherit, medium]`. Dropping any `high` or `medium` line keeps that set.

This is the RC-1 class: the effort arm got the model arm's set check but not its per-member floor. The
per-member level is read (`effortOf`) and then used only as a set. No test covers this case. The
`effortRefusalRows` (a)..(e) in `install/install.test.ts:3195-3236` all change either the announcement
or the line count.

**Fix:** Check per member, which the set check cannot do. Inside the member loop, read the dials off the
render as well as off the transformed text, and refuse any member where they differ:
```ts
const fromRender = readRenderedDials(text, label);            // renderedRead.text
const dials = readRenderedDials(transformed.text, label);
if (fromRender.ok && dials.ok && (fromRender.alias !== dials.alias || fromRender.effort !== dials.effort)) {
  refusals.push(`.claude/agents/ — ${label}: the transform changed the adapter's ` +
    `${fromRender.effort !== dials.effort ? "effort" : "model"} line ` +
    `(${fromRender.effort} -> ${dials.effort}); no adapter was installed ...`);
  memberRefused = true;
  continue;
}
```
Another option is for the generator to announce the per-role map rather than the distinct set. If
neither is done, rewrite the three comments to say that a drop is caught only when it moves the set.

### WR-09: The WIN-1 census checks a hand-picked list of comparison sites, and a second absoluteness rule over recorded paths sits outside it

**File:** `install/path-spelling-census.test.ts:214-236` (rule (e)), `:238-252` (rule (f)); `install/user-file.ts:298-299`; `install/install-marker.ts:1154-1155`

**Issue:** The brief (§2.2) asks for a census that derives every site writing or comparing a recorded
path. The census does derive the fold patterns: rules (a)..(d) walk the syntax tree for
`realpathSync.native`, backslash `.replace`, `split(sep).join("/")` and `toPosix`. The comparison side
is a fixed list:
- Rule (e) inspects two named functions (`markerBinding`, `readKitHomeRecord`) and only equalities with
  an identifier spelled `here`.
- Rule (f) inspects only `docAbspath` for a `startsWith`.

Even so, `user-file.ts:298-299` says "No other installer site may spell or compare a recorded path
another way; install/path-spelling-census.test.ts holds that."

The census misses a site that already exists. `isAbsoluteMarkerPath`
(`install-marker.ts:1154-1155`) is a second, hand-written absoluteness rule over the recorded `target`,
`grugopsHome` and `kitRoot`: `v.startsWith("/") || /^[A-Za-z]:[\\/]/.test(v)`. It disagrees with the
flavor's `isAbsolute`, which `absoluteSpelling` now uses:
- On win32, a target in native UNC spelling (`\\server\share\repo`) fails it, so the marker is reported
  "target is not an absolute path" and is unusable. Yet `sameRecordedPath` would bind that spelling,
  and the new comment at `user-file.ts:281-284` says a native-spelled record (the "same repository
  moved" remedy) now binds on Windows. For UNC paths it still does not. The canonical `//server/share`
  form that install itself writes does pass.
- On POSIX it accepts `C:/x`, which is a relative path there.

Neither case loses data: both fail closed or fail later. But the claim that the census "holds that" is
wrong, and the brief's "one authority" rule for WIN-1 (§2.3) is broken by a predicate the census
cannot see.

**Fix:**
1. Move the rule into user-file.ts beside the spelling and build it on the flavor:
   ```ts
   export function isRecordedAbsolute(v: unknown, flavor: PathFlavor = HOST_FLAVOR): boolean {
     return typeof v === "string" && v.trim() === v && v !== "" && flavor.isAbsolute(v);
   }
   ```
   Then call it from `installMarkerProblems`, and add win32/posix rows for it to canonical-path.test.ts.
2. Widen census rule (f) to every product `startsWith("/")` and every drive-letter regex literal, not
   only those in `docAbspath`.
3. Widen rule (e) to every equality or `startsWith` whose operand is a marker or ledger path field
   (`target`, `grugopsHome`, `kitRoot`, `boundTo`). Alternatively, reword the user-file.ts sentence to
   name exactly what the census enumerates.

### WR-10: The read-only "user mode edit" removed the only end-to-end test of the pointer-file mode check in uninstall

**File:** `install/record-truth.test.ts:333-335`, `:357-369`; product site `install/uninstall.ts:899-901` (`removeOwnedEmptyFile`)

**Issue:** The L1 rows now model the user's mode change with `userModeEdit`, which clears every write
bit. For the two pointer files (CLAUDE.md and `.github/copilot-instructions.md`), uninstall must
rewrite the file to take its block out before it reaches the recorded-mode comparison. A read-only file
makes that rewrite fail first, and the test comment at 333-335 says so. Each row still passes, because
the file stays and keeps its mode. But it now passes through the write-failure path (exit 3 accepted),
not through the check the row is named for ("a chmod-only edit survives uninstall"). Before round 1,
the `^ 0o100` flip left the file writable, so the block was removed and `recordMatches(...,
result.beforeMode)` in `removeOwnedEmptyFile` decided whether the file was kept.

The new direct unit test (record-truth.test.ts:336-354) tests `modeMatches` and `recordMatches` on
their own. It cannot see whether `removeOwnedEmptyFile` passes `result.beforeMode` (rather than `null`,
or a record with the mode stripped). A search of the installer tests for `beforeMode`, `userModeEdit`
and the pointer paths found no other case that reaches this comparison with a writable mode-changed
file. So a regression that deletes a user's blank, chmod-only CLAUDE.md would stay green on every OS.

**Fix:** Add a pointer-file case gated on the measured capability, using the pattern the IN-03 rows use:
```ts
const absent = hostCapabilityOrSkip("POSIX permission bits beyond read-only", "record-truth L1 pointer mode");
if (absent !== null) { console.log(skipLine(absent, "...")); return; }
chmodSync(p, 0o600); // mode-census: posix-bits   (keeps the write bit, so the block removal runs)
const u = uninstall(t);
expect(existsSync(p)).toBe(true);
expect(lines(u.stdout, "left").some((l) => pathText(l).includes("its file mode is 0600"))).toBe(true);
```
Add a WINDOWS.md row for the skip, and update `TAG_KIND_COUNTS["posix-bits"]` and the capability's
"asked only by" note in `scripts/check-platform-shapes.ts:679-682`.

## Info

### IN-06: The per-adapter install line names the model but not the effort level that was read

**File:** `install/install.ts:3627`, `:5021-5031`
**Issue:** `effortOf` is filled for every member, used only for the set check, and then dropped. The
`KitEntry` carries `alias` but no effort, so `materializeAdapter` prints `(KIT=…, model=<alias>)` and no
effort. This is a reporting arm of RC-1 that the effort dial did not get. It is not a refusal, and no
document claims the line shows effort.
**Fix:** Carry `effort: dials.effort` on the entry and print `effort=<level>` beside `model=`, or record
in a comment why it is left out.

### IN-07: The two dials' shape checks differ

**File:** `install/install.ts:3218-3233`
**Issue:** The comment says both dials are read "through one code path". That holds for the three named
conditions in `oneAnnouncement`. The shape checks still differ: the model arm uses
`typeof v.roles !== "number"`, and the effort arm uses `isCount`. Today the model-tiers readers already
refuse non-integer counts for both dials, so nothing is wrong, but the RC-1 comment overstates the
symmetry.
**Fix:** Use `isCount` for the model arm too, or narrow the comment to `oneAnnouncement`.

### IN-08: `canonicalPathSpelling` does not fold the `\\.\` device-namespace prefix

**File:** `install/user-file.ts:317-324`
**Issue:** Under `path.win32`, `\\.\C:\x` spells as `//./C:/x` (measured with the compiled module), so it
never matches `C:/x`. The doc comment lists only the `\\?\` and `\\?\UNC\` forms, so the code matches
the comment. This note records the edge so the canonical-path table can say whether it is intended. It
fails closed: the marker reads as another directory's.
**Fix:** Add a table row for `\\.\` that states the intended result. Fold the prefix only if a real
producer of that spelling is found.

## Known open item: WINDOWS.md row 319 (`link:D:\some\where` against `link:/some/where`)

From the source, the product's own link records are drive-qualified when they are written, so the
fixture's drive-less spelling does not occur in product records:
- Every link install makes uses an absolute source built by `join(GRUGOPS_SRC, …)`, and
  `GRUGOPS_SRC = resolve(…)` (install.ts:258-260). That gives a drive-qualified, backslash-separated
  path under win32.
- The two sites are `linkOrCopy` (`symlinkSync(src, dest)` then `linkRecord(src)`, install.ts:2477-2482)
  and the kit plan (`recordKitFile(e.dest, linkRecord(e.src))`, install.ts:3718).
- Uninstall compares that record with `readlinkSync(dest) === src` (`isOwnLink`, user-file.ts:534-540).

The failing rows in `install/ledger.test.ts:454` and `:638` link to `/some/where`. That path has no
drive letter, so Node on Windows qualifies it with the current drive when it creates the link, and
readlink returns the qualified form. The product never links to a drive-less target, so it does not
reach that difference.

Whether `readlinkSync` on windows-latest returns exactly the recorded `D:\…` string is
`UNKNOWN - verify`. That depends on Node/libuv removing the namespace prefix that `symlinkSync` adds,
and no windows-latest run has been cited that creates a product symlink and reads it back. If it does
not, `isOwnLink` answers false and the link is left in place, which fails closed rather than deleting
anything.

## Round-0 cross-reference

| This review | Round-0 ID | Relation |
|-------------|------------|----------|
| WR-08 | WR-03 (fixed, plan 34-15) | A gap left inside the WR-03 fix: the effort arm has the set check but not the per-member floor the model arm has (RC-1). |
| IN-06 | WR-03 (fixed) | Reporting arm of the same model/effort symmetry. |
| IN-07 | WR-03 (fixed) | The "one code path" claim of the WR-03 fix is broader than the code. |
| WR-09 | none | New, WIN-1 class (round-1 census scope). |
| WR-10 | none | New, WIN-2 class (round-1 test change). |
| IN-08 | none | New, WIN-1 class. |

No deferred round-0 finding is raised again. Round 1 made none of them worse:
- WR-04: the new effort refusals pass the module reader's `quoteValue` text through, and the level list
  is interpolated exactly as the pre-existing model alias list was.
- WR-01, WR-02, WR-05, IN-01..IN-05: not touched by this diff.

---

_Reviewed: 2026-10-09T00:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
