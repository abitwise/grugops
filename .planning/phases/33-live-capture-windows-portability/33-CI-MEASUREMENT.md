# Phase 33 — CI measurement (CAP-02, plan 33-09)

CAP-02's bar is BOTH matrix legs of `.github/workflows/ci.yml` exiting 0 on a pushed run, read from
that run's own conclusion fields (D-13). Nothing on one developer machine answers it. This document
holds the two halves the plan separates: the **pre-push inventory** (Task 1 — every workflow command
run locally, in the workflow's order, with its exit status; and the per-class attribution of the
research inventory's failure classes to the plans that addressed them, with the classes no local
evidence can answer named as such) and, once a human has authorized the push, the **pushed run**
(Task 3 — the run id, the sha, both legs' conclusions, both legs' totals, the per-leg slowest test,
and the ledger dispositions the run answers).

Nothing here is a CI conclusion until a run id is written beside it. A class this document marks
as addressed by a plan is addressed by a mechanism reproduced on this host; it is CLOSED only when
the pushed run says so.

## Part 1 — the pre-push inventory (Task 1)

**Tree under measurement:** `e2f48fa3` (the dispatch base; 54 commits ahead of `origin/main` at
`22c66700`, which is the sha of the research inventory's baseline run) plus one working-tree file
this task adds, `docs/audit/29-style-dispositions/33-09.md` (see § 1.3). The sha the push will carry
is this task's commit, which contains exactly that file and this document.

**Host:** darwin/arm64, node v24.12.0, npm 11.7.0. The CI matrix runs node 22 (`setup-node`,
`node-version: 22`) on `ubuntu-latest` and `windows-latest`; the node major differs from this host
(the 33-02 RangeError diagnosis turns on that difference: node 22's `rmSync` is JS-recursive, node
24's is C++).

**Date:** 2026-09-20.

**Prohibition honoured:** the bare default test script (`npm test`, which is `vitest run` with the
live claude-CLI lane collected) was not run. The vitest command below is the workflow's own, with the
`scripts/e2e` exclusion.

### 1.1 Every workflow command, in the workflow's order, with its local exit status

The workflow has two legs. A step marked `ubuntu` runs only on `ubuntu-latest`; `windows` only on
`windows-latest`; `both` on each. Transcripts are in the executor's scratch directory; the headline
figures are copied here verbatim from each transcript.

| # | Workflow step | Leg | Command (as the workflow runs it) | Local exit | Headline numbers |
|--:|---|---|---|--:|---|
| 1 | Install | both | `npm ci` | 0 | `added 48 packages, and audited 49 packages in 1s` (the committed lockfile; the audit line reports `4 vulnerabilities (2 moderate, 2 high)` in dev-only deps — informational, the workflow runs no `npm audit`) |
| 2 | Freshness gate before any build | ubuntu | `npm run freshness` | 0 | `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.` |
| 3 | Build and working-tree parity assertion | ubuntu | `node scripts/check-build-parity.js` | 0 | `PASS Build parity: tracked build outputs that moved when the build ran: 0 findings over 69/69 elements` |
| 4 | Build | windows | `npm run build` | 0 | `tsc` exit 0; `git status --short -- '*.js'` empty afterwards (no committed output moved) |
| 5 | Typecheck | both | `npm run typecheck` | 0 | three targets (`tsc --noEmit`, `tsconfig.tests.json`, `tsconfig.fixtures.json`), 4.07 s wall |
| 6 | Platform shape corpus, exit-code contract, directory identity | both | `node scripts/check-platform-shapes.js` | 0 | `HOST CAPABILITIES (3)`: chmod 000 enforcement present, signal-terminated child present, control byte in a path component present; `SKIPPED SHAPES (0)`; `ALL CHECKS PASSED` |
| 7 | Windows shape remainder is recorded, not silent | windows | `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS=1 node scripts/check-platform-shapes.js` | **1** | `SKIPPED SHAPES (0)` then `FAIL GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS is set and the skip list is EMPTY.` — **the designed answer on a host that constructs every shape.** This step exists to refuse a windows leg that reports an empty remainder; darwin has a primitive for every corpus shape, so an empty list here is true and the gate's refusal of it under the windows-only flag is correct. The windows answer (a non-empty remainder: the FIFO at each position plus any absent host capability, per 33-05) is **UNMEASURED LOCALLY**. |
| 8 | Vitest (e2e lane excluded) | both | `npx vitest run --exclude '**/scripts/e2e/**'` | 0 | `Test Files 78 passed (78)` · `Tests 5340 passed \| 2 skipped (5342)` · `Duration 484.36s` (tests 471.24 s); 0 `Test timed out`, 0 `Hook timed out`, 0 `RangeError` lines in the transcript; 8m05s wall |
| 9 | Freshness gates + repo gates (one step, 23 commands, stops at the first non-zero) | ubuntu | see the 23 rows below | 0 | every command exit 0 |

The ubuntu-only step, command by command (the workflow runs them as one `run:` block; a non-zero
exit anywhere fails the step):

| # | Command | Local exit | Headline |
|--:|---|--:|---|
| 9.1 | `npm run freshness` | 0 | 69 committed `.js` fresh |
| 9.2 | `npm run freshness:catalog` | 0 | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` |
| 9.3 | `npm run freshness:context` | 0 | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` |
| 9.4 | `npm run freshness:adapters` | 0 | `17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` |
| 9.5 | `npm run freshness:skill-twins` | 0 | `7 twin(s) compared in .claude/skills, 0 byte difference(s)` |
| 9.6 | `npm run freshness:guarantees` | 0 | `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` |
| 9.7 | `npm run freshness:hook-manifest` | 0 | `2 decider(s), 26 module hash(es) match a fresh derivation.` |
| 9.8 | `npm run generate:adapters` | 0 | — |
| 9.9 | `git status --porcelain -- .claude/agents/` | 0 | empty |
| 9.10 | `test -z "$(git status --porcelain -- .claude/agents/)"` | 0 | — |
| 9.11 | `node scripts/check-foundation-guards.js` | 0 | `ALL CHECKS PASSED` (last PASS line: dual-path equivalence) |
| 9.12 | `node scripts/check-kit-refs.js` | 0 | `invariant marker present at all 26 marker sites (2 named + 24 derived adapters)`; `ALL CHECKS PASSED` |
| 9.13 | `node scripts/check-public-docs-vocabulary.js` | 0 | `AUDIT-02: 11 public document(s) carry zero retired vocabulary` |
| 9.14 | `node scripts/check-audit-register.js` | 0 | `AUDIT-01 completeness: … 36 counted register row(s) set-equal in both directions to 36 derived file(s)` |
| 9.15 | `node scripts/check-claim-anchors.js` | 0 | `47 registry row(s) parsed from 47 claim-heading-shaped line(s)` |
| 9.16 | `node scripts/check-banned-claims.js` | 0 | `120 derived document(s) … 22 pinned claim literal(s)`; `ALL CHECKS PASSED` |
| 9.17 | `node scripts/check-imperative-lexicon.js` | 0 | `LANG-01: 76 Technical Name(s) DERIVED from the kit` |
| 9.18 | `node scripts/check-diff-disposition.js` | **1 before § 1.3, 0 after** | before: `FAIL diff disposition — changed watched file(s): 21 finding(s) over 39 elements`, every finding `README.md`; after: `PASS diff disposition — changed watched file(s): 0 findings over 39/39 elements` |
| 9.19 | `node scripts/check-nul-bytes.js` | 0 | `2407 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte` (2408 with the new disposition file staged — re-run after § 1.3, also 0) |
| 9.20 | `node scripts/check-residual-citations.js` | 0 | `5 path claim(s) across 2 published row(s), every one a tracked file` |
| 9.21 | `node scripts/check-flip-manifest.js` | 0 | `every declared locator resolves in the pre-capture state: 62 flip row(s), 10 correction row(s), 2 exemption anchor(s)` |
| 9.22 | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 | `ALL CHECKS PASSED` |

The plan's own verify chains were also run exactly as written: `npm run build && npm run
check:build-parity && npm run typecheck` exit 0 (parity `0 findings over 69/69 elements`);
`node scripts/check-platform-shapes.js && npm run check:nul-bytes && npm run check:banned-claims &&
npm run check:diff-disposition` exit 0 (four `ALL CHECKS PASSED` lines).

### 1.2 Suite totals beside the research inventory

| Leg / host | Test files | Tests | Duration | Source |
|---|---|---|---|---|
| ubuntu-latest, run `35394268365` (baseline, sha `22c66700`) | 3 failed / 72 passed (75) | **12 failed** / 5237 passed / 1 skipped (5250) | 846.63 s | 33-RESEARCH § Leg totals |
| windows-latest, run `35394268365` (baseline) | **23 failed** / 52 passed (75) | **198 failed** / 5049 passed / 3 skipped (5250) | 1515.72 s | 33-RESEARCH § Leg totals; re-derived from the job log by this task: 198 `FAIL` entries across 23 files, totals reconcile |
| this host (darwin/arm64, node 24), tree `e2f48fa3` + § 1.3 | 78 passed (78) | **0 failed** / 5340 passed / 2 skipped (5342) | 484.36 s | § 1.1 row 8 |

The denominators moved between the baseline and this tree: 75 → 78 files (33-01's fixture and
runner tests, 33-03's `posix-path.test.ts`, 33-07's `check-flip-manifest.test.ts`) and 5250 → 5342
tests (the cases plans 33-01 through 33-08 added; every plan's SUMMARY records its own delta). The
pushed run's totals are read against **5342 / 78**, not against 5250 / 75.

The DASH-04 case in `scripts/board-watch-live.test.ts` recorded in `deferred-items.md` (a wall-clock
`fs.watch` miss on 2026-09-19) was green on this run, as on every full-lane run since. It stays open
until the pushed run measures it on both legs.

### 1.3 The one red in the chain, and its remedy

`node scripts/check-diff-disposition.js` (row 9.18) exited 1 on the dispatch-base tree with 21
findings, all in `README.md`, none frozen. Three commits since the gate's recorded base
(`4d2b8f07`) changed the README and never ran the gate — the ubuntu leg has failed at the vitest
step on every run since 2026-07-15, so the gate that runs after it was never reached on CI:

| Carrier | Findings | What the gate had already admitted |
|---|--:|---|
| `6a604a6c` release: v2.1 version bump (2026-09-18) | 1 | the added `2.1.0` clause (registry anchor C-28-004, registry edited in the same commit); the removed `0.1.0` side owed a row |
| `22c66700` docs(readme): clone-then-install recipe (2026-09-18, = `origin/main`) | 8 | the reworded anchor sentences (C-28-005/006, same-commit registry edit); the two removed sides, two code-block lines and the four new sentences owed rows |
| `52377a7a` docs(readme): example commands per skill (2026-09-19, quick task 260919-007) | 12 | nothing — no clause is a registered claim |

Remedy, exactly the one the gate prints: a disposition file,
`docs/audit/29-style-dispositions/33-09.md`, with 20 rows covering the 21 clauses (one row carries
both sides of the replaced code-block line), written under this plan's number so the trail records
when the obligation was discharged (precedent: `30-10.md`). Not done: touching `README.md`, moving
the base, narrowing the corpus, loosening the comparison. After the file: exit 0, `0 findings over
39/39 elements`; the element count is unchanged from `32.1-03.md`'s capture, so the comparison saw
the same corpus and the findings closed by rows, not by a narrower view.

`deferred-items.md`'s `check:diff-disposition` entry and WINDOWS.md row 225 (the lint-warning 33-07
appended for this red) record the same finding; row 225 is marked fixed through the ledger tool in
this task's commit (command quoted in the plan's SUMMARY), never by hand. The row's description says
"introduced by commit 52377a7a"; the measurement above corrects that to three carriers, of which
`52377a7a` is the largest.

### 1.4 Per-class attribution — what each plan closed, and the local evidence

The research inventory is per file (23 windows files, 3 ubuntu files) with a dominant class per
file, plus eight classes it found that CONTEXT did not name. The attribution below is per file, with
every class inside the file named, the plan that changed the site, and the evidence that exists on
THIS host. Three statuses are used, and the distinction is the point of the table:

- **mechanism reproduced on darwin** — the plan reproduced the windows failure's mechanism on this
  host (by handing the predicate `win32.sep`, making a shim unreachable, forcing a shape absent,
  reading node's own `os.tmpdir` source, and so on), fixed it, and the fix is a POSIX no-op by
  construction. The windows outcome is still **UNMEASURED LOCALLY**; this is the strongest local
  evidence available, not a measurement.
- **UNMEASURED LOCALLY** — a plan changed the site and the case is green here, but the windows
  mechanism was not reproducible on this host (a privilege, a runtime version, an NTFS timing).
- **NOT ADDRESSED** — no plan in this phase changed the site. If the baseline log's mechanism
  holds, the case stays red on the pushed run; that red is the measurement, not a surprise.

The baseline per-file counts were re-derived by this task from the windows job log (`gh run view
--job 105759397857 --log-failed`, the `Failed Tests 198` section, one entry per `FAIL` line) and
agree with the research census file for file.

**Windows leg — 23 files, 198 failures:**

| File | Baseline | Class(es) inside the file | Plan | Local evidence | Windows status |
|---|--:|---|---|---|---|
| `scripts/check-banned-claims.test.ts` | 64 | one class: scan-set dedupe key host-separated (`derived 121, expected 120, overlap 1`) | 33-03 | `scanKey(rel, separator)` at key formation; RED 4/3 with an identity body, GREEN 131/131; live pin 120 unchanged | mechanism reproduced on darwin (`win32.sep` handed to the key formation) |
| `scripts/context-io.test.ts` | 30 | **(a)** 20 cases: FIFO at note / ledger / config positions (MSYS `mkfifo` exits 0 and stages nothing), the CR-24 plant table, `chmod 000` premises, the character-device premise | 33-05 | 19 FIFO sites through `stageShapeOrSkip("FIFO")`, 3 chmod premises through the measured branch; `FORCE_ABSENT` drove 19 FIFO rows and the chmod rows here | mechanism reproduced on darwin (fake `mkfifo`; seam-driven skip arms) |
| | | **(b)** 10 cases: `trustedRepoRoot` asserted against the POSIX literal `/tmp/some-project` (:4005, :4237 — `expected 'D:\tmp\some-project' to be '/tmp/some-project'`, 2 cases) and two `drive()` cases whose child driver produced no output (`BOUND: the ancestor walk is limited`, `the published step limit …` — mechanism not established from the log); 8.3 short-name vs long-name `runneradmin`/`RUNNER~1` in the tier-0 canonicaliser cases (:11329, :11393, :11404, 3 cases); the R-31-19-07 symlink-cell re-measurement (:8454); CONTROL 5b marker-less home (:10701, an assertion given `null`); the home-walk premise (:15800) | **none** — 33-05's SUMMARY hands these to "33-06 or later"; 33-06 measured them as context-io's, not install's, and did not take them | none — `git log 22c66700..HEAD -- scripts/context-io.test.ts` shows only 33-05's two commits, and the literals and rungs above are unchanged on this tree | **NOT ADDRESSED — 10 cases expected to stay red** |
| `scripts/board-read.test.ts` | 15 | 11 `chmod 000` premises (incl. the PATH-authority case), 2 control-byte fixture roots (32.1-12 / 32.1-13), 2 × 5 s timeout (`bounded above MAX_WALK_ENTRIES`) | 33-05 (13), 33-02 (2) | `denyModeOrSkip` at nine sites, `stageNameOrSkip` at both control-byte helpers, 18 chmod rows driven under the seam; `testTimeout: 180_000` | mechanism reproduced on darwin (skip arms driven); the two timeouts' true windows durations are UNMEASURED LOCALLY |
| `hooks/guard.test.ts` | 13 | one class: FIFO at each manifest position (the `could not be read (ENOENT)` arm behind an MSYS `mkfifo` that stages nothing — not a home refusal) | 33-05 | fake `mkfifo` against the pre-plan test reproduces the CI's exact text; current test prints the row and passes; 275/275 | mechanism reproduced on darwin |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` | 12 | **(a)** 10 cases: 6 × 5 s timeout; GREEN 4 `RangeError` (node 22's JS-recursive `rmSync` in the teardown); 2 TS diagnostic-code `[]` (host-separator `fileName` filter); `.temp` scandir ENOENT (POINT 7) | 33-02 | bounds; level-by-level teardown with the overflow reproduced like-for-like under `--stack-size`; SourceFile-identity filter; ENOENT-tolerant premise; 385/385 | UNMEASURED LOCALLY for GREEN 4 (node 24 `rmSync` is C++; this platform refuses at 477 levels; the windows build of ~7 600 levels inside 180 s is the open assumption); the rest mechanism reproduced |
| | | **(b)** 2 cases: POINT 2 (:8871) asserts `included.has(join(root, rel))` where `included` is the Program's forward-slashed `fileName` set — a test-internal separator comparison (`e2e/uat/a.uat.spec.ts is in the derived set and NOT in the program`); GREEN 1 (`a spec the parser cannot finish exits 2 …`) expected `could not be PARSED (Maximum call stack size exceeded)` and got `(the program did not include it)` — in the module, `parseFaults` is keyed by the compiler host's `fileName` (:1359) and looked up with `join(repoRoot, rel)` (:3237), so on a backslash host the recorded fault is never found and the fallback sentence is printed | **none** — 33-02's SUMMARY records the module and its `.js` twin as unchanged, and `git diff 22c66700..HEAD` touches neither case | none — mechanism read from the source, not reproduced here (a POSIX `join` spells the same as the compiler) | **NOT ADDRESSED — 2 cases expected to stay red** |
| `scripts/freshness.test.ts` | 8 | one class: the gate's `spawnSync("npx", ["tsc"])` never started a compiler on windows (`npx.cmd` without a shell); Test 1 "failed" in 282 ms | 33-06 | the compiler is `typescript/lib/tsc.js` under `process.execPath`; the silence reproduced here with `npx` unreachable (same sentence, 0.18 s); Test 3 now demands the compiler's own diagnostic; 11/11 with and without `.temp` | mechanism reproduced on darwin; a compile that RUNS on windows and refuses for a reason of its own would now print that diagnostic — that possibility is UNMEASURED LOCALLY |
| `scripts/board-watch.test.ts` | 8 | 7 × `armedRel` test-side `relative()` vs POSIX literals (`.grugops\context`), 1 × SIGINT child `null` exit | 33-04 | `toPosix` on `armedRel` and the `/plans` premise (8 red with the windows spelling and no normalizer, 73/73 through it); `expectEndedBySigint` with both-arm cases | mechanism reproduced on darwin (separator); the signalled-child arm is asserted in both directions here but delivered only on windows — UNMEASURED LOCALLY |
| `scripts/board-model.test.ts` | 8 | golden projection location token (2), mutation mirror `fileName === target` never applying (6) | 33-04 | `projectLocations` / `sameSource`, separator-parameterized; identity bodies red 2/2, restored 181/181 | mechanism reproduced on darwin |
| `install/install.test.ts` | 8 | 3 separator-only `KIT=` comparisons (`RUNNER~1` on both sides); 2 `ln -s` fixtures that left a copy; 1 `TMPDIR` never read on win32; 1 ESM import of a `D:\` specifier (`ERR_UNSUPPORTED_ESM_URL_SCHEME`); 1 CRLF `'2.1.0\r'` | 33-06 (and 33-05's VERSION LF pin for the last) | `expectMaterializedKit` canonical both sides; `stageSymlinkOrSkip` (3 arms driven); `TMPDIR`+`TMP`+`TEMP`; `pathToFileURL`; `.trim()`; 136 passed / 1 pre-existing skip | mechanism reproduced on darwin (the `D:\` refusal, the `/var` vs `/private/var` collapse); the symlink privilege on the runner is UNMEASURED LOCALLY (a lost privilege prints SKIPPED rows, not reds) |
| `scripts/check-kit-refs.test.ts` | 7 | one class: the gate published `.claude\agents\…` / `agent-factory\config\…` | 33-03 | `relKey = toPosix(join(rel))`; authority spelling backslashes here reds 29/35; restored 35/35 with byte-identical output | mechanism reproduced on darwin |
| `scripts/uat-gate-exit-contract.test.ts` | 4 | the literal `SKIPPED SHAPES (0):` pin (windows' correct remainder is non-empty); the REQUIRE_SKIPS unconditional exit-1 pin; the `mkfifo` census | 33-05 | printed remainder asserted equal to `derivedRemainder()` (count and multiset, mutation-checked); REQUIRE_SKIPS as a relationship; syntax-tree census 0 test-side / 1 corpus | mechanism reproduced on darwin (seam case on a non-empty list) |
| `scripts/check-platform-shapes.test.ts` | 4 | 2 × 5 s timeout (the label-agreement pair — no disagreement ever existed; re-measured 3644 / 3661 ms); FIFO-row-absent CONTROL; signals-itself MIRROR on a host without signal delivery | 33-02 (2), 33-05 (2) | bounds; rows-plus-skips CONTROL with the seam arm; the mirror gated on the measured `signal-terminated child` capability | mechanism reproduced on darwin for the two 33-05 cases; the timeouts' windows durations UNMEASURED LOCALLY |
| `scripts/validate.test.ts` | 3 | the 26-file tracked-TypeScript census (`join` vs `git ls-files` spelling); 2 × 5 s timeout (:2842 planted-reader loop 3367 ms here, :2281 import-split census 1612 ms here) | 33-04 (1), 33-02 (2) | `scannedName` through the normalizer, both directions, per-side floor, nested 26 = 26, RED 1/140 on an identity body; bounds | mechanism reproduced on darwin (census); timeouts UNMEASURED LOCALLY |
| `scripts/check-nul-bytes.test.ts` | 3 | a newline-named fixture windows refuses (`a<newline>b.md`); 13 CRLF checkouts of unpinned extensionless / `.svg` / `.jsonl` files under `core.autocrlf=true` (2 cases) — NOT an empty tracked set | 33-05 | `stageNameOrSkip`; 14 derived `.gitattributes` pins plus a case that re-derives the unpinned set on every host (reds naming `NOTICE` when its pin is removed) | mechanism reproduced on darwin for the fixture; the CRLF checkout itself is UNMEASURED LOCALLY (this host does not autocrlf) — the pin set is derived, so the windows checkout is the test |
| `scripts/board-dashboard.test.ts` | 3 | 2 × SIGINT child `null` status; `no/such/tree` fragment vs a host-joined path | 33-04 | `expectEndedBySigint` at both sites; the absent-tree fixture built under `realpath(tmpdir())` and asserted whole | separator: mechanism reproduced; signalled arm UNMEASURED LOCALLY |
| `scripts/frontmatter.test.ts` | 2 | `spawnSync /usr/bin/ruby ENOENT` in the two D-59 `runLoader` callers (not the :7857 site RESEARCH cites, which already skipped) | 33-05 | file-scope `RUBY` with `probeLoader`; `YAML_ORACLE_RUBY=grugops-no-such-interpreter` gives 294 passed, 0 ENOENT, 14 SKIPPED lines | mechanism reproduced on darwin |
| `scripts/check-foundation-guards.test.ts` | 2 (1 `FAIL` entry + 1 `Hook timed out in 10000ms` `beforeAll`) | the hook timeout; `(o-prefix) a root that is a string PREFIX of a sibling path rewrites nothing` — the refusal echoes the preset as a JSON string (`"C:\\Users\\…\\mirXTRA\\deep"`, doubled backslashes) and the assertion looks for the host-spelled single-backslash path | 33-02 (hook) | `hookTimeout: 120_000`; the file runs 300/300 here with no hook-timeout line | hook: mechanism understood, windows duration UNMEASURED LOCALLY. **o-prefix: NOT ADDRESSED — 1 case expected to stay red** (no plan changed the case; on darwin the echoed path carries no backslash so the assertion cannot see it) |
| `scripts/nonblocking-reader-parity.test.ts` | 1 | 5 s timeout (`an UNTRACKED third implementation …`) | 33-02 (bound); 33-05 also routed its FIFO through the corpus constructor | bounds; 1 parity FIFO row driven under the seam | UNMEASURED LOCALLY (duration) |
| `scripts/generate-guarantees.test.ts` | 1 | `+0 not to be +0` = a plain exit 0 because win32 `os.tmpdir()` never reads `TMPDIR` | 33-04 | `TMPDIR`, `TMP`, `TEMP` planted together with the absence asserted as a premise; read from node's own `os.tmpdir` source | mechanism established from node's source; not discriminable on this host (POSIX honours `TMPDIR`) — UNMEASURED LOCALLY |
| `scripts/coordinator-resolution-precheck.test.ts` | 1 | the anchor `/^materialized kit path: \/.+$/m` demanded a leading `/` | 33-06 | stable-fragment anchor plus a canonical path comparison over the `--keep-scratch-target` run; the script byte-unchanged | mechanism reproduced on darwin (Case 2b mutation shows the identity collapse) |
| `scripts/check-uat-oracles.test.ts` | 1 | `'scripts\compactor.test.ts'` vs the POSIX literal | 33-04 | `toPosix` on `where` | mechanism reproduced on darwin |
| `scripts/board-tracer.test.ts` | 1 | `/no/such/path` POSIX-absolute literal | 33-04 | constructed absent-tree fixture | mechanism reproduced on darwin |
| `hooks/admission-guard.test.ts` | 1 | FIFO at the config path (empty output, no deny envelope) | 33-05 | `stageShapeOrSkip("FIFO")` with the row; 1 admission row driven under the seam | mechanism reproduced on darwin |

**Windows tally of the two statuses that matter for the pushed run:** 185 baseline cases sit in
files whose windows mechanism was reproduced on this host or is UNMEASURED LOCALLY behind a plan's
change; **13 baseline cases (10 in `scripts/context-io.test.ts`, 2 in
`scripts/runnable-ref/uat-spec-integrity.test.ts`, 1 in `scripts/check-foundation-guards.test.ts`)
are NOT ADDRESSED by any plan in this phase.** If the baseline log's mechanisms hold, the windows
leg's `Vitest (e2e lane excluded)` step will report those 13 (3 files) red, and the leg's conclusion
will be `failure`. That is the expected shape of the measurement, written down before the push so
the human authorizing it knows what the run decides: whether the 185 close as their reproductions
predict, and whether the 13 are the whole residue.

**Also unmeasured locally, by construction (no plan can measure these here):**

- `scripts/board-watch-live.test.ts` (WINDOWS.md row 186): green here and on the baseline windows run
  (33-RESEARCH § "Row 186 is already measured — and it is GREEN", six passing cases). D-16 keeps it
  unconditional; RESEARCH A5 notes its timing now sits behind different neighbours. The pushed run
  is its confirming measurement.
- The `testTimeout: 180_000` / `hookTimeout: 120_000` bounds (33-02, D-14): a choice above the
  85 568 ms measured floor. The pushed run's slowest test on each leg is the falsification RESEARCH
  asked for; recorded in Part 2.
- The windows `SKIPPED SHAPES` remainder under `REQUIRE_SKIPS` (row 7 above) and the `HOST
  CAPABILITIES` block on windows-latest.
- Whether the runner still holds `SeCreateSymbolicLink` (the directory-symlink fixtures in
  `scripts/context-io.test.ts` recorded in `deferred-items.md` are unguarded; green on the privileged
  runner, red without it).

**Ubuntu leg — 3 files, 12 failures:**

| File | Baseline | Class(es) | Plan | Local evidence | Status |
|---|--:|---|---|---|---|
| `scripts/runnable-ref/uat-spec-integrity.test.ts` | 9 | 5 × 5 s timeout; `.temp` scandir ENOENT on a fresh runner plus its downstream vacuity-floor assertions | 33-02 | bounds; the ENOENT-tolerant POINT 7 premise, green with `.temp` absent (`rm -rf .temp`, 385 passed, 0 ENOENT) and present, red on a planted entry | closed on this POSIX host by the same mechanism the runner has; the ubuntu measurement is the pushed run's |
| `scripts/check-platform-shapes.test.ts` | 2 | the label-agreement pair, both 5 s timeouts | 33-02 (bound); 33-05 re-measured 3644 / 3661 ms | green under the bound | as above |
| `scripts/validate.test.ts` | 1 | `:2842` planted-reader loop, 5 s timeout (3367 ms here) | 33-02 | green under the bound | as above |

Every ubuntu class has a closure whose mechanism runs on this POSIX host. No ubuntu class is NOT
ADDRESSED. The chain in § 1.1 is the ubuntu leg's full step list and it is green end to end,
including the gate that was red at dispatch (§ 1.3).

**Research's eight "new classes not in CONTEXT", each located above:** 1 hard-coded `/usr/bin/ruby`
→ frontmatter (33-05); 2 8.3 short-name → context-io **(NOT ADDRESSED)**, disproven for install
(33-06); 3 drive-letter absolute → context-io `/tmp/some-project` **(NOT ADDRESSED)**, board-tracer
(33-04); 4 temp-dir `tsc` rebuild → freshness (33-06); 5 control bytes in fixture names →
board-read, check-nul-bytes (33-05); 6 `chmod 000` no-op → board-read, context-io (33-05); 7
POSIX-only remainder expectations → uat-gate-exit-contract (33-05); 8 `RangeError` and the TS
diagnostic codes → uat-spec-integrity (33-02). Not in research's eight but measured above: the
`parseFaults` key spelling and the POINT 2 test-internal comparison in uat-spec-integrity, and the
JSON-escaped echo in the foundation-guards o-prefix case — all **NOT ADDRESSED**.

### 1.5 What the pushed run will decide, stated before the push

1. **Ubuntu leg:** expected green on every step. Every baseline class is closed by a mechanism that
   runs here, the gate chain is green end to end, and the diff-disposition red is dispositioned. A
   red there is a regression or a runner-only fact (node 22, a fresh `.temp`-less checkout) and is
   filed as the round's finding.
2. **Windows leg:** expected red at the `Vitest (e2e lane excluded)` step with 13 cases across
   `scripts/context-io.test.ts` (10), `scripts/runnable-ref/uat-spec-integrity.test.ts` (2) and
   `scripts/check-foundation-guards.test.ts` (1), and every other baseline file green. A windows
   count ABOVE 13, or a red in a file other than those three, is a reproduction that did not
   transfer and is this round's finding; a count BELOW 13 is measured, not assumed, and the
   surviving cases are the next round's inventory either way.
3. **CAP-02 verdict:** with any windows red, CAP-02 is NOT met on this run (D-13: both legs). The
   phase's four-round gap-closure cap governs what follows; the 13 named cases are the input to the
   next round, and no platform conditional will be added to any of them.

The 13 NOT ADDRESSED cases are recorded in `deferred-items.md` under this plan, addressed to the
CAP-02 gap round.

### 1.6 Ledger changes made in this task, through the tool

`.planning/WINDOWS.md` is a frontmatter counter block, a markdown table and a JSON appendix; every
change below was made with the ledger tool and the three representations were checked to agree
afterwards (`windows status`: open 199, waived 3, fixed 26, total 228; the table has 228 rows).

```
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows fixed 225
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/context-io.test.ts --line 4005 --description "33-09: ten windows reds NOT ADDRESSED by any Phase 33 plan — …"
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/runnable-ref/uat-spec-integrity.ts --line 3237 --description "33-09: two windows reds NOT ADDRESSED — parseFaults keyed by the compiler host fileName …"
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/check-foundation-guards.test.ts --line 10824 --description "33-09: one windows red NOT ADDRESSED — the o-prefix case …"
```

Row 225 (the diff-disposition red) is `fixed` with § 1.3 as the evidence. Rows 226–228 are the
three NOT ADDRESSED files, `open`, so the ship gate sees them; the pushed run measures them and the
gap round disposes them. Rows 186 and 193 are untouched here — they are Task 3's, and only on a
green run.

After these edits the six test files that read the ledger, the disposition directory or the phase's
deferred items (`check-flip-manifest`, `uat-gate-exit-contract`, `checkpoints`,
`check-foundation-guards`, `validate`, `model-tiers`) were re-run: 6 files, 776 passed, exit 0; and
`check-flip-manifest.js`, `check-diff-disposition.js`, `check-nul-bytes.js` re-run: all
`ALL CHECKS PASSED`.

## Part 2 — the pushed run (Task 3)

### 2.1 The push and the run

The blocking checkpoint (Task 2, `gate="blocking-human"`) was answered by the human with
"push approved" (verbatim), naming `d9bd4315` as the sha. Before the push: `git rev-parse HEAD` =
`d9bd43156e71b60591fd1339b26dec22fdfc7a94`, working tree clean, `origin/main` = `22c66700` (the
baseline run's sha) and an ancestor of HEAD, so the push was a fast-forward carrying 55 commits.

```
2026-09-20T08:31:37Z  git push origin main
To https://github.com/abitwise/grugops.git
   22c66700..d9bd4315  main -> main
```

`git log --oneline origin/main..HEAD` is empty afterwards. One push, no force, no tags. Plan 33-10's
D-05 precondition — the sha under test is pushed before any live-capture go is asked for — is met by
this sha.

**The run, read from its own metadata** (`gh run view 35499800942 --json
databaseId,headSha,status,conclusion,createdAt,updatedAt,jobs`):

| Field | Value |
|---|---|
| run id | `35499800942` (workflow `ci`, branch `main`) |
| head sha | `d9bd43156e71b60591fd1339b26dec22fdfc7a94` |
| created / completed | 2026-09-20T08:31:43Z / 2026-09-20T09:04:03Z |
| run `conclusion` | **`failure`** |
| job `test (ubuntu-latest)` | id `106049412426`, `conclusion: failure`, 08:31:46Z → 08:46:47Z (**15 m 01 s**) |
| job `test (windows-latest)` | id `106049412324`, `conclusion: failure`, 08:32:01Z → 09:04:02Z (**32 m 01 s**) |

Per-step conclusions, from the same `jobs[].steps[]` array (a step is named as the workflow names
it; `skipped` on the leg it is not scoped to):

| # | Step | ubuntu | windows |
|--:|---|---|---|
| 4 | Install | success | success |
| 5 | Freshness gate before any build | success | (skipped — ubuntu only) |
| 6 | Build and working-tree parity assertion | success | (skipped — ubuntu only) |
| 7 | Build (every other leg) | (skipped) | success |
| 8 | Typecheck | success | success |
| 9 | Platform shape corpus, exit-code contract, directory identity | success | success |
| 10 | Windows shape remainder is recorded, not silent | (skipped) | **success** — `SKIPPED SHAPES (5)`, see § 2.3 |
| 11 | **Vitest (e2e lane excluded)** | **failure** | **failure** |
| 12 | Freshness gates + repo gates | **skipped — never reached** (the step after a failed step does not run) | (ubuntu only) |

**CAP-02 verdict on this run: NOT MET.** D-13's bar is both legs exiting 0; both legs' `conclusion`
fields read `failure`, both at step 11. The 23-command ubuntu gate chain (§ 1.1 row 9), green locally,
was not exercised by CI on this run because the step before it failed; its CI answer remains
unmeasured.

### 2.2 Suite totals beside the expectation written in § 1.5

Read from each leg's own vitest summary block (`gh api repos/abitwise/grugops/actions/jobs/<job>/logs`,
ANSI stripped, the `Test Files` / `Tests` / `Duration` lines quoted verbatim):

| Leg | Test Files | Tests | Duration | Timeouts |
|---|---|---|---|---|
| ubuntu-latest, run `35499800942` | **1 failed** \| 77 passed (78) | **2 failed** \| 5339 passed \| 1 skipped (5342) | 856.26 s (tests 826.62 s) | 0 `Test timed out`, 0 `Hook timed out`, 0 `RangeError` |
| windows-latest, run `35499800942` | **8 failed** \| 70 passed (78) | **31 failed** \| 5308 passed \| 3 skipped (5342) | 1857.42 s (tests 1813.76 s) | **1** `Test timed out in 60000ms` (an explicit per-test argument, § 2.4 row W-13), 0 `Hook timed out`, 0 `RangeError` |
| ubuntu baseline `35394268365` | 3 failed \| 72 passed (75) | 12 failed \| 5237 passed \| 1 skipped (5250) | 846.63 s | 8 timeouts |
| windows baseline `35394268365` | 23 failed \| 52 passed (75) | 198 failed \| 5049 passed \| 3 skipped (5250) | 1515.72 s | 12 timeouts + 1 hook timeout + 1 `RangeError` |

The denominators are the 5342 / 78 § 1.2 said to read against. Every `FAIL` entry in each leg's
`Failed Tests N` section was paired by exact `file > suite > case` key against the baseline log's 198
(the same extraction that reproduced the research census file for file — § 1.4's method, re-run on
both new logs).

**The expectation, and the delta in each direction:**

| § 1.5 expectation | Measured | Delta |
|---|---|---|
| Ubuntu leg green on every step | Red at vitest: 2 cases in `scripts/runnable-ref/uat-spec-integrity.test.ts` (`GREEN 1b`, `ORDERING`) | **A finding.** Both carry the byte-identical assertion texts they carried on the baseline (`expected +0 to be 2`; `expected -1 to be greater than or equal to 0`). They were never timeouts and never `.temp` ENOENT: the research inventory folded them into ".temp scandir ENOENT and its downstream vacuity-floor assertions", § 1.4 attributed the whole file to 33-02's `.temp` fix, and no plan's mechanism touched them. They are ubuntu-only — green on both windows runs. |
| Windows red at vitest with 13 cases in 3 files (`context-io` 10, `uat-spec-integrity` 2, `check-foundation-guards` 1), every other baseline file green | Red at vitest with **31 cases in 8 files** | The 13 predicted cases are all present, each with the assertion text § 1.4 predicted for it. **18 cases beyond the prediction**, in 5 files § 1.5 said would be green: 10 from ONE unnormalized publishing boundary (`publicDocsCorpus`'s `examples/` part), 4 in `uat-gate-exit-contract`, 2 in `context-io`, 1 in `check-platform-shapes`, 1 in `freshness`. § 2.4 labels each. |
| 185 baseline cases close as their reproductions predict | **176 closed**, 9 survived (the 9 non-predicted survivors in § 2.4); plus **9 NEW** reds on cases green at the baseline (7 in a file this phase added, 2 created by phase-33 changes) | 176 + 22 survived = 198 baseline; 22 survived + 9 new = 31. **16 of the 23 baseline files are fully green**; 7 baseline files still carry reds; 1 new file (`check-flip-manifest.test.ts`, added by 33-07) is red. |
| CAP-02 not met if any windows red | Not met — both legs red | Windows red as expected in direction; ubuntu red is the delta in the other direction. |

### 2.3 What the windows leg measured that this host could not (§ 1.4 "unmeasured by construction")

- **The windows `SKIPPED SHAPES` remainder under `REQUIRE_SKIPS` (§ 1.1 row 7):** step 10 exited 0 on
  windows with a NON-EMPTY remainder, so the gate's refusal of an empty list is the designed answer on
  both hosts. The remainder is **5 rows**: `shape="FIFO"` at `position="note path"` and at
  `position="DECIDER_MANIFEST module path"` (named pipes live in the `\\.\pipe\` namespace, `mkfifo`
  has no equivalent), plus three `position="host capability probe"` rows — `chmod 000 enforcement`,
  `signal-terminated child`, `control byte in a path component`. `HOST CAPABILITIES (3)`: all three
  **ABSENT** on windows-latest (all three `present` on ubuntu, whose remainder is `(0)`). The
  33-05 mechanism (skip rows counted in the remainder) transferred; the remainder's shape is what
  § 2.4 row W-14 pins wrongly.
- **`scripts/board-watch-live.test.ts` (WINDOWS.md row 186):** `✓ scripts/board-watch-live.test.ts
  (6 tests) 7776ms` on windows-latest and `✓ … (6 tests) 7288ms` on ubuntu-latest (baseline: 7715 /
  7291 ms). This is the confirming green measurement RESEARCH § "Row 186 is already measured" asked
  for — the second green windows run of the unconditional watcher, behind a different set of
  neighbours (A5). **Row 186 is NOT disposed here:** the plan disposes rows 186 and 193 only on a run
  whose both legs are green, and this run is red. Two green measurements of the file now exist by id
  (`35394268365`, `35499800942`) for the round that disposes it.
- **The D-14 bounds (`testTimeout: 180_000`, `hookTimeout: 120_000`):** no test on either leg hit the
  global bound and no hook timed out. The `GREEN 4` deep-directory probe, cut at 5 s on the baseline
  while reporting 33 354 ms, **PASSED on windows in 59 197 ms** — the 33-02 level-by-level teardown
  holds under node 22's JS-recursive `rmSync` on the runner (§ 1.4's open assumption, now measured
  green). The only timeout on either leg is an explicit per-test `60_000` argument (§ 2.4 W-13).
- **The runner's `SeCreateSymbolicLink` privilege:** the unguarded directory-symlink fixtures in
  `scripts/context-io.test.ts` (`deferred-items.md`) produced no red and no `SKIPPED` row, so the
  runner still holds the privilege; the R-31-19-07 SYMLINK-cell case (W-7) is red for the
  canonicaliser's reason, not for want of the link.
- **The freshness gate's compiler on windows:** the post-fix arm of the discrimination pair now RUNS
  the compiler on windows and names the planted stale `hooks/guard.js` correctly (`STALE COMMITTED
  OUTPUT: hooks/guard.js`); 7 of the file's 8 baseline reds are closed. The 8th is W-15.

### 2.4 The re-derived failure inventory — this round's finding

Per file, per class, with the assertion text read from the leg's own `Failed Tests` section (ANSI
stripped; paths spelled as the log spells them — `\\` where the log carries a JSON-escaped path).
Four labels: **not addressed (predicted)** — the case § 1.4 named NOT ADDRESSED, present with the
predicted text; **incomplete fix** — a class a phase-33 plan addressed, surviving or moved one arm
over; **new** — green at the baseline, red now; **not addressed (mis-attributed)** — a baseline case
§ 1.4 counted as closed by a plan whose mechanism never touched it. No case is a regression of a
closed mechanism: every survivor either kept its baseline text or moved to a sibling arm the fix did
not reach.

**Ubuntu leg — 1 file, 2 cases (baseline 3 files, 12):**

| # | File : line | Case | Assertion text (from the log) | Label |
|--:|---|---|---|---|
| U-1 | `scripts/runnable-ref/uat-spec-integrity.test.ts:6748` | `GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr` | `AssertionError: expected +0 to be 2 // Object.is equality` (`expect(r.status).toBe(2)`) | **not addressed (mis-attributed)** — identical text on the baseline ubuntu log (`:6691` then, `:6748` now: line drift only). `GREEN 1` (the pathological spec alone) PASSED on this leg in 9 943 ms, so the single-file refusal works on the runner; the two-file arrangement exits 0. Mechanism not established from the log — `UNKNOWN - verify`. Ubuntu-only: green on windows on both runs. |
| U-2 | `scripts/runnable-ref/uat-spec-integrity.test.ts:7089` | `ORDERING: the per-file could-not-run reason precedes reportMeasured's output` | `AssertionError: expected -1 to be greater than or equal to 0` (`mr.stderr.indexOf("e2e/uat/nested.uat.spec.ts")`) | **not addressed (mis-attributed)** — same arrangement as U-1 (`plant(mixed, "e2e/uat/clean.uat.spec.ts", CLEAN_SPEC)` beside the nested spec); the pathological file is never named on stderr because it is never refused. Identical text on the baseline (`:7032`). |

Of the baseline's 9 ubuntu cases in this file, 7 closed (the 5 timeouts, `.temp` and its downstream
floor). The `check-platform-shapes` label-agreement pair and the `validate` planted-reader loop —
the other 3 baseline ubuntu cases — are green (14 685 ms and under the bound).

**Windows leg — 8 files, 31 cases (baseline 23 files, 198):**

| # | File : line | Case | Assertion text (from the log) | Label |
|--:|---|---|---|---|
| W-1 | `scripts/check-banned-claims.test.ts:2938` | `the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list` | `expected [ …(5) ] to deeply equal []` — the five `examples/0N-*.md` files (POSIX, from `git ls-files`) uncovered. Baseline text: `expected [ …(112) ] to deeply equal []`. | **incomplete fix** (33-03). The scan publishes the five as `examples\0N-*.md`; § 2.5 (a). |
| W-2 | `scripts/check-banned-claims.test.ts:2964` | `THE MISSING DIRECTION: every scan member is a TRACKED path, and an intruder is NAMED` | `expected [ …(5) ] to deeply equal []` — intruders `examples\\01-greenfield-bootstrap.md` … `examples\\05-release-run.md`. Baseline: `expected 121 to be 120`. | **incomplete fix** (33-03) — the baseline's 64 collapsed to these 3; the dedupe KEY was normalized, the published MEMBER was not. |
| W-3 | `scripts/check-banned-claims.test.ts:2985` | `THE EQUALITY, so nothing is dropped in silence: surfaced == admitted + excluded-by-name` | `expected 2019 to be 2024` (baseline `expected 1878 to be 1990`) — the five host-spelled members are neither admitted nor excluded-by-name under their POSIX names. | **incomplete fix** (33-03), same mechanism. |
| W-4 … W-10 | `scripts/check-flip-manifest.test.ts:360, :389, :398, :428, :527, :575, :589` | the control tree `exits 0 …`; `CONVERSE 1 …`; `the same surviving cell does NOT fail the gate in the pre-capture state`; `CONVERSE 2 …`; `CONVERSE: a GAP-D1 line WITHOUT a deferral marker …`; `the flip commit is DERIVED from history …`; `CONVERSE: an explicit --range …` | Five: `expected '[derivation] manifest …' to contain 'ALL CHECKS PASSED'` with the gate's own finding in the received text: `FAIL  the "publicDocs" part's derived members differ from the manifest's listing — derived but not listed: [examples\03-ticket-to-pr.md]; listed but not derived: [examples/03-ticket-to-pr.md]`. Two: `expected 1 to be +0` (`r.status`), the same gate finding upstream. Every other rule in the gate's output is `PASS` (locators, citation rule, commit set, residual rule). | **new** (file added by 33-07 — not in the baseline's 75). Same mechanism as W-1..W-3: the gate derives the `publicDocs` part from `publicDocsCorpus`, whose `examples/` member arrives host-separated. § 2.5 (a). |
| W-11 | `scripts/check-foundation-guards.test.ts:10859` | `(o-prefix) a root that is a string PREFIX of a sibling path rewrites nothing` | `expected '  FAIL  model-assignment violation:\n…' to contain 'C:\Users\RUNNER~1\AppData\Local\Temp\…'` — received carries `"C:\\Users\\RUNNER~1\\…\\mirXTRA\\deep"` (JSON-escaped). | **not addressed (predicted)** — WINDOWS.md row 228, text as predicted. The hook-timeout half of this file's baseline red is closed (`hookTimeout`; the file ran 300 tests, no `Hook timed out` line). |
| W-12 | `scripts/check-platform-shapes.test.ts:867` | `COVERAGE: every label was WATCHED live except the two this platform cannot stage` | `expected [ 'NOT ORDINARY (answered)', …(2) ] to deeply equal [ 'NOT ORDINARY (answered)', …(1) ]` — the undriven set is `answered`, `no-answer`, **`signalled`**; `DISCLOSED_UNDRIVEN` (`:849`) pins the pair. Identical text on the baseline. | **incomplete fix** (33-05) — 33-05 gated the signals-itself MIRROR on the measured `signal-terminated child` capability (ABSENT on win32, § 2.3), so the `signalled` label is never watched there, and the COVERAGE case's disclosed set was not widened for the arm the skip removes. 3 of the file's 4 baseline reds closed (the label-agreement pair now 14 685 ms, green). |
| W-13 | `scripts/uat-gate-exit-contract.test.ts:575` | `the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40` | `Error: Test timed out in 60000ms.` — the case carries its own `}, 60_000)` argument. Baseline windows: PASSED in 56 481 ms (RESEARCH rank 2). This run: 61 989 ms. | **new**. D-14's global bound does not govern an explicit per-test argument. The gate under test, `check-diff-disposition`, is slower on this tree (its own test file: 160 084 ms vs 129 998 ms baseline on windows) — the disposition corpus grew (§ 1.3's 20 rows, 33-07's manifest). The bound, not the gate, is the defect: 60 s sat 3.5 s above the baseline measurement. |
| W-14 | `scripts/uat-gate-exit-contract.test.ts:782` | `NON-EMPTY on a platform lacking a shape, and each entry names the shape AND the platform` | `expected '  shape="chmod 000 enforcement" posit…' to contain 'shape="FIFO"'` — the per-line loop pins `shape="FIFO"` on EVERY skipped line; the remainder now carries three host-capability rows (§ 2.3). | **new**, created by 33-05's own widening of the remainder (the count is derived; the per-entry shape is still a literal). |
| W-15 | `scripts/uat-gate-exit-contract.test.ts:492` | `the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red` | `expected 0 to be greater than 0` (`audits.length`) — `scannedDocuments()` joins `readdirSync` entries with the host separator (`:450-455`) and the filter is the POSIX literal `docs/audit/`. Identical text on the baseline (`:483`). | **not addressed (mis-attributed)** — § 1.4 counted this file's 4 baseline reds as 33-05's `SKIPPED SHAPES (0)` class; 2 of the 4 were this test-internal separator class, which 33-05 did not take. |
| W-16 | `scripts/uat-gate-exit-contract.test.ts:519` | `every ordinal-claiming sentence in the scanned set appears in the tracked list` | `expected [ …(9) ] to deeply equal []` — nine `D:\\a\\grugops\\grugops\\…\\31-NN-SUMMARY.md claims "eighth" and is absent from the tracked list` entries; the key is `doc.split("/").pop()` over a host-joined path. Identical text on the baseline. | **not addressed (mis-attributed)** — same as W-15. |
| W-17 | `scripts/context-io.test.ts:4006` | `trustedRepoRoot is ONE function, and an empty CLAUDE_PROJECT_DIR names nothing` | `expected 'D:\tmp\some-project' to be '/tmp/some-project'` | **not addressed (predicted)** — row 226 (1/10). |
| W-18 | `scripts/context-io.test.ts:4238` | `trustedRepoRoot returns the TRIMMED value, as grantedBy does next door` | `expected 'D:\tmp\some-project' to be '/tmp/some-project'` | **not addressed (predicted)** — row 226 (2/10). |
| W-19 | `scripts/context-io.test.ts:6468` (via `drive` `:6309`) | `BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached` | `Error: driver produced no result for trustedRepoRoot: ` (empty stdout from the child driver) | **not addressed (predicted)** — row 226 (3/10); mechanism still not established from the log. |
| W-20 | `scripts/context-io.test.ts:7290` (via `drive` `:6309`) | `the published step limit is the one the walk has, driven from the sentence itself` | `Error: driver produced no result for trustedRepoRoot: ` | **not addressed (predicted)** — row 226 (4/10). |
| W-21 | `scripts/context-io.test.ts:8476` | `R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED` | `expected 'C:\Users\RUNNER~1\…\p31-23-r07-6G1DNt\link\proj' to be '…\kit\proj'` — the SYMLINK cell's verdict moved (the link was created: the privilege is held). | **not addressed (predicted)** — row 226 (5/10). |
| W-22 | `scripts/context-io.test.ts:10717` | `CONTROL 5b (BOTH WAVES): the same store at a MARKER-LESS home declines` | `the given combination of arguments (null and string) is invalid for this assertion` (`out.threw` is `null`) | **not addressed (predicted)** — row 226 (6/10). |
| W-23 | `scripts/context-io.test.ts:11333` | `hostDeliveredRoot() ACCEPTS a canonical, existing, version-controlled directory` | `expected 'C:\Users\runneradmin\AppData\Local\Te…' to be 'C:\Users\RUNNER~1\AppData\Local\Temp\…'` | **not addressed (predicted)** — row 226 (7/10), the 8.3 short-name class. |
| W-24 | `scripts/context-io.test.ts:11401` | `tier 0 OUTRANKS tier 1, which is the only reason it is a tier at all` | same 8.3 disagreement, `…\p31-27-rank-delivered-LTT1Hq` | **not addressed (predicted)** — row 226 (8/10). |
| W-25 | `scripts/context-io.test.ts:11414` | `the canonicaliser's THREE rungs are each driven, and the rung this platform used is named` | `expect(realpathSync(r)).toBe(realpathSync.native(r))` — `RUNNER~1` vs `runneradmin` | **not addressed (predicted)** — row 226 (9/10). |
| W-26 | `scripts/context-io.test.ts:15895` | `the three readings are taken against a kit home the COMMITTED installer created` | `PREMISE: the child's home directory is not the fixture's …: expected 'C:\Users\runneradmin' to be 'C:\Users\RUNNER~1\AppData\Local\Temp\…'` | **not addressed (predicted)** — row 226 (10/10). |
| W-27 | `scripts/context-io.test.ts:14059` | `every planted condition reports its OWN arm, read from the authority's discriminant` (31-33 CR-24) | `the above-ceiling row's detail is not the authority's own message: expected 'context-io: the note file "C:\\Users\…' to be 'context-io: the note file "C:\Users\R…'` — the detail cell carries the path JSON-escaped, the authority's message the host spelling. Baseline text: `the authority does not name unopenable for this plant: expected '(read as a note)' to be 'unopenable'` (`:13812`). | **incomplete fix** (33-05) — the CR-24 plant table's `unopenable` arm closed (FIFO routed through the corpus); the case now fails one arm later, on `above-ceiling`, with the JSON-escaped-path class of W-11. Beyond row 226's ten. |
| W-28 | `scripts/context-io.test.ts:15771` | `R-31-21-03's published shape AGREES with the reading its probe takes` | `expected 'refused bounded=true not-waited-on=fa…' to be 'refused bounded=true not-waited-on=tr…'` — identical text on the baseline (`:15530`). | **incomplete fix** (33-05) — a `retained`-position probe the FIFO routing did not reach; whether its fixture is a FIFO is `UNKNOWN - verify`. Beyond row 226's ten. |
| W-29 | `scripts/freshness.test.ts:416` | `DISCRIMINATION PAIR: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree` | `expect(before.status, msg).toBe(0)` → `expected 1 to be +0`; the message: `pre-fix clone (checked out 020905f9…) … exit 1 / Freshness check FAILED: the rebuild did not compile cleanly … stderr: (no stderr)`; `post-fix clone (checked out d9bd4315…) … STALE COMMITTED OUTPUT: hooks/guard.js`. | **incomplete fix** (33-06) — the pair's pre-fix arm checks out the pre-fix tree and runs ITS gate, which still launches `npx tsc` without a shell and starts no compiler on windows; the vacuity the test preserves as evidence cannot be observed on that host. The post-fix arm is correct on windows. 7 of 8 closed. |
| W-30 | `scripts/runnable-ref/uat-spec-integrity.test.ts:6728` | `GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr` | `expected 'The UAT spec e2e/uat/nested.uat.spec.…' to contain 'could not be PARSED (Maximum call sta…'` — received `could not be PARSED (the program did not include it)`. | **not addressed (predicted)** — row 227 (the `parseFaults` key spelling), text as predicted. |
| W-31 | `scripts/runnable-ref/uat-spec-integrity.test.ts:8897` | `POINT 2: the Program's included files are a SUPERSET of the derived spec set` | `e2e/uat/a.uat.spec.ts is in the derived set and NOT in the program — it would be unchecked at exit 0: expected false to be true` | **not addressed (predicted)** — row 227 (the test-internal `join` comparison), text as predicted. |

**Per-file, baseline → this run** (the 23 baseline files plus the one new file; a file absent from
the second column is fully green on this run):

| File | Baseline | Now | Disposition on this run |
|---|--:|--:|---|
| `scripts/check-banned-claims.test.ts` | 64 | 3 | 61 closed (33-03); 3 incomplete — § 2.5 (a) |
| `scripts/context-io.test.ts` | 30 | 12 | 18 closed (33-05); 10 predicted; 2 incomplete |
| `scripts/board-read.test.ts` | 15 | 0 | green |
| `hooks/guard.test.ts` | 13 | 0 | green (275 tests, 80 434 ms) |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` | 12 | 2 | 10 closed (33-02, incl. `GREEN 4` in 59 197 ms); 2 predicted |
| `scripts/freshness.test.ts` | 8 | 1 | 7 closed (33-06); 1 incomplete |
| `scripts/board-watch.test.ts` | 8 | 0 | green |
| `scripts/board-model.test.ts` | 8 | 0 | green |
| `install/install.test.ts` | 8 | 0 | green (137 tests, 1 pre-existing skip) |
| `scripts/check-kit-refs.test.ts` | 7 | 0 | green |
| `scripts/uat-gate-exit-contract.test.ts` | 4 | 4 | 2 closed (33-05's `SKIPPED SHAPES` pair); 2 mis-attributed survived; 2 new |
| `scripts/check-platform-shapes.test.ts` | 4 | 1 | 3 closed; 1 incomplete |
| `scripts/validate.test.ts` | 3 | 0 | green |
| `scripts/check-nul-bytes.test.ts` | 3 | 0 | green (the CRLF-checkout pin set held on a `core.autocrlf` host) |
| `scripts/board-dashboard.test.ts` | 3 | 0 | green |
| `scripts/frontmatter.test.ts` | 2 | 0 | green |
| `scripts/check-foundation-guards.test.ts` | 2 | 1 | hook timeout closed; o-prefix predicted |
| `scripts/nonblocking-reader-parity.test.ts` | 1 | 0 | green |
| `scripts/generate-guarantees.test.ts` | 1 | 0 | green (the `TMPDIR`/`TMP`/`TEMP` plant held on win32) |
| `scripts/coordinator-resolution-precheck.test.ts` | 1 | 0 | green |
| `scripts/check-uat-oracles.test.ts` | 1 | 0 | green |
| `scripts/board-tracer.test.ts` | 1 | 0 | green |
| `hooks/admission-guard.test.ts` | 1 | 0 | green |
| `scripts/check-flip-manifest.test.ts` | — (added by 33-07) | 7 | new — § 2.5 (a) |

### 2.5 The finding, stated as the next round's input

(a) **One publishing boundary, ten reds, two consumers.** `publicDocsCorpus()` in
`scripts/check-public-docs-vocabulary.ts` builds its `examples` part from a `readdirSync` walk joined
with `path.join` (host separator, `:268`) while its root part comes from `git ls-files` (POSIX). No
phase-33 commit touches that module. 33-03 normalized the banned-claims dedupe *key* it derives from
the member and left the member itself host-spelled; 33-07's new gate takes the same corpus and
compares it with a POSIX listing. D-15 names exactly this: normalize once, in the module that
publishes. WINDOWS.md row 229.

(b) **Two ubuntu cases the inventory never had right.** U-1/U-2 sat under a class label (`.temp`)
whose fix could not touch them; the phase's local evidence for the ubuntu leg ("closed on this POSIX
host by the same mechanism the runner has") was true of the 7 it named and silent about these 2.
Row 230. Mechanism `UNKNOWN - verify`; the discriminating fact from the log is that `GREEN 1` passes
on the same leg.

(c) **Two mis-attributed windows survivors** (W-15, W-16, row 231) and **two reds created by this
phase's own changes** (W-13's explicit 60 s bound, W-14's per-line `FIFO` literal under a widened
remainder — row 232).

(d) **Three incomplete fixes one arm over** (W-12 row 233; W-27/W-28 row 234; W-29 row 235), each
the pattern this project's memory names: the fix closed the arm it was aimed at and the case moved
to the sibling arm the fix did not reach.

(e) **Thirteen predicted survivors**, present with the predicted texts (rows 226–228) — the
prediction held exactly for the set it named.

**What this run did NOT do, by the plan's prohibitions:** no platform conditional was added to any
case; nothing was fixed; nothing was re-run; the bare default test script was not run; no WINDOWS.md
row was flipped (rows 186 and 193 are untouched — the plan flips them only on a green run). The
four-round cap governs what follows: this inventory is round 1's measurement and the input to the
CAP-02 gap round.

### 2.6 The slowest test on each leg — D-14's falsification, recorded

| Leg | Rank | Duration | Test | Outcome |
|---|--:|--:|---|---|
| windows | 1 | **86 234 ms** | `every gate-plantable corpus row moves the gate from exit 0 to exit 1, with the refusal TEXT read from the gate's own output` | PASSED (baseline 85 568 ms) |
| windows | 2 | 61 989 ms | `the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40` | **FAILED at its own 60 000 ms argument** (baseline 56 481 ms, passed) — W-13 |
| windows | 3 | 59 197 ms | `GREEN 4: a directory tree as deep as this platform permits is derived without a throw` | PASSED (baseline: cut at 5 s while reporting 33 354 ms) |
| windows | 4 | 14 685 ms | `EVERY row's label agrees with the failure entries recorded beside it, in every run` | PASSED (baseline: a 5 s timeout) |
| windows | 5 | 12 967 ms | `the wrapper ANSWERS for a decider that never exits (RA5-6)` | PASSED (baseline 12 703 ms) |
| ubuntu | 1 | **39 393 ms** | `every gate-plantable corpus row moves the gate …` | PASSED (baseline 39 784 ms) |
| ubuntu | 2 | 10 338 ms | `the wrapper ANSWERS for a decider that never exits (RA5-6)` | PASSED |
| ubuntu | 3 | 10 098 ms | `GREEN 4 — a stdin whose writer never closes is a BOUNDED deny, not a hang` | PASSED |

Slowest files: windows `scripts/check-diff-disposition.test.ts` 160 084 ms (baseline 129 998),
`install/install.test.ts` 86 859 ms, `hooks/guard.test.ts` 80 434 ms; ubuntu
`scripts/check-foundation-guards.test.ts` 115 555 ms (baseline 116 672), `scripts/freshness.test.ts`
57 087 ms, `scripts/check-platform-shapes.test.ts` 50 611 ms.

The 180 000 ms `testTimeout` sits 2.09× above the slowest measured test on the slower leg; the
120 000 ms `hookTimeout` was not approached (no hook line on either leg). RESEARCH's assumption — that
the timed-out tests' true durations were unmeasured and a bound in the 120–180 s range was defensible
— is now measured: the longest formerly-cut test (`GREEN 4`) needs 59.2 s on windows. The one timeout
that did fire is the explicit 60 s argument at `uat-gate-exit-contract.test.ts:575`, a bound D-14's
global setting does not reach.

### 2.7 Ledger changes made in this task, through the tool

No row was flipped. Seven rows were appended, one per finding class in § 2.5, so the ship gate sees
each; every append was made with the ledger tool and the three representations were checked to
agree afterwards (`windows status`: open 206, waived 3, fixed 26, total 235; the table has 235 rows;
the JSON appendix has 235 `id` entries).

```
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/check-public-docs-vocabulary.ts --line 268 --description "33-09 run 35499800942 windows: publicDocsCorpus's examples part is a readdirSync walk joined with the host separator … 10 reds in 2 consumers …"        # row 229
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/runnable-ref/uat-spec-integrity.test.ts --line 6748 --description "33-09 run 35499800942 UBUNTU (the leg expected green): GREEN 1b … and ORDERING … byte-identical assertion texts to baseline …"   # row 230
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/uat-gate-exit-contract.test.ts --line 450 --description "33-09 run 35499800942 windows: 2 survived reds NOT ADDRESSED (identical texts to baseline) — scannedDocuments() joins readdir entries with the host separator …"   # row 231
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/uat-gate-exit-contract.test.ts --line 782 --description "33-09 run 35499800942 windows: 2 NEW reds created by phase-33 changes — (1) … timed out at its OWN explicit 60_000 ms argument … (2) … pins shape=\"FIFO\" on EVERY skipped line …"   # row 232
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/check-platform-shapes.test.ts --line 849 --description "33-09 run 35499800942 windows: COVERAGE case survived with identical text — 33-05 gated the MIRROR … DISCLOSED_UNDRIVEN still pins the two-label pair …"   # row 233
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/context-io.test.ts --line 14059 --description "33-09 run 35499800942 windows: 2 context-io reds beyond row 226's ten, both in 33-05's class — CR-24 … moved … to the above-ceiling arm … R-31-21-03's probe still reads not-waited-on=false …"   # row 234
node ~/.claude/gsd-core/bin/gsd-tools.cjs windows append --kind unrun-verify --phase 33 --file scripts/freshness.test.ts --line 416 --description "33-09 run 35499800942 windows: DISCRIMINATION PAIR survived (7 of 8 freshness reds closed by 33-06) — the pair's PRE-FIX arm clones the pre-fix tree … and cannot start a compiler on windows …"   # row 235
```

The full description of each row is in the ledger; the ellipses above are this document's, not the
tool's. Rows 226–228 (the predicted survivors) stand as written; their predictions held. Row 186
carries a second cited green measurement (§ 2.3) and is not disposed; row 193 is untouched.

### 2.8 Transcripts

The two job logs (`gh api repos/abitwise/grugops/actions/jobs/106049412426/logs`,
`…/106049412324/logs`), the baseline pair, the extraction script and its JSON outputs are in the
executor's scratch directory for this session; every number above is copied from those outputs. The
extraction was validated first against the baseline windows log, where it reproduces the research
census file for file (23 files; 198 unique `FAIL` keys, one case listed twice for two errors) before
being applied to the new logs. The `Failed Tests` sections carry zero control bytes (scanned before
any line was quoted here).

## Part 3 — round 2: the pre-push inventory (Task 1)

Gap-closure round 2 of the phase's four-round cap (plan 33-20). Round 1's measurement (Part 2, run
`35499800942`) left 33 red rows — U-1, U-2, W-1..W-31 (§ 2.4) — and the six fix plans of waves 7
and 8 (33-14 through 33-19) each closed a subset by mechanism on this host. This part is the same
shape as Part 1: every workflow command run locally in the workflow's order with its exit status,
then one row per § 2.4 red with the closing plan, the LOCAL result of running that exact title, and
whether the windows outcome is measurable on this machine at all. The expectation the run decides is
written at the end, before the push, together with what would falsify it. Nothing here is a CI
conclusion; § 3.2 (Task 3) is.

### 3.1 The pre-push inventory

**Tree under measurement:** `cdf9a9b7b9b9d114b2fbd693c6b11807878952be` (the dispatch base of this
plan; `docs(33-16): record plan 33-16 completion in STATE and ROADMAP`), plus this document, which
this task's commit adds on top. `origin/main` is `8f05ed42bd9e638dff5b32babf5c971024c4df30` (the
last of four docs-only commits pushed after run `35499800942`'s sha `d9bd4315`; its own run
`35507901650` concluded `failure` on the same vitest step, with no source change between the two).
`git merge-base --is-ancestor origin/main HEAD` → true: the push is a fast-forward.
`git log --oneline origin/main..HEAD | wc -l` → **61** commits carried (33-12 through 33-19 and
33-13's out-of-order landing, with their `docs(…)` records). Two untracked paths in the working tree
(`.planning/milestone.lock`, `.planning/phases/34-model-effort-dial-pi-support/`) are not this
plan's and are not carried by any commit.

**Host:** darwin/arm64, node v24.12.0, npm 11.7.0 (the CI matrix runs node 22). **Date:**
2026-09-21 (00:04–00:30 UTC). **Prohibition honoured:** `npm test` was not run; the vitest command
below is the workflow's own with the `scripts/e2e` exclusion.

**Every workflow command, in the workflow's order, with its local exit status** (the step list is
unchanged from § 1.1 — `.github/workflows/ci.yml` re-read; headline numbers copied from each
transcript):

| # | Workflow step | Leg | Command (as the workflow runs it) | Local exit | Headline numbers |
|--:|---|---|---|--:|---|
| 1 | Install | both | `npm ci` | 0 | `added 48 packages, and audited 49 packages in 877ms`; `4 vulnerabilities (2 moderate, 2 high)` in dev-only deps (informational, as in § 1.1) |
| 2 | Freshness gate before any build | ubuntu | `npm run freshness` | 0 | `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.` |
| 3 | Build and working-tree parity assertion | ubuntu | `node scripts/check-build-parity.js` | 0 | `PASS Build parity: tracked build outputs that moved when the build ran: 0 findings over 69/69 elements` — this is the FIRST local run of the parity gate on 33-19's `createRequire` + `process.execPath` compiler launch (the `npx tsc` launch is gone) |
| 4 | Build | windows | `npm run build` | 0 | `tsc` exit 0; `git status --short -- '*.js'` empty afterwards |
| 5 | Typecheck | both | `npm run typecheck` | 0 | three targets (`tsc --noEmit`, `tsconfig.tests.json`, `tsconfig.fixtures.json`) |
| 6 | Platform shape corpus, exit-code contract, directory identity | both | `node scripts/check-platform-shapes.js` | 0 | `HOST CAPABILITIES (3)`: `chmod 000 enforcement present`, `signal-terminated child present`, `control byte in a path component present`; `DRIVEN (13)`; `SKIPPED SHAPES (0)`; `ALL CHECKS PASSED` |
| 7 | Windows shape remainder is recorded, not silent | windows | `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS=1 node scripts/check-platform-shapes.js` | **1** | `SKIPPED SHAPES (0):` then `FAIL GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS is set and the skip list is EMPTY.` — the designed answer on a host that constructs every shape (§ 1.1 row 7). On windows-latest this step exited 0 on run `35499800942` with a 5-row remainder (§ 2.3); no plan in this round touched the corpus or the capability probes, so the same non-empty remainder is expected. |
| 8 | Vitest (e2e lane excluded) | both | `npx vitest run --exclude '**/scripts/e2e/**'` | 0 | `Test Files 78 passed (78)` · `Tests 5375 passed \| 2 skipped (5377)` · `Duration 492.17s` (tests 478.84 s); 0 `Test timed out`, 0 `Hook timed out`, 0 `RangeError` lines in the transcript; 8m14s wall (00:05:33Z → 00:13:47Z) |
| 9 | Freshness gates + repo gates (one step, 23 commands, stops at the first non-zero) | ubuntu | the 22 rows below (the workflow's `git status --porcelain` and its `test -z` are rows 9.9/9.10) | 0 | every command exit 0 |

The ubuntu-only step, command by command, run one after another in the workflow's order:

| # | Command | Local exit | Headline |
|--:|---|--:|---|
| 9.1 | `npm run freshness` | 0 | `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.` |
| 9.2 | `npm run freshness:catalog` | 0 | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` |
| 9.3 | `npm run freshness:context` | 0 | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` |
| 9.4 | `npm run freshness:adapters` | 0 | `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.` |
| 9.5 | `npm run freshness:skill-twins` | 0 | `Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.` |
| 9.6 | `npm run freshness:guarantees` | 0 | `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` |
| 9.7 | `npm run freshness:hook-manifest` | 0 | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` (33-16 re-derived the manifest twice after `context-io.js` moved) |
| 9.8 | `npm run generate:adapters` | 0 | — |
| 9.9 | `git status --porcelain -- .claude/agents/` | 0 | empty |
| 9.10 | `test -z "$(git status --porcelain -- .claude/agents/)"` | 0 | — |
| 9.11 | `node scripts/check-foundation-guards.js` | 0 | `ALL CHECKS PASSED` (last PASS line: dual-path equivalence) |
| 9.12 | `node scripts/check-kit-refs.js` | 0 | `invariant marker present at all 26 marker sites (2 named + 24 derived adapters)`; `ALL CHECKS PASSED` |
| 9.13 | `node scripts/check-public-docs-vocabulary.js` | 0 | `AUDIT-02: 11 public document(s) carry zero retired vocabulary — root 4, examples 5, kitReadme 1, guarantees 1` (33-14's module; the examples part is now published through `corpusMember`) |
| 9.14 | `node scripts/check-audit-register.js` | 0 | `AUDIT-01 completeness: equality one holds — 36 counted register row(s) set-equal in both directions to 36 derived file(s)` |
| 9.15 | `node scripts/check-claim-anchors.js` | 0 | `47 registry row(s) parsed from 47 claim-heading-shaped line(s)` |
| 9.16 | `node scripts/check-banned-claims.js` | 0 | `banned claims: 0 findings over 120/120 elements`; `LANG-04: 120 document(s) … kit 75, publicDocs 12, installReadme 1, skillSources 7, claudeAdapters 24, pluginManifests 2, guarantees 1, overlap 2` |
| 9.17 | `node scripts/check-imperative-lexicon.js` | 0 | `LANG-01: 76 Technical Name(s) DERIVED from the kit` |
| 9.18 | `node scripts/check-diff-disposition.js` | 0 | `PASS diff disposition — changed watched file(s): 0 findings over 39/39 elements` (§ 1.3's disposition file still covers the README; no watched file changed in this round) |
| 9.19 | `node scripts/check-nul-bytes.js` | 0 | `2440 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte` (2434 at 33-15; the round's new files are all tracked and clean) |
| 9.20 | `node scripts/check-residual-citations.js` | 0 | `residual citations: 5 path claim(s) across 2 published row(s), every one a tracked file` |
| 9.21 | `node scripts/check-flip-manifest.js` | 0 | `live-surface set: 28 document(s) over 5 floored parts, pinned at 28`; `every declared locator resolves in the pre-capture state: 62 flip row(s), 10 correction row(s), 2 exemption anchor(s)` — the gate whose seven test titles were red on windows (W-4..W-10) now reads a POSIX `publicDocs` part on every host |
| 9.22 | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 | `ALL CHECKS PASSED` |

The plan's own verify chains were also run exactly as written: `npx tsc --noEmit` exit 0;
`npm run build && npm run check:build-parity && npm run freshness` exit 0 (parity `0 findings over
69/69 elements`, freshness `69 committed .js file(s)`); `npm run check:nul-bytes` exit 0
(re-run after this document was written, see the SUMMARY). The working tree is clean of tracked
changes after every command (`git status --short` shows only the two untracked paths named above).

**Suite totals beside the previous readings:**

| Leg / host | Test files | Tests | Duration | Source |
|---|---|---|---|---|
| ubuntu-latest, run `35499800942` (round 1, sha `d9bd4315`) | 1 failed / 77 passed (78) | **2 failed** / 5339 passed / 1 skipped (5342) | 856.26 s | § 2.2 |
| windows-latest, run `35499800942` (round 1) | 8 failed / 70 passed (78) | **31 failed** / 5308 passed / 3 skipped (5342) | 1857.42 s | § 2.2 |
| this host (darwin/arm64, node 24), tree `cdf9a9b7` | 78 passed (78) | **0 failed** / 5375 passed / 2 skipped (5377) | 492.17 s | row 8 above |

The denominator moved 5342 → 5377 (35 cases added by 33-12..33-19; each plan's SUMMARY records its
own delta; the file count is unchanged at 78). The pushed run's totals are read against
**5377 / 78**.

**One row per § 2.4 red — the closing plan, the mechanism, the local result, and whether the
windows outcome is measurable here.** Each local result is one invocation of
`npx vitest run --exclude '**/scripts/e2e/**' <file> -t "<title>"` with the title regex-escaped so
it matches exactly one case; the exit status and the vitest `Tests` line are quoted from that
invocation's own output (transcripts `titles/<row>.log` in the executor's scratch directory). Every
one of the 33 exited 0 with exactly one test passed. The measurability column uses three values:
**separator seam** — the windows spelling was handed to the predicate on this host (`win32.sep`,
`path.win32`, a backslash in a fixture name) and the pre-fix assertion reproduced the CI text;
**capability seam** — the windows host's absent capability was forced on this host
(`GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT`) and the pre-fix assertion reproduced the CI text;
**unmeasured locally, by construction** — the windows mechanism has no darwin analogue, so the
fix's correctness on windows is inferred from a read of the platform (node's source, the Win32
API) and is exactly what the pushed run decides.

| Row | File : case | Closing plan | Mechanism (one clause) | Local result | Windows outcome measurable here? |
|---|---|---|---|---|---|
| U-1 | `scripts/runnable-ref/uat-spec-integrity.test.ts` : `GREEN 1b: the pathological spec alongside a clean one exits 2 with `visited 1 of 2` on stderr` | 33-17 | the two-file case plants `mixedArrangementDepth(parseBoundary())` = 2× the measured one-file overflow boundary, off the zero-margin adjacent pair | exit 0 · `Tests 1 passed \| 388 skipped (389)` | POSIX host runs the same arrangement, but the ubuntu boundary shift that produced the red is **unmeasured locally, by construction** (this host measured `one-file {627, 628} · mixed {627, 628} · shift 0`; 33-17 marks the ubuntu mechanism `UNKNOWN - verify`, cause class SUITE; the pushed ubuntu leg is the settling observation) |
| U-2 | same file : `ORDERING: the per-file could-not-run reason precedes reportMeasured's output` | 33-17 | same arrangement, same derived depth at (b) | exit 0 · `Tests 1 passed \| 388 skipped (389)` | as U-1 |
| W-1 | `scripts/check-banned-claims.test.ts` : `the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list` | 33-14 | `publicDocsCorpus()` publishes each walked `examples/` member through `corpusMember(rel)` = `toPosixWith(rel, sep)` at the walk's accumulation site (D-15) | exit 0 · `Tests 1 passed \| 130 skipped (131)` | **separator seam** — Test T hands `win32.sep` to `corpusMember` and a COMPILED identity mutant reds it with `expected 'examples\03-ticket-to-pr.md' to be 'examples/03-ticket-to-pr.md'`; this title itself is a POSIX no-op here |
| W-2 | same file : `THE MISSING DIRECTION: every scan member is a TRACKED path, and an intruder is NAMED` | 33-14 | same | exit 0 · `Tests 1 passed \| 130 skipped (131)` | separator seam (as W-1) |
| W-3 | same file : `THE EQUALITY, so nothing is dropped in silence: surfaced == admitted + excluded-by-name` | 33-14 | same | exit 0 · `Tests 1 passed \| 130 skipped (131)` | separator seam (as W-1) |
| W-4 | `scripts/check-flip-manifest.test.ts` : `exits 0, names the status it read, and prints every part with the derived total beside the pin` | 33-14 | same module fix; the gate's derived `publicDocs` part is POSIX on every host, the listed side always was | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam (as W-1); the gate itself printed all five `examples/` members forward-slashed (row 9.21) |
| W-5 | same file : `CONVERSE 1: the same cell surviving OUTSIDE the live-surface set (a plan record, an excluded ledger) passes` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-6 | same file : `the same surviving cell does NOT fail the gate in the pre-capture state — before the flip those cells are correct` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-7 | same file : `CONVERSE 2: every cell carrying a well-formed citation to an existing summary section passes` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-8 | same file : `CONVERSE: a GAP-D1 line WITHOUT a deferral marker (the discharge note) passes, and so does the exempt history line` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-9 | same file : `the flip commit is DERIVED from history — a later commit on top does not move the comparison` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-10 | same file : `CONVERSE: an explicit --range over exactly the declared set passes in the discharged state` | 33-14 | same | exit 0 · `Tests 1 passed \| 36 skipped (37)` | separator seam |
| W-11 | `scripts/check-foundation-guards.test.ts` : `(o-prefix) a root that is a string PREFIX of a sibling path rewrites nothing` | 33-19 | both halves of the assertion compare through `quoteValue` = `JSON.stringify`, the form the guard publishes the illegal `models.preset` in | exit 0 · `Tests 1 passed \| 299 skipped (300)` | **separator seam** — a backslash in the sibling directory's name reproduced W-11's exact shape against the old assertion on darwin; the new one passes |
| W-12 | `scripts/check-platform-shapes.test.ts` : `COVERAGE: every label was WATCHED live except the two this platform cannot stage` | 33-18 | `expectedUndriven` = `DISCLOSED_UNDRIVEN` ∪ `labelsGatedByAbsentCapability()`, read from the one `MIRROR_CAPABILITY_GATES` table through the same `hostCapabilityOrSkip` the mirror case takes | exit 0 · `Tests 1 passed \| 26 skipped (27)` | **capability seam** — under `FORCE_ABSENT="signal-terminated child"` the set grew by exactly `NOT ORDINARY (signalled)` and the mirror printed its SKIPPED row |
| W-13 | `scripts/uat-gate-exit-contract.test.ts` : `the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40` | 33-18 | the explicit `}, 60_000)` argument is removed; D-14's global 180 s bound governs | exit 0 · `Tests 1 passed \| 34 skipped (35)` (tests 10.65 s here) | **unmeasured locally, by construction** — a windows wall-clock duration (61 989 ms on run `35499800942`, 56 481 ms at the baseline); the run decides whether it stays under 180 000 ms |
| W-14 | same file : `NON-EMPTY on a platform lacking a shape, and each entry names the shape AND the platform` | 33-18 | the per-line check demands membership in `ADMISSIBLE_SHAPE_NAMES` = `SHAPES` ∪ `HOST_CAPABILITIES` names (two floors), not the literal `shape="FIFO"` | exit 0 · `Tests 1 passed \| 34 skipped (35)` | **capability seam** — `FORCE_ABSENT="FIFO,chmod 000 enforcement"` emulated the windows remainder; the old literal reproduced W-14's exact text, the derived loop is green |
| W-15 | same file : `the scanned document set is DERIVED and its cardinality is asserted, so a short scan is red` | 33-18 | `scannedDocumentsWith({ join, sep })` maps every member through `toPosixWith(p, api.sep)` at the one push site | exit 0 · `Tests 1 passed \| 34 skipped (35)` | **separator seam** — test AE drives `path.win32`; removing the normalizer reds AE on darwin with `expected '\Users\…' not to contain '\'` |
| W-16 | same file : `every ordinal-claiming sentence in the scanned set appears in the tracked list` | 33-18 | same push site; the `split("/").pop()` key is a bare file name on every host | exit 0 · `Tests 1 passed \| 34 skipped (35)` | separator seam (as W-15) |
| W-17 | `scripts/context-io.test.ts` : `trustedRepoRoot is ONE function, and an empty CLAUDE_PROJECT_DIR names nothing` | 33-15 | the expectation is `resolve("/tmp/some-project")`, the module's own `resolve(fromEnv.trim())` over the same literal | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **separator seam** — `path.win32.resolve("/tmp/some-project") === "/tmp/some-project"` → `false` on this host, which is the CI text's mechanism; the derivation is an identity on POSIX |
| W-18 | same file : `trustedRepoRoot returns the TRIMMED value, as grantedBy does next door` | 33-15 | same derivation at both assertions | exit 0 · `Tests 1 passed \| 662 skipped (663)` | separator seam (as W-17) |
| W-19 | same file : `BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached` | 33-15 | `deepFixture(top, 70)` composes single-character segments and asserts the composed length ≤ `DEEP_FIXTURE_MAX_PATH_CHARS = 240` as a PREMISE; `drive()` now quotes the spawn error/status/signal | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **unmeasured locally, by construction** — a `CreateProcess` cwd length bound; this host spawns at 215 chars, the 240 ceiling hypothesis is `UNKNOWN - verify` (33-15); the run's driver output (an answer, or the quoted spawn error) settles it |
| W-20 | same file : `the published step limit is the one the walk has, driven from the sentence itself` | 33-15 | `deepFixture(near, limit - 4)` (201 chars here) and `deepFixture(far, limit + 6)` under the same ceiling | exit 0 · `Tests 1 passed \| 662 skipped (663)` | as W-19 |
| W-21 | same file : `R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED` | 33-16 | `trustedRepoRoot` walks from `canonicalWorkingDirectory(process.cwd())` (rung 1 `realpathSync.native`), so a cwd spelled through a directory symlink names the target on every host | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **separator seam** in kind (a directory-symlink cwd on darwin: pre-fix probe `equal: false`, post-fix `equal: true`); on windows the fixture needs the runner's `SeCreateSymbolicLink` privilege (held on run `35499800942`); if lost, 33-16's D-16 routing prints a SKIPPED row, not a red |
| W-22 | same file : `CONTROL 5b (BOTH WAVES): the same store at a MARKER-LESS home declines` | 33-15 | `plantHome(home)` sets `HOME` and `USERPROFILE` together (win32 `os.homedir()` reads `USERPROFILE`); the decline is asserted by name before the clause | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **unmeasured locally, by construction** — the win32 `USERPROFILE` read is node's source, not a darwin behaviour; the darwin MIRROR (mutation A: plant `USERPROFILE` only) reds 5b with `CONTROL 5b PROMOTED … expected null not to be null`, so the fix's shape is proven, its win32 effect is the run's |
| W-23 | same file : `hostDeliveredRoot() ACCEPTS a canonical, existing, version-controlled directory` | 33-15 | the expectation is `realpathSync.native(r)`, rung 1's own spelling | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **unmeasured locally, by construction** — 8.3 short names (`RUNNER~1` vs `runneradmin`) have no darwin analogue; the derivation is an identity here (`native(portable(d)) === native(d)` → `true`) |
| W-24 | same file : `tier 0 OUTRANKS tier 1, which is the only reason it is a tier at all` | 33-15 | `toBe(realpathSync.native(delivered))` | exit 0 · `Tests 1 passed \| 662 skipped (663)` | unmeasured locally, by construction (8.3, as W-23) |
| W-25 | same file : `the canonicaliser's THREE rungs are each driven, and the rung this platform used is named` | 33-15 | rung 2 is asserted to name rung 1's directory: `native(realpathSync(r))` vs `native(r)` | exit 0 · `Tests 1 passed \| 662 skipped (663)` | unmeasured locally, by construction (8.3, as W-23) |
| W-26 | same file : `the three readings are taken against a kit home the COMMITTED installer created` | 33-15 | the reading driver AND its CONTROL pass `{ HOME: home, USERPROFILE: home }` to the child | exit 0 · `Tests 1 passed \| 662 skipped (663)` | unmeasured locally, by construction (win32 `USERPROFILE`, as W-22) |
| W-27 | same file : `every planted condition reports its OWN arm, read from the authority's discriminant` | 33-15 (33-16 made `cell` the import) | the detail-cell expectation is `rendererCell(message)` = the module's exported `cell` (backslash doubled, pipe escaped), not a pipe-only replacement | exit 0 · `Tests 1 passed \| 662 skipped (663)` | **separator seam** — a note at `notes/dd\overceiling.md` on darwin renders `dd\\overceiling.md`: pipe-only form `false`, `rendererCell` `true` |
| W-28 | same file : `R-31-21-03's published shape AGREES with the reading its probe takes` | 33-16 | `appendRegularFileLine` `statSync`s the position first and refuses a non-regular entry as `not-a-regular-file` BEFORE any open, so the arm no longer depends on which error the host's open call fails into | exit 0 · `Tests 1 passed \| 662 skipped (663)` | the darwin arm was reproduced (RED: raw open `EISDIR`, module answered `unopenable`); the windows open-error arm is now UNREACHABLE by construction rather than measured; whether the retained-position fixture is a FIFO on windows stays `UNKNOWN - verify` (§ 2.4) — the run decides |
| W-29 | `scripts/freshness.test.ts` : `DISCRIMINATION PAIR: the same planted stale committed .js is green on the pre-fix tree and red on the post-fix tree` | 33-19 | the pre-fix arm asserts what every host can observe — the pre-fix gate never names the plant — with `prefixShape(run)` ∈ {`green-vacuous`, `no-compiler-vacuous`} and `unexpected` refused | exit 0 · `Tests 1 passed \| 12 skipped (13)` (tests 22.61 s) | **capability seam** in kind — `npx` removed from PATH on darwin produces the windows shape (`no-compiler-vacuous`, exit 1, `stderr: (no stderr)`); both shapes measured here, the refusal arm proven by mutation |
| W-30 | `scripts/runnable-ref/uat-spec-integrity.test.ts` : `GREEN 1: a spec the parser cannot finish exits 2 with the vacuity floor on stderr` | 33-17 | `faultKey` is the one key-forming rule at the compiler host's `set` and the checker's `get` | exit 0 · `Tests 1 passed \| 388 skipped (389)` | **separator seam** — test AB uses a `path.win32` pair on darwin: the raw-keyed map does NOT find the lookup, the `faultKey`-keyed one does; identity mutant reds AA, AB, POINT 2 |
| W-31 | same file : `POINT 2: the Program's included files are a SUPERSET of the derived spec set` | 33-17 | both sides of the comparison go through `faultKey`; a win32-spelled lookup is added | exit 0 · `Tests 1 passed \| 388 skipped (389)` | separator seam (as W-30) |

**Tally.** 33 of 33 rows exit 0 locally with exactly one test passed. By measurability: 19 rows are
closed on a separator seam (W-1..W-11, W-15..W-18, W-21, W-27, W-30, W-31); 3 on a capability seam
(W-12, W-14, W-29); **11 are unmeasured locally, by construction** — U-1, U-2 (the ubuntu boundary
shift), W-13 (a windows duration), W-19, W-20 (a `CreateProcess` cwd bound), W-22, W-26 (win32
`USERPROFILE`), W-23, W-24, W-25 (8.3 short names), and W-28 (the windows open-error arm, now
unreachable). Those eleven are what the run actually decides; the other twenty-two it confirms.

**Also unmeasured locally, by construction, beyond the 33** (carried from § 1.4, with what changed):

- `scripts/board-watch-live.test.ts` (WINDOWS.md row 186): green on both legs of both prior runs
  (§ 2.3: `6 tests 7776ms` on windows). Unconditional per D-16; the pushed run is its third
  measurement, and the plan disposes row 186 only on a green run.
- The D-14 bounds: no test on either leg approached 180 000 ms on run `35499800942` (slowest 86 234
  ms). Nothing in this round changed a bound; W-13's removed 60 s argument moves that case under the
  global one.
- The windows `SKIPPED SHAPES` remainder under `REQUIRE_SKIPS` (row 7): expected the same 5 rows as
  § 2.3, since neither the corpus nor the capability probes changed.
- The runner's `SeCreateSymbolicLink` privilege: held on run `35499800942`. Every directory-symlink
  fixture in `scripts/context-io.test.ts` is now routed through `stageSymlinkOrSkip` (33-16, 10 → 0
  raw `symlinkSync`), so a lost privilege prints SKIPPED rows counted in the remainder, never a red.
- **The 23-command ubuntu gate chain (row 9) has never been exercised by CI:** the step after a
  failed vitest step does not run, and the ubuntu vitest step has been red on every run since
  2026-07-15. It is green end to end here; its first CI reading is this run's, on a node 22 runner
  with a fresh checkout.
- The `check-build-parity` step on ubuntu (row 3) is likewise the first CI reading of 33-19's
  compiler launch (`typescript/lib/tsc.js` under `process.execPath`, in place, in the checkout
  root).

**What the pushed run will decide, stated before the push:**

1. **Ubuntu leg:** expected green on every step — install, freshness, parity, typecheck, platform
   shapes, vitest (5377 / 78, 0 failed), and the 23-command gate chain reached for the first time.
   Falsifier: any red step. A red at vitest on U-1 or U-2 falsifies 33-17's SUITE diagnosis (the
   derived doubled depth did not clear the ubuntu boundary, or the cause class is not SUITE); a red
   anywhere else in vitest is a regression or a runner-only fact (node 22, a fresh checkout); a red
   in the gate chain is a class no run has ever measured. Each is this round's finding.
2. **Windows leg:** expected green on every step — the 5-row remainder at step 7 exiting 0, and
   vitest with **0 failed** over 5377 / 78: all 31 W-rows closed, no NOT ADDRESSED residue (Part 1
   § 1.5 predicted 13 survivors; this round predicts none). Falsifier: any red. A red among the 31
   is a mechanism this round got wrong, attributable to the closing plan in the row above (the
   eleven `unmeasured locally, by construction` rows are where that is likeliest, and they are
   named); a red outside the 31 is a reproduction that did not transfer or a class created by this
   round's changes — the same shape as § 2.4's 18 unpredicted reds — and is inventoried as `new`.
   Either is round 3's input; none is answered with a platform conditional (D-14/D-16) and none is
   fixed inside this plan (D-11's shape).
3. **CAP-02 verdict:** MET only if BOTH legs' `conclusion` fields read `success` (D-13). Any red on
   either leg is NOT MET, the inventory is re-derived from that leg's own log in § 2.4's shape, and
   rows 229–235, 186 and 193 stay exactly as they are.

**No source file is changed by this task.** The sha of the commit before this task is
`cdf9a9b7b9b9d114b2fbd693c6b11807878952be`; this task's commit carries only this document, so
`git diff --stat cdf9a9b7..HEAD -- scripts install hooks` is empty after it (quoted in the SUMMARY
with the commit's sha). The push is not made by this task; it is behind Task 2's named human
confirmation.
