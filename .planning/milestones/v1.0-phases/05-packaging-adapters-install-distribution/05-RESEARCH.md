# Phase 5: Packaging, Adapters, Install & Distribution - Research

**Researched:** 2026-06-03
**Domain:** Host-tool integration & distribution conventions for a markdown agent-factory kit (Claude Code plugin + standalone, 5-tool AGENTS.md adapters, POSIX/Node installers, mechanical PreToolUse deploy guard)
**Confidence:** HIGH — every volatile fact in this document was re-verified on 2026-06-03 against current official docs (code.claude.com, agents.md, developers.openai.com, opencode.ai, gemini-cli docs, docs.github.com) AND against live installed evidence on this machine (Claude Code v2.1.161, GSD skills, the `superpowers` 5.1.0 plugin cache, the `everything-claude-code` plugin).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

> Copied from `.planning/phases/05-packaging-adapters-install-distribution/05-CONTEXT.md`. The planner MUST honor these verbatim. Research below VERIFIES the volatile conventions these decisions depend on — it does not re-open them.

- **D-20 / D-27 (Dispatch-neutrality — ACTIVATED here):** Phase 5 is the single home for tool-specific dispatch. The spawn-vs-sequential difference (Claude subagents can't nest → Orchestrator runs as main thread; portable tools load roles sequentially) is **packaging content**, authored here and nowhere else. Do NOT edit role/workflow files to add dispatch.
- **D-04 (Shipped-kit identity):** Everything authored here is the generic, project-agnostic kit that drops onto any repo. grugops's OWN build state stays in `.planning/`. Installers/adapters describe *any* repo running the factory.
- **Constraints in force:** single-source ("adapters are thin pointers, **never copies**"); installers idempotent/additive/`DRY_RUN=1`/reversible/never-overwrite; safety enforced **mechanically**, not by prompt; `UNKNOWN - verify` never faked; always-lowercase `grugops`; clear voice for safety/install-report/guard content, light grug wink only in framing.
- **D-28 (Version):** Ship SemVer **0.1.0**. `agent-factory/VERSION` is canonical; mirror into `.claude-plugin/plugin.json` `version`; bump both together per release. **Do NOT set `version` in the marketplace entry** (plugin.json wins silently; divergence is a footgun).
- **D-29 (Naming + form):** Brand string is always `grugops`, never bare `grug` (legal-surface reduction — supersedes the literal-`/grug` assumption in CLAUDE.md/the brand manual). **Standalone = dash** (`/grugops`, `/grugops-map`, `/grugops-plan`, `/grugops-ticket`, `/grugops-gate`, `/grugops-uat`, `/grugops-release`) via user/project-scoped **skills**. **Plugin = colon** (`/grugops:plan`); the dash is not selectable in plugin form. Implementation = **`skills/`** (not `commands/`), enabling `disable-model-invocation: true` on `grugops-release`.
- **D-30 (Standalone wrappers):** symlink to `agent-factory/roles|workflows/*.md`; installer auto-detects no-symlink environments and falls back to copy, marking those entries `verify` in the report.
- **D-31 (Plugin wrappers):** repo-relative **pointer-text** ("read `agent-factory/roles/orchestrator.md`") resolved against the **user's repo** — NOT a `../` filesystem reference, because the plugin is copied to a cache and `../` paths are not copied. The plugin is a dispatch layer, not a standalone bundle; it requires `agent-factory/` present in the repo. MUST be verified at Phase-6 dogfood.
- **D-32 (Guard match set):** config-driven set of prod-deploy commands with sane defaults (`kubectl apply|rollout`, `helm upgrade|install`, `terraform apply`, `*deploy` for gcloud/aws/serverless/flyctl/`vercel --prod`, `npm publish`); per-project patterns extended at build/bootstrap, never hardcoded to one stack.
- **D-33 (Confirm signal):** human-set **session env var** (placeholder `GRUGOPS_PROD_DEPLOY_APPROVED`); hook denies unless present in the hook's own process env AND refuses any command that tries to set/`export` it inline; fails closed; pairs with `production_requires_human_confirmation: true`.
- **D-34 (Guard implementation):** **pure-Node** script (reads stdin, `JSON.parse`), no `jq`; blocks via exit 0 + JSON `permissionDecision: "deny"`; uses `${CLAUDE_PLUGIN_ROOT}` for its path.
- **SAFE-02 docs:** guard is **Claude-Code-only** (plugin hooks); the other four tools get the **`autonomy=pr` prompt-level fallback** — both facts MUST be documented. Guard lives in **plugin-level `hooks/hooks.json`** — never subagent frontmatter.
- **D-35 (adapters.md shape):** map 5 tools → entry file + dispatch mode + adapter; every row flagged "verify against current tool docs"; cite `code.claude.com/docs/en/*` links.
- **D-36 (INSTALL behavior):** `install.sh`/`install.mjs` functionally identical; idempotent/additive/`DRY_RUN=1`/reversible; detect host tool; symlink-with-copy-fallback; install report (created/linked/skipped/verify); never overwrite; `uninstall.sh` removes only what was added; `install/README.md` documents the minimal path + `/grugops install` self-bootstrap.
- **D-37 (Plugin hygiene):** components (`skills/`, `hooks/`) at plugin **root**, never inside `.claude-plugin/`; `.claude-plugin/` holds only `plugin.json` + `marketplace.json`; run `claude plugin validate --strict` before/in CI.

### Claude's Discretion

- Exact `adapters.md` table columns/wording; exact text of the two packaging templates (must use `Agent` not `Task`, `model: inherit`, cite frozen paths).
- The precise default deploy-command pattern list (regex/glob form) within D-32 and the config field name/location for the configurable set.
- The exact env-var name (`GRUGOPS_PROD_DEPLOY_APPROVED` is a placeholder) and the inline-set-refusal detection wording.
- Installer host-tool detection heuristics and install-report formatting; whether the standalone `/grugops` dispatcher uses `.claude/skills/` or `.claude/commands/`.
- The one-line `CLAUDE.md` pointer wording; whether to also drop a minimal `GEMINI.md` vs only the `settings.json` `context.fileName` route.
- Build/wave order of deliverables.

### Deferred Ideas (OUT OF SCOPE)

- Brand-docs reconciliation of the naming change → Phase 6 (BRAND-01/02).
- Validator coverage of packaging → Phase 6 (VAL-01).
- The decisive dogfood verification of D-31 + dual-dispatch parity → Phase 6 (DOG-01/02).
- Five example runs → Phase 6 (EX-01).
- Filling real gate/deploy commands into a project's `UNKNOWN - verify` slots and the guard's per-project pattern list → per-project at bootstrap, never fabricated in the kit.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-01 | `agent-factory/packaging/adapters.md` maps 5 tools → entry file + dispatch mode + adapter; enforces "all work starts at orchestrator.md"; states "only the dispatch differs, never the content"; flags every row "verify against current tool docs" | Per-Tool Entry Files (all 5 verified current); Architecture Patterns → Adapter table |
| PKG-02 | Packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) use `Agent` (not `Task`), single-source thin wrappers, recorded `commands/` vs `skills/` choice | Subagent Frontmatter (verified `Agent`, `model: inherit`); Skill/Command form (verified, `skills/` recorded by D-29) |
| CLAUDE-01 | Standalone `.claude/` form: thin per-role pointer wrappers, `/grugops*` dash skills, one-line `CLAUDE.md` pointer | Skill command-name-from-location (verified dash works for user/project skills); D-30 symlink-with-fallback |
| CLAUDE-02 | Plugin form: `plugin.json` + `marketplace.json`, `skills/`, `hooks/`; Orchestrator main-thread spawner; coexists with standalone | plugin.json schema (verified); no-nesting + main-thread `--agent` (verified); plugin-cache landmine (verified, D-31) |
| CLAUDE-03 | `settings.json` + hook scripts use `${CLAUDE_PLUGIN_ROOT}`; plugin name chosen for brand command shape | `${CLAUDE_PLUGIN_ROOT}` semantics (verified); namespacing `/plugin:command` (verified) |
| INSTALL-01 | `install.sh` + `install.mjs` functionally identical, idempotent, additive, `DRY_RUN=1`, reversible; detect host tool; lay down adapter; install report | Installer Mechanics; Don't Hand-Roll (ensure-line); Environment Availability |
| INSTALL-02 | `uninstall.sh` removes only what installer added; `install/README.md` documents minimal path + self-bootstrap | Installer Mechanics; minimal-markdown path (verified in agents.md model) |
| SAFE-02 | Plugin-level `hooks/hooks.json` PreToolUse Bash matcher denies deploy commands absent human-confirm flag (never subagent frontmatter); Claude-only + autonomy=pr fallback documented | PreToolUse hook spec (deny JSON, `if:`, stdin, env access — all verified); plugin-subagent-ignores-hooks (verified) |
</phase_requirements>

## Summary

This phase is research-flagged because plugin/marketplace/hook/skill/per-tool conventions move fast. The good news: **every volatile fact the locked decisions (D-28..D-37) depend on is CURRENT and VERIFIED as of 2026-06-03.** The pre-existing research in `CLAUDE.md` / `.planning/research/STACK.md` is accurate; this document confirms it field-by-field against the live docs and the installed `superpowers`/GSD evidence, and surfaces a small number of refinements and one divergence the planner should know about.

The work is pure assembly against frozen targets: thin pointer adapters for 5 tools (PKG), two coexisting Claude Code distribution forms — dash-standalone skills and a colon-namespaced plugin (CLAUDE), a pure-Node PreToolUse deploy guard that fails closed (SAFE-02), and idempotent/reversible POSIX+Node installers (INSTALL). No role/workflow/config content is authored — only dispatch, distribution, install, and the mechanical guard.

The two highest-risk facts both held up under verification: (1) the **plugin-cache `../` landmine** is real and documented verbatim ("Installed plugins cannot reference files outside their directory… those external files are not copied to the cache") — D-31's repo-relative-pointer-text design is the correct navigation; and (2) **plugin subagents silently ignore `hooks`/`mcpServers`/`permissionMode`** is current and explicit — so SAFE-02 MUST be a plugin-level `hooks/hooks.json`, exactly as locked.

**Primary recommendation:** Build directly from the locked decisions; treat this document as the verified schema reference. Use `Agent` (not `Task`), `model: inherit`, dash-standalone skills + colon-plugin, plugin.json version mirroring VERSION with version omitted from the marketplace entry, a pure-Node deny-JSON guard reading `tool_input.command` and checking its own process env, and ensure-line idempotent installers. Cite `code.claude.com/docs/en/*` (never `docs.claude.com`). Run `claude plugin validate --strict` as the structural gate.

## Architectural Responsibility Map

> grugops has no application runtime — "tiers" here are the integration surfaces a capability lives in. This map prevents misassigning dispatch logic into the frozen core or vice versa.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role/workflow intelligence | Frozen core (`agent-factory/`) | — | Authored in Phases 1–4; Phase 5 only points at it (D-20/D-31, never copies) |
| Tool dispatch (spawn vs sequential) | Packaging layer (`packaging/adapters.md` + wrappers) | — | The single home for tool-specifics (D-20 activated); core stays portable |
| Standalone command surface (`/grugops*` dash) | Claude Code host (`.claude/skills/`) | — | User/project-scoped skills give the un-namespaced dash shape (verified) |
| Versioned distribution (`/grugops:*` colon) | Claude Code plugin (`.claude-plugin/` + root `skills/`,`hooks/`) | Marketplace catalog | Plugins always namespace `/<plugin>:<cmd>`; the only versioned/shareable form |
| Mechanical prod-deploy safety | Plugin-level `hooks/hooks.json` PreToolUse | Node guard script (`${CLAUDE_PLUGIN_ROOT}`) | Hooks fire only at plugin level, not subagent frontmatter (verified) |
| Procedural prod-deploy safety (4 other tools) | Prompt + config (`autonomy=pr`, `production_requires_human_confirmation`) | — | No hook system on Codex/Gemini/OpenCode/Copilot; documented fallback |
| Per-tool entry wiring (AGENTS.md) | Host config files (Gemini `settings.json`, Copilot pointer; Codex/OpenCode native) | Root `AGENTS.md` (frozen) | Each tool reads AGENTS.md; only the wiring differs |
| Install/uninstall orchestration | `install/*.sh` + `install/*.mjs` | OS filesystem (symlink vs copy) | Two functionally-identical installers; Node path covers Windows/no-POSIX |

## Standard Stack

> "Stack" = the host-tool integration formats grugops must emit, not an app framework. All versions verified 2026-06-03.

### Core

| Library / Format | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Markdown (CommonMark + YAML frontmatter) | n/a | adapters.md, templates, skill SKILL.md, AGENTS.md pointers, install README | Every target tool parses it; boring on purpose; the host agent is the runtime `[CITED: agents.md]` |
| Claude Code plugin manifest | `.claude-plugin/plugin.json`, CC v2.1.x schema | Versioned, shareable distribution form | Only `name` required; components auto-discovered at plugin root `[VERIFIED: code.claude.com/docs/en/plugins-reference]` |
| Claude Code marketplace catalog | `.claude-plugin/marketplace.json` | Single-plugin catalog; `/plugin marketplace add` | Required `name`+`owner`+`plugins[]`; entries need `name`+`source` `[VERIFIED: code.claude.com/docs/en/plugin-marketplaces]` |
| Skill (`skills/<name>/SKILL.md`) | CC v2.1.x | The recorded command form (D-29) for both standalone dash + plugin colon | Forward path; supports `disable-model-invocation` `[VERIFIED: code.claude.com/docs/en/skills]` |
| PreToolUse hook (`hooks/hooks.json`) | CC v2.1.x | The mechanical SAFE-02 deploy guard | `if:` matcher + JSON deny + env access make it a real guard `[VERIFIED: code.claude.com/docs/en/hooks]` |
| POSIX sh | `install.sh` (`#!/usr/bin/env sh`, `set -eu`) | Idempotent additive installer for Unix | Max portability, no Node dependency on the POSIX path `[ASSUMED]` |
| Node.js (ESM) | `install.mjs` + the guard, Node 18+ (machine has v24.12.0) | Cross-platform installer (Windows) + pure-Node guard (D-34) | `node:fs`/`node:path` + ESM stdlib only; no deps `[VERIFIED: node --version → v24.12.0 on this machine]` |
| SemVer 0.y.z | 0.1.0 | VERSION + plugin.json version (D-28) | 0.x = anything-may-change latitude through dogfood `[CITED: semver.org]` |

### Supporting

| Convention | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` | CC v2.1.x | Absolute path to installed plugin dir | Hook + any bundled script path (D-34) `[VERIFIED: plugins-reference]` |
| `${CLAUDE_PROJECT_DIR}` | CC v2.1.x | Project root, exported to hook subprocess | If the guard ever needs project-relative config `[VERIFIED: hooks]` |
| `${CLAUDE_SKILL_DIR}` | CC v2.1.x | Skill's own dir at personal/project/plugin level | If a standalone skill references a bundled file `[VERIFIED: skills]` |
| Gemini `context.fileName` | Gemini CLI 2026 | Make Gemini read AGENTS.md | `.gemini/settings.json`: `{ "context": { "fileName": ["AGENTS.md","GEMINI.md"] } }` `[VERIFIED: gemini-cli docs + agents.md]` |
| `claude plugin validate --strict` | CC v2.1.x | Structural gate before publish | CI; turns field-name warnings into errors `[VERIFIED: plugins-reference]` |
| `claude --plugin-dir ./<dir>` | CC v2.1.128+ | Local plugin test without install | Fastest dev loop `[CITED: plugins-reference]` |

### Alternatives Considered

| Instead of (locked) | Could Use | Tradeoff (why locked choice wins) |
|------------|-----------|----------|
| `skills/` (D-29) | `commands/` flat `.md` | Both produce `/name`; only `skills/` supports `disable-model-invocation` for `grugops-release` + supporting files. Docs call `commands/` legacy. `[VERIFIED: skills]` |
| Dash standalone + colon plugin (D-29) | Plugin named `grug` → `/grug:plan` | User rejected bare `grug` for legal-surface reasons; dash genuinely unavailable in plugin form (verified). `[VERIFIED: skills command-name table]` |
| Pure-Node guard (D-34) | Bash + `jq` | `jq` IS present on this machine, but Node is already the install runtime; pure-Node avoids a dependency and is portable. `[VERIFIED: jq-1.7.1 present; node v24]` |
| Repo-relative pointer-text plugin (D-31) | Bundle role copies into plugin | Bundling breaks single-source ("never copies"); `../` references break in cache. D-31 is the only zero-copy option. `[VERIFIED: plugins-reference cache rule]` |
| `version` only in plugin.json (D-28) | Set in marketplace entry too | `plugin.json` wins silently; validator flags version mismatch between the two. `[VERIFIED: plugins-reference version-resolution]` |

### Installation (what end users run — for install/README.md)

```bash
# Minimal path (any of the 5 tools) — "just install the markdown":
#   ensure AGENTS.md + agent-factory/ are in the repo, then tell the agent:
#   "start at agent-factory/roles/orchestrator.md"

# Scripted, idempotent, additive, dry-run, reversible:
sh install/install.sh                 # POSIX
DRY_RUN=1 sh install/install.sh       # preview, change nothing
node install/install.mjs              # cross-platform equivalent
sh install/uninstall.sh               # removes only what the installer added

# Claude Code plugin form (versioned, shareable):
/plugin marketplace add <owner>/grugops     # add the catalog (git repo)
/plugin install grugops@grugops             # install the plugin (colon commands appear)
```

**Version verification performed (2026-06-03):**
- Claude Code: `claude --version` → **2.1.161** (newer than the v2.1.x baseline in prior research; every documented field — `displayName` v2.1.143+, `defaultEnabled` v2.1.154+ — is available, though grugops uses none of the bleeding-edge fields).
- Node: `node --version` → **v24.12.0** (well above the Node 18+ floor; `node:fs`/`node:path`/ESM all available).
- `jq`: **jq-1.7.1** present (not needed — D-34 uses pure Node).

## Package Legitimacy Audit

**Not applicable — this phase installs ZERO external packages.** The entire deliverable is markdown plus two installers and one guard script that use only language stdlib:

- `install.sh` — POSIX sh built-ins only (`ln`, `grep -qF`, `mkdir -p`, test).
- `install.mjs` — Node `node:fs` / `node:path` ESM stdlib only. No `package.json` with runtime deps is created (PROJECT.md constraint; spec §18).
- The deploy guard — pure Node, reads `process.stdin`, `JSON.parse`, `process.env`. No `jq`, no npm install.

This is an explicit design constraint ("Reject any dependency beyond Node's stdlib for the installer/validator" — PITFALLS.md Pitfall 3). slopcheck/registry verification is moot: there is no dependency manifest to audit. If a future plan proposes any npm/pip dependency, that is a scope violation and must be rejected.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌──────────────────────────────────────────┐
   user types a command  │   HOST CODING AGENT CLI (the runtime)     │
   ─────────────────────▶│   one of: Claude Code | Codex | Gemini    │
                         │          | OpenCode | GitHub Copilot       │
                         └───────────────┬──────────────────────────┘
                                         │ reads entry file (dispatch differs)
            ┌────────────────────────────┼────────────────────────────────────┐
            ▼                            ▼                                     ▼
   ┌──────────────────┐     ┌────────────────────────┐          ┌──────────────────────────┐
   │ Claude Code       │     │ Codex / OpenCode        │          │ Gemini / Copilot          │
   │ TWO forms:        │     │ read AGENTS.md NATIVELY  │          │ AGENTS.md via wiring:     │
   │  (a) standalone   │     │ (no adapter)             │          │  Gemini: settings.json    │
   │    .claude/skills │     │                          │          │    context.fileName       │
   │    /grugops* DASH │     │                          │          │  Copilot: optional        │
   │  (b) plugin       │     │                          │          │    .github/ pointer       │
   │    /grugops: COLON│     │                          │          │                            │
   │    + hooks/ GUARD │     │                          │          │                            │
   └────────┬──────────┘     └───────────┬─────────────┘          └────────────┬─────────────┘
            │ thin pointer (NEVER a copy) │ entry pointer                       │ entry pointer
            └────────────────────────────┴─────────────────┬───────────────────┘
                                                            ▼
                                  ┌───────────────────────────────────────────┐
                                  │  FROZEN SINGLE-SOURCE CORE (Phases 1–4)     │
                                  │  AGENTS.md ──▶ agent-factory/roles/         │
                                  │                orchestrator.md (entry rule) │
                                  │              + 15 other roles               │
                                  │              + workflows/00–13              │
                                  │              + config/factory.config.json   │
                                  │              + plans/board.md, traceability │
                                  └───────────────────────────────────────────┘

   DISPATCH MODES (the only thing that differs):
     • Claude Code plugin: Orchestrator = MAIN THREAD (claude --agent), spawns role
       subagents via the Agent tool (subagents cannot nest, so it must be main thread)
     • All other tools + Claude standalone: Orchestrator loads each role file
       sequentially into one context ("only the dispatch differs, never the content")

   SAFETY DATA FLOW (Claude Code only):
     Bash tool call ─▶ PreToolUse hook (matcher:"Bash", if:"Bash(<deploy>*)")
        ─▶ Node guard reads stdin {tool_input.command} + checks process.env
        ─▶ deny (exit 0 + JSON permissionDecision:"deny") unless human env var set
        ─▶ refuses any command that inline-sets the env var (no self-approval)
     Other 4 tools: autonomy=pr + production_requires_human_confirmation (procedural)
```

### Recommended Project Structure (what Phase 5 creates — all additive)

```
.claude-plugin/                 # plugin manifest dir — ONLY plugin.json + marketplace.json
├── plugin.json                 #   name: grugops, version: 0.1.0 (mirrors VERSION)
└── marketplace.json            #   catalog grugops; entry name grugops, source "./"; NO version key
skills/                         # PLUGIN components at ROOT (D-37) — /grugops:* colon
├── grugops/SKILL.md            #   the dispatcher (pointer-text → orchestrator.md, repo-relative)
├── grugops-map/SKILL.md
├── grugops-plan/SKILL.md
├── grugops-ticket/SKILL.md
├── grugops-gate/SKILL.md
├── grugops-uat/SKILL.md
└── grugops-release/SKILL.md    #   disable-model-invocation: true
hooks/
└── hooks.json                  # PreToolUse Bash matcher → ${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs
hooks/guard.mjs                 # pure-Node deny-JSON deploy guard (D-34)
.claude/                        # STANDALONE form — /grugops* DASH (user/project skills)
├── skills/grugops*/SKILL.md    #   7 dash skills (mirror of the plugin set; symlink or copy bodies per D-30)
└── (optional) agents/*.md      #   thin per-role subagent wrappers (Agent, model: inherit)
agent-factory/packaging/
├── adapters.md                 # PKG-01: 5-tool map + "only dispatch differs" + verify flags
├── subagent.frontmatter.md     # PKG-02 template (Agent, model: inherit, pointer body)
└── slash-command.template.md   # PKG-02 template (skill SKILL.md shape)
install/
├── install.sh                  # POSIX, idempotent, DRY_RUN, ensure-line, symlink+copy-fallback
├── install.mjs                 # Node equivalent (node:fs/node:path, ESM)
├── uninstall.sh                # removes ONLY what installer added
└── README.md                   # minimal path + /grugops install self-bootstrap
CLAUDE.md (one-line pointer)    # OR a .github/copilot-instructions.md / GEMINI.md per discretion
.gemini/settings.json           # context.fileName: ["AGENTS.md","GEMINI.md"]  (Gemini wiring)
```

### Pattern 1: plugin.json (manifest)

```json
// Source: code.claude.com/docs/en/plugins-reference (verified 2026-06-03)
{
  "name": "grugops",
  "version": "0.1.0",
  "description": "File-based SDLC agent factory: orchestrator + lean role agents, Kanban/Sprint delivery, enterprise gates, brownfield/greenfield mapping.",
  "author": { "name": "Olger Oeselg", "email": "abitwise@gmail.com" },
  "homepage": "https://github.com/<owner>/grugops",
  "repository": "https://github.com/<owner>/grugops",
  "license": "MIT",
  "keywords": ["sdlc", "agents", "kanban", "delivery", "agents-md"]
}
```
- **`name` is the ONLY required field** and is the namespace → commands read `/grugops:<command>` (verified). Plugin name `grugops` (D-29).
- **No component-path keys** (`skills`/`hooks`/`agents`) — default discovery finds `skills/` and `hooks/hooks.json` at root (verified; superpowers 5.1.0 plugin.json carries none either).
- `version: "0.1.0"` mirrors `agent-factory/VERSION` (D-28); bump both per release.

### Pattern 2: marketplace.json (catalog)

```json
// Source: code.claude.com/docs/en/plugin-marketplaces (verified 2026-06-03)
{
  "name": "grugops",
  "owner": { "name": "Olger Oeselg", "email": "abitwise@gmail.com" },
  "plugins": [
    {
      "name": "grugops",
      "source": "./",
      "description": "SDLC agent factory (lean by default, enterprise on a flag)."
    }
  ]
}
```
- Required: `name`, `owner` (with `owner.name`), `plugins[]`; each entry needs `name`+`source`.
- `source: "./"` is a relative path resolved from the marketplace root (the dir containing `.claude-plugin/`), must start with `./`, never `../` (verified).
- **`grugops` is NOT on the reserved-names list** (the current list was re-read — see Pitfalls; it expanded but `grugops` remains clear).
- **Deliberately NO `version` key in the entry** (D-28) — `plugin.json` wins, and the validator flags version mismatches between marketplace.json and the referenced plugin.json.
- **Top-level `description` caveat:** a known validator inconsistency (#38480) errors on a top-level `description` in `--strict` yet warns when absent. The example above omits a top-level `description` to be safe; the planner should verify current validator behavior and may add it under `metadata` if needed.

### Pattern 3: Skill SKILL.md — standalone dash vs plugin colon

```markdown
<!-- Source: code.claude.com/docs/en/skills (verified 2026-06-03) -->
<!-- Standalone:  .claude/skills/grugops-plan/SKILL.md   → invoked /grugops-plan  (DASH, no colon) -->
<!-- Plugin:      skills/grugops-plan/SKILL.md (plugin root) → invoked /grugops:grugops-plan (COLON) -->
---
name: grugops-plan
description: Plan work with the grugops factory. Turn an epic into ready tickets.
argument-hint: "<request>"
---
Act as the grugops Orchestrator: read agent-factory/roles/orchestrator.md, then
agent-factory/config/factory.config.json, AGENTS.md, and plans/board.md. Then run
the planning flow (agent-factory/workflows/03-epic-to-tickets.md). Request: $ARGUMENTS
```
**The destructive release skill adds one line:**
```markdown
---
name: grugops-release
description: Cut a release with the grugops Release Manager. Human-confirmed deploy only.
disable-model-invocation: true   # ← only YOU can fire it; Claude never auto-triggers (verified)
---
```
- **Command-name-from-location (verified, exact):** `.claude/skills/<dir>/SKILL.md` and `~/.claude/skills/<dir>/SKILL.md` → `/<dir>` (directory name, **no colon**). Plugin `skills/<dir>/SKILL.md` → `/<plugin>:<dir>` (namespaced). The frontmatter `name` is the display label, NOT the invocation, *except* for a plugin-root `SKILL.md`.
- **Naming nuance for the plugin:** to get `/grugops:plan` (clean colon shape) rather than `/grugops:grugops-plan`, name the plugin **skill directories** `plan`, `map`, `ticket`, etc. (the plugin name `grugops` already supplies the prefix). For the **standalone** dash form, the directories must be `grugops-plan`, `grugops-map`, etc. (the dir name is the whole command). The planner should resolve this asymmetry: standalone dir names carry the `grugops-` prefix; plugin dir names do not. `[VERIFIED: skills command-name table]`

### Pattern 4: Subagent wrapper (PKG-02 template + standalone agents/)

```markdown
<!-- Source: code.claude.com/docs/en/sub-agents (verified 2026-06-03) -->
---
name: grugops-orchestrator
description: Single entry point for the software factory. Use for any SDLC delivery request — bootstrap, ideas→tickets, implement a ticket, run a gate, plan UAT, cut a release. Routes to specialist factory roles.
tools: Read, Grep, Glob, Bash, Edit, Write, Agent
model: inherit
---
You follow `agent-factory/roles/orchestrator.md` exactly. Read it now, then read
`agent-factory/config/factory.config.json`, `AGENTS.md`, and `plans/board.md`.
Then act as the Orchestrator. Never merge a protected branch. Never deploy prod.
```
- Required frontmatter: `name`, `description` only. `model` defaults to `inherit` (verified).
- **Use `Agent`, not `Task`** — `Task` renamed to `Agent` in v2.1.63; alias still works but is legacy (verified). `Agent(role1, role2)` restricts which subagents can be spawned; omitting `Agent` from `tools` blocks all spawning.
- **Spawning only works when the agent runs as the MAIN THREAD** (`claude --agent <name>`). The plugin sets this default; spawned subagents cannot themselves spawn (no nesting — verified). This is exactly why the Orchestrator must be main-thread for the native dispatch path, and falls back to sequential role-load everywhere else.

### Pattern 5: PreToolUse deploy guard (SAFE-02 — D-32/33/34)

```json
// hooks/hooks.json — Source: code.claude.com/docs/en/hooks + plugins-reference (verified 2026-06-03)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs\"" }
        ]
      }
    ]
  }
}
```
```javascript
// hooks/guard.mjs (pure Node, D-34) — illustrative shape; planner authors final
// Source: hook stdin schema + deny-JSON verified at code.claude.com/docs/en/hooks
import { readFileSync } from "node:fs";
const input = JSON.parse(readFileSync(0, "utf8"));   // stdin
const cmd = input?.tool_input?.command ?? "";
// D-32: default prod-deploy patterns (configurable; extended per-project at bootstrap)
const DEPLOY = [/kubectl\s+(apply|rollout)/, /helm\s+(upgrade|install)/, /terraform\s+apply/,
                /\bgcloud\b.*deploy/, /\baws\b.*deploy/, /serverless\s+deploy/, /flyctl\s+deploy/,
                /vercel\s+.*--prod/, /npm\s+publish/];
const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";     // D-33 placeholder env var name
const isDeploy = DEPLOY.some((re) => re.test(cmd));
// D-33: refuse any command that tries to inline-set/export the approval var (no self-approval)
const selfApprove = new RegExp(`\\b(export\\s+)?${APPROVAL}\\s*=`).test(cmd);
function deny(reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  process.exit(0);                                   // exit 0 + JSON = blocked with a message
}
if (selfApprove) deny(`Refused: an agent may not set ${APPROVAL}. A human must export it in the launching shell.`);
if (isDeploy && !process.env[APPROVAL])              // fails CLOSED: deny unless human env var present
  deny(`Prod deploy blocked: humans decide. A human must set ${APPROVAL} in the shell that launches Claude, then run the deploy.`);
process.exit(0);                                     // allow everything else
```
- **Block methods (verified):** exit 2 + stderr, OR exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with `permissionDecisionReason`. D-34 uses the JSON form (gives the agent a message). Valid `permissionDecision` values: `deny`/`allow`/`ask`/`defer`.
- **stdin schema (verified):** `tool_name`, `tool_input` (for Bash: `tool_input.command`), `cwd`, `permission_mode`, `hook_event_name`, `session_id`, `transcript_path`.
- **Env access (verified):** the hook process inherits the parent environment — `process.env[APPROVAL]` reading the human-set session var is sound and is the mechanical backbone of D-33.
- **`if:` alternative:** the hook spec also supports a per-hook `if:` permission-rule matcher (e.g. `"if": "Bash(kubectl apply*)"`). D-32 wants a *configurable* multi-pattern set, so doing the match in the Node script (above) is more flexible than many static `if:` entries. The planner may use `if:` for a coarse pre-filter if desired, but the configurable set lives in the script.
- **CRITICAL placement (verified):** this MUST be plugin-level `hooks/hooks.json`. Plugin **subagents** ignore `hooks`/`mcpServers`/`permissionMode` — a guard in subagent frontmatter silently does nothing.

### Pattern 6: Per-tool entry wiring (PKG-01 / D-35)

```jsonc
// Gemini: .gemini/settings.json — Source: gemini-cli docs + agents.md (verified)
{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }
```
- **Codex & OpenCode:** read root `AGENTS.md` natively — **no adapter**. (Codex also `~/.codex/AGENTS.md`; OpenCode also `~/.config/opencode/AGENTS.md` + `opencode.json` `instructions`.)
- **Gemini:** `context.fileName` array (above) — cleaner than a `GEMINI.md` pointer; supports `@file.md` imports if a pointer is preferred.
- **Copilot CLI:** reads `AGENTS.md` (nearest-file wins) + optional `.github/copilot-instructions.md`; CLAUDE.md/GEMINI.md are recognized alternatives.
- **Claude Code:** both the standalone `.claude/` dash form and the plugin colon form; an optional one-line `CLAUDE.md` pointer.

### Anti-Patterns to Avoid

- **Putting `skills/`/`hooks/` inside `.claude-plugin/`** — the #1 documented plugin mistake; components won't load. Only `plugin.json` + `marketplace.json` live there (verified: "All other directories must be at the plugin root, not inside .claude-plugin/").
- **`Task` in new `tools:` lists** — legacy alias; use `Agent`.
- **`../agent-factory/` paths in the plugin** — broken in cache (verified). Use repo-relative pointer-text the running agent resolves against cwd (D-31).
- **Guard in subagent frontmatter** — silently ignored (verified). Plugin-level `hooks/hooks.json` only.
- **`docs.claude.com/...` links** — 301-redirect; cite `code.claude.com/docs/en/*`.
- **`version` in BOTH plugin.json and the marketplace entry** — plugin.json wins; validator flags the mismatch (D-28 avoids this).
- **`>` (truncate) on a user-owned file in the installer** — use append-if-missing (`grep -qF` then append).
- **A `CLAUDE.md` at the PLUGIN root expecting it to load** — verified: "A `CLAUDE.md` file at the plugin root is not loaded as project context." Ship instructions as skills. (The one-line `CLAUDE.md` pointer for CLAUDE-01 is in the USER's repo root, not the plugin — that one IS read by Claude Code.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent line-append in installer | Custom diff/dedupe logic | `grep -qF "<line>" file \|\| printf '%s\n' "<line>" >> file` (ensure-line) | Standard POSIX idempotency pattern; avoids duplicate pointer lines on re-run |
| Plugin structure validation | A bespoke JSON checker | `claude plugin validate --strict` | Authoritative gate; checks manifest, skill/agent/hook frontmatter, marketplace cross-refs |
| Hook deny mechanism | A custom permission system | PreToolUse + JSON `permissionDecision:"deny"` | First-class, fires before the tool runs, gives the agent a message |
| Human-confirm signal | Token-in-command / config flag | Session env var checked in hook's own `process.env` (D-33) | Env var is agent-unforgeable from inside a denied command; config flag is agent-editable |
| Multi-tool context wiring | Per-tool role copies | One AGENTS.md + thin entry pointers (D-31) | AGENTS.md is the LF standard 20+ tools read; copies drift (PITFALLS Pitfall 2) |
| Cross-platform install | Bash-only + assume symlinks | POSIX `install.sh` + Node `install.mjs`, symlink-with-copy-fallback (D-30) | Node path covers Windows/no-symlink; fallback degrades safely |
| JSON parsing in the guard | `jq` dependency | Node `JSON.parse(readFileSync(0))` (D-34) | No external dependency; Node is already the install runtime |

**Key insight:** Every "hard" part of this phase already has a first-class mechanism in the host tools (validate, hooks, env, AGENTS.md standard). The only thing grugops authors is thin glue — and the discipline is to keep it thin (pointers, not copies; stdlib, not deps).

## Runtime State Inventory

> This is an additive packaging phase, not a rename/refactor. No existing stored data, live-service config, OS-registered state, or build artifacts are mutated by Phase 5 itself. The relevant "state" question is what the *installed kit* touches on an end-user machine — captured here so the planner designs the installer/uninstaller correctly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — grugops writes no datastore; the board/traceability/metrics are markdown files authored by roles, not by Phase 5. | None — verified: `agent-factory/` + `plans/` are frozen markdown. |
| Live service config (end-user machine) | Gemini `.gemini/settings.json` `context.fileName` (installer must **merge**, not overwrite — user may have other keys). Optional `opencode.json` `instructions`. | Installer: read-modify-write JSON additively; back off if key already set; mark `verify` in report. |
| OS-registered state | Symlinks the installer creates under `.claude/` (D-30). On Windows without symlink privilege → copy fallback. | `uninstall.sh` removes only those symlinks/copies it created; never `agent-factory/`. |
| Secrets / env vars | The guard READS `GRUGOPS_PROD_DEPLOY_APPROVED` (D-33) — human-set, never written by grugops. Installer must NOT set it. | Document in install/README + guard README that the human exports it in the launching shell. |
| Build artifacts / installed packages | Plugin is **copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`** on install (verified live: superpowers at `…/superpowers/5.1.0/`). `../` paths are NOT copied → D-31. | No build step; the plugin requires `agent-factory/` present in the user's repo at runtime. Verify at dogfood. |

**The canonical question (installer view):** after `install.sh` runs, the only machine state added is (a) symlinks-or-copies under `.claude/`, (b) additive lines/keys in `CLAUDE.md`/`.gemini/settings.json`/optional Copilot pointer, and (c) on plugin install, a cache copy of the plugin dir. `uninstall.sh` reverses (a) and (b); (c) is reversed by `/plugin uninstall`. Nothing else is touched.

## Common Pitfalls

### Pitfall 1: Adapter drift — role content copied per tool
**What goes wrong:** To "support 5 tools," role text gets copied into per-tool adapter files; copies diverge.
**Why it happens:** Copying is the path of least resistance; the tools genuinely differ in *dispatch*.
**How to avoid:** Canonical role text lives once in `agent-factory/roles/*.md`. Adapters are thin pointers (frontmatter + one-line "read orchestrator.md"). For sequential tools the adapter is just an entry-file pointer. (Constraint: "thin pointers, never copies.")
**Warning signs:** An adapter contains role *instructions*; a grep for a distinctive role sentence returns >1 file; fixing a role needs >1 edit. `[CITED: PITFALLS.md Pitfall 2]`

### Pitfall 2: Plugin-cache `../` landmine (the D-31 hazard)
**What goes wrong:** A plugin wrapper references `../agent-factory/roles/orchestrator.md`; after marketplace install the plugin lives in a cache and those files are NOT copied → broken reference for every installed user.
**Why it happens:** It works in local `--plugin-dir` testing (files are in place) and silently breaks only after a real marketplace install.
**How to avoid:** Plugin wrappers use **pointer-text** ("read `agent-factory/roles/orchestrator.md`") that the *running agent* resolves against the user's repo cwd — never a filesystem `../` path in the manifest or a bundled copy. The plugin is a dispatch layer that requires `agent-factory/` present in the repo.
**Warning signs:** Any `../` in plugin files; the plugin "works for me" but a fresh install can't find roles.
**Verification:** MUST be exercised at Phase-6 dogfood (DOG-01/02). `[VERIFIED: plugins-reference — "Installed plugins cannot reference files outside their directory… not copied to the cache"]`

### Pitfall 3: Safety guard placed in subagent frontmatter (silently dead)
**What goes wrong:** The deploy guard is added to a plugin subagent's `hooks:` frontmatter; it never fires.
**Why it happens:** It looks natural to scope the hook to the orchestrator subagent.
**How to avoid:** Guard lives ONLY in plugin-level `hooks/hooks.json`. Plugin subagents ignore `hooks`/`mcpServers`/`permissionMode`.
**Warning signs:** No block when running a sample `kubectl apply`; guard defined under a subagent's frontmatter. `[VERIFIED: sub-agents — "plugin subagents do not support… ignored when loading agents from a plugin"]`

### Pitfall 4: Non-idempotent / overwriting installer
**What goes wrong:** Installer clobbers a user's `CLAUDE.md` or `.gemini/settings.json`, or appends duplicate lines on re-run.
**Why it happens:** Naive `>` truncation; blind append.
**How to avoid:** ensure-line (`grep -qF || append`); read-modify-write JSON additively (never overwrite the whole settings file); honor `DRY_RUN=1`; ship `uninstall.sh` that removes only what was added; test "run twice → zero diff". POSIX and Node installers must behave identically.
**Warning signs:** Re-run changes files; any `>` on a user-owned file; no `DRY_RUN` branch; no uninstall. `[CITED: PITFALLS.md Pitfall 7]`

### Pitfall 5: Namespacing surprise (dash vs colon)
**What goes wrong:** The expected `/grugops-plan` doesn't appear, or appears as `/grugops:grugops-plan`.
**Why it happens:** Confusing the standalone command-name-from-directory rule with the plugin `/<plugin>:<dir>` rule.
**How to avoid:** Standalone skill dirs are named `grugops-plan` (dir = whole command, dash). Plugin skill dirs are named `plan` (plugin name supplies `grugops:` prefix). Don't carry the `grugops-` prefix into plugin dir names. `[VERIFIED: skills command-name table]`

### Pitfall 6: Voice leak into guard / install-report / safety docs
**What goes wrong:** Caveman voice bleeds into the deny message, the install report, or the SAFE-02 documentation.
**How to avoid:** Clear professional English for the guard reason string, the install report, and all safety/guard docs (D-21/D-27); light grug wink only in framing prose. `[CITED: PITFALLS.md Pitfall 8 + brand §4]`

## Code Examples

> All copy-paste-correct examples are inline in **Architecture Patterns** (Patterns 1–6 above) with their `Source:` lines. They cover: plugin.json, marketplace.json, dash/colon skill SKILL.md, subagent wrapper, the PreToolUse hooks.json + pure-Node guard, and the Gemini settings.json wiring. The planner should lift these directly.

Two additional installer snippets:

### Idempotent line-append (install.sh)
```sh
# Source: spec §16.5 ensure_line pattern; standard POSIX idempotency
ensure_line() {  # ensure_line <file> <line>
  [ -f "$1" ] || : > "$1"
  grep -qF -- "$2" "$1" || printf '%s\n' "$2" >> "$1"
}
```

### Symlink-with-copy-fallback (D-30)
```sh
link_or_copy() {  # link_or_copy <target> <linkpath>   returns "linked" | "copied(verify)"
  if ln -sf -- "$1" "$2" 2>/dev/null && [ -L "$2" ]; then echo linked
  else cp -f -- "$1" "$2"; echo "copied(verify)"; fi
}
```

## State of the Art

| Old Approach (stale in prior docs/spec) | Current Approach (verified 2026-06-03) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `docs.claude.com/en/docs/claude-code/*` | `code.claude.com/docs/en/*` | host move | Cite the new host in all generated docs |
| `commands/` flat `.md` only | `commands/` merged into skills; `skills/<name>/SKILL.md` is the forward path | "Custom commands have been merged into skills" | D-29 records `skills/`; both still yield `/name` |
| `Task` spawning tool | `Agent` (Task is a legacy alias) | CC v2.1.63 | Templates use `Agent` (PKG-02) |
| `permissionDecision`: deny/allow/ask | now also **`defer`** | recent | Minor — grugops uses `deny`; note the expanded enum |
| Reserved marketplace names = a short list | **Expanded list** (claude-code-marketplace, claude-code-plugins, claude-plugins-official, anthropic-marketplace, anthropic-plugins, agent-skills, anthropic-agent-skills, knowledge-work-plugins, life-sciences, claude-for-legal, claude-for-financial-services, financial-services-plugins; impersonating names also blocked) | recent | `grugops` is NOT on it — still clear |
| Version only in plugin.json (research framed as optional) | Verified resolution order: plugin.json → marketplace entry → git SHA → `unknown`; **plugin.json wins** | current | Confirms D-28: omit version from marketplace entry |

**Deprecated/outdated:**
- Setting `version` in the marketplace entry alongside plugin.json — causes a validator-flagged mismatch; plugin.json wins anyway.
- Bundling role copies into the plugin to dodge the cache landmine — breaks single-source; D-31's pointer-text is the sanctioned route.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | POSIX `install.sh` (`#!/usr/bin/env sh`, `set -eu`) is the right portability baseline | Standard Stack | LOW — universal; if a target lacks `ln -s`, copy-fallback (D-30) covers it |
| A2 | The placeholder env var name `GRUGOPS_PROD_DEPLOY_APPROVED` is acceptable | Guard pattern | LOW — explicitly Claude's discretion (CONTEXT.md); rename freely |
| A3 | Copilot **CLI** combines AGENTS.md + `.github/copilot-instructions.md` (the docs page read was IDE/GitHub.com-centric, with a priority hierarchy for personal/repo/org instructions; CLI-specific combine-vs-priority not fully pinned) | Per-tool wiring | MEDIUM — adapters.md should flag the Copilot row "verify against current Copilot **CLI** docs" (D-35 already mandates this); functionally, ensuring AGENTS.md is present is sufficient and safe |
| A4 | The default D-32 deploy-pattern regex set is reasonable and complete-enough as a default | Guard pattern | MEDIUM — Claude's discretion; per-project patterns are extended at bootstrap, so a missing default is recoverable, not a safety hole (fails closed only on matched patterns; unmatched deploys still gated by autonomy=pr + human review) |

**Note:** All Claude-Code plugin/skill/hook/subagent schema facts, the plugin-cache rule, the version-resolution order, Codex/Gemini/OpenCode AGENTS.md behavior, and the agents.md standard are **VERIFIED** (not assumed) against current official docs on 2026-06-03.

## Open Questions

1. **Does the standalone `/grugops` dash command collide with the `/grugops:*` plugin commands when both are installed in the same session?**
   - What we know: standalone user/project skills yield `/grugops-plan` (no colon); plugin yields `/grugops:plan` (colon). They are different command strings, so no literal collision; and "skill takes precedence over a same-named command" is documented.
   - What's unclear: UX confusion if a user has both forms active (two ways to invoke the same workflow).
   - Recommendation: document both surfaces in `adapters.md`/`install/README.md`; resolve at Phase-6 dogfood (CLAUDE.md flags this). Not a blocker.

2. **Exact `claude plugin validate --strict` behavior on a top-level marketplace `description`.**
   - What we know: a reported inconsistency (#38480) — errors on top-level `description` in strict mode, warns when absent.
   - What's unclear: whether it's fixed on v2.1.161.
   - Recommendation: omit top-level marketplace `description` (use per-plugin `description`), or place it under `metadata`; run the validator locally during the plugin plan and adjust. Plan should treat the validator output as authoritative, not this note.

3. **Plugin repo-relative pointer resolution (D-31) — does the agent reliably read `agent-factory/roles/orchestrator.md` from the user's repo when invoked via the cached plugin?**
   - What we know: the cache copies only the plugin dir; the kit lives in the user's repo; the wrapper instructs the agent (not the filesystem) to read a repo-relative path.
   - What's unclear: empirical confirmation across tools.
   - Recommendation: this is THE decisive dogfood test (Phase 6, DOG-01/02). Phase 5 must build for it but cannot fully prove it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (≥18) | `install.mjs`, the pure-Node guard (D-34) | ✓ | v24.12.0 | — |
| POSIX sh | `install.sh`, `uninstall.sh` | ✓ | system `/bin/sh` | — |
| `claude` CLI | `claude plugin validate --strict`; local plugin testing | ✓ | 2.1.161 | — (validator is a CI gate; absence only blocks the optional validation step) |
| `jq` | NOT required (D-34 uses Node) | ✓ (present but unused) | jq-1.7.1 | Pure-Node guard (the chosen path) |
| symlink privilege | D-30 standalone wrappers | ✓ (macOS) | — | Copy fallback (built into D-30); marks `verify` |
| git host (GitHub) | marketplace distribution (end-user) | n/a at build time | — | Relative `./` source works for local `--plugin-dir` testing |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none missing on this machine; D-30 copy-fallback covers the *end-user* no-symlink case by design.

## Validation Architecture

> nyquist_validation: the repo carries a Wave-0 structural harness pattern (`check-structure.sh`, used in Phases 3–4: V-01..V-13). Phase 5 deliverables are structural/markdown + two scripts + a guard — validate by structure presence, schema validity, and behavioral spot-checks.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Project's own structural harness (`check-structure.sh` style, shell asserts) + `claude plugin validate` for plugin schema |
| Config file | none (shell script harness; Wave 0 if extended for Phase-5 checks) |
| Quick run command | `sh agent-factory/.../check-structure.sh` (per-task; presence/section asserts) |
| Full suite command | `claude plugin validate ./ --strict` (plugin/marketplace schema) + harness presence checks |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PKG-01 | adapters.md exists, maps 5 tools, has "only dispatch differs" + verify flags | structural | `grep -q "only the dispatch differs" agent-factory/packaging/adapters.md && grep -c "verify against current tool docs" …` | ❌ Wave 0 |
| PKG-02 | templates use `Agent` not `Task`, `model: inherit` | structural | `grep -q "Agent" …/subagent.frontmatter.md && ! grep -qw "Task" …` | ❌ Wave 0 |
| CLAUDE-01 | 7 standalone dash skills exist; no role-body copied (pointer only) | structural + dup-check | `ls .claude/skills/grugops*/SKILL.md \| wc -l` (=7); grep distinctive role sentence → expect 0 hits in skills | ❌ Wave 0 |
| CLAUDE-02 | plugin.json valid + name=grugops; skills/ + hooks/ at root; components NOT in .claude-plugin/ | schema | `claude plugin validate ./ --strict` | ❌ Wave 0 |
| CLAUDE-03 | hook + scripts use `${CLAUDE_PLUGIN_ROOT}`; no hardcoded paths | structural | `grep -q 'CLAUDE_PLUGIN_ROOT' hooks/hooks.json && ! grep -qE '/Users/\|/home/' hooks/*` | ❌ Wave 0 |
| INSTALL-01 | run-twice → zero diff; DRY_RUN prints only | behavioral | `cp -r repo a; sh install.sh; sh install.sh; diff -r` (expect none); `DRY_RUN=1 sh install.sh` (no fs change) | ❌ Wave 0 |
| INSTALL-02 | uninstall removes only added artifacts; agent-factory/ untouched | behavioral | `sh install.sh; sh uninstall.sh; git status` (clean except nothing added back); assert `agent-factory/` present | ❌ Wave 0 |
| SAFE-02 | guard DENIES a sample deploy with no env var; ALLOWS with env var; REFUSES inline self-set | behavioral | `echo '{"tool_input":{"command":"kubectl apply -f x"}}' \| node hooks/guard.mjs` → expect `permissionDecision":"deny"`; repeat with `GRUGOPS_PROD_DEPLOY_APPROVED=1` → expect exit 0 no JSON; `…command":"export GRUGOPS_PROD_DEPLOY_APPROVED=1 && kubectl apply…"` → expect deny | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the relevant structural grep / single guard invocation.
- **Per wave merge:** `claude plugin validate ./ --strict` + the full structural harness.
- **Phase gate:** guard behavioral triad green (deny / allow / refuse-self-set) + validate clean + run-twice-no-diff, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Extend `check-structure.sh` (or a Phase-5 sibling) with PKG-01/02, CLAUDE-01/02/03 presence + dup-check asserts.
- [ ] A guard test harness: three stdin fixtures (deploy-no-approval → deny; deploy-with-approval → allow; inline-self-set → deny). Pure shell + node; no framework.
- [ ] An install idempotency test: temp-repo copy, double-install diff, DRY_RUN no-op check, uninstall-cleanliness check.
- [ ] Confirm `claude plugin validate --strict` is wired as a CI/phase-gate step (D-37).

## Security Domain

> `security_enforcement` is not set to false in config → treated as enabled. This phase's security surface is narrow but central: it implements the project's hard safety constraint mechanically.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture / Secure Design | yes | Fail-closed deploy guard; "humans decide, agents execute" enforced in code not prose (D-33) |
| V2 Authentication | no | grugops authenticates nothing; the "auth" is the human-set env var (a confirmation token, not a credential) |
| V3 Session Management | partial | The approval is **session-scoped** (env var in the launching shell) by design — it does not persist, so a stale approval can't leak across sessions (D-33) |
| V4 Access Control | yes | Agent cannot self-approve (refuses inline `export` of the var); only a human with shell access can grant; the guard is the access-control choke point |
| V5 Input Validation | yes | The guard validates `tool_input.command` against the configurable deploy-pattern set before allowing the Bash tool to run |
| V6 Cryptography | no | No crypto; the control is presence-of-env-var, intentionally simple and unforgeable-from-inside-a-command |
| V12 Files & Resources | yes | Installer never overwrites user files (additive, ensure-line); `${CLAUDE_PLUGIN_ROOT}` not hardcoded paths; plugin can't reach outside its dir (cache rule) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent self-approves a prod deploy (sets the env var inline, then deploys) | Elevation of Privilege | Guard refuses any command that inline-sets/`export`s the approval var (D-33) |
| Prompt-injection talks the agent past a prose-only safety rule | Tampering / EoP | Mechanical PreToolUse hook — a prompt can't override a hook deny (PITFALLS Pitfall 4) |
| Guard silently disabled (placed in subagent frontmatter) | Repudiation / Tampering | Plugin-level `hooks/hooks.json` only; behavioral test that it actually blocks a sample deploy |
| Installer clobbers a user's secrets/config file | Tampering / DoS | Additive ensure-line + read-modify-write JSON; never `>`; `DRY_RUN` + uninstall |
| Hardcoded hook path breaks on another machine → guard doesn't run | DoS (of the guard) | `${CLAUDE_PLUGIN_ROOT}`-relative path (CLAUDE-03) |
| 4 non-Claude tools have no hook → unguarded deploy | EoP | Documented procedural fallback: `autonomy=pr` + `production_requires_human_confirmation` + prompt rule; honesty about the Claude-only mechanical guard (SAFE-02 docs) |

## Project Constraints (from CLAUDE.md)

The repo `CLAUDE.md` carries the verified Technology Stack (the de-facto research summary) and these actionable directives that the plan MUST honor:

- **Markdown for everything** except `install.sh` (POSIX), `install.mjs` (Node), and the (Node) deploy guard. No runtime/DB/queue/service.
- **Safety (hard):** never merge a protected branch / never deploy prod without named human confirmation; enforce **mechanically** (PreToolUse hook), not by prompt.
- **Single-source:** role text lives once; per-tool adapters are thin pointers, **never copies**.
- **Zero-config first:** honor `factory.config.json` when present; run lean by default.
- **Voice discipline:** caveman voice in role prompts; **clear voice** in security/safety/install/guard content and disclaimers.
- **Installers:** idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content.
- **No fabrication:** unknown commands marked `UNKNOWN - verify`; never fake a passing gate/test/citation.
- **Minimal AGENTS.md:** keep it high-signal; push detail into pointed-to files (Codex 32 KiB cap reinforces this).
- **Brand:** always lowercase `grugops`; `/grugops` command shape (dash standalone, colon plugin — D-29 supersedes the literal-`/grug` assumption); keep grugbrain.dev attribution + non-affiliation visible (Phase 6).
- **Doc links:** use `code.claude.com/docs/en/*`, never `docs.claude.com/...`.
- **Plugin hygiene:** components at plugin root; only `plugin.json`+`marketplace.json` in `.claude-plugin/`; run `claude plugin validate --strict`.

These carry the same authority as locked decisions. Research recommends nothing that contradicts them.

## Sources

### Primary (HIGH confidence — verified 2026-06-03)
- code.claude.com/docs/en/plugins-reference — full plugin.json schema (only `name` required), component-root rule, version-resolution order (plugin.json wins), `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`, plugin-cache `../` rule, "CLAUDE.md at plugin root not loaded", `--strict` validate
- code.claude.com/docs/en/plugin-marketplaces — marketplace.json required fields, source forms (`./`, github, url, git-subdir, npm), expanded reserved-names list, cache copy behavior, install commands
- code.claude.com/docs/en/skills — command-name-from-location (dir name for standalone → dash; plugin → colon), `disable-model-invocation`, `user-invocable`, `allowed-tools`, `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, commands-merged-into-skills
- code.claude.com/docs/en/hooks — PreToolUse deny JSON (`hookSpecificOutput.permissionDecision`), valid values deny/allow/ask/defer, `if:` matcher, stdin schema (`tool_input.command`,`cwd`,`permission_mode`), exec-vs-shell form, hook inherits process env
- code.claude.com/docs/en/sub-agents — required `name`+`description`, `model: inherit` default, `Agent` (Task renamed v2.1.63), no-nesting, plugin subagents ignore `hooks`/`mcpServers`/`permissionMode`, `claude --agent` main-thread spawning
- developers.openai.com/codex/guides/agents-md — native AGENTS.md, `~/.codex/AGENTS.md` + `.override.md`, `project_doc_max_bytes` 32 KiB default
- opencode.ai/docs/rules — native AGENTS.md, `~/.config/opencode/AGENTS.md`, `opencode.json` `instructions`, all-combine
- gemini-cli docs (gemini-md.md) + agents.md — Gemini default `GEMINI.md`, `.gemini/settings.json` `context.fileName` array `["AGENTS.md","GEMINI.md"]`, `@file.md` imports
- agents.md — LF/Agentic AI Foundation standard, 60k+ projects, 20+ tools (Codex, Copilot Coding Agent, Gemini CLI, OpenCode listed), closest-wins nesting
- **Live install evidence (this machine):** Claude Code v2.1.161; GSD skills `~/.claude/skills/gsd-*/SKILL.md` (dash mechanism); `superpowers` 5.1.0 plugin cache (plugin.json with no component keys, `skills/`+`hooks/` at root, marketplace.json, real `${CLAUDE_PLUGIN_ROOT}` shell-form hook, `AGENTS.md`→`CLAUDE.md` symlink, `gemini-extension.json`/`GEMINI.md` adapters); plugin cache path `~/.claude/plugins/cache/<mp>/<plugin>/<version>/`

### Secondary (MEDIUM confidence)
- docs.github.com (Copilot custom instructions) — AGENTS.md (nearest-file) + `.github/copilot-instructions.md` + CLAUDE.md/GEMINI.md; page was IDE/GitHub.com-centric → CLI-specific combine behavior flagged A3, "verify" in adapters.md
- WebSearch (claude plugin validate) — validator checks schema/duplicate-names/source-traversal/version-mismatch; known top-level-`description` strict-mode inconsistency (#38480)

### Tertiary (LOW confidence)
- none — no claim in this document rests on an unverified single source

## Metadata

**Confidence breakdown:**
- Standard stack / schemas: HIGH — every field re-verified against current official docs + cross-checked against the live `superpowers` plugin
- Architecture / dispatch (no-nesting, main-thread, plugin-ignore-hooks, cache landmine): HIGH — verbatim from current docs
- Per-tool entry files: HIGH for Codex/OpenCode/Gemini/Claude; MEDIUM for Copilot **CLI** combine-vs-priority (A3, flagged for "verify" per D-35)
- Pitfalls: HIGH — sourced from current docs + the project's own verified PITFALLS.md
- Guard mechanics: HIGH — deny JSON, stdin schema, and env-inheritance all confirmed on current hooks doc

**Research date:** 2026-06-03
**Valid until:** ~2026-07-03 (30 days; plugin/skill/hook conventions move fast — re-verify plugin.json/marketplace/hook schema if planning slips past this window, especially the validator's strict-mode `description` behavior)
