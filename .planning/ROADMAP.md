# Roadmap: grugops

## Milestones

- ✅ **v1.0 MVP — Full Agent Factory v2** — Phases 1–6 (shipped 2026-06-04)
- ✅ **v1.1 Install & Distribution** — Phases 7–9 (shipped 2026-06-08)
- 🚧 **v1.2 SDLC Depth, Quality Discipline & Browsable Docs** — Phases 10–17 (in progress)

## Overview

grugops is built bottom-up as a file protocol, not a runtime. v1.0 froze the shared vocabulary, built the 16 roles + 14 workflows + contracts + adapters + both Claude forms + installers + validator + brand collateral, and proved the chain with a dogfood. v1.1 redesigned the install to a shared-location two-root model (read-only kit at `${GRUGOPS_HOME:-$HOME/.grugops}`, per-repo state in the target) with a path rewrite, a two-root installer, a `--check` doctor, and a false-green-proof validator. v1.2 deepens the kit itself: it opens with an SDLC-coverage audit plus the mechanical foundation guards (WR-05 spawn grep, single-source adapter-size check, AGENTS.md byte budget, voice-lint, config-dial contract) so every later content phase writes into a guarded environment; then a senior-persona overhaul lays the substrate, BDD+TDD close the business→engineer handoff, a frontend/UI persona and an ASVS security audit run as parallel content streams, then a TypeScript tooling migration converts the script layer (installers, validator, generator, guards) to a zero-build cross-platform foundation, the §14 quality gate converges all of it (lint + UI/E2E + test-integrity) on that TS foundation, install migrate/update lands as an independent track, and a generated docs catalog documents the finished 17-role / 15-workflow set last. Each phase's outputs are the next phase's inputs.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

v1.2 continues numbering from v1.1's last phase (9) — it starts at Phase 10, never resets.

<details>
<summary>✅ v1.0 MVP — Full Agent Factory v2 (Phases 1–6) — SHIPPED 2026-06-04</summary>

- [x] Phase 1: Substrate, Config & State Skeleton (5/5 plans) — completed 2026-06-02
- [x] Phase 2: Shared Contracts (4/4 plans) — completed 2026-06-03
- [x] Phase 3: Roles & AGENTS.md Substrate (8/8 plans) — completed 2026-06-03
- [x] Phase 4: Workflows, Cadence & Backpressure (7/7 plans) — completed 2026-06-03
- [x] Phase 5: Packaging, Adapters, Install & Distribution (5/5 plans) — completed 2026-06-03
- [x] Phase 6: Validation, Brand & Dogfood (5/5 plans) — completed 2026-06-04

Full phase details + milestone summary: `milestones/v1.0-ROADMAP.md` · requirements: `milestones/v1.0-REQUIREMENTS.md`

</details>

<details>
<summary>✅ v1.1 Install & Distribution (Phases 7–9) — SHIPPED 2026-06-08</summary>

- [x] Phase 7: Shared-Home Foundation & Path Rewrite (4/4 plans) — completed 2026-06-06
- [x] Phase 8: Two-Root Installer (4/4 plans) — completed 2026-06-07
- [x] Phase 9: Doctor & Two-Root Validator (6/6 plans) — completed 2026-06-08

Full phase details + milestone summary: `milestones/v1.1-ROADMAP.md` · requirements: `milestones/v1.1-REQUIREMENTS.md` · audit: `milestones/v1.1-MILESTONE-AUDIT.md`

</details>

### 🚧 v1.2 SDLC Depth, Quality Discipline & Browsable Docs (Phases 10–17) — IN PROGRESS

**Milestone Goal:** Make grugops's delivery lifecycle senior-grade and trustworthy end-to-end — deeper personas with full SDLC coverage (especially the business→engineer handoff), test-first by default (BDD at acceptance + TDD at the unit layer, config-dialed), automated UI build+test, OWASP ASVS security auditing, an un-cheatable quality gate, code linting, browsable docs — and finally ship the deferred install migrate/update story. Introspective milestone: most work improves grugops's own markdown kit; "UI / tests / security" are capabilities grugops gives its *users* through roles + workflows + the gate, since grugops itself is markdown.

- [x] **Phase 10: SDLC-Coverage Audit & Foundation Guards** - Audit lifecycle coverage; land the mechanical guards (WR-05 spawn grep, adapter-size, AGENTS.md byte budget, voice-lint) and the config-dial contract + schema before any content lands (all 4 plans executed 2026-06-09; awaiting phase verification) (completed 2026-06-10)
- [x] **Phase 11: Senior Persona Overhaul** - Deepen every role to senior judgment in place (no new section; terse caveman voice preserved as the token-economy mechanism), deepen the business-analysis persona to senior, retire WR-05 in the packaging templates (all 5 plans executed 2026-06-10; awaiting phase verification)
- [x] **Phase 12: BDD + TDD Wiring** - Given-when-then acceptance contract (Three Amigos) + red-green TDD double-loop across the BA/QE/engineer roles, workflows, and handoffs; both config-dialed (all 5 plans executed 2026-06-11; awaiting phase verification) (completed 2026-06-11)
- [x] **Phase 13: Frontend/UI Persona & Design→Build Workflow** - New senior frontend/UI role (no spawn) + a UI design→build workflow (workflow 14); Orchestrator routes UI work to it (completed 2026-06-11)
- [x] **Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor** - New security-audit workflow (workflow 15) + an ASVS 5.0-generated L1/L2/L3 checklist; ASVS level config-dialed; clear-voice findings (completed 2026-06-13)
- [x] **Phase 15: TypeScript Tooling Migration** - Ratified TS pivot: migrate install (`install.sh`/`install.mjs`), validator, ASVS generator, and foundation guards (+ their `.test` harnesses) to TypeScript at behavior parity; establish a zero-build cross-platform execution model + a kit-shipped-runnable convention so later phases ship cross-platform routines into host repos (completed 2026-06-13)
- [ ] **Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity** - Single-source gate additions in `05-pr-quality-gate.md`: lint step, automated UI/E2E + visual regression, and an un-cheatable structured-justification test-integrity check (TS checker on the Phase-15 foundation); all config-dialed
- [ ] **Phase 17: Install --migrate / --update** - RED-harness-first, never-delete-first, byte-parity install modes to migrate an in-repo layout forward and refresh the central kit
- [ ] **Phase 18: Browsable Docs Catalog** - Generator emits an in-repo markdown catalog of the finished 17-role / 15-workflow set; a freshness check fails red on drift

## Phase Details

### Phase 10: SDLC-Coverage Audit & Foundation Guards

**Goal**: The milestone opener — produce the SDLC-coverage audit that scopes the rest, and stand up the cross-cutting mechanical guards + config-dial contract so every later content phase writes into a guarded, dialed environment.
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: SDLC-01, SDLC-02, SDLC-03
**Success Criteria** (what must be TRUE):

  1. A committed audit artifact reviews all 16 roles + 14 workflows for lifecycle completeness and records the gaps it finds (named focus: the business→engineer handoff).
  2. The build gate runs four mechanical foundation guards that each fail red on violation and never fabricate a pass: a WR-05 spawn-grant grep over packaging templates + materialized adapters, a single-source adapter-size check, an AGENTS.md byte-budget check (under the 32 KiB Codex cap), and a voice-discipline lint over security/compliance/warning surfaces.
  3. A documented config-dial contract defines, for every v1.2 capability, an explicit lean default and an enterprise escalation — and the new dial keys (`bdd`, `quality.tdd`, `quality.lint`, `quality.ui_e2e`, `quality.test_integrity`, `quality.gate_enforcement`, `security.asvs_level`, `security.block_on`) exist with lean defaults across all three config files atomically (`config/factory.config.json`, `config/factory.config.md` twin, `seed/.grugops/factory.config.json`), recognized by the validator.
  4. Zero-config still runs lean: with no config file present, every new key degrades to its documented lean default.**Plans**: 4 plans

**Wave 1**

- [x] 10-01-PLAN.md — SDLC-coverage audit artifact (16 roles + 14 workflows x 9 lifecycle stages; gap->phase mapping)
- [x] 10-02-PLAN.md — Four foundation guards aggregator + fail-proof harness; adapters.md stale-spawn-prose fix
- [x] 10-03-PLAN.md — 8 config-dial keys atomic across 3 files + enterprise-escalation contract; e2e_when->ui_e2e rename

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 10-04-PLAN.md — Validator active-when-present/lenient-when-absent enum recognition + validate.test.sh extension

### Phase 11: Senior Persona Overhaul

**Goal**: Lay the substrate every later content phase depends on — raise all personas to senior judgment by deepening each role in place (no new section; the terse grug caveman voice is preserved as grugops's token-economy mechanism), deepen the business-analysis persona, and retire the WR-05 spawn-grant from the packaging templates.
**Depends on**: Phase 10
**Requirements**: PERS-01, PERS-02, PERS-03
**Success Criteria** (what must be TRUE):

  1. Every role prompt is deepened to senior judgment (long-term experience + forward-thinking) in place — no new section — while the terse grug caveman voice is preserved as grugops's token-economy mechanism (seniority = sharper judgment per token, not more prose). Verified mechanically by the Phase-10 voice-lint guard expanded to all 16 roles, a new caveman-preserved guard (every role keeps a non-empty `## Caveman prompt` block with ≥1 marker), and a new role-file size ceiling that fails a bloated rewrite. Each rewrite preserves the role's single `One job`, contract sections, pointer discipline, and AGENTS.md footer — persona + voice deepen, responsibilities do not.
  2. The business-analysis persona + its workflow are deepened to senior level — INVEST-shaped user stories, explicit acceptance criteria, measurable NFRs, and a Definition of Ready that closes the business→engineer handoff. Depth is single-sourced with `definition-of-ready.md` as the hub (`ba-pm.md` + `07-backlog-refinement.md` point to it); prose-quality only — executable given-when-then + Three Amigos are Phase 12.
  3. Both packaging templates (`subagent.frontmatter.md`, `slash-command.template.md`) carry NO spawn-tool grant — the WR-05 grep guard passes on the templates and on a fresh regeneration (re-run after the rewrite), preserving single-window sequential role-load across all five host CLIs; the WR-05 debt marker is closed in PROJECT.md / STATE.md / the SDLC audit / retrospective.
  4. New persona depth lives once under `agent-factory/`; the per-tool adapters stay pointer-sized (single-source adapter check passes).

**Plans**: 5 plans
**Wave 1**

- [x] 11-01-PLAN.md — Senior rewrite of 7 roles (scribe, architect, brownfield, factory-coach, greenfield, compliance, incident) in place [PERS-01]
- [x] 11-02-PLAN.md — Senior rewrite of 8 roles (installer, orchestrator outlier, qe-e2e, release, security-nfr, engineer, system-analyst, uat) in place [PERS-01]
- [x] 11-03-PLAN.md — ba-pm senior rewrite + senior BA deepening (DoR hub INVEST/measurable-NFR, workflow 07, packet aligned) [PERS-01, PERS-02]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 11-04-PLAN.md — 3 guard changes (voice→all 16 + refine, caveman-preserved, role-size) + fail-proof fixtures, ship GREEN [PERS-01]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 11-05-PLAN.md — WR-05 re-run (regen-safety, last check) + close 4 markers + reconcile audit GAP-2 row [PERS-03]

**Cross-cutting constraints:**

- Each role's single `One job` is unchanged — persona + voice deepen, responsibilities do not (D-03)

**UI hint**: no  <!-- markdown role-prompt rewrite; no visual UI — the frontend/UI persona is Phase 13 -->
**Context note**: PERS-01 mechanism changed during discuss-phase (2026-06-10) — see `.planning/phases/11-senior-persona-overhaul/11-CONTEXT.md`. Original "add a What-good-looks-like/When-to-escalate section" replaced by in-place persona deepening at the user's direction (the model already carries generic quality knowledge; the value is a sophisticated persona, and the terse caveman voice is the token-economy mechanism).

### Phase 12: BDD + TDD Wiring

**Goal**: Close the central business→engineer gap with a test-first contract — given-when-then acceptance scenarios produced by a Three Amigos step, driving a red-green TDD double-loop at the unit layer, both config-dialed and layered so no behavior is double-owned.
**Depends on**: Phase 10 (dial keys), Phase 11 (senior personas)
**Requirements**: BDD-01, BDD-02, BDD-03, TDD-01, TDD-02
**Success Criteria** (what must be TRUE):

  1. Acceptance behavior is expressed as declarative given-when-then scenarios (no UI selectors in the scenarios) that form the business→engineer contract, carried in the product and QE handoff templates and wired to be executable-or-absent — no Gherkin nobody runs.
  2. A Three Amigos / Example Mapping step is folded into backlog refinement, producing the scenarios before code.
  3. The engineering workflow drives test-first red-green-refactor at the unit layer with the double-loop rule encoded: no second acceptance scenario goes red before the first is green, and each behavior is owned by exactly one test layer (BDD acceptance vs TDD unit — no duplication).
  4. BDD depth reads `bdd` (off | lean | strict) and TDD strictness reads `quality.tdd` (off | encouraged | required) from `.grugops/factory.config.json`, each degrading to its lean default when absent.

**Plans**: 5 plans

**Wave 1**

- [x] 12-01-PLAN.md — Acceptance-scenarios G/W/T contract in product + QE handoffs (tiered, no-selectors, D-14 trace note) [BDD-01]
- [x] 12-02-PLAN.md — NEW example-mapping.md Three Amigos hub + dial-gated step in workflow 07 + the contract-vs-logic seam example [BDD-02, BDD-03]
- [x] 12-03-PLAN.md — TDD red-green double-loop step in workflow 04 + TDD test-strategy line in impl-ready packet + light forward-pointer [TDD-01]
- [x] 12-05-PLAN.md — Role guardrail pointer lines (software-engineer + qe-e2e, byte-ceiling-watched) + AGENTS.md acceptance command slot [TDD-01, BDD-01]

**Wave 2** *(blocked on 12-01 — shared qe-handoff.md)*

- [x] 12-04-PLAN.md — Tiered test-first / red-green evidence fields in implementation + QE handoffs with the clear-voice no-fabrication floor [TDD-02]

### Phase 13: Frontend/UI Persona & Design→Build Workflow

**Goal**: Give grugops a senior frontend/UI specialist and a repeatable UI build flow — a new 17th role that activates via the role-switch protocol (no spawn) and a new workflow 14 the Orchestrator routes UI work to.
**Depends on**: Phase 10 (dial keys), Phase 11 (skeleton)
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):

  1. A senior frontend/UI persona (`roles/frontend-ui.md`) exists on the standard role skeleton and activates via `_role-switch-protocol.md` with no spawn tool (WR-05 guard passes).
  2. A UI design→build workflow (`workflows/14-ui-design-to-build.md`) walks design contract → component build → all five states (loading / empty / error / success / partial-data) → accessibility → visual baseline, referencing the §14 gate rather than restating it.
  3. The Orchestrator routing matrix and classification list route UI work to the frontend/UI persona, and the new role + workflow register in the workflow map without renumbering the frozen 00–13 ordinals.

**Plans**: 3 plans
**UI hint**: yes

**Wave 1**

- [x] 13-01-PLAN.md — frontend-ui.md (17th role, no spawn) + frontend-handoff.md template + guard registration (ROLE_FILES + role_ceiling case + GUARD_INPUTS) [UI-01]
- [x] 13-02-PLAN.md — 14-ui-design-to-build.md workflow (tool-neutral, WCAG 2.2 AA, references 04 + 05) [UI-02]

**Wave 2** *(blocked on Wave 1 — shared guard script + workflow-map references workflow 14)*

- [x] 13-03-PLAN.md — Orchestrator routing wiring (ui-build classification + matrix + workflow-map + count) + orchestrator ceiling raise [UI-03]

### Phase 14: Security Audit (OWASP ASVS) & Checklist Re-Anchor

**Goal**: Give grugops a leveled, evidence-backed security posture — a new ASVS-anchored security-audit workflow (workflow 15), a regenerated ASVS 5.0 checklist with L1/L2/L3 tags and requirement IDs, and a dialed ASVS level — all in clear professional voice.
**Depends on**: Phase 10 (dial keys), Phase 11 (skeleton)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):

  1. A security-audit workflow (`workflows/15-security-audit.md`) anchored to OWASP ASVS 5.0 exists, registered in the Orchestrator workflow map without renumbering 00–13, and references the §14 gate for any gate steps.
  2. The security/NFR checklist is rewritten to ASVS 5.0 chapters with L1/L2/L3 tags and requirement IDs, generated from the pinned ASVS 5.0.0 source (not hand-transcribed), and every "pass" cites evidence or reads `UNKNOWN - verify` — no unbacked ticks.
  3. ASVS level is config-dialed (`security.asvs_level`: L1 lean → L2 enterprise → L3 + named human sign-off), the gate's security block-threshold is dialed (`security.block_on`), and all security findings are written in clear professional voice (voice-lint guard passes on the security surfaces).

**Plans**: 3 plans

**Wave 1**

- [x] 14-01-PLAN.md — Vendor pinned ASVS 5.0.0 flat.json + stdlib-Node generator + regenerated full L1/L2/L3 checklist in place [SEC-02]
- [x] 14-02-PLAN.md — Workflow 15 (deep ASVS audit, reference-don't-restate) + Orchestrator security-audit registration (no renumber) [SEC-01]

**Wave 2** *(blocked on Wave 1 — guard_voice scans the regenerated checklist + workflow 15; harness mirrors both)*

- [x] 14-03-PLAN.md — Dial behavior (read-time asvs_level filter + D-09 severity map + named-owner override) in role + handoff; guard_voice extension over the 4 security surfaces + RED fixtures [SEC-03]

### Phase 15: TypeScript Tooling Migration

**Goal**: Execute the ratified TypeScript pivot for grugops's tooling layer — migrate the existing scripts (`install.sh`, `install.mjs`, `scripts/validate-agent-factory.mjs`, `scripts/generate-asvs-checklist.mjs`, `scripts/check-foundation-guards.sh`, and their `.test` harnesses) to TypeScript at behavior parity, establish a zero-build cross-platform execution model (research Node native type-stripping vs a `tsc` build), and define the kit-shipped-runnable convention so later phases can ship cross-platform routines into host repos. Amends the foundational "markdown + stdlib-only, no-npm-deps" constraint to the ratified posture.
**Depends on**: Phase 9 (the v1.1 installer scripts) + Phase 10 (foundation guards) — the scripts being migrated
**Requirements**: TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):

  1. A cross-platform TS execution model is decided and documented: runs on Windows/macOS/Linux, with an explicit build posture (Node native type-stripping preferred to preserve a zero-build, no-npm-deps path; any added dependency or build step justified in writing).
  2. All existing tooling scripts are migrated to TypeScript at behavior parity — the byte-parity sh/Node install contract and every RED-by-design test harness still fail red on a regression and pass green on the migrated code.
  3. A kit-shipped-runnable convention exists and is documented: how a TS routine ships inside the kit, is materialized by the installer, and is invoked cross-platform from a workflow step — the foundation the Phase-16 gate checker builds on.
  4. The foundational constraint is formally amended (CLAUDE.md / PROJECT.md) to record the ratified TS pivot; the prior "HELD" notes in the Phase 12–14 contexts are marked superseded. Converting `install.sh` is an explicit decision point — removing the zero-Node POSIX install path is called out and ruled on, not done silently.

**Plans**: 6 plans

**Wave 0**

- [x] 15-01-PLAN.md — Toolchain scaffolding: package.json + tsconfig + vitest.config + .gitattributes LF pin + lockfile + .gitignore + freshness gate (D-01/D-02/D-03/D-04/D-05/D-06) [TOOL-01]

**Wave 1** *(blocked on Wave 0; plans 02/03/04 run in parallel — disjoint file ownership)*

- [x] 15-02-PLAN.md — Prod-deploy guard byte-for-behavior port (fail-closed, literal approval var, full DEPLOY set) + Vitest oracle + hooks.json repoint (D-10) [TOOL-01]
- [x] 15-03-PLAN.md — Single install.ts (collapse sh+mjs, D-07) + uninstall.ts + Vitest harness with the D-08 retired-parity marker (D-07/D-08/D-09) [TOOL-01]
- [x] 15-04-PLAN.md — Validator + ASVS generator + foundation-guards + kit-refs ports (byte-reproducible, C3/CR-03 preserved) + RED-by-design Vitest harnesses [TOOL-01]

**Wave 2** *(blocked on Wave 0 + Plan 03 — touches install.ts)*

- [x] 15-05-PLAN.md — Kit-shipped-runnable convention: reference routine + RED fixture + D-11 installer materialization to tools/grugops/ (D-11/D-12) [TOOL-02]

**Wave 3** *(blocked on Waves 1–2 — deletes the parity oracles only after green)*

- [x] 15-06-PLAN.md — D-13 constraint amendment (CLAUDE.md/PROJECT.md + supersede HELD notes) + invocation/env-var sweeps + delete all POSIX/.mjs originals (D-09/D-13; blocking human checkpoint) [TOOL-01]

### Phase 16: §14 Gate Convergence — Lint, UI/E2E & Test-Integrity

**Goal**: Converge the BDD/UI/ASVS work into the single-source §14 quality gate — add lint, automated UI/E2E + visual regression, and an un-cheatable structured-justification test-integrity check to `05-pr-quality-gate.md` only, all config-dialed, preserving the bounded-self-fix contract and the three terminal results. The test-integrity checker is a cross-platform TypeScript routine on the Phase-15 foundation.
**Depends on**: Phase 12 (BDD/TDD), Phase 13 (UI flow), Phase 14 (ASVS posture), Phase 15 (TS tooling foundation + kit-shipped-runnable convention)
**Pre-decisions captured (2026-06-13, during the discuss session that ratified the TS pivot):** see `.planning/phases/16-14-gate-convergence-lint-ui-e2e-test-integrity/16-PRE-DECISIONS.md` — test-integrity enforcement = committed checker + RED fixture; checker validates a grugops justification registry and compares skip counts (stack-agnostic); checker language = TypeScript on the Phase-15 foundation.
**Requirements**: UIQA-01, UIQA-02, TINT-01, TINT-02, TINT-03, LINT-01, LINT-02
**Success Criteria** (what must be TRUE):

  1. Lint is a first-class §14 gate step backed by a per-stack linter recommendations table (ESLint 9 flat default for the Vue stack; Biome caveat; Ruff / golangci-lint fallbacks), with strictness and autofix read from `quality.lint`.
  2. Automated UI/E2E + visual-regression (Playwright `toHaveScreenshot` + axe-core a11y) is templated with flake-resistance encoded (role/label/`data-testid` locators, masking, animations disabled, fixed viewport, baselines generated in CI/Docker) and wired into the gate step, dialed via `quality.ui_e2e` (off | ui-or-critical-path | always).
  3. The gate blocks unjustified skipped tests: a legitimate skip requires a structured justification (reason + named owner + tracking ticket/REQ-ID + expiry date + closed-list category), the agent may not self-author it, the gate fails when unjustified skips > 0 or expired skips > 0, and quarantine is a non-blocking lane (never silent deletion) — proven by a RED fixture where a hollow justification fails.
  4. Test-integrity enforcement is never fully dialable off (`quality.test_integrity`: warn | block only — a trace-integrity safety carve-out); all new steps wrap unchanged inside the bounded `self_fix_attempts` loop and preserve the three terminal results (`READY_FOR_HUMAN_REVIEW` / `BLOCKED_NEEDS_FIX` / `SPLIT_REQUIRED`); all gate changes land single-source in `05-pr-quality-gate.md` (no fork into workflows 14/15).

**Plans**: 3 plans
**UI hint**: yes

**Wave 1** *(parallel — disjoint file ownership)*

- [ ] 16-01-PLAN.md — Test-integrity checker (near-clone of reference-check.ts) + GREEN/RED/edge fixtures + Vitest RED-fixture harness (SC3 keystone) + install RUNNABLES tuple [TINT-01, TINT-02, TINT-03]
- [ ] 16-02-PLAN.md — Playwright visual-regression recipe + axe-core accessibility extension + per-stack linter recommendations table + index registration [UIQA-01, LINT-01]

**Wave 2** *(blocked on Wave 1 — references the materialized checker path + the two new checklist filenames)*

- [ ] 16-03-PLAN.md — Single-source gate wiring in 05-pr-quality-gate.md (lint/ui_e2e/test-integrity steps + D-08/D-09/D-10 mapping) + AGENTS.md skip-count slot + config-twin dial prose [UIQA-02, LINT-02, TINT-01, TINT-02, TINT-03]

### Phase 17: Install --migrate / --update

**Goal**: Ship the deferred install migrate/update story as an independent track — RED-harness-first, additive, reversible, never-delete-first, byte-parity modes to move an already-installed in-repo layout to the two-root layout and refresh the central kit in place. Builds on the Phase-15 TypeScript installer.
**Depends on**: Phase 9 (v1.1 installer) + Phase 15 (TS installer); no dependency on the content phases (10–16) — can otherwise run in parallel
**Requirements**: MIGR-01, UPD-01
**Success Criteria** (what must be TRUE):

  1. `install.sh --migrate` converts an already-installed in-repo layout to the split two-root layout additive-then-relocate (rename-to-backup; deletion only behind an explicit `--prune-old-kit`), at sh/Node byte-parity, and a re-run is a no-op.
  2. `install.sh --update` refreshes the central `$GRUGOPS_HOME` kit in place in a two-stage, reversible operation, leaving per-repo state untouched, and the doctor names the specific unresolved path on failure.
  3. A RED-by-design test harness exists and passes: a user-edited config survives migration (backed up, not lost), a re-run is a no-op, and uninstall-after-migrate restores the pre-migrate state — with bounded marker-strip (no unterminated-marker over-deletion, per the v1.1 CR-01 fix).

**Plans**: TBD

### Phase 18: Browsable Docs Catalog

**Goal**: Document the finished kit — a generator produces a browsable in-repo markdown catalog of the final 17 roles and 15 workflows from their frontmatter, with a freshness check that fails red on drift. Runs last so it documents the completed set.
**Depends on**: Phases 11–16 (the finished role/workflow set); runs after everything else
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):

  1. A stdlib-only Node generator (no npm deps) produces a committed browsable in-repo markdown catalog (`docs/catalog/`) of every role + workflow from their frontmatter — no web UI, generated not hand-maintained, emitting `UNKNOWN - verify` rather than inventing a missing description.
  2. A freshness check (regenerate-to-temp, diff, non-zero on drift) prevents the catalog from drifting from the kit it documents, wired so a stale catalog fails the build red.
  3. The catalog reflects the finished set — all 17 roles (incl. the new frontend/UI persona) and all 15 workflows (incl. the new UI design→build and security-audit workflows).

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 (17 is an independent track that may run in parallel with 11–16).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Substrate, Config & State Skeleton | v1.0 | 5/5 | Complete | 2026-06-02 |
| 2. Shared Contracts | v1.0 | 4/4 | Complete | 2026-06-03 |
| 3. Roles & AGENTS.md Substrate | v1.0 | 8/8 | Complete | 2026-06-03 |
| 4. Workflows, Cadence & Backpressure | v1.0 | 7/7 | Complete | 2026-06-03 |
| 5. Packaging, Adapters, Install & Distribution | v1.0 | 5/5 | Complete | 2026-06-03 |
| 6. Validation, Brand & Dogfood | v1.0 | 5/5 | Complete | 2026-06-04 |
| 7. Shared-Home Foundation & Path Rewrite | v1.1 | 4/4 | Complete | 2026-06-06 |
| 8. Two-Root Installer | v1.1 | 4/4 | Complete | 2026-06-07 |
| 9. Doctor & Two-Root Validator | v1.1 | 6/6 | Complete | 2026-06-08 |
| 10. SDLC-Coverage Audit & Foundation Guards | v1.2 | 4/4 | Complete    | 2026-06-10 |
| 11. Senior Persona Overhaul | v1.2 | 5/5 | Verifying | 2026-06-10 |
| 12. BDD + TDD Wiring | v1.2 | 5/5 | Complete    | 2026-06-11 |
| 13. Frontend/UI Persona & Design→Build Workflow | v1.2 | 3/3 | Complete    | 2026-06-11 |
| 14. Security Audit (OWASP ASVS) & Checklist Re-Anchor | v1.2 | 3/3 | Complete    | 2026-06-13 |
| 15. TypeScript Tooling Migration | v1.2 | 6/6 | Complete    | 2026-06-13 |
| 16. §14 Gate Convergence — Lint, UI/E2E & Test-Integrity | v1.2 | 0/3 | Not started | - |
| 17. Install --migrate / --update | v1.2 | 0/TBD | Not started | - |
| 18. Browsable Docs Catalog | v1.2 | 0/TBD | Not started | - |

**Totals:** 18 phases · 48 plans complete · 2 milestones shipped · v1.2 (9 phases, 10–18) in progress.
