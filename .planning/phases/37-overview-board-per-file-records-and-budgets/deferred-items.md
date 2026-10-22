# Phase 37 deferred items

## Deferred Items

- checkTickets in scripts/validate-agent-factory.ts opens every ticket `.md` with readFileSync, so a FIFO at a ticket path hangs the validator
  status: open
  **Found during:** plan 37-02, Task 2 (writing the FIFO case for checkBudgets)
  **What:** checkTickets lists `TICKETS_REL` and calls `stateRead` (readFileSync) on every name ending `.md`, with no regular-file check first. A FIFO there blocks the read forever. checkBudgets itself never opens a ticket (it takes the size from lstat), so the plan 37-02 FIFO case was placed in the NFR directory, which checkTickets does not read. The same pre-existing pattern applies to the board and the trace index when tickets exist.
  **Why deferred:** pre-existing behaviour of a check this plan does not own (scope boundary). A fix is a regular-file check before each read, the same `statSync(...).isFile()` guard checkBudgets uses.
