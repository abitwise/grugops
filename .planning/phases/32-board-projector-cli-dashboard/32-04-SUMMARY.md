---
phase: 32-board-projector-cli-dashboard
plan: 04
subsystem: testing
tags: [typescript, markdown-grammar, board-projector, corpus, parse-oracle, mutation-testing, invariants]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plan 32-01's pure board-grammar module and the contract's Headings/Rows/Comments sections, and plan 32-02's total line partition, the I1..I5 spellings and the completed contract"
  - phase: 31-uat-spec-integrity-and-admission
    provides: "canonical-corpus.ts — the corpus-as-data precedent: provenance as a data field, the module-load integrity throw, citedSources()/unresolvedSources(), and the vacuity statement that admitting everything and refusing everything are both trivially achievable"
  - phase: 29-voice-and-language-guards
    provides: "section-locator-oracle.test.ts — the cross-product precedent: three-way cell counts, per-axis label coverage, and the recorded scar that a vacuity floor has never caught a silently short denominator"
provides:
  - "scripts/board-corpus.ts — 167 rows of board-grammar replay data: 148 live (the 141 measured ticket rows plus the lines reaching the other live buckets), 13 mutations derived from the contract's refusal rules, 6 controls recording where the contract's prose and the shipped grammar part"
  - "a closed nine-member disposition set and an eleven-member frame set, both pinned two-sided, so a refusal is NAMED rather than counted"
  - "scripts/board-corpus.test.ts — the two-halves replay, the provenance sweep, the D-03 documentation-block case, and the no-op-stripper mirror that proves the comment pre-pass can fail"
  - "scripts/board-oracle.test.ts — an 18,144-cell seven-axis cross product holding I1..I5, with the cell count asserted three ways and every reach number derived by hand"
  - "scripts/fixtures/board-replay/ — the two real agent-written boards, structurally trimmed with marked elisions, preserving one 34,494-byte bound-case line"
  - "32-04-RED-baseline.txt / 32-04-GREEN-proof.txt — the recorded red that makes the strip assertion mean something"
affects: [32-05, 32-06, 32-07, 32-08]

actuals:
  tokens: 91382
  tasks: 3
  commits: 8
plan_head_before: ebd4f0dade5581283d11bd2066aac9e5c0219c58

tech-stack:
  added: []
  patterns:
    - "A corpus row is ONE line plus a FRAME name: a disposition is a property of a line, and a line has no meaning without its document, so the frames are a closed set drawn from the contract's positional rules"
    - "A third corpus kind, `control`, for shapes a reader expects to be refused that the SHIPPED grammar admits — declaring them refused would make the replay assert something untrue"
    - "A mirror built from the LIVE BUILD with one call site rewritten, guarded by a premise asserting that call site is unique in the source AND in its build"
    - "A re-implemented independent scanner asserted to agree with the shipped one on every generated cell, so a drifted copy fails by name rather than quietly weakening every invariant beneath it"
    - "Every corpus-reach number measured, then derived by hand in a comment beside it, so a pin that moves is read as a shape change rather than adjusted until the case passes"
    - "A derived set refined by the PROPERTY that makes a member a member, with BOTH halves of the split pinned and every exemption required to carry a reason"

key-files:
  created:
    - scripts/board-corpus.ts
    - scripts/board-corpus.js
    - scripts/board-corpus.test.ts
    - scripts/board-oracle.test.ts
    - scripts/fixtures/board-replay/chess-board.md
    - scripts/fixtures/board-replay/dogfood-board.md
    - 32-04-RED-baseline.txt
    - 32-04-GREEN-proof.txt
  modified:
    - scripts/check-foundation-guards.test.ts
    - scripts/validate.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "The disposition set is NINE members, not the plan's seven: the contract's `no bucket` row is split into `columnHeading`, `nonColumnHeading` and `blanked`, because a comment mutation and a `## Blocked (2)` refusal are different refusals and a corpus recording both as `not a column` would not know the difference"
  - "The gap shapes and the disagreeing-prefix identifier are `control` rows with disposition `row`, not mutations: the shipped grammar admits all three, and the plan's own `no mutation reaches row` criterion would otherwise have to be satisfied by declaring a grammar nobody wrote"
  - "`expectedMeta` is declared on VERBATIM rows only — eliding a tail cuts the closing parenthesis, so a framed row's meta capture is a property of the transcription rather than of the artifact"
  - "The corpus imports nothing from `scripts/board-model.ts`; the disposition resolver lives in the test, because a corpus that imported the module it exists to measure could not be evidence about it"
  - "`plans/traceability.md`'s documentation block is recorded as carrying NO board shape, so it is not counted as a third witness for a claim it does not support"

patterns-established:
  - "Two-halves corpus: admitted rows and refused rows, each with its bucket named, plus a recorded RED against a mirror — the shape any future grammar gate in this tree should take"
  - "Fixture transcription honesty: one elision rule shared by the fixture generator and the corpus, so a corpus row's bytes are a prefix of the fixture line it cites and the claim is checkable"

requirements-completed: [DASH-02]

coverage:
  - id: D1
    description: "Every one of the 141 measured live board rows is admitted by the shipped grammar with its disposition named, across all five sources"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-corpus.test.ts#replays every live row to exactly the disposition the contract assigns it"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#places every measured ticket row in a column rather than on the findings list (141 tickets, 0 refused)"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#PREMISE: the live ticket rows still total 141, split as the research measurement recorded"
        status: pass
    human_judgment: false
  - id: D2
    description: "The mutation half is refused, each row into its named bucket, and none of them reaches row, epicRow or update"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-corpus.test.ts#replays every mutation row to exactly the disposition the contract assigns it"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#lets NO mutation reach a live bucket"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#refuses the mutations into MORE THAN ONE bucket, so the refusal is named and not blanket (4 distinct buckets)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Replacing the comment-blanking pre-pass with a no-op turns the documentation-block case RED, with a recorded RED baseline committed before the case was claimed to pass"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-corpus.test.ts#DISCRIMINATES: the un-indented mutation turns the zero-columns claim RED against the mirror"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#DISCRIMINATES: every comment-strip mutation changes bucket against the mirror, or names itself"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#MEASURES THE VACUITY: the three transcribed blocks yield zero columns EVEN WITH the strip removed"
        status: pass
      - kind: other
        ref: "32-04-RED-baseline.txt — pre-pass removed from the committed build: 10 cases failed, 6 corpus rows changed disposition, 3 reached `row` (commit bf6c555d, before the discrimination commit 97df1b26)"
        status: pass
    human_judgment: false
  - id: D4
    description: "BOARD_CORPUS_COUNT is declared in the same file as the data and checked at module load, so a corpus that silently loses rows throws"
    requirement: DASH-02
    verification:
      - kind: e2e
        ref: "node -e import('./scripts/board-corpus.js') with the count mutated 167 -> 166 -> threw naming both numbers"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#PREMISE: the corpus loaded, and its own count agrees with its length"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every source a corpus row cites resolves on disk, and the two real boards are cited as their committed trimmed copies rather than a home-directory path"
    requirement: DASH-02
    verification:
      - kind: e2e
        ref: "node -e unresolvedSources('.') -> [] ; 'corpus rows=167, sources=8'"
        status: pass
      - kind: unit
        ref: "scripts/board-corpus.test.ts#finds every transcribed board row in the committed fixture it cites (129 rows)"
        status: pass
      - kind: other
        ref: "grep -rl 'Projects/hacks' scripts/board-corpus.ts scripts/fixtures/board-replay/ -> matches=1 (grep exit 1, no file matched)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The cross-product oracle's cell count is asserted three ways and every axis label is asserted reached by at least one cell"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-oracle.test.ts#pins every axis length and derives the cell count THREE ways (18,144)"
        status: pass
      - kind: unit
        ref: "scripts/board-oracle.test.ts#reaches every declared label of every axis, and declares every label reached"
        status: pass
    human_judgment: false
  - id: D7
    description: "Invariants I1 through I5 hold over every generated cell, each deriving its denominator independently of the generation loop, with no transcribed expected output"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "scripts/board-oracle.test.ts#I1 (2 cases) / I2 / I3 / I4 / I5 — 18,144 cells swept, 0 violations"
        status: pass
      - kind: unit
        ref: "scripts/board-oracle.test.ts#PREMISE: the corpus reaches the edges the invariants are about (6 measured reach numbers, each hand-derived)"
        status: pass
      - kind: other
        ref: "falsifiability spot-check: the `legal row outside a column is unparsed` arm removed from the build -> I1, I4, I5 and the reach premise all red; build restored and byte-compared"
        status: pass
    human_judgment: false
  - id: D8
    description: "The replay fixture preserves exactly one line of at least 34,494 characters, and the oracle cell parsing it completes within a wall-clock bound asserted in the test"
    requirement: DASH-02
    verification:
      - kind: other
        ref: "awk '{ if (length($0) >= 34494) n++ } END { print \"long_lines=\" n+0 }' scripts/fixtures/board-replay/chess-board.md -> long_lines=1"
        status: pass
      - kind: unit
        ref: "scripts/board-oracle.test.ts#parses a cell carrying that line within a stated wall-clock bound (2,000 ms ceiling)"
        status: pass
      - kind: unit
        ref: "scripts/board-oracle.test.ts#holds all five invariants over the bound-case cell as well"
        status: pass
    human_judgment: false
  - id: D9
    description: "Elision in the trimmed replay boards is marked in the file, so a reader can tell a structural trim from the original artifact"
    verification: []
    human_judgment: true
    rationale: "A header naming the origin, the transcription date, the four line classes kept, the count of dropped lines and the `... [elided N chars]` marker is checkable only by a human reading it against the original. No test can say whether a reader who has never seen the source board would understand what was removed."
  - id: D10
    description: "The whole tree stays green and the committed .js twin is a faithful build"
    verification:
      - kind: integration
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness (65/65 outputs fresh)"
        status: pass
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 72 files, 4595 passed, 2 skipped, 0 failed"
        status: pass
    human_judgment: false

duration: 68 min
completed: 2026-09-14
status: complete
---

# Phase 32 Plan 04: The corpus that both admits and refuses

**DASH-02 now has teeth: 167 corpus rows replay the board grammar with every row's bucket NAMED — 141 measured live ticket rows admitted, 13 contract-derived mutations refused into four distinct buckets, 6 controls recording where the contract's prose and the shipped code part — plus an 18,144-cell seven-axis oracle holding I1 through I5, and a recorded RED proving the comment pre-pass assertion can fail.**

## Performance

- **Duration:** 68 min
- **Started:** 2026-09-14T12:58:00Z
- **Completed:** 2026-09-14T14:06:00Z
- **Tasks:** 3
- **Files modified:** 11 (8 created, 3 modified)

## Accomplishments

- **The vacuity research predicted is now MEASURED, and asserted rather than narrated.** With the comment pre-pass deleted from the committed build, all three transcribed documentation blocks still yield zero columns, zero rows and zero updates. `scripts/board-corpus.test.ts` asserts that fact as a standing case, so the corpus cannot quietly start believing its own weakest evidence.
- **The single input that separates a working pre-pass from a no-op exists, and it had to be derived.** `mut-comment-unindented` is not on disk anywhere — every real comment in every real board is four-space indented. Through the no-op mirror it opens a second, live column and files a documented example as a live ticket row. Three of the five comment mutations reach `row` that way; the two indented ones move to `preamble`, which is why they cannot stand in for it.
- **Both halves replay with dispositions, not a pass/fail bit.** 141 measured ticket rows admitted with 0 refused; 13 mutations refused into `blanked`, `nonColumnHeading`, `preamble` and `unparsed`; 6 controls including the two-space / one-space / tab gap triple, asserted through the row's actual `meta` rather than through its bucket alone.
- **A 34,494-byte board row now lives in this repository.** The two agent-written boards that drove D-01, D-22 and D-02 sit outside it, in a user's own example repositories. They are preserved as structurally trimmed fixtures whose parse reproduces the research measurement exactly: chess 11 columns / 107 rows / 6 epics / 25 updates, dogfood 13 columns / 16 rows / 6 non-column sections, both with zero unparsed lines.
- **18,144 documents swept, five invariants, zero transcribed outputs.** The cell count is asserted three ways, every axis label is asserted reached in both directions, and every reach number — 13608, 5832, 1296, 8424, 6048, 8424 — is measured and then derived by hand in a comment beside it. The whole file runs in under one second.
- **A derived set was refined rather than re-pinned.** `scripts/validate.test.ts` treated every directory under `scripts/fixtures/` as a validator fixture repository. That was true only while nothing else lived there. It now derives the set by the property that makes a member a member and pins BOTH halves of the split.

## Task Commits

1. **Task 1: the corpus as data and the trimmed replay boards** — `42e5cf16` (feat)
2. **Task 2 replay: both halves, each row into a named bucket** — `12beee6a` (test)
3. **Task 2 RED: the comment pre-pass, measured by removing it** — `bf6c555d` (test)
4. **Task 2 GREEN: the no-op mirror and the discrimination proof** — `97df1b26` (test)
5. **Task 2 fix: name the discrimination block so the plan's own filter reaches it** — `d1504695` (test)
6. **Task 3: the seven-axis parse oracle** — `1ab33c73` (test)
7. **Deviation: derive the validator fixture set by what makes a fixture** — `ef037629` (fix)
8. **Deviation: move the four derived-set pins this plan's new files entered** — `68c87b1f` (test)

## Files Created/Modified

- `scripts/board-corpus.ts` / `.js` — 167 rows. `BOARD_CORPUS`, `BOARD_CORPUS_COUNT`, `BOARD_CORPUS_SOURCES`, `DISPOSITIONS` + `DISPOSITION_COUNT`, `FRAMES` + `FRAME_COUNT`, `frameDocument`, `citedSources`, `unresolvedSources`, `rowsOfKind`, `rowById`; types `CorpusRow`, `CorpusKind`, `Disposition`, `Transcription`, `Frame`.
- `scripts/board-corpus.test.ts` — 34 cases in five parts: nine premises, the two-halves replay, the control half, the provenance sweep, the D-03 documentation-block case, and the discrimination proof against a mirror built from the live build.
- `scripts/board-oracle.test.ts` — 14 cases. Seven axes, an 18,144-cell cross product, I1 through I5, and the bound case.
- `scripts/fixtures/board-replay/chess-board.md` — 201 lines, 70 KB. 180 lines survive the trim, 82 non-blank lines dropped, one line preserved whole at 34,494 UTF-8 bytes / 34,171 UTF-16 code units.
- `scripts/fixtures/board-replay/dogfood-board.md` — 62 lines, 5 KB. 42 lines survive, 53 dropped.
- `32-04-RED-baseline.txt` / `32-04-GREEN-proof.txt` — the recorded red and the matching green.
- `scripts/check-foundation-guards.test.ts` — four pins moved, each with its entrant and re-derivation named.
- `scripts/validate.test.ts` — the fixture-repository set derived by property, both halves pinned.
- `.planning/WINDOWS.md` — one `deviation` entry for the contract-versus-code divergence recorded below.

## Decisions Made

1. **The disposition set is nine members rather than the plan's seven.** The plan names `row`, `epicRow`, `update`, `preamble`, `nonColumnSection`, `unparsed` and `nonColumnHeading`. Those seven cannot express the mutation half: a mini-board inside a comment reaches NO bucket, and the contract's partition table records that as its seventh row ("no bucket: a blank line, and every level-two heading line"). Splitting it into `columnHeading`, `nonColumnHeading` and `blanked` is what lets a comment mutation declare the bucket it is refused INTO, which the plan's own truth statement requires. All seven plan-named members are present unchanged.

2. **A corpus row carries one LINE plus a FRAME, not a document.** A disposition is a property of a line and the contract classes lines by position, so the same bytes are a row inside a column and an unparsed line outside one. Eleven frames, drawn from the contract's own positional rules and pinned two-sided, build the document; `frameDocument` returns the text and the one-based line number of the subject, so a failure names the line it measured.

3. **A third kind, `control`, for shapes the shipped grammar admits.** Six rows sit there. Declaring them refused — which the plan's mutation list does for three of them — would have made the replay assert a grammar nobody wrote. Each control carries the sentence of the contract that explains the outcome.

4. **The corpus imports nothing from `scripts/board-model.ts`.** The disposition resolver lives in the test file. `canonical-corpus.ts` records the same rule for the same reason, and it is what keeps the corpus evidence about the module rather than a projection of it.

5. **The mirror rewrites the ONE pre-pass call site in the committed build, and its uniqueness is a premise.** The call site is asserted to appear exactly once in `board-model.ts` AND exactly once in `board-model.js`, so a stale build cannot leave the mirror copying bytes nobody wrote, and a second call site cannot leave the mirror half-mutated. A further premise asserts the mirror is indistinguishable from the shipped parser on a comment-free document, so any difference below is attributable to the pre-pass alone.

6. **`plans/traceability.md`'s documentation block is recorded as carrying no board shape.** Its example is a pipe-table row. "This block yields zero columns" is true of it for a reason that has nothing to do with the pre-pass, so the test records `carriesBoardShape: false` and asserts that measurement two-sided rather than letting the block read as a third witness. This surfaced as a genuine premise failure on the first run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's mutation list names three shapes the shipped grammar admits**

- **Found during:** Task 1 (authoring the mutation half)
- **Issue:** The plan requires the mutation half to carry "a one-space gap before the parenthetical", "a tab gap" and "an id whose prefix disagrees with the configured prefix", and separately requires that no mutation reach `row`, `epicRow` or `update`. All three are admitted as rows by `scripts/board-model.ts` as shipped. The gap shapes change the META CAPTURE, which is the only thing the two-space rule decides; the disagreeing prefix conforms to the identifier SHAPE and is refused only by a clause the pure grammar cannot enforce.
- **Fix:** All three are carried as `kind: "control"` with `expectedDisposition: "row"`, each naming the contract sentence that explains the outcome. The gap triple gains a stronger assertion than a bucket comparison: `expectedMeta` is declared per row and checked against the parsed row's actual `meta`, so two spaces capture and one space and a tab do not. The mutation half's "reaches no live bucket" criterion holds over the 13 remaining mutations.
- **Files modified:** `scripts/board-corpus.ts`, `scripts/board-corpus.test.ts`
- **Verification:** `scripts/board-corpus.test.ts#captures a parenthetical after TWO spaces and not after one or a tab`; `#lets NO mutation reach a live bucket`
- **Committed in:** `42e5cf16`, `12beee6a`

**2. [Rule 2 - Missing critical] A vitest `-t` filter that selected zero tests exited 0**

- **Found during:** Task 2 (running the plan's own verification commands)
- **Issue:** The plan's verification `npx vitest run scripts/board-corpus.test.ts -t "discriminat"` reported `34 skipped` and exited 0. Vitest's `-t` is a case-sensitive substring match and the block was titled only in uppercase. A verification command that matches nothing is a green line over an empty denominator — the exact shape this plan exists to refuse.
- **Fix:** The block is titled `the comment strip discriminates: a CONTROL, not a coincidence`, so the filter selects seven cases. The RED capture was re-run under the new names against the same mutated build and reproduced the same ten failures and the same six changed dispositions; both evidence files carry the corrected names.
- **Files modified:** `scripts/board-corpus.test.ts`, `32-04-RED-baseline.txt`, `32-04-GREEN-proof.txt`
- **Verification:** `npx vitest run ... -t "discriminat"` — 7 passed, 27 skipped
- **Committed in:** `d1504695`

**3. [Rule 3 - Blocking] `scripts/validate.test.ts` treated the new fixture directory as a validator fixture repository**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** Two discoveries in that file read `readdirSync(scripts/fixtures)` directly, which equalled "every validator fixture repository" only while that directory held nothing else. `board-replay/` carries two trimmed markdown boards and no `agent-factory/` tree, so both discoveries tried to point the validator at a repository that does not exist and to read a `factory.config.json` that is not there. Three cases red.
- **Fix:** The set is derived by the property that makes a member a member — it carries `agent-factory/config/factory.config.json` — and BOTH halves of the split are pinned, with each declared non-repository required to name a reason of its own. A new fixture repository still fails the two-sided intent check; a new non-repository has to be classified rather than added silently. This is the set-literal lesson applied to a derivation that had been correct only by accident.
- **Files modified:** `scripts/validate.test.ts`
- **Verification:** `npx vitest run scripts/validate.test.ts` — 91 passed
- **Committed in:** `ef037629`

**4. [Rule 3 - Blocking] Four derived-set pins refused this plan's new files**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** `NON_TEST_MODULE_COUNT` (82), the two `scripts/`-scoped module enumerations (55) with their comparison literal (`55 * 3`), and `TRIPWIRE_MODULES` (64) all pin their corpora two-sided. One new tooling module and two new test modules turned nine cases in `scripts/check-foundation-guards.test.ts` red. The plan named none of them, exactly as plans 32-01, 32-02 and 32-03 recorded happening to them.
- **Fix:** `NON_TEST_MODULE_COUNT` 82 → 83, the two `scripts/`-scoped enumerations 55 → 56 with the comparison literal `55 * 3` → `56 * 3`, and `TRIPWIRE_MODULES` 64 → 66. Every number re-derived rather than incremented (`git ls-files '*.ts'` minus the `.test.ts` and `.d.ts` members reports 83; `ls scripts/*.test.ts | wc -l` reports 66), each with a paragraph naming the entrant and confirming both LANG-07 owner answers are unchanged — `board-corpus.ts` declares no frontmatter-parser name, and `frameDocument` BUILDS a document rather than locating a region in one, so it carries no section extent. The bumps land in the same commit as the run that observed them.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts scripts/nonblocking-reader-parity.test.ts scripts/validate.test.ts` — 401 passed
- **Committed in:** `68c87b1f`

**5. [Rule 1 - Bug] The D-03 premise asserted a property one of the three blocks does not have**

- **Found during:** Task 2 (first run of the replay file)
- **Issue:** The premise asserted that each cited documentation block carries a structurally valid mini-board. `plans/traceability.md:4-34` does not — its example is a pipe-table row, which research had recorded and the premise had not. Left as written the case would have been red on correct text; removed, the third block would have read as a third piece of evidence for a claim it does not support.
- **Fix:** `carriesBoardShape` is a field of the block table, MEASURED and asserted two-sided, with a paragraph recording why the third block carries no weight for the pre-pass claim and where that weight actually lives.
- **Files modified:** `scripts/board-corpus.test.ts`
- **Verification:** `scripts/board-corpus.test.ts#PREMISE: which blocks carry a board shape is MEASURED, and two of the three do`
- **Committed in:** `12beee6a`

---

**Total deviations:** 5 auto-fixed (2 bugs, 1 missing critical, 2 blocking)
**Impact on plan:** None widened scope. Deviations 1 and 5 are the plan's prose meeting the grammar as shipped, which the executor brief named in advance as the tie-breaker. Deviations 3 and 4 are bookkeeping this repository's own discipline demands of every entrant. Deviation 2 closed a verification command that was reporting success over zero tests.

## Contract-versus-code divergence recorded

`agent-factory/contracts/board.md` states that "where `factory.config.json` carries `id_prefix`, a ticket identifier's prefix equals that value". `scripts/board-model.ts` cannot enforce that clause: it is pure by construction and reads no config, which is the property the DASH-06 import-graph guard exists to keep. It enforces the identifier SHAPE only, so `- [XYZ-014] ...` parses as a legal row today.

This is recorded rather than silently resolved. `scripts/board-corpus.ts` carries it as `ctl-id-disagreeing-prefix` with the reasoning in its note, and `.planning/WINDOWS.md` carries a `deviation` entry against the contract. The prefix comparison belongs to the join layer that already holds the dial — plan 32-05's conflict set — and the contract was not edited here because it is outside this plan's declared files.

## Known Stubs

None. Every artifact this plan produced is complete as specified. The oracle's axis count was not reduced: the full 18,144-cell cross product fits the quick-run budget with three orders of magnitude to spare (the three board test files together complete in 0.54 s against a 30 s criterion), so research assumption A6 holds and the sampling rate in `32-VALIDATION.md` needs no change.

## Threat Flags

None. Every file created here sits inside the plan's own `<threat_model>`: the bound case (T-32-01) carries its wall-clock ceiling, the documentation-block promotion (T-32-11) carries four comment mutations and a recorded RED, the corpus provenance (T-32-14) carries a module-load count check and a path resolver, the fixture headers (T-32-15) name the artifact class rather than a home path, and no install task exists (T-32-SC): `git diff --exit-code -- package.json package-lock.json` is clean. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was introduced.

## Issues Encountered

- **An intermediate commit briefly carried a typecheck failure and was amended.** Two imports used only by the discrimination section were written before that section existed, and the commit ran because `npm run typecheck | tail` masks the exit status through the pipe. Caught immediately, the commit amended, and the exit status checked explicitly on every subsequent run with `${PIPESTATUS[0]}`.
- **The oracle's six reach numbers were guessed before they were measured, and four of the guesses were wrong.** Each measured value was then derived by hand — the corrected derivation is written in the file beside the pins — and the reason the first guesses were wrong is itself a finding: `XYZ-014` conforms to the identifier shape, so four of the six identifier levels are legal rather than three. That is the same divergence recorded above, surfacing a second time through arithmetic.
- **The oracle was spot-checked for falsifiability beyond what the plan required.** Removing the "a legal row outside every column is an unparsed line" arm from the build turned I1, I4, I5 and the reach premise red; the build was restored with `git checkout -- scripts/board-model.js` and byte-compared against a pre-mutation copy.
- **HEAD is `main`, which the executor's own pre-commit assertion classifies as protected.** This project sets `git.branching_strategy: "none"` and `workflow.use_worktrees: false`, and the orchestrator dispatched this plan explicitly as a sequential executor on the main working tree. Commits proceeded on `main`, as in every prior plan of this phase; recorded so the choice is visible rather than silent.
- **Requirement `DASH-02` is not yet marked complete in `REQUIREMENTS.md`, and that is correct.** Plans 32-05 through 32-08 declare the same ID and have no summaries yet.

## User Setup Required

None — no external service configuration required. No dependency was added; `package.json` and `package-lock.json` are byte-unchanged.

## Next Phase Readiness

Ready for **plan 32-05** (the conflict set and the join). What this plan fixes for it:

- `scripts/board-corpus.ts` is the place a new grammar shape is recorded. A plan that widens the grammar adds its row here with a disposition, or the two-sided disposition and frame checks fail by name.
- The contract's `id_prefix` clause is unowned, and `ctl-id-disagreeing-prefix` says so in the corpus. Plan 32-05 holds the dial, so it is the natural owner of the prefix comparison — as a `board-vs-ticket` conflict rather than as a parser change.
- `scripts/fixtures/board-replay/` is a committed, parseable pair of real boards reproducing the measured inventory exactly. The chess board renders 11 of the 13 configured columns, so `column-missing` fires on it today: a live fixture for D-08 that no synthetic tree has to manufacture.
- The oracle's seven axes are extensible. A conflict axis added later crosses cleanly, and the three-way cell count plus per-axis coverage will refuse a generator that silently collapsed.

**One concern to carry forward, unchanged from 32-01 and 32-03:** this plan moved four pins and refined a fifth derived set. Plans 32-05 through 32-08 will each add tracked files and move `NON_TEST_MODULE_COUNT`, the two `scripts/`-scoped enumerations and `TRIPWIRE_MODULES` again. Run the full suite before the final commit rather than only the plan's own files; at roughly seven minutes it is cheaper than leaving the tree red for a reason unrelated to the plan's own work.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-14*

## Self-Check: PASSED

- All 8 files listed in `key-files.created` exist on disk (`[ -f ]` for each: 8 FOUND, 0 MISSING).
- All 8 task commit hashes plus the metadata commit resolve in `git log --oneline --all` (9 FOUND, 0 MISSING).
- `commits: 8` is MEASURED: `git rev-list --count ebd4f0da..HEAD` at SUMMARY write = 8, against the ledger base recorded in `plan_head_before`. The metadata commit is the ninth and is excluded, as in plans 32-01 through 32-03.
- Every task's `<acceptance_criteria>` was executed and passed; every task-level and plan-level `<verification>` command was executed and passed, including the three `-t` filters after deviation 2 corrected the one that was selecting zero tests.
- `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` — green, 65/65 outputs fresh.
- Full suite: `npx vitest run --exclude '**/scripts/e2e/**'` — 72 files, 4595 passed, 2 skipped, 0 failed.
