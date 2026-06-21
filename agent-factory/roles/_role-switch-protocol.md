---
kind: protocol
tier: core
---
# Role-switch protocol

Single source for HOW a role activates. The default substrate is ONE context
window — the head grug and each specialist grug live in the same window, one after
another. This is sequential role-load: the Orchestrator loads each role's file into the
same window in turn, the role does its one job, hands off, and control returns to the
Orchestrator. On the four non-spawning host CLIs (Codex, Gemini, OpenCode, Copilot)
this is the only mode. On Claude Code the coordinator (the orchestrator adapter, which
carries `coordinator: true`) may instead spawn role agents — same roles, same handoffs,
same gates; only the dispatch differs. Either way the steps below are identical.

Every entry point (the Orchestrator's responsibilities, every workflow's "Agents
involved" block) references THIS file by path. Nobody else inlines the steps.

## The 5 steps

When a role activates, do these five in order:

1. **Announce.** Print `▶ entering <ROLE>` so the window shows which grug holds the
   work right now.
2. **Read only what this role needs.** Read ONLY that role's file (`agent-factory/roles/<role>.md`)
   plus the named input handoff(s) this role consumes — nothing else. No peeking at
   other roles' scratch, no scrolling the running conversation for context.
3. **Drop prior context.** Drop all prior persona and scratch context from the role
   that ran before. The earlier grug's half-thoughts do not carry over. Fresh head.
4. **Produce the handoff (and, when queued, claim + record).** Do the one job: read the
   role's named handoff **template** from `agent-factory/handoffs/` (KIT, read-only), fill
   it, and **write** the filled instance to `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`
   (STATE, this repo) — ticket-scoped for delivery handoffs, `REL-` for release, `INC-`
   for incident, the sprint ID for sprint artifacts. The instance is the work product AND
   the memory. When the work was queued (the parallel substrate), wrap the job thinly:
   **claim the subtask per Workflow 17 (`agent-factory/workflows/17-task-claim.md`) →
   read/write shared context per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`)
   → mark the subtask done.** Reference those workflows; never restate their mechanics here.
5. **Exit.** Print `■ exiting <ROLE>` and return control to the Orchestrator. The
   Orchestrator reads ONLY the handoff — never the exited role's running chatter.

## The invariant (the whole point)

**A role's sole memory of earlier roles is the handoff packet — never the running
conversation.** One window, but clean boundaries: each grug starts from the handoff,
not from whatever the last grug was muttering. If it is not written in a handoff, the
next role does not know it. This keeps scratch context from one role bleeding into the
next even though they share a single window.

Spawning is coordinator-only, and only on Claude Code: the four non-spawning CLIs run
the single-window sequential role-load above, and on Claude Code only the coordinator
(`coordinator: true`) spawns role agents. Whichever mode runs, the invariant holds — drop
prior context, the handoff is the only memory.
