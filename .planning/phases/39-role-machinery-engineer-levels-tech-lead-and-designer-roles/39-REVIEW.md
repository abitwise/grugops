---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-30T09:20:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - agent-factory/checklists/complexity-rubric.md
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/roles/designer.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - CHANGELOG.md
  - .claude/agents/grugops-designer.md
  - .claude/agents/grugops-software-engineer-junior.md
  - .claude/agents/grugops-software-engineer-mid.md
  - .claude/agents/grugops-software-engineer-senior.md
  - docs/audit/29-style-dispositions/39-11.md
  - docs/audit/29-style-dispositions/39-12.md
  - install/agents-record.test.ts
  - install/install.js
  - install/install.test.ts
  - install/install.ts
  - install/README.md
  - scripts/adapter-byte-baseline.test.ts
  - scripts/generate-role-adapters.js
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-tiers.js
  - scripts/model-tiers.ts
  - scripts/tier-kit-text.test.ts
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: issues_found
---

# Phase 39: Code Review Report (re-review after gap closure round 1)

**Reviewed:** 2026-10-30T09:20:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

This re-review covers the changes since `bb1be9f0` made by plans 39-11, 39-12 and 39-13. The prior
ledger (`39-REVIEW-DISPOSITION.md`) is the baseline. CR-01, CR-02, WR-01..WR-10 and IN-01..IN-03 are
recorded as fixed, and IN-04..IN-06 are deferred. None of them is reported again. New IDs continue
from the ledger: WR-11 onward and IN-07 onward. No new critical ID is used.

Checks run:
- `tsc` into a scratch directory. The committed `install/install.js`, `scripts/generate-role-adapters.js` and `scripts/model-tiers.js` are byte-identical to the fresh build.
- `node scripts/generate-role-adapters.js` left the tree clean.
- `scripts/tier-kit-text.test.ts` and `scripts/adapter-byte-baseline.test.ts` pass (103 tests).
- The `install.test.ts` cases matching "no longer ships" pass (13 tests).

I also probed the presence path by hand in scratch targets with four marker states:
- no marker;
- a pre-ledger marker (an installed marker with `ledger` and `agents` removed);
- a malformed ledger (`ledger: "x"`);
- invalid JSON.

The TypeScript side of WR-06 works for the pre-ledger case it targets. But the README states more
coverage than the code gives (WR-11).

Most of the new defects are in the Workflow 04 / Tech Lead escalation text that CR-02 and WR-01
rewrote:
- a split or Architect move still re-enqueues an engineer;
- the re-score rule conflicts with "one level";
- the move count reads notes it cannot tell apart;
- the named-human confirmation lives only in the workflow, is never recorded, and ignores the checkpoint dial.

## Warnings

### WR-11: The README says install and `--dry-run` print the presence note when the install ledger "cannot be read". Install refuses over such a marker and prints no note

**File:** `install/README.md:183-188` (also the code comment at `install/install.ts:917-926`; the pinned test in `scripts/tier-kit-text.test.ts`, case "WR-06: a repository the install ledger cannot vouch for ...")

**Issue:** The README groups three kinds of repository: one "last installed by v2.1 or earlier", one whose ledger "is absent", and one whose ledger "cannot be read". It then says "install, `--dry-run` and `install.js --check` print a `note` instead". That is not what the code does:
- **Malformed ledger.** Install takes the `INSTALL_REFUSAL` branch (`install.ts:6614/6622/6776`) before the Claude kit branch, so `reportStaleKitAdapters` never runs. A probe with `ledger: "x"` printed only "the install ledger is malformed ..., so nothing was installed" under both install and `--dry-run`, with no note. Only `--check` prints the note.
- **Unreadable marker (invalid JSON).** Both install and `--check` stop at the marker ("nothing else was checked"), so neither prints a note.
- **Consequence in code.** The `malformed` arm of `ledgerSays` can never be reached from install. The STALE KIT ADAPTERS comment ("a ledger can have nothing to say: ... one that cannot be read") makes the same over-claim.

This is the defect class WR-06 was filed for (the README claims coverage the code does not give), now in the fix's own text. The user is not left uninformed: install's refusal names the marker problem. But the README's description of what each mode prints is wrong.

**Fix:** Say what each mode actually does, for example:
```markdown
A repository last installed by v2.1 or earlier, or one with no install marker, has no ledger record
for its adapters (kit files entered the install ledger in v2.2). For an unshipped
`.claude/agents/grugops-*.md` file the ledger has no record of, install, `--dry-run` and
`install.js --check` print a `note` instead ... When the install ledger is malformed, install refuses
and writes nothing until it is fixed; `install.js --check` still prints the note.
```
Then fix the comment at `install.ts:917-926` the same way, and update the pinned test strings.

### WR-12: For a split or an Architect move, Workflow 04 steps 15-16 still return the ticket to `Ready for Dev` and re-enqueue an engineer

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41-42`; `agent-factory/roles/tech-lead.md:42`

**Issue:** Step 15 offers four moves: escalate, re-plan and re-score, split, or return to the Architect. Whatever the move, it ends with "Return the ticket to `Ready for Dev`." Step 16 then always says "Create a new `pending/` subtask for the adapter the new note names" and "Spawn the adapter as step 4 does."

The stop conditions disagree for two of the moves:
- **Split:** "`SPLIT_REQUIRED`. It goes back to BA/PM for splitting before it can enter `Ready for Dev`" (line 57).
- **Architect:** "send the ticket back to `In Design` for the Architect. Dispatch no engineer." (line 58).

The Tech Lead's Board moves (`tech-lead.md:42`) also say the Tech Lead exits `## Blocked` by "returning the ticket to `Ready for Dev`", with no exception.

An agent following the numbered steps after a split or an Architect move therefore puts the ticket in `Ready for Dev`. The Orchestrator then looks for an adapter name in a note that has none, or reuses the previous one. Either way an engineer is dispatched on a ticket whose design or size has just been rejected. Steps 15 and 16 were edited in this round (CR-02, WR-01), so this sequence is in scope. It is separate from the deferred IN-06, which covers the step-2 split stop.

**Fix:** Make the return and the re-enqueue depend on the move:
```markdown
15. ... Record the move in a new `decision` note per Workflow 16. On an escalation or a re-plan,
    return the ticket to `Ready for Dev`. On a split, move it to `Backlog` for BA/PM. On an Architect
    pass, move it to `In Design`.
16. On an escalation or a re-plan only, create a new `pending/` subtask for the adapter the new note
    names (Orchestrator). ...
```
Mirror the same rule in the Board moves section of `tech-lead.md`.

### WR-13: "A re-score that raises the level is the escalation" conflicts with "escalate one level" and does not cover a re-score after the escalation is spent

**File:** `agent-factory/roles/tech-lead.md:34,48`; `agent-factory/workflows/04-ticket-to-pr.md:41,61`

**Issue:** The new rule creates two cases that neither file decides:
1. **A re-score jumps two levels.** The rubric can move a ticket from junior (sum 0-3, F2 = F3 = 0) straight to senior (sum 8-12) once a re-plan exposes more work. The rule calls that re-score "the escalation". The escalation is defined as "escalate one level". Hard limits say "Never pick a level without the written scores", so the Tech Lead cannot name mid either. One rule must break.
2. **The escalation is already spent, and the one other move is a re-plan whose re-score raises the level.** That re-score would be a second escalation, which "Never escalate a ticket twice" forbids. It cannot keep the old level, because that contradicts the written scores. The "used up" stop does not fire, because "the one other move" was not spent: it could not be made. The Tech Lead has no legal output, and no stop names this case.

**Fix:** Settle both cases in the shared text, for example: "A re-score that raises the level is the escalation and moves the ticket one level only. When the scores call for more than one level, or for a raise after the escalation is spent, stop for a named human (`checkpoint: escalate_unadjudicable_result`)." Add the same clause to the "options are used up" stop.

### WR-14: The bound on Tech Lead moves is counted from `decision` notes, but those notes cannot be told apart

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41`; `agent-factory/roles/tech-lead.md:34,37`; `agent-factory/roles/software-engineer.md:42`

**Issue:** WR-01's bound depends on "Count the earlier moves from the ticket's `decision` notes." The ticket's `decision` notes (by ticket id in `refs`) include:
- the Tech Lead's own original plan (WF04 step 2: a `decision` note with scores, level, adapter and tasks), which has the same shape as a re-plan note;
- the engineer's implementation decisions (`software-engineer.md:42`: "the implementation decisions as `decision` notes ... each carrying the trace ids on its `refs` field");
- the Architect's design decisions, which the Tech Lead plans on top of.

No file says how a move note records which move it is. So the count of moves, and of escalations in particular, has nothing structured to read. Over-counting stops the work early; that direction is safe. Under-counting, or calling a re-score an "other move", breaks the bound that ends the D-21 loop. This is the failure WR-01 was meant to close.

**Fix:** Give the move note a fixed line, and count only the Tech Lead's notes that carry it:
```markdown
Record the move in a new `decision` note per Workflow 16 whose first line is
`Move: escalate | re-plan | split | architect`. Count earlier moves from the Tech Lead's
`decision` notes for this ticket that carry a `Move:` line; the plan note from step 2 carries none.
```
State it in both `tech-lead.md` § Output and WF04 step 15, and pin the line in `tier-kit-text.test.ts`.

### WR-15: The CR-02 human stop exists only in Workflow 04, and the confirmation is recorded nowhere step 16 or the trace can read

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41-42,60`; `agent-factory/roles/tech-lead.md:34,42,48`

**Issue:**
1. **The Tech Lead's role file has no human stop.** Its Reads list does not include Workflow 04. Responsibility 5 and the Board moves sentence ("It owns the exit of a dev-raised `## Blocked`, returning the ticket to `Ready for Dev`") have no gate-failure condition. Hard limits mention a human only once the options are used up. A Tech Lead adapter acting from its role file returns the ticket to `Ready for Dev` without waiting for a person, so the board shows the ticket as ready before anyone confirmed.
2. **Step 16's condition cannot be checked.** It allows the re-enqueue only once the move is "confirmed by that human". No step says where the confirmation or the human's name is recorded: no note kind, no `human:<name>` stamp, no ticket section. Agents share nothing except the verified context. An Orchestrator in a later session, or an auditor, has no published fact to check. The "auditable trail" the project promises holds no proof that the human stop happened.

**Fix:**
- Add the stop to `tech-lead.md` item 5 and to its Board moves: "When the `failed-attempt` note came from a gate `BLOCKED_NEEDS_FIX`, leave the ticket in `Blocked` until a named human confirms the move."
- In WF04 step 15, say how the confirmation is recorded, for example "the confirming human's name is recorded on the move's `decision` note as `confirmed_by: human:<name>`" (or a `human:<name>`-stamped note per Workflow 16).
- Make step 16 read that record.

### WR-16: Step 15's human stop ignores the `exhaust_self_fix_budget` checkpoint dial

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41`; `agent-factory/config/factory.config.md:188-211`

**Issue:** Step 15 now says "After a gate `BLOCKED_NEEDS_FIX`, stop until a named human confirms the move." The sentence has no condition and no checkpoint tag; the 39-12 disposition says this was deliberate ("the tag stays in `## Stop conditions`").

The project rules say otherwise:
- `factory.config.md` makes this stop a configurable cell: `exhaust_self_fix_budget` takes `block` (the default), `notify` (the action proceeds and is recorded) or `off`.
- CLAUDE.md requires every role to honor `factory.config.json` when it is present.

A repository set to `notify` gets the stop condition at line 60, which is governed by the cell, and the step at line 41, which always stops. The two disagree, and an agent reading the numbered steps stops whatever the setting. The error leans the safe way (it stops more, never less), but it is still a configuration contradiction inside one workflow.

**Fix:** Tie the step to the cell without adding a second tag, for example: "After a gate `BLOCKED_NEEDS_FIX`, apply the `exhaust_self_fix_budget` cell of the stop condition below: at `block` (the default), stop until a named human confirms the move." Or state on purpose that this Tech Lead stop is not governed by the cell, and say why.

## Info

### IN-07: `ledgerSays` adds a second wording of "the install ledger cannot vouch for this file", and its `malformed` arm says "could not be read" for a ledger that was read

**File:** `install/install.ts:1009-1011`

**Issue:** `install-marker.ts` already has the single source of this wording: `notRecordedReason` and `LEDGER_UNUSABLE_CAUSE` ("could not be used (this run reports why on its own line)"). `ledgerSays` builds a separate copy. In the one place its `malformed` arm runs (the doctor), the note says "the install ledger could not be read". It is printed under the doctor's own FAIL, which says the marker "holds a malformed install ledger (the install ledger is not a list)": the ledger was read and refused, not left unread. A probe showed the two lines together.

**Fix:** Build the reason from `LEDGER_UNUSABLE_CAUSE` for `malformed`, for example `ledger.state === "malformed" ? \`is malformed (${LEDGER_UNUSABLE_CAUSE})\` : ...`, or route the note through `notRecordedReason`.

### IN-08: Other junior-exclusion statements still name only four of the ten rubric tags, and the role copies the tag list by hand

**File:** `agent-factory/config/factory.config.md:170`; `scripts/model-tiers.ts:1468,1492,1518`; `agent-factory/roles/software-engineer.md:37`

**Issue:** WR-02 fixed the engineer's stop rule. But the D-2 paragraph in `factory.config.md` still says the junior takes "never security, migration, concurrency or test-integrity work", and the `LEVELS` rationale in `model-tiers.ts` says the same. Under mapping rule 4, data writes, a public interface, config, auth, money and PII also rule junior out. Neither statement is false, but each is narrower than the rule.

Separately, `software-engineer.md:37` now repeats the rubric's tag list by hand ("auth, money, PII, data writes, a public interface or config"). That list can drift from the F3 row in `complexity-rubric.md:19`.

**Fix:** Change the D-2 paragraph to "never work the rubric tags with any F3 risk (see `complexity-rubric.md` § Junior exclusions)". In the role, point to the rubric's F3 row instead of listing the tags.

### IN-09: The run-time flattening lists leave out effort settings documented a few lines earlier

**File:** `agent-factory/config/factory.config.md:166,174-180`; `install/README.md:2072-2078`

**Issue:** `factory.config.md:166` says a `maxEffortLevel` setting "caps the level on every provider". That one setting can run all three levels at one effort, but it is missing from the "What can flatten the levels at run time" list at lines 174-180.

The README summary lists four settings and says "Any of them can run the three levels on one model". It leaves out `CLAUDE_CODE_EFFORT_LEVEL` and `maxEffortLevel`, which flatten effort rather than model.

The WR-09 fix removed the count from the lead-in, but the README still carries a second, shorter list of names.

**Fix:** Add a `maxEffortLevel` bullet to the `factory.config.md` list. In the README, either drop the list of names and keep only the pointer, or name every setting and say "on one model or one effort".

### IN-10: The new presence-path tests leave out the README's headline case and two branches

**File:** `install/install.test.ts:12339-12449`

**Issue:** Every planted test uses a target with no install marker at all, so the ledger is `absent` because the marker is. Untested:
- The case the README leads with: a v2.1-era marker that is present and has no `ledger` field. I checked it by hand: install and `--check` both print the "is absent" note.
- The `malformed` arm (the doctor's "could not be read" note).
- The `unreadable` branch: an existing `.claude/agents/` that cannot be listed, which goes to `unrecordedAdaptersUnreadableText`.

So the wording and the branch WR-11 and IN-07 discuss have no test pinning them.

**Fix:** Add three cases:
- a marker with `ledger` (and `agents`) deleted from a real install's marker;
- a malformed `ledger` under `--check`, asserting the note and the FAIL;
- a `chmod 000` on `.claude/agents` (skipped on Windows or as root), asserting the "cannot list" note and no other note.

---

_Reviewed: 2026-10-30T09:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
