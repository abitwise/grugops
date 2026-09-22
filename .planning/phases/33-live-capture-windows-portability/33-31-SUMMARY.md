---
phase: 33-live-capture-windows-portability
plan: 31
subsystem: ci
tags: [github-actions, windows-latest, ubuntu-latest, vitest, cap-02, windows-ledger, gap-closure-round-3]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-3 fix plans 33-24..33-30 (33-24 closes row 236's 8.3 spelling class; 33-25..33-30 rebuild modules both legs exercise) and Part 3's measurement shape (33-20)
provides:
  - 33-CI-MEASUREMENT.md Part 4. § 4.1 is the pre-push inventory (Task 1). § 4.2 is the pushed run read from its own metadata. § 4.3 is the verdict and the re-derived 1-row windows inventory with its mechanism. § 4.4 is the ledger changes through the tool plus a per-row disposition table. § 4.5 lists the transcripts.
  - the CAP-02 verdict for run 35760655144, which is NOT MET (ubuntu success, windows failure on one case). Plan 33-32 reads it as checkpoint text, and it gates plan 33-33's F38-F42.
  - WINDOWS.md row 260, the one new class (the win32 spelling of 33-29's scoped `Edit(//ABS/**)` grant). This is round 4's input.
affects: [33-32, 33-33, 33-34, phase-33-gap-closure-round-4, cap-02]

# Actuals (#2632): chars/4 over the realized diff of this plan's three files, 7361c4c4..HEAD, not a harness token count.
actuals:
  tokens: 17950
  tasks: 3
  commits: 3
plan_head_before: 7361c4c42bba400d2e16a15d7f862a49ed504f9f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A measurement plan changes no source file. A red leg is inventoried in the previous inventory's shape and handed to the next round (D-11)."
    - "A CI conclusion is quoted from `gh run view --json` fields and a failure inventory from the job's own log. It is never narrated."
    - "WINDOWS.md rows change only through `gsd-tools windows`. The counters, the table and the JSON appendix are asserted to agree afterwards."

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-31-SUMMARY.md
  modified:
    - .planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md

key-decisions:
  - "CAP-02 is NOT MET on run 35760655144. Ubuntu reads `success`. Windows reads `failure` on 1 case of 5667, and it is not one of the 35 row-236 cases, which are all green. The requirement flips only when both legs read success (D-13)."
  - "The one windows red (capture-live.test.ts Test C7) is labelled `new` and attributed to 33-29's scoped `Edit(//ABS/**)` grant. It is recorded as ONE WINDOWS.md row (260). § 4.1 labelled 33-29's class `measurable here`, and that label was overstated by the drive-letter axis."
  - "No ledger row is flipped, although rows 186, 193 and 226-236 all have green file-level evidence on both legs. The plan disposes them only on a run whose legs are both green."
  - "Which win32 spelling the platform matches (`//C:/...`, `//c/...`, or neither) is `UNKNOWN - verify`. The docs (code.claude.com/docs/en/permissions) say win32 paths normalize to `/c/Users/...`. That is a documentation claim, unmeasured by any Windows session."

patterns-established:
  - "Measurability classification is falsifiable. It failed for W-21 in round 2 and for 33-29 in round 3. A test-only seam (LiveOps) removes the spend but not a platform's path spelling."

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Part 4 § 4.2 quotes run 35760655144's id, head sha, run conclusion and BOTH jobs' conclusion fields from `gh run view --json`, with the per-step table and the suite totals from each leg's log"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "gh run view 35760655144 --json headSha,conclusion,jobs → headSha 1af7e3f1…, conclusion failure, windows failure, ubuntu success"
        status: pass
      - kind: other
        ref: "grep -a -cE 'CAP-02 verdict on this run: (MET|NOT MET)' 33-CI-MEASUREMENT.md → 3"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ 4.3 re-derives the windows failure inventory from the job's own log (1 case, the assertion text, label `new`, falsified mechanism 33-29) and flips no ledger row. § 4.4 appends one row through the tool."
    requirement: CAP-02
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status → open 231 / waived 3 / fixed 26 / total 260; table rows 260; JSON ids 260"
        status: pass
      - kind: other
        ref: "git diff --stat 7361c4c4..HEAD -- scripts install hooks agent-factory .claude → empty"
        status: pass
    human_judgment: false
  - id: D3
    description: "The diagnosis of row 260 is read from the tree, not reproduced on a windows host. The module spells `Edit(//C:/…/**)` on win32, and the test's round trip `/${anchored}` assumes a leading `/`."
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "This host cannot produce a drive-letter path. The mechanism follows from the code at capture-live.ts:340-343 and test :1244-1246, and from the log's untruncated Expected/Received pair. Which spelling the platform's matcher accepts is unmeasured."

# Metrics
duration: ~21h wall (Task 1 2026-09-21 21:10Z–21:40Z; human checkpoint and push to 2026-09-22 17:26Z; run 17:26–18:00Z; Task 3 18:01–18:15Z)
completed: 2026-09-22
status: complete
---

# Phase 33 Plan 31: The CAP-02 round-3 measurement Summary

**CI run 35760655144 is read from its own metadata. The ubuntu leg is green end to end for the second run in a row (5666/5667 tests, the gate chain green). The windows leg has one red of 5667 tests, down from 35. All 35 row-236 cases are now green on windows. The one red is new: `capture-live.test.ts` Test C7, the win32 drive-letter spelling of 33-29's scoped `Edit(//ABS/**)` grant (`/C:/…` vs `C:/…`). CAP-02 is NOT MET. Row 260 was appended, nothing was flipped, nothing was fixed, and nothing was pushed.**

## Performance

- **Duration:** ~21h wall. Most of that was the human checkpoint (Task 2) and the pause while the run was in flight. The run took 34 m 29 s on windows and 16 m 41 s on ubuntu.
- **Started:** 2026-09-21T21:10Z (Task 1, previous executor). This continuation started 2026-09-22T18:01Z.
- **Completed:** 2026-09-22
- **Tasks:** 3 (2 auto + 1 blocking-human checkpoint, answered "push approved")
- **Files modified:** 3, all under `.planning/`. No source file.

## Accomplishments

- **The run, quoted:** `gh run view 35760655144 --json status,conclusion,headSha,jobs` →
  `{"conclusion":"failure","headSha":"1af7e3f137dbdfb583b5d372a3285354d01fbc59","jobs":[{"conclusion":"failure","name":"test (windows-latest)","status":"completed"},{"conclusion":"success","name":"test (ubuntu-latest)","status":"completed"}],"status":"completed"}`.
  The job ids are `106857565760` (ubuntu) and `106857564452` (windows). Steps 4–10 are green on both legs, and the windows 5-row shape remainder exited 0. The red is at step 11 on windows only.
- **Ubuntu:** `Test Files  78 passed (78)`, `Tests  5666 passed | 1 skipped (5667)`, then step 12 green with 12 `ALL CHECKS PASSED` lines. The headline numbers equal § 4.1's local ones.
- **Windows:** `Test Files  1 failed | 77 passed (78)`, `Tests  1 failed | 5663 passed | 3 skipped (5667)`, with 0 timeouts. The reporter prints `✓ scripts/context-io.test.ts (678 tests) 70576ms`, so every one of the 35 `unmeasured locally, by construction` rows is green. So are W-ENV and W-HOME. This measures 33-24's one-authority mechanism (D-33-R3-01) on the axis darwin cannot reach.
- **The finding (§ 4.3):** `scripts/capture-live.test.ts:1246` reports `expected '/C:/Users/runneradmin/AppData/Local/T…' to be 'C:/Users/runneradmin/AppData/Local/Te…'`.
  - Cause: `liveAllowedTools` (`capture-live.ts:340-343`) strips leading slashes from a POSIX-separated `realpathSync.native` path and writes `Edit(//C:/…/**)` on win32. The test then puts one `/` back in front and compares the result to the real path. That round trip only works where an absolute path begins with `/`.
  - Owner: 33-29 (`5a01e7dd` / `79a5ab9a`).
  - The module's docstring already marks the win32 `//` spelling `UNKNOWN - verify`. The platform docs point at a third spelling, `//c/Users/…`, and that is unmeasured.
- **Ledger, through the tool only:** row 260 was appended. `windows status` then read open 231 / waived 3 / fixed 26 / total 260, with 260 table rows and 260 JSON ids. Nothing was flipped.
- **REQUIREMENTS.md CAP-02:** the checkbox stays `[ ]`. The coverage row reads `Pending — NOT met (round 3 of 4): CI run 35760655144 …`.
- **Row dispositions (18 rows named):** all 18 stay open.
  - 13 have green file-level evidence on both legs: 186 (now four green windows ids), 193, and 226–236.
  - 4 can only be closed by the live session, not by CI: 255–258.
  - 1 has no evidence either way: 259, the alias-push bypass, which no plan addressed.
  - Row 260 was appended.

## Task Commits

1. **Task 1: The pre-push inventory.** `1af7e3f1` (docs), by the previous executor. It wrote Part 4 § 4.1.
2. **Task 2: Checkpoint, named human confirmation to push.** No commit. The human answered "push approved", and the orchestrator ran `git push origin main` → `9e1c1131..1af7e3f1`. The executor never pushed.
3. **Task 3: Read both legs from the run's own metadata; file the measurement; dispose only what a green run answers.** `0b2124cf` (docs). It wrote Part 4 § 4.2–4.5, the REQUIREMENTS.md CAP-02 coverage row, and WINDOWS.md row 260.

`commits: 3` was measured with `git rev-list --count 7361c4c4..HEAD` when this SUMMARY was written. The three are `1af7e3f1`, the orchestrator's pause commit `a5568a0b` (`wip(33): …`, which touches only `.planning/HANDOFF.json` and `.continue-here.md`), and `0b2124cf`. The final docs commit (SUMMARY/STATE/ROADMAP) follows. Every commit after `1af7e3f1` is LOCAL.

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md`: Part 4 § 4.2 (the run, sha reconciliation, per-step table, suite totals, control-byte scan), § 4.3 (the verdict line, prediction-vs-measured table, the 35-row outcome, the 1-row inventory, the mechanism with the docs claim labelled unmeasured, row 186's fourth measurement, the slowest tests), § 4.4 (the `windows append` command verbatim, `windows status`, the per-row disposition table) and § 4.5 (transcripts)
- `.planning/REQUIREMENTS.md`: the CAP-02 coverage-table row (L227) only
- `.planning/WINDOWS.md`: row 260 via `gsd-tools windows append`, and nothing else

## Decisions Made

- **One row for the one class** (row 260), as § 2.7 and § 3.4 did.
- **No ledger row flipped on a red run**, even where every named file is green on both legs. The plan's rule is explicit.
- **The docs claim is labelled, not adopted.** The permissions reference's `/c/Users/…` normalization is quoted as the candidate authority for round 4. It stays `UNKNOWN - verify` because no Windows session has observed the matcher.

## Deviations from Plan

**1. [Rule 3 - Blocking, documentation-only] The verify block's headSha comparison reads two different shas, by construction of Task 1**
- **Found during:** Task 3 verify
- **Issue:** Task 3's first verify fails when "the printed headSha differs from the sha Part 4 § 4.1 recorded". § 4.1 recorded `pre-push HEAD sha: 7361c4c4…`, which is the dispatch base, as Task 1's action directed (its no-source-diff check needs that base). Task 1's own commit `1af7e3f1` sits on top, and that commit is what was pushed. So the literal comparison can never match.
- **Resolution:** § 4.2 reconciles the two. `1af7e3f1`'s parent is `7361c4c4`. `git diff --stat 7361c4c4 1af7e3f1` lists only `33-CI-MEASUREMENT.md`. The source-path diff is empty. The tree CI measured is byte-identical, on every source path, to the tree § 4.1 inventoried. No code change was made and no sha was rewritten.
- **Commit:** `0b2124cf`

**2. [Precondition wording] HEAD is one local commit past `origin/main`**
- Task 3's precondition asks for `git rev-parse HEAD` == `origin/main`. HEAD was `a5568a0b`, the orchestrator's pause commit (`.planning/HANDOFF.json` and `.continue-here.md` only), one commit past `origin/main` = `1af7e3f1`. The CI run exists for exactly the pushed sha, which is what the precondition protects. The precondition's intent holds, and no push was made to force the literal equality.

Otherwise the plan's red branch was followed verbatim: the verdict line, the inventory in § 3.3's shape with per-red attribution, the CAP-02 row set to `Pending — NOT met` with `round 3 of 4`, no row flipped, one new-class row appended, no fix, no re-push, and no `npm test`.

## Issues Encountered

- The windows job log is CRLF with a UTF-8 BOM. Both were stripped along with ANSI escapes before any number was extracted.
- Each log has two NUL bytes inside one passing test's stdout, the same frontmatter fixture § 3.2 named. They were located by offset and not quoted. `npm run check:nul-bytes` read `ALL CHECKS PASSED` after the writes.
- The row-236 outcome is a file-level reading, because the default reporter prints no per-test line for a passing file. The file's case count (678) equals § 4.1's, and `Failed Tests 1` names no `context-io` case.

## Authentication Gates

None. `gh` was already authenticated.

## Known Stubs

None. This plan writes measurement records only. Row 260 is the ledger entry for the measured red.

## Threat Flags

None. The threat-model mitigations held:
- T-33-141: the push was behind the blocking-human checkpoint, and the executor did not push.
- T-33-142: every conclusion word is quoted from `gh run view --json`.
- T-33-143: no source diff after the pre-push sha, and no re-push.
- T-33-144: one `windows append`, and the three representations agree.
- T-33-SC: nothing was installed.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 33-32 (live go):** its pushed-sha precondition was met by `1af7e3f1`. HEAD is now local commits ahead again (the pause commit, this plan's Task 3 and docs commits), and 33-32 carries its own push checkpoint for that. Its checkpoint text reads § 4.3: ubuntu green, windows red on one case in the instrument's win32 grant spelling. The live go runs on darwin, where C7 is green, so the red does not block the go mechanically. Whether to spend on the go this round, given that CAP-02 is NOT MET, is the human's call.
- **Plan 33-33 (GAP-D1 flip):** its second gate (F38–F42 cite a CAP-02 MET run) **cannot be met this round**. Even if 33-32 reads `pass`, 33-33's own plan routes to the "Hold — the capture passed but CAP-02 is NOT MET" option.
- **Plan 33-34 (closing ledger):** rows 186, 193, 226–236 and 255–260 are open. Rows 186/193/226–236 have green file-level evidence on two consecutive windows runs, but none can be flipped without a both-legs-green run. Snapshot `33-REVIEW.md` before any re-review, as the continue-here file requires.
- **Round 4 (the last under the cap):** two inputs.
  - Row 260: one published spelling for the scoped grant's absolute-path anchor on win32, with the test deriving its expectation from it. No `process.platform` branch. The docs' `/c/…` form is the candidate, `UNKNOWN - verify`.
  - Row 259, the alias-push bypass, is still open.
  - A green windows leg needs a fourth pushed run, and that push needs a named human confirmation.
- CAP-01 and CAP-03 are untouched by this plan.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-22*

## Self-Check: PASSED

- Files: 33-31-SUMMARY.md, 33-CI-MEASUREMENT.md, WINDOWS.md and REQUIREMENTS.md are present.
- Commits: 1af7e3f1 (Task 1), a5568a0b (pause), 0b2124cf (Task 3) are present in history.
- `commits: 3` was measured from the ledger base 7361c4c4 when this SUMMARY was written.
- Task 3 verify: the run is complete (ubuntu success, windows failure). The verdict-line count is 3. `windows status` exit 0 with counters equal to the table and the JSON. The source diff after the pre-push sha is empty. The headSha differs from the recorded sha by the one documentation commit § 4.1 said it would add (Deviation 1).
