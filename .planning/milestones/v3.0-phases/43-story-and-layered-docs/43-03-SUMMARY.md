---
phase: 43-story-and-layered-docs
plan: "03"
subsystem: testing
tags: [story-docs-gate, claude-md, gap-d1, shipped-links, ci]

requires:
  - phase: 43-story-and-layered-docs
    provides: "43-BASELINE.md (plan 43-01) and shippedDocs() joined to the public-docs corpus (plan 43-02)"
provides:
  - "scripts/check-story-docs.ts (+ committed .js): exports GRUG_COMMAND_WORD, GAP_D1_SENTENCE, grugCommandFindings, gapD1Findings, linkFindings (plus PARALLEL_WORD, gapD1ScanSet, lineLinkTargets, LinkContext)"
  - "npm script check:story-docs; ci.yml runs `node scripts/check-story-docs.js` beside the public-docs gate"
  - "CLAUDE.md names only the commands that shipped; .planning/PROJECT.md:11 says /grugops"
  - "The GAP-D1 sentence in install/README.md and the CHANGELOG.md Unreleased block"
  - "docs/skills.md and agent-factory/README.md link checkout-only targets by repository URL; C-28-036 re-measured"
affects: [43-04, 43-05, 43-06, 43-07, 43-08, 43-09, 43-10, 43-11, 43-12, 43-14, 43-15]

actuals:
  tokens: 19007   # chars/4 over the realized diff (76028 chars), dfc40f31..ea250e8d
  tasks: 3
  commits: 5
plan_head_before: dfc40f31b12fda15eaf86f0bde1eba2d5d2ee888
plan_head_after: ea250e8d7ad8e1ad8077d10bbe962d4c4f6b6550

tech-stack:
  added: []
  patterns:
    - "A docs gate with one Measured per check, folded by reportMeasured; each check's live-tree test reads its own PASS line, not the gate's exit code"
    - "Link rules take an injected LinkContext (exists, shipped, repository), so the cases run in memory and the gate supplies the real tree"

key-files:
  created:
    - scripts/check-story-docs.ts
    - scripts/check-story-docs.js
    - scripts/check-story-docs.test.ts
  modified:
    - CLAUDE.md
    - .planning/PROJECT.md
    - install/README.md
    - CHANGELOG.md
    - docs/skills.md
    - agent-factory/README.md
    - docs/audit/28-claim-registry.md
    - package.json
    - .github/workflows/ci.yml
    - scripts/check-foundation-guards.test.ts
    - scripts/check-public-docs-vocabulary.test.ts
    - install/mode-census.test.ts

key-decisions:
  - "CI names the gate module (`node scripts/check-story-docs.js`), the repository's spelling for a gate step; the comment beside it names `npm run check:story-docs`"
  - "install/README.md's Reduced tier no longer says parallel scheduling 'is used'; it says it is available with the same open gap as the full tier"
  - "Check 3 skips links inside inline code spans as well as fenced lines; a link written in backticks is text"

requirements-completed: [STORY-05, STORY-02]

coverage:
  - id: D1
    description: "The story-docs gate is wired in package.json and ci.yml and its test reads both wirings"
    requirement: STORY-05
    verification:
      - kind: unit
        ref: "scripts/check-story-docs.test.ts#wiring"
        status: pass
      - kind: other
        ref: "npm run check:story-docs (exit 0, ALL CHECKS PASSED)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CLAUDE.md names no /grug command word (13 lines at base, 0 now); line 83 unchanged; PROJECT.md:11 says /grugops"
    requirement: STORY-05
    verification:
      - kind: unit
        ref: "scripts/check-story-docs.test.ts#check 1 — the /grug command word (D-23)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Any public page or install/README.md that says parallel carries the exact GAP-D1 sentence"
    requirement: STORY-05
    verification:
      - kind: unit
        ref: "scripts/check-story-docs.test.ts#check 2 — the GAP-D1 sentence on pages that mention parallel work (D-22)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No shipped docs link is dead in a kit home; C-28-036 keeps its id with re-measured bytes"
    requirement: STORY-02
    verification:
      - kind: unit
        ref: "scripts/check-story-docs.test.ts#check 3 — shipped docs links resolve in a kit home (D-11)"
        status: pass
      - kind: other
        ref: "node scripts/check-claim-anchors.js (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The reworded CLAUDE.md research block and the install/README.md tier prose read correctly to a person"
    verification: []
    human_judgment: true
    rationale: "No test judges whether reworded prose is accurate and clear; a reader must confirm the wording"

duration: 44min
completed: 2026-11-18
status: complete
---

# Phase 43 Plan 03: Story-docs gate Summary

**A three-check `check:story-docs` gate, run in CI: CLAUDE.md names only `/grugops`, every page that mentions parallel work states the GAP-D1 gap word for word, and every shipped docs link resolves in an installed kit home. The live tree was fixed to pass all three checks.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-11-18T00:04:32Z
- **Completed:** 2026-11-18T00:48:30Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- `scripts/check-story-docs.ts`: check 1 (`/grug` in CLAUDE.md), check 2 (GAP-D1 over `publicDocsCorpus()` + install/README.md), check 3 (shipped links over `shippedDocs()` + agent-factory/README.md under the ship rule, README.md under the checkout rule, repository URLs checked against the checkout). Each check reports through `reportMeasured`; a check that visits no files fails.
- CLAUDE.md fixed one line for one line (lines 10, 22, 47, 65, 69, 91, 102, 111, 112, 129, 131, 133, 150); line 83 is byte-identical to the base commit.
- GAP-D1 sentence added to install/README.md (full tier) and to the CHANGELOG.md Unreleased block. Old changelog entries untouched.
- Two dead-in-kit-home links became repository URLs. The C-28-036 verbatim block and its mechanism were updated in the same commit.

## Task Commits

1. **Task 1: the `/grug` check end to end** — `c6c15e2d` (feat, the gate red on the live CLAUDE.md), then `cb427ed2` (docs, CLAUDE.md and PROJECT.md fixed)
2. **Task 2: the GAP-D1 check** — `1ae30b77` (feat)
3. **Task 3: the shipped-links check** — `9c5023bc` (feat)
4. **Pin fix from the full-suite run** — `ea250e8d` (test, SCRIPTS_TEST_FILE_COUNT)

## RED evidence (TDD)

Each RED was checked with `gsd-tools check tdd-red-evidence` (vitest `--reporter=tap-flat`), and each returned `RED_EVIDENCE_OK / target_test_failed`. Semantic check: in every run, the only failing case was the target, and it failed on the planned assertion.

- Task 1: `finds no /grug command word in the live CLAUDE.md`: "CLAUDE.md lines naming /grug: 10, 22, 47, 65, 69, 91, 102, 111, 112, 129, 131, 133, 150: expected 13 to be +0" (20 of 21 passed).
- Task 2: `the live tree: 0 findings over the corpus plus one`: the FAIL line named CHANGELOG.md (first `parallel` at line 952) and install/README.md (line 2012), 2 findings over 16 elements.
- Task 3: `the live tree: every shipped docs link resolves in a kit home`: 2 findings over 11 elements, `docs/skills.md:17` and `agent-factory/README.md:163`.

The gate's own first live run (Task 1), finding lines as printed:

```
FAIL  STORY-05 /grug command word (CLAUDE.md names only the shipped /grugops commands): 13 finding(s) over 1 elements
  CLAUDE.md:10   CLAUDE.md:22   CLAUDE.md:47   CLAUDE.md:65   CLAUDE.md:69   CLAUDE.md:91   CLAUDE.md:102
  CLAUDE.md:111  CLAUDE.md:112  CLAUDE.md:129  CLAUDE.md:131  CLAUDE.md:133  CLAUDE.md:150
```

(Each printed line also carries an excerpt of the line. Condensed here to the line numbers.)

## Files Created/Modified

- `scripts/check-story-docs.ts` / `.js`: the gate
- `scripts/check-story-docs.test.ts`: 42 cases covering the regex, the 13 base-commit lines, mirror refusals, GAP-D1 encoding edges, link rules, the live tree and the wiring
- `scripts/check-foundation-guards.test.ts`: NON_TEST_MODULE_COUNT 115→116, scoped reader corpus 73→74 (both sites) and its comparison count 73·3→74·3, TRIPWIRE_MODULES 85→86, gate-module targets 13→14, frontmatter consumers 14→15 with `importedSymbols("check-story-docs.ts", "frontmatter")` = `["fencedLineFlags"]`
- `scripts/check-public-docs-vocabulary.test.ts`: DECLARED_CONSUMERS gains `scripts/check-story-docs.ts` / `publicDocsCorpus`
- `install/mode-census.test.ts`: SCRIPTS_TEST_FILE_COUNT 85→86
- `CLAUDE.md`, `.planning/PROJECT.md`, `install/README.md`, `CHANGELOG.md`, `docs/skills.md`, `agent-factory/README.md`, `docs/audit/28-claim-registry.md`, `package.json`, `.github/workflows/ci.yml`

## Decisions Made

See key-decisions. Also: CLAUDE.md's stack block (lines 25-168) declares `source:research/STACK.md`, but that file holds no `/grug` and no longer matches the block. Following the plan, the block was edited in place. The mismatch remains: regenerating the block from research/STACK.md would overwrite these edits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CI step names the gate module, not `npm run check:story-docs`**
- **Found during:** Task 1
- **Issue:** check-foundation-guards.test.ts ("every scripts/check-*.js appears in ci.yml") detects reachability only from the `node scripts/<gate>.js` spelling.
- **Fix:** ci.yml runs `node scripts/check-story-docs.js`, and its comment names `npm run check:story-docs`. The wiring test asserts both, plus the exact package.json script. `grep -c "check:story-docs" ci.yml` still prints 1.
- **Commit:** c6c15e2d

**2. [Rule 3 - Blocking] Pins the plan did not list**
- **Found during:** Tasks 1, 2 and the full-suite run
- **Issue:** Three more pins moved with the new module. The gate-module target count (13→14) and the scoped reader's comparison count (73·3→74·3) both live in check-foundation-guards.test.ts. The public-docs DECLARED_CONSUMERS table needed a row for the new corpus consumer. install/mode-census.test.ts SCRIPTS_TEST_FILE_COUNT went 85→86.
- **Fix:** Each new value was read off the test's own failure and recorded in a dated history entry.
- **Commits:** c6c15e2d, 1ae30b77, ea250e8d

**3. [Plan order] The frontmatter consumer pin moved in Task 3, not Task 1**
- **Issue:** The gate imports `fencedLineFlags` only from Task 3 onward, so moving that pin in Task 1 would have turned it red.
- **Commit:** 9c5023bc

**4. [Rule 1 - Test hygiene] Assertions made TAP-safe and scoped per check**
- **Issue:** Multi-line assertion messages made the tap-flat report malformed (`invalid_record`). Also, the check-2 live case asserted the whole gate's exit code, so it went red for check 3's reason.
- **Fix:** Count assertions with one-line messages. Each live case now reads only its own check's PASS line.

**Total deviations:** 4 (2 blocking, 1 ordering, 1 test hygiene). **Impact:** wiring and pins only; no scope change.

## Verification

- Every task `<automated>` command passed. Story-docs gate: 0 findings over 1/1, 16/16 and 11/11 elements. `check-claim-anchors`, `check-audit-register`, `check-public-docs-vocabulary`, `check-banned-claims`, `check-state-paths`, `npm run freshness` (93 .js), `check:build-parity` (after commit), `npm run typecheck`, `node scripts/check-foundation-guards.js` and `freshness:hook-manifest` all exit 0.
- Every acceptance grep passed: CLAUDE.md `/grug` 0; line 83 unchanged; PROJECT.md `` types `/grug` `` 0; package.json `"check:story-docs"` 1; ci.yml ≥1; `ls scripts/*.test.ts | wc -l` 86; GAP-D1 sentence in install/README.md 1 and in CHANGELOG.md 1; `](../.planning/` in docs/skills.md 0; `](../install/README.md)` in agent-factory/README.md 0; `blob/main/install/README.md` in the registry 1; "zero elements" 0.
- `scripts/check-foundation-guards.test.ts` (whole file): 343/344. The one red is the baseline LANG-07 case (the untracked `~/` directory).
- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, before ea250e8d): 11940 tests, 11916 passed, 22 failed, 2 skipped. 21 of the failures match 43-BASELINE.md by file and test name. The 22nd, `install/mode-census.test.ts` WIN-2 (b), was this plan's own; ea250e8d fixed it, and the file was then run green alone (15/15). The full suite was not run again after that commit.

## Issues Encountered

`check-flip-manifest.ts` scans the public corpus for "GAP-D1 deferral sentences" once its manifest is discharged. The manifest is missing (a baseline red), so that rule does not run today. Whether it would treat the new GAP-D1 sentence as a residual is `UNKNOWN - verify`.

## User Setup Required

None.

## Next Phase Readiness

Plan 43-04 (wave 3) gets check-foundation-guards.test.ts green against the baseline, and a link rule that every later docs page is held to.

## Self-Check: PASSED

- Files exist: scripts/check-story-docs.ts, scripts/check-story-docs.js, scripts/check-story-docs.test.ts
- Commits on this branch: c6c15e2d, cb427ed2, 1ae30b77, 9c5023bc, ea250e8d
