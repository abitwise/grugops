<!-- GSD:project-start source:PROJECT.md -->
## Project

**grugops**

grugops is a file-based **agent factory** for software delivery: a small kit of markdown — role prompts, workflows, a shared verified context, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator (the "head grug") decomposes each request into subtasks and enqueues them on a shared queue, drawing on whichever specialist roles the work needs — business analysis, product, system analysis, architecture, engineering, QE/E2E, security/NFR/compliance, UAT, release — while a few single-job "grug" agents claim that work and execute within hard limits. No agent hands data to another; the shared verified context is the only memory between them.

It is lean by default and scales to enterprise governance on a single config flag. It is for solo builders who want just-enough discipline and for regulated teams who need auditable, gated, release-controlled agentic delivery. It is **not** a platform, runtime, database, queue, or hosted service — the intelligence lives in the host coding agent; grugops only supplies role, guardrail, memory, state, dial, proof, and gates.

**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, a shared verified context that nothing enters unverified, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. **The role is the intelligence. The workflow is the guardrail. The shared verified context is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.**

### Constraints

- **Tech stack**: Markdown for everything except the tooling layer, which is TypeScript (ratified 2026-06-13, D-13 — see the Recommended Stack section below). The tooling layer (the single installer, the structure validator, the ASVS generator, the foundation guards, and the prod-deploy hook) is authored in TypeScript, compiled with `tsc` to committed `.js`, and freshness-checked so the committed output cannot drift from its source. A single Node-required `install.ts` (compiled `install.js`) replaces the former dual POSIX/`install.mjs` installer; **Node 22+ is a hard install prerequisite**. The only dev/build dependencies are `{typescript, vitest}` (plus the type-only `@types/node`), used in grugops's own dev and CI and **never shipped to host machines**. Host machines run the committed `.js` with **zero runtime dependencies installed** — this preserves the spirit of the former no-npm-deps rule. — Why: boring on purpose; the host coding agent is the runtime, and the committed `.js` needs nothing installed to run cross-platform (including Windows, where POSIX shell cannot)
- **Safety (hard)**: Agents never merge a protected branch and never deploy to production without named human confirmation; prefer enforcing this *mechanically* (e.g. a Claude Code PreToolUse hook) not just by prompt — Why: "humans decide, agents execute" must be more than words; an agent cannot be held accountable
- **Single-source**: Role text lives once; per-tool adapters are thin pointers, never copies — Why: avoid drift across five tools
- **Zero-config first**: Every role must honor `factory.config.json` when present and run lean with sensible defaults when absent — Why: don't tax solo users; don't let enterprise users skip a gate
- **Voice discipline**: Caveman voice in every role prompt; clear voice in security findings, compliance, money, and disclaimers — Why: the joke earns trust, it never replaces the explanation or muddies a safety topic
- **Installers**: Idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content — Why: installing must be safe to re-run and undo
- **No fabrication**: Unknown commands are marked `UNKNOWN - verify`; never fake a passing gate, a test result, or a citation — Why: the trace is the proof
- **Minimal AGENTS.md**: Keep the substrate short and high-signal; push detail into the files it points to — Why: long machine-written context files measurably lower agent success and raise cost
- **Brand**: Always lowercase `grugops`; `/grug` command shape; original art only; keep grugbrain.dev attribution and the non-affiliation disclaimer visible — Why: brand consistency + IP safety
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR — what changed vs the spec's assumptions
## Recommended Stack
### Core Technologies (the formats grugops must emit)
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Markdown (CommonMark + YAML frontmatter)** | n/a | All roles, workflows, handoffs, checklists, AGENTS.md, agent/skill files | The whole kit is readable, diffable, git-native artifacts. Every target tool parses markdown + YAML frontmatter. Boring on purpose. |
| **AGENTS.md open standard** | LF-stewarded, plain markdown (no schema) | The single portable substrate every tool reads | "Just standard Markdown. Use any headings you like." 60k+ projects, 20+ tools, Agentic AI Foundation (Linux Foundation) governance. Closest-file-wins nesting. This is the linchpin of "write once, run everywhere." |
| **Claude Code plugin manifest** | `.claude-plugin/plugin.json`, schema as of CC v2.1.x (2026) | Versioned, shareable distribution form | Only `name` is required. Components live at plugin **root** (`agents/`, `commands/` or `skills/`, `hooks/`), never inside `.claude-plugin/`. |
| **Claude Code marketplace catalog** | `.claude-plugin/marketplace.json` | Single-plugin catalog users add with `/plugin marketplace add` | Required fields: `name`, `owner` (object, `name` required), `plugins` (array). Each plugin entry needs `name` + `source`. |
| **TypeScript (tooling layer, ratified 2026-06-13 — D-13)** | `install.ts`, `uninstall.ts`, `scripts/*.ts`, `hooks/guard.ts`, compiled with `tsc` to committed `.js`; `tsconfig.json` target ~ES2022, `newLine: lf` | The single source of truth for every tooling script (installer, validator, ASVS generator, foundation guards, prod-deploy hook) | Replaces the former dual POSIX `install.sh` + Node `install.mjs` pair. `tsc`-compiling to committed `.js` buys compile-time type-checking and a runnable artifact that needs **no toolchain on host machines**. A freshness check rebuilds to a temp dir and fails red on any drift, so the committed `.js` is provably a faithful build of its `.ts`. The dual sh/Node byte-parity install contract is retired (D-07/D-08): there is one installer, one source of truth. |
| **Node.js runtime (host prerequisite)** | Node **22+ LTS** (drops EOL Node 18); the host runs the committed `.js` directly | Cross-platform execution of the compiled tooling, including Windows where POSIX shell cannot run | Hosts and CI never run a build — they run the committed `.js` with `node`. Node 22+ is a documented hard install prerequisite for the scripted install path (the minimal markdown-copy path in `install/README.md` §1 still needs nothing). Dev/build deps are `{typescript, vitest}` (+ type-only `@types/node`) and a committed lockfile, all dev/CI-only and never shipped to hosts. |
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
| **`scripts/validate-agent-factory.ts`** (compiled `.js`) | grugops's own structure validator (spec §18) | Checks required files exist, role/workflow sections present, config parses, board↔ticket status match, traceability completeness, packaging presence. Structure not behavior. Never fakes results. |
## Installation (what users run)
# Minimal path (any tool) — "just install the markdown":
#   copy AGENTS.md + agent-factory/ into the repo, then tell the agent:
#   "start at agent-factory/roles/orchestrator.md"
# Scripted, per-tool conveniences (idempotent, additive, dry-run, reversible):
# Claude Code plugin form (versioned, shareable):
#   in Claude Code:
## Format Schemas (verified, copy-paste correct)
### 1. `.claude-plugin/plugin.json` (manifest)
- **`name`** (string, REQUIRED): kebab-case, no spaces. **This is the command namespace.** Naming the plugin `grug` makes commands read `/grug:<command>`; naming it `grugops` makes them `/grugops:<command>`. To get the brand's literal `/grug` (no colon), you cannot do it in plugin form — see decision below.
- **`version`** (string, optional but STRONGLY recommended): SemVer string. **If set, users only get updates when you bump it** — bump on every release. If omitted on a git-hosted plugin, every commit is a new version (the simpler-but-noisier option). Avoid setting `version` in both `plugin.json` and the marketplace entry; `plugin.json` wins silently.
- **`description`** (optional): shown in the plugin manager.
- **`author`** (optional object): `name` (+ optional `email`, `url`).
- **`displayName`** (optional, CC v2.1.143+): human-readable UI label; may contain spaces/casing. NOT used for namespacing — so it cannot give you literal `/grug`.
- **`homepage`, `repository`, `license`, `keywords`** (optional): standard metadata. `license` is an SPDX id.
- **Component path fields** (optional; only when overriding defaults): `agents`, `commands`, `skills`, `hooks`, `mcpServers`, `lspServers`, `outputStyles`, `experimental.themes`, `experimental.monitors`, `userConfig`, `dependencies`. Default discovery means you usually omit all of these.
- **Path behavior:** `commands`/`agents` override the default folder; `skills` adds to the default `skills/`. Unrecognized top-level fields are ignored (warned by validate). Wrong-type fields fail to load.
### 2. `.claude-plugin/marketplace.json` (single-plugin catalog)
- **REQUIRED:** `name` (kebab-case, public-facing, unique per user), `owner` (object; `name` required, `email` optional), `plugins` (array).
- **Each plugin entry REQUIRED:** `name` + `source`. `source` can be a relative path (`"./"`, must start with `./`, resolved from the marketplace **root** = the dir containing `.claude-plugin/`, never `..`), or an object: `{ "source": "github", "repo": "owner/repo", "ref": "v2.0.0", "sha": "..." }`, or `url` / `git-subdir` / `npm` forms.
- **Optional entry fields:** any `plugin.json` field plus `category`, `tags`, `strict` (default `true`), `displayName`, `defaultEnabled`.
- **Reserved names** (cannot use): `claude-plugins-official`, `anthropic-plugins`, `agent-skills`, etc. `grugops` is clear (confirmed available in brand manual §10.6).
- **Install flow:** `/plugin marketplace add <owner>/repo` (or local `./path`, or git URL) → `/plugin install grug@grugops`. CLI equivalents: `claude plugin marketplace add ...` / `claude plugin install grug@grugops`, with `--scope user|project|local`.
- **Caching gotcha:** plugins are **copied to a cache** on install. Files referenced via `../` outside the plugin dir are NOT copied. Keep everything the plugin needs inside the plugin directory (or symlink). This matters because grugops's canonical role text lives in `agent-factory/roles/` — see decision below.
### 3. Subagent: `.claude/agents/<role>.md` (standalone) or plugin `agents/<role>.md`
- **REQUIRED:** `name`, `description`. Everything else optional.
- **`description` drives auto-routing:** Claude reads it to decide when to delegate. Write it as a clear "Use for / Use when ..." with "use proactively" if you want eager routing.
- **`model`** (optional): `sonnet` | `opus` | `haiku` | full model id | **`inherit`** (the default). The spec's `model: inherit` is correct and matches the documented default.
- **`tools`** (optional): comma-separated allow-list. Omit to inherit all main-conversation tools. Use **`Agent`** (formerly `Task`) for spawning sub-agents; `Agent(worker, researcher)` restricts which.
- **`disallowedTools`** (optional): subtract from the inherited set (e.g. inherit everything except Write/Edit).
- **File locations + precedence (highest→lowest):** managed settings → `--agents` CLI flag → `.claude/agents/` (project, check into git) → `~/.claude/agents/` (user) → plugin `agents/` (lowest). Scanned recursively; identity comes only from frontmatter `name` (keep names unique).
- **Plugin-agent restriction:** plugin-shipped agents IGNORE `hooks`, `mcpServers`, `permissionMode` for security. If grugops needs those, ship them in standalone `.claude/agents/` or via settings, not the plugin.
- **Subagent vs single-agent sequential load — the key architectural fact:** Each subagent runs in its **own context window** with its own system prompt; the parent gets back only a summary. BUT **subagents cannot spawn subagents (no nesting).** So the grugops Orchestrator, when run as a Claude Code subagent, cannot itself spawn role subagents. Two valid designs:
### 4. Slash command — two forms
- Command frontmatter fields (all optional): `description`, `argument-hint`, `allowed-tools`, `disallowed-tools`, `model`, `disable-model-invocation`, `user-invocable`, `arguments`.
- **Skills equivalence:** `.claude/skills/grug/SKILL.md` also yields `/grug` and supports the same frontmatter plus supporting files. For a destructive action you never want Claude to auto-trigger (e.g. `/grug-release`), set `disable-model-invocation: true`.
### 5. Hooks — the mechanical prod-deploy guard
#!/usr/bin/env bash
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
- Use the **standalone `.claude/` form**: `.claude/commands/grug.md` (+ `grug-map.md`, `grug-plan.md`, `grug-ticket.md`, `grug-gate.md`, `grug-uat`, `grug-release`) → `/grug`, `/grug-map`, ...
- Because: only standalone command/skill files give an un-namespaced command name.
- Use the **plugin form**, name the plugin `grug` → commands read `/grug:plan`, `/grug:ticket`, etc.
- Keep `grugops` as the repo / marketplace / package name regardless (brand §5.2).
- Because: plugins always namespace `/<plugin>:<command>`; `/grug:plan` is the acceptable branded shape.
- Orchestrator = main thread via plugin `settings.json` `{ "agent": "grug-orchestrator" }`; it spawns role subagents with the `Agent` tool.
- Because: subagents cannot nest, so the Orchestrator must be the main thread to spawn others.
- Single-agent sequential role-load model (Orchestrator loads each role file into its own context in turn).
- Because: these tools read AGENTS.md and don't have Claude's spawnable-subagent model; this is the portable baseline anyway.
- Add the PreToolUse deploy-guard hook (plugin `hooks/hooks.json`); enforce the `production_requires_human_confirmation` config flag mechanically.
- Because: regulated teams need the guard to be code, not prose.
## Version Compatibility
| Item | Compatible With | Notes |
|------|-----------------|-------|
| Plugin manifest schema as documented | Claude Code v2.1.x (2026) | `displayName` needs v2.1.143+; `defaultEnabled` needs v2.1.154+; `--plugin-dir` zip needs v2.1.128+; hooks-own-session v2.1.139+. grugops uses none of the bleeding-edge fields, so it works on older v2.1.x too. |
| `Agent` tool name | CC v2.1.63+ | `Task` alias still works on newer versions for backward compat. |
| AGENTS.md | All 5 target CLIs (2026) | Gemini needs `context.fileName` set; others native. |
| Codex AGENTS.md | 32 KiB default `project_doc_max_bytes` | Keep AGENTS.md well under this. |
| `install.js` (compiled from `install.ts`) | Node **22+ LTS** | Uses `node:fs`/`node:path` + ESM; built with `tsc`, committed `.js` run directly (D-13). |
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- GSD:grugops-start-here -->
**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.
<!-- GSD:grugops-start-here-end -->
