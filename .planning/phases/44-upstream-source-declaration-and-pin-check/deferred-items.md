## Deferred Items

- Two adjacent byte-identical assertions in scripts/upstream-model.test.ts line 678 fail the foundation guard
  status: open
  **Found during:** plan 44-11, a targeted run of scripts/check-foundation-guards.test.ts (2026-11-25).
  **What:** The case "manifest: ordering: with two bad rows the first row's line is reported, the same on every parse" asserts `expect(malformedOf(text)).toEqual(want);` twice in a row. The guard tests "NO test module carries two adjacent byte-identical assertions" and "the tripwire PUBLISHES its denominator" in scripts/check-foundation-guards.test.ts both fail on it.
  **Origin:** commit 070d4efe (plan 44-10). Plan 44-11 does not touch scripts/upstream-model.test.ts, so it is out of scope there.
  **Fix:** Make the two parses distinct values (for example, parse twice into two names and compare the second to the first, then the first to `want`), so the case asserts "the same on every parse" without a byte-identical pair. Do not narrow the guard's classifier.
