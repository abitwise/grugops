# Roadmap: grugops

## Overview

grugops is built bottom-up as a file protocol, not a runtime. The journey starts by freezing the shared vocabulary every later file cites by name (config field names, board column vocabulary, stable ID scheme) and laying down the empty state plane. Next come the shared I/O contracts — handoff templates, checklists, and the memory-bank seed — that roles and workflows reference. Then the roles themselves (Orchestrator first, defining the routing contract, then the core 11, then the enterprise 5) plus the minimal AGENTS.md substrate that points at them. With roles in place, the workflows compose them into the full lifecycle, ceremonies, and the backpressure quality gate. Only then are the thin per-tool adapters, both Claude distribution forms, install scripts, and the plugin-level safety hook built against finished, frozen role paths. Finally the validator, brand/docs collateral, and a real dogfood run (idea to PR on a throwaway repo, dual-dispatch parity) assert and exercise the complete whole. Each phase's outputs are the next phase's inputs; never place a consumer before its dependency.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Substrate, Config & State Skeleton** - Freeze the config schema, board columns, and ID scheme, and lay down the empty state plane every later file cites by name (completed 2026-06-02)
- [x] **Phase 2: Shared Contracts** - Build the handoff templates, checklists, and memory-bank seed that roles and workflows reference as their I/O contracts (completed 2026-06-02)
- [x] **Phase 3: Roles & AGENTS.md Substrate** - Write all 16 role prompts (Orchestrator first) and the minimal Karpathy-grounded AGENTS.md that points at them (completed 2026-06-03)
- [x] **Phase 4: Workflows, Cadence & Backpressure** - Compose roles into the full lifecycle, ceremonies, enterprise workflows, dual cadence, and the bounded quality gate (completed 2026-06-03)
- [x] **Phase 5: Packaging, Adapters, Install & Distribution** - Ship thin per-tool adapters, both Claude forms, idempotent installers, and the mechanical plugin-level prod-deploy guard (completed 2026-06-03)
- [ ] **Phase 6: Validation, Brand & Dogfood** - Ship the validator, examples, brand/legal collateral, and prove the kit end-to-end via a real idea-to-PR dogfood run

## Phase Details

### Phase 1: Substrate, Config & State Skeleton

**Goal**: Freeze the project's shared vocabulary (config field names, board column vocabulary, stable ID scheme) and scaffold the repository plus empty state plane, so every later file can cite names that will never move.
**Depends on**: Nothing (first phase)
**Requirements**: STRUCT-01, STRUCT-02, CONFIG-01, CONFIG-02, CONFIG-03, BOARD-01, BOARD-04, TRACE-01, TRACE-02, NFR-01, METRIC-01
**Success Criteria** (what must be TRUE):

  1. The repo is scaffolded per spec §3 (agent-factory/, plans/, memory-bank/, install/, .claude-plugin/, root AGENTS.md) without deleting or overwriting existing user content such as docs/
  2. `factory.config.json` carries every required field (mode, cadence, autonomy, id_prefix, wip_limits, quality, nfr, compliance_regime, environments, production_requires_human_confirmation, and the rest) and its human-readable `factory.config.md` twin documents the meaning of each one
  3. Documented zero-config defaults (mode=lean, cadence=kanban, autonomy=pr) are stated as the lean baseline a reader can rely on with no config file present
  4. `plans/board.md` exists with the spec's columns and per-column WIP-limit format sourced from config, and the sizing/priority/Blocked-escalation conventions are defined once for both cadences
  5. The stable ID scheme (EPIC/FEAT/<prefix>/ADR/NFR/RISK/REL/INC, configurable prefix) is defined, and `plans/traceability.md`, `plans/nfr-catalog.md`, and `plans/metrics.md` exist as seeded skeletons ready for roles to append to

**Plans**: 5 plansPlans:
**Wave 1**

- [x] 01-01-PLAN.md — Repository scaffold per spec §3 (additive-only directory tree + .gitkeep)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Config dial: factory.config.json (§15 lean defaults) + factory.config.md twin
- [x] 01-04-PLAN.md — State-plane skeletons: traceability.md, nfr-catalog.md, metrics.md (headers, zero rows)
- [x] 01-05-PLAN.md — agent-factory/VERSION (0.1.0) + full agent-factory/README.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — plans/board.md: 13 columns + WIP format from config + sizing/priority/Blocked conventions

### Phase 2: Shared Contracts

**Goal**: Provide the I/O contracts — handoff packet templates, gate checklists, and the memory-bank seed — as real files, so role and workflow files written later reference actual filenames and a stable universal header rather than placeholders.
**Depends on**: Phase 1
**Requirements**: HAND-01, HAND-02, CHECK-01, CHECK-02, MEM-01, MEM-02
**Success Criteria** (what must be TRUE):

  1. All core handoff templates are copy-paste usable (universal, business, product, system, architecture, implementation, qe, security-nfr, uat, ticket-ready-packet, implementation-ready-packet) and the universal header carries the Ticket ID and Trace updates fields
  2. All v2 handoff templates exist (release-handoff, incident-postmortem blameless, retro-notes, refinement-notes, sprint-plan)
  3. All ten checklists exist (definition-of-ready, definition-of-done lean, definition-of-done-enterprise superset, pr-review, security-nfr, compliance, accessibility, observability-slo, release-readiness, uat), with the lean/enterprise split clearly distinguished
  4. A minimal memory-bank exists (00-index through 80-glossary plus 50-decisions/ ADR convention), each file short, single-purpose, and small — never a document dump
  5. The memory-bank seed states the working-memory contract: roles read it on start, 60-progress.md is the running plan-of-record kept current by the daily sweep, and 50-decisions/ captures ADRs as they are made

**Plans**: 4 plans
**Wave 1** *(all 4 plans parallel — disjoint file sets, no inter-plan dependencies)*

- [x] 02-01-PLAN.md — Handoffs: universal header + 11 core templates (HAND-01)
- [x] 02-02-PLAN.md — Handoffs: 5 v2 templates — release/incident/retro/refinement/sprint-plan (HAND-02)
- [x] 02-03-PLAN.md — Checklists: 10 verbatim §9 bodies + 00-index tier grouping (CHECK-01, CHECK-02)
- [x] 02-04-PLAN.md — Memory-bank seed: 8 generic seed files + 50-decisions/ADR-template (MEM-01, MEM-02)

### Phase 3: Roles & AGENTS.md Substrate

**Goal**: Write all 16 role prompts to the fixed skeleton (Orchestrator first, defining the routing contract the others slot into) and the minimal AGENTS.md substrate that points at them, so the program and its read-order contract exist before any workflow sequences them.
**Depends on**: Phase 2
**Requirements**: ROLE-01, ROLE-02, ROLE-03, AGENTS-01, AGENTS-02
**Success Criteria** (what must be TRUE):

  1. The Orchestrator role encodes the full routing matrix and request-type classification, enforces WIP limits and Definition of Ready before pulling work, splits XL work, and carries the hard limit that it never merges a protected branch or deploys prod
  2. All 11 core role prompts exist following the standard 9-section skeleton in caveman voice, each reading config first, moving the board on column change, and appending to traceability
  3. All 5 enterprise-pack role prompts exist (release-manager, compliance-officer, incident-responder, factory-coach, installer), activating only when mode=enterprise or their trigger fires, in the same skeleton and voice
  4. Root AGENTS.md follows the §17.1 shape, is minimal and high-signal, stays under Codex's 32 KiB cap, lists real commands with flags preferring fast file-scoped variants, and marks unknown commands `UNKNOWN - verify`
  5. The AGENTS.md (and the AGENTS.md Scribe role) embed Karpathy's 12 coding-agent rules under the four principles, in clear voice (grug voice may echo them), as the default behavioral guardrails

**Plans**: 8 plans

**Wave 1**

- [x] 03-01-PLAN.md — Orchestrator role (routing contract, ROLE-03) + Wave-0 structural test harness

**Wave 2** *(blocked on Wave 1; all 6 plans parallel — disjoint role files)*

- [x] 03-02-PLAN.md — Core roles: agents-md-scribe, brownfield-mapper, greenfield-mapper (ROLE-01)
- [x] 03-03-PLAN.md — Core roles: ba-pm, system-analyst (ROLE-01)
- [x] 03-04-PLAN.md — Core roles: architect-design, software-engineer (ROLE-01)
- [x] 03-05-PLAN.md — Core roles: qe-e2e, security-nfr, uat-planner (ROLE-01)
- [x] 03-06-PLAN.md — Enterprise roles: release-manager, compliance-officer, incident-responder (ROLE-02)
- [x] 03-07-PLAN.md — Enterprise roles: factory-coach, installer (ROLE-02)

**Wave 3** *(blocked on Wave 1+2; AGENTS.md points at all roles)*

- [x] 03-08-PLAN.md — Root AGENTS.md: §17.1 substrate + 12 Karpathy rules (AGENTS-01, AGENTS-02)

### Phase 4: Workflows, Cadence & Backpressure

**Goal**: Compose the finished roles into the full lifecycle, ceremony, and enterprise workflows, make both Kanban and Scrum cadences selectable by config, and encode the bounded backpressure quality gate as deterministic steps — turning the program into a runnable delivery flow.
**Depends on**: Phase 3
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, BOARD-02, BOARD-03, GATE-01, SAFE-01
**Success Criteria** (what must be TRUE):

  1. Bootstrap and lifecycle workflows exist (00-bootstrap-greenfield, 01-bootstrap-brownfield, 02-idea-to-epics, 03-epic-to-tickets, 04-ticket-to-pr, 05-pr-quality-gate, 06-uat-pack), each producing the right board moves, handoffs, trace updates, and stop/done conditions, and every workflow file follows the v2 template
  2. The quality-gate workflow encodes the backpressure loop — prefetch → implement on branch → gate (install/lint/typecheck/unit/build/e2e from AGENTS.md) → bounded self-fix (config, default 2) → terminal result READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED — and records missing commands `UNKNOWN - verify`, never faking a pass
  3. Kanban flow works (continuous pull, WIP limits as throttle, daily-sweep reconciliation, cycle-time focus) and Scrum cadence works (time-boxed sprints with SPRINT-xx.md goal/committed/velocity/burndown and the full ceremony set), with cadence selected by config
  4. Ceremony workflows (07-backlog-refinement through 11-retro) and enterprise workflows (12-release with its approval gate, 13-incident with the blameless path) exist and route through the correct roles
  5. "Humans decide, agents execute" holds across every workflow: autonomy=pr is the default and no workflow step ever merges a protected branch or deploys to production without named human confirmation

**Plans**: 7 plans

**Wave 1** *(harness ships RED; gate single-sourced before its consumer; disjoint files)*

- [x] 04-01-PLAN.md — Wave-0 structural harness check-structure.sh (V-01..V-13, ships RED)
- [x] 04-02-PLAN.md — 05-pr-quality-gate (single-source §14 loop) + 04-ticket-to-pr (references 05)
- [x] 04-03-PLAN.md — Lifecycle: 02-idea-to-epics, 03-epic-to-tickets, 06-uat-pack

**Wave 2** *(blocked on Wave 1; disjoint files)*

- [x] 04-04-PLAN.md — Bootstrap: 00-bootstrap-greenfield, 01-bootstrap-brownfield
- [x] 04-05-PLAN.md — Scrum ceremonies: 08-sprint-planning, 10-sprint-review (cadence=scrum)
- [x] 04-06-PLAN.md — Both-cadence ceremonies: 07-backlog-refinement, 09-daily-sweep, 11-retro

**Wave 3** *(blocked on Waves 1+2; full-suite green gate)*

- [x] 04-07-PLAN.md — Enterprise: 12-release (named-human gate), 13-incident (blameless) + all-14 harness gate

### Phase 5: Packaging, Adapters, Install & Distribution

**Goal**: Bridge the finished single-source core to all five host tools via thin pointer-only adapters, ship both the standalone `.claude/` form and the versioned plugin form, provide idempotent reversible installers, and enforce prod safety mechanically with a plugin-level PreToolUse hook — resolving the two open decisions (version string; commands/ vs skills/) at the start of the phase.
**Depends on**: Phase 4
**Requirements**: PKG-01, PKG-02, CLAUDE-01, CLAUDE-02, CLAUDE-03, INSTALL-01, INSTALL-02, SAFE-02
**Success Criteria** (what must be TRUE):

  1. `packaging/adapters.md` maps each of the five tools to its entry file + dispatch mode + adapter, enforces "all work starts at orchestrator.md," states "only the dispatch differs, never the content," and flags every tool row "verify against current tool docs"; templates use the current `Agent` tool name (not the legacy `Task` alias) and a recorded commands/ vs skills/ choice
  2. The standalone `.claude/` form exists (thin per-role pointer wrappers, literal `/grug` + `/grug-<operation>` shortcuts, one-line CLAUDE.md pointer) and the plugin form exists (`.claude-plugin/plugin.json` + `marketplace.json`, `agents/`, `commands/`, `hooks/`), with both forms coexisting and component dirs at plugin root
  3. The prod-deploy guard is mechanical: a plugin-level `hooks/hooks.json` PreToolUse Bash matcher denies deploy commands absent a human-confirm flag (never subagent frontmatter, which plugin subagents silently ignore), uses `${CLAUDE_PLUGIN_ROOT}` for script paths, and blocks a sample deploy command in testing
  4. `install/install.sh` (POSIX) and `install/install.mjs` (Node) are functionally identical, idempotent, additive, dry-run-capable (DRY_RUN=1), and reversible — they detect the host tool, lay down the right adapter, print an install report, and never overwrite user content; `uninstall.sh` removes only what the installer added
  5. The Claude-only nature of the mechanical guard, the autonomy=pr prompt-level fallback for the other four tools, the chosen version string, and the "just install the markdown" minimal path are all documented

**Plans**: 5 plans

**Wave 1** *(parallel — disjoint file sets, no inter-plan dependencies)*

- [x] 05-01-PLAN.md — Packaging decisions: adapters.md (5-tool map) + 2 templates (Agent/model:inherit/skills) + Wave-0 structural harness (PKG-01, PKG-02)
- [x] 05-04-PLAN.md — SAFE-02 mechanical prod-deploy guard: hooks.json PreToolUse + pure-Node guard.mjs (fail-closed, no self-approve) + behavioral triad test (SAFE-02)

**Wave 2** *(blocked on Wave 1; disjoint file sets)*

- [x] 05-02-PLAN.md — Standalone .claude/ form: 7 dash skills + subagent wrapper + CLAUDE.md pointer + Gemini wiring (CLAUDE-01)
- [x] 05-03-PLAN.md — Plugin form: plugin.json + marketplace.json + 7 plugin-root colon skills + claude plugin validate --strict (CLAUDE-02, CLAUDE-03)

**Wave 3** *(blocked on Waves 1+2; installer wires the full artifact set)*

- [x] 05-05-PLAN.md — Installers: install.sh + install.mjs (idempotent/DRY_RUN/reversible) + uninstall.sh + install/README.md (SAFE-02 docs) (INSTALL-01, INSTALL-02, SAFE-02)
**UI hint**: yes

### Phase 6: Validation, Brand & Dogfood

**Goal**: Assert the finished structure with a validator, narrate the finished flows with examples, ship the public-facing brand and legal collateral, and prove the whole chain works by driving one ticket from idea to PR on a throwaway sample repo across both dispatch paths — the acceptance gate.
**Depends on**: Phase 5
**Requirements**: VAL-01, EX-01, BRAND-01, BRAND-02, BRAND-03, DOG-01, DOG-02
**Success Criteria** (what must be TRUE):

  1. `scripts/validate-agent-factory.mjs` checks structure (required role/workflow/handoff/checklist files and their sections), config parse (mode/cadence/autonomy), board-ticket status match, traceability completeness (flagging rows missing tests/UAT), and packaging presence — never fabricating results and never creating package.json if absent
  2. Five example runs exist (greenfield bootstrap, brownfield bootstrap, ticket→PR, a full sprint cycle with board snapshots and a velocity/metrics line, and a release run with completed traceability rows), each showing input, Orchestrator decision, and expected files/handoffs
  3. README opens in clear voice then the grug wink with the hero block, Acknowledgements crediting grugbrain.dev (Carson Gross), and the non-affiliation footer; NOTICE, CONTRIBUTING, and docs/faq.md exist from the brand manual's ready-to-paste blocks
  4. Original-art brand assets exist (brand/wordmark*.svg color/mono-dark/mono-light/icon-lockup + brand/icon.svg) using the Charcoal/Bone/Granite palette with a single Ochre accent, lowercase grugops, never resembling the children's-book character
  5. grugops is installed via `/grug` on a throwaway sample repo, bootstrapped, and one ticket is driven idea→PR end-to-end with the validator passing; the same roles/handoffs/gates are exercised over both the portable AGENTS.md sequential path and the Claude Code sub-agent spawn path, confirming "only the dispatch differs, never the content"

**Plans**: 5 plans

**Wave 1** *(parallel — disjoint file sets, no inter-plan dependencies)*

- [x] 06-01-PLAN.md — Validator: scripts/validate-agent-factory.mjs (structure-only, two-tier, --strict) + GOOD/BAD fixture self-test (VAL-01)
- [x] 06-02-PLAN.md — Brand SVGs: color/mono-dark/mono-light/lockup wordmarks + icon, palette-locked original art (BRAND-03)
- [x] 06-03-PLAN.md — Brand/legal docs: root README + NOTICE + CONTRIBUTING + docs/faq.md from the manual's blocks (BRAND-01, BRAND-02)
- [ ] 06-04-PLAN.md — Illustrative examples: 02-brownfield, 04-sprint-cycle, 05-release-run (banner-labeled) (EX-01)

**Wave 2** *(blocked on Wave 1; produces the REAL examples + runs the validator on the sample)*

- [ ] 06-05-PLAN.md — Dogfood: out-of-repo sample idea→PR + validator pass + REAL examples 01/03 + human runbook + dual-path parity (DOG-01, DOG-02, EX-01)

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

**Research flags:**

- Phase 5 (Packaging/Distribution) warrants phase-level research — per-tool conventions and Claude Code plugin format move fast; verify `claude plugin validate` output, commands/ vs skills/ behavior, and plugin-cache path resolution against current tool docs at build time. Phases 1-4 and 6 use standard, internally-defined patterns and need no additional research.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Substrate, Config & State Skeleton | 5/5 | Complete    | 2026-06-02 |
| 2. Shared Contracts | 4/4 | Complete    | 2026-06-03 |
| 3. Roles & AGENTS.md Substrate | 8/8 | Complete    | 2026-06-03 |
| 4. Workflows, Cadence & Backpressure | 7/7 | Complete    | 2026-06-03 |
| 5. Packaging, Adapters, Install & Distribution | 5/5 | Complete    | 2026-06-03 |
| 6. Validation, Brand & Dogfood | 3/5 | In Progress|  |
