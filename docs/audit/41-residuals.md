# Phase 41 residuals

This file records what phase 41 accepted. Each entry is a gap the phase knows about and did not close. The decisions behind it are in
`.planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md`, and the host facts are in `41-RESEARCH.md` beside it.

**Written:** 2026-11-05, by plan 41-04.
**Status of every entry:** open. A later phase closes an entry by naming it here and saying what closed it.

## The residuals

| id | decision | what stays open | why it was accepted | what closes it |
|---|---|---|---|---|
| R-41-01 | D-28 | On a host with no sealed-note writer, `done` refuses, the claim stays and that slot stays busy, so `free` can reach 0 on those hosts. Today the only writer an agent can reach is the Claude Code plugin's MCP server. | `done` counts sealed notes only, because Workflow 16 refuses a hand-written note on read. Counting one here would pass a task on a note the context never admits. The line `done` prints names the unsealed notes it found, so the gap stays visible. | A note writer ships to hosts. |
| R-41-02 | D-11 | Two Orchestrator sessions on one repository can sweep each other's long claims. | The sweep is wall-clock only and reads no pid or host liveness, so it cannot tell a second session's running agent from a dead one. The TTL still applies. | A record of which session holds a claim, if the risk ever earns one. |
| R-41-03 | D-04 | The `--by` refusal is an instruction backstop, not a boundary. | `tools/grugops/claim.js` refuses `--by grugops-orchestrator` in any letter case, and an agent still chooses the flag it passes. The refusal catches a mistake, not a choice. | Nothing planned. The claim owner is not a security control. |
| R-41-04 | D-07 | A forged note `at` passes D-07. The check proves that a note exists, not that it is honest. | `done` compares timestamps and reads no content. Workflow 16 admission governs what a note says. | Nothing planned. Admission stays the owner of note content. |
| R-41-05 | RUN-04 | The guidance has no live run on Codex, Antigravity, OpenCode, Copilot or Pi. Those CLIs are absent on this machine. `UNKNOWN - verify` | The guidance turns on whether the `Agent` tool exists, never on a host name, so one text serves all six hosts. That design is not a proof of behavior on a host nobody ran. | A live run on each host, carried to the milestone UAT. |

## Assumptions carried from research

Research assumption ids A1 and A2 stand as written in `41-RESEARCH.md`. Neither is measured. The guidance works either way.

- **A1:** no host lets the agent see its own context use. Claude Code's documentation is silent on it. The session compaction triggers use only signals the Orchestrator can see, so nothing rests on this.
- **A2:** no host lets the agent compact itself without a host extension. Step 3 of `## Session compaction` in Workflow 17 compacts only where a host allows it, and step 4 covers every other case.
