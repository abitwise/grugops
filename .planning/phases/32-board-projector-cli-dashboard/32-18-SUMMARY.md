---
phase: 32-board-projector-cli-dashboard
plan: 18
subsystem: infra
tags: [typescript, board-projector, dashboard, terminal-escapes, ast-census, no-fabrication]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-13's stderr chokepoint `warn` and the derived stderr write-site census this plan generalizes"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-07's spawned-process harness (`spawnDashboard`, `withFixtureCopy`) and the independent `controlCodePoints` instrument"
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-15, 32-16 and 32-17's reader closure, which the end-to-end captures run against"
provides:
  - "`writeDocument(io, value)` — the one place a serialized document reaches stdout, and the one place it is sanitized"
  - "`channelWriteCensus(source, channel)` — one derivation answering for both channels; `stderrWriteCensus` deleted"
  - "A four-bucket TOTALITY over every syntactic channel reference, with the denominator counted independently of the buckets"
  - "`STDOUT_WRITE_SITE_COUNT` and the three pinned enclosing function names, pinned two-sided the way stderr already was"
  - "A module header that names its own checker instead of asserting a property of both channels"
  - "`humanChars` — `bounds.longestLine` rendered as a grouped character count, so the two bounds numbers state their own units"
  - "A contract section stating the both-channels removal rule and the escaped-code-point boundary it does NOT close"
affects: [board projector, dashboard renderer, any --json consumer, any terminal an operator runs the dashboard in]

actuals:
  tokens: 55370
  tasks: 3
  commits: 5
plan_head_before: 9a09506c282d4f27e86493607f741243fda8cc5c

tech-stack:
  added: []
  patterns:
    - "One chokepoint per channel: serialization and the write live in one function, so a document that skipped the sanitizer is a thing that cannot be written rather than a thing somebody must remember"
    - "Sanitize the SERIALIZED TEXT, not the value tree: a document whose keys are content-derived is only half-covered by a value walk"
    - "A claim that names its own checker: a header sentence stating a count and the census that derives it is falsifiable in one command"
    - "Totality as a denominator, not another arm: every reference to the subject lands in exactly one named bucket, and the buckets are summed against a count taken independently"
    - "Generalize by parameter and DELETE the specialization: a second census over one property is a second authority free to drift"
    - "Sibling-arm mutation: each sanitizer is disabled in ONE arm and the suite is shown to go red with the measured count"

key-files:
  created: []
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-dashboard.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "The `--json` document is sanitized as serialized text rather than field by field, because the document's KEYS are content-derived — the dial's per-column limits are keyed by column name — and no JSON structural character is in the removal set"
  - "`stderrWriteCensus` is DELETED rather than kept beside `channelWriteCensus`; one implementation serves both channels so the two arms cannot drift apart, which is what CR-02 cost"
  - "The census classifies every channel reference into four named buckets and counts references independently, so an unanticipated shape is VISIBLE in `carried` rather than absent from a short site list"
  - "The escaped six-character form of a control code point inside a JSON string is left as text: removing it would rewrite a value the consumer asked for. The boundary is stated in `writeDocument`'s docblock and in the contract rather than closed"
  - "`humanChars` groups digits with a left-to-right loop rather than a lookahead regex, because `scripts/check-uat-oracles.test.ts` holds a closed class refusing pure zero-width lookaheads under `scripts/`"

patterns-established:
  - "Chokepoint pair: `warn` owns stderr, `writeDocument` owns the stdout document, `sanitizeCell` decides what is removed for both"
  - "Two-sided channel pin: a count AND a set of enclosing function names, with a failure message shaped as a decision somebody records"

requirements-completed: [DASH-07, DASH-08]

coverage:
  - id: D1
    description: "A C1 code point planted in board content reaches neither channel, in both --json and plain modes, measured from a spawned process against the committed .js"
    requirement: "DASH-07"
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#removes them from the --json document, keeping the title's remaining text"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#removes them from the PLAIN FRAME too, on both channels"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#removes the 8-bit introducers planted in a ROW TITLE, keeping the rest of the title"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#removes an introducer planted in a content-derived JSON KEY, not only in a value"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stdout's write sites are derived from the module's own syntax tree, counted and named, pinned two-sided; stderr's pin is unchanged"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#pins the stdout write-site count two-sided at three, in the three functions that own them"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#pins the stderr write-site count two-sided at one, inside `warn`"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#TOTALITY: every syntactic reference to the channel lands in exactly one named bucket"
        status: pass
      - kind: other
        ref: "mutation: a fourth stdout write planted in `mutantFourthSite` — census reported 4 sites, pin red, 1 failed | 51 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "The module header's claim about the two channels names the census that checks it, rather than asserting a property a reader must trust"
    requirement: "DASH-08"
    verification:
      - kind: other
        ref: "scripts/board-dashboard.ts lines 23-35 — the header names three stdout sites by function, one stderr site, and scripts/board-dashboard.test.ts as the file that derives and pins both"
        status: pass
    human_judgment: true
    rationale: "Whether a prose claim is now falsifiable rather than merely true is a reading judgment. The COUNTS it states are mechanically pinned by D2; that a human reading the header can find and run the checker is not."
  - id: D4
    description: "The header states a code-unit count in code units, so the two bounds numbers name their own units"
    requirement: "DASH-07"
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#renders the board size in bytes and the longest line in characters, distinguishably"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#adds a LARGE BOARD marker carrying the byte size and the longest line, each in its own unit (D-20, WR-05)"
        status: pass
    human_judgment: false

duration: 37 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 18: One Sanitizing Stdout Chokepoint, and a Census That Answers for Both Channels Summary

**`writeDocument` sanitizes the serialized `--json` document at the single point it reaches stdout, `channelWriteCensus` replaces the stderr-only census and pins both channels two-sided over a four-bucket totality, and the header's code-unit count stops being rendered through the byte formatter.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-09-15T09:46:05Z
- **Completed:** 2026-09-15T10:23:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 source/test + 1 contract; `scripts/board-dashboard.js` is the committed build of its `.ts`)

## Accomplishments

- **CR-02 closed at the chokepoint.** `writeDocument(io, value)` is the one place a serialized document reaches stdout. It serializes, passes the **serialized text** through `sanitizeCell`, appends the line boundary and writes once. Sanitizing the text rather than the value tree is what covers the document's **keys** — the dial's per-column limits are keyed by column name, which is a line an agent wrote into `plans/board.md`.
- **The census now answers for both channels from one implementation.** `stderrWriteCensus` is deleted; `channelWriteCensus(source, channel)` takes the channel as a parameter. Stdout is pinned two-sided at three sites (`writeDocument`, `emit`, `run`) by count **and** by enclosing function name. The stderr pin and `STDERR_WRITE_SITE_COUNT` are byte-identical to their committed values.
- **The generalization is a denominator, not another arm.** Every syntactic reference to the channel lands in exactly one of four named buckets — `sites`, `opaque`, `reads`, `carried` — and `references` is counted independently of the buckets, so a totality case asserts they sum. A shape nobody anticipated lands in `carried` and is visible, rather than being silently absent from a short list. This closed three routes the prior census never asked about: a parenthesized/`as`-cast/non-null-asserted receiver, another method **called** on the channel (`.end(...)`), and a reflective `write.call(...)`.
- **The header states what the census checks.** The former "every string that reaches EITHER CHANNEL goes through `sanitizeCell` first" is replaced by a sentence naming the four write sites by function and naming `scripts/board-dashboard.test.ts` as the file that derives and pins both numbers.
- **WR-05 closed.** `humanChars` renders `bounds.longestLine` as a grouped character count; `bounds.boardBytes` keeps `humanBytes`. The contract states both renderings.
- **Both arms measured from a spawned process against the shipped artifact,** and both sanitizers shown to fail when disabled.

## Task Commits

1. **Task 1 RED: measure the C1 introducers the `--json` document carries** — `dcf1dfac` (test)
2. **Task 1 GREEN: one sanitizing stdout document write, and a header number that names its unit** — `4c9a8cf7` (fix)
3. **Task 2 RED: ask the census about stdout, which it has never been asked** — `789e02c0` (test)
4. **Task 2 GREEN: one channel census, both arms, every reference classified** — `28f34ace` (refactor)
5. **Task 3: measure both stdout arms from a spawned process against the shipped `.js`** — `4bd64ca3` (test)

`actuals.commits: 5` counts the five TASK commits above, measured with `git rev-list --count 9a09506c..HEAD` at the instant the SUMMARY was written. The SUMMARY commit and the metadata commit follow it and are not in that span — a SUMMARY cannot count its own commit. The same convention was used by plans 32-15 through 32-17.

## Files Created/Modified

- `scripts/board-dashboard.ts` — `writeDocument` (the stdout document chokepoint), `humanChars`, the rewritten header claim, `emit`'s JSON arm routed through the chokepoint
- `scripts/board-dashboard.js` — the committed build, rebuilt and committed with its source
- `scripts/board-dashboard.test.ts` — `channelWriteCensus` (replacing `stderrWriteCensus`), the stdout pin, the totality case, the planted-C1 in-process cases, the two spawned-process captures
- `agent-factory/contracts/board.md` — a new `## Control characters on the way out` section, and the Bounds paragraph stating each number's rendering

## The Measured Numbers

**The reproduction, before and after, against `scripts/board-dashboard.js`** (the artifact `node` runs; the same file the verification round measured):

| Invocation | stdout C0/C1/DEL before | stdout after | stderr after | exit |
|---|---|---|---|---|
| `--once --json`, C1 in a ticket title | 2 | **0** | 0 | 0 |
| `--once --json`, C1 in a content-derived key | 4 | **0** | 0 | 0 |
| `--once` (plain frame), C1 in a ticket title | 0 | **0** | 0 | 0 |

The title survives the removal: `Something<U+009B>in the<U+009D>backlog` reaches the document as `Somethingin thebacklog`.

**Mutation 1 — `sanitizeCell` removed from `writeDocument`, rebuilt:**

```
x removes them from the --json document, keeping the title's remaining text
    measured 6 code points  (U+009B, U+009D three times over: the board row,
    its sources.board.value twin, and the ticket record)
x removes the 8-bit introducers planted in a ROW TITLE          measured 4
x removes an introducer planted in a content-derived JSON KEY   measured 2
Tests  3 failed | 53 passed (56)
```

**Mutation 2 — `sanitizeCell` removed from the frame `cell`, the sibling arm:**

```
x removes them from the PLAIN FRAME too, on both channels       measured 2
x keeps the plain frame free of every control code point        measured 2
x sanitizes a title carrying a CSI and an OSC sequence
Tests  3 failed | 53 passed (56)
```

**Mutation 3 — a fourth stdout write planted in a new function:**

```
[32-18] stdout write sites in scripts/board-dashboard.ts: 4 —
        writeDocument:299, emit:871, mutantFourthSite:942, run:980
x pins the stdout write-site count two-sided at three
Tests  1 failed | 51 passed (52)
```

Each mutation was reverted and rebuilt; the suite returned to green after all three.

## Decisions Made

- **Sanitize the serialized text, not the value tree.** A rule that only visits values answers for half a document whose keys are content-derived. No JSON structural character is in the C0/C1/DEL removal set, and `JSON.stringify` has already escaped every C0 that belongs inside a string, so the document still parses.
- **Delete `stderrWriteCensus` rather than keep it beside the generalization.** A second census over one property is the second-authority shape this phase has already paid for twice; CR-02 is precisely what the two arms drifting apart cost.
- **Classify every reference rather than add arms.** The recurring finding across this phase is a derived predicate whose input was left in a narrow syntactic form. The defence chosen here is a denominator — four named buckets summed against an independently counted reference total — so an unanticipated shape is loud rather than silent.
- **Leave the escaped-code-point boundary open and say so.** See Known Limits.
- **Group digits with a loop, not a lookahead.** See the deviation below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `humanChars` used a pure zero-width lookahead, which a standing gate refuses**

- **Found during:** Task 3 (the full-suite verification)
- **Issue:** The first spelling of the digit grouping was `digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")`. `scripts/check-uat-oracles.test.ts` holds a closed class asserting that the one sanctioned pure zero-width lookahead under `scripts/` is the compactor's split separator — the cost of such a pattern is quadratic in subject length, and this repository has already shipped one non-terminating CI gate that way. The suite went red naming `scripts/board-dashboard.ts:395`.
- **Fix:** Replaced the regex with a left-to-right loop that inserts a separator every three digits counted from the right. Linear, no regex, no exemption needed. The reason is recorded in the function's docblock so the next edit does not reintroduce the regex.
- **Files modified:** `scripts/board-dashboard.ts`, `scripts/board-dashboard.js`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts scripts/check-uat-oracles.test.ts` → 77 passed; full suite 4901 passed | 2 skipped across 74 files
- **Committed in:** `4bd64ca3`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The gate was correct and the loop is strictly better than the regex it replaced. No scope change.

## Known Limits

**An escaped control code point inside a JSON string literal is NOT removed.** The six-character backslash-u form a JSON serializer writes is text in the document and stays text. It becomes a control character only if a consumer decodes the document and prints the value without sanitizing it. Removing it would mean rewriting a value the consumer asked for, so the boundary is **stated** — in `writeDocument`'s docblock and in `agent-factory/contracts/board.md` § Control characters on the way out — rather than closed. This is the `deferred` item the plan declared, carried forward unchanged.

## Issues Encountered

- **The test suite imports the compiled `./board-dashboard.js`, not the `.ts`.** A source edit is invisible to the suite until `npm run build` runs. Caught immediately (the GREEN run reproduced the RED output verbatim) rather than mistaken for a failed fix.
- **An Edit call wrote a literal BEL byte into `scripts/board-dashboard.ts`** while rendering an inline code span in a docblock. Detected by a byte scan of the file before any commit, removed, and confirmed by `npm run check:nul-bytes` (2230 tracked files, zero carrying a forbidden control byte). No commit ever carried it.

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-dashboard.test.ts` | 56 passed (56) — up from 43 committed |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts scripts/board-tracer.test.ts` | 104 passed (104) |
| `npx vitest run --exclude '**/scripts/e2e/**'` (whole suite) | **74 files, 4901 passed, 2 skipped** — above the plan's floors of 74 files and 4811 passed |
| `npm run build && npm run typecheck && npm run check:build-parity` | clean; no tracked build output moved |
| `npm run freshness` | all 65 committed `.js` match a rebuild of their sources |
| `check:nul-bytes`, `check:public-docs`, `check:imperative-lexicon`, `check:banned-claims`, `check:claim-anchors` | each `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` |
| `git status --porcelain scripts/fixtures/` | empty — no committed fixture was modified |
| Verifier's own C1 reproduction, re-run against the rebuilt `.js` | 0 on both channels in both modes, exit 0, title text intact |

**`UNKNOWN - verify`:** the live claude-CLI e2e lane (`scripts/e2e/**`) was not run — it is excluded by the project's own test command and is already recorded in the defect ledger for this phase by plan 32-17. Nothing in this plan touches that lane.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Verification gap 3 / `32-REVIEW.md` CR-02 is closed at the chokepoint, and WR-05 is closed.
- REQUIREMENTS.md and the ROADMAP phase status are deliberately **not** flipped to Complete by this plan, per its own success criteria. The remaining gap-closure plans in this wave (32-19 .. 32-23) are unblocked; nothing here changes their inputs.
- The stdout pin is now the same instrument as the stderr pin, so a later plan adding a stdout write site gets a red naming the function rather than a review comment.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

## Self-Check: PASSED

Every file named in `key-files` exists on disk; all five task commits and the metadata commit resolve in `git log`; `writeDocument` and `channelWriteCensus` are present and `stderrWriteCensus` occurs zero times; the contract section exists. No stubs, no skipped tests introduced.
