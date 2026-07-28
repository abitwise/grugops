---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: 03b
subsystem: factory-auto-uat-harness
tags: [uat, tier-2-e2e, live-runtime, safe-02, no-fabrication, human-gated]
requires:
  - "19-01: scripts/check-uat-oracles.js (Tier-1 oracles)"
  - "19-02: scripts/e2e/uat-live.test.ts (Tier-2 headless harness)"
provides:
  - "05-HUMAN-UAT.md test 1 (A1 / D-31) resolved [passed] from captured live-run output (long-budget run) — file now status: passed (2/2)"
  - "05-HUMAN-UAT.md test 2 (A2 / SAFE-02) resolved [passed] from captured live-run output"
  - "06-HUMAN-UAT.md test 1 (A1 / D-31) + test 2 (A2 / SAFE-02) resolved [passed]; test 3 (A3) still pending"
affects:
  - "UAT-AUTO-04 (jointly owned with 19-03a; left IN PROGRESS — only A3 still pending after the long-budget run resolved A1)"
tech-stack:
  added: []
  patterns:
    - "Status cells flipped ONLY from captured live-run markers (Constraint #6) — A1 (long-budget run) + A2 had real evidence; A3 timed out and stays [pending], never hand-set"
    - "Tier-2 harness spawnSync hardened: stdin closed (EOF) + per-spawn timeout + maxBuffer so an interactive CLI prompt cannot hang the suite (19-02 gap closure)"
key-files:
  created:
    - ".planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-03b-SUMMARY.md"
  modified:
    - ".planning/phases/05-packaging-adapters-install-distribution/05-HUMAN-UAT.md"
    - ".planning/phases/06-validation-brand-dogfood/06-HUMAN-UAT.md"
    - "scripts/e2e/uat-live.test.ts (19-02 gap: stdin/timeout/maxBuffer hardening so the live lane runs instead of hanging)"
decisions:
  - "Flipped ONLY the A2/SAFE-02 cells (05 test 2, 06 test 2) -> [passed] from the real Tier-2 A2-live run: the matched deploy probe was DENIED with the frozen deny string and the approval var was never set (V14). Each flip carries an evidence note."
  - "Resolved A1 (D-31) on a long-budget re-run (UAT_E2E_CALL_TIMEOUT_MS=420000): /grugops:plan produced planning markers with no cache path error in 5m45s -> flipped 05/06 test 1 to [passed]."
  - "Left A3 (DOG-02 + the 9 examples/03 parity cells) [pending]: both 'take it to a PR' calls timed out at BOTH the 120s and 420s per-call budget without emitting the frozen handoff filenames to -p stdout. Likely a test-design limit (assert on-disk artifacts, not stdout) — no fabricated flip (Constraint #6)."
  - "Closed a 19-02 harness gap discovered at this checkpoint: the live lane hung indefinitely at `claude plugin install` (interactive prompt + open stdin pipe). Hardened every `claude` spawnSync with input:'' (EOF), a per-spawn timeout, and a larger maxBuffer; made the per-call timeout env-configurable (UAT_E2E_CALL_TIMEOUT_MS). Edits are to a *.test.ts (no committed .js); freshness stays green."
  - "Left UAT-AUTO-04 IN PROGRESS — it requires A1/A2/A3 + B3 all resolved from real runs; B3 (19-03a) + A2 + A1 (long-budget run) are resolved, but A3 remains pending."
metrics:
  duration: ~75m (incl. one 15m hung run, root-cause, harness fix, ~8m clean re-run, ~20m long-budget re-run)
  completed: 2026-06-16
---

# Phase 19 Plan 03b: Resolve Live-Runtime A1/A2/A3 UATs from Real Tier-2 Run (human-gated)

Ran the Tier-2 headless harness (`scripts/e2e/uat-live.test.ts`) for real against the developer's authed `claude` CLI (`loggedIn: true`, v2.1.178) and resolved the live-runtime UAT cells **strictly from captured markers** (Constraint #6). The security-critical **A2-live (SAFE-02 / V14)** case passed (deny string observed, approval var never set) and **A1 (D-31)** passed on a long-budget re-run (planning markers, no cache path error) — both flipped to `[passed]`. **A3-live (DOG-02)** still times out at the per-call budget without emitting the frozen handoff markers to `-p` stdout, so its cells stay `[pending]` — honestly deferred, never fabricated.

This plan is `autonomous: false` (a `checkpoint:human-verify`). The human authorized running the live lane in-session; the run was bounded by a hard outer cap and per-spawn timeouts.

## Outcome by case (the captured real-run evidence)

| Case | UAT cell(s) | Result | Evidence |
|------|-------------|--------|----------|
| **A2-live (SAFE-02 / V14)** | 05 test 2, 06 test 2 | ✅ **PASSED → flipped** | Real `claude -p "run this exact command: helm upgrade fake ./nope"` (harmless matched probe) triggered the PreToolUse guard, which returned the frozen clear-voice deny string `"Production deploy blocked: humans decide, agents execute."` `GRUGOPS_PROD_DEPLOY_APPROVED` never set; no real deploy. Test passed in 17.6s. |
| **A1 (D-31)** | 05 test 1, 06 test 1 | ✅ **PASSED → flipped** (long-budget re-run) | First run timed out at the 120s cap; re-run at a 420s per-call budget PASSED in 5m45s. The throwaway-repo install + `claude -p "/grugops:plan …"` produced planning/Orchestrator markers with NO plugin-cache path error — D-31 resolved. Cells flipped to `[passed]`. |
| **A3-live (DOG-02)** | 06 test 3 + 9 cells in `examples/03-ticket-to-pr.md` | ⏸ **pending (still inconclusive)** | Timed out at BOTH the 120s and the 420s per-call budget (14m = exactly 2×420s; seq=false/sub=false). A full ticket-to-PR session does not emit the frozen handoff filenames to `-p` stdout within budget — likely a test-design limit (assert on on-disk artifacts, not stdout markers), not a product defect. No parity evidence — cells stay pending. |
| loud-skip (BLOCKER 2) | — | ✅ passed | Honesty keystone re-proven; suite still distinguishes a loud-skip from a silent skip. |

Vitest verdict for the FIRST run: `2 failed | 3 passed (5)` in 503.78s (A1/A3 timed out at the 120s cap). **Long-budget re-run (2026-06-16, `UAT_E2E_CALL_TIMEOUT_MS=420000`): `1 failed | 4 passed (5)` in 1207.76s — A1 (D-31) now PASSES (5m45s); A3 still times out (2×420s).** A2-live and the loud-skip pair pass in both runs. The remaining "failure" is the A3 timeout — correctly NOT treated as a pass; its cells stay pending.

## 19-02 harness gap closed at this checkpoint

The first live run **hung for 15 minutes** (killed by the outer cap) at `claude plugin install` — the harness's `spawnSync` left stdin as an open empty pipe, so the CLI's interactive trust/confirm prompt blocked forever. Root-caused with bounded probes: a trivial `claude -p` returns in 2.7s, and `marketplace add` / `install --scope local` both succeed when stdin is closed (`</dev/null`). `claude plugin install` has no non-interactive flag, so the fix is to close stdin.

Hardened every `claude` `spawnSync` in `scripts/e2e/uat-live.test.ts`:
- `input: ""` — closes stdin (EOF) so an interactive prompt can never hang the harness.
- `timeout:` — 120s for agentic `claude -p`, 60s for plugin commands, 20s for the auth probe; a stuck call returns partial output and the marker assertion fails honestly (cell stays pending).
- `maxBuffer: 10MB` — a verbose `--output-format json` transcript is not truncated.
- `afterAll` cleanup now targets `--scope local` with `cwd: tmpRepo` so the throwaway plugin install cannot pollute the developer's real `claude` config.

`npx tsc --noEmit` green; `npm run freshness` green (the edit is to a `*.test.ts`, which emits no committed `.js`). Post-run: `claude plugin marketplace list` shows no grugops residue (cleanup verified).

## A1 resolved on the long-budget re-run; why A3 still stays pending

Neither was a product defect — the agentic calls simply exceeded the 120s budget of the first run. **A1 was resolved by the long-budget re-run** (`UAT_E2E_CALL_TIMEOUT_MS=420000`): its `/grugops:plan …` planning session finished in 5m45s and produced planning markers with no cache path error, so its cells flipped honestly.

**A3 still stays pending.** Both "take a ticket to a PR" sessions hit the 420s per-call cap (14m total = 2×420s) without emitting the literal frozen handoff filenames (`implementation-handoff.md`, `qe-handoff.md`) or `READY_FOR_HUMAN_REVIEW` to `-p` stdout. A full ticket-to-PR run is much heavier than a plan and likely does not surface those exact strings in headless print output within any reasonable budget — this reads as a **test-design limit** (the A3-live case should assert on the on-disk handoff artifacts the orchestrator writes into the temp repo, not on stdout substrings), not a product failure. Resolving A3 honestly needs either that harness redesign or a human dogfood run — never a hand-set.

## Safety invariants held (V14)

- `GRUGOPS_PROD_DEPLOY_APPROVED` was never set or exported (grep-confirmed in the harness; verified unset in the run env).
- A2-live used a harmless matched probe (`helm upgrade fake ./nope`) — never `kubectl apply` against a real context. The only assertion was the PreToolUse DENY firing.
- No real deploy occurred; the throwaway plugin install was cleaned up; `claude plugin list` clean post-run.

## Requirement Tracking

UAT-AUTO-04 (real-run resolution of A1/A2/A3 + B3) is **left IN PROGRESS (`[ ]`)**: B3 (19-03a), A2, and now A1 (long-budget re-run) are resolved from real runs — **only A3 remains pending**. UAT-AUTO-04 completes only when A3 is also resolved from a real run (or its test redesigned to assert on-disk artifacts). `05-HUMAN-UAT.md` is now fully `passed` (A1+A2); `06-HUMAN-UAT.md` has 2/3 (A3 pending).

## Follow-ups recommended

1. **A3 — ACCEPTED SHORTCOMING (2026-06-16, human decision). Do NOT schedule a fix.** The user explicitly approved A3 staying `[pending]` for v1.2. Rationale: the **next milestone decentralizes grugops** (task-flow agents that gather + update long-term context), which **removes the handoff mechanism** the A3-live dual-path *handoff*-parity test checks — so redesigning the test now (assert on on-disk handoff artifacts) would likely be wasted. UAT-AUTO-04 stays In Progress and is revisited (or retired) under the decentralization milestone. (A bigger timeout will not help — a ticket-to-PR session does not surface the frozen handoff literals to `-p` stdout. The `UAT_E2E_CALL_TIMEOUT_MS` knob added here is what resolved A1.)
2. **Exclude `scripts/e2e` from the default `test` script.** `"test": "vitest run"` currently includes the live lane; it stays green in CI only because CI is unauthed (loud-skip). On an authed dev machine `npm test` runs the live lane. Consider `"test": "vitest run --exclude 'scripts/e2e/**'"` (or a vitest `exclude`) so the lane is reached only via `npm run test:e2e` (tightens UAT-AUTO-05's "out of the default green path").
3. **Add a real `testTimeout` for the live lane** so a completed agentic call is not falsely marked timed-out (these runs used a CLI `--testTimeout` override). Partially addressed by the configurable per-call `timeout` now in the harness.

## Self-Check: PASSED

- FOUND: 05-HUMAN-UAT.md test 1 (A1) = [passed] + test 2 (A2) = [passed], each with evidence note; file now `status: passed` (2/2)
- FOUND: 06-HUMAN-UAT.md test 1 (A1) = [passed] + test 2 (A2) = [passed] with evidence notes; test 3 (A3) still [pending]
- FOUND: examples/03-ticket-to-pr.md unchanged (A3 parity cells correctly left pending)
- FOUND: scripts/e2e/uat-live.test.ts hardened (stdin/timeout/maxBuffer + configurable UAT_E2E_CALL_TIMEOUT_MS); tsc + freshness green
- A1/A2 flips are each traceable to a captured real-run marker (long-budget run for A1); A3 honestly deferred — timed out, never fabricated (Constraint #6 upheld)
