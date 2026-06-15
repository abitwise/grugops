---
status: partial
phase: 17-install-migrate-update
source: [17-VERIFICATION.md, 17-REVIEW.md]
started: 2026-06-15
updated: 2026-06-15
---

## Current Test

[awaiting human decision]

## Tests

### 1. WR-01 — Half-state migrate recovery hint accuracy
expected: When `--migrate` detects a half-migrated repo (a leftover LIVE `agent-factory/` alongside the new two-root layout), the guidance it prints should point to a recovery action that actually works. Currently it tells the user to run `--prune-old-kit`, but `--prune-old-kit` only removes `.bak.<ISO>` backups and correctly refuses to delete the live protected directory — so the documented recovery is a no-op. The same wording is repeated in `install/README.md`. No data-loss risk (prune is conservative by design); the defect is misleading guidance.
result: [pending]

### 2. WR-02 — Interactive prompt wording for --update / --prune-old-kit
expected: `resolveTarget()` runs unconditionally before the `--update` and `--prune-old-kit` branches, so an interactive (no `--yes`) invocation of either no-target mode prints "Install grugops into which repo?" — the wrong question for modes that don't take a target repo. Tests always pass `--yes`, which masks this. Decide whether to gate the target prompt so it is skipped for no-target modes.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
