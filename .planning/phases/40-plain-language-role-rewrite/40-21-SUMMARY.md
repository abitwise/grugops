---
phase: 40-plain-language-role-rewrite
plan: 21
subsystem: audit-gates
tags: [check-diff-disposition, d-30-stand-in, cr-01, safety-facts, hook-manifest, gap-closure]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "carriesSafetyFact exported from scripts/check-role-rules.ts (plan 40-19); the 36 named-human rows in docs/audit/29-style-dispositions/40-20.md (plan 40-20); exact-sentence pins and Workflow 06 rows (plan 40-17); rule 6 and the partition header (plan 40-18)"
provides:
  - "The narrowed D-30 stand-in: a changed role clause that carries a safety fact is never offered to it, on either side, at either admission point; each such finding carries a CR-01 note and the verdict arm prints the held-back count"
  - "Shared-clone and mirror cases under the describe \"CR-01 round 2\" (12 tests)"
  - "DECIDER_MANIFEST regenerated over the grown closure (13 to 15 module hashes); three CLOSURE_BASELINES rows taken from jsImportClosure"
  - "All 12 review findings dispositioned (open: 0); gap round 2 deferred items; the D-30 record notes the narrowing"
affects: [phase-40-verification, phase-41, phase-42]

actuals:
  tokens: 8166
  tasks: 3
  commits: 4
plan_head_before: 7b5a54bc445bd588708e45ae35ccc7f30e1ade25
plan_head_after: 9866949488862ecdf8f5fcc57a372871c48befef

tech-stack:
  added: []
  patterns:
    - "A gate takes its safety predicate by import from the inventory that owns the fact list, never a copy"
    - "Hand-built scratch kits copy every non-scripts module the closure reaches (install/host-tools.js, now install/state-layout.js), each with a dated comment"

key-files:
  created:
    - .planning/phases/40-plain-language-role-rewrite/40-21-SUMMARY.md
  modified:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/board-readonly.test.ts
    - scripts/context-io.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/check-banned-claims.test.ts
    - scripts/compactor.test.ts
    - docs/audit/40-disposition-base-move.md
    - .planning/phases/40-plain-language-role-rewrite/40-REVIEW-DISPOSITION.md
    - .planning/phases/40-plain-language-role-rewrite/deferred-items.md

key-decisions:
  - "The held-back count covers every fact-bearing role clause on both arms, including no-row-arm clauses that already had a row: 62 on the live tree = 41 on the structural arm (exactly the 1120 to 1079 drop in stand-in admissions) + 21 on the no-row arm, all 21 already matched by a row"
  - "The safety check runs on the gate's normalized clause (c.clause); every SAFETY_RULE_FACTS pattern was widened in plan 40-19 to hold on that form, and the Task 2 fixtures assert both raw and normalized forms"
  - "Seven hand-built scratch kits in four test files now copy install/state-layout.js; the plan's 'no copy goes short' premise was measured wrong (Rule 3 deviation)"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "A safety sentence reworded to reverse its rule (the verifier's merge-ban reword) turns check-diff-disposition red on a shared clone of HEAD, while the stand-in itself exits 0 and check-role-rules exits 0"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts#CR-01 round 2: a reworded safety sentence owes a row (human decision 2026-11-02) > clone B: the verifier's merge-ban reword is red, naming orchestrator.md and the safety fact, while the stand-in itself exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ordinary role prose is still admitted by the D-30 stand-in (clone A unplanted, clone C prose reword, mirror control)"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts#CR-01 round 2 > clone A, clone C, and the mirror control case"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both sides and both arms pinned on mirrors: removed-side and added-side frozen rewords and a fact-bearing sentence under `## Notes` are red with the CR-01 note and green with a matching row"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "npx vitest run scripts/check-diff-disposition.test.ts -t \"CR-01 round 2\" (12 passed); whole file 136 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "The live gate stays green with the safety count line; the rows in 40-20.md satisfy every held-back clause"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js exit 0: 62 held back, 1079 admitted, 0 findings over 24/24 elements"
        status: pass
    human_judgment: false
  - id: D5
    description: "Hook manifest and closure baselines agree with the new import; every freshness gate is green"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "npm run freshness && freshness:hook-manifest && freshness:guarantees && freshness:context && freshness:queue && freshness:adapters && freshness:catalog all exit 0; board-readonly, floor-invariance, nonblocking-reader-parity, admission-guard, freshness tests pass"
        status: pass
    human_judgment: false
  - id: D6
    description: "Review dispositions recorded with proof (open: 0, total: 12), deferred items and the D-30 record written"
    requirement: PLAIN-03
    verification:
      - kind: other
        ref: "Task 3 verify block: node one-liner exit 0; grep 'From gap round 2' = 1; head -n 133 sha256 457e9fd57027975a"
        status: pass
    human_judgment: true
    rationale: "Whether each Source cell is an adequate proof for its finding is a reviewer's judgment"

duration: 41min
completed: 2026-11-03
---

# Phase 40 Plan 21: The D-30 stand-in no longer admits a safety sentence Summary

**check-diff-disposition imports carriesSafetyFact from check-role-rules.js and holds every changed role clause that carries a safety fact back from the D-30 stand-in, on both sides and both admission points. The verifier's merge-ban reword is now red on a shared clone. Ordinary prose is still admitted. The live gate is green with 62 clauses held back, all on rows.**

## Performance

- **Duration:** 41 min
- **Started:** 2026-11-03T09:27:56Z
- **Completed:** 2026-11-03T10:09:08Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- `scripts/check-diff-disposition.ts`: imports `carriesSafetyFact`. It computes `safetyHeld` once per clause (stand-in declared, file under `agent-factory/roles/`, clause carries a fact). It refuses the stand-in on the `structuralSections` arm and on the no-row arm. It prints a per-finding CR-01 note, and before `reportStandin` it prints `<n> role clause(s) carry a safety fact and were not offered to the stand-in (CR-01); each needs a disposition row`. The header has a "CR-01 ROUND 2" paragraph, and the D-30 paragraph says "unless it carries a safety fact".
- Hook manifest regenerated. The closure of `hooks/admission-guard.js` grew from 13 to 15 module hashes (it gained `scripts/check-role-rules.js` and `install/state-layout.js`). The three `CLOSURE_BASELINES` rows were taken from `jsImportClosure` and carry a dated comment.
- 12 tests in the "CR-01 round 2" describes: 3 shared-clone cases, a fixture-premise case, 7 mirror cases and a no-key case.
- 40-REVIEW-DISPOSITION.md: CR-01, WR-01, WR-02, WR-03, IN-01, IN-02 and IN-03 are now `fixed`, each naming its plan and the test or gate that ran. It records `open: 0` and `total: 12`.
- deferred-items.md "From gap round 2" covers (a) the WR-01 second floor, (b) the uat-planner.md dial question, (c) the narrowed 40-11 residual, (d) no flagged 40-20 rows and (e) byte headroom. The D-30 record has a three-sentence "CR-01 round 2" section, appended only.

## Evidence

**Clone case B, RED before the gate change** (`npx vitest run scripts/check-diff-disposition.test.ts -t "CR-01 round 2"`, 2 failed | 1 passed): with the reword planted, the gate printed `PASS  1120 role clause(s) admitted by the role-rule inventory stand-in (D-30)`, `0 findings over 24/24 elements`, `ALL CHECKS PASSED`, and the test failed on `expected +0 to be 1`. Clone A also failed, because the count line did not exist yet. Clone C passed. That is the observed RED for the change itself.

**Clone case B after the change** (hand reproduction): exit 1. The output has `2 finding(s) over 24 elements`, both `agent-factory/roles/orchestrator.md:77 (added) — FROZEN by structuralSections`, each with the note `carries a safety fact (SAFETY_RULE_FACTS in scripts/check-role-rules.js), so the D-30 stand-in does not admit it: a changed safety sentence owes a disposition row a named human reads (CR-01)`. The stand-in line still reads `PASS  1079 role clause(s) admitted ... --check` exited 0`, and check-role-rules on the clone exits 0.

**Live gate:** `62 role clause(s) carry a safety fact and were not offered to the stand-in (CR-01); each needs a disposition row` / `PASS  1079 role clause(s) admitted by the role-rule inventory stand-in (D-30) — node scripts/check-role-rules.js --check exited 0` / `0 findings over 24/24 elements`, exit 0. An instrumented scratch copy broke the 62 down: 41 on the structural arm (25 added, 16 removed) and 21 on the no-row arm, all 21 with a row. Plan 40-20's listing counted 52 clauses, a different denominator from this per-side count. The gate's own run is the completeness proof: 0 findings.

**Task 2 mirror RED:** every red mirror case asserts the CR-01 note text, which no gate before Task 1 printed, so none of them could pass against the pre-Task-1 gate. They were written after Task 1, so they were not observed red. Clone case B holds the observed RED. Task 2 commit `cb80ac6d` touches only `scripts/check-diff-disposition.test.ts`.

**Commands and counts:**
- `npx vitest run scripts/check-diff-disposition.test.ts`: 136 passed (baseline 124). `-t "CR-01 round 2"`: 12 passed.
- `npx vitest run scripts/check-role-rules.test.ts -t "CR-01 round 2|IN-01|IN-03|WR-02|kind"`: 22 passed.
- `npx vitest run scripts/tier-kit-text.test.ts -t "WR-01|WR-03|dial"`: 28 passed.
- These all exit 0: `node scripts/check-role-rules.js`, `check-foundation-guards.js`, `check-imperative-lexicon.js`, `check-banned-claims.js`, `npm run check:claim-anchors` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`.
- These all exit 0: `npm run build`, `npm run typecheck`, and the seven freshness gates.
- Plan verification vitest set (7 files): 818 passed, 5 failed. All 5 are the recorded `uat-gate-exit-contract` failures.
- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, 1,385 s) first showed 55 failed: the known 21 plus 34 from the scratch-kit regression below. After the fix, the three affected files rerun to 689 passed and 1 known failure.
- `git diff --quiet HEAD -- scripts/voice-model.ts scripts/voice-model.js docs/audit/29-style-dispositions/00-base.md .planning/REQUIREMENTS.md` exits 0. orchestrator.md's merge-ban sentence is byte-unchanged.

## Task Commits

1. **Task 1 (tracer): narrowed stand-in, clone cases, manifest, closure baselines**: `d9c0e876` (feat). Tracer gate: the verify block was re-run end to end and passed, then work moved on to Task 2.
2. **Task 2: mirror cases for both sides and both arms**: `cb80ac6d` (test)
3. **Task 3: dispositions, deferred items, D-30 record**: `b5a5d107` (docs)
4. **Deviation fix: scratch kits copy install/state-layout.js**: `98669494` (test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hand-built scratch kits lacked install/state-layout.js**
- **Found during:** plan-level verification, closure-adjacent tests and then the full suite
- **Issue:** The plan's context said every closure mirror derives its files through jsImportClosure. Seven hand-built kits copy `scripts/*.js`, and at most `install/host-tools.js`. After the import, `check-role-rules.js` could not resolve `../install/state-layout.js` in them, so 103 tests failed with ERR_MODULE_NOT_FOUND: 69 in context-io.test.ts (four kits), 31 in check-foundation-guards.test.ts (scratchGuardFiles), 2 in check-banned-claims.test.ts (copyOfCommittedBuild) and 1 in compactor.test.ts (the 33-25 R4 kit).
- **Fix:** each kit now copies `install/state-layout.js`, the constants-only module, with a dated comment in the style of the plan 34-06 host-tools comment.
- **Files modified:** scripts/context-io.test.ts, scripts/check-foundation-guards.test.ts, scripts/check-banned-claims.test.ts, scripts/compactor.test.ts
- **Verification:** the closure-adjacent set dropped from 78 to 9 failures, all 9 known (7 context-io, 2 context-io-writer-set). The three other files dropped to the 1 known floor-item failure.
- **Commit:** `98669494`

**Total deviations:** 1 auto-fixed (Rule 3). **Impact:** test harness only. No gate behavior changed, and the remaining failures are exactly the recorded known set of 21.

## Known Stubs

None.

## Threat Flags

None. The new edge, check-role-rules.js and state-layout.js in the admission hook's decider closure, is pinned by the regenerated manifest. That is threat T-40-57 in the plan's model.

## Notes for the verifier

- PLAIN-03, PLAIN-05 and PLAIN-06 are left for the post-gap verifier to re-mark. REQUIREMENTS.md is untouched, and `requirements.mark-complete` was not run.
- Edges: with no key, the gate's behavior is unchanged and no count line is printed (pinned). A clause that equals a registry anchor or guard literal still owes its companion and never reaches the stand-in, so it is not counted as held back. Notes are printed per finding, in position order.
- Any later edit to check-role-rules.ts now needs `npm run generate:hook-manifest`.

## Next Phase Readiness

Plan 21 of 21 is done, and Phase 40's gap round 2 is ready for re-verification.

## Self-Check: PASSED

- All 13 modified files exist on disk.
- Commits d9c0e876, cb80ac6d, b5a5d107 and 98669494 are ancestors of HEAD.
