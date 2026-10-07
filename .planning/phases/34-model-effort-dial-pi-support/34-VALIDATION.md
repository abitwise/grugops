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
| No test added/changed by this phase is red on windows-latest | HOST-02 (D-09) | The push is the human's act | Human pushes; record `test (windows-latest)` conclusion and any red file against WINDOWS.md rows 274/315 | ❌ NOT MET. Run 37521787426, head `dc2c7581d4710aed1e288bcab01872a71b38d3e6` (equals the pushed `main` HEAD and local HEAD). `test (ubuntu-latest)` success; `test (windows-latest)` failure at step "Vitest (e2e lane excluded)": 13 files / 144 tests red. 5 red tests were added or changed by this phase (class b). See "Windows-latest measurement" below. |

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

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (27 of 28; 34-10 Task 3 is manual by design)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter (left false: see the count above)

**Approval:** pending
