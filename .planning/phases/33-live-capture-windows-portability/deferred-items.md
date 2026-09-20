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
  status: open
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
