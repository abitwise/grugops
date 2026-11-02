---
phase: 40-plain-language-role-rewrite
plan: 19
subsystem: testing
tags: [check-role-rules, safety-facts, cr-01, in-01, in-03, d-30-stand-in, gap-closure]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "SAFETY_RULE_FACTS and the role-rule baseline (plan 40-11), deriveAllAt and the WR-05 pin (plan 40-13), rule 6 as left by plan 40-18"
provides:
  - "carriesSafetyFact(text), exported from scripts/check-role-rules.ts as SAFETY_RULE_FACTS.some(r => r.holds(text)), holding on raw sentences and on voice-model normalized clauses"
  - "wip-limit, claim-cap and self-sign entries that accept the raw and the normalized spelling, fact-neutral at HEAD and at PHASE_40_START_COMMIT"
  - "check() compares the baseline bytes with a fresh git derivation when the objects are reachable (IN-01 PASS / FAIL), NOTE line otherwise"
  - "deriveAllAt lists with ls-tree -z and reads with git show <sha>:./<path> (IN-03)"
  - "sectionLines exported (no behavior change) so tests read sections the derivation's way"
affects: [40-21, phase-40-verification]

actuals:
  tokens: 5900
  tasks: 3
  commits: 6
plan_head_before: 4c6141f5f6ba88cdf8d970201b033d5c67484674
plan_head_after: c9e9187b747a91053675fd24bc1c53e7364d3e57

tech-stack:
  added: []
  patterns:
    - "A predicate defined as the table's own some(), so no consumer holds a copy of a fact pattern"
    - "A committed derived artifact checked against a fresh derivation from git objects whenever they are reachable, with a NOTE line when they are not"

key-files:
  created: []
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts

key-decisions:
  - "sectionLines is exported so the parity case locates sections with the existing helper, as the plan requires; it was added in the RED commit because the case cannot run without it, and it changes no behavior"
  - "When the IN-01 comparison differs, losses are judged against the git-derived facts (baseline.files replaced by the fresh derivation), so a fact dropped from the JSON together with its rule is still named as a loss"
  - "The IN-01 FAIL line names the differing files, then any differing top-level key; when neither differs it says `formatting only`"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "carriesSafetyFact is exported from the one table and holds on the raw and the normalized form; no fact pattern exists outside SAFETY_RULE_FACTS"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#CR-01 round 2: one safety predicate sees the gate's clauses > carriesSafetyFact holds on a merge ban and not on an ordinary instruction, raw or normalized"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#CR-01 round 2: one safety predicate sees the gate's clauses > every SAFETY_RULE_FACTS entry holds on its first live role sentence and on that sentence normalized"
        status: pass
      - kind: command
        ref: "node -e acceptance check (carriesSafetyFact on the merge ban, claim cap, wip limit and self sign clauses; false on `give one next action not menu`) exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every derived safety fact is visible on a segmentClauses clause of the same lines, 20 of 20 files, at HEAD and at PHASE_40_START_COMMIT, with the baseline and every fact unchanged"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#CR-01 round 2 > parity at HEAD: every derived safety fact is visible on a gate clause of the same lines"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#CR-01 round 2 > parity at PHASE_40_START_COMMIT: every derived safety fact is visible on a gate clause of the same lines"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#CR-01 round 2 > the baseline did not move: a fresh git derivation still serializes to the committed bytes"
        status: pass
      - kind: command
        ref: "git diff --quiet HEAD -- docs/audit/40-role-rule-inventory.json scripts/voice-model.ts scripts/voice-model.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "IN-01: the CLI gate refuses a baseline JSON that git disproves, names a laundered loss, turns check-diff-disposition red through the stand-in, and prints a NOTE when git is not reachable"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#IN-01: the CLI gate checks the baseline contents against git (5 cases)"
        status: pass
      - kind: command
        ref: "node scripts/check-role-rules.js prints the IN-01 PASS line and exits 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-03: deriveAllAt from a kit in a subdirectory with a non-ASCII file name equals deriveAll on that working tree"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#IN-03: deriveAllAt from a subdirectory and a non-ASCII path"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-11-02
---

# Phase 40 Plan 19: One safety predicate, a git-checked baseline and a root-consistent git reader Summary

**carriesSafetyFact, the SAFETY_RULE_FACTS table's own some(), now holds on the gate's normalized clauses (three entries widened, no fact moved); the CLI gate compares the baseline JSON with a fresh git derivation (IN-01); deriveAllAt lists and reads from one root, NUL-separated (IN-03).**

## Performance

- **Duration:** 30 min
- **Started:** 2026-11-02T22:00:22Z
- **Completed:** 2026-11-02T22:30:19Z
- **Tasks:** 3
- **Files modified:** 3 (plus deferred-items.md)

## Accomplishments

- `carriesSafetyFact(text)` is exported and defined as `SAFETY_RULE_FACTS.some((r) => r.holds(text))`. `wip-limit` now tests `/\bqueue[._ ]wip[_ ]limit\b/i`, `claim-cap` `/\bqueue[._ ]claim[_ ]cap\b/i`, and `self-sign` `/\bself[- ]sign/i`. No other entry changed. Plan 40-21 imports the predicate into the D-30 stand-in.
- Parity holds for 20 of 20 corpus files at HEAD and at PHASE_40_START_COMMIT: every safety fact the derivation finds is also found on a `segmentClauses` clause of the same lines.
- `check()` compares the committed baseline bytes with `serializeBaseline` of a fresh `deriveAllAt` whenever `git cat-file -e <sha>^{commit}` succeeds. A difference is a FAIL naming IN-01 and the files that differ, and losses are then judged against the facts derived from git. When the objects are unreachable, check() prints a NOTE line and reads the baseline as before.
- `deriveAllAt` lists files with `ls-tree -r -z --name-only` and reads each one with `git show <sha>:./<path>`.

## Task Commits

1. **Task 1 (tracer): carriesSafetyFact and parity**: `d20d85ce` (test, RED), `36b04830` (feat, GREEN). Tracer gate: verify re-run end to end, passed, expanded.
2. **Task 2: IN-01**: `2355162e` (test, RED), `022ebcc4` (feat, GREEN)
3. **Task 3: IN-03**: `2befb2ae` (test, RED), `c9e9187b` (fix, GREEN)

## TDD evidence

**Task 1 RED** (`npx vitest run scripts/check-role-rules.test.ts -t "CR-01 round 2"`, exit 1, 4 failed and 1 passed). This is the RED the plan measured:
- `carriesSafetyFact`: `expected 'undefined' to be 'function'` (the export did not exist yet)
- per-entry normalized sentence: `wip-limit: "never run more role agents at once than queue wip limit"`, `claim-cap: "honor queue claim cap per delegation"`, `self-sign: "never self sign"`
- parity at HEAD and at PHASE_40_START_COMMIT: `orchestrator.md: claim-cap`, `orchestrator.md: wip-limit`, `uat-planner.md: self-sign`
- the baseline-bytes case passed (it guards the GREEN edit, so it was meant to pass at RED)
Assessment: each target failed on its own assertion, for the planned reason. Nothing failed in setup or import.

**Task 2 RED** (`-t "IN-01"`, exit 1, 5 failed). Untouched clone: 0 IN-01 lines, expected 1. JSON-only tamper: exit 0. JSON tamper plus merge-ban deletion: exit 0. check-diff-disposition on that tampered clone: exit 0. No-git mirror: 0 IN-01 NOTE lines. The three tamper cases exiting 0 are the IN-01 finding itself. Assessment: valid RED, every case failed on its first planned assertion.

**Task 3 RED** (`-t "IN-03"`, exit 1, 1 failed): `git show <sha>:agent-factory/checklists/.gitkeep failed (fatal: path 'kit/agent-factory/checklists/.gitkeep' exists, but not 'agent-factory/checklists/.gitkeep')`. Assessment: the call under test threw, as the plan predicted. The test setup itself succeeded.

REFACTOR: none needed. In the GREEN commit, Task 1 replaced the namespace accessor the RED file used for the missing export with a named import.

## Fact neutrality (`facts before / after`)

`node scripts/check-role-rules.js` was captured before any edit and again after each task. Every `facts before / after` line was identical every time. Before and after:

```
_role-switch-protocol.md: facts before 6 / after 6
agents-md-scribe.md: facts before 8 / after 12
architect-design.md: facts before 9 / after 13 (floor 8 after 1 intended D-13 removal(s))
ba-pm.md: facts before 10 / after 14 (floor 9 after 1 intended D-13 removal(s))
brownfield-mapper.md: facts before 7 / after 11 (floor 6 after 1 intended D-13 removal(s))
compliance-officer.md: facts before 11 / after 13 (floor 10 after 1 intended D-13 removal(s))
designer.md: facts before 10 / after 13 (floor 9 after 1 intended D-13 removal(s))
factory-coach.md: facts before 8 / after 12 (floor 7 after 1 intended D-13 removal(s))
frontend-ui.md: facts before 11 / after 16
greenfield-mapper.md: facts before 8 / after 13
incident-responder.md: facts before 9 / after 12 (floor 8 after 1 intended D-13 removal(s))
installer.md: facts before 10 / after 15
orchestrator.md: facts before 17 / after 26
qe-e2e.md: facts before 9 / after 12
release-manager.md: facts before 14 / after 15 (floor 13 after 1 intended D-13 removal(s))
security-nfr.md: facts before 11 / after 14 (floor 10 after 1 intended D-13 removal(s))
software-engineer.md: facts before 21 / after 24
system-analyst.md: facts before 9 / after 12 (floor 8 after 1 intended D-13 removal(s))
tech-lead.md: facts before 12 / after 18
uat-planner.md: facts before 13 / after 16 (floor 12 after 1 intended D-13 removal(s))
```

A stricter check also passed. The full fact sets of `deriveAll(ROOT)` and `deriveAllAt(ROOT, PHASE_40_START_COMMIT)` were serialized before the edit and after Tasks 1 and 3, and they were byte-identical. `docs/audit/40-role-rule-inventory.json` is unchanged.

## IN-01 on the live tree

```
  PASS  docs/audit/40-role-rule-inventory.json equals a fresh derivation out of git objects at e8d7802 (IN-01)
```

On a tampered clone (no-merge dropped from the JSON and the merge ban deleted):

```
  FAIL  docs/audit/40-role-rule-inventory.json differs from a fresh derivation out of git objects at e8d7802ccf8ebf428a47703f6001327325e3aea3: orchestrator.md — losses below are judged against the git-derived facts (IN-01)
  FAIL  role-rule inventory: 1 finding(s) over 20 elements
        - orchestrator.md: lost fact no-merge
```

## Test counts

- `scripts/check-role-rules.test.ts`: 82 passed (76 before this plan: 71 + 5 CR-01 round 2 after Task 1, 81 after Task 2, 82 after Task 3)
- `-t "CR-01 round 2"`: 5 passed; `-t "IN-01"`: 5 passed; `-t "IN-03"`: 1 passed
- Plan verification: `npx vitest run scripts/check-role-rules.test.ts scripts/check-diff-disposition.test.ts` gave 206 passed. `npm run build`, `npm run typecheck`, `node scripts/check-role-rules.js`, `node scripts/check-diff-disposition.js`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and `npm run freshness` (89 committed .js fresh) all exited 0. The inventory and voice-model diff check exited 0.
- Full suite (`npx vitest run`, 1,368 s): 25 failed, 10,878 passed, 2 skipped. 21 of the failures are the recorded set in deferred-items.md (same 7 files). The other 4 are in `scripts/e2e/uat-live.test.ts`: the gated live capture refuses an unpushed HEAD (`GO-READINESS: not-ready — pushed sha ... 14 commit(s) ahead of origin/main`). That is environmental, and the earlier runs excluded the e2e lane. It is recorded in deferred-items.md under "From plan 40-19".

## Decisions Made

See `key-decisions` in the frontmatter. The plan's prohibitions held:
- No second copy of any fact pattern exists. `grep` finds `SAFETY_RULE_FACTS.some` once, and the tests call each entry's `holds`.
- The baseline, the SAFETY_RULE_FACTS entry count (12) and every derived fact are unchanged.
- The unreachable path prints its NOTE line, and a test pins it.

## Deviations from Plan

**1. [Rule 3 - Blocking] `sectionLines` exported in the RED commit**
- **Found during:** Task 1
- **Issue:** The plan requires the parity case to locate sections with the existing `sectionLines` helper, but that helper was module-private.
- **Fix:** Added the `export` keyword, with no behavior change, in `d20d85ce` alongside the RED tests, so the RED failed on assertions and not on a missing import.
- **Files modified:** scripts/check-role-rules.ts, scripts/check-role-rules.js
- **Commit:** d20d85ce

**Total deviations:** 1 auto-fixed (blocking). **Impact:** the module gained one export. Behavior is unchanged.

## Issues Encountered

None beyond the environmental e2e failures above.

## Next Phase Readiness

Ready for 40-20, then 40-21. 40-21 imports `carriesSafetyFact` into check-diff-disposition, adds check-role-rules.js to the admission hook's decider closure and regenerates the manifest. This plan regenerated nothing.

## Self-Check: PASSED

- FOUND: scripts/check-role-rules.ts, scripts/check-role-rules.js, scripts/check-role-rules.test.ts
- FOUND commits: d20d85ce, 36b04830, 2355162e, 022ebcc4, 2befb2ae, c9e9187b (all ancestors of HEAD)
- All acceptance criteria re-run and passed: carriesSafetyFact count 2; node acceptance exit 0; CR-01 round 2 5 passed; IN-01 count 8 and 5 passed; `equals a fresh derivation` count 1; `"-z"` count 1; `:./${` count 1; IN-03 1 passed; baseline and voice-model diff clean
