---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 10
subsystem: kit-text
tags: [build-requests, upstream, workflow-20, escalation, config, stops]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "45-02 Workflow 20 `## Upstream architecture` and stop count 56; 45-03 History forms; 45-07 `requests` report lines; 45-09 build-request contract and board bullet"
provides:
  - "Workflow 20 `## Build requests`: the one build-request procedure, 13 steps, plus the per-bullet escalation rule stated once"
  - "Workflow 20 `## Steps` 14 and 15: citing upstream IDs or `none (build-internal)`, and fixing a wrong ref with a superseding note"
  - "two untagged Workflow 20 stop bullets (WORKFLOW_STOP_BULLET_COUNT 58)"
  - "`upstream.escalation_days` in the config reference"
affects: [45-11]

actuals:
  tokens: 12510
  tasks: 2
  commits: 2
plan_head_before: 27bb0f1cee303b39e19c1063a85ed0e1b9db6b9c
plan_head_after: d58c03e5a623b5b7a6e04ccd905297f40f40a203

tech-stack:
  added: []
  patterns:
    - "A text test reads the closed step-verb list from the gate that owns it (APPROVED_STEP_VERBS), never a copy"

key-files:
  created:
    - docs/audit/29-style-dispositions/45-10.md
  modified:
    - agent-factory/workflows/20-upstream-sources.md
    - agent-factory/config/factory.config.md
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/flow-guidance-text.test.ts
    - docs/reference/agents/ba-pm.md

key-decisions:
  - "Both new Workflow 20 stop bullets are UNTAGGED: no dial value lets an agent stand in for a named human, and a `refused` line is a real error like the existing `Error:` stop (WORKFLOW_STOP_BULLET_COUNT 56 -> 58)"
  - "`upstream.escalation_days` is documented in its own small table beside the per-source table, because that table lists the six keys of each source and has no Default column"
  - "The zero-config sentence states what `upstream.js requests` really does with no `upstream` key (default 10 days, an `UNKNOWN - verify` line per request on file), not that there is nothing to report"
  - "The research Pitfall 8 validator cross-check stays not adopted, as the plan decided; Workflow 20's Done condition names the residual check"

patterns-established:
  - "A rule stated once in the kit is pinned by a test that walks agent-factory/ and expects exactly one file to hold its phrase (here `exempt from \\`blocked_escalation_days\\``)"

requirements-completed: [BR-01, BR-03, BR-05, BR-06, ARCH-02, TRC-01]

coverage:
  - id: D1
    description: "Workflow 20 `## Build requests` holds 13 contiguous steps, each opening with a closed-list verb and naming its owner, pointing to contracts/build-request.md and running `upstream.js requests`"
    requirement: BR-01
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in Workflow 20 (plan 45-10, BR-03, BR-05, BR-06) (a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "`carried`, `answered` and withdrawing a `carried` request need a named human's word; an untagged stop bullet refuses an agent's request to record one"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in Workflow 20 (plan 45-10, BR-03, BR-05, BR-06) (b), (e)"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts (118 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The escalation exemption is stated once, per bullet, and a bullet naming an answered, withdrawn or absent request ages as usual"
    requirement: BR-06
    verification:
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts#build requests in Workflow 20 (plan 45-10, BR-03, BR-05, BR-06) (c), (d)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The answer path after a human moves a pin (steps 9 to 12): propose, record `answered` with the human and pin, publish the `claim` note, leave `Blocked` only when every named request is answered or withdrawn"
    requirement: BR-05
    verification: []
    human_judgment: true
    rationale: "Step structure is tested, but whether an Orchestrator and BA/PM follow the answer path on a host is agent behavior under a prose rule"
  - id: D5
    description: "Workflow 20 steps 14 and 15: cite upstream IDs on the ticket note or write `none (build-internal)`; fix a wrong ref with a superseding note"
    requirement: TRC-01
    verification:
      - kind: other
        ref: "npm run check:imperative-lexicon (0 findings over 20/20); npm run check:diff-disposition (ALL CHECKS PASSED)"
        status: pass
    human_judgment: true
    rationale: "No test pins the wording of steps 14 and 15; whether BA/PM cites as told is agent behavior"
  - id: D6
    description: "The config reference documents `upstream.escalation_days` (integer >= 1, default 10, separate from `blocked_escalation_days`) and no longer says the key is refused"
    requirement: BR-06
    verification:
      - kind: other
        ref: "grep counts: `upstream.escalation_days` 2, `escalation_days` 4, 'because this version does not read it' 0"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/config-governance-consistency.test.ts scripts/config-queue-consistency.test.ts scripts/model-dial-consistency.test.ts scripts/tier-kit-text.test.ts (310 passed)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 10: The build-request procedure in Workflow 20 Summary

**Workflow 20 now holds the one build-request procedure, 13 steps in a new `## Build requests` section. The Orchestrator routes each `Build-request:` observation to BA/PM. BA/PM runs `upstream.js requests`, then merges into a matching request or writes a new one, and marks each blocked ticket `Blocked`. `carried`, `answered` and withdrawing a carried request need a named human's word, and the answer path after a pin move ends in a `claim` note. One paragraph states the per-bullet escalation rule once. The config reference documents `upstream.escalation_days`.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-26T13:07:57Z
- **Completed:** 2026-11-26T13:17:41Z
- **Tasks:** 2
- **Files modified:** 9 (git diff --stat, including the compiled .js, the hook manifest and the reference page)

## Accomplishments
- Workflow 20 has a new `## When to use` sentence and the BA/PM agents bullet, now the only writer of build-request files. The named-human bullet is widened, so the human also carries a request and confirms an answer. Two new Inputs bullets name the `requests` report and the contract.
- `## Steps` 14 and 15 cover citation and correction. Steps 1 to 13 kept their numbers.
- `## Build requests` (13 steps), then the escalation paragraph. A bullet naming an `open` or `carried` request is exempt from `blocked_escalation_days` and waits on `upstream.escalation_days` through the `wait` line. The exemption is per bullet, so a bullet naming an `answered`, `withdrawn` or absent request ages as usual. The ticket still counts in `Blocked time`.
- `## Stop conditions`: the `Error:` and exit-code stops now name `requests` as well, with no count change. Two new untagged bullets were added. `## Board moves`, `## Trace updates` and `## Done condition` cover build requests. The Done condition names the Pitfall 8 residual check: every ticket a live request blocks is `Blocked` with a bullet naming that request.
- `WORKFLOW_STOP_BULLET_COUNT` is 58. The derivation printed "the live stop corpus holds 58 bullet(s) against the recorded 56" before the line moved, and a dated re-walk paragraph was added. The hook manifest and `docs/reference/agents/ba-pm.md` (Workflow 20 is now listed) were regenerated.
- `factory.config.md`: the `upstream` row type, the `blocked_escalation_days` pointer, the rewritten key sentence, the `escalation_days` table and the zero-config sentence.

## Task Commits

1. **Task 1: Workflow 20's `## Build requests` procedure, escalation rule, citation step and stops** - `86f9631b` (feat)
2. **Task 2: Document `upstream.escalation_days` in the config reference** - `d58c03e5` (docs)

## Files Created/Modified
- `agent-factory/workflows/20-upstream-sources.md`: the procedure, the rule, the steps, the stops and the section text
- `agent-factory/config/factory.config.md`: the `escalation_days` reference
- `scripts/checkpoints.ts`/`.js`: count 58 and the 45-10 re-walk paragraph
- `hooks/hook-entry.ts`/`.js`: regenerated by `npm run generate:hook-manifest`. `scripts/floor-invariance.test.ts` needed no change and passes after commit (136 passed).
- `scripts/flow-guidance-text.test.ts`: describe `build requests in Workflow 20 (plan 45-10, BR-03, BR-05, BR-06)`, cases (a) to (e). It imports `APPROVED_STEP_VERBS` from `scripts/check-imperative-lexicon.js`.
- `docs/audit/29-style-dispositions/45-10.md`: 53 rows generated from the gate's segmentation. The 4 `## Stop conditions` rows and the 3 `## Done condition` rows carry companion cells.
- `docs/reference/agents/ba-pm.md`: regenerated

## Decisions Made
See key-decisions in the frontmatter. Some step texts in the plan were written to fit the gates. Step 4 reads "Write a new request otherwise (BA/PM). Give it the source's current pin as `pin`, and number it as the contract says." Step 5 points to the bullet that `agent-factory/contracts/board.md` shows, rather than restating it. Step 8 says "so the human knows to re-send it", because "can" is a banned modal in a numbered step (WP-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Step 14's verb is not on the closed list**
- **Found during:** Task 1
- **Issue:** The plan's step 14 opens with "Cite", which is not in `APPROVED_STEP_VERBS`. The lexicon gate reads `## Steps`, so it would refuse that step.
- **Fix:** The step now reads "Record each upstream ID a ticket implements on its ticket note, per Workflow 03 step 8 (BA/PM). Give each one a full `upstream:<source>:<ID>@<commit>` ref." The meaning is unchanged.
- **Committed in:** 86f9631b

**2. [Rule 3 - Blocking] The new human-word stop bullet was over the sentence bound**
- **Found during:** Task 1
- **Issue:** The plan's text is 29 words in one sentence, and the descriptive bound is 25.
- **Fix:** "- An agent asks to record `carried` or `answered`, or to withdraw a carried request, without a named human's word → write nothing. Ask the human."
- **Committed in:** 86f9631b

**3. [Rule 1 - Bug] The `escalation_days` row did not fit the per-source table**
- **Found during:** Task 2
- **Issue:** The `upstream` sub-fields table lists the six keys each source must have, under the sentence "Each source has exactly the six keys below". It has no Default column. A row there would have said `escalation_days` is a source key.
- **Fix:** The row the plan gave sits in its own four-column table (Key, Form, Default, Meaning), introduced as the second key of the `upstream` object, beside `sources`.
- **Committed in:** d58c03e5

**4. [Rule 1 - Bug] The planned zero-config sentence would have been false**
- **Found during:** Task 2
- **Issue:** The planned sentence said that with no `upstream` key "there are no build requests to report". But `upstream.js requests` still reads the folder (plans 45-07 and 45-09). It uses 10 days and prints `UNKNOWN - verify … source … is not declared` for each request on file.
- **Fix:** "With no `upstream` key, `node tools/grugops/upstream.js requests` uses the default of 10 days, and prints an `UNKNOWN - verify` line for any build request on file, because its source is not declared."
- **Committed in:** d58c03e5

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bug).
**Impact on plan:** No rule changed. Deviations 3 and 4 keep the config reference true to what the code does.

## Issues Encountered
- `node scripts/check-foundation-guards.js` prints `WARN .claude/agents/grugops-orchestrator.md 3368B >= 3072B`. That WARN existed before this plan and is advisory. The role corpus is unchanged at 61,291 B.
- The full suite was not run, as the orchestrator instructed. Targeted runs, all green: checkpoints, generate-catalog, trace-instructions, check-imperative-lexicon, check-foundation-guards, flow-guidance-text and check-diff-disposition (1000 passed). Also floor-invariance after commit (136), config-governance-consistency, config-queue-consistency, model-dial-consistency and tier-kit-text (310). Also check-kit-refs, floor-invariance, generate-catalog and upstream-model (469).

## Verification
- `npx vitest run scripts/flow-guidance-text.test.ts -t "build requests in Workflow 20"`: 5 passed
- Task 1 gate chain: check:imperative-lexicon (0 findings), check:banned-claims, check:claim-anchors, check-kit-refs, check:diff-disposition (53 findings before the rows, 0 after), check:audit-register and check-foundation-guards all pass. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` prints ALL CHECKS PASSED.
- Task 2 chain: the four config and kit-text test files (310 passed), check-kit-refs, check:banned-claims and check:claim-anchors all pass.
- `npm run freshness:catalog` (27 pages, 0 differences), `npm run freshness:hook-manifest` (fresh), `npm run freshness` (97 .js fresh) and `npx tsc --noEmit` all exit 0.
- Acceptance greps on Workflow 20: `^## Build requests$` 1, `upstream.js requests` 2, `contracts/build-request.md` 2. `export const WORKFLOW_STOP_BULLET_COUNT = 58;` is at line 402. On the config reference: `` `upstream.escalation_days` `` 2, `` `escalation_days` `` 4, "because this version does not read it" 0.

## User Setup Required
None.

## Next Phase Readiness
- Plan 45-11 can point Workflow 03 step 8, the Workflow 09 sweep and Workflow 17 session start at this procedure and its escalation paragraph. The phrase "exempt from `blocked_escalation_days`" must stay in Workflow 20 alone, because case (d) pins it there.
- This plan has no place for the human-judgment items earlier summaries kept for the 45-10 UAT. They remain in the 45-04, 45-05, 45-06, 45-07 and 45-08 summaries, unresolved: the per-file budget reading, `--migrate` not seeding the folder, Windows `GIT_GRAFT_FILE`, an undeclared source at exit 2, the pin-moved-again backstop, and A2 and A4.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: docs/audit/29-style-dispositions/45-10.md, agent-factory/workflows/20-upstream-sources.md, agent-factory/config/factory.config.md
- FOUND (ancestors of HEAD): 86f9631b, d58c03e5
