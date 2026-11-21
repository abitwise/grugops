---
phase: 40-plain-language-role-rewrite
plan: 24
subsystem: tooling
status: complete
tags: [check-diff-disposition, cr-03, cr-04, d-30, stand-in, disposition-rows, hook-manifest]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "the CR-01 round 2 fact hold and clone cases (plan 40-21), side-correct 40-23.md rows for Workflow 06 line 33 (plan 40-23), the hook manifest over check-role-rules.js (plan 40-22)"
provides:
  - "Side-aware rowMatches(row, c, addedKeys): a removed clause matches only `before`, an added clause only `after`; a row whose non-empty `after` is not an added clause matches nothing (CR-04)"
  - "The CR-04 stale-row note on findings and the new no-row remedy sentence"
  - "The CR-03 position hold: safetyHeld = declared && role file && (c.region !== null || carriesSafetyFact(c.clause)), with SAFETY_SECTION_NOTE and a heldBackForPosition count line"
  - "docs/audit/29-style-dispositions/40-24.md: 309 rows, every one `pending (named human)`"
  - "DECIDER_MANIFEST regenerated over the rebuilt check-diff-disposition.js"
affects: [40-25, phase 41, phase 42, admission hook manifest]

actuals:
  tokens: 36110
  tasks: 3
  commits: 5
plan_head_before: d0ae99fe198f7debc7b8343601fba8a5afdd2f6a
plan_head_after: e0002e358b2fc3db8abee4375a2fec8c786c6417

tech-stack:
  added: []
  patterns:
    - "A disposition row matches one side, and only while its `after` is an added clause of the same file in the current diff"
    - "Role clauses in `## Hard limits` and `## Stop when` are held back from the D-30 stand-in by position, not by content"
    - "Owed rows are generated from the gate's own findings by a throwaway script outside the repository, and stay pending until a named human reads them"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-24.md
  modified:
    - scripts/check-diff-disposition.ts
    - scripts/check-diff-disposition.js
    - scripts/check-diff-disposition.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js

key-decisions:
  - "CR-04 (human decision 1, Olger, 2026-11-03): rowMatches is side-aware and refuses a row whose non-empty `after` is not an added clause in the diff; `—` and an empty cell are an empty side"
  - "CR-03 (human decision 1): the reviewer's predicate as written; a role clause in `## Hard limits` or `## Stop when` never reaches the D-30 stand-in"
  - "The 309 owed rows are written `pending (named human)`; the named human reads them in plan 40-25 and the round does not close before that read"

patterns-established:
  - "A both-sides row takes each side's own raw fragment (removed side from the base blob, added side from the working tree), so the two cells can differ in raw form while normalizing to the same clause"

requirements-completed: [PLAIN-03]

coverage:
  - id: D1
    description: "CR-04: deleting the Release Manager's named-human approval sentence is red on a shared clone, naming release-manager.md (removed), FROZEN by structuralSections, and the stale 40-20.md row; check-role-rules exits 0 on the clone"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts#clone E: deleting the Release Manager's named-human approval sentence is red, naming the stale 40-20.md row, while check-role-rules exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-03: a merge permission inserted under orchestrator.md `## Hard limits` is red on a shared clone with the CR-03 note and count line; check-role-rules exits 0"
    requirement: PLAIN-03
    verification:
      - kind: integration
        ref: "scripts/check-diff-disposition.test.ts#clone D: a merge permission inserted directly under `## Hard limits` in orchestrator.md is red with the CR-03 note, while check-role-rules exits 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every fix, side and arm pinned on mirrors; the five D-30-era cases inverted or re-pointed; CR-01 round 2 cases unchanged and passing"
    requirement: PLAIN-03
    verification:
      - kind: unit
        ref: "npx vitest run scripts/check-diff-disposition.test.ts (153 passed)"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/check-diff-disposition.test.ts -t \"plan 40-24\" (15 passed)"
        status: pass
      - kind: unit
        ref: "npx vitest run scripts/check-diff-disposition.test.ts -t \"CR-01 round 2\" (12 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The live gate is green over the 309 pending rows, and the hook manifest and every freshness gate agree with the rebuilt gate"
    verification:
      - kind: other
        ref: "node scripts/check-diff-disposition.js (0 findings over 24/24 elements)"
        status: pass
      - kind: other
        ref: "npm run freshness && freshness:hook-manifest && freshness:guarantees && freshness:context && freshness:queue && freshness:adapters && freshness:catalog"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 309 rows in 40-24.md describe their clauses correctly"
    requirement: PLAIN-03
    verification: []
    human_judgment: true
    rationale: "Every disposition is the named human's judgement; the agent's comparison is advice. Plan 40-25 is the blocking-human read."

duration: 20min
completed: 2026-11-03
---

# Phase 40 Plan 24: Side-aware row matching (CR-04) and the frozen-section stand-in hold (CR-03) Summary

**A disposition row now matches only its own side (a removed clause through `before`, an added clause through `after`). A row whose `after` the tree no longer holds matches nothing, so a "kept word for word" row can no longer approve deleting its sentence. A role clause in `## Hard limits` or `## Stop when` never reaches the D-30 stand-in. Both human red cases are red on shared clones. The 309 shipped clauses these fixes newly require have rows marked `pending (named human)`, and plan 40-25 is the human's read of them.**

## Performance

- **Duration:** about 20 min
- **Started:** 2026-11-03T20:30:56Z
- **Completed:** 2026-11-03T20:50:28Z
- **Tasks:** 3 (1 tracer with TDD, 1 auto with TDD, 1 auto)
- **Files changed:** 6

## Accomplishments

- **CR-04 closed in the gate.** `rowMatches(row, c, addedKeys)` is exported and side-aware. `addedKeys` is built once in `main` from the added clauses. When rows name a finding's clause but were refused for a stale `after`, the finding carries the note "row(s) in <sources> name this clause, but their `after` is not an added clause in this diff, so they record a sentence the tree no longer holds and match nothing (CR-04)".
- **CR-03 closed in the gate.** The hold is the reviewer's predicate: `standinRun.declared && c.file.startsWith(ROLE_STANDIN_SCOPE) && (c.region !== null || factHeld)`. A fact-free clause held by position gets the CR-03 note and is counted on its own line. A fact-bearing clause keeps the CR-01 note and count.
- **40-20.md still matches.** All 36 of its rows match the same non-empty clause sets they matched before. I checked this with a scratch script that compares the old side-blind match against the new `rowMatches`. 40-20.md is byte-unchanged.
- **Hook manifest regenerated** after each rebuild: "Hook manifest fresh: 1 decider(s), 15 module hash(es) match a fresh derivation." No import was added.

## Task Commits

1. **Task 1 RED:** `d339dfe9` test(40-24): add failing clone case for the Release Manager approval deletion (CR-04)
2. **Task 1 GREEN:** `54492ed2` fix(40-24): a disposition row matches one side, and only while its after still exists (CR-04)
3. **Task 2 RED:** `68677354` test(40-24): add failing CR-03 clone case and invert the D-30-era frozen-section admissions
4. **Task 2 GREEN:** `1b723387` fix(40-24): no role clause in `## Hard limits` or `## Stop when` reaches the stand-in (CR-03)
5. **Task 3:** `e0002e35` test(40-24): mirror cases for the side-aware match and the frozen-section hold (CR-03, CR-04). `git show --name-only --format= e0002e35` lists only `scripts/check-diff-disposition.test.ts`.

## RED evidence

- **Clone E (Task 1 RED, on `d339dfe9`).** I ran `npx vitest run scripts/check-diff-disposition.test.ts -t "CR-04 \(plan 40-24\)" --reporter=tap-flat`: exit 1, 1 failed. The target failed on `expect(r.status).toBe(1)` with actual 0. The gate printed "63 role clause(s) carry a safety fact ...", "PASS 1077 role clause(s) admitted by the role-rule inventory stand-in (D-30)", "PASS diff disposition — changed watched file(s): 0 findings over 24/24 elements" and "ALL CHECKS PASSED", even though the clone had the approval sentence deleted. `gsd_run check tdd-red-evidence` returned `INVALID_RED (invalid_record)`, with report errors "Non-TAP data in report" and "Malformed TAP". The failure message embeds the multi-line gate output, which vitest's TAP reporter does not indent; plan 40-22 hit the same limit. I assessed the RED by reading the report instead: the target test ran and failed on its planned status assertion, for the planned reason. `workflow.tdd_mode` is false, so this gate is advisory.
- **Clone D and the inverted cases (Task 2 RED, on `68677354`).** The full file gave exit 1, **4 failed | 137 passed (141)**. Three of the failures printed "ALL CHECKS PASSED" at exit 0 where the test expected exit 1: clone D, the inverted D-30 `## Hard limits` case, and the inverted WR-04 `## Stop when` case. The fourth, the new `## Stop when` row sibling, failed because `positionHeldCount` returned null: the CR-03 count line did not exist yet. The two re-pointed stand-in failure cases and the re-pointed CR-01 control passed at RED, as re-pointed cases should.
- **Task 3 against the pre-plan gate.** The plan cites Tasks 1 and 2 as the observed RED runs. As an extra check, I copied `git show d0ae99fe:scripts/check-diff-disposition.js` over the compiled gate and ran the new describe: **7 failed | 5 passed**. The six red mirrors all failed, and so did the CR-03 green-with-row case, because it asserts the count line. The two green controls, the no-key case and the premise case passed. I then restored the current `.js`; `git diff --quiet HEAD` exited 0. Every Task 3 red case asserts CR03_NOTE or CR04_NOTE, which no gate before this plan printed.

## Live gate findings before each batch of rows

- **After CR-04 alone (Task 1):** exit 1 with **24** findings, all `(removed)`:
  - compliance-officer.md: 1 (line 31, the 29-07.md identical-sides row, now stale)
  - installer.md: 1 (line 30, a stale 29-06.md row)
  - tech-lead.md: 3 (line 35, and line 49 twice, FROZEN `## Hard limits`)
  - 06-uat-pack.md: 2 (line 49)
  - 08-sprint-planning.md: 1 (line 24)
  - 14-ui-design-to-build.md: 16 (lines 27 and 28)

  All 24 fall in the expected file set and inside the 15 to 40 band. Workflow 06 line 33 does not appear, because plan 40-23's side-correct rows cover it.
- **After CR-03 was added (Task 2):** exit 1 with **292** findings. All 292 are role clauses and FROZEN by structuralSections: 249 in `## Hard limits` and 43 in `## Stop when`. All 292 carry the CR-03 note, and none carries the CR-01 fact note. Per file: security-nfr and orchestrator 23 each; software-engineer and frontend-ui 20 each; qe-e2e 19; factory-coach, ba-pm and agents-md-scribe 16 each; brownfield-mapper and architect-design 15 each; incident-responder and compliance-officer 14 each; tech-lead, system-analyst and greenfield-mapper 13 each; release-manager and installer 12 each; uat-planner 10; designer 8. All inside the 240 to 340 band.

## Rows (docs/audit/29-style-dispositions/40-24.md)

| Run | Findings | Rows | Both sides | Removed only | Added only | Frozen (filled companion) | Fact-bearing | Older row now stale (CR-04 text) |
|---|---|---|---|---|---|---|---|---|
| Task 1 (CR-04) | 24 | 24 | 22 | 2 | 0 | 2 | 6 | 2 |
| Task 2 (CR-03) | 292 | 285 | 15 | 157 | 113 | 285 | 0 | 9 |
| **Total** | 316 | **309** | 37 | 159 | 113 | **287** | **6** | 11 |

- Outside frozen sections: 22 rows. Role rows: 290. Workflow rows: 19.
- `grep -c "pending (named human)"` = 309 = `grep -c "^| agent-factory/"`, and `grep -c "accepted by"` = 0.
- As the plan foresaw, the compliance-officer.md line 31 sentence "state controls and gaps in plain language and escalate genuine legal questions to a named human." owes a row now. Before this plan, the identical-sides 29-07.md row matched it. Its row is marked "removed in the Phase 40 rewrite; carries a safety fact; an older row in 29-07.md recorded it as kept (CR-04)".

**Generator procedure as run.** A temporary script lived in the session scratchpad under the OS temp directory and was never committed. It read the gate output file and parsed each finding: its file, line, side, clause, its region if any, and the CR-04 note's sources. It grouped findings by file and clause, and marked a group as both sides when `changedClauses(base, files)` from `scripts/check-diff-disposition.js` also held the clause on the other side; the base came from `00-base.md`. It read the raw fragment from `git show e8d7802:<file>` for the removed side or from the working tree for the added side. It split each line exactly as `segmentClauses` does (`/(?<=[.!?])\s+/`, then `/ — | – | ; | : /`), took the fragment whose `normalizeSentence` equals the clause, and dropped a leading list marker. It wrote one seven-column row per group. It would have stopped on a missing fragment, a pipe character, or a file outside roles/workflows; none occurred. Rule cells: `CR-04, D-30, human decision 2026-11-03` for run 1 and `CR-03, D-30, human decision 2026-11-03` for run 2.

**These rows are pending until plan 40-25's named-human read.** Every disposition cell begins `pending (named human):`. The agent's comparison is advice.

## Gate lines after

```
        24 watched file(s) changed since e8d7802; 1455 changed clause(s) derived; 2898 disposition row(s) across 72 file(s)
        64 role clause(s) carry a safety fact and were not offered to the stand-in (CR-01); each needs a disposition row
        306 role clause(s) sit in `## Hard limits` or `## Stop when` and were not offered to the stand-in (CR-03); each needs a disposition row with a filled companion
  PASS  945 role clause(s) admitted by the role-rule inventory stand-in (D-30) — `node scripts/check-role-rules.js --check` exited 0
  PASS  diff disposition — changed watched file(s): 0 findings over 24/24 elements
ALL CHECKS PASSED
```

On the pre-plan gate (clone E's run, which included the deletion), 63 clauses were held back and 1077 admitted. After Task 1, 1251 were admitted. Clauses whose rows had matched on the wrong side now fall through to the stand-in, which admits ordinary role prose as it did before. After Task 2, 945 are admitted and 306 are held back by position.

## Pass counts

- `scripts/check-diff-disposition.test.ts`: 136 at HEAD, then 137 (Task 1), 141 (Task 2) and **153** (Task 3).
- `-t "plan 40-24"`: 15 passed. `-t "CR-01 round 2"`: 12 passed.
- The plan's verification suite (7 files) ran 856 tests: 851 passed and 5 failed. All 5 failures are in `uat-gate-exit-contract.test.ts`, the recorded pre-existing set.
- Task 1 verify suite (board-readonly, floor-invariance, nonblocking-reader-parity, admission-guard, freshness): 473 tests. The floor-invariance case "hooks/hook-entry.ts has no uncommitted modification, measured against HEAD" fails before a commit by design. After the commit, floor-invariance and admission-guard ran 220 passed. The same held after Task 2.
- These all exit 0: check-diff-disposition, check-role-rules, check-foundation-guards, validate-agent-factory, check-imperative-lexicon, check-banned-claims, check:claim-anchors, and freshness, hook-manifest, guarantees, context, queue, adapters and catalog.

## Files Created/Modified

- `scripts/check-diff-disposition.ts` / `.js`:
  - Exported `rowMatches(row, c, addedKeys)`.
  - `staleRowSources` and `staleRowNote`.
  - `addedKeys` in `main`.
  - The new no-row remedy sentence.
  - `factHeld`, the widened `safetyHeld`, `safetySectionNote`, `heldBackForPosition` and the CR-03 count line.
  - Header paragraphs "CR-04 (plan 40-24, ...)" and "CR-03 (plan 40-24, ...)", plus the amended D-30 and WR-04 paragraphs.
- `scripts/check-diff-disposition.test.ts`:
  - `sharedCloneOfHead` now copies the working-tree disposition directory.
  - New constants: `DISPOSITION_DIR_REL`, `RM_REL`, `RM_APPROVAL`, `CR04_NOTE`, `MERGE_PERMISSION`, `CR03_NOTE`, `CR03_COUNT_LINE`, `REWORDED_NOTES_ROLE`, `REWORDED_ROLE_AND_NOTES`. `NOTES_LINE` and `REWORDED_NOTES_LINE` moved above the D-30 describe.
  - Three new describes, five superseded cases changed in place, and one new D-30 case for `## Notes` prose.
- `docs/audit/29-style-dispositions/40-24.md`: new file with 309 pending rows.
- `hooks/hook-entry.ts` / `.js`: the `DECIDER_MANIFEST` hash for `scripts/check-diff-disposition.js`.

## Decisions Made

- No decisions beyond human decision 1. The reviewer's predicate was used exactly as written.

## Deviations from Plan

- **[Rule 1 - Bug] The intro paragraph in 40-24.md made the pending count one higher than the row count.** It quoted the literal `pending (named human)`, so `grep -c` printed 25 against 24 rows, which broke the acceptance criterion that the two counts are equal. I reworded it to "every cell stays pending until the named human reads it". Fixed before the Task 1 commit.
- **Both-sides fragments.** For a both-sides group, the generator takes the removed fragment from the base blob and the added fragment from the working tree. The plan said "before = after = fragment". The two normalize to the same clause; the only difference is a leading list marker on one tech-lead line, and the generator drops it. So every both-sides row has identical cells, and the procedure stays faithful to each side.
- **Test helper.** I added `positionHeldCount` (the CR-03 counterpart of `heldBackCount`) and `findingCount`, both at file level above first use. The plan did not name them.
- **The WR-04 sibling row** uses `STOP_WHEN_BULLET.slice(2)` and `REWORDED_STOP_WHEN_BULLET.slice(2)`, as the existing no-key WR-04 case does.

**Total deviations:** 1 auto-fixed (Rule 1). The other items are notes on how the work was done. No scope added.

## Prohibitions honored

- No `accepted by`, name or human acceptance appears in 40-24.md (`grep -c "accepted by"` = 0).
- The base is unchanged, and so are the `role_standin` key, `00-base.md` and `40-20.md` (`git diff --quiet` exits 0). The stand-in admits less than before, never more.
- None of the CR-01 round 2 cases were weakened: clone B, the reword-to-reverse red case and the mirror cases all pass. The five superseded D-30-era cases were changed in place, and none was deleted.
- No safety-fact pattern was copied into check-diff-disposition.ts. No role, workflow or generated adapter was edited (`git diff --name-only d0ae99fe..HEAD` lists none).
- Every row came from findings inside the expected file set and the measured band.
- `.planning/REQUIREMENTS.md` was not changed.

## Issues Encountered

- The RED evidence classifier cannot parse vitest TAP output when a failure message spans several lines. This affects every clone case, because the gate's stdout is the assertion message. I assessed the RED evidence by reading the report.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 40-25 holds the named-human read of the 309 pending rows in 40-24.md. The 6 fact-bearing rows and the 11 rows whose older row is now stale are marked, so the human can read them first. Phases 41 and 42: every edit to a role `## Hard limits` or `## Stop when` now owes a disposition row with a filled companion.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/40-24.md, scripts/check-diff-disposition.ts, scripts/check-diff-disposition.js, scripts/check-diff-disposition.test.ts, hooks/hook-entry.ts, hooks/hook-entry.js
- FOUND commits (ancestors of HEAD): d339dfe9, 54492ed2, 68677354, 1b723387, e0002e35
- `git rev-list --count d0ae99fe..HEAD` = 5, which matches `commits: 5`
