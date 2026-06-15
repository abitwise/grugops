---
status: resolved
phase: 17-install-migrate-update
source: [17-VERIFICATION.md, 17-REVIEW.md]
started: 2026-06-15
updated: 2026-06-15
resolved_by: d9dfd07
---

## Current Test

[resolved — both items fixed in commit d9dfd07; re-verification passed 13/13]

## Tests

### 1. WR-01 — Half-state migrate recovery hint accuracy
expected: When `--migrate` detects a half-migrated repo (a leftover LIVE `agent-factory/`), the printed guidance must point to a recovery action that actually works. The old text told the user to run `--prune-old-kit`, which correctly refuses to delete a live (non-`.bak.<ISO>`) directory — a no-op.
result: resolved — guidance (install/install.ts + install/README.md) now tells the user to remove the leftover by hand and states prune only removes timestamped `.bak.<ISO>` backups, never a live kit. The half-state test was strengthened to assert the honest wording AND prove end-to-end that `--prune-old-kit` leaves the live leftover in place.

### 2. WR-02 — Interactive prompt wording for --update / --prune-old-kit
expected: An interactive (no `--yes`) invocation of the no-target modes must not print "Install grugops into which repo?".
result: resolved — `resolveTarget()` now short-circuits for the no-target modes: `--update` takes the default silently, `--prune-old-kit` asks "Prune grugops backups in which repo?". The generic install prompt is only reachable on a normal install.

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
