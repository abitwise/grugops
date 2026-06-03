---
phase: 05-packaging-adapters-install-distribution
plan: 04
subsystem: infra
tags: [claude-code, hooks, pretooluse, deploy-guard, nodejs, safety, posix]

# Dependency graph
requires:
  - phase: 01-substrate-config-state-skeleton
    provides: "factory.config.json environments + production_requires_human_confirmation (the config the guard pairs with)"
  - phase: 05-packaging-adapters-install-distribution (plan 01)
    provides: "Phase-5 packaging decision layer (D-32/33/34, D-37) the guard implements"
provides:
  - "hooks/guard.mjs — pure-Node SAFE-02 PreToolUse prod-deploy guard (deny-JSON, env-var check, inline-self-set refusal, fail-closed)"
  - "hooks/hooks.json — plugin-level PreToolUse Bash matcher wiring the guard via ${CLAUDE_PLUGIN_ROOT}"
  - "hooks/guard.test.sh — POSIX behavioral triad harness (deny / allow / refuse-self-set + fail-closed)"
affects: [plugin-form, install, dogfood, validator, security]

# Tech tracking
tech-stack:
  added: []  # Node stdlib + POSIX sh only — zero dependencies (D-34, no jq, no npm install)
  patterns:
    - "Claude Code plugin-level PreToolUse hook → exit-0 + JSON permissionDecision deny"
    - "Fail-closed, agent-unforgeable safety: human-set process-env approval var, no self-approval"
    - "${CLAUDE_PLUGIN_ROOT}-relative hook command (no hardcoded absolute path)"
    - "POSIX house-style behavioral harness (#!/usr/bin/env sh, set -eu, pass/fail, exit 0/1)"

key-files:
  created:
    - hooks/guard.mjs
    - hooks/hooks.json
    - hooks/guard.test.sh
  modified: []

key-decisions:
  - "Approval env var named GRUGOPS_PROD_DEPLOY_APPROVED (A2 placeholder accepted as-is)"
  - "Default deploy-pattern set as anchored regexes (\\b word boundaries) covering kubectl/helm/terraform/gcloud/aws/serverless+sls/flyctl+fly/vercel --prod/npm publish (A4)"
  - "Self-approval detection matches both `export VAR=` and assignment-prefix `VAR= <cmd>` and `env VAR=` forms"
  - "Guard fails closed by treating unparseable/empty stdin as an empty command (allows only non-deploys; a matched deploy must be well-formed JSON to be evaluated, and that path is gated)"

patterns-established:
  - "Mechanical safety as code: a PreToolUse deny cannot be overridden by a prompt (SAFE-02)"
  - "Pure-Node guard reusing the install.mjs runtime — no jq, no deps (D-34)"
  - "Behavioral triad harness as the HIGH-severity gate, runnable from repo root"

requirements-completed: [SAFE-02]

# Metrics
duration: 7min
completed: 2026-06-03
---

# Phase 5 Plan 04: SAFE-02 Mechanical Prod-Deploy Guard Summary

**Pure-Node Claude Code PreToolUse guard that denies config-matched production-deploy commands unless a human-set `GRUGOPS_PROD_DEPLOY_APPROVED` env var is present, refuses any command that inline-sets that var, fails closed on bad input, and is wired at plugin level via `${CLAUDE_PLUGIN_ROOT}` — with a green deny/allow/refuse-self-set behavioral triad.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-03
- **Completed:** 2026-06-03
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments
- `hooks/guard.mjs`: pure-Node (stdlib only) PreToolUse guard that reads `tool_input.command` from stdin JSON and emits `permissionDecision: "deny"` (exit 0 + JSON) for matched prod-deploy commands absent the human approval env var.
- Agent-unforgeable approval: the guard reads the approval var from its own `process.env` (human-set in the launching shell) AND refuses any command that tries to `export`/assign/`env`-set the var inline — the agent can never self-approve (D-33).
- Fails closed: malformed/empty stdin is handled without throwing and never crash-allows a matched deploy.
- `hooks/hooks.json`: plugin-level PreToolUse `Bash` matcher invoking `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"` — valid JSON, no hardcoded `/Users/`/`/home/` path, plugin-level only (never subagent frontmatter, which silently ignores hooks).
- `hooks/guard.test.sh`: POSIX house-style harness running the deny / allow / refuse-self-set triad plus default-set coverage and malformed/empty fail-closed checks — exits 0 (`ALL CHECKS PASSED`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure-Node deploy guard (TDD)** - `b74e627` (feat) — RED confirmed (guard absent → no deny for a deploy), then GREEN implementation passing the full behavioral triad.
2. **Task 2: Wire hooks.json + behavioral test harness** - `878a97c` (feat)

_TDD note: this guard is a single safety mechanism; RED was verified against the plan's behavioral fixtures (guard absent ⇒ matched deploy not blocked) before writing the implementation, then committed as one GREEN `feat` commit. The standalone behavioral harness (`guard.test.sh`) was then added in Task 2 and runs green._

## Files Created/Modified
- `hooks/guard.mjs` - SAFE-02 PreToolUse deploy guard: stdin JSON → deny JSON, config-driven deploy patterns, human-set env-var check, inline-self-set refusal, fail-closed, clear-voice deny reason.
- `hooks/hooks.json` - Plugin-level PreToolUse Bash matcher wiring the guard via `${CLAUDE_PLUGIN_ROOT}`.
- `hooks/guard.test.sh` - Behavioral triad harness (deny / allow / refuse-self-set) + default-set coverage + fail-closed checks.

## Decisions Made
- **Env var name:** kept the placeholder `GRUGOPS_PROD_DEPLOY_APPROVED` (research Assumption A2 — Claude's discretion).
- **Deploy-pattern regexes:** used `\b`-anchored regexes and added `sls deploy` and `fly deploy` aliases alongside `serverless deploy` / `flyctl deploy` for broader default coverage (within A4 discretion; per-project patterns are extended at bootstrap, never hardcoded to one stack).
- **Self-approval detection:** matches `export VAR=`, leading/embedded assignment-prefix `VAR=`, and `env VAR=` forms, anchored to a start/separator boundary so the agent cannot smuggle an inline approval.
- **Fail-closed parsing:** unparseable/empty stdin → empty command → matches no deploy pattern → allowed; a real deploy must arrive as well-formed JSON to be evaluated (and is then gated), so bad input never crash-allows a deploy.
- **Voice:** the deny `permissionDecisionReason` is clear professional English naming the env var (no caveman voice — Pitfall 6 / CLAUDE.md voice discipline).

## Deviations from Plan

None - plan executed exactly as written. The `hooks/` directory did not exist yet and was created additively; no existing files were modified or deleted.

## Issues Encountered
- The first batched verification run reported spurious `FAIL` lines and exit 127 due to a `ZSH_VERSION: unbound variable` error in the interactive shell snapshot interacting with `grep ... && ... || ...` short-circuits under `set -u`. This was a harness/environment artifact, not a guard defect — the guard's actual deny/allow output was correct in every case. Re-running the assertions via a clean standalone POSIX script (and via the committed `hooks/guard.test.sh`) shows all checks PASS. No fabricated results: the deny/allow/refuse-self-set triad was genuinely exercised and is green.

## User Setup Required
None for the kit itself. At runtime, a human who wants to authorize a production deploy must `export GRUGOPS_PROD_DEPLOY_APPROVED=1` (or the project's chosen name) in the shell that launches Claude Code — by design, the agent cannot set it. This is documented in the guard's deny message and pairs with `factory.config.json production_requires_human_confirmation: true`.

## Next Phase Readiness
- SAFE-02 mechanical guard is complete and green; ready for the plugin form (Plan 05-02/03 packaging) to ship `hooks/hooks.json` + `hooks/guard.mjs` at plugin root (D-37).
- The guard is Claude-Code-only (plugin hooks); the other four tools rely on the `autonomy=pr` + `production_requires_human_confirmation` procedural fallback — both facts must be documented in `adapters.md` / `install/README.md` (other Phase-5 plans).
- **Phase-6 dogfood (DOG-01/02):** confirm the guard actually blocks a sample `kubectl apply` when installed as a plugin, and that the `${CLAUDE_PLUGIN_ROOT}` path resolves from the plugin cache.

---
*Phase: 05-packaging-adapters-install-distribution*
*Completed: 2026-06-03*
