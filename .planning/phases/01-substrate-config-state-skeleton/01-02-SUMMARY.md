---
phase: 01-substrate-config-state-skeleton
plan: 02
subsystem: config-dial
tags: [config, factory-config, zero-config, lean-defaults]
requires:
  - "01-01: config/ directory scaffold (agent-factory/config/)"
provides:
  - "agent-factory/config/factory.config.json — populated lean config dial (frozen §15 field names)"
  - "agent-factory/config/factory.config.md — human-readable field reference + zero-config defaults"
affects:
  - "All later roles/workflows that cite config field names (Phases 3–5)"
tech-stack:
  added: []
  patterns:
    - "Config dial is visible + editable JSON with a documented zero-config fallback"
    - "Defaults live in the docs/roles, not only in the file — deleting the JSON preserves lean/kanban/pr behavior"
key-files:
  created:
    - "agent-factory/config/factory.config.json"
    - "agent-factory/config/factory.config.md"
  modified: []
decisions:
  - "version seeded to 0.1.0 (D-02 — deliberate divergence from the spec's 2.0.0 example; final string is a Phase-5 decision)"
  - "id_prefix is the generic placeholder ABC (D-04 — kit template, no grugops-specific tickets)"
  - "factory.config.md is a concise field/allowed-values/default/meaning table (D-07 — no per-field example prose)"
metrics:
  duration: "1m47s"
  completed: "2026-06-02T19:12:59Z"
  tasks: 2
  files: 2
---

# Phase 01 Plan 02: Config Dial Summary

The config dial is frozen and populated: `factory.config.json` carries every spec §15 field with lean defaults (version=0.1.0, id_prefix=ABC), and its `factory.config.md` twin documents every field plus the zero-config lean/kanban/pr baseline that holds even when the JSON is absent.

## What Was Built

- **`agent-factory/config/factory.config.json`** — the editable lean config dial. Contains all 17 spec §15 top-level fields (`version`, `mode`, `cadence`, `autonomy`, `id_prefix`, `repo_strategy`, `default_stack`, `wip_limits`, `sprint_length_days`, `sizing`, `priority_scheme`, `quality`, `nfr`, `compliance_regime`, `environments`, `production_requires_human_confirmation`, `blocked_escalation_days`) with the §15 lean values. Two values are fixed by decision: `version=0.1.0` (D-02) and `id_prefix=ABC` (D-04). `wip_limits` carries all ten column keys; `default_stack`, `quality`, `nfr` carry their full §15 sub-keys. `production_requires_human_confirmation=true`. No secrets.
- **`agent-factory/config/factory.config.md`** — the human-readable twin. A concise field/allowed-values/default/one-line-meaning table (per D-07) with one row per top-level field, plus sub-field tables for `default_stack`, `wip_limits`, `quality`, and `nfr`. A "Zero-config defaults" section documents the lean baseline (`mode=lean`, `cadence=kanban`, `autonomy=pr`) and states that these documented defaults — not the file alone — are what a reader relies on when no config is present. Written in clear professional voice with lowercase `grugops` (grug caveman voice is reserved for Phase-3 role prompts).

## How It Was Verified

- **Task 1 (JSON):** `node -e` parse asserted the full §15 field set, the fixed decision values (version=0.1.0, mode=lean, cadence=kanban, autonomy=pr, id_prefix=ABC, prod-confirm=true), and all ten `wip_limits` column keys → printed `CONFIG_JSON_OK`. A follow-up check confirmed no extra-vs-spec fields and no secrets/tokens/credentials.
- **Task 2 (MD):** Field-presence loop confirmed all 17 field names appear, and the three zero-config defaults (`mode=lean`, `cadence=kanban`, `autonomy=pr`) are documented → printed `CONFIG_MD_OK`.
- **Zero-config proof (CONFIG-03):** Renamed `factory.config.json` aside, confirmed it was absent, re-ran the three default greps against the `.md` (all matched independent of the JSON), then restored the JSON intact (`git diff` empty, JSON re-parsed valid). The documented lean/kanban/pr defaults survive the absence of the file.

## Requirements Satisfied

- **CONFIG-01:** populated `factory.config.json` with all required §15 fields.
- **CONFIG-02:** `factory.config.md` documents the meaning of every field.
- **CONFIG-03:** documented lean/kanban/pr defaults hold with zero config present (proven by the rename-aside/restore check).

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered; no architectural decisions required.

## Authentication Gates

None.

## Known Stubs

None. The `id_prefix=ABC` value is the intentional generic kit-template placeholder (D-04), not an unresolved stub — real prefixes are exercised only at the Phase-6 dogfood on a throwaway repo.

## Self-Check: PASSED

- FOUND: agent-factory/config/factory.config.json
- FOUND: agent-factory/config/factory.config.md
- FOUND commit: aed3867 (feat(01-02): populate factory.config.json with lean defaults)
- FOUND commit: c950399 (docs(01-02): add factory.config.md field reference + zero-config defaults)
