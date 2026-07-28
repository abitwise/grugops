---
phase: 13-frontend-ui-persona-design-build-workflow
plan: 03
subsystem: orchestrator-routing-and-guards
tags: [frontend-ui, orchestrator, routing-matrix, workflow-map, foundation-guards, UI-03, trap-2]
requires:
  - agent-factory/roles/frontend-ui.md             # the 17th role this routing targets (Plan 01)
  - agent-factory/workflows/14-ui-design-to-build.md  # the workflow the map row points to (Plan 02)
  - scripts/check-foundation-guards.sh             # the role_ceiling() the orchestrator raise lives in
provides:
  - "orchestrator.md ui-build classification token (15->16 request types)"
  - "orchestrator.md Need UI/frontend -> Frontend/UI routing-matrix row"
  - "orchestrator.md ui-build -> 14-ui-design-to-build.md workflow-map row (00-13 not renumbered)"
  - "raised orchestrator.md role_ceiling() case (7570 7165) off the post-wiring 6759B (trap 2 closed)"
affects:
  - .planning/phases/13-.../13-VERIFICATION.md  # SC3 closure evidence
tech-stack:
  added: []   # markdown + read-only POSIX-sh edits only; no npm/runtime deps (CLAUDE.md hard constraint)
  patterns:
    - "hand-maintained registry counters updated together (count + classification + matrix + map)"
    - "measure-then-set per-file byte ceiling raised off the POST-WIRING size (FAIL +12% / WARN +6%)"
    - "append-not-renumber (new workflow-map ordinal appends; 00-13 frozen — Pitfall 6)"
    - "terse-edit-first to minimize the ceiling bump (trap 2)"
key-files:
  created: []
  modified:
    - agent-factory/roles/orchestrator.md
    - scripts/check-foundation-guards.sh
decisions:
  - "the four UI-03 edits added only +98B (6661->6759B), authored terse to keep the ceiling bump small (trap 2)"
  - "orchestrator role_ceiling raised to '7570 7165' off the MEASURED 6759B post-wiring size — never a number picked to make the guard pass (+12%/+6% formula, T-13-08 mitigated)"
  - "frontend-ui.md ceiling case left untouched at '3969 3757' (Plan 01 owns it — no duplicate raise)"
  - "ui-build token spelling LOCKED as the classification; 14-ui-design-to-build.md stays the workflow filename (D-05/A4)"
  - "agent-factory/README.md confirmed a no-op — it enumerates no roles/workflows + carries no routing matrix (RESEARCH A1, grep returned 0); no README list invented"
metrics:
  duration: 3m
  completed: 2026-06-11
  tasks: 2
  files: 2
---

# Phase 13 Plan 03: Orchestrator UI-03 Routing & Ceiling Raise Summary

Wired the Orchestrator to route UI work to the new Frontend/UI persona (**UI-03**) — the `ui-build` classification token, a `Need UI/frontend → Frontend/UI` routing-matrix row, a `ui-build → 14-ui-design-to-build.md` workflow-map row (appended, 00-13 unchanged), and the `15→16` request-count literal — then **raised orchestrator.md's `role_ceiling()` case** off the post-wiring byte count so `guard_role_size` stays GREEN (**trap 2 closed**). Completes SC3.

## What Was Built

### Task 1 — four terse Orchestrator UI-03 edits (`orchestrator.md`)
All four hand-maintained registry sites updated together, each as minimal as possible to keep the ceiling bump small (trap 2):
- **(1) Count literal** (`## Activates when`): `all 15 request types` → `all 16 request types`.
- **(2) Classification list** (responsibility 3): appended the 16th token `ui-build` after `install` (`… | install | ui-build`). Token spelling LOCKED as `ui-build` — the classification, NOT the workflow filename `ui-design-to-build` (D-05/A4).
- **(3) Routing matrix** (fenced block): added `Need UI/frontend            -> Frontend/UI`, keeping the `->` column alignment of the existing rows (aligned to match `Need adapters installed     -> Installer`).
- **(4) Workflow-map table**: appended `| ui-build | \`14-ui-design-to-build.md\` |` after the `| incident | \`13-incident.md\` |` row and before the install-has-no-workflow note. This **registers the new workflow without renumbering 00-13** (Pitfall 6) — all 14 frozen 00-13 rows are byte-unchanged.

`agent-factory/README.md` was confirmed a no-op (RESEARCH A1): it enumerates no roles/workflows and carries no routing matrix — a structural grep returned 0 matches, so no README list was invented (D-05 consistency honored vacuously).

The four edits added **+98B** total (6661B → 6759B).

### Task 2 — raise the orchestrator ceiling off the post-wiring size (`check-foundation-guards.sh`, trap 2)
After Task 1 landed, re-measured `wc -c agent-factory/roles/orchestrator.md` = **6759B**. Computed the documented +12%/+6%: **FAIL = round(6759 × 1.12) = 7570**, **WARN = round(6759 × 1.06) = 7165**. Updated the `orchestrator.md)` case in `role_ceiling()` from the stale `7041 6664` to `echo "7570 7165"` with a Phase-13 headroom comment in the ba-pm style — `# +Phase-13 routing (ui-build classification + matrix + map row); measured 6759 B`. This is the ONLY ceiling change in this plan — the `frontend-ui.md` case stays untouched at `3969 3757` (Plan 01 owns it).

## Verification Evidence

- Task 1 structural greps all PASS: `all 16 request types` present, `ui-build` present, `Need UI/frontend` + `Frontend/UI` present, `| ui-build | \`14-ui-design-to-build.md\` |` present, `all 15 request types` **gone**, `| incident | \`13-incident.md\` |` still present, all **14** 00-13 ordinal rows intact.
- `agent-factory/README.md` enumeration grep = **0** (confirmed no-op — RESEARCH A1).
- Post-wiring `wc -c` = **6759B**; ceiling set to 7570/7165 off that real measurement (no fabricated pass — T-13-08 mitigated).
- `sh scripts/check-foundation-guards.sh` → exit **0**, **ALL CHECKS PASSED** — `guard_role_size` reports `orchestrator.md 6759B within ceiling` against the new 7570/7165, and `caveman: all 17 roles` GREEN.
- `sh scripts/check-foundation-guards.test.sh` → exit **0**, **ALL CHECKS PASSED** — the fail-proof harness still plants a real oversize role and asserts the size guard fails red, so the raise cannot license a bloated rewrite.
- Task 2 greps PASS: `orchestrator.md) echo "<two numbers>"` present; stale `7041 6664` **gone**; `frontend-ui.md) echo "3969 3757"` untouched.
- Post-commit deletion check on both task commits: **no files deleted**. No untracked files left.

The 3 advisory WARNs in `guard_role_size` (ba-pm.md, qe-e2e.md, software-engineer.md approaching ceiling) are **pre-existing** from prior phases (11/12) and out of scope — the build stays GREEN.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-4 deviations, no auth gates, no checkpoints.

## Authentication Gates

None.

## Threat Model Disposition

- **T-13-07 (Tampering — registry drift):** mitigated. All four hand-maintained sites updated together; structural greps confirm each, and `! grep 'all 15 request types'` confirms the old literal is fully replaced.
- **T-13-08 (Tampering — fabricated guard pass):** mitigated. The orchestrator ceiling was set off a real `wc -c` of the post-wiring file (6759B) at the documented +12%/+6% (7570/7165), never a number picked to pass. The fail-proof harness `check-foundation-guards.test.sh` still plants a real oversize violation and asserts the size guard fails red.
- **T-13-09 (Tampering — frozen-ordinal break):** mitigated. The new row appends as `ui-build → 14-…`; the `| incident | 13-incident.md |` row and all 00-13 ordinals stay byte-unchanged (Pitfall 6) — verified by grep (14 rows intact).
- **T-13-SC (package installs):** accept — no package-manager installs; markdown + read-only POSIX-sh guard edits only.

## Commits

- `08a44e8` — feat(13-03): wire Orchestrator UI-03 routing (ui-build classification + matrix + workflow-map + count)
- `ee5ba3c` — fix(13-03): raise orchestrator.md role_ceiling off post-wiring size (trap 2 closed)

## Self-Check: PASSED

- `agent-factory/roles/orchestrator.md` (ui-build wired) — FOUND
- `scripts/check-foundation-guards.sh` (orchestrator ceiling raised) — FOUND
- Commit `08a44e8` — FOUND
- Commit `ee5ba3c` — FOUND
- Both guard scripts exit 0 (ALL CHECKS PASSED) — CONFIRMED
