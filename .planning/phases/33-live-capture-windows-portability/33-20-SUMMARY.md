---
phase: 33-live-capture-windows-portability
plan: 20
subsystem: ci
tags: [github-actions, windows-latest, ubuntu-latest, vitest, cap-02, windows-ledger, gap-closure-round-2]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-2 fix plans 33-14..33-19 (the 33 red rows of run 35499800942 closed by mechanism on darwin) and 33-09's Part 2 measurement shape
provides:
  - 33-CI-MEASUREMENT.md Part 3 — the pre-push inventory (§ 3.1, 33 rows with a measurability column), the pushed run read from its own metadata (§ 3.2), the verdict and the re-derived 35-row windows inventory with its one mechanism (§ 3.3), the ledger changes through the tool (§ 3.4)
  - the CAP-02 verdict for run 35579263776 — NOT MET (ubuntu success, windows failure) — the precondition text plan 33-21 reads
  - WINDOWS.md row 236 — the one new class (8.3 short-name spelling between the module's rung-1 canonicaliser and the WR-15 block's rung-2 fixtures), round 3's input
affects: [33-21, 33-22, 33-23, phase-33-gap-closure-round-3, cap-02]

# Actuals (#2632) — chars/4 over the realized diff cdf9a9b7..HEAD, not a harness token count.
actuals:
  tokens: 16325
  tasks: 3
  commits: 2
plan_head_before: cdf9a9b7b9b9d114b2fbd693c6b11807878952be

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A measurement plan changes no source file; a red leg is inventoried in the previous inventory's shape and handed to the next round (D-11, as 33-09 applied it)"
    - "A CI conclusion is quoted from `gh run view --json` fields and a failure inventory from the job's own log; never narrated"
    - "WINDOWS.md rows change only through `gsd-tools windows`; the counters, the table and the JSON appendix are asserted to agree afterwards"

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-20-SUMMARY.md
  modified:
    - .planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md

key-decisions:
  - "CAP-02 is NOT MET on run 35579263776: ubuntu `success`, windows `failure` — the requirement flips only when both legs read success (D-13); half the bar is newly met"
  - "The 35 windows reds are one class in one file and are recorded as ONE WINDOWS.md row (236), not 35: the ledger tracks classes, as § 2.7 did"
  - "Rows 229-235 stay open although every case they name is green on this run: the plan disposes them only on a run whose both legs are green; rows 186 and 193 likewise (row 186 now has three green measurements by id)"
  - "The mechanism is diagnosed to the line (context-io.ts:5317 rung-1 `realpathSync.native` vs context-io.test.ts:6226 rung-2 `realpathSync`) but which spelling is RIGHT is left `UNKNOWN - verify` for round 3 — the log proves the disagreement, not the answer"

patterns-established:
  - "Measurability classification is itself falsifiable: § 3.1 called W-21 measurable on darwin (a symlink seam) and the run showed the fix landed on an axis (8.3 names) that seam does not contain"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Part 3 § 3.2 quotes run 35579263776's id, head sha, run conclusion and BOTH jobs' conclusion fields from `gh run view --json`, with the per-step table"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "gh run view 35579263776 --json headSha,conclusion,jobs --jq '{headSha, conclusion, jobs: [.jobs[] | {name, conclusion}]}' → headSha 9e1c1131…, conclusion failure, ubuntu success, windows failure"
        status: pass
      - kind: other
        ref: "grep -a -cE 'CAP-02 verdict on this run: (MET|NOT MET)' 33-CI-MEASUREMENT.md → 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ 3.3 re-derives the windows failure inventory from the job's own log in § 2.4's shape — 35 cases, per line, assertion text, label (33 new + 2 incomplete fix), the falsified mechanism named (33-16 c1fca72b) — and flips no ledger row"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "node ~/.claude/gsd-core/bin/gsd-tools.cjs windows status → open 207 / waived 3 / fixed 26 / total 236; table rows 236; JSON ids 236; rows 186, 193, 226-235 unchanged"
        status: pass
      - kind: other
        ref: "git diff --stat cdf9a9b7..9e1c1131 -- scripts install hooks → empty; git diff --stat 9e1c1131..4c72d8b0 -- scripts install hooks → empty"
        status: pass
    human_judgment: false
  - id: D3
    description: "The diagnosis of the one class (rung-1 `realpathSync.native` expands 8.3 names; the WR-15 block's `tmp15` fixtures preserve them) is correct and complete — read from the tree, not reproduced on a windows host"
    requirement: CAP-02
    verification: []
    human_judgment: true
    rationale: "This host cannot produce an 8.3 short name; the mechanism is inferred from node's realpath implementations and the 35 identical assertion texts. Round 3's fix plan is where it is proven (a windows-spelled seam or the next pushed run)."

# Metrics
duration: 9h 2m wall (Task 1 00:04–00:30Z; human checkpoint and push 03:20Z–08:42Z; run 08:42–09:13Z; Task 3 08:47–09:22Z)
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 20: The CAP-02 round-2 measurement Summary

**One pushed CI run (35579263776) read from its own metadata: the ubuntu leg is green end to end for the first time — vitest 5376/5377 and the 23-command gate chain reached — and the windows leg is red on exactly one class in one file, 35 cases of `expected 'C:\Users\runneradmin\…' to be 'C:\Users\RUNNER~1\…'` created by 33-16's rung-1 canonicaliser against the WR-15 block's rung-2 fixtures; CAP-02 NOT MET, row 236 appended, nothing flipped, nothing fixed.**

## Performance

- **Duration:** 9h 2m wall, of which ~5h was the human checkpoint (Task 2) and 31 m the run
- **Started:** 2026-09-21T00:04Z (Task 1, previous executor); this continuation 2026-09-21T08:47:24Z
- **Completed:** 2026-09-21T09:22Z
- **Tasks:** 3 (2 auto + 1 blocking-human checkpoint, resolved by the human pushing `9e1c1131` themselves)
- **Files modified:** 3 (all under `.planning/`; no source file)

## Accomplishments

- **The run, quoted:** `gh run view 35579263776 --json …` — head sha `9e1c1131cec8943e2ac96233ed7e624720ced14b`, run `conclusion: failure`; job `test (ubuntu-latest)` `106268089166` `conclusion: "success"` (16 m 12 s); job `test (windows-latest)` `106268089020` `conclusion: "failure"` (31 m 39 s), red at step 11 only. Steps 4–10 green on both legs, including the first CI reading of 33-19's `check-build-parity` launcher (ubuntu step 6, `0 findings over 69/69`) and the windows 5-row shape remainder (step 10, `ALL CHECKS PASSED`).
- **Ubuntu, for the first time since 2026-07-15:** `Test Files 78 passed (78)`, `Tests 5376 passed | 1 skipped (5377)`, then step 12 — the 23-command gate chain no run had ever reached — green with 12 `ALL CHECKS PASSED` lines and the same headline numbers § 3.1 measured locally. U-1/U-2 green: the runner measured `[33-17 boundary] … shift 1` (this host: 0), confirming 33-17's SUITE diagnosis on the leg that produced the red.
- **Windows:** `Test Files 1 failed | 77 passed (78)`, `Tests 35 failed | 5339 passed | 3 skipped (5377)`, 0 timeouts. 29 of the 31 W-rows green; W-13 measured 59 235 ms under D-14's bound; W-19 answered (the `CreateProcess` bound cleared); W-22/W-26 (`USERPROFILE`), W-23/W-24/W-25 (8.3, expectation derived through `.native`), W-28 green. **Ten of the eleven `unmeasured locally, by construction` rows closed on their own axis; the eleventh (W-20) closed on its axis and reopened on 33-16's.**
- **The finding (§ 3.3):** all 35 reds are in `scripts/context-io.test.ts` :6456–:8605, the `31-15 — WR-15` describe block. `trustedRepoRoot` now walks from `canonicalWorkingDirectory(process.cwd())` (`context-io.ts:5317`, 33-16 `c1fca72b`), whose rung 1 `realpathSync.native` expands 8.3 short names on win32; the block's fixtures are `tmp15()` = `realpathSync(freshTmp())` (`:6226`, rung 2, which preserves them). 33 cases green on run 35499800942 are `new`; W-20 and W-21 moved from their round-1 arms onto this one (`incomplete fix` — W-21's symlink cell now resolves through the link, and the two spellings of that target disagree). POSIX hosts cannot see it because both realpaths agree there. The same axis 33-15 closed for W-23..W-25 by deriving through `.native`; the next round's shape is ONE spelling authority for both sides (D-15), not 35 per-case calls, and no `process.platform` branch (D-14/D-16). Which spelling is right is `UNKNOWN - verify`.
- **Ledger, through the tool only:** row 236 appended (`windows append`, one row for the one class); `windows status` → open 207 / waived 3 / fixed 26 / total 236, table 236 rows, JSON 236 ids. Rows 229–235 stay open (their cases are green on this run but the plan disposes them only on a both-legs-green run); row 186 (`board-watch-live.test.ts` `6 tests 7706ms` on windows) now has three green measurements by id — `35394268365`, `35499800942`, `35579263776` — and is not disposed; row 193 untouched.
- **REQUIREMENTS.md CAP-02:** checkbox stays `[ ]`; the coverage row reads `Pending — NOT met: CI run 35579263776 …` with both legs' conclusions and the counts, evidence Part 3 § 3.2–3.4.
- **Plan 33-21's precondition text** is on disk: Part 3 § 3.3 carries the verdict line for the currently pushed sha.

## Task Commits

1. **Task 1: The pre-push inventory** — `9e1c1131` (docs) — previous executor; Part 3 § 3.1 (every workflow command green locally, 33/33 titles pass, eleven rows named `unmeasured locally, by construction`, the expectation and its falsifier written before the push)
2. **Task 2: Checkpoint — named human confirmation to push** — no commit; resolved by the human ("push approved", then "pushed"): `origin/main` == `9e1c1131` verified by the orchestrator before dispatch; the executor never pushed
3. **Task 3: Read both legs from the run's own metadata; file the measurement; dispose only what a green run answers** — `4c72d8b0` (docs) — Part 3 § 3.2–3.5, REQUIREMENTS.md CAP-02 row, WINDOWS.md row 236

**Plan metadata:** the final docs commit (STATE/ROADMAP/SUMMARY) follows this file. `commits: 2` is measured: `git rev-list --count cdf9a9b7b9b9d114b2fbd693c6b11807878952be..HEAD` at SUMMARY-write time.

Every commit of this plan after the human's push is LOCAL — the human asked that nothing further be pushed until the finish. `git log --oneline origin/main..HEAD` will show them.

## Files Created/Modified

- `.planning/phases/33-live-capture-windows-portability/33-CI-MEASUREMENT.md` — Part 3 § 3.2 (the run: fields, per-step table, suite totals, the two NUL bytes located), § 3.3 (the verdict line; the prediction-vs-measured table; the eleven unmeasured rows' outcomes; the 35-row inventory in § 2.4's shape; the mechanism read from the tree; what was NOT done; row 186's third measurement; D-16 on the runner; the slowest tests per leg), § 3.4 (the `windows append` command verbatim, `windows status` counters, the three-representation check), § 3.5 (transcripts)
- `.planning/REQUIREMENTS.md` — CAP-02 coverage-table row (L227) only
- `.planning/WINDOWS.md` — row 236 via `gsd-tools windows append`; nothing else

## Decisions Made

- **One row for the one class.** § 2.7 appended one row per finding class (seven classes → rows 229–235). This run has one class in one file; row 236 carries all 35 cases with the mechanism, the two moved rows named, and the round-3 owner.
- **Rows 229–235 not flipped despite green cases.** The plan's rule is explicit (dispose only on a both-legs-green run) and 33-23 records their state; flipping on a red run would make the ledger say the requirement is closer than the runner says.
- **Rows 226–228 also not flipped.** The 33-15/33-16/33-17/33-19 summaries say those rows "flip only on plan 33-20's pushed run reading green"; the run did not read green. No plan flips them on a red run.
- **W-20 and W-21 labelled `incomplete fix`, not `not addressed`.** Their round-1 assertion texts are gone from the log (the driver answered; the link resolved) — the arms 33-15/33-16 aimed at closed — and the cases fail on a new arm. The label names the pattern the project's memory tracks ("created by previous fix").

## Deviations from Plan

None - plan executed exactly as written. Task 3 took the plan's red branch verbatim: verdict line, inventory re-derived in § 2.4's shape with per-red falsified-mechanism attribution, CAP-02 row to `Pending — NOT met`, no ledger row flipped, one new-class row appended through the tool, no fix, no re-push, no `npm test`.

One item the plan did not specify and was resolved without deviating: the human pushed `9e1c1131` themselves (the plan's resume signal allows "I pushed"), so § 3.2 records the push as the human's, verified by `origin/main == HEAD` at dispatch, rather than an executor `git push`.

## Issues Encountered

- The windows job log is CRLF; a first per-test duration extraction matched only file lines until `\r` was stripped. Corrected before any number was quoted (§ 3.3's slowest-test table is from the CR-stripped log).
- Both job logs carry two NUL bytes each, inside one passing test's stdout (a frontmatter fixture that plants `\0---\0`). Located by offset before quoting: 101 KB before the windows `Failed Tests 35` section, which itself carries zero control bytes. `npm run check:nul-bytes` → `ALL CHECKS PASSED` on the tree after every write.
- 17 of the 33 § 3.1 titles do not appear anywhere in the windows log because the default reporter prints no per-test line for a fast passing test; their green is established by their absence from `Failed Tests 35` together with their files' `✓ … (N tests)` lines with no `failed` count. § 3.5 states this.

## Authentication Gates

None. `gh` was already authenticated; `gh run view`, `gh run watch` and `gh api …/jobs/<id>/logs` ran without a prompt.

## Known Stubs

None. This plan writes measurement records; no code, no placeholder values, no skipped tests, no unrun verify. Row 236 is the ledger entry for the red the run measured (kind `unrun-verify`, the same kind § 2.7 used), recorded with `gsd-tools windows append` as the SUMMARY protocol asks.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-92 (unconfirmed push): the push was the human's own, after the blocking-human checkpoint; T-33-93 (narrated conclusion): every conclusion word is quoted from `gh run view --json` and the verify command re-reads them; T-33-94 (fix-and-re-push): no source file changed (`git diff --stat cdf9a9b7..HEAD -- scripts install hooks` empty), nothing pushed; T-33-95 (ledger tampering): one `windows append`, `windows status` asserted, table/JSON/counters agree; T-33-SC: no package installed (the run's `npm ci` used the committed lockfile: `added 48 packages`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 33-21 (live-capture go):** its precondition — Part 3 § 3.3 carries a verdict line for the currently pushed sha — is met, with the verdict NOT MET. Per its assumptions the go text must state that the tree is green on ubuntu and red on windows on one 8.3-spelling class in `context-io.test.ts` (the CONTEXT recommendation to capture against a both-legs-green tree is not honoured by this run). Note the pushed-sha wrinkle: 33-21's runner refuses unless HEAD == `origin/main`, and this plan's Task 3 and docs commits are LOCAL — a human push is needed before any go.
- **Plan 33-23 (ledger reconciliation):** reads `NOT MET`; every CAP-02 `deferred-items.md` entry whose class is green on this run may cite run `35579263776` as the confirming measurement for its leg per 33-23's own rule (the ubuntu two, the `publicDocsCorpus` ten, the o-prefix one, the uat-gate four, W-12/W-27/W-28/W-29, the board-watch-live item with three green ids); the ten context-io reds item stays open with a round-2 note quoting row 236 (W-20/W-21 moved, 33 new).
- **Round 3 (the next `--gaps` plan):** one class, one file, one authority to choose — row 236. The fix must not be 35 per-case edits and must not be a platform conditional. The eleven previously unmeasured mechanisms are now measured; the only open axis on windows is the 8.3 spelling of a canonicalised cwd.
- CAP-01 and CAP-03 untouched by this plan.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

- Files: 33-20-SUMMARY.md, 33-CI-MEASUREMENT.md, WINDOWS.md, REQUIREMENTS.md present
- Commits: 9e1c1131 (Task 1), 4c72d8b0 (Task 3) present in history
- `commits: 2` measured from the ledger base cdf9a9b7 at write time
