# Deferred Items

- `scripts/freshness.test.ts` "Test 1 (control, real tree)" exceeds vitest's 5s default timeout
  status: open
  **What:** the case spawns `node scripts/freshness.js` and compares 60 committed `.js` files
  against a rebuild. On this machine the script takes 5.4s-6.7s, so the case fails on the 5000ms
  default timeout rather than on any drift.
  **Why it is out of scope for plan 31-01:** measured at the plan's base commit `109d5c7` in a
  detached worktree, before any file this plan touches was changed — `node scripts/freshness.js`
  took 5.409s there and `npx vitest run scripts/freshness.test.ts` failed the same case. The
  failure pre-exists this plan.
  **Remedy when picked up:** give that one case an explicit timeout argument sized to the real
  spawn cost, or reduce the per-file `git show` spawn count. The gate itself
  (`npm run freshness`) is green and reports all 60 outputs fresh.
