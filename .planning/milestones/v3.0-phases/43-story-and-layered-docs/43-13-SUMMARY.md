---
phase: 43-story-and-layered-docs
plan: 13
subsystem: uat
tags: [milestone-uat, live-host, headless, engineer-levels, designer-note, human-decision]

requires:
  - phase: 43-story-and-layered-docs
    provides: "The docs and the reader review (43-12, F-07..F-12), the committed scripts/capture-live.js exports, the installer at 52c73a2c"
  - phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
    provides: "39-UAT.md tests 10 and 14, left for a live host"
provides:
  - "43-UAT.md: Phase 39 tests 10 and 14 run headless on Claude Code 2.1.325 and accepted by the human (status: complete)"
  - "uat-evidence/test10-runs.md: six runs, per-run spawns and level verdicts, redacted"
  - "uat-evidence/test14-designer-note.md: the Designer's note route, writer output and admission, redacted"
  - "The human's picks on reader-review findings F-07..F-12; four follow-ups logged in deferred-items.md"
affects: [phase 43 verification, milestone audit, follow-ups F-07 F-09 F-10 F-12]

actuals:
  tokens: 12200
  tasks: 3
  commits: 3
plan_head_before: 52c73a2cb532ea374554a6aa374a206b98c51cd7
plan_head_after: c8d085c00fab9771fdc267c3d108e5041263303a

tech-stack:
  added: []
  patterns:
    - "A live-host UAT runs in scratch repositories installed from the checkout with GRUGOPS_HOME pointed at a scratch kit home; only redacted excerpts are committed"
    - "An acceptance whose name the human did not type records how the name got there"

key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/43-UAT.md
    - .planning/phases/43-story-and-layered-docs/uat-evidence/test10-runs.md
    - .planning/phases/43-story-and-layered-docs/uat-evidence/test14-designer-note.md
  modified:
    - .planning/phases/43-story-and-layered-docs/deferred-items.md

key-decisions:
  - "Test 10 accepted (human, 2026-11-18, option A): no level adapter was reached before a Tech Lead plan named it; the limits (run 6 cut at 20 min, the grant refused git branch and npm, no unnamed-subagent hand-off) are accepted"
  - "Test 14 accepted (human, 2026-11-18, option A) with its route reworded from scripts/context-io.js to tools/grugops/note.js; a separate scratch repository set up the same way is acceptable"
  - "Reader-review findings (human, 2026-11-18): F-07 reword, F-08 keep, F-09 reword the first clause and keep 'exactly what it needs', F-10 bring docs/skills.md and install/README.md into the registry, F-12 fix in the generator; F-11 deferred to a fresh reader"
  - "The acceptance names Olger with its provenance: the name was added by the agent at his instruction ('add my name, i approve'), not typed in the reply"

requirements-completed: [TIER-01, TIER-02, TIER-05]

coverage:
  - id: D1
    description: "Test 10: six headless runs (three prompts x default and --agent grugops-orchestrator); 19 role-adapter spawns, each level adapter reached only after a Tech Lead decision note named it"
    requirement: TIER-01
    verification:
      - kind: other
        ref: "uat-evidence/test10-runs.md (spawnObservations over each transcript)"
        status: pass
    human_judgment: true
    rationale: "Accepted by the human's decision of 2026-11-18 (option A), recorded with provenance in 43-UAT.md § Human decision"
  - id: D2
    description: "Test 10 for TIER-02: no run reached a level adapter without a Tech Lead plan naming it, on either route"
    requirement: TIER-02
    verification:
      - kind: other
        ref: "uat-evidence/test10-runs.md"
        status: pass
    human_judgment: true
    rationale: "Same decision as D1"
  - id: D3
    description: "Test 14: the Designer published a note through tools/grugops/note.js by Bash; the note is admitted (2 current, 0 skipped)"
    requirement: TIER-05
    verification:
      - kind: other
        ref: "uat-evidence/test14-designer-note.md (noteRoute, authorStamps, note.js read)"
        status: pass
    human_judgment: true
    rationale: "Accepted by the human with the route reworded to tools/grugops/note.js"

duration: "about 5 h wall clock (08:40Z-13:46Z), most of it the runs and the wait for the human"
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 13: Milestone UAT for Phase 39 tests 10 and 14 Summary

**Six headless Claude Code runs showed every engineer-level adapter reached only after a Tech Lead decision note named it, and a live Designer's note went through `tools/grugops/note.js` and was admitted. The human accepted both tests (test 14 with its route reworded) and chose a path for reader-review findings F-07 to F-12. His name was added to the acceptance at his instruction and is recorded that way, not as typed.**

## Performance

- **Started:** 2026-11-18T08:40:11Z
- **Completed:** 2026-11-18T13:45:49Z (decision commit)
- **Tasks:** 3 of 3
- **Files:** 4 (3 created, 1 modified)

## Accomplishments

- Task 1: the first run in a scratch repository installed from `52c73a2c` with `GRUGOPS_HOME` set to a scratch kit
  home, and its redacted evidence.
- Task 2: all six test 10 runs and the test 14 run, each in its own fresh scratch repository set up the same way.
  The transcripts were parsed with the committed `scripts/capture-live.js` exports (`parseFrames`,
  `spawnObservations`, `noteRoute`, `authorStamps`, `redactText`, `homeSpellings`). Headless output showed every
  spawn decision, so neither test needed a live-session runbook. 43-UAT.md was written as `pending human`.
- Task 3: the human's decision is recorded in 43-UAT.md § Human decision. Both replies are quoted word for word, the
  acceptance line states where the name came from, both tests read `accepted`, and F-07..F-12 carry the human's picks.
  The frontmatter reads `status: complete`.

## Task Commits

1. **Task 1: first run and its evidence** - `07b19ebb` (docs)
2. **Task 2: all test 10 runs, test 14, the UAT record pending the human** - `1daf5449` (docs)
3. **Task 3: the human's decision** - `c8d085c0` (docs, `docs(43-13): milestone UAT decision recorded`)

Ledger: `git rev-list --count 52c73a2c..HEAD` = 3 before this SUMMARY's commit.

## UAT outcome

- **Test 10, accepted.** A level adapter was reached in four runs (mid in runs 1, 2 and 6; junior in run 4), each
  after a Tech Lead decision note named that exact adapter. No run reached senior. Run 3 spawned nothing; run 5
  stopped at BA/PM. These limits were accepted: run 6 ended at the 20-minute bound, the scoped grant refused `git`
  branch and `npm`, so no ticket reached a pull request, and no session handed work to an unnamed subagent. The runs
  therefore show the Orchestrator's choice of adapter, not Claude Code choosing a level adapter from its description.
- **Test 14, accepted with the route reworded.** The Designer ran `node tools/grugops/note.js add …` by Bash. The
  writer printed `noted uat-design-001 …`, and `note.js read` printed `2 current, 0 superseded, 0 skipped`. The
  human reworded the test's route from `scripts/context-io.js` to `tools/grugops/note.js`. The `expected:` line is
  left as written; the `result:` line states the rewording.
- **Reader-review findings:** F-08 keep; F-07, F-09, F-10 and F-12 are follow-ups in deferred-items.md; F-11 is
  deferred to a fresh reader.

## Acceptance provenance (T-43-41)

The plan allows acceptance only from a reply that ends with the human's typed name. Reply 1
("Test 10 - A. Accept ; Test 14 - A. Accept, route reworded to tools/grugops/note.js ; Optional F-07..F-12 use your
recommended path.") had no name. When asked, the human replied "add my name, i approve". The acceptance line reads:

`accepted by Olger — name added by the agent at Olger's instruction ("add my name, i approve", 2026-11-18); the name was not typed in the reply.`

This does not meet the plan's typed-name wording to the letter. It records the human's explicit approval and
instruction, and says plainly that the name was not typed. Whether that is enough is for the verifier and the human
to judge.

## Files Created/Modified

- `.planning/phases/43-story-and-layered-docs/43-UAT.md` - the milestone UAT record and the human's decision
- `.planning/phases/43-story-and-layered-docs/uat-evidence/test10-runs.md` - per-run spawn evidence
- `.planning/phases/43-story-and-layered-docs/uat-evidence/test14-designer-note.md` - the Designer note evidence
- `.planning/phases/43-story-and-layered-docs/deferred-items.md` - the `node --test` collision (Task 2) and the
  F-07, F-09, F-10, F-12 follow-ups (Task 3)

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

1. **[Acceptance wording] The name was not typed.** The plan's resume signal asks for a reply that ends with a typed
   name. The human told the agent to add his name instead. The acceptance is recorded with that provenance (see
   above) and does not claim the name was typed.
2. **[Test 14 setup] A separate scratch repository.** Test 14 says "the same scratch repo". It ran in its own
   repository set up the same way, which the human accepted.

No code changed. Rules 1-3 were not used.

## Issues Encountered

- A host's `npm test` (`node --test`) fails on a fresh install because Node's default glob matches the installed
  `tools/grugops/test-skip-integrity.js`. This is logged in deferred-items.md. The human did not ask for a fix now.
- The user-scope `grugops` plugin loaded in the headless sessions, and run 4 used its `propose_note` tool. Every
  spawn named a standalone adapter.
- The user's `docs/audit/28-prepass-evidence.md`, `brand/readme-art.txt` and `~/` were never staged. No scratch
  transcript or copy was committed.

## Known Stubs

None.

## Threat Flags

None. T-43-39: no home path appears in the phase directory (`grep -rn` for the home prefix over `uat-evidence/` and
43-UAT.md prints nothing). T-43-40: the scratch repositories and kit home were outside the checkout, and the user's
kit home was untouched (43-UAT.md § Environment). T-43-41: mitigated by the blocking checkpoint, with the provenance
caveat above.

## User Setup Required

None.

## Next Phase Readiness

Phase 43 verification can read 43-UAT.md as `status: complete`. The open follow-ups are F-07, F-09, F-10 and F-12
(deferred-items.md), F-11 for a fresh reader, and the `node --test` collision.

## Self-Check: PASSED

- FOUND: 43-UAT.md, uat-evidence/test10-runs.md, uat-evidence/test14-designer-note.md, deferred-items.md
- FOUND commits on HEAD: 07b19ebb, 1daf5449, c8d085c0 (3 = `git rev-list --count 52c73a2c..HEAD`)
- `grep -c "## Human decision" 43-UAT.md` prints 1, and the section has 28 lines; `grep -c "pending human"` prints 0
- `grep -c "^| " uat-evidence/test10-runs.md` prints 8 (≥ 8)
