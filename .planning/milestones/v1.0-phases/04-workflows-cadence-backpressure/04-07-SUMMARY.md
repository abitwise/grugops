---
phase: 04-workflows-cadence-backpressure
plan: 07
subsystem: workflows
tags: [enterprise, release, incident, SAFE-01, FLOW-04, FLOW-05, blameless, deploy-gate]
requires:
  - "agent-factory/roles/release-manager.md (deploy-gate prose analog)"
  - "agent-factory/roles/incident-responder.md (blameless analog)"
  - "agent-factory/handoffs/incident-postmortem.md (frozen blameless framing)"
  - "agent-factory/config/factory.config.json (production_requires_human_confirmation)"
  - ".planning/phases/04-workflows-cadence-backpressure/check-structure.sh (Plan-01 harness)"
provides:
  - "agent-factory/workflows/12-release.md (named-human deploy gate, SAFE-01)"
  - "agent-factory/workflows/13-incident.md (blameless incident path, FLOW-04)"
  - "Full 14-workflow suite GREEN (V-01..V-13, exit 0) — Phase-4 acceptance gate met"
affects:
  - "Phase 5 (SAFE-02): the prose deploy gate in 12 is the contract the mechanical PreToolUse hook will enforce"
  - "Phase 6 (VAL-01): the Node validator will read these two files' 10-section shape"
tech-stack:
  added: []
  patterns:
    - "10-section v2 workflow template (FLOW-05), headings in spec order"
    - "kind: workflow + order + tier frontmatter (3 fields, D-27)"
    - "SAFE-01 as clear-voice, dispatch-neutral prose (no hook mechanics)"
    - "frozen-name citation only (D-24); no invented parallel names"
key-files:
  created:
    - "agent-factory/workflows/12-release.md"
    - "agent-factory/workflows/13-incident.md"
  modified: []
decisions:
  - "Phrase any line carrying a release `-handoff` reference so no `plans/` token precedes it on the same LINE — the V-12 drift guard is a line-level `grep -lE 'plans/.*-handoff'`, and co-locating `plans/releases/REL-xxxx.md` with `release-handoff.md` on one line was a false positive (fixed by reordering, not by weakening the harness)."
metrics:
  duration: 6m
  completed: 2026-06-03
---

# Phase 4 Plan 07: Enterprise Workflows (Release & Incident) Summary

The two enterprise workflows authored on the 10-section v2 template: `12-release.md` renders the named-human production deploy gate (SAFE-01) keyed to `production_requires_human_confirmation: true` and dispatch-neutral, and `13-incident.md` renders the blameless postmortem path (FLOW-04). With both landed, the full 14-workflow structural harness reaches GREEN (V-01..V-13, exit 0) — the Phase-4 acceptance gate.

## What Was Built

### Task 1 — `12-release.md` (named-human release gate, SAFE-01) — commit `8d3168b`
- Reproduces the §7.13 spine: `Ready to Release -> Release Manager -> approval gate -> deploy plan -> (human-confirmed) deploy -> Done`.
- Steps reproduce the release-manager deploy-gate prose verbatim-faithfully in CLEAR voice: set SemVer, compile changelog + release notes, confirm migration/rollback/DR, attach NFR/security/compliance evidence from `plans/nfr-catalog.md`, work `release-readiness-checklist.md`, record a **named human** approval, then a **named human** confirms the production action.
- The gate is keyed to `production_requires_human_confirmation: true`: deploy happens only after a named human approves, the production action is always **human-confirmed**, and the workflow **never deploys prod itself**.
- Output cited: `plans/releases/REL-xxxx.md` + `release-handoff.md`; status `READY_TO_RELEASE | BLOCKED | RELEASED`; board move `Ready to Release -> Done` only after named-human approval.
- **Dispatch-neutral:** contains NO `hooks.json` / `PreToolUse` / `${CLAUDE_PLUGIN_ROOT}` / subagent language (mechanical SAFE-02 enforcement is explicitly Phase 5). 3-field frontmatter (`kind: workflow`, `order: 12`, `tier: enterprise`); 10/10 sections in order. (V-02/V-03/V-11/V-12 green for 12.)

### Task 2 — `13-incident.md` (blameless postmortem, FLOW-04) — commit `57ef84f`
- Reproduces the §7.14 spine: `incident detected -> Incident Responder -> mitigate/rollback -> blameless postmortem -> follow-up tickets`.
- Steps in CLEAR voice: assess blast radius, propose mitigation + rollback (stop the bleeding before the analysis), capture the timeline, write `agent-factory/handoffs/incident-postmortem.md` as a **blameless** postmortem that **never blames a person** — mirroring the frozen `## Root cause (systemic, not personal)` framing — then create follow-up tickets in `plans/tickets/` that enter the frozen `Backlog`, and hand lessons to the Factory Coach.
- Cited frozen names: `incident-postmortem.md`, `INC-xxxx`, `Escaped defects` (frozen-9 subset). No board move (post-release). 3-field frontmatter; 10/10 sections in order. (V-02/V-03/V-13/V-12 green for 13.)

### Task 3 — Full-suite green gate (verification only, no file change)
- `sh .planning/phases/04-workflows-cadence-backpressure/check-structure.sh` exits **0** — **ALL CHECKS PASSED** (V-01..V-13 all green).
- Exactly **14** `*.md` files in `agent-factory/workflows/` (excluding `.gitkeep`); **no `14-*.md`** (the `install` classification has no numbered workflow).
- `check-structure.sh` was **NOT** weakened — confirmed byte-identical to the committed Plan-01 deliverable (`git status --short` on the harness path is empty).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] V-12 drift-guard false positive in 12-release.md**
- **Found during:** Task 1 (running the harness after the first author of `12-release.md`).
- **Issue:** The V-12 drift guard is a **line-level** regex `grep -lE 'plans/.*-handoff'`. Three lines in the first draft co-located `plans/releases/REL-xxxx.md` with the `release-handoff.md` reference on the same line; `.*` bridged the two tokens and tripped the guard as if a forbidden `plans/<name>-handoff` path had been cited (it had not — `release-handoff.md` is the correct frozen `agent-factory/handoffs/` name).
- **Fix:** Reworded the three lines (Agents involved, Handoffs produced, Done condition) so the `release-handoff.md` reference never trails a `plans/` token on the same line — matching how the already-green workflows (06, 11) avoid the guard. This is a phrasing/wiring fix per the Task-3 mandate; the harness was not touched.
- **Files modified:** `agent-factory/workflows/12-release.md` (folded into commit `8d3168b`).
- **Commit:** `8d3168b`

No other deviations — both files reproduce their §7.13/§7.14 spines on the 10-section template and cite only frozen names (D-24).

## Authentication Gates

None — markdown-authoring plan, no auth surface.

## Known Stubs

None — both workflows cite frozen, on-disk artifacts; no empty/placeholder data wired.

## Threat Mitigations Applied (from plan threat_model)

- **T-04-07-01 (EoP — unattended deploy):** mitigated — `12` reproduces the deploy-gate prose ("named human" / "human-confirmed" / "never deploy prod itself") keyed to `production_requires_human_confirmation: true`; V-11 asserts the tokens.
- **T-04-07-02 (Tampering — premature tool coupling):** mitigated — `12` stays dispatch-neutral; no `hooks.json` / `PreToolUse` / `${CLAUDE_PLUGIN_ROOT}` / subagent language (SAFE-02 deferred to Phase 5).
- **T-04-07-03 (Repudiation — blame-driven postmortem):** mitigated — `13` mirrors the `## Root cause (systemic, not personal)` framing; V-13 asserts "blameless".

## Self-Check: PASSED

- FOUND: `agent-factory/workflows/12-release.md`
- FOUND: `agent-factory/workflows/13-incident.md`
- FOUND commit `8d3168b` (12-release)
- FOUND commit `57ef84f` (13-incident)
- Full harness: exit 0, ALL CHECKS PASSED (14/14 workflows, V-01..V-13 green)
