---
phase: 34-model-effort-dial-pi-support
plan: 01
subsystem: tooling/model-dial
tags: [typescript, model-tiers, adapter-generator, effort, claude-code-frontmatter, vitest]

requires:
  - phase: 29.1-per-role-model-assignment
    provides: "the models dial: closed tuples, readModelsConfig, resolveModels, TIERED, the generator's resolved model: emit"
provides:
  - "EFFORT_LEVELS / EFFORT_PRESET_NAMES / EFFORT_KEYS closed tuples with exact-equality guards"
  - "MODELS_KEYS = preset, roles, effort (D-02 config contract)"
  - "ModelsConfig.effort read by the one reader (readEffortBlock, module-private), no roles-absent early return"
  - "resolveEfforts (floors mirror resolveModels; tiered split computed from TIERED alias column) and inheritEffortForEveryStem"
  - "generator emits `effort: <level>` directly after `model:` only for a non-inherit level; zero config byte-identical"
  - "D-18 DC-3 residual stated in the readModelsConfig header"
affects: [34-03, 34-05, 34-07, 34-10]

actuals:
  tokens: 22053
  tasks: 2
  commits: 3
plan_head_before: 45766c2d591129548832641156e9ecdb14aef240
plan_head_after: 45873f53fda5ec9b95358617bf148aad39a2da5c

tech-stack:
  added: []
  patterns:
    - "closed tuple + derived union + exact-equality guard, now applied to the effort vocabularies"
    - "single success return in readModelsBlock; every MODELS_KEYS member read before it"
    - "consumption probe per closed key tuple, asserted in both directions before the loop"

key-files:
  created: []
  modified:
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - scripts/model-tiers.test.ts
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts

key-decisions:
  - "Effort refusals for unknown `models.effort.roles` stems name every unknown stem in one refusal (sorted), rather than the first only; values are still refused one at a time like the model roles"
  - "resolveEfforts runs tieredTableRefusals() before computing the tiered split, the same Floor 3a resolveModels runs, because the split is read off TIERED"
  - "Task 2's behaviour cases passed on first run against the Task 1 build; the RED evidence for the consumption probes is the recorded mutation run, not a pre-implementation failure"

patterns-established:
  - "Effort is resolved above the build loop beside the model alias; a refusal reaches fail() before any byte is written"
  - "An `inherit` effort is written as no line at all"

requirements-completed: [EFFORT-02, EFFORT-03, EFFORT-04]

coverage:
  - id: D1
    description: "models.effort sub-block read by the one reader with closed keys, every refusal rule of D-03, and two-location precedence (D-07)"
    requirement: EFFORT-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#models.effort — the closed sub-block (plan 34-01, D-03)"
        status: pass
      - kind: integration
        ref: "scripts/generate-role-adapters.test.ts#generate-role-adapters.js — an illegal `models.effort` is refused above the build loop (plan 34-01, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Closed effort vocabularies and resolveEfforts with the tiered split derived from TIERED (opus -> high, else medium); no capability check (D-08)"
    requirement: EFFORT-03
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#models.effort — resolveEfforts floors (plan 34-01, D-04)"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#D-08: a `haiku` model with a `max` effort resolves as configured — no model-to-effort capability check exists"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generator emits one `effort:` line after `model:` for a configured role or the tiered preset, none at zero config; committed adapters unchanged"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/generate-role-adapters.test.ts#generate-role-adapters.js — the resolved `effort:` emit (plan 34-01)"
        status: pass
      - kind: other
        ref: "scripts/adapter-byte-baseline.test.ts; npm run freshness:adapters; npm run generate:adapters + git status --porcelain -- .claude/agents/ (empty)"
        status: pass
    human_judgment: false
  - id: D4
    description: "MODELS_KEYS and EFFORT_KEYS consumption probes proven non-vacuous by mutation"
    requirement: EFFORT-02
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#every member of MODELS_KEYS is CONSUMED by the reader, not merely permitted"
        status: pass
      - kind: unit
        ref: "scripts/model-tiers.test.ts#every member of EFFORT_KEYS is CONSUMED by the reader, not merely permitted"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 01: Effort dial reader, resolver and emit Summary

**`models.effort` (closed keys `preset`, `roles`) is read by the one reader in scripts/model-tiers.ts, resolved by a new `resolveEfforts` whose `tiered` split is computed from TIERED's alias column, and emitted by the adapter generator as one `effort:` line after `model:` for non-inherit levels only, so zero config stays byte-identical.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-10-06T11:08:33Z
- **Completed:** 2026-10-06T11:31:30Z
- **Tasks:** 2
- **Files modified:** 6 (3 `.ts` sources, 2 `.js` twins, plus the 2 test files; see list below)

## Accomplishments

- Three new closed tuples beside the existing ones: `EFFORT_LEVELS` (`inherit`, `low`, `medium`, `high`, `xhigh`, `max`), `EFFORT_PRESET_NAMES` (`none`, `tiered`, declared separately from `PRESET_NAMES`), and `EFFORT_KEYS` (`preset`, `roles`). Each has a derived union type and, for levels and presets, an exact-equality guard. `MODELS_KEYS` is now `preset`, `roles`, `effort`.
- `readModelsBlock` has a single success return. The early return when `roles` is absent is gone (Pitfall 1). The module-private `readEffortBlock` validates the sub-block in the D-03 order: absent, then degenerate shape, then unknown keys (all named, sorted, before any value is read), then preset, then roles (keys checked against the stems before any value, values by exact equality).
- `resolveEfforts` mirrors `resolveModels`. The preset is validated before it is defaulted, overrides must be a Map, empty and duplicate stem lists are refused, and under `tiered` the TIERED table integrity and per-stem coverage are checked. Overrides must be legal levels on covered stems, and an override wins over the preset. `inheritEffortForEveryStem` is the one zero-config effort map.
- The generator resolves effort above the build loop and sends a refusal to `fail()`. `Adapter.effort` is filled by stem lookup. `render()` pushes `effort: <level>` directly after `model:` only when the level is not `inherit`.
- The D-18 residual paragraph is in the `readModelsConfig` header. The read itself is unchanged.

## Task Commits

1. **Task 1: end-to-end tracer, a configured effort reaches one adapter's frontmatter** - `7030a26f` (feat)
2. **Task 2: the whole refusal class, both consumption probes, the D-18 residual** - `df16f664` (test) + `45873f53` (docs)

**Plan metadata:** recorded in the final docs commit.

Tracer feedback gate: interactive run, `human_verify_mode` end-of-phase, automated-only `<verify>`. The `<verify>` was re-run after the Task 1 commit and passed (3 files, 173 passed, 1 skipped; `freshness:adapters` fresh), so execution continued to Task 2.

## Files Created/Modified

- `scripts/model-tiers.ts` / `.js`: effort tuples and guards, `MODELS_KEYS` widened, `ModelsConfig.effort` / `EffortConfig`, `zeroConfigEffort`, `readEffortBlock`, `readModelsBlock` single return, `resolveEfforts`, `ResolveEffortsOptions`, `EffortResolution`, `inheritEffortForEveryStem`, D-18 header paragraph.
- `scripts/generate-role-adapters.ts` / `.js`: imports `resolveEfforts` and `EffortLevel`, resolves effort above the loop, adds `Adapter.effort`, emits `effort:` conditionally.
- `scripts/model-tiers.test.ts`: MODELS_KEYS closed set and consumption probe updated for `effort`. New describes "models.effort — the closed sub-block (plan 34-01, D-03)" and "models.effort — resolveEfforts floors (plan 34-01, D-04)".
- `scripts/generate-role-adapters.test.ts`: new describes "the resolved `effort:` emit (plan 34-01)" (cases a/b/c) and "an illegal `models.effort` is refused above the build loop (plan 34-01, D-03)".

## Behaviour bullet to test map (Task 2 acceptance)

All cases are in scripts/model-tiers.test.ts unless marked (gen), which means scripts/generate-role-adapters.test.ts.

| Behaviour | `it` case(s) |
|---|---|
| Unknown key before sibling, `bogus` not named | "an UNKNOWN key is refused BEFORE a legal sibling is read — the reason names `models.effort.presets` and not `bogus`" |
| Two unknown keys together, sorted | "TWO unknown keys are named together in ONE refusal, sorted, and the sentence agrees in number" |
| Case-varied `Preset`, `ROLES` | "a CASE-VARIED key `Preset` …", "a CASE-VARIED key `ROLES` …" |
| Degenerate block null / [] / "tiered" / 1 | "a DEGENERATE `models.effort` that is null / an array / a string / a number is refused naming its shape …" |
| Preset `Tiered`, `cost`, 1, null | "an effort preset of "Tiered" / "cost" / 1 / null is refused quoting the legal set …" |
| Degenerate roles null / array / string | "a DEGENERATE `models.effort.roles` that is null / an array / a string …" |
| Unknown stem key | "an UNKNOWN stem key in `models.effort.roles` is refused naming the stem and the whole valid stem set" (+ "an unknown stem key is refused BEFORE an illegal level beside it is read") |
| Levels `MAX`, `ultra`, "", 1, null | "a level of "MAX" / "ultra" / "" / 1 / null is refused quoting all six legal levels" |
| Refusal is `ok:false` with no value | "EVERY refusal above is a verdict with `ok: false` and NO `value` …" (21 inputs, count asserted) |
| D-07 two-location precedence | "D-07: with a legal effort at BOTH locations only the first file's effort is read, and an illegal effort in the second is never reached" (with the single-location control) |
| EFFORT_KEYS consumption, both directions | "every member of EFFORT_KEYS is CONSUMED by the reader, not merely permitted" |
| resolveEfforts floors | "an EMPTY stem list is refused", "a DUPLICATE stem is refused by name", "a plain-object overrides argument …", "a NULL preset …", "an override for a stem OUTSIDE the resolved list …", "an override carrying an illegal level …", "`tiered` over a stem list containing a stem with NO TIERED row …" |
| D-04 split from TIERED | "`tiered` resolves `high` for exactly the TIERED `opus` rows and `medium` for every other stem, derived from TIERED" |
| D-08 haiku + max | "D-08: a `haiku` model with a `max` effort resolves as configured …" |
| Generator refusal writes nothing | (gen) "refuses an ILLEGAL effort LEVEL …", "refuses an UNKNOWN effort KEY …", "refuses a DEGENERATE effort block …", "refuses an ILLEGAL effort PRESET …" (all through `expectConfigRefusal`, so every adapter is checked byte-unchanged) |

## Mutation run (consumption probes are not vacuous)

The mutation was a temporary edit to scripts/model-tiers.ts, then a rebuild. It inserted `if (rawRoles === undefined) return { ok: true, value: { preset, overrides, effort: zeroConfigEffort(), source: path } };` before the roles block, which puts the effort read back behind the roles-absent return. Result: 32 cases red, including both probes.

- `every member of MODELS_KEYS is CONSUMED …`: `AssertionError: setting \`models.effort\` alone changed nothing the reader returns … expected '["none",[],"none",[]]' not to be '["none",[],"none",[]]'`
- `every member of EFFORT_KEYS is CONSUMED …`: `AssertionError: setting \`models.effort.preset\` alone changed nothing the reader returns … expected '["none",[]]' not to be '["none",[]]'`
- The generator emit cases (b) and (c) and all four generator refusal cases also went red.

Revert: `git checkout -- scripts/model-tiers.ts scripts/model-tiers.js`, then `grep -c MUTATION` returned 0 for both files, then `npm run build`. Both probes then passed (2 passed). The mutation was never committed.

## Sibling search (33.1 brief § 2.3, DC-3)

File I/O call sites in the two touched modules, measured with grep after the change:

| Site | Call | Added or touched by this plan? | DC-3 handling |
|---|---|---|---|
| scripts/model-tiers.ts `readModelsConfig` | `existsSync(path)` + `readFileSync(path, "utf8")` on `.grugops/factory.config.json` / `agent-factory/config/factory.config.json` | Touched only to the extent that the reader now also returns `effort`; the read is unchanged | None. This is the D-18 residual, disclosed in the header and filed as backlog by plan 34-10 |
| scripts/generate-role-adapters.ts role read (`readFileSync(path, "utf8")` over `listRoles(ROOT)`) | reads kit role files under the generator's own `agent-factory/roles` | Not touched | Pre-existing; the path is a fixed kit path, not a user config location. Out of scope here |
| scripts/generate-role-adapters.ts `mkdirSync` / `writeFileSync` | writes `.claude/agents` | Not touched | Write, not read |

`git diff 45766c2d..HEAD` adds no `readFileSync`, `existsSync`, `readdirSync`, `statSync` or `openSync` call. The plan adds no new DC-3 site.

## Decisions Made

- Unknown `models.effort.roles` stems are named all together, sorted, in one refusal. The existing `models.roles` check names only the first. Illegal values are still refused one at a time, as `models.roles` does.
- `resolveEfforts` runs `tieredTableRefusals()` (Floor 3a) before computing the split. This is the same table-integrity floor `resolveModels` uses, because the split comes from TIERED.
- Stems inside effort refusals are quoted through `quoteValue`. Nothing is rendered through `JSON.stringify` directly, and no second `try { rendered = JSON.stringify(` site was added.

## Deviations from Plan

None. The plan was executed as written.

## TDD Gate Compliance

Task 2 carries `tdd="true"`, but `workflow.tdd_mode` is false and the plan itself orders the cases to be "run against the Task 1 build". Task 1 already holds the implementation, so a pre-implementation RED was not possible. The behaviour cases passed on their first run, which the plan expects: a case that failed there would have shown a defect in `readEffortBlock` or `resolveEfforts`. The RED evidence that the tests discriminate is the mutation run above. The commit sequence is `feat` (7030a26f), then `test` (df16f664), then `docs` (45873f53). No `gsd_run check tdd-red-evidence` record was produced, because no genuine pre-implementation RED existed to record.

## Issues Encountered

- `npm run check:build-parity` reported both `.js` twins as "moved" until the Task 1 commit. It compares the build against the committed tree, so this is expected before a commit. It passed after each commit.

## Verification (plan-level)

- `npm run build`: exit 0. `npm run check:build-parity`: ALL CHECKS PASSED. `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'` (full suite): 98 files passed; 7188 passed, 2 skipped.
- `npm run freshness:adapters`: 17 adapters, 0 byte differences, mirrored model preset `none`.
- `node scripts/check-foundation-guards.js`: exit 0, ALL CHECKS PASSED.
- Task 1 acceptance: each of the five export greps returns exactly 1. The `MODELS_KEYS` node probe exits 0. `npm run generate:adapters` followed by `git status --porcelain -- .claude/agents/` prints nothing. `readEffortBlock(` is called at line ~2020, inside `readModelsBlock`, before its single success return.
- Task 2 acceptance: `grep -n "D-18" scripts/model-tiers.ts` shows the residual paragraph in the `readModelsConfig` header.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 34-03 (effort announcement, freshness gate, `effortRationale`) can build on `resolveEfforts` and `inheritEffortForEveryStem`.
- 34-05 (`effort` in `CANONICAL_SCHEMA`, `guard_effort_assignment`) is required before any adapter carrying `effort:` is committed, or read by `admit()` in this checkout. Until then, configuring effort in this repository's own config and regenerating would make the `admit()`-based guards refuse the adapters (RESEARCH Pitfall 2). The zero-config tree is unaffected.
- 34-10 files the D-18 backlog item.

## Self-Check: PASSED

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-06*
