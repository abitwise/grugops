---
phase: 33-live-capture-windows-portability
plan: 40
subsystem: ci
tags: [github-actions, windows-latest, ubuntu-latest, vitest, cap-02, windows-ledger, gap-closure-round-4, cap-reached]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-4 source fix plans 33-35..33-39 (33-37 closes row 260's win32 anchor; 33-35/33-36/33-38/33-39 rebuild modules both legs exercise) and Part 4's measurement shape (33-31)
provides:
  - 33-CI-MEASUREMENT.md Part 5. § 5.1 is the pre-push inventory (Task 1). § 5.2 is the pushed run read from its own metadata. § 5.3 is the verdict and the re-derived 1-row windows inventory. § 5.4 is the ledger change through the tool plus a per-row disposition table. § 5.5 lists the transcripts.
  - the CAP-02 verdict for run 36035067112, which is NOT MET (ubuntu success, windows failure on one case that is not a round-4 plan's). Plan 33-41 reads it as checkpoint text.
  - WINDOWS.md row 274, the one new class (EPERM on the board-watch-live DEBOUNCE burst's own rename over board.md). This is the cap-reached finding.
affects: [33-41, phase-33-close, cap-02]

# Actuals (#2632): chars/4 over the added lines of this plan's three files, fe30945f..HEAD (52316 chars), not a harness token count.
actuals:
  tokens: 13079
  tasks: 3
  commits: 3
plan_head_before: fe30945f90011f68c7f8634467df902610ea0f88

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A measurement plan changes no source file. On the last round under the cap, a red leg is recorded as the cap-reached outcome and ledgered, not handed to a fifth round (D-11)."
    - "A CI conclusion is quoted from `gh run view --json` fields and a failure inventory from the job's own log. It is never narrated."
    - "WINDOWS.md rows change only through `gsd-tools windows`. The counters, the table and the JSON appendix are asserted to agree afterwards."

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-40-SUMMARY.md
  modified:
    - .planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md

key-decisions:
  - "CAP-02 is NOT MET on run 36035067112 (head e45202a1). Ubuntu reads `success` (5778 passed, 1 skipped of 5779; gate chain green). Windows reads `failure` on 1 case of 5779. Round 4 was the last under the cap, so this is the cap-reached outcome."
  - "The one windows red is `board-watch-live.test.ts` DEBOUNCE burst case, EPERM on the test's own renameSync over board.md (:362 from :671). It repeats I-2 from intermediate run 35913922871. Its import closure is byte-unchanged since 1af7e3f1, when the file was green on windows. It is labelled `not addressed` against row 186's file and `new` as a mechanism, attributed to no round-4 plan, and recorded as row 274."
  - "The row-260 prediction held: capture-live.test.ts 71/71 green on windows-latest under 33-37's editAnchor authority. Every round-4 module is green on both legs. No row is flipped, because the plan disposes rows only on a both-legs-green run."
  - "Correlation recorded, not cause: the four green windows runs used runner image windows-2025-vs2026 20260907.229.1, and both red runs used 20260922.246.2. Which handle held board.md is UNKNOWN - verify."

patterns-established:
  - "When a red recurs with the code byte-identical, compare the runner environment (image version, runner version, node) across the green and red runs before attributing it to code."

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Part 5 § 5.2 quotes run 36035067112's id, head sha, run conclusion and BOTH jobs' conclusion fields from `gh run view --json`, with the per-step table and the suite totals from each leg's log"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "gh run view 36035067112 --json headSha,conclusion,jobs → headSha e45202a1…, conclusion failure, windows failure, ubuntu success"
        status: pass
      - kind: other
        ref: "grep -a -cE 'CAP-02 verdict on this run: (MET|NOT MET)' 33-CI-MEASUREMENT.md → 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ 5.3 re-derives the windows failure inventory from the job's own log (1 case, the error text, labels, no round-4 mechanism falsified) and flips no ledger row. § 5.4 appends one row through the tool."
    requirement: CAP-02
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status → open 239 / waived 3 / fixed 32 / total 274; table rows 274; JSON ids 274"
        status: pass
      - kind: other
        ref: "git diff --stat fe30945f..HEAD -- scripts install hooks agent-factory .claude → empty"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cause of R4-1 (which handle held board.md when the burst renamed over it) is not established. Only a runner-image correlation across six runs is recorded."
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "The log reports EPERM and the path only. This host (darwin) never refuses the rename. Six runs cannot separate the image change from chance."

# Metrics
duration: ~17h wall (Task 1 2026-09-23 21:28Z–21:53Z; human checkpoint and push to 2026-09-24 17:32Z; run 17:32–18:00Z; Task 3 17:40–18:10Z)
completed: 2026-09-24
status: complete
---

# Phase 33 Plan 40: The CAP-02 round-4 measurement Summary

**CI run 36035067112 (head e45202a1) is read from its own metadata. Ubuntu is green end to end for the third run in a row (5778/5779, the gate chain green). Windows has one red of 5779. It is not a round-4 plan's: the board-watch-live DEBOUNCE burst case gets EPERM on the test's own rename over `board.md`, in a file whose code has not changed since it was last green. The row-260 case and every round-4 module are green on both legs. CAP-02 is NOT MET. This was round 4 of 4, so the cap is reached. Row 274 was appended, nothing was flipped, nothing was fixed, and nothing was pushed by the executor.**

## Performance

- **Duration:** ~17h wall. Most of that was the human checkpoint (Task 2) and the run. The run took 27 m 12 s on windows and 17 m 13 s on ubuntu.
- **Started:** 2026-09-23T21:28Z (Task 1, previous executor). This continuation started 2026-09-24T17:40Z.
- **Completed:** 2026-09-24
- **Tasks:** 3 (2 auto + 1 blocking-human checkpoint, answered "pushed")
- **Files modified:** 3, all under `.planning/`. No source file.

## Accomplishments

- **The run, quoted:** `gh run view 36035067112 --json headSha,conclusion,jobs` →
  `{"conclusion":"failure","headSha":"e45202a196abf0908e50118a667ef09ab57376c5","jobs":[{"conclusion":"failure","name":"test (windows-latest)"},{"conclusion":"success","name":"test (ubuntu-latest)"}]}`.
  The job ids are `107752973593` (ubuntu) and `107752973059` (windows). Steps 4–10 are green on both legs, and the windows 5-row shape remainder exited 0. The red is at step 11 on windows only.
- **Ubuntu:** `Test Files  78 passed (78)`, `Tests  5778 passed | 1 skipped (5779)`, `Duration  941.28s`, then step 12 green.
- **Windows:** `Test Files  1 failed | 77 passed (78)`, `Tests  1 failed | 5775 passed | 3 skipped (5779)`, `Duration  1572.66s`, 0 timeouts.
- **Row 260 decided on windows:** `✓ scripts/capture-live.test.ts (71 tests) 7655ms`. The round-3 C7 red and I-1 are gone. Whether the platform's live matcher accepts `Edit(//c/…/**)` is still `UNKNOWN - verify`.
- **The finding (§ 5.3, R4-1):** `board-watch-live.test.ts`, `coalesces 5 atomic-rename writes into FEWER documents, and at least one` → `Error: EPERM: operation not permitted, rename '…\plans\board.md.tmp-…' -> '…\plans\board.md'` at `:362:3` from `:671:11`.
  - It is the same case and error as I-2 on intermediate run `35913922871`.
  - The test's 11-path import closure is byte-unchanged since `1af7e3f1`, and the file was green on windows at that commit. No round-4 plan owns this red.
  - The file's other five cases are green, including the single-edit atomic-rename delivery case.
  - Correlation, not cause: runner image `20260907.229.1` on all four green windows runs, `20260922.246.2` on both red runs.
- **Ledger, through the tool only:** row 274 was appended. `windows status` then read open 239 / waived 3 / fixed 32 / total 274, with 274 table rows and 274 JSON ids. Nothing was flipped: rows 186, 193, 226–236 and 260 stay `open`.
- **REQUIREMENTS.md CAP-02:** the checkbox stays `[ ]`. The coverage row reads `Pending — NOT met: CI run 36035067112 …, round 4 of 4 (last under the cap)`.

## Task Commits

1. **Task 1: Pre-push inventory** - `6bb9274c` (docs)
2. **Task 2: Push checkpoint (blocking-human)** - no commit. Answered "pushed". The orchestrator added `e45202a1` (chore, `.gitignore` + Phase 34 `.gitkeep`) at the human's request before the push. That commit is not this plan's.
3. **Task 3: Read both legs, file the verdict, ledger** - `ebddab73` (docs)

The measured count `git rev-list --count fe30945f..HEAD` = 3 (before this SUMMARY's commit). That count includes the orchestrator's `e45202a1`. Two of the three are this plan's.

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md` - Part 5 § 5.2–5.5: the run, the verdict, R4-1, the ledger change, the transcripts
- `.planning/REQUIREMENTS.md` - the CAP-02 coverage-table row only (checkbox unchanged)
- `.planning/WINDOWS.md` - row 274 appended through `gsd-tools windows append`

## Decisions Made

See `key-decisions` in the frontmatter. In short: NOT MET, with the cap reached. The one red goes to no round-4 plan. The row-260 prediction held. No row is flipped on a red run.

## Deviations from Plan

### Recorded, not auto-fixed

**1. [Orchestrator commit inside the plan's range] The pushed head is `e45202a1`, not Task 1's `6bb9274c`**
- **Found during:** Task 3 (dispatch notes)
- **Issue:** The orchestrator added `e45202a1` at the human's request before the push. It changes `.gitignore` and adds a Phase 34 `.gitkeep`.
- **Handling:** Part 5's `pre-push HEAD sha: fe30945f…` was not rewritten. § 5.2 states that the recorded and measured shas differ by `6bb9274c` (docs) and `e45202a1` (chore), and that `git diff --stat fe30945f..e45202a1 -- scripts install hooks agent-factory .claude` is empty. The nul-byte gate's 2488 against § 5.1's 2487 is that `.gitkeep`.
- **Effect on verify:** the plan's first Task 3 verify line fails when "the printed headSha differs from the sha Part 5 recorded". It does differ: `e45202a1` against `fe30945f`. § 5.1 predicted this shape ("expected to be this task's commit (or a later documentation-only commit)"). The only non-`.planning/` path between them is `.gitignore`, which is not source.

**2. [Plan premise] Row 186's disposition question from § 5.1 item 3 did not arise**
- § 5.1 asked how to dispose row 186 on a green run given I-2. This run is red, so no disposition was made.

## Issues Encountered

- `sleep` in the foreground was blocked, so the wait used a bounded `until` loop on `gh run view --json status`.

## Known Stubs

None. This is a measurement-only plan.

## Next Phase Readiness

- **For 33-41 (the go plan):** the verdict to read as checkpoint text is `CAP-02 verdict on this run: NOT MET` (run 36035067112). HEAD is now `ebddab73` plus this SUMMARY's commit, ahead of `origin/main` (`e45202a1`). 33-41's own push checkpoint has to carry these commits before its runner's HEAD == origin/main check.
- **Cap reached for CAP-02:** round 4 of 4 is spent. What to do with R4-1 (row 274) is for the human to decide: a new phase, an accepted-open close, or a diagnosis of the runner-image correlation. D-14/D-16 forbid a platform conditional. Row 193's waive condition ("a Windows watcher red proves undiagnosable inside the shared step") now bears directly on that choice.

## Self-Check: PASSED

- FOUND: .planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md (verdict lines = 4)
- FOUND: commits 6bb9274c, e45202a1 (orchestrator), ebddab73
- `windows status` exit 0; 274 = 274 = 274
- `git diff --stat fe30945f..HEAD -- scripts install hooks agent-factory .claude` empty
