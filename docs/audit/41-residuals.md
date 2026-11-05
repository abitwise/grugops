# Phase 41 residuals

This file records what phase 41 accepted. Each entry is a gap the phase knows about and did not close. The decisions behind it are in
`.planning/phases/41-orchestrator-flow-guidance/41-CONTEXT.md`, and the host facts are in `41-RESEARCH.md` beside it.

**Written:** 2026-11-05, by plan 41-04, amended by plan 41-11.
**Status of every entry:** open. A later phase closes an entry by naming it here and saying what closed it.

## The residuals

| id | decision | what stays open | why it was accepted | what closes it |
|---|---|---|---|---|
| R-41-01 | D-28, D-35 | Before plan 41-07, a spawned role on any host could not write the sealed note `done` needs: only the Orchestrator holds `propose_note`, and only on a Claude Code plugin install. `tools/grugops/note.js` now gives every role on a scripted install a route. Two gaps stay open. A markdown-only copy or a plugin-only install has no `tools/grugops/`, so Workflow 17 stops there. No live run has shown a spawned role publish a note and run `done`. | `done` counts sealed notes only, because Workflow 16 refuses a hand-written note on read. Counting one here would pass a task on a note the context never admits. The line `done` prints names the unsealed notes it found, so the gap stays visible. | One live Claude Code run of spawn, publish and `done`, read by a named human. |
| R-41-02 | D-11 | Two Orchestrator sessions on one repository can sweep or re-spawn each other's claims. | The sweep is wall-clock only and reads no pid or host liveness, so it cannot tell a second session's running agent from a dead one. The session-start re-spawn cannot tell either. The TTL still applies. | A record of which session holds a claim, if the risk ever earns one. |
| R-41-03 | D-04 | The `--by` refusal is an instruction backstop, not a boundary. | `tools/grugops/claim.js` refuses `--by grugops-orchestrator` in any letter case, and an agent still chooses the flag it passes. The refusal catches a mistake, not a choice. | Nothing planned. The claim owner is not a security control. |
| R-41-04 | D-07 | A forged note `at` passes D-07. The check proves that a note exists, not that it is honest. | `done` compares timestamps and reads no content. Workflow 16 admission governs what a note says. | Nothing planned. Admission stays the owner of note content. |
| R-41-05 | RUN-04 | The guidance has no live run on Codex, Antigravity, OpenCode, Copilot or Pi. Those CLIs are absent on this machine. `UNKNOWN - verify` | The guidance turns on whether the `Agent` tool exists, never on a host name, so one text serves all six hosts. That design is not a proof of behavior on a host nobody ran. | A live run on each host, carried to the milestone UAT. |
| R-41-06 | D-35 | `tools/grugops/note.js` is the in-script admission tier on every host, Claude Code included. A `human:<name>` stamp it writes is not bound to a human: only `propose_note`, behind the per-call hook, binds one, and a spawned role does not hold that tool. | An agent runs this program in its own process, so nothing the program checks can prove a human acted. The in-script tier already had this shape, recorded as `R-31-15-01`. D-35 ships that tier so a task can finish. | Nothing planned. A host-delivered grant channel would. |
| R-41-07 | D-35 | `tools/grugops/note.js` can lose the `human_admission` dial, and it then admits what the dial refuses. In a repository set to `human_admission: all`, a `security-nfr` finding stamped `human:eve` is refused. With `HOME=/nonexistent` and no fault injected, the same note ends `noted`, exit 0. The read failures and the `GRUGOPS_PROJECT_DIR` case are in the entry "The embedded root ladder can lose the governance dial" of `.planning/phases/41-orchestrator-flow-guidance/deferred-items.md`. | Not accepted. No human has accepted this gap. The human ruling of 2026-11-05 left it open and assigned it to a new gap plan. | That gap plan, not yet written, makes the root ladder in `scripts/context-io.ts` fail closed. |

## Assumptions carried from research

Research assumption ids A1 and A2 stand as written in `41-RESEARCH.md`. Neither is measured. The guidance works either way.

- **A1:** no host lets the agent see its own context use. Claude Code's documentation is silent on it. The session compaction triggers use only signals the Orchestrator can see, so nothing rests on this.
- **A2:** no host lets the agent compact itself without a host extension. Step 3 of `## Session compaction` in Workflow 17 compacts only where a host allows it, and step 4 covers every other case.
