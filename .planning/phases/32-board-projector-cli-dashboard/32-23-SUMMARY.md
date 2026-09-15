---
phase: 32-board-projector-cli-dashboard
plan: 23
subsystem: testing
tags: [adversarial-review, safety-guard, ast, no-fabrication, gap-closure, ledger-reconciliation]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-15..32-22 — the eight round-2 gap-closure plans this review measures rather than trusts"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-14-ADVERSARIAL-REVIEW.md — the round-1 document whose section order, premise protocol and transcript format this one follows"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-VERIFICATION.md and 32-REVIEW.md — the two oracles whose recorded reproductions are the row set"
provides:
  - "Every recorded reproduction from both oracles re-run against the rebuilt committed .js, each a measured row with its exit code"
  - "A reachability table with one row per refusal branch this round added (20), each naming its predicate, its carrying command and how that command is reached"
  - "Five new findings, four of them created by this round's own fixes, each with a reproduction and none fixed here"
  - "A derived 20-row gate sweep and a round ledger asserted total against a 20-item gap inventory"
  - "Both .planning/WINDOWS.md representations reconciled and asserted to agree by row identifier (191/191/0)"
affects: [phase-32 verification, round 3 of the gap-closure cap, board-projector, dashboard-safety]

actuals:
  tokens: 23741    # chars/4 over the realized diff of the three task commits (94,966 chars)
  tasks: 3
  commits: 3       # MEASURED: git rev-list --count 28b2b028..HEAD at SUMMARY-write time
plan_head_before: 28b2b0287fd2787328a8a7d9d02de41e1292106d

tech-stack:
  added: []
  patterns:
    - "Re-run the WHOLE recorded set, not the current round's: a regression in an earlier round's closure is invisible to a pass that only re-checks this round's list"
    - "Record WHICH case reds, not only how many: a mechanism case and a cardinality pin are different evidence"
    - "Probe the sibling ARM, then probe the EDIT the failure message invites — a refusal that survives only until a maintainer records a path is a one-edit re-green"
    - "Assert the ledger's two representations agree by row identifier, with a comparator that survives pipes and backslashes inside cells"
    - "State the created-versus-inherited ratio as a number, because it is the only signal that says a canonical-form cutover is overdue"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-23-ADVERSARIAL-REVIEW.md
  modified:
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
    - .planning/WINDOWS.md
    - .planning/ROADMAP.md

key-decisions:
  - "NOTHING was fixed in source. This plan owns four report and ledger files; every closure available would have been a fix in a file it does not own, at the end of a round — the shape that made the previous round's first finding"
  - "The absolute-path specifier finding (F-04) is recorded with the whole TS-to-JS chain measured, because that is what makes it strictly stronger than the F-03 it sits beside: the .ts typechecks and check:build-parity passes by construction"
  - "F-08 is demonstrated in TWO steps — the refusal, then the single edit the failure message invites — because the first step alone reads as a working guard"
  - "The WR-01 advisory is recorded as CLOSED for the measured rewrites and OPEN for the Array.join spelling, rather than collapsed to one verdict: `+`-concatenation is folded by the census and Array.join is not, which narrows ledger row 184's wording"
  - "The round ledger keeps WR-01's duplicate row (advisory and warning 1) rather than silently collapsing it, because the inventory counts it in both places and a collapsed row would make the totality assertion false by one"
  - "REQUIREMENTS.md and the Phase 32 status line are deliberately untouched, per the plan's own success criteria — the verifier decides what this round achieved"

patterns-established:
  - "Derive the sweep's row set from the manifest AT SWEEP TIME, and re-run the sweep after the round's own document commits so it measures the tree a reader checks out"
  - "Name the counter-reading of your own finding: F-06 carries the two readings under which its sentence is defensible, so the next round weighs evidence rather than rhetoric"
  - "A recommendation is only useful if it is small: the closing summary names three specific instruments this repository already owns rather than proposing a rewrite"

requirements-completed: []  # DELIBERATELY EMPTY. The plan's <success_criteria> state that REQUIREMENTS.md checkboxes are NOT changed by this plan. It measures the phase; the verifier decides the verdict.

coverage:
  - id: D1
    description: "Every reproduction recorded in 32-VERIFICATION.md and 32-REVIEW.md — including the ones both documents record as CLOSED — is re-run against the rebuilt committed .js and recorded as a row with its measured exit code, on a harness that asserted its own premise first."
    verification:
      - kind: other
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness && npm run freshness:context"
        status: pass
      - kind: other
        ref: "five DASH-06 plants into scripts/board-read.js + npm run check:dashboard-readonly; each restored with a clean `git diff --exit-code -- scripts/board-read.js`"
        status: pass
      - kind: other
        ref: "seven reader/renderer transcripts on disposable fixtures outside the repository root (EACCES, 0xE9, symlink, OSC/CSI on stderr and argv, grammar refusal, C1 in --json)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 75 files, 4974 passed, 2 skipped"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each of the 20 refusal branches this round added has a reachability answer naming the command that carries it and how that command is reached, with suite membership DERIVED from `vitest list` and CI wiring read out of ci.yml; round 1's F-01 is measured closed."
    verification:
      - kind: other
        ref: "npx vitest list --exclude '**/scripts/e2e/**' — 69 files, each of the eight carrying files present"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the DASH-06 control's reachability is mechanical, not assumed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each of the six sibling questions is asked and answered in writing against this round's fixes, and every finding the probes raise carries a name, a severity, a reproduction and a disposition — five findings, four created by this round, none fixed here."
    verification:
      - kind: other
        ref: "F-04: absolute-path specifier planted; npm run check:dashboard-readonly exit 0, 89/89; the export invoked creates a 27-byte file; the .ts typechecks and tsc emits the specifier verbatim"
        status: pass
      - kind: other
        ref: "F-08: process.report recorded in EXPECTED_GLOBAL_MEMBER_PATHS, count 10 -> 11; gate exit 0, 89/89 over the planted writer; both files restored clean"
        status: pass
      - kind: other
        ref: "F-06: a ticket whose declared id differs from its stem yields row-without-file with an `expected` path that exists and no readErrors entry"
        status: pass
    human_judgment: true
    rationale: "Whether F-05 and F-06 are defects or defensible design, and whether F-04's severity warrants a round-3 plan, are judgment calls this document argues but does not decide. The measurements underneath each one are automated and reproduced above; the disposition is the verifier's."
  - id: D4
    description: "The gate sweep's row set is derived from package.json at sweep time (20 rows, one pre-existing red re-derived as unchanged), both WINDOWS.md representations agree by row identifier, and the round ledger has one row per gap-inventory item with the row count asserted equal to the inventory count."
    verification:
      - kind: other
        ref: "20 rows derived from package.json scripts; 19 exit 0; check:diff-disposition re-derived as 78 findings over the same five Phase-31 documents, 0 hits for any file this phase touched"
        status: pass
      - kind: other
        ref: "ledger comparator over .planning/WINDOWS.md: row identifiers compared 191, table rows 191, json rows 191, disagreements 0"
        status: pass
      - kind: other
        ref: "round ledger row count 20 == inventory count 20 (2 failed truths + 1 partial + 1 advisory + 11 warnings + 3 info + 1 reachability + 1 human-verification)"
        status: pass
    human_judgment: false

# Metrics
duration: 46 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 23: Gap-Closure Round 2 Adversarial Re-Verification Summary

**All 26 recorded reproductions re-run against the rebuilt committed `.js` — 25 measured closed, including both of round 1's open findings — while the neighbour-variation pass raised five new findings, four of them created by this round's own fixes, among them a DASH-06 guard that exits 0 over a writer imported through an absolute-path specifier.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-09-15T13:08:58Z
- **Completed:** 2026-09-15T13:55:13Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **The premise is a table, not a sentence.** Five commands with exit codes, the four lines
  `git status --short` named after the build all accounted for, and the sha256 of the three
  artifacts every transcript is measured against — so no row below measures a stale build.
- **The whole recorded set re-run, not this round's list.** Six original blockers, three verifier
  gaps, one advisory, eleven warnings, three info items and round 1's two findings: **26 rows, 25
  measured closed**. The one still open is the `Array.join` half of the WR-01 advisory, which is
  ledger row 184's stated blind spot measured for the first time.
- **Round 1's two open findings are closed and measured.** F-03 (`process.getBuiltinModule("node:" +
  "fs")`) now exits 1 on the mechanism case, and F-01's reachability case passes with the suite
  exclusion parsed out of `ci.yml` rather than assumed.
- **A 20-row reachability table**, one row per refusal branch this round added, with suite membership
  derived from `vitest list` (69 files) and CI wiring read out of `ci.yml` (`:102`, `:174`, `:242`,
  `:517`).
- **Five findings, four created by this round's own fixes**, every one with a reproduction and none
  fixed here — F-04 (absolute-path specifier past the guard AND the closure walk, measured with a
  real write and through the whole `.ts`→`.js` chain), F-08 (one recorded member path re-greens the
  guard over a writer in a single edit), F-06 (`row-without-file` still asserts absence against a
  file whose declared `id` is not its stem), F-05 (a raw C0 survives the stdout sanitizer and one
  `JSON.parse`), F-07 (a two-gate `check:*` script proves its first gate only).
- **A derived 20-row gate sweep** with the pre-existing `check:diff-disposition` failure re-derived
  rather than recalled — the same 78 findings over the same five Phase-31 documents, 0 hits for any
  file this phase touched.
- **Both ledger representations reconciled and asserted:** rows 179–182 marked `fixed`, five new
  rows appended, `191 table / 191 json / 0 disagreements`.
- **A round ledger asserted total:** 20 rows against a 20-item inventory, both numbers stated.

## Task Commits

1. **Task 1: assert the harness's premise, then re-run every recorded reproduction** — `042e984d` (docs)
2. **Task 2: the neighbour-variation pass — how each new gate is REACHED, and what its siblings consume** — `8e397457` (docs)
3. **Task 3: the derived gate sweep, the ledgers reconciled, and the round's disposition table** — `079a5f61` (docs)

## Files Created/Modified

- `.planning/phases/32-board-projector-cli-dashboard/32-23-ADVERSARIAL-REVIEW.md` — 849 lines: the
  premise, the transcripts, the spot-checks, the reachability table, the six sibling questions, the
  five findings, the derived sweep, the round ledger and the closing recommendation.
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — the `check:nul-bytes`
  entry closed with its measurement (`status: resolved`); the `check:diff-disposition` entry
  re-measured, given an explicit `status: open`, and left open with the re-derived finding set.
- `.planning/WINDOWS.md` — rows 179, 180, 181 and 182 marked `fixed` through `gsd-tools windows
  fixed`; rows 187–191 appended for F-04, F-08, F-06, F-05 and F-07. Phase 32 now holds 23 rows: 19
  open, 4 fixed.
- `.planning/ROADMAP.md` — the round-2 block gains a *Scope moved* note for each plan that moved
  scope during execution and a *Measured result* note under 32-23. The phase status line and every
  requirement checkbox are unchanged.

## Decisions Made

- **Nothing was fixed in source.** The plan permits closing a finding only when it is inside a file
  the plan already touches and is provably small. This plan's `files_modified` are four report and
  ledger files, so the honest answer for all five findings is OPEN with a reproduction. A fifth fix
  in a sixth file at the end of a round is how the next round's first finding is made.
- **F-04 is recorded with the whole toolchain measured**, not only the committed `.js`: with a
  declaration file present the `.ts` typechecks at exit 0, `npm run build` emits the absolute
  specifier verbatim, and the guard is green over that built output. That is what makes it strictly
  stronger than F-03 was, whose bound included "rebuild past `check:build-parity`".
- **F-08 is demonstrated in two steps.** Step one (the binding-form writer) reds the census and reads
  like a working guard; step two is the single edit the failure message invites, after which the gate
  is green at 89/89 over the writer. Recording only step one would have understated it; recording
  only step two would have looked like tampering.
- **The WR-01 advisory is split rather than collapsed.** `new RegExp` and `+`-concatenation are
  detected (measured as real files planted under `scripts/`); `Array.join` is not. Ledger row 184's
  wording is narrowed by that measurement rather than restated.
- **The round ledger keeps WR-01's duplicate row.** The inventory counts it as the advisory AND as
  warning 1; collapsing it would have made the totality assertion false by one and hidden the fact
  that its two halves have different dispositions.
- **REQUIREMENTS.md and the Phase 32 status line are untouched**, per the plan's own
  `<success_criteria>`. This repository has a recorded incident of an executor's roadmap update
  flipping a phase to Complete before verification ran.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two cited identifiers in the review were wrong, caught by reading the source back**
- **Found during:** Task 2 (writing §4.3 and §5.3)
- **Issue:** The draft cited `fallbackIdentity` as a function name — it is the docblock's phrase; the
  function is `ticketStem` at `scripts/board-read.ts:1159`. It also cited
  `board-readonly.test.ts:743-790` for `collectAcquisitions`, which begins at `:744`.
- **Fix:** Both citations corrected against the files before the Task 2 commit. A review document
  whose line numbers are wrong is a document the next round cannot re-run.
- **Files modified:** `32-23-ADVERSARIAL-REVIEW.md`
- **Verification:** `grep -n` for each corrected symbol and line against the source.
- **Committed in:** `8e397457`

**2. [Rule 1 - Bug] The ledger comparator reported three false disagreements**
- **Found during:** Task 3 (reconciling `.planning/WINDOWS.md`)
- **Issue:** A naive `split("|")` over the Markdown table mis-indexes any row whose description or
  reason cell contains a literal `|` (rows 15, 23) or a trailing backslash (row 78), so the first two
  comparators reported disagreements that did not exist. Each was checked individually and both
  halves agreed in all three cases.
- **Fix:** The comparator was rewritten to take the LAST `| open|fixed|waived |` token on the line and
  to compare by row identifier in both directions, which is exact over all 191 rows.
- **Files modified:** none in source; the measurement is quoted in §7 of the review.
- **Verification:** `row identifiers compared: 191 | table rows: 191 | json rows: 191 | disagreements: 0`
- **Committed in:** `079a5f61`

### Process notes (not deviations, recorded so they are not mistaken for silence)

**3. `requirements.mark-complete` was NOT run, and `requirements-completed` is deliberately `[]`.**
The plan declares `requirements: [DASH-01 … DASH-08]` because it measures the phase rather than a
slice of it, and its `<success_criteria>` state in the same breath that REQUIREMENTS.md checkboxes
must not change. Running the verb would have ticked all eight. 32-22 set the identical precedent for
the same reason.

**4. Committed directly on `main`.** `.planning/config.json` sets `git.branching_strategy: "none"`
and `use_worktrees: false`, the orchestrator dispatched this plan as a sequential executor on the
main working tree with an explicit instruction not to switch branches, and every Phase-32 commit to
date is on `main`. The pre-existing uncommitted changes (`.planning/milestone.lock`,
`human-notes.txt`, untracked `.gsd/` and `.planning/state.json`) were never staged.

**5. Probes planted source into tracked build outputs and into two `.ts` files, and every one was
restored.** Fourteen plants into `scripts/board-read.js`, one into `scripts/board-read.ts`, one into
`scripts/board-dashboard.ts`, one into `scripts/board-readonly.test.ts`, and three throwaway files
under `scripts/`. Every plant was followed by a restore and a recorded clean `git diff --exit-code`;
`git status --short -- scripts/ agent-factory/` reports **0 lines** at the end of the run, and
`npm run check:build-parity` and `npm run freshness` are green over the final tree.

---

**Total deviations:** 2 auto-fixed (2 bugs) + 3 process notes.
**Impact on plan:** No scope creep. Both auto-fixes are about the honesty of the measurement rather
than about the code under it, which is the right failure mode for a review plan to have.

## Issues Encountered

- **The live claude-CLI e2e lane was not run** (`npm test`), because it spends tokens on an
  authenticated box and can hang. Its state stays `UNKNOWN - verify`, carried as ledger row 183 and
  stated in §0 and §8 of the review rather than left to inference.
- **`check:diff-disposition` is red and stayed red.** Re-derived as the identical pre-existing
  failure — 78 findings, five Phase-31 workflow documents, 0 hits for any file this phase touched —
  so it is neither a regression of this round nor absorbed into it. Ledger row 176.
- **The Windows leg of the live watch suite is still unmeasured** (ledger row 186); this review ran
  entirely on macOS Darwin 25.5.0 / Node v24.12.0 and says so in its header.

## Known Stubs

None. This plan produced no source change and therefore no stub. The five findings it records are
defects in shipped code, tracked as `.planning/WINDOWS.md` rows 187–191 rather than as stubs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**This plan does not decide phase completion, and it did not.** `.planning/REQUIREMENTS.md` still
marks all eight DASH-0x requirements incomplete and the Phase 32 status line is unchanged; the
verifier owns that verdict and now has a measured evidence base for it.

**What round 3 inherits, if the verifier calls for one** (this was round 2 of a hard cap of 4, so two
remain): five open findings with reproductions, of which F-04 and F-08 are both live bypasses of the
DASH-06 mechanical no-write guard. The review's closing section argues — with the ratio as the
evidence, 4 of 5 new findings created by this round's own fixes — that three of them share one shape:
a derivation whose SUBJECT is a set defined by a syntactic complement, leaving a third population
unasked. It names three small instruments this repository already owns (a total partition with a
refusing third bucket, the canonical-form question asked one level down, and a denominator derived on
the other side of the loop) rather than proposing a rewrite, and states plainly that a fourth round
spent adding one more arm per predicate should be expected to produce four more findings of the same
shape.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*
