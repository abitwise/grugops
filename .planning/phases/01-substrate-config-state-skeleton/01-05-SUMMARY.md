---
phase: 01-substrate-config-state-skeleton
plan: 05
subsystem: version-seed-and-readme
tags: [docs, version, readme, struct-02]
requires:
  - "agent-factory/ scaffold (Plan 01)"
  - "agent-factory/config/factory.config.json#version = 0.1.0 (Plan 02)"
  - "frozen path: agent-factory/roles/orchestrator.md"
  - "frozen path: plans/board.md, plans/traceability.md"
provides:
  - "agent-factory/VERSION (working version seed 0.1.0)"
  - "agent-factory/README.md (full usage guide: 5-tool dispatch table + copy-paste Orchestrator prompts)"
affects:
  - "Phase 3 (AGENTS.md substrate + role bodies the README points at)"
  - "Phase 4 (workflow bodies the README's prompts invoke)"
  - "Phase 5 (per-tool adapters + installers the README references)"
tech-stack:
  added: []
  patterns:
    - "Clear/professional voice for docs (grug caveman voice reserved for Phase-3 role prompts)"
    - "Honest later-phase deferral: reference frozen paths, state not-yet-existing deliverables plainly"
key-files:
  created:
    - "agent-factory/VERSION"
    - "agent-factory/README.md"
  modified: []
decisions:
  - "D-02 applied: VERSION seeded to 0.1.0 (not spec example 2.0.0); matches factory.config.json#version"
  - "D-06 applied: README written fully now (satisfies STRUCT-02); start-here -> orchestrator.md; AGENTS.md noted as Phase-3 deliverable"
  - "D-05 honored: README does not claim root AGENTS.md exists; explicitly states it lands in Phase 3"
metrics:
  duration: "~4m"
  completed: 2026-06-02
---

# Phase 01 Plan 05: Version Seed and README Summary

Seeded `agent-factory/VERSION` to the working `0.1.0` value and wrote the complete
`agent-factory/README.md` usage guide — a 5-tool dispatch table plus all copy-paste
Orchestrator prompts — fully satisfying STRUCT-02 using only this phase's frozen paths.

## What Was Built

### Task 1: `agent-factory/VERSION` = 0.1.0 (commit `abcc625`)

A single-line SemVer seed `0.1.0`, per D-02 (deliberately diverging from the spec's example
`2.0.0`; the final string is a Phase-5 decision). Verified to match
`agent-factory/config/factory.config.json#version` (also `0.1.0`) — the key-link required by
the plan holds.

### Task 2: `agent-factory/README.md` full usage guide (commit `d1ef00f`)

A complete usage guide in clear/professional voice (97 non-blank lines, well above the
40-line floor), with:

1. **Intro** — what grugops / the agent factory is, in plain English.
2. **Start here** — points at the frozen path `agent-factory/roles/orchestrator.md`, with an
   explicit NOTE that the portable root `AGENTS.md` substrate lands in Phase 3 (D-05/D-06)
   and that role/workflow bodies ship in Phases 3–4 — stated honestly, never implied present.
3. **Usage across the five tools** — a table mapping Claude Code, Codex CLI, Gemini CLI,
   OpenCode, and GitHub Copilot CLI to their entry file + dispatch mode, with the single rule
   "only the dispatch differs, never the content" (Claude Code spawns sub-agents; the other
   four load roles sequentially). Notes the detailed adapters ship in Phase 5.
4. **Configuration** — the dial at `factory.config.json` (documented in `factory.config.md`),
   zero-config baseline `mode=lean`, `cadence=kanban`, `autonomy=pr`.
5. **How work flows** — `plans/board.md` (WIP board), `plans/traceability.md` (trace matrix),
   and the lifecycle, each in a sentence or two, referencing frozen paths.
6. **Copy-paste Orchestrator prompts** — reproduces the spec §17.2 prompts: bootstrap
   brownfield, plan greenfield idea, refine backlog (07), plan sprint (08), daily sweep (09),
   implement ticket via ticket-to-pr (04), PR quality gate (05), UAT pack (06), prepare
   release (12), each copy-paste usable.
7. **Install** — the "just install the markdown" minimal path plus a note that the installers
   under `install/` ship in Phase 5; tool-specific commands marked `UNKNOWN - verify`.

## Verification

- Plan automated check for VERSION: `VERSION_OK` (trimmed content == `0.1.0`).
- Plan automated check for README: `README_OK` (file exists, all five tools named, all eight
  prompts present, `mode=lean` mentioned, ≥40 non-blank lines).
- Voice/brand checks: `NO_CAVEMAN_VOICE`, `BRAND_LOWERCASE_OK` (no uppercase `Grugops`).
- Key-link: `VERSION` 0.1.0 == `factory.config.json#version` 0.1.0 → `LINK_OK`.
- No file deletions in either commit; no new untracked files attributable to this plan
  (only the pre-existing `.claude/` tooling dir remains untracked, out of scope).

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, or blocking issues
encountered. No authentication gates. No architectural decisions required.

## Known Stubs

None. The README intentionally references later-phase deliverables (root `AGENTS.md`, role
bodies, workflow bodies, per-tool adapters, installers) and states plainly that each lands in
a named future phase rather than implying it exists — this is the honest-deferral pattern
mandated by D-05/D-06 and the no-fabrication constraint, not a stub.

## Threat Flags

None. This plan creates plain markdown and a SemVer string only — no executable code, no
network, no auth, no untrusted input, no secrets. The threat register's only `mitigate`
item (T-01-07, no-fabrication in README prompts/commands) is satisfied: no commands were
invented and tool-specific unknowns are marked `UNKNOWN - verify`.

## Self-Check: PASSED

- FOUND: agent-factory/VERSION
- FOUND: agent-factory/README.md
- FOUND: .planning/phases/01-substrate-config-state-skeleton/01-05-SUMMARY.md
- FOUND commit: abcc625 (VERSION)
- FOUND commit: d1ef00f (README)
