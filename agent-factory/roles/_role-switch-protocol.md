---
kind: protocol
tier: core
---
# Role-switch protocol

Single source for HOW a role activates. grugops runs every role in ONE context
window — the head grug and each specialist grug live in the same window, one after
another. grugops does **NOT** spawn sub-agents. This is sequential role-load: the
Orchestrator loads each role's file into the same window in turn, the role does its
one job, hands off, and control returns to the Orchestrator.

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
4. **Produce the handoff.** Do the one job and write the role's handoff file under
   `agent-factory/handoffs/`. The handoff is the work product AND the memory.
5. **Exit.** Print `■ exiting <ROLE>` and return control to the Orchestrator. The
   Orchestrator reads ONLY the handoff — never the exited role's running chatter.

## The invariant (the whole point)

**A role's sole memory of earlier roles is the handoff packet — never the running
conversation.** One window, but clean boundaries: each grug starts from the handoff,
not from whatever the last grug was muttering. If it is not written in a handoff, the
next role does not know it. This keeps scratch context from one role bleeding into the
next even though they share a single window.

No `Agent` tool. No sub-agent spawn. One window, drop prior context, the handoff is
the only memory.
