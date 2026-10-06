---
phase: 34-model-effort-dial-pi-support
plan: 05
subsystem: tooling/foundation-guards
tags: [typescript, canonical-frontmatter, check-foundation-guards, effort, dc-1, vitest, safety-authority]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-01: readModelsConfig with models.effort, resolveEfforts, inheritEffortForEveryStem, EFFORT_LEVELS, generator effort: emit; 34-03: effort announcement grammar and freshness fail-closed on configured effort"
provides:
  - "`effort` in CANONICAL_SCHEMA (D-15), schema header recording the decision and the widened measuring corpus"
  - "guardEffortAssignment, banner `[guard_effort_assignment]`, registered right after guardModelAssignment"
  - "module-scope relativeToRoot and roleStemOf, shared by both value guards"
  - "DC-1 effort fault matrix (8 faults x 17 adapters, 64 ordered pairs, zero-config extra line on every adapter, both degraded branches, vacuity, element count, stray non-agent effort, structural pin)"
  - "canonical key-union case measured over the live scan plus a configured generator run"
affects: [34-07, 34-10]

actuals:
  tokens: 13321
  tasks: 2
  commits: 2
plan_head_before: bd40069c3e2b3d798decc0472a4a3596391be508
plan_head_after: 38930f3996a502fbe8e21c3b00fc3135461aabff

tech-stack:
  added: []
  patterns:
    - "a value guard over committed adapter bytes reads only through admit()/admittedValuesFor and recomputes its expectation from the one config reader and resolver"
    - "a schema widened by decision stays measured by widening the measuring corpus with real configured generator output, never by exempting the key"

key-files:
  created: []
  modified:
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
    - scripts/canonical-frontmatter.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "guard_effort_assignment degrades to `inherit` for every stem on either degraded branch (as guard_model_assignment does) and still runs the comparison, while both branches are failing findings; no warn() call"
  - "Added a stray-effort arm over non-agent surfaces (Rule 2): D-15 widened admit() for every surface, so a skill or template can now carry an admitted `effort:` line no resolution adjudicates; the arm names it, mirroring the stray-model-pin arm"
  - "relativeToRoot and roleStemOf lifted to module scope so both value guards call one helper each, rather than copying the locals"
  - "Canonical key-union premise counts effort values through admittedValuesFor, not a regular expression"

patterns-established:
  - "DC-1 fault matrix: a declared fault table whose entries are functions of the adapter's own configured value, count asserted, each fault's admit() premise asserted before the verdict, applied singly to every derived adapter and in every ordered pair"

requirements-completed: [EFFORT-04]

coverage:
  - id: D1
    description: "An adapter carrying a legal `effort:` line is admitted by the canonical reader (D-15), and the schema is measured two-sided over the live scan plus a configured generator run"
    requirement: EFFORT-04
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#the key union across the live corpus plus a configured generator run equals CANONICAL_SCHEMA, in both directions"
        status: pass
      - kind: other
        ref: "node --input-type=module -e \"import('./scripts/canonical-frontmatter.js').then((m) => { if (!m.CANONICAL_SCHEMA.includes('effort')) process.exit(1); })\""
        status: pass
    human_judgment: false
  - id: D2
    description: "`node scripts/check-foundation-guards.js` fails, naming the adapter and both values, when a committed adapter's effort differs from the configured level; passes on the zero-config tree"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_effort_assignment (plan 34-05) > TRACER"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (banner, PASS effort assignment line, ALL CHECKS PASSED)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Absent, duplicated, garbled, extra and multi-valued effort lines, a refused or unresolvable configuration, an empty or short adapter set, and a stray non-agent effort key are each named findings; the pass line never prints beside a fault"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_effort_assignment (plan 34-05) (19 cases)"
        status: pass
    human_judgment: false

duration: 29min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 05: The Effort Field's Second Opinion Summary

**`effort` admitted by the canonical reader under D-15 and measured against real configured generator output, plus `guard_effort_assignment`, which reads committed adapter bytes through `admit()` and fails by name on any effort that differs from the configured level.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-06T13:50:42Z
- **Completed:** 2026-10-06T14:19:51Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `CANONICAL_SCHEMA` now has 11 keys. `effort` sits between `disable-model-invocation` and `kind`. The header comment records D-15 as a safety-authority change of the same shape as D-33-R3-02, records the widened measuring corpus, and records that no alphabet change was needed.
- `guardEffortAssignment()` uses the same posture as `guardModelAssignment()`:
  - stems come from `ROLE_FILES` and adapters from `AGENT_ADAPTER_RELS`
  - the expectation is `readModelsConfig` followed by `resolveEfforts`
  - vacuity and element-count floors run first
  - an adapter that `admit()` refuses is named with its code
  - the per-adapter rule is: an `inherit` expectation needs zero values, and a level L needs exactly one value, equal to L
  - the reverse direction is checked too: a resolved stem with no adapter is a finding
  - both degraded branches block
  - the run summary prints on both outcomes, and the pass line prints only when nothing is wrong.
- The canonical key-union test now measures over the live 33 files plus 17 adapters from a committed generator run in a scratch mirror, configured with `{"models":{"effort":{"preset":"tiered","roles":{"orchestrator":"max"}}}}`. Logged union: `allowed-tools, argument-hint, coordinator, description, disable-model-invocation, effort, kind, model, name, tier, tools (11)`.

## Task Commits

1. **Task 1: tracer, schema D-15 + guard_effort_assignment** - `f7360f80` (feat)
2. **Task 2: DC-1 class matrix + configured-corpus key union** - `38930f39` (test)

## Files Created/Modified

- `scripts/canonical-frontmatter.ts` / `.js`: `effort` in `CANONICAL_SCHEMA`, and the D-15 schema header.
- `scripts/check-foundation-guards.ts` / `.js`: `guardEffortAssignment`, its run-list call, and module-scope `relativeToRoot` and `roleStemOf`.
- `scripts/check-foundation-guards.test.ts`: the `guard_effort_assignment (plan 34-05)` describe (19 cases), with these helpers:
  - `effortGeneratorClosure`, which derives the generator's import closure
  - `configureAndRegenerate`
  - `admittedEffortValues`
  - `plantAdapterEffort`
  - `effortSection`
- `scripts/canonical-frontmatter.test.ts`: `configuredGeneratorCorpus()`, which builds the mirror from the generator's import closure plus the role tree, the packaging tree and the config. The key-union case was replaced by the combined-corpus case, which keeps both direction messages.

## The DC-1 fault table and the finding each fault produced

The table is declared once, and `EFFORT_FAULT_COUNT = 8` is asserted. Each fault was applied to all 17 derived adapters of a regenerated mirror configured with effort preset `tiered`. The rows below show the first adapter, `grugops-agents-md-scribe.md`, whose tiered level is `medium`.

| Fault | admit() premise | Finding text produced |
|---|---|---|
| line removed | `[]` | `.claude/agents/grugops-agents-md-scribe.md: carries NO \`effort\` line, and the configuration resolves \`medium\` for role stem "agents-md-scribe" — expected \`medium\`, found no value. ...` |
| line duplicated | refused `duplicate-key` | `.claude/agents/grugops-agents-md-scribe.md: [duplicate-key] line 7: \`effort\` appears more than once in this region; ...` |
| value misspelled | `["mediumm"]` | `... declares \`effort: mediumm\`, and the configuration resolves \`medium\` ... — expected \`medium\`, found \`mediumm\`. ...` |
| value upper-cased | `["MEDIUM"]` | `... declares \`effort: MEDIUM\`, and the configuration resolves \`medium\` ... — expected \`medium\`, found \`MEDIUM\`. ...` |
| value emptied | refused `dangling-empty-key` | `.claude/agents/grugops-agents-md-scribe.md: [dangling-empty-key] line 6: \`effort\` is written with an empty value ...` |
| value quoted | refused `quoted-on-plain-only-key` | `.claude/agents/grugops-agents-md-scribe.md: [quoted-on-plain-only-key] line 6: \`effort\` carries a double-quoted value, ...` |
| literal `inherit` | `["inherit"]` | `... declares \`effort: inherit\`, and the configuration resolves \`medium\` ... — expected \`medium\`, found \`inherit\`. ...` |
| two values (block sequence) | `["medium","medium"]` | `... declares 2 \`effort\` values (\`medium\`, \`medium\`), and the configuration resolves \`medium\` ... — expected exactly one \`medium\`. ...` |

All 8 x 17 single runs exited 1, named their adapter, and printed no `PASS  effort assignment` line. All 64 ordered fault pairs, each placed on two different adapters, produced both findings by name. The other cases, all green:

- **Zero-config extra line on every adapter:** `expected \`inherit\`, found \`<level>\``, with the levels rotated through `EFFORT_LEVELS`.
- **Illegal configured level (`maximum`):** "could not be READ", with the level named.
- **Unresolvable tiered configuration** (an extra role has no TIERED row): "could not be RESOLVED", naming `zz-unlisted-role`.
- **Empty adapter directory:** "returned NO committed adapters".
- **One adapter removed:** `16 committed adapter(s) under .claude/agents against 17 role stem(s)`.
- **Stray `effort` on a skill:** "declare an \`effort\` key".
- **Structural pin:** no `warn(` call, one `process.stdout.write` (the banner), no `new RegExp`, no line split, and no effort-level literal other than `inherit`.

## Mutation proofs

1. **(i) The inherit branch accepts any value count.** In the built `scripts/check-foundation-guards.js`, `if (declared.length !== 0) {` was changed to `if (false && declared.length !== 0) {` (grep confirmed the mutation applied). Red line: `× ZERO-CONFIG EXTRA LINE — ...` with `AssertionError: grugops-agents-md-scribe.md: an extra effort line must fail the run: expected +0 not to be +0`. Revert: restored the file and ran `npm run build`. `git diff --quiet` showed the `.js` identical to the committed build, and the case passed again (`1 passed`).
2. **(ii) `effort` removed from `CANONICAL_SCHEMA`.** In the built `scripts/canonical-frontmatter.js`, the line `"effort",` was deleted. Red line: `× the key union across the live corpus plus a configured generator run ...` with `AssertionError: the canonical-form reader REFUSED adapter(s) a configured generator run emits: .claude/agents/grugops-agents-md-scribe.md: [unknown-key] line 6: \`effort\` is not one of the 10 keys the canonical schema admits ...`. Revert: restored, rebuilt, confirmed identical with `git diff --quiet`, and the case passed again.

## TDD Gate Compliance (Task 2, tdd="true")

- **RED:** this is the live-only key-union case at commit `f7360f80`, after the schema was widened. Running it gives exit 1. Target test: `the key union across the live corpus equals CANONICAL_SCHEMA, in both directions`. Message: `the exported schema carries key(s) no live file uses: effort — the schema has drifted away from the corpus it governs`.
  - Semantic assessment: the target ran and failed on its own assertion, for the planned reason. Under D-06 a live-only corpus cannot measure `effort`.
  - The record is at `.planning/phases/34-model-effort-dial-pi-support/.red/34-05-red.json`.
  - The `tdd-red-evidence` classifier returned `INVALID_RED / invalid_record` with `report_errors: ["Non-TAP data in report", "Malformed TAP"]`. Cause: vitest's `tap` and `tap-flat` reporters print the multi-line `actual:` value without YAML indentation. The report was not edited to make it parse. Machine validation is therefore **UNKNOWN - verify**, and only the semantic assessment above stands.
- **GREEN:** `38930f39` replaced the corpus with live plus configured output, and the case passes.
- The guard's own DC-1 cases were written after the guard (Task 1), so they passed on the first run. Mutation proof (i) shows they can fail.

## Decisions Made

See `key-decisions` in the frontmatter. The plan was followed as specified, apart from the two deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A stray `effort` key on non-agent surfaces is now a named finding**
- **Found during:** Task 1.
- **Issue:** D-15 widened `admit()` for every surface it reads, not only agent adapters. A skill or packaging template could therefore carry an admitted `effort:` line that no resolution adjudicates. Before D-15, guard_wr05 refused such a line as `[unknown-key]`. After D-15 it would have passed silently. This is T-34-16 seen from the reader's side.
- **Fix:** `guardEffortAssignment` partitions the non-agent members out of the one `SPAWN_GRANT_SCAN` composition and names any `effort` they carry. This is the same shape as guard_model_assignment's stray-pin arm. The probed and excluded counts are published.
- **Files modified:** `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`, `scripts/check-foundation-guards.test.ts` (STRAY case).
- **Committed in:** `f7360f80` (arm), `38930f39` (case).

**2. [Rule 3 - Plan text] Mutation (ii) produced a different red line than the plan predicted**
- **Found during:** Task 2.
- **Issue:** The plan expected the red line `carry key(s) the exported schema does not admit: effort`. Once `effort` is out of the schema, though, `admit()` refuses every configured adapter `[unknown-key]`. A refused document contributes no keys to the union, so the `notInSchema` direction cannot be reached through the one reader. The configured-refusal premise fails first instead, and it names `effort`.
- **Fix:** None. The test stays on the one authority, and the actual red line is recorded above. Adding a second key reader to produce the planned wording would break the "one authority" rule.
- **Also:** both mutations were applied to the built `.js` in place and reverted with `npm run build`, rather than through `scratchGuardFiles`. The intent is the same (scratch build, red, revert, green), and `git diff --quiet` confirmed both restorations.

---

**Total deviations:** 2 (1 Rule 2, 1 Rule 3 plan-text).
**Impact on plan:** the Rule 2 arm closes a gap the D-15 widening would otherwise have opened. There is no scope creep.

## Issues Encountered

None. No derived-count pin moved. `NON_TEST_MODULE_COUNT` is unchanged because no new non-test module was added, and the guard header's refusal sentence derives `CANONICAL_SCHEMA.length` (now 11).

## Verification (plan-level)

- `npm run build` exit 0. `npm run check:build-parity` ended with `ALL CHECKS PASSED`. `npm run typecheck` exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: **99 files passed, 7279 tests passed, 2 skipped** (981 s).
- `node scripts/check-foundation-guards.js`: exit 0. The `[guard_effort_assignment]` banner, its PASS line (17 adapters, 17 stems, preset `none`, levels `inherit`, 16 of 16 non-agent surfaces probed) and `ALL CHECKS PASSED` all printed.
- `npm run freshness:adapters`: `Adapters fresh: 17 adapter(s) ... 0 byte difference(s)`, and `Mirrored generator resolved effort preset: none`.
- Windows risk (D-09): the new tests use only `mkdtemp`, `cpSync`, `spawnSync` with `node`, and repository-relative assertions that `relativeToRoot` renders with POSIX separators. Not measured on `windows-latest`: **UNKNOWN - verify** on the next pushed CI run.

## User Setup Required

None.

## Next Phase Readiness

Ready for 34-06. The effort field now has a reader (the canonical schema) and a second opinion (this guard). Plans 34-07 and 34-10 can rely on configured adapters being admissible.

## Self-Check: PASSED

- FOUND: scripts/canonical-frontmatter.ts, scripts/check-foundation-guards.ts, scripts/check-foundation-guards.test.ts, scripts/canonical-frontmatter.test.ts
- FOUND: f7360f80, 38930f39 (ancestors of HEAD)
