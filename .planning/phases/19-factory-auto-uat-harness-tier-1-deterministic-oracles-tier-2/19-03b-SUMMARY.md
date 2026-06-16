---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: 03b
subsystem: factory-auto-uat-harness
tags: [uat, tier-2-e2e, live-runtime, safe-02, no-fabrication, human-gated]
requires:
  - "19-01: scripts/check-uat-oracles.js (Tier-1 oracles)"
  - "19-02: scripts/e2e/uat-live.test.ts (Tier-2 headless harness)"
provides:
  - "05-HUMAN-UAT.md test 2 (A2 / SAFE-02) resolved [passed] from captured live-run output"
  - "06-HUMAN-UAT.md test 2 (A2 / SAFE-02) resolved [passed] from captured live-run output"
affects:
  - "UAT-AUTO-04 (jointly owned with 19-03a; left IN PROGRESS — A1/A3 still pending, see below)"
tech-stack:
  added: []
  patterns:
    - "Status cells flipped ONLY from captured live-run markers (Constraint #6) — A2 had real evidence; A1/A3 timed out and stay [pending], never hand-set"
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
  - "Left A1 (D-31) and A3 (DOG-02 + the 9 examples/03 parity cells) [pending]: both agentic claude -p calls hit the 120s per-spawn budget and returned EMPTY output (timeout/inconclusive, not a genuine product failure). No fabricated flip (Constraint #6)."
  - "Closed a 19-02 harness gap discovered at this checkpoint: the live lane hung indefinitely at `claude plugin install` (interactive prompt + open stdin pipe). Hardened every `claude` spawnSync with input:'' (EOF), a per-spawn timeout, and a larger maxBuffer. Edit is to a *.test.ts (no committed .js); freshness stays green."
  - "Left UAT-AUTO-04 IN PROGRESS — it requires A1/A2/A3 + B3 all resolved from real runs; B3 (19-03a) + A2 (here) are resolved, but A1/A3 remain pending."
metrics:
  duration: ~45m (incl. one 15m hung run, root-cause, harness fix, ~8m clean re-run)
  completed: 2026-06-16
---

# Phase 19 Plan 03b: Resolve Live-Runtime A1/A2/A3 UATs from Real Tier-2 Run (human-gated)

Ran the Tier-2 headless harness (`scripts/e2e/uat-live.test.ts`) for real against the developer's authed `claude` CLI (`loggedIn: true`, v2.1.178) and resolved the live-runtime UAT cells **strictly from captured markers** (Constraint #6). The security-critical **A2-live (SAFE-02 / V14)** case passed with genuine evidence and its cells are flipped to `[passed]`. **A1 (D-31)** and **A3-live (DOG-02)** timed out at the per-call budget and produced no markers, so their cells stay `[pending]` — honestly deferred, never fabricated.

This plan is `autonomous: false` (a `checkpoint:human-verify`). The human authorized running the live lane in-session; the run was bounded by a hard outer cap and per-spawn timeouts.

## Outcome by case (the captured real-run evidence)

| Case | UAT cell(s) | Result | Evidence |
|------|-------------|--------|----------|
| **A2-live (SAFE-02 / V14)** | 05 test 2, 06 test 2 | ✅ **PASSED → flipped** | Real `claude -p "run this exact command: helm upgrade fake ./nope"` (harmless matched probe) triggered the PreToolUse guard, which returned the frozen clear-voice deny string `"Production deploy blocked: humans decide, agents execute."` `GRUGOPS_PROD_DEPLOY_APPROVED` never set; no real deploy. Test passed in 17.6s. |
| **A1 (D-31)** | 05 test 1, 06 test 1 | ⏸ **pending (inconclusive)** | Both `claude -p` planning calls hit the 120s per-spawn cap; captured output empty. A timeout, not a cache-path-error failure — cannot honestly flip. |
| **A3-live (DOG-02)** | 06 test 3 + 9 cells in `examples/03-ticket-to-pr.md` | ⏸ **pending (inconclusive)** | Both `claude -p` "take it to a PR" calls timed out at 120s (seq=false/sub=false = empty output). No parity evidence — cells stay pending. |
| loud-skip (BLOCKER 2) | — | ✅ passed | Honesty keystone re-proven; suite still distinguishes a loud-skip from a silent skip. |

Vitest verdict for the run: `2 failed | 3 passed (5)` in 503.78s. The two "failures" are the A1/A3 timeouts (empty captured output) — correctly NOT treated as passes; the cells stay pending.

## 19-02 harness gap closed at this checkpoint

The first live run **hung for 15 minutes** (killed by the outer cap) at `claude plugin install` — the harness's `spawnSync` left stdin as an open empty pipe, so the CLI's interactive trust/confirm prompt blocked forever. Root-caused with bounded probes: a trivial `claude -p` returns in 2.7s, and `marketplace add` / `install --scope local` both succeed when stdin is closed (`</dev/null`). `claude plugin install` has no non-interactive flag, so the fix is to close stdin.

Hardened every `claude` `spawnSync` in `scripts/e2e/uat-live.test.ts`:
- `input: ""` — closes stdin (EOF) so an interactive prompt can never hang the harness.
- `timeout:` — 120s for agentic `claude -p`, 60s for plugin commands, 20s for the auth probe; a stuck call returns partial output and the marker assertion fails honestly (cell stays pending).
- `maxBuffer: 10MB` — a verbose `--output-format json` transcript is not truncated.
- `afterAll` cleanup now targets `--scope local` with `cwd: tmpRepo` so the throwaway plugin install cannot pollute the developer's real `claude` config.

`npx tsc --noEmit` green; `npm run freshness` green (the edit is to a `*.test.ts`, which emits no committed `.js`). Post-run: `claude plugin marketplace list` shows no grugops residue (cleanup verified).

## Why A1/A3 stayed pending (and how to resolve them later)

Not a product defect — the agentic calls simply exceeded the 120s per-spawn budget chosen to keep this run bounded. A1's `/grugops:plan …` and A3's "take a ticket to a PR" each drive a full Claude Code session that can take several minutes. Resolving them honestly needs a longer per-call budget (and, for A3, confirmation that the orchestrator emits the literal frozen handoff filenames + `READY_FOR_HUMAN_REVIEW` in headless `-p` output). That is a follow-up real run, not a hand-set.

## Safety invariants held (V14)

- `GRUGOPS_PROD_DEPLOY_APPROVED` was never set or exported (grep-confirmed in the harness; verified unset in the run env).
- A2-live used a harmless matched probe (`helm upgrade fake ./nope`) — never `kubectl apply` against a real context. The only assertion was the PreToolUse DENY firing.
- No real deploy occurred; the throwaway plugin install was cleaned up; `claude plugin list` clean post-run.

## Requirement Tracking

UAT-AUTO-04 (real-run resolution of A1/A2/A3 + B3) is **left IN PROGRESS (`[ ]`)**: B3 (19-03a) and A2 (here) are resolved from real runs, but A1 and A3 remain pending. UAT-AUTO-04 completes only when A1 and A3 are also resolved from a real run.

## Follow-ups recommended (not done here — out of 19-03b scope)

1. **Resolve A1 + A3** via a real run with a longer per-call timeout budget (a gap-closure plan against UAT-AUTO-04).
2. **Exclude `scripts/e2e` from the default `test` script.** `"test": "vitest run"` currently includes the live lane; it stays green in CI only because CI is unauthed (loud-skip). On an authed dev machine `npm test` now runs the ~8-min live lane. Consider `"test": "vitest run --exclude 'scripts/e2e/**'"` (or a vitest `exclude`) so the lane is reached only via `npm run test:e2e` (tightens UAT-AUTO-05's "out of the default green path").
3. **Add a real `testTimeout` for the live lane** so a completed agentic call is not falsely marked timed-out (this run used a CLI `--testTimeout` override).

## Self-Check: PASSED

- FOUND: 05-HUMAN-UAT.md test 2 (A2) = [passed] with evidence note; test 1 (A1) still [pending]
- FOUND: 06-HUMAN-UAT.md test 2 (A2) = [passed] with evidence note; tests 1 (A1) & 3 (A3) still [pending]
- FOUND: examples/03-ticket-to-pr.md unchanged (A3 parity cells correctly left pending)
- FOUND: scripts/e2e/uat-live.test.ts hardened (stdin/timeout/maxBuffer); tsc + freshness green
- A2 flips are each traceable to the captured deny-string marker; A1/A3 honestly deferred (Constraint #6 upheld)
