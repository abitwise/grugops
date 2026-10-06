---
phase: "34"
slug: "model-effort-dial-pi-support"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-06"
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `34-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest `~4.1.8` (tests import the committed `.js`) |
| **Config file** | `vitest.config.ts`; `tsconfig.json`, `tsconfig.tests.json`, `tsconfig.fixtures.json` |
| **Quick run command** | `npm run build && npx vitest run <touched test files>` |
| **Full suite command** | `npx vitest run --exclude '**/scripts/e2e/**'` (NEVER `npm test`: it runs the live paid e2e lane) |
| **Build/parity** | `npm run build && npm run check:build-parity && npm run typecheck` |
| **Estimated runtime** | `UNKNOWN - verify` (full suite, several minutes) |

---

## Sampling Rate

- **After every task commit:** `npm run build && npx vitest run <touched test files>`
- **After every plan wave:** full suite + `npm run check:build-parity && npm run typecheck` + `npm run freshness:adapters` + `node scripts/check-foundation-guards.js`
- **Before `/gsd-verify-work`:** full suite green, all CI gates green (`VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-claim-anchors.js`, `node scripts/check-banned-claims.js`), windows-latest result from a human-pushed run recorded (D-09)

---

## Per-Task Verification Map

Filled by the planner (requirement and plan level, 2026-10-06); plan 34-10 Task 2 fills the per-task detail and statuses. Every command runs as `npx vitest run --exclude '**/scripts/e2e/**' <files>` after `npm run build` (never plain `npm test`).

| Requirement | Behavior | Plans | Test Type | Test files | File Exists | Status |
|-------------|----------|-------|-----------|------------|-------------|--------|
| EFFORT-01 | citation, version facts and fallback in the dial docs | 34-07 | doc oracle | `scripts/model-dial-consistency.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-02 | every refusal by name; effort-only block consumed; EFFORT_KEYS consumption | 34-01 | unit + mirror | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-03 | tiered effort derived from TIERED; rationale required; model tiered leaves effort inherit | 34-01, 34-03 | unit + mirror | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-04 | zero-config byte-equal (declared divergences only, D-14); configured emit; announcements asserted; guard red on hand-edit (D-15); installer delivery | 34-01, 34-03, 34-05, 34-07, 34-10 | integration | `scripts/generate-role-adapters.test.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/adapters-freshness.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/canonical-frontmatter.test.ts`, `install/install.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-05 | closed sets at their own sites, non-colliding markers; precedence and reach documented | 34-07 | doc oracle | `scripts/model-dial-consistency.test.ts` | ✅ extend | ⬜ pending |
| HOST-01 | registry count; detection; oracle and validator derived; tables set-equal; prose count word and short host list (mutation-proved) | 34-02, 34-06, 34-09 | unit + corpus | `install/host-tools.test.ts`, `install/host-tools-prose.test.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/validate.test.ts` | ❌ W0 (34-02, 34-09 create) | ⬜ pending |
| HOST-02 | no test added or changed by the phase red on windows-latest | 34-10 | CI | human-pushed run, read with `gh run view` | manual | ⬜ pending |
| PI-01 | Pi conventions recorded with sources | 34-06 | doc oracle | `install/host-tools.test.ts` | ❌ W0 (34-02 creates) | ⬜ pending |
| PI-02 | registry row, detection, `.pi/prompts/grugops.md` exact bytes, never overwrites, DRY_RUN writes nothing, docs | 34-02, 34-04, 34-06, 34-08 | integration + doc oracle | `install/install.test.ts`, `install/installer-dry-run.test.ts`, `install/host-tools.test.ts` | ✅ extend | ⬜ pending |
| PI-03 | ledgered; uninstall removes only recorded and unchanged; user file survives; special files at the path | 34-04, 34-10 | integration (class tests) | `install/installer-never-installed.test.ts`, `install/installer-user-edit.test.ts`, `install/installer-special-files.test.ts`, `install/installer-cross-version.test.ts`, `install/record-truth.test.ts`, `install/installer-write-set.test.ts`, `install/uninstall-removal.test.ts` | ✅ re-pin | ⬜ pending |
| PI-04 | scope sentence with the cited Pi clause; Pi safety entries | 34-07, 34-06, 34-08 | doc oracle | `scripts/model-dial-consistency.test.ts`, `install/host-tools.test.ts` | ✅ extend | ⬜ pending |

Spec-less probe fallback: no SPEC.md exists and the phase had no requirement IDs at plan start, so no probe-derived edge predicates were generated; edge cases and prohibitions were derived from 34-CONTEXT.md decisions and 34-RESEARCH.md pitfalls and recorded in each plan's `must_haves.prohibitions`.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `install/host-tools.ts` + `install/host-tools.test.ts` — registry, count, detection mapping (plan 34-02, wave 1); table set equality (plan 34-06)
- [ ] `install/host-tools-prose.test.ts` — prose count-word and short-host-list scan with mutation proof (plan 34-09)
- [ ] A `detectTools()` behaviour case (none covers the `tools detected:` line today) (plan 34-02 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No test added/changed by this phase is red on windows-latest | HOST-02 (D-09) | The push is the human's act | Human pushes; record `test (windows-latest)` conclusion and any red file against WINDOWS.md rows 274/315 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
