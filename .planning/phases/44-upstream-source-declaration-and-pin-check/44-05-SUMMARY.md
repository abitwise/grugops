---
phase: 44-upstream-source-declaration-and-pin-check
plan: 05
subsystem: testing
tags: [upstream, git, runnable, integration-tests, adversarial, vitest]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01's committed upstream.js (the check sequence and the hardened git launcher) and the upstream fixture builders; plan 44-02's pinned model grammars
provides:
  - one integration case per check state of upstream.js, each with its exact line and exit code, digested before and after so no run changes a byte
  - adversarial git cases (replace refs, GIT_DIR, core.fsmonitor, partial clone, recorded subcommands, autocrlf), each with a positive control through plain git
  - fixture variants commitMore, cloneShallow, makeBare, makeNestedFolder, treeDigest, addReplaceRef, cloneAutocrlf, clonePartial, setFsmonitor, recordingGitDir
affects: [44-06, 44-07, 44-08, phase-45, phase-47]

actuals:
  tokens: 10602
  tasks: 2
  commits: 2
plan_head_before: 145b342b8716f99338f55bb21521879ed0c4eb4e
plan_head_after: 3cd200cd7c9e96abeb3c40d8f29bda413c656182

tech-stack:
  added: []
  patterns:
    - "Every check case runs through checkUnchanged: a sha256 tree digest of the product and of each upstream checkout (`.git` included) before and after the run"
    - "Every adversarial negative has its positive control in the same case, run through plain git against the same setup"
    - "A test passes only if a mutation of the committed .js makes it fail: each mitigation was removed in turn and the matching case went red"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/upstream-fixture.test-support.ts

key-decisions:
  - "upstream.ts and upstream-model.ts needed no fix: all 25 new cases describe behavior plan 44-01 already built, so no .js and no embed was regenerated"
  - "Each case was shown able to fail by a mutation probe of the committed upstream.js (eight mutations, each restored from HEAD): no top-level check, no inside re-check, no Option A exit, no listed-path mode check, no GIT_NO_REPLACE_OBJECTS, no GIT_NO_LAZY_FETCH, no GIT_* scrub, an added `git status` call"
  - "The replace-commit case asserts one `drift design: head-moved` line and no `blob-mismatch`: pinState prints no `match` line once any drift is found, so the plan's 'match plus head-moved' is read as 'the pinned blob agrees, and HEAD moved'"

patterns-established:
  - "A declared value of a fixture is read before any replace ref is added, because fixture git honors replace refs"

requirements-completed: [UP-02, UP-03, UP-04, UP-06]

coverage:
  - id: D1
    description: "Every drift and match state prints its exact line and exit code: match at the pin, head-moved one and two commits past (dirty tree), blob-mismatch, blob-mismatch before head-moved, sha256 match, config order"
    requirement: UP-06
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — check states (plan 44-05, D-13, UP-03, UP-06)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each cause that cannot be checked is one named `UNKNOWN - verify design: <reason>` line and exit 2: missing path, nested plain folder, bare repository, no git on PATH, shallow clone, 40-hex pin in a sha256 repository, duplicated manifest ID, listed path absent or a symbolic link, path resolving inside the product"
    requirement: UP-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — unknown: each cause is one named `UNKNOWN - verify` line and exit 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "A head-moved source and a missing source print both lines in config order and exit 2 (Option A)"
    requirement: UP-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#mixed: source a head-moved and source b path missing print both lines in config order and exit 2"
        status: pass
    human_judgment: false
  - id: D4
    description: "An EIO injected at the config read (derived site readRegularFileOrNull:readSync#0 via configTextOrNull), invalid JSON and a malformed declaration each exit 2 with nothing on stdout and one `Error: ` line naming .grugops/factory.config.json"
    requirement: UP-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — config read"
        status: pass
    human_judgment: false
  - id: D5
    description: "check never moves a pin: move, set and write exit 2 naming the usage; every run leaves the product and upstream digests unchanged; two runs print identical bytes"
    requirement: UP-03
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — never moves a pin"
        status: pass
    human_judgment: false
  - id: D6
    description: "Replace refs on the pinned blob and commit, an inherited GIT_DIR/GIT_WORK_TREE, a core.fsmonitor command and a blob:none partial clone cannot change what check reads, each with a positive control"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — adversarial git"
        status: pass
    human_judgment: false
  - id: D7
    description: "A recording git first on PATH sees only rev-parse, ls-tree, cat-file, config and version (all five seen), always after -C <source>"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#subcommands: a recording git first on PATH shows only rev-parse, ls-tree, cat-file, config and version"
        status: pass
    human_judgment: false
  - id: D8
    description: "An autocrlf clone with CRLF working files checks as match against the LF blob at the pin"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — pinned bytes"
        status: pass
    human_judgment: false
  - id: D9
    description: "Windows git behavior (the subcommand recorder is skipped on win32, and no Windows runner is green)"
    verification: []
    human_judgment: true
    rationale: "No Windows runner was available; the plan records Windows git behavior as UNKNOWN - verify"

duration: 11min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 05: Every check state and every git steering route proven Summary

**25 new integration cases run the committed `upstream.js` against synthetic repositories. They show that each pin state prints its exact line and exit code, and that a mixed drift and UNKNOWN run exits 2. Replace refs, an inherited `GIT_DIR`, a `core.fsmonitor` command, lazy fetch and CRLF settings each fail to change what `check` reads, and each case has a positive control. No run changes a byte of the product or the upstream.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-25T09:29:00Z
- **Completed:** 2026-11-25T09:40:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `check states`, `unknown`, `mixed`, `config read` and `never moves a pin`: 19 cases. Each expected line is typed out in full in the plan 44-01 grammar, so a changed word fails the case.
- `checkUnchanged` digests the product and every upstream checkout the case names, `.git` included, around every run. So every state case also proves UP-03: `check` writes nothing.
- The config-read EIO is injected from outside the program at a site derived from the committed `.js` (`readRegularFileOrNull:readSync#0`, entered from `configTextOrNull`), never at a typed line number.
- `adversarial git`, `subcommands` and `pinned bytes`: 7 cases. In each, plain git shows the steering is live (the replacement answers, the environment redirects, `git status` runs the hook, `cat-file` fetches the blob), while `check` is not steered.
- Eight mutation probes of the committed `upstream.js` each turned the matching case red, so no case passes vacuously.

## Task Commits

1. **Task 1: Every check state, its line and its exit code** - `9838d79f` (test)
2. **Task 2: The untrusted checkout cannot steer what git reads** - `3cd200cd` (test)

## Files Created/Modified

- `scripts/runnable-ref/upstream.test.ts`: the eight new describes, plus the helpers `sourceOf`, `productDeclaring`, `checkUnchanged`, `expectUnknown` and `plainGit`
- `scripts/runnable-ref/upstream-fixture.test-support.ts`: `commitMore` (text files and symbolic links), `cloneShallow`, `makeBare`, `makeNestedFolder`, `treeDigest`, `addReplaceRef`, `cloneAutocrlf`, `clonePartial`, `setFsmonitor`, `recordingGitDir`

## Decisions Made

- No production fix was needed. The plan allowed fixes to `upstream.ts` or `upstream-model.ts`, but every branch already behaved as the plan 44-01 grammar says. The first run of Task 1 passed all 27 cases. The first run of Task 2 had one failure, and it was a test mistake (see Issues Encountered).
- The plan says a case "must fail before it can pass". The behavior already existed, so a case could not be RED against the unchanged program. Instead, each mitigation was removed from the committed `upstream.js` in turn, the cases were run, and the file was restored from HEAD:

  | Mutation | Case that went red |
  |----------|--------------------|
  | no `--show-toplevel` equality | unknown: plain folder inside another repository |
  | no `isWithin(real, root)` re-check | unknown: path symbolic link resolving inside the product |
  | `checkExitCode` ignores unknown | mixed |
  | no listed-path mode check | unknown: listed path absent, listed path symbolic link |
  | no `GIT_NO_REPLACE_OBJECTS` | adversarial git: replace blob, replace commit |
  | no `GIT_NO_LAZY_FETCH` | adversarial git: partial clone |
  | no `GIT_*` scrub | adversarial git: GIT_DIR |
  | an added `git status` call | adversarial git: fsmonitor; subcommands |

- The replace-commit case asserts exactly one `drift design: head-moved` line and no `blob-mismatch`. The plan's wording "prints `match` plus `head-moved`" cannot be literal, because `pinState` prints no `match` line once any drift is found. The case reads it as "the true pinned blob agrees, and HEAD moved".

## Deviations from Plan

### Auto-fixed Issues

**1. [Minor] Fixture helpers take `env`, and `commitMore` takes links**
- **Found during:** Task 1
- **Issue:** the plan named `commitMore(dir, files)`, `cloneShallow(src, dest)` and so on, with no environment. Every fixture git call needs the isolated `fixtureEnv`, as `makeUpstream` already does (plan 44-01, deviation 6).
- **Fix:** each helper takes `env` as its last argument. `commitMore` also takes an optional `links` map, which the listed-path symbolic-link case needs. `setFsmonitor(dir, sentinelPath, env)` writes its hook beside the sentinel, outside the upstream. `recordingGitDir(logPath)` puts its `recording-bin` beside the log.
- **Files modified:** scripts/runnable-ref/upstream-fixture.test-support.ts
- **Committed in:** 9838d79f, 3cd200cd

**2. [Minor] The subcommand recorder also covers a partial clone**
- The recorder case declares a full clone and a partial clone, so `version` (asked only for a partial clone) is seen too. The case can then assert that the set of seen subcommands is exactly the five allowed, which is a stronger positive control than "the log is non-empty".

---

**Total deviations:** 2 minor interface choices
**Impact on plan:** No scope creep, and no production code changed.

## Issues Encountered

- The first Task 2 run failed the replace-commit case with `blob-mismatch`. The cause was in the test. `FixtureUpstream.blobOf` is evaluated lazily, and fixture git honors replace refs, so the declared `entry_blob` was read through the replacement as HEAD's blob. A probe in scratch confirmed that git with `GIT_NO_REPLACE_OBJECTS=1` returns the true blob. The case now reads the pinned blob before adding the replace ref, and so does the replace-blob case. This is recorded under patterns-established.
- `vitest run --root /` over a scratch file ran out of memory. The read sites were derived with `node` (type stripping) instead. No repository file was touched.

## Verification

- `npx vitest run scripts/runnable-ref/upstream.test.ts`: 34 passed
- `-t "check states"` 7, `-t "unknown"` 10, `-t "never moves a pin"` 3, `-t "mixed"` 1, `-t "config read"` 3, `-t "adversarial git"` 5, `-t "subcommands"` 1, `-t "pinned bytes"` 1: all passed
- `npx vitest run scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/upstream-model.test.ts scripts/validate.test.ts`: 4 files, 441 passed
- Census suites `scripts/context-io.test.ts`, `install/mode-census.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/generate-runnable-embeds.test.ts`: all passed
- `npm run typecheck`, `npm run freshness` (95 committed `.js` fresh) and `npm run freshness:runnable-embeds` (7 targets fresh): all exit 0
- Acceptance greps: `blob-mismatch` 4 and `head-moved` 10 in upstream.test.ts; `depth` 2 and `sha256` 4 in the fixture support; `adversarial git` 6, `subcommands` 2 and `fsmonitor` 4 in upstream.test.ts; `filter=blob:none` 2 in the fixture support
- Full suite not run (over 20 minutes, per the orchestrator's testing notes)

## Flagged items carried forward

- Windows git behavior is `UNKNOWN - verify`: the recorder case is skipped on win32, and no Windows runner is green (the plan's flagged assumption).
- git older than 2.45 cannot be run locally (git 2.53.0). The promisor rule is covered only by code reading (44-RESEARCH.md assumption A1).
- UP-06 concurrency is a backstop truth. `check` reads the config once and writes nothing, so a pin edited during a run is seen by the next run. No test races an edit against a run.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Plan 44-06 (the `read` verb) can reuse the fixture variants and `checkUnchanged`. Any new verb should get its own `never moves a pin` digest case, and its own recorder run, so the subcommand set stays exactly these five.
- Option A (any UNKNOWN gives exit 2) is now pinned by the `mixed` case, and it is still listed for human confirmation in plan 44-08.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
