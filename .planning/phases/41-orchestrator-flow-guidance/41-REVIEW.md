---
phase: 41-orchestrator-flow-guidance
reviewed: 2026-11-05T04:15:49Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - scripts/claim.ts
  - scripts/runnable-ref/claim.ts
  - scripts/generate-runnable-embeds.ts
  - scripts/check-uat-oracles.ts
  - scripts/generate-role-adapters.ts
  - install/install.ts
  - install/uninstall.ts
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/roles/software-engineer.md
  - agent-factory/roles/tech-lead.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/config/factory.config.md
  - agent-factory/README.md
  - install/README.md
findings:
  critical: 1
  warning: 8
  info: 8
  total: 17
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-11-05T04:15:49Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the changes since `6d05da1f`. For `scripts/runnable-ref/claim.ts` that means the hand-written part, with the generated regions covered through their authorities. Items already logged in `deferred-items.md` and in the Conditions and Flags sections of `41-SECURITY.md` are not repeated.

The queue tool's argument handling, root checks, exit contract and link refusals held up. The main concern is the flow around the tool:

- **CR-01:** the one Workflow 17 step that closes a task depends on a note writer that spawned role agents do not have, on the host the residual R-41-01 treats as covered.
- **WR-01:** the installs in `install/README.md` §1 and §3 have no `tools/grugops/claim.js`.
- **WR-02:** the new stop precedence removes the hand-off limit for one case.
- **WR-03, WR-04:** two routes leave a queue slot held with nothing in the workflow to free it.

**How findings were checked.** Findings marked "Reproduced" were run against a scratch copy of the compiled `scripts/runnable-ref/claim.js`. Everything else comes from reading the code and text. CR-01 in particular is a static trace: no live Claude Code run was made for this review.

**No findings** in `install/install.ts`, `install/uninstall.ts`, `scripts/generate-runnable-embeds.ts`, `scripts/generate-role-adapters.ts`, `scripts/check-uat-oracles.ts` or `agent-factory/README.md`. The first two changes are one row each, in matching order.

## Critical Issues

### CR-01: A spawned role agent cannot write the sealed note that `done` requires, so tasks stay claimed on Claude Code too

**File:** `agent-factory/workflows/17-task-claim.md:64`, `agent-factory/roles/_role-switch-protocol.md:24`, `scripts/runnable-ref/claim.ts:1326`, `scripts/generate-role-adapters.ts:174-181`

**Issue:** Step 7 makes `done` the role's own last act (D-05), and `done` passes only on a sealed note written since the claim (D-07, D-28). No route to such a note is visible for a spawned role agent on an installed host:

- `mcp__plugin_grugops_grugops__propose_note` is granted only through the `admit` token, and `orchestrator.md` is the only role that declares it. Every other adapter's line is `tools: Read, Grep, Glob, Edit, Write, Bash`, plus the web tools on two roles.
- The comment at `scripts/generate-role-adapters.ts:178-181` records from a capture that "nested role sessions do not receive plugin MCP tools at all". `agent-factory/packaging/subagent.frontmatter.md:217-218` says the same.
- Both say such sessions "reach the writer in-process", but no such route exists on a host. `41-RESEARCH.md` Pitfall 3 records that the kit home holds only `agent-factory/`, and that no host repository has `context-io.js`. `~/.grugops` on this machine confirms it.
- The `scripts/context-io.ts` CLI has no note-writing verb. It offers `validate`, `admit`, `emit-verdict` and `render`, and `admit` checks a note without appending it.
- Workflow 16 step 3 refuses a hand-written note, and its last stop condition says to stop rather than hand-write one.

So on the spawn path, a role that follows the text publishes nothing sealed and `done` prints `not-done`. By `## Keep capacity full` the slot stays busy, and `free` reaches 0 after `queue.wip_limit` tasks. That is the failure R-41-01 describes for the other hosts. R-41-01 scopes it away from Claude Code ("the only writer an agent can reach is the Claude Code plugin's MCP server"), but the agent that reaches that server is the Orchestrator, and the Orchestrator never does a task's work (`orchestrator.md`, `## Hard limits`).

The same gap reaches the Tech Lead's `Confirmed:` finding in Workflow 04 step 15, and every `failed-attempt` and `decision` note a spawned role must publish.

`scripts/runnable-ref/claim.test.ts` imports `../context-io.js` directly, so tests can pass without showing that any agent can reach the writer.

**Fix:** First run one live Claude Code task end to end: spawn a role, have it publish a note, have it run `done`. If the role has no route, choose one of these:

1. Ship a note-writing verb with the host programs, for example `tools/grugops/note.js`, built from the same `context-io.ts` authority. This also closes R-41-01 on the other five hosts.
2. Grant the admission tool to role adapters, if a live run shows nested sessions now receive it.
3. Move the seal-gated close to the Orchestrator, which holds the writer, and state how a role's result reaches a note without relaying data.

In any case, correct R-41-01 so that it names the spawned-role case.

## Warnings

### WR-01: Workflow 17 has no route on the minimal and plugin-only installs, and a missing tool exits 1

**File:** `agent-factory/workflows/17-task-claim.md:54-64`, `install/README.md:18-30`, `install/README.md:1671-1682`

**Issue:** Every queue step is now `node tools/grugops/claim.js ...`. That file reaches a repository only through the scripted installer's `RUNNABLES` loop.

- §1 of `install/README.md` tells the user to copy `AGENTS.md` and `agent-factory/`, says "That is it", and calls this a floor for every tool.
- §3, the plugin path, also writes nothing under `tools/grugops/`. It is the one install that gives the Orchestrator the admission tool.
- A repository installed before this phase has the same gap until it re-installs, because all repositories share one kit home.

Workflow 17 gives none of these a route. Node's missing-module failure also exits 1, which is the code the D-08 contract reserves for an outcome. Step 3 says exit 1 prints `lost <task>`, and an agent that reads only the code would move to the next task. `## Stop conditions` covers `claim` exit 2 only.

**Fix:** Add one line at the top of `## Steps`: if `tools/grugops/claim.js` is absent, stop and name the scripted install. Add the same requirement to §1 and §3 of `install/README.md`, or state what the floor does not cover. Say in step 3 that exit 1 counts as `lost` only when stdout carries that line.

### WR-02: Stop precedence line 1 takes away the limit on revert hand-offs

**File:** `agent-factory/workflows/04-ticket-to-pr.md:44-49`, `agent-factory/workflows/04-ticket-to-pr.md:56`

**Issue:** Line 46 says to apply the revert hand-off "never the human stop", and the list says to take the first line that fits. Other text sets a limit that this overrides:

- Line 44: "Hand off one cause at most three times."
- Line 49: apply the human stop "before a fourth hand-off on one ticket".
- Step 17: the revert hand-off "counts like any other".

A role that keeps making the same unapproved change matches line 1 each time, so the fourth and later hand-offs go out with no human, and line 48 adds "without waiting". This is the retry loop that the stop conditions forbid ("never retry in a loop", line 75). Line 2 of the same list keeps its limits explicitly ("The three-rounds and fundamental rules still apply"). Line 1 has no such sentence.

**Fix:** Narrow line 1, for example: "Apply step 17's revert hand-off to an unapproved fundamental change, not the stop for a proposed `Fundamental:` note. The three-hand-off limit and the stop before a fourth hand-off still apply." Add the same limit to the sentence in line 48.

### WR-03: After a crash, a claim younger than the TTL holds its slot for the whole session

**File:** `agent-factory/workflows/17-task-claim.md:74-90`

**Issue:** `## Session start` says no spawned agent can still be running, then runs `sweep`, which leaves a claim younger than `queue.stale_ttl_minutes` alone. Later sweeps are forbidden in that session. The rule for an unfinished claim begins "When an agent returned", and a crashed session returns nothing. "After a fresh session, prefer a re-spawn" sits in a bullet about resumes.

So with the default three slots, a session that dies with three agents running gives `free 0` in the next session if it starts within 30 minutes. Nothing is running, so no return can trigger a refill. The Orchestrator claims nothing and ends the turn, and the work waits for a later session. `## Session start` itself states the fact that would let it act: those claims have no live agent.

**Fix:** Add a step after the sweep: "For each claim still in `claimed/`, no agent is running. Re-spawn the adapter named in `by` for that task, to finish it and run `done`. Each re-spawn fills the slot its claim already holds."

### WR-04: A claim directory with a missing or unreadable record holds a slot forever and shows nowhere

**File:** `scripts/claim.ts:356`, `scripts/claim.ts:362-365`, `scripts/claim.ts:413`, `scripts/claim.ts:583`, `agent-factory/workflows/17-task-claim.md:64`

**Issue:** Reproduced. With `claimed/b/claim.md` truncated to `---\nby: x\n`, and with an empty `claimed/orphan/`:

- `now-running` rendered neither entry
- `sweep` printed `swept 0`
- `free` counted both
- `done b` and `done orphan` exited 2

The same holds for an `at:` value that does not parse, and for a `claim.md` that is a link. A later `claim` of the same name would read `lost`. Workflow 17 offers no way out, because step 7 says "Never move a subtask by hand". The Orchestrator sees `free 0` beside a table with no rows, with no explanation.

`deferred-items.md` records this only for the double disk fault in `takeClaim`. Other routes reach the same state: a process killed between `mkdirSync` and the `writeFileSync` at `scripts/claim.ts:184-198`, a torn write (`at` comes after `by`, `agent` and `level`, so a partial record has no `at`), and a stop between the unlink and the rmdir inside `rmSync`.

**Fix:** Let the session-start sweep treat a record with no usable `at`, or no record, as stale by the claim directory's mtime against the TTL. Return any subtask to `pending/` and remove the directory. Render such an entry as a row, for example with `since` set to `unknown`, so the count and the table agree.

### WR-05: `claim` accepts a subtask that `done` will refuse, and `done` exit 2 has no instruction

**File:** `scripts/claim.ts:238-280`, `scripts/runnable-ref/claim.ts:1323-1324`, `agent-factory/workflows/17-task-claim.md:64`, `agent-factory/workflows/17-task-claim.md:121-123`

**Issue:** Reproduced. A pending file with no `ref:` line claimed with exit 0. After the work, `done` printed `Error: the subtask carries 0 ref: lines, not one.` and exited 2. The rule is checked only at the end of the work, when an agent's turn has been spent. A pending entry that is a directory, a FIFO or a link passes `claim` in the same way.

Step 7 describes exit 1 only, and `## Stop conditions` covers `claim` exit 2 only. Nothing tells a role what to do when `done` exits 2, for example on a tampered record, a bad `ref:` or unreadable notes, and the subtask must not be moved by hand.

**Fix:** In `claimPending`, before `takeClaim`, read the pending entry with the same regular-file rule and run `subtaskRefFolder`, refusing with exit 2. Add a stop bullet: "`done` exits 2 → stop and surface the line; leave the claim in place."

### WR-06: A re-queued subtask has no naming rule, and the natural name stops the Orchestrator

**File:** `agent-factory/workflows/17-task-claim.md:50-52`, `agent-factory/workflows/04-ticket-to-pr.md:55`, `scripts/claim.ts:255-257`

**Issue:** Workflow 04 steps 15 to 17 create several later subtasks for one ticket, including the Tech Lead wake-ups. Step 16 says "Never re-pend a `done/` subtask", and step 1 of Workflow 17 gives one example, where the task id equals the context folder (`abc-104`). Neither says how a later subtask is named. Reusing the ticket-shaped name meets `done/<task>.md already exists` at `claim`, which is exit 2, and the stop condition says to stop and surface it. An ordinary re-queue therefore reads as a genuine failure.

**Fix:** Add a rule to step 1 of Workflow 17: "A re-queued subtask takes a new id, such as `abc-104-r2`, and keeps the `ref:` of its per-task context." Point Workflow 04 step 16 at it.

### WR-07: `sweep` silently replaces an existing `pending/<task>.md`

**File:** `scripts/claim.ts:371-374`

**Issue:** Reproduced. With `claimed/z/` stale and a newer `pending/z.md` naming `.grugops/context/NEW/`, `sweep` printed `reclaimed z` and `pending/z.md` then held the old `ref:` line. `atomicRename` replaces the destination on POSIX, and its Windows branch unlinks it first. `completeTask` and `claimPending` guard their destinations, and this rename does not. The result is a re-queued subtask pointing at the wrong context, with no message. WR-06's missing naming rule makes this collision more likely.

**Fix:** Check the destination first. When `pending/<task>.md` exists, keep it, leave the claimed copy in place and report the task rather than moving it. At minimum, report it so that a human can see it.

### WR-08: A new sentence changes who the pronoun means, so `factory.config.md` says the Orchestrator makes the hand-back

**File:** `agent-factory/config/factory.config.md:222`

**Issue:** The `block` bullet now reads "The Orchestrator asks the human to approve or reject a `Fundamental:` proposal. On approval it hands the ticket back to the proposing role ... On rejection it applies the move the human names". The earlier subject was the Tech Lead, and now "it" is the Orchestrator. Workflow 04 step 15 gives the move to the Tech Lead, who records it as `Move: hand-off` with `Stop: human`, and the Orchestrator only records the answer and queues the Tech Lead.

**Fix:** Write "On approval the Tech Lead hands the ticket back ...; on rejection the Tech Lead applies the move the human names ...".

## Info

### IN-01: `queue.claim_cap` no longer does anything

**File:** `agent-factory/roles/orchestrator.md:77`, `agent-factory/config/factory.config.md:104`, `scripts/claim.ts:458`

**Issue:** Claiming is now one task per agent at dispatch, so a delegation holds exactly one task whatever the value is. `parseQueueConfig` parses `claim_cap`, and no code reads it. Workflow 17 no longer names it, while `orchestrator.md` still says "Honor `queue.claim_cap` per delegation".
**Fix:** Mark the key as retired in `factory.config.md` and remove the sentence from the role, or say what the value still governs.

### IN-02: `--level` is not tied to the adapter

**File:** `scripts/claim.ts:246-251`

**Issue:** Reproduced. `claim c --by grugops-software-engineer-junior --level senior` exited 0 and recorded both values. Omitting `--level` for a level adapter also passes, and `--level` is accepted for a role with no levels. The record is the audit view of who ran at what tier.
**Fix:** When `by` ends in `-junior`, `-mid` or `-senior`, require `--level` to match it, and refuse `--level` otherwise.

### IN-03: The `not-done` line is silent about sealed notes older than the claim

**File:** `scripts/runnable-ref/claim.ts:1282-1293`, `scripts/claim.ts:488-492`

**Issue:** `at` is an agent-supplied argument in `scripts/admission-server.ts`. An honest note with a rounded or date-only `at` sorts before the claim, and the line then says "no sealed note", which reads as if nothing sealed exists. A re-queued subtask's folder also holds older sealed notes. R-41-04 covers a forged `at` passing, and this is the reverse case.
**Fix:** Add `; N sealed note(s) predate the claim` to the line.

### IN-04: Three descriptions of the subtask file disagree

**File:** `agent-factory/roles/orchestrator.md:32`, `agent-factory/workflows/17-task-claim.md:50`, `scripts/claim.ts:8-9`

**Issue:** The role says "holding only a `ref:`", Workflow 17 says exactly two lines, and the `claim.ts` header still says "self-contained" with what-to-do and the originating ticket.
**Fix:** Have the role point at Workflow 17 step 1, and update the header.

### IN-05: The role-switch step lost its condition

**File:** `agent-factory/roles/_role-switch-protocol.md:23-24`

**Issue:** The old text began "When the work was queued". The new line reads as unconditional, while the protocol also covers roles activated with no queued task, which have no `<task>`. Workflow 16 step 5 keeps "of a queued task".
**Fix:** Start line 23 with "When the work was queued, the Orchestrator already claimed it".

### IN-06: The render banner names a path that does not exist in the kit repository

**File:** `scripts/claim.ts:598`

**Issue:** The shared render now prints `Re-run: node tools/grugops/claim.js now-running`. The kit CLI and `scripts/now-running-freshness.ts:154,165` still say `node scripts/claim.js now-running`, and this repository has no `tools/grugops/`.
**Fix:** Keep the host path in the banner, and name the difference in the freshness gate's message.

### IN-07: The render is no longer single-writer

**File:** `scripts/claim.ts:497`, `scripts/runnable-ref/claim.ts:12`

**Issue:** The `atomicWrite` comment calls `now-running.md` single-writer, and the host tool's header says the log "cannot go stale between steps". Under D-05, parallel agents each run `done`, so two renders can overlap and the older snapshot can land last, leaving a row for finished work until the next command. This comes from reading the code: ten rounds of three parallel `claim` calls did not reproduce it.
**Fix:** Correct both comments. Workflow 17 already treats the disk count as the truth.

### IN-08: The D-04 note overstates what prevents an over-spawn

**File:** `agent-factory/workflows/17-task-claim.md:17`

**Issue:** Reproduced. The note says "a refill cannot over-spawn", but `claim` never reads `wip_limit`, and eight claims succeeded beside `free 0 (8 claimed, wip_limit 3)`. Not enforcing it may be right, because `## Hard limits` allows exceeding the width with a written reason. The sentence still claims a mechanism that does not exist.
**Fix:** Write "so a refill that trusts `free` does not over-spawn".

---

_Reviewed: 2026-11-05T04:15:49Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
