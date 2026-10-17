---
phase: 34-model-effort-dial-pi-support
plan: 19
subsystem: tooling
tags: [model-tiers, effort-dial, announcement-grammar, adapters-freshness, rc-1, d-24]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "effort announcement grammar (34-03), installer effort cross-checks (34-15)"
provides:
  - "`byAdapter` (adapter name to resolved value) in both the model and the effort assignment payloads"
  - "one payload serialiser (`assignmentLine`) and one validator (`readAssignmentPayload`) for both dials in scripts/model-tiers.ts"
  - "generator builds both maps from the adapter list (the fields render() reads), checked one entry per adapter before the write"
  - "freshness gate checks each map's key set against the compared adapter names and each value against the zero-config value"
affects: [34-20, install/install.ts probe parse, scripts/adapters-freshness.ts]

actuals:
  tokens: 21300
  tasks: 2
  commits: 2
plan_head_before: b75c8d39aca9b85a5f3c0dfb8325a1f0239b690f
plan_head_after: 90b044fffc29620b9822151eba8e2e88650f59ee

tech-stack:
  added: []
  patterns:
    - "A dial is a data descriptor (dial name, list key, member noun, closed set, membership predicate) passed to one validator; per-dial code paths are not written twice"
    - "Test announcement payloads are built with the module's own emitter over a map; only a disagreement the emitter cannot produce is applied to the emitter's output"

key-files:
  created: []
  modified:
    - scripts/model-tiers.ts
    - scripts/model-tiers.js
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/adapters-freshness.ts
    - scripts/adapters-freshness.js
    - scripts/model-tiers.test.ts
    - scripts/generate-role-adapters.test.ts
    - scripts/adapters-freshness.test.ts
    - install/install.test.ts
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md

key-decisions:
  - "Rule 8 (map values vs list) compares SETS: the list is sorted before comparison, so a list in another order is not refused; the emitter always writes it sorted"
  - "Both emitters call one private serialiser `assignmentLine`, so the JSON.stringify site-count pin moved 3 -> 2 (measured 2 in .ts and .js)"
  - "The generator's one-entry-per-adapter check runs before the write (T-27-32), not after the summary line"
  - "The freshness gate's per-member zero-config value check is defence in depth: on the real tree it is unreachable, because the validator's rule 8 plus the gate's list check already force every value to the zero-config value"

patterns-established:
  - "Payload grammar per dial is a descriptor, not a copy"

requirements-completed: [EFFORT-04]

coverage:
  - id: D1
    description: "Both assignment announcements carry a 17-entry byAdapter keyed by written adapter name, built from the adapter list; committed adapters byte-identical"
    requirement: EFFORT-04
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#CONFIGURED model and effort (both tiered): each byAdapter's keys are exactly the written adapter names, for both dials"
        status: pass
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#CONFIGURED effort (tiered plus one override): the effort announcement states each written adapter's level, keyed by adapter name"
        status: pass
      - kind: other
        ref: "npm run generate:adapters && git status --porcelain -- .claude/agents/ (empty)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One validator for both dials refuses every rule by name, quoting the payload (incl. the model repeat the old reader accepted)"
    requirement: EFFORT-04
    verification:
      - kind: unit
        ref: "scripts/model-tiers.test.ts#model-tiers: ONE assignment payload grammar for BOTH dials (plan 34-19, D-24, RC-1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Freshness gate refuses a renamed key, a map value off zero-config, and a short map, for both dials; unchanged verdict on the real tree"
    requirement: EFFORT-04
    verification:
      - kind: integration
        ref: "scripts/adapters-freshness.test.ts#Case 22/23/24 (model and effort)"
        status: pass
      - kind: other
        ref: "npm run freshness:adapters"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 19: Per-adapter assignment map, one grammar for both dials

**Both assignment announcements now carry `byAdapter`, a map from adapter name to resolved value, built from the generator's adapter list. One serialiser and one validator in scripts/model-tiers.ts serve both dials. The freshness gate holds each map's key set to the adapters it compared. No committed adapter changed.**

## Performance

- **Duration:** about 45 min
- **Started:** 2026-10-09T08:21Z (approximate)
- **Completed:** 2026-10-09T09:06:11Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 11 (6 source/compiled, 4 tests, 1 planning)

## Accomplishments

- `ResolvedAssignment` and `ResolvedEffortAssignment` gained `byAdapter`. `resolvedAssignmentLine` and `resolvedEffortAssignmentLine` now take the per-adapter map and call one private serialiser, `assignmentLine`. That serialiser derives `roles`, the sorted distinct list and `byAdapter` (keys sorted), and builds the record with `Object.fromEntries`.
- One validator, `readAssignmentPayload(dial, payload)`, replaces the two old readers. Each dial is a descriptor: `MODEL_ASSIGNMENT_DIAL` and `EFFORT_ASSIGNMENT_DIAL`. The validator checks these rules in order:
  1. a JSON object;
  2. no unexpected key;
  3. no missing key, each named;
  4. non-negative integer counts;
  5. the list is distinct and legal;
  6. `byAdapter` is an object with non-empty keys and legal values;
  7. the map's size equals `roles`;
  8. the map's distinct values equal the list.

  The two exported readers keep their names and signatures. The model reader now refuses a missing key and a repeated alias (RC-1).
- The generator builds `modelByAdapter` and `effortByAdapter` from `adapters` (each entry's `name` to its `model` and `effort`, the fields render() reads). It checks for one entry per written adapter before the write. render() is untouched.
- In scripts/adapters-freshness.ts, both announcements are read through the one reader. Two new checks follow:
  - The announced key set must equal the compared adapter names. These are derived from the regenerated listing, and their count is asserted. Both sides and both differences are printed.
  - Every value must equal `ZERO_CONFIG_ALIASES[0]` or `ZERO_CONFIG_EFFORT_LEVELS[0]`.
- Comments that became false were rewritten (DOC-1):
  - the "SEPARATE LINES, NOT A NEW KEY IN THE MODEL PAYLOAD" paragraph;
  - both payload docstrings;
  - the generator's announcement block.

### The zero-config announcement lines (generator run on the real tree)

```
generate-role-adapters: resolved model assignment: {"roles":17,"overrides":0,"aliases":["inherit"],"byAdapter":{"grugops-agents-md-scribe":"inherit","grugops-architect-design":"inherit","grugops-ba-pm":"inherit","grugops-brownfield-mapper":"inherit","grugops-compliance-officer":"inherit","grugops-factory-coach":"inherit","grugops-frontend-ui":"inherit","grugops-greenfield-mapper":"inherit","grugops-incident-responder":"inherit","grugops-installer":"inherit","grugops-orchestrator":"inherit","grugops-qe-e2e":"inherit","grugops-release-manager":"inherit","grugops-security-nfr":"inherit","grugops-software-engineer":"inherit","grugops-system-analyst":"inherit","grugops-uat-planner":"inherit"}}
generate-role-adapters: resolved effort assignment: {"roles":17,"overrides":0,"levels":["inherit"],"byAdapter":{"grugops-agents-md-scribe":"inherit","grugops-architect-design":"inherit","grugops-ba-pm":"inherit","grugops-brownfield-mapper":"inherit","grugops-compliance-officer":"inherit","grugops-factory-coach":"inherit","grugops-frontend-ui":"inherit","grugops-greenfield-mapper":"inherit","grugops-incident-responder":"inherit","grugops-installer":"inherit","grugops-orchestrator":"inherit","grugops-qe-e2e":"inherit","grugops-release-manager":"inherit","grugops-security-nfr":"inherit","grugops-software-engineer":"inherit","grugops-system-analyst":"inherit","grugops-uat-planner":"inherit"}}
```

## Task Commits

1. **Task 1 (tracer): grammar, generator, every pinned consumer** - `37e98a97` (feat). Tracer gate: interactive, `end-of-phase`, verify is automated only. Verify was re-run end to end and was green, so expansion went ahead.
2. **Task 2: freshness gate reads the map; mutation proofs; regression gate** - `90b044ff` (feat)

## Pinned sites (brief §2.4)

Search re-run as written in the plan. Before: 86 hits. After: 97 hits. The hits are in install.test.ts (18), install.ts (3), adapters-freshness.test.ts (10), adapters-freshness.ts (4), board-readonly.test.ts (1), generate-role-adapters.test.ts (7), generate-role-adapters.ts (5), model-tiers.test.ts (38) and model-tiers.ts (11).

| # | Site | Before | After |
|---|------|--------|-------|
| S1 | install/install.test.ts zero-config and tiered relay pins | hand-typed `{"roles":17,"overrides":0,"aliases":[...]}` | `resolvedAssignmentLine(expectedModelByAdapter(target[, "tiered"]), 0)`. The new helper `expectedModelByAdapter` takes its keys from the installed listing via `adapterStemMap` and its values from `resolveModels` over the derived stems |
| S2 | install/install.test.ts model anchors, model count and alias-set rows, `EFFORT_ANNOUNCE_ANCHOR`, effort rows set-mismatch and (d) | anchors `...(models, ...)` and `...(efforts, ...)`; hand payloads; `effortAnnounceLine(payload)` | `MODEL_ANNOUNCE_ANCHOR` and `EFFORT_ANNOUNCE_ANCHOR` follow the new call text (`modelByAdapter`, `effortByAdapter`). One helper, `announceStatement(line)`, wraps a line the module's emitter builds over `synthMap(value, count)`. The rows use: count row 16-entry `inherit`; alias-set row 17-entry `opus`; level-set row 17-entry foreign level; effort (d) 16-entry `inherit`. `effortAnnounceLine` was deleted. Row (c) malformed stays hand-typed, because the emitter cannot produce it |
| S3 | scripts/adapters-freshness.test.ts `shortenAnnouncedMemberCount` | anchor `resolvedAssignmentLine(models, ...)`, slice of `models` | anchor `resolvedAssignmentLine(modelByAdapter, ...)`, slice of the adapter-keyed map. `stripAssignmentAnnouncement` and the effort strip at :698 are unchanged, because their anchor is the builder name only |
| S4 | scripts/generate-role-adapters.test.ts | `toEqual({roles, overrides, aliases})` | the same objects now also carry `byAdapter: writtenDial(...)` (bytes per member); zero-config effort asserts `byAdapter`. Two new cases: configured effort per-adapter levels, and both-dial keys equal the written adapter names. Existing field reads are unchanged |
| S5 | scripts/model-tiers.test.ts | inverse and mixed cases without a map; closed-set control hand-typed; no effort reader cases; stringify pin 3 | inverse and mixed cases assert `byAdapter`; closed-set control built by the emitter; new both-dial table (24 rule rows × 2 dials, plus a premise case and per-dial round-trip cases); stringify pin 2 (reason in its comment) |
| S6 | scripts/adapters-freshness.ts | counts and sets | plus the key-set and zero-config value checks for both dials (Task 2) |
| S7 | install/install.ts probe and parse | relays both readers | unchanged. The probe relays the readers' results, which now carry `byAdapter`, and the parse ignores the new key until 34-20. Installer tests are green |
| S8 | scripts/board-readonly.test.ts:1999 | `resolvedAssignmentsIn` inside a fixture string | unchanged (confirmed) |

## RC-1 grammar table (G1 to G6)

| # | Site | Before | After this plan |
|---|------|--------|-----------------|
| G1 | scripts/model-tiers.ts payload readers | two validators, the effort one stricter | one validator, `readAssignmentPayload(dial, ...)`, for both dials |
| G2 | scripts/model-tiers.ts emitters | distinct set only | `byAdapter` for both dials, through one serialiser, `assignmentLine` |
| G3 | scripts/generate-role-adapters.ts announcement calls | set from the resolution maps | maps built from the adapter list's `name`/`model`/`effort`, both dials, checked before the write |
| G4 | scripts/adapters-freshness.ts | counts and sets | plus the map key set equal to the compared names, and every value zero-config, both dials |
| G5 | scripts/check-foundation-guards.ts guard_model_assignment, guard_effort_assignment | recompute from config | unchanged (they compare committed adapters with configuration, not with announcements) |
| G6 | refusal quoting (WR-04) | both alike via `quoteValue` | unchanged, deferred |

## Mutation proofs

Each mutation was applied to the `.ts` and rebuilt, then the named test went red. The file was then restored from a scratch copy, `cmp` confirmed it byte for byte, and it was rebuilt.

| ID | Mutation | Named test red | First red line |
|----|----------|----------------|----------------|
| g1 | effort map built as all-`inherit` instead of from `a.effort` | generate-role-adapters: "CONFIGURED effort (tiered plus one override)..." (also two other effort cases) | `AssertionError: announced levels per adapter: expected { …(6) } to deeply equal { …(6) }` |
| g2 | model map keyed by `a.stem` | generate-role-adapters: "CONFIGURED model and effort (both tiered): each byAdapter's keys are exactly the written adapter names" (plus 3 model announcement cases). Freshness gate: Cases 1, 7, 8, 15, 16 and others (12 failed in total) | generator: `AssertionError: model byAdapter keys = the written adapter names: expected [ 'agents-md-scribe', …(5) ] to deeply equal [ 'grugops-agents-md-scribe', …(5) ]`. Gate: `Adapter freshness check FAILED: the mirrored regeneration's announced model map names 17 adapter(s), and they are not the 17 adapter(s) this gate compared.` |
| g3 | validator rule 8 (map vs list agreement) disabled | model-tiers: rule 8a and 8b, model AND effort (4 failed) | `AssertionError: model "{"roles":3,...,"aliases":["inherit","opus","sonnet"],...}" must be REFUSED, not accepted: expected true to be false` |
| g4 | repeat refusal applied to the effort dial only | model-tiers: "model: rule 5d a repeated list member" (1 failed) | `AssertionError: model "{"roles":3,"overrides":1,"aliases":["inherit","opus","opus"],...}" must be REFUSED, not accepted: expected true to be false` |
| g5 | freshness key-set `die` made unreachable (`if (false) die(...)`) | adapters-freshness: Case 22 (i), model AND effort (2 failed) | `AssertionError: Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` |

## Decisions Made

- **Set comparison for rule 8.** "The sorted distinct values equal the list" is implemented as set equality, by sorting the list's copy. An unsorted but otherwise equal list is not refused. The emitter always writes it sorted.
- **One serialiser.** The two emitters share `assignmentLine`. That makes the grammar one, and moves the `JSON.stringify` site-count pin from 3 to 2. This was measured: 2 in `model-tiers.ts` and 2 in `model-tiers.js`, and the reason is written in the pin's comment.
- **Check before write.** The generator's one-entry-per-adapter check sits before `mkdirSync` and the write loop. This follows the existing "build everything, then write" rule (T-27-32).
- **Validator wording.** Refusals keep the `model-tiers: the resolved <dial> assignment payload <quoted> ...` prefix, which install.test.ts row (c) keys on, and keep `not a legal model alias` / `not a legal effort level`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A mutation proof was malformed the first time**
- **Found during:** Task 2 (g5)
- **Issue:** The first g5 mutation prefixed `false &&` to the first operand of a `||` chain. Because of operator precedence it still evaluated the other two operands, so the check was not skipped and every row stayed green. The harness's own premise was false.
- **Fix:** The mutation was re-applied as `if (false) die(...)` on the key-set finding. Case 22 (i) then went red for both dials, and that result is the one recorded.
- **Files modified:** none (the mutation was restored byte for byte)
- **Committed in:** n/a

**2. [Rule 2 - Missing critical] Row (iii) added for the effort dial**
- **Found during:** Task 2
- **Issue:** The plan's row (iii) points at the existing model short-count case (Case 13). RC-1 requires the same check on both dials.
- **Fix:** Case 24 (iii) runs the short-map refusal for model and effort. Case 13 also still passes.
- **Files modified:** scripts/adapters-freshness.test.ts
- **Committed in:** 90b044ff

---

**Total deviations:** 2 (1 harness bug in a mutation proof, 1 RC-1 coverage addition). **Impact:** none on scope. Product behaviour is as planned.

## Issues Encountered

- **Regression gate:** `npx vitest run --exclude '**/scripts/e2e/**'` reports 102 of 103 files passed. Tests: 7493 passed, 1 failed, 2 skipped (1482.9 s).
  - The single failure is `install/installer-fs-census.test.ts`: "UNCLASSIFIED node:fs export openAsBlobSync".
  - The local runtime is Node v26.11.0, which exports `openAsBlobSync`. The test fails the same way when run alone, and nothing it reads was changed by this plan.
  - It is out of scope and recorded in `deferred-items.md`. It was not fixed here.
- **Other checks, all green:**
  - `npm run build`
  - `npm run check:build-parity`: ALL CHECKS PASSED, after the commit
  - `npm run typecheck`
  - `npm run freshness:adapters`: "Adapters fresh: 17 adapter(s) compared ..., 0 byte difference(s)", verdict unchanged
  - `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED
- **Task 1 targeted verify:** 6 files, 763 passed, 2 skipped. After regeneration, `git status --porcelain -- .claude/agents/` is empty.
- **Unreachable code:** the gate's per-member zero-config value check cannot be reached on any input that passes the validator. Rule 8 plus the gate's existing list check already force every value to the zero-config value. No row reaches it, and it is kept as defence in depth, as the plan specifies.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 34-20 can read `value.byAdapter` from both readers through the installer probe, which is unchanged, and compare each rendered adapter with it.
- The adapter name keys are `grugops-<stem>`, the rendered file name without `.md`.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*

## Self-Check: PASSED
