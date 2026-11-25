---
phase: 44-upstream-source-declaration-and-pin-check
plan: 02
subsystem: testing
tags: [upstream, git, trace, note, vitest, unit-tests]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01's scripts/upstream-model.ts, the committed upstream.js, the TRC-02 classifyRef rule and the upstream fixture builders
provides:
  - scripts/upstream-model.test.ts, 167 cases pinning every grammar and decision of the upstream authority
  - TRC-02 cases in scripts/trace-model.test.ts (the five refs, the GRUG-1 row, BR-3, the raw-ID residual)
  - host-copy proof that trace-render.js puts an upstream ref under Requirement and note.js admits and reads it on a claim note (UP-05)
affects: [44-04, 44-05, 44-06, 44-08, phase-45, phase-47]

actuals:
  tokens: 11205
  tasks: 2
  commits: 3
plan_head_before: d846c8e0d24f4ad9f51f5eb004c3f5f48eb9cd08
plan_head_after: a96694e172cdd8307390e25ac8b7117f988de910

tech-stack:
  added: []
  patterns:
    - "A sha256 expectation is computed by git in a scratch `--object-format=sha256` repository under fixtureEnv, never typed in"
    - "A census pin moved by a new test module is re-derived by listing, dated, and the census question answered for the new file"

key-files:
  created:
    - scripts/upstream-model.test.ts
  modified:
    - scripts/trace-model.test.ts
    - scripts/runnable-ref/trace-render.test.ts
    - scripts/runnable-ref/note.test.ts
    - install/mode-census.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The upstream authority needed no fix: all 167 cases passed against the plan 44-01 module once two test mistakes were corrected, so no embed was regenerated"
  - "BR-3 joined the AUTH-1 agreement corpus (18 to 19 members) so the new reserved prefix is exercised; the ticket answer (ABC-1, CWE-79, the longest board id) is unchanged"

patterns-established:
  - "Upstream test grammar names: each case name carries config, path, manifest, object id, blob id, fence, ref, pinState or exit"

requirements-completed: [UP-01, UP-05, UP-06, TRC-02]

coverage:
  - id: D1
    description: "parseUpstreamConfig refuses by key path every D-02/D-18 violation, quoting the allowed set at all three levels, and refuses upstream.escalation_days (D-06 is phase 45)"
    requirement: UP-01
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#config: the upstream declaration (D-01, D-02, D-06, D-18)"
        status: pass
    human_judgment: false
  - id: D2
    description: "sourcePathFindings refuses absolute, drive-letter, ~, backslash, control-character, inside and ancestor paths and accepts ../design-package against the repository root (D-19); isManifestPath refuses every bad shape"
    requirement: UP-01
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#path: the lexical source-path rule (D-19)"
        status: pass
    human_judgment: false
  - id: D3
    description: "parseManifest gives the same rows for LF, CRLF and BOM and a reason with a 1-based line for every malformed shape, cycles included (D-09 to D-12)"
    requirement: UP-06
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#manifest: the entry manifest table (D-09, D-10, D-11, D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Object ids are exactly 40 or 64 lowercase hex; pinState, checkExitCode (Option A) and formatCheckLine follow the plan 44-01 grammar with exact full-length equality (UP-06)"
    requirement: UP-06
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#object id / pinState / exit describes"
        status: pass
    human_judgment: false
  - id: D5
    description: "gitBlobId sha1 equals e5c5c5583f49a34e86ce622b59363df99e09d4c6 and sha256 equals git hash-object in a sha256 repository; fenceLines is the exact D-17 text; refs round-trip and malformed refs are refused"
    verification:
      - kind: unit
        ref: "scripts/upstream-model.test.ts#blob id / fence / ref describes"
        status: pass
    human_judgment: false
  - id: D6
    description: "classifyRef routes upstream refs and BR-3 to Requirement, GRUG-1 gets one row holding the upstream ref, and the raw DEC-012 residual is pinned for phase 45 TRC-03"
    requirement: TRC-02
    verification:
      - kind: unit
        ref: "scripts/trace-model.test.ts#classifyRef: upstream refs and the BR prefix (TRC-02, plan 44-02)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The committed trace-render.js renders ABC-1 alone with the upstream ref and BR-3 under Requirement, and an index with one row"
    requirement: TRC-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/trace-render.test.ts#upstream refs (TRC-02)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The committed note.js admits a claim note carrying an upstream ref and read prints the ref unchanged"
    requirement: UP-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/note.test.ts#upstream refs (UP-05)"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 02: Upstream grammars pinned, and an upstream ref traced end to end Summary

**167 unit cases now pin every rule of `scripts/upstream-model.ts`. Covered: the declaration (`escalation_days` refused), the path rule, the manifest table, the object ids, the blob id (the sha256 value is computed by git), the D-17 fence, refs, `pinState`, the Option A exit rule and the four check lines. Host-copy runs show that an upstream ref is admitted on a `claim` note by note.js and lands in the citing ticket's Requirement column in trace-render.js, and that `BR-3` never forms a row.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-25T08:37:56Z
- **Completed:** 2026-11-25T08:55:00Z
- **Tasks:** 2
- **Files modified:** 6 (1 created)

## Accomplishments

- `scripts/upstream-model.test.ts` (776 lines, 167 cases) imports the authority directly (`./upstream-model.js`) and covers every behavior bullet of Task 1. The model needed no fix.
- `scripts/trace-model.test.ts`: the five-ref TRC-02 table, the `GRUG-1` row whose Requirement holds the upstream ref, `BR-3` as a Requirement link that never forms a row, and the raw `DEC-012` residual, pinned with a comment naming phase 45 TRC-03 and Workflow 20.
- `scripts/runnable-ref/trace-render.test.ts` `upstream refs (TRC-02)`: one sealed note `[ABC-1, upstream:design:DEC-1@<40 hex>, BR-3]` gives exactly `ABC-1.md` with `- <upstream ref>` and `- BR-3` under Requirement, no `DEC-1.md` or `BR-3.md`, and one index row.
- `scripts/runnable-ref/note.test.ts` `upstream refs (UP-05)`: `add` of a `claim` note with `--ref ABC-1 --ref upstream:design:DEC-1@<40 hex>` prints `noted`, and `read` prints `refs: ABC-1, upstream:design:DEC-1@...` unchanged and writes nothing.

## Task Commits

1. **Task 1: pin every upstream grammar and decision with unit tests** - `084a2c44` (test)
2. **Task 2: prove an upstream ref travels from a claim note to the Requirement column** - `d883cfbf` (test)
3. **Deviation: record upstream-model.test.ts in the two scripts-test censuses** - `a96694e1` (test)

## Files Created/Modified

- `scripts/upstream-model.test.ts`: new, the unit cases of the pure upstream authority
- `scripts/trace-model.test.ts`: new TRC-02 describe; `BR` in the test's RESERVED list; `BR-3` in the AUTH-1 corpus (18 to 19, dated)
- `scripts/runnable-ref/trace-render.test.ts`: new `upstream refs (TRC-02)` describe
- `scripts/runnable-ref/note.test.ts`: new `upstream refs (UP-05)` describe
- `install/mode-census.test.ts`: `SCRIPTS_TEST_FILE_COUNT` 86 to 87, dated
- `scripts/check-foundation-guards.test.ts`: `TRIPWIRE_MODULES` 86 to 87, dated

## Decisions Made

- The model was left unchanged. The first run had 2 failures out of 167, and both were mistakes in the tests. One test passed `.grugops` as the root argument, which asks a different question. The other built a blob id from digits only, so `toUpperCase()` returned the same string. I corrected the tests, not the model, and no embed or stamp moved.
- `BR-3` was added to the AUTH-1 agreement corpus so the new reserved prefix has a member that exercises it. The board admits `BR-3` (`isTicketId` true) and the trace refuses it as a ticket, so the pinned ticket answer did not change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two census pins moved by the new test module**
- **Found during:** the regression run of the tests that list every scripts test, after Task 2
- **Issue:** `install/mode-census.test.ts` (`SCRIPTS_TEST_FILE_COUNT`) and `scripts/check-foundation-guards.test.ts` (`TRIPWIRE_MODULES`) pin the number of `scripts/*.test.ts` files exactly; the new `scripts/upstream-model.test.ts` made it 87.
- **Fix:** re-derived by `ls scripts/*.test.ts | wc -l` (87) and moved both pins with dated paragraphs. The mode census asks whether the new file calls chmod or reads `.mode`, and it does neither (`grep -c` gives 0).
- **Files modified:** install/mode-census.test.ts, scripts/check-foundation-guards.test.ts
- **Verification:** both suites pass (15 and 344 tests); `node scripts/check-foundation-guards.js` reports ALL CHECKS PASSED
- **Committed in:** a96694e1

**2. [Minor] BR-3 added to the AUTH-1 corpus**
- The plan said to re-pin the corpus only as the new reserved prefix requires. No member had the `BR` prefix, so adding `BR` to RESERVED alone would have tested nothing. I added one member, `BR-3`, re-derived the size (19), and the ticket answer did not change.

---

**Total deviations:** 2 (1 Rule 3, 1 minor)
**Impact on plan:** No production code changed. The plan's "no new production symbol" holds.

## Issues Encountered

- `install/installer-fs-census.test.ts` fails on this machine's Node v26.12.1 with `UNCLASSIFIED node:fs export openAsBlobSync`. It is the known item DI-03 (STATE.md, phases 34 and 34.1): it fails only on local Node 26, and CI pins Node 22. It is unrelated to this plan and was left alone.
- `scripts/capture-live.test.ts` Test P5 failed once while Task 2 was uncommitted. Its dirty-tree line listed `trace-model.test.ts` and `trace-render.test.ts`, and the case refuses the word `trace` in that row. It passes on the committed tree.

## Verification

- `npx vitest run scripts/upstream-model.test.ts scripts/trace-model.test.ts scripts/runnable-ref/trace-render.test.ts scripts/runnable-ref/note.test.ts scripts/runnable-ref/upstream.test.ts`: 5 files, 446 tests passed
- `npx vitest run scripts/runnable-ref/note.test.ts -t upstream`: 1 passed
- `npx vitest run scripts/generate-runnable-embeds.test.ts`: 38 passed
- `npm run freshness` (95 committed `.js` fresh), `npm run freshness:runnable-embeds` (7 targets fresh), `npm run typecheck`: all exit 0
- 45 further test files that list test files or read the edited ones: all pass, except the DI-03 case above
- Acceptance greps: `escalation_days` 3, `e5c5c558...` 1, `sha256` 9 in upstream-model.test.ts; `upstream:design` 7 and `BR-3` 7 in trace-model.test.ts; `upstream` 4 in trace-render.test.ts and 4 in note.test.ts
- Full suite not run (over 20 minutes, per the orchestrator's testing notes)

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Plans 44-04 (validator), 44-05 and 44-06 (runnable states) can rely on the pinned grammars. A change to any upstream-model rule now turns a named case red.
- The raw-ID residual (`DEC-012` forms a ticket row) is pinned in scripts/trace-model.test.ts. That case should change when phase 45 TRC-03 lands.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
