---
phase: "39"
plan: "01"
subsystem: tooling
tags: [kit-model, model-tiers, frontmatter, levels, adapters, vitest]

requires:
  - phase: 34
    provides: "models.effort dial, resolveEfforts, effortRationale on TIERED"
  - phase: 29.1
    provides: "TIERED preset, resolveModels, readModelsConfig, tieredCorpusRefusals"
provides:
  - "kit-model: AGENT_ADAPTER_PREFIX, AgentAdapterSpec, LEVELED_ROLE_COUNT (0), listAgentAdapterSpecs, listAgentAdapterNames"
  - "model-tiers: LevelTier, LEVELS, LEVEL_COUNT, levelTableRefusals, presetGovernedStems, configKeyStems, resolveAdapterAssignments, zeroConfigAssignments"
  - "MODEL_TIERS_COUNT = ROLE_COUNT - LEVELED_ROLE_COUNT; tieredCorpusRefusals judged against preset-governed stems"
affects: [39-02, 39-03, 39-07, generate-role-adapters, check-foundation-guards, adapters-freshness]

actuals:
  tokens: 20641
  tasks: 3
  commits: 4
plan_head_before: 8a530552d6c0e815d2959d16a8c06d99cc2d612b
plan_head_after: fd463259a3c2a28255f59368bc802fd6218e5586

tech-stack:
  added: []
  patterns:
    - "Agent adapter identity is a derived spec {name, adapterStem, roleStem, roleFile, level}; the role stem is a grouping attribute"
    - "Level adapters resolve outside every preset: roles[stem-level] ?? roles[stem] ?? LEVELS row"

key-files:
  created:
    - .planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/deferred-items.md
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - scripts/model-tiers.test.ts
    - scripts/board-readonly.test.ts
    - scripts/check-foundation-guards.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "resolveAdapterAssignments refuses any models.roles / models.effort.roles key outside configKeyStems(specs) even when called directly, not only through readModelsConfig (T-39-02)"
  - "levelTableRefusals runs on every resolveAdapterAssignments call, including trees with no level spec, so a broken LEVELS table fails closed everywhere"
  - "resolveAdapterAssignments takes an optional third parameter, the level table (default LEVELS), so an oracle can drive an adversarial table"
  - "Number and RegExp admitted to the dashboard read-only guard's global-callee allow-list (ten to twelve), because kit-model.js now pulls scripts/frontmatter.js into the board-dashboard.js closure"
  - "Assumption A1 recorded: models.preset tiered, like none, leaves the level pins in place"

patterns-established:
  - "One derivation of adapter identity: listAgentAdapterSpecs reads levels through parseFrontmatter, never a local line parser"
  - "Zero-config answer has one implementation: zeroConfigAssignments calls resolveAdapterAssignments with the zero-config ModelsConfig"

requirements-completed: [TIER-02, TIER-06]

coverage:
  - id: D1
    description: "listAgentAdapterSpecs / listAgentAdapterNames derive adapter identity from role `levels`; the live tree derives today's 17 names"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#kit-model: agent adapter identity (plan 39-01, TIER-02)"
        status: pass
      - kind: other
        ref: "git diff --quiet HEAD -- .claude/agents"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every malformed levels declaration and every case-folded name collision throws naming the role file(s)"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#kit-model: every refusal of the levels derivation (plan 39-01, TIER-02, TIER-06)"
        status: pass
    human_judgment: false
  - id: D3
    description: "LEVELS table with D-14 pins and levelTableRefusals; resolveAdapterAssignments and zeroConfigAssignments implement the D-14/D-15/D-16 precedence"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#the level precedence matrix (plan 39-01, D-14, D-15, D-16)"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#levelTableRefusals (plan 39-01, MODEL-07)"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#per-adapter resolution and the level pins (plan 39-01, D-14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "MODEL_TIERS_COUNT derived from preset-governed roles; TIERED coverage judged against presetGovernedStems"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#TIERED coverage follows the preset-governed stems (plan 39-01, D-16)"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D5
    description: "LEVELS rationale and effortRationale wording argues quality only, with no cost or speed claim"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#no effortRationale carries a cost, price, token, saving, limit or speed word (MODEL-07)"
        status: pass
    human_judgment: true
    rationale: "The vocabulary and digit refusals pass mechanically, but whether the three rationales argue the D-2 / D-14 quality case well is a reviewer judgment"

duration: 33min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 01: Agent Adapter Derivation and Level Pins Summary

**Two derivations as library functions. `listAgentAdapterSpecs` reads each role's `levels:` key through `parseFrontmatter` and expands that role into level adapters. `resolveAdapterAssignments` pins junior haiku/medium, mid sonnet/medium and senior opus/high outside every preset, with role-wide and per-level overrides. On the live tree it changes nothing: 17 adapter names, and no adapter byte moved.**

## Phase 39 start commit

`8a530552d6c0e815d2959d16a8c06d99cc2d612b` (recorded before the first commit of this plan; plan 39-03 re-pins the MODEL-01 baseline to exactly this commit).

## Performance

- **Duration:** 33 min
- **Started:** 2026-10-29T16:19:42Z
- **Completed:** 2026-10-29T16:52:31Z
- **Tasks:** 3
- **Files modified:** 10 (plus deferred-items.md created)

## Accomplishments

- `scripts/kit-model.ts` now holds the one derivation of agent adapter identity. It exports `AGENT_ADAPTER_PREFIX`, `AgentAdapterSpec`, `LEVELED_ROLE_COUNT = 0`, `listAgentAdapterSpecs` and `listAgentAdapterNames`. These throw, naming the role file, on: frontmatter that cannot be read, `levels` declared twice, an empty value, a repeated level, a level that is not lower-case kebab, and a name that collides with another role's adapter after lower-casing (both files are named).
- `scripts/model-tiers.ts` gains:
  - `LEVELS` (D-14), with a quality-only rationale and effortRationale on each row, and `LEVEL_COUNT = 3`.
  - `levelTableRefusals`.
  - `presetGovernedStems` and `configKeyStems`.
  - `resolveAdapterAssignments`: non-level adapters go through the existing `resolveModels` and `resolveEfforts`. Level adapters use `roles[stem-level] ?? roles[stem] ?? LEVELS` with no preset (D-15, D-16).
  - `zeroConfigAssignments`, which is only a call to the resolver.
- `MODEL_TIERS_COUNT` is now `ROLE_COUNT - LEVELED_ROLE_COUNT`. TIERED coverage is judged against the preset-governed stems, so when plan 39-07 drops the software-engineer row, that change follows from the derivation.
- On the live tree: 17 adapter names equal to `listAgentAdapters()` with `.md` removed. Zero config gives inherit/inherit for every adapter, and under every preset pair the results equal the old resolvers. `.claude/agents` is byte-unchanged.

## Task Commits

1. **Task 1 (tracer): end-to-end derivation and D-14 pins.** `56224bfc` (feat). The tracer gate re-ran the full Task 1 verify before expansion, and it passed.
2. **Task 2 (TDD): refusals and the precedence matrix.** RED `55307028` (test), GREEN `e56da1a9` (feat). No refactor was needed.
3. **Task 3: TIERED coverage from the preset-governed stems.** `fd463259` (feat).

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD record (Task 2)

- **RED:** `npx vitest run scripts/kit-model.test.ts scripts/model-tiers.test.ts --reporter=tap-flat` exited 1, with 333 passed and 5 failed of 338. The target was `levelTableRefusals > resolveAdapterAssignments REFUSES rather than pins when the level table is broken`. It failed on its planned assertion: `expected true to be false`, because the resolver ignored the table. The four `levelTableRefusals` cases failed on `expected 'undefined' to be 'function'`, because the export was absent. The classifier (`gsd_run check tdd-red-evidence`) returned `RED_EVIDENCE_OK` / `target_test_failed`.
  - **Semantic assessment:** the target ran and failed on the planned behavior assertion. It was not a load, syntax or fixture failure. The kit-model refusal cases and the precedence-matrix cases passed at RED. They are characterization tests of behavior that the plan's Task 1 action told me to implement, so I recorded them as passing at RED rather than treating them as a false red.
  - The RED commit does not typecheck under `tsconfig.tests.json`, because it imports the missing `levelTableRefusals` and calls the resolver with three arguments. The GREEN commit typechecks clean.
- **GREEN:** I added `levelTableRefusals(table = LEVELS)` and an optional `table` parameter on `resolveAdapterAssignments`, which checks the table on every call. All 338 cases pass.
- **REFACTOR:** none.

## Files Created/Modified

- `scripts/kit-model.ts` / `.js`: the adapter spec derivation and the frontmatter import.
- `scripts/model-tiers.ts` / `.js`: LEVELS, the level table refusals, the per-adapter resolver, the zero-config assignments and the derived MODEL_TIERS_COUNT.
- `scripts/kit-model.test.ts`: the live-tree case, the levels mirror and every refusal.
- `scripts/model-tiers.test.ts`: the D-14 literals, the D-15/D-16 matrix, the LEVELS integrity cases, the vocabulary refusal extended to LEVELS, and the TIERED cases against preset-governed stems.
- `scripts/board-readonly.test.ts`: the closure row gains `scripts/frontmatter.js`, and `Number` and `RegExp` are admitted.
- `scripts/check-foundation-guards.test.ts`: `kit-model.ts` joins the frontmatter consumer pin, and only `parseFrontmatter` is allowed.
- `hooks/hook-entry.ts` / `.js`: the manifest is regenerated for the new `kit-model.js` hash.
- `.planning/phases/39-.../deferred-items.md`: suite failures that existed before this plan.

## Decisions Made

- `resolveAdapterAssignments` refuses an unknown override key by itself, naming the legal set. It does not trust that `readModelsConfig` was the caller (T-39-02).
- The level table is checked on every resolver call, including trees that have no level spec, so a broken table fails closed everywhere.
- Assumption A1: `tiered` leaves the level pins in place, the same as `none`. This is recorded in the LEVELS header and tested.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The dashboard read-only guard refused the new closure member**
- **Found during:** Task 1.
- **Issue:** After `kit-model.js` imported `./frontmatter.js`, the board-dashboard.js closure included `frontmatter.js`. That module calls `Number(...)` and `new RegExp(...)` with no declaration, so 19 cases in `scripts/board-readonly.test.ts` went red. The plan had expected only the closure-row edit.
- **Fix:** I admitted `Number` and `RegExp` to `ADMITTED_GLOBAL_CALLEES`, with a written reason for each: both build a value and do no I/O. I raised `ADMITTED_GLOBAL_CALLEE_COUNT` from 10 to 12 and updated the wording that cited ten. `eval`, `Function` and `require` are still absent.
- **Files modified:** scripts/board-readonly.test.ts.
- **Verification:** 214 of 214 pass, including the "every admitted member is actually called" case.
- **Committed in:** `56224bfc`.

**2. [Rule 3 - Blocking] The frontmatter consumer pin in check-foundation-guards.test.ts**
- **Found during:** Task 1.
- **Issue:** That test has a two-sided list of the non-test consumers of `./frontmatter.js`, and `kit-model.ts` is now one.
- **Fix:** I added `kit-model.ts` with a dated paragraph, and added an assertion that it imports only `parseFrontmatter`, a transformation outside `GRANT_PREDICATES`.
- **Files modified:** scripts/check-foundation-guards.test.ts.
- **Verification:** the case passes, and all 320 cases in the file pass.
- **Committed in:** `56224bfc`.

---

**Total deviations:** 2 auto-fixed, both blocking (Rule 3).
**Impact on plan:** both are test-side pins that the new frontmatter import made necessary. Neither changes production behavior.

## Issues Encountered

- The full non-e2e suite was cut off by a 590 s timeout. The failures seen before the cut-off were all there before this plan. They come from archived `.planning/phases/27-*` and `31-*` directories and from a Node 26 `openAsBlobSync` census gap, and they are logged in `deferred-items.md`. Every test file that imports kit-model, model-tiers, frontmatter or the hook manifest was run separately and passes, including check-foundation-guards, floor-invariance, frontmatter, generate-role-adapters, adapter-byte-baseline, model-dial-consistency, admission-guard, adapters-freshness and install.
- One guard comment in `scripts/check-foundation-guards.ts` (Floor 3) still says `MODEL_TIERS_COUNT = ROLE_COUNT`. That file is outside this plan's scope, and plan 39-02 switches that caller.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 39-02 can now switch its consumers to `listAgentAdapterNames`, `zeroConfigAssignments`, `configKeyStems` and `presetGovernedStems`, and delete the two private `"grugops-"` copies.
- Plan 39-07 turns the levels on: `levels: junior mid senior`, `LEVELED_ROLE_COUNT = 1`, and dropping the TIERED software-engineer row.

## Self-Check: PASSED

- All modified files exist; deferred-items.md exists.
- Commits 56224bfc, 55307028, e56da1a9, fd463259 are ancestors of HEAD.
- Plan verification: build, typecheck, 555/555 targeted tests, foundation guards, hook-manifest, adapters and build freshness all green; `.claude/agents` unchanged.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
