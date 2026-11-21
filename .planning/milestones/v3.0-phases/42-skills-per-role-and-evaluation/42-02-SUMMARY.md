---
phase: 42-skills-per-role-and-evaluation
plan: 02
subsystem: installer
tags: [doctor, skills, install-check, role-frontmatter, host-registry]

requires:
  - phase: 39
    provides: admitRole and roleSkillsOf (the one role admission and the one `skills:` projection)
provides:
  - scripts/role-skills-reader.ts (+ committed .js): kit home in, one JSON line of declared skills out
  - HOST_SKILL_DIRS / HostSkillDirs in install/host-tools.ts, one full row per registry host
  - the doctor's declared-skills section: uncounted `advisory` (missing, reader failed) and `ok` (found) lines
  - RunOptions.env and hermeticEnv(home, binDir) in install/installer-paths.test-support.ts
affects: [42-05, 42-07, 42-08]

actuals:
  tokens: 16083
  tasks: 2
  commits: 3
plan_head_before: 8dd0ea94f4413aee8fa2bfe0cde276bbfe95d981
plan_head_after: cb177a5cc0d1589980241460bb71c1c5ca35a1dd

tech-stack:
  added: []
  patterns:
    - "install/ reaches a scripts/ authority only by spawning its committed .js with process.execPath, no shell, and failing closed on anything but exit 0 and one line of the expected shape"
    - "a doctor section that must never count prints only through docReport"

key-files:
  created:
    - scripts/role-skills-reader.ts
    - scripts/role-skills-reader.js
    - install/skills-doctor.test.ts
  modified:
    - install/host-tools.ts
    - install/host-tools.js
    - install/install.ts
    - install/install.js
    - install/installer-paths.test-support.ts
    - install/agents-record.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The doctor's skill line is labelled `advisory`, not `WARN`, so the repo's `^  (FAIL|WARN)\\s` counted-finding tests never see it; a found skill prints an uncounted `ok` line"
  - "doctor() itself calls homedir() once and passes it to doctorDeclaredSkills, so the one user-home read is a named row of the WR-24 census in doctor(), next to its other exemptions; it is the user's home for skill folders, never a kit home"
  - "The reader uses the shared isEntrypoint (scripts/is-entry.ts) for its entry check, because check-foundation-guards.test.ts refuses any other spelling"
  - "check-foundation-guards.test.ts accepts `admitRole` as well as `admit` as the admission entry point a canonical-module importer must take"

patterns-established:
  - "Per-host skill-folder data lives beside HOST_TOOLS as HOST_SKILL_DIRS, keyed by host id, with a test pinning its key set to the registry"

requirements-completed: [SKILL-05, SKILL-01]

coverage:
  - id: D1
    description: "--check prints one advisory line per declared skill per installed agent when no project or user folder holds it, and an ok line when one does"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#tracer: a skill declared by designer and absent from every Claude Code folder prints one advisory line; present, it prints ok; both exit the same"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#a skill in the Claude Code project folder of the target is found"
        status: pass
    human_judgment: false
  - id: D2
    description: "The skill line never changes the exit status, with or without --strict, adds no FAIL or WARN line, and a --check run writes nothing to the target or HOME"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/skills-doctor.test.ts#absent and present exit the same, with and without --strict; the absent run adds no FAIL or WARN line and the summary line is the same"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#a --check run leaves the scratch target and the scratch HOME byte-identical"
        status: pass
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*)' install/install.ts | grep -cF 'docWarn(' -> 29; docFail( -> 12; DOC_WARNS 7; DOC_FAILS 7; STRICT 3"
        status: pass
    human_judgment: false
  - id: D3
    description: "Declared skills are read only through the spawned committed reader (admitRole + roleSkillsOf); a failing reader prints `declared skills not checked` and checks nothing"
    requirement: SKILL-05
    verification:
      - kind: unit
        ref: "install/skills-doctor.test.ts#two roles declaring one skill: the skill names both roles in sorted order, no refusal"
        status: pass
      - kind: unit
        ref: "install/skills-doctor.test.ts#the CLI prints exactly one line of JSON and exits 0; with no argument it exits 2 and prints nothing on stdout"
        status: pass
      - kind: integration
        ref: "install/skills-doctor.test.ts#the reader failing prints `declared skills not checked` and no per-skill line"
        status: pass
    human_judgment: false
  - id: D4
    description: "HOST_SKILL_DIRS holds one full row per registry host"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "install/skills-doctor.test.ts#has exactly the registry ids, each with project and user folders written with forward slashes"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reading of SKILL-05: `found` means a SKILL.md exists where the host documents it looks, not that the host loads it in a session"
    verification: []
    human_judgment: true
    rationale: "The plan's flagged assumption: a human confirms this reading of SKILL-05 at verify time"

duration: 23min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 02: Declared-skills doctor section Summary

**`install.js --check` now spawns a committed role-skills reader (admitRole + roleSkillsOf) and, for each installed agent, prints one uncounted `advisory` line per declared skill no project or user folder in HOST_SKILL_DIRS holds, or an `ok` line when one does. The exit status and `--strict` do not move, and nothing is written.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-11-16T12:47:37Z
- **Completed:** 2026-11-16T13:11:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `scripts/role-skills-reader.ts`: `readRoleSkills(kitHome)` returns `{ skills, refusals }`. The CLI prints one JSON line and exits 0, exits 2 when the argument count is wrong, and exits 1 with nothing on stdout when the roles folder cannot be read.
- `HOST_SKILL_DIRS` in `install/host-tools.ts`: the six rows from 42-RESEARCH. Each row has project folders, user folders, a plugins entry and override variables. A test pins its keys to `HOST_TOOLS`.
- The doctor section in `install/install.ts` runs `spawnSync(process.execPath, [<GRUGOPS_SRC>/scripts/role-skills-reader.js, DOCTOR_KIT_HOME])` with no shell, stdin ignored, a 15 s timeout and a 1 MiB cap. Before joining any path, it checks that every skill name and role name is kebab case, and it fails closed to `declared skills not checked: <reason>`. It prints only through `docReport`.
- A manual run with Claude Code and Codex CLI installed and two roles declaring two skills printed four advisory lines. The Codex CLI lines carried the `plugin installs ... UNKNOWN - verify` clause. The run ended `ALL CHECKS PASSED` with exit 0.

## Task Commits

1. **RED: failing tests for both tasks** - `70b11aeb` (test)
2. **Task 1: reader, HOST_SKILL_DIRS and the doctor section (tracer)** - `1e85c755` (feat)
3. **Task 2: the doctor's read censuses re-pinned for the new section** - `cb177a5c` (fix)

The Task 2 behavior cases (the same exit status with and without `--strict`, no new FAIL or WARN, the same summary line, a byte-identical target and HOME) went into the RED commit with the Task 1 cases. They passed from the Task 1 implementation onward.

## TDD

- **RED** (`70b11aeb`): 10 of 11 cases failed. The reader cases failed because the module did not exist. The HOST_SKILL_DIRS and doctor cases failed because `HOST_SKILL_DIRS` was undefined (a TypeError inside `hermeticEnv`). Semantic assessment: most failures were load-time or undefined-symbol failures, not assertions on the planned output. That is weaker RED evidence than the gate prefers. `workflow.tdd_mode` is false, so the classifier gate was not run. The one case that passed at RED was "an unreadable roles folder exits 1". It passed only because node exits 1 on a missing script, so that pass proves nothing.
- **GREEN** (`1e85c755`): 11 of 11 passed.
- **REFACTOR:** none.

## Files Created/Modified

- `scripts/role-skills-reader.ts` / `.js`: the reader the doctor spawns
- `install/host-tools.ts` / `.js`: `HostSkillDirs`, `HOST_SKILL_DIRS`
- `install/install.ts` / `.js`: `readDeclaredSkills`, `skillFileAt`, `doctorDeclaredSkills`, the call inside `doctor()` and the header's `node:child_process` paragraph
- `install/skills-doctor.test.ts`: hermetic doctor and reader tests
- `install/installer-paths.test-support.ts`: `RunOptions.env`, `hermeticEnv`
- `scripts/check-foundation-guards.test.ts`: `NON_TEST_MODULE_COUNT` 114 -> 115, the flat `scripts/` reader 72 -> 73 (and 72*3 -> 73*3), the canonical-module importer set now includes `role-skills-reader.ts`, and the entry-point check accepts `admitRole`
- `install/agents-record.test.ts`: `DOCTOR_REACH_SIZE` 65 -> 69, `WR24_REACH_SIZE` 56 -> 59, plus one `ENV_READ_TABLE` row and one `WR24_EXEMPT` row for `doctor :: homedir()`

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The reader imports `./is-entry.js` as well**
- **Found during:** Task 1
- **Issue:** The plan limits the reader's imports to `node:` builtins, `./canonical-frontmatter.js` and `./kit-model.js`. `check-foundation-guards.test.ts`, however, refuses any `import.meta.url ===` entry check outside `scripts/is-entry.ts`.
- **Fix:** The reader uses `isEntrypoint` from `./is-entry.js`. The module-count docblock names this import.
- **Committed in:** `1e85c755`

**2. [Rule 3 - Blocking] Three more foundation-guard pins moved because of the new module**
- **Found during:** Task 1
- **Issue:** The plan named only `NON_TEST_MODULE_COUNT`. The new module also enters the canonical-module importer set, the flat `scripts/` reader corpus (72) and its comparison count (72*3). The importer-set check also required `admit` specifically.
- **Fix:** Each pin was re-derived and moved with a dated reason. The entry-point assertion now accepts `admit` or `admitRole`, since a role file is admitted only under ROLE_SCHEMA.
- **Committed in:** `1e85c755`

**3. [Rule 3 - Blocking] The doctor's read censuses in `install/agents-record.test.ts`**
- **Found during:** Task 2 (the existing doctor tests)
- **Issue:** The DI-19 reach (65) and the WR-24 reach (56) grew with the new functions. The env-read census and the WR-24 kit-home census flagged the section's `homedir()` call, because WR-24 counts every `homedir()` call as a possible kit-home read.
- **Fix:** Re-pinned both reach sizes with the functions named. The `homedir()` call moved into `doctor()` and is passed to `doctorDeclaredSkills`, so it sits in doctor() with the doctor's other named exemptions. It is classed `home` in `ENV_READ_TABLE` and has one `WR24_EXEMPT` row, `doctor :: homedir()`, with the reason that it is the user's home for skill folders and never a kit home. The declared skills are still read from `DOCTOR_KIT_HOME`, so the doctor still reads one kit home. **For human review:** the census comment says another read of this run's kit home in the doctor is "a stop for the human". This call does not read a kit home, but it adds a row to a table that comment guards, so a human should confirm the classification.
- **Committed in:** `cb177a5c`

**Total deviations:** 3 auto-fixed (all Rule 3). **Impact:** test pins and one import changed. Behavior is as planned, with no change to counters, `--strict` or the exit matrix.

## Issues Encountered

- Two failures are known baseline reds, matched by name against `41-VALIDATION.md` § Known baseline reds. The first is `installer-fs-census` "every node:fs export ... classified": `openAsBlobSync` on Node v26. The second is `check-foundation-guards` LANG-07 "every remaining floor item's LIVE COUNT is DERIVED": the walk strays into the pre-existing untracked `~/` directory. This plan added no failure.
- Verification run, apart from those two: skills-doctor 11/11. The Task 2 set plus agents-record ran 493 of 494, the one failure being the baseline red. The 12 other doctor-related install test files ran 1702 passed before the census re-pin, and their only failures were the agents-record census rows fixed in Task 2. check-foundation-guards ran 343/344 (one baseline red). canonical-frontmatter, kit-model, check-claim-anchors and generate-role-adapters ran 246/246. Also passing: `npm run typecheck`, `npm run freshness`, `npm run check:build-parity` (after the commit), `node scripts/check-foundation-guards.js`, banned-claims, residual-citations, claim-anchors and public-docs.

## Known Stubs

None. The plugin lookups, the override-variable "not checked" case and the reader-refusal line are scheduled for plan 42-08 by design. Until then, a set override variable (for example `CLAUDE_CONFIG_DIR`) is not consulted: the default user folders are checked.

## Threat Flags

None beyond the plan's register (T-42-06, T-42-08, T-42-09, T-42-26 are mitigated as planned).

## User Setup Required

None.

## Next Phase Readiness

Plan 42-08 can add the Claude Code plugin lookup, the Antigravity CLI plugin folders, the not-checked cases and the reader-refusal line inside `doctorDeclaredSkills`. It can also move the reader cases to `scripts/role-skills-reader.test.ts`. Plan 42-07 can render `HOST_SKILL_DIRS` into docs/skills.md.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED
