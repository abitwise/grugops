---
phase: 32-board-projector-cli-dashboard
plan: 22
subsystem: testing
tags: [typescript, vitest, fs-watch, wall-clock, spawned-process, live-timing, mutation-proof]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-03's watch loop — the poll floor, the debounce, the derived watch set and the GRUGOPS_BOARD_FORCE_WATCH_ERROR seam this suite drives"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-19's one-current-record-per-directory watch state and the resolved-root arming, which the record case measures live"
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-20 and 32-21's guard work, so the spawned artifact is the one that shipped"
provides:
  - "scripts/board-watch-live.test.ts — five spawned-process cases timing the DASH-04 chain on a wall clock against a real filesystem event"
  - "A measured event-path latency (278/279 ms) attributed to the watch from BOTH sides: under the poll period and over the debounce"
  - "A measured poll-path latency with every watch forced dead (1003/997 ms), asserted to be OUTSIDE the event-path deadline so the seam is proved to have disabled the low-latency path"
  - "A live measurement of the WR-06 record lifecycle: published at 275/274 ms in the document and on stderr, cleared by the next re-arm at 900/888 ms"
  - "A pinned boundary: a watch failure the next tick repairs reaches NO document, because the re-arm precedes the emit"
  - ".planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt — two recorded runs, four mutation runs, the headroom table and the unmeasured platform"
affects: [32-23, board-projector, dashboard-watch-loop, phase-33-windows-leg]

actuals:
  tokens: 11759   # chars/4 over the realized diff of the four task commits (47,037 chars)
  tasks: 2
  commits: 4      # MEASURED git rev-list --count 7b0c17b1..HEAD at SUMMARY-write time; the SUMMARY commit and the metadata commit follow it
plan_head_before: 7b0c17b1c87aca4f416610385b4136d4dbd50369

tech-stack:
  added: []
  patterns:
    - "Measure the shipped artifact from outside: spawn the committed .js, read complete lines with their arrival timestamps, never import the module under test"
    - "Synchronise to the emit clock before timing: wait for a document, then write, so the next poll tick is a full period away and a fast delivery is attributable to the event path"
    - "Attribute from BOTH sides: a latency under the poll period AND over the debounce is the watch; a latency over the event deadline is the poll"
    - "Every wait carries a deadline and fails with the measured elapsed time, the arrival offsets, the document count and the platform"
    - "Bound a wall-clock assertion with an inequality over measured counts, never an exact number"
    - "Index the lower bound of an observation window, never the wall clock: a same-millisecond arrival otherwise lands on the wrong side of the burst"
    - "Name the platform in the failure and in the transcript; never in a condition that decides whether a case runs"
    - "Prove the negative assertion with the mutation that makes it true: an ordering claim is pinned by swapping the ordering"

key-files:
  created:
    - scripts/board-watch-live.test.ts
    - .planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt
  modified:
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The plan's 'the poll-delivered document carries a watch-failure record' is not true of the shipped program, and the honest answer is to MEASURE both regimes rather than to assert the untrue one: the poll tick re-arms before it emits, so a transient failure is invisible by design (WR-06), and the record is published through a still-living sibling watch instead"
  - "The transient-record invisibility is pinned as an assertion in the poll-path case rather than left as a paragraph, and mutation M4 (emit before re-arm) is what keeps that assertion from being vacuous"
  - "No case is platform-conditional. CI runs this file on windows-latest, and three of the five cases depend on the platform delivering directory events; a red there IS the Phase 33 / CAP-02 measurement arriving early, and the transcript says so rather than pre-empting it with a skip"
  - "The board contract was left unchanged: it carries no timing sentence to reconcile, and adding one on the strength of two runs on one platform is the conversion the plan's own instruction refuses"
  - "The TRIPWIRE_MODULES census pin was re-derived (ls scripts/*.test.ts | wc -l -> 69) and bumped AFTER the full-suite run that fired it, with its reason in the running log — the pin moved because a module landed, not to make a red go away"

patterns-established:
  - "A live timing suite states its budget WITH the arithmetic in its header, so a future case knows what it is spending"
  - "A measurement suite prints its numbers (MEASURED lines) so a transcript can be a capture rather than a retelling"

requirements-completed: []  # DELIBERATELY EMPTY. The plan's own success criteria forbid flipping DASH-04/DASH-05 to Complete: this plan closes a verification item, and the phase verifier owns the requirement verdict.

coverage:
  - id: D1
    description: "The directory watch delivers an atomic-rename edit to a live spawned dashboard inside one poll period and no faster than the debounce"
    requirement: DASH-04
    verification:
      - kind: integration
        ref: "scripts/board-watch-live.test.ts#delivers an atomic-rename edit in less than one poll period, and no faster than the debounce"
        status: pass
      - kind: integration
        ref: "mutation M1 (no watch armed) and M3 (no debounce) both turn this case red — 32-22-LIVE-TRANSCRIPT.txt"
        status: pass
    human_judgment: false
  - id: D2
    description: "With every watch handle failing, the mandatory poll alone still brings a real edit onto the screen within the configured period plus slack"
    requirement: DASH-04
    verification:
      - kind: integration
        ref: "scripts/board-watch-live.test.ts#still brings a real edit onto the screen within the poll period plus slack"
        status: pass
      - kind: integration
        ref: "mutation M2 (poll never starts) turns this case red — 32-22-LIVE-TRANSCRIPT.txt"
        status: pass
    human_judgment: false
  - id: D3
    description: "A watch failure is a diagnosable state: published in the emitted document and on stderr, and dropped when the next poll tick re-arms"
    requirement: DASH-05
    verification:
      - kind: integration
        ref: "scripts/board-watch-live.test.ts#publishes the failed directory's record, then DROPS it when the next poll tick re-arms"
        status: pass
      - kind: integration
        ref: "mutation M4 (emit before re-arm) turns the paired boundary assertion red — 32-22-LIVE-TRANSCRIPT.txt"
        status: pass
    human_judgment: false
  - id: D4
    description: "A burst of five real writes inside the debounce window produces fewer documents than writes, and at least one"
    requirement: DASH-04
    verification:
      - kind: integration
        ref: "scripts/board-watch-live.test.ts#coalesces 5 atomic-rename writes into FEWER documents, and at least one"
        status: pass
      - kind: integration
        ref: "mutation M3 (no debounce) produces 13 documents for 5 writes — 32-22-LIVE-TRANSCRIPT.txt"
        status: pass
    human_judgment: false
  - id: D5
    description: "The recorded transcript: two runs of seven measured values each, the headroom table, the four mutation verdicts, and the platform NOT measured"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt"
        status: pass
    human_judgment: true
    rationale: "Whether the transcript ANSWERS the verifier's human_verification item — as opposed to merely carrying numbers — is the judgment the next verification round exists to make, and it is the judgment this plan was written to serve."
  - id: D6
    description: "Windows fs.watch timing under this chain"
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify. Not measurable from this tree; the windows-latest leg is Phase 33 / CAP-02. The suite measures the platform it runs on and names it; it does not skip, and it does not claim the other."

# Metrics
duration: 42 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 22: The Watch Chain, Measured Live Summary

**The DASH-04 chain timed on a wall clock against a real atomic-rename write: the event path delivers in 278/279 ms, the poll alone delivers in 1003/997 ms with every watch forced dead, five writes coalesce to one document, and four mutations show every case can fail.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-09-15T12:21Z
- **Completed:** 2026-09-15T13:05Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## The verifier's item, answered

`32-VERIFICATION.md` left one `human_verification` item open:

> Exercise the directory-level `fs.watch` + mandatory poll floor + debounce over a multi-second
> window against a real edit (rename-based atomic write) to `plans/board.md`. Expected: the
> dashboard re-renders within the documented poll floor even if a watch handle is orphaned by the
> atomic rename, and a watch-arm failure surfaces as a diagnosable state rather than silently
> stopping updates.

It is now mechanical, and these are the numbers, taken twice on darwin/arm64 with Node v24.12.0
against the committed `scripts/board-dashboard.js` spawned as a child:

| What was exercised | Run A | Run B |
|---|---|---|
| Atomic-rename edit → new document, via the directory watch | 278 ms | 279 ms |
| The same edit with EVERY watch forced dead — the poll alone | 1003 ms | 997 ms |
| A watch failure published in the document and on stderr | 275 ms | 274 ms |
| That record dropped when the next poll tick re-armed | 900 ms | 888 ms |
| Documents emitted for five writes inside one debounce window | 1 | 1 |

The expectation holds in both regimes. The screen follows a real edit in under three tenths of a
second when the watch is alive, and just under one configured period when every watch has been
killed — so an orphaned handle costs latency, not currency. A watch failure that outlives one tick
is visible in the `--json` document and on stderr, carrying the sentence that promises a re-arm, and
the next tick keeps that promise.

The attribution is asserted rather than assumed, in both directions. The event-path case fails if
the delivery takes as long as a poll period (it would then be creditable to the poll) AND if it
arrives sooner than the debounce (a poll tick would then have answered). The poll-path case fails if
the delivery lands INSIDE the event-path deadline, which would mean the forced-error seam had not
disabled the watch and the case was measuring it twice.

## Accomplishments

- `scripts/board-watch-live.test.ts`: five spawned-process cases, ~7.9 s of wall clock for the whole
  file, each one editing the board the way `scripts/context-io.ts` `atomicWrite` edits files — a temp
  sibling then a rename over the target, which is the write path that orphans a file-level watch and
  the reason D-14 makes the poll mandatory.
- Every wait carries an explicit deadline and fails with the measured elapsed time, the document
  arrival offsets since spawn, the document count and the platform. No case can hang; the child is
  killed and the scratch tree removed in a `finally`, and an `afterAll` re-decides from `git status`
  that the committed fixture was never touched.
- Four mutation runs recorded in the transcript: no watch armed (3 red), no poll started (4 red), no
  debounce (2 red), and the poll tick emitting before it re-arms (1 red, on the boundary assertion).
- A boundary the plan assumed away, measured and pinned: a watch failure the next tick REPAIRS
  reaches no document at all, because `armAll()` precedes `refresh()` inside one tick and a
  successful re-arm deletes the record (WR-06).
- `.planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt`: two recorded runs
  with all seven values, the headroom beside each deadline, the four mutation verdicts, the
  unmeasured platform and the phase that owns it, and the contract reconciliation.

## Task Commits

1. **Task 1: the live, bounded, self-cleaning suite** — `5d5f97cb` (test)
2. **Task 1 (continued): the boundary the forced-watch run measured, pinned** — `5f9bd23a` (test)
3. **Task 1 (blocking fix): the test-module tripwire pin, 68 → 69** — `965b72c3` (test)
4. **Task 2: the recorded run, and the boundary stated rather than implied** — `ae39d606` (docs)

## Files Created/Modified

- `scripts/board-watch-live.test.ts` — the spawned-process live timing suite: one spawn helper, a
  premise case, the event path, the poll path alone, the watch-record lifecycle, and the debounce.
- `.planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt` — the recorded runs,
  the mutation transcript, the headroom table and what was not measured.
- `scripts/check-foundation-guards.test.ts` — `TRIPWIRE_MODULES` 68 → 69, re-derived with its reason
  in the running log the constant carries.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: the plan asked for an assertion that
the poll-delivered document carries a watch-failure record, and the shipped program does not do that
— by design, not by defect. Rather than assert something untrue or quietly drop the requirement, the
suite measures BOTH regimes and pins the boundary between them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The debounce window counted a document from the wrong side of the burst**

- **Found during:** Task 1, under mutation M1
- **Issue:** The observation window's lower bound was a wall-clock instant taken immediately after
  the synchronising document arrived. When both landed in the same millisecond the window included
  that earlier document, so a mutation that emitted NOTHING for the burst still reported a count of
  one and failed on the wrong assertion with a misleading number.
- **Fix:** The lower bound is now the recorded document INDEX taken before the first write; only the
  upper bound is a wall clock. The reason is recorded on `docsSince` so a future edit does not
  restore the ambiguity.
- **Files modified:** `scripts/board-watch-live.test.ts`
- **Verification:** M1 re-run reported "5 writes in 4 ms produced 0 document(s)", which is the honest
  number, and the case now fails on its own `>= 1` assertion.
- **Committed in:** `5d5f97cb`

**2. [Rule 2 - Missing Critical] The plan's watch-record assertion is not true of the shipped program**

- **Found during:** Task 1, Case Two
- **Issue:** The plan asked the poll-path case to assert that the document delivered by the poll
  carries a watch-failure record. Measured against the shipped loop, no document in that run carries
  one: a poll tick runs `armAll()` then `refresh()`, and a successful re-arm deletes the record
  (WR-06 — the record is a state, and a repaired watch has nothing current to report).
- **Fix:** The claim is split and both halves are measured. The poll-path case asserts the safety-net
  latency AND asserts the absence of any watch record, with the ordering named in the message — so
  the boundary is pinned rather than omitted. A separate case forces one directory dead and lets a
  still-living sibling watch publish the document, which measures the record in the document, on
  stderr, and its clearing by the next re-arm. Mutation M4 (emit before re-arm) reds the negative
  assertion, so it is not vacuous.
- **Files modified:** `scripts/board-watch-live.test.ts`
- **Verification:** M4 run in the transcript: "1 failed | 4 passed", the failure being exactly that
  assertion, with the record-cleared measurement moving from ~890 ms to 1900 ms.
- **Committed in:** `5d5f97cb`, `5f9bd23a`

**3. [Rule 3 - Blocking] A new test module tripped the EXACT census pin in `check-foundation-guards.test.ts`**

- **Found during:** Task 2, the full-suite verification run
- **Issue:** `TRIPWIRE_MODULES` is a two-sided pin over `scripts/*.test.ts`. Adding one module made
  the live census 69 against a pinned 68, which is the pin firing correctly on a structural event.
  The plan's `files_modified` did not anticipate it.
- **Fix:** Re-derived (`ls scripts/*.test.ts | wc -l` → 69) rather than incremented, bumped to 69
  with the reason appended to the running log the constant carries, in the commit after the run that
  observed it.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-foundation-guards.test.ts`
  → 293 passed, exit 0; then the full suite → 75 files, 4974 passed, 2 skipped, exit 0.
- **Committed in:** `965b72c3`

**4. [Deviation - budget] Five spawned processes, not three**

- **Found during:** Task 1
- **Issue:** The plan's header arithmetic named three processes. Splitting the watch-record claim
  (deviation 2) and keeping the premise as its own reporting case makes five.
- **Fix:** The header states the real budget with its per-case arithmetic. Measured total: 7.88 s and
  7.83 s of wall clock, inside the ~15 s the plan allows.
- **Files modified:** `scripts/board-watch-live.test.ts`
- **Verification:** two recorded runs in the transcript.
- **Committed in:** `5d5f97cb`

---

**Total deviations:** 4 (1 bug, 1 missing critical, 1 blocking, 1 budget restatement)
**Impact on plan:** No scope creep. Three of the four make the measurement honest where the plan's
wording would have made it either wrong or misleading; the fourth is the repo's own set-drift alarm
working as designed.

## Verification Run

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch-live.test.ts` (twice) | exit 0, 5 passed, 7.88 s / 7.83 s wall clock |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, **75 files**, 4974 passed, 2 skipped (the plan's floor is 75) |
| `npm run build && npm run typecheck && npm run check:build-parity` | exit 0; "no tracked build output moved when tsc ran" |
| `npm run check:nul-bytes` | exit 0, ALL CHECKS PASSED |
| `npm run check:public-docs` | exit 0, ALL CHECKS PASSED |
| `npm run check:claim-anchors` | exit 0, ALL CHECKS PASSED |
| Mutation runs M1–M4 against the committed `.js`, each restored and `git diff --exit-code` clean | recorded in the transcript |

Bare `npm test` was never run: it triggers the live claude-CLI e2e lane.

## Known Stubs

None. The suite contains no skipped case, no platform conditional and no placeholder value.

## Deferred / Named Boundaries

- **Windows `fs.watch` timing: `UNKNOWN - verify`.** Every number here was taken on darwin/arm64.
  The `windows-latest` leg is Phase 33 / CAP-02, and Phase 32's Windows caveat in `.planning/ROADMAP.md`
  is unchanged by this plan (the file was not edited).
- **CI exposure, stated rather than discovered later.** CI runs the excluded-e2e suite on
  `windows-latest` as well as `ubuntu-latest`, and three of the five cases depend on the platform
  delivering directory events at all. If the Windows leg reds on those cases, that red is the
  CAP-02 measurement arriving early — it names the platform and the milliseconds it saw — and it must
  not be answered with a platform conditional. Recorded in `.planning/WINDOWS.md`.
- **A transient watch failure is invisible to a `--json` consumer**, because the re-arm precedes the
  emit inside one tick. Measured, asserted, and recorded in `.planning/WINDOWS.md`; the updates
  themselves never stop, which is the property the verifier's expectation asked about.
- **The ten-second production poll floor is not itself measured.** The runs use the `--interval`
  override at its 1000 ms hard floor so the poll path is observable inside a bounded suite; the
  relationship the cases assert is the same at either value.

## Issues Encountered

The full-suite run failed once, on the `TRIPWIRE_MODULES` census pin. That is the pin doing its job
on a structural event (see deviation 3), and it was resolved by re-deriving the count rather than by
incrementing it.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 32-23 is the remaining plan in this phase.
- `REQUIREMENTS.md` and the ROADMAP phase status are deliberately NOT flipped to Complete by this
  plan, per its own success criteria: it closes a verification item, and the requirement verdict for
  DASH-04 / DASH-05 belongs to the next verification round, which now has measured numbers to read
  instead of an unexercised claim.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

## Self-Check: PASSED

- `scripts/board-watch-live.test.ts` — present on disk
- `.planning/phases/32-board-projector-cli-dashboard/32-22-LIVE-TRANSCRIPT.txt` — present on disk
- `.planning/phases/32-board-projector-cli-dashboard/32-22-SUMMARY.md` — present on disk
- Commits `5d5f97cb`, `5f9bd23a`, `965b72c3`, `ae39d606` — all present in `git log`
