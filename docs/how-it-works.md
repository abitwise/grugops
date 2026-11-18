# How grugops works

This page follows one request through grugops, from the moment you type it to the point where a person decides whether to merge and release the change. Each section names the role or workflow file that does the work, so you can read the rule itself.

## How work flows

<!-- claim: C-28-033 -->
- **The board** — `memory-bank/plans/board.md` is the visible state of the factory: WIP-limited columns
  that every ticket moves through, from Ready to Done (or to Ready to Release in enterprise
  mode). The board *is* the state; the column an item sits in is its status.
- **Traceability** — the audit trail, rendered per ticket from published note refs. Each ticket's
  file under `memory-bank/plans/traceability/` links requirement → ticket → code → test → UAT →
  release, and `memory-bank/plans/traceability.md` indexes them one line per ticket, so every
  shipped change is accountable end to end.
- **The lifecycle** — the Orchestrator decomposes each request into subtasks and enqueues
  them for whichever stages the work actually needs (analysis, design, engineering, QE,
  security/NFR, UAT, release); it claims each subtask at dispatch in its role's name, and
  the role pulls the shared verified context and publishes typed notes back into it
  (Workflow 16), so the next role inherits exactly what it needs — never a relay from the role before it.
