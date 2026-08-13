---
kind: workflow
order: 17
cadence: both
---
# Workflow: task claim + schedule

## When to use
Whenever a role is about to take ownership of a queued subtask, or the coordinator is about to schedule the queue. This workflow is the single source of the claim+schedule protocol. The protocol covers how a pending subtask is claimed exactly once and how it transitions pending → claimed → done. It also covers how a stale claim is reclaimed. Every role references this file rather than restating — there is one protocol, named here, not forked into each role.

It builds directly on `agent-factory/workflows/16-context-read-write.md` (the read/write/admission protocol) for all note I/O and does not restate it. The claim layer owns work-ownership; WF16 owns what enters the shared verified context.

## Agents involved
- Every role that takes a queued subtask. Like Workflow 16 this is a seam, not an SDLC stage: it has no owning specialist. Whichever role is about to take ownership runs this protocol, then returns to the workflow it came from.
- The coordinator, in one extra capacity only: it schedules the queue and runs the wall-clock stale-claim sweep. It does not claim on another role's behalf and it does not adjudicate a lost claim.

## Inputs required
- The queue root and the subtask id under `pending/`.
- The subtask's existing shared verified context, read per Workflow 16 before the claim.
- `queue.stale_ttl_minutes` from `.grugops/factory.config.json` — the TTL the coordinator's sweep derives `ttlMs` from.
- The claiming identity (`by`) written into the now-running registry record.

## The claim/note seam
Two distinct things, never blurred:

- **The queue CLAIM** — hard work-ownership via an atomic directory create (`scripts/claim.js` `claimTask`). The claim directory's existence IS the claim; there is no central lock manager. The claim is the concurrency net under the substrate: a task is claimed exactly once, so within-task context writing is single-writer.
- **The `claim` note-KIND** (WF16 / `context-io.ts`) — a soft, unverified assertion in the shared context. It is unrelated to the queue claim and shares no code path. The now-running registry record (`claimed/<task>/claim.md`) is NOT a `kind: claim` note.

The queue owns ownership; WF16 owns memory. Never write the shared context by claiming, and never claim by writing a note.

## Steps
Run these in order.

1. Read the subtask's shared context per WF16 (`readContext` / `render`) before claiming. Start from the verified findings, decisions, and recorded failed attempts, not a blank slate. Do not re-derive what the context already holds; do not retry a recorded failed attempt.

2. Claim a pending subtask atomically via `scripts/claim.js` `claimTask(queueRoot, task, by)`. The first claimant's atomic `mkdirSync` of `claimed/<task>/` wins and returns true. It writes the now-running registry record `claimed/<task>/claim.md` (`by` / `at` / `task`). A second claimant gets `EEXIST` = claim lost, and returns false — NOT an error. ANY other code (parent-missing, permission) is a genuine failure and is rethrown. If the claim is lost, move to the next pending task — never two agents on one task.

3. Transition the subtask file `pending/<task>.md` → `claimed/<task>/<task>.md` by `claim.js` `transition` (atomic rename). The claim directory already exists, because step 2 created it.

4. Implement the subtask. Write only after you verify. Record results into the shared verified context ONLY via WF16 (`context-io.ts` `appendNote`) under the honest note kind. A `finding` needs a real stamp; soft results go in as `claim` / `observation`. The admission rules live in WF16; this workflow references them and does not restate them. Coordination is ONLY through the on-disk substrate — never relay data agent-to-agent.

5. Mark the subtask done. Transition `claimed/<task>/<task>.md` → `done/<task>.md` by `claim.js` `transition` (atomic rename) once the work is recorded and verified.

6. Run the coordinator's stale-claim sweep periodically — `claim.js` `sweepStale(queueRoot, ttlMs)`, with `ttlMs` derived from `queue.stale_ttl_minutes`. A claim whose `claim.md` `at` is older than the TTL is reclaimed, and so is a tampered multi-`at` record. The subtask returns to `pending/` (atomic rename) and the claim directory is released. Wall-clock TTL only; no pid/host liveness. A fresh claim is left untouched (the sweep is conservative and has a real no-op path).

## Stop conditions
- The claim is lost (`claimTask` returns false / `EEXIST`) → do not proceed on that task; move to the next pending task. Do not retry the same claim in a tight loop.
- `claimTask` throws any code other than `EEXIST` (parent missing, permission) → stop; a real error is never swallowed into a false "lost". Surface it.
- A result cannot be honestly admitted by WF16 (no real stamp, budget exhausted) → stop and hand to a human per WF16. Do not fake a stamp; do not mark the task done on an unverified result.

## Board moves
None of its own. The queue and `plans/board.md` are two different substrates and must never be conflated. The queue tracks subtask ownership (pending → claimed → done) inside one ticket's work, while the board tracks the ticket through the delivery columns. Claiming a subtask does not move a ticket, and moving a ticket does not claim anything. The board move belongs to the invoking workflow.

## Trace updates
None of its own. Ownership is not part of the requirement→code→test→release trail — `plans/traceability.md` records what was built and verified, not who picked it up. The now-running registry record (`claimed/<task>/claim.md`) is the ownership record and is complete on its own. Any trace row this subtask's results deserve is appended by the invoking workflow from the notes admitted per Workflow 16.

## Done condition
The subtask was claimed exactly once (atomic `mkdirSync`), and transitioned pending → claimed → done by atomic rename. Its results were recorded only through WF16 (`context-io.ts`) under an honest kind. No data was relayed agent-to-agent — coordination flowed only through the on-disk queue and shared context. Any stale or tampered claim was reclaimed by the coordinator's wall-clock sweep.

## Commit
Commit the queue and context state this workflow advanced per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The artifacts are the moved subtask records and any `notes/` / derived `index.*` that `context-io.ts` produced. This workflow claims and schedules work; it never merges and never deploys — humans hold both.
