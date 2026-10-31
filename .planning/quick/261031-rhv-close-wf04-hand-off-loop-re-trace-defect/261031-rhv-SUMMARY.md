---
phase: quick-261031-rhv
plan: 01
status: complete
subsystem: kit-workflows
tags: [workflow-04, tech-lead, hand-off-loop, human-stop, factory-config, text-checks]
requires:
  - phase: quick-261031-oxi
    provides: the seven WF04 hand-off loop fixes (HEAD 4f6cacea) that the second re-trace read
provides:
  - R1-R4 from the second first-time-reader re-trace closed in WF04 steps 15 and 17, the used-up stop, tech-lead.md `## Hard limits` and factory.config.md
  - test cases (z), (aa), (ab), (ac) in the G-39-71 describe, plus re-pinned D-21 amended, WR-01, 39-18 (e), (a), (g), (q), (s), (u), (y)
  - docs/audit/29-style-dispositions/quick-261031-rhv.md (16 rows)
affects: [phase-39-close, phase-43-milestone-uat]
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - docs/audit/29-style-dispositions/quick-261031-rhv.md
  modified:
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/tech-lead.md
    - agent-factory/config/factory.config.md
    - scripts/tier-kit-text.test.ts
    - CHANGELOG.md
decisions:
  - "Every kit sentence went in verbatim as the plan gave it; the lexicon and guards refused none, so nothing was shortened."
  - "The CHANGELOG Tech Lead bullet keeps its first four wrapped lines byte for byte; only the changed last sentence was re-wrapped. The hand-off loop bullet was replaced whole and wrapped at 100 columns."
  - "The CONTEXT nit on the \"one\" antecedent stays open: no edited sentence contained it."
metrics:
  duration: "about 30 min of edits plus a 23 min full-suite run (2026-10-31T20:14:54Z to 20:44:41Z)"
  completed: 2026-10-31
actuals:
  tokens: 14900
  tasks: 3
  commits: 3
plan_head_before: 4f6caceae72b541b23ba514b707f7fee0497f761
plan_head_after: 9e08db1b5aec5d13d29df5dd4121b3ec947d0d4b
---

# Quick 261031-rhv Plan 01: Close the four WF04 hand-off loop re-trace defects Summary

The revert of an unapproved fundamental change is now a recorded, counted hand-off. Once a human answers at the human stop, at any value, the grugops Orchestrator records the answer and queues the Tech Lead. The hand-back carries the human's `Approved:` or `Rejected:` line. A raise past the spent escalation is a human-stop trigger in all six places, and no plan note names the raised level before the human answers.

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 (R4, tracer) | 554491f7 | fix(quick-261031-rhv): a raise past the spent escalation applies the human stop everywhere, and no plan note names that level first (R4) |
| 2 (R1, R2, R3) | feb8ad65 | fix(quick-261031-rhv): the revert is a recorded hand-off, the Orchestrator queues the Tech Lead once a human answers, and the hand-back carries Approved: or Rejected: (R1, R2, R3) |
| 3 (CHANGELOG) | 9e08db1b | docs(quick-261031-rhv): changelog for the four Workflow 04 hand-off loop re-trace fixes |

Task 1 holds exactly the five planned files, Task 2 the four planned files, Task 3 CHANGELOG.md alone. No commit deletes a file.

## RED and GREEN transcripts (`npx vitest run scripts/tier-kit-text.test.ts`)

Baseline at 4f6cacea: `Tests 148 passed (148)`.

**Task 1 RED** (`Tests 6 failed | 143 passed (149)`, matching the plan), each on a missing sentence:

```
× D-21 amended: a second escalation stops for a named human, ...      expected '...' to contain 'Stop the same way before a second esc…'
× WR-01: one escalation and one other move per ticket, ...            expected '...' to contain 'Used up also covers scores calling fo…'
× (e) tech-lead.md `## Hard limits` hands a used-up ticket off, ...   expected '...' to contain 'Stop the same way before a second esc…'
× (a) the hand-off sub-bullet names the receiving role, ...           hand-off sub-bullet lacks "Used up also covers scores calling for more than one level while the escalation is unspent."
× (g) the used-up stop hands off first, ...                           used-up stop lacks "It also means the scores call for more than one level while the escalation is unspent."
× (ac) R4: a raise past the spent escalation applies the human stop everywhere, ...   hand-off sub-bullet lacks "Used up also covers ... while the escalation is unspent."
```

**Task 1 GREEN:** `Tests 149 passed (149)`.

**Task 2 RED** (`Tests 7 failed | 145 passed (152)`, matching the plan):

```
× (q)  step 17 lacks "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`."
× (s)  step 17 lacks "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`."
× (u)  step 17 lacks "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`."
× (y)  step 15 lacks "When an answer note queued the Tech Lead, read that note too."
× (z)  step 17 lacks "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`."
× (aa) human-stop sub-bullet lacks "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human."
× (ab) move-record sub-bullet lacks "After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human."
```

**Task 2 GREEN:** `Tests 152 passed (152)`. Case (w) passed unedited throughout.

The 7-file targeted run: 478 after Task 1, `Tests 481 passed (481)` after Task 2 (477 at HEAD plus 4).

## Gates

After each task: `npm run build`, `npm run typecheck`, check-imperative-lexicon, check-foundation-guards (`PASS agent-factory/roles/tech-lead.md 3776B within ceiling`, no WARN line for it), `VALIDATE_KIT_ROOT=. validate-agent-factory`, check-kit-refs, check:claim-anchors, freshness:adapters, freshness:catalog and freshness all exit 0. Task 3: check:public-docs, check-banned-claims and check:claim-anchors exit 0, and the four CHANGELOG phrase checks pass on the line-joined text.

## Sentences shortened by the lexicon or a guard

None. Every sentence went in exactly as the plan gave it.

## Disposition counts (`node scripts/check-diff-disposition.js`)

| Point | Findings |
|-------|----------|
| HEAD 4f6cacea (recorded pre-existing red) | 721 |
| After Task 1 kit edits, no rows | 727 (6 new clauses: TL:49, WF04:44, :45, :51, :70 twice) |
| After the six R4 rows | 721 |
| After Task 2 kit edits | 731 (10 new clauses: WF04:42, :45 twice, :46, :51 six times) |
| After the ten R1-R3 rows | 721 |
| After Task 3 | 721 |

The base commit `4d2b8f079cc43d7d6184729966492789fb4dc05e` was not moved. The three FROZEN-section rows (two in WF04 `## Stop conditions`, one in tech-lead.md `## Hard limits`) carry their companion cells.

## Invariants

- tech-lead.md: 3776 B (3773 B at HEAD; WARN fires at 3786).
- WF04: 2 `checkpoint: ` tags, 6 `## Stop conditions` bullets; the defect 5 park sentence is still last before the `checkpoint: escalate_unadjudicable_result` tag.
- The step 15 lead sentence "Read the `failed-attempt` note (Tech Lead)." and step 16 are byte-unchanged; the human-stop sub-bullet still ends with the defect 5 resume sentence.
- `git diff --quiet 4f6cacea -- scripts/checkpoints.ts scripts/checkpoints.js hooks` passes. No config key, default or ROLE_CEILINGS value changed.
- `docs/audit/28-prepass-evidence.md` is still ` M` and unstaged; the untracked `~/` directory was not touched.

## Full non-e2e suite (`timeout 1800 npx vitest run --exclude '**/scripts/e2e/**'`)

Result: `Test Files 7 failed | 130 passed (137)`, `Tests 21 failed | 10722 passed | 2 skipped (10745)` (duration 1365.82 s). That is exactly the expected line. The total rose by 4, matching cases (z), (aa), (ab) and (ac).

| File | Failing now | Baseline (after 261031-oxi) |
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
| R1 revert records nothing, wakes no one, cycles uncounted | "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`." / "Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change." / "Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change." / "That hand-off counts like any other, and step 16 dispatches it." | WF04 step 17 | (z), re-pinned (u) |
| R2 nobody wakes the Tech Lead when a human answers | "At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human." / "The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15." / "When an answer note queued the Tech Lead, read that note too." / config: "Under every value, once a human answers at the human stop, the Orchestrator records the answer in a `decision` note and queues the Tech Lead." | WF04 step 15 human stop and lead line; factory.config.md step 15 bullet | (aa), re-pinned (y) |
| R3 hand-back does not say approved or rejected | "After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human." / "Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`." / "When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules." / "A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`." | WF04 step 15 move record, step 17 | (ab), re-pinned (q), (s) |
| R4 contradiction on a raise past the spent escalation | "Used up also covers scores calling for more than one level while the escalation is unspent." / "Apply it also when the scores call for a raise past the spent escalation." / "It publishes no plan note naming the raised level before the human answers." / stop: "It also means the scores call for more than one level while the escalation is unspent." + "The same stop applies when the scores call for a raise past the spent escalation." / TL: "Stop the same way before a second escalation." / config row ", or whose scores call for a raise past the spent escalation.", stop bullet "or the scores call for more than one level while the escalation is unspent." + "The same holds when the scores call for a raise past the spent escalation.", `block`: "It stops the same way when the scores call for a raise past the spent escalation." | WF04 steps 15 and 17, used-up stop; tech-lead.md `## Hard limits`; factory.config.md row, stop bullet, `block` | (ac), re-pinned D-21 amended, WR-01, 39-18 (e), (a), (g) |

All four are also described in the CHANGELOG `[Unreleased]` `### Changed` Workflow 04 bullets.

## Seen and left (for the re-trace that follows)

These were already in the text, outside R1-R4, and were not edited:

1. The gate-failure stop at `exhaust_self_fix_budget: block` asks a human to confirm a recorded move, and the text does not say who queues the Tech Lead to record that `Confirmed:` finding.
2. The double confirmation (CONTEXT nit): if "show the human the move note" is read as a second answer, the R2 sentences cover it only by reading.
3. The step 16 `Cause: gate` hold could be read to cover any later hand-off on a cause first raised by a `Cause: gate` note, the R1 revert hand-off included.

Still open: the CONTEXT nit on the "one" antecedent in the human-stop sub-bullet ("A receiving role writes one per step 17." / "Record one when ..."). No edited sentence contained it.

## Deviations from Plan

None in the kit text: every sentence went in verbatim. Two small notes:

- Case (z) also asserts `expect(TREAT_NEW).toBe(PASS_RULE)`, an extra line beyond the plan's behavior list, so the shared constant and the R1 case cannot drift apart. It changes no count.
- The CHANGELOG Tech Lead bullet: only its last sentence changed, and only the lines after "before a fourth hand-off on one ticket," were re-wrapped, so the first five lines stay byte-identical.

## Threat surface

No new endpoint, auth path, file access or schema change. T-qrhv-01 to T-qrhv-05 are mitigated by the text and pinned by (z), (aa), (ab), (ac) and the re-pinned cases. Each task's verify asserted 2 tags and an empty diff on checkpoints.ts, checkpoints.js and hooks/.

## Self-Check: PASSED

- Commits 554491f7, feb8ad65 and 9e08db1b are ancestors of HEAD; `git rev-list --count 4f6cacea..HEAD` prints 3.
- docs/audit/29-style-dispositions/quick-261031-rhv.md exists; check-diff-disposition prints 721.
