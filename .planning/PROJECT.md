# grugops

## What This Is

grugops is a file-based **agent factory** for software delivery: a small kit of markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator (the "head grug") routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits.

It is lean by default and scales to enterprise governance on a single config flag. It is for solo builders who want just-enough discipline and for regulated teams who need auditable, gated, release-controlled agentic delivery. It is **not** a platform, runtime, database, queue, or hosted service — the intelligence lives in the host coding agent; grugops only supplies role, guardrail, memory, state, dial, proof, and gates.

## Core Value

A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoff packets, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. **The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.**

## Current Milestone: v1.1 Install & Distribution

**Goal:** Redesign the grugops install experience to a shared-location architecture — the kit installs once to `$GRUGOPS_HOME` (default `~/.grugops`) and any target repo gets a tiny, self-resolving footprint — fixing the dogfood pains where adapters referenced `agent-factory/…` repo-relative but the kit was never installed into the target.

**Target features:**
- Kit/state split: `$GRUGOPS_HOME` holds the read-only kit; per-repo state (`plans/`, `memory-bank/`, the project's `factory.config.json`, runtime handoffs → `plans/handoffs/`) stays in the target repo
- Path-root rewrite across ~31 role/workflow files (kit refs → `$GRUGOPS_HOME`; ~50 handoff refs → `plans/handoffs/`; ~32 config refs → repo config)
- Installer ergonomics: `--target <repo>` + interactive prompt, default copy (not symlink), `--check` doctor that verifies every referenced path resolves
- Two-root-aware validator + `install.test.sh`
- Migration path for already-installed repos (idempotent; never deletes user state)

**Design contract:** `docs/design/shared-install.md`. Eventual destination is the Claude plugin, but that does not solve path resolution by itself.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Example runs (5): greenfield bootstrap, brownfield bootstrap, ticket→PR, sprint cycle, release run — *Validated in Phase 6* (EX-01; #2/#4/#5 illustrative with honesty banner, #1/#3 REAL captures from the dogfood)
- [x] Validator script (`scripts/validate-agent-factory.mjs`): structure-only, stdlib-only, never fabricates a pass, never creates `package.json`; GOOD/BAD fixture self-test proves both paths — *Validated in Phase 6* (VAL-01)
- [x] Brand & docs collateral: README (hero + acknowledgements + non-affiliation footer), NOTICE, CONTRIBUTING, `brand/wordmark*.svg` + `brand/icon.svg`, `docs/faq.md` — *Validated in Phase 6* (BRAND-01/02/03; lowercase `grugops`, `/grugops` only, grugbrain.dev attribution + non-affiliation intact)
- [x] Dogfood validation: out-of-repo sample bootstrapped, one ticket driven idea→PR, validator passed on the result — *Validated in Phase 6* (DOG-01 met; DOG-02 sequential agent-proven half complete, live-Claude-Code-session half deferred to milestone-close UAT in `06-HUMAN-UAT.md`)

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
<!-- Example runs, validator, brand/docs collateral, and dogfood validation moved to Validated in Phase 6. -->
<!-- NOTE: The remaining Active items above were built across Phases 1–5; the v1.0 milestone is now complete. Run /gsd-complete-milestone for the full milestone review and archival, which reconciles this list. -->

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
| **[Phase 2]** Handoff duplicate headers: fix derived `business-handoff.md`; accept `product-handoff.md` + `implementation-handoff.md` as-is | A2 (inline universal header) + D-08 (verbatim §5.A body) intentionally collide on `## Scope`/`## Risks`; the two spec-verbatim files cannot be disambiguated without breaking a locked decision. **Phase 3 role authors and the Phase 6 validator must treat the universal-header `## Scope`/`## Risks` as authoritative and tolerate the duplicate §5.A body sections in those two files.** | ✓ Resolved (Phase 2) |

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
*Last updated: 2026-06-06 — **Milestone v1.1 (Install & Distribution) started.** Goal: shared-location install — kit to `$GRUGOPS_HOME`, per-repo state (incl. runtime handoffs → `plans/handoffs/`), installer `--target` + copy-default + `--check` doctor, two-root-aware validator, and a migration path. Design contract: `docs/design/shared-install.md` (surfaced by the DOG-02 dogfood). NOTE: v1.0's Active requirement checkboxes above were not reconciled via `/gsd-complete-milestone` — run it to archive v1.0 cleanly.*

*Last updated: 2026-06-04 — Phase 6 (Validation, Brand & Dogfood) complete — **v1.0 milestone built (6/6 phases)**. Shipped the structure-only Node validator `scripts/validate-agent-factory.mjs` (stdlib-only, read-only, never fabricates a pass, never creates `package.json`) with a GOOD/BAD fixture self-test proving both pass and fail paths (VAL-01). Five original-art, palette-locked brand SVGs (wordmark + mono-dark/light + lockup + icon, BRAND-03) and the brand/legal collateral — README, NOTICE, CONTRIBUTING, `docs/faq.md` — with grugbrain.dev/Carson Gross attribution + non-affiliation intact and the systematic `/grug`→`/grugops` reconciliation (BRAND-01/02). Five example runs (EX-01): #2/#4/#5 illustrative with the honesty banner, #1/#3 REAL captures from the dogfood. The hybrid dogfood (DOG-01/02) ran the agent-proven sequential path on an out-of-repo TS/Node+Fastify sample — bootstrap → ticket ABC-001 idea→PR → gate verdict `READY_FOR_HUMAN_REVIEW` → validator passed on the sample tree (DOG-01). The live-Claude-Code-session half of DOG-02 (D-31 plugin-cache pointer resolution, SAFE-02 live hook firing, CC sub-agent spawn parity) was **deliberately deferred** by the user at the `checkpoint:human-verify` gate to milestone-close UAT — tracked in `docs/dogfood-human-runbook.md` + `06-HUMAN-UAT.md`, marked `pending human`, never fabricated (the honest agent-proven/human-pending split is the design). Code review found 1 Critical (`JSON.parse(null)` crash on unreadable `plugin.json`) + 4 Warnings (lint/build example honesty contradiction, weak column self-test, prefix-match laxity, real name as illustrative deploy approver) — all fixed atomically and re-proven (validator self-test ALL CHECKS PASSED; exits 0 bare + --strict). Regression harnesses `guard.test.sh`, `install.test.sh`, and Phase-4 `check-structure.sh` all PASS. Verification: 6/7 must-haves verified, status human_needed (the single open item is the deferred DOG-02 live-CC half). Next: `/gsd-complete-milestone` for the full v1.0 review + archival.*

*Phase 5 history — Phase 5 (Packaging, Adapters, Install & Distribution) complete: the single-source core is now bridged to all five host tools via pointer-only adapters. `agent-factory/packaging/adapters.md` maps each tool to entry/dispatch/adapter/verify and restates "only the dispatch differs, never the content" (PKG-01); the `Agent`-based subagent + skill templates are recorded (PKG-02). Both Claude forms ship and coexist: the standalone `.claude/` form is seven dash skills `/grugops` + `/grugops-<op>` plus a subagent wrapper, an additive one-line CLAUDE.md sentinel pointer, and Gemini `context.fileName` wiring (CLAUDE-01); the versioned plugin form is `.claude-plugin/{plugin.json,marketplace.json}` (name `grugops`, version `0.1.0` mirroring `agent-factory/VERSION` — D-28) with seven plugin-root `skills/<op>/SKILL.md` colon-form commands `/grugops:<op>` (CLAUDE-02/03, `claude plugin validate --strict` passes). Two open decisions resolved at phase start: version string `0.1.0` (D-28) and skills/ over commands/ (D-29). SAFE-02 is mechanical: a plugin-level `hooks/hooks.json` PreToolUse Bash matcher + pure-Node `hooks/guard.mjs` that denies prod-deploy commands absent a human-set `GRUGOPS_PROD_DEPLOY_APPROVED`, refuses inline self-approval, and fails closed. Installers `install/install.sh` (POSIX) + `install/install.mjs` (Node) are functionally identical, idempotent, additive, `DRY_RUN=1`-capable, reversible (symlink+copy-fallback D-30), never overwrite user content; `uninstall.sh` removes only what was added. Verified 5/5 must-haves; structural harness `check-structure.sh`, `hooks/guard.test.sh` (26/26), and `install/install.test.sh` (13/13) all PASS. Code review found 1 BLOCKER (uninstall deleting a user-owned `AGENTS.md` symlink) + 6 warnings (guard missed `kubectl delete`/force-push/`*publish`, greedy false-denies, sh/mjs parity, detect precedence, sentinel collision, matcher-scope docs) — all fixed and re-proven (05-REVIEW-FIX.md, all_fixed). Two acceptance items deferred to live Phase-6 dogfood (DOG-01/02): plugin-cache pointer resolution (D-31) and live PreToolUse hook firing, tracked in 05-HUMAN-UAT.md. Requirements remain hypotheses pending the Phase 6 dogfood.*
