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
