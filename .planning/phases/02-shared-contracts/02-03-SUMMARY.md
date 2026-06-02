---
phase: 02-shared-contracts
plan: 03
subsystem: gate-checklists
tags: [checklists, gates, lean-enterprise-tier, verbatim-spec, safety-content]
requires:
  - "docs/initial/agent_factory_builder_spec_v2.md §9.1–9.10 (verbatim source)"
  - "agent-factory/config/factory.config.json (frozen — mode field)"
  - "plans/nfr-catalog.md (frozen — NFR/SLO targets cited, not redefined)"
provides:
  - "10 gate checklists under agent-factory/checklists/ (5 lean + 5 enterprise)"
  - "checklists/00-index.md — lean-vs-enterprise grouping + mode-gating rule"
  - "kind: checklist + tier: lean|enterprise machine-readable tier signal (D-14)"
  - "kind: index frontmatter convention for orientation files (reused in Plan 04)"
affects:
  - "Phase 3 Orchestrator (applies lean DoD in lean mode, enterprise superset in enterprise mode)"
  - "Phase 6 validator (checks each checklist's presence + sections)"
  - "agent-factory/handoffs/ticket-ready-packet.md (mirrors definition-of-ready.md fields)"
tech-stack:
  added: []
  patterns:
    - "Minimal YAML frontmatter (kind + tier) above verbatim spec body (D-13/D-14)"
    - "Verbatim transcription with diff-verification against spec source (D-00)"
    - "kind: index convention for 00-index orientation files (Shared Pattern D)"
key-files:
  created:
    - "agent-factory/checklists/definition-of-ready.md"
    - "agent-factory/checklists/definition-of-done.md"
    - "agent-factory/checklists/pr-review-checklist.md"
    - "agent-factory/checklists/security-nfr-checklist.md"
    - "agent-factory/checklists/uat-checklist.md"
    - "agent-factory/checklists/definition-of-done-enterprise.md"
    - "agent-factory/checklists/compliance-checklist.md"
    - "agent-factory/checklists/accessibility-checklist.md"
    - "agent-factory/checklists/observability-slo-checklist.md"
    - "agent-factory/checklists/release-readiness-checklist.md"
    - "agent-factory/checklists/00-index.md"
  modified: []
decisions:
  - "Index frontmatter convention LOCKED to `kind: index` (no tier:) — to be applied identically to memory-bank/00-index.md in Plan 04 (D-14 'decide once' instruction)"
  - "Each checklist gets a short clear-voice intro paragraph above the verbatim bullet body; the bullets themselves stay byte-identical to spec §9 (intro is additive framing, not a body edit)"
metrics:
  duration: "~3m"
  completed: "2026-06-02"
  tasks: 3
  files: 11
---

# Phase 2 Plan 03: Gate Checklists Summary

All 10 gate checklists (5 lean, 5 enterprise) plus `00-index.md` authored under
`agent-factory/checklists/`, every bullet body reproduced byte-identically from spec
§9.1–9.10 (diff-verified) with `kind: checklist` + `tier:` frontmatter per the LOCKED D-14
tier split, and an index that groups them lean-vs-enterprise and states the mode-gating rule.

## What Was Built

**Task 1 — 5 lean checklists (§9.1, §9.2, §9.4, §9.5, §9.10)** [commit 9ddea31]
`definition-of-ready.md` (authored first so `ticket-ready-packet.md` mirrors it), plus
`definition-of-done.md`, `pr-review-checklist.md`, `security-nfr-checklist.md`,
`uat-checklist.md`. All carry `kind: checklist` + `tier: lean`. Bullet bodies diff-verified
byte-identical to the spec. `security-nfr-checklist.md` is clear voice (safety content) and
cites `plans/nfr-catalog.md` for the performance-impact check rather than redefining targets.

**Task 2 — 5 enterprise checklists (§9.3, §9.6, §9.7, §9.8, §9.9)** [commit c217b03]
`definition-of-done-enterprise.md` (body begins literally `All of lean DoD, plus:` — strict
superset, diff-verified), plus `compliance-checklist.md`, `accessibility-checklist.md`,
`observability-slo-checklist.md`, `release-readiness-checklist.md`. All carry `kind:
checklist` + `tier: enterprise`. `compliance-checklist.md` reproduces the SOC2/ISO 27001/PCI
control→evidence control verbatim in clear voice (no control fabricated). Enterprise DoD
cites the config coverage threshold and the NFR catalog rather than restating them.

**Task 3 — checklists/00-index.md** [commit 86e217f]
README-style orientation file (`kind: index` frontmatter): a `# Title` + `_Updated:_`
opener, a clear-voice intro, the mode-gating rule keyed on the config `mode` field, and two
tables grouping all 10 checklists lean vs enterprise. Names every one of the 10 files.

## Decisions Made

- **Index frontmatter = `kind: index`** (no `tier:`). The plan and D-14 leave the index
  frontmatter to Claude's discretion but require the SAME choice be reused for
  `memory-bank/00-index.md` in Plan 04. Locked here so Plan 04 stays consistent.
- **Additive clear-voice intro per checklist.** Each file opens with a short framing
  paragraph above the verbatim bullet body. The bullets remain byte-identical to spec §9
  (confirmed by diff); the intro is metadata-style framing only, not a body modification, so
  D-00 verbatim fidelity is preserved.

## Deviations from Plan

None — plan executed exactly as written. All tasks, files, and acceptance criteria match
the plan. No bugs, missing functionality, or blocking issues encountered (Rules 1–4 not
triggered). No authentication gates.

## Verification

Full-plan structural sweep passed:
- All 11 files present (`test -f` for each).
- All 10 checklists carry `tier:` (`grep -L '^tier:' ...` returned empty).
- 5 lean files `grep -q '^tier: lean'`; 5 enterprise files `grep -q '^tier: enterprise'`.
- Enterprise DoD body begins `All of lean DoD, plus:` (`grep -qx` matched).
- Byte-faithfulness: every checklist's bullet body diffed byte-identical to its spec section
  (`diff <(sed -n 'A,Bp' spec) <(grep '^- ' checklist)` → MATCH for all 10).
- Key controls present: `Given/When/Then` (DoR), `no fake command results` (DoD),
  `NFR catalog` (security-nfr), `SOC2` (compliance), `WCAG` (accessibility),
  `human-confirmed` (release-readiness).
- No-fake-data invariant: `grep -rEq 'ABC-[0-9]{3}' agent-factory/checklists/` → clean.
- Brand: no uppercase `Grugops`/`GRUGOPS` in the directory.
- Index names all 10 checklist files and contains lean / enterprise / mode.

## Threat Model Compliance

The plan's STRIDE register assigned `mitigate` to three threats; all addressed:
- **T-02-07 (fabricated control):** §9.5/§9.6 reproduced verbatim; `SOC2` + `NFR catalog`
  asserts present. No control invented or dropped.
- **T-02-08 (gate weakening):** enterprise DoD begins literally `All of lean DoD, plus:` —
  strict superset, diff-verified.
- **T-02-09 (grug voice in safety content):** security-nfr, compliance, and
  observability-slo checklists are clear voice throughout (brand §4.3).

No new security-relevant surface introduced (static markdown only). No threat flags.

## Known Stubs

None. The `_Updated: <date>_` placeholder in `00-index.md` matches the established
convention in `plans/nfr-catalog.md` and is intentional (a template-style date slot, not a
data stub).

## Self-Check: PASSED

All 11 created files verified present on disk; all 3 task commits (9ddea31, c217b03,
86e217f) verified in git log; SUMMARY.md present.
