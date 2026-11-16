---
phase: 42-skills-per-role-and-evaluation
plan: 01
subsystem: planning-record
tags: [skills, supply-chain, evaluation, superpowers, ui-ux-pro-max, frontend-design, pins]

requires:
  - phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
    provides: the role-side `skills:` key and its grammar (39 D-28, D-29)
  - phase: 35-graph-memory-decision-record
    provides: the decision-record shape 42-EVALUATION.md follows
provides:
  - "42-EVALUATION.md: six SKILL-02 candidates judged on six floors, as whole plugins and per sub-skill, with quoted evidence at full-SHA pins read 2026-11-16"
  - "Four proposals for the 42-04 ratification checkpoint: ui-ux-pro-max and frontend-design (designer, frontend-ui), systematic-debugging and verification-before-completion (software-engineer)"
  - "Five requirement conflicts with options for 42-04 (spawn-mode Skill grant, byte ceilings, SKILL-04 fallback, npm CLI flag, superpowers hook)"
affects: [42-04, 42-06, 42-07, docs/skills.md]

actuals:
  tokens: 13622
  tasks: 3
  commits: 3
plan_head_before: 1daa8b717d8bb14bab1412e8c7466c8e17582a71
plan_head_after: d161d0d220f88061032cc8d8b2b2a794af9c2f31

tech-stack:
  added: []
  patterns:
    - "Floor cell format: pass/fail/UNKNOWN - verify, a backticked quote, then path@sha12:line; an absence names the search and the files it covered"
    - "Third-party sources fetched as tarballs or raw blobs at the pinned commit into empty scratch dirs and read with grep/sed only"

key-files:
  created:
    - .planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md
  modified: []

key-decisions:
  - "frontend-design pinned as plugin version 1.1.1 + SHA 30202c76 (the repo has no tags); superpowers v7.0.2 @ 22f0b463 (annotated tag dereferenced); ui-ux-pro-max v2.15.0 @ a38d04c3 with manifest 2.13.0 recorded, not reconciled"
  - "superpowers test-driven-development judged a process conflict: its delete-and-restart rule overrides WF04's quality.tdd dial"
  - "superpowers receiving-code-review fails network on its gh api reply line, against the research's preliminary pass"
  - "A named runtime on the user's machine (Python 3, Node, bash, gh) passes the runtime-deps floor as a user-side runtime of an optional skill, never a grugops dependency"
  - "Remote resources in a skill's shipped templates (CDN scripts, remote fonts and images) fail the network floor"

patterns-established:
  - "Judge the install unit first, then each sub-skill; a passing sub-skill carries its install-unit finding into the proposal"

requirements-completed: [SKILL-02]

coverage:
  - id: D1
    description: "42-EVALUATION.md exists with all 11 sections in order, the six candidates in SKILL-02 order, and full 40-hex pins with a read date"
    requirement: SKILL-02
    verification:
      - kind: other
        ref: "Task 1 <automated>: section loop prints SECTIONS-OK; PINS 6 distinct 40-hex SHAs"
        status: pass
      - kind: other
        ref: "Task 3 <automated>: EVAL-OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every floor verdict, whole-plugin and per sub-skill, quotes its source line at the pinned commit or reads UNKNOWN - verify"
    requirement: SKILL-02
    verification:
      - kind: other
        ref: "Task 2 <automated>: SP-OK; 15 superpowers rows for 15 skills/ directories; 7 ui-ux-pro-max rows for 7 directories; line spot-check of cited quotes"
        status: pass
    human_judgment: true
    rationale: "Whether each quote supports its pass or fail is a judgment the 42-04 human makes before ratifying; no test can decide it"
  - id: D3
    description: "Proposed recommendations, requirement conflicts with options, the two D-16 revisit triggers, and a ratification section with no acceptance"
    requirement: SKILL-02
    verification: []
    human_judgment: true
    rationale: "The proposals and conflict options are put to a named human at plan 42-04 (D-15); ratification is by typed name"

duration: 13min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 01: SKILL-02 evaluation of six third-party skills Summary

**42-EVALUATION.md judges superpowers, code-simplifier, feature-dev, commit-commands, frontend-design and ui-ux-pro-max on six floors, per install unit and per sub-skill, with every cell quoted at a full-SHA pin read on 2026-11-16, and proposes four skills for ratification in 42-04.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-11-16T12:32:23Z
- **Completed:** 2026-11-16T12:45:56Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Every pin read live with `gh api` and `npm view`: superpowers `v7.0.2` @ `22f0b463…` (the annotated tag object `c62ffea8…` dereferenced to the commit), the four claude-plugins-official plugins at the latest commit touching their path (no tags exist), and ui-ux-pro-max `v2.15.0` @ `a38d04c3…`, with its manifest `2.13.0`, `cli/package.json` `2.5.0` and npm `2.15.0` recorded side by side.
- frontend-design passes all six floors as a whole plugin. ui-ux-pro-max passes as a sub-skill only (stdlib-only Python 3 search; writes only under `--persist`). superpowers' `systematic-debugging` and `verification-before-completion` pass alone, each carrying the finding that the whole plugin (SessionStart injection of `using-superpowers`, merge, branching, telemetry, network) comes with them.
- code-simplifier, feature-dev and commit-commands are recorded as "not a skill" (no `<name>/SKILL.md`), with full whole-plugin rows.
- The allowed-tools table, the quoted 2.1.325 `-p` probe, five requirement conflicts with options, the two D-16 triggers and an empty ratification section are ready for 42-04.

## Task Commits

1. **Task 1: Record skeleton, every pin, frontend-design end to end (tracer)** - `1d56ebc8` (docs)
2. **Task 2: superpowers per install unit and sub-skill; the three non-skill candidates** - `3edfc193` (docs)
3. **Task 3: ui-ux-pro-max, allowed-tools, proposals, conflicts, revisit triggers** - `d161d0d2` (docs)

The tracer gate after Task 1 ran in interactive `end-of-phase` mode with an automated-only verify: both checks were re-run and passed, so the plan continued to Task 2 with no checkpoint.

## Files Created/Modified

- `.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md` - the SKILL-02 record: floors, pins, whole-plugin and per-sub-skill matrices, shape findings, allowed-tools, proposals, conflicts, revisit triggers, ratification.

## Decisions Made

- Pins follow D-12: tag plus SHA where a tag exists, plugin version plus SHA (with "no tag: the repository has none") for claude-plugins-official. The local clone has no `.git`, so its files were compared with `gh api` blobs at the pinned SHA (identical) and the evidence cites the pin.
- `test-driven-development` fails planning authority: its "Delete it. Start over." / "MANDATORY. Never skip." rule makes TDD unconditional and overrides WF04's `quality.tdd` dial (default `encouraged`). The red-green-refactor technique itself matches WF04 step 6.
- `receiving-code-review` fails network on one line (`gh api .../comments/{id}/replies`), so it is not proposed. Research had listed it as likely to pass.
- feature-dev's network cell is `UNKNOWN - verify`: its agents are granted `WebFetch`/`WebSearch` but no line tells them to fetch.
- A conflict 5 was added beyond the four the plan named: proposing superpowers sub-skills installs a process-defining hook, against the roadmap note "No third-party skill is preloaded or made process-defining".

## Deviations from Plan

None that changed scope. Two judgment calls differ from the research's preliminary map, and the record says so: `receiving-code-review` fails network, and `test-driven-development` is judged a process conflict. The plan's conflict 3 (SKILL-04 if ui-ux-pro-max is not proposed) is written as a conditional, since ui-ux-pro-max is proposed but not yet ratified.

## Issues Encountered

- The first acceptance check for "no tag: the repository has none" counted 0 because the phrase was capitalised mid-sentence; reworded before the Task 1 commit.
- The whole-plugin table initially had frontend-design first (the tracer row); rows were reordered to the SKILL-02 order in Task 2.

## Known Stubs

None. Every section placeholder written in Task 1 was replaced by Task 3.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 42-04 can present § Proposed recommendations and § Requirement conflicts to the human verbatim. SKILL-02 stays open in REQUIREMENTS.md until 42-04, which also declares it, finishes.
- Plans 42-06 and 42-07 read the pins from § Candidates and pins once ratified.

## Self-Check: PASSED

- FOUND: `.planning/phases/42-skills-per-role-and-evaluation/42-EVALUATION.md`
- FOUND: `1d56ebc8`, `3edfc193`, `d161d0d2` (ancestors of HEAD)
- Task 1, 2 and 3 `<automated>` checks re-run after the last commit: SECTIONS-OK, PINS 6, SP-OK, EVAL-OK

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*
