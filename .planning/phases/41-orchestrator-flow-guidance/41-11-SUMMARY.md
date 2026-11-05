---
phase: 41-orchestrator-flow-guidance
plan: 11
subsystem: kit-text
tags: [workflow-16, workflow-17, note-writer, residuals, review-ledger, cr-01, wr-01, wr-03, in-08]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "tools/grugops/note.js and the install path (plans 41-07, 41-09), the unusable-record rows (41-10), the read-site census and the Group B ruling (41-12)"
provides:
  - "scripts/runnable-ref/role-route.test.ts: the claim, note and done commands read out of the kit text and run on lone host copies"
  - "Workflow 16 step 3 with the whole note.js command, its placeholders, its exits and the stop when the program is absent"
  - "Workflow 17 with the stop on a missing program, exit 1 read by its line, and the session-start re-spawn"
  - "R-41-01 and R-41-02 corrected, R-41-06 for the in-script tier, R-41-07 for the open dial loss"
  - "WR-01, WR-03 and IN-08 read fixed; CR-01 stays open; open is 11"
affects: [the new gap plan for the root ladder, /gsd-verify-work 41]

actuals:
  tokens: 21692
  tasks: 3
  commits: 5
plan_head_before: 94b679e1c876de35c1892aea8e5fa99d06e6c1b7
plan_head_after: b1b8b29bd0e8b75277a5c01fb609c12e93207933

tech-stack:
  added: []
  patterns:
    - "A route's proof reads its commands out of the shipped text and runs them on host copies; an unknown placeholder fails the test"

key-files:
  created:
    - scripts/runnable-ref/role-route.test.ts
    - docs/audit/29-style-dispositions/41-11.md
  modified:
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/packaging/subagent.frontmatter.md
    - scripts/flow-guidance-text.test.ts
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - docs/audit/41-residuals.md
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md
    - CHANGELOG.md

key-decisions:
  - "The plan's R-41-06 sentence 'A high-severity finding under an active dial stays refused.' was not written, because it is false under a lost dial, reproduced here with HOME=/nonexistent; the orchestrator's instruction was to report such a sentence instead of writing it"
  - "The open dial loss is R-41-07, with its why-accepted cell reading 'Not accepted', because no human has accepted it"
  - "Workflow 16 step 3 gained one sentence beyond the plan's target text: pass the folder's bare name, because note.js exits 2 on the path a ref: line holds, and exit 2 is a stop"
  - "REQUIREMENTS.md was left unchanged and no requirement was marked complete, because the plan's verification requires that and CR-01 stays open"

patterns-established:
  - "A kit command is proved by running the literal code span from the text, with only PATH in the environment"

requirements-completed: []
requirements-open: [RUN-01, RUN-02, RUN-03, RUN-04, RUN-05]

coverage:
  - id: D1
    description: "The claim, note and done commands, read from Workflows 16 and 17 as code spans, finish a task on lone host copies with only PATH set, and an unknown placeholder fails the test"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/role-route.test.ts#claim, note and done, read from the text, finish a task and give the slot back"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/role-route.test.ts#stops on a placeholder it does not know, so a new flag in the text cannot pass unrun"
        status: pass
    human_judgment: false
  - id: D2
    description: "A spawned role reaches the writer under a live host's permission model and tool filter (the evidence CR-01 requires)"
    requirement: RUN-05
    verification: []
    human_judgment: true
    rationale: "Tests prove that the text and the host copies agree. Only a live run read by a named human proves a spawned role gets there, so CR-01 stays open."
  - id: D3
    description: "Workflow 17 stops on a missing program and reads exit 1 as lost or not-done only with that line"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#stops when either program is absent, at the top of `## Steps` (WR-01)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/role-route.test.ts#a missing program exits 1 with no `lost` line, which step 3 of Workflow 17 reads as a stop (WR-01)"
        status: pass
    human_judgment: false
  - id: D4
    description: "`## Session start` runs read, sweep, re-spawn, refill, and the re-spawn names no host and leaves a row with an empty `by`"
    requirement: RUN-03
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#orders session start as read, sweep, re-spawn, refill"
        status: pass
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#keys the re-spawn on the `Agent` tool, and fills the slot the claim already holds (WR-03, RUN-04)"
        status: pass
    human_judgment: false
  - id: D5
    description: "R-41-01, R-41-02, R-41-06 and R-41-07 read as written, and each `pending (named human)` row in 41-11.md"
    verification: []
    human_judgment: true
    rationale: "A residual and a disposition are a human's to accept. The gate proves that a row exists and cannot judge its meaning."

duration: 33min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 11: The route to the note writer Summary

**A role can now reach `tools/grugops/note.js` by following Workflows 16 and 17, a test runs those commands from the text on lone host copies, and WR-01, WR-03 and IN-08 read `fixed`. CR-01 stays `open` until a named human reads the live run.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-11-05T14:16:17Z
- **Completed:** 2026-11-05T14:49:14Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Workflow 16 step 3 gives the whole command, says what `<folder>` and `<role>` are, what each exit means and when to stop. It says a spawned role on Claude Code writes outside the hook, in the same weaker tier as the other hosts.
- `scripts/runnable-ref/role-route.test.ts` reads the three commands out of the text and runs them as written, with only `PATH` set. It imports nothing from the context-io module.
- Workflow 17 stops on a missing program, reads exit 1 by its line, and re-spawns the adapter named in `by` after the sweep. The D-04 note claims no mechanism.
- The residuals name the spawned-role case, the in-script tier and the open dial loss. Every entry stays open, and none is marked accepted by an agent.

## Which truths hold

| Truth | State |
|---|---|
| CR-01, D-35: the text's commands finish a task on lone host copies | **Holds** as a text and host-copy proof. It is not the live run, so CR-01 stays `open`. |
| Workflow 16 step 3 gives the command, the meanings, the exits and the stop; Workflow 17 steps 6 and 7 and protocol step 4 point at it | Holds |
| Workflow 16 says a spawned role writes outside the hook, in the weaker tier | Holds |
| WR-01: the stop at the top of `## Steps` | Holds |
| WR-01: exit 1 read by its line in steps 3 and 7 | Holds |
| WR-03: the re-spawn after the sweep fills the slot the claim holds | Holds |
| WR-03 reads the same on every host, keyed on the `Agent` tool | Holds |
| An empty `by` is left for a later sweep | Holds |
| Edge RUN-03 empty, ordering and adjacency | Hold. The step reads "each claim still in `now-running.md`", so a claim at the TTL that the sweep left is picked up, and none means no work. |
| `## Session start` states the modified-time rule | Holds |
| IN-08: the D-04 note claims no mechanism | Holds |
| R-41-01, R-41-02 and R-41-06 corrected; every entry open and unaccepted | Holds, with one sentence of R-41-06 not written. See the deviations. |
| `CHANGELOG.md` names `tools/grugops/note.js` under `### Added`, with no token or cost claim | Holds |
| The generator comment and `subagent.frontmatter.md` name `tools/grugops/note.js` | Holds |
| WR-01, WR-03, IN-08 `fixed`; CR-01 `open`; open count 11; WR-05 to WR-08 and IN-02 to IN-07 `open` | Holds |
| **The full suite adds no failure name beyond 41-VALIDATION.md § Known baseline reds** | **NOT MET.** The 12 Group B rows fail, by the human ruling of 2026-11-05. The baseline list was not edited. |

## Full-suite comparison

Run at `b1b8b29b`: 8 files failed, 136 passed. 33 tests failed, 11,492 passed, 2 skipped, 1,475 s. No EDQUOT. Failures were compared by test name.

- All 21 names in `41-VALIDATION.md` § Known baseline reds failed, and none went green.
- The 12 Group B rows of `scripts/runnable-ref/note-read-sites.test.ts` failed. They stay red by the human ruling of 2026-11-05, and a new gap plan, not yet written, owns them:
  - `directoryIdentity:statSync#0` via `namedHomeDirectory#0`, `homeBoundary#0`, `homeBoundary#1`, `homeBoundary#2`, `isAboveHome#0`, `isHomeItself#0`
  - `projectRootFromWorkingDirectory:existsSync#0` via `trustedRepoRoot#0`, `governanceRootOf#0`
  - `projectRootFromWorkingDirectory:existsSync#1` via `trustedRepoRoot#0`, `governanceRootOf#0`
  - `hostDeliveredRoot:statSync#0`, `hostDeliveredRoot:existsSync#0`
- No other test name failed: 21 + 12 = 33. Three `FAIL` lines in the output are text a guard prints from its own mirror run. They are not test names, and the vitest total does not count them.

The other phase gate commands all passed: `npm run build`, `typecheck`, `freshness`, `freshness:runnable-embeds`, `freshness:queue`, `freshness:hook-manifest`, the adapter, catalog, skill-twin and host-entry freshness checks, `check-foundation-guards`, `validate-agent-factory`, `check-role-rules`, `check-diff-disposition`, `check-imperative-lexicon`, `check-banned-claims`, `check-kit-refs`, `check-state-paths` and `check-uat-oracles`. The `~` directory still exists, and `.planning/REQUIREMENTS.md` has no change from this plan. No `pending (named human)` cell was filled.

## Task Commits

1. **Task 1 (tracer, RED):** `21a09d04` (test)
2. **Task 1 (tracer, GREEN):** `bb677702` (feat). The tracer gate re-ran its verify, which passed, and expansion went on.
3. **Task 2 (RED):** `534ff68e` (test)
4. **Task 2 (GREEN):** `8cbe5bf0` (feat)
5. **Task 3:** `b1b8b29b` (docs)

## TDD Gate Compliance

- **Task 1 RED:** the target was `names the note command in step 3 of Workflow 16`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target ran and failed on `expected +0 to be 1`, because step 3 held no such code span. The first record returned `INVALID_RED`, because `tap-flat` needs the full qualified test name. The test did not change. The full RED run had 10 failed of 70.
- **Task 2 RED:** the target was `orders session start as read, sweep, re-spawn, refill`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Semantic assessment: the target failed on `expected 3 to be 4`, because `## Session start` held three steps. The full RED run had 12 failed of 81.

## Files Created/Modified

- `scripts/runnable-ref/role-route.test.ts`: the proof that the text reaches the writer
- `docs/audit/29-style-dispositions/41-11.md`: 83 rows, one per changed clause, 43 of them `pending (named human)`
- `agent-factory/workflows/16-context-read-write.md`, `agent-factory/workflows/17-task-claim.md`, `agent-factory/roles/_role-switch-protocol.md`: the kit text
- `scripts/flow-guidance-text.test.ts`: the moved pins and the new text cases
- `docs/audit/41-residuals.md`: corrected R-41-01 and R-41-02, new R-41-06 and R-41-07
- `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md`: three findings `fixed`, open at 11
- `scripts/generate-role-adapters.ts`, `.js`, `agent-factory/packaging/subagent.frontmatter.md`, `CHANGELOG.md`: the comment, the contract sentence and the entry

## Decisions Made

See `key-decisions`. `requirements-completed` is empty for the reason plan 41-12 gave: this plan's verification forbids a change to `REQUIREMENTS.md`, and CR-01 stays open.

## Deviations from Plan

### Sentence not written

**1. The plan's last sentence of R-41-06 was left out**
- **Found during:** Task 3
- **Issue:** the plan dictates "A high-severity finding under an active dial stays refused." in R-41-06. That is false under a lost dial. I reproduced it in a scratch repository set to `human_admission: all`: a `security-nfr` finding stamped `human:eve` is `refused`, exit 1, under the normal environment, and `noted`, exit 0, under `HOME=/nonexistent`.
- **Action:** per the orchestrator's instruction, the sentence was not written and is reported here. The rest of R-41-06 is as dictated. The plan file still holds the sentence.
- **Commit:** `b1b8b29b`

### Added at the orchestrator's instruction

**2. R-41-07 names the open dial loss**
- **Found during:** Task 3
- **Issue:** the plan did not list it, and the orchestrator required it in that file's row format, with a pointer to `deferred-items.md` and not accepted.
- **Fix:** a new row. Its why-accepted cell reads "Not accepted. No human has accepted this gap." The file's opening line still says it records what phase 41 accepted, and the row says otherwise for itself.
- **Commit:** `b1b8b29b`

### Auto-fixed Issues

**3. [Rule 2 - Missing critical] Workflow 16 did not say the folder is a bare name**
- **Found during:** Task 1
- **Issue:** `<folder>` is "the folder the subtask's `ref:` line names", and that line holds `.grugops/context/abc-104/`. `note.js` exits 2 on that path, and the same step calls exit 2 a stop, so a role reading it literally stops on a task it could finish.
- **Fix:** added "Pass its bare name, such as `abc-104`, and never the path." after the plan's sentence, with a pin and a disposition row.
- **Files modified:** `agent-factory/workflows/16-context-read-write.md`, `scripts/flow-guidance-text.test.ts`, `docs/audit/29-style-dispositions/41-11.md`
- **Verification:** the imperative lexicon and `check-foundation-guards` pass. The command ran with `abc-104` (exit 0) and with the path (exit 2).
- **Committed in:** `bb677702`

**Total deviations:** 1 sentence left out, 1 row added on instruction, 1 auto-fixed (missing critical).
**Impact on plan:** the records are more honest than the plan's text in one place. No scope was added beyond the row the orchestrator required.

## Known limits

- **Older text beside the new command.** These sentences predate this plan and I did not write or change them, but they now sit next to `note.js`, and under a lost dial they read stronger than the program behaves: "`appendNote` ... reaches that refusal for every note it takes", "That refusal is decided against the TARGET repository's dial" (Workflow 16 step 3), "`appendNote` consults the admission authority for EVERY note it takes" and "Anything the authority refuses is refused here" (Workflow 17 step 6), and "No flag and no environment variable of this program writes an unsealed note or skips admission" in the `scripts/runnable-ref/note.ts` header. The header sentence is the one `deferred-items.md` already names. The gap plan for the ladder is the natural owner.
- **"an accepted residual" in Workflow 17.** The dictated two-sessions sentence keeps that wording, while the wider R-41-02 has no human acceptance yet. Its disposition row is `pending (named human)` and says so.

## Issues Encountered

- A first regeneration of `41-11.md` crashed on a cross-device rename in the scratch script, so the Task 1 commit kept one header sentence that Task 2's regeneration corrected. No gate result moved.

## Awaiting a named human

1. **The live run.** One Claude Code run of spawn, publish and `done`, as the plan's first `<human-check>` states. On a pass, the ledger moves only on your named reply: CR-01 goes to `fixed` with your name and the date, and `open:` goes to 10.
2. **The residuals.** Read R-41-01, R-41-02, R-41-06 and R-41-07. Accept each or reopen it. R-41-06 needs a read in particular: a role's `human:<name>` stamp is not bound to you on any host.
3. **The rows.** Read each `pending (named human)` row in `docs/audit/29-style-dispositions/41-11.md` against the diff, then reply with your name.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

CR-01, READ-1 and the dial fail-open stay open. The next step is the gap plan that makes the root ladder in `scripts/context-io.ts` fail closed, and it owns the 12 Group B rows.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
