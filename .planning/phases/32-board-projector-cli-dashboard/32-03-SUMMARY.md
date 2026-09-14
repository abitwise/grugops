---
phase: 32-board-projector-cli-dashboard
plan: 03
subsystem: tooling
tags: [typescript, fs-watch, debounce, polling, read-verify-reread, staleness, node-stdlib]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-01's read seam and CLI skeleton — the three-arm SourceState, the six-source tuple, FIXED_SUBPATHS, parseArgs/main, and the D-14 timing constants declared but unwired"
  - phase: 31-uat-spec-integrity-and-admission
    provides: "the canonical-form admission posture this plan's ticket reader consumes through admit(), and the derive-the-set-assert-the-count discipline both pin moves here follow"
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "D-12's discriminated reader result, which SourceState and the carry-forward follow"
provides:
  - "readVerifyReread — stat, read, stat with BOTH halves of the agreement test and a bounded retry, so a torn read is a named reason rather than a rendered half-file"
  - "settleSource — the last-good carry-forward as a PARAMETER rather than module state, which is what makes every stale arm unit-drivable"
  - "STALE_REASONS / STALE_REASON_COUNT — the closed five-member reason set, derived in board-model.ts with StaleReason as its projection"
  - "all six sources read for real: tickets through the ONE frontmatter authority, the queue with claim.ts's tamper rules ported verbatim, the context index without any note body, traceability through the board's own comment pre-pass"
  - "the refresh loop — six directory watches (never recursive), a 250 ms debounce, a MANDATORY poll floor, a single-flight refresh, and a re-arm path driven by a named environment seam"
  - "`--json --watch` NDJSON: one complete JSON document per line per re-read"
  - "run() / main() — the process contract split, so a live loop can outlive the call that armed it"
affects: [32-04, 32-05, 32-06, 32-07, 32-08]

actuals:
  tokens: 32600
  tasks: 3
  commits: 11
plan_head_before: 56e5e894a6593e2e409d99edfa7a19c794678d1a

tech-stack:
  added: []
  patterns:
    - "Read-verify-reread with a two-part agreement test: size is the portable half, mtime catches the same-size rewrite, and neither is dropped in favour of the other"
    - "The carry-forward threaded as a parameter, so 'the board went unreadable while the queue stayed fresh' is a value a case constructs rather than a race a case provokes"
    - "A four-arm SourceOutcome that keeps ABSENT and FAILED apart, so a fresh checkout cannot show STALE forever"
    - "One refresh(), two triggers — the debounce and the mandatory poll enter the same function, because the poll path is the one that runs when the watch path is broken"
    - "A named environment seam for an arm the developer's platform cannot reach naturally, with the check-platform-shapes 'production callers set nothing' sentence"
    - "A RED baseline that MUTATES one mechanism to nothing and records which single case fails, so a passing debounce test is known to discriminate"

key-files:
  created:
    - scripts/board-read.test.ts
    - scripts/board-watch.test.ts
    - 32-03-RED-baseline.txt
    - 32-03-GREEN-proof.txt
  modified:
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The stale-reason set is FIVE, not the plan-stated four: `unreadable` (a partial parse) shipped in plan 32-01's config arm and dropping it would regress the malformed-dial path"
  - "STALE_REASONS is the authority and StaleReason is its projection, declared once in the pure module"
  - "The config dial is the ONE source with a fallback value, because CLAUDE.md C6 defines what the kit does with no usable dial"
  - "A stale arm's readAt is the LAST GOOD read, and an already-stale source keeps its original `since`"
  - "main() is the one-shot contract; run() is the process entry point, because a process must not exit while a loop is armed"
  - "Watch failures ride in the same readErrors list as read failures, so they reach the JSON document rather than only the loop's own list"
  - "The snapshot's `sources` record is typed per source (SourceValues), so plan 32-07 reads a ticket list without a cast"

patterns-established:
  - "Test seam as a parameter, not a mock: `ReadSeam.betweenReadAndStat` fires in the exact window an editor's save lands in, so a torn read is produced deterministically instead of raced for"
  - "PREMISE-first failure-mode cases: every case asserts the fixture REACHED the state before asserting anything about it"
  - "Derived-set pins moved only after the gate read the entrant and reported zero findings, in the same commit as the run that observed it"

requirements-completed: [DASH-04]

coverage:
  - id: D1
    description: "Every file read is stat, read, stat with a bounded retry; a torn read keeps the previous good value and is badged `torn`"
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reports `torn` after the retry bound when the file changes under every read"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the previous board and marks it `torn` when the board read is torn"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#retries a TRANSIENT tear and returns the bytes rather than giving up on the first"
        status: pass
    human_judgment: false
  - id: D2
    description: "An ENOENT, an EACCES and a partial parse each keep the last good value under their own badge; a path never seen is `unavailable` with no badge and no error"
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the previous board and marks it `enoent` when the file disappears after a good read"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the previous board and marks it `eacces` when the mode denies the open"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#marks a source `unreadable` when the bytes ARRIVED and the content did not parse (D-11)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#returns `unavailable` with NO stale field for a board that was never seen (D-13)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Staleness is per source: one unreadable source never hides a fresh board"
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#leaves the BOARD fresh when the QUEUE is unreadable — staleness is per source (D-12)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#leaves the BOARD fresh when another source is unreadable — staleness is per source (D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The queue reader ports claim.ts's tamper rules verbatim: a multi-`at:` record, a name outside the allowlist, a missing claim file and an `at`-less record are each refused"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#SKIPS a claim record carrying two `at:` key lines and names it in readErrors (T-32-05)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#skips a claimed directory whose name is outside the ported allowlist, without reading it"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#refuses `.` and `..` as task names — the rule readdirSync can never hand it (T-32-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tickets are admitted through the ONE frontmatter authority; a refused document is named by its refusal code and is not joined"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reports a REFUSED ticket by its refusal code and joins nothing for it"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#admits a conforming ticket and joins it"
        status: pass
    human_judgment: false
  - id: D6
    description: "`plans/traceability.md` is read through the board's own comment pre-pass, so its example row inside its own HTML comment yields no entry"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reads NO row from an example row inside the file's OWN html comment (D-03)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#reads ZERO rows from the REAL `plans/traceability.md`, whose only row shape is commented out"
        status: pass
    human_judgment: false
  - id: D7
    description: "The context source reads each task's index for presence and current state, and never a note body"
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#reads the INDEX and never a note body, on any re-read (D-17 rejected the notes block)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#reports each task's note count, live count and latest live note"
        status: pass
    human_judgment: false
  - id: D8
    description: "A burst of events inside the debounce window produces exactly one re-read, and the debounce is proven to discriminate against a no-op"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#coalesces FIVE events inside the window into exactly ONE re-read"
        status: pass
      - kind: other
        ref: "32-03-RED-baseline.txt / 32-03-GREEN-proof.txt — 5 reads before the window pre-fix, 0 before and 1 after post-fix"
        status: pass
    human_judgment: false
  - id: D9
    description: "The poll floor is mandatory: a re-read still happens with every watcher closed and none re-armed"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#re-reads on the poll tick with EVERY watcher closed and none re-armed"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#keeps polling — the floor is a period, not a single shot"
        status: pass
    human_judgment: false
  - id: D10
    description: "A watcher that errors is closed, named in readErrors and re-armed on the next poll tick, driven through a named environment seam"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#closes the watcher, names the directory in readErrors, and re-arms it on the next poll"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#carries the watch failure into the emitted document, not only into the loop's own list"
        status: pass
    human_judgment: false
  - id: D11
    description: "refresh() is single-flight: an overlapping trigger produces two sequential complete snapshots, never an interleaved one"
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-watch.test.ts#does not start a second read inside the first, and produces two COMPLETE snapshots"
        status: pass
    human_judgment: false
  - id: D12
    description: "`--json --watch` emits one complete JSON document per line and exits 0 on SIGINT"
    requirement: "DASH-04"
    verification:
      - kind: integration
        ref: "scripts/board-watch.test.ts#emits only complete JSON documents across two poll periods and exits 0 on SIGINT"
        status: pass
      - kind: unit
        ref: "scripts/board-watch.test.ts#writes one COMPLETE JSON document per line per re-read, and nothing else on stdout"
        status: pass
    human_judgment: false
  - id: D13
    description: "The Windows behaviour of fs.watch stays `UNKNOWN - verify` — nothing asserts it, and the mandatory poll is the fallback by construction"
    verification: []
    human_judgment: true
    rationale: "The claim is an ABSENCE — that no case asserts a platform this suite never runs on — and its discharge is the Phase 33 / CAP-02 windows-latest CI leg. A human reading the module docblock and 32-VALIDATION.md:106 is the only check available from this tree."

duration: 34 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 03: Honest reads and a calm refresh — Summary

**Every source now reports its own freshness and keeps its last good value across a torn read, an ENOENT, a denied open and a partial parse; all six sources read for real with the queue's tamper rules ported verbatim; and the dashboard grew a six-directory watch, a 250 ms debounce and a mandatory poll floor that share exactly one re-read path.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-14T09:17:34Z
- **Completed:** 2026-09-14T09:52:00Z
- **Tasks:** 3
- **Files modified:** 11 (4 created, 7 modified — counting the committed `.js` twins)

## Accomplishments

- **`readVerifyReread` — stat, read, stat, with both halves of the agreement test.** The size comparison is the portable half (a filesystem with one-second `mtime` granularity reports equal mtimes across a same-second rewrite) and the `mtimeMs` comparison catches the same-size rewrite the size comparison cannot see. Neither is dropped in favour of the other. Bounded at three attempts; ENOENT and EACCES are answered on the first stat rather than retried, because neither is a race a retry wins.
- **The carry-forward is a PARAMETER, not module state.** `readSnapshot(root, previous, seam)` threads each source's previous state into its own `settleSource` call, which is what makes every stale arm drivable from a unit test rather than provocable only by racing a writer. A stale arm's `readAt` is the last good read — the age the D-12 badge reports — and an already-stale source keeps its original `since` rather than resetting the clock every 250 ms.
- **D-13 held intact.** Absent-and-never-seen is `unavailable` with no badge and no read error; absent-after-seen is stale with reason `enoent`. On this repository today `queue` and `context` report `unavailable` and produce nothing on stderr, which is the state a fresh checkout is in.
- **All six sources read.** `tickets` through `admit` from the ONE frontmatter authority; `queue` with `scripts/claim.ts:270-306`'s tamper rules ported verbatim and cited by path and line range; `context` from the per-task `index.jsonl` with `currentState`'s supersede fold carried across and no note body touched; `traceability` through `stripHtmlComments` — the board's own pre-pass — so the example row inside the file's own comment yields no entry.
- **The refresh loop.** Six directory watches from D-14's explicit list, never with the recursive option; a 250 ms debounce measured against the four-directory-events-per-write probe; a mandatory 10-second poll no flag can disable; a single-flight `refresh()`; and a re-arm path driven through `GRUGOPS_BOARD_FORCE_WATCH_ERROR` because a macOS directory watch survives deletion and would never reach that arm on the developer's machine.
- **A RED baseline that discriminates.** `32-03-RED-baseline.txt` records the run with the debounce mutated to a no-op: 22 cases, exactly ONE failing, and it is the debounce's own. `32-03-GREEN-proof.txt` records the same suite green after the window landed. A debounce test that passes against a no-op proves nothing, and this pair is the measurement that this one does not.

## Task Commits

1. **Task 1 (RED): failing cases for read-verify-reread and the carry-forward** — `58a98ae7` (test)
2. **Task 1 (GREEN): read-verify-reread, per-source staleness, the carry-forward** — `54c1619d` (feat)
3. **Task 2 (RED): failing cases for tickets, queue, context, traceability** — `3b7fcffd` (test)
4. **Task 2 (GREEN): the four remaining sources** — `203609ab` (feat)
5. **Task 3 (RED): the watch loop with the debounce discriminated against a no-op** — `1c2f9b22` (test)
6. **Task 3 (GREEN): the 250 ms debounce** — `fdf8cc7e` (feat)
7. **Derived-set pin moves** — `14c7aae5` (test)
8. **Docblocks in the present tense** — `8e4ad2a4` (refactor)

9. **Plan metadata** — `12ed8627` (docs)
10. **The defect-ledger entry for deviation 1** — `2575d63c` (docs)
11. **The measured commit count** — this commit, which is the eleventh and says so

Each RED run was verified with `gsd-tools check tdd-red-evidence` and returned `RED_EVIDENCE_OK` (target_test_failed) before its GREEN commit was written.

## Files Created/Modified

- `scripts/board-read.ts` / `.js` — `readVerifyReread`, `settleSource`, `SourceOutcome`, `ReadSeam`, `isSafeTaskName`, `childPath`, `QUEUE_STAGES`, the four new source readers, `deriveOverallSource`, and `STALE_REASONS` / `STALE_REASON_COUNT` / `READ_RETRY_BOUND`
- `scripts/board-read.test.ts` — 44 cases across the four stale arms, the carry-forward, and the four sources
- `scripts/board-dashboard.ts` / `.js` — `WATCH_DIRS` / `WATCH_DIR_COUNT`, `FORCE_WATCH_ERROR_ENV`, `LoopDeps`, `createLoop`, `run`, and the SIGINT handler
- `scripts/board-watch.test.ts` — 22 cases over the loop, one of them the compiled `.js` driven as a child process
- `scripts/board-model.ts` / `.js` — `STALE_REASONS` as the type's authority, plus `TicketRecord` / `QueueRow` / `TraceRow` / `ContextTaskState` / `SourceValues` so `FactorySnapshot.sources` is typed per source
- `scripts/check-foundation-guards.test.ts` — the two derived-set pins
- `32-03-RED-baseline.txt` / `32-03-GREEN-proof.txt` — the debounce discrimination

## Decisions Made

1. **The stale-reason set is FIVE, not the plan-stated four.** See the deviation below. `STALE_REASONS` is declared in `board-model.ts` and `StaleReason` is derived from it, so the set and the type cannot disagree.
2. **The config dial is the one source with a fallback value.** `settleSource`'s `fallback` parameter exists for it alone: CLAUDE.md C6 defines what the kit does with no usable dial, so "no usable dial" has something to show. No other source has a defensible substitute, and inventing one would be the empty-board output state D-11 forbids.
3. **`main()` is the one-shot contract and `run()` is the process entry point.** The old `main()` returned an exit code the entry tail handed straight to `process.exit`, which would have killed a watch loop on the tick it was armed. `run()` returns either an exit code or a live `Loop`; `main()` collapses that for every caller that wants a frame and a code.
4. **Watch failures ride in the same `readErrors` list as read failures**, so a consumer reading the JSON document sees "the low-latency path for the queue is down" in the one place it already looks.
5. **`FactorySnapshot.sources` is typed per source** via `SourceValues`. A `Record<SourceName, SourceState<unknown>>` would have forced plan 32-07's renderer to cast, and a cast is a place a source can be read as the wrong shape with nothing saying so.
6. **The poll interval is never `unref`'d**, and no interval is created outside watch mode. An `unref`'d interval would let the process exit precisely in the state D-14's poll exists for — every watcher closed and the poll alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's `STALE_REASON_COUNT` of 4 contradicts the code plan 32-01 shipped**

- **Found during:** Task 1
- **Issue:** The plan specifies "a closed `as const` set of `enoent`, `eacces`, `torn`, `bounded`" and an acceptance criterion asserting `STALE_REASON_COUNT === 4`. Plan 32-01 had already shipped a fifth member, `unreadable`, in `board-model.ts`'s `StaleReason` type, and `readConfigSource` uses it for a malformed dial (T-32-09, pinned by `board-tracer.test.ts`'s "marks a MALFORMED config stale and keeps going" case). Implementing the literal four would either have required dropping `unreadable` — regressing the malformed-dial path and reddening an existing case — or declaring a four-member set beside a five-member type, which is exactly the set-literal drift class this repository has already paid for.
- **Fix:** `STALE_REASONS` is the five-member authority in `board-model.ts` and `StaleReason` is its projection; `STALE_REASON_COUNT` is 5 and is asserted equal to `STALE_REASONS.length` and to `5` as two separate cases, with the decision-not-a-bumped-constant message. `unreadable` is documented as its own sentence: the bytes ARRIVED and the content did not parse, which is D-11's "a partial parse" and which a human sent to look for a vanished file would be misled by. A separately named case exists for each of the five, not four.
- **Files modified:** `scripts/board-model.ts`, `scripts/board-read.ts`, `scripts/board-read.test.ts`
- **Verification:** `npx vitest run scripts/board-read.test.ts` — the three set cases and the five per-reason cases pass; `scripts/board-tracer.test.ts`'s malformed-config case still passes unchanged.
- **Committed in:** `58a98ae7` / `54c1619d`

**2. [Rule 3 - Blocking] Two derived-set pins refused the plan's new files**

- **Found during:** After task 3, on the full-suite run
- **Issue:** `TRIPWIRE_MODULES` (62) pins the `scripts/*.test.ts` census two-sided, and the canonical-frontmatter cutover set is derived from the import graph but asserted against a hand-typed list. Two new test modules and one new `canonical-frontmatter.js` importer turned `scripts/check-foundation-guards.test.ts` red. The plan named neither, exactly as plans 32-01 and 32-02 recorded happening to them.
- **Fix:** `TRIPWIRE_MODULES` 62 → 64, re-derived rather than incremented (`ls scripts/*.test.ts | wc -l` reports 64), with both entrants and their contents named. The cutover list gains `board-read.ts` with a paragraph recording that it admits tickets through the ONE authority rather than growing a second grammar, renders no spawn verdict, and takes nothing from the demoted parser — so the per-module assertion beneath it covers the entrant unchanged. Both moves landed in the same commit as the full-suite run that first observed them.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts` — 286 passed; full suite 70 files / 4544 passed.
- **Committed in:** `14c7aae5`

**3. [Rule 2 - Missing critical] The `Settled` shape carried one error where a directory source produces many**

- **Found during:** Task 2
- **Issue:** Task 1's per-source result carried a single `ReadError`, which is right for a file source and wrong for a directory one. One refused ticket and one tampered claim record are two findings, and the first would have hidden the second behind a badge naming neither.
- **Fix:** `Settled<T>` carries `errors: readonly ReadError[]`; `settleSource` keeps its single-error return (it settles one outcome) and `settledFrom` lifts it beside the per-entry errors. `readSnapshot` concatenates in `SOURCE_NAMES` order so the stderr summary reads the same way twice.
- **Files modified:** `scripts/board-read.ts`
- **Verification:** the refused-ticket and tampered-claim cases each assert their own named entry in a run where both are present.
- **Committed in:** `203609ab`

**4. [Rule 3 - Blocking] The dashboard's `node:fs` import list grew past the plan's five names**

- **Found during:** Task 3
- **Issue:** The plan's prohibition verification says the `node:fs` import lists stay within `existsSync`, `readFileSync`, `readdirSync`, `statSync`, `realpathSync`. Task 3 requires `watch`, which is not in that list. The prohibition's STATEMENT — "the dashboard holds no mutating `node:fs` symbol" — is unaffected: `watch` creates, moves, truncates and removes nothing.
- **Fix:** `watch` and `existsSync` are imported into `board-dashboard.ts` and the module docblock records that both are read-only and why the addition does not move DASH-06's answer: plan 32-06 derives the MUTATING symbol set rather than matching a hand-typed allow-list, so a read-only entrant is not a finding. Flagged for plan 32-06 below.
- **Files modified:** `scripts/board-dashboard.ts`
- **Verification:** `grep -nE 'node:(net|http|https|child_process|worker_threads)'` over both modules returns only the docblock lines naming the ban; `git diff --exit-code -- package.json package-lock.json` is clean (T-32-SC).
- **Committed in:** `1c2f9b22`

---

**Total deviations:** 4 auto-fixed (1 bug, 1 missing-critical, 2 blocking)
**Impact on plan:** None widened scope. One is a plan-versus-shipped-code contradiction resolved in the direction that keeps an existing behaviour; one is the bookkeeping this repository's derived-set discipline demands of every entrant; one is a shape correction the plan's own `<behavior>` requires; and one is a prohibition whose statement holds while its illustrative list was short by one read-only name.

## Issues Encountered

- **`gsd-tools state.add-decision` refuses a `--summary-file` outside the repository root.** The scratchpad path was rejected by its path guard. Worked around by writing the decision text to a temporary directory under `.planning/` and removing it after; no artifact was left behind.
- **Two acceptance criteria could not be satisfied literally, and neither was silently skipped.** (a) `STALE_REASON_COUNT` is asserted equal to `STALE_REASONS.length` and to **5**, not 4 — see deviation 1. (b) The `.` / `..` task-name criterion asks for a directory "called `..`" fed to the reader; `mkdir ".."` is impossible and `readdirSync` never returns `.` or `..`, so that arm is unreachable through the filesystem exactly as it is in `scripts/claim.ts:277`. It is asserted directly on the exported `isSafeTaskName` predicate, with the structural reason recorded in the case, and the "skipped without a filesystem access outside the root" half is driven for real with a name containing a space, through a seam that records every path the read touched.

## Notes for later plans in this phase

- **Plan 32-06 (the import-graph guard):** `board-dashboard.ts` now imports `watch` and `existsSync` from `node:fs`, and `board-read.ts` imports `admit` / `admittedValuesFor` from `./canonical-frontmatter.js` (whose own closure reaches only `./frontmatter.js`, which imports nothing). If that guard hand-lists five permitted `node:fs` names it will red on `watch`, which is read-only. Derive the MUTATING set, as D-21 says.
- **Plan 32-05 (conflicts) and 32-07 (the frame):** the top-level discriminant is derived in one place (`deriveOverallSource`) and published as `result.source` — read the field rather than re-deriving it, or the header badge and the JSON document become free to disagree. The six source names in `SOURCE_NAMES` are the six the D-12 badge renders, and every source's value is now typed.
- **The ticket schema is an open question this plan deliberately did not answer.** `CANONICAL_SCHEMA` is the KIT ADAPTER schema (`name`, `description`, `tools`, …). A ticket carrying ticket-shaped keys (`status`, `epic`, `size`) is refused with `unknown-key` and named on stderr rather than joined. That is the honest behaviour for a reader with one authority, and this tree carries no tickets at all today, so nothing is refused here yet — but shipping a ticket-writing workflow will need a DECISION about the schema rather than a paraphrase in the projector.
- **`agent-factory/config/factory.config.json` is deliberately not watched** — D-14's list does not name it, so the dial refreshes on the poll tick only.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 32-04 (the mutation corpus) and plan 32-05 (the seven conflict kinds) can both proceed: the snapshot's shape is unchanged at `schemaVersion: 1`, every source now carries a real value, and `conflicts` is still the empty list 32-05 fills.
- Full suite green on this tree: 70 files, 4544 passed, 2 skipped (pre-existing). `npm run typecheck`, `npm run build`, `npm run check:build-parity` and `npm run freshness` all green; freshness compares 64 committed `.js` files against a rebuild with zero drift.
- `node scripts/board-dashboard.js . --once --json` exits 0 with `schemaVersion: 1`, 13 columns and `board:ok tickets:ok queue:unavailable context:unavailable traceability:ok config:ok` — the tracer's wire is unbroken and four sources that were stubs now answer for real.
- **One concern carried forward, restated from 32-01 and 32-02 because it fired a third time.** Two derived-set pins moved in this plan. Every later plan that adds a tracked `.ts` file, a test module or a new importer of a watched module will move one of them again. Run the full suite before the final commit, not only the plan's own test file.

## Self-Check: PASSED

All ten named artifacts exist on disk (`scripts/board-read.{ts,js,test.ts}`, `scripts/board-dashboard.{ts,js}`, `scripts/board-watch.test.ts`, `scripts/board-model.{ts,js}`, `32-03-RED-baseline.txt`, `32-03-GREEN-proof.txt`) and all eight commit hashes above resolve in `git log`.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*
