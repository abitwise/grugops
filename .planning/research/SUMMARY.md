# Project Research Summary

**Project:** grugops
**Domain:** File-based multi-agent SDLC delivery kit (markdown + installers + Claude Code plugin)
**Researched:** 2026-06-02
**Confidence:** HIGH

## Executive Summary

grugops is a file-only agent factory: markdown role prompts, workflows, handoff packets, checklists, a config dial, a Kanban/Sprint board, and a traceability trail — plus two idempotent install scripts and one optional Node validator — that drops on top of coding-agent CLIs the user already runs (Claude Code, Codex, Gemini, OpenCode, Copilot). There is no runtime to architect. The host LLM is the CPU; grugops supplies role (program), workflow (control flow), handoff (call stack), board + traceability (mutable state), config (feature flags), and gate (assertions). This means the build artifact is almost entirely markdown, and "architecting" grugops means designing a file-protocol the host agent will follow in a disciplined read-order. The recommended approach: write everything once, point per-tool adapters at the canonical files, and swap only the dispatch mechanism (spawned sub-agents on Claude Code, sequential context-load everywhere else).

The spec was written against a slightly older snapshot of the Claude Code docs and several details have moved. Five spec-vs-reality deltas must be corrected during the build: Claude Code docs moved to code.claude.com; the `Task` tool was renamed `Agent` (still aliased); custom commands merged into Skills (`commands/` still works, `skills/` is the recommended forward path for new plugins); subagents cannot nest, so the Orchestrator must be the main thread to spawn role subagents or the team falls back to the portable sequential model; and plugin subagents silently ignore `hooks`/`mcpServers`/`permissionMode` frontmatter, meaning the prod-deploy safety hook must live in a plugin-level `hooks/hooks.json`, never in a subagent file. This last point is safety-critical — getting it wrong produces a guard that appears active but fires on nothing.

No verified peer — BMAD-METHOD, GitHub spec-kit, Agent OS — ships the lean-to-enterprise governance dial, the WIP-limited board, the traceability matrix, or the NFR catalog. These four features are category-unique and form the auditable-delivery moat. The core risk to the project is drift: adapter drift (copying role text into per-tool wrappers), context drift (bloated AGENTS.md), and tool-format drift (Claude Code conventions move fast). All three are prevented by the single-source discipline enforced from day one, and verified by a dogfood run at the end.

---

## Spec-vs-Reality Deltas

These are places where the source spec's examples are stale and must be corrected during the build.

| # | Topic | Spec assumption | Current reality (2026) | Impact |
|---|-------|-----------------|----------------------|--------|
| 1 | Claude Code docs host | `docs.claude.com/en/docs/claude-code/*` | 301-redirects to `code.claude.com/docs/en/*` | Update every generated link/README reference |
| 2 | `Task` tool name | `Task(...)` in agent `tools:` lists | Renamed to `Agent` in CC v2.1.63; `Task` still works as legacy alias | Use `Agent` in all new agent frontmatter |
| 3 | Commands vs Skills | Spec only mentions `commands/` | "Custom commands merged into Skills." `commands/` still works; `skills/` is the recommended forward path for new plugins | Decide deliberately which form to ship; document it. Both supported; `skills/` preferred for future-proofing |
| 4 | Subagent nesting | Orchestrator can spawn role sub-agents which can spawn further sub-agents | Subagents cannot spawn subagents (no nesting). Orchestrator must be the main thread (plugin `settings.json` `agent:` key) to use spawn mode, otherwise fall back to sequential | Design sequential-load as the portable baseline; offer spawn mode as a Claude-Code-native enhancement |
| 5 | Plugin subagent hooks | `hooks`/`mcpServers`/`permissionMode` in subagent frontmatter | **Silently ignored** by plugin subagents (security restriction, verified in current docs) | **Safety-critical.** The prod-deploy PreToolUse guard MUST live in plugin-level `hooks/hooks.json`, never in subagent frontmatter |
| 6 | Command namespacing | Spec implies `/grug` is achievable from a plugin | Plugin commands always namespace as `/<plugin-name>:<cmd>`; bare `/grug` requires standalone `.claude/commands/grug.md` OR naming the plugin `grug` | User has decided to ship both forms; document the distinction clearly |
| 7 | AGENTS.md scope | Treated as a grugops-internal convention | Now a Linux Foundation standard (Agentic AI Foundation); 60k+ projects, 20+ tools. Codex enforces a 32 KiB cap (`project_doc_max_bytes`) | Keep AGENTS.md minimal — there is now a hard byte ceiling behind the spec's instinct |
| 8 | Context file quality | More context = better | LLM-generated context files reduce task success ~2-3% vs none; human-written improve ~4%. "Context rot" is empirically measurable | AGENTS.md Scribe is a removal role as much as an authoring role |

---

## Key Findings

### Recommended Stack

grugops has no application stack — the build artifact is markdown plus two install scripts and an optional Node validator. The "stack" is the set of host-tool integration formats the kit must conform to. All five target CLIs read AGENTS.md (Gemini needs a one-line `settings.json` entry or a GEMINI.md pointer; the rest are native). The Claude Code plugin manifest (`plugin.json` at `.claude-plugin/`, components at plugin root) distributes the kit as a versioned, installable bundle. Installers are POSIX sh and Node 18+ ESM with no runtime dependencies beyond Node's stdlib. Versioning follows SemVer 2.0.0; changelog follows Keep a Changelog 1.1.0.

**Core technologies:**
- **Markdown (CommonMark + YAML frontmatter):** all roles, workflows, handoffs, checklists, state files — readable, diffable, git-native; every target tool parses it
- **AGENTS.md (Linux Foundation standard):** the single portable substrate every tool reads; closest-file-wins nesting; no schema, plain markdown
- **Claude Code plugin manifest:** `.claude-plugin/plugin.json` + `marketplace.json`; versioned, shareable; only `plugin.json` + `marketplace.json` live in `.claude-plugin/`, all component dirs at plugin root
- **POSIX sh `install.sh` + Node 18+ ESM `install.mjs`:** idempotent, additive, dry-run, reversible installers; Node path covers Windows
- **Claude Code PreToolUse hook (`hooks/hooks.json`):** mechanical prod-deploy guard; exit-code-2 deny or JSON `permissionDecision: deny`; must be plugin-level, never subagent frontmatter
- **SemVer 2.0.0 + Keep a Changelog 1.1.0:** versioning and changelog format

**Two open human decisions (must be resolved before Phase 5):**
- Ship as `2.0.0` (spec continuity, accepts SemVer break-contract from day one) vs `0.x` (dogfooding latitude). Spec says `2.0.0`.
- `commands/` (flat, legacy, simpler) vs `skills/` (model-invoked, recommended forward path) for command files in the plugin. Standalone form naturally uses `commands/`.

### Expected Features

**Must have (table stakes — missing these makes grugops look incomplete vs peers):**
- One entry command (`/grug`) routing through the full SDLC via the Orchestrator
- One-command safe install: idempotent, additive, dry-run, reversible (above peer baseline)
- Greenfield + brownfield bootstrap (brownfield mapping is the harder, more-valued half)
- idea → epics → tickets → PR loop with acceptance criteria, sizing, priority, NFR triggers
- Quality gate before "done": CI/CD backpressure, bounded self-fix (default 2 attempts), terminal result
- Memory and handoff files between steps: completed packet is the inter-role call-return value
- Persistent artifacts in git: board.md, traceability.md, handoffs, ADRs
- Cross-tool portability: AGENTS.md substrate + thin per-tool adapters; only dispatch differs
- Project config: `factory.config.json` + `.md` twin; zero-config lean defaults

**Should have (differentiators — category-unique, no verified peer ships these):**
- Lean-to-enterprise config dial (`mode: lean|enterprise`): single flag flips roster + gates — strongest differentiator
- Auditable Kanban/Sprint board with WIP limits in git (`plans/board.md`) — category-unique
- Requirement-to-release traceability matrix (`plans/traceability.md`) — category-unique
- NFR catalog with SLO targets (`plans/nfr-catalog.md`) — category-unique
- Mechanical "humans decide / agents never deploy prod" guard (PreToolUse hook + config flag)
- Enterprise-pack roles: release-manager, compliance-officer, incident-responder, factory-coach, installer
- CI/CD backpressure: bounded, never-loop-forever, terminal result (READY | BLOCKED | SPLIT)
- Factory Coach self-improvement loop

**Defer (v2+):**
- Additional compliance regimes / sector packs
- Richer metrics / dashboards (anti-feature risk; keep markdown counts)
- Agent marketplace beyond the single-plugin catalog
- More example runs (add as real usage reveals gaps)

**Anti-features to actively resist (documented so roadmap resists scope creep):**
- Heavyweight platform / runtime / DB / queue
- 30-bot autonomous swarm (verified failure mode: exponential token growth, cascading hallucinations)
- Autonomous merge or auto-deploy to prod
- Long machine-generated context files
- Fabricated gate results

### Architecture Approach

The architecture is a file-protocol, not a service. One canonical core of markdown (roles, workflows, handoffs, checklists, config) is read identically by every tool; per-tool adapters are thin one-line pointers, never copies. The Orchestrator dispatches work in two modes: spawn mode on Claude Code (Orchestrator as main thread, role subagents as leaves — subagents cannot nest) and sequential mode on all other tools (Orchestrator loads each role file into its own context in turn). Both modes produce identical handoff packets and board/trace updates; the handoff is the interface, dispatch is the implementation detail. Consistency across board, tickets, and traceability is maintained by convention (single-writer-per-transition) and verified by a stateless validator, not a database.

**Major components (in dependency order):**
1. **Config schema + ID scheme + board skeleton** — foundational vocabulary; roles cite field names, board columns, and IDs by name; freeze before writing any role
2. **Handoff templates + checklists** — shared I/O contracts for roles and workflows; build before roles
3. **AGENTS.md substrate** — read-order contract, safety rules, real commands; minimal and high-signal
4. **Roles** — the program; Orchestrator first (defines routing contract), then core 11, then enterprise 5
5. **Workflows** — control flow composing roles; cannot be written coherently until roles and their I/O contracts exist
6. **Packaging + install + plugin + safety hook** — thin adapters pointing at finished roles; plugin-level PreToolUse hook (never subagent frontmatter)
7. **Validator + examples + dogfood** — assert and exercise the finished whole; dogfood is the acceptance gate

**Key patterns:**
- Single-source content, thin generated/symlinked dispatch (pointer-wrappers as portable default; symlinks as POSIX install-time optimization)
- Read-order contract as the universal interface: "Read AGENTS.md, then orchestrator role, then config, then board" — identical wording in every entry file
- Orchestrator-as-dispatcher with two physical realizations (spawn on Claude Code, sequential everywhere else)
- Backpressure loop encoded as deterministic workflow steps with a config-bound attempt counter
- Mechanical safety via plugin-level PreToolUse hook, degrading to prompt-only on non-Claude tools

### Critical Pitfalls

1. **Bloated, machine-generated AGENTS.md** — LLM-generated context files reduce task success ~2-3% vs none; Codex has a 32 KiB hard cap. Make the AGENTS.md Scribe role a removal role; target ~1 screen; push detail into the files it points to. Add a length/duplication check to the validator.

2. **Safety hook in subagent frontmatter (silently ignored)** — plugin subagents silently ignore `hooks`/`mcpServers`/`permissionMode`. A prod-deploy guard placed in subagent frontmatter fires on nothing. The PreToolUse hook must live in plugin-level `hooks/hooks.json`. Test it against a sample `kubectl apply` before declaring the plugin done.

3. **Adapter drift — role text copied per tool** — five copies diverge; every fix becomes five edits. Adapters are thin pointers only. Lock the pointer-only rule before any second-tool adapter is written. Validator should flag adapters with large bodies.

4. **Faked gate results** — LLMs pattern-complete; confident fabrication is the path of least resistance. Hard-code "mark unknown commands `UNKNOWN - verify`, never fake a pass" into every role's skeleton and AGENTS.md safety rules. Gate must capture actual command output in the handoff.

5. **Config schema / ID scheme / board vocabulary not frozen before writing roles** — roles cite these by name; changing them later forces a rewrite of every role. Treat the config schema as an API contract. Freeze in Stage 0 before writing any role.

6. **Non-idempotent installer** — use the `ensure_line` pattern (grep-before-append); honor `DRY_RUN=1`; ship `uninstall.sh`; test run-twice-produces-no-diff.

7. **No dogfood run** — "done" claimed because files exist and validator passes, but the kit has never run on a real repo. Dogfooding is the acceptance gate (spec §20). Run on a throwaway sample repo, bootstrap it, take one ticket idea-to-PR end-to-end.

---

## Implications for Roadmap

The ARCHITECTURE.md build-order is the direct input to the phase structure. Each stage's outputs are the next stage's inputs; violating this order forces rewrites. The hard rule: freeze the config schema, board column vocabulary, and ID scheme before writing any role.

### Phase 1: Substrate, Config Schema, and State Skeleton

**Rationale:** Everything else references config field names, board column vocabulary, and ID prefixes by name. Changing these after roles are written forces a rewrite of every role. This is the vocabulary phase — freeze it first.

**Delivers:**
- `config/factory.config.json` schema + `.md` twin with zero-config lean defaults (field names: mode, cadence, autonomy, wip_limits, self_fix_attempts frozen)
- ID scheme: EPIC/FEAT/ABC/ADR/NFR/RISK/REL/INC + configurable prefix convention
- `plans/board.md` column vocabulary + WIP-limit format
- Empty state file stubs: traceability.md, nfr-catalog.md, metrics.md, sprints/, releases/, epics/, features/, tickets/
- `AGENTS.md` substrate stub (minimal; read-order contract + safety rules + real commands; command section as `UNKNOWN - verify` until verified)

**Addresses:** P1 features: config dial, stable IDs, board
**Avoids:** Config-schema-drift pitfall, board-ticket-drift pitfall
**Research flag:** No additional research needed — patterns are well-defined; schema is an internal contract.

### Phase 2: Shared Dependencies (Handoffs, Checklists, Memory-Bank)

**Rationale:** Roles name their output handoffs and apply checklists. If these don't exist as real files when roles are written, roles reference placeholders and accumulate inconsistency. Build the targets before the referencers.

**Delivers:**
- Universal handoff header (with Ticket ID, Trace updates fields) — the shared schema all roles and workflows reference
- Per-role handoff templates (16 total: universal, per-role bodies, ticket-ready, implementation-ready, release, incident-postmortem, retro-notes, refinement-notes, sprint-plan)
- All 10 checklists: DoR, DoD lean, DoD enterprise, PR review, security/NFR, compliance, accessibility, observability-SLO, release-readiness, UAT
- `memory-bank/` seed files (00-index through 80-glossary) + `50-decisions/ADR` convention

**Addresses:** P1 features: handoff templates, DoR/DoD checklists
**Avoids:** Over-engineering pitfall (checklists are markdown, not a platform)
**Research flag:** No additional research needed — all formats are internal design.

### Phase 3: Core Roles (Orchestrator First, then Core 11, then Enterprise 5)

**Rationale:** The Orchestrator defines the routing contract and read-order all other roles slot into. Writing any other role before the Orchestrator means writing against an undefined contract. Enterprise roles depend on enterprise artifacts that don't exist yet; write core first.

**Delivers:**
- Orchestrator role (routing contract: reads config + board first, routes to specialist roles, enforces WIP limits, demands handoff packets, never merges/deploys)
- Core 11 roles: agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm, system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner — each with the fixed 9-section skeleton
- Enterprise 5 roles: release-manager, compliance-officer, incident-responder, factory-coach, installer
- Every role honors `factory.config.json`; grug voice in prompts, clear English in findings/outputs

**Addresses:** P1 features: orchestrator, all roles, lean/enterprise dial behavior
**Avoids:** Bloated-roles pitfall (caveman voice doubles as a length constraint), faked-results pitfall (no-fabrication baked into every role skeleton), voice-leak pitfall (findings are clear-voice)
**Research flag:** No additional research needed; subagent frontmatter fields fully verified.

### Phase 4: Workflows

**Rationale:** A workflow is an ordered composition of roles, handoffs, board moves, and gate criteria. It cannot be written coherently until the roles it sequences and the handoffs it names exist.

**Delivers:**
- Lifecycle/bootstrap workflows (00-06): greenfield bootstrap, brownfield bootstrap, idea-to-epics, epic-to-tickets, ticket-to-PR, PR quality gate, UAT pack
- Ceremony workflows (07-11): backlog refinement, sprint planning, daily sweep, sprint review, retro
- Enterprise workflows (12-13): release, incident
- CI/CD backpressure encoded as deterministic workflow steps: prefetch → implement on branch → gate → bounded self-fix (config counter) → terminal result (READY | BLOCKED | SPLIT)

**Addresses:** P1 features: all lifecycle workflows, backpressure gate, kanban/scrum cadence; P2 features: enterprise workflows
**Avoids:** Unbounded-self-fix pitfall (bound encoded in workflow Stop conditions)
**Research flag:** No additional research needed.

### Phase 5: Packaging, Adapters, Install, and Plugin/Safety Hook

**Rationale:** Adapters are thin pointers to role files; their content cannot be finalized until role filenames and the orchestrator read-order contract are frozen. The safety hook is a plugin-level concern and must be built and tested here — not placed in subagent frontmatter. This phase resolves both the `/grug` vs `/grug:plan` command-shape decision and the `2.0.0` vs `0.x` versioning decision.

**Delivers:**
- `agent-factory/packaging/`: adapters.md, subagent.frontmatter.md, slash-command.template.md, generated `claude-agents/` thin wrappers, `claude-commands/factory.md`
- Standalone `.claude/` form: thin sub-agent wrappers (pointer, never role body), `/grug` command(s), one-line CLAUDE.md pointer
- Claude Code plugin form: `.claude-plugin/plugin.json` + `marketplace.json`; `agents/`, `commands/`, `hooks/` at plugin root (not inside `.claude-plugin/`)
- Plugin-level `hooks/hooks.json` PreToolUse prod-deploy guard — blocks deploy patterns via exit-code-2 deny; uses `${CLAUDE_PLUGIN_ROOT}` for script path; tested against sample deploy commands
- Per-tool pointers: GEMINI.md, `.github/copilot-instructions.md`; Codex and OpenCode read AGENTS.md natively
- `install/install.sh` (POSIX) + `install/install.mjs` (Node 18+) + `uninstall.sh`: idempotent, additive, dry-run-capable, reversible
- Resolution of two open human decisions: version string + command form

**Addresses:** P1 features: Claude Code plugin, standalone form, all five tool adapters, installers, mechanical safety
**Avoids:** Adapter-drift pitfall (pointer-only rule from the first adapter), prompt-only-safety pitfall, tool-format-mistakes pitfall, bad-installer pitfall
**Research flag:** Verify current `claude plugin validate` output and any plugin manifest changes at build time. Resolve `commands/` vs `skills/` and `2.0.0` vs `0.x` at the start of this phase. Confirm plugin-cache path resolution during dogfood.

### Phase 6: Validator, Brand/Docs Collateral, and Dogfood

**Rationale:** The validator asserts the finished structure; examples narrate the finished flow; dogfood exercises the complete chain. All three are verification artifacts, not building blocks. Dogfood is the acceptance gate — "done" cannot be claimed without a real `/grug` idea-to-PR transcript on a throwaway sample repo.

**Delivers:**
- `scripts/validate-agent-factory.mjs`: structure checks (required files + sections) + consistency checks (board-ticket status match, traceability row per ticket, AGENTS.md length/duplication sanity, adapter pointer-only check, READY-without-evidence flag, config parses)
- `agent-factory/examples/`: 5 example runs (greenfield bootstrap, brownfield bootstrap, ticket-to-PR, sprint cycle, release run)
- Brand/docs collateral: README (plain-English hero + acknowledgements + non-affiliation footer in clear professional English), NOTICE, CONTRIBUTING, `brand/wordmark*.svg` + `brand/icon.svg`, `docs/faq.md`
- Dogfood transcript: `/grug` on a throwaway sample repo, bootstrap, idea-to-PR end-to-end, confirming: AGENTS.md is minimal and helpful, adapters dispatch correctly, PreToolUse hook blocks a sample deploy command, handoffs contain real command output, board-ticket status stays in sync

**Addresses:** P1 features: examples, validator, brand/legal collateral, dogfood acceptance
**Avoids:** AGENTS.md-bloat pitfall (verified in dogfood), voice-leak pitfall (README/NOTICE in clear English), IP/art pitfall, no-dogfooding pitfall, weak-validator pitfall
**Research flag:** No additional research needed. Dogfood surfaces integration bugs that research cannot anticipate.

---

### Phase Ordering Rationale

- Config schema + ID scheme + board columns before any role — roles cite these by name; changing them later forces a full rewrite
- Handoffs + checklists before roles — they are the I/O contracts roles declare; roles reference real filenames, not placeholders
- Orchestrator before all other roles — it is the routing contract; other roles slot into it
- Core roles before enterprise roles — enterprise roles depend on enterprise artifacts (NFR catalog, evidence trail) that don't exist until the core loop is built
- Roles before workflows — workflows compose roles; a workflow written against missing roles becomes placeholder soup
- Adapters after roles — adapters are pointers to role files and the read-order contract; their content cannot be finalized until both exist
- Safety hook in the packaging phase, at plugin level — it is a plugin-level concern, not a subagent-level concern; building it here prevents the silent-ignore gotcha
- Validator + examples + dogfood last — they assert and exercise a complete structure; a partial structure produces a misleading green

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Packaging/Plugin):** Verify current `claude plugin validate` output, `commands/` vs `skills/` behavior, and plugin-cache path resolution at build time. Claude Code plugin conventions move fast — this is the one area with an explicit "verify against current tool docs" warning in the spec.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Substrate/Config):** Internal schema design; no external convention to verify.
- **Phase 2 (Handoffs/Checklists):** Internal template design; markdown only.
- **Phase 3 (Roles):** Claude Code subagent frontmatter fields fully verified (HIGH confidence). Role content is internal.
- **Phase 4 (Workflows):** Workflow steps are internal logic; no external APIs.
- **Phase 6 (Validator/Dogfood):** Standard Node filesystem scripting; dogfood is integration testing, not research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All format dimensions verified against current official docs at code.claude.com, agents.md, developers.openai.com, geminicli.com, opencode.ai, docs.github.com (Jan/Feb 2026 doc state) |
| Features | HIGH on landscape; MEDIUM on dial differentiator | Competitive landscape verified against current GitHub repos/docs. The lean-to-enterprise dial claim rests on the absence of a verified peer — strong but only as durable as the competitive landscape |
| Architecture | HIGH for Claude Code mechanics; MEDIUM for cross-tool AGENTS.md status | Sub-agent/plugin mechanics verified against current code.claude.com docs. AGENTS.md cross-tool adoption consistent across multiple dated web sources (Feb-May 2026) but not from a single canonical registry |
| Pitfalls | HIGH on tool-format facts; MEDIUM-HIGH on context-file degradation evidence | Tool-format pitfalls verified against current docs. Context-file success-rate data from secondary sources that corroborate the spec's claim |

**Overall confidence:** HIGH

### Gaps to Address

- **`commands/` vs `skills/` decision:** Must be resolved at the start of Phase 5. Both work; `skills/` is the forward-path, `commands/` is simpler and still fully supported. Brand implications favor `commands/` for the literal `/grug` shape.

- **Version string `2.0.0` vs `0.x`:** Must be resolved before Phase 5. `2.0.0` matches the spec and accepts the SemVer break-contract from day one. `0.x` gives dogfooding latitude. Default to spec's `2.0.0` unless the human prefers `0.x`.

- **Plugin-cache + role-file path resolution:** Whether the plugin-cache copying breaks the wrappers' `agent-factory/roles/*.md` references must be confirmed during dogfood (Phase 6). Expected to resolve against the user's repo, not the plugin cache — but must be verified.

- **Standalone-`/grug` + plugin-`/grug:*` coexistence:** Exact behavior when both forms are installed in the same Claude Code session (potential namespace confusion between `/grug` standalone and `/grug:plan` plugin) is flagged `UNKNOWN - verify` and should be confirmed during dogfood.

- **Per-tool adapter verification:** Each tool's AGENTS.md conventions should be re-verified at build time before finalizing that tool's adapter. They move fast.

---

## Sources

### Primary (HIGH confidence)
- code.claude.com/docs/en/plugins — plugin creation, commands-merged-into-skills, structure rules, components at root not in `.claude-plugin/`
- code.claude.com/docs/en/plugins-reference — full plugin.json schema, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`, version management, caching behavior
- code.claude.com/docs/en/plugin-marketplaces — marketplace.json schema, sources, install flow, reserved names
- code.claude.com/docs/en/sub-agents — subagent frontmatter, auto-routing via description, Agent-tool rename (v2.1.63), no-nesting rule, plugin subagents ignore hooks/mcpServers/permissionMode
- code.claude.com/docs/en/skills — commands merged into skills, frontmatter fields, `$ARGUMENTS`, `disable-model-invocation`
- code.claude.com/docs/en/hooks — PreToolUse/PostToolUse, matcher + `if:` syntax, exit-2 vs JSON deny, exec/shell form
- agents.md — open standard, plain-markdown, 60k+ projects, 20+ tools, Linux Foundation Agentic AI Foundation governance
- developers.openai.com/codex/guides/agents-md — global `~/.codex/AGENTS.md`, root-to-cwd concatenation, 32 KiB `project_doc_max_bytes` cap
- geminicli.com/docs + google-gemini/gemini-cli — GEMINI.md default, `context.fileName` to read AGENTS.md
- opencode.ai/docs/rules + /docs/agents — AGENTS.md project + global, opencode.json, markdown agent files
- docs.github.com/en/copilot — AGENTS.md root+nested, all-combine behavior, `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`
- keepachangelog.com/en/1.1.0 — changelog format
- semver.org — SemVer 2.0.0

### Secondary (MEDIUM confidence)
- BMAD-METHOD (github.com/bmad-code-org/BMAD-METHOD + docs.bmad-method.org) — 12+ agents, 34+ workflows, stage-transition quality gates, scale-adaptive planning
- GitHub spec-kit (github.com/github/spec-kit) — slash commands, 30+ agents, constitution/analyze/checklist
- Agent OS (buildermethods.com/agent-os/v2) — 6 phases, standards layers, Claude-first + adapters
- awesome-claude-code-subagents (github.com/VoltAgent/awesome-claude-code-subagents) — 100+ subagents catalog
- InfoQ (Mar 2026) — "New Research Reassesses the Value of AGENTS.md Files for AI Coding" — LLM-generated context files reduce success ~2-3%; human-written improve ~4%
- Morph — "Context Rot: Why LLMs Degrade as Context Grows" — measurable degradation below window limit
- aimultiple.com/multi-agent-frameworks + galileo.ai/blog/openai-swarm-framework — sequential agents and exponential token growth, cascading hallucinations

### Tertiary (LOW confidence)
- GrugCode (grugbrain.ai) — anti-complexity coding agent persona; brand-adjacent, not a direct competitor

---
*Research completed: 2026-06-02*
*Ready for roadmap: yes*
