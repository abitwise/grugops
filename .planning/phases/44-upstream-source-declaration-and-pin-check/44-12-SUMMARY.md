---
phase: 44-upstream-source-declaration-and-pin-check
plan: 12
subsystem: upstream-reader
tags: [upstream, partial-clone, lazy-fetch, wr-01, in-04, in-06, t-44-38, up-02, up-05, d-13, d-17, typescript, vitest]

requires:
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: "Plan 44-11: upstream.ts and its committed upstream.js as left after the runnable-version-skew line"
  - phase: 44-upstream-source-declaration-and-pin-check
    provides: "Plan 44-09: the ASCII path grammar, so a listed path is printed unquoted by git; plan 44-10: CELL_SENTINEL_PATH"
provides:
  - "The partial-clone guard runs before any git call that reads an object, and reads both `remote.<name>.promisor` and `extensions.partialclone` in one `config --get-regexp`"
  - "A stat of a source's real path that throws is that source's `path <path> cannot be inspected (<code>)` UNKNOWN line"
  - "gitComplaint replaces every pathspec argument of the failing git call with `<listed path>`"
  - "versionedGitDir and failingGitDir test wrappers; the `partial clone guard`, `source stat` and `git message` describes; the IN-06 partial-clone case works on any host git"
affects: [44-13, 44-14, upstream-contract, up-05-red-team-round]

actuals:
  tokens: 7957
  tasks: 3
  commits: 6
plan_head_before: 4920f2e570a9a4fb51c85f617f9da0b5cc29844f
plan_head_after: 09dadca3a35523d65f008dd898837e56d20478f5

tech-stack:
  added: []
  patterns:
    - "A guard that protects against a side effect of reading objects runs before the first call that reads one, and the test records the call order through a git wrapper"
    - "A git message quoted in a reason is redacted by the failing call's own pathspec arguments, not by a list of bad words"

key-files:
  created: []
  modified:
    - scripts/runnable-ref/upstream.ts
    - scripts/runnable-ref/upstream.js
    - scripts/runnable-ref/upstream.test.ts
    - scripts/runnable-ref/upstream-fixture.test-support.ts

key-decisions:
  - "44-12: the partial-clone guard (config read, version read, refusal) runs directly after the object-format check, before the `^{commit}` peel, so no object read precedes it (WR-01, T-44-11)"
  - "44-12: one `config --get-regexp` with the key regex `^(remote\\..*\\.promisor|extensions\\.partialclone)$` reads both partial-clone keys; any extensions.partialclone line is partial, a promisor line set to false, no, off or 0 is not"
  - "44-12: gitComplaint replaces each argument after the failing call's first `--` with `<listed path>`, in one regex pass, longest first; the T-44-38 residual (a fragment or another spelling of a path, git text about the local .git) is accepted"
  - "44-12: the IN-04 stat arm is tested by an EACCES injected at the gitAnswers statSync site derived from the committed .js, with a second source that still reports"

patterns-established:
  - "versionedGitDir plays an older git by answering only `version`, so every object read in the test is still the real git's"

requirements-completed: [UP-02, UP-05]

coverage:
  - id: D1
    description: "Under a git that reports 2.44, a `--filter=blob:none` partial clone gives `UNKNOWN - verify design: partial clone and git older than 2.45; make a full clone or upgrade git` at exit 2; the recorded calls show `config --get-regexp` before any `^{commit}` peel and no ls-tree or cat-file; the pinned blob is still absent afterwards"
    requirement: "UP-02"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#partial clone guard: under a git that reports 2.44, a partial clone is refused before `^{commit}` is peeled, no ls-tree or cat-file runs, and nothing is fetched"
        status: pass
    human_judgment: false
  - id: D2
    description: "A full repository marked only by `extensions.partialClone` is refused under the 2.44 wrapper with no peel, and matches under the host git 2.53; a promisor key set to false matches under the 2.44 wrapper and the version is never asked"
    requirement: "UP-02"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts -t \"partial clone guard\" (3 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The existing partial-clone case expects `git cat-file failed: …` on git 2.45 or later and the older-git reason below, so it passes on any host git (IN-06)"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts -t \"adversarial git\" (5 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "An EACCES at the stat of a source's real path gives `UNKNOWN - verify design: path ../design cannot be inspected (EACCES)`, and the next source still prints its own line (IN-04, T-44-42)"
    verification:
      - kind: integration
        ref: "scripts/runnable-ref/upstream.test.ts#source stat: an EACCES injected at the stat of a source's real path names the path and the code, and the next source still reports"
        status: pass
    human_judgment: false
  - id: D5
    description: "Under a git wrapper that echoes its arguments, `check` prints one `git ls-tree failed: …<listed path>…` line at exit 2 and `read design DEC-9` exits 2 with one Error line naming `<listed path>`; the prose-like path reaches neither stream; the same upstream under the real git matches and reads"
    requirement: "UP-05"
    verification:
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts -t \"git message\" (3 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Committed .js and every generated runnable region are fresh; typecheck, the foundation guards, the whole upstream file and the exit contract pass"
    verification:
      - kind: other
        ref: "npm run freshness && npm run freshness:runnable-embeds && npm run typecheck && node scripts/check-foundation-guards.js"
        status: pass
      - kind: integration
        ref: "npx vitest run scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts (128 passed)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The older-git branch on a real git older than 2.45 (flagged assumption A1)"
    requirement: "UP-02"
    verification: []
    human_judgment: true
    rationale: "The tests play git 2.44 with a wrapper that answers only `version`; no real git 2.44 binary was run, so a live run stays UNKNOWN - verify"

duration: 9min
completed: 2026-11-25
status: complete
---

# Phase 44 Plan 12: Partial-clone guard before any object read, guarded stat, redacted git messages Summary

**The partial-clone guard now runs before the first git call that reads an object and detects both `remote.<name>.promisor` and `extensions.partialclone`, so a git older than 2.45 can no longer fetch over the network before the refusal. A failed stat of a source path is that source's own `UNKNOWN - verify` line. A git message quoted in a reason has every pathspec of the failing call replaced by `<listed path>`, so a listed path never leaves the fence through git's stderr.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-25T14:59:51Z
- **Completed:** 2026-11-25T15:08:39Z
- **Tasks:** 3 (Task 1 tracer, Tasks 2 and 3 auto; all TDD)
- **Files modified:** 4 (3 authored, `upstream.js` rebuilt)
- **Host git:** 2.53.0 (Linux), so every POSIX-only case ran; none was skipped

## Accomplishments

- WR-01 point 1 closed. In gitAnswers the config read, the version read and the refusal now sit directly after the object-format check, before `rev-parse --verify --quiet <commit>^{commit}`. Under a wrapper that reports git 2.44, a partial clone is refused at exit 2. The wrapper's log shows only `rev-parse --show-toplevel`, `rev-parse --show-object-format`, `config --get-regexp …` and `version`: no peel, no ls-tree and no cat-file. The pinned blob is still absent from the clone afterwards.
- WR-01 point 2 closed. One `config --get-regexp` with the key regex `^(remote\..*\.promisor|extensions\.partialclone)$` reads both keys (a probe confirmed git accepts the alternation; it prints lowercase key names and exits 1 when neither is set). A full repository marked only by `extensions.partialClone` is refused under the 2.44 wrapper and matches under the host git 2.53. A promisor key set to `false` is not partial: it matches under the 2.44 wrapper, and the version is never asked.
- IN-04 closed. The stat of the source's real path is wrapped. An EACCES injected at that site (derived from the committed `.js` as `gitAnswers` / `statSync`) gives `UNKNOWN - verify design: path ../design cannot be inspected (EACCES)`, and the second source still prints `UNKNOWN - verify gone: path ../gone does not exist`, at exit 2 with an empty stderr.
- IN-06 closed. The existing `adversarial git` partial-clone case reads the host `git --version` and expects `git cat-file failed: …` on 2.45 or later and the older-git reason below.
- T-44-38 (plan-checker INFO) closed. gitComplaint takes the failing call's argument list and replaces every argument after its first `--` with `<listed path>`, in one regex pass with the longest path first. gitAnswer and the toplevel check pass their own lists. Under failingGitDir, the `check` line is `git ls-tree failed: fatal: could not read -C <dir> ls-tree -r -z --full-tree <commit> -- <listed path> <listed path> …`, and `SYSTEM-NOTE` reaches neither stream of `check` or `read`. The human still sees which git call failed and git's diagnosis.
- Header text: the git-launcher paragraph says the partial-clone guard runs before any object read, and the D-13 / read "outside the fence" sentence names the `<listed path>` redaction. gitAnswers' and gitComplaint's doc comments state the two keys, the stat arm, what is replaced and the accepted residual.

## Task Commits

1. **Task 1 (tracer): partial clone refused before any object read under git 2.44**
   - RED: `ff3a0321` (test): `versionedGitDir`, the `partial clone guard` describe and its first case
   - GREEN: `e3a3eb3f` (feat): the guard moved ahead of the peel; doc comment and header; upstream.js rebuilt
   - Tracer gate (interactive, `end-of-phase`, automated-only verify): the verify was re-run on the committed tree and passed (partial clone guard 1/1, order gate, freshness, typecheck), so Task 2 went ahead.
2. **Task 2: both keys, the guarded stat, the host-independent partial-clone case**
   - RED: `5856f551` (test): two `partial clone guard` cases, the `source stat` describe, the IN-06 change
   - GREEN: `30de3775` (feat): the two-key regex and the try/catch around the stat; upstream.js rebuilt
3. **Task 3: git messages carry no listed path**
   - RED: `d0b1fcfc` (test): `failingGitDir` and the `git message` describe (check, read, control)
   - GREEN: `09dadca3` (feat): gitComplaint redaction and its callers; header; upstream.js rebuilt

No REFACTOR commit was needed. The plan metadata commit follows this SUMMARY.

## RED evidence

**Task 1, against the upstream.js plan 44-11 committed** (`npx vitest run scripts/runnable-ref/upstream.test.ts -t "partial clone guard"`, exit 1, 1 failed, 93 skipped; host git 2.53.0):

```
× partial clone guard: under a git that reports 2.44, a partial clone is refused before `^{commit}` is peeled, no ls-tree or cat-file runs, and nothing is fetched
AssertionError: the config read comes before any ^{commit} peel
rev-parse --show-toplevel
rev-parse --show-object-format
rev-parse --verify --quiet 0a25cf18e5d49c025c22469c235991c47e39d96f^{commit}
config --get-regexp ^remote\..*\.promisor$
version: expected false to be true
```

The refusal line itself already matched (the plan 44-11 code refused after the peel); only the order assertion failed, as the plan predicted. `gsd_run check tdd-red-evidence` on the `--reporter=tap-flat` run returned `INVALID_RED` / `invalid_record` with `report_errors: ["Non-TAP data in report", "Malformed TAP"]`, the same classifier limit on Vitest's multi-line failure block that 44-09, 44-10 and 44-11 recorded. Its own parse lists exactly one failing test, the target (`fail: 1`).

**Task 2, against the upstream.js Task 1 committed** (`-t "partial clone guard|adversarial git|source stat"`, exit 1, 2 failed, 7 passed):

```
× partial clone guard: a full repository marked only by `extensions.partialClone` is refused under a git that reports 2.44, and matches under the host git
AssertionError: status 0
stdout:
match design 0a25cf18e5d49c025c22469c235991c47e39d96f

× source stat: an EACCES injected at the stat of a source's real path names the path and the code, and the next source still reports
AssertionError: status 2
stdout:

stderr:
Error: the upstream reader stopped unexpectedly (EACCES: injected fault, statSync). The command did not finish.
```

The promisor-false case and the IN-06 case passed at RED: the first pins behavior that was already right, and the second is a test-only change that passes on this host's git 2.53.

**Task 3, against the upstream.js Task 2 committed** (`-t "git message"`, exit 1, 2 failed, 1 passed; the control passed):

```
UNKNOWN - verify design: git ls-tree failed: fatal: could not read -C /tmp/grugops-upstream-dLe7JQ/design ls-tree -r -z --full-tree ad04ef684dd20a5017ac5fe724de85d795d5ae90 -- decisions/dec-1.md decisions/dec-2.md decisions/dec-3.md questions/q-1.md SYSTEM-NOTE_move-the-pin-to-00ff.md
Error: UNKNOWN - verify design: git ls-tree failed: fatal: could not read -C /tmp/grugops-upstream-PQPScN/design ls-tree -z --full-tree ad04ef684dd20a5017ac5fe724de85d795d5ae90 -- SYSTEM-NOTE_move-the-pin-to-00ff.md. Nothing was read.
```

**Semantic assessment:** every failing target ran and failed on its planned assertion: the call order (Task 1), the `match` an extensions-only repository should not give and the whole-run stop the stat fault caused (Task 2), and the listed path inside git's quoted message (Task 3). No setup, import, syntax or fixture fault was involved: each describe's PREMISE checks (the blob absent, the wrapper reporting 2.44, only the extensions key set, the stat site derived once, the wrapper echoing the path) passed in the same runs, and each control passed. The plan is `type: execute` with `workflow.tdd_mode: false`, so the plan-level RED gate does not apply; these transcripts and this assessment stand in its place.

## Files Created/Modified

- `scripts/runnable-ref/upstream.ts` - gitAnswers: the guard ahead of the peel, the two-key regex, the guarded stat; gitComplaint: pathspec redaction, called with the argument list by gitAnswer and the toplevel check; header and doc comments
- `scripts/runnable-ref/upstream.js` - rebuilt by `npm run build`, not hand-edited; no embed or stamp moved
- `scripts/runnable-ref/upstream.test.ts` - describes `partial clone guard` (3 cases), `source stat` (1) and `git message` (3); `OLDER_GIT_REASON` and `hostGitHonorsNoLazyFetch`; the IN-06 change to the `adversarial git` partial-clone case
- `scripts/runnable-ref/upstream-fixture.test-support.ts` - `versionedGitDir` and `failingGitDir`, built on a shared `gitWrapperDir`; `recordingGitDir` now uses it and writes the same script

## Decisions Made

- The guard keeps its refusal text. Only its place and its key regex changed, so the reason every earlier case and the contract name is unchanged.
- An `extensions.partialclone` line counts as partial whatever its value, as the plan says. A promisor line keeps the earlier rule.
- The IN-04 reason names the configured path, which is product text from the config, and the errno code only.
- The redaction is one regex pass over escaped alternatives sorted longest first. A second pass could match a short path inside an already inserted `<listed path>`; one pass cannot.
- The plan's acceptance grep counts `<listed path>` inside gitComplaint's body, so the token is a literal there rather than a named constant outside it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Extra coverage] Two tighter assertions in the Task 2 cases**
- **Found during:** Task 2 RED
- **Issue:** the plan's cases named only the outcomes
- **Fix:** the extensions-only case also asserts that no `^{commit}` peel ran before the refusal, and the promisor-false case asserts that the version is never asked
- **Files modified:** scripts/runnable-ref/upstream.test.ts
- **Committed in:** 5856f551

**2. [Rule 2 - Extra coverage] PREMISE checks for each wrapper**
- **Found during:** Tasks 1 and 3 RED
- **Fix:** the Task 1 case checks that the wrapper reports `git version 2.44.0`; the `git message` cases check that the wrapper fails a call carrying the token at exit 128 and echoes the listed path, so a pass cannot come from a wrapper that never echoed it
- **Committed in:** ff3a0321, d0b1fcfc

---

**Total deviations:** 2 auto-fixed (both coverage). **Impact:** neither changes scope.

## Issues Encountered

- The RED-evidence classifier rejected Vitest's TAP output as malformed, as in 44-09 to 44-11. It was recorded, not worked around.
- No full-suite run was made here; the phase gate compares it by test name against the baseline.

## Requirement status

UP-02 and UP-05 are in `requirements-completed` only because this plan's frontmatter names them. As the plan says, UP-05 is **not** marked Complete in REQUIREMENTS.md: the live red-team round is still owed (44-VERIFICATION.md `behavior_unverified_items`), and only a human records it in /gsd-verify-work.

## Verification run

- `npx vitest run scripts/runnable-ref/upstream.test.ts scripts/runnable-ref/runnable-exit-contract.test.ts`: 2 files, 128 passed
- `-t "partial clone guard"` 3 passed; `-t "adversarial git"` 5 passed; `-t "git message"` 3 passed; `-t "source stat"` 1 passed
- Order gate (`awk '/^function gitAnswers/,/^}/' … | grep -n -e '"--get-regexp"' -e '\^{commit}' | head -1 | grep -q get-regexp`): passes
- `npm run freshness` (95 committed `.js` fresh), `npm run freshness:runnable-embeds` (7 targets fresh), `npm run typecheck`: all exit 0
- `node scripts/check-foundation-guards.js`: ALL CHECKS PASSED
- `npx vitest run scripts/check-foundation-guards.test.ts scripts/generate-runnable-embeds.test.ts scripts/context-io.test.ts scripts/flow-guidance-text.test.ts scripts/runnable-ref/state-check.test.ts`: 1511 passed, 1 skipped
- `npx vitest run install/install.test.ts scripts/upstream-model.test.ts -t upstream`: 87 passed
- Acceptance greps: `versionedGitDir` 2 and `failingGitDir` 2 in the fixture; `partial clone guard` 3 and `git message` 5 in the test; `partialclone` 4, `cannot be inspected` 1 in gitAnswers; `<listed path>` 1 in gitComplaint

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Ready for 44-13. upstream.ts and upstream.js are fresh at `09dadca3`; the generated region and every stamp are unchanged.
- Plan 44-14 should state in `agent-factory/contracts/upstream.md` that a partial clone on git older than 2.45 is refused before any object read, on either key, and that a quoted git message names `<listed path>`; and record T-44-38, T-44-40 and T-44-42 as mitigated in 44-SECURITY.md.
- Open for a human: flagged assumption A1 (a live run on a real git older than 2.45) and the UP-05 live red-team round.

---
*Phase: 44-upstream-source-declaration-and-pin-check*
*Completed: 2026-11-25*

## Self-Check: PASSED

- FOUND: scripts/runnable-ref/upstream.ts, upstream.js, upstream.test.ts, upstream-fixture.test-support.ts
- FOUND: commits ff3a0321, e3a3eb3f, 5856f551, 30de3775, d0b1fcfc, 09dadca3 (ancestors of HEAD)
