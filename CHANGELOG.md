# Changelog

All notable changes to grugops are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **A note on versions.** grugops is pre-1.0: the artifact version in `agent-factory/VERSION`
> is `0.1.0` and no public release has been cut. The `v1.0`, `v1.1`, and `v1.2` entries below are
> the project's internal milestone tags (they match `git tag`), not published SemVer releases. The
> v2.0 decentralized-factory architecture pivot is in progress, so it lives under **[Unreleased]**;
> the artifact version deliberately stays `0.1.0` across that pivot.

## [Unreleased]

The **v2.0 Decentralized Factory — Shared Verified Context** milestone (phases 20–26). This is a
major architecture pivot: it replaces the centralized Orchestrator plus static handoff packets with
a shared, verified, auditable context substrate that parallel agents read and write directly. Work
is in progress and not yet tagged.

### Added

- A typed, six-kind shared-context note schema with a provenance fence, written through a single
  sanctioned path (`context-io`) that is atomic, append-only, and byte-reproducible.
- A lock-free, file-based task queue: agents claim work atomically and build on one another's
  verified progress without routing through a central head.
- Verify-before-write admission: a finding is only admitted to the shared context after it carries a
  live GREEN verdict from the §14 quality gate — the gate is the un-cheatable verifier, and the
  `verified_by` stamp refuses self-set and hollow stamps.
- Dialable memory and trajectory compaction, with a load-bearing-field carve-out so verified
  findings and required failed attempts are never silently dropped.
- Governance-on-a-dial: enterprise human-admission and audit-retention tiers layered over the
  decentralized substrate, with the safety floor left un-dialable.

### Changed

- Parallel execution with the Orchestrator acting as decomposer and scheduler. Claude Code is the
  primary path (it can spawn agents); the four non-spawning host CLIs degrade gracefully to a
  sequential mode over the same shared context.
- All roles and workflows rewired onto the shared substrate; the static handoff templates are being
  removed and the traceability trail migrated onto the new context.

_In progress: the phase 26 dogfood dual-path oracle is not yet complete. The A3/DOG-02 live
dual-path parity retirement is deferred pending a captured live run._

## [1.2] - 2026-06-16

**SDLC Depth, Quality Discipline & Browsable Docs** (phases 10–19, 38 plans). Made the delivery
lifecycle senior-grade and trustworthy end-to-end.

### Added

- A 17th persona: a senior frontend/UI role plus a UI design-to-build workflow (WCAG 2.2 AA), with
  the Orchestrator routing UI work to it.
- Test-first by default: a declarative Given/When/Then acceptance contract (BDD, with Three
  Amigos / Example Mapping) and a red-green TDD double-loop, both config-dialed.
- An OWASP ASVS 5.0 security-audit workflow plus a generated, leveled L1/L2/L3 checklist (from a
  pinned source), with the ASVS level config-dialed and clear-voice findings.
- A browsable docs catalog that self-discovers the finished kit and emits a deterministic in-repo
  markdown catalog, guarded by a fail-closed freshness gate that fails red on drift.
- Automated UI/E2E testing (Playwright) plus visual regression and accessibility checks, wired into
  the quality gate.
- Install `--migrate` and `--update` modes (never-delete-first), plus a single opt-in deletion path.

### Changed

- All 16 roles deepened to senior judgment in place, sharper-per-token, with the terse caveman voice
  preserved unchanged across the rewrite.
- The §14 quality gate converged onto a single source and now runs lint, Playwright UI/E2E, visual
  regression, and a structured-justification test-integrity checker the agent cannot self-author.
- The entire tooling and script layer migrated to a TypeScript zero-build foundation: `tsc`-compiled
  committed `.js`, freshness-checked so the output cannot drift from its source, cross-platform, with
  Node 22+ as the install prerequisite and dev dependencies never shipped to host machines.

## [1.1] - 2026-06-08

**Install & Distribution** (phases 7–9, 14 plans). Redesigned the install experience.

### Added

- A two-root installer that resolves `$GRUGOPS_HOME`, copies the read-only kit there, and
  materializes the resolved absolute kit path into the standalone adapters while seeding per-repo
  state without clobbering user content.
- A `--check` doctor that resolves and stats every referenced path.
- A two-root-aware validator that refuses to false-green in the dev checkout or with `$GRUGOPS_HOME`
  unset.

### Changed

- Redesigned the install to a shared-location, two-root architecture: the read-only kit installs
  once to `${GRUGOPS_HOME:-$HOME/.grugops}` and each target repo keeps only per-repo state.
- Rewrote roughly 31 role, workflow, and adapter files so every reference resolves to the correct
  root (kit versus state), gated to zero stray references.

### Fixed

- The three v1.0 dogfood pains: the kit never arriving in the target, the wrong target being
  written, and fragile symlinks.

## [1.0] - 2026-06-04

**MVP — Full Agent Factory v2** (phases 1–6, 34 plans). The initial build of the complete Agent
Factory v2 spec, proved end-to-end by an idea-to-PR dogfood across both dispatch paths.

### Added

- 16 role prompts (Orchestrator plus the core and enterprise packs) and 14 lifecycle workflows with
  dual Kanban/Scrum cadence and a bounded backpressure quality gate.
- Shared I/O contracts: handoff templates, gate checklists, and a memory-bank seed.
- The config dial (`factory.config.json` with lean defaults), a visible Kanban/Sprint board, and a
  traceability trail.
- Thin per-tool adapters for the five host CLIs, plus both Claude Code distribution forms
  (standalone `.claude/` and the plugin with marketplace catalog).
- Idempotent, additive, reversible installers.
- A mechanical PreToolUse prod-deploy guard hook that denies deploys without named human approval and
  fails closed.
- A structure validator that never fabricates a pass, plus brand and legal collateral.

[Unreleased]: https://github.com/abitwise/grugops/compare/v1.2...HEAD
[1.2]: https://github.com/abitwise/grugops/compare/v1.1...v1.2
[1.1]: https://github.com/abitwise/grugops/compare/v1.0...v1.1
[1.0]: https://github.com/abitwise/grugops/releases/tag/v1.0
