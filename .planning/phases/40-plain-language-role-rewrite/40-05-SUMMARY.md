---
phase: 40-plain-language-role-rewrite
plan: 05
subsystem: roles
tags: [plain-language, security-nfr, compliance-officer, release-manager, qe-e2e, incident-responder, board-moves, stop-when, clear-voice]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory baseline and check-role-rules; 40-02's approved reference role, D-02 byte targets and D-33 pair table
provides:
  - agent-factory/roles/security-nfr.md rewritten, owning `In Security/NFR → Ready for UAT`, with the severity map cited by path from Workflow 15
  - agent-factory/roles/compliance-officer.md rewritten, owning no move and carrying no arrow span
  - agent-factory/roles/release-manager.md rewritten, owning `Ready to Release → Done`, with the named-human deploy rule in `## Hard limits`
  - agent-factory/roles/qe-e2e.md rewritten, owning `In Review → In Security/NFR` and `In Review → Ready for UAT`, keeping the coding-rules line
  - agent-factory/roles/incident-responder.md rewritten, owning no move, with a named-human rule for every production action
  - a `## Stop when` section in each of the five roles (D-10); the coding-rules line dropped from all but QE/E2E (D-13)
affects: [40-06, 40-07, 40-08, 40-09, 40-10]

actuals:
  tokens: 8533    # chars/4 over the realized diff (git diff 938b7600..HEAD, 34,133 chars); the 5 role files after total 14,587 B
  tasks: 3
  commits: 3
plan_head_before: 938b760058fea8fda2944eb880ddcb67de9a1da5
plan_head_after: 771885e5d6826c4e4263beaeb5db292352a71ea4

tech-stack:
  added: []
  patterns:
    - "Gate-lane roles keep every safety rule as its own short never-do sentence in `## Hard limits`, in clear voice, and say who decides in `## Stop when`"
    - "When the how-detail already lives in the role's workflow or checklist, the role cites it by path and the workflow stays unchanged"

key-files:
  created: []
  modified:
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/incident-responder.md

key-decisions:
  - "All five roles fit their D-02 targets by rewording alone. The ASVS severity map is already in Workflow 15 step 3, the compliance item list in compliance-checklist.md and the release-record fields in Workflow 12, so each role cites them and no workflow or checklist was edited; no 40-05 rows file exists"
  - "Security/NFR's one board move fires only on `PASS` or `PASS_WITH_RISKS`; a `BLOCKED` result goes back to the Software Engineer in `## Stop when`"
  - "QE/E2E's `## One job` stays one line: generate-role-adapters.test.ts and generate-catalog.test.ts plant on the exact bytes '## One job\\nBreak the feature with tests and report the gaps.\\n' followed by the blank line, so a second line broke their LEVEL-axis case"
  - "Security/NFR keeps its 34-word `## Activates when` sentence byte-identical (RW-2, pinned by adapter-byte-baseline.test.ts), though the mirror sentence check reports it as WP-03; recorded, not reworded"
  - "No lexicon addition (D-32): every other mirror-check finding was fixed by rewording"

patterns-established:
  - "Gate-lane Stop when: one BLOCKED (or BLOCKED_NEEDS_FIX) return to the role that fixes it, one stop for a named human or the next gate, one done stop naming who takes the ticket"

requirements-completed: []

duration: ~32 min wall clock (13:37Z to about 14:09Z, most of it the full-suite run)
completed: 2026-11-01
---

# Phase 40 Plan 05: Gate-lane roles in plain English Summary

**Security/NFR, Compliance Officer, Release Manager, QE/E2E and Incident Responder follow the approved reference pattern in second-person plain English, each with a `## Stop when` section and its D-33 board moves as code spans. Every security, compliance and release safeguard stays in clear voice: findings never softened, accepted risks and severity overrides need a named owner, production action needs a named human. All five fit their byte targets (3,544, 2,724, 2,922, 2,628 and 2,869 B) with nothing moved into a workflow.**

## Performance

- **Duration:** about 32 minutes wall clock, most of it the full-suite run
- **Started:** 2026-11-01T13:37Z (after 938b7600)
- **Completed:** 2026-11-01
- **Tasks:** 3 of 3
- **Files modified:** 5 role files

## Phase 40 start commit

e8d7802ccf8ebf428a47703f6001327325e3aea3 (the inventory baseline and the disposition base both name it).

## Task Commits

1. **Task 1 (tracer): Security/NFR** - `b915418c` (docs)
2. **Task 2: Compliance Officer and Release Manager** - `af46564d` (docs)
3. **Task 3: QE/E2E and Incident Responder** - `771885e5` (docs)

## Measured bytes (D-02, D-06)

| Role | At e8d7802 | Plan base (938b7600) | After | Target |
|------|-----:|-----:|-----:|-----:|
| security-nfr.md | 5,022 | 4,877 | 3,544 | 3,800 |
| compliance-officer.md | 4,378 | 4,231 | 2,724 | 3,300 |
| release-manager.md | 4,166 | 4,006 | 2,922 | 3,150 |
| qe-e2e.md | 3,706 | 3,568 | 2,628 | 2,950 |
| incident-responder.md | 3,666 | 3,487 | 2,869 | 2,950 |

Workflows and checklists listed in files_modified, before and after (D-06): none was edited, so each is unchanged.

| File | Before | After |
|------|-----:|-----:|
| agent-factory/workflows/05-pr-quality-gate.md | 21,696 | 21,696 |
| agent-factory/workflows/12-release.md | 6,476 | 6,476 |
| agent-factory/workflows/13-incident.md | 4,090 | 4,090 |
| agent-factory/workflows/15-security-audit.md | 4,975 | 4,975 |
| agent-factory/checklists/security-nfr-checklist.md | 89,840 | 89,840 |
| agent-factory/checklists/compliance-checklist.md | 778 | 778 |
| agent-factory/checklists/release-readiness-checklist.md | 558 | 558 |
| agent-factory/checklists/observability-slo-checklist.md | 643 | 643 |

`docs/audit/29-style-dispositions/40-05.md` was not created: the plan makes it conditional on a watched workflow edit, and none happened.

## What each role now says

- **security-nfr.md (tracer).** RW-1 order, bare headings; `## Activates when` now follows `## One job`, and both first sentences are byte-identical, so adapters, catalog and skill twins did not change. `## Reads` opens with the config bullet (`mode`, `security.asvs_level`, `nfr`, `compliance_regime`) and the absent-config sentence, keeps the checklist filtered to `security.asvs_level`, and ends with the RW-4 pointer line. Six numbered items, one action each. `## Output` tags each finding "with its default severity from the map in `agent-factory/workflows/15-security-audit.md` step 3; the gate in Workflow 05 decides which severities block". `## Board moves`: "You own `In Security/NFR → Ready for UAT` when the result is `PASS` or `PASS_WITH_RISKS`." `## Hard limits`: find real risk, no gold-plating; "An accepted risk needs a named owner. Override a default severity only with a stated reason and a named owner."; report exactly as observed; "Never fake a passing gate, a clean scan, or a control that is not in place."; `UNKNOWN - verify`; "Write security findings in clear language; never soften one." Three Stop when items: a missing required fix (`BLOCKED`, back to the Software Engineer), a set `compliance_regime` or personal, financial, health or payment data (hand to the Compliance Officer), done (leave in `Ready for UAT` for the UAT Planner).
- **compliance-officer.md.** No board move and no ` → ` span (the traceability bullet lost its old `requirement→ticket` trail text too). Five numbered items: classify, map the personal-data flow, assess the regime's controls with every compliance-checklist item, map control to evidence, record controls and gaps. `## Output`: "The result is `BLOCKED` when a required control is missing." `## Hard limits`: do not invent legal advice; never fake a control, an evidence reference, a passing audit or a clean classification; `UNKNOWN - verify`; "Write compliance findings in clear, professional language; never soften one." Stop when: a missing control (`BLOCKED`, back to Security/NFR), a legal question (a named human), done (result to Security/NFR).
- **release-manager.md.** Eight numbered items, one action each, including the readiness checklist and "Record the named human approval or CAB record." `## Output` points at Workflow 12 for the release-record fields and keeps the three statuses. `## Board moves`: "You own `Ready to Release → Done` once a named human approves the deploy." `## Hard limits`: "Deploy only after a named human approves; production action is always human-confirmed. Never deploy to production yourself." plus the no-fabrication sentence and `UNKNOWN - verify`. Stop when: a failed checklist or no recorded approval (`BLOCKED`, held in `Ready to Release`), ready for production (a named human confirms the production action).
- **qe-e2e.md.** `## One job` is the single pinned line. Five numbered items. `## Board moves`: "You own `In Review → In Security/NFR` when the change triggers a Security/NFR review." and "You own `In Review → Ready for UAT` when the tests pass and no review is triggered." `## Hard limits` keeps test-behavior-not-change, the outer-acceptance-loop sentence, "Report results exactly as they ran, passes, failures and skips, with a reason for each skip.", "Never fake a result or a passing check.", `UNKNOWN - verify` and "Follow the 12 coding rules in `AGENTS.md`." Stop when: a product failure (`BLOCKED_NEEDS_FIX` per Workflow 05, back to the Software Engineer with the failing case), done (move per `## Board moves`).
- **incident-responder.md.** Seven numbered items from mitigation through hand-off of lessons to the Factory Coach. "You own no board move: you work after release, and your follow-up tickets enter the `Backlog` like any captured work." `## Hard limits`: never blame a person; no-fabrication; `UNKNOWN - verify`; "Never take a production action, a fix deploy or a rollback included, without a named human's confirmation." Stop when: a production action (a named human confirms), an unclear blast radius (mitigate first, postmortem after), done (tickets left in `Backlog` for BA/PM). The banned unconditional term from check-banned-claims does not appear.

## Recorded evidence

- check-role-rules after Task 3: PASS, 0 findings over 20/20 elements. Facts before/after: security-nfr 11/14, compliance-officer 10/12, release-manager 11/12, qe-e2e 9/12, incident-responder 8/10; the four D-13 removals print the intended-removal note.
- After each task: check-foundation-guards, validate-agent-factory, check-role-rules, check-diff-disposition, check-imperative-lexicon, check-kit-refs, check-banned-claims and the four freshness gates (adapters, catalog, skill-twins, host-entries) all exit 0.
- Task verify vitest sets: Task 1 and 2 (generate-role-adapters, adapter-byte-baseline, plus check-role-rules per the 40-04 lesson) 88 of 88 passed; Task 3 (validate, generate-catalog, kit-model, generate-role-adapters, adapter-byte-baseline, check-role-rules) 394 of 394 passed; check-foundation-guards.test.ts 337 of 338, the one failure being the known `~/` case.
- Mirror sentence check: clean for compliance-officer, release-manager, qe-e2e and incident-responder. security-nfr reports one line, the RW-2-pinned `## Activates when` sentence (WP-03, 34 words); see Deviations.
- The tracer feedback gate after Task 1 re-ran the automated verify (human_verify_mode is end-of-phase, the verify is automated-only); everything passed except that pinned-sentence mirror line, so Tasks 2 and 3 went ahead.
- Full suite (e2e excluded): run after 771885e5: 10,764 passed, 21 failed, 2 skipped. The 21 failures match the known set one for one (installer-fs-census 1, canonical-corpus 1, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5, and the `~/` case in check-foundation-guards). This plan added no new failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A second `## One job` line in qe-e2e.md broke two generator tests**
- **Found during:** Task 3 verify
- **Issue:** the LEVEL-axis cases in `scripts/generate-role-adapters.test.ts` and `scripts/generate-catalog.test.ts` replace the exact bytes "## One job\nBreak the feature with tests and report the gaps.\n" and then expect the historical grammar to capture only the planted appendix. The second line I had added ("You test against the ticket's acceptance criteria, ...") was captured too, so both failed.
- **Fix:** qe-e2e.md's `## One job` is back to its single line; the acceptance-criteria point moved into Responsibilities item 1. No test file was edited (RW-15).
- **Files modified:** agent-factory/roles/qe-e2e.md (before its commit)
- **Commit:** 771885e5

### Recorded conflicts (not fixed)

**2. RW-2 versus RW-6 on security-nfr.md's `## Activates when` sentence**
- The mirror sentence check reports `WP-03 [descriptive-sentence-too-long] 34 words, bound 25` on line 13, the first sentence of `## Activates when` ("A change touches a risk-bearing surface — the triggers: ..."). RW-2 keeps that sentence byte-identical, and `adapter-byte-baseline.test.ts` pins the adapter description built from it, so it cannot be reworded in this plan without regenerating adapters and moving the baseline. The Task 1 mirror verify therefore prints that one line; no other line in the file is flagged.
- **For the plan that joins roles to the governed corpus (PLAIN-07):** this sentence will be the only WP-03 finding left in this plan's five roles. Resolving it needs either a shorter trigger sentence with regenerated adapters and an updated byte baseline, or an exemption for the pinned first sentence.

### Notes against the plan's wording

- No workflow or checklist was edited, so `docs/audit/29-style-dispositions/40-05.md` does not exist. Workflow 15 step 3 already states the L1/L2/L3 severity map and the override rule, Workflow 05 owns `security.block_on`, compliance-checklist.md already lists every per-ticket compliance item, and Workflow 12 already lists the release-record fields.
- Some reason clauses were dropped rather than moved, because they explained rules the roles still state: "a failure mode with no log is the incident no one can diagnose later", "a release that ships on a forged signoff is the failure mode this gate exists to prevent", "a postmortem with no tickets is a story you will live again", "a skipped test left unexplained is a lie the next gate inherits" (now "with a reason for each skip"), and the "Section 13" spec reference in Security/NFR.
- Workflow 12 and Workflow 13 still carry caveman sentences ("grug cut release, not corner", "grug stop the bleeding first"). They are outside this plan's D-19 scope (only moved text is rewritten) and were left alone.

## Issues Encountered

- The untracked `~/` directory (not created by this plan, left alone as instructed) still fails `check-foundation-guards.test.ts` "every remaining floor item's LIVE COUNT is DERIVED": it is one of the 21 known failures.
- No sibling-caused red was seen: 40-06 and 40-07 had not started, so every whole-tree gate read only this plan's edits.

## User Setup Required

None.

## Next Phase Readiness

- PLAIN-02 and PLAIN-03 stay pending: PLAIN-02 needs the remaining roles and the protocol (40-06, 40-07), and PLAIN-03 needs 40-08's partition guard. They are not marked complete here.
- 40-08's partition guard will find QE/E2E's two pairs, Security/NFR's one and the Release Manager's one, all from the approved D-33 table, and no pair for the Compliance Officer or the Incident Responder.

## Self-Check: PASSED

- FOUND: the five role files; FOUND: commits b915418c, af46564d, 771885e5 (all ancestors of HEAD); measured commits since 938b7600: 3.
