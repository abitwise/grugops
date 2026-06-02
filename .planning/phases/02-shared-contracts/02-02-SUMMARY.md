---
phase: 02-shared-contracts
plan: 02
subsystem: handoffs
tags: [handoffs, v2-templates, release, incident, retro, refinement, sprint, contracts]
requires:
  - "plans/traceability.md (frozen ID scheme: REL-xxxx, INC-xxxx, SPRINT-xx)"
  - "plans/metrics.md (frozen metric names cited by retro-notes Metrics snapshot)"
  - "plans/board.md / plans/sprints/SPRINT-xx.md (sprint-plan mirrors this shape)"
provides:
  - "agent-factory/handoffs/release-handoff.md (§8.1 — REL-xxxx, Status enum, human-approval line)"
  - "agent-factory/handoffs/incident-postmortem.md (§8.2 — INC-xxxx, blameless systemic root cause)"
  - "agent-factory/handoffs/retro-notes.md (§8.3 — Metrics snapshot, Keep / Stop / Start)"
  - "agent-factory/handoffs/refinement-notes.md (§8.4 — split/size/priority/promote)"
  - "agent-factory/handoffs/sprint-plan.md (§8.5 — one-off mirror of SPRINT-xx.md)"
affects:
  - "Phase-4 ceremony/enterprise workflows (12-release, 13-incident, retro, refinement, sprint planning) consume these packets"
tech-stack:
  added: []
  patterns:
    - "kind: handoff + stage frontmatter (D-13) above a spec-verbatim body"
    - "clear voice in safety/money files (release, incident) per brand §4.3 / D-00"
    - "empty-but-shaped: headings/stubs only, zero fake data (D-03)"
key-files:
  created:
    - agent-factory/handoffs/release-handoff.md
    - agent-factory/handoffs/incident-postmortem.md
    - agent-factory/handoffs/retro-notes.md
    - agent-factory/handoffs/refinement-notes.md
    - agent-factory/handoffs/sprint-plan.md
  modified: []
decisions:
  - "[02-02] §8.1 and §8.2 bodies reproduced byte-identically to the spec (verified by diff); §8.3/§8.4 headings verbatim with allowed explanatory HTML comments"
  - "[02-02] retro-notes Metrics snapshot cites the frozen metric names from plans/metrics.md (Throughput, Cycle time, Lead time, WIP, Blocked time, Rework rate, Gate pass rate, Escaped defects, Velocity) — does not redefine them"
  - "[02-02] sprint-plan.md given the literal SPRINT-xx placeholder + Goal/Committed items (with sizes)/Capacity, faithful to §8.5's prose description (no verbatim heading block exists in the spec)"
metrics:
  duration: "1m"
  completed: "2026-06-02"
  tasks: 2
  files: 5
requirements: [HAND-02]
---

# Phase 2 Plan 2: v2 Handoff Templates Summary

Authored the 5 v2 handoff templates under `agent-factory/handoffs/`, each reproduced verbatim from spec §8.1–8.5 with `kind: handoff` + stage frontmatter — satisfying HAND-02.

## What Was Built

| File | Spec § | Signature content |
|------|--------|-------------------|
| `release-handoff.md` | §8.1 | `REL-xxxx` title, `dev -> staging -> prod` path, `Approved by (human role/name)` line, `READY_TO_RELEASE \| BLOCKED \| RELEASED` Status enum |
| `incident-postmortem.md` | §8.2 | `INC-xxxx` title, blameless `Root cause (systemic, not personal)` framing preserved |
| `retro-notes.md` | §8.3 | `## Metrics snapshot` citing frozen metric names, `## Keep / Stop / Start` |
| `refinement-notes.md` | §8.4 | `## Split decisions (XL -> children)`, `## Promoted to Ready (IDs)` |
| `sprint-plan.md` | §8.5 | `SPRINT-xx` mirror — Goal, Committed items (with sizes), Capacity |

All 5 carry minimal `kind: handoff` + `stage` frontmatter (D-13) above the spec-verbatim body. Clear professional voice throughout — no grug voice in the safety/money files (brand §4.3, D-00). Empty-but-shaped: headings/stubs only, zero fake release IDs, incident data, sprint numbers, or ticket IDs (D-03). No workflow behavior added (when to release / declare an incident is Phase-4 content).

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | release-handoff + incident-postmortem (§8.1, §8.2) | `765d2ce` | release-handoff.md, incident-postmortem.md |
| 2 | retro-notes + refinement-notes + sprint-plan (§8.3, §8.4, §8.5) | `e710c24` | retro-notes.md, refinement-notes.md, sprint-plan.md |

## Verification Evidence

- All 5 files exist (`test -f` for each → pass).
- Signature headings: `grep -q 'READY_TO_RELEASE'` (release), `grep -q 'systemic, not personal'` (incident), `grep -q 'Keep / Stop / Start'` (retro) → all pass.
- Frontmatter: `grep -L '^kind: handoff'` across all 5 → empty (all have it).
- No-fake-data invariant: `! grep -rEq 'REL-[0-9]{4}|INC-[0-9]{4}|SPRINT-[0-9]{2}'` → holds (titles use literal `xxxx` / `xx` placeholders).
- Byte-fidelity: `diff` of §8.1 body (spec lines 814-830) and §8.2 body (lines 835-845) against the file bodies (frontmatter stripped) → IDENTICAL for both. §8.3/§8.4 heading lines match the spec verbatim.
- Voice scan: `grep -niE '\bgrug\b|complexity demon'` on release-handoff and incident-postmortem → no matches (clear voice intact in safety/money files).

## Threat Model Compliance

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-02-04 (release Status enum + human-approval line) | `Approved by (human role/name)` + `READY_TO_RELEASE \| BLOCKED \| RELEASED` reproduced verbatim | `grep -q 'Approved by'` passes — "humans decide, agents execute" encoded |
| T-02-05 (grug voice in safety/money file) | Clear voice locked; manual voice scan found no grug voice | Passes |
| T-02-06 (false postmortem framing) | `Root cause (systemic, not personal)` preserved verbatim | `grep -q 'systemic, not personal'` passes — blameless contract intact |

No new security surface introduced (static markdown, no code, no data flow).

## Deviations from Plan

None - plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered; no architectural decisions required.

## Known Stubs

None. These are intentionally empty-but-shaped templates per D-03 (headings/stubs only, no fake data). The empty shape is the deliverable — these are user-facing copy-paste templates, not data files. Phase-4 ceremony/enterprise workflows populate instances at runtime.

## Self-Check: PASSED

- Files: all 5 found on disk (`agent-factory/handoffs/{release-handoff,incident-postmortem,retro-notes,refinement-notes,sprint-plan}.md`).
- Commits: `765d2ce` and `e710c24` both present in git history.
