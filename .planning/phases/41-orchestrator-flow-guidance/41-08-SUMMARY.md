---
phase: 41-orchestrator-flow-guidance
plan: 08
subsystem: kit-text
tags: [workflow-04, stop-precedence, orchestrator, config, dispositions, review-gap]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "the stop precedence list (plan 41-02), the `## Hard limits` text (plan 41-06) and `note.js` (plan 41-07), which makes the old stamp sentence false"
provides:
  - "Stop precedence lines 1 and 3 that keep the three-hand-off limit and the stop before a fourth hand-off"
  - "A stamp sentence that says only the `propose_note` tool binds `human:<name>` and `note.js` does not"
  - "`queue.claim_cap` marked retired in `orchestrator.md` and `factory.config.md`, with the key kept in the seed configs"
  - "docs/audit/29-style-dispositions/41-08.md, with eight rows left for a named human"
affects: [41-09, 41-10, 41-11, 41-12]

actuals:
  tokens: 7716
  tasks: 2
  commits: 4
plan_head_before: d5efdea7d5bacd4328cafea8cb9430deb7e919a0
plan_head_after: 69039f0d1533045cf5a22128ec73d0f7e32c9bba

tech-stack:
  added: []
  patterns:
    - "A list read as `take the first line that fits` carries its limits on the line itself, and a pin reads that line alone so a sentence on another line cannot stand in for it"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-08.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - scripts/flow-guidance-text.test.ts
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "`queue.claim_cap` stays in `## Hard limits` as a retired key, because the `claim-cap` fact needs the token there and its baseline comes from git objects at the Phase 40 start"
  - "The row for precedence line 1 has an empty `before`, because the base never held the 41-02 wording; its comparison names that wording instead"

patterns-established:
  - "Per-line pin: `precedenceLine(n)` reads one numbered line, so the same sentence on two lines needs two proofs"

requirements-completed: [RUN-02, RUN-06]

coverage:
  - id: D1
    description: "Taking the first line that fits still leads a repeated unapproved change to a human before a fourth hand-off, and a first, second or third revert hand-off goes out with no human stop"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-22, WR-02: line 1 sends an unapproved fundamental change to the revert hand-off, not the `Fundamental:` stop, and keeps the hand-off limit"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-25, WR-02: line 3 binds the gate hold to the move that answers it, and a later revert hand-off does not wait but keeps the hand-off limit"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 04 says only the `propose_note` tool binds the `human:<name>` stamp and `tools/grugops/note.js` does not"
    requirement: RUN-06
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#the `human:<name>` stamp sentences stay word for word"
        status: pass
    human_judgment: false
  - id: D3
    description: "`orchestrator.md` and `factory.config.md` say `queue.claim_cap` is retired, the `claim-cap` fact holds, and the role stays under its 6,195 B WARN"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#says the key is retired: nothing reads it, and an existing config stays valid (plan 41-08, IN-01)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#stays under its 6,195 B WARN"
        status: pass
      - kind: other
        ref: "node scripts/check-role-rules.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "Each changed stop-rule and `## Hard limits` clause keeps its meaning, read row by row against the diff"
    requirement: RUN-06
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves a row exists and cannot judge meaning. All eight rows in 41-08.md read `pending (named human):`, and a named human owes the read the plan's human-check asks for."

duration: 16min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 08: Hand-off limit and retired claim cap Summary

**Stop precedence lines 1 and 3 now keep the three-hand-off limit, Workflow 04 no longer claims a stamp binding the `note.js` route lacks, and `queue.claim_cap` reads as retired in the role and the config**

## Performance

- **Duration:** 16 min
- **Started:** 2026-11-05T10:37:36Z
- **Completed:** 2026-11-05T10:53:49Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- WR-02 is closed in text. Line 1 now excludes only the stop for a proposed `Fundamental:` note, and lines 1 and 3 each say the limit and the stop before a fourth hand-off still apply. D-22 stands: the first three revert hand-offs go out with no human stop.
- The CR-01 consequence is corrected. The stamp sentence became three sentences, and they name `propose_note` as the only binding route.
- IN-01 is closed. `orchestrator.md` measures 6,192 B, `ROLE_CEILINGS` did not move, and the `claim-cap` fact still holds.
- `41-REVIEW-DISPOSITION.md` reads `fixed` for WR-02 and IN-01, with `open: 15`.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `20ab73ec` (test): the moved pins and the per-line read
   - `86e035cf` (fix): Workflow 04 and seven disposition rows
2. **Task 2: The retired key and the two findings**
   - `0032d979` (test): the moved paragraph pin and the `Retired:` case
   - `69039f0d` (fix): the role, the config row, the eighth row and the review disposition

Task 1 is a tracer. Its `<verify>` carries only `<automated>` and the mode is `end-of-phase`, so its verify ran again after the commit, passed, and the plan continued with no checkpoint.

## Files Created/Modified

- `agent-factory/workflows/04-ticket-to-pr.md` - lines 1 and 3 of the stop precedence, and the stamp sentences
- `agent-factory/roles/orchestrator.md` - one sentence of `## Hard limits`
- `agent-factory/config/factory.config.md` - the `claim_cap` row
- `scripts/tier-kit-text.test.ts` - moved pins, `LIMIT`, `precedenceLine(n)`
- `scripts/flow-guidance-text.test.ts` - the moved paragraph pin and the `Retired:` case
- `docs/audit/29-style-dispositions/41-08.md` - eight rows, all `pending (named human):`
- `.planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md` - WR-02 and IN-01 set to `fixed`

## Decisions Made

- The plan's option to keep the `queue.claim_cap` token shipped as written. Removing the sentence would turn `check-role-rules` red, and its baseline cannot move.
- The D-25 pin reads line 3 alone. Line 1 holds the same sentence, so a check over the whole sub-bullet would have passed with line 3 unchanged.
- The gate raised seven findings for Workflow 04, so that file has seven rows. `Dispatch a later revert hand-off on the same ticket without waiting.` stayed word for word and the 41-02 row still matches it, so the gate owed no new row for it.

## Deviations from Plan

None - plan executed exactly as written. Plan 41-07 had already finished, so the plan's note about running beside it did not apply.

## Issues Encountered

- `check tdd-red-evidence` refused the whole-file Task 1 report as `invalid_record` (`Non-TAP data in report`, `Malformed TAP`). That run held five failing cases. I re-ran the target alone with `-t` under `tap-flat`, and that report returned `RED_EVIDENCE_OK`. GREEN started after that. The cause of the refusal was not found.
- RED evidence, both `RED_EVIDENCE_OK`, read as intended: the D-22 case failed because the sub-bullet lacked the new line 1, and the `Retired:` case failed because the row still opened `Maximum number of tasks`.

## Verification Results

- `npx vitest run scripts/tier-kit-text.test.ts`: 223 passed.
- `npx vitest run scripts/flow-guidance-text.test.ts scripts/config-queue-consistency.test.ts scripts/check-role-rules.test.ts scripts/tier-kit-text.test.ts`: 380 passed.
- Green at `69039f0d` or just before it, on the same tree: `check-role-rules`, `check-imperative-lexicon`, `check-diff-disposition`, `check-foundation-guards`, `validate-agent-factory`, `check-state-paths`, `freshness`, `freshness:runnable-embeds`, `freshness:hook-manifest`, `freshness:catalog`.
- The 23 `scripts/` and `hooks/` test files that name a changed file: 2,312 passed, 6 failed. All six are the LANG-07 cases 41-07-SUMMARY.md assigns to plan 41-12. No other name failed.
- **Not finished:** the same search also named test files under `install/`. A 42-file run that included them hit my 500 s timeout with no summary, so those files have no result here. The full suite was not run; it stays with the end-of-wave gate.
- `check-foundation-guards` prints a WARN for `.claude/agents/grugops-orchestrator.md` at 3,368 B. That file is an adapter this plan did not touch, and no WARN names `agent-factory/roles/orchestrator.md`.

## Open for a Named Human

The eight rows in `docs/audit/29-style-dispositions/41-08.md` are not accepted. The plan's human-check asks for a read against `git diff dabdcf9e -- agent-factory/workflows/04-ticket-to-pr.md agent-factory/roles/orchestrator.md`, with a name and an accept or a flag on each row. Under `end-of-phase`, that read joins the phase UAT.

## Residual Risk

- The limit is prose. T-41-39 is mitigated by a text pin, and no hook enforces a stop rule on any host.
- The config row says "no code reads this key", in the plan's words. `parseQueueConfig` still picks the key into its result, and nothing acts on that value. The 41-08.md row says so.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plans 41-09 to 41-12. Fifteen review findings stay open, and CR-01 stays open until plan 41-09 ships `note.js` and the live run is read.

## Self-Check: PASSED

The created file exists, all four commits are ancestors of HEAD, and `git rev-list --count d5efdea7..HEAD` is 4.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
