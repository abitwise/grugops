---
phase: 40-plain-language-role-rewrite
verified: 2026-11-02T15:20:00Z
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
  - "agent-factory/checklists/definition-of-done.md"
  - "agent-factory/roles/orchestrator.md"
  - "agent-factory/roles/uat-planner.md"
  - "agent-factory/workflows/06-uat-pack.md"
  - "docs/audit/40-disposition-base-move.md"
  - "docs/audit/40-role-rule-inventory.json"
  - "scripts/check-diff-disposition.ts"
  - "scripts/check-role-rules.ts"
covered_digest: "v3:sha256:6fa1d4c02d25eeac64b7f2366444ad1eeafd44ea65cd4db7ebb29910b3a368d3"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/7
  gaps_closed:
    - "Gap 1 (deletion half): deleting the Orchestrator, Release Manager or Tech Lead merge/deploy sentence now turns check-role-rules and check-diff-disposition red (40-11, 40-12)"
    - "Gap 1 (WR-04): role `## Stop when` is a fourth frozen section anchor (40-12)"
    - "Gap 2: the Orchestrator lean close names the named-human sign-off, a human merge and the lean DoD; lean DoD gained 'the PR merged by a human'; UAT Planner forward move is enterprise-only (40-13)"
    - "WR-05 baseline laundering, WR-06 named-human read of 31 retired findings (accept-all, Olger), IN-01, IN-03, IN-04 (40-11, 40-12, 40-15, 40-16)"
  gaps_remaining:
    - "A safety sentence reworded to reverse its rule while keeping its token passes every gate (new CR-01 of the incremental review)"
    - "Workflow 06 line 33 still says the lean path straight to Done is unchanged, and its dial text conflicts with the Orchestrator's unconditional sign-off (new WR-03)"
  regressions: []
gaps:
  - truth: "The rewrite keeps every rule that holds the factory safe, and the D-30 stand-in stays mechanical and fails closed (phase goal clause; PLAIN-03 'still holds'; plan prohibition 'MUST NOT let the D-30 stand-in become a blanket bypass')"
    status: partial
    reason: "Deletion is now guarded, reword-to-reverse is not. Reproduced on a shared clone of HEAD (never the real tree): changing agent-factory/roles/orchestrator.md:77 'Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans.' to 'Never merge to a protected branch until the gate is green; then merge it yourself. Never deploy to production without a green gate.' leaves check-role-rules --check, check-diff-disposition ('1137 role clause(s) admitted by the role-rule inventory stand-in'), check-foundation-guards, check-imperative-lexicon, check-banned-claims, validate-agent-factory, adapters-freshness, catalog-freshness, check-claim-anchors and the 182-test tier-kit-text file all at exit 0 / green. The same edit was a FROZEN finding before Phase 40. Each safety fact is a substring test (`/\\bnever merge/i` etc.), so a sentence that keeps its token and reverses its meaning keeps its fact. WR-01 compounds it: the baseline is pinned to the pre-rewrite commit e8d7802, so safety sentences ADDED during Phase 40 (orchestrator human-merge-deploy and named-human; named-human in architect-design, factory-coach, greenfield-mapper, incident-responder, installer) have no baseline entry; and the CR-02 close condition is pinned only by tokens (I dropped the sign-off condition from orchestrator.md:68 and :89 on the clone: check-role-rules, check-diff-disposition and all 182 tier-kit-text tests stayed green)."
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "Stand-in arm (about line 2048-2058) admits any changed role clause under a frozen section whenever check-role-rules exits 0, including clauses that carry a safety fact on either side"
      - path: "scripts/check-role-rules.ts"
        issue: "SAFETY_RULE_FACTS (about lines 113-139) are token tests; no meaning check; baseline cannot hold facts gained in Phase 40"
      - path: "scripts/tier-kit-text.test.ts"
        issue: "CR-02 pins check tokens (`named human`, `sign_off_acceptance`, `merged`), not the sentence or the Stop-when hold's two conditions"
    missing:
      - "Stop the stand-in admitting a changed clause that carries a safety fact on either side (export a carriesSafetyFact predicate from the SAFETY_RULE_FACTS table, use it in the stand-in arm, regenerate the DECIDER_MANIFEST hash), so a reword of a safety sentence owes a disposition row a human reads"
      - "Red case on a shared clone: the merge-ban reword above, stand-in key present, must exit 1 naming orchestrator.md"
      - "A second additive floor for safety facts gained in Phase 40 (committed at the end of Phase 40), or pin the orchestrator close sentence and the Stop-when hold by meaning"
  - truth: "A rule's meaning holds after the rewrite and lean mode has exactly one owner for the `In UAT` exit (PLAIN-03; D-28; gap 2 of the previous report asked Workflow 06 to be reconciled)"
    status: partial
    reason: "Plan 40-13 rewrote Workflow 06 line 31 and the Done condition but left line 33 in agent-factory/workflows/06-uat-pack.md: 'The lean path straight to `Done` is unchanged.' In the new design the lean ticket waits in `In UAT` and the Orchestrator closes it; 'straight' and 'unchanged' are both wrong, and the sentence reads as the UAT step moving a lean ticket directly to Done. The same paragraph says only the `In UAT -> Ready to Release` move stops at `sign_off_acceptance` and that a repository may lower the dial to `off` ('the dial changes who signs'), while orchestrator.md:68 requires the named human's sign-off with no dial condition; a lean repository that lowers the dial gets a role that never closes (fails safe, but contradicts the workflow). The WR-02 negative pins in tier-kit-text only look for the two old parentheticals, so this sentence slipped through."
    artifacts:
      - path: "agent-factory/workflows/06-uat-pack.md"
        issue: "Line 33: stale 'The lean path straight to `Done` is unchanged.'; dial text does not say what the lean close requires when `sign_off_acceptance` is `notify` or `off`"
      - path: "agent-factory/roles/orchestrator.md"
        issue: "Line 68: close requires the sign-off unconditionally; no statement for a lowered dial"
    missing:
      - "Replace the stale sentence with: in lean mode the Orchestrator's close to `Done` stops at the same checkpoint"
      - "State in both files what the lean close requires when `sign_off_acceptance` is `notify` or `off` (either 'the sign-off the checkpoint requires' in the role, or 'the lean close ignores the dial' in the workflow)"
      - "Add `straight to \\`Done\\`` to the WR-02 negative pin in scripts/tier-kit-text.test.ts"
deferred: []
human_verification: []
---

# Phase 40: Plain-language role rewrite Verification Report

**Phase Goal:** Every role reads as clear, compact English that says more about the role than today, within today's byte budget, and keeps every rule that holds the factory safe
**Verified:** 2026-11-02T15:20:00Z
**Status:** gaps_found
**Re-verification:** Yes, after gap closure (plans 40-11 to 40-16)

## Verdict in one paragraph

Both gaps of the first report are closed in the way that report asked for: deleting any of the three merge/deploy sentences I tried is now red in two gates, role `## Stop when` is frozen, the Orchestrator's lean close names its three human conditions, the lean DoD carries "the PR merged by a human", and the UAT Planner no longer competes for the lean exit. The rewrite itself (19 roles plus protocol, 59,814 B of 67,383 B, no caveman, nine-section skeleton, do-less rules, NOTICE, lean lens, governed surface) still holds and every gate is green. Two things keep the status at `gaps_found`. First, the new incremental review's CR-01 is real: the safety guard detects a deleted safety token, not a safety sentence reworded to say the opposite, and the D-30 stand-in then admits that edit with no human row. I reproduced it on a clone. Second, plan 40-13 left one stale sentence in Workflow 06 (line 33) that contradicts the lean close it was meant to reconcile. Both are small. The first is a design residual of the human-ratified D-30 stand-in, so the human may choose to accept it instead of closing it; that choice is recorded under Gap 1 below, but I cannot count a rule-reversing edit passing every gate as "fails closed", so I report it as a gap, not as a pass.

## What I re-checked against the previous report

| Previous gap / item | Re-check on HEAD (clone, never the real tree) | Result |
|---|---|---|
| Gap 1, delete Orchestrator merge ban | `check-role-rules --check` exit 1, `check-diff-disposition` exit 1 | CLOSED |
| Gap 1, delete Release Manager 'Deploy only after a named human approves; ... Never deploy to production yourself.' | both exit 1 | CLOSED |
| Gap 1, delete Tech Lead 'Merge and deploy stay with humans.' | both exit 1 | CLOSED |
| Gap 1, Release Manager rewritten to 'Deploy to production yourself when the gate is green' (drops the `never deploy` token) | both exit 1 | CLOSED for this form |
| WR-04: named-human stops outside a frozen region | `## Stop when` is the fourth `FROZEN_SECTION_ANCHORS` entry, 19/19 resolved (40-12; `check-diff-disposition.test.ts` green) | CLOSED |
| Gap 2: lean close lost 'once merged' | `orchestrator.md:68` now: 'Close only after the named human signs off acceptance (`checkpoint: sign_off_acceptance`), a human merged the PR and `agent-factory/checklists/definition-of-done.md` holds.' `## Stop when` holds the ticket in `In UAT` until merge and sign-off. Lean DoD has 'the PR merged by a human; agents never merge'. UAT Planner: enterprise-only `In UAT → Ready to Release`, lean 'leave the ticket in `In UAT` for the Orchestrator'. | CLOSED in the role, DoD and UAT Planner; Workflow 06 line 33 left stale (Gap 2 below) |
| WR-05 baseline laundering | writer reads git objects at `PHASE_40_START_COMMIT`; `check()` refuses a foreign `source_commit`; re-derive equality test green; baseline 213 facts at e8d7802 | CLOSED (see IN-01 for the residual) |
| WR-06 named-human read | `docs/audit/40-disposition-base-move.md`: 0 pending cells, 31 `accepted by Olger`, `Read by: Olger, 2026-11-02`, verbatim reply "accept-all, Olger" | CLOSED |
| WR-01 (first review) partition admits any `to` column | rule 4 narrowed to next flow column, outside-flow column or declared pair (`D33_NON_FORWARD_PAIRS`); partition 0 findings over 19/19; tests green | CLOSED for the canonical `→` spelling (new WR-02 below for `->`) |
| IN-01, IN-03, IN-04 (first review) | 176 fixture headers carry no count and `validate.test.ts` pins it; writing-profile lines stated without plan ids; `role_standin` pinned to `scripts/check-role-rules.js` and counted | CLOSED |

## Goal Achievement

### Observable Truths (ROADMAP success criteria plus PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / PLAIN-01: no role carries a caveman block; voice constraint, section list, guards, writing profile, C-28-003 and CLAUDE.md changed together | VERIFIED | `grep -rli caveman agent-factory/roles` returns 0 files. Inverted guard, corpus-total and `ROLE_CEILINGS` cases: `check-foundation-guards.test.ts -t "caveman\|corpus total\|ROLE_CEILINGS"` 18 passed. Unchanged since the first report. |
| 2 | SC2a / PLAIN-02: all 19 roles and the protocol state goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than before | VERIFIED | Validator (`validate.test.ts`, with the 176 reworked fixture headers) green; nine-section skeleton; per-role fact counts after >= before in `check-role-rules --check`. The two roles touched by the gap round (orchestrator, uat-planner) re-read in full: goal, trigger, inputs, outputs, moves, limits and stops are all nameable from the file alone. |
| 3 | SC2b / PLAIN-03: the pre-rewrite inventory (no-fabrication, `UNKNOWN - verify`, WF16/WF18 pointers, absent-config fallback, board-move ownership as a partition) still holds, in anchor token and meaning | FAILED (partial, narrower than before) | Token facts and partition hold (`check-role-rules --check` exit 0, 0 partition findings, 213 baseline facts, plus 12 safety facts). Meaning: the Orchestrator lean close is restored. Remaining: Workflow 06 line 33 contradicts it (Gap 2), and a rule-reversing reword of a safety sentence is admitted (Gap 1). |
| 4 | SC3 / PLAIN-04: role files within 67,383 B, a guard fails above it, per-role ceilings | VERIFIED | `wc -c agent-factory/roles/*.md` = 59,814 B (the gap round added about 309 B to orchestrator, uat-planner and the DoD; headroom 7,569 B). Guard and ceiling tests pass; plan 40-13 compacted its wording to fit the corpus-growth cases rather than raise a ceiling. |
| 5 | SC4 / PLAIN-05 and PLAIN-06: do-less rules, MIT attribution, no borrowed numbers; PR checklist lean lens | VERIFIED | Unchanged since the first report; `check-banned-claims` exit 0. NOTICE and `agent-factory/NOTICE` present. REQUIREMENTS.md still shows PLAIN-05 and PLAIN-06 as unchecked and "Gaps Found"; that is bookkeeping from the first round, not a code fact (see Requirements Coverage). |
| 6 | SC5 / PLAIN-07: role text is a governed surface; lexicon and sentence gates pass | VERIFIED | `check-imperative-lexicon` exit 0; its test file green in the 641-test targeted run. |
| 7 | Adapters and catalog regenerate unchanged from the role text | VERIFIED | `adapters-freshness` exit 0, `catalog-freshness` exit 0, `adapter-byte-baseline.test.ts` green; `npm run freshness` 89 committed `.js` match a rebuild; `npm run freshness:hook-manifest` 1 decider, 13 module hashes match; `tsc --noEmit` exit 0. |

**Score:** 6/7 truths verified. 0 present-but-behavior-unverified. (The phase-goal safety clause is carried inside truth 3, as in the first report.)

### Gap 1 in detail: the guard sees deletion, not reversal

| Probe on a shared clone of HEAD (clone removed from scope; real tree untouched) | check-role-rules | check-diff-disposition | other gates + tier-kit-text |
|---|---|---|---|
| Control: delete the Orchestrator merge-ban sentences | exit 1 | exit 1 | n/a |
| Delete Release Manager deploy sentence | exit 1 | exit 1 | n/a |
| Delete Tech Lead 'Merge and deploy stay with humans.' | exit 1 | exit 1 | n/a |
| Delete Release Manager's last Stop-when bullet (hand production action to a named human) | exit 0 | exit 0 | n/a; line 46 still carries the rule, so this is redundant text, not a loss |
| Reword Orchestrator merge ban to 'Never merge to a protected branch until the gate is green; then merge it yourself. Never deploy to production without a green gate.' | exit 0 | exit 0 ('1137 role clause(s) admitted ... stand-in') | all exit 0; vitest on check-role-rules, check-diff-disposition, adapter-byte-baseline and lexicon: 261 of 262 pass, the one failure is `check-role-rules.test.ts` "deleting the Orchestrator's merge ban on a mirror" which cannot find its anchor sentence in the mutated file (a test fixture dependency, not a guard) |
| Drop the sign-off from the Orchestrator close (orchestrator.md:68, :89) | exit 0 | exit 0 | `tier-kit-text.test.ts` 182 passed |

Severity weighing, stated so it is not overstated: the stand-in is a human-ratified decision (D-30) and 40-01's own must_have says a reworded role Hard-limits sentence is admitted when the inventory passes; `AGENTS.md` repeats the merge/deploy rule; and the git host is the hard floor named in CLAUDE.md. The rule text is correct and complete today (verified above). Against that: the plan prohibits the stand-in becoming a blanket bypass, the pre-Phase-40 freeze caught exactly this edit, and the review rates it critical. The remedy is cheap and located in one arm of one script. If the human prefers to accept this residual as part of D-30, that is a decision to record as an `overrides:` entry with a name and date; I do not make it for them.

### Reviewer findings weighed

| Finding | Decision | Why |
|---|---|---|
| CR-01 (new) | Gap 1 | Reproduced independently on a clone, as above. |
| WR-01 (new) | Folded into Gap 1 | Reproduced (sign-off condition removable, tier-kit-text 182 green); the six-role claim (facts gained in Phase 40 have no baseline) matches the baseline being pinned at e8d7802. |
| WR-03 (new) | Gap 2 | Line 33 is in the file verbatim; it contradicts the lean close the previous gap asked to be reconciled. |
| WR-02 (new) | Warning, not scored | Reproduced: adding 'You own `In Development -> Done` ...' to `software-engineer.md` `## Board moves` leaves check-role-rules and check-diff-disposition at exit 0. The shipped roles all use the canonical `→`, so no current rule is wrong; it is guard strength. Worth closing with the same round. |
| IN-01, IN-02, IN-03 (new) | Info | `check()` trusts the JSON contents (equality is tested in vitest, not in the CLI gate); stale header text; `ls-tree` path roots. None changes a stated must-have. |

Disposition note: `40-REVIEW-DISPOSITION.md` lists all seven new findings as `open`; the previous round's decisions for the reused ids are in git at `dafa5f3c`.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/roles/*.md` (19) + `_role-switch-protocol.md` | Plain-English roles, nine-section skeleton | VERIFIED | 59,814 B total, wired to validator, adapters and catalog (0 byte differences). |
| `scripts/check-role-rules.ts` / `.js` | Inventory, 12 safety facts, partition rules 1-6 | VERIFIED (limited) | Exit 0; red on deletion of any safety token; token-only (Gap 1). |
| `docs/audit/40-role-rule-inventory.json` | Baseline at `source_commit` e8d7802 | VERIFIED | 213 facts; equals a derivation out of git at e8d7802; cannot hold facts gained in Phase 40. |
| `scripts/check-diff-disposition.ts` / `.js`, `00-base.md` `role_standin` | D-30 base move, stand-in, `## Stop when` freeze, pin | PRESENT, over-permissive for fact-bearing rewords | Stop-when freeze 19/19; `role_standin` pinned to `scripts/check-role-rules.js`; manifest hash fresh. |
| `agent-factory/roles/orchestrator.md`, `uat-planner.md`, `checklists/definition-of-done.md` | Lean close with human conditions | VERIFIED | Text as quoted above. |
| `agent-factory/workflows/06-uat-pack.md` | Aligned with both roles | PARTIAL | Line 31 aligned; line 33 stale (Gap 2). |
| `docs/audit/40-disposition-base-move.md` WR-06 section | 31 rows with named-human disposition | VERIFIED | 31 accepted, 0 pending, `Read by:` line, verbatim reply. |
| `NOTICE`, `agent-factory/NOTICE`, `pr-review-checklist.md` lean lens | PLAIN-05/06 | VERIFIED | Unchanged. |

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `check-diff-disposition` stand-in | `check-role-rules.js --check` | `role_standin` in `00-base.md`, pinned value | WIRED |
| partition guard | seed board Exit-owner table | derived, plus `D33_NON_FORWARD_PAIRS` two-sided | WIRED (canonical `→` only) |
| `## Stop when` | frozen sections | `FROZEN_SECTION_ANCHORS` fourth entry | WIRED |
| Orchestrator lean close | `definition-of-done.md`, board Done definition | prose, tier-kit-text token pins | WIRED (token-level) |
| Orchestrator lean close | Workflow 06 line 33 | prose | NOT ALIGNED (Gap 2) |
| UAT Planner lean exit | Orchestrator close | prose, tier-kit-text pins | WIRED |

## Behavioral Spot-Checks and Gate Runs (run by me on a clone of HEAD 8b301010)

| Check | Result |
|---|---|
| `check-role-rules --check`, `check-diff-disposition`, `check-foundation-guards`, `check-imperative-lexicon`, `check-banned-claims`, `validate-agent-factory` | all exit 0 |
| `vitest run` check-role-rules, check-diff-disposition, tier-kit-text, validate, adapter-byte-baseline, check-imperative-lexicon | 6 files, 641 passed |
| `vitest run check-foundation-guards -t "caveman\|corpus total\|ROLE_CEILINGS"` | 18 passed |
| `npm run freshness`, `freshness:hook-manifest`, `tsc --noEmit` | green |
| Mutation probes (table above) | deletions red; reversal reword green (Gap 1); `->` move green (WR-02) |

I did not re-run the full suite; I rely on the orchestrator's run (10,867 tests, 21 failed, exactly the pre-existing set in 40-VALIDATION.md and deferred-items.md).

## Probe Execution

SKIPPED: no probe scripts declared in the phase PLANs.

## Requirements Coverage

| Requirement | Source plan(s) | Status | Evidence |
|---|---|---|---|
| PLAIN-01 | 40-01, 40-10, 40-15 | SATISFIED | Truth 1 |
| PLAIN-02 | 40-02..40-08, 40-13, 40-15 | SATISFIED | Truth 2 |
| PLAIN-03 | 40-01..40-08, 40-11..40-14, 40-16 | NOT FULLY SATISFIED | Truth 3, Gaps 1 and 2 |
| PLAIN-04 | 40-09, 40-13 | SATISFIED | Truth 4 |
| PLAIN-05 | 40-02, 40-03 | SATISFIED | Truth 5 |
| PLAIN-06 | 40-03 | SATISFIED | Truth 5 |
| PLAIN-07 | 40-10, 40-13, 40-15 | SATISFIED | Truth 6 |

All seven IDs appear in plan frontmatter and in REQUIREMENTS.md (lines 56-62, traceability 146-152); no orphaned requirement. Bookkeeping: REQUIREMENTS.md still shows PLAIN-05 and PLAIN-06 unchecked and "Gaps Found" although the first report found them satisfied and nothing has changed them; once the gaps above close, update PLAIN-03, PLAIN-05 and PLAIN-06 together.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| role files, scripts changed in the gap round | No `TBD`, `FIXME` or `XXX` marker | none | debt-marker gate clear |
| `agent-factory/workflows/06-uat-pack.md:33` | Stale sentence from a removed design | Warning | Gap 2 |
| `scripts/check-role-rules.ts` header | Says five rules and one declared list; there are six and two | Info | IN-02 |

## Human Verification Required

None open as a verification item. The WR-06 human checkpoint is done (reply recorded). One decision belongs to the human and is stated under Gap 1: close the fact-bearing-reword residual in the stand-in, or accept it explicitly as an override.

## Gaps Summary

1. **Safety-sentence guard is deletion-only (CR-01, WR-01).** A rule-reversing reword that keeps its token, and a dropped lean-close sign-off condition, pass every gate and test. Fix: keep the stand-in for ordinary prose but have it refuse a changed clause that carries a safety fact on either side; add the clone-based red case; add a second floor (or meaning-level pins) for the facts gained in Phase 40.
2. **Workflow 06 line 33 (WR-03).** Replace "The lean path straight to `Done` is unchanged" with the Orchestrator-close wording, state what the close needs when `sign_off_acceptance` is `notify` or `off`, and extend the negative pin.

Worth closing in the same round, not scored: WR-02 (`->` and prose board moves invisible to the partition guard), IN-01 (`check()` does not compare the JSON contents with git when the objects are reachable), IN-02, IN-03.

---

_Verified: 2026-11-02T15:20:00Z_
_Verifier: Claude (gsd-verifier)_
