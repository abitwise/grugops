---
phase: 34-model-effort-dial-pi-support
plan: 07
subsystem: docs/model-dial
status: complete
tags: [effort, model-dial, documentation, pi, host-registry, byte-baseline, vitest]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-01/34-03: EFFORT_LEVELS, EFFORT_PRESET_NAMES, resolveEfforts and the effort announcement lines; 34-02: HOST_TOOLS, HOST_TOOL_COUNT"
provides:
  - "factory.config.md `### models.effort sub-fields`: the effort sets declared once under `allowed effort presets:` and `allowed effort levels:`, precedence, independence, absent-means-inherit, refusals, shared reader, cited Claude Code behaviour, two UNKNOWN - verify residuals, re-install delivery"
  - "subagent.frontmatter.md `- **effort**` bullet, re-measured coordinator size sentence, section `## Host-CLI scope of the model and effort dials` with a count-free scope sentence, a cited Pi clause and a count-free citation block"
  - "model-dial-consistency oracle: effort sets two-direction, four markers pairwise non-substring, scope hosts derived from HOST_TOOLS (OTHER_HOST_CLI_COUNT removed)"
  - "adapter-byte-baseline: second declared divergence (D-14) as a stated transform on the frozen line; D-06 zero-config no-effort case"
  - "coordinator adapter Degraded line reads `the non-Claude-Code host CLIs`"
affects: [34-08, 34-09, 34-10]

actuals:
  tokens: 17651
  tasks: 3
  commits: 4
plan_head_before: 86fe7b2162e1188482c02e4da20e43962ac1a8c8
plan_head_after: 217fc8493c708d772babc4822815b9abbff77fc8

tech-stack:
  added: []
  patterns:
    - "a doc oracle names the hosts a sentence covers by reading the sentence's own grammar (the per-agent clause, the `<host> ships no sub-agents` clause), then compares that union with the registry in both directions"
    - "a byte-baseline divergence is a named phrase transform on the frozen line, asserted to have exactly one target before it applies"

key-files:
  created:
    - .planning/phases/34-model-effort-dial-pi-support/.red/34-07-red.json
  modified:
    - agent-factory/config/factory.config.md
    - agent-factory/packaging/subagent.frontmatter.md
    - scripts/model-dial-consistency.test.ts
    - scripts/adapter-byte-baseline.test.ts
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - .claude/agents/grugops-orchestrator.md

key-decisions:
  - "The effort bullet in subagent.frontmatter.md names the dial authority as `factory.config.md`, not by its kit path, because the packaging authority must carry zero `agent-factory/config/` references (D-08.1, check-kit-refs and a model-dial-consistency case)"
  - "The Pi clause sits on the scope sentence's physical line, and its host is read off the clause grammar (`<host> ships no sub-agents`) rather than off the registry, so a clause naming a host the registry lacks is red"
  - "The hook-enforcement host list now states a grugops fact (grugops installs no equivalent pre-tool hook on those hosts), because Pi extensions can block a tool call; the wording keeps the phrase config-governance-consistency pins"
  - "The 2.1.267 note states only that older Claude Code ignored the line on the three models; what ran instead is not claimed"

patterns-established:
  - "Effort residuals live in the config field reference, so the packaging authority's pinned UNKNOWN - verify count (4) does not move"

requirements-completed: [EFFORT-01, EFFORT-04, EFFORT-05, PI-04]

coverage:
  - id: D1
    description: "The effort closed sets are declared once in the dial authority under non-colliding markers and equal the code's tuples in both directions"
    requirement: EFFORT-05
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/model-dial-consistency.test.ts#effort dial — the documented effort sets equal the module's own, in BOTH directions (EFFORT-05)"
        status: pass
  - id: D2
    description: "The dial authority states what Claude Code does with an effort line, with sources, and marks the two unknowns"
    requirement: EFFORT-01
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/model-dial-consistency.test.ts#effort dial — the authority states what Claude Code does with the field, with sources (EFFORT-01)"
        status: pass
  - id: D3
    description: "The scope section is count-free for both dials, carries a cited Pi clause, and its host set is derived from HOST_TOOLS"
    requirement: PI-04
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/model-dial-consistency.test.ts#the hosts the scope paragraph names equal the registry's non-spawn hosts, in both directions (D-11, D-12)"
        status: pass
  - id: D4
    description: "The coordinator's Degraded line is count-free under a declared, derived byte-baseline divergence, and no zero-config adapter carries an effort line"
    requirement: EFFORT-04
    human_judgment: false
    verification:
      - kind: test
        ref: "scripts/adapter-byte-baseline.test.ts"
        status: pass
      - kind: command
        ref: "npm run freshness:adapters"
        status: pass
  - id: D5
    description: "The dial prose is accurate and readable for a user configuring models.effort (clear voice, no cost claim)"
    requirement: EFFORT-05
    human_judgment: true
    rationale: "No test can judge whether the prose is clear and complete for a reader; the presence oracles only hold the cited tokens and anchors"

duration: 31 min
completed: 2026-10-06
---

# Phase 34 Plan 07: Effort Dial Documentation, Count-Free Scope with Pi, D-14 Baseline Divergence Summary

**The effort dial is documented once in `factory.config.md` with cited Claude Code behaviour and two `UNKNOWN - verify` residuals, the emitted field once in `subagent.frontmatter.md`, the host-CLI scope section is count-free with a cited Pi clause whose host set the oracle derives from `HOST_TOOLS`, and the coordinator's Degraded line drops its host count under a second declared byte-baseline divergence.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-10-06T14:23:41Z
- **Completed:** 2026-10-06T14:54:39Z
- **Tasks:** 3
- **Files modified:** 7 (+1 RED evidence record created)

## Accomplishments

- `agent-factory/config/factory.config.md`: the `models` row lists `effort` and points at the new `### models.effort sub-fields` section. That section declares the presets (`allowed effort presets:` `none`, `tiered`) and the levels (`allowed effort levels:` `inherit`, `low`, `medium`, `high`, `xhigh`, `max`) once each. It states precedence (D-02), independence from the model preset (D-05), absent-means-inherit with no `effort:` line (D-06), the refusals (D-03) and the shared two-location reader (D-07). It also states what Claude Code does with the field (D-01, D-08): the quoted sub-agents field definition, the model-config fallback, the `CLAUDE_CODE_EFFORT_LEVEL` override, the `maxEffortLevel` cap, the 2.1.267 floor, and the fact that extended thinking cannot be set per sub-agent. Two `UNKNOWN - verify` residuals are anchored as "the no-effort model behaviour" and "the standalone version floor". The section ends with the re-install delivery path. The `wip_limit` row and the hook-enforcement host list are now count-free, and the latter names Pi.
- `agent-factory/packaging/subagent.frontmatter.md`: a `- **effort**` bullet (emitted only when not `inherit`, directly after `model:`, rules deferred to the config reference). The coordinator size sentence is re-measured: **3013 bytes** at zero config, 59 bytes of warn-tier headroom, +15 bytes for the largest effort line (`effort: medium`) giving 3028. Specialists measure 1541 to 1901 bytes. The section `## Host-CLI scope of the model and effort dials` has a count-free scope sentence for both dials and the Pi clause on the same line. The citation block heading is count-free and dated per retrieval round, and a Pi citation line was added (Pi README line 19 and pi.dev). R1, R2, R3 and the line-125, topology and non-spawning bullet lines are count-free, and the bullet names Pi.
- `scripts/model-dial-consistency.test.ts`: effort markers at one site each, with members equal to `EFFORT_PRESET_NAMES` / `EFFORT_LEVELS` both ways. The four set markers are pairwise non-substring (count asserted). The model site pins are unchanged, and the effort section carries no model marker. Presence cases cover the cited tokens and both residual anchors. Further cases check for no `docs.claude.com` link, exactly one effort bullet, and the effort sets declared in no other shipped document. `OTHER_HOST_CLI_COUNT` is gone. The oracle unions the hosts named in the per-agent clause and the Pi clause and compares them both ways with `HOST_TOOLS` rows whose dispatch is `sequential`. The count is `HOST_TOOL_COUNT` minus the spawn rows. Per-host citations are checked over the union.
- `scripts/adapter-byte-baseline.test.ts`: a second declared divergence. The Degraded line is derived from the frozen baseline line by replacing the retired phrase with `the non-Claude-Code host CLIs`. The retired phrase is assembled from parts, and the count word has its own constant. Each transform asserts its single target before it applies. The "real before admitted" check now covers both divergences, the "exactly two lines of one file" check replaces the old one-line assertion, and the length delta is derived from the transform. A new D-06 case reads the derived adapter set (count = `ROLE_COUNT`) and expects zero `effort: ` lines.
- `scripts/generate-role-adapters.ts` (+ `.js`): the Degraded line was reworded and the coordinator adapter regenerated. The adapter diff is that one line, and the byte length is unchanged (both phrases are 29 bytes).

## Task Commits

1. **Task 1 (tracer): effort closed sets declared, two-direction oracle**: `0ea7487a` (docs). Tracer gate: verify re-run green, then expansion continued.
2. **Task 2: cited effort behaviour, emitted field bullet, heading rename**: `b74177e6` (docs)
3. **Task 3 (TDD): count-free scope with Pi, D-14 divergence, D-06 case**
   - RED: `9f4eebe8` (test)
   - GREEN: `217fc849` (feat)

## TDD Gate Compliance (Task 3, tdd="true")

- **RED** `9f4eebe8`: `npx vitest run --exclude '**/scripts/e2e/**' scripts/adapter-byte-baseline.test.ts --reporter=tap-flat` exited 1.
  - Target test: "every adapter frozen at the pinned commit matches the working tree BYTE for BYTE — except the TWO recorded coordinator divergences …". It failed on its byte-equality assertion because the working coordinator still carried the retired phrase. In the same RED state, five scope cases in `model-dial-consistency.test.ts` failed for the planned reason: the packaging doc did not yet carry the new sentence, the Pi clause, the citation heading or the R3 anchor.
  - Semantic assessment: the target ran and failed on the planned assertion for the intended reason. There was no setup, import or collection failure.
  - Record: `.planning/phases/34-model-effort-dial-pi-support/.red/34-07-red.json`.
  - The `tdd-red-evidence` classifier returned `INVALID_RED / invalid_record` with `report_errors: ["Non-TAP data in report", "Malformed TAP"]`. This is the same vitest `tap-flat` formatting issue 34-05 recorded, and the report was not edited. Machine validation is **UNKNOWN - verify**, so only the semantic assessment stands.
- **GREEN** `217fc849`: all three target files pass (116 passed, 1 skipped, which was already skipped before this plan).
- **REFACTOR:** none needed.
- **Characterisation note:** the D-06 no-effort case and the registry-equality case passed in the RED state. The first describes an existing zero-config property, and the second compares constants with the registry. The mutation proofs below show both can fail.

## Mutation proofs

1. Removed `xhigh` from the documented level set: "the documented effort levels equal EFFORT_LEVELS in both directions" went red. Reverted.
2. Respelled the preset marker as "Closed effort preset allowed set:": three cases went red, including the model site pin. This is the Pitfall 7 collision, now caught. Reverted.
3. Replaced `maxEffortLevel` and stripped `UNKNOWN - verify` from the version-floor residual: the token and residual cases went red. Reverted.
4. Appended an `allowed effort levels:` line to subagent.frontmatter.md: the single-authority corpus case went red. Reverted.
5. Deleted the Pi row from the committed `install/host-tools.js`: the registry-equality case went red. Reverted (byte-identical to the committed file).
6. Added `effort: medium` to `.claude/agents/grugops-qe-e2e.md`: the D-06 case and the byte case both went red. Reverted.

## Verification

- `npx vitest run --exclude '**/scripts/e2e/**'` (full suite, after the GREEN commit): **99 files passed, 7293 tests passed, 2 skipped, exit 0** (958.81 s).
- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED after the commit; it reports uncommitted `.js` as "moved" before the commit), `npm run typecheck`: pass.
- `npm run freshness:adapters`: 17 adapters, 0 byte differences, and the mirrored generator resolved model preset `none` and effort preset `none`.
- `node scripts/check-foundation-guards.js`, `check-claim-anchors.js`, `check-kit-refs.js`, `check-banned-claims.js`, `check-public-docs-vocabulary.js`, `check-imperative-lexicon.js`: ALL CHECKS PASSED.
- Acceptance greps: each effort marker appears once in factory.config.md. `non-Claude-Code host CLIs` appears once in each of the generator, the adapter and the packaging doc. `OTHER_HOST_CLI_COUNT` appears 0 times. The adapter diff is one line (the Degraded line). `CLOSED_SET_DECLARATION_SITES` is unchanged (2). The packaging doc's `UNKNOWN - verify` count is unchanged (4). There is no `docs.claude.com` link.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The effort bullet does not spell the dial authority's kit path**
- **Found during:** Task 2
- **Issue:** The plan text says the bullet points to "agent-factory/config/factory.config.md". The packaging authority must carry zero `agent-factory/config/` references: D-08.1, held by `check-kit-refs` and by the model-dial-consistency case "the packaging authority spells NO kit-internal config path".
- **Fix:** The bullet names `factory.config.md`, the config field reference, as the model bullet already does.
- **Files modified:** agent-factory/packaging/subagent.frontmatter.md
- **Commit:** b74177e6

**2. [Rule 3 - Blocking] An unlisted pin on the hook-enforcement sentence**
- **Found during:** Task 2 (targeted run of the tests that read the two docs)
- **Issue:** `scripts/config-governance-consistency.test.ts` pins the phrase "no equivalent pre-tool hook". The first rewording of line 181 dropped it.
- **Fix:** The sentence now reads "grugops installs no equivalent pre-tool hook" on every host CLI other than Claude Code, naming the five, Pi included. This keeps the pin and makes the sentence true for Pi, whose extensions can block tool calls (34-RESEARCH § B).
- **Files modified:** agent-factory/config/factory.config.md
- **Commit:** b74177e6

**3. [Rule 1 - Accuracy] Count words in R1 and R2**
- **Found during:** Task 3
- **Issue:** R1 ("The four references above … none of the four vendors") and R2 ("the four accept") became wrong once a fifth citation line (Pi) was added. The plan named only R3.
- **Fix:** R1 and R2 rewritten count-free, keeping their anchors.
- **Files modified:** agent-factory/packaging/subagent.frontmatter.md
- **Commit:** 217fc849

**4. [Rule 1 - Accuracy] Specialist size range in the size sentence**
- **Found during:** Task 2
- **Issue:** The same paragraph as the coordinator size quoted stale specialist sizes (1632 to 1987 bytes).
- **Fix:** Replaced with the measured 1541 (`grugops-qe-e2e`) to 1901 (`grugops-security-nfr`).
- **Commit:** b74177e6

**Total deviations:** 4 auto-fixed (2 Rule 1 accuracy, 1 Rule 1 constraint, 1 Rule 3 pin). **Impact:** no scope change. Each keeps a shipped sentence true or keeps an existing gate green.

## Known Stubs

None.

## Deferred Issues

- Count-word host prose outside this plan's files is left for plan 34-09's derived prose scan and plans 34-06/34-08: agent-factory/README.md line 58, packaging/adapters.md lines 41, 53 and 74, roles/_role-switch-protocol.md line 54, checklists/browser-uat-recipe.md line 500, install/README.md line 1208, hooks/admission-guard.ts line 33, scripts/context-io.ts, and comments in scripts/model-dial-consistency.test.ts that describe the 29.1 history.
- `install/README.md` § 5 "Other tools" has no Pi bullet yet. The factory.config.md sentence points the reader to the install guide for each tool's approval controls, and plan 34-08 adds the Pi bullet.

## Issues Encountered

- A tooling slip: `source` was run on a markdown reference file, which left a background shell waiting. Repository state was checked with `git status` (clean apart from the intended edits), and `gsd-tools.cjs` was then called directly.

## Next Phase Readiness

Plans 34-08 (install guide Pi entry, which points at the renamed section "Host-CLI scope of the model and effort dials") and 34-09 (derived prose scan) can build on this. 34-06 has no SUMMARY yet.

## Self-Check: PASSED

- FOUND: agent-factory/config/factory.config.md, agent-factory/packaging/subagent.frontmatter.md, scripts/model-dial-consistency.test.ts, scripts/adapter-byte-baseline.test.ts, scripts/generate-role-adapters.ts, scripts/generate-role-adapters.js, .claude/agents/grugops-orchestrator.md, .planning/phases/34-model-effort-dial-pi-support/.red/34-07-red.json
- FOUND commits on HEAD: 0ea7487a, b74177e6, 9f4eebe8, 217fc849
