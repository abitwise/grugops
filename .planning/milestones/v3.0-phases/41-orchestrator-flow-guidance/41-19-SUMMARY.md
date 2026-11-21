---
phase: 41-orchestrator-flow-guidance
plan: 19
subsystem: queue
tags: [claim, sweep, workflow-17, runnable-embeds, disposition]
status: complete

requires:
  - phase: 41-orchestrator-flow-guidance
    provides: "claim.js host program (41-03, 41-05), the no-usable-record sweep (41-10), Workflow 17 text (41-04, 41-11)"
provides:
  - "claimPending refuses a pending subtask whose ref: line done would refuse, before takeClaim, with exit 2 on the host"
  - "sweepStale keeps a stale claim whose pending/<task>.md exists (kept list); sweepQueue returns kept and left"
  - "Host sweep prints `kept <task> (...)` and `left <name> (...)` lines; exit 0 stays"
  - "Workflow 17: re-queued subtask takes a new id; step 7 names every exit of done; session start stops on kept/left"
  - "Workflow 04 step 16 points at step 1 of Workflow 17; orchestrator.md points there for the subtask file"
affects: [41-20, 41-21, 41-22, 41-23, 41-24, workflow-17, claim.js]

actuals:
  tokens: 14335
  tasks: 3
  commits: 5
plan_head_before: a09b13de405ef079812121e7be0caad31fff7462
plan_head_after: c810a2b89af1beac57821b6aabf0612bc00673b6

tech-stack:
  added: []
  patterns:
    - "A check before takeClaim reads through queueEntry/readClaimRecord and treats a vanished file as absent, so a lost race still reads lost (D-08)"
    - "A sweep reports what it keeps and what it cannot judge instead of passing over it silently"

key-files:
  created:
    - docs/audit/29-style-dispositions/41-19.md
  modified:
    - scripts/claim.ts
    - scripts/claim.js
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/claim.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/note.ts
    - scripts/runnable-ref/note.js
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/trace-render.js
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/state-roll.js
    - scripts/claim.test.ts
    - scripts/now-running-freshness.test.ts
    - scripts/runnable-ref/claim.test.ts
    - scripts/flow-guidance-text.test.ts
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/04-ticket-to-pr.md
    - agent-factory/roles/orchestrator.md
    - agent-factory/roles/_role-switch-protocol.md
    - docs/audit/29-style-dispositions/41-11.md
    - CHANGELOG.md

key-decisions:
  - "claimPending reads pending/<task>.md through a helper that returns null when the file vanished (ENOENT), so a claimant that loses the race between the look and the read still reaches takeClaim and reads lost"
  - "A pending entry that is not a regular file (FIFO, link, directory) is refused before takeClaim and never opened"
  - "sweepQueue sorts left; the host sorts kept and left before printing; renderAfter names only reclaim and release lines, because kept and left are not queue changes"
  - "The review's step 1 and step 7 sentences are split in two to meet the WP-02 20-word procedural bound"

patterns-established:
  - "Pattern: a sweep line kind for each outcome it does not act on (kept, left), printed after the change lines"

requirements-completed: [RUN-01, RUN-02, RUN-04, RUN-05]

coverage:
  - id: D1
    description: "claim refuses a subtask done would refuse (no ref:, two ref:, ref: outside .grugops/context/, a non-regular pending file), with nothing moved; a lost race still reads lost"
    requirement: RUN-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#claim refuses a subtask done would refuse (plan 41-19, WR-05, D-42)"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#claimPending refuses a pending subtask whose ref subtaskRefFolder refuses, before takeClaim (WR-05)"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#a second claim on one task is lost, never a refusal, although the pending file is gone (D-08)"
        status: pass
    human_judgment: false
  - id: D2
    description: "sweep keeps a newer pending file and prints kept; it prints left for a stray file and an unsafe name, and free still counts them"
    requirement: RUN-02
    verification:
      - kind: unit
        ref: "scripts/claim.test.ts#sweep keeps a stale claim whose pending file exists, and the newer pending file keeps its bytes (WR-07)"
        status: pass
      - kind: unit
        ref: "scripts/claim.test.ts#sweepQueue names each entry it cannot judge in left (WR-11)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/claim.test.ts#sweep prints a left line for a stray file and an unsafe name, dated 2020, and free still counts them (WR-11)"
        status: pass
      - kind: other
        ref: "scripts/runnable-ref/claim-read-sites.test.ts (17 sites, 57 pairs reached, UNREACHED 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The kit text (Workflow 17, Workflow 04, orchestrator.md, the role-switch protocol) and the code comments say what the queue program does"
    requirement: RUN-04
    verification:
      - kind: other
        ref: "scripts/flow-guidance-text.test.ts#the queue text names a re-queued subtask and what the sweep leaves (plan 41-19; WR-05, WR-06, WR-07, WR-11, IN-04, IN-05, D-42)"
        status: pass
    human_judgment: true
    rationale: "The 25 rows of docs/audit/29-style-dispositions/41-19.md are pending (named human): the gate proves a row exists and cannot judge whether each changed clause says what the program now does"

duration: 18min
completed: 2026-11-12
---

# Phase 41 Plan 19: claim and done agree, the sweep keeps a newer subtask and names what it leaves

**`claim` now refuses a subtask whose `ref:` line `done` would refuse (exit 2, nothing moved, a lost race still `lost`); `sweep` never replaces a newer `pending/<task>.md` and prints `kept`/`left` lines for what it will not clear; Workflow 17, Workflow 04 and two roles say so.**

## Performance

- **Duration:** about 18 min
- **Started:** 2026-11-12T07:52:34Z
- **Completed:** 2026-11-12T08:11:02Z
- **Tasks:** 3
- **Files modified:** 23 (22 modified, 1 created)

## Accomplishments

- WR-05: `claimPending` runs `subtaskRefFolder` on the pending file before `takeClaim`. A bad `ref:` is refused with `<reason>, so done would refuse it; fix pending/<task>.md before it is claimed`; a non-regular pending entry is refused unopened. An absent or vanished file is left to the existing refusal after `takeClaim`, so D-08 holds.
- WR-07: `sweepStale` checks `pending/<task>.md` before the rename. When it exists, nothing moves, the task is not reclaimed, and it goes on the new optional `kept` parameter. The `string[]` return stays for its 21 callers.
- WR-11: `sweepQueue` returns `{ released, reclaimed, kept, left }`. `left` holds each `claimed/` entry that is not a safe name or not a directory (keepers dropped). The host prints `kept <task> (pending/<task>.md already exists, so the claim stays)` and `left <name> (not a claim the sweep can judge)` after the released lines.
- IN-04, IN-07, IN-12: the `claim.ts` header describes the two-line subtask file of Workflow 17 step 1; the `atomicWrite` and host-header comments say the render has more than one writer and can lag the disk; the `claimedEntryNames` comment names the tampered-record exception; the state-check SIBLINGS comment names `note.js`.
- WR-06, WR-11, IN-04, IN-05 text: Workflow 17 step 1 gives a re-queued subtask a new id; Workflow 04 step 16 points there; step 7 says any other exit is a genuine failure that leaves the claim; session start step 3 stops on `kept`/`left`; orchestrator.md (6,158 B) points at step 1; the role-switch `done` line opens with `When the work was queued`.
- CHANGELOG `### Changed` gains the claim and sweep bullets. docs/audit/29-style-dispositions/41-19.md has 25 rows, all `pending (named human)`; 41-11.md notes the WR-11 rewrite under D-43.

## Task Commits

1. **Task 1 (tracer): claim refuses a subtask done would refuse** - RED `abe4140e` (test), GREEN `1d45ba76` (feat)
2. **Task 2: sweep keeps a newer pending file and names what it cannot judge** - RED `484ab226` (test), GREEN `6e3a3e1b` (feat)
3. **Task 3: the kit text** - `c810a2b8` (docs)

No refactor commits; nothing needed cleanup after GREEN.

## TDD Evidence

- **Task 1 RED:** `npx vitest run scripts/claim.test.ts -t "before takeClaim" --reporter=tap-flat`, exit 1. Target `claimPending refuses a pending subtask whose ref subtaskRefFolder refuses, before takeClaim (WR-05): no ref: line` failed on its first assertion (kind `claimed`, expected `refused`). Classifier: `RED_EVIDENCE_OK` (target_test_failed). Semantic assessment: the target ran and failed on the planned assertion; the host case failed the same way (status 0, expected 2), as the plan predicted. The host run's own TAP was refused as malformed because vitest tap-flat does not indent a multi-line assertion message, so the library case was classified instead.
- **Task 1 GREEN:** the six verify files pass, 407 tests.
- **Task 2 RED:** `npx vitest run scripts/claim.test.ts -t "names each entry it cannot judge" --reporter=junit`, exit 1. Target `sweepQueue names each entry it cannot judge in left (WR-11)` failed on `expected undefined to deeply equal [ 'bad+name', 'stray' ]`. Classifier: `RED_EVIDENCE_OK` (junit, target_test_failed). The WR-07 sibling failed in the same run on its `toEqual` (it reclaimed `z` over the newer pending file). TAP was refused for the same multi-line reason, so JUnit was used.
- **Task 2 GREEN:** the seven verify files pass, 556 tests.
- Tracer gate (interactive, end-of-phase, automated-only verify): re-ran Task 1 verify end-to-end, green, then expanded.

## Fixtures Changed (Task 1)

Each fixture that wrote a pending subtask with no `ref:` line, and how it changed:

- `scripts/claim.test.ts` "a real failure is a refusal, never a false lost (a missing claimed/ directory)": gained `ref: .grugops/context/t/`.
- `scripts/claim.test.ts` "the board reader takes a record with agent and level lines as one row (D-30)": gained `ref: .grugops/context/t/`.
- `scripts/now-running-freshness.test.ts` "renders the agent and level of a record...": `pending/new.md` gained `ref: .grugops/context/new/`.
- `scripts/now-running-freshness.test.ts` "after the last completeTask the render holds its table header...": `pending/one.md` and `pending/two.md` each gained a `ref:` line.
- `scripts/runnable-ref/claim.test.ts` "done refuses what it cannot read (T-41-16)", four bad-`ref:` cases: these are about `done`, so they now claim a sound subtask and then write the bad text over `claimed/t1/t1.md`. This keeps `done`'s own refusal covered.

## Files Created/Modified

- `scripts/claim.ts` / `.js` - WR-05 check in `claimPending`, `pendingTextOrNull`, WR-07 `kept` in `sweepStale`, `kept`/`left` in `sweepQueue`, IN-04/IN-07/IN-12 comments
- `scripts/runnable-ref/claim.ts` / `.js` - `runSweep` prints kept and left; header and D-12 contract updated; regenerated region
- `scripts/runnable-ref/{note,state-check,state-roll,trace-render}.{ts,js}` - regenerated build stamp; SIBLINGS comment in state-check names `note.js`
- `scripts/claim.test.ts`, `scripts/runnable-ref/claim.test.ts`, `scripts/now-running-freshness.test.ts`, `scripts/flow-guidance-text.test.ts` - new cases, fixture `ref:` lines, moved text pins
- `agent-factory/workflows/17-task-claim.md`, `agent-factory/workflows/04-ticket-to-pr.md`, `agent-factory/roles/orchestrator.md`, `agent-factory/roles/_role-switch-protocol.md` - kit text
- `CHANGELOG.md` - two `### Changed` bullets
- `docs/audit/29-style-dispositions/41-19.md` (new), `docs/audit/29-style-dispositions/41-11.md` - disposition rows and the D-43 note

## Decisions Made

- `claimPending` treats a pending file that disappears between the look and the read as absent. Without this, a claimant losing the race in that window would get a refusal instead of `lost`, which the RUN-05 prohibition forbids.
- `renderAfter` in `runSweep` names only reclaim and release lines. `kept` and `left` change nothing, so a failed render must not report them as standing changes.
- The D-12 contract in the host header names the `kept TASK (...)` and `left NAME (...)` line kinds without repeating their full text. This keeps each exact output phrase once in `claim.js`, as the acceptance greps require.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The generator's npm script could not run on Task 2's edit**
- **Found during:** Task 2
- **Issue:** `npm run generate:runnable-embeds` first runs `tsc --outDir .tmp-build`. That failed because the hand-written `runSweep` already read `swept.kept` while the generated region still had the old `sweepQueue` type.
- **Fix:** ran the committed `node scripts/generate-runnable-embeds.js` (it reads the `.ts` sources), then `npm run build`, then the npm script again: `0 changed`. `freshness:runnable-embeds` passes.
- **Committed in:** `6e3a3e1b`

**2. [Rule 1 - Bug] The plan's step 1 and step 7 sentences failed the WP-02 sentence-length gate**
- **Found during:** Task 3 (`check-foundation-guards`)
- **Issue:** the review's step 1 sentence had 25 words and its step 7 sentence 22, against WP-02's 20-word bound for a procedural sentence.
- **Fix:** split each at the colon: `... keeps the `ref:` of its per-task context. The `claim` command refuses an id already in `done/`.` and `... is a genuine failure. Stop, surface it and leave the claim in place.` Pins, disposition rows and the 41-19 prose were updated. The acceptance greps `takes a new id, such as` and `leave the claim in place` still print 1.
- **Files modified:** agent-factory/workflows/17-task-claim.md, scripts/flow-guidance-text.test.ts, docs/audit/29-style-dispositions/41-19.md
- **Committed in:** `c810a2b8` (Task 1 had committed the one-sentence step 7, and Task 3 split it)

**3. [Rule 2 - Missing critical] Disposition rows for the role lines the gate did not flag**
- **Found during:** Task 3
- **Issue:** the role-rule stand-in admitted the orchestrator.md and `_role-switch-protocol.md` clauses, so the gate gave no finding for them.
- **Fix:** both have `pending (named human)` rows anyway, as plan 41-14 did, so every changed clause has a record for the human. The 13 Workflow 04 step 16 sentences that stayed word for word also have rows: the gate compares whole lines, so they count as changed.
- **Committed in:** `c810a2b8`

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 bug, 1 missing critical).
**Impact on plan:** none of them widens scope. The behavior and the text are what D-42 adopted; two sentences are split for the sentence-form gate.

## Issues Encountered

- `scripts/capture-live.test.ts` P5 failed once while Task 1 changes were uncommitted. Its working-tree row named `trace-render.*`, and the test checks for the text `trace`. It passed after the commit, in the final run.
- vitest's TAP reporter does not indent multi-line assertion messages, so the RED classifier refused that TAP. The RED evidence was taken from a single-line library case (Task 1) and from JUnit output (Task 2).

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 41-20 to 41-23 can run next. The full suite runs once, in plan 41-24.
- Open for a human: the 25 `pending (named human)` rows in docs/audit/29-style-dispositions/41-19.md. No agent writes an acceptance.
- `UNKNOWN - verify`: a live run of the new `sweep` lines on a host other than Claude Code (R-41-05).

## Self-Check: PASSED

- FOUND: docs/audit/29-style-dispositions/41-19.md, scripts/claim.ts, scripts/runnable-ref/claim.js, agent-factory/workflows/17-task-claim.md
- FOUND commits: abe4140e, 1d45ba76, 484ab226, 6e3a3e1b, c810a2b8
- All acceptance greps of Tasks 1-3 re-run and passing. `docs/audit/28-prepass-evidence.md` is still modified and unstaged.

---
*Phase: 41-orchestrator-flow-guidance*
*Completed: 2026-11-12*
