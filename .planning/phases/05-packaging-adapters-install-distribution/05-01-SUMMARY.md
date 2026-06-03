---
phase: 05-packaging-adapters-install-distribution
plan: 01
subsystem: packaging
tags: [packaging, adapters, templates, dispatch, structural-harness, single-source]
requires:
  - agent-factory/roles/orchestrator.md (frozen pointer target)
  - agent-factory/README.md (5-tool table shape + slogan analog)
  - AGENTS.md (entry-rule sentence)
  - agent-factory/VERSION (0.1.0)
  - .planning/phases/04-workflows-cadence-backpressure/check-structure.sh (harness skeleton)
provides:
  - agent-factory/packaging/adapters.md (PKG-01 5-tool dispatch map)
  - agent-factory/packaging/subagent.frontmatter.md (PKG-02 subagent wrapper template)
  - agent-factory/packaging/slash-command.template.md (PKG-02 skill SKILL.md template)
  - .planning/phases/05-packaging-adapters-install-distribution/check-structure.sh (Phase-5 structural harness, ships RED)
affects:
  - all downstream Phase-5 wrappers/installers (cite adapters.md + the two templates)
  - the Phase-5 acceptance gate (every later plan's structural verify runs this harness)
tech-stack:
  added: []
  patterns:
    - "Pointer-only adapters/templates (single-source; never copy role text)"
    - "Agent (not legacy Task) + model: inherit in Claude Code wrappers"
    - "Dash-standalone vs colon-plugin skill naming asymmetry recorded once"
    - "RED-shipping structural harness cloned from the Phase-3/4 house style"
key-files:
  created:
    - agent-factory/packaging/adapters.md
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/packaging/slash-command.template.md
    - .planning/phases/05-packaging-adapters-install-distribution/check-structure.sh
  modified: []
decisions:
  - "adapters.md is the authoritative current dispatch map; the README's pre-D-29 CC row is explicitly superseded"
  - "Every adapters.md tool row flagged 'verify against current ... docs' (6 occurrences; Copilot row flagged for current Copilot CLI docs per A3)"
  - "Templates record the skills/ form (D-29) and the dash/colon naming asymmetry once, so both forms stay consistent"
  - "Phase-5 harness ships RED: PKG-01/02 pass after Tasks 1-2; CLAUDE/SAFE/INSTALL fail cleanly until Waves 2-3 land"
metrics:
  duration: 3m
  completed: 2026-06-03
  tasks: 3
  files: 4
---

# Phase 5 Plan 01: Packaging Decision Layer Summary

Authored the packaging-decision layer that every downstream Phase-5 wrapper and installer cites: the authoritative 5-tool dispatch map (`adapters.md`), the two PKG-02 wrapper templates (`subagent.frontmatter.md`, `slash-command.template.md`) that fix the `Agent` / `model: inherit` / `skills/` conventions once, and the Phase-5 structural harness that ships RED and goes green as Waves 2-3 land.

## What Was Built

### Task 1 — `agent-factory/packaging/adapters.md` (PKG-01)
The current, authoritative 5-tool dispatch map. A single table maps Claude Code, Codex CLI, Gemini CLI, OpenCode, and GitHub Copilot CLI to **entry file → dispatch mode → adapter → verify**. It restates both slogans verbatim in prose framing ("All work starts at `agent-factory/roles/orchestrator.md`." and "only the dispatch differs, never the content."), flags every row "verify against current tool docs" (6 occurrences; the Copilot row points at current Copilot **CLI** docs per research A3), and carries a clear-voice section documenting that the mechanical prod-deploy guard (SAFE-02) is Claude-Code-only (plugin hooks) while the other four tools rely on the `autonomy=pr` + `production_requires_human_confirmation` procedural fallback. It cites the `code.claude.com` doc host only, stays lowercase `grugops`, and copies no role body (pointer-only). It explicitly notes it supersedes the README's pre-D-29 Claude Code row.

### Task 2 — the two PKG-02 wrapper templates
- **`subagent.frontmatter.md`** — a copy-ready standalone sub-agent wrapper: frontmatter `name` / `description` / `tools: Read, Grep, Glob, Bash, Edit, Write, Agent` / `model: inherit`, and a thin pointer body that reads `agent-factory/roles/orchestrator.md` then config / AGENTS.md / board, then acts as the role. It uses `Agent` and contains no legacy `Task` token (verified `grep -qw "Task"` fails). The never-merge / never-deploy-prod hard limit is echoed in clear voice.
- **`slash-command.template.md`** — a copy-ready skill `SKILL.md` template: frontmatter `name` / `description` / `argument-hint` / `allowed-tools` (a YAML list including `Agent`), and a repo-relative `$ARGUMENTS` pointer body referencing `orchestrator.md` + the workflow file. It records the `skills/` form choice (D-29) and the dash-standalone (dir carries `grugops-` prefix) vs colon-plugin (dir omits it; plugin name supplies the prefix) naming asymmetry, and notes `disable-model-invocation: true` on the destructive `grugops-release`. Pointer-only, no copied role text.

### Task 3 — `check-structure.sh` (Phase-5 structural harness, ships RED)
Cloned the Phase-4 harness skeleton verbatim (`#!/usr/bin/env sh`, `set -eu`, `FAILS=0`, `pass()`/`fail()` helpers, `printf` not `echo -e`, exit 0 on green / exit 1 with a count on RED). Encodes one labeled check per Phase-5 requirement: **PKG-01, PKG-02, CLAUDE-01, CLAUDE-02, CLAUDE-03, SAFE-02, INSTALL-01, INSTALL-02**, plus a pointer-only dup-check. The PKG-01/PKG-02 checks PASS after Tasks 1-2; the CLAUDE/SAFE/INSTALL checks FAIL cleanly with "Wave not landed" messages — the harness ships RED by design (`rc=1`, not a shell error). The count gate filters comment lines (`grep -v '^#'`) before `grep -c`; the header documents the Phase-6 Node validator as `UNKNOWN - verify` and never invokes it.

## Verification

- All four files exist (`adapters.md`, `subagent.frontmatter.md`, `slash-command.template.md`, `check-structure.sh`).
- The harness runs (`sh check-structure.sh` → exit 1, RED expected); `sh -n` reports no syntax error.
- PKG-01 chain: `grep -q "only the dispatch differs"` ✓, ≥5 "verify against current ... docs" (6) ✓, `orchestrator.md` ✓, `autonomy=pr` ✓, `! grep -q "docs.claude.com"` ✓.
- PKG-02 chain: `Agent` present ✓, `! grep -qw "Task"` ✓, `model: inherit` ✓, skill `name:` + `orchestrator.md` ✓.
- Single-source: dup-check for a distinctive Orchestrator role sentence returns 0 hits in all packaging files.
- No `docs.claude.com` in any authored file; `Task` token absent from the subagent template.

## Deviations from Plan

None — plan executed exactly as written. One minor in-flight correction (not a deviation requiring a rule): the adapters.md prose initially named the redirecting `docs.claude.com` host as a negative example, which tripped the `! grep -q "docs.claude.com"` acceptance check; rephrased to reference the `code.claude.com` host positively so the literal forbidden string never appears. Fixed before the Task 1 commit.

## Notes for Downstream Waves

- The PKG checks in `check-structure.sh` are now the green anchor; Wave 2 (standalone `.claude/skills/` + plugin `.claude-plugin/` + root `skills/`) and Wave 3 (`hooks/` guard + installers) turn the remaining checks green as their artifacts land.
- `adapters.md` and the two templates are the contract those wrappers must cite: `Agent` not `Task`, `model: inherit`, repo-relative pointer bodies, dash-standalone vs colon-plugin dir naming, `disable-model-invocation` on `grugops-release`.
- The CLAUDE-02 `.claude-plugin/`-clean check currently PASSES because the dir holds only `.gitkeep` (filtered); Wave 2 must keep only `plugin.json` + `marketplace.json` there (components at plugin root) to keep it green.

## Self-Check: PASSED

- FOUND: agent-factory/packaging/adapters.md
- FOUND: agent-factory/packaging/subagent.frontmatter.md
- FOUND: agent-factory/packaging/slash-command.template.md
- FOUND: .planning/phases/05-packaging-adapters-install-distribution/check-structure.sh
- FOUND commit 0efd19c (adapters.md / PKG-01)
- FOUND commit 3bb1903 (templates / PKG-02)
- FOUND commit 18c70ac (harness / ships RED)
