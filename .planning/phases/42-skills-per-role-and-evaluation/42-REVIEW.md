---
phase: 42-skills-per-role-and-evaluation
reviewed: 2026-11-16T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - agent-factory/roles/designer.md
  - agent-factory/roles/frontend-ui.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/workflows/14-ui-design-to-build.md
  - AGENTS.md
  - docs/audit/28-claim-registry.md
  - docs/audit/29-style-dispositions/42-03.md
  - docs/audit/29-style-dispositions/42-06.md
  - docs/skills.md
  - install/agents-record.test.ts
  - install/claude-version-doctor.test.ts
  - install/host-tools.test.ts
  - install/host-tools.ts
  - install/installer-paths.test-support.ts
  - install/install.ts
  - install/message-references.test.ts
  - install/mode-census.test.ts
  - install/path-spelling-census.test.ts
  - install/README.md
  - install/skills-doctor.test.ts
  - scripts/check-banned-claims.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-flip-manifest.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-public-docs-vocabulary.test.ts
  - scripts/check-public-docs-vocabulary.ts
  - scripts/role-skills-reader.test.ts
  - scripts/role-skills-reader.ts
  - scripts/skills-kit-text.test.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 2
  warning: 4
  info: 6
  total: 12
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-11-16
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

Scope: the phase-42 hunks (`git diff 76c6d8a6..HEAD`) of the 30 listed files, read against the whole file. Focus areas: the
declared-skills doctor section of `install/install.ts` (reader spawn, `HOST_SKILL_DIRS` lookup, Claude Code
`installed_plugins.json` lookup, `folderInsidePlugin` containment for T-42-05), the `claude --version` probe,
`HOST_SKILL_DIRS` and `CLAUDE_CODE_LEVEL_FLOOR` in `install/host-tools.ts`, `scripts/role-skills-reader.ts`, and the
kit and public-doc text against the code. The compiled `.js` twins were not reviewed; the caller's freshness check covers them.

Every runtime claim below was reproduced against the committed `install/install.js` in a scratch target with a scratch
HOME, a scratch kit home and a scratch PATH. The one exception is the Windows half of CR-01, which rests on documented
libuv behavior and was not run on a Windows host.

Main concerns:

1. **CR-01:** the `claude --version` probe resolves the bare name `claude` with `cwd` left as `process.cwd()`. That
   directory is the target repository by default. On Windows, libuv also searches the current directory, so a repository
   could plant a `claude.exe` that `--check` runs. `--check` is documented as read-only.
2. **CR-02:** refusal reasons from the role-skills reader, and its stderr, are printed raw. The reasons quote role-file
   bytes, so ESC/OSC sequences in a role file reach the user's terminal. This was reproduced, including with the kit home
   named by the target's `.grugops/install.json`. The file already has `oneLine`/`stripControlChars` for this, and its
   other child-output path (line ~7878) uses it.
3. **WR-01 to WR-04:** three wrong `ok` or `not checked` outcomes and one wrong reason: a false `found` under
   `CLAUDE_CONFIG_DIR`, a false `found` through a symlink out of a plugin folder, the whole section disabled by one
   stray roles file with a misleading reason, and a Windows `.cmd` shim reported as "not found on PATH".

The structure-only gates (`check-banned-claims`, `check-public-docs-vocabulary`) pass on the current tree. Their pin
moves and the census re-pins are consistent with the diff. The markdown kit edits (AGENTS.md precedence line,
role-switch protocol line, Designer and Frontend/UI hard limits, Workflow 14 step 1) match docs/skills.md and their
style-disposition rows.

## Critical Issues

### CR-01: `claude --version` can execute a binary planted in the target repository (Windows cwd search; relative PATH entries on POSIX)

**File:** `install/install.ts:2754-2763` (spawn), `install/install.ts:3452` (call site)
**Issue:** `doctorClaudeVersion` calls `spawnSync("claude", ["--version"], { shell: false, ... })` and leaves `cwd` unset.
The child therefore resolves `claude` with the doctor's own working directory. `resolveTarget()` (line 545-547) makes
that directory the target by default, because the documented way to run `--check` is from inside the repository.

- **Windows:** libuv's `search_path` (src/win/process.c) checks the current directory for `claude.com`/`claude.exe`
  before it walks PATH. A cloned repository that commits `claude.exe` at its root, plus a `.grugops/install.json` that
  records Claude Code (or `.claude/` under the "detected" fallback in `doctorHosts`, line 2025), gets that binary run by
  a plain `install.js --check`. The libuv behavior is documented; it was not run on a Windows host here, so the Windows
  premise is `UNKNOWN - verify`.
- **POSIX:** the same happens when the user's PATH has an empty entry (`::`, a leading or trailing `:`) or `.`.

The header comment (lines 18-22) justifies the probe because it runs "the same program the user's own `claude` command
runs". That is false for PowerShell, which does not search the current directory. It is also false whenever the user
does not type `claude` from inside an untrusted checkout. A read-only diagnostic must not become a code-execution path
for the repository it inspects.

**Fix:** resolve `claude` to an absolute path yourself, use only absolute PATH entries, and spawn that path with a `cwd`
outside the target:
```ts
function whichClaude(): string | null {
  const names = process.platform === "win32" ? ["claude.exe", "claude.com"] : ["claude"];
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (dir === "" || !isAbsolute(dir)) continue;            // never the cwd, never a relative entry
    for (const n of names) {
      const p = join(dir, n);
      try { if (statSync(p).isFile()) return p; } catch { /* next */ }
    }
  }
  return null;
}
// ...
const exe = whichClaude();
if (exe === null) { notChecked("`claude` was not found on PATH"); return; }
const r = spawnSync(exe, ["--version"], { cwd: homedir(), shell: false, /* same bounds as today */ });
```
Also add `NoDefaultCurrentDirectoryInExePath: "1"` to the child env on win32. Add a test that plants an executable
`claude` in the target, puts a relative `.` on PATH, and asserts the planted file is never run.

### CR-02: Terminal escape injection: role-file bytes and reader stderr are printed raw by `--check`

**File:** `install/install.ts:2493-2494` (refusal reason), `install/install.ts:2469-2470,2473` (reader stderr in `said`), `install/install.ts:2686` (print)
**Issue:** `readDeclaredSkills` normalizes a refusal reason only with `.replace(/\s+/g, " ")`. That collapses whitespace,
but ESC (U+001B), BEL (U+0007), C1 controls and bidi overrides stay. The reasons come from `admitRole`, and they quote
document bytes. For example, `[no-opening-delimiter] line 1 of the fence-stripped document is \`...\`` quotes line 1 of
the role file verbatim, and that line is outside the frontmatter, so the control-character refusal never sees it.
`plain-scalar-charset` reasons quote a U+202E verbatim. The kit home whose roles are read is `DOCTOR_KIT_HOME`, which
`commandContextFromRecord` takes from the target's own `.grugops/install.json` `grugopsHome`.

Reproduced: a kit role file `zz-evil.md` whose first line is `\e]0;pwned\a\e[31mRED hello` produces this advisory line,
with raw ESC and BEL in stdout (shown through `cat -v`):
```
advisory       declared skills of zz-evil not read: [no-opening-delimiter] line 1 of the fence-stripped document is `^[]0;pwned^G^[[31mRED hello`, ...
```
The same output appeared when the target's marker `grugopsHome` was rewritten to an absolute path inside the target
repository. OSC sequences can retitle the window, plant OSC 8 hyperlinks, or write the clipboard (OSC 52) on terminals
that honor it. The reader's stderr first line (`said`, line 2470) is likewise printed unfiltered. The file already owns
the fix: `oneLine` → `stripControlChars(text, false)` (line 7259). The trace-render child (lines 7878-7881) already
passes its child output through it. This new spawn does not.

**Fix:** pass every child-derived string through `stripControlChars` before it is printed. Call `stripControlChars`
directly: `oneLine` is a module-level `const` declared later in the file.
```ts
const reason = stripControlChars(ref.reason, false).replace(/\s+/g, " ").trim();
// ...
const firstErr = stripControlChars((r.stderr ?? "").trim().split("\n")[0] ?? "", false);
```
If `stripControlChars` does not cover bidi format characters (U+202A-U+202E, U+2066-U+2069), strip those as well. Add a
skills-doctor case with an ESC sequence on line 1 of a planted role and assert that no `\u001b` reaches stdout, as
claude-version-doctor.test.ts already does for the version line.

## Warnings

### WR-01: A set `CLAUDE_CONFIG_DIR` (or another override) still yields `ok ... found` from the default user and plugin folders

**File:** `install/install.ts:2700-2729`; `install/host-tools.ts:27-31,508`
**Issue:** `found` is computed from `dirs.user` under `homedir()` and, for Claude Code, from
`<home>/.claude/plugins/installed_plugins.json` before any override is considered. The override test (`moved`) runs only
on the not-found path. Two sources say a set override means the user folders cannot be checked: the `HostSkillDirs`
contract ("a set one means the user folders cannot be checked rather than guessed") and docs/skills.md ("A place it
cannot see, such as a user folder that one of the listed variables may move, gives ... `not checked`"). Yet when the
variable is set and a stale copy sits in the default folder, the doctor reports the skill found.

Reproduced: `CLAUDE_CONFIG_DIR=<elsewhere>` and `<HOME>/.claude/skills/some-skill/SKILL.md` give
`ok  skill some-skill (designer2) found for Claude Code`. Under the table's own assumption, Claude Code reads
`$CLAUDE_CONFIG_DIR/skills` there, so this `ok` is not backed by anything the host reads. The same applies to the
Claude Code plugin record, whose default root `<home>/.claude/plugins` also moves with `CLAUDE_CONFIG_DIR`, and to
`CODEX_HOME`, `COPILOT_HOME`, `PI_CODING_AGENT_DIR` and `OPENCODE_CONFIG_DIR`/`XDG_CONFIG_HOME` for whichever user
folders they move. No test covers "override set and skill present in the default user folder"; line 324 of
skills-doctor.test.ts pins only the plugin-record variant.
**Fix:** when any of `dirs.userOverrides` is set, leave `dirs.user` out of the `found` computation. For Claude Code,
also leave out the default plugin root unless `CLAUDE_CODE_PLUGIN_CACHE_DIR` is set. Fall through to the existing
`not checked` line. Project folders stay checked. Add the missing test.

### WR-02: `folderInsidePlugin` containment is lexical only, so a symlink inside the plugin escapes it (T-42-05 overstated)

**File:** `install/install.ts:2604-2610` (doc comment), `install/install.ts:2645-2653`, `install/install.ts:2518-2525`
**Issue:** The manifest comment says a path that "resolves outside installPath is refused before anything under it is
looked at". `folderInsidePlugin` uses `resolve`/`relative`, which never follow links. `skillFileIn` then calls
`statSync`, which does follow them.

Reproduced: plugin `p@m` with manifest `{"skills":"lnk"}`, where `<installPath>/lnk` is a symlink to an outside folder
holding `other-skill/SKILL.md`. The result is `ok  skill other-skill (designer2) found for Claude Code`. The impact is
limited: only a presence boolean and a wrong `found`, and no content is read. But T-42-05's stated mitigation does not
hold, and the doctor reports a skill as carried by a plugin that does not carry it.
**Fix:** after the lexical test, compare real paths:
```ts
let realBase: string, realAbs: string;
try { realBase = realpathSync(installPath); realAbs = realpathSync(abs); } catch { return abs; } // absent: nothing to stat
const r2 = relative(realBase, realAbs);
if (r2 === ".." || r2.startsWith(".." + sep) || isAbsolute(r2)) return null;
```
Alternatively, correct the comment and the threat-register text to say the containment is lexical.

### WR-03: One non-kebab `.md` in the roles folder disables the whole declared-skills section, with a misleading reason

**File:** `install/install.ts:2488-2491,2497-2500`; `scripts/role-skills-reader.ts` (`readRoleSkills`, the `.endsWith(".md")` filter)
**Issue:** The reader lists every `.md` entry except `ROLE_DIR_EXEMPT_NAMES` and reports a refused role under its file
stem. A file such as `NOTES.md` or `README.md` in a user's kit roles folder becomes a refusal with role `NOTES`. The
doctor then fails `KEBAB_NAME.test(ref.role)` and rejects the entire report as `notShape`.

Reproduced: adding `NOTES.md` turns every per-skill line into the single line
`declared skills not checked: the role-skills reader .../role-skills-reader.js printed JSON that is not its report`.
That is fail-closed, but the reason blames the reader's output format rather than the stray file, so the user cannot
act on it.
**Fix:** in the doctor, skip (or report by itself) a refusal whose role name is not kebab, instead of rejecting the
report. For example, print `a file in the roles folder is not a role name: <oneLine(name)>` and keep checking the other
skills. Alternatively, have the reader report a non-kebab stem as a distinct `ignored` entry.

### WR-04: On Windows an npm-installed `claude.cmd` is reported as "`claude` was not found on PATH"

**File:** `install/install.ts:2764-2767`; `install/README.md:2101-2104`
**Issue:** With `shell: false`, libuv on Windows only tries `claude`, `claude.com` and `claude.exe`. A user whose
`claude` is the npm `.cmd` shim gets `ENOENT`, and the doctor prints "`claude` was not found on PATH". That is false:
the program is on PATH and the user runs it daily. The doc comment above the function knows this case and says the line
is "not checked", but the reason string states something untrue. The project's no-fabrication rule applies to
diagnostic text. `EINVAL` (spawning a `.cmd` by explicit name) is also folded into "not found", which is also wrong.
**Fix:** on win32, word the ENOENT case as
"`claude.exe` was not found on PATH (an npm-installed `claude.cmd` shim is not run without a shell, so the version was
not checked)". Give `EINVAL` its own reason. The CR-01 fix (an explicit PATH walk) makes it easy to tell a `.cmd`-only
PATH from a truly absent one.

## Info

### IN-01: Unreachable `unread` branch in `doctorDeclaredSkills`

**File:** `install/install.ts:2720-2724`
**Issue:** `hostSkillEnv().read` is a fixed literal that install/agents-record.test.ts pins to exactly the
`userOverrides` names, so `unread` is always empty and the "this build does not read ..." line can never print.
**Fix:** build `read` from `HOST_SKILL_DIRS` (plus `CLAUDE_CODE_PLUGIN_CACHE_DIR`) so the branch means something.
Otherwise remove it and keep the test pin.

### IN-02: The version regex accepts a pre-release as meeting the floor

**File:** `install/install.ts:2780`
**Issue:** `/^(\d+)\.(\d+)\.(\d+)\b/` matches `2.1.293-beta.1` as `2.1.293`, so it prints `meets the v2.1.293 floor`,
although SemVer orders `2.1.293-beta.1` below `2.1.293`.
**Fix:** treat a `-` directly after the patch digits as below an equal release, or say "not checked" for pre-releases.

### IN-03: docs/skills.md and install/README.md state the doctor's output slightly wrong

**File:** `docs/skills.md:7`, `docs/skills.md:31-38`, `install/README.md:814`
**Issue:**
- docs/skills.md:7 says `install.js --check` "only reports a declared skill it cannot find". It also prints `ok` lines
  for skills it finds, as § *What install.js --check does* says.
- The host table's "May be moved by" column for Claude Code omits `CLAUDE_CODE_PLUGIN_CACHE_DIR`, which the doctor reads
  (`hostSkillEnv`, `claudePluginSkillFolders`).
- install/README.md:814 says a place it cannot see "gives a `not checked` line". The label printed is `advisory`; the
  words `not checked` are in the message.
**Fix:** reword docs/skills.md:7 (for example "only reports; it never installs a skill"), name
`CLAUDE_CODE_PLUGIN_CACHE_DIR` in the Claude Code row or in a note under the table, and say "an `advisory` line that
says `not checked`" in the README.

### IN-04: The user-facing line claims "the role-frontmatter guard reports this"

**File:** `install/install.ts:2686`
**Issue:** `scripts/check-foundation-guards.js` is grugops's own dev/CI gate. For a user's kit home nothing runs it, so
the parenthetical promises a report the user will not see.
**Fix:** drop the parenthetical, or say "this role file is not in the form the kit requires".

### IN-05: The case-sensitivity test asserts nothing on case-insensitive filesystems

**File:** `install/skills-doctor.test.ts:126-135`
**Issue:** On macOS (default APFS) and Windows, `caseSensitive` is false and the test passes with zero assertions. The
test title "the name is compared byte for byte" is then untrue for the doctor on those hosts: `statSync` matches the
differently-cased folder, so the doctor prints `found`.
**Fix:** on a case-insensitive filesystem, assert the actual behavior (a `found` line) or use `it.skipIf` with a
reason, so a green run does not read as coverage.

### IN-06: Output-cap overflow is reported as "could not be run"

**File:** `install/install.ts:2766-2768`
**Issue:** When `claude --version` exceeds the 64 KiB `maxBuffer`, `r.error.code` is `ENOBUFS`. The program did run,
but the line reads "`claude --version` could not be run (ENOBUFS)".
**Fix:** map `ENOBUFS` to "printed more than 64 KiB, so its version was not read".

---

_Reviewed: 2026-11-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
