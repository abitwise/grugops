---
status: partial
phase: 06-validation-brand-dogfood
source: [06-VERIFICATION.md, docs/dogfood-human-runbook.md]
deferred_at: checkpoint:human-verify (06-05) — user chose "defer to milestone UAT"
started: 2026-06-04
updated: 2026-06-16
---

## Current Test

[awaiting human testing — deferred to milestone-close UAT]

These three items complete DOG-02's CC-native (live Claude Code session) half. They cannot
be honestly self-performed by an executor, so they are tracked here, never fabricated. Run
them against the dogfood sample using `docs/dogfood-human-runbook.md`. The agent-proven
sequential half + the validator (DOG-01) already passed for real.

## Tests

### 1. D-31 — plugin marketplace install + plugin-cache pointer resolution
expected: `/plugin marketplace add <owner>/grugops` then `/plugin install grugops@grugops`, then `/grugops:plan` produces planning output (NOT a path error) — proving the repo-relative `agent-factory/roles/*.md` pointers resolve against the user's repo, not the broken plugin cache.
result: [pending]

### 2. SAFE-02 — live PreToolUse hook firing
expected: a matched guarded prod-deploy (e.g. `kubectl apply -f x`) WITHOUT `GRUGOPS_PROD_DEPLOY_APPROVED` set is DENIED by the PreToolUse hook with the clear-voice deny message. NEVER set the approval env var; NEVER run a real deploy (V14). The guard is already verified mechanically by `hooks/guard.test.sh` (passing); this confirms it fires in a live CC session.
result: [passed]
note: Confirmed 2026-06-16 by a real Tier-2 headless run (`scripts/e2e/uat-live.test.ts`, A2-live case, run via vitest) against an authed CLI with the grugops plugin installed. A harmless matched probe `claude -p "run this exact command: helm upgrade fake ./nope"` (never `kubectl apply` against a real cluster) was DENIED by the PreToolUse hook with the frozen clear-voice deny string "Production deploy blocked: humans decide, agents execute." `GRUGOPS_PROD_DEPLOY_APPROVED` was never set (V14 preserved); no real deploy occurred. Test passed in 17.6s.

### 3. CC sub-agent spawn path + dual-path parity
expected: driving the SAME ticket (ABC-001) through the CC sub-agent path (`settings.json` `agent:` → `Agent` tool spawn) yields the SAME roles, SAME handoff filenames, and SAME gate verdict (READY_FOR_HUMAN_REVIEW) as the captured sequential run. Fill the 9 `pending human` cells in the parity table in `examples/03-ticket-to-pr.md` — "only the dispatch differs, never the content" (DOG-02).
result: [pending]

## Summary

total: 3
passed: 1
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
