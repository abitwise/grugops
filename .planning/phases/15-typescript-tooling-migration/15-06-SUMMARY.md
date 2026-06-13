---
phase: 15-typescript-tooling-migration
plan: 06
subsystem: tooling
tags: [typescript, tsc, vitest, install, posix-removal, constraint-amendment, d-13]

# Dependency graph
requires:
  - phase: 15-01
    provides: tsc-build posture + freshness gate (committed .js)
  - phase: 15-02
    provides: prod-deploy guard ported to TS at parity (guard.ts/.js)
  - phase: 15-03
    provides: single Node-required install.ts/.js + uninstall.ts/.js
  - phase: 15-04
    provides: validator + ASVS generator + foundation-guards + kit-refs ported to TS at exact parity
  - phase: 15-05
    provides: TOOL-02 kit-shipped-runnable convention + materializeRunnable seam
provides:
  - Two cross-cutting sweeps complete (invocation-string re-pointed to node <...>.js; env-var-name integrity confirmed)
  - 13 POSIX/.mjs originals + .test.sh parity oracles deleted after a green-suite gate (D-09 — nothing POSIX remains)
  - D-13 foundational-constraint amendment ratified in CLAUDE.md + PROJECT.md (TS tooling posture)
  - Prior HELD notes in 12/13/14-CONTEXT.md marked superseded (history preserved)
affects: [16-gate-convergence, 17-install-migrate-update, 18-docs-catalog]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Green-suite-gated deletion: parity oracles survive until every migration suite proves green, then deleted last (D-09)"
    - "Env-var-name integrity sweep: safety-critical env vars must survive a port byte-identical (guards the prod-deploy guard)"

key-files:
  created:
    - .planning/phases/15-typescript-tooling-migration/15-06-SUMMARY.md
  modified:
    - CLAUDE.md
    - .planning/PROJECT.md
    - .planning/phases/12-bdd-tdd-wiring/12-CONTEXT.md
    - .planning/phases/13-frontend-ui-persona-design-build-workflow/13-CONTEXT.md
    - .planning/phases/14-security-audit-owasp-asvs-checklist-re-anchor/14-CONTEXT.md
    - install/README.md
    - README.md
    - AGENTS.md
    - .claude/skills/grugops/SKILL.md
    - .claude/agents/grugops-orchestrator.md
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/_commit-convention.md
    - agent-factory/checklists/security-nfr-checklist.md
    - docs/design/shared-install.md
    - docs/dogfood-human-runbook.md

key-decisions:
  - "D-13 ratified: tooling layer is TypeScript (tsc-compiled committed .js, freshness-checked); single Node-required install.ts (no POSIX installer); dev-deps {typescript, vitest, @types/node}; zero runtime deps on hosts; Node 22+ floor"
  - "Deletion of the 13 originals was GATED on a green full suite (tsc/freshness/vitest) — the parity oracles are the safety net and only removed after parity is proven"
  - "HELD notes in 12/13/14-CONTEXT.md were marked superseded (annotation appended), NOT deleted — history preserved (T-15-06-Repud accept-controlled)"

patterns-established:
  - "Constraint amendment as supersession: amend the live constraint AND mark the prior HELD notes superseded in place, preserving the decision trail"
  - "Sweep-before-delete: re-point every shipped invocation string before deleting the file it names, so no self-heal hint dangles"

requirements-completed: [TOOL-01]

# Metrics
duration: 18min
completed: 2026-06-13
---

# Phase 15 Plan 06: Phase Close — Constraint Amendment, Sweeps & POSIX Removal Summary

**D-13 TS-tooling constraint ratified (CLAUDE.md + PROJECT.md), invocation-string + env-var sweeps run across all shipped surfaces, and the 13 POSIX/.mjs originals + .test.sh oracles deleted after a green-suite gate — nothing POSIX remains (D-09); TOOL-01 complete.**

## Performance

- **Duration:** ~18 min (across the original execution + this continuation)
- **Completed:** 2026-06-13
- **Tasks:** 3 auto + 1 human-verify checkpoint (approved)
- **Files modified:** 15 (14 edited + 1 SUMMARY created); 13 deleted

## Accomplishments

- **Invocation-string sweep** re-pointed every shipped reference (`install.sh`/`install.mjs`/`guard.mjs`/`*.test.sh`/checker `.mjs`) to the new `node <...>.js` form across AGENTS.md, README.md, install/README.md, the adapter self-heal hints (SKILL.md, grugops-orchestrator.md, subagent.frontmatter.md), `_commit-convention.md`, the security-nfr-checklist provenance header, and the docs. install/README.md now documents the single Node-required `install.js` (Node 22+ prerequisite) with the dual-installer / byte-parity language removed (D-07/D-08).
- **Env-var-name sweep clean** — `GRUGOPS_PROD_DEPLOY_APPROVED`, `GRUGOPS_SRC`, `GRUGOPS_HOME`, `TARGET`, `INSTALL_MODE`, `DRY_RUN`, `VALIDATE_KIT_ROOT`, `VALIDATE_ROOT` all survive byte-identical in the new `.ts` sources. The prod-deploy guard's approval literal was NOT silently renamed (T-15-06-Tamper mitigated).
- **Green-suite-gated deletion (D-09)** — `tsc --noEmit` / freshness / vitest were green BEFORE any original was removed; only then were the 13 originals deleted; the kit-refs + foundation-guards checkers exit 0 after deletion (nothing dangles, T-15-06-DoS mitigated).
- **D-13 constraint amendment ratified** in CLAUDE.md + PROJECT.md (clear professional voice — it touches the hard-safety tooling constraint); the prior HELD notes in 12/13/14-CONTEXT.md marked superseded with the original text preserved.
- **Human checkpoint approved** — the developer reviewed the prose D-13 amendment + the three supersession edits (the 15-VALIDATION.md Manual-Only row) and signed off.
- **TOOL-01 complete** — "nothing POSIX remains" (D-09) is now true; checkbox + traceability row updated in REQUIREMENTS.md.

## Task Commits

Each task was committed atomically:

1. **Task 1: Invocation-string + env-var-name sweeps (NO deletions)** - `376f399` (docs)
2. **Task 2: Delete 13 POSIX/.mjs originals + .test.sh oracles — green-suite gated (D-09)** - `f9dab9f` (chore)
3. **Task 3: D-13 constraint amendment + 12/13/14 HELD-note supersessions** - `b766c2c` (docs)
4. **Task 4 (checkpoint:human-verify): D-13 amendment review** - APPROVED by the human (no commit — verification gate)

**Plan metadata:** see final docs commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified

**Sweep (Task 1):**
- `install/README.md` - single Node-required `install.js` (Node 22+); dual-installer/byte-parity language removed
- `README.md`, `AGENTS.md` - invocation strings re-pointed to `node <...>.js`
- `.claude/skills/grugops/SKILL.md`, `.claude/agents/grugops-orchestrator.md`, `agent-factory/packaging/subagent.frontmatter.md` - self-heal hints re-pointed at the SOURCE adapter/template (installer re-materializes the new wording)
- `agent-factory/_commit-convention.md`, `agent-factory/checklists/security-nfr-checklist.md`, `docs/design/shared-install.md`, `docs/dogfood-human-runbook.md` - `guard.mjs`/`*.test.sh`/`scripts/*.mjs` references re-pointed

**Deletion (Task 2) — 13 originals removed:**
- `install/install.sh`, `install/install.mjs`, `install/uninstall.sh`, `install/install.test.sh`, `install/install.two-root.test.sh`
- `scripts/validate-agent-factory.mjs`, `scripts/validate.test.sh`, `scripts/generate-asvs-checklist.mjs`, `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`, `scripts/check-kit-refs.sh`
- `hooks/guard.mjs`, `hooks/guard.test.sh`

**Constraint amendment (Task 3):**
- `CLAUDE.md`, `.planning/PROJECT.md` - amended tech-stack constraint to the ratified TS posture (D-13)
- `.planning/phases/12-bdd-tdd-wiring/12-CONTEXT.md`, `.../13-...CONTEXT.md`, `.../14-...CONTEXT.md` - HELD notes marked superseded (history preserved)

## Decisions Made

- **D-13 ratified** — the four pillars recorded: tsc-compiled committed `.js` + freshness; single Node-required `install.ts` (POSIX installer dropped, Node a hard prerequisite); dev-deps `{typescript, vitest}` (+ type-only `@types/node`), dev/CI-only, never shipped; zero runtime deps on hosts; Node 22+ floor.
- **Deletion gated, not assumed** — the green-suite check is the literal precondition of every deletion; had any suite been red, no file would have been removed.
- **Supersession over erasure** — the prior HELD text is preserved with a "superseded by the Phase-15 TS pivot (D-13)" annotation, keeping the decision trail intact.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None - the green-suite gate passed on the first run, authorizing the deletion; the human checkpoint was approved without rework requests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TOOL-01 + TOOL-02 both complete — Phase 15 (TypeScript tooling migration) is done; the tooling layer is now TS-only with committed `.js` + a freshness gate, no POSIX/.mjs originals in tree.
- Phase 16 (§14 gate convergence — lint, UI/E2E, test-integrity) can reuse `materializeRunnable()` via the RUNNABLES table to ship an un-cheatable cross-platform checker (the TOOL-02 foundation).
- Phase 17 (install --migrate/--update) inherits the single Node-required installer; host-side hook auto-migration (deferred from 15-02) lands there.

## TDD Gate Compliance

Not applicable — this plan is `type: execute` (not a `type: tdd` plan); tasks are doc/sweep/deletion, not behavior-adding source. Behavior parity for the ported `.ts` sources was proven in Plans 15-02/03/04 (Vitest oracles) before this plan's deletion.

## Threat Flags

None — this plan introduces no new security-relevant surface. It removes POSIX/.mjs originals and amends prose; the env-var-name sweep affirmatively confirms the prod-deploy guard's approval literal was not renamed.

## Known Stubs

None.

## Self-Check: PASSED

**Created files exist:**
- FOUND: .planning/phases/15-typescript-tooling-migration/15-06-SUMMARY.md

**Prior task commits exist:**
- FOUND: 376f399 (Task 1 — sweeps)
- FOUND: f9dab9f (Task 2 — deletion)
- FOUND: b766c2c (Task 3 — D-13 amendment)

**Green suite re-confirmed (post-deletion):**
- `npx tsc --noEmit` exit 0
- `node scripts/freshness.js` exit 0 (9 committed .js fresh)
- `npx vitest run` exit 0 (103 passed, 1 intentional D-08 skip)
- `node scripts/check-kit-refs.js` exit 0 (ALL CHECKS PASSED)
- `node scripts/check-foundation-guards.js` exit 0 (ALL CHECKS PASSED)

**Deletion verified:**
- No POSIX/.mjs original remains; `git ls-files '*.test.sh' | grep -E '^(install|scripts|hooks)/'` returns nothing.

---
*Phase: 15-typescript-tooling-migration*
*Completed: 2026-06-13*
