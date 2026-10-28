---
phase: 38-install-migrate-v3
plan: 04
subsystem: install
tags: [migrate, nfr-split, nfr-index, traceability-archive, conservation-proof, tdd]

requires:
  - phase: 38-install-migrate-v3
    provides: "38-02: planStateMigrate, proveStateMigrate, the module embed (sectionEndIndex, parseNfrIndex, nfrLinkTarget, indexLineFindings, fileBytesFinding); 38-03: runStateMigrate executes any planned writes and archive moves"
provides:
  - "install/state-migrate.ts: the NFR split (one nfr/NFR-xxx.md per table row, the notes residue in PRE_V3_NFR_NOTES_REL, the new catalog as the kit seed plus one index line per row), the traceability archive move and kit-seed write, NFR_NOTES_TITLE, provenanceLine's `source` parameter, five new generated-line kinds"
  - "NFR refusals (no Category or Target header cell, two rows with one ID, a planned NFR file already in the pre-v3 tree, a catalog that is not UTF-8 or mixes line endings) and NFR budget findings (indexEntryBytes, nfrBytes)"
  - "The stage-A proof covers the catalog as its own multiset, with templates derived from the inputs and bound to file and line"
  - "install/migrate-v3.test.ts case (M5); install/state-migrate.test.ts (S8) cases"
affects: [38-05, 38-06, 38-09, 38-11]

actuals:
  tokens: 24470
  tasks: 2
  commits: 4
plan_head_before: 6ecbc8b0d070b05e96d1ef0723149f31a932d7b7
plan_head_after: 5df815eef86791cca05a620df83e3793d5ff6921

tech-stack:
  added: []
  patterns:
    - "Each generated-line kind is bound to the file and the lines it may sit on, and its template comes from the inputs (catalog, kit seeds), never from the plan"
    - "One multiset per original (board, NFR catalog), so a line of one can never balance a loss in the other; a seed-only file (traceability) must be all declared seed lines"
    - "Line 3 of each NFR file is anchored to its own row before the multiset, so a copied row is named where it was copied"

key-files:
  created:
    - .planning/phases/38-install-migrate-v3/38-04-SUMMARY.md
  modified:
    - install/state-migrate.ts
    - install/state-migrate.js
    - install/state-migrate.test.ts
    - install/migrate-v3.test.ts

key-decisions:
  - "Table rows are the contiguous run of `|` lines after the separator in the comment-blanked text; a row line that touches an HTML comment is not a row and goes to the notes file, with a plan note"
  - "A line goes to one place only: rows first, then single-ID sections; the header and separator lines always go to the notes file; a section's trailing blank lines stay in the notes residue"
  - "A heading names an ID when it holds a delimited `NFR-<digits>` token; a heading that repeats one ID still names one ID"
  - "The proof keeps a separate multiset for the NFR catalog, so a board line can never balance a catalog line"
  - "A catalog that is not valid UTF-8 or mixes LF and CRLF is refused, as the board already is (Rule 2)"
  - "The legacy catalog and traceability paths are derived as the inverse of movedRel (legacyRelOf), so no state path is spelled a second time"

patterns-established:
  - "provenanceLine(boardLine, date, source) names the board by default or the NFR catalog for PRE_V3_NFR_NOTES_REL"

requirements-completed: [MIGRATE-02, MIGRATE-03]

coverage:
  - id: D1
    description: "Each NFR row of the fixture catalog becomes nfr/NFR-xxx.md (header copy, separator copy, row, its own sections verbatim); the new catalog is the kit seed plus one index line per row, read by parseNfrIndex as one entry per file; state-check --json reports no nfr-* finding after a real --migrate"
    requirement: MIGRATE-02
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S8) nfr/NFR-005.md holds the header copy, the separator copy, its row, then its own section verbatim, and the plan proves"
        status: pass
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M5) --migrate splits the NFR catalog into one file per row with an index state-check accepts, and archives the catalog and the traceability file unsplit"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-05 archive half: the pre-v3 catalog and traceability file are archived unchanged; TRACEABILITY_REL is the kit seed's bytes"
    requirement: MIGRATE-02
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#(S8) the original catalog and the traceability file are archived unchanged, and the traceability file is the kit seed"
        status: pass
      - kind: integration
        ref: "install/migrate-v3.test.ts#(M1) and (M5)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The notes residue, header lookup by cell name, an escaped pipe kept verbatim, the commented example row, the refusals and the budgets"
    requirement: MIGRATE-02
    verification:
      - kind: unit
        ref: "npx vitest run install/state-migrate.test.ts -t NFR (22 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-09 over the catalog: the proof passes on the fixture plan and fails, naming file and line, on a dropped section, a row duplicated into a second file, a forged header copy and an index line declared over an original line"
    requirement: MIGRATE-03
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts#NFR proof: (four cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Wording of the NFR refusals, the notes title and the catalog provenance line (clear voice)"
    verification: []
    human_judgment: true
    rationale: "Voice and wording quality is a judgment no test asserts"

duration: 40min
completed: 2026-10-28
status: complete
---

# Phase 38 Plan 04: The NFR split and the traceability archive move Summary

**`install --migrate` now gives each pre-v3 NFR table row its own `nfr/NFR-xxx.md` (header copy, separator copy, row, and every `##` section naming that NFR alone). Every other catalog line goes verbatim, in order, to `archive/pre-v3/nfr-notes.md`. The new catalog is the kit seed plus one index line per row, with the cell text copied unchanged. The old catalog and traceability file are archived unsplit, and the traceability file is written as the kit seed. The stage-A proof covers the catalog as its own multiset.**

## Performance

- **Duration:** about 40 min (22 of it the full-suite run)
- **Started:** 2026-10-28T11:55:14Z
- **Completed:** 2026-10-28T12:34:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- On the frozen fixture, the planner writes 12 NFR files (NFR-005, -008, -003 and -011 also get their own sections), a 23,284-byte catalog with 12 index lines, and a 23,165-byte notes file. The notes file holds the title, `_Updated:` lines, comment block, header, separator, and the 4 sections that name no NFR or several. The proof passes.
- The planner refuses, naming the file and line: a header with no Category or no Target cell, two rows with one ID (both lines named), a planned NFR file already in the pre-v3 tree, and a catalog that is not UTF-8 or mixes line endings.
- overBudget adds 11 index lines over 200 bytes and 5 NFR files over 8 KiB. No line is shortened (D-07).
- The proof derives every NFR and seed template from the inputs and binds each kind to its file and lines. For example, an index line can only sit after the seed lines of the new catalog.
- After a real `--migrate` (M5), `nfr/` holds exactly one file per row, and parseNfrIndex reads one entry per file with no malformed line. The kit-source `state-check.js --json` reports no `nfr-*` finding.

## Task Commits

1. **Task 1 (tracer): end-to-end NFR split and traceability archive**
   - `2b4729b3` test(38-04): failing tracer tests (S8) and (M5); (M1) now expects the catalog and trace at their archive homes
   - `1827f762` feat(38-04): the split, the notes residue, the new catalog, the trace move and the proof extension. Tracer gate (interactive, end-of-phase, automated-only verify): `npm run build && npm run typecheck && npx vitest run install/state-migrate.test.ts install/migrate-v3.test.ts` was re-run green (50/50) before the commit. Expansion continued.
2. **Task 2 (tdd): the whole NFR rule**
   - `773669a3` test(38-04): 18 cases. 8 failed on assertions: header lookup by name, five refusals, budgets, and the copied-row attribution. 10 passed at once because Task 1 already built the residue and the proof.
   - `5df815ee` feat(38-04): header lookup by name, refusals, budgets, row anchoring

No REFACTOR commit: nothing needed cleaning up.

## TDD Gate Compliance

- RED and GREEN commits exist for both tasks (`test(38-04)` before each `feat(38-04)`).
- RED evidence: `gsd_run check tdd-red-evidence` returned `INVALID_RED (invalid_record)` on vitest's `tap-flat` output ("Malformed TAP"). Its YAML blocks carry multi-line `actual` values that the classifier does not parse. The classifier never authorized GREEN. `workflow.tdd_mode` is false for this project, so the gate is advisory. Semantic assessment, by hand: in Task 1 the target `(S8) the original catalog and the traceability file are archived unchanged…` failed on its `toContainEqual` assertion (archiveMoves lacked the catalog move). (S8)'s first case failed on the helper's `PREMISE: the plan writes …/NFR-005.md` throw, which is the absent behaviour, not a setup fault. In Task 2 all 8 failures were AssertionErrors on the planned behaviour (refusals missing, positional cells, no budget findings, the copied row named in the wrong file).

## Files Created/Modified

- `install/state-migrate.ts` (+ `.js`): NFR_NOTES_TITLE, five new kinds, `provenanceLine`'s `source`, legacyRelOf, readNfrCatalog/tableCells/planNfrSplit/nfrBudgetFindings, the trace move and write, and a proof regrouped per original with bound templates and row anchoring.
- `install/state-migrate.test.ts`: (S8) tracer cases and 18 whole-rule cases; the kinds pin is updated.
- `install/migrate-v3.test.ts`: (M5); (M1) checks the catalog and trace at their archive homes.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Catalog UTF-8 and line-ending refusals**
- **Found during:** Task 2
- **Issue:** The plan lists three refusals. A catalog that is not UTF-8 would decode with U+FFFD, and the NFR files would not be its bytes.
- **Fix:** The planner refuses it, as it does the board. A mixed-ending catalog is refused too. Both have tests.
- **Committed in:** `5df815ee`

**2. [Rule 2 - Correctness] Proof checks each NFR file's row**
- **Found during:** Task 1/2
- **Issue:** A multiset alone accepts a row placed in another NFR's file (T-38-09 misattribution). A copied row was also reported at its legitimate position.
- **Fix:** Line 3 of each NFR file must be its own row. It is anchored first, so the copy is the line named.
- **Committed in:** `1827f762`, `5df815ee`

**3. [Rule 1 - Bug] A planning ID in a printed fragment**
- **Found during:** Task 1 regression net (`install/message-references.test.ts` (a))
- **Fix:** The traceability write's source text no longer says "(D-05)".
- **Committed in:** `1827f762`

**4. [Expectation update] (M1) and the kinds pin**
- (M1) expected `nfr-catalog.md` and `traceability.md` unchanged at their moved paths, which is the behaviour this plan replaces. It now finds them at PRE_V3_NFR_CATALOG_REL and PRE_V3_TRACEABILITY_REL. The MIGRATE_GENERATED_LINE_KINDS pin lists the five new kinds.

---

**Total deviations:** 4 (2 Rule 2, 1 Rule 1, 1 expectation update). **Impact:** no scope creep. install.ts is unchanged: runStateMigrate already executes the new writes and moves.

## Issues Encountered

- Full suite (`npx vitest run --exclude '**/scripts/e2e/**'`, GRUGOPS_HOME and HOME set to a scratch directory, JSON report): 10,354 tests, 10,332 passed, 20 failed, 2 skipped. The 20 failures are exactly the 38-BASELINE.md set, in its 6 files. Nothing new failed.
- Plan verification: (1) the three named files pass (state-migrate, migrate-v3 and pre-v3-layout, all green); (2) `npm run freshness` (88 fresh) and `node scripts/runnable-embeds-freshness.js` (4 fresh) exit 0; (3) the branch is `main`. `node scripts/check-state-paths.js` also passes.

## Known Stubs

None. TRACEABILITY_REL is the kit seed by design (D-05). Plan 38-06's trace render fills it (D-18).

## Threat Flags

None beyond the register. T-38-09 is mitigated: the catalog has its own multiset, generated lines are removed by bound position, the residue is kept in order, rows are anchored, and the mutation tests cover a dropped section, a doubled row, a forged header copy and a forged index line. T-38-10 is accepted as planned: refusals name the file and line.

## User Setup Required

None.

## Next Phase Readiness

- Plan 38-06 runs trace-render after the commit renames (D-18). TRACEABILITY_REL holds the seed index until then.
- The dry run lists the new write and archive steps through the existing `plan.steps` loop.

## Self-Check: PASSED

- FOUND: install/state-migrate.ts, install/state-migrate.js, install/state-migrate.test.ts, install/migrate-v3.test.ts
- FOUND commits: 2b4729b3, 1827f762, 773669a3, 5df815ee
- Acceptance: `grep -c nfr-index-line install/state-migrate.ts` = 4; `-t M5` 1 passed; `-t notes` 26 passed; `-t NFR` 22 passed; `npm run freshness` exit 0.

---
*Phase: 38-install-migrate-v3*
*Completed: 2026-10-28*
