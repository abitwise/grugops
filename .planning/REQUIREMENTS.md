# Requirements: grugops — Milestone v1.2 "SDLC Depth, Quality Discipline & Browsable Docs"

**Defined:** 2026-06-09
**Core Value:** A user installs grugops on top of the coding-agent CLI they already run, types `/grug`, and gets a disciplined delivery team — a visible board, strict handoffs, and an auditable requirement→code→test→release trail — entirely as readable markdown, with humans always holding merge and deploy.

> **Nature of this milestone:** introspective. grugops ships no runtime; these requirements describe capabilities grugops gains by encoding them into markdown role prompts, workflows, checklists, handoff contracts, the config dial, the single-source §14 quality gate, and two byte-parity install scripts + one stdlib-only Node generator. "UI / tests / security" are capabilities grugops gives its *users* — grugops **references and recommends** the tools, it never installs them into itself.
>
> **Design defaults baked into scope (adjustable):** traceability extended in-cell (no header churn); ESLint 9 flat-config as the Vue-stack lint default (Biome noted as experimental for Vue); mutation testing offered as guidance, not mandated; the docs catalog includes a freshness check. Standards anchored: **OWASP ASVS 5.0.0**, **playwright-bdd 9 / Vitest 4 / @vue/test-utils**, **ESLint 9**.

## Milestone v1.2 Requirements

Each maps to exactly one roadmap phase (traceability filled by the roadmapper).

### SDLC Coverage & Foundation Guards

- [x] **SDLC-01**: grugops ships an SDLC-coverage audit that reviews every role + workflow for full-lifecycle completeness (especially the business→engineer handoff) and records the gaps it finds
- [x] **SDLC-02**: Mechanical foundation guards run in the build gate before content changes — WR-05 spawn-grant grep, single-source adapter-size check, AGENTS.md byte-budget check, and a voice-discipline lint — each failing red on violation (never fabricated)
- [x] **SDLC-03**: A documented config-dial contract defines, for every v1.2 capability, a lean default and an enterprise escalation, so zero-config still runs lean and no enterprise gate is prose-only

### Senior Personas

- [x] **PERS-01**: Every role prompt is deepened to senior judgment (long-term experience + forward-thinking) in place — no new section — with the terse grug caveman voice preserved as grugops's token-economy mechanism (seniority = sharper judgment per token, not more prose); verified by the all-16-role voice-lint guard, a new caveman-preserved guard, and a new role-file size ceiling _(mechanism revised during discuss-phase 2026-06-10; see 11-CONTEXT.md)_
- [x] **PERS-02**: The business-analysis persona + workflow are deepened to senior level — INVEST-shaped user stories, explicit acceptance criteria, measurable NFRs, and a Definition of Ready that closes the business→engineer handoff
- [x] **PERS-03**: The packaging templates carry NO spawn-tool grant (WR-05 retired), preserving single-window sequential role-load across all five host CLIs

### BDD Acceptance Layer

- [x] **BDD-01**: Acceptance behavior is expressed as given-when-then scenarios that form the business→engineer contract, carried in the product + QE handoffs (declarative, executable-or-absent — no Gherkin nobody runs)
- [x] **BDD-02**: A Three Amigos / Example Mapping step is folded into backlog refinement, producing the scenarios before code
- [x] **BDD-03**: BDD depth is config-dialed (off | lean | strict)

### TDD Unit Layer

- [x] **TDD-01**: The engineering workflow drives test-first red-green-refactor at the unit layer, with the double-loop rule — no second acceptance scenario goes red before the first is green, and one behavior is owned by exactly one test layer (no BDD/TDD duplication)
- [x] **TDD-02**: TDD strictness is config-dialed (off | encouraged | required)

### Frontend/UI Build

- [x] **UI-01**: grugops includes a senior frontend/UI persona (new role) that activates via the role-switch protocol with no spawn tool
- [x] **UI-02**: grugops includes a UI design→build workflow (design contract → component build → loading/empty/error/success/partial-data states → accessibility → visual baseline)
- [x] **UI-03**: The Orchestrator routing matrix routes UI work to the frontend/UI persona

### Automated UI/E2E Testing

- [x] **UIQA-01**: grugops recommends and templates automated UI/E2E + visual-regression testing (Playwright `toHaveScreenshot` + axe-core a11y), with flake-resistance practices encoded (masking, animations disabled, fixed viewport, baselines generated in CI/Docker)
- [x] **UIQA-02**: UI/E2E is wired into the §14 quality gate as a step, config-dialed (off | ui-or-critical-path | always), automated to minimize human checkpoints

### Security Auditing

- [x] **SEC-01**: grugops includes a security-audit workflow anchored to OWASP ASVS 5.0
- [x] **SEC-02**: The security/NFR checklist is rewritten to ASVS 5.0 chapters with L1/L2/L3 tags and requirement IDs, generated from the pinned ASVS source (not hand-transcribed)
- [x] **SEC-03**: ASVS level is config-dialed (L1 lean → L2 enterprise → L3 + named human sign-off), the gate's security block-threshold is dialed, and all security findings are written in clear professional voice

### Test Integrity

- [x] **TINT-01**: The §14 gate blocks unjustified skipped tests; a legitimate skip requires a structured justification (reason + named owner + tracking ticket/REQ-ID + expiry date + closed-list category), and the agent may not self-author it
- [x] **TINT-02**: The gate fails when unjustified skips > 0 or expired skips > 0; quarantine is a non-blocking lane (never silent deletion); coverage-honesty guidance discourages vanity coverage
- [x] **TINT-03**: Test-integrity enforcement is never fully dialable off (warn | block only) — a trace-integrity safety carve-out

### Code Linting

- [x] **LINT-01**: Lint is a first-class §14 gate step, with a per-stack linter recommendations table (ESLint 9 flat default for the Vue stack; Biome caveat; Ruff / golangci-lint fallbacks)
- [x] **LINT-02**: Lint strictness is config-dialed (strict on/off, autofix on/off)

### Docs Catalog

- [ ] **DOCS-01**: A stdlib-only Node generator produces a browsable in-repo markdown catalog of every role + workflow from their frontmatter (committed; no npm deps; no web UI)
- [ ] **DOCS-02**: A freshness check (regenerate-to-temp, diff, non-zero on drift) prevents the catalog from drifting from the kit it documents

### Install Migrate/Update

- [x] **MIGR-01**: `install.sh --migrate` converts an already-installed in-repo layout to the split two-root layout — additive-then-relocate, never delete-first (rename-to-backup; deletion only behind explicit `--prune-old-kit`); byte-parity sh/Node; re-run is a no-op
- [x] **UPD-01**: `install.sh --update` refreshes the central `$GRUGOPS_HOME` kit in place (two-stage, reversible); the doctor names the specific unresolved path on failure

### Tooling / TypeScript Foundation

- [x] **TOOL-01**: grugops's tooling layer is TypeScript, executed cross-platform (incl. Windows) with an explicit posture on build + dependencies — Node native type-stripping preferred to preserve a zero-build, no-unjustified-npm-deps path; the existing scripts (installers, validator, ASVS generator, foundation guards + harnesses) migrate at behavior parity
- [x] **TOOL-02**: A kit-shipped-runnable convention lets a TypeScript routine ship inside the kit, be materialized by the installer, and run cross-platform from a workflow step — the foundation that lets the §14 gate ship an un-cheatable cross-platform test-integrity checker into host repos

## Future Requirements

Acknowledged but deferred — not in the v1.2 roadmap.

### Distribution & Tooling

- **SKEW-01**: Per-repo kit-version pin + skew warning between the central kit and a repo's expectations
- **FIX-01**: Doctor `--fix` mode that repairs (not just reports) unresolved paths
- **PLUGIN-01**: Plugin-form path resolution / publishing grugops as a Claude Code plugin (plugin-cache copy model)

### Deeper Quality

- **MUT-01**: Mutation testing as a *required* gate step (v1.2 offers it as guidance only — grugops cannot ship a runtime)
- **VRT-01**: Full cross-browser visual-regression matrix (v1.2 targets a single reference engine)

## Out of Scope

| Feature | Reason |
|---------|--------|
| A web UI / static doc site / SaaS portal for the docs catalog | Out-of-scope boundary: grugops is a file-and-prompt kit; the catalog stays in-repo markdown |
| Adding npm runtime dependencies to grugops itself (`gray-matter`, `js-yaml`, a test runner, etc.) | grugops is markdown + stdlib-only scripts; intelligence lives in the host agent |
| Auto-merge to protected branches / auto-deploy to production | Unchanged hard limit — humans always decide; enforced mechanically |
| Cucumber.js as the BDD runner | playwright-bdd chosen: native Playwright runner gives visual regression + fixtures + parallelism for free |
| Biome as the default linter for the Vue stack | Biome's Vue SFC support is still experimental; ESLint 9 flat is the default, Biome a non-Vue option |
| "Bug the user as little as needed" weakening the merge/deploy human gates | Automation reduces *routine* checkpoints only; safety stops are mechanically non-negotiable |
| Re-introducing a spawn/`Agent` tool to enable sub-agent nesting | Single-window sequential role-load is required for portability across 5 host CLIs (WR-05 is debt to retire, not license) |

## Traceability

Each requirement maps to exactly one phase. v1.2 phase numbering continues from v1.1 (Phases 10–18; no reset).

| Requirement | Phase | Status |
|-------------|-------|--------|
| SDLC-01 | Phase 10 | Complete |
| SDLC-02 | Phase 10 | Complete |
| SDLC-03 | Phase 10 | Complete |
| PERS-01 | Phase 11 | Complete |
| PERS-02 | Phase 11 | Complete |
| PERS-03 | Phase 11 | Complete |
| BDD-01 | Phase 12 | Complete |
| BDD-02 | Phase 12 | Complete |
| BDD-03 | Phase 12 | Complete |
| TDD-01 | Phase 12 | Complete |
| TDD-02 | Phase 12 | Complete |
| UI-01 | Phase 13 | Complete |
| UI-02 | Phase 13 | Complete |
| UI-03 | Phase 13 | Complete |
| UIQA-01 | Phase 16 | Complete |
| UIQA-02 | Phase 16 | Complete |
| SEC-01 | Phase 14 | Complete |
| SEC-02 | Phase 14 | Complete |
| SEC-03 | Phase 14 | Complete |
| TINT-01 | Phase 16 | Complete |
| TINT-02 | Phase 16 | Complete |
| TINT-03 | Phase 16 | Complete |
| LINT-01 | Phase 16 | Complete |
| LINT-02 | Phase 16 | Complete |
| TOOL-01 | Phase 15 | Complete (15-01: build posture + freshness gate; 15-02: prod-deploy guard ported at parity; 15-03: single installer + uninstall ported at parity; 15-04: validator + ASVS generator + foundation-guards + kit-refs ported at exact parity — byte-reproducible ASVS, full .sh/.mjs-vs-.js diff identical, RED-by-design harnesses green; 15-06: invocation-string + env-var sweeps, 13 POSIX/.mjs originals + .test.sh oracles deleted after green-suite gate (D-09), D-13 constraint amendment ratified — nothing POSIX remains) |
| TOOL-02 | Phase 15 | Complete |
| DOCS-01 | Phase 18 | Pending |
| DOCS-02 | Phase 18 | Pending |
| MIGR-01 | Phase 17 | Complete |
| UPD-01 | Phase 17 | Complete |

**Coverage:**
- v1.2 requirements: 30 total
- Mapped to phases: 30 ✓
- Unmapped: 0 ✓

**Phase distribution:**
- Phase 10 (SDLC-Coverage Audit & Foundation Guards): SDLC-01, SDLC-02, SDLC-03 (3)
- Phase 11 (Senior Persona Overhaul): PERS-01, PERS-02, PERS-03 (3)
- Phase 12 (BDD + TDD Wiring): BDD-01, BDD-02, BDD-03, TDD-01, TDD-02 (5)
- Phase 13 (Frontend/UI Persona & Design→Build Workflow): UI-01, UI-02, UI-03 (3)
- Phase 14 (Security Audit (OWASP ASVS) & Checklist Re-Anchor): SEC-01, SEC-02, SEC-03 (3)
- Phase 15 (TypeScript Tooling Migration): TOOL-01, TOOL-02 (2)
- Phase 16 (§14 Gate Convergence — Lint, UI/E2E & Test-Integrity): UIQA-01, UIQA-02, TINT-01, TINT-02, TINT-03, LINT-01, LINT-02 (7)
- Phase 17 (Install --migrate / --update): MIGR-01, UPD-01 (2)
- Phase 18 (Browsable Docs Catalog): DOCS-01, DOCS-02 (2)

---
*Requirements defined: 2026-06-09*
*Last updated: 2026-06-13 — TypeScript pivot ratified; inserted Phase 15 (TS Tooling Migration, TOOL-01/02), renumbered gate/install/docs to 16/17/18; all 30 requirements mapped to phases 10–18 (100% coverage, 0 unmapped)*
