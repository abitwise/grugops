---
phase: 32-board-projector-cli-dashboard
plan: 17
subsystem: infra
tags: [typescript, board-projector, dashboard, determinism, no-fabrication]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-15's total tickets partition and the required `JoinInputs.unadmittedTickets`"
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-16's single `normalizeDocument` authority and the tab refusal"
provides:
  - "`boundNames` — the ONE place membership under the walk bound is decided, and it decides it by name"
  - "Both caller-side `[...listing.names].sort()` spellings deleted; the listing hands back sorted names"
  - "Three new queue read-error codes (`unsafe-task-name`, `no-claim-record`, `no-at`) making the reader's totality claim true, and asserted by a derived count"
  - "`duplicate-id` — two files claiming one identifier are reported by name, saying which is joined"
  - "The status arm and the unplaced arm read `ticketById.values()`; every arm consuming the ticket population is enumerated above the map"
  - "`splitRow` right-trims the title in all three return arms; `meta`, `trailer` and leading whitespace are pinned untrimmed"
affects: [board projector, dashboard renderer, any --json consumer reading rows[] or conflicts[]]

actuals:
  tokens: 169527
  tasks: 3
  commits: 6
plan_head_before: d0bec7074f629b49cc6748b85a7cb61ecc9686d8

tech-stack:
  added: []
  patterns:
    - "One holder per rule, asserted from the file: a derived scan of the function's own text refuses a second slice, a second sort, a raw-list arm, or an untrimmed return"
    - "Totality as a number: the reader's denominator is derived from the listing on the other side of the loop, behind a non-zero premise"
    - "Report where both names exist: a collision between two documents is raised by the reader, because the join only ever sees the survivor"
    - "Single-sibling-arm mutation: each fix is disabled in ONE arm and the suite is shown to go red, not disabled wholesale"

key-files:
  created: []
  modified:
    - scripts/board-read.ts
    - scripts/board-read.js
    - scripts/board-model.ts
    - scripts/board-model.js
    - scripts/board-read.test.ts
    - scripts/board-model.test.ts
    - scripts/board-tracer.test.ts
    - agent-factory/contracts/board.md

key-decisions:
  - "No eighth conflict kind for the duplicated identifier: D-10 makes the kind set part of the `schemaVersion: 1` shape, so `readErrors` carries it — the channel the review names as the minimum"
  - "The duplicate record is still PUSHED by the reader: dropping it would put a hole in plan 32-15's total partition, and the document WAS admitted. Which record is JOINED is a separate question, answered once in `ticketById`"
  - "A third silent queue skip — the unsafe task name — was closed alongside the two the review named, because the totality claim is false while any arm is silent"
  - "`trimEnd` rather than `trim`, and neither `meta` nor `trailer` is trimmed: the gap ahead of a parenthetical is the grammar's delimiter, whitespace a human typed at the start of a title is not"
  - "The golden is unchanged, and that is measured by regenerating it rather than asserted by the comparison case passing"

patterns-established:
  - "Extract to make a race into an assertion: the bound rule takes its entry list as an argument, so WR-09 is measured over a list the test shuffles rather than over ten thousand planted files"
  - "Derive the exemption by what the line DOES: the raw-list scan excludes the map's builder by `ticketById.set`, never by line number"
  - "Every derived scan carries its own converse premise, so a fix that DELETES the thing being counted cannot pass vacuously"

requirements-completed: [DASH-03, DASH-05, DASH-08]

coverage:
  - id: D1
    description: "Which entries survive the walk bound is decided by name, in one function: two machines reading one tree report the same ticket set."
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the alphabetically FIRST `max` names of a shuffled list longer than the bound"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#returns every name SORTED when the list is at or below the bound"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#filters the atomic-write siblings BEFORE the sort and BEFORE the bound"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#is the ONLY place the bound is applied — `listDirectoryBounded` carries no slice of its own"
        status: pass
      - kind: manual_procedural
        ref: "mutation M1 in this SUMMARY — removing `.sort()` from `boundNames` reds 4 cases"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every claimed-queue entry lands in exactly one of a rendered row or a reported skip, and the reader's totality claim is asserted by a count rather than by a docblock."
    requirement: "DASH-05"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#accounts for EVERY claimed entry: rows plus reported skips (plan 32-17, IN-02)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#REPORTS a claim record with no `at:` line (plan 32-17, IN-02)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#REPORTS a claimed directory with no claim.md at all (plan 32-17, IN-02)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#skips a claimed directory whose name is outside the ported allowlist, without reading it"
        status: pass
      - kind: manual_procedural
        ref: "mutation M2 in this SUMMARY — removing the `no-at` report alone reds 2 cases, including the count"
        status: pass
    human_judgment: false
  - id: D3
    description: "Two ticket files claiming one identifier produce a visible record naming both files and stating which one is joined."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-read.test.ts#REPORTS the duplicate by name, saying which file it kept"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#raises no duplicate record when every identifier is claimed once"
        status: pass
      - kind: manual_procedural
        ref: "mutation M4 in this SUMMARY — removing the reader's report reds the case"
        status: pass
    human_judgment: false
  - id: D4
    description: "One map feeds every arm, so a duplicated identifier is resolved once and reported once: neither the status arm nor the unplaced arm names it twice."
    requirement: "DASH-03"
    verification:
      - kind: unit
        ref: "scripts/board-model.test.ts#the status arm fires ONCE, not once per file"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#the unplaced arm fires ONCE, not once per file"
        status: pass
      - kind: unit
        ref: "scripts/board-model.test.ts#no arm in the join iterates the RAW ticket list (derived from the file)"
        status: pass
      - kind: unit
        ref: "scripts/board-read.test.ts#keeps the ADMITTED file when its twin was refused, and still reports the refusal"
        status: pass
      - kind: manual_procedural
        ref: "mutation M3 in this SUMMARY — reverting ONE arm to the raw list reds 4 cases"
        status: pass
    human_judgment: false
  - id: D5
    description: "A row title carries no trailing whitespace into the published document, from any of `splitRow`'s three return arms."
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-tracer.test.ts#ARM ONE — the BALANCED arm: a gap wider than two spaces leaves nothing on the title"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#ARM TWO — the UNBALANCED arm: the whole remainder is the title, trimmed"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#ARM THREE — the NO-PARENTHETICAL arm: a trailing run on a bare row is not title text"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#every arm returning a title is trimmed — derived from the file, not from three cases"
        status: pass
      - kind: manual_procedural
        ref: "mutation M5 in this SUMMARY — trimming only the balanced arm reds 3 cases"
        status: pass
    human_judgment: false
  - id: D6
    description: "The committed golden did not move, and the treatment of `meta`, `trailer` and leading title whitespace is pinned rather than inferred."
    requirement: "DASH-08"
    verification:
      - kind: integration
        ref: "GRUGOPS_UPDATE_BOARD_GOLDEN=1 npx vitest run scripts/board-model.test.ts -t golden, then git diff -- scripts/fixtures/ (empty)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#`meta` and `trailer` are NOT trimmed — nothing inside them is parsed (D-01, D-22)"
        status: pass
      - kind: unit
        ref: "scripts/board-tracer.test.ts#LEADING whitespace on the title is content, and is NOT trimmed"
        status: pass
      - kind: integration
        ref: "scripts/board-corpus.test.ts (34 passed; premise `the live ticket rows still total 141` green; every declared expectedMeta unchanged)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The contract states the walk bound's determinism, the queue's skip totality, and the duplicated-identifier rule."
    verification:
      - kind: other
        ref: "npm run check:public-docs && npm run check:claim-anchors && npm run check:banned-claims && npm run check:imperative-lexicon — ALL CHECKS PASSED"
        status: pass
    human_judgment: true
    rationale: "A contract sentence is prose a human reads; the gates prove it is well-formed and anchored, not that it says the true thing. A reader should check that the three added paragraphs describe the code that shipped."

duration: 47 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 17: The Reader Decides What the Snapshot Contains — Summary

**Membership under the walk bound became a function of names rather than of the filesystem, three silent queue skips became named read errors behind a derived count, a duplicated ticket identifier became one report and one resolution read from one map, and a row title stopped carrying invisible whitespace into the published `schemaVersion: 1` document.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-15T08:43:56Z
- **Completed:** 2026-09-15T09:31:34Z
- **Tasks:** 3
- **Files modified:** 8 (6 sources + 2 committed `.js` twins)

## Accomplishments

- **WR-09 closed in one function, and measured as an assertion rather than as a race.** `boundNames(entries, max)` filters the atomic-write siblings, **sorts**, and only then applies the bound. `listDirectoryBounded` spreads its result and carries no slice of its own, and the two caller-side `[...listing.names].sort()` spellings at the tickets and context walks are deleted. The tickets walk's comment, which claimed two runs over one directory agree, now claims it of the **set** as well as the order — which is the thing that became true.
- **IN-02 closed as a number, across four arms rather than the two the review named.** Every entry the claimed-stage listing hands the queue loop leaves it as exactly one of a row or a `readErrors` entry. The count derives its denominator from `listDirectoryBounded` on the other side of the loop, asserts it non-zero first, and reports the codes it found in the failure message.
- **WR-08 closed at the two registers it lives in.** The reader raises `duplicate-id` naming both files and stating which is joined — the reader is the only place both file *names* exist, since by the time the list reaches the join the second file's name is gone. The status arm and the unplaced arm now read `ticketById.values()`, so one identifier produces one conflict rather than two byte-identical ones that both survived the total order.
- **All five arms consuming the ticket population are enumerated above the map**, each with the spelling it reads, and a case derived from `joinSnapshot`'s own text refuses a sixth arm added against the raw list — excluding the map's builder by what its line **does** (`ticketById.set`), never by line number.
- **IN-03 closed on all three arms of `splitRow`, not on the one a single case would have exercised**, with a derived case asserting every `title:` in the function carries the trim. The two whitespace questions a trim opens — leading title whitespace, and `meta`/`trailer` — are answered, recorded and pinned.
- **Each of the five fixes was disabled in ONE arm and shown to go red.** The recurring failure in this phase is a fix that lands in one arm while its sibling keeps the defect; a wholesale mutation cannot see that, so every mutation below is a single-arm one.

## Task Commits

1. **Task 1 RED: the filesystem-ordered bound and the queue's silent skips** — `926511af` (test)
2. **Task 1 GREEN: membership by name, and every queue skip counted** — `85699ef3` (feat)
3. **Task 2 RED: the silently-resolved and double-reported duplicate identifier** — `87f8cadd` (test)
4. **Task 2 GREEN: one identifier, one report, one map** — `c6865f4b` (fix)
5. **Task 3 RED: the trailing whitespace a wide gap leaves on a title** — `c02a0a52` (test)
6. **Task 3 GREEN: every arm that produces a title trims it** — `140f36a9` (fix)

## Files Created/Modified

- `scripts/board-read.ts` — `BoundedNames` and `boundNames` (exported, pure, the only holder of the bound rule); both caller-side sorts removed; the tickets-walk comment corrected; three new queue read-error arms (`unsafe-task-name`, `no-claim-record`, `no-at`) with the loop's five emittable codes enumerated in the docblock; the `duplicate-id` report in `readTicketsSource`.
- `scripts/board-model.ts` — the status arm and the unplaced arm moved onto `ticketById.values()`; the five consuming arms enumerated above the map with the reason; `splitRow` right-trims the title in all three return arms, with the `trimEnd`-not-`trim` and the `meta`/`trailer` decisions recorded above it.
- `scripts/board-read.js`, `scripts/board-model.js` — rebuilt committed twins; `check:build-parity` and `freshness` both green.
- `scripts/board-read.test.ts` — the bound block (6 cases), the queue totality battery, the duplicate-identifier block (5 cases), the tamper message pinned byte for byte. 129 → 141.
- `scripts/board-model.test.ts` — the one-map block (6 cases) including the derived raw-list scan and its converse premise. 116 → 122.
- `scripts/board-tracer.test.ts` — the title-whitespace block (8 cases), placed beside the existing `splitRow` cases. 74 → 82.
- `agent-factory/contracts/board.md` — `### The directory listing` (the fifth bound and its by-name determinism); the queue's four named skips in § Staleness; the duplicated-identifier paragraph in § Conflicts.

## RED Transcripts

**Task 1** (8 red):

```
AssertionError: which entries survive the bound is a function of the filesystem's listing order,
so two machines reading one tree report different sets — the failure the sort exists to prevent:
expected [ 't-0008.md', 't-0007.md', …(3) ] to deeply equal [ 't-0000.md', 't-0001.md', …(3) ]

AssertionError: the reader's docblock says it REPORTS the skip; a claimed entry that is neither a
row nor a named skip is a claim the screen makes silently. Rows: 1, reported skips: tampered:
expected 2 to be 5
```

**Task 2** (7 red):

```
AssertionError: the second file was discarded with no record ANYWHERE: no conflict kind, no read
error, nothing on the screen. A tree can be given a ticket nobody sees.: expected undefined to be
'tickets'

AssertionError: … Got: [{"kind":"board-vs-ticket","ticketId":"ABC-014","column":"Backlog",
"expected":"backlog","actual":"done","source":"tickets"},{"kind":"board-vs-ticket",
"ticketId":"ABC-014","column":"Backlog","expected":"backlog","actual":"done","source":"tickets"}]:
expected 2 to be 1

AssertionError: expected [ 'for (const t of tickets)', …(1) ] to deeply equal []
```

The two emitted entries are byte-identical, which is exactly why both survived the total order: the tiebreak chain ends on `expected`, equal for the two.

**Task 3** (5 red), with the length printed beside the text because the defect is invisible in a bare string comparison:

```
expected '"Asset allocation chart " (23 code units)' to be '"Asset allocation chart" (22 code units)'
expected '"Empty-state UI   " (17 code units)'      to be '"Empty-state UI" (14 code units)'
expected '"A title \t" (9 code units)'              to be '"A title" (7 code units)'
expected 'title: rest' to contain 'trimEnd()'
```

## Mutation Proof — five single-arm mutations

A guard that cannot be shown to fail proves nothing. Each fix was disabled in **one arm**, rebuilt, and the suite re-run.

| # | Mutation | Result |
|---|---|---|
| M1 | `.sort()` removed from `boundNames` | 4 failed \| 137 passed |
| M2 | the `no-at` report alone removed, the other three arms intact | 2 failed \| 139 passed — including the totality count |
| M3 | the STATUS arm alone reverted to the raw ticket list | 4 failed \| 259 passed — including the derived scan |
| M4 | the reader's `duplicate-id` report removed | 1 failed \| 140 passed |
| M5 | the trim left on the BALANCED arm only, the other two reverted | 3 failed \| 79 passed — the two sibling arms and the derived scan |

Restored and rebuilt: **345 passed (345)** across the three test files.

M2, M3 and M5 are the ones that matter for this round's recurring failure class: each leaves the majority of the fix in place and removes it from one sibling arm, which is the shape a green suite has repeatedly failed to see in this phase.

## The golden did not move, and that is measured

Regenerated through its own generator path (`npm run build && GRUGOPS_UPDATE_BOARD_GOLDEN=1 npx vitest run --exclude '**/scripts/e2e/**' scripts/board-model.test.ts -t "golden"`); `git diff -- scripts/fixtures/` is **empty**. The regeneration was not vacuous — it rendered the same 9 rows, 3 of them with a captured `meta`.

Probed rather than assumed: **no** row in the fixture board, in any of the four replay boards (`plans/board.md`, `agent-factory/seed/plans/board.md`, `scripts/fixtures/board-replay/chess-board.md`, `scripts/fixtures/board-replay/dogfood-board.md`), or in any of the **156** row lines the live corpus carries has a gap wider than two spaces or a trailing-whitespace title. So **which fields moved: none.** The trim closes the defect prospectively and changes zero committed bytes.

## Verification Results

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-read.test.ts scripts/board-model.test.ts scripts/board-corpus.test.ts scripts/board-oracle.test.ts` | 311 passed |
| `npm run build && npm run typecheck` | pass |
| `npm run check:build-parity` | "Build parity: no tracked build output moved when tsc ran." |
| `npm run freshness` | "All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources." |
| `npm run freshness:context` | pass (vacuous — no `.grugops/context/` tree) |
| `npm run check:imperative-lexicon` | ALL CHECKS PASSED |
| `npm run check:banned-claims` | ALL CHECKS PASSED |
| `npm run check:public-docs` | ALL CHECKS PASSED |
| `npm run check:claim-anchors` | ALL CHECKS PASSED |
| `npm run check:nul-bytes` | ALL CHECKS PASSED |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | ALL CHECKS PASSED |
| `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **74 files, 4886 passed, 2 skipped, 0 failed** (floors: 74 files, 4811 passed) |
| `git status --porcelain scripts/fixtures/` | empty |

Per-file counts: `board-read` 129 → **141**, `board-model` 116 → **122**, `board-tracer` 74 → **82**, `board-corpus` 34 (unchanged), `board-oracle` 14 (unchanged).

The live claude-CLI e2e lane (`scripts/e2e/**`) was **not** run: it spends tokens on an authenticated box and can hang. Its state is `UNKNOWN - verify`.

## Decisions Made

- **No eighth conflict kind for the duplicated identifier.** Carried from the plan's `deferred` entry: D-10 makes the kind set part of the `schemaVersion: 1` shape, so an eighth kind costs the contract, the closed-set count test, the golden and the renderer in one edit. `readErrors` is the channel the review names as the minimum, and it carries what a human needs — both file names, and which one won. A consumer needing to branch on this mechanically is the version bump to make. `CONFLICT_KINDS` and `SCHEMA_VERSION` are untouched.
- **The duplicate record is still pushed by the reader.** Dropping it there would have put a hole in plan 32-15's total partition — the entry would be neither an admitted record nor an unadmitted one, and the count pinning the partition would be measuring a set with a hole in it. The document **was** admitted; which of two admitted records gets **joined** is a different question, answered once in `ticketById`.
- **First-by-name is a stated rule, not a filesystem accident.** It is only a rule because Task 1 sorts the listing. Before that, the surviving record was whichever one `readdirSync` handed over first, so two machines could join different documents for one identifier — which is why the two findings had to land in this order.
- **A third silent queue skip was closed.** See deviation 1.
- **`trimEnd` rather than `trim`, and neither `meta` nor `trailer` is trimmed.** The whitespace ahead of a parenthetical is the grammar's own delimiter written wide; whitespace a human typed at the start of a title is what they typed. D-01 and D-22 say nothing inside `meta` or `trailer` is interpreted, so whitespace inside those two is content. All three answers are pinned by cases.
- **The golden's stillness is measured, not inferred.** The comparison case passing only says the golden matches; regenerating it and diffing says it would not have moved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A THIRD silent skip in the queue loop, one arm over from the two the review named**

- **Found during:** Task 1 (writing the totality count)
- **Issue:** IN-02 names two silent skips. The loop has a third: `if (!isSafeTaskName(task)) continue;`. `isSafeTaskName` rejects a strict superset of what `childPath` rejects, so a claimed directory named `my task` passed every path authority and still landed in neither a row nor a report. The plan's own must-have truth — "every claimed-queue task directory lands in exactly one of a rendered row or a reported skip" — is false while any arm is silent, and a count written over only the two named arms would have been true of three of four arms. That is precisely the "one arm over" failure this gap-closure round exists to stop.
- **Fix:** Added the `unsafe-task-name` report, following `childPath`'s own convention: the path is the claimed **stage**, never a composed path, because joining the refused segment is the join the arm exists to prevent. The entry name is quoted in the message, as `childPath` quotes it, so a human can find the offending directory.
- **Files modified:** `scripts/board-read.ts`, `scripts/board-read.test.ts`, `agent-factory/contracts/board.md`
- **Verification:** the totality case asserts the skip-code set is exactly `{no-claim-record, no-at, tampered, unsafe-task-name}` over a five-entry fixture; the pre-existing allowlist case gained the report assertion.
- **Committed in:** `85699ef3`

**2. [Rule 3 - Blocking] The RED for WR-09 required the extraction to travel in the RED commit**

- **Found during:** Task 1 (writing the RED)
- **Issue:** The plan asks for the failing case to be written "against the EXTRACTED function", but the extraction did not exist, and importing a missing named export from an ESM module produces a collection error rather than an assertion failure — a RED that reports "no tests ran" measures nothing. The alternative, driving WR-09 through a real directory, needs `MAX_WALK_ENTRIES + 1` planted files and passes for the wrong reason on any filesystem that happens to list in sorted order.
- **Fix:** The RED commit `926511af` carries the **behaviour-preserving** extraction (filter, then slice, no sort — today's rule verbatim) alongside the cases, so the defect is measured as a pure assertion on every machine. The GREEN commit adds the sort. The commit message states this explicitly.
- **Files modified:** `scripts/board-read.ts` (extraction only), `scripts/board-read.js`
- **Verification:** the RED run reported 4 assertion failures naming the shuffled names; M1 shows the same 4 go red again when the sort is removed.
- **Committed in:** `926511af`

**3. [Rule 1 - Bug] The Task 2 RED fixture as first written did not reach the arm under test**

- **Found during:** Task 2 (running the first RED)
- **Issue:** The fixture stated `column: Done` against a `Backlog` heading with `status: done`. That fires the **column** arm (arm one), which iterates placements and looks the identifier up — an arm that never had the defect — while `kebab("Done") === "done"` left the **status** arm silent. The case would have gone green on a join that still double-reported.
- **Fix:** `column: Backlog` with `status: done`, so the column arm stays silent and only the status arm fires. The RED then reported two byte-identical entries, which is the finding.
- **Files modified:** `scripts/board-read.test.ts`
- **Verification:** a separate case now pins the column arm's per-placement behaviour explicitly, so the third arm is not left unmeasured by the two that moved.
- **Committed in:** `87f8cadd`

### Process deviations

**4. Task 3's cases were placed in `scripts/board-tracer.test.ts`, not `scripts/board-model.test.ts`.** The plan's `<files>` named `board-model.test.ts`, but every existing `splitRow` case — including the unbalanced-arm case this task's converse pins build on — lives in `board-tracer.test.ts`. Splitting one function's cases across two files is the "two spellings of one rule" shape this repository keeps paying for. `board-model.test.ts` is where the golden lives and it was exercised for Task 3's golden question; the `splitRow` cases stayed together.

**5. Committed directly on `main`.** `.planning/config.json` sets `git.branching_strategy: "none"`, the orchestrator dispatched this plan as a sequential executor on the main working tree, and every phase-32 commit to date is on `main`. The pre-existing uncommitted changes in the tree (`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/` and `.planning/state.json`) were never staged.

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 blocking, 1 bug) + 2 process notes.
**Impact on plan:** No scope creep. Deviation 1 is the one that matters: the plan's own count would have passed over a reader that still skipped silently, and the count was what found it.

## Issues Encountered

- **The "real directory lists sorted" case was GREEN at RED time, for the filesystem's reason rather than the code's.** APFS returns `readdirSync` in sorted order here, so that case could never have measured WR-09 — which is exactly why the pure `boundNames` cases exist. It is kept as a regression pin on the two deleted caller-side sorts, not as evidence for the finding. On a filesystem listing by inode it would additionally have caught the defect; here it does not, and saying so is cheaper than letting a later reader over-read it.
- **The derived raw-list scan needed two corrections before it measured the right set.** First it matched the map's own builder (`for (const t of tickets) if (!ticketById.has(...))`), which is the one legitimate reader of the raw list; the exemption is now by what the line **does** (`ticketById.set`) rather than by position, and a premise asserts that exactly one such line remains — so a fix that deleted both arms instead of moving them cannot pass vacuously.
- **The derived title scan initially cut `rest.slice(0, at)` in half** at the comma inside the call, hiding the `.trimEnd()` that followed it. The pattern now stops at the separator that actually ends the binding.

## Known Stubs

None.

## Threat Flags

None. No network endpoint, no auth path, no schema change, and no new read primitive or path authority: the routing census still reports 17 read-primitive call sites and the same producer set. The three new queue reports and the duplicate report quote paths and directory-entry names — both already reported elsewhere by `childPath` — and quote no byte of any document's content, keeping the containment rule plan 32-10 set.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 3 of gap-closure round 2 is complete for this plan's four findings (WR-08, WR-09, IN-02, IN-03). Both committed `.js` twins are rebuilt and `check:build-parity` is green, so later plans start from a tree whose `.js` is a faithful build of its `.ts`.
- `REQUIREMENTS.md` and the ROADMAP phase status were deliberately **not** flipped to Complete by this plan (plan success criterion 5).
- Open at the end of this plan: the live claude-CLI e2e lane was not run (`UNKNOWN - verify`); the golden's stillness means no consumer has yet observed the trimmed shape on real data, so the first board written with a wide gap is the first observation of D5 in the wild.
- **Estimate calibration note.** `actuals.tokens: 169527` is chars/4 over the full text of the eight changed files, the same scale plan 32-15 recorded (103199). On the narrower "realized diff only" scale the number is 19362. The plan estimated 85000; on the comparable scale this plan cost roughly twice that, driven by the eight-file spread rather than by task count.

## Self-Check

- `scripts/board-read.ts` — FOUND
- `scripts/board-read.js` — FOUND
- `scripts/board-model.ts` — FOUND
- `scripts/board-model.js` — FOUND
- `scripts/board-read.test.ts` — FOUND
- `scripts/board-model.test.ts` — FOUND
- `scripts/board-tracer.test.ts` — FOUND
- `agent-factory/contracts/board.md` — FOUND
- commits `926511af`, `85699ef3`, `87f8cadd`, `c6865f4b`, `c02a0a52`, `140f36a9` — FOUND in `git log`

## Self-Check: PASSED

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*
