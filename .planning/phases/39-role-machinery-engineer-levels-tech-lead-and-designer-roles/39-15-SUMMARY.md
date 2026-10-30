---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
plan: 15
subsystem: docs
tags: [model-dial, levels, effort, factory-config, gap-closure]

requires:
  - phase: 39
    provides: "LEVELS re-pinned to junior haiku/xhigh, mid sonnet/high, senior opus/medium and the regenerated level adapters (plan 39-14)"
provides:
  - "factory.config.md, install/README.md and CHANGELOG [Unreleased] state the re-decided level pins (G-39-5)"
  - "The deliberate difference between the level efforts and the effort `tiered` rule is stated in the dial reference"
  - "The D-2 floor paragraph cites the 2026-10-30 read of model-config 'Adjust effort level': Haiku 5.5 and Sonnet 5.5 accept xhigh and high"
  - "The `models` Refusals paragraph names `preset`, `roles` and `effort`; the closed-set paragraph names all four closed key sets (G-39-6)"
  - "G-39-6 regression cases in model-dial-consistency.test.ts derived from MODELS_KEYS and EFFORT_KEYS"
affects: [phase-39-uat]

actuals:
  tokens: 5900
  tasks: 2
  commits: 4
plan_head_before: 9de2fabbbdd0a7c0f2fd73945bd9786662a4c327
plan_head_after: 015b02a177c81e82f275465227845cc00184d78b

tech-stack:
  added: []
  patterns:
    - "A doc paragraph that lists a closed key set is checked two ways against the module's exported tuple, so a widened tuple without its doc goes red by name"

key-files:
  created: []
  modified:
    - agent-factory/config/factory.config.md
    - install/README.md
    - CHANGELOG.md
    - scripts/tier-kit-text.test.ts
    - scripts/model-dial-consistency.test.ts

key-decisions:
  - "The D-2 floor paragraph gains one sourced sentence (model-config 'Adjust effort level', read 2026-10-30) instead of an UNKNOWN - verify: the page lists Haiku 5.5 and Sonnet 5.5 as accepting xhigh and high"
  - "The closed-set paragraph counts four closed key sets; the two `roles` maps count as closed because the resolver refuses an unknown stem in each"

patterns-established:
  - "Doc key-set clauses are tested against the exported tuples in both directions (G-39-6)"

requirements-completed: [TIER-02, TIER-03, TIER-06]

coverage:
  - id: D1
    description: "factory.config.md states the re-decided level pins, the deliberate divergence from the tiered effort rule, and the D-2 floor lines on the new efforts"
    requirement: TIER-03
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#factory.config.md names the three level adapter stems and their D-14 pins"
        status: pass
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#D-2 / D-22: the v2.1.293 floor is recorded with its source, and Haiku 4.5 on the cloud providers is `UNKNOWN - verify` for effort"
        status: pass
    human_judgment: false
  - id: D2
    description: "install/README.md level table and floor paragraph name the new efforts"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/tier-kit-text.test.ts#G-39-5: the level table carries the 2026-10-30 re-decided pins (D-14 as amended)"
        status: pass
    human_judgment: false
  - id: D3
    description: "CHANGELOG [Unreleased] three-adapters bullet corrected in place, no version picked"
    requirement: TIER-02
    verification:
      - kind: other
        ref: "sed -n '/^## \\[Unreleased\\]/,/^## \\[/p' CHANGELOG.md | grep -c 'effort `xhigh`' prints 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "The `models` Refusals and closed-set paragraphs name the key sets the resolver closes, held by derived cases"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/model-dial-consistency.test.ts#G-39-6 (a), (b), (c)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The wording of the new sentences is clear and makes no cost or speed claim for an effort"
    requirement: TIER-03
    verification: []
    human_judgment: true
    rationale: "Voice and the absence of an implied claim are judgment calls no test asserts"

duration: 5min
completed: 2026-10-30
status: complete
---

# Phase 39 Plan 15: Level Pin Docs and `models` Key-Set Wording (G-39-5, G-39-6) Summary

**factory.config.md, the install README and the CHANGELOG now state the shipped level pins: junior `haiku`/`xhigh`, mid `sonnet`/`high`, senior `opus`/`medium`. The dial reference also names `effort` as a legal `models` key and lists all four closed key sets. Test cases derived from MODELS_KEYS and EFFORT_KEYS keep that wording in step with the module.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-30T15:15:14Z
- **Completed:** 2026-10-30T15:20Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- factory.config.md, Engineer levels paragraph: the pin sentence names the new efforts. A new sentence says the efforts differ from what the effort preset `tiered` gives the same models (`high` for `opus`, `medium` otherwise), that the difference is on purpose (decided 2026-10-30), and that no preset changes a level. The absent-block paragraph names `xhigh`, `high` and `medium`.
- D-2 floor paragraph: the junior adapter is `haiku` at effort `xhigh`, and the paragraph notes that the effort D-2 named was amended on 2026-10-30. The Haiku 4.5 and Sonnet 4.5 notes now name the `effort: xhigh` and `effort: high` lines and stay `UNKNOWN - verify`. One sourced sentence was added: model-config "Adjust effort level", re-read 2026-10-30, lists Haiku 5.5 and Sonnet 5.5 as accepting `xhigh` and `high`. The `UNKNOWN - verify` count is still 4.
- install/README.md: the three level-table effort cells are now `xhigh`, `high`, `medium`, and the floor paragraph names `effort: xhigh`. CHANGELOG `[Unreleased]`: the three-adapters bullet was corrected in place, with no version number.
- G-39-6: the `models` Refusals clause now reads "not `preset`, `roles` or `effort`". The closed-set paragraph opens with four closed key sets. The open top level, the `"model"` misspelling example and the missing registry are kept word for word. None of the four closed-set markers was written, so the marker counts are still 2/2/1/1.
- New describe block in model-dial-consistency.test.ts. Cases (a) and (c) failed on HEAD's wording, and (b), the `models.effort` control, passed on HEAD. All three pass now.

## Task Commits

1. **Task 1 (tracer): RED pins** - `b1d361ce` (test)
2. **Task 1 (tracer): docs on the re-decided pins** - `dce16b9e` (docs)
3. **Task 2: RED G-39-6 cases** - `661a1409` (test)
4. **Task 2: GREEN key-set wording** - `015b02a1` (fix)

## Verification

- `npm run build && npm run typecheck`: exit 0
- `npx vitest run scripts/tier-kit-text.test.ts scripts/model-dial-consistency.test.ts scripts/config-governance-consistency.test.ts scripts/check-public-docs-vocabulary.test.ts`: 4 files, 215 passed
- `npx vitest run scripts/model-dial-consistency.test.ts -t "G-39-6"`: 3 passed
- check-banned-claims, check:public-docs, check:claim-anchors, check-kit-refs, check-foundation-guards, `VALIDATE_KIT_ROOT=. validate-agent-factory`, freshness:catalog, freshness: all pass
- `node scripts/check-diff-disposition.js`: still 721 findings
- `scripts/check-foundation-guards.test.ts`: 336 passed, 1 failed. The failure is the known environmental case caused by the stray `~/` directory, already logged by 39-14 in deferred-items.md.
- `docs/audit/28-prepass-evidence.md` still shows ` M` and was never staged.
- Tracer gate: the Task 1 `<verify>` was re-run on the committed state and passed before Task 2 started.

## TDD Gate Compliance

- G-39-5: RED `b1d361ce` (2 cases failed), then GREEN `dce16b9e`
- G-39-6: RED `661a1409` ((a) and (c) failed, (b) passed as the control), then GREEN `015b02a1`
- No REFACTOR commit was needed.

## Decisions Made
- Task 1 step 3: the page was re-read with curl on 2026-10-30. Its effort table confirms the planner's read, so the sentence is sourced rather than `UNKNOWN - verify`.
- The new D-2 sentence goes after "does not check the installed Claude Code version", so "this floor" still refers to the v2.1.293 sentence before it.
- (c) checks for the retired opening "Two key sets are closed", which is the sentence on HEAD up to its first colon, without the bold label.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The one environmental check-foundation-guards.test.ts case (stray `~/` directory) was already known and is not caused by this plan.

## Next Phase Readiness
- G-39-5 docs and G-39-6 are closed. The live `/tasks` check of the level adapters (UAT test 5 re-run) still needs a human in a Claude Code 2.1.293+ session.

## Self-Check: PASSED
- All five modified files exist; commits b1d361ce, dce16b9e, 661a1409, 015b02a1 are ancestors of HEAD.
