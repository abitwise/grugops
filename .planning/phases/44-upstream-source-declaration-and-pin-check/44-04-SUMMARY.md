---
phase: 44-upstream-source-declaration-and-pin-check
plan: 04
subsystem: validation
tags: [upstream, validator, config, factory-config, vitest, typescript]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01's scripts/upstream-model.ts (parseUpstreamConfig, sourcePathFindings) and plan 44-02's pinned grammar cases
provides:
  - the `upstream` arm in checkConfigForm, refusing a malformed declaration by key path at every governance position
  - 16 validator cases under `validate-agent-factory.js — the upstream declaration (UP-01, D-01, D-02, D-19)`
  - the `upstream` Fields row, the `### upstream sub-fields` section and a zero-config sentence in factory.config.md
affects: [44-05, 44-06, 44-08, phase-45, phase-47]

actuals:
  tokens: 3922
  tasks: 2
  commits: 3
plan_head_before: 26e42fc0fc41ac444e355a7d596240d6a1294f87
plan_head_after: e5369f38200934be7a973ff172ea82d35fb53e97

tech-stack:
  added: []
  patterns:
    - "A validator config arm that imports its grammar from the module the host runnable embeds and only relabels the findings"
    - "checkConfigForm receives the canonical base, so a rule that needs the repository root resolves against the root that holds .grugops/"

key-files:
  created: []
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - agent-factory/config/factory.config.md

key-decisions:
  - "The upstream arm adds no rule of its own: it reports parseUpstreamConfig findings, and applies sourcePathFindings only once the declaration is otherwise well formed, the order the runnable uses"
  - "The path base is the loop's canonical base, the root that holds .grugops/, so the same bytes are judged against the state root at the state position"

patterns-established:
  - "Allowed-key sets quoted in a finding are compared as a set in tests, so the case does not pin the declaration order"

requirements-completed: [UP-01]

coverage:
  - id: D1
    description: "The structure validator refuses a malformed upstream declaration by key path (null, empty sources, unknown key with allowed set, short commit, uppercase entry_blob, unknown area, escalation_days)"
    requirement: UP-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#validate-agent-factory.js — the upstream declaration (UP-01, D-01, D-02, D-19)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The validator refuses an absolute, ~, backslash, inside-repository and ancestor path, resolved against the root that holds .grugops/ (D-19), at the kit and the state base"
    requirement: UP-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#refuses ... naming upstream.sources[0].path (5 cases) and the two state-base cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "A config with no upstream key and a config with one valid source both print ALL CHECKS PASSED and exit 0; the repository's own tree still validates"
    requirement: UP-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#a config with no upstream key passes (zero-config); #a config with one valid upstream source passes"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. node scripts/validate-agent-factory.js (and --strict)"
        status: pass
    human_judgment: false
  - id: D4
    description: "factory.config.md documents upstream: Fields row (default absent), the sub-fields section with every D-02 key, its grammar and the path base, the escalation_days refusal sentence, and the zero-config sentence"
    requirement: UP-01
    verification:
      - kind: other
        ref: "grep acceptance gates in 44-04-PLAN.md Task 2; node scripts/check-kit-refs.js; npm run check:banned-claims; config consistency tests"
        status: pass
    human_judgment: true
    rationale: "The tests prove the section exists and breaks no kit check; whether the prose reads clearly to a user is a judgment no test makes"

duration: 7min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 04: Upstream Declaration in the Validator Summary

**The structure validator now refuses a malformed `upstream` declaration by key path, through `parseUpstreamConfig` and `sourcePathFindings` imported from `scripts/upstream-model.ts`, and `factory.config.md` documents the declaration as enforced**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-25T09:20:35Z
- **Completed:** 2026-11-25T09:27:21Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `checkConfigForm` gains a fourth parameter `base` and an `if ("upstream" in cfgObj)` arm after the `checkpoints` arm. The arm adds no rule of its own. It reports each `parseUpstreamConfig` finding under the position's label, then applies `sourcePathFindings` to each admitted source against the canonical base.
- 16 cases in `scripts/validate.test.ts`. Absent and valid declarations pass. Every D-01/D-02/D-06/D-18/D-19 violation the plan lists is refused with the key named. Two cases run at the state base: one checks the `.grugops/factory.config.json` label, and one checks that the path is resolved against the state root.
- `agent-factory/config/factory.config.md`: an `upstream` Fields row (default absent) and a `### upstream sub-fields` section. The section gives the six source keys, their forms, the path base and the D-19 rule, says one source owns each area and each prefix, says only a named human moves a pin, and has the sentence on why `escalation_days` is refused. The Zero-config section gets one new sentence.

## Task Commits

1. **Task 1 RED: failing upstream cases** - `2e4dd9ac` (test)
2. **Task 1 GREEN: the upstream arm in the validator** - `7da75799` (feat)
3. **Task 2: document upstream in the config field reference** - `e5369f38` (docs)

## TDD Gate Compliance

- **RED** (`2e4dd9ac`): `npx vitest run scripts/validate.test.ts -t upstream` showed 14 failed and 2 passed. The 2 that passed are the absent and valid cases, which pass on the old validator as they should. Each of the 14 failed on `expect(r.status).not.toBe(0)`. Evidence record: `npx vitest run scripts/validate.test.ts -t "refuses an unknown source key by name" --reporter=tap-flat`, exit 1. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran, and it failed because the validator accepted a source with the unknown key `pinned`. That is the missing behavior the plan describes, not a load or fixture fault.
- **GREEN** (`7da75799`): all 16 upstream cases pass, and all 213 cases in `scripts/validate.test.ts` pass.
- **REFACTOR:** none needed.

## Files Created/Modified

- `scripts/validate-agent-factory.ts` - adds the import of `parseUpstreamConfig` and `sourcePathFindings`, the `base` parameter and the `upstream` arm with a leading block comment
- `scripts/validate-agent-factory.js` - compiled output, checked fresh by `npm run freshness`
- `scripts/validate.test.ts` - the upstream describe, with the helpers `upstreamSource`, `kitWithUpstream` and `kitWithSource`
- `agent-factory/config/factory.config.md` - the Fields row, the sub-fields section and the zero-config sentence

## Decisions Made

- The path rule runs only after the declaration passes `parseUpstreamConfig`, because `sourcePathFindings` is applied to admitted sources. So a source with both an unknown key and a bad path reports only the key finding on the first run. This matches the runnable.
- The base passed to the path rule is the loop's canonical base. For `.grugops/factory.config.json` that is the directory holding `.grugops/`. For the in-kit config it is the kit root, which in a checkout is the repository root.

## Deviations from Plan

### Auto-fixed Issues

None.

### Notes on the plan as written

**1. The verify command `node scripts/validate-agent-factory.js` exits 1 when run bare.** This is the validator's existing C3 rule: `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.'`. This plan did not cause it. The self-check was run as `VALIDATE_KIT_ROOT=. VALIDATE_ROOT=. node scripts/validate-agent-factory.js`, which prints `ALL CHECKS PASSED` both bare and with `--strict`.

**2. The finding quotes the allowed set in declaration order.** The plan writes the set sorted (`commit, entry, entry_blob, id, owns, path`), but the finding prints it in declaration order (`id, path, commit, entry, entry_blob, owns`) because `UPSTREAM_SOURCE_KEYS` is ordered that way. The test compares the two as sets. No code was changed.

**3. One extra state-base case.** The plan asks for one twoRoots case. I added a second (`sub/inside` at the state base). It proves the path rule resolves against the state root and not the kit root.

**Total deviations:** 0 auto-fixed. **Impact on plan:** none. The plan was delivered as specified.

## Issues Encountered

- The first RED capture used the whole `-t upstream` filter. The classifier refused it as `invalid_record` ("Non-TAP data in report"): the path cases pass the validator output as a multi-line assertion message, and that breaks vitest's TAP YAML. Rerunning only the named target test gave a clean report and `RED_EVIDENCE_OK`.
- While checking a commit hash I ran `git stash list` by mistake. It is read-only and changed no state, but the run's rules forbid every `git stash` subcommand, so I am reporting it here.
- `install/installer-fs-census.test.ts` (DI-03, local Node 26 only) was not run. It is unrelated to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 44-05 and 44-06 (runnable states) and 44-08 can rely on the validator refusing a malformed declaration in CI. A declaration the validator admits is exactly one `upstream.js check` admits.
- Phase 45 needs to add `escalation_days` to `UPSTREAM_KEYS` in `scripts/upstream-model.ts`, and update the refusal sentence in `factory.config.md` in the same change.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED

All three commits are ancestors of HEAD; all four modified files exist; acceptance greps, the validator suite (213/213), config consistency tests, check-kit-refs, banned-claims, freshness and hook-manifest freshness all pass.
