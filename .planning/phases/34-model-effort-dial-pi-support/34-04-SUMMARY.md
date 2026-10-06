---
phase: 34-model-effort-dial-pi-support
plan: 04
subsystem: tooling/installer
tags: [typescript, installer, pi, prompt-template, install-ledger, dc-2, dc-3, vitest]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-02: install/host-tools.ts PI_PROMPT_REL = .pi/prompts/grugops.md, HOST_TOOLS imported by install.ts"
  - phase: 33.1-phase-33-leftovers-guard-bypasses-first
    provides: "readForWrite, writeTargetFile (exclusive create), recordCreatedFile/writtenFileRecord, the one install ledger with owns(path), the derived installer class tests (deriveWritePaths)"
provides:
  - "install/install.ts PI_PROMPT_TEXT: pointer-only Pi template (description, argument-hint, COPILOT_PTR reused, Request: $ARGUMENTS)"
  - "install/install.ts writePiPromptTemplate(): readForWrite gate, skip an existing file, DRY_RUN would-add, exclusive create, kit-false ledger file entry; called unconditionally after the Copilot pointer"
  - "Every installed target gets .pi/prompts/grugops.md (Pi users type /grugops <request>), reversed by uninstall through the ledger walk alone"
  - "Derived installer class tests re-pinned by derivation to include the Pi path"
affects: [34-06, 34-08, 34-10]

actuals:
  tokens: 6820
  tasks: 3
  commits: 4
plan_head_before: 1b7d478799a62d8e1f8b2e7cf4600554a26b3ae3
plan_head_after: acbd9bc5b26da76b819cfb4b7a6df2c94418850d

tech-stack:
  added: []
  patterns:
    - "A new install-created file is a whole-file exclusive create behind readForWrite, recorded only after the create succeeded; uninstall needs no new code"
    - "A pinned derived count moves only with the derived listing line quoted in its comment"

key-files:
  created:
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md
  modified:
    - install/install.ts
    - install/install.js
    - install/install.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-user-edit.test.ts
    - install/installer-special-files.test.ts
    - install/installer-cross-version.test.ts
    - install/record-truth.test.ts
    - install/installer-dry-run.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-fs-census.test.ts
    - install/ledger-provenance.test.ts

key-decisions:
  - "The Pi template reuses COPILOT_PTR as its start-here line, so there is one spelling of that sentence for the Copilot pointer and Pi"
  - "The skipped/would-add/created report lines put PI_PROMPT_REL first and append `(Pi prompt template...)`, so the existing `first token is the path` parsers in the tests read them"
  - "installer-write-set.test.ts POINTER_FILES is left unchanged: it excludes only the two files whose block uninstall removes by presence on a marker-less target; the Pi template is governed by the ledger alone, so its inclusion in `governed` through fileRecords(marker, false) is correct"
  - "No class-wide 'install over a planted user file' test was added; the gap is recorded in deferred-items.md and the Pi path is covered by a targeted case"

patterns-established:
  - "New install-written path: run the derived class tests, read each failing pin's derived listing, re-pin with date + plan + paths + reason"

requirements-completed: [PI-02, PI-03]

coverage:
  - id: D1
    description: "Every install creates .pi/prompts/grugops.md with exact pointer bytes (frontmatter, start-here sentence, Request: $ARGUMENTS) and nothing else under .pi; ledger has a kit-false file entry and dir entries for .pi and .pi/prompts; uninstall removes .pi entirely"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > lifecycle: install writes the exact pointer bytes and ledger entries; uninstall removes `.pi` entirely"
        status: pass
    human_judgment: false
  - id: D2
    description: "A user-authored template at the path is skipped, unclaimed and survives uninstall; a user's own .pi/ and .pi/settings.json are never claimed or removed"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a user-authored template already at the path is skipped, keeps its bytes, gets no ledger entry, and survives uninstall unchanged"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a user's own `.pi/` gets only the template added; uninstall removes the template and `.pi/prompts` and leaves `.pi/` and its settings byte-identical"
        status: pass
    human_judgment: false
  - id: D3
    description: "DRY_RUN install names the template would-add and writes nothing; DRY_RUN uninstall after a real install names it for removal (flow 10)"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a DRY_RUN install of an empty target names the template `would-add` and creates no `.pi`"
        status: pass
      - kind: integration
        ref: "install/installer-dry-run.test.ts#flow 10: DRY_RUN uninstall after a fresh install into an EMPTY target (no CLAUDE.md)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Re-install is a no-op that keeps the claim while the file is unchanged; a user edit is left by uninstall and drops the claim on re-install"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a second install is a no-op for the template (skipped, bytes unchanged) and keeps its ledger entry; uninstall still removes it"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a user edit to the installed template is kept by uninstall and reported `left`"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#Pi prompt template (plan 34-04) > a re-install after a user edit drops the ledger claim on the template, and leaves the edit"
        status: pass
    human_judgment: false
  - id: D5
    description: "The derived DC-2/DC-3 class tests include the Pi path by derivation, with every moved pin re-pinned from its derived listing; mutations (ii) and (iii) turn them red"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "npx vitest run install/installer-never-installed.test.ts install/installer-user-edit.test.ts install/installer-special-files.test.ts install/installer-cross-version.test.ts install/record-truth.test.ts (261/261)"
        status: pass
      - kind: other
        ref: "full suite npx vitest run --exclude '**/scripts/e2e/**' at acbd9bc5: 99 files, 7260 passed, 2 skipped"
        status: pass
    human_judgment: false
  - id: D6
    description: "Pi users can actually invoke /grugops from an installed repository (Pi loads the template after project trust)"
    verification: []
    human_judgment: true
    rationale: "No Pi CLI is run by this plan or its tests; whether Pi lists and expands the template is a live-host behaviour (34-RESEARCH.md § B cites Pi's docs). Needs a human run of Pi in an installed repository."

duration: 47min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 04: Pi prompt template install path Summary

**Every install now creates `.pi/prompts/grugops.md`, a pointer-only Pi template (`/grugops <request>`) built from the existing Copilot start-here sentence plus `$ARGUMENTS`. It is written by exclusive create behind `readForWrite` and recorded as a kit-false ledger file entry, and uninstall reverses it through the existing ledger walk with no new uninstall code. Seven derived installer pins moved, each re-pinned from its derived listing.**

## Performance

- **Duration:** 47 min (about 30 min of that was two full-suite runs)
- **Started:** 2026-10-06T12:57:47Z
- **Completed:** 2026-10-06T13:44:55Z
- **Tasks:** 3
- **Files modified:** 12 (11 code/test files, plus the new deferred-items.md)

## Accomplishments

- `PI_PROMPT_TEXT` is `---`, `description: Route a software-delivery request through the grugops Orchestrator.`, `argument-hint: "<request>"`, `---`, `COPILOT_PTR`, `Request: $ARGUMENTS`, with a final newline. It carries no kit-root variable and no resolver slot.
- `writePiPromptTemplate()` handles four cases. `blocked` gives a counted verify and writes nothing. `ok` gives `skipped` and the file is left untouched. `DRY_RUN` gives `would-add`. Otherwise it does `writeTargetFile(..., "create", ...)` and, only on success, `recordCreatedFile(file, writtenFileRecord(...))` plus `created`. It is called unconditionally on the line after the Copilot `ensureBlock(...)` (D-17).
- A real install prints `created .pi/prompts/grugops.md (Pi prompt template)`, and uninstall prints `removed .pi/prompts/grugops.md (recorded in the install ledger)` followed by `rmdir` of `.pi/prompts` and `.pi`. This was observed manually and is asserted in tests.
- grugops writes nothing else under `.pi/`. The lifecycle case asserts that `.pi` holds exactly one file.

## Task Commits

1. **Task 1 (tracer): install writes, records and uninstall removes the Pi template** - `465ab738` (feat)
2. **Task 2: derived class tests re-pinned by derivation** - `c20ce923` (test)
3. **Task 3: never overwrite / DRY_RUN / idempotent / user `.pi` never claimed** - `d6c2e96a` (test)
4. **Deviation (Rule 3): ledger-provenance re-pin found by the full suite** - `acbd9bc5` (test)

**Plan metadata:** the docs commit that follows this file.

Tracer feedback gate: interactive run, `human_verify_mode` end-of-phase, automated-only `<verify>`. After the Task 1 commit the verify was re-run and passed (1 test), so execution went on to Task 2.

## Re-pinned counts and the derived listing line behind each (Task 2 acceptance)

| Pin | File | Old → new | Derived listing line |
|---|---|---|---|
| `WRITE_PATH_COUNT` | installer-never-installed.test.ts | 85 → 88 | `WRITE_PATHS (88: 59 files and links, 29 directories):` with `.pi`, `.pi/prompts` `[default:dir, symlink:dir, migrate:dir, checkpoints-notify:dir]` and `.pi/prompts/grugops.md [default:file, symlink:file, migrate:file, checkpoints-notify:file]` |
| `INSTALLED_FILE_COUNT` | installer-user-edit.test.ts | 58 → 59 | `INSTALLED_FILES (59, from default, checkpoints-notify, migrate):` … `.pi/prompts/grugops.md  [edited in: default]`; `INSTALLED_DIRS (29)` now names `.pi, .pi/prompts` |
| `READ_PATH_COUNT` | installer-special-files.test.ts | 60 → 61 | `READ_PATHS (61):` … `.pi/prompts/grugops.md` |
| `RECORDED_FILE_COUNT` (+ `_WHY`) | installer-cross-version.test.ts | 31 → 32 | `installer-cross-version: empty-source: 32 file entr(ies) recorded, 32 holding` |
| `REMOVABLE_COUNT` | record-truth.test.ts | 33 → 34 | the assertion's REMOVABLE listing names `.pi/prompts/grugops.md` between `.github/copilot-instructions.md` and `AGENTS.md`: `expected 34 to be 33` |
| file-ownership pin (not in plan) | install.test.ts | 7 → 8 | `[".github/copilot-instructions.md",".pi/prompts/grugops.md","AGENTS.md","CLAUDE.md", 4 tools/grugops runnables]: expected 8 to be 7` |
| `CREATED` / `REMOVED_DIRS` (not in plan) | ledger-provenance.test.ts | 7 → 8 / 13 → 15 | `.github/copilot-instructions.md, .pi/prompts/grugops.md, AGENTS.md, CLAUDE.md, tools/grugops/…: expected 8 to be 7`; dirs: `.claude` ×10, `.gemini, .github, .pi, .pi/prompts, tools/grugops: expected 15 to be 13` |

The plan's assumption A3 predicted +3 / +1 / +1 / +1. The measurements match it, and the last two rows were not predicted. The never-installed test now asserts `PI_PROMPT_REL` (imported from `./host-tools.js`) inside its pointer-file list. Because the class tests derive their plant sets, they now plant at the Pi path without further changes. The never-installed FD variant plants a user file at `.pi/prompts/grugops.md`, and both real and DRY_RUN uninstall leave it with zero bytes changed. The special-file test plants a FIFO (non-win32) and a directory there, and it passes within its timeout.

## Mutation runs

Each mutation was a temporary edit of install.ts followed by `npm run build`. Each was reverted with `git checkout -- install/install.ts install/install.js` and a rebuild.

Task 2 (against the five class test files):

| Mutation | Result |
|---|---|
| (i) the `ok` branch overwrites the existing file (`"ok"`-mode write plus a ledger record) instead of skipping | **GREEN, 261/261: not caught by the five class tests.** The plan's literal mutation (swap `"create"` for `"ok"` on the create line) cannot change anything, because readForWrite returns `ok` → skipped before that line is reached. The stronger form was used, and none of the five files installs over a planted regular user file. That gap is recorded in deferred-items.md. In Task 3 this mutation turned 3 targeted Pi cases red (below). |
| (ii) drop `recordCreatedFile` | RED: 6 failed (installer-cross-version ×5: `expected 31 to be 32`, `expected 30 to be 31`; record-truth REMOVABLE ×1). Green after revert. |
| (iii) `if (existsSync(join(TARGET, ".pi"))) writePiPromptTemplate();` | RED: 9 failed across all five files (`expected 85 to be 88`, `58 to be 59`, `60 to be 61`, `31 to be 32`, REMOVABLE). Green after revert. |

Task 3 (against `install.test.ts -t "Pi prompt template"`, 7 cases):

| Mutation | Red cases |
|---|---|
| overwrite (mutation (i) above) | 3: user-authored template skipped; second install no-op; re-install after edit drops claim |
| claim: `ok` branch also records the existing file in the ledger | 2: user-authored template unclaimed; re-install after edit drops claim |
| dryrun: the DRY_RUN return removed | 1: DRY_RUN install creates no `.pi` |

After all reverts the five class files pass 261/261, and the Pi describe passes 7/7.

## Behaviour bullet to test map (Task 3 acceptance)

All cases are in install/install.test.ts, describe "Pi prompt template (plan 34-04)" unless marked otherwise.

| Behaviour | Case |
|---|---|
| user-authored template present: skipped, bytes kept, no ledger entry, survives uninstall | "a user-authored template already at the path is skipped, keeps its bytes, gets no ledger entry, and survives uninstall unchanged" |
| DRY_RUN install: `would-add`, no `.pi` | "a DRY_RUN install of an empty target names the template `would-add` and creates no `.pi`" |
| second install no-op, claim kept, uninstall removes | "a second install is a no-op for the template (skipped, bytes unchanged) and keeps its ledger entry; uninstall still removes it" |
| user edit kept by uninstall and reported left | "a user edit to the installed template is kept by uninstall and reported `left`" |
| re-install after edit drops the claim | "a re-install after a user edit drops the ledger claim on the template, and leaves the edit" |
| user's `.pi/settings.json`: only template added, no `.pi` dir entry, uninstall leaves `.pi/` byte-identical | "a user's own `.pi/` gets only the template added; uninstall removes the template and `.pi/prompts` and leaves `.pi/` and its settings byte-identical" |
| DRY_RUN uninstall names the template (FLOW10) | install/installer-dry-run.test.ts "flow 10: …" and "subset: uninstall after a fresh install into an EMPTY target (flow 10's tree) …", with `FLOW10_CREATED` now carrying `PI_PROMPT_REL` |

Other Task 3 files:
- **installer-write-set.test.ts.** It ran green with no change needed. The derived write-set and special-shape cases pick up the Pi path by derivation. The `POINTER_FILES` case (hard-linked marker) excludes only CLAUDE.md and the Copilot file, because a sentinel block is removed by presence on a target with no usable marker, and that decision does not read the marker. The Pi template is governed by the ledger alone, so including it in `governed` (through `fileRecords(marker, false)`) matches that case's stated purpose.
- **uninstall-removal.test.ts.** The never-installed ledger-walk case now also plants a template at `PI_PROMPT_REL`. Uninstall has no Pi-specific label, so there is no `left` line to assert. The snapshot equality proves zero bytes changed, and the final assertion proves nothing was named removed.
- **installer-fs-census.test.ts.** The `install.ts:writeTargetFile:writeFileSync` row's `why` now names writePiPromptTemplate and its DRY_RUN return. This is a prose-only change.

## TDD Gate Compliance (Task 3, `tdd="true"`)

- The Task 1 tracer already built `writePiPromptTemplate()`, as the plan's order requires. So the six Task 3 behaviour cases passed on their first run (7/7 with the lifecycle case). A RED before the implementation was not possible. As in 34-02, the RED evidence is the mutation run above: each behaviour case except two was turned red by a mutation targeting its property. The re-install-keeps-claim case was red under overwrite, and the user `.pi/settings.json` case is covered by the lifecycle dir-entry assertions. Each mutated run was an assertion failure on the planned property. None was a load, syntax or fixture fault.
- `workflow.tdd_mode` is false in config, so no `gsd-tools check tdd-red-evidence` record was produced. Commit `d6c2e96a` is `test(...)` and there is no separate `feat(...)` for Task 3, because the implementation landed in the Task 1 `feat` commit `465ab738`.

## Decisions Made

- The Pi template's start-here line is `COPILOT_PTR`. The test builds its expected bytes from the line it reads back out of the installed Copilot file, so a drift between the two pointers fails the test.
- Report messages begin with `PI_PROMPT_REL`, so the existing "first token is the path" parsers read them.
- `POINTER_FILES` in installer-write-set.test.ts is unchanged (reasoning above).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] install.test.ts "file ownership: a never-installed target is changed by zero bytes" pinned install's kit-false record at 7**
- **Found during:** Task 3 verify run
- **Issue:** This pin was not on the plan's list. It failed with `expected 8 to be 7`, and its derived list named `.pi/prompts/grugops.md`.
- **Fix:** Re-pinned to 8 with a dated comment quoting the derived list. The case's plant loop is derived, so it already plants the exact template bytes into a never-installed target, and uninstall leaves them (real and DRY_RUN).
- **Files modified:** install/install.test.ts
- **Committed in:** `d6c2e96a`

**2. [Rule 3 - Blocking] install/ledger-provenance.test.ts pinned CREATED = 7 and REMOVED_DIRS = 13**
- **Found during:** the first full-suite run (1 failed / 7259 passed)
- **Issue:** This file was not on the plan's list. CREATED measured 8 and REMOVED_DIRS measured 15, with `.pi` and `.pi/prompts` added.
- **Fix:** Re-pinned both numbers from the derived lists, renamed the case to state the new numbers, and added an assertion that `PI_PROMPT_REL` (imported from `./host-tools.js`) is in CREATED. The file's derived R1 per-file cases now also run for the Pi template (3 more cases, all passing).
- **Files modified:** install/ledger-provenance.test.ts
- **Committed in:** `acbd9bc5`

**3. [Rule 1 - Plan defect, documented not fixed] Mutation (i) as written cannot fail**
- **Found during:** Task 2
- **Issue:** Swapping the exclusive create for the overwrite mode on the create line is unreachable for an existing file, because readForWrite answers `ok` and the function returns `skipped` first. The stronger mutation (overwrite in the `ok` branch) is not caught by the five class tests.
- **Fix:** The result is recorded honestly. The mutation was re-run against the Task 3 targeted cases (3 red). The class-level gap is logged in `.planning/phases/34-model-effort-dial-pi-support/deferred-items.md`. No class-wide install-over-user-file test was written, because that is new test design with per-path expected outcomes (out of scope).

---

**Total deviations:** 3 (2 blocking pin moves auto-fixed, 1 plan-mutation defect documented)
**Impact on plan:** Two more derived pins moved for the same reason as the five the plan listed. There was no scope change in production code.

## Issues Encountered

- The first full-suite run found the ledger-provenance pin (deviation 2). The second full run at `acbd9bc5` was green.

## Verification (plan-level)

- `npm run build`: exit 0. `npm run check:build-parity`: ALL CHECKS PASSED. `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'` at `acbd9bc5`: **99 files passed; 7260 passed, 2 skipped.**
- Task 1 acceptance: `grep -n "function writePiPromptTemplate" install/install.ts` prints line 2382. `writePiPromptTemplate();` appears once, at line 5084, after the Copilot `ensureBlock(` at 5077. `COPILOT_PTR` is used inside `PI_PROMPT_TEXT` (line 1681).
- Task 3 acceptance: `grep -n PI_PROMPT_REL install/installer-dry-run.test.ts` shows it inside `FLOW10_CREATED` (line 109).

## Windows safety (D-09)

The new cases build every filesystem path with `join` and compare ledger paths as POSIX strings. They plant no FIFO, create no symlink, use no chmod and rename over nothing. `git init` is run on the scratch target, with its result unused. The FIFO planting at the Pi path comes from the existing special-file test with its existing win32 skip. None of this has been measured on `windows-latest` yet. That needs a pushed CI run, and the push is the human's act.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the planned one (T-34-10 to T-34-14), and each threat is mitigated as the register states: the readForWrite gate, the exclusive create, a fixed literal text, the DRY_RUN return before the write, and ledger-only removal.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 34-06 owns the Pi docs (adapters.md rows and "Pi (pi.dev) conventions", including the project-trust note that an unconditional write causes, from RESEARCH A6/Pitfall 10).
- Any later plan that makes install write a new path will move the same seven pins (five listed here plus the install.test.ts file-ownership pin and the ledger-provenance CREATED/REMOVED_DIRS pins).
- D6 (Pi actually lists and expands `/grugops`) needs a human run of Pi in an installed repository.

## Self-Check: PASSED

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-06*
