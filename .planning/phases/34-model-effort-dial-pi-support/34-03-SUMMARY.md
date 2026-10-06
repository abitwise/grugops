---
phase: 34-model-effort-dial-pi-support
plan: 03
subsystem: tooling/model-dial
tags: [typescript, model-tiers, adapter-generator, adapters-freshness, effort, announcement-grammar, vitest]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-01: EFFORT_LEVELS, isEffortLevel, EFFORT_PRESET_NAMES, resolveEfforts, inheritEffortForEveryStem, ModelsConfig.effort, the generator's effort: emit"
provides:
  - "RESOLVED_EFFORT_PRESET_PREFIX / resolvedEffortPresetLine / resolvedEffortPresetsIn (byte-0 anchored)"
  - "RESOLVED_EFFORT_ASSIGNMENT_PREFIX / resolvedEffortAssignmentLine / resolvedEffortAssignmentsIn, payload {roles, overrides, levels} over the private closed tuple RESOLVED_EFFORT_ASSIGNMENT_KEYS"
  - "MIRRORED_RESOLVED_EFFORT_PRESET_PREFIX / mirroredResolvedEffortPresetLine / mirroredResolvedEffortPresetsIn"
  - "generator prints the two effort announcement lines after the two model lines on every run"
  - "adapters-freshness fails closed on any effort resolution that is not zero-config, each outcome named; verdict carries `Mirrored generator resolved effort preset: none`"
  - "RoleTier.effortRationale (required) on all 17 TIERED rows; tieredTableRefusals names empty, absent or digit-carrying effortRationale"
affects: [34-05, 34-07, 34-10]

actuals:
  tokens: 18048
  tasks: 2
  commits: 3
plan_head_before: e86a52d7e4c31dc7a3e9f4b10a654b79c4b4f223
plan_head_after: 936b10955cbe02a961c9b274d75edf82c6c7a60d

tech-stack:
  added: []
  patterns:
    - "one announcement grammar family: every exported *_PREFIX has one anchored *In reader, and no prefix is a prefix of another (asserted by derivation, with the count)"
    - "a run-time table predicate checks a required field with typeof first, so a hand-built table missing the field gives a finding rather than a TypeError"

key-files:
  created: []
  modified:
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - scripts/model-tiers.test.ts
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - scripts/adapters-freshness.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "Effort role-count cross-check sits after the set-equality half of adapters-freshness, beside the model role-count check, not before the listing: the role count can only be compared against a derived adapter listing, and the model pin already places it there for the stronger set finding"
  - "The effort assignment payload reader names a MISSING key as missing and refuses a REPEATED level; the model payload reader does neither, and was left unchanged (its closed key set and the installer probe must not move)"
  - "model-tiers.test.ts JSON.stringify site pin moved 2 -> 3 for the effort payload emitter, which serialises an announcement, not a refusal; quoteValue stays the one refusal-quoting authority"
  - "The effortRationale cost/speed vocabulary check lives in the test (as the model rationale's digit check does); tieredTableRefusals carries the empty and digit checks"

patterns-established:
  - "Each announcement grammar is a prefix constant, a builder and an anchored reader declared together in model-tiers.ts; consumers never spell a marker"

requirements-completed: [EFFORT-03, EFFORT-04]

coverage:
  - id: D1
    description: "The generator announces its effort resolution (preset line and assignment line) on every run, in the anchored grammar, after the model lines"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/generate-role-adapters.test.ts#the effort resolution is ANNOUNCED (plan 34-03, D-06)"
        status: pass
      - kind: other
        ref: "npm run generate:adapters (one effort preset line `none`, one effort assignment line); git status --porcelain -- .claude/agents/ empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "adapters-freshness refuses a mirrored regeneration whose effort resolution is not zero-config: absent, duplicate, refused, non-none preset, overrides, non-inherit levels, short role count"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/adapters-freshness.test.ts#Case 16..Case 20 (plan 34-03)"
        status: pass
      - kind: other
        ref: "npm run freshness:adapters prints `Mirrored generator resolved effort preset: none`"
        status: pass
    human_judgment: false
  - id: D3
    description: "No announcement prefix is a prefix of another, and no reader reads a sibling grammar's line (6 prefixes, 6 readers)"
    verification:
      - kind: unit
        ref: "scripts/adapters-freshness.test.ts#Case 21 (grammar family)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every TIERED row carries a required, non-empty, digit-free, cost-vocabulary-free effortRationale; the tiered effort split is proven derived from TIERED; the model preset tiered changes no effort"
    requirement: EFFORT-03
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#effort `tiered` and its rationale (plan 34-03, D-04, D-05)"
        status: pass
      - kind: integration
        ref: "scripts/generate-role-adapters.test.ts#the MODEL preset `tiered` leaves effort alone (plan 34-03, D-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The wording of the seventeen effort rationales argues quality and is disputable by a later reader"
    verification: []
    human_judgment: true
    rationale: "Tests check for an empty field, digits and cost/speed vocabulary; whether each argument is sound is a reader's judgment"

duration: 26min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 03: Effort announcement, freshness pin and effort rationale Summary

**The adapter generator now announces its effort resolution in two byte-0-anchored lines, and the freshness gate refuses any mirrored run whose effort resolution is not zero-config. Every TIERED row also carries a required, quality-only `effortRationale`, and tests prove the tiered effort split is derived from TIERED and that the model preset `tiered` leaves effort alone.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-06T12:29:21Z
- **Completed:** 2026-10-06T12:55:07Z
- **Tasks:** 2 (Task 1 tracer, Task 2 TDD)
- **Files modified:** 10 (4 `.ts` sources and their 3 rebuilt `.js` twins in the plan, plus 4 test files; `model-tiers.ts` counts once)

## Accomplishments

- `scripts/model-tiers.ts` has three effort grammars beside the three model ones, all built on the existing `anchoredValuesIn`. They are the effort preset line, the effort assignment line (`{"roles","overrides","levels"}`, closed by the private `RESOLVED_EFFORT_ASSIGNMENT_KEYS`) and the gate's mirrored effort verdict line. The assignment reader refuses each of these by name, quoting through `quoteValue`: unparseable JSON, a non-object, an unknown key, a missing key, a non-integer or negative count, a non-array `levels`, a non-string level, a level outside `EFFORT_LEVELS` and a repeated level. The model payload and its key set are unchanged, and `git diff` over `install/` is empty.
- The generator prints `resolvedEffortPresetLine(modelsConfig.effort.preset)` and `resolvedEffortAssignmentLine(efforts, modelsConfig.effort.overrides.size)` after the two model lines. The comment block above them now covers the effort lines.
- `scripts/adapters-freshness.ts` has an effort pin after the model assignment pin. Each of these fails with its own sentence: no effort preset line, more than one, a value other than `none`, no assignment line, more than one, a refused payload, overrides other than 0, or a level set other than the one derived from `inheritEffortForEveryStem`. A role count different from the derived adapter count also fails, checked beside the model role-count check. The success verdict adds `Mirrored generator resolved effort preset: none`.
- `RoleTier.effortRationale` is a required field. The four `opus` rows argue deeper reasoning: decomposition and routing, architecture trade-offs, security and non-functional analysis, and compliance judgment. The thirteen other rows argue moderate depth for bounded work that gates and tests check. No rationale contains a digit or a cost, price, token, saving, limit or speed word. A comment above TIERED cites the model-config fact that the session default effort already differs between models, and claims no effect from it.
- `tieredTableRefusals` names an empty, whitespace-only, absent (`typeof` check) or digit-carrying `effortRationale` in its own finding, separate from the model rationale finding.

## Task Commits

1. **Task 1: effort announcement and freshness pin (tracer)**: `41b3a078` (feat)
2. **Task 2: effortRationale (D-04) and D-05 independence (TDD)**: `a94713c7` (test, RED), then `936b1095` (feat, GREEN)

Tracer feedback gate: `human_verify_mode` is end-of-phase and the `<verify>` is automated only. After the Task 1 commit the `<verify>` was re-run and passed (2 files, 80 passed, 1 skipped; `freshness:adapters` printed the effort verdict line), so Task 2 started.

## Acceptance criteria (measured)

| Criterion | Result |
|---|---|
| `npm run generate:adapters` prints exactly one `generate-role-adapters: resolved effort preset: ` line (`none`) and exactly one `... resolved effort assignment: ` line | PASS: 1 and 1 (`{"roles":17,"overrides":0,"levels":["inherit"]}`) |
| `npm run freshness:adapters` exits 0 and prints `Mirrored generator resolved effort preset: none` | PASS |
| Each new adapters-freshness case exists and passes; the planted-config cases exit non-zero with the effort finding text | PASS: Cases 16-21 |
| The prefix-collision case reports how many prefixes it compared | PASS: the assertion message names all 6 prefixes and the 6 readers |
| `git status --porcelain -- .claude/agents/` is empty after `npm run generate:adapters` | PASS |
| `grep -c "effortRationale:" scripts/model-tiers.ts` equals TIERED rows + interface declaration | PASS: 18 = 17 rows + 1 interface line. Row count from `TIERED.length` via `node -e 'import("./scripts/model-tiers.js")…'` = 17 = `MODEL_TIERS_COUNT`. The run-time check's local is named `effortReason` so the grep counts only the declaration and the rows |
| Full suite (e2e excluded), build parity, typecheck, freshness:adapters, foundation guards | PASS (see Verification) |

## Behaviour bullet to test map (Task 2)

All cases are in the scripts/model-tiers.test.ts describe "effort `tiered` and its rationale (plan 34-03, D-04, D-05)" unless marked (gen), which means scripts/generate-role-adapters.test.ts.

| Behaviour | Case |
|---|---|
| A TIERED row without `effortRationale` does not compile | Type-level: `readonly effortRationale: string` on `RoleTier`. `npm run typecheck` passes with all 17 rows. The two hand-built fixture rows needed the field to keep compiling |
| tieredTableRefusals names an empty/whitespace effortRationale | "tieredTableRefusals NAMES a row whose effortRationale is EMPTY or WHITESPACE, as its own finding" (`""`, `"   "`, `"\t\n"`), plus "…refuses a row with NO effortRationale at all … rather than throwing" |
| tieredTableRefusals names a digit in effortRationale | "tieredTableRefusals NAMES a row whose effortRationale contains a DIGIT" |
| No digit / no cost vocabulary (the file has no cost-vocabulary check, so this is a test case) | "no effortRationale contains a DECIMAL DIGIT (MODEL-07)", "no effortRationale carries a cost, price, token, saving, limit or speed word (MODEL-07)" (the pattern is shown to catch each word family) |
| `high` iff `opus`, counted from TIERED, row count = MODEL_TIERS_COUNT | "D-04: effort `tiered` gives `high` to exactly the `opus` rows and `medium` to every other row, counted from TIERED" |
| D-05 reader + resolver | "D-05: the MODEL preset `tiered` resolves effort preset `none` with no overrides, and `inherit` for every stem" |
| D-05 generator mirror: tiered `model:` lines, zero `effort:` lines | (gen) "a mirror under `{"models":{"preset":"tiered"}}` emits the tiered `model:` lines and ZERO `effort:` lines" |
| EFFORT_PRESET_NAMES and PRESET_NAMES are separate objects | "EFFORT_PRESET_NAMES and PRESET_NAMES are two SEPARATE array objects" |

## TDD Gate Compliance (Task 2)

- **RED** `a94713c7`: the command was `npx vitest run scripts/model-tiers.test.ts --reporter=tap-flat -t "effortRationale contains a DIGIT"` and exited 1. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, 1 fail). Semantic assessment: the target test ran and failed on its planned assertion (`expected +0 to be 1`), because no effortRationale finding existed before GREEN. There was no load, syntax or fixture fault. The unfiltered run showed four target-class failures: the "every row carries" case and the three tieredTableRefusals cases. A first classification of the unfiltered run returned `INVALID_RED` / `invalid_record` (malformed TAP). Vitest's tap-flat reporter writes a multi-line `actual:` array without YAML indentation. The planned target was re-run with `-t` to get a well-formed report, and that rerun's record was classified. The digit and vocabulary cases passed vacuously at RED (`String(undefined)` holds neither), as did the D-04 split, D-05 and separate-objects cases, because 34-01 had already shipped that behaviour.
- **GREEN** `936b1095`: the targeted files passed (225 passed, 1 skipped), and the full suite is green.
- **REFACTOR**: none needed.

## Mutation runs (Task 1 cases discriminate)

These were temporary edits to the committed `.js`, restored from a scratch copy and rebuilt. None was committed.
- `if (announcedEfforts.length === 0)` and `if (effortAssignment.value.overrides !== 0)` were both changed to `if (false)` in `adapters-freshness.js`. Case 17 went red (the gate fell through to `resolved the effort preset as "undefined"`) and Case 20 went red (the gate fell through to the levels finding `"inherit", "max"`). Each case therefore pins its own branch.
- `RESOLVED_EFFORT_PRESET_PREFIX` was shortened to `"generate-role-adapters: resolved effort "` in `model-tiers.js`. Case 21 went red with `RESOLVED_EFFORT_PRESET_PREFIX is a prefix of RESOLVED_EFFORT_ASSIGNMENT_PREFIX`, over 6 prefixes.

## Files Created/Modified

- `scripts/model-tiers.ts` / `.js`: the effort announcement grammars, builders and readers, and `readEffortAssignmentPayload`. Also `RoleTier.effortRationale`, 17 rationales, the TIERED comment, and the `tieredTableRefusals` effort checks.
- `scripts/generate-role-adapters.ts` / `.js`: imports the two effort builders and prints the two effort lines.
- `scripts/adapters-freshness.ts` / `.js`: effort imports, the effort pin, the effort role-count check and the effort verdict line.
- `scripts/adapters-freshness.test.ts`: `stripGeneratorAnnouncement` helper and Cases 16-21.
- `scripts/generate-role-adapters.test.ts`: `announcedEffortAssignment` helper, the effort announcement describe (zero-config; effort-only override) and the D-05 mirror describe.
- `scripts/model-tiers.test.ts`: the effort tiered/rationale describe. `tableWithExtra` gains `effortRationale`. The JSON.stringify site pin moves 2 to 3.
- `scripts/check-foundation-guards.test.ts`: the planted scratch TIERED row (`longTable`) gains `effortRationale`. The k-low and k-high cases were re-run (2 passed).

## Decisions Made

See `key-decisions` in the frontmatter. In short: the effort role-count check sits beside the model one; the effort payload reader is stricter than the model one (missing key, repeated level); the stringify pin moved by one named site; the cost and speed vocabulary check is test-side.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] JSON.stringify site-count pin in scripts/model-tiers.test.ts**
- **Found during:** Task 1
- **Issue:** "the quoting operation has ONE spelling in the module that ships as well as the one that compiles" pins exactly 2 `JSON.stringify(` sites in model-tiers `.ts`/`.js`. The new `resolvedEffortAssignmentLine` emitter is a third, so the case went red.
- **Fix:** The pin is now 3. The effort emitter is named in the assertion message and in a comment as the same kind of site as `resolvedAssignmentLine`: it serialises an announcement, not a refusal. The `quoteValue` single-authority assertions are unchanged.
- **Files modified:** scripts/model-tiers.test.ts (this file is not in Task 1's `<files>` list)
- **Verification:** model-tiers.test.ts 155/155 at the Task 1 commit
- **Committed in:** `41b3a078`

**2. [Placement] Effort role-count check after the listing**
- **Found during:** Task 1
- **Issue:** The plan puts the whole effort pin "before the listing and byte comparison", but its role-count clause compares against the committed adapter count, which exists only after the listing.
- **Fix:** Every other effort check runs before the listing. The role-count check runs after the set-equality half, beside the model role-count check, and is still before the byte comparison. It compares against `rebuiltNames.length`, which by that point is set-equal to the committed listing.
- **Committed in:** `41b3a078`

**3. [Rule 2 - Robustness] `typeof` check on effortRationale in tieredTableRefusals**
- **Found during:** Task 2
- **Issue:** `tieredTableRefusals` runs at run time on hand-built tables, where the compile-time requirement does not exist. Calling `.trim()` on a missing field would throw instead of producing a finding.
- **Fix:** A missing or non-string `effortRationale` is reported as the EMPTY finding. A case covers it.
- **Committed in:** `936b1095`

---

**Total deviations:** 3 (1 blocking pin moved, 1 placement, 1 robustness). **Impact:** none on scope. Each one keeps an existing guard honest or makes a new check total.

## Issues Encountered

- Before each commit, `npm run check:build-parity` reported the edited `.js` twins as "moved". This is expected: parity compares against the committed tree. It passed after every commit.
- Vitest's TAP output is malformed for multi-line diffs (see TDD Gate Compliance). It was worked around by re-running the planned target with `-t`, and the test was not changed.

## Sibling search (33.1 brief)

- DC-1 (absent evidence read as proof): every new effort reader returns an empty list for an absent line, and the gate turns empty into a named failure. The reader never defaults. Cases 17 and 18 cover the absent paths, and mutation runs show both branches are load-bearing.
- DC-3 (unbounded read): this plan adds no `readFileSync`, `existsSync`, `readdirSync`, `statSync` or `openSync` call to production `.ts`. The only new I/O is in tests, on scratch mirrors.
- Set-literal drift: Case 21 derives the prefix set and the reader set from the module's exports and asserts that the two counts agree. The D-04 split test counts `high` answers against `opus` rows, both from TIERED.

## Verification (plan-level)

- `npm run build`: exit 0. `npm run check:build-parity`: ALL CHECKS PASSED. `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: 99 files passed, 7228 passed, 2 skipped (928.6 s).
- `npm run freshness:adapters`: 17 adapters, 0 byte differences, mirrored model preset `none` and mirrored effort preset `none`.
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 34-05 (`effort` in `CANONICAL_SCHEMA`, `guard_effort_assignment`) can read the effort announcements, and it can assume every TIERED row has an `effortRationale`.
- Do not configure `models.effort` in this checkout's own config until 34-05 has landed. The adapters-freshness gate would now also refuse such a regeneration by name.

## Self-Check: PASSED

- Files: every modified path exists.
- Commits: `41b3a078`, `a94713c7` and `936b1095` are ancestors of HEAD.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-06*
