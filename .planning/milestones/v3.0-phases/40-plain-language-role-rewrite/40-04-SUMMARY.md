---
phase: 40-plain-language-role-rewrite
plan: 04
subsystem: roles
tags: [plain-language, ba-pm, system-analyst, architect-design, uat-planner, board-moves, stop-when]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory baseline and check-role-rules; 40-02's approved reference role, D-02 byte targets and D-33 pair table
provides:
  - agent-factory/roles/ba-pm.md rewritten, owning `Backlog → Ready` and `Ready → In Analysis` (D-33), no Orchestrator-pulls-from-Ready sentence
  - agent-factory/roles/system-analyst.md rewritten, owning `In Analysis → In Design`
  - agent-factory/roles/architect-design.md rewritten, owning `In Design → Ready for Dev`
  - agent-factory/roles/uat-planner.md rewritten, owning `Ready for UAT → In UAT` and `In UAT → Ready to Release`, with no `In UAT → Done` claim
  - a `## Stop when` section in each of the four roles (D-10), and the coding-rules line dropped from each (D-13)
affects: [40-05, 40-06, 40-07, 40-08, 40-09, 40-10]

actuals:
  tokens: 2669    # chars/4 over the 4 role files after (10,674 chars); plus a 2-case test repoint in scripts/check-role-rules.test.ts
  tasks: 3
  commits: 4
plan_head_before: 5f172a453febd7a41462ceaf5778855d36858dae
plan_head_after: 7255e209e7b23d103629c9d2a5ef6779557f1340

tech-stack:
  added: []
  patterns:
    - "Each analysis-lane role states its owned board move once as a code span in `## Board moves`, and its done stop names the next role without repeating that sentence"
    - "A role that fits its byte target moves nothing out: the workflows and checklists the plan listed stay unchanged"

key-files:
  created: []
  modified:
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/uat-planner.md
    - scripts/check-role-rules.test.ts

key-decisions:
  - "All four roles fit their D-02 targets by rewording alone, so no workflow or checklist was edited and no 40-04 rows file exists"
  - "BA/PM's Board moves names `Backlog → Ready` and `Ready → In Analysis`; the sentence 'The Orchestrator pulls from `Ready` forward.' is gone"
  - "UAT Planner keeps the named-human sign-off and the never-self-sign reason in clear voice in `## Hard limits`; the lean close `In UAT → Done` stays with the Orchestrator"
  - "No lexicon addition (D-32): the two mirror-check findings were fixed by rewording"

patterns-established:
  - "Analysis-lane Stop when: one BLOCKED return to the upstream role, one stop for a human or a named role, one done stop that names who takes the ticket next"

requirements-completed: []

duration: ~35 min wall clock (13:04Z to about 13:38Z, most of it the full-suite run)
completed: 2026-11-01
---

# Phase 40 Plan 04: Analysis-lane roles in plain English Summary

**BA/PM, System Analyst, Architect/Design and UAT Planner follow the approved reference pattern in second-person plain English, each with a `## Stop when` section and its D-33 board moves as code spans. BA/PM now owns `Ready → In Analysis` and no longer says the Orchestrator pulls from `Ready`. All four fit their byte targets (2,880, 2,249, 2,894 and 2,651 B) with nothing moved into a workflow.**

## Performance

- **Duration:** about 35 minutes wall clock, most of it the full-suite run
- **Started:** 2026-11-01T13:04Z (after 5f172a45)
- **Completed:** 2026-11-01
- **Tasks:** 3 of 3
- **Files modified:** 5 (4 roles, 1 test file)

## Phase 40 start commit

e8d7802ccf8ebf428a47703f6001327325e3aea3 (the inventory baseline and the disposition base both name it).

## Accomplishments

- **ba-pm.md (tracer).** Sections in RW-1 order with bare headings; `## Activates when` now follows `## One job`. The first sentences of `## One job` and `## Activates when` are byte-identical, so adapters, catalog and skill twins did not change. `## Reads` opens with the config bullet and the absent-config sentence and ends with the RW-4 pointer line. Nine numbered items, one action each; item 9 is the pinned "Answer a Tech Lead hand-off per Workflow 04 step 17." `## Board moves`: "You own `Backlog → Ready` once a ticket meets the Definition of Ready." and "You own `Ready → In Analysis` when a ready ticket goes to the System Analyst." `## Hard limits` keeps protect-the-MVP, no vague criterion leaving `Ready`, no system design or tech choice, "Never fake or invent a requirement, a target or an answer." and `UNKNOWN - verify`. Three Stop when items: vague acceptance after one round of questions (`BLOCKED`, back to the requester), too big for one ticket (`SPLIT_REQUIRED`, smaller tickets back in `Backlog`), fails the Definition of Ready (stays in `Backlog`, missing input named).
- **system-analyst.md.** Six numbered items: actors and flows, state transitions and inputs/outputs, validation rules and permissions and data or API needs, edge and error cases, integration points, open questions. `## Board moves`: "You own `In Analysis → In Design` once the flows, states and edge cases are recorded." Hard limits keep map-behavior-only, no undefined state transition, no fabrication and `UNKNOWN - verify`. Stop when: a business rule that contradicts the acceptance criteria goes back to BA/PM as `BLOCKED`; a structure or technology choice goes to the Architect; mapped behavior stops done in `In Design` for the Architect.
- **architect-design.md.** Six numbered items, item 6 the pinned step 17 sentence. Output keeps the full note list, the ADR path and sections, and the NFR file plus hand-written catalog line sentence. `## Board moves`: "You own `In Design → Ready for Dev` when the design is settled." Hard limits keep just-enough design, no production code, no fabrication and `UNKNOWN - verify`. Stop when: a one-way decision gets an ADR and goes to a named human as `BLOCKED`; a behavior gap goes back to the System Analyst; published design notes and ADRs stop done in `Ready for Dev` for the Tech Lead.
- **uat-planner.md.** Eight numbered items covering scenarios in the user's words, expected results, test users and data, entry and exit criteria and rollback, limitations before sign-off, the sign-off checklist naming the accepting human role, the UAT checklist per Workflow 06, and recording the named human's sign-off. `## Board moves`: `Ready for UAT → In UAT` and `In UAT → Ready to Release`; no `In UAT → Done`. Hard limits: no code, "Acceptance needs a named human sign-off.", "Never self-sign: an agent that signs removes the one human the gate exists for.", "Never fake a pass." and `UNKNOWN - verify`. Stop when: missing acceptance criteria go back to BA/PM as `BLOCKED`; an ambiguous or unmet result stays in `In UAT` for a named human; after the human signs off and the ticket moves, stop done for the Release Manager.

## Recorded evidence

### Role bytes (D-02)

| Role | Before (5f172a45) | After | Target |
|------|-----:|-----:|-----:|
| ba-pm.md | 3,663 | 2,880 | 2,950 |
| system-analyst.md | 2,917 | 2,249 | 2,600 |
| architect-design.md | 3,709 | 2,894 | 2,950 |
| uat-planner.md | 3,318 | 2,651 | 2,800 |

### Workflow and checklist bytes (D-06)

No workflow or checklist was edited: every role fit its target by rewording, so nothing moved (D-05, D-19). No rows file `docs/audit/29-style-dispositions/40-04.md` was created, because no watched file changed.

| File | Before | After |
|------|-----:|-----:|
| agent-factory/workflows/02-idea-to-epics.md | 3,018 | 3,018 (not edited) |
| agent-factory/workflows/03-epic-to-tickets.md | 3,717 | 3,717 (not edited) |
| agent-factory/workflows/06-uat-pack.md | 5,820 | 5,820 (not edited) |
| agent-factory/workflows/07-backlog-refinement.md | 5,743 | 5,743 (not edited) |
| agent-factory/checklists/definition-of-ready.md | 857 | 857 (not edited) |
| agent-factory/checklists/uat-checklist.md | 329 | 329 (not edited) |
| agent-factory/checklists/example-mapping.md | 2,484 | 2,484 (not edited) |

### check-role-rules facts (D-27, D-31)

Each shows `NOTE <role>: coding-rules removed — intended (D-13)`.

- ba-pm.md: facts before 10 / after 14 (adds `board-from:Ready`, `blocked`, and 3 Stop-when items), Stop-when items 0 → 3
- system-analyst.md: facts before 9 / after 12, Stop-when items 0 → 3
- architect-design.md: facts before 9 / after 12, Stop-when items 0 → 3
- uat-planner.md: facts before 11 / after 14, Stop-when items 0 → 3

### Gates (re-run after each task commit)

- `npx vitest run scripts/tier-kit-text.test.ts scripts/generate-role-adapters.test.ts scripts/kit-model.test.ts scripts/adapter-byte-baseline.test.ts`: 4 files, 350 passed, 0 failed.
- check-foundation-guards, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-role-rules, check-diff-disposition, check-imperative-lexicon, check-kit-refs, check-banned-claims: all exit 0, 0 FAIL lines.
- adapters, catalog, skill-twins and host-entries freshness: all exit 0.
- Mirror sentence check for ba-pm, system-analyst, architect-design and uat-planner: no `zrole-` line after the fixes below.
- Full suite (e2e excluded), run after 7876c108: 10,762 passed, 23 failed, 2 skipped. 21 failures match the known set one for one (installer-fs-census 1, canonical-corpus 1, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5, and the `~/` case in check-foundation-guards). The other 2 were new, both in `scripts/check-role-rules.test.ts`, caused by this plan's ba-pm.md rewrite; fixed in 7255e209 (see Deviations). After the fix, check-role-rules.test.ts passes 11 of 11 and check-foundation-guards.test.ts fails only the known `~/` case (337 of 338), so the suite is back to the 21 known failures.

### Lexicon (D-32)

No lexicon addition. The mirror check flagged two sentences, both fixed by rewording:
- system-analyst.md `## Output`: a 26-word sentence (WP-03), split in two.
- uat-planner.md item 2: the modal "can" (WP-05), reworded to "plain enough for a non-engineer to judge".

### Sibling-caused reds

None seen. Every whole-tree gate was green at each task's commit.

### Workflow follow-ups (not edited; outside this plan's files)

- `agent-factory/workflows/08-sprint-planning.md` lines 12 and 24 say the Orchestrator pulls committed items from `Ready`, and line 38 says it "pulls each forward into `Ready for Dev`". Under the D-33 table BA/PM owns the `Ready` exit (`Ready → In Analysis`). A later plan that owns Workflow 08, or the Orchestrator rewrite, should align it.
- `agent-factory/workflows/06-uat-pack.md` `## Board moves` and `## Done condition` say the ticket moves "directly to `Done` in lean mode" without naming who moves it. D-33 gives that close to the Orchestrator; the workflow could say so.
- Workflows 02 and 07 still carry caveman lines ("grug no build everything", "grug keep the larder full"). They were not touched here because nothing moved into them.

## Task Commits

1. **Task 1: BA/PM rewritten and aligned to the Exit owner table (tracer)** - `1a54e27c` (docs)
2. **Task 2: System Analyst and Architect/Design rewritten** - `877a5888` (docs)
3. **Task 3: UAT Planner rewritten with its two owned moves** - `7876c108` (docs)
4. **Blocking fix: check-role-rules ba-pm plants repointed** - `7255e209` (fix)

**Plan metadata:** recorded in the final docs commit for this plan.

## Files Created/Modified

- `agent-factory/roles/ba-pm.md` - reference pattern, `Backlog → Ready` and `Ready → In Analysis`, `## Stop when`
- `agent-factory/roles/system-analyst.md` - reference pattern, `In Analysis → In Design`, `## Stop when`
- `agent-factory/roles/architect-design.md` - reference pattern, `In Design → Ready for Dev`, `## Stop when`
- `agent-factory/roles/uat-planner.md` - reference pattern, `Ready for UAT → In UAT` and `In UAT → Ready to Release`, `## Stop when`
- `scripts/check-role-rules.test.ts` - two ba-pm plants follow the rewritten role (deviation, Rule 1)

## Decisions Made

See `key-decisions` in the frontmatter. tier-kit-text.test.ts was not edited: its only pins on these roles are the two step 17 sentences in case (m), kept byte-exact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two check-role-rules plants went vacuous after the BA/PM rewrite**
- **Found during:** the full-suite run after Task 3 (the per-task verify lists did not include this test file)
- **Issue:** `scripts/check-role-rules.test.ts` planted edits on ba-pm.md's old text. The board-claim case replaced "owns the `Backlog → Ready` exit", and the D-13 non-member case dropped the "12 coding rules" line. Neither string is in the rewritten role, so the test's own vacuous-plant guard threw.
- **Fix:** the board case now replaces "You own `Backlog → Ready` once", still expecting `ba-pm.md: lost fact board-from:Backlog`. The D-13 case asserts the removal already in the tree (the baseline lists `coding-rules` for ba-pm.md, the role lacks the line), then expects exit 0 and the intended-removal note. Test names and expectations are unchanged.
- **Files modified:** scripts/check-role-rules.test.ts (not in this plan's files_modified; 40-08 also lists it, and runs later)
- **Commit:** 7255e209

The tracer feedback gate after Task 1 re-ran the automated verify (human_verify_mode is end-of-phase and the verify is automated-only); it passed, so Tasks 2 and 3 went ahead.

Notes against the plan's wording:
- The plan's artifacts and files_modified list `docs/audit/29-style-dispositions/40-04.md` and seven workflows or checklists. None was created or edited, because nothing needed to move (the plan makes both conditional on a role exceeding its target).
- Some reason clauses in the old text were dropped rather than moved, because they were explanations of rules the roles still state: the INVEST letter expansion (Workflow 07 already spells it out), "an oversized ticket hides unestimated risk", "an unowned NFR is a 3am page waiting to happen", "the ones the engineer hits at midnight". The rules themselves stay.

## Issues Encountered

- The untracked `~/` directory (not created by this plan, left alone as instructed) still fails `check-foundation-guards.test.ts` "every remaining floor item's LIVE COUNT is DERIVED": it is one of the 21 known failures.

## User Setup Required

None.

## Next Phase Readiness

- PLAIN-02 and PLAIN-03 stay pending: PLAIN-02 needs the remaining roles and the protocol (40-05 to 40-07), and PLAIN-03 needs 40-08's partition guard. They are not marked complete here.
- 40-08's partition guard will find BA/PM's two pairs, the System Analyst's and the Architect's one pair each, and the UAT Planner's two pairs, all from the approved D-33 table.

## Self-Check: PASSED

- FOUND: agent-factory/roles/ba-pm.md, agent-factory/roles/system-analyst.md, agent-factory/roles/architect-design.md, agent-factory/roles/uat-planner.md, scripts/check-role-rules.test.ts
- FOUND: 1a54e27c, 877a5888, 7876c108, 7255e209 (all ancestors of HEAD)
- Commit count measured: `git rev-list --count 5f172a45..HEAD` = 4
