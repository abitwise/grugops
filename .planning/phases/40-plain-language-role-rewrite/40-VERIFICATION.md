---
phase: 40-plain-language-role-rewrite
verified: 2026-11-03T11:05:00Z
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
  - "agent-factory/checklists/definition-of-done.md"
  - "agent-factory/roles/orchestrator.md"
  - "agent-factory/roles/uat-planner.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "docs/audit/29-style-dispositions/40-20.md"
  - "docs/audit/40-disposition-base-move.md"
  - "docs/audit/40-role-rule-inventory.json"
  - "hooks/hook-entry.ts"
  - "scripts/check-diff-disposition.ts"
  - "scripts/check-role-rules.ts"
  - "scripts/tier-kit-text.test.ts"
covered_digest: "v3:sha256:a0f0078e8cf487149cf458450138ac93a6e8cb1702f746385654de9e9eefc6c2"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Gap 1 (round-1 report): a safety sentence reworded to reverse its rule while keeping its token is now red in check-diff-disposition (40-19, 40-20, 40-21); reproduced on a shared clone: exit 1"
    - "Gap 2 (round-1 report): Workflow 06 line 33 no longer says the lean path goes straight to Done; it says the Orchestrator's close stops at the same checkpoint (40-17)"
    - "WR-01 (sign-off condition removable from the orchestrator close): exact-sentence pins; my mutation (sign-off and merge conditions dropped from orchestrator.md:68) turns tier-kit-text red (8 failed)"
    - "WR-02 (ASCII arrows and prose moves in the partition), IN-01 (baseline compared with git), IN-02, IN-03 (40-18, 40-19)"
    - "CR-01 named-human read: 36 safety-sentence rows accepted by Olger, 'accept-all, Olger', 2026-11-03 (40-20)"
  gaps_remaining:
    - "CR-03: a fact-free sentence added to a safety section is admitted with no row (reproduced)"
    - "CR-04: a disposition row pre-approves later deletion of the safety sentence it records (reproduced)"
  regressions: []
gaps:
  - truth: "The rewrite keeps every rule that holds the factory safe, and a changed safety sentence owes a disposition row a named human reads (phase goal clause; PLAIN-03 'still holds'; plan prohibition 'MUST NOT let the D-30 stand-in become a blanket bypass'; the CR-01 round-2 promise)"
    status: partial
    reason: "The role text is correct today and the reword-to-reverse edit from the previous report is now red. Two other weakening edits still pass check-role-rules and check-diff-disposition with exit 0 and no human row; both were reproduced on a shared clone of HEAD 2cdd10db (real tree untouched). (1) CR-03: inserting 'When the gate is green and the PR is small, merge it to main yourself and close the ticket.' directly under `## Hard limits` in orchestrator.md leaves both gates at exit 0 ('1080 role clause(s) admitted by the role-rule inventory stand-in', up from 1079). safetyHeld in check-diff-disposition.ts holds only a clause for which carriesSafetyFact is true, and every SAFETY_RULE_FACTS pattern is a prohibition or human-hold token, so a permission carries no fact and reaches the stand-in even inside the frozen section. Deferred-items (c) records this narrower residual as open and accepted for 'the stand-in while it holds', but it is the same outcome the CR-01 promise was written to prevent. (2) CR-04: deleting 'Deploy only after a named human approves; production action is always human-confirmed. ' from release-manager.md line 46 leaves both gates at exit 0. rowMatches (check-diff-disposition.ts ~1507) accepts a row when either its before or its after equals the clause, with no check of side or of whether the row's after still exists, so the 'kept word for word' row Olger accepted in 40-20.md now pre-approves the sentence's removal."
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "safetyHeld (~2071) is content-only: a clause inside a frozen safety section that carries no prohibition token is still offered to the stand-in; rowMatches (~1507) ignores side, so an identical-sides 'kept' row covers the removed side too"
      - path: "docs/audit/29-style-dispositions/40-20.md"
        issue: "Identical-before/after 'kept word for word' rows (installer.md 38, orchestrator.md 77, release-manager.md 46) double as deletion pre-approvals"
    missing:
      - "Hold by position as well as content: a role clause inside a frozen safety section (`## Hard limits`, `## Stop when`) is never offered to the stand-in (reviewer's fix: safetyHeld = declared && in scope && (region !== null || carriesSafetyFact(clause))), plus a mirror case adding a fact-free merge permission to `## Hard limits` that must be red"
      - "Make rowMatches side-aware (removed side matches only a row's before, added side only its after) and refuse a row whose non-empty after has no matching added clause; add the release-manager deletion as a red case"
      - "Or the human accepts both as residuals of the human-ratified D-30 stand-in by recording an overrides: entry with a name and date (this report does not make that decision)"
deferred: []
human_verification:
  - test: "Decide the CR-03 / CR-04 residual and the uat-planner dial question"
    expected: "Either one more narrow fix plan (gap round 3 of 4) for CR-03, CR-04 and WR-07, or an explicit override recorded against the gap above; and a one-line decision on whether the UAT Planner's sign-off follows the sign_off_acceptance dial (WR-09)"
    why_human: "Accepting a weaker guard is a safety-policy call that belongs to the named human; WR-09 touches frozen safety sentences that also need a disposition row"
---

# Phase 40: Plain-language role rewrite Verification Report

**Phase Goal:** Every role reads as clear, compact English that says more about the role than today, within today's byte budget, and keeps every rule that holds the factory safe
**Verified:** 2026-11-03T11:05:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap-closure round 2 (plans 40-17 to 40-21). Two of four allowed rounds are used.

## Verdict in one paragraph

Both gaps of the previous report are closed, and I checked each by running the edit that opened it. The reword-to-reverse edit on the Orchestrator merge ban now makes `check-diff-disposition` exit 1; Workflow 06 no longer calls the lean path "straight to Done"; dropping the sign-off and merge conditions from the Orchestrator close turns `tier-kit-text` red; and Olger read and accepted all 36 safety-sentence rows on 2026-11-03. The rewrite itself still holds: 19 roles plus the protocol at 59,803 B of 67,383 B, no caveman, do-less rules, NOTICE, lean lens, every gate green. The status stays `gaps_found` for one reason: the new review's two criticals, CR-03 and CR-04, are real. A safety-weakening edit (a merge permission added under `## Hard limits`; the Release Manager's named-human approval sentence deleted) still passes both gates with no human row. Neither is a defect in today's role text; both are holes in the guard that the CR-01 round-2 promise ("a reworded safety sentence owes a disposition row a named human reads") was meant to close. They are small to fix and the human may instead accept them; I do not make that call.

## Gap closure from the previous report

| Previous gap | Re-check (shared clone of HEAD 2cdd10db; real tree untouched) | Result |
|---|---|---|
| Gap 1: Orchestrator merge ban reworded to 'Never merge to a protected branch until the gate is green; then merge it yourself. Never deploy to production without a green gate.' passes every gate | `check-role-rules` exit 0 (as designed), `check-diff-disposition` exit 1, '2 finding(s)'; stand-in note names the safety hold | CLOSED for the reword form |
| Gap 1 (WR-01): sign-off / merge condition dropped from `orchestrator.md:68` | `check-role-rules` and `check-diff-disposition` exit 0, but `vitest run scripts/tier-kit-text.test.ts`: 8 failed, 185 passed | CLOSED (test pin) |
| Gap 2: Workflow 06 line 33 stale | line 33 now: "In lean mode, the Orchestrator's close to `Done` stops at the same checkpoint." and the dial text keeps "it never removes the human merge" | CLOSED |
| CR-01 named-human read of the rewrite's safety sentences | `docs/audit/29-style-dispositions/40-20.md`: 36 rows `accepted by Olger`, `Read by: Olger, 2026-11-03`, verbatim "accept-all, Olger"; 0 pending | CLOSED |
| WR-02 (`->`, prose moves), IN-01, IN-02, IN-03 | read in `check-role-rules.ts` (rule 6, git comparison at ~989, `-z` listing); tests green | CLOSED, with WR-07 below as a further spelling |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / PLAIN-01: no role carries a caveman block; constraint, section list, guards, profile, C-28-003, CLAUDE.md changed together | VERIFIED | `grep -rli caveman agent-factory/roles` = 0 files; `check-foundation-guards.test.ts -t "caveman\|corpus total\|ROLE_CEILINGS"` 18 passed; `check-foundation-guards` exit 0 |
| 2 | SC2a / PLAIN-02: all 19 roles and the protocol state goal, inputs, outputs, board moves, limits and stops in more detail | VERIFIED | `validate.test.ts` green; `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` ALL CHECKS PASSED; orchestrator.md and uat-planner.md re-read in full |
| 3 | SC2b / PLAIN-03: the inventory (no-fabrication, `UNKNOWN - verify`, WF16/WF18, absent-config fallback, board-move partition) still holds, and a changed safety sentence owes a row a named human reads | FAILED (partial) | Text and token facts hold (`check-role-rules` exit 0, partition 0 findings). Guard: CR-03 and CR-04 reproduced, see below |
| 4 | SC3 / PLAIN-04: role files within 67,383 B, guard, per-role ceilings | VERIFIED | `wc -c agent-factory/roles/*.md` = 59,803 B (headroom 7,580 B); ceiling and corpus-total tests pass |
| 5 | SC4 / PLAIN-05 and PLAIN-06: do-less rules with MIT attribution and no borrowed numbers; PR checklist lean lens | VERIFIED | `shortcut:` in software-engineer.md; ponytail MIT notice in `NOTICE` and `agent-factory/NOTICE`; lean lens in `pr-review-checklist.md`; `check-banned-claims` exit 0 |
| 6 | SC5 / PLAIN-07: role text is a governed surface | VERIFIED | `check-imperative-lexicon` exit 0 and its test file green |
| 7 | Adapters and catalog regenerate unchanged | VERIFIED | `adapters-freshness` 0, `catalog-freshness` 0, `npm run freshness` 89 `.js` match, `freshness:hook-manifest` 1 decider / 15 hashes match, `tsc --noEmit` 0 |

**Score:** 6/7. 0 behavior-unverified.

### Mutation probes (shared clone of HEAD 2cdd10db, `CHECK_ROOT` pointed at it)

| Edit | check-role-rules | check-diff-disposition | Reading |
|---|---|---|---|
| Control: no edit | 0 | 0 (1079 admitted) | green baseline |
| Orchestrator merge ban reworded to permit merge (previous Gap 1) | 0 | **1** | fixed |
| Release Manager line 46 reworded to 'Deploy to production yourself when the gate is green.' | 1 | 1 | caught (fact lost) |
| Orchestrator close: sign-off and merge conditions dropped | 0 | 0 | caught only by `tier-kit-text` (8 failed) |
| **CR-03**: add 'When the gate is green and the PR is small, merge it to main yourself and close the ticket.' under `## Hard limits` | 0 | **0** (1080 admitted) | **not caught by either gate** |
| **CR-04**: delete 'Deploy only after a named human approves; production action is always human-confirmed. ' from release-manager.md:46 | 0 | **0** (1079 admitted) | **not caught by either gate** |
| **WR-07**: add `` You own `In Development` → `Done`. `` to orchestrator.md `## Board moves` | 0 | **0** | **not caught** (rule 6 reads one code span, not two around an arrow) |

For CR-04 the Release Manager still says "Never deploy to production yourself." and line 52 still hands the production action to a named human, so the rule is not gone from the file; the specific approval sentence a human read is. For CR-03 the permission contradicts the merge ban two lines above it; a reading agent has conflicting instructions in the most sensitive section.

### Reviewer findings weighed

| Finding | Decision | Basis |
|---|---|---|
| CR-03 | Confirmed, scored under Gap 1 | Reproduced; `safetyHeld` read at `check-diff-disposition.ts:2071`, `SAFETY_RULE_FACTS` read at `check-role-rules.ts:120-145` |
| CR-04 | Confirmed, scored under Gap 1 | Reproduced; `rowMatches` read at `check-diff-disposition.ts:1507` |
| WR-07 | Confirmed, warning | Reproduced; the shipped roles all use the single-span `→` form, so no current rule is wrong |
| WR-08 | Confirmed as ambiguity, warning | `orchestrator.md:68` says "the sign-off that `checkpoint: sign_off_acceptance` requires" while `factory.config.md:207` defines that checkpoint as "Signing off acceptance when the criteria are missing, ambiguous or unmet". The human merge stays unconditional and Workflow 06 says the shipped config stops for a named human, so a default close still needs a human; the wording was the option the previous report offered. |
| WR-09 | Confirmed, warning, human decision | `workflow 06:33` says the dial governs the enterprise `In UAT -> Ready to Release` move; `uat-planner.md:38,45,50` and workflow line 31 require the named human with no dial. Fails safe (the move never happens), the same question is open in deferred-items (b). Lines 45/49 are frozen safety sentences and need a row. |
| IN-05, IN-06 | Confirmed from code, info | NOTE-and-pass when git objects are unreachable (`check-role-rules.ts:1007-1013`); `wip-limit`/`claim-cap`/`self-sign` patterns widened to the normalized spelling |
| IN-07 | Confirmed, info | hook manifest now covers 15 module hashes (13 before) because `check-role-rules.js` joined the closure |

`40-REVIEW-DISPOSITION.md` shows 8 open (CR-03, CR-04, WR-07, WR-08, WR-09, IN-05..IN-07); none is closed by a plan, so none is dispositioned.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/roles/*.md` (19) + `_role-switch-protocol.md` | Plain-English, nine-section skeleton | VERIFIED | 59,803 B; wired to validator, adapters, catalog |
| `scripts/check-role-rules.ts` / `.js` | Inventory, 12 safety facts, rule 6, IN-01/IN-03 | VERIFIED (limited) | exit 0; `carriesSafetyFact` exported; token-only, positive permissions invisible (CR-03) |
| `scripts/check-diff-disposition.ts` / `.js` | Stand-in narrowed to fact-free clauses | PRESENT, over-permissive (CR-03, CR-04) | reword-to-reverse red; addition and deletion-by-row green |
| `docs/audit/29-style-dispositions/40-20.md` | 36 rows read by a named human | VERIFIED | 36 accepted, 0 pending, `Read by` line, verbatim reply |
| `agent-factory/workflows/06-uat-pack.md`, `roles/orchestrator.md`, `roles/uat-planner.md`, `checklists/definition-of-done.md` | Aligned lean close | VERIFIED with WR-08/WR-09 wording warnings | lines quoted above |
| `hooks/hook-entry.ts` DECIDER_MANIFEST | Covers grown closure | VERIFIED | `freshness:hook-manifest` exit 0 |
| `NOTICE`, `agent-factory/NOTICE`, `pr-review-checklist.md` | PLAIN-05/06 | VERIFIED | unchanged |

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| stand-in arm | `carriesSafetyFact` | ES import, both admission points | WIRED (content-only) |
| 40-20 rows | stand-in rowMatches | before/after normalize to clause | WIRED but side-blind (CR-04) |
| Orchestrator close / hold | tier-kit-text pins | exact-sentence `leanCloseViolations` | WIRED (verified red on mutation) |
| Orchestrator close | Workflow 06 line 33 | prose | ALIGNED |
| UAT Planner sign-off | Workflow 06 dial text | prose | NOT ALIGNED at `notify`/`off` (WR-09, fail-safe) |
| hook decider | `check-role-rules.js` closure | `jsImportClosure` manifest | WIRED, fresh |

## Behavioral Spot-Checks and Gate Runs (HEAD 2cdd10db)

| Check | Result |
|---|---|
| `check-role-rules`, `check-diff-disposition`, `check-foundation-guards`, `check-imperative-lexicon`, `check-banned-claims`, `adapters-freshness`, `catalog-freshness` | all exit 0 |
| `VALIDATE_KIT_ROOT=. validate-agent-factory` | ALL CHECKS PASSED |
| `vitest run` check-role-rules, check-diff-disposition, tier-kit-text, validate, adapter-byte-baseline, check-imperative-lexicon | 6 files, 685 passed |
| `npm run freshness`, `freshness:hook-manifest`, `tsc --noEmit` | green |
| Mutation probes | table above |

I did not re-run the full suite; I rely on the orchestrator's run (10,888 passed, 21 failed, the pre-existing set in `deferred-items.md`; 4 e2e failures from local main ahead of origin/main).

## Probe Execution

SKIPPED: no probe scripts declared in the phase PLANs.

## Requirements Coverage

| Requirement | Source plan(s) | Status | Evidence |
|---|---|---|---|
| PLAIN-01 | 40-01, 40-10, 40-15 | SATISFIED | Truth 1 |
| PLAIN-02 | 40-02..40-08, 40-13, 40-15, 40-17 | SATISFIED | Truth 2 |
| PLAIN-03 | 40-01..40-08, 40-11..40-14, 40-16..40-21 | NOT FULLY SATISFIED | Truth 3 (CR-03, CR-04) |
| PLAIN-04 | 40-09, 40-13, 40-17 | SATISFIED | Truth 4 |
| PLAIN-05 | 40-02, 40-03 | SATISFIED | Truth 5 |
| PLAIN-06 | 40-03 | SATISFIED | Truth 5 |
| PLAIN-07 | 40-10, 40-13, 40-15, 40-17 | SATISFIED | Truth 6 |

All seven IDs appear in plan frontmatter and in REQUIREMENTS.md (lines 56-62; traceability 146-152); no orphans. REQUIREMENTS.md still shows all seven unchecked and "Gaps Found". I did not edit it (instructed). Once Gap 1 is closed or overridden, PLAIN-01..07 can be marked complete together.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| `scripts/check-diff-disposition.ts` ~2071, ~1507 | Content-only hold; side-blind row match | Blocker (Gap 1) | CR-03, CR-04 |
| `scripts/check-role-rules.ts` ~639 | Rule 6 blind to two spans around an arrow, "from X to Y" | Warning | WR-07 |
| orchestrator.md:68/89, uat-planner.md:38/45/50, workflow 06:31/33 | Dial wording differs between the files | Warning | WR-08, WR-09 |
| role files, scripts | No `TBD`, `FIXME`, `XXX` | none | debt-marker gate clear |

## Human Verification Required

1. **Decide the guard residual.** Close CR-03 and CR-04 in one narrow plan (two small edits in `check-diff-disposition.ts` plus red cases), or record an override against Gap 1 naming who accepts the residual. Deferred-items (c) already accepts the narrower form of CR-03 for the life of the stand-in; CR-04 is new and not recorded there.
2. **Decide WR-09.** Whether the UAT Planner's named-human sign-off follows `sign_off_acceptance` or stays unconditional. If it changes, lines 45 and 49 of `uat-planner.md` owe a row a named human reads.

## Gaps Summary

One gap, two reproduced causes. The safety guard now refuses a reworded safety sentence, which is what the human asked for on 2026-11-02, but it still admits a fact-free sentence added to a safety section (CR-03) and honors a "kept" row after the sentence it records is deleted (CR-04). The fix for CR-03 is a one-line change to the hold predicate; the fix for CR-04 is making `rowMatches` side-aware. Close WR-07 in the same plan if a round 3 is run; WR-08 and WR-09 are wording decisions that fail safe. Two of the four allowed gap-closure rounds are spent; a third narrow round or an explicit override are both within the cap.

---

_Verified: 2026-11-03T11:05:00Z_
_Verifier: Claude (gsd-verifier)_
