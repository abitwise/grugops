---
kind: packaging
tier: core
---
# Template: grugops skill (SKILL.md)

grug ship command as skill, not flat command file. skill is the forward path: it carries
supporting files and lets grug switch off auto-fire on the dangerous one (release).

This is the copy-ready template for a grugops command skill (`SKILL.md`). Like the
sub-agent wrapper, it is **pointer-text only** — it points the agent at the frozen role and
workflow files and never copies their bodies.

We ship the **`skills/` form** (recorded decision D-29), not the legacy flat `commands/`
form, because skills support supporting files and `disable-model-invocation: true` — which
we need on the destructive `grugops-release` command.

## Copy-ready template

```markdown
---
name: grugops-plan
description: Plan work with the grugops factory — turn an epic into ready tickets, or plan the next slice of delivery.
argument-hint: "<request>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
> **Kit vs state invariant:** `agent-factory/…` = read-only KIT (from the kit root, never written); `plans/`, `memory-bank/`, `.grugops/` = STATE in this repo. Roles pull shared context and publish typed notes per Workflow 16 — referenced, never restated. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)

Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`.grugops/factory.config.json`, the root `AGENTS.md`, and `plans/board.md`.
Then run the planning workflow `agent-factory/workflows/03-epic-to-tickets.md`.
Request: $ARGUMENTS
```

The destructive release skill adds one line so the agent can never auto-fire a release —
only a human can invoke it:

```markdown
---
name: grugops-release
description: Cut a release with the grugops Release Manager. Human-confirmed deploy only.
argument-hint: "<request>"
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
Act as the grugops Orchestrator and activate the Release Manager: read
`agent-factory/roles/orchestrator.md`, then `agent-factory/roles/release-manager.md`, then
run `agent-factory/workflows/12-release.md`. A named human must approve the production
deploy. Request: $ARGUMENTS
```

## The dash-standalone vs. colon-plugin naming asymmetry

The command shape depends on *where* the skill directory lives — this asymmetry is
load-bearing, so name the directories deliberately:

- **Standalone form** (`.claude/skills/<dir>/SKILL.md`, user- or project-scoped): the
  directory name *is* the whole command, invoked with a **dash** and **no colon**. So the
  standalone skill directories carry the full `grugops-` prefix:
  `grugops`, `grugops-map`, `grugops-plan`, `grugops-ticket`, `grugops-gate`, `grugops-uat`,
  `grugops-release` → invoked `/grugops-plan`, `/grugops-release`, etc.
- **Plugin form** (`skills/<dir>/SKILL.md` at the plugin root): Claude Code hard-codes
  `/<plugin>:<dir>` **colon** namespacing — the plugin name `grugops` already supplies the
  prefix. So the plugin skill directories **omit** the `grugops-` prefix:
  `plan`, `map`, `ticket`, `gate`, `uat`, `release`, `grugops` → invoked `/grugops:plan`,
  `/grugops:release`, etc.

Do not carry the `grugops-` prefix into the plugin directory names, or you get the doubled
`/grugops:grugops-plan`. The two surfaces coexist; the body of the skill is identical.

## Notes

- **Body is repo-relative pointer-text.** It names `agent-factory/roles/orchestrator.md`
  and the workflow file, resolved against the user's repo — never a `../` filesystem path
  (broken in the plugin cache) and never a copy of the role or workflow body.
- **Kit-root resolution is single-sourced.** Every skill body opens with the compressed
  kit-vs-state invariant (above), but the full sole-resolver self-heal/STOP block lives in
  ONLY two adapters — `.claude/skills/grugops/SKILL.md` (the dispatcher) and
  `.claude/agents/grugops-orchestrator.md` (and the matching `subagent.frontmatter.md`
  resolver template). The other op-skills carry the invariant only and defer kit-root
  resolution to the Orchestrator. The kit-home env var is named ONLY in those resolver
  adapters/templates — never in an op-skill, a role, a workflow, or `AGENTS.md`. The
  installer materializes the absolute kit path into the resolver adapters' slot [1]; the
  one-line self-heal is the fallback below it.
- **`disable-model-invocation: true` belongs on `grugops-release`** — the destructive,
  deploy-touching command — so the model can never auto-trigger it; only a human invokes it.
  This pairs with the mechanical prod-deploy guard (see `adapters.md`).
- **No spawn tool in a skill's `allowed-tools`.** A slash-command skill never spawns — spawning
  is coordinator-only and lives on the orchestrator sub-agent adapter, not on a command skill.
  On the four non-spawning host CLIs grugops activates each role via single-window sequential
  role-load (`agent-factory/roles/_role-switch-protocol.md`: one window, drop prior context
  between roles, the shared verified context is the only memory); on Claude Code the coordinator
  may spawn role agents instead. Either way the skill grants only the file/shell tools it uses and
  never a spawn tool. Reference: `code.claude.com/docs/en/skills`.
- Clear voice for the safety line (named-human-approval); light grug wink only in framing.
