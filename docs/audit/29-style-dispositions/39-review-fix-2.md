# Phase 39 review fix, iteration 2 style dispositions

This file records the clauses the second Phase 39 review-fix iteration changes in the watched
corpus. The fixes close the findings of the re-review in `39-REVIEW.md` (its own WR-01 to WR-06 and
IN-01 to IN-04) on the Tech Lead's escalation path. They edit
`agent-factory/workflows/04-ticket-to-pr.md` and `agent-factory/roles/tech-lead.md`. IN-02 edits
only `install/README.md`, which is not watched, so it has no row here.

The IDs below are the re-review's own numbering. They are not the WR-11 to WR-16 of
`39-review-fix-1.md`.

- **WR-01**: step 15 names who writes the confirmation finding (the Tech Lead, after the named
  human answers) and says what checks it: admission checks the `human:<name>` stamp only at
  `context.human_admission: all`, and at the default `off` the finding is a prose-tier record.
  `39-review-fix-1.md` claimed the admission guard checks the stamp; its rows are corrected in the
  same commit.
- **WR-05**: `tech-lead.md` points at Workflow 04 step 15 for the `Move:` line, the re-score rule,
  the named-human stops and the per-move exit, instead of restating them. The role drops from
  4110 B to 3439 B, under the measured Plan 39-05 ceiling (3572 B), so `ROLE_CEILINGS` in
  `scripts/check-foundation-guards.ts` goes back to `3572 3381`. The iteration-1 raise to
  `4222 3996` was never confirmed by a human and is reverted. The role still trips the 3381 B WARN
  tier, which is that tier's job: it is within 6% of its ceiling.
- **WR-02**: the human's answer opens with `Confirmed: yes` or `Confirmed: no`. Step 16 waits for a
  `Confirmed: yes` finding, so a recorded rejection no longer releases the re-enqueue. A
  `Confirmed: no` move is neither carried out nor counted, and the Tech Lead records a new move or
  stops for a named human once the options are used up.
- **WR-03**: the two re-score stops of step 15 (more than one level, or a raise after the escalation
  is spent) now read `checkpoints.escalate_unadjudicable_result`, the cell the used-up stop is
  tagged with, the way iteration 1's WR-16 tied the gate-failure stop to its cell. At `block`, the
  default, the Tech Lead stops for a named human. At `notify` or `off` it raises one level while
  the escalation is unspent and otherwise keeps the level, and records the scored level in the
  move note, so no value leaves it without a legal move. No checkpoint tag is added or moved, and
  the frozen used-up stop is unchanged.
- **WR-04**: at `checkpoints.exhaust_self_fix_budget: notify` the gate-failure move goes ahead and
  is recorded in an `observation` naming the move note; only `off` goes ahead silently. Iteration 1
  had merged the two values. `factory.config.md` defines `notify` as "recorded (a finding note)";
  the record here is an `observation` because a `finding` needs a verification stamp, and that
  config wording is left for a human to settle (see `39-REVIEW-FIX.md`).
- **WR-06**: step 14's `failed-attempt` note opens with `Cause: engineer` or `Cause: gate`, and
  steps 15 and 16 decide on the gate-failure stop from that line instead of the note's free text.
  The role reaches the same rule through its pointer to step 15 (WR-05).

The `line` column gives each clause's line in the tree after the fix that wrote the row.

`## Stop conditions` and `## Hard limits` are FROZEN by heading. A row in either carries a
`companion` cell that names the section and the reason.

**The base commit is `4d2b8f079cc43d7d6184729966492789fb4dc05e`**, read from `00-base.md`. It is not
moved by this file. The gate stood at 721 findings before these fixes, and it returns to 721 once
the rows below are written.

## Dispositions

| file | line | before | after | rule | disposition | companion |
|---|---|---|---|---|---|---|
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Record the confirmation as a `finding` per Workflow 16, stamped `human:<name>`, with the move note's id among its refs. | Once the named human confirms, the Tech Lead records it as a `finding` per Workflow 16. | WR-01, T-39-25 | **reworded.** The step names who writes the finding and when: the Tech Lead, after the human answers. Split in two to stay inside the WP-02 20-word bound. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Record the confirmation as a `finding` per Workflow 16, stamped `human:<name>`, with the move note's id among its refs. | Stamp it `human:<name>`, with the move note's id among its refs. | WR-01, T-39-25 | **reworded.** The second half of the split sentence: the stamp and the ref to the move note are unchanged. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Never write that stamp without the human's answer. | WR-01, T-39-25 | **added.** States the limit on the writer, because nothing at the default dial stops an agent from writing the stamp itself. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Only at `context.human_admission: all` does admission check that stamp, and only Claude Code binds it to the human's session grant. | WR-01, T-39-25 | **added.** Says honestly which dial makes the stamp checked, per `isGatedNote` in `scripts/context-io.ts`; a Tech Lead finding is not gated at `high-severity`. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | At the default `off` it is a prose-tier record. | WR-01, T-39-25 | **added.** Matches `factory.config.md` § "Where each cell is enforced": a non-floor cell is prose tier, and no mechanism refuses a self-written stamp at the default. | — |
| agent-factory/roles/tech-lead.md | 35 | A re-score that raises the level is the escalation, one level only. When the scores call for more than one level, or for a raise after the escalation is spent, stop for a named human. After a gate `BLOCKED_NEEDS_FIX`, with `checkpoints.exhaust_self_fix_budget` at `block` (the default), leave the ticket in `Blocked` until a named human confirms the move. | Follow Workflow 04 step 15 for the `Move:` line, the re-score rule and the named-human stops. | WR-05, D-19, D-21 | **reworded to a pointer.** The rules live once, in Workflow 04 step 15, which the role already reads (Reads, steps 14-16); restating them grew the role past its measured ceiling and let the two copies drift. | — |
| agent-factory/roles/tech-lead.md | 44 | It owns the exit of a dev-raised `## Blocked`: back to `Ready for Dev` after an escalation or a re-plan, to `Backlog` for BA/PM after a split, and to `In Design` after an Architect pass. After a gate `BLOCKED_NEEDS_FIX` at `block`, the exit waits for a named human. | It owns the exit of a dev-raised `## Blocked`, per Workflow 04 step 15. | WR-05, D-19 | **reworded to a pointer.** Workflow 04 step 15 names the exit for each move and the human stop that holds it. | — |
| agent-factory/roles/tech-lead.md | 41 | On a blocked ticket, a move note whose body opens with `Move: escalate`, `Move: re-plan`, `Move: split` or `Move: architect`. Only the Tech Lead's notes with a `Move:` line count as moves; the plan note has none. | — | WR-05, D-20 | **removed.** Responsibility 5 already records the move in a decision note and points at Workflow 04 step 15 for its `Move:` line and the counting rule. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Skip a move that a `Confirmed: no` finding names. | WR-02, D-21 | **added.** A move the human rejected was never carried out, so it does not use up one of the Tech Lead's options. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Once the named human confirms, the Tech Lead records it as a `finding` per Workflow 16. | Once the named human answers, the Tech Lead records the answer as a `finding` per Workflow 16. | WR-02, T-39-25 | **reworded.** The finding records the answer, yes or no, rather than only a confirmation. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Open its body with `Confirmed: yes` or `Confirmed: no`. | WR-02, D-20 | **added.** A fixed first line step 16 can read, the same device as the move note's `Move:` line. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | A `Confirmed: no` move is neither carried out nor counted. | WR-02, D-21 | **added.** Says what a rejection does to the move. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Record a new move, or stop for a named human once the options are used up. | WR-02, D-21 | **added.** Gives a rejected move somewhere to go; the ticket stays in `Blocked` meanwhile. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | After a gate failure at `block`, wait also for the `human:<name>` finding that names the move note. | After a gate failure at `block`, wait also for a `Confirmed: yes` finding that names the move note. | WR-02, D-20, T-39-25 | **reworded.** The re-enqueue waits for a yes, so a recorded rejection no longer releases it. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | Stop for a named human when the scores call for more than one level. Stop for a named human when the scores call for a raise after the escalation is spent. | When the scores call for more than one level, or for a raise after the escalation is spent, read `checkpoints.escalate_unadjudicable_result`. | WR-03, D-21 | **reworded.** The two re-score stops follow the cell the used-up stop is tagged with, so the step and the tagged stop agree under every value. The step names the cell and carries no checkpoint tag. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | The used-up stop below follows the same value. | WR-03, D-21 | **added.** Names the tagged stop the cell belongs to. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | At `block`, the default, stop for a named human. | WR-03, D-21 | **added.** The human stop holds at the default, which a zero-config repository gets, so no default posture is lowered. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level. | WR-03, D-19, D-21 | **added.** Gives the Tech Lead a legal move under a lowered cell, so the two-level re-score does not reopen the WR-13 deadlock; it never escalates twice or more than one level. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | Record the scored level in the move note. | WR-03, D-19 | **added.** The level the scores call for stays on the record when the Tech Lead dispatches a different one. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | — | At `notify`, also record an `observation` per Workflow 16 that names the move note. | WR-03, D-20 | **added.** `notify` means the action proceeds and is recorded. The record is an `observation`, because a `finding` needs a verification stamp this note has no way to earn. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | At `notify` or `off`, make the move without that human. | At `notify`, make the move and record an `observation` per Workflow 16 that names the move note. | WR-04, D-20 | **reworded and split.** `notify` proceeds and is recorded, per `factory.config.md`, so a repository that chose it over `off` gets the record it chose. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | At `notify` or `off`, make the move without that human. | At `off`, make the move without that human. | WR-04 | **reworded and split.** Only `off` proceeds silently. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 40 | — | Open its body with `Cause: engineer` for a `BLOCKED` report, or `Cause: gate` for a gate failure. | WR-06, D-18 | **added.** Gives the soft `failed-attempt` note a fixed first line that says which of the two causes raised the block. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 41 | After a gate `BLOCKED_NEEDS_FIX`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows. | When the note opens with `Cause: gate`, read `checkpoints.exhaust_self_fix_budget`, the value the gate-failure stop below follows. | WR-06, CR-02 | **reworded.** The Tech Lead decides on the gate-failure stop from the note's fixed line, so a misread cause cannot skip the stop. | — |
| agent-factory/workflows/04-ticket-to-pr.md | 42 | After a gate failure at `block`, wait also for a `Confirmed: yes` finding that names the move note. | After a `Cause: gate` note at `block`, wait also for a `Confirmed: yes` finding that names the move note. | WR-06, D-20 | **reworded.** The Orchestrator reads the same fixed line as the Tech Lead. | — |
