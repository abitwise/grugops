# Stack Research — v3.0 additions

**Domain:** grugops v3.0 "Specialist agents. Shared context. Coordinated work." New formats and host capabilities for tiered engineer adapters, skills per role, Orchestrator compaction guidance, and the graph-memory spike.
**Researched:** 2026-10-20 (every vendor page below was retrieved on this date unless another date is given)
**Confidence:** MEDIUM overall. Most host-capability rows are quoted from the vendor's own docs or official release notes, so treat those as CITED. The research-plan seam rates the `webfetch`/`websearch` providers `LOW` (`classify-confidence`, verified or not), because Context7 needed OAuth and was not used. Rows that rest on third-party pages or on inference are marked `LOW` or `UNKNOWN - verify` where they appear.

**Scope.** These are already validated and not re-researched: the TS tooling layer (tsc → committed `.js`, zero runtime deps, Node 22+), `scripts/model-tiers.ts`, the adapter generator, the per-agent installer, `context-io.ts`, the board projector, and the six-host registry. This file covers only what v3.0 adds.

---

## TL;DR — what v3.0 changes in the stack

1. **No new runtime dependency, and no new dev dependency.** All v3.0 work is markdown, frontmatter and TOML that the existing generator emits, plus `fs.statSync` byte budgets in the validator. Nothing new needs `npm install`.
2. **The "only Claude Code can spawn" premise is out of date.** Current vendor docs show **five of six hosts** can start a sub-agent on its own model. **Claude Code, Codex CLI, GitHub Copilot CLI, OpenCode and Antigravity CLI** can. **Pi cannot**: it ships without sub-agents and runs one model per session, which the user switches by hand. **Recommendation:** v3.0 does not move the other four hosts to spawning. Own-session spawn is still unproven on Claude Code itself (GAP-D1), and four new spawn paths would multiply that unproven surface. Record the finding, keep the sequential path on those hosts, and make engineer tiers guidance-only there, as already decided.
3. **Only Claude Code accepts a portable tier vocabulary** (`haiku`/`sonnet`/`opus`). Every other host needs a provider-specific model string: OpenCode `provider/model#variant`, Copilot `claude-haiku-4.5`-style IDs, Codex `gpt-5.x` IDs, Antigravity `flash`/`pro` tiers. The junior/mid/senior split should therefore be **generated for Claude Code only** in v3.0, from `software-engineer.md` through `model-tiers.ts`.
4. **`haiku` + `effort` needs Claude Code v2.1.293 or later.** From that version `haiku` resolves to Haiku 5.5, which supports effort. Before it, `haiku` meant Haiku 4.5, which is not in the effort-support table. The junior tier's `effort:` line carries this version floor, and it must be documented.
5. **Skills are now one portable format** (Agent Skills `SKILL.md`). **Five of six hosts read `.agents/skills/`. Claude Code does not**: it reads `.claude/skills/` and plugin `skills/`. Roles should name skills and give a fallback. grugops should **document optional installs, never vendor third-party skills, and never take a plugin dependency**. One exception: rewrite the ponytail rules (MIT) as grugops's own role text, with attribution.
6. **No host lets the agent compact itself, and current flagship models cannot see their own token count.** "Compact near 400k" has to be written around proxies the agent can observe: dispatch count, finished-agent count, and the human-visible usage readout. The fallback that works on every host is a fresh session that resumes from the on-disk in-flight log. Three hosts have a real threshold knob: Claude Code, Codex and Pi. List those as operator tips; the installer should not write them in v3.0.
7. **Graph memory: do not adopt, and build nothing.** Graphify writes plain files (`graph.json`) but needs Python 3.10+ and about 30 native packages. CodeGraph keeps its index in **SQLite**, and code-graph-rag runs on **Memgraph**. None fits zero-runtime-deps. The "graph" grugops can own is the markdown index layer from the state-contract repair (`nfr-catalog.md`, `traceability.md`, ticket links), checked by the validator.

---

## Recommended Stack

### Core Technologies (new formats grugops emits or references in v3.0)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Claude Code sub-agent frontmatter `model` + `effort`** | CC v2.1.x. `effort` levels `low`/`medium`/`high`/`xhigh`/`max`. `haiku`→Haiku 5.5 from **v2.1.293**. Current CC is 2.1.304 (npm, 2026-10-20) | The three generated engineer adapters: `grugops-software-engineer-junior` (`model: haiku`), `-mid` (`sonnet`), `-senior` (`opus`), each with its own `effort:` line | It is the only host where a closed alias vocabulary (`sonnet`, `opus`, `haiku`, `fable`, full ID, `inherit`) is documented (code.claude.com/docs/en/sub-agents). It plugs into the existing `MODEL_ALIASES` / `EFFORT_LEVELS` tuples with no new grammar. Haiku 5.5, Sonnet 5.5 and Opus 5.5 all support every effort level and default to `medium` (code.claude.com/docs/en/model-config) |
| **Agent Skills `SKILL.md`** (agentskills.io spec) | Spec as published 2026-10-20 (no version number on the page) | Format for any grugops-shipped skill. It is also the contract the kit assumes for third-party skills | Claude Code, Codex, Copilot CLI, OpenCode, Antigravity and Pi all implement it. Required: `name` (≤64 chars, lowercase, digits and hyphens, must match the folder name) and `description` (≤1024 chars). Optional: `license`, `compatibility`, `metadata`, `allowed-tools`. The spec recommends "Keep your main `SKILL.md` under 500 lines" and an instruction body under about 5,000 tokens |
| **Role → skill naming in the role body (host-neutral)** | n/a, plain markdown | Lets each role select skills for its task | A `SKILL.md` is a file, so reading it *is* loading the skill on every host, including those without a skill tool. Name the skill, give both discovery paths (`.claude/skills/<name>/` and `.agents/skills/<name>/`), and give a built-in fallback checklist for when it is absent |
| **Claude Code `skills:` adapter frontmatter** (optional, Claude Code only) | CC v2.1.x | Preload grugops's *own* small skills into a role sub-agent | "The full skill content is injected" at startup, for up to 32 names (sub-agents doc). That is good for small, always-needed kit skills. It is wrong for a 16 KB third-party skill, which would load on every spawn. Use on-demand invocation for those |
| **Markdown index files as the "graph"** | n/a | `nfr-catalog.md`, `traceability.md` and per-ticket links from the state-contract repair | Zero dependencies, diffable, and checked by the existing validator. It reduces tokens the same way a code graph does: an agent reads one index and then only the files it needs. It keeps the shared verified context as the sole memory |

### Supporting Libraries / Conventions

| Library / Convention | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **ponytail rules** (dietrichgebert/ponytail) | v5.3.2 (2026-10-16), **MIT** | Source for the "do less" rules in `software-engineer.md` and the Tech Lead pre-plan | **Rewrite, don't install.** The useful part is one 2,721-byte `AGENTS.md`: a six-rung ladder ("Does it need to exist? → already in codebase → stdlib → installed dep → one line → minimum code"), plus "Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility". Put it in plain grugops English and add an MIT attribution line to NOTICE. Do **not** carry over its benchmark figures ("-53% code", "-45% tokens"). They are vendor self-measurements and would trip `guard_banned_claims` |
| **ui-ux-pro-max** (nextlevelbuilder/ui-ux-pro-max-skill) | v2.15.0 (2026-08-13), **MIT**. CLI `ui-ux-pro-max-cli@2.15.0` | Design-intelligence skill for `frontend-ui` and the new Designer role | **Optional, documented install, named in the role body with a fallback.** Install paths: CC plugin (`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`), or `npm install -g ui-ux-pro-max-cli` then `uipro init --ai <claude\|codex\|opencode\|copilot\|antigravity\|universal>`. `universal` writes `.agents/skills/`, which is how it reaches Pi. Its search script **needs Python 3.x on the host** (standard library only, no network). `SKILL.md` is 15,969 bytes. The skill folder ships `data/`, `references/` and `scripts/`, and the repo carries six sibling skills |
| **frontend-design** (anthropics/claude-plugins-official) | Repo at main 2026-10-19, **Apache-2.0** | Second optional design skill for Designer / frontend-ui | It is the only one of the four Anthropic plugins that is a **portable `SKILL.md`** (9,390 bytes, `skills/frontend-design/`). On CC: `/plugin install frontend-design@claude-plugins-official`. On other hosts the user copies the skill folder into `.agents/skills/` themselves. grugops documents this and does not do it |
| **CC LSP code-intelligence plugins** (for example `typescript-lsp`) | claude-plugins-official, current | Host-native symbol navigation that cuts exploratory reads | Mention in docs as the CC-native answer to "graph memory for code": "a single 'go to definition' call replaces … a grep followed by reading multiple candidate files" (code.claude.com/docs/en/costs). Not a grugops dependency |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/validate-agent-factory.ts` (extend) | Per-file **byte** budgets for board, ticket, NFR, trace, index and role files | Use `fs.statSync().size`. Budgets are in **bytes, not tokens**: no tokenizer dependency, and bytes are what the dogfood numbers (board 718 KB, traceability 1.9 MB) are measured in |
| `scripts/generate-role-adapters.ts` (extend) | Emit `role × tier` adapters for `software-engineer`, plus new `tech-lead` and `designer` adapters | Tier adapters are a second derived set. Apply "derive the set, assert the count" before the files land (memory: set-literal drift) |
| `scripts/model-tiers.ts` (extend) | Tier table rows for `software-engineer-{junior,mid,senior}`, `tech-lead` and `designer`, each with the required `rationale` / `effortRationale` | `fable` is now a documented CC alias but is not in `MODEL_ALIASES`. Leave it out unless a role needs it |
| `claude plugin validate --strict` | Unchanged | Run it after adding tier adapters, in case the plugin form ships them |
| `skills-ref validate <dir>` (agentskills.io reference lib) | Optional check for any skill grugops itself ships | Dev and CI only, and only if grugops ships a skill folder. It is not a host dependency. Its install footprint was not checked: `UNKNOWN - verify` before adding it to CI |

---

## (a) Per-host model and effort pinning in generated agent files

| Host (version checked) | Agent file + location | Per-agent model | Per-agent effort | Can a sub-agent run on a different model? | Model vocabulary portable? |
|---|---|---|---|---|---|
| **Claude Code** (2.1.304) | `.claude/agents/<name>.md`, `name` + `description` required | `model:` `sonnet`\|`opus`\|`haiku`\|`fable`\|full ID\|`inherit` | `effort:` `low`…`max`. "Overrides the session effort level, but not the `CLAUDE_CODE_EFFORT_LEVEL` environment variable." On an unsupported level, falls back to "the highest supported level at or below the one you set" | **Yes.** Resolution order: (1) per-invocation `model` parameter, (2) frontmatter `model`, (3) `CLAUDE_CODE_SUBAGENT_MODEL`, (4) main model. The Orchestrator can pass `model` per spawn, but there is no documented per-invocation *effort*, so tier adapters are still the right vehicle | **Yes** (aliases) |
| **Codex CLI** (0.163.0) | `.codex/agents/<name>.toml` (project) or `~/.codex/agents/` (user). TOML, `name`, `description`, `developer_instructions` required | `model` | `model_reasoning_effort` ("such as `low`, `medium`, `high`, `xhigh`, `max`, or `ultra` … depend on the model") | **Yes.** "Current Codex releases enable subagent workflows by default". Precedence: explicit spawn value → `[agents]` default (`agents.default_subagent_model`) → parent. Project `.codex/` layers load "only when you trust the project", so whether `.codex/agents/` is trust-gated too is `UNKNOWN - verify` | No (OpenAI model IDs) |
| **GitHub Copilot CLI** (1.0.100) | `.github/agents/<name>.agent.md` (also **reads `.claude/agents/`**, priority 3) | `model`, `models` (priority list), `modelPolicy` (`preferred`\|`required`) | `reasoningEffort` | **Yes.** Applies "whether the agent is dispatched through the `task` tool or started directly". "A declared model or effort that can't be honored falls back to the session's value". Under session model `Auto`, sub-agents always inherit | No (for example `claude-sonnet-4.6`, `claude-haiku-4.5`, `gpt-5.6-luna`) |
| **OpenCode** (npm `opencode-ai` 1.19.3; the kit recorded a live 2.0.26 run, see Open Questions) | `.opencode/agents/<name>.md`, `mode: subagent` | `model: provider/model-id`. v2 docs add `#variant`, for example `anthropic/claude-sonnet-4-5#high` | Only through `#variant` (v2) or provider passthrough (`reasoningEffort`) | **Yes.** "A subagent uses its configured model, or inherits the parent session's model". v1 launches through the Task tool, v2 through the `subagent` tool | No |
| **Antigravity CLI** (1.4.2, 2026-10-18) | Docs: `.agents/agents/<name>/agent.md`. The kit's flat `.agents/agents/grugops-orchestrator.md` was verified live on 1.4.2 | `model:` tier (`flash`, `pro`, `inherit`), added in **1.1.5** ("so an agent runs at a chosen model tier … when invoked as a subagent") | Per-agent effort `UNKNOWN - verify` (session-level `--effort` and `/effort` exist since 1.1.5) | **Yes**, as a sub-agent (`invoke_subagent` tool, `agents:` list in frontmatter) | Partly (Gemini tiers. Claude models appear only for some sign-ins) |
| **Pi** (1.3.0, 2026-10-15) | No agent file. `.pi/prompts/` templates only | No ("skips features like sub-agents") | No. `/thinking` is per session | **No.** One model per session, switched by the human with `/model`, or separate `pi` instances via tmux | n/a |

**Recommendation.** Generate tier adapters for **Claude Code only** in v3.0. On the other five hosts the tiers are guidance: the Tech Lead's complexity score still sets task size and review depth, but the session model does all the work. Add a requirement that docs state this asymmetry by host, as was done for Pi (34 D-12). Park "native sub-agents on Codex, Copilot, OpenCode and Antigravity" as a candidate item behind a live capture.

**Cross-host hazard, new.** Copilot CLI loads `.claude/agents/` as project agents (cli-command-reference, "Custom agent locations"). Every generated CC adapter, including the new `model: haiku` tier files, is therefore also a Copilot agent. Copilot should fall back to the session model for an unknown model string ("falls back to the session's value instead of failing the dispatch"), but that is unverified for the bare alias `haiku`: `UNKNOWN - verify`. Copilot also offers these CC adapters for auto-delegation (`infer` defaults to `true`).

---

## (b) Skills: format, discovery, invocation, and dependency policy

### Discovery path per host

| Host | Project skill paths | User paths | Explicit invocation | On-demand load mechanism |
|---|---|---|---|---|
| Claude Code | `.claude/skills/<n>/SKILL.md` (cwd up to repo root; nested on first touch), plugin `skills/` | `~/.claude/skills/` | `/name` | Skill tool. Description + `when_to_use` truncated at **1,536 chars** in the listing. "Every skill in the skill listing adds to your context on every turn." **Does not list `.agents/skills/`** |
| Codex CLI | `.agents/skills` from cwd up to repo root | `$HOME/.agents/skills`, `/etc/codex/skills` | `$name` or `/skills` | Implicit by description. `skills.max_context_tokens` defaults to 2% of the context window. A custom agent can disable skills via `skills.config` |
| Copilot CLI | `.github/skills/`, `.agents/skills/`, `.claude/skills/` | `~/.copilot/skills/`, `~/.agents/skills/` | `/SKILL-NAME` | "content is injected into the conversation". `copilot skill add` exists |
| OpenCode | `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` (up to git worktree) | `~/.config/opencode/skills/` | via the `skill` tool | Native `skill` tool. Per-agent `permission` allow/deny/ask on skills |
| Antigravity CLI | `.agents/skills/` | `~/.gemini/…` | `/name` (skills are slash commands) | Markdown agents accept a `skills:` frontmatter list (fixed for relative paths in 1.3.1). Skill body limit **24 KB** (`agy plugin validate`, 1.4.1) |
| Pi | Pi skills dirs + `.agents/skills/` (cwd up to repo root) | `~/.agents/skills/` | `/skill:name` | Name, description and path go into the system prompt; "A model might fail to load a relevant skill, so use `/skill:name` when you need to force it." |

**What follows from the table.** One copy in `.agents/skills/` reaches five hosts, and Claude Code also needs `.claude/skills/`. A role should therefore never hard-code one path. Give both, plus a fallback.

**Role-text pattern (host-neutral, recommended):**
> Skills for this task: `ui-ux-pro-max`, `frontend-design`. If a skill is installed, load it with your host's skill command or read its `SKILL.md` (`.claude/skills/<name>/` or `.agents/skills/<name>/`). If neither is present, use the checklist in this role. Do not install skills.

**Context budget note.** Every installed skill costs listing tokens on every turn on Claude Code, and catalog budget on Codex. Installing all of superpowers (15 skills) plus ui-ux-pro-max (7) adds overhead to every grugops agent, which works against the milestone goal "cheaper to run". So recommend skills per role, not "install everything".

### Third-party skill evaluation

| Candidate | License | Install method (official README / docs) | Hosts | Verdict |
|---|---|---|---|---|
| **ui-ux-pro-max** v2.15.0 | MIT | CC plugin, or `npm i -g ui-ux-pro-max-cli` + `uipro init --ai <host>` (`--global` variants). **Needs Python 3** | claude, codex, opencode, copilot, antigravity, universal (`.agents/skills`) | **Adopt as optional** for frontend-ui and Designer. Never let the grugops installer run `npm -g` or `uipro` (that would be a runtime dependency and would write into the user's `.claude/skills/`) |
| **frontend-design** (Anthropic) | Apache-2.0 (plugin LICENSE + skill `LICENSE.txt`) | `/plugin install frontend-design@claude-plugins-official`. A plain `SKILL.md` elsewhere | All six (portable SKILL.md) | **Adopt as optional** alongside ui-ux-pro-max. Documented install only |
| **code-simplifier** (Anthropic) | Apache-2.0 | CC plugin. It is an **agent** (`agents/code-simplifier.md`, `model: opus`), not a skill | Claude Code only | **Do not depend on it.** Its job overlaps the ponytail rules plus the engineer's self-review. At most note it in docs as an optional CC extra |
| **feature-dev** (Anthropic) | Apache-2.0 | CC plugin: one command + three agents (`code-architect`, `code-explorer`, `code-reviewer`) | Claude Code only | **Do not depend on it.** It duplicates grugops's own architect, engineer and QE roles and would compete for routing. Borrow the "explorer before architect" idea only |
| **commit-commands** (Anthropic) | Apache-2.0 | CC plugin: `/commit`, `/commit-push-pr` (allows `git push`, `gh pr create`), `/clean_gone` (deletes branches) | Claude Code only | **Do not depend on it.** The grugops ticket flow already owns branch → PR. `clean_gone` deletes branches, which is user content outside grugops's remit |
| **obra/superpowers** v7.0.0 | MIT | Per-host plugin installs (CC official marketplace, Codex marketplace, `agy plugin install`, `copilot plugin install`, OpenCode INSTALL.md, `pi install git:github.com/obra/superpowers`) | All six | **Do not depend on it, and warn about coexistence.** It injects a `using-superpowers` bootstrap through a SessionStart hook ("again after compaction" on Pi). Its skills say they must run before any creative work, and they bring their own planning and subagent-driven execution flow. That competes with the grugops Orchestrator for control of the session. Mine individual ideas (verification-before-completion ↔ the §14 gate, systematic-debugging ↔ incident-responder) as grugops text |
| **ponytail** v5.3.2 | MIT | CC/Codex plugins with lifecycle hooks, a status "band" and an always-on mode. "Any other agent: copy `AGENTS.md`" | All six | **Rewrite the rules into `software-engineer.md` and `tech-lead.md`. Do not install the plugin.** Its hooks and always-on mode would sit on top of every grugops role |

**Dependency policy (opinionated).** Use **documented optional install + named reference + fallback**.
- **Vendoring is rejected.** A copy in the kit drifts from upstream, carries NOTICE and LICENSE duties (Apache-2.0 §4), and breaks single-source.
- **Plugin `dependencies` is rejected.** CC `plugin.json` does support `"dependencies": ["name@marketplace"]` (plugins-reference). But grugops is not published as a plugin (PLUGIN-01 is a future item), the mechanism is Claude Code only, and it would force-enable third-party code.
- **Instead,** the installer's `--check` doctor can *report* which recommended skills it finds under `.claude/skills/` and `.agents/skills/`. It stays read-only, adds zero dependencies, and never installs anything.

---

## (c) Context compaction per host, for honest "compact near 400k" guidance

| Host | Manual | Automatic trigger (default) | Configurable threshold | Can the human see usage? | Can the agent see its own usage? |
|---|---|---|---|---|---|
| Claude Code | `/compact [focus]` | At the context limit, except native-1M models, which "compact before the window fills, at about 967K tokens by default" | **Yes**: `/autocompact 400k` (saved per model), `autoCompactWindow` setting, `--autocompact`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`. Accepts 100K–1M. **Per sub-agent `autoCompactWindow: 400000` frontmatter, v2.1.296+** | `/context`, `/usage`, status line | **No on current flagship models.** Per the platform docs, "Claude Opus 4.7 and later Opus models, Claude Sonnet 5.5, … Claude Haiku 5.5 don't receive these injected tags". Only Sonnet 5, Sonnet 4.6, Sonnet 4.5 and Haiku 4.5 get `<budget:token_budget>` updates. Whether CC adds its own usage note to context: `UNKNOWN - verify` |
| Codex CLI | `/compact` | Model default (not published) | **Yes**: `model_auto_compact_token_limit` in `config.toml`. Project `.codex/config.toml` loads only when the project is trusted | `/status` ("remaining context capacity"), `/statusline` items | `UNKNOWN - verify` |
| Copilot CLI | `/compact [focus]` | "approximately 80% of the context window's capacity", pauses at about 95% | Not documented | `/context` | `UNKNOWN - verify` |
| OpenCode | `/compact` (`/summarize`, `ctrl+x c`) | "when context is full" (`compaction.auto`, default `true`) | No threshold key (`auto`, `prune`, `reserved` only) | Not documented in TUI docs | `UNKNOWN - verify` |
| Antigravity CLI | `/compact [message]` (**1.3.5+**) | Automatic compaction exists, trigger not documented | Not documented | `/context` panel, status line `cost` field | `UNKNOWN - verify` |
| Pi | `/compact [instructions]` | `contextTokens > contextWindow - reserveTokens` (`reserveTokens` default 16384) | **Yes, indirectly**: `compaction.reserveTokens` in `.pi/settings.json`. 400k needs `reserveTokens = window − 400000`, so it depends on the model | Footer "shows current context usage", `/session` | `UNKNOWN - verify` |

**What the guidance can honestly say:**
1. No host documents a tool the *agent* can call to compact itself. `/compact` is a human command on all six. An Orchestrator that wants a compaction must **ask the human**, or rely on the host's automatic trigger.
2. The agent usually cannot measure "400k input tokens" itself. So write the rule with observable proxies: compact or restart after every N closed agents or at every phase boundary, and whenever the human-visible readout passes about 400k.
3. **The fallback that works on all six hosts is a fresh session.** All grugops state is on disk (board, queue, in-flight log, shared context), so a clean restart that rereads the in-flight log is a lossless compaction. That makes "keep the in-flight log small and current" the load-bearing rule, not the 400k number.
4. Mechanisms exist on Claude Code, Codex and Pi. List them in docs as operator tips (`/autocompact 400k`, `model_auto_compact_token_limit = 400000`, `compaction.reserveTokens`). **Do not have the installer write them in v3.0.** That would add a settings-writing surface on three hosts, with the full reversibility contract, for a guidance-only feature. Emitting `autoCompactWindow` in CC adapters would also need a `CANONICAL_SCHEMA` widening (see Integration).

---

## (d) Graph memory spike: what exists, and whether it fits

| Tool | What it is | Install footprint / runtime deps | Storage | License | Fits zero-runtime-deps / no-DB? |
|---|---|---|---|---|---|
| **Graphify** (`Graphify-Labs/graphify`, formerly `safishamsi/graphify`. PyPI `graphifyy` 0.9.92) | A `/graphify` skill + CLI that parses code with tree-sitter (about 40 languages, "no LLM" for code) into a knowledge graph. Docs, PDFs and media take a semantic pass that calls the assistant's model or a configured API key. Leiden communities, `query`/`path`/`explain` commands | **Python ≥3.10 + uv or pipx**. Dependencies: `networkx`, `numpy`, `rapidfuzz`, `tree-sitter` + about 25 grammar wheels. Optional `[mcp]` extra, git hooks, `watch`. Writes skills into `.claude/skills/` and `.agents/skills/`. Logs every query to `~/.cache/graphify-queries.log` | **Files**: `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md` | Apache-2.0 | **No database: yes. Zero runtime deps: no** (Python toolchain + native wheels). The README's "Cut agent token spend by 80%" belongs to the paid Graphify Cloud and is unverified marketing (`LOW`) |
| **CodeGraph** (`colbymchenry/codegraph` 1.6.2) | Pre-indexed code graph served to agents over MCP, auto-syncing on change | Bundled runtime binary (curl or PowerShell installer) or `npm i -g`. Configures MCP for many hosts | **SQLite** (`.codegraph/`). "SQLite database only" | MIT | **No.** It is a database |
| **code-graph-rag** (`vitali87/code-graph-rag`) | Graph RAG over a monorepo | Python + **Memgraph** graph DB (Docker, per the project description: `LOW`, README not read) | Graph DB | MIT | **No** |
| **Serena** (`oraios/serena`) | LSP-backed MCP toolkit for symbol retrieval and editing | Python/uv + language servers | None persistent (LSP) | GitHub API reports `NOASSERTION`: `UNKNOWN - verify` | **No** (runtime + MCP server). Overlaps CC's LSP plugins |
| **MCP memory server** (`@modelcontextprotocol/server-memory` 2.0.0) | An entity/relation "knowledge graph" the agent writes through MCP tools | Node, depends on `zod` and `@modelcontextprotocol/server` | JSONL file | Repo `NOASSERTION`: `UNKNOWN - verify` | File-based, but **breaks verify-before-write**: the agent writes memory with no verification stamp |

**Recommended decision for the spike.** Do not integrate any of these, and build nothing. The reasoning, in order:
1. Every candidate adds a runtime (Python or Node packages, or a DB) to the host.
2. A code graph is *derived* data, not memory. If the shared context admitted its output, that output would carry no non-self verification stamp.
3. The token saving it targets is the "read too many files" cost. The v3.0 state-contract repair already attacks that directly with index files and byte budgets.

**Allowed posture:** a user may install graphify or CodeGraph themselves. A role may *read* such a tool's output as an exploration aid, the way it uses grep. Nothing from it enters the shared context unverified. Record this as a decision, so the "a database stays out of scope" line has a written reason.

---

## Integration points with the existing tooling

| Existing piece | v3.0 change | Watch-out |
|---|---|---|
| `scripts/model-tiers.ts` | Add rows for the engineer tiers, `tech-lead` and `designer`, each with `rationale` + `effortRationale`. Today's `tiered` effort rule (`opus`→`high`, else `medium`) gives junior=`medium`, mid=`medium`, senior=`high`. A distinct junior effort (for example `low`) needs a per-row override or a rule change, not a hand-typed literal | The `tiered` model table states "NO ROLE IS ASSIGNED `haiku`" (D-09 rationale). The junior tier deliberately reverses that, so a recorded decision must amend it. The CC version floor for `haiku`+`effort` is **v2.1.293** |
| `scripts/generate-role-adapters.ts` + `kit-model.listRoles()` | Tier adapters are a new derived set (`role × tier`). Pin the new cardinalities: roles 17 → 19 with `tech-lead` and `designer`, and adapters grow by about 2 more for the extra engineer tiers | "Derive the set, assert the count" **before** the files land. The coordinator's `tools: Agent(...)` grant must list every tier adapter, or spawning silently fails (the v2.1 spawn-defect class) |
| `scripts/canonical-frontmatter.ts` | Unchanged for the CC-only plan: `model` and `effort` are already in `CANONICAL_SCHEMA`, and `haiku`/`low` are inside `PLAIN_SCALAR_ALPHABET` | Any later emission of `skills:` (YAML list), `autoCompactWindow`, Copilot `reasoningEffort`/`models`, or OpenCode `model: provider/id#variant` widens a **safety authority**: new keys, and `/` and `#` are not in `PLAIN_SCALAR_ALPHABET`. Treat it like 34 Q2 / D-33-R3-02: a recorded decision plus adversarial tests |
| Codex adapters (future, not v3.0) | Would be a new emitted grammar (TOML in `.codex/agents/`) | Emit only, never parse. Closed key set, strict string escaping, zero dependencies |
| `install.ts --check` (doctor) | Report recommended skills present or absent. Warn when the junior tier is configured and CC is older than v2.1.293, if the doctor can read the version | Read-only. Never installs third-party skills. Shelling out to `claude --version` from the doctor is a new behaviour: `UNKNOWN - verify` whether that is acceptable |
| `install.ts --migrate` | Moves `plans/` → `memory-bank/plans/` and splits NFR and trace files | Existing idempotent, reversible contract. Finished-ticket folders may only move to the archive |
| Validator | Per-file byte budgets, index ↔ file link integrity | Measure bytes. No tokenizer dependency |
| Docs / catalog generator | Layered docs and the storyline | Plain markdown + existing catalog generator. GitHub renders Mermaid natively. No static-site generator |

---

## Installation

```bash
# grugops itself: nothing new. Still Node 22+, committed .js, zero runtime deps.

# OPTIONAL skills a user may install (documented in grugops docs, never run by the grugops installer):
# Claude Code
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/plugin install frontend-design@claude-plugins-official
# Any host (writes .claude/skills, .agents/skills, etc.; ui-ux-pro-max search needs python3)
npm install -g ui-ux-pro-max-cli
uipro init --ai universal        # .agents/skills/ -> Codex, Copilot, OpenCode, Antigravity, Pi
uipro init --ai claude           # .claude/skills/ -> Claude Code

# Operator tips for "compact near 400k" (documented, not written by the installer):
#   Claude Code:  /autocompact 400k
#   Codex CLI:    model_auto_compact_token_limit = 400000   (~/.codex/config.toml or trusted .codex/config.toml)
#   Pi:           compaction.reserveTokens = <model window> - 400000   (.pi/settings.json)
#   Copilot CLI, OpenCode, Antigravity CLI:  run /compact by hand, or start a fresh session that resumes from the in-flight log
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Tier adapters on Claude Code only, guidance elsewhere | Emit tier adapters on Codex, Copilot, OpenCode and Antigravity too, since all four document per-agent models | After a live capture proves own-session spawn on CC (GAP-D1) and on each target host, and once a per-host `tier → model string` config exists (the vocabulary is not portable) |
| Three generated tier adapters | Pass a per-invocation `model` parameter from the Orchestrator on CC | Never as the sole mechanism: effort cannot be passed per invocation. It can serve as a later override |
| Name skills in the role body + fallback | CC `skills:` preload frontmatter | For grugops's own small skills on CC only, after the `CANONICAL_SCHEMA` decision |
| Documented optional skill installs | Vendoring skills into `agent-factory/` | Only for text grugops rewrites as its own (ponytail rules), with attribution |
| Markdown index files | Graphify `graph.json` | When a user already runs graphify. Roles may read it as an aid, never as memory |
| Guidance + human `/compact` / fresh session | Installer writes `autoCompactWindow` / `model_auto_compact_token_limit` | A later milestone, if measurement shows Orchestrator sessions routinely pass 400k |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A tokenizer library (`tiktoken`, `@anthropic-ai/tokenizer`) for budgets | A runtime or dev dependency for an approximate number. Model tokenizers differ across six hosts | Byte budgets via `fs.statSync` |
| Superpowers as a recommended dependency | Its SessionStart bootstrap and "must use before any creative work" skills compete with the Orchestrator for control. It adds 15 skills to every turn's listing | grugops-authored rules that borrow its ideas |
| Feature-dev, code-simplifier, commit-commands as dependencies | Claude Code only. They duplicate grugops roles. `clean_gone` deletes branches | Ponytail-derived rules + existing roles |
| The ponytail plugin itself | Always-on mode, hooks and status band over every role | Its rules, rewritten in `software-engineer.md` / `tech-lead.md` |
| Benchmark claims from ponytail, graphify or CodeGraph in grugops docs | Vendor self-measurements. `guard_banned_claims` and no-fabrication | State what the rule does, never a saving |
| CodeGraph, code-graph-rag, MCP memory server | SQLite, a graph DB, or unverified agent-written memory | Markdown indexes + the shared verified context |
| Hard-coded model IDs (`claude-haiku-4.5`, `gpt-5.x`) in shipped adapters | They rot, which is the MODEL-04 rationale, and differ by host and provider | CC aliases. Elsewhere, inherit (no line) |
| Third-party skill folders larger than the role they serve, preloaded at spawn | Loads the full content on every spawn (CC `skills:`) | On-demand invocation by name |

## Stack Patterns by Variant

**Claude Code (parallel path):**
- Emit `grugops-software-engineer-{junior,mid,senior}.md` with `model: haiku|sonnet|opus` + `effort:`. The Orchestrator picks a tier from the Tech Lead's complexity score.
- Because CC is the only host with a documented, portable alias vocabulary, and the existing dial already produces exactly these lines.

**Codex, Copilot, OpenCode, Antigravity (sequential path in v3.0):**
- One session model does all tiers. The tier label changes task size, review depth and checklist strictness, not the model.
- Because live spawn on these hosts is unproven and model strings are provider-specific.

**Pi:**
- Tiers are guidance only (no sub-agents). Optionally tell the human they can `/model` switch or run a separate `pi --model …` instance for senior work.
- Because the vendor states Pi has no sub-agents (pi.dev).

## Version Compatibility

| Item | Compatible With | Notes |
|------|-----------------|-------|
| `model: haiku` + `effort:` | Claude Code **≥ v2.1.293** (`haiku` → Haiku 5.5) | Before that, `haiku` = Haiku 4.5, which is not in the effort table. Behaviour of `effort:` on a model without effort: `UNKNOWN - verify` (carried from 34-RESEARCH) |
| `effort:` frontmatter honoured on Opus 4.7/4.8/Fable 5 | Claude Code ≥ v2.1.267 | Carried from 34-RESEARCH (CHANGELOG 2.1.267, retrieved 2026-10-06) |
| Sub-agent `autoCompactWindow` | Claude Code ≥ v2.1.296 | Range 100000–1000000. Write it as a plain integer: in frontmatter, "`200k` [is read] as 200" |
| `/autocompact` per-model save | Claude Code ≥ v2.1.288 | Earlier versions saved one window for all models |
| Antigravity `model:` agent frontmatter | Antigravity CLI ≥ 1.1.5 | `/compact` ≥ 1.3.5 |
| Codex custom agents | Codex CLI (0.163.0 checked) | "enable subagent workflows by default" |
| Copilot `reasoningEffort` / `models` / `modelPolicy` | Copilot CLI (1.0.100 checked) | Minimum version not found: `UNKNOWN - verify` |
| OpenCode `#variant` model syntax | OpenCode v2 docs | Which line is current is unresolved (npm `latest` = 1.19.3; the kit recorded a 2.0.26 live run) |

## Open Questions (UNKNOWN - verify)

- **OpenCode version line.** npm `opencode-ai@latest` is 1.19.3 (2026-10-16), but CLAUDE.md records a live run on "OpenCode 2.0.26". The v1 docs use the Task tool and `model: provider/id`. The v2 docs (`opencode.ai/v2/docs/agents/`) use the `subagent` tool and `#variant`. Confirm which one users run before any OpenCode tier work.
- **Antigravity agent path.** The docs show `.agents/agents/<name>/agent.md`. The kit ships a flat `.agents/agents/grugops-orchestrator.md`, verified live on 1.4.2. Both may load. Confirm before adding more agent files.
- **Copilot loading CC adapters.** Copilot reads `.claude/agents/`, so the CC tier adapters (`model: haiku`) also show up in Copilot. The fallback for an unknown model string is documented, but not tested with a bare alias.
- **Agent self-visibility of token usage** on Codex, Copilot, OpenCode, Antigravity and Pi is not documented. On Claude Code it is absent for current flagship models, per the platform docs.
- **Codex `.codex/agents/` trust gating**, and whether a project-trust prompt blocks it.
- **Licenses for Serena and the MCP servers repo** read as `NOASSERTION` through the GitHub API.
- **Junior effort level.** `low` versus `medium` on Haiku 5.5 is a quality judgment for the Tech Lead phase. Haiku 5.5's default is `medium`.

## Sources

Retrieved 2026-10-20 unless noted. Seam confidence for these providers is `LOW` (webfetch/websearch/gh, unverified tier). Vendor-primary pages are quoted directly.

- code.claude.com/docs/en/sub-agents — `model`/`effort`/`skills`/`autoCompactWindow` (v2.1.296+) frontmatter, model resolution order with the per-invocation `model`, 3-layer nesting, plugin-agent field restrictions (CITED)
- code.claude.com/docs/en/model-config — effort support table (Haiku 5.5 included), fallback rule, alias version history (`haiku`→Haiku 5.5 at v2.1.293), default auto-compact (~967K on native-1M models), `/autocompact`, `autoCompactWindow`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (CITED)
- code.claude.com/docs/en/skills — skill locations (no `.agents/skills`), frontmatter, 1,536-char listing cap, Agent Skills standard (CITED)
- code.claude.com/docs/en/costs — `/compact` with focus, `/usage`, `/context`, LSP plugins reduce reads, subagent cost (CITED)
- code.claude.com/docs/en/plugins-reference — `dependencies` field (`name@marketplace`) (CITED)
- platform.claude.com/docs/en/build-with-claude/context-windows — context awareness only on Sonnet 5 / Sonnet 4.6 / Sonnet 4.5 / Haiku 4.5. Opus 4.7+, Sonnet 5.5, Haiku 5.5 and Fable don't receive the tags (CITED)
- learn.chatgpt.com/docs/agent-configuration/subagents (redirected from developers.openai.com/codex/subagents) — `.codex/agents/*.toml`, `model`, `model_reasoning_effort`, on by default, `skills.config` (CITED)
- learn.chatgpt.com/docs/config-file/config-reference and /config-basic — `model_auto_compact_token_limit`, `agents.default_subagent_model`, `skills.max_context_tokens`, project config trust (CITED)
- learn.chatgpt.com/docs/cli/slash-commands — `/compact`, `/status`, `/statusline` (CITED)
- learn.chatgpt.com/docs/build-skills — `.agents/skills` discovery, `$skill` invocation (CITED)
- docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference — custom agent frontmatter (`model`, `models`, `modelPolicy`, `reasoningEffort`), agent locations incl. `.claude/agents/`, skill locations, `/compact`, `/context`, `--effort` (CITED)
- docs.github.com/en/copilot/concepts/agents/copilot-cli/context-management — auto-compaction ~80% / ~95% (CITED)
- docs.github.com/en/copilot/reference/custom-agents-configuration — `model` "If unset, inherits the default model" (CITED)
- opencode.ai/docs/agents/, /docs/skills/, /docs/config/, /docs/models/, /docs/tui/, opencode.ai/v2/docs/agents/ — agent `model`, `mode: subagent`, `#variant`, skills paths, compaction keys, `/compact` (CITED)
- antigravity.google/docs/cli/commands/agents — agent file locations (CITED)
- github.com/google-antigravity/antigravity-cli releases via `gh api` (1.1.5 `model` agent option, 1.3.1 `skills:` paths, 1.3.5 `/compact`, 1.4.1 24 KB skill limit, 1.4.2 latest 2026-10-18) (CITED, official release notes)
- pi.dev and github.com/earendil-works/pi `packages/coding-agent/docs/{compaction,settings,skills,sessions,models}.md` via `gh api` — no sub-agents, `reserveTokens` 16384, `/compact`, `.agents/skills`, `/skill:name`, footer usage. Release v1.3.0 2026-10-15 (CITED)
- agentskills.io/specification — SKILL.md fields and limits, progressive disclosure (CITED)
- github.com/nextlevelbuilder/ui-ux-pro-max-skill README + `gh api` (MIT, v2.15.0, Python 3 requirement, `uipro init --ai …`); `npm view ui-ux-pro-max-cli` (CITED)
- github.com/obra/superpowers README (MIT, v7.0.0, per-host installs, SessionStart bootstrap) (CITED)
- github.com/dietrichgebert/ponytail README + `AGENTS.md` (MIT, v5.3.2) (CITED). Benchmark numbers are vendor claims (LOW)
- github.com/anthropics/claude-plugins-official `plugins/{code-simplifier,feature-dev,commit-commands,frontend-design}` trees and LICENSE files (Apache-2.0) (CITED)
- github.com/Graphify-Labs/graphify README (Apache-2.0); pypi.org/pypi/graphifyy/json (0.9.92, `requires_python >=3.10`, dependency list) (CITED). Cloud token-saving claim (LOW)
- github.com/colbymchenry/codegraph README (MIT, SQLite, MCP) (CITED); `gh api` metadata for oraios/serena, vitali87/code-graph-rag, modelcontextprotocol/servers (metadata only, LOW); `npm view @modelcontextprotocol/server-memory` (CITED)
- npm registry versions on 2026-10-20: `@anthropic-ai/claude-code` 2.1.304, `@openai/codex` 0.163.0, `@github/copilot` 1.0.100, `opencode-ai` 1.19.3, `@earendil-works/pi-coding-agent` 1.3.0
- Carried, not re-fetched: `.planning/milestones/v2.1-phases/34-model-effort-dial-pi-support/34-RESEARCH.md` §A (CC changelog 2.1.78 / 2.1.267, retrieved 2026-10-06)
