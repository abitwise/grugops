---
phase: 14-security-audit-owasp-asvs-checklist-re-anchor
plan: 02
subsystem: security-audit-workflow
tags: [workflow, orchestrator, owasp-asvs, security, routing]
requires:
  - "agent-factory/workflows/14-ui-design-to-build.md (skeleton precedent)"
  - "agent-factory/workflows/05-pr-quality-gate.md (the gate referenced by filename)"
  - "agent-factory/roles/security-nfr.md (the role that runs workflow 15)"
  - "security.asvs_level + security.block_on config keys (shipped Phase 10)"
provides:
  - "agent-factory/workflows/15-security-audit.md (deep ASVS audit workflow, run by Security/NFR)"
  - "security-audit classification + workflow-map row in the Orchestrator"
affects:
  - "Plan 03 (guard_voice scans workflow 15 — kept clean clear-voice)"
  - "Phase 15 gate-convergence (05-pr-quality-gate.md reads block_on against wf15 severities)"
tech-stack:
  added: []
  patterns:
    - "reference-don't-restate (cite 05-pr-quality-gate.md by filename, never restate the gate loop)"
    - "audit-produces / gate-enforces (D-07: wf15 never self-blocks)"
    - "append-only workflow numbering (no renumber of 00-14)"
key-files:
  created:
    - "agent-factory/workflows/15-security-audit.md"
  modified:
    - "agent-factory/roles/orchestrator.md"
decisions:
  - "D-06: workflow 15 is the standalone deep audit, distinct from the per-ticket Security/NFR check; same In Security/NFR column"
  - "D-07: workflow 15 emits severity-tagged findings only; block_on is read at the gate; wf15 never self-blocks"
  - "D-08: reference 05-pr-quality-gate.md by filename, never restate its loop"
  - "D-09: default severity map L1->high, L2->medium, L3->low; auditor MAY override with a stated reason + named owner"
  - "No clarifying note added to the orchestrator map row — byte headroom preserved; the workflow file itself carries the deep-vs-per-ticket distinction"
metrics:
  duration: ~12 min
  completed: 2026-06-13
  tasks: 2
  files: 2
  commits: 2
---

# Phase 14 Plan 02: Security-audit workflow & Orchestrator registration Summary

Authored `15-security-audit.md` — the standalone deep OWASP ASVS 5.0 audit run by the Security/NFR role on the workflow-14 skeleton — and registered a `security-audit` classification routing to it in the Orchestrator, append-only with no renumber of workflows 00–14. The workflow produces severity-tagged findings and references `05-pr-quality-gate.md` by filename for enforcement; it never restates the gate loop and never self-blocks (audit produces, gate enforces — D-07/D-08).

## What was built

### Task 1 — Workflow 15 (deep ASVS audit, reference-don't-restate) — `f621101`
`agent-factory/workflows/15-security-audit.md` (3878 B), mirroring the `14-ui-design-to-build.md` skeleton:
- Frontmatter `kind: workflow`, `order: 15`, `cadence: both`; title `# Workflow: Security audit (OWASP ASVS)`.
- All 9 workflow-14 sections in order: When to use, Agents involved, Inputs required, Steps, Board moves, Handoffs produced, Trace updates, Done condition, Commit. The optional `## Metrics emitted` section is omitted (mirrors wf14).
- **When to use:** a deep, standalone ASVS audit run on-demand / per-phase / per-milestone, distinct from the lightweight per-ticket Security/NFR check that runs in the same `In Security/NFR` column (D-06), anchored to OWASP ASVS 5.0.
- **Agents involved:** single agent = Security/NFR, writes `plans/handoffs/<TICKET-ID>-security-nfr.md`; role-switch-protocol pointer line copied verbatim from wf14 line 16.
- **Inputs required:** `security.asvs_level` + `security.block_on` from `.grugops/factory.config.json`, the checklist `agent-factory/checklists/security-nfr-checklist.md`, the change under review, and the `autonomy` setting.
- **Steps:** (1) read-time cumulative level filter (`L ≤ asvs_level`; L1=70 / L2=253 / L3=345), stated honestly, file not regenerated per dial; (2) walk the filtered checklist — every pass cites evidence or reads `UNKNOWN - verify`; (3) D-09 default severity map (L1 fail→high, L2→medium, L3→low) with the named-owner override; (4) enforcement verified per `05-pr-quality-gate.md` using wf14's verbatim "live there — this workflow references that gate and does not restate it" phrasing; "the gate reads `security.block_on`"; "this workflow never blocks on its own."
- **Done condition / Commit:** honor `autonomy=pr` (humans hold merge and deploy); branch-guard-first commit, slug `grugops/security-audit-<id>`, never merge/deploy.
- Written in clean clear professional voice — no caveman fence, no VOICE_MARKERS token (required before Plan 03 adds it to `guard_voice`). Never writes the string §14 — the gate is cited by filename only.

### Task 2 — Register security-audit → workflow 15 in the Orchestrator — `6608343`
`agent-factory/roles/orchestrator.md` (6759 B → 6822 B), two append-only edits:
1. Classification list: appended `| `security-audit`` after `ui-build`, matching the existing backtick+pipe formatting.
2. Workflow-map table: appended `| security-audit | `15-security-audit.md` |` immediately after the `ui-build | 14-ui-design-to-build.md` row.

The routing matrix's existing `Need risk/security/compliance -> Security/NFR` line (line 59) already covers the routing target, so no matrix change was needed. No renumber of 00–14: the `14-ui-design-to-build.md` and `13-incident.md` rows are unchanged. orchestrator.md stays at 6822 B, under its `role_ceiling()` WARN (7165) and FAIL (7570) — no ceiling bump needed.

## Verification

Both tasks: `sh scripts/check-foundation-guards.sh` exits 0 (ALL CHECKS PASSED) — baseline was green before and remains green after both surfaces were added.

Plan-level (V-8 / V-9), all confirmed via grep:
- Workflow 15 exists with `order: 15` + title, cites `05-pr-quality-gate.md`, omits `§14`, all 9 sections present, references `security.asvs_level` + `security.block_on`, no VOICE_MARKERS.
- Orchestrator carries `security-audit` + the `15-security-audit.md` map row (paired in one table row), no renumber of 00–14, under the byte ceiling.

## Deviations from Plan

None — both tasks executed exactly as written. No Rule 1–4 deviations, no auth gates, no architectural changes. The plan installs zero packages (markdown-only), so the Package Legitimacy Gate was moot (threat T-14-SC, disposition n/a).

## README registration (Task 2, recorded honestly)

`UNKNOWN - verify` — **the README has no classification→workflow map to update.** Confirmed by grep: `agent-factory/README.md` contains only copy-paste Orchestrator prompts (with inline `(workflow NN)` annotations), not a classification→workflow-file table. There is no `ui-build`/`14-ui-design-to-build.md` row in the README — workflow 14 was never registered there either, so this is consistent with the wf14 precedent. No map was fabricated. The Orchestrator's own workflow-map table (line 91 "must stay consistent with README") remains the single live registration; if a README map is added in a future phase, the `security-audit | 15-security-audit.md` row should be added there too.

## Threat-model adherence

- **T-14-05 (EoP — self-blocking):** mitigated. Workflow 15 has no block/fail terminal; it references `05-pr-quality-gate.md` and explicitly states "this workflow never blocks on its own." Enforcement stays single-source at the gate.
- **T-14-06 (Repudiation — findings):** mitigated. Every pass cites evidence or reads `UNKNOWN - verify`; the severity override requires a stated reason + named owner.
- **T-14-07 (Tampering — numbering / gate reference):** mitigated. The gate is cited by filename (`05-pr-quality-gate.md`), never the brittle `§14` string (verified absent); `order: 15` appended only, 00–14 untouched.

## Commits

- `f621101` feat(14-02): add workflow 15 deep ASVS security audit
- `6608343` feat(14-02): register security-audit classification -> workflow 15

## Self-Check: PASSED

- FOUND: agent-factory/workflows/15-security-audit.md
- FOUND: agent-factory/roles/orchestrator.md (modified, both registration sites)
- FOUND commit: f621101
- FOUND commit: 6608343
