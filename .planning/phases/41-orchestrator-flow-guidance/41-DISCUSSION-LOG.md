# Phase 41: Orchestrator flow guidance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-04
**Phase:** 41-orchestrator-flow-guidance
**Areas discussed:** claim.js CLI + claim record, Refill/close loop + room, Session compaction triggers, WF04 hand-off residuals

---

## claim.js CLI + claim record

| Option | Description | Selected |
|--------|-------------|----------|
| Full lifecycle | claim --by, done, sweep, free, now-running | ✓ |
| Claim + done only | sweep/free stay as guidance | |
| Mirror the library | claim, transition, sweep one-to-one | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-render: yes, always | every queue-changing command re-renders now-running.md | ✓ |
| Explicit step | agents run now-running after a change | |

| Option | Description | Selected |
|--------|-------------|----------|
| Optional agent: + level: | WF17 contract change, old records valid | ✓ |
| agent: only | | |
| No change | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Orchestrator claims at dispatch | count is right at once; reverses WF17 wording | ✓ |
| Agent claims on start | Orchestrator keeps unclaimed spawns in memory | |
| Agent claims; refill only on completion | | |

**Who runs done:** offered "Orchestrator on return" / "Agent before it returns". **User's choice (free text):** "Agent is responsible for it's work and status update. Orchestrator just does quick double-check."

| Option | Description | Selected |
|--------|-------------|----------|
| Re-dispatch to finish | same adapter publishes and runs done; slot stays busy | ✓ |
| Orchestrator closes it | fallback done by the Orchestrator | |
| Leave it for the sweep | | |

| Option | Description | Selected |
|--------|-------------|----------|
| done checks for a note | refuses without a note since the claim's at | ✓ |
| Pure move | | |

| Option | Description | Selected |
|--------|-------------|----------|
| One plain line + exit code | | ✓ |
| JSON | | |
| You decide | | |

---

## Refill/close loop + room

| Option | Description | Selected |
|--------|-------------|----------|
| Never reuse it | fresh spawn for new work; resume only to finish its own task | ✓ |
| Explicit stop where the host has one | host-specific | |

| Option | Description | Selected |
|--------|-------------|----------|
| Every return + every user turn | read free, dispatch, then end turn | ✓ |
| Wave boundaries only | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sweep at session start only | live-session long claims reported, not reclaimed | ✓ |
| Heartbeat: claim.js touch | | |
| Keep it, raise the TTL | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Trim responsibilities 6–10 | pointer + one RUN-06 Hard limits sentence; ceiling unchanged | ✓ |
| Raise the ceiling | | |
| WF17 only | | |

| Option | Description | Selected |
|--------|-------------|----------|
| RUN-06 wording, with claim.js refusing --by grugops-orchestrator | | ✓ |
| Same wording, no tool refusal | | |

---

## Session compaction triggers

| Option | Description | Selected |
|--------|-------------|----------|
| Ticket boundary | | ✓ |
| N closed agents | | ✓ |
| Host signal | | ✓ |
| Recall drift | | |

| Option | Description | Selected |
|--------|-------------|----------|
| N = 10 | guidance, not a gate | ✓ |
| N = 6 | | |
| Configurable key | | |

**On trigger:** offered "Pause dispatch, ask human" / "Suggest, keep working" / "Stop at once". **User's choice (free text):** "Pause dispatch, but don't ask human, compact and continue (if that is possible)".

| Option | Description | Selected |
|--------|-------------|----------|
| Checkpoint, then carry on | host auto-compaction is lossless; never ask the human | ✓ |
| Checkpoint, then a one-line FYI | | |
| Self-compact or nothing | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Count in memory, reset by compaction | | ✓ |
| Count from disk | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Commit at checkpoint | | ✓ |
| Disk is enough | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Orchestrator only | | ✓ |
| Role agents too | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tips in a short WF17 section | | ✓ |
| install/README.md | | |

---

## WF04 hand-off residuals

| Option | Description | Selected |
|--------|-------------|----------|
| Ask once, Orchestrator wakes TL | one pattern for every WF04 human stop | ✓ |
| Retire the TL confirmation | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Revert first | human stop only for a proposed Fundamental: note | ✓ |
| Human stop first | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-off first | raise stop only if the ticket returns still needing it | ✓ |
| Human stop wins | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Approved: names the Fundamental note id | | ✓ |
| Note id + content hash | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Gate hold binds only the gate move | | ✓ |
| Hold everything | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Defer the three-rounds spread | | ✓ |
| Fold into Phase 41 | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Only that ticket waits | | ✓ |
| Pause dispatch | | |

| Option | Description | Selected |
|--------|-------------|----------|
| One ordered precedence list | | ✓ |
| Inline sentences | | |
| You decide | | |

---

## Claude's Discretion

- CLI exit-code numbers and line wording; `free` behavior on a missing or malformed config; where the flow steps sit inside WF17; how `done` reads note timestamps; whether the Tech Lead role needs a matching ask-once sentence.

## Deferred Ideas

- Spread the three-rounds-then-human rule to the kit's other agent-resolvable checkpoints (39-UAT test 71).
- Claude Code-only speed-ups (`autoCompactWindow`, a `SubagentStop` nudge) stay declined for v3.0.
