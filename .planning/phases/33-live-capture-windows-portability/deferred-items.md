# Phase 33 — Deferred Items

Out-of-scope observations made during execution. Each entry stays open until it carries an
explicit `status: resolved`.

## Deferred Items

- `scripts/board-watch-live.test.ts` DASH-04 debounce case missed its 700 ms wall-clock window once
  status: open
  **Found during:** plan 33-01 plan-level verification, the second full-lane run (2026-09-19, darwin/arm64, node v24.12.0).
  **What:** `coalesces 5 atomic-rename writes into FEWER documents, and at least one` reported `no document arrived in the 700 ms after 5 real writes`. The same case was green on the first full-lane run minutes earlier and green in isolation (6/6, 7.56 s) immediately after. No file in plan 33-01's diff is in that test's closure (`board-dashboard.ts`, `board-watch.ts`, the test itself are untouched).
  **Why deferred:** a wall-clock `fs.watch` measurement on a loaded host, not a defect this plan introduced; the test is unconditional by design (CONTEXT D-16, WINDOWS.md row 186 rule) and RESEARCH assumption A5 already records that its timing sits behind a different set of neighbours under `fileParallelism: false`. Owner: the CAP-02 plans (33-02 D-14 bounds, 33-09 pushed CI run), which measure this on both CI legs.
