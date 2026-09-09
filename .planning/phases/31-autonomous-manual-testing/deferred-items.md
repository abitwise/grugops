# Deferred Items

- `scripts/freshness.test.ts` "Test 1 (control, real tree)" exceeds vitest's 5s default timeout
  status: open
  **What:** the case spawns `node scripts/freshness.js` and compares 60 committed `.js` files
  against a rebuild. On this machine the script takes 5.4s-6.7s, so the case fails on the 5000ms
  default timeout rather than on any drift.
  **Why it is out of scope for plan 31-01:** measured at the plan's base commit `109d5c7` in a
  detached worktree, before any file this plan touches was changed — `node scripts/freshness.js`
  took 5.409s there and `npx vitest run scripts/freshness.test.ts` failed the same case. The
  failure pre-exists this plan.
  **Remedy when picked up:** give that one case an explicit timeout argument sized to the real
  spawn cost, or reduce the per-file `git show` spawn count. The gate itself
  (`npm run freshness`) is green and reports all 60 outputs fresh.

- `npm run check:diff-disposition` carries 75 undispositioned clauses from plans 31-05, 31-06 and 31-08
  status: open
  **What:** the gate diffs the working tree against the base commit recorded in
  `docs/audit/29-style-dispositions/00-base.md` and refuses any changed clause in the watched corpus
  that has no disposition row. Findings span `agent-factory/workflows/05-pr-quality-gate.md`,
  `06-uat-pack.md`, `17-task-claim.md` and `18-context-compaction.md`.
  **Why it is out of scope for plan 31-09:** measured BEFORE this plan's first prose commit — a
  hermetic `git clone` checked out at `012364d` (this plan's Task 2 commit, before any workflow file
  was touched) reports **78** undispositioned clauses, in the same four files. None of plans 31-05,
  31-06 or 31-08 wrote a disposition file under `docs/audit/29-style-dispositions/`. Plan 31-09 wrote
  `31-09.md` covering all 17 clauses it changed, verified by set difference against that measured
  baseline; the count fell 78 → 75 because three of the baseline clauses were replaced by this
  plan's rewrites and its own rows now cover them.
  **Why it was not simply fixed here:** writing rows for another plan's clauses would put a reason in
  the register that this plan cannot vouch for — a claim broader than what was measured, which is the
  exact defect 31-09 exists to correct.
  **Remedy when picked up:** one disposition file per owning plan (`31-05.md`, `31-06.md`,
  `31-08.md`), each naming its own clauses with the rule and the reason. Do NOT move `00-base.md`'s
  recorded base commit forward and do NOT narrow the watched corpus — the gate's own message names
  both as clearing the finding by deleting its evidence.

- `node scripts/validate-agent-factory.js` requires `VALIDATE_KIT_ROOT` to be set
  status: open
  **What:** run bare, the validator exits 1 with `VALIDATE_KIT_ROOT is unset — refusing to default the
  kit root to '.' (C3)`. With `VALIDATE_KIT_ROOT=$PWD` it exits 0 and prints `ALL CHECKS PASSED`.
  **Why it is out of scope for plan 31-09:** it is an invocation contract, not a structural failure,
  and it pre-dates this plan — nothing 31-09 changed affects it. Plan 31-09's acceptance criterion
  named the bare invocation, which is the stale half of the record.
  **Remedy when picked up:** either add an `npm run validate` script that supplies the variable, or
  correct the invocation wherever a plan or document names the bare form.

- `check:diff-disposition` still reports pre-existing undispositioned clauses in three OTHER
  workflows (measured again by plan 31-14)
  status: open
  **What:** measured on this tree, `npm run check:diff-disposition` reports 65 findings over 39
  elements. Every one of them names `agent-factory/workflows/05-pr-quality-gate.md`,
  `agent-factory/workflows/06-uat-pack.md` or `agent-factory/workflows/17-task-claim.md` — files
  plan `31-14` does not touch. The count moved 75 → 65 because the 10 findings that named
  `agent-factory/workflows/18-context-compaction.md` are now covered by
  `docs/audit/29-style-dispositions/31-14.md`, which carries a row for all 46 clauses this plan
  changed in that file, including a companion edit for every frozen `## Stop conditions` clause.
  Measured after the rows landed: 0 findings name `18-context-compaction.md`.
  **Why it was not fixed here:** unchanged from the 31-09 entry above — writing rows for another
  plan's clauses would put a reason in the register that this plan cannot vouch for.
  **Remedy when picked up:** one disposition file per owning plan. Do NOT move `00-base.md`'s
  recorded base commit forward and do NOT narrow the watched corpus.

## 31-18 (2026-09-09) — out-of-scope discoveries

- `npm run check:diff-disposition` reports **77 changed clauses with no disposition row** across four
  workflows this plan does not touch: `05-pr-quality-gate.md` (38), `06-uat-pack.md` (25),
  `16-context-read-write.md` (12), `17-task-claim.md` (2). Measured before and after this plan's
  prose change; the count is identical either way, and `agent-factory/workflows/18-context-compaction.md`
  went from 0 rows owed to 25 rows written and 0 owed. Pre-existing, unrelated to CR-11/WR-17/WR-18,
  and therefore left alone per the executor scope boundary. A later plan owns it.
