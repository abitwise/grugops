---
phase: 37-overview-board-per-file-records-and-budgets
plan: 19
subsystem: state
tags: [own-state, layout-marker, fail-mode, state-check, ci, phase-gate, split-04, split-05, split-01, split-02, split-06]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "37-01 LAYOUT_MARKER_REL/LAYOUT_MARKER_CONTENT and BUDGETS; 37-02 the validator's marker-driven budget severity; 37-03 the state-check runnable; 37-10/37-11 state-roll; 37-12 the Done archive source; 37-13 the v3 seed forms and the seed marker; 37-18 the kit docs on the rendered trace"
provides:
  - "grugops's own memory-bank/plans/board.md, nfr-catalog.md and memory-bank/60-progress.md in the v3 seed forms; memory-bank/plans/nfr/ and archive/ keepers"
  - "grugops's own layout marker at LAYOUT_MARKER_REL (memory-bank/plans/.layout), so the validator and state-check run on the own tree in FAIL mode"
  - "A FAIL-mode control on a copy of the own state (exit 1 with the marker, exit 0 with a WARNING without it)"
  - "ci.yml runs node scripts/runnable-ref/state-check.js . in the ubuntu gate block, asserted by scripts/runnable-ref/state-check.test.ts"
  - "The phase-37 final full regression (run 3 of 3) and the gate record"
affects: [38]

actuals:
  tokens: 3611
  tasks: 2
  commits: 5
plan_head_before: 9e1ef99995a7d7f1726065ddb13b022c5d1f3322
plan_head_after: 92998d61f07e2e4fc25119eedb145c732603e2e1

tech-stack:
  added: []
  patterns:
    - "A FAIL-mode claim is proven on a copy of the real tree, not only on a planted fixture"
    - "A test that reads the CI ubuntu block imports scripts/ci-workflow.testkit.ts instead of carrying its own step-name locator"

key-files:
  created:
    - memory-bank/plans/.layout
    - memory-bank/plans/nfr/.gitkeep
    - memory-bank/plans/archive/.gitkeep
  modified:
    - memory-bank/plans/board.md
    - memory-bank/plans/nfr-catalog.md
    - memory-bank/60-progress.md
    - scripts/validate.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - .github/workflows/ci.yml
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "D-14 recorded option a, so the own marker sits at the planned path memory-bank/plans/.layout (= LAYOUT_MARKER_REL); no re-point was needed. It is byte-identical to the seed marker (layout: v3, no line ending)"
  - "The own state migration moved no state: the own board held 0 ticket rows, the NFR catalog 0 NFR rows, the progress file 0 entries under its three empty headings. Only template comment text, an empty table header and separator, and three empty headings were replaced. state-roll --dry-run confirmed nothing to roll before and after"
  - "The own-tree CI case in state-check.test.ts runs the committed checker copied alone (HOST_JS), to keep that file's host-emulation claim true, and reads the ubuntu block through ci-workflow.testkit.ts"
  - "check-diff-disposition stays red at 707 findings, unchanged by this plan (none of its files is watched); the decision on 707 disposition rows or the base stays with a human, as the CI comment requires"

patterns-established:
  - "Census pins moved during phase 37 are listed with their start and final values in this SUMMARY"

requirements-completed: [SPLIT-04, SPLIT-05, SPLIT-01, SPLIT-02, SPLIT-06]

coverage:
  - id: D1
    description: "grugops's own board, NFR catalog and progress file are in the v3 seed forms; memory-bank/plans/nfr/ and archive/ exist; nothing of state was lost"
    requirement: SPLIT-01
    verification:
      - kind: other
        ref: "cmp memory-bank/plans/{board,nfr-catalog}.md memory-bank/60-progress.md against agent-factory/seed/ (byte-identical); grep '^- \\[' board 0 rows before; grep '^| *NFR-' catalog 0 rows before; state-roll --dry-run: nothing would move"
        status: pass
    human_judgment: false
  - id: D2
    description: "The own marker is at LAYOUT_MARKER_REL with LAYOUT_MARKER_CONTENT, placed only after state-check reported no finding; state-check --json reports marker valid, enforced, 0 findings; validator exits 0 bare and --strict"
    requirement: SPLIT-04
    verification:
      - kind: other
        ref: "git ls-files memory-bank/plans/.layout; node scripts/runnable-ref/state-check.js . --json (marker valid, enforced true, findings []); VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js [--strict] exit 0"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#grugops's own tree (%s): exit 0, no budget line, no marker line and no LAYOUT line"
        status: pass
    human_judgment: false
  - id: D3
    description: "FAIL mode is not vacuous: a copy of the own state with the board at BUDGETS.boardBytes + 1 makes the validator exit 1 with an ERROR naming BUDGETS.boardBytes; without the marker it exits 0 with a WARNING"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#a copy of the own state with the board grown past BUDGETS.boardBytes: exit 1 and an ERROR naming BUDGETS.boardBytes"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#the same grown copy with the own marker removed: exit 0 and a WARNING for the same finding"
        status: pass
    human_judgment: false
  - id: D4
    description: "CI runs the shipped state-check against the own tree inside the ubuntu gate block, right before the validator, and a test asserts it"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/state-check.test.ts#the ubuntu gate block runs the checker against the own tree once, right before the validator line"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#the committed checker on the own tree: marker valid, enforced, no finding, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "A live CI run of the host workflow, and a scratch host install running trace-render and state-check by hand"
    requirement: SPLIT-05
    verification: []
    human_judgment: true
    rationale: "Needs a real host repository and a live CI run on a host remote (37-VALIDATION.md manual-only row for SPLIT-05); the executor never pushes or triggers CI"
  - id: D6
    description: "Phase gate: the full non-e2e suite shows only the 20 baseline failures; every freshness and repo gate in the plan exits 0"
    verification:
      - kind: other
        ref: "npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1 --shard=N/6, N=1..6, sequential foreground"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 19: grugops's own state on the v3 forms, its layout marker, and FAIL mode proven in CI Summary

**grugops's own board, NFR catalog and progress file now carry the v3 seed text, and the repository has its own layout marker at `memory-bank/plans/.layout`. The validator and the shipped `state-check.js` therefore treat the own tree as migrated: a budget break there is an error, not a warning. CI runs `node scripts/runnable-ref/state-check.js .` in the ubuntu gate block. A test copies the own `memory-bank/`, grows the board one byte past `BUDGETS.boardBytes`, and requires the validator to exit 1. The phase ends with only the 20 baseline failures, and every gate in the plan exits 0.**

## Performance

- **Duration:** about 47 min, about 34 min of it the six-shard full run
- **Started:** 2026-10-22T19:07:55Z
- **Completed:** 2026-10-22T19:55:02Z
- **Tasks:** 2 (Task 1 the tracer; Task 2 the phase gate), plus one follow-up test commit
- **Files modified:** 9 in code commits (3 created, 6 modified), plus deferred-items.md and this file

## Accomplishments

- **Own state on the v3 forms (Task 1 step 1, SPLIT-01, SPLIT-02, SPLIT-06):** `memory-bank/plans/board.md`, `nfr-catalog.md` and `memory-bank/60-progress.md` are now byte-identical to the seed files plan 37-13 wrote. `memory-bank/plans/nfr/.gitkeep` and `archive/.gitkeep` exist. `traceability.md` was already the render (plan 37-08).
- **Own marker (Task 1 step 2, D-06, D-11):** before the marker, `state-check.js .` printed no WARN and `No findings.`, and exited 0. The marker was then written at `LAYOUT_MARKER_REL` with `LAYOUT_MARKER_CONTENT` exactly. Afterwards `state-check --json` reports `marker: "valid"`, `enforced: true` and `findings: []`. The validator exits 0 bare and under `--strict`. No budget was loosened and no exemption added.
- **FAIL-mode control (Task 1 step 3, T-37-26):** three cases in `scripts/validate.test.ts`:
  - a PREMISE case: the own marker reads `LAYOUT_MARKER_CONTENT` and the own board is within budget;
  - a copy of the own `memory-bank/` with the board at 24,577 bytes: exit 1, one ERROR naming `BUDGETS.boardBytes`, no budget WARNING, no LAYOUT line;
  - the same copy with the marker removed: exit 0, one WARNING for the same finding, one LAYOUT line.
  Removing the own marker turns the PREMISE case and the FAIL case red (checked by hand, then restored).
- **CI wiring (Task 1 step 4, SPLIT-05):** `.github/workflows/ci.yml` runs `node scripts/runnable-ref/state-check.js .` inside the existing ubuntu gate run block, right before `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, with a two-line comment. No new step was added, and no step follows the block. `scripts/runnable-ref/state-check.test.ts` asserts the line is in the block once and right before the validator line. It reads the block through `scripts/ci-workflow.testkit.ts`. It also runs the committed checker, copied alone, against the own tree: exit 0, marker valid, enforced, no finding.

## Own-state migration record (nothing lost)

| File | Before (lines / bytes) | After (lines / bytes) | State lines that left | Where they went |
|------|------------------------|-----------------------|-----------------------|-----------------|
| memory-bank/plans/board.md | 129 / 5,934 | 147 / 7,154 | 0 ticket rows (`grep '^- \['` matched nothing) | nowhere needed; `state-roll --dry-run`: 0 Done rows, nothing to roll |
| memory-bank/plans/nfr-catalog.md | 25 / 1,147 | 28 / 1,392 | 0 NFR rows (`grep '^\| *NFR-'` matched nothing) | nowhere needed; `memory-bank/plans/nfr/` holds only its keeper |
| memory-bank/60-progress.md | 16 / 429 | 20 / 766 | 0 entries (the three headings `## What works`, `## What's left`, `## Known issues` had no text under them) | nowhere needed; `state-roll --dry-run`: 429 bytes, within 16,384 |

The lines that left each file were template text only:
- the board: the old ROWS example with its `— in flight` trailer, the trailer sentence, the Blocked-policy bullet and the old Ready-for-Dev entry wording;
- the catalog: the old FORMAT comment and the empty table header and separator;
- the progress file: the old FORMAT comment and the three empty headings.

The seed text replaces each one. No line carried project state, so nothing had to move to an archive. The own trace render reports `0 task(s) and 0 note(s) read`, and nothing was skipped. It produces the zero-row index, which is what `traceability.md` already held, and `trace-render --check` exits 0. No refs were invented.

## Task Commits

1. **Task 1 step 1: own state takes the v3 seed forms** - `5b64187c` (chore)
2. **Task 1 step 2: own layout marker (D-06)** - `9cffa7ab` (chore)
3. **Task 1 step 3: FAIL mode proven on a copy of the own state** - `a4c46f91` (test)
4. **Task 1 step 4: CI runs state-check on the own tree, with its test** - `17c666f4` (chore)
5. **Task 2 follow-up: the own-tree CI case reads the block through the ci-workflow authority** - `92998d61` (test)

**Plan metadata:** recorded in the docs(37-19) commit that adds this file.

**Tracer gate:** auto mode is off, the mode is `end-of-phase`, and the tracer's `<verify>` is automated only. So the gate re-ran verify instead of stopping:
- build, typecheck, and `validate.test.ts`, `state-check.test.ts` and `check-foundation-guards.test.ts`: 592/592 passed;
- `state-check --json` followed by `validate --strict`: exit 0.

Task 2 went ahead with no checkpoint.

## Full-suite run (phase run 3 of 3) against 37-BASELINE.md

- **Command:** `npx vitest run --exclude '**/scripts/e2e/**' --maxWorkers=1 --shard=N/6`, for N = 1 to 6. Each shard was a foreground call, run one after another, one vitest process at a time, at HEAD `17c666f4` with no uncommitted product change.

| Shard | Files | Tests | Failed | Passed | Skipped | Duration |
|-------|-------|-------|--------|--------|---------|----------|
| 1/6 | 21 | 1,751 | 0 | 1,751 | 0 | 426 s |
| 2/6 | 21 | 1,874 | 1 | 1,872 | 1 | 504 s |
| 3/6 | 21 | 800 | 5 | 795 | 0 | 284 s |
| 4/6 | 21 | 2,148 | 8 | 2,139 | 1 | 461 s |
| 5/6 | 21 | 1,030 | 4 | 1,026 | 0 | 96 s |
| 6/6 | 20 | 1,538 | 2 | 1,536 | 0 | 211 s |
| **all** | **125** | **9,141** | **20** | **9,119** | **2** | |

- **Failures outside the baseline:** none.
- **Baseline failures still failing (all 20):**
  - install/installer-fs-census 1 (the Node 26 `openAsBlobSync` row);
  - scripts/canonical-corpus 1;
  - context-io-writer-set 2;
  - context-io 7;
  - harness-instance-ledger 4;
  - uat-gate-exit-contract 5.
  Each matches 37-BASELINE.md by name.
- **Baseline failures that now pass:** none.
- **File changed after its shard:** `scripts/runnable-ref/state-check.test.ts` (commit `92998d61`, which changes only its reader to the authority). It was re-run whole: 84/84. `scripts/check-foundation-guards.test.ts` was also re-run whole after that change: 320/320.

## Gate record (final tree, HEAD `92998d61`)

| Gate | Exit |
|------|------|
| `npm run build` | 0 |
| `npm run typecheck` | 0 |
| `npm run freshness` | 0 |
| `npm run freshness:traceability` | 0 |
| `node scripts/runnable-embeds-freshness.js` | 0 |
| `npm run freshness:hook-manifest` | 0 |
| `npm run freshness:adapters` | 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:skill-twins` | 0 |
| `npm run freshness:host-entries` | 0 |
| `node scripts/check-state-paths.js` | 0 |
| `node scripts/check-foundation-guards.js` | 0 |
| `node scripts/check-nul-bytes.js` | 0 |
| `node scripts/check-imperative-lexicon.js` | 0 |
| `node scripts/check-banned-claims.js` | 0 |
| `node scripts/check-claim-anchors.js` | 0 |
| `node scripts/check-kit-refs.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` | 0 |
| `node scripts/runnable-ref/state-check.js .` | 0 |
| `node scripts/runnable-ref/trace-render.js . --check` | 0 |
| `node scripts/runnable-ref/state-roll.js . --dry-run` | 0 |

**The rest of the ci.yml gate list, run offline:**

| Gate | Exit | Note |
|------|------|------|
| `node scripts/check-build-parity.js` | 0 | |
| `node scripts/check-platform-shapes.js` | 0 | |
| `npm run freshness:context` | 0 | |
| `npm run freshness:guarantees` | 0 | |
| `npm run freshness:runnable-embeds` | 0 | |
| `npm run generate:adapters`, then `git status --porcelain -- .claude/agents/` | 0, empty | |
| `node scripts/check-public-docs-vocabulary.js` | 0 | |
| `node scripts/check-audit-register.js` | 0 | |
| `node scripts/check-residual-citations.js` | 0 | |
| `node scripts/check-diff-disposition.js` | **1** | Pre-existing, logged in deferred-items.md: 707 findings over 40 elements, the same count as at the end of 37-18. None of this plan's files is in its watched corpus, so the count was 707 before and after. The base and the corpus were not touched. |
| `node scripts/check-flip-manifest.js` | **1** | Pre-existing, logged in phase 36's deferred-items.md: the manifest path `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` left `.planning/phases/` when v2.1 was archived. It is not caused by this plan. |

The `npx vitest run` step is the full run above.

## Census pins moved in phase 37 (start at `33177831^`, final at `92998d61`)

| Pin | File | Start | Final |
|-----|------|-------|-------|
| NON_TEST_MODULE_COUNT | scripts/check-foundation-guards.test.ts | 101 | 108 |
| TRIPWIRE_MODULES | scripts/check-foundation-guards.test.ts | 75 | 79 |
| UBUNTU_BLOCK_READER_COUNT | scripts/check-foundation-guards.test.ts | 4 | 6 |
| SCRIPTS_TEST_FILE_COUNT | install/mode-census.test.ts | 75 | 79 |
| EMBED_SPEC_COUNT | scripts/generate-runnable-embeds.ts | (new in 37-03) | 3 |
| WALKER_PRODUCTION_IMPORTER_COUNT | scripts/board-readonly.test.ts | 6 | 5 |
| SOURCE_COUNT | scripts/board-read.ts | 6 | 7 |
| WATCH_DIR_COUNT | scripts/board-dashboard.ts | 6 | 7 |
| PUBLISHED_SUBSTITUTION_COUNT | scripts/board-model.test.ts | 91 | 93 |
| SCHEMA_VERSION | scripts/board-model.ts | 2 | 3 |
| GENERATED_EXEMPT_COUNT | scripts/check-imperative-lexicon.ts | 1 | 2 |
| GOVERNED_CORPUS_COUNT | scripts/check-imperative-lexicon.ts | 49 | 48 |
| BUDGET_COUNT | install/state-layout.ts | (new in 37-01) | 9 |
| REMOVABLE_COUNT | install/record-truth.test.ts | 41 | 44 |
| RUNNABLE_PATH_COUNT | install/uninstall-removal.test.ts | 4 | 7 |
| WRITE_PATH_COUNT | install/installer-never-installed.test.ts | 104 | 114 |
| RECORDED_FILE_COUNT | install/installer-cross-version.test.ts | 39 | 42 |
| INSTALLED_FILE_COUNT | install/installer-user-edit.test.ts | 67 | 74 |
| READ_PATH_COUNT | install/installer-special-files.test.ts | 69 | 76 |

This plan moved no pin. The two test files it changed already existed. `scripts/runnable-ref/state-check.test.ts` sits outside the top-level `scripts/*.test.ts` listing that UBUNTU_BLOCK_READER_COUNT is cut from, so that pin stays 6. That census-scope gap is logged in deferred-items.md.

## Requirements evidence

- **SPLIT-01** (overview board): the own board is the seed overview form, with 0 rows and one `_Updated:` line. `state-check` reports no board finding with the marker valid. The contract and seed came from plans 37-12 and 37-13.
- **SPLIT-02** (one file per NFR, index catalog): the own catalog is the index form with no table, and `memory-bank/plans/nfr/` exists. `state-check`'s two-way index check reports no finding.
- **SPLIT-04** (budgets WARN unmigrated, FAIL migrated): the own tree is marked, the validator exits 0 bare and `--strict`, and CI runs it. The copy-of-own-state cases prove exit 1 with the marker and exit 0 with a WARNING without it.
- **SPLIT-05** (host state-check runnable called from the PR gate and daily-sweep): the runnable ships in `tools/grugops/` (37-13), and workflows 05 and 09 name it (37-14 to 37-17). CI now runs it on the own tree, and a test asserts the line. The live host CI run is the pending human item below.
- **SPLIT-06** (progress rolls, move-only folders): the own progress file is the dated-entry form, and `archive/` exists. `state-roll --dry-run` exits 0. `state-check` reports the MOVE-ONLY counts: `.grugops/queue/done` 0 live and 0 archived, `memory-bank/50-decisions` 1 live and 0 archived.

## Decisions Made

See `key-decisions` in the frontmatter. The marker path is the planned one. No state moved because the own state held none. The CI case runs the alone-copied checker and reads the block through the authority. The 707 diff-disposition findings stay with a human.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The own-tree CI case first spelled its own copy of the ubuntu step name**
- **Found during:** Task 2, while collecting the census pins
- **Issue:** the first version of the case in `scripts/runnable-ref/state-check.test.ts` located the block with its own copy of the step name and step marker. `check-foundation-guards.test.ts` forbids that for test files: a second locator is a second grammar over one fact. The census did not refuse it, because it lists only top-level `scripts/*.test.ts`.
- **Fix:** the case imports `ciWorkflow` and `ubuntuBlockCommands` from `scripts/ci-workflow.testkit.js`. It decides membership and order over the block's command lines, as `trace-freshness.test.ts` does. The census-scope gap is logged in deferred-items.md.
- **Files modified:** scripts/runnable-ref/state-check.test.ts
- **Verification:** state-check.test.ts 84/84; check-foundation-guards.test.ts 320/320; typecheck exit 0
- **Committed in:** `92998d61`

**2. [Rule 1 - Bug] The own-tree checker case used the in-repo checker path**
- **Found during:** Task 1 step 4
- **Issue:** the header of `state-check.test.ts` says every case runs the committed checker copied alone into an empty directory. The first draft ran `CHECK_JS` in place.
- **Fix:** the case runs `HOST_JS`, the copy alone, from its own directory, before the commit.
- **Files modified:** scripts/runnable-ref/state-check.test.ts
- **Committed in:** `17c666f4`

**3. [Plan reference drift] The plan's line ranges were stale**
- The plan points at `scripts/validate.test.ts` lines 180-250, `ci.yml` 183-240 and 586-596, and `check-foundation-guards.test.ts` 11960-12000.
- The own-tree validator cases are at about line 3620, the validator line is the last line of `ci.yml`, and the no-step-after-block premise is at about line 12200.
- The work followed the content, not the line numbers.

---

**Total deviations:** 2 auto-fixed (2 bugs), plus 1 note on stale plan references.
**Impact on plan:** none widened scope. Both fixes keep this plan's new cases true to the rules of the files they live in.

## Issues Encountered

- Another project's vitest (`grugops-examples/wt-qe-ABC-199`) was running on the machine during the full run. It was not touched. No vitest process of this plan is left running.

## Human verification pending

- **Test:** in a scratch directory, with GRUGOPS_HOME and HOME set to a second scratch directory, run the installer into a new git repository. Then run the WF05 sub-step by hand: `node tools/grugops/trace-render.js .` followed by `node tools/grugops/state-check.js .`. If a CI run of the host workflow is available, push a branch to a scratch remote.
- **Expected:**
  - both runnables are present under `tools/grugops/`;
  - trace-render exits 0;
  - state-check prints the marker as valid and exits 0;
  - in CI, when available, the PR-gate step runs `node tools/grugops/state-check.js .` and records its exit code without blocking the gate.
- **Why human:** it needs a real host repository and, for the CI half, a live CI run on a host remote (37-VALIDATION.md manual-only row for SPLIT-05).
- not run by the executor

The grugops CI run of the new `state-check.js .` line is also unobserved. Nothing was pushed, and no remote CI was triggered.

## Safety record

- `~/.grugops`: the sha-256 listing of its 180 files was taken before the first vitest run and again at the end, and it is unchanged. This plan ran no installer outside the test suite.
- Bare `npm test` was never run. No branch was created or switched (`git branch --show-current` prints `main`), and nothing was pushed.
- No raw control or NUL byte was written: `check-nul-bytes` exits 0.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 37 is executed, 19 of 19 plans, and ready for /gsd-verify-work. It is not marked complete here.
- Phase 38's `install --migrate` must write `LAYOUT_MARKER_REL` as its last step. grugops's own tree now shows the migrated end state that step should produce.
- Open for a human: the 707 check-diff-disposition findings, and the census-scope note (deferred-items.md).

## Self-Check: PASSED

- FOUND memory-bank/plans/.layout, memory-bank/plans/nfr/.gitkeep, memory-bank/plans/archive/.gitkeep, scripts/validate.test.ts, scripts/runnable-ref/state-check.test.ts, .github/workflows/ci.yml
- FOUND commits 5b64187c, 9cffa7ab, a4c46f91, 17c666f4, 92998d61 (each an ancestor of HEAD)
- Acceptance: `git ls-files memory-bank/plans/.layout` prints the path; the state-check JSON probe exits 0; `grep -c 'runnable-ref/state-check.js \.' .github/workflows/ci.yml` prints 1

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*
