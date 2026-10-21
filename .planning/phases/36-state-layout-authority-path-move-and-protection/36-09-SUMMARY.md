---
phase: "36"
plan: "09"
subsystem: state-layout
tags: [state-layout, docs, examples, install-guide, pre-v3, handoffs-backup]

requires:
  - phase: 36
    provides: "install/state-layout.ts (STATE_ROOT_REL, LEGACY_HANDOFFS_REL) from plan 36-01; scripts/state-path-scan.js from 36-03; the kit-text substitution approach from 36-08"
provides:
  - "docs/pre-v3-state-layout.md: the one user doc that names the pre-v3 layout, holding the legacy handoffs backup material moved out of install/README.md (ready for plan 36-13's refusal, doctor and v4.0 sections; allow-listed by plan 36-14)"
  - "The five examples, install/README.md and docs/dogfood-human-runbook.md name planning state only as memory-bank/plans/..."
  - "docs/design/shared-install.md rewritten to memory-bank/plans/ paths, handoffs mentions included (D-16)"
affects: [36-13, 36-14]

actuals:
  tokens: 9513
  tasks: 2
  commits: 2
plan_head_before: b1d88660104727b8d7163711cbae6ac772375fad
plan_head_after: 161bf23defaba6769d6a89a61cda2eea085718be

tech-stack:
  added: []
  patterns:
    - "Docs substitution reuses 36-08's method: a scratch script applies the scan core's spellingPatterns().slash with a `${STATE_ROOT_REL}/` replacement, split around LEGACY_FALLBACK_CLAUSE; the word diff then shows no added word without memory-bank/plans/ and no removed word without plans/"

key-files:
  created:
    - docs/pre-v3-state-layout.md
  modified:
    - install/README.md
    - docs/design/shared-install.md
    - docs/dogfood-human-runbook.md
    - examples/01-greenfield-bootstrap.md
    - examples/02-brownfield-bootstrap.md
    - examples/03-ticket-to-pr.md
    - examples/04-sprint-cycle.md
    - examples/05-release-run.md

key-decisions:
  - "The whole `##### Restoring plans/handoffs/ and the git revert lossless rollback` subsection moved to docs/pre-v3-state-layout.md (no printed message names it); install/README.md keeps one sentence linking to it after the manual-restore steps"
  - "Mixed install/README.md sentences that listed the handoffs directory beside other backups (the ledger paragraph, the whole-or-nothing paragraph) now say `the legacy handoffs directory` with no path; the handoffs-only material moved with its wording kept"
  - "The legacy handoffs backup paths stay `plans/handoffs/` and `plans/handoffs.bak.<ISO>` in the new doc: LEGACY_HANDOFFS_REL is backed up where it lies, under the pre-v3 root"

patterns-established:
  - "A doc that must name the pre-v3 root lives in docs/pre-v3-state-layout.md and is linked from the general doc, rather than leaving pre-v3 spellings in install/README.md"

requirements-completed: []

coverage:
  - id: D1
    description: "The pre-v3 handoffs backup material has one home, docs/pre-v3-state-layout.md, that install/README.md links to, and every message-referenced README heading still exists"
    requirement: LAYOUT-01
    verification:
      - kind: unit
        ref: "npx vitest run install/message-references.test.ts install/host-entry-docs.test.ts (2 files, 61 passed)"
        status: pass
      - kind: other
        ref: "test -f docs/pre-v3-state-layout.md && grep -c 'pre-v3-state-layout.md' install/README.md prints 4; node scripts/state-path-scan.js docs/pre-v3-state-layout.md exits 1 (15 sites, by design)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The examples, install/README.md, the dogfood runbook and the design record name planning state only as memory-bank/plans/"
    requirement: LAYOUT-01
    verification:
      - kind: other
        ref: "node scripts/state-path-scan.js examples install/README.md docs/design docs/dogfood-human-runbook.md exits 0 (baseline 51 sites: 22 + 18 + 10 + 1)"
        status: pass
      - kind: other
        ref: "git diff --word-diff=porcelain over the eight files: 0 added words without memory-bank/plans/, 0 removed words without plans/"
        status: pass
      - kind: unit
        ref: "npx vitest run over 25 files that read these docs (board-corpus, check-banned-claims, check-foundation-guards, check-public-docs-vocabulary, check-uat-oracles, message-references, host-entry-docs, host-tools, host-tools-prose, installer-kit-home, opencode-permission, guard-retired, host-protection, catalog-freshness, generate-guarantees, check-claim-anchors, check-kit-refs, generate-catalog, generate-safety-surface, check-audit-register, audit-model, kit-model, frontmatter, state-path-scan, installer-special-files): 2122 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "No historical record edited (D-09, D-16) and every doc and kit gate passes"
    verification:
      - kind: other
        ref: "git diff --name-only b1d88660104727b8d7163711cbae6ac772375fad..HEAD -- docs/audit CHANGELOG.md docs/initial exits 0 and prints nothing"
        status: pass
      - kind: other
        ref: "check-public-docs-vocabulary, check-banned-claims, check-claim-anchors, check-audit-register, check-nul-bytes, check-kit-refs, check-imperative-lexicon, VALIDATE_KIT_ROOT=. validate-agent-factory, npm run freshness:catalog, npm run freshness:guarantees (each exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The pre-v3 doc reads clearly to a user on the old layout, and the moved README wording still makes sense in its new place"
    verification: []
    human_judgment: true
    rationale: "Readability of moved prose and the redundancy of mechanically substituted lists (`memory-bank/plans/`, and `memory-bank/`) are judgment calls no gate asserts"

duration: 11min
completed: 2026-10-21
status: complete
---

# Phase 36 Plan 09: Examples and install docs name memory-bank/plans/; the pre-v3 handoffs material moves to docs/pre-v3-state-layout.md Summary

**The legacy handoffs backup material (directory, timestamped backup name, never-delete behavior, how uninstall and `--prune-old-kit` treat the recorded backup, and the restore and `git revert` rollback) moved word for word from install/README.md into the new docs/pre-v3-state-layout.md, which the README links to from four places. The remaining 38 pre-v3 state-path sites in the five examples, install/README.md, the dogfood runbook and the design record now read `memory-bank/plans/…`.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-21T09:25:40Z
- **Completed:** 2026-10-21T09:37:05Z
- **Tasks:** 2 (one tracer, one auto)
- **Files modified:** 9 (1 created, 8 modified)

## Accomplishments

- **Tracer (Task 1).** docs/pre-v3-state-layout.md opens with one paragraph on the pre-v3 `plans/` layout (a pre-v3 repository keeps its state there until `install --migrate` moves it) and a section, "The legacy handoffs backup `--migrate` makes", holding the moved README material with its wording kept. It does not add the refusal, doctor or v4.0 sections; plan 36-13 writes those.
- **install/README.md links to it** from the exit-code table's row `0`, the `--migrate` bullet list, the line after the manual-restore steps (where the moved subsection was), and the `--prune-old-kit` list. Seven sites left the README with the moved material (the handoffs bullet, two mixed sentences, the every-run paragraph, the restore subsection and the prune bullet). No heading a printed message names moved: the only `see "<section>" in install/README.md` reference is "Which agents an unattended install is for", and the headings named elsewhere ("Undo", "Migrating an existing install (`--migrate`)", "Pruning old backups (`--prune-old-kit`)") are unchanged.
- **Expansion (Task 2).** A scratch script ran the scan core's `spellingPatterns().slash` with a `${STATE_ROOT_REL}/` replacement over eight files: examples 01-05 (4, 4, 2, 5, 7), the runbook (1), install/README.md (5: the seeded-state lists, the never-modified list, the uninstall preserved list and the prune protected list) and docs/design/shared-install.md (10, including its historical `plans/handoffs/` mentions, per D-16). The word diff shows no added word without `memory-bank/plans/`.

## Task Commits

1. **Task 1 (tracer): the pre-v3 handoffs backup material moves to docs/pre-v3-state-layout.md**: `4cf5ca21` (docs).
   - Tracer gate: interactive, `end-of-phase`, verify is automated only. Re-ran the `<automated>` step on the committed content (exit 0, 61 tests passed, vocabulary gate passed). Tracer verified end-to-end, expansion continued.
2. **Task 2: examples, install guide, runbook and design record name memory-bank/plans/**: `161bf23d` (docs).

**Plan metadata:** recorded by the docs commit that carries this SUMMARY.

## Acceptance evidence

START (recorded before Task 1): `b1d88660104727b8d7163711cbae6ac772375fad`.

| Check | Baseline | After |
|-------|----------|-------|
| `test -f docs/pre-v3-state-layout.md && grep -c 'pre-v3-state-layout.md' install/README.md` | file absent | 4 |
| `node scripts/state-path-scan.js docs/pre-v3-state-layout.md` | file absent | exit 1, 15 sites (names the pre-v3 directory by design; plan 36-14 allow-lists it) |
| `node scripts/state-path-scan.js examples install/README.md docs/design docs/dogfood-human-runbook.md` | 51 sites (22, 18, 10, 1), FAIL | PASS, 8 files, exit 0 |
| Task 2 word diff: added words without `memory-bank/plans/` / removed words without `plans/` | n/a | 0 / 0 |
| `npx vitest run install/message-references.test.ts install/host-entry-docs.test.ts` | n/a | 2 files, 61 passed (both tasks) |
| `node scripts/check-diff-disposition.js` findings (known pre-existing red) | 562 findings over 40 elements, exit 1 (measured at START in a detached scratch worktree, removed afterwards; no branch created) | 562 findings over 40 elements, exit 1 |

The historical-record check, as the acceptance criterion asks:

```
$ git diff --name-only "b1d88660104727b8d7163711cbae6ac772375fad"..HEAD -- docs/audit CHANGELOG.md docs/initial
$ echo $?
0
```

(empty output)

## Plan-level verification

1. `node scripts/state-path-scan.js agent-factory ':!agent-factory/packaging' examples install docs/design docs/dogfood-human-runbook.md 'scripts/fixtures/*/agent-factory/roles/*.md' ':!install/state-layout.ts' ':!install/state-layout.js'`: PASS, 339 files, zero sites, exit 0.
2. Each exited 0: check-public-docs-vocabulary, check-banned-claims, check-claim-anchors, check-audit-register, check-nul-bytes, plus check-kit-refs, check-imperative-lexicon and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`.
3. `npm run freshness:catalog` and `npm run freshness:guarantees`: exit 0.
4. `git branch --show-current` prints `main`.

Targeted tests (no full suite, per the run's rules): 25 files that read install/README.md, the examples or the docs gates' inputs, listed in coverage D2: 2122 passed, 0 failed. The `FAIL` lines in that run's output are expected messages printed by mutation cases inside check-public-docs-vocabulary.test.ts, not failed tests.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

None - plan executed exactly as written. One note, not a deviation: the plan's Task 1 named "the exit-code table's handoffs mention" and the legacy backup text; the handoffs path also sat in two mixed README sentences (the backup ledger paragraph and the whole-or-nothing paragraph). Those keep their sentence and name "the legacy handoffs directory" without a path, so install/README.md reaches zero sites; their handoffs content is in the new doc.

## Issues Encountered

None. `node scripts/check-diff-disposition.js` (562 findings before and after) and `node scripts/check-flip-manifest.js` remain red as recorded before this plan; no disposition rows were added, per the plan.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plans 36-10 and 36-11:** INVARIANT, AGENTS.md, the packaging copies and the skills.
- **Plan 36-13:** adds the refusal, doctor and v4.0 sections to docs/pre-v3-state-layout.md.
- **Plan 36-14:** allow-lists docs/pre-v3-state-layout.md by name with its reason.
- **LAYOUT-01** stays unchecked until plan 36-14.

---
*Phase: 36-state-layout-authority-path-move-and-protection*
*Completed: 2026-10-21*

## Self-Check: PASSED

- FOUND: docs/pre-v3-state-layout.md; install/README.md links to it (4 occurrences); docs/design/shared-install.md contains `memory-bank/plans/`
- FOUND commits: 4cf5ca21, 161bf23d (both ancestors of HEAD)
