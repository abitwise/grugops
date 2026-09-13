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

## 31-30 (2026-09-10) — the round-6 wave-4 carry-forward, with two items CLOSED by harness

Plan `31-30` is the first plan of any round to CLOSE a standing human-verification item by writing
the harness that was missing, rather than by carrying it a sixth time. Two of the four move; two do
not, and the two that do not are named with an owner and their `UNKNOWN - verify` markers intact.

- **`R-01` — the attended Claude-in-Chrome lane under real interactive auth. OPEN, unchanged, quoted
  verbatim from `31-VERIFICATION.md`'s `human_verification:` block.**
  > The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a
  > login/challenge page, and produces only a human-stamped finding + artifact-ref (never a gate
  > stamp).
  > **why_human:** Requires an attended Claude Code session with the Claude-in-Chrome browser
  > extension installed and a real interactive login; not reachable in CI and not reachable on this
  > box.
  **Status:** `OPEN — UNKNOWN - verify`. Carried unchanged through rounds 2, 3, 4, 5 and 6.
  **Owner:** a NAMED HUMAN with an attended Claude Code session and the browser extension installed —
  the repository owner. No agent can close it, and none may close it by argument.
  **What this plan did NOT do:** `scripts/chrome-lane-bar.test.ts`'s STRUCTURAL bar is green and runs
  on both CI legs. The lane's real interactive behaviour is not inferred from it, here or anywhere.

- **`R-02` — the `claude auth status --json` fail-closed predicate under alternative credential
  configurations. OPEN, unchanged, quoted verbatim.**
  > The claude auth status --json fail-closed predicate (D-10) behaves correctly under an
  > API-key-only box and under a long-lived setup token.
  > **why_human:** Research assumptions A2/A3 are UNKNOWN - verify; neither configuration is
  > reachable without destroying this box's real credentials.
  **Status:** `OPEN — UNKNOWN - verify`. Carried unchanged through rounds 2, 3, 4, 5 and 6.
  **Owner:** a NAMED HUMAN with a box carrying an API-key-only configuration and a second carrying a
  long-lived setup token. **Nothing was constructed this round**; doing so would destroy this box's
  real credentials.

- **`R-03` — the Windows leg. SHRUNK BY MEASUREMENT to a stated remainder; still OPEN.**
  **The record was wrong about what was missing, and the correction matters more than the work.**
  `31-round6-residual-dispositions.md` §F disposes `R-03` as "Fix via CI — add a `windows-latest` job
  running `npx vitest run --exclude '**/scripts/e2e/**'` + freshness + foundation guards. ONE job
  closes R-03…". **That job has existed since plan `20-04`.** `.github/workflows/ci.yml` declares
  `os: [ubuntu-latest, windows-latest]`, and measured from the file the Windows leg already runs six
  steps: `Checkout` (`fetch-depth: 0`), `Setup Node 22`, `Install (dev deps only — …)`,
  `Build (every other leg — a compile; parity is asserted on ubuntu, see above)`,
  `Typecheck (shipped source + test-inclusive target)` and `Vitest (e2e lane excluded)`. Adding a job
  that already exists would have been a fabricated closure.
  **What this plan added instead — two steps on the leg that exists:**
  `Platform shape corpus, exit-code contract and directory identity (every leg)` (unguarded, so the
  skip list is a DIFFERENTIAL measurement) and `Windows shape remainder is recorded, not silent
  (windows only)` (`if: matrix.os == 'windows-latest'`, with
  `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS: "1"`, so an EMPTY skip list on Windows is a FAILURE).
  Both sit BEFORE the vitest step, for the measured reason below. Neither ubuntu-only gate moved:
  `Freshness gate before any build (ubuntu only)` and `Freshness gates + repo gates (ubuntu only)`
  keep their conditions, and the latter is still the LAST step, which
  `(r-bound-synthetic)` in `scripts/check-foundation-guards.test.ts` depends on.
  **What the new steps drive, measured on darwin (`node scripts/check-platform-shapes.js`, exit 0,
  13 rows):** the portable non-regular-file shape (a DIRECTORY) and the POSIX-only FIFO at two
  positions — a note path and a `DECIDER_MANIFEST` module position — each producing a NAMED refusal
  in bounded time. **A THIRD position, the GOV-02 audit ledger path, was driven by the first draft
  and DROPPED**; the row count was 17 with it. The reason is a derived guard firing correctly and is
  recorded in full in its own entry below. What the two surviving positions drive: two CONTROLS at each position (an ordinary regular
  file, and a symlink that RESOLVES to one) neither of which draws the refusal; the spec-integrity
  runnable's exit-code contract over four could-not-run shapes, all `exit 2`, all inside `{0,1,2}`;
  and the `R-31-19-03` directory-identity premise, printed with its measurement.
  **The skip list, quoted from the darwin run:** `SKIPPED SHAPES (0):` / `(none) — this platform
  constructed every shape in the corpus`. With the disclosed seam
  `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT=FIFO` the same run prints `SKIPPED SHAPES (2):` — one entry
  per position — each naming the shape, the position, the platform and the reason — so the non-empty arm is watched rather than
  assumed.
  **THE REMAINDER, STATED BY NAME.** Everything above was measured on **darwin only**. What a
  Windows runner reports is not measurable from this box and is NOT claimed:
  1. whether the FIFO shape is skipped there (expected — named pipes on Windows live in the
     `\\.\pipe\` namespace and cannot be created at a filesystem path) and whether the symlink shape
     is skipped there (it needs Developer Mode or `SeCreateSymbolicLink`);
  2. whether `BROWSER_ABSENT_MARKER`'s two probe stages behave identically there — both are
     resolution-and-existence checks, which is an ARGUMENT and not a measurement;
  3. whether `PARSER_ABSENT_MARKER` is reached there;
  4. `R-31-19-03` itself — see below.
  **Owner:** the two new CI steps on the next `windows-latest` run, plus the standing human item.
  **Criterion that closes it:** a Windows run of
  `Windows shape remainder is recorded, not silent (windows only)` whose recorded skip list and
  driven rows are read by a human and written into this file.

- **`R-31-19-03` — degenerate directory identity. SHRUNK, NOT CLOSED.**
  The residual's own register entry names `31-30`'s Windows leg as its owner and says plainly that it
  "is measurable only on a platform whose filesystem reports degenerate directory identity, i.e.
  Windows, so no agent running on darwin can close it by measurement and none may close it by
  argument." This plan supplies the MEASUREMENT INSTRUMENT and nothing more: the new corpus step
  prints `home`, its parent, both `dev:ino` values and a `degenerate YES/no` verdict on whatever
  platform it runs on. Measured on darwin: `home /Users/olgeroeselg dev:ino=16777234:497384`,
  `its parent /Users dev:ino=16777234:16989`, `degenerate no — the identity sets are trusted`.
  **Remainder:** the Windows value, and whether `canonicalDirectoryPath` answers correctly where the
  verdict is `YES`. **Owner:** the same Windows run. `status: open`.

- **`R-04` — the installer round-trip on a pre-existing host install. CLOSED, by harness, with
  measurements.**
  It was never a human item. Its `why_human` read "Requires a second scratch repository with a prior
  grugops install at an earlier release; not exercised by the unit suite" — a description of a
  harness nobody had written, not of a judgement no machine can make. Five cases in
  `install/install.test.ts` now drive the five outcomes against the REAL committed
  `install/install.js` and `install/uninstall.js` in throwaway `mkdtemp` homes:
  | # | Outcome | Measured |
  |---|---|---|
  | 1 | an install into an EMPTY temporary home | `readdirSync(home)` is `[]` before; installer exits `0`; the materialized SET has **3** members, equal to the derived `RUNNABLES` destinations |
  | 2 | a second install is idempotent as a SET | set equality in both directions, cardinality **3 = 3**, and `tools/grugops/uat-spec-integrity.js` byte-identical across the two runs |
  | 3 | an install over the PRIOR shape | the third runnable removed → premise asserted at **2**; re-install exits `0`; the file exists, is byte-identical to `scripts/runnable-ref/uat-spec-integrity.js`, the run prints `created … tools/grugops/uat-spec-integrity.js`, and the other two print `(target already has it — D-04)`; the set returns to **3** |
  | 4 | the uninstaller removes it | exits `0`; the file is gone, `materializedSet` is `[]`, the run prints `tools/grugops/uat-spec-integrity.js (grugops runnable, byte-identical to source)`; `CLAUDE.md` and `plans/board.md` untouched |
  | 5 | an uninstall from a home with NOTHING installed | exits `0`, a clean no-op: the content-addressed tree snapshot is byte-identical before and after |
  `npx vitest run --exclude '**/scripts/e2e/**' install/install.test.ts` → **136 passed, 1 skipped**.
  **What R-04's closure does NOT establish:** the round-trip runs on **darwin**. The same five cases
  run on the `windows-latest` leg through the pre-existing vitest step, and that leg's result is part
  of `R-03`'s remainder above rather than of this closure. `status: closed`.

- **NEW, and the reason the two new CI steps sit BEFORE the vitest step: fourteen unguarded
  POSIX-only `mkfifo` constructions make the Windows leg's suite step unreachable-green.**
  **Measured on darwin** by scanning `scripts/*.test.ts`, `hooks/*.test.ts` and `install/*.test.ts`:
  **15** `mkfifo` call sites, of which **1** is guarded (`scripts/nonblocking-reader-parity.test.ts:318`,
  inside a `try` that returns `false` and produces a loud skip) and **14** are not — they either call
  `execFileSync("mkfifo", …)` bare or assert `spawnSync("mkfifo", …).status === 0` as a PREMISE.
  **Attribution is by FILE and by commit — a per-site attribution was NOT derived and is not
  claimed.** `git log --oneline -S'mkfifo' -- <file>` reports:
  `scripts/context-io.test.ts` (11 sites) moved by `6656e62` (`30-11`), `0b64074`/`34f6989`/`ee72409`
  (`31-21`) and `043aa9f`/`a81ba78`/`daa5e58` (`31-29`); `hooks/guard.test.ts` (2 sites) by `6656e62`
  (`30-11`) and `43dec42` (`31-27`); `hooks/admission-guard.test.ts` (1 site) by `6656e62` (`30-11`);
  and the one GUARDED site, `scripts/nonblocking-reader-parity.test.ts`, by `f28aa9f` (`31-27`).
  On a Windows runner each unguarded site is a failure rather than a skip.
  **This is a property of the SOURCE, so darwin can measure it; what a Windows run then does is NOT
  measurable from here and is NOT claimed.** The count is asserted and printed by a case in
  `scripts/uat-gate-exit-contract.test.ts`.
  **Why it was not fixed here:** it is pre-existing, it is in four test modules this plan does not
  otherwise touch, and the executor scope boundary puts another plan's defect out of scope. Fixing it
  is also not a one-line change: each site needs the parity corpus's construct-or-skip shape plus a
  recorded skip, which is a plan.
  **Owner:** unassigned — repository infrastructure, like the `.temp/` runner exclusion before it.
  **Criterion that closes it:** every `mkfifo` call site in a test module either constructs-or-skips
  with a recorded skip, or sits behind a `process.platform` guard whose skip is counted; asserted by
  a derived scan with the site count pinned two-sided.

### 31-30 (2026-09-10) — the `check:diff-disposition` debt, PAID DOWN and re-measured

**`npm run check:diff-disposition` — measured at `8cff6d8` before any row of this plan's Task 3
landed: `112 finding(s) over 39 elements`, up from the `110` the `31-26` entry recorded.** The gate
reports `39 watched file(s) changed since 4d2b8f0; 2250 changed clause(s) derived`. Every finding, by
the file it names: `05-pr-quality-gate.md` (**38**), `18-context-compaction.md` (**31** — 22 with no
row plus 9 FROZEN by `structuralSections`), `06-uat-pack.md` (**25**), `16-context-read-write.md`
(**16**), `17-task-claim.md` (**2**).
**Reason for 110 → 112:** this round's own waves 1-3. `31-27` and `31-29` each edited a watched
workflow and each wrote its own disposition file, so their own clauses are covered; what moved the
count is that `31-29`'s rewrite of `18-context-compaction.md:75`/`:83` made two more of `31-21`'s and
`31-22`'s pre-existing clauses changed clauses of the range. Plan `31-30`'s own Task 1 edit added
**4** clauses to `05-pr-quality-gate.md` (112 → 116) and `docs/audit/29-style-dispositions/31-30.md`
covered all four (116 → 112), so this plan's own contribution to the debt is **zero**, measured by set
difference rather than asserted.

**After Task 3's three owed disposition files: `80 finding(s) over 39 elements`. The debt fell by
32.**

| File | round 5 (`78bdb27`) | this plan, before | this plan, after | Owner of what remains |
|---|---|---|---|---|
| `agent-factory/workflows/05-pr-quality-gate.md` | 38 | 38 | **38** | plans `31-04`, `31-05`, `31-06`, `31-08` (standing) |
| `agent-factory/workflows/06-uat-pack.md` | 25 | 25 | **25** | plans `31-04`, `31-05`, `31-06`, `31-08` (standing) |
| `agent-factory/workflows/16-context-read-write.md` | 16 | 16 | **10** | plan `31-15` (3 alone at line 22, 7 shared with `31-19` at line 32) |
| `agent-factory/workflows/17-task-claim.md` | 2 | 2 | **2** | plans `31-05`/`31-06`/`31-08` (standing) |
| `agent-factory/workflows/18-context-compaction.md` | 29 | 31 | **5** | plan `31-29` — see the NEW finding below |
| **total** | **110** | **112** | **80** | |

**The three files written, and how their rows were attributed.** `docs/audit/29-style-dispositions/31-21.md`
(14 rows), `31-22.md` (12 rows, 6 of them carrying a filled `companion` cell for the frozen
`## Stop conditions` section) and `31-23.md` (6 rows). **Attribution is DERIVED, never assumed:**
`attributeClauses()` — the gate's own attribution, the same one `companionSatisfied` consults — was
run over the watched corpus at `8cff6d8` and each undispositioned clause mapped to the carrier commits
that changed it. `31-23`'s six carry `a38be64` alone. `31-22`'s twelve carry `12c7733`, six of them
also carrying `31-29`'s commits because a one-line paragraph makes every clause on it a changed clause
of every carrier that touched the line; those six are claimed on AUTHORSHIP and the reasoning is
written into the file. `31-21`'s fourteen carry `b3f666f`/`8cde300` together with `31-29`'s commits,
on the same basis. No clause was claimed whose carrier set did not include the named plan.

**`00-base.md`'s recorded `base_commit` (`4d2b8f0`) was NOT moved and the watched corpus was NOT
narrowed — the gate's own message names both as clearing a finding by deleting its evidence.** Both
are now asserted by cases in `scripts/uat-gate-exit-contract.test.ts`: the base SHA is compared
literally, and the gate's own reported `watched corpus: N markdown file(s)` is asserted at **40**.

- **NEW: five of `31-29`'s disposition rows cover NOTHING, because they pack multiple sentences into
  one `after` cell.** `docs/audit/29-style-dispositions/31-29.md` exists and carries six rows, so
  `31-29` did write its file. Two of those rows have an `after` cell holding several sentences — the
  three per-position price sentences in one, and the append-precedes-write pair in another.
  `rowMatches()` compares `normalizeSentence(row.after)` against a SINGLE derived clause, so a
  multi-sentence cell normalizes to one long string that matches no clause at all. Both rows are
  substantively correct and both are ineffective at the gate. Measured: 5 clauses at
  `18-context-compaction.md:75` (3, all FROZEN) and `:83` (2) whose only carrier is `31-29`.
  **This is a CLASS, not one file's slip** — any row whose `before`/`after` is not exactly one clause
  covers nothing, silently, while reading as work done.
  **Owner:** plan `31-29` for its own five. **Criterion that closes it:** split each multi-sentence
  `after` cell into one row per sentence, keeping the same rule, disposition and companion; and, for
  the class, a derived check asserting that every row in the register matches at least one changed
  clause — a row matching none is either stale or malformed, and today nothing says which.
  **Why `31-30` did not fix it:** the register's contract is one file per plan, and a plan that edits
  another plan's file is what that contract exists to prevent. `status: open`.

### 31-30 (2026-09-10) — the harness-instance tally, CLOSED

`docs/audit/31-round5-residuals.md` §9.4 recorded the phase's running count COLLIDED — `31-22-SUMMARY.md`
and `31-25-SUMMARY.md` both claiming "the ninth logged instance" — and named the closing criterion:
"one derived list of the instances, in one place, with the numbering read off that list rather than
typed into each summary."
**`docs/audit/harness-false-result-instances.md` is that list**: 13 rows, contiguous ordinals from 1,
each naming the plan or document that recorded it, the premise that was false, how it was caught, and
the ordinal that record CLAIMED. **No SUMMARY was edited** — `git diff --name-only b0232ae..HEAD --
'.planning/phases/31-autonomous-manual-testing/*SUMMARY.md'` is empty over this whole plan, and a case
asserts both summaries still say "ninth".
Four cases in `scripts/uat-gate-exit-contract.test.ts` hold it: contiguity and uniqueness; the
collision annotated with both summaries unrewritten; the scanned document set DERIVED with its
cardinality asserted (31 documents — 29 summaries + 2 `docs/audit/31-*` files); and every
ordinal-claiming sentence present, over a scan whose own vacuity floor is asserted (11 claims across
6 documents measured at this commit).
**What it does NOT settle, recorded in the list itself:** the pre-phase-31 project count is a
different scope and is not reconciled; §9.4's claim that `31-23` recorded a further unnumbered
instance could NOT be substantiated and is recorded as unsubstantiated rather than given an invented
row; and a harness corrected silently leaves no citation, so the count is a floor rather than a total.
`status: closed`.

- **NEW (raised by `31-30` itself): the GOV-02 audit-ledger position was DROPPED from
  `scripts/check-platform-shapes.ts`, because a derived guard fired correctly.**
  The first draft of that module drove three positions — a note path, the GOV-02 audit ledger path
  and a `DECIDER_MANIFEST` module position. Reaching `appendAuditLedger` at all requires a governing
  configuration with `audit_retention` retained, so the fixture spelled a `factory.config.json` path
  and both governance dial names. **Measured:** three cases in `scripts/context-io.test.ts` went red —
  `the derived site count equals the pinned count`, `the derived set and the annotated set agree` and
  `exactly ONE site is the governance reader, and it is scripts/context-io.ts (AUTO-06)`. The last of
  those admits EXACTLY ONE governance-dial reader and has no annotation escape.
  **The guard is right and the position is what moved.** The module does not READ a dial; it writes a
  fixture, and the predicate cannot tell those apart. Widening the predicate, or publishing a new
  export from a safety module so a probe can compose a fixture, would be adding a shipped surface for
  a test — which `CONFIG_PATH_SITES`'s own annotations warn against. Hiding the fixture bytes in a
  `.json` the scan does not read would clear the gate without answering the question it asks. So the
  position was dropped rather than smuggled past the scan, and the module's driven-row count fell
  from **17 to 13**.
  **What covers it instead, so the gap is not silent:** `scripts/context-io.test.ts` drives a FIFO
  and a directory at the GOV-02 ledger path on every CI leg, through the pre-existing vitest step.
  What is LOST is `check-platform-shapes`'s legible, printed, per-position record for that path —
  which matters most on the platform this whole step exists for, and which the vitest step may not
  even reach on Windows for the `mkfifo` reason recorded above.
  **Owner:** unassigned. **Criterion that closes it:** publish the two governance dial KEY NAMES from
  the one authority, the way plan `30-10` (finding B-1/B-5) published `GOVERNANCE_CONFIG_RELPATHS`
  after the same argument about a restated list — then a probe composes the fixture without spelling
  either literal, the AUTO-06 predicate is unmoved, and the position is restored here. `status: open`.

---

## 31-31 (2026-09-10) — the round-6 closing re-measurement of the entries above

Recorded by the closing measurement of gap-closure round 6. **Nothing here is a new deferral of this
plan's own making except where it says so.** Every figure is measured at commit `a6539e7`, with each
"over the round" range pinned to the round base `77123aa`. The full record is
`docs/audit/31-round6-residuals.md`.

### The four standing human items, re-stated at their measured state

- **`R-01`** — the attended Chrome lane under real interactive auth. **OPEN, unchanged**,
  `UNKNOWN - verify` intact. **Owner: a named human.** The structural bar
  (`scripts/chrome-lane-bar.test.ts`, 15 cases) is green and byte-untouched across the round; the
  lane's real behaviour is not inferred from it.
- **`R-02`** — the `claude auth status --json` predicate under API-key and long-lived-token
  configurations. **OPEN, unchanged**, `UNKNOWN - verify` intact. **Owner: a named human.**
- **`R-03`** — the Windows leg. **OPEN at the remainder `31-30` stated.** The instrument is wired on
  the pre-existing `windows-latest` leg; the reading is not taken, and `31-30` records six rows as
  `UNKNOWN - verify` in its own words. **Owner: a real `windows-latest` run.**
- **`R-04`** — the installer round-trip. **CLOSED by harness** (`31-30`, five measured outcomes,
  `136 passed, 1 skipped`). Re-stated here rather than re-derived. `status: closed`.

### The disposition debt, re-measured

`npm run check:diff-disposition` → **80 finding(s) over 39 elements**, base commit `4d2b8f0`,
watched corpus **40** markdown files — the base and the corpus both **unmoved** from what `31-30`
recorded. Down **30** from round 5's 110, and equal to `31-30`'s own end figure. Per-file:
`05-pr-quality-gate.md` 38 · `06-uat-pack.md` 25 · `16-context-read-write.md` 10 ·
`18-context-compaction.md` **5** · `17-task-claim.md` 2.

**The five `18-context-compaction.md` rows independently confirm `31-30`'s unfixed finding.** Owner
`31-29`; criterion: a `before`/`after` cell that is exactly one clause, plus a derived check that
refuses a multi-sentence cell. Not repaired here — writing rows for another plan's clauses puts a
reason in the register this plan cannot vouch for.

### Carried forward unchanged from `31-30`, re-stated so they are looked up rather than rediscovered

- **The multi-sentence disposition-row CLASS.** A row whose `before`/`after` is not exactly one
  clause covers nothing, silently, while reading as work done. No derived check catches it. Owner
  `31-29`.
- **Fourteen of fifteen `mkfifo` call sites carry no platform guard.** Owner: their own plan.
  `31-30` measured the SOURCE property on darwin and explicitly does not claim what a Windows run
  then does.

### Raised by this plan, with owners, and deliberately NOT repaired here

- **`R-31-31-01` — the ambient `declare` spelling.** `declare const it: unknown;` beside
  `import { test as it }` reports `0 findings`/EXIT=0, unmoved from `31-REVIEW.md` CR-18 point 3.
  The file does not compile (`TS2440`), so by `31-28`'s own recorded standard it is a curiosity
  rather than a bypass — and that standard is this round's, which is why the item is carried rather
  than dismissed. No member of `UNRESOLVABLE_CALLEE_RESIDUALS` names it. **Owner: round 7's fix
  plan.** Criterion: a corpus row driving it with the compile error asserted as the reason it cannot
  run, or a register member naming it.
- **The round-6 dispositions file's tally does not balance.**
  `31-round6-residual-dispositions.md` declares "34 items analysed. 19 fix, 13 close, 2 stay open";
  its six tables carry **43** rows (Fix 22 / Close 18 / Open 3), derived by command, and collapsing
  the one item that appears three times gives 41, not 34. **Owner: whoever writes round 7's
  dispositions file**, whose denominator should be DERIVED by command rather than typed. The
  round-6 file is history and is not rewritten.
- **The CR-15 parse-depth adjacency moved by one level**, 630/631 → **629/630**, bisected here. The
  PROPERTY is unmoved (EXIT=2 with the named could-not-run reason and the vacuity floor, which is
  never a pass); the NUMBER moved, consistent with `31-28`'s cutover adding a frame. **Owner: any
  future record that pins the number rather than the property.**
- **Spot-check row 6 of `31-VERIFICATION.md` round 6 is a three-way outlier**: it records depth 1,000
  answering EXIT=0 where round 5's own closing measurement and this one both measure EXIT=2. Not
  resolved by preference; both values printed in `docs/audit/31-round6-residuals.md` §6.5.
- **Four `TRUSTED_ROOT_RESIDUALS` members are closed only on the Claude Code hook path**
  (`hosts: non-cc-hook-path`): `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06`. Tier 0 is a
  narrowing on one host, not a closure. Owner: the register.

### One harness false result, logged rather than absorbed

Instance **14** in `docs/audit/harness-false-result-instances.md`, the ordinal READ OFF that list.
The first CR-17 position derivation took its pattern from `hooks/hook-entry.ts` and ran it against
the committed `hooks/hook-entry.js`, matched zero positions, and reported "0 of 0" as a pass shape —
instance 4's exact shape for the third time in this phase. Caught by the printed denominator
disagreeing with the printed position list; the derivation was rebuilt with a non-zero premise
assertion rather than its output believed.

## Deferred Items

- `npm run check:diff-disposition` is a **pre-existing FAIL** on this tree, unrelated to plan 31-33.
  It compares against the recorded base `4d2b8f0` and reports 78 findings over 39 elements after this
  plan (80 at the round-7 base `78a9d16`, and the count 31-31 recorded and 31-32 re-measured). Every
  remaining finding names a clause in a file this plan did not touch — `05-pr-quality-gate.md`,
  `17-task-claim.md`, and the frozen `## Stop conditions` region of `18-context-compaction.md` that
  `31-29` wrote. Zero findings name a clause plan 31-33 authored. Out of scope here: clearing them
  means walking several earlier plans' clauses and writing their rows, which is a documentation pass
  of its own, and the gate's own remedy text forbids the two shortcuts (narrowing the corpus, moving
  the recorded base). status: open

- **`frameworkSurface`'s inner catches are a silent-subtree shape** (found by plan `31-35`'s own
  adversarial probe of its own fix, by reading rather than by reproduction). `D-36` made every arm
  that STOPS the walk report itself — both bounds, and the seeding failure — but two `catch` blocks
  inside the walk still swallow a subtree with no signal: the one around `getPropertiesOfType` /
  `getSignaturesOfType` (`catch { continue; }`) and the per-property one around
  `getTypeOfSymbolAtLocation`. A checker that throws at either leaves framework declarations
  unreached exactly as a reached bound does, and the run reports a verdict anyway. NOT reproduced:
  making a real checker throw there needs a compiler fault this repository cannot synthesise, and a
  fix asserted against an unreproducible premise is the shape this phase keeps logging. Out of scope
  for `31-35`, whose finding is the BOUNDS. status: open

- **A framework member behind an INDEX SIGNATURE is accepted** (plan `31-35`'s probe; measured at
  exit 0 at HEAD *and* at the plan's base `140fbf4`, so pre-existing). It is DISCLOSED as a member of
  `UNRESOLVABLE_CALLEE_RESIDUALS` with a closure criterion and driven by the corpus row
  `CR25-INDEX-SIGNATURE-open`, which is why it is a remainder rather than an undisclosed defect.
  Closing it means reading a type's INDEX INFOS beside its properties, which widens the walked set
  and therefore moves the denominator of every coverage assertion — a separate decision, exactly as
  the recipe says descending return types is. status: open

---

## 31-38 (2026-09-11) — the round-7 closing re-measurement of the entries above

Measured at `3baab0d`, against the committed `.js`, tree clean before and after. Full record:
`docs/audit/31-round7-residuals.md`. **This plan wrote no source and repaired nothing it found.**

### The three standing human items, re-stated at their measured state

- **`R-01`** — the attended Chrome lane under real interactive auth. **OPEN, unchanged.**
  `scripts/chrome-lane-bar.test.ts` is byte-untouched across the whole round and green in the suite;
  that is the structural bar and not the lane. Owner: a named human. `status: open`.
- **`R-02`** — the `claude auth status --json` predicate under API-key and long-lived-token auth.
  **OPEN, unchanged.** No alternative configuration was constructed. Owner: a named human.
  `status: open`.
- **`R-03`** — the Windows leg. **OPEN, and LARGER by four shapes** — this round's `CR-22`, `CR-23`,
  `CR-24` and `CR-25` reproductions are all established on darwin 25.5.0 arm64 / Node v24.12.0 only.
  Owner: a real `windows-latest` run. `status: open`.
- **`R-04`** — the installer round-trip. **CLOSED by harness** (`31-30`). Re-stated, not re-derived,
  not re-opened. `status: closed`.

### The disposition debt, re-measured

- `npm run check:diff-disposition` → **`78 finding(s) over 39 elements`**, exit 1. 80 at the round-6
  close and at the round-7 base (`78a9d16`); 78 after `31-33`; **78 here** — down 2 over the round,
  still open. Every remaining finding names a clause in a file this round did not author. The gate's
  own remedy forbids narrowing the corpus and moving the base. Owner: unassigned. `status: open`.

### Carried forward unchanged, re-stated so they are looked up rather than rediscovered

- **The multi-sentence disposition-row CLASS.** A row whose `before`/`after` is not exactly one
  clause covers nothing, silently. No derived check catches it. Owner `31-29`. `status: open`.
- **Fourteen of fifteen `mkfifo` call sites carry no platform guard.** Owner: their own plan.
  `status: open`.
- **The GOV-02 audit-ledger position dropped from `check-platform-shapes`.** Criterion unchanged:
  publish the two governance dial KEY NAMES from the one authority, the way `30-10` published
  `GOVERNANCE_CONFIG_RELPATHS`, so a probe composes the fixture without spelling either literal and
  the AUTO-06 predicate is unmoved. Owner: unassigned. `status: open`.
- **Four `TRUSTED_ROOT_RESIDUALS` members are closed only on the Claude Code hook path**
  (`hosts: non-cc-hook-path`): `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06`. Re-measured
  this round: still 4 of 11. Owner: the register. `status: open`.
- **`R-31-31-01` — the ambient `declare const it: unknown;` spelling.** Re-driven here:
  `0 findings`, EXIT=0, **`tsc` EXIT=2** (`TS2440`). Unmoved in both directions. No round-7 plan took
  it; `31-34` recorded the neighbouring spec-local shape as `RR-13` instead. Owner: still round 8's
  fix plan. `status: open`.
- **`R-31-33-01` and `R-31-33-02`** — the two write-path boundaries `31-33` published rather than
  claimed, now members of `WRITE_PATH_RESIDUALS` (7). `R-31-33-02` is **not drivable from outside the
  module**: `DEFAULT_CONTEXT_ROOT` is not exported and observing the split needs a shared-install
  layout. Owner: `31-33`, published. `status: open`.
- **`RR-13`** — a head the spec file hand-`declare`s for itself stays accepted, because the shape is
  structurally identical to `WR-26`'s own control. Owner: `31-34`, published. `status: open`.
- **`frameworkSurface`'s two inner `catch` blocks** and **the INDEX-SIGNATURE shape** — both entered
  above by `31-35`, both re-measured here and unchanged (the index-signature shape drives
  `0 findings`/EXIT=0 with `tsc` exit 0, exactly as its corpus row asserts). `status: open`.
- **The installed-package magnitude behind `SURFACE_DEPTH_BOUND` (6) and `SURFACE_NODE_BOUND`
  (4096).** `UNKNOWN - verify` — `CLAUDE.md` fixes the dependency set, so `@playwright/test` cannot
  be installed here. `D-36` closed the bound's DIRECTION; its magnitude on the installed-package
  route is not established. Owner: unassigned. `status: open`.
- **`.temp` in `SKIPPED_DIRECTORIES`** (`WR-35`). The narrowing is retained by `D-33 (5)` and
  DISCLOSED rather than reverted — measured this round: a target carrying a spec under a `.temp`
  segment emits the named marker with per-directory hit counts on stderr, and a target with no hit
  emits zero bytes. Criterion: a named human re-taking `D-30`'s sub-decision 3, or a per-host
  configurable skip set. Owner: `31-32`, published. `status: open`.

### Raised by this plan, with owners, and deliberately NOT repaired here

- **The review-to-corpus coverage obligation `D-33 (2)` handed here is a ONE-SHOT, and its predicate
  over-includes.** Asserted once in `docs/audit/31-round7-residuals.md` §9 with both sides derived.
  Under the STRICT predicate (a finding naming the runnable must be cited by a `row()`-marked case)
  it is **2 of 5**; under the WEAKER one (cited by SOME `it()` case) it is **5 of 5**. The gap is
  exactly `WR-35`, `IN-16` and `IN-17` — findings whose closure is a stderr line, an ABSENCE and a
  doc-block edit, none of which a UAT spec can drive. **Neither predicate is derived from a rule
  that separates row-shaped findings from the rest**, which is the same hand-maintained-set shape
  that produced the regression `D-33` deleted. Owner: **round 8's planner**. Criterion: a derived
  "this finding is drivable as a UAT spec" rule, so the denominator is the coverable set rather than
  the naming set. `status: open`.
- **`31-REVIEW.md`'s `## Skipped entries` block is a MARKDOWN-PARSE ARTIFACT, not a finding.** It is
  a `##` heading inside a fenced `render()` transcript in `CR-24` (fence `:430`–`:442`). A scanner
  that does not strip fences reports a fourteenth finding that no document filed; this round's
  convening brief carried it as one. Fixed here by stripping fences before the heading scan;
  **recorded so round 8 does not carry the phantom forward.** Owner: any future derivation over
  `31-REVIEW.md` headings. `status: open` (as a standing scanning rule, not a defect in the tree).
- **`.planning/STATE.md`'s `prior_activity_desc` was a 7 995-character single line.** Measured before
  this plan's write; it is stale Phase-27 narration, superseded twice. It exceeds the 4 000-character
  ceiling this plan's own verify asserts, and this repository has previously combined a pathological
  STATE line with a superlinear guard predicate to turn a sub-second gate into a multi-minute one.
  Shortened to a pointer by this plan and recorded as a deviation. Owner: the state writer.
  `status: closed` for this occurrence; the writer's behaviour is unchanged.

### Harness false results, logged rather than absorbed

- **Instance 15** (ordinal read off `docs/audit/harness-false-result-instances.md`, whose last row is
  14). The first `admitAndAppend` probe wrote its governance dial at the WRONG KEY —
  `{ "human_admission": … }` at the config root instead of `{ "context": { "human_admission": … } }`.
  Every dial value then produced the identical `admission REFUSED (W3)` and ZERO files on disk, which
  reads exactly like a closure of `CR-22` position 3 and is not one. Caught by driving all three dial
  values and observing they could not be told apart. Not written into the ledger file by this plan —
  this plan writes no source and `scripts/harness-instance-ledger.test.ts` derives its premises from
  that file's rows. **Owner: round 8's fix plan**, which should append it with the derived-premise
  case green. `status: open`.
- **A second, self-inflicted one, logged for the same reason.** This session's first full-suite run
  went RED on `POINT 7: no probe root is left under '.temp'` — because THIS session's AST probe roots
  were still sitting under `.temp/31-38-probe/`. The suite was measuring the measurement. Probe
  residue was removed and the suite re-run clean. It is also why §7.2 of the record states that the
  `.temp`/FIFO sweep must be taken AFTER the suite and prints the mid-flight readings that prove it.
  `status: closed`.

### Recorded by plan 31-41 — a derived axis that counts TEXT, not calls

- **`EXPECTED_APPEND_NOTE_CALL_SITES` is a regex over source TEXT, so PROSE naming the writer reads
  as a call site.** The axis in `scripts/context-io-writer-set.test.ts` counts
  `/appendNote\(/g` across every tracked non-test source under `scripts/`, `hooks/` and `install/`.
  Plan `31-41` wrote two reproductions into `WRITE_PATH_RESIDUALS`' prose that spelled
  `appendNote(` inside a string literal, and the count moved **6 → 8** — a real red raised by two
  comments. MEASURED, not inferred: rewording the two strings so the reproduction does not spell the
  open parenthesis returned the count to **6** with no constant bumped and no assertion weakened.
  The axis's own message says the count is "a decision rather than a bumped constant", and that
  posture is right; what is disclosed here is that its INPUT is text, so a false positive is
  expressible by writing a sentence. The sibling axes this phase built since `31-40` parse the
  source into a syntax tree and match call EXPRESSIONS, which is the shape that has no such reading.
  Converting this one is a change to a derived axis `31-41` was not convened to move, so it is named
  with its coordinate rather than taken silently. **Owner: whichever plan next touches PART FIVE of
  `scripts/context-io-writer-set.test.ts`.** What would force it closed: the axis parsing its corpus
  with `ts.createSourceFile` and counting `ts.isCallExpression` nodes whose callee identifier is
  `appendNote`, with the existing seeded mirror re-pointed at a real call rather than a substring.
  `status: open`.

## From plan 31-42 (gap-closure round 9, wave 11)

- **`agent-factory/workflows/05-pr-quality-gate.md` step 3 publishes a narrower exit-2 claim than the
  checker carries.** It reads "Two conditions produce exit `2`, and each one emits its own
  distinctly-marked loud skip". `scripts/runnable-ref/uat-spec-integrity.js` reaches exit 2 from at
  least six: an unresolvable parser (`PARSER_ABSENT_MARKER`), an unusable browser lane
  (`BROWSER_ABSENT_MARKER`), a Program that cannot be created (`PROGRAM_UNAVAILABLE_REASON`), a
  framework-surface walk that stopped early (`SURFACE_TRUNCATED_CAUSE`, four arms as of `D-42`), a
  containment refusal from the spec walk, and a zero-element derivation. This is the same
  claim-outruns-mechanism shape `UATX-06` exists to close, one document over.
  - **Why it is not fixed in `31-42`:** that workflow is inside the `LANG-03` watched corpus, so
    every changed clause owes a disposition row, and the sentence sits in a region neighbouring a
    frozen section, so a change there owes a companion edit too. `31-42` was convened for the checker
    and its recipe, and widening into a watched workflow inside a gap-closure plan is the
    incrementalism this phase's own rules refuse.
  - **Owner:** the next plan that edits `05-pr-quality-gate.md` for any reason.
  - **Closing criterion:** the workflow states the exit-2 condition as a RULE rather than a count —
    "any condition the checker names on stderr with its own marker" — or the count is derived from
    the checker's own published cause set and bound in both directions, with disposition rows.
  - **Recorded by:** `D-42`'s `does not establish` section.
