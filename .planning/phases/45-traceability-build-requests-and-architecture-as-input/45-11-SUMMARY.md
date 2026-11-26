---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 11
subsystem: kit-text
tags: [build-requests, upstream, workflow-03, workflow-09, workflow-17, escalation, traceability]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "45-10 Workflow 20 `## Build requests` procedure and the one escalation paragraph; 45-08 the validator's missing-statement warning naming Workflow 03 step 8; 45-07 the `upstream.js requests` report lines"
provides:
  - "Workflow 03 step 8: cite each upstream ID as an `upstream:<source>:<ID>@<commit>` ref, or state `none (build-internal)` under `## Upstream`"
  - "Workflow 09: `upstream.escalation_days` input, step 7 skip pointer, step 9 `requests` report with carry lines and one `upstream waits` line, the `Blocked time` sentence, the stop-bullet pointer and the Done-condition clause"
  - "Workflow 17 session-start step 4 runs `upstream.js requests` and reports each line per Workflow 20"
  - "flow-guidance-text cases pinning all three"
affects: [phase-45-verification, 46, 47]

actuals:
  tokens: 7600
  tasks: 2
  commits: 2
plan_head_before: 5f2f3e93f49c4b99a11bb3d2430880ddcd2e4d68
plan_head_after: e57b5d221334e09ee84067d8c7aff1cca69a3e30

tech-stack:
  added: []
  patterns:
    - "A disposition generator reads the gate's own changedClauses, readDispositionRows and rowMatches, and recovers each raw clause with the segmentClauses split"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-11.md
  modified:
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/17-task-claim.md
    - scripts/flow-guidance-text.test.ts

key-decisions:
  - "`upstream.escalation_days` enters Workflow 09 as its own `## Inputs required` bullet, not inside the `.grugops/factory.config.json` bullet: that bullet's first clause matches a claim-registry anchor clause, so editing the line would owe a registry edit for a sentence that did not change"
  - "Workflow 09 step 9 also lists a ticket waiting on a build request under blocked, with the request named, and reports the other `requests` lines per Workflow 20 (must_have truth S-01, and Workflow 20 step 6)"
  - "No tagged stop bullet text is recorded in scripts/checkpoints.ts, so the `escalate_stale_blocker` pointer sentence moved no count and no record; checkpoints.ts, the hook manifest, the reference pages and the claim registry are unchanged"

patterns-established:
  - "A workflow that calls a rule stated once elsewhere points to it by workflow number and keeps the rule's own phrase out (here `per bullet` and `exempt from \\`blocked_escalation_days\\``)"

requirements-completed: [TRC-01, BR-02, BR-04, BR-06]

coverage:
  - id: D1
    description: "Workflow 03 step 8 cites each upstream ID as an `upstream:<source>:<ID>@<commit>` ref when `upstream` is declared, or states `none (build-internal)` under `## Upstream`; `## Trace updates` says an `upstream:` ref renders in the Requirement column"
    requirement: TRC-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in the sweep and planning (plan 45-11, TRC-01, BR-04, BR-06) (d)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Workflow 09 step 7 and the `escalate_stale_blocker` stop bullet skip a bullet naming an open or carried build request and point to Workflow 20; the tag keeps its text and place; neither Workflow 09 nor 03 says `per bullet`"
    requirement: BR-06
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in the sweep and planning (plan 45-11, TRC-01, BR-04, BR-06) (a), (e)"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (all passed, count unchanged)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Workflow 09 step 9 runs `upstream.js requests` when `upstream` is declared and adds its carry lines and one `upstream waits` line; `## Metrics emitted` counts an upstream wait in `Blocked time`"
    requirement: BR-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in the sweep and planning (plan 45-11, TRC-01, BR-04, BR-06) (b), (c)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Workflow 17 session-start step 4 runs `upstream.js requests` and reports each printed line per Workflow 20; the section keeps five numbered steps"
    requirement: BR-04
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#session start step 4 also runs `upstream.js requests` and reports its lines per Workflow 20 (plan 45-11, D-12, BR-04)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#orders session start as read, sweep, re-spawn, upstream check, refill"
        status: pass
    human_judgment: false
  - id: D5
    description: "A ticket waiting on a build request stays in `Blocked` and the sweep report lists it under blocked with its request named (S-01, BR-02)"
    requirement: BR-02
    verification: []
    human_judgment: true
    rationale: "No test pins the step 9 listing sentence; whether the Orchestrator lists the ticket with its request named is agent behavior under a prose rule"

duration: 13min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 11: Build requests in planning, the sweep and session start Summary

**Three workflows now call the build-request procedure by pointer. Workflow 03 step 8 cites each upstream ID a ticket implements as an `upstream:` ref, or states `none (build-internal)`. The Workflow 09 sweep skips a bullet naming an open or carried build request at `blocked_escalation_days` and points to Workflow 20. It runs `upstream.js requests` and adds the carry lines and one `upstream waits` line to its report, and counts an upstream wait in `Blocked time`. Workflow 17 session-start step 4 runs `requests` and reports each line per Workflow 20. No rule is restated.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-11-26T13:20:12Z
- **Completed:** 2026-11-26T13:33:00Z
- **Tasks:** 2
- **Files modified:** 5 (git diff --shortstat: 125 insertions, 8 deletions)

## Accomplishments
- Workflow 03 step 8 gains two sentences at its end, and `## Trace updates` gains "An `upstream:` ref renders in the ticket's Requirement column." Step 8 keeps its number, so the validator's missing-statement warning (`scripts/upstream-model.ts:717`, "Workflow 03 step 8") still names the right step.
- Workflow 09 gains a new `## Inputs required` bullet for `upstream.escalation_days` (default 10, Workflow 20). Step 7 gains the skip sentence. Step 9 gains four sentences: list a waiting ticket under blocked with its request named, run `requests`, add the carry lines and one `upstream waits` line, and report the other lines per Workflow 20. `## Metrics emitted` gains the `Blocked time` sentence. The stale-blocker stop bullet gains "A bullet naming an open or carried build request is exempt (Workflow 20)." before its tag, and the Done condition gains the upstream-waits clause.
- Workflow 17 session-start step 4 gains "Then run `node tools/grugops/upstream.js requests` and report each printed line per Workflow 20." Every earlier sentence is byte for byte unchanged, and the section still has five numbered steps.
- `scripts/flow-guidance-text.test.ts`: one session-start case, and the describe `build requests in the sweep and planning (plan 45-11, TRC-01, BR-04, BR-06)` with cases (a) to (e). Deleting the Metrics sentence made case (c) fail, so the case can fail.
- `docs/audit/29-style-dispositions/45-11.md`: 32 rows generated from the gate's own segmentation (31 for Workflows 03 and 09, 1 for Workflow 17). The gate reported 45 findings with the Task 1 edits and no rows, 4 of them frozen in `## Stop conditions`, and 0 with the rows.

## Task Commits

1. **Task 1: Workflow 03 step 8 and Workflow 09's exemption, report line and metric** - `f19fa8a7` (feat)
2. **Task 2: Workflow 17 session start reports `requests`; text tests; the full gate sweep** - `e57b5d22` (feat)

## Files Created/Modified
- `agent-factory/workflows/03-epic-to-tickets.md`: step 8 citation sentences, one Trace updates sentence
- `agent-factory/workflows/09-daily-sweep.md`: Inputs bullet, steps 7 and 9, Metrics, stop bullet, Done condition
- `agent-factory/workflows/17-task-claim.md`: one sentence in session-start step 4
- `scripts/flow-guidance-text.test.ts`: six new cases
- `docs/audit/29-style-dispositions/45-11.md`: new, 32 rows

Not changed, because no gate named them: `scripts/checkpoints.ts`/`.js` (the tagged bullet's text is not recorded, and `WORKFLOW_STOP_BULLET_COUNT` stays 58), `hooks/hook-entry.ts`/`.js` (fresh), `docs/reference/README.md` (`npm run generate:catalog` wrote 27 pages with 0 differences), and `docs/audit/28-claim-registry.md` (`check:claim-anchors` named no moved anchor).

## Decisions Made
See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The Inputs edit tripped a claim-registry anchor**
- **Found during:** Task 1 (`check:diff-disposition`)
- **Issue:** The plan put `upstream.escalation_days` on Inputs line 19. Editing that line makes its first clause, "- `.grugops/factory.config.json`", a removed and added clause. That clause normalizes to the same text as a registered claim's anchor clause, so the gate owed a `docs/audit/28-claim-registry.md` edit in the same commit for a sentence that did not change.
- **Fix:** Line 19 is unchanged. A new bullet follows it: "- `upstream.escalation_days` in the same file, the wait threshold for a build request (default 10, Workflow 20)."
- **Committed in:** f19fa8a7

**2. [Rule 2 - Missing critical] Step 9 had no sentence for the must_have truth on S-01**
- **Found during:** Task 1
- **Issue:** The must_have truth says the done/next/blocked report lists a ticket waiting on a build request under blocked, with its request named. The planned step 9 text did not say so. It also named only the carry and wait lines, while Workflow 20 step 6 lists every `requests` line in the sweep report.
- **Fix:** Step 9 adds "List a ticket that waits on a build request under blocked, with the request named." and "Report its other lines per Workflow 20." Both point to Workflow 20 and restate no rule.
- **Committed in:** f19fa8a7

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical).
**Impact on plan:** No rule changed. The phrase "exempt from `blocked_escalation_days`" is still in Workflow 20 alone (plan 45-10 case (d) passes), and neither Workflow 09 nor 03 says `per bullet`.

## Issues Encountered
- `node scripts/check-foundation-guards.js` prints `WARN .claude/agents/grugops-orchestrator.md 3368B >= 3072B`. That WARN existed before this plan and is advisory.
- The full suite was not run, as the orchestrator instructed. Targeted runs, all green: flow-guidance-text, tier-kit-text, skills-kit-text and install/kit-route (611 passed). Also tier-kit-text, checkpoints and floor-invariance (477). Also trace-instructions, check-role-rules, check-foundation-guards, kit-model, generate-catalog, checkpoints, check-diff-disposition and check-imperative-lexicon (1013). floor-invariance after the last commit passed (136).

## Verification
- Task 1 chain: check:imperative-lexicon (0 findings over 72/72), check:banned-claims, check:claim-anchors, check-kit-refs, check:diff-disposition and check:audit-register all exit 0. freshness:hook-manifest is fresh.
- Task 2 chains: check-foundation-guards, check:audit-register, check:imperative-lexicon, check:banned-claims, check:claim-anchors, check:role-rules, check:diff-disposition, check:state-paths, check-kit-refs and check:public-docs all exit 0. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` prints ALL CHECKS PASSED. `node scripts/runnable-ref/state-check.js .` prints "No findings." at exit 0.
- Freshness: `npm run freshness` (97 .js fresh), catalog (27 pages, 0 differences), adapters, skill-twins (7), host-entries (7), guarantees, hook-manifest and runnable-embeds (7 targets) all exit 0. `npx tsc --noEmit` exits 0.
- Acceptance greps: Workflow 03 `none (build-internal)` 1. Workflow 09 `upstream.js requests` 1, the `Blocked time` sentence 1, `checkpoint: escalate_stale_blocker` 1. Workflow 17 `upstream.js requests` 1, session-start numbered steps 5. `plan 45-11` in the test file 2.

## User Setup Required
None.

## Next Phase Readiness
- This is the last plan of phase 45. The orchestrator runs the full suite and compares by test name against the baseline. Known reds: `install/installer-fs-census.test.ts` (`openAsBlobSync`, Node v26) and the READ-1 rows in `scripts/runnable-ref/note-read-sites.test.ts`.
- Requirements TRC-01, BR-02, BR-04 and BR-06 were not marked complete. They stay Pending until the phase closes.
- The human-judgment items from the 45-04 to 45-08 summaries are still open for the phase UAT. D5 above adds one: whether the Orchestrator lists a waiting ticket under blocked with its request named.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: docs/audit/29-style-dispositions/45-11.md (32 rows), agent-factory/workflows/03-epic-to-tickets.md, 09-daily-sweep.md, 17-task-claim.md
- FOUND (ancestors of HEAD): f19fa8a7, e57b5d22
