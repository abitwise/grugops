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
  17 rows):** the portable non-regular-file shape (a DIRECTORY) and the POSIX-only FIFO at three
  positions — a note path, the GOV-02 audit ledger path and a `DECIDER_MANIFEST` module position —
  each producing a NAMED refusal in bounded time; two CONTROLS at each position (an ordinary regular
  file, and a symlink that RESOLVES to one) neither of which draws the refusal; the spec-integrity
  runnable's exit-code contract over four could-not-run shapes, all `exit 2`, all inside `{0,1,2}`;
  and the `R-31-19-03` directory-identity premise, printed with its measurement.
  **The skip list, quoted from the darwin run:** `SKIPPED SHAPES (0):` / `(none) — this platform
  constructed every shape in the corpus`. With the disclosed seam
  `GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT=FIFO` the same run prints three entries, each naming the
  shape, the position, the platform and the reason — so the non-empty arm is watched rather than
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
