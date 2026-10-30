---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 14
subsystem: tooling
tags: [model-tiers, levels, effort, adapters, model-01, gap-closure]

requires:
  - phase: 39
    provides: "LEVELS table, the per-adapter resolver, the three generated level adapters and the MODEL-01 level records (plans 39-01, 39-02, 39-07)"
provides:
  - "LEVELS pins junior haiku/xhigh, mid sonnet/high, senior opus/medium (D-14 as amended by the human on 2026-10-30, G-39-5)"
  - "Quality-only effortRationale per level; the senior row no longer claims deeper reasoning"
  - "Three regenerated level adapters and a rebuilt scripts/model-tiers.js"
  - "MODEL-01 level records moved by recorded decision, no assertion loosened"
  - "Every level-pin test literal (model-tiers, adapter-byte-baseline, generate-role-adapters, check-foundation-guards, install) on the new pins"
  - "Dated PROJECT.md Key Decisions row; TIER-02, ROADMAP SC2 and 39-CONTEXT.md D-14 name the new efforts"
affects: [39-15, phase-39-uat]

actuals:
  tokens: 9300
  tasks: 3
  commits: 4
plan_head_before: 90d3e9d0f5e1adbcb7b127c9b345ae5914d3b7c1
plan_head_after: 4a3be455750e15920216d38f053b1700820d2748

tech-stack:
  added: []
  patterns:
    - "A pin moves once in LEVELS; adapters, guards, freshness and MODEL-01 follow; test literals are moved by hand from the decision, never read from LEVELS"

key-files:
  created: []
  modified:
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - .claude/agents/grugops-software-engineer-junior.md
    - .claude/agents/grugops-software-engineer-mid.md
    - .claude/agents/grugops-software-engineer-senior.md
    - scripts/model-tiers.test.ts
    - scripts/adapter-byte-baseline.test.ts
    - scripts/generate-role-adapters.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/install.test.ts
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-CONTEXT.md
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/deferred-items.md

key-decisions:
  - "Engineer level efforts are junior xhigh, mid high, senior medium (human re-decision 2026-10-30, G-39-5; amends D-14 and the effort half of D-2); models unchanged"
  - "The level efforts deliberately diverge from the effort `tiered` rule (opus high, others medium); no preset reconciles them (D-16)"

patterns-established:
  - "A re-decided pin moves MODEL-01 records by literal plus a dated reason, never by loosening an assertion (D-3)"

requirements-completed: [TIER-02, TIER-03, TIER-06]

coverage:
  - id: D1
    description: "LEVELS table pins junior haiku/xhigh, mid sonnet/high, senior opus/medium with quality-only effort rationales"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#LEVELS holds exactly three rows, junior haiku xhigh, mid sonnet high, senior opus medium"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#no effortRationale carries a cost, price, token, saving, limit or speed word (MODEL-07)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three generated level adapters carry the new effort lines and nothing else moved; freshness, build parity and foundation guards green"
    requirement: TIER-06
    verification:
      - kind: other
        ref: "npm run freshness:adapters && npm run freshness && npm run check:build-parity && node scripts/check-foundation-guards.js"
        status: pass
      - kind: unit
        ref: "scripts/adapter-byte-baseline.test.ts#a level adapter is the baseline base adapter of its role with exactly five transforms"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-15/D-16 precedence matrix holds on the new pins; D-16 effort-tiered case now discriminates"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#the level precedence matrix (plan 39-01, D-14, D-15, D-16)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Generator, guard and installer suites assert the new pins"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts install/install.test.ts"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (guard_effort_assignment): junior's `effort: xhigh` line removed is named"
        status: pass
    human_judgment: false
  - id: D5
    description: "The re-decision is recorded with date and decider in PROJECT.md, TIER-02, ROADMAP SC2 and 39-CONTEXT.md, with no invented reason"
    requirement: TIER-03
    verification: []
    human_judgment: true
    rationale: "Whether the record states only what the human decided is a judgment call no test asserts"
  - id: D6
    description: "Live Claude Code 2.1.293+ session spawning each level adapter by name shows haiku/xhigh, sonnet/high, opus/medium (UAT test 5 re-run)"
    requirement: TIER-02
    verification: []
    human_judgment: true
    rationale: "Requires a live Claude Code session and /tasks inspection; collected at the end of the phase"

duration: 11min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 14: Engineer Level Effort Re-pin (G-39-5) Summary

**The engineer level adapters now run junior haiku/xhigh, mid sonnet/high and senior opus/medium. The pins come from the one LEVELS table, MODEL-01 moved by recorded decision, and the human's 2026-10-30 re-decision is dated in PROJECT.md.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-30T15:02:09Z
- **Completed:** 2026-10-30T15:13Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- LEVELS efforts moved to `xhigh` / `high` / `medium`. Each `effortRationale` uses the planner's quality-only text, and the senior row's "deeper reasoning goes where" claim is removed. The D-2 record and the LEVELS header cite the amendment, and the header notes that the divergence from the effort `tiered` rule is deliberate.
- The generator changed only the three level adapters, one `effort:` line each. `model-tiers.js` was rebuilt, and freshness, build parity and the foundation guards are green.
- MODEL-01 `RECORDED_ADDED` level records carry the new literals, each with a reason that names the 2026-10-30 re-decision. No assertion was changed, and the five-transform case is untouched.
- Every level-pin literal across the five suites now names the new pins. The D-16 effort-`tiered` case now tells the two outcomes apart, because the new pins differ from the rule's output on every level.
- PROJECT.md has a dated Key Decisions row (no reason invented for the human), and the D-2 outcome note points to it. TIER-02, ROADMAP SC2 and 39-CONTEXT.md (the D-14 amended bullet plus a D-2 note) name the new efforts.

## Task Commits

1. **Task 1 (tracer): RED literals** - `67d73395` (test)
2. **Task 1 (tracer): re-pin LEVELS, regenerate adapters, rebuild .js** - `539ab4e7` (fix)
3. **Task 2: generator/guard/installer literals** - `dec099ae` (test)
4. **Task 3: record the re-decision** - `4a3be455` (docs)

## Verification

- `npm run build && npm run typecheck`: exit 0
- `npx vitest run scripts/model-tiers.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts scripts/generate-role-adapters.test.ts install/install.test.ts`: 5 files, 816 passed, 1 skipped
- Task 1 RED run: 12 pin cases failed against the old table and the old adapters before the fix, which shows the records catch a mismatch
- `npx vitest run scripts/check-foundation-guards.test.ts`: 336 passed, 1 failed. The failure is environmental (see Issues Encountered). Every level case passes.
- `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-banned-claims.js`, `npm run freshness:adapters`, `npm run freshness`, `npm run check:build-parity`: all exit 0
- `node scripts/check-diff-disposition.js`: 721 findings (unchanged baseline)
- `docs/audit/28-prepass-evidence.md` is still ` M`, untouched and unstaged
- Straggler sweep `grep -rnE "junior.{0,80}(medium|high)|senior.{0,80}(medium|high)|(medium|high).{0,40}(junior|senior)|sonnet.{0,40}medium" scripts/*.ts install/*.ts`: 25 hits after Task 2. Each one states the new pin for its level, except `scripts/tier-kit-text.test.ts:459`, which was kept on purpose because plan 39-15 moves it with the doc it pins. No dated history comment needed the "(efforts re-decided 2026-10-30, G-39-5)" note.
- Tracer gate: auto mode is off and `human_verify_mode` is `end-of-phase`. The tracer's automated `<verify>` was re-run and passed. Its `<human-check>` (UAT test 5 re-run) says it is collected at the end of the phase, so it is left for the phase-end UAT and was not raised as a checkpoint here.

## Decisions Made
- I kept the planner's candidate rationale texts word for word. No gate refused any of their words.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `scripts/check-foundation-guards.test.ts`, case "every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose" (LANG-07), fails because of the stray untracked `~/` directory at the repo root. The `.js` walk finds seven files under `~/projects/hacks/grugops-example-01/tools/grugops/` that git does not track. Plan 39-14 did not cause this, and the directory must not be touched, so it is logged in `deferred-items.md` and left for the human.

## Known Stubs
None.

## User Setup Required
None.

## Next Phase Readiness
- Plan 39-15 moves the user docs, the CHANGELOG and `scripts/tier-kit-text.test.ts:459` to the new pins.
- Human item: re-run UAT test 5 (spawn each level adapter by name on Claude Code 2.1.293+ and check /tasks).

## Self-Check: PASSED
- All 15 modified files exist on disk
- Commits 67d73395, 539ab4e7, dec099ae and 4a3be455 are ancestors of HEAD
- All acceptance criteria for Tasks 1-3 were re-run and pass

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-30*
