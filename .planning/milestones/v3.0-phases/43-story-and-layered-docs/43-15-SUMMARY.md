---
phase: "43"
plan: "15"
subsystem: installer
status: complete
tags: [installer, kit-home, shipped-docs, dry-run, prune, tdd, install-guide]
requires:
  - "43-06: KIT_ENTRY_PATHS, copyKit over every kit entry, copyKitDocs, shippedSameContent, the <entry>.bak.<ISO> backup rule"
  - "43-02: SHIPPED_DOCS_ROOTS, CHECKOUT_ONLY_DOCS and shippedDocs() in install/kit-source.ts"
  - "43-03: the story-docs gate"
provides:
  - "Cases proving docs/ and examples/ take the kit's replace, --update, DRY_RUN and --prune-old-kit arms, and that uninstall never touches the kit home"
  - "install/README.md: the kit-home layout (agent-factory/, docs/, examples/), the checkout-only records that never ship, the docs.bak/examples.bak backups, and what an older installer does with a record naming them (measured)"
affects:
  - "Phase 43 verification (STORY-02)"
tech-stack:
  added: []
  patterns:
    - "Unexpected GREEN on a proving plan is investigated with mutations of the committed .js, never accepted on trust"
    - "A cross-version claim in a guide is measured by running the older tree's installer from a git archive in scratch space"
key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/.red/43-15-task1-red.json
  modified:
    - install/installer-kit-home.test.ts
    - install/installer-dry-run.test.ts
    - install/installer-prune.test.ts
    - install/README.md
key-decisions:
  - "No install.ts change: plan 43-06 already made every arm generic over KIT_ENTRY_PATHS, and prune is generic over kit-home backup entries; the new cases pass on the committed install.js, and five mutations (M1-M5) each turn at least one new case red"
  - "The guide states what an installer from before plan 43-06 actually does, measured, because installer-cross-version.test.ts covers uninstall across kit sources and shows nothing about it: it reads a record naming docs/examples as malformed, keeps agent-factory/ as an unrecorded agent-factory.bak.<ISO>, leaves docs/, examples/ and the record, and exits 3; the current installer run again replaces all three and keeps the record"
requirements-completed: [STORY-02]
duration: "26 min"
completed: "2026-11-18"
commits: 2
plan_head_before: 0b0ae00b56331310b87fe249159c5cc3e5b34a78
plan_head_after: cc287f5f5062450504dcc84b77108a92fb9e8e17
actuals:
  tokens: 11500
  tasks: 2
  commits: 2
coverage:
  - id: D1
    description: "A re-install over recorded docs and examples replaces them with no backup; an edit inside is overwritten and an added page is gone"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "install/installer-kit-home.test.ts#a re-install over recorded docs and examples replaces them with no backup: an edit inside them is overwritten, an added page is gone, and the record still names every kit entry"
        status: pass
    human_judgment: false
  - id: D2
    description: "--update over recorded docs and examples: identical ones replaced with no backup, differing ones kept as recorded docs.bak/examples.bak holding the edit"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "install/installer-kit-home.test.ts#--update over recorded docs and examples that are identical replaces them with no backup; over ones that differ it keeps each as a recorded backup holding the edit"
        status: pass
    human_judgment: false
  - id: D3
    description: "DRY_RUN prints would-copy plus would-back-up or would-replace per docs entry, and the kit home and target are byte-unchanged"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "install/installer-kit-home.test.ts#DRY_RUN prints would-copy for docs and examples plus would-back-up (unrecorded), would-replace (recorded) or, under --update, would-back-up for the one that differs, and writes nothing in the kit home"
        status: pass
      - kind: integration
        ref: "install/installer-dry-run.test.ts#plan 43-15 flows 1, 3 and 5 with docs"
        status: pass
    human_judgment: false
  - id: D4
    description: "--prune-old-kit removes recorded docs.bak and examples.bak by record, leaves hand-made unrecorded ones byte for byte and named; uninstall never touches the kit home; target state roots unchanged"
    requirement: STORY-02
    verification:
      - kind: integration
        ref: "install/installer-prune.test.ts#recorded docs.bak and examples.bak go, through the record; unrecorded ones are left byte for byte and named; uninstall never touches the kit home; the target's state roots are unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "install/README.md says what lands in the kit home and why, which checkout-only records never ship, and what an older installer does with a record naming the docs entries"
    requirement: STORY-02
    verification:
      - kind: other
        ref: "npm run check:story-docs && npm run check:public-docs && npm run check:banned-claims (all ALL CHECKS PASSED)"
        status: pass
    human_judgment: true
    rationale: "The gates check links and banned claims, not whether the explanation is clear to a user; the prose needs a human read"
---

# Phase 43 Plan 15: Docs and examples take every kit arm Summary

**New installer cases prove that the shipped `docs/` and `examples/` in the kit home are replaced on re-install, kept as recorded `docs.bak.<ISO>` / `examples.bak.<ISO>` by `--update` when they differ, previewed without a write under DRY_RUN, and pruned by record only. The install guide now says what lands in the kit home, why, and what an older installer does with the new record (measured).**

## Performance

- **Duration:** 26 min
- **Started:** 2026-11-18T03:40:56Z
- **Completed:** 2026-11-18T04:07:23Z
- **Tasks:** 2
- **Files modified:** 4 (plus 1 RED evidence record)

## Accomplishments

- installer-kit-home.test.ts: a new describe block with 4 cases (1 premise, plus replace, `--update`, DRY_RUN). Each mirrors a kit case one for one, for every member of `SHIPPED_DOCS_ROOTS`. Each case also checks that the target's state roots are byte-unchanged, using `plantStateRoots` from plan 43-06.
- installer-dry-run.test.ts: 4 cases (1 premise, plus flows 1, 3 and 5 with docs). Each checks that the would-copy, would-replace and would-back-up lines name the docs entries and that `expectDryRunUnchanged` holds.
- installer-prune.test.ts: 2 cases (1 premise, plus the prune case).
  - Two recorded backups are made through two different arms: a user's own `docs/` kept by an install, and an edit inside `examples/` kept by `--update`.
  - Hand-made `docs.bak.<ISO>` and `examples.bak.<ISO>` sit beside them with no record.
  - DRY_RUN prune changes nothing.
  - The real prune removes only the two recorded backups and names the hand-made ones `left`.
  - The kit entries stay in the record.
  - DRY_RUN and real uninstall leave the kit home byte-unchanged.
  - The target's state roots are unchanged throughout.
- install/README.md:
  - The two-root bullet says the kit home holds `agent-factory/`, `docs/` and `examples/`, explains why the docs are copied, and names the checkout-only records that never ship (`docs/audit/`, `docs/design/`, `docs/initial/`, the maintainer runbook, the pre-v3 layout page).
  - The kit-home record paragraph, the `--update` section and the `--prune-old-kit` section cover the docs entries and their backups.
  - A new paragraph states what an older installer does with the record.
  - No section heading changed.

## Task Commits

1. **Task 1 (tracer): docs and examples take the kit's replace, update, dry-run and prune arms**: `b7b6ca16` (test)
2. **Task 2: the install guide describes the docs in the kit home**: `cc287f5f` (docs)

## TDD Gate Compliance

- **Unexpected GREEN, investigated.** Against the committed install.js, all 10 new cases passed at once. Plan 43-06 had already written copyKit's arms as one loop over `KIT_ENTRY_PATHS`, and `pruneOldKit` acts on any recorded kit-home backup. So no arm was missing and no install.ts change was needed. To show the cases are not vacuous, I made five temporary mutations of install.js. Each was restored, and `git diff --quiet install/install.js` was confirmed after every run.

| Mutation | What it breaks | New cases red |
|---|---|---|
| M1 | a recorded docs entry read as not owned (`own.owned && isKit`) | 5 (replace, --update, kit-home DRY_RUN, dry-run flow 3, prune) |
| M2 | `shippedSameContent` always answers identical | 4 (--update, kit-home DRY_RUN, dry-run flow 5, prune) |
| M3 | no would-copy line for a docs entry | 4 (kit-home DRY_RUN, dry-run flows 1, 3, 5) |
| M4 | prune removes `docs.bak.*` / `examples.bak.*` by name | 1 (prune: the DRY_RUN step changed the kit home) |
| M5 | the kit-home origin is not prunable | 1 (prune) |

- **RED record:** `.planning/phases/43-story-and-layered-docs/.red/43-15-task1-red.json`. The target was the re-install case, run under M1. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`).
  - Two earlier records were refused as `invalid_record` (Malformed TAP). Vitest's TAP reporter printed a multi-line failure message: first the prune case's stdout, then a pretty-printed array `actual`.
  - I changed the re-install case's no-backup assertion to compare the joined names (`allBackupsIn(c).join(", ")` to `""`). It is the same check with a one-line report.
  - **Semantic assessment:** the target ran and failed on its planned no-backup assertion, because the mutation kept both entries as backups. No load, syntax or fixture fault.
- **GREEN:** no `feat(43-15)` commit. The GREEN implementation is plan 43-06's `49bfb5c9`, which this plan depends on, and the plan's own commit subject for Task 1 is `test(43-15)`.

## Verification

| Command | Result |
|---|---|
| `npm run build && npx vitest run install/installer-kit-home.test.ts install/installer-dry-run.test.ts install/installer-prune.test.ts install/ledger.test.ts` | exit 0, 153 passed |
| Tracer gate (interactive, end-of-phase, automated-only verify) | re-run green, expansion continued |
| Task 2 group (message-references, cross-version, marker-binding, write-set, uninstall-removal, install, fs-census) | 1231 passed, 1 failed (baseline `openAsBlobSync`), 1 skipped |
| `npx vitest run install/` (every install test file, final tree) | 3124 passed, 1 failed (baseline `openAsBlobSync`), 1 skipped. Plan 43-06 had 3114 passed, and this plan adds 10 cases |
| `npm run freshness` | exit 0, 93 committed .js fresh |
| `npm run check:build-parity` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run check:story-docs` / `check:public-docs` / `check:banned-claims` / `node scripts/check-banned-claims.js` | all exit 0, ALL CHECKS PASSED |

Acceptance criteria:
- Task 1: `docs.bak` appears 4 times in installer-prune.test.ts (0 at base), and `examples` appears 6 times in installer-dry-run.test.ts (0 at base). Both exit 0.
- Task 2: `examples/` appears 9 times in install/README.md (0 at base), and `docs/audit` appears once.

## The older-installer measurement

I extracted the phase-43 base tree (`a067c6e6`, before plan 43-06, without `.planning/`) from `git archive` into scratch space.
1. The current installer wrote a kit home, with a record holding three kit entries.
2. The base installer then ran over the same kit home, into another target.
   - It printed `its ledger is malformed (entry 1: a kit entry may name only agent-factory), so it is read as no record`.
   - It renamed `agent-factory/` to `agent-factory.bak.<ISO>`, copied its kit, and left `docs/`, `examples/` and the record unchanged.
   - It printed a `verify` line saying the record was not written and the backup is unrecorded.
   - It ended `install INCOMPLETE`, exit 3.
3. The current installer, run again, replaced all three entries (`replaced … install recorded writing there`) and exited 0.
4. A prune afterwards left the older run's backup as `not recorded by install`.

The guide states exactly this. It differs from the plan's expected wording ("keeps what is there as a backup") in three ways: only `agent-factory/` is kept as a backup, that backup is unrecorded, and the run exits 3.

## Foundation-guard handoff

None. This plan changes no `scripts/` file and no import.

## Same-wave re-runs

None. Plan 43-05 (wave 4) had already finished before this plan started (its SUMMARY and state commits `8566e5cc` and `0b0ae00b` were on HEAD), and no gate went red.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan detail] No arm was missing, so install.ts and install.js are unchanged**
- **Found during:** Task 1 (RED).
- **Issue:** the plan expected some new cases to fail where an arm was missing. All of them passed on the committed install.js.
- **Fix:** I made no code change. I proved the cases are not vacuous by mutation (M1 to M5 above), and recorded RED evidence under M1.
- **Files modified:** none of install.ts or install.js. Both files are listed in the plan's `files_modified`, but neither changed.
- **Commit:** `b7b6ca16`.

**2. [Rule 3 - Blocking] One assertion re-shaped so the RED record parses**
- **Found during:** Task 1 (RED evidence).
- **Issue:** vitest's TAP output for a failed `toEqual([])` on an array is multi-line YAML, which the classifier refuses (`invalid_record`).
- **Fix:** the re-install case's no-backup assertion compares the joined names with `""`. It checks the same thing.
- **Commit:** `b7b6ca16`.

**3. [Plan detail] The older-installer sentence was measured, not read from installer-cross-version.test.ts**
- **Found during:** Task 2.
- **Issue:** that test covers uninstall across kit sources. It never runs an older installer over a newer kit-home record.
- **Fix:** I measured the behavior by running the base tree's installer, as described above, and wrote what it shows. The measurement itself is not a committed test.

**Total deviations:** 3 (1 Rule 3, 2 plan-detail). **Impact:** no scope added. The safety arms are proven, and the guide states measured behavior.

## Issues Encountered

- `install.test.ts` and the whole install/ run take several minutes, so both ran in the background with JSON reports and the default TMPDIR. Failures were compared by file and test name against 43-BASELINE.md: the only failure in either run is the baseline `openAsBlobSync` case.

## Known Stubs

None.

## Threat Flags

None. The plan's threat register covers what this plan changes:
- T-43-42: prune by record only. The test plants unrecorded `docs.bak`/`examples.bak` and asserts they survive, and M4 proves the case catches removal by name.
- T-43-43: DRY_RUN writes nothing. Byte-unchanged snapshots are taken in every DRY_RUN case.

## Next Phase Readiness

Every arm of the docs entries is proven, and the install guide describes them. STORY-02 is shared with other phase-43 plans, so it is marked complete only through `requirements.ready-ids`.

## Self-Check: PASSED

- All four modified files and the RED record exist.
- Commits `b7b6ca16` and `cc287f5f` are on HEAD.
