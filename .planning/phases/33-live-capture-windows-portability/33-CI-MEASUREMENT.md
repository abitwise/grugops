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

_Not yet written. Appended by Task 3 after the blocking human checkpoint (Task 2) is answered and the
push completes: run id, sha, both legs' `conclusion` fields read from `gh run view --json
conclusion,jobs`, both legs' file and test totals, per-leg duration, the per-leg slowest test, and —
on a green run — the per-class CLOSED column and the two ledger dispositions (rows 186 and 193) made
through the ledger tool with the commands quoted; on a red leg — the re-derived per-file, per-class
inventory with assertion texts, each class labelled regression / incomplete fix / new._
