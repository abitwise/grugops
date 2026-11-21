---
phase: "43"
plan: "08"
subsystem: docs
status: complete
tags: [examples, worked-examples, v3, tech-lead, rendered-trace, deploy-gate, hard-floor]
requires:
  - "43-03: the story-docs gate (GAP-D1 sentence, no dead shipped link) the examples must pass"
  - "43-07: the banner, voice, host-repo note kinds and rendered-trace-as-output shape examples 04 and 05 follow"
provides:
  - "examples/05-release-run.md: an illustrative v3 release (REL-0007) with the release record, observation notes through note.js, the host check, and a deploy section that names the git host as the hard floor and the ask rules as a speed bump"
  - "examples/04-sprint-cycle.md: an illustrative v3 lean scrum sprint (SPRINT-12) with Tech Lead scoring and named levels, a daily sweep that runs state-check.js and fixes a real finding, review and retro from memory-bank/plans/metrics.md"
affects:
  - "43-12: all five examples are now clean under the four HAND_TRACE_PATTERNS, so examples/ can join the hand-trace scan set; the board-corpus row live-ex05-001 is no longer verbatim (see below)"
actuals:
  tokens: 5700
  tasks: 2
  commits: 2
commits: 2
plan_head_before: ace45ef06260a16fc1a927a72b6bdf04ff95ac3c
plan_head_after: b4b522838c0ebcd08c0367517cefaf52e565c5b9
tech-stack:
  added: []
  patterns:
    - "A release on a scripted host publishes its pointer as an observation note with REL and ticket ids on the refs; an artifact-ref is refused there"
    - "A deploy-safety statement names three tiers by strength (git host hard floor, ask-rule speed bump, prose) and never uses an unqualified always"
key-files:
  created: []
  modified:
    - examples/05-release-run.md
    - examples/04-sprint-cycle.md
key-decisions:
  - "Example 05 states the deploy gate as three tiers of different strength and says the host check cannot see the prod environment, so the release record says only the named human's confirmation protects the deploy"
  - "Example 05's board rows moved to the contract's (owner, since) shape, so the row board-corpus.ts transcribes is no longer verbatim"
  - "Example 04 runs mode=lean with new tickets ABC-014, ABC-015 and ABC-016, so it does not contradict example 05's ABC-012 sitting in Ready to Release"
  - "Example 04 shows rubric rules doing work: ABC-014 sum 2 junior, ABC-015 sum 3 mid because F3 = 1, ABC-016 F2 = 2 back to In Design and carried out"
  - "No parallel work is described in either file, so neither needs the GAP-D1 sentence"
requirements-completed: []
coverage:
  - id: D1
    description: "Examples 04 and 05 carry no hand-kept trace matrix and no line or paragraph the four HAND_TRACE_PATTERNS match"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "the plan's ad hoc hand-trace scan (line and paragraph modes, scripts/trace-model.js patterns) over examples/04 and 05: hand-trace hits: 0; grep -c 'Code (PR/files)' = 0 in both"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both examples pass the docs gates and the targeted tests"
    requirement: STORY-05
    verification:
      - kind: other
        ref: "node scripts/check-banned-claims.js && node scripts/check-public-docs-vocabulary.js && node scripts/check-state-paths.js && npm run check:story-docs (all ALL CHECKS PASSED)"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/board-corpus.test.ts install/host-tools-prose.test.ts (2 files, 56 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Example 05's deploy section states the safety model as measured: named human, git host hard floor, ask rules speed bump, BLOCKED without approval, no unqualified always"
    requirement: STORY-05
    verification:
      - kind: other
        ref: "grep -ci 'hard floor' = 1; grep -cw always = 0; grep -ci caveman = 0"
        status: pass
    human_judgment: true
    rationale: "The prohibition (no guaranteed-outcome claim about human deploy confirmation) is judgment-verified per the plan; the greps prove only the words"
  - id: D4
    description: "Example 04 passes each committed ticket through Tech Lead scoring and a named engineer level before an engineer starts"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "grep -c 'Tech Lead' examples/04-sprint-cycle.md = 8; grep -c state-check.js = 2; grep -c memory-bank/plans/ = 10"
        status: pass
    human_judgment: true
    rationale: "Whether the walkthrough teaches the v3 sprint flow accurately is a reader judgment; a reader review is planned in 43-12"
duration: 8min
completed: 2026-11-18
---

# Phase 43 Plan 08: Worked examples 04 and 05 on the v3 kit Summary

**Examples 04 and 05 rewritten to the v3 kit: the release run stops for a named human and states the git host as the hard floor and the Claude Code ask rules as a speed bump with no `always` claim, the sprint passes each ticket through Tech Lead scoring (junior, mid, and an F2 = 2 ticket sent back to design), and both show the trace as rendered output, so all five examples now pass the hand-trace scan.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-18T02:37:00Z
- **Completed:** 2026-11-18T02:45:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Example 05 (tracer): `/grugops-release` with `disable-model-invocation: true`; the Orchestrator decision in the current Output shape; the `rel-0007` subtask claimed with `claim.js`; the Release Manager reads the ticket's notes (engineer observation, QE claim at `UNKNOWN - verify`, UAT finding verified by a named human); the release record in `memory-bank/plans/releases/REL-0007.md` with version, deploy plan, rollback, DR, evidence, readiness result and host-protection result; the release published as an `observation` (an `artifact-ref` is refused on a scripted host); the deploy gate in three tiers; the `BLOCKED` variant; Dana's approval record; the board moves; the rendered `ABC-012` trace naming `REL-0007`; the lead-time metric; the release branch commit that does not deploy.
- Example 04: lean scrum; refinement notes through `note.js`; `SPRINT-12.md` in the field list of Workflow 08; a two-ticket rubric table and the `## Tech Lead plan` section; the junior adapter claimed with `--level junior`; one bounce from review; the day 3 sweep with a real `state-check.js` finding (two `_Updated:` lines), fixed and re-run to `No findings.`; review with a carried-out ticket and its reason; metrics rows; a retro tying each waste to a value and creating one `factory` ticket; the rendered `ABC-015` trace.
- Every tool output (`note.js`, `claim.js`, `trace-render.js`, `state-check.js`, `host-protection.js`, the refused `artifact-ref`) was taken from trial runs in scratch installs outside the repo, with placeholder ids and dates swapped in. The note counts in each render line match the story's order of notes.

## Task Commits

1. **Task 1: example 05 cuts a release on the v3 kit (tracer)** - `cc688d56` (docs)
2. **Task 2: example 04 runs a sprint on the v3 kit** - `b4b52283` (docs)

The tracer gate re-ran Task 1's automated verify green (hand-trace hits 0, four gates ALL CHECKS PASSED) before Task 2.

## Files Created/Modified

- `examples/05-release-run.md` - the v3 release walkthrough with an honest deploy gate
- `examples/04-sprint-cycle.md` - the v3 sprint walkthrough through the Tech Lead

## Board corpus note for plan 43-12

The row `scripts/board-corpus.ts` transcribes from example 05 (`live-ex05-001`, note "source line 68") is **no longer
present verbatim**. It read `- [ABC-012] Portfolio FX conversion  (release: REL-0007, status: READY_TO_RELEASE)`.
The board contract's overview rule is one row per ticket in the form `- [ID] title  (owner, since)`, so the row now
reads, at line 226 (in `Ready to Release`):

- `- [ABC-012] Portfolio FX conversion  (owner: Release Manager, since: 2026-06-18)`

and the same ticket appears once more at line 237, after the move to `Done`:

- `- [ABC-012] Portfolio FX conversion  (owner: Release Manager, since: 2026-06-20)`

Both parse the same way as before (a captured parenthetical, disposition `row`). `board-corpus.ts` was not edited
here; `scripts/board-corpus.test.ts` stays green (56 passed with `install/host-tools-prose.test.ts`).

## Decisions Made

- Deploy gate: the git host (branch protection on `main`, a `prod` environment with a required reviewer) is the
  hard floor and covers a deploy that runs through that environment; a deploy that does not run through it is
  outside what the host sees. The ask rules are a speed bump and the plugin form writes none. Prose is the third
  tier. The host check does not read the production environment, so the release record says only the named
  human's confirmation protects the deploy, as Workflow 12 step 6 asks.
- The sample's environment is described only as requiring a reviewer, not as preventing self-review, because Dana
  both approves the release and reviews the deploy job in this story.
- QE's `UNKNOWN - verify` claim is carried into the release record as it stands, not called a pass.
- Example 04 uses new tickets and `mode=lean`, so "Done" means merged and the sprint does not contradict example 05.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- No same-wave re-runs were needed: every gate and targeted test was green on first run after each edit.

## Verification

- Hand-trace scan (both modes) over examples 04 and 05: `hand-trace hits: 0`.
- `check-banned-claims`, `check-public-docs-vocabulary`, `check-state-paths`, `check:story-docs`: ALL CHECKS PASSED (after each task).
- `npx vitest run scripts/board-corpus.test.ts install/host-tools-prose.test.ts`: 2 files, 56 passed.
- Also run: `install/host-entry-docs.test.ts`, `scripts/check-story-docs.test.ts`, `scripts/check-public-docs-vocabulary.test.ts`, `scripts/check-banned-claims.test.ts`, `scripts/trace-instructions.test.ts`, `install/installer-kit-home.test.ts`: 6 files, 387 passed.
- Acceptance greps, example 05: `Code (PR/files)` 0, `caveman` 0, `hard floor` 1, `always` (whole word) 0, `Illustrative run` 1.
- Acceptance greps, example 04: `Code (PR/files)` 0, `Tech Lead` 8, `state-check.js` 2; `grug`, `caveman` and `parallel` 0 in both files.
- Requirements STORY-02 and STORY-05 were not marked complete: `requirements.ready-ids` reports both blocked by sibling plans in this phase that declare them and have no SUMMARY yet.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All five worked examples are now v3 walkthroughs with no hand-trace hit. Plan 43-12 can add examples/ to the
hand-trace scan set and must update the provenance of `live-ex05-001` in `scripts/board-corpus.ts` (and of the three
example 02 rows 43-07 recorded).

## Self-Check: PASSED

- FOUND: examples/04-sprint-cycle.md, examples/05-release-run.md
- FOUND: cc688d56, b4b52283 (each an ancestor of HEAD)
