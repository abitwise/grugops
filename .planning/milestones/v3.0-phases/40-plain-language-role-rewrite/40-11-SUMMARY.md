---
phase: 40-plain-language-role-rewrite
plan: 11
subsystem: testing
tags: [role-rule-inventory, d-30-stand-in, safety-rules, git-objects, vitest, typescript]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "plan 40-01's derived role-rule inventory (check-role-rules) and the D-30 stand-in key in 00-base.md"
provides:
  - "SAFETY_RULE_FACTS: twelve safety facts derived from the sentences of `## Hard limits` + `## Stop when`"
  - "PHASE_40_START_COMMIT, DERIVATION_PATHS, deriveAllAt(root, sha): a baseline writer that reads only git objects at the start commit"
  - "FACT_KINDS: the closed D-28 list of 26 fact kinds, held by a kind-floor test"
  - "check() refuses a baseline whose source_commit is not PHASE_40_START_COMMIT (WR-05)"
  - "Re-derived baseline docs/audit/40-role-rule-inventory.json: 213 facts (195 + 18), source_commit unchanged"
affects: [40-12, 41, 42, guard_diff_disposition, check-role-rules]

actuals:
  tokens: 10621
  tasks: 2
  commits: 2
plan_head_before: e85da83bd3d4fc22a3c9016c095d517f80415f72
plan_head_after: dc9faa6c406f8c1aa14227db823a03e203a45cc6

tech-stack:
  added: []
  patterns:
    - "Safety rules as derived sentence facts over two adjacent role sections, so a rule may move between them but not out"
    - "Baseline writer materializes git blobs at a pinned commit into a temp dir; the working tree is never read"
    - "Large gate output captured through a file descriptor, not a pipe"

key-files:
  created: []
  modified:
    - scripts/check-role-rules.ts
    - scripts/check-role-rules.js
    - scripts/check-role-rules.test.ts
    - docs/audit/40-role-rule-inventory.json

key-decisions:
  - "CR-01 remedy: add derived safety facts to the inventory (honoring D-30 as written) rather than restoring the positional `## Hard limits` freeze for the stand-in"
  - "The inventory is pinned to PHASE_40_START_COMMIT by a constant, not by reading 00-base.md, so a later base move cannot re-point it (WR-05)"
  - "Clone-based gate tests capture output through a file: check-diff-disposition's red run prints ~897 KB and a pipe reader received only ~328 KB"

patterns-established:
  - "sharedClone(prefix): a git clone --shared of ROOT at HEAD with the working-tree script and baseline copied over, for end-to-end gate cases that need the real history"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "Deleting the Orchestrator's merge ban turns check-role-rules red (mirror) and check-diff-disposition red through the D-30 stand-in (shared clone)"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#CR-01: the safety sentences are guarded (gap 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Twelve safety facts derived; baseline re-derived from git objects at e8d7802 with exactly the 18 planned additions, 213 facts, no earlier fact changed"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "Task 1 acceptance node script against commit 0b7c8686 (exit 0); fact total 213"
        status: pass
      - kind: unit
        ref: "scripts/check-role-rules.test.ts#the committed baseline equals a fresh derivation at its recorded source_commit, read out of git"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every safety family red on deletion, the adjacency pair, and the empty-role control"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#CR-01: every safety family is red on deletion"
        status: pass
    human_judgment: false
  - id: D4
    description: "WR-05: the writer cannot launder a loss, refuses outside git with a named FAIL, check refuses a foreign source_commit, FACT_KINDS kind floor"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-role-rules.test.ts#WR-05: the baseline is pinned to the Phase 40 start commit"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-01
status: complete
---

# Phase 40 Plan 11: Safety-rule facts in the role-rule inventory Summary

**The D-30 stand-in now sees the merge, deploy, named-human, installer, coordinator and sign-off rules as twelve derived inventory facts. The baseline is re-derived only from git objects at the Phase 40 start commit, so deleting any of those sentences turns check-role-rules red, and through the stand-in turns check-diff-disposition red.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-01T21:11:23Z
- **Completed:** 2026-11-01T21:19:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `SAFETY_RULE_FACTS` (no-merge, no-deploy, human-merge-deploy, named-human, production-human, no-overwrite, dry-run, no-relay, wip-limit, claim-cap, only-spawner, self-sign). These are read from the sentences of the unfenced `## Hard limits` lines followed by the `## Stop when` lines.
- `deriveAllAt(root, sha)` and a rewritten `--write-baseline`. The writer derives only from git objects at `PHASE_40_START_COMMIT`, never from the working tree, and never calls `git rev-parse HEAD`. Every failure is one named FAIL.
- The re-derived baseline adds exactly the 18 planned facts in 9 files (213 total). It keeps every earlier fact, every stopWhenItems value and `source_commit` e8d7802.
- `check()` refuses a foreign `source_commit`. `FACT_KINDS` holds the closed list of 26 kinds, and a kind-floor test enforces it.
- 13 new permanent tests; check-role-rules.test.ts goes from 35 to 48 passing.

## Task Commits

1. **Task 1: tracer, the merge ban becomes a fact, baseline re-derived from git objects, both gates red on deletion** - `e47f1a40` (feat)
2. **Task 2: WR-05 and the other safety families** - `dc9faa6c` (feat)

## RED evidence

- **Task 1, CR-01 case A (mirror), before any source edit:** `expected +0 to be 1`. The gate exited 0 with the merge ban deleted, and `role-rule inventory: 0 findings` was printed. Correct reason: no `no-merge` fact existed.
- **Task 1, CR-01 case B (shared clone), before any source edit:** the green control passed (exit 0, `1129 role clause(s) admitted by the role-rule inventory stand-in (D-30)`). With the sentence deleted the gate still exited 0, `expected +0 to be 1`, and `PASS 1129 role clause(s) admitted ... exited 0`. This is the verifier's reproduction, made permanent.
- **Task 2, before the source edit:** the foreign `source_commit` case exited 0 (`expected +0 to be 1`), and the kind floor failed with `FACT_KINDS is exported: expected undefined to be defined`. The writer-outside-git, two-HEAD ordering and byte-equality cases already passed, because Task 1 step 6 (planned there) had already delivered the git-object writer. The family and adjacency cases passed after Task 1, as the plan expected.

## The 18 added facts (Task 1 acceptance script output, exit 0)

```
compliance-officer.md:named-human,designer.md:human-merge-deploy,incident-responder.md:production-human,installer.md:dry-run,installer.md:no-overwrite,orchestrator.md:claim-cap,orchestrator.md:no-deploy,orchestrator.md:no-merge,orchestrator.md:no-relay,orchestrator.md:only-spawner,orchestrator.md:wip-limit,release-manager.md:named-human,release-manager.md:no-deploy,release-manager.md:production-human,tech-lead.md:human-merge-deploy,tech-lead.md:named-human,uat-planner.md:named-human,uat-planner.md:self-sign
```

## Live-tree stand-in line (check-diff-disposition)

```
  PASS  1130 role clause(s) admitted by the role-rule inventory stand-in (D-30) — `node scripts/check-role-rules.js --check` exited 0
```

## Files Created/Modified
- `scripts/check-role-rules.ts` / `.js`: `PHASE_40_START_COMMIT`, `DERIVATION_PATHS`, `SAFETY_RULE_FACTS`, `FACT_KINDS`, `deriveAllAt`, the git-object writer, the foreign-baseline refusal, and the updated header (THE FACTS, MODES).
- `scripts/check-role-rules.test.ts`: `sharedClone`, `runIn`, the CR-01 describe, the family/adjacency/empty describe, the WR-05 describe, and the refactored equality case (deriveAllAt plus serializeBaseline byte equality, source_commit pinned).
- `docs/audit/40-role-rule-inventory.json`: re-derived by the writer (not hand-edited), with 18 additions.

## Decisions Made
- I followed the plan's recorded design decision: the inventory gains safety facts, so D-30 holds as ratified. The positional freeze was not restored.
- Clone-based tests capture child output through a file descriptor (see deviation 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The clone case's output capture moved from a pipe to a file**
- **Found during:** Task 1 (GREEN run of CR-01 case B)
- **Issue:** On the red run, `check-diff-disposition.js` prints about 897 KB (1096 findings) and exits. `spawnSync` with a pipe received only about 328 KB, so the `agent-factory/roles/orchestrator.md` finding was cut off and the assertion failed even though the gate was correctly red (exit 1, `role-rule inventory stand-in failed` present).
- **Fix:** `runIn` sends the child's stdout and stderr to a file through `openSync` and reads the file afterwards. `check-diff-disposition.ts` was not touched, because plan 40-12 owns it.
- **Files modified:** scripts/check-role-rules.test.ts
- **Verification:** case B passes. A manual reproduction with redirection to a file showed 99 `roles/orchestrator.md` lines.
- **Committed in:** e47f1a40

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** test harness only; no scope change.

## Issues Encountered
- Pre-existing behavior (recorded for plan 40-12, which owns the file): `check-diff-disposition.js` loses most of its output when stdout is a pipe on a large red run. The verdict and exit code are correct, but a CI log reader could miss findings. This plan did not fix it.
- The plan-level vitest run shows 5 failures, all in `scripts/uat-gate-exit-contract.test.ts`. This matches the recorded pre-existing set.

## Known residual (from the plan, for the human)
While the D-30 stand-in holds, a `## Hard limits` or `## Stop when` sentence that carries none of the 26 fact kinds can still be reworded with every gate green. Plan 40-12's freeze addresses this.

## User Setup Required
None. No external service configuration required.

## Next Phase Readiness
- Ready for 40-12, which adds the `## Stop when` freeze and pins the stand-in script. Together the two plans close gap 1.

---
*Phase: 40-plain-language-role-rewrite*
*Completed: 2026-11-01*

## Self-Check: PASSED
