---
phase: 04-workflows-cadence-backpressure
plan: 01
subsystem: validation-harness
tags: [workflows, validation, structural-harness, posix-sh, backpressure, cadence, safe-01]
requires:
  - "agent-factory/roles/orchestrator.md (frozen routing table, 14 workflow names)"
  - "agent-factory/handoffs/*.md (frozen 16-file inventory)"
  - ".planning/phases/03-roles-agents-md-substrate/check-structure.sh (Phase-3 precedent)"
provides:
  - "Wave-0 structural acceptance harness (V-01..V-13) for all 14 Phase-4 workflow files"
  - "Runnable <automated> proof referenced by every other Phase-4 plan"
affects:
  - "agent-factory/workflows/*.md (the 14 files later waves author and re-run this against)"
tech-stack:
  added: []
  patterns:
    - "POSIX sh + grep/wc/test structural harness (no runtime runner, D-18)"
    - "ships RED first (exit 1) then goes green file-by-file as artifacts land"
    - "grep-gate hygiene (grep -v '^#') so header/comment prose cannot self-invalidate a count"
    - "frozen-path drift guard (no plans/*-handoff; cited handoffs in the frozen 16)"
    - "no-fabrication: Phase-6 Node validator referenced only as UNKNOWN - verify, never invoked"
key-files:
  created:
    - ".planning/phases/04-workflows-cadence-backpressure/check-structure.sh"
  modified: []
decisions:
  - "V-04 cross-file check matches against the explicit frozen 14-name list (not a loose 0[0-9]|1[0-3]- regex) so memory-bank/00-index.md cited elsewhere in orchestrator.md is correctly excluded"
  - "V-02 order check captures grep -nF line numbers to a temp file then evaluates strictly-increasing in the parent shell (POSIX subshell-pipe scoping), mirroring the Phase-3 temp-file pattern"
  - "Gate verbs (V-05) and several SAFE-01/cadence keyword checks use grep -iF (case-insensitive) so faithful prose phrasing in the eventual workflow files still matches"
metrics:
  duration_min: 1
  tasks: 1
  files: 1
  completed: 2026-06-03
---

# Phase 04 Plan 01: Wave-0 Structural Validation Harness Summary

A 388-line POSIX `sh` grep/wc/test harness (`check-structure.sh`) that encodes all 13 invariants V-01..V-13 from `04-VALIDATION.md` for the 14 Phase-4 workflow files; it ships RED (exit 1) against the empty `agent-factory/workflows/` dir and goes green file-by-file as later waves author each workflow — the runnable acceptance gate and `<automated>` proof for the whole phase.

## What Was Built

`.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` — executable, mirrors the proven Phase-3 precedent (`#!/usr/bin/env sh` + `set -eu`, `pass()/fail()` helpers incrementing a `FAILS` counter, numbered check blocks, grep-gate hygiene, frozen-path drift guard, final `ALL CHECKS PASSED`/exit 0 vs `N CHECK(S) FAILED`/exit 1). It defines `WF_DIR="agent-factory/workflows"` and encodes:

| Check | Req | What it asserts |
|-------|-----|-----------------|
| V-01 | FLOW-01/02/03/04 | all 14 exact filenames exist; exactly 14 `*.md`; **no** `14-*.md` |
| V-02 | FLOW-05 | 10 §7 template headings present AND in strictly-increasing line order, per file |
| V-03 | FLOW-05/D-27 | `kind: workflow` present; frontmatter fence block has 1..3 field lines |
| V-04 | D-20 | every frozen workflow name cited in `orchestrator.md` (comments filtered) has a matching file; no extra files |
| V-05 | GATE-01 | `READY_FOR_HUMAN_REVIEW` lives in **only** `05`; `05` has all 3 terminal tokens + 6 gate verbs + `self_fix_attempts` |
| V-06 | GATE-01/D-26 | `04` references `05-pr-quality-gate.md` and does **not** restate the loop |
| V-07 | GATE-01 | `05` carries `UNKNOWN - verify` (no hard-coded gate command) |
| V-08 | BOARD-03 | `08`,`10` carry `cadence=scrum`; `08` references `SPRINT-xx.md` + names Goal/Committed/Velocity/Burndown |
| V-09 | BOARD-02 | `09` references `plans/board.md`, `plans/metrics.md`, `memory-bank/60-progress.md`, `blocked_escalation_days`; names Cycle time/WIP |
| V-10 | FLOW-03 | `08`,`10` scrum; `07`,`09`,`11` declare both; no cadence-suffixed filename |
| V-11 | SAFE-01 | `04` autonomy=pr + "never merge"; `05` recommendation + human-review; `12` named human + human-confirmed + `production_requires_human_confirmation` |
| V-12 | D-24 | no `plans/*-handoff` drift; every cited `*-handoff` name is in the frozen 16-file list |
| V-13 | FLOW-04 | `13` references `incident-postmortem.md` + carries blameless language |

## How to Verify

```sh
sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh; echo "exit=$?"
```

Expected NOW (workflows dir holds only `.gitkeep`): exit `1`, 59 FAIL lines for absent files. The harness is a **live gate, not a stub** — the checks that can already evaluate against on-disk reality PASS:
- V-04 PASSes: `orchestrator.md` already cites all 14 frozen workflow names; no extra files.
- V-01 `no 14-*.md` PASSes (negative assertion fires).
- V-12 PASSes vacuously (no workflow files yet).

As later waves author each workflow, re-running flips that file's V-01/V-02/V-03 (+ its content checks) green; full green is the Phase-4 gate.

## Deviations from Plan

None — plan executed exactly as written. One implementation nuance worth recording (not a plan deviation): V-04 deliberately matches the **explicit frozen 14-name list** rather than a loose `0[0-9]|1[0-3]-` regex, because such a regex also captures `memory-bank/00-index.md` (cited at orchestrator.md line 28), which is not a workflow. Matching the frozen list keeps the 1:1 routing check correct.

## Acceptance Criteria

- [x] `check-structure.sh` exists, is executable (`chmod +x`), runs under `sh` with no syntax error (`sh -n` + `bash -n` both clean).
- [x] Running it now exits 1 (RED) and prints FAIL lines for absent files — proving a live gate.
- [x] Visibly covers all 13 invariants: greps `READY_FOR_HUMAN_REVIEW`, `05-pr-quality-gate.md`, `cadence=scrum`, `SPRINT-xx.md`, `blocked_escalation_days`, `autonomy=pr`, `never merge`, `production_requires_human_confirmation`, `incident-postmortem.md`, `blameless`, `kind: workflow`, the 10 `## ` headings, and the `plans/.*-handoff` drift guard.
- [x] No real gate command string (`npm test`/`eslint`/`tsc`/`pytest`/`jest`/`vitest` scan = NONE); Phase-6 Node validator referenced only as `UNKNOWN - verify`, never invoked.
- [x] 388 lines (>= 120 min_lines); contains `READY_FOR_HUMAN_REVIEW`; links to `agent-factory/workflows` and `orchestrator.md`.

## Threat Mitigations Applied

- **T-04-01 (Tampering — faked/weak invariant):** V-01..V-13 encoded verbatim from `04-VALIDATION.md`; harness ships RED first (59 FAIL), proving the checks fire — a no-op check would be caught immediately by the RED-then-green behavior.
- **T-04-02 (Repudiation — fabricated Node validator):** the Phase-6 validator appears only inside a comment as `UNKNOWN - verify`; the no-fabrication scan confirms no live `node …validate-agent-factory` invocation and no real gate command.

## Self-Check: PASSED

- FOUND: `.planning/phases/04-workflows-cadence-backpressure/check-structure.sh` (388 lines, executable)
- FOUND commit: `40c6360` feat(04-01): author Wave-0 structural harness
- Harness runs under `sh`, exits 1 (RED-as-expected), zero fabricated commands.
