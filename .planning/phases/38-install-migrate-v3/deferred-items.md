## Deferred Items

- A code span holding `<!-- RUN -->` in a Done board row blocks the whole Done roll
  status: open
  **What:** found by the plan 38-11 dogfood (38-DOGFOOD.md, finding C). The Done row ABC-109 of the real repository
  holds the text `<!-- RUN -->` inside backticks. The phase 37 state-rules planner reads it as an HTML comment and
  refuses to move the row, so `install --migrate` skips the Done roll (with a note) and `state-roll.js` refuses with
  exit 2. The board stays at 221,821 bytes with 205 Done rows; with that text replaced, the roll moves 185 rows and
  leaves 36,959 bytes.
  **Why deferred:** the comment rule belongs to the phase 37 state rules (`scripts/state-rules.ts`), not to this
  phase's code, and whether a code span should count as a comment is a design question (`UNKNOWN - verify`).

- The rendered trace depends on which context root holds a task
  status: open
  **What:** found by the plan 38-11 dogfood (38-DOGFOOD.md, finding B). `collectTraceNotes` reads the live root, then
  the archive root, and a ticket's refs are listed in the order they are first read, so moving a folder between the
  roots can reorder a trace file. Plan 38-11 made every install arm that moves a folder render the trace afterwards
  (`2f8f8b65`). Any other move (by hand, or by a later tool) still leaves the trace stale until the next render, which
  `state-check` reports as `trace-stale`.
  **Why deferred:** making the order independent of the root changes the phase 37 trace model and its embedded
  copies; it is not local to this phase.
