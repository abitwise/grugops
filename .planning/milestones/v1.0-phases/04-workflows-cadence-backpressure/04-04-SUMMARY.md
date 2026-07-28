---
phase: 04-workflows-cadence-backpressure
plan: 04
subsystem: workflows
tags: [workflows, bootstrap, greenfield, brownfield, lifecycle, flow-01]
requires:
  - "agent-factory/roles/orchestrator.md (structural analog + routing names)"
  - "agent-factory/roles/{greenfield-mapper,brownfield-mapper,agents-md-scribe,ba-pm,system-analyst,architect-design,security-nfr}.md"
  - "agent-factory/handoffs/{product,system,architecture,security-nfr}-handoff.md (frozen citations)"
  - "agent-factory/README.md (bootstrap copy-paste phrasing)"
  - "root AGENTS.md (UNKNOWN - verify command slots)"
provides:
  - "agent-factory/workflows/00-bootstrap-greenfield.md (greenfield bootstrap lifecycle workflow)"
  - "agent-factory/workflows/01-bootstrap-brownfield.md (brownfield bootstrap lifecycle workflow)"
affects:
  - ".planning/phases/04-workflows-cadence-backpressure/check-structure.sh (V-02/V-03/V-12 flip green for 00/01)"
tech-stack:
  added: []
  patterns:
    - "10-section v2 workflow template (FLOW-05), headings in spec §7 order"
    - "minimal kind: workflow frontmatter (kind/order/cadence = 3 fields)"
    - "D-24 terse derivation — frozen-name-only citations, no invented parallel names"
    - "clear voice for Steps/Board moves/Stop/Done; light grug wink only in When-to-use opener (D-27)"
key-files:
  created:
    - "agent-factory/workflows/00-bootstrap-greenfield.md"
    - "agent-factory/workflows/01-bootstrap-brownfield.md"
  modified: []
decisions:
  - "00 names memory-bank/greenfield-plan.md as the planning output and leaves plans/initial-plan.md a thin stub (RESEARCH Open Question 1)"
  - "When-to-use openers echo the README bootstrap copy-paste phrasing (RESEARCH Open Question 2)"
  - "AGENTS.md command slots stay UNKNOWN - verify in both files — filled per-project by the Scribe at runtime, never fabricated (T-04-04-01 mitigation)"
metrics:
  duration: 4m
  completed: 2026-06-03
---

# Phase 04 Plan 04: Bootstrap Workflows (greenfield + brownfield) Summary

Authored the two FLOW-01 bootstrap lifecycle workflows on the 10-section v2 template — `00-bootstrap-greenfield.md` (idea → seeded project plane) and `01-bootstrap-brownfield.md` (existing repo → mapped, scanned, safe first tickets) — reproducing their §7.1/§7.2 `Flow:`/`Done when:` spines and deriving the connective sections from frozen names only, with AGENTS.md command slots left `UNKNOWN - verify`.

## What Was Built

- **`agent-factory/workflows/00-bootstrap-greenfield.md`** (47 lines) — Greenfield bootstrap. Reproduces §7.1 Flow (`idea → Orchestrator → Greenfield Mapper → AGENTS.md Scribe → BA/PM → System Analyst → Architect/Design → initial tickets`). Steps compose the frozen roles (D-23): Greenfield Mapper → `memory-bank/greenfield-plan.md`; AGENTS.md Scribe → root `AGENTS.md` (slots `UNKNOWN - verify`); BA/PM → `product-handoff.md` + epics/tickets; System Analyst → `system-handoff.md`; Architect/Design → `architecture-handoff.md` + ADRs into `memory-bank/50-decisions/` + seeds `plans/nfr-catalog.md`; seeds `plans/board.md`, confirms `factory.config.json`. Done condition reproduces the §7.1 Done-when (board seeded, config present, first tickets exist). `plans/initial-plan.md` left a thin stub; `greenfield-plan.md` is the planning output.
- **`agent-factory/workflows/01-bootstrap-brownfield.md`** (46 lines) — Brownfield bootstrap. Reproduces §7.2 Flow (`existing repo → Orchestrator → Brownfield Mapper → AGENTS.md Scribe → Architect/Design review → Security/NFR high-risk scan → safe first tickets`). Steps: Brownfield Mapper → `memory-bank/brownfield-map.md`; AGENTS.md Scribe → root `AGENTS.md` (slots stay `UNKNOWN - verify`); Architect/Design review; Security/NFR high-risk scan → `security-nfr-handoff.md` with result `PASS | PASS_WITH_RISKS | BLOCKED`; safe first tickets. Stop condition reproduced: Security/NFR `BLOCKED` halts the bootstrap. Done condition reproduces the §7.2 Done-when (known commands + risks documented, safe first tickets, board seeded, config present).

Both files carry minimal `kind: workflow` frontmatter (3 fields: `kind` / `order` / `cadence: both`), the 10 v2 template headings in spec order, and clear-voice operational content with a single light grug wink confined to the `When to use` opener.

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered; both tasks were pure markdown authoring against frozen contracts.

## Threat Model Coverage

- **T-04-04-01 (Tampering — fabricated AGENTS.md gate command):** mitigated. Both files explicitly leave the `AGENTS.md` command slots `UNKNOWN - verify`, state the slots are filled per-project by the Scribe at runtime, and instruct "never fabricate a command here." No real gate command appears in either file.
- **T-04-04-02 (Information Disclosure — brownfield omitting the Security/NFR scan):** mitigated. `01` reproduces the §7.2 Security/NFR high-risk scan step → `security-nfr-handoff.md` with `PASS | PASS_WITH_RISKS | BLOCKED`, adds a `BLOCKED`-halts Stop condition, and requires "the known commands and the risks are documented" in the Done condition.

No new security surface introduced (markdown-authoring task, no runtime/network/auth).

## Verification

Harness `sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh`:
- V-02 (10 sections in order): PASS for 00 and 01.
- V-03 (minimal `kind: workflow` frontmatter ≤ 3 fields): PASS for 00 and 01 (3 fields each).
- V-12 (drift guard — no `plans/*-handoff`, cited handoffs in the frozen 16): no drift in either file.
- Task-local checks: `OK-00` and `OK-01` (presence + required-string greps) both pass.

Overall harness moved 38 → 32 failures as the 6 checks for 00/01 flipped green. **Partial PASS is expected**: Wave-3 workflows (`12-release.md`, `13-incident.md`) and the other unwritten Wave-1/Wave-2 plans remain absent — those FAILs are out of scope for 04-04 and will flip green as their plans land.

## Self-Check: PASSED

- FOUND: agent-factory/workflows/00-bootstrap-greenfield.md
- FOUND: agent-factory/workflows/01-bootstrap-brownfield.md
- FOUND commit a9f8c56 (00-bootstrap-greenfield)
- FOUND commit c61c47c (01-bootstrap-brownfield)
