---
phase: 33-live-capture-windows-portability
plan: 38
subsystem: shared verified context (note store + GOV-02 audit ledger)
status: complete
tags: [context-io, audit-ledger, gov-02, wr-01, gap-closure, round-4, tdd]
requires:
  - phase: 33-25
    provides: "the sealed one-walk reader (readRawNotes refuses unsealed notes), which made the unsealed occupant invisible to promoteAdmitted's occupancy clause"
  - phase: 31-21
    provides: "readRegularFileOrNull, the bounded single-file reader (CR-12), and the ledger-before-note order on both note-plus-ledger routes"
provides:
  - "decideNoteDestination(notesDir, id, text): writeNoteFile's containment, candidate-ceiling and bounded destination read, extracted unchanged; the chokepoint and every note-writing route that touches the ledger ask it"
  - "promoteAdmitted decides destination-id-occupied from the raw file before ledgerRecordsId/appendAuditLedger"
  - "admitAndAppend (both branches) and appendNote decide occupancy before their GOV-02 append / admit() call"
  - "noteDestinationRefusal: the findings-contract form admitAndAppend consumes (never throws)"
  - "an AST dominance test: every ledger touch on the three note-writing routes is dominated by an occupancy decision"
affects: ["33-39..33-43 (round-4 remainder)", "33-43 ledger (docs/audit/31-round4-residuals.md B8 annotation)"]
tech-stack:
  added: []
  patterns:
    - "occupancy is a fact about the filename: asked of the bounded raw-file reader, never of the seal-filtered walk"
    - "one destination decision shared by the write chokepoint and the pre-ledger routes, so the two reads cannot disagree"
    - "order asserted as AST DOMINANCE (an earlier statement in an enclosing block), not as 'earlier in the text'"
    - "a builtin nonce pinned via createRequire + syncBuiltinESMExports, with the seam's own premise asserted first"
key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
key-decisions:
  - "The occupancy read is writeNoteFile's own pre-write decision extracted into decideNoteDestination (containment, candidate ceiling, bounded read). It is not a second readRegularFileOrNull call in each route. Its refusals (traversal, FIFO, directory, above-ceiling) therefore fire before the ledger on every route, with the chokepoint's own clause names."
  - "admitAndAppend returns a findings refusal for an occupied or unreadable destination and does not throw, which matches its contract. A FIFO at the gated destination was a throw before this plan and is now a named finding."
  - "Scope widened past the plan's two routes (Rule 2, the same threat T-33-172). appendNote with a caller-chosen precomputedId and admitAndAppend's non-gated branch had the same ledger-then-note over-record. Both were measured at ledger lines 1 on an occupied id and closed RED-first. Recorded in WINDOWS.md row 272."
  - "IN-04 closed as a side effect. It had been pinned as a failing-on-change assertion. It went red on purpose and now asserts that a write the chokepoint refuses is refused before the admission is recorded."
requirements-addressed: [CAP-01]
requirements-completed: []  # CAP-01 is phase-level; this plan fixes an audit-trail over-record and does not change what a live capture observes
actuals:
  tokens: 8656
  tasks: 2
  commits: 6
plan_head_before: 03251e57d6a19e68bf1424bbd8bab2ec162ba7d5
coverage:
  - id: D1
    description: "promoteAdmitted refuses an unsealed, malformed or FIFO occupant at the destination id before any ledger read/append (dest ledger lines 0, occupant byte-unchanged); the reader still refuses the unsealed note"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 2b (33-38, WR-01 — the promoteAdmitted route)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 2c (33-38) / CONTROL 2e (33-38, 31-21 CR-12 bound)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Legitimate inputs are not newly refused: identical-bytes re-promotion still falls through and records once; CONTROL 3 still writes with ledger lines 1; fresh-id gated admission writes and appends one line (retained) or none (lean)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL 2d (33-38, legitimate input) / CONTROL 3 (CR-08 unmoved) / LEGITIMATE INPUT cases in the 33-38 describe"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (full offline suite, 5774 passed; the 1 failure was hook-entry.ts uncommitted-vs-HEAD, green after commit a9c1331b: floor-invariance 140/140)"
        status: pass
    human_judgment: false
  - id: D3
    description: "admitAndAppend (gated and non-gated) and appendNote refuse an occupied id before their GOV-02 append / admit() call; all five ledger touches on the three routes are dominated by an occupancy decision"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#33-38 — admitAndAppend's gated branch decides occupancy before its GOV-02 append"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#ORDER, derived from the AST (mutation: removing appendNote's decision reds it at admit)"
        status: pass
    human_judgment: false
duration: 21min
completed: 2026-09-24
---

# Phase 33 Plan 38: WR-01, occupancy decided from the raw file before the ledger Summary

**`promoteAdmitted` no longer asks the sealed reader whether its destination id is taken. It asks `decideNoteDestination`, the write chokepoint's own bounded raw-file decision, before the GOV-02 ledger is read or appended. An unsealed, malformed or FIFO occupant is now refused with dest ledger lines 0 where the committed module wrote 1. The same pre-ledger decision now guards `admitAndAppend`'s two branches and `appendNote`, and it closed IN-04 as a side effect.**

## Performance

- **Duration:** 21 min (about 9 of them the full offline suite)
- **Started:** 2026-09-23T20:43:00Z
- **Completed:** 2026-09-23T21:03:38Z
- **Tasks:** 2 (plus one Rule 2 extension inside Task 2's files)
- **Files modified:** 5 (context-io .ts/.js/.test.ts, hook-entry .ts/.js for the manifest)

## Accomplishments

- **WR-01 fixed on the route where it was reported.** `promoteAdmitted`'s `destination-id-occupied` clause now reads `decideNoteDestination(join(to, task, "notes"), sourceId, candidateText)`, which is the bounded `readRegularFileOrNull(..., NOTE_FILE_MAX_BYTES, "note destination")`. Before this plan it read `readRawNotes(task, to)`. The clause name and its register reason are unchanged, and `readRawNotes(task, from)` still supplies the proof's left operand.
- **One destination decision.** `writeNoteFile`'s containment check, candidate-ceiling check and destination read moved unchanged into `decideNoteDestination`. The chokepoint calls it, and so does every route that touches the ledger, so the pre-ledger read and the chokepoint's read are the same code. The ceiling-site census moved the two write-side entries to the new scope, and the count is still 4.
- **The sibling routes are covered.** `admitAndAppend`'s gated branch (the plan's Task 2), its non-gated branch, and `appendNote` with a caller-chosen `precomputedId` all decide occupancy before `appendAuditLedger` or `admit()`. Both `admitAndAppend` branches go through `noteDestinationRefusal` and return findings instead of throwing.
- **Order is checked on the source.** An AST test requires every one of the 5 ledger touches on the 3 note-writing routes to be dominated by an occupancy decision, meaning an earlier `const … = decideNoteDestination(…)` in an enclosing block. Deleting `appendNote`'s decision turns it red at `admit at line 1928`.

## RED evidence (quoted from the runs)

- Task 1, against committed `49f50aac^` (= `04f6b498`, the module as of 33-37). Run: `npx vitest run scripts/context-io.test.ts -t "CONTROL 2"`. Result: 3 failed, 10 passed.
  - `× CONTROL 2b ...` `AssertionError: a GOV-02 event was appended for a note the store does not hold — the over-record WR-01 measured: expected 1 to be +0`
  - `× CONTROL 2c ...` `expected 1 to be +0`
  - `× CONTROL 2e ...` `expected 1 to be +0`
  - CONTROL 2d (identical bytes) passed as a control.
- Task 2, against committed `ded41caf` (gated fix not yet built). Result: 2 failed, 3 passed. The nonce-seam PREMISE passed.
  - `× RED-first: a DIFFERING occupant ...` `AssertionError: a GOV-02 event was appended for a gated note that was never written — the WR-01 over-record: expected 1 to be +0`
  - `× a FIFO at the minted id's path ...` `expected 1 to be +0`
- Extension, against committed `45c7514b`. Result: 3 failed.
  - `× SIBLING ARM (appendNote ...)` and `× SIBLING ARM (admitAndAppend's NON-gated ...)` both failed with `admit() recorded an admission for a note that was never written: expected 1 to be +0`
  - `× ORDER ...` `admitAndAppend touches the GOV-02 ledger with no occupancy decision above it (WR-01): expected [ 'admit at line 6378' ] to deeply equal []`

## Verification (quoted)

- `npx tsc --noEmit`: exit 0.
- `npm run check:build-parity` after each GREEN commit: `ALL CHECKS PASSED`.
- `npm run freshness:hook-manifest`: `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.`
- `npm run check:nul-bytes`: `ALL CHECKS PASSED`.
- `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts scripts/context-io-writer-set.test.ts scripts/compactor.test.ts`: `Test Files 3 passed (3)`, `Tests 1099 passed (1099)`.
- Full offline suite: `Test Files 1 failed | 77 passed (78)`, `Tests 1 failed | 5774 passed | 2 skipped`. The one failure was `floor-invariance > hooks/hook-entry.ts has no uncommitted modification`, which was measured before the commit. After `a9c1331b`: `floor-invariance.test.ts Tests 140 passed (140)`.
- `npm test` was not run.

## Task Commits

1. **Task 1 RED:** `04f6b498` (test). CONTROL 2b asserts ledger lines 0; 2c, 2d and 2e added.
2. **Task 1 GREEN:** `49f50aac` (fix). Added `decideNoteDestination`, and `promoteAdmitted` now uses it for occupancy.
3. **Task 2 RED:** `ded41caf` (test). Gated-branch occupied and FIFO cases, the nonce seam, and legitimate controls.
4. **Task 2 GREEN:** `96ccb4b5` (fix). The gated branch decides occupancy before its GOV-02 append.
5. **Extension RED:** `45c7514b` (test). appendNote and non-gated arms; ORDER strengthened to dominance.
6. **Extension GREEN:** `a9c1331b` (fix). appendNote and the non-gated branch; `noteDestinationRefusal`; IN-04 closure.

## Files Created/Modified

- `scripts/context-io.ts`: adds `decideNoteDestination`, `differingOccupantSentence`/`differingOccupantRefusal` (the append-only refusal, now written in one place) and `noteDestinationRefusal`. Wires occupancy before the ledger in `promoteAdmitted`, both `admitAndAppend` branches and `appendNote`.
- `scripts/context-io.js`: rebuilt twin.
- `scripts/context-io.test.ts`: CONTROL 2b (rewritten), 2c, 2d and 2e; the `33-38` describe (nonce seam and premise, occupied and FIFO cases, sibling arms, dominance ORDER test, legitimate-input controls); census scope rename; IN-04 flipped to CLOSED.
- `hooks/hook-entry.ts` / `.js`: regenerated manifest hash for the changed decider dependency.

## Decisions Made

See `key-decisions` in the frontmatter. In short: extract the chokepoint's decision rather than add a second read; use a findings refusal in `admitAndAppend`; widen to the two sibling arms because measurement showed they had the same over-record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The same over-record on `appendNote` (caller-chosen id) and on `admitAndAppend`'s non-gated branch**
- **Found during:** Task 2, by following how the ledger is reached. A scratch probe of `appendNote(..., precomputedId = occupied id, repoRoot)` under `retained` measured `threw: context-io.writeNoteFile: refusing to write — the destination already holds a DIFFERENT no…` and `ledger lines: 1`.
- **Issue:** `admit()` appends the GOV-02 event before the write on both arms, so the chokepoint's refusal came after the record. This is the same threat as T-33-172.
- **Fix:** both arms ask the one destination decision before `admit()`. RED-first (`45c7514b`), GREEN (`a9c1331b`).
- **Files modified:** scripts/context-io.ts, scripts/context-io.js, scripts/context-io.test.ts.
- **Recorded:** WINDOWS.md row 272 (deviation), so the scope expansion is visible.

**2. [Rule 1 - Pinned residual] IN-04's failing-on-change assertion went red, as it was written to**
- **Issue:** the case pinned "a refused write leaves the admission's ledger event behind". The appendNote fix closes that.
- **Fix:** the test now asserts the closure (0 ledger lines) and its comment says what moved it. `docs/audit/31-round4-residuals.md` row B8 was not edited (historical record, outside files_modified). It is logged in `deferred-items.md` for 33-43's ledger to annotate.

**3. [Rule 1 - Test fixture] A traversal `by` on `admitAndAppend`'s non-gated branch**
- **Issue:** the new pre-`admit()` decision raised the containment refusal as a throw. The existing R6-1 test expects `id: null` with findings.
- **Fix:** `noteDestinationRefusal` converts every `decideNoteDestination` refusal into a finding on that route, which is the function's documented contract. The R6-1 test passes unchanged.

**4. [Rule 3 - Blocking] Ceiling-site census**
- The two write-side note-ceiling sites changed scope (`writeNoteFile` → `decideNoteDestination`). The census entries and the CR-19 PREMISE/CONVERSE scope names were updated. The count is still 4, so the census still asserts one read, not two.

**Total deviations:** 4 (1 Rule 2 scope widening, 2 Rule 1, 1 Rule 3). **Impact:** every change closes the same over-record class or keeps an existing assertion accurate. No legitimate input is newly refused (D2).

## Issues Encountered

- The hook manifest had to be regenerated in Task 1, not only in Task 2 as the plan scheduled. The WR-36 delivered-root tests fail closed on a stale `context-io.js` hash, so each GREEN commit carries a fresh manifest.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path or trust boundary. The change narrows when a ledger event is written.

## Next Phase Readiness

- WR-01 (33-VERIFICATION gap 5 `missing` and `regressions[WR-01]`) is closed on every route that writes a note and a GOV-02 event.
- Open: the Phase 31 residuals document's B8 row (deferred-items.md, owner 33-43). CAP-01/02 are still measured by 33-40.

## Self-Check: PASSED

- FOUND scripts/context-io.ts, scripts/context-io.js, scripts/context-io.test.ts
- FOUND 04f6b498, 49f50aac, ded41caf, 96ccb4b5, 45c7514b, a9c1331b
- `git rev-list --count 03251e57..HEAD` = 6 before the docs commit

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-24*
