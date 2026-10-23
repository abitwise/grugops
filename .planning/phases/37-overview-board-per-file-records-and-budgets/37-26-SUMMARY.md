---
phase: 37-overview-board-per-file-records-and-budgets
plan: 26
subsystem: testing
tags: [read-1, in-03, validator, fault-injection, budgets, d-17]

requires:
  - phase: 37-25
    provides: deriveReadSites, callingSites, classifiedFsCalls and the row pattern of the runnables' READ-1 table
  - phase: 37-20
    provides: the fault-injection harness (runFaulted, scriptUrl, treeDigest, hasNodeStack)
provides:
  - "READ-1 closed for scripts/validate-agent-factory.ts: five read functions (statAt, lstatAt, textAt, namesAt, canonicalBase) are its only node:fs reads, each treating only ENOENT as absent"
  - "IN-03 closed: an unreachable budget directory is an unmeasured finding under the marker (ERROR with it, WARNING without), and an unreadable layout marker is an ERROR by name"
  - "Recording helpers: kitExists, kitRead, stateExists, stateRead and stateListDir record one ERROR per path for any failure but ENOENT, whatever the marker"
  - "scripts/validate-read-sites.test.ts: the validator's READ-1 table (pin 5, both equalities, 18 EIO rows, existsSync census)"
  - "runFaulted takes an env option"
affects: [37-27, phase-38]

actuals:
  tokens: 18549
  tasks: 2
  commits: 3
plan_head_before: e6a0f78049d3fd61428d90e383dc76a4c041ae17
plan_head_after: 02dc7c3724314ed6e1dbc04a76f0e72014c6fe40

tech-stack:
  added: []
  patterns:
    - "A read primitive returns ok, absent (ENOENT only) or failed with its code; callers decide the finding, never the primitive"
    - "One per-path record set, so a path whose stat and read both fail is reported once"

key-files:
  created:
    - scripts/validate-read-sites.test.ts
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - scripts/fault-inject.test-support.ts
    - install/mode-census.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "Only ENOENT is absent; ENOTDIR is a failure, as state-check's locate decides (37-REVIEW IN-03's suggestion to read ENOTDIR as absent is not adopted: a path component that is not a directory is a malformed tree)"
  - "Read failures outside checkBudgets are ERRORS whatever the marker; inside checkBudgets they are unmeasured budget findings under the marker's severity, except the marker itself, whose read failure is an ERROR so it can never downgrade budget errors"
  - "An existence test that fails answers present, so the caller goes on to read the path; the per-path record set keeps that path at one ERROR"
  - "stateIsRegularFile was deleted: after Task 1 its three callers (all budget functions) read through statAt directly"
  - "The read-sites fixture takes its ticket from scripts/fixtures/board-snapshot (ABC-200.md) instead of planting a ticket literal, so the ticket-reader census in validate.test.ts does not count the new file as a second reader and needs no new exemption"

patterns-established:
  - "A validator read site is failed under every call expression that enters its read function, and each row must print an ERROR naming a path and the code"

requirements-completed: [SPLIT-04]

coverage:
  - id: D1
    description: "IN-03: with the D-14 marker an NFR directory behind a mode-000 directory is exit 1 with an ERROR naming it and EACCES; without the marker the same text is a WARNING and exit 0; a marker behind a mode-000 directory is exit 1 with an ERROR naming the marker; absent NFR directory and absent marker keep today's output byte for byte"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#IN-03: an unreachable state directory or layout marker is a named finding, never absent (plan 37-26, D-17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The validator has 5 derived read sites, one in each of the five read functions, no existsSync; the table equals the derived site keys and (site, via) pairs both ways; each of the 18 pairs failed with EIO is exit 1 with a path-named EIO ERROR, no pass line, no Node stack, fault fired, state tree unchanged"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate-read-sites.test.ts#READ-1 validator table: every derived read site fails as a named ERROR, never a pass (plan 37-26, D-17)"
        status: pass
      - kind: unit
        ref: "scripts/validate-read-sites.test.ts#READ-1 validator sites are derived and counted, and the table equals the derived set (plan 37-26, D-17)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An unlistable tickets directory and an unreadable role file are exit 1 with an ERROR by path (checkTickets no longer passes vacuously, checkRoleSections no longer skips)"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#READ-1: an unlistable tickets directory and an unreadable role file are ERRORS by path, never skipped (plan 37-26, D-17)"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-10-23
status: complete
---

# Phase 37 Plan 26: READ-1 and IN-03 in the structure validator Summary

**The validator now reads the file system only through five functions that treat ENOENT alone as absent, so an unreachable NFR, ticket or trace directory is a named budget finding, an unreadable layout marker is an ERROR that can no longer downgrade a migrated tree's budget errors to warnings, and an unreadable kit or state file is an ERROR by path. A derived table fails all 5 read sites under all 18 calling call expressions with EIO, and every row exits 1 with a path-named ERROR.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-10-23T16:14:56Z
- **Completed:** 2026-10-23T16:45:04Z
- **Tasks:** 2
- **Files modified:** 7 (1 created)

## Accomplishments

- `scripts/validate-agent-factory.ts`: `statAt`, `lstatAt`, `textAt`, `namesAt` (each `ok`, `absent` for ENOENT only, or `failed` with the code), `readFailuresRecorded` with `recordReadFailure`, the recording helpers, checkBudgets over the primitives, checkConfig over statAt and textAt, and canonicalBase naming a base it cannot resolve. `existsSync` is no longer imported.
- IN-03 closed by test (Task 1) and READ-1 closed for the validator by the table (Task 2).
- `runFaulted` takes `opts.env` (the validator takes its roots from the environment); the two fault names are set after it, so it cannot replace them.

## Task Commits

1. **Task 1: IN-03 end to end (tracer):** `9a5e6578` (fix)
2. **Task 2: every read through the primitives, and the table:** `2980730b` (fix), then `02dc7c37` (test: the tripwire pin, found by the regression run)

**Plan metadata:** this SUMMARY commit (docs)

Tracer feedback gate after Task 1: the run was interactive, `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` had only automated checks. After the commit the IN-03 cases (4 passed), the own-tree `--strict` run (exit 0) and `npm run -s freshness` (exit 0) were re-run, so the plan continued to Task 2 with no checkpoint.

## RED runs

- **Task 1** (the IN-03 cases against the validator at `e6a0f780`): 3 failed, 1 passed. With the marker, the NFR directory behind a mode-000 directory gave exit 0, `ALL CHECKS PASSED`, and no line naming `memory-bank/plans/nfr`. Without the marker: exit 0 and no line naming it. The marker behind a mode-000 directory: exit 0, no line naming the marker; the over-budget board printed as a WARNING beside `LAYOUT no layout marker at memory-bank/plans/.layout`, so the unreachable marker was read as absent and the board error was downgraded. The controls case passed on the old code (it pins today's exact stdout and stderr), and passes unchanged after the fix: absence did not move a byte.
- **Task 2** (the table and the two new validate.test.ts cases against `9a5e6578`): 18 failed, 10 passed (the budget-pass rows Task 1 had already fixed). The pin, both equalities, the existsSync census and the classification failed on the 13-site program; the canonicalBase rows exited 0 with `ALL CHECKS PASSED`; the tickets directory at mode 000 exited 0 with `ALL CHECKS PASSED` (checkTickets read zero tickets); the role file at mode 000 exited 0 with `ALL CHECKS PASSED` (its section check was skipped).

## Final validator site table

Lines are the committed `scripts/validate-agent-factory.js` at `02dc7c37`. Every outcome below was measured from a faulted run on the table's fixture (kit root this repository, state root a scratch tree with the D-14 marker and ticket ABC-200); every row exits 1. At d9fa837c the file had 13 read sites, five of them `existsSync`.

| Site key | Line | Via (line) | ERRORs (first shown) |
|----------|------|------------|----------------------|
| statAt:statSync#0 | 139 | kitExists#0 (204) | 54: `agent-factory/roles/agents-md-scribe.md: could not be inspected (EIO), so it was not checked` |
| statAt:statSync#0 | 139 | stateExists#0 (217) | 4: `memory-bank/plans/board.md: could not be inspected (EIO), so it was not checked` |
| statAt:statSync#0 | 139 | checkConfig#0 (546) | 4: `.grugops/factory.config.json: could not be inspected (EIO), so it was not checked` |
| statAt:statSync#0 | 139 | readLayoutMarker#0 (827) | 1: `memory-bank/plans/.layout: could not be read (EIO), so the layout could not be decided` |
| statAt:statSync#0 | 139 | boardFindings#0 (843) | 1: `memory-bank/plans/board.md: not measured ... (BUDGETS.boardBytes) — the file could not be inspected (EIO)` |
| statAt:statSync#0 | 139 | indexFindings#0 (869) | 2: `memory-bank/plans/nfr-catalog.md: not measured ... (BUDGETS.indexEntryBytes) — the file could not be inspected (EIO)` |
| statAt:statSync#0 | 139 | directoryFindings#0 (912) | 3: `memory-bank/plans/nfr: not measured ... (BUDGETS.nfrBytes) — the directory could not be inspected (EIO)` |
| lstatAt:lstatSync#0 | 148 | (one caller, sizeFinding) | 2: `memory-bank/60-progress.md: not measured ... (BUDGETS.progressBytes) — its size could not be read (EIO)` |
| textAt:readFileSync#0 | 157 | kitRead#0 (208) | 38: `agent-factory/roles/agents-md-scribe.md: exists but could not be read (EIO)` |
| textAt:readFileSync#0 | 157 | stateRead#0 (221) | 3: `memory-bank/plans/board.md: exists but could not be read (EIO)` |
| textAt:readFileSync#0 | 157 | checkConfig#0 (555) | 1: `agent-factory/config/factory.config.json: exists but could not be read (EIO)` |
| textAt:readFileSync#0 | 157 | readLayoutMarker#0 (835) | 1: `memory-bank/plans/.layout: could not be read (EIO), so the layout could not be decided` |
| textAt:readFileSync#0 | 157 | boardFindings#0 (852) | 1: `memory-bank/plans/board.md: not measured ... — the file could not be read (EIO)` |
| textAt:readFileSync#0 | 157 | indexFindings#0 (878) | 2: `memory-bank/plans/nfr-catalog.md: not measured ... — the file could not be read (EIO)` |
| namesAt:readdirSync#0 | 166 | stateListDir#0 (226) | 1: `memory-bank/plans/tickets: the directory could not be listed (EIO)` |
| namesAt:readdirSync#0 | 166 | directoryFindings#0 (921) | 1: `memory-bank/plans/tickets: not measured ... (BUDGETS.ticketBytes) — the directory could not be listed (EIO)` |
| canonicalBase:realpathSync#0 | 505 | checkConfig#0 (519) | 1: `<repo>: could not be resolved (EIO)` |
| canonicalBase:realpathSync#0 | 505 | checkConfig#1 (534) | 2: `<repo>: could not be resolved (EIO)` |

`UNREACHED_SITES`: empty, size pinned at 0. The kitExists and kitRead counts are below the fault counts because a path met twice (adapters.md, each workflow) is recorded once.

### Class table from the plan, final

| Site (plan line) | After this plan | Covered by |
|------------------|-----------------|------------|
| existsSync in kitExists | statAt; failure `could not be inspected (<code>)`, answers present | row statAt via kitExists#0 |
| readFileSync in kitRead | textAt; failure `exists but could not be read (<code>)` | row textAt via kitRead#0; validate.test.ts role-file case |
| existsSync in stateExists | statAt with recording; its marker and budget callers moved to the primitives | row statAt via stateExists#0; IN-03 marker case |
| readFileSync in stateRead | textAt with recording; budget callers moved to the primitives | row textAt via stateRead#0 |
| existsSync and readdirSync in stateListDir | namesAt with recording | row namesAt via stateListDir#0; validate.test.ts tickets-directory case |
| realpathSync in canonicalBase | ENOENT falls back silently; any other code is an ERROR, then falls back | rows canonicalBase via checkConfig#0 and #1 |
| existsSync and readFileSync in checkConfig | statAt and textAt; ENOENT stays the silent lean default | rows statAt and textAt via checkConfig#0; the existing EISDIR cases |
| statSync in stateIsRegularFile | deleted; its three budget callers read through statAt | rows via readLayoutMarker, boardFindings, indexFindings |
| lstatSync in sizeFinding | lstatAt, unchanged behavior | row lstatAt:lstatSync#0 |
| existsSync and readdirSync in directoryFindings | statAt and namesAt; unmeasured finding under the marker | IN-03 cases; rows via directoryFindings#0 |
| scripts/kit-model.ts reads | outside this file; unchanged | validate.test.ts:445 (unchanged) |

## Rewritten validate.test.ts cases

None. Every existing case passed against the new validator without change, including the two unreadable-config cases (`exists but could not be read` now carries `(EISDIR)` after it, which their regex still matches). Two describes were added (IN-03, 4 cases; READ-1, 2 cases); none was deleted or weakened.

## Mutation proofs (working tree only, each made after the task commits, then reverted with `git checkout --` and a rebuild)

- **(a) existsSync back in directoryFindings** (`if (!existsSync(abs)) return [];` before the stat), then `npm run build`. 8 failed: both NFR IN-03 cases (exit 0, no finding), the pin, both equalities, the existsSync census and the classification. The table row `statAt via directoryFindings#0` stayed green: on the table's fixture the directories exist, so the existence test answers true and the injected stat fault is still reported. The plan expected that row to fail; the census rows and the IN-03 cases are what catch this mutation.
- **(b) no record call in stateRead's failure arm**, then `npm run build`. 1 failed, exactly `textAt:readFileSync#0 via stateRead#0`: exit 0 and `ALL CHECKS PASSED`.
- **(c) statAt reads EACCES as absent**, then `npm run build`. 3 failed: the three unreachable IN-03 cases (with marker, without marker, the marker behind a lock).
- After the reverts `git status --porcelain scripts/validate-agent-factory.ts scripts/validate-agent-factory.js` was empty, `npm run -s freshness` reported 87 fresh, and the two test files were 220 passed.

## Regression

The plan's derived subset (its `git grep -l -E` keyword and inventory union, 33 files, the new test file staged): 3,888 tests, 11 failed, 3,876 passed, 1 skipped, 680 s, one worker. Ten failures are 37-BASELINE.md cases, the same ten plan 37-25 recorded: canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 and the six 31-29 cases (7). The eleventh was this plan's: check-foundation-guards' tripwire pins the number of `scripts/*.test.ts` modules (79), and the new test file made it 80. Re-derived with `ls scripts/*.test.ts | wc -l`, reason recorded beside the pin (`02dc7c37`); the whole check-foundation-guards test file was then re-run: 320 passed. `pgrep -fl vitest` was empty after each run.

Gates at the end, all exit 0: `npm run build`, `npm run typecheck`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` bare and `--strict` (ALL CHECKS PASSED), `npm run -s freshness` (87 fresh), `node scripts/check-foundation-guards.js`, `node scripts/check-state-paths.js`, `node scripts/check-nul-bytes.js`, and `install/mode-census.test.ts` (15 passed).

## Files Created/Modified

- `scripts/validate-agent-factory.ts` / `.js`: the primitives, the record set, the recording helpers, the budget pass, checkConfig and canonicalBase over the primitives; stateIsRegularFile deleted
- `scripts/validate-read-sites.test.ts` (new): the validator's READ-1 table, pin, equalities, census and classification
- `scripts/validate.test.ts`: the IN-03 describe (4 cases), the READ-1 describe (2 cases), `withMode000` and `mode000SkipReason`
- `scripts/fault-inject.test-support.ts`: `runFaulted` takes `opts.env`
- `install/mode-census.test.ts`: SCRIPTS_CHMOD_COUNT 37 -> 39, SCRIPTS_TEST_FILE_COUNT 79 -> 80, each with its reason
- `scripts/check-foundation-guards.test.ts`: TRIPWIRE_MODULES 79 -> 80, with its reason

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two census pins moved because files landed**
- **Found during:** Task 1 (mode census, scripts chmod count) and Task 2 (mode census, scripts test count; foundation-guards tripwire, found by the regression run)
- **Issue:** `withMode000` adds an access denial and a restore; `validate-read-sites.test.ts` is an 80th `scripts/*.test.ts`
- **Fix:** SCRIPTS_CHMOD_COUNT 37 -> 39, SCRIPTS_TEST_FILE_COUNT 79 -> 80 and TRIPWIRE_MODULES 79 -> 80, each re-derived (census failure message, `ls scripts/*.test.ts | wc -l`) with a dated reason; no predicate was changed
- **Files modified:** install/mode-census.test.ts, scripts/check-foundation-guards.test.ts
- **Committed in:** 9a5e6578, 2980730b, 02dc7c37

**2. [Rule 3 - Blocking] The table's fixture ticket comes from a fixture file**
- **Found during:** Task 2
- **Issue:** a ticket document planted as a literal in the new test made validate.test.ts's ticket-frontmatter-reader census count the file as a second ticket reader (4 failures)
- **Fix:** the fixture copies `scripts/fixtures/board-snapshot/memory-bank/plans/tickets/ABC-200.md`; no exemption was added and the census is unchanged
- **Files modified:** scripts/validate-read-sites.test.ts
- **Committed in:** 2980730b

**3. [Rule 2 - Test strength] The IN-03 control pins today's exact output**
- **Found during:** Task 1
- **Issue:** "today's output byte for byte" needed a reference that the old program also meets
- **Fix:** the control asserts the good fixture's whole stdout and stderr as measured at e6a0f780 (the scope line and the fixture's dispatch-table warning), with and without a valid marker; it passed on the old program and passes on the new one
- **Committed in:** 9a5e6578

**4. [Rule 1 - Wording] A failed read in the budget pass carries its code**
- **Found during:** Task 1
- **Issue:** board and index read failures said `the file could not be read` with no code
- **Fix:** they now say `the file could not be inspected (<code>)` or `the file could not be read (<code>)`, matching the IN-03 wording; no test matched the old text
- **Committed in:** 9a5e6578

---

**Total deviations:** 4 auto-fixed (2 blocking, 1 test strength, 1 wording). **Impact on plan:** no row, case or guard was weakened or skipped, and no site was moved to UNREACHED_SITES.

Plan-expectation differences, recorded and not changed: mutation (a) does not turn the `statAt via directoryFindings#0` row red (see above). The plan's behavior list named stateIsRegularFile using statAt with recording; it has no caller after Task 1 and was deleted.

## TDD Gate Compliance

Task 2 is `tdd="true"` and `workflow.tdd_mode` is off. RED was observed before the implementation (18 failed on their planned assertions, recorded above). The brief forbids a red commit (§3), so the tests and the fix share the `fix(37-26)` commit `2980730b`, as in plans 37-20 to 37-25. Task 1 (the tracer) also ran RED first and shares `9a5e6578`.

## Issues Encountered

- A first scratch derivation was run as `vitest run --root /`, which began scanning the whole file system; it was killed (no vitest process left) and the derivation was run with `node --experimental-strip-types` instead. Nothing in the repository was touched.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- READ-1 is closed by test for the validator, after the three runnables (37-25). Plan 37-27 runs the full non-e2e suite for the round.
- REQUIREMENTS.md rows were not flipped (brief §3).

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-23*

## Self-Check: PASSED

- FOUND: scripts/validate-read-sites.test.ts, scripts/validate-agent-factory.ts, scripts/validate-agent-factory.js
- FOUND: 9a5e6578, 2980730b and 02dc7c37 are ancestors of HEAD
- Acceptance: `-t IN-03` 4 passed; validate-read-sites.test.ts asserts the pin, both equalities and the existsSync census and passes; the three mutation proofs are recorded and `git status --porcelain scripts/validate-agent-factory.ts` is empty after them; the regression subset shows no failure outside 37-BASELINE.md once this plan's own tripwire pin was re-derived; `git grep existsSync -- scripts/validate-agent-factory.ts` prints nothing
