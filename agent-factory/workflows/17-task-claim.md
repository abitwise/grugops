---
kind: workflow
order: 17
cadence: both
---
# Workflow: task claim + schedule

## When to use
Whenever the Orchestrator schedules the queue, or a role takes or finishes a queued subtask. This workflow is the single source of the claim+schedule protocol. The protocol covers how a pending subtask is claimed exactly once and how it transitions pending → claimed → done. It also covers how a stale claim is reclaimed. It also covers how the Orchestrator keeps capacity full and when it compacts its session. Every role references this file rather than restating — there is one protocol, named here, not forked into each role.

It builds directly on `agent-factory/workflows/16-context-read-write.md` (the read/write/admission protocol) for all note I/O and does not restate it. The claim layer owns work-ownership; WF16 owns what enters the shared verified context.

## Agents involved
- Every role that takes a queued subtask. Like Workflow 16 this is a seam, not an SDLC stage: it has no owning specialist. The role owns its own work and its own status, then returns to the workflow it came from.
- The Orchestrator: it schedules the queue, claims at dispatch in the adapter's name, refills free capacity and runs the session-start sweep. It does not adjudicate a lost claim.

**Decision (Phase 41, D-04, human, 2026-11-04).** The Orchestrator claims at dispatch, on the agent's behalf. This reverses the earlier rule that it never claims on another role's behalf. The `claimed/` count read from disk is then right the moment an agent starts, so a refill cannot over-spawn.

## Inputs required
- The queue root and the subtask id under `pending/`.
- The subtask's existing shared verified context, read per Workflow 16 before the work starts.
- `queue.wip_limit` and `queue.stale_ttl_minutes` from `.grugops/factory.config.json`, read by `tools/grugops/claim.js`. A missing or malformed value falls back to its documented default, and the command says so.
- The adapter name (`--by`), and the level (`--level`) for a level adapter. Where the `Agent` tool does not exist, use the adapter name all the same: `grugops-<role-stem>`, or `grugops-software-engineer-<level>` for the engineer.

## The claim/note seam
Two distinct things, never blurred:

- **The queue CLAIM** — hard work-ownership via an atomic directory create (`tools/grugops/claim.js claim`). The claim directory's existence IS the claim; there is no central lock manager. The claim is the concurrency net under the substrate: a task is claimed exactly once, so within-task context writing is single-writer.
- **The `claim` note-KIND** (WF16 / `context-io.ts`) — a soft, unverified assertion in the shared context. It is unrelated to the queue claim and shares no code path. The now-running registry record (`claimed/<task>/claim.md`) is NOT a `kind: claim` note.

The record `claimed/<task>/claim.md` carries `by`, `at` and `task`, plus optional `agent` and `level` lines. `by` stays for its three readers: the render, the sweep and the board reader. A record with no `agent` or `level` line stays valid. More than one `at:` line marks a tampered record. `tools/grugops/claim.js` refuses `--by grugops-orchestrator`, in any letter case. That refusal is an instruction backstop, not a security boundary.

The queue owns ownership; WF16 owns memory. Never write the shared context by claiming, and never claim by writing a note.

## Platform depth and width
Width is how many role agents run at once. Depth is how many layers a spawned agent may spawn below it. The two are separate limits.

- Width: the Orchestrator never runs more agents at once than `queue.wip_limit` (default 3).
- Claude Code runs 20 concurrent subagents by default (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) and sets no session total. The grugops width cap is a discipline choice far inside that ceiling, not a result of the depth limit.
- A resume skips that host check. The `claimed/` count read from disk stays the only width that counts.
- Depth: Claude Code nests subagents three layers below the main conversation by default. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` sets the depth.
- The three-layer default arrived in v2.1.219. Versions v2.1.217 and v2.1.218 defaulted to one layer, so nesting is off and a coordinator there spawns nothing.
- On those versions the host version is the cause, not grugops.
- At the depth limit the platform withholds `Agent` rather than raising an error. A role agent at that depth does the work itself, a correct silent degrade.
- Depth and width bound nested spawning; no nested allowlist does.

## Steps
Run these in order, from the repository root. `<task>` is the subtask id.

1. Write each subtask to `pending/<task>.md` as exactly two lines (Orchestrator). A re-queued subtask keeps the `ref:` of its per-task context.
   - Set line one to `# subtask <task>`.
   - Set line two to the task's context folder: `ref: .grugops/context/abc-104/` for task `abc-104`.

2. Run `node tools/grugops/claim.js free` (Orchestrator). It prints `free N`: `queue.wip_limit` minus the `claimed/` count read from disk. Trust that number, never a remembered count of running agents.

3. Claim each subtask just before its dispatch (Orchestrator). Run `node tools/grugops/claim.js claim <task> --by <adapter>`. Add `--level <level>` for a level adapter. The command makes `claimed/<task>/` atomically, writes `claim.md`, moves the subtask in and re-renders `now-running.md`. Exit 0 prints `claimed <task> by <adapter>`. Exit 1 prints `lost <task>`: a lost claim is NOT an error, so take the next pending task. Never put two agents on one task. Any other exit is a genuine failure: stop and surface it.

4. Hand the subtask to the adapter named in `--by` (Orchestrator). Where the `Agent` spawn tool exists, spawn that adapter with the task reference and nothing else. Start a tiered engineer by adapter name, as a non-fork sub-agent. Pass no `model` or `effort` parameter on the spawn call. Where the tool does not exist, switch role per `agent-factory/roles/_role-switch-protocol.md`.

5. Read the subtask's shared context per WF16 (`readContext` / `render`) before the work starts (role). Start from the verified findings, decisions, and recorded failed attempts, not a blank slate. Do not re-derive what the context already holds; do not retry a recorded failed attempt.

6. Implement the subtask (role). Write only after you verify. Record results into the shared verified context ONLY via WF16 (`context-io.ts` `appendNote`) under the honest note kind. A `finding` needs a real stamp; soft results go in as `claim` / `observation`. Evidence pointing at a committed UAT spec goes in as an `artifact-ref`. It carries `sha`, `gate_run` and `content_hash`. `appendNote` consults the admission authority for EVERY note it takes, whatever its kind. A `finding` stamped `§14-gate#<id>` is admitted only against a live green verdict with that per-run id. An `artifact-ref` is admitted only against a live green verdict for its `gate_run`. Anything the authority refuses is refused here, and nothing is written. The admission rules live in WF16; this workflow references them and does not restate them. Coordination is ONLY through the on-disk substrate — never relay data agent-to-agent.

7. Run `node tools/grugops/claim.js done <task>` as the role's last act, once its notes are published (role). It moves the subtask to `done/`, releases the claim directory and re-renders `now-running.md`. It refuses with exit 1 when the task's context folder holds no sealed note since the claim's `at`. Its line names any unsealed notes it found. Publish what is missing, then run it again. Never move a subtask by hand.

8. Verify each close when the agent returns (Orchestrator). Confirm `done/<task>.md` exists and the notes are published. A task still in `claimed/` follows `## Keep capacity full`.

## Keep capacity full
A refill runs on every agent return or completion notice and on every user turn. No timer and no polling drives it. The same text holds on every host: the rules turn on whether the `Agent` spawn tool exists, never on a host name.

- Read `free`, then claim and dispatch up to that many subtasks per steps 3 and 4. End the turn only after that.
- Take ready work by board priority. A started ticket outranks a new one, each pull passes the Definition of Ready, and ties keep board order.
- Where the `Agent` tool does not exist, a refill means taking the next ready task.
- With no ready work, claim nothing and end the turn.
- Close a finished agent by never reusing it. New work always goes to a fresh spawn of the named adapter.
- When an agent returned and its task is still in `claimed/`, leave the claim alone. Resume or re-spawn the same adapter to publish what is missing and run `done`. The slot stays busy until then.
- A resume only finishes the agent's own unfinished task, and that task still counts as claimed. After a fresh session, prefer a re-spawn.
- Where no sealed-note writer exists, `done` keeps refusing and the slot stays busy. Stop per `## Stop conditions` and name the unsealed notes.
- Only the waiting ticket pauses. While one ticket waits on a human, keep refilling with other ready work. List the open human questions in the Next action line.

## Session start
Run the stale sweep only at session start, including the fresh-session fallback. No agent the Orchestrator spawned can still be running then.

1. Read `now-running.md` and `memory-bank/plans/board.md`.
2. Run `node tools/grugops/claim.js sweep`.
3. Refill per `## Keep capacity full`.

The sweep reclaims a claim whose `claim.md` `at` is older than `queue.stale_ttl_minutes`, and a tampered multi-`at` record. The subtask returns to `pending/` by atomic rename, and the claim directory is released. A claim whose subtask already sits in `done/` is released, not reclaimed. Wall-clock TTL only; no pid/host liveness. A fresh claim is left untouched.

Inside a live session, report a long claim and leave it in place. Reclaiming it could hand a slow agent's task to a second agent. Two Orchestrator sessions on one repository can still sweep each other's long claims, an accepted residual.

## Session compaction
Session compaction is about the Orchestrator's own session context. It is not note compaction, which Workflow 18 owns under the name context compaction. Role agents are short-lived, one task each, so this guidance covers the Orchestrator only. It is guidance, not a gate, and it adds no config key.

Three triggers apply, all observable by the Orchestrator:

- A ticket boundary: a ticket reaches a PR, Done or a stop.
- About 10 closed agents since the session started or last compacted. Keep this count in memory, with no on-disk counter. Any compaction or fresh session resets it.
- A host signal: an auto-compact notice, a low-context warning, or the human saying the usage readout is near ~400k.

When a trigger fires, follow these steps once, however many triggers fired together. Never ask the human.

1. Pause dispatch: stop refilling and let running agents finish.
2. Confirm the queue, the board and the notes are on disk.
3. Compact the session if the host lets the Orchestrator do that.
4. Otherwise checkpoint: commit queue and context state on the work branch per `## Commit`, then carry on refilling. Run the branch guard first, and never commit to a protected branch. A host auto-compaction then loses nothing. The tips below bring it forward.

With nothing running, the pause ends at once. The first act after any compaction is to re-read `now-running.md` and the board, then refill. No sweep runs here, because agents the Orchestrator spawned can still be running.

A fresh session is the fallback on every host. It starts from committed state, on this machine or another, and follows `## Session start`.

### Operator tips (optional)
These settings are the operator's choice, and the installer writes none of them.

- Claude Code: run `/autocompact 400k`.
- Codex CLI: set `model_auto_compact_token_limit = 400000` in `config.toml`.
- Pi: set `compaction.reserveTokens` in `.pi/settings.json`. The right value depends on the model's context window.
- Antigravity CLI, OpenCode and GitHub Copilot CLI: use the fresh-session fallback.

## Stop conditions
- The claim is lost (`claim` prints `lost <task>` and exits 1) → do not proceed on that task; move to the next pending task. Do not retry the same claim in a tight loop.
- `claim` exits 2 (a missing subtask, a refused owner, a permission failure) → stop; a real error is never swallowed into a false "lost". Surface it.
- A result cannot be honestly admitted by WF16 (no real stamp, budget exhausted, no sealed-note writer) → stop and hand to a human per WF16. Do not fake a stamp; do not mark the task done on an unverified result. `checkpoint: exhaust_self_fix_budget`

## Board moves
None of its own. The queue and `memory-bank/plans/board.md` are two different substrates and must never be conflated. The queue tracks subtask ownership (pending → claimed → done) inside one ticket's work, while the board tracks the ticket through the delivery columns. Claiming a subtask does not move a ticket, and moving a ticket does not claim anything. The board move belongs to the invoking workflow.

## Trace updates
None of its own. Ownership is not part of the requirement→code→test→release trail — the rendered trace records what was built and verified, not who picked it up. The now-running registry record (`claimed/<task>/claim.md`) is the ownership record and is complete on its own. The invoking workflow's roles publish the refs on notes per Workflow 16, and the render adds them.

## Done condition
The subtask was claimed exactly once (atomic `mkdirSync`), and transitioned pending → claimed → done by atomic rename. Its results were recorded only through WF16 (`context-io.ts`) under an honest kind. No data was relayed agent-to-agent — coordination flowed only through the on-disk queue and shared context. Its claim directory was released, so `now-running.md` shows only running work. Any stale or tampered claim was reclaimed by the session-start sweep.

## Commit
Commit the queue and context state this workflow advanced per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The artifacts are the moved subtask records and any `notes/` / derived `index.*` that `context-io.ts` produced. This workflow claims and schedules work; it never merges and never deploys — humans hold both.
