---
phase: 32-board-projector-cli-dashboard
plan: 38
subsystem: testing
tags: [board-projector, presence-partition, contract-agreement, typescript-ast, cli-end-to-end, gap-closure]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "`presenceOf`/`presenceActual`'s `joinedStem` discriminator (commit dba9d72a, claimed to close review WR-01) and the spawned-CLI `drive()` harness in scripts/board-tracer.test.ts"
provides:
  - "An END-TO-END case on the spawned `--once --json` CLI proving one document cannot state two join states for one file, with the agreement DERIVED from the document rather than typed twice"
  - "`presenceActual`'s sentence-branch set derived from scripts/board-model.ts by TypeScript parse, pinned two-sided against one named input row per branch"
  - "A measured, written-down proof that the `joinedStem === undefined` branch is unreachable from any tree the reader can read, held as a derived invariant over `byStem` and `byId` rather than by deleting the branch"
  - "Two-directional set equality between agent-factory/contracts/board.md's presence table and the sentences the code produces, with the table located by its own heading and the row count derived"
  - "A dedicated `### The presence table` heading in the contract, so the table has a location a reader can anchor on"
affects: [32-39, 32-40, 32-41, board-projector verification round 4]

actuals:
  tokens: 19650
  tasks: 3
  commits: 4
plan_head_before: 069dcd9c661f7d2f3d054450ea4bb30c6b650721

tech-stack:
  added: []
  patterns:
    - "Derive a branch set from the module by TypeScript parse and pin it against the inputs that reach it — the set-literal-drift remedy applied to a sentence set"
    - "Assert an agreement by extracting one side's claim out of the artifact the run produced, never by comparing two hand-typed sentences"
    - "An unreachable branch is held by the derived invariant that forbids it, with a message naming what would make it reachable again — not deleted on the strength of an argument"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-38-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-38-GREEN-proof.txt
  modified:
    - scripts/board-tracer.test.ts
    - scripts/board-model.test.ts
    - scripts/board-dashboard.test.ts
    - scripts/validate.test.ts
    - agent-factory/contracts/board.md
    - .planning/phases/32-board-projector-cli-dashboard/deferred-items.md

key-decisions:
  - "The `joinedStem === undefined` branch is KEPT, not deleted: no tree the reader can read reaches it (measured), but the exported `presenceOf` against a directly-constructed `TicketPopulations` does, so it is the total handling of a declared `string | undefined`. The unreachability is asserted as a derived invariant over the two population maps."
  - "The contract's presence table describes what the READER can produce, so its row count is pinned against `derived branch count − branches proved unreachable from the reader` (6 − 1 = 5), with the unreachable partition itself asserted so it cannot be widened by hand."
  - "`agent-factory/contracts/board.md` gained a dedicated `### The presence table` heading. It had none — the nearest was `## Conflicts`, whose section also carries the conflict-kind table — so a heading-anchored reader had two tables to choose between."
  - "The contract's prose said `row-without-file` covers THREE facts while its table distinguished FOUR (dba9d72a added a row and left the count). Corrected to four, and the count is now derived from the parsed table rather than written down."
  - "`scripts/board-tracer.test.ts` added to `NOT_A_SECOND_AUTHORITY` (count 8 → 9) with its reason, read before it was exempted — the census's own intended mechanism, not a quiet narrowing."

patterns-established:
  - "Branch-count derivation: parse the module, expand every `return` expression (concatenation as a cross product, conditional as a union, `${...}` as a hole), THROW on an unrecognised shape so a branch cannot silently leave the set"
  - "Cross-field agreement: extract the claim from field A of the produced document, re-read field B through a TOTAL reader that returns a sentinel for anything it does not recognise, and compare the two"

requirements-completed: []  # DASH-03, DASH-05 and DASH-07 are DECLARED by this plan but deliberately NOT marked: the plan's own prohibition reserves that call for the round-4 verifier, and a premature flip already had to be reverted once in this phase.

coverage:
  - id: D1
    description: "A duplicate-identifier contest read through `node scripts/board-dashboard.js <tree> --once --json` produces one document whose `conflicts[]` entry for the loser and whose tickets `duplicate-id` read error state the SAME join state, with the agreement derived from the document rather than matched against a literal (DASH-03)"
    requirement: DASH-03
    verification:
      - kind: e2e
        ref: "scripts/board-tracer.test.ts#agrees with itself about the losing document: the conflict names the winner the read error named"
        status: pass
      - kind: e2e
        ref: "scripts/board-tracer.test.ts#NEGATIVE CONTROL: no contest on the tree means no duplicate-id read error and no row-without-file"
        status: pass
      - kind: other
        ref: "RED baseline: the same case against scripts/board-model.js at dba9d72a^ — exit 1, 1 failed of 84, the finding assertion naming both disagreeing sentences (32-38-RED-baseline.txt §4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every sentence branch `presenceActual` can produce is reached by a named input, with the branch count DERIVED from the module rather than counted by hand, so a seventh branch cannot ride in unproven (DASH-03)"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#derives the branch count by parsing `presenceActual`, and pins it against the audited rows"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#every derived branch is reached by a named input, and every named input reaches a derived branch"
        status: pass
      - kind: other
        ref: "Discrimination: a seventh branch planted in scripts/board-model.ts reds both cases (32-38-GREEN-proof.txt §A2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The winner of a contest, a lone document declaring an identifier that is not its stem, a refused document and a genuinely absent identifier each keep the sentence they had before this round, byte for byte"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#each audited branch says exactly what it said BEFORE this round (SAME, byte for byte)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The `joinedStem === undefined` branch is not left standing as an unreachable claim: its unreachability from the reader is asserted as a derived invariant over `byStem` and `byId` with a message naming what would make it reachable, and an input that DOES reach it through the exported API is exhibited"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#no tree the reader can read yields a `byStem` value absent from `byId`"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the branch IS still reachable through the exported `presenceOf`, so it is not dead code"
        status: pass
    human_judgment: false
  - id: D5
    description: "`agent-factory/contracts/board.md`'s presence table and `presenceActual`'s sentences are proved to state the same set, in both directions, with the table located by heading and the row count derived (D-04)"
    requirement: DASH-07
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#asserts SET EQUALITY IN BOTH DIRECTIONS between the table and the sentences the code produces"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#locates the table BY HEADING, and reds naming the heading when the section is absent"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#parses a NON-EMPTY, NON-SHORT table whose row count is DERIVED from the code's branch count"
        status: pass
      - kind: other
        ref: "Three discrimination runs — reverted consequence clause, deleted row, reverted prose count — each red, tree restored byte for byte (32-38-GREEN-proof.txt §B3-B6)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The golden snapshot fixture, the dashboard read-only guard, build parity and the kit structure validator are unmoved by this plan (DASH-05, DASH-07)"
    requirement: DASH-05
    verification:
      - kind: other
        ref: "node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json -> schemaVersion=2 conflicts=9, exit 0"
        status: pass
      - kind: other
        ref: "npm run check:dashboard-readonly -> 175 passed, exit 0"
        status: pass
      - kind: other
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness -> exit 0; VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js -> ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D7
    description: "Whether this closure is ENOUGH to move `32-VERIFICATION.md`'s DASH-03 truth from FAILED to VERIFIED — and whether a fifth bypass was created by this round's own work, as the per-round ratio in this repository's history would predict"
    verification: []
    human_judgment: true
    rationale: "This phase's recorded history is that a green suite and a careful self-review are not proof of a safety invariant: four prior rounds each shipped a defect created by the previous round's fix. Only an independent round-4 verifier reproducing against this tree can answer it, and this plan deliberately does not flip the requirement checkboxes or the phase status."

duration: 40 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 38: Round-4 gap closure — the duplicate-identifier contest measured through the CLI Summary

**The one gap round 3 left open is now proved closed on the surface the verifier measured it open: a spawned `--once --json` document whose `conflicts[]` and `readErrors` are asserted to agree about one file's join state by DERIVATION, plus a `presenceActual` branch set parsed out of the module and a contract table proved equal to the code in both directions.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-09-16T20:45Z (approx.)
- **Completed:** 2026-09-16T21:25Z (approx.)
- **Tasks:** 3
- **Files modified:** 6 modified, 2 created

## Accomplishments

- **The verifier's own reproduction is now a committed case on the spawned-CLI harness.** `scripts/board-tracer.test.ts` plants a real tree of the verifier's own shape — a board row for the LOSING stem, two documents contesting one identifier — drives `scripts/board-dashboard.js` through this file's `spawnSync` harness, and asserts the two fields agree. The agreement is DERIVED: the joined document's identity is extracted from the `duplicate-id` read error the run produced, and the `conflicts[]` sentence is then asked which document IT claims is joined, through a reader total over every arm `presenceActual` can state (anything else returns an `<unrecognised sentence>` sentinel). Three `PREMISE:`-messaged facts guard it — exit 0, stdout parsing IN ITS ENTIRETY as exactly one JSON document, and the `duplicate-id` read error present at all.
- **It discriminates the fix.** RED against `scripts/board-model.js` at `dba9d72a^`: exit 1, 1 failed of 84, the TARGET case failing on the finding assertion with both sentences printed, no PREMISE fired, negative control still green. GREEN at HEAD: 84 passed. Both transcripts are in `32-38-RED-baseline.txt`.
- **`presenceActual`'s six sentence branches are derived from the module, not recalled**, by TypeScript parse: every `return` expanded into the strings it can produce, concatenation as a cross product, a conditional as a union, `${...}` as a hole, and an unrecognised expression shape as a THROW. Six named input rows — five built from records `readTicketsSource` produced from a real tree — cover them, with set equality asserted in both directions and the count pinned as a NUMBER so an empty set and a silently short one both red. A planted seventh branch reds both assertions.
- **The `joinedStem === undefined` branch was decided by measurement.** No tree the reader can read reaches it, and the reason is structural: `ticketPopulations` fills `byStem` and `byId` in ONE loop over the SAME record list. That is now a derived invariant with two anti-vacuity PREMISE guards and a message naming the three changes that would make the branch reachable again. It is NOT deleted — the exported `presenceOf` against a directly-constructed `TicketPopulations` still reaches it — and the failed attempt to reach it from the reader is written down rather than replaced by an argument.
- **The contract and the code are proved equal in both directions.** The presence table is read at run time, located by a new `### The presence table` heading, bounded at the next heading of any level, normalised into templates, and compared as a set against the reader-producible branches. The row count is pinned against `derived branches − branches proved unreachable`. Three discrimination runs (reverted consequence clause, deleted row, reverted prose count) each red; the tree was restored byte for byte after each.
- **One genuine contract-vs-code disagreement was found and corrected.** The prose introducing the table said `row-without-file` "covers THREE different facts" while the table beneath it distinguished FOUR — `dba9d72a` added a row and left the count. The contract was wrong; the code was right. Corrected in the same commit as the assertion that found it, and the number is now derived from the parsed table.

## Task Commits

1. **Deviation (rule 3): narrow the `TicketAdmission` union at the four WR-02 assertion sites** — `d5486262` (fix)
2. **Task 1: end-to-end — one duplicate-identifier contest, one `--json` document, two fields that agree** — `30d631cd` (test)
3. **Task 2: every presence arm reached by a named input, branch count derived** — `d9d24635` (test)
4. **Task 3: the contract's presence table and the code's sentences proved equal** — `61d82343` (test)

_Note: no `feat(32-38)` commit exists. See TDD Gate Compliance below._

## Files Created/Modified

- `scripts/board-tracer.test.ts` — the duplicate-identifier-contest end-to-end case on the spawned CLI, plus its negative control and the total conflict-sentence reader
- `scripts/board-model.test.ts` — the TypeScript-parse branch derivation, the six named input rows, the unreachability invariant, the converse probe, and the contract-agreement block
- `scripts/board-dashboard.test.ts` — four `TicketAdmission` narrowings (deviation, rule 3)
- `scripts/validate.test.ts` — `board-tracer.test.ts` added to `NOT_A_SECOND_AUTHORITY` with its reason; the two-sided count 8 → 9
- `agent-factory/contracts/board.md` — a `### The presence table` heading, and the prose fact-count corrected from three to four
- `.planning/phases/32-board-projector-cli-dashboard/32-38-RED-baseline.txt` — clean-tree record, both CLI transcripts, the failing-case transcript, the three premise facts, the per-arm before-image, the B3 reachability attempt, the converse probe
- `.planning/phases/32-board-projector-cli-dashboard/32-38-GREEN-proof.txt` — the derived branch set, the seventh-branch discrimination, the six-row SAME/CHANGED verdict table, the B3 outcome, the agreement table, three discrimination runs, and every gate result
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — three carried items

## Decisions Made

See `key-decisions` in the frontmatter. In short: the unreachable branch is held by the invariant that forbids it rather than deleted; the contract table's row count is derived from the reader-producible branch partition rather than written down; the contract gained a heading so its table has an anchor; and the census exemption for `board-tracer.test.ts` was recorded as a decision with its reason, which is what that registry is for.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npm run typecheck` exited 2 at HEAD before any of this plan's work**

- **Found during:** Task 1 (before the RED measurement could be recorded)
- **Issue:** Four `TS2339` errors in `scripts/board-dashboard.test.ts`: `refusal.code` and `refusal.reason` read off a `TicketAdmission` union without narrowing on `ok`, with `refusal.reason as string` asserting past the union. Pre-existing at HEAD `069dcd9c` (the file is untouched by this plan otherwise) and introduced by the WR-02 fix commits. Task 2's `<verify>` runs `npm run build && npm run typecheck && npm run check:build-parity` and could not have reached exit 0 with this standing.
- **Fix:** Narrowed with this file family's own idiom (`x.ok === false ? x.code : ""`), which also makes the assertion honest — an unexpected admission now compares `""` against the expected code and reds, where the cast would have thrown on `undefined`.
- **Files modified:** `scripts/board-dashboard.test.ts`
- **Verification:** `npm run typecheck` exit 0; `scripts/board-dashboard.test.ts` 71 passed
- **Committed in:** `d5486262`

**2. [Rule 3 - Blocking] Task 1's fixture tipped `scripts/board-tracer.test.ts` into the ticket-frontmatter-reader census**

- **Found during:** Task 3 (the first full-suite run — 3 failed of 5153)
- **Issue:** `scripts/validate.test.ts`'s census names a file a carrier when it names BOTH ticket key spellings and reaches a text-scanning primitive. `board-tracer.test.ts` already named `column` (a WIP-count test DESCRIPTION at line 114) and already scanned text; Task 1's `status: ready\ncolumn: Backlog` fixture supplied the missing spelling and completed the conjunction, making the census report two carriers where its contract says one.
- **Fix:** Added `board-tracer.test.ts` to `NOT_A_SECOND_AUTHORITY` with its one-line reason and moved the two-sided `NOT_A_SECOND_AUTHORITY_COUNT` 8 → 9 — that registry's own documented mechanism ("that judgment belongs here with its reason"). The file plants ticket documents as fixture TEXT and reads every ticket field out of the `--json` document the one grammar produced; the same judgment is already recorded for `board-model.test.ts` and `board-read.test.ts`. It was read before it was exempted. The alternative — trimming `status:`/`column:` out of the fixture to slip under the census — was rejected as gaming the instrument.
- **Files modified:** `scripts/validate.test.ts`
- **Verification:** `scripts/validate.test.ts` 130 passed, including the converse cases (`with NO plant, the carrier count is exactly one` and the ADJACENCY case) that prove the census still discriminates
- **Committed in:** `61d82343`
- **Standing risk, recorded not hidden:** a genuine second ticket-frontmatter reader placed inside `board-tracer.test.ts` would now be invisible to the census. Logged in `deferred-items.md`.

**3. [Rule 2 - Missing Critical] The contract's prose miscounted its own table**

- **Found during:** Task 3
- **Issue:** `agent-factory/contracts/board.md` said `row-without-file` "covers three different facts" while the table directly beneath it distinguished four — `dba9d72a` added the loser row and left the count. D-04 makes this document normative, so a miscount is a wrong answer carrying the authority of a spec.
- **Fix:** Corrected to "four", and the number is now DERIVED: the suite counts the conflict-raising rows in the parsed table and requires the prose to name that number in words (whitespace-normalised, because the sentence wraps).
- **Files modified:** `agent-factory/contracts/board.md`, `scripts/board-model.test.ts`
- **Verification:** reverting the count reds the assertion with the expected number printed (`32-38-GREEN-proof.txt` §B5)
- **Committed in:** `61d82343`

**4. [Structural, required by the plan's own instruction] The presence table had no heading to be located by**

- **Found during:** Task 3
- **Issue:** The plan requires the table be located by its heading. The nearest heading above it was `## Conflicts`, whose section also carries the seven-kind conflict table, so a heading-anchored reader had two tables to choose between — and one searching to end-of-file had several more, which is the Phase 29 bypass shape the plan names.
- **Fix:** Added `### The presence table` with a short paragraph naming the suite that reads it. The reader finds the heading by exact text and bounds the span at the next heading of any level; both the absence throw and the bound are asserted against synthetic documents.
- **Files modified:** `agent-factory/contracts/board.md`, `scripts/board-model.test.ts`
- **Verification:** `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` → ALL CHECKS PASSED; `check:diff-disposition` finding count identical with and without the edit (78/39 both ways)
- **Committed in:** `61d82343`

---

**Total deviations:** 4 (2 blocking, 1 missing-critical, 1 structural)
**Impact on plan:** Two were pre-existing blockers this plan's own verification could not clear around; one was a genuine contract defect of the exact class the plan exists to close; one was required by the plan's own "locate the table by its heading" instruction. No scope creep — `scripts/board-model.ts` and `scripts/board-model.js` were not touched at all.

## TDD Gate Compliance

| Gate | Commit | Status |
|---|---|---|
| RED | `30d631cd`, `d9d24635`, `61d82343` (`test(32-38)`) | Present — and each carries its own intentional-RED evidence |
| GREEN | — | **No `feat(32-38)` commit exists.** |
| REFACTOR | — | Not applicable |

**Why there is no GREEN commit, stated rather than glossed.** This is a gap-closure plan whose subject is a fix ALREADY on the tree (`dba9d72a`). The plan's own artifact table marks `scripts/board-model.ts` "possibly changed — only if the arm audit proves a change warranted". The audit did not: every branch is reached by a named input or proved unreachable-from-the-reader-but-reachable-by-direct-construction, and every sibling sentence is unchanged. So the RED/GREEN pair is inverted in time — the production code is the GREEN state, and RED is measured by reverting it:

- Task 1's RED is `scripts/board-model.js` at `dba9d72a^`: exit 1, the target case failing on the finding assertion, no PREMISE fired, negative control green, exactly one test failed. Restored clean.
- Task 2's RED is a seventh branch planted in `scripts/board-model.ts`: both new assertions red, with the count and the set both naming the discrepancy. Restored clean.
- Task 3's RED is three contract mutations: a reverted consequence clause, a deleted row, a reverted prose count. Each red, each naming what moved. Restored byte for byte.

Every one of those is a TARGET assertion failing for the planned reason, not a syntax error, a zero-test discovery or an unrelated failure. Transcripts: `32-38-RED-baseline.txt` §4 and `32-38-GREEN-proof.txt` §A2, §B3–B5.

## Issues Encountered

- **The first full-suite run came back red (3 failed of 5153)** on the ticket-frontmatter-reader census. Diagnosed to Task 1's fixture text and resolved through the census's own exemption registry rather than by trimming the fixture. See deviation 2.
- **Two of the plan's verification lines name instrument values that were already stale**, both stated in `32-38-GREEN-proof.txt` §B8 rather than quietly worked around:
  - `node scripts/validate-agent-factory.js` exits 1 on any tree (`VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`); CI invokes it as `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`, under which it is green with zero FAIL lines.
  - `check:dashboard-readonly` is 175 passed, not the 171 the plan carried from `32-VERIFICATION.md`'s round-3 measurement; the CR-01 fix (`d276f4e3`, after that verification) added four cases. This plan touched neither that file nor the dashboard import closure.
  - A third: the `check:build-parity` `<fails_when>` clause "`BUILD PARITY FAILED` in the output" matches npm's own echo of the script definition on a PASSING run. The discriminating signals are exit 0 and the emitted success line.
- **`npm run check:diff-disposition` still exits 1** with 78 findings over 39 elements — measured on this tree both with and without this plan's contract edit, identically. Every finding is in `agent-factory/roles/` and `agent-factory/workflows/` files this plan did not touch, and `agent-factory/contracts/board.md` is not in the LANG-03 watched corpus. Pre-existing, out of scope, carried in `deferred-items.md`.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-tracer.test.ts` | exit 0, 84 passed, no `PREMISE:` message |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts` | exit 0, 153 passed |
| `node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json` | `schemaVersion=2 conflicts=9`, exit 0 — the golden fixture did not move |
| `grep -c PREMISE 32-38-RED-baseline.txt` | 7 (≥ 3) |
| `grep -c 'SAME\|CHANGED' 32-38-GREEN-proof.txt` | 9 (≥ 5) |
| `npm run build && npm run typecheck && npm run check:build-parity` | exit 0, "no tracked build output moved when tsc ran" |
| `npm run freshness` | exit 0, 65/65 committed `.js` fresh |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0, ALL CHECKS PASSED, 0 FAIL lines |
| `npm run check:nul-bytes` | exit 0, ALL CHECKS PASSED |
| `npm run check:dashboard-readonly` | exit 0, 175 passed (unchanged by this plan) |
| `npm run check:public-docs / banned-claims / claim-anchors / imperative-lexicon / audit-register / residual-citations` | exit 0 each |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0, **75 files, 5151 passed, 2 skipped** (above the 5137 floor) |
| `npm test` | **NOT RUN** — the live claude-CLI e2e lane stays `UNKNOWN - verify` |
| `npm run check:diff-disposition` | exit 1, 78 findings / 39 elements — **pre-existing**, identical with and without this plan's edits |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans `32-39` (IN-01, the `admitted-under-its-stem` naming defect), `32-40` and `32-41` remain. `TICKET_PRESENCE_KINDS`'s member spellings were deliberately not touched here, as `32-38`'s own artifact note requires.
- **Requirement checkboxes and the ROADMAP phase status were deliberately NOT flipped.** The plan's prohibition reserves that for the round-4 verifier, and a premature flip already had to be reverted once in this phase.
- **The standing caution, restated:** this phase's four prior rounds each shipped a defect created by the previous round's fix, and the per-round ratio has never fallen. A green suite and a careful self-review are not proof. This plan's own work is a candidate for that pattern — in particular the new census exemption, the new contract heading, and the sentence-template normaliser shared by Tasks 2 and 3 are the three surfaces a round-4 reviewer should probe first.
- This is the LAST round the four-round gap-closure cap allows for Phase 32.

## Self-Check: PASSED

Files claimed created/modified — all found on disk:
```
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-38-RED-baseline.txt
FOUND: .planning/phases/32-board-projector-cli-dashboard/32-38-GREEN-proof.txt
FOUND: scripts/board-tracer.test.ts
FOUND: scripts/board-model.test.ts
FOUND: scripts/board-dashboard.test.ts
FOUND: scripts/validate.test.ts
FOUND: agent-factory/contracts/board.md
```
Commits claimed — all found in `git log`: `d5486262`, `30d631cd`, `d9d24635`, `61d82343`.
Commit count MEASURED, not narrated: `git rev-list --count 069dcd9c..HEAD` = 4.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*
