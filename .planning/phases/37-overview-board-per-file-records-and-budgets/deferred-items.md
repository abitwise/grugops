# Phase 37 deferred items

## Deferred Items

- checkTickets in scripts/validate-agent-factory.ts opens every ticket `.md` with readFileSync, so a FIFO at a ticket path hangs the validator
  status: open
  **Found during:** plan 37-02, Task 2 (writing the FIFO case for checkBudgets)
  **What:** checkTickets lists `TICKETS_REL` and calls `stateRead` (readFileSync) on every name ending `.md`, with no regular-file check first. A FIFO there blocks the read forever. checkBudgets itself never opens a ticket (it takes the size from lstat), so the plan 37-02 FIFO case was placed in the NFR directory, which checkTickets does not read. The same pre-existing pattern applies to the board and the trace index when tickets exist.
  **Why deferred:** pre-existing behaviour of a check this plan does not own (scope boundary). A fix is a regular-file check before each read, the same `statSync(...).isFile()` guard checkBudgets uses.

- The progress roll (plan 37-11) needs each dated entry's extent, and LANG-07 allows that question exactly one owner
  status: resolved (D-16, plan 37-11, 2026-10-22: the generated copy of sectionEndIndex in state-roll.ts is admitted only inside a fresh region of an EMBED_SPECS target; the planner takes the extent function as a parameter)
  **Found during:** plan 37-05, Task 2 (the first GREEN run of the related censuses)
  **What:** plan 37-05 asked `progressEntries` to return each dated entry's span, "from its heading to the line before the next `##` heading". That is the section-extent question. `scripts/check-foundation-guards.test.ts` (LANG-07, SECTION_EXTENT_OWNERS) allows one owner for it, `scripts/frontmatter.ts` (`sectionEndIndex`), and says a second owner "is escalated, never added to this list". The span version made two new owners: `scripts/state-rules.ts` and its generated copy in `scripts/runnable-ref/state-check.ts`. Plan 37-05 therefore shipped `progressEntries` as classification only, `{ date, heading, line }` per dated entry and `{ heading, line }` per standing section. That is all state-check needs.
  **Why deferred:** plan 37-11's `planProgressRoll` must move whole entries, so it needs the extent. A host runnable can only get it by embedding `sectionEndIndex`'s closure from frontmatter.ts. The census reads every file in the tree, so that embedded copy would make `state-roll.ts` an owner too. Before 37-11 lands, a human has to decide one of two things: that a generated region, which the freshness gate proves is a verbatim copy, is not a second owner, or that the census should exclude generated regions. There is a precedent: the 37-03 decision lets some censuses admit a copy only inside a fresh region of an EMBED_SPECS target, but the LANG-07 census does not do that yet. Note also that frontmatter's `sectionEndIndex(text, from, 2)` is fence-aware and closes on level-1 headings as well, so it is not byte-for-byte the plan's "next `##` heading" rule.

- `node scripts/check-diff-disposition.js` exits 1 on the live tree with 707 findings over 40 watched files
  status: open
  **Found during:** plan 37-18, Task 1 (an extra gate run beyond the plan's gate list)
  **What:** the gate reads every clause changed in its watched corpus since base `4d2b8f0` and wants a row for each under `docs/audit/29-style-dispositions/`. Phase 37's role, workflow, README and AGENTS.md rewrites (plans 37-14 to 37-18) and earlier phases' edits have no disposition rows, so 707 clauses are undispositioned. Plan 37-18's AGENTS.md lines 21, 93 and 95 are among them. `scripts/check-diff-disposition.test.ts` passes: it drives planted repositories, not the live tree.
  **Why deferred:** pre-existing and phase-wide. No phase-37 plan lists this gate, and writing 707 disposition rows, or moving the base, is a decision for the phase gate (37-19) or a human.
  **37-19 note (2026-10-22):** still 707 findings over 40 elements after plan 37-19. None of the nine files plan 37-19 changed is in the watched corpus, so the plan added no finding. The decision stays with a human.

- The ubuntu-block reader census in scripts/check-foundation-guards.test.ts (UBUNTU_BLOCK_READER_COUNT, the class negative) lists only top-level `scripts/*.test.ts`
  status: open
  **Found during:** plan 37-19, Task 2 (wiring the own-tree state-check case)
  **What:** the census uses a non-recursive `readdirSync(scripts)`. A test file under `scripts/runnable-ref/` that spelled its own copy of the ubuntu step name would not be refused, and one that imports `scripts/ci-workflow.testkit.ts` is not counted. Plan 37-19's case in `scripts/runnable-ref/state-check.test.ts` imports the authority, so it obeys the class rule, but the pin stays at 6 because the census does not see the file.
  **Why deferred:** changing the census's scope changes a guard outside this plan's files. The fix is to derive the member set from a recursive listing of tracked `scripts/**/*.test.ts` and move the pin by listing (6 -> 7).

- EXIT-1 siblings outside phase 37
  status: open
  **Found during:** plan 37-20, Task 2 (the EXIT-1 class search, re-run before writing this entry)
  **What:** each of these programs' headers promises exit 2 for could-not-run, and none has a test that forces a throw past its inner catches, so none is proven to keep an unexpected throw off exit 1: `scripts/runnable-ref/reference-check.ts`, `scripts/runnable-ref/test-skip-integrity.ts`, `scripts/runnable-ref/uat-spec-integrity.ts`, `scripts/board-dashboard.ts`, `scripts/runnable-ref/host-protection.ts`, and `scripts/check-state-paths.ts` with `scripts/state-path-scan.ts` (the module that states its 0/1/2 convention). Seen without running a test: host-protection.ts already registers a process-level uncaughtException handler (line 220 at d9fa837c) that prints its could-not-run line and exits 2; check-state-paths.ts runs its body inside a try whose catch exits 2, and the output tail after that try is not covered. The re-run search (headers' first 80 lines holding `exit 2`, `exits 2` or `could not run`, over tracked non-test `.ts` under scripts/, install/ and hooks/) found no program beyond plan 37-20's class table; board-dashboard.ts states its exit-2 rule below line 80 (line 167) and is kept on the list. The phase-37 runnables (trace-render, state-check, state-roll) are covered by `scripts/runnable-ref/runnable-exit-contract.test.ts`.
  **Why deferred:** not phase-37 code and no 37-REVIEW finding, so out of gap round 1 scope (D-17). The harness `scripts/fault-inject.test-support.ts` (`runFaulted` with a `stdout-throw` spec) can drive the same table over these programs. For human triage.
