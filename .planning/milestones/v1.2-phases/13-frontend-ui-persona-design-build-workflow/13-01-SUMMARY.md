---
phase: 13-frontend-ui-persona-design-build-workflow
plan: 01
subsystem: roles-and-guards
tags: [frontend-ui, design-contract, handoff, foundation-guards, UI-01]
requires:
  - agent-factory/roles/qe-e2e.md          # 9-section skeleton analog
  - agent-factory/handoffs/universal-handoff.md  # header carried verbatim
  - agent-factory/handoffs/product-handoff.md    # ## Acceptance scenarios input (D-10)
  - agent-factory/checklists/accessibility-checklist.md  # a11y item hub (single-source)
  - scripts/check-foundation-guards.sh     # the gate the role registers into
provides:
  - agent-factory/roles/frontend-ui.md             # the 17th role (design-authority persona)
  - agent-factory/handoffs/frontend-handoff.md     # design-contract carrier template
  - frontend-ui.md registered in ROLE_FILES + role_ceiling case + GUARD_INPUTS
affects:
  - .planning/phases/13-.../13-02-PLAN.md  # workflow 14 wires to frontend-handoff.md
  - .planning/phases/13-.../13-03-PLAN.md  # orchestrator routing + orchestrator ceiling raise
tech-stack:
  added: []   # markdown-only; no npm/runtime deps (CLAUDE.md hard constraint)
  patterns:
    - "uniform 9-section role skeleton (qe-e2e analog)"
    - "universal-handoff header + terse field body (qe-handoff style)"
    - "measure-then-set per-file byte ceiling (FAIL +12% / WARN +6%)"
    - "coupled guard edits: ROLE_FILES + role_ceiling case + GUARD_INPUTS land together"
key-files:
  created:
    - agent-factory/roles/frontend-ui.md
    - agent-factory/handoffs/frontend-handoff.md
  modified:
    - scripts/check-foundation-guards.sh
    - scripts/check-foundation-guards.test.sh
decisions:
  - "role_ceiling for frontend-ui.md set to '3969 3757' off the measured 3544B authored size (+12%/+6%); ceiling computed AFTER authoring, not before (Pitfall 1)"
  - "orchestrator ceiling left untouched at '7041 6664' — its raise belongs to Plan 03 (must be measured off post-wiring size)"
  - "no new config key introduced — frontend-ui honors the existing quality dial only (D-07)"
  - "framework-neutral persona with Vue as the worked example, never a hard requirement (D-02)"
  - "design-authority/contract-only seam: it authors the contract, the engineer builds (wf 04), QE verifies (wf 05); single activation, no component code, no re-review (D-01/D-03)"
metrics:
  duration: 4m
  completed: 2026-06-11
  tasks: 2
  files: 4
---

# Phase 13 Plan 01: Frontend/UI Persona & Design-Contract Foundation Summary

The 17th role — a senior frontend/UI **design-authority** persona (`frontend-ui.md`) — and its design-contract carrier (`frontend-handoff.md`), authored on the qe-e2e 9-section skeleton with **no spawn tool**, then registered in both foundation-guard scan sets so all six guards cover it and ship GREEN. Closes SDLC-audit GAP-3 and satisfies **UI-01**, laying the contract artifact that Plan 02 (workflow 14) and Plan 03 (orchestrator routing) wire to.

## What Was Built

### Task 1 — `frontend-ui.md` (role) + `frontend-handoff.md` (contract template)
- **`agent-factory/roles/frontend-ui.md`** (3544B): `kind: role` / `tier: core`, title `# Role: Frontend/UI`, on the frozen 9-section skeleton (One job → Caveman prompt → Reads → Activates when → Responsibilities → Output → Board moves → Trace updates → Hard limits → AGENTS.md footer). No `tools:`/`allowed-tools:` key and no spawn grant — WR-05 stays GREEN. The `## Caveman prompt` fence carries 7 `^You` imperatives. Framework-neutral with Vue named as the worked example only (D-02). The `## Reads` section is config-first (`quality` dial, no new key — D-07) then consumes the product handoff's `## Acceptance scenarios`, the implementation-ready packet, and `architecture-handoff.md` when present (D-10). `## Activates when` = `Need UI/frontend work.` (matches the routing-matrix wording Plan 03 adds). `## Output` names the `frontend-handoff.md` template → `plans/handoffs/<TICKET-ID>-frontend.md` instance. The `## Hard limits` encode the D-01/D-03 seam: design contract only, no component code (engineer builds — wf 04), no re-activation to review (QE verifies — wf 05), single activation. The WCAG 2.2 AA accessibility bar is stated in **clear professional voice** (two-voice discipline). Ends with the exact footer `Follow the 12 coding rules in \`AGENTS.md\`.`
- **`agent-factory/handoffs/frontend-handoff.md`**: `stage: frontend` / `# Handoff: frontend`, the universal-handoff header carried verbatim (`## Source … ## Next action` incl. `## Scope`/`### In scope`/`### Out of scope`/`## Risks`), then the terse contract body after the `---` separator: `## Design tokens` · `## Component inventory` · `## Five-states acceptance` (loading/empty/error/success/partial-data) · `## Accessibility bar` (WCAG 2.2 AA, items per `accessibility-checklist.md`) · `## Responsive / performance budget` · `## Visual-baseline expectation` (tool-neutral — no Playwright/toHaveScreenshot/axe-core named, D-08) · `## Verification owner` (QE/E2E at the gate; frontend-ui does NOT re-verify, D-03). Design-system notion kept inside this handoff — no separate design-system file (D-11).

### Task 2 — register frontend-ui.md in both guard scan sets (trap 1 closed)
Four coupled edits, all landed together so the build never went RED:
- **(a)** Added `agent-factory/roles/frontend-ui.md` to `ROLE_FILES` in `check-foundation-guards.sh`, alpha-slotted after `factory-coach.md`.
- **(b)** Added the paired `role_ceiling()` case `frontend-ui.md)  echo "3969 3757"  # Phase 13 — 17th role (UI-01)` — computed AFTER measuring the 3544B authored role (FAIL = round(3544×1.12)=3969, WARN = round(3544×1.06)=3757). Without this case, registering in ROLE_FILES would hit `*) echo "" ;;` and FAIL "no documented ceiling" (trap 1).
- **(d)** Cosmetic pass string `all 16 roles` → `all 17 roles`; updated the 16-file scan-set comments to 17 for accuracy (the historical Phase-11 "clean 16-role tree" verification note was left as-is — it records a past state).
- **(e)** Added `agent-factory/roles/frontend-ui.md` to `GUARD_INPUTS` in `check-foundation-guards.test.sh` (alpha after `factory-coach.md`) so the fail-proof hermetic mirror copies the 17th role into every planted-violation case (Pitfall 5).

The **orchestrator ceiling was deliberately left untouched** at `7041 6664` — its raise belongs to Plan 03, which must measure it off the post-wiring orchestrator size.

## Verification Evidence

- `sh scripts/check-foundation-guards.sh` → exit 0, **ALL CHECKS PASSED** (guard_wr05 / guard_voice / guard_caveman_preserved "all 17 roles" / guard_role_size "frontend-ui.md 3544B within ceiling" / orchestrator "6661B within ceiling" against untouched 7041/6664).
- `sh scripts/check-foundation-guards.test.sh` → exit 0, **ALL CHECKS PASSED** (fail-proof harness mirrors all 17 roles; every planted-violation case still fails red).
- `grep -ciE '(^| )(tools|allowed-tools):.*\b(Agent|Task)\b' agent-factory/roles/frontend-ui.md` = **0** (no spawn grant — UI-01 / T-13-01 mitigated).
- `grep -c '^You ' agent-factory/roles/frontend-ui.md` = **7** (≥2 required for guard_caveman_preserved).
- `grep -q 'stage: frontend' agent-factory/handoffs/frontend-handoff.md` → present (D-06 convention).
- `grep -ciE 'playwright|toHaveScreenshot|axe-core' agent-factory/handoffs/frontend-handoff.md` = **0** (tool-neutral visual baseline — D-08).
- Post-commit deletion check: no files deleted across either task commit.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-4 deviations, no auth gates, no checkpoints.

## Authentication Gates

None.

## Threat Model Disposition

- **T-13-01 (Elevation of Privilege — spawn grant):** mitigated. No `tools:`/`allowed-tools:` key in `frontend-ui.md`; spawn-grant grep returns 0; guard_wr05 GREEN. The two `\b(Agent|Task)\b` word matches in the role body are both the `agent-factory/...` path token, not a frontmatter spawn grant.
- **T-13-02 (Tampering — pass-only guard):** mitigated. `GUARD_INPUTS` mirror addition keeps the fail-proof harness honest for the 17th role; every planted-violation case still fails red.
- **T-13-03 (trust integrity — a11y voice leak):** mitigated. The WCAG 2.2 AA / accessibility / safety lines are clear professional voice; guard_voice scans `frontend-ui.md` (now in ROLE_FILES) and passes with no caveman leak.
- **T-13-SC (package installs):** accept — no package-manager installs in this phase; markdown + read-only POSIX-sh guard edits only.

## Commits

- `e31bcc2` — feat(13-01): author frontend-ui role + frontend-handoff contract template
- `f36a979` — feat(13-01): register frontend-ui.md in both foundation-guard scan sets

## Self-Check: PASSED

- `agent-factory/roles/frontend-ui.md` — FOUND
- `agent-factory/handoffs/frontend-handoff.md` — FOUND
- `scripts/check-foundation-guards.sh` (frontend-ui.md registered) — FOUND
- `scripts/check-foundation-guards.test.sh` (GUARD_INPUTS mirror) — FOUND
- Commit `e31bcc2` — FOUND
- Commit `f36a979` — FOUND
