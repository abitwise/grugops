---
phase: 31-autonomous-manual-testing
plan: 32
subsystem: testing
tags: [gap-closure, round-7, uat-spec-integrity, oracle, input-boundary, gate-lowering]
requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-28's corpus and its two derived denominators (CORPUS_COVERAGE, RESIDUAL_COVERAGE, row() markers)"
  - phase: 31-autonomous-manual-testing
    provides: "D-30's SKIPPED_DIRECTORIES membership, including the `.temp` sub-decision 3 a named human opened"
  - phase: 31-autonomous-manual-testing
    provides: "D-28's {0,1,2} exit-code partition, re-measured unmoved as this plan's control"
provides:
  - "a GREEN excluded-e2e suite at the round-7 harness, so 31-33..31-38 can measure their own fixes"
  - "an oracle for the corpus that reads no per-round-rewritten planning artifact, proven from the file's own AST"
  - "a monotone corpus row floor (CORPUS_ROW_FLOOR) that bounds deletion where the removed derivation used to"
  - "SKIPPED_DIRECTORY_DISCLOSURE_MARKER and renderSkippedDirectoryDisclosure — the walk's input boundary, disclosed"
  - "D-33, the decision record for the removal, the disclosure and the two hygiene deletions"
affects: [scripts/runnable-ref/uat-spec-integrity.ts, scripts/runnable-ref/uat-spec-integrity.js, scripts/runnable-ref/uat-spec-integrity.test.ts, agent-factory/checklists/browser-uat-recipe.md]
actuals:
  tokens: 13900
  tasks: 3
  commits: 8
  commits_instrument: "git rev-list --count d484b9e..HEAD at the plan's closing (metadata) commit, which is the eighth; the seven before it are listed in Task Commits below"
  tokens_instrument: "chars/4 over `git diff d484b9e..HEAD --unified=0` added/removed lines (55,452 chars). The plan's 85,000-token estimate is on a different, larger instrument; the two are not compared here."
tech-stack:
  added: []
  patterns:
    - "a monotone floor (can only under-claim, red on deletion) in place of a set literal mirroring a moving document"
    - "a banned name ASSEMBLED at run time, never written whole, when the scanned file is itself in the scan set"
    - "a format adapter that DERIVES a node-test TAP summary from a real vitest transcript, so RED evidence can be classified without fabricating a result"
key-files:
  created:
    - docs/audit/29-style-dispositions/31-32.md
  modified:
    - scripts/runnable-ref/uat-spec-integrity.ts
    - scripts/runnable-ref/uat-spec-integrity.js
    - scripts/runnable-ref/uat-spec-integrity.test.ts
    - agent-factory/checklists/browser-uat-recipe.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-33: remove-axis — chosen by a named human 2026-09-11; freeze-manifest (recommended) and derive-both-keep-review refused; recorded as a disclosed gate lowering"
  - "D-33 (2): the review-to-corpus coverage obligation is handed to 31-38 as a once-per-round recorded one-shot, and the weakness of a one-shot versus a per-run check is written down as the substance of the lowering"
  - "D-33 (3): CORPUS_ROW_FLOOR = 33, MEASURED from the file's own AST, keeps the row floor the removal would otherwise have dropped from 16 to 6 in silence"
  - "D-33 (5): `.temp` stays in SKIPPED_DIRECTORIES; the narrowing is DISCLOSED rather than reverted, because reverting would reverse a named human's D-30 sub-decision inside an agent-authored fix plan"
patterns-established:
  - "when a REMOVAL deletes half of a derived denominator, replace that half with a measured monotone floor rather than letting the denominator silently shrink"
  - "prove a coupling is GONE from the file's own syntax tree, with the walk's own literal count asserted non-zero first"
  - "a disclosure line is emitted only on a non-empty condition, so the unaffected run stays byte-identical and can be proven so with `cmp` against the pre-change artifact"
requirements-completed: [UATX-06]
coverage:
  - id: D1
    description: "The review-coverage axis is removed: REVIEW_MD, reviewFindingsNamingThisRunnable() and CORPUS_COVERAGE are deleted with their case, and nothing in the corpus file reads 31-REVIEW.md."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#D-33 (4): no string literal in this file names `31-REVIEW.md` — the oracle cannot move under the corpus"
        status: pass
      - kind: manual
        ref: "mutation: a `31-REVIEW.md` literal re-seeded into the file moved the case RED (expected [ '31-REVIEW.md' ] to deeply equal []), then reverted"
        status: pass
    human_judgment: false
  - id: D2
    description: "The corpus row floor survives the removal as a monotone floor: at least the residual register's length, and never fewer than the 33 rows measured from the file's own AST."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the corpus carries AT LEAST as many rows as the register produces, and never fewer than the D-33 floor"
        status: pass
      - kind: manual
        ref: "mutation: one row() marker deleted moved the case RED (expected 32 to be greater than or equal to 33), then reverted"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-35: the walk counts every entry it refuses to descend into and the runnable emits one stderr line naming each skipped directory and its hit count, changing no exit code and no finding count."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#names EVERY member of SKIPPED_DIRECTORIES and its hit count, one member per probe"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the disclosure moves no finding count and no exit code on the FINDING path either"
        status: pass
      - kind: unit
        ref: "scripts/uat-gate-exit-contract.test.ts (D-28 {0,1,2} partition, re-run unmoved)"
        status: pass
      - kind: manual
        ref: "six spawned probe repositories against the committed .js, before and after, with byte counts for both streams"
        status: pass
    human_judgment: false
  - id: D4
    description: "The zero-skip run is byte-identical across the change on both streams."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#a run with NOTHING skipped grows no line — stderr stays empty and stdout is the pass line"
        status: pass
      - kind: manual
        ref: "`cmp` of stdout and stderr captured from the pre-change committed .js (a273797) and from the post-change one, on the same probe root"
        status: pass
    human_judgment: false
  - id: D5
    description: "IN-16: the dead TestInfo canonical-head export and its literal-value assertion are gone from the source, the committed .js and the test file."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#IN-16: the dead canonical-head export is absent from the source, the committed .js and this file"
        status: pass
    human_judgment: false
  - id: D6
    description: "IN-17: the orphaned `is recorded with` clause is deleted from deriveDeclaredBindings's doc block and the D-30 (5) paragraph stands as its own sentence."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#IN-17: the deriveDeclaredBindings doc block carries no orphaned clause"
        status: pass
    human_judgment: false
  - id: D7
    description: "The boundary and its disclosure are published in browser-uat-recipe.md, bound BY VALUE to the exported constant in both directions, with a disposition row per changed clause."
    requirement: "UATX-06"
    verification:
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe's quoted SKIPPED_DIRECTORIES equals the exported constant, in both directions"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the recipe carries the disclosure marker BY VALUE, so the claim cannot drift from the emission"
        status: pass
      - kind: unit
        ref: "scripts/runnable-ref/uat-spec-integrity.test.ts#the boundary list PARTITIONS into register members and the bounded remainder"
        status: pass
    human_judgment: false
  - id: D8
    description: "D-33 is appended to 31-CONTEXT.md in the D-29..D-32 shape, recording the human's verbatim answer, the date, the two refused options, the gate lowering, the rejected WR-35 alternative, and what it does NOT establish."
    requirement: "UATX-06"
    verification:
      - kind: manual
        ref: ".planning/phases/31-autonomous-manual-testing/31-CONTEXT.md:1720 — read and compared against D-32's block structure"
        status: pass
    human_judgment: true
    rationale: "A decision record's adequacy is a judgement about whether a later reader can reconstruct what was chosen and what was given up. No automated check decides that."
duration: 47min
completed: 2026-09-11
status: complete
---

# Phase 31 Plan 32: The Coverage Oracle Removed, the Input Boundary Disclosed Summary

**A named human answered `remove-axis`, so the review-to-corpus coverage gate is deleted and recorded as a disclosed gate lowering; the round-7 harness is GREEN again; and the walk's input boundary now says what it narrowed instead of hiding it inside a clean pass.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-11T06:44:07Z
- **Completed:** 2026-09-11T07:30:58Z
- **Tasks:** 3 of 3 (Task 1 was the decision checkpoint, answered by a named human before this executor ran)
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

1. **The round-7 suite is GREEN.** At the round base it was `Test Files 1 failed | 63 passed (64)` / `Tests 1 failed | 4127 passed | 2 skipped (4130)`, re-measured in this session before anything was edited. At this plan's closing commit it is `Test Files 64 passed (64)` / `Tests 4137 passed | 2 skipped (4139)`. Plans `31-33` through `31-38` verify against that file, and a harness red at the base cannot tell any of them whether its own fix worked.

2. **The oracle that moved under the test is gone, and its absence is proven structurally.** `REVIEW_MD`, `reviewFindingsNamingThisRunnable()`, `CORPUS_COVERAGE` and the case `covers every 31-REVIEW.md finding that names this runnable, in BOTH directions` are deleted. A new case parses the corpus file with the host TypeScript and asserts no string literal in it equals `31-REVIEW.md`, after asserting its own walk saw a non-zero number of literals.

3. **The removal did not take the row floor with it.** The deleted case's sibling computed its floor as `CORPUS_COVERAGE`'s row total plus the residual register's length — 16. Deleting the literal alone would have dropped that to 6 in silence. `CORPUS_ROW_FLOOR`, measured at 33 from the file's own AST, keeps it and raises it.

4. **WR-35 is closed by disclosure, with D-30 sub-decision 3 left standing.** `deriveSpecPaths` now counts every entry it refuses to descend into, `SpecDerivation` carries the counts, and `runMain` emits one stderr line naming each skipped directory and its hit count — immediately after the derivation, so every outcome including the could-not-run ones carries it.

5. **IN-16 and IN-17 are closed with the review's own citations**, and the recipe publishes the boundary BY VALUE from the exported constant, bound in both directions.

6. **D-33 was recorded before a single source byte moved** — commit `5086b71`, ahead of every other commit in this plan.

## Task Commits

1. **Task 1: decision checkpoint** — no commit. Answered by a named human on 2026-09-11.
2. **D-33 recorded before any source edit** - `5086b71` (docs)
3. **Task 2 RED** - `cfe96f7` (test) — the failing case asserting no `31-REVIEW.md` literal survives
4. **Task 2 GREEN** - `8098554` (feat) — the axis removed, the row floor kept as a monotone floor
5. **Task 3 RED** - `a273797` (test) — six failing cases for the WR-35 disclosure, IN-16 and IN-17
6. **Task 3 GREEN** - `a22fb7a` (feat) — the disclosure, the dead export and the spliced clause
7. **Task 3 publication** - `6bc746e` (docs) — the recipe's boundary bullets and `docs/audit/29-style-dispositions/31-32.md`
8. **Task 3 correction** - `c56b42c` (fix) — the eight bullets folded into one registered bullet so the 31-13 partition holds

**Plan metadata:** the eighth and final commit of this plan — `31-32-SUMMARY.md`, `.planning/STATE.md` and `.planning/ROADMAP.md` — written after every measurement above was taken. Its own hash is not quoted here because this file is part of what it commits.

## Files Created/Modified

**Created**
- `docs/audit/29-style-dispositions/31-32.md` — a disposition row per changed recipe clause, plus the measurement stating that `check:diff-disposition` does not currently watch this recipe.

**Modified**
- `scripts/runnable-ref/uat-spec-integrity.ts` — `SKIPPED_DIRECTORY_DISCLOSURE_MARKER`, `renderSkippedDirectoryDisclosure`, `SpecDerivation.skippedDirectoryHits`, the counting branch in `deriveSpecPaths`, the emission in `runMain`, the `SKIPPED_DIRECTORIES` reason block, the IN-16 deletion, the IN-17 deletion.
- `scripts/runnable-ref/uat-spec-integrity.js` — rebuilt from the above; `npm run freshness` reports all 61 committed outputs match a rebuild.
- `scripts/runnable-ref/uat-spec-integrity.test.ts` — the axis deleted, `CORPUS_ROW_FLOOR` added, nine new cases, the `skipped-directories` entry in both non-residual boundary records.
- `agent-factory/checklists/browser-uat-recipe.md` — one new boundary bullet publishing `SKIPPED_DIRECTORIES` and the disclosure's properties.
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — D-33.

## Decisions Made

**The human's answer, verbatim, given 2026-09-11:**

> remove-axis

**Options refused:** `freeze-manifest` — the plan's own recommendation, which would have created `docs/audit/31-review-corpus-manifest.md` as a frozen expected-side authority — and `derive-both-keep-review`, which would have kept the suite reading `31-REVIEW.md`.

**The measured premise the decision was taken against, re-measured in this session before any edit:**

```
 FAIL  scripts/runnable-ref/uat-spec-integrity.test.ts > uat-spec-integrity — 31-28 MOVEMENT 1: the
       corpus's denominator is DERIVED, not typed > covers every 31-REVIEW.md finding that names
       this runnable, in BOTH directions
AssertionError: expected [ 'CR-23', 'CR-25', 'IN-16', …(3) ] to deeply equal
                         [ 'CR-18', 'CR-21', 'IN-15', …(3) ]
- Expected: CR-18, CR-21, IN-15, WR-26, WR-29, WR-30
+ Received: CR-23, CR-25, IN-16, IN-17, WR-33, WR-35
 Test Files  1 failed (1)      Tests  1 failed | 324 passed (325)
```

The ids that differ are every id on both sides: the received set is round 7's review, the expected set is round 5's `CORPUS_COVERAGE` literal. The commit that turned it red changed zero source bytes.

**D-33 is written as a GATE LOWERING, in clear voice, not softened.** Until this plan, a review finding naming this runnable that no corpus row covered turned the suite red on every run. Nothing in the suite observes that relationship now. A finding can be raised, and a round can close, with no covering row and every test green. That is strictly less checking than the tree carried before. The obligation is handed to `31-38` as a once-per-round recorded one-shot, and D-33 (2) states plainly that a one-shot can be skipped and that skipping it leaves no red — that weakness is the substance of the lowering.

**The rejected WR-35 alternative is named with its reason.** Reverting `.temp` from `SKIPPED_DIRECTORIES` and keeping the closure at the runner was REFUSED: it would reverse a named human's D-30 sub-decision inside an agent-authored fix plan, and it would reopen the harm round 5 measured.

## Measurements Taken

**WR-35, reproduced with its own harm.** Six probe repositories were built under `.temp/31-32/` and driven against the committed `.js` at the round base — one with nothing hidden, five with a clean uat spec hidden under one `SKIPPED_DIRECTORIES` member each:

```
[none]         EXIT=0  stdout=58B  stderr=0B
[.temp]        EXIT=0  stdout=58B  stderr=0B
[node_modules] EXIT=0  stdout=58B  stderr=0B
[.git]         EXIT=0  stdout=58B  stderr=0B
[dist]         EXIT=0  stdout=58B  stderr=0B
[tools]        EXIT=0  stdout=58B  stderr=0B
```

No reader can tell them apart. After the change, each member is named with its hit count on stderr while the exit code and stdout are unmoved:

```
[.temp]  EXIT=0  stdout=58B  stderr=209B
  stderr: UAT spec integrity: the walk SKIPPED directory entries by name: .temp=1, node_modules=1 — these
          directory names are the walk's input boundary, so nothing under them is in the derived total
          this run reports.
[tools]  EXIT=0  stdout=58B  stderr=209B
  stderr: … tools=1 …            [.git] 208B … .git=1 …          [dist] 208B … dist=1 …
[node_modules] EXIT=0 stdout=58B stderr=200B   [none] EXIT=0 stdout=58B stderr=200B
```

Note the honest consequence: a probe whose `node_modules` is a REAL directory is not a zero-skip run, and the disclosure correctly names it. Every real host repository will therefore see the line. That is the boundary being legible, which is the point.

**Byte identity of the zero-skip run, proven with `cmp`.** A probe whose `node_modules` is a SYMLINK reaches the walk's symbolic-link branch rather than the boundary, so it skips nothing:

```
$ node <pre-change .js from a273797> <probe-root>   EXIT=0  stdout=58B  stderr=0B
$ node scripts/runnable-ref/uat-spec-integrity.js <probe-root>   EXIT=0  stdout=58B  stderr=0B
$ cmp before/zeroskip.stdout after/zeroskip.stdout   -> BYTE-IDENTICAL
$ cmp before/zeroskip.stderr after/zeroskip.stderr   -> BYTE-IDENTICAL
```

**Mutation discrimination, each seeded and reverted.**

| seeded mutation | case | observed |
|---|---|---|
| a `31-REVIEW.md` literal re-added | D-33 (4) AST case | RED: `expected [ '31-REVIEW.md' ] to deeply equal []` |
| one `row("…")` marker deleted | the D-33 floor case | RED: `expected 32 to be greater than or equal to 33` |
| `.temp` dropped from the recipe's quoted list | recipe both-directions case | RED: `the recipe's published boundary and the decided one disagree` |
| one published property sentence reworded | recipe marker case | RED: `the recipe does not publish: The disclosure moves no exit code and no finding count.` |

**Closing gates.**

```
npm run build && npm run typecheck && npm run check:build-parity && npm run freshness
  -> exit 0; "All build outputs fresh: 61 committed .js file(s) match a rebuild of their sources."
npx vitest run --exclude '**/scripts/e2e/**'
  -> Test Files 64 passed (64) | Tests 4137 passed | 2 skipped (4139)
npm run check:diff-disposition -> 80 finding(s) over 39 elements   (unchanged; 31-31 recorded 80)
npm run check:claim-anchors / check:banned-claims / check:imperative-lexicon / check:audit-register -> ALL CHECKS PASSED
git diff d484b9e..HEAD -- package.json package-lock.json -> empty (T-31-32-SC)
find .temp -mindepth 1 -> empty;  named-pipe sweep -> empty
git diff d484b9e..HEAD -- .planning/REQUIREMENTS.md .planning/ROADMAP.md -> empty
```

## Deviations from Plan

**[Adaptation - Human decision] The plan's Tasks 2 and 3 were written for `freeze-manifest`; they were executed for `remove-axis`.**
- **Found during:** Task 2, before any edit.
- **Issue:** The plan's MOVEMENT 2 through MOVEMENT 5, its artifact table, its `files_modified` list and four of its acceptance criteria describe a frozen manifest, a `row(id, ...covers)` rest parameter, a `declaredCorpusFindingIds()` derivation and a both-directions equality. None of those exist under the option the human chose.
- **Fix:** `docs/audit/31-review-corpus-manifest.md` was NOT created. `row()`'s signature was NOT changed and no row id moved (`git diff d484b9e..HEAD` shows zero `row("…")` additions or deletions). `REVIEW_CORPUS_MANIFEST`, `declaredCorpusFindingIds()` and the manifest parser were not written. The structural half of MOVEMENT 5 WAS kept, because proving the coupling is gone is more load-bearing under a removal than under a freeze.
- **Files:** `scripts/runnable-ref/uat-spec-integrity.test.ts`; `docs/audit/31-review-corpus-manifest.md` deliberately absent.
- **Verification:** the plan's `files_modified` list and this summary's `key-files` differ by exactly that one file, stated here rather than left for a reader to notice.
- **Committed in:** `8098554`.

**[Rule 2 - Missing critical] The removal would have silently dropped the corpus row floor from 16 to 6.**
- **Found during:** Task 2 GREEN.
- **Issue:** The third case of the `31-28 MOVEMENT 1` block computed `derivedRowCount` as `CORPUS_COVERAGE`'s row total (10) plus the residual register's length (6). Deleting `CORPUS_COVERAGE` as instructed removes 10 from that floor with nothing said. A second gate lowering nobody chose is exactly what D-30 (4)'s own sentence forbids.
- **Fix:** `CORPUS_ROW_FLOOR`, measured from the file's own AST, added beside the surviving residual-derived half. Disclosed in D-33 (3) as a hand-typed number that can only be wrong by under-claiming.
- **Files:** `scripts/runnable-ref/uat-spec-integrity.test.ts`, `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`.
- **Verification:** mutation-proven — one deleted `row()` marker moves the case RED.
- **Committed in:** `8098554`.

**[Rule 1 - Bug in this plan's own record] D-33's first draft carried 34 as the measured row count; the measurement is 33.**
- **Found during:** Task 2 GREEN, on the first run after the floor was added.
- **Issue:** 34 came from `grep -o 'row("[^"]*")' | sort -u`. Two of those occurrences sit inside DOC COMMENTS and `declaredCorpusRowIds()`'s AST walk does not count a comment. A floor typed one above the measurement is a floor that is red on the day it is written, and it was.
- **Fix:** the constant and D-33 (3) both corrected to 33, and the correction is recorded in D-33 rather than silently overwritten, with the reason the two instruments disagree.
- **Files:** `scripts/runnable-ref/uat-spec-integrity.test.ts`, `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`.
- **Verification:** the case passes at 33 and fails at 32.
- **Committed in:** `8098554`.

**[Rule 1 - Bug] The eight recipe bullets turned the 31-13 boundary-list partition RED.**
- **Found during:** the first full-suite run after the recipe edit.
- **Issue:** `scripts/runnable-ref/uat-spec-integrity.test.ts`'s 31-13 case partitions the recipe's boundary list into `UNRESOLVABLE_CALLEE_RESIDUALS` members and decided non-residual entries. Eight new bullets landed in neither bucket and the case named all eight — it did exactly what it exists to do.
- **Fix:** the gate was left standing. The eight sentences were folded into ONE wrapped bullet, the shape the list's other long entries already use, and registered once as `skipped-directories` in both `NON_RESIDUAL_OPENERS` and `NON_RESIDUAL_BOUNDARY_BULLETS` with a written reason. The recipe-binding case was changed to fold whitespace before matching, because a raw substring search over a wrapped bullet asserts about the document's line width.
- **Files:** `agent-factory/checklists/browser-uat-recipe.md`, `scripts/runnable-ref/uat-spec-integrity.test.ts`, `docs/audit/29-style-dispositions/31-32.md`.
- **Verification:** full excluded-e2e suite green.
- **Committed in:** `c56b42c`.

**[Rule 3 - Blocker] Task 1's `read_first` cited a `31-REVIEW.md` Anti-Patterns row that does not exist.**
- **Found during:** Task 1, by the previous executor; re-verified here.
- **Issue:** the plan directs the reader to "the Anti-Patterns table row naming `CORPUS_COVERAGE (7838-7845)`". `grep -a` over `31-REVIEW.md` (UTF-8, 40,420 bytes) finds no such row.
- **Fix:** the equivalent substance was read from `31-VERIFICATION.md:392` and `:183`, and the premise was independently re-measured in this session by running the failing case. The citation is recorded as unsubstantiated rather than quietly satisfied.
- **Files:** none.
- **Verification:** the RED transcript quoted above.
- **Committed in:** n/a — a record, not an edit.

**[Adaptation] Two acceptance criteria were restated because their literal form is unsatisfiable.**
- `grep -n "31-REVIEW.md" scripts/runnable-ref/uat-spec-integrity.test.ts` prints nothing — RESTATED as "no string LITERAL in the file equals it, asserted from the file's own AST". Three comment lines in the file name the document in prose, which is a description of the removal and not a read of it; the AST case is the assertion that matters, and a comment is not a read.
- `grep -rn TEST_INFO_CANONICAL_HEAD --include=*.md . | grep -v node_modules` prints nothing — RESTATED as "absent from the source, the committed `.js` and the test file". `31-REVIEW.md` IN-16 names the identifier in the finding itself, so the literal criterion could only be met by editing the review that raised it.

**[Adaptation] `docs/audit/29-style-dispositions/31-32.md` is a record, not a gate-satisfying companion.**
- `check:diff-disposition`'s watched corpus is the 40-file LANG-03 union (36 kit files + 3 registry residue + 1 register row); `agent-factory/checklists/browser-uat-recipe.md` is in none of those parts. Measured: eight clauses were added and the gate's count stayed at exactly 80 findings over 39 elements with no finding naming the recipe. The file is written anyway and says so in its own first section. Claiming the gate accepted it would be a fabricated green.

**[Adaptation] The RED-evidence classifier parses `node --test` TAP, which vitest does not emit.**
- `gsd_run check tdd-red-evidence` requires unindented `not ok N - <name>` lines and a `# tests / # pass / # fail` summary. Vitest's default reporter emits neither; `--reporter=tap-flat` supplies the first and nothing supplies the second. A ten-line adapter was written that reads the REAL transcript and COUNTS its own `ok` / `not ok` lines to append the summary — every number derived from the run, none typed. Both RED records then classified `RED_EVIDENCE_OK (target_test_failed)`. The adapter is disclosed here so a reader can re-derive the numbers; it transforms a format, it does not produce a result.

**[Adaptation] The recipe-binding cases were mutation-proven rather than written RED-first.**
- The two `browser-uat-recipe.md` cases were authored after the recipe bullet, not before it. Their discrimination was established by seeding a mutation into the recipe and watching each case move red, then reverting — both transcripts are in the Measurements table. Recorded as an ordering deviation rather than presented as a RED-first sequence it was not.

**Total deviations:** 8 (3 auto-fixes under Rules 1-3, 5 adaptations forced by the human's `remove-axis` answer or by an unsatisfiable criterion).
**Impact on plan:** the plan's stated purpose — a round-7 harness whose reading does not depend on which document was committed last, plus a disclosed input boundary — is met. Its stated MECHANISM for the first half is not, because a named human chose a different one and this plan implements the answer rather than the recommendation. One planned artifact (`docs/audit/31-review-corpus-manifest.md`) is deliberately absent.

## Issues Encountered

- **The `[none]` probe is not a zero-skip run when `node_modules` is a real directory.** Caught by the first post-change test run. The zero-skip control was re-pointed at a symlinked-`node_modules` target, which reaches the walk's symbolic-link branch instead of the boundary. Recorded because it is a real property of the disclosure: every ordinary host repository will now see a `node_modules=1` line.
- **The AST case's own predicate literal made it unpassable in its first draft.** Writing `l === "31-REVIEW.md"` put the banned literal into the scanned file. The needle is now assembled at run time (`["31", "REVIEW.md"].join("-")`), the same defence the file's existing framework-type scan already uses.
- **Probe residue turned the suite red once.** The WR-35 shell probes left roots under `.temp/31-32/`, and the corpus's own POINT 7 residue case caught it by a real listing. The roots were removed; `find .temp -mindepth 1` prints nothing at the closing commit.

## Known Stubs

None.

## Threat Flags

None. The one new surface — a stderr line carrying directory names and counts — is `T-31-32-03` in this plan's own register, disposition `accept`, and the acceptance is honoured: the line carries no path and no file content, and it is emitted only on a non-empty skip set.

## User Setup Required

None.

## Next Phase Readiness

**The harness is green, so `31-33` through `31-38` can measure their own fixes.** That was this plan's reason for being first in the round.

**The obligation `remove-axis` created belongs to `31-38`, and it is named so a later reader can check whether it was met.** This round's closing measurement must assert the review-to-corpus coverage ONCE, as a recorded one-shot: derive the set of `31-REVIEW.md` findings naming `scripts/runnable-ref/uat-spec-integrity.ts`, state which corpus row covers each, and record any finding with no covering row as an open item with an owner. At this plan's closing commit that set is `CR-23`, `CR-25`, `IN-16`, `IN-17`, `WR-33`, `WR-35`; `IN-16` and `IN-17` are closed here and the other four belong to later plans in this round. Nothing in the suite will turn red if `31-38` skips this. That is the lowering, and it is written into D-33 (1) and D-33 (2) in those words.

**Unchanged and still open by design:** `UATX-01` through `UATX-06` are unchecked in `.planning/REQUIREMENTS.md`, the Phase 31 checkbox is unchecked in `.planning/ROADMAP.md`, and every traceability row still reads `Gaps Found`. Both files are byte-unchanged by this plan. Only a verification round may flip one.

**Carried forward:** the `check:diff-disposition` debt stands at 80 findings over 39 elements, owned by `31-04`/`31-05`/`31-06`/`31-08`/`31-15`/`31-29`; this plan added none. The Windows behaviour of the new disclosure line is unmeasured and joins the phase's standing Windows remainder.

## TDD Gate Compliance

Both `tdd="true"` tasks carry a RED commit and a GREEN commit, and both RED records classified `RED_EVIDENCE_OK (target_test_failed)`:

| task | RED | GREEN | target test | classifier |
|---|---|---|---|---|
| 2 | `cfe96f7` | `8098554` | `D-33 (4): no string literal in this file names \`31-REVIEW.md\`…` | `RED_EVIDENCE_OK` — tests 1, pass 0, fail 1 |
| 3 | `a273797` | `a22fb7a` | `names EVERY member of SKIPPED_DIRECTORIES and its hit count, one member per probe` | `RED_EVIDENCE_OK` — tests 7, pass 1, fail 6 |

The Task 3 RED run produced six failures, one of which was a `TypeError` for the not-yet-written `renderSkippedDirectoryDisclosure`. The evidence record was targeted at a case that failed on a clean assertion, never on the crash. The one PASSING case in that run was the zero-skip control, which must already hold before the change and did.

## Self-Check: PASSED

- `docs/audit/29-style-dispositions/31-32.md` — FOUND
- `scripts/runnable-ref/uat-spec-integrity.ts` / `.js` / `.test.ts` — FOUND
- `agent-factory/checklists/browser-uat-recipe.md` — FOUND
- `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — FOUND
- Commits `5086b71`, `cfe96f7`, `8098554`, `a273797`, `a22fb7a`, `6bc746e`, `c56b42c` — all FOUND in `git log --oneline --all`
- Every acceptance criterion re-run at the closing commit; every plan-level `<verification>` line re-run. Results quoted in "Closing gates" above.
