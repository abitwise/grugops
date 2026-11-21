---
phase: "39"
plan: "03"
subsystem: tooling
tags: [check-foundation-guards, role-ceilings, adapter-byte-baseline, model-01, tier-06, vitest]

requires:
  - phase: 39
    provides: "39-01: listAgentAdapterNames, AGENT_ADAPTER_PREFIX, the Phase 39 start commit (plan_head_before 8a530552); 39-02: one adapter per AgentAdapterSpec, adapter-stem guard wording"
provides:
  - "check-foundation-guards: ROLE_CEILINGS keyed table (replaces roleCeiling), NO_CEILING, two-sided key-set equality against the derived role corpus in guard_role_size"
  - "admission-protocol-docs.test: role list derived from listRoles(), floored on ROLE_COUNT"
  - "Live-kit adapter, grant and role-row counts in tests read listAgentAdapterNames / ROLE_COUNT (install.test LIVE_ADAPTER_COUNT)"
  - "adapter-byte-baseline.test: PRE_PHASE_ADAPTER_BASELINE re-pinned to 8a530552d6c0e815d2959d16a8c06d99cc2d612b by D-3, RECORDED_ADDED / RECORDED_REMOVED (empty), two-source grant and count, two-sided effort rule"
affects: [39-05, 39-06, 39-07, check-foundation-guards, adapter-byte-baseline]

actuals:
  tokens: 26790
  tasks: 3
  commits: 3
plan_head_before: 90188dd5f0a9dc58c316531675b2a186692eac38
plan_head_after: 96ff71976e0f00b987669df1816be2b31398bba0

tech-stack:
  added: []
  patterns:
    - "A measured table keeps hand-measured VALUES but checks its KEY SET against the filesystem derivation in both directions, reporting missing and stale keys sorted"
    - "A frozen-tree baseline moves only by hand-written ADDED / REMOVED records; every expectation is the pinned tree transformed by those records, cross-checked against the kit derivation"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/admission-protocol-docs.test.ts
    - scripts/kit-model.test.ts
    - scripts/generate-role-adapters.test.ts
    - scripts/frontmatter.test.ts
    - scripts/generate-catalog.test.ts
    - install/install.test.ts
    - scripts/adapter-byte-baseline.test.ts

key-decisions:
  - "D-3 applied: the MODEL-01 baseline is re-pinned to 8a530552d6c0e815d2959d16a8c06d99cc2d612b (the Phase 39 start commit); the 6f8411e pin and its three transforms (33-28, 34-07 D-14, 36-10 D-14) are retired because all three are inside the new tree"
  - "The baseline listing's short-set floor moved from ROLE_COUNT to baseline + ADDED - REMOVED == listAgentAdapterNames().length, because ROLE_COUNT will exceed the frozen count as soon as 39-05 adds a role"
  - "guard_role_size reports a missing key and a stale key as separate findings worded without 'no documented ceiling', so the per-file fail-closed falsifier still isolates the NO_CEILING mechanism"
  - "check-banned-claims.test.ts's 16 counts excluded exact paths, not the coordinator grant, so it stays literal"
  - "install.test.ts reads one LIVE_ADAPTER_COUNT constant (listAgentAdapterNames(REPO_ROOT).length) for all 26 adapter-count sites, because every install there renders from the real role corpus; no fixture literal was kept"

patterns-established:
  - "RECORDED_ADDED entries are { name, kind: 'level' | 'new-role', reason } with role, level, model and effort literals for level adapters; RECORDED_REMOVED is names, each with a trailing reason comment"

requirements-completed: [TIER-06]

coverage:
  - id: D1
    description: "ROLE_CEILINGS key set equals the derived role basenames both ways; a role with no ceiling and a ceiling with no role are each red by name, sorted, and the unplanted mirror is green"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#role ceiling key set (ROLE_CEILINGS): the unplanted mirror is the green control (TIER-06)"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#role ceiling key set (ROLE_CEILINGS): a planted role with no ceiling is red naming it, sorted, never given a default ceiling (TIER-06 empty, ordering)"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#role ceiling key set (ROLE_CEILINGS): a deleted role whose ceiling remains is red naming the stale key, sorted (TIER-06 adjacency, ordering)"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#guard_role_size fail-closed default: an UNDOCUMENTED role FAILS closed by exit status, and a default returning a ceiling does not (D-25, LANG-08)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every derived role is checked for exactly one Workflow 16 reference"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/admission-protocol-docs.test.ts#VFY-03: Workflow 16 single-source protocol"
        status: pass
    human_judgment: false
  - id: D3
    description: "No live-kit adapter, grant or role-row count is a literal 16 or 17 in the listed tests outside the two two-sided pins"
    requirement: TIER-06
    verification:
      - kind: other
        ref: "grep -cE 'toBe\\(17\\)' install/install.test.ts == 0; grep -cE 'toHaveLength\\((16|17)\\)' scripts/generate-role-adapters.test.ts == 0; grep -cE 'expect\\(ROLE_COUNT\\)\\.toBe\\(17\\)' scripts/kit-model.test.ts == 1"
        status: pass
      - kind: unit
        ref: "install/install.test.ts (455 passed, 1 skipped)"
        status: pass
    human_judgment: false
  - id: D4
    description: "MODEL-01 is measured against the Phase 39 start tree; every adapter is byte-identical to it, the records are empty, and the effort rule is two-sided"
    requirement: TIER-06
    verification:
      - kind: unit
        ref: "scripts/adapter-byte-baseline.test.ts (6 cases)"
        status: pass
    human_judgment: true
    rationale: "The D-3 re-pin is a recorded decision (prohibition: MUST NOT loosen the baseline); whether the replacement cases are at least as strong as the retired ones is a reviewer judgment, argued in the file header and under Deviations"

duration: 17min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 03: Derived Role Ceilings, Derived Test Counts and the MODEL-01 Re-pin Summary

**The per-role byte ceilings are now one keyed table, and `guard_role_size` checks its key set against `listRoles()` in both directions. Every test that typed today's 16 or 17 for the live kit now asks the derivation. The MODEL-01 baseline is re-pinned, by recorded decision D-3, to commit 8a530552, the commit Phase 39 started from, with empty ADDED and REMOVED records for plans 39-05, 39-06 and 39-07 to fill in.**

## Performance

- **Duration:** about 17 min
- **Started:** 2026-10-29T17:33Z
- **Completed:** 2026-10-29T17:50Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `ROLE_CEILINGS` replaces the `roleCeiling` switch. All 17 measured values and their comments were carried over unchanged. Before measuring anything, `guard_role_size` now reports `ROLE_CEILINGS has no key for role X` for each missing role and `ROLE_CEILINGS key X names no role file` for each stale key, both sorted. When the two sets match it passes with `ROLE_CEILINGS key set == 17 derived role file(s), both ways`.
- `admission-protocol-docs.test.ts` builds its Workflow 16 cases from `listRoles()`, and a floor case checks the derived list has `ROLE_COUNT` entries.
- 35 live-kit count literals now come from the derivation, across `install.test.ts`, `generate-role-adapters.test.ts`, `frontmatter.test.ts`, `generate-catalog.test.ts` and `kit-model.test.ts`. The two real pins are untouched: `ROLE_COUNT` 17 and `SPAWN_GRANT_SCAN_COUNT` 33.
- `adapter-byte-baseline.test.ts` is re-pinned to `8a530552d6c0e815d2959d16a8c06d99cc2d612b`. It now has six cases:
  - the pin is a full 40-character name and an ancestor of HEAD
  - every record names a real change
  - the added and removed sets each equal their record
  - the adapter count is checked against two sources
  - every adapter in both trees is byte-identical, and the coordinator's grant is checked against two sources
  - the effort rule is checked both ways

## Task Commits

1. **Task 1: per-role ceilings follow the role corpus (tracer)**: `49d9b94f` (feat)
2. **Task 2: live-kit count literals ask the derivation**: `6c85895f` (test)
3. **Task 3: re-pin the MODEL-01 baseline (D-3)**: `96ff7197` (test)

## Files Created/Modified

- `scripts/check-foundation-guards.ts` / `.js`: `ROLE_CEILINGS`, `NO_CEILING`, and the two-way key check in `guardRoleSize`. The inventory row 14 and kit-count message now say `ROLE_CEILINGS`.
- `scripts/check-foundation-guards.test.ts`: three new key-set cases. The D-19 probe case now reads only the `guard_role_size` section. The D-25 falsifier now softens `NO_CEILING`.
- `scripts/admission-protocol-docs.test.ts`: role list from `listRoles()`, plus the `ROLE_COUNT` floor case.
- `scripts/kit-model.test.ts`: the per-part breakdown uses `listAgentAdapterNames().length`. The 39-01 "no levels" count is now `ROLE_COUNT`.
- `scripts/generate-role-adapters.test.ts`: six sites now use `listAgentAdapterNames(ROOT).length`, that length minus one, or `ROLE_COUNT`.
- `scripts/frontmatter.test.ts`: both grant counts are `listAgentAdapterNames(root).length - 1`.
- `scripts/generate-catalog.test.ts`: the role-row count is `ROLE_COUNT`.
- `install/install.test.ts`: a new `LIVE_ADAPTER_COUNT` constant is used at 26 sites.
- `scripts/adapter-byte-baseline.test.ts`: rewritten around the D-3 re-pin.

## Decisions Made

- **Re-pin (D-3):** see the file header. The pin is the tree the pre-Phase-39 generator produced. The second source is the hand-written records. The 6f8411e pin and its three transforms are retired because all three are inside the new tree.
- **Short-listing floor:** the baseline listing's floor moved from `ROLE_COUNT` to `baseline + ADDED - REMOVED == listAgentAdapterNames().length`. `ROLE_COUNT` will exceed the frozen 17 as soon as 39-05 adds a role, so the old floor would have broken as written.
- **`check-banned-claims.test.ts:3321`:** left as it is. Its 16 counts excluded exact paths, not the coordinator grant.
- **No fixture literals kept in `install.test.ts`:** even `SYNTH_ADAPTERS` is derived from the real role corpus, so every one of those counts is a live-kit count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The D-25 fail-closed falsifier patched text that no longer exists**
- **Found during:** Task 1
- **Issue:** The falsifier rewrote `default:\n            return "";` in the compiled guard. That text is gone once the switch is a table, so `scratchGuardFiles` would throw "matched nothing".
- **Fix:** It now patches `const NO_CEILING = "";`. It also checks that the key-set FAIL still fires in the softened build, which shows the two mechanisms are independent.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Commit:** 49d9b94f

**2. [Rule 1 - Bug] The D-19 probe case read the first line naming the probe**
- **Found during:** Task 1
- **Issue:** The new key-set finding now comes before the per-file line, so "first line naming the probe" no longer meant the size verdict.
- **Fix:** The case now reads only the `guard_role_size` section, matches the per-file line by its repo-relative path, and also checks the key-set line.
- **Files modified:** scripts/check-foundation-guards.test.ts
- **Commit:** 49d9b94f

**3. [Rule 2 - Missing critical] More checks in the re-pinned baseline**
- **Found during:** Task 3
- **Added:**
  - an ancestor-of-HEAD check on the pin
  - a "records are real before admitted" case: no ADDED name already in the baseline, no REMOVED name missing from it, no duplicates, the coordinator never recorded
  - a model-literal check for level records
- **Why:** each record would be unguarded without these. A record that names nothing would pass silently.
- **Commit:** 96ff7197

**4. [Rule 1 - Scope] One count site the plan did not list**
- `kit-model.test.ts`'s 39-01 case "17 names, no levels" pinned `names.length` to a literal 17. It now reads `ROLE_COUNT`, since with no leveled role there is one adapter per role.
- **Commit:** 6c85895f

## Prohibition Check (MUST NOT loosen MODEL-01)

The prohibition is judged here. Every retired assertion has a replacement that is at least as strong:

| Old assertion | Replacement |
| --- | --- |
| The three transforms and their "real before admitted" premises | Retired with their targets, which are now inside the pinned tree. The new byte case admits no transform except the coordinator grant, which is the records' own. |
| Baseline count == `ROLE_COUNT` | Baseline + ADDED − REMOVED == `listAgentAdapterNames().length`, plus working dir == derivation by set |
| Working set == baseline set | Added set == `RECORDED_ADDED` and removed set == `RECORDED_REMOVED`, each with its own message |
| No adapter carries `effort:` | The same check over non-level adapters, plus exactly one matching `effort:` and `model:` line for each level record |

RED was proven by perturbing three adapters on the working tree: one appended byte, one inserted `effort: high` line, and one grant name dropped. The byte case and the effort case both went red. All three files were then restored by path.

## Issues Encountered

None. The pre-existing failures in deferred-items.md (missing phase 27 and 31 files, and the Node 26 `openAsBlobSync` census) are in files this plan neither touches nor runs.

## Known Stubs

None. `RECORDED_ADDED` and `RECORDED_REMOVED` are empty on purpose: at the re-pin, every adapter is byte-identical to the pinned tree. Plans 39-05, 39-06 and 39-07 fill them in.

## Next Phase Readiness

- 39-05 and 39-06 (new roles) each need:
  - one `ROLE_CEILINGS` entry, measured; the guard is red without it
  - one `new-role` record in `RECORDED_ADDED`
  - the moved pins `ROLE_COUNT` and `SPAWN_GRANT_SCAN_COUNT`
- 39-07 (engineer levels) needs:
  - `level` records and the base adapter name in `RECORDED_REMOVED`
  - the level transform in the byte case, as described in the comment block in `adapter-byte-baseline.test.ts`

## Self-Check: PASSED

- FOUND: scripts/check-foundation-guards.ts (`const ROLE_CEILINGS` x1, `function roleCeiling` x0)
- FOUND: scripts/admission-protocol-docs.test.ts (`const ROLE_BASENAMES = [` x0)
- FOUND: scripts/adapter-byte-baseline.test.ts (old pin x1, in the header retirement note; RECORDED_ADDED x12; RECORDED_REMOVED x15)
- FOUND: 49d9b94f, 6c85895f, 96ff7197 (all ancestors of HEAD)
