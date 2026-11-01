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
