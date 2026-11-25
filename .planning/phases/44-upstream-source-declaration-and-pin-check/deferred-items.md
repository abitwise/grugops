## Deferred Items

- Two adjacent byte-identical assertions in scripts/upstream-model.test.ts line 678 fail the foundation guard
  status: resolved (orchestrator fix after wave 3, 2026-11-25: the case now parses twice into two names, checks the first against `want` and the second against the first; check-foundation-guards.test.ts and upstream-model.test.ts pass 551 of 551)
  **Found during:** plan 44-11, a targeted run of scripts/check-foundation-guards.test.ts (2026-11-25).
  **What:** The case "manifest: ordering: with two bad rows the first row's line is reported, the same on every parse" asserts `expect(malformedOf(text)).toEqual(want);` twice in a row. The guard tests "NO test module carries two adjacent byte-identical assertions" and "the tripwire PUBLISHES its denominator" in scripts/check-foundation-guards.test.ts both fail on it.
  **Origin:** commit 070d4efe (plan 44-10). Plan 44-11 does not touch scripts/upstream-model.test.ts, so it is out of scope there.
  **Fix:** Make the two parses distinct values (for example, parse twice into two names and compare the second to the first, then the first to `want`), so the case asserts "the same on every parse" without a byte-identical pair. Do not narrow the guard's classifier.

- The ticket-frontmatter reader census in scripts/validate.test.ts counts both upstream test files as extra carriers
  status: open
  **Found during:** plan 44-14, the plan-level run of `npx vitest run scripts/validate.test.ts` (2026-11-25). Earlier round-1 summaries ran only `-t upstream` in that file.
  **What:** 4 tests in the describe "exactly ONE ticket-frontmatter reader exists in scripts/ (32-12, widened 32-21, 32-36)" fail: "TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts", "the exemption set has exactly the DERIVED members", "with NO plant, the carrier count is exactly one", and "ADJACENCY: two readers differing only in key spelling count as TWO" (expected 3, received 5). The census derives `runnable-ref/upstream.test.ts` and `upstream-model.test.ts`, which the exemption registry (validate.test.ts near line 2040) does not list. For upstream-model.test.ts it names key line 577 (`column` via the ID-cell reason text) and key line 589 (`status` via "manifest: status %j is malformed").
  **Origin:** not bisected. Plan 44-14 changed no file under scripts/ (`git diff --stat` from its ledger base is empty), so it is out of scope there. The pre-round phase-gate full run (44-VALIDATION.md) had only the installer-fs-census failure, so it most likely arose in round 1, with the cell-text and positional-reason tests of plan 44-10.
  **Fix:** Decide per file whether it is a real second reader. These test files quote reason text that holds the words `column` and `status`; they do not read ticket frontmatter. If so, add each to the exemption registry with its reason written out, as the registry's own message asks. Do not narrow the census.
