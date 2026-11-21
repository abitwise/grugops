---
phase: 41-orchestrator-flow-guidance
plan: 25
subsystem: workflows, audit records
tags: [gate-stamp, plugin-install, emit-verdict, R-41-10, T-41-100, D-44]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "D-41 host text from plan 41-23, the `advise, Olger` green-run line, and the 2026-11-12 ruling on T-41-100 (option (a))"
provides:
  - "Workflows 05, 16 and 17, R-41-10 and CHANGELOG.md scope the missing gate stamp to a host repository with only a scripted install"
  - "Each of the five says a Claude Code plugin install counts as a host and carries the verdict verb, so a gate stamp there is no proof that a gate ran"
  - "A `LIMIT (R-41-10)` describe in scripts/runnable-ref/role-route.test.ts that reproduces the plugin route on a lone host copy"
  - "Olger's named acceptance of the plugin-install limit in R-41-10, one Accepted Risks Log row and D-44"
affects: ["/gsd-secure-phase 41 (decides T-41-100 on the log row)", "41 verify-work"]

actuals:
  tokens: 18236
  tasks: 4
  commits: 4
plan_head_before: 7f348ae0210a01526359964317da3225e52e2354
plan_head_after: 4068962e77988d1e057a446f2615ae68e9e0a7fe

tech-stack:
  added: []
  patterns:
    - "Two install forms named wherever the host verdict limit is stated: a scripted install (no gate stamp) and a Claude Code plugin install (counts as a host, carries the verb)"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-25.md
  modified:
    - scripts/runnable-ref/role-route.test.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/workflows/17-task-claim.md
    - CHANGELOG.md
    - docs/audit/41-residuals.md
    - docs/audit/29-style-dispositions/41-23.md
    - .planning/phases/41-orchestrator-flow-guidance/41-SECURITY.md
    - .planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md

key-decisions:
  - "D-44: T-41-100 takes option (a); Olger accepted the plugin-install limit by name on 2026-11-12, in the reply `accept, Olger`"
  - "The text says a stamp on a plugin install `is no proof that a gate ran`, not that it `proves no gate ran`; the human saw this choice at Task 3"
  - "Workflow 17 step 6 says `A plugin install counts as a host too` without `Claude Code`, to keep the plan 41-04 pin that Workflow 17 Steps name no host"

patterns-established:
  - "A sub-limit of one residual gets its own Accepted Risks Log row with a parenthesised label, as `R-41-10 (plugin install)`"

requirements-completed: [RUN-04, RUN-05]

coverage:
  - id: D1
    description: "A lone host copy reproduces the plugin route: this checkout's scripts/context-io.js emit-verdict mints a green verdict, then the host's tools/grugops/note.js notes a §14-gate finding that its control refuses without the verdict"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/role-route.test.ts#LIMIT (R-41-10): a Claude Code plugin install carries the verdict verb (plan 41-25, T-41-100)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflows 05, 16 and 17, R-41-10 and CHANGELOG.md scope the missing stamp to a scripted install and count a plugin install as a host whose stamp is no proof that a gate ran"
    requirement: RUN-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#a plugin install counts as a host (plan 41-25; T-41-100)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#the kit says a host has no gate stamp (plan 41-23; CR-03, D-41)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A `pending (named human)` disposition row for each of the 20 findings check-diff-disposition gave on this plan's changed clauses"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves a row exists and cannot prove a disposition is right; a named human owes the read of every pending row"
  - id: D4
    description: "Olger's acceptance of the plugin-install limit, quoted as typed in R-41-10, the Accepted Risks Log row `R-41-10 (plugin install)` and D-44"
    requirement: RUN-05
    verification:
      - kind: other
        ref: "Task 4 acceptance criteria (grep -cF 'accept, Olger' on the three files; sec.diff shows 0 removed lines)"
        status: pass
    human_judgment: true
    rationale: "Task 4's human-check: only the human can confirm the records quote them; the gates prove the row exists, not that it is theirs"

duration: 2h 8m (wall time, including the wait at the Task 3 checkpoint)
completed: 2026-11-12
status: complete
---

# Phase 41 Plan 25: A plugin install counts as a host Summary

**Workflows 05, 16 and 17, R-41-10 and the CHANGELOG now scope the missing gate stamp to a host with only a scripted install, say a Claude Code plugin install carries `scripts/context-io.js emit-verdict` so its stamp is no proof that a gate ran, pin that route with a `LIMIT (R-41-10)` case, and record Olger's named acceptance in R-41-10, the Accepted Risks Log and D-44.**

## Performance

- **Duration:** 2h 8m wall time, about 30 min of work. The rest was the wait at the Task 3 checkpoint and the 1,605 s full suite.
- **Started:** 2026-11-12T12:09:37Z (plan base `7f348ae0`)
- **Completed:** 2026-11-12T14:17:30Z
- **Tasks:** 4 of 4 (Task 3 was the blocking-human checkpoint)
- **Files modified:** 11 (1 created)

## Accomplishments

- The `LIMIT (R-41-10)` describe reproduces the audited route on a lone host copy. Its PREMISE case reads plugin source `./` from `.claude-plugin/marketplace.json`. Its CONTROL case shows the host's `note.js` refusing a `§14-gate` finding with no verdict (`refused t1: `). Its LIMIT case runs this checkout's `scripts/context-io.js emit-verdict` (`verdict emitted: `), and the same finding is then noted (`noted t1 `).
- Workflow 05 step 5, Workflow 16 steps 3 and 4 and its first admission outcome, Workflow 17 step 6, residual R-41-10 and the CHANGELOG `### Changed` bullet scope the missing stamp to a scripted install. Each says a plugin install counts as a host and its stamp is no proof that a gate ran. The `advise, Olger` green-run line is kept word for word.
- `docs/audit/29-style-dispositions/41-25.md` has a `pending (named human)` row for each of the 20 findings, and none reads `accepted`. 41-23.md has one note line.
- Olger accepted the plugin-install limit by name. Reply, verbatim: `accept, Olger`. Date: 2026-11-12. The reply is quoted in R-41-10's why cell (decision cell now `D-41, D-44`), in the new Accepted Risks Log row `R-41-10 (plugin install)` and in D-44 of 41-CONTEXT.md.

## Task Commits

1. **Task 1: Tracer: a lone host copy reproduces the plugin route; R-41-10 and Workflow 05 state both limits.** `2daf1d7c` (test, RED) and `860f0d24` (feat, GREEN)
2. **Task 2: Workflows 16 and 17 and the CHANGELOG say the same; pending rows; full suite by name.** `16df550c` (feat)
3. **Task 3: Checkpoint (decision, blocking-human).** No commit. The human replied `accept, Olger` on 2026-11-12.
4. **Task 4: Record the named acceptance in R-41-10, the Accepted Risks Log and D-44.** `4068962e` (docs)

**Plan metadata:** this SUMMARY commit.

## TDD Gate Compliance

- **RED, Task 1** (`2daf1d7c`): `npx vitest run` on role-route, flow-guidance-text and tier-kit-text gave 6 failed and 362 passed (368). The 6 failures were the moved plan 41-23 Workflow 05 case and 5 new Workflow 05 pins in `a plugin install counts as a host (plan 41-25; T-41-100)`. The PREMISE, CONTROL and LIMIT cases passed at once, as the plan expected, because they measure what the code already does. Run alone with `-t "R-41-10"`, they gave 3 passed and 9 skipped.
- **GREEN, Task 1** (`860f0d24`): build, typecheck and the same 3 files gave 368 passed, 0 failed.
- **RED, Task 2** (pins added before the text edit): flow-guidance-text.test.ts gave 17 failed and 128 passed (145). The 17 were 5 moved plan 41-23 cases and 12 new plan 41-25 pins for Workflows 16 and 17, the CHANGELOG, the no-unscoped-sentence sweep and the not-installed clause.
- **GREEN, Task 2** (`16df550c`): build, typecheck and the 3 files gave 380 passed, 0 failed.
- **REFACTOR:** none was needed.

## Full-suite comparison (Task 2, by name)

Command: `npx vitest run --exclude '**/scripts/e2e/**'`, run after Tasks 1 and 2 were committed. Result: 144 files, 22 failed, 11,718 passed, 2 skipped, 1,604.88 s.

Failed names were compared with the 21 names in 41-VALIDATION.md § Known baseline reds using `comm` under `LC_ALL=C`. Matched: 21. Baseline names that did not fail: 0. Failed names outside the baseline: 1.
- `scripts/capture-live.test.ts :: --dry-run walks every phase against the committed fixture and makes no model call (D-10) > exits 0, prints GO-READINESS and the completion wording, writes exactly one outcome line reading no-go, and its artifacts re-check`. This is the known false failure when `TMPDIR` is on the root disk (the suite ran there to avoid EDQUOT on `/tmp`). Re-run alone on the default `TMPDIR`, scripts/capture-live.test.ts passed 77 of 77. 41-VALIDATION.md records the same false failure at `86947a1e`. The pre-plan worktree run was not needed because the file is green alone.

Task 4 changed only records, which no test reads, so the full suite was not re-run. A targeted run of scripts/flow-guidance-text.test.ts and scripts/runnable-ref/role-route.test.ts after Task 4 gave 157 passed, 0 failed.

## Task 4 verification

- Gates: `check-kit-refs`, `check-banned-claims`, `check-diff-disposition`, `check:residual-citations`, `check:audit-register` and `check:public-docs` all passed. The last ended `ALL CHECKS PASSED`.
- `^| R-41-10 (plugin install) | T-41-100 |` in 41-SECURITY.md: 1. `^threats_open: 1$`: 1. `^| T-41-100 |.*| open |$`: 1.
- `git diff -U0 16df550c -- 41-SECURITY.md` was not empty. It had 0 removed lines, and both added lines (the paragraph and the row) contain `plugin install`.
- `^- **D-44:**` in 41-CONTEXT.md: 1. `^| R-41-10 | D-41, D-44 |` and `accepted the plugin-install limit on` in docs/audit/41-residuals.md: 1 each.
- `grep -cF 'accept, Olger'` gives 1 on each of 41-SECURITY.md, 41-CONTEXT.md and docs/audit/41-residuals.md.
- 41-VERIFICATION.md, 41-UAT.md, 41-VALIDATION.md and 41-REVIEW-DISPOSITION.md are unchanged since the Task 4 base.

## Files Created/Modified

- `scripts/runnable-ref/role-route.test.ts`: the PREMISE, CONTROL and `LIMIT (R-41-10)` cases.
- `scripts/flow-guidance-text.test.ts`: the plan 41-25 describe, and the moved plan 41-23 pins, each citing plan 41-25 and the ruling.
- `agent-factory/workflows/05-pr-quality-gate.md`: the scoped host paragraph and the plugin-install sentences.
- `agent-factory/workflows/16-context-read-write.md`: the scoped steps 3 and 4 and first admission outcome. The stamp route is limited to a repository holding grugops's own `scripts/context-io.js`.
- `agent-factory/workflows/17-task-claim.md`: the scoped step 6.
- `CHANGELOG.md`: the rewritten `### Changed` bullet.
- `docs/audit/41-residuals.md`: R-41-10 with its two limits, decision cell `D-41, D-44`, and the quoted acceptance.
- `docs/audit/29-style-dispositions/41-25.md` (new) and `41-23.md` (one note line).
- `.planning/phases/41-orchestrator-flow-guidance/41-SECURITY.md`: the Accepted Risks Log only.
- `.planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md`: the D-44 heading and bullet.

## Decisions Made

- D-44, recorded in Task 4 from the human's reply `accept, Olger` of 2026-11-12.
- The wording "is no proof that a gate ran" was used in place of the ruling's "proves no gate ran". Item 1 of Task 3's context showed the human this choice.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Workflow 17 step 6 omits "Claude Code" from the plugin-install sentence**
- **Found during:** Task 2
- **Issue:** The plan's target sentence for Workflow 17 step 6 was "A Claude Code plugin install counts as a host too, and it carries the verdict verb." An existing plan 41-04 pin (RUN-04, "Workflow 17 holds session compaction > names a host only in the Platform section and the operator tips, across the whole file") forbids naming a host in Workflow 17 `## Steps`.
- **Fix:** Step 6 reads "A plugin install counts as a host too, and it carries the verdict verb." The pin was not weakened. In Workflow 17 the must-have is met in meaning, not word for word. Workflows 05 and 16, R-41-10 and the CHANGELOG still say "Claude Code plugin install". The human was told about this before accepting at Task 3.
- **Files modified:** agent-factory/workflows/17-task-claim.md, scripts/flow-guidance-text.test.ts
- **Verification:** The plan 41-04 pin and the plan 41-25 Workflow 17 pins pass (380 passed at Task 2 GREEN; full suite has no Workflow 17 name outside the baseline).
- **Committed in:** `16df550c`

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking).
**Impact on plan:** Wording only, and it keeps an earlier requirement's pin intact. No scope creep.

## Issues Encountered

- The full suite gave one failure outside the baseline: the known root-disk `TMPDIR` false failure in scripts/capture-live.test.ts. That file passed 77 of 77 when run alone on the default `TMPDIR`.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- /gsd-secure-phase 41 decides T-41-100 against the new log row and recounts `threats_open`. This plan left T-41-100's Status cell, `threats_open: 1`, `status`, the audits, the trail and the sign-off unchanged.
- A named human still owes three reads. The `pending (named human)` rows of 41-25.md. The scripted-install part of R-41-10, which neither `B, Olger` nor `advise, Olger` accepts. R-41-11.
- No ruling says whether the grugops checkout a scripted install runs from counts as part of a host.
- A live run on a plugin install of another Claude Code version, and on Windows, stays `UNKNOWN - verify`.
- Only text controls the plugin route: "Never run the plugin's `emit-verdict`" in Workflow 16 and "The gate never runs that verb on a host" in Workflow 05. Nothing enforces them.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*

## Self-Check: PASSED

Found on disk: docs/audit/29-style-dispositions/41-25.md and this SUMMARY. Found in HEAD history: 2daf1d7c, 860f0d24, 16df550c, 4068962e and 3a70e95e. STATE.md and ROADMAP.md were not changed by this plan.
