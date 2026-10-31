# Quick task 261031-oxi style dispositions (the Workflow 04 hand-off loop, seven defects)

Quick task 261031-oxi closes seven defects in the Workflow 04 hand-off loop. The source is a
first-time-reader scenario re-trace of Workflow 04 steps 14-17, its `## Stop conditions`,
`agent-factory/roles/tech-lead.md` and the `escalate_unadjudicable_result` text in
`agent-factory/config/factory.config.md`, run on 2026-10-31 after quick task 261031-nd9 wrote the
39-UAT D1-D3 decisions. It edits two watched documents: `agent-factory/workflows/04-ticket-to-pr.md`
(steps 14 to 17 and the used-up bullet in `## Stop conditions`) and `agent-factory/roles/tech-lead.md`
(`## Hard limits`). It also edits `agent-factory/config/factory.config.md`, which the gate does not
watch.

The human decision, made by Olger Oeselg on 2026-10-31, quoted verbatim: "fix all 7 defects now, then
re-trace, then close Phase 39". The seven defects, from the task context:

1. An approved fundamental change re-blocks itself.
2. A rejected `Fundamental:` proposal has no branch.
3. The `Resolved:` check is anchored to step 16, which the `Resolved:` path never reaches.
4. A re-plan after `Resolved:` that needs a raise with the one escalation spent.
5. No resume path at `notify`/`off`.
6. "after three hand-offs on one ticket" timing.
7. Nobody queues the Tech Lead after the first block, nor after `Resolved:`.

The work falls outside the four-round Phase 39 gap cap (round 4 was the last). It is done as a human
direction, not as a gap round.

**The base commit is `4d2b8f079cc43d7d6184729966492789fb4dc05e`**, read from `00-base.md`. It is not
moved by this task. The defect 6 edits took the gate from 721 to 724 findings with no rows; the three
defect 6 rows below brought it back to 721. The defect 1, 2, 3 and 5 edits then took it to
732, and the eleven rows for those defects brought it back to 721.

`## Stop conditions` (workflow 04) and `## Hard limits` (tech-lead.md) are FROZEN by heading. Every
row in them carries a `companion` cell that names the section and the reason.

## Dispositions

| file | line | before | after | rule | disposition | companion |
|---|---|---|---|---|---|---|
| agent-factory/workflows/04-ticket-to-pr.md | 45 | Apply it also after three hand-offs on one ticket. | Apply it also before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The per-ticket ceiling in the human stop now says the stop comes before a fourth hand-off, so its timing has one reading. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 70 | The same stop applies after three hand-offs on one ticket. | The same stop applies before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The used-up stop names the per-ticket ceiling in the same words as step 15. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the per-ticket ceiling stops before a fourth hand-off on one ticket, so its timing has one reading; no stop is added or removed and no checkpoint count moves. |
| agent-factory/roles/tech-lead.md | 49 | Stop the same way after three hand-offs on one ticket. | Stop the same way before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The role's hard limits name the per-ticket ceiling in the same words as Workflow 04. | FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the Tech Lead stops for a named human before a fourth hand-off on one ticket; no stop is added or removed and no checkpoint count moves. |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | On rejection, apply the move the human names. | quick 261031-oxi defect 2 | **added.** A rejected `Fundamental:` proposal now has a branch: the Tech Lead applies the move the human names. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | Without one, hand the ticket back to the proposing role to fix it within the current requirement and rules. | quick 261031-oxi defect 2 | **added.** When the human rejects a proposal and names no move, the proposing role fixes the cause within the current requirement and rules. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | Record either hand-back as `Move: hand-off` with `Stop: human`; it counts toward no limit. | quick 261031-oxi defects 1 and 2 | **added.** The hand-back after an approval or a rejection is recorded as a human-stop hand-off and counts toward no limit, so it cannot trip the per-ticket ceiling. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 45 | — | At `notify` or `off`, once a human answers, follow the `block` path: the move record, the confirmation and step 16. | quick 261031-oxi defect 5 | **added.** A ticket parked at `notify` or `off` now resumes once a human answers, through the same move record, confirmation and dispatch as at `block`. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 50 | — | Wait the same way at `notify` or `off` once a human answers. | quick 261031-oxi defect 5 | **added.** Step 16 waits for the human's `Confirmed: yes` finding at `notify` and `off` too once the human has answered. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | Once a named human approves, make the change and answer `Resolved:`, naming the approval `finding`. | quick 261031-oxi defect 1 | **added.** An approved fundamental change names the human's approval, so the Tech Lead's check can pass it instead of blocking it again. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | Before step 16 dispatches, the Tech Lead checks every `Resolved:` note against this definition. | At the step 2 re-plan, the Tech Lead checks the diff behind every `Resolved:` note against this definition. | quick 261031-oxi defect 3 | **reworded.** The check now runs on the path a `Resolved:` answer really takes, the step 2 re-plan, and reads the change itself rather than only the note. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | It treats a fundamental one as `Fundamental:` and returns the ticket to `Blocked`. | It treats a fundamental one that names no approval `finding` as `Fundamental:` and returns the ticket to `Blocked`. | quick 261031-oxi defects 1 and 3 | **reworded.** Only a fundamental change made without a named human's approval goes back to `Blocked`. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 51 | — | The Orchestrator then queues a `pending/` subtask for the role that made the change, to revert it. | quick 261031-oxi defect 3 | **added.** A fundamental change made without approval is undone by the role that made it, through the queue. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 70 | At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue. | At `notify` or `off`, that stop leaves the ticket in `Blocked` with no move and no re-enqueue until a human answers. | quick 261031-oxi defect 5 | **reworded.** The park at `notify` or `off` lasts only until a human answers, matching step 15. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-oxi defect 5 (Olger Oeselg 2026-10-31), a ticket parked at `notify` or `off` waits only until a human answers and then follows the `block` path; no stop is added or removed and no checkpoint count moves. |
| agent-factory/roles/tech-lead.md | 49 | At `notify` or `off`, leave the ticket in `Blocked` with no move instead. | At `notify` or `off`, leave it in `Blocked` with no move until a human answers. | quick 261031-oxi defect 5 | **reworded.** The role's hard limit parks the ticket only until a human answers, matching Workflow 04. | FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-oxi defect 5 (Olger Oeselg 2026-10-31), the Tech Lead keeps a parked ticket in `Blocked` only until a human answers; no stop is added or removed and no checkpoint count moves. |
