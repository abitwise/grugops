---
phase: 42-skills-per-role-and-evaluation
plan: 06
subsystem: kit-text
tags: [roles, designer, frontend-ui, workflow-14, skills, dispositions, vitest]

requires:
  - phase: 42-skills-per-role-and-evaluation
    provides: "42-02 readRoleSkills reader; 42-03 skills precedence line and protocol line; 42-04 ratify-none decision and amended SKILL-01/03/04"
provides:
  - "Never-write sentence for design-system files in designer.md and frontend-ui.md § Hard limits"
  - "Workflow 14 step 1: read design-system files, never write them, files win, align notes, record each conflict"
  - "SKILLS_TABLE_HEADER and SKILLS_RECORD_FRAGMENTS constants in scripts/skills-kit-text.test.ts for plan 42-07"
  - "skillsSectionFindings contract checker, example-skill fixtures and the every-shipped-role pin"
  - "docs/audit/29-style-dispositions/42-06.md with 11 rows"
affects: [42-07, docs/skills.md, designer, frontend-ui]

actuals:
  tokens: 6742
  tasks: 2
  commits: 4
plan_head_before: adbcef65ded643d45418e0c902728ce4bbff25a7
plan_head_after: 3822a2c78031b969c306adbebdb17028d74704ba

tech-stack:
  added: []
  patterns:
    - "Scratch-kit fixture roles composed from ROLE_HEADING_ORDER and read back through readRoleSkills, so the test never parses skills: itself"
    - "A walk of AGENTS.md and agent-factory/ derives where a phrase occurs, rather than trusting a file list"

key-files:
  created:
    - docs/audit/29-style-dispositions/42-06.md
  modified:
    - agent-factory/roles/designer.md
    - agent-factory/roles/frontend-ui.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - scripts/skills-kit-text.test.ts

key-decisions:
  - "The plan's target text landed word for word; no gate refused a sentence, so no rewording was needed"
  - "designer.md is 2,749 B (WARN 2,799) and frontend-ui.md is 3,082 B (WARN 3,176); ROLE_CEILINGS did not move"
  - "Unchanged Hard limits sentences on the rewritten designer.md line get identical-sides disposition rows with a filled companion, as in 40-20.md"
  - "The undeclared-row fixture uses the invented name undeclared-example-skill, because the case needs a second name; no real third-party skill is named"
  - "skillsSectionFindings treats a dash cell (—, -, –) in Without it as empty, in addition to a blank cell"

patterns-established:
  - "Skills contract: a ## Skills section exists exactly when the role's skills: line declares a skill; table header | Situation | Skill | Without it |; one row per declared skill; non-empty fallback; the record line"

requirements-completed: [SKILL-04, SKILL-01]

coverage:
  - id: D1
    description: "Designer and Frontend/UI § Hard limits each say design-system files in the user's repo are user artifacts the role reads and never writes"
    requirement: SKILL-04
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#puts the never-write sentence in designer.md § Hard limits, pointing to Workflow 14 step 1"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#puts the never-write sentence in frontend-ui.md § Hard limits"
        status: pass
    human_judgment: true
    rationale: "The disposition rows for the changed Hard limits clauses are pending a named human's reading against the diff (docs/audit/29-style-dispositions/README.md); whether the sentence withholds the right permission is a human judgement no gate reaches."
  - id: D2
    description: "Workflow 14 step 1 says to read the design-system files, never write them, that the files win over the Designer's notes, to align the notes, and to record each conflict for the human"
    requirement: SKILL-04
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#closes Workflow 14 step 1 with the read, never-write and conflict sentences, in order, on the step's one line"
        status: pass
    human_judgment: true
    rationale: "The edge truths (a token conflict resolved in the file's favor; a repo with no design-system files changes nothing) are backstop behaviors of an agent reading the step, which no test runs."
  - id: D3
    description: "The phrase design-system files occurs only in designer.md, frontend-ui.md and Workflow 14; the protocol and AGENTS.md carry no general rule; both roles keep capabilities and declare no skill"
    requirement: SKILL-04
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#names `design-system files` in exactly the two roles and Workflow 14, walking AGENTS.md and agent-factory/"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#carries no general rule in the role-switch protocol or AGENTS.md (D-23)"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#keeps both roles' capabilities and declares no skill (42-04: no kit change)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A fixture role can declare example-skill with a fallback row and the record line; each way a declaration can lack its fallback is refused; a ## Skills section after ## Output fails checkHeadingOrder"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#a fixture role declaring `example-skill` with a fallback row and the record line passes the checker and the heading order"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#refuses %s with exactly one finding naming the role"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#refuses a row naming a skill the role does not declare with exactly one finding naming that skill"
        status: pass
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#refuses a `## Skills` section after `## Output` through checkHeadingOrder"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every one of the ROLE_COUNT shipped roles has a ## Skills section exactly when readRoleSkills lists a declaration, with no refusal"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#every shipped role has a `## Skills` section exactly when it declares a skill, and no declaration is refused"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 06: Design-system files as user artifacts, and the Skills contract Summary

**The Designer and Frontend/UI now say design-system files in the user's repo are theirs to read and never to write. Workflow 14 step 1 says the files win and each conflict is recorded for the human. A test checker proves the `## Skills` declare-plus-fallback contract on `example-skill` fixture roles and holds all 19 shipped roles to it. No shipped role declares a skill.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-16T19:36:29Z
- **Completed:** 2026-11-16T19:43:19Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- designer.md § Hard limits, second sentence: `Never write design-system files in the user's repo; they are user artifacts you read per Workflow 14 step 1.` (2,640 B to 2,749 B, WARN 2,799).
- frontend-ui.md § Hard limits, end of the first paragraph: `Never write design-system files in the user's repo; they are user artifacts you read.` (2,996 B to 3,082 B, WARN 3,176).
- Workflow 14 step 1 ends with the five sentences: read the files (token, theme or style-guide files as examples), never write them, the files win, align the notes, record each conflict for the human.
- The role corpus is 60,946 B (WARN 64,000). `ROLE_CEILINGS` is unchanged.
- scripts/skills-kit-text.test.ts gains the design-system walk, the module-level `SKILLS_TABLE_HEADER` and `SKILLS_RECORD_FRAGMENTS` for 42-07, the local `skillsSectionFindings` checker, scratch-kit fixtures, and the every-shipped-role pin.
- docs/audit/29-style-dispositions/42-06.md records all 11 changed clauses. `check-diff-disposition` shows 0 findings.

## Task Commits

1. **Task 1: never-write rule in the Designer, Frontend/UI and Workflow 14 step 1 (tracer)**
   - RED `64444172` (test): failing pins for the walk, both Hard limits sentences and the Workflow 14 sentences
   - GREEN `f795638f` (docs): the three kit-text edits and the disposition file
2. **Task 2: the declare-plus-fallback contract on fixture roles, held for every shipped role**
   - RED `13d01556` (test): constants, stub checker, fixtures and cases
   - GREEN `3822a2c7` (test): the checker implementation

**Plan metadata:** the docs(42-06) commit that adds this SUMMARY.

## TDD Gate Compliance

- **Task 1 RED:** `npx vitest run scripts/skills-kit-text.test.ts --reporter=tap-flat` failed 4 target cases on assertions. Two invariant cases passed as expected: no general rule, and unchanged capabilities. The classifier rejected the full-run report as `invalid_record` (`Malformed TAP`), because vitest prints multi-line `expected` values unindented in its YAML block. The run was repeated with `-t "closes Workflow 14 step 1"`, which gave clean TAP, and `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on its planned assertion (`step 1 does not end with the five sentences: expected false to be true`). In the full run, the walk failed with `expected [] to deeply equal [ …(3) ]` and both Hard limits cases failed on `toContain`. These were assertion errors, not load, syntax or fixture faults.
- **Task 1 GREEN:** 357/357 across the four named test files, and every gate passed.
- **Task 2 RED:** the 7 refusal cases failed on `expected [] to have a length of 1 but got +0`. In each, `readRoleSkills` admitted the fixture with no refusal before the length assertion ran. The single-target rerun of the undeclared-row case returned `RED_EVIDENCE_OK`. Semantic assessment: the stub returned no findings, so each case failed on its planned assertion. The positive, every-role and placement cases passed at RED, as designed: the stub returns no findings, and placement is the existing `checkHeadingOrder` rule.
- **Task 2 GREEN:** 190/190 across the four named test files; foundation guards, role rules and `npm run typecheck` all passed.
- Both GREEN commits use the `docs(42-06)` and `test(42-06)` subjects the plan sets, not `feat`. The kit change is markdown, and the checker lives in a test file. No REFACTOR commit was needed.

## Files Created/Modified

- `agent-factory/roles/designer.md`: the never-write sentence in § Hard limits, pointing to Workflow 14 step 1
- `agent-factory/roles/frontend-ui.md`: the never-write sentence in § Hard limits
- `agent-factory/workflows/14-ui-design-to-build.md`: the five read, never-write and conflict sentences at the end of step 1
- `scripts/skills-kit-text.test.ts`: the design-system describe block, the Skills contract describe block, the constants, the checker and the fixtures
- `docs/audit/29-style-dispositions/42-06.md`: 11 disposition rows, all `pending (named human)`

## Decisions Made

- The target text landed word for word. No gate refused a sentence, so nothing was reworded.
- The rewritten designer.md `## Hard limits` line made the gate re-derive the four unchanged sentences at the base, as `removed` findings. Each has an identical-sides row with a filled `companion` cell, as `40-20.md` does for an unchanged sentence on a rewritten line.
- The undeclared-row fixture needs a second skill name. It uses the invented `undeclared-example-skill` and names no real third-party skill. The acceptance grep for the four real names prints 0.
- `skillsSectionFindings` also treats a lone dash (`—`, `-`, `–`) in `Without it` as empty, as the plan's action asks. That case runs as a seventh refusal fixture beside the plan's five plus one.

## Deviations from Plan

None. The plan ran as written. The dash-cell fixture is one extra case of the behavior the plan's action already named, and the invented second skill name is the minimum the undeclared-row behavior needs.

## Issues Encountered

- The RED classifier refuses a record outside the project directory and refuses vitest's full-run TAP as malformed when a diagnostic spans several lines. The records were written temporarily under `.git/` and removed after use. The RED proof came from single-target reruns whose diagnostics stay on one line, as tdd.md RED step 4 allows.
- `check-foundation-guards` prints a `WARN` for `.claude/agents/grugops-orchestrator.md` (3,368 B against a 3,072 B pointer ceiling). That file was last changed in `d585bc45`, before this plan. The plan's fail condition names only designer.md and frontend-ui.md.

## Known Stubs

None. The Task 2 RED stub of `skillsSectionFindings` was replaced in the GREEN commit.

## Threat Flags

None. The plan adds no network endpoint, auth path, file write or schema change. The new tests write only to a `mkdtempSync` scratch root, which `afterAll` removes.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 42-07 can reuse `SKILLS_TABLE_HEADER` and `SKILLS_RECORD_FRAGMENTS` from scripts/skills-kit-text.test.ts for docs/skills.md.
- A named human still has to read the 11 rows in docs/audit/29-style-dispositions/42-06.md against the diff. The rows stay `pending (named human)` until then.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED

All 6 files exist; commits 64444172, f795638f, 13d01556 and 3822a2c7 are ancestors of HEAD.
