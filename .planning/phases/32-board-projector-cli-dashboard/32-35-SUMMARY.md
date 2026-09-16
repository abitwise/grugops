---
phase: 32-board-projector-cli-dashboard
plan: 35
subsystem: infra
tags: [board-projector, output-encoding, control-characters, json-lines, ast-census, timing, typescript, vitest]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-18's stdout write-site census (`STDOUT_WRITE_SITE_COUNT`, `channelWriteCensus`) — the derived-claim shape the header census copies, and the census that named the header as its one deliberate exemption"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-18's `writeDocument` chokepoint and its post-serialization `sanitizeCell` — the pass this plan keeps, reorders around and re-scopes rather than replaces"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-22's live wall-clock suite (`POLL_MS`, `DEBOUNCE_MS`, the no-skip decision, the two attribution assertions) — the file whose wait deadline this plan derives, with the attribution left untouched"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-33's `SCHEMA_VERSION` 2 and `TicketRecord.stem`, and 32-34's `LoopDeps.contained` — neither moved here; the published field set and the schema version are unchanged"
provides:
  - "`scrub` — `sanitizeCell` applied to every string VALUE and every object KEY at every depth, BEFORE serialization, so the `--json` guarantee is about what one parse yields rather than about the bytes on the wire"
  - "A `writeDocument` with two passes and two stated reasons: the scrub for what a consumer recovers, the retained post-serialization pass as the backstop on the line boundary, with its present redundancy stated rather than hidden"
  - "`part` — the one function that produces a header part, with the terminal style codes as the single exemption named at the site"
  - "`HEADER_PART_SITE_COUNT`, a syntax-derived two-sided pin over `renderHeader`'s parts array and every push argument, with four routes onto the array refused rather than silently dropped"
  - "A spawned-process parse-then-inspect case over four planted content-derived sites, plus the converse: an escaped sequence that was TEXT comes back byte-identical"
  - "`EVENT_DEADLINE_MS` derived from `POLL_MS` minus `EVENT_DEADLINE_MARGIN_MS`, with a case asserting the two inequalities the derivation exists to preserve"
  - "An explicit, owner-named disposition of WR-07's CI-topology half, with its residual stated"
affects: [32-36, 32-37, 33-windows-portability, board-projector-consumers, future-web-renderer]

actuals:
  tokens: 27780
  tasks: 3
  commits: 3
plan_head_before: 021167ccf617e34b2a425f49def738fb0424178f

tech-stack:
  added: []
  patterns:
    - "Measure what the CHANNEL'S READER gets, not what the channel carries: two mechanisms that are exactly complementary can each hide the other's gap, and the raw bytes will report clean"
    - "Fix by ORDERING rather than by a second removal pass: scrubbing before serialization never meets an escaped form, so it cannot alter one — the property the rejected after-the-fact rewrite cannot have"
    - "A retained backstop states its own redundancy, and earns its place by a MEASURED pair rather than by an argument: narrow the thing in front of it and the backstop is what stays green; remove both and the same cases red"
    - "Derive the exemption's own NAME too: the header census takes the style parameter as a parameter and reads it out of the signature, so a rename cannot silently widen the one carve-out"
    - "Express the property, do not assert it: a deadline written as `POLL_MS - margin` cannot drift from the period; written as a literal it could, and it had"
    - "Assert the INEQUALITIES a derived constant exists to preserve, never the number it currently equals — pinning the number restates the arithmetic one line above it"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-35-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt
  modified:
    - scripts/board-dashboard.ts
    - scripts/board-dashboard.js
    - scripts/board-dashboard.test.ts
    - scripts/board-watch-live.test.ts
    - agent-factory/contracts/board.md
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "THE PLANT DEPARTED FROM THE PLAN AT TWO SITES, MEASURED RATHER THAN PREFERRED. The plan puts a bell byte in a ticket title; the ticket grammar REFUSES every C0 outright (`control-character`, the whole source degraded), so the code point that reaches the document through a ticket is one from the upper control range and the bell moved to a column heading. And a RAW control byte in a JSON dial key is refused by `JSON.parse` itself, so the key is planted as the legal six-character escape, which the parser decodes into a real code point in the key."
  - "FOUR PLANTED SITES, NOT THE PLAN'S THREE. Without a content-derived KEY the 'every object key at every depth' half of the walk is vacuously green — a walk that visits keys and finds none to fail on proves nothing about keys. `config.wipLimits` is keyed by column name and is the one content-derived key the document has."
  - "THE POST-SERIALIZATION PASS IS RETAINED AND ITS REDUNDANCY IS STATED. The plan expected removing it to red the line-boundary case. Measured, it reds nothing (M2a): with `scrub` correct nothing is left raw for it to remove, and the newline has a second independent guarantor that is not this module's — `JSON.stringify` escapes U+000A inside every string. The docblock says so instead of repeating the stronger claim, and M2b/M2c are what justify keeping it."
  - "THE MARGIN IS A DEBOUNCE QUANTUM (250 ms), giving a 750 ms deadline and a 500 ms band. It is argued from the three recorded latencies (272/279/276 ms, worst 279) and from what the margin has to absorb — synchronisation jitter below one tick — rather than chosen to look generous."
  - "THE LINE-BOUNDARY CASE ASSERTS THE PROPERTY ANYWAY, even though no mutation available to content can red it, because the property is what makes the document boundary this module's structure rather than content's (D-18) and a case nobody wrote is a property nobody notices losing."

patterns-established:
  - "Read the EMITTED .js back after every mutation before believing the suite: `noEmitOnError` makes a non-compiling mutation indistinguishable from an ineffective one. Third consecutive plan in this phase to catch one — M1's first spelling left `scrub` unreferenced, tsc refused with TS6133, and the suite reported 67 passed over the UNMUTATED artifact."
  - "Prove 'unchanged' by DIFF, not by intent: the whole event-path case was extracted from HEAD and from the working tree and compared — 39 lines each, byte-identical — rather than asserted in prose."
  - "Record the measurement that contradicts the plan, at the site: M2a's green is written into the proof and into the docblock, because an expected-but-false result quietly dropped is the failure mode this round's whole register is about."

requirements-completed: [DASH-07, DASH-08, DASH-04]

coverage:
  - id: D1
    description: "A raw control character planted in board content is absent from what a `--json` consumer recovers: one parse of the captured document yields zero code points in the C0 range, the C1 range or the delete position, in every string VALUE and every string KEY, at every depth"
    requirement: DASH-07
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#yields ZERO control code points from ONE parse — every string VALUE and every KEY, at every depth"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#PREMISE: the artifact under test carries the scrub, and the four plants reach the reader"
        status: pass
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#removes the code points and NOT the content — over-removal would satisfy every zero above"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt § 1 — 14 recovered before, 0 after, over the same four plants and the same walk"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt § 3 M1 — removing the scrub reds exactly the parse-then-inspect pair"
        status: pass
    human_judgment: false
  - id: D2
    description: "The document is still exactly one line and still exactly one parseable document: the line boundary remains this module's structure and never content's"
    requirement: DASH-08
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#is still ONE line and still exactly ONE document, so content cannot forge a second record"
        status: pass
      - kind: other
        ref: "node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json | wc -l → 1"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt § 3 M2a/M2b/M2c — the retained pass is what keeps three raw-byte cases green under a scrub with one branch missing, and removing both reds those exact three"
        status: pass
    human_judgment: false
  - id: D3
    description: "A value that was ALREADY the six-character escaped sequence as text comes back unchanged — the fix is an ordering, not a second removal pass over the serialized form"
    requirement: DASH-07
    verification:
      - kind: integration
        ref: "scripts/board-dashboard.test.ts#leaves an escaped sequence that was TEXT in the input unchanged — the scrub decodes nothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every part of the plain-frame header passes through one sanitizing function, and that claim is derived from the module's own syntax tree rather than maintained by convention; the terminal style codes are the one deliberate exemption and they are named at the site"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#pins the header part count two-sided at nine, every one through the chokepoint"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#TOTALITY: every parts site is either sanitized or listed, and the array is reached by no other route"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#PREMISE: a new unsanitized part is FOUND — the census discriminates"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#PREMISE: a route onto the array the pass cannot follow is REFUSED, never silently dropped"
        status: pass
      - kind: unit
        ref: "scripts/board-dashboard.test.ts#PREMISE: a module with no parts array at all yields no sites and says so"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt § 2 and § 3 M3 — 3 of 9 before, 9 of 9 after; dropping one part out of the chokepoint reds exactly one case"
        status: pass
    human_judgment: false
  - id: D5
    description: "The live event-path case fails with a measured latency rather than with a timeout: its wait deadline is derived from the poll period, is strictly below that period and strictly above the debounce, and the two comparisons that decide attribution are unchanged"
    requirement: DASH-04
    verification:
      - kind: e2e
        ref: "scripts/board-watch-live.test.ts#keeps the event-path deadline strictly below the poll period and strictly above the debounce"
        status: pass
      - kind: e2e
        ref: "scripts/board-watch-live.test.ts#delivers an atomic-rename edit in less than one poll period, and no faster than the debounce — 6 passed, MEASURED event path 276/268/274 ms against a 750 ms deadline on darwin/arm64 node v24.12.0"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt § 4 — the event-path case extracted from HEAD and from the working tree is 39 lines on both sides and byte-identical"
        status: pass
    human_judgment: false
  - id: D6
    description: "WR-07's CI-topology half — moving the platform-dependent live cases into their own script invoked from a named, non-blocking Windows CI step — is explicitly dispositioned with its owner and its residual, rather than silently dropped"
    verification:
      - kind: other
        ref: "grep -c 'status: open' .planning/phases/32-board-projector-cli-dashboard/deferred-items.md → 3 (the carried pre-existing item, the re-measured gate, and the new disposition)"
        status: pass
      - kind: other
        ref: "gsd-tools windows append — broken-windows ledger row recorded against phase 32 naming Phase 33 / CAP-02 as the owner"
        status: pass
    human_judgment: true
    rationale: "Whether Phase 33 is the right owner and whether the residual — a Windows red still taking the shared suite step with it — is an acceptable cost to carry are scope judgments, not facts a test can assert. The disposition is on disk with its reasoning; a human decides whether to accept it or to pull the work forward."
  - id: D7
    description: "A consumer that re-encodes a recovered value with its own serializer and decodes the result again can still manufacture a control character"
    verification: []
    human_judgment: true
    rationale: "`UNKNOWN - verify` by construction, and deliberately not closed. It is a property of the CONSUMER'S pipeline and outside anything this module can decide; carried as the plan's declared backstop truth and stated at `writeDocument`, in the module header and in `agent-factory/contracts/board.md` rather than promised away."

duration: 105 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 35: What a Consumer Recovers, a Derived Header, and a Deadline That Prints a Number Summary

**A `--json` document whose raw bytes were clean while one parse of it recovered fourteen control code points from an ordinary ticket title, a column heading and a dial key now recovers zero — the values and keys are scrubbed before the serializer sees them, so the escaping and the removal can no longer hide each other's gap; every one of `renderHeader`'s nine parts goes through one function and the syntax tree says so; and the live event path's wait deadline is derived from the poll period instead of typed, so a red prints the latency that failed instead of a timeout.**

## Performance

- **Duration:** 105 min
- **Started:** 2026-09-16T11:00Z
- **Completed:** 2026-09-16T11:48Z (the wall time above includes six full live-suite runs and two full regression suites at ~7.4 min each)
- **Tasks:** 3
- **Files modified:** 9 (7 tracked source/test/contract/ledger files, 2 planning artifacts created)

## Accomplishments

- **The `--json` guarantee is now about what a consumer RECOVERS.** `scrub` applies `sanitizeCell` to every string value and every object key at every depth before serialization. Fourteen recovered code points from four planted sites became zero, with the raw-byte count unchanged at zero the whole time — the finding was never visible where the old instrument was looking.
- **The ordering IS the fix, and the converse proves it.** The rejected alternative — rewriting the six-character escaped sequences out of the serialized text — cannot tell one the serializer manufactured from one somebody typed. Scrubbing before serialization never meets an escaped form, and a title carrying one as text comes back byte-identical.
- **The post-serialization pass is retained with its scope stated honestly.** The plan expected removing it to red a case; measured, it reds nothing today. It is kept as the backstop on the line boundary, and M2b/M2c measure exactly what it is worth: under a `scrub` with one branch missing, three raw-byte cases stay green and this pass is the only thing that could have kept them green.
- **The header's sanitization stopped being a convention.** The RED baseline counted six of nine parts sites bypassing the hand-applied sanitizer. Every part now goes through `part`; a census derived from `renderHeader`'s own syntax tree pins the site count two-sided at nine, refuses four routes onto the array it cannot follow, and derives the style-parameter name from the signature so the one exemption cannot widen by a rename.
- **The live event-path deadline is derived and the attribution is untouched.** `EVENT_DEADLINE_MS = POLL_MS - EVENT_DEADLINE_MARGIN_MS` (750 ms, band widened from 350 ms to 500 ms). The whole event-path case is byte-identical to HEAD — 39 lines, diff empty — so only the give-up point moved. A new case asserts the two inequalities the derivation exists to preserve.
- **WR-07's CI-topology half is carried in writing with its owner and its residual named**, not silently dropped, and the pre-existing `check:diff-disposition` red is re-measured rather than absorbed.

## Task Commits

1. **Task 1: RED baseline — what a consumer recovers, and what the header derives** — `826b77bb` (test)
2. **Task 2: Scrub before serializing, and give the header a derived chokepoint** — `afc48514` (feat)
3. **Task 3: Let the attribution assertions decide, and disposition the CI half in writing** — `1004f537` (test)

**Plan metadata:** see the final `docs(32-35)` commit.

## Files Created/Modified

- `scripts/board-dashboard.ts` — `scrub`; `writeDocument` restated as scrub → serialize → the retained pass, with both reasons and the retained pass's present redundancy written at the function; `part` inside `renderHeader` with the style-code exemption named at the site; the module header's control-character claim rewritten to describe what a parse yields
- `scripts/board-dashboard.js` — the committed twin, rebuilt in the same commit
- `scripts/board-dashboard.test.ts` — 56 → 67 cases: the spawned-process parse-then-inspect case over four plants, the one-line/one-document case, the over-removal control, the escaped-as-text converse, and the header census with four premise/discrimination cases plus a totality check
- `scripts/board-watch-live.test.ts` — `EVENT_DEADLINE_MARGIN_MS` and a derived `EVENT_DEADLINE_MS`, the budget arithmetic restated, and a case asserting `DEBOUNCE_MS < EVENT_DEADLINE_MS < POLL_MS`
- `agent-factory/contracts/board.md` — the control-characters section now states what a consumer recovers, why the ordering is the guarantee, and what stays outside it
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — the WR-07 CI-topology disposition and the re-measured carried gate
- `.planning/WINDOWS.md` — one ledger row for the WR-07 deferral, naming Phase 33 / CAP-02
- `.planning/phases/32-board-projector-cli-dashboard/32-35-RED-baseline.txt` — the fourteen recovered code points with their paths, the 3-of-9 header count, three event-path latencies, and the case counts this round must not fall below
- `.planning/phases/32-board-projector-cli-dashboard/32-35-GREEN-proof.txt` — the same measurements after the change, five mutation runs with their emitted-artifact read-backs, the byte-identical attribution diff, and the full-suite result

## Decisions Made

See `key-decisions` in the frontmatter. In short: the plant departed from the plan at two sites because both routes it assumed are closed upstream (the ticket grammar refuses every C0; `JSON.parse` refuses a raw control byte in a key), a fourth planted site was added so the key half of the walk is not vacuous, the post-serialization pass is retained with its redundancy stated rather than with a claim it no longer earns, and the deadline margin is one debounce quantum argued from three recorded latencies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Named the antecedent in the contract sentence Task 2 added**

- **Found during:** Task 3 (the plan's own full-suite verification step)
- **Issue:** Task 2's rewrite of `agent-factory/contracts/board.md` opened a sentence with a bare demonstrative. `guard_sentence_form` (WP-06) refuses that over the governed corpus, so `scripts/check-imperative-lexicon.test.ts`'s live-tree pin red and the full suite came back `1 failed | 5108 passed`. The gate's own remedy forbids the shortcut: do not narrow the scan set, because `GOVERNED_CORPUS_COUNT` is pinned two-sided precisely so removing a member to reach green is not available.
- **Fix:** `That was true of the bytes` → `That description was true of the bytes`.
- **Files modified:** `agent-factory/contracts/board.md`
- **Verification:** `npm run check:imperative-lexicon` → `ALL CHECKS PASSED`, 0 findings over 49/49 elements, 3781 sentences with no finding of any kind. Full suite re-run → 5109 passed | 2 skipped.
- **Committed in:** `1004f537` (Task 3 commit), and recorded in the GREEN proof § 5 rather than folded silently into the file it belongs to.

### Departures from the plan's prescribed method, proved necessary rather than preferred

**2. The plant's code points and site count** — described in `key-decisions` and at the site in both artifacts. The plan's bell-in-a-ticket-title route is closed by the ticket grammar and its raw-byte-in-a-dial-key route is closed by `JSON.parse`; both refusals are recorded as measurements in the RED baseline § 1, with the code points redistributed so all three named by the plan are still in play, and a fourth site added so the KEY arm is not vacuous.

**3. The post-serialization pass's mutation** — the plan asserts that removing it reds the line-boundary case. M2a measures that it does not, and the proof and the docblock both say so. The pass is retained per the plan's prohibition, and M2b/M2c were added to establish by measurement what the plan expected M2a to establish by assertion. Five mutations were run rather than the plan's three.

---

**Total deviations:** 1 auto-fixed (1 bug), 2 method departures recorded with their measurements.
**Impact on plan:** No scope creep. Every truth in the plan's `must_haves` is met; the two departures make the measurements honest rather than convenient, and the extra mutations strengthen the claim the plan wanted.

## Issues Encountered

- **The first spelling of mutation M1 did not compile, and the suite reported green over the unmutated artifact.** Removing the `scrub` call left the function unreferenced, `tsc` refused with TS6133 under `noEmitOnError`, nothing was emitted, and `scripts/board-dashboard.js` stayed at its pre-mutation content — so the run measured the fixed program and came back 67 passed. Caught by the emitted-artifact read-back this phase adopted in plan 32-33 and used again in 32-34; the mutation was re-spelled to keep the reference and re-run. Third consecutive plan to catch one this way.
- **`npm run check:build-parity` reds on an uncommitted rebuild by design.** It compares the working tree against the index, so the rebuilt `.js` has to be staged before the gate can pass. Staged, then run; not a defect.

## Known Stubs

None. No placeholder, no hardcoded empty value and no unwired component was introduced.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary. The published field set and `SCHEMA_VERSION` are unchanged; the two `node:fs` symbols the module holds are the same read-only pair, re-proved by `npm run check:dashboard-readonly` (171 passed).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Truth 5's two output-channel honesty findings (`reason_advisory` / WR-04 / F-05, and WR-06) and the WR-07 timing half are closed with measurements on disk either side of each change.
- **Still open and deliberately so:** WR-07's CI-topology half, carried in `deferred-items.md` and in the broken-windows ledger with Phase 33 / CAP-02 named as its owner; the pre-existing `check:diff-disposition` red (77 findings over five Phase-31 workflow documents, none of them a file this plan touched); and the consumer-re-encode backstop, which is a property of a consumer's pipeline rather than of this document.
- Full suite green at 5109 passed | 2 skipped, above the 4974 floor `32-VERIFICATION.md` records and above the 5097 this round started from.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*

## Self-Check: PASSED

Every file named in `key-files` exists on disk (`[ -f ]`, 8/8) and every task commit hash resolves
in `git log --oneline --all` (3/3: `826b77bb`, `afc48514`, `1004f537`). The `commits: 3` in the
frontmatter is MEASURED — `git rev-list --count 021167cc..HEAD` — not narrated.
