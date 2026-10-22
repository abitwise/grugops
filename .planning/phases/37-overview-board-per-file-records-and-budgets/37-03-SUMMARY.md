---
phase: 37-overview-board-per-file-records-and-budgets
plan: 03
subsystem: state-budgets
tags: [embed-generator, freshness-gate, host-runnable, state-check, typescript-compiler-api, censuses]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-01: BUDGETS, BOARD_REL, LAYOUT_MARKER_REL and LAYOUT_MARKER_CONTENT in install/state-layout.ts"
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-02: the import-free scripts/state-rules.ts (markerState, boardBudgetFindings, formatFinding, sortFindings, unmeasuredFinding, formatMarkerWarning)"
provides:
  - scripts/generate-runnable-embeds.ts, the one embed generator (EMBED_OPEN, EMBED_CLOSE, EMBED_SPECS, EMBED_SPEC_COUNT, deriveRegion, rewriteRunnable, regionSpans)
  - scripts/runnable-embeds-freshness.ts, wired in the ubuntu CI gate block and as npm run freshness:runnable-embeds
  - scripts/runnable-ref/state-check.ts and its committed .js, a builtins-only host checker for the board budget under the marker's severity (D-04, D-05, D-12)
  - A generated-region admission rule in the LAYOUT-02 ownership census and the non-blocking-reader cardinality census
affects: [37-04, 37-05, 37-09, 37-13, 37-19]

actuals:
  tokens: 35897
  tasks: 1
  commits: 1
plan_head_before: e9d0fe5a60c4d6e4c12adb1a49e352a597d19d37
plan_head_after: 83fed422a58bb9bd204f1231ac94a469965c2dca

tech-stack:
  added: []
  patterns:
    - "Embed by generation: a rule or number a host runnable needs is copied verbatim from its authority into a marked region by a generator and held equal to it by a freshness gate, never retyped"
    - "The closure is resolved by the TypeScript type checker (noLib, noResolve) over one authority file, so a local that shadows a top-level name and a member name are never mistaken for references"
    - "A census admits a generated copy by where it sits (inside a span regionSpans returns, in an EMBED_SPECS target, with a fresh region), never by a file name"

key-files:
  created:
    - scripts/generate-runnable-embeds.ts
    - scripts/generate-runnable-embeds.js
    - scripts/generate-runnable-embeds.test.ts
    - scripts/runnable-embeds-freshness.ts
    - scripts/runnable-embeds-freshness.js
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/state-check.js
    - scripts/runnable-ref/state-check.test.ts
  modified:
    - scripts/check-state-paths.test.ts
    - scripts/nonblocking-reader-parity.test.ts
    - scripts/check-foundation-guards.test.ts
    - install/mode-census.test.ts
    - package.json
    - .github/workflows/ci.yml

key-decisions:
  - "The closure is resolved with the TypeScript type checker over a one-file program (noLib, noResolve), not by matching identifier text, so a local that shadows a top-level name and a property name never pull in a declaration"
  - "The generator loads typescript at run time through createRequire, as js-import-closure.ts does; its types come from an `import type` that the emitted .js does not carry, so the committed .js imports builtins and relative modules only"
  - "Each authority's block in a region opens with one `// from <module>` line; each declaration is its getText() text, so a leading JSDoc block is not copied (comments inside a declaration are)"
  - "state-check embeds unmeasuredFinding and formatMarkerWarning as well as the four planned state-rules roots, so a missing board is a finding by name and an unrecognized marker is worded as the validator words it"
  - "state-check stats each state path before it opens it: a present path that is not a regular file is exit 2 naming it, without an open; the read itself still goes through the embedded non-blocking reader"
  - "A state file larger than a 16 MiB reader ceiling is refused (exit 2). The ceiling is a reader bound in the hand-written part, not a budget"

patterns-established:
  - "A host runnable's hand-written part imports builtins as namespaces (nodeFs, nodePath), so an embedded named import never collides with it"
  - "An exit-2 path writes only to stderr and never prints a pass line; every stdout line is composed before anything is printed"

requirements-completed: [SPLIT-05, SPLIT-04]

coverage:
  - id: D1
    description: "The generator copies each root's declaration closure verbatim and in source order with one merged node: import line per specifier, and refuses a non-node: import, a duplicate name across authorities and LEGACY_STATE_ROOT_REL, each naming what it met"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#deriveRegion — the closure, verbatim and in source order (7 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The freshness gate exits 1 naming the target and the remedy on a one-character hand edit inside a region (temporary mirror), exits 0 on the committed tree, and is wired in package.json and in the ubuntu CI gate block"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "scripts/generate-runnable-embeds.test.ts#one character edited inside a region makes the freshness gate exit 1 naming the target (temporary mirror)"
        status: pass
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#package.json declares both scripts and .github/workflows/ci.yml runs the gate"
        status: pass
      - kind: other
        ref: "node scripts/runnable-embeds-freshness.js exits 0 (1 target fresh)"
        status: pass
    human_judgment: false
  - id: D3
    description: "EMBED_SPECS is pinned two-sided against EMBED_SPEC_COUNT, with a mutated-copy control"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/generate-runnable-embeds.test.ts#EMBED_SPECS.length equals EMBED_SPEC_COUNT, and a mutated copy does not"
        status: pass
    human_judgment: false
  - id: D4
    description: "state-check.js, copied alone into an empty temporary directory, follows D-12 and the marker severity: a 24,577-byte board warns with exit 0 without a marker and fails with exit 1 with the D-14 marker; an unrecognized marker is a WARN naming it; no argument, a missing root, a file root, a directory at the board path and an unreadable board are exit 2 with nothing on stdout"
    requirement: SPLIT-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/state-check.test.ts (11 cases, host emulation)"
        status: pass
      - kind: other
        ref: "node scripts/runnable-ref/state-check.js exits 2; node scripts/runnable-ref/state-check.js . prints No findings. and exits 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The LAYOUT-02 ownership census and the non-blocking-reader cardinality census admit a copy only inside a fresh generated region of an EMBED_SPECS target, located by regionSpans, with controls for a literal outside the region and a region in a module that is not a target"
    requirement: SPLIT-05
    verification:
      - kind: unit
        ref: "scripts/check-state-paths.test.ts#ownership: the new state root is spelled only by its authority and two declared carriers (LAYOUT-02)"
        status: pass
      - kind: unit
        ref: "scripts/nonblocking-reader-parity.test.ts#every implementation inside a generated region sits in an EMBED_SPECS target whose region is fresh"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-10-22
status: complete
---

# Phase 37 Plan 03: Generated embeds and the host state-check Summary

**`scripts/generate-runnable-embeds.ts` copies the declaration closure of named roots, verbatim, from four authority modules into one marked region of a host runnable, and refuses anything a host could not run. A freshness gate wired in CI holds every region equal to its authorities. The first runnable on it, `scripts/runnable-ref/state-check.js`, imports only `node:` builtins, measures the board budget, and routes findings by the layout marker under the D-12 exit contract.**

## Performance

- **Duration:** about 23 min
- **Started:** 2026-10-22T08:15:56Z
- **Completed:** 2026-10-22T08:39:39Z
- **Tasks:** 1 (tracer)
- **Files modified:** 14 (8 created, 6 modified)

## Accomplishments

- **The generator.** For each `EMBED_SPECS` row it parses each authority with the TypeScript compiler API, in a one-file program with `noLib` and `noResolve`. It indexes the top-level declarations and closes the roots through the type checker, so it follows what a name resolves to, not its spelling. It emits:
  - one sorted `import { … } from "node:…";` line per specifier, with an alias such as `constants as fsConstants` kept as written;
  - then each authority's declarations in source order, under one `// from <module>` line.

  It refuses, each time naming the module and what it met:
  - a closure that reaches a non-`node:` import;
  - two declarations with one name in one target;
  - LEGACY_STATE_ROOT_REL;
  - a root that is not a top-level declaration;
  - an authority listed twice;
  - an embedded line equal to a marker.
- **The region in state-check.** It embeds:
  - BUDGETS and the four paths it needs from state-layout (STATE_ROOT_REL comes in through BOARD_REL);
  - 18 declarations from state-rules;
  - the board grammar closure of parseBoard, normalizeDocument and stripHtmlComments;
  - readRegularFileOrNull with ReadPositionRefusal and its condition list from context-io.

  The only imports are `closeSync`, `constants as fsConstants`, `fstatSync`, `openSync` and `readSync` from `node:fs`.
- **The freshness gate.** `scripts/runnable-embeds-freshness.ts` re-derives every region. If a region differs, it prints `Runnable-embeds freshness check FAILED: <target> … Remedy: npm run generate:runnable-embeds` and exits 1. A derivation that throws is the same failure. The gate is wired as `npm run freshness:runnable-embeds` inside the existing ubuntu gate run block (no new step), and as `generate:runnable-embeds` / `freshness:runnable-embeds` in package.json.
- **state-check.js.** The CLI is `node state-check.js <repo-root>`:
  - Exit 2 when it could not run: no argument (usage on stderr), a root that cannot be resolved, is not a directory or is not readable, a present state path that is not a regular file (refused by stat, never opened), or a present file the reader refuses. Exit 2 writes nothing on stdout.
  - With a valid marker, each finding prints as `FINDING  …` and the exit code is 1.
  - Otherwise each finding prints as `WARN     …` and the exit code is 0. An unrecognized marker adds a WARN line worded by `formatMarkerWarning`. An absent marker adds the validator's `LAYOUT` line.
  - With no findings it prints `No findings.`.
  - A missing board is an `unmeasuredFinding`.
- **Census amendments, each by rule with a dated reason:**
  - **check-state-paths.test.ts.** A module outside the three STATE_ROOT_REL holders is admitted only when it is an EMBED_SPECS target and every literal in it that holds STATE_ROOT_REL lies inside a `regionSpans` span. The case also requires that target's region to be fresh. A control covers a literal outside the region, a module that is not a target, and a target with no region.
  - **nonblocking-reader-parity.test.ts.** The cardinality axis counts implementations outside generated regions, so the count is still 2. A new case requires every in-region implementation to sit in a target with a fresh region. A control seeds one implementation inside a region and one outside.

## Task Commits

1. **Task 1: tracer, generated embeds, their gate, and a host state-check that measures the board:** `83fed422` (feat)

**Plan metadata:** recorded in the docs(37-03) completion commit.

## Files Created/Modified

- `scripts/generate-runnable-embeds.ts`, `.js`: the generator and EMBED_SPECS (1 row, pinned).
- `scripts/runnable-embeds-freshness.ts`, `.js`: the gate.
- `scripts/runnable-ref/state-check.ts`, `.js`: the host checker, with its generated region.
- `scripts/generate-runnable-embeds.test.ts`: 14 tests (closure, shadowing, refusals, spans, freshness drift in a mirror, two-sided pin, wiring at both ends).
- `scripts/runnable-ref/state-check.test.ts`: 11 host-emulation tests.
- `scripts/check-state-paths.test.ts`, `scripts/nonblocking-reader-parity.test.ts`: the generated-region rule and its controls.
- `scripts/check-foundation-guards.test.ts`, `install/mode-census.test.ts`: pins re-derived by listing.
- `package.json`, `.github/workflows/ci.yml`: the two scripts and one gate line with a two-line comment.

## Decisions Made

See `key-decisions` above. In short:

- The closure is resolved by the type checker, not by identifier text. A fixture test proves that a local `lines` shadowing a top-level `lines`, and a property named `lines`, pull in neither.
- `typescript` is loaded lazily at run time. The committed `.js` carries no static `typescript` import.
- Declarations are copied with `getText()`, so the JSDoc block before a declaration is not copied, and a section banner before it is not either.
- state-check embeds `unmeasuredFinding` and `formatMarkerWarning`, so its wording matches the validator's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Two more state-rules roots**
- **Found during:** Task 1
- **Issue:** the planned roots (markerState, boardBudgetFindings, formatFinding, sortFindings) have no way to spell a missing board as a finding, or to word an unrecognized marker the way the validator does.
- **Fix:** added `unmeasuredFinding` and `formatMarkerWarning` to the state-rules roots. 37-02 exported both for this purpose.
- **Files modified:** scripts/generate-runnable-embeds.ts
- **Committed in:** 83fed422

**2. [Rule 2 - Missing critical] Stat before open in state-check**
- **Found during:** Task 1
- **Issue:** the handoff rule from 37-02 is that a FIFO is never opened. The embedded reader opens without blocking and checks the descriptor, but it does open the path.
- **Fix:** `readState` runs `statSync` first. A present path that is not a regular file is exit 2 naming it, and the path is not opened.
- **Verification:** the directory-at-board-path case.
- **Committed in:** 83fed422

**3. [Rule 3 - Blocking] Two census pins the plan did not name**
- **Found during:** Task 1
- **Issue:** `check-foundation-guards.test.ts` also pins:
  - the `scripts/`-scoped import-reader corpus and its comparison count (66, 66 * 3);
  - the number of tests that read the ubuntu gate block through the testkit authority (4).
- **Fix:** corpus 66 → 68 and 68 * 3, by listing `ls scripts/*.ts` minus tests. `UBUNTU_BLOCK_READER_COUNT` 4 → 5. The generator test's first draft spelled its own locator for the ubuntu block, which the guard caught; the test now imports `ciWorkflow` and `ubuntuBlockCommands` from `scripts/ci-workflow.testkit.ts`. Each pin has a dated reason.
- **Committed in:** 83fed422

**4. [Rule 1 - Bug] A test fixture spelled the old state root**
- **Found during:** Task 1
- **Issue:** the LEGACY_STATE_ROOT_REL refusal fixture first held the value `"plans"`. The old-spelling gate counted it as a site outside the allow-list.
- **Fix:** the fixture value is now `"legacy-root"`. The refusal is by name, so the case proves the same thing.
- **Committed in:** 83fed422

**5. [Rule 1 - Bug] The unreadable-board case is gated on the platform**
- **Found during:** Task 1
- **Issue:** CI runs vitest on windows-latest as well. On Windows, and when running as root, a mode-000 file is still readable.
- **Fix:** `it.skipIf(process.platform === "win32" || process.getuid?.() === 0)`, with the reason in a comment.
- **Committed in:** 83fed422

**Total deviations:** 5 auto-fixed (2 missing critical, 1 blocking, 2 bugs). **Impact:** no scope change.

**Dates.** The two census amendments carry the date the plan specified, 2026-10-21. The re-derived pins carry the day they were measured, 2026-10-22, as in 37-02.

## Issues Encountered

- Bootstrap order. The first `npm run build` needs a state-check.ts that compiles before its region exists. It was first written with an empty region and two `void` lines. Then came the build, the generator run to fill the region, and only then the CLI.
- The freshness gate's drift test runs the copied gate in a mirror under the gitignored `.temp/`, so the gate resolves `typescript` from this checkout's node_modules. The tree itself is never edited.

## Verification

- `npm run build`, `npm run typecheck`: exit 0.
- `npx vitest run scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/check-state-paths.test.ts scripts/nonblocking-reader-parity.test.ts scripts/check-foundation-guards.test.ts install/mode-census.test.ts --maxWorkers=1`: 6 files, 409 passed.
- Related censuses: `scripts/validate.test.ts`, `scripts/board-readonly.test.ts`, `scripts/uat-gate-exit-contract.test.ts`, `scripts/context-io.test.ts`, `scripts/context-io-writer-set.test.ts`: 1,292 passed and 14 failed. All 14 failures are in the 37-BASELINE list (they read archived phase-31 records), and none is new.
- After the commit:
  - `node scripts/runnable-embeds-freshness.js`: 1 target fresh.
  - `node scripts/check-state-paths.js`: PASS.
  - `npm run freshness`: 83 committed `.js` fresh.
  - `npm run freshness:hook-manifest`: fresh.
  - `node scripts/check-foundation-guards.js`, `node scripts/check-nul-bytes.js`: pass.
  - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict`: exit 0.
- Acceptance greps:
  - `<runnable-embeds>` in state-check.ts: 1.
  - Relative imports in state-check.ts: 0.
  - `freshness:runnable-embeds`: 1 each in ci.yml and package.json.
  - `node scripts/runnable-ref/state-check.js`: exit 2.
  - `node scripts/runnable-ref/state-check.js .`: exit 0 (`No findings.`).
- Tracer gate (interactive, end-of-phase, automated-only verify): verify re-run on the committed tree, green.
- Not run: the full non-e2e suite (project rule: plans 37-08, 37-13 and 37-19 run it).

## User Setup Required

None.

## Next Phase Readiness

- Plan 37-04 can add roots to the one EMBED_SPECS row (the other budget rules, doneRowFindings, indexLineFindings, fileBytesFinding, budgetEntryNames) and extend `readState` to every state path. It also adds the FIFO case, `--json` and output sanitization.
- Plans 37-05 and 37-09 can add rows for new runnables. Each new row moves EMBED_SPEC_COUNT, with a dated reason.
- state-check is not yet materialized into `tools/grugops/` by the installer. RUNNABLES and its mirror are unchanged in this plan.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-22*

## Self-Check: PASSED

All eight created key files exist on disk, and the task commit 83fed422 is an ancestor of HEAD. All acceptance criteria and plan verification commands passed.
