# Phase 33 — Deferred Items

Out-of-scope observations made during execution. Each entry stays open until it carries an
explicit `status: resolved`.

## Deferred Items

- `scripts/board-watch-live.test.ts` DASH-04 debounce case missed its 700 ms wall-clock window once
  status: open
  **Found during:** plan 33-01 plan-level verification, the second full-lane run (2026-09-19, darwin/arm64, node v24.12.0).
  **What:** `coalesces 5 atomic-rename writes into FEWER documents, and at least one` reported `no document arrived in the 700 ms after 5 real writes`. The same case was green on the first full-lane run minutes earlier and green in isolation (6/6, 7.56 s) immediately after. No file in plan 33-01's diff is in that test's closure (`board-dashboard.ts`, `board-watch.ts`, the test itself are untouched).
  **Why deferred:** a wall-clock `fs.watch` measurement on a loaded host, not a defect this plan introduced; the test is unconditional by design (CONTEXT D-16, WINDOWS.md row 186 rule) and RESEARCH assumption A5 already records that its timing sits behind a different set of neighbours under `fileParallelism: false`. Owner: the CAP-02 plans (33-02 D-14 bounds, 33-09 pushed CI run), which measure this on both CI legs.

- `npm run check:diff-disposition` exits 1 with 21 undispositioned README.md clauses
  status: resolved
  **Resolved by:** plan 33-09 Task 1 (2026-09-20) — `docs/audit/29-style-dispositions/33-09.md`, 20 rows over the 21 clauses; the gate exits 0 (`0 findings over 39/39 elements`). The carriers are three commits, not one: `6a604a6c` (1, the removed `0.1.0` line), `22c66700` (8, the install recipe — already on `origin/main`) and `52377a7a` (12). Nothing in README.md, the base or the corpus was touched. WINDOWS.md row 225 marked fixed through the ledger tool.
  **Found during:** plan 33-07 plan-level verification (2026-09-20), running the repository's document gates over the new manifest.
  **What:** every one of the 21 findings names `README.md` (lines 26-33: the version line, the installer command and the clone/install snippet); they were introduced by commit `52377a7a` ("docs(readme): add example Claude Code commands for each grugops skill"), before this phase's dispatch base `6b33fb9e`, and `git log 6b33fb9e..HEAD -- README.md` is empty. The new manifest, the gate and its test are not in the watched corpus and contribute zero findings; `check:nul-bytes`, `check:banned-claims`, `check:residual-citations` and `check:claim-anchors` all exit 0 over the same tree.
  **Why deferred:** a pre-existing red outside this plan's files (scope boundary); the remedy is a disposition file under `docs/audit/29-style-dispositions/` for that README commit, which belongs to whoever lands the next README change or to the CAP-02 plans that must make CI green on both legs (the gate runs at `ci.yml:497`).

- `install/install.test.ts:2632` `tmpdir: status=0` vs `status=3` on windows is the TMPDIR-never-read class, not a signalled child
  status: resolved
  **Resolved by:** plan 33-06 Task 1 (2026-09-20, commit `fe5d7c0d`) — the R-5 ARM 1 case plants `TMPDIR`, `TMP` and `TEMP` together; the exit-3 contract is asserted unchanged; the windows outcome is plan 33-09's measurement.
  **Found during:** plan 33-04 Task 3 (2026-09-20), locating the six `expected null to be +0` sites RESEARCH names beside "the `tmpdir: status=0` versus `status=3` case".
  **What:** the R-5 ARM 1 case plants `TMPDIR: <absent path>` and expects the installer to refuse at exit 3. `os.tmpdir()` on win32 reads `TEMP`, then `TMP`, then `SystemRoot\temp` — never `TMPDIR` (node's own `os.tmpdir` source, read on this host) — so on windows-latest the dead root is never planted, the mirror lands in the real temp directory, and the installer exits 0. Same mechanism plan 33-04 closed in `scripts/generate-guarantees.test.ts` (`+0 not to be +0`) by setting `TMPDIR`, `TMP` and `TEMP` together and asserting the absence as a premise; no `process.platform` branch.
  **Why deferred:** `install/install.test.ts` is not in plan 33-04's `files_modified` (it is plan 33-06's file, whose Task 1 owns the install suite's windows classes); the fix is the same three-variable plant. Owner: plan 33-06, or the CAP-02 gap round after plan 33-09's pushed run measures it.

- The directory-symlink fixtures in `scripts/context-io.test.ts` (context roots linked with `symlinkSync`, ~L423, L7982, L8109, L8468, L10769-L10795) are not D-16-guarded
  status: open
  **Found during:** plan 33-05 Task 1 (2026-09-20), while routing every FIFO, character-device link, dangling link and control-byte fixture through the platform-shape corpus's skip helpers.
  **What:** these links stage a repository's `.grugops/context` (or a kit home) through a symlink and were GREEN on windows-latest run 35394268365 — the GitHub runner holds the SeCreateSymbolicLink privilege, so the corpus's symlink shape constructed there and only the FIFO was skipped. On a host without that privilege each `symlinkSync` throws EPERM and the case is a red, not the `SKIPPED` row D-16 asks for. `stageSymlinkOrSkip(target, at, shape, position)` in `scripts/check-platform-shapes.ts` is the helper to route them through.
  **Why deferred:** none of them is a measured red on either CI leg (plan 33-05 closes measured classes and the plan's file list does not name these sites); the fix is mechanical. Owner: the CAP-02 gap round after plan 33-09's pushed run, or whoever next touches those fixtures.

- `scripts/check-build-parity.ts:132` still launches the compiler through `spawnSync("npx", ["tsc"])` with no shell
  status: open
  **Found during:** plan 33-06 Task 2 (2026-09-20), diagnosing the eight `scripts/freshness.test.ts` windows reds.
  **What:** the same launch `scripts/freshness.ts` used until plan 33-06: on Windows `npx` is `npx.cmd`, which a shell-less `spawnSync` cannot start, so the child never runs, `status` is null and the module reports a build that "did not complete". The parity module already reads and appends `build.error` (review 32.1-14 IN-01), so its message names the layer; it simply cannot run the compiler on that host. The freshness gate now resolves `typescript/lib/tsc.js` through its own require chain and runs it under `process.execPath` (no shim, no shell, no host branch); the parity module could take the identical launch.
  **Why deferred:** `check:build-parity` is an ubuntu-scoped CI step (`.github/workflows/ci.yml`, "Build and working-tree parity assertion (ubuntu)"), so it is not a measured red on either leg and `scripts/check-build-parity.ts` is not in plan 33-06's file list. Owner: the CAP-02 gap round after plan 33-09's pushed run, or whoever next changes that module.

- Ten windows reds in `scripts/context-io.test.ts` are NOT ADDRESSED by any plan in this phase
  status: open
  **Found during:** plan 33-09 Task 1 (2026-09-20), pairing every `FAIL` entry of the baseline windows job log (run 35394268365, job 105759397857) with the plans' summaries and `git log 22c66700..HEAD -- scripts/context-io.test.ts` (only 33-05's two commits, which took the 20 FIFO / chmod / device cases).
  **What:** (1) `trustedRepoRoot` asserted against the POSIX literal `/tmp/some-project` at :4005 and :4237 (`expected 'D:\tmp\some-project' to be '/tmp/some-project'`, 2 cases) and two `drive()` cases (`BOUND: the ancestor walk is limited …`, `the published step limit …`) whose child driver produced no output on windows (mechanism not established from the log); (2) the 8.3 short-name vs long-name `runneradmin`/`RUNNER~1` disagreement in the tier-0 canonicaliser cases at :11329, :11393, :11404 (3 cases; `realpathSync.native()` on both sides is the 33-06 remedy, already in `install/install.test.ts`'s `canonicalPath`); (3) `R-31-19-07 re-measured on BOTH axes` (:8454, the SYMLINK cell's verdict moved); (4) `CONTROL 5b (BOTH WAVES)` (:10701, an assertion handed `null`); (5) `the three readings are taken against a kit home the COMMITTED installer created` (:15800, the home-walk premise). 33-05's SUMMARY handed these to "33-06 or later"; 33-06 measured them as context-io's and did not take them.
  **Why deferred:** not in plan 33-09's files (a measurement plan; its prohibitions forbid a fix and a re-run in one round); each is a pre-existing windows-only red outside this task's changes. Recorded in `33-CI-MEASUREMENT.md` § 1.4 as NOT ADDRESSED with the expectation that they stay red on the pushed run. Owner: the CAP-02 gap round after plan 33-09's pushed run measures them.

- Two windows reds in `scripts/runnable-ref/uat-spec-integrity.test.ts` are NOT ADDRESSED: the `parseFaults` key spelling and the POINT 2 test-internal comparison
  status: open
  **Found during:** plan 33-09 Task 1 (2026-09-20), same pairing as above; 33-02's SUMMARY records the module and its `.js` twin unchanged, and `git diff 22c66700..HEAD` touches neither case.
  **What:** POINT 2 (`the Program's included files are a SUPERSET of the derived spec set`, :8871) asserts `included.has(join(root, rel))` where `included` is the Program's forward-slashed `fileName` set — 33-04's test-internal class, one file over. GREEN 1 (`a spec the parser cannot finish exits 2 with the vacuity floor on stderr`) expected `could not be PARSED (Maximum call stack size exceeded)` and received `(the program did not include it)`: in `scripts/runnable-ref/uat-spec-integrity.ts`, `parseFaults` is keyed by the compiler host's `fileName` (:1359) and looked up with `join(repoRoot, rel)` (:3237), so on a backslash host the recorded fault is never found and the fallback sentence is printed. That second one is a module defect (a lost diagnostic), not only a test spelling.
  **Why deferred:** outside plan 33-09's files; mechanism read from the source, not reproduced on this host (a POSIX `join` spells the same as the compiler). Owner: the CAP-02 gap round.

- One windows red in `scripts/check-foundation-guards.test.ts` is NOT ADDRESSED: the o-prefix echo
  status: open
  **Found during:** plan 33-09 Task 1 (2026-09-20), same pairing; the hook-timeout half of this file's baseline red is 33-02's `hookTimeout`.
  **What:** `(o-prefix) a root that is a string PREFIX of a sibling path rewrites nothing` (:10824) expects the guard's refusal section to contain the host-spelled sibling path (`C:\Users\RUNNER~1\…\mirXTRA\deep`); the guard echoes the illegal `models.preset` as a JSON string, so the windows log's Received text carries doubled backslashes (`"C:\\Users\\…"`) and the single-backslash `toContain` cannot see it. On darwin the path carries no backslash, so the assertion cannot observe the difference.
  **Why deferred:** outside plan 33-09's files; a test-side spelling class (compare the echoed value after JSON decoding, or assert the JSON-escaped form). Owner: the CAP-02 gap round.

- `publicDocsCorpus()` publishes its `examples/` members host-separated — ten windows reds across `scripts/check-banned-claims.test.ts` (3) and `scripts/check-flip-manifest.test.ts` (7) on run 35499800942
  status: open
  **Found during:** plan 33-09 Task 3 (2026-09-20), pairing the pushed run's `Failed Tests 31` against the baseline by exact key.
  **What:** `scripts/check-public-docs-vocabulary.ts` derives the corpus's `examples` part from a `readdirSync` walk joined with `path.join` (`:268`) while the root part comes from `git ls-files`; on windows the five `examples\NN-*.md` members are neither admitted nor excluded-by-name under their POSIX names (banned-claims: uncovered list of 5, intruder list of 5, `expected 2019 to be 2024`), and 33-07's flip gate reports `derived but not listed: [examples\03-ticket-to-pr.md]; listed but not derived: [examples/03-ticket-to-pr.md]` in all seven of its converse/control cases. 33-03 normalized the dedupe KEY formed from the member, not the member; no phase-33 commit touches the corpus module. WINDOWS.md row 229; `33-CI-MEASUREMENT.md` § 2.5 (a).
  **Why deferred:** a measurement plan under the four-round cap — no fix and re-run in one round. D-15 names the remedy (normalize once, in the module that publishes). Owner: the CAP-02 gap round.

- Two UBUNTU reds in `scripts/runnable-ref/uat-spec-integrity.test.ts` (`GREEN 1b` :6748, `ORDERING` :7089) survived with byte-identical baseline texts and were never in the `.temp` class
  status: open
  **Found during:** plan 33-09 Task 3 (2026-09-20) — the ubuntu leg of run 35499800942 concluded `failure` where § 1.5 expected green.
  **What:** `expected +0 to be 2` (a pathological spec beside a clean one exits 0) and `expected -1 to be greater than or equal to 0` (`nested.uat.spec.ts` never named on stderr). RESEARCH folded them into ".temp scandir ENOENT and its downstream vacuity-floor assertions", Task 1 attributed the file to 33-02's `.temp` fix, and neither mechanism touches them. `GREEN 1` (the pathological spec alone) PASSED on the same leg in 9.9 s. Ubuntu-only: green on both windows runs. Mechanism `UNKNOWN - verify`. WINDOWS.md row 230.
  **Why deferred:** outside this plan's files; a fix and a re-run do not belong in one round. Owner: the CAP-02 gap round.

- `scripts/uat-gate-exit-contract.test.ts`: two mis-attributed survivors (`:450-455` host-joined `scannedDocuments()` filtered on the POSIX literal `docs/audit/` and keyed by `split("/")`) and two reds this phase's own changes created (`:575` explicit `60_000` ms bound exceeded at 61 989 ms on windows; `:782` per-line `shape="FIFO"` literal under the remainder 33-05 widened to five rows)
  status: open
  **Found during:** plan 33-09 Task 3 (2026-09-20).
  **What:** the file's baseline 4 reds were 2 of 33-05's `SKIPPED SHAPES` class (closed) plus these 2 test-internal separator cases (untouched, identical texts); the 2 new ones are a per-test bound sitting 3.5 s above the baseline windows measurement of a gate that grew with this phase's disposition rows, and a per-entry literal that a derived remainder count did not cover. WINDOWS.md rows 231, 232.
  **Why deferred:** measurement round; D-14 governs the global bound, not an explicit per-test argument — the gap round decides whether the argument goes or is derived. Owner: the CAP-02 gap round.

- Three incomplete fixes one arm over: `scripts/check-platform-shapes.test.ts:849` `DISCLOSED_UNDRIVEN` pins two labels while 33-05's capability gate leaves `NOT ORDINARY (signalled)` unwatched on win32; `scripts/context-io.test.ts:14059` CR-24 moved from the `unopenable` arm to the `above-ceiling` arm (JSON-escaped path in the detail cell) and `:15771` R-31-21-03's probe still reads `not-waited-on=false`; `scripts/freshness.test.ts:416` the discrimination pair's PRE-FIX arm runs the pre-fix tree's `npx tsc` launch, which starts no compiler on windows
  status: open
  **Found during:** plan 33-09 Task 3 (2026-09-20).
  **What:** each survivor's file had its baseline class closed (3/4, 18/30 beyond the ten predicted, 7/8) and the case moved to the sibling arm the fix did not reach — the pattern the project's memory records for every gap-closure phase. WINDOWS.md rows 233, 234, 235.
  **Why deferred:** measurement round. Owner: the CAP-02 gap round — probe every ARM that consumes the changed value before marking the class closed.
