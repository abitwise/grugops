---
phase: 40-plain-language-role-rewrite
reviewed: 2026-11-02T14:57:56Z
depth: standard
scope: incremental, befa0e91ade67e097e99a41a220e608e27026a2c..HEAD (gap-closure plans 40-11 to 40-16)
files_reviewed: 194
files_reviewed_list:
  - agent-factory/checklists/definition-of-done.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/uat-planner.md
  - agent-factory/workflows/06-uat-pack.md
  - agent-factory/writing-profile.md
  - docs/audit/29-style-dispositions/40-13.md
  - docs/audit/40-disposition-base-move.md
  - docs/audit/40-role-rule-inventory.json
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-diff-disposition.js
  - scripts/check-diff-disposition.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-role-rules.js
  - scripts/check-role-rules.test.ts
  - scripts/check-role-rules.ts
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/installer.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/installer.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/installer.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/installer.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/installer.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/installer.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/installer.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/installer.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/uat-planner.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/architect-design.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/ba-pm.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/factory-coach.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/incident-responder.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/installer.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/orchestrator.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/release-manager.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/security-nfr.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/software-engineer.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/system-analyst.md
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/uat-planner.md
  - scripts/fixtures/good/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/good/agent-factory/roles/architect-design.md
  - scripts/fixtures/good/agent-factory/roles/ba-pm.md
  - scripts/fixtures/good/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/good/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/good/agent-factory/roles/factory-coach.md
  - scripts/fixtures/good/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/good/agent-factory/roles/incident-responder.md
  - scripts/fixtures/good/agent-factory/roles/installer.md
  - scripts/fixtures/good/agent-factory/roles/orchestrator.md
  - scripts/fixtures/good/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/good/agent-factory/roles/release-manager.md
  - scripts/fixtures/good/agent-factory/roles/security-nfr.md
  - scripts/fixtures/good/agent-factory/roles/software-engineer.md
  - scripts/fixtures/good/agent-factory/roles/system-analyst.md
  - scripts/fixtures/good/agent-factory/roles/uat-planner.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/agents-md-scribe.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/architect-design.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/ba-pm.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/brownfield-mapper.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/compliance-officer.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/factory-coach.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/greenfield-mapper.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/incident-responder.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/installer.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/orchestrator.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/qe-e2e.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/release-manager.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/security-nfr.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/software-engineer.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/system-analyst.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/uat-planner.md
  - scripts/tier-kit-text.test.ts
  - scripts/validate.test.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 40: Code Review Report

**Reviewed:** 2026-11-02T14:57:56Z
**Depth:** standard
**Files Reviewed:** 194 (18 source and kit files read in full or as diffs against `befa0e91`; the 176 fixture files checked mechanically)
**Status:** issues_found

## Summary

This is an incremental review of the gap-closure round (plans 40-11 to 40-16), scoped to changes since `befa0e91`. I read `40-REVIEW-DISPOSITION.md` and did not re-raise any of the 12 earlier findings. I did not re-raise the recorded items either: the fact-less safety sentence residual, the truncated red-run output through a pipe, and the corpus-cap headroom. Where an earlier fix holds only in part, the new finding says what is still open.

What I checked and confirmed:
- `npm run freshness`: all 89 committed `.js` files match a rebuild of their sources.
- The `DECIDER_MANIFEST` hash for `scripts/check-diff-disposition.js` in `hooks/hook-entry.{ts,js}` (`6f0f2e93…`) matches the file.
- `node scripts/check-role-rules.js` exits 0 on HEAD. The four changed test files pass: 564 of 564 tests.
- All 176 fixture diffs are the same one-line change (`8 prefix-matched section checks.` → `prefix-matched section checks.`), with nothing else changed. The count is 11 fixture trees × 16 role files.
- Workflow 06 grew from 5,820 B to 6,012 B, matching `40-13.md`. The base-move record's commit claims hold: `8578f8ad` is the parent of `557531419e`, and `1d6f94c6` is the plan 37-16 commit. The 31-row tally (19 reworded / 10 moved / 2 added, 23 workflow + 8 role) is consistent with the table.
- Earlier fixes that hold as claimed: WR-04 (the `## Stop when` freeze when no key is present), WR-06 (31 rows, accepted by a named human), IN-01, IN-03, IN-04 (pin and duplicate refusal). WR-05 also holds: the writer reads only git objects at the pinned commit, and the equality test now goes red on a laundered baseline.

Where it falls short. The CR-01 fix makes the inventory red when a safety token is **deleted**. It does not notice a safety sentence that is **reworded to say the opposite while keeping its token**. Under the D-30 stand-in, that rewording is admitted with no disposition row. I proved this end to end on a shared clone of HEAD. I changed the Orchestrator's merge ban to "Never merge to a protected branch until the gate is green; then merge it yourself." and dropped "merge and deploy stay with humans". In the same clone I also planted a gate-skipping board move written with an ASCII arrow. After that, `check-diff-disposition.js` exited 0 (`1138 role clause(s) admitted by the role-rule inventory stand-in`). So did `check-role-rules.js`, `check-foundation-guards.js`, `check-claim-anchors.js`, `check-banned-claims.js`, `check-imperative-lexicon.js`, `validate-agent-factory.js`, and the `tier-kit-text` and `check-banned-claims` test files. The same token-only weakness lets the CR-02 lean-close sign-off condition be dropped with all gates and pins green (WR-01 below).

## Critical Issues

### CR-01: A safety sentence reworded to allow merging keeps its fact, so the D-30 stand-in admits it with no human row

**File:** `scripts/check-role-rules.ts:113-139` (SAFETY_RULE_FACTS), `:276-281` (the sentence scan); `scripts/check-diff-disposition.ts:2048-2058` (stand-in admission of `structuralSections` clauses)
**Issue:** Each safety fact is a substring test on any one sentence of `## Hard limits` + `## Stop when`: `/\bnever merge/i`, `/\bnever deploy/i`, `/\bnamed human/i`, `/\bdry[- ]run\b/i`, and so on. The test cannot tell "Never merge to a protected branch." from "Never merge to a protected branch until the gate is green; then merge it yourself." When the inventory exits 0, check-diff-disposition admits every changed role clause frozen by position. Rewording a fact-carrying safety sentence therefore needs no disposition row and no human read. Before Phase 40, the same edit was a `FROZEN by structuralSections` finding.

This is not the recorded residual. That residual covers sentences that carry **none** of the 26 fact kinds. This case covers the sentences that carry the facts CR-01 added. The test suite pins red only on deletion (`FAMILY_CASES`, `MERGE_BAN`), never on a reword that weakens the rule. The header itself says "The meaning is checked at plan review, not here". But under the stand-in no review row is owed, so nobody checks the meaning. The stand-in stays in force through Phases 41 and 42.

Reproduced on a shared clone of HEAD: the edit above to `agent-factory/roles/orchestrator.md:77` (plus "Never deploy to production without a green gate.") left check-diff-disposition, check-role-rules, every other CLI gate and the related test files green.

Mitigating facts, so the severity is not overstated: the git host is the hard floor (CLAUDE.md Safety), and `AGENTS.md` repeats the rule. But the phase's own constraint is that the stand-in must not become a blanket bypass, and for every fact-carrying safety sentence it is one.
**Fix:** Keep the stand-in for ordinary role prose, but stop it from admitting a changed clause that carries a safety token on either side. Then any edit to such a sentence owes a disposition row a human reads, which is the pre-Phase-40 behavior for exactly these sentences:
```ts
// check-role-rules.ts: export one predicate built from the table.
export const carriesSafetyFact = (sentence: string): boolean =>
  SAFETY_RULE_FACTS.some((r) => r.holds(sentence));

// check-diff-disposition.ts, in the stand-in arm (~line 2048):
if (
  source === "structuralSections" &&
  (textSource === undefined || textSource === "structuralSections") &&
  !positiveLiteralClauses.has(c.clause) &&
  !carriesSafetyFact(c.clause)          // <- a safety-bearing clause, removed or added, still owes its row
) { ... }
```
(check-diff-disposition is in the hook's decider closure, so either copy the predicate into check-diff-disposition or regenerate the manifest after adding the import.) Add a red case on a shared clone: the merge-ban reword above, with the stand-in key present, must exit 1 naming `orchestrator.md`.

## Warnings

### WR-01: The CR-02 lean-close conditions are pinned only by tokens, and six roles' new safety facts have no baseline

**File:** `agent-factory/roles/orchestrator.md:68, 89`; `scripts/tier-kit-text.test.ts` (the "lean close keeps its human conditions" describe); `docs/audit/40-role-rule-inventory.json`
**Issue:** The CR-02 fix holds in the text today, but nothing keeps it there:
- The `tier-kit-text` pins check only that the close line contains `named human`, `sign_off_acceptance`, `merged` and `definition-of-done.md`. They also check that one `## Stop when` item contains `` `In UAT` `` and `merged`. I changed line 68 to "Close once a human merged the PR; the named human may sign off later (`checkpoint: sign_off_acceptance`), and … definition-of-done.md holds." and line 89 to "If no human has merged the PR, leave the ticket in `In UAT`." With those edits, `tier-kit-text.test.ts` (182 tests), check-role-rules and check-diff-disposition all stayed green. The sign-off condition CR-02 restored is gone.
- `## Board moves` is not a frozen section, so this edit owes only an ordinary row even after the stand-in ends.
- The baseline is pinned to the pre-rewrite commit, so any safety sentence added during Phase 40 never becomes a protected fact. Measured with `deriveAll` against the baseline: `orchestrator.md` carries `human-merge-deploy` and `named-human` with no baseline entry. `architect-design.md`, `factory-coach.md`, `greenfield-mapper.md`, `incident-responder.md` and `installer.md` each carry an unprotected `named-human`. The `named-human` stops include the Installer's stop-and-ask and the Orchestrator's CR-02 hold. Each of these sentences can be deleted with every gate green. The recorded residual covers only sentences with no fact kind at all.

**Fix:** Pin the close condition by meaning, not by token. Assert the exact close sentence, or assert that "Close only after" precedes both conditions, joined by "and". Assert that the `## Stop when` hold names both the merge and the sign-off. For the gained facts, add a second, additive floor: a committed list of safety facts per role, taken at the end of Phase 40 (HEAD, not `e8d7802`), checked the same way as the baseline, so facts gained in Phase 40 cannot be lost in Phases 41 and 42.

### WR-02: The partition guard reads only backtick spans that use `→`, so a gate-skipping move written with `->` or in prose is invisible

**File:** `scripts/check-role-rules.ts:586-602` (`claimedPairs`), `:610-622` (`moveSpanFindings`, rule 6)
**Issue:** Both parsers look only at code spans containing U+2192. The kit's workflows use `->` for board moves throughout (Workflow 06: `` `Ready for UAT -> In UAT` ``), so a rewriting agent can easily use that spelling. I added "You own `In Development -> Done` when the change is small." to `software-engineer.md` `## Board moves`. The result: no claim, no rule 4 finding, no rule 6 finding, no fact, and check-role-rules stays green. The same holds for the prose form "You own In Development → Done …", and the test "an arrow in prose outside code spans add no finding" pins that as intended. An agent reads either spelling as a claim. The WR-01 narrowing therefore holds only for moves spelled the canonical way. The IN-02 rule 6 has the same blind spot.
**Fix:** In `moveSpanFindings`, report any `## Board moves` code span that contains `->` or `=>`, and any unfenced line that names two board columns around an arrow outside a code span. Each becomes a rule 6 finding ("write board moves as `` `X → Y` ``"). Add red cases for `` `In Development -> Done` `` and the prose form.

### WR-03: Workflow 06 still says "The lean path straight to `Done` is unchanged", and its dial text conflicts with the Orchestrator's unconditional sign-off

**File:** `agent-factory/workflows/06-uat-pack.md:33`; `agent-factory/roles/orchestrator.md:68`
**Issue:** Plan 40-13 rewrote line 31 and the Done condition. It left line 33's "The lean path straight to `Done` is unchanged." That sentence comes from the removed design, where the UAT Planner moved the ticket straight to Done. The lean ticket now waits in `In UAT` for the Orchestrator's close, so "straight" and "unchanged" are both wrong. The WR-02 negative pins in `tier-kit-text.test.ts` look only for the two old parentheticals and `` /`Done`\)? in lean mode/ ``, so this sentence slips past them.

The same paragraph also says only the `In UAT -> Ready to Release` move stops at `sign_off_acceptance`, and that a repository may lower that checkpoint to `off` ("the dial changes who signs"). But `orchestrator.md:68` requires "the named human signs off acceptance" with no condition. A lean repository that sets `sign_off_acceptance: off` gets a role that never closes.
**Fix:** Replace the stale sentence with "In lean mode, the Orchestrator's close to `Done` stops at the same checkpoint." Then decide, and state in both files, what the lean close requires when `sign_off_acceptance` is `notify` or `off`. Either the Orchestrator's condition reads "the sign-off the `sign_off_acceptance` checkpoint requires", or the workflow says the lean close ignores the dial. Add `"straight to \`Done\`"` to the WR-02 negative pin.

## Info

### IN-01: `check()` checks the baseline's `source_commit` but not its contents

**File:** `scripts/check-role-rules.ts:888-908`
**Issue:** The gate the stand-in trusts reads the facts from the JSON as written. I removed `"no-merge"` from `files["orchestrator.md"].facts` on a mirror and deleted the merge ban, and `check-role-rules.js` passed. The re-derive test in `check-role-rules.test.ts` catches this in CI's vitest step, so the build is still red. check-diff-disposition, though, consults only the CLI gate.
**Fix:** When git objects at `PHASE_40_START_COMMIT` are reachable, have `check()` compare `serializeBaseline(...deriveAllAt(ROOT, PHASE_40_START_COMMIT)...)` with the file bytes and fail on any difference. Keep today's behavior only when the objects are unreachable, and say so in the output.

### IN-02: Stale header text in `check-role-rules.ts`

**File:** `scripts/check-role-rules.ts:41-43`
**Issue:** The header says the partition has "five rules, listed above checkPartition" and that "BOARD_MOVE_EXCEPTIONS is the one declared list". There are now six rules (rule 6 is in `moveSpanFindings`) and two declared lists (`D33_NON_FORWARD_PAIRS`). `FACT_KINDS` (`:140-160`) is described as the closed list of "every kind the derivation can emit", but nothing asserts that the derived facts are a subset of it. A new kind added to `deriveRoleFacts` without a `FACT_KINDS` entry would go unnoticed.
**Fix:** Update the header to six rules and two lists. In the kind-floor test, also assert that every fact in the committed baseline and in `deriveAll(ROOT)` matches a `FACT_KINDS` entry (exact, or by prefix for `junior:`, `kit-ref:` and `board-from:`).

### IN-03: `deriveAllAt` reads `git ls-tree` paths relative to the current directory, but `git show` reads them relative to the repository root

**File:** `scripts/check-role-rules.ts:445-456`
**Issue:** `git -C root ls-tree -r --name-only sha -- <paths>` interprets pathspecs and prints names relative to `root`. `git show sha:<p>` resolves `<p>` from the repository root. If `CHECK_ROOT` is a subdirectory of a repository, the two disagree and the writer fails, with a named error. Without `-z`, a non-ASCII path would also come back quoted. Neither case occurs today; the writer runs at the repository root.
**Fix:** Use `ls-tree -r -z --full-tree --name-only` and split on `\0`, or use `git show sha:./<p>` so both sides resolve the same way.

---

_Reviewed: 2026-11-02T14:57:56Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
