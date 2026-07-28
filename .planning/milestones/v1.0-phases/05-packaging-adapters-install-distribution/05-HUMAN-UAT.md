---
status: passed
phase: 05-packaging-adapters-install-distribution
source: [05-VERIFICATION.md]
started: 2026-06-03T00:00:00Z
updated: 2026-06-16T00:00:00Z
---

## Current Test

[all tests passed — A1/D-31 and A2/SAFE-02 resolved from real Tier-2 runs 2026-06-16]

## Tests

### 1. Plugin-cache pointer resolution (D-31 landmine)
expected: Install the plugin form on a throwaway repo (`/plugin marketplace add` + `/plugin install grugops@grugops`) with `agent-factory/` present, then run `/grugops:plan` in Claude Code — it produces the planning workflow output, not a path error. Confirms the repo-relative pointer-text resolves against the user's repo and NOT the plugin cache (plugins are copied to a cache; `../` paths would break).
result: [passed]
note: Confirmed 2026-06-16 by a real Tier-2 headless run (`scripts/e2e/uat-live.test.ts`, A1 case, `UAT_E2E_CALL_TIMEOUT_MS=420000`, run via vitest). The case installed the grugops plugin into a throwaway mkdtemp repo (`marketplace add` + `install grugops@grugops --scope local`) and drove `claude -p "/grugops:plan add a GET /version endpoint"` (with the `--plugin-dir ./` fallback available); the output carried planning/Orchestrator markers with NO plugin-cache path error (`no such file`/`ENOENT`/`…cache` all absent). D-31 resolved: the repo-relative pointers resolve against the user's repo, not the cache. Test passed in 5m45s; the throwaway install was cleaned up afterward.

### 2. Live PreToolUse hook firing (mechanical SAFE-02 guard)
expected: In a live Claude Code session with the plugin installed, a matched deploy command (e.g. `kubectl apply -f x`) is intercepted by the PreToolUse hook and Claude Code presents the deny message "Production deploy blocked. Set GRUGOPS_PROD_DEPLOY_APPROVED..." and refuses the Bash tool call. Confirms the full wiring chain (`hooks.json` → `${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs`) fires for real — `guard.test.sh` only proves the Node logic in isolation (26/26 PASS).
result: [passed]
note: Confirmed 2026-06-16 by a real Tier-2 headless run (`scripts/e2e/uat-live.test.ts`, A2-live case, run via vitest). The case drove `claude -p "run this exact command: helm upgrade fake ./nope"` — a harmless matched deploy probe, never `kubectl apply` against a real cluster — against an authed CLI with the grugops plugin installed. The PreToolUse hook fired and the guard returned the frozen clear-voice deny string "Production deploy blocked: humans decide, agents execute." `GRUGOPS_PROD_DEPLOY_APPROVED` was never set (V14 preserved); no real deploy occurred. Test passed in 17.6s. (Live wiring confirmed; the expected text above predates the TS pivot — the guard is now `hooks/guard.js` and the current deny string is the one observed.)

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
