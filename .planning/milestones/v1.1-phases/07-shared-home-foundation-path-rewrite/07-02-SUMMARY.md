---
phase: 07-shared-home-foundation-path-rewrite
plan: 02
subsystem: role-tier-and-op-skill-rewrite
tags: [path-rewrite, config-refs, handoff-split, invariant, op-skills, roles]
requires:
  - "07-01: byte-identical kit-vs-state invariant marker; .grugops/ config convention; sole-resolver adapters"
provides:
  - "Every role + _commit-convention.md reads .grugops/factory.config.json (D-02)"
  - "Per-role handoff split: bare template read (KIT) + ticket-scoped instance write plans/handoffs/<ID>-<stage>.md (D-03/D-05)"
  - "Upstream-input READ refs read the ticket-scoped instance, not the template (D-06)"
  - "_role-switch-protocol.md step-4 once-here template-read-vs-instance-write split"
  - "All 13 op-skills carry the byte-identical invariant + cross-link (D-09)"
  - "FROZEN <stage> token spelling for Plan 03 (workflows) to reuse identically"
affects:
  - "Plan 03 (workflows): MUST reuse the exact <stage> tokens recorded below"
  - "Plan 04 (build gate): scopes Assertion 3 to exclude the .claude resolver adapter and packaging template (GRUGOPS_HOME legal there)"
tech-stack:
  added: []
  patterns:
    - "Per-ref semantic judgment for handoff buckets — never blanket sed (Pitfall 2)"
    - "Bare template-dir read (agent-factory/handoffs/) stays KIT; instance write goes to plans/handoffs/<ID>-<stage>.md"
    - "#field anchor preservation on config refs (none present in this file set)"
    - "Op-skills carry the compressed invariant only; resolution deferred to the orchestrator (single-source, D-11)"
key-files:
  created: []
  modified:
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/roles/ba-pm.md
    - agent-factory/roles/system-analyst.md
    - agent-factory/roles/architect-design.md
    - agent-factory/roles/software-engineer.md
    - agent-factory/roles/qe-e2e.md
    - agent-factory/roles/security-nfr.md
    - agent-factory/roles/uat-planner.md
    - agent-factory/roles/release-manager.md
    - agent-factory/roles/compliance-officer.md
    - agent-factory/roles/incident-responder.md
    - agent-factory/roles/factory-coach.md
    - agent-factory/roles/agents-md-scribe.md
    - agent-factory/roles/brownfield-mapper.md
    - agent-factory/roles/greenfield-mapper.md
    - agent-factory/roles/installer.md
    - agent-factory/_commit-convention.md
    - .claude/skills/grugops-map/SKILL.md
    - .claude/skills/grugops-plan/SKILL.md
    - .claude/skills/grugops-ticket/SKILL.md
    - .claude/skills/grugops-gate/SKILL.md
    - .claude/skills/grugops-uat/SKILL.md
    - .claude/skills/grugops-release/SKILL.md
    - skills/map/SKILL.md
    - skills/plan/SKILL.md
    - skills/ticket/SKILL.md
    - skills/gate/SKILL.md
    - skills/uat/SKILL.md
    - skills/release/SKILL.md
    - skills/grugops/SKILL.md
decisions:
  - "<stage> tokens frozen (see § Frozen <stage> tokens); Plan 03 MUST reuse byte-identically"
  - "Step-4 wording uses the bare template-dir form (agent-factory/handoffs/ + backtick) rather than the agent-factory/handoffs/<template>.md placeholder, so it is gate-clean under both the strict allowlist-minus check and the Plan-04 bare-dir permit"
  - "Release skills (grugops-release, release) carry no config ref (they dispatch straight to role/workflow) — only the invariant was added there"
metrics:
  duration: 9m
  tasks: 3
  files: 30
  completed: 2026-06-06
---

# Phase 7 Plan 02: Role Tier & Op-Skill Adapter Path Rewrite Summary

Rewrote the role tier and the operation-skill adapters to the frozen kit/state convention: every role and `_commit-convention.md` now reads `.grugops/factory.config.json` (D-02); each role's handoff refs split into a bare template read (KIT) plus a ticket-scoped instance write `plans/handoffs/<ID>-<stage>.md` (D-03/D-05) with upstream-input reads pointed at the instance (D-06); the `_role-switch-protocol.md` step-4 write instruction got the once-here template-read-vs-instance-write split; and all 13 op-skills (6 dash + 7 colon) now carry the byte-identical kit-vs-state invariant from Plan 01.

## Frozen `<stage>` tokens (Plan 03 MUST reuse byte-identically)

The instance-filename convention is `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`. The `<stage>` token is the template basename with the `-handoff` suffix dropped where it adds no information. These are the exact spellings used in the role tier — **Plan 03 (workflows) must use the identical tokens** so the gate and any future doctor key off one spelling:

| Template (KIT)                  | `<stage>` token   | ID scope (D-05) | Example instance                          |
|---------------------------------|-------------------|-----------------|-------------------------------------------|
| `product-handoff.md`            | `product`         | TICKET-ID       | `plans/handoffs/<TICKET-ID>-product.md`   |
| `system-handoff.md`             | `system`          | TICKET-ID       | `plans/handoffs/<TICKET-ID>-system.md`    |
| `architecture-handoff.md`       | `architecture`    | TICKET-ID       | `plans/handoffs/<TICKET-ID>-architecture.md` |
| `implementation-ready-packet.md`| `impl-ready`      | TICKET-ID       | `plans/handoffs/<TICKET-ID>-impl-ready.md` |
| `implementation-handoff.md`     | `implementation`  | TICKET-ID       | `plans/handoffs/<TICKET-ID>-implementation.md` |
| `qe-handoff.md`                 | `qe`              | TICKET-ID       | `plans/handoffs/<TICKET-ID>-qe.md`        |
| `security-nfr-handoff.md`       | `security-nfr`    | TICKET-ID       | `plans/handoffs/<TICKET-ID>-security-nfr.md` |
| `uat-handoff.md`                | `uat`             | TICKET-ID       | `plans/handoffs/<TICKET-ID>-uat.md`       |
| `ticket-ready-packet.md`        | `ticket-ready`    | TICKET-ID       | `plans/handoffs/<TICKET-ID>-ticket-ready.md` |
| `release-handoff.md`            | `release`         | REL-            | `plans/handoffs/<REL-ID>-release.md`      |
| `incident-postmortem.md`        | `postmortem`      | INC-            | `plans/handoffs/<INC-ID>-postmortem.md`   |
| `retro-notes.md`                | `retro`           | sprint ID       | `plans/handoffs/<SPRINT-ID>-retro.md`     |
| `refinement-notes.md`           | `refinement`      | sprint ID       | `plans/handoffs/<SPRINT-ID>-refinement.md` |
| `sprint-plan.md`                | `sprint-plan`     | sprint ID       | `plans/handoffs/<SPRINT-ID>-sprint-plan.md` |

Placeholder ID tokens used verbatim in role prose: `<TICKET-ID>`, `<REL-ID>`, `<INC-ID>`, `<SPRINT-ID>`, and the generic `<WORK-ITEM-ID>` in the role-switch protocol.

## What Was Built

| Task | What | Files | Commit |
| ---- | ---- | ----- | ------ |
| 1 | Config refs → `.grugops/factory.config.json` across the 11 config-bearing op-skills, the 4 config-only roles (scribe, both mappers, installer), and `_commit-convention.md` | 16 files | `46ec56e` |
| 2 | Handoff split across 12 roles (bare template read + ticket-scoped instance write; upstream READ refs → instance, D-06) + the `_role-switch-protocol.md` step-4 once-here split (these 12 roles also carry their Task-1 config rewrite) | 13 files | `2ecc4ff` |
| 3 | Byte-identical Plan-01 invariant blockquote (+ AGENTS.md cross-link) into all 13 op-skills; no self-heal, no `$GRUGOPS_HOME`; safety lines preserved | 13 files | `6d766ed` |

## Handoff bucket map (per-ref semantic judgment, never sed)

- **WRITE (template read → instance write, Bucket B):** ba-pm (`product`), system-analyst (`system`), architect-design (`architecture`), software-engineer (`implementation`), qe-e2e (`qe`), security-nfr (`security-nfr`), uat-planner (`uat`), release-manager (`release`), incident-responder (`postmortem`), factory-coach (`retro`, appears in both the responsibility list and the Output section).
- **READ upstream instance (D-06, Bucket C):** system-analyst reads `<TICKET-ID>-product`; architect-design reads `<TICKET-ID>-system`; software-engineer reads `<TICKET-ID>-impl-ready` (from the `implementation-ready-packet.md` template); qe-e2e reads `<TICKET-ID>-implementation`; security-nfr reads `<TICKET-ID>-qe`; uat-planner reads `<TICKET-ID>-security-nfr`; compliance-officer reads AND appends to `<TICKET-ID>-security-nfr`.
- **Collective dir-only input → runtime instances (DOG-02 hunt fix):** release-manager's "the handoffs in `agent-factory/handoffs/`" line now reads the `plans/handoffs/` instances (`<TICKET-ID>-implementation/-qe/-security-nfr/-uat`).
- **Bare template-dir reads stay KIT (Bucket D):** every WRITE ref's `agent-factory/handoffs/` template read; the step-4 instruction; checklist refs (`security-nfr-checklist`, `uat-checklist`, `compliance-checklist`, `release-readiness-checklist`) untouched.

## Success Criteria

- **SC3 (config migrated):** zero `agent-factory/config/` refs across the 16 roles + `_commit-convention.md` + 13 op-skills; 16/16 roles read `.grugops/factory.config.json`. No `#field` anchors exist in this file set (the anchored variants were handled in Plan 01's orchestrator.md). PASS.
- **SC3 (step-4 split):** `_role-switch-protocol.md` step 4 carries the template-read-vs-instance-write split with ticket-scoped naming `plans/handoffs/<WORK-ITEM-ID>-<stage>.md`. PASS.
- **SC3 (handoff split + D-06):** every produced handoff reads its template bare and writes a ticket-scoped instance; every upstream-input ref reads the instance. allowlist-minus over `agent-factory/roles/` is empty (no leaked instance name in the kit handoff dir). PASS.
- **SC2/SC4 (op-skill invariant):** byte-identical marker present in all 13 op-skills (1 distinct invariant line); none names `$GRUGOPS_HOME`. PASS.
- **No structural regression:** `node scripts/validate-agent-factory.mjs` exits 0 (ALL CHECKS PASSED) after each task. PASS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded step-4 to the bare template-dir form to satisfy the strict allowlist-minus verify**
- **Found during:** Task 2
- **Issue:** My first step-4 draft used the PATTERNS Bucket-B anchor form `agent-factory/handoffs/<template>.md`. The Task-2 `verify` runs an allowlist-minus ERE that only permits literal template basenames OR the bare `agent-factory/handoffs/` + backtick dir ref. The `<template>` placeholder is neither, so the check flagged it as a "stray" (a false positive — it is the generic template-read instruction, not a leaked instance).
- **Fix:** Reworded to "read the role's named handoff **template** from `agent-factory/handoffs/`" — the bare template-dir form, which the real Plan-04 gate explicitly permits via `grep -Ev 'agent-factory/handoffs/\`'`. Meaning is identical; the line is now gate-clean under both the strict and lenient checks.
- **Files modified:** `agent-factory/roles/_role-switch-protocol.md`
- **Commit:** `2ecc4ff`

### Verify-command scope notes (no code change required — flagged for Plan 04)

**2. Task-1 `verify` over-scans `.claude/skills/` into the Plan-01 resolver adapter**
- The Task-1 acceptance/verify runs `! grep -rq 'GRUGOPS_HOME' ... .claude/skills/`. That directory-wide scan catches `.claude/skills/grugops/SKILL.md` — the standalone dispatcher resolver adapter owned by **Plan 01**, where `${GRUGOPS_HOME:-$HOME/.grugops}` is **mandated** by D-11/D-12. That file is NOT in this plan's `files_modified` and was not touched here. Scoped to the exact 30 files this plan owns, SC4 is clean (no `$GRUGOPS_HOME` anywhere). This matches the cross-plan note in 07-01-SUMMARY: the build gate (Plan 04) must scope its GRUGOPS_HOME assertion to exclude the resolver adapters and the `agent-factory/packaging/subagent.frontmatter.md` template. The three legal `$GRUGOPS_HOME` sites remain exactly: `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `agent-factory/packaging/subagent.frontmatter.md`.

**3. Task-3 single-line `grep -qF 'Humans always hold merge and deploy.'` cannot match the pre-existing soft-wrap in the two release skills**
- The release skills (`grugops-release`, `release`) were authored in Phase 5 with the safety sentence soft-wrapped across two lines ("…Humans always hold merge\nand deploy."). The Task-3 `verify` asserts the sentence on a single line, which is true for the 11 standard op-skills but not the 2 release skills. The safety content IS present and was preserved verbatim (no merge/deploy line was changed by this plan — confirmed via `git diff`); a whitespace-normalized grep confirms presence in both release skills. The acceptance intent ("each op-skill still contains the safety line") is met; only the literal single-line assumption fails on the pre-existing wrap.

## Threat surface scan

No new security-relevant surface introduced — this plan is markdown path-root rewrites only. All threat-register mitigations were applied: handoff writes land in STATE (`plans/handoffs/`) with the kit handoff dir holding templates only (T-07-02-01, allowlist-minus clean); no `#field` anchors existed to drop in this file set (T-07-02-02); no role/op-skill names `$GRUGOPS_HOME` (T-07-02-03); the release-manager collective dir-only "open handoffs" read was converted to `plans/handoffs/` instances (T-07-02-04). Zero package installs (T-07-02-SC).

## Known Stubs

None. All refs resolve to real templates (KIT) or instance paths (STATE). Placeholder ID tokens (`<TICKET-ID>` etc.) are the intended runtime-fill convention (D-05), not stubs.

## Notes

- Authentication gates: none.
- Per-task commit boundaries honored at the file level: roles that carry both a config rewrite (Task 1) and a handoff split (Task 2) were committed once, in the Task-2 commit, to keep each file in a single commit (no file split across commits). The 4 config-only roles + 11 config-only op-skills + `_commit-convention.md` are the clean Task-1 commit.

## Self-Check: PASSED

- All 30 modified files present on disk and tracked.
- All 3 task commits present in git history (`46ec56e`, `2ecc4ff`, `6d766ed`).
- SUMMARY.md present at `.planning/phases/07-shared-home-foundation-path-rewrite/07-02-SUMMARY.md`.
