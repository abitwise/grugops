---
phase: 03-roles-agents-md-substrate
plan: 07
subsystem: roles
tags: [roles, enterprise-pack, factory-coach, installer, role-02]
requires:
  - "agent-factory/roles/ (Phase 3 Plan 01 — orchestrator authored first, routing contract)"
  - "agent-factory/config/factory.config.json (Phase 1 — config dial)"
  - "plans/metrics.md (Phase 1 — Factory Coach reads it)"
  - "agent-factory/handoffs/retro-notes.md (Phase 2 — Factory Coach output template)"
  - "plans/tickets/ (Phase 1 — factory-tagged improvement tickets land here)"
provides:
  - "agent-factory/roles/factory-coach.md (Factory Coach enterprise role — metrics → retro → improvement tickets)"
  - "agent-factory/roles/installer.md (Installer enterprise role — detect host tool, lay adapter, additive)"
  - "ROLE-02 complete: all 5 enterprise roles exist; all 16 role files (11 core + 5 enterprise) now present"
affects:
  - "Phase 4 workflows (11-retro.md sequences the Coach; install handled by Installer role + /factory:install self-bootstrap)"
  - "Phase 5 packaging (Installer's dispatch mechanics — per-tool wrappers, plugin manifest, safety hook — are authored here as Phase-5 territory, named not inlined)"
  - "Phase 6 validator (16-role 9-section section-presence check)"
tech-stack:
  added: []
  patterns:
    - "Reproduce-then-derive (D-15): verbatim §5.B caveman prompt + terse derived sections citing frozen on-disk paths"
    - "D-17 universal v2 lines rendered identically (config-first / board move / trace append)"
    - "D-22 enterprise Activates when: mode=enterprise OR §5.B trigger"
    - "D-20 dispatch-neutrality: Installer names its outputs, inlines no Phase-5 mechanics"
key-files:
  created:
    - "agent-factory/roles/factory-coach.md"
    - "agent-factory/roles/installer.md"
  modified: []
decisions:
  - "[03-07] factory-coach.md reads plans/metrics.md and emits the REAL agent-factory/handoffs/retro-notes.md handoff + factory-tagged tickets in plans/tickets/; board moves = none (D-22/D-23)"
  - "[03-07] installer.md stays dispatch-neutral (D-20) — names adapter/entry-file outputs + install report but inlines NO Phase-5 mechanics (no plugin manifest, no commands-vs-skills choice, no safety hook, no per-tool wrapper contents)"
  - "[03-07] installer.md additive/never-overwrite/dry-run/uninstall discipline reproduced in CLEAR voice as a hard limit (T-03-Tamper mitigation); not softened (D-21)"
metrics:
  duration: 4m
  completed: 2026-06-03
---

# Phase 3 Plan 07: Final Enterprise Roles (Factory Coach + Installer) Summary

The last 2 enterprise-pack roles — Factory Coach (read the metrics, run the retro, write improvement tickets for the factory itself) and Installer (detect the host coding agent, lay the right adapter, stay additive) — authored to the §5 9-section skeleton with `tier: enterprise` and a D-22 `Activates when`. This completes ROLE-02 (5/5 enterprise roles) and lands the 16th and final role file (11 core + 5 enterprise).

## What Was Built

### Task 1 — `agent-factory/roles/factory-coach.md` (commit `ae4d25d`)
- 9-section §5 skeleton; frontmatter `kind: role` + `tier: enterprise`.
- `## Caveman prompt` = spec §5.B.4 (L547–552), reproduced byte-exact (diff-verified).
- `## Activates when`: `mode=enterprise`, or the end of a sprint, or on-demand (D-22).
- `## Reads`: `factory.config.json` first, then `plans/metrics.md` (the 9 frozen metric names), `memory-bank/00-index.md`.
- `## Output`: `agent-factory/handoffs/retro-notes.md` (metrics snapshot citing frozen `plans/metrics.md` names, top wastes, Keep/Stop/Start) + `factory`-tagged improvement tickets in `plans/tickets/`.
- `## Board moves`: none — reads metrics, writes factory tickets.
- Hard limits reflect the "read the metrics, not the vibes" framing + no-fabrication line; one-line 12-rules pointer to `AGENTS.md`.

### Task 2 — `agent-factory/roles/installer.md` (commit `d38976a`)
- 9-section §5 skeleton; frontmatter `kind: role` + `tier: enterprise`.
- `## Caveman prompt` = spec §5.B.5 (L559–563), reproduced byte-exact (diff-verified).
- `## Activates when`: `mode=enterprise`, or an install/adapter request (D-22).
- `## Output`: the tool-specific adapter/entry files for the detected host + an install report — named generically. **Dispatch-neutral (D-20):** no per-tool wrapper contents, no plugin manifest, no commands-vs-skills choice, no safety hook inlined (verified via a grep guard finding zero leaks of `plugin.json`/`marketplace.json`/`hooks.json`/`PreToolUse`/`SKILL.md`/`commands/`/`skills/`/`.claude-plugin`/`settings.json`/`CLAUDE.md`/`GEMINI.md`).
- `## Board moves`: none — tooling, not board flow.
- `## Hard limits`: additive / never overwrite or delete user content / dry-run / reversible-by-uninstall + no-fabrication — reproduced in CLEAR voice (T-03-Tamper); one-line 12-rules pointer.

## Verification

- **Per-task automated greps:** both passed (9 required headings, `tier: enterprise`, role-specific path cites, empty drift guard).
- **`check-structure.sh` (phase running gate):** [a] all 16 roles 9/9 sections, [b] 11 core / 5 enterprise, [c] D-17 universal lines in every role, [f] no `plans/*-handoff` drift, [g] 12 rules single-sourced — all PASS. The only FAIL is [e] `AGENTS.md missing`, which is **out of scope** for this plan (AGENTS.md is authored LAST, in Plan 08 of this phase) — not a regression.
- **Caveman prompts:** both byte-exact vs spec (L547–552 and L559–563), confirmed by `diff`.
- **Counts:** `grep -l 'tier: enterprise' agent-factory/roles/*.md | wc -l` == 5; total role files == 16.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface

The plan's `<threat_model>` assigned three `mitigate` dispositions, all addressed in the authored text:
- **T-03-Tamper** (Installer additive/never-overwrite discipline): reproduced in CLEAR voice as a hard limit, not softened.
- **T-03-EoP** (Installer dispatch-neutrality): role text inlines no Phase-5 mechanical hook/wrapper detail (grep-verified).
- **T-03-Info** (12-rules single-source): one-line pointer to `AGENTS.md`, no rule text restated.

No new security-relevant surface beyond the plan's threat model was introduced (these are static markdown role templates).

## Self-Check: PASSED

- FOUND: agent-factory/roles/factory-coach.md
- FOUND: agent-factory/roles/installer.md
- FOUND: commit ae4d25d
- FOUND: commit d38976a
