---
phase: 34-model-effort-dial-pi-support
plan: 25
subsystem: installer
tags: [install, ask-rules, closing-banner, DOC-1, WR-12, G-34-4, typescript, vitest]

requires:
  - phase: 33.1
    provides: writeAskRules (D-18), the ask-rules ledger and splice oracle, the closing notes block (e68c8258)
provides:
  - AskRulesOutcome union and writeAskRules(): AskRulesOutcome (every exit returns its outcome)
  - askRulesNotes(outcome), the one builder of the ask-rules notes sentence
  - install/closing-claims.test.ts, the nine-row outcome matrix against a settings-file oracle
affects: [34-verification, installer closing banner, DOC-1 class siblings (--update banner, --migrate "Nothing was changed.", uninstall preserved block)]

actuals:
  tokens: 10300      # chars/4 over the realized install/ diff (41302 chars)
  tasks: 2
  commits: 2
plan_head_before: 2e49a7d7e355509d04342cc2cd94a23b92af2130
plan_head_after: 413cddd8eea3b55c558eba338cba311ba3d05966

tech-stack:
  added: []
  patterns:
    - "An end-of-run sentence is built from the outcome its owner returns; the owner's declared return type makes an exit without an outcome a compile error"
    - "A closing-claims test reads the claim's truth from the artifact (the settings file before and after), never from installer output"

key-files:
  created:
    - install/closing-claims.test.ts
  modified:
    - install/install.ts
    - install/install.js
    - install/mode-census.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "none-wanted carries `users` beside `remaining` so the notes name the git host as the only floor only when no governed ask rule is present at all (must-have truth 2), not merely when no install-added rule remains"
  - "R5-R8, R11 and R13 are not staged in the matrix (the diagnosis' blind spots); they return the same `refused` outcome as R3/R4 and print the same sentence"

patterns-established:
  - "Outcome-owned closing sentence: owner returns a discriminated union, a pure notes builder with an exhaustive `never` switch prints it"

requirements-completed: [PI-03]

coverage:
  - id: D1
    description: "writeAskRules returns an AskRulesOutcome on every exit; an exit without one is a compile error"
    requirement: PI-03
    verification:
      - kind: other
        ref: "git grep -n \"function writeAskRules(): AskRulesOutcome\" install/install.ts (one line, :5511); npm run typecheck; npm run build"
        status: pass
      - kind: unit
        ref: "install/install.test.ts#IN-02: writeAskRules decides its splice oracle before its DRY_RUN return (install.ts and install.js)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The closing notes print the ask-rules sentence from the outcome only; the unconditional past-tense literal is gone"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#R14 fresh install / R9 every checkpoint lowered"
        status: pass
      - kind: other
        ref: "git grep -n \"This installer wrote Claude Code ask rules\" install/install.ts (no output)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nine-row matrix (R1 R2 R3 R4 R9 R10a R10b R12 R14): the added-rules sentence exactly when permissions.ask grew, measured from .claude/settings.json; all five outcome kinds observed"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/closing-claims.test.ts#closing claims: the ask-rules outcome matrix against the settings-file oracle"
        status: pass
    human_judgment: false
  - id: D4
    description: "Capability sentences keep their meaning (speed bump, not a security boundary; plugin form carries no permission rules; derived host line unchanged)"
    requirement: PI-03
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#a DRY_RUN install prints one closing line ending `get documentation only.`"
        status: pass
    human_judgment: true
    rationale: "The reworded capability line is prose; whether its meaning reads unchanged to a human is a reading judgment no test asserts."

duration: 1h 6m
completed: 2026-10-09
status: complete
---

# Phase 34 Plan 25: Ask-rules closing claim from the writeAskRules outcome Summary

**writeAskRules() now returns an AskRulesOutcome (written / present / none-wanted / dry-run / refused) on every exit, and the install `-- notes --` block prints the ask-rules sentence from that outcome only. A nine-row matrix holds it against a settings-file oracle.**

## Performance

- **Duration:** 1h 6m (two full-suite runs of about 29 minutes each)
- **Started:** 2026-10-09T20:51:25Z
- **Completed:** 2026-10-09T21:58:13Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `install/install.ts`: the `AskRulesOutcome` union sits beside `ASK_LEDGER`, and `function writeAskRules(): AskRulesOutcome` returns an outcome from all 14 exits as the diagnosis table maps them:
  - R1-R8, R11 and R13 return `ASK_REFUSED` (10 sites).
  - R9 returns `none-wanted` with `remaining` and `users`.
  - R10 returns `present` with `carried` and `users`, taken from the same `present`/`prevAdded` sets the skipped lines use.
  - R12 returns `dry-run` with `wouldAdd`. It is still the one `if (DRY_RUN)` branch, after the splice oracle.
  - R14 returns `written` with `added`.

  Every existing report, verify and `ASK_LEDGER` assignment stays where it was.
- `askRulesNotes(outcome)` is a pure builder with an exhaustive `never` switch. Only `written` says "This run added N Claude Code ask rule(s) ...". The others say:
  - `present`: "This run added no ask rule.", plus the earlier-install clause, the user's-own clause, or both.
  - `none-wanted`: "No ask rule was written: no checkpoint is at block ...", plus the `left` count, the user's-own count, or "the git host is the only floor" when neither is present.
  - `dry-run`: "DRY_RUN: this run would add N ... and wrote nothing."
  - `refused`: "No ask rule was written in this run (see the verify line above)."
- The notes block holds the outcome in one const (`const askOutcome = writeAskRules();`). After the outcome lines comes the capability line ("speed bump, not a security boundary", "other spellings of the same command are not matched"). The plugin-form sentence, the Safety line, the HOST_TOOLS host line and the "Only a human merges" line are unchanged in meaning.
- `install/closing-claims.test.ts` has the class-rule header, the `notesBlock(stdout)` helper, the two Task 1 cases and the nine-row Task 2 table. The oracle `grew` is computed from `.claude/settings.json` bytes and its `permissions.ask` length before and after each run. The test asserts the table size (9) and that all five outcome kinds were observed.

## Task Commits

1. **Task 1 (tracer): outcome returned, notes read it; R14 + R9** — `baa8d073` (fix). It also bumps the two census counts (see Deviations).
2. **Task 2: outcome matrix against the settings-file oracle** — `413cddd8` (test).

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

**RED (Task 1), run against the unchanged build (the committed `install.js` at 2e49a7d7):** `TMPDIR=/tmp/gd npx vitest run install/closing-claims.test.ts` gave `Tests 2 failed (2)`. Both failures were on the planned assertion:
- R14: `AssertionError: expected '-- notes --\n  Claude Code plugin for…' to match /this run added 55 Claude Code ask rul…/`. The regex was later capitalised to `This run added` to match the implemented sentence.
- R9 (first red line): `: expected '-- notes --\n  Claude Code plugin for…' not to match /installer wrote Claude Code ask rules/` at closing-claims.test.ts:85. The old literal printed in a run that wrote no rule and left no settings file.
- Semantic assessment: the target tests ran and failed on the claimed-sentence assertions, not on setup, load or fixture faults. RED is valid.

**GREEN:** after the change and `npm run build`, the verify command (`closing-claims.test.ts` + `install.test.ts -t "ask rules|IN-02|closing"`) gave `Test Files 2 passed (2)`, `Tests 25 passed | 398 skipped (423)`.

**TDD gate commits:** `workflow.tdd_mode` is false and the round rules forbid a red commit, so the RED test was not committed on its own. Each task is one green commit, and the RED run is recorded above.

## Mutation proofs (install/install.ts, built, run against closing-claims.test.ts, restored byte for byte and rebuilt)

Restoration was checked with `cmp` against saved copies of `install.ts` and `install.js` and with `git diff --quiet` on both files.

- **m1: the two unconditional past-tense literal lines put back in place of the outcome lines.** `Tests 12 failed | 1 passed (13)`. R1, R2, R3, R4, R9 and R12 went red as the plan expects. R10a, R10b and R14 went red too, because their outcome sentence was gone. First red lines:
  - R1-R4 and R9 rows: `: expected false to be true` at closing-claims.test.ts:251 (the no-rule-written sentence was missing).
  - R12: `expected false to be true` at :248 (the would-add sentence was missing).
  - R9 (Task 1 case): `: expected '-- notes --…' not to match /installer wrote Claude Code ask rules/` at :94.
- **m1b (extra): the old literal printed beside the outcome lines.** `Tests 10 failed | 3 passed (13)`. Every row except R14 went red at closing-claims.test.ts:254: `AssertionError: This installer wrote Claude Code ask rules for the governed command spellings into: expected true to be false`. This shows the WRITE_CLAIM check catches the literal even when the right outcome sentence is also printed.
- **m2: the `none-wanted` exit returns `{ kind: "written", added: rules.length }`.** `Tests 3 failed | 10 passed (13)`. R9 went red:
  - Task 1 case at :95: `expected '-- notes --…' not to match /This run added \d+ Claude Code ask ru…/`.
  - Matrix row at :246: `Expected: "R9 every checkpoint lowered (NOTIFY_CONFIG): added=false"`, `Received: "...: added=true"`.
- **m3: the DRY_RUN exit returns `ASK_REFUSED`.** `Tests 2 failed | 11 passed (13)`. R12 went red at :248: `expected false to be true` (the would-add sentence was missing).

The aggregate "the rows produced all five outcome sentence forms" case also went red under every mutation (`expected 8 to be 9`, or fewer).

## Regression gate (final, at HEAD 413cddd8)

- `npm run build`: exit 0. `npm run check:build-parity`: `ALL CHECKS PASSED`. `npm run typecheck`: exit 0.
- `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**'` (Node v26.11.0) printed:
  - ` Test Files  1 failed | 103 passed (104)`
  - `      Tests  1 failed | 7548 passed | 2 skipped (7551)`
  - The one red is the known local red: install/installer-fs-census.test.ts, `UNCLASSIFIED node:fs export openAsBlobSync` (Node 26 runtime, deferred-items.md).
- `PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts` (Node v24.12.0): `Test Files 1 passed (1)`, `Tests 24 passed (24)`.

## Files Created/Modified

- `install/install.ts`: AskRulesOutcome, ASK_REFUSED, `writeAskRules(): AskRulesOutcome`, `askRulesNotes()`, the `askOutcome` const, the outcome-driven notes lines and the header paragraph "THE OUTCOME".
- `install/install.js`: the `tsc` build of the above (parity checked).
- `install/closing-claims.test.ts` (new): class-rule header, `notesBlock`, R14/R9 cases, and the nine-row matrix with the settings-file oracle.
- `install/mode-census.test.ts`, `install/path-spelling-census.test.ts`: the scanned installer-test-file count goes from 28 to 29.

## Decisions Made

- `none-wanted` carries `users` (governed spellings present as the user's own) as well as the planned `remaining`. Must-have truth 2 says to name the git host as the only floor "only when no ask rule is present at all". With `remaining` alone, a user who holds their own governed rules and lowers every checkpoint would have been told the git host is the only floor.
- Sentence wording is capitalised and exact ("This run added ...", "No ask rule was written ..."). The test matches these exact forms, not loose words.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two census tests count installer test files and went red on the new test file**
- **Found during:** Task 2 regression gate (first full-suite run: `Test Files 3 failed | 101 passed (104)`, `Tests 3 failed | 7546 passed | 2 skipped (7551)`).
- **Issue:** install/mode-census.test.ts (`INSTALL_TEST_FILE_COUNT`) and install/path-spelling-census.test.ts (`TEST_SCANNED_FILE_COUNT`) assert the installer test-file set has 28 entries. closing-claims.test.ts makes 29. Both failure messages say to read the new file for chmod, mode and path comparisons, then update the count.
- **Fix:** I read the new file. It has no chmod, no mode expectation and no comparison of a recorded path. Both counts went to 29, with a note naming plan 34-25.
- **Files modified:** install/mode-census.test.ts, install/path-spelling-census.test.ts
- **Verification:** the two census files and closing-claims.test.ts gave `Tests 43 passed (43)`. The final full suite shows only the known red.
- **Committed in:** baa8d073. I amended this into the unpushed Task 1 commit (first hash 52152454), the commit that added the file, so no commit in the plan's history is red on the censuses.

**2. [Rule 2 - Correctness] `none-wanted` gained a `users` count** (see Decisions Made). Committed in baa8d073.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 correctness).
**Impact on plan:** both are needed for a green gate and for truth 2. Nothing changed which rules are written, the splice, the oracle, ASK_LEDGER or uninstall.

## Issues Encountered

- The m1 mutation, as specified, also reddens R10a, R10b and R14, because the outcome lines are gone, so it is a superset of the plan's expected red set. m1b shows the literal on its own is caught.
- Each full-suite run on this machine takes about 29 minutes (1743 s).

## Not covered (recorded, not fixed)

- R5-R8, R11 and R13 are not staged; their `refused` mapping comes from reading the source. Windows behaviour is not claimed (D-25).
- The diagnosis found sibling instances of the same DOC-1 run-time class outside this plan's scope:
  - (A) the `--update` banner prints "== update complete ==" after a verify.
  - (B) `--migrate` prints "Nothing was changed." after a backup and a marker edit.
  - (C) uninstall's "preserved (never touched)" block.
  
  This plan does not touch them.

## User Setup Required

None.

## Next Phase Readiness

G-34-4's main finding (WR-12) is closed for every POSIX outcome a full install reaches. Ready for 34-26.

## Self-Check: PASSED

- FOUND: install/closing-claims.test.ts, install/install.ts, install/install.js, .planning/phases/34-model-effort-dial-pi-support/34-25-SUMMARY.md
- FOUND commits on HEAD: baa8d073, 413cddd8 (`git rev-list --count 2e49a7d7..HEAD` = 2)
- Acceptance: one `function writeAskRules(): AskRulesOutcome` line; no `This installer wrote Claude Code ask rules` in install/install.ts; IN-02 and the install.test.ts ask-rules rows pass; build parity passes.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-09*
