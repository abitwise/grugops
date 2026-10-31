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
defect 6 rows below brought it back to 721.

`## Stop conditions` (workflow 04) and `## Hard limits` (tech-lead.md) are FROZEN by heading. Every
row in them carries a `companion` cell that names the section and the reason.

## Dispositions

| file | line | before | after | rule | disposition | companion |
|---|---|---|---|---|---|---|
| agent-factory/workflows/04-ticket-to-pr.md | 45 | Apply it also after three hand-offs on one ticket. | Apply it also before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The per-ticket ceiling in the human stop now says the stop comes before a fourth hand-off, so its timing has one reading. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 70 | The same stop applies after three hand-offs on one ticket. | The same stop applies before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The used-up stop names the per-ticket ceiling in the same words as step 15. | FROZEN SECTION `## Stop conditions`, workflow 04. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the per-ticket ceiling stops before a fourth hand-off on one ticket, so its timing has one reading; no stop is added or removed and no checkpoint count moves. |
| agent-factory/roles/tech-lead.md | 49 | Stop the same way after three hand-offs on one ticket. | Stop the same way before a fourth hand-off on one ticket. | quick 261031-oxi defect 6 | **reworded.** The role's hard limits name the per-ticket ceiling in the same words as Workflow 04. | FROZEN SECTION `## Hard limits`, role tech-lead.md. Reason: quick 261031-oxi defect 6 (Olger Oeselg 2026-10-31), the Tech Lead stops for a named human before a fourth hand-off on one ticket; no stop is added or removed and no checkpoint count moves. |
