---
phase: 39-role-machinery-engineer-levels-tech-lead-and-designer-roles
reviewed: 2026-10-31T09:15:27Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - CHANGELOG.md
  - agent-factory/config/factory.config.md
  - agent-factory/roles/architect-design.md
  - agent-factory/roles/ba-pm.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - docs/audit/29-style-dispositions/39-19.md
  - scripts/tier-kit-text.test.ts
findings:
  critical: 4
  warning: 8
  info: 4
  total: 16
status: issues_found
---

# Phase 39: Code Review Report (re-review after gap closure round 4: plans 39-19 and 39-20)

**Reviewed:** 2026-10-31T09:15:27Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Scope: `git diff ad5a044f HEAD` for the eight listed files. Plans 39-19 and 39-20 put G-39-71 / D-21 amended into Workflow 04 steps 15-17, the used-up stop, tech-lead.md, factory.config.md, the BA/PM and Architect pointers and the CHANGELOG. `npx vitest run scripts/tier-kit-text.test.ts` passes: 137 of 137.

The four places that state the rule now use the same phrases, and the tests pin those phrases. The rule itself does not hold together when you trace it as a state machine:

- **Re-entry is missing.** After a receiving role answers `Disputed:` or `Fundamental:`, no step brings the Tech Lead back. So the three-round count, which the decision rests on, cannot be reached by the written procedure (CR-01).
- **The fundamental-change gate comes after the change.** The receiving role makes the fix and then labels it `Fundamental:`. It also decides that label for its own fix (CR-02).
- **The move limits can be bypassed.** After a `Resolved:` answer, the step-2 re-plan has no level limit (CR-03).
- **Causes have no identity.** The per-cause bound and the round count both depend on a free-text judgement by the agent the bound limits (CR-04).

Smaller issues: "a human is asked only after three rounds" is untrue on two other paths (WR-01). Some causes have no receiving role (WR-02). A hand-off can be made early (WR-03). Roles other than BA/PM and the Architect cannot answer a hand-off (WR-04). The board ownership in step 17 conflicts with the role files (WR-05, WR-07). A stale plan can be pulled after `Resolved:` (WR-06). One sentence in tech-lead.md is ambiguous (WR-08).

The tests pin the words but none of the transitions above. Every finding below passes the current suite.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: No step brings the Tech Lead back after a `Disputed:` or `Fundamental:` answer, so rounds 2-3 and the `Fundamental:` human stop cannot be reached

**File:** `agent-factory/workflows/04-ticket-to-pr.md:42,50,51`
**Issue:** Step 17 ends with "After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again." Nothing after that line makes the Tech Lead act:
- Step 15 is triggered only by "Read the `failed-attempt` note (Tech Lead)." A `Disputed:` or `Fundamental:` answer is a `decision` note, not a `failed-attempt` note.
- Step 16 queues a subtask "only after an escalation, a re-plan or a hand-off". All three are Tech Lead moves, so a receiving role's answer queues nothing.
- The Orchestrator's routing (`orchestrator.md:46`) has `ready-ticket dev plan -> Tech Lead` and no route for a blocked ticket whose owner is the Tech Lead.

The whole bound depends on this loop: Disputed, then the Tech Lead hands off again, and so on up to three rounds. The `Fundamental:` trigger of the human stop is applied in step 15 by the Tech Lead and depends on it too. As written, after the first `Disputed:` or `Fundamental:` the ticket sits in `Blocked`, owned by a Tech Lead nobody dispatches. Only the Workflow 09 stale-blocker sweep reaches it, after `blocked_escalation_days`. When `escalate_stale_blocker` is lowered, the config's own line 226 says nothing raises it. The gate-failure sub-bullet (line 47) also keys on "When the note opens with `Cause: gate`". On the re-entry pass, "the note" is undefined.
**Fix:** State the re-entry in step 17 and in step 15's lead line. For example, at the end of step 17:
```markdown
After `Disputed:` or `Fundamental:`, name the Tech Lead as the `## Blocked` owner again, and create a `pending/` subtask for the Tech Lead (Orchestrator). The Tech Lead returns to step 15 with the answer note in place of the `failed-attempt` note; the gate-failure stop reads the ticket's latest `failed-attempt` note.
```
Then pin it in the G-39-71 describe: step 17 names the Tech Lead's subtask, and step 15 names the answer note as an input.

### CR-02: The fundamental-change gate is checked after the change is made, and the role that made the change decides whether it was fundamental

**File:** `agent-factory/workflows/04-ticket-to-pr.md:45,51`; `agent-factory/config/factory.config.md:226`
**Issue:** Step 17 says: "Fix the cause within the role's own job, or dispute it. ... Mark it `Fundamental:` when the fix changes a requirement or a rule fundamentally." Nothing tells the receiving role to hold back a fundamental fix. So BA/PM can rewrite what a requirement delivers, or the Architect can alter an ADR, and the role labels the note `Fundamental:` afterwards. The human stop then sees a change that already exists. Step 17's own list of fundamental changes includes "a `checkpoints` value", so an agent could change a gate setting before the human is asked.

The label is also chosen by the role that made the fix. Nothing in the steps cross-checks a `Resolved:` answer that carries a fundamental change, so writing `Resolved:` skips the human entirely. Config line 226 says lowering the cell does not "license an agent to make a fundamental change". At `block` the text gives no such protection either, because the change comes before the stop.

The human stop also does not fit this trigger. It asks the human "for a level, or for another move" (line 45), not to approve or reject a proposed change. So there is no recorded approval of the change itself.
**Fix:** Make the change a proposal and give the human the matching question:
```markdown
17. ... Never make a fundamental change yourself: write it as a proposal in a `Fundamental:` note and leave the requirement, rule, ADR or `checkpoints` value unchanged. ...
```
In step 15, under the human stop: "When a `Fundamental:` note triggered it, ask the human to approve or reject the proposed change; on approval, hand the change to the role that proposed it." Also have the Tech Lead check every `Resolved:` note against the step-17 definition of fundamental before step 16 dispatches.

### CR-03: The step-2 re-plan after `Resolved:` has no level limit, which bypasses the "move limits unchanged" rule and "never escalate twice on your own"

**File:** `agent-factory/workflows/04-ticket-to-pr.md:29,43,51`; `agent-factory/roles/tech-lead.md:49`
**Issue:** Step 17 says: "After `Resolved:` ... The Tech Lead then plans it again per step 2 before any pull." Step 2 scores the ticket from scratch and names any level. It carries no `Move:` line, and step 15 says "The plan note from step 2 carries none". So a level change made in that re-plan is not counted as a move.

Example: a ticket goes from junior to mid (the escalation is spent) and a re-plan is spent. It blocks, is handed to BA/PM, and BA/PM answers `Resolved:`. The step-2 re-plan then names senior. That is a second escalation, made by the Tech Lead alone. The text says that case is used up ("a raise past the spent escalation", line 44) and should go to the hand-off or a human. D-21 amended says "The per-ticket move limits are unchanged", and tech-lead.md says "Never escalate a ticket twice on your own". The written path breaks both, and no test pins the step-2 interaction.
**Fix:** Bind the re-plan to the limits in step 17:
```markdown
The Tech Lead then plans it again per step 2 before any pull. The step 15 move limits still apply to that plan: a level above the last dispatched level is the escalation, and a raise past the spent escalation, or by more than one level, is used up and goes to the hand-off.
```
Add a test asserting that step 17 carries this sentence.

### CR-04: A "cause" has no identity, so neither the per-cause bound nor the round count can be checked, and relabelling a cause loops without limit

**File:** `agent-factory/workflows/04-ticket-to-pr.md:44,45,46,70`; `agent-factory/config/factory.config.md:221`
**Issue:** The no-loop bound is per cause: "Hand off one cause at most three times", "A round is a `Disputed:` ... note naming a hand-off note for the same cause", "A block with a new cause counts no round". But a cause is only free text ("add a `To:` line ..., then state the cause"). Nothing defines when two causes are the same. That decision belongs to the Tech Lead, the agent whose count the bound limits.

There is also no per-ticket limit: "A `Move: hand-off` note counts toward no move limit." After each `Resolved:` the ticket leaves `Blocked` (step 17), which resets the time the stale-blocker sweep measures. So the cycle block, hand-off, `Resolved:`, re-plan, block, with each block described as a "new cause", never reaches the human stop and never trips Workflow 09. The frozen stop condition promises "never retry in a loop", and the text does not guarantee it. The disposition register says D-21 "allows" new causes, but "same cause" is never defined, so the bound cannot be audited from the notes. The decision said a recorded first line lets the Tech Lead "count rounds without reading free text", yet "same cause" still depends on free text.
**Fix:** Give each cause a stable key that every later note must repeat:
```markdown
Under `Move: hand-off`, add a `To:` line naming the receiving role and a `Cause-id:` line (the id of the `failed-attempt` note that first raised the cause). A `Disputed:` note and a same-cause re-block name that `Cause-id:`. A new `Cause-id:` needs a new `failed-attempt` note whose `Cause:` line differs.
```
Ask the human whether a per-ticket ceiling across causes is wanted, for example "after three hand-offs on one ticket, apply the human stop". That is the only rule that makes "never retry in a loop" hold when causes keep changing.

## Warnings

### WR-01: "A named human is asked only after three disputed rounds" is untrue on two paths the text does not reconcile

**File:** `CHANGELOG.md:68-71`; `agent-factory/workflows/04-ticket-to-pr.md:47`; `agent-factory/config/factory.config.md:209,220`
**Issue:**
1. A hand-off is a `Move:` (line 46), and the gate-failure sub-bullet is kept byte for byte (pinned by test (i)). So after a `Cause: gate` note at the default `exhaust_self_fix_budget: block`, a named human must confirm every hand-off, and step 16 holds the dispatch for it. The text also does not say whether a hand-off the human confirmed counts toward the three, or is "a hand-off the human names" that "counts toward no limit" (line 45).
2. The ticket stays in `Blocked` through every `Disputed:` round, and the row's `since` date is never reset. So at the default `escalate_stale_blocker: block`, Workflow 09 raises the ticket for a human after `blocked_escalation_days` (default 2), possibly in the middle of the rounds.

The CHANGELOG ("A named human decides only after the roles dispute one cause three times, or when ...") and the config roster cell present the three rounds as the only route to a human.
**Fix:** Name both interactions in step 15 and in the config paragraph. For example: "A hand-off after a `Cause: gate` note still needs the gate-failure confirmation; that confirmation is not a round and the hand-off still counts toward the three. Workflow 09 may raise a ticket in mid-round; the human's answer then counts as the human stop." Reword the CHANGELOG to "A named human decides the dispute only after ..." and keep the gate-failure confirmation visible.

### WR-02: There is no rule for a cause that no other role's job covers

**File:** `agent-factory/workflows/04-ticket-to-pr.md:44`
**Issue:** Line 44 makes "scores calling for more than one level, or for a raise past the spent escalation" part of "used up", and then requires a hand-off to "the role whose job covers its cause". When the cause is "this ticket needs senior and only one level is allowed", no agent role may grant that. Scoring is the Tech Lead's own job, and the old text sent that case to the human. The same gap applies to an external dependency, a credential or a vendor decision.

The text names no fallback, so an agent will improvise. It might hand off to itself or to the engineer, which counts toward no limit (see WR-03), or invent a receiving role. Otherwise the ticket goes through three empty rounds before reaching the only party who can decide.
**Fix:** Add to the hand-off sub-bullet: "When no role other than the Tech Lead has a job that covers the cause, apply the human stop at once. Never hand off to the Tech Lead or the Software Engineer."

### WR-03: A hand-off can be made before the options are used up, and it counts toward no limit

**File:** `agent-factory/workflows/04-ticket-to-pr.md:43,44,46`
**Issue:** "Once the options are used up, hand the ticket ..." says when a hand-off is required, not that it is allowed only then. Line 46 lists `Move: hand-off` as a fifth `Move:` value next to the four choices, and line 43 says it "counts toward no move limit". A Tech Lead can therefore write `Move: hand-off` / `To: Architect` instead of `Move: architect`, which spends no move. With a `Resolved:` answer it then gets a free step-2 re-plan (CR-03). `Move: architect` and a hand-off to the Architect also do the same job with different board exits (`In Design` vs `Blocked`) and different limit accounting. Nothing says which one to use.
**Fix:** "Make a hand-off only once the options are used up; before that, a design cause is `Move: architect` and a scope cause is `Move: split`." Pin it in the G-39-71 describe.

### WR-04: Roles other than BA/PM and the Architect are not told how to answer a hand-off

**File:** `agent-factory/workflows/04-ticket-to-pr.md:17,44,50`; `agent-factory/roles/ba-pm.md:35`; `agent-factory/roles/architect-design.md:32`
**Issue:** Step 15 allows "another role when its one job covers the cause", such as Security/NFR, Designer, QE/E2E or System Analyst. Step 16 spawns that role with "the task reference and nothing else". Only `ba-pm.md` and `architect-design.md` point at step 17. Any other receiving role has nothing telling it to write a `Resolved:`, `Disputed:` or `Fundamental:` note, or to own the `Blocked` exit. It will do its normal job and write none of them, leaving the ticket in `Blocked` with that role as owner. That is the same deadlock as CR-01.
**Fix:** Either restrict the hand-off to BA/PM and the Architect (and route anything else to the human stop), or add "Answer a Tech Lead hand-off per Workflow 04 step 17." to every role that can be named. A role-generic place such as `_role-switch-protocol.md` would also work, with a test listing the roles.

### WR-05: Step 17's board moves conflict with the board-move sections of the role files, and `Resolved:` skips the Definition of Ready

**File:** `agent-factory/workflows/04-ticket-to-pr.md:51,54`; `agent-factory/roles/ba-pm.md:42`; `agent-factory/roles/architect-design.md:40`; `agent-factory/roles/tech-lead.md:43`
**Issue:**
- Step 17 has the receiving role move the ticket from `Blocked` to `Ready for Dev` or `Backlog`. `ba-pm.md` `## Board moves` says BA/PM owns only `Backlog → Ready`, and `architect-design.md` says the Architect owns only the `In Design` exit. Neither role file grants the move the workflow asks for.
- `tech-lead.md` `## Board moves` still says "It owns the exit of a dev-raised `## Blocked`". On a hand-off, Workflow 04 now gives that exit to the receiving role. The WR-15 test (`scripts/tier-kit-text.test.ts:296`) pins `per Workflow 04 step 15` in that section, so it locks the outdated wording in place.
- `Resolved:` goes straight to `Ready for Dev`, and step 17 sends it to "step 2 before any pull". Step 1, the Definition of Ready check, is skipped even when BA/PM has just rewritten acceptance or scope.

**Fix:** Add the step-17 exit to each receiving role's `## Board moves`. Change the tech-lead.md sentence to "It owns the exit of a dev-raised `## Blocked`, except after a hand-off, per Workflow 04 steps 15 and 17". Have step 17 send a BA/PM `Resolved:` through step 1: "the Orchestrator re-checks the Definition of Ready (step 1), then the Tech Lead plans it per step 2".

### WR-06: After `Resolved:`, the Orchestrator can pull the ticket on the old plan note

**File:** `agent-factory/workflows/04-ticket-to-pr.md:30,51`
**Issue:** Step 3 pulls a `Ready for Dev` ticket "once the plan note is published". A ticket that comes back via `Resolved:` already has a published plan note from the first pass, so step 3's condition is met before the Tech Lead re-plans. Step 17's "before any pull" is an instruction to the Tech Lead, not a condition on the Orchestrator's pull. Nothing queues the Tech Lead for the re-plan either: step 16 dispatches only after a Tech Lead move. So the engineer could be dispatched at the old level against the old plan.
**Fix:** In step 3, write "once a plan note newer than the ticket's last `Resolved:` note is published". In step 17, write "and the Orchestrator creates a `pending/` subtask for the Tech Lead".

### WR-07: The `## Blocked` owner bullets pile up with conflicting owners

**File:** `agent-factory/workflows/04-ticket-to-pr.md:41,44,45,51`
**Issue:** Step 14 adds a bullet naming the Tech Lead. The hand-off adds a bullet naming the receiving role. The human stop adds a bullet naming a human. Step 17 says "name the Tech Lead as the `## Blocked` owner again" without saying whether that replaces a bullet or adds one. No step removes or closes earlier bullets, including after `Resolved:` when the ticket leaves `Blocked`. The board policy (`memory-bank/plans/board.md:142-144`) has one bullet per reason, each naming the owner who clears it. After one round a ticket can list three owners, and the `(owner, since)` board row has no single value. Whoever reads the board, including the CR-01 re-entry, cannot tell who holds the ticket.
**Fix:** Use "Replace the owner on the ticket's open `## Blocked` bullet with ..." in all four places. In step 17, add "After `Resolved:`, close the open `## Blocked` bullet with the `Resolved:` note id."

### WR-08: In tech-lead.md, "instead" can be read as cancelling the hand-off at `notify` and `off`

**File:** `agent-factory/roles/tech-lead.md:49`
**Issue:** The Hard limits section reads: "After the options are used up, hand the ticket to the role whose job covers its cause. Stop for a named human after three disputed rounds, or .... At `notify` or `off`, leave the ticket in `Blocked` with no move instead." tech-lead.md never says the hand-off runs at every value; only Workflow 04 line 44 does. So "instead" can bind to both earlier sentences, meaning that at `notify` or `off` the ticket is parked with no hand-off. That is the W1 disagreement this round was meant to close. Test (k) checks only that the phrase "in `Blocked` with no move" is present, so it cannot catch this reading. The Workflow 04 stop bullet avoids the ambiguity by saying "that stop".
**Fix:** Change it to "At `notify` or `off`, that human stop leaves the ticket in `Blocked` with no move; the hand-offs run at every value." Update the literals in tests (e) and (k).

## Info

### IN-01: The `notify` observation names the wrong note when `Fundamental:` triggers the stop, and "once" has no scope

**File:** `agent-factory/workflows/04-ticket-to-pr.md:45`; `agent-factory/config/factory.config.md:223`
**Issue:** "record an `observation` ... once, naming the last hand-off note". When the stop comes from a `Fundamental:` answer, the note that explains it is the answer, not the hand-off. "Once" could mean once per ticket, per cause or per stop. After a human answers and the ticket blocks again, the rule is unclear.
**Fix:** "... once per human stop, naming the note that triggered it (the third `Disputed:` note or the `Fundamental:` note)."

### IN-02: The step-15 lead line and tech-lead.md item 5 still list four moves, with no hand-off

**File:** `agent-factory/workflows/04-ticket-to-pr.md:42`; `agent-factory/roles/tech-lead.md:35`
**Issue:** Both say "escalate one level at most once per ticket; re-plan ...; split; or ... Architect". Line 46 has a fifth `Move:` value, and a human may now name a second escalation. A Tech Lead reading item 5 alone does not learn that a hand-off exists until it follows the pointer.
**Fix:** Add "or, once the options are used up, hand it off" to both lines, and "on its own" to the escalation clause.

### IN-03: The disposition register's opening counts three watched documents but lists four

**File:** `docs/audit/29-style-dispositions/39-19.md:6-9`
**Issue:** "It edits three watched documents:" is followed by Workflow 04, tech-lead.md, ba-pm.md and architect-design.md. The 56 rows cover all four.
**Fix:** Change it to "four watched documents".

### IN-04: The W1 cross-place test checks that phrases are present, not which value they apply to

**File:** `scripts/tier-kit-text.test.ts:1578`
**Issue:** Case (k) claims the four places "say the same thing at every value", but it only checks that each place contains three substrings. A text saying "At `block`, the ticket stays in `Blocked` with no move" would pass. Cases (b), (e) and (l) do pin the per-value sentences, so the overall coverage holds, but the test title claims more than its body checks. It also cannot catch WR-08.
**Fix:** Retitle (k) to "share the three phrases". Optionally, assert that the park phrase appears in the same sentence as "`notify` or `off`" in each place.

---

_Reviewed: 2026-10-31T09:15:27Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
