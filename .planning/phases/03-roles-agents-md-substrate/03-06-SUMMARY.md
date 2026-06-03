---
phase: 03-roles-agents-md-substrate
plan: 06
subsystem: roles
tags: [roles, enterprise-pack, release, compliance, incident, agents-md-substrate]
requires:
  - "agent-factory/config/factory.config.json (Phase 1)"
  - "plans/board.md, plans/traceability.md, plans/nfr-catalog.md, plans/releases/, plans/tickets/ (Phase 1)"
  - "agent-factory/handoffs/release-handoff.md, security-nfr-handoff.md, incident-postmortem.md (Phase 2)"
  - "agent-factory/checklists/compliance-checklist.md, release-readiness-checklist.md (Phase 2)"
  - "memory-bank/00-index.md, memory-bank/70-runbook.md (Phase 2)"
provides:
  - "agent-factory/roles/release-manager.md — Release Manager role (ROLE-02)"
  - "agent-factory/roles/compliance-officer.md — Compliance Officer role (ROLE-02)"
  - "agent-factory/roles/incident-responder.md — Incident Responder role (ROLE-02)"
affects:
  - "AGENTS.md (Phase 3 Plan 08) will point at these roles"
  - "Phase-4 release (12) and incident (13) workflows sequence these roles' moves"
  - "Phase-6 validator gates on their 9-section presence + tier: enterprise"
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-00/D-15): verbatim §5.B caveman prompt + terse frozen-path tissue"
    - "tier: enterprise frontmatter (D-16); D-22 mode=enterprise OR §5.B trigger Activates when"
    - "D-21 voice split: grug only in the caveman prompt; clear voice in compliance + human-gate text"
key-files:
  created:
    - "agent-factory/roles/release-manager.md"
    - "agent-factory/roles/compliance-officer.md"
    - "agent-factory/roles/incident-responder.md"
  modified: []
decisions:
  - "Release Manager human-gate reproduced verbatim, clear voice (T-03-EoP, SAFE-01): 'You require approval, and you never deploy prod yourself.'"
  - "Compliance explanation text (Responsibilities/Output/Hard limits) in CLEAR voice; grug confined to the caveman prompt (D-21, T-03-Info)"
  - "Output cites real agent-factory/handoffs/<name>.md paths, never plans/-prefixed (D-15, T-03-Tamper); drift guard empty on all three"
metrics:
  duration: "~6m"
  completed: 2026-06-03
  tasks: 3
  files: 3
---

# Phase 3 Plan 06: Enterprise Roles (Release / Compliance / Incident) Summary

Authored 3 of the 5 enterprise-pack roles — Release Manager, Compliance Officer, Incident Responder — each a `tier: enterprise` 9-section §5 skeleton with its byte-exact §5.B caveman prompt, a D-22 `mode=enterprise OR <trigger>` activation, real frozen-path handoff/checklist citations, and a one-line 12-rules pointer to `AGENTS.md`. The Release Manager carries the verbatim, clear-voice human deploy-gate; the Compliance Officer keeps all compliance explanation in clear voice with grug confined to its prompt.

## What Was Built

- **`agent-factory/roles/release-manager.md`** — Cut releases, set version (SemVer), write changelog + release notes, make deploy/rollback plans; hand to a named human for approval. Output: `plans/releases/REL-xxxx.md` + `agent-factory/handoffs/release-handoff.md` (status `READY_TO_RELEASE | BLOCKED | RELEASED`); attaches NFR evidence to `plans/nfr-catalog.md`; reads `memory-bank/70-runbook.md`; may cite `agent-factory/checklists/release-readiness-checklist.md`. Board moves: owns the `Ready to Release` exit → `Done` after human approval. Hard limits reproduce the human-gate verbatim, clear voice.
- **`agent-factory/roles/compliance-officer.md`** — Classify data, map PII flow, check the regime (GDPR / SOC 2 / ISO 27001 / PCI / sector rules), record controls + gaps. Output: appends to `agent-factory/handoffs/security-nfr-handoff.md` + fills `agent-factory/checklists/compliance-checklist.md` per ticket (result `BLOCKED` if a required control is missing). Board moves: none — a gate within `In Security/NFR`. Activates on `mode=enterprise` OR `compliance_regime` set OR personal/financial/health/payment data.
- **`agent-factory/roles/incident-responder.md`** — Stop the bleeding first, find blast radius, propose mitigation + rollback, write a blameless postmortem, turn lessons into tickets. Output: `agent-factory/handoffs/incident-postmortem.md` (blameless) + follow-up tickets in `plans/tickets/`. Board moves: none — post-release; feeds backlog + retro. Activates on `mode=enterprise` OR a production incident OR a failing SLO.

## Verification

- All three pass their per-task automated gate: 6 required `## ` headings + `tier: enterprise` + the role-specific output path + an empty `plans/*-handoff` drift guard.
- Phase structure validator (`check-structure.sh`): `release-manager.md`, `compliance-officer.md`, `incident-responder.md` each report `PASS — 9/9 sections`. `tier: enterprise == 3` reflects exactly this plan's contribution; the remaining RED checks (`factory-coach.md`/`installer.md` missing, `tier: enterprise == 3 (want 5)`, `AGENTS.md missing`) are out of scope — they land in plans 07/08, and the validator ships RED until Wave 2/3 fully lands ([03-01] decision).
- Byte-exact caveman prompts confirmed against the spec via diff: Release Manager L511–515, Compliance Officer L523–527, Incident Responder L535–539 (each spec range excludes its closing fence).
- Human-gate line "You require approval, and you never deploy prod yourself." present verbatim in the Release Manager Hard limits (clear voice, not softened, not grug — T-03-EoP / SAFE-01).

## Threat Mitigations Applied

| Threat ID | Mitigation | Evidence |
|-----------|------------|----------|
| T-03-EoP | Release Manager human-gate reproduced verbatim, clear voice — not softened | `release-manager.md` Hard limits |
| T-03-Info | Compliance explanation text in clear voice; grug confined to the caveman prompt | `compliance-officer.md` Responsibilities/Output/Hard limits |
| T-03-Tamper | Handoff/checklist citations use real `agent-factory/handoffs/` + `agent-factory/checklists/` paths, never `plans/`-prefixed | drift guard empty on all three |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restructured release-manager.md Output to avoid a false-positive drift-guard match**
- **Found during:** Task 1
- **Issue:** The plan's automated drift guard `! grep -q 'plans/.*-handoff'` matched a single line that contained both `plans/releases/REL-xxxx.md` and the (correct) `agent-factory/handoffs/release-handoff.md` — the greedy `.*` bridged the two paths, producing a false positive even though the cited handoff path is the real, non-drifting one.
- **Fix:** Split the Output section into a two-item list so `plans/releases/...` and `...release-handoff.md` sit on separate lines. No content/meaning change; both paths and the SemVer/status detail are preserved.
- **Files modified:** `agent-factory/roles/release-manager.md`
- **Commit:** `ce3a39a`

## Known Stubs

None — these are role-prompt template files; the intentionally-absent targets (`memory-bank/brownfield-map.md`, real command values, the not-yet-authored `factory-coach.md`/`installer.md`/`AGENTS.md`) are out-of-scope Phase-3/4 deliverables, not stubs in this plan's files.

## Commits

- `ce3a39a` feat(03-06): author release-manager.md enterprise role
- `4b983fb` feat(03-06): author compliance-officer.md enterprise role
- `54cbebe` feat(03-06): author incident-responder.md enterprise role

## Self-Check: PASSED

- Files: all 3 roles + SUMMARY.md present on disk.
- Commits: `ce3a39a`, `4b983fb`, `54cbebe` all in git log.
