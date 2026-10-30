# Phase 39 review fix, iteration 1 style dispositions (WR-12 to WR-16)

This file records the clauses the first Phase 39 review-fix iteration changes in the watched
corpus. The fixes close the open warnings of `39-REVIEW.md` on the Tech Lead's escalation path. They
edit `agent-factory/workflows/04-ticket-to-pr.md` and `agent-factory/roles/tech-lead.md`. WR-11 edits
only `install/README.md`, `install/install.ts` and a test, none of them watched, so it has no row
here.

- **WR-12**: a split or an Architect move no longer returns the ticket to `Ready for Dev` or
  re-enqueues an engineer. A split goes to `Backlog` for BA/PM, an Architect pass to `In Design`.
- **WR-13**: a re-score that raises the level is the escalation and moves the ticket one level only.
  When the scores call for more than one level, or for a raise after the escalation is spent, the
  Tech Lead stops for a named human under the existing `escalate_unadjudicable_result` stop.
- **WR-14**: a move note opens its body with a fixed `Move:` line, and the Tech Lead counts earlier
  moves only from its own `decision` notes that carry one. The plan note, the engineer's decisions
  and the Architect's decisions carry none. `tech-lead.md` grew past its byte ceiling with this
  line, so `ROLE_CEILINGS` in `scripts/check-foundation-guards.ts` was re-measured (3769 B, +12% /
  +6%) in the same commit.
- **WR-15**: the Tech Lead role now reads Workflow 04 steps 14-16 and holds a gate-failure ticket in
  `Blocked` until a named human confirms the move. Workflow 04 records the confirmation as a
  `finding` stamped `human:<name>` (Workflow 16's escalation stamp) naming the move note, and step
  16 waits for that finding, so the stop leaves a published record. Corrected in iteration 2
  (`39-review-fix-2.md`, WR-01): admission checks that stamp only at `context.human_admission:
  all`, where Claude Code's admission guard binds it to the human's session grant. At the default
  `off`, and for a Tech Lead finding at `high-severity`, nothing checks it; it is a prose-tier record
  the Tech Lead writes after the human answers.
- **WR-16**: the step-15 and role stop follow `checkpoints.exhaust_self_fix_budget`, the value the
  tagged gate-failure stop already follows. At `block`, the default, the human stop holds; at
  `notify` or `off` the move goes ahead without that human. No checkpoint tag is added or moved.

The `line` column gives each clause's line in the tree after the last of these fixes.

`## Stop conditions` and `## Hard limits` are FROZEN by heading. A row in either carries a
`companion` cell that names the section and the reason.

**The base commit is `4d2b8f079cc43d7d6184729966492789fb4dc05e`**, read from `00-base.md`. It is not
moved by this file. The gate stood at 721 findings before these fixes, and it returns to 721 once
the rows below are written.

## Dispositions

| file | line | before | after | rule | disposition | companion |
|---|---|---|---|---|---|---|
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Return the ticket to `Ready for Dev`. | On an escalation or a re-plan, return the ticket to `Ready for Dev`. | WR-12, D-19 | **reworded.** Only the two moves that keep the ticket's design and size return it to `Ready for Dev`. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | On a split, move it to `Backlog` for BA/PM. | WR-12, D-19 | **added.** Matches the `SPLIT_REQUIRED` stop: a split ticket goes back to BA/PM before it can enter `Ready for Dev`. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | On an Architect pass, move it to `In Design`. | WR-12, D-19 | **added.** Matches the F2 = 2 stop: the ticket goes back to `In Design` for the Architect. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | — | Create it only after an escalation or a re-plan. | WR-12, D-20 | **added.** The Orchestrator re-enqueues an engineer only for a move that names a level. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | — | A split or an Architect pass dispatches no engineer. | WR-12, D-20 | **added.** States the other half of the condition, so no engineer is spawned on a ticket whose size or design was just rejected. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | After a split that exit is `Backlog`, and after an Architect pass it is `In Design`. | WR-12, D-19 | **added.** The board moves name the Tech Lead's two other exits from `Blocked`. | — |
| agent-factory/roles/tech-lead.md | 44 | It owns the exit of a dev-raised `## Blocked`, returning the ticket to `Ready for Dev`. | It owns the exit of a dev-raised `## Blocked`: back to `Ready for Dev` after an escalation or a re-plan, to `Backlog` for BA/PM after a split, and to `In Design` after an Architect pass. | WR-12, D-19 | **reworded.** The role's board moves name the exit for each move, matching Workflow 04 step 15. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | A re-score that raises the level is the escalation. | A re-score that raises the level is the escalation, and it moves the ticket one level only. | WR-13, D-19 | **reworded.** A re-score cannot move a ticket two levels as one escalation, matching "escalate one level". | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Stop for a named human when the scores call for more than one level. | WR-13, D-21 | **added.** Gives the Tech Lead a legal output when the rubric jumps two levels, instead of breaking either "one level" or "never pick a level without the written scores". | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Stop for a named human when the scores call for a raise after the escalation is spent. | WR-13, D-21 | **added.** A raise after the one escalation would be a second escalation; the Tech Lead stops rather than escalate twice or keep a level its scores contradict. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 61 | — | It also means the scores call for more than one level, or for a raise after the escalation is spent. | WR-13, D-21 | **added inside a FROZEN section.** The used-up stop now names the two re-score cases step 15 stops on, so the stop and the step describe one event. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: WR-13, the definition of used up gains the two re-score cases that had no legal move; the named-human stop and its `escalate_unadjudicable_result` tag are unchanged, no stop is lowered and no checkpoint count moves. |
| agent-factory/roles/tech-lead.md | 35 | A re-score that raises the level is the escalation. | A re-score that raises the level is the escalation, one level only. | WR-13, D-19 | **reworded.** The same one-level rule as Workflow 04 step 15, kept short for the role's byte ceiling. | — |
| agent-factory/roles/tech-lead.md | 35 | — | When the scores call for more than one level, or for a raise after the escalation is spent, stop for a named human. | WR-13, D-21 | **added.** The role names the same two human stops as Workflow 04 step 15. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Count the earlier moves from the ticket's `decision` notes. | Count the earlier moves from the Tech Lead's `decision` notes for this ticket that carry a `Move:` line. | WR-14, D-20, D-21 | **reworded.** The count reads only the Tech Lead's move notes, so the plan note and other roles' decisions are not miscounted as moves. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | The plan note from step 2 carries none. | WR-14, D-20 | **added.** The step-2 plan note has the same shape as a re-plan note; without a `Move:` line it is not counted. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Open its body with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`. | WR-14, D-20 | **added.** Gives every move note a structured line the next count can read. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Mark a re-score that raises the level `Move: escalate`. | WR-14, D-19 | **added.** A level-raising re-score is the escalation (WR-13), so it is counted as one. | — |
| agent-factory/roles/tech-lead.md | 41 | — | On a blocked ticket, a move note whose body opens with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`. | WR-14, D-20 | **added.** The role's Output names the move note's fixed line, matching Workflow 04 step 15. | — |
| agent-factory/roles/tech-lead.md | 41 | — | Only the Tech Lead's notes with a `Move:` line count as moves; the plan note has none. | WR-14, D-20, D-21 | **added.** The role states what the bound counts, so the D-21 loop bound reads a structured line. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Leave the ticket in `Blocked` until then. | WR-15, D-21 | **added.** The board does not show the ticket as ready before the human confirms the move. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Record the confirmation as a `finding` per Workflow 16, stamped `human:<name>`, with the move note's id among its refs. | WR-15, D-20, T-39-25 | **added.** The human stop leaves a published record: Workflow 16's `human:<name>` stamp, naming the move note it confirms. Corrected in iteration 2 (WR-01): on Claude Code the admission guard binds the stamp to the human's session grant only at `context.human_admission: all`; at the default `off` it is a prose-tier record the Tech Lead writes after the human answers. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | Create it only once the step 15 move is recorded and, after a gate failure, confirmed by that human. | Create it only once the step 15 move is recorded. | WR-15, D-20 | **reworded.** The record condition stays; the human condition moves to its own sentence that names the record to read. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | — | After a gate failure, wait also for the `human:<name>` finding that names the move note. | WR-15, D-20, T-39-25 | **added.** Step 16's condition reads a published record instead of an unrecorded confirmation. Corrected in iteration 2 (WR-01): the record is prose tier unless `context.human_admission` is `all`. | — |
| agent-factory/roles/tech-lead.md | 25 | — | `agent-factory/workflows/04-ticket-to-pr.md` steps 14-16, the path of a blocked ticket. | WR-15 | **added.** The role reads the workflow that holds the human stop. | — |
| agent-factory/roles/tech-lead.md | 35 | — | After a gate `BLOCKED_NEEDS_FIX`, leave the ticket in `Blocked` until a named human confirms the move. | WR-15, D-21, T-39-25 | **added.** A Tech Lead acting from its role file meets the human stop. | — |
| agent-factory/roles/tech-lead.md | 44 | — | After a gate `BLOCKED_NEEDS_FIX`, the exit waits for a named human. | WR-15, D-21 | **added.** The role's board moves carry the same stop. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | After a gate `BLOCKED_NEEDS_FIX`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows. | WR-16, CR-02 | **added.** Ties the numbered step to the configurable cell that governs the tagged stop, so the step and the stop agree under every value. The step names the cell and carries no checkpoint tag. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | After a gate `BLOCKED_NEEDS_FIX`, stop until a named human confirms the move. | At `block`, the default, stop until a named human confirms the move. | WR-16, CR-02, T-39-25 | **reworded.** The human stop holds at the default `block`, which a zero-config repository gets, so no default posture is lowered. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | At `notify` or `off`, make the move without that human. | WR-16 | **added.** A repository that set the cell lower gets the behaviour `factory.config.md` documents for those values, instead of a step that always stops. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | After a gate failure, wait also for the `human:<name>` finding that names the move note. | After a gate failure at `block`, wait also for the `human:<name>` finding that names the move note. | WR-16, WR-15 | **reworded.** Step 16 waits for the human's finding only when step 15 stopped for one. | — |
| agent-factory/roles/tech-lead.md | 35 | After a gate `BLOCKED_NEEDS_FIX`, leave the ticket in `Blocked` until a named human confirms the move. | After a gate `BLOCKED_NEEDS_FIX`, with `checkpoints.exhaust_self_fix_budget` at `block` (the default), leave the ticket in `Blocked` until a named human confirms the move. | WR-16, WR-15 | **reworded.** The role's stop follows the same cell as Workflow 04 step 15; the default still stops. | — |
| agent-factory/roles/tech-lead.md | 44 | After a gate `BLOCKED_NEEDS_FIX`, the exit waits for a named human. | After a gate `BLOCKED_NEEDS_FIX` at `block`, the exit waits for a named human. | WR-16, WR-15 | **reworded.** The board-move stop follows the same cell. | — |
