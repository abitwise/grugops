---
phase: 44-upstream-source-declaration-and-pin-check
plan: 01
subsystem: tooling
tags: [upstream, git, runnable, embeds, trace, typescript]

requires:
  - phase: 41-host-runnables
    provides: the claim.ts / note.ts runnable shape, the D-12 exit contract and the row-sibling import rule of the embed generator
provides:
  - scripts/upstream-model.ts, the one pure authority for the upstream declaration, path rule, entry manifest, refs, blob id, fence and pin decision
  - scripts/runnable-ref/upstream.ts and its committed upstream.js, the host upstream reader with the `check` verb and the hardened git launcher
  - the TRC-02 routing rule (UPSTREAM_REF_PREFIX first in classifyRef, BR reserved) carried into every runnable in one generation
  - scripts/runnable-ref/upstream-fixture.test-support.ts, synthetic upstream repositories built at test time
affects: [44-02, 44-03, 44-04, 44-05, 44-06, 44-07, 44-08, phase-45, phase-47]

actuals:
  tokens: 45606
  tasks: 2
  commits: 3
plan_head_before: 1cf87a8d71d1f468156604811c656aa9368cf1c7
plan_head_after: c32277cd860208e625f9e9a53d45c5e034342ac2

tech-stack:
  added: []
  patterns:
    - "Pure authority plus generated embed: upstream-model.ts decides, upstream.ts only asks git and prints"
    - "One git launcher: GIT_* scrubbed, four read-safety switches, shell false, 20 s timeout, object reads only"
    - "Two-pass first generation: a stub target with empty markers, build, generate, then the hand-written part"

key-files:
  created:
    - scripts/upstream-model.ts
    - scripts/upstream-model.js
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.js
    - scripts/runnable-ref/upstream-fixture.test-support.ts
    - scripts/runnable-ref/upstream.test.ts
  modified:
    - scripts/trace-model.ts
    - scripts/generate-runnable-embeds.ts
    - scripts/runnable-ref/state-check.ts
    - scripts/runnable-ref/trace-render.ts
    - scripts/runnable-ref/state-roll.ts
    - scripts/runnable-ref/claim.ts
    - scripts/runnable-ref/note.ts
    - scripts/generate-runnable-embeds.test.ts
    - scripts/runnable-ref/state-check.test.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/context-io.test.ts

key-decisions:
  - "Mixed-result exit is Option A: any UNKNOWN - verify gives exit 2, so an unchecked source never sits behind the drift exit (flagged for confirmation at UAT in plan 44-08)"
  - "A lexical path finding is a per-source UNKNOWN - verify line, not a run-level exit 2, following the plan's per-source order"
  - "Listed manifest paths are checked with one ls-tree call over the listed paths as literal pathspecs, not a whole-tree ls-tree -r, so output stays bounded by the manifest"
  - "The checkout's object format is read first (rev-parse --show-object-format), so a 40-hex pin in a sha256 checkout is named as a format mismatch, not as a missing commit"
  - "Until plan 44-03 adds the installer row, upstream.js is the one named member of RUNNABLE_SET the installer does not install, asserted both ways so the pin turns red when 44-03 lands"

patterns-established:
  - "Upstream refs: upstream:<source>:<ID>@<full commit>; trace-model owns the prefix, upstream-model the grammar"
  - "A source that cannot be checked throws SourceUnknown inside the runnable; the reason becomes its one UNKNOWN - verify line"

requirements-completed: [UP-01, UP-03, UP-06, TRC-02]

coverage:
  - id: D1
    description: "A declared synthetic sha1 source checks as `match <id> <commit>` with exit 0 through the committed upstream.js"
    requirement: UP-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#a declared sha1 source whose pin, entry blob and manifest agree prints `match <id> <commit>` and exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zero-config: no factory.config.json, or no upstream key, prints `no upstream sources declared` and exits 0; no .grugops directory exits 2 with one Error line"
    requirement: UP-01
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — none declared (plan 44-01, UP-01 zero-config)"
        status: pass
    human_judgment: false
  - id: D3
    description: "upstream.js writes nothing: no write verb, read-only config open, a stdout throw leaves the tree unchanged"
    requirement: UP-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#check: a throw at its one stdout write is exit 2 with nothing on stdout, and nothing was written"
        status: pass
      - kind: other
        ref: "grep -cE 'writeFileSync|appendFileSync|renameSync|unlinkSync|mkdirSync' scripts/runnable-ref/upstream.js == 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Blob-mismatch drift detection (UP-06) and the full drift/UNKNOWN grammar; exercised ad hoc in this plan, formally proven by plans 44-02 and 44-05"
    requirement: UP-06
    verification:
      - kind: manual_procedural
        ref: "ad hoc probe in scratch: match, head-moved, blob-mismatch + head-moved, missing path, inside, ancestor, listed symlink, inherited GIT_DIR"
        status: pass
    human_judgment: true
    rationale: "No committed test asserts the drift lines yet; plans 44-02 (model) and 44-05 (runnable states) own those proofs"
  - id: D5
    description: "classifyRef routes `upstream:` refs to Requirement and BR-<n> is a reserved prefix, shipped in the same generation to trace-render and state-check"
    requirement: TRC-02
    verification:
      - kind: unit
        ref: "node probe: classifyRef(upstream:design:DEC-12@<40 hex>) = Requirement, classifyRef(BR-3) = Requirement, isTicketRef(BR-3) = false"
        status: pass
      - kind: other
        ref: "npm run freshness:runnable-embeds (7 targets fresh)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every pin the new runnable and modules move is re-derived, dated and green"
    verification:
      - kind: unit
        ref: "npx vitest run scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/check-foundation-guards.test.ts scripts/context-io.test.ts"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (ALL CHECKS PASSED)"
        status: pass
    human_judgment: false

duration: 37min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 01: Upstream source declaration and pin check, tracer Summary

**A declared synthetic upstream source is checked end to end, from `.grugops/factory.config.json` through the new pure authority `scripts/upstream-model.ts`, the generated region and a hardened `git -C` launcher, to `match design <commit>` and exit 0. The same generation ships the TRC-02 trace rule (`upstream:` refs go to Requirement, `BR` is reserved) to every runnable.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-11-25T07:59:08Z
- **Completed:** 2026-11-25T08:36:00Z
- **Tasks:** 2
- **Files modified:** 25 (6 created; generated `.js` included)

## Accomplishments

- `scripts/upstream-model.ts`: the declaration grammar (closed key sets refused by name, id, hex, entry, `owns` with one owner per area and prefix), the lexical path rule resolved against the repository root (inside and ancestor refused through the imported `isWithin`), the entry-manifest table parser (one header, four cells, supersession chains ending at a locked row), refs, `gitBlobId`, the D-17 fence lines, `pinState`, `checkExitCode` (Option A) and `formatCheckLine`.
- `scripts/runnable-ref/upstream.ts` with its committed `upstream.js`: the `check` verb, a config read through the embedded root-chain owner and non-blocking reader, and one git launcher that scrubs every `GIT_*` variable and sets `GIT_NO_REPLACE_OBJECTS`, `GIT_NO_LAZY_FETCH`, `GIT_LITERAL_PATHSPECS` and `GIT_TERMINAL_PROMPT=0`. It uses only `rev-parse`, `ls-tree`, `cat-file`, `config` and `version`. Blob bytes are re-hashed in Node, checked for size, NUL bytes and UTF-8. All stdout goes out in one write.
- The seventh EMBED_SPECS row; one generation moved the stamp of all five existing runnables. `RUNNABLE_SET` now has six members.
- Test-time synthetic upstream builder with an isolated git environment (scratch HOME, no system or global config, inherited `GIT_*` dropped), and host-copy tests for the match and none-declared states.

## Task Commits

1. **Task 1: tracer, a declared source checks as `match`, upstream refs route to Requirement** - `ce0a80b6` (feat)
2. **Task 2: move the pins the new runnable and modules move** - `e8049a21` (test)
3. **Deviation: the AUTO-06 config-site census** - `c32277cd` (test)

## Files Created/Modified

- `scripts/upstream-model.ts` (+ `.js`): the pure upstream authority
- `scripts/runnable-ref/upstream.ts` (+ `.js`): the host upstream reader
- `scripts/runnable-ref/upstream-fixture.test-support.ts`: synthetic upstream and product builders (not emitted)
- `scripts/runnable-ref/upstream.test.ts`: `check states` and `none declared` cases
- `scripts/trace-model.ts` (+ `.js`): `UPSTREAM_REF_PREFIX`, the first classifyRef rule, `BR` reserved
- `scripts/generate-runnable-embeds.ts` (+ `.js`): the upstream row, `EMBED_SPEC_COUNT = 7`
- `scripts/runnable-ref/{state-check,trace-render,state-roll,claim,note}.ts` (+ `.js`): regenerated regions only
- `scripts/generate-runnable-embeds.test.ts`, `scripts/runnable-ref/state-check.test.ts`, `scripts/runnable-ref/runnable-exit-contract.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/context-io.test.ts`: moved pins, each dated

## Decisions Made

See `key-decisions` above. The exit choice (Option A), the source id grammar, the full-length hex pins and the one-owner rule for areas and prefixes are the items plan 44-08 lists under `## Open confirmation items` for the human at UAT.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two-pass first generation**
- **Found during:** Task 1, step 4
- **Issue:** `npm run generate:runnable-embeds` runs the committed generator `.js` after a full `tsc`. A complete `upstream.ts` with an empty region does not compile, and the committed generator did not yet have the new row.
- **Fix:** wrote a stub target (empty markers), built, ran the generator twice (the first run used the old 6-row generator, the build then compiled the 7-row one), then spliced the hand-written header and tail around the generated region without touching it, and ran the generator once more. The freshness gate confirms the region.
- **Files modified:** scripts/runnable-ref/upstream.ts
- **Commit:** ce0a80b6

**2. [Rule 2 - Robustness] Listed paths checked with literal pathspecs**
- **Found during:** Task 1, step 3
- **Issue:** the plan's whole-tree `ls-tree -r -z --full-tree <commit>` under a `maxBuffer` of 256 KiB fails with ENOBUFS on an upstream with a few thousand files (asset-heavy design repositories are likely).
- **Fix:** one `ls-tree -r -z --full-tree <commit> -- <listed paths>` call with `GIT_LITERAL_PATHSPECS=1`, so the output is bounded by the manifest; each listed path is looked up exactly and must be mode 100644 or 100755. Probed: a listed symbolic link gives `listed path d/a.md is not a regular file at the pin`. Residual: on Windows a manifest whose paths exceed about 32,000 characters would fail the launch and report `UNKNOWN - verify`, never a pass.
- **Files modified:** scripts/runnable-ref/upstream.ts
- **Commit:** ce0a80b6

**3. [Rule 1 - Correct message] Object format read before the pin**
- **Found during:** Task 1, step 3
- **Issue:** for a 40-hex pin in a sha256 checkout, `rev-parse --verify` exits 1, which the plan's sequence would report as `pinned commit ... is not in the checkout (shallow clone or not fetched)`, a wrong cause.
- **Fix:** `rev-parse --show-object-format` runs first, and a mismatch is `the pin is 40-hex but the checkout uses 64-hex object ids`. The plan's length check after `--verify` is kept. Also added: a pin that peels to a different id (a tag object) is `pinned object ... is not a commit`, and a manifest blob that is not UTF-8 is named.
- **Files modified:** scripts/runnable-ref/upstream.ts
- **Commit:** ce0a80b6

**4. [Rule 3 - Blocking] Installer two-sided check in generate-runnable-embeds.test.ts**
- **Found during:** Task 2, step 1
- **Issue:** the case `RUNNABLE_SET equals the installer's destination names ... two-sided` requires every runnable's `.js` to have an `install/install.ts` RUNNABLES row. That row is plan 44-03's (wave 2), so this plan could not pass the case honestly.
- **Fix:** the case now names `scripts/runnable-ref/upstream.js` in `NOT_YET_INSTALLED` and asserts both ways that it is the only target missing from the installer. When plan 44-03 adds the row, the case turns red, and that plan must empty the list. **Plan 44-03 must update this case.**
- **Files modified:** scripts/generate-runnable-embeds.test.ts
- **Commit:** e8049a21

**5. [Rule 3 - Blocking] AUTO-06 config-site census in context-io.test.ts**
- **Found during:** post-task regression run of the 26 other test files that enumerate runnables
- **Issue:** the census of files that spell `factory.config.json` went from 14 to 16 (upstream.ts and the fixture harness), and both were undocumented.
- **Fix:** asked the census's question of each: neither is a second governance reader. upstream.ts reads only the `upstream` block and decides no checkpoint; the harness writes a scratch config. Annotated both, moved `CONFIG_PATH_SITE_COUNT` 14 to 16 with a dated paragraph.
- **Files modified:** scripts/context-io.test.ts
- **Commit:** c32277cd

**6. [Minor] makeUpstream takes `env` in its options**
- The plan named `makeUpstream(dir, {files, objectFormat})`; the options object also carries `env` (from `fixtureEnv`), so no module-level state holds the fixture home. `SYNTHETIC_ENTRY`, `SYNTHETIC_DOCUMENTS` and `syntheticFiles()` were added beside `SYNTHETIC_MANIFEST`.

---

**Total deviations:** 6 (1 Rule 1, 1 Rule 2, 3 Rule 3, 1 minor interface addition)
**Impact on plan:** No scope creep. The output grammar is exactly the plan's. Deviation 4 hands one test edit to plan 44-03.

## Issues Encountered

- The first `npm run freshness` after Task 1 reported the two new `.js` files as uncommitted build output; it passed once they were committed (95 committed `.js` fresh).

## Verification

- `npx vitest run scripts/runnable-ref/upstream.test.ts scripts/generate-runnable-embeds.test.ts scripts/runnable-ref/state-check.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/check-foundation-guards.test.ts`: 5 files, 618 tests passed
- `npx vitest run scripts/context-io-writer-set.test.ts scripts/runnable-ref/trace-render.test.ts scripts/runnable-ref/note.test.ts scripts/runnable-ref/claim.test.ts scripts/runnable-ref/state-roll.test.ts`: 615 passed
- 26 further test files that enumerate runnables (install census, read-sites, trace, validate): 25 passed and context-io.test.ts had 2 failures, fixed by deviation 5; context-io.test.ts then passed 758 tests with 1 skipped
- `scripts/trace-model.test.ts`: 53 passed
- `npm run freshness`, `npm run freshness:runnable-embeds` (7 targets), `npm run typecheck`, `node scripts/check-foundation-guards.js` (ALL CHECKS PASSED): all exit 0
- Full suite not run (over 20 minutes; per the orchestrator's testing notes)

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Plans 44-02 (model tests) and 44-03 (installer row) can start. 44-03 must also empty `NOT_YET_INSTALLED` in `scripts/generate-runnable-embeds.test.ts` (deviation 4).
- Plans 44-05 and 44-06 need no generator change: the upstream-model roots they call are already embedded.
- Known residual (from research): a raw `DEC-012` ref without the `upstream:` namespace still becomes a phantom ticket row; Phase 45 TRC-03 owns detection.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
