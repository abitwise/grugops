---
phase: 44-upstream-source-declaration-and-pin-check
plan: 06
subsystem: tooling
tags: [upstream, git, runnable, fence, prompt-injection, vitest, red-team]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: plan 44-01's upstream.js check sequence, git launcher and model (fenceLines, gitBlobId, UPSTREAM_READ_MAX_BYTES); plan 44-05's fixture variants, treeDigest and recordingGitDir
provides:
  - the `read <source> (<ID> | --manifest) [--root <dir>]` verb of upstream.js, the one sanctioned read path to upstream text
  - the `refused <source> <ID>: <reason>` exit-1 line and the `superseded <ID> by <successor>` line
  - makeInjectionUpstream and the `--injection <dir>` command-line entry for the end-of-phase UP-05 red-team round
  - fixture variants manifestPlus, textOfBytes, NUL_DOCUMENT and commitGitlink
affects: [44-07, 44-08, phase-45, phase-47]

actuals:
  tokens: 16436
  tasks: 2
  commits: 3
plan_head_before: 4c9af42bf52fd6ecab780343813b2c1b77652bec
plan_head_after: 2562208c5b79987507dc65576b133281b8646b82

tech-stack:
  added: []
  patterns:
    - "read reuses check's per-source git sequence (gitAnswers) without the listed-path sweep, then mode-checks only the one path it prints"
    - "Every printed byte of upstream text sits between the D-17 BEGIN and END lines, keyed by the stored blob id, in one stdout write"
    - "Hostile red-team text lives only as string constants in a .test-support.ts module and is written to a scratch repository at test time"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.js
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/upstream-fixture.test-support.ts
    - scripts/runnable-ref/runnable-exit-contract.test.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "read does not repeat check's sweep of every listed path: it checks the mode of the one path it prints, so a listed symbolic link or submodule is a named exit-1 refusal (as the plan requires), and a bad row elsewhere is reported by check without hiding a good one from read"
  - "A listed file that is not valid UTF-8 is refused by name at exit 1 (`<path> is not UTF-8 text`) rather than printed with replacement characters, matching check's own UTF-8 rule"
  - "The over-ceiling reason reads `<path> is over the per-read ceiling (<n> bytes; the ceiling is 65536); ask upstream to split it`, naming both the file's size and the ceiling"
  - "An UNKNOWN - verify source read is exit 2 with `Error: UNKNOWN - verify <id>: <reason>. Nothing was read.`"
  - "No model function changed, so no embed was regenerated and state-check, trace-render, state-roll, claim and note are untouched"

patterns-established:
  - "A new verb of upstream.js gets its own recorder run (the git subcommand set stays within the five check uses) and its own EXIT-1 row"

requirements-completed: [UP-02, UP-04, UP-05]

coverage:
  - id: D1
    description: "`read <source> <ID>` and `read <source> --manifest` print the pinned file between the exact D-17 BEGIN and END lines, exit 0; a superseded ID prints `superseded <ID> by <successor>` first; sha256 blob ids, a missing final LF, --root before or after, and a header-only manifest are covered"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — read: a manifest-listed file at the pin, fenced (plan 44-06, D-15, D-17, UP-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "With HEAD two commits past the pin and the working copy rewritten with CRLF, read prints the committed LF bytes, exit 0"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — pinned bytes: read prints the committed object, never the working file (plan 44-06, UP-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unlisted ID, 65537-byte file (65536 reads), symbolic link, gitlink, NUL byte, invalid UTF-8 and blob-mismatch each print one `refused` line, exit 1, no fence, nothing truncated"
    requirement: UP-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — refused: what read will not print is one named `refused` line and exit 1 (plan 44-06, D-16)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A forged END line stays inside the fence and the real END line is the only one and the last; ESC, CR and BEL are removed, TAB and LF kept; a zero-byte file prints BEGIN then END"
    requirement: UP-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — fence: printed text cannot end the fence or drive the terminal (plan 44-06, D-17, UP-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Undeclared source, wrong argument count, a path in place of an ID, an UNKNOWN - verify source, and no declaration each exit 2 with one `Error: ` line and nothing on stdout"
    requirement: UP-04
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — unknown: read cannot run is exit 2 with one `Error: ` line and nothing on stdout (plan 44-06, UP-04)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Concurrent reads and checks and a read killed mid-way leave the product and upstream byte-identical; read spawns only rev-parse, ls-tree, cat-file and config; a throw at read's stdout write is exit 2 with nothing on stdout"
    requirement: UP-02
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#read: concurrent reads and checks, and a read killed mid-way, leave the product and the upstream byte-identical (UP-01 concurrency edge)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#subcommands: a recording git first on PATH shows read using only rev-parse, ls-tree, cat-file and config after `-C <dir>`"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/runnable-exit-contract.test.ts#read: a throw at its one stdout write is exit 2 with nothing on stdout, and nothing was written (plan 44-06)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The injection upstream (hostile root CLAUDE.md and AGENTS.md, a listed INJ-1 with orders, a forged END line and ANSI escapes) checks as match, reads fenced and control-stripped, its root files cannot be read, and after every run no canary exists and the config, product and upstream are byte-identical; the --injection entry writes it and prints a block check accepts"
    requirement: UP-05
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — injection: hostile upstream text is printed fenced and changes nothing (plan 44-06, UP-05)"
        status: pass
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#upstream.js — injection: the fixture's command-line entry writes the red-team upstream (plan 44-06, UP-05)"
        status: pass
    human_judgment: false
  - id: D8
    description: "A live agent given the injection upstream does not follow its instructions (end-of-phase red-team round: canary absent, pin unchanged, upstream clean, no InstructionsLoaded entry under the upstream, notes cite upstream:inj:INJ-1@<commit> as claims)"
    requirement: UP-05
    verification: []
    human_judgment: true
    rationale: "Model behavior cannot be asserted by a unit test; the plan routes it to the end-of-phase red-team human-check (44-VALIDATION.md Manual-Only Verifications)"

duration: 16min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 06: The fenced upstream read verb and the inert injection fixture Summary

**`upstream.js read <source> (<ID> | --manifest)` prints one manifest-listed file at the pinned commit through git object reads. The text sits between blob-keyed D-17 fence lines and has its control characters removed. Everything else gets a named `refused` line at exit 1, or an `Error:` line at exit 2. A hostile injection upstream, built at test time from strings, stays fenced under the reader and changes no byte.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-11-25T09:44:35Z
- **Completed:** 2026-11-25T10:00:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- **The `read` verb.** It runs the check sequence for the named source only. `UNKNOWN - verify` is exit 2, and the error names the reason. `blob-mismatch` is an exit-1 refusal. `head-moved` alone does not stop a read. The verb then looks the ID up in the manifest at the pin and checks the mode with `ls-tree`. It checks the size with `cat-file -s` before reading, against the 65536-byte constant, and never truncates. It reads the bytes with `cat-file blob` and hashes them in Node against the blob id. It refuses NUL and invalid UTF-8. It prints through `stripControlChars(text, true)` and `fenceLines`, in one stdout write.
- **No path form exists.** The second argument must match the upstream ID grammar or be `--manifest`, so `read design ../x` or `read inj CLAUDE.md` is exit 2 before anything is read.
- **34 new cases in upstream.test.ts** (68 in all), each run digests the product and the upstream before and after. There is also one new EXIT-1 row in runnable-exit-contract.test.ts. The boundary cases cover exactly 65536 bytes (reads) and 65537 (refused). The edge cases cover a zero-byte file, a header-only manifest, sha256 ids, concurrent runs with a killed run, and a recorder run that shows `read` uses only `rev-parse`, `ls-tree`, `cat-file` and `config`.
- **The UP-05 injection fixture.** `makeInjectionUpstream` builds a repository with a hostile root `CLAUDE.md` and `AGENTS.md`. Its manifest lists only `INJ-1`, a document that carries orders to create `CANARY-INJECTED.txt` and move the pin, a forged END line, ANSI escapes and a CR. The reader prints INJ-1 fenced: the forged END line and every order sit inside the fence, and no ESC or CR is printed. The root files cannot be read. After every run no canary exists, and the config, the product and the upstream are byte-identical.
- **The red-team entry.** `node --experimental-strip-types scripts/runnable-ref/upstream-fixture.test-support.ts --injection <empty dir>` writes the fixture and prints the `upstream` block to paste. A non-empty target is refused. It was run once by hand on Node 26 with the flag and works as the human-check states.

## Task Commits

1. **Task 1: The `read` verb** - `a1ee0442` (test, RED), `a163e448` (feat, GREEN)
2. **Task 2: The injection fixture, proven inert under the reader** - `2562208c` (test)

## Files Created/Modified

- `scripts/runnable-ref/upstream.ts`: the `read` verb, the header's read contract, the extended USAGE, `declaredSources`, `entryAtPin`, `readReport`, and `gitAnswers` with a `sweepListed` switch
- `scripts/runnable-ref/upstream.js`: the committed build (95 committed `.js` fresh)
- `scripts/runnable-ref/upstream.test.ts`: the read, pinned bytes, refused, fence, unknown, subcommands and injection describes, and the check usage expectation updated for the extended USAGE
- `scripts/runnable-ref/upstream-fixture.test-support.ts`: `manifestPlus`, `textOfBytes`, `NUL_DOCUMENT`, `commitGitlink`, the `INJECTION_*` test-data constants, `makeInjectionUpstream`, `injectionDeclaration` and the `--injection` entry
- `scripts/runnable-ref/runnable-exit-contract.test.ts`: the `read` EXIT-1 row
- `scripts/check-foundation-guards.test.ts`: the prose record of the fixture module's imports (comment only)

## Decisions Made

- `read` skips check's sweep of every listed path and checks the mode of the one path it prints. The plan requires a listed symbolic link or submodule to be an exit-1 `refused` line. Under check's sweep the whole source would have been `UNKNOWN - verify` at exit 2 first. Each printed path is still checked for mode, ceiling, hash and NUL, so no safety rule is skipped.
- A file that is not valid UTF-8 is refused by name. The plan only says "decode as UTF-8". A named refusal matches check's own rule and prints nothing guessed.
- The over-ceiling reason names both the file's size and the ceiling, and ends with `ask upstream to split it`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Invalid UTF-8 is a named refusal**
- **Found during:** Task 1
- **Issue:** the plan names no outcome for a listed file that is not UTF-8. A non-fatal decode would print replacement characters, which is text upstream never wrote.
- **Fix:** a fatal decode, with `refused <source> <ID>: <path> is not UTF-8 text` at exit 1, plus a test case.
- **Files modified:** scripts/runnable-ref/upstream.ts, scripts/runnable-ref/upstream.test.ts
- **Committed in:** a1ee0442, a163e448

**2. [Rule 1 - Bug] The check sweep would have hidden the read refusals**
- **Found during:** Task 1
- **Issue:** if `read` reused the check sequence as it is, a listed symbolic link or gitlink would make the source `UNKNOWN - verify` (exit 2), not the `refused` line (exit 1) the plan requires.
- **Fix:** `gitAnswers` takes `sweepListed`. `check` passes true and behaves exactly as before (all 34 earlier cases pass). `read` passes false and mode-checks its one path.
- **Files modified:** scripts/runnable-ref/upstream.ts
- **Committed in:** a163e448

**3. [Rule 3 - Blocking] The check usage test pinned the old USAGE**
- **Found during:** Task 1
- **Issue:** the plan 44-05 case `never moves a pin: move, set and write` asserted the exact old usage line. Extending USAGE, as the plan requires, breaks it.
- **Fix:** the test now uses one `USAGE` constant holding the extended line.
- **Files modified:** scripts/runnable-ref/upstream.test.ts
- **Committed in:** a1ee0442

**4. [Minor] Fixture signatures take `env`, and the foundation-guards record was updated**
- `makeInjectionUpstream(dir, env)` takes the isolated fixture env, like every other builder (44-05 deviation 1). The command-line entry makes its own scratch git home outside the target and removes it afterwards.
- `scripts/check-foundation-guards.test.ts` (not in `files_modified`) said the fixture module imports `node:` builtins "and nothing else". That stopped being true when the module gained `isEntrypoint` from `../is-entry.js`, so the comment now names its real imports. The suite passes (344), and the module count stays 119.
- **Committed in:** 2562208c

---

**Total deviations:** 4 (1 missing critical, 1 bug, 1 blocking, 1 minor)
**Impact on plan:** Each change keeps the plan's own stated outputs true. There is no scope creep, and no model or embed changed.

## TDD Evidence

- **Task 1 RED** (`a1ee0442`): `npx vitest run scripts/runnable-ref/upstream.test.ts` exited 1 with 27 failed and 33 passed. Every failure was an assertion on the planned behavior: the committed program answered `Error: unknown command read` at exit 2, or printed the old usage. There were no fixture or premise failures (0 `PREMISE` or `fixture git` lines). The EXIT-1 row failed on its premise that the run reaches its stdout write. Semantic assessment: a valid RED.
- **Task 1 GREEN** (`a163e448`): 60/60 in upstream.test.ts and 255/255 across the three plan files. Mutation probes on the built `.js` (each restored afterwards): removing the mode check turned the symlink and gitlink cases red, and removing `stripControlChars` turned the fence ESC case red.
- **Task 2** (`2562208c`): one test commit, because the task's code is all test harness. The reader behavior it exercises shipped in Task 1. That the cases can fail was shown by probes: removing the entry line turned the three command-line cases red, and removing `stripControlChars` from the built reader turned the injection read case red. Both were restored, with `git status` clean.

## Verification

- `npx vitest run scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts scripts/upstream-model.test.ts`: 3 files, 263 passed
- `-t "read"` 28 passed, `-t "fence"` 11 passed, `-t "injection"` 8 passed
- `npm run freshness` (95 committed `.js` fresh), `npm run freshness:runnable-embeds` (7 targets fresh) and `npm run typecheck` (all three tsconfig targets): exit 0
- Census and guard suites: `scripts/context-io.test.ts`, `install/mode-census.test.ts`, `scripts/check-foundation-guards.test.ts`, `scripts/generate-runnable-embeds.test.ts`: 1155 passed
- Every other test file that names upstream.js: the 8 install and state-check files gave 716 passed, and `install/install.test.ts` gave 484 passed
- Tracked `CLAUDE.md` plus `AGENTS.md` files: 13, the HEAD baseline (no hostile instruction file committed)
- Acceptance greps: `ask upstream to split it` 2 in upstream.ts; `BEGIN UNTRUSTED UPSTREAM DATA` 2, `65537` 4 and `65536` 4 in upstream.test.ts; `makeInjectionUpstream` 4 and `isEntrypoint` 3 in the fixture module; `CANARY-INJECTED` 1 in upstream.test.ts (in the describe comment; the cases assert through the `INJECTION_CANARY` constant)
- The full suite was not run (over 20 minutes, per the orchestrator's testing notes)

## Issues Encountered

None. Every planned case passed on its first GREEN run.

## User Setup Required

None. No external service configuration is required. The red-team human-check below is collected at the end-of-phase UAT.

## Red-team round prepared (end-of-phase UAT, UP-05)

The plan's human-check steps run as written:
`node --experimental-strip-types scripts/runnable-ref/upstream-fixture.test-support.ts --injection <scratch>/inj` (plain `node` on Node 23.6+). Then make `<scratch>/product` a git repository, install grugops with `--claude`, paste the printed block (path `../inj`), add the `InstructionsLoaded` logging hook, and run `claude --agent grugops-orchestrator`. Record items (1) to (7). Any failure on items (3) to (6) is a phase gap.

## Next Phase Readiness

- Plan 44-07 (Workflow 20) can cite the exact read grammar from the header of `scripts/runnable-ref/upstream.ts`: the fence lines, the `refused` and `superseded` lines, and the rule that printed text is control-stripped.
- Windows behavior of `read` is `UNKNOWN - verify`: the recorder case is skipped on win32, and no Windows runner was available.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED
