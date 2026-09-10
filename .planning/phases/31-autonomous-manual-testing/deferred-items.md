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

## 31-19 (2026-09-09) — out-of-scope discoveries

- `npm run check:diff-disposition` reports **75 changed clauses with no disposition row** after this
  plan's rows landed. 65 of them name `05-pr-quality-gate.md` (38), `06-uat-pack.md` (25) or
  `17-task-claim.md` (2) — the pre-existing debt the `31-14` and `31-18` entries above already
  record, unchanged by this plan. The remaining **10 name `16-context-read-write.md` and belong to
  plan `31-15`**: the sentences stating steps 1, 2 and 4 of the resolution order, the
  `human_admission` dial paragraph, and the honest-degradation paragraph.
  **Measured:** 65 before this plan's workflow edits, 85 with the edits and no rows, 75 with
  `docs/audit/29-style-dispositions/31-19.md` in place — so this plan owes **0** for the 16 clauses
  it changed, and cleared none of the 10 it did not.
  **Why it was not fixed here:** unchanged from the `31-09` and `31-14` entries above — writing rows
  for another plan's clauses would put a `before`/`after` and a reason in the register that this
  plan did not make and cannot vouch for. `31-15`'s sentences are still true after `31-19`; what
  they lack is a disposition row, which is a record of a decision rather than a correction.
  **Remedy when picked up:** one disposition file per owning plan — a `31-15.md` covering those ten
  clauses. Do NOT move `00-base.md`'s recorded base commit forward and do NOT narrow the watched
  corpus.

## 31-20 (2026-09-09) — the round-5 closing re-measurement of the entries above

Plan `31-20` changes **no** watched file and **no** source file. It re-measures the entries above so
the next round compares against a live number rather than against the newest stale one.

- **`npm run check:diff-disposition` — re-measured at `27f613a`: `75 finding(s) over 39 elements`.**
  The gate reports `39 watched file(s) changed since 4d2b8f0; 2178 changed clause(s) derived; 1790
  disposition row(s) across 20 file(s)`. Every finding, by the file it names:
  `05-pr-quality-gate.md` (**38**), `06-uat-pack.md` (**25**), `16-context-read-write.md` (**10**),
  `17-task-claim.md` (**2**).
  **Reason for the change since the `31-18` entry (77 → 75):** two of the twelve findings that named
  `16-context-read-write.md` are now covered — `31-19` rewrote those clauses and wrote rows for them,
  taking that file from 12 to 10. Nothing else moved, because plan `31-20` touches no watched file.
  **The round's four disposition files owe 0 for their own clauses:** `31-16.md` (15 rows),
  `31-17.md` (14), `31-18.md` (30), `31-19.md` (16).
  **Still open, and still owned elsewhere:** the 65 findings naming `05-pr-quality-gate.md`,
  `06-uat-pack.md` and `17-task-claim.md` (plans `31-05`/`31-06`/`31-08`) and the 10 naming
  `16-context-read-write.md` (plan `31-15`).
  **Remedy when picked up:** unchanged — one disposition file per owning plan (`31-05.md`,
  `31-06.md`, `31-08.md`, `31-15.md`). `00-base.md`'s recorded `base_commit` (`4d2b8f0`) was **not**
  moved and the watched corpus was **not** narrowed; the gate's own message names both as clearing a
  finding by deleting its evidence.

- **`node scripts/validate-agent-factory.js` invocation contract — re-measured, unchanged.** Bare:
  exit 1, `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. With
  `VALIDATE_KIT_ROOT=$PWD`: exit 0, `ALL CHECKS PASSED`. Its own `SCOPE` line additionally discloses
  that a repository-level `.grugops/factory.config.json` outside the kit tree is **not** examined
  unless `VALIDATE_ROOT` is supplied — recorded here so the scope of the green is visible with the
  green. Still an invocation contract rather than a structural failure; remedy unchanged.

- **`scripts/freshness.test.ts` "Test 1 (control, real tree)" timeout — NOT re-measured this round,
  and not closed.** The whole excluded-e2e suite is green at `27f613a` (62 files / 3702 passed / 2
  skipped), which means the case did not fail on this run; whether it is inside or merely near its
  5000 ms budget on this machine was not measured, so the entry stays `open` with its remedy
  unchanged rather than being closed by a green suite that does not report per-case margins.

- **The 77 owed diff-disposition clauses recorded by the `31-18` entry** are superseded as a COUNT by
  the 75 measured above, and by nothing else: the entry's ownership analysis stands. A prior entry is
  history and is not rewritten; both counts are on the page with the reason for the difference.

## 31-26 (2026-09-10) — the round-6 closing re-measurement, and the deferral posture stated

**The posture, stated explicitly: nothing found by gap-closure round 5 is deferred past this round.**
All eleven findings of `31-REVIEW.md` (CR-12..CR-16, WR-22..WR-25, IN-12, IN-13), all seven
anti-pattern rows and all six `missing:` bullets of `31-VERIFICATION.md` carry a disposition backed
by a measurement in `docs/audit/31-round5-residuals.md` §7. **24 source items, 24 rows, 0 items
without a row.** Plan `31-26` changes **no** watched file and **no** source file.

The entries below are the pre-existing items re-measured, plus the **three** genuinely deferred
items this round raises. Each deferred item carries an OWNER and a CRITERION.

- **`npm run check:diff-disposition` — re-measured at `78bdb27`: `110 finding(s) over 39 elements`,
  up from the `75` the `31-20` entry recorded. DEFERRED, with owners.**
  The gate reports `39 watched file(s) changed since 4d2b8f0; 2206 changed clause(s) derived; 1790
  disposition row(s) across 20 file(s)`. Every finding, by the file it names:
  `05-pr-quality-gate.md` (**38**), `18-context-compaction.md` (**29**), `06-uat-pack.md` (**25**),
  `16-context-read-write.md` (**16**), `17-task-claim.md` (**2**).
  **Reason for the change since the `31-20` entry (75 → 110):** the round's own plans changed two
  watched workflow files and wrote **no** disposition file. Attribution is DERIVED, not assumed —
  `git log --oneline 49dfa26..HEAD -- <file>` names the commits, and
  `git diff --name-status 49dfa26..HEAD -- docs/audit/29-style-dispositions/` is **empty**:
  - `18-context-compaction.md`: **0 → 29**, owed by **`31-21`** (`8cde300`, `b3f666f`) and
    **`31-22`** (`12c7733`).
  - `16-context-read-write.md`: **10 → 16**, of which 10 stay owed by `31-15` and **6 by `31-23`**
    (`a38be64`).
  - The other three files are untouched by the round; their 65 findings are the standing
    `31-05`/`31-06`/`31-08` debt, unchanged.
  **Owner:** plans `31-21`, `31-22` and `31-23` for the 35 new ones; `31-05`, `31-06`, `31-08` and
  `31-15` for the standing 75.
  **Criterion that closes it:** one disposition file per owning plan under
  `docs/audit/29-style-dispositions/` — `31-21.md`, `31-22.md`, `31-23.md`, plus the standing
  `31-05.md`, `31-06.md`, `31-08.md`, `31-15.md` — each naming its own clauses with the rule and the
  reason. **Do NOT move `00-base.md`'s recorded `base_commit` (`4d2b8f0`) forward and do NOT narrow
  the watched corpus**; the gate's own message names both as clearing a finding by deleting its
  evidence.
  **Why `31-26` did not fix it:** unchanged from the `31-09`, `31-14`, `31-19` and `31-20` entries —
  writing rows for another plan's clauses puts a `before`/`after` and a reason in the register that
  this plan did not make and cannot vouch for.

- **`.temp/` probe artifacts are collected by the test runner and can kill a suite run. DEFERRED,
  with a criterion.**
  **Measured in-session** (`docs/audit/31-round5-residuals.md` §5.3): with one leftover
  `uat/*.uat.spec.ts` under `.temp/`, `npx vitest run --exclude '**/scripts/e2e/**'` collected it as
  a test file, two unrelated suite files reported failures (`uat-spec-integrity.test.ts` 1,
  `hooks/guard.test.ts` 5) and the process died on **SIGSEGV, exit 139**, with no `Test Files`
  summary line printed. After `rm -rf` of the probe root the identical command at the identical
  commit returned `62 passed` / `3908 passed | 2 skipped`, exit 0. **`git status --short .temp` was
  silent throughout**, because `.temp/` is gitignored at `.gitignore:19` — so the residue gate rounds
  3, 4 and 5 relied on could never have fired.
  **Owner:** unassigned — this is repository infrastructure, not a Phase 31 predicate.
  **Criterion that closes it:** `.temp/` excluded from the vitest include glob (so a probe artifact
  cannot be collected at all), **or** the FIFO sweep plus the per-plan probe-root existence tests run
  as a precondition of every suite run. **Not fixed here:** both are source/config changes, and a
  closing measurement plan that writes source has found a new defect, which belongs in its own plan.

- **`R-31-21-01` … `R-31-21-04` are held in a planning document, not in an exported register.
  DEFERRED, with a criterion.**
  Measured (`docs/audit/31-round5-residuals.md` §10.5): unlike `TRUSTED_ROOT_RESIDUALS` and
  `PROMOTE_ADMITTED_RESIDUALS`, which the suite binds two-sidedly, `31-21`'s four residuals live in
  `31-CONTEXT.md`'s D-24 block (lines 813, 819, 826, 841). In the source tree `R-31-21-01` appears
  once inside a test's message string and `R-31-21-03` once inside a source comment; `R-31-21-02` and
  `R-31-21-04` appear in neither. The register's own contract — "adding a member without
  dispositioning it turns a test red rather than shipping quietly" — has no purchase on them.
  **Owner:** plan `31-21`.
  **Criterion that closes it:** an exported residual register for the filesystem-primitive family,
  bound in both directions by a case, with these four as its members. **Not fixed here** for the same
  reason as above.

- **`node scripts/validate-agent-factory.js` invocation contract — re-measured, unchanged.** With
  `VALIDATE_KIT_ROOT=$PWD`: exit 0, `ALL CHECKS PASSED`. Its own `SCOPE` line still discloses that a
  repository-level `.grugops/factory.config.json` outside the kit tree is **not** examined unless
  `VALIDATE_ROOT` is supplied. Still an invocation contract rather than a structural failure; remedy
  unchanged. `status: open`.

- **`scripts/freshness.test.ts` "Test 1 (control, real tree)" timeout — NOT re-measured this round,
  and not closed.** The whole excluded-e2e suite is green at `78bdb27` (62 files / 3908 passed / 2
  skipped), which means the case did not fail on this run; whether it is inside or merely near its
  5000 ms budget on this machine was not measured, so the entry stays `open` with its remedy
  unchanged rather than being closed by a green suite that does not report per-case margins.

- **`.temp/31-21-derive-probe.mjs` survived its plan's cleanup.** Measured: `.temp/` holds 58
  entries, 57 of which pre-date this round's first fix commit (`0b64074`, 2026-09-09T21:18:33+03:00);
  the one exception has mtime `2026-09-09T22:02:38Z` and was written by plan `31-21` **outside** its
  declared single probe root, so `test ! -e .temp/31-21-probe` passed over it. It is a `.mjs`, not a
  `*.uat.spec.ts`, so it cannot contaminate a spec derivation — recorded as a named fact with an
  owner rather than left unexplained. `status: open`, owner `31-21`, criterion: a residue predicate
  derived from what a plan WROTE rather than from where it intended to write.
