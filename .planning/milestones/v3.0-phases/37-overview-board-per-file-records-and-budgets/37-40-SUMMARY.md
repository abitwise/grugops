---
phase: 37-overview-board-per-file-records-and-budgets
plan: 40
subsystem: installer
tags: [installer, runnables, esm, package-json, node, commonjs-host, gap-closure]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-13's three state runnables in RUNNABLES; plan 37-39 (round 3 close)"
provides:
  - "install/runnable-package.json: the kit source of tools/grugops/package.json, {\"type\":\"module\"} and one LF (18 bytes)"
  - "a ninth RUNNABLES row and its RUNNABLES_MIRROR row: install/runnable-package.json -> tools/grugops/package.json"
  - "commonjs-host regression over every program of RUNNABLES, with its premise control and a typeless-host case"
  - "installer-contract cases for the package file (user file, recorded, idempotent, dry run, unrecorded copy, re-run over a pre-fix install, AUTH-1)"
affects: [37-41, 37-42, install/README.md, CHANGELOG.md, WF05, WF09]

actuals:
  tokens: 9300
  tasks: 2
  commits: 2
plan_head_before: 78416b718b6f7510c295ffe6f1f135f66e011209
plan_head_after: e17cca8af6f6079abaa2e2b5f1d415efec120665

tech-stack:
  added: []
  patterns:
    - "A non-program RUNNABLES row carries a fixed host file beside the programs under the license rule (written only where nothing is, recorded, removed by record, never over a user's file)"
    - "A host-environment regression proves its own premise: the same planted host without the fix reproduces the failure"

key-files:
  created:
    - install/runnable-package.json
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/installer-cross-version.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/record-truth.test.ts
    - install/ledger-provenance.test.ts

key-decisions:
  - "G-37-2 fixed per D-21 through one RUNNABLES row: tools/grugops/package.json holds only {\"type\":\"module\"} and one LF; no --check line (D-21 as amended 2026-10-26); WF05, WF09 and every exit contract unchanged"
  - "The tests are flat it() cases with the `tools/grugops/package.json:` prefix beside the LICENSE cases, not a nested describe, so they share licenseInstall/licenseUninstall, parseMapping and runNode in the same scope"

patterns-established:
  - "The invocation table of a host-run regression is keyed by program basename and checked two-sided against PROGRAM_RELS (derived from RUNNABLES)"

requirements-completed: [SPLIT-05, SPLIT-03, SPLIT-06]

coverage:
  - id: D1
    description: "An install into a commonjs host writes tools/grugops/package.json (byte-equal to the kit file), leaves the host's package.json byte for byte, and every program runs its own body with no load-failure text"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: an install into a commonjs host writes the kit file there, leaves the host's package.json byte for byte, and every program runs its own body (D-21, G-37-2)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: the invocation table has one row per program of RUNNABLES, two-sided"
        status: pass
    human_judgment: false
  - id: D2
    description: "Premise controls: without the package file the commonjs host gives exit 1 and the SyntaxError for every program; a typeless host prints MODULE_TYPELESS_PACKAGE_JSON only when the file is absent"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: premise: the same commonjs host with the package file removed reproduces the crash, exit 1, for every program"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: on a host whose package.json has no type field, no program prints MODULE_TYPELESS_PACKAGE_JSON while the file is there, and each does without it"
        status: pass
    human_judgment: false
  - id: D3
    description: "The installer contract for the package file: user file kept, recorded kit-false, idempotent, dry run, removed by record on uninstall, unrecorded copy left, re-run over a pre-fix install creates only it"
    requirement: SPLIT-06
    verification:
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: (7 contract cases plus the uninstall case)"
        status: pass
    human_judgment: false
  - id: D4
    description: "AUTH-1: MIRROR_PACKAGE_JSON and install/runnable-package.json spell the same bytes; RUNNABLES and RUNNABLES_MIRROR are the same 9-row mapping (7 programs)"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "install/install.test.ts#tools/grugops/package.json: AUTH-1: install.ts's MIRROR_PACKAGE_JSON and install/runnable-package.json spell the same bytes"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false

duration: 73min
completed: 2026-10-27
status: complete
---

# Phase 37 Plan 40: tools/grugops/package.json for commonjs hosts Summary

**The installer now writes `tools/grugops/package.json` (`{"type":"module"}` and one LF) next to the seven programs it copies. It does this through one RUNNABLES row under the license rule. On a host whose own package.json says `"type": "commonjs"`, the programs now reach their own code: before this fix, all seven exited 1 on load, which WF05 and WF09 read as findings (G-37-2, D-21).**

## Performance

- **Duration:** 73 min, of which about 59 min were the two targeted regression runs
- **Started:** 2026-10-27T06:22:54Z
- **Completed:** 2026-10-27T07:36:30Z
- **Tasks:** 2
- **Files modified:** 12 (1 created, 11 modified)

## Accomplishments

- **New kit file and rows.** `install/runnable-package.json` (18 bytes) is the kit source. One RUNNABLES row in install.ts and the same row in RUNNABLES_MIRROR in uninstall.ts copy it to `tools/grugops/package.json`. The comment above RUNNABLES now says two rows are not programs.
- **commonjs-host regression.** It runs every program derived from RUNNABLES against a measured invocation table, and checks the table two-sided against PROGRAM_RELS. It has a premise control (the same host without the file reproduces the crash) and a typeless-host case for `MODULE_TYPELESS_PACKAGE_JSON`.
- **Installer contract.** Each clause has its own case: user file, recorded, idempotent, dry run, uninstall by record, unrecorded copy, re-run over a pre-fix install, and AUTH-1 byte equality. There are 12 `tools/grugops/package.json:` cases in all.
- **No new `--check` line.** WF05, WF09 and every exit contract are unchanged.

## Task Commits

1. **Task 1 (tracer): the package file reaches a commonjs host through one RUNNABLES row** - `75ed60ae` (fix)
2. **Task 2: the installer contract for the package file, clause by clause** - `e17cca8a` (test)

**Plan metadata:** see the docs(37-40) commit that adds this SUMMARY.

## Task 1 RED run (before the row existed)

The tracer, premise, typeless and uninstall cases were written first and run against HEAD `78416b71`:

```
npx vitest run install/install.test.ts -t "tools/grugops/package.json"   -> exit 1
 × ...an install into a commonjs host writes the kit file there...      Error: ENOENT ... <target>/tools/grugops/package.json
 × ...premise: the same commonjs host with the package file removed...  Error: ENOENT ... lstat <target>/tools/grugops/package.json
 × ...on a host whose package.json has no type field...                 AssertionError: tools/grugops/host-protection.js: expected 'HOST-PROTECTION: the check could not …' not to contain 'MODULE_TYPELESS_PACKAGE_JSON'
 × ...uninstall removes it by its record...                             AssertionError: expected false to be true
 Tests  4 failed | 1 passed | 444 skipped (449)
```

The one case that passed is the table-keys case, which is a pure check. After the row was added and the build rerun, `-t "tools/grugops/package.json|are the same mapping"` gave `Tests 6 passed`. The tracer gate (interactive, end-of-phase, automated-only verify) re-ran the verify after the commit and it was green.

## The invocation table, as measured (Node v26.11.1, 2026-10-27)

Each program was run in a scratch install into an empty target whose package.json is `{"name":"host","version":"1.0.0","type":"commonjs"}`. The command was `node <target>/tools/grugops/<prog> <args>`, with cwd the target and env PATH only. All seven match the planning measurement; no row differs.

| Program | Args | Without the file | With the file |
|---------|------|------------------|---------------|
| reference-check.js | (none) | exit 1, `Cannot use import statement outside a module` | exit 2, `Error: no input file path was provided. Usage: ...` |
| test-skip-integrity.js | (none) | exit 1, same | exit 2, `Error: no registry file path was provided. Usage: ...` |
| uat-spec-integrity.js | `<target>` | exit 1, same | exit 2, `ZERO uat specs were visited (0 derived)` |
| host-protection.js | `--brnach x` | exit 1, same | exit 2, `unknown argument: --brnach` (refused before any gh call) |
| state-check.js | `<target>` | exit 1, same | exit 0, `No findings.` |
| trace-render.js | `<target>` | exit 1, same | exit 0, `Rendered the trace: 0 task(s) ...; 0 file(s) written, 0 file(s) removed.` |
| state-roll.js | `<target> --dry-run` | exit 1, same | exit 0, `Nothing to roll: ...` / `Dry run: nothing would move; nothing was written.` |

**Premise transcript.** Without the file, each program prints `Warning: Failed to load the ES module: ... Make sure to set "type": "module" in the nearest package.json file`. It then prints the source line of its first `import` and `SyntaxError: Cannot use import statement outside a module`, and exits 1. Example from state-check: `state-check.js:140 import * as nodeFs from "node:fs";`. The premise case in the suite asserts exit 1 and that text for all seven.

**Typeless host.** A host package.json `{"name":"host","version":"1.0.0"}` with the file gives 0 `MODULE_TYPELESS_PACKAGE_JSON` lines; without the file, state-check gives 1. The suite asserts this for all seven programs in both directions.

## Moved pins (old -> new), each with a dated reason comment

| Pin | File | Old | New |
|-----|------|-----|-----|
| RUNNABLE_RELS / mirror length | install/install.test.ts (same-mapping case) | 8 | 9 (PROGRAM_RELS stays 7) |
| source-side length | install/install.test.ts (same-mapping case) | 8 | 9 |
| non-program rows | install/install.test.ts (same-mapping case) | `[["LICENSE", LICENSE_REL]]` | `[["LICENSE", LICENSE_REL], ["install/runnable-package.json", PACKAGE_REL]]` |
| never-installed `rec.files` | install/install.test.ts | 18 | 19 |
| RECORDED_FILE_COUNT (+ `_WHY` part `tools/grugops/package.json`) | install/installer-cross-version.test.ts | 42 | 43 |
| WRITE_PATH_COUNT | install/installer-never-installed.test.ts | 114 | 115 |
| READ_PATH_COUNT | install/installer-special-files.test.ts | 76 | 77 |
| INSTALLED_FILE_COUNT | install/installer-user-edit.test.ts | 74 | 75 |
| REMOVABLE_COUNT | install/record-truth.test.ts | 44 | 45 |
| CREATED (and the test title) | install/ledger-provenance.test.ts | 18 | 19 (REMOVED_DIRS unchanged at 22) |

Each new value is the one the failing run printed (`expected 43 to be 42`, `expected 115 to be 114`, `expected 77 to be 76`, `expected 75 to be 74`, `expected 45 to be 44`, `expected 19 to be 18`). The five installer-cross-version ledger cases took RECORDED_FILE_COUNT. One of them printed `expected 42 to be 41`: that case counts RECORDED_FILE_COUNT − 1 (one edited adapter is left), so no separate pin moved. `install/installer-dry-run.test.ts` was in the run and needed no change, and no other file's pin moved.

## Task 2: RED evidence and the AUTH-1 mutation (neither committed)

The seven contract cases passed on first run, because the production row landed in Task 1 and the plan expects no production change in Task 2. To show the cases can see the behaviour, the RUNNABLES row was removed from install.ts and the build rerun (a temporary mutation):

- `-t "tools/grugops/package.json"` -> exit 1, `Tests 10 failed | 2 passed`. All six behavioural contract cases and the four Task 1 cases went red. Only the table-keys case and AUTH-1 stayed green, as expected.
- The target case `install records it once ...` was run with `--reporter=tap-flat` and failed with `AssertionError: []: expected +0 to be 1`. Run through `gsd_run check tdd-red-evidence`, the record gave **`RED_EVIDENCE_OK` (target_test_failed)**. Semantic assessment: the target test ran, and it failed on its planned assertion (no ledger entry for the package file) for the intended reason (install did not write or record it).
- Restored: install.ts was copied back, the build rerun, `install/install.js` matched the pre-mutation build (`cmp` clean), and `git diff HEAD` was empty for both files.

**AUTH-1 mutation.** `install/runnable-package.json` was set to `{"type": "module"}\n` (a space after the colon):
- `-t "AUTH-1"` -> `× ...AUTH-1...` / `AssertionError: expected '{"type":"module"}\n' to be '{"type": "module"}\n'`, `Tests 1 failed`.
- After restoring, `git diff HEAD` was empty, and the rerun gave `Tests 1 passed`.

## Re-run over a pre-fix install (transcript)

A scratch target was installed at the start of this plan, before the row existed: commonjs host, scratch GRUGOPS_HOME and HOME. A plain re-run of the new install.js over it printed:

```
-- runnables --
  skipped        tools/grugops/reference-check.js (target already has it)
  skipped        tools/grugops/test-skip-integrity.js (target already has it)
  skipped        tools/grugops/uat-spec-integrity.js (target already has it)
  skipped        tools/grugops/host-protection.js (target already has it)
  skipped        tools/grugops/state-check.js (target already has it)
  skipped        tools/grugops/trace-render.js (target already has it)
  skipped        tools/grugops/state-roll.js (target already has it)
  skipped        tools/grugops/LICENSE (target already has it)
  created        tools/grugops/package.json
```

After the re-run, `node tools/grugops/state-check.js <target>` gave `No findings.`, exit 0. The suite case asserts this exact section, derived from RUNNABLES, plus the ledger record and the full program table.

## Targeted runs

- **Task 1 final:** 52 files: every `*.test.ts` that greps for a changed basename (`runnable-package`, `install.ts`, `install.js`, `uninstall.ts`, `uninstall.js`, the six pin files and `install.test`), plus the census set. Result: `Tests 10 failed | 5809 passed | 2 skipped`. All 10 failures are in 37-BASELINE.md: installer-fs-census 1, context-io-writer-set 2, context-io 7.
- **Task 2 final (plan-final):** `npm run typecheck` exit 0, `check:build-parity` ALL CHECKS PASSED, then `npx vitest run install/` plus the scripts/ grep set plus the census set (52 files). Result: `Tests 11 failed | 5815 passed`. Ten failures are the same baseline set. The eleventh was `uat-spec-integrity ... POINT 7: no probe root is left under .temp`. My own RED-evidence record at `.temp/37-40-red-evidence.json` caused it. I moved the record to the session scratchpad and removed `.temp`, and the file then gave `Tests 389 passed`.
- After each run, `pgrep -fl vitest` showed no grugops worker of this repository. The only vitest process listed belongs to another project (`grugops-examples/wt-qe-ABC-210`) and was left alone.

## Files Created/Modified

- `install/runnable-package.json`: `{"type":"module"}` and one LF, the kit source of the host file
- `install/install.ts` / `install/install.js`: the RUNNABLES row with its reason comment, and the two-non-program-rows header comment
- `install/uninstall.ts` / `install/uninstall.js`: the RUNNABLES_MIRROR row
- `install/install.test.ts`: the PACKAGE_REL constant, the same-mapping case moved to 9 rows, the 12 `tools/grugops/package.json:` cases, `licenseInstall`'s optional `dryRun` argument, and the `rec.files` pin
- `install/installer-cross-version.test.ts`, `installer-never-installed.test.ts`, `installer-special-files.test.ts`, `installer-user-edit.test.ts`, `record-truth.test.ts`, `ledger-provenance.test.ts`: moved count pins with dated reasons

## Decisions Made

- The cases are flat `it()` calls with the `tools/grugops/package.json:` prefix, placed beside the LICENSE cases. The plan's wording was a "describe block"; flat cases keep `licenseInstall`/`licenseUninstall`, `parseMapping` and `runNode` in one scope, and `-t "tools/grugops/package.json"` selects the same set.
- `licenseInstall` is kept as the one shared helper (no rename) and gains an optional `dryRun` argument for the DRY_RUN case.
- Truth 2's typeless-host clause has its own case, with its own premise direction. The plan's task list named only the commonjs premise.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A RED-evidence file under `.temp/` turned a census test red**
- **Found during:** Task 2 plan-final run
- **Issue:** The TDD RED-evidence record for the classifier must sit inside the project, so I wrote it to `.temp/37-40-red-evidence.json`. `scripts/runnable-ref/uat-spec-integrity.test.ts` POINT 7 asserts that no probe root is left under `.temp`.
- **Fix:** Moved the record to the session scratchpad and removed the `.temp` directory. Nothing was committed.
- **Verification:** `npx vitest run scripts/runnable-ref/uat-spec-integrity.test.ts` gave `Tests 389 passed`.

**2. [TDD note] Task 2's RED came from a mutation, not from tests written before code**
- The plan puts the production row in Task 1, so the Task 2 cases were green on first run (unexpected GREEN, investigated). Their RED was shown by temporarily removing the row (see above; `RED_EVIDENCE_OK`). The commit is `test(37-40):` only. No `feat(37-40):` commit follows it, because Task 1's `fix(37-40):` commit carries the implementation.

---

**Total deviations:** 1 auto-fixed (Rule 3), plus 1 TDD sequencing note.
**Impact on plan:** None on scope. No production change in Task 2: `git show --stat e17cca8a` lists only `install/install.test.ts`.

## Issues Encountered

None beyond the `.temp` residue above.

## Residuals for the round gate (to deferred-items.md, plan 37-42)

1. **Other load-time failures still exit 1.** This fix covers the commonjs-host case only. An older Node, or a preload (`NODE_OPTIONS=--require ...`) that throws, still makes a program exit 1 before its first line, and WF05/WF09 read that as a finding. This sits beside deferred-items.md's open "EXIT-1 siblings outside phase 37".
2. **Host workspace globs (`UNKNOWN - verify`).** An npm or pnpm workspace glob such as `tools/*` would see `tools/grugops/package.json`, a package file with no `name`. How each package manager treats that has not been checked.
3. **An edited program kept after uninstall.** Uninstall removes the package file by its record while keeping a program the user edited. On a commonjs host, that kept program may stop loading.
4. **No `--check` signal for pre-fix repositories.** A repository installed before this fix gets the file only when install is re-run, and no `--check` line names it (the human's choice, D-21 as amended 2026-10-26). Plan 37-42's changelog entry tells pre-fix repositories to re-run install.

## Known Stubs

None.

## Threat Flags

None. The new file is written under `tools/grugops/` by the existing RUNNABLES mechanism. T-37-92, T-37-93 and T-37-96 are mitigated as planned; T-37-94 and T-37-95 are accepted and listed as residuals 4 and 2.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

Ready for 37-41. Plan 37-42 Task 2 carries the install guide and changelog text for this fix, and the round gate writes the residuals above to deferred-items.md.

## Self-Check: PASSED

- FOUND: install/runnable-package.json (18 bytes; JSON round-trips to `{"type":"module"}`)
- FOUND: `tools/grugops/package.json` in install/install.ts (1) and install/uninstall.ts (1); both were 0 at 78416b71
- FOUND: commit 75ed60ae, commit e17cca8a (both ancestors of HEAD)
- 12 `tools/grugops/package.json:` cases in install/install.test.ts (at least 10 required), all green
- `git rev-list --count 78416b71..e17cca8a` = 2

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-27*
