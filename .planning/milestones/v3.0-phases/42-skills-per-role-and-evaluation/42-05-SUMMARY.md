---
phase: 42-skills-per-role-and-evaluation
plan: 05
subsystem: installer
tags: [doctor, install-check, claude-code-version, engineer-levels]

requires:
  - phase: 42
    provides: "42-02 and 42-08: the doctor's advisory-only line pattern (docReport), hermeticEnv and RunOptions.env"
provides:
  - CLAUDE_CODE_LEVEL_FLOOR ("2.1.293") in install/host-tools.ts, the one install-side spelling of the floor
  - doctorClaudeVersion in install/install.ts, run by --check only when Claude Code is installed
  - install/claude-version-doctor.test.ts, fake-claude tests under a scratch PATH
  - install/README.md probe sentences and the **Advisory lines.** bullet
affects: [42-07]

actuals:
  tokens: 9240
  tasks: 2
  commits: 4
plan_head_before: a906a1a887674744783d67710006af2f9a9f50ed
plan_head_after: dbad8dd2cfa48806408e1af465e647800d31e2f8

tech-stack:
  added: []
  patterns:
    - "the installer's one PATH-resolved spawn: only when its host is installed, no shell, one fixed argument, stdin ignored, a timeout and an output cap, and only parsed digits of the output printed"

key-files:
  created:
    - install/claude-version-doctor.test.ts
  modified:
    - install/host-tools.ts
    - install/host-tools.js
    - install/install.ts
    - install/install.js
    - install/README.md
    - scripts/tier-kit-text.test.ts
    - install/agents-record.test.ts
    - install/message-references.test.ts

key-decisions:
  - "Versions are compared as three BigInt components, so a long digit run stays exact and 2.1.1000 is above 2.1.293"
  - "A spawn error other than ENOENT, EINVAL or ETIMEDOUT, and a child stopped by a signal, also print `not checked` with the reason (the plan lists four reasons; these two cases would otherwise have no line)"
  - "The MSG-1 reference census classes the fragment `is below v` as `not a line reference`: it compares a version, it does not point at another line"

patterns-established:
  - "A fake host binary for a doctor test is a #!/bin/sh script in the hermetic PATH folder, mode 0755, skipped on win32; a timeout case uses `exec` so the timeout signal reaches the sleeping process"

requirements-completed: [SKILL-05]

coverage:
  - id: D1
    description: "With Claude Code installed, --check prints one advisory line below v2.1.293 and one ok line at or above it; versions compare as three integers"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#tracer: a claude below the floor gives one advisory line, one at the floor gives one ok line, and the exit code does not move"
        status: pass
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#versions compare as three integers: 2.1.1000 and 2.2.0 meet the floor, 1.9.999 is below it"
        status: pass
      - kind: manual_procedural
        ref: "node install/install.js --check --target <scratch Claude Code install> with the real claude 2.1.325 on PATH: `ok  Claude Code 2.1.325 meets the v2.1.293 floor`, ALL CHECKS PASSED, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "An absent claude, a timeout, a non-zero exit and an unparsable first line each print `the Claude Code version was not checked: <reason>`; the exit code and --strict never move"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#with no claude on PATH the version is not checked: `claude` was not found on PATH"
        status: pass
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#a claude that does not finish within 5 seconds is not checked"
        status: pass
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#a claude that exits 3 is not checked, naming the exit status"
        status: pass
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#a first line with no version number is not checked, and the exit code does not move"
        status: pass
    human_judgment: false
  - id: D3
    description: "No byte of claude's raw output reaches the doctor's output; without Claude Code installed, claude is never run"
    requirement: SKILL-05
    verification:
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#only the parsed version digits reach the output: an ESC sequence after the version is not printed"
        status: pass
      - kind: integration
        ref: "install/claude-version-doctor.test.ts#without Claude Code installed no version line is printed and claude is never run"
        status: pass
    human_judgment: false
  - id: D4
    description: "install/README.md says what the probe runs (the first claude on PATH, no shell) and that advisory lines never change the exit code or count under --strict"
    requirement: SKILL-05
    verification:
      - kind: unit
        ref: "install/claude-version-doctor.test.ts#says what the probe runs and what it prints"
        status: pass
      - kind: unit
        ref: "install/claude-version-doctor.test.ts#the --check list has an Advisory lines bullet: never changes the exit code, never promoted by --strict"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-22: names the Claude Code v2.1.293 floor, the Haiku 4.5 effort `UNKNOWN - verify`, and that --check probes the version"
        status: pass
    human_judgment: false
  - id: D5
    description: "On Windows an npm-installed claude is usually a .cmd shim that Node refuses to spawn without a shell, so the line there is `not checked`"
    verification: []
    human_judgment: true
    rationale: "Research assumption A3 ([ASSUMED]); the fake-binary cases skip on win32 and no Windows run was made"

duration: 12min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 05: Claude Code version probe in --check Summary

**When Claude Code is installed, `install.js --check` now runs `claude --version` once (no shell, stdin ignored, 5 s timeout, 64 KiB cap) and compares the version with `CLAUDE_CODE_LEVEL_FLOOR` (2.1.293). Below the floor it prints one `advisory` line, at or above it an `ok` line, and when it cannot read a version it prints `the Claude Code version was not checked: <reason>`. None of these lines changes the exit code or counts under `--strict`.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-16T14:24:52Z
- **Completed:** 2026-11-16T14:36:26Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `CLAUDE_CODE_LEVEL_FLOOR = "2.1.293"` in `install/host-tools.ts`. Its comment names its source, code.claude.com/docs/en/model-config, as install/README.md records it.
- `doctorClaudeVersion` in `install/install.ts` runs `spawnSync("claude", ["--version"], { shell: false, ... })` after the declared-skills section, only when `claudeInstalled` is true. It reads the first stdout line with `^(\d+)\.(\d+)\.(\d+)\b` and compares the three integers. It prints only the parsed digits, through `docReport` only. The header comment that lists the installer's `node:child_process` uses now names this PATH-resolved spawn and the limits on it.
- install/README.md: the floor paragraph now says what `--check` runs and prints, instead of "does not probe the Claude Code version yet". A new **Advisory lines.** bullet in the `--check` list says an `advisory` line never changes the exit code and `--strict` does not promote it.
- Manual run: a scratch Claude Code install, checked with the real `claude` 2.1.325 on PATH, printed `ok  Claude Code 2.1.325 meets the v2.1.293 floor for the junior engineer level` and ended `ALL CHECKS PASSED` at exit 0.

## Task Commits

1. **Task 1 RED:** `2861f183` (test) failing tracer: floor constant and below/at-floor lines
2. **Task 1 GREEN (tracer):** `36a4c9cc` (feat) the floor constant, the probe and the census re-pins
3. **Task 2 RED:** `5ee71b41` (test) the probe edge cases and the failing README pins; tier-kit-text D-22 moved
4. **Task 2 GREEN:** `dbad8dd2` (docs) the README sentences and the Advisory lines bullet

## TDD

- **RED 1** (`2861f183`): 2 of 2 failed on planned assertions: `CLAUDE_CODE_LEVEL_FLOOR` was `undefined`, and the check printed 0 version lines where 1 was expected. This is valid RED evidence. `workflow.tdd_mode` is false, so the classifier gate was not run.
- **GREEN 1** (`36a4c9cc`): 34 of 34 passed in the Task 1 verify set (claude-version-doctor + skills-doctor); the fake-binary case ran on Linux and was not skipped. Tracer gate (end-of-phase mode, automated verify only): the verify was re-run, it passed, and work expanded to Task 2.
- **RED 2** (`5ee71b41`): the 3 README cases in claude-version-doctor and the tier-kit-text D-22 case failed, on the README text. The 7 new probe cases passed at RED, because Task 1's implementation already held every cannot-check branch (see Deviations). To show those cases discriminate, `install/install.js` was mutated twice in place: the probe made unconditional, and the raw first line printed in place of the digits. Under the mutations the ESC case and the "claude is never run" case failed, and so did the tracer and the three-integer case. The file was then restored with `git checkout -- install/install.js` and rebuilt, with no diff.
- **GREEN 2** (`dbad8dd2`): the Task 2 verify set gave 305 of 306. The one failure is the known `openAsBlobSync` baseline red.
- **REFACTOR:** none.

## Files Created/Modified

- `install/claude-version-doctor.test.ts`: 13 cases. These cover the floor constant, the tracer, three-integer comparison, the four not-checked reasons, ESC stripping, the never-run case without Claude Code, and the README pins.
- `install/host-tools.ts` / `.js`: `CLAUDE_CODE_LEVEL_FLOOR`
- `install/install.ts` / `.js`: `doctorClaudeVersion`, its call in `doctor()`, and the header paragraph
- `install/README.md`: the floor paragraph's last sentences and the **Advisory lines.** bullet
- `scripts/tier-kit-text.test.ts`: the D-22 case now pins that `--check` probes the version, and keeps its `v2.1.293` and `Haiku 4.5` assertions
- `install/agents-record.test.ts`: `DOCTOR_REACH_SIZE` 75 -> 77 and `WR24_REACH_SIZE` 66 -> 67, each with a dated reason
- `install/message-references.test.ts`: one `not a line reference` row for `is below v`; the counts move (install.ts 29 -> 30, "not a line reference" 2 -> 3)

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Doctor reach censuses in install/agents-record.test.ts**
- **Found during:** Task 1
- **Issue:** The new function and its local `notChecked` grow the DI-19 reach set (75 -> 77). The function also grows the WR-24 reach set (66 -> 67).
- **Fix:** Re-measured and re-pinned with dated reasons. The function reads no marker, no kit home, no file and no named environment variable, and it calls no `homedir()`, so no DI-19 row or C3 row changes.
- **Committed in:** `36a4c9cc`

**2. [Rule 3 - Blocking] MSG-1 reference census in install/message-references.test.ts**
- **Found during:** Task 1
- **Issue:** The census's REFERENCE regex matches the word `below`, so the planned line text `is below v2.1.293` counted as an unclassified pointer to another line.
- **Fix:** Added one row, classed `not a line reference` (the class already holds two directory-sense "below" fragments), and moved the counts. The planned wording is unchanged.
- **Committed in:** `36a4c9cc`

**3. [Rule 2 - Missing critical] Two more not-checked reasons**
- **Found during:** Task 1
- **Issue:** The plan names four reasons. A spawn error with another code (for example EACCES or ENOBUFS) and a child killed by a signal without a timeout would have printed no line at all, or a wrong verdict.
- **Fix:** ``the Claude Code version was not checked: `claude --version` could not be run (<code>)`` and ``... was stopped by the signal <signal>``. Both are advisory, and both print only an error code or a signal name, never child output.
- **Committed in:** `36a4c9cc`

**4. [Ordering] The cannot-check branches landed in Task 1, not Task 2**
- **Found during:** Task 1
- **Issue:** The plan has Task 2 "finish the cannot-check branches". Task 1 wrote the whole probe, so Task 2 made no install.ts change. Its probe cases passed at RED (see TDD, RED 2, for the mutation check that shows they discriminate).
- **Committed in:** `36a4c9cc`

**Total deviations:** 4 (2 Rule 3, 1 Rule 2, 1 ordering). **Impact:** test pins moved and two not-checked reasons were added. The counters, `--strict` and the exit matrix did not change. The plan text names no recommended skill or ui-ux-pro-max, so the 42-04 ratify-none note needed no change here.

## Issues Encountered

- Known baseline red, matched by name: `installer-fs-census` "every node:fs export ... classified" (`openAsBlobSync`, Node v26). No other failures.
- Verification:
  - Task 1 verify: 34 of 34 passed.
  - Task 2 verify set: 305 of 306 passed (the one baseline red).
  - A wider batch of 12 files that read install/README.md or move with the doctor, agents-record and skills-doctor among them: 830 of 830 passed.
  - `npm run typecheck`, `npm run freshness` (92 `.js` fresh), `npm run check:build-parity`, `node scripts/check-banned-claims.js`, check-public-docs-vocabulary, check-claim-anchors, check-kit-refs, check-imperative-lexicon and check-foundation-guards all ended `ALL CHECKS PASSED`.
- Acceptance greps: `spawnSync("claude"` 1, `shell: true` 0, `CLAUDE_CODE_LEVEL_FLOOR` in host-tools.ts 1, `Claude Code version yet` in the README 0, `**Advisory lines.**` 1, `claude --version` in the README 1.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-42-15 is mitigated as planned: the spawn runs only for an installed Claude Code, with no shell, `--version` only, stdin ignored, a 5 s timeout and a 64 KiB cap, and the README says it runs the first `claude` on PATH. T-42-16 is mitigated: only digits are printed, and the ESC test shows it. T-42-17 is mitigated: each not-checked reason has a test. The residual risk (a planted `claude` earlier on PATH runs) is accepted and documented in the README.

## User Setup Required

None.

## Next Phase Readiness

Plan 42-07 can document the version line and the Advisory lines rule in docs/skills.md if it needs them. The Windows `.cmd` shim behavior (D5) is still an assumption for verify time.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED
