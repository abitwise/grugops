---
phase: 40-plain-language-role-rewrite
verified: 2026-11-03T22:50:00Z
status: gaps_found
score: 6/7 must-haves verified
covered_files:
  - ".planning/phases/40-plain-language-role-rewrite/40-01-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-01-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-02-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-02-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-03-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-03-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-04-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-04-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-05-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-05-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-06-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-06-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-07-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-07-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-08-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-08-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-09-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-09-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-10-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-10-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-11-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-11-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-12-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-12-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-13-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-13-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-14-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-14-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-15-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-15-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-16-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-16-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-17-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-17-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-18-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-18-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-19-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-19-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-20-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-20-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-21-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-21-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-22-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-22-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-23-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-23-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-24-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-24-SUMMARY.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-25-PLAN.md"
  - ".planning/phases/40-plain-language-role-rewrite/40-25-SUMMARY.md"
  - "agent-factory/roles/orchestrator.md"
  - "agent-factory/roles/tech-lead.md"
  - "agent-factory/roles/uat-planner.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "docs/audit/29-style-dispositions/40-24.md"
  - "docs/audit/40-disposition-base-move.md"
  - "hooks/hook-entry.ts"
  - "scripts/check-diff-disposition.ts"
  - "scripts/check-role-rules.ts"
  - "scripts/tier-kit-text.test.ts"
covered_digest: "v3:sha256:14b53ec0a5b8164c8906a9bfde142b58e07613c58e3e1e3cb985c78a97e65fe6"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "CR-03 (round 2) in its reported form: a fact-free merge permission added directly under `## Hard limits` is now red in check-diff-disposition (reproduced on a shared clone: exit 1, 1 finding)"
    - "CR-04 (round 2) in its reported form: deleting the Release Manager approval sentence a 'kept' row recorded is now red (reproduced: exit 1, 1 finding)"
    - "WR-07 in its reported form: `` You own `In Development` → `Done`. `` under `## Board moves` is now red in check-role-rules (board-move partition, 1 finding)"
    - "WR-08, WR-09, IN-05: orchestrator.md:68 and Workflow 06:33 now say the lean close waits for the named human's sign-off at every dial value; shallow history is a FAIL"
    - "Named-human read of 309 rows in docs/audit/29-style-dispositions/40-24.md: 'accept-all, Olger', Read by Olger 2026-11-03 (40-25)"
  gaps_remaining:
    - "CR-05: a 'kept' row's `after` is bound to the file, not to the frozen section, so a `## Hard limits` sentence can be moved into an unfrozen section with zero findings (reproduced)"
    - "CR-06: a `# ` heading planted inside `## Hard limits` ends the frozen region and a permission below it is admitted with zero findings (reproduced)"
  regressions: []
gaps:
  - truth: "The rewrite keeps every rule that holds the factory safe, and a changed safety sentence owes a disposition row a named human reads (phase goal clause; PLAIN-03 'still holds')"
    status: partial
    reason: "The shipped role text is correct and every round-2 form of the bypass is closed. Two new bypasses of the same fixes pass check-role-rules, check-diff-disposition and validate-agent-factory with exit 0 and no human row; both were reproduced on a shared clone of HEAD d1177916 with the real tree untouched. (CR-05) Deleting 'Never make a structural decision, and never write production code. ' from `## Hard limits` in tech-lead.md and adding the same sentence under `## Trace updates` leaves both gates at exit 0 ('945 role clause(s) admitted', 0 findings over 24/24 elements): rowMatches matches the added clause through the row's `after` and never checks which section it landed in, so the 'kept word for word' row Olger accepted covers the demotion of a prohibition out of the frozen section. (CR-06) Inserting '# Notes' plus 'You may skip the written scores when the ticket is small.' after 'Merge and deploy stay with humans.' inside `## Hard limits` of tech-lead.md leaves all three gates at exit 0 ('946 admitted', up from 945) and directly contradicts 'Never pick a level without the written scores'; locateSection ends the frozen region at any unfenced `# ` or `## ` heading and checkHeadingOrder reads only `## ` lines. The same plant spelled `## Notes` is caught."
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "rowMatches / addedKeys (~1536-1546, ~1968-1974) match by attributionKey(file, clause) with no region; safetyHeld (~2150) relies on c.region, which a planted `# ` heading nulls"
      - path: "scripts/check-role-rules.ts"
        issue: "checkHeadingOrder (~848-873) filters on `## `; a second `# ` heading in a role file is never refused"
    missing:
      - "Region-aware row match: a removed frozen clause matches only when its row's `after` is still inside a frozen region (reviewer's CR-05 fix), plus a red mirror case moving a HARD_LIMIT_SENTENCE to an unfrozen section"
      - "Refuse a second `# ` heading in a role (`checkHeadingOrder`: exactly one `# Role: ` heading), plus a red case with the `# Notes` plant"
      - "Or the human records an overrides: entry accepting both as residuals of the D-30 stand-in (this report does not make that call)"
deferred: []
human_verification:
  - test: "Decide the CR-05 / CR-06 residual, and rule on WR-12 and WR-11"
    expected: "Either a fourth and last gap-closure round for CR-05, CR-06 (and ideally WR-10, WR-11, WR-12), or an explicit override recorded against the gap above with a name and date; and a ruling on whether the stand-in covers `_role-switch-protocol.md`"
    why_human: "Accepting a weaker safety guard is a safety-policy call that belongs to the named human. The cap allows four gap rounds, so a round 4 is the last"
---

# Phase 40: Plain-language role rewrite Verification Report

**Phase Goal:** Every role reads as clear, compact English that says more about the role than today, within today's byte budget, and keeps every rule that holds the factory safe
**Verified:** 2026-11-03T22:50:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap-closure round 3 (plans 40-22 to 40-25). Three of four allowed rounds are used.

## Verdict in one paragraph

The three round-2 criticals and their companions are closed in the form they were reported, and I re-ran each original mutation to check it. A fact-free merge permission under `## Hard limits` is now red, deleting the Release Manager's approval sentence is now red, and a two-span board move is now red. The rewrite itself holds: 19 roles plus the protocol at 59,793 B of 67,383 B, no caveman block, do-less rules with MIT attribution, lean lens, and every gate green on HEAD. The round-3 review's two criticals are real: I reproduced both in a scratch clone, and both reach `ALL CHECKS PASSED` with no human row. Neither is a defect in today's role text. They are holes in the guard that was built so that a safety sentence cannot be weakened without a named human reading the change. The status stays `gaps_found` for the same reason as round 2: the PLAIN-03 promise ("still holds", and a changed safety sentence owes a row a human reads) is only as strong as the guard. Each hole is small to fix, and the human may instead accept it as a residual of the D-30 stand-in. I do not make that decision.

## Gap closure from the previous report

| Previous gap | Re-check (shared clone of HEAD d1177916, `CHECK_ROOT` set; real tree untouched) | Result |
|---|---|---|
| CR-03: 'When the gate is green and the PR is small, merge it to main yourself and close the ticket.' under `## Hard limits` in orchestrator.md | `check-diff-disposition` exit 1, 1 finding (the position hold) | CLOSED for this form |
| CR-04: delete 'Deploy only after a named human approves; production action is always human-confirmed. ' from release-manager.md | `check-diff-disposition` exit 1, 1 finding | CLOSED for this form |
| WR-07: `` You own `In Development` → `Done`. `` under orchestrator `## Board moves` | `check-role-rules --check` exit 1, 'board-move partition: 1 finding' | CLOSED for this form |
| WR-08, WR-09: dial wording | orchestrator.md:68 says close "only after the named human signed off acceptance, a human merged the PR and ... definition-of-done.md holds"; Workflow 06:33 says the move waits for the named human "at every value of `sign_off_acceptance`" and the dial "never removes the human merge or the named human's sign-off" | CLOSED (see WR-11 for a leftover ambiguity) |
| Named-human read | `docs/audit/29-style-dispositions/40-24.md`: 309 rows `accepted by Olger`, `Read by: Olger, 2026-11-03`, verbatim "accept-all, Olger", no flagged row | CLOSED |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / PLAIN-01: no role carries a caveman block; constraint, section list, guards, profile, C-28-003, CLAUDE.md changed together | VERIFIED | `grep -rli caveman agent-factory/roles` = 0 files; `check-foundation-guards` exit 0 |
| 2 | SC2a / PLAIN-02: all 19 roles and the protocol state goal, inputs, outputs, board moves, limits and stops in more detail | VERIFIED | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` ALL CHECKS PASSED; `validate.test.ts` green; orchestrator.md, uat-planner.md, Workflow 06 lines 28-36 re-read |
| 3 | SC2b / PLAIN-03: the inventory (no-fabrication, `UNKNOWN - verify`, WF16/WF18, absent-config fallback, board-move partition) still holds, and a changed safety sentence owes a row a named human reads | FAILED (partial) | Text and token facts hold (`check-role-rules` exit 0). Guard bypassed by CR-05 and CR-06, reproduced below |
| 4 | SC3 / PLAIN-04: role files within 67,383 B, guard, per-role ceilings | VERIFIED | `cat agent-factory/roles/*.md \| wc -c` = 59,793 B (headroom 7,590 B); `check-foundation-guards` exit 0 |
| 5 | SC4 / PLAIN-05 and PLAIN-06: do-less rules, MIT attribution, no borrowed numbers; PR checklist lean lens | VERIFIED | `shortcut:` and `Not checked:` in software-engineer.md:50; ponytail MIT notice in `NOTICE:16-17`; "Lean lens (advisory)" in `pr-review-checklist.md:19`; `check-banned-claims` exit 0 |
| 6 | SC5 / PLAIN-07: role text is a governed surface | VERIFIED | `check-imperative-lexicon` exit 0 |
| 7 | Adapters, catalog and committed `.js` stay fresh | VERIFIED | `validate-agent-factory` passes; the four-file vitest run below is green; the reviewer's freshness runs (89 `.js` fresh, hook manifest matches) were not redone by me |

**Score:** 6/7. 0 behavior-unverified.

### Mutation probes (shared clone of HEAD d1177916; real tree untouched, clone discarded)

| Edit | check-role-rules | check-diff-disposition | Other | Reading |
|---|---|---|---|---|
| Control: no edit | 0 | 0 | | green baseline |
| Round-2 CR-03: permission under orchestrator `## Hard limits` | 0 | **1** | | closed |
| Round-2 CR-04: delete release-manager.md approval sentence | 0 | **1** | | closed |
| Round-2 WR-07: `` `In Development` → `Done` `` under `## Board moves` | **1** | n/a | | closed |
| Added permission directly after 'Merge and deploy stay with humans.' in tech-lead `## Hard limits` | 0 | **1** | | position hold works for this form |
| **CR-05**: delete 'Never make a structural decision, and never write production code. ' from tech-lead `## Hard limits`, add it under `## Trace updates` | 0 (945 admitted) | **0** (0 findings over 24/24) | | **not caught** |
| **CR-06**: `# Notes` + 'You may skip the written scores when the ticket is small.' inside tech-lead `## Hard limits` | 0 (946 admitted) | **0** (0 findings over 24/24) | `validate-agent-factory` exit 0 | **not caught** |

For CR-05, the prohibition survives in the file, but in a section nothing freezes, so a later edit can reword or delete it with no row. For CR-06, an agent reading tech-lead.md would see "Never pick a level without the written scores" and, two lines below, a permission to skip them, in the section that is supposed to be the hardest limit.

### Reviewer findings weighed

| Finding | Decision | Basis |
|---|---|---|
| CR-05 | Confirmed, scored under Truth 3 | Reproduced exactly as described (tech-lead.md); `rowMatches` / `addedKeys` read |
| CR-06 | Confirmed, scored under Truth 3 | Reproduced exactly as described (tech-lead.md); the `## Notes` spelling is caught, the `# Notes` spelling is not |
| WR-10 | Accepted on the review's evidence, warning | Rule 6 arm (d) false negatives on `⇒` / `⟶` in one span and on wrapped lines; I did not re-probe each spelling. No shipped role uses them, so no current rule is wrong |
| WR-11 | Confirmed, warning | Workflow 06:46 tags the missing-criteria stop `checkpoint: sign_off_acceptance`, `factory.config.md:207` defines the cell as "Signing off acceptance when the criteria are missing, ambiguous or unmet", and line 33 now says the dial "governs only how the Orchestrator records the lean close". Fails safe: every reading still stops for a human |
| WR-12 | Not re-reproduced, accepted on the review's evidence, warning | `ROLE_STANDIN_SCOPE` is `agent-factory/roles/`, which includes `_role-switch-protocol.md`; predates round 3; needs a named-human ruling |
| IN-08, IN-09, IN-10 | Accepted from code reading, info | Test-assertion and fallback nits |

`40-REVIEW-DISPOSITION.md` shows 8 open (CR-05, CR-06, WR-10, WR-11, WR-12, IN-08..IN-10) and 18 fixed or deferred of 28. The 5 round-2 items round 3 targeted (CR-03, CR-04, WR-07, WR-08, WR-09, IN-05) are marked fixed, and I confirmed that in the forms they were reported.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/roles/*.md` (19) + `_role-switch-protocol.md` | Plain-English, nine-section skeleton | VERIFIED | 59,793 B; wired to validator |
| `scripts/check-role-rules.ts` / `.js` | Inventory, safety facts, rule 6 | VERIFIED (limited) | exit 0; does not refuse a second `# ` heading (CR-06); arm (d) spelling gaps (WR-10) |
| `scripts/check-diff-disposition.ts` / `.js` | Stand-in narrowed, position hold, side-aware rows | PRESENT, bypassable (CR-05, CR-06) | the round-2 forms are red; region-blind row match and heading-sensitive region remain |
| `docs/audit/29-style-dispositions/40-24.md` | Rows read by a named human | VERIFIED | 309 accepted, read-by line, verbatim reply |
| `agent-factory/workflows/06-uat-pack.md`, `roles/orchestrator.md`, `roles/uat-planner.md` | Aligned close and sign-off | VERIFIED with WR-11 warning | lines quoted above |
| `NOTICE`, `pr-review-checklist.md` | PLAIN-05/06 | VERIFIED | unchanged |

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| stand-in arm | position hold (`c.region !== null`) | `safetyHeld` | WIRED, defeated by a planted `# ` heading (CR-06) |
| 40-24 rows | `rowMatches` | before/after normalize to clause, `addedKeys` | WIRED, side-aware since 40-24, region-blind (CR-05) |
| Orchestrator close | Workflow 06 line 33 | prose | ALIGNED on the human sign-off and merge; WR-11 on the dial scope |
| UAT Planner sign-off | Workflow 06 | prose | ALIGNED (unconditional at every dial value) |

## Behavioral Spot-Checks and Gate Runs (HEAD d1177916)

| Check | Result |
|---|---|
| `node scripts/check-role-rules.js`, `check-diff-disposition.js`, `check-foundation-guards.js`, `check-imperative-lexicon.js`, `check-banned-claims.js` | all exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `npx vitest run scripts/check-role-rules.test.ts scripts/check-diff-disposition.test.ts scripts/tier-kit-text.test.ts scripts/validate.test.ts` | 4 files, 641 passed |
| Mutation probes | table above |

I did not re-run the full suite. I rely on the orchestrator's note that the failing files hold only the recorded pre-existing failures (`deferred-items.md`: context-io set, `installer-fs-census`, `uat-gate-exit-contract`, floor-item case, and the e2e `uat-live` refusal while local main is ahead of origin/main). I did not independently check that the failure list is only that set.

## Probe Execution

SKIPPED: no probe scripts declared in the phase PLANs.

## Requirements Coverage

| Requirement | Source plan(s) | Status | Evidence |
|---|---|---|---|
| PLAIN-01 | 40-01, 40-10, 40-15 | SATISFIED | Truth 1 |
| PLAIN-02 | 40-02..40-08, 40-13, 40-15, 40-17 | SATISFIED | Truth 2 |
| PLAIN-03 | 40-01..40-08, 40-11..40-14, 40-16..40-25 | NOT FULLY SATISFIED | Truth 3 (CR-05, CR-06) |
| PLAIN-04 | 40-09, 40-13, 40-17 | SATISFIED | Truth 4 |
| PLAIN-05 | 40-02, 40-03 | SATISFIED | Truth 5 |
| PLAIN-06 | 40-03 | SATISFIED | Truth 5 |
| PLAIN-07 | 40-10, 40-13, 40-15, 40-17 | SATISFIED | Truth 6 |

All seven IDs are in REQUIREMENTS.md (lines 56-62, traceability 146-152); no orphans. REQUIREMENTS.md still shows them unchecked and "Gaps Found"; I did not edit it.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| `scripts/check-diff-disposition.ts` ~1536, ~1968, ~2150 | Region-blind row match; region lost to a planted `# ` heading | Blocker (Truth 3) | CR-05, CR-06 |
| `scripts/check-role-rules.ts` ~848 | Second `# ` heading not refused | Blocker (with CR-06) | CR-06 |
| `scripts/check-role-rules.ts` ~657 | Rule 6 arm (d) false negatives | Warning | WR-10 |
| `agent-factory/workflows/06-uat-pack.md:33,46` | Three scopes for `sign_off_acceptance` | Warning | WR-11, fails safe |
| `scripts/check-diff-disposition.ts:367` | Stand-in scope includes an uninventoried file | Warning | WR-12 |
| role files, scripts | No `TBD`, `FIXME`, `XXX` introduced | none | debt-marker gate clear |

## Human Verification Required

1. **Decide the guard residual.** Close CR-05 and CR-06 in one narrow plan (a region-aware `rowMatches`, a one-`# `-heading rule in `checkHeadingOrder`, and a red case each), ideally together with WR-10, WR-11 and WR-12, since a fourth round is the last the cap allows. Or record an override against the gap above that names who accepts the residual and when. Deferred-items already accepts the narrower "stand-in while it holds" residual; CR-05 and CR-06 are new and unrecorded there.
2. **Rule on WR-12.** Whether D-30 covers `_role-switch-protocol.md`. If yes, record it in `docs/audit/40-disposition-base-move.md`; if no, limit the stand-in scope.

## Gaps Summary

One gap, two reproduced causes, both bypasses of round-3 fixes. Round 3 closed the specific edits round 2 reported, and the round-3 disposition rows are side-correct and human-read. But each fix keys on one signal (content for CR-03, a clause string for CR-04) and a different spelling of the same weakening still passes: a prohibition moved into an unfrozen section (CR-05), and a heading that ends the frozen region (CR-06). The shipped role text is safe today, and no rule the factory depends on is missing from any role. The remaining risk is a later edit that weakens one, which is exactly what PLAIN-03 and the CR-01 promise say the guard prevents. The fixes are small and are specified in `40-REVIEW.md`. Three of four allowed gap rounds are spent.

---

_Verified: 2026-11-03T22:50:00Z_
_Verifier: Claude (gsd-verifier)_
