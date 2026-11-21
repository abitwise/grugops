---
phase: "39"
plan: "02"
subsystem: tooling
tags: [generate-role-adapters, check-foundation-guards, adapters-freshness, levels, kit-03, vitest]

requires:
  - phase: 39
    provides: "39-01: AGENT_ADAPTER_PREFIX, listAgentAdapterSpecs, listAgentAdapterNames, LEVELED_ROLE_COUNT, presetGovernedStems, configKeyStems, resolveAdapterAssignments, zeroConfigAssignments"
provides:
  - "generate-role-adapters: one adapter per AgentAdapterSpec, `Adapter.level`, the ` Level: <level>.` description suffix, the level body line, the leveled-coordinator refusal"
  - "check-foundation-guards: KIT-03 Set 1 from listAgentAdapterNames; adapterStemOf; both value guards keyed by adapter stem through recomputeAssignmentExpectation, degrading to zeroConfigAssignments"
  - "adapters-freshness: per-adapter zero-config expectation (ZERO_CONFIG_MODEL_BY_ADAPTER / ZERO_CONFIG_EFFORT_BY_ADAPTER) in checkAnnouncedMap, plus a derived-vs-regenerated name check"
  - "Only scripts/kit-model.ts declares the agent namespace constant, pinned by a source scan"
affects: [39-03, 39-07, generate-role-adapters, check-foundation-guards, adapters-freshness, install]

actuals:
  tokens: 38114
  tasks: 2
  commits: 2
plan_head_before: 4caf99c5acc6264ffb0e2f4dc921c2c5e421b667
plan_head_after: 063c25f1b5fbd978d84a90983899e8c869630edd

tech-stack:
  added: []
  patterns:
    - "Every consumer of adapter identity iterates AgentAdapterSpec and looks values up by adapterStem; no module but kit-model builds a name from a stem"
    - "A degraded value-guard expectation is the zero-config answer (inherit for non-level adapters, the LEVELS pin for level adapters), never inherit everywhere"

key-files:
  created: []
  modified:
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - scripts/adapters-freshness.test.ts
    - install/install.test.ts

key-decisions:
  - "Guard findings now name an ADAPTER stem (`adapter stem \"software-engineer-junior\"`), and the KIT-03 pass line reads `N derived adapter names == N adapters == N grant-closure names`; the test pins were updated to the new wording rather than the guard keeping a role-stem sentence that is false for a level adapter"
  - "The freshness gate keys its zero-config record by spec.name, not by prefixing a stem, so it builds no adapter name of its own"
  - "The levels mirror at the gate is judged by a scratch build in plan 39-07's shape (LEVELED_ROLE_COUNT 1, no TIERED software-engineer row); without those two source edits the TIERED table correctly names a stem the corpus no longer governs"
  - "Both value guards share recomputeAssignmentExpectation, so the reader, the resolver and the degrade target are one code path for the model and effort dials"

patterns-established:
  - "Leveled-coordinator refusal: the grant and `coordinator: true` belong to exactly one adapter"
  - "RED for a plan whose implementation landed in its tracer: run the new cases against the previous plan's compiled builds (git show <base>:file), then restore the file"

requirements-completed: [TIER-02, TIER-06]

coverage:
  - id: D1
    description: "The generator emits one adapter per AgentAdapterSpec: level adapters carry the role's tools, the ` Level: <level>.` description, the D-14 model and effort, the `## Levels` body line, and a place in the generated grant; the live tree regenerates byte for byte"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#levels: a leveled role emits one adapter per level and no base adapter, each pinned, described, pointed and granted"
        status: pass
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#levels: the declaration order of `levels` tokens cannot change any emitted byte (TIER-02 ordering)"
        status: pass
      - kind: other
        ref: "npm run build && npm run generate:adapters && git diff --quiet HEAD -- .claude/agents"
        status: pass
    human_judgment: false
  - id: D2
    description: "A coordinator role that declares `levels` is refused by the generator naming orchestrator.md, writing nothing"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#levels: a coordinator role that declares `levels` is refused naming the file, and nothing is written"
        status: pass
    human_judgment: false
  - id: D3
    description: "KIT-03 compares listAgentAdapterNames with the adapter directory and the grant closure; a deleted level adapter, a re-planted base adapter and a hand-added grant name are each red by name, and the unplanted levels mirror is green"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level CONTROL: an unplanted levels mirror is green on KIT-03 and both value guards"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (KIT-03): a deleted level adapter is named as a derived name with no adapter file"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (KIT-03): a re-planted base engineer adapter is named as an adapter with no derived name"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (KIT-03): a hand-added grant name with no adapter is named"
        status: pass
    human_judgment: false
  - id: D4
    description: "guard_model_assignment and guard_effort_assignment key every adapter by its adapter stem, accept a per-level override key, and degrade a refused configuration to zeroConfigAssignments"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (guard_model_assignment): junior's `model: haiku` changed to `model: sonnet` is named"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level RED (guard_effort_assignment): junior's `effort: medium` line removed is named"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level config (D-15): a `models.roles` key `software-engineer-junior` is accepted by the generator and the guard"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level degrade (D-3): a refused configuration degrades a level adapter to its LEVELS pin, never to inherit"
        status: pass
    human_judgment: false
  - id: D5
    description: "The adapter freshness gate requires each adapter's own zero-config value: a levels mirror is fresh, a committed or announced junior at inherit is red by name"
    requirement: TIER-02
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#levels: a regenerated levels mirror passes the gate, three level adapters in, the base adapter out"
        status: pass
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#levels RED: a regeneration that ANNOUNCES junior at `inherit` is refused against junior's own zero-config value"
        status: pass
      - kind: other
        ref: "npm run freshness:adapters"
        status: pass
    human_judgment: false
  - id: D6
    description: "Only scripts/kit-model.ts declares the agent namespace constant among non-test modules"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#level namespace: only scripts/kit-model.ts declares the agent namespace constant among non-test modules"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 02: Adapter Consumers Switched to the Level Derivation Summary

**The generator, KIT-03, both value guards and the adapter freshness gate now read `listAgentAdapterSpecs` and `resolveAdapterAssignments` / `zeroConfigAssignments`. A mirror whose `software-engineer.md` declares `levels: junior mid senior` regenerates `grugops-software-engineer-junior/mid/senior` at haiku/medium, sonnet/medium and opus/high, with no base adapter, all three in the coordinator grant. Every gate accepts that mirror and turns red on each wrong shape, naming the file. The live tree regenerates byte for byte.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-10-29T16:59:24Z
- **Completed:** 2026-10-29T17:31:40Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `scripts/generate-role-adapters.ts` emits one adapter per spec. It groups the specs by role file and reads each file once. Model and effort are looked up by `adapterStem`, and a miss is refused naming the stem. A level adapter gets ` Level: <level>.` on its description and the body line ``Work at the `<level>` level: read the `## Levels` section of that role file for its scope.``. A coordinator that declares levels is refused naming the file. The adapter list is sorted by name, so the order of the `levels` tokens cannot move a byte. The private `AGENT_PREFIX` is gone.
- In `scripts/check-foundation-guards.ts`:
  - KIT-03 Set 1 is `listAgentAdapterNames(ROOT)`, and the pass line reads `17 derived adapter names == 17 adapters == 17 grant-closure names`.
  - `roleStemOf` is renamed `adapterStemOf` and uses the imported `AGENT_ADAPTER_PREFIX`.
  - Both value guards take `AGENT_ADAPTER_SPECS`, which is derived at module scope beside `ROLE_FILES` and fails closed the same way. Both resolve through one helper, `recomputeAssignmentExpectation`. A refused read or a refused resolution degrades to `zeroConfigAssignments(specs)`, and the finding now says "DEGRADES to the zero-config answer (D-3)".
  - `tieredCorpusRefusals` is handed `presetGovernedStems(specs)`.
  - The stale Floor 3 comment (`MODEL_TIERS_COUNT = ROLE_COUNT`) and its finding now state `ROLE_COUNT - LEVELED_ROLE_COUNT`.
- `scripts/adapters-freshness.ts` builds a zero-config record per adapter name from `zeroConfigAssignments(listAgentAdapterSpecs(KIT_ROOT))`. `checkAnnouncedMap` compares each adapter with its own expected value. The distinct-set checks use the set derived from that record. A new check requires the derived spec names to equal the regenerated adapters.
- Only `scripts/kit-model.ts` declares `"grugops-"` among non-test modules, and a source scan pins this.

## Task Commits

1. **Task 1 (tracer): the end-to-end levels path through all three consumers.** `afe7c4df` (feat). The tracer gate re-ran the full Task 1 verify before expansion, and it passed: build, typecheck, `generate:adapters` with no `.claude/agents` diff, 93/93 tests, the foundation guards, the adapter freshness gate and build freshness.
2. **Task 2 (TDD): RED plants for every wrong level shape, the coordinator refusal, the derived grants and the one-namespace invariant.** `063c25f1` (test). No implementation change was needed: GREEN is the Task 1 `feat` commit.

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD record (Task 2)

- **RED:** I put the pre-39-02 compiled builds (`git show 4caf99c5:scripts/<file>.js`) in place of the generator, the guard and the freshness gate, ran the new cases, and restored each file with `git checkout -- <file>`.
  - Wide run: `-t level` over the three test files exited 1. All 14 new behavior cases that discriminate against the old builds failed. These include the levels CONTROL, both KIT-03 plants that need the derivation, both value-guard plants, the config case, the degrade case, the coordinator refusal and all three freshness level cases.
  - Classifier record: `npx vitest run scripts/generate-role-adapters.test.ts -t "levels: a" --reporter=tap-flat`, with the old generator, exited 1. Target: `levels: a leveled role emits one adapter per level and no base adapter, each pinned, described, pointed and granted`. It failed with `expected [ 'grugops-agents-md-scribe.md', …(5) ] to include 'grugops-software-engineer-junior.md'`. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` / `target_test_failed`. The wide run's TAP output carried multi-line YAML that the classifier rejects as `invalid_record`, which is why the narrow run is the recorded one.
  - **Semantic assessment:** the target ran and failed on its planned assertion, because the old generator writes no level adapter. It was not a load, syntax or fixture fault. Two new cases pass against the old builds as well: the hand-added grant plant (a ghost grant name is red under either KIT-03) and the namespace scan (Task 1 already deleted the copies, and the scan reads `.ts`). Both are regression pins rather than discriminators.
- **GREEN:** against the committed build, 425/425 pass in the three files.
- **REFACTOR:** none.

## Files Created/Modified

- `scripts/generate-role-adapters.ts` / `.js`: the spec-driven emit loop, `Adapter.level`, the level description and body line, and the leveled-coordinator refusal.
- `scripts/check-foundation-guards.ts` / `.js`: KIT-03 over derived names, `adapterStemOf`, `AGENT_ADAPTER_SPECS`, `recomputeAssignmentExpectation` and the zero-config degrade.
- `scripts/adapters-freshness.ts` / `.js`: the per-adapter zero-config record and the derived-vs-regenerated check.
- `scripts/generate-role-adapters.test.ts`:
  - the levels emission, ordering and coordinator cases;
  - the resolver stubs, which now override `resolveAdapterAssignments`;
  - the refusal needles, which follow the derivation's wording;
  - the grant rebuilds, which come from `listAgentAdapterNames` and `listAgentAdapterSpecs`.
- `scripts/check-foundation-guards.test.ts`: the levels-at-the-gate block, `roleAgentNames` derived from `listAgentAdapterNames`, and wording pins moved to adapter stems and the derived-name label.
- `scripts/adapters-freshness.test.ts`: the levels mirror passing, plus the committed and announced junior-at-inherit reds.
- `install/install.test.ts`: `agentPrefixLiteral` returns the imported `AGENT_ADAPTER_PREFIX`.

## Decisions Made

- Guard findings name the adapter stem. The role-stem sentence would be false for `software-engineer-junior`, so I updated the pins and kept the guard's wording accurate.
- The freshness record is keyed by `spec.name`, so the gate never builds a name from a stem. The plan said "prefixing the stem"; reading the name the spec already carries gives the same result and follows the prohibition.
- The gate-level levels mirror is judged by a scratch build in plan 39-07's shape. I measured that without it the committed TIERED row for `software-engineer` is named as a stem outside the preset-governed set, and that red is correct for a half-done change.
- I did not import `AGENT_ADAPTER_PREFIX` into the generator. The generator never needs the prefix, because every name arrives built, and `noUnusedLocals` would refuse an unused import.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `install/install.test.ts` read the generator's deleted `AGENT_PREFIX` out of its source text**
- **Found during:** Task 1.
- **Issue:** 11 install cases threw `could not find the AGENT_PREFIX literal`.
- **Fix:** I imported `AGENT_ADAPTER_PREFIX` from `scripts/kit-model.js`, and `agentPrefixLiteral()` now returns it.
- **Files modified:** install/install.test.ts.
- **Verification:** install/install.test.ts passes 455/455 (1 skipped).
- **Committed in:** `afe7c4df`.

**2. [Rule 3 - Blocking] Existing tests pinned behavior that Task 1 changed by design**
- **Found during:** Task 1.
- **Issue:** Four groups of cases broke:
  - generate-role-adapters.test.ts stubbed `resolveModels`, which the real per-adapter resolver bypasses through its module-local binding.
  - Four refusal cases expected the generator's own sentence, but `listAgentAdapterSpecs` now refuses first, naming the same file.
  - 24 check-foundation-guards cases pinned "role stem", "N roles ==" and "DEGRADES to `inherit`".
  - A structure case and a scratch-mutation anchor named the old `resolveEfforts(` and `tieredCorpusRefusals(stems)` call sites.
- **Fix:** The stubs now override `resolveAdapterAssignments`. The needles follow the derivation's wording and still name the file. The wording pins and the two anchors follow the new guard text. Plan Task 2 allows a change of wording to adapter stems. These edits landed in the Task 1 commit so that commit is green.
- **Files modified:** scripts/generate-role-adapters.test.ts, scripts/check-foundation-guards.test.ts.
- **Verification:** 425/425 in the three plan test files.
- **Committed in:** `afe7c4df`.

**3. [Rule 2 - Missing critical] The freshness gate's distinct-alias pins assumed one zero-config alias**
- **Found during:** Task 1.
- **Issue:** `ZERO_CONFIG_ALIASES.length !== 1` and the distinct-level check would have refused every levels tree, because level adapters are pinned.
- **Fix:** Both sets are derived from the per-adapter record, and an empty set is refused. I also added the derived-vs-regenerated name check, so an adapter without an expectation cannot be compared against `undefined`.
- **Files modified:** scripts/adapters-freshness.ts / .js.
- **Committed in:** `afe7c4df`.

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical).
**Impact on plan:** All three follow from the planned switch to the derivation. None widens production behavior beyond the plan.

## Issues Encountered

- I did not run the full non-e2e suite, which exceeds the time budget. I ran every test file that imports or spawns the changed modules: the three plan files, kit-model, model-tiers, install, agents-record, message-references, board-readonly, canonical-frontmatter, check-audit-register, check-diff-disposition, check-residual-citations, check-state-paths, check-uat-oracles, freshness, frontmatter, generate-catalog, model-dial-consistency, skill-twins-freshness, voice-model, adapter-byte-baseline and floor-invariance. All pass. The reds already listed in deferred-items.md (context-io, uat-gate-exit-contract and the rest) were not re-run and are unchanged by this plan.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 39-07 can add `levels: junior mid senior` to software-engineer.md, set `LEVELED_ROLE_COUNT = 1` and drop the TIERED software-engineer row. The gate-level levels CONTROL already proves that this exact shape passes KIT-03 and both value guards.
- Plan 39-03 re-pins the MODEL-01 baseline. The adapter bytes are unchanged here.

## Self-Check: PASSED

- All 10 modified files exist on disk.
- Commits `afe7c4df` and `063c25f1` are ancestors of HEAD.
- Plan verification:
  - build, typecheck, `generate:adapters` with no `.claude/agents` diff: pass;
  - 766/766 across the five listed test files;
  - foundation guards (ALL CHECKS PASSED), `VALIDATE_KIT_ROOT=. validate-agent-factory`, `freshness:adapters`, `freshness:hook-manifest`, `freshness`: all pass.
- Acceptance greps: `${AGENT_PREFIX}${stem}` 0, `roleNames = ROLE_FILES.map` 0, `inheritForEveryStem(["any-stem"])` 0, `resolveAdapterAssignments(` 1, `= "grugops-";` only in scripts/kit-model.ts, `grugops-${f.replace` 0. `-t level` in the guard test file: 15 passed.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*
