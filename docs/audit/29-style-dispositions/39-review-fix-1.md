# Phase 39 review fix, iteration 1 style dispositions (WR-12 to WR-16)

This file records the clauses the first Phase 39 review-fix iteration changes in the watched
corpus. The fixes close the open warnings of `39-REVIEW.md` on the Tech Lead's escalation path. They
edit `agent-factory/workflows/04-ticket-to-pr.md` and `agent-factory/roles/tech-lead.md`. WR-11 edits
only `install/README.md`, `install/install.ts` and a test, none of them watched, so it has no row
here.

- **WR-12**: a split or an Architect move no longer returns the ticket to `Ready for Dev` or
  re-enqueues an engineer. A split goes to `Backlog` for BA/PM, an Architect pass to `In Design`.

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
| agent-factory/roles/tech-lead.md | 42 | It owns the exit of a dev-raised `## Blocked`, returning the ticket to `Ready for Dev`. | It owns the exit of a dev-raised `## Blocked`: back to `Ready for Dev` after an escalation or a re-plan, to `Backlog` for BA/PM after a split, and to `In Design` after an Architect pass. | WR-12, D-19 | **reworded.** The role's board moves name the exit for each move, matching Workflow 04 step 15. | — |
