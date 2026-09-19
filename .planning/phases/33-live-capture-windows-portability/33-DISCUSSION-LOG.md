# Phase 33: Live Capture & Windows Portability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-19
**Phase:** 33-live-capture-windows-portability
**Areas discussed:** Capture instrument (CAP-01/03), Live-run budget & go protocol, CAP-02 scope & Windows policy, GAP-D1 flip mechanics

---

## Capture instrument (CAP-01/03)

| Option | Description | Selected |
|--------|-------------|----------|
| Headless stream-json transcript | Rewrite the Tier-2 harness around `claude -p --output-format stream-json --include-hook-events`; JSONL + derived summary is the capture; human TUI session is corroboration only | ✓ |
| Human interactive session, SPAWN-03 style | Interactive `claude --agent grugops-orchestrator`, recording surface filled in the observer's words, saved session transcript attached | |
| Both are required | Headless transcript plus an independent human session; CAP-03 flips only when both agree | |

| Option | Description | Selected |
|--------|-------------|----------|
| Spawn events + on-disk role authorship | ≥2 distinct grant-member roles in `Agent` tool-use events with nested subagent events AND context notes authored by role agents | ✓ |
| Spawn events only | Distinct role names with nested output suffice | |
| Match the July observation exactly | Same request, same three roles, same width announcement | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh install onto a runnable fixture | mkdtemp + minimal committed fixture project + real `install.js --target` of this checkout | ✓ |
| Your real example repo | cli-chess-example after a re-install, as in July | |
| Keep the current scaffold, retarget the assertions | Copied agent-factory mkdtemp; A3 asserts the note set only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Hook event in stream-json, plugin loaded | Deny asserted as a PreToolUse hook event with the plugin form live; flag support verified first | ✓ |
| Drop A2 from the live capture | Rely on the offline point-of-effect oracle only | |
| Observe via tool non-execution | Grant Bash, assert the side effect never happened | |

| Option | Description | Selected |
|--------|-------------|----------|
| Install from the real GitHub marketplace at the SHA under test | `abitwise/grugops` user-scope row, install pinned to the pushed HEAD sha | ✓ |
| Accept --plugin-dir as the plugin case | Cache-copy step stays `UNKNOWN - verify` | |
| Local marketplace add under a temp copy | Collides with the user-scope `grugops` row | |

| Option | Description | Selected |
|--------|-------------|----------|
| Derived summary + redacted JSONL | Summary derived by the script; JSONL committed after redaction of home paths and secrets | ✓ |
| Summary only; JSONL local | Raw transcript referenced by path and sha256 | |
| Raw JSONL as-is plus summary | No redaction | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two runs, same fixture, compare the D-05 artifact | `claude -p` (sequential via AGENTS.md) and `claude -p --agent grugops-orchestrator`; compare note set + verdict | ✓ |
| Spawn path only, sequential from examples/03 | Reuse the v1 sequential capture | |
| Same session, both paths | One session, not independent | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `scripts/capture-live.ts`, lane wraps it | One script does install, runs, redaction, summary, recording surface; vitest lane is a thin wrapper | ✓ |
| Keep vitest as the runner | Rewrite cases in place | |
| Script only, retire the vitest lane | Delete `scripts/e2e/` | |

**User's choice:** all recommended options.
**Notes:** Orchestrator corrected the briefing mid-discussion: the SPAWN-03 recording surface was already filled by the user on 2026-07-29 (CC 2.1.220), so the format exists as precedent but the capture must be of the current tree.

---

## Live-run budget & go protocol

| Option | Description | Selected |
|--------|-------------|----------|
| One per gap-closure round, each behind a go | At most four runs under the cap; each with its own blocking checkpoint | ✓ |
| Exactly one, period | Single run; red stays open | |
| As many as needed, you go each time | No cap in the plan | |

| Option | Description | Selected |
|--------|-------------|----------|
| Zero-token dry run must be green first | `--dry-run` covering install, flag probe, fixture build, listings, summary derivation | ✓ |
| Diagnosis-first only | Written diagnosis suffices | |
| No precondition | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Record, diagnose at zero tokens, fix, next round asks again | Transcript filed as-is; cause class named; fix with offline proof; new go next round | ✓ |
| Red ends the phase's live work | | |
| Fix and re-run in the same round | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Derived from the dry run's measured session floor, capped at 20 min | (as first presented) | ✓ then corrected |
| Fixed 15 minutes per call | | |
| No timeout, you watch it | | |

**User's choice:** the recommended options; on the call budget the orchestrator flagged that a zero-token dry run cannot measure a model turn, and the user confirmed the corrected rule: first run fixed 20 min per call, later rounds derived from the prior live run's measured durations, capped at 20 min, bound written into the summary.

---

## CAP-02 scope & Windows policy

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, both legs green is the CAP-02 bar | Ubuntu failures in scope | ✓ |
| Windows leg only, ubuntu is a separate quick task | | |
| Windows leg only, ubuntu stays red | Literal reading | |

| Option | Description | Selected |
|--------|-------------|----------|
| Per-test explicit bounds where a spawn happens | Explicit `it(..., timeoutMs)` per spawning test | |
| Raise `testTimeout` globally | One setting for every test | |
| Platform-conditional timeout | Rejected by the row 186 rule | |
| *Other:* "Add warning, don't prevent test run" | User's free text; confirmed as raised global `testTimeout` + `slowTestThreshold: 5000` warnings, no platform conditional | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize at the production boundary, assert POSIX | Published paths normalized once in the emitting module | ✓ |
| Normalize in the tests only | | |
| Use node:path everywhere, assert with path.join | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Symlink: skip-with-reason on EPERM; fs.watch: measure, no conditional | Named SKIPPED counted in the shape remainder; watcher stays unconditional | ✓ |
| Both skip-with-reason on Windows | | |
| Move fs.watch cases to their own CI step | WR-07 CI-topology half | |

**User's choice:** as marked.
**Notes:** Measured at discussion time: CI on `main` has had no green run in the last 40 (back to 2026-07-15); latest run fails the same vitest step on both legs.

---

## GAP-D1 flip mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Every surface, one commit, driven by a flip manifest | Manifest names every file and cell; check asserts nothing survives outside it; archives edited in place | ✓ |
| The three named surfaces only | | |
| Live surfaces only, archives untouched | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Observed value + capture citation + date | Every cell traces to a summary line | ✓ |
| Observed value only | | |
| 'confirmed' plus a footnote | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Replace both columns from the new capture | Relay vocabulary retired per 28-05 | ✓ |
| Keep the v1 left column, fill the right | | |
| Keep the left column, rename the row only | | |

| Option | Description | Selected |
|--------|-------------|----------|
| It is a finding: fix the kit inside the round cap, flip nothing until parity holds | Override close with GAP-D1 open if the cap is reached | ✓ |
| Record and flip A3 as 'observed, diverged' | | |
| Fix the kit in a new phase, keep GAP-D1 open | | |

**User's choice:** all recommended options.

## Claude's Discretion

- Exact vitest `testTimeout` bound; fixture project contents; redaction rule set; summary schema; ordering of CAP-02 work vs first capture (recommendation: CI green first).

## Deferred Ideas

- WR-07 CI-topology half (separate `board-watch-live` step, rows 186/193) — not taken.
- WINDOWS.md rows 222–224 — accepted open at 32.1 close.
- Retiring the vitest e2e lane entirely — rejected; loud-skip keystone kept.
