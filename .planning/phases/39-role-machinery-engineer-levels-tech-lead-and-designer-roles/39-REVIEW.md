---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-30T20:13:07Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - agent-factory/config/factory.config.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - docs/audit/29-style-dispositions/39-16.md
  - docs/audit/29-style-dispositions/39-17.md
  - docs/audit/29-style-dispositions/39-18.md
  - scripts/model-dial-consistency.test.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 39: Code Review Report (re-review after gap closure round 3: plans 39-17 and 39-18)

**Reviewed:** 2026-10-30T20:13:07Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This re-review covers `git diff 235bc887..HEAD` on the 8 listed files. The range holds plan 39-17 (the previous CR-01 re-score stop ordering and step 16 hold, and the previous WR-02 `models` row) and plan 39-18 (the previous WR-01, option `park-in-blocked`, chosen by a named human).

Checks run:
- `npx vitest run scripts/model-dial-consistency.test.ts scripts/tier-kit-text.test.ts`: 183 pass, 0 fail.
- `node scripts/check-foundation-guards.js`: `tech-lead.md` is now 3489 B, under its `4000 3786` ceiling, with no WARN.

Status of the previous round's findings:
- **Previous CR-01: fixed.** The re-score stop now comes before the move record (line 43 before line 44). At `block` it records no move until the human answers. Step 16 holds on a `Stop: re-score` move note, and both holds now name the cell they read. The human's level is recorded on the move note and on a `Level:` line. The 39-16 disposition carries a correction. The smaller gaps listed under the old CR-01 are closed.
- **Previous WR-02: fixed.** The `models` row now names `xhigh`/`high`/`medium`. The new WR-02 block in `model-dial-consistency.test.ts:1872` builds its expectations from `LEVELS`, checks both directions (missing pins and stale pairs) and checks the pair count. It cannot pass vacuously, because `lineStartingWith` throws unless exactly one line matches.
- **Previous WR-01: not fixed as written. It is reopened in a new form as WR-01 below.** The register in `39-REVIEW-DISPOSITION.md` marks it `fixed`. The 39-18 text says the lowered outcome twice, and the two statements disagree for two of the three "used up" triggers.
- **Previous IN-01 and IN-02:** still open and untouched by 39-17/39-18. Carried forward as IN-01 and IN-02.

New findings:
1. "Used up" in the tagged stop includes the two re-score triggers. The new "no move, no re-enqueue" sentence therefore contradicts step 15's lowered re-score move (WR-01).
2. Nothing in the text defines how a parked ticket leaves `Blocked`. The only way out depends on a second cell that can also be lowered (WR-02).
3. The used-up stop at `block` has no way to resume and no step 16 hold. The human-override license exists only at the re-score stop, and it conflicts with the role's "Never escalate a ticket twice" (WR-03).
4. At the re-score stop the human answers with a level, but the finding that releases step 16 must say `Confirmed: yes` about a move note the human never saw (WR-04).

## Warnings

### WR-01: At `notify`/`off`, the tagged used-up stop says "no move, no re-enqueue" for the two re-score triggers, while step 15 says "raise one level / keep the level as `Move: re-plan`", and step 16 then re-enqueues (reopens the previous WR-01)

**File:** `agent-factory/workflows/04-ticket-to-pr.md:43,67`; `agent-factory/config/factory.config.md:220,222-224`; `agent-factory/roles/tech-lead.md:49`; `scripts/tier-kit-text.test.ts:1278-1330`; `docs/audit/29-style-dispositions/39-18.md:15-22,38`

**Issue:** The `## Stop conditions` bullet (line 67) defines "used up" as three triggers:
1. "the one escalation is spent and the one other move is spent too";
2. "the scores call for more than one level";
3. "or for a raise after the escalation is spent".

The sentence 39-18 added comes next and applies to the whole bullet: "At `notify` or `off`, the ticket stays in `Blocked` with no move and no re-enqueue."

Step 15's re-score stop (line 43) covers triggers 2 and 3 exactly ("When the scores call for more than one level, or for a raise after the escalation is spent"). For them it says: "At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level. Mark a kept level `Move: re-plan`." Step 16 creates a `pending/` subtask "after an escalation or a re-plan". Its only `block`-gated hold is for `Stop: re-score` at `block`, so at `notify`/`off` it re-enqueues.

Take `escalate_unadjudicable_result: off` and a two-level re-score with the escalation unspent:
- Step 15: record `Move: escalate` and re-enqueue the next level.
- Stop conditions line 67: no move and no re-enqueue.
- `tech-lead.md:49`: "After the options are used up, make no move of your own". By the stop condition's definition the options are used up, so this forbids the move as well.
- `factory.config.md:220`: also lists "the scores call for more than one level" under used up, then says "at `notify` or `off` it stays in `Blocked` with no move". The next bullet (lines 222-224) says `notify` "raises the level one step".

Four places now give two opposite outcomes for the same configured state. This is the step-versus-tagged-stop contradiction that the earlier WR-03, WR-16 and WR-01 fixes were meant to remove. The 39-18 disposition says the opposite of what the text does ("so the stop, step 15 and tech-lead.md agree", line 38). The plan's own must-have ("state one outcome") is therefore not met. The tests pin both sides with no cross-check:
- case (b) at line 1278 pins the lowered re-score move;
- cases (d) at 1302 and (f) at 1319 pin "no move" on the bullet that includes the re-score triggers.

The human's decision (39-18.md lines 15-22) holds both "no move" for a spent ticket and "a level kept at the re-score stop is a `Move: re-plan`". So the intended scope is clearly trigger 1 only. The text does not say so.

**Fix:** Limit the parked outcome to trigger 1 wherever it appears, and keep the re-score triggers on the step 15 path:
```markdown
67: ... At `notify` or `off`, a ticket whose escalation and other move are both spent stays in `Blocked` with no move and no re-enqueue; a re-score that calls for more than one level, or for a raise after the escalation is spent, follows step 15. `checkpoint: escalate_unadjudicable_result`
```
Give `factory.config.md:220` the same scope ("at `notify` or `off` a ticket with both moves spent stays in `Blocked` with no move"). Give `tech-lead.md:49` the same scope ("After the escalation and the other move are both spent, make no move of your own; ..."). Correct the 39-18 disposition's "agree" claim. Add a test that both sides cannot be true at once, for example by asserting that the line-67 parked sentence names the spent-moves trigger and not the bare "the ticket". Change the `39-REVIEW-DISPOSITION.md` row for the previous WR-01 back from `fixed` until this lands.

### WR-02: A parked ticket has no defined way out of `Blocked`, and the one escape depends on `escalate_stale_blocker`, a cell that can also be lowered

**File:** `agent-factory/workflows/04-ticket-to-pr.md:43,51,67`; `agent-factory/config/factory.config.md:223-224`; `agent-factory/workflows/09-daily-sweep.md:47`

**Issue:** At `notify`/`off` a used-up ticket "stays in `Blocked` until Workflow 09 raises it for a human". Three problems:
- **The escape can be switched off.** Workflow 09's raise is its own stop, tagged `checkpoint: escalate_stale_blocker` (09-daily-sweep.md:47). That is a non-floor cell, so prose tier and lowerable. With `escalate_unadjudicable_result: off` and `escalate_stale_blocker: off`, the ticket sits in `Blocked` and nobody is told. At `off`, step 15 records no `observation` either. Workflow 09 also runs "on demand or on a schedule", so even the default only raises the ticket when someone runs the sweep. "Until Workflow 09 raises it" is stated as certain, and it is not.
- **No exit after the raise.** `## Board moves` (line 51) says "The Tech Lead owns its exit", and it lists only exits that follow a Tech Lead move. The Tech Lead is forbidden from moving a used-up ticket ("make no move of your own"). The `## Blocked` bullet from step 14 still names the Tech Lead as the owner who clears it. No step says how the human Workflow 09 brings in records a decision, or how the ticket gets back into step 15/16. The ticket is stuck unless someone acts outside the workflow.
- **Repeated observations.** At `notify`, nothing makes "a used-up ticket also gets an `observation`" a one-time action. Each time the Tech Lead re-reads the blocked ticket it owns, it may write another one.

**Fix:** In step 15 or `## Board moves`, state the parked ticket's exit. For example: "A parked ticket leaves `Blocked` only on a named human's decision, recorded as a `finding` stamped `human:<name>` that names the move; the Tech Lead then records that move with `Stop: used-up`, and step 16 waits for it." Point the `## Blocked` owner at the human once the ticket is parked. Either say the park relies on `escalate_stale_blocker` staying at `block`, or record the `observation` at `off` as well, so a lowered stale-blocker cell does not hide the ticket. Make the `notify` observation one-time ("once, when the ticket is parked").

### WR-03: The used-up stop at `block` has no way to resume and no step 16 hold, and the "human's level stands, even past the move limits" license contradicts "Never escalate a ticket twice"

**File:** `agent-factory/workflows/04-ticket-to-pr.md:42-44,46,48,67`; `agent-factory/roles/tech-lead.md:49`

**Issue:** Take trigger 1 at the default `block`: the escalation and the other move are both spent, and the fresh scores call for no raise. The Tech Lead stops for a named human (line 67, `tech-lead.md:49`). The text then breaks down in four ways:
- **No license to act on the answer.** Line 43's "Ask the human for a level, or for another move. The human's level stands, even past the move limits." sits in the re-score stop only. The used-up stop has no equivalent, and the move limits at line 42 still forbid any further move.
- **The answer is never recorded under the human's name.** "Put the line `Stop: re-score` under the `Move:` line when the re-score stop applied" (line 44) does not cover the used-up stop. Step 16 (line 48) holds only on `Cause: gate` or `Stop: re-score`. If the Tech Lead records the human's chosen move on an engineer-caused block, step 16 releases it at once, with no `Confirmed: yes` finding. Unlike the re-score stop, the used-up stop at `block` has no mechanical hold, and the human's decision never reaches a stamped note.
- **The override conflicts with the role's hard limit.** Where the license does exist (the re-score stop), a human who names a raise after the escalation is spent makes the Tech Lead record a second `Move: escalate`. `tech-lead.md:49` says, with no exception, "Never escalate a ticket twice." Line 42 also says "it moves the ticket one level only", yet the human may name two.
- **Counting after an override is undefined.** It is not stated whether a human-licensed move counts as the escalation, as the "other move", or as neither. That matters because the move-limits count decides when the used-up stop applies next.

**Fix:**
- Treat both `block` stops the same way. Add "Ask the human for a level, or for another move. The human's choice stands, even past the move limits." to the used-up stop. Have the Tech Lead mark the resulting move note `Stop: used-up`, and add the matching hold to step 16 ("After a `Stop: used-up` move note at `checkpoints.escalate_unadjudicable_result: block`, wait also for a `Confirmed: yes` finding naming it").
- Change `tech-lead.md:49` to "Never escalate a ticket twice on your own."
- Say how a human-licensed move is counted, for example "a move a named human names is not counted against the move limits".

### WR-04: At the re-score stop the human answers with a level, but step 16 is released by a `Confirmed: yes` finding about a move note the human never saw

**File:** `agent-factory/workflows/04-ticket-to-pr.md:43,44,46,48`

**Issue:** Since 39-17, the `block` re-score flow is:
1. The Tech Lead asks the human "for a level, or for another move" and records nothing (line 43).
2. The human names a level.
3. The Tech Lead records the move note with `Stop: re-score` (line 44).
4. The Tech Lead records a finding that opens "`Confirmed: yes` or `Confirmed: no`", with a `Level:` line, and stamps it `human:<name>` with the move note's id among its refs (line 46).

Step 16 waits for that `Confirmed: yes` (line 48).

The human was never shown the move note and never answered yes or no. Their answer was a level, given before the note existed. Two problems follow:
- The "confirmation" is the same agent writing two notes one after the other. It is not a human check that the recorded note matches what the human said. If the Tech Lead writes a different level or adapter on the move note than on the `Level:` line, nothing catches it before dispatch.
- `Confirmed: no` has no defined meaning at this stop. "A `Confirmed: no` move is neither carried out nor counted" assumes a proposed move the human rejected, which this flow never has.

The gate-failure stop (line 45) does it the right way round: the move is recorded, then the human confirms it.

The 39-17 "record no move until the human answers" ordering is no longer needed for safety either, because step 16 now holds on `Stop: re-score` at `block`.

**Fix:** Run the re-score stop the way the gate-failure stop runs:
1. Record the proposed move note with `Stop: re-score` and the scored level.
2. Stop for the named human to confirm it or to name a different level.
3. Record their answer as `Confirmed: yes` (optionally with a `Level:` override) or `Confirmed: no`.

If a level-first flow is kept instead, require the move note's level to equal the finding's `Level:` line, and have step 16 dispatch the adapter for that `Level:`. Also say what `Confirmed: no` means at this stop.

## Info

### IN-01: (carried forward, still open) The iteration-2 disposition still states the reverted `3572 3381` ceiling and a WARN the role no longer trips

**File:** `docs/audit/29-style-dispositions/39-review-fix-2.md:17-22`

**Issue:** This is the previous IN-01, unchanged. The WR-05 bullet still says `ROLE_CEILINGS` "goes back to `3572 3381`" and "The role still trips the 3381 B WARN tier". The tree holds `4000 3786` (quick task 261030-fzo, HD-1), and `tech-lead.md` (now 3489 B) trips no tier. This file is outside this round's scope, but the register still lists IN-01 as `open`.

**Fix:** Append "Superseded on 2026-10-30 by quick task 261030-fzo (HD-1): `4000 3786`, approved by a named human" to the WR-05 bullet, and a matching line for HD-2 on the WR-04 bullet.

### IN-02: (carried forward, still open) "Only at `context.human_admission: all` does admission check that stamp" leaves out the fail-toward-gating cases

**File:** `agent-factory/workflows/04-ticket-to-pr.md:46`

**Issue:** This is the previous IN-02, unchanged. `isGatedNote` also gates a finding when the config cannot be read or when `human_admission` holds an unrecognised value. "Only at ... `all`" is accurate for the documented values but not for what the code actually does.

**Fix:** "At `context.human_admission: all`, admission checks that stamp (it also gates when the config cannot be read or holds an unknown value) ...".

### IN-03: `hasSentence` checks less than its comment says, and is duplicated

**File:** `scripts/tier-kit-text.test.ts:1183-1186,1256`

**Issue:** The comment says the literal must sit "at the start of the text or after `. `". The check `(\` ${text} \`).includes(\` ${sentence} \`)` only needs a space before it, so a negated phrase such as "Never Mark a kept level `Move: re-plan`." would still pass. Today's literals all begin with a capitalised imperative, so no current case gives a false pass. The helper and the `subs`/`subAt` fold are also copied into two `describe` blocks (1183 and 1256), plus a third fold at 1099. A future fix to one copy would silently miss the others.

**Fix:** Check `text.startsWith(sentence + " ") || text === sentence || text.includes(". " + sentence)` (adjusting the end the same way). Hoist `hasSentence` and the sub-bullet fold to module scope next to `section`/`numbered`.

---

_Reviewed: 2026-10-30T20:13:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
