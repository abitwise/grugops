---
status: complete
phase: 30-per-checkpoint-autonomy-matrix
source: [30-VERIFICATION.md]
started: 2026-09-06T16:14:37.517Z
updated: 2026-09-06T18:19:17Z
---

## Current Test

[testing complete]

## Tests

### 1. Decide whether Phase 30 may be marked done in ROADMAP.md given red-team surface A's fence (not close). Independently reproduced: `git push -fu origin feature` (combined short flag `-fu`) is ALLOWED by the committed `hooks/guard.js` at HEAD, with zero grant keys of any kind, against a control `git push --force origin feature` that correctly DENIES. This is one of six documented zero-key, executed bypasses of `protected_branch_merge` (V-30-11-16, -17, -18, -19, -20, -25) recorded in `docs/audit/30-redteam-surface-a.md` and already reflected as an explicit scope note under AUTO-03 in `.planning/REQUIREMENTS.md`.
expected: A human decides: (a) accept the fence as final for this milestone (matching the 2026-09-06 fence decision already recorded in `deferred-items.md`) and proceed, or (b) require a dedicated follow-up phase/plan to close the command-model bypasses (`V-30-11-16`..`-20`, `-25`) before relying on `protected_branch_merge=block` as an operative guarantee against an unauthorized `main` force-push.
result: pass

### 2. Decide whether `checkpoints.open_pr` needs an actual enforcement point (a hook rule intercepting `gh pr create` or equivalent) before Phase 30 is considered to have delivered dialable control over 'the four current safety floors.'
expected: Either (a) confirm this is an accepted, permanent design position (open_pr remains documentary-only, matching its pre-Phase-30 status under the retired `autonomy` scalar, and the phase's job was only to unify its declaration/disclosure — not to newly gate it), and record that decision in `agent-factory/config/factory.config.md` / `docs/GUARANTEES.md` / REQUIREMENTS.md so a future reader does not assume it is enforced; or (b) open a follow-up item to wire real enforcement, since `open_pr` is one of the four `SAFETY_FLOORS` this whole phase organizes around.
result: pass

### 3. Confirm whether the settings-file `env`-grant vector (`.claude/settings.local.json` `env` block reaching a hook subprocess) is an acceptable residual for `GRUGOPS_FLOOR_*` / `GRUGOPS_PROD_DEPLOY_APPROVED` / `GRUGOPS_ADMISSION_APPROVED_BY`, given it was OBSERVED (not merely inferred) to reach the hook process in round 2 of surface A.
expected: A human reviews `docs/GUARANTEES.md` §9 and decides whether the current disclosure (accepted, irreducible, narrowing measures not yet built) is sufficient, or whether a `permissions.deny` recommendation over `.claude/settings*.json` should be added before shipping.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
