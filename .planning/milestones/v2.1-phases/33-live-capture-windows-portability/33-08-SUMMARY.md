---
phase: 33-live-capture-windows-portability
plan: 08
subsystem: testing
tags: [uat-live, thin-wrapper, capture-live, loud-skip, d-08, d-12, d-04, prod-deploy-deny, vitest, tsc]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: 33-01's runner (scripts/capture-live.ts) — its --out / --verify-artifacts surface, the exported CALL_BOUND_MS, the artifact names, the frozen outcome-line grammar and the summary's table/bullet grammar the wrapper keys on
  - phase: 32.1-board-dashboard-deferred-residuals
    provides: WINDOWS.md row 214 (the stale docblock claim) and 32.1-10's rule that no later plan may cite an earlier run as permission
  - phase: 26-decentralized-factory
    provides: prod-deploy-deny-match.ts, whose header this plan amends without touching the function
provides:
  - "scripts/e2e/uat-live.test.ts in thin-wrapper form: one runner invocation (arg array, env passed through, approval key asserted absent on the env object at run time), assertions over the summary ARTIFACT only — outcome line grammar and count, D-02 verdict in both runs, D-04 deny observation, D-05 plugin load report, D-07 equivalence diff list, recorded bound = derived bound, --verify-artifacts exit 0"
  - "the loud-skip keystone (marker + probe + emitter), its test-of-the-test pair and the cleanup block kept byte-identical, proven by sha256 before and after"
  - "one per-call bound with two consumers (D-12): the wrapper imports CALL_BOUND_MS and asserts the summary's recorded bound equals the number it derived its per-test timeout from"
  - "the lane docblock states the measured behaviour of the default test script (WINDOWS.md row 214's subject) and names the excluding command"
  - "prod-deploy-deny-match.ts header: a third input class — the decoded stdout field of a CLI-emitted hook_response frame — with its soundness argument, its decode condition, and the permission_denied exclusion; function unchanged"
affects: [33-10 live capture go (runs the lane or the runner directly), 33-11 GAP-D1 flip (row 214 flips through the tool), 33-09 pushed CI run]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 13697
  tasks: 3
  commits: 3
plan_head_before: a33a0b976b6da1dbc8863b5d3353ac197ebb22e3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A test lane over an expensive external run is a WRAPPER: it invokes the one runner as a child and asserts over the artifact the runner commits, never over the child's stdout"
    - "Two consumers of one bound are checked against each other on the artifact: the runner records the bound it ran under, the wrapper asserts that number equals the one it derived — drift is a named red, not a silent desync"
    - "A safety rule is asserted at run time on the OBJECT that crosses the boundary (the env handed to the child), not by the absence of a line in the file"
    - "Summary cells are read by table-row label and exact bullet text; no markdown heading is read (LANG-07: one section-extent owner)"
    - "A safety module's header enumerates every input class a caller feeds it, with the condition that keeps each class sound"

key-files:
  created: []
  modified:
    - scripts/e2e/uat-live.test.ts
    - scripts/prod-deploy-deny-match.ts
    - scripts/prod-deploy-deny-match.js

key-decisions:
  - "A3-live-N (DOGF-02) is retired from the lane: the runner makes no N-agent dispatch, D-08 makes the file an invocation of the runner plus summary assertions, and the deterministic gating twin scripts/worktree-dogfood.test.ts is unchanged; the historical case names A1 / A2-live / A3-live are kept as the names of the summary assertions so ledger rows 211-214 still resolve"
  - "The lane makes ONE platform invocation per run of the file (the runner case); every other case asserts over the summary that case left behind, so the lane cannot spend more than one live run (D-09)"
  - "The wrapper refuses a non-pass outcome: the outcome line must match the frozen grammar exactly once AND read pass; fail / hang / no-go red the lane with the summary's recorded outcome reason in the message (D-11)"
  - "UAT_E2E_ARTIFACT_DIR, when set, names an artifact destination the verbatim cleanup block does not remove, so a red live run leaves its artifacts on disk for a zero-token diagnosis (D-11) instead of vanishing with the scratch directory; unset, the scratch mkdtemp is the destination and is removed in afterAll as before"
  - "The UAT_E2E_CALL_TIMEOUT_MS override stays in front of the imported bound as the plan asks, and the recorded-bound assertion makes it loud rather than useful: the override does not reach the runner, so any value other than the runner's own is refused by name"
  - "The approval variable's name is imported from the deny matcher (PROD_DEPLOY_REASON_SIGNATURE); the wrapper spells it nowhere and assigns it nowhere, matching the runner's rule 4; the old quiet A2 skip-on-set (a return that read as a pass) is replaced by a red"
  - "The matcher header's confirmation-only conclusion is re-scoped to the agent-authored class it was drawn from; the decoded hook_response.stdout class is recorded as sound at the point of effect, conditioned on the decode"

patterns-established:
  - "Before rewriting a file with kept regions, snapshot each region to a scratch file and sha256 it; after the rewrite, re-extract by anchor and cmp — the byte-identity claim is then a measurement, not a reading"
  - "Exercise a wrapper's artifact-reading logic offline against the runner's zero-token dry-run report: every label resolves, and the fixture-derived report reds the wrapper in the places it should (no-go outcome, side (b) unmet)"

requirements-completed: [CAP-01, CAP-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The loud-skip keystone (marker, probe, emitter), its test-of-the-test pair and the cleanup block survive the rewrite byte-for-byte, and both directions of the test-of-the-test pass"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "npx vitest run scripts/e2e/uat-live.test.ts -t \"loud-skip\" (2 passed, 5 skipped by name filter)"
        status: pass
      - kind: other
        ref: "sha256 of the three regions before and after: a9a72432… / 09d2744c… / 761b2fba… (cmp exit 0 on each)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every live case body invokes the runner with an arg array and asserts over the summary file; the approval key's absence is asserted at run time on the env object handed to the child"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "grep -c 'spawnSync(\"claude\"' scripts/e2e/uat-live.test.ts = 4 (two probe calls in the kept region A, two cleanup calls in the kept region C; no live case spawns the platform); runRunner() is the only child spawn in the live cases and reads expect(hasOwnProperty(env, PROD_DEPLOY_REASON_SIGNATURE)).toBe(false) before spawnSync"
        status: pass
      - kind: integration
        ref: "node scripts/capture-live.js --dry-run --out <scratch> then the wrapper's tableRow/bullet logic replayed over the report: every label the wrapper keys on resolves; the fixture-derived report would red the wrapper at outcome (no-go) and at the D-02 count (0 of 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One bound, two consumers: the wrapper imports CALL_BOUND_MS, declares no second per-call bound, and asserts the summary's recorded bound equals the number it derived"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "grep -n 'CALL_BOUND_MS\\|CALL_TIMEOUT_MS' scripts/e2e/uat-live.test.ts — one import, one derived const behind the env override, one .toBe(CALL_TIMEOUT_MS) on the `per-call bound (ms)` row"
        status: pass
      - kind: unit
        ref: "npm run typecheck (exit 0 across the shipped, tests and fixtures targets)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The docblock states the measured behaviour of the default test script and names the excluding command; WINDOWS.md is untouched"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "package.json scripts.test = \"vitest run\" (line 12); vitest.config.ts exclude = [...configDefaults.exclude, \"**/scripts/runnable-ref/fixtures/**\", \"**/.temp/**\"] (lines 26-29); .github/workflows/ci.yml:181 runs the excluding command; git diff --exit-code -- .planning/WINDOWS.md exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The deny matcher's header enumerates a third input class (the decoded hook_response.stdout field) with its soundness argument, decode condition and the permission_denied exclusion; the function is unchanged and its suite passes"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/prod-deploy-deny-match.test.ts (10 passed)"
        status: pass
      - kind: other
        ref: "git diff -U0 a33a0b97..0b7acb38 -- scripts/prod-deploy-deny-match.ts: 35 changed lines, 0 non-comment lines; hunk @@ -15,6 +15,29 @@ inside the header; npm run check:build-parity ALL CHECKS PASSED after the commit"
        status: pass
    human_judgment: false
  - id: D6
    description: "The live cases behave as written against the real platform (the runner completes, the summary reads pass, --verify-artifacts accepts it)"
    requirement: CAP-03
    verification: []
    human_judgment: true
    rationale: "A model call cannot be a CI gate (D-09); the live cases are exercised only behind plan 33-10's blocking human go. Their offline half — the keystone, the row-reading logic against the dry-run report, the env assertion — is covered above; their process behaviour against the platform is not."

# Metrics
duration: 20min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 08: Live Lane Thin Wrapper Summary

**`scripts/e2e/uat-live.test.ts` drives nothing any more: it invokes `scripts/capture-live.js` once as a child and asserts over the summary the runner wrote — outcome line, D-02 verdict, D-04 deny, D-05 plugin load, D-07 equivalence, recorded bound, `--verify-artifacts` — with its loud-skip keystone, test-of-the-test and cleanup block kept byte-identical, one imported per-call bound checked against the summary's recorded one, a docblock that states what `npm test` actually does, and a deny-matcher header that now records the decoded hook-response field as its third, sound input class.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-20T00:00:57Z
- **Completed:** 2026-09-20T00:20:37Z
- **Tasks:** 3
- **Files modified:** 3 (0 created, 3 modified)

## Accomplishments

- The lane is a wrapper. One `it()` runs `node scripts/capture-live.js --out <dir>` with an arg array, `cwd` = repo root, stdin closed, the environment passed through unchanged and asserted at run time not to define the approval variable (on the object handed to the child, before the spawn). Four further cases read the summary that run left behind and assert: exactly one outcome line matching the frozen grammar, reading `pass`; the recorded `per-call bound (ms)` equals the bound the wrapper derived its timeout from; the `approval key in child env` row reads `absent…`; the `D-04 prod-deploy deny observed in a hook_response.stdout` row reads `yes` in at least one run; the `D-05 plugins loaded per system/init` row is not `none listed` and `D-05 plugin_errors` is `none`; the CAP-03 bullet `- both sides hold: no named reason remains` occurs once per run label; the D-07 bullet `- assertEquivalent … returned no diff` is present; and `--verify-artifacts --out <dir>` exits 0. Nothing asserts on the child's stdout — its tail rides in failure messages only.
- The keystone is provably intact: the three kept regions were snapshotted and hashed before the rewrite and re-extracted by anchor after it; `cmp` exit 0 on each (see the table below). Both directions of the test-of-the-test pass under the name filter (2 passed, 5 live cases skipped by the filter). The marker text is present once.
- 582 lines before, 439 after. The per-case driving logic (scaffold, marketplace add, plugin install, four `claude -p` invocations, the A3-N runner script) is gone from the file; the runner owns it.
- One bound, two consumers: `CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) || CALL_BOUND_MS`, the latter imported from the runner; no second per-call bound is declared; the runner case asserts the summary's recorded bound equals `CALL_TIMEOUT_MS` by name.
- The docblock's stale `npm test` claim (WINDOWS.md row 214) is replaced by the two measurements and their consequence; the ledger file is untouched (`git diff --exit-code` 0).
- `scripts/prod-deploy-deny-match.ts`: a new header paragraph records the third input class, why it is sound (the platform emits the frame; the model never writes it), the decode condition (citing the file's own fails-closed paragraph, which is verbatim), the one caller (`denyObservedInStream`), and the fact that `permission_denied` excludes PreToolUse hook denies. 35 changed lines, all comment lines; the twin rebuilt in the same commit; the matcher's 10 cases pass unchanged; build parity green after the commit.

## Task Commits

Each task was committed atomically:

1. **Task 1: The lane becomes a wrapper; the keystone survives byte-for-byte** - `0e05ca88` (feat)
2. **Task 2: One bound, two consumers — and the docblock says what the script does** - `e7cb3f79` (fix)
3. **Task 3: The matcher's header records its third input class — the function untouched** - `0b7acb38` (docs)

**Plan metadata:** see the docs commit that carries this SUMMARY.

## Files Created/Modified

- `scripts/e2e/uat-live.test.ts` - the thin wrapper (kept regions byte-identical; runner invocation; summary assertions; corrected docblock; imported bound)
- `scripts/prod-deploy-deny-match.ts` - header amendment only (third input class)
- `scripts/prod-deploy-deny-match.js` - the rebuilt committed twin

## The three kept regions — before and after

Extracted by line range before the rewrite and by anchor after it, then compared with `cmp`.

| Region | Before (lines) | After (lines) | sha256 (identical before and after) | cmp |
|---|---|---|---|---|
| A — the section header, `LOUD_SKIP_MARKER`, `claudePresentAndAuthed`, `emitLoudSkipIfUnavailable` | 72-116 (45) | 97-141 (45) | `a9a7243238bfb7335ccdae5098f01aa82a72a88b061a2be9e84e079062b9078e` | identical |
| B — the `-t "loud-skip"` test-of-the-test pair (both cases) | 118-159 (42) | 143-184 (42) | `09d2744cc9c6853a5b03447ba12466a97e7091256a1f6bc6b74a00c201098e2b` | identical |
| C — the `afterAll` cleanup block (uninstall, marketplace remove, `rmSync`, each best-effort) | 221-248 (28) | 291-318 (28) | `761b2fba7c6f165328ae783d80d1c2a170599314609b092a5122c2674a9f305a` | identical |

The regions were re-checked after the Task 2 edits as well; all three still `cmp` identical at the Task 2 commit.

## The two measurements the corrected docblock rests on

Quoted from the tree at `a33a0b97` (unchanged by this plan):

- `package.json` line 12: `"test": "vitest run",` — the bare runner invocation, no exclusion. Line 13: `"test:e2e": "vitest run scripts/e2e",`.
- `vitest.config.ts` lines 26-29: `exclude: [ ...configDefaults.exclude, "**/scripts/runnable-ref/fixtures/**", "**/.temp/**", ]` — the parse corpus and the scratch root; nothing under `scripts/e2e`.
- Corroboration for the CI sentence: `.github/workflows/ci.yml` line 180-181, step `Vitest (e2e lane excluded)` runs `npx vitest run --exclude '**/scripts/e2e/**'`.

Consequence, as now written in the docblock: the default script DOES collect the lane; the regression lane is the excluding command; `npm test` must not be run bare on an authenticated machine; `test:e2e` is how the lane is run on purpose under the go protocol.

## The matcher header — changed line set

`git diff -U0 a33a0b97..0b7acb38 -- scripts/prod-deploy-deny-match.ts`: one hunk, `@@ -15,6 +15,29 @@`. Removed lines 15-20 (the agent-authored-class paragraph's last six lines) and inserted lines 15-43 (that paragraph re-flowed with its example put in the past tense and its conclusion scoped to the agent-authored class, followed by the new `THE THIRD INPUT CLASS (Phase 33, D-04)` paragraph). 35 changed lines; `grep -vcE '^[+-]//'` over them = 0, so every changed line is a comment line. The first code line (`export const PROD_DEPLOY_DENY_KEY`) moved from line 42 to line 65 by insertion only. The `STRUCTURAL DESIGN` paragraph including the fails-closed sentence is untouched. `PROD_DEPLOY_DENY_KEY`, `PROD_DEPLOY_DENY_VALUE`, `PROD_DEPLOY_REASON_SIGNATURE`, `extractJsonObjects`, `isProdDeployDenyEnvelope`, `prodDeployDenyFired` are byte-unchanged.

## Decisions Made

- **A3-live-N is retired from the lane.** The runner makes two runs of one request; it makes no N-agent dispatch. D-08 makes this file an invocation of the runner plus assertions over its summary, and the deterministic gating proof of the N-agent property (`scripts/worktree-dogfood.test.ts`) is unchanged. The historical case names A1, A2-live and A3-live are kept as the names of the corresponding summary assertions so the ledger rows that cite them (211-214) still resolve to a case.
- **One platform invocation per run of the file.** The runner case is the only spawn of the runner in capture mode; the assertion cases share its summary through a module-level variable that a `requireSummary()` guard refuses when null. A loud skip therefore invokes no runner, writes no artifact directory and accepts no summary (T-33-43).
- **A non-pass outcome reds the lane.** Asserting only grammar and count would let a recorded `fail` read as green. The word must be `pass`; the failure message carries the summary's `Outcome reason:` line so the D-11 diagnosis starts from the artifact.
- **`UAT_E2E_ARTIFACT_DIR`.** The verbatim cleanup block removes `tmpRepo` unconditionally, which would delete a red run's artifacts before anyone could file them (D-11 requires a red run to be recorded). When the variable names a directory, the runner writes there and the cleanup does not touch it; unset, the scratch directory is the destination as before. The value reaches the runner as one arg-array element, never through a shell.
- **The env override stays, loud.** The plan keeps `UAT_E2E_CALL_TIMEOUT_MS` in front of the imported bound. It does not reach the runner, so the recorded-bound assertion refuses any value other than the runner's own; the comment says so. Removing it would have been cleaner but is not what the plan asked.
- **The matcher header's example and conclusion are re-scoped, not only appended to.** Leaving "e.g. `claude -p` stdout in scripts/e2e/uat-live.test.ts" as the live example of the unsound class, when that file no longer hands the matcher any stdout, would have replaced one stale safety sentence with another. The example is put in the past tense and the confirmation-only conclusion is stated of "a live lane that hands this matcher agent-authored bytes", which is the class it was drawn from.

## Deviations from Plan

None - plan executed exactly as written. Two items worth recording that are not deviations:

- The Task 1 commit carries the old `|| 300_000` bound line and the old docblock sentence, because Task 2 owns both; between `0e05ca88` and `e7cb3f79` the wrapper's derived timeout would have been 600 s against a 1200 s runner bound. No live run occurred in that interval and the state is gone at HEAD.
- The plan's Task 3 verification pipeline `npm run build && npm run check:build-parity` reports `prod-deploy-deny-match.js moved when the build ran` BEFORE the commit, by construction (the gate compares against the committed twin). It is green immediately after the commit that carries source and twin together, which is the order the plan prescribes.

## Verification (plan level)

| Check | Result |
|---|---|
| `npx vitest run scripts/e2e/uat-live.test.ts -t "loud-skip"` | 1 file passed; 2 passed, 5 skipped (by the name filter); exit 0. The `SKIPPED: …` line in the output is the forced-false case's own `process.stderr.write`, not the module gate — the probe returns `loggedIn: true` on this host, which is why the name filter is the only thing that keeps the live cases from running here |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full lane, final tree) | 78 files passed; 5326 passed, 2 skipped; exit 0 (the four `FAIL` lines in the log are `check-banned-claims.test.ts`'s planted-case stdout, present on every green run per 33-03) |
| `npm run typecheck` | exit 0 (shipped, tests, fixtures) |
| `npm run build && npm run check:build-parity` | ALL CHECKS PASSED (69/69 tracked outputs) after `0b7acb38` |
| `npm run freshness` | 69 committed `.js` fresh, 0 orphaned |
| `npm run check:banned-claims` | ALL CHECKS PASSED (`scripts/` is outside the scan set by the gate's own declaration; the amended header is not a finding) |
| `npm run check:nul-bytes` | ALL CHECKS PASSED; `tr`-based recount over the three changed files = 0 control bytes |
| `git diff --exit-code -- .planning/WINDOWS.md` | exit 0 |
| `grep -ac 'SKIPPED: claude CLI absent or unauthed' scripts/e2e/uat-live.test.ts` | 1 |
| `node scripts/capture-live.js --dry-run --out <scratch>` (zero tokens) | exit 0; every label the wrapper keys on resolves in the report (`per-call bound (ms)` = 1200000; `approval key in child env` starts `absent`; `D-05 plugins loaded` lists the fixture plugin; `D-05 plugin_errors` = `none`; `D-04` rows 2, one reads `yes`; equivalence bullet present); the fixture-derived report reds the wrapper where it should (outcome `no-go`, `both sides hold` 0 of 2) |
| `npm test` | never run (prohibition honoured) |
| the live lane against the real CLI | never run (belongs to plan 33-10 behind a human checkpoint) |

## Issues Encountered

- One `TS2532` on the first typecheck (`outcomeLines[0]` possibly undefined after a `toHaveLength(1)` the compiler cannot see); fixed with an explicit `?? ""` before the Task 1 commit.

## Known Stubs

None. The live cases are production test code whose process behaviour is unexercised until plan 33-10's go; that is coverage D6 (human judgment), not a stub.

## Threat Flags

None. The wrapper introduces no new network endpoint, auth path or schema; its one new env-derived value (`UAT_E2E_ARTIFACT_DIR`) is an operator-controlled directory path passed as an arg-array element to the runner, which already accepts `--out`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-10 can run either `npx vitest run scripts/e2e` (the lane, one runner invocation, artifacts under `UAT_E2E_ARTIFACT_DIR` if set) or `node scripts/capture-live.js --out <phase dir>` directly; both go through the one runner. The lane's per-test bound is `2 × CALL_BOUND_MS + 20 min`.
- WINDOWS.md row 214's subject is corrected in the file; the row itself flips in plan 33-11 through the tool, as one commit over the manifest's declared set.
- The `.planning/milestone.lock` and `.planning/phases/34-*` untracked entries present at dispatch were not touched by this plan.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 3 modified files present on disk; 3 task commits present in history (0e05ca88, e7cb3f79, 0b7acb38); commits measured from the plan ledger = 3; no control byte in this file.
