---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 04
subsystem: tooling
tags: [build-requests, budgets, validator, state-check, runnable-embeds, typescript, tdd]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-03: the full build-request grammar in scripts/build-request-model.ts (parseBuildRequestDocument, buildRequestIdOfFileName, BUILD_REQUEST_READ_MAX_BYTES)"
provides:
  - "BUDGETS.buildRequestBytes = 8192 (per file), BUDGET_COUNT 10, and the board contract's Budgets row"
  - "The validator and state-check measure every build-request record against the budget"
  - "checkBuildRequests in the validator and buildRequestFindings in state-check: every record through the one grammar"
  - "IntegrityKey build-request-refused"
affects: [45-07, 45-10]

actuals:
  tokens: 35233
  tasks: 2
  commits: 5
plan_head_before: c4c20e5e99a95842d982ae7f1f2ee2bfc8ef65fe
plan_head_after: 2ad9e2a156a7a6d52e7da1c05429cae26c323f4e

tech-stack:
  added: []
  patterns:
    - "A misnamed record is refused by asking the grammar with no text (parseBuildRequestDocument(\"\", name)), so the file is never opened and the code still comes from the one authority"
    - "A record is opened only after its own lstat says regular file within the reader ceiling; every other shape stays the budget pass's finding by name"

key-files:
  created: []
  modified:
    - install/state-layout.ts
    - scripts/state-rules.ts
    - agent-factory/contracts/board.md
    - scripts/validate-agent-factory.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/validate.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/read-sites.test.ts
    - scripts/validate-read-sites.test.ts
    - scripts/state-rules.test.ts
    - hooks/hook-entry.ts

key-decisions:
  - "The build-request budget is per file, 8 KiB, like the ticket, NFR and trace folders (research assumption A5, reversible); a folder total would need an archive path for finished requests, which nothing in scope provides. Open confirmation item for the 45-10 UAT"
  - "state-check's refusal note is `refused by the build-request grammar (<code>)`, not the bare code, so its line reads like the validator's; the code is still the only file-derived detail"
  - "A read the reader refuses (or a file that vanished after its lstat) is a build-request-refused finding with the reader's condition (`unopenable`, `above-ceiling`, `not-a-regular-file`), as upstream.js requests reports it, not a could-not-run exit"
  - "A record above BUILD_REQUEST_READ_MAX_BYTES is not opened in either program: its over-budget finding already names it"
  - "The validator follows a link at the folder itself as it does for the ticket, NFR and trace folders (statAt); state-check refuses it by the root-chain owner. Records inside the folder are lstat'ed in both, so a link or FIFO there is never opened"

patterns-established:
  - "A grammar refusal in the validator is an ERROR whatever the layout marker says; in state-check it follows the marker's severity like every finding"

requirements-completed: [BR-07, BR-01, BR-03]

coverage:
  - id: D1
    description: "BUDGETS.buildRequestBytes (8192, per file) spelled once and matched both ways by the board contract's Budgets table; BUDGET_COUNT 10"
    requirement: BR-07
    verification:
      - kind: unit
        ref: "install/state-layout.test.ts (the Budgets table against BUDGETS, both ways); scripts/state-rules.test.ts#fileBytesFinding"
        status: pass
    human_judgment: false
  - id: D2
    description: "The validator and state-check measure each build-request record: at the budget clean, one byte over a finding naming the file, 8,193 and 8,192; keepers and dot-named files never measured; folder-as-file and FIFO reported by name in bounded time"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#the build-request byte budget (plan 45-04, BR-07)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#the build-request byte budget (plan 45-04, BR-07, T-45-11, T-45-12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every build-request record is parsed by the one grammar in both programs: seven planted defects give one refusal naming the file and the code; an admitted request is clean; the planted marker line never reaches output; a FIFO named pipe is refused by name unopened; a link is the budget finding only"
    requirement: BR-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#every build-request file passes through the one grammar (plan 45-04, D-05)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#every build-request file passes through the one grammar (plan 45-04, D-05)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The v3.0.0 state-check prints `No findings.` for an oversized BR-1.md while the current one reports the budget (skips loudly without the tag); state-check names no clock and imports no process module"
    requirement: BR-07
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts#an oversized BR-1.md: this state-check reports the budget; the v3.0.0 state-check prints `No findings.`"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/state-check.test.ts#reads no clock and runs no process (plan 45-04 prohibition)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Per-file budget (not a folder total) is the right reading of BR-07's \"folder has a byte budget\""
    requirement: BR-07
    verification: []
    human_judgment: true
    rationale: "Recorded choice (research assumption A5); the plan lists it as an open confirmation item for the 45-10 UAT"

duration: 20min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 04: Build-request budget and grammar check Summary

**The build-request folder now has a per-file budget of 8 KiB (`BUDGETS.buildRequestBytes`), and both the structure validator and `state-check` measure every record against it and parse it with the one build-request grammar. A malformed or misnamed file is refused by file and code, with no file text in the output, and a FIFO or link in the folder is never opened.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-11-26T11:14:08Z
- **Completed:** 2026-11-26T11:34:43Z
- **Tasks:** 2 (both test first)
- **Files modified:** 30 (git diff, including compiled .js and regenerated regions)

## Accomplishments
- `BUDGETS.buildRequestBytes: 8_192` after `nfrBytes`, `BUDGET_COUNT` 9 → 10 (dated), the `### Budgets` row in agent-factory/contracts/board.md, and `buildRequestBytes` in `StateBudgets`, `UNITS` and `FileBudgetKey`.
- The validator's `checkBudgets` and state-check's main block measure `BUILD_REQUESTS_REL` with the existing `directoryFindings`. An absent folder is no finding, so v3.0.0 repositories stay clean.
- Validator `checkBuildRequests()` (run after `checkTickets`): `ERROR <file>: refused by the build-request grammar (<code>): <grammar sentence>`, whatever the layout marker says.
- state-check `buildRequestFindings()`: `<file>: refused by the build-request grammar (<code>) (build-request-refused)`, under the marker's severity. The state-check embed row gains scripts/upstream-model.ts and scripts/build-request-model.ts, plus `isCalendarDate`, `unfencedHeadingIndices`, `isTicketRef` and `HUMAN_STAMP_RE` for the parser's closure.
- The blind spot is pinned: the `v3.0.0` state-check.js prints `No findings.` for an 8,193-byte BR-1.md. The current one reports it.

## Task Commits

1. **Task 1: The per-file byte budget**: `a4e61843` (test, RED), `6d0b6cd4` (feat, GREEN), `fbd7a9d1` (fix: read-site pairs re-derived)
2. **Task 2: The one parser in both programs**: `26811b84` (test, RED), `2ad9e2a1` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 1 | `a4e61843`: 10 of 12 targeted tests failed | `6d0b6cd4` | none needed |
| 2 | `26811b84`: 19 of 24 targeted tests failed | `2ad9e2a1` | none needed |

RED evidence, classified by `gsd-tools check tdd-red-evidence`:
- **Task 1:** `RED_EVIDENCE_OK` (target_test_failed). Target: `scripts/validate.test.ts > the build-request byte budget > a file where the folder should be is an unmeasured finding naming the folder` (tap-flat reporter). Semantic assessment: the target ran and failed on its planned assertion (`expected [] to have a length of 1 but got +0`), because the validator did not measure the folder yet. The state-check target was not used: its assertion message carries multi-line stdout, which tap-flat cannot represent, and the classifier rejected it as `invalid_record`.
- **Task 2:** `RED_EVIDENCE_OK` (target_test_failed). This one used the vitest JUnit reporter, because every Task 2 assertion carries multi-line output. Target: `scripts/validate.test.ts#… > the refusal quotes no file text: a refused build-request file whose line is PLANTED-INJECTION-MARKER-45-04 never shows it`. Semantic assessment: the target ran and failed on the planned exit-code assertion (`expected +0 to be 1`). The validator printed `ALL CHECKS PASSED` because it did not parse build requests yet.
- Five Task 2 tests passed at RED as planned controls: the two admitted-request cases, the two link cases (already the budget's finding after Task 1), and the v3.0.0 comparison (the budget landed in Task 1). The no-clock guard test went in with GREEN. It is a regression guard for the plan's prohibition, so a RED commit was not possible for it.

## Decisions Made
See key-decisions in the frontmatter. The per-file reading of BR-07 is the one item a human should confirm at the 45-10 UAT.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The generator ran from its stale compiled copy, and the build refused to emit**
- **Found during:** Tasks 1 and 2 (GREEN)
- **Issue:** `noEmitOnError` blocked `npm run build` while the hand-written part named an embed the stale generator had not yet written.
- **Fix:** Task 1 stubbed the two hand lines, built, regenerated and restored them. Task 2 ran `npx tsc --noEmitOnError false`, then `node scripts/generate-runnable-embeds.js`, then `npm run build`. A second generation reported `0 changed`. No region was edited by hand.

**2. [Rule 3 - Blocking] The frozen hook manifest went stale**
- **Found during:** Task 1. install/state-layout.js is in the decider manifest.
- **Fix:** `npm run generate:hook-manifest`. The new hooks/hook-entry.ts and .js went in with `6d0b6cd4`, and scripts/floor-invariance.test.ts passed after the commits (136 tests).

**3. [Rule 3 - Blocking] Read-site pairs and a folder-row count moved (pins the plan did not list)**
- **Task 1 (`fbd7a9d1`):** the new listing moved the trace directory's `listDirectory` via from `<top>#2` to `<top>#3` in scripts/runnable-ref/read-sites.test.ts. The fixture now plants an admitted BR-1.md, and the folder and file joined the absent-is-correct list. STATE_CHECK_READ_SITES stays 18.
- **Task 2 (`2ad9e2a1`):** `readRegularFileOrNull` gained the via `buildRequestFindings#0` (three rows). In scripts/validate-read-sites.test.ts, `statAt` gained `checkBuildRequests#0`, and `lstatAt` went from one caller to two (`sizeFinding#0`, `checkBuildRequests#0`). The fixture plants BR-1.md. VALIDATOR_READ_SITES stays 5. The plan expected no validator pair to move, because reads go through stateRead. They did move, because the stat and lstat in checkBuildRequests are needed so a FIFO is never opened.
- **FOLDER_ROWS:** 9 → 10 in scripts/runnable-ref/state-check.test.ts, dated.

**4. [Rule 2 - Missing critical] A failed stat or lstat in checkBuildRequests is an ERROR by path**
- **Found during:** Task 2. The READ-1 fault table showed that a silent skip turned an EIO into a pass.
- **Fix:** `recordReadFailure` names the folder or the record and the code. Only ENOENT is absence.

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical).
**Impact on plan:** None of them changes the budget or the grammar. Each one registers a change the plan asked for, or makes it safe under READ-1.

## Issues Encountered
- vitest's tap-flat reporter cannot carry multi-line assertion messages. RED evidence came from a single-line target for Task 1 and from the JUnit reporter for Task 2.
- The full suite was not run, as the orchestrator instructed. Targeted runs, all green after the last commit: validate, state-check, read-sites, validate-read-sites, runnable-exit-contract, state-layout (1195); mode-census, path-spelling-census, check-foundation-guards, generate-runnable-embeds, nonblocking-reader-parity, check-state-paths, upstream, build-request-model, state-layout, state-rules (914); claim, claim-read-sites, note, note-read-sites, state-roll, trace-render (623); state-migrate, floor-invariance (passed).

## Verification
- `npm run freshness:runnable-embeds`, `npm run freshness` (97 .js fresh), `npm run freshness:hook-manifest`, `npm run typecheck`, `npm run check:state-paths`, `node scripts/check-foundation-guards.js`: all exit 0
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: ALL CHECKS PASSED. `node scripts/runnable-ref/state-check.js .`: No findings.
- Acceptance greps: `buildRequestBytes: 8_192` (state-layout.ts:198); `export const BUDGET_COUNT = 10;` (:215); `BUDGETS.buildRequestBytes` in board.md: 1; `directoryFindings(BUILD_REQUESTS_REL, "buildRequestBytes"`: 1 in each program; `"build-request-refused"` in state-rules.ts: 1; `function checkBuildRequests`: 1; `module: "scripts/build-request-model.ts"` in the generator: 2; `PLANTED-INJECTION-MARKER-45-04` in validate.test.ts: 1

## User Setup Required
None.

## Next Phase Readiness
- Plan 45-07 can extend `upstream.js requests`. state-check does not report ages, by the plan's prohibition.
- RUNNABLE_SET_STAMP moved again, as expected when embeds change.
- Open for the 45-10 UAT: confirm the per-file reading of BR-07's folder budget.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND commits on HEAD: a4e61843, 6d0b6cd4, fbd7a9d1, 26811b84, 2ad9e2a1
- FOUND: install/state-layout.ts, scripts/validate-agent-factory.ts, scripts/runnable-ref/state-check.ts, agent-factory/contracts/board.md
