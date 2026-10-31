# Quick task 261031-rhv style dispositions (the Workflow 04 hand-off loop, four re-trace defects)

Quick task 261031-rhv closes four defects in the Workflow 04 hand-off loop. The source is the second
first-time-reader scenario re-trace of Workflow 04 steps 14-17, its `## Stop conditions`,
`agent-factory/roles/tech-lead.md` and the `escalate_unadjudicable_result` text in
`agent-factory/config/factory.config.md`, run on 2026-10-31 after quick task 261031-oxi (HEAD
4f6cacea). It edits two watched documents: `agent-factory/workflows/04-ticket-to-pr.md` (steps 15
and 17 and the used-up bullet in `## Stop conditions`) and `agent-factory/roles/tech-lead.md`
(`## Hard limits`). It also edits `agent-factory/config/factory.config.md`, which the gate does not
watch.

The human decision, made by Olger Oeselg on 2026-10-31, quoted verbatim: "Fix all 4, then close. R2:
grugops orchestrator is the one who notifies tech lead." The four defects, from the task context:

- R1: the revert path records nothing and wakes no one, and can cycle uncounted.
- R2: at `notify`/`off`, nobody wakes the Tech Lead when a human answers.
- R3: the hand-back note does not say approved or rejected.
- R4: contradiction on a raise past the spent escalation.

The work falls outside the four-round Phase 39 gap cap (round 4 was the last). It is done as a human
direction, not as a gap round.

**The base commit is `4d2b8f079cc43d7d6184729966492789fb4dc05e`**, read from `00-base.md`. It is not
moved by this task. The R4 edits took the gate from 721 to 727 findings with no rows; the six R4 rows
below brought it back to 721. The R1, R2 and R3 edits then took it to 731, and the ten rows for those
defects brought it back to 721. In all, this task adds 16 rows and the gate ends at the recorded 721.

`## Stop conditions` (workflow 04) and `## Hard limits` (tech-lead.md) are FROZEN by heading. Every
row in them carries a `companion` cell that names the section and the reason.

## Dispositions

| file | line | before | after | rule | disposition | companion |
|---|---|---|---|---|---|---|
| agent-factory/workflows/04-ticket-to-pr.md | 44 | Used up also covers scores calling for more than one level, or for a raise past the spent escalation. | Used up also covers scores calling for more than one level while the escalation is unspent. | quick 261031-rhv R4 | **reworded.** A raise past the spent escalation leaves the hand-off's "used up" and goes to the human stop, so the two rules no longer both claim the same ticket. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | Apply it also when the scores call for a raise past the spent escalation. | quick 261031-rhv R4 | **added.** The human-stop trigger list now names a raise past the spent escalation, matching step 17. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | It publishes no plan note naming the raised level before the human answers. | quick 261031-rhv R4 | **added.** At the step 2 re-plan the Tech Lead publishes no plan note at the raised level before the human answers, so step 3 cannot pull the ticket at a level no one approved. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 70 | It also means the scores call for more than one level, or for a raise after the escalation is spent. | It also means the scores call for more than one level while the escalation is unspent. | quick 261031-rhv R4 | **reworded.** The used-up stop keeps only the multi-level scores while the escalation is unspent, in the same words as step 15. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-rhv R4 (Olger Oeselg 2026-10-31), a raise past the spent escalation applies the human stop rather than the hand-off, so the used-up bullet lists it as a stop trigger and keeps only the multi-level scores while the escalation is unspent; no stop is added or removed and no checkpoint count moves. |
| agent-factory/workflows/04-ticket-to-pr.md | 70 | — | The same stop applies when the scores call for a raise past the spent escalation. | quick 261031-rhv R4 | **added.** The used-up stop lists a raise past the spent escalation as a human-stop trigger, in the same words as step 15. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-rhv R4 (Olger Oeselg 2026-10-31), a raise past the spent escalation applies the human stop rather than the hand-off, so the used-up bullet lists it as a stop trigger and keeps only the multi-level scores while the escalation is unspent; no stop is added or removed and no checkpoint count moves. |
| agent-factory/roles/tech-lead.md | 49 | Never escalate a ticket twice on your own. | Stop the same way before a second escalation. | quick 261031-rhv R4 | **reworded.** The role's hard limits state the limit on a second escalation as a human-stop trigger, in the trigger list next to the per-ticket ceiling. | FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-rhv R4 (Olger Oeselg 2026-10-31), the Tech Lead stops for a named human before a second escalation, which states the former own-moves limit on escalating twice as the stop; no stop is added or removed and no checkpoint count moves. |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | When a step 17 answer queued the Tech Lead, read that answer note too. | When an answer note queued the Tech Lead, read that note too. | quick 261031-rhv R2 | **reworded.** The Tech Lead reads any answer note that queued it, so the Orchestrator's record of a human's answer at the human stop is read as well as a step 17 answer. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | At every value, the Orchestrator records the answer in a `decision` note per Workflow 16, naming the human. | quick 261031-rhv R2 | **added.** Once a human answers at the human stop, at every value of the cell, the grugops Orchestrator records that answer in a note naming the human, as the human directed. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | The Orchestrator then queues a `pending/` subtask for the Tech Lead, who reads that note at step 15. | quick 261031-rhv R2 | **added.** The Orchestrator wakes the Tech Lead after a human answers, so a ticket parked at `block`, `notify` or `off` no longer waits with nobody queued to act on the answer. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 46 | — | After the human approves or rejects a `Fundamental:` proposal, add an `Approved:` or `Rejected:` line naming the human. | quick 261031-rhv R3 | **added.** The move note after a ruling on a `Fundamental:` proposal carries the human's verdict, so the receiving role cannot read a rejection as an approval. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`. | Once a named human approves, make the change and answer `Resolved:`, naming the hand-off note that carries `Approved:`. | quick 261031-rhv R3 | **reworded.** An approved fundamental change names the hand-off note carrying the human's `Approved:` line, which a rejection cannot carry. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | When the hand-off note carries `Rejected:`, fix the cause within the current requirement and rules. | quick 261031-rhv R3 | **added.** The receiving role acts on a rejection by fixing the cause within the current requirement and rules. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`. | A fundamental change passes only when its `Resolved:` note names a hand-off note carrying `Approved:`. | quick 261031-rhv R3 | **reworded.** The step 2 check passes a fundamental change only on a hand-off note that carries the human's `Approved:` line. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it. | Otherwise the Tech Lead returns the ticket to `Blocked` and applies the hand-off to the role that made the change. | quick 261031-rhv R1 | **reworded.** An unapproved fundamental change goes back to the role that made it through the step 15 hand-off, which names that role as the `## Blocked` owner and is bounded by the per-ticket ceiling. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | Its `Move: hand-off` note keeps the cause's `Cause-id:` line and states the reason: revert the unapproved change. | quick 261031-rhv R1 | **added.** The revert is recorded in a move note that carries the cause's id and the reason the receiving role reads at step 17. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | That hand-off counts like any other, and step 16 dispatches it. | quick 261031-rhv R1 | **added.** The revert hand-off counts toward the limits and is dispatched through step 16, so a repeated catch-and-revert reaches the human stop before a fourth hand-off on one ticket. | — |
