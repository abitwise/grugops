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
below brought it back to 721.

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
