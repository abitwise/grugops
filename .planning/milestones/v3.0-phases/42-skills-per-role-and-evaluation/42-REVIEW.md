---
phase: 42-skills-per-role-and-evaluation
reviewed: 2026-11-17T12:28:32Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - docs/audit/29-style-dispositions/42-03.md
  - docs/audit/29-style-dispositions/42-06.md
  - install/README.md
  - install/agents-record.test.ts
  - install/claude-version-doctor.test.ts
  - install/host-tools.js
  - install/host-tools.ts
  - install/install.js
  - install/install.ts
  - install/installer-paths.test-support.ts
  - install/path-spelling-census.test.ts
  - install/skills-doctor.test.ts
  - scripts/skills-kit-text.test.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 42: Code Review Report (incremental re-review after the review fixes)

**Reviewed:** 2026-11-17T12:28:32Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Scope: `git diff 149e2aac..HEAD` of the 13 listed files, read against the surrounding code. These are the review-fix
commits d705749f (CR-01), 1b4cbc57 (CR-02), a6e05b94 (WR-01), da717415 (WR-02), 59697a77 (WR-03) and 8a58d8e8 (WR-04).
They change `install/install.ts`, `install/host-tools.ts`, their committed `.js` output and their tests. The scope also
includes the Nyquist test added to `scripts/skills-kit-text.test.ts` and the two style-disposition docs, where 17 rows
moved from `pending (named human)` to `accepted by Olger (42-UAT test 3, 2026-11-17)`.

Verification run for this review:
- `npm run freshness` passes: 92 committed `.js` files match a rebuild.
- `install/agents-record.test.ts` and `install/claude-version-doctor.test.ts` pass: 234 of 234.
- `install/skills-doctor.test.ts`, `install/path-spelling-census.test.ts` and `scripts/skills-kit-text.test.ts` pass with
  the default TMPDIR. One skills-doctor case fails when TMPDIR is a long path (WR-04).
- I reproduced WR-01, WR-02 and WR-03 below by running the committed `install/install.js --check` in a scratch target
  with a scratch HOME and PATH.

The six fixes do what they say for the cases they target:
- **CR-01:** the PATH walk skips empty and relative entries, and the spawn uses the absolute path with the home folder
  as cwd. The `.`, empty and `../t` cases are real regressions: the row's target is named `t`, so `../t` does point at
  the planted file.
- **CR-02:** every declared-skills line and every version `notChecked` line passes through `printableLine`.
- **WR-01:** `found` now leaves out the default user folders when an override is set.
- **WR-03:** strays are reported one by one, and the remaining skills are still checked.
- **WR-04:** a Windows shim gets its own reason. This was unit-tested through `path.win32` only, and the Windows live
  run (UAT test 6) is deferred.

The audit-doc rows are backed by 42-UAT.md test 3, which records the typed-name ruling "accept all 17, Olger".

New defects:
1. The WR-02 link-following containment covers only the folder named in the manifest. The default
   `<installPath>/skills` folder and each per-skill folder can still link out of the plugin and give `ok ... found`.
   The same layout through a manifest path gives `not checked`.
2. The new `realPathThroughExisting` refusal turns an ENOTDIR or EACCES into a false reason, which says the path is
   "absolute, has a .. segment or leaves the plugin folder".
3. CR-01 made the version probe's cwd the home folder without checking that the folder exists. A missing HOME now
   prints "`claude --version` could not be run (ENOENT)".
4. One CR-02 regression test depends on the length of TMPDIR.

No critical issues were found. The Info findings from the earlier review (IN-01 to IN-06) were out of the fix scope and
remain open. They are not repeated here.

## Warnings

### WR-01: The link-following containment (review WR-02 fix) skips the default `skills/` folder and per-skill links, so the same escape still gives `found`

**File:** `install/install.ts:2626` (default folder pushed with no containment test), `install/install.ts:2547-2554` (`skillFileIn` follows a per-skill link), `install/install.ts:2683-2690` (the only real-path test)
**Issue:** `folderInsidePlugin` now compares real paths, but it is called only for `skills` paths named in a manifest
(`manifestSkillFolders`). In `claudePluginSkillFolders`, `join(installPath, "skills")` is pushed with no containment test
at all. `skillFileIn` then stats `<folder>/<skill>/SKILL.md` and follows every link, including a `<skill>` folder that
is a link. Reproduced against the committed `install.js`:
- Case A: `<installPath>/skills` is a link to `<HOME>/outside`, which holds `ui-ux-pro-max/SKILL.md`. The output is
  `ok  skill ui-ux-pro-max (designer) found for Claude Code`.
- Case B: the manifest has `{"skills":"real"}`, `real/` is a real folder inside the plugin, and `real/ui-ux-pro-max` is
  a link out of the plugin. The output is again `ok ... found for Claude Code`.

The layout that WR-02's new test pins (`skills: "lnk"`, where `lnk` links out) gives `not checked`. So the same
situation, a skill whose bytes live outside the plugin, gets opposite answers depending on which path component is the
link. The doc comments at `install.ts:2639-2640` and `2683-2684` say the containment is decided "links followed", and
T-42-05 is cited as mitigated. Both claims hold for one of three link points only.
**Fix:** decide containment in one place, on the final stat path, for every plugin folder:
```ts
// in claudePluginSkillFolders, keep installPath with each folder:
folders.push({ base: installPath, folder: join(installPath, "skills") });
// ...and in the lookup, instead of skillFileIn(folder, skill):
function pluginSkillFileIn(base: string, folder: string, skill: string): boolean {
  if (!KEBAB_NAME.test(skill)) return false;
  const file = join(folder, skill, "SKILL.md");
  const realBase = realPathThroughExisting(base);
  const realFile = realPathThroughExisting(file);
  if (realBase === null || realFile === null) return false;
  const r = relative(realBase, realFile);
  if (r === ".." || r.startsWith(".." + sep) || isAbsolute(r)) return false; // or report `not checked`
  return statSync(file, { throwIfNoEntry: false })?.isFile() === true;
}
```
Another option is to state plainly, in the comments and in T-42-05, that only the manifest folder is contained. Add
tests for case A and case B. If the decision is that Claude Code follows these links and `found` is correct, then the
manifest-link case should be `found` too, and the WR-02 change should be reverted to keep the rule consistent.

### WR-02: A `skills` path whose real location cannot be read is refused with a false reason ("absolute, has a .. segment or leaves the plugin folder")

**File:** `install/install.ts:2685-2687` (null from `realPathThroughExisting`), `install/install.ts:2662` (the message)
**Issue:** `realPathThroughExisting` returns null for any `lstat` error other than ENOENT, such as ENOTDIR or EACCES,
and for a dangling link. `folderInsidePlugin` maps that null to the same refusal as an escape. The message then states
three things, and in this case none of them is true. Reproduced: a manifest with `{"skills":"README.md/skills"}`, where
`README.md` is a regular file, prints:
```
advisory  skill ui-ux-pro-max (designer) not checked for Claude Code: the manifest of plugin p@m names the skills path "README.md/skills", which is absolute, has a .. segment or leaves the plugin folder (links followed); optional, see docs/skills.md
```
The path is relative, has no `..` segment and stays inside the plugin. Failing closed is right, but the reason is
fabricated diagnostic text, the same class as the earlier review's WR-03 and WR-04, which the project's no-fabrication
rule covers.
**Fix:** return a reason from `folderInsidePlugin` instead of a bare null, and word the unreadable case on its own:
```ts
type Inside = { ok: string } | { refused: "shape" | "escapes" | "unreadable" };
// ...
if (realBase === null || realAbs === null) return { refused: "unreadable" };
// manifestSkillFolders:
// "unreadable" -> `... names the skills path ${JSON.stringify(p)}, whose real location could not be read (a dangling link, a file in the path, or no permission)`
```
Add a test with the file-in-path layout above and with a dangling link.

### WR-03: CR-01 runs `claude --version` with the home folder as cwd and does not check that the folder exists; a missing HOME now reads "could not be run (ENOENT)"

**File:** `install/install.ts:2841-2856` (spawn with `cwd: home`, the error mapping), `install/install.ts:3535-3541` (`homedir()` passed in)
**Issue:** `spawnSync` fails with ENOENT when `cwd` does not exist. Since d705749f, the doctor prints
"`claude --version` could not be run (ENOENT)" whenever `homedir()` names a folder that is not there. This happens with
system users whose HOME is `/nonexistent`, some CI and container images, and a HOME override that points nowhere. The
probe then never runs, although `claude` was found and is runnable. The line points at `claude`, but the real cause is
the cwd the doctor chose. Reproduced with `HOME=<scratch>/gone` and a working `claude` on an absolute PATH entry:
`the Claude Code version was not checked: \`claude --version\` could not be run (ENOENT)`. Before the fix this probe ran
in `process.cwd()` and printed the version.
**Fix:** choose a cwd that exists and is not the target. The folder that holds the found program is a good choice: it
is an absolute PATH entry the user trusts, and it always exists:
```ts
const cwd = dirname(onPath.path);
const r = spawnSync(onPath.path, ["--version"], { cwd, /* ...same bounds... */ });
```
Alternatively, stat `home` first and print "the home folder ${home} does not exist, so `claude --version` was not run".
Update the README sentence ("runs that file by its full path from your home folder") and the end-to-end cwd test to
match whichever choice is made.

### WR-04: The CR-02 reader-stderr test depends on the length of TMPDIR: it fails when the scratch path is long

**File:** `install/skills-doctor.test.ts:606-615`; truncation at `install/install.ts:2492`
**Issue:** `readDeclaredSkills` cuts the reader's first stderr line at 300 characters. The reader's message names the
kit path twice before the file name (`the roles of <kit> could not be read (ENOENT: ..., open '<kit>/agent-factory/roles/bad<ESC>]0;pwned<BEL>.md')`),
so the role-file name falls past character 300 once the scratch root is longer than about 100 characters. The assertion
`expect(notChecked[0]).toContain("]0;pwned")` then fails. Observed: the test passes with TMPDIR unset (`/tmp`) and fails
with TMPDIR set to a session scratchpad under `/tmp/claude-1000/...`. The project memory already records that `/tmp`
quota trouble pushes runs to other temp folders, so this is a likely false red. Also, once the name is cut away, the
`UNPRINTABLE` assertion would pass even without the fix, because the ESC never reaches the output.
**Fix:** make the case independent of the path length. Put the row under a short root, for example
`mkdtempSync(join(tmpdir(), "g-"))` with a one-letter row name, or put the stray role in a kit whose path is a short
link. Better, assert on a reason that names the file early. Keep the `toContain("]0;pwned")` assertion so the case
proves the ESC reached `printableLine`.

## Info

### IN-01: The WR-01 override rule drops user folders that the set variable cannot move

**File:** `install/install.ts:2751-2754`; `install/host-tools.ts:521-540`
**Issue:** When any `userOverrides` variable is set, all of `dirs.user` is left out of `found`. For OpenCode,
`XDG_CONFIG_HOME` (often set on Linux) drops `~/.claude/skills` and `~/.agents/skills` too, although that variable can
only move `~/.config/opencode/skills`. The same holds for `COPILOT_HOME` and `PI_CODING_AGENT_DIR`, which drop
`~/.agents/skills`. The line says "may move", so nothing false is printed, and Olger confirmed the conservative rule in
42-UAT test 4. The cost is an always-`not checked` line on those hosts.
**Fix:** if more precision is wanted later, map each override to the user folders it moves, for example
`userOverrides: { XDG_CONFIG_HOME: [".config/opencode/skills"], ... }`, and keep the other folders in `found`.

### IN-02: On Windows a rooted PATH entry with no drive (`\tools`) counts as absolute but depends on the current drive

**File:** `install/host-tools.ts:601-604`
**Issue:** `path.win32.isAbsolute("\\tools")` and `isAbsolute("/tools")` are true, yet such a path is relative to the
current drive. The lookup stats it against the doctor's drive, which is the target's. libuv resolves the spawned path
against the child's `cwd`, which is the home drive. When the two drives differ, the file that was checked is not the
file that is run. This is rare and not attacker-controlled through the repository, and it is Windows only, so it is
`UNKNOWN - verify`.
**Fix:** on win32, require a drive root or a UNC root: `/^([A-Za-z]:[\\/]|\\\\)/.test(entry)`.

### IN-03: A stray role name is cut before it is cleaned

**File:** `install/install.ts:2726`
**Issue:** `stray.slice(0, 100)` runs before `printableLine`, which `say` applies, so control characters count toward
the 100. The cut can also split a surrogate pair, which leaves a lone surrogate that prints as U+FFFD.
**Fix:** `const clean = printableLine(stray); const name = clean.length > 100 ? Array.from(clean).slice(0, 100).join("") + "..." : clean;`

### IN-04: The disposition docs still say each row "is written as `pending (named human):`"

**File:** `docs/audit/29-style-dispositions/42-03.md:23-24`, `docs/audit/29-style-dispositions/42-06.md:27-28`
**Issue:** Every row now reads `accepted by Olger (42-UAT test 3, 2026-11-17)`, but the intro still says each row is
written as `pending (named human):` and "stays pending until a named human reads the row". None of the other accepted
disposition docs (`41-*.md`, `40-20.md`) carries this sentence.
**Fix:** reword it to the past tense, for example "Each row was written as `pending (named human):` ...; Olger accepted
all 17 in 42-UAT test 3 on 2026-11-17", or drop the sentence.

---

_Reviewed: 2026-11-17T12:28:32Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
