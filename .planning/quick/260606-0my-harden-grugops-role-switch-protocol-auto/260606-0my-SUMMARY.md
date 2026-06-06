---
phase: quick-260606-0my
plan: 01
subsystem: agent-factory (roles, workflows, skills, validator)
tags: [role-switch, commit-convention, single-source, validator, self-test, dogfood-hardening]
requires: []
provides:
  - "agent-factory/roles/_role-switch-protocol.md (single-source 5-step role-switch protocol + handoff-is-sole-memory invariant)"
  - "agent-factory/_commit-convention.md (single-source branch guard + type(scope): summary format + humans-hold-merge-and-deploy note + hook decision)"
  - "validator structural checks: protocol exists+referenced, convention exists, every workflow has ## Commit"
affects:
  - "every numbered workflow (00-13), the Orchestrator role, every skill/agent (Agent tool removed)"
tech-stack:
  added: []
  patterns:
    - "single-source: each rule lives in exactly one file; all other touches are path references"
    - "sequential role-load in ONE context window, no sub-agent spawning (Agent tool removed as vestigial)"
    - "auto-commit to a working branch only (never a protected branch); commit-side safety in convention, push-side in hooks/guard.mjs"
key-files:
  created:
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/_commit-convention.md
    - scripts/fixtures/bad-workflow-no-commit/ (new one-mutation BAD fixture tree)
  modified:
    - agent-factory/roles/orchestrator.md
    - agent-factory/workflows/00..13 (all 14)
    - skills/{grugops,ticket,map,plan,gate,uat,release}/SKILL.md
    - .claude/skills/{grugops,grugops-ticket,grugops-map,grugops-plan,grugops-gate,grugops-uat,grugops-release}/SKILL.md
    - .claude/agents/grugops-orchestrator.md
    - scripts/validate-agent-factory.mjs
    - scripts/validate.test.sh
    - scripts/fixtures/{good,bad-*,warn-only-no-trace}/ (new required structure propagated)
decisions:
  - "Appended the ## Commit section at the very end of each workflow (after ## Done condition) for uniform placement across all 14 files"
  - "Propagated the new required structure (protocol file, convention file, orchestrator reference, ## Commit sections) into ALL existing fixtures so each stays a true one-mutation tree and fails only for its intended single defect"
metrics:
  duration: ~25m
  completed: 2026-06-06
---

# Quick 260606-0my: Harden grugops role-switch protocol + auto-commit Summary

Hardened grugops against two DOG-02 live-dogfood failures: a role-switch with no mechanism (roles silently morph in one window, scratch context bleeds) and the fact that no workflow ever commits its artifacts (the auditable trail never gets recorded). Added two single-source files — a 5-step role-switch protocol and a commit convention with a branch guard — wired both by path into the Orchestrator and all 14 workflows, removed the now-vestigial `Agent` tool from every skill/agent, and extended the validator + self-test with three structural checks that stay honestly fail-capable.

## What was built

**Task 1 — role-switch protocol (single-source, Agent removed):** New `agent-factory/roles/_role-switch-protocol.md` holds the 5 steps (announce `▶ entering <ROLE>` → read only that role file + named handoff → drop prior context → produce handoff → announce `■ exiting <ROLE>`) and the invariant: a role's sole memory of earlier roles is the handoff packet, never the running conversation; one window, no sub-agent spawning. Orchestrator responsibility 5 now activates roles VIA the protocol by path; all 14 workflows reference it in their `## Agents involved` block (steps never inlined). The vestigial `Agent` tool was deleted from every `skills/*/SKILL.md` allowed-tools, every `.claude/skills/*/SKILL.md`, and the `grugops-orchestrator` agent's `tools:` CSV; body wording ("activate the right specialist role(s)") repointed at the protocol. Grep proves zero `Agent` tokens under `skills/` or `.claude/`.

**Task 2 — commit convention (single-source, branch guard):** New `agent-factory/_commit-convention.md` holds (a) the clear-voice branch guard — read `git rev-parse --abbrev-ref HEAD`, default protected set `{main, master}` (union any `protected_branches` config array; none exists today), and switch to `grugops/<workflow>-<id>` before committing; agents commit to a working branch only; (b) the `type(scope): summary` format with caveman-flavored example summaries; (c) the clear-voice humans-hold-merge-and-deploy note plus the documented hook decision (the PreToolUse `hooks/guard.mjs` denies protected-branch/force pushes and prod-deploys but is intentionally NOT gating `git commit`, because a deny-hook can only block, not redirect — the commit-side redirect lives in the convention). All 14 workflows gained a `## Commit` step referencing the convention by path. `hooks/` is untouched; `examples/03-ticket-to-pr.md` is byte-for-byte unchanged.

**Task 3 — validator + self-test (structural, fail-capable):** `scripts/validate-agent-factory.mjs` gained three read-only stdlib-only checks — `checkRoleSwitchProtocol()` (protocol file exists AND orchestrator.md references `_role-switch-protocol`), `checkCommitConvention()` (convention file exists), `checkWorkflowCommit()` (every workflow has a `## Commit` section, prefix-matched). The GOOD fixture was updated to satisfy them; a new one-mutation BAD fixture `bad-workflow-no-commit/` (GOOD minus the `## Commit` in `04-ticket-to-pr`) proves the new check can actually fail, with an `expect_fail … 'Commit'` assertion added to `validate.test.sh`.

## Verification results

| Check | Result |
|-------|--------|
| `node scripts/validate-agent-factory.mjs` | `ALL CHECKS PASSED`, exit 0 |
| `node scripts/validate-agent-factory.mjs --strict` | `ALL CHECKS PASSED`, exit 0 |
| `sh scripts/validate.test.sh` | `ALL CHECKS PASSED` (11/11: own-tree green bare+strict, GOOD passes, 6 BAD/WARN fail naming their finding incl. new `Commit`, warn-promotion proven) |
| protocol + convention files exist | yes |
| `_role-switch-protocol` referenced by orchestrator.md + all 14 workflows | yes (14/14) |
| `## Commit` in all 14 workflows | 14/14 |
| `Agent` tokens under skills/ .claude/ | zero (grep empty) |
| `hooks/` unchanged | yes (working tree + all 3 commits) |
| `examples/03-ticket-to-pr.md` | `git diff --quiet` holds (UNCHANGED) |
| accidental deletions across 3 commits | zero |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Propagated new required structure into ALL existing fixtures (not only the GOOD fixture).**
- **Found during:** Task 3
- **Issue:** The plan called for updating the GOOD fixture and adding one new BAD fixture. But once the three new validator checks went live, every existing fixture (`bad-role-missing-section`, `bad-config-no-mode`, `bad-plugin-noname`, `bad-ticket-mismatch`, `bad-ticket-bad-column`, `warn-only-no-trace`) started failing with 17-18 errors for the new structure they lacked. Critically, `warn-only-no-trace` is asserted GREEN bare (`expect_pass`) — it would have broken the self-test, and the BAD fixtures would no longer be honest one-mutation trees (they'd fail for incidental reasons, not their single intended defect).
- **Fix:** Copied the protocol + convention stub files into each existing fixture, added the orchestrator `_role-switch-protocol` reference, and appended a `## Commit` section to each fixture workflow stub — exactly mirroring the GOOD fixture update. Each fixture now fails ONLY for its intended single defect (verified individually), and `warn-only-no-trace` is green bare again with only its trace warning.
- **Files modified:** all six existing fixture trees under `scripts/fixtures/`
- **Commit:** 6a66994

This is required for correctness (the self-test would otherwise be red) and keeps the fixtures honest one-mutation trees — well within the plan's intent ("each BAD fixture is the GOOD tree with exactly one mutation").

## Commits

- `0e5be77` feat(factory): add single-source role-switch protocol, remove vestigial Agent tool (31 files)
- `897e38f` feat(factory): add single-source commit convention + ## Commit step in every workflow (15 files)
- `6a66994` test(scripts): add validator checks for protocol/convention/## Commit + fail-capable self-test (190 files)

## Known Stubs

None. The two new files are complete prose; the fixture files are intentionally minimal stubs (the established `scripts/fixtures/` pattern — "not the real role/workflow, just enough to satisfy the validator"), which is the documented design of the fixture trees, not an incomplete implementation.

## Self-Check: PASSED

All created files verified present on disk (protocol, convention, both GOOD-fixture stubs, the new BAD fixture's mutated workflow, and this SUMMARY). All three commits (`0e5be77`, `897e38f`, `6a66994`) verified present in git history.
