<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# plan

Plan work with the grugops factory — turn an idea into epics, or turn an epic into ready tickets.

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops-plan "<request>"` (standalone skill) or `/grugops:plan "<request>"` (plugin) |
| Codex CLI | Through the dispatcher: type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | Through the dispatcher: type `/grugops <request>` |
| OpenCode | Through the dispatcher: type `/grugops <request>` |
| GitHub Copilot CLI | Through the dispatcher: ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | Through the dispatcher: start Pi at the repository root and type `/grugops <request>` |

A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [grugops](grugops.md), and ask for the work.

## Workflows

- Idea to epics: [agent-factory/workflows/02-idea-to-epics.md](../../../agent-factory/workflows/02-idea-to-epics.md)
- Epic to tickets: [agent-factory/workflows/03-epic-to-tickets.md](../../../agent-factory/workflows/03-epic-to-tickets.md)
- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

- [BA/PM](../agents/ba-pm.md)
- [Orchestrator](../agents/orchestrator.md)
- [System Analyst](../agents/system-analyst.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/plan/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/plan/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
