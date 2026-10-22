# Phase 37 deferred items

## Deferred Items

- checkTickets in scripts/validate-agent-factory.ts opens every ticket `.md` with readFileSync, so a FIFO at a ticket path hangs the validator
  status: open
  **Found during:** plan 37-02, Task 2 (writing the FIFO case for checkBudgets)
  **What:** checkTickets lists `TICKETS_REL` and calls `stateRead` (readFileSync) on every name ending `.md`, with no regular-file check first. A FIFO there blocks the read forever. checkBudgets itself never opens a ticket (it takes the size from lstat), so the plan 37-02 FIFO case was placed in the NFR directory, which checkTickets does not read. The same pre-existing pattern applies to the board and the trace index when tickets exist.
  **Why deferred:** pre-existing behaviour of a check this plan does not own (scope boundary). A fix is a regular-file check before each read, the same `statSync(...).isFile()` guard checkBudgets uses.

- The progress roll (plan 37-11) needs each dated entry's extent, and LANG-07 allows that question exactly one owner
  status: open
  **Found during:** plan 37-05, Task 2 (the first GREEN run of the related censuses)
  **What:** plan 37-05 asked `progressEntries` to return each dated entry's span, "from its heading to the line before the next `##` heading". That is the section-extent question. `scripts/check-foundation-guards.test.ts` (LANG-07, SECTION_EXTENT_OWNERS) allows one owner for it, `scripts/frontmatter.ts` (`sectionEndIndex`), and says a second owner "is escalated, never added to this list". The span version made two new owners: `scripts/state-rules.ts` and its generated copy in `scripts/runnable-ref/state-check.ts`. Plan 37-05 therefore shipped `progressEntries` as classification only, `{ date, heading, line }` per dated entry and `{ heading, line }` per standing section. That is all state-check needs.
  **Why deferred:** plan 37-11's `planProgressRoll` must move whole entries, so it needs the extent. A host runnable can only get it by embedding `sectionEndIndex`'s closure from frontmatter.ts. The census reads every file in the tree, so that embedded copy would make `state-roll.ts` an owner too. Before 37-11 lands, a human has to decide one of two things: that a generated region, which the freshness gate proves is a verbatim copy, is not a second owner, or that the census should exclude generated regions. There is a precedent: the 37-03 decision lets some censuses admit a copy only inside a fresh region of an EMBED_SPECS target, but the LANG-07 census does not do that yet. Note also that frontmatter's `sectionEndIndex(text, from, 2)` is fence-aware and closes on level-1 headings as well, so it is not byte-for-byte the plan's "next `##` heading" rule.
