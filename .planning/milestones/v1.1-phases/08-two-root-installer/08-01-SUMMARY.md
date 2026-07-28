---
phase: 08-two-root-installer
plan: 01
subsystem: packaging-docs-seed
tags: [packaging, seed, config-path, kit-ref-gate, no-spawn]
requires: []
provides:
  - "agent-factory/seed/** — self-contained kit-bundled state-plane seed (config + plans/** + memory-bank/**), the source Wave-2's seed_state step copies into a target"
  - "Packaging templates that grant no spawn tool (single-window sequential role-load)"
  - "README + factory.config.md pointing the runtime config read at .grugops/factory.config.json"
  - "scripts/check-kit-refs.sh documented exclusion of agent-factory/seed/"
affects:
  - "Wave 2 (installer rewrite) — has a real seed source at $KIT_ROOT/seed/ to copy from"
  - "Any regenerated Claude Code adapter — cannot re-introduce the Agent spawn grant"
tech-stack:
  added: []
  patterns:
    - "Faithful-copy seed bundle (byte-identical to canonical skeletons, no transformation)"
    - "Explicit-allowlist gate exclusion (the exclusion IS the not-listing; a header comment records why)"
key-files:
  created:
    - agent-factory/seed/.grugops/factory.config.json
    - agent-factory/seed/plans/board.md
    - agent-factory/seed/plans/traceability.md
    - agent-factory/seed/plans/nfr-catalog.md
    - agent-factory/seed/plans/metrics.md
    - agent-factory/seed/plans/epics/.gitkeep
    - agent-factory/seed/plans/features/.gitkeep
    - agent-factory/seed/plans/tickets/.gitkeep
    - agent-factory/seed/plans/sprints/.gitkeep
    - agent-factory/seed/plans/releases/.gitkeep
    - agent-factory/seed/memory-bank/00-index.md
    - agent-factory/seed/memory-bank/10-project-brief.md
    - agent-factory/seed/memory-bank/20-product.md
    - agent-factory/seed/memory-bank/30-architecture.md
    - agent-factory/seed/memory-bank/40-contributing.md
    - agent-factory/seed/memory-bank/50-decisions/ADR-template.md
    - agent-factory/seed/memory-bank/60-progress.md
    - agent-factory/seed/memory-bank/70-runbook.md
    - agent-factory/seed/memory-bank/80-glossary.md
  modified:
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/packaging/slash-command.template.md
    - agent-factory/README.md
    - agent-factory/config/factory.config.md
    - scripts/check-kit-refs.sh
decisions:
  - "D-08/WR-05: packaging templates grant no spawn tool — single-window sequential role-load (_role-switch-protocol.md) is the design, NOT sub-agent spawning"
  - "D-09/IN-01: runtime config read points at .grugops/factory.config.json; agent-factory/config/factory.config.json is preserved as the named seed source"
  - "D-01/D-02: seed bundle lives top-level at agent-factory/seed/ (not under packaging/, which is in SCAN); config seed is a byte-identical copy of the kit default"
  - "D-03: agent-factory/seed/ is excluded from check-kit-refs.sh by not-listing it; a header comment records why (seed refs resolve in the TARGET, not the kit root)"
metrics:
  duration: 3m
  completed: 2026-06-07
  tasks: 2
  files: 24
---

# Phase 08 Plan 01: Packaging/Docs/Seed Pre-Work Summary

Dropped the `Agent` spawn grant from both packaging templates, corrected the stale `agent-factory/config/` runtime-config prose to `.grugops/factory.config.json` (preserving the seed-source FILE mention), and bundled a self-contained `agent-factory/seed/**` state-plane seed that the gate intentionally excludes — all installer-independent so Wave 2 has a real seed source and a clean exclusion before any target-relative seed prose lands.

## What Was Built

### Task 1 — Drop the Agent grant + fix stale config-path prose (D-08/WR-05, D-09/IN-01)
- `agent-factory/packaging/subagent.frontmatter.md`: `tools:` line changed from `Read, Grep, Glob, Bash, Edit, Write, Agent` to `Read, Grep, Glob, Bash, Edit, Write` (matching the live `grugops-orchestrator.md` adapter). The intro prose and the per-field bullet were rewritten to explain single-window sequential role-load via `_role-switch-protocol.md` (one window, drop prior context, the handoff is the only memory) instead of spawning. The body's role-activation sentence now mirrors the live adapter's role-switch-protocol phrasing. The legal `${GRUGOPS_HOME:-$HOME/.grugops}` self-heal line was left intact (this template is the resolver-mirroring file excluded from the GH_SCAN).
- `agent-factory/packaging/slash-command.template.md`: removed the `- Agent` entry from BOTH `allowed-tools` lists (the plan skill and the release skill), and rewrote the notes bullet to reflect no-spawn / sequential role-load.
- `agent-factory/README.md`: the start-here block now reads `.grugops/factory.config.json` at runtime; the Configuration section names `.grugops/factory.config.json` as the runtime dial while explicitly keeping `agent-factory/config/factory.config.json` as the seed source the installer seeds.
- `agent-factory/config/factory.config.md`: line 3 now states the Orchestrator reads `.grugops/factory.config.json` first on every run, this doc is the field reference, and the kit ships the lean default at `agent-factory/config/factory.config.json` as the seed source.

### Task 2 — Bundle the kit seed subtree + gate exclusion (D-01/D-02/D-03)
- Created top-level `agent-factory/seed/` (NOT under `packaging/`, which is in SCAN) as a faithful copy of the canonical skeletons:
  - `.grugops/factory.config.json` — byte-identical copy of the kit default `agent-factory/config/factory.config.json`.
  - `plans/` — `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` plus the five placeholder dirs `epics/ features/ tickets/ sprints/ releases/` each carrying a `.gitkeep`. No `plans/handoffs/` bundled (runtime dir; Wave 2 mkdirps it in the target).
  - `memory-bank/` — all nine files `00-index.md` … `80-glossary.md` including `50-decisions/ADR-template.md`.
- `scripts/check-kit-refs.sh`: added a header-block comment documenting that `agent-factory/seed/` is an intentional exclusion (seed `.grugops/…` / `plans/…` refs resolve in the TARGET, not the kit root — D-03). No seed path was added to `SCAN` or `GH_SCAN`; the exclusion is the not-listing.

## Verification Evidence

- Task 1 automated assertion bundle: PASS (`grep -c ', Agent'` == 0; no bare `- Agent` line; `GRUGOPS_HOME` preserved in subagent.frontmatter.md; both config docs contain `.grugops/factory.config.json`).
- Task 2 automated assertion bundle: PASS (config seed `cmp -s` byte-identical to kit default; all four `plans/*.md` and all nine `memory-bank/**` files byte-identical to their repo-root sources; five `.gitkeep` markers present; neither `SCAN=` nor `GH_SCAN=` contains `agent-factory/seed`; header comment names `seed` as exclusion).
- `sh scripts/check-kit-refs.sh` → `ALL CHECKS PASSED`, exit 0 (with the seed subtree present).
- `sh install/install.test.sh` → `ALL CHECKS PASSED`, exit 0 (7-check regression guard unaffected by this plan).

## Deviations from Plan

None — plan executed exactly as written. (Rules 1–4 not triggered; no bugs, missing critical functionality, blocking issues, or architectural changes encountered.)

## Authentication Gates

None.

## Known Stubs

None. The seed's `.gitkeep` files are intentional content-empty directory markers (mirroring the repo's `plans/` skeleton), not unwired stubs.

## Self-Check: PASSED

- FOUND: agent-factory/seed/.grugops/factory.config.json
- FOUND: agent-factory/seed/plans/board.md
- FOUND: agent-factory/seed/memory-bank/00-index.md
- FOUND: agent-factory/seed/memory-bank/50-decisions/ADR-template.md
- FOUND: agent-factory/packaging/subagent.frontmatter.md (Agent grant removed)
- FOUND commit: c22212b (fix(08-01) packaging templates + config-path prose)
- FOUND commit: b552c3a (feat(08-01) seed subtree + gate exclusion)
