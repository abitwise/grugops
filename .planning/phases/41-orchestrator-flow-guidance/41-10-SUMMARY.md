---
phase: 41-orchestrator-flow-guidance
plan: 10
subsystem: tooling
tags: [queue, claim, now-running, sweep, runnable, wr-04]

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "The host claim.js and its generated region (plans 41-03, 41-05), and the stamps of note.js (plans 41-07, 41-12)"
provides:
  - "claimedEntryNames(queueRoot): one listing behind claimedCount and renderNowRunning, embedded in tools/grugops/claim.js"
  - "A row with `since` of `unknown` in now-running.md for every entry `free` counts, but for a tampered record"
  - "A sweep that judges a claim directory with no usable record by the directory's modified time, and a release that ignores the record"
affects: [41-11, the new gap plan for the root ladder]

actuals:
  tokens: 21426
  tasks: 2
  commits: 4
plan_head_before: 6ec8e10265dbe0390f0af1cb4fb84760ace4f069
plan_head_after: eee1aaf5c736018d4561da1f55cdaac5233169c1

tech-stack:
  added: []
  patterns:
    - "One listing feeds the count and the render, so the two cannot disagree"

key-files:
  created: []
  modified:
    - scripts/claim.ts
    - scripts/claim.js
    - scripts/claim.test.ts
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/claim.test.ts
    - scripts/runnable-ref/claim-read-sites.test.ts
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - .planning/phases/41-orchestrator-flow-guidance/41-REVIEW-DISPOSITION.md

key-decisions:
  - "The deferred-items.md entry on the takeClaim double fault is now covered by the sweep: a directory left with no record is reclaimed once it is past the TTL, so that slot no longer stays for good"
  - "`unknown` rows go last through a partition after the existing sort, because a parseable `at` such as `Wed, 01 Jan 2020 00:00:00 GMT` sorted after `unknown`; the one comparator stands"
  - "The render and the release loop ask for a directory before anything else, so a link directly under claimed/ is never read through and a stray file is never removed"

patterns-established:
  - "An unusable record shows only its directory name; no field of it reaches the table"

requirements-completed: [RUN-01, RUN-02]

coverage:
  - id: D1
    description: "An orphan claim directory shows a row, `free` agrees, and `sweep` frees it once it is past the TTL, on a lone host copy"
    requirement: RUN-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#an orphan directory past the TTL is reclaimed: the row goes and free rises"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#an orphan directory is a row with since unknown, and free counts it"
        status: pass
    human_judgment: false
  - id: D2
    description: "On one mixed fixture, the row count equals claimedCount minus the tampered entry, no forged field reaches the table, and two renders are the same bytes"
    requirement: RUN-01
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#one mixed fixture: the row count is claimedCount minus the tampered entry, and two renders are the same bytes"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#free and the table agree on a mixed queue, but for the tampered record, and the sweep frees what is past the TTL"
        status: pass
      - kind: unit
        ref: "scripts/now-running-freshness.test.ts#does NOT emit a tampered (multi-`at`) claim.md as a trusted now-running row"
        status: pass
    human_judgment: false
  - id: D3
    description: "A link or a FIFO at claim.md is never read or opened, in the render and in the sweep, and past the TTL the sweep leaves a link's target untouched"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#a link at claimed/<task>/claim.md is never read: the row shows nothing of it, and the TTL is the directory's"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#a FIFO at claimed/<task>/claim.md is never opened: the row shows nothing of it, and the TTL is the directory's"
        status: pass
    human_judgment: false
  - id: D4
    description: "The TTL edge of a directory: an age equal to the TTL stays, one millisecond older is reclaimed, and the age uses the unrounded mtimeMs"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#the TTL boundary of a directory: an age equal to the TTL stays, one millisecond older is reclaimed"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#the age uses the unrounded mtimeMs: a fraction of a millisecond decides, in both directions"
        status: pass
    human_judgment: false
  - id: D5
    description: "A claim directory with its subtask in done/ is released at any age, with or without a record, and reported apart from a reclaim; a stray file of that name stays"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#a record-less claim directory with its subtask in done/ is released at any age, never reclaimed (WR-04)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#a record-less claim directory with its subtask in done/ is released, reported apart from a reclaim"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#a stray file or a link in claimed/ stays, even with a done record of its name beside it (WR-04)"
        status: pass
    human_judgment: false
  - id: D6
    description: "READ-1 on claim.js holds over the moved sites, with UNREACHED still empty, and the generated regions are fresh"
    requirement: RUN-02
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/claim-read-sites.test.ts"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-11-05
status: complete
---

# Phase 41 Plan 10: Unusable claim records Summary

**`now-running.md` now shows every entry `free` counts but a tampered record, through one `claimedEntryNames` listing, and `sweep` frees a claim directory with no usable record once the directory's age passes `queue.stale_ttl_minutes`. WR-04 is fixed and the open count is 14.**

## Performance

- **Duration:** 27 min, most of it test runs
- **Started:** 2026-11-05T13:24:36Z
- **Completed:** 2026-11-05T13:51:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- The review's reproduction now ends well. On a lone host copy with an empty `claimed/orphan/` and a truncated `claimed/b/claim.md`, `now-running` wrote two rows with `since` of `unknown`, `free` printed `free 1`, `sweep` printed `swept 0`. With both directories aged 40 minutes, `sweep` printed `swept 2`, the table emptied and `free` printed `free 3`.
- `free` and the table can no longer disagree, because both start from `claimedEntryNames`. The one exception is a tampered record: T-23-01 stands, it has no row, and the next sweep reclaims it at any age.
- A claim directory with its subtask in `done/` is released at any age, whatever its record.
- A link or a FIFO at `claim.md` is never read or opened, in the render and in the sweep. Past the TTL the sweep removes the directory and leaves the link's target untouched.

## Task Commits

1. **Task 1: End-to-end tracer**
   - `7eb86c60` (test): failing orphan, truncated and `claimedEntryNames` cases
   - `9c3566dd` (feat): the listing, the row and the sweep by directory age
2. **Task 2: The whole class, the release path and the edges**
   - `8f343bb9` (test): the mixed fixture, the rewritten link and FIFO cases, the release, boundary and sort cases
   - `eee1aaf5` (feat): the release without a record test, the sort, the read-site pin and the disposition

Task 1 is a tracer. Its `<verify>` carries only `<automated>` and the mode is `end-of-phase`, so its verify ran again after the feat and the plan continued with no checkpoint.

RED for both tasks returned `RED_EVIDENCE_OK`. Task 1's target, `an orphan directory past the TTL is reclaimed`, failed on `claimed/orphan` still existing after the sweep. Task 2's target, `a record-less claim directory with its subtask in done/ is released at any age`, failed on `claimed/t` still existing. Both are the planned assertion, and GREEN started after each.

## Truths of 41-10

| Truth | State | Evidence |
| --- | --- | --- |
| A directory with no record, or a record with no `at:`, is a row with `since` of `unknown` | Holds | The orphan and truncated cases, host and unit |
| The same for an unparseable `at`, a link, a FIFO, a stray file and an unsafe name; the link and the FIFO are not opened | Holds | The mixed fixture, both files. The FIFO runs under a deadline |
| A tampered multi-`at` record has no row and is reclaimed at any age | Holds | T-23-01 passes unchanged; `a tampered record has no row` |
| The sweep reclaims a directory with no usable `at` past the TTL, and `free` rises | Holds | The host cases |
| A directory with its subtask in `done/` is released at any age, and reported as released | Holds | The release cases, host and unit |
| Age equal to the TTL stays; one millisecond older is reclaimed | Holds | The boundary case |
| The age uses the unrounded `mtimeMs` | Holds | The precision case, both directions |
| An empty `claimed/` is the header alone; one record-less directory is one row | Holds | `a record-less directory renders exactly one row` |
| Equal `since` sorts by task | Holds | `two claims with one since sort by task` |
| `unknown` sorts after every timed row, then by task | Holds | `an unknown row sorts after every timed row` |
| The render is byte-reproducible and `freshness:queue` is green | Holds | The mixed fixture renders twice; the gate exits 0 as a vacuous pass, because this repository has no `.grugops/queue/claimed/` tree |
| WR-04 reads `fixed`, and the open count is 14 | Holds | The disposition file |

Each new rule was also proved able to fail. Mutating the compiled module one rule at a time turned at least one case red each time: the directory guard in the release loop, `<=` to `<`, `Math.round` and `Math.floor` on `mtimeMs`, the directory check in the render, the directory check in the sweep, and the tampered skip. None of these mutations was committed.

## Files Created/Modified

- `scripts/claim.ts`, `scripts/claim.js` - `claimedEntryNames`, `claimStateOf`, `UNKNOWN_SINCE`, the render's row rule, the sweep's age rule and the release loop
- `scripts/claim.test.ts` - the new cases; three cases rewritten
- `scripts/runnable-ref/claim.ts`, `claim.js` - the region, the header's `sweep` line and the `refuseClaimLinks` comment
- `scripts/runnable-ref/claim.test.ts` - the host-copy cases
- `scripts/runnable-ref/claim-read-sites.test.ts` - `CLAIM_READ_SITES` 18 to 17, and one `pairsOf` argument
- `note`, `state-check`, `state-roll`, `trace-render` (`.ts` and `.js`) - stamp lines only
- `41-REVIEW-DISPOSITION.md` - WR-04 fixed, `open: 14`

## Decisions Made

- **The `takeClaim` double fault is now covered by the sweep.** The `deferred-items.md` entry says that when the removal after a failed record write also fails, the slot stays. That directory now shows a row and is reclaimed once it is past the TTL. `deferred-items.md` was left alone, as the plan says.
- **One comparator, then a partition.** The plan said to keep the comparator if the test holds. It holds for ISO values, and it fails for a parseable `at` that opens with a letter after `u`: `Wed, 01 Jan 2020 00:00:00 GMT` sorted after `unknown`. The sort line is unchanged. Two filters after it put the `unknown` rows last, and no line holding `localeCompare` was added.
- **`claimStateOf` is the one reading of a claim directory.** The render and the sweep both call it, so `usable`, `tampered` and `unusable` mean the same in both. `readClaimRecord` stays the only reader.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropping the record test would have let the release loop delete a stray file**
- **Found during:** Task 2
- **Issue:** The record test was also what stopped the loop at a non-directory. Without it, `claimed/stray` beside a `done/stray.md` reached `rmSync`, which removes a file or a link. The plan's truth is that such an entry stays.
- **Fix:** The release loop asks for a directory first. A case holds it, and removing the guard turns that case red.
- **Files modified:** `scripts/claim.ts`, `scripts/claim.test.ts`
- **Committed in:** `eee1aaf5`

**2. [Rule 2 - Missing Critical] The render asks for a directory before it reads a record**
- **Found during:** Task 1
- **Issue:** T-41-46 says nothing under `claimed/` is read through a link, and the plan names only `claim.md`. A link directly under `claimed/` would have put a record from outside the root into the table.
- **Fix:** Such an entry gets a row of its name alone. This also settles the render half of the `deferred-items.md` entry on links under `claimed/`. `free` still counts such a link, on purpose.
- **Files modified:** `scripts/claim.ts`, `scripts/claim.test.ts`
- **Committed in:** `9c3566dd`

**3. [Rule 1 - Bug] `unknown` did not sort last for every timed row**
- **Found during:** Task 2
- **Issue and fix:** See Decisions Made.
- **Committed in:** `eee1aaf5`

**4. [Rule 3 - Blocking] A third case had to be rewritten**
- **Found during:** Task 2
- **Issue:** The plan names two cases to rewrite. A third, `a link at claim.md is left alone, even with a done record beside it`, asserted what the release change removes.
- **Fix:** It now asserts the release and the untouched target. It still proves the link is not read, because nothing in that path opens it.
- **Files modified:** `scripts/claim.test.ts`
- **Committed in:** `8f343bb9`

**5. [Rule 1 - Bug] A comment went stale**
- **Found during:** Task 2
- **Issue:** The comment on `refuseClaimLinks` said `sweepQueue` reads through each entry. It no longer does. The function itself is unchanged, as T-41-46 requires.
- **Fix:** The comment now says what the refusal adds.
- **Files modified:** `scripts/runnable-ref/claim.ts`, `scripts/runnable-ref/claim.js`
- **Committed in:** `eee1aaf5`

---

**Total deviations:** 5 auto-fixed (3 bugs, 1 missing critical, 1 blocking)
**Impact on plan:** All five serve the plan's own truths. No scope creep.

## Issues Encountered

- `gsd check tdd-red-evidence` refused the first Task 1 record as `invalid_record`, because vitest's TAP output carries a multi-line `actual:` for an assertion on text with a newline. This is the problem plan 41-07 met. Task 1's target case now asserts `existsSync` first, and each RED ran that one case alone. The test's assertions are the same, in a new order.
- Between `9c3566dd` and `eee1aaf5`, four cases are red by design: the two link and FIFO cases of `scripts/claim.test.ts`, which Task 2 rewrites, and two pins of `claim-read-sites.test.ts`, which Task 2 moves.

## Test Results

- The Task 2 verify set: 4 files, 307 passed, 0 failed.
- `scripts/runnable-ref/` whole, plus `generate-runnable-embeds`, `flow-guidance-text`, `convergence-spine`, `decompose-spine`, `board-read`, `board-readonly`, `board-model`, `uat-gate-exit-contract`, `check-platform-shapes`, `check-foundation-guards`, `context-io-writer-set` and `worktree-dogfood`: 27 files, 3,698 passed, 20 failed. No EDQUOT line in the run.
- The 20 failed names, compared by name: the 12 Group B rows, unchanged, and 8 names found in `41-VALIDATION.md` § Known baseline reds. No other name failed.
- `install/install.test.ts`: 471 passed, 1 skipped.
- The row set of `scripts/runnable-ref/note-read-sites.test.ts` did not move. The regeneration changed only the stamp line of `note.ts`, and `SECOND_SOURCE` was not touched.
- The full suite was not run here. The orchestrator's end-of-wave gate runs it.

## Gates

All exit 0 on the content of `eee1aaf5`, run before that commit: `npm run build`, `npm run typecheck`, `node scripts/check-uat-oracles.js`, `npm run freshness`, `npm run freshness:runnable-embeds`, `npm run freshness:queue`, `npm run freshness:hook-manifest`, `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, `node scripts/check-state-paths.js`, `node scripts/check-diff-disposition.js`.

Every acceptance criterion printed its expected value. `git diff --quiet dabdcf9e` exits 0 for `scripts/context-io.ts` and `scripts/checkpoints.ts`. The T-23-01 case has no removed line.

## Residual Risk

- **A stray file and an unsafe name still hold a slot past the TTL.** Both now show in the table, but the sweep leaves them, as the plan says: a non-directory stays, and an unsafe name is never joined. The Orchestrator sees why `free` is low, and a human has to remove the entry.
- **A dot-named directory is now swept.** `free` always counted it, so past the TTL it is reclaimed and removed with its contents, as any claim directory is.
- **`cell()` escapes only backslash, pipe and newline.** An unsafe directory name reaches the table with other characters as they are, control bytes included. T-41-45 accepts the name through `cell()`, and a fresh session reads that file.
- **A damaged record on a live claim can be reclaimed past the TTL.** This is T-41-44: the sweep runs at session start only, and the directory must be past the TTL. A write inside the directory resets its age.

## Open Items

- RUN-01 and RUN-02 stay unchecked in `REQUIREMENTS.md`. Plan 41-11 also declares both, so `requirements.ready-ids` reports them blocked. RUN-02 also stays open through READ-1 Group B, whatever 41-11 does.
- Workflow 17 line 88 still describes the sweep without the directory-age rule. The kit text lands in plan 41-11.
- The `deferred-items.md` entry on links under `claimed/` stays open as written, though the render and the sweep no longer read through such a link. `free` still counts one.
- WR-03 stays open: a claim younger than the TTL still holds its slot for the session.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 41-11, which adds the kit text. The 12 Group B rows stay red until the new gap plan lands.

## Self-Check: PASSED

All 16 changed files are in the plan's `files_modified`, all four commits are ancestors of HEAD, and `git rev-list --count 6ec8e102..HEAD` is 4 at `eee1aaf5`.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-05*
