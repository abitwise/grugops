---
phase: 40-plain-language-role-rewrite
plan: 03
subsystem: roles
tags: [plain-language, tech-lead, designer, frontend-ui, scope-first, lean-review, notice, ponytail]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory and D-30 stand-in; 40-02's approved reference role, D-02 byte targets and D-33 pair table
provides:
  - agent-factory/roles/tech-lead.md conformed (D-18) with scope-first, `UNKNOWN - verify`, its four declared exception pairs and `## Stop when`
  - agent-factory/roles/designer.md conformed and agent-factory/roles/frontend-ui.md rewritten to the reference pattern, each with `## Stop when`
  - agent-factory/checklists/pr-review-checklist.md `## Lean lens (advisory)` (PLAIN-06)
  - NOTICE / agent-factory/NOTICE ponytail credit naming all three adapted texts (D-26)
  - tier-kit-text describes "tech-lead.md plain conform", "designer.md and frontend-ui.md plain rewrite" and "pr-review-checklist.md lean lens (PLAIN-06; D-25)"
affects: [40-04, 40-05, 40-06, 40-07, 40-08, 40-09, 40-10]

actuals:
  tokens: 40455    # chars/4 over the 10 files changed (161,818 chars); the diff alone is 34,558 chars (8,640)
  tasks: 3
  commits: 3
plan_head_before: 49834d1d28dfff0e277d2bfec9ac87d800333c0d
plan_head_after: 10bab2d11fbfb3208dd58acfc09ba66b106a973b

tech-stack:
  added: []
  patterns:
    - "Pinned stop sentences move between sections byte-exact; the assertions follow them to the new section with the same phrases (D-10)"
    - "A pin that read a numbered item by index now finds it by its opening words, so a later insertion cannot silently retarget it"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-03.md
  modified:
    - agent-factory/roles/tech-lead.md
    - agent-factory/roles/designer.md
    - agent-factory/roles/frontend-ui.md
    - agent-factory/workflows/14-ui-design-to-build.md
    - agent-factory/checklists/pr-review-checklist.md
    - NOTICE
    - agent-factory/NOTICE
    - scripts/tier-kit-text.test.ts

key-decisions:
  - "Tech Lead's blocked-ticket move list is now only in Workflow 04 step 15; the role keeps one pointer sentence (41-word pinned sentence split to pass WP-02)"
  - "The Tech Lead's stop sentences sit in one `## Stop when` bullet so the pins' whole-sentence match (space-delimited) still holds; Workflow 04 unchanged"
  - "Design-tell examples and two contract parts (responsive/performance budget, verification owner) moved into Workflow 14 steps 1 and 2 (D-05), with rows in 40-03.md"
  - "pr-review-checklist preamble now names the `(enterprise)` bullet, since the lens made it no longer the final bullet"
  - "No lexicon addition (D-32): every mirror sentence-check finding was fixed by rewording"

patterns-established:
  - "Lean lens wording: advisory, no case no finding, six sub-tags, no number"

requirements-completed: [PLAIN-05, PLAIN-06]

duration: ~45 min wall clock (12:19Z to 13:05Z, including a 23-minute full-suite run)
completed: 2026-11-01
---

# Phase 40 Plan 03: Build-lane roles, scope-first and the lean-review lens Summary

**The Tech Lead now cuts scope at planning time (every place the change reaches, the dropped options, the never-cut floor), marks unmeasurable factors `UNKNOWN - verify`, names its four declared exception pairs and keeps its stops in `## Stop when`, at 3,685 B. The Designer (2,640 B) and Frontend/UI (2,996 B) follow the reference pattern, the PR checklist gains an advisory lean lens, and NOTICE credits ponytail for all three adapted texts.**

## Performance

- **Duration:** about 45 minutes wall clock, including the 23-minute full-suite run
- **Started:** 2026-11-01T12:19Z (after 49834d1d)
- **Completed:** 2026-11-01T13:05Z
- **Tasks:** 3 of 3
- **Files modified:** 10 (1 created)

## Phase 40 start commit

e8d7802ccf8ebf428a47703f6001327325e3aea3 (the inventory baseline and the disposition base both name it).

## Accomplishments

- **tech-lead.md (D-18, D-20, D-33, D-36, D-10).** Sections in RW-1 order with bare headings. The first sentences of `## One job` and `## Activates when` are byte-identical, so adapters, catalog and skill twins did not change. Responsibilities item 2 is scope-first: write down every place the change reaches (callers, tests, fixtures, config, exports), name each option nobody asked for as dropped, and write the never-cut floor. `## Output` says the `## Tech Lead plan` section also records the scope, the dropped options and the floor. `## Hard limits` keeps "never fabricate a score" and adds "Mark an unmeasurable factor `UNKNOWN - verify`, scored per the rubric." `## Board moves` names `Ready for Dev → In Design`, `Blocked → Ready for Dev`, `Blocked → Backlog` and `Blocked → In Design`, plus the stays-in-`Ready for Dev` sentence. `## Stop when` holds the hand-off, the named-human stop, the second-escalation and fourth-hand-off stops, the `notify`/`off` park, and a done stop. Merge and deploy stay a hard limit. The coding-rules line stays, and the two Context lines became the RW-4 pointer line, so each of Workflow 16 and Workflow 18 is named once.
- **designer.md (D-18, D-13).** Reference order, pointer line, every pinned sentence kept. Coding-rules line dropped; check-role-rules prints `NOTE designer.md: coding-rules removed — intended (D-13)`. No board pair; its one placement sentence is unchanged. Three `## Stop when` items: missing product context goes to BA/PM, an architecture-changing design decision goes to the Architect, published guidelines stop done.
- **frontend-ui.md (rewrite).** One action per numbered item (the component inventory became its own item 3). Output points at Workflow 14 step 2 for the contract parts. No board pair: "You own no board move: you write the contract at the design step, before `In Development`." The Workflow 04 and Workflow 05 references sit in `## Hard limits`, and the coding-rules line stays. Four `## Stop when` items: missing or incomplete Designer guidelines go back to the Orchestrator for the Designer, missing acceptance scenarios go to BA/PM, a WCAG product decision waits per Workflow 14, a published contract goes to the engineer.
- **Lean lens (D-25).** `## Lean lens (advisory)` added as eight unnumbered bullets: correctness, safety and tests first; advisory, never blocks a PR on its own; no case, no finding; no style-taste finding; tags `delete`, `reuse`, `stdlib/native`, `yagni`, `merge`, `split by job`; split by job, never by line count; flag a `shortcut:` marker with no upgrade trigger; never print a savings figure or a line count. Workflow 05 was not touched; its blocking rules stand.
- **NOTICE (D-26).** The first ponytail paragraph names agent-factory/roles/software-engineer.md, agent-factory/roles/tech-lead.md and agent-factory/checklists/pr-review-checklist.md. The copyright line and MIT text are unchanged. `cmp NOTICE agent-factory/NOTICE` exits 0.

## Recorded evidence

### Role bytes (D-02)

| Role | Before (49834d1d) | After | Target |
|------|-----:|-----:|-----:|
| tech-lead.md | 3,606 | 3,685 | 3,700 |
| designer.md | 2,882 | 2,640 | 2,650 |
| frontend-ui.md | 3,722 | 2,996 | 3,000 |

Role corpus (`cat agent-factory/roles/*.md | wc -c`): 73,960 B after this plan (74,849 B after 40-02).

### Workflow and checklist bytes (D-06)

| File | Before | After |
|------|-----:|-----:|
| agent-factory/workflows/14-ui-design-to-build.md | 7,056 | 7,238 |
| agent-factory/checklists/pr-review-checklist.md | 472 | 1,008 |
| agent-factory/workflows/04-ticket-to-pr.md | 17,529 | 17,529 (not edited) |
| agent-factory/checklists/accessibility-checklist.md | 1,917 | 1,917 (not edited) |

pr-review-checklist.md is not in the diff-disposition watched corpus (40-RESEARCH.md), so it needs no rows. Workflow 14 has two rows in docs/audit/29-style-dispositions/40-03.md.

### check-role-rules facts (D-27, D-31)

- tech-lead.md: facts before 10 / after 16, Stop-when items 0 → 3
- designer.md: facts before 9 / after 12 (floor 8 after the intended D-13 removal), Stop-when items 0 → 3
- frontend-ui.md: facts before 11 / after 16, Stop-when items 0 → 4

### Gates (re-run after the Task 3 commit, 10bab2d1)

- `npx vitest run scripts/tier-kit-text.test.ts scripts/generate-catalog.test.ts scripts/adapter-byte-baseline.test.ts scripts/trace-instructions.test.ts install/installer-kit-home.test.ts`: 5 files, 325 passed, 0 failed.
- check-foundation-guards, validate-agent-factory (`VALIDATE_KIT_ROOT=.`), check-role-rules, check-diff-disposition, check-imperative-lexicon, check-kit-refs, check-banned-claims: all exit 0, 0 FAIL lines.
- adapters, catalog, skill-twins and host-entries freshness: all exit 0.
- Mirror sentence check for tech-lead, designer and frontend-ui: no `zrole-` line.
- Full suite (e2e excluded), run after 10bab2d1: 10,764 passed, 21 failed, 2 skipped. The 21 failing test names match, one for one, the 21 known failures recorded at 40-02 (20 already present at e8d7802, plus 1 from the stray `~/` directory). This plan added no new failure.

### Lexicon (D-32)

No lexicon addition. The mirror check flagged "must" (WP-05) in the first scope-first draft, which became "reaches". The long Phase 39 sentences (the 41-word blocked-ticket sentence and the 27-word decision-note sentence) were split.

### Sibling-caused reds

None seen. Every whole-tree gate was green at each task's commit.

## Task Commits

1. **Task 1: Tech Lead conformed with scope-first and its stops in `## Stop when`** - `b756902c` (docs)
2. **Task 2: Designer conformed and Frontend/UI rewritten** - `5d52d1dd` (docs)
3. **Task 3: Lean-review lens and widened ponytail credit** - `10bab2d1` (docs)

**Plan metadata:** recorded in the final docs commit for this plan.

## Files Created/Modified

- `agent-factory/roles/tech-lead.md` - conformed: scope-first, `UNKNOWN - verify`, four code-span pairs, `## Stop when`
- `agent-factory/roles/designer.md` - conformed, coding-rules line dropped, `## Stop when`
- `agent-factory/roles/frontend-ui.md` - rewritten to the reference pattern, `## Stop when`
- `agent-factory/workflows/14-ui-design-to-build.md` - steps 1 and 2 take the moved sentences
- `docs/audit/29-style-dispositions/40-03.md` - two Workflow 14 rows and the D-06 bytes
- `agent-factory/checklists/pr-review-checklist.md` - `## Lean lens (advisory)`; preamble names the `(enterprise)` bullet
- `NOTICE`, `agent-factory/NOTICE` - credit widened, byte copy kept
- `scripts/tier-kit-text.test.ts` - Tech Lead pins follow the moved and split sentences; three new describes

## Decisions Made

See `key-decisions` in the frontmatter. The test-pin changes, each made only to follow a moved or split sentence (RW-15):

- D-04: the decision-note sentence split in two; both halves pinned.
- D-08 and D-19: Board moves pins follow the second-person, code-span wording (D-11, D-33).
- D-19: the blocked-ticket sentence split; the move list is pinned in Workflow 04 step 15 instead.
- D-21 amended, (e), (k), (r), (w), (ac): read `section(TECH_LEAD, "Stop when")` with the same phrases. D-21 also asserts that the stops no longer appear in `## Hard limits`, and that merge and deploy still do.
- WR-07: asserts the order scope-first, then write the dev tasks, then score them, found by text.
- WR-15, WR-01: find the blocked item by its opening words (`blockedItem()`), not by `n === 5`. The `Resolved:` check is asserted as its own item.
- Frontend D-26: the component-inventory assertion follows its sentence into item 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The PR checklist preamble pointed at "the final bullet"**
- **Found during:** Task 3
- **Issue:** the preamble said "The final bullet applies only in enterprise mode." After the lens was appended, the final bullet in the file is a lens bullet, so the sentence pointed at the wrong rule.
- **Fix:** it now says "The `(enterprise)` bullet applies only in enterprise mode."
- **Files modified:** agent-factory/checklists/pr-review-checklist.md
- **Commit:** 10bab2d1

### Notes against the plan's wording

- The plan's tracer allowed Workflow 04 edits and a 40-03.md row for them. Workflow 04 was not edited: step 15 already lists the four moves, so the role's item now points there. 40-03.md holds Workflow 14 rows only.
- The accessibility checklist was not edited, so it has no rows and no byte change.
- The Tech Lead's pinned stop sentences are byte-exact, but they share one `## Stop when` bullet rather than one bullet each. The Phase 39 pins match a whole sentence between spaces, and a sentence ending a bullet line has a newline after it, not a space. That bullet does not follow RW-10's "When <trigger>, …" shape, because RW-15 keeps pinned sentences byte-exact. The done stop uses the RW-10 shape.
- D-14 (one action per item): Tech Lead items 1, 2, 4 and 6 still hold more than one sentence, because their Phase 39 sentences are pinned or the plan asks for scope-first as one item. Frontend/UI holds one action per item.

## Issues Encountered

- The untracked `~/` directory (not created by this plan, left alone as instructed) still fails `check-foundation-guards.test.ts` "every remaining floor item's LIVE COUNT is DERIVED": it is one of the 21 known failures.

## User Setup Required

None.

## Next Phase Readiness

- PLAIN-05 is met: the engineer (40-02) and the Tech Lead (here) carry the do-less rules, and NOTICE credits ponytail with no borrowed number. PLAIN-06 is met by the lens.
- PLAIN-02 and PLAIN-03 stay pending until 40-04 to 40-08 rewrite the remaining roles and the partition guard lands.
- 40-08's partition guard will see the Tech Lead's four pairs as the declared exception list, and see no pair for the Designer or Frontend/UI.

## Self-Check: PASSED

- FOUND: agent-factory/roles/tech-lead.md, agent-factory/roles/designer.md, agent-factory/roles/frontend-ui.md, agent-factory/workflows/14-ui-design-to-build.md, docs/audit/29-style-dispositions/40-03.md, agent-factory/checklists/pr-review-checklist.md, NOTICE, agent-factory/NOTICE, scripts/tier-kit-text.test.ts
- FOUND: b756902c, 5d52d1dd, 10bab2d1 (all ancestors of HEAD)
- Commit count measured: `git rev-list --count 49834d1d..HEAD` = 3
