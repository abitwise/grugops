---
phase: 32-board-projector-cli-dashboard
plan: 12
subsystem: testing
tags: [typescript, vitest, ast, board-grammar, validator, ticket-frontmatter]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "parseTicketDocument, TICKET_KEYS and the six TICKET_REFUSAL_CODES (plan 32-05); the D-06 board-grammar extraction and its byte-identical message pin (plan 32-08)"
provides:
  - "One ticket-frontmatter reader in the tree: `parseTicketDocument` in scripts/board-model.ts, with the validator's own `^column:`/`^status:` regex pair deleted"
  - "checkTickets() routed through the grammar: a refused document is reported by refusal CODE and its column/status rules are not evaluated against a guess"
  - "A new published validator surface: `<path>: refused by the ticket grammar (<code>): <reason>`"
  - "Three disagreement fixture repositories with a recorded before-and-after table (bad-ticket-body-column, bad-ticket-no-region, bad-ticket-duplicate-key)"
  - "TICKET_FRONTMATTER_READER_COUNT — a two-sided census over a recursive glob of scripts/*.ts, with a discrimination case that plants the deleted reader"
  - "A board-model.ts docblock that states what is true on the tree in the present tense"
affects: [board-projector, validator, dashboard, phase-32-verification]

actuals:
  tokens: 41000
  tasks: 3
  commits: 4
plan_head_before: 839cbe33a280ac34d95eabcc5c16e846cbcea489

tech-stack:
  added: []
  patterns:
    - "Census over a RECURSIVE directory listing taken at test time, cross-floored against `git ls-files`, with a discrimination case that plants the removed code and watches the derivation fire"
    - "An analyzer that consumes a parsed AST rather than document text, so the census cannot name its own file"

key-files:
  created:
    - scripts/fixtures/bad-ticket-body-column/
    - scripts/fixtures/bad-ticket-no-region/
    - scripts/fixtures/bad-ticket-duplicate-key/
    - .planning/phases/32-board-projector-cli-dashboard/32-12-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-12-GREEN-proof.txt
  modified:
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/validate.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "The body-match fixture carries a well-formed frontmatter region with NO `column:` key, because the plan's literal construction (region names one column, body names another) could not isolate the disagreement: the deleted reader's `/^column:/m` returns the FIRST match in document order, which is the region's own line, so both readers would have agreed and the fixture would have measured nothing."
  - "A document the grammar refuses gets its refusal reported and NEITHER ticket rule evaluated — a value read out of a refused document is a guess, and a guess is not a thing to validate a board against (D-07)."
  - "The census scans scripts/ RECURSIVELY. A depth-one glob would leave a second reader placed in scripts/runnable-ref/ or scripts/e2e/ invisible."
  - "The census analyzer takes a parsed ts.SourceFile rather than document text, so it is not itself a string-parameter function reaching both ticket keys and cannot name its own file."
  - "The docblock's single-authority claim is stated in the present tense AND delegated to the census, rather than asserted — an assertion about the tree in a comment is exactly what CR-06 found to be false."

patterns-established:
  - "Derive the scanned set from the disk, floor the denominator against an independently derived set (git's index), then claim the count — a census over an empty glob reports one-of-nothing as success."
  - "Every derived-set census ships with a discrimination case planting the exact code it exists to catch, measured to fire on both arms."

requirements-completed: [DASH-01, DASH-02]

coverage:
  - id: D1
    description: "Exactly one ticket-frontmatter reader exists in scripts/, proven by a census derived from a recursive glob rather than a hand-typed file list, pinned two-sided and naming the carrier file"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#TICKET_FRONTMATTER_READER_COUNT is 1, and the carrier is scripts/board-model.ts"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#the scan is non-vacuous: the glob found files, and every tracked scripts/*.ts is among them"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#goes RED on the deleted reader: both arms fire on the exact source that was removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "checkTickets() reads a ticket's column and status through parseTicketDocument; a document the grammar refuses is reported by refusal code rather than silently half-read"
    requirement: DASH-01
    verification:
      - kind: e2e
        ref: "scripts/validate.test.ts#NO REGION: a document with no frontmatter is refused by code, not read anyway"
        status: pass
      - kind: e2e
        ref: "scripts/validate.test.ts#DUPLICATE KEY: two values for one key are refused, not silently halved"
        status: pass
      - kind: e2e
        ref: "scripts/validate.test.ts#BODY MATCH: prose and fenced `column:` lines no longer decide the verdict"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#pins the refusal message's shape: path, code, and the grammar's own reason"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two published board-vs-ticket message strings survive the cutover byte-identically, with their pin unedited"
    requirement: DASH-02
    verification:
      - kind: e2e
        ref: "scripts/validate.test.ts#keeps both board↔ticket messages byte-identical through the extraction"
        status: pass
      - kind: other
        ref: "git diff 839cbe33 -- scripts/validate.test.ts (no change inside that case body)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three disagreement fixtures with a recorded before-and-after table: a column line in the prose or a fenced body, a document with no frontmatter region, and a duplicated key"
    requirement: DASH-01
    verification:
      - kind: e2e
        ref: "scripts/validate.test.ts#each deliberately-broken fixture still fails for EXACTLY its own reason (Pitfall 3) — the three new INTENT rows"
        status: pass
      - kind: other
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-12-RED-baseline.txt and 32-12-GREEN-proof.txt"
        status: pass
    human_judgment: false
  - id: D5
    description: "No docblock in scripts/board-model.ts states a fact about the tree that is false on the tree — the false claim that plan 32-08 deleted the second pair is corrected"
    requirement: DASH-01
    verification: []
    human_judgment: true
    rationale: "The census mechanically confirms the ONE claim it was built for (the reader count). The docblock's remaining claims — that CANONICAL_SCHEMA carries no ticket key, that AdmitOptions can only narrow, that board-model.ts imports nothing, that this kit's configured `In Security/NFR` column carries a `/` — were each re-read against the tree during Task 3 and each holds, but no automated gate asserts them. A human should re-read the block rather than trust this line."
  - id: D6
    description: "The deviation the cutover introduces is recorded in the contract: a ticket with no frontmatter region becomes an error where it was previously ignored"
    requirement: DASH-02
    verification:
      - kind: other
        ref: "agent-factory/contracts/board.md § Ticket documents"
        status: pass
    human_judgment: true
    rationale: "That the recorded sentence is the RIGHT posture for an installed repository whose gate will newly red on first upgrade is a judgment (T-32-12-04, disposition `accept`), not something a test can decide."

duration: ~30 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 12: Close CR-06 — one ticket-frontmatter reader, and a docblock that is true

**The validator's own `^column:`/`^status:` regex pair is deleted and `checkTickets()` now asks `parseTicketDocument`, so a ticket's column is what its frontmatter region says and nothing else — pinned by a census over a recursive glob of `scripts/*.ts` that names the one carrier and goes red on the reader that was removed.**

## Performance

- **Duration:** ~30 min (floor: 24m 49s measured from the first instrumented command at 00:37:19 to 01:02:08 local; the preceding file reads are not instrumented, so the figure is a floor rather than a stopwatch reading)
- **Started:** 2026-09-14T21:37Z (approximate — see above)
- **Completed:** 2026-09-14T22:02:08Z
- **Tasks:** 3
- **Files modified:** 170 changed paths (11 hand-authored; the remaining 159 are the boilerplate kit copies inside the three new fixture repositories)

## Accomplishments

- **Measured the disagreement before deleting anything.** Three fixture repositories, one per point where the two readers answered differently, with both readers' answers on all three documents recorded in `32-12-RED-baseline.txt`. Every row of that table differs — a baseline where they agreed would have meant the fixtures measured nothing.
- **Deleted the second spelling.** `frontMatter()` and its `FrontMatter` interface are gone from `scripts/validate-agent-factory.ts` — no wrapper, no re-export, no commented-out copy. `grep` for either of the two patterns over the comment-stripped source returns 0.
- **Routed `checkTickets()` through the grammar.** A refused document is reported as `<path>: refused by the ticket grammar (<code>): <reason>` and its column and status rules are NOT run, because a value read out of a refused document is a guess (D-07).
- **All three verdicts moved, and one moved toward exit 0.** `bad-ticket-body-column` 1 → 0 (prose and fenced `column:` lines stopped deciding anything); `bad-ticket-no-region` 0 → 1 (`no-opening-delimiter`); `bad-ticket-duplicate-key` 0 → 1 (`duplicate-key`). A cutover measured only by "more things fail now" would have missed the first.
- **Derived the single-authority claim instead of grepping it.** A census over 150 `.ts` files found recursively at test time, with two AST arms, pins `TICKET_FRONTMATTER_READER_COUNT` at 1 and asserts the carrier is `scripts/board-model.ts` by name. The scanned count is floored against `git ls-files scripts/*.ts` before the count-of-one is claimed, and a discrimination case plants the deleted reader's exact source and asserts both arms fire on it.
- **Made the docblock true.** `scripts/board-model.ts` no longer promises a future commit. It names the plan that performed the deletion in the present tense, names CR-06 as what caught the false claim, and cites the census as what holds the claim now.
- **The two published messages are byte-identical and their pin is unedited.** Verified by `git diff` showing no change inside that case body.

## Task Commits

1. **Task 1: measure the disagreement** — `79f9eb8b` (test)
2. **Task 2 RED: flip the three cases to the grammar's answer** — `32ab9222` (test) — 7 failed / 99 passed against the unchanged validator, each failure on the target assertion
3. **Task 2 GREEN: the cutover** — `7f1c6131` (feat)
4. **Task 3: the census and the docblock** — `10fc3b34` (test)

No REFACTOR commit: no cleanup presented itself that the GREEN edit had not already taken.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `32ab9222` `test(32-12)` | Pass — 7 failed / 99 passed, every failure the target assertion (exit 1 vs 0, 0 vs 1, and the absent refusal message), no load or syntax error |
| GREEN | `7f1c6131` `feat(32-12)` | Pass — 199 passed across validate.test.ts + board-model.test.ts |
| REFACTOR | — | Not taken (optional gate) |

Task 1's commit is also a `test(...)` commit but is not a RED gate: its cases assert the PRE-cutover behaviour and passed against the unchanged validator by design, which is what makes Task 2's flip a visible change of answer.

## Files Created/Modified

- `scripts/validate-agent-factory.ts` / `.js` — the local `frontMatter()` reader and its `FrontMatter` interface deleted; `parseTicketDocument` added to the existing `./board-model.js` import; `checkTickets()` branches on the admission
- `scripts/board-model.ts` / `.js` — the ticket-document docblock's closing paragraph rewritten in the present tense against the tree
- `scripts/validate.test.ts` — three disagreement cases at their post-cutover answers, the refusal-message pin, three INTENT rows, the four derived fixture-set pins moved, and the single-authority census with its discrimination case
- `scripts/fixtures/bad-ticket-body-column/` — a `column:` line in the prose body and a second inside a fenced block, with a region that names no column
- `scripts/fixtures/bad-ticket-no-region/` — plain markdown with two key lines and no delimiter anywhere
- `scripts/fixtures/bad-ticket-duplicate-key/` — a region naming `column` twice with different values
- `agent-factory/contracts/board.md` — § Ticket documents records what the validator now does with a refused document
- `.planning/phases/32-board-projector-cli-dashboard/32-12-RED-baseline.txt`, `32-12-GREEN-proof.txt`

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: the body-match fixture could not be built the way the plan described it, because the deleted reader's `.match()` returns the FIRST `^column:` in document order and that is the frontmatter region's own line — so a fixture whose region names a column would have had both readers agreeing. The fixture instead carries a well-formed region with no `column:` key, which is the actual shape in which body text can win.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The body-match fixture as the plan described it would have measured nothing**
- **Found during:** Task 1
- **Issue:** The plan specified "a well-formed frontmatter region naming one column, plus a later line in the prose body … that names a DIFFERENT column", expecting the unbounded reader to answer with "whichever of the three it finds first". In document order the first `^column:` line IS the region's own, so both readers would have returned the same value and the fixture would have isolated no disagreement. The plan's own guard names this outcome as unacceptable ("otherwise the fixture measures nothing").
- **Fix:** The fixture's region is well formed (`id`, `title`, `status`) and deliberately carries no `column:` key; the prose body carries one and a fenced block carries a second. The unbounded reader answers `Phantom Column` from the prose; the grammar answers `column: null`. Verdicts differ (1 vs 0) and both are recorded.
- **Files modified:** `scripts/fixtures/bad-ticket-body-column/plans/tickets/ABC-001.md`
- **Verification:** `32-12-RED-baseline.txt` row 1 — the two columns differ; the post-cutover verdict flip 1 → 0 is in `32-12-GREEN-proof.txt`
- **Committed in:** `79f9eb8b`

**2. [Rule 3 - Blocking] The plan's validator verify commands cannot pass as written**
- **Found during:** Task 1
- **Issue:** `node scripts/validate-agent-factory.js` exits 1 on this repository regardless of any code change: `VALIDATE_KIT_ROOT` has NO default by deliberate design (the C3 "no fallback beats a sensible default" override), so the bare form errors with `VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.'`.
- **Fix:** Used the form the repository's own self-test uses — `VALIDATE_KIT_ROOT="$PWD" node scripts/validate-agent-factory.js` — bare and `--strict`. Both exit 0.
- **Files modified:** none (a verification-procedure correction)
- **Verification:** recorded with its reason in `32-12-GREEN-proof.txt` §3
- **Committed in:** `10fc3b34` (the proof file)

**3. [Rule 2 - Missing Critical] Four derived fixture-set pins had to move with the disk**
- **Found during:** Task 1
- **Issue:** Adding three fixture repositories reddened four existing derived pins the plan's artifact list did not name: `FIXTURE_REPOS.length` (8), `FIXTURE_CONFIG_DIRS.length` (9), the `INTENT` intent table's two-sided equality against the discovered set, and the retired-key sweep's surface count. These are the repository's set-literal-drift guards working exactly as intended.
- **Fix:** Moved each deliberately with its reason recorded in a comment — 8 → 11, 9 → 12, three new INTENT rows carrying the pre-cutover answers (flipped to the post-cutover answers in Task 2), and the sweep's title and floor.
- **Files modified:** `scripts/validate.test.ts`
- **Verification:** `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts` — 105 passed at Task 1
- **Committed in:** `79f9eb8b`

**4. [Rule 2 - Missing Critical] The census scans recursively, not depth-one**
- **Found during:** Task 3
- **Issue:** The plan said the census "globs every `.ts` file under `scripts/`" and named the pattern `scripts/*.ts`. A depth-one listing misses `scripts/runnable-ref/` and `scripts/e2e/`, so a second reader placed in either would sit outside the scanned set with nothing going red — the same shape as the drift the census exists to prevent.
- **Fix:** `readdirSync(..., { recursive: true })`, and the scanned set is floored against `git ls-files scripts/*.ts` (git's pathspec glob matches across `/`), so a tracked TypeScript file the census never opened is an explicit failure naming the file.
- **Files modified:** `scripts/validate.test.ts`
- **Verification:** the census reports 150 scanned files; the depth-one form reported 124 and failed the tracked-set floor with `runnable-ref/uat-spec-integrity.ts` among the unscanned
- **Committed in:** `10fc3b34`

---

**Total deviations:** 4 auto-fixed (1 bug, 1 blocking, 2 missing-critical)
**Impact on plan:** No scope creep. Deviation 1 changed a fixture's construction to make it measure what the plan said it must measure; deviation 4 widened the census's own denominator, which strengthens rather than relaxes the claim. Nothing in the plan's success criteria was weakened.

## Issues Encountered

- `scripts/board-dashboard.test.ts` carries a case asserting `git status --porcelain scripts/fixtures` is empty (the plan-32-05 golden is a byte-for-byte function of the committed fixture tree). Three untracked fixture directories reddened it mid-run; committing them resolved it. Nothing to fix — the case behaved correctly and is the reason the fixtures had to be committed in the same task that added them.
- The plan's Task 2 acceptance grep `grep -c 'text.match(/\^column'` returns 0 as required; recorded here because a pattern that returns 0 both when the code is gone and when the pattern never matched anything is only meaningful against the Task-1 baseline, where the same grep over the pre-cutover file returned 1.

## Known Stubs

None. No placeholder values, no `TODO`/`FIXME`, no skipped tests added. The suite's 2 skipped tests are pre-existing and out of this plan's scope.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. The one new surface — the refusal error message — emits the grammar's own reason sentence, which quotes at most the first 60 characters of a ticket line already readable by anyone who can read the repository.

Threat-register dispositions honoured: T-32-12-01 (two readers) closed by the deletion plus the census; T-32-12-02 (body text setting a column) closed and pinned by `bad-ticket-body-column`; T-32-12-03 (the false docblock) closed by the rewrite plus a re-check of every remaining claim in the block; T-32-12-04 (a newly-red gate on first upgrade) accepted per plan, with the refusal naming its code and the contract recording the deviation.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts scripts/board-model.test.ts` | 203 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` (whole suite, no live e2e lane) | 74 files, **4767 passed / 2 skipped** |
| `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js` | exit 0 |
| `VALIDATE_KIT_ROOT=$PWD node scripts/validate-agent-factory.js --strict` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build && npm run check:build-parity` | "Build parity: no tracked build output moved when tsc ran." |
| `npm run check:banned-claims` | ALL CHECKS PASSED |
| `npm run check:claim-anchors` | ALL CHECKS PASSED |
| `git diff 839cbe33 -- scripts/validate.test.ts` | no change inside the byte-identical message case body |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CR-06 is closed in both halves: the second reader is deleted and the docblock that claimed otherwise now states what is true and delegates the claim to a derived census.
- The other three phase-32 verification gaps are NOT touched by this plan and remain open: CR-01 (the DASH-06 read-only guard bypassed by a namespace destructure), and the `board-read.ts` pair — `listDirectoryBounded` collapsing EACCES into "absent", and `readVerifyReread` conflating decode replacement with a torn read. Plans 32-11, 32-13 and 32-14 carry them.
- **REQUIREMENTS.md and the ROADMAP phase status are deliberately NOT flipped to Complete by this plan** (its own success criterion). DASH-01 and DASH-02 are also declared by plan 32-14, which has no SUMMARY, so the shared-ID gate holds them open regardless.
- One thing a reviewer should probe rather than take on trust, in this repository's own tradition: the census defines a ticket-frontmatter reader by two arms, and arm B recognises a key-set constant only when its array literal is DECLARED in the same file. A future module that imported `TICKET_KEYS` and re-derived a reader from it would be caught by arm B's both-keys clause only if it spelled both keys; that is the boundary of what this census decides, and it is stated here rather than left for a later round to find.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*
