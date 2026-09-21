---
phase: 33-live-capture-windows-portability
plan: 25
subsystem: context-io
tags: [kit-b, row-256, cap-01, cap-03, seal, sealVerdict, noteSeal, unsealed, context-io, compactor, tdd, no-grandfather, held-capture]

# Dependency graph
requires:
  - phase: 33-21
    provides: the human's KIT direction (b) at the decision checkpoint — the reader refuses non-sanctioned notes on read — carried as WINDOWS.md row 256
  - phase: 33-24
    provides: the one-spelling-authority context-io.ts this plan builds on (no edit of 33-24's arms undone), and the tap-flat trailer derivation for the RED gate
  - phase: 33-10
    provides: the immutable round-1 capture (c7be6d0d) whose nine path-B `Write`-tool notes are the S1/R2 fixture
provides:
  - "`NOTE_SEAL_KEY` / `NOTE_SEAL_RE` / `noteSeal` / `sealVerdict` exported from scripts/context-io.ts — one digest site, one predicate"
  - "`composeNote` emits `seal: sha256:<64 hex>` as the LAST line inside the fence; `id:` stays first"
  - "`NOTE_SKIP_ARMS` gains the reader-owned arm `unsealed`; `readRawNotesWithSkips` asks `sealVerdict` after `parseNote`; `render` counts it"
  - "the compactor's gate (c): every PROMOTED note through the imported `sealVerdict`; the raw thread tier exempt BY TIER"
  - "the nine hand-written notes of the held capture read as 0 records / 9 `unsealed`/`absent` (S1, R2); no grandfather clause proven against the last pushed sha's own writer (S4)"
  - "the contract's `seal` row + residual section, WF16 step-3 sentence, CHANGELOG Changed + Security, disposition row 33-25"
affects: [33-31, 33-32, 33-34, CAP-01, CAP-03, WINDOWS.md row 256, context-note contract, every consumer of readContext]

# Actuals (#2632) — same estimateTokens scale as the plan's `estimate` (chars/4 over the realized diff)
actuals:
  tokens: 29685
  tasks: 3
  commits: 5
plan_head_before: 5bc161a61de9d103a95033018aa44b6351180a7d

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Canonical form, not recognition: the seal line has ONE legal position (last inside the fence), ONE legal value shape (anchored sha256 + 64 hex), and ONE count; every other shape is `malformed`, never re-parsed"
    - "One predicate, imported: the second reader (the compactor) imports `sealVerdict` and computes nothing; R4 removes that one call in a mirror and proves the FAIL disappears with it"
    - "Derive the red set, disposition every member: the full suite run once after the reader change (35 reds) and once after the compactor gate (10 reds), each red classified and the sum stated"
    - "A test plant that must READ seals its raw bytes through the exported `noteSeal` with a one-line reason; a plant that must be REFUSED is planted unsealed — the two are now different fixtures"

key-files:
  created:
    - docs/audit/29-style-dispositions/33-25.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/compactor.ts
    - scripts/compactor.js
    - scripts/compactor.test.ts
    - scripts/context-io-writer-set.test.ts
    - scripts/capture-live.test.ts
    - scripts/trace-render.test.ts
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T090500Z-decision-a1b2c3d4.md
    - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T091000Z-decision-e5f6a7b8.md
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/contracts/context-note.md
    - agent-factory/workflows/16-context-read-write.md
    - CHANGELOG.md

key-decisions:
  - "No grandfather clause (costly, reversible): a note composed before the seal existed is refused on read like any other unsealed note, proven against the last pushed sha's own writer (S4: base reads 1, HEAD reads 0). Blast radius: the two committed board-snapshot fixture notes (re-sealed through `noteSeal`, derived index byte-identical) and every hand-planted test note (35 + 10 reds, each dispositioned)."
  - "The seal is verified over the parser's line-ending form (CRLF/CR normalised to LF): a note a checkout re-terminated still verifies, because the parser already reads both forms as one note; any character the parser sees moves the digest."
  - "Position is part of the canonical form: a `seal:` line anywhere but last inside the fence is `malformed`, because a seal moved above a `refs:` block changes what the parser reads while the digest stays valid."
  - "The unkeyed residual is stated, not hidden: the seal distinguishes hand-composed from writer-composed notes and detects post-write edits; a process that reimplements the algorithm is one register over. The un-forgeable point-of-effect tier is a human kit-capability decision not taken (T-33-118 accept)."
  - "The raw thread tier is exempt BY TIER, never by kind or author: `composeThreadNote` stays unsealed and the compactor asks the seal of promoted notes only."

patterns-established:
  - "Test planters carry a `sealed = true` default and an explicit unsealed arm, so 'the reader admits this' and 'the reader refuses this' are two plants, not one plant read two ways"

requirements-completed: [CAP-01, CAP-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "A note the sanctioned writer did not compose is REFUSED on read under a named, counted arm `unsealed`; the nine real hand-written notes of the held capture are the fixture (9 -> 0)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#S1 — the nine hand-written notes of the held capture (path B, `Write` tool) are REFUSED by name: 0 records, 9 `unsealed`/`absent`"
        status: pass
      - kind: other
        ref: "RED 45384b5d (AssertionError: expected 9 to be +0; check tdd-red-evidence -> RED_EVIDENCE_OK) precedes GREEN ba8ecc33"
        status: pass
    human_judgment: false
  - id: D2
    description: "The writer's own note reads exactly as before, with one `seal:` line last inside the fence; every mutation moves the verdict in the direction it must (mismatch / absent / mismatch / malformed / malformed)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#S2 and #S3"
        status: pass
    human_judgment: false
  - id: D3
    description: "No grandfather clause — a note the last pushed sha's own writer composed is refused by HEAD's reader (base 1 / HEAD 0); one emitter and one digest site derived from the AST"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#S4 and #S5 (emitters [\"composeNote\"], digesters [\"noteSeal\"])"
        status: pass
    human_judgment: false
  - id: D4
    description: "Six reader routes plus the compactor's promoted-tier walk give one answer about an unsealed note; the compactor asks the one predicate (mutation-proven); CAP-03 side (b) counts writer-composed notes only"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#R1, #R2, #CONTROL 2b (33-25); scripts/compactor.test.ts#R3 (control, RED-first, tier), #R4"
        status: pass
      - kind: other
        ref: "R3 RED 9d6eb703 (expected +0 to be 1; RED_EVIDENCE_OK) precedes GREEN 6d7f6462"
        status: pass
    human_judgment: false
  - id: D5
    description: "Committed twins, manifest, fixtures and the post-wave gate: build parity 69/69, manifest fresh (26 hashes), both fixture notes verify, full excluded-lane suite green once at the end"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes -> Test Files 78 passed (78), Tests 5389 passed | 2 skipped (5391), ALL CHECKS PASSED, exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The contract, WF16 and the changelog state the rule and its residual in clear voice; every document gate exits 0"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "npm run check:banned-claims / check:public-docs / check:claim-anchors / check:residual-citations / check:diff-disposition / check:imperative-lexicon / freshness -> each ALL CHECKS PASSED (or 'All build outputs fresh'), exit 0"
        status: pass
    human_judgment: true
    rationale: "Whether the residual paragraph in the contract and the CHANGELOG Security entry say what a human auditor needs — neither overclaiming (unkeyed) nor hiding the un-forgeable tier not taken — is a reading judgement the gates do not make."

# Metrics
duration: 57min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 25: The writer seals, the reader refuses — Summary

**Every note `scripts/context-io.ts` composes now carries a content-bound `seal:` line, last inside the fence; the one walk every reader goes through refuses a note without a matching seal under a new counted arm `unsealed`; the nine notes path B hand-wrote with the `Write` tool in the held round-1 capture — the notes 33-DIAGNOSIS § 1.3 (ii) measured `readContext` admitting — now read as 0 records and 9 `unsealed`/`absent` rows, from every reader route in the tree including the compactor's second walk, with no grandfather clause.**

## Performance

- **Duration:** 57 min
- **Started:** 2026-09-21T15:46:14Z
- **Completed:** 2026-09-21T16:43:21Z
- **Tasks:** 3 (Task 1 TDD, Task 2 TDD, Task 3 auto)
- **Files modified:** 16 (+1 created)

## Accomplishments

- **The mechanism, in one place each.** `noteSeal` (the ONE digest site: sha256 over `grugops-note-seal-v1`, a NUL byte, and the note's bytes without its seal line) and `sealVerdict` (the ONE predicate: exactly one column-0 `seal:` line, LAST inside the fence, anchored `sha256:` + 64 hex, recomputed THROUGH `noteSeal`). `composeNote` emits the line; `composeValidatedNote` validates the sealed bytes; `parseNote` needed no change (open scalar map).
- **The refusal, in the one walk.** `readRawNotesWithSkips` asks `sealVerdict` after `parseNote` succeeds and files `{ arm: "unsealed", detail: absent | malformed | mismatch }`; `render` reports it in `NOTE_SKIP_ARMS` order like the other arms. `NOTE_SKIP_ARMS` is now 6 (5 + `unsealed`); the arm docblock states the rule once.
- **The real fixture.** S1 reads the nine `Write` tool-use frames from the immutable commit (`git show c7be6d0d:…/33-CAPTURE-B.jsonl`, lines 774, 795, 817, 1542, 1607, 1638, 1757, 1779, 1802), asserts all nine parse (the premise), plants them under their three audit tasks, and reads **0** records with **9** `unsealed`/`absent` rows. On the dispatch base the same body read **9** (quoted below).
- **No grandfather clause, proven against the base's own writer** (S4): a note written by `9e1c1131`'s committed `scripts/context-io.js` reads **1** through that module and **0** through HEAD's, with one `unsealed`/`absent` row.
- **Six routes, one answer** (R1): `readContext` 1, `currentState` 1, `render` 1 note + 1 `unsealed`, `projectTaskState` 1, `trace-render` 1 row, `authorStamps` 1 stamp — one directory, one sealed and one unsealed note. `promoteAdmitted`'s destination-liveness read driven with an unsealed occupant (CONTROL 2b): not live, chokepoint refusal, bytes unchanged.
- **The second reader asks the same predicate** (R3/R4): the compactor's gate (c) imports `sealVerdict`; a hand-composed promoted note with all six load-bearing fields byte-equal is a `carve-out FAIL … is unsealed (absent)`; removing the one call in a mirror of the committed `.js` makes the FAIL disappear. `grep -a -c createHash scripts/compactor.ts` -> `0`.
- **CAP-03 side (b) sees the KIT change at zero tokens** (R2): the nine path-B notes alone -> `authorStamps` **0**, `capThreePredicate` -> `side (b): no live note exists under the target's context root, so no author stamp can be read`.
- **Every planted fixture derived and dispositioned** (tables below): 35 reds after the reader change, 10 after the compactor gate, sums stated.
- **The contract, WF16, the CHANGELOG and the disposition row** state the rule and the residual in clear voice; nine gates green on the committed tree.

## TDD record

### Task 1 — RED `45384b5d`, GREEN `ba8ecc33`

RED run on the dispatch base (`npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "33-25"`):

```
 × S1 — the nine hand-written notes of the held capture (path B, `Write` tool) are REFUSED by name: 0 records, 9 `unsealed`/`absent`
AssertionError: a hand-written note was returned as an admitted record: expected 9 to be +0
- Expected  0
+ Received  9
 × S2 … × S3 (mod.sealVerdict is not a function) … × S4 (HEAD's reader grandfathered a pre-seal note: expected [ {…(12)} ] to deeply equal []) … × S5 (expected [] to deeply equal [ 'composeNote' ])
 Tests  5 failed | 665 skipped (670)      exit 1
```

`gsd_run check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 5 / pass 0 / fail 5; the `# tests/# pass/# fail` trailer derived from the tap-flat `ok`/`not ok` lines, as 33-24 did, the derivation stated inside the record).

GREEN: `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "unsealed|seal"` -> `Tests 5 passed | 665 skipped (670)`, exit 0. Task 1 verify block, all green: `grep -a -c '"unsealed"' scripts/context-io.ts` -> `2`; the `node -e` probe -> `probe ok sha256:57106ca2…`, exit 0; `npm run build && npm run generate:hook-manifest && npm run check:build-parity && npm run freshness:hook-manifest` -> `Wrote hooks/hook-entry.ts manifest — 2 decider(s), 26 module hash(es)` / `PASS Build parity: … 0 findings over 69/69 elements` / `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.`

S4, quoted from the assertions that hold: base module `readContext` -> `[id]` (1 record; PREMISE), HEAD `readContext` -> `[]` (0), HEAD `render` -> `| <id>.md | unsealed | absent |`. S5, derived from the AST of `scripts/context-io.ts`: emitters `["composeNote"]`, digesters `["noteSeal"]`; `grep -rln grugops-note-seal scripts hooks install agent-factory` -> `scripts/context-io.ts`, `scripts/context-io.js` only.

### Task 2 — RED `9d6eb703`, GREEN `6d7f6462`

R3 RED on the base compactor (`npx vitest run --exclude '**/scripts/e2e/**' scripts/compactor.test.ts -t "33-25"`):

```
 ✓ R3 (control): a promoted note the WRITER composed passes the carve-out — the raw thread record is never asked for a seal (exempt by tier)
 × R3 (RED-first): a promoted note composed BY HAND — every load-bearing field byte-equal, no seal — is a carve-out FAIL naming the file and the word `unsealed`
AssertionError: the carve-out admitted a promoted note the writer did not compose: expected +0 to be 1
 × R3 (the thread tier stays raw) … × R4 (PREMISE: the anchor "const seal = sealVerdict(fields.text);" was not found exactly once …)
 Tests  3 failed | 1 passed | 207 skipped (211)      exit 1
```

`check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 4 / pass 1 / fail 3). GREEN: `scripts/compactor.test.ts` -> `Tests 211 passed (211)`.

REFACTOR: none needed on either task; no refactor commit.

## The derived red sets and their dispositions (Task 2)

**Set A — after Task 1's reader change, full excluded-lane suite once:** `Tests 35 failed | 5347 passed | 2 skipped (5384)`, exit 1. Thirty-five reds, each classified:

| Bucket | Count | Members and disposition |
|---|--:|---|
| (i) legitimate plant that must keep reading -> sealed through the exported `noteSeal` (raw bytes kept, reason in a comment) | 21 | `capture-live.test.ts` `contextRootWithNotes` (6 cases; gains `sealed = true` + an unsealed arm) · `trace-render.test.ts` `plantNote` (4; fixed `id:` the assertions key on) · `context-io-writer-set.test.ts` `seedShalessVerdict` (4; the emitter refuses a sha-less verdict since 31-01) · `context-io.test.ts`: deterministic-render plants (1), the 30-11 recognizer/impersonation plants (7; the writer refuses these spellings by construction), the legacy sha-less verdict (1), the 31-22 CONTROL 3 and 31-29 CONTROL 2 occupants (2; an unsealed occupant is not live and the route falls through to the chokepoint) — wait, that is 25; see the note below the table |
| (ii) adversarial plant that should now be refused -> asserts the `unsealed` arm | 0 | none of the 35 reds was a plant whose case expected refusal; the refusal cases are the NEW S1/S3/S4/R2/R3/CONTROL 2b |
| (iii) committed fixture file -> re-sealed | 0 | the two board-snapshot notes were not in the red set (their consumers read the derived `index.jsonl`); they are re-sealed regardless, below |
| (iv) expectation pins on the writer's output or the arm set that moved by design (not plants) | 10 | `context-io.test.ts` 31-01 byte-stability cases (6) -> `sealed(<pre-change fence>)`; `NOTE_SKIP_ARMS` pins 5 -> 6 (3: exact array, both-directions readerOwned `["unparseable","unsealed","vanished"]`, seeded-sixth premise); `compactor.test.ts` promote-equals-appendNote byte-compare (1) -> normalises the `seal:` line AFTER asserting each side's `sealVerdict` is `{ ok: true }` |

Correction to the (i) row, so the sum is exact: (i) = 6 + 4 + 4 + 1 + 7 + 1 + 2 = **25**; (iv) = 6 + 3 + 1 = **10**; (ii) = 0; (iii) = 0. **25 + 0 + 0 + 10 = 35**, the red count. The plan's three buckets did not fit ten of the reds — an expectation about the writer's own output is neither a plant nor a fixture — so a fourth bucket is stated rather than the ten being forced into (i).

**Set B — after the compactor's gate (c), `scripts/compactor.test.ts` once:** 10 reds, all bucket (i): faithful-set ACCEPT cases whose promoted plants were raw bytes — `goodPromotedSet` (2 cases: carve-out intact, dial invariance), the round-4 faithful FA body-only compaction (1), the six round-5 matrix cells where `confidence` is laundered under a normalised shape (trailing-whitespace / CRLF × finding / failed-attempt / observation = 6; the CRLF cells seal in CRLF), the round-6 round-trip (1). Each promoted plant is sealed AFTER the case's mutation, so every drop/launder case still refuses on the field. **10 = 10.**

**Fixture (iii), re-sealed regardless of red status.** Command (exact bytes preserved, the seal line inserted last inside the fence through the module's export):

```
node --input-type=module -e 'const m = await import(process.cwd()+"/scripts/context-io.js"); … for each notes/*.md: text.slice(0,fenceEnd) + `\n${m.NOTE_SEAL_KEY}: ${m.noteSeal(text)}` + text.slice(fenceEnd)'
sealed: 2026-09-14T090500Z-decision-a1b2c3d4.md { ok: true }
sealed: 2026-09-14T091000Z-decision-e5f6a7b8.md { ok: true }
```

A scratch re-render over the sealed notes (`node scripts/context-io.js render abc-104-implement <copy>`) produced `index.md` and `index.jsonl` byte-identical to the committed ones (`diff` exit 0 on both), so the board fixture's derived artifacts did not move. The Task 2 verify loop over both fixture files (`sealVerdict` per file) exits 0 with nothing printed.

**The writer set did not move.** `scripts/context-io-writer-set.test.ts` -> `Tests 195 passed (195)` (195 before this plan, 33-24's quote); `✓ the derived writer set has the expected MEMBERS` · `✓ the derived writer set has the expected COUNT` (5: admitAndAppend, appendNote, emitCheckpointNote, emitVerdict, promoteAdmitted). `noteSeal` and `sealVerdict` write nothing and are not in the derived closure to `writeNoteFile`.

## Task 2 verify block, quoted

```
npx vitest run --exclude '**/scripts/e2e/**' scripts/compactor.test.ts scripts/context-io-writer-set.test.ts scripts/board-read.test.ts \
  scripts/trace-render.test.ts scripts/convergence-spine.test.ts scripts/admission-server.test.ts scripts/capture-live.test.ts
 Test Files  7 passed (7)   Tests  678 passed (678)
   admission-server 46 · board-read 172 · capture-live 46 · compactor 211 · context-io-writer-set 195 · convergence-spine 2 · trace-render 6
grep -a -c 'sealVerdict' scripts/compactor.ts   -> 3
grep -a -c 'createHash'  scripts/compactor.ts   -> 0
for f in scripts/fixtures/board-snapshot/…/notes/*.md; do node -e "…sealVerdict…" "$f" || exit 1; done   -> exit 0, nothing printed
npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes
 Test Files  78 passed (78)   Tests  5389 passed | 2 skipped (5391)   Duration  495.32s   nul-bytes: ALL CHECKS PASSED   exit 0
npm run check:build-parity     -> PASS  Build parity: … 0 findings over 69/69 elements   ALL CHECKS PASSED
npm run freshness:hook-manifest -> Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.
```

`npm test` was not run.

## Task 3 — the documents, and the gates quoted

- `agent-factory/contracts/context-note.md`: the `seal` row in the provenance-fence table (writer-only; `sha256:` + 64 hex over the bytes without the line; last inside the fence; refused by every reader; counted under `unsealed` with the reason word), and a new section *The seal, and what it does and does not distinguish* — why it exists (the capture's nine notes), one emitter / one predicate / the compactor imports it, no grandfather clause, the unkeyed residual, the un-forgeable point-of-effect tier left to a human. The validator's four-required-fields rule is stated unchanged; the seal is a reader's rule.
- `agent-factory/workflows/16-context-read-write.md` step 3, one sentence: *A note written by any other route (a file-writing tool, a heredoc, an editor) is refused on read as `unsealed`.* The stop-condition bullet naming `context-io.ts` as the sanctioned writer is unchanged.
- `CHANGELOG.md` `[Unreleased]`: `### Changed` (the `seal` field) and `### Security` (the reader's refusal, the no-grandfather consequence for stores written before this version, the unkeyed residual and the tier not taken).
- `docs/audit/29-style-dispositions/33-25.md`: the one LANG-03 row the diff-disposition gate asked for.

```
npm run check:banned-claims        -> PASS banned claims: 0 findings over 120/120 elements        ALL CHECKS PASSED
npm run check:public-docs          -> PASS AUDIT-02: 11 public document(s) carry zero retired vocabulary   ALL CHECKS PASSED
npm run check:claim-anchors        -> PASS 47 registry row(s) … all byte-identical                  ALL CHECKS PASSED
npm run check:residual-citations   -> PASS residual citations: 5 path claim(s) across 2 published row(s)   ALL CHECKS PASSED
npm run check:diff-disposition     -> PASS diff disposition — changed watched file(s): 0 findings over 39/39 elements   ALL CHECKS PASSED
npm run check:imperative-lexicon   -> PASS sentence form — governed file(s): 0 findings over 49/49 elements   ALL CHECKS PASSED
npm run freshness                  -> All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.
node scripts/check-foundation-guards.js -> ALL CHECKS PASSED
grep -a -c 'seal' agent-factory/contracts/context-note.md -> 10 ; grep -a -c 'unsealed' 16-context-read-write.md CHANGELOG.md -> 1 / 1
```

## Hand-off to plan 33-34 — the two ledger rows it appends through the tool

Neither row is appended here (the ledger close is 33-34's). The rows, in the words 33-34 should carry:

1. **`deviation` / accepted residual — the unkeyed seal and the un-forgeable tier not taken.** `scripts/context-io.ts` `noteSeal` / `sealVerdict`: the seal is unkeyed by necessity (a file-based kit holds no secret the constrained process cannot read); it distinguishes hand-composed from writer-composed notes and detects post-write edits; a process that reimplements the algorithm is one register over. The un-forgeable tier — a point-of-effect deny of file-writing tools under `.grugops/context/` — is a kit capability decision left to the human (33-CONTEXT: no new factory capability). T-33-118, disposition `accept`.
2. **`deviation` / no-grandfather consequence for existing stores.** A store written by a kit version before the seal (any note composed before commit `ba8ecc33`'s module) is not read by this reader until re-admitted through the writer; every reader route reports the notes under `unsealed`/`absent`. Recorded as the costly decision in this plan; CHANGELOG `Security` names it. T-33-119, disposition `accept`.

Row 256 (KIT (b)) itself is not flipped here: the plan lands the kit change and decides nothing about the CAP-01 flip; whether the next capture's role agents reach the sanctioned writer on the spawn path is 33-32's go.

## Task Commits

1. **Task 1 RED** — `45384b5d` (test): S1-S5 failing; RED_EVIDENCE_OK
2. **Task 1 GREEN** — `ba8ecc33` (feat): seal block, `composeNote`, `unsealed` arm, the walk; `scripts/context-io.js`, `hooks/hook-entry.ts/.js`
3. **Task 2 RED + set-A dispositions** — `9d6eb703` (test): R3/R4 failing; the 35 reds dispositioned across five test files
4. **Task 2 GREEN** — `6d7f6462` (feat): compactor gate (c) + `scripts/compactor.js`; R1/R2/CONTROL 2b; set-B dispositions; the two fixtures re-sealed
5. **Task 3** — `28d0cfa7` (docs): contract, WF16, CHANGELOG, disposition row

**Plan metadata:** the final `docs(33-25)` commit (this SUMMARY, STATE, ROADMAP, REQUIREMENTS).

## Files Created/Modified

- `scripts/context-io.ts` — `NOTE_SEAL_KEY`, `NOTE_SEAL_RE`, `noteSeal`, `sealVerdict`, `SealVerdict`; `composeNote` seals; `NOTE_SKIP_ARMS` + `unsealed`; `readRawNotesWithSkips` asks the predicate; `createHash` imported
- `scripts/context-io.js`, `hooks/hook-entry.ts`, `hooks/hook-entry.js` — rebuilt twin and regenerated manifest
- `scripts/context-io.test.ts` — S1-S5, R1/R2, CONTROL 2b, the `sealed()` helper, 17 dispositioned sites
- `scripts/compactor.ts` / `.js` — gate (c) through the imported `sealVerdict`; `composeThreadNote` docblock states the tier exemption
- `scripts/compactor.test.ts` — R3 (×3) / R4, the `sealed()` helper (CRLF-aware), 6 dispositioned sites
- `scripts/capture-live.test.ts`, `scripts/trace-render.test.ts`, `scripts/context-io-writer-set.test.ts` — planters sealed through the export
- `scripts/fixtures/board-snapshot/…/notes/*.md` (2) — re-sealed
- `agent-factory/contracts/context-note.md`, `agent-factory/workflows/16-context-read-write.md`, `CHANGELOG.md` — the rule and the residual
- `docs/audit/29-style-dispositions/33-25.md` — created

## Decisions Made

See `key-decisions` above. Two design points the plan left open and this plan settled: (1) line-ending normalisation before hashing (the parser's own form, so a seal is never stricter than the parser about a difference the parser does not see); (2) position as part of the canonical form (a seal not last in the fence is `malformed`), for the `refs:`-block reason stated in `sealVerdict`'s docblock.

## Deviations from Plan

**1. [Rule 3 - Blocking] The WF16 sentence hit two gates and was rewritten twice**
- **Found during:** Task 3 (the post-wave suite red on `check-foundation-guards.test.ts` and `check-imperative-lexicon.test.ts` while my document edits landed mid-run; reproduced directly)
- **Issue:** the first draft named the route by tool token (`the \`Write\` tool`) on the same line as `.grugops/context/`, which `guard_context_writes` (SCTX-05) reads as a raw write — a false positive the guard errs safe on by design; the second draft (34 words) exceeded WP-02's 20-word procedural bound. The plan's action asked for the tool examples and the "never enters the verified context" clause in one sentence, which the two gates together do not permit.
- **Fix:** *A note written by any other route (a file-writing tool, a heredoc, an editor) is refused on read as `unsealed`.* — 18 words, generic route name; "never enters the verified context" is implied by "refused on read" and stated in full in the contract and the CHANGELOG.
- **Files modified:** agent-factory/workflows/16-context-read-write.md
- **Verification:** `node scripts/check-foundation-guards.js` -> ALL CHECKS PASSED; `check:imperative-lexicon` -> 0 findings over 49/49
- **Committed in:** 28d0cfa7

**2. [Rule 3 - Blocking] Two contract sentences over WP-03's 25-word bound and one bare demonstrative**
- **Found during:** Task 3 (`check:imperative-lexicon`: two `descriptive-sentence-too-long` findings on the `seal` row, one `bare-demonstrative-subject` in the residual section)
- **Fix:** the row split into five sentences (11 / 16 / 14 / 15 / 16 words); "That is a kit capability decision" -> "That tier is a kit capability decision"
- **Files modified:** agent-factory/contracts/context-note.md
- **Committed in:** 28d0cfa7

**3. [Rule 3 - Blocking] LANG-03 disposition row for the WF16 sentence**
- **Found during:** Task 3 (`check:diff-disposition` -> `16-context-read-write.md:31 (added) — no disposition row`, exit 1 — the same gate 33-24 met)
- **Fix:** `docs/audit/29-style-dispositions/33-25.md`, one row; gate -> `0 findings over 39/39 elements`
- **Committed in:** 28d0cfa7

**4. [Rule 1 - Bug] A fourth disposition bucket for reds that were not plants**
- **Found during:** Task 2 (deriving set A)
- **Issue:** ten of the 35 reds were expectation pins on the writer's own output (the 31-01 byte-stability formula, the promote-equals-appendNote byte-compare) or on the arm set's cardinality — neither a plant to seal, a plant to refuse, nor a fixture file. Forcing them into (i) would have made the equality read true while the classification read false.
- **Fix:** bucket (iv) stated, with its members and count; **25 + 0 + 0 + 10 = 35**.
- **Committed in:** 9d6eb703

**5. [Rule 1 - Bug] Two `await import` at `describe` scope**
- **Found during:** Task 2 (R1's route imports; vitest `PARSE_ERROR: await is only allowed … at the top levels of modules`)
- **Fix:** the three route modules imported at module level, beside the file's other top-level awaits
- **Committed in:** 6d7f6462

---

**Total deviations:** 5 auto-fixed (3 blocking, 2 bugs). **Impact:** all inside the plan's scope — the gates the plan itself listed as the ones the diff crosses, plus honest bookkeeping of the derived set. No scope creep; no platform conditional; no package installed; `node:crypto` only (T-33-SC).

## Issues Encountered

- The first post-wave run (started right after `6d7f6462`) went red on 43 tests because Task 3's document edits landed in the working tree while it ran — the foundation-guards and lexicon tests read the live tree. Re-run on the committed tree after `28d0cfa7`: `78 passed (78)`, `5389 passed | 2 skipped (5391)`, exit 0. The plan's "green once at the end" is that second run.
- `npm run check:build-parity` is red between an edited `.ts` and its commit by construction; green on each committed tree, as quoted.
- `git show c7be6d0d:` holds the capture at its original path (`33-CAPTURE-B.jsonl` directly under the phase directory); `round-1-held/` is the working-tree location 33-21 moved it to. The tests read the commit, as `capture-live.test.ts`'s `heldCapture` already did.

## Known Stubs

None. No placeholder values, no skipped tests added, no unrun `<verify>`. The two residuals (unkeyed seal; no grandfather clause) are decisions with dispositions, not stubs; they are handed to 33-34's ledger close above rather than appended here, per the plan.

## Threat Flags

None new beyond the plan's register. T-33-115/116/117 mitigated (S1/S3/R1/R3/R4 quoted); T-33-118 and T-33-119 accepted and stated in the module, the contract, the CHANGELOG and this hand-off; T-33-SC — no install. No new endpoint, auth path or schema; one new frontmatter key on a note the writer alone emits.

## Next Phase Readiness

- Plans 33-26 onward build on a reader that returns only writer-composed notes. Any future test that plants a note by hand must seal it through the export or expect `unsealed` — the `sealed()` helpers in `context-io.test.ts` and `compactor.test.ts` are the idiom.
- 33-32's go now measures whether the next capture's role agents REACH the sanctioned writer: a hand-written note no longer counts on CAP-03 side (b), so a path-B-shaped run will read `side (b): no live note …` rather than parity.
- 33-34 appends the two ledger rows above.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

- 17/17 files in `key-files` present on disk; 5/5 task commits found in `git log` (`45384b5d`, `ba8ecc33`, `9d6eb703`, `6d7f6462`, `28d0cfa7`); `commits: 5` measured from the ledger base `5bc161a61de9d103a95033018aa44b6351180a7d` (`git rev-list --count`), not narrated.
