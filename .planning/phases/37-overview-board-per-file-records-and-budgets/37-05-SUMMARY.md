---
phase: 37-overview-board-per-file-records-and-budgets
plan: 05
subsystem: state-budgets
tags: [host-runnable, state-check, nfr-index, integrity, progress-entries, rollable, move-only, lang-07]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-02: scripts/state-rules.ts with recordEntryNames and budgetEntryNames"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-04: state-check with every budget, --json, sanitized output, the outside-root rule and the read-only proof"
provides:
  - "parseNfrIndex (the one NFR index line grammar) and nfrIntegrityFindings (index and files checked in both directions) in scripts/state-rules.ts"
  - "progressEntries: the D-09 classification of the progress file's `##` headings into dated status entries and standing sections"
  - "rollableSurfaces, formatRollable, progressBytesFinding, moveOnlyFindings, doneRowCount and integrityFinding in scripts/state-rules.ts"
  - "state-check: NFR integrity findings, ROLLABLE lines, one MOVE-ONLY counts line per surface, and `rollable` and `moveOnly` in --json"
  - "StateFinding.budget and .unit are nullable. A finding about no budget prints `<rel>[:<line>]: <note> (<key>)`"
affects: [37-09, 37-10, 37-11, 37-13, 37-19]

actuals:
  tokens: 27857
  tasks: 2
  commits: 3
plan_head_before: 6e1b2b9acbd304244ceb206b8acf3775aee850c1
plan_head_after: 2653e11892c36b6c8361528a91c1e9b992f7682c

tech-stack:
  added: []
  patterns:
    - "An integrity rule takes the raw directory listing and applies recordEntryNames itself, so no caller can forget the keeper filter"
    - "Each state directory is listed once per state-check run, and every rule that reads it gets that same listing"
    - "A report line (ROLLABLE, MOVE-ONLY) never sets the exit code; the finding beneath it does, by the marker"

key-files:
  created: []
  modified:
    - scripts/state-rules.ts
    - scripts/state-rules.js
    - scripts/state-rules.test.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts

key-decisions:
  - "progressEntries only classifies headings: { date, heading, line } per dated entry and { heading, line } per standing section, with no entry span. LANG-07 gives the section-extent question one owner, scripts/frontmatter.ts, and the span version made state-rules.ts and its embedded copy two more owners. The span goes to plan 37-11 (deferred-items.md)"
  - "A dated heading needs a real calendar date: `## 2026-13-01` and `## 2026-02-30` are standing, so they never roll (D-09 prohibition)"
  - "An NFR index line that begins `- [NFR` after leading spaces is malformed, never skipped. The missing-file finding is filed under the identifier-derived path and carries no line, so shuffling the index cannot move it"
  - "An absent nfr-catalog.md counts as an index with no lines, so every NFR file is reported unindexed beside the absent-catalog finding. A catalog or nfr/ that resolves outside the root, or cannot be listed, is already a finding by name and is not compared"
  - "A move-only folder that resolves outside the root, or cannot be listed, is a `move-only-unlisted` finding. Its count prints `not listed` (null in JSON), and the pair is not compared"
  - "The progress file is read only when its lstat size is over budget, and the text is comment-blanked first. A file measured and then unreadable is exit 2"
  - "The JSON `moveOnly` entries are { live, archive, liveCount, archivedCount }, and `rollable` lists surface names in the fixed order done, progress"

patterns-established:
  - "Keep a host-runnable predicate out of the LANG-07 census: classify heading lines, and leave section extent to scripts/frontmatter.ts"

requirements-completed: [SPLIT-02, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "state-check checks nfr-catalog.md against memory-bank/plans/nfr/ in both directions with one grammar: missing file, unindexed file, wrong link, malformed line, bad file name, duplicate line and case collision each produce one finding. Keepers are never findings. WARN and exit 0 without the marker, exit 1 with it"
    requirement: SPLIT-02
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#nfrIntegrityFindings: the index and the NFR files in both directions (D-13, SPLIT-02)"
        status: pass
      - kind: unit
        ref: "scripts/state-rules.test.ts#parseNfrIndex: the one NFR index line grammar (D-13)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — the NFR index and the NFR files agree, checked on a host (plan 37-05, D-13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The expected NFR link is derived from the identifier and compared as a string. A link such as nfr/../../../etc/passwd is a link-mismatch finding and is never opened"
    requirement: SPLIT-02
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#nfrIntegrityFindings — an entry for NFR-001 whose link is %s yields one link finding"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#an unindexed file, a wrong link and a malformed line are each one finding"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-09 classification: a `##` heading that begins with a calendar ISO date followed by a space or the line end is a dated status entry. `## Standing directive 2026-10-21`, `### 2026-10-21 note` and `##2026-10-21` are not dated entries"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#progressEntries: only a `##` heading that begins with an ISO date opens a dated progress entry (D-09)"
        status: pass
    human_judgment: false
  - id: D4
    description: "ROLLABLE: 21 Done rows, or a progress file over 16,384 bytes holding a dated entry, print a ROLLABLE line naming `node tools/grugops/state-roll.js <root>`, and --json lists ['done', 'progress'] in fixed order. A progress file with standing sections only is not rollable, and its finding names each standing heading and memory-bank/50-decisions/"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#rollableSurfaces: when a roll is due (D-07, D-08, D-09)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — ROLLABLE: the surfaces the daily sweep rolls (plan 37-05, D-07, D-08, D-09)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Move-only: a name in both a live folder and its archive folder (.grugops/queue/done/, memory-bank/50-decisions/) is one finding naming both paths. A MOVE-ONLY counts line prints for each surface on every run, and keepers are never counted. On grugops's own tree the output has exactly two MOVE-ONLY lines, including `memory-bank/50-decisions: 1 live, 0 archived`"
    requirement: SPLIT-06
    verification:
      - kind: unit
        ref: "scripts/state-rules.test.ts#moveOnlyFindings: a move leaves one copy (SPLIT-06, v3.0 D-7)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#state-check.js — MOVE-ONLY: a move leaves one copy (plan 37-05, SPLIT-06, v3.0 D-7)"
        status: pass
      - kind: other
        ref: "node scripts/runnable-ref/state-check.js . (2 MOVE-ONLY lines, 50-decisions 1 live 0 archived, exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Concurrency edge (backstop truth): an NFR name the listing returned whose lstat then fails is reported by name as could-not-run (exit 2). It is never counted as present"
    requirement: SPLIT-02
    verification: []
    human_judgment: true
    rationale: "The window lies inside one process with no seam to pause it, so no spawned test can open it (plan Flagged assumptions). confirmListed in state-check.ts is held by review."

duration: 29min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 05: NFR index integrity, rollable surfaces and the move-only report Summary

**state-check now checks the hand-kept NFR catalog against the NFR files in both directions with one grammar, and derives every expected path from the identifier. It reports which surfaces a roll is due on, counting only dated `##` progress entries as rollable, and reports any record found in both a move-only folder and its archive. Its exit code still follows only the findings and the marker.**

## Performance

- **Duration:** about 29 min
- **Started:** 2026-10-22T09:12:33Z
- **Completed:** 2026-10-22T09:41:37Z
- **Tasks:** 2 (Task 1 tracer; Task 2 TDD: RED, then GREEN)
- **Files modified:** 8

## Accomplishments

- **One NFR index grammar.** `parseNfrIndex` reads `- [NFR-<digits>](<target>)`, followed by the line end or a space and text.
  - A line that begins `- [NFR` and does not match is malformed, including an indented one. It is never skipped.
  - `nfrIntegrityFindings` compares the index with the raw `nfr/` listing and applies `recordEntryNames` itself, so `.gitkeep` and `.DS_Store` are never reported.
  - It has seven finding keys: `nfr-missing-file`, `nfr-unindexed-file`, `nfr-duplicate-line` (one per identifier, naming every line), `nfr-link-mismatch`, `nfr-malformed-line`, `nfr-bad-file-name` and `nfr-case-collision` (one per case-fold group).
- **Paths come from identifiers.** The expected link is `nfrLinkTarget(id)`, compared as a string. Nothing in the rules module touches a path.
- **Findings about no budget.** `StateFinding.budget` and `.unit` are now `number | null` and `StateUnit | null`. `formatFinding` prints `<rel>[:<line>]: <note> (<key>)` for these findings, and budget findings print as before.
- **Dated progress entries (D-09).** `progressEntries` classifies each `##` heading. A heading whose text starts with a calendar ISO date followed by a space or the line end is a dated entry. Every other `##` heading is standing content.
- **Rollable surfaces (D-07, D-08).**
  - `rollableSurfaces` returns `done` when there are more than 20 Done rows. It returns `progress` when the file is over 16,384 bytes and holds at least one dated entry. The order is always done, then progress.
  - state-check prints `ROLLABLE  <surface>: <measured>, keeps <budget> (BUDGETS.<key>) — run node tools/grugops/state-roll.js <root>`.
  - When the progress file is over budget and has no dated entry, `progressBytesFinding` adds a note. The note names each standing `##` section and says they belong in `memory-bank/50-decisions/` as decision records.
- **Move-only (v3.0 D-7).**
  - `moveOnlyFindings` reports each record name found in both a live folder and its archive. The two surfaces are `.grugops/queue/done/` with `.grugops/archive/queue-done/`, and `memory-bank/50-decisions/` with `memory-bank/plans/archive/decisions/`.
  - state-check prints `MOVE-ONLY <live>: <n> live, <m> archived` for each surface on every run.
- **JSON.** `--json` now also carries `rollable` (surface names) and `moveOnly` (`{ live, archive, liveCount, archivedCount }`).
- **One listing per directory.** state-check lists each directory once per run and reads nfr-catalog.md once. The budget rule and the integrity rule therefore see the same names.
- **Concurrency arm.** If a name the `nfr/` listing returned cannot be lstat'ed by the time the index check runs, state-check exits 2 and names it.

## Task Commits

1. **Task 1 (tracer): the NFR index and the NFR files agree, checked on a host:** `0f361c4e` (feat)
2. **Task 2 RED: failing cases for dated progress entries, rollable surfaces and the move-only report:** `7e1cce8d` (test)
3. **Task 2 GREEN: state-check reports rollable surfaces, dated progress entries and move-only copies:** `2653e118` (feat)

**Plan metadata:** recorded in the docs(37-05) completion commit.

## TDD Gate Compliance

- RED `7e1cce8d` comes before GREEN `2653e118`. There is no REFACTOR commit.
- **RED run:** 26 tests failed across state-rules.test.ts and state-check.test.ts. All 26 were AssertionErrors on the planned behavior:
  - The placeholder rules returned empty values.
  - state-check printed no ROLLABLE or MOVE-ONLY lines, and its JSON had no `rollable` or `moveOnly` fields.
  - One failure reads as "invalid combination of arguments". It is `toContain` called on the placeholder's absent note, so it is still the missing behavior and not a fixture fault.
- **Not run:** the tdd-red-evidence classifier. `workflow.tdd_mode` is false, and the plan is `type: execute` with one `tdd="true"` task. The semantic assessment above comes from the real run.
- **Tracer gate (Task 1):** the run is interactive with `end-of-phase` mode, and the tracer's `<verify>` has `<automated>` steps only. So the gate re-ran verify instead of stopping: build, typecheck, 3 test files with 160 passed, freshness, and the own-tree run (exit 0). All passed, and the plan went on to Task 2.

## Files Created/Modified

- `scripts/state-rules.ts`, `.js`: the NFR grammar and integrity rule, `integrityFinding`, the nullable budget, the no-budget `formatFinding` form, `progressEntries`, `doneRowCount`, `rollableSurfaces`, `formatRollable`, `progressBytesFinding` and `moveOnlyFindings`. `doneRowFindings` now shares `doneRows` with `doneRowCount`.
- `scripts/state-rules.test.ts`: unit cases for every behavior line and edge truth (adjacency, empty, ordering, keepers, calendar dates).
- `scripts/generate-runnable-embeds.ts`, `.js`:
  - new state-layout roots `DECISIONS_REL`, `DECISIONS_ARCHIVE_REL`, `QUEUE_DONE_REL` and `QUEUE_DONE_ARCHIVE_REL`;
  - new state-rules roots `recordEntryNames`, `parseNfrIndex`, `nfrIntegrityFindings`, `progressEntries`, `doneRowCount`, `rollableSurfaces`, `formatRollable`, `progressBytesFinding`, `moveOnlyFindings` and `integrityFinding`.
  EMBED_SPEC_COUNT is unchanged at 1.
- `scripts/runnable-ref/state-check.ts`, `.js`:
  - the header now describes the new checks, the report lines and the JSON fields;
  - new functions `listDirectory`, `nfrFindings`, `confirmListed`, `progressReport` and `moveOnlyReport`;
  - `boardFindings` now returns the Done row count, and the output now carries the report lines and JSON fields;
  - the generated region is regenerated.
- `scripts/runnable-ref/state-check.test.ts`: the host cases for NFR integrity, ROLLABLE and MOVE-ONLY. Existing cases were adjusted to the MOVE-ONLY lines, the new JSON fields, a budget-line helper that reads only WARN and FINDING lines, and an NFR planter that also writes its index line.

## Decisions Made

See `key-decisions` above. The main one is the LANG-07 scope change described under Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] progressEntries returns no entry span, because LANG-07 allows one owner for section extent**
- **Found during:** Task 2, the first GREEN run of the related censuses
- **Issue:** the plan asked for `{ date, heading, startLine, endLine }`, with each entry running "from its heading to the line before the next `##` heading". `check-foundation-guards.test.ts` (LANG-07, SECTION_EXTENT_OWNERS) then derived three section-extent owners: frontmatter.ts, state-rules.ts and state-check.ts. The census says such a finding "is escalated, never added to this list". Separately, the census `[B1] blast radius` pin, which counts declarations that apply a recogniser, rose from 1 to 3.
- **Fix:** `progressEntries` now only classifies headings, with no extent. It returns `{ date, heading, line }` per dated entry and `{ heading, line }` per standing section. The rollable rule and the D-09 note need nothing more. The span is left to plan 37-11, which restates the same extent rule for `planProgressRoll`. The conflict is recorded in deferred-items.md with the decision it needs.
- **Files modified:** scripts/state-rules.ts, scripts/state-rules.test.ts, the regenerated state-check region
- **Verification:** check-foundation-guards.test.ts passes, and SECTION_EXTENT_OWNERS is back to frontmatter.ts alone.
- **Committed in:** 2653e118

**2. [Rule 1 - Bug] The new test title spelled `status`, which made state-rules.test.ts a second ticket-frontmatter reader in the census**
- **Found during:** Task 2, the same census run
- **Issue:** `validate.test.ts` counts ticket-frontmatter readers by which string literals a file contains. state-rules.test.ts already had the literal `column` in a test title, so the new title "… opens a status entry" put both key spellings in one file and made it a second reader.
- **Fix:** the title now reads "… opens a dated progress entry".
- **Committed in:** 2653e118

**3. [Rule 2 - Missing critical] The nfrBytes planter writes its index line**
- **Found during:** Task 1
- **Issue:** the 37-04 planter put an NFR file with no index line. Once the integrity check existed, that case broke two rules where it should break one.
- **Fix:** the planter appends the matching catalog line.
- **Committed in:** 0f361c4e

**4. [Plan detail] nfrIntegrityFindings takes a fourth argument, nfrDirRel**
- The plan's signature was `(indexRel, parsed, fileNames)`. The rules module spells no state path, so the NFR directory is passed in.
- A unit case confirms that the link grammar's `nfr/` next to the catalog is `NFR_DIR_REL`.

---

**Total deviations:** 4 (1 blocking, 1 bug, 1 missing critical, 1 signature detail).
**Impact:** every must-have truth of this plan holds. The span half of one Task 2 behavior line, "each entry spans …", was not built, and it now waits on plan 37-11 and a human decision about LANG-07.

**Census pins:** none moved. No file was added. check-foundation-guards, check-state-paths, nonblocking-reader-parity and mode-census all pass unchanged.

## Issues Encountered

- Bootstrap order, as in 37-04: run `npm run build` before `npm run generate:runnable-embeds`, because the generator runs from its committed `.js`. The new roots went into EMBED_SPECS first and the region was regenerated before the hand-written part named them, so no placeholder declarations were needed.

## Verification

- `npm run build` and `npm run typecheck`: exit 0.
- Plan verification 1, with the census suites added: `npx vitest run scripts/state-rules.test.ts scripts/runnable-ref/state-check.test.ts scripts/generate-runnable-embeds.test.ts scripts/validate.test.ts scripts/check-foundation-guards.test.ts scripts/check-state-paths.test.ts scripts/nonblocking-reader-parity.test.ts install/mode-census.test.ts --maxWorkers=1` gave 8 files and 758 passed.
- Related censuses: board-readonly, uat-gate-exit-contract, context-io, context-io-writer-set, freshness, uat-spec-integrity and check-platform-shapes. 14 failed (2 + 7 + 5), all in the 37-BASELINE list, which is the same tally 37-04 recorded. Nothing new.
- Plan verification 2: `node scripts/runnable-embeds-freshness.js` reported 1 target fresh, and `npm run freshness` exited 0.
- Plan verification 3: `node scripts/runnable-ref/state-check.js .` exits 0 and prints the two MOVE-ONLY lines and `No findings.`. `--json` exits 0 and prints one parseable document.
- These guards all exit 0: `check-state-paths`, `check-foundation-guards`, `check-nul-bytes` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`.
- Acceptance criteria, all as expected:
  - `export function parseNfrIndex` in state-check.ts: 1.
  - `^import ` in state-rules.ts: 0.
  - `MOVE-ONLY` lines on the own tree: 2.
  - The `50-decisions: 1 live, 0 archived` grep: 1.
  - `export function progressEntries` in state-rules.ts: 1.
- Not run: the full non-e2e suite. Per the project rule, plans 37-08, 37-13 and 37-19 run it.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 37-11 needs a decision first** (deferred-items.md): where each progress entry's extent comes from. LANG-07 allows one owner, frontmatter.ts `sectionEndIndex`. An embedded copy of that code in state-roll.ts would also be counted as an owner, unless a human rules that a freshness-proven generated region is not a second owner.
- The validator's own progressBytes finding has no D-09 note. state-check alone adds it, through `progressBytesFinding`, and the validator still calls `fileBytesFinding`.
- state-check is still not copied into `tools/grugops/` by the installer, so the ROLLABLE line names a runnable that later plans ship.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All eight modified key files exist on disk. Commits 0f361c4e, 7e1cce8d and 2653e118 are ancestors of HEAD. Every acceptance criterion and plan verification command above passed.
