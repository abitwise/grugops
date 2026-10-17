---
phase: 30-per-checkpoint-autonomy-matrix
plan: 05
subsystem: infra
tags: [test-integrity, emit-verdict, fail-closed, cli-dispatch, checkpoints, typescript]

requires:
  - phase: 30-per-checkpoint-autonomy-matrix
    provides: "plan 30-01's renderCheckpointBanner and BANNER_ALL_DEFAULT; plan 30-02's settled four-id SAFETY_FLOORS; plan 30-04's deriveCheckpoints, CHECKPOINT_SITE_COUNTS, RECORDED_TOTAL_SITES and the two-sided roster comparison"
  - phase: 21-shared-verified-context
    provides: "emitVerdict, the single §14-gate emission carve-out, and the writeNoteFile chokepoint it shares with appendNote"
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "the D-04 same-commit companion rule for frozen structural regions and the check-diff-disposition row schema"
provides:
  - "TestIntegrityResult — a three-state exported type mirroring the test-integrity checker's 0/1/2 exit codes, with no disabling value"
  - "emitVerdict(task, id, integrity, contextRoot?, at?) — the integrity argument required and positional-third, refusing before composition on anything but the clean sentinel and returning null"
  - "the emit-verdict CLI verb: the emission surface workflow 05 had described for two phases without it existing"
  - "a derived dispatched-command set asserted against the usage line, so a fifth verb cannot be added without appearing in the usage text"
  - "accept_human_only_failure — the fourteenth roster member, from workflow 05's human-only-failure stop bullet"
  - "workflow 05's Step 3 run banner header with banner/exit-status agreement (D-19, D-20)"
  - "docs/audit/29-style-dispositions/30-05.md — 28 companion rows for the workflow 05 frozen-section and Steps edits"
affects: [30-06, 30-07, 30-08, 30-09, generate-guarantees, validate-agent-factory]

actuals:
  tokens: 20946
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A REQUIRED, POSITIONAL parameter as the discrimination proof: a defaulted one would let every existing pin keep compiling while the new floor did nothing, so the compile break at each call site IS the evidence that the argument is load-bearing"
    - "Refuse-before-compose: the only way to guarantee no partial file is written is to have composed nothing, so the refusal sits above the first line that builds note text rather than in front of the write"
    - "Return rather than throw at a gate's terminal step: a throw is a crash where the contract promises a degraded finding at UNKNOWN - verify"
    - "State the tier in the code and in the prose: an agent-supplied argument is not a hook reading its own environment, and the residual is named rather than claimed away"
    - "Derive BOTH sides of a surface comparison from the source: the dispatched verb set and the usage line's enumerated set are each read from scripts/context-io.ts, so neither is a hand-maintained list beside the other"

key-files:
  created:
    - docs/audit/29-style-dispositions/30-05.md
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/compactor.test.ts
    - scripts/admission-server.test.ts
    - scripts/floor-invariance.test.ts
    - scripts/admission-protocol-docs.test.ts
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - agent-factory/workflows/05-pr-quality-gate.md

key-decisions:
  - "The integrity parameter is REQUIRED and POSITIONAL-THIRD with no default — the 19 tsc diagnostics it produced across 4 test files are quoted verbatim in this summary as the discrimination evidence"
  - "All 19 pins take `clean`, and the reason is stated per file rather than assumed: every one plants a REAL live green verdict as the PRECONDITION for the assertion it exists to make"
  - "emitVerdict returns `string | null` rather than throwing on refusal — a throw at the gate's terminal step is a crash where the contract promises a degraded finding"
  - "No fourth `disabled` state on TestIntegrityResult: the TINT-03 carve-out excluding a disabling value survives the move to the point of effect, asserted in a test rather than only in the validator's enum"
  - "The workflow prose spells the argument `<integrity>` rather than `<clean|finding|unknown>`: a pipe inside a disposition row's cell splits the row an extra time and the row is then not read at all"
  - "accept_human_only_failure is the id for the human-only-failure bullet — a visual-baseline acceptance and a test-integrity exit 1 are both stops that withhold a permission only a named owner can grant"
  - "The SPLIT_REQUIRED bullet stays untagged: it is routing, and no human grants anything"

patterns-established:
  - "Assert the harness's own premise before believing a mutation result: the first bypass probe here reported PASS because tsc refused to emit (noUnusedLocals on the constant the mutation orphaned), so the committed .js was never mutated at all"
  - "When two test files need one authority's value list, extract from the authority twice rather than import one test module into another — importing registers the imported module's cases a second time"

requirements-completed: [AUTO-04, AUTO-01]

coverage:
  - id: D1
    description: "emitVerdict takes the gate run's test-integrity result as an explicit required argument, performing no file read and no log read of its own to obtain it, with the argument's tier stated in the function header"
    requirement: "AUTO-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#CONTROL — the clean sentinel writes exactly one valid green verdict"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the state vocabulary is exactly the checker's three exit codes, with NO disabling value"
        status: pass
      - kind: other
        ref: "grep over scripts/context-io.ts: emitVerdict's body contains no readFileSync and no second config read; the header states the hook-enforced vs in-process split verbatim"
        status: pass
    human_judgment: false
  - id: D2
    description: "Anything other than the clean sentinel — absent, misspelled, wrong-typed or unrecognized — emits NOTHING: no note file, no partial file, and the finding stays at UNKNOWN - verify"
    requirement: "AUTO-04"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the recognized non-clean state `finding` emits NOTHING and returns null"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#every degenerate STRING value refuses, leaving the notes directory byte-identical"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#every wrong-TYPED value refuses too — the type cannot police a JavaScript caller"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#no partial or zero-length note file survives a refusal"
        status: pass
      - kind: other
        ref: "adversarial mutations M1 (deny-list instead of allow-list) and M2 (refuse AFTER the write) against the committed .js — 3 and 5 cases red respectively, with the mutation proven landed in scripts/context-io.js first"
        status: pass
    human_judgment: false
  - id: D3
    description: "No RED verdict kind is introduced; the green-verdict recognizer, the compactor and the dual-path oracle are unchanged, asserted by their existing tests staying green without edits to their expectations"
    requirement: "AUTO-04"
    verification:
      - kind: unit
        ref: "scripts/compactor.test.ts + scripts/admission-server.test.ts + scripts/floor-invariance.test.ts — 520 passing with only the integrity argument added at each pin, no expectation edited"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — oracleDualPathEquivalence PASS"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every pre-existing call site failed to compile until it was updated, because the new parameter is required and positional rather than defaulted"
    requirement: "AUTO-04"
    verification:
      - kind: other
        ref: "tsc -p tsconfig.tests.json before any pin was updated — 19 TS2345 diagnostics across 4 files, quoted verbatim in this summary"
        status: pass
    human_judgment: false
  - id: D5
    description: "The emission path the gate workflow describes exists mechanically, and the sentence claiming a command-line surface that did not exist is corrected in the same change that creates the surface"
    requirement: "AUTO-04"
    verification:
      - kind: unit
        ref: "scripts/admission-protocol-docs.test.ts#05-pr-quality-gate.md names the emission surface that EXISTS — the emit-verdict verb"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the usage line enumerates EXACTLY the set of verbs the dispatch handles"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#that comparison DISCRIMINATES — a verb missing from the usage line is refused"
        status: pass
      - kind: integration
        ref: "node scripts/context-io.js — the usage line enumerates emit-verdict alongside validate, admit and render"
        status: pass
    human_judgment: false
  - id: D6
    description: "Workflow 05's two human-stop bullets are tagged, the derived roster grew to fourteen members with its site counts re-walked, and every edited frozen section carries a companion disposition row"
    requirement: "AUTO-01"
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#`05-pr-quality-gate.md` now carries its two tags — plan 30-05 owned that file"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#the derived id→sites map matches the recorded site counts, both directions (D-03)"
        status: pass
      - kind: integration
        ref: "npm run check:diff-disposition (post-commit) — 0 findings over 37/37 elements"
        status: pass
      - kind: other
        ref: "adversarial probe: the accept_human_only_failure tag removed from the live tree → 4 cases red naming `recorded 1 site(s), derived 0`"
        status: pass
    human_judgment: false
  - id: D7
    description: "The tier statement in workflow 05 — that the refusal is worth what it is worth and no more"
    verification:
      - kind: unit
        ref: "scripts/admission-protocol-docs.test.ts#05-pr-quality-gate.md states the TIER of the integrity argument rather than overstating it"
        status: pass
    human_judgment: true
    rationale: "A pin can assert the sentence is present; it cannot assert the sentence is honest. Whether 'a different tier from the checkpoint hook' plus 'it does not stop a caller from stating clean' is a fair account of what this mechanism buys is a judgement a named human makes by reading the paragraph against emitVerdict's body. The plan's own prohibition — that the emission path must never be described as mechanically enforced when the deciding input is agent-supplied — is exactly this reading."

duration: 23 min
completed: 2026-09-05
status: complete
---

# Phase 30 Plan 05: Test-integrity at its point of effect Summary

**`emitVerdict` will no longer write a green verdict without being handed a clean test-integrity result, and everything else — a recognized non-clean state, a misspelling, a wrong type, an empty string, an absence — refuses above the first line that composes note text; the gate workflow's two-phase-old claim that `node scripts/context-io.js` exposed the emitter is now true.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-05T14:36:00Z
- **Completed:** 2026-09-05T14:59:00Z
- **Tasks:** 3
- **Files modified:** 11 modified, 1 created

## Accomplishments

- The test-integrity dial moved from a validated config enum nothing consulted to a required argument at the one function that writes the note. The parameter is **positional-third and undefaulted**, so every one of the 19 existing call sites broke the build until it was revisited — the compile break is the proof the argument is load-bearing, not a claim about it.
- The refusal sits **above** the first composition line, which is the only placement that can promise "nothing partial was written": there is nothing to leave behind if nothing was built. Two adversarial mutations confirm it — a deny-list in place of the allow-list turns 3 cases red, and moving the refusal after the write turns 5 red.
- The `emit-verdict` CLI verb now exists. `agent-factory/workflows/05-pr-quality-gate.md:47` had told the agent since Phase 21 that `node scripts/context-io.js` exposed the emitter; the dispatch handled `validate`, `admit` and `render` and every caller in the tree was a test. The sentence and the mechanism moved in one commit.
- The dispatched verb set and the usage line's enumerated set are **both derived from the source and compared**, so a fifth verb cannot land without appearing in the usage text.
- Workflow 05's two human-stop bullets carry their tags, the roster grew from thirteen members to fourteen, and `RECORDED_TOTAL_SITES` moved 14 → 16 in the same commit — which is what the two-sided comparison forces, since either half alone is red.
- Step 3 now emits the run banner as the gate run's header before any check output, with banner/exit-status agreement (D-19, D-20).

## Task Commits

1. **Task 1: emitVerdict refuses to emit unless handed a clean result** — `52ec1b5` (feat)
2. **Task 2: update every pin and add the missing command-line verb** — `6d28cee` (feat)
3. **Task 3: correct workflow 05 and tag its stop bullets** — `50f131d` (feat)

---

## The `tsc` diagnostic list, verbatim

Captured from `npx tsc -p tsconfig.tests.json` after `emitVerdict`'s signature changed and **before any pin was updated**. This is the discrimination evidence the plan required: a defaulted parameter would have produced an empty list and a floor that did nothing.

```
scripts/admission-server.test.ts(448,39): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/admission-server.test.ts(469,39): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/admission-server.test.ts(490,45): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/admission-server.test.ts(540,37): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/compactor.test.ts(861,33): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(508,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(519,39): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(593,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(611,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(625,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(658,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(697,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(818,33): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(864,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(905,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(2433,31): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(2540,42): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/context-io.test.ts(2554,55): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
scripts/floor-invariance.test.ts(304,33): error TS2345: Argument of type 'string' is not assignable to parameter of type '"finding" | "clean" | "unknown"'.
```

**19 diagnostics across 4 files.** The RESEARCH note recorded ten call expressions in `context-io.test.ts`; there are thirteen. Two of them (2540, 2554) are argument-position shifts rather than a bare added argument, because they already passed `contextRoot` in what is now the integrity slot — which is the other thing a positional parameter buys: a caller that silently kept compiling would have been passing a directory path as a safety verdict.

## The per-file pin decisions, and why each is `clean`

Every pin passes `clean`, and that is a decision rather than the path of least resistance. In all four files the emitter call is a **precondition**, not the subject: each test plants a real live green verdict so that the thing it actually measures is isolated. Handing any of them `finding` or `unknown` would delete the precondition, and the test would then pass or fail for the integrity reason instead of its own.

| file | pins | what the planted verdict is a precondition for | state |
|---|---:|---|---|
| `scripts/context-io.test.ts` | 13 | the D-01 admission cross-check (green, id-mismatch), the CR-01 CRLF read path and its LF parity control, the D-04 governance isolation, the D-14 unreadable-dial isolation, the Posture-B admitAndAppend path, and the R6-1 traversal-containment pair | `clean` |
| `scripts/admission-server.test.ts` | 4 | the Lever-1/Lever-2 padded-kind and homoglyph-role refusals, the 128-cell structural sweep, and the no-over-block routine control | `clean` |
| `scripts/compactor.test.ts` | 1 | `reVerify` accepting a faithfully compacted finding that still carries its `§14-gate#<id>` stamp | `clean` |
| `scripts/floor-invariance.test.ts` | 1 | the garbage-`human_admission` sweep, where the gate cross-check must PASS so the governance dial is the only remaining decision | `clean` |

The two R6-1 traversal cases deserve their own line: both **expect a throw**. Under any non-clean state `emitVerdict` returns `null` instead, the throw never happens, and the containment assertion those cases exist to make would silently stop being made. `clean` is the only state that keeps them testing path containment.

## The corrected workflow sentence

**Before** (`agent-factory/workflows/05-pr-quality-gate.md:47`):

> It emits by calling the `emitVerdict` carve-out in `scripts/context-io.ts`, which `node scripts/context-io.js` exposes.

**After:**

> It emits by calling the `emitVerdict` carve-out in `scripts/context-io.ts`, which `node scripts/context-io.js` exposes as the `emit-verdict` verb: `node scripts/context-io.js emit-verdict <task> <id> <integrity> [contextRoot]`. The third argument is the test-integrity result from Step 3. It takes the three states that step's exit codes already carry: `clean` for exit `0`, `finding` for exit `1`, and `unknown` for exit `2`. Only `clean` emits a verdict. `finding`, `unknown`, an unrecognized value and an absent one all refuse. Nothing is written, not even a partial file, and the finding stays at `UNKNOWN - verify`. State plainly what that argument is worth. The gate supplies it, so this is a different tier from the checkpoint hook. That hook runs as a separate process and reads an environment variable the agent under it cannot set. What the refusal buys is that a malformed, absent or unrecognized result cannot reach a green verdict. It does not stop a caller from stating `clean`.

## Bypass attempts against the committed `.js`

A green suite is not proof for a safety floor. Three mutations and one probe were run against the committed build.

| # | mutation / probe | premise asserted | result |
|---|---|---|---|
| M0 | deny-list `integrity === "finding" \|\| integrity === "unknown"` | **FAILED** — `grep` on `scripts/context-io.js` showed the old condition | **INVALID RUN.** The suite reported 156 passed, which would have read as "the tests do not discriminate". `tsc` had refused to emit (`TS6133: 'TEST_INTEGRITY_CLEAN' is declared but its value is never read`) and `noEmitOnError` kept the previous `.js`. The mutation never reached the code under test. |
| M1 | the same deny-list, rewritten so the orphaned constant is still consumed and the build emits | `grep -n 'includes(integrity)' scripts/context-io.js` matched | **RED — 3 cases.** The degenerate string sweep, the wrong-typed sweep and the no-partial-file assertion. |
| M2 | the refusal moved from above the composition to **after** `writeNoteFile` | `grep` confirmed the guard's new line number in the emitted `.js` | **RED — 5 cases.** Write-then-refuse is caught by the byte-identical snapshot, which is why the snapshot is taken against a non-empty directory. |
| P1 | the `accept_human_only_failure` tag deleted from the live workflow file | `grep -c` on the workflow: 1 → 0 → 1 after restore | **RED — 4 cases**, the first naming `accept_human_only_failure: recorded 1 site(s), derived 0 (no bullet in the corpus carries this tag)`. |

**M0 is the finding worth carrying forward.** It is the sixth time in this repository that a verification harness produced a false result about its own premise, and the failure mode was new: the mutation was syntactically valid TypeScript and semantically the bypass under test, but it orphaned a constant, `noUnusedLocals` made that an error, and `noEmitOnError` silently preserved the previous build output. A `npm run build` whose output was discarded reported nothing. The green run that followed was a measurement of the **unmutated** code. Every mutation here is now confirmed landed in the emitted `.js` by `grep` before its result is believed.

## Files Created/Modified

- `scripts/context-io.ts` — `TestIntegrityResult`, the required positional parameter, the refuse-before-compose branch, the tier statement in the header, and the `emit-verdict` dispatch arm with its usage-line entry
- `scripts/context-io.test.ts` — the integrity block (control, both recognized states, the derived degenerate sweep, seven wrong-typed values, the no-partial assertion, the placement pin, the vocabulary pin) and the CLI surface block (derived verb-set equality, its discrimination probe, and three verb cases)
- `scripts/compactor.test.ts`, `scripts/admission-server.test.ts`, `scripts/floor-invariance.test.ts` — pins updated
- `scripts/admission-protocol-docs.test.ts` — three new wording pins, moved in the same commit as the prose they pin
- `scripts/checkpoints.ts` — `accept_human_only_failure` in the union, in `CHECKPOINT_DEFAULTS` at `block`, in `CHECKPOINT_SITE_COUNTS` at 1; `exhaust_self_fix_budget` 4 → 5; `RECORDED_TOTAL_SITES` 14 → 16
- `scripts/checkpoints.test.ts` — the 30-04 "carries no tag yet" pin inverted to its positive form; the disposition-file set comparison now reads both `30-04.md` and `30-05.md`
- `agent-factory/workflows/05-pr-quality-gate.md` — the banner header in Step 3, the corrected emission paragraph and tier statement in Step 5, and the two tagged stop bullets
- `docs/audit/29-style-dispositions/30-05.md` — 28 companion rows

## Decisions Made

- **`string | null` rather than a throw on refusal.** The gate's own contract says a refused admission degrades to `UNKNOWN - verify`; a throw at the terminal step is a crash where a degraded finding was promised.
- **No fourth `disabled` state.** The plan's unresolved prohibition — that the test-integrity dial must never gain a disabling value — is now enforced at two places rather than one: the validator's enum, and a test over `TEST_INTEGRITY_RESULTS` asserting the vocabulary is exactly the checker's three exit codes.
- **`<integrity>` in the workflow prose, `<clean|finding|unknown>` in the CLI usage line.** A pipe inside a disposition row's `before`/`after` cell splits the row an extra time and the row is then not read at all — the gate says so by name. The prose names the three values in the following sentence instead.
- **A second extraction of `HUMAN_ADMISSION_VALUES` rather than an import.** `scripts/checkpoints.test.ts` already extracts that list from `scripts/floor-invariance.test.ts` for the same reason: importing a test module registers its cases a second time, and that module is spawn-heavy. The VALUES have one authority; the extractor is duplicated, and each copy refuses a short or anchor-less result rather than trusting it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `scripts/checkpoints.ts` and `scripts/checkpoints.test.ts` edited despite being absent from `files_modified`**
- **Found during:** Task 3
- **Issue:** The plan's `files_modified` list omits both files, but tagging workflow 05 is impossible without them: plan 30-04's `CHECKPOINT_SITE_COUNTS` records `exhaust_self_fix_budget: 4` and no `accept_human_only_failure`, and `scripts/checkpoints.test.ts:1024` pinned `05-pr-quality-gate.md` as carrying no tag. Tagging the file without the roster edit makes the two-sided comparison red in both directions.
- **Fix:** Union member, `block` default, site counts (4 → 5, new id at 1) and `RECORDED_TOTAL_SITES` (14 → 16) added in the same commit as the tag; the 30-04 pin inverted to its positive form; the disposition-file set comparison widened to read both plans' files.
- **Files modified:** `scripts/checkpoints.ts`, `scripts/checkpoints.js`, `scripts/checkpoints.test.ts`
- **Verification:** `scripts/checkpoints.test.ts` 78/78, and probe P1 above proves the site counts re-walked rather than merely being edited to agree.
- **Committed in:** `50f131d`

**2. [Rule 1 - Bug] Four sentences exceeded the controlled-language bounds and one opened with an unapproved verb**
- **Found during:** Task 3
- **Issue:** `npm run check:imperative-lexicon` refused the first draft: `Print` is not in `APPROVED_STEP_VERBS`, two Step 3 sentences exceeded the 20-word procedural bound (25 and 34), and four Step 5 sentences exceeded the 25-word descriptive bound (26, 27, 31, 34).
- **Fix:** `Print` → `Emit` (an approved verb), and each long sentence split at its natural clause boundary. No claim was dropped; the pins in `scripts/admission-protocol-docs.test.ts` were updated to the split wording in the same commit.
- **Files modified:** `agent-factory/workflows/05-pr-quality-gate.md`, `scripts/admission-protocol-docs.test.ts`
- **Verification:** `npm run check:imperative-lexicon` ALL CHECKS PASSED.
- **Committed in:** `50f131d`

**3. [Rule 3 - Blocking] Task 1's `npm run typecheck` verify cannot pass at Task 1**
- **Found during:** Task 1
- **Issue:** Task 1's `<verify>` requires a clean `npm run typecheck`, while its `<action>` requires capturing the compile break BEFORE any pin is updated and Task 2 owns the other three test files' pins. The two instructions are mutually exclusive at Task 1's boundary.
- **Fix:** The verifiable one won, as it did in plan 30-01. Task 1's commit leaves `compactor.test.ts`, `admission-server.test.ts` and `floor-invariance.test.ts` failing `tsc -p tsconfig.tests.json` — by construction, since that failure IS this plan's discrimination evidence — and Task 2's commit clears it. `npm run build` (which excludes test files) is green at every commit, so the committed `.js` is never stale.
- **Files modified:** none
- **Verification:** `npm run typecheck` exits 0 at `6d28cee` and at HEAD.
- **Committed in:** n/a (a sequencing decision, not a code change)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** No scope creep. Deviation 1 was explicitly pre-announced by plan 30-04 and pinned as an assertion there; deviations 2 and 3 are the plan's own instructions meeting the tree's guards and its own task ordering.

## Issues Encountered

- **The first bypass probe lied.** M0 above: `noEmitOnError` preserved the previous `.js` when the mutation orphaned a constant, so a green suite was reporting on unmutated code. Caught by grepping the emitted `.js` for the mutation before believing the result. Every probe in this plan now asserts its own premise the same way.
- **A pipe in a disposition cell is not a parse error, it is a silent short row.** Writing `<clean|finding|unknown>` into the workflow prose would have put pipes into two `after` cells; the gate reports such lines by name, which is how it was caught, but the remedy — reword the prose — was cheaper than escaping.
- **Clause segmentation splits at an em-dash.** Two rows had to be split after the sentences were shortened, because `The banner is … produces — the same line the hook prints on a denial.` is two clauses to `check-diff-disposition`, not one.

## Known Stubs

None. Every surface this plan touched is implemented and exercised.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for plan 30-06**, which owns the validator, the config JSON twins, the fixtures and `factory.config.md`. Two things it inherits: the roster is now **fourteen** members, so any hand-written count of thirteen in the validator or in config prose is stale; and `accept_human_only_failure` needs whatever config cell the other thirteen members carry.
- **`quality.test_integrity`'s enum in `scripts/validate-agent-factory.ts:356` is untouched by this plan** and still carries its no-`off` carve-out. This plan added a second, independent statement of that carve-out (the `TEST_INTEGRITY_RESULTS` vocabulary test); if 30-06 edits the enum, both must move.
- **The residual is stated, not closed.** A caller determined to pass `clean` still can. That is named in `emitVerdict`'s header, in workflow 05's Step 5, and in this summary's D7 coverage entry with `human_judgment: true`. Red-team surface A (D-21) covers `emitVerdict`'s TI refusal and has not yet run.

## Self-Check: PASSED

- `docs/audit/29-style-dispositions/30-05.md` — FOUND
- `52ec1b5`, `6d28cee`, `50f131d` — all FOUND in `git log`
- `npx vitest run --exclude '**/scripts/e2e/**'` — 1 failed / 2595 passed / 2 skipped. The one failure is the known pre-existing `scripts/frontmatter.test.ts` D-49 control on a Phase 29.1 planning document (V-30-01-01), which is the recorded baseline and not this plan's.
- `npm run build && npm run typecheck && npm run check:build-parity && npm run freshness` — all green (52/52 committed `.js` match a rebuild)
- `npm run check:diff-disposition` — ALL CHECKS PASSED, 0 findings over 37/37 elements, post-commit
- `npm run check:imperative-lexicon && npm run check:public-docs && npm run check:banned-claims && npm run check:claim-anchors` — all green
- `node scripts/check-foundation-guards.js` — ALL CHECKS PASSED

---
*Phase: 30-per-checkpoint-autonomy-matrix*
*Completed: 2026-09-05*
