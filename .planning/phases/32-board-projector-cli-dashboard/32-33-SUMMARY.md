---
phase: 32-board-projector-cli-dashboard
plan: 33
subsystem: api
tags: [board-projector, presence-partition, no-fabrication, schema-version, typescript, vitest]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-09's presence gate (`PRESENCE_DEPENDENT_CONFLICT_KINDS`) and 32-15's reader partition (`UnadmittedTicket`, the derived-denominator instrument) — the two rounds whose fixes this plan's third population fell between"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-17's `boundNames` sort-before-bound, which is what makes the new maps' first-by-name rule a stated rule rather than a filesystem accident"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-31 and 32-32's read-only guard, re-proved green against the changed dashboard closure on this commit"
provides:
  - "presenceOf — ONE discriminated presence answer over three measured sets, with `absent` reachable only as their arithmetic complement"
  - "TICKET_PRESENCE_KINDS / TICKET_PRESENCE_KIND_COUNT — the four arms as a closed set with a two-sided count"
  - "presenceActual — one honest sentence per arm, and `null` for the arm that is not a conflict at all, so one function decides both whether to raise and what to say"
  - "ticketPopulations — the reader's whole listing indexed three ways in one place, replacing two maps built inline from two different notions of identity"
  - "TicketRecord.stem — the file's name published beside the identifier the document declares; SCHEMA_VERSION 2"
  - "The `empty-stem` refusal — an entry named exactly `.md` is refused by name and counted, instead of admitted under an identifier no row can name"
  - "seenById — the duplicate check as a map lookup: readSnapshot at 10,000 entries falls from 510.5 ms to 340.5 ms and the growth shape falls from 2.3-2.4x per doubling to ~2.0x"
affects: [32-34, 32-35, 32-36, 32-37, board-projector-consumers, future-web-renderer]

actuals:
  tokens: 37841
  tasks: 4
  commits: 4
plan_head_before: c677eb7af10ba05de36efe69f20f49e60ed0bdad

tech-stack:
  added: []
  patterns:
    - "Derive the THIRD population as arithmetic, not as an arm: 32-15's derived-denominator instrument asked of the partition's KEYS rather than its SIZE"
    - "One discriminated answer decides both WHETHER to raise a conflict and WHAT it says, so an arm cannot be right about the sentence and wrong about the silence"
    - "The negative sentence is reachable only by falling off the end of every measurement — never as the value a missing lookup happens to produce"
    - "Structural cases read the AST, not the bytes, when the code's own docblock names the construct the case forbids"
    - "Assert the mutation harness's own premise: a mutation that does not compile under noEmitOnError reports green against the unmutated build"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-33-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt
  modified:
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-model.test.ts
    - scripts/board-read.test.ts
    - scripts/board-tracer.test.ts
    - scripts/board-watch.test.ts
    - scripts/board-watch-live.test.ts
    - scripts/board-dashboard.test.ts
    - agent-factory/contracts/board.md
    - scripts/fixtures/board-snapshot/expected-snapshot.json

key-decisions:
  - "HUMAN DECISION (Task 1 checkpoint): option A — publish `stem` on `TicketRecord` and bump `SCHEMA_VERSION` to 2. The human's selection, verbatim: \"A: Publish stem, bump to v2\". No further reason text was given."
  - "The SCHEMA_VERSION docblock's two disagreeing sentences were reconciled into ONE rule rather than left for the next reader to choose between: any change to the published shape moves the number and regenerates the golden in the same commit, additive or not"
  - "`presenceActual` returns `null` for `admitted-under-its-stem`, so one function decides whether a conflict exists as well as what it says — the alternative, a `has()` guard before the call, is the two-places-decide shape the defect came from"
  - "`empty-stem` is a READER refusal code, declared in scripts/board-read.ts beside `duplicate-id`, and deliberately NOT added to `TICKET_REFUSAL_CODES` — the grammar never sees the document, so listing it among the grammar's codes would make that closed set say something false"
  - "The structural no-linear-scan case reads the TypeScript AST rather than the file's bytes, because the docblock beside the fix names `records.find(` and a text scan finds the sentence describing the fix"
  - "Nine scattered `schemaVersion ... toBe(1)` literals across four test files were replaced with the imported SCHEMA_VERSION, leaving exactly two literal pins (board-model.test.ts and board-tracer.test.ts) — a version literal in every file that checks a document is the set-literal drift class"

patterns-established:
  - "Four-arm presence partition: three measured sets asked in a stated priority order, the fourth arm their complement, with an arithmetic case comparing the arm's answer against a count derived from the raw arrays on the other side of the loop"
  - "Mutation-derived row discovery, third appearance: the three-file duplicate row exists only because M6 (seenById overwrites) cannot be seen by a two-file corpus"

requirements-completed: [DASH-03, DASH-05, DASH-08]

coverage:
  - id: D1
    description: "A board row whose identifier is carried by a ticket file that declares a DIFFERENT identifier produces a conflict naming the identifier the file declares, never a sentence asserting that no file carries it"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#raises NO conflict asserting absence for an identifier whose file was admitted"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#(2) an identifier that is a FILE STEM answers `admitted-under-another-id`, carrying it"
        status: pass
      - kind: integration
        ref: "scripts/board-model.test.ts#the projector states what the file declares, end to end, through the real reader"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt § 1 — the four-row neighbour table re-run on the committed .js: one cell moved, four byte-identical"
        status: pass
    human_judgment: false
  - id: D2
    description: "The presence question is answered from ONE derivation over a total population, with the third population falling out as an arithmetic difference rather than as an arm somebody had to think of"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#the listing's `.md` stem set EQUALS the admitted stems plus the refused identifiers"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the count answered `absent` EQUALS the count derived independently of the arm"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#no arm in the join iterates the RAW ticket list (derived from the file)"
        status: pass
      - kind: integration
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt § 6 — mutations M1-M4, one per arm, each reddening that arm's own case"
        status: pass
    human_judgment: false
  - id: D3
    description: "A `plans/tickets/` entry named exactly `.md` is a member of the refused population under a named code rather than an admitted record holding an identifier no row can name"
    requirement: DASH-05
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#lands in the unadmitted half under `empty-stem`, leaving the source ok"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the partition TOTAL, against a denominator derived from the listing"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#is refused before its bytes are ever requested"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt § 3 row V6 — the board grammar and the reader refuse the empty identifier independently"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two files claiming one identifier are still reported once and joined once, and the check that finds them is a map lookup, so a tickets directory at the walk bound costs one pass rather than a quadratic one"
    requirement: DASH-05
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#still reports both files and joins the first, with the message unchanged"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#reports THREE files claiming one identifier against the FIRST, not against each other"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#contains no linear scan over the accumulated records (derived from the file)"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt § 4 — 510.5 ms -> 340.5 ms at 10,000 admitted entries, growth shape 2.3-2.4x -> ~2.0x per doubling"
        status: pass
    human_judgment: false
  - id: D5
    description: "The published snapshot shape moved by a recorded human decision, and the contract, the constant and the golden all moved with it in one commit"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#pins the published schemaVersion, which no change may move without the golden moving with it"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#renders the committed fixture tree to the committed golden, byte for byte"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the conflict-kind set did NOT grow to reach the honest sentence"
        status: pass
    human_judgment: true
    rationale: "The AUTOMATED half is fully proven above. What no test can assert is whether moving a published contract was the right call for a consumer nobody has written yet — D-19 calls schemaVersion the shape a future web renderer consumes unchanged, and the decision to move it was taken by a human at the Task 1 checkpoint. A reviewer should confirm the recorded decision is the one intended before this phase closes."

duration: 56 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 33: One Presence Derivation Over a Total Identifier Population Summary

**The projector no longer says "no ticket file carries that identifier" about a file it listed, read, parsed and admitted — the presence question is asked once over three measured sets, the negative sentence is reachable only as their complement, and `TicketRecord` now publishes the file's stem beside the identifier the document declares.**

## Performance

- **Duration:** 56 min
- **Started:** 2026-09-16T09:04:30Z
- **Completed:** 2026-09-16T10:00:44Z
- **Tasks:** 4 (Task 1 was a decision checkpoint, resolved by the human before dispatch)
- **Files modified:** 14 (12 tracked source/contract/fixture files, 2 planning artifacts created)

## The Task 1 decision, recorded

The plan's Task 1 was a `checkpoint:decision` with `gate="blocking"`. The orchestrator presented
options A, B and C to the human before dispatching this executor. The human selected:

> **A: Publish stem, bump to v2**

That is the human's own wording, verbatim and complete; no further reason text was given, and none is
invented here. The option's own listed reasons, as the plan states them, are that it is the most
faithful reading of the verifier's `missing:` text, that it gives a future web renderer a published
stem it can rely on, and that a version bump is the honest way to ship a contract change. Its listed
costs — one-way under D-19 for a consumer pinned to version 1, and a regenerated byte-for-byte golden
— were both paid in the same commit as the type change, which is what the plan's acceptance criteria
require of options A and B.

Consequences carried out under that decision:

- `scripts/fixtures/board-snapshot/expected-snapshot.json` joined `files_modified` and was
  regenerated in commit `92f27444`, the same commit as the type change, with the one command its
  README names. Its only changes are `schemaVersion: 1 -> 2` and one `"stem"` line per record in
  `tickets[]`; the `conflicts[]` array is byte-identical.
- `SCHEMA_VERSION` moved to 2, and the contract gained a `## The published snapshot version` section
  stating the number, the rule that governs it, and what version 2 added.
- The `SCHEMA_VERSION` docblock's two sentences — "adding a field is additive" and "any shape change
  bumps this number" — were in tension, and the plan required reconciling them. They are now one
  rule: **any** change to the published shape moves the number and regenerates the golden in the same
  commit. "Additive" describes what a change costs a tolerant consumer; it never described what it
  costs this constant.

## Accomplishments

- **The fabrication is closed.** `joinSnapshot` answered the presence question from two maps keyed on
  two different notions of identity — declared id for admitted documents, file stem for refused ones.
  A document admitted under a declared identifier that is not its stem was in neither, so its stem's
  presence question was answered as absence. `presenceOf` now asks three measured sets in a stated
  priority order and returns one of four discriminated arms.
- **`absent` is arithmetic, not an arm somebody remembered to write.** It is reachable only by falling
  off the end of all three lookups. A case in the join's own test file asserts that the count of
  identifiers answered `absent` equals the count of placements in none of the three sets, derived
  from the reader's raw arrays rather than from the indexes the arm consumes — 32-15's instrument,
  applied to the partition's KEYS.
- **One function decides both the silence and the sentence.** `presenceActual` returns `null` for
  `admitted-under-its-stem`, so whether a `row-without-file` exists at all and what its `actual` says
  are one decision in one place.
- **The kind set did not grow and the four sentences are distinct.** Still seven `CONFLICT_KINDS` in
  the contract's order. A case asserts the four presence sentences are pairwise distinct and that
  exactly one of them asserts a negative — the RED baseline measured the mismatch and absent rows
  producing byte-identical text for two different facts.
- **WR-08 closed and measured.** The duplicate check is a `seenById` map lookup. `readSnapshot` at
  10,000 admitted entries falls from 510.5 ms to 340.5 ms, and the growth shape falls from 2.3-2.4x
  per doubling to 1.98-2.07x. A deterministic AST case forbids any search call over the accumulating
  `records` array.
- **IN-02 closed by name.** An entry called exactly `.md` is refused under `empty-stem`, counted in
  the walk's refused half, and never opened. It used to be admitted under an identifier of zero
  characters, inside a population the reader pins by count, with no channel reporting it.
- **The rule is in the contract, and the module cites it rather than carrying a second spelling.**
  `agent-factory/contracts/board.md` now states the four-population presence table, the empty-stem
  refusal, and the published snapshot version.

## Task Commits

1. **Task 2: RED baseline** — `e13ff086` (test)
2. **Task 3: the presence derivation, the stem, the map and the empty-stem refusal** — `92f27444` (feat)
3. **Task 4: the GREEN proof** — `c77b5547` (docs)

**Plan metadata:** the `docs(32-33): complete the presence-derivation gap-closure plan` commit,
carrying this SUMMARY, `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md`. That is the fourth commit, and
it is why `actuals.commits` reads 4 while the table above lists three: `git rev-list --count
c677eb7a..HEAD` measures 4 once the metadata commit exists, which is the instrument
`/gsd-verify-work` re-runs.

_Task 1 was a decision checkpoint resolved by the human before dispatch; it produced no commit of its
own, and its outcome is recorded above and in `scripts/board-model.ts`'s `SCHEMA_VERSION` docblock._

## Files Created/Modified

- `scripts/board-model.ts` — `SCHEMA_VERSION` 2 with a reconciled docblock; `TicketRecord.stem`;
  `TICKET_PRESENCE_KINDS` / `TICKET_PRESENCE_KIND_COUNT` / `TicketPresence` / `TicketPopulations`;
  `ticketPopulations`, `presenceOf`, `presenceActual`; the `row-without-file` arm rewritten to consume
  exactly one answer
- `scripts/board-read.ts` — the identity pair carried on every admitted record; the `empty-stem`
  refusal as the walk's second exit; `seenById` replacing the per-entry scan; the exits renumbered
- `scripts/board-model.js`, `scripts/board-read.js` — the committed twins, rebuilt in the same commit
- `scripts/board-model.test.ts` — the closed presence-kind set, the four arms, the per-arm sentences,
  the containment check, the join's four populations, and the two arithmetic-totality cases over a
  real planted tree; the raw-list structural case's premise repaired to follow the builder
- `scripts/board-read.test.ts` — the mismatch admitted with zero read errors, the stem derived
  two-sidedly, the `.md` entry refused and counted and never opened, the two- and three-file duplicate
  rows, and the AST case forbidding a linear scan
- `scripts/board-tracer.test.ts`, `scripts/board-watch.test.ts`, `scripts/board-watch-live.test.ts`,
  `scripts/board-dashboard.test.ts` — the scattered version literals replaced with the constant
- `agent-factory/contracts/board.md` — the presence rule as a four-row table, the empty-stem refusal,
  and the published snapshot version with the rule that governs it
- `scripts/fixtures/board-snapshot/expected-snapshot.json` — regenerated under the Task 1 decision
- `.planning/phases/32-board-projector-cli-dashboard/32-33-RED-baseline.txt` — the fabricated sentence,
  the four-row partition, the cost shape and the degenerate entry, all measured
- `.planning/phases/32-board-projector-cli-dashboard/32-33-GREEN-proof.txt` — the re-run, the per-arm
  probe, the six variations, the before/after timings, the reachability answers and six mutations

## Decisions Made

See `key-decisions` in the frontmatter. The two that cost something beyond this plan:

- **The version moved, and the rule that governs it was rewritten.** The docblock used to license
  either reading; a future reader adding a field would have been free to leave the number alone. One
  rule now governs, and it is stated in the contract as well as in the module.
- **`empty-stem` is a reader code, not a grammar code.** `TICKET_REFUSAL_CODES` is the ticket
  grammar's closed set, and the grammar never sees an entry the reader refuses on its name. Adding
  `empty-stem` there would have made a two-sided closed-set assertion say something false about which
  authority refused what.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The raw-list structural case's PREMISE was invalidated by the fix it was
guarding**

- **Found during:** Task 3
- **Issue:** `scripts/board-model.test.ts`'s "no arm in the join iterates the RAW ticket list" case
  asserted that exactly ONE `for (const t of tickets)` loop exists inside `joinSnapshot` — the
  `ticketById` builder. Moving that builder into `ticketPopulations` left zero, so the premise failed.
  Deleting the premise would have left the main assertion vacuously true of a join that lost the
  population entirely.
- **Fix:** The same question is now asked of two bodies: `joinSnapshot` reads the raw list NOWHERE and
  must call `ticketPopulations(`, and the builder reads it in exactly ONE place and must index by both
  `byId` and `byStem`. The premise moved with the code rather than being dropped.
- **Files modified:** `scripts/board-model.test.ts`
- **Verification:** Mutation M1 reds the case set this guards; the case itself is green.
- **Committed in:** `92f27444`

**2. [Rule 3 - Blocking] Nine `schemaVersion ... toBe(1)` literals scattered across four test files**

- **Found during:** Task 3, under the Task 1 option-A decision
- **Issue:** The published version was retyped as a literal in `board-tracer.test.ts`,
  `board-watch.test.ts`, `board-watch-live.test.ts` and `board-dashboard.test.ts`, including two
  constructed stub snapshots. Bumping the constant turned all of them red.
- **Fix:** Every assertion about an EMITTED document now compares against the imported
  `SCHEMA_VERSION`; the two deliberate PINS (one in `board-model.test.ts`, one in
  `board-tracer.test.ts`) keep a literal and were bumped to 2 by hand, so a version move still costs
  a number a human had to retype. This is the set-literal drift class recorded in project memory,
  closed one register down rather than re-typed nine times.
- **Files modified:** `scripts/board-tracer.test.ts`, `scripts/board-watch.test.ts`,
  `scripts/board-watch-live.test.ts`, `scripts/board-dashboard.test.ts`
- **Verification:** Full suite green; the two literal pins fail if `SCHEMA_VERSION` moves again
  without them.
- **Committed in:** `92f27444`

**3. [Rule 3 - Blocking] The anonymous-callback census denominator moved when the scan was deleted**

- **Found during:** Task 3
- **Issue:** `scripts/board-read.test.ts` pins the number of NAMELESS function-like members the
  routing census walks. Replacing `records.find((r) => r.id === id)` with a map lookup removed one
  arrow, so the pinned 17 became 16.
- **Fix:** The constant was moved to 16 with the reason recorded at the declaration — a callback that
  LEAVES moves the denominator exactly as a new one does, which is why it is pinned rather than
  derived from the census it checks.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** The routing census case is green and still reports 17 read-primitive call sites
  over a universe of 51.
- **Committed in:** `92f27444`

**4. [Rule 3 - Blocking] The structural no-scan case reported its own docblock as the defect**

- **Found during:** Task 3
- **Issue:** The first spelling of "contains no linear scan over the accumulated records" was a text
  scan for `records.find(`. The docblock beside the fix NAMES the call it replaced, so the case found
  the sentence describing the fix and reported the defect as still present.
- **Fix:** The case walks `readTicketsSource`'s TypeScript AST instead. A comment is not a node, so
  the question is asked of CODE without a second comment stripper needing to exist. An intermediate
  attempt imported `stripNonCode` from `scripts/js-import-closure.ts` and was abandoned: it tripped
  `board-readonly.test.ts`'s derived walker-importer pin, and paying that pin would have meant adding
  a `CLOSURE_BASELINES` row for a test file that builds no mirror — a false entry in a table whose
  whole value is that every row is true.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** The case asserts its own premise — that the docblock naming the replaced call is
  still there — so it cannot pass by accident on a file where the prose was removed.
- **Committed in:** `92f27444`

---

**Total deviations:** 4 auto-fixed (4 blocking). **Impact on plan:** All four are consequences of the
planned change meeting guards that were already there, and three of the four are those guards working
as designed. None widened scope; the one that changed an instrument (deviation 4) made it stricter.

## Issues Encountered

**A mutation that does not compile reports green, and looks exactly like a mutation that proved
something.** M3's first spelling narrowed a binding to `never` and then read a property off it. `tsc`
refused it, `tsconfig.json` sets `"noEmitOnError": true`, so nothing was emitted and the suite ran
against the UNMUTATED build — transcript `298 passed`, indistinguishable from a clause that decides
nothing. Resolved by re-spelling M3 so it type-checks, and by checking the build's error tail and
reading the mutated line back out of the emitted `.js` before believing any subsequent mutation. This
is the project-memory lesson about asserting the verification harness's own premise, appearing again
in a new register; it is recorded in `32-33-GREEN-proof.txt` § 6 rather than quietly fixed.

**The golden-fixture cleanliness guard fails while the regenerated golden is uncommitted.** Between
regenerating `expected-snapshot.json` and committing it, `scripts/board-dashboard.test.ts`'s
"a test run left the committed fixture tree modified" guard fails at suite collection. That is the
guard doing its job, not a defect; it goes green on the commit. Noted so the next reader does not
mistake the intermediate state for a broken fix.

## Known Stubs

None. No placeholder, empty-value or "coming soon" path was introduced by this plan.

## Threat Flags

None. The plan's `<threat_model>` covers every surface this change touches, and no new network
endpoint, auth path, file access pattern or schema at a trust boundary was introduced. T-32-33-01
through T-32-33-05 are all mitigated as the register states; the one `accept` row (T-32-33-04,
conflict `actual` text) was re-checked with a dedicated case asserting that no presence sentence
contains a byte of any document's body.

## Verification Results

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts scripts/board-model.test.ts` | exit 0, **298 passed** (RED baseline: 271 — 27 cases added, none replaced) |
| `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` | exit 0; "no tracked build output moved"; "All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources" |
| `npm run check:dashboard-readonly` | exit 0, **171 passed** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, **5083 passed / 2 skipped** across 75 files (floor: 4974; dispatch baseline: 5056) |
| `node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json` | exit 0, one JSON document, `schemaVersion: 2` |
| `grep -c 'declares the identifier' 32-33-GREEN-proof.txt` | 7 |
| `git diff --exit-code -- scripts/fixtures/` | clean at HEAD; the golden moved inside `92f27444` under the Task 1 option-A decision |

## Estimate vs actuals

The plan estimated 125,000 tokens for 4 tasks. The realized diff over
`c677eb7a..c77b5547` is 151,362 characters, which is **37,841** on the chars/4 scale the
`actuals.tokens` field uses. Recorded unrounded. A note for whoever calibrates this next: measured
over the whole CONTENT of the 14 changed files rather than over the diff, the same work reads
245,079 — the two scales differ by 6.5x here because four of the files were touched for a single
constant each and two are large compiled twins. The diff-scale number is the one recorded above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap 1 (DASH-03) from `32-VERIFICATION.md` is closed at the level the round asked for, and the two
  carried findings it named (WR-08, IN-02) are closed with it and measured.
- **A published contract moved.** `schemaVersion` is 2 and every consumer of the snapshot document
  now sees a `stem` field on each ticket record. Nothing in this repository consumes the document
  outside the dashboard and its suite, so nothing downstream broke — but the future web renderer D-19
  names would need to read version 2, and that is the consequence the human accepted at the Task 1
  checkpoint.
- Plans `32-34` through `32-37` in this round are unaffected by anything here except the schema
  version; any of them that asserts `schemaVersion` must assert 2 or read the constant.
- Nothing is deferred and no residual is carried forward from this plan.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*

## Self-Check: PASSED

- All three created artifacts exist on disk (`[ -f ]` on the RED baseline, the GREEN proof and this SUMMARY).
- All three task commits resolve in `git log --oneline --all`: `e13ff086`, `92f27444`, `c77b5547`.
- Every task's `<acceptance_criteria>` was re-run and passes; the plan-level `<verification>` commands and their results are tabulated under "Verification Results" above.
