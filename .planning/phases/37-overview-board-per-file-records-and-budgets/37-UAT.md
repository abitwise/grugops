---
status: complete
phase: 37-overview-board-per-file-records-and-budgets
source: [37-VERIFICATION.md]
started: 2026-10-24T16:11:07Z
updated: 2026-10-26T13:39:45.895Z
---

## Current Test

[testing complete]

## Tests

### 1. CI reachability of the own-tree gates (carried from rounds 0 to 2; left out of every gap round by D-17, D-18, D-19)
expected: On a pushed branch the ubuntu 'Freshness gates + repo gates' step reaches `node scripts/runnable-ref/state-check.js .` (ci.yml line 605) and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. Both sit after `check-diff-disposition.js` (line 512, 721 findings) and `check-flip-manifest.js` (line 602) in one fail-fast run block; a human decides how to clear those findings. Locally both exit 0.
result: skipped
reason: "Deferred follow-up: B — test fails as written (CI never reaches state-check.js . or the validator), but every blocker predates phase 37, so it is a separate CI-unblock item, not a phase-37 gap round. Blockers found 2026-10-24: (1) ubuntu Vitest step fails with the 19 archive-path tests (37-BASELINE.md), which skips the whole gates step (run 39310544159); (2) check-diff-disposition 721 findings over 40 files since base 4d2b8f0, 31 of them FROZEN (Hard limits / Stop conditions / Commit); (3) check-flip-manifest: manifest path hard-coded to .planning/phases/33-*, moved by the v2.1 archive, plus 6 more stale derivations when restored. Locally all other 23 gates exit 0, state-check.js . and the validator exit 0."

### 2. Live host run of the PR-gate and daily-sweep sub-steps (37-VALIDATION Manual-Only)
expected: On a real host remote, trace-render exits 0, state-check prints the marker valid and exits 0, and the workflow step records the exit code without blocking the gate.
result: issue
reported: "Delegated run by Claude, finding approved by the human (approve, 2026-10-26): on a host whose package.json has no type field, trace-render and state-check exit 0 and a headless claude -p PR-gate sub-step recorded a sealed observation note without blocking the gate (pass). On a host whose package.json says \"type\": \"commonjs\" (the npm 11.20 `npm init -y` default) all 8 tools/grugops runnables crash with a SyntaxError on their first import, exit 1, which Workflows 05/09 read as findings or a refusal, not could-not-run."
severity: major

### 3. Round-3 rule changes to keep or reverse (37-39 coverage item D6; deferred-items.md)
expected: A decision on each of the following. None contradicts a locked decision; each follows from D-20.
  - the `.grugops/queue` link refusal
  - the linked listed-folder rule: one finding, not exit 2
  - state-check stopping at the marker behind a root-chain link: exit 2, never WARN
  - the backslash-name refusal
  - for a regular file at a context root, state-check exits 2; the alternative is a finding with exit 1
result: pass
reported: "Human decision (approve, 2026-10-26, on Claude's recommendation): keep all five. Each follows from D-20 and fails toward could-not-run or a finding, never a pass. The either-or outcomes for the file, listing and file-follow kinds stay unpinned."

### 4. Round-3 review findings WR-12, WR-13, WR-14 and IN-14: a fourth (last) gap round, or recorded acceptance
expected: Either a round-4 plan scoped to these four, or a recorded acceptance in 37-REVIEW-DISPOSITION.md.
  - WR-12: a hole in the hand-trace scan created by the WR-11 fix (a comma list of objects; "per Workflow 16")
  - WR-13: verbs and nouns still listed by hand (14 of 24 sentences the verifier tried still pass)
  - WR-14: a stray entry whose name falls outside the task grammar gets exit 2 with no "move it out" remedy
  - IN-14: state-check follows an in-root link at board.md that state-roll refuses

None of the four makes a must-have false, and none deletes or fakes a trace file. The live tree has zero such sentences.
result: issue
reported: "Human decision (approve, 2026-10-26, on Claude's recommendation): WR-12, WR-14 and IN-14 go to gap round 4 (the last on the cap); WR-13 is accepted and recorded in 37-REVIEW-DISPOSITION.md (open-set heuristic, content not mechanism per D-59; live tree 0 hits)."
severity: minor

## Summary

total: 4
passed: 1
issues: 2
pending: 0
skipped: 1
blocked: 0

## Gaps

- gap_id: G-37-2
  truth: "On a real host, trace-render exits 0, state-check prints the marker valid and exits 0, and the workflow step records the exit code without blocking the gate"
  status: failed
  reason: "User approved delegated finding: on a host whose package.json says \"type\": \"commonjs\" (npm 11 `npm init -y` default) every tools/grugops runnable crashes on its first import (SyntaxError, exit 1), which Workflows 05/09 read as findings or a refusal instead of could-not-run"
  severity: major
  test: 2
  root_cause: "The installer materializes ES-module .js files into tools/grugops/ with no package.json beside them, so Node resolves the module type from the host's nearest package.json. An explicit \"type\": \"commonjs\" makes Node parse them as CommonJS and throw at the first import; a host with no type field runs them with a MODULE_TYPELESS_PACKAGE_JSON warning on every run. Node's uncaught-error exit code is 1, which collides with the runnables' finding exit code."
  artifacts:
    - path: "install/install.ts"
      issue: "materializes tools/grugops/*.js (8 runnables) without a tools/grugops/package.json declaring type module"
    - path: "agent-factory/workflows/05-pr-quality-gate.md"
      issue: "exit 1 from a crashed runnable is read as a finding/refusal (Step 3 trace-render/state-check, test-skip-integrity, uat-spec-integrity)"
  missing:
    - "Installer writes tools/grugops/package.json {\"type\":\"module\"} as a recorded, idempotent, reversible install file (uninstall removes it; --check reports it); checked in scratch: with it, trace-render, state-check and state-roll exit 0 with no warning under a commonjs host"
    - "Regression test: install into a planted host whose package.json says type commonjs, then each materialized runnable exits 0 (or its own documented code), never a SyntaxError"
  debug_session: "/gsd-verify-work 37, 2026-10-24..26 (scratch host t2 and host-cjs; evidence in the UAT test 2 report)"
- gap_id: G-37-4
  truth: "Round-3 review findings WR-12, WR-14 and IN-14 are fixed in gap round 4 (WR-13 accepted and recorded)"
  status: failed
  reason: "User approved: WR-12, WR-14 and IN-14 go to the last gap round; WR-13 accepted"
  severity: minor
  test: 4
  root_cause: "Diagnosed in 37-REVIEW.md and reproduced in 37-VERIFICATION.md. WR-12: the 37-39 lookaheads (per Workflow 16, comma-and-determiner) are checked at every step of pattern 4's lazy run, so any comma list of objects aimed at the trace passes. WR-14: readTaskNoteRefs calls assertSafeTask before entryPresence, so a non-directory stray entry with an out-of-grammar name gets no STRAY_CONTEXT_ENTRY_REMEDY. IN-14: state-check's readState follows a leaf link at board.md and the trace index, which state-roll and trace-render refuse."
  artifacts:
    - path: "scripts/trace-model.ts"
      issue: "WR-12: lines 122-133, the two lookaheads in PATTERN_4"
    - path: "scripts/context-io.ts"
      issue: "WR-14: lines 2616-2626, assertSafeTask runs before the entry's lstat"
    - path: "scripts/runnable-ref/state-check.ts"
      issue: "IN-14: line 2078, locate/readState follows a leaf link at the board and indexes"
  missing:
    - "WR-12: delete both lookaheads, exempt `rendered` at the noun (fix in 37-REVIEW.md), re-point the two EXCLUSION_CONTROLS rows, add the four sentences to KNOWN_VIOLATIONS, re-run the paragraph scanner; live scan set stays at 0 hits"
    - "WR-14: ask entryPresence first; keep the name refusal for directories only (IN-09 arm); plant a non-directory entry with an out-of-grammar name"
    - "IN-14: refuse a leaf link at the board and the indexes in state-check's readState (as sizeFinding and readTraceText do), matching state-roll and trace-render"
    - "Regenerate the embedded runnables and keep the freshness gates green"
  debug_session: "37-REVIEW.md (round 3) and 37-VERIFICATION.md reproduction section"

## Deferred Follow-Ups

- test: 1
  idea: "Unblock CI so a push reaches state-check.js . and the validator: re-point the 19 archive-path tests to .planning/milestones/v2.1-phases/; re-base or retire the GAP-D1 flip manifest (check-flip-manifest.ts:66 plus 6 stale derivations); human review of the 31 FROZEN diff-disposition clauses, then a recorded decision on the 690 others (write rows, move base 4d2b8f0, or retire the gate)."
  deferred_at: 2026-10-24
