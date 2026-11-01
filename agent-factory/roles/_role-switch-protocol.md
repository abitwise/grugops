---
kind: protocol
tier: core
---
# Role-switch protocol

This file is the single source for how a role activates. Every entry point names it by path; nobody else copies the steps.

The default is one context window with sequential role-load: the Orchestrator loads each role's file into the same window in turn. On the non-spawning host CLIs (Codex, Antigravity, OpenCode, Copilot, Pi) it is the only mode. On Claude Code the coordinator (the orchestrator adapter, which carries `coordinator: true`) may spawn role agents instead. They get the same roles, the same shared context and the same gates; only the dispatch differs. The steps below are the same in both modes.

## The 5 steps

When a role activates, run these five steps in order.

1. Print `▶ entering <ROLE>` so the window shows which role holds the work.
2. Read the role's file, `agent-factory/roles/<role>.md`, plus the shared verified context it needs.
   Pull that context on demand per Workflow 16 (`agent-factory/workflows/16-context-read-write.md`).
   Read nothing else: no other role's scratch, no scrolling back through the conversation.
3. Drop the instructions and scratch context of the role that ran before.
4. Do the one job; publish its output as typed notes per Workflow 16.
   Publish decisions as `decision` notes, risks as `finding` or `observation`, and deliverables as `artifact-ref`.
   Put the trace ids on each note's `refs` field. Publish several one-kind notes, never one large packet.
   When the work was queued, claim the subtask per Workflow 17 (`agent-factory/workflows/17-task-claim.md`) first.
   Mark the subtask done once its notes are published. Workflows 16 and 17 hold the mechanics.
5. Print `■ exiting <ROLE>`; control returns to the Orchestrator.
   The Orchestrator reads the role's published notes, never its running chatter.

## The invariant

A role's only memory of earlier roles is the shared verified context, read per Workflow 16, never the running conversation. If a fact is not published as a note, the next role does not know it. Each role starts from the verified context, so one role's scratch never leaks into the next, even in one window.

Only the coordinator spawns, and only on Claude Code. In either mode the invariant holds: drop prior context, and treat the shared verified context as the only memory.
