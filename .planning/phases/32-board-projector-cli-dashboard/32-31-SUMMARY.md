---
phase: 32-board-projector-cli-dashboard
plan: 31
subsystem: testing
tags: [import-closure, specifier-partition, read-only-guard, typescript, vitest, canonical-form]

requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "32-20's canonical-form module-identity rule and the acquisitions PREMISE case, which is the write-detection mechanism this plan's foreign refusal reds through"
  - phase: 30-shared-kit-install
    provides: "scripts/js-import-closure.ts — the derived closure walker seven production gates build their mirrors from"
provides:
  - "classifySpecifier — the ONE exported authority on a module specifier's class, with a total three-way partition (bare | relative | foreign) whose third bucket is refused by construction"
  - "stripNonCode + moduleSpecifiers — the specifier scan's input is CODE rather than prose, measured 13 foreign-classified false positives before, 0 after"
  - "jsImportClosureFacts — the walk reports a foreign edge at a named position so both consumers can reach the refusal; jsImportClosure keeps its signature and carries the throw"
  - "ModuleFacts.foreignSpecifiers / ClosureFacts.foreignSpecifiers — a two-sided specifier-class census in the read-only guard, merged with the walk's own refused edges"
  - "A measured per-row exit-code flip on the COMMITTED scripts/board-read.js for the three spellings 32-24-RED-baseline.txt found green over a live writer"
affects: [32-32, 32-33, 32-34, 32-35, 32-36, 32-37, dashboard-read-only-guard, closure-walker-callers]

actuals:
  tokens: 64056
  tasks: 3
  commits: 4
plan_head_before: e87fd46c9b274443590c29538452fab2b5ecf96b

tech-stack:
  added: []
  patterns:
    - "Canonical-form cutover: replace a syntactic COMPLEMENT with a total PARTITION whose third bucket refuses by construction"
    - "One authority per predicate, enforced structurally: a case over this file's own AST refuses any second class-deciding prefix test, with one named and counted exclusion"
    - "Relocation accounting: when a refusal changes hands, measure the before-authority AND the after-authority per spelling, and require the MECHANISM (not the census) among the post-cutover failures"
    - "Mutation-first control proof: every new refusal branch is watched to FAIL before it is believed"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-31-GREEN-proof.txt
  modified:
    - scripts/js-import-closure.ts
    - scripts/js-import-closure.js
    - scripts/board-readonly.test.ts

key-decisions:
  - "The partition's arms are written as POSITIVE tests (`relative` and `bare` state what they ARE) and `foreign` is their complement, so totality is by construction rather than by enumeration"
  - "The walk was SPLIT rather than made to throw: jsImportClosureFacts reports foreign edges and jsImportClosure carries the refusal, because a throwing walk makes the guard's own census unreachable — a predicate that is never ASKED cannot refuse"
  - "stripNonCode blanks comments and template-literal TEXT but keeps the CODE inside ${…} substitutions, because blanking a substitution would remove a real import statement — the conservative direction the plan's own prohibition names"
  - "isBareSpecifier was DELETED, not widened; a structural case over this file's AST now refuses any second class-deciding prefix test, with normalizeSpecifier as the single named, counted exclusion (it answers module IDENTITY, not class)"
  - "A `require(\"…\")` specifier is censused and refused by the GUARD but not followed or refused by the WALKER — recorded as a named residual in 32-31-GREEN-proof.txt § 4 rather than closed by adding a fourth scan pattern this plan did not measure the closure impact of"

patterns-established:
  - "Mutation-derived row discovery: M1 (drop the backslash clause) reddened NOTHING on its first run, which is how the `probe\\writer.mjs` row was found — a clause no mutation can red is a clause that decides nothing"
  - "Relocated-refusal rows carry authorityBefore, authorityAfter and the case name, and a case asserts the named case actually exists in the file"

requirements-completed: [DASH-06, DASH-08]

coverage:
  - id: D1
    description: "A module specifier's class is decided by one exported authority, and the partition is total: every spelling lands in exactly one of bare | relative | foreign"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#PREMISE: the partition has exactly three classes and they are the three named ones"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts# 15 per-spelling rows of SPECIFIER_CLASS_ROWS (`<spelling> classifies as <class>`)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the classes the spelling table EXERCISES are exactly the classes the partition has"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both consumers ask that one authority — the read-only guard decides no specifier's class itself"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#this file decides no specifier's class itself — it asks the one authority"
        status: pass
      - kind: integration
        ref: "npm run check:dashboard-readonly (135 passed, exit 0 on the unplanted tree)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each of the three spellings the baseline measured GREEN over a live writer now makes the shipped gate exit non-zero on the COMMITTED .js, with the acquisitions PREMISE case among the failures"
    requirement: DASH-06
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-31-GREEN-proof.txt § 2 — six-row flip table, three rows `exit 0 -> exit 1`, harness-measured"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts# 3 rows of BASELINE_GREEN_SPECIFIER_ROWS (`a writer imported through … is REFUSED`)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The three refusals that RELOCATE (file://, C:\\, data:) are at least as strong after the cutover as before — measured at the write-detection mechanism, not assumed"
    requirement: DASH-06
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts# 3 rows of RELOCATED_SPECIFIER_ROWS (`the refusal of … MOVED and did not weaken`)"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/32-board-projector-cli-dashboard/32-31-GREEN-proof.txt § 3 — per-spelling authority table, 6 failed -> 65 failed for file:// and C:\\"
        status: pass
    human_judgment: false
  - id: D5
    description: "The scan's input is code rather than prose, and the narrowing removed no real import from any caller's mirror"
    requirement: DASH-08
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the specifier scan's INPUT is code: a foreign spelling in a comment yields no row"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#stripNonCode removes no real code: a substitution's code survives, and length is preserved"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts# 9 rows of CLOSURE_BASELINES (`the closure of … is byte-for-byte what it was before the cutover`)"
        status: pass
      - kind: integration
        ref: "npm run freshness && npm run freshness:context && npm run freshness:guarantees && npm run freshness:queue && npm run freshness:traceability && npm run check:platform-shapes (all exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The legitimate tree and the wider suite are unchanged: build parity, freshness, the structure validator, the foundation guard and the full regression lane"
    requirement: DASH-08
    verification:
      - kind: integration
        ref: "npm run build && npm run typecheck && npm run check:build-parity && npm run freshness (exit 0; 65 committed .js match a rebuild)"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (5020 passed | 2 skipped; 32-VERIFICATION.md baseline 4974)"
        status: pass
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js && node scripts/check-foundation-guards.js (exit 0)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The DASH-08 concurrency probe: a green check:dashboard-readonly over a tree whose committed .js does not match its .ts is bounded by build parity and freshness, which are separate commands"
    requirement: DASH-08
    verification: []
    human_judgment: true
    rationale: "Authored as a `verification: backstop` truth in the plan. The bound is real and its two commands were run to exit 0 here, but no test in this repository RACES a build against the guard, so the claim that interleaving cannot produce a false green is an argument about the commands' contract rather than a measurement. A human should weigh whether the phase wants a racing probe."

duration: 40 min
completed: 2026-09-16
status: complete
---

# Phase 32 Plan 31: Specifier-Class Cutover Tracer Summary

**A total three-way module-specifier partition with one exported authority, wired through both the closure walker and the read-only guard, flipping the shipped gate from exit 0 at 89/89 to exit 1 over the three absolute/protocol-relative writer spellings 32-24 measured green.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-09-16T06:42:00Z
- **Completed:** 2026-09-16T07:22:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 source, 1 planning artifact)

## Accomplishments

- **The complement became a partition.** `classifySpecifier` in `scripts/js-import-closure.ts` is now the only function in this repository that decides a module specifier's class. `relative` and `bare` are stated as POSITIVE tests; `foreign` is their complement and exists so no spelling can fall outside all three. The two predicates it replaced — the guard's `!startsWith(".") && !startsWith("/")` and the walker's three dot-leading patterns — disagreed about every specifier beginning with `/`, which is exactly the hole `32-24-RED-baseline.txt` measured.
- **The refusal is reachable at both positions.** `jsImportClosureFacts` performs the walk and REPORTS foreign edges; `jsImportClosure` keeps its signature and raises `ImportClosureError` naming every one. The guard's `analyzeClosure` calls the non-throwing facts function precisely so its own census stays reachable, and merges the walk's refused edges into the same field.
- **The measured flip, on the artifact a host runs.** With the § 3.1 absolute-path writer planted into the COMMITTED `scripts/board-read.js`: `npm run check:dashboard-readonly` went from `exit 0, 89 passed (89)` to `exit 1, 65 failed | 70 passed (135)`, with `PREMISE: no closure module acquires a module by a route that is not a static literal import` among the failures, naming `scripts/board-read.js: FOREIGN SPECIFIER "/private/tmp/…"`. All three baseline-green rows flip; the three already-refused rows get strictly stronger refusals.
- **The relocation was measured, not assumed.** `file://`, `C:\` and `data:` left the builtin allow-list and arrived at the foreign branch. Before: 6 failing cases, none of them the write-detection premise. After: 65, with the premise among them. Per-spelling, in `RELOCATED_SPECIFIER_ROWS` and in the proof's authority table.
- **Nothing legitimate moved.** All nine caller-entry closures are byte-for-byte what they were before the cutover, pinned in `CLOSURE_BASELINES` against lists measured off the PRE-cutover committed `.js`. Every caller gate, the structure validator, the foundation guard and the full 5020-case regression lane exit 0.

## Task Commits

1. **Task 1 RED: failing cases for the three baseline-GREEN spellings** — `2b3ed970` (test)
2. **Task 1 GREEN: one specifier-class authority, wired through both consumers** — `ee73c5a9` (feat)
3. **Task 2: partition proved total, three relocated refusals measured at the mechanism** — `423fb181` (test)
4. **Task 3: the measured per-row flip on the committed .js** — `05a57278` (docs)

**Plan metadata:** see the `docs(32-31)` commit that carries this file.

_Task 1 is a TDD tracer and produced the RED → GREEN pair. Task 2 added no production behavior (see TDD Gate Compliance) and is committed as `test`._

## Files Created/Modified

- `scripts/js-import-closure.ts` — `SpecifierClass`, `SPECIFIER_CLASSES`, `classifySpecifier`, `stripNonCode`, `moduleSpecifiers`, `ClassifiedSpecifier`, `ForeignEdge`, `ImportClosureFacts`, `jsImportClosureFacts`; `relativeSpecifiers` became a view; `jsImportClosure` became a thin wrapper carrying the foreign refusal
- `scripts/js-import-closure.js` — the committed twin, rebuilt from its `.ts` in the same commit (`check:build-parity` and `freshness` both exit 0)
- `scripts/board-readonly.test.ts` — `isBareSpecifier` deleted; `ModuleFacts`/`ClosureFacts` gain `foreignSpecifiers`; `noteSpecifier` switches on the imported authority; `SPECIFIER_CLASS_ROWS` (15), `BASELINE_GREEN_SPECIFIER_ROWS` (3), `RELOCATED_SPECIFIER_ROWS` (3), `CLOSURE_BASELINES` (9), the one-authority structural case and the walker-position refusal case. 89 → 135 cases
- `.planning/phases/32-board-projector-cli-dashboard/32-31-GREEN-proof.txt` — the flip table, the authority table, the position table, the converse rows, the reachability paragraph, the mutation transcripts and the residue record

## Decisions Made

- **The walk was split rather than made to throw.** A walker that threw the instant it met a foreign specifier would make the guard's own census unreachable — the guard calls the walk to get the module set it then analyses, so a throw means the census never runs. A predicate that is never ASKED cannot refuse. `jsImportClosureFacts` reports; `jsImportClosure` refuses.
- **`stripNonCode` keeps the code inside `${…}`.** The plan said "replace every template literal with whitespace". Blanking a substitution wholesale would delete real code, and the plan's own prohibition list forbids narrowing the scan's input by a rule that could remove a real import statement. So the literal TEXT spans are blanked and substitution code survives — a strictly more conservative reading, with its own converse case (`stripNonCode removes no real code`) and mutation M4 proving the case decides something.
- **`isBareSpecifier` was deleted and its absence asserted structurally.** A case walks this file's own AST and refuses any `startsWith` on a class-bearing prefix, with `normalizeSpecifier` as the single named, counted exclusion plus a premise asserting that exclusion is still load-bearing. A fourth prefix arm now has nowhere to live.
- **Regular-expression literals are recognised by `stripNonCode`.** Without it a pattern such as `/https?:\/\//` reads as the start of a line comment and blanks the rest of its line. Not in the plan text; added because the scanner's input is 65 tracked `.js` files including this repository's own regex-heavy ones.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `stripNonCode` preserves template-substitution code**
- **Found during:** Task 1 (implementing `stripNonCode`)
- **Issue:** The plan's action text says "replace every line comment, every block comment and every template literal with whitespace of equal length". Blanking a template literal WHOLE deletes the code inside `${…}`, and `${ (await import("./inside.js")).name }` is a real import statement. The plan's own prohibition list forbids narrowing the scan's input by a rule that could remove a real import statement.
- **Fix:** Blank the template's literal TEXT spans and recurse into substitutions as code, with an explicit docblock paragraph saying so and a converse case asserting a substitution's import survives.
- **Files modified:** `scripts/js-import-closure.ts`, `scripts/js-import-closure.js`, `scripts/board-readonly.test.ts`
- **Verification:** mutation M4 (blank substitutions whole) reds `stripNonCode removes no real code: a substitution's code survives, and length is preserved`; all nine `CLOSURE_BASELINES` rows unchanged
- **Committed in:** `ee73c5a9`

**2. [Rule 2 - Missing Critical] `stripNonCode` recognises regular-expression literals**
- **Found during:** Task 1
- **Issue:** A naive comment scanner reads `/https?:\/\//` as `/` + `/` and blanks the rest of the line, silently deleting whatever follows a regex on that line.
- **Fix:** A prev-token heuristic (punctuation set plus keyword set) distinguishes a regex literal from division; the literal is skipped intact.
- **Files modified:** `scripts/js-import-closure.ts`, `scripts/js-import-closure.js`
- **Verification:** all 65 tracked `.js` preserve length exactly under `stripNonCode`; all nine `CLOSURE_BASELINES` rows unchanged; 5020-case suite green
- **Committed in:** `ee73c5a9`

**3. [Rule 2 - Missing Critical] A fifteenth row: `probe\writer.mjs` (Windows relative path, no drive letter)**
- **Found during:** Task 2 (mutation probing)
- **Issue:** Mutation M1 — dropping the backslash clause from `classifySpecifier` — reddened NOTHING. `C:\x\writer.mjs` is already refused by the scheme check because `C` is not `node`, so the clause had no load-bearing input in the 14-row table. Without the clause, `probe\writer.mjs` reads as a package called `probe` and is SKIPPED.
- **Fix:** Added the row to `SPECIFIER_CLASS_ROWS` (14 → 15, count pin and its message moved with it) and re-ran M1, which now reds it.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** mutation M1 transcript in `32-31-GREEN-proof.txt` § 7
- **Committed in:** `423fb181`

**4. [Rule 2 - Missing Critical] A case asserting the WALKER position refuses**
- **Found during:** Task 2 (mutation probing)
- **Issue:** Mutation M5 — making `jsImportClosure` stop refusing a foreign edge — reddened nothing, because `analyzeClosure` deliberately calls the non-throwing facts function. The wrapper's refusal, which is the position all seven production callers reach, was asserted nowhere.
- **Fix:** Added `the WALKER position refuses too: jsImportClosure throws, naming the module and the specifier`, asserting the error name, the module and the specifier.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** M5 now reds exactly that case
- **Committed in:** `423fb181`

**5. [Rule 3 - Blocking] `validate-agent-factory.js` needs `VALIDATE_KIT_ROOT`**
- **Found during:** Task 2 (running every caller gate)
- **Issue:** `node scripts/validate-agent-factory.js` exits 1 with "VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)". Pre-existing behaviour of that script, unrelated to this plan.
- **Fix:** Supplied the kit root (`VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`), which exits 0 with ALL CHECKS PASSED. Nothing in the repository was changed.
- **Files modified:** none
- **Verification:** exit 0, recorded in `32-31-GREEN-proof.txt` § 5 with the note
- **Committed in:** n/a (no code change)

---

**Total deviations:** 5 auto-fixed (4 missing critical, 1 blocking)
**Impact on plan:** Deviations 1 and 2 make the scan's narrowing strictly safer and are required by the plan's own prohibition list. Deviations 3 and 4 close two places where a new rule decided nothing, both found by mutation rather than by reading. No scope creep: every change is inside the three files the plan names.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Status |
|------|-----|-------|----------|--------|
| Task 1 (tracer, `tdd="true"`) | ✓ `2b3ed970` | ✓ `ee73c5a9` | — (no cleanup needed) | Pass |
| Task 2 (`tdd="true"`) | n/a — see below | n/a | — | Advisory |

**Task 1 RED evidence, verified:** `npx vitest run --reporter=tap-flat --exclude '**/scripts/e2e/**' scripts/board-readonly.test.ts` → exit 1, `3 failed | 90 passed (93)`, each failing on the intended assertion (`Collected acquisitions: []: expected 0 to be greater than 0`). `gsd-tools check tdd-red-evidence` returned **`RED_EVIDENCE_OK` (`target_test_failed`)**, authorizing GREEN. One transcription note for the audit trail: vitest's TAP reporters emit no `# tests / # pass / # fail` summary lines, so those three lines were COUNTED from that same run's own `ok`/`not ok` lines and appended so the classifier could parse it. No `ok`/`not ok` line was added, removed or renamed.

**Task 2 has no RED, and that is a real finding rather than a skipped gate.** Task 2's `<behavior>` is entirely about behaviour Task 1's tracer already shipped — the plan scopes Task 2's files as the test file plus `js-import-closure.ts` "if it moved", and it did not move. Writing Task 2's cases first would have produced the fail-fast rule's "unexpected GREEN in RED phase": the feature already exists. It was investigated and that is the answer. Discrimination was therefore proven by MUTATION instead, which is the stronger instrument here: six mutations against the committed `.js`, each reddening a named case, transcripts in `32-31-GREEN-proof.txt` § 7. Two of them (M1, M5) reddened nothing on their first run and produced deviations 3 and 4.

## Issues Encountered

- **The TAP-summary mismatch above.** `gsd-tools check tdd-red-evidence` parses node:test-shaped TAP; vitest emits neither `tap` nor `tap-flat` with summary lines. Resolved by counting the summary from the run's own output rather than by asserting a verdict the tool did not give.
- **`npm test` is the live claude-CLI e2e lane in this repository** (recorded in the dispatch prompt and in project memory). Every regression run here used `npx vitest run --exclude '**/scripts/e2e/**'`.

## Known Stubs

None.

## Known Residuals

- **The closure WALKER does not read a `require("…")` specifier.** `SPECIFIER_PATTERNS` covers the three forms this repository's compiled output emits (`from "…"`, `import "…"`, `import("…")`), which is the pre-existing scope this module documents; `require(…)` is not one of them and was not one before this plan. The read-only GUARD's AST census does read that position and does refuse a foreign specifier there — measured in `32-31-GREEN-proof.txt` § 4 P5 at `exit 1, 4 failed | 131 passed`, with the acquisitions PREMISE among the failures. So DASH-06's property holds at the position that decides it, while the walker's mirror would not carry the edge. Closing it means a fourth scan pattern plus a `CLOSURE_BASELINES` re-measure, which this plan did not have a measurement for. Named so a later round does not rediscover it.
- **The DASH-08 concurrency claim is a backstop, not a measurement** (coverage `D7`). Build parity and freshness bound it and both exit 0 here; no test races a build against the guard.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema at a trust boundary. The change narrows an existing trust boundary (a local module closure) rather than widening one.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

- `[ -f .planning/phases/32-board-projector-cli-dashboard/32-31-GREEN-proof.txt ]` → FOUND
- `[ -f scripts/js-import-closure.ts ]`, `[ -f scripts/js-import-closure.js ]`, `[ -f scripts/board-readonly.test.ts ]` → FOUND
- `git log --oneline e87fd46c..HEAD` → 4 commits found: `2b3ed970`, `ee73c5a9`, `423fb181`, `05a57278`
- Plan `<verification>` re-run at close-out: `npm run build && npm run check:dashboard-readonly` → exit 0, 135 passed; `git diff --exit-code -- scripts/ agent-factory/ docs/` → exit 0; `grep -c 'PREMISE' 32-31-GREEN-proof.txt` → 13 (≥ 6); `grep -c 'exit 0 -> exit' 32-31-GREEN-proof.txt` → 3 (≥ 3)

## Next Phase Readiness

The tracer holds against the artifact a host runs, after one commit rather than after six. The expansion plans of gap-closure round 3 (`32-32` … `32-37`) can proceed, and `32-37` re-runs these reproductions against the rebuilt committed `.js` at the end of the round.

Two things the next plan should carry forward:
- `CLOSURE_BASELINES` now FREEZES nine production mirrors. Any later plan that changes what the walker follows must re-measure those rows deliberately, never adjust the expectation.
- The `require("…")` walker residual above is the one place the guard and the walker disagree about a position. It is a candidate for `32-37`'s probe table.

DASH-06 and DASH-08 are declared by twelve other plans in this phase, several of which have no SUMMARY yet, so they stay open in REQUIREMENTS.md until the last declaring plan finishes.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-16*
