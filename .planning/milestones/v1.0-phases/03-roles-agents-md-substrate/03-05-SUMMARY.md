---
phase: 03-roles-agents-md-substrate
plan: 05
subsystem: roles
tags: [roles, qe, security-nfr, uat, role-01, caveman-prompt]
requires:
  - "03-01 (orchestrator + check-structure.sh validator)"
  - "Phase 2 handoffs (qe-handoff, security-nfr-handoff, uat-handoff) + checklists (security-nfr, uat)"
  - "Phase 1 frozen paths (factory.config.json, board.md, traceability.md, nfr-catalog.md)"
provides:
  - "agent-factory/roles/qe-e2e.md — QE/E2E core role (break the feature, tests)"
  - "agent-factory/roles/security-nfr.md — Security/NFR core role (risk/security gate)"
  - "agent-factory/roles/uat-planner.md — UAT Planner core role (business acceptance)"
  - "ROLE-01 fully satisfied (11/11 core roles authored)"
affects:
  - "Phase 4 workflows (sequence In Review → In Security/NFR → Ready for UAT → In UAT board moves)"
  - "Phase 6 validator (9-section presence checks; check-structure.sh now greens these 3)"
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-15): verbatim caveman prompt + terse frozen-path connective tissue"
    - "D-17 universal v2 lines rendered identically (config first / board move / traceability append)"
    - "D-19 single-source 12-rules pointer (no rule text restated)"
    - "D-21 voice split: grug caveman prompt; CLEAR voice on security/compliance explanation"
key-files:
  created:
    - "agent-factory/roles/qe-e2e.md"
    - "agent-factory/roles/security-nfr.md"
    - "agent-factory/roles/uat-planner.md"
  modified: []
decisions:
  - "Security/NFR explanation text (triggers, result tokens, compliance notes) authored in CLEAR voice per D-21; only the verbatim caveman prompt is grug voice"
  - "All three cite real agent-factory/handoffs/ + agent-factory/checklists/ paths; no plans/-prefixed handoff drift (D-15)"
metrics:
  duration: "4m"
  completed: "2026-06-03"
  tasks: 3
  files: 3
---

# Phase 3 Plan 05: Quality/Acceptance Back-End Core Roles Summary

Authored the final three core role prompts — `qe-e2e.md`, `security-nfr.md`, `uat-planner.md` — each a §5 9-section skeleton with a byte-verbatim caveman prompt plus terse frozen-path connective tissue, completing ROLE-01 (11/11 core roles).

## What Was Built

| Task | Role | File | Caveman prompt src | Emits | Owns board exit |
|------|------|------|--------------------|-------|-----------------|
| 1 | QE/E2E | `agent-factory/roles/qe-e2e.md` | §5.A.9 (L473–478) | `agent-factory/handoffs/qe-handoff.md` | `In Review` exit (→ Security/NFR or UAT) |
| 2 | Security/NFR | `agent-factory/roles/security-nfr.md` | §5.A.10 (L485–489) | `agent-factory/handoffs/security-nfr-handoff.md` | `In Security/NFR` exit (→ Ready for UAT) |
| 3 | UAT Planner | `agent-factory/roles/uat-planner.md` | §5.A.11 (L496–499) | `agent-factory/handoffs/uat-handoff.md` | `Ready for UAT → In UAT`, `In UAT` exit |

All three carry `kind: role` + `tier: core`, the three D-17 universal lines (read `factory.config.json` first; transition `plans/board.md`; append to `plans/traceability.md`), and a one-line 12-rules pointer to `AGENTS.md`. None restate the 12-rules text.

Role-specific wiring:
- **qe-e2e.md** — coverage-vs-threshold enforcement in enterprise mode; reads the engineer's `implementation-handoff.md`; reports gaps; "test behavior, do not change it" hard limit.
- **security-nfr.md** — carries the full §5.A.10 trigger list (auth, 2FA, biometrics, payments, banking, investment data, personal data, GDPR, public API, file upload, admin action, DB migration, queue/event, external integration, perf-sensitive flow); cites `agent-factory/checklists/security-nfr-checklist.md`, checks performance against `plans/nfr-catalog.md`, names the `PASS | PASS_WITH_RISKS | BLOCKED` result tokens, and references Section 13 for handing deeper compliance work to the Compliance Officer.
- **uat-planner.md** — cites `agent-factory/checklists/uat-checklist.md`; signoff checklist requires a named human role; "plan acceptance, do not code / never self-sign" hard limit.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes, no architectural decisions, no blocking issues. All three caveman prompts reproduced byte-exact from the spec; all cited handoff/checklist paths confirmed present on disk before authoring.

## Verification

- Each file passes its Task automated grep (9-section headings present; `tier: core`; real handoff path cited; `factory.config.json` cited; `plans/.*-handoff` drift guard empty).
- `check-structure.sh`: `qe-e2e.md`, `security-nfr.md`, `uat-planner.md` all report `9/9 sections`; drift-guard check [f] PASS; single-source-12-rules check [g] PASS.
- Plan-level gate: `grep -l 'tier: core' agent-factory/roles/*.md | wc -l` == **11** → ROLE-01 satisfied.
- Remaining 7 validator FAILs are the unbuilt enterprise roles (Plans 06/07) and root `AGENTS.md` (Plan 08) — out of scope here; expected RED→green progression.
- D-21 voice check (manual): security/compliance explanation text in `security-nfr.md` (triggers, result tokens, "findings written in clear language, never softened") is CLEAR voice; only the `## Caveman prompt` block is grug.

## Threat Model Compliance

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-03-Info (security/compliance explanation voice) | mitigate | Done — `security-nfr.md` security text is CLEAR voice; caveman prompt verbatim/grug (D-21) |
| T-03-Tamper (handoff/checklist path citations) | mitigate | Done — real `agent-factory/handoffs/` + `agent-factory/checklists/` paths; drift guard empty (D-15) |
| T-03-Info (12-rules single-source) | mitigate | Done — one-line `AGENTS.md` pointer; no rule text restated (D-19) |

## Self-Check: PASSED

- FOUND: agent-factory/roles/qe-e2e.md
- FOUND: agent-factory/roles/security-nfr.md
- FOUND: agent-factory/roles/uat-planner.md
- FOUND commit: db62b1f (qe-e2e.md)
- FOUND commit: d38c5e9 (security-nfr.md)
- FOUND commit: 6f212ad (uat-planner.md)
