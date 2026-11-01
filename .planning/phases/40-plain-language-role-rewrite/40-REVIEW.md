---
phase: 40-plain-language-role-rewrite
reviewed: 2026-11-01T18:01:14Z
depth: standard
files_reviewed: 256
files_reviewed_list:
  - agent-factory/checklists/pr-review-checklist.md
  - agent-factory/NOTICE
  - agent-factory/roles/agents-md-scribe.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/brownfield-mapper.md
  - agent-factory/roles/compliance-officer.md
  - agent-factory/roles/designer.md
  - agent-factory/roles/factory-coach.md
  - agent-factory/roles/frontend-ui.md
  - agent-factory/roles/greenfield-mapper.md
  - agent-factory/roles/incident-responder.md
  - agent-factory/roles/installer.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/qe-e2e.md
  - agent-factory/roles/release-manager.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/security-nfr.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/system-analyst.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/roles/uat-planner.md
  - agent-factory/workflows/08-sprint-planning.md
  - agent-factory/workflows/14-ui-design-to-build.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/writing-profile.md
  - CHANGELOG.md
  - .claude/agents/grugops-security-nfr.md
  - CLAUDE.md
  - docs/audit/28-claim-registry.md
  - docs/audit/29-style-dispositions/00-base.md
  - docs/audit/29-style-dispositions/40-03.md
  - docs/audit/29-style-dispositions/40-06.md
  - docs/audit/29-style-dispositions/40-07.md
  - docs/audit/29-style-dispositions/README.md
  - docs/audit/40-disposition-base-move.md
  - docs/audit/40-role-rule-inventory.json
  - .github/workflows/ci.yml
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/mode-census.test.ts
  - NOTICE
  - package.json
  - scripts/adapter-byte-baseline.test.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.ts
  - scripts/check-claim-anchors.test.ts
  - scripts/check-diff-disposition.js
  - scripts/check-diff-disposition.test.ts
  - scripts/check-diff-disposition.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-imperative-lexicon.js
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/check-role-rules.js
  - scripts/check-role-rules.test.ts
  - scripts/check-role-rules.ts
  - scripts/frontmatter.test.ts
  - scripts/generate-catalog.test.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/tier-kit-text.test.ts
  - scripts/trace-instructions.test.ts
  - scripts/uat-gate-exit-contract.test.ts
  - scripts/validate-agent-factory.js
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
  - scripts/voice-model.test.ts
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
  - scripts/fixtures/bad-config-no-mode/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-plugin-noname/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-role-missing-section/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-ticket-bad-column/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-ticket-body-column/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-ticket-duplicate-key/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-ticket-mismatch/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-ticket-no-region/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/bad-workflow-no-commit/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/good/agent-factory/roles/_role-switch-protocol.md
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
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/_role-switch-protocol.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/security-nfr.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/software-engineer.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/system-analyst.md
  - scripts/fixtures/warn-only-no-trace/agent-factory/roles/uat-planner.md
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 40: Code Review Report

**Reviewed:** 2026-11-01T18:01:14Z
**Depth:** standard
**Files Reviewed:** 256 (69 source/doc files read in full or as diffs against `61edba1e`; the 187 fixture files were checked mechanically, see Summary)
**Status:** issues_found

## Summary

This review covered the new role-rule inventory (`scripts/check-role-rules.ts`), the D-30 stand-in arm in `scripts/check-diff-disposition.ts`, the inverted caveman guard and the corpus-total guard in `scripts/check-foundation-guards.ts`, roles as the fifth part of `scripts/check-imperative-lexicon.ts`, the validator's section list, the 19 rewritten roles plus the protocol, the three workflows, the audit records and the changed tests.

What I checked and confirmed:
- `npm run freshness`: all 89 committed `.js` files match a rebuild of their `.ts`.
- `npm run freshness:adapters`: 0 byte differences.
- `NOTICE` and `agent-factory/NOTICE` are byte-identical.
- The `DECIDER_MANIFEST` hash for `scripts/check-diff-disposition.js` in `hooks/hook-entry.{ts,js}` matches the file.
- `check-role-rules.js`, `check-diff-disposition.js` and `check-foundation-guards.js` all exit 0 on HEAD.
- The five main changed test files pass: 424 of 424 tests.
- All 187 fixture files gained exactly the same six lines (`## Activates when` plus one line, `## Stop when` plus one item, two blank lines) and nothing else.
- `bad-role-missing-section` still lacks only `## Hard limits` in `orchestrator.md`, so it still fails for its one reason.

Where it falls short: the rewrite kept the guarded tokens (`UNKNOWN - verify`, `BLOCKED`, fake/invent wording). But the gate change that came with it removed the only mechanical protection the role `## Hard limits` sentences had. That includes the merge and deploy bans, which no token protects. I proved this on a throwaway worktree. I deleted "Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans." from `orchestrator.md`, "Never deploy to production yourself." and the human-approval sentence from `release-manager.md`, and "Merge and deploy stay with humans." from `tech-lead.md`. Every gate stayed green: check-role-rules, check-diff-disposition (it reported "1125 role clause(s) admitted by the role-rule inventory stand-in"), check-foundation-guards, check-imperative-lexicon, check-claim-anchors, check-banned-claims and validate-agent-factory. Before this phase, check-diff-disposition would have flagged each of those deletions as `FROZEN by structuralSections`.

The Orchestrator's new lean close also dropped its "once merged" condition and never requires the named-human UAT sign-off. The board-move partition guard also admits moves that skip gates; I confirmed this by calling `checkPartition` directly.

## Critical Issues

### CR-01: The merge, deploy and named-human bans in role `## Hard limits` are no longer protected by any gate

**File:** `scripts/check-diff-disposition.ts:1996-2007` and `:2091-2096` (stand-in admission); `scripts/check-role-rules.ts:15-28, 175-188` (closed D-28 fact list)
**Issue:** With `role_standin: scripts/check-role-rules.js` declared, check-diff-disposition admits every changed role clause frozen only by `structuralSections`, and every role clause with no disposition row, whenever `check-role-rules.js` exits 0. The D-28 fact list contains no fact for the project's hard safety rule from CLAUDE.md: no protected-branch merge, no production deploy, and a named human's confirmation or approval. So the inventory cannot see those sentences go missing, and the stand-in lets the deletion through.

Verified on a worktree at HEAD: deleting the merge/deploy sentences from `orchestrator.md`, `release-manager.md` and `tech-lead.md` left every gate at exit 0. Before Phase 40, the same edit was a `FROZEN by structuralSections` finding that needed a disposition row a human reads. 40-SECURITY.md's T-40-13 mitigation ("the named-human sign-off ... sentences are inventory facts") is therefore wrong for the merge/deploy sentences: they are not inventory facts.

The stand-in stays in force through Phases 41 and 42 (`docs/audit/40-disposition-base-move.md`, "Scope end"), so this gap stays open while roles keep being edited.
**Fix:** Do one of these, or both:
```ts
// (a) check-diff-disposition.ts: keep the positional freeze on role `## Hard limits`. The stand-in
//     admits only clauses OUTSIDE a frozen region (the "no disposition row" arm), never a region hit.
if (
  source === "structuralSections" &&
  region === null &&                         // <- add: a clause inside `## Hard limits` still owes its row
  (textSource === undefined || textSource === "structuralSections") &&
  !positiveLiteralClauses.has(c.clause)
) { ... }

// (b) check-role-rules.ts: add the safety facts to the closed list, derived from `## Hard limits`
//     (and from `## Stop when` for the named-human stops), then re-derive the baseline at source_commit.
const MERGE_BAN = /\bnever merge\b|merge and deploy (?:stay|remain) with humans/i;
const DEPLOY_BAN = /\bnever deploy\b|production action is always human-confirmed|merge and deploy (?:stay|remain)/i;
const NAMED_HUMAN = /\bnamed human\b/i;
if (hardLimits.some((l) => MERGE_BAN.test(l))) facts.add("no-merge");
if (hardLimits.some((l) => DEPLOY_BAN.test(l))) facts.add("no-deploy");
if (unfencedLines.some((l) => NAMED_HUMAN.test(l))) facts.add("named-human");
```
Add a planted-mirror test that deletes "Never merge to a protected branch." from `orchestrator.md` and asserts the gate goes red.

### CR-02: The Orchestrator's lean close `In UAT → Done` no longer needs a human merge or the named-human UAT sign-off

**File:** `agent-factory/roles/orchestrator.md:68`
**Issue:** The old text was "`… → Done` — closes a ticket once merged (and released, in enterprise mode)". The new text is "You own `In UAT → Done`, the lean-mode close, once `agent-factory/checklists/definition-of-done.md` holds." The lean Definition of Done (`agent-factory/checklists/definition-of-done.md`) has no "merged" item and no human sign-off item. An Orchestrator following its role can therefore move a ticket out of acceptance to `Done` before a human has merged the PR, and without the named human's acceptance. That contradicts three places:
- the seed board's Done column says "merged + released (or merged, lean)" (`agent-factory/seed/memory-bank/plans/board.md:92`);
- Workflow 06 makes the move to Done conditional on "Once the named human signs off" (`agent-factory/workflows/06-uat-pack.md:31, 49`);
- `uat-planner.md:48` says "When a result is ambiguous or unmet, stop and leave the ticket in `In UAT` for a named human". The Orchestrator's close ignores that hold.

Moving the ticket to the Orchestrator was approved (D-33). Losing the human conditions was not. The partition guard cannot catch this, because it checks who owns the pair, never the condition attached to it.
**Fix:**
```markdown
You own `In UAT → Done`, the lean-mode close, once the named human has signed off the UAT scenarios
(`checkpoint: sign_off_acceptance`), a human has merged the PR, and
`agent-factory/checklists/definition-of-done.md` holds.
```
Also add "merged by a human" to the lean Definition of Done, matching the board's Done entry. Align Workflow 06 line 31 so it names the Orchestrator as the owner of the lean close.

## Warnings

### WR-01: The board-move partition guard admits moves that skip gates

**File:** `scripts/check-role-rules.ts:507-519`
**Issue:** Rule 4 skips any pair whose from-column the claiming role owns (`if (fromOwner === r) continue;`). It also skips any pair into the terminal column claimed by the terminal column's owner (`if (p.to === model.terminal && r === terminalOwner) continue;`). No rule constrains the `to` column. Measured with `checkPartition` over the live claims plus one planted pair, each of these returns zero findings:
- `software-engineer.md` claiming `In Development → Done` (skips review, security and UAT);
- `orchestrator.md` claiming `In Review → Done` or `Blocked → Done`;
- `qe-e2e.md` claiming `In Review → Ready to Release` (skips UAT).

D-33 says the Orchestrator's lean close "names its from-column". The guard admits every from-column. The header says the moves "partition the seed board's flow", which overstates what is asserted.
**Fix:** Allow a pair from an owned column only when its target is the next flow column, or a target declared per role (as `BOARD_MOVE_EXCEPTIONS` does for the Tech Lead). Narrow the terminal exemption to an explicit list of allowed close pairs, `{orchestrator.md: In UAT → Done}`. Add planted-mirror red cases for the three pairs above.

### WR-02: In lean mode, two roles exit `In UAT` with conditions that do not exclude each other

**File:** `agent-factory/roles/uat-planner.md:38, 49`; `agent-factory/roles/orchestrator.md:68`; `agent-factory/workflows/06-uat-pack.md:31`
**Issue:** The UAT Planner owns `In UAT → Ready to Release` with no mode condition, and its done stop says "the Release Manager takes it". But the Release Manager activates only on `mode=enterprise` or an explicit release request (`release-manager.md` `## Activates when`). The Orchestrator owns `In UAT → Done` in lean mode. So in lean mode a signed-off ticket can go either way. If the UAT Planner moves it, it sits in `Ready to Release` with no lean owner. Workflow 06 still says the UAT Planner moves it "directly to `Done` in lean mode", a third version. The 40-10 summary records Workflow 06 as deliberately untouched, but the roles and the workflow now disagree.
**Fix:** Make the UAT Planner's move enterprise-only ("in `mode: enterprise`, once the named human signs off ... `In UAT → Ready to Release`"). Say that in lean mode it leaves the signed-off ticket in `In UAT` for the Orchestrator's close. Update Workflow 06 lines 31 and 49 to match.

### WR-03: New `## Stop when` bullets imply backward board moves that no role owns

**File:** `agent-factory/roles/architect-design.md:50`, `system-analyst.md:43`, `uat-planner.md:47`, `security-nfr.md:51`, `qe-e2e.md:48`, `compliance-officer.md:49`, `ba-pm.md:50`
**Issue:** These bullets say "return the ticket to the System Analyst / BA/PM" or "hand the ticket back to the Software Engineer". None of those roles carried this text before Phase 40. No role claims the matching backward pairs (`In Design → In Analysis`, `In Analysis → Backlog`, `In UAT → Backlog`, `In Security/NFR → In Development`, `In Review → In Development`). The bullets never say whether the ticket changes column. An agent can read "return the ticket" as a move. That move would have no owner, which breaks the one-owner rule the partition guard exists for. Or it can leave the ticket in place, which makes "return" misleading.
**Fix:** Pick one reading per bullet and state it, for example: "report `BLOCKED`, add a `## Blocked` bullet naming the System Analyst, and leave the ticket in `In Design`". If a real backward move is intended, claim it in `## Board moves` and add it to the partition model.

### WR-04: Human-stop rules moved out of the frozen `## Hard limits` region into `## Stop when`, which nothing freezes

**File:** `agent-factory/roles/tech-lead.md:55-56`; `compliance-officer.md:49-50`; `installer.md:47`; `software-engineer.md:69`
**Issue:** Before Phase 40, these were `## Hard limits` sentences, frozen by D-01 source (b): the Tech Lead's "Stop for a named human after three disputed rounds ... before a second escalation ... before a fourth hand-off", the Compliance Officer's "escalate genuine legal questions to a named human" and "mark ... `BLOCKED`", the Installer's "When detection is ambiguous, stop and ask", and the Software Engineer's "Stop and hand back if scope grows". `FROZEN_SECTION_ANCHORS` freezes only role `## Hard limits`, so once the D-30 stand-in ends, edits to these rules still need no companion row. `tier-kit-text.test.ts` pins some of the Tech Lead wording, but not the Compliance, Installer or Software Engineer stops.
**Fix:** Add `{ corpus: "roles", heading: "## Stop when", subpath: ROLES_SUBPATH, expected: ROLE_COUNT }` to `FROZEN_SECTION_ANCHORS`, or move the named-human stops back into `## Hard limits`.

### WR-05: The pre-rewrite baseline can be laundered with one command, and the equality test stays green

**File:** `scripts/check-role-rules.ts:664-680`; `scripts/check-role-rules.test.ts:184-206`
**Issue:** `--write-baseline` overwrites `docs/audit/40-role-rule-inventory.json` at any time. It records `source_commit = git rev-parse HEAD` but derives facts from the working tree, so a dirty tree records facts that are not at that commit. The only integrity test re-derives at whatever `source_commit` the file names. So re-running `--write-baseline` at a later HEAD, after facts were lost, forgives every loss and passes the test. Nothing ties `source_commit` to the Phase 40 start commit that D-27 and D-30 name (`e8d7802…`, the `base_commit` in `00-base.md`). Separately, the `execFileSync("git", ...)` at line 676 sits outside any try/catch, so outside a git tree it dies with a stack trace instead of a named refusal.
**Fix:** In `check()` (and the test), assert that `baseline.source_commit` equals the `base_commit` read from `docs/audit/29-style-dispositions/00-base.md`, or a named constant. Make `--write-baseline` refuse when the baseline file already exists or the tree is dirty. Wrap the `git rev-parse` call and report it through `fail()`.

### WR-06: The base move retired 23 undispositioned workflow safety-section changes that nobody read

**File:** `docs/audit/40-disposition-base-move.md` ("The 721 findings this move retires"); `docs/audit/29-style-dispositions/00-base.md:2`
**Issue:** D-30 says "Frozen safety clauses in non-role files stay verbatim". But moving the base from `4d2b8f0` to `e8d7802` retired 444 non-role findings with no review. That includes 23 workflow `## Stop conditions` / `## Commit` clauses reported as `FROZEN by structuralSections`. Those are exactly the non-role safety sections D-30 says it protects. The record gives only counts and a reproduce command, not the 23 clauses, so no human has read whether those Phase 30-39 rewordings kept their permission. The README calls moving the base "deleting the evidence", and that is what happened here for non-role files.
**Fix:** Run the recorded reproduce command and list the 23 workflow frozen-section findings by file, line and clause in `40-disposition-base-move.md`. Get a named human disposition for each, using the same row format as the other disposition files.

## Info

### IN-01: Shipped kit text cites internal planning ids and describes blocks that no longer exist

**File:** `agent-factory/writing-profile.md:8, 302, 304`
**Issue:** These kit files ship to host repositories:
- line 8 cites "PLAIN-01";
- line 302 says "the fenced blocks restate rather than compress", about blocks that were deleted;
- line 304, "Role bodies join the governed surfaces of this profile in plan 40-10.", reads as future work and cites an internal plan id.
**Fix:** State the current fact without plan ids ("Role bodies are a governed surface of this profile; see the table above"), and drop or rephrase the sentence about fenced blocks.

### IN-02: The fact parser and the partition parser read `→` differently

**File:** `scripts/check-role-rules.ts:207-212` vs `:425-440`
**Issue:** `deriveRoleFacts` splits a code span on a bare `→`, while `claimedPairs` needs `" → "` with spaces. A span written `` `In UAT→Done` `` yields `board-from:In UAT`, but no partition claim. The result is a confusing rule 2 or rule 3 finding instead of a parse finding.
**Fix:** Use one span parser for both, and report a span that holds `→` but does not parse as a pair.

### IN-03: The fixture comment still says "8 prefix-matched section checks"

**File:** `scripts/fixtures/good/agent-factory/roles/ba-pm.md:3-4` (and the same header in every fixture role)
**Issue:** The validator now checks 9 prefixes. The fixtures also still carry the retired `## Caveman prompt` heading and the old suffixed headings. The validator accepts both, but they no longer show the shipped shape.
**Fix:** Update the comment to 9. Optionally drop `## Caveman prompt` from the `good` fixture.

### IN-04: The gate checks `role_standin` only for form, not for the expected value, and ignores duplicates

**File:** `scripts/check-diff-disposition.ts:300-301, 2211-2216`
**Issue:** Any canonical `scripts/<kebab>.js` passes. On a worktree, `role_standin: scripts/is-entry.js` exited 0 and admitted 1128 role clauses while `check-role-rules.js` was red. A second `role_standin:` line is not refused; the first canonical match wins. The value is pinned only by `uat-gate-exit-contract.test.ts`, and CI runs `check-role-rules.js` directly, so the overall build would still go red. The gate alone does not fail closed on a substituted script.
**Fix:** In `readRoleStandin`, compare the value against a `ROLE_STANDIN_SCRIPT = "scripts/check-role-rules.js"` constant, and refuse more than one `role_standin:` line.

---

_Reviewed: 2026-11-01T18:01:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
