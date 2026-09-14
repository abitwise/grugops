---
phase: 32-board-projector-cli-dashboard
plan: 02
subsystem: tooling
tags: [typescript, markdown-grammar, board-projector, invariants, bounds, contract]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-01's pure board-grammar module, its declared-but-empty updates/nonColumnSections/unparsed/bounds fields, and the contract's four stub headings"
  - phase: 31-uat-spec-integrity-and-admission
    provides: "the canonical-form admission posture (D-64) the partition's refusal arms follow, and the derive-the-set-assert-the-count discipline the pin move here follows"
provides:
  - "scripts/board-model.ts — the line partition is TOTAL: updates[], preamble, nonColumnSections[], unparsed[] and bounds are all populated"
  - "the precedence rule that makes the partition disjoint: heading > blank > canonical update > legal row > position"
  - "D-20 bounds — boardBytes in UTF-8 bytes, longestLine in UTF-16 code units, a 1,024-unit cap on the opaque strings, and no row ever dropped"
  - "scripts/board-model.test.ts — five structural invariants (I1..I5) with independently derived denominators and an independent comment-blanking oracle"
  - "agent-factory/contracts/board.md — complete: Sections/partition, Conflicts, Staleness, Bounds, Reconciliation and non-goals, Provenance"
affects: [32-03, 32-04, 32-05, 32-06, 32-07, 32-08]

actuals:
  tokens: 16000
  tasks: 3
  commits: 5
plan_head_before: 5a8d6d9b21f673c83e4a6fae295d74f73e0d4866

tech-stack:
  added: []
  patterns:
    - "An independent ORACLE inside the test file (a character state machine) cross-checking the shipped implementation (an indexOf scan) — two implementations where only one ships"
    - "Every invariant preceded by a PREMISE assertion that its denominator equals a second, independently derived element count, not merely that it exceeds zero"
    - "Truncation that cuts BEFORE a surrogate pair, so a bound never emits a lone surrogate into a terminal"
    - "Bounds REPORTED on every parse rather than enforced by refusal — the degradation is visible and the rows all survive"

key-files:
  created:
    - scripts/board-model.test.ts
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - agent-factory/contracts/board.md
    - scripts/board-tracer.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "`preamble` ends at the first level-two heading rather than at the first column heading, because the task's own behaviour contract requires a `## Notes (…)` section to collect its prose in a document with zero columns"
  - "A legal row OUTSIDE every column is an unparsed line with a null column, never a section line — that is what makes the old spec's `## Blocked (2)` refusal visible"
  - "`MAX_META_CHARS` bounds the trailer as well as the meta, and `MAX_UPDATE_TEXT_CHARS` bounds the actor as well as the text, because each pair is one string and its suffix"
  - "A row's title is deliberately NOT capped: it is the field that identifies the row, and the measured 34,494-character line is a parenthetical"
  - "`boardBytes` is measured on the input AS GIVEN, before CRLF normalization, so it equals what `ls -l` reports"

patterns-established:
  - "Partition precedence stated once in the module docblock and once in the contract prose, with no third spelling and no regex in the contract"
  - "A pin moved only AFTER the gate had read the new file and reported zero findings, with the entrant, the part and the re-derivation named"

requirements-completed: [DASH-01, DASH-02, DASH-08]

coverage:
  - id: D1
    description: "The line partition is total and disjoint over the kit board, its seed twin, plans/traceability.md and a synthetic board that reaches every bucket"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — I1, the partition is total (4 corpus cases + the disjointness case)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — I4, unparsed lines are ordered and real"
        status: pass
    human_judgment: false
  - id: D2
    description: "A fresh checkout's kit board reports ZERO unparsed lines, and its own `_Updated:` placeholder sits in the preamble rather than on the findings list"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#reports zero unparsed lines on the kit board as it ships"
        status: pass
      - kind: e2e
        ref: "node -e parseBoard(plans/board.md) -> 'kit board: 0 unparsed, 2 preamble' (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No parsed entity carries a line number inside a comment span, and an unterminated opener blanks to end of file"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — I2, a comment span contributes no parsed entity (4 corpus cases)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#gives a document whose comment never closes zero columns and zero rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "Columns and rows are conserved: one column per legal heading, and every legal row is either placed under its column or refused loudly"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — I3, columns are conserved (4 corpus cases + the identical-name case)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — I5, rows are conserved (4 corpus cases)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#refuses the old spec's `## Blocked (2)` form and reports its row as unparsed (D-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "bounds records boardBytes in UTF-8 bytes and longestLine in UTF-16 code units, with exceeded flipping strictly past each ceiling"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — bounds are measured on every parse (D-20) — 4 boundary cases at 1048576/1048577 bytes and 65536/65537 code units"
        status: pass
      - kind: e2e
        ref: "node scripts/board-dashboard.js . --once --json -> bounds {boardBytes:5169,longestLine:101,exceeded:false}"
        status: pass
    human_judgment: false
  - id: D6
    description: "An over-long meta, trailer or update line is shortened at its cap with a marker and a truncated flag, the record survives, and no cut splits a surrogate pair"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — truncation shortens the opaque strings and drops no row (D-20) (5 cases)"
        status: pass
    human_judgment: false
  - id: D7
    description: "A 384 KB board carrying a 34,496-character line parses in full, keeps all 7,000 rows, and completes well inside the two-second bound (T-32-01)"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#parses a chess-sized board with a 34 KB line in under two seconds (T-32-01)"
        status: pass
    human_judgment: false
  - id: D8
    description: "A WIP number that is not a base-ten integer makes the heading a non-column heading rather than being rounded or coerced to zero (T-32-09)"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#board-model — a WIP number is read, never coerced (T-32-09) (5 refusal cases + 1 conforming case)"
        status: pass
    human_judgment: false
  - id: D9
    description: "agent-factory/contracts/board.md is a complete normative contract — seven required sections filled, all seven conflict kinds named, no regex restated — and green under every doc gate"
    requirement: DASH-01
    verification:
      - kind: integration
        ref: "npm run check:imperative-lexicon (0 findings over 49/49 elements; 3471 sentences, none over bound)"
        status: pass
      - kind: integration
        ref: "npm run check:banned-claims && npm run check:public-docs && npm run check:claim-anchors (all PASS)"
        status: pass
      - kind: other
        ref: "grep -c '^## ' -> 13; conflict-kind grep -> 9; regex grep -> 0; 'Filled by plan' grep -> 0"
        status: pass
    human_judgment: false
  - id: D10
    description: "The partition's precedence rule is the RIGHT one for the six later plans and for a future web renderer — specifically that preamble ends at the first heading of any kind, and that a legal row outside every column is a refusal rather than a section line"
    verification: []
    human_judgment: true
    rationale: "Both are schemaVersion 1 shape decisions (D-19 is one-way for reinterpretation) and both DIVERGE from the plan's prose in order to satisfy the plan's own behaviour bullets. No test can say whether the resulting bucketing is what plan 32-04's corpus axes and plan 32-05's golden actually want — only a human reading the contract against the six downstream plans can."

duration: 37 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 02: The total line partition, the D-20 bounds, and the finished contract

**Every line of every board reachable from this checkout now lands in exactly one of seven named buckets — proven by five structural invariants whose denominators are derived independently of the parser — and a 384 KB board with a 34 KB line parses in full, keeps all 7,000 rows, and shortens only its opaque strings.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-09-14T08:30:58Z
- **Completed:** 2026-09-14T09:07:53Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- **The partition is total, and the proof does not trust the parser's own arithmetic.** `parseBoard` now fills `updates[]`, `preamble`, `nonColumnSections[]` and `unparsed[]`. Invariant I1 sums the buckets and compares them against a raw line count and a blank-or-heading count derived by a scan that never calls `parseBoard` — over the kit board, its seed twin, `plans/traceability.md` and a synthetic board that reaches every bucket. The kit board reports **zero** unparsed lines on a fresh checkout, and its own `_Updated: <ISO date> by <role>_` placeholder sits in the preamble rather than on the findings list.
- **The board's own documentation block is invisible by construction, and a second implementation says so.** The test file carries `blankIndependently`, a character state machine, where the module scans with `indexOf`. Invariant I2 asserts that no column, row, epic row or update carries a line number inside a span that the *oracle* found — so a defect in the shipped stripper cannot hide behind the assertion that checks it. The discrimination half, a no-op stripper turning I2 red, is plan 32-04's.
- **`## Blocked (2)` is refused loudly rather than absorbed quietly.** A legal row that finds no open column becomes an unparsed line with a null column, which is what makes the old builder specification's Blocked form visible to a reader instead of silently swallowed into a non-column section.
- **A chess-sized board degrades visibly and loses nothing.** `bounds` records the UTF-8 byte length and the longest line in UTF-16 code units, `exceeded` flips strictly past 1,048,576 bytes and 65,536 code units, and only `meta`, `trailer`, an update's `text` and its `actor` shorten — each at 1,024 units, each with a marker, each flagging its carrying record. A 384 KB fixture with a 34,496-character line keeps all 7,000 rows and parses well inside the two-second wall-clock assertion this repository's 383-second incident bought.
- **The contract every later corpus derives from is complete.** `agent-factory/contracts/board.md` now carries thirteen sections, names all seven D-10 conflict kinds with their shared payload, states the three-arm staleness outcome and the absent-versus-unreadable distinction, states both ceilings with their units, discharges research open question 7 in writing, and closes with a Provenance section naming `scripts/board-model.ts` as the only sanctioned reader. It restates no regex.

## Task Commits

1. **Task 1 RED: failing tests for the total line partition** — `ecd2fc9b` (test)
2. **Task 1 GREEN: the total line partition** — `f2e9411c` (feat)
3. **Task 2 RED: failing tests for the D-20 bounds and truncation** — `9c0d82fa` (test)
4. **Task 2 GREEN: bounds and truncation** — `e35246e3` (feat)
5. **Task 3: the finished normative contract** — `864716fa` (docs)

_Both `tdd="true"` tasks produced a RED commit and a GREEN commit. No REFACTOR commit was needed: task 1's implementation was rewritten wholesale rather than accreted, and task 2 added two small functions beside it._

_Task 2's RED commit deliberately shipped the four constants and the two `truncated` fields as SHAPE only, so the failing run failed on behaviour assertions rather than on module resolution — the pattern plan 32-01 established._

## Files Created/Modified

- `scripts/board-model.test.ts` (new, 697 lines) — the five invariants, the independent blanking oracle, the four bucket cases, the six bounds cases, the five truncation cases and the six WIP-refusal cases. 55 cases in total.
- `scripts/board-model.ts` / `.js` — `parseBoard` rewritten around an explicit precedence rule; `LARGE_BOARD_BYTES`, `LONG_LINE_CHARS`, `MAX_META_CHARS` and `MAX_UPDATE_TEXT_CHARS` exported; `truncateAt`, `boundRow`, `matchRow` and `measure` added; `BoardRow.truncated` and `UpdateEntry.truncated` added to `schemaVersion: 1`.
- `agent-factory/contracts/board.md` — five sections written (`Sections and the line partition`, `Conflicts`, `Staleness`, `Bounds`, `Reconciliation and non-goals`, `Provenance`), the old stub `Reconciliation` and the redundant `Relationship to the builder specification` folded into one, and the identifier shape restated in prose so the file carries no regex.
- `scripts/board-tracer.test.ts` — two cases amended (see deviations 2 and 3).
- `scripts/check-foundation-guards.test.ts` — `TRIPWIRE_MODULES` 61 → 62 (see deviation 1).

## Decisions Made

1. **`preamble` ends at the first level-two heading, not at the first column heading.** The plan's task-1 action text says "every line before the first column heading"; the same task's `<behavior>` block requires `## Notes (bootstrap, 2026-06-05)` followed by two prose lines to yield **one `nonColumnSections[]` entry with those two lines and zero columns**. Those two rules disagree on a document whose non-column heading precedes every column heading, and the behaviour bullet is the testable one. A non-column heading therefore always opens a section, and `preamble` carries only what precedes the first heading of any level-two kind. The consequence is recorded honestly: on a board like the measured chess board, the `## Columns (spec §6.1)` table lands in `nonColumnSections[]` rather than in `preamble`. The operative promise of the plan's truth — that neither inflates `unparsed[]` — holds exactly.

2. **A legal row outside every column is an unparsed line, never a section line.** This is what reconciles the other pair of behaviour bullets: `## Notes (…)` collects prose, while a bullet beneath `## Blocked (2)` is reported. The discriminator is the LINE, not the heading. A row shape that found no column is a refusal a human should see; ordinary prose under a named section is not.

3. **`MAX_META_CHARS` bounds the trailer, and `MAX_UPDATE_TEXT_CHARS` bounds the actor.** The plan names caps for `meta` and `updates[].text`, and its action text also asks for the trailer to be truncated. Each pair is one string and a substring of it: bounding an update's `text` while leaving its `actor` unbounded would leave the whole of the measured 34,494-character line reachable through the field beside the bounded one.

4. **A row's title is deliberately not capped.** It is the field that tells a human which ticket the row is about, and the long line in the measured corpus is a parenthetical. Capping the title would shorten the identifying field to defend against a shape nothing writes.

5. **`boardBytes` is measured on the input as given, before CRLF normalization.** A header claiming `380 KB` has to mean the number a human reads off the filesystem, and a CRLF checkout would otherwise report fewer bytes than the file holds.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `TRIPWIRE_MODULES` refused the new test module until the pin was moved**

- **Found during:** Task 1 (the full-suite run after the partition landed)
- **Issue:** `scripts/check-foundation-guards.test.ts` pins the test-module census two-sided, so a new `scripts/*.test.ts` file turns the suite red until the pin moves with its entrant named. `scripts/board-model.test.ts` entered that census.
- **Fix:** 61 → 62, with a paragraph naming the entrant, what it asserts and why it is a genuine test module rather than a corpus file — the discipline every existing entry in that file follows. **Re-derived rather than incremented:** `ls scripts/*.test.ts | wc -l` reports 62 on this tree, agreeing with the live census, and the bump lands in the same commit as the run that first observed the module.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` green
- **Committed in:** `f2e9411c`

**2. [Rule 1 - Stale expectation] The tracer's preamble case asserted a bucket this plan moved**

- **Found during:** Task 1 (the full-suite run)
- **Issue:** `scripts/board-tracer.test.ts` asserted that `_Updated: 2026-09-13 by Orchestrator_` lands in `preamble`. That was correct while `updates[]` was a declared field returned empty — the line fell through to the catch-all. This plan filled the class, so a canonical update line is now an `updates[]` entry wherever it appears, exactly as the task's behaviour block requires.
- **Fix:** The case now asserts both halves — `preamble` carries `# Board`, and `updates[]` carries the date and the actor — with a comment recording what changed and why, so a later reader meets an amendment rather than a contradiction.
- **Files modified:** `scripts/board-tracer.test.ts`
- **Verification:** `scripts/board-tracer.test.ts` green (74 cases)
- **Committed in:** `f2e9411c`

**3. [Rule 3 - Blocking] The tracer's exact-equality row case predated `BoardRow.truncated`**

- **Found during:** Task 2 (adding the truncation flag)
- **Issue:** One tracer case compares a parsed row against a whole object literal. Adding `truncated` to `BoardRow` — which task 2's behaviour block requires — made that comparison fail on the new field.
- **Fix:** `truncated: false` added to the expected object, with a comment naming the field's origin. `splitRow` was deliberately left returning an unflagged `RowParts`, so truncation is applied where the row is built rather than inside the splitter; that kept the other four `splitRow` equality cases untouched.
- **Files modified:** `scripts/board-tracer.test.ts`
- **Verification:** `scripts/board-tracer.test.ts` green
- **Committed in:** `e35246e3`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 stale expectation)
**Impact on plan:** All three were required for this plan's own artifacts to land on a green tree. None widened scope: one is the bookkeeping this repository's derived-set discipline demands of every entrant, and two are test expectations superseded by behaviour this plan's own tasks specified.

## Design notes recorded rather than deviated

- **The plan's `<files>` list for tasks 1 and 2 named only `scripts/board-model.{ts,js,test.ts}`.** Two files outside that list were touched, both test files, both for the reasons in deviations 1–3. No production module outside the plan's list was modified.
- **A nested sub-bullet beneath a row is an unparsed line this phase**, and the contract names it as not-yet-grammar rather than leaving it implied. That is the disposition 32-CONTEXT's deferred list already recorded; it is not a stub, because no field is empty and no boundary moves when a nesting grammar is written.
- **`epicRows[].column` is typed `string | null` and is now always a string.** Epic rows are only parsed inside a column, so the null arm is unreachable today. The field keeps its type because it is part of `schemaVersion: 1` and narrowing it is a shape change for no gain.
- **The perf case builds 7,000 rows.** The plan asks for at least 380,000 bytes with one line of at least 34,494 characters; a 400-row fixture reached only 54,500 bytes, so the row count was raised until the premise assertion passed on a measurement rather than on an intention.

## Known Stubs

None. Every field this plan was assigned is populated on every parse, and no code path returns a placeholder. The five stubs plan 32-01 recorded in `.planning/WINDOWS.md` (entries 169–173) are unchanged and belong to plans 32-03 and 32-07; the one this plan closed — `parseBoard` returning four buckets empty — is now filled, and its entry should be closed when 32-03 next touches the ledger.

## Threat Flags

None. Every file touched sits inside the plan's own `<threat_model>`: T-32-01 (the anchored single-pass patterns plus the two-second wall-clock assertion), T-32-07 (bounds measured and the opaque strings capped), T-32-11 (the comment blanker's fail-closed unterminated arm plus invariant I2) and T-32-09 (the anchored digits-only WIP shape, with six refusal cases). `git diff --exit-code -- package.json package-lock.json` is clean: no dependency was added. No network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced — `scripts/board-model.ts` still carries zero `node:fs` specifiers outside its comment lines.

## Issues Encountered

- **Vitest resolves the committed `.js`, not the `.ts`.** The first run after the task-1 implementation reported the same twelve failures as the RED run, because the import specifier `./board-model.js` resolves to the committed build output rather than to the source. `npm run build` must run before the suite on any change to a `scripts/*.ts` module, or the suite measures the previous commit. Recorded here because a green suite over stale output is exactly the false-premise class this repository has paid for six times.
- **HEAD is `main`, which the executor's own pre-commit assertion classifies as protected.** This project sets `git.branching_strategy: "none"` and `workflow.use_worktrees: false`, the orchestrator dispatched this plan explicitly as a sequential executor on the main working tree, and every prior phase committed the same way. Recorded so the choice stays visible rather than silent, exactly as plan 32-01 recorded it.
- **Requirement IDs are not yet marked complete in `REQUIREMENTS.md`, and that is correct.** `DASH-01`, `DASH-02` and `DASH-08` are declared by later plans in this phase as well, so the shared-ID gate holds them until the last declaring plan finishes.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Ready for **plan 32-03** (the four unread sources, read-verify-reread, and the watch loop) and for **plan 32-04** (the mutation corpus and the discrimination proof). The boundary both build on is fixed:

- `parseBoard(text) -> BoardModel` returns all seven fields populated. No field is empty on any input, and `schemaVersion` stayed at 1: two fields were ADDED (`BoardRow.truncated`, `UpdateEntry.truncated`), which is the additive direction D-19 permits.
- `agent-factory/contracts/board.md` is complete. Every axis plan 32-04's corpus needs — the three heading suffixes, the row shapes, the comment arms, the update class, the partition precedence, the bounds and the named refusals — has a source sentence in that file.
- The independent blanking oracle in `scripts/board-model.test.ts` is the subject plan 32-04's discrimination half mutates: replacing the module's stripper with a no-op must turn I2 red over the kit board.
- The five invariants are written to accept new corpus documents by adding a row to `CORPUS`, so the replay fixture plan 32-04 ships joins them without new assertions.

**One concern to carry forward, restated from plan 32-01 because it fired again.** One two-sided pin moved in this plan (`TRIPWIRE_MODULES`), and every later plan that adds a tracked `.ts` file will move `NON_TEST_MODULE_COUNT`, the two `scripts/`-scoped enumerations, or this one again. Run the full suite before the final commit, not only the plan's own test file.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- All 4 key files exist on disk (`[ -f ]`: 4 FOUND, 0 MISSING).
- All 5 commit hashes resolve in `git log --oneline --all` (5 FOUND, 0 MISSING).
- `commits: 5` is MEASURED: `git rev-list --count 5a8d6d9b..HEAD` = 5, against the ledger base recorded in `plan_head_before`.
- `actuals.tokens` is MEASURED as added-line characters over the five hand-authored files (55,072) plus the generated `.js` twin (9,176), divided by four — 16,062, reported as 16,000. Method stated because the plan's `estimate` of 58,000 is a large over-shoot and a calibrator needs to know which scale produced the miss.
- `git diff --diff-filter=D` over the plan's commits reports no deletions.
- Every task's `<acceptance_criteria>` was executed and passed, including the `node -e` kit-board probe (exit 0, "0 unparsed, 2 preamble"), the purity grep (0), the four contract greps (13 / 9 / 0 / 0) and the untouched board twins.
- Every plan-level `<verification>` command was executed and passed: `npx vitest run --exclude '**/scripts/e2e/**'` (68 files, 4478 passed, 2 skipped, 0 failed), `npm run typecheck && npm run build && npm run check:build-parity && npm run freshness` (64/64 outputs fresh), the four doc gates, and `node scripts/board-dashboard.js . --once --json` (exit 0, 13 columns).
