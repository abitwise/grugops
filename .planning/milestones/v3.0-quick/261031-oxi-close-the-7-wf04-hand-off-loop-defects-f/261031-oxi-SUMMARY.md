---
phase: quick-261031-oxi
plan: 01
status: complete
subsystem: kit-workflows
tags: [workflow-04, tech-lead, hand-off-loop, human-stop, factory-config, text-checks]
requires:
  - phase: quick-261031-nd9
    provides: the 39-UAT D1-D3 decisions in WF04 steps 15-17, tech-lead.md and factory.config.md
provides:
  - a closed WF04 hand-off loop for a first-time reader (7 defects closed)
  - test cases (s)-(y) in the G-39-71 describe, plus re-pinned (g), (q), (r), 39-18 (d) and (e), and the tech-lead D-21 case
  - docs/audit/29-style-dispositions/quick-261031-oxi.md (19 rows)
affects: [phase-39-close, phase-43-milestone-uat]
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - docs/audit/29-style-dispositions/quick-261031-oxi.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - CHANGELOG.md
decisions:
  - "Every sentence went in verbatim as the plan gave it; the lexicon and guards refused none, so nothing was shortened."
  - "The three CONTEXT nits stay open: none of them fell inside a sentence this task edited."
metrics:
  duration: "about 32 min of edits plus a 23 min full-suite run (2026-10-31T18:15:47Z to about 18:50Z)"
  completed: 2026-10-31
actuals:
  tokens: 13900
  tasks: 3
  commits: 4
plan_head_before: 1ee3007b4e4b9ecadc652f70d3f66826f609fba3
plan_head_after: 595c088a4895ec8c68cfbadf779886e84eaec884
---

# Quick 261031-oxi: Close the 7 WF04 hand-off loop defects Summary

This task closes the seven defects in the Workflow 04 hand-off loop:
- An approved fundamental change now names its approval `finding` and passes the check.
- A rejected proposal now has a branch.
- The `Resolved:` check runs at the step 2 re-plan and reads the diff.
- A re-plan raise past the spent escalation goes to the human stop.
- A ticket parked at `notify` or `off` resumes once a human answers.
- The ceiling now reads "before a fourth hand-off on one ticket".
- The Orchestrator queues the Tech Lead after the first block and after `Resolved:`.

D1-D3 are unchanged, and no checkpoint tag, stop bullet, hook, config key or role ceiling moved.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 (defect 6, tracer) | 3c339e70 | WF04, tech-lead.md, factory.config.md, tier-kit-text.test.ts, quick-261031-oxi.md |
| 2 (defects 1, 2, 3, 5) | d625c209 | WF04, tech-lead.md, factory.config.md, tier-kit-text.test.ts, quick-261031-oxi.md |
| 3 (defects 4, 7) | 346ae704 | WF04, tier-kit-text.test.ts, quick-261031-oxi.md |
| 3 (CHANGELOG) | 595c088a | CHANGELOG.md alone |

`commits: 4` is measured with `git rev-list --count 1ee3007b..HEAD`. No commit deletes a file.

## RED / GREEN transcripts (`npx vitest run scripts/tier-kit-text.test.ts`)

**Task 1.**
- RED: `Tests 2 failed | 140 passed (142)`.
  - × (r): `human-stop sub-bullet lacks "Apply it also before a fourth hand-off on one ticket."`
  - × (x): `Workflow 04 still carries "three hand-offs on one ticket"`
- GREEN: `Tests 142 passed (142)`.
- Tracer re-verify after the commit: still 142 passed, and the disposition gate still prints 721. The run then went on to Task 2.

**Task 2.**
- RED: `Tests 9 failed | 137 passed (146)`. The failures were exactly the 6 edited pins and the 4 new cases, and each one failed on a missing sentence.
  - The 6 pins: the D-21 amended case, 39-18 (d), 39-18 (e), (g) and (q).
  - The 4 new cases: (s), (t), (u) and (w).
- GREEN: `Tests 146 passed (146)`.

**Task 3.**
- RED: `Tests 2 failed | 146 passed (148)`.
  - × (v): `step 17 lacks "The raise counts as the one escalation per ticket."`
  - × (y): `step 14 lacks "The Orchestrator then queues a pending/ subtask for the Tech Lead, who reads that failed-attempt note at step 15."`
- GREEN: `Tests 148 passed (148)`. The G-39-71 describe ends (r), (s), (t), (u), (v), (w), (x), (y).

**After each task:**
- The 7-file targeted run passed: 471, then 475, then 477 tests.
- These gates exited 0: build, typecheck, check-imperative-lexicon, check-foundation-guards (with no WARN for tech-lead.md), validate-agent-factory, check-kit-refs, check:claim-anchors, freshness:adapters, freshness:catalog and freshness.
- After the CHANGELOG edit, check:public-docs and check-banned-claims also exited 0.

## Sentences shortened by the lexicon or a guard

None. Every sentence went in exactly as the plan gave it.

## Disposition counts (`node scripts/check-diff-disposition.js`)

| Point | Findings |
|-------|----------|
| Before Task 1 (HEAD 1ee3007b) | 721 |
| Task 1 edits, no rows yet | 724 (3 new clauses) |
| After the 3 defect 6 rows | 721 |
| Task 2 edits, no rows yet | 732 (11 new clauses) |
| After the 11 rows for defects 1, 2, 3 and 5 | 721 |
| Task 3 edits, no rows yet | 726 (5 new clauses) |
| After the 5 rows for defects 4 and 7 | 721 |

- The file has 19 rows in total.
- Rows in a FROZEN section carry the companion cell the plan specifies:
  - WF04 `## Stop conditions`: 2 rows (defects 6 and 5).
  - tech-lead.md `## Hard limits`: 2 rows (defects 6 and 5).
- The base commit `4d2b8f07…` did not move.

## tech-lead.md byte count

It went from 3764 B to 3767 B (Task 1) to 3773 B (Task 2). That is under WARN 3786, and the foundation guards print `PASS agent-factory/roles/tech-lead.md 3773B within ceiling`.

## Structural invariants

- WF04 still has 2 `checkpoint: ` tags and 6 `## Stop conditions` bullets.
- `git diff --quiet 1ee3007b -- scripts/checkpoints.ts scripts/checkpoints.js hooks` exits 0.
- No config key, default or ROLE_CEILINGS value changed.

## Full non-e2e suite (`timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`)

Result: `Test Files 7 failed | 130 passed (137)`, `Tests 21 failed | 10718 passed | 2 skipped (10741)`. That is exactly the expected line. The total rose by 7, matching cases (s)-(y).

| File | Failing now | Baseline (after 261031-nd9) |
|------|-------------|-----------------------------|
| scripts/context-io.test.ts | 7 | 7 |
| scripts/context-io-writer-set.test.ts | 2 | 2 |
| scripts/canonical-corpus.test.ts | 1 | 1 |
| scripts/harness-instance-ledger.test.ts | 4 | 4 |
| scripts/uat-gate-exit-contract.test.ts | 5 | 5 |
| install/installer-fs-census.test.ts | 1 | 1 |
| scripts/check-foundation-guards.test.ts | 1 | 1 (environmental: "every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose") |

No failure is outside the baseline set, and no baseline failure is marked passing.

## Defect-to-sentence table

| Defect | Carrying sentence(s) | Where | Case |
|--------|----------------------|-------|------|
| 1 approved change re-blocks | "Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`." / "It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`." / "Record either hand-back as `Move: hand-off` with `Stop: human`; it counts toward no limit." | WF04 step 17, step 15 human stop | (s) |
| 2 rejection has no branch | "On rejection, apply the move the human names." / "Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules." / config: "On approval it hands … On rejection it applies … Neither hand-back counts toward a limit." | WF04 step 15 human stop, config `block` | (t) |
| 3 check anchored to step 16, reads only the note | "At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition." / "The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it." | WF04 step 17 | (u), re-pinned (q) |
| 4 re-plan raise with escalation spent | "The raise counts as the one escalation per ticket." / "For a raise past the spent escalation, the Tech Lead returns the ticket to `Blocked` and applies the human stop." | WF04 step 17 | (v) |
| 5 no resume at `notify`/`off` | "At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16." / "Wait the same way at `notify` or `off` once a human answers." / used-up stop "...no re-enqueue until a human answers." / tech-lead.md "At `notify` or `off`, leave it in `Blocked` with no move until a human answers." / config "...with no move until a human answers." and "Once a human answers, the Tech Lead proceeds as at `block`, from the move record through Workflow 04 step 16." | WF04 steps 15, 16, used-up stop; tech-lead.md; config | (w), re-pinned (g), 39-18 (d) (e), D-21 |
| 6 ceiling timing | "before a fourth hand-off on one ticket", in 2 places in WF04, 1 in tech-lead.md and 3 in the config | WF04 step 15 and used-up stop; tech-lead.md; config row, WF04 bullet, `block` | (x), re-pinned (r) |
| 7 nobody queues the Tech Lead | "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that `failed-attempt` note at step 15." / "When a step 17 answer queued the Tech Lead, read that answer note too." / "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that answer note at step 2." | WF04 steps 14, 15, 17 | (y) |

The CHANGELOG `[Unreleased]` `### Changed` Workflow 04 bullets describe the whole final loop.

## CONTEXT nits still open

No sentence this task edited contained any of these:
1. In the human-stop sub-bullet, "one" has an unclear antecedent ("A receiving role writes one per step 17. Record one when…").
2. The human is asked for "a level" even for design or requirement disputes, and the `Level:` line is required even when the human named a move or approved a proposal.
3. After `Resolved:`, nobody removes the receiving role's `## Blocked` bullet.

## Deviations from Plan

None. The plan was executed exactly as written.

## Known Stubs

None.

## Untouched

- `docs/audit/28-prepass-evidence.md` still shows ` M` and is unstaged.
- The untracked `~/` directory was not touched.
- No docs artifacts (SUMMARY, STATE, PLAN, CONTEXT) were committed, and ROADMAP.md was not updated.

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/quick-261031-oxi.md
- FOUND in HEAD history: commits 3c339e70, d625c209, 346ae704, 595c088a
