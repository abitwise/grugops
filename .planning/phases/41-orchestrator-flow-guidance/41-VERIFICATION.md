---
phase: 41-orchestrator-flow-guidance
verified: 2026-11-05T04:30:00Z
status: gaps_found
score: 5/6 must-haves verified
covered_files:
  - .planning/phases/41-orchestrator-flow-guidance/41-01-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-01-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-02-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-02-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-03-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-03-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-04-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-04-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-05-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-05-SUMMARY.md
  - .planning/phases/41-orchestrator-flow-guidance/41-06-PLAN.md
  - .planning/phases/41-orchestrator-flow-guidance/41-06-SUMMARY.md
  - agent-factory/config/factory.config.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/roles/orchestrator.md
  - agent-factory/workflows/04-ticket-to-pr.md
  - agent-factory/workflows/17-task-claim.md
  - install/install.ts
  - scripts/claim.ts
  - scripts/runnable-ref/claim.js
  - scripts/runnable-ref/claim.ts
covered_digest: "v3:sha256:e3424d292c7f987534d9c5295b98331e6219798a14419067c3718681f382785b"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Agents claim and complete tasks with the shipped claim.js, so a finished task frees its slot and the Orchestrator refills it (ROADMAP SC2, RUN-02, RUN-05)"
    status: failed
    reason: "CR-01 confirmed by this verification. `done` passes only on a sealed note, and no route to a sealed note is reachable from a spawned role by following the kit text. The Claude Code adapter grants `propose_note` only to the Orchestrator. WF16 forbids a hand-written note. `scripts/context-io.ts` has no note-writing CLI verb (validate, admit, emit-verdict, render only). No host repo carries context-io.js. R-41-01 scopes the stall to the five non-Claude hosts and says Claude Code is covered, because 'the only writer an agent can reach is the Claude Code plugin's MCP server'. The agent that reaches that server is the Orchestrator, which never does task work. A spawned role on Claude Code is in the same position as a role on the other hosts."
    artifacts:
      - path: "agent-factory/workflows/17-task-claim.md"
        issue: "Step 7 makes `done` the role's last act and step 8 / Keep capacity full say a task still in claimed/ keeps its slot. No step says how a role obtains a sealed note."
      - path: "agent-factory/roles/_role-switch-protocol.md"
        issue: "Step 4 tells the role to run `done` once notes are published, with no writer route."
      - path: "docs/audit/41-residuals.md"
        issue: "R-41-01 names the wrong scope: it excludes the spawned-role case on Claude Code."
      - path: "scripts/generate-role-adapters.ts"
        issue: "Comment at the `admit` token says nested role sessions 'reach the sanctioned writer in-process'. No kit text or tool gives a role that route."
    missing:
      - "A human decision among the three CR-01 options: ship a note-writing verb to hosts (this reverses Phase 41 D-28, 'no note writer ships to hosts in this phase'), grant the admission tool to role adapters if a live run shows nested sessions now receive it, or move the seal-gated close to the Orchestrator"
      - "One live Claude Code run: spawn a role, have it publish a note, have it run `done`"
      - "Correct R-41-01 and the generate-role-adapters.ts comment so they name the spawned-role case"
  - truth: "WR-02: Workflow 04 stop precedence keeps the three-hand-off limit"
    status: partial
    reason: "Stop precedence line 1 says to apply the revert hand-off 'never the human stop'. The same step limits hand-offs to three per cause, applies the human stop before a fourth, and step 17 says the revert hand-off 'counts like any other'. Taking the first line that fits, a repeated unapproved change is handed off a fourth time with no human. Line 2 restates its limits; line 1 does not."
    artifacts:
      - path: "agent-factory/workflows/04-ticket-to-pr.md"
        issue: "Line 46 of step 15 removes the fourth-hand-off human stop for one case"
    missing:
      - "Narrow line 1 so the three-hand-off limit and the stop before a fourth hand-off still apply"
  - truth: "WR-03: the fresh-session fallback frees the slots of agents that no longer exist (ROADMAP SC3)"
    status: partial
    reason: "Session start says no spawned agent can still be running, then runs `sweep`, which leaves a claim younger than `queue.stale_ttl_minutes` alone. A session that crashed with claims inside the TTL shows `free 0` in the next session, and nothing in Workflow 17 tells the Orchestrator to re-spawn those claims. The work waits for the TTL."
    artifacts:
      - path: "agent-factory/workflows/17-task-claim.md"
        issue: "`## Session start` has no step for claims the sweep leaves in place"
    missing:
      - "A step after the sweep: re-spawn the adapter named in `by` for each remaining claim, to finish it and run `done`"
  - truth: "WR-04: now-running.md and `free` agree on what is running (ROADMAP SC1, RUN-01)"
    status: partial
    reason: "Reproduced here. A claimed/ directory with no claim record, or a record with no `at:` line, is counted by `free` (free 1 at wip_limit 3 with two such entries) and rendered nowhere, `sweep` prints `swept 0`, and `done` exits 2. Workflow 17 forbids a hand move, so the slot is held with no way out and no row to show it."
    artifacts:
      - path: "scripts/claim.ts"
        issue: "claimedCount counts entries that renderNowRunning and sweepStale skip"
    missing:
      - "Render such an entry as a row, and let the session-start sweep reclaim it by directory mtime against the TTL"
  - truth: "WR-01: Workflow 17 has a route on every install that the kit documents (RUN-05)"
    status: partial
    reason: "Every queue step is `node tools/grugops/claim.js ...`. The file reaches a repository only through the scripted installer. install/README.md section 1 says to copy AGENTS.md and agent-factory/ and calls that the floor, and section 3 (plugin) writes nothing under tools/grugops/. A missing module exits 1, the code Workflow 17 step 3 reads as `lost`."
    artifacts:
      - path: "install/README.md"
        issue: "Sections 1 and 3 do not name the tool Workflow 17 now needs"
      - path: "agent-factory/workflows/17-task-claim.md"
        issue: "No instruction for a missing tools/grugops/claim.js; exit 1 is not tied to the `lost` line"
    missing:
      - "One line at the top of Steps: if tools/grugops/claim.js is absent, stop and name the scripted install; say exit 1 is `lost` only when stdout carries that line"
deferred: []
human_verification_pending:
  - test: "Read the 13 `pending (named human)` disposition rows in docs/audit/29-style-dispositions/41-04.md and 41-06.md, and WF04 line 48 in 41-02.md, against their diffs"
    expected: "A named human replies with a name, or rejects a row"
    why_human: "The gate proves a row exists and cannot judge meaning. 41-SECURITY.md T-41-27 holds only while these rows stay pending."
  - test: "Read R-41-01 in docs/audit/41-residuals.md after CR-01 is settled"
    expected: "A named human accepts the residual in a form that names the spawned-role case, or reopens D-28"
    why_human: "D-28 was decided on the premise that Claude Code can write a sealed note. This verification found the premise holds only for the Orchestrator."
  - test: "Live run of the flow guidance on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi"
    expected: "The Orchestrator claims, refills and sweeps from Workflow 17 alone"
    why_human: "These CLIs are absent here (R-41-05, `UNKNOWN - verify`)"
---

# Phase 41: Orchestrator flow guidance Verification Report

**Phase Goal:** The Orchestrator keeps parallel work moving: it reads what is running from disk, refills free capacity as each task finishes, knows when to start a fresh session, and the same guidance works on all six hosts
**Verified:** 2026-11-05T04:30:00Z
**Status:** gaps_found
**Re-verification:** No, initial verification

## Verdict

The Orchestrator side of the phase works. `free`, `claim`, `done`, `sweep` and `now-running` run as designed from a host copy of `claim.js`, and the text is pinned and tested. The loop does not close for a spawned role, which is the part of the goal that says capacity refills "as each task finishes". Code review finding CR-01 holds up against the adapters, Workflow 16, Workflow 17 and `claim.ts`, with one correction to its strength (below). This verification sets the status to `gaps_found` because that truth cannot be shown to hold on any host by following the kit text. Its resolution needs a human choice that reverses a recorded decision (D-28), so it is not a gap the executor can close alone.

### CR-01, checked

What was confirmed:

- `done` refused a note I wrote by hand (`not-done t3: ... 1 unsealed note(s) found: hand.md`, exit 1, `free` unchanged). It passed with a note written by `appendNote` from the kit's `scripts/context-io.js` (`done t1`, exit 0, row gone, `free` rose). So the gate behaves as D-07 and D-28 say, and everything turns on whether a role can reach `appendNote`.
- Every adapter except the Orchestrator carries `tools: Read, Grep, Glob, Edit, Write, Bash` (software-engineer-senior checked). Only `grugops-orchestrator.md` carries `mcp__plugin_grugops_grugops__propose_note`.
- `scripts/context-io.ts` main verbs are `validate`, `admit`, `emit-verdict` and `render`. None appends a note.
- `RUNNABLES` in `install/install.ts` ships no `context-io.js` to a host. R-41-01 itself and `41-RESEARCH.md` Pitfall 3 record that the kit home holds only `agent-factory/`.
- Workflow 16 step 3 refuses a hand-written note and its last stop condition says to stop rather than hand-write one.
- R-41-01 reads: "Today the only writer an agent can reach is the Claude Code plugin's MCP server." The agent that holds that tool is the Orchestrator, which never does task work (`orchestrator.md` `## Hard limits`).

What the review overstates: it says no route exists on a host. The v2.1 live capture (`33-DIAGNOSIS.md` section (ii)) records role agents on Claude Code, with the plugin installed, admitting notes through `admitAndAppend` in the plugin-cache copy of `scripts/context-io.js`, with improvised `node` scripts, after the platform refused them the MCP tool (A:784, A:839, A:878, A:1408, A:1442, A:1749, A:1931, A:1864). That is a route, and it follows WF16's "only through the sanctioned writer". But it exists on a plugin install only, no kit text tells a role to take it, and the same capture shows the standalone path (B) ending in hand-written notes, which `done` now refuses. On the five non-Claude hosts D-28 knowingly accepts the stall. So the honest reading is:

| Where | Can a role complete a task by following the text |
|---|---|
| Five non-Claude hosts | No. Accepted by D-28, residual R-41-01, acceptance row still pending a named human |
| Claude Code, standalone install | No. Not covered by D-28's premise or by R-41-01 |
| Claude Code, plugin install | Only by improvising a script against the plugin-cache writer, as the v2.1 capture shows. Unverified for the phase 41 text |

No live Claude Code run of the phase 41 flow has been made, so no test exercises this. `scripts/runnable-ref/claim.test.ts` imports `../context-io.js` directly, as the review says.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `now-running.md`, rendered from `claimed/`, is the only in-flight log, holds only running work and empties as tasks finish (SC1, RUN-01) | VERIFIED | In a scratch host repo with `claim.js` copied alone beside `package.json`: two claims rendered two rows; `done t1` with a sealed note removed t1's row and `free` rose from 0 to 1. Dual-path oracle `node scripts/check-uat-oracles.js` passes with "an empty in-flight log". Edge cases in WR-04 and IN-07 below |
| 2 | On completion the Orchestrator refills `wip_limit` minus the `claimed/` count read from disk, with no timers or polling (SC2, RUN-02) | VERIFIED | WF17 `## Keep capacity full` and step 2: refill on every return and user turn, `free` reads disk. `free 2`, then `free 0` after two claims at wip_limit 2. No timer or poll text. `flow-guidance-text.test.ts` passes. Caveat: `claim` itself never reads `wip_limit` (IN-08), so the cap rests on the Orchestrator trusting `free` |
| 3 | Agents claim and complete tasks with the shipped `claim.js`, so a finished task frees its slot (SC2, RUN-05) | FAILED | Claim and done work mechanically. Completion needs a sealed note and no text-reachable route to one exists for a spawned role. See CR-01 above. This is the BLOCKER |
| 4 | WF17 holds "session compaction" named apart from WF18, with observable signals and a fresh-session fallback that re-reads the in-flight log; `orchestrator.md` carries a one-line pointer and stays under its ceiling (SC3, RUN-03, RUN-04) | VERIFIED | WF17 `## Session compaction` names WF18 as the owner of "context compaction", lists three observable triggers, step 4 checkpoints per `## Commit`, and the fresh-session fallback follows `## Session start`. `orchestrator.md` responsibility 6 is the pointer. 6,176 B against the 6,195 B WARN ceiling (`check-foundation-guards.js`: PASS, within ceiling). The fallback has a stall in the crash case (WR-03) |
| 5 | The flow guidance reads the same on all six hosts, with only optional operator tips per host (SC4, RUN-04) | VERIFIED (text only) | Host names sit only in `## Platform depth and width` and `### Operator tips (optional)`; rules turn on whether `Agent` exists. Text pins pass. Live behavior on five hosts is not run (R-41-05) and is listed for a human |
| 6 | The Orchestrator starts tiered engineers by adapter name, never forks, never overrides the model, never claims a ticket itself (SC5, RUN-06) | VERIFIED | WF17 step 4: "as a non-fork sub-agent. Pass no `model` or `effort` parameter". `orchestrator.md` `## Hard limits`: claims only at dispatch in the adapter's name, never as itself. `claim --by GRUGOPS-Orchestrator` printed `Error: the Orchestrator never owns a claim ...`, exit 2, nothing changed. The senior-prompt change (D-31) is in the three adapters; junior stop keyed on the plan |

**Score:** 5/6 truths verified. 0 present-but-behavior-unverified (the behavior-dependent truth that lacks a test is carried as FAILED, since the absence of a route is observable).

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/claim.ts` | Queue authority, full lifecycle | VERIFIED | `claimPending`, `completeTask`, `freeSlots`, sweep present and exercised |
| `scripts/runnable-ref/claim.ts` / `.js` | Host CLI, five subcommands | VERIFIED | `claim`, `done`, `free`, `sweep`, `now-running` run from a lone copy; build fresh (`freshness:runnable-embeds`: 5 targets match) |
| `install/install.ts` `RUNNABLES` | Row for `tools/grugops/claim.js` | VERIFIED | Present (line 6056). Not wired on minimal and plugin-only installs (WR-01) |
| `agent-factory/workflows/17-task-claim.md` | Flow guidance home | VERIFIED | One command per step, refill, session start, session compaction, operator tips |
| `agent-factory/roles/orchestrator.md` | Pointer and hard limit | VERIFIED | Present, under ceiling |
| `docs/audit/41-residuals.md` | R-41-01..05 | VERIFIED, with an inaccurate scope on R-41-01 | See CR-01 |
| `docs/audit/29-style-dispositions/41-04.md`, `41-06.md` | Rows, frozen rows pending a named human | VERIFIED as pending | Left pending; no acceptance written here |

### Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| WF16 step 5 | WF17 step 7 (`claim.js done`) | WIRED (text) | Both name `claim.js done` |
| WF17 Session compaction | WF17 `## Commit` | WIRED | "per `## Commit`" |
| `RUNNABLES` | `RUNNABLES_MIRROR` | WIRED | Same row in both; install tests hold them equal |
| Role `done` | a sealed note a spawned role can write | NOT_WIRED | CR-01 |

### Behavioral Spot-Checks

All run in a scratch repo under the session scratchpad, with `claim.js` copied alone beside `package.json`.

| Behavior | Result | Status |
|---|---|---|
| `free` at wip_limit 2, then after two claims | `free 2`, then `free 0` | PASS |
| `claim --by GRUGOPS-Orchestrator` | exit 2, refused, queue unchanged | PASS |
| Second `claim` of one task | `lost t1`, exit 1 | PASS |
| `done` with no note | `not-done ... no sealed note`, exit 1 | PASS |
| `done` with a hand-written note | `not-done ... 1 unsealed note(s) found: hand.md`, exit 1, slot kept | PASS (shows the CR-01 mechanism) |
| `done` with a note from `appendNote` | `done t1`, exit 0, row removed, `free` up | PASS |
| WR-04: empty or record-less claim dir | `free` counts it, render omits it, `sweep` reclaims nothing, `done` exit 2 | REPRODUCED |
| WR-05: pending file with no `ref:` | `claim` exits 0 | REPRODUCED |
| Single test files: `scripts/flow-guidance-text.test.ts`, `scripts/runnable-ref/claim.test.ts`, `scripts/claim.test.ts` | 3 files, 264 of 264 passed (TMPDIR override in effect; none of the three is capture-live) | PASS |
| `node scripts/check-uat-oracles.js`, `npm run check:claim-anchors`, `npm run freshness`, `freshness:runnable-embeds`, `freshness:queue` | all pass | PASS |

The full suite was not run, as instructed. I rely on the orchestrator's comparison for it: the 21 failures are the baseline table in `41-VALIDATION.md`, plus one `capture-live` case that fails only under the home-directory TMPDIR (77 of 77 on the default). I did not re-measure these. The TMPDIR directory I created was removed afterwards.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists and no plan declares a probe.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
|---|---|---|---|
| RUN-01 | 41-01, 41-03, 41-04 | SATISFIED, with WR-04 and IN-07 edge warnings | Truth 1 |
| RUN-02 | 41-01, 41-03, 41-04, 41-05, 41-06 | PARTIAL | Refill reads disk (truth 2); completion that frees a slot is BLOCKED by CR-01 |
| RUN-03 | 41-04, 41-06 | SATISFIED, with WR-03 warning | Truth 4 |
| RUN-04 | 41-04, 41-06 | SATISFIED as text; live runs pending (R-41-05) | Truths 4 and 5 |
| RUN-05 | 41-01, 41-03, 41-04, 41-05 | PARTIAL | `claim.js` ships and runs; "complete tasks with it" fails for a spawned role (CR-01); minimal installs lack it (WR-01) |
| RUN-06 | 41-01, 41-02, 41-03, 41-04, 41-06 | SATISFIED | Truth 6. WR-02 weakens a WF04 limit but not the RUN-06 sentence |

All six IDs appear in at least one plan's `requirements` field. No orphaned requirement. Bookkeeping: `REQUIREMENTS.md` marks only RUN-01 and RUN-05 complete and leaves RUN-02, 03, 04 and 06 as `Pending`; `ROADMAP.md` still shows Phase 41 unchecked. RUN-05 is marked Complete although truth 3 fails. This verification does not change either file.

### Anti-Patterns Found

TBD, FIXME and XXX grep over `scripts/claim.ts`, `scripts/runnable-ref/claim.ts`, `17-task-claim.md` and `orchestrator.md`: no matches. No stubs found; the code is substantive.

Open code review findings, all 17 still `open` in `41-REVIEW-DISPOSITION.md`. I reproduced or confirmed against text: CR-01, WR-02, WR-04, WR-05, IN-01, IN-08, WR-08 (the pronoun in `factory.config.md` line 222 does now read as the Orchestrator making the hand-back). I did not re-check WR-06, WR-07, IN-02 to IN-07. Findings treated as gaps above: CR-01, WR-01, WR-02, WR-03, WR-04. The rest are warnings that do not bear on a must-have truth and need triage rather than a gap plan: WR-05 (claim accepts a subtask `done` will refuse), WR-06 (no naming rule for a re-queued subtask), WR-07 (sweep replaces an existing `pending/<task>.md`), WR-08, IN-01 to IN-08.

Phase honesty items: IN-08 is a false mechanism claim in WF17 ("a refill cannot over-spawn" when `claim` never reads `wip_limit`), and IN-01 leaves `orchestrator.md` telling the Orchestrator to honor `queue.claim_cap`, which no code reads. Both sit against the no-fabrication constraint and cost almost nothing to fix.

### Security and Validation Records

- `41-SECURITY.md`: `threats_open: 0` at ASVS level 1. Its own conditions stand: T-41-27 is open and blocking on the wider reading (10 agent-written rows not pending), no human has signed the accepted-risks log, and neither plan 41-06 `<human-check>` has run. Its flag list does not cover CR-01 or WR-02.
- `41-VALIDATION.md`: `nyquist_compliant: true`; all 18 task rows green. Its three Manual-Only rows are all still waiting on a named human. No test row covers the spawned-role completion path, which is why the validation map is green while truth 3 fails.
- `deferred-items.md`: the symlink-under-`claimed/` read and the double-fault `takeClaim` cleanup remain open; both are low severity and match the security flags.

### Human Verification Required

1. **Settle CR-01.** Choose a route (ship a note verb and reverse D-28, grant the admission tool to role adapters, or move the seal-gated close to the Orchestrator), after one live Claude Code run of spawn, publish, `done`. Correct R-41-01 whichever way it goes.
2. **Read the frozen and safety rows.** The 13 `pending (named human)` rows, and WF04 line 48 in `41-02.md`. Not accepted here.
3. **Live runs** on Codex CLI, Antigravity CLI, OpenCode, GitHub Copilot CLI and Pi. `UNKNOWN - verify` until the milestone UAT.

### Gaps Summary

One blocker and four warnings go into gap closure, none of which is a missing file. The blocker is CR-01: the Orchestrator can claim, count and refill from disk, but the slot a role holds is released only by a sealed note the role has no documented way to write, so on every host the refill-as-tasks-finish loop stalls after `queue.wip_limit` tasks unless an agent improvises. The five-host half of that was accepted by D-28. The Claude Code half was not, and R-41-01 says the opposite. WR-02 is a small text edit to restore a hand-off limit. WR-03 and WR-04 are text and code fixes in the fresh-session and crash path. WR-01 is one line in Workflow 17 and two in `install/README.md`. Nothing here was accepted or overridden by this verification.

---

_Verified: 2026-11-05T04:30:00Z_
_Verifier: Claude (gsd-verifier)_
