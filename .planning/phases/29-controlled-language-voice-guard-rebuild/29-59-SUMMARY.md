---
phase: 29-controlled-language-voice-guard-rebuild
plan: 59
subsystem: infra
tags: [ci, git, tsc, build-parity, gate, vitest, typescript]

requires:
  - phase: 20-typescript-toolchain
    provides: "the committed-.js contract, tsconfig outDir/rootDir './', and the ci.yml step order that made this gate vacuous"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "29-REVIEW CR-01 (the traced + measured finding) and 29-CONTEXT D-57 (the ordering-independent repair)"
provides:
  - "scripts/freshness.ts reads its committed side from `git show HEAD:<posix-path>` and derives its compared set from `git ls-tree -r -l HEAD`, so no earlier step can repair its subject"
  - "six named fail-closed verdicts, two arms over one predicate selected at one site, and published counts a human can check by hand"
  - "a discrimination pair: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree, with tsc run in both"
  - "`npm run check:build-parity` — the ONE authority for the working-tree parity question, called by ci.yml rather than restated in it"
  - "the freshness gate invoked BEFORE any build in ci.yml, as a second and independent mechanism"
  - "docs/audit/29-round8-residuals.md §5 — V-29-59-01 and V-29-59-02, the coverage the subject change moved, with owners, directions, live counts and wiring"
affects: [29-60, ship, any phase whose verification quotes `npm run build && npm run freshness` as build-parity evidence]

actuals:
  tokens: 39393
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "a gate whose subject is HEAD rather than the working tree, so step ordering cannot repair what it judges"
    - "two arms over one predicate, selected from ONE derived set at ONE site, with the arm counts asserted to sum to the compared total or the gate refuses"
    - "a discrimination pair as a permanent test case: one plant, two clones, pre-fix green and post-fix red, asserted together so the pair cannot drift apart"
    - "an env-switchable RED replay (`FRESHNESS_POSTFIX_REF`) so the evidence a case was watched failing is reproducible rather than quoted"

key-files:
  created: []
  modified:
    - scripts/freshness.ts
    - scripts/freshness.js
    - scripts/freshness.test.ts
    - package.json
    - .github/workflows/ci.yml
    - .gitignore
    - docs/audit/29-round8-residuals.md

key-decisions:
  - "D-57 implemented: the build-output gate's committed side is read from git, making the repair ordering-independent by construction; the CI reorder and the parity script are the second, independent mechanism and are documented as such rather than as the reason the gate works"
  - "The compared set is derived from `git ls-tree -r -l HEAD` in ONE invocation that also yields the largest committed output's byte size, so the read-ceiling margin is a property of the set under test rather than a second measurement of a possibly different set"
  - "A modified-source path takes the WORKING arm with its own verdict and remedy, because a rebuild of a modified source is not a rebuild of HEAD's source and reporting it against HEAD would name a cause that is not there"
  - "The parity assertion is scoped to ubuntu with the reason stated in the workflow: a raw diff over emitted files on a Windows checkout is an unreliable oracle, and the script's POSIX pathspec would pass through cmd.exe unquoted and match nothing — a vacuous green is worse than an absent check"
  - "The gate's own header claim that the WORD 'fresh' is absent from every failing run was disproven by the harness and replaced with the checkable claim: the green VERDICT LINE is printed on the success path and on no other"

patterns-established:
  - "Assert the harness's premise: the pre-fix commit's reachability, the clone's checked-out SHA, the non-repository-ness of the refusal directory and the non-degeneracy of the discrimination pair are all asserted before any case runs"
  - "Derive the element count independently of the loop that consumes it: the test derives the HEAD .js cardinality with `--name-only` while the gate derives it with `-l`, and the union case asserts they agree"
  - "Name a NON-owner explicitly when coverage moves: V-29-59-01 records, with a measured transcript, that `npm run check:build-parity` does not own the question it looks like it owns"

requirements-completed: []

coverage:
  - id: D1
    description: "The build-output gate's subject is HEAD: the committed side is read with `git show HEAD:<posix-path>` as a Buffer and the compared set is derived from `git ls-tree -r -l HEAD`, with the set asserted equal against the filesystem walk in both directions"
    verification:
      - kind: unit
        ref: "scripts/freshness.test.ts#UNION: on every clone the arm counts sum to the compared total, and that total is the derived HEAD set cardinality"
        status: pass
      - kind: unit
        ref: "scripts/freshness.test.ts#SET EQUALITY (HEAD-only): a committed output deleted from the working tree is named and counted"
        status: pass
      - kind: unit
        ref: "scripts/freshness.test.ts#SET EQUALITY (working-only): an extra untracked build output is named and counted"
        status: pass
    human_judgment: false
  - id: D2
    description: "The repair is proven NOT vacuous: the same planted stale committed .js, on a clone of the pre-fix tree and a clone of the post-fix tree with tsc run in both, exits 0 on the first and 1 on the second"
    verification:
      - kind: unit
        ref: "scripts/freshness.test.ts#DISCRIMINATION PAIR: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree"
        status: pass
      - kind: unit
        ref: "scripts/freshness.test.ts#ORDERING INDEPENDENCE: a mutated HEAD blob reds whether or not the in-place build ran first"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every case the gate can meet has a named fail-closed verdict and a named cause: stale committed, stale working, orphaned committed, uncommitted build output, deleted committed output, and refusal"
    verification:
      - kind: unit
        ref: "scripts/freshness.test.ts#ARM SEPARATION: two causes get two diagnoses, and the two verdict strings differ"
        status: pass
      - kind: unit
        ref: "scripts/freshness.test.ts#REFUSAL: git that cannot answer produces a named refusal, a non-zero exit, and no fresh line"
        status: pass
      - kind: unit
        ref: "scripts/freshness.test.ts#Test 3 (fail-closed, surviving): a rebuild that does not compile never reports fresh"
        status: pass
    human_judgment: false
  - id: D4
    description: "The working-tree question has ONE script authority, invoked by continuous integration rather than restated in it, and the freshness gate runs before any build"
    verification:
      - kind: integration
        ref: "npm run check:build-parity on a clone with a planted stale committed .js (b2c2ff0) → exit 1 naming hooks/guard.js and the remedy; on a re-created clean clone (0ad875a) → exit 0"
        status: pass
      - kind: other
        ref: "grep -c 'git diff' .github/workflows/ci.yml → 0; exactly one package.json script contains the assertion"
        status: pass
    human_judgment: false
  - id: D5
    description: "The coverage the arm change moved off this gate is recorded as V-29-59-01 and V-29-59-02 with an owner, a direction, a live count and its wiring"
    verification:
      - kind: manual_procedural
        ref: "docs/audit/29-round8-residuals.md §5.1, §5.2, §5.3"
        status: unknown
    human_judgment: true
    rationale: "Whether a recorded residual names the RIGHT owner and the right direction is a reading judgement; the live counts are derived by the commands printed beside them, but the adequacy of the record is not machine-decidable."

duration: 26min
completed: 2026-08-18
status: complete
---

# Phase 29 Plan 59: Build-parity gate repair Summary

**The gate that was supposed to make a committed `.js` unable to drift from its `.ts` could not fail; its subject is now HEAD, and the same planted drift that was green on yesterday's tree is red on today's.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-08-18T16:44Z
- **Completed:** 2026-08-18T17:10Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- `scripts/freshness.ts` reads its committed side with `git show HEAD:<posix-path>` as a Buffer and derives its compared set from a single `git ls-tree -r -l HEAD` invocation. A build step running earlier in the same job rewrites the working tree, which is no longer this gate's subject, so it has nothing to repair.
- The vacuity is not merely described — it is **reproduced**. Under the RED replay, a clone of the pre-fix tree carrying a committed plant plus `npm run build` printed `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` and exited 0. The post-fix clone, identical plant, identical build, exits 1 naming `hooks/guard.js`.
- Six named verdicts, each fail-closed, each with its own remedy sentence; two arms over one predicate selected from one derived set at one site, with the arm counts asserted to sum to the compared total or the gate refuses.
- `npm run check:build-parity` is the one authority for the working-tree question. `grep -c 'git diff' .github/workflows/ci.yml` is **0**: the workflow calls the script and never restates it.
- `docs/audit/29-round8-residuals.md` §5 records the two pieces of coverage the subject change moved, one of them with a measured demonstration that the obvious candidate owner is *not* the owner.

## Task-by-task

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | the gate's subject moves from the working tree to HEAD | `7cebe32` | `scripts/freshness.ts`, `scripts/freshness.js` |
| 2 | the discrimination proof — the same drift, green before and red after | `7e42b3d` | `scripts/freshness.test.ts`, `.gitignore`, `scripts/freshness.ts`, `scripts/freshness.js` |
| 3 | one authority for the working-tree question, wired at both ends | `0ad875a` | `package.json`, `.github/workflows/ci.yml`, `docs/audit/29-round8-residuals.md` |

**Pre-fix tree id:** `020905f9499b1c1b92a7f56cb982cc6974589bf3`
**Post-fix tree id (Task 1):** `7cebe32468151a36bc400d00ed0e113150364a19`

## The discrimination pair — quoted

Both sides carry a committed plant (`\n// planted drift\n` appended to `hooks/guard.js`, committed) and both had `npm run build` run before the gate.

**Pre-fix clone**, `git rev-parse HEAD` = `1b1bd25d6e8cf05bca772f4ca37d693a17deef42` (checked out from `020905f`):

```
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
exit 0
```

**Post-fix clone**, checked out from `7cebe32`:

```
Build-output check (D-02, D-57) — subject: the .js committed at HEAD, read with `git show`.
HEAD 84e4c24eca4b892a3af31959644232e490a2c014
Compared 48 path(s) derived from `git ls-tree -r HEAD` — 48 on the HEAD arm, 0 on the working-tree arm (uncommitted source); the arms sum to 48.
Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD.
Largest compared output 270501 byte(s); git read ceiling 67108864 byte(s).
STALE COMMITTED OUTPUT: hooks/guard.js — the .js committed at HEAD is not a build of the .ts committed beside it. Run `npm run build` and commit the result.
BUILD-OUTPUT CHECK FAILED: 1 finding(s).
exit 1
```

The ordering-independence half is visible on **one** clone. The pre-fix gate, on the post-fix clone's plant *before* the in-place build, DID red — `STALE: hooks/guard.js` — and *after* the in-place build printed `All build outputs fresh: 48 ...` and exited 0. That before/after pair on a single clone is CR-01's mechanism, measured rather than argued.

## The six verdicts, quoted from `scripts/freshness.ts`

```
:310  STALE COMMITTED OUTPUT: <path> — the .js committed at HEAD is not a build of the .ts committed beside it. Run `npm run build` and commit the result.
:315  STALE WORKING OUTPUT: <path> — its source is modified or untracked, and the .js in the working tree is not a build of it. Run `npm run build` before committing.
:320  ORPHANED COMMITTED OUTPUT: <path> — committed at HEAD with no counterpart in a rebuild. Delete it, or restore the .ts that emits it.
:325  DELETED COMMITTED OUTPUT: <path> — committed at HEAD and absent from the working tree. Restore it, or commit the deletion.
:330  UNCOMMITTED BUILD OUTPUT: <path> — present on disk under a build-output directory and absent from HEAD. Commit it, or remove it.
:121  REFUSED: <reason>
```

The two arm verdicts side by side, from the ARM SEPARATION case's two clones — two causes, two diagnoses:

```
STALE COMMITTED OUTPUT: hooks/guard.js — the .js committed at HEAD is not a build of the .ts committed beside it.
STALE WORKING OUTPUT: scripts/freshness.js — its source is modified or untracked, and the .js in the working tree is not a build of it.
```

## Self-validation of the changed gate, in both positions

**Pre-commit** (its own source uncommitted, so it must take the working arm for exactly one path):

```
Compared 48 path(s) derived from `git ls-tree -r HEAD` — 47 on the HEAD arm, 1 on the working-tree arm (uncommitted source); the arms sum to 48.
Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk and absent from HEAD.
All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.   exit 0
```

**Post-commit** (source and twin committed together at `7cebe32`, so it judges its own committed twin on the HEAD arm):

```
HEAD 7cebe32468151a36bc400d00ed0e113150364a19
Compared 48 path(s) derived from `git ls-tree -r HEAD` — 48 on the HEAD arm, 0 on the working-tree arm (uncommitted source); the arms sum to 48.
All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.   exit 0
```

`48` is the same compared count the pre-fix gate reported, so nothing was reached by narrowing what the gate compares. The largest committed output is `270501` bytes against a `67108864`-byte read ceiling, and the gate refuses outright if that margin ever inverts.

## Every new case was watched failing

Nine new gate cases; nine watched failing. Seven via the reproducible RED replay
(`FRESHNESS_POSTFIX_REF=020905f9499b1c1b92a7f56cb982cc6974589bf3`), two against a planted control.

| case | how it was watched failing | actual value observed |
|---|---|---|
| Test 1 (control, real tree, now asserting published counts) | planted control: the ROOT gate replaced by the pre-fix blob | `Freshness check FAILED: 1 stale build output(s) detected.: expected 1 to be +0` |
| DISCRIMINATION PAIR | RED replay | post-fix side `exit 0`, `All build outputs fresh: 48 ...` — `expected +0 to be 1` |
| ORDERING INDEPENDENCE | RED replay | `expected 'STALE: hooks/guard.js — committed bui…' to contain 'STALE COMMITTED OUTPUT: hooks/guard.js'` |
| CONTROL | planted control: the same post-fix clone, mutated | `exit 1`, `STALE COMMITTED OUTPUT: hooks/guard.js`, no fresh line |
| ARM SEPARATION | RED replay | pre-fix gate reports one undifferentiated `STALE:` for both causes |
| UNION | RED replay | `harness: the gate printed no parsable count lines.` |
| SET EQUALITY (HEAD-only) | RED replay | `exit 0`, `All build outputs fresh: 47 ...` — the deleted path silently left the denominator |
| SET EQUALITY (working-only) | RED replay | `expected 'STALE: scripts/__extra_build_output__…' to contain 'UNCOMMITTED BUILD OUTPUT: …'` |
| REFUSAL | RED replay | nested case `exit 0` with the fresh line, in a directory with no repository of its own |

RED replay tally: `Tests 7 failed | 4 passed (11)`. The four that passed are Test 1 and Test 3 (which drive the REAL tree's post-fix artifact, not a clone), CONTROL (a control, red against a planted control instead) and PROVENANCE — which is a harness self-check about clone discipline, **not** a gate case, and is counted as neither.

The `SET EQUALITY (HEAD-only)` row is the most instructive: the pre-fix gate reported **47** where it had reported 48, because a deleted path simply left its denominator with no finding and no note. A shrinking denominator that reads as green is the failure class this phase has paid for repeatedly.

## Clone provenance

- **7 clones per test-suite run**, one per plant, none reused, all under the gitignored `.temp/freshness-clones/`, plus one non-repository directory under the OS temp dir for the refusal case.
- **6 further clones** were created during verification: one for timing measurement, one for the CONTROL planted control, two failed attempts at the parity end-to-end check (made before Task 3 was committed, so the clones' `package.json` did not yet carry the script), and two for the successful parity check.
- **No clone was reused between plants. No clone was reset with `git checkout --`. No clone was created by extracting an archive** — the gate reads git, and an archive extract has no HEAD to read.
- Each clone's `git rev-parse HEAD` is carried in the assertion message; `makeClone` refuses if the checked-out HEAD is not the SHA it asked for.
- The parent repository's `git status --porcelain` is clean of clone residue after the suite (T-29-59-07).

## The parity script, end to end

```
=== PLANTED CLONE (b2c2ff0859bac8d6533a86fbe5d1f2c647251811) ===
parity exit = 1
hooks/guard.js
BUILD PARITY FAILED: either the build did not complete, or it moved one of the tracked build outputs
named above - meaning a committed .js on this tree is not a build of its .ts. Remedy: run npm run
build and commit the result.

=== RE-CREATED CLEAN CLONE (0ad875a692dea945132b36456c7a15ffb60ae1c5) ===
parity exit = 0
Build parity: no tracked build output moved when tsc ran.
```

Exactly one `package.json` script contains the assertion (`check:build-parity`, verified by
`Object.entries(scripts).filter(v => v.includes('git diff'))` → `["check:build-parity"]`), and
`grep -c 'git diff' .github/workflows/ci.yml` is `0`.

## The workflow step order, before and after

| before | after |
|---|---|
| `:37` Checkout | `:37` Checkout |
| `:49` Setup Node 22 | `:49` Setup Node 22 |
| `:55` Install | `:55` Install |
| `:58` Build (tsc → committed .js parity surface) | `:76` **Freshness gate before any build (ubuntu only)** |
| `:73` Typecheck | `:100` **Build and working-tree parity assertion (ubuntu)** |
| `:79` Vitest | `:104` **Build (every other leg — a compile; parity is asserted on ubuntu, see above)** |
| `:84` Freshness gates + repo gates (ubuntu only) | `:120` Typecheck |
| | `:126` Vitest |
| | `:131` Freshness gates + repo gates (ubuntu only) |

**Unintended changed operative lines: 0.** The whole `ci.yml` diff is a single hunk: one line removed
(the old `- name: Build (tsc → committed .js parity surface)`) and 47 lines added. Every other step,
command, `run:` body, matcher and `if:` condition in the file is byte-unchanged, including the entire
later `Freshness gates + repo gates` block. The `run: npm run build` line is preserved and is now the
body of the non-ubuntu build step.

**What a CI run will now do differently**, stated plainly:

1. On `ubuntu-latest`, `npm run freshness` runs immediately after `npm ci`, before anything compiles.
2. On `ubuntu-latest`, the build step is now `npm run check:build-parity`, which runs `npm run build`
   and then fails the job if any tracked `.js` moved.
3. On `windows-latest` (and any future leg), the build step is `npm run build` and asserts no parity.
4. The later `Freshness gates + repo gates` block is untouched and still runs `npm run freshness`, now
   as a second invocation of an ordering-independent gate.
5. Every job that previously went green on a stale committed `.js` now goes red.

## Full sweep on this plan's final tree

| command | exit |
|---|---|
| `npm run check:public-docs` | 0 — `ALL CHECKS PASSED` |
| `npm run check:audit-register` | 0 — `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | 0 — `ALL CHECKS PASSED` |
| `npm run check:banned-claims` | 0 — `ALL CHECKS PASSED` |
| `npm run check:imperative-lexicon` | 0 — `ALL CHECKS PASSED` |
| `npm run check:diff-disposition` | 0 — `ALL CHECKS PASSED` |
| `npm run check:nul-bytes` | 0 — `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | 0 |
| `node scripts/check-kit-refs.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 |
| `node scripts/check-uat-oracles.js` | 0 |
| `npm run freshness` | 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:context` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run freshness:queue` | 0 |
| `npm run freshness:traceability` | 0 |
| `npm run check:build-parity` | 0 |
| `npx tsc --noEmit` | 0 |
| `npx tsc -p tsconfig.tests.json` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2138 passed, 2 skipped** in 147s |

The 2 skipped tests are pre-existing and belong to other files; this plan added no skip.

**Scope fence (D-58) holds.** `git diff --numstat scripts/check-banned-claims.ts scripts/check-banned-claims.js agent-factory/writing-profile.md docs/audit/28-claim-registry.md .planning/REQUIREMENTS.md` reports no change across all three commits. No requirement row was flipped and `requirements-completed:` is empty.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The gate's own header carried a claim the harness disproved**

- **Found during:** Task 2, on the first run of the new harness.
- **Issue:** Task 1's module header asserted that the word `fresh` appears in exactly one line the gate can print, so a failing run's stdout would carry zero case-insensitive occurrences of it. Two cases red immediately and both were right to: `scripts/freshness.js` is a path the gate legitimately NAMES in a finding, and the test clones live under `.temp/freshness-clones/`. The word could never have been the invariant.
- **Fix:** The invariant was narrowed to the checkable proposition — the green VERDICT LINE `All build outputs fresh:` is printed on the success path and on no other. Both the gate's header and the harness now say so, and both record the disproven claim rather than deleting it.
- **Files modified:** `scripts/freshness.ts`, `scripts/freshness.js`, `scripts/freshness.test.ts`
- **Commit:** `7e42b3d`
- **Why it is recorded here:** this is the plan's own standing rule turned on the plan. A claim in a comment that no gate holds is a trace defect, and it was caught only because the harness asserted it instead of restating it.

**2. [Rule 3 - Blocking] The `npm run build` step could not simply become the parity script on both OS legs**

- **Found during:** Task 3.
- **Issue:** The plan asks that the build step invoke the new script and that the OS scoping be decided explicitly. A single GitHub Actions step cannot vary its `run:` by matrix leg, and scoping the parity script to ubuntu while leaving one shared build step would have left the Windows leg with no build at all.
- **Fix:** Two steps with complementary conditions — `if: matrix.os == 'ubuntu-latest'` invokes `npm run check:build-parity`, and `if: matrix.os != 'ubuntu-latest'` invokes `npm run build`. The negated condition rather than an equality against `windows-latest` means a future third leg still gets a build rather than silently getting none.
- **Files modified:** `.github/workflows/ci.yml`
- **Commit:** `0ad875a`

**3. [Rule 2 - Missing critical] A second residual id was opened that the plan did not name**

- **Found during:** Task 3.
- **Issue:** The plan anticipated a second `V-` id only if Task 2's clone strategy required a Windows skip. It did not — the clones live under the repository root and run on both platforms. But Task 3's own OS-scoping decision *is* a skip of the same shape: the working-tree parity assertion does not run on the Windows leg.
- **Fix:** `V-29-59-02` opened in §5.2 with its own question, direction, live count (1 of 2 matrix legs unasserted), reason and named remedy. A skip is a residual, never an absence.
- **Files modified:** `docs/audit/29-round8-residuals.md`
- **Commit:** `0ad875a`

### Harness premises asserted and found FALSE

Two, both caught before they could produce a false result:

1. **The word-level fail-closed invariant** (above) — asserted, disproven on the first run, replaced with a true and checkable one.
2. **An exit-code measurement that was measuring the wrong process.** The first end-to-end parity check reported `parity exit on planted clone = 0` while the very same output showed `BUILD PARITY FAILED` and named `hooks/guard.js`. `$?` after a `( cd … && npm run … | tail )` pipeline is `tail`'s status, not npm's. Re-measured with the command's output redirected and `$?` taken directly: **exit 1**. The contradiction between the message and the code is what exposed it; a check that only read the exit code would have recorded a false green for the fix to a false-green defect.

### Coverage moved, not dropped

Recorded as `V-29-59-01` and `V-29-59-02` in `docs/audit/29-round8-residuals.md` §5, each with an owner, a direction, a live count derived by the command printed beside it, and its wiring.

`V-29-59-01` needs highlighting because its obvious owner is the wrong one. A `.js` hand-edited in the working tree while its `.ts` is unchanged is no longer this gate's finding — and `npm run check:build-parity` does **not** inherit it, because the script's own build overwrites the hand edit before its diff runs. Measured on the real tree rather than reasoned:

```
$ git status --porcelain -- hooks scripts install
 M hooks/guard.js                       <- the only mechanism that saw it
$ node scripts/freshness.js | tail -1
All build outputs fresh: 48 committed .js file(s) match a rebuild of their sources.    exit 0
$ npm run check:build-parity | tail -1
Build parity: no tracked build output moved when tsc ran.                              exit 0
$ git status --porcelain -- hooks scripts install
(empty)                                 <- the build restored the faithful output
```

The real owner is the **commit boundary**: `git status` reports the edit to the person who made it, and the freshness gate reds the moment the edit is committed, which is the case the discrimination pair proves. Continuous integration has no subject for this id at all, because a fresh checkout's working tree equals HEAD by construction. Live count on this tree: **0**.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired component was introduced.

## Threat Flags

None. This plan adds no network endpoint, no auth path and no schema change. The one new external-process surface is `git`, invoked read-only through `spawnSync` with an argument vector (never a shell string), matching the precedent already set by `scripts/check-diff-disposition.ts`. Every threat in the plan's register carries a `mitigate` disposition and each is implemented: T-29-59-01 (Task 1), T-29-59-02 (Task 2 discrimination pair), T-29-59-03 (the refusal case asserts the absence of the verdict line as well as the exit code), T-29-59-04 (two arms, two verdicts, shown different), T-29-59-05 (V-29-59-01/02), T-29-59-06 (one script, `grep -c 'git diff'` in the workflow is 0), T-29-59-07 (`.temp/` ignored in the same commit; the parent's status asserted clean). T-29-59-SC holds: no package was installed and `package-lock.json` is byte-unchanged.

## What this plan does NOT claim

- It does **not** claim the gate proves the committed `.js` is *correct*. It proves the committed `.js` is a build of the committed `.ts`. What the source does is a different question and no gate here reaches it.
- It does **not** claim the parity assertion runs everywhere. It runs on ubuntu, and `V-29-59-02` counts the leg it does not run on.
- It does **not** claim the working-tree question is now owned by a gate. `V-29-59-01` names a boundary, not a gate, and names the non-owner explicitly.
- It does **not** claim the earlier phases' verification records are repaired. Every `<automated>` block in this phase that quoted `npm run build && npm run freshness` as build-parity evidence ran against the vacuous gate; that evidence is retroactively worth nothing and nothing here changes that. What changes is that the same command is now load-bearing from this commit forward.

## Self-Check: PASSED

Every file this summary names exists on disk (`scripts/freshness.ts`, `scripts/freshness.js`,
`scripts/freshness.test.ts`, `package.json`, `.github/workflows/ci.yml`, `.gitignore`,
`docs/audit/29-round8-residuals.md`, this file), and every commit hash it quotes is reachable
(`7cebe32`, `7e42b3d`, `0ad875a`). `V-29-59-01` and `V-29-59-02` are present in the residuals file.
