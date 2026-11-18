<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# release

Cut a release with the grugops Release Manager. Human-confirmed deploy only — a named human must approve the production deploy.

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops-release "<request>"` (standalone skill) or `/grugops:release "<request>"` (plugin) |
| Codex CLI | Through the dispatcher: type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | Through the dispatcher: type `/grugops <request>` |
| OpenCode | Through the dispatcher: type `/grugops <request>` |
| GitHub Copilot CLI | Through the dispatcher: ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | Through the dispatcher: start Pi at the repository root and type `/grugops <request>` |

A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [grugops](grugops.md), and ask for the work.

## Workflows

- Release: [agent-factory/workflows/12-release.md](../../../agent-factory/workflows/12-release.md)
- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

- [Orchestrator](../agents/orchestrator.md)
- [Release Manager](../agents/release-manager.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/release/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/release/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
