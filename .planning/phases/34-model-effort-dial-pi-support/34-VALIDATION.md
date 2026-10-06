---
phase: "34"
slug: "model-effort-dial-pi-support"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
# nyquist_compliant stays false: 28 tasks checked across plans 34-01..34-10, 27 carry an <automated>
# verify, and 34-10 Task 3 (checkpoint:human-action, the human's push for HOST-02) carries none.
nyquist_compliant: false
wave_0_complete: true
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
| **Estimated runtime** | 966.66s for the full suite (local macOS run, 2026-10-06, plan 34-10 Task 1) |

---

## Sampling Rate

- **After every task commit:** `npm run build && npx vitest run <touched test files>`
- **After every plan wave:** full suite + `npm run check:build-parity && npm run typecheck` + `npm run freshness:adapters` + `node scripts/check-foundation-guards.js`
- **Before `/gsd-verify-work`:** full suite green, all CI gates green (`VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-claim-anchors.js`, `node scripts/check-banned-claims.js`), windows-latest result from a human-pushed run recorded (D-09)

---

## Per-Task Verification Map

Filled by the planner (requirement and plan level, 2026-10-06); plan 34-10 Task 2 filled the per-task detail and statuses. Every command runs as `npx vitest run --exclude '**/scripts/e2e/**' <files>` after `npm run build` (never plain `npm test`).

### By requirement

A ✅ in this table means the listed test files pass in the full-suite run on the final local tree (plan 34-10 Task 1, 2026-10-06: 100 of 100 files, 7335 tests passed, 2 skipped). It does not tick a requirement: verification decides status.

| Requirement | Behavior | Plans | Test Type | Test files | File Exists | Status |
|-------------|----------|-------|-----------|------------|-------------|--------|
| EFFORT-01 | citation, version facts and fallback in the dial docs | 34-07 | doc oracle | `scripts/model-dial-consistency.test.ts` | ✅ | ✅ green |
| EFFORT-02 | every refusal by name; effort-only block consumed; EFFORT_KEYS consumption | 34-01 | unit + mirror | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ green |
| EFFORT-03 | tiered effort derived from TIERED; rationale required; model tiered leaves effort inherit | 34-01, 34-03 | unit + mirror | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ green |
| EFFORT-04 | zero-config byte-equal (declared divergences only, D-14); configured emit; announcements asserted; guard red on hand-edit (D-15); installer delivery | 34-01, 34-03, 34-05, 34-07, 34-10 | integration | `scripts/generate-role-adapters.test.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/adapters-freshness.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/canonical-frontmatter.test.ts`, `install/install.test.ts` ("effort delivery") | ✅ | ✅ green |
| EFFORT-05 | closed sets at their own sites, non-colliding markers; precedence and reach documented | 34-07 | doc oracle | `scripts/model-dial-consistency.test.ts` | ✅ | ✅ green |
| HOST-01 | registry count; detection; oracle and validator derived; tables set-equal; prose count word and short host list (mutation-proved) | 34-02, 34-06, 34-09 | unit + corpus | `install/host-tools.test.ts`, `install/host-tools-prose.test.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/validate.test.ts` | ✅ (W0 done: 34-02, 34-09) | ✅ green |
| HOST-02 | no test added or changed by the phase red on windows-latest | 34-10 | CI | human-pushed run, read with `gh run view` | manual | ⬜ pending (34-10 Task 3) |
| PI-01 | Pi conventions recorded with sources | 34-06 | doc oracle | `install/host-tools.test.ts` | ✅ (W0 done: 34-02) | ✅ green |
| PI-02 | registry row, detection, `.pi/prompts/grugops.md` exact bytes, never overwrites, DRY_RUN writes nothing, docs | 34-02, 34-04, 34-06, 34-08 | integration + doc oracle | `install/install.test.ts`, `install/installer-dry-run.test.ts`, `install/host-tools.test.ts` | ✅ | ✅ green |
| PI-03 | ledgered; uninstall removes only recorded and unchanged; user file survives; special files at the path | 34-04, 34-10 | integration (class tests) | `install/installer-never-installed.test.ts`, `install/installer-user-edit.test.ts`, `install/installer-special-files.test.ts`, `install/installer-cross-version.test.ts`, `install/record-truth.test.ts`, `install/installer-write-set.test.ts`, `install/uninstall-removal.test.ts`, `install/install.test.ts` | ✅ | ✅ green |
| PI-04 | scope sentence with the cited Pi clause; Pi safety entries | 34-07, 34-06, 34-08 | doc oracle | `scripts/model-dial-consistency.test.ts`, `install/host-tools.test.ts` | ✅ | ✅ green |

### By plan and task

"Green at execution" is the plan's own SUMMARY record of its `<verify>` passing when the task was committed. The final-tree column is the 34-10 Task 1 full run.

| Plan | Task | Type | Requirement(s) | Automated verify (test files or gates) | At execution | Final tree |
|------|------|------|----------------|-----------------------------------------|--------------|------------|
| 34-01 | 1 effort tracer: one configured effort reaches one adapter | tracer | EFFORT-02, EFFORT-04 | `scripts/generate-role-adapters.test.ts`, `scripts/model-tiers.test.ts`, `scripts/adapter-byte-baseline.test.ts` | ✅ | ✅ |
| 34-01 | 2 the whole D-03 refusal class, both consumption probes, D-18 residual stated | auto | EFFORT-02, EFFORT-03 | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ |
| 34-02 | 1 host registry tracer: `.pi` makes the installer report `pi` | tracer | HOST-01, PI-02 | `install/host-tools.test.ts`, `install/installer-fs-census.test.ts` | ✅ | ✅ |
| 34-02 | 2 registry integrity; closing host line derived | auto | HOST-01 | `install/host-tools.test.ts` | ✅ | ✅ |
| 34-03 | 1 effort announcement; freshness refuses a configured run | tracer | EFFORT-04 | `scripts/adapters-freshness.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ |
| 34-03 | 2 per-role effort rationale (D-04); model tiered leaves effort alone (D-05) | auto | EFFORT-03 | `scripts/model-tiers.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ |
| 34-04 | 1 Pi template tracer: install writes, records, uninstall removes | tracer | PI-02, PI-03 | `install/install.test.ts` ("Pi prompt template") | ✅ | ✅ |
| 34-04 | 2 derived class tests include the Pi path (DC-2, DC-3) | auto | PI-03 | `install/installer-never-installed.test.ts`, `install/installer-user-edit.test.ts`, `install/installer-special-files.test.ts`, `install/installer-cross-version.test.ts`, `install/record-truth.test.ts` | ✅ | ✅ |
| 34-04 | 3 never overwrite; DRY_RUN writes nothing; idempotent; a user's `.pi/` never claimed | auto | PI-02, PI-03 | `install/install.test.ts`, `install/installer-dry-run.test.ts`, `install/installer-write-set.test.ts`, `install/uninstall-removal.test.ts`, `install/installer-fs-census.test.ts` | ✅ | ✅ |
| 34-05 | 1 configured adapter admitted; hand-edited `effort:` turns the guard red | tracer | EFFORT-04 | `scripts/check-foundation-guards.test.ts` | ✅ | ✅ |
| 34-05 | 2 DC-1 class matrix for the effort guard; canonical schema over configured output (D-15) | auto | EFFORT-04 | `scripts/check-foundation-guards.test.ts`, `scripts/canonical-frontmatter.test.ts` | ✅ | ✅ |
| 34-06 | 1 dispatch-table oracle derived from the registry, Pi row checked | tracer | HOST-01 | `scripts/check-uat-oracles.test.ts`, `scripts/check-foundation-guards.test.ts` | ✅ | ✅ |
| 34-06 | 2 validator coverage; two-sided per-host table equality | auto | HOST-01, PI-02 | `scripts/validate.test.ts`, `install/host-tools.test.ts` | ✅ | ✅ |
| 34-06 | 3 Pi conventions from primary sources; packaging prose count-free | auto | PI-01, HOST-01 | `install/host-tools.test.ts` | ✅ | ✅ |
| 34-07 | 1 effort closed sets at their own sites; doc oracle reads both ways | tracer | EFFORT-05 | `scripts/model-dial-consistency.test.ts` | ✅ | ✅ |
| 34-07 | 2 effort behaviour documented with citations; emitted field documented once | auto | EFFORT-01, EFFORT-05 | `scripts/model-dial-consistency.test.ts` | ✅ | ✅ |
| 34-07 | 3 count-free scope with the cited Pi clause; coordinator line under a declared divergence (D-14) | auto | PI-04, EFFORT-04 | `scripts/model-dial-consistency.test.ts`, `scripts/adapter-byte-baseline.test.ts`, `scripts/generate-role-adapters.test.ts` | ✅ | ✅ |
| 34-08 | 1 install guide's Pi section checked against what install writes | tracer | PI-02, PI-04 | `install/host-tools.test.ts`; `check-public-docs-vocabulary`, `check-claim-anchors` | ✅ | ✅ |
| 34-08 | 2 README, browser-UAT recipe, slash-command template, bootstrap example name Pi | auto | PI-02 | gates only: `check-claim-anchors`, `check-banned-claims`, `check-public-docs-vocabulary`, `check-imperative-lexicon`, `check-foundation-guards` | ✅ | ✅ |
| 34-08 | 3 FAQ, CLAUDE.md, PROJECT.md name Pi with no host count | auto | PI-02 | gates plus full suite: `check-claim-anchors`, `check-public-docs-vocabulary`, `check-foundation-guards`, `freshness:catalog`, `check:build-parity`, `typecheck`, full vitest | ✅ | ✅ |
| 34-09 | 1 derived host-prose scan finds planted count word and short list | tracer | HOST-01 | `install/host-tools-prose.test.ts` | ✅ | ✅ |
| 34-09 | 2 count-free comments and runtime strings in the hook closure | auto | HOST-01 | `scripts/context-io.test.ts`, `scripts/floor-invariance.test.ts`, `hooks/admission-guard.test.ts` | ✅ | ✅ |
| 34-09 | 3 count-free oracle messages; TypeScript arm live on the whole tree | auto | HOST-01 | `install/host-tools-prose.test.ts`, `scripts/check-uat-oracles.test.ts`, `scripts/check-foundation-guards.test.ts` | ✅ | ✅ |
| 34-10 | 1 effort delivery through the shipped installer; whole CI gate chain | tracer | EFFORT-04 | `install/install.test.ts -t "effort delivery"` (5 cases, mutation-proved both ways); the full CI chain | ✅ (5/5) | ✅ |
| 34-10 | 2 D-09 on the ROADMAP, D-18 residual, backlog 999.2-999.4, CHANGELOG, this map | auto | — (records) | `grep` checks on ROADMAP and this file; `check-claim-anchors` | ✅ | ✅ |
| 34-10 | 3 human push; windows-latest read from GitHub | checkpoint:human-action | HOST-02 | none (manual, see below) | ⬜ awaiting the push | ⬜ |

Count checked for `nyquist_compliant`: 28 tasks across 10 plans; 27 with an `<automated>` verify; 1 without (34-10 Task 3, manual by design under D-09). No three consecutive tasks lack an automated verify.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `install/host-tools.ts` + `install/host-tools.test.ts` — registry, count, detection mapping (plan 34-02, wave 1); table set equality (plan 34-06)
- [x] `install/host-tools-prose.test.ts` — prose count-word and short-host-list scan with mutation proof (plan 34-09)
- [x] A `detectTools()` behaviour case (none covers the `tools detected:` line today) (plan 34-02 Task 1; `install/host-tools.test.ts` reads the one `tools detected:` line)

---

## Residuals

### D-18: the unbounded `readModelsConfig` read (defect class DC-3), disclosed and not fixed

- **Where:** `readModelsConfig` in `scripts/model-tiers.ts` (compiled `scripts/model-tiers.js`). It reads
  the `models` configuration with `existsSync` followed by `readFileSync` on a path inside the user's
  repository (`.grugops/factory.config.json`, then `agent-factory/config/factory.config.json`), with
  no check that the path is a regular file.
- **Effect:** a FIFO planted at either path makes `readFileSync` block, so its callers hang instead of
  refusing. The non-test callers in the tree are `scripts/generate-role-adapters.ts` (the adapter
  generator) and `scripts/check-foundation-guards.ts` (which runs `guard_effort_assignment`). Whether
  the installer's mirror render reaches the read with a user path is not measured here
  (`UNKNOWN - verify`). That is DC-3, "unbounded read of a user-controlled path"
  (33.1-GAP-PLANNING-BRIEF.md §1).
- **Why not fixed in Phase 34:** decision D-18. The one bounded regular-file reader in this tree is
  `readUserFile` in `install/user-file.ts`. A bounded reader written in `scripts/` would be a second
  implementation of that rule, which is the "one authority per rule" failure the brief names (§2.2).
  Phase 34 extended this reader (the `models.effort` sub-block) and left the read itself unchanged.
- **Stated at the code:** the `readModelsConfig` doc comment carries a "DISCLOSED RESIDUAL, NOT FIXED
  (D-18, phase 34)" paragraph (plan 34-01 Task 2).
- **Owner:** ROADMAP backlog Phase 999.2, "Bound the readModelsConfig read (DC-3 residual from
  Phase 34, D-18)". A fix there needs a DC-3 class test (FIFO and directory at the path; the run
  finishes within a timeout).

### Spec-less probe fallback: skipped

No SPEC.md exists for this phase, and the phase had no requirement IDs when planning started, so no
probe-derived edge predicates were generated. Edge cases and prohibitions were derived from
34-CONTEXT.md decisions and 34-RESEARCH.md pitfalls instead, and recorded in each plan's
`must_haves.prohibitions`.

### Other recorded deferrals

- 34-RESEARCH.md Q6 (`fable` model alias): backlog Phase 999.3; `MODEL_ALIASES` unchanged.
- 34-RESEARCH.md Q7 (kit discovery on non-Claude hosts after a scripted install, `UNKNOWN - verify`;
  Pi inherits it): backlog Phase 999.4; the Pi template stays a plain pointer.
- Items found during execution and not fixed by the plan that found them:
  `deferred-items.md` in this directory.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Result |
|----------|-------------|------------|-------------------|--------|
| No test added/changed by this phase is red on windows-latest | HOST-02 (D-09) | The push is the human's act | Human pushes; record `test (windows-latest)` conclusion and any red file against WINDOWS.md rows 274/315 | ⬜ awaiting the push (34-10 Task 3) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (27 of 28; 34-10 Task 3 is manual by design)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter (left false: see the count above)

**Approval:** pending
