<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-catalog.js -->
# uat

Build a UAT pack with the grugops factory — assemble the acceptance scenarios a human runs before sign-off.

## Invocation

| Host | How to start it |
| --- | --- |
| Claude Code | `/grugops-uat "<request>"` (standalone skill) or `/grugops:uat "<request>"` (plugin) |
| Codex CLI | Through the dispatcher: type `$grugops <request>`, or pick it from `/skills` |
| Antigravity CLI | Through the dispatcher: type `/grugops <request>` |
| OpenCode | Through the dispatcher: type `/grugops <request>` |
| GitHub Copilot CLI | Through the dispatcher: ask for the work you want done: Copilot CLI reads `.github/copilot-instructions.md` with its other instructions, and a live run is `UNKNOWN - verify` |
| Pi | Through the dispatcher: start Pi at the repository root and type `/grugops <request>` |

A host whose row says "Through the dispatcher" has no command of its own for this skill: start the dispatcher, [grugops](grugops.md), and ask for the work.

## Workflows

- UAT pack: [agent-factory/workflows/06-uat-pack.md](../../../agent-factory/workflows/06-uat-pack.md)
- context read/write: [agent-factory/workflows/16-context-read-write.md](../../../agent-factory/workflows/16-context-read-write.md)

## Roles it reaches

- [BA/PM](../agents/ba-pm.md)
- [Orchestrator](../agents/orchestrator.md)
- [QE/E2E](../agents/qe-e2e.md)
- [UAT Planner](../agents/uat-planner.md)

## Allowed tools

Read, Write, Bash, Glob, Grep

Source: [skills/uat/SKILL.md](https://github.com/abitwise/grugops/blob/main/skills/uat/SKILL.md). The standalone twin under `.claude/skills/` is generated from it and held equal by `npm run freshness:skill-twins`.
