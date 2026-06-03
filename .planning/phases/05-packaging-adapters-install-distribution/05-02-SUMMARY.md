---
phase: 05-packaging-adapters-install-distribution
plan: 02
subsystem: packaging-standalone-claude
tags: [packaging, claude-code, skills, subagent, gemini, single-source, brand]
requires:
  - "agent-factory/packaging/slash-command.template.md (05-01 PKG-02 skill template)"
  - "agent-factory/packaging/subagent.frontmatter.md (05-01 PKG-02 subagent template)"
  - "agent-factory/roles/orchestrator.md (frozen Orchestrator role; Phase 3)"
  - "agent-factory/roles/release-manager.md (frozen Release Manager role; Phase 3)"
  - "agent-factory/workflows/00..13 (frozen lifecycle workflows; Phase 4)"
  - "AGENTS.md (root entry substrate; Phase 3)"
provides:
  - "CLAUDE-01: 7 standalone dash skills /grugops-<op> (.claude/skills/grugops*/SKILL.md)"
  - ".claude/agents/grugops-orchestrator.md (per-role subagent wrapper, Agent + model: inherit)"
  - "CLAUDE.md repo-root one-line additive pointer to AGENTS.md / orchestrator.md"
  - ".gemini/settings.json context.fileName wiring (Gemini reads AGENTS.md)"
affects:
  - "Phase-5 check-structure.sh CLAUDE-01 check now GREEN"
  - "Standalone .claude/ distribution surface (the on-brand dash primary surface, D-29)"
tech-stack:
  added: []
  patterns:
    - "Pointer-only SKILL.md (single-source D-31): body cites frozen agent-factory/ paths, never copies role/workflow text"
    - "disable-model-invocation: true on the destructive grugops-release skill (T-05-02-EoP-1 mitigation)"
    - "Idempotent ensure-block append to a user-owned file via unique sentinel markers (T-05-02-Tamper-2 mitigation)"
    - "Gemini context.fileName array (D-35) rather than a GEMINI.md pointer"
key-files:
  created:
    - ".claude/skills/grugops/SKILL.md"
    - ".claude/skills/grugops-map/SKILL.md"
    - ".claude/skills/grugops-plan/SKILL.md"
    - ".claude/skills/grugops-ticket/SKILL.md"
    - ".claude/skills/grugops-gate/SKILL.md"
    - ".claude/skills/grugops-uat/SKILL.md"
    - ".claude/skills/grugops-release/SKILL.md"
    - ".claude/agents/grugops-orchestrator.md"
    - ".gemini/settings.json"
  modified:
    - "CLAUDE.md"
decisions:
  - "CLAUDE.md pointer appended via GSD:grugops-start-here sentinel block (idempotent ensure-line; existing dev-instructions content preserved, never overwritten)"
  - "All 7 skill bodies use repo-relative pointer-text only — no ../ filesystem path (broken in plugin cache) and no copied role/workflow body"
  - ".gemini/settings.json created fresh (no pre-existing file to merge into) with context.fileName ['AGENTS.md','GEMINI.md']"
metrics:
  duration: 16m
  completed: 2026-06-03
  tasks: 2
  files: 10
---

# Phase 5 Plan 02: Standalone `.claude/` Distribution Form Summary

Shipped CLAUDE-01: seven thin pointer **skills** invoked with the dash (`/grugops`, `/grugops-map`, `/grugops-plan`, `/grugops-ticket`, `/grugops-gate`, `/grugops-uat`, `/grugops-release`), a per-role subagent wrapper (`Agent` + `model: inherit`), an additive idempotent repo-root `CLAUDE.md` pointer, and Gemini `context.fileName` wiring — all single-source pointers to the frozen `agent-factory/` core, never copies.

## What Was Built

**Task 1 — 7 standalone dash skills (`.claude/skills/grugops*/SKILL.md`):**
Each instantiates the 05-01 `slash-command.template.md` shape: `name`/`description`/`argument-hint: "<request>"`/`allowed-tools` (YAML list including `Agent`) frontmatter, plus a repo-relative pointer-text body that names `agent-factory/roles/orchestrator.md`, the read order (config → AGENTS.md → board), and the op's frozen workflow, ending with `Request: $ARGUMENTS`. The directory name *is* the whole command (dash, no colon — Pitfall 5), so each dir carries the full `grugops-` prefix. Op → workflow map:

| Skill | Frozen workflow it points at |
|-------|------------------------------|
| `grugops` | Orchestrator dispatcher (any request → matching `agent-factory/workflows/`) |
| `grugops-map` | `00-bootstrap-greenfield.md` / `01-bootstrap-brownfield.md` |
| `grugops-plan` | `02-idea-to-epics.md` / `03-epic-to-tickets.md` |
| `grugops-ticket` | `04-ticket-to-pr.md` |
| `grugops-gate` | `05-pr-quality-gate.md` |
| `grugops-uat` | `06-uat-pack.md` |
| `grugops-release` | `12-release.md` via `release-manager.md` |

`grugops-release` carries `disable-model-invocation: true` so the agent can never auto-fire a release — only a human invokes it (complements the SAFE-02 mechanical deploy guard from 05-04). The never-merge / never-deploy-prod hard limit is echoed in **clear voice** in every skill body.

**Task 2 — subagent wrapper + CLAUDE.md pointer + Gemini wiring:**
- `.claude/agents/grugops-orchestrator.md` instantiates the 05-01 `subagent.frontmatter.md` shape: `name: grugops-orchestrator`, a clear "use for any SDLC delivery request" description, `tools: Read, Grep, Glob, Bash, Edit, Write, Agent` (uses `Agent`, never the legacy `Task`), `model: inherit`, and a pointer-only body that reads `agent-factory/roles/orchestrator.md` then acts as the Orchestrator.
- `CLAUDE.md` (repo root) gained ONE additive, sentinel-delimited pointer line (`grugops — start here: read AGENTS.md, then agent-factory/roles/orchestrator.md`). The pre-existing grugops dev-instructions content is fully preserved — the line is appended after `<!-- GSD:profile-end -->` inside a `GSD:grugops-start-here` block so re-running adds no duplicate.
- `.gemini/settings.json` created with `{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }`, wiring Gemini CLI to read the portable `AGENTS.md` (D-35).

## Verification

Plan-level checks all pass:
- `ls .claude/skills/grugops*/SKILL.md | wc -l` == **7**; `grugops-release` has `disable-model-invocation: true`.
- Subagent wrapper uses `Agent` + `model: inherit`, contains no `Task`.
- Repo-root `CLAUDE.md` keeps its `## Project` content and gains exactly one pointer line (opener/closer/pointer each appear exactly once → idempotent).
- `.gemini/settings.json` is valid JSON with `AGENTS.md` in `context.fileName`.
- **Dup-check (single-source):** the distinctive orchestrator sentence `"You enforce WIP limits."` returns **0 hits** under `.claude/skills/`. No skill body references a `../agent-factory/...` filesystem path.

Phase-5 structural harness: `[CLAUDE-01] 7 standalone dash skills` is now **GREEN** ("exactly 7 standalone grugops* skills present"). `[PKG-02]` confirms `model: inherit`. (`CLAUDE-02`/`CLAUDE-03` remain RED — those are the plugin form, out of this plan's scope: plans 05-03/05-04.)

## Threat Mitigations Applied

| Threat ID | Mitigation in this plan |
|-----------|-------------------------|
| T-05-02-Tamper-1 (skill copies role text → drift) | Pointer-text only; dup-check grep returns 0 hits under `.claude/skills/` |
| T-05-02-Tamper-2 (overwrite user-owned CLAUDE.md) | Idempotent sentinel-block append; never `>`; existing content preserved and verified |
| T-05-02-EoP-1 (agent auto-fires a release) | `disable-model-invocation: true` on `grugops-release` |

## Deviations from Plan

None — plan executed exactly as written. The plan's idempotency requirement was honored via a unique `GSD:grugops-start-here` sentinel block; `.gemini/settings.json` had no pre-existing file so it was created fresh (the plan's "merge additively if it already exists" branch did not apply).

## Known Stubs

None. All artifacts are live pointer files wired to existing frozen targets (verified present: `agent-factory/roles/orchestrator.md`, `release-manager.md`, all `agent-factory/workflows/00..13`, `agent-factory/config/factory.config.json`, root `AGENTS.md`, `plans/board.md`).

## Commits

- `9793fcb` feat(05-02): author 7 standalone dash skills (.claude/skills/grugops*)
- `8856439` feat(05-02): subagent wrapper + additive CLAUDE.md pointer + Gemini wiring

## Self-Check: PASSED

All 10 created/modified artifacts exist on disk; both task commits (`9793fcb`, `8856439`) are present in git history.
