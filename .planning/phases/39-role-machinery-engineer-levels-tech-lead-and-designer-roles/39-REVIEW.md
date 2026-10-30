---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-30T11:05:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - docs/audit/29-style-dispositions/39-review-fix-1.md
  - install/README.md
  - install/install.js
  - install/install.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: issues_found
---

# Phase 39: Code Review Report (re-review after review-fix iteration 1)

**Reviewed:** 2026-10-30T11:05:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This re-review covers `git diff 1fc3128f..HEAD` on the nine files the fixes for WR-11 to WR-16 touched (commits `1edfc8c5` to `c6f08087`). The question for each fix is whether it is correct and complete, and whether it brought in new defects or new disagreements between the role text, the workflow, the README, the TypeScript sources with their compiled `.js`, and the tests that pin the text. Earlier IDs (CR-01, CR-02, WR-01 to WR-16, IN-01 to IN-10) are recorded in `39-REVIEW-DISPOSITION.md` and are not reported again. This report numbers its own findings from WR-01 and IN-01.

Checks run:
- `npm run freshness`: 88 committed `.js` files match a rebuild. `install/install.js` and `scripts/check-foundation-guards.js` are faithful builds.
- `npx vitest run scripts/tier-kit-text.test.ts`: 97 tests pass.
- `node scripts/check-foundation-guards.js` prints ALL CHECKS PASSED. It also prints `WARN agent-factory/roles/tech-lead.md 4110B >= 3996B — approaching ceiling` (see WR-05).
- `npm run check:diff-disposition` exits 1. None of the clauses it flags in `04-ticket-to-pr.md` or `tech-lead.md` comes from these fixes. All of them are older `memory-bank/` path and board-move clauses.
- WR-11 README claims, probed in scratch installs:
  - **`ledger: "x"`:** install and `--dry-run` exit 3 with a `verify` line and no note. `--check` exits 1 with a FAIL plus the note.
  - **Marker that is not valid JSON:** install, `--dry-run` and `--check` all stop at the marker, and none prints a note.
  - **Marker with `ledger` deleted:** install and `--dry-run` print the note.

  The README's WR-11 paragraph matches this behaviour. Its only gap is IN-02.

**WR-11, WR-12 and WR-14 are correct as far as they go.**

**WR-13, WR-15 and WR-16 each leave a gap or bring in a new one:**
- The `human:<name>` confirmation finding that WR-15 relies on is not checked by anything at the zero-config default. The disposition file says the admission guard checks it (WR-01).
- Step 16 waits for any `human:<name>` finding that names the move note, so a recorded rejection would also release it (WR-02).
- The WR-13 stops repeat the step-versus-tagged-cell contradiction that WR-16 fixed, this time for `escalate_unadjudicable_result` (WR-03).
- WR-16 treats `notify` the same as `off` (WR-04).

## Warnings

### WR-01: The `human:<name>` confirmation finding is unchecked at the default dial, and the disposition says the admission guard checks it

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41-42`; `docs/audit/29-style-dispositions/39-review-fix-1.md:21-23,61,63`

**Issue:** WR-15 makes the gate-failure human stop "leave a published fact an Orchestrator or an auditor can check". The fact is a `finding` stamped `human:<name>`. The disposition row at line 61 says this is "Workflow 16's `human:<name>` stamp, which the admission guard checks on Claude Code". That is not true in the configurations this stop runs under:
- `hooks/admission-guard.ts` gates a note only when `isGatedNote(by, kind, config)` is true.
- With `context.human_admission` at `off` (the documented lean default, `factory.config.md:94,273`) nothing is gated, so the hook allows any `human:<name>` stamp.
- At `high-severity`, only findings by `security-nfr`, `architect-design` or `release-manager` are gated (`scripts/context-io.ts:4274`). A finding written by the Tech Lead is not.
- Only `human_admission: all` makes the hook check the stamp against `GRUGOPS_ADMISSION_APPROVED_BY`.

So at the default `exhaust_self_fix_budget: block`, the agent can write the "human confirmation" itself with a made-up name, and step 16 will accept it. An auditor cannot tell this finding from a real confirmation.

This also contradicts `factory.config.md` § "Where each cell is enforced", which says every non-floor cell is prose tier with "No mechanism refuses the action". A disposition claiming enforcement that does not exist goes against the project's no-fabrication rule.

Step 15 also does not say who writes the finding. The step is labelled "(Tech Lead)", so as written the Tech Lead agent writes a `human:`-stamped note.

**Fix:**
- Correct the disposition rows (lines 21-23, 61, 63) to say what is true. For example: "a `human:<name>`-stamped finding; on Claude Code with `context.human_admission: all` the admission guard binds the stamp to the human's session grant; at the default `off` it is a prose-tier record that the agent writes after the human answers."
- In step 15, name the writer and the limit. For example: "The Tech Lead records the confirmation, after the named human answers, as a `finding` ... Never write the stamp without that answer."

### WR-02: Step 16 waits for any `human:<name>` finding that names the move note, so a recorded rejection releases the re-enqueue, and a rejected move still uses up the budget

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41-42,61`; `agent-factory/roles/tech-lead.md:35,41`

**Issue:** At `block`, step 15 publishes the move note first ("Record the move in a new `decision` note ... Open its body with `Move: ...`") and only then stops for the human. The text covers only a human who confirms:
1. **A rejection releases step 16.** Step 16's condition is "wait also for the `human:<name>` finding that names the move note". A finding that records the human's **rejection** also names the move note and carries the same stamp. The literal condition does not require the finding to say "confirmed", so the Orchestrator can re-enqueue on a rejection.
2. **A rejection has nowhere to go.** No text says what happens when the human says no: whether the Tech Lead records a different move, whether the ticket stays in `Blocked`, or whether it goes to the used-up stop.
3. **A rejected move still counts.** The move note carries a `Move:` line, so under WR-14's counting rule it counts toward "at most one other move per ticket" even though it was never carried out. One human rejection can use up the Tech Lead's options.

**Fix:**
- Make the finding say yes or no, and make step 16 read it. For example: "Record the human's answer as a `finding` ... whose body opens with `Confirmed: yes` or `Confirmed: no`. Step 16 waits for a `Confirmed: yes` finding that names the move note."
- In step 15, say that a `Confirmed: no` move is not counted, and that the Tech Lead records a new move or stops for the human.

### WR-03: The WR-13 stops are unconditional in step 15 but tagged `escalate_unadjudicable_result` in the stop conditions, which is the contradiction WR-16 just fixed for another cell

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41,61`; `agent-factory/roles/tech-lead.md:35`; `agent-factory/config/factory.config.md:213`

**Issue:** Step 15 now says "Stop for a named human when the scores call for more than one level" and "... for a raise after the escalation is spent". Role item 5 says the same, with no condition. The same two cases were added to the used-up stop at line 61, which carries `checkpoint: escalate_unadjudicable_result`. That makes them a configurable cell (`block` / `notify` / `off`). WR-16 fixed exactly this mismatch for `exhaust_self_fix_budget`: the numbered step always stops while the tagged stop follows the cell. WR-13 brings it back for this cell.

There is also a second problem. At `notify` or `off`, the text gives the Tech Lead no legal move for a two-level re-score:
- "one level only" rules out taking the scored level.
- "Never pick a level without the written scores" rules out picking the in-between level.

That is the original WR-13 deadlock, reopened under a non-default dial. The cell's documented meaning, "Self-stamping a high-stakes result no gate can adjudicate", also does not describe a re-score that jumps two levels. That makes the tag a poor fit, and so does what `notify`/`off` would mean for it.

**Fix:** Pick one and state it in step 15, role item 5 and the line-61 stop:
- **Option 1:** Tie the step to the cell the way WR-16 did ("read `checkpoints.escalate_unadjudicable_result` ... at `block`, the default, stop ...") and say what the Tech Lead does at `notify`/`off`. For example: "take the one-level raise and record the scored level in the note".
- **Option 2:** Say on purpose that these two stops do not follow any cell, and move them out of the tagged bullet into their own untagged stop condition.

### WR-04: At `notify`, step 15 makes the move with no record, so `notify` behaves exactly like `off`

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41`; `agent-factory/config/factory.config.md:191-193`

**Issue:** `factory.config.md` defines the three values: `block`, "the action waits for a named human"; `notify`, "the action proceeds and is recorded (a finding note)"; `off`, "the action proceeds silently". WR-16's new sentence is "At `notify` or `off`, make the move without that human." That merges the two values. A repository that chose `notify` gets no record that the gate-failure move went ahead without its human. That repository chose `notify` instead of `off` to get exactly that record. The WR-16 test in `scripts/tier-kit-text.test.ts:708` pins the merged sentence, so the defect is locked in.

**Fix:** Split the sentence: "At `notify`, make the move and record a note naming the move note and the spent budget. At `off`, make the move without that human." Update the pin to match. The note probably has to be an `observation`, because a `finding` needs a stamp; `factory.config.md`'s "(a finding note)" wording is worth checking at the same time.

### WR-05: The new `tech-lead.md` ceiling was measured at an intermediate size; the shipped file already trips its WARN tier, and the comment misstates the size

**File:** `scripts/check-foundation-guards.ts:3561`; `scripts/check-foundation-guards.js:3100`; `agent-factory/roles/tech-lead.md`

**Issue:** The `ROLE_CEILINGS` entry was re-measured in the WR-14 commit: "measured 3769 B, +12% / +6% rounded up". It gives `4222 3996`. WR-15 and WR-16 then added more text, and the role ships at **4110 B**. That is already over the new WARN ceiling (3996 B). The guard prints `WARN agent-factory/roles/tech-lead.md 4110B >= 3996B — approaching ceiling` on a ceiling raised in this same fix round.

The effects:
- The comment's "measured" figure is not the size of the file it governs.
- The +6% early warning, whose purpose is to flag growth, now fires all the time. It can no longer report new growth.
- Measured against the Plan 39-05 baseline (3189 B), the role has grown 29%. The ceiling was raised 18% (3572 to 4222).

The fix report says "A human should confirm that raising this ceiling is acceptable", and no confirmation is recorded. CLAUDE.md's minimal-substrate rule is the reason these ceilings exist.

**Fix:** Re-measure on the final file (4110 B gives `4604 4357`) and correct the comment. Or, better, cut the role back below the old ceiling: point item 5 at "Workflow 04 steps 15-16" for the `Move:` line format and the `checkpoints` condition instead of restating them. Then keep or drop the raise only after the named human confirms it.

### WR-06: Step 16's "After a gate failure at `block`" needs a fact step 14 never records: the `failed-attempt` note is "the same note" for an engineer block and a gate block

**File:** `agent-factory/workflows/04-ticket-to-pr.md:40-42`; `agent-factory/roles/tech-lead.md:35,44`

**Issue:** WR-15 and WR-16 make two decisions turn on whether the block came from the gate. Step 15 (Tech Lead) decides whether to read `exhaust_self_fix_budget` and stop. Step 16 (Orchestrator) decides whether to wait for the `human:<name>` finding. But step 14 records "the same note when the gate ends `BLOCKED_NEEDS_FIX`" and gives no field or fixed line that tells the two causes apart. `failed-attempt` is a soft kind with a free-text body (WF16 line 33).

This is the class of defect WR-14 fixed for `decision` notes: the condition depends on an unstructured note. If either role misreads the cause, the gate-failure human stop is skipped.

**Fix:** Give the `failed-attempt` note a fixed first line in step 14, for example `Cause: engineer-blocked` or `Cause: gate-blocked-needs-fix`. Have steps 15 and 16 and role item 5 read it ("When the note opens with `Cause: gate-blocked-needs-fix` ..."). Pin the line in `tier-kit-text.test.ts`.

## Info

### IN-01: The tagged gate-failure stop still says "before the re-enqueue (step 15)", but the re-enqueue is step 16 and the stop now also holds split and Architect moves

**File:** `agent-factory/workflows/04-ticket-to-pr.md:60`

**Issue:** "A named human confirms the Tech Lead's decision before the re-enqueue (step 15)." The re-enqueue is in step 16. Since WR-12, a split or an Architect pass has no re-enqueue at all, yet step 15 still holds those tickets in `Blocked` until the human confirms. The frozen stop now describes less than the step it governs.

**Fix:** In a companion row: "A named human confirms the Tech Lead's move before the ticket leaves `Blocked` (step 15) and before any re-enqueue (step 16)."

### IN-02: The README's unreadable-marker sentence leaves out `--dry-run`, and "print no note from install" is ambiguous next to `install.js --check`

**File:** `install/README.md:190-194`

**Issue:** A probe shows that `--dry-run` also stops at an invalid-JSON marker (exit 3, no note). The sentence names only "install and `install.js --check`", while the malformed-ledger sentence just before it names `--dry-run` separately. The lead sentence also says "Two marker states print no note from install", and the next sentence says `install.js --check` "still prints the note" in one of them. Some readers will take "install" to include `install.js --check`.

**Fix:** "...install, `--dry-run` and `install.js --check` all stop at the marker and print no note." Change the lead sentence to "Two marker states stop install and `--dry-run` without a note."

### IN-03: "On an escalation" in the WF04 board moves now means two different things

**File:** `agent-factory/workflows/04-ticket-to-pr.md:45`

**Issue:** "On an escalation the Software Engineer moves the ticket to `Blocked`, and the Tech Lead owns its exit back to `Ready for Dev`. After a split that exit is `Backlog`..." In this sentence "escalation" means the engineer's `BLOCKED`. Since WR-13 and WR-14, "escalation" is also the name of one Tech Lead move (`Move: escalate`). Step 15 uses it that way, in "On an escalation or a re-plan, return the ticket to `Ready for Dev`." Read next to step 15, the board-move sentence suggests that only an escalation goes back to `Ready for Dev`, and leaves out the re-plan.

**Fix:** "When the engineer reports `BLOCKED`, or the gate ends `BLOCKED_NEEDS_FIX`, the ticket moves to `Blocked`. The Tech Lead owns its exit: `Ready for Dev` after an escalation or a re-plan, `Backlog` after a split, `In Design` after an Architect pass."

### IN-04: The role's new Reads line cites Workflow 04 by step number, and no test ties those numbers to the blocked-ticket steps

**File:** `agent-factory/roles/tech-lead.md:25`; `scripts/tier-kit-text.test.ts:265-267`

**Issue:** "`agent-factory/workflows/04-ticket-to-pr.md` steps 14-16, the path of a blocked ticket." The WF04 tests find steps by their text (`stepAt(...)`), not by number. The role test pins only the Reads string. If a step is inserted before step 14, the role silently points the Tech Lead at the wrong steps.

**Fix:** In the test, find the steps by text and check that their numbers are 14, 15 and 16. Alternatively, cite the steps by content ("the `failed-attempt` and re-enqueue steps").

---

_Reviewed: 2026-10-30T11:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
