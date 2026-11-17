---
phase: 42-skills-per-role-and-evaluation
fixed_at: 2026-11-17T00:00:00Z
review_path: .planning/phases/42-skills-per-role-and-evaluation/42-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 42: Code Review Fix Report

**Fixed at:** 2026-11-17
**Source review:** .planning/phases/42-skills-per-role-and-evaluation/42-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, CR-02, WR-01 to WR-04; Info findings out of scope)
- Fixed: 6
- Skipped: 0

`workflow.use_worktrees` is `false` in `.planning/config.json`, so every edit, build, test and commit ran in the main
checkout on `main`. No worktree was created.

## Fixed Issues

### CR-01: `claude --version` can execute a binary planted in the target repository

**Files modified:** `install/host-tools.ts`, `install/host-tools.js`, `install/install.ts`, `install/install.js`, `install/installer-paths.test-support.ts`, `install/claude-version-doctor.test.ts`, `install/agents-record.test.ts`, `install/path-spelling-census.test.ts`, `install/README.md`
**Commit:** d705749f
**Status:** fixed (POSIX half verified by test); the Windows half is `UNKNOWN - verify`
**Applied fix:** New pure `findClaudeOnPath(PATH, PATHEXT, flavor, isFile)` in host-tools.ts searches only absolute PATH entries. On POSIX the candidate is `<entry>/claude`. On Windows (the flavor's `sep` is a backslash), quoted entries are unquoted and `claude<ext>` is tried for each PATHEXT extension, with `.com`/`.exe` as programs. `doctorClaudeVersion` spawns the absolute path it returns, with `cwd` set to the user's home (doctor() now calls `homedir()` once and passes it to both sections). On Windows the child env also gets `NoDefaultCurrentDirectoryInExePath=1`. ENOENT/EINVAL from the spawn are no longer folded into "not found on PATH". When nothing is found and PATH had an empty or relative entry, the line adds "; PATH entries that are empty or not absolute are not searched". The README probe sentence and its pin were updated to say this. `spawnBin` gained an optional `cwd`.
**Regression tests:** three end-to-end cases run `--check` from inside the target with a planted executable `claude` that leaves a marker. They cover PATH `.`, a leading or trailing empty entry, and `../t`, and assert that the marker is never written. The third case also asserts that the `claude` from the absolute entry runs with the home folder as cwd. Before the fix all three failed: the planted script ran. Two pure-function cases cover the posix and win32 flavors.
**Census re-pins (for human review):** agents-record.test.ts adds a new ENV_READ_TABLE class, `program lookup`, for PATH and PATHEXT in doctorClaudeVersion only. It also widens the `whole environment` pin from renderAdaptersInMirror alone to renderAdaptersInMirror plus doctorClaudeVersion, which now passes `process.env` explicitly; the child inherited it before. DOCTOR_REACH_SIZE went from 77 to 78 and WR24_REACH_SIZE from 67 to 68 (executableFile). path-spelling-census classifies `host-tools.ts:findClaudeOnPath:isAbsolute` as P8, the path the process is about to search. That moved DERIVED_ABSOLUTENESS_COUNT from 12 to 13 and the map size from 9 to 10. Every re-pin carries a dated reason line.
**Windows:** the Windows behavior (libuv's current-folder search, PATHEXT order, quoted entries, NoDefaultCurrentDirectoryInExePath) was implemented but not run on a Windows host. It is `UNKNOWN - verify`. The win32 lookup logic is unit-tested only through `path.win32` with a fake `isFile`.

### CR-02: Terminal escape injection: role-file bytes and reader stderr are printed raw by `--check`

**Files modified:** `install/install.ts`, `install/install.js`, `install/skills-doctor.test.ts`, `install/agents-record.test.ts`
**Commit:** 1b4cbc57
**Applied fix:** New `printableLine` = `stripControlChars(text, false)` plus removal of the bidi format characters (U+061C, U+200E/F, U+202A-U+202E, U+2066-U+2069). It is applied to each refusal reason (after the whitespace collapse) and to the reader's stderr first line. Every line of `doctorDeclaredSkills` prints through a local `say` wrapper that applies it, which also covers plugin keys, manifest paths and environment values in `not checked` reasons. The Claude Code version `notChecked` lines go through it too. DOCTOR_REACH_SIZE went from 78 to 80 and WR24_REACH_SIZE from 68 to 69, with reasons.
**Regression tests:** three cases. A role file whose line 1 holds OSC/BEL/SGR/U+202E. A dangling role link whose name holds ESC/BEL, so the reader's stderr names it (skipped on win32). A plugin key that holds ESC/BEL. Each asserts that no control or bidi character reaches stdout. The first two failed before the fix with raw ESC and BEL in the output.

### WR-01: A set `CLAUDE_CONFIG_DIR` (or another override) still yields `ok ... found` from the default user and plugin folders

**Files modified:** `install/install.ts`, `install/install.js`, `install/skills-doctor.test.ts`
**Commit:** a6e05b94
**Status:** fixed: requires human verification (a condition change)
**Applied fix:** When any `userOverrides` variable of the host is set, the default user folders are left out of the `found` computation. For Claude Code the default plugin root is left out too, unless `CLAUDE_CODE_PLUGIN_CACHE_DIR` is set. The line then falls through to the existing `not checked` line that names the variable. Project folders are always checked. This applies to all overrides, including `XDG_CONFIG_HOME` for OpenCode, which drops all of OpenCode's user folders. That is conservative, per the HostSkillDirs contract.
**Regression tests:** four cases. CLAUDE_CONFIG_DIR with the skill in `~/.claude/skills`. CLAUDE_CONFIG_DIR with the skill in a default-root plugin. CLAUDE_CONFIG_DIR plus CLAUDE_CODE_PLUGIN_CACHE_DIR, which is still found. CODEX_HOME with the skill in `~/.agents/skills`. The three `not checked` cases failed before the fix.

### WR-02: `folderInsidePlugin` containment is lexical only, so a symlink inside the plugin escapes it

**Files modified:** `install/install.ts`, `install/install.js`, `install/skills-doctor.test.ts`, `install/path-spelling-census.test.ts`
**Commit:** da717415
**Status:** fixed: requires human verification (a containment rule change)
**Applied fix:** After the lexical test, containment is checked again over the real paths from `realPathThroughExisting` (the existing user-file.ts helper, which resolves the deepest existing ancestor). A path whose real location cannot be read, such as a dangling link, is refused. The refusal text now ends "(links followed)". The doc comments, including T-42-05's "resolves outside installPath", now say links are followed. path-spelling-census moved DERIVED_ABSOLUTENESS_COUNT from 13 to 14 under the existing `folderInsidePlugin:isAbsolute` key, whose reason now says three calls. The threat-register text in `.planning/` was not edited.
**Regression tests:** a `skills: "lnk"` link out of the plugin gives `not checked` and never `found`; it failed before the fix. A link that stays inside the plugin is still found. Both are skipped on win32 because links need a privilege there.

### WR-03: One non-kebab `.md` in the roles folder disables the whole declared-skills section, with a misleading reason

**Files modified:** `install/install.ts`, `install/install.js`, `install/skills-doctor.test.ts`
**Commit:** 59697a77
**Status:** fixed: requires human verification (new advisory wording)
**Applied fix:** `readDeclaredSkills` no longer rejects the report for a non-kebab role stem. It collects such stems as `strays`, from refusals and from a skill's declaring roles, and drops them from the roles of each skill. A skill that only stray files declare is dropped. Each stray prints one advisory line: `declared skills of <name>.md in the roles folder not checked: the file name is not a role name, which is lower-case letters, digits and hyphens`. All other skills are still checked.
**Regression tests:** a `NOTES.md` with no frontmatter, and a `Designer_Copy.md` with a valid frontmatter that declares the skill. Each gives one stray line, the designer skill line still prints, and no `declared skills not checked` line appears. Both failed before the fix.

### WR-04: On Windows an npm-installed `claude.cmd` is reported as "`claude` was not found on PATH"

**Files modified:** `install/host-tools.ts`, `install/host-tools.js`, `install/install.ts`, `install/install.js`, `install/claude-version-doctor.test.ts`
**Commit:** 8a58d8e8
**Status:** fixed (lookup logic unit-tested); the Windows half is `UNKNOWN - verify`
**Applied fix:** This builds on CR-01's PATH walk. `findClaudeOnPath` now returns the first `claude<ext>` file in PATHEXT order, as the Windows shell would run it. If the extension is not `.com`/`.exe`, the result is `kind: "shim"`. The doctor then prints `the Claude Code version was not checked: the first `claude` on PATH is <path>, which is not a .com or .exe program; this check runs no shell, so it did not run it`. Shell execution was not enabled. EINVAL got its own generic reason in CR-01: "`claude --version` could not be run (EINVAL)".
**Regression tests:** win32-flavor unit cases. A `.cmd` first on PATH gives `shim`, even when a later entry has `claude.exe`. A `claude.exe` in an earlier entry gives `program`. The shim case failed before the fix. The end-to-end Windows behavior was not run on a Windows host: `UNKNOWN - verify`.

## Verification

All verification ran in the main checkout (`/home/olger/projects/public/grugops`, branch `main`), not in a worktree.

- `npm run build`, `npm run typecheck` (0 errors), `npm run freshness` ("All build outputs fresh: 92 committed .js file(s) match a rebuild of their sources.").
- `npm run check:public-docs`, `npm run check:banned-claims`, `npm run check:diff-disposition`, `npm run check:claim-anchors`: all "ALL CHECKS PASSED". install/README.md is not in the LANG-03 watched corpus, so the disposition gate asked for no rows.
- Targeted vitest run, final: install/claude-version-doctor, skills-doctor, mode-census, path-spelling-census, agents-record, agent-flag-census, installer-fs-census, host-tools, host-tools-prose, message-references and host-entry-docs, plus scripts/role-skills-reader, check-claim-anchors, check-public-docs-vocabulary and check-banned-claims. Result: 764 passed, 1 failed.
- The one failure is in install/installer-fs-census.test.ts: "UNCLASSIFIED node:fs export openAsBlobSync". It comes from the local Node version, v26.12.1, which exports `openAsBlobSync`. The test enumerates node:fs's own exports. No fix touched that census or any fs import it classifies; `accessSync` and `constants` were already classified as read-only. This failure is not caused by these fixes, but it was not compared against a baseline run.
- The full suite was not run, as instructed. The orchestrator runs it.

---

_Fixed: 2026-11-17_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
