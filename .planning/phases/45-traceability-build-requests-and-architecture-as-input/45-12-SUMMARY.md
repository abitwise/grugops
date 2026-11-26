---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 12
subsystem: build-requests
tags: [build-request, grammar, history, runnable-embeds, contract, gap-closure]
gap_closure: true
gap_ids: [G-45-9]

requires:
  - phase: 45-03
    provides: "The History state machine and the closed History forms in scripts/build-request-model.ts"
  - phase: 45-04
    provides: "state-check.js and upstream.js embedding the one grammar"
provides:
  - "A `withdrawn, by human:<name>: <reason>` History entry closes an `open` build request in the grammar and both installed runnables"
  - "The build-request contract names the human withdrawal of an open request in its History forms, rules and lifecycle table, and points to Workflow 20"
affects: [45-13, workflow-20, build-request-contract, state-check, upstream-requests]

actuals:
  tokens: 6900      # chars/4 over the realized diff (27607 chars, cb60a5a9..8c83088d)
  tasks: 2
  commits: 3        # MEASURED: git rev-list --count cb60a5a9..HEAD
plan_head_before: cb60a5a90d64ea7a3c01feed16ad7e0cf7408f46
plan_head_after: 8c83088df924c5144af76aed32013f007e121747

tech-stack:
  added: []
  patterns:
    - "Grammar change regenerated into host runnables only through `npm run generate:runnable-embeds`, never hand-edited"

key-files:
  created: []
  modified:
    - scripts/build-request-model.ts
    - scripts/build-request-model.js
    - scripts/build-request-model.test.ts
    - scripts/build-request-fixture.test-support.ts
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - agent-factory/contracts/build-request.md

key-decisions:
  - "45-12: From `open`, either BA/PM or a `human:<name>` stamp may withdraw a build request; from `carried`, only a `human:<name>` stamp (UAT decision 1, 2026-11-26, refines D-06, closes G-45-9)"
  - "45-12: The grammar does not decide which open requests need a named human; the request file has no field for it (D-05), so Workflow 20 carries that rule in prose (plan 45-13)"

patterns-established:
  - "The value-silence table's bad-transition row uses a line the grammar still refuses (a human-stamped `edited` entry)"

requirements-completed: [BR-03, ARCH-02]

coverage:
  - id: D1
    description: "The grammar admits an open request withdrawn by `human:<name>` (status withdrawn, 2 entries, no answer) and still refuses a BA/PM withdrawal of a carried request with a value-silent reason"
    requirement: BR-03
    verification:
      - kind: unit
        ref: "scripts/build-request-model.test.ts#an open request withdrawn on a named human's word is admitted: status withdrawn, 2 entries, no answer (G-45-9, UAT decision 1)"
        status: pass
      - kind: unit
        ref: "scripts/build-request-model.test.ts#a carried request withdrawn by BA/PM is bad-transition; only a named human drops a carried request"
        status: pass
      - kind: unit
        ref: "scripts/build-request-model.test.ts#the withdrawn-open-human shape is admitted with status withdrawn, 2 History entries and hasAnswer false"
        status: pass
      - kind: unit
        ref: "scripts/build-request-model.test.ts#bad-transition quotes none of the planted text"
        status: pass
    human_judgment: false
  - id: D2
    description: "The installed `upstream.js requests` admits the withdrawn request: `no build request needs a human (1 on file)`, exit 0"
    requirement: BR-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#(e) an open request withdrawn on a named human's word is admitted: `no build request needs a human (1 on file)`, exit 0 (plan 45-12, G-45-9)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The installed `state-check.js` admits the withdrawn request: `No findings.`, exit 0"
    requirement: BR-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#an open build request withdrawn on a named human's word, with the marker: `No findings.`, exit 0 (plan 45-12, G-45-9)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every committed .js and every generated embed region is fresh after the grammar change"
    verification:
      - kind: other
        ref: "npm run freshness:runnable-embeds && npm run freshness && npm run typecheck"
        status: pass
    human_judgment: false
  - id: D5
    description: "The build-request contract lists the human withdrawal of an open request in its History forms, rules and lifecycle table, and points to Workflow 20"
    requirement: ARCH-02
    verification:
      - kind: other
        ref: "npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:claim-anchors && node scripts/check-kit-refs.js"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js (ALL CHECKS PASSED)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 12: A named human's withdrawal of an open build request Summary

**`withdrawn, by human:<name>: <reason>` now closes an `open` build request in the one grammar, the installed `upstream.js requests` and the installed `state-check.js`. A BA/PM withdrawal of a `carried` request is still refused as `bad-transition`, with the value-silent reason "only a named human withdraws a carried request".**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-26T16:47:01Z
- **Completed:** 2026-11-26T16:53Z
- **Tasks:** 2 (1 tracer with TDD, 1 auto)
- **Files modified:** 19

## Accomplishments

- The withdrawn arm of the History state machine now admits either actor from `open` and only `human:<name>` from `carried` (G-45-9, UAT decision 1, refines D-06). No other arm, refusal code or export changed.
- `npm run generate:runnable-embeds` regenerated the embedded grammar in `scripts/runnable-ref/upstream.ts` and `state-check.ts`, and moved `RUNNABLE_SET_STAMP` in all six runnables. A runnable built before this plan reports version skew; it does not pass the new line silently.
- `agent-factory/contracts/build-request.md` now names the human withdrawal of an open request in three places: its History form list, its rules and its lifecycle table. It points to Workflow 20 for which `open` requests need a named human (plan 45-13 writes that rule).

## Task Commits

1. **Task 1 RED: failing tests** - `eeaf94cc` (test)
2. **Task 1 GREEN: grammar change and regenerated embeds** - `4c87f129` (feat)
3. **Task 2: contract forms, rules and lifecycle row** - `8c83088d` (docs)

## TDD Evidence (Task 1)

**RED** (at `eeaf94cc`): `npx vitest run scripts/build-request-model.test.ts scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/state-check.test.ts` gave `Tests  6 failed | 495 passed (501)`. The 6 failures were exactly the new cases:

- Model (4): the admission case and the three `withdrawn-open-human` table rows all failed with `refused: bad-transition line 30: BA/PM withdraws an open request, and only a named human withdraws a carried one`, or with `test premise: the withdrawn-open-human shape was refused (bad-transition)`.
- upstream.js: `AssertionError: expected 'refused BR-9.md: bad-transition\n' to be 'no build request needs a human (1 on …'`.
- state-check.js: one finding `FINDING  memory-bank/plans/build-requests/BR-1.md: refused by the build-request grammar (bad-transition) (build-request-refused)` where `No findings.` was expected.

The model file was rerun with `--reporter=tap-flat` and the record checked by `gsd_run check tdd-red-evidence`: verdict `RED_EVIDENCE_OK`, reason `target_test_failed`, 134 tests, 4 failing, all of them the new cases. Semantic assessment: each target ran and failed on its planned assertion. It failed because the grammar refused the human withdrawal of an open request. No setup, import or unrelated fault was involved.

**GREEN** (at `4c87f129`): the same three files gave `Test Files  3 passed (3)` and `Tests  501 passed (501)`. The existing BA/PM-withdraws-carried refusal case is unchanged and passes. No existing case changed its expected output.

**REFACTOR:** none needed.

**Tracer gate:** `human_verify_mode` is end-of-phase and the tracer's `<verify>` is automated only, so it was re-run instead of raising a checkpoint. The three test files, `freshness:runnable-embeds`, `freshness` (97 .js fresh) and `typecheck` all exited 0, and then expansion went ahead.

## Acceptance Criteria

Task 1:
- `only a named human withdraws a carried request` appears in scripts/build-request-model.ts (1), upstream.ts (1) and state-check.ts (1): PASS
- `? !human : human` count in scripts/build-request-model.ts is 0: PASS
- `withdrawn-open-human` count in the fixture support is 2: PASS

Task 2:
- `| \`open\` | \`withdrawn\` | a named human |` count is 1: PASS
- `for an \`open\` or a \`carried\` request` count is 1: PASS
- `| \`open\` | \`withdrawn\` | BA/PM |` count is 1 (the BA/PM row stays): PASS
- `Workflow 20` count is 2: PASS
- check:imperative-lexicon, check:banned-claims, check:claim-anchors and check-kit-refs all print ALL CHECKS PASSED. The five wider suites (validate, generate-runnable-embeds, runnable-exit-contract, check-foundation-guards, mode-census) passed 679/679. check-foundation-guards.js and validate-agent-factory.js each print ALL CHECKS PASSED with 0 FAIL lines. Result: PASS.

## Plan-level verification

After the last commit, `npm run freshness:runnable-embeds` printed "Runnable embeds fresh: 7 target(s)" and `npm run freshness` printed "All build outputs fresh: 97 committed .js file(s)". `npm run typecheck` exited 0. The catalog, guarantees, context, skill-twins, adapters and host-entries freshness gates also exited 0. The full suite was not run here; the plan leaves it to the orchestrator after the last wave.

## Decisions Made

- The new refusal is a single `state === "carried" && !human` check. The plan asked for "line N: only a named human withdraws a carried request, as `human:<name>`", and the reason is built from the line number and fixed text only, like the reasons around it.
- No derived pin moved: the foundation guards, mode census and validator suites all passed without re-derivation. Nothing needed a 45-03-style dated note.

## Deviations from Plan

None - plan executed exactly as written. The generator ran in a single `npm run generate:runnable-embeds` pass and did not report a stale compiled copy, so the 45-03 three-step fallback was not needed.

## Issues Encountered

None.

## Threat Model Coverage

- T-45-37 (elevation): only the withdrawn arm changed. Tests keep `carried` and `answered` human-only, and a BA/PM withdrawal of a carried request is still refused.
- T-45-39 (disclosure): the new reason names the line and the rule only. The value-silence table keeps a `bad-transition` row with a planted marker, now on a human-stamped `edited` line, and it still yields `bad-transition` with no planted text.
- T-45-36 (spoofing): the contract keeps its sentence that `human:<name>` is a prose-tier record and not authentication. The Workflow 20 stop rule belongs to plan 45-13.
- T-45-38 (older runnable): `RUNNABLE_SET_STAMP` moved in all six runnables.

## Next Phase Readiness

Ready for 45-13. It writes the Workflow 20 prose rule for which `open` requests only a named human withdraws, and this contract already points to it.

## Self-Check: PASSED

- FOUND: scripts/build-request-model.ts, scripts/runnable-ref/upstream.ts, scripts/runnable-ref/state-check.ts, agent-factory/contracts/build-request.md
- FOUND commits on HEAD: eeaf94cc, 4c87f129, 8c83088d
