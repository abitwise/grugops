# Changelog

All notable changes to grugops are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **A note on versions.** `2.1.0` (tag `v2.1`, 2026-09-18) is the first published SemVer release;
> the artifact version in `agent-factory/VERSION`, `.claude-plugin/plugin.json` and `package.json`
> agree on it, and the break-contract applies from here. Before it, the artifact version was the
> pre-release seed `0.1.0`, and the `v1.0`, `v1.1`, `v1.2` and `v2.0` entries below are the
> project's internal milestone tags (they match `git tag`), not published SemVer releases.

## [Unreleased]

Phase 33 (Live Capture & Windows Portability) was open when 2.1.0 was cut and lands in the next
release.

### Changed

- The coordinator adapter's `tools:` grant carries the plugin's MCP admission tool under the
  platform's scoped name, `mcp__plugin_grugops_grugops__propose_note`, through a new `admit`
  capability token in the role generator's closed vocabulary (declared only by
  `agent-factory/roles/orchestrator.md`). On the `--agent` path the session's tool list is the
  adapter's grant, so until now the coordinator could not reach the sanctioned writer there. The
  canonical frontmatter alphabet admits `_` for this — one character, recorded as decision
  D-33-R3-02; every YAML-significant byte stays refused.
- Every note the sanctioned writer (`scripts/context-io.ts`) composes now carries a `seal` field —
  `sha256:` and 64 hex digits over the note's bytes without that line — as the last line inside the
  frontmatter fence. The contract (`agent-factory/contracts/context-note.md`) documents the field,
  what it distinguishes, and what it does not.

### Security

- The admission-guard hook's matcher now matches the plugin-scoped tool name
  (`mcp__(plugin_grugops_)?grugops__.*`). Before this change the matcher was the bare server family
  `mcp__grugops__.*`, and the platform's plugin reference states that for a plugin's bundled MCP
  server "a matcher written against the bare server key never fires"
  (https://code.claude.com/docs/en/plugins-reference), so in plugin form the hook did not fire on
  `propose_note` calls and the `human:<name>` stamp was not mechanically gated on that path. The
  bare spelling stays in the alternation for a standalone `.mcp.json` server, which the kit does
  not ship.
- The shared-context reader refuses a note the sanctioned writer did not compose. A note written
  into `.grugops/context/` by any other route (a file-writing tool, a heredoc, an editor) has no
  seal, is not returned by `readContext`, `render`, `currentState`, the compactor's promoted-tier
  carve-out, or any consumer of `readContext`, and is counted under the reader's `unsealed` skip
  arm with its reason (`absent`, `malformed`, `mismatch`). The round-1 live capture of Phase 33 had
  shown nine such notes admitted as memory; the same nine notes are the test fixture that now reads
  as zero. There is no grandfather clause: notes composed by an earlier kit version are not read by
  this one until they are re-admitted through the writer. The seal is unkeyed by necessity — a
  file-based kit holds no secret the constrained process cannot read — so it distinguishes
  hand-composed from writer-composed notes and detects post-write edits; it does not stop a process
  that reimplements the algorithm. That un-forgeable tier is a human decision not taken here.

## [2.1.0] - 2026-09-18

**Autonomous Factory — Real Spawning, Controlled Language & Live Board** (phases 27–32.1, tag
`v2.1`). The first published SemVer release. The milestone made spawning real and derived,
gave every safety claim an id and a mechanical drop, put every human stop on a dial, and added a
read-only live board.

### Added

- Per-role model assignment: a `models` block on the config dial names a stronger model where
  judgment lives and a cheaper one for execution, emitted into every generated adapter; zero-config
  stays byte-identical to the previous behaviour. A second phase delivers the block to an installed
  repository's adapters, so it is no longer inert once installed.
- A per-checkpoint autonomy matrix: every human stop is enumerated and dialable, and the four safety
  floors can be lowered only behind two keys a single agent cannot both hold. Lowering a floor drops
  the public claim that depended on it, by id.
- A claim registry (`docs/audit/28-claim-registry.md`) that maps every public safety claim to the
  floor whose lowering would falsify it, with a gate that keeps each claim byte-identical to its
  anchor.
- A controlled-language writing profile for procedural and agent-written surfaces, a de-duplicated
  role skeleton, and a voice guard that measures voice rather than sentence shape.
- Browser-driven autonomous UAT where the committed Playwright spec is the evidence and the agent's
  narration never is.
- A board projector: one board-grammar authority emits a typed snapshot, rendered live by a
  read-only terminal dashboard (`npm run dashboard`, `--once --json` for scripts) that is proven
  unable to write.
- A `package.json` `version` field, kept in lockstep with `agent-factory/VERSION` and the plugin
  manifest.

### Changed

- Every guard and validator scan set is derived from the filesystem instead of a hand-maintained
  list, and all 17 role adapters are generated from that derived set; the coordinator's spawn
  allowlist is wired only where the runtime honors it.
- `CLAUDE.md` reconciled with the v2.0 architecture (it still described handoff packets and a
  routing Orchestrator).
- Claude Code floor raised to v2.1.219+ (clean nested spawning at depth 3).
- The artifact version moved from the pre-release seed `0.1.0` to `2.1.0`.

### Fixed

- The spawn defect that motivated the milestone: seven role names were granted on the coordinator's
  allowlist while zero matching adapter files existed, because the list was hand-typed. The set is
  now derived and its count asserted.
- Published dashboard text: every content-derived substitution now goes through one refusal-sentence
  builder, and both hand-drawn classification tables were deleted for a single two-sided
  published-equals-owned equality.

### Known open at this release

- Phase 33 (the captured live spawning run that discharges GAP-D1, and a green `windows-latest` CI
  leg) is not in this release.
- Phases 29.1, 31 and 32.1 were closed by named human override with items accepted open; each is
  recorded in `.planning/ROADMAP.md` and the WINDOWS register with a named owner.

## [2.0] - 2026-07-28

The **v2.0 Decentralized Factory — Shared Verified Context** milestone (phases 20–26). This is a
major architecture pivot: it replaces the centralized Orchestrator plus static handoff packets with
a shared, verified, auditable context substrate that parallel agents read and write directly.

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
- Installing a repository now renders that repository's Claude Code sub-agent adapters from that
  repository's own `.grugops/factory.config.json`, so a `models` block finally reaches the adapters
  the repository's session loads; `--check` names every adapter a configuration edit has not been
  re-installed into yet, and a repository whose `models` block is refused keeps the adapters it had
  rather than silently receiving the default assignment. Two consequences are worth stating for
  existing users: every adapter installed before this change is reported stale by `--check` until
  the repository is re-installed, and `--strict` promotes that warning to a failure, so a job
  already running `--check --strict` goes red until the re-run; and a checkout that cannot run the
  render — a partial checkout missing the modules the render needs — now installs no sub-agent
  adapter at all, where before it installed the ones the kit shipped.

### Removed

- The `autonomy` configuration scalar (`diff` / `branch` / `pr`) is retired. It graded three steps
  in prose and no mechanism read it. It is replaced by the per-checkpoint `checkpoints` object,
  whose cells are enforced: each key is one declared human stop and each value is `block`,
  `notify` or `off`. There is no coexistence mode — the structure validator refuses a
  configuration that still carries the retired key, and the refusal names the replacement.

  **Migrating an existing repository.** The translation is mechanical, published as a table in
  `agent-factory/config/factory.config.md`: the old grade split into two independent stops, so
  `diff` becomes `commit_to_branch: block` + `open_pr: block`, `branch` becomes
  `commit_to_branch: off` + `open_pr: block`, and `pr` becomes `commit_to_branch: off` +
  `open_pr: off`. Delete the `autonomy` key and write the two cells its row names.

  **The installer reports; it does not rewrite.** Installing over a repository whose configuration
  still carries the key prints a line naming the key and pointing at the translation table, and
  leaves the file byte-identical. Editing a user's declared intent without asking is the opposite
  of this project's posture, so the edit stays with the human.

_Deferred at this tag: the A3/DOG-02 live dual-path parity retirement waits on a captured live
run (GAP-D1)._

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
