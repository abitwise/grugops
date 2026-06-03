# Requirements: grugops

**Defined:** 2026-06-02
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoffs, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy.

> **Scope note:** This milestone builds the **complete Agent Factory v2 spec** (core + enterprise pack + plugin distribution) plus brand/docs collateral, validated by dogfooding. "v1" below denotes grugops's *first GSD milestone* — not the factory's lean tier. There are no deferred ("v2 Requirements") items this milestone; everything in the spec is committed. Requirements marked **[research]** correct a place where the source spec is stale against current 2026 tool docs (see `.planning/research/SUMMARY.md`).

## v1 Requirements

### Structure & Scaffolding

- [x] **STRUCT-01**: Repository is scaffolded per spec §3 — `agent-factory/{roles,workflows,handoffs,checklists,examples,packaging,config}`, `plans/{board,traceability,nfr-catalog,metrics,sprints,releases,epics,features,tickets}`, `memory-bank/*`, `install/*`, `.claude-plugin/`, and root `AGENTS.md` — without deleting or overwriting existing user content (e.g. `docs/`)
- [x] **STRUCT-02**: `agent-factory/VERSION` and `agent-factory/README.md` exist; the README explains usage across all five tools (the dispatch difference) and gives copy-paste Orchestrator prompts for bootstrap, refine, plan, sweep, ticket→PR, gate, UAT, and release

### Config Dial

- [x] **CONFIG-01**: `agent-factory/config/factory.config.json` exists with `mode`, `cadence`, `autonomy`, `id_prefix`, `repo_strategy`, `default_stack`, `wip_limits`, `sprint_length_days`, `sizing`, `priority_scheme`, `quality`, `nfr`, `compliance_regime`, `environments`, `production_requires_human_confirmation`, `blocked_escalation_days`
- [x] **CONFIG-02**: A human-readable `factory.config.md` twin documents the meaning of every config field
- [x] **CONFIG-03**: The factory runs with ZERO config using documented defaults (`mode=lean`, `cadence=kanban`, `autonomy=pr`); every role reads the config first and honors it when present

### Roles

- [x] **ROLE-01**: All 11 core role prompts exist (orchestrator, agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm, system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner), each following the standard role skeleton (One job / Caveman prompt / Reads / Activates when / Responsibilities / Output / Board moves / Trace updates / Hard limits) in caveman voice; each reads config first, updates the board on column change, and appends to traceability
- [x] **ROLE-02**: All 5 enterprise-pack role prompts exist (release-manager, compliance-officer, incident-responder, factory-coach, installer), activating only when `mode=enterprise` or their trigger fires, in the same skeleton and voice
- [x] **ROLE-03**: The Orchestrator role encodes the full routing matrix and request-type classification, enforces WIP limits and Definition of Ready before pulling work, splits XL work, and carries the hard limit that it never merges a protected branch or deploys prod

### Workflows

- [ ] **FLOW-01**: Bootstrap workflows (`00-bootstrap-greenfield`, `01-bootstrap-brownfield`) exist and seed AGENTS.md, memory-bank, the repo map/plan, the board, config, and safe first tickets
- [x] **FLOW-02**: Lifecycle workflows exist (`02-idea-to-epics`, `03-epic-to-tickets`, `04-ticket-to-pr`, `05-pr-quality-gate`, `06-uat-pack`), each with board moves, handoffs produced, trace updates, and stop/done conditions
- [ ] **FLOW-03**: Ceremony workflows exist (`07-backlog-refinement`, `08-sprint-planning`, `09-daily-sweep`, `10-sprint-review`, `11-retro`); the daily sweep and refinement/retro work in Kanban flow, and planning/review/retro work in Scrum cadence — cadence selected by config
- [ ] **FLOW-04**: Enterprise workflows exist (`12-release`, `13-incident`) with the release approval gate and the blameless incident path
- [x] **FLOW-05**: Every workflow file follows the v2 workflow template (When / Agents / Inputs / Steps / Board moves / Handoffs / Trace updates / Metrics emitted / Stop / Done)

### Handoff Templates

- [x] **HAND-01**: All core handoff templates exist and are copy-paste usable (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet); the universal header carries Ticket ID and Trace updates fields
- [x] **HAND-02**: All v2 handoff templates exist (release-handoff, incident-postmortem [blameless], retro-notes, refinement-notes, sprint-plan)

### Checklists

- [x] **CHECK-01**: Lean checklists exist (definition-of-ready, definition-of-done, pr-review-checklist, security-nfr-checklist, uat-checklist)
- [x] **CHECK-02**: Enterprise + new-gate checklists exist (definition-of-done-enterprise superset, compliance, accessibility, observability-slo, release-readiness); the Orchestrator applies lean DoD in lean mode and enterprise DoD in enterprise mode

### Delivery OS — Board & Cadence

- [x] **BOARD-01**: `plans/board.md` is the single WIP source of truth with the spec's columns, per-column WIP limits sourced from config, and a format where each ticket's front-matter status matches its board column
- [ ] **BOARD-02**: Kanban (flow) cadence works — continuous pull, WIP limits as the throttle, daily-sweep reconciliation, cycle-time focus
- [ ] **BOARD-03**: Scrum (sprint) cadence works — time-boxed sprints with `plans/sprints/SPRINT-xx.md` (goal, committed, velocity, burndown) and the full ceremony set, selectable by config
- [x] **BOARD-04**: Sizing (t-shirt→points, XL must be split) and priority (P0–P3) are shared by both cadences; the Blocked policy records `blocked-by` + date and escalates past the config threshold

### Traceability & IDs

- [x] **TRACE-01**: Stable ID schemes are defined and used (EPIC-/FEAT-/`<prefix>`-/ADR-/NFR-/RISK-/REL-/INC-) with the project prefix configurable
- [x] **TRACE-02**: `plans/traceability.md` carries one row per ticket linking requirement→ticket→code→test→UAT→release; each role appends its link as it completes work; enterprise DoD is not met until the relevant row is complete

### NFR & Metrics

- [x] **NFR-01**: `plans/nfr-catalog.md` lists non-functional targets (category / target / applies-to / verified-by); the Architect seeds it, Security/NFR checks against it, the Release Manager attaches evidence
- [x] **METRIC-01**: `plans/metrics.md` tracks throughput, cycle time, lead time, WIP, blocked time, rework rate, gate pass rate, escaped defects, and (scrum) velocity; updated by the daily sweep and retro; consumed by the Factory Coach

### Backpressure & Safety

- [x] **GATE-01**: The quality-gate workflow encodes the backpressure loop — deterministic prefetch → implement on branch → gate (install/lint/typecheck/unit/build/e2e, commands from AGENTS.md) → bounded self-fix (config, default 2) → result (`READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`); unknown commands are recorded `UNKNOWN - verify`, never faked
- [x] **SAFE-01**: "Humans decide, agents execute" holds throughout — `autonomy=pr` default; no role ever merges a protected branch or deploys to production without named human confirmation
- [ ] **SAFE-02** **[research]**: The prod-deploy guard is mechanical — a plugin-level `hooks/hooks.json` `PreToolUse` Bash matcher denies deploy commands absent a human-confirm flag (NOT subagent frontmatter, which plugin subagents silently ignore); the Claude-only nature of this guard and the `autonomy=pr` fallback for the other four tools are documented

### AGENTS.md Substrate

- [x] **AGENTS-01** **[research]**: Root `AGENTS.md` follows the §17.1 shape (mission, how-to-work, file pointers, commands with `UNKNOWN - verify`, delivery, safety rules, DoR/DoD links, memory/plans, when-uncertain), is minimal and high-signal, stays under Codex's 32 KiB cap, and pushes detail into the files it points to; its Commands section lists real commands **with flags** (not just tool names) and prefers fast **file-scoped** variants (single-file typecheck / lint / format / test) per agents.md best practice
- [x] **AGENTS-02** **[research]**: The best-practices AGENTS.md (and the AGENTS.md Scribe role) embeds **Andrej Karpathy's 12 coding-agent rules** as the default behavioral guardrails, grouped under four principles — **Think Before Coding** (1 state assumptions / ask when uncertain, 2 present multiple interpretations rather than pick silently, 3 push back with a simpler approach when one exists, 4 stop and name what's confusing), **Simplicity First** (5 only requested features, 6 no single-use abstractions, 7 no unrequested flexibility/configurability, 8 no impossible-scenario error handling), **Surgical Changes** (9 don't "improve" adjacent code/comments/formatting, 10 don't refactor working code, 11 match existing style even if you'd differ, 12 flag — don't delete — pre-existing dead code), and **Goal-Driven Execution** (turn tasks into verifiable success criteria and loop). Rendered consistently with grugops's voice rules (clear voice for the rules; grug voice may echo them). Source captured verbatim in `.planning/research/AGENTS-MD-BEST-PRACTICES.md`

### Packaging & Adapters

- [ ] **PKG-01**: `agent-factory/packaging/adapters.md` maps each tool (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI) to its entry file + dispatch mode + adapter, enforces the single rule "all work starts at `orchestrator.md`," states "only the dispatch differs, never the content," and flags every tool row "verify against current tool docs"
- [ ] **PKG-02** **[research]**: Packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) use current Claude Code conventions — the `Agent` tool (not the legacy `Task` alias), single-source thin wrappers, and a recorded `commands/` vs `skills/` choice

### Claude Code Distribution Forms

- [ ] **CLAUDE-01**: Standalone `.claude/` form exists — thin sub-agent wrappers per role (single-source pointers to `agent-factory/roles/*.md`), command file(s) giving literal `/grug` + `/grug-<operation>` shortcuts, and a one-line `CLAUDE.md` pointer to AGENTS.md/orchestrator
- [ ] **CLAUDE-02** **[research]**: Plugin form exists — `.claude-plugin/plugin.json` + `marketplace.json`, `agents/`, `commands/`, and `hooks/` (the SAFE-02 guard); the Orchestrator is the spawner (sub-agents can't nest, so it runs as main thread via plugin `settings.json` `agent:` where spawning is used); both standalone and plugin forms coexist
- [ ] **CLAUDE-03**: Optional `settings.json` and any bundled hook scripts use `${CLAUDE_PLUGIN_ROOT}` for paths; the plugin name is chosen so command shapes match the brand (`grug` → `/grug:*`)

### Install Scripts

- [ ] **INSTALL-01**: `install/install.sh` (POSIX) and `install/install.mjs` (Node) are functionally identical, idempotent, additive, dry-run-capable (`DRY_RUN=1`), and reversible; they never overwrite user content, detect the host tool, lay down the right adapter/entry file, and print an install report (created / linked / skipped / verify)
- [ ] **INSTALL-02**: `install/uninstall.sh` removes only the symlinks and entry-pointer lines the installer added (never `agent-factory/`, `plans/`, or user files); `install/README.md` documents the "just install the markdown" minimal path and the `/factory:install` self-bootstrap

### Memory-Bank

- [x] **MEM-01**: A **minimal** memory-bank exists (00-index, 10-project-brief, 20-product, 30-architecture, 40-contributing, 50-decisions/ with ADR convention, 60-progress, 70-runbook, 80-glossary); it is the kit's persistent store for project state, plans, and durable info, with each file short, high-signal, and scoped to one kind of content — kept as small as possible (same anti-bloat rule as AGENTS.md), never a sprawling document dump
- [x] **MEM-02**: Roles use the memory-bank as working memory — they **read it on start and update it as work progresses**: `60-progress.md` is the running state / plan-of-record (kept current by the daily sweep), `50-decisions/` captures ADRs as they are made, and `00-index.md` maps the bank so an agent (or human) can orient in one read; no role lets the bank go stale or bloat

### Examples

- [ ] **EX-01**: Five example runs exist — greenfield bootstrap, brownfield bootstrap, and ticket→PR (each showing input, Orchestrator decision, and expected files/handoffs); a sprint cycle (refinement→planning→2 tickets through ticket→PR→daily sweeps→review→retro, with board snapshots and a velocity/metrics line); and a release run (feature → REL-0007 with SemVer/changelog/rollback/approval → human-confirmed deploy → Done, with traceability rows completed)

### Validator

- [ ] **VAL-01**: `scripts/validate-agent-factory.mjs` checks structure (all required role/workflow/handoff/checklist files exist; role/workflow files contain their required sections; config parses and has mode/cadence/autonomy; `board.md` exists and every ticket's status matches its column; every ticket has a traceability row and rows missing tests/UAT are flagged; packaging present and any `plugin.json` has a `name`); it never fabricates results and does not create `package.json` if absent

### Brand & Docs Collateral

- [ ] **BRAND-01**: `README.md` opens in clear voice (plain-English first sentence describing what grugops does) then the grug wink, includes the hero block, an Acknowledgements section crediting grugbrain.dev (Carson Gross), and the non-affiliation footer
- [ ] **BRAND-02**: `NOTICE` (repo root), `CONTRIBUTING.md` (contributor original-art + no-affiliation rules), and `docs/faq.md` exist, using the brand manual's ready-to-paste blocks
- [ ] **BRAND-03**: `brand/wordmark*.svg` (color, mono-dark, mono-light/reverse, and icon lockup) and `brand/icon.svg` exist as original art (never resembling the "Grug" children's-book character), lowercase `grugops`, using the Charcoal/Bone/Granite palette with a single Ochre accent

### Dogfood Validation

- [ ] **DOG-01**: grugops is installed via `/grug` onto a throwaway sample repo, the repo is bootstrapped, and one ticket is driven from idea to a PR end-to-end — the acceptance gate; the validator passes on the resulting structure
- [ ] **DOG-02**: The same roles/handoffs/gates are exercised over at least the portable AGENTS.md path (sequential role-load) and the Claude Code native path (sub-agent spawn), confirming "only the dispatch differs, never the content"

## v2 Requirements

(None deferred — the full Agent Factory v2 spec is committed to this milestone.)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Web UI / dashboard / SaaS platform | grugops is a file-and-prompt kit, not a platform; staying file-based is the point |
| Database, queue, or custom LLM runtime | Intelligence lives in the host coding agent; nothing to operate |
| Autonomous background workers acting without approval | Humans decide, agents execute |
| Agent marketplace beyond the single-plugin catalog | Avoids becoming a platform |
| Auto-merge to protected branches / auto-deploy to prod | Safety must stay mechanical and human-gated |
| Mascot/art resembling the "Grug" children's-book character | Separate IP; original art + non-affiliation only |

## Open Decisions

To be resolved at the **packaging phase** (`/gsd-discuss-phase`), with research already gathered:

| Decision | Options | Lean recommendation |
|----------|---------|---------------------|
| grugops version | `2.0.0` (spec continuity) vs `0.x` (new public release, dogfooding latitude) | `0.x` — it's a brand-new public tool |
| Command file form | `commands/` (legacy, flat) vs `skills/` (recommended forward path) | `skills/` for the plugin; standalone `.claude/commands/grug.md` for the literal `/grug` |

## Traceability

Each requirement maps to exactly one phase. See `.planning/ROADMAP.md` for phase goals and success criteria.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STRUCT-01 | Phase 1 | Complete |
| STRUCT-02 | Phase 1 | Complete |
| CONFIG-01 | Phase 1 | Complete |
| CONFIG-02 | Phase 1 | Complete |
| CONFIG-03 | Phase 1 | Complete |
| BOARD-01 | Phase 1 | Complete |
| BOARD-04 | Phase 1 | Complete |
| TRACE-01 | Phase 1 | Complete |
| TRACE-02 | Phase 1 | Complete |
| NFR-01 | Phase 1 | Complete |
| METRIC-01 | Phase 1 | Complete |
| HAND-01 | Phase 2 | Complete |
| HAND-02 | Phase 2 | Complete |
| CHECK-01 | Phase 2 | Complete |
| CHECK-02 | Phase 2 | Complete |
| MEM-01 | Phase 2 | Complete |
| MEM-02 | Phase 2 | Complete |
| ROLE-01 | Phase 3 | Complete |
| ROLE-02 | Phase 3 | Complete |
| ROLE-03 | Phase 3 | Complete |
| AGENTS-01 | Phase 3 | Complete |
| AGENTS-02 | Phase 3 | Complete |
| FLOW-01 | Phase 4 | Pending |
| FLOW-02 | Phase 4 | Complete |
| FLOW-03 | Phase 4 | Pending |
| FLOW-04 | Phase 4 | Pending |
| FLOW-05 | Phase 4 | Complete |
| BOARD-02 | Phase 4 | Pending |
| BOARD-03 | Phase 4 | Pending |
| GATE-01 | Phase 4 | Complete |
| SAFE-01 | Phase 4 | Complete |
| PKG-01 | Phase 5 | Pending |
| PKG-02 | Phase 5 | Pending |
| CLAUDE-01 | Phase 5 | Pending |
| CLAUDE-02 | Phase 5 | Pending |
| CLAUDE-03 | Phase 5 | Pending |
| INSTALL-01 | Phase 5 | Pending |
| INSTALL-02 | Phase 5 | Pending |
| SAFE-02 | Phase 5 | Pending |
| VAL-01 | Phase 6 | Pending |
| EX-01 | Phase 6 | Pending |
| BRAND-01 | Phase 6 | Pending |
| BRAND-02 | Phase 6 | Pending |
| BRAND-03 | Phase 6 | Pending |
| DOG-01 | Phase 6 | Pending |
| DOG-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-02*
*Last updated: 2026-06-02 after roadmap creation (traceability populated)*
