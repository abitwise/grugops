---
phase: "39"
plan: "04"
subsystem: tooling
tags: [canonical-frontmatter, role-schema, skills-key, check-foundation-guards, tier-07, vitest]

requires:
  - phase: 39
    provides: "39-01: listRoleDirEntries / listAgentAdapterNames derivations; 39-03: derived live-kit counts (no literal 16/17)"
provides:
  - "canonical-frontmatter: ROLE_SCHEMA (capabilities, kind, levels, skills, tier), admitRole(text) through the one admitAgainst grammar, roleSkillsOf(doc) for the one accepted skills form"
  - "check-foundation-guards: guard_role_frontmatter admits every roles-directory .md file via admitRole + roleSkillsOf"
  - "scripts/fixtures/role-skills.md: the measured skills example (no shipped role declares one, D-29)"
  - "Proof cases: every malformed skills declaration refused by name; CANONICAL_SCHEMA, admit() and the generator pinned unchanged (D-28)"
affects: [39-05, 39-06, 39-07, phase-42-skills-doctor, phase-43-docs]

actuals:
  tokens: 6625
  tasks: 2
  commits: 2
plan_head_before: da442a4c277a5b8bc092c85131925b5e83a1e06f
plan_head_after: 66d50d979a716085f26638a7e69bb01fbbb6d331

tech-stack:
  added: []
  patterns:
    - "A second key set goes through the same admission grammar by a separately named entry point (admitRole), so the adapter safety authority (CANONICAL_SCHEMA, admit) never moves"
    - "A value's shape beyond the grammar is decided by a projection over the admitted image (roleSkillsOf), outside the ADMISSION-CORE markers, never by re-reading bytes"

key-files:
  created:
    - scripts/fixtures/role-skills.md
  modified:
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
    - scripts/canonical-frontmatter.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - scripts/generate-role-adapters.test.ts

key-decisions:
  - "Mechanism: a separate ROLE_SCHEMA admitted by admitRole() rather than widening CANONICAL_SCHEMA; CANONICAL_SCHEMA and admit() are byte-unchanged, so an adapter skills line is still refused unknown-key (D-28)"
  - "roleSkillsOf splits on a single space, so two adjacent spaces make an empty token that is refused as not kebab; the one accepted form is one line of single-space-separated lower-case kebab names"
  - "admitRole sits inside ADMISSION-CORE next to admit(); roleSkillsOf sits outside it, because the core's source case pins the literal `ok: false` to exactly one occurrence"
  - "Plugin-namespaced names (`plugin:skill`) stay refused by the grammar (no `:` in the alphabet); widening is left to Phase 42"

patterns-established:
  - "Guard over the roles directory reads listRoleDirEntries(ROOT) filtered to .md, the same set as the raw-membership refusal, and fails closed on an empty scan"

requirements-completed: [TIER-07]

coverage:
  - id: D1
    description: "ROLE_SCHEMA, admitRole and roleSkillsOf exist; the fixture is admitted and its two skills parse in declaration order"
    requirement: TIER-07
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#skills: the fixture is admitted by admitRole and roleSkillsOf returns its two names in order"
        status: pass
      - kind: other
        ref: "node -e admitRole(scripts/fixtures/role-skills.md) -> roleSkillsOf == ['ui-ux-pro-max','frontend-design'] (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every live roles-directory file is admitted under ROLE_SCHEMA; none declares a skills value; the key union over the corpus plus the fixture equals ROLE_SCHEMA both ways"
    requirement: TIER-07
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#skills: every live roles-directory file is admitted by admitRole, and none declares a skills value (D-29)"
        status: pass
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#skills: the role key union over the live roles-directory corpus plus the fixture equals ROLE_SCHEMA, in both directions"
        status: pass
    human_judgment: false
  - id: D3
    description: "guard_role_frontmatter admits all roles-directory files on the live tree and is red naming the file and refusal code for a planted flow-list skills line"
    requirement: TIER-07
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js (PASS 17 roles-directory file(s) admitted under ROLE_SCHEMA; ALL CHECKS PASSED)"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#guard_role_frontmatter: the unplanted mirror is green, and a roles-directory file whose skills is a flow list is red naming that file (TIER-07)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every malformed skills declaration is refused by name: flow list, namespaced name, bare key, quoted value (grammar codes); repeat, non-kebab, empty token, block sequence (roleSkillsOf reasons naming the accepted form)"
    requirement: TIER-07
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts -t skills (14 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The adapter authority did not move: CANONICAL_SCHEMA is still the eleven keys, admit() refuses an adapter skills line as unknown-key, and the generator writes no skills line for a role that declares one"
    requirement: TIER-07
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#skills: CANONICAL_SCHEMA is still the eleven adapter keys, and admit() refuses an adapter carrying a skills line as unknown-key (D-28)"
        status: pass
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#a scratch software-engineer.md declaring skills generates, and no adapter carries a skills line"
        status: pass
      - kind: other
        ref: "grep -c 'skills:' .claude/agents/*.md | grep -vc ':0$' == 0"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-29
status: complete
---

# Phase 39 Plan 04: The Role `skills:` Key Summary

**A role can now declare `skills:` in its frontmatter. The canonical grammar admits it under a new `ROLE_SCHEMA` through `admitRole()`, and `roleSkillsOf()` reads it as one line of space-separated lower-case kebab names. A new guard, `guard_role_frontmatter`, admits every roles-directory file. `CANONICAL_SCHEMA` and `admit()` are byte-unchanged, so an adapter with a `skills:` line is still refused `unknown-key`, and the generator never writes one.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-10-29T17:54:11Z
- **Completed:** 2026-10-29T18:06:46Z
- **Tasks:** 2
- **Files modified:** 8 (1 created)

## Accomplishments

- **`ROLE_SCHEMA`** holds `capabilities`, `kind`, `levels`, `skills` and `tier`, sorted and frozen. Its header records:
  - D-28: why `CANONICAL_SCHEMA` does not gain `skills`.
  - Why the list form is space-separated kebab tokens: the grammar refuses flow collections and the `:` byte.
  - That plugin-namespaced names are a Phase 42 decision.
- **`admitRole(text)`** calls the one `admitAgainst` with the module's own sigil table and alphabet. Like `admit()`, it takes no option that could widen the grammar.
- **`roleSkillsOf(doc)`** returns the declared names in order:
  - No `skills` key gives `[]`.
  - A block sequence, a quoted scalar, a token that is not lower-case kebab (including the empty token from two adjacent spaces) and a repeated name are each refused. Every refusal reason names the one accepted form.
- **`guard_role_frontmatter`** runs right after `guard_role_size`. It admits each `.md` entry from `listRoleDirEntries(ROOT)` and fails naming the file and the refusal code (or the skills reason). It also fails on an unreadable file and on an empty scan. On the live tree it prints `PASS 17 roles-directory file(s) admitted under ROLE_SCHEMA`.
- **`scripts/fixtures/role-skills.md`** declares `levels: junior mid senior` and `skills: ui-ux-pro-max frontend-design`. It is the only place the two new keys appear, because no shipped role declares them yet (D-29).
- The existing `CANONICAL_SCHEMA` key-union case still checks both directions. Its configured-generator premise now counts `listAgentAdapterNames().length` instead of `ROLE_COUNT`.

## Task Commits

1. **Task 1 (tracer): role frontmatter admitted under ROLE_SCHEMA, skills parsed, guard green on the live tree**: `5e09edf3` (feat)
2. **Task 2 (tdd): the refusals and the proof the adapter authority did not move**: `66d50d97` (test)

## Files Created/Modified

- `scripts/canonical-frontmatter.ts` / `.js`: `ROLE_SCHEMA`, `admitRole`, `RoleSkills`, `roleSkillsOf`.
- `scripts/check-foundation-guards.ts` / `.js`: imports `admitRole`, `roleSkillsOf` and `listRoleDirEntries`. Adds `guardRoleFrontmatter` and its header inventory row, and calls it after `guardRoleSize()`.
- `scripts/fixtures/role-skills.md`: the TIER-07 fixture.
- `scripts/canonical-frontmatter.test.ts`: a new TIER-07 describe block with 14 cases, all matching `-t "skills"`, plus the premise change in the configured-generator case.
- `scripts/check-foundation-guards.test.ts`: the `guard_role_frontmatter` control and plant case.
- `scripts/generate-role-adapters.test.ts`: the case where a role declares skills and no adapter gets a `skills:` line.

## TDD Gate Compliance (Task 2)

Task 1 was a tracer and shipped the implementation together with its first tests. Task 2 could only add tests (its `<files>` lists test files alone), so it has a `test(39-04)` commit and no `feat` commit. The plan asked for each case to be RED against a scratch build. I proved that by changing one compiled file at a time on the working tree, running the target case, and restoring the file by path with `git checkout -- <file>`:

| Mutation (compiled `.js`) | Case that went RED | Failing assertion |
| --- | --- | --- |
| `roleSkillsOf` duplicate check disabled | refuses a repeated name | `expected true to be false` (s.ok) |
| `roleSkillsOf` kebab check disabled | refuses a non-kebab name; refuses two adjacent spaces | `expected true to be false` (s.ok), both |
| `roleSkillsOf` block-sequence branch returns ok | refuses a block sequence | `expected true to be false` (s.ok) |
| `CANONICAL_SCHEMA` gains `"skills"` | CANONICAL_SCHEMA eleven keys / admit() unknown-key | `expected [ …(11) ] to deeply equal [ …(10) ]` (12 keys vs 11) |
| `guardRoleFrontmatter();` call removed | guard_role_frontmatter control/plant | `expected [] to have a length of 1 but got +0` |
| generator pushes `skills: frontend-design` | no adapter carries a skills line | `grugops-agents-md-scribe.md must carry no skills line` |

Semantic assessment: each case failed on its own planned assertion, with no load, syntax or fixture fault. My first block-sequence mutation (`if (false)`) failed with a TypeError instead of an assertion, so it did not count. I replaced it with the "returns ok" mutation in the table, which fails on the assertion. With the committed build, all six cases pass.

## Decisions Made

- **Separate key set, not a wider adapter schema.** The research proposed adding `skills` to `CANONICAL_SCHEMA` and narrowing the adapter default. This plan uses `ROLE_SCHEMA` through `admitRole()` instead, so the adapter safety authority does not change and RESEARCH Assumption A4's sign-off is not needed.
- **Where each new function lives.** `admitRole` is inside `ADMISSION-CORE`, next to `admit`. `roleSkillsOf` is outside it, because the core's source case requires the literal `ok: false` to appear exactly once in that region.
- **Splitting on a single space.** The plan said "split on whitespace". `split(" ")` is stricter: a double space produces an empty token, which is refused by name. There is a test for this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Empty-scan floor and unreadable-file finding in the guard**
- **Found during:** Task 1
- **Issue:** As specified, the guard would print a PASS over zero files if the derivation came back empty. It would also throw on a file it could not read instead of naming that file.
- **Fix:** It now fails on an empty scan, naming the vacuity, and fails on a read error, naming the file.
- **Files modified:** scripts/check-foundation-guards.ts / .js
- **Commit:** 5e09edf3

**2. [Rule 2 - Missing critical] Extra refusal cases**
- **Found during:** Task 2
- **Added:**
  - an empty-token case (`skills: a  b`)
  - a quoted-value case for `admitRole` (`quoted-on-plain-only-key`)
  - a direct quoted-scalar case for `roleSkillsOf`, so the projection does not depend on the grammar's quote table
  - an unplanted control role
- **Why:** T-39-08 says quoted shapes are refused by name, and each of these was otherwise untested.
- **Commit:** 66d50d97

### Count note

The plan's must-have says "all 18 role-directory files pass today". `listRoleDirEntries` returns 17 `.md` entries: the 17 roles, with `_role-switch-protocol.md` and `.gitkeep` exempt by name. Nothing in the tree types the number. The guard prints the derived count, and the test floors on `ROLE_COUNT`.

**Total deviations:** 2 auto-fixed (both Rule 2). **Impact:** both close gaps in the fail-closed behaviour and add no new scope.

## Verification

- `npm run build && npm run typecheck`: exit 0.
- `npx vitest run scripts/canonical-frontmatter.test.ts scripts/check-foundation-guards.test.ts scripts/generate-role-adapters.test.ts`: 432 passed / 432.
- `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-nul-bytes.js`: each prints ALL CHECKS PASSED. `npm run freshness` reports 88 committed `.js` files fresh.
- Files that import or spawn the changed modules:
  - `install/install.test.ts`: 455 passed, 1 skipped.
  - 15 further dependent files: 1153 passed, 7 failed. The 7 failures are exactly the pre-existing reds in deferred-items.md (`context-io-writer-set` 2, `uat-gate-exit-contract` 5).
  - The tracked-markdown scanners: 960 passed, 1 failed. The failure is `canonical-corpus` provenance, which is also pre-existing.
- `git diff da442a4c..HEAD -- scripts/generate-role-adapters.ts scripts/generate-role-adapters.js` is empty: the generator is unchanged.

## Issues Encountered

None.

## Threat Model Check

- **T-39-07 (mitigated):** `CANONICAL_SCHEMA` and `admit()` are unchanged, and the generator neither reads nor writes `skills`. Tests pin all three, and the schema and generator mutations above prove those tests can fail.
- **T-39-08 (mitigated):** only single-space-separated lower-case kebab tokens are accepted. Flow lists, `:`, quoted and block shapes, repeated names, case variants and empty tokens are each refused by name.

## User Setup Required

None.

## Next Phase Readiness

- Phase 42's doctor and Phase 43's docs can read `roleSkillsOf(admitRole(text).value)`, with one grammar and one parser.
- Plans 39-05 to 39-07 add `levels:` to roles. `guard_role_frontmatter` already admits that key, and the key-union case will measure it from the live corpus as soon as a role carries it.

---
*Phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles*
*Completed: 2026-10-29*

## Self-Check: PASSED

- FOUND: scripts/fixtures/role-skills.md, scripts/canonical-frontmatter.ts (ROLE_SCHEMA, admitRole, roleSkillsOf), scripts/check-foundation-guards.ts (guard_role_frontmatter)
- FOUND: 5e09edf3, 66d50d97 (both ancestors of HEAD)
