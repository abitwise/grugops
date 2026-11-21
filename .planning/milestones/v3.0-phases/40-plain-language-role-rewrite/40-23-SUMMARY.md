---
phase: 40-plain-language-role-rewrite
plan: 23
subsystem: role-text
status: complete
tags: [orchestrator, lean-close, uat-planner, workflow-06, sign-off, named-human, wr-08, wr-09, dispositions]

requires:
  - phase: 40-plain-language-role-rewrite
    provides: "the lean close and hold pinned by exact sentence (plan 40-17), the safety-fact disposition rule (plan 40-21), the named-human read shape (plan 40-20)"
provides:
  - "orchestrator.md line 68 and the `## Stop when` hold name the named human's sign-off next to the human merge, at every dial value (WR-08)"
  - "Workflow 06 line 33 no longer says the dial lowers the UAT Planner's sign-off; the dial governs only how the Orchestrator records the lean close (WR-09)"
  - "tier-kit-text pins: new CLOSE_SENTENCE and HOLD_ITEM, WR-08 mutation cases, a WR-09 describe over uat-planner.md and Workflow 06"
  - "docs/audit/29-style-dispositions/40-23.md: 16 side-correct rows, all accepted by Olger on 2026-11-03"
affects: [40-24, 40-25, deferred-items (b) and (e)]

actuals:
  tokens: 4317
  tasks: 3
  commits: 3
plan_head_before: a42a76e422578cbb9201cc548d0643cc30b61531
plan_head_after: 8885666cbf9d3bf89ccb16cfd847eca19a78f182

tech-stack:
  added: []
  patterns:
    - "A safety sentence names the human hold itself instead of pointing at a checkpoint whose definition may not fire"
    - "Disposition rows are side-correct: `before` is the removed side at base e8d7802 or `—`, `after` is the working-tree side or `—`"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-23.md
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/workflows/06-uat-pack.md
    - scripts/tier-kit-text.test.ts
    - .planning/phases/40-plain-language-role-rewrite/deferred-items.md

key-decisions:
  - "WR-08 (human decision 4, Olger, 2026-11-03): the lean close and its hold need the named human's sign-off and the human merge at every value of `sign_off_acceptance`"
  - "WR-09 (human decision 2, Olger, 2026-11-03): the UAT Planner's named-human sign-off stays unconditional; uat-planner.md is unchanged and the dial only shapes how the lean close is recorded"
  - "Named-human read: Olger accepted all 16 rows of 40-23.md on 2026-11-03 (\"accept-all, Olger\"); no row flagged"

patterns-established:
  - "A blocking-human checkpoint row stays `pending (named human):` until the reply, then the prefix becomes `accepted by <name>:` with the agent comparison kept as advice"

requirements-completed: [PLAIN-02, PLAIN-03, PLAIN-04, PLAIN-07]

duration: 25min
completed: 2026-11-03
---

# Phase 40 Plan 23: The lean close names the named human; the UAT sign-off stays unconditional Summary

**The Orchestrator's lean close and its hold now require the named human's sign-off and the human merge at every dial value. Workflow 06 no longer says the `sign_off_acceptance` dial lowers the UAT Planner's sign-off. Olger read and accepted all 16 disposition rows.**

## Performance

- **Duration:** about 25 min (start 2026-11-03T20:02:43Z, end 2026-11-03T20:28Z, including the wait at the human checkpoint)
- **Tasks:** 3 (1 tracer with TDD, 1 blocking-human decision, 1 auto)
- **Files changed:** 5

## Accomplishments

- WR-08 closed: `orchestrator.md` line 68 and line 89 name the named human's sign-off directly. Before this plan they pointed at the `sign_off_acceptance` checkpoint, whose shipped definition only fires on missing, ambiguous or unmet criteria.
- WR-09 closed: `uat-planner.md` was not touched (sha256 prefix `9b394492dd7c712c`, unchanged). Workflow 06 line 33 says the enterprise move and the lean close both wait for the named human at every value. The dial now only decides how the Orchestrator records the lean close.
- The pins changed with the text. Tests now fail if a sign-off or merge condition is dropped, or if the plan 40-17 wording comes back. The new WR-09 describe holds both files to the same rule.
- The named human read the rows: Olger, 2026-11-03, `accept-all, Olger`.

## Task Commits

1. **Task 1 (RED): failing pins** - `21b3ff14` (test)
2. **Task 1 (GREEN): role, workflow and rows** - `30242e93` (fix)
3. **Task 2: named-human read** - no commit (checkpoint:decision, gate=blocking-human; Olger replied in the main session)
4. **Task 3: record the read, close deferred (b), update (e)** - `8885666c` (docs)

## Final wording of every changed line

- `agent-factory/roles/orchestrator.md` line 68: "You own `In UAT → Done`, the lean-mode close. Close only after the named human signed off acceptance, a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds."
- `agent-factory/roles/orchestrator.md` line 89: "- If a human has not merged the PR or the named human has not signed off acceptance, leave the ticket in `In UAT`."
- `agent-factory/workflows/06-uat-pack.md` line 33 (one line, thirteen sentences, exactly as the plan wrote them; no sentence or lexicon gate asked for a shorter version): "Green machine-backed evidence does not by itself carry the ticket past acceptance. The `In UAT -> Ready to Release` move waits for the named human's sign-off at every value of `sign_off_acceptance`. The zero-config posture stops there, and this workflow does not change it. In lean mode, the Orchestrator's close to `Done` waits for the same sign-off. A repository may lower `sign_off_acceptance` under `.grugops/factory.config.json#checkpoints`. The closed disposition vocabulary is `block`, `notify` and `off`, and no fourth value exists. Only a value the repository actually wrote can lower it; absence reads as the documented default. The dial governs only how the Orchestrator records the lean close, and it never removes the human merge or the named human's sign-off. At `notify` the Orchestrator records the close per Workflow 16, as an `observation` when it cannot stamp it. At `off` it closes without that record. `sign_off_acceptance` is not a safety floor, so no floor is weakened and no second key is involved. No new checkpoint id is added for an evidence-backed advance. The UAT Planner presents the pack as machine-backed either way — the dial never changes who signs or what the evidence is."

## Bytes (`wc -c`, UTF-8)

| File | Before | After |
|---|---|---|
| `agent-factory/roles/orchestrator.md` | 6,046 B | 6,036 B (limit 6,046 B) |
| Role corpus (`cat agent-factory/roles/*.md`) | 59,803 B | 59,793 B (limit 59,803 B) |
| `agent-factory/workflows/06-uat-pack.md` (D-06) | 6,328 B | 6,264 B |

Section checksums were unchanged after the edit: orchestrator `## One job` to `## Board moves` `3111f647e2a12eb5`, `## Hard limits` to `## Stop when` `aa9f396e8178f0a2`; Workflow 06 `## Stop conditions` to `## Done condition` `3c72c8ddbfd0fedd`, `## Commit` to end `94a042e542d9df4e`.

## TDD Gate Compliance

- **RED** (`21b3ff14`, `test(40-23)`): `npx vitest run scripts/tier-kit-text.test.ts` on the RED tree gave exit 1, **14 failed | 187 passed (201)**. I re-ran it on a `git archive 21b3ff14` export to measure the counts. The failing cases were: both CR-02 exact-sentence cases (close and hold); "WR-03, WR-09: Workflow 06 says the Orchestrator's lean close waits for the same sign-off"; "WR-01: the live Orchestrator has no lean-close violation"; seven cases in the WR-01 mutation describe (live, reviewer mutation, the two drop-sign-off and two drop-merge cases); the two new "WR-08 (plan 40-23): the plan 40-17 close/hold is red if it comes back" cases; and the two Workflow 06 cases in the new WR-09 describe. The uat-planner.md cases in the WR-09 describe passed at RED, because that file was already unconditional and stays byte-unchanged. The targeted RED record is in the scratchpad (`red-40-23.json`): exit 1 on "the lean close is the exact sentence", where line 68 still carried the plan 40-17 sentence.
- **GREEN** (`30242e93`, `fix(40-23)`): `npx vitest run scripts/tier-kit-text.test.ts` gives **201 passed (201)**. The baseline before the plan was 193.
- **REFACTOR:** not needed.

## Disposition gate

- Before the rows: `node scripts/check-diff-disposition.js` exited 1 with 9 `(added)` findings. They were `orchestrator.md:68` (no disposition row, carries the named-human fact), `orchestrator.md:89` (FROZEN by structuralSections, `## Stop when`) and seven Workflow 06 line-33 clauses. This matches the scratch-clone count measured at planning.
- After the rows (Task 1) and after the human's dispositions (Task 3): exit 0, "diff disposition — changed watched file(s): 0 findings over 24/24 elements", ALL CHECKS PASSED. In the line-33 side check, every removed-side and added-side clause matched a row in 40-23.md (0 MISS).

## Named-human read

- **Read by:** Olger, 2026-11-03
- **Verbatim reply:** `accept-all, Olger`
- **Option:** accept-all. All 16 rows now read `accepted by Olger:`. No row is flagged, so plan 40-25 has no flagged row to carry from this plan.
- At the checkpoint the human was told about one thing this plan did not change: `agent-factory/config/factory.config.md` line 207 still describes `sign_off_acceptance` as "Signing off acceptance when the criteria are missing, ambiguous or unmet". The human did not ask for that cell to be reworded.

## Deferred items

- (b) closed: "decided by Olger, 2026-11-03: the UAT Planner's named-human sign-off stays unconditional; uat-planner.md is unchanged; Workflow 06 line 33 reworded in plan 40-23, rows in docs/audit/29-style-dispositions/40-23.md".
- (e) still open, with one sentence added: "After plan 40-23: orchestrator.md 6,036 B, role corpus 59,793 B (`wc -c`)." These match the numbers the plan predicted.
- deferred-items.md lines 1-72 checksum `91b6a1ac3da1b324` (unchanged).

## Verification (plan block, run after Task 3)

- `npx vitest run` over tier-kit-text, check-role-rules, adapter-byte-baseline, validate, check-imperative-lexicon: 5 files, **565 passed**.
- `npx vitest run scripts/check-foundation-guards.test.ts -t "corpus total|ROLE_CEILINGS"`: 10 passed, 334 skipped.
- check-role-rules, check-foundation-guards, validate-agent-factory, check-diff-disposition, check-imperative-lexicon, check-banned-claims, check-kit-refs, check-state-paths, `npm run check:claim-anchors`: all exit 0. The only FAIL text in the output is the threshold label in the PASS line "role corpus 59793 B ... FAIL above 67383".
- freshness: adapters, catalog, skill-twins, host-entries, guarantees all exit 0; `.claude/agents` unchanged.
- `git diff --quiet HEAD -- .planning/REQUIREMENTS.md agent-factory/roles/uat-planner.md` exits 0.

## Decisions Made

- None beyond the human's decisions 2 and 4 (2026-11-03) and the accept-all read. The plan's wording was used without change.

## Deviations from Plan

The plan ran exactly as written. One state-tool step was undone:

- **[Rule 1 - Bug] The requirements step flipped the phase's requirements to Complete too early.** `requirements.mark-complete PLAIN-02 PLAIN-03 PLAIN-04 PLAIN-07` checked them off and set their traceability rows to Complete. Phase 40 is still in gap closure: 40-24 and 40-25 are not done, and the rows read "Gaps Found". Task 3's acceptance criteria also require `git diff --quiet HEAD -- .planning/REQUIREMENTS.md` to exit 0. I restored that single file with `git checkout -- .planning/REQUIREMENTS.md`. It is not in the docs commit, so the PLAIN requirements stay at "Gaps Found" until phase verification. `requirements-completed` in the frontmatter lists the requirements this plan addressed; it does not change their status.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- WR-08, WR-09 and deferred (b) are closed. Plan 40-24 (side-aware row matching) will find side-correct rows for line 33 in 40-23.md. The 40-17.md line-33 rows are stale by design and will be refused under 40-24's stale-row rule.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/40-23.md, agent-factory/roles/orchestrator.md, agent-factory/workflows/06-uat-pack.md, scripts/tier-kit-text.test.ts, deferred-items.md
- FOUND commits: 21b3ff14, 30242e93, 8885666c (all ancestors of HEAD)
