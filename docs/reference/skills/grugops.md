<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# grugops

The grugops factory dispatcher — route any software-delivery request through the Orchestrator (bootstrap, plan, implement, gate, UAT, release).

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops "<request>"` (standalone skill) or `/grugops:grugops "<request>"` (plugin) |
| Codex CLI | type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | type `/grugops <request>` |
| OpenCode | type `/grugops <request>` |
| GitHub Copilot CLI | ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | start Pi at the repository root and type `/grugops <request>` |

## Workflows

The Orchestrator picks the workflow for the request. The skill itself names:

- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

The Orchestrator draws on the roles the request needs. The skill itself names, or runs a workflow that involves:

- [Orchestrator](../agents/orchestrator.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/grugops/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/grugops/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
