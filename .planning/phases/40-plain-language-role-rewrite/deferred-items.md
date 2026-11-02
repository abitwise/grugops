# Phase 40 deferred items

## From plan 40-07

- `docs/audit/28-claim-registry.md` mechanism text quotes Orchestrator wording that the 40-07 rewrite replaced:
  C-28-001 (line 84), the row at line 260, C-28-010 (line 375) and the row at line 494 quote
  `Decompose → enqueue → schedule → gate → sweep`, `does NOT relay data between agents — the shared verified
  context is the only channel` and `PARALLEL where Agent is available; SEQUENTIAL where it is not`. The rules
  still hold in orchestrator.md (`## Responsibilities` items 4 to 10 and `## Hard limits`), in plain English.
  Only the quoted mechanism wording, and the stale line number `orchestrator.md:88`, are out of date. No gate
  reads these quotes. Plan 40-10 owns the registry; refresh the quotes there or in a later audit pass.
- `docs/audit/28-disposition-register.md` F-28-008 names orchestrator.md § Hard limits; re-read it against the
  rewritten section when the register is next revisited.

## From plan 40-09

- `scripts/check-foundation-guards.test.ts` > "every remaining floor item's LIVE COUNT is DERIVED, not asserted in
  prose" fails: floor item 2 (a heading test written as `.indexOf("# ...")`) now matches
  `scripts/check-role-rules.ts:594` and `:595` (`headings.indexOf("## Responsibilities")` and
  `headings.indexOf("## Output")`), added by 40-08 in d35fa57c. Reproduced in a detached worktree at 5fd4a901
  (before any 40-09 commit, and without the stray `~/` directory), so it is a 40-08 regression. It shares its
  test name with the recorded `~/` environmental case, which hides it in a by-name comparison: removing `~/`
  would not turn it green. Fix in check-role-rules.ts (index the heading list another way) or record the two
  sites in FLOOR_ITEM_2_SITES with a reason; out of scope for 40-09, which does not touch check-role-rules.

## From plan 40-13

- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, 1,371 s) shows 15 failures beyond the known 5 in
  `scripts/uat-gate-exit-contract.test.ts` and the 1 floor-item case above. None reads a file 40-13 changed:
  - `scripts/context-io.test.ts` (7), `scripts/context-io-writer-set.test.ts` (2),
    `scripts/harness-instance-ledger.test.ts` (4) and `scripts/canonical-corpus.test.ts` (1) read
    `.planning/phases/27-*` and `.planning/phases/31-*` files that `91b4cbc6 chore: archive v2.1 milestone files`
    moved out of `.planning/phases/`. Repoint the tests at the archive path or record the archive as their source.
  - `install/installer-fs-census.test.ts` (1): the local Node v26.12.1 exports `openAsBlobSync`, which the census
    has not classified. Classify it in CONTENT_READER or NOT_CONTENT_READER.

## From the gap round (plans 40-11 to 40-16)

- WR-03 (deferred to the backlog; candidate: Phase 41 flow guidance). Each "return the ticket" bullet needs a flow
  decision: either a backward move with an owner (a new pair, which D-17 and D-33 keep out of Phase 40) or a
  stay-in-column reading. Workflows 03, 05 and 06 carry the same "route back" wording in frozen
  `## Stop conditions` clauses, so a role-only rewording could contradict them, and the QE bullet already
  conflicts with Workflow 04 step 14 (gate failures go to `Blocked` for the Tech Lead). The eight `## Stop when`
  bullets it covers, at HEAD after plan 40-14:
  - `architect-design.md:50`: return the ticket to the System Analyst
  - `system-analyst.md:43`: return the ticket to BA/PM
  - `uat-planner.md:48`: return the ticket to BA/PM
  - `security-nfr.md:51`: hand the ticket back to the Software Engineer
  - `qe-e2e.md:48`: hand the ticket back to the Software Engineer (the bullet that conflicts with Workflow 04 step 14)
  - `compliance-officer.md:49`: hand the ticket back to Security/NFR
  - `ba-pm.md:50`: return the ticket to the requester
  - `frontend-ui.md:47`: return the ticket to the Orchestrator for the Designer. This is Phase 39 wording pinned by
    `scripts/tier-kit-text.test.ts` (the D-10 Frontend/UI case). Line 48 (hand the ticket to BA/PM) has the same
    shape but no pin.
  status: open
- IN-03, optional part: drop the retired caveman heading from the `good` validator fixture. Plan 40-15 closed the
  required part (the typed section count, pinned in `scripts/validate.test.ts`) and left this as optional.
  status: open
- Residual from plan 40-11: while the D-30 stand-in holds, a `## Hard limits` or `## Stop when` sentence that
  carries none of the 26 fact kinds can be reworded with every gate green. The safety sentences are facts, and
  plan 40-12 froze `## Stop when`, but the stand-in still admits a non-fact sentence in either section.
  status: open
