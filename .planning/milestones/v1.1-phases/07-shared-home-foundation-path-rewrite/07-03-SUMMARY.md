---
phase: 07-shared-home-foundation-path-rewrite
plan: 03
subsystem: workflow-tier-path-rewrite
tags: [path-rewrite, config-refs, handoff-split, workflows, instance-naming]
requires:
  - "07-01: canonical kit-vs-state rule + .grugops/ config convention + AGENTS.md handoff-line clarification"
  - "07-02: FROZEN <stage> token table (reused byte-identically here); role-tier handoff split precedent"
provides:
  - "Every config-bearing workflow reads .grugops/factory.config.json (D-02), #field anchors preserved"
  - "All 14 'Handoffs produced' sections name ticket-scoped plans/handoffs/<ID>-<stage>.md instances filled from the kit templates (D-03/D-05)"
  - "04-ticket-to-pr read side + 05-pr-quality-gate read of implementation-handoff point at the instance (D-06)"
  - "09-daily-sweep + 12-release collective 'open handoffs' inputs read plans/handoffs/ runtime instances"
  - "Genuine template-dir reads stay bare agent-factory/handoffs/ (KIT, D-01)"
affects:
  - "Plan 04 (build gate): scopes Assertion 1 (zero config refs) + Assertion 2 (allowlist-minus over handoffs) across these 14 workflows — all GREEN now"
tech-stack:
  added: []
  patterns:
    - "Per-ref semantic judgment for handoff buckets — never blanket sed (Pitfall 2)"
    - "Workflow write-step + 'Handoffs produced' header name the plans/handoffs/<ID>-<stage>.md instance; template basename retained as the bare-dir KIT read"
    - "#field anchor preservation on config refs (#quality on 05-pr-quality-gate)"
    - "Bare basename labels (produced-artifact mentions in Done/Commit/Stop sections) re-pointed at the instance for trail coherence"
key-files:
  created: []
  modified:
    - agent-factory/workflows/00-bootstrap-greenfield.md
    - agent-factory/workflows/01-bootstrap-brownfield.md
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/workflows/05-pr-quality-gate.md
    - agent-factory/workflows/06-uat-pack.md
    - agent-factory/workflows/07-backlog-refinement.md
    - agent-factory/workflows/08-sprint-planning.md
    - agent-factory/workflows/09-daily-sweep.md
    - agent-factory/workflows/11-retro.md
    - agent-factory/workflows/12-release.md
    - agent-factory/workflows/13-incident.md
decisions:
  - "10-sprint-review.md left untouched — it carries neither a config ref nor a handoff ref (verified); it is not in either task's file list"
  - "Shorthand `factory.config.json#field` refs (no agent-factory/config/ prefix) in 07/09 left bare per minimal-diff (D-01) — they are not agent-factory/config/ refs and do not trip the gate"
  - "Bare produced-artifact basename labels in Done/Commit/Stop/Agents-involved sections re-pointed at plans/handoffs/<ID>-<stage>.md so the whole workflow body names one instance spelling (trail coherence, mitigates T-07-03-03)"
metrics:
  duration: 11m
  tasks: 2
  files: 13
  completed: 2026-06-06
---

# Phase 7 Plan 03: Workflow Tier Path Rewrite Summary

Rewrote the workflow tier to the frozen kit/state convention: every config-bearing workflow now reads `.grugops/factory.config.json` (D-02, `#field` anchors preserved), and all 14 workflows' "Handoffs produced" sections — plus the `04-ticket-to-pr` / `05-pr-quality-gate` read sides (D-06) and the `09-daily-sweep` / `12-release` collective "open handoffs" inputs — now name ticket-scoped runtime instances `plans/handoffs/<ID>-<stage>.md` filled from the kit templates (D-03/D-05), using the exact `<stage>` tokens frozen by Plan 02. Genuine template-dir reads stay bare `agent-factory/handoffs/` (KIT, D-01).

## What Was Built

| Task | What | Files | Commit |
| ---- | ---- | ----- | ------ |
| 1 | Config refs `agent-factory/config/factory.config.json[#field]` -> `.grugops/factory.config.json[#field]` across the 13 config-bearing workflows; `#quality` and all other `#field` anchors preserved verbatim | 12 files (10-sprint-review has no config ref) | `2b76a26` |
| 2 | Handoff split: all 14 "Handoffs produced" sections + write-step lines + 04/05 read sides (D-06) + 09/12 collective inputs + 03/06 upstream-input reads converted to ticket-scoped `plans/handoffs/<ID>-<stage>.md` instances; bare produced-artifact basename labels re-pointed at the instance | 13 files (10-sprint-review has no handoff ref) | `c000e69` |

> Note: 12 files carry the Task-1 config edit and the Task-2 handoff edit. To keep each file in a single commit boundary, the config-only edits were committed first (Task 1), then the handoff edits (Task 2). No file is split across commits — each file appears in exactly the commits whose changes it carries.

## Frozen `<stage>` tokens reused byte-identically from Plan 02

All 12 distinct instance names emitted by the workflow tier match Plan 02's frozen table exactly (verified via `grep -o` dedupe + byte-identity cross-check against the role tier):

| Instance | Produced/Read by workflow(s) | ID scope |
|----------|------------------------------|----------|
| `plans/handoffs/<TICKET-ID>-product.md` | 00, 02 (produce); 03 (read) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-system.md` | 00, 03 (produce) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-architecture.md` | 00 (produce); 05 (conditional produce) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-implementation.md` | 04 (produce); 05 (read, D-06); 12 (read) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-qe.md` | 04, 05 (produce); 12 (read) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-security-nfr.md` | 01, 04, 05 (produce); 06 (read), 12 (read) | TICKET-ID |
| `plans/handoffs/<TICKET-ID>-uat.md` | 06 (produce); 12 (read) | TICKET-ID |
| `plans/handoffs/<REL-ID>-release.md` | 12 (produce) | REL- |
| `plans/handoffs/<INC-ID>-postmortem.md` | 13 (produce) | INC- |
| `plans/handoffs/<SPRINT-ID>-retro.md` | 11 (produce) | sprint ID |
| `plans/handoffs/<SPRINT-ID>-refinement.md` | 07 (produce) | sprint ID |
| `plans/handoffs/<SPRINT-ID>-sprint-plan.md` | 08 (optional produce) | sprint ID |

## Handoff bucket map (per-ref semantic judgment, never sed)

- **"Handoffs produced" header (Bucket B, the 14-workflow canonical pattern):** 00 (product/system/architecture), 01 (security-nfr), 02 (product), 03 (system), 04 (implementation/qe/security-nfr), 05 (qe/security-nfr/architecture), 06 (uat), 07 (refinement), 08 (sprint-plan, optional), 11 (retro), 12 (release), 13 (postmortem). 09-daily-sweep produces none (it reads, see below).
- **Write-step lines (Bucket B):** 00 steps 3-5, 01 step 4, 02 step 3, 03 step 3, 06 step 1, 07 step 6, 11 step 3, 13 step 4 — each phrased "fill the `<template>.md` template from `agent-factory/handoffs/` into the instance `plans/handoffs/<ID>-<stage>.md`" (mirrors the Plan-02 role-tier wording).
- **Read upstream instance (Bucket C, D-06):** 03 reads `<TICKET-ID>-product` (epic scope); 05 reads `<TICKET-ID>-implementation` (the produced instance); 06 reads `<TICKET-ID>-security-nfr` upstream input.
- **Collective dir-only inputs -> runtime instances:** 09-daily-sweep ("the open handoffs", 2 sites) and 12-release ("the implementation/QE/security-NFR/UAT handoffs", input + Done + Commit) now read the `plans/handoffs/` instances.
- **Bare basename labels re-pointed for trail coherence:** Agents-involved parentheticals in 04/05; Done/Stop/Commit produced-artifact mentions in 00/01/02/06/07/08/11/12/13. Each now names the same `plans/handoffs/<ID>-<stage>.md` spelling used in that workflow's body (mitigates the `<stage>`-drift threat T-07-03-03).
- **Bare template-dir reads stay KIT (Bucket D):** every write-step's `<template>.md` template read and every "Handoffs produced" parenthetical "(filled from the templates in `agent-factory/handoffs/`)"; checklist refs (`definition-of-ready.md`, `uat-checklist.md`, `release-readiness-checklist.md`), `_commit-convention.md`, `_role-switch-protocol.md`, and the `05-pr-quality-gate.md` workflow self-ref all untouched.

## Success Criteria

- **SC3 (config migrated):** `grep -rl 'agent-factory/config/' agent-factory/workflows/` returns 0 files; `#quality` anchor preserved in 05-pr-quality-gate; all other `#field` anchors verbatim. PASS.
- **SC3 (handoff split + D-05):** all 14 "Handoffs produced" sections name ticket-scoped `plans/handoffs/<ID>-<stage>.md` instances filled from the kit templates; `<stage>` tokens match Plan 02 byte-identically (12/12 distinct names verified). PASS.
- **SC3 (D-06 read side):** 04 read side reads instances (no `agent-factory/handoffs/implementation-handoff.md` path read remains); 05 reads `plans/handoffs/<TICKET-ID>-implementation.md`. PASS.
- **SC3 (D-01):** genuine template-dir reads and kit-to-kit refs stay bare; allowlist-minus stray check over `agent-factory/workflows/` returns empty (every surviving `agent-factory/handoffs/` ref is a known template basename or the bare-dir form). PASS.
- **SC4 (no env leak):** no `$GRUGOPS_HOME` in any workflow body. PASS.
- **No structural regression:** `node scripts/validate-agent-factory.mjs` exits 0 (ALL CHECKS PASSED) after each task. PASS.

## Deviations from Plan

### Auto-fixed Issues

None. The plan executed exactly as written. No bugs, missing functionality, or blocking issues were encountered.

### Scope judgments (no deviation; per-ref semantic calls flagged for transparency)

**1. Bare produced-artifact basename labels re-pointed at the instance.**
- Several workflows mention a produced handoff by bare basename (no `agent-factory/handoffs/` path prefix) in their Agents-involved / Done / Stop / Commit sections — e.g. `(implementation-handoff.md)`, "the `retro-notes.md` is written". These do NOT trip either gate assertion (no `agent-factory/config/` or non-template `agent-factory/handoffs/` path). They were nevertheless re-pointed at the matching `plans/handoffs/<ID>-<stage>.md` instance so every workflow body names one instance spelling — directly serving the cross-plan `<stage>`-consistency goal (T-07-03-03) and matching the Plan-02 role-tier precedent. This is a within-scope semantic call, not a plan deviation.

**2. Shorthand `factory.config.json#field` refs left bare.**
- 07-backlog-refinement (`factory.config.json#wip_limits`) and 09-daily-sweep (`factory.config.json#wip_limits`, `#blocked_escalation_days`) carry path-less basename references to the config file. These are NOT `agent-factory/config/` refs and are out of scope for the config-path rewrite (the acceptance criterion is "zero `agent-factory/config/` refs"). Left bare per minimal-diff (D-01); they resolve contextually to the `.grugops/factory.config.json` already named in each file's Inputs section.

## Threat surface scan

No new security-relevant surface introduced — this plan is markdown path-root rewrites only. All threat-register mitigations were applied:
- **T-07-03-01 (data in wrong root):** the 19 dir-only "Handoffs produced" refs were converted by meaning to `plans/handoffs/` instances, never by sed; the allowlist-minus stray check over `agent-factory/workflows/` is empty (no non-template `agent-factory/handoffs/` ref survives).
- **T-07-03-02 (false-gate):** the `#quality` anchor on 05-pr-quality-gate is preserved verbatim (Task-1 acceptance asserts it survives).
- **T-07-03-03 (broken trail / `<stage>` drift):** every instance name was taken from Plan 02's frozen table; byte-identity cross-checked between role-tier and workflow-tier for `<TICKET-ID>-implementation.md` and `<REL-ID>-release.md`.
- **T-07-03-04 (04 read side missed):** 04's read side + 05's `implementation-handoff` read both point at the instance; no generic-template read remains in 04.
- **T-07-03-SC (package legitimacy):** zero package installs (markdown edits only).

## Known Stubs

None. Every ref resolves to a real template (KIT) or an instance path (STATE). Placeholder ID tokens (`<TICKET-ID>`, `<REL-ID>`, `<INC-ID>`, `<SPRINT-ID>`) are the intended runtime-fill convention (D-05), not stubs.

## Notes

- Authentication gates: none.
- Sequential executor on the shared main working tree; normal git commits with hooks. Touched ONLY the 14 workflow files in this plan's `files_modified` list (13 actually changed; 10-sprint-review carries neither ref and is correctly untouched). No role, op-skill, packaging, or AGENTS.md file was edited.
- The full `scripts/check-kit-refs.sh` gate (Plan 04) will scan these workflows as part of the whole SCAN set; both gate-relevant assertions (zero config refs, allowlist-minus handoffs) are GREEN for the workflow tier now.

## Self-Check: PASSED

- All 13 modified files present on disk and tracked.
- Both task commits present in git history (`2b76a26`, `c000e69`).
- SUMMARY.md present at `.planning/phases/07-shared-home-foundation-path-rewrite/07-03-SUMMARY.md`.
