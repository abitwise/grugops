---
phase: 41-orchestrator-flow-guidance
plan: 22
subsystem: shared-context
tags: [note.js, read, seal-check, READ-1, workflow-16, workflow-17, install-readme, disposition]
status: complete

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "note.js host writer (41-07), its READ-1 harness (41-12), the exit 1 / exit 2 split and ledger refusal (41-21)"
provides:
  - "note.js read <folder>: the sealed notes of a task's current state in full, in currentState order, and a skipped line for each unsealed or unparseable file"
  - "read ends exit 2 with nothing on stdout when a file in notes/ cannot be read (FIFO, dangling link, unopenable, above the ceiling)"
  - "Workflow 16 input bullet and step 1, and Workflow 17 step 5, name note.js read as the read route"
  - "install/README.md says note.js is the in-script admission tier, outside the Claude Code hook (IN-11)"
  - "READ-1 read mode: 8 new runRead pairs reached and held to exit 2"
affects: [41-23, 41-24, workflow-16, workflow-17, note.js]

actuals:
  tokens: 13881
  tasks: 2
  commits: 4
plan_head_before: f9bd72fdf047184617d7e84d29492011a958b1dc
plan_head_after: 7a567b094261ff7251b7c1e04bbaa825d0ac7d9e

tech-stack:
  added: []
  patterns:
    - "A host read verb reads through the same embedded walk as done and render, and decides only its exit from a skip arm"
    - "Only header lines start at column 0; every value and body line is indented and sanitized"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-22.md
  modified:
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/note.test.ts
    - scripts/runnable-ref/role-route.test.ts
    - scripts/runnable-ref/note-read-sites.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - install/README.md
    - CHANGELOG.md

key-decisions:
  - "runRead passes the repository root as the walk's boundary, as claim.js done's noteWalk does, so a notes directory that resolves outside the root throws and ends exit 2"
  - "Step 1 of Workflow 16 is split into short sentences and says 'was not read in full' in place of 'could not be read', to meet WP-02 and WP-05; the plan's text gave 3 lexicon findings when measured"
  - "In note-read-sites.test.ts the ladder's rung rows (homeBoundary, and canonicalWorkingDirectory through EVERY_WALK) run on EVERY_ADD, every mode but read, because read asks no governance root; the module-load rung rows stay on EVERY_RUN. No row was added or removed"
  - "A read-mode status-2 assertion runs only for pairs judged by THE RULE; a SECOND_SOURCE pair that fires in read mode still meets the stricter equal-to-unfaulted test"

patterns-established:
  - "Pattern: a read verb of a host program builds its whole output, then writes it once, so a failure prints nothing partial"

requirements-completed: [RUN-02, RUN-04, RUN-05]

coverage:
  - id: D1
    description: "note.js read prints every sealed current note in full, in currentState order, counts superseded notes, names unsealed and unparseable files on skipped lines, and prints no skipped file's body"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#read (WR-12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A FIFO, a dangling link or a file above the ceiling in notes/, a link on the path to notes/, a bad argument or a missing .grugops ends exit 2 with one Error: line and nothing on stdout; read writes nothing"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#read (WR-12)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#EXIT-1: note.js ... > read: a throw at its output is exit 2 with nothing on stdout, names no note, and writes nothing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The read command read out of Workflow 16 step 1 runs on host copies under PATH only, prints the note add wrote and names a hand-written copy as skipped"
    requirement: RUN-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/role-route.test.ts#the kit text's read command reads the context through the seal check on host copies (plan 41-22, WR-12, D-42)"
        status: pass
    human_judgment: false
  - id: D4
    description: "READ-1 holds on the read verb: every faulted read pair in read mode ends exit 2; NOTE_READ_SITES 19, SECOND_SOURCE_SIZE 9, UNREACHED_SIZE 17"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note-read-sites.test.ts (131 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Workflows 16 and 17 name the read route, install/README.md names the in-script admission tier, 13 pending disposition rows"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#the kit names the read route (plan 41-22; WR-12, D-42)"
        status: pass
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The output shape is read by agents on six hosts, and the 13 rows of docs/audit/29-style-dispositions/41-22.md are pending (named human); the gate proves a row exists and cannot judge whether it is right"

duration: 14min
completed: 2026-11-12
---

# Phase 41 Plan 22: note.js read, the host read route through the seal check

**`node tools/grugops/note.js read <folder>` prints each sealed note of a task's current state in full, in `currentState` order, and names each unsealed or unparseable file on a `skipped` line. A file in `notes/` that cannot be read ends exit 2 with nothing on stdout. Workflows 16 and 17 now point at it in place of `context-io.ts`, which no host has, and install/README.md says note.js is the in-script admission tier, outside the Claude Code hook.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-11-12T08:54:10Z
- **Completed:** 2026-11-12T09:08:24Z
- **Tasks:** 2
- **Files modified:** 12 (11 modified, 1 created)

## Accomplishments

- WR-12, D-42: `runRead(folder)` in the hand-written part of `scripts/runnable-ref/note.ts`. It checks the folder with `assertSafeTask`, the root and `.grugops` as `runAdd` does, and asks `rootChainPresence` about the path to `notes/`. It reads once with `readRawNotesWithSkips(folder, contextRoot, root)`, maps with `recordFromParsed` and orders with `currentState`. A skip arm other than `unsealed` and `unparseable` calls `couldNotRun` naming each file and its arm. Otherwise it builds the whole output and writes it once. `read` takes exactly one folder and no flag. It writes nothing and does not call `trustedRepoRoot`.
- The header's WHAT IT IS, a new THE D-12 CONTRACT for `read` paragraph and `USAGE` describe the verb.
- Workflow 16's input bullet and step 1, and Workflow 17's step 5, name `node tools/grugops/note.js read <folder>`. `readContext` now occurs 0 times in either workflow.
- READ-1: a `read` mode in `MODES`. The 8 new `runRead` pairs are reached there and end exit 2. `runnable-exit-contract.test.ts` has a `read` row.
- IN-11: install/README.md's note.js bullet now reads `writes a sealed note into the shared context through the same writer and the in-script admission tier, outside the Claude Code hook, and prints a task's current notes with \`read\``. CHANGELOG `### Added` has one bullet. `docs/audit/29-style-dispositions/41-22.md` has 13 `pending (named human)` rows and no `accepted` row.

Output on a scratch host install with one sealed note and a hand-edited copy of it:

```
read t1: 1 current, 0 superseded, 1 skipped
note 20261112T090824Z-qe-e2e-observation-bd27e7e7
  kind: observation
  by: qe-e2e
  at: 2026-11-12T09:08:24.274Z
  confidence: high
  refs: ABC-1
  body:
    The login form rejects an empty password.
skipped hand.md (unsealed)
```

## Task Commits

1. **Task 1 (tracer): the read verb and the read route text** - RED `2ac985e6` (test), GREEN `e85afb72` (feat)
2. **Task 2: READ-1 read mode, exit-contract row, README, CHANGELOG, dispositions** - `4d27b69c` (test), `7a567b09` (docs)

No refactor commits.

## TDD Evidence

- **Task 1 RED:** `npx vitest run scripts/runnable-ref/note.test.ts -t "read (WR-12)" --reporter=junit`, exit 1. Target `read (WR-12) > an absent folder prints a header with no notes and exits 0` failed on `expected 2 to be +0`, with stderr `Error: unknown command read. ...`. Classifier: `RED_EVIDENCE_OK` (junit, target_test_failed; 10 failing, 1 passing). Semantic assessment: the target ran and failed on its planned assertion because `read` was an unknown command. The one passing case (bad arguments end exit 2) passed because an unknown command is also exit 2, so it does not discriminate before the verb exists. The role-route cases failed on the missing code span in step 1, and the text pins failed on `toContain`. Across the three files, 15 failed and 185 passed.
- **Task 1 GREEN:** `npm run build && npm run typecheck && npx vitest run role-route, note, flow-guidance-text`: 200 passed. `freshness:runnable-embeds` fresh. Tracer gate (interactive, `end-of-phase`, automated-only verify): the verify was re-run green before expanding to Task 2.
- **Task 2:** the READ-1 mode and the exit-contract row test the Task 1 verb, so they had no RED of their own. The first run of `note-read-sites.test.ts` failed 4 rows. In 2 of them, SECOND_SOURCE rows listed `read` in their modes and `read` did not reach them. In the other 2, `<top>` rows were checked by the new exit-2 assertion when they belong under the equal-to-unfaulted test. Both were faults in the test tables, not in `runRead`. After the fix: 131 passed.
- The RED evidence record was moved to the session scratchpad after classification, so nothing was left in the tree.

## Verification

- `note-read-sites.test.ts`: 131 passed. `note.js: 19 read sites, 86 (site, via) pairs`, `69 pairs reached, 17 unreached`. The new pairs are `rootChainPresence:{lstat,stat,realpath}Sync#0 via runRead#0/#1`, `readRawNotesWithSkips:readdirSync#0 via runRead#0` and `resolvedRoot:realpathSync#0 via runRead#0`.
- `runnable-exit-contract.test.ts` + `note.test.ts`: 110 passed.
- Text and doc neighbours (`tier-kit-text`, `check-kit-refs`, `generate-guarantees`, `guard-retired`, `check-banned-claims`, `audit-model`, `flow-guidance-text`, `role-route`, `check-imperative-lexicon`): 764 passed.
- After the last commit: `note.test`, `runnable-exit-contract`, `check-foundation-guards.test`, `generate-runnable-embeds.test`: 491 passed, 1 failed. The failure is the baseline red `check-foundation-guards.test.ts > LANG-07 ... every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose`, which 41-VALIDATION.md § Known baseline reds lists.
- `check-imperative-lexicon`, `check-kit-refs`, `check-diff-disposition`, `check-banned-claims`, `check:claim-anchors`, `check:public-docs`, `VALIDATE_KIT_ROOT=. validate-agent-factory`, `freshness:runnable-embeds`, `freshness`, `freshness:hook-manifest`, `check-foundation-guards`, `check:audit-register` and `check:residual-citations` each exit 0.
- Acceptance greps: `function runRead` is in note.ts 1 time and in note.js 1 time. `note.js read <folder>` is in WF16 2 times and in WF17 1 time. `readContext` is in WF17 0 times. `trustedRepoRoot` is in note.ts's hand-written part 0 times. `"read"` is in note-read-sites 5 times. `SECOND_SOURCE_SIZE = 9` 1, `UNREACHED_SIZE = 17` 1. `in-script admission tier` is in install/README.md 1 time. In 41-22.md, `pending (named human)` appears 14 times (13 rows and the prose) and `| accepted` 0 times.
- The full suite was not run here; it runs once in plan 41-24. A live run of `read` on a host other than Claude Code stays `UNKNOWN - verify` (R-41-05).

## Files Created/Modified

- `scripts/runnable-ref/note.ts` / `.js` - `runRead`, `readFolder`, `noteLines`, `fieldLine`, the `read` dispatch, header and `USAGE`
- `scripts/runnable-ref/note.test.ts` - `describe("read (WR-12)")`, 11 cases
- `scripts/runnable-ref/role-route.test.ts` - the read command from WF16 step 1 run on host copies
- `scripts/flow-guidance-text.test.ts` - `the kit names the read route (plan 41-22; WR-12, D-42)`
- `scripts/runnable-ref/note-read-sites.test.ts` - the `read` mode, `EVERY_ADD`, the exit-2 assertion for read
- `scripts/runnable-ref/runnable-exit-contract.test.ts` - the `read` row
- `agent-factory/workflows/16-context-read-write.md` - the input bullet and step 1
- `agent-factory/workflows/17-task-claim.md` - step 5
- `install/README.md` - the note.js bullet (IN-11)
- `CHANGELOG.md` - one `### Added` bullet
- `docs/audit/29-style-dispositions/41-22.md` (new) - 13 pending rows

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's step 1 text failed WP-02 and WP-05**
- **Found during:** Task 1. The plan's text was measured with `check-imperative-lexicon` and gave 3 findings: 27 words and 22 words against the bound of 20, and the modal `could` in a step.
- **Fix:** step 1 now reads `It prints each sealed note of the current state in full. It names each file in \`notes/\` that is not a sealed note on a \`skipped\` line. A skipped file is not part of the context, so never read one as a note. Never read \`notes/\` by hand. Exit 2 means the context was not read in full: stop and surface it.` The pins and the disposition rows use this text.
- **Commit:** `e85afb72`

**2. [Rule 3 - Blocking] Two SECOND_SOURCE rows listed a mode that never reaches them**
- **Found during:** Task 2. With `read` in `MODES`, `EVERY_RUN` and `EVERY_WALK` included `read`. The ladder's `homeBoundary` and `canonicalWorkingDirectory` rungs are never reached by `read`, so `fired` no longer equalled the row's modes.
- **Fix:** a new `EVERY_ADD` (EVERY_RUN without `read`), with a dated comment citing this plan, WR-12 and the ruling. The `homeBoundary` row and `EVERY_WALK` derive from it. The module-load rung rows stay on `EVERY_RUN`, and `read` reaches them there with an outcome equal to its unfaulted run. The row count did not change, and the equality is now also evidence that `read` asks no governance root.
- **Commit:** `4d27b69c`

**3. [Rule 2 - Missing critical] The walk's boundary**
- **Found during:** Task 1. The plan named `readRawNotesWithSkips(folder, contextRoot)`, and `noteWalk`, the precedent it cites, also passes the root as the boundary.
- **Fix:** `runRead` passes `root`, so a notes directory that resolves outside the repository throws, and the throw ends exit 2.
- **Commit:** `e85afb72`

---

**Total deviations:** 3 auto-fixed (1 Rule 1, 1 Rule 2, 1 Rule 3). **Impact:** the wording, one test-table list and one extra boundary argument. No READ-1 count moved and no guard was weakened.

## Issues Encountered

- The walk reads only names ending in `.md`, so a file in `notes/` with another suffix is neither read nor named on a `skipped` line. Step 1 says it names "each file in `notes/` that is not a sealed note". The disposition row for that sentence asks the named human whether it should say "each `.md` file".
- The `vanished` arm covers both a dangling link and a file deleted between `readdir` and `open`, so a concurrent delete also ends `read` with exit 2. That outcome is the safe one.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Human check for this plan: run `node tools/grugops/note.js read <folder>` in a scratch host install with one sealed note and one hand-written file (an example output is above). Then read the 13 `pending (named human)` rows of docs/audit/29-style-dispositions/41-22.md against the diff, and accept or flag each.
- Ready for 41-23.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-22.md
- FOUND: 2ac985e6, e85afb72, 4d27b69c, 7a567b09 (all in `git log f9bd72fd..HEAD`)
- Acceptance greps re-run after the last commit: all hold.
