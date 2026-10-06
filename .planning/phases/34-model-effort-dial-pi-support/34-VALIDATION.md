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

Filled by the planner/executor per task. Requirement → test map from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| EFFORT-01 | citation + version floor in dial docs | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-02 | every refusal by name; effort-only block consumed | unit | `npx vitest run scripts/model-tiers.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-03 | tiered effort derived from model TIERED split; model tiered leaves effort inherit | unit | `npx vitest run scripts/model-tiers.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-04 | zero-config byte-equal (declared divergences only, D-14); configured mirror emits resolved lines; guard red on hand-edit (D-15) | integration | `npx vitest run scripts/generate-role-adapters.test.ts scripts/adapter-byte-baseline.test.ts scripts/adapters-freshness.test.ts scripts/check-foundation-guards.test.ts scripts/canonical-frontmatter.test.ts` | ✅ extend | ⬜ pending |
| EFFORT-05 | closed sets documented at their sites, non-colliding markers | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts` | ✅ extend | ⬜ pending |
| HOST-01 | registry count; detection; tables set-equal; no host count word in prose (mutation-proved) | unit + corpus | `npx vitest run install/host-tools.test.ts scripts/check-uat-oracles.test.ts` | ❌ W0 | ⬜ pending |
| HOST-02 | no new windows-latest red | CI | human-pushed run | manual | ⬜ pending |
| PI-01 | Pi conventions recorded with sources | doc oracle | `npx vitest run install/host-tools.test.ts` | ❌ W0 | ⬜ pending |
| PI-02 | `.pi/prompts/grugops.md` created with exact pointer bytes; never overwrites; DRY_RUN writes nothing | integration | `npx vitest run install/install.test.ts install/installer-dry-run.test.ts` | ✅ extend | ⬜ pending |
| PI-03 | ledgered; uninstall removes only recorded+unchanged; user file survives | integration | `npx vitest run install/installer-never-installed.test.ts install/installer-user-edit.test.ts install/installer-special-files.test.ts install/installer-write-set.test.ts install/uninstall-removal.test.ts` | ✅ re-pin | ⬜ pending |
| PI-04 | scope sentence + Pi safety rows with citations | doc oracle | `npx vitest run scripts/model-dial-consistency.test.ts install/host-tools.test.ts` | ✅/❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `install/host-tools.ts` + `install/host-tools.test.ts` — registry, count, detection mapping, table set equality, prose count scan with mutation proof
- [ ] A `detectTools()` behaviour case (none covers the `tools detected:` line today)

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
