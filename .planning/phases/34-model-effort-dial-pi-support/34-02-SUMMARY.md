---
phase: 34-model-effort-dial-pi-support
plan: 02
subsystem: tooling/installer
tags: [typescript, installer, host-tools, registry, pi, set-literal-drift, vitest]

requires:
  - phase: 33.1-phase-33-leftovers-guard-bypasses-first
    provides: "the installer test harness (runInstall, DRY_RUN), the installer fs census, the install/ never imports scripts/ rule (D-18/D-28)"
provides:
  - "install/host-tools.ts: HOST_TOOLS (6 rows, Pi included), HOST_TOOL_COUNT pin, HostTool, HOST_ADAPTER_KINDS, HostDispatch, PI_PROMPT_REL = .pi/prompts/grugops.md; pure data, no imports"
  - "detectTools() in install/install.ts derived from HOST_TOOLS in registry order; existing hosts' output byte-identical"
  - "the installer's closing host line names every sequential-dispatch registry host instead of a hand-typed count"
  - "install/host-tools.test.ts: per-row detection through the committed install.js, registry integrity cases, closing-line case"
affects: [34-04, 34-06, 34-07, 34-08, 34-09]

actuals:
  tokens: 6915
  tasks: 2
  commits: 4
plan_head_before: 8289e70b727e695c7d43a20a15b50573cf42bae1
plan_head_after: 3e9671d7c0fe22347949bccc758b87e47f7eee96

tech-stack:
  added: []
  patterns:
    - "one registry with a pinned count asserted two-sided; per-row test cases generated from the registry after the count assertion"
    - "installer output lines that enumerate hosts are computed from the registry, never typed"

key-files:
  created:
    - install/host-tools.ts
    - install/host-tools.js
    - install/host-tools.test.ts
  modified:
    - install/install.ts
    - install/install.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "HOST_TOOLS is typed `readonly HostTool[]` (not `as const`), so the interface is the contract every later consumer reads; HostDispatch is a two-member union `spawn | sequential`"
  - "The closing host sentence moved to its own console line with the ten-space indentation, after `rules, so a plugin-only install gets none.`, so the derived list does not make one very long line"
  - "An extra integrity case asserts every detect path is target-root-relative POSIX (no leading /, ~, drive letter, backslash or ..), making the plan's no-user-level-location prohibition a test, not only a comment"

patterns-established:
  - "A new install/*.ts module moves NON_TEST_MODULE_COUNT in scripts/check-foundation-guards.test.ts; the pin is re-derived from git ls-files with an owner-answer note, never incremented"

requirements-completed: [HOST-01, PI-02]

coverage:
  - id: D1
    description: "One registry, HOST_TOOLS, owns the supported host set (id, name, shortName, detect, entryFiles, adapter, dispatch) with HOST_TOOL_COUNT asserted two-sided; Pi is a row detected by a target-root `.pi`; PI_PROMPT_REL exported"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#HOST_TOOLS integrity (plan 34-02)"
        status: pass
      - kind: other
        ref: "mutation run: 7 registry mutations, each turned its target case red (see Mutation run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Installer detection derived from the registry: a target holding only one row's signal prints `tools detected: <id>`, an empty target prints `none-detected`, all signals print every id in registry order"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/host-tools.test.ts#detectTools() is derived from HOST_TOOLS (plan 34-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The installer's closing host line names Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, Pi from the registry with no count word"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/host-tools.test.ts#a DRY_RUN install prints one closing line ending `get documentation only.` that names every non-spawn host, in registry order"
        status: pass
    human_judgment: false

duration: 50min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 02: Host-tool registry and registry-derived installer detection Summary

**`install/host-tools.ts` now owns the supported host set as six registry rows (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, Pi) with a two-sided count pin. `detectTools()` and the installer's closing host line are computed from it, so a target holding `.pi` is reported as `pi` by the committed install.js.**

## Performance

- **Duration:** 50 min (about 31 min of that was two full-suite runs)
- **Started:** 2026-10-06T11:34:39Z
- **Completed:** 2026-10-06T12:25:27Z
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- `install/host-tools.ts` is pure data and has no import statement. It exports `HOST_ADAPTER_KINDS` (`claude-kit`, `none`, `gemini-settings`, `copilot-pointer`, `pi-prompt-template`) with its derived type, the `HostTool` interface, `HostDispatch`, `PI_PROMPT_REL = ".pi/prompts/grugops.md"` (D-16), `HOST_TOOLS`, and `HOST_TOOL_COUNT = 6`. The row order matches the old hand-written detection, and Pi is appended last.
- `detectTools()` filters `HOST_TOOLS` with `existsSync(join(TARGET, ...t.detect.split("/")))`. It keeps the one-space join and the `none-detected` answer. Output for the existing hosts is byte-identical: the all-signals case pins `tools detected: claude codex gemini opencode copilot pi`.
- The closing note no longer says "The other four CLIs get documentation only." It now prints `The other host CLIs (Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, Pi) get documentation only.`, built from the rows whose `dispatch` is `sequential`.
- The registry is held by tests that fail on any drift in count, uniqueness, adapter vocabulary, spawn row, entry files, detect-path shape, or Pi template location.

## Task Commits

1. **Task 1 (tracer): registry → detectTools() → run banner** - `96e4234d` (feat)
2. **Task 2: registry integrity and the derived closing host line** - `23f903ce` (test, RED) + `02e28224` (feat, GREEN)
3. **Deviation (Rule 3): module-count re-pin** - `3e9671d7` (test)

**Plan metadata:** recorded in the docs commits that follow this file.

Tracer feedback gate: interactive run, `human_verify_mode` end-of-phase, automated-only `<verify>`. After the Task 1 commit the `<verify>` was re-run and passed (2 files, 34 tests), so execution went on to Task 2.

## Files Created/Modified

- `install/host-tools.ts` / `.js` (new): the registry, its count pin, the adapter-kind tuple, `HostDispatch`, and `PI_PROMPT_REL`.
- `install/install.ts` / `.js`: imports `HOST_TOOLS` from `./host-tools.js`. `detectTools()` is derived from the registry, and the closing host line is derived from it.
- `install/host-tools.test.ts` (new): describes "detectTools() is derived from HOST_TOOLS (plan 34-02)" and "HOST_TOOLS integrity (plan 34-02)".
- `scripts/check-foundation-guards.test.ts`: `NON_TEST_MODULE_COUNT` goes from 94 to 95, with a docblock entry for the new module.

## Behaviour bullet to test map (Task 2 acceptance)

All cases are in install/host-tools.test.ts, describe "HOST_TOOLS integrity (plan 34-02)" unless marked (det), which means describe "detectTools() is derived from HOST_TOOLS (plan 34-02)".

| Behaviour | `it` case(s) |
|---|---|
| HOST_TOOLS.length equals HOST_TOOL_COUNT | "HOST_TOOLS.length equals the HOST_TOOL_COUNT pin"; (det) "the registry has exactly HOST_TOOL_COUNT rows, so the per-row cases below run that many times" |
| ids, names, shortNames, detect paths unique | "every row's `id` / `name` / `shortName` / `detect` is unique across the registry" (one case per field) |
| adapter in HOST_ADAPTER_KINDS, every member used | "every row's adapter is a HOST_ADAPTER_KINDS member, and every member is used by at least one row" |
| exactly one spawn row, `claude` | "exactly one row dispatches by `spawn`, and it is `claude`; every other row is `sequential`" |
| entryFiles non-empty with AGENTS.md | "every row's entryFiles is non-empty and contains AGENTS.md" |
| PI_PROMPT_REL under Pi detect + `/`, ends `.md` | "PI_PROMPT_REL sits under the Pi row's detect path and ends with .md" |
| DRY_RUN closing line names every non-spawn name in order | "a DRY_RUN install prints one closing line ending `get documentation only.` that names every non-spawn host, in registry order" |
| (added) detect never a user-level location | "every row's detect path is a target-root-relative POSIX path, never a user-level location" |
| (Task 1) per-signal detection | (det) one case per row, "a target holding only `<detect>` is reported as `tools detected: <id>`" (6 cases), plus "an empty target …", "a target holding every row's signal …", "the all-signals line is byte-identical …" |

## TDD Gate Compliance (Task 2, `tdd="true"`)

- **RED** `23f903ce`: `npx vitest run install/host-tools.test.ts --reporter=tap-flat` exited 1 with 20 passed and 1 failed. The failing case was the closing-line case. Its assertion message was "the closing line names no parenthesised host list: … The other four CLIs get documentation only." `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format `tap`, no report errors). **Semantic assessment:** the target case ran and failed on the planned assertion, for the intended reason: the line was still hand-typed. There was no load, syntax or fixture fault.
- The registry-shape cases passed at RED. The registry already existed from the Task 1 tracer, so a pre-implementation RED was not possible for them. Their RED evidence is the mutation run below.
- **GREEN** `02e28224`: the derived closing line passes. 21/21 in the file.
- **REFACTOR:** none needed.

## Mutation run (the tests discriminate)

Each mutation was a temporary `sed` on both `install/host-tools.ts` and `.js`, reverted with `git checkout --` on those two files. Each one turned the cases listed red:

| Mutation | Red cases |
|---|---|
| `HOST_TOOL_COUNT = 7` | both count cases, plus the uniqueness cases (they assert length against the pin) |
| Gemini `shortName: "Codex"` | `shortName` uniqueness |
| Copilot `adapter: "none"` | adapter vocabulary (the `copilot-pointer` kind is unused) |
| Codex `dispatch: "spawn"` | the one-spawn-row case |
| `PI_PROMPT_REL = ".pi-prompts/grugops.md"` | the PI_PROMPT_REL case |
| Pi `entryFiles: ["CLAUDE.md"]` | the entry-files case |
| Pi `detect: "~/.pi/agent"` | the detect-path shape case and the PI_PROMPT_REL case |
| (Task 1) the built `install.js` filter skips `pi` | the `.pi` per-row case, the all-signals case and the literal all-signals case (3 red, 7 green) |

## Decisions Made

- `HOST_TOOLS` is typed `readonly HostTool[]`, so every later consumer reads one interface. `HostDispatch` is `spawn | sequential`.
- The derived closing sentence sits on its own ten-space-indented console line.
- A detect-path shape case was added. It enforces the plan's prohibition that detection never consults a user-level location.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `NON_TEST_MODULE_COUNT` in scripts/check-foundation-guards.test.ts moved from 94 to 95**
- **Found during:** Task 2 full-suite verification
- **Issue:** The foundation-guards census enumerates every non-test `*.ts` in the tree and pins the count. The new `install/host-tools.ts` made it 95, so 6 cases in that file went red ("expected 95 to be 94").
- **Fix:** The pin was re-derived, not incremented: `git ls-files '*.ts'` minus `.test.ts` and `.d.ts` gives 95. A docblock entry in the file's existing style records why. Both owner answers were checked: the module declares no frontmatter parser, builds no `new RegExp` section bound, reads no grant, and renders no spawn verdict.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Verification:** that file passes 300/300. `node scripts/check-foundation-guards.js` reports ALL CHECKS PASSED. The full suite is green.
- **Committed in:** `3e9671d7`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** A pinned module count had to move because a module was added. There is no scope change.

## Issues Encountered

- `npm run check:build-parity` reports the `.js` twins as moved until each commit lands. As in 34-01, it passed after each commit.
- The full suite (e2e lane excluded) takes about 15.5 minutes on this machine.

## Verification (plan-level)

- `npm run build`: exit 0. `npm run check:build-parity`: ALL CHECKS PASSED. `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'` at HEAD `3e9671d7`: 99 files passed; 7209 passed, 2 skipped.
- Task 1 acceptance: `git ls-files install/host-tools.ts install/host-tools.js` lists both files. `grep -c "^import" install/host-tools.ts` prints 0. The per-row cases run 6 times and pass. Empty target gives `none-detected`. All signals give `claude codex gemini opencode copilot pi`. installer-fs-census.test.ts passes.
- Task 2 acceptance: every behaviour bullet maps to a passing case (table above). The DRY_RUN stdout line reads `          The other host CLIs (Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, Pi) get documentation only.`

## Windows safety (D-09)

The new tests build every path with `join` and compare stdout lines only (split on `\r?\n`). They create no symlink, change no mode and rename over no file. The scratch root is a realpath'd mkdtemp, removed in afterAll. This is not yet measured on `windows-latest`. That needs a pushed CI run, and the push is the human's act (D-09).

## Known Stubs

None.

## Threat Flags

None. `detectTools()` still reads presence only (`existsSync`) of fixed registry literals under TARGET (T-34-05 accepted). No package was installed (T-34-SC).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Later plans can import `HOST_TOOLS`, `HOST_TOOL_COUNT`, `HOST_ADAPTER_KINDS` and `PI_PROMPT_REL` from `install/host-tools.js`. Scripts importing `../install/host-tools.js` is the deliberate new edge (RESEARCH A5).
- Any further new `*.ts` module in later plans must move `NON_TEST_MODULE_COUNT` in scripts/check-foundation-guards.test.ts the same way.

## Self-Check: PASSED

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-06*
