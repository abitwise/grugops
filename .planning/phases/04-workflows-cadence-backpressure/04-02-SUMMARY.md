---
phase: 04-workflows-cadence-backpressure
plan: 02
subsystem: workflows
tags: [workflow, backpressure, quality-gate, lifecycle, safe-01, single-source]
requires:
  - "agent-factory/roles/orchestrator.md (routing table, recommendation-only posture)"
  - "agent-factory/roles/{qe-e2e,security-nfr,software-engineer,architect-design}.md (composed roles + handoffs)"
  - "agent-factory/config/factory.config.json#quality (self_fix_attempts/coverage_threshold/mandatory_gates/e2e_when)"
  - "agent-factory/checklists/{pr-review-checklist,definition-of-ready}.md"
  - "root AGENTS.md command slots (all UNKNOWN - verify)"
  - ".planning/phases/04-workflows-cadence-backpressure/check-structure.sh (Wave-0 harness from 04-01)"
provides:
  - "agent-factory/workflows/05-pr-quality-gate.md — single-source §14 backpressure gate; terminal-result contract"
  - "agent-factory/workflows/04-ticket-to-pr.md — ticket->PR lifecycle that references 05 for the gate"
affects:
  - "Orchestrator routing (quality-gate -> 05, ticket-to-pr -> 04) now resolves to real files"
  - "later-wave workflows (00-03, 06-13) that will reference 05 for the gate"
tech-stack:
  added: []
  patterns:
    - "10-section v2 workflow template (FLOW-05), headings in order"
    - "kind: workflow frontmatter (3 fields: kind/order/cadence)"
    - "single-source backpressure loop (D-26) — loop lives only in 05; 04 references it"
    - "clear voice in gate/stop/safety prose; light grug wink confined to When to use opener (D-27)"
    - "no-fabrication: gate commands recorded UNKNOWN - verify, pulled from AGENTS.md (D-18)"
key-files:
  created:
    - "agent-factory/workflows/05-pr-quality-gate.md"
    - "agent-factory/workflows/04-ticket-to-pr.md"
  modified: []
decisions:
  - "[04-02] 05 written FIRST so 04's reference resolves; loop single-sourced in 05 (D-26)"
  - "[04-02] 05 frontmatter = kind/order:5/cadence:both; 04 = kind/order:4/cadence:both (3 fields each, <=3 cap, D-27 discretion)"
  - "[04-02] SPLIT_REQUIRED appears in 04 (board/sizing concept the Orchestrator owns) — harness V-06 only forbids READY_FOR_HUMAN_REVIEW, so this is correct, not loop-restatement"
metrics:
  duration: 1m
  completed: 2026-06-03
  tasks: 2
  files: 2
---

# Phase 04 Plan 02: PR Quality Gate & Ticket-to-PR Workflows Summary

Authored the two gate-coupled lifecycle workflows: `05-pr-quality-gate.md` as the single-source home of the §14 backpressure loop (prefetch -> branch -> gate -> bounded self-fix -> terminal result -> human gate), and `04-ticket-to-pr.md` which sequences the dev board path and references 05 for the gate rather than restating it — both rendered as clear-voice "humans decide, agents execute" prose.

## What Was Built

### Task 1 — `agent-factory/workflows/05-pr-quality-gate.md` (commit 6dbe6fa)
The single-source §14 gate (D-26). Reproduces the 6-step backpressure loop faithfully in clear voice:
1. deterministic prefetch (Orchestrator gathers context before code is written),
2. implement on a branch (`autonomy=branch|pr`),
3. run the gate `install -> lint -> typecheck -> unit -> build -> e2e` with commands pulled from `AGENTS.md` and recorded `UNKNOWN - verify` when unknown — never faked,
4. bounded self-fix via `self_fix_attempts` (default 2, "two rounds then human") then STOP,
5. one terminal result: `READY_FOR_HUMAN_REVIEW | BLOCKED_NEEDS_FIX | SPLIT_REQUIRED`,
6. human-only review/merge/deploy.
Cites the other `quality.*` knobs (`coverage_threshold` 0.8, `mandatory_gates`, `e2e_when`) and `pr-review-checklist.md`. Names the composed roles (QE/E2E, Security/NFR, Architect/Design if structure changed, Orchestrator recommendation-only). Board moves stay in `In Review (-> In Security/NFR)`; emits the `Gate pass rate` metric. SAFE-01: emits a recommendation a human reviews; never auto-merges. 10-section template in order; `kind: workflow` frontmatter (3 fields).

### Task 2 — `agent-factory/workflows/04-ticket-to-pr.md` (commit 3e5b987)
The §7.5 ticket->PR lifecycle. Composes frozen role behavior (D-23): Orchestrator DoR gate via `definition-of-ready.md` and `Ready for Dev -> In Development`; Software Engineer `In Development -> In Review` -> `implementation-handoff.md`; QE/E2E `In Review` exit -> `qe-handoff.md`; Security/NFR (if triggered) -> `security-nfr-handoff.md`. Step 4 says "run the quality gate per `agent-factory/workflows/05-pr-quality-gate.md`" — a reference only; the loop body, the six verbs, and the terminal tokens are NOT restated (D-26). Board moves reproduce `Ready for Dev -> In Development -> In Review (-> In Security/NFR)` using only the 13 frozen columns. SAFE-01: honors `autonomy=pr` — branch + open PR, "never merge". 10-section template in order; `kind: workflow` frontmatter (3 fields).

## Verification

Per-task inline checks both green (`OK-05`, `OK-04`). Running the Wave-0 harness (`check-structure.sh` from 04-01) is informational — partial PASS is expected because later-wave workflows (00-03, 06-13) are still absent. The checks owned by THIS plan all flipped green:

- **V-02/V-03** (04, 05): 10/10 sections in order; frontmatter 3 fields each (<=3).
- **V-05**: `READY_FOR_HUMAN_REVIEW` appears in EXACTLY `05`; 05 carries all three terminal tokens, all six gate verbs (`install/lint/typecheck/unit/build/e2e`), and `self_fix_attempts`.
- **V-06**: `04` references `05-pr-quality-gate.md` and does NOT restate the loop (no `READY_FOR_HUMAN_REVIEW`).
- **V-07**: `05` contains `UNKNOWN - verify`; no hard-coded real gate command (`npm test`/`eslint`/`tsc` etc. confirmed absent).
- **V-11** (04, 05 portions): 04 carries `autonomy=pr` + "never merge"; 05 carries "recommendation" + human-review language, no auto-merge.
- **V-12**: no `plans/*-handoff` drift; every cited `*-handoff` name is in the frozen 16-file list.

Harness failures dropped from 59 (baseline, all 14 files absent) to 47 after both files landed — exactly the 12 checks owned by 04/05 flipped green; the remainder are later-wave files by design.

## Must-Haves Confirmed

- Truth 1: the §14 loop appears exactly ONCE, in `05` (V-05 single-source PASS).
- Truth 2: `05` records gate commands as `UNKNOWN - verify`, never a fabricated command (V-07 PASS; no real command found).
- Truth 3: `04` references `05` for the gate and does NOT restate the loop (V-06 PASS).
- Truth 4: `04` honors `autonomy=pr` (branch + open PR, never merge); `05` emits a recommendation a human reviews, never auto-merges (V-11 PASS).

## Threat Model Confirmation

- T-04-02-01 (fabricated gate command): mitigated — commands `UNKNOWN - verify`, pulled from AGENTS.md; V-07 green.
- T-04-02-02 (missing human-confirm prose): mitigated — 04 `autonomy=pr` + "never merge"; 05 recommendation-only; V-11 green. Mechanical enforcement deferred to Phase 5 (SAFE-02) by design.
- T-04-02-03 (loop duplicated into 04): mitigated — single-source D-26; 04 contains no `READY_FOR_HUMAN_REVIEW`; V-06 green.

## Deviations from Plan

None - both tasks executed exactly as written. The plan's note that `SPLIT_REQUIRED` is a board/sizing concept (and so legitimately appears in 04 while the gate's `READY_FOR_HUMAN_REVIEW`/`BLOCKED_NEEDS_FIX` do not) was honored; harness V-06 confirms this is not loop-restatement.

## Known Stubs

None. Both files are complete kit templates (project-agnostic by D-04); the only intentional `UNKNOWN - verify` markers are the gate-command placeholders, which are correct-by-design (filled per-project at runtime by bootstrap/Scribe, never fabricated here).

## Self-Check: PASSED

- FOUND: agent-factory/workflows/05-pr-quality-gate.md
- FOUND: agent-factory/workflows/04-ticket-to-pr.md
- FOUND: commit 6dbe6fa (Task 1)
- FOUND: commit 3e5b987 (Task 2)
