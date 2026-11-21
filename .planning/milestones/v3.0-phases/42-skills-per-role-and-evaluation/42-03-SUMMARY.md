---
phase: 42-skills-per-role-and-evaluation
plan: 03
subsystem: kit-text
tags: [skills, agents-md, role-switch-protocol, claim-registry, style-dispositions, vitest]

requires:
  - phase: 41
    provides: the role-switch protocol's `## The 5 steps` (pinned by scripts/flow-guidance-text.test.ts) and the 29-style-dispositions contract
provides:
  - The one skills precedence line in AGENTS.md § Role / workflow files (D-14)
  - The role-switch protocol's skills line under step 2 (D-05, D-06)
  - scripts/skills-kit-text.test.ts, derived single-occurrence and protocol pins
  - An `## Adjudicated as NOT a claim` registry row for the precedence line
  - docs/audit/29-style-dispositions/42-03.md with one row per changed clause
affects: [42-04, 42-06, 42-07]

actuals:
  tokens: 3400
  tasks: 2
  commits: 4
plan_head_before: 127b060d31c5b15a81c1b2483653eb953932f062
plan_head_after: 141fe1d9139083e0ae15d1e5c34536f4d8c8cf9e

tech-stack:
  added: []
  patterns:
    - "A stated-once rule is pinned by a derived walk over the reader-facing corpus (more than 50 files asserted), never by a file list"

key-files:
  created:
    - scripts/skills-kit-text.test.ts
    - docs/audit/29-style-dispositions/42-03.md
  modified:
    - AGENTS.md
    - agent-factory/roles/_role-switch-protocol.md
    - docs/audit/28-claim-registry.md

key-decisions:
  - "Both kit lines landed word for word as the plan's target text; no gate refused a sentence"
  - "The protocol line's five clauses got five disposition rows although the D-30 role-rule stand-in admitted them, because the dispositions file records every clause the plan changed"

patterns-established:
  - "Skills precedence lives once in AGENTS.md; every other file points to AGENTS.md rather than restating it"

requirements-completed: [SKILL-03, SKILL-01]

coverage:
  - id: D1
    description: "AGENTS.md § Role / workflow files carries the one precedence line (technique, never process), outside every claim anchor"
    requirement: SKILL-03
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#the skills precedence line (D-14)"
        status: pass
      - kind: other
        ref: "node scripts/check-claim-anchors.js && node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "The phrase occurs exactly once across AGENTS.md, README.md, install/README.md, agent-factory/**/*.md and docs/*.md"
    requirement: SKILL-03
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#occurs exactly once across the reader-facing corpus, and that once is in AGENTS.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Role-switch protocol step 2 gains the skills line: host list only, <plugin>:<name> counts as <name>, fallback at once, no disk search, AGENTS.md wins; five steps unchanged; no per-host path table"
    requirement: SKILL-01
    verification:
      - kind: unit
        ref: "scripts/skills-kit-text.test.ts#the role-switch protocol's skills line (D-05, D-06)"
        status: pass
      - kind: unit
        ref: "scripts/flow-guidance-text.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Disposition rows for the six changed clauses, each pending a named human's reading against the diff"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js"
        status: pass
    human_judgment: true
    rationale: "The gate proves each changed clause has a row; whether each disposition is right is a named human's judgement (29-style-dispositions/README.md § What this directory does not settle)"

duration: 3min
completed: 2026-11-16
status: complete
---

# Phase 42 Plan 03: Skills precedence line and protocol skills line Summary

**One AGENTS.md line puts grugops roles, workflows and hard limits above any skill's text, and step 2 of the role-switch protocol limits skills to the host's own list with an immediate fallback and no disk search, both pinned by a derived corpus walk**

## Performance

- **Duration:** 3 min
- **Started:** 2026-11-16T13:13:14Z
- **Completed:** 2026-11-16T13:16:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- AGENTS.md § *Role / workflow files* now ends with the precedence paragraph, separated from the list by a blank line, so it sits outside the C-28-014 anchor region; AGENTS.md is 8,779 B.
- `_role-switch-protocol.md` step 2 has one new indented line with the five target sentences; `## The 5 steps` and its five numbered steps are byte-identical otherwise.
- scripts/skills-kit-text.test.ts derives the corpus (AGENTS.md, README.md, install/README.md, recursive `agent-factory/**/*.md`, top-level `docs/*.md`), asserts more than 50 files, and requires the phrase once, in AGENTS.md; it also pins the protocol's five steps, the five sentences in order on one line under step 2, and the absence of `.agents/skills`, `.claude/skills` and the precedence phrase in the protocol.
- The claim registry's `## Adjudicated as NOT a claim` table has a row for the line: an imperative to the agent, like the coding rules row.
- docs/audit/29-style-dispositions/42-03.md holds six rows: one for the AGENTS.md clause (the gate's one finding) and five for the protocol clauses.

## Task Commits

1. **Task 1: precedence line tracer**: `58d3f9f` (test, RED), `ec8a167` (docs, GREEN)
2. **Task 2: protocol skills line**: `7d2c297` (test, RED), `141fe1d` (docs, GREEN)

**Plan metadata:** the docs(42-03) commit that follows this SUMMARY

## TDD record

- **RED, Task 1:** `npx vitest run scripts/skills-kit-text.test.ts --reporter=tap-flat` exited 1. All three targets failed on their planned assertions: the walk returned `[]` where `[{ file: 'AGENTS.md', count: 1 }]` was expected, the section did not contain the sentence, and the line index was -1. No load, syntax or collection fault. `gsd-tools check tdd-red-evidence` returned `INVALID_RED (invalid_record)` with `report_errors: ["Non-TAP data in report", "Malformed TAP"]`, because Vitest's TAP reporter writes multi-line `actual`/`expected` values without YAML indentation. The parser verdict is recorded as given. `workflow.tdd_mode` is false for this project, so the plan-level gate is not enforced; the semantic assessment above is the basis for proceeding.
- **RED, Task 2:** the same command exited 1. The target `puts the five skills sentences under step 2, in order, on one line` failed on its `toContain` assertion; the two guard cases (five steps, no per-host path) passed at HEAD, as intended, since they pin existing structure.
- **GREEN:** both tasks went green with the text edits alone. No REFACTOR commit.
- **Tracer gate (Task 1):** interactive run, `human_verify_mode` end-of-phase, automated-only `<verify>`. The verify was re-run before Task 2 and passed (172 tests across 3 files; check-claim-anchors, check-diff-disposition, check-banned-claims and check-public-docs-vocabulary all exit 0).

## Verification

- Task 1 vitest: 3 files, 172 passed. Gates: check-claim-anchors, check-diff-disposition, check-banned-claims, check-public-docs-vocabulary all exit 0.
- Task 2 vitest: skills-kit-text, flow-guidance-text and check-role-rules, 3 files, 261 passed. Gates: check-role-rules, check-diff-disposition, check-imperative-lexicon, check-foundation-guards, check-kit-refs, check-banned-claims all exit 0.
- Role corpus: 60,751 B over 20 files (WARN above 64,000 B; 6,632 B headroom).
- `npm run freshness:guarantees`: "Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration."
- Acceptance greps: the phrase count in AGENTS.md is 1, `agent-factory` has 0 files with it, `## The 5 steps` 1, `only when the host lists it` 1, `Never search the disk for a skill.` 1, numbered steps 5.

## Files Created/Modified

- `AGENTS.md`: the precedence paragraph (line 32)
- `agent-factory/roles/_role-switch-protocol.md`: the skills line (line 18)
- `docs/audit/28-claim-registry.md`: one adjudication row
- `docs/audit/29-style-dispositions/42-03.md`: the plan's disposition file
- `scripts/skills-kit-text.test.ts`: derived text pins

## Decisions Made

- The target text was applied word for word; no gate refused a sentence.
- After the protocol edit, check-diff-disposition gave no finding, because the D-30 role-rule inventory stand-in admitted the five new clauses (956 to 961). Five rows were written anyway, one per clause, because the plan asks for a row for the new clause and the dispositions file records every changed clause. With the rows in place the stand-in count returns to 956 and the gate still passes.

## Deviations from Plan

None. The plan ran as written.

## Issues Encountered

- The RED evidence classifier rejected Vitest's TAP output as malformed (multi-line YAML values). Recorded in the TDD record above; no workaround was applied.

## Known Stubs

None.

## Threat Flags

None. T-42-10 is mitigated by the AGENTS.md line, and T-42-11 by the protocol line and its pin.

## User Setup Required

None.

## Next Phase Readiness

- Plan 42-07 can point docs/skills.md at the AGENTS.md line and state the limit that an install never overwrites a user's own AGENTS.md.
- The disposition rows in 42-03.md are pending a named human's reading.

---
*Phase: 42-skills-per-role-and-evaluation*
*Completed: 2026-11-16*

## Self-Check: PASSED
