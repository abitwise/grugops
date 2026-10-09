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
| HOST-02 | no test added or changed by the phase red on windows-latest | 34-10 | CI | human-pushed run, read with `gh run view` | manual | ❌ not met: run 37521787426, windows-latest failure, 5 red tests added or changed by this phase (see Manual-Only) |
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
| 34-10 | 3 human push; windows-latest read from GitHub | checkpoint:human-action | HOST-02 | none (manual, see below) | ✅ run 37521787426 read and recorded | ❌ windows-latest red; HOST-02 not met |

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
| No test added/changed by this phase is red on windows-latest | HOST-02 (D-09) | The push is the human's act | Human pushes; record `test (windows-latest)` conclusion and any red file against WINDOWS.md rows 274/315 | ❌ NOT MET. Run 37521787426, head `dc2c7581d4710aed1e288bcab01872a71b38d3e6` (equals the pushed `main` HEAD and local HEAD). `test (ubuntu-latest)` success; `test (windows-latest)` failure at step "Vitest (e2e lane excluded)": 13 files / 144 tests red. 5 red tests were added or changed by this phase (class b). See "Windows-latest measurement" below. **Gap round 1 (34-18): ❌ NOT MET.** Run 37733716975, head `9de784e863280e9510a50e122bf0d8ff12f5a833` (equals local HEAD at the push). `test (ubuntu-latest)` success; `test (windows-latest)` failure at "Vitest (e2e lane excluded)", printed `Test Files  4 failed \| 99 passed (103)` and `Tests  7 failed \| 7402 passed \| 28 skipped (7437)`. The five HOST-02 tests of 34-VERIFICATION.md gap 1 are green; two tests 34-13 changed are red (ledger.test.ts link records, a new cause, WINDOWS.md row 319). See "Gap round 1 (D-19): measured result" below. **Gap round 2 (34-23): no run.** No windows-latest run was made in round 2: the Windows measurement is deferred by the human (D-21), and HOST-02 stays unchecked. What the later run should show is in "Gap round 2 (D-21): prediction for the deferred run" below. |

### Windows-latest measurement (34-10 Task 3, read with `gh run view 37521787426` and `gh run view --job 112468804112 --log`)

GitHub printed: `Test Files 13 failed | 87 passed (100)`, `Tests 144 failed | 7165 passed | 28 skipped (7337)`.
Nothing below is inferred beyond what the log printed; "how decided" names the evidence.

Comparison baseline: the previous windows-latest measurement of `main` is run 36716255097 (head
`3fd78e60`, 2026-09-30, a 33.1 gap-round-2 head 72 commits before phase 34's first commit
`7030a26f`). It was also red on windows-latest (`Tests 67 failed`, 9 files) and green on ubuntu-latest.
That run is not recorded anywhere in `.planning/` (grep for its id finds nothing). Of today's 144 red
tests, 60 carry the same full name as a red test in that run; 84 are newly red. 33.1 gap round 3
(plans 33.1-36..33.1-40, 2026-10-02..05) landed between the two runs and was never measured on windows
before today.

Row (a) check: WINDOWS.md row 274 covers `scripts/board-watch-live.test.ts` (printed `✓ ... (6 tests)`
in this run) and row 315 covers the chmod-skipped cases of `install/installer-marker-retention.test.ts`
(printed `✓ ... (10 tests | 3 skipped)`) and the skipped "record that cannot be rewritten" case of
`install/installer-prune.test.ts`. None of the 144 red tests is a row 274 or row 315 case, so no red is
class (a). Rows 274 and 315 are not re-dispositioned here.

| Red file (as printed) | Red tests | File class | Per-test classification and how decided |
|---|---|---|---|
| `install/install.test.ts` | 3 | (b) file | All 3 carried: same names red in run 36716255097. Phase hunks (imports, two new describes, one count re-pin in "file ownership: a never-installed target") touch none of the 3. Every phase-added test in the file (Pi template contract, effort delivery) is green. Not HOST-02 tests. |
| `install/installer-dry-run.test.ts` | 5 | (b) file | **1 (b) test:** "subset: uninstall after a fresh install into an EMPTY target (flow 10's tree)" — its `FLOW10_CREATED` input gained `PI_PROMPT_REL` (commit d6c2e96a). It was red before the phase with the same assertion and the same received value (`expected 3 to be +0` in `expectPreviewSubsetOfRealRun`), so the change did not create the failure, but HOST-02 counts changed tests. 3 carried (same names red pre-phase). 1 newly red, added by 33.1-39 (flow 11, commit 2b43d714). |
| `install/installer-never-installed.test.ts` | 4 | (b) file | 2 carried (same names red pre-phase). 2 newly red (FN real / DRY_RUN), added by 33.1-36 (commit 7b617efd). The phase-changed test ("WRITE_PATHS is the derived union ...", count 85 -> 88) is green. No (b) test. |
| `install/installer-user-edit.test.ts` | 60 | (b) file | **1 (b) test:** the `.pi/prompts/grugops.md (edited in the default install)` row, which exists because this phase's installer writes the Pi template (count 58 -> 59, commit c20ce923). It fails like 56 other rows: `exit 3`, the marker "written for another directory (C:\Users\runneradmin\...), not this one (C:/Users/runneradmin/...)". 3 carried (same names red pre-phase). The 56 other newly red rows existed at 3fd78e60 and were green there. |
| `install/ledger-provenance.test.ts` | 1 | (b) file | Carried ("R1/R2 portability: a copied installed tree ...", same name red pre-phase). The phase-changed test ("install creates 8 files ...") is green. No (b) test. |
| `install/record-truth.test.ts` | 45 | (b) file | **1 (b) test:** the L1 row ".pi/prompts/grugops.md: a chmod-only edit survives uninstall", which exists because the removable set gained the Pi template (33 -> 34, commit c20ce923); it fails like the other L1 rows (`lost the user's mode: expected 438 to be 502`), all 35 of which were red pre-phase. 38 carried in total (same names: 35 L1 rows and 3 others). 6 newly red B1 "naming why" cases, added by 33.1-36 (commit 7b617efd), which replaced the 7 pre-phase "naming it" reds. |
| `install/uninstall-removal.test.ts` | 2 | (b) file | **2 (b) tests:** "a never-installed target holding grugops blocks, both settings files and the fixed directories empty ..." real and DRY_RUN. This phase changed their body (plants a Pi template, commit d6c2e96a). The printed failure is `no left line for the empty .claude/agents`, not about the Pi file. The test was added by 33.1-38 (commit bd4a4b83, 2026-10-05) and was never run on windows before this run, so whether it was red before the phase's change is `UNKNOWN - verify`. |
| `install/installer-kit-home.test.ts` | 2 | (c) | Not in WINDOWS.md rows 274/315, not touched by this phase. Added by 33.1-37; printed `expected 'C:/Users/runneradmin/...' to be 'C:\Users\runneradmin\...'`. |
| `install/installer-prune.test.ts` | 4 | (c) | The file is named by row 315, but row 315's case is a skip and the 4 red tests (IN-03 mode 0600/0664, prune after --migrate, chmod since install) are other cases, added by 33.1-40. Not touched by this phase. |
| `install/installer-write-set.test.ts` | 2 | (c) | Carried (same names red pre-phase); not touched by this phase; no WINDOWS.md row. |
| `install/kit-plan-limits.test.ts` | 2 | (c) | Carried (same names red pre-phase); not touched by this phase; no WINDOWS.md row. |
| `install/ledger.test.ts` | 9 | (c) | Newly red; tests of `install/ledger.ts` added by 33.1-36/37/40; this phase did not change `install/ledger.ts` or the test. Printed failures include `expected 'unbound' to be 'ok'` and mode/record mismatches. |
| `install/marker-binding.test.ts` | 5 | (c) | Carried (same names red pre-phase); not touched by this phase; no WINDOWS.md row. |

Totals: (a) 0 tests; (b) 5 tests in 4 files; the other 139 red tests are carried from before the phase
(60 pre-phase reds by name) or were added/made red by 33.1 gap round 3 and first measured here.
Two message families account for most reds as printed: a marker/kit-home path compared in two
spellings (`C:\Users\...` against `C:/Users/...`) and Windows file modes (`expected 438 to be 502`).
Their cause is not established from the log (`UNKNOWN - verify`). Nothing was fixed in this plan
(34-10 prohibition); gap closure decides.

### Gap round 1 (D-19): diagnosis and prediction, written before the push

Written by plan 34-18 Task 1 and committed before the human pushes, so the windows-latest result can be
read against it rather than explained after the fact (WIN-3). Nothing here is a Windows result. The
measured result goes in "Gap round 1 (D-19): measured result" below, from a run the human pushes.

**How the earlier reds were re-read.** `gh run view --job 112468804112 --log` (read-only, run
37521787426, head `dc2c7581`), colour sequences and the job/step/timestamp prefix stripped, each block
taken from a line ` FAIL  <file> > …` (the header line included) to the next `⎯⎯⎯[n/144]⎯` separator,
and the plan's family rule applied, first match wins. The rule is in 34-18-PLAN.md § "The family rule".

**Family counts reproduced: 144 blocks; WIN-1 recorded path 91, WIN-1 printed path 5, WIN-2 43, other
families 5.** These equal the counts stated at planning. One note on the reading: the WIN-1 printed-path
arm for `installer-write-set.test.ts` "--migrate: a directory at .grugops/factory.config.json" matches
only when the block's own ` FAIL` header line is part of the block. The `.grugops/factory.config.json`
substring is in the test's name; the printed `was not carried forward` line spells the path with
backslashes and the code frame truncates the source line. With the header excluded that one block reads
as unclassified and the printed-path count is 4. The plan's rule takes the block from the ` FAIL` line,
so the header is included and the count is 5.

#### Root causes, as plans 34-11, 34-12 and 34-13 state them from source and the printed log

| Family | Write side / producer (at run head `dc2c7581`) | Compare side (at run head) | Fix (plan, current site) |
|---|---|---|---|
| WIN-1 recorded path | the marker `target` and the kit-home `grugopsHome` were the host spelling `C:\Users\…`; the test helper `rebindMarker` wrote `m.target = realpathSync.native(t)` (install/installer-paths.test-support.ts:181) | `markerBinding`: `if (boundTo !== here)` (install/install-marker.ts:332); `readKitHomeRecord`: `parsed.grugopsHome !== here` (install-marker.ts:1099), with `here` spelled `C:/Users/…` | 34-11: `canonicalPathSpelling` (install/user-file.ts:317) spells every recorded path; `sameRecordedPath` (user-file.ts:332) decides both bindings (install-marker.ts:334, :1124); `realTargetPath` / `realPathThroughExisting` (user-file.ts:357, :377) return the canonical spelling; `rebindMarker` writes `realTargetPath(t)` (installer-paths.test-support.ts:184). 34-12: expected recorded paths come from `realTargetPath` (marker-binding, installer-kit-home, ledger, install.test.ts `canonicalPath`) |
| WIN-1 printed path | the installer prints mixed spellings on Windows, e.g. `C:\…\target/.claude/agents`, and the doctor prints the marker path with backslashes | tests matched output against a natively built path: uninstall-removal `l.includes(join(target, ...d.split("/")) + " (")` (install/uninstall-removal.test.ts:577), a leading-`/` absoluteness test in installer-dry-run, a forward-slash regex on the doctor line (install.test.ts IN-04), `l.includes(".grugops/factory.config.json")` on the migrate verify line (installer-write-set.test.ts:605) | 34-12: `pathText`, `lineNamesPath`, `printedRel` (installer-paths.test-support.ts:214, :229, :248) apply the product's `canonicalPathSpelling` to both sides; the test-side census (install/path-spelling-census.test.ts) holds every installer test to them |
| WIN-2 | the L1 rows made the "user edit" with `chmodSync(p, modeOf(p) ^ 0o100)` (install/record-truth.test.ts:335-336), an execute-bit flip Windows does not store; ledger and prune tests built expected records from literal modes | `expect(modeOf(p), …lost the user's mode).toBe(mode)` (record-truth.test.ts:340): Windows reported 0o666 (438) against the requested 0o766 (502) | 34-13: `userModeEdit` clears the write bits, the one change every platform stores, and throws when nothing was stored; `storedMode` reads expected modes back (installer-paths.test-support.ts:280, :290); one renderer `modeText` (user-file.ts:437) and one comparison `modeMatches` (install-marker.ts:442, used by `recordMatches` and uninstall.ts:1176, :1417); the IN-03 0600/0664 cases are gated on the measured capability "POSIX permission bits beyond read-only" (scripts/check-platform-shapes.ts:683; installer-prune.test.ts:210) and print a skip where it is absent (WINDOWS.md row 318). 34-14: the WIN-2 census (install/mode-census.test.ts) |

The record-truth L1 rows need both fixes: on Windows they first failed the mode assertion, but they run
after a copied marker binds, which is the WIN-1 rule.

#### Per-file prediction for the 13 red files of run 37521787426

| File (as printed) | Red then | WIN-1 recorded | WIN-1 printed | WIN-2 | Other | Fixing plan(s) | Predicted on the pushed head |
|---|---|---|---|---|---|---|---|
| `install/install.test.ts` | 3 | 0 | 1 | 0 | 2 | 34-12 (IN-04 doctor line through `pathText`) | **red, 2 tests** (the two other-family tests); IN-04 green |
| `install/installer-dry-run.test.ts` | 5 | 5 | 0 | 0 | 0 | 34-11 (`rebindMarker`, `sameRecordedPath`), 34-12 (`printedRel`) | green |
| `install/installer-kit-home.test.ts` | 2 | 2 | 0 | 0 | 0 | 34-11 (`readKitHomeRecord`), 34-12 (expected from `realTargetPath`) | green |
| `install/installer-never-installed.test.ts` | 4 | 4 | 0 | 0 | 0 | 34-11 | green |
| `install/installer-prune.test.ts` | 4 | 0 | 1 | 3 | 0 | 34-12 (after `--migrate` lines through `lineNamesPath`), 34-13 (W3 through `userModeEdit`; IN-03 x2 capability-gated) | green file: 2 tests green, **2 tests skipped with a printed `SKIPPED shape="POSIX permission bits beyond read-only"` line** (IN-03 0600 and 0664) |
| `install/installer-user-edit.test.ts` | 60 | 60 | 0 | 0 | 0 | 34-11, 34-12 (`linesNaming` through the helpers) | green |
| `install/installer-write-set.test.ts` | 2 | 0 | 1 | 0 | 1 | 34-12 (:605 through `pathText`) | **red, 1 test** (the other-family readUserFile ENOTDIR case); the migrate case green |
| `install/kit-plan-limits.test.ts` | 2 | 0 | 0 | 0 | 2 | none (outside D-19's two families) | **red, 2 tests** |
| `install/ledger-provenance.test.ts` | 1 | 1 | 0 | 0 | 0 | 34-11, 34-12 (`printedRel` for `REMOVED_DIRS`) | green |
| `install/ledger.test.ts` | 9 | 3 | 0 | 6 | 0 | 34-11/34-12 (fixtures from `realTargetPath`), 34-13/34-14 (W4-W9 through `storedMode`/`userModeEdit`; `FILE_REC` from a stored mode) | green |
| `install/marker-binding.test.ts` | 5 | 5 | 0 | 0 | 0 | 34-11, 34-12 (`recordedTarget`, the two-spelling remedy) | green |
| `install/record-truth.test.ts` | 45 | 11 | 0 | 34 | 0 | 34-11/34-12 (all 45), 34-13 (the 34 L1 mode rows) | green |
| `install/uninstall-removal.test.ts` | 2 | 0 | 2 | 0 | 0 | 34-12 (`linesFor`, `EMPTY_DIRS` through `pathText`/`lineNamesPath`) | green |
| **Total** | **144** | **91** | **5** | **43** | **5** | | **3 files and 5 tests red; 137 green; 2 skipped** |

Per-test detail for the files whose reds do not all share one prediction:

- `install/install.test.ts`: "readUserFile: an absent path is `absent`; a path under a regular file and a dangling symlink are not" (other, red); "W1: when the incomplete copy cannot be removed either, …" (other, red); "IN-04: a directory at the marker — install --check finishes with the unreadable-marker finding and leaves it as it was" (WIN-1 printed, green).
- `install/installer-write-set.test.ts`: "readUserFile: a path under a regular file is `unreadable` (ENOTDIR), never `absent`" (other, red); "--migrate: a directory at .grugops/factory.config.json — the legacy config is neither renamed nor lost" (WIN-1 printed, green).
- `install/installer-prune.test.ts`: "IN-03: an edited kit file with mode 0600 is backed up with mode 0600, holding the edit" and "… mode 0664 …" (WIN-2, skipped with a printed line, not green and not red); "a recorded backup with a chmod since install made it is left, named with the reason, and keeps its entry" (WIN-2, green); "after a --migrate: DRY_RUN changes nothing; prune removes the recorded in-repo-kit, legacy-config and kit-home backups, …" (WIN-1 printed, green).
- `install/ledger.test.ts`: the six WIN-2 tests ("treeRecord gives a file its file record, …", "treeRecord walks with lstat: …", "backupContentRecord: a file's bytes and mode, …", "carries the previous kit-true entry's own record while owns answers owned", "a chmod-only change is recorded, not owned, and the mode is named", "a file entry whose bytes and mode still match is owned") and the three WIN-1 recorded tests ("readKitHomeRecord: absent, ok, unbound …", "a bound marker in the six-record shape, with no `ledger`, …", "a bound marker with `ledger` reads `ok`; …") are all predicted green.

#### The five HOST-02 tests (34-VERIFICATION.md gap 1), predicted green

| Test | Family | Fixing plan(s) | Predicted |
|---|---|---|---|
| uninstall-removal.test.ts "a never-installed target holding grugops blocks, both settings files and the fixed directories empty changes by zero bytes, and each is named" (real) | WIN-1 printed | 34-12 | green |
| the same test, DRY_RUN | WIN-1 printed | 34-12 | green |
| installer-user-edit.test.ts `.pi/prompts/grugops.md (edited in the default install)` | WIN-1 recorded | 34-11, 34-12 | green |
| record-truth.test.ts ".pi/prompts/grugops.md: a chmod-only edit survives uninstall (the file stays, with the user's mode)" | WIN-1 and WIN-2 | 34-11, 34-13 | green |
| installer-dry-run.test.ts "subset: uninstall after a fresh install into an EMPTY target (flow 10's tree): …" | WIN-1 recorded | 34-11, 34-12 | green |

#### The five other-family tests, predicted red (carried)

All five were red by the same name in the pre-phase run 36716255097 (job 109889805015) and in run
37521787426. Their bodies are byte-identical between `45766c2d` (phase plan) and the local HEAD below:
each test call was extracted from both trees with the TypeScript parser and hashed (sha256 prefix and
length the same at both revisions). They sit outside D-19's two families and this round does not touch
them.

| Test | Printed cause (run 37521787426) | Body at 45766c2d and HEAD | Predicted |
|---|---|---|---|
| install.test.ts "readUserFile: an absent path is `absent`; a path under a regular file and a dangling symlink are not" | `expected { state: 'absent' }` against `unreadable` / `ENOTDIR` (Windows reports ENOENT for a path under a regular file) | 753 bytes, `837db277d4c3` both | red |
| install.test.ts "W1: when the incomplete copy cannot be removed either, the verify names it incomplete, and uninstall never calls it a backup of the edit" | the W1 ENOSPC kit re-install case | 1522 bytes, `7312ea3846af` both | red |
| installer-write-set.test.ts "readUserFile: a path under a regular file is `unreadable` (ENOTDIR), never `absent`" | `expected { state: 'absent' }` (ENOENT, as above) | 297 bytes, `21f82adf30b5` both | red |
| kit-plan-limits.test.ts "a full path of PATH_MAX - 1 bytes is within the limit, and PATH_MAX bytes is over it (PATH_MAX counts the NUL)" | `has a component of 1023 bytes` (PATH_MAX/NAME_MAX limits) | 711 bytes, `067e3bbb0f8d` both | red |
| kit-plan-limits.test.ts "a component of NAME_MAX bytes is within the limit, and NAME_MAX + 1 bytes is over it, counted in UTF-8 bytes" | `has a component of 258 bytes` | 458 bytes, `4610245de9ed` both | red |

#### Tests this round added or changed that have never run on windows-latest

HOST-02 counts every test phase 34 added or changed, gap round 1 included, so these are part of the
reading too. `git diff --stat dc2c7581..HEAD` over test files lists 18: three new files
(`install/canonical-path.test.ts`, `install/path-spelling-census.test.ts`, `install/mode-census.test.ts`)
and 15 changed ones (`install/install.test.ts`, which also gained the 34-15 effort refusal cases,
`installer-dry-run`, `installer-kit-home`, `installer-marker-retention`, `installer-paths.test-support`,
`installer-prune`, `installer-user-edit`, `installer-write-set`, `ledger-provenance`, `ledger`,
`marker-binding`, `record-truth`, `settings-json-provenance`, `uninstall-removal`, and
`scripts/context-io.test.ts`). Prediction: green, apart from the reds and skips named above. Basis: the
two censuses and the canonical-path tables are pure (they parse source or call `path.win32` /
`path.posix` functions) and derive their scanned sets with `readdir`; the rest are covered by the local
run below. That is a prediction, not a measurement: none of these has run on windows-latest.

#### Predicted printed totals

- `Test Files 3 failed | 100 passed (103)`. Run 37521787426 printed 100 files, the local count at its
  head; this round's three new test files make 103, the local count below.
- `Tests 5 failed | …`, with the total equal to the local total below (7437) if every test is defined
  the same way on both hosts, as it was for run 37521787426 (7337 on both). The skipped count rises by at least
  the two IN-03 cases over the 28 printed then; whether any new test skips on Windows is
  `UNKNOWN - verify`.
- The two `check-platform-shapes.js` steps run before vitest on windows-latest and now also probe the
  capability 34-13 added. An absent capability is a skip row, not a failure (`probeHostCapabilities`
  in scripts/check-platform-shapes.ts), so the prediction is: the line reads `ABSENT (skipped, see
  below)` and both steps stay green, as they were in run 37521787426. Not measured.

#### `UNKNOWN - verify` before the run

- Assertions after the first failing one in every earlier red have never run on windows-latest. Plan
  34-12 Task 3 audited them statically (the masked-assertion table in 34-12-SUMMARY.md); a later
  assertion may still fail.
- How windows-latest treats a read-only file on uninstall, rename and hard-link removal. `userModeEdit`
  leaves files read-only; the L1 rows expect uninstall to keep such a file with exit 0 or 3. For
  CLAUDE.md and `.github/copilot-instructions.md`, uninstall's block removal cannot write the read-only
  file, so the file is kept before the mode is compared (34-13 deviation 1); the exit status that write
  failure produces on Windows is unmeasured. Whether Windows stores the write-bit clear as its read-only
  attribute and whether `modeMatches` sees it there is 34-14 m4's open half.
- The capability gate's skip line on windows-latest: predicted to print `SKIPPED shape="POSIX permission
  bits beyond read-only" position="install/installer-prune.test.ts: IN-03 0600" platform=win32: …` and
  its 0664 twin; that the probe reads absent there is predicted, not measured.

#### Test names carried to the pushed head

So the measured run can be compared by name, `npx vitest list --json` over the 13 files (it collects
names, runs nothing; 1297 tests) was checked against the 144 printed names: 143 exist unchanged. The
one that does not is marker-binding.test.ts "B2: after the remedy (target set to this directory by
hand, for the same repository moved), uninstall reverses the install". Plan 34-12 turned it into two
cases, one per spelling: "… by hand in the spelling the remedy prints (realTargetPath), …" and "… by
hand in the host's native spelling a user types (nativeRealPath), …". Both are predicted green, so the
WIN-1 recorded-path family has 92 test names on the pushed head for the 91 earlier reds.

#### Local chain on the tree to be pushed (macOS, not a Windows result)

Run on local HEAD `17fd6be28b4b8468d564e631fe891fbc2d7efae5` (plan 34-17's last commit), working tree
clean, 2026-10-08: the workflow's steps as listed in 34-18-PLAN.md Task 1 `<verify>`, in that order
(build, build parity, typecheck, `check-platform-shapes.js`, vitest with the e2e lane excluded, the
seven freshness gates, `generate:adapters` followed by the clean check on `.claude/agents/`, foundation
guards, kit refs, public-docs vocabulary, audit register, claim anchors, banned claims, imperative
lexicon, `validate-agent-factory.js`). Exit 0. `npm test` was not run.

Vitest printed: `Test Files  103 passed (103)`, `Tests  7435 passed | 2 skipped (7437)`, duration
987.22 s.

The commit that adds this section changes only this file, so the head the human pushes is that commit,
one documentation commit on top of `17fd6be2`. Its sha is recorded at the checkpoint and checked
against the run's `headSha` in Task 3.

### Gap round 1 (D-19): measured result

Written by plan 34-18 Task 3 from GitHub's own run data, read-only: `gh run view 37733716975 --json
conclusion,headSha,jobs` and `gh run view --job 113168427323 --log`, colour sequences and the
job/step/timestamp prefix stripped, each red block taken from its ` FAIL  <file> > …` line to the next
`⎯⎯⎯[n/7]⎯` separator, and the family rule of 34-18-PLAN.md applied, first match wins. The human pushed;
no agent ran `git push`.

- **Run:** 37733716975, workflow `ci`, event `push`, branch `main`, created 2026-10-08T05:42:22Z,
  completed 06:35:27Z. Conclusion **failure**.
- **Head sha:** `9de784e863280e9510a50e122bf0d8ff12f5a833`. It equals the local HEAD at the push (the
  plan 34-18 Task 1 commit that added the prediction above).
- **`test (ubuntu-latest)`** (job 113168427533): **success**, every step including the freshness and repo
  gates.
- **`test (windows-latest)`** (job 113168427323): **failure**, at step "Vitest (e2e lane excluded)". Every
  earlier step succeeded, the two platform-shape steps included. The leg ran Node v22.23.3 in
  `D:\a\grugops\grugops`.

GitHub printed, verbatim:

```
 Test Files  4 failed | 99 passed (103)
      Tests  7 failed | 7402 passed | 28 skipped (7437)
```

Predicted: `Test Files 3 failed | 100 passed (103)` and `Tests 5 failed`, total 7437. The total matches.
The run has one more red file and two more red tests than predicted. Both extra reds are in
`install/ledger.test.ts` and are a new cause (below).

#### Per-file result for the 13 red files of run 37521787426

| File (as printed) | Red then | Predicted | Printed now | Against the prediction |
|---|---|---|---|---|
| `install/install.test.ts` | 3 | red, 2 tests | `❯ install/install.test.ts (409 tests \| 2 failed \| 1 skipped)` | as predicted: the two other-family tests red, IN-04 green |
| `install/installer-dry-run.test.ts` | 5 | green | `✓ install/installer-dry-run.test.ts (16 tests)` | as predicted |
| `install/installer-kit-home.test.ts` | 2 | green | `✓ install/installer-kit-home.test.ts (27 tests)` | as predicted |
| `install/installer-never-installed.test.ts` | 4 | green | `✓ install/installer-never-installed.test.ts (41 tests)` | as predicted |
| `install/installer-prune.test.ts` | 4 | green file, 2 skipped with a printed line | `✓ install/installer-prune.test.ts (21 tests \| 1 skipped)` | green as predicted, and both IN-03 `SKIPPED` lines printed. The skip count was predicted wrong: see "The IN-03 skip lines" below |
| `install/installer-user-edit.test.ts` | 60 | green | `✓ install/installer-user-edit.test.ts (99 tests)` | as predicted |
| `install/installer-write-set.test.ts` | 2 | red, 1 test | `❯ install/installer-write-set.test.ts (442 tests \| 1 failed)` | as predicted: the readUserFile ENOTDIR case red, the `--migrate` case green |
| `install/kit-plan-limits.test.ts` | 2 | red, 2 tests | `❯ install/kit-plan-limits.test.ts (10 tests \| 2 failed)` | as predicted |
| `install/ledger-provenance.test.ts` | 1 | green | `✓ install/ledger-provenance.test.ts (69 tests)` | as predicted |
| `install/ledger.test.ts` | 9 | green | `❯ install/ledger.test.ts (43 tests \| 2 failed)` | **NOT as predicted: 2 red, a new cause** |
| `install/marker-binding.test.ts` | 5 | green | `✓ install/marker-binding.test.ts (21 tests)` | as predicted (the B2 remedy case's two successor cases included) |
| `install/record-truth.test.ts` | 45 | green | `✓ install/record-truth.test.ts (72 tests)` | as predicted |
| `install/uninstall-removal.test.ts` | 2 | green | `✓ install/uninstall-removal.test.ts (28 tests \| 13 skipped)` | as predicted. The 13 skips are the three `describe.skipIf(!canSymlink)` blocks (`canSymlink = process.platform !== "win32"`, :230), the same 13 as in run 37521787426; the HOST-02 describe at :548 has no skip |
| **Total** | **144** | **3 files, 5 tests red** | **4 files, 7 tests red** | |

No other file is red. The three new test files are green: `✓ install/canonical-path.test.ts (63 tests)`,
`✓ install/path-spelling-census.test.ts (13 tests)`, `✓ install/mode-census.test.ts (15 tests)`. So are the
other test files this round changed (`installer-marker-retention`, `settings-json-provenance`,
`scripts/context-io.test.ts`). The 28 vitest skips are the same per file as in run 37521787426:
host-protection 8, generate-role-adapters 1, skill-twins-freshness 1, install.test.ts 1,
uninstall-removal 13, installer-prune 1, installer-marker-retention 3.

#### Every red, with its family

| # | Test (as printed) | Printed failure | Family (rule) | Predicted |
|---|---|---|---|---|
| 1 | install.test.ts > readUserFile: the one bounded reader of a user path (DC-3, plan 33.1-26) > readUserFile: an absent path is `absent`; a path under a regular file and a dangling symlink are not | `expected { state: 'absent' } to deeply equal { Object (state, code) }` at install.test.ts:7294:66 | other (`{ state: 'absent' }`) | red |
| 2 | install.test.ts > kit re-install (D-32, plan 33.1-32) > W1: when the incomplete copy cannot be removed either, the verify names it incomplete, and uninstall never calls it a backup of the edit | `expected false to be true` at install.test.ts:10090:99 | other (the W1 ENOSPC kit re-install case) | red |
| 3 | installer-write-set.test.ts > readUserFile and readForWrite: absent means nothing is there (red-team of plan 33.1-26) > readUserFile: a path under a regular file is `unreadable` (ENOTDIR), never `absent` | `expected { state: 'absent' } to deeply equal { Object (state, code) }` at installer-write-set.test.ts:656:76 | other (`{ state: 'absent' }`) | red |
| 4 | kit-plan-limits.test.ts > kit plan: a destination over the platform path limits (red-team borderline (a) of plan 33.1-31) > a full path of PATH_MAX - 1 bytes is within the limit, and PATH_MAX bytes is over it (PATH_MAX counts the NUL) | `has a component of 1023 bytes, over this platform's name limit of 255 bytes (NAME_MAX)` at kit-plan-limits.test.ts:85:34 | other (component of N bytes) | red |
| 5 | kit-plan-limits.test.ts > (same describe) > a component of NAME_MAX bytes is within the limit, and NAME_MAX + 1 bytes is over it, counted in UTF-8 bytes | `has a component of 258 bytes, over this platform's name limit of 255 bytes (NAME_MAX)` at kit-plan-limits.test.ts:92:66 | other (component of N bytes) | red |
| 6 | ledger.test.ts > plan 33.1-37: treeRecord, owns for kit and backup, and readKitHomeRecord > treeRecord gives a file its file record, a link its link record, and null for a FIFO, nothing, or a walk past TREE_MAX_ENTRIES | `expected 'link:D:\some\where' to be 'link:/some/where'` at ledger.test.ts:454:37 | **no family of the rule matches: new cause** | green |
| 7 | ledger.test.ts > plan 33.1-40: backupContentRecord, outermostBackups and carriedBackups > backupContentRecord: a file's bytes and mode, a tree, a link; null for a hard link, a FIFO, nothing, or a link on the way | `expected 'link:D:\some\where' to be 'link:/some/where'` at ledger.test.ts:638:48 | **no family of the rule matches: new cause** | green |

Family counts on this run: WIN-1 recorded path 0, WIN-1 printed path 0, WIN-2 0, other families 5,
unmatched 2.

#### The two reds the prediction marked green: a new cause

Both tests were WIN-2 reds in run 37521787426. There, each failed first on a mode-bearing file record
(`expected 'sha256:2d7116…' to be 'sha256:2d7116…'` and `'sha256:fcbc80…'`). Plan 34-13 changed both
bodies to build that expectation from the stored mode (commit `5a11fc9f`): ledger.test.ts:452
`fileRecord("x", storedMode(...))` and :634-635 `userModeEdit` then `fileRecord("mine\n", bakMode)`. On
windows-latest those assertions now pass. The next assertion, masked until now, fails:

```
symlinkSync("/some/where", join(root, "l"));                      // ledger.test.ts:453 (and :637 for l.bak)
expect(treeRecordOf(root, "l")).toBe(linkRecord("/some/where"));  // :454 (and :638) — received 'link:D:\some\where'
```

This is not the WIN-1 or WIN-2 message family, so it is not a missed site of either. It is a new cause,
and this is what the printed failure and the source show:

- **Producer:** `treeRecord` (install/user-file.ts:454) and `backupContentRecord` both return
  `link:${readlinkSync(top)}`. They record the link target as the platform reports it.
- **Fixture:** the test creates the link to the rooted POSIX target `/some/where` and expects
  `linkRecord("/some/where")` (install/install-marker.ts:462, `link:${target}`). That holds only if the
  target comes back from readlink byte for byte.
- **Platform:** Node's `fs.symlink` preprocesses the destination on Windows. In
  `preprocessSymlinkDestination` (internal/fs/utils), an absolute target goes through
  `path.toNamespacedPath`, which resolves a rooted path against the current drive. This was read from
  local Node v24.12.0 with `--expose-internals`. The leg ran Node v22.23.3, whose copy was not read, so
  that half is `UNKNOWN - verify`. The leg's working directory is on `D:`, and readlink returned
  `D:\some\where`, which is consistent with that reading.
- **Why the prediction missed it:** the prediction listed "assertions after the first failing one in
  every earlier red have never run on windows-latest" as `UNKNOWN - verify`. Plan 34-12's masked-assertion
  audit covered the WIN-1 reds only. Its "Not WIN-1, so outside this audit" list names ledger.test
  :432 and :621, the earlier first failures of exactly these two tests, so no one audited the assertions
  after them.
- **Product reach: `UNKNOWN - verify`.** The installer records its own links as `linkRecord(src)`
  (install/install.ts:2482, :3718). `isOwnLink` (install/user-file.ts:536) compares `readlinkSync(dest) ===
  src`. Both meet the same respelling if any `src` reaches `symlinkSync` on Windows in a form Windows
  rewrites (a rooted path without a drive, or forward slashes). The link cases that would show it
  (`uninstall-removal.test.ts` B1/B2, B3, and the install.js link removals) are `describe.skipIf` on
  win32, so this run says nothing about the product side.

Ledgered as WINDOWS.md row 319 (phase 34, `unmet-truth`). Not fixed here (34-18 prohibition). Gap round
2 decides, and should also audit the assertions after the first failure in every other earlier WIN-2 red.
The 34-12 audit did not cover that.

#### The IN-03 skip lines

Both lines printed, as predicted (log lines 7090 and 7093 of the stripped job log):

```
SKIPPED shape="POSIX permission bits beyond read-only" position="install/installer-prune.test.ts: IN-03 0600" platform=win32: this platform keeps only the read-only attribute of a file (Windows), so a mode such as 0600 or 0664 cannot be stored and a fixture that sets one asserts nothing; …
SKIPPED shape="POSIX permission bits beyond read-only" position="install/installer-prune.test.ts: IN-03 0664" platform=win32: …
```

The prediction got the count wrong. It said the vitest skip count would rise by at least these two, and it
stayed at 28. Each IN-03 case prints its skip line and `return`s (installer-prune.test.ts:210-213), so
vitest counts it as passed, not skipped. That is the same convention as the printed FIFO skips in
`scripts/context-io.test.ts`. The file's one vitest skip is the failed-rewrite case under row 315 ("SKIP
the failed-rewrite case of installer-prune.test.ts — win32", log line 7083). Row 318 already records that
a backup's 0600/0664 bits are unobserved on windows-latest.

#### The `UNKNOWN - verify` items the prediction listed, against this run

- **Assertions after the first failing one in every earlier red.** Partly answered. 137 of the 144 earlier red
  test names are green (the marker-binding B2 remedy case through its two successor cases). For each of
  them every assertion now ran and passed on windows-latest. In two tests (rows 6 and 7 above) a masked assertion fails. The five other-family tests
  still fail where they failed before, so their later assertions remain unrun.
- **Read-only files on uninstall, rename and hard-link removal.** Partly answered. All 72 record-truth
  tests pass, among them the 34 L1 rows (CLAUDE.md and `.github/copilot-instructions.md` included).
  `userModeEdit` throws when the platform stores no mode change (installer-paths.test-support.ts:294-296).
  So on windows-latest clearing the write bits is stored and seen by `storedMode`, and the L1 rows' "kept,
  with the user's mode" expectations hold. Still `UNKNOWN - verify`: which of the accepted exit statuses
  (0 or 3) the CLAUDE.md and copilot block-removal write failure produced, because a passing test prints
  nothing. The hard-link case in ledger.test.ts (:639-643) sits after the new red at :638 and is still
  masked.
- **The capability gate's skip line.** Answered: printed as predicted (above). The platform-shape steps
  printed `POSIX permission bits beyond read-only ABSENT (skipped, see below)` and stayed green, as
  predicted.

#### The unchanged-body check (`git diff 45766c2d..9de784e8`)

For each red, each test's `it(` call was located with the TypeScript parser at both revisions. The
`git diff -U0 45766c2d..9de784e8 -- <file>` hunks were then intersected with those line ranges, old side
and new side.

| Red test | Body at 45766c2d | Body at 9de784e8 | Hunks in the file | Hunks inside the body |
|---|---|---|---|---|
| install.test.ts readUserFile absent / ENOTDIR | :6953-6964 | :7290-7301 | 58 | **0** |
| install.test.ts W1 incomplete copy | :9734-9755 | :10077-10098 | 58 | **0** |
| installer-write-set.test.ts readUserFile ENOTDIR | :651-655 | :653-657 | 4 | **0** |
| kit-plan-limits.test.ts PATH_MAX - 1 | :76-89 | :76-89 | 0 | **0** |
| kit-plan-limits.test.ts NAME_MAX | :91-96 | :91-96 | 0 | **0** |
| ledger.test.ts treeRecord shapes | :441-456 | :449-463 | 24 | **1** (`-444,2 +452,1`, the stored-mode file record; commit `5a11fc9f`, plan 34-13) |
| ledger.test.ts backupContentRecord | :617-644 | :627-655 | 24 | **1** (`-620,2 +630,3`, the `userModeEdit` mode edit; commit `5a11fc9f`, plan 34-13) |

The five other-family tests are unchanged, as the prediction's body hashes said. The two ledger.test.ts
reds are tests phase 34 changed.

#### HOST-02 decision: NOT MET

HOST-02 needs the windows-latest leg to show no red test that phase 34 added or changed, gap round 1
included. Run 37733716975 shows two: the ledger.test.ts treeRecord and backupContentRecord tests. Plan
34-13 changed both bodies (hunks above), and both are red on a cause outside the five carried tests. The
five tests of 34-VERIFICATION.md gap 1 are green in this run. Each sits in a file printed `✓` with no
failure, outside any `skipIf`, with no skip path in its body. They are the uninstall-removal never-installed
case real and DRY_RUN, the installer-user-edit `.pi/prompts/grugops.md` row, the record-truth
`.pi/prompts/grugops.md` chmod-only row, and the installer-dry-run flow 10 subset case. HOST-02 stays
unchecked in REQUIREMENTS.md, with this run and the two tests named. WINDOWS.md row 316 stays open, and row
317 stays open (two of its earlier reds are still red by name: the ledger.test.ts pair). Both rows carry a
sentence naming this run. Row 319 records the new cause.

### Gap round 2 (D-21): prediction for the deferred run

Written by plan 34-23 Task 2. **There is no windows-latest measurement in gap round 2.** The human will push
and measure at a later date (D-21); no agent ran `git push`, and nothing in this section is a Windows
result. Every "predicted" below is a prediction for that later run, written before it so the run can be
read against it (WIN-3). It is read from source, from the printed logs of runs 37521787426 and
37733716975, and from Node internals read on this macOS host. **HOST-02 is not met**; it stays unchecked in
REQUIREMENTS.md with "Windows measurement deferred by the human (D-21)" as the reason.

**Sources and method.** `gh` was available and authenticated, so the red test names come from the job
logs, read-only: `gh run view --job 112468804112 --log` (run 37521787426) and `gh run view --job
113168427323 --log` (run 37733716975). The literal colour text (`^[[…m`) and the job/step/timestamp
prefix were stripped, each red block was taken from its ` FAIL  <file> > …` line to the next `⎯⎯⎯[n/N]⎯`
separator, and the family rule of 34-18-PLAN.md was applied, first match wins. Reproduced: run
37521787426, 144 blocks, WIN-1 recorded path 91, WIN-1 printed path 5, WIN-2 43, other 5; run
37733716975, 7 blocks, other 5, unmatched 2 (the row 319 pair). Each of the 139 WIN-1 and WIN-2 names was
then located in the current tree with the TypeScript parser: the describe chain and the test title, a
template title read as a pattern. 138 names match exactly one `it(` call. The one that matches none is
marker-binding.test.ts "B2: after the remedy (target set to this directory by hand, …)", which plan 34-12
split into two successor cases, one per spelling. "Changed by round 2" means a hunk of `git diff -U0
9de784e8 HEAD` (9de784e8 is run 37733716975's head; no test file changed between it and 030af957, the
commit that added the round-2 plans) inside the test's `it(` call range, or inside a module-level or
describe-level declaration in the same file that the test names (one level, loop variables excluded).

#### Row 319: cause and fix

- **Cause** (34-18, "The two reds the prediction marked green: a new cause"): the ledger.test.ts fixtures
  linked to the rooted, drive-less literal `/some/where` and expected `linkRecord("/some/where")`.
  `treeRecord` (install/user-file.ts:471) and `backupContentRecord` (install/install-marker.ts:1004)
  record `link:` plus the readlink result. On Windows Node passes an absolute link target through
  `path.toNamespacedPath`, which resolves a drive-less rooted path against the current drive, so the
  leg read back `D:\some\where`.
- **Fix** (34-23 Task 1, commit `cbe97597`): the four fixtures (:465/:466 and :650/:651 for the two red
  tests; :433 and :453 of the `tree` walk fixture) link to an absolute path built with `join` under the
  test's own scratch directory and expect `linkRecord` of that same value. There is no platform branch.
  The target is not built with `canonicalPathSpelling` or `realTargetPath`: their Windows spelling has
  forward slashes, which Node converts on the way into a link, so the readback would differ.
- **Why predicted green.** The printed `D:\some\where` shows both halves of the mechanism on the leg's
  Node v22.23.3: the target was made absolute with a drive, and readlink gave it back without the `\\?\`
  prefix the namespacing adds. A target that is already absolute with a drive (what `join` under the
  scratch directory gives) is unchanged by the first half, so the readback should equal the input byte
  for byte. The `preprocessSymlinkDestination` code itself was read from local Node v24.12.0 only.
- **Class closed** by path-spelling-census.test.ts rule (t6): no installer test links to a rooted,
  drive-less literal, directly or through a local variable, with the link makers and their local
  wrappers derived from the syntax tree. Three pre-existing `/dev/zero` links are classified, and each
  must test `process.platform === "win32"` before it links.

#### Masked-assertion audit: the 139 earlier WIN-1 and WIN-2 reds of run 37521787426

| Class | WIN-1 recorded | WIN-1 printed | WIN-2 | Total | State on run 37733716975 | Reading |
|---|---|---|---|---|---|---|
| (a) green, body unchanged since 9de784e8 | 90 | 5 | 40 | 135 | green, by name | measured: every assertion it reached ran green (unrun-by-design assertions below) |
| (a) renamed: the marker-binding B2 remedy case | 1 | 0 | 0 | 1 | both successor cases green | measured; marker-binding.test.ts is unchanged in round 2 |
| (b) red on run 37733716975 | 0 | 0 | 2 | 2 | red (row 319) | every assertion after the red line predicted in table (b) |
| (c) changed by round 2 | 0 | 0 | 1 | 1 | green | re-predicted below |
| **Total** | **91** | **5** | **43** | **139** | | |

Per file, (a) is: install.test.ts 1 (IN-04 directory), installer-dry-run 5, installer-kit-home 2,
installer-never-installed 4, installer-prune 4, installer-user-edit 60, installer-write-set 1 (`--migrate`
directory), ledger-provenance 1, ledger 6 (3 WIN-1 recorded, 3 WIN-2), marker-binding 4 (+1 renamed),
record-truth 45, uninstall-removal 2.

**(a) assertions unrun by design.** Four of the 135 return after a printed skip, so the assertions after
that return have never run on windows-latest and are not expected to:

- ledger.test.ts "readKitHomeRecord: absent, ok, unbound (another kit home), and unreadable …": the FIFO
  stage skips (`SKIPPED shape="FIFO" position="readKitHomeRecord FIFO"`, printed in run 37733716975) and
  returns before the 2 FIFO assertions (:551-552).
- installer-prune.test.ts IN-03 0600 and IN-03 0664: the capability "POSIX permission bits beyond
  read-only" is absent (both skip lines printed in run 37733716975) and each returns before its 6
  assertions.
- The other skip branches in (a) bodies (install.test.ts IN-04, installer-kit-home damage cases,
  installer-write-set `--migrate`) belong to other shapes (FIFO, symlink to a FIFO); the red shapes
  (directory, bound to another kit home) do not skip, so every assertion of those tests ran.

**(a) at the deferred head.** The "measured" reading is for head 9de784e8. Round 2 changed product code
these tests run: install.ts (the per-member check of both dials, 34-20), user-file.ts and
install-marker.ts (one absoluteness rule, isOwnLink through `sameRecordedPath`, 34-21), and the generator,
model-tiers and freshness gate (34-19). No test-support file changed. Predicted: still green. Reasons:
the per-member check reads the same `model:` / `effort:` lines the run-37733716975 installer already read
from the same texts; the refusal labels are template strings with `/` (install.ts:5058), not host
spellings; `isRecordedAbsolute` is `path.win32.isAbsolute` on Windows, which accepts the `C:/…` spelling
the marker records; and `sameRecordedPath` can only widen what isOwnLink calls equal under win32. Not
measured.

**(b) the two tests red on run 37733716975** (ledger.test.ts, both changed by 34-13 and by this plan):

| Test | Line | Assertion | Predicted | Reason |
|---|---|---|---|---|
| treeRecord shapes (:460-475) | :463 | file record with the stored mode | green | passed in run 37733716975 (the red was the next line) |
| | :466 | `link:` record equals `linkRecord(linkTo)` | green | row 319 fix (above) |
| | :467 | absent gives null | green | `lstatSync` throws, `treeRecord` returns null (user-file.ts:474-477) |
| | :469 | FIFO gives null | not run: prints `SKIPPED shape="FIFO" position="treeRecord of a FIFO"` (the `else` branch, no return) | FIFOs cannot be made at a path on Windows (the FIFO skip lines of run 37733716975) |
| | :474 | a walk past TREE_MAX_ENTRIES gives null | green, duration unmeasured | 20,001 files; the walk answers false at entry 20,001 (user-file.ts:503). The read runs in a child with a 15 s bound (ledger.test.ts:404) inside the 180 s test bound; how long 20,001 `lstat` calls take on the leg's NTFS volume is `UNKNOWN - verify`, and a child that runs past 15 s turns this red with "treeRecord did not finish" |
| backupContentRecord (:639-668) | :644, :647, :648 | file record after `userModeEdit`; tree record | green | passed in run 37733716975 |
| | :651 | `link:` record equals `linkRecord(linkTo)` | green | row 319 fix (above) |
| | :655 | a hard link gives null | green, or not asserted | `spawnSync("ln", …)` needs an `ln` on the PATH of the leg's pwsh step: `UNKNOWN - verify`. Without one `h2` is never made and the `if` skips the assertion silently (nothing printed). With one, libuv reports the link count and `readOwnedContent` (install-marker.ts:501) refuses a file with more than one name (user-file.ts:219), so null |
| | :656 | absent gives null | green | `kindAt` finds nothing, null |
| | :659 | a link on the way gives null | green | the `via` link points at an existing directory under the scratch directory (link creation works on the leg: these tests reached their link lines in run 37733716975); `wayTo` blocks at a link component, null |
| | :660-667 | FIFO gives null | not run: prints `SKIPPED shape="FIFO" position="backupContentRecord FIFO"` and returns | as :469 |

**(c) the one test round 2 changed** (green on run 37733716975): ledger.test.ts "treeRecord walks with
lstat: …" (:438-458). Both link targets of the `tree` fixture are now host-built absolute paths that
differ by name. Predicted green: each record is compared only with another record taken on the same
host, so the link target change still moves it. The FIFO assertion :444 is not run (the
`SKIPPED shape="FIFO" position="treeRecord FIFO inside a tree"` line printed in run 37733716975).

**The five other-family reds**, carried, are still masked behind their first failure and are not
predicted beyond "red where they failed before": install.test.ts "readUserFile: an absent path is
`absent`; …" and "W1: when the incomplete copy cannot be removed either, …"; installer-write-set.test.ts
"readUserFile: a path under a regular file is `unreadable` (ENOTDIR), never `absent`"; kit-plan-limits.test.ts
"a full path of PATH_MAX - 1 bytes …" and "a component of NAME_MAX bytes …". Round 2 changed none of
them (no hunk in their bodies; installer-write-set and kit-plan-limits files are unchanged).

#### Every test round 2 added or changed, predicted

`git diff -U0 030af957 HEAD` over test files, intersected with each test's syntax-tree range and one level
of same-file helpers as above: 51 test calls, 132 test instances (instances counted with `npx vitest list
--json`, which collects names and runs nothing). Two calls the name lookup also flagged are left out after
reading them: canonical-path.test.ts "(11) …" and the printed-rel table rows name a `scratch` and a `rel`
declared in another describe, and their own bodies and describes are unchanged. No round-2 test adds a
`skipIf`, `.skip` or `.todo`.

Reason keys: **P1** pure: parses source or calls `path.win32` / `path.posix` functions, as the census and
table tests that were green on run 37733716975 do. **P2** synthetic install: runs install.js through the
`patchSyntheticGenerator` / `patchSyntheticTwin` harness under scratch directories with their own
`GRUGOPS_HOME`; that harness's earlier rows (effort rows (a)-(e), the model delivery rows) were green on
run 37733716975 (install.test.ts printed only the two other-family reds); the patches use function
replacements, the anchors are read out of LF-pinned `.ts` sources (`.gitattributes`), and the refusal
sentences name `.claude/agents/<file>` through a template with `/`. **P3** mirror: runs the generator or
the freshness gate in a mirrored tree; no scripts/ file was red on run 37733716975; source edits apply to
LF-pinned text. **P4** host links: stages links with `stageSymlinkOrSkip`; link creation works on the leg
(run 37733716975), so the cases are predicted to run, not skip; a host-built absolute target reads back
unchanged under the row 319 reading, and a relative target that Node respells with `\` is expected false
either way. **P5** capability skip: asks "POSIX permission bits beyond read-only", which read absent on the
leg in run 37733716975, then prints `SKIPPED … position="install/record-truth.test.ts: L1 pointer <rel>"`
and returns, so it counts as passed with nothing asserted (WINDOWS.md row 321). **P6** row 319 fix and
the (b)/(c) readings above. **P7** derived from the base install's marker; the base install ran on the leg
in run 37733716975 (all 72 record-truth tests passed).

| Test call | Title (template as written) | Plan | Changed in | Instances | Predicted on windows-latest | Reason |
|---|---|---|---|---|---|---|
| `install/canonical-path.test.ts:212` | the absoluteness table has its full size | 34-21 | body | 1 | green | P1 |
| `install/canonical-path.test.ts:217` | ${row.name}: ${JSON.stringify(row.p)} is ${row.absolute ? "absolute" : "not absolute"} | 34-21 | body | 15 | green | P1 |
| `install/canonical-path.test.ts:228` | posix: the valid marker has no problem (the control) | 34-21 | body | 1 | green | P1 |
| `install/canonical-path.test.ts:232` | posix: a target spelled `C:/x` is not an absolute path there | 34-21 | body | 1 | green | P1 |
| `install/canonical-path.test.ts:236` | win32: a target in native UNC spelling, with grugopsHome and kitRoot in `C:/` spelling, has no pr... | 34-21 | body | 1 | green | P1 |
| `install/canonical-path.test.ts:240` | win32: a drive-relative target is still refused, and a padded or empty kitRoot is still not insta... | 34-21 | body | 1 | green | P1 |
| `install/canonical-path.test.ts:270` | true for the link to its recorded source (the host flavor) | 34-21 | body | 1 | green (runs, not skipped) | P4 |
| `install/canonical-path.test.ts:275` | true under path.win32 when the source is asked in backslash spelling (path.win32.normalize of it) | 34-21 | body | 1 | green (runs, not skipped) | P4 |
| `install/canonical-path.test.ts:281` | false for another directory's path, under both flavors | 34-21 | body | 1 | green (runs, not skipped) | P4 |
| `install/canonical-path.test.ts:288` | false for a link whose target is relative, under both flavors | 34-21 | body | 1 | green (runs, not skipped) | P4 |
| `install/canonical-path.test.ts:295` | false for a regular file and for an absent path | 34-21 | body | 1 | green (runs, not skipped) | P4 |
| `install/install.test.ts:2317` | model delivery: a ZERO-CONFIG run relays the generator's own announcement and states that no conf... | 34-19 | body | 1 | green | P2 |
| `install/install.test.ts:2359` | model delivery: a TIERED run names the configuration file it read and carries the generator's ass... | 34-19 | body | 1 | green | P2 |
| `install/install.test.ts:2918` | model delivery: an announced member count that disagrees with the rendered listing installs NOTHI... | 34-19 | body | 1 | green | P2 |
| `install/install.test.ts:2944` | model delivery: a rendered adapter carrying two `model:` lines installs NOTHING and names the file | 34-19, 34-20 (helper) | helper `patchSyntheticGenerator` | 1 | green | P2 |
| `install/install.test.ts:2977` | model delivery: a rendered adapter carrying NO kit slot line installs NOTHING and names the file ... | 34-19, 34-20 (helper) | helper `patchSyntheticGenerator` | 1 | green | P2 |
| `install/install.test.ts:3148` | model delivery: a rendered adapter carrying ZERO or TWO recognised banner lines installs NOTHING ... | 34-19, 34-20 (helper) | helper `patchSyntheticGenerator` | 1 | green | P2 |
| `install/install.test.ts:3198` | model delivery: an announced alias that disagrees with every rendered adapter installs NOTHING an... | 34-19, 34-20 | body | 1 | green | P2 |
| `install/install.test.ts:3231` | effort delivery: an announced effort level that disagrees with every rendered adapter installs NO... | 34-19, 34-20 | body | 1 | green | P2 |
| `install/install.test.ts:3373` | effort delivery: ${row.why} installs NOTHING and names the refusal | 34-20 | body | 6 | green | P2 |
| `install/install.test.ts:3629` | model and effort delivery: ${row.why} installs NOTHING and names the refusal | 34-20 | body | 11 | green | P2 |
| `install/ledger.test.ts:438` | treeRecord walks with lstat: a FIFO inside is recorded `other` and never opened, a link is never ... | 34-23 | body | 1 | green; the FIFO assertion :444 not run (printed skip) | P6 |
| `install/ledger.test.ts:460` | treeRecord gives a file its file record, a link its link record, and null for a FIFO, nothing, or... | 34-23 | body | 1 | green, with the per-assertion detail in table (b) | P6 |
| `install/ledger.test.ts:494` | owns(backup): owned only while the tree still holds its record; a null record is never owned | 34-23 | helper `tree` | 1 | green | P6 |
| `install/ledger.test.ts:639` | backupContentRecord: a file's bytes and mode, a tree, a link; null for a hard link, a FIFO, nothi... | 34-23 | body | 1 | green, with the per-assertion detail in table (b) | P6 |
| `install/mode-census.test.ts:256` | every tag names a kind from the closed set, and the per-kind counts are the ones measured | 34-22 | helper `TAG_KIND_COUNTS` | 1 | green | P1 |
| `install/path-spelling-census.test.ts:369` | (e) every derived comparison of a recorded path lies in a spelling function, is spelled on every ... | 34-21 | body | 1 | green | P1 |
| `install/path-spelling-census.test.ts:399` | (f) every derived absoluteness decision lies in canonicalPathSpelling or isRecordedAbsolute, or i... | 34-21 | body | 1 | green | P1 |
| `install/path-spelling-census.test.ts:430` | (f) no spelling function reads process.platform; the one platform read is user-file.ts PATH_MAX_B... | 34-21 | helper `SPELLING_FUNCTIONS` | 1 | green | P1 |
| `install/path-spelling-census.test.ts:678` | (t6) no test links to a rooted, drive-less literal target: every link target is built by the host... | 34-23 | body | 1 | green | P1 |
| `install/record-truth.test.ts:376` | the pointer files install created are taken from the marker (a block entry and a file entry at on... | 34-22 | body | 1 | green | P7 |
| `install/record-truth.test.ts:388` | ${rel} (a pointer file install created): a writable chmod-only edit reaches the recorded-mode com... | 34-22 | body | 2 | prints SKIPPED and returns (passed, nothing asserted) | P5 |
| `scripts/adapters-freshness.test.ts:559` | Case 13 (RED): a mirrored run whose announced member count disagrees with the derived adapter cou... | 34-19 | helper `shortenAnnouncedMemberCount` | 1 | green | P3 |
| `scripts/adapters-freshness.test.ts:852` | Case 22 (i) ${a.dial}: an announced map with ONE adapter renamed is refused, naming both key sets | 34-19 | body | 2 | green | P3 |
| `scripts/adapters-freshness.test.ts:884` | Case 23 (ii) ${a.dial}: a map value other than zero-config while the list stays zero-config is re... | 34-19 | body | 2 | green | P3 |
| `scripts/adapters-freshness.test.ts:911` | Case 24 (iii) ${a.dial}: an announced map one SHORT of the adapters written is refused by the cou... | 34-19 | body | 2 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1485` | a per-role OVERRIDE announces preset none AND an override count of 1 with two distinct aliases | 34-19 | body | 1 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1526` | TWO per-role OVERRIDES with NO preset key: the preset line says `none` and the assignment line sa... | 34-19 | body | 1 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1559` | ZERO-CONFIG: the assignment line announces the whole corpus, 0 overrides and only `inherit` | 34-19 | body | 1 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1738` | ZERO-CONFIG: announces effort preset `none` and an assignment over every mirrored role with 0 ove... | 34-19 | body | 1 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1795` | CONFIGURED effort (tiered plus one override): the effort announcement states each written adapter... | 34-19 | body | 1 | green | P3 |
| `scripts/generate-role-adapters.test.ts:1819` | CONFIGURED model and effort (both tiered): each byAdapter's keys are exactly the written adapter ... | 34-19 | body | 1 | green | P3 |
| `scripts/model-tiers.test.ts:1101` | resolvedAssignmentLine and resolvedAssignmentsIn are inverse over the zero-config resolution | 34-19 | body | 1 | green | P1 |
| `scripts/model-tiers.test.ts:1124` | the announced alias set is DISTINCT and SORTED, and the override count travels unmodified | 34-19 | body | 1 | green | P1 |
| `scripts/model-tiers.test.ts:1174` | resolvedAssignmentsIn REFUSES an announced alias outside the closed set | 34-19 | body | 1 | green | P1 |
| `scripts/model-tiers.test.ts:1468` | PREMISE: both dials are under test, every rule has a row, and each dial has at least three legal ... | 34-19 | body | 1 | green | P1 |
| `scripts/model-tiers.test.ts:1477` | ${d.dial}: the emitter's own line reads back, byAdapter included, and the base payload is the one... | 34-19 | body | 2 | green | P1 |
| `scripts/model-tiers.test.ts:1492` | ${d.dial}: rule ${row.rule} is REFUSED by name, quoting the payload | 34-19 | body | 48 | green | P1 |
| `scripts/model-tiers.test.ts:1669` | every member of MODELS_KEYS is CONSUMED by the reader, not merely permitted | 34-19 | helper `withKey` | 1 | green | P1 |
| `scripts/model-tiers.test.ts:2295` | the quoting operation has ONE spelling in the module that ships as well as the one that compiles | 34-19 | body | 1 | green | P1 |
| `scripts/model-tiers.test.ts:2592` | every member of EFFORT_KEYS is CONSUMED by the reader, not merely permitted | 34-19 | helper `withKey` | 1 | green | P1 |

By plan: 34-19 alone 22 calls (the 19 scripts tests and three install.test.ts announcement pins); 34-19 and
34-20 together 5 (the two converted set rows, and three tests whose helper `patchSyntheticGenerator` both
changed); 34-20 alone 2 (the effort refusal rows, now 6, and the 11 member refusal rows); 34-21 14; 34-22 3;
34-23 5 (the four ledger.test.ts tests and census rule (t6)). Total 51.

#### Predicted printed totals

- `Test Files  3 failed | 100 passed (103)`: install.test.ts, installer-write-set.test.ts and
  kit-plan-limits.test.ts, the files of the five carried other-family reds. Round 2 added no test file
  (103 local files, as on run 37733716975).
- `Tests  5 failed | 7505 passed | 28 skipped (7538)`: the five carried other-family reds, if every test is
  defined the same way on both hosts (the run-37733716975 total equalled the local total then, 7437). The
  local total on the tree this plan leaves is 7538 (vitest on macOS, e2e lane excluded; 101 more than 7437). The vitest skip count stays 28: round 2 adds no
  vitest skip; its Windows skips print a line and return, and vitest counts those as passed.
- Not predicted: the counts of the e2e lane (excluded) and of any test that the human's later commits
  add.

#### `UNKNOWN - verify` before the run

- **Node v22.23.3's symlink and readlink internals.** `preprocessSymlinkDestination` was read from local
  Node v24.12.0 only. The printed `D:\some\where` on the leg fits the reading; the leg's own copy was
  not read.
- **`ln` on the runner.** Whether the pwsh "Vitest" step's PATH has an `ln` decides whether the
  backupContentRecord hard-link assertion (ledger.test.ts:655) runs at all; without it the case passes
  silently with that assertion unasked.
- **The 20,001-file walk** (ledger.test.ts:474) has never run on the leg; its 15 s child bound against
  NTFS file creation and `lstat` speed is unmeasured.
- **The product reach of isOwnLink on Windows.** isOwnLink now compares through `sameRecordedPath` (34-21),
  but the installer's own link cases (uninstall-removal.test.ts, `describe.skipIf(!canSymlink)` with
  `canSymlink = process.platform !== "win32"`) do not run on win32, so no windows-latest run reads back a
  link the installer made. WINDOWS.md row 319 stays open for this.
- **The 34-21 isOwnLink host cases** (WINDOWS.md row 320): predicted to run and pass, because link
  creation works on the leg; whether they run or print their skip there is not measured.
- **The 34-22 pointer-file rows' Windows gap** (WINDOWS.md row 321): predicted to print their skip, so
  uninstall's pointer-file mode comparison is not reached end to end on Windows; a Windows case needs a
  writable mode change Windows stores.
- **The (a) class at the deferred head**: measured green at 9de784e8, predicted green after round 2's
  product changes (reasons above), not measured.

#### Local chain on the final round-2 tree (macOS, not a Windows result)

Run by plan 34-24 on 2026-10-09 on local HEAD `5be7b8918aa41860c823fe382f387072403aef7c` (plan 34-24's
second commit; the last product or test change of gap round 2 is `cbe97597`), working tree clean apart
from three untracked `.planning/research/.cache/*.json` files, local Node v26.11.0, under a short fresh
TMPDIR (`/tmp/g34.XXXX`, removed afterwards). The steps are those of 34-24-PLAN.md Task 2 `<verify>`, in
that order. Run as one `&&` chain, it **exits 1 at the vitest step**. Vitest printed
`Test Files  1 failed | 102 passed (103)` and `Tests  1 failed | 7535 passed | 2 skipped (7538)`,
duration 1431.67 s. The one red is `install/installer-fs-census.test.ts` "every node:fs export whose name may mark a content read is
classified ...", `UNCLASSIFIED node:fs export openAsBlobSync`. This is the local runtime, not the tree:
Node v26.11.0's `node:fs` exports `openAsBlobSync`. The same file run alone under Node v24.12.0, where
`typeof fs.openAsBlobSync` is `undefined`, printed `Tests  24 passed (24)`. CI pins `node-version: 22`
(`.github/workflows/ci.yml:52`), and no Node 22 run was made here (deferred-items.md, "Out of scope,
found during 34-19"). The steps after vitest were then run separately, in order, on the same head: the
seven freshness gates, `generate:adapters` followed by an empty `git status --porcelain -- .claude/agents/`,
foundation guards, kit refs, public-docs vocabulary, audit register, claim anchors, banned claims,
imperative lexicon and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`. Each exited 0. The
steps before vitest (build, build parity, typecheck, `check-platform-shapes.js`) exited 0. The local test
total, 7538, equals the total predicted above. `npm test` and the e2e lane were not run. This is a macOS
result, it says nothing about windows-latest, and HOST-02 stays unchecked (D-21).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (27 of 28; 34-10 Task 3 is manual by design)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter (left false: see the count above)

**Approval:** pending
