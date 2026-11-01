---
phase: 40-plain-language-role-rewrite
verified: 2026-11-01T18:12:00Z
status: gaps_found
score: 5/7 must-haves verified
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
  - "agent-factory/NOTICE"
  - "agent-factory/checklists/pr-review-checklist.md"
  - "agent-factory/roles/orchestrator.md"
  - "agent-factory/roles/release-manager.md"
  - "agent-factory/roles/software-engineer.md"
  - "agent-factory/roles/tech-lead.md"
  - "agent-factory/roles/uat-planner.md"
  - "docs/audit/29-style-dispositions/00-base.md"
  - "docs/audit/40-role-rule-inventory.json"
  - "scripts/check-diff-disposition.ts"
  - "scripts/check-foundation-guards.ts"
  - "scripts/check-role-rules.ts"
covered_digest: "v3:sha256:0d6a1a7b052f6d7b9d5facd6374d83450337ff5e1157852ccb3ac818b0e58626"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The rewrite keeps every rule that holds the factory safe (phase goal clause; PLAIN-03 'still holds'; D-30 'stays mechanical and fails closed')"
    status: partial
    reason: "The merge / deploy / named-human rule TEXT is present in every role today (verified). The GUARD that stops it being removed silently is gone for most of it. The D-30 stand-in admits any role clause, including every `## Hard limits` sentence, whenever check-role-rules exits 0, and the closed D-28 fact list has no merge, deploy or named-human fact. Reproduced here in a throwaway worktree: deleting the Orchestrator's 'Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans.', the Release Manager's 'Deploy only after a named human approves; ... Never deploy to production yourself.' and the Tech Lead's 'Merge and deploy stay with humans.' left check-role-rules --check, check-diff-disposition, check-foundation-guards, validate-agent-factory, check-imperative-lexicon and check-banned-claims all at exit 0. Only the Tech Lead sentence is caught, and only by a text pin in scripts/tier-kit-text.test.ts (not a gate). Before Phase 40 the same edits were FROZEN by structuralSections in check-diff-disposition. WR-04 compounds it: the human-stop rules (Tech Lead named-human stops, Compliance legal escalation, Installer stop-and-ask, Engineer scope hand-back) moved out of the frozen `## Hard limits` region into `## Stop when`, which FROZEN_SECTION_ANCHORS does not freeze."
    artifacts:
      - path: "scripts/check-diff-disposition.ts"
        issue: "Stand-in arm (about lines 1996-2007, 2091-2096) admits a clause inside a frozen role `## Hard limits` region when the inventory check passes"
      - path: "scripts/check-role-rules.ts"
        issue: "Closed fact list (D-28) has no no-merge, no-deploy or named-human fact; baseline docs/audit/40-role-rule-inventory.json therefore cannot see these deletions"
    missing:
      - "Keep the positional freeze on role `## Hard limits` for the stand-in (admit only clauses outside a frozen region), or add no-merge / no-deploy / named-human facts to the derived inventory and re-derive the baseline at source_commit"
      - "Planted-mirror test that deletes 'Never merge to a protected branch.' from orchestrator.md and asserts the gate goes red"
      - "Freeze `## Stop when` for roles (FROZEN_SECTION_ANCHORS) or move the named-human stops back into `## Hard limits`"
  - truth: "A rule's meaning, not only its anchor token, still holds after the rewrite (PLAIN-03; D-28 'anchor token plus the meaning')"
    status: failed
    reason: "agent-factory/roles/orchestrator.md:68 now reads 'You own `In UAT → Done`, the lean-mode close, once `agent-factory/checklists/definition-of-done.md` holds.' The pre-phase text was '`… → Done` — closes a ticket once merged (and released, in enterprise mode).' The lean Definition of Done (agent-factory/checklists/definition-of-done.md) has no 'merged' item and no human sign-off item, so the 'once merged' condition is gone from the only place that stated it for the Orchestrator. It now conflicts with the seed board's Done definition ('merged + released (or merged, lean)', agent-factory/seed/memory-bank/plans/board.md:92) and Workflow 06 (move to Done only 'once the named human signs off'). The partition guard cannot see it: it checks who owns a (from, to) pair, never the condition attached to it."
    artifacts:
      - path: "agent-factory/roles/orchestrator.md"
        issue: "Line 68: lean close lost its 'once merged' condition"
      - path: "agent-factory/checklists/definition-of-done.md"
        issue: "Lean DoD has no 'merged by a human' item to carry the lost condition"
    missing:
      - "Restore the condition in orchestrator.md: close `In UAT → Done` in lean mode only once a human has merged the PR, the named human has signed off the UAT scenarios (`checkpoint: sign_off_acceptance`) and the lean DoD holds"
      - "Add 'merged by a human' to the lean Definition of Done"
      - "Reconcile uat-planner.md (`In UAT → Ready to Release` with no mode condition) and Workflow 06 line 31 ('or directly to Done in lean mode') with the Orchestrator's lean close (WR-02)"
deferred: []
human_verification: []
---

# Phase 40: Plain-language role rewrite Verification Report

**Phase Goal:** Every role reads as clear, compact English that says more about the role than today, within today's byte budget, and keeps every rule that holds the factory safe
**Verified:** 2026-11-01T18:12:00Z
**Status:** gaps_found
**Re-verification:** No, initial verification

## Verdict in one paragraph

The rewrite itself is real and mostly sound: no caveman anywhere, all 19 roles plus the protocol are plain English with a goal, inputs, outputs, board moves, limits and stops, the corpus is 59,505 B against a 67,383 B cap, the do-less rules, NOTICE and lean lens exist, and role text is a governed surface. Every guard I re-ran is green. Two things keep it from `passed`. First, the guard that used to freeze role `## Hard limits` was swapped for an inventory stand-in that cannot see the project's top safety rule (no merge, no deploy, named human), so the rule text is kept today but can now be deleted with every gate green; I reproduced that. Second, one rule changed meaning: the Orchestrator's lean close lost its "once merged" condition. Both are fixable in a small gap-closure round. Neither needs a human decision to classify, so the status is `gaps_found`, not `human_needed`.

## Rule text kept vs. guard kept (reported separately, as asked)

| | Evidence | Result |
|---|---|---|
| (a) Safety TEXT present in every role today | `orchestrator.md:77` (never merge a protected branch, never deploy production, merge and deploy stay with humans); `release-manager.md:46` (named-human approval, never deploy to production yourself); `tech-lead.md:50` (merge and deploy stay with humans); `designer.md:42` (merge and deploy remain human decisions); `software-engineer.md:11` (never merge); `incident-responder.md:46` (no production action without a named human's confirmation); `uat-planner.md:44` (named human sign-off, never self-sign). `AGENTS.md:102,104` carries the same rule plus the git-host hard floor. Every old Hard-limits sentence for the 19 roles was diffed against the new text: all kept in meaning, except the Orchestrator close in CR-02. Platform depth/width detail moved to Workflow 17 `## Platform depth and width`; the ASVS severity map moved to Workflow 15 step 3 and both are pointed to by path. | PRESENT |
| (b) GUARD stopping silent removal | check-role-rules inventory (D-28 closed facts: no-fabrication, `UNKNOWN - verify`, WF16/WF18, absent-config fallback, `BLOCKED`, board-from, coding-rules set, junior exclusions) has no merge, deploy or named-human fact. Stand-in admits role `## Hard limits` clauses. Throwaway-worktree reproduction: three deletions, six gates at exit 0. Only the Tech Lead sentence is pinned, by `scripts/tier-kit-text.test.ts` (a test, not a gate; it failed when I removed it and passed again when restored). Orchestrator and Release Manager merge/deploy sentences have no pin of any kind. | LOST (regression vs. pre-phase FROZEN guard) |

Mitigating facts, stated so the severity is not overstated: the stand-in was a human-ratified decision (D-30, rated "costly" to reverse) and 40-01's own must_have says a reworded role Hard-limits sentence is admitted when the inventory passes. The same rule also lives in `AGENTS.md`, and the git host remains the hard floor (CLAUDE.md Safety constraint). PLAIN-03's literal parenthetical list does not name merge or deploy. The gap is against the phase goal's "keeps every rule that holds the factory safe", D-30's "stays mechanical and fails closed", and the plan prohibition "MUST NOT let the D-30 stand-in become a blanket bypass". For any safety sentence that is not an inventory fact it is exactly a blanket bypass. 40-SECURITY.md T-40-13 / T-40-15 were closed on "token present in each role" greps, which verify (a) and not (b).

## Goal Achievement

### Observable Truths (ROADMAP success criteria plus PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / PLAIN-01: no role carries a caveman block; voice constraint, section list, voice guards, writing profile, C-28-003 and CLAUDE.md changed together; inverted guard seen failing first | VERIFIED | `grep -rni caveman agent-factory/roles/` returns nothing. `ROLE_SECTIONS` (`scripts/validate-agent-factory.ts:372`) has no caveman heading and gains `## Activates when` and `## Stop when`. CLAUDE.md line 18 now says "Clear, compact, plain English in every role prompt"; the system-reminder copy of CLAUDE.md is stale. `agent-factory/writing-profile.md:8` states roles carry no caveman block. C-28-003 is `status: true`, re-dispositioned by id (F-28-202 closed in 40-10). Plan-01 landed in one commit (`b4dfa42b` touches CLAUDE.md). Inverted guard + planted-mirror red case run: `check-foundation-guards.test.ts -t "caveman|corpus total|ROLE_CEILINGS"` 18 passed. |
| 2 | SC2a / PLAIN-02: all 19 roles and the protocol state goal, inputs, outputs, board moves, hard limits and stop conditions in more detail than before | VERIFIED | Validator and fixtures require all nine headings; every role has `## One job`, `## Activates when`, `## Reads`, `## Responsibilities`, `## Output`, `## Board moves`, `## Trace updates`, `## Hard limits`, `## Stop when` (engineer adds `## Levels`, `## Do less`). Reader check (my own, see below) names all six items from each file alone. Per-role derived fact count after >= before for all 19 plus the protocol (`check-role-rules --check` INFO lines, e.g. orchestrator 11 to 18, tech-lead 10 to 16, engineer 21 to 24, protocol 6 to 6). Protocol is plain English; no grug persona words; `▶ entering <ROLE>` kept as an output format. |
| 3 | SC2b / PLAIN-03: the pre-rewrite inventory (no-fabrication, `UNKNOWN - verify`, WF16/WF18 pointers, absent-config fallback, board-move ownership as a partition) still holds | FAILED (partial) | The listed token facts hold: `check-role-rules --check` exit 0, "ALL CHECKS PASSED"; partition 18 claimed pairs over 12 flow columns, 0 findings; D-13 set two-sided; D-36 adds no-fabrication and `UNKNOWN - verify` to orchestrator and tech-lead (confirmed in text). D-28 asks for "anchor token plus the meaning", and the meaning of one board-move rule changed (gap 2, CR-02). The protection of the safety rules the inventory was meant to stand in for is gap 1 (CR-01, WR-04). Weaker partition guard (WR-01) admits any `to` column from an owned from-column; recorded as a warning, not scored. |
| 4 | SC3 / PLAIN-04: role files stay within 67,383 B, a guard fails above it, each role has a recorded ceiling | VERIFIED | `wc -c agent-factory/roles/*.md` = 59,505 B over 20 files (19 roles + protocol), down from 78,011 B at the start and under the roughly 64 KB headroom target. `guard_role_corpus_total` and `ROLE_CEILINGS` pass ("key set == 19 derived role file(s), both ways"; every role within ceiling); planted-mirror tests pass (above). |
| 5 | SC4 / PLAIN-05 and PLAIN-06: engineer and Tech Lead carry grugops-authored do-less rules, MIT attribution in NOTICE, no borrowed numbers; PR checklist has a lean lens | VERIFIED | `software-engineer.md` `## Do less` (ladder, floor, one-test rule, applies at every level) and `## Output` (`shortcut: <limit>, <when to upgrade>`; `Not checked:` line in an `observation` note, never longer than the change). `tech-lead.md` Responsibilities 2 (every place the change reaches, dropped options, never-cut floor) and `## Output` (recorded in `## Tech Lead plan`). `NOTICE` and `agent-factory/NOTICE` byte-identical with ponytail MIT text and copyright line (fetched from the upstream LICENSE per 40-02-SUMMARY); no percent, token or speed figure in either role; `check-banned-claims` exit 0. `pr-review-checklist.md` `## Lean lens (advisory)`: advisory, correctness first, "no case, no finding", six sub-tags, split by job not line count, no savings figure. |
| 6 | SC5 / PLAIN-07: role text is a governed surface and the lexicon and sentence gates pass on every role | VERIFIED | `check-imperative-lexicon` exit 0: 69 governed documents in 5 parts, `roles 20`, sentence form 0 findings over 69/69, LANG-01 78 derived names; `check-imperative-lexicon.test.ts` green (planted over-long role sentence goes red). |
| 7 | Adapters and catalog still regenerate unchanged from the new role text (PLAN must_have) | VERIFIED | `adapters-freshness`: 21 adapters, 0 byte differences. `catalog-freshness`: fresh. `adapter-byte-baseline.test.ts` green; the one deliberate security-nfr adapter change is a recorded literal (40-10). |

**Score:** 5/7 truths verified (truth 3 failed; the safety-guard clause of the phase goal is carried as gap 1, counted with truth 3). 0 present-but-behavior-unverified.

### Reader check (D-31, manual-only in 40-VALIDATION.md)

I read the full text of `orchestrator.md`, `software-engineer.md`, `tech-lead.md`, `uat-planner.md` and `_role-switch-protocol.md`, and the `## Hard limits` plus `## Stop when` of the other 15 roles, each against its pre-phase version at `e8d7802`. From each file alone I can name: the goal (`## One job`), the trigger (`## Activates when`), the inputs (`## Reads`), the outputs (`## Output`), the board moves (`## Board moves`), the limits (`## Hard limits`) and the stops with their outcome and recipient (`## Stop when`). Hard-limit meaning is preserved role by role, with no unsafe loosening found apart from CR-02. I did not diff every `## Responsibilities` item pairwise; the inventory fact counts and the guards cover that. The D-16 reference-role approval was given by the human at the 40-02 checkpoint ("approved").

### Findings from the code review (40-REVIEW.md, all 12 still `open`), weighed against the contract

| Finding | Decision | Why |
|---|---|---|
| CR-01 | Gap 1 | Reproduced independently (twice, by the orchestrator and by me). Guard loss against the goal clause and D-30 "fails closed". |
| CR-02 | Gap 2 | Verified in text: orchestrator.md:68 vs. the old line, the lean DoD, board.md:92 and Workflow 06. A rule's condition was lost, not only its guard. |
| WR-04 | Folded into gap 1 | Same mechanism: human-stop rules left a frozen region. |
| WR-01, WR-02, WR-03 | Warning, not scored | WR-02 is the other half of CR-02's lean-mode exit conflict and is listed under gap 2's fix. WR-01 is a guard-strength overstatement. WR-03 is ambiguous "return the ticket" wording in new Stop-when bullets. None changes what the partition requirement literally lists. |
| WR-05, WR-06 | Warning, not scored | Baseline `--write-baseline` can be re-run to launder a loss (the equality test then passes); 23 non-role workflow safety-section findings retired by the base move without a named-human read. Worth closing in the same round; neither breaks a stated must-have. |
| IN-01..IN-04 | Info | Plan ids in shipped writing-profile text, parser asymmetry, fixture comment, `role_standin` value not pinned in the gate. |

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `agent-factory/roles/*.md` (19) + `_role-switch-protocol.md` | Plain-English roles, nine-section skeleton | VERIFIED | All present, substantive, wired to validator, adapter and catalog generators. |
| `scripts/check-role-rules.ts` / `.js` | Inventory + partition guard | VERIFIED (limited) | Wired in CI, `package.json` and the diff-disposition stand-in; fact list does not cover merge, deploy or named human. |
| `docs/audit/40-role-rule-inventory.json` | Pre-rewrite baseline at `source_commit` e8d7802 | VERIFIED | Equals derivation at source_commit (test green). Re-writable by `--write-baseline` (WR-05). |
| `scripts/check-diff-disposition.ts` / `.js` + `00-base.md` `role_standin` | D-30 base move and stand-in | PRESENT, over-permissive | Fails closed when the script is missing or red; admits any clause when it is green (gap 1). |
| `scripts/check-foundation-guards.ts` | Inverted caveman guard, corpus-total guard, `ROLE_CEILINGS` | VERIFIED | Green, tests pass. |
| `agent-factory/NOTICE`, `NOTICE` | ponytail MIT credit | VERIFIED | Byte-identical. |
| `agent-factory/checklists/pr-review-checklist.md` | Lean lens | VERIFIED | Present with required properties. |

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| role `## One job` / `## Activates when` | adapters and catalog | generators | WIRED (0 byte differences) |
| `check-diff-disposition` stand-in | `check-role-rules.js --check` | `role_standin` key in `00-base.md`, spawned from CLI path only | WIRED |
| partition guard | seed board Exit-owner table | derived, not typed | WIRED |
| role Reads pointers | Workflows 16, 17, 18 | path tokens, inventory-checked | WIRED |
| Orchestrator lean close | definition-of-done.md, board Done definition, Workflow 06 | prose | NOT ALIGNED (gap 2) |

## Behavioral Spot-Checks and Gate Runs (run by me on HEAD)

| Check | Result |
|---|---|
| `node scripts/check-role-rules.js --check` | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 (WARN: orchestrator adapter 3368 B over the 3072 B advisory line, pre-existing class) |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `node scripts/check-diff-disposition.js` | exit 0; "1130 role clause(s) admitted by the role-rule inventory stand-in" |
| `node scripts/check-imperative-lexicon.js`, `check-banned-claims.js` | exit 0 |
| `adapters-freshness.js`, `catalog-freshness.js` | exit 0 |
| `vitest run check-role-rules / check-imperative-lexicon / check-diff-disposition / adapter-byte-baseline` | 228 passed |
| `vitest run check-foundation-guards -t "caveman\|corpus total\|ROLE_CEILINGS"` | 18 passed |
| Throwaway worktree: delete merge/deploy sentences in orchestrator, release-manager, tech-lead | check-role-rules, check-diff-disposition, check-foundation-guards, validate-agent-factory, check-imperative-lexicon, check-banned-claims all exit 0; `tier-kit-text.test.ts` fails only on the Tech Lead sentence (worktree removed afterwards) |

The full suite was not re-run by me. I rely on the orchestrator's post-merge run (10,801 passed, 21 failed, the recorded pre-existing set) and did not re-derive that.

## Probe Execution

SKIPPED: no probe scripts declared in the phase PLANs.

## Requirements Coverage

| Requirement | Source plan(s) | Status | Evidence |
|---|---|---|---|
| PLAIN-01 | 40-01 | SATISFIED | Truth 1 |
| PLAIN-02 | 40-02..40-08 | SATISFIED | Truth 2 |
| PLAIN-03 | 40-01, 40-08 | NOT FULLY SATISFIED | Listed token facts and partition hold; meaning of one rule changed and the safety sentences lost their freeze (gaps 1 and 2) |
| PLAIN-04 | 40-09 | SATISFIED | Truth 4 |
| PLAIN-05 | 40-02, 40-03 | SATISFIED | Truth 5 |
| PLAIN-06 | 40-03 | SATISFIED | Truth 5 |
| PLAIN-07 | 40-10 | SATISFIED | Truth 6 |

All seven IDs appear in the plan frontmatter and in REQUIREMENTS.md (lines 56-62, traceability 146-152); no orphaned requirement. REQUIREMENTS.md marks PLAIN-03 `[x]` Complete; that should be revisited when the gaps close.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| (phase files) | No `TBD`, `FIXME` or `XXX` markers found in the role files | none | no debt-marker gate hit |
| `.planning/phases/40-.../deferred-items.md` | Stale quotes in `docs/audit/28-claim-registry.md` were recorded; 40-10 summary says refreshed | info | no gate reads them |

## Human Verification Required

None open. The two manual-only items from 40-VALIDATION.md are resolved: the D-16 approval was given, and the reader and meaning review is done above.

## Gaps Summary

Two gaps, both small and both in one root cause family: the stand-in and the board-move rewrite were judged on token presence, not on the safety meaning around the tokens.

1. **Safety-sentence guard (CR-01, WR-04).** Text kept, guard lost. Restore a mechanical freeze for role `## Hard limits` clauses (or add merge, deploy and named-human facts to the derived inventory), freeze `## Stop when`, and add a planted-mirror red test for the Orchestrator merge ban.
2. **Orchestrator lean close (CR-02, with WR-02).** Put the "merged by a human" and named-human sign-off conditions back, add the merged item to the lean Definition of Done, and align the UAT Planner and Workflow 06 so lean mode has exactly one owner for the `In UAT` exit.

Warnings WR-01, WR-03, WR-05, WR-06 and the four info items are worth closing in the same round but do not change the status.

---

_Verified: 2026-11-01T18:12:00Z_
_Verifier: Claude (gsd-verifier)_
