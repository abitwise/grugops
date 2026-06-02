# grugops

## What This Is

grugops is a file-based **agent factory** for software delivery: a small kit of markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator (the "head grug") routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits.

It is lean by default and scales to enterprise governance on a single config flag. It is for solo builders who want just-enough discipline and for regulated teams who need auditable, gated, release-controlled agentic delivery. It is **not** a platform, runtime, database, queue, or hosted service — the intelligence lives in the host coding agent; grugops only supplies role, guardrail, memory, state, dial, proof, and gates.

## Core Value

A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoff packets, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. **The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.**

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — greenfield; ship to validate)

### Active

<!-- Current scope: build the full v2 spec (enterprise + plugin edition) in this milestone. All hypotheses until shipped and dogfooded. -->

- [ ] Repository structure per spec §3 (`agent-factory/`, `plans/`, `memory-bank/`, `install/`, `.claude-plugin/`, root `AGENTS.md`)
- [ ] Config dial: `factory.config.json` + human-readable `factory.config.md`; factory runs lean with zero config, honors config in every role
- [ ] Core role prompts (11): orchestrator, agents-md-scribe, brownfield-mapper, greenfield-mapper, ba-pm, system-analyst, architect-design, software-engineer, qe-e2e, security-nfr, uat-planner
- [ ] Enterprise-pack roles (5): release-manager, compliance-officer, incident-responder, factory-coach, installer
- [ ] Lifecycle + bootstrap workflows: greenfield/brownfield bootstrap, idea→epics, epic→tickets, ticket→PR, PR quality gate, UAT pack
- [ ] Ceremony workflows: backlog refinement, sprint planning, daily sweep, sprint review, retro (Kanban flow + Scrum cadence both selectable by config)
- [ ] Enterprise workflows: release (12) and incident (13)
- [ ] Handoff templates (universal + per-role + ticket-ready/implementation-ready + v2: release, incident-postmortem, retro-notes, refinement-notes, sprint-plan)
- [ ] Checklists: definition-of-ready, definition-of-done (lean), definition-of-done-enterprise (superset), pr-review, security-nfr, compliance, accessibility, observability-slo, release-readiness, uat
- [ ] Delivery OS state files: `plans/board.md` (WIP-limited columns), `plans/traceability.md` (requirement→ticket→code→test→UAT→release), `plans/nfr-catalog.md`, `plans/metrics.md`, sprint + release file formats
- [ ] Stable ID schemes (EPIC/FEAT/ABC/ADR/NFR/RISK/REL/INC) with configurable prefix
- [ ] CI/CD backpressure model: deterministic prefetch → implement on branch → gate (install/lint/typecheck/unit/build/e2e) → bounded self-fix (default 2) → result (READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED)
- [ ] Root `AGENTS.md` substrate: minimal, high-signal, points to roles/workflows/handoffs/checklists; embeds **Andrej Karpathy's 12 coding-agent rules** (Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution) as default behavioral guardrails; Commands section uses real commands with flags, preferring fast file-scoped variants; unknown commands marked `UNKNOWN - verify`, never faked
- [ ] Per-tool adapters + `agent-factory/packaging/` (adapters.md map, subagent frontmatter template, slash-command template) for Claude Code, Codex, Gemini, OpenCode, Copilot — only dispatch differs, never content
- [ ] Standalone `.claude/` form: thin sub-agent wrappers, `/grug` command(s), one-line CLAUDE.md pointer
- [ ] Claude Code plugin form: `.claude-plugin/plugin.json` + `marketplace.json`, `agents/`, `commands/`, optional hooks (e.g. PreToolUse guard blocking prod deploy)
- [ ] Install scripts: `install/install.sh` (POSIX) + `install/install.mjs` (Node) — idempotent, additive, dry-run-capable, reversible; `uninstall.sh`; "just install the markdown" minimal path documented
- [ ] **Minimal** memory-bank that is the kit's persistent agent-maintained store for state, plans, and project info (index, project-brief, product, architecture, contributing, decisions/ ADRs, progress, runbook, glossary) — kept as small as possible; roles read it on start and update `60-progress.md`/`50-decisions/` as work progresses
- [ ] Example runs (5): greenfield bootstrap, brownfield bootstrap, ticket→PR, sprint cycle, release run
- [ ] Validator script (`scripts/validate-agent-factory.mjs`): structure check for required files, role/workflow section presence, config parse, board/ticket status match, traceability completeness, packaging presence
- [ ] Brand & docs collateral: README (hero + acknowledgements + non-affiliation footer), NOTICE, CONTRIBUTING (contributor art/legal rules), `brand/wordmark*.svg` + `brand/icon.svg`, `docs/faq.md`
- [ ] Dogfood validation: install grugops via `/grug` on a throwaway sample repo, bootstrap it, and take one ticket from idea to a PR end-to-end

### Out of Scope

<!-- Explicit boundaries with reasoning, from spec §4 + brand §2.6/§10. -->

- Web UI, dashboards, or SaaS platform — grugops is a file-and-prompt kit, not a platform; staying file-based is the whole point
- A database, queue, or custom LLM runtime — intelligence lives in the host coding agent; keep it boring, nothing to operate
- Autonomous background workers that act without human approval — humans decide, agents execute
- An agent marketplace beyond the single-plugin catalog — out of scope to avoid building a platform
- Auto-merge to protected branches or auto-deploy to production — safety must be mechanical, never crossed
- Any mascot/art that resembles or implies a tie to the "Grug" children's-book character — separate IP; original art only, non-affiliation maintained

## Context

- **Greenfield repo.** Only source material present is `docs/initial/agent_factory_builder_spec_v2.md` (the technical spec, the contract for *what* to build) and `docs/initial/grugops_brand_manual.md` (brand, voice, visual identity, ready-to-paste collateral, legal positioning). Git is already initialized at the worktree root.
- **The build artifact is almost entirely markdown**, plus two functionally-identical install scripts (`install.sh` POSIX, `install.mjs` Node) and one optional Node validator. There is no application runtime to build.
- **The default stack grugops *recommends to its users*** (greenfield-mapper default) is TypeScript / Node.js+Fastify / Vue / PostgreSQL / Playwright / Docker / Kubernetes-ready — but grugops itself ships no such stack; it is markdown + scripts.
- **Fast-moving conventions.** Claude Code plugin format, the `AGENTS.md` cross-tool standard, and slash-command auto-namespacing change quickly; the spec repeatedly flags "verify against current tool docs." Up-front research is worthwhile.
- **Lineage & legal.** Named for the Grug Brained Developer philosophy (grugbrain.dev, by Carson Gross). Independent project; explicitly **not affiliated** with the "Grug" children's books by Ted Prior. Attribution + non-affiliation blocks must ship in README/NOTICE.
- **Two voices.** grug voice (short, lowercase, present tense, third-person grug, name-the-complexity-demon) for role prompts / mascot / playful copy; clear, professional English for the README opener, pitch, docs, security, compliance, and all legal text.

## Constraints

- **Tech stack**: Markdown for everything except installers (`install.sh` POSIX + `install.mjs` Node) and one optional Node validator — Why: boring on purpose; the host coding agent is the runtime
- **Safety (hard)**: Agents never merge a protected branch and never deploy to production without named human confirmation; prefer enforcing this *mechanically* (e.g. a Claude Code PreToolUse hook) not just by prompt — Why: "humans decide, agents execute" must be more than words; an agent cannot be held accountable
- **Single-source**: Role text lives once; per-tool adapters are thin pointers, never copies — Why: avoid drift across five tools
- **Zero-config first**: Every role must honor `factory.config.json` when present and run lean with sensible defaults when absent — Why: don't tax solo users; don't let enterprise users skip a gate
- **Voice discipline**: Caveman voice in every role prompt; clear voice in security findings, compliance, money, and disclaimers — Why: the joke earns trust, it never replaces the explanation or muddies a safety topic
- **Installers**: Idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content — Why: installing must be safe to re-run and undo
- **No fabrication**: Unknown commands are marked `UNKNOWN - verify`; never fake a passing gate, a test result, or a citation — Why: the trace is the proof
- **Minimal AGENTS.md**: Keep the substrate short and high-signal; push detail into the files it points to — Why: long machine-written context files measurably lower agent success and raise cost
- **Brand**: Always lowercase `grugops`; `/grug` command shape; original art only; keep grugbrain.dev attribution and the non-affiliation disclaimer visible — Why: brand consistency + IP safety

## Key Decisions

<!-- Decisions that constrain future work. Add throughout the project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build the **full v2 spec** (core + enterprise pack) in this milestone, not lean-first | User wants the complete enterprise + plugin edition now | — Pending |
| Ship **both** distribution forms: standalone `.claude/` and the plugin + marketplace | Fast iteration AND versioned, shareable distribution | — Pending |
| **Include brand/docs collateral** (README, NOTICE, CONTRIBUTING, wordmark/icon SVGs, FAQ) in this milestone | Public repo; the collateral is already written in the brand manual | — Pending |
| Validate via **dogfood + validator**: run `/grug` on a sample repo to take a ticket idea→PR | Prove the kit works end-to-end; matches spec acceptance criteria (§20) | — Pending |
| Default recommended stack: TS / Node-Fastify / Vue / Postgres / Playwright / Docker / K8s-ready | Spec greenfield-mapper default for grugops's *users* | — Pending |
| Enforce prod-safety mechanically where possible (Claude Code hook blocks deploy) | "Humans decide, agents execute" must be a guardrail, not a hope | — Pending |
| Markdown-only kit; no runtime, DB, or queue | Boring on purpose; intelligence lives in the host agent | — Pending |
| Memory-bank is the minimal agent-maintained state/plans store | User-requested completeness; same anti-bloat rule as AGENTS.md | — Pending |
| Best-practices AGENTS.md embeds Karpathy's 12 coding-agent rules + agents.md-standard commands (file-scoped) | User-requested; the 12 rules operationalize the grug philosophy (simple, surgical, think-first, goal-driven) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-02 after initialization*
