---
phase: 40-plain-language-role-rewrite
plan: 06
subsystem: roles
tags: [plain-language, agents-md-scribe, installer, factory-coach, greenfield-mapper, brownfield-mapper, stop-when, no-board-move]
status: complete

requires:
  - phase: 40-plain-language-role-rewrite
    provides: 40-01's role-rule inventory baseline and check-role-rules; 40-02's approved reference role, D-02 byte targets and D-33 pair table
provides:
  - agent-factory/roles/agents-md-scribe.md rewritten as the plain-English owner of the 12 coding rules, with no grug word and no stale pointer-role count
  - agent-factory/roles/installer.md rewritten, keeping additive, never-overwrite-or-delete, re-runnable, reversible and dry-run-first rules and the stop-and-ask rule on ambiguous detection
  - agent-factory/roles/factory-coach.md rewritten, stating a retro never hides a failing gate, coding-rules line dropped (D-13)
  - agent-factory/roles/greenfield-mapper.md rewritten, keeping the boring-stack rule and the coding-rules line
  - agent-factory/roles/brownfield-mapper.md rewritten, map-only, never moves a ticket, with a real no-fabrication sentence, coding-rules line dropped (D-13)
  - a `## Stop when` section in each of the five roles (D-10); none of the five claims a board pair (D-33)
  - docs/audit/29-style-dispositions/40-06.md, one row for the Scribe's registry-anchored `UNKNOWN - verify` clause
affects: [40-07, 40-08, 40-09, 40-10]

actuals:
  tokens: 7275    # chars/4 over the realized diff (git diff 8e56b202..HEAD before this summary, 29,101 chars); the 5 role files after total 12,138 B
  tasks: 3
  commits: 3
plan_head_before: 8e56b2026b71c5a6382e7b7e9b48babeef436abf
plan_head_after: 1114358f2f4e4d1cbb270b56d7a9ddf2e681394c

tech-stack:
  added: []
  patterns:
    - "A role clause that equals a claim-registry verbatim anchor is never admitted by the D-30 stand-in; keep it byte-identical and record one row whose before and after both carry it"
    - "Setup-lane Stop when: one stop for a named human (ambiguous detection, a costly stack choice, a process decision), one BLOCKED return, one done stop naming who takes the result"

key-files:
  created:
    - docs/audit/29-style-dispositions/40-06.md
  modified:
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/installer.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/brownfield-mapper.md

key-decisions:
  - "All five roles fit their D-02 targets by rewording alone (2,736 / 2,435 / 2,684 / 2,273 / 2,010 B against 3,000 / 2,800 / 2,900 / 2,450 / 2,300); no workflow or checklist was edited"
  - "The Scribe keeps `If a command is unknown, ship `UNKNOWN - verify`.` byte-identical in `## Hard limits`: it equals the AGENTS.md claim-registry anchor, so the D-30 stand-in does not admit it and its rewritten line needed a 40-06 disposition row with a companion cell"
  - "The Scribe carries the coding-rules fact through its byte-identical One job sentence, not a `Follow the 12 coding rules` pointer: it authors the rules rather than inherit them"
  - "Brownfield Mapper gains `Never invent a command; the next agent trusts it.` in `## Hard limits`, closing the no-fabrication gap 40-01 recorded"
  - "No lexicon addition (D-32): the one mirror-check finding (a modal `would` in Installer item 2) was fixed by rewording"

patterns-established:
  - "No-move roles say so in one sentence that names where their output goes (`Backlog`, the backlog), with no arrow span"

requirements-completed: []

duration: ~45 min wall clock (14:10Z to about 14:55Z, most of it the full-suite run)
completed: 2026-11-01
---

# Phase 40 Plan 06: Setup and coaching roles in plain English Summary

**The AGENTS.md Scribe, Installer, Factory Coach, Greenfield Mapper and Brownfield Mapper follow the approved reference pattern in second-person plain English, each with a `## Stop when` section and a one-sentence no-board-move statement. The Scribe owns the 12 coding rules with no grug word and no stale count. The Installer keeps every additive, reversible, dry-run-first safety rule. All five fit their byte targets with nothing moved into a workflow or checklist.**

## Performance

- **Started:** 2026-11-01T14:10Z (after 8e56b202)
- **Tasks:** 3 of 3, each committed
- **Files modified:** 5 roles plus 1 new disposition rows file

## Phase 40 start commit

e8d7802ccf8ebf428a47703f6001327325e3aea3 (the inventory baseline and the disposition base both name it).

## Accomplishments

- Each role is in RW-1 order: `## One job`, `## Activates when`, `## Reads`, `## Responsibilities`, `## Output`, `## Board moves`, `## Trace updates`, `## Hard limits`, `## Stop when`. Bare headings, one-line `## One job`, frontmatter, `# Role:` heading and the Activates-when first sentence byte-identical, so adapters, catalog and the MODEL-01 baseline did not move.
- `## Reads` in each opens with the config bullet naming the keys the role uses, the verbatim absent-config sentence, the orientation bullet, and ends with the RW-4 pointer line.
- **Scribe:** owns the 12 coding rules (4 principles) as the one canonical copy in `AGENTS.md`; keeps AGENTS.md short and high-signal, detail pushed into the files it points to; Mission tone described as "light brand copy" (D-11); the "other 16 roles" count deleted, not re-typed. Hard limits: never invent or fake a command, gate or result; never restate the rules outside AGENTS.md; never grow toward the 32 KiB cap. Stop when: growth past the short form, a rule that conflicts with a role (`BLOCKED`, to the Orchestrator), done.
- **Installer:** Hard limits keep "Never overwrite or delete user content", additive, safe to re-run, reversible by uninstall, no change before a dry run has shown it, never fake an install, adapter or detection, `UNKNOWN - verify`, and the coding-rules line. Stop when: ambiguous detection, stop and ask a named human before laying down any adapter.
- **Factory Coach:** retro from metrics, 1–3 `factory` tickets, never hides a failing gate or a regression; a process change that needs a decision goes to a named human.
- **Greenfield Mapper:** boring stack in plain words ("one the team knows, with public failure modes"); `default_stack` honored; first tickets land in `Backlog` for the Orchestrator and BA/PM. Stops for a named human before a stack choice that cannot be undone cheaply.
- **Brownfield Mapper:** never refactor, fix or change code; never move a ticket; record only commands it ran; marks an unconfirmed command `UNKNOWN - verify` and hands the gap to the Scribe.

## Recorded evidence

| Role | e8d7802 | Plan start (8e56b202) | After | Target | Facts before / after |
|------|-----:|-----:|-----:|-----:|-----|
| agents-md-scribe.md | 3,949 | 3,771 | 2,736 | 3,000 | 8 / 12 |
| installer.md | 3,458 | 3,319 | 2,435 | 2,800 | 8 / 12 |
| factory-coach.md | 3,625 | 3,430 | 2,684 | 2,900 | 8 / 11 (floor 7, D-13 removal intended) |
| greenfield-mapper.md | 2,929 | 2,808 | 2,273 | 2,450 | 8 / 12 |
| brownfield-mapper.md | 2,683 | 2,540 | 2,010 | 2,300 | 7 / 11 (floor 6, D-13 removal intended) |

- Role corpus (all of `agent-factory/roles/*.md`) after this plan: 61,815 B.
- Workflow and checklist bytes (D-06): none touched. `git diff --stat 8e56b202..HEAD -- agent-factory/workflows agent-factory/checklists` is empty. Workflow 00 (5,046 B), 01 (4,526 B), 10 (4,065 B), 11 (4,019 B) and linter-recommendations.md (3,500 B) are unchanged.
- Acceptance greps: Scribe `grug` 0, `the other 16 roles` 0, `12 coding rules` 1, `## Stop when` 1; Installer `dry run|dry-run` 5, `never overwrite or delete user content` 1; Coach `12 coding rules` 0; Greenfield `12 coding rules` 1; Brownfield `12 coding rules` 0; `## Stop when` 1 in each; no `→` in any of the five.
- After each task: check-foundation-guards, validate-agent-factory, check-role-rules, check-diff-disposition, check-imperative-lexicon, check-kit-refs, check-banned-claims and the four freshness gates (adapters, catalog, skill-twins, host-entries) all exit 0. Mirror sentence check: no `zrole-` line for any of the five roles.
- Targeted tests after Task 3: generate-role-adapters, kit-model, adapter-byte-baseline, check-role-rules, generate-catalog, check-diff-disposition, check-foundation-guards: 655 passed, 1 failed (the known `~/` case "every remaining floor item's LIVE COUNT is DERIVED").
- Full suite (e2e excluded), run after 1114358f: 10,764 passed, 21 failed, 2 skipped. The 21 failures match the known set one for one (installer-fs-census 1, canonical-corpus 1, context-io 7, context-io-writer-set 2, harness-instance-ledger 4, uat-gate-exit-contract 5, and the `~/` case in check-foundation-guards). This plan added no new failure.

## Task Commits

1. **Task 1 (tracer): the AGENTS.md Scribe rewritten, every gate green** - `b2476f05` (docs). Tracer gate: the verify block was re-run end to end and passed before Task 2.
2. **Task 2: Installer and Factory Coach** - `d94e63bb` (docs)
3. **Task 3: Greenfield and Brownfield Mappers** - `1114358f` (docs)

## Files Created/Modified

- `agent-factory/roles/agents-md-scribe.md` - rewritten as the plain-English owner of the coding rules
- `agent-factory/roles/installer.md` - rewritten with its safety rules intact
- `agent-factory/roles/factory-coach.md` - rewritten, coding-rules line dropped
- `agent-factory/roles/greenfield-mapper.md` - rewritten
- `agent-factory/roles/brownfield-mapper.md` - rewritten, no-fabrication sentence added, coding-rules line dropped
- `docs/audit/29-style-dispositions/40-06.md` - one row for the Scribe's registry-anchored clause

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-diff-disposition refused the Scribe's rewritten Hard limits line**
- **Found during:** Task 1 verify
- **Issue:** the clause "If a command is unknown, ship `UNKNOWN - verify`" equals the AGENTS.md verbatim anchor in docs/audit/28-claim-registry.md (line 305). The D-30 stand-in never admits a clause that equals a registry anchor, so rewriting the Hard limits line around it made the gate report the clause removed (old line 46) and then, with the clause kept, removed and added (new line 40).
- **Fix:** kept the clause byte-identical in `## Hard limits` and created `docs/audit/29-style-dispositions/40-06.md` with one row whose before and after both carry the clause and whose companion cell names the section and the reason. The plan expected a rows file only for a watched workflow edit; this row is the only one it holds.
- **Files modified:** docs/audit/29-style-dispositions/40-06.md (new), agent-factory/roles/agents-md-scribe.md
- **Commit:** b2476f05

### Notes against the plan's wording

- RW-11 lists agents-md-scribe among the roles that keep "Follow the 12 coding rules in `AGENTS.md`", but this plan's truth keeps the Scribe's coding-rules fact through its One job sentence, as the file did at e8d7802. The Scribe carries no pointer line; check-role-rules counts the fact as kept.
- Reason clauses dropped rather than moved, because the rules they explained are still stated: "the install a user cannot safely re-run or undo is the one they stop trusting", "a wrong adapter laid down silently is harder to undo than a question asked up front", "a retro that spawns twenty tickets fixes nothing" (now "1–3 high-leverage tickets", matching Workflow 11), and the "§17.1" spec reference in the Scribe.
- The Installer's Output keeps the packaging-concerns sentence but drops "any safety hook" from it.
- Workflows 00, 01, 10 and 11 still carry caveman sentences ("grug start with idea, not with bloat", "grug look before grug touch", "grug show the work", "grug look at numbers, not vibes"). They are outside D-19 scope (only moved text is rewritten) and were left alone.

## Issues Encountered

- The untracked `~/` directory (not created by this plan, left alone as instructed) still fails `check-foundation-guards.test.ts` "every remaining floor item's LIVE COUNT is DERIVED": one of the 21 known failures.
- No sibling-caused red was seen: 40-07 had not started, so every whole-tree gate read only this plan's edits.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- PLAIN-02 and PLAIN-03 stay pending: PLAIN-02 needs the protocol (40-07) and PLAIN-03 needs 40-08's partition guard. They are not marked complete here.
- 40-08's partition guard will find no pair for any of these five roles.

## Self-Check: PASSED

All five role files and docs/audit/29-style-dispositions/40-06.md exist; commits b2476f05, d94e63bb and 1114358f are ancestors of HEAD; `git rev-list --count 8e56b202..HEAD` = 3 before this summary commit.
