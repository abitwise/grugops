---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-30T16:10:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - .claude/agents/grugops-software-engineer-junior.md
  - .claude/agents/grugops-software-engineer-mid.md
  - .claude/agents/grugops-software-engineer-senior.md
  - CHANGELOG.md
  - agent-factory/config/factory.config.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - docs/audit/29-style-dispositions/39-16.md
  - docs/audit/29-style-dispositions/39-review-fix-1.md
  - docs/audit/29-style-dispositions/39-review-fix-2.md
  - install/README.md
  - install/install.test.ts
  - scripts/adapter-byte-baseline.test.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/checkpoints.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/model-dial-consistency.test.ts
  - scripts/model-tiers.js
  - scripts/model-tiers.test.ts
  - scripts/model-tiers.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 39: Code Review Report (re-review after review-fix iteration 2 and gap closure round 2)

**Reviewed:** 2026-10-30T16:10:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

This re-review covers `git diff 5236ede3..HEAD` on the 23 listed files. The range holds:
- review-fix iteration 2 (the previous report's WR-01 to WR-06 and IN-01 to IN-04);
- quick task 261030-fzo (HD-1 ceiling raise, HD-2 `notify` wording, HD-3 `escalate_unadjudicable_result` paragraph);
- gap closure round 2: 39-14 level re-pin, 39-15 docs and key-set wording, 39-16 split of Workflow 04 step 15.

Findings already recorded in `39-REVIEW-DISPOSITION.md` are not raised again. That includes the deferred IN-05 and IN-06 and the open IN-07 to IN-10. This report numbers its own findings from CR-01, WR-01 and IN-01.

Checks run:
- `npm run freshness`: all 88 committed `.js` files match a rebuild, so `scripts/model-tiers.js` and `scripts/check-foundation-guards.js` are faithful builds.
- `npx vitest run` on the seven touched test files: 1291 pass and 1 fails. The failure is `scripts/check-foundation-guards.test.ts:3566` (the `.js` walk against git's index). The cause is the stray untracked `~/` directory at the repo root, which holds `.js` files from another project. It is environmental and not a code finding.
- `node scripts/check-foundation-guards.js`: `tech-lead.md` is 3439 B, under its new `4000 3786` ceiling, with no WARN. The ceiling comment's arithmetic is correct: ceil(4000 x 1.06 / 1.12) = 3786.
- The 39-16 split keeps the sentence multiset of step 15 exactly. A diff of the sorted sentences before and after shows only the five added labels. **The sentence order did change, though, and that matters (CR-01).**

What is correct:
- The level re-pin (junior `haiku`/`xhigh`, mid `sonnet`/`high`, senior `opus`/`medium`) is consistent across `LEVELS`, the three generated adapters, the README table, the CHANGELOG `[Unreleased]` entry, `factory.config.md` § Engineer levels and § Absent means inherit, and every test literal.
- The iteration-2 fixes for the previous WR-01, WR-02, WR-04, WR-05, WR-06, IN-01, IN-02, IN-03 and IN-04 hold as written.

What is not:
1. The 39-16 reorder now records the move note before the re-score stop. Step 16 only holds the re-enqueue for a gate failure, so at the default `block` an engineer-raised ticket whose re-score calls for two levels is re-enqueued past its human stop (CR-01).
2. The WR-03 fix ties the used-up stop to `escalate_unadjudicable_result`. At `notify`/`off` that drops the loop bound, which the stop condition and the role's hard limit still state as unconditional (WR-01).
3. The field-reference table row in `factory.config.md` still carries the old pins (WR-02).

## Critical Issues

### CR-01: The step 15 split records the move before the re-score stop, and step 16 never holds for that stop, so at the default `block` an engineer-raised two-level re-score is re-enqueued without the named human

**File:** `agent-factory/workflows/04-ticket-to-pr.md:42-44,48`; `scripts/tier-kit-text.test.ts:1107-1118`; `docs/audit/29-style-dispositions/39-16.md:9-13`

**Issue:** Before plan 39-16, step 15 had the re-score stop first ("When the scores call for more than one level ... At `block`, the default, stop for a named human ..."). The counting sentences came next, and only then "Record the move in a new `decision` note". So at `block` the Tech Lead stopped before any move note existed.

The split puts the parts in a new order:
1. "Apply the move limits."
2. "Record the move in a new `decision` note per Workflow 16. ... Mark a re-score that raises the level `Move: escalate`." (line 43)
3. "Apply the re-score stop. ... At `block`, the default, stop for a named human." (line 44)

Read in order, which is how a sub-bullet list reads, the Tech Lead now publishes a `Move: escalate` (or `Move: re-plan`) note and only then stops.

Step 16 (line 48) is the Orchestrator's release. It holds only for a gate failure:
- "Create it only after an escalation or a re-plan."
- "Create it only once the step 15 move is recorded."
- "After a `Cause: gate` note at `block`, wait also for a `Confirmed: yes` finding that names the move note."

So for a `Cause: engineer` block whose re-score calls for two levels:
- the escalation note is recorded;
- step 16's conditions are all met;
- the Orchestrator creates the `pending/` subtask and spawns the adapter while the Tech Lead is still waiting for the human.

The default `block` stop is bypassed. This is the same class of defect as the earlier CR-02 (a re-enqueue that skipped a human stop the stop condition requires).

The text has three smaller gaps of its own:
- The "Record the human's confirmation" bullet only lets the human answer `Confirmed: yes` / `Confirmed: no` on a recorded move. At the re-score stop the human is deciding a level, and there is no way to record that decision, such as "take two levels" or "keep the level".
- Step 16's "at `block`" no longer says which cell it means. Since WR-03, step 15 reads two cells (`exhaust_self_fix_budget` and `escalate_unadjudicable_result`).
- At `notify`/`off`, "Record the scored level in the move note" now comes after the note was already recorded in the bullet above.

Plan 39-16's disposition says the split "changes no instruction". The test at `tier-kit-text.test.ts:1107` pins the new order, so the regression is locked in.

**Fix:**
- Put the re-score stop before the move record, and say that at `block` no move note is written until the human answers.
- Give step 16 the matching hold, and name the cell in both conditions.
- Move the two openings in the test at line 1107 to match.

For example:
```markdown
    - Apply the move limits. ...
    - Apply the re-score stop. When the scores call for more than one level, or for a raise after the escalation is spent, read `checkpoints.escalate_unadjudicable_result`. ... At `block`, the default, stop for a named human before recording any move. ...
    - Record the move in a new `decision` note per Workflow 16. ...
16. ... After a `Cause: gate` note at `checkpoints.exhaust_self_fix_budget: block`, wait also for a `Confirmed: yes` finding that names the move note. After a re-score stop at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding that names the move note.
```
Also correct the 39-16 disposition: the split reordered the re-score stop and the move record.

## Warnings

### WR-01: At `notify`/`off`, the used-up stop no longer stops, but no legal move is left and the "never retry in a loop" bound still reads as unconditional

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41,44,67`; `agent-factory/config/factory.config.md:216-226`; `agent-factory/roles/tech-lead.md:49`

**Issue:** The WR-03 fix in this range made step 15 say "The used-up stop below follows the same value", meaning `checkpoints.escalate_unadjudicable_result`. HD-3's paragraph in `factory.config.md` repeats it ("The used-up stop above follows the same value") and defines `notify`/`off` only for the re-score case: "raises the level one step if the escalation is unspent, and otherwise keeps the level". Apply that to the used-up case at `off`, where the escalation is spent and the one other move is spent too:
- **No stop.** The tagged stop follows `off`, so it does not stop.
- **No legal move.** "Besides the escalation, make at most one other move per ticket" (line 41) has no checkpoint condition, so a third move is forbidden.
- **"Keep the level" has no `Move:` label.** Step 15 does not say whether it is a `Move: re-plan`. If the Tech Lead records one, step 16 re-enqueues ("only after an escalation or a re-plan"). The engineer blocks again and the cycle repeats without a bound.
- **Two statements still say there is a bound.** The stop condition at line 67 still says "never retry in a loop", and `tech-lead.md:49` still says "After the options are used up, stop for a named human" with no condition. That is the step-versus-tagged-cell contradiction the earlier WR-03 and WR-16 fixed, now running the other way.

So lowering this cell either deadlocks the Tech Lead or removes the D-21 loop bound, and the text does not say which.

**Fix:** Decide what the used-up stop does when the cell is lowered, and write it in step 15, the HD-3 paragraph and the role's hard limit. For example:
- Keep the used-up stop at a named human under every value. "Used up" is the loop bound, not an unadjudicable result. Move it out of the tagged bullet, or say "the re-score stop follows this cell; the used-up stop always stops".
- Or define the `notify`/`off` outcome for a spent ticket explicitly (for example "leave the ticket in `Blocked` and record an `observation`"), and name the `Move:` line that "keep the level" uses.

### WR-02: The `models` row of the config field table still states the old level pins

**File:** `agent-factory/config/factory.config.md:28`

**Issue:** The top-level field table, the first place a configuring reader looks, still says the three engineer level adapters "pin junior `haiku`/`medium`, mid `sonnet`/`medium` and senior `opus`/`high`". The 2026-10-30 human re-decision changed the pins, and the following now say `xhigh` / `high` / `medium`:
- the generated adapters;
- `LEVELS`;
- `factory.config.md:125` and the § Absent means inherit paragraph;
- the README table;
- the CHANGELOG.

The G-39-5 docs alignment (39-15) missed this row, and none of the new pins covers it. `tier-kit-text.test.ts:477` checks only the line-125 sentence, and `model-dial-consistency.test.ts` G-39-6 checks only the Refusals and closed-set paragraphs. The same document now states two different zero-config efforts for the same adapters.

**Fix:** Change the row to "junior `haiku`/`xhigh`, mid `sonnet`/`high` and senior `opus`/`medium`". Add a pin next to the line-477 check, for example `expect(CONFIG).not.toContain("junior \`haiku\`/\`medium\`")` plus a positive check for the new row text, so the next re-decision cannot leave the table behind.

## Info

### IN-01: The iteration-2 disposition still states the reverted `3572 3381` ceiling and a WARN the role no longer trips

**File:** `docs/audit/29-style-dispositions/39-review-fix-2.md:17-22`

**Issue:** The WR-05 bullet says `ROLE_CEILINGS` "goes back to `3572 3381`" and that "The role still trips the 3381 B WARN tier". Quick task 261030-fzo (`aa21a823`) then set `4000 3786` with a named human's approval, and the 3439 B role no longer trips any tier. The audit file gives no pointer to the later decision, so a reader auditing the ceiling from this file gets a value that is not in the tree. The same goes for the WR-04 bullet's "left for a human to settle", which HD-2 has since settled.

**Fix:** Add a line to each bullet, for example "Superseded on 2026-10-30 by quick task 261030-fzo (HD-1): `4000 3786`, approved by a named human", and the same kind of line for HD-2.

### IN-02: "Only at `context.human_admission: all` does admission check that stamp" leaves out the two other cases where admission gates the finding

**File:** `agent-factory/workflows/04-ticket-to-pr.md:46`

**Issue:** `isGatedNote` (`scripts/context-io.ts:6497,6503`) also gates every finding when the config file exists but cannot be read, and when `human_admission` holds any unrecognised value (fail toward gating). The new sentence says "Only at ... `all`". That is accurate for the documented values but not for the actual behaviour, and the WR-01 fix was meant to make this sentence exactly true.

**Fix:** "Admission checks that stamp only at `context.human_admission: all`, or when the config cannot be read or holds an unknown value ...". Or drop "Only" and say "At `context.human_admission: all`, admission checks that stamp".

---

_Reviewed: 2026-10-30T16:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
