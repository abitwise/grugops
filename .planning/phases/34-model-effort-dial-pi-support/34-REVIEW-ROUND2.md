---
phase: 34-model-effort-dial-pi-support
reviewed: 2026-10-09T12:30:09Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - install/canonical-path.test.ts
  - install/install-marker.js
  - install/install-marker.ts
  - install/install.js
  - install/install.test.ts
  - install/install.ts
  - install/ledger.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/record-truth.test.ts
  - install/user-file.js
  - install/user-file.ts
  - scripts/adapters-freshness.js
  - scripts/adapters-freshness.test.ts
  - scripts/adapters-freshness.ts
  - scripts/check-platform-shapes.js
  - scripts/check-platform-shapes.ts
  - scripts/generate-role-adapters.js
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-tiers.js
  - scripts/model-tiers.test.ts
  - scripts/model-tiers.ts
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 34: Code Review Report (gap round 2, plans 34-19..34-24)

**Reviewed:** 2026-10-09T12:30:09Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Scope: `git diff 620e419d..HEAD` over the 23 listed files. Where a change's correctness depends on code
outside the diff, that code was read too: `readInstallMarker` / `markerBinding` / `readKitHomeRecord`,
`writeMarker`'s unbound/unreadable arms, `isPruneProtected`, uninstall `isProtected` and its callers, and the
install closing banner. The committed `.js` files were not reviewed line by line: `npm run check:build-parity`
printed `ALL CHECKS PASSED` (73/73).

Runs made for this review (macOS, Node v26.11.0, short fresh TMPDIR; this says nothing about windows-latest,
per WIN-3):
- `npx vitest run` on canonical-path, path-spelling-census, mode-census, record-truth, ledger, model-tiers,
  generate-role-adapters and adapters-freshness: 8 files, 541 passed, 1 skipped.
- `npx vitest run install/install.test.ts -t "delivery"`: 57 passed. Row (f), the verifier's reproduction,
  ran and passed (it did not skip).
- Two scratch installs (each with its own `GRUGOPS_HOME` and `--target`), comparing HEAD with the base
  `620e419d` installer on a marker written in Windows spelling (WR-11). `~/.grugops` was not touched; its
  mtime is still 2026-10-07.

Round-1 findings targeted by this round:

| Round-1 ID | Verdict | Evidence |
|------------|---------|----------|
| WR-08 | **Closed** | `dialDisagreements` (install.ts:3456-3489) compares each adapter's rendered text and written text with `byAdapter[name]`, for both dials. Row (f) stages the exact round-1 shape (tiered effort, one role overridden to `inherit`, one adapter's `effort:` line dropped, distinct set unchanged). It ran at HEAD and was refused by name. Its red on the pre-plan installer is recorded in 34-20-SUMMARY (m1, and the pre-plan `status=0`); this review did not re-run that red. |
| WR-09 | **Closed, with a side effect** | One rule (`isRecordedAbsolute`, user-file.ts:349-351) is used by `installMarkerProblems` and `absoluteSpelling`. `isOwnLink` compares through `sameRecordedPath`. Census rules (e) and (f) are derived and count-asserted. The posix half of the change has a user-visible regression: see **WR-11**. |
| WR-10 | **Closed** | `CREATED_POINTERS` is derived from the ledger, and its count is asserted (record-truth.test.ts:332-340). Two capability-gated rows make a writable mode change and assert the `its file mode is …` left line (:388-413). Both rows ran green here. 34-22-SUMMARY m1b records that the deleting mutation turned only these rows red. |
| IN-07 | **Closed** | One `announcementShape` (install.ts:2934-2968) checks both dials with `isCount`, the list and the map. |

Items the executors flagged for triage:
- **34-21: `p === TARGET` in `isPruneProtected` / `isProtected`.** No evasion exists today; IN-12 gives the
  reasoning. Every operand is built by template from a forward-slash ledger path. Nothing enforces this,
  though, and one classification reason is inaccurate.
- **34-19: the freshness gate's per-adapter zero-config value check is unreachable.** Confirmed. See IN-09.
- **34-21: under posix, a recorded `C:/x` marker target is now refused.** Reproduced, and it is not a benign
  wording change. A marker written on Windows and carried to a POSIX checkout used to be replaced with a
  note. Now it blocks the marker write and every ask rule, and nothing clears it but a hand edit. See WR-11.
  The deferred-items.md (2) rationale ("no install on POSIX produces it") does not cover a marker carried
  from another host.

## Narrative Findings (AI reviewer)

## Warnings

### WR-11: A Windows-written marker on a POSIX checkout is now "not install's marker", so install never replaces it and writes no ask rules (WIN-1, a side effect of the WR-09 fix)

**File:** `install/install-marker.ts:1165-1178` (installMarkerProblems), `install/user-file.ts:349-351` (isRecordedAbsolute); consumers `install/install-marker.ts:284-291` (readInstallMarker), `install/install.ts:4429-4436` (writeMarker), and the ask-rules writer's unreadable arm

**Issue:** `installMarkerProblems` now asks the host flavor's `isAbsolute` about `grugopsHome`, `kitRoot`
and `target`. On POSIX, a marker install wrote on Windows (`"target": "C:/Users/dev/repo"`, all three fields
in `C:/` spelling) therefore fails the shape check, and `readInstallMarker` returns
`state: "unreadable", jsonObject: true`. Before this round the same marker passed the shape check, and
`markerBinding` returned `unbound / other-directory`. That is the arm the readMarker header comment designs
for "a `.grugops/` copied from another installed repository".

The two states lead to different outcomes. Reproduced with scratch installs, each with its own `GRUGOPS_HOME`
and `--target`. The fresh target held only `.grugops/install.json` with the Windows-spelled values.

| | base `620e419d` install.js | HEAD install.js |
|---|---|---|
| exit | 0 | 3 (`install INCOMPLETE — 2 item(s) need verification`) |
| marker | `note … written for another directory (C:/Users/dev/repo) … replaced by a marker for this directory`, then `created` | `skipped … left unchanged — it is a JSON object that is not install's marker` |
| `.claude/settings.json` ask rules | 55 written | none; the file does not exist (`no ask rule was added`) |
| Gemini ledger | updated | `verify … the Gemini settings ledger cannot be updated` |
| verify reason printed | none | `grugopsHome is not an absolute path, kitRoot is not an absolute path, target is not an absolute path` |

Every later run repeats this, because install never replaces an unreadable marker. The only remedy is a hand
edit. The reason printed is also false: the paths are absolute on the host that wrote them.

The case is realistic. `.grugops/` is the per-repo state directory, meant to be committed. The installer does
not gitignore `install.json`, and the repository's own `.gitignore` ignores only `**/.grugops/context/*/threads/`.
So a team with one Windows and one macOS/Linux member, or one WSL user on a `/mnt/c` checkout, reaches this
state on the first POSIX install after a Windows one.

The two directions are also asymmetric now. On win32, `path.win32.isAbsolute("/Users/x/repo")` is true, so a
macOS-written marker carried to Windows still reads `unbound / other-directory` and is replaced. Only the
Windows-to-POSIX direction is stuck. The kit-home record is also inconsistent with the marker:
`readKitHomeRecord` (install-marker.ts:1121-1135) applies no absoluteness rule to its own `grugopsHome`. A
`C:/x` kit-home record on POSIX therefore reads `unbound` and is replaced. The same field name gets two rules,
which goes against the "one absoluteness rule" claim in user-file.ts:337-347.

This is the WIN-1 class: one recorded path, read by two rules. The deferred-items.md (2) entry calls the
change intended and says "no install on POSIX produces it". That is true of POSIX installs, but it does not
cover a marker from another host, which the readMarker header names as a case to handle.

**Fix:** Keep the shape check separate from the binding. The shape question is whether this is a path some
install could have written, on any host. The binding question is whether it names this directory, and
`markerBinding` / `sameRecordedPath` already answer that. Both flavors are passed as data, so no platform
branch is introduced:
```ts
// user-file.ts
/** A recorded path some install could have written, on any host: absolute under either flavor. */
export function isRecordedPathShape(p: string): boolean {
  return path.win32.isAbsolute(p) || path.posix.isAbsolute(p);
}
// install-marker.ts installMarkerProblems
const isAbsolutePathValue = (v: unknown): boolean =>
  typeof v === "string" && v.trim() === v && v !== "" && isRecordedPathShape(v);
```
Keep `isRecordedAbsolute(p, flavor)` (host flavor) for `absoluteSpelling`, where the host's reading decides
how to spell. Then:
- add census rule (f)'s owner set for the new function;
- add a canonical-path row: posix, `target: "C:/x"` gives no problem and `markerBinding` gives
  `other-directory`;
- add an install.test.ts row: a Windows-spelled marker on POSIX is replaced with the `another directory`
  note, and the ask rules are written.

If the stricter reading is kept on purpose, record that decision in 34-CONTEXT.md. In that case, also have the
refusal say "written for another platform's path spelling" rather than "not an absolute path", and give the
remedy.

### WR-12: The closing banner says ask rules were written even when none were

**File:** `install/install.ts:5744-5747` (pre-existing line, outside the round-2 diff; reached by WR-11)

**Issue:** The `-- notes --` block always prints "This installer wrote Claude Code ask rules for the governed
command spellings into .claude/settings.json." In the WR-11 run, the same output says
`no ask rule was added to .claude/settings.json`, and `.claude/settings.json` does not exist. The line is not
conditioned on what `writeAskRules()` did. This is the DOC-1 class (a printed claim no code backs) and goes
against the project's "No fabrication" constraint, on the merge/deploy safety speed bump in particular. The
line predates this round (commit `e68c8258`). It is raised here because WR-11 makes it reachable in an
ordinary cross-host case. Any other ask-rules refusal (a malformed ledger, an unreadable settings file)
reaches it too.

**Fix:** Have `writeAskRules()` return or record whether it wrote or kept the rules. Print the sentence only
then. Otherwise print, for example, "No Claude Code ask rules were written by this run (see the verify line
above); the git host's protection is the only floor until they are." Add an install.test.ts assertion on the
banner for one ask-rules refusal row.

## Info

### IN-09: The freshness gate's per-adapter zero-config value check cannot be reached (executor flag confirmed)

**File:** `scripts/adapters-freshness.ts:603-609`
**Issue:** Before `checkAnnouncedMap` runs, two things already hold:
- the list check (:362-372 for model, the effort sibling at :455-465) requires the announced list to equal
  `ZERO_CONFIG_*` exactly;
- validator rule 8 (scripts/model-tiers.ts:957-965) forces the map's distinct values to equal that list.

Every map value is therefore already the zero-config value, and `offZero` is always empty. The branch is
labelled defence in depth, and no test reaches it. Its message wording is unexercised.
**Fix:** Keep it, and say in its comment that it is unreachable while rule 8 holds. Or drop it and point the
comment at rule 8.

### IN-10: `AnnouncedAssignment.aliases`, `.effort.levels` and both `overrides` are now read and never used

**File:** `install/install.ts:2900-2910`, `:3289-3301`, `:2925-2933` (announcementShape docstring)
**Issue:** With the set cross-checks removed, nothing in install.ts reads `announced.aliases`,
`announced.effort.levels` or either `overrides` (a search finds only the declarations and the assignment). The
`announcementShape` docstring says the shape is checked "so that nothing it trusts later (the counts, the
list, the per-adapter map) is used before its type is known". The list and `overrides` are not used later.
This is harmless, but the comment describes a use that no longer exists.
**Fix:** Drop the unused fields from `AnnouncedAssignment`, or narrow the docstring to the counts and the map
that are used.

### IN-11: Every install now prints two relay lines of about 717 characters

**File:** `scripts/model-tiers.ts:798-813` (assignmentLine), relayed verbatim by install.ts's resolution report
**Issue:** The announcement payload now carries the 17-entry `byAdapter` map. The installer relays both
announcement lines verbatim in its `render` report. A zero-config scratch install printed two 717-character
lines. Nothing breaks, but the user-facing report becomes much harder to read, and the length grows with the
role count.
**Fix:** Relay the summary fields (`roles`, `overrides`, list) and say that the per-adapter map was checked
member by member. Or wrap the map, one adapter per line.

### IN-12: Denylist `p === TARGET` triage (34-21 flag): no evasion today, but by convention only, and one classified reason is inaccurate

**File:** `install/install.ts:1974-1982` (isPruneProtected), `install/uninstall.ts:327-336` (isProtected),
`install/path-spelling-census.test.ts` CLASSIFIED_COMPARISONS
**Issue:** The 34-21 question was whether a backslash-joined path evades these denylists on Windows. Every
operand was read:
- install's one caller passes `${r.root}/${e.path}` (:2106);
- uninstall's callers pass `${TARGET}/${rel}` or `${TARGET}/${entry.path}` (:524, :651, :767/:843, :988,
  :1275, :1814, :1831, :2123);
- `isLedgerPath` (install-marker.ts:352-356) refuses `\` and `:` in a ledger path.

So both sides are always one spelling, and no `join()`-built operand reaches either function. Nothing
enforces this, though. Census rule (e) classifies by file:scope:operator only, so a future `join(TARGET, …)`
caller would pass the census and evade the denylist on Windows. Also, the install classification reason says
"a path this run composed from TARGET", but the kit-home root's operand is composed from `GRUGOPS_HOME`. That
is harmless, because both are canonical, but the reason is inaccurate.
**Fix:**
1. Correct the reason text.
2. Optionally spell both sides of the denylist comparisons: `canonicalPathSpelling(p)` against the canonical
   `TARGET`. This also makes uninstall's non-canonical `abspath` TARGET (uninstall.ts:214) irrelevant.

Alternatively, extend rule (e) to require that every call of `isPruneProtected` / `isProtected` passes a
template literal whose head is `TARGET` or `r.root`.

### IN-13: The `isRecordedAbsolute` docstring and table omit the win32 rooted, drive-less spelling, the row-319 shape

**File:** `install/user-file.ts:337-347`, `install/canonical-path.test.ts` ABS_RULE_TABLE (15 rows)
**Issue:** `path.win32.isAbsolute("/x")` and `path.win32.isAbsolute("\\x")` are both `true`. On Windows these
are relative to the current drive, the shape behind WINDOWS.md row 319. The docstring lists what is absolute
under win32 (UNC, `\\?\`, drive paths in either separator) and what is not (`C:x`), but does not mention this
case. The table has no row for it, so a reader could take it as refused. Nothing binds wrongly today: the
canonical spelling of `/x` never equals a drive-qualified real path, so the case fails closed as
`other-directory`. The behaviour is just unpinned.
**Fix:** Add `{ name: "win32 rooted drive-less", flavor: win, p: "/x", absolute: true }` and the `\x` twin
(size 17). Add one sentence to the docstring saying such a value passes the shape check and is then refused
by the binding.

## Round-1 cross-reference

| This review | Round-1 ID | Relation |
|-------------|------------|----------|
| — | WR-08 | Closed (row (f) run at HEAD; refused by name). |
| — | WR-09 | Closed; WR-11 is a new finding caused by its posix half. |
| — | WR-10 | Closed. |
| — | IN-07 | Closed. |
| WR-11 | WR-09 | New. WIN-1 class, created by the WR-09 fix (one host-flavor rule used for a cross-host shape question). |
| WR-12 | none | New here, but the line is pre-existing. DOC-1 class, reached through WR-11. |
| IN-09 | none | New (executor flag confirmed). |
| IN-10 | IN-07 / WR-08 | Left over from removing the set checks. |
| IN-11 | none | New, reporting side of the 34-19 grammar change. |
| IN-12 | none | Answer to the 34-21 triage flag. |
| IN-13 | WR-09 | WIN-1 class, test-coverage gap in the new table. |

Still open from round 1, deferred in 34-REVIEW-DISPOSITION.md and not raised again:
- **IN-06** (the install line shows the model but not the effort level). The round-2 change keeps
  `alias: writtenDials.alias` and still drops the effort.
- **IN-08** (`\\.\` prefix not folded).

Round 2 made neither worse.

Whether the isOwnLink host cases, the 34-22 pointer rows and the ledger fixtures behave on windows-latest is
`UNKNOWN - verify` until the human-pushed run (WINDOWS.md rows 319, 320, 321; D-21).

---

_Reviewed: 2026-10-09T12:30:09Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
