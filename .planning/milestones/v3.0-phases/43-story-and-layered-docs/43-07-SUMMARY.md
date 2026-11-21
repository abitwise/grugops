---
phase: "43"
plan: "07"
subsystem: docs
status: complete
tags: [examples, worked-examples, v3, tech-lead, rendered-trace, honesty-banner]
requires:
  - "43-03: the story-docs gate (GAP-D1 sentence, no dead shipped link) the examples must pass"
  - "43-06: examples/ ships in the kit home, so the examples are shipped user docs"
provides:
  - "examples/03-ticket-to-pr.md: an illustrative v3 ticket-to-PR run through the Tech Lead (rubric scores, the mid level in ## Tech Lead plan, the mid adapter claimed and spawned)"
  - "examples/01-greenfield-bootstrap.md: an illustrative v3 greenfield bootstrap (today's install, WF00, the first ticket file and board row, the rendered trace)"
  - "examples/02-brownfield-bootstrap.md: the v3 brownfield bootstrap (WF01, the scan result through note.js, safe first tickets in the (owner, since) row shape, the rendered index)"
affects:
  - "43-08: examples 04 and 05 follow the same banner, voice and rendered-trace-as-output shape"
  - "43-12: examples/ can join the hand-trace scan set for 01-03; board-corpus.ts provenance for the three example 02 rows must be updated (rows changed, see below)"
actuals:
  tokens: 6900
  tasks: 3
  commits: 3
commits: 3
plan_head_before: 60d97bf167322e50c95c488ac4ca74c8c9eb2e6e
plan_head_after: 066d8167ae92cf4e9d390418dd91adf4ebb79771
tech-stack:
  added: []
  patterns:
    - "A worked example shows rendered trace output as output, never a file a role writes"
    - "On a host repo, a pointer to work is an observation with refs and a gate-verifiable pass is a claim at UNKNOWN - verify (no gate stamp on a host)"
key-files:
  created: []
  modified:
    - examples/01-greenfield-bootstrap.md
    - examples/02-brownfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - .planning/phases/43-story-and-layered-docs/deferred-items.md
key-decisions:
  - "Example 03 scores ABC-001 F3 = 1 (a new HTTP route is a public interface), so the sum of 2 maps to mid, not junior; the walkthrough shows rubric rule 4 doing work"
  - "The examples follow the host-repo rules of Workflows 05 and 16: the engineer's work pointer is an observation (an artifact-ref is refused without a gate run), QE's pass is a claim at UNKNOWN - verify, and the gate publishes READY_FOR_HUMAN_REVIEW with the no-gate-stamp line"
  - "The three example 02 board rows changed to the contract's (owner, since) shape; size and priority moved to the ticket frontmatter"
  - "Old sections with no v3 equivalent were dropped, not re-invented: the dual-path parity table, the v1 validator section and the v1 install harness"
requirements-completed: [STORY-02, STORY-05]
coverage:
  - id: D1
    description: "Examples 01, 02 and 03 carry no hand-kept trace matrix and no line or paragraph the four HAND_TRACE_PATTERNS match"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "the plan's ad hoc hand-trace scan (line and paragraph modes, scripts/trace-model.js patterns) over examples/01-03: hand-trace hits: 0; grep -c 'Code (PR/files)' = 0 in all three"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three examples pass the docs gates (banned claims, public-docs vocabulary, state paths, story-docs)"
    requirement: STORY-05
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js && node scripts/check-public-docs-vocabulary.js && node scripts/check-state-paths.js && npm run check:story-docs (all ALL CHECKS PASSED)"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/board-corpus.test.ts install/host-tools-prose.test.ts install/host-entry-docs.test.ts (89 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Examples 01 and 03 are relabeled illustrative with the 2026-06-03 line and the commit link, and nothing still calls them real runs; every example stops at a human and states no speed, cost or token benefit"
    requirement: STORY-05
    verification:
      - kind: other
        ref: "grep acceptance criteria of tasks 1 and 2 (banner line 1, commit link 1, real-run wording 0)"
        status: pass
    human_judgment: true
    rationale: "The prohibitions (no example presented as a real run, no agent merging or deploying) are judgment-verified per the plan; a reader review is planned in 43-12"
  - id: D4
    description: "Example 03 passes through the Tech Lead: rubric scores, the level named in ## Tech Lead plan, the engineer at that level"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "grep -c 'Tech Lead plan' examples/03-ticket-to-pr.md = 4; grep -c memory-bank/plans/traceability/ = 1"
        status: pass
    human_judgment: true
    rationale: "Whether the walkthrough teaches the v3 flow accurately is a reader judgment; the grep proves only that the sections exist"
duration: 9min
completed: 2026-11-18
---

# Phase 43 Plan 07: Worked examples 01-03 on the v3 kit Summary

**Examples 01-03 rewritten to the v3 kit: example 03 walks ABC-001 through the Tech Lead's rubric scoring (sum 2, F3 = 1, so mid) to a pull request a named human merges, 01 and 03 carry the illustrative banner with the 2026-06-03 capture line and commit link, and every trace is shown as rendered output in place of the old hand-kept matrix.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-18T02:28:26Z
- **Completed:** 2026-11-18T02:37:00Z
- **Tasks:** 3
- **Files modified:** 3 examples, plus the phase deferred-items log

## Accomplishments

- Example 03 (tracer): the Orchestrator decision in the current Output shape; the plan subtask queued and claimed with `claim.js`; the Tech Lead's dev tasks, six factor scores and the mid level, published with `note.js` and written into `## Tech Lead plan`; `grugops-software-engineer-mid` claimed with `--level mid`; the engineer's observation note, QE's claim, the WF05 gate order (host-protection, the checks, test-integrity, trace-render, state-check) and the host-repo `READY_FOR_HUMAN_REVIEW` with the no-gate-stamp line; the PR left for Sam.
- Example 01: today's install (`node ~/grugops/install/install.js --target … --claude`, shared kit in `~/.grugops`, per-repo state and `tools/grugops/` runnables), the WF00 flow, the ticket frontmatter, the NFR catalog line, the one-line board row and the rendered `ABC-001` trace.
- Example 02: the WF01 flow, the scan result published with `note.js` and read back, safe first tickets with size and priority in the ticket file, the rendered index, and the human step.
- Output shapes (note.js, claim.js, trace-render.js, state-check.js, host-protection.js, test-skip-integrity.js) were taken from trial runs in a scratch install outside the repo, not invented.

## Task Commits

1. **Task 1: example 03 to v3 through the Tech Lead (tracer)** - `904c388c` (docs)
2. **Task 2: example 01 greenfield bootstrap to v3** - `86c9bffc` (docs)
3. **Task 3: example 02 brownfield bootstrap to v3** - `066d8167` (docs)

The tracer gate re-ran Task 1's automated verify green before Tasks 2 and 3.

## Files Created/Modified

- `examples/03-ticket-to-pr.md` - the v3 ticket-to-PR walkthrough with Tech Lead scoring and the mid level
- `examples/01-greenfield-bootstrap.md` - the v3 greenfield walkthrough, relabeled illustrative
- `examples/02-brownfield-bootstrap.md` - the v3 brownfield walkthrough
- `.planning/phases/43-story-and-layered-docs/deferred-items.md` - one out-of-scope entry (the dogfood runbook)

## Board corpus note for plan 43-12

The three rows `scripts/board-corpus.ts` transcribes from example 02 (`live-ex02-001..003`, notes "source line 64-66")
are **no longer present verbatim**. The contract's overview rule is one row per ticket written
`- [ID] title  (owner, since)` with ticket detail in the ticket body, so the rows changed from
`(owner: BA/PM, sized: S, P2)` to `(owner: BA/PM, since: 2026-06-04)`; size and priority moved to the ticket
frontmatter. The rows now sit at lines 156-158:

- `- [ABC-001] Add request validation to /charge endpoint  (owner: BA/PM, since: 2026-06-04)`
- `- [ABC-002] Pin the unversioned base image in the Dockerfile  (owner: BA/PM, since: 2026-06-04)`
- `- [ABC-003] Document the known build/test commands in AGENTS.md  (owner: BA/PM, since: 2026-06-04)`

Both shapes parse the same way (a captured parenthetical, disposition `row`). `board-corpus.ts` was not edited here;
its provenance test reads only the two fixture files, so `scripts/board-corpus.test.ts` stays green (verified).

## Decisions Made

- F3 = 1 for a new HTTP route (a public interface), so example 03 lands on mid by rubric rule 4, not junior.
- Host-repo honesty: no `artifact-ref` and no gate-stamped `finding` in the examples, because a scripted host install has no gate stamp (Workflows 05 and 16); the trial confirmed `note.js` refuses both there.
- The test-integrity step is shown passing only because the example names a human-owned, empty `.grugops/test-skips.md`; the trial showed exit 2 without it.
- Placeholder human "Sam" names the merging human in all three examples.

## Deviations from Plan

None - plan executed exactly as written. One out-of-scope finding was logged to `deferred-items.md` (below).

## Issues Encountered

- `docs/dogfood-human-runbook.md` (checkout-only, no gate reads it) still calls examples 01 and 03 "REAL proof" and sends
  its Step 4 to the dual-path parity table this plan dropped from example 03. It is in no 43-07 `files_modified` and is
  pre-v3 throughout, so it was logged to `deferred-items.md` for triage rather than edited.
- No same-wave re-runs were needed: every gate and targeted test was green on first run after each edit.

## Verification

- Hand-trace scan (both modes) over examples 01, 02 and 03: `hand-trace hits: 0`.
- `check-banned-claims`, `check-public-docs-vocabulary`, `check-state-paths`, `check:story-docs`: ALL CHECKS PASSED.
- `npx vitest run scripts/board-corpus.test.ts install/host-tools-prose.test.ts install/host-entry-docs.test.ts`: 3 files, 89 passed.
- Also run: `install/installer-kit-home.test.ts`, `install/ledger.test.ts`, `scripts/check-banned-claims.test.ts`, `scripts/check-public-docs-vocabulary.test.ts`, `scripts/check-story-docs.test.ts`, `scripts/trace-instructions.test.ts`: 6 files, 415 passed.
- Acceptance greps: banner line 1 in 01 and 03; commit link 1 in 01; real-run wording 0 in 03 and "this is the real bootstrap" 0 in 01; `Tech Lead plan` 4 in 03; `memory-bank/plans/traceability/` 1 in 03; `Code (PR/files)` 0 in all three; `memory-bank/plans/board.md` 1 and `Illustrative run` 1 in 02.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 43-08 can rewrite examples 04 and 05 in the same shape. Plan 43-12 can add examples/ to the hand-trace scan set
once 04 and 05 are clean, and must update the provenance of the three example 02 rows in `scripts/board-corpus.ts`.

## Self-Check: PASSED

- FOUND: examples/01-greenfield-bootstrap.md, examples/02-brownfield-bootstrap.md, examples/03-ticket-to-pr.md
- FOUND: 904c388c, 86c9bffc, 066d8167 (each an ancestor of HEAD)

---
*Phase: 43-story-and-layered-docs*
*Completed: 2026-11-18*
