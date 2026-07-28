# Deferred items — phase 25-governance-on-a-dial

Out-of-scope discoveries logged during execution (GSD scope-boundary rule). Not fixed here.

## 25-09 — floor-invariance.test.ts spawn-heavy fuzz timeouts (environmental, pre-existing)

- **Where:** `scripts/floor-invariance.test.ts` — the two "modifier-operand fuzz" cases
  (the ALLOW no-over-block case at ~L923 and one sibling) under the
  "SC1 anti-whack-a-mole (25-07) — leading-run command-RESOLUTION class invariant" describe.
- **Symptom:** `Error: Test timed out in 5000ms.` Each case child-spawns the committed
  `admission-guard.js` hook 6×8×3 = 144 times; on a loaded / slower machine 144 `node`
  process spawns exceed vitest's default 5s per-test timeout.
- **Evidence it is NOT a logic failure and NOT caused by 25-09:**
  - Re-running with `--testTimeout=30000` → **176/176 pass**.
  - The failing case is the ALLOW path (`node render` commands with no admit shape); it
    spawns only the hook and never invokes `context-io.js`, so the 25-09 additive
    `context-io` exports cannot affect it.
  - 25-09 changes are additive to `context-io.ts`/`.js` only; `floor-invariance.test.ts`
    is untouched.
- **Suggested future fix (separate, owner of 25-07 fuzz suite):** pin an explicit larger
  `testTimeout` on the spawn-heavy fuzz cases (or reduce per-case spawn count), so the
  suite is robust on slower CI/dev hardware.
