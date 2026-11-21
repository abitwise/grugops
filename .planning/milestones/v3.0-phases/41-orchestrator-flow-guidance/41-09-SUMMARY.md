---
phase: 41-orchestrator-flow-guidance
plan: 09
subsystem: tooling
tags: [installer, runnable, note-writer, ledger, install-guide]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "scripts/runnable-ref/note.js, the host note writer (plan 41-07)"
provides:
  - "tools/grugops/note.js on every scripted install, through one RUNNABLES row and its RUNNABLES_MIRROR counterpart"
  - "A real-install proof: with Node alone, claim, note.js add and done finish a task from tools/grugops/"
  - "install/README.md sections 1 and 3 name the two programs Workflow 17 needs and the install that writes them"
affects: [41-11, 41-12]

actuals:
  tokens: 7456
  tasks: 3
  commits: 4
plan_head_before: ea4b4b64fedd74e6392151418853ed3ba40f82a1
plan_head_after: 5a38b87f517d58e4ea922457a2fd65f489643fb3

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/install.test.ts
    - install/uninstall-removal.test.ts
    - install/installer-cross-version.test.ts
    - install/installer-never-installed.test.ts
    - install/installer-special-files.test.ts
    - install/installer-user-edit.test.ts
    - install/ledger-provenance.test.ts
    - install/record-truth.test.ts
    - install/README.md
    - scripts/generate-runnable-embeds.test.ts

key-decisions:
  - "note.js joined STATE_RUNNABLES as well as gaining its own two cases, so the existing byte-identity and uninstall cases hold it too"

patterns-established: []

requirements-completed: [RUN-02, RUN-05]

coverage:
  - id: D1
    description: "A real install writes tools/grugops/note.js byte-identical to scripts/runnable-ref/note.js, and with PATH alone, claim, note.js add and done finish a task, with not-done printed before the note"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#note.js: a fresh install lays down the note writer, and Node alone takes a claimed task from not-done to done (plan 41-09, RUN-02, RUN-05, D-35)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Uninstall removes an untouched tools/grugops/note.js and keeps and reports a user-edited one, and RUNNABLES and RUNNABLES_MIRROR stay one mapping"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#note.js: uninstall keeps and reports a user-edited copy, and removes an untouched one (plan 41-09, T-41-42)"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#runnable removal: the installer's RUNNABLES and the uninstaller's RUNNABLES_MIRROR are the same mapping"
        status: pass
    human_judgment: false
  - id: D3
    description: "note.js reaches its own usage line on a commonjs host and a typeless host, through tools/grugops/package.json"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: an install into a commonjs host writes the kit file there, leaves the host's package.json byte for byte, and every program runs its own body (D-21, G-37-2)"
        status: pass
      - kind: integration
        ref: "install/install.test.ts#tools/grugops/package.json: on a host whose package.json has no type field, no program prints MODULE_TYPELESS_PACKAGE_JSON while the file is there, and each does without it"
        status: pass
    human_judgment: false
  - id: D4
    description: "RUNNABLE_SET equals the installer's destination names, two-sided, at count 5"
    requirement: RUN-05
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#RUNNABLE_SET equals the installer's destination names for the EMBED_SPECS targets' .js, two-sided, count 5"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every install count pin reads its measured number, each moved by one file, with a dated history line"
    verification:
      - kind: integration
        ref: "npx vitest run install/uninstall-removal.test.ts install/installer-cross-version.test.ts install/installer-never-installed.test.ts install/installer-special-files.test.ts install/installer-user-edit.test.ts install/ledger-provenance.test.ts install/record-truth.test.ts"
        status: pass
      - kind: integration
        ref: "npx vitest run install/install.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "install/README.md sections 1 and 3 tell a reader what the floor and the plugin leave out, and the programs list reads five"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "npm run check:claim-anchors && node scripts/check-banned-claims.js && npm run check:public-docs"
        status: pass
      - kind: unit
        ref: "npx vitest run install/host-tools-prose.test.ts"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 09: Ship the note writer to hosts Summary

**`tools/grugops/note.js` now lands on every scripted install through one `RUNNABLES` row, and a real install takes a claimed task from `not-done` to `done` with Node alone**

## Performance

- **Duration:** 28 min, most of it test runs
- **Started:** 2026-11-05T11:20:22Z
- **Completed:** 2026-11-05T11:48:07Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- A fresh install writes `tools/grugops/note.js` byte-identical to `scripts/runnable-ref/note.js`. In that target, with `env` holding only `PATH`, `claim`, `note.js add` and `done` each exit 0, and `done` prints `not-done t1:` before the note exists. This closes the install half of CR-01.
- Uninstall removes an untouched copy and keeps and reports a user-edited one. The copy loop, the ledger and the never-overwrite rule needed no change.
- The `RUNNABLE_SET` case plan 41-07 left red now passes at count 5, with `note.js` on both sides.
- `install/README.md` §1 and §3 say that the floor and the plugin carry neither program, and name the scripted install as the route to both (WR-01).

## Task Commits

1. **Task 1: End-to-end tracer**
   - `0707b740` (test): failing `note.js` cases, the `OWN_BODY` row, the mapping pins and the count 5 move
   - `b3e04ea2` (feat): the `RUNNABLES` row and its mirror
2. **Task 2: Every count pin moves by its measured number** - `27c7fe0f` (test)
3. **Task 3: The install guide says what Workflow 17 needs** - `5a38b87f` (docs)

Task 1 is a tracer. Its `<verify>` carries only `<automated>` and the mode is `end-of-phase`, so its verify ran after the rows went in and the plan continued with no checkpoint.

RED for Task 1: the target case ran and failed on `tools/grugops/note.js was not installed`, its first assertion, because `RUNNABLES` had no row. `gsd check tdd-red-evidence` returned `RED_EVIDENCE_OK`, and the failure was the planned one, so GREEN started after that.

## Files Created/Modified

- `install/install.ts`, `install/install.js` - the `RUNNABLES` row, after the `claim.js` row
- `install/uninstall.ts`, `install/uninstall.js` - the same row in `RUNNABLES_MIRROR`
- `install/install.test.ts` - two `note.js` cases, `STATE_RUNNABLES`, `OWN_BODY`, the mapping pins and the `rec.files` pin
- `scripts/generate-runnable-embeds.test.ts` - the two-sided `RUNNABLE_SET` case at count 5
- `install/installer-cross-version.test.ts`, `installer-never-installed.test.ts`, `installer-special-files.test.ts`, `installer-user-edit.test.ts`, `uninstall-removal.test.ts`, `ledger-provenance.test.ts`, `record-truth.test.ts` - one measured pin each, with a history line
- `install/README.md` - §1, §3 and the programs list of §2

## Measured Pins

Every pin moved by one file, as `<measured_at_planning>` predicted. Each number below was read from a failing run.

| Pin | Before | After |
| --- | --- | --- |
| `RECORDED_FILE_COUNT` (removal side is this minus one) | 48 | 49 |
| `WRITE_PATH_COUNT` | 120 | 121 |
| `READ_PATH_COUNT` | 82 | 83 |
| `INSTALLED_FILE_COUNT` | 80 | 81 |
| `RUNNABLE_PATH_COUNT` | 8 | 9 |
| `CREATED` | 20 | 21 |
| `REMOVABLE_COUNT` | 50 | 51 |
| `rec.files` | 20 | 21 |
| `RUNNABLE_RELS`, `mirror`, `srcSideInstall` | 10 | 11 |
| `PROGRAM_RELS`, `programRows` | 8 | 9 |

No test case was deleted. Three case names changed to say what they now hold: two `state runnables` cases, and the `install creates 21 files` case.

## Decisions Made

Followed the plan. One small choice: `note.js` joined `STATE_RUNNABLES` as the plan says, and it also went into the list of files the uninstall case expects gone, so that case still checks every program it names.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Test Results

- `install/` whole, plus `scripts/generate-runnable-embeds.test.ts`, `scripts/runnable-ref/`, `scripts/flow-guidance-text.test.ts`, `scripts/audit-model.test.ts`, `scripts/check-banned-claims.test.ts` and `scripts/check-kit-refs.test.ts`: 63 files, 5,745 passed, 2 failed, 1 skipped. No EDQUOT line in the run.
- The two failed names are not this plan's. `every node:fs export whose name may mark a content read is classified...` in `install/installer-fs-census.test.ts` is a `41-VALIDATION.md` § Known baseline red, and that file did not change. `one hex digit of the copied trace-render.js stamp changed...` in `scripts/runnable-ref/state-check.test.ts` is one of the 14 plan 41-12 owns.
- The full suite was not run here. The orchestrator's end-of-wave gate runs it.

## Gates

All green at `5a38b87f`: `npm run typecheck`, `npm run freshness`, `npm run freshness:runnable-embeds`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-diff-disposition.js`. `npm run build` ran before the Task 1 commit.

T-41-43 was also checked once by hand, and no committed case was added for it. In an installed target, damaging the stamp in `tools/grugops/note.js` made `state-check.js` exit 1 with a `runnable-version-skew` finding naming `tools/grugops/note.js`.

## Open Items

- `install/README.md` §1 says Workflow 17 stops when either program is absent. That line is not in Workflow 17 yet. Plan 41-11 adds it to the top of `## Steps`, so the guide is ahead of the kit text until that plan lands.
- CR-01 stays open until the kit text routes a role to `note.js` (plan 41-11) and a live run is read. This plan proves the install path only.
- Plan 41-11 adds the changelog entry.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plans 41-10 to 41-12. Plan 41-12 owns the 14 remaining red cases from plan 41-07.

## Self-Check: PASSED

All 14 modified files are in the plan's `files_modified`, all four commits are ancestors of HEAD, and `git rev-list --count ea4b4b64..HEAD` is 4. Every task's acceptance criteria passed.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
