---
phase: 33-live-capture-windows-portability
plan: 09
subsystem: infra
tags: [ci, github-actions, windows, vitest, cap-02, windows-ledger, measurement]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: plans 33-02..33-06 (the windows/ubuntu portability closures) and 33-07 (the flip manifest gate) — the tree under measurement
provides:
  - the pre-push inventory of every CI command run locally, with the per-class attribution and the 13 NOT ADDRESSED cases named before the push (Task 1)
  - a named-human-authorized push of d9bd4315 to main (Task 2 checkpoint answered "push approved"), satisfying plan 33-10's D-05 precondition
  - CI run 35499800942 read from its own metadata — both legs `failure` at the Vitest step; CAP-02 NOT MET on this run (D-13)
  - the re-derived per-file, per-class failure inventory with assertion texts for both legs, each case labelled, compared explicitly against the written-down expectation
  - WINDOWS.md rows 225 (fixed) and 226-235 (appended), every change through the ledger tool; rows 186/193 untouched
  - the per-leg slowest test (D-14's falsification) and the windows SKIPPED SHAPES remainder, measured
affects: [33-10 live capture (pushed-sha precondition met), the CAP-02 gap-closure round, WINDOWS.md ship gate]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate (chars/4 over the realized diff)
actuals:
  tokens: 26984
  tasks: 3
  commits: 2
plan_head_before: e2f48fa312a8feca0a2e2e97fa56308ea6f970b2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A CI verdict is read from the run's own `conclusion` fields (`gh run view --json conclusion,jobs`), never from a summary line or a local suite"
    - "Job logs for a completed job inside a still-running run are fetched with `gh api repos/<owner>/<repo>/actions/jobs/<id>/logs` (`gh run view --log` refuses until the whole run completes)"
    - "A failure inventory is paired against the baseline by exact `file > suite > case` key, with the extraction validated first against the baseline log it must reproduce"

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md
    - docs/audit/29-style-dispositions/33-09.md
  modified:
    - .planning/WINDOWS.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "CAP-02 is NOT marked complete: run 35499800942's both legs conclude `failure`; D-13's bar is both legs exiting 0, and the No-fabrication rule forbids checking the box on a measured red"
  - "Rows 186 and 193 are not disposed: the plan flips them only on a green run; the watcher file's second green windows measurement is recorded by run id for the round that disposes it"
  - "Seven finding rows (229-235) appended to WINDOWS.md through the tool, none flipped — appending is not flipping, and the ship gate must see each new class"
  - "No fix, no re-run, no platform conditional in this round (four-round cap): the inventory is round 1's measurement and the gap round's input"

patterns-established:
  - "Pair every FAIL entry against the baseline by exact key before labelling; a survivor with identical text is untouched, a survivor with moved text is one arm over"
  - "Validate the log extraction against the baseline it must reproduce (23 files / 198 keys) before trusting it on the new log"

requirements-completed: []  # CAP-02 is this plan's requirement and is NOT met on the measured run; left open deliberately

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Pre-push inventory: every workflow command run locally in the workflow's order with exit status and headline numbers; per-class attribution with 13 NOT ADDRESSED cases named; the one red gate (diff-disposition) dispositioned by a file, never by touching README or the base"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "npm run build && npm run check:build-parity && npm run typecheck (exit 0); npx vitest run --exclude '**/scripts/e2e/**' (78 files, 5340 passed, 2 skipped); node scripts/check-platform-shapes.js && npm run check:nul-bytes && npm run check:banned-claims && npm run check:diff-disposition (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The push happened only on named human confirmation (checkpoint gate=blocking-human, answered 'push approved'); exactly one `git push origin main` of the sha the human saw; nothing pushed after it"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "git push origin main -> 22c66700..d9bd4315; git log --oneline origin/main..HEAD empty after the push; later commits b1f8850a and the SUMMARY commit remain local"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both legs' conclusions read from run 35499800942's own metadata and filed with run id, sha, per-leg totals, duration and slowest test; CAP-02 verdict NOT MET (both legs failure at Vitest)"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "gh run view 35499800942 --json conclusion,jobs (run failure; ubuntu job 106049412426 failure; windows job 106049412324 failure); grep -ac conclusion 33-CI-MEASUREMENT.md = 10"
        status: pass
    human_judgment: false
  - id: D4
    description: "Red-leg inventory re-derived from each leg's own log per file/per class with assertion texts, each case labelled (not addressed predicted / mis-attributed / incomplete fix / new), compared explicitly against the § 1.5 expectation; no ledger row flipped; no platform conditional in the diff"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "extraction validated on the baseline windows log (23 files, 198 unique keys reproduced); git diff e2f48fa3..HEAD | grep -c process.platform = 0; rows 186/193 unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "WINDOWS.md changed only through the tool: row 225 fixed, rows 226-235 appended; frontmatter counters, table and JSON appendix agree"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status (open 206 / waived 3 / fixed 26 / total 235); grep -c '^| [0-9]' .planning/WINDOWS.md = 235; 235 JSON entries"
        status: pass
    human_judgment: false
  - id: D6
    description: "The labels attached to the 18 unpredicted windows reds and the 2 ubuntu reds (which class each belongs to, and which are one-arm-over incomplete fixes) are readings of the logs and the source, made under a no-fix rule; the gap round should re-derive them before acting"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "The mechanism labels are inferred from assertion texts and a source read (publicDocsCorpus's host-joined examples/ part, the explicit 60 s bound, the per-line FIFO literal, the pre-fix clone's npx launch); two are marked UNKNOWN - verify (ubuntu GREEN 1b/ORDERING; R-31-21-03's fixture shape). None was reproduced by a fix in this round, by the plan's prohibition."

# Metrics
duration: 47min (this dispatch: Task 2 resume + Task 3; Task 1 was a prior dispatch committed 2026-09-20T03:22Z)
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 09: CI measurement of CAP-02 on a pushed run Summary

**Pushed `d9bd4315` on named human confirmation and measured CI run `35499800942`: both legs `failure` at the Vitest step, so CAP-02 is NOT MET — ubuntu 2/5342 red (expected green), windows 31/5342 red in 8 files (expected 13 in 3); 176 of 198 baseline windows cases closed, 16 of 23 baseline files green, and the 18 unpredicted reds re-derived into five labelled classes, ten of them from one unnormalized publishing boundary.**

## Performance

- **Duration:** 47 min for this dispatch (push at 08:31:37Z, run complete 09:04:03Z, Task 3 committed 09:17:02Z); Task 1 ran in a prior dispatch (committed 03:22:20Z)
- **Started:** 2026-09-20T08:30Z (this dispatch)
- **Completed:** 2026-09-20T09:17Z
- **Tasks:** 3 of 3 (Task 2 is the human checkpoint; answered "push approved")
- **Files modified:** 4 (2 created, 2 modified) across the plan's two commits

## Accomplishments

- **The push (Task 2, resumed).** HEAD verified as the authorized sha, tree clean, `origin/main` = `22c66700` an ancestor; one fast-forward push carrying 55 commits; `origin/main..HEAD` empty afterwards. Plan 33-10's D-05 precondition is met. No later commit was pushed.
- **The run, read from itself (Task 3).** `gh run view 35499800942 --json conclusion,jobs`: run `failure`; `test (ubuntu-latest)` job `106049412426` `failure` (15 m 01 s); `test (windows-latest)` job `106049412324` `failure` (32 m 01 s). Every step before Vitest succeeded on both legs — including the windows `REQUIRE_SKIPS` step, which exited 0 with a non-empty five-row remainder (the answer Task 1 marked UNMEASURED LOCALLY). The ubuntu 23-command gate chain was never reached by CI.
- **Suite totals against the 5342/78 denominators.** Ubuntu `1 failed | 77 passed (78)`, `2 failed | 5339 passed | 1 skipped`, 856.26 s, zero timeouts. Windows `8 failed | 70 passed (78)`, `31 failed | 5308 passed | 3 skipped`, 1857.42 s, one `Test timed out in 60000ms` (an explicit per-test argument), zero hook timeouts, zero `RangeError`.
- **The expectation compared explicitly.** All 13 predicted windows survivors are present with the predicted assertion texts (rows 226-228 held exactly). Beyond them: 18 windows reds in 5 files § 1.5 called green, and 2 ubuntu reds where § 1.5 called the leg green. Direction of each delta and its class is in `33-CI-MEASUREMENT.md` § 2.2 and § 2.4.
- **The finding.** (a) `publicDocsCorpus()`'s `examples/` part is a `readdirSync` walk joined with the host separator while its root part is `git ls-files` — one boundary, 10 reds across `check-banned-claims` (3) and 33-07's new `check-flip-manifest` (7); 33-03 normalized the dedupe key, not the member. (b) Ubuntu `GREEN 1b`/`ORDERING` carry byte-identical baseline texts, were never `.temp` or timeouts, and no plan touched them (mis-attributed by the research inventory and by Task 1). (c) `uat-gate-exit-contract`: 2 mis-attributed test-side separator survivors + 2 reds created by phase-33 changes (an explicit 60 s bound exceeded at 61 989 ms; a per-line `shape="FIFO"` literal under the remainder 33-05 widened). (d) Three incomplete fixes one arm over (`check-platform-shapes` COVERAGE's `signalled` label; `context-io` CR-24 moved to the above-ceiling arm, R-31-21-03's probe; `freshness`'s pre-fix arm runs the pre-fix `npx tsc` launch).
- **Measured green that matters.** `scripts/board-watch-live.test.ts` 6/6 on both legs (7776 ms windows, 7288 ms ubuntu) — row 186's second cited green windows measurement, recorded, not disposed (the run is red). `GREEN 4` passed on windows in 59 197 ms under node 22 — 33-02's open assumption now measured. Slowest test on either leg 86 234 ms, 2.09x under the 180 s bound; no hook approached 120 s.
- **The ledger, through the tool only.** Rows 229-235 appended (one per finding class); no row flipped; `windows status` 206/3/26/235 agrees with the 235-row table and the 235-entry JSON appendix.

## Task Commits

1. **Task 1: The pre-push inventory** - `d9bd4315` (docs) — prior dispatch; created `33-CI-MEASUREMENT.md` Part 1 and `docs/audit/29-style-dispositions/33-09.md`; row 225 fixed, rows 226-228 appended via the tool; three deferred-items entries
2. **Task 2: Checkpoint (gate=blocking-human)** - no commit; the human answered "push approved"; the push `22c66700..d9bd4315 main -> main` was made at 2026-09-20T08:31:37Z by this dispatch
3. **Task 3: Read both legs, file the measurement** - `b1f8850a` (docs) — Part 2 of `33-CI-MEASUREMENT.md`; rows 229-235 appended via the tool; four deferred-items entries

**Plan metadata:** the SUMMARY commit that follows this file (local, not pushed)

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md` - Part 1 (pre-push inventory, attribution, expectation) and Part 2 (run metadata, totals vs expectation, the windows remainder and row-186 measurement, the 33-case labelled inventory with assertion texts, per-file baseline-to-now table, the finding as the gap round's input, slowest tests, ledger commands, transcript provenance)
- `docs/audit/29-style-dispositions/33-09.md` - 20 disposition rows over the 21 undispositioned README clauses (Task 1, Rule 3)
- `.planning/WINDOWS.md` - row 225 fixed; rows 226-235 appended; all via `gsd-tools windows`
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - the 13 NOT ADDRESSED cases (Task 1) and the four new finding classes (Task 3), each with owner = the CAP-02 gap round

## Decisions Made

- **CAP-02 not marked complete.** The plan's `requirements: [CAP-02]` would normally be marked on completion; the measured run says both legs `failure`, D-13 says both legs must exit 0, and CLAUDE.md's No-fabrication rule ("never fake a passing gate") takes precedence over the protocol step. `requirements-completed` is empty and REQUIREMENTS.md is untouched.
- **Rows 186/193 not disposed.** The plan disposes them only on a green run. The watcher's second green windows measurement is cited by run id in § 2.3 so the disposing round has both.
- **Appended, never flipped.** Seven ledger rows for the new classes, through the tool; appending is the SUMMARY protocol's broken-windows rule and is not the flip the plan forbids on a red run.
- **Four labels, not three.** The plan asks for regression / incomplete fix / new; the 13 predicted survivors and the 4 mis-attributed survivors fit neither "regression" (nothing closed then reopened) nor "incomplete fix" (no plan touched them), so they are labelled "not addressed (predicted)" and "not addressed (mis-attributed)". No case is a regression.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] README disposition file so the ubuntu gate chain is green (Task 1, prior dispatch)**
- **Found during:** Task 1 (the pre-push inventory) — `check-diff-disposition` exited 1 with 21 undispositioned README clauses from three commits predating this phase
- **Issue:** the ubuntu-only gate step would have been red on CI regardless of the portability work, making CAP-02 unmeasurable on that leg
- **Fix:** `docs/audit/29-style-dispositions/33-09.md`, 20 rows over the 21 clauses; nothing in README, the base or the corpus touched; gate exit 0, `0 findings over 39/39 elements`
- **Files modified:** `docs/audit/29-style-dispositions/33-09.md`; WINDOWS.md row 225 marked fixed via the tool
- **Verification:** `node scripts/check-diff-disposition.js` → `ALL CHECKS PASSED`
- **Committed in:** `d9bd4315`

**2. [Protocol deviation — CLAUDE.md precedence] `requirements.mark-complete CAP-02` not run**
- **Found during:** Task 3 close-out
- **Issue:** the executor protocol marks the plan's frontmatter requirements complete; CAP-02's measured verdict is NOT MET
- **Fix:** skipped the mark; recorded here and in `key-decisions`
- **Impact:** REQUIREMENTS.md unchanged; CAP-02 stays open for the gap round

---

**Total deviations:** 1 auto-fixed (Rule 3, Task 1) + 1 protocol step deliberately skipped (No-fabrication)
**Impact on plan:** the disposition file was necessary for the ubuntu leg to be measurable at all — and the ubuntu leg then failed one step earlier, so the gate chain's CI answer is still unmeasured. No scope creep; no fix to any measured red.

## Issues Encountered

- `gh run view <run> --job <id> --log` refuses to serve a completed job's log while the run is still in progress ("logs will be available when it is complete"); `gh api repos/abitwise/grugops/actions/jobs/<id>/logs` serves it. Used for both legs; documented in `tech-stack.patterns`.
- The `gh run view --log` form escapes ESC as the literal two characters `^[` and prefixes `job<TAB>step<TAB>timestamp`; the REST form carries a BOM and a bare timestamp prefix. The extraction strips both forms and was validated against the baseline windows log before use (23 files, 198 unique keys — one case, `GREEN 4`, is listed twice on the baseline for its two errors).
- The ledger tool prints the entire ledger on every `append`; piping it to `head` produced EPIPE noise after each write. Each append was verified to have landed exactly once (ids 229-235, no duplicates, counters agree).

## Authentication Gates

None — `gh` was already authenticated (`abitwise`, keyring); the push used the existing https credential.

## Known Stubs

None. The measurement document has no placeholder sections left: Part 2 replaced Task 1's "_Not yet written_" block.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-46 (the push) was mitigated by the blocking-human checkpoint as designed; T-33-47 (the verdict) by reading `conclusion` fields; T-33-48 (a conditional answering a red) by the `process.platform` count of 0 in the diff; T-33-49 (the ledger) by the tool-only rule and the counter/table/JSON agreement; T-33-50 (the timeout bound) by the recorded slowest tests; T-33-51 (installs) by no install at all.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 33-10 (live capture):** its D-05 precondition — the sha under test is pushed — is met by `d9bd4315`. Its own money-spending go is a separate blocking checkpoint.
- **CAP-02 gap round (round 1 of the four-round cap consumed by this measurement):** the input is `33-CI-MEASUREMENT.md` § 2.4/§ 2.5 and WINDOWS.md rows 226-235. The largest single class is (a), the `publicDocsCorpus` publishing boundary — 10 of the 31 windows reds from one `path.join`. The ubuntu pair (b) needs its mechanism established (`GREEN 1` passes alone on the same leg). The three one-arm-over survivors (d) are the pattern the project's memory records for every gap phase: probe every arm that consumes the changed value.
- **Row 186** can be disposed by the round that gets both legs green, citing runs `35394268365` and `35499800942`.
- **Unpushed local commits:** `b1f8850a` (Task 3) and the SUMMARY commit stay local by instruction; the human decides the next push.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- Files: 33-CI-MEASUREMENT.md, docs/audit/29-style-dispositions/33-09.md, WINDOWS.md, deferred-items.md, 33-09-SUMMARY.md all present on disk
- Commits: d9bd4315 (Task 1) and b1f8850a (Task 3) present in history; commits measured from plan_head_before e2f48fa3 = 2
- Task 3 verify: run 35499800942 for d9bd4315 exists in `gh run list`; `grep -ac conclusion` = 10; `windows status` 206/3/26/235 == 235 table rows == 235 JSON entries
- No control bytes in any changed file; `process.platform` count in the plan diff = 0
