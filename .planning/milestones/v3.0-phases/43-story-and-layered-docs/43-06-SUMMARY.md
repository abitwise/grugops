---
phase: "43"
plan: "06"
subsystem: installer
status: complete
tags: [installer, kit-home, shipped-docs, census, tdd]
requires:
  - "43-02: SHIPPED_DOCS_ROOTS, CHECKOUT_ONLY_DOCS and shippedDocs() in install/kit-source.ts"
  - "43-03: the story-docs gate (no shipped docs link dead in a kit home)"
provides:
  - "KIT_ENTRY_PATHS (install-marker.ts): the closed set of kit-home entries, agent-factory plus SHIPPED_DOCS_ROOTS"
  - "copyKit over every kit entry; $GRUGOPS_HOME/docs and $GRUGOPS_HOME/examples beside the kit"
  - "copyKitDocs (page-by-page staging) and shippedSameContent (--update identity for a docs entry)"
  - "The overlap guard refuses a target at, inside or holding a docs entry"
affects:
  - "43-15: proves the replace, --update, DRY_RUN and prune arms for the new entries and updates the install guide"
tech-stack:
  added: []
  patterns:
    - "One kit-home record over a closed entry set composed from two declarations, never retyped"
    - "Arms decided for every entry before any write; one record write per run"
key-files:
  created:
    - .planning/phases/43-story-and-layered-docs/.red/43-06-task1-red.json
  modified:
    - install/install-marker.ts
    - install/install-marker.js
    - install/install.ts
    - install/install.js
    - install/installer-kit-home.test.ts
    - install/ledger.test.ts
    - install/installer-fs-census.test.ts
    - install/install.test.ts
    - install/installer-special-files.test.ts
    - install/agents-record.test.ts
key-decisions:
  - "The docs entries land as siblings of the kit ($GRUGOPS_HOME/docs, $GRUGOPS_HOME/examples), so ../docs/ from agent-factory/README.md resolves in the kit home (D-11, D-27)"
  - "A kit-home backup must be named <of>.bak.<ISO>, checked by building the prefix from the `of` member, never a typed alternation"
  - "A docs entry is staged page by page from shippedDocs(GRUGOPS_SRC) through copyKitDocs (cpSync with dereference), never a cpSync of the source folder"
  - "--update compares a docs entry with the shipped pages directly (shippedSameContent), not a staged tree, so DRY_RUN decides the same arm with no write"
  - "A kit source whose docs roots cannot be read is a verify (exit 3), as the plan specifies; synthetic test sources now carry the roots, empty"
  - "The overlap guard covers every kit entry (Rule 2): GRUGOPS_HOME=$HOME with the target at $HOME/docs would otherwise rename the repository to a backup"
requirements-completed: [STORY-02]
duration: "50 min"
completed: "2026-11-18"
commits: 2
plan_head_before: a1c08e0868262f1d37ebfe98932a47f2a3f6283b
plan_head_after: 41f081104b71c7da9dbc37a520ea157757944006
actuals:
  tokens: 13400
  tasks: 2
  commits: 2
coverage:
  - deliverable: "A fresh install copies every shipped page byte for byte into the kit home, records three kit entries, ships no checkout-only path, and the kit README's ../docs/GUARANTEES.md link resolves"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/installer-kit-home.test.ts#a fresh install copies every shipped page byte for byte, records the kit entries, leaves no checkout-only path, and the README link resolves"
        status: pass
  - deliverable: "An unrecorded $GRUGOPS_HOME/docs is renamed to a recorded docs.bak.<ISO>, byte-identical, and the shipped docs are copied"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/installer-kit-home.test.ts#a user's own unrecorded $GRUGOPS_HOME/docs is renamed to a recorded docs.bak.<ISO>, byte-identical, and the shipped docs are copied"
        status: pass
  - deliverable: "The target's STATE_ROOTS content is byte-unchanged by every new case"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/installer-kit-home.test.ts#plantStateRoots check in both plan 43-06 install cases"
        status: pass
  - deliverable: "The kit-home record admits exactly KIT_ENTRY_PATHS; an old one-entry record still parses"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/ledger.test.ts#plan 43-06: the kit-home record's closed set of kit entries"
        status: pass
  - deliverable: "A target at $GRUGOPS_HOME/docs is refused before any write"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/installer-kit-home.test.ts#a target that is $GRUGOPS_HOME/docs is refused before any write, like a target at the kit root"
        status: pass
  - deliverable: "The fs census has rows for the per-file docs copy on both axes and reports no unclassified read"
    human_judgment: false
    verification:
      - kind: test
        ref: "install/installer-fs-census.test.ts (only the baseline openAsBlobSync case red)"
        status: pass
---

# Phase 43 Plan 06: Shipped docs in the kit home Summary

**An install now copies every shipped user page into `$GRUGOPS_HOME/docs/` and `$GRUGOPS_HOME/examples/` beside the kit, page by page from `shippedDocs()`, recorded as kit entries in the kit-home record, with any unrecorded folder at those paths kept as a recorded `<entry>.bak.<ISO>` backup.**

Start 2026-11-18T01:36:44Z, end 2026-11-18T02:26:16Z (about 50 min). 2 tasks, 2 commits, 10 source and test files.

## Accomplishments

- `install/install-marker.ts`: `KIT_ENTRY_PATHS = [KIT_ENTRY_PATH, ...SHIPPED_DOCS_ROOTS]`, imported from kit-source.js. A `kit` entry may name any member. A kit-home `backup` may be `of` any member and must be named `<of>.bak.<ISO>`. The name check builds the prefix from the member (`isKitHomeBackupName`). Each refusal names the closed set. A record that names only `agent-factory` still parses.
- `install/install.ts` copyKit:
  - It loops over `KIT_ENTRY_PATHS` and decides the arm (fresh, replace or backup), the never-clobber check, the content record and the DRY_RUN lines for every entry before anything is written.
  - The kit keeps its literal `cpSync(join(GRUGOPS_SRC, "agent-factory"), staged, { recursive: true })`.
  - A docs entry is staged by the new `copyKitDocs`, one `cpSync` per shipped page into `<tmp>/<entry>/<rel>`, with `dereference`.
  - `shippedDocs` returning null is a verify that names the source, and the docs entries are then left as they are.
  - A failure at one entry leaves that entry as it is and does not stop the others.
- `writeKitHomeRecord(previous, made[], inPlace[], untouched[])` writes one record per run:
  - a kit entry for each entry now in place;
  - the previous kit entry for each entry the run left as it was, while owns still answers owned;
  - the previous backups that still hold, plus this run's backups.
- `dirsSameContent`'s file walker became the top-level `treeFiles`, shared with the new `shippedSameContent`, which is the `--update` identity test for a docs entry.
- The overlap guard now checks every kit entry against the target and reports a hit through the existing `install.js: the kit home … overlaps the target` message.
- Report lines: `copied docs → …`, `copied examples → …`, and `would-copy docs → …` under DRY_RUN.

## Task Commits

1. **Task 1 (tracer): install ships the user docs and examples beside the kit**: `49bfb5c9` (feat)
2. **Task 2: the census and the record pins account for the docs in the kit home**: `41f08110` (test)

## TDD Gate Compliance

- **RED (Task 1):** I added 5 installer-kit-home cases (2 existing ones re-pinned to the three-entry record, plus 3 new ones) and 3 new ledger cases, then ran them against the committed install.js and install-marker.js. 8 failed, each on its planned assertion. The target was `install/installer-kit-home.test.ts > plan 43-06 … > a fresh install copies every shipped page byte for byte, …`, which failed with `docs/GUARANTEES.md is not in the kit home: expected false to be true`. The record is `.planning/phases/43-story-and-layered-docs/.red/43-06-task1-red.json`, and `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). A first full-file record was refused as `invalid_record`, because vitest's TAP reporter printed multi-line failure messages that are not valid TAP. Re-running the one target with `-t … --silent` produced a clean report. **Semantic assessment:** the target ran and failed because install.js copied no shipped page; there was no load, syntax or fixture fault.
- **GREEN:** after `npm run build`, `npx vitest run install/installer-kit-home.test.ts install/ledger.test.ts` passed: 103/103.
- **RED (Task 2):** the census reported `UNCLASSIFIED install.ts:copyKitDocs:cpSync x1` on the DRY_RUN axis, the read axis and the committed-.js axis. After the rows were added, only the baseline `openAsBlobSync` case stayed red.
- **Commit shape:** the plan names one `feat(43-06)` commit for Task 1 and one `test(43-06)` commit for Task 2. I followed that and made no separate `test(...)` RED commit. The RED evidence is on disk and validated instead.

## Verification

| Command | Result |
|---|---|
| `npm run build && npx vitest run install/installer-kit-home.test.ts install/ledger.test.ts` | 103 passed |
| `npx vitest run install/` (every install test file, final tree) | 3114 passed, 1 failed (baseline `openAsBlobSync`), 1 skipped |
| `npm run freshness` | exit 0, 93 committed .js fresh |
| `npm run check:build-parity` | exit 0 after the Task 2 commit (red only while install.js/ts were uncommitted) |
| `npm run typecheck` | exit 0 |
| `npm run check:story-docs` | exit 0 |
| `node scripts/check-banned-claims.js` | exit 0 |
| `npm run freshness:hook-manifest` | exit 0 (install-marker.ts is not in the hook closure) |
| `npx vitest run scripts/check-foundation-guards.test.ts` | 343 passed, 1 failed: the baseline LANG-07 case (the untracked `~/` directory) |

Acceptance greps:
- `KIT_ENTRY_PATHS` appears 9 times in install-marker.ts.
- `shippedDocs(` appears 2 times in install.ts.
- The literal agent-factory `cpSync` appears once.
- `docs.bak` appears 2 times in installer-kit-home.test.ts.
- The census has 9 `install.ts:copyKit…` site rows, against 7 at base.

## Foundation-guard handoff

None. This plan adds no `scripts/` module and changes no `scripts/` import. Its one new edge is install-marker.ts → kit-source.js, inside install/. The whole-file run of scripts/check-foundation-guards.test.ts failed only on the baseline LANG-07 case named in 43-BASELINE.md.

## Same-wave re-runs

None. No gate or test went red on another wave-3 plan's files during this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The overlap guard covers every kit entry**
- **Found during:** Task 1.
- **Issue:** the guard compared only the kit root and the kit home with the target. With GRUGOPS_HOME=$HOME and the target at `$HOME/docs`, the new backup arm would have renamed the user's repository to `docs.bak.<ISO>` while install was writing into it.
- **Fix:** each kit entry's real path is checked against the target's real path: the entry is the target, lies inside it, or holds it. A hit is reported through the existing kit-home overlap message, so the message census is unchanged.
- **Test:** `a target that is $GRUGOPS_HOME/docs is refused before any write`.
- **Commits:** `49bfb5c9`, refined in `41f08110` (one message, and entry names compared instead of a recorded path).

**2. [Rule 3 - Blocking] Synthetic kit sources in install.test.ts lacked the shipped docs roots**
- **Found during:** Task 2.
- **Issue:** 81 install.test.ts cases went red. Their synthetic `$GRUGOPS_SRC` had no `docs/` or `examples/`, so `shippedDocs` returned null and the plan's verify ended each run INCOMPLETE (exit 3).
- **Fix:** a new `plantShippedDocsRoots(src)` creates the two roots, empty, read from `SHIPPED_DOCS_ROOTS`. It is called in `makeSyntheticSrc`, `copyCheckoutWithEditedRole` and `retiredProbeSource`. This follows the same rule as `plantRenderInputs` (29.2-01).
- **Not a regression:** one of the 81, `readUserFile: a unix socket is not-regular`, failed only because that run set a long scratch TMPDIR, which pushed the socket path over the length limit. It passes under the default TMPDIR.
- **Commit:** `41f08110`.

**3. [Rule 2 - Missing critical] Special-file cases at every kit entry**
- **Issue:** installer-special-files.test.ts states its rule as "every kit-home read path has a FIFO and a directory case", but its list held only the record and `agent-factory`.
- **Fix:** the list is now `[KIT_HOME_RECORD_REL, ...KIT_ENTRY_PATHS]`, so the count pin moved from 2 to 4, and `kitHomeWhereNow` finds `<entry>.bak.*`. All 25 kit-home cases pass.
- **Commit:** `41f08110`.

**4. [Rule 3 - Blocking] agents-record pins moved by this plan's text and refactor**
- The writeKitHomeRecord verify now names several backups ("the backup(s) … are unrecorded; remove them by hand when you no longer need them"). The REMOVAL_EXEMPT row and the NOT_INSTALLS_EXEMPT row were re-pinned to that sentence.
- `DOCTOR_REACH_SIZE` moved from 80 to 79. The census matches functions by identifier name. The doctor's own `rel` variables used to match the arrow `rel` declared inside `dirsSameContent`, which is now the top-level `treeFiles`. The doctor never called that walker, so the functions it actually reaches are unchanged. The reason is written beside the pin.
- **Commit:** `41f08110`.

**5. [Plan detail] The --update identity for a docs entry compares with the shipped pages, not a staged tree**
- **Why:** the plan said to compare with the staged tree. Under DRY_RUN nothing may be staged, and the preview must pick the same arm as the real run.
- **What it does:** `shippedSameContent` compares the entry with the shipped pages directly, on the same file list (`treeFiles`) and with the same fail-safe-to-differs rule as `dirsSameContent`. Plan 43-15 proves this arm.

**Total deviations:** 5 (2 Rule 2, 2 Rule 3, 1 plan-detail). **Impact:** each one is needed for safety or for the suite to stay green. No arm that belongs to plan 43-15 was proven here.

## Issues Encountered

- `install.test.ts` and the plan's install-wide run take several minutes, so they ran in the background with JSON reports.
- Failures were compared by file and test name against 43-BASELINE.md.

## Known Stubs

None.

## Threat Flags

None. The new surface (writes under `$GRUGOPS_HOME/docs` and `$GRUGOPS_HOME/examples`) is the one this plan's threat model covers:
- T-43-18: an unrecorded folder is kept as a recorded backup.
- T-43-19: pages are staged one by one, and checkout-only paths are asserted absent.
- T-43-20: the record admits only the closed set, and the backup name is checked.
- T-43-21: the target's state roots are unchanged, and the overlap guard is widened.

## Next Phase Readiness

Plan 43-15 can prove the replace, `--update`, DRY_RUN and prune arms for the docs entries and update the install guide. STORY-02 is shared with other plans in this phase, so it is not marked complete yet (requirements.ready-ids blocks it until every plan that declares it has a SUMMARY).

## Self-Check: PASSED

- All 10 modified files and the RED record exist.
- Commits `49bfb5c9` and `41f08110` are on HEAD.
