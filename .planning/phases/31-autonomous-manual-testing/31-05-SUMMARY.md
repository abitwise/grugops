---
phase: 31-autonomous-manual-testing
plan: 05
subsystem: testing
tags: [context-io, admission, evidence-provenance, typescript-ast, contract-test, red-team]

# Dependency graph
requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-01's artifact-ref provenance triple, admit()'s D-03 sha-versus-verdict branch, emitVerdict's recorded gate-run SHA"
  - phase: 31-autonomous-manual-testing
    provides: "31-04's derived-set + watched-fail contract-test idiom (scripts/chrome-lane-bar.test.ts)"
provides:
  - "appendNote() routes an artifact-ref through admit() before writeNoteFile — the D-03 authority is now reachable from every exported note writer"
  - "scripts/context-io-writer-set.test.ts — the note-writer set derived from the module by TypeScript AST, its cardinality asserted, every member exercised"
  - "Two watched-fail controls: a neutralized-authority mirror and a raw-kind-comparison mirror, both of which WRITE what the live module refuses"
  - "Corrected sanctioned-path prose in workflows 17 and 18, and an appended dated correction on 31-01-SUMMARY.md"
affects: [31-06, 31-07, 31-08, phase-32-board, any future note writer]

actuals:
  tokens: 14830        # chars/4 over the REALIZED diff (59,321 added chars across bca4bc8..HEAD)
  tasks: 3
  commits: 4
  plan_head_before: bca4bc88401c0f3f493aaf7983b4e92e37027068

tech-stack:
  added: []
  patterns:
    - "Reach-not-recheck: a safety predicate that exists but is unreachable is fixed by a CALL from the unreached writer, never by a second implementation of the predicate"
    - "Derive-the-set-assert-the-count, applied to a module's own exports via the TypeScript AST"
    - "Mirror-the-committed-.js-and-mutate-one-anchor as the watched-fail idiom, with the anchor's single occurrence asserted before and its absence after"

key-files:
  created:
    - scripts/context-io-writer-set.test.ts
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/check-foundation-guards.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/17-task-claim.md
    - agent-factory/workflows/18-context-compaction.md
    - .planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md

key-decisions:
  - "The kind test in appendNote consults normalizeKind, the single kind authority, not a raw string compare — measured on a mirror, the raw compare lets a padded `artifact-ref ` through and the store reads it back as a real artifact-ref"
  - "The duplicate retained-ledger event the wiring causes is DISCLOSED and asserted rather than suppressed: every way to suppress it hands appendNote a way to be told the authority already spoke, and both a parameter and a private unadmitted write helper re-open what this plan closed"
  - "The pinned residual case that asserted the bypass is re-pointed at its closure rather than deleted — the pin is what made the change visible"
  - "31-01-SUMMARY.md's wrong residual disposition is corrected by an appended dated section, 37 insertions and 0 deletions; no line was rewritten"

patterns-established:
  - "Pattern: a writer-set contract test asserts its exercise table's key set against the DERIVED set before running any driver, so a writer with no driver is red rather than skipped"
  - "Pattern: a structural impossibility is asserted POSITIVELY off the parsed source (the composed `kind:` literal), never left as an unexercised member"
  - "Pattern: the one hand-written set a derivation still needs is bounded by asserting the cardinality of the module's own node:fs import clause"

requirements-completed: [UATX-01, UATX-04]

coverage:
  - id: D1
    description: "appendNote() refuses an artifact-ref whose gate_run/sha pair names no live green §14-gate verdict, and writes nothing — the verifier's exact live bypass, closed at its own coordinates"
    requirement: UATX-04
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#REFUSES the verifier's fabricated gate_run and writes NOTHING (gap 1, reproduced)"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#REFUSES a stale sha against a real live green verdict, naming BOTH shas"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#WRITES a correctly bound artifact-ref, and the returned id is the filename on disk"
        status: pass
    human_judgment: false
  - id: D2
    description: "The D-03 comparison still exists in exactly one function — appendNote gained no verdict read, no gate_run lookup and no sha handling"
    requirement: UATX-04
    verification:
      - kind: other
        ref: "sed -n '1020,1109p' scripts/context-io.ts | grep -v '^\\s*//' | grep -c 'isLiveGreenVerdict' → 0 (same for verdictSha and matches.length)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The note-writer set is derived from scripts/context-io.ts by AST, its cardinality asserted, and every member exercised against fabricated provenance or positively proven structurally incapable"
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the derived writer set has the expected MEMBERS"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the exercise table's key set EQUALS the derived writer set"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#a SECOND exported writer moves the COUNT by exactly one"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both the derivation and the refusal have been watched failing — a seeded mirror moves the set, a neutralized-authority mirror writes the fabrication, and a raw-kind mirror writes a padded fabrication the live module refuses"
    requirement: UATX-04
    verification:
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#the neutralized mirror of the committed .js writes what the live module refuses"
        status: pass
      - kind: unit
        ref: "scripts/context-io-writer-set.test.ts#a mirror comparing the RAW kind writes the padded fabrication, and it persists as an artifact-ref"
        status: pass
    human_judgment: false
  - id: D5
    description: "Workflows 17 and 18 state what the mechanism now does: an artifact-ref is admitted only against a live green verdict, and a promoted one is re-bound at the destination or honestly degraded"
    requirement: UATX-01
    verification: []
    human_judgment: true
    rationale: "The guards check style and vocabulary, not whether a sentence describes the mechanism it points at. Whether the corrected prose leads an agent to the behaviour the code now has is a human read of four edited passages."
  - id: D6
    description: "31-01-SUMMARY.md carries an appended, dated correction of its false 'both fail closed' residual, with no existing line rewritten"
    requirement: UATX-04
    verification:
      - kind: other
        ref: "git diff --numstat -- .planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md → 37 0"
        status: pass
    human_judgment: true
    rationale: "Insertions-only is mechanically checked; whether the correction states the fault honestly and completely — rather than softening it — is exactly the judgment the no-fabrication rule asks a human to make."

duration: 50 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 05: Reach the D-03 Authority From Every Note Writer — Summary

**The evidence-binding refusal was correct and unreachable from the writer two shipped workflows name by name; `appendNote` now routes an `artifact-ref` through `admit()` and adds no predicate of its own, and the writer set that must stay bound is derived from the module by AST rather than typed out.**

## Performance

- **Duration:** 50 min
- **Started:** 2026-09-08T06:45:00Z
- **Completed:** 2026-09-08T07:35:00Z
- **Tasks:** 3 of 3
- **Files modified:** 10 (1 created, 9 modified)

## Accomplishments

- **Gap 1 of `31-VERIFICATION.md` is closed at its own coordinates.** The verifier's exact call — `appendNote("verify-repro-task", { kind: "artifact-ref", gate_run: "no-such-gate-run-ever-existed", … })` — now throws a named refusal and the task's notes directory gains zero files. The legitimate bound write still opens.
- **The fix is a CALL, not a check.** `appendNote` consults `admit()` and refuses on its findings. It reads no verdict, looks up no `gate_run` and never touches `sha`, so D-03's one-authority-per-predicate rule still holds. Measured: 0 non-comment occurrences of `verdictSha`, `isLiveGreenVerdict` or `matches.length` in `appendNote`'s body.
- **The writer set is derived and counted.** `scripts/context-io-writer-set.test.ts` parses `scripts/context-io.ts` with the TypeScript AST and reports every exported function whose transitive call closure reaches `writeNoteFile`: `admitAndAppend`, `appendNote`, `emitCheckpointNote`, `emitVerdict` — 4, asserted as members and as a cardinality separately.
- **Every member is exercised, and no member is skipped.** The exercise table's key set is asserted equal to the derived set *before* any driver runs. The two behavioural writers refuse the fabricated provenance with an unchanged notes-file count; the two literal-kind emitters are proven structurally incapable off the parsed source.
- **Three controls watched failing.** A seeded mirror with one extra exported writer moves the set and moves the count by exactly one. A mirror of the committed `.js` with the authority call neutralized WRITES the fabricated artifact-ref. A mirror comparing the RAW `note.kind` WRITES a padded fabrication that the store reads back as a real `artifact-ref`.
- **The prose and the record now match the mechanism.** Workflows 17 and 18 name the corrected sanctioned path across five sites; `31-01-SUMMARY.md` carries an appended, dated correction of the residual disposition the verification disproved.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED-first — reproduce the live bypass, then route an artifact-ref through the single authority** — `0d7f8fd` (fix)
2. **Task 2: the writer-set contract test — derive the set, assert the count, exercise every member, watch it fail** — `195be24` (test)
3. **Task 3: correct the two workflows and append the dated correction to 31-01-SUMMARY.md** — `acb21e2` (docs)
4. **Red-team follow-up: pin the padded-kind bypass the kind authority closes** — `00de8d0` (test)

**Plan metadata:** see the `docs(31-05)` commit that carries this summary.

## RED and GREEN evidence

### The pre-fix reproduction (RED), verbatim

The verifier's exact call shape, run against the **committed** `scripts/context-io.js` before any
change, in a fresh temp context root holding no verdict at all:

```
appendNote WROTE id: 20260907T090000Z-qe-e2e-artifact-ref-7f41ed6a
files: 1
```

This is the same defect `31-VERIFICATION.md` recorded as
`appendNote WROTE id: 20260907T163748Z-qe-e2e-artifact-ref-1e163523` — the id differs only in its
timestamp and collision nonce, because the id is minted per call. Independently re-reproduced here
rather than taken on the verification's word.

### The failing test block (RED), verbatim

`npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts -t "31-05 gap 1"`, run
before `appendNote` was touched:

```
 ❯ scripts/context-io.test.ts (294 tests | 3 failed | 287 skipped) 34ms
     × REFUSES the verifier's fabricated gate_run and writes NOTHING (gap 1, reproduced) 12ms
     × the refusal names the module, the function and states that nothing was written 2ms
     × REFUSES a stale sha against a real live green verdict, naming BOTH shas 3ms

AssertionError: expected [Function] to throw an error
- Expected: null
+ Received: undefined

AssertionError: expected '' to contain 'context-io.appendNote'

 Test Files  1 failed (1)
      Tests  3 failed | 4 passed | 287 skipped (294)
```

The four cases that passed pre-fix are the GREEN-side controls (the legitimate write, the other five
kinds, the `isGatedNote` dial sweep, `admitAndAppend`) — they were green before and stayed green
after, which is what makes the three failures attributable to the missing wiring alone.

### GREEN, after the wiring

```
 Test Files  1 passed (1)
      Tests  295 passed (295)          # scripts/context-io.test.ts
 Test Files  1 passed (1)
      Tests  17 passed (17)            # scripts/context-io-writer-set.test.ts
 Test Files  62 passed (62)
      Tests  3289 passed | 2 skipped (3291)   # full suite, e2e excluded
```

### The assumption-A1 grep, recorded with its number

Before the wiring landed, `admit()`'s body (lines 1587–1777 of the pre-change
`scripts/context-io.ts`) was grepped for a call to any note writer
(`appendNote|emitTrusted|writeNoteFile|emitVerdict|emitCheckpointNote|admitAndAppend`):

```
A1 count = 0
```

Zero. Routing `appendNote` through `admit()` therefore cannot recurse. Recorded as a number rather
than as a reading of the source.

### The mutation proofs (each control watched failing)

| Control | Mutation | Observed |
|---|---|---|
| The refusal | `const admission = admit(...)` → `const admission = []` in a mirror of the committed `.js` | The fabricated artifact-ref is **WRITTEN**, 1 note file; the live module refuses the identical call with 0 files |
| The kind authority | `normalizeKind(note.kind) === "artifact-ref"` → `note.kind === "artifact-ref"` in a mirror | A padded `kind: "artifact-ref "` is **WRITTEN**; `parseNote` reads it back as `artifact-ref`, so the store holds a real artifact-ref that skipped the binding |
| The derivation | one extra exported function calling `writeNoteFile`, appended to a mirror of the live source | The derived set gains that name, stops equalling `EXPECTED_NOTE_WRITERS`, and its length moves to exactly `COUNT + 1` |
| The exercise table | the `admitAndAppend` driver deleted from a scratch copy of the test file | 2 cases go red — the key-set equality and the per-writer case — so a writer with no driver cannot be silently skipped |
| The pinned residual | (no mutation needed) | `31-01`'s case "RESIDUAL, PINNED: appendNote writes without asking admit()" went **red on purpose** the moment the wiring landed, which is precisely what it was pinned to do |

## Reachability enumeration (Task 2 PART FIVE, quoted per the plan)

Computed and asserted numerically in `scripts/context-io-writer-set.test.ts`, not described:

| Fact | Count | Detail |
|---|---|---|
| `appendNote(` occurrences in tracked **non-test** sources under `scripts/`, `hooks/`, `install/` | **6** | `scripts/context-io.ts` 3 (the declaration + `admitAndAppend`'s two call sites), `scripts/check-uat-oracles.ts` 2, `scripts/compactor.ts` 1 |
| `agent-factory/` documents whose prose names `appendNote` | **4** | `contracts/context-note.md`, `workflows/16-context-read-write.md`, `workflows/17-task-claim.md`, `workflows/18-context-compaction.md` |
| Documents **changed** by this plan | **2** | `workflows/17-task-claim.md`, `workflows/18-context-compaction.md`. `16-context-read-write.md` already routes through `admitAndAppend` and was deliberately left alone rather than re-stated; `contracts/context-note.md` documents the six-kind schema, which did not change. |
| Named non-note-writer residual | **1** | `atomicWrite` — an exported general-purpose file writer, derived as the sole exported non-note-writer that itself calls a filesystem write primitive. T-31-25, disposition `accept`. |

`git ls-files` running successfully is asserted as a PREMISE inside the counting helper: a count that
could not be measured fails rather than being skipped.

## Files Created/Modified

- `scripts/context-io-writer-set.test.ts` *(created)* — the derived-writer-set contract: AST derivation, premise guards, two seeded-mirror discrimination cases, a per-writer exercise table, two watched-fail mirrors of the committed `.js`, and the reachability counts.
- `scripts/context-io.ts` — `appendNote` gains an optional 6th `repoRoot` parameter and one `admit()` call for the `artifact-ref` kind, placed after `validate()` and before `writeNoteFile`; `admitAndAppend` threads `repoRoot` into both `appendNote` call sites.
- `scripts/context-io.js` — the rebuilt committed twin.
- `scripts/context-io.test.ts` — the 8-case gap-1 block (7 new + the disclosed ledger case); two 31-01 render fixtures now seed the green verdict their artifact-ref names; the pinned residual is re-pointed at its closure.
- `scripts/check-foundation-guards.test.ts` — `TRIPWIRE_MODULES` re-derived 55 → 56 for the new test module.
- `hooks/hook-entry.ts` / `.js` — the frozen decider manifest regenerated: `scripts/context-io.js` sits inside the admission guard's hashed module closure.
- `agent-factory/workflows/17-task-claim.md` — step 4 gains the evidence clause.
- `agent-factory/workflows/18-context-compaction.md` — four sites corrected (step 4, step 5's pass-through claim, the re-verify stop condition, the done condition).
- `.planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md` — the appended `## Correction — 2026-09-08` section.

## Decisions Made

1. **The kind test consults `normalizeKind`, the kind authority — not a raw compare.** Red-teamed, not reasoned: `parseNote` trims the value it persists, so a padded `kind: "artifact-ref "` reads as a non-artifact-ref at a raw comparison and is stored as a real `artifact-ref`. That is the GAP-R7-1 Lever-1 divergence — the gate's view of a kind narrower than the store's — and it was measured on a mirror before being pinned as a test.

2. **The duplicate retained-ledger event is disclosed, not suppressed.** Under `audit_retention: retained`, one artifact-ref through `admitAndAppend` now produces two GOV-02 ledger events, because two admissions genuinely happen and the ledger records admissions. Suppressing the second would require telling `appendNote` that the authority already spoke — as a parameter (agent-reachable) or as a private unadmitted write helper (a second write path with no binding). Both re-open what this plan closed, to tidy an audit line. The duplicate is asserted instead, with both lines carrying the same note id so an auditor can tell the pair from two different notes, and a control asserting a note of another kind is ledgered once.

3. **The pinned residual is re-pointed, not deleted.** `31-01` recorded the bypass as an assertion "so the day this changes is a day this case goes red on purpose". It went red on purpose. The case now asserts the closure and carries the history of what it used to assert.

4. **Workflow 16 and the note contract were left alone.** WF16 already routes through `admitAndAppend` and states the admission rules once; re-stating them beside the corrected sentences would create the second authority the corrected sentences exist to point away from.

## Prohibitions (plan-declared, status at close)

| Prohibition | Status | Evidence |
|---|---|---|
| `appendNote` must never grow a second implementation of the sha-versus-verdict comparison | **held** | 0 non-comment occurrences of `verdictSha`, `isLiveGreenVerdict`, `matches.length` across `appendNote`'s body (lines 1020–1109); the branch is one `admit()` call and a findings check |
| A refusal must never leave a partial or zero-length note file behind | **held** | The branch sits after `composeNote`/`validate` and before `writeNoteFile`; every refusal case asserts the notes-directory file count is unchanged, in both test files and across all 9 red-team probes |
| No existing line of `31-01-SUMMARY.md` may be rewritten | **held** | `git diff --numstat` → `37  0` — insertions only |

## Red-team pass (project doctrine, not optional)

The two questions that found the original defect were asked again against the shipped refusal.

**How is the gate REACHED?** Every exported write entry point was enumerated by AST, not by reading:
`admitAndAppend`, `appendNote`, `emitCheckpointNote`, `emitVerdict`. The CLI surface was enumerated
separately — `validate`, `admit`, `emit-verdict`, `render` — and only `emit-verdict` reaches a
writer, one that composes `finding` from a literal. `atomicWrite` is named as the disclosed residual.

**What is the predicate's INPUT assembled from?** `admit()` decides on `parseNote(composeNote(...))`,
while the branch that calls it decides on `note.kind`. Those are two views of one value, and the gap
between them is where a bypass lives — which is what the padded-kind probe found and closed.

Nine probes were run against the shipped artifact. All refused, all with zero note files written,
and the bound control still admitted:

| Probe | Outcome |
|---|---|
| uppercase `kind: "Artifact-Ref"` | REFUSED (invalid note — kind is not one of the six) |
| padded `kind: "artifact-ref "` | REFUSED (**admission FAIL** — structurally valid, so only the authority stopped it) |
| zero-width-joined kind | REFUSED (invalid note) |
| empty / whitespace / omitted `gate_run` | REFUSED (invalid note — the triple is required-and-complete on an artifact-ref) |
| `compactor.promote()` with fabricated provenance | REFUSED (admission FAIL — the pass-through is now bound) |
| `kind` supplied via the prototype chain | REFUSED (admission FAIL — property lookup is the same for the branch and the composer) |
| a forged `precomputedId` | REFUSED (admission FAIL — the id is not the admission's input) |
| **CONTROL:** bound `gate_run` + matching `sha` | **WROTE**, 2 files (verdict + evidence) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two 31-01 render fixtures planted an unbound artifact-ref through the now-gated writer**
- **Found during:** Task 1 (after the wiring landed)
- **Issue:** `31-01`'s "an artifact-ref's JSONL line appends the three fields AFTER supersedes" and "rendering the same notes twice is byte-identical" both built their fixture by calling `appendNote` with `gate_run: "RUN-A"` into a context holding no verdict. Both threw after the fix.
- **Fix:** `renderFixture` gained an optional `gateRuns` parameter that seeds the green verdict through `emitVerdict` before planting notes; the two artifact-ref cases pass `[["RUN-A", P31_SHA_A]]`. Because the seeded verdict is itself a note, the byte-exact `jsonl` assertion was scoped to the artifact-ref's own line by id rather than to the whole file.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** `npx vitest run scripts/context-io.test.ts` → 295 passed
- **Committed in:** `0d7f8fd`

**2. [Rule 1 - Bug] The pinned residual case asserted the defect this plan closes**
- **Found during:** Task 1
- **Issue:** `31-01`'s "RESIDUAL, PINNED: appendNote writes without asking admit(), so it persists a stale SHA" asserted that the write succeeded — it went red the moment the wiring landed.
- **Fix:** Re-pointed at the closure (the same call now throws with `admission FAIL` and the notes snapshot is unchanged), with a comment recording what it used to assert and why the pin mattered. Not deleted: the pin is what made the change visible.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** the case is green and its message names the closure
- **Committed in:** `0d7f8fd`

**3. [Rule 3 - Blocker] The frozen hook-entry manifest carried a stale hash for `scripts/context-io.js`**
- **Found during:** Task 1 (full-suite run)
- **Issue:** `hooks/admission-guard.js`'s frozen closure manifest hashes `scripts/context-io.js`. Changing that file made 3 tests fail across `hooks/guard.test.ts` and `scripts/floor-invariance.test.ts`.
- **Fix:** `npm run generate:hook-manifest` (the sanctioned regeneration), then rebuild. The "no uncommitted modification, measured against HEAD" case clears once the regenerated entry is committed, which it is.
- **Files modified:** `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** `hooks/guard.test.ts` 230 passed, `scripts/floor-invariance.test.ts` 136 passed
- **Committed in:** `0d7f8fd`

**4. [Rule 3 - Blocker] `TRIPWIRE_MODULES` fired on the new test module**
- **Found during:** Task 3 (`scripts/check-foundation-guards.test.ts`)
- **Issue:** The tripwire asserts the test-module census EXACTLY, "because a module added, removed or renamed out of this scan is a structural event, not corpus growth". Adding `scripts/context-io-writer-set.test.ts` moved it 55 → 56.
- **Fix:** Re-derived rather than incremented (`ls scripts/*.test.ts | wc -l` → 56) and recorded in the constant's running comment, including the same disclosed one-commit-late departure the 54 → 55 bump recorded. The pin firing on a module arriving is the pin working.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `scripts/check-foundation-guards.test.ts` 281 passed
- **Committed in:** `acb21e2`

**5. [Rule 2 - Missing critical] Workflow 18 step 5 claimed an `artifact-ref` "passes through"**
- **Found during:** Task 3
- **Issue:** Step 5 listed `artifact-ref` among the soft kinds that "carry no stamp and pass through". After Task 1 that sentence is false — the kind is re-checked at the destination. The plan named step 4, the stop condition and the done condition; this fourth site was not named and states a route that skips the safety check, which the plan's own threat model classes as a live defect rather than a documentation nit.
- **Fix:** The clause was split so the four genuinely soft kinds keep the pass-through claim and `artifact-ref` carries its own two sentences.
- **Files modified:** `agent-factory/workflows/18-context-compaction.md`
- **Verification:** `npm run check:imperative-lexicon` → ALL CHECKS PASSED; `grep -c 'artifact-ref'` → 5
- **Committed in:** `acb21e2`

**6. [Rule 2 - Missing critical] A raw-kind comparison would have re-opened the fix**
- **Found during:** the plan's mandatory red-team obligation, after Task 3
- **Issue:** The branch's kind test is a degree of freedom the plan did not specify. A raw `note.kind === "artifact-ref"` was measured on a mirror to WRITE a padded fabrication that `parseNote` reads back as a real `artifact-ref`.
- **Fix:** The live branch already used `normalizeKind`; the bypass is now pinned by two cases — the raw-kind mirror writing it, and the live module refusing it with `admission FAIL` — so the choice cannot be silently reverted. `mirrorOfCommittedJs` was factored out so both watched-fails assert their anchor's single occurrence before mutating and its absence after.
- **Files modified:** `scripts/context-io-writer-set.test.ts`
- **Verification:** 17 passed in that file; full suite 3289 passed
- **Committed in:** `00de8d0`

---

**Total deviations:** 6 auto-fixed (2 × Rule 1, 2 × Rule 2, 2 × Rule 3).
**Impact on plan:** No scope creep. Four of the six are the direct blast radius of the one wiring
change (two fixture repairs, one frozen manifest, one census pin); the other two are prose and a
control that the plan's own threat model and red-team obligation required. Nothing in the plan's
task list was skipped or narrowed.

## Issues Encountered

- **The duplicate retained-ledger event** (see Decisions §2). Measured before deciding: one
  artifact-ref through `admitAndAppend` under `audit_retention: retained` produced two identical
  ledger lines. Resolved by disclosure plus an assertion, not by a suppression mechanism that would
  hand the writer a bypass. Recorded in `.planning/WINDOWS.md` as an open `deviation`.
- **Sentence-form guards rejected four of the corrected passages** (`WP-02` 20-word procedural bound,
  `WP-03` 25-word descriptive bound, `WP-06` bare demonstrative subject). Each was split or given a
  named antecedent; no guard was narrowed and no scan set was touched.

## Known Stubs

None. No placeholder, empty-literal or "coming soon" value was introduced; every new assertion drives
real behaviour or a real parse.

## Threat Flags

None. The change introduces no new network endpoint, auth path, file-access pattern or schema at a
trust boundary. `T-31-20` through `T-31-24` are mitigated as planned and `T-31-25` (`atomicWrite`) is
carried forward with its `accept` disposition, now derived and named in `NON_NOTE_WRITER_RESIDUALS`
rather than asserted in prose.

## Verification Results

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 files, 3289 passed, 2 skipped** (the 2 skips are pre-existing) |
| `scripts/context-io.test.ts` | 295 passed |
| `scripts/context-io-writer-set.test.ts` | 17 passed |
| `scripts/compactor.test.ts`, `admission-server.test.ts`, `floor-invariance.test.ts`, `convergence-spine.test.ts`, `worktree-dogfood.test.ts` | all green |
| `npm run build` / `typecheck` / `check:build-parity` / `freshness` | exit 0; `Build parity: no tracked build output moved`; `All build outputs fresh: 60 committed .js file(s)` |
| `check:imperative-lexicon` / `check:banned-claims` / `check:public-docs` / `check:claim-anchors` | all four `ALL CHECKS PASSED`, exit 0 |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, exit 0 |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED`, exit 0 |

`npm test` was **not** run: it launches the live claude-CLI e2e lane against real credentials.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Gap 1 is closed and re-verifiable.** The re-verifier's truth — *"An artifact-ref whose sha is not the HEAD the named gate run was performed at is refused, and nothing is written"* — is now true through every exported writer, and the refusal has been watched failing twice.
- **Gaps 2 and 3 remain open** and are not touched here: `31-06`/`31-07` own the arm-(c) AST ban set (`UATX-06`) and the `guardPlaywrightMcpPin` authority shape (`D-08`). `31-VERIFICATION.md`'s score does not move to 6/6 on this plan alone.
- **Carry forward:** the disclosed duplicate retained-ledger event, logged in `.planning/WINDOWS.md`. It is an audit-line duplication, not a refusal weakening, and closing it needs a decision about whether an admission ledger records admissions or notes — not a patch.
- **Carry forward:** `atomicWrite` stays the named `accept` residual. It is now derived and asserted rather than described, so the day a second exported non-note-writer gains a direct filesystem write is a day the suite goes red.

## Self-Check: PASSED

Every file named under `key-files` exists on disk (`[ -f ]`): `scripts/context-io-writer-set.test.ts`,
`scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io.test.ts`,
`scripts/check-foundation-guards.test.ts`, `hooks/hook-entry.ts`, `hooks/hook-entry.js`,
`agent-factory/workflows/17-task-claim.md`, `agent-factory/workflows/18-context-compaction.md`,
`.planning/phases/31-autonomous-manual-testing/31-01-SUMMARY.md`.

All five commits resolve in `git log --oneline --all`: `0d7f8fd`, `195be24`, `acb21e2`, `00de8d0`,
`0308880`. `git rev-list --count bca4bc8..HEAD` reported **4** production/test commits before this
metadata commit, which is the number recorded in `actuals.commits`.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*
