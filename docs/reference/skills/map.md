<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# map

Map or bootstrap a repo with the grugops factory — greenfield scaffold or brownfield survey, then seed the factory state.

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops-map "<request>"` (standalone skill) or `/grugops:map "<request>"` (plugin) |
| Codex CLI | Through the dispatcher: type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | Through the dispatcher: type `/grugops <request>` |
| OpenCode | Through the dispatcher: type `/grugops <request>` |
| GitHub Copilot CLI | Through the dispatcher: ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | Through the dispatcher: start Pi at the repository root and type `/grugops <request>` |

A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [grugops](grugops.md), and ask for the work.

## Workflows

- Bootstrap greenfield: [agent-factory/workflows/00-bootstrap-greenfield.md](../../../agent-factory/workflows/00-bootstrap-greenfield.md)
- Bootstrap brownfield: [agent-factory/workflows/01-bootstrap-brownfield.md](../../../agent-factory/workflows/01-bootstrap-brownfield.md)
- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

- [AGENTS.md Scribe](../agents/agents-md-scribe.md)
- [Architect/Design](../agents/architect-design.md)
- [BA/PM](../agents/ba-pm.md)
- [Brownfield Mapper](../agents/brownfield-mapper.md)
- [Greenfield Mapper](../agents/greenfield-mapper.md)
- [Orchestrator](../agents/orchestrator.md)
- [Security/NFR](../agents/security-nfr.md)
- [System Analyst](../agents/system-analyst.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/map/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/map/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
