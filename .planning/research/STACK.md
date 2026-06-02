# Stack Research

**Domain:** Multi-agent SDLC delivery kit shipped as markdown + per-tool installers + a Claude Code plugin (no app runtime)
**Researched:** 2026-06-02
**Confidence:** HIGH (all six dimensions verified against current official docs at code.claude.com, agents.md, developers.openai.com, geminicli.com, opencode.ai, docs.github.com, keepachangelog.com, semver.org — Jan/Feb 2026 doc state)

> "Stack" here means the **host-tool integration formats and packaging conventions** grugops must conform to, NOT an application framework. The build artifact is markdown plus two installers (`install.sh` POSIX + `install.mjs` Node) and one optional Node validator. The host coding agent is the runtime.

---

## TL;DR — what changed vs the spec's assumptions

The v2 spec was written against an older snapshot of the Claude Code docs. Five things have moved and the roadmap must account for them:

1. **Claude Code docs moved host:** `docs.claude.com/en/docs/claude-code/*` now 301-redirects to **`code.claude.com/docs/en/*`**. Update every link in generated docs/README. (HIGH)
2. **Commands merged into Skills.** "Custom commands have been merged into skills." `.claude/commands/grug.md` and `.claude/skills/grug/SKILL.md` both create `/grug` and work identically. `commands/` still works and is fine to use; `skills/` is the recommended forward path for new plugins. (HIGH)
3. **The Task tool is now `Agent`** (renamed in v2.1.63). `Task(...)` still works as an alias. Use `Agent` in new agent frontmatter `tools:` lists. (HIGH)
4. **Subagents cannot spawn subagents** (no nesting). This directly constrains the Orchestrator design — see ARCHITECTURE implications below. (HIGH)
5. **The PreToolUse hook now has a first-class `if:` matcher using permission-rule syntax** (e.g. `if: "Bash(kubectl apply*)"`). This makes the "humans decide" prod-deploy guard genuinely mechanical and clean. (HIGH)

The spec's core bet — one portable AGENTS.md core + thin per-tool adapters — is **fully validated**: AGENTS.md is now a Linux Foundation standard with 60k+ projects and 20+ tools, and all five target CLIs consume it (Gemini needs one settings line; the rest read it natively).

---

## Recommended Stack

### Core Technologies (the formats grugops must emit)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Markdown (CommonMark + YAML frontmatter)** | n/a | All roles, workflows, handoffs, checklists, AGENTS.md, agent/skill files | The whole kit is readable, diffable, git-native artifacts. Every target tool parses markdown + YAML frontmatter. Boring on purpose. |
| **AGENTS.md open standard** | LF-stewarded, plain markdown (no schema) | The single portable substrate every tool reads | "Just standard Markdown. Use any headings you like." 60k+ projects, 20+ tools, Agentic AI Foundation (Linux Foundation) governance. Closest-file-wins nesting. This is the linchpin of "write once, run everywhere." |
| **Claude Code plugin manifest** | `.claude-plugin/plugin.json`, schema as of CC v2.1.x (2026) | Versioned, shareable distribution form | Only `name` is required. Components live at plugin **root** (`agents/`, `commands/` or `skills/`, `hooks/`), never inside `.claude-plugin/`. |
| **Claude Code marketplace catalog** | `.claude-plugin/marketplace.json` | Single-plugin catalog users add with `/plugin marketplace add` | Required fields: `name`, `owner` (object, `name` required), `plugins` (array). Each plugin entry needs `name` + `source`. |
| **POSIX sh** | `install.sh` (`#!/usr/bin/env sh`, `set -eu`) | Idempotent, additive, dry-run installer for Unix | Maximum portability, no Node dependency on the install path. |
| **Node.js (ESM)** | `install.mjs` + optional `scripts/validate-agent-factory.mjs`, Node 18+ LTS | Cross-platform installer (Windows/no-POSIX) + structure validator | Node 18+ ships `node:fs`/`node:path` and ESM by default; matches the spec's `import` syntax. Only add `package.json` if one already exists (spec §18). |
| **SemVer 2.0.0** | 2.0.0 | Version scheme for `VERSION`, `plugin.json`, release IDs | `MAJOR.MINOR.PATCH`. Note: grugops itself is pre-1.0 territory; if you ship as `2.0.0` (matching the spec's VERSION) you accept SemVer's "MAJOR bump on breaking change" contract from day one. |
| **Keep a Changelog 1.1.0** | 1.1.0 | `CHANGELOG.md` format; Release Manager role output | Sections: Added / Changed / Deprecated / Removed / Fixed / Security, plus an `Unreleased` block. "Changelogs are for humans." |

### Supporting Libraries / Conventions

| Library / Convention | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **`${CLAUDE_PLUGIN_ROOT}`** | CC v2.1.x | Absolute path to the installed plugin dir | Any bundled script path inside hooks/MCP/monitor configs. Path changes on update — treat as ephemeral, never write state there. |
| **`${CLAUDE_PLUGIN_DATA}`** | CC v2.1.x | Persistent per-plugin state dir (survives updates) | Only if grugops ever bundles installed deps; not needed for a markdown kit. |
| **`${CLAUDE_PROJECT_DIR}`** | CC v2.1.x | Project root, also passed to hook subprocesses | Reference project-local scripts from standalone (non-plugin) hooks. |
| **`$ARGUMENTS` / `$0` `$1` / `$name`** | CC v2.1.x | Pass the user request into the `/grug` command | `$ARGUMENTS` = full request string; `$ARGUMENTS[N]`/`$N` = indexed (shell-quoted); `$name` = named via `arguments:` frontmatter. |
| **`jq`** | any | Parse hook stdin JSON inside the prod-deploy guard | `jq -r '.tool_input.command'` to read the Bash command in a PreToolUse hook. Document as a guard dependency (or do the check in Node). |
| **Gemini `settings.json` `context.fileName`** | Gemini CLI 2026 | Make Gemini CLI read AGENTS.md directly | `{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }` — cleaner than a `GEMINI.md` pointer. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **`claude plugin validate <dir>`** (or `/plugin validate`) | Validate `plugin.json` + `marketplace.json` + agent/skill/command/hook frontmatter | Run in CI before publishing. `--strict` turns warnings (e.g. misspelled fields, non-kebab-case names) into errors. Use it; it is the authoritative gate. |
| **`claude --plugin-dir ./grugops-plugin`** | Local plugin testing without install | Fastest dev loop. Also accepts a `.zip` (CC v2.1.128+). |
| **`/reload-plugins`** | Hot-reload plugin changes mid-session | Picks up skills, agents, hooks, MCP, LSP without restart. |
| **`scripts/validate-agent-factory.mjs`** | grugops's own structure validator (spec §18) | Checks required files exist, role/workflow sections present, config parses, board↔ticket status match, traceability completeness, packaging presence. Structure not behavior. Never fakes results. |

## Installation (what users run)

```bash
# Minimal path (any tool) — "just install the markdown":
#   copy AGENTS.md + agent-factory/ into the repo, then tell the agent:
#   "start at agent-factory/roles/orchestrator.md"

# Scripted, per-tool conveniences (idempotent, additive, dry-run, reversible):
sh install/install.sh                 # POSIX
DRY_RUN=1 sh install/install.sh       # preview, change nothing
node install/install.mjs              # cross-platform equivalent
sh install/uninstall.sh               # removes only what the installer added

# Claude Code plugin form (versioned, shareable):
#   in Claude Code:
/plugin marketplace add <owner>/grugops      # add the catalog (git repo)
/plugin install grug@grugops                 # install the plugin
```

---

## Format Schemas (verified, copy-paste correct)

### 1. `.claude-plugin/plugin.json` (manifest)

Only `name` is required. Components live at the **plugin root**, never in `.claude-plugin/`.

```json
{
  "name": "grug",
  "version": "2.0.0",
  "description": "File-based SDLC agent factory: orchestrator + lean role agents, Kanban/Sprint delivery, enterprise gates, brownfield/greenfield mapping.",
  "author": { "name": "Olger Oeselg", "email": "abitwise@gmail.com" },
  "homepage": "https://github.com/<owner>/grugops",
  "repository": "https://github.com/<owner>/grugops",
  "license": "MIT",
  "keywords": ["sdlc", "agents", "kanban", "delivery", "agents-md"]
}
```

- **`name`** (string, REQUIRED): kebab-case, no spaces. **This is the command namespace.** Naming the plugin `grug` makes commands read `/grug:<command>`; naming it `grugops` makes them `/grugops:<command>`. To get the brand's literal `/grug` (no colon), you cannot do it in plugin form — see decision below.
- **`version`** (string, optional but STRONGLY recommended): SemVer string. **If set, users only get updates when you bump it** — bump on every release. If omitted on a git-hosted plugin, every commit is a new version (the simpler-but-noisier option). Avoid setting `version` in both `plugin.json` and the marketplace entry; `plugin.json` wins silently.
- **`description`** (optional): shown in the plugin manager.
- **`author`** (optional object): `name` (+ optional `email`, `url`).
- **`displayName`** (optional, CC v2.1.143+): human-readable UI label; may contain spaces/casing. NOT used for namespacing — so it cannot give you literal `/grug`.
- **`homepage`, `repository`, `license`, `keywords`** (optional): standard metadata. `license` is an SPDX id.
- **Component path fields** (optional; only when overriding defaults): `agents`, `commands`, `skills`, `hooks`, `mcpServers`, `lspServers`, `outputStyles`, `experimental.themes`, `experimental.monitors`, `userConfig`, `dependencies`. Default discovery means you usually omit all of these.
- **Path behavior:** `commands`/`agents` override the default folder; `skills` adds to the default `skills/`. Unrecognized top-level fields are ignored (warned by validate). Wrong-type fields fail to load.

**What NOT to do:** Do not put `agents/`, `commands/`, `skills/`, or `hooks/` inside `.claude-plugin/`. Only `plugin.json` (and `marketplace.json`) live there. This is the single most common plugin mistake and the docs call it out explicitly.

### 2. `.claude-plugin/marketplace.json` (single-plugin catalog)

```json
{
  "name": "grugops",
  "owner": { "name": "Olger Oeselg", "email": "abitwise@gmail.com" },
  "description": "The simple software factory — a full SDLC as a few simple agents.",
  "plugins": [
    {
      "name": "grug",
      "source": "./",
      "description": "SDLC agent factory v2 (lean by default, enterprise on a flag)."
    }
  ]
}
```

- **REQUIRED:** `name` (kebab-case, public-facing, unique per user), `owner` (object; `name` required, `email` optional), `plugins` (array).
- **Each plugin entry REQUIRED:** `name` + `source`. `source` can be a relative path (`"./"`, must start with `./`, resolved from the marketplace **root** = the dir containing `.claude-plugin/`, never `..`), or an object: `{ "source": "github", "repo": "owner/repo", "ref": "v2.0.0", "sha": "..." }`, or `url` / `git-subdir` / `npm` forms.
- **Optional entry fields:** any `plugin.json` field plus `category`, `tags`, `strict` (default `true`), `displayName`, `defaultEnabled`.
- **Reserved names** (cannot use): `claude-plugins-official`, `anthropic-plugins`, `agent-skills`, etc. `grugops` is clear (confirmed available in brand manual §10.6).
- **Install flow:** `/plugin marketplace add <owner>/repo` (or local `./path`, or git URL) → `/plugin install grug@grugops`. CLI equivalents: `claude plugin marketplace add ...` / `claude plugin install grug@grugops`, with `--scope user|project|local`.
- **Caching gotcha:** plugins are **copied to a cache** on install. Files referenced via `../` outside the plugin dir are NOT copied. Keep everything the plugin needs inside the plugin directory (or symlink). This matters because grugops's canonical role text lives in `agent-factory/roles/` — see decision below.

### 3. Subagent: `.claude/agents/<role>.md` (standalone) or plugin `agents/<role>.md`

```markdown
---
name: grug-orchestrator
description: Single entry point for the software factory. Use for any SDLC delivery request — bootstrapping a repo, turning ideas into tickets, implementing a ticket, running a quality gate, planning UAT, or cutting a release. Routes to specialist factory agents.
tools: Read, Grep, Glob, Bash, Edit, Write, Agent
model: inherit
---
You follow `agent-factory/roles/orchestrator.md` exactly. Read it now, then read
`agent-factory/config/factory.config.json`, `AGENTS.md`, and `plans/board.md`.
Then act as the Orchestrator: classify the request, respect WIP limits and config,
demand handoff packets, update the board and traceability, produce the next action.
Never merge a protected branch. Never deploy prod.
```

- **REQUIRED:** `name`, `description`. Everything else optional.
- **`description` drives auto-routing:** Claude reads it to decide when to delegate. Write it as a clear "Use for / Use when ..." with "use proactively" if you want eager routing.
- **`model`** (optional): `sonnet` | `opus` | `haiku` | full model id | **`inherit`** (the default). The spec's `model: inherit` is correct and matches the documented default.
- **`tools`** (optional): comma-separated allow-list. Omit to inherit all main-conversation tools. Use **`Agent`** (formerly `Task`) for spawning sub-agents; `Agent(worker, researcher)` restricts which.
- **`disallowedTools`** (optional): subtract from the inherited set (e.g. inherit everything except Write/Edit).
- **File locations + precedence (highest→lowest):** managed settings → `--agents` CLI flag → `.claude/agents/` (project, check into git) → `~/.claude/agents/` (user) → plugin `agents/` (lowest). Scanned recursively; identity comes only from frontmatter `name` (keep names unique).
- **Plugin-agent restriction:** plugin-shipped agents IGNORE `hooks`, `mcpServers`, `permissionMode` for security. If grugops needs those, ship them in standalone `.claude/agents/` or via settings, not the plugin.
- **Subagent vs single-agent sequential load — the key architectural fact:** Each subagent runs in its **own context window** with its own system prompt; the parent gets back only a summary. BUT **subagents cannot spawn subagents (no nesting).** So the grugops Orchestrator, when run as a Claude Code subagent, cannot itself spawn role subagents. Two valid designs:
  - **(A) Orchestrator is the main thread** (set `agent: "grug-orchestrator"` in plugin `settings.json`) and spawns role subagents via the `Agent` tool. This is the "native sub-agents" path the spec wants — but it requires the Orchestrator to be the main thread, not a spawned subagent.
  - **(B) Orchestrator is a single agent that sequentially loads each role file into its own context** when it would "wake" that role. This is the portable model used by Codex/Gemini/OpenCode/Copilot anyway. Same roles, same handoffs, same gates — only dispatch differs. This is the spec's stated fallback (§16.1) and is the safer default.
  - Recommendation: design for **(B) as the baseline** (works in all five tools and avoids the nesting limit) and offer **(A)** as a Claude-Code-native enhancement via `settings.json agent:`.

### 4. Slash command — two forms

**Standalone (gets literal `/grug`):** `.claude/commands/grug.md` → `/grug`. Filename (sans `.md`) = command name. No namespace.

```markdown
---
description: Run the software factory. Pass a request, e.g. /grug "implement ticket ABC-014".
argument-hint: "<request>"
---
Act as the factory Orchestrator (agent-factory/roles/orchestrator.md).
Request: $ARGUMENTS
Read config, AGENTS.md, and the board first. Then route and execute per the workflows.
```

**Plugin form (always namespaced):** a command in a plugin named `grug` becomes `/grug:<command>`. The plugin root command file or `skills/<name>/SKILL.md` → `/grug:<name>`. You **cannot** get a bare `/grug` (no colon) from a plugin.

- Command frontmatter fields (all optional): `description`, `argument-hint`, `allowed-tools`, `disallowed-tools`, `model`, `disable-model-invocation`, `user-invocable`, `arguments`.
- **Skills equivalence:** `.claude/skills/grug/SKILL.md` also yields `/grug` and supports the same frontmatter plus supporting files. For a destructive action you never want Claude to auto-trigger (e.g. `/grug-release`), set `disable-model-invocation: true`.

### 5. Hooks — the mechanical prod-deploy guard

This is how "humans decide, agents execute" becomes a guardrail, not a hope. Plugin hooks live in `hooks/hooks.json` (or inline in `plugin.json`); standalone hooks live in `.claude/settings.json`.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(kubectl apply*)",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/block-prod-deploy.sh"
          }
        ]
      }
    ]
  }
}
```

`block-prod-deploy.sh` (deny with a reason; recommended JSON method):

```bash
#!/usr/bin/env bash
cmd=$(jq -r '.tool_input.command' < /dev/stdin)
case "$cmd" in
  *"kubectl"*"apply"*|*"helm"*"upgrade"*|*"--context prod"*|*"deploy"*"prod"*)
    jq -n '{ hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Prod deploy blocked: humans decide. Get named human confirmation, then run outside the agent."
    }}' ;;
  *) exit 0 ;;
esac
```

- **`PreToolUse` can block; `PostToolUse` cannot** (the tool already ran — use it for lint/log only).
- **Two block methods:** exit code **2** (stderr message, simple) OR exit 0 + JSON `permissionDecision: "deny"` with a reason (recommended — gives the agent a message). Any other non-zero code is non-blocking.
- **`matcher`** filters by tool name (`"Bash"`, `"Edit|Write"`, or regex). **`if`** narrows further using permission-rule syntax — `if: "Bash(kubectl apply*)"` runs the hook only when the command matches. This pairing is the clean, deterministic guard.
- **Exec form vs shell form:** with `args` = exec form (no shell, no quoting needed for `${CLAUDE_PLUGIN_ROOT}`); without `args` = shell form (wrap `"${CLAUDE_PLUGIN_ROOT}"` in quotes). Prefer exec form for bundled scripts.
- Hook input on stdin includes `tool_name`, `tool_input.command`, `cwd`, `permission_mode`, `hook_event_name`. (Hooks-in-own-session behavior: CC v2.1.139+.)

### 6. AGENTS.md + per-tool entry files

| Tool | Entry file it reads | Adapter the installer lays down | Verified |
|------|---------------------|---------------------------------|----------|
| **Claude Code** | `AGENTS.md` is read; plus `CLAUDE.md` / `.claude/rules/*.md`. | Standalone: `.claude/agents/*.md` (thin wrappers) + `.claude/commands/grug.md` (literal `/grug`). OR plugin form (§16.4). One-line `CLAUDE.md` pointer optional. | HIGH |
| **Codex CLI** | `AGENTS.md` (root + nested) + global `~/.codex/AGENTS.md`. | None needed. Optional `~/.codex/AGENTS.override.md`. | HIGH |
| **Gemini CLI** | `GEMINI.md` by default; **configurable to read `AGENTS.md`** via `settings.json` `context.fileName`. | Either a one-line `GEMINI.md` pointer, or (cleaner) set `context.fileName: ["AGENTS.md","GEMINI.md"]`. Supports `@file.md` imports. | HIGH |
| **OpenCode** | `AGENTS.md` (project root + global `~/.config/opencode/AGENTS.md`) + `opencode.json` config. | None needed. Optional native-agent mapping (markdown agent files: `review.md` → `review` agent). | HIGH |
| **GitHub Copilot CLI** | `AGENTS.md` (root + nested) + `.github/copilot-instructions.md` (+ CLAUDE.md/GEMINI.md). **All combine — no priority fallback.** | Ensure `AGENTS.md` present; optional `.github/copilot-instructions.md` pointer. `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` env var can add dirs. | HIGH |

**Codex precedence (verified):** global `~/.codex/AGENTS.md` first, then walk Git-root→cwd concatenating each level's `AGENTS.md`; closer files override earlier ones (they appear later in the combined prompt). Default `project_doc_max_bytes` = 32 KiB — **another reason to keep AGENTS.md minimal** (the spec's instinct is correct and now has a hard byte cap behind it).

**The one rule every entry file enforces:** "All work starts with `agent-factory/roles/orchestrator.md`. Read AGENTS.md, then the orchestrator role, then the config, then the board."

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Ship **both** standalone `.claude/` AND plugin form | Plugin-only | Never for grugops — the brand requires literal `/grug` (only standalone delivers it) AND wants versioned distribution (only the plugin delivers that). Ship both; they coexist. |
| Plugin `commands/` (flat `.md`) for `/grug` | Plugin `skills/<name>/SKILL.md` | Use `skills/` if you want supporting files, auto model-invocation, or `disable-model-invocation` control on destructive commands like release. Both produce the same `/grug:<name>`. Commands are simpler and still fully supported. |
| `version` pinned in `plugin.json`, bumped per release | Omit `version` (git SHA = version) | Omit only for a fast internal dev loop where every commit-as-release is acceptable. For a public, shareable kit, pin and bump — predictable updates. |
| Set `version: "2.0.0"` to match spec | Start at `0.x` / `1.0.0` | Consider `0.x` if you want SemVer's "anything may change" latitude during dogfooding. The spec says `2.0.0` (continuity with the v2 spec); if you adopt it you commit to MAJOR-bump-on-break immediately. Flag for the human to decide. |
| Symlink role files in standalone install | Copy role files | Copy when targeting Windows without symlink privilege, or when shipping the **plugin** (plugins are copied to cache — symlinks to `../agent-factory/` will break). See "What NOT to use." |
| `jq` in the deploy-guard hook | Pure-Node guard script | Use Node if you don't want a `jq` dependency; read stdin and `JSON.parse`. Either is fine; document the dependency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Putting `agents/`, `commands/`, `skills/`, `hooks/` inside `.claude-plugin/`** | Documented #1 plugin mistake; components won't load. | Only `plugin.json` + `marketplace.json` in `.claude-plugin/`; all component dirs at plugin **root**. |
| **`Task` in new agent `tools:` lists** | Renamed to `Agent` in CC v2.1.63 (alias still works but is legacy). | `Agent` (or `Agent(role1, role2)` to scope). |
| **A plugin that symlinks/`../`-references `agent-factory/roles/`** | Plugins are copied to a cache on install; files outside the plugin dir are NOT copied → broken role references for installed users. | For the plugin form, either bundle the canonical role files inside the plugin dir, or have the wrappers read repo-relative paths that exist in the user's repo (the kit is in-repo anyway). Verify during dogfood. |
| **`docs.claude.com/en/docs/claude-code/*` links** | 301-redirect to `code.claude.com/docs/en/*`. | `code.claude.com/docs/en/*` in all generated docs. |
| **Long, machine-written AGENTS.md** | Measurably lowers agent success AND now hits Codex's 32 KiB `project_doc_max_bytes` cap. | Minimal, high-signal AGENTS.md that points to role/workflow files (spec §5.A.2, §17.1). |
| **`model:` other than `inherit` in role wrappers without reason** | Pins cost/capability; loses the user's session choice. | `model: inherit` (the documented default) unless a role genuinely needs a cheaper/stronger model. |
| **Relative-path plugin sources behind a raw-URL marketplace** | URL-served `marketplace.json` doesn't fetch plugin files; `./` sources 404. | Use a git-hosted marketplace (GitHub `owner/repo`), or `github`/`npm` plugin sources. |
| **Faking a gate/test/citation; inventing repo commands** | Destroys the trace, which is the entire value prop. | `UNKNOWN - verify`. Never fabricate (spec §19.9). |

## Stack Patterns by Variant

**If the user wants literal `/grug` (brand default):**
- Use the **standalone `.claude/` form**: `.claude/commands/grug.md` (+ `grug-map.md`, `grug-plan.md`, `grug-ticket.md`, `grug-gate.md`, `grug-uat`, `grug-release`) → `/grug`, `/grug-map`, ...
- Because: only standalone command/skill files give an un-namespaced command name.

**If the user wants versioned, shareable distribution:**
- Use the **plugin form**, name the plugin `grug` → commands read `/grug:plan`, `/grug:ticket`, etc.
- Keep `grugops` as the repo / marketplace / package name regardless (brand §5.2).
- Because: plugins always namespace `/<plugin>:<command>`; `/grug:plan` is the acceptable branded shape.

**If targeting Claude-Code-native multi-agent dispatch:**
- Orchestrator = main thread via plugin `settings.json` `{ "agent": "grug-orchestrator" }`; it spawns role subagents with the `Agent` tool.
- Because: subagents cannot nest, so the Orchestrator must be the main thread to spawn others.

**If targeting any of Codex / Gemini / OpenCode / Copilot:**
- Single-agent sequential role-load model (Orchestrator loads each role file into its own context in turn).
- Because: these tools read AGENTS.md and don't have Claude's spawnable-subagent model; this is the portable baseline anyway.

**If enterprise governance (mode=enterprise):**
- Add the PreToolUse deploy-guard hook (plugin `hooks/hooks.json`); enforce the `production_requires_human_confirmation` config flag mechanically.
- Because: regulated teams need the guard to be code, not prose.

## Version Compatibility

| Item | Compatible With | Notes |
|------|-----------------|-------|
| Plugin manifest schema as documented | Claude Code v2.1.x (2026) | `displayName` needs v2.1.143+; `defaultEnabled` needs v2.1.154+; `--plugin-dir` zip needs v2.1.128+; hooks-own-session v2.1.139+. grugops uses none of the bleeding-edge fields, so it works on older v2.1.x too. |
| `Agent` tool name | CC v2.1.63+ | `Task` alias still works on newer versions for backward compat. |
| AGENTS.md | All 5 target CLIs (2026) | Gemini needs `context.fileName` set; others native. |
| Codex AGENTS.md | 32 KiB default `project_doc_max_bytes` | Keep AGENTS.md well under this. |
| `install.mjs` | Node 18+ LTS | Uses `node:fs`/`node:path` + ESM. |
| SemVer 2.0.0 / Keep a Changelog 1.1.0 | Stable, no compat concerns | Both are mature, stable specs. |

## Open Questions / Flags for Roadmap

- **`UNKNOWN - verify` (LOW):** Exact behavior of the standalone-`/grug` command when grugops is *also* installed as the `grug` plugin in the same session (potential `/grug` vs `/grug:...` confusion). Resolve during dogfood (spec acceptance §20).
- **Decision needed (human):** Ship as `2.0.0` (spec continuity, SemVer break-contract from day one) vs `0.x` (dogfooding latitude). Default to spec's `2.0.0` unless the human prefers `0.x`.
- **Verify during dogfood:** Whether plugin-cache copying breaks the wrappers' `agent-factory/roles/*.md` references (they should resolve against the user's repo, not the plugin cache — confirm).

## Sources

- code.claude.com/docs/en/plugins — plugin creation, commands-merged-into-skills, structure rules (HIGH)
- code.claude.com/docs/en/plugins-reference — full plugin.json schema, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`, version management, scopes, caching (HIGH)
- code.claude.com/docs/en/plugin-marketplaces — marketplace.json schema, sources, `/plugin marketplace add` + `/plugin install` (HIGH)
- code.claude.com/docs/en/sub-agents — subagent frontmatter (name/description/tools/model:inherit), file locations + precedence, no-nesting rule, `Agent` (ex-`Task`) tool (HIGH)
- code.claude.com/docs/en/skills — commands-merged-into-skills, frontmatter, `$ARGUMENTS`/`$N`/`$name`, command-name-from-location table, `disable-model-invocation` (HIGH)
- code.claude.com/docs/en/hooks — PreToolUse/PostToolUse, `matcher` + `if:` permission-rule syntax, exit-2 vs JSON deny, exec/shell form (HIGH)
- agents.md — open standard, plain-markdown/no-schema, 60k+ projects, 20+ tools, Linux Foundation governance, closest-wins nesting (HIGH)
- developers.openai.com/codex/guides/agents-md — global `~/.codex/AGENTS.md`, root→cwd concatenation, closer-overrides, 32 KiB cap (HIGH)
- geminicli.com/docs/cli/gemini-md + google-gemini/gemini-cli docs — GEMINI.md default, `context.fileName` to read AGENTS.md, `@file.md` imports (HIGH)
- opencode.ai/docs/rules + /docs/agents — AGENTS.md project + `~/.config/opencode/AGENTS.md` global, opencode.json instructions, markdown agent files (HIGH)
- docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot + github.blog changelog 2025-08-28 — AGENTS.md (root+nested) + `.github/copilot-instructions.md`, all-combine behavior, `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` (HIGH)
- keepachangelog.com/en/1.1.0 — changelog sections + Unreleased convention (HIGH)
- semver.org — SemVer 2.0.0 MAJOR/MINOR/PATCH + 0.y.z rule (HIGH)

---
*Stack research for: multi-agent SDLC delivery kit (host-tool integration + packaging conventions)*
*Researched: 2026-06-02*
