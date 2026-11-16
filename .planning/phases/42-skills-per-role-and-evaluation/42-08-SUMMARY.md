---
phase: 42-skills-per-role-and-evaluation
plan: 08
subsystem: installer
tags: [doctor, skills, install-check, claude-plugins, host-registry]

requires:
  - phase: 42
    provides: "42-02: the role-skills reader, HOST_SKILL_DIRS and the declared-skills doctor section"
provides:
  - Claude Code plugin skill lookup (installed_plugins.json installPath, skills/ and manifest skills paths, CLAUDE_CODE_PLUGIN_CACHE_DIR)
  - Antigravity CLI plugin-folder lookup (<home>/.gemini/config/plugins/<plugin>/skills)
  - not checked lines for a set override variable, an unreadable plugin record, an escaping manifest path and an unlistable plugin folder
  - the reader-refusal advisory line
  - two-way pin of HOST_SKILL_DIRS keys to HOST_TOOLS ids in install/host-tools.test.ts
  - scripts/role-skills-reader.test.ts
affects: [42-05, 42-07]

actuals:
  tokens: 15350
  tasks: 2
  commits: 4
plan_head_before: 853358080ff74a077a26e0d2fac4d2ba033415f3
plan_head_after: 24a6f0f825b2e626fa68284c23954aa06977f2a4

tech-stack:
  added: []
  patterns:
    - "an environment variable that only moves where a host keeps skills is read by name in hostSkillEnv and classed `host location` in the D-38 env census, pinned to the HOST_SKILL_DIRS userOverrides names"
    - "a lookup the doctor cannot complete returns `notChecked` with a reason; the line is `not checked`, never `not found`"

key-files:
  created:
    - scripts/role-skills-reader.test.ts
  modified:
    - install/install.ts
    - install/install.js
    - install/skills-doctor.test.ts
    - install/host-tools.test.ts
    - install/agents-record.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The override variables are read by name in one function, hostSkillEnv, because the D-38 env census refuses a computed process.env[name] read; a new `host location` class is pinned to exactly CLAUDE_CODE_PLUGIN_CACHE_DIR plus the userOverrides names, and a userOverrides name the build does not read prints not checked"
  - "A plugin folder that cannot be listed (Antigravity CLI) is not checked, like an unreadable Claude Code record, even though the plan's line-choice rules name only the Claude Code case"
  - "A relative installPath or a relative CLAUDE_CODE_PLUGIN_CACHE_DIR is refused (not checked) rather than resolved against a guessed folder"
  - "Skill lines now follow the reader's order (first-declaration) instead of the alphabetical sort 42-02 applied, as the plan's line-choice rules say"

patterns-established:
  - "One refused plugin does not hide a skill found elsewhere: found wins first, and the refusal only replaces a `not found`"

requirements-completed: [SKILL-05, SKILL-01]

coverage:
  - id: D1
    description: "A skill a Claude Code plugin installs is found through installed_plugins.json, in the ./.claude/skills/ manifest layout and the default skills/ layout; CLAUDE_CODE_PLUGIN_CACHE_DIR chooses the record"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#tracer: the manifest layout `\"skills\": \"./.claude/skills/\"` (ui-ux-pro-max's) is found, not reported missing"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#the default layout `skills/` with no manifest at all is found"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#CLAUDE_CODE_PLUGIN_CACHE_DIR set: the record under <HOME>/.claude/plugins is not consulted"
        status: pass
    human_judgment: false
  - id: D2
    description: "Where the doctor cannot see what the host sees it prints not checked with the reason: unreadable or odd-shaped plugin record, escaping or absolute manifest path, a set override variable, an unlistable plugin folder"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#a manifest `skills` path `../outside` is refused: `not checked` naming the plugin key, never followed and never `not found`"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#CODEX_HOME set and the skill absent: the Codex CLI line is `not checked` and names CODEX_HOME, never `not found`"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#--antigravity whose plugins folder is a file: the Antigravity CLI line is `not checked`, never `not found`"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each installed host is checked from its own HOST_SKILL_DIRS row, Antigravity CLI plugin folders included; the table is pinned to the registry both ways"
    requirement: SKILL-01
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#--claude --codex with the skill only in <HOME>/.agents/skills: Claude Code is missing, Codex CLI is found"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#--antigravity with the skill in <HOME>/.gemini/config/plugins/<plugin>/skills: found for Antigravity CLI"
        status: pass
      - kind: unit
        ref: "install/host-tools.test.ts#every registry id has a row, and every row is a registry id"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every added line is advisory only: exit status, --strict and counted lines unchanged; --check writes nothing"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#every not-checked and refusal run exits as the plain missing run does, with and without --strict, with the same counted lines"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#a --check run with a plugin record leaves the scratch target and the scratch HOME byte-identical"
        status: pass
      - kind: other
        ref: "grep counts in install/install.ts: docWarn( 29, docFail( 12, DOC_WARNS 7, DOC_FAILS 7, STRICT 3"
        status: pass
    human_judgment: false
  - id: D5
    description: "The reader has its own unit tests: fixture kit, refusal, sorted order, no declaration"
    requirement: SKILL-05
    verification:
      - kind: unit
        ref: "scripts/role-skills-reader.test.ts#the fixture role declares ui-ux-pro-max then frontend-design, in that order"
        status: pass
      - kind: unit
        ref: "scripts/role-skills-reader.test.ts#a kit where no role declares a skill gives an empty report; a role with no `skills:` key declares nothing (D-02)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Reading of SKILL-05: `found` means a SKILL.md is on disk where the host looks, not that the host loads it (disabled and synced plugins are not read); the override variables moving user folders is an assumption"
    verification: []
    human_judgment: true
    rationale: "The plan's flagged assumptions: a human confirms this reading of SKILL-05 and the override-variable assumption at verify time"

duration: 25min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 08: Plugin skill lookups and not-checked lines Summary

**`install.js --check` now finds skills that Claude Code plugins install. It reads `installed_plugins.json` (or the copy under `CLAUDE_CODE_PLUGIN_CACHE_DIR`), each plugin's `skills/` folder and its manifest `skills` paths. It also looks in Antigravity CLI's plugin folders. Where it cannot see what a host sees, it prints `not checked` with the reason. All of these lines are advisory: the exit code and `--strict` do not change, and nothing is written.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-11-16T13:23:26Z
- **Completed:** 2026-11-16T13:47:52Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- **Claude Code plugins.** `claudePluginSkillFolders` reads the plugin record, and `manifestSkillFolders` reads each manifest. Both read through `readUserFile`, and a presence check is a single stat (`skillFileIn`). A manifest path that is absolute, has a `..` segment or resolves outside `installPath` is refused before anything under it is looked at. ui-ux-pro-max's `./.claude/skills/` layout is found.
- **Line choice, first match wins.** Found in a project folder, a user folder or a plugin lookup gives `ok`. Otherwise a set override variable gives `not checked`, naming the variable. Otherwise a plugin lookup that could not finish gives `not checked` with its reason. Otherwise the missing line, with the `UNKNOWN - verify` plugin clause on hosts whose plugin installs are unknown.
- **Reader refusals.** Each refused role gets `declared skills of <role> not read: <reason> (the role-frontmatter guard reports this)`.
- **Two-way pin.** `HOST_SKILL_DIRS` keys must equal the `HOST_TOOLS` ids in both directions, and every folder must be relative, use `/` and have no `..` segment (install/host-tools.test.ts).
- **Reader tests.** The reader's cases moved to `scripts/role-skills-reader.test.ts`, with four new cases: fixture kit, sorted order, block-sequence refusal and no declaration.
- **Manual run.** A scratch run with Claude Code, Codex CLI and Antigravity CLI installed, a plugin record and two declared skills printed 6 skill lines. ui-ux-pro-max was `ok` for Claude Code through the plugin; the others were `advisory`. The run ended `ALL CHECKS PASSED` with exit 0.

## Task Commits

1. **Task 1 RED:** `3bcdefb1` (test) failing Claude Code plugin cases
2. **Task 1 GREEN (tracer):** `a6c015d0` (feat) Claude Code plugin lookup
3. **Task 2 RED:** `84faa547` (test) per-host, not-checked, table-pin and reader cases
4. **Task 2 GREEN:** `24a6f0f8` (feat) override, plugin-folder and refusal lines

## TDD

- **RED 1** (`3bcdefb1`): 11 of 25 failed, each on an assertion about the planned line (expected 1 `found` or `not checked` line, got 0). This is semantically valid RED evidence. `workflow.tdd_mode` is false, so the classifier gate was not run.
- **GREEN 1** (`a6c015d0`): 25 of 25 passed. The tracer gate re-ran the automated verify (end-of-phase mode, automated only), it passed, and work expanded to Task 2.
- **RED 2** (`84faa547`): 6 of 150 failed on line assertions: CODEX_HOME, CLAUDE_CONFIG_DIR, Antigravity found, Antigravity unlistable, the reader-refusal line and the same-exit run. The other new cases pinned behavior that 42-02 already had, so they passed at RED: the two-way pin, the reader cases, two roles declaring one skill, no declaration, and the Codex found and clause cases.
- **GREEN 2** (`24a6f0f8`): 150 of 150 passed.
- **REFACTOR:** none.

## Files Created/Modified

- `install/install.ts` / `.js`: `isJsonObject`, `skillFileIn`, `hostSkillEnv`, `claudePluginSkillFolders`, `manifestSkillFolders`, `folderInsidePlugin`, `pluginFolderSkillFolders`, `OPTIONAL_SKILL`; `readDeclaredSkills` now returns refusals; `doctorDeclaredSkills` uses the new line choice
- `install/skills-doctor.test.ts`: plugin, per-host, not-checked and refusal cases (the reader and table cases moved out)
- `install/host-tools.test.ts`: the HOST_SKILL_DIRS two-way pin and folder-form checks
- `scripts/role-skills-reader.test.ts`: the reader's unit and CLI cases
- `install/agents-record.test.ts`: the `host location` env class and 7 rows, pinned to the userOverrides names. `DOCTOR_REACH_SIZE` moved 69 -> 74 -> 75 and `WR24_REACH_SIZE` 59 -> 65 -> 66, each with a dated reason
- `scripts/check-foundation-guards.test.ts`: `TRIPWIRE_MODULES` 84 -> 85, with a dated reason

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The D-38 env-read census in install/agents-record.test.ts**
- **Found during:** Task 1
- **Issue:** The census requires every environment read to be named and classed. None of the existing classes fits `CLAUDE_CODE_PLUGIN_CACHE_DIR` or the override variables, and a table-driven `process.env[name]` read is refused outright.
- **Fix:** One function, `hostSkillEnv`, reads each variable by name. A new class, `host location`, is limited to that function, and a test pins its names to exactly `CLAUDE_CODE_PLUGIN_CACHE_DIR` plus the `HOST_SKILL_DIRS` userOverrides names. **For human review:** this adds a class to the D-38 table.
- **Committed in:** `a6c015d0`, `24a6f0f8`

**2. [Rule 3 - Blocking] Doctor reach censuses and the TRIPWIRE_MODULES pin**
- **Found during:** Tasks 1 and 2
- **Issue:** The new functions grow the DI-19 and WR-24 reach sets, and the new scripts test module moves `TRIPWIRE_MODULES`.
- **Fix:** Each pin was re-measured and moved with a dated reason. None of the new functions reads the marker or a kit home, or calls `homedir()`.
- **Committed in:** `a6c015d0`, `84faa547`, `24a6f0f8`

**3. [Rule 2 - Missing critical] An unlistable Antigravity CLI plugin folder is `not checked`**
- **Found during:** Task 2
- **Issue:** The plan's line-choice rules give `not checked` only for the Claude Code lookup. An Antigravity plugin folder that cannot be listed would otherwise print a false `not found`, which the plan's first prohibition forbids.
- **Fix:** That lookup returns `notChecked` too.
- **Committed in:** `24a6f0f8`

**4. [Rule 1 - Consistency] Skill lines in reader order**
- **Found during:** Task 2
- **Issue:** 42-02 sorted skills alphabetically. The plan says the doctor works through the skills "in the reader's order".
- **Fix:** Removed the sort.
- **Committed in:** `24a6f0f8`

**Total deviations:** 4 auto-fixed (2 Rule 3, 1 Rule 2, 1 Rule 1). **Impact:** test pins and one env class changed. The counters, `--strict` and the exit matrix did not change.

## Issues Encountered

- Two known baseline reds, matched by name: `installer-fs-census` "every node:fs export ... classified" (`openAsBlobSync`, Node v26) and `check-foundation-guards` LANG-07 "LIVE COUNT is DERIVED" (the untracked `~/` directory). No other failures.
- Verification:
  - The Task 2 verify set plus agents-record: 633 of 634 passed (one baseline red).
  - Ten more doctor-related install files plus check-foundation-guards: 1729 passed, 1 skipped, 1 baseline red.
  - Also passing: `npm run typecheck`, `npm run freshness` (92 `.js` fresh), `npm run check:build-parity` and `node scripts/check-foundation-guards.js`.
- Acceptance greps: `installed_plugins.json` 2, `CLAUDE_CODE_PLUGIN_CACHE_DIR` 5, `userOverrides` 3, `HOST_SKILL_DIRS` in host-tools.test.ts 11, `docWarn(` 29, `docFail(` 12, `DOC_WARNS` 7, `DOC_FAILS` 7, `STRICT` 3.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register: T-42-04, T-42-05, T-42-07 and T-42-27 are mitigated as planned. No mutating fs call was added; the only new fs calls are `readUserFile`, `statSync` and one `readdirSync`.

## User Setup Required

None.

## Next Phase Readiness

Plan 42-05 can edit `install/install.ts` on top of this. Plan 42-07 can render the `HOST_SKILL_DIRS` plugin entries and the `not checked` cases into docs/skills.md.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED
