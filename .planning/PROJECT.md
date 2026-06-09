# grugops

## What This Is

grugops is a file-based **agent factory** for software delivery: a small kit of markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator (the "head grug") routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits.

It is lean by default and scales to enterprise governance on a single config flag. It is for solo builders who want just-enough discipline and for regulated teams who need auditable, gated, release-controlled agentic delivery. It is **not** a platform, runtime, database, queue, or hosted service — the intelligence lives in the host coding agent; grugops only supplies role, guardrail, memory, state, dial, proof, and gates.

## Core Value

A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoff packets, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy. **The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.**

## Current State

**Shipped through v1.1 Install & Distribution (2026-06-08).** Two milestones are complete:

- **v1.0 MVP — Full Agent Factory v2** (phases 1–6, 34 plans, shipped 2026-06-04): the complete spec — 16 role prompts, 14 workflows with dual cadence + the bounded backpressure gate, shared I/O contracts, per-tool adapters for all five host CLIs, both Claude distribution forms, idempotent installers, a mechanical prod-deploy hook, the structure validator, brand/legal collateral, and an end-to-end idea→PR dogfood.
- **v1.1 Install & Distribution** (phases 7–9, 14 plans, shipped 2026-06-08): the shared-location, two-root install — the read-only kit installs once to `${GRUGOPS_HOME:-$HOME/.grugops}`; per-repo state (`.grugops/`, `plans/`, `memory-bank/`) stays in the target; ~31 files rewritten to resolve kit-vs-state correctly (grep-to-zero gate); two-root installer (materializes the absolute kit path, seeds state without clobbering); `--check` doctor + two-root validator that refuses to false-green.

The whole kit is **boring on purpose**: ~77 markdown files under `agent-factory/` plus two byte-parity install scripts (`install.sh` POSIX, `install.mjs` Node) and one stdlib-only Node validator. No runtime, DB, or queue — the intelligence lives in the host coding agent.

## Current Milestone: v1.2 SDLC Depth, Quality Discipline & Browsable Docs

**Goal:** Make grugops's delivery lifecycle senior-grade and trustworthy end-to-end — deeper personas with full SDLC coverage (especially the business→engineer handoff), test-first by default, automated UI build+test, security auditing, an un-cheatable quality gate, linting, and browsable docs — and finally ship the deferred install migrate/update story.

This is a largely **introspective** milestone: most work improves grugops's own kit (persona text, workflows, the gate, docs), not an external app. "UI / tests / security" are capabilities grugops gives its *users* through roles + workflows + the gate, since grugops itself is markdown. The automation principle "**bug the user as little as needed**" threads through the UI + test flows — sensible defaults, fewer human checkpoints, stop only at genuine decision/safety gates. The merge/deploy hard limit (humans decide) is unchanged.

**Target features:**
- **SDLC coverage audit & gap-fix** — review every role/workflow for lifecycle completeness; close the business→engineer gaps (this milestone opens with the audit, which informs the rest)
- **Senior-level persona overhaul** — rewrite all personas to experienced/senior; deepen business-analysis personas + workflows
- **Test-first baked in** — BDD given-when-then at acceptance/UAT (the business→engineer contract) + TDD red-green at the unit layer; depth dialed via `factory.config`
- **UI build flow** — a senior frontend/UI persona + a UI design→build workflow
- **Automated UI/E2E testing** — Playwright-based visual + E2E in the quality gate, automated to minimize human stops
- **Security auditing (OWASP ASVS, dialed)** — a security-audit workflow + checklist anchored to ASVS (L1 lean → L2/L3 enterprise)
- **Test-integrity gate** — block unjustified skipped tests; explicit documented-justification escape hatch; never fake a pass
- **Code linting practice** — a lint step in the gate + per-stack linter recommendations
- **Browsable docs catalog** — generated in-repo markdown reference of every agent + workflow (no web UI — stays inside the boundary)
- **Install migrate/update** — `install.sh --migrate` (MIGR-01) + `install.sh --update` (UPD-01), folded in from the queued v1.2 story

**Beyond v1.2 (candidates, not in scope):** per-repo kit-version pin + skew warning (SKEW-01), doctor `--fix` (FIX-01), plugin-form path resolution / publishing grugops as a Claude Code plugin (PLUGIN-01). Carried v1.1 tech-debt (Nyquist formal validation ×3, the WR-05 packaging-template regeneration hazard, `check-kit-refs.sh` hardening — see `milestones/v1.1-MILESTONE-AUDIT.md`) is a candidate to fold in where it overlaps with the gate/persona work.

**Design contract for the install line:** `docs/design/shared-install.md`.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Grouped by theme; per-requirement detail lives in milestones/v1.0-REQUIREMENTS.md and v1.1-REQUIREMENTS.md. -->

**v1.0 — Full Agent Factory v2 (shipped 2026-06-04):**

- ✓ Repository scaffold + zero-config dial (`factory.config.json` + `factory.config.md` twin; lean defaults) — v1.0 (STRUCT-01/02, CONFIG-01/02/03)
- ✓ All 16 role prompts (Orchestrator + 10 core + 5 enterprise) on the fixed 9-section skeleton; Orchestrator owns the routing matrix, WIP/DoR gate, XL-split, never-merge/never-deploy hard limit — v1.0 (ROLE-01/02/03)
- ✓ 14-workflow suite — lifecycle + bootstrap + ceremonies (dual Kanban/Scrum cadence) + enterprise release/incident; single-source §14 backpressure quality gate — v1.0 (FLOW-01..05, BOARD-02/03, GATE-01, SAFE-01)
- ✓ Shared I/O contracts — handoff templates (core + v2) + 10 checklists (lean/enterprise tiers) + minimal agent-maintained memory-bank — v1.0 (HAND-01/02, CHECK-01/02, MEM-01/02)
- ✓ Delivery OS state plane — WIP-limited board, traceability, NFR catalog, metrics; stable ID schemes with configurable prefix — v1.0 (BOARD-01/04, TRACE-01/02, NFR-01, METRIC-01)
- ✓ Minimal §17.1 `AGENTS.md` embedding Karpathy's 12 coding-agent rules; real commands with flags, `UNKNOWN - verify` never faked — v1.0 (AGENTS-01/02)
- ✓ Per-tool adapters (all five host CLIs) + both Claude forms (standalone `.claude/` + versioned plugin); only dispatch differs, never content — v1.0 (PKG-01/02, CLAUDE-01/02/03)
- ✓ Mechanical prod-deploy guard — pure-Node plugin-level PreToolUse hook, denies absent human-set approval, refuses self-set, fails closed — v1.0 (SAFE-02)
- ✓ Structure validator (stdlib-only, never fabricates a pass), 5 example runs, brand/legal collateral (README + NOTICE + CONTRIBUTING + FAQ + original-art SVGs) — v1.0 (VAL-01, EX-01, BRAND-01/02/03)
- ✓ End-to-end idea→PR dogfood on an out-of-repo sample; validator passed — v1.0 (DOG-01; **DOG-02 partial** — sequential path proven, live-Claude-Code half deferred, see STATE.md Deferred Items)

**v1.1 — Install & Distribution (shipped 2026-06-08):**

- ✓ Shared-location, two-root architecture — read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state under `.grugops/`/`plans/`/`memory-bank/`; ~31 files rewritten to resolve kit-vs-state correctly (grep-to-zero gate) — v1.1 (SHOME-01/02/03/04)
- ✓ Two-root installer at sh/Node byte-parity — `--target`/`--yes`/non-TTY, copy-default, atomic kit copy, materialized absolute kit path in the adapters, state seed without clobbering; two-root uninstall preserves seeded state + shared kit — v1.1 (INSTALL-03/04)
- ✓ `--check` doctor (sh + byte-parity Node) — non-mutating, three-source kit-root cross-check, deterministic first-failure with referencing file, WARN tier, full exit-code matrix — v1.1 (INSTALL-05)
- ✓ Two-root-aware validator with NO `.` fallback — refuses to false-green in the dev checkout or with `$GRUGOPS_HOME` unset (C3 guard); three-way resolution-parity assertion — v1.1 (VAL-02)

### Active

<!-- v1.2 requirements are being defined this milestone; canonical per-requirement detail + REQ-IDs live in REQUIREMENTS.md and are mapped to phases by the roadmap. -->

_v1.2 "SDLC Depth, Quality Discipline & Browsable Docs" — requirements defined in `REQUIREMENTS.md`. Themes: SDLC-coverage audit, senior persona overhaul, BDD+TDD (config-dialed), UI build flow, automated UI/E2E testing, security auditing (OWASP ASVS, dialed), test-integrity gate, code linting, browsable docs catalog, install migrate/update (MIGR-01/UPD-01)._

### Out of Scope

<!-- Explicit boundaries with reasoning, from spec §4 + brand §2.6/§10. -->

- Web UI, dashboards, or SaaS platform — grugops is a file-and-prompt kit, not a platform; staying file-based is the whole point
- A database, queue, or custom LLM runtime — intelligence lives in the host coding agent; keep it boring, nothing to operate
- Autonomous background workers that act without human approval — humans decide, agents execute
- An agent marketplace beyond the single-plugin catalog — out of scope to avoid building a platform
- Auto-merge to protected branches or auto-deploy to production — safety must be mechanical, never crossed
- Any mascot/art that resembles or implies a tie to the "Grug" children's-book character — separate IP; original art only, non-affiliation maintained
- *(v1.1)* Background auto-update of the central kit — surprise mutation; `--update` is explicit and human-run
- *(v1.1)* Symlink-overlay install / per-repo kit vendoring — the rejected alternatives; copy to `$GRUGOPS_HOME` is the chosen model
- *(v1.1)* TUI/wizard installer, global `$PATH` binary, telemetry — keep it boring: sh + Node stdlib, no daemon, no data collection
- *(v1.1)* Doctor that auto-fixes user content — `--check` reports and names; it never edits the user's repo
- *(v1.1)* XDG base-dir split (`$XDG_DATA_HOME` etc.) — peer tools reject it; one `$GRUGOPS_HOME` is simpler and cross-platform

## Context

- **Two milestones shipped.** Began greenfield from `docs/initial/agent_factory_builder_spec_v2.md` (the *what*-to-build contract) and `docs/initial/grugops_brand_manual.md` (brand/voice/visual identity/legal). v1.0 built the full v2 spec; v1.1 redesigned the install to the shared-location two-root model. Current state: ~77 markdown files under `agent-factory/`, ~718 tracked files total, ~500 commits. The kit is licensed MIT and carries public brand/legal collateral.
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
| Build the **full v2 spec** (core + enterprise pack) in this milestone, not lean-first | User wants the complete enterprise + plugin edition now | ✓ Good — full v2 spec shipped in v1.0 (6 phases, 34 plans) |
| Ship **both** distribution forms: standalone `.claude/` and the plugin + marketplace | Fast iteration AND versioned, shareable distribution | ✓ Good — both forms ship and coexist (CLAUDE-01/02/03) |
| **Include brand/docs collateral** (README, NOTICE, CONTRIBUTING, wordmark/icon SVGs, FAQ) in this milestone | Public repo; the collateral is already written in the brand manual | ✓ Good — full public collateral shipped (BRAND-01/02/03) |
| Validate via **dogfood + validator**: run `/grug` on a sample repo to take a ticket idea→PR | Prove the kit works end-to-end; matches spec acceptance criteria (§20) | ✓ Good — DOG-01 met; the dogfood surfaced the install pains that became all of v1.1. DOG-02 live-CC half still pending human |
| Default recommended stack: TS / Node-Fastify / Vue / Postgres / Playwright / Docker / K8s-ready | Spec greenfield-mapper default for grugops's *users* | ✓ Good — exercised in the v1.0 dogfood (TS/Node+Fastify sample) |
| Enforce prod-safety mechanically where possible (Claude Code hook blocks deploy) | "Humans decide, agents execute" must be a guardrail, not a hope | ✓ Good — pure-Node PreToolUse guard ships; live firing pending human (Deferred Items) |
| Markdown-only kit; no runtime, DB, or queue | Boring on purpose; intelligence lives in the host agent | ✓ Good — held across both milestones |
| Memory-bank is the minimal agent-maintained state/plans store | User-requested completeness; same anti-bloat rule as AGENTS.md | ✓ Good — shipped minimal (MEM-01/02) |
| Best-practices AGENTS.md embeds Karpathy's 12 coding-agent rules + agents.md-standard commands (file-scoped) | User-requested; the 12 rules operationalize the grug philosophy | ✓ Good — single-source in AGENTS.md (AGENTS-02) |
| **[Phase 2]** Handoff duplicate headers: fix derived `business-handoff.md`; accept `product-handoff.md` + `implementation-handoff.md` as-is | A2 (inline universal header) + D-08 (verbatim §5.A body) intentionally collide on `## Scope`/`## Risks`; treat the universal-header sections as authoritative and tolerate the duplicate §5.A bodies in those two files | ✓ Resolved (Phase 2) |
| **[v1.1]** Kit home `${GRUGOPS_HOME:-$HOME/.grugops}` — NOT XDG, NOT literal `~`; default **COPY** not symlink | Peer tools reject XDG; copy is robust; the env-var form resolves identically in sh + Node | ✓ Good — SHOME-01, installer copy-default (INSTALL-04) |
| **[v1.1]** Per-repo config at `.grugops/factory.config.json` (marker/version stamp in `.grugops/`) | Supersedes the older repo-root recommendation; clean kit/state split | ✓ Good — SHOME-02; 32 config refs resolve here |
| **[v1.1]** Installer **materializes** the absolute kit path into the standalone adapters | An LLM can't expand `$GRUGOPS_HOME` in prose; one one-line bash self-heal fallback is the only env-var reference | ✓ Good — SHOME-04; sole resolver confined to 3 legal sites |
| **[v1.1]** Single-window sequential role-load (`_role-switch-protocol.md`); packaging templates grant **NO** spawn tool | The kit is portable across 5 CLIs; sub-agent nesting isn't available everywhere | ✓ Good (D-08) — ⚠️ Revisit: the templates still carry `Agent`/"spawn" prose (WR-05 regeneration hazard, tech debt) |
| **[v1.1, D-28/D-29]** Version `0.1.0` (brand-new public tool); `skills/` over `commands/` for the plugin | Brand-new public release; skills are the forward path | ✓ Good — shipped in v1.0 packaging |

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
*Last updated: 2026-06-09 — **Milestone v1.2 "SDLC Depth, Quality Discipline & Browsable Docs" started.** Goal: make grugops's lifecycle senior-grade and trustworthy end-to-end. Scope (10 themes): SDLC-coverage audit + business→engineer gap-fix, senior persona overhaul (incl. deeper BA personas/workflows), test-first baked in (BDD at acceptance + TDD at unit, config-dialed), a senior frontend/UI persona + UI design→build workflow, automated Playwright UI/E2E in the gate, security auditing anchored to OWASP ASVS (L1 lean → L2/L3 enterprise, dialed), a test-integrity gate that blocks unjustified skipped tests (no fabrication), a lint step + per-stack linter recommendations, a browsable in-repo markdown docs catalog of all agents+workflows, and the deferred install migrate/update story (MIGR-01 `--migrate` + UPD-01 `--update`, folded in per user). Automation principle: "bug the user as little as needed" — fewer human checkpoints, defaults over prompts, stop only at real decision/safety gates; merge/deploy hard limit unchanged. Milestone label held at v1.2 (user: "first useful version"); artifact SemVer stays 0.1.0 (D-28). Phase numbering continues from v1.1 (last phase 9). Next: research decision → requirements → roadmap.*

*Last updated: 2026-06-08 after v1.1 milestone — **Milestone v1.1 "Install & Distribution" complete and archived** (phases 7–9, 14 plans; audit `tech_debt`, 8/8 requirements satisfied, no blockers). v1.0 was also archived retroactively (it was never formally closed). Both milestones now live in `.planning/milestones/` (v1.0/v1.1 ROADMAP + REQUIREMENTS, v1.1 audit); `ROADMAP.md` collapsed to milestone groupings; `REQUIREMENTS.md` reset for the next milestone; tags `v1.0` + `v1.1` created. 7 v1.0-era open artifacts (DOG-02 live-CC dogfood + a stale quick-task marker) acknowledged and deferred — see STATE.md Deferred Items. Carried tech debt: Nyquist formal validation ×3, the WR-05 packaging-template regeneration hazard, `check-kit-refs.sh` hardening (WR-01..04). Next: `/gsd-new-milestone` for v1.2 (MIGR-01 migrate + UPD-01 update).*

*Last updated: 2026-06-07 — Phase 8 (Two-Root Installer) complete (4/4 plans, verification 5/5; INSTALL-03 + INSTALL-04 validated). **The installer now fixes all three dogfood pains (DOG-02).** `install/install.sh` (POSIX behavioral spec) + `install/install.mjs` (byte-parity Node twin) resolve `${GRUGOPS_HOME:-$HOME/.grugops}` (Node via `os.homedir()`), atomically copy the read-only kit there, materialize the resolved ABSOLUTE kit path into exactly the two standalone adapters, and seed the per-repo state plane (`.grugops/factory.config.json`, install marker, `plans/**` incl. `plans/handoffs/`, `memory-bank/**`) skip-if-exists — never clobbering user content. Default mode flipped to COPY (symlink opt-in); `--target <repo>` from any CWD + confirm prompt with `--yes`/non-TTY bypass; always-on D-07 self-checkout guard (refuse-by-default, `--allow-self` override). 08-01 carry-forward: dropped the `Agent` spawn grant from both packaging templates (WR-05/D-08), corrected stale config-path prose (IN-01/D-09), bundled `agent-factory/seed/**` (D-01/D-02) excluded from `check-kit-refs.sh` (D-03). 08-02 shipped the RED-by-design harness `install/install.two-root.test.sh`. 08-04 D-06 uninstall removes only adapters + wiring + the `.grugops/install.json` marker — never the shared `$GRUGOPS_HOME` kit nor seeded state. **Human-approved reconciliation:** the "frozen" `install.test.sh` Check 3 (byte-restore on uninstall) was structurally incompatible with the two-root seed model, so a single-check slice of Phase-9 VAL-02 was pulled forward — only Check 3 was rewritten to the D-06 contract (grugops-owned removed, seeded user state survives); the other 6 checks stay byte-identical. Code review found **2 Critical + 4 Warning** — CR-01 (unbounded sentinel/marker strip could delete user content past an unterminated open marker, in `uninstall.sh` + both installers' materialize logic) and CR-02 (`uninstall.sh` ignored its own documented `--target`, operating on `$(pwd)`) — both empirical hard-constraint violations, **all 6 fixed atomically and re-proven**; 2 Info (IN-01 CRLF-in-marker, IN-02 seed board WIP ref) left out-of-scope, non-blocking. All three harnesses GREEN: `install.test.sh`, `install.two-root.test.sh` (18/18 incl. sh/Node byte-parity), `check-kit-refs.sh`. Next: `/gsd-discuss-phase 9` or `/gsd-plan-phase 9` (Doctor & Two-Root Validator).*

*Last updated: 2026-06-06 — Phase 7 (Shared-Home Foundation & Path Rewrite) complete (4/4 plans, verification 5/5). **The kit/state split convention is frozen and the whole kit rewritten to it.** A canonical `## Kit vs state` rule in `AGENTS.md` plus a byte-identical "Kit vs state invariant" marker at four canonical sites (AGENTS.md, `agent-factory/roles/orchestrator.md`, `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`); the sole resolver is the `${GRUGOPS_HOME:-$HOME/.grugops}` self-heal + STOP-on-absence, confined to exactly three legal sites (the two `.claude` adapters + `agent-factory/packaging/subagent.frontmatter.md`). The bulk rewrite (07-02 roles+op-skills, 07-03 14 workflows): every config ref → `.grugops/factory.config.json` (`#field` anchors preserved); handoffs split into TEMPLATE reads (bare `agent-factory/handoffs/`, KIT) vs runtime INSTANCE writes (`plans/handoffs/<ID>-<stage>.md`, STATE), with frozen `<stage>` tokens; `_role-switch-protocol.md` step-4 template-read-vs-instance-write split in place. The mechanical proof is `scripts/check-kit-refs.sh` (SHOME-03) — POSIX, read-only, ships GREEN: zero `agent-factory/config/` refs, handoff-allowlist, no `$GRUGOPS_HOME` in prose, invariant marker present — with a fail-on-mutation proof. SHOME-01..04 complete. Regression harnesses (`guard.test.sh`, `validate.test.sh`, `install.test.sh`) + the structural validator all PASS. Code review: 0 Critical / 5 Warning / 2 Info — none blocking; two carry forward to Phase 8: WR-05 (the two packaging **templates** still grant the `Agent` spawn tool, a regeneration hazard contradicting the no-spawn rule) and IN-01 (`agent-factory/README.md` + `factory.config.md` still carry the old config path — deliberately deferred to Phase 8 per RESEARCH.md O2). Plus four latent gate-robustness items (WR-01..04, false-green channels not currently triggered). Next: `/gsd-discuss-phase 8` (Two-Root Installer).*

*Last updated: 2026-06-06 — **Milestone v1.1 (Install & Distribution) started.** Goal: shared-location install — kit to `$GRUGOPS_HOME`, per-repo state (incl. runtime handoffs → `plans/handoffs/`), installer `--target` + copy-default + `--check` doctor, two-root-aware validator, and a migration path. Design contract: `docs/design/shared-install.md` (surfaced by the DOG-02 dogfood). NOTE: v1.0's Active requirement checkboxes above were not reconciled via `/gsd-complete-milestone` — run it to archive v1.0 cleanly.*

*Last updated: 2026-06-04 — Phase 6 (Validation, Brand & Dogfood) complete — **v1.0 milestone built (6/6 phases)**. Shipped the structure-only Node validator `scripts/validate-agent-factory.mjs` (stdlib-only, read-only, never fabricates a pass, never creates `package.json`) with a GOOD/BAD fixture self-test proving both pass and fail paths (VAL-01). Five original-art, palette-locked brand SVGs (wordmark + mono-dark/light + lockup + icon, BRAND-03) and the brand/legal collateral — README, NOTICE, CONTRIBUTING, `docs/faq.md` — with grugbrain.dev/Carson Gross attribution + non-affiliation intact and the systematic `/grug`→`/grugops` reconciliation (BRAND-01/02). Five example runs (EX-01): #2/#4/#5 illustrative with the honesty banner, #1/#3 REAL captures from the dogfood. The hybrid dogfood (DOG-01/02) ran the agent-proven sequential path on an out-of-repo TS/Node+Fastify sample — bootstrap → ticket ABC-001 idea→PR → gate verdict `READY_FOR_HUMAN_REVIEW` → validator passed on the sample tree (DOG-01). The live-Claude-Code-session half of DOG-02 (D-31 plugin-cache pointer resolution, SAFE-02 live hook firing, CC sub-agent spawn parity) was **deliberately deferred** by the user at the `checkpoint:human-verify` gate to milestone-close UAT — tracked in `docs/dogfood-human-runbook.md` + `06-HUMAN-UAT.md`, marked `pending human`, never fabricated (the honest agent-proven/human-pending split is the design). Code review found 1 Critical (`JSON.parse(null)` crash on unreadable `plugin.json`) + 4 Warnings (lint/build example honesty contradiction, weak column self-test, prefix-match laxity, real name as illustrative deploy approver) — all fixed atomically and re-proven (validator self-test ALL CHECKS PASSED; exits 0 bare + --strict). Regression harnesses `guard.test.sh`, `install.test.sh`, and Phase-4 `check-structure.sh` all PASS. Verification: 6/7 must-haves verified, status human_needed (the single open item is the deferred DOG-02 live-CC half). Next: `/gsd-complete-milestone` for the full v1.0 review + archival.*

*Phase 5 history — Phase 5 (Packaging, Adapters, Install & Distribution) complete: the single-source core is now bridged to all five host tools via pointer-only adapters. `agent-factory/packaging/adapters.md` maps each tool to entry/dispatch/adapter/verify and restates "only the dispatch differs, never the content" (PKG-01); the `Agent`-based subagent + skill templates are recorded (PKG-02). Both Claude forms ship and coexist: the standalone `.claude/` form is seven dash skills `/grugops` + `/grugops-<op>` plus a subagent wrapper, an additive one-line CLAUDE.md sentinel pointer, and Gemini `context.fileName` wiring (CLAUDE-01); the versioned plugin form is `.claude-plugin/{plugin.json,marketplace.json}` (name `grugops`, version `0.1.0` mirroring `agent-factory/VERSION` — D-28) with seven plugin-root `skills/<op>/SKILL.md` colon-form commands `/grugops:<op>` (CLAUDE-02/03, `claude plugin validate --strict` passes). Two open decisions resolved at phase start: version string `0.1.0` (D-28) and skills/ over commands/ (D-29). SAFE-02 is mechanical: a plugin-level `hooks/hooks.json` PreToolUse Bash matcher + pure-Node `hooks/guard.mjs` that denies prod-deploy commands absent a human-set `GRUGOPS_PROD_DEPLOY_APPROVED`, refuses inline self-approval, and fails closed. Installers `install/install.sh` (POSIX) + `install/install.mjs` (Node) are functionally identical, idempotent, additive, `DRY_RUN=1`-capable, reversible (symlink+copy-fallback D-30), never overwrite user content; `uninstall.sh` removes only what was added. Verified 5/5 must-haves; structural harness `check-structure.sh`, `hooks/guard.test.sh` (26/26), and `install/install.test.sh` (13/13) all PASS. Code review found 1 BLOCKER (uninstall deleting a user-owned `AGENTS.md` symlink) + 6 warnings (guard missed `kubectl delete`/force-push/`*publish`, greedy false-denies, sh/mjs parity, detect precedence, sentinel collision, matcher-scope docs) — all fixed and re-proven (05-REVIEW-FIX.md, all_fixed). Two acceptance items deferred to live Phase-6 dogfood (DOG-01/02): plugin-cache pointer resolution (D-31) and live PreToolUse hook firing, tracked in 05-HUMAN-UAT.md. Requirements remain hypotheses pending the Phase 6 dogfood.*
