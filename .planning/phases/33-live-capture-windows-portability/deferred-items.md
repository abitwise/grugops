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
  status: open
  **Found during:** plan 33-04 Task 3 (2026-09-20), locating the six `expected null to be +0` sites RESEARCH names beside "the `tmpdir: status=0` versus `status=3` case".
  **What:** the R-5 ARM 1 case plants `TMPDIR: <absent path>` and expects the installer to refuse at exit 3. `os.tmpdir()` on win32 reads `TEMP`, then `TMP`, then `SystemRoot\temp` — never `TMPDIR` (node's own `os.tmpdir` source, read on this host) — so on windows-latest the dead root is never planted, the mirror lands in the real temp directory, and the installer exits 0. Same mechanism plan 33-04 closed in `scripts/generate-guarantees.test.ts` (`+0 not to be +0`) by setting `TMPDIR`, `TMP` and `TEMP` together and asserting the absence as a premise; no `process.platform` branch.
  **Why deferred:** `install/install.test.ts` is not in plan 33-04's `files_modified` (it is plan 33-06's file, whose Task 1 owns the install suite's windows classes); the fix is the same three-variable plant. Owner: plan 33-06, or the CAP-02 gap round after plan 33-09's pushed run measures it.
