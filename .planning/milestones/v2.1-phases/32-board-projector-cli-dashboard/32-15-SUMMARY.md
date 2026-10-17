---
phase: 32-board-projector-cli-dashboard
plan: 15
subsystem: infra
tags: [typescript, board-projector, dashboard, conflict-derivation, no-fabrication]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-09's per-source presence gate (`ticketsListingComplete`) and `PRESENCE_DEPENDENT_CONFLICT_KINDS`"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-10's `childPath` discriminated refusal and the per-source `guarded` wrapper"
provides:
  - "The tickets walk is a TOTAL partition over its own listing: every listed `.md` entry becomes exactly one of an admitted `TicketRecord` or an `UnadmittedTicket`"
  - "`UnadmittedTicket` in the pure module, and `JoinInputs.unadmittedTickets` as a REQUIRED field"
  - "`row-without-file` answers per identifier: the refusal and its code when the file is on disk, the byte-identical absence sentence when it is not"
  - "`ticket-unplaced` stays silent for an unadmitted identifier, with the argument written above the arm"
  - "The contract states both `actual` shapes and the refusal-code channel"
affects: [board projector, dashboard renderer, any --json consumer reading conflicts[]]

actuals:
  tokens: 103199
  tasks: 3
  commits: 4
plan_head_before: 64e5e88e4d3233de5314c3c4d6d15234554cdcb1

tech-stack:
  added: []
  patterns:
    - "Total partition: a walk states its two outcomes as a rule and pins its own size against a denominator derived on the other side of the loop"
    - "Required-field-as-mechanism: a new join input with no default and no optional marker, so every call site is a compile error until it answers"
    - "Two sentences, one derivation: an existing conflict kind carries the true `actual` rather than splitting into a new kind and a SCHEMA_VERSION bump"

key-files:
  created: []
  modified:
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.test.ts
    - scripts/board-model.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "No new conflict kind and no SCHEMA_VERSION move: D-10 makes the kind set part of the `schemaVersion: 1` shape, and the honesty is reachable inside the existing kind by making `actual` true"
  - "`JoinInputs.unadmittedTickets` is REQUIRED, with no default: the compile error is the mechanism that stops a future call site re-acquiring the defect"
  - "`ticket-unplaced` stays silent for an unadmitted identifier: raising it would assert that a document the grammar refused IS a ticket"
  - "The source-degradation rule from plan 32-09 is unchanged: a refused document is still not a failure to obtain bytes"

patterns-established:
  - "Derive the denominator on the other side of the loop: the partition's size is compared against a `.md` count taken from `listDirectoryBounded`, never from the record set it is checking"
  - "Enumerate the sibling arms before claiming a fix: all five arms consuming the ticket record set are listed with their answer for the new population, and each has a case"
  - "Refusal spellings live as one table of rows, its length pinned two-sided and its code set derived against `TICKET_REFUSAL_CODES`"

requirements-completed: [DASH-03, DASH-04, DASH-05]

coverage:
  - id: D1
    description: "A `plans/tickets/<ID>.md` that exists, is readable, and is refused by the ticket grammar produces no conflict asserting that the filesystem carries no file for `<ID>`; the conflict names the refusal and its code instead."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#raises no claim of absence for an identifier whose file exists and was refused"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#(a) a row whose identifier is UNADMITTED names the refusal and asserts no absence"
        status: pass
      - kind: e2e
        ref: "scripts/board-read.test.ts#names the refusal rather than absence, on BOTH the JSON and the plain frame"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every `.md` entry the tickets walk lists lands in exactly one of the admitted record set or the unadmitted set, and the partition's size is asserted against a count derived independently of the loop that fills it."
    requirement: "DASH-04"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#counts `.md` entries from the LISTING and finds records plus unadmitted equal to it"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#pins the refusal table two-sided and reaches EVERY refusal code the grammar declares"
        status: pass
    human_judgment: false
  - id: D3
    description: "`ticket-unplaced` is never raised for an identifier whose only file was refused: the projector makes no claim that a refused document is a ticket."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#(c) an UNADMITTED identifier with no row raises NO `ticket-unplaced`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#(d) an ADMITTED ticket with no row still raises `ticket-unplaced`, exactly as before"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#ARM 3: ticket-unplaced names the ADMITTED unplaced ticket and never the refused one"
        status: pass
    human_judgment: false
  - id: D4
    description: "The refusal stays visible on both channels: a `readErrors` entry carrying the refusal code, and a conflict line in the plain `--once` frame naming the identifier."
    requirement: "DASH-05"
    verification:
      - kind: e2e
        ref: "scripts/board-read.test.ts#names the refusal rather than absence, on BOTH the JSON and the plain frame"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#ARM 5: row-without-file tells the REFUSED identifier apart from the ABSENT one"
        status: pass
    human_judgment: false
  - id: D5
    description: "A pristine-fixture run is byte-identical to the committed golden: with no ticket refused, this change moves nothing."
    requirement: "DASH-04"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (74 files, 4837 passed, 2 skipped — includes the golden comparison case, and `git status --porcelain scripts/fixtures/` is empty)"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#produces the committed sentence for EVERY row when the unadmitted set is empty"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every arm consuming the ticket record set has a stated answer for an unadmitted entry and a case driving it over one mixed-population tree."
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#PREMISE: the tree reaches all five arms, so the per-arm cases below measure something (plus ARM 1..ARM 5)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The fix is shown to FAIL when disabled: emptying `unadmittedTickets` at the single call site turns the RED case, ARM 5 and the reproduction red."
    verification:
      - kind: manual_procedural
        ref: "mutation transcript recorded in this SUMMARY under `## Mutation Proof` — 3 failed | 219 passed mutated, 222 passed restored"
        status: pass
    human_judgment: false

duration: 16 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 15: A refused ticket is never reported as an absent one — Summary

**The tickets walk became a total partition over its own listing, and `row-without-file` now names the refusal and its code for a document that is on disk and was refused, instead of asserting that no file carries the identifier.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-15T10:51:00Z
- **Completed:** 2026-09-15T11:07:00Z
- **Tasks:** 3
- **Files modified:** 7 (5 sources + 2 committed `.js` twins)

## Accomplishments

- **Gap 1 / CR-01 closed at the derivation, not at the source gate.** `joinSnapshot` now answers the presence question PER IDENTIFIER. Degrading the whole tickets source on one refusal was refused explicitly: it would blank every other derivation on the board because one ticket has a stray tab — the failure plan 32-10 spent a whole plan closing one register up.
- **The tickets walk is a total partition.** Every listed `.md` entry becomes exactly one of an admitted `TicketRecord` or an `UnadmittedTicket`. All three exits from the loop push (the `childPath` refusal, the `readVerifyReread` failure, the grammar refusal), each labelled `EXIT n OF THREE` in the code, and the partition's size is asserted against a `.md` count taken from `listDirectoryBounded` on the other side of the loop.
- **The required field is the anti-regression mechanism.** `JoinInputs.unadmittedTickets` has no default and no optional marker. Making it required produced compile errors at all three call sites (production + two test helpers), each of which had to answer "which identifiers did the reader see and fail to admit" before the build would run.
- **The seven refusal spellings are one table, not seven cases.** Length pinned two-sided at 7; the set of codes in the table is asserted equal to `TICKET_REFUSAL_CODES`, so a spelling added to the grammar without a row is red.
- **The five consuming arms are enumerated with their answers.** ARM 1/2 (board-vs-ticket on column, on status) silent; ARM 3 (`ticket-unplaced`) silent by decision; ARM 4 (`ticket-duplicated`) unaffected because it is derived from the board alone; ARM 5 (`row-without-file`) the one arm that changes. One tree holding all three populations drives all five, behind a PREMISE case asserting every kind was derived at all.
- **The reproduction runs against the artifact a host runs.** `node scripts/board-dashboard.js` over a disposable copy of the committed fixture tree, in a scratch root outside the repository, removed in a `finally`; both `--once` and `--once --json` captured and asserted on.

## Task Commits

1. **Task 1 (RED): record the fabricated absence claim** — `b64e72e0` (test)
2. **Task 1 (GREEN): the tickets walk becomes a total partition** — `a056ab4e` (feat)
3. **Task 2: the join answers the presence question per identifier** — `7704f171` (fix)
4. **Task 3: the union of every arm, and the reproduction against the committed `.js`** — `6174cede` (test)

## Files Created/Modified

- `scripts/board-model.ts` — `UnadmittedTicket`; `JoinInputs.unadmittedTickets` (required); `unadmittedById` beside `ticketById`; the two-sentence `row-without-file` derivation; the silence argument above `ticket-unplaced`.
- `scripts/board-read.ts` — `ticketStem` (the one spelling of the file-stem identity rule, shared by both arms); `unadmittedFrom`; `Settled<T>.unadmitted`; `settledFrom`'s third parameter; the three labelled exits in `readTicketsSource`; `readTicketsSource` exported so the partition can be measured; the `joinSnapshot` call site.
- `scripts/board-model.js`, `scripts/board-read.js` — rebuilt committed twins; `npm run check:build-parity` reports no tracked build output moved.
- `scripts/board-read.test.ts` — the RED case, the partition-count case, the seven-row refusal table, the path-authority carry case, the five-arm union battery, the end-to-end reproduction. 103 → 122 cases.
- `scripts/board-model.test.ts` — the four converse cases (a)–(d), the non-`ok` gate case, the pristine empty-set case, the two-rows-one-refusal dedupe case. 93 → 105 cases.
- `agent-factory/contracts/board.md` — `row-without-file` restated over admitted documents; both `actual` shapes named; the refusal-code channel named; `ticket-unplaced`'s silence stated with its reason.

## RED Transcript (Task 1)

```
FAIL  scripts/board-read.test.ts > board-read — a REFUSED ticket is never reported as an
      ABSENT one (plan 32-15, CR-01) > raises no claim of absence for an identifier whose
      file exists and was refused
AssertionError: the projector asserted that no file on disk carries ABC-900 while the file
sits there, readable — a positive claim about a filesystem it did read:
expected [ Array(1) ] to not include 'no ticket file carries that identifier'
```

The three premises passed in the same run, so the red measured the fabrication rather than a missing fixture: the document was planted and readable, the refusal was recorded in `readErrors` with code `unknown-key`, and `sources.tickets.source` was `ok`.

## Mutation Proof (Task 3)

Disabled in exactly one place — `unadmittedTickets: tickets.unadmitted` → `unadmittedTickets: []` at the single `readSnapshot` call site, then rebuilt:

```
× raises no claim of absence for an identifier whose file exists and was refused
× ARM 5: row-without-file tells the REFUSED identifier apart from the ABSENT one
× names the refusal rather than absence, on BOTH the JSON and the plain frame
  Tests  3 failed | 219 passed (222)
```

Restored and rebuilt:

```
  Test Files  2 passed (2)
       Tests  222 passed (222)
```

A guard that cannot be shown to fail proves nothing about the program it walks. Three cases at three different levels — the unit RED, the arm-union battery, and the spawned-process reproduction — all go red on the same one-line removal.

## Verification Results

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts scripts/board-model.test.ts` | 222 passed (baseline 196) |
| `npm run build && npm run typecheck && npm run check:build-parity` | pass — "Build parity: no tracked build output moved when tsc ran." |
| `npm run freshness` | pass — 65 committed `.js` match a rebuild of their sources |
| `npm run freshness:context` | pass (vacuous — no `.grugops/context/` tree) |
| `npm run check:imperative-lexicon` | ALL CHECKS PASSED |
| `npm run check:banned-claims` | ALL CHECKS PASSED |
| `npm run check:public-docs` | ALL CHECKS PASSED |
| `npm run check:claim-anchors` | ALL CHECKS PASSED |
| `npm run check:nul-bytes` | ALL CHECKS PASSED — 2227 tracked files, zero forbidden control bytes |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **74 files, 4837 passed, 2 skipped, 0 failed** (floors: 74 files, 4811 passed) |
| `git status --porcelain scripts/fixtures/` | empty — the committed fixture tree is untouched |

`node scripts/validate-agent-factory.js` refuses to run without `VALIDATE_KIT_ROOT` (C3, "refusing to default the kit root to `.`"). That is the script's own guard, not a failure introduced here; it passes with the variable supplied, as recorded above.

The live claude-CLI e2e lane (`scripts/e2e/**`) was **not** run: it spends tokens on an authenticated box and can hang. Its state is `UNKNOWN - verify`.

## Decisions Made

- **No new conflict kind, no `SCHEMA_VERSION` bump.** A `row-file-unadmitted` kind was considered and refused: D-10 makes the kind set part of the `schemaVersion: 1` shape, so an eighth kind costs the golden, the closed-set count test, the contract and the renderer in one edit — and the same honesty is reachable inside the existing kind by making `actual` true. If a later consumer needs to branch on the two cases mechanically rather than by reading a sentence, that is the version bump to make. (Carried from the plan's `deferred` entry.)
- **`JoinInputs.unadmittedTickets` is required with no default.** An optional field would let a future call site omit the answer and silently re-acquire the defect.
- **`ticket-unplaced` stays silent for an unadmitted identifier.** A refused document's identity is a file stem, not a statement it made; raising "no row names this ticket" would assert that a document nobody could read IS a ticket — the same fabrication in the converse direction.
- **The source-degradation rule is unchanged.** What sets `firstReadFailure` is exactly what plan 32-09 left: bytes not obtained degrades the source, a refused document does not.
- **Neither `actual` sentence quotes a byte of the refused document.** Only the path and the refusal code, both already in `readErrors` — the containment rule plan 32-10 set for `OUTSIDE-ROOT` is kept.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's stated RED assertion contradicted its own must-have truth and Task 2**

- **Found during:** Task 1 (writing the RED case)
- **Issue:** Task 1's `<action>` said the RED case should assert "zero conflicts of kind `row-without-file` for `ABC-900`". Task 2's `<behavior>` says the opposite — "the conflict's `actual` names the refusal code and the file, and `kind` is still `row-without-file`" — and must-have truth 1 says "the conflict raised for that row names the refusal and its code instead". Writing the RED as the plan's Task-1 sentence literally would have produced a case that goes red again the moment Task 2 lands.
- **Fix:** The RED case asserts must-have truth 1 exactly: no conflict for `ABC-900` carries the absence sentence, AND exactly one `row-without-file` is raised naming the refusal code and the file. Both halves fail before the fix; both pass after. Silence would trade one fabrication for a second, quieter one.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** RED transcript above; green at `7704f171`.
- **Committed in:** `b64e72e0`

**2. [Rule 3 - Blocking] The refusal table was six rows and reached only five of the six refusal codes**

- **Found during:** Task 1 (running the table's own derived pin)
- **Issue:** The five spellings CR-01 names map onto five codes, but a byte-order mark and a missing opening delimiter both produce `no-opening-delimiter`, so the six-row table left `unrecognized-line` unreached. The derived pin (`table codes === TICKET_REFUSAL_CODES`) caught it rather than a reviewer.
- **Fix:** Added a seventh row — a line inside the region that is neither `key: value` nor `key:` — and moved the two-sided length pin to 7. Every code the grammar declares is now reached by a row.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** `pins the refusal table two-sided and reaches EVERY refusal code the grammar declares` passes.
- **Committed in:** `a056ab4e`

**3. [Rule 3 - Blocking] `readTicketsSource` had to be exported to make the partition measurable**

- **Found during:** Task 1 (writing the partition-count case)
- **Issue:** The unadmitted set is an internal carry-out that never reaches the published snapshot, so a test driving only `readSnapshot` cannot see it — and a partition whose size cannot be measured is a partition nobody checks.
- **Fix:** `readTicketsSource` is now exported. It performs no new I/O and adds no path authority, so the file's routing and swallow censuses are unaffected (both still pass, 17 read-primitive call sites).
- **Files modified:** `scripts/board-read.ts`
- **Verification:** the routing census prints the same 17 sites and the same producer set as before the change.
- **Committed in:** `a056ab4e`

### Process deviations

**4. The RED case was red at the Task 1 commit, by design.** Task 1's `<acceptance_criteria>` says `scripts/board-read.test.ts` passes, and Task 1's `<action>` says to record a RED whose sentence lives in the join — which Task 2 changes. The two cannot both hold at one commit. The RED→GREEN pair was honored across the two commits (`b64e72e0` records the red; `7704f171` turns it green) and Task 1's own new cases are all green at `a056ab4e`. Task 1's suite-passes criterion is satisfied from `7704f171` onward.

**5. Committed directly on `main`.** `.planning/config.json` sets `git.branching_strategy: "none"`, the orchestrator dispatched this plan as a sequential executor on the main working tree, and every phase-32 commit to date is on `main`. The pre-existing uncommitted changes in the tree (`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/` and `.planning/state.json`) were never staged.

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking) + 2 process notes.
**Impact on plan:** No scope creep. Two of the three auto-fixes were caught by the plan's own derived pins rather than by inspection, which is the mechanism working.

## Issues Encountered

- **Vitest resolves `./board-read.js` to the committed `.js`, not the `.ts`.** The first run of the new reader cases reported `readTicketsSource is not a function` because the committed twin was stale. This is the same premise `32-14-ADVERSARIAL-REVIEW.md` §0 states for transcripts, one register down: every run in this plan was preceded by `npm run build`. Resolved, not deferred.

## Known Stubs

None.

## Threat Flags

None. The change introduces no network endpoint, no auth path, no new file-access pattern and no schema change. `scripts/board-read.ts` gained no read primitive and no path authority — the routing census reports the same 17 read-primitive call sites and the same producer set as before.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 32-15 ran first in gap-closure round 2 by design: every later plan in this round either analyses the compiled closure containing `scripts/board-read.js` and `scripts/board-model.js`, or changes which documents this reader refuses. Both committed twins are rebuilt and `check:build-parity` is green, so 32-16..32-23 start from a tree whose `.js` is a faithful build of its `.ts`.
- `REQUIREMENTS.md` and the ROADMAP phase status were deliberately NOT flipped to Complete by this plan (plan success criterion 5). The ROADMAP row reads `In Progress`.
- Open at the end of this plan: the live claude-CLI e2e lane was not run (`UNKNOWN - verify`), and gap-closure round 2 has eight further plans (32-16..32-23) before phase verification.

## Self-Check

- `scripts/board-read.ts` — FOUND
- `scripts/board-read.js` — FOUND
- `scripts/board-model.ts` — FOUND
- `scripts/board-model.js` — FOUND
- `scripts/board-read.test.ts` — FOUND
- `scripts/board-model.test.ts` — FOUND
- `agent-factory/contracts/board.md` — FOUND
- commits `b64e72e0`, `a056ab4e`, `7704f171`, `6174cede` — FOUND in `git log`

## Self-Check: PASSED

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*
