---
phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity
plan: 03
subsystem: quality-gate / single-source convergence
tags: [gate, lint, ui-e2e, visual-regression, accessibility, test-integrity, config-dial, single-source]

# Dependency graph
requires:
  - plan: 16-01
    provides: "the materialized test-integrity checker (tools/grugops/test-skip-integrity.js, exit 0/1/2, --skip-count) the gate invokes"
  - plan: 16-02
    provides: "playwright-visual-regression-recipe.md + linter-recommendations.md the gate references by filename (D-06), plus the axe-core extension in accessibility-checklist.md"
provides:
  - "05-pr-quality-gate.md — the single-source gate now wiring quality.lint {strict,autofix}, quality.ui_e2e, and a new human-only test-integrity step, with the D-08 fix-lane split / D-09 short-circuit / D-10 advisory composition encoded onto the bounded self_fix_attempts loop and the three terminal results"
  - "AGENTS.md ### Test integrity skip-count slot (UNKNOWN - verify default, per-runner examples-only, never-a-silent-0)"
  - "factory.config.md dial→behavior prose clarifying lint/test_integrity/gate_enforcement (no new keys)"
affects:
  - "the runtime PR quality gate behavior for every grugops user (lint dial, UI/E2E dial, test-integrity human-only enforcement)"

# Tech tracking
tech-stack:
  added: []  # markdown-only plan; installs nothing
  patterns:
    - "Reference-not-embed (D-06): bulky how-to stays in checklists/ siblings the gate points to by filename; the gate keeps only the WHEN + dial wiring + terminal mapping"
    - "Two-voice discipline: the whole gate is clear professional voice (quality/safety surface), no caveman"
    - "Config-dial wiring with no new keys (Pitfall 6): behavior wired onto existing quality.* dials"

key-files:
  created: []
  modified:
    - agent-factory/workflows/05-pr-quality-gate.md
    - AGENTS.md
    - agent-factory/config/factory.config.md

key-decisions:
  - "test-integrity appended to the visible Step-3 run order (install -> lint -> typecheck -> unit -> build -> e2e -> test-integrity) so the gate's stated sequence matches the new step and the step runs AFTER the runners that produce the skip count (RESEARCH Open Q3)"
  - "Dial→behavior prose landed by enriching the existing quality.* Meaning cells in factory.config.md rather than adding rows — keeps the JSON twin byte-identical and adds zero keys (Pitfall 6)"

requirements-completed: [UIQA-02, LINT-02, TINT-01, TINT-02, TINT-03]

# Metrics
duration: ~9min
completed: 2026-06-14
---

# Phase 16 Plan 03: Gate Convergence — Lint / UI-E2E / Test-Integrity Summary

**The convergence keystone — all gate behavior wired into the single-source `05-pr-quality-gate.md`: the config-dialed lint step (D-11/D-12/D-13), the UI/E2E step referencing the Playwright recipe + axe extension by filename (D-06/UIQA-02), and a new human-only test-integrity step invoking Plan 01's materialized checker (D-14), with the D-08 fix-lane split, the D-09 human-only short-circuit, and the D-10 advisory composition encoded onto the bounded `self_fix_attempts` loop and the three terminal results — plus the AGENTS.md skip-count slot and config-twin prose, all with zero new config keys.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-14
- **Completed:** 2026-06-14
- **Tasks:** 2
- **Files modified:** 3 (0 created, 3 modified)

## Accomplishments

- **Lint wiring (D-11/D-12/D-13, LINT-02)** — Step 3 now states `quality.lint {strict, autofix}` behavior: `strict:true` → fail-on-warning; `strict:false` → warnings clear-voice, only errors fail; `autofix:true` → safe autofix inside the bounded `self_fix_attempts` loop then recheck; `autofix:false` → report only. No linter configured → records `UNKNOWN - verify` and treats it **non-blocking** (a no-linter repo still reaches `READY_FOR_HUMAN_REVIEW`). Points to `agent-factory/checklists/linter-recommendations.md` for the per-stack table.
- **UI/E2E wiring (D-06/UIQA-02)** — the step runs per `quality.ui_e2e` and covers Playwright visual-regression + axe-core a11y, referencing `playwright-visual-regression-recipe.md` and `accessibility-checklist.md` by filename (never restated). The D-08 split is stated here: code/a11y defects are agent-fixable; a **visual-baseline update is human-only**.
- **Test-integrity step (NEW, D-14, TINT-01/02)** — added after unit/e2e, invoking `node tools/grugops/test-skip-integrity.js .grugops/test-skips.md --skip-count <N>` with `<N>` captured from the AGENTS.md slot (`UNKNOWN - verify`, never a silent 0). Branches on exit `0` (pass) / `1` (finding — gate flags) / `2` (could-not-run, distinct from a fail). **Always human-only**: on exit `1` the gate STOPS and hands to the human who owns `.grugops/test-skips.md`.
- **D-08/D-09/D-10 terminal mapping (TINT-03)** — Step 4 confines the bounded loop to agent-fixable failures; a human-only failure (visual-baseline acceptance, test-integrity exit `1`) short-circuits to `BLOCKED_NEEDS_FIX` **without** consuming a self-fix attempt. Step 5 preserves the three terminal results and adds the D-10 advisory composition (`gate_enforcement: advisory` downgrades the action but emits the finding loudly — never silent; the TINT-03 floor forbids silent acceptance, not a hard stop). A third Stop-condition row was added for the human-only short-circuit.
- **AGENTS.md skip-count slot (D-14)** — a new `### Test integrity` slot mirroring `### Acceptance`: value `UNKNOWN - verify`, per-runner examples (vitest/jest/pytest/go) in an HTML comment as examples-only, and the never-a-silent-0 rule. The host owns the real command (no-fabrication).
- **Config-twin prose (no new keys)** — `factory.config.md` enriches the existing `lint`/`test_integrity`/`gate_enforcement` Meaning cells with dial→behavior wiring (autofix-in-loop, human-only `.grugops/test-skips.md` registry, advisory composition). No new rows, no new keys; the JSON twin is byte-unchanged and the TINT-03 floor prose is preserved.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire lint + UI/E2E + test-integrity steps and the D-08/D-09/D-10 mapping into 05** — `720ea9c` (feat)
2. **Task 2: AGENTS.md skip-count slot + config-twin clarifying prose (no new keys)** — `c2394ee` (feat)

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| No `§14` literal in 05 | `grep -c '§14' …05-pr-quality-gate.md` | 0 |
| Gate invokes the materialized checker | `grep -c 'tools/grugops/test-skip-integrity.js' …05` | 1 |
| `--skip-count` present | `grep -c -- '--skip-count' …05` | 1 |
| Both new checklists referenced by filename | `grep -c -E 'playwright-visual-regression-recipe.md|linter-recommendations.md' …05` | 2 |
| Lint dial wired | `grep -c -E 'quality.lint|strict|autofix' …05` | 2 |
| `ui_e2e` dial wired | `grep -c 'ui_e2e' …05` | 2 |
| Three terminal results preserved | `grep -c -E 'READY_FOR_HUMAN_REVIEW|BLOCKED_NEEDS_FIX|SPLIT_REQUIRED' …05` | 7 |
| Human-only + advisory present | `grep -c -iE 'human-only|advisory' …05` | 7 |
| Workflow 14 stays tool-neutral (D-08a) | `grep -c -iE 'toHaveScreenshot|axe-core|playwright' …14` | 0 |
| AGENTS.md skip-count slot | `grep -c 'Skip-count capture' AGENTS.md` | 1 |
| Never-a-silent-0 rule | `grep -c 'never a silent 0' AGENTS.md` | 1 |
| No JSON config change | `git diff --stat …factory.config.json` | empty |
| No `skip_registry_path` key | `grep -c 'skip_registry_path' …factory.config.json` | 0 |
| TINT-03 floor preserved in twin | `grep -c -E 'never .?off.?|no .?off.?' …factory.config.md` | 2 |
| Kit structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0, ALL CHECKS PASSED |
| Foundation guards (incl. AGENTS byte budget 6901B) | `node scripts/check-foundation-guards.js` | exit 0, ALL CHECKS PASSED |
| Full suite | `npm test` | 112 passed, 1 skipped |
| Freshness | `npm run freshness` | all 10 committed .js fresh |

The 1 skipped test is the pre-existing intentional D-08 retired-parity skip in `install.test.ts`; not introduced by this plan. This plan edits only markdown (the gate workflow, AGENTS.md, the config twin), so no `.ts`→`.js` drift is possible — freshness stays green.

## Deviations from Plan

None — plan executed exactly as written. Both tasks landed in place on the single-source gate / AGENTS.md / config twin with no architectural change, no new config key, and no fork into workflows 14/15.

## Authentication Gates

None.

## Threat Surface Scan

No new security-relevant surface beyond the plan's `<threat_model>`. The four mitigate-disposition threats are structurally satisfied by where the step sits and what the prose says:

- **T-16-03-01 (agent self-authors a justification):** mitigated — the test-integrity step is ALWAYS human-only; exit `1` short-circuits to `BLOCKED_NEEDS_FIX` without consuming `self_fix_attempts`, handing to the human who owns `.grugops/test-skips.md`.
- **T-16-03-02 (agent updates a visual baseline to pass):** mitigated — visual-baseline acceptance is human-only in the gate prose; only code/a11y UI defects are agent-fixable.
- **T-16-03-03 (silent-zero skip count):** mitigated — the AGENTS.md slot defaults to `UNKNOWN - verify` and the gate records `UNKNOWN - verify`, never a silent 0.
- **T-16-03-04 (advisory swallows a finding):** mitigated — D-10 prose: advisory downgrades the ACTION only; the finding is still emitted loudly, trace intact.
- **T-16-03-05 (gate forked / §14 literal shipped):** mitigated — all wiring single-source in 05; `§14` count 0; workflow 14 names no UI tool.
- **T-16-03-06 (new config key):** mitigated — JSON twin byte-unchanged; `skip_registry_path` count 0; the registry path is the fixed `.grugops/test-skips.md` convention.
- **T-16-03-SC (package install):** N/A — markdown-only plan, installs nothing.

## Known Stubs

None. The gate now fully invokes Plan 01's materialized checker and references Plan 02's two checklists by filename; the AGENTS.md slot is host-owned by design (`UNKNOWN - verify` is the correct never-fabricated default, not a stub).

## Self-Check: PASSED

All three modified files exist on disk; both task commits (`720ea9c`, `c2394ee`) are present in git history.

---
*Phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity*
*Completed: 2026-06-14*
