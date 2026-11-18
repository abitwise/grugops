<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# ticket

Drive a ready ticket to a pull request with the grugops factory — implement on a branch, run the gate, stop at the PR.

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops-ticket "<request>"` (standalone skill) or `/grugops:ticket "<request>"` (plugin) |
| Codex CLI | Through the dispatcher: type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | Through the dispatcher: type `/grugops <request>` |
| OpenCode | Through the dispatcher: type `/grugops <request>` |
| GitHub Copilot CLI | Through the dispatcher: ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | Through the dispatcher: start Pi at the repository root and type `/grugops <request>` |

A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [grugops](grugops.md), and ask for the work.

## Workflows

- Ticket to PR: [agent-factory/workflows/04-ticket-to-pr.md](../../../agent-factory/workflows/04-ticket-to-pr.md)
- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

- [Orchestrator](../agents/orchestrator.md)
- [QE/E2E](../agents/qe-e2e.md)
- [Security/NFR](../agents/security-nfr.md)
- [Software Engineer](../agents/software-engineer.md)
- [Tech Lead](../agents/tech-lead.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/ticket/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/ticket/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
