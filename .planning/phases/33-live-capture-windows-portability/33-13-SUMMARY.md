---
phase: 33-live-capture-windows-portability
plan: 13
subsystem: testing
tags: [capture-live, cr-04, cr-05, in-08, keep-target, transcript-scratch, plugin-install, tdd, gap-closure, d-09, d-11, d-12]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: "33-12's `runTarget` / `LiveOps` / `LIVE_OPS` seam and `TargetBuild.transcriptDir` (the runner-owned transcript scratch); 33-01's runner and offline suite; 33-REVIEW CR-04, CR-05, IN-08"
provides:
  - "A plugin install that does not complete stops the run before any platform child is spawned: `installOutcome` (pure decision), `pluginInstall` throwing through `fail`, `runTarget` calling the install first — proven through the seam with the recorder's call count as witness (CR-05)"
  - "Two scratch classes with two contracts: `ScratchRegistry.targets` (targets, kit homes) and `.transcripts` (runner-owned transcript directories); `cleanupPlan(code, keepTarget)` truth table; `cleanupScratch(plan, registry)` returning the surviving transcript paths; `runAll` printing `transcript scratch preserved (exit <code>): <path>` per survivor (CR-04)"
  - "`--out` refuses a value beginning with `--` in either spelling, naming `--out` and the value (IN-08)"
affects: [33-20, 33-21, 33-22, 33-23, uat-live, flip-manifest]

# Actuals (#2632) — chars/4 over the realized diff (three files, ledger 168ca917..HEAD), never a harness token count.
actuals:
  tokens: 8037
  tasks: 2
  commits: 4
plan_head_before: 168ca917dc355a5f2d3905cb2315ded87ee5be7a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A precondition's failure is a THROW at the point of effect, never a returned string the caller can append and walk past"
    - "Cleanup is a pure truth table over (exit code, flag) applied to named classes; the paid artifact's class is preserved by the code, not by the operator remembering a flag"
    - "Registry-parameterised scratch helpers (`registry = SCRATCH`) so the suite drives an explicit registry instead of reaching into module state"

key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts

key-decisions:
  - "Test Q is exercised through an explicit `ScratchRegistry` argument defaulting to the module's (`makeScratch`, `makeScratchTranscript`, `cleanupScratch` all take it) rather than a `scratchRegistryForTests()` export — the smaller surface, and the test never mutates module state"
  - "`cleanupScratch` returns the surviving transcript paths, so the `finally` prints one line per survivor from the same call that decided survival — no second list to drift"
  - "The transcript-preserved line prints on every preserved transcript (a non-zero exit, or `--keep-target` at any exit), labelled with the exit code, so the flag path and the failure path use one wording"
  - "Test N's recorder decides its install through the shipped `installOutcome` over a canned spawn result, so the ordering proof is bound to the shipped decision and reds when the decision is absent"

patterns-established:
  - "RED evidence for vitest: `--reporter=tap-flat`, append `# tests/pass/fail` counted from the same output's non-SKIP lines, full `file > describe > title` targetTest (33-17's method, reused)"

requirements-completed: [CAP-03, CAP-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "A failed plugin install stops the run before the paid spawn: installOutcome is pure and exported, pluginInstall throws through fail, runTarget's install-first order is proven through the seam with zero platform launches after the throw and one on the converse"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test M: installOutcome is the pure install decision — a non-zero exit names the exit and the platform's stderr, a spawn error names the error, exit 0 is ok with the platform's line; and the source no longer returns an UNKNOWN - verify install string"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test N: through the seam, an install that does not complete rejects runTarget naming `plugin install`, and the platform recorder was called exactly 0 times"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test O: converse — an install that completes is followed by exactly 1 platform launch and the report is returned with the install line"
        status: pass
      - kind: other
        ref: "grep -a -c 'UNKNOWN - verify — `plugin install' scripts/capture-live.ts → 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The paid transcript survives every non-zero exit and every --keep-target run; targets and kit homes follow the flag; the surviving paths are printed; a clean exit without the flag removes both classes"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P: cleanupPlan's truth table — the flag decides targets; the flag OR a non-zero exit preserves transcripts"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test Q: the two scratch classes are separate — removing targets leaves the transcript directory on disk, and the reverse plan does the reverse; a preserved transcript path is returned for printing"
        status: pass
      - kind: integration
        ref: "scripts/capture-live.test.ts#exits 0, prints GO-READINESS and the completion wording, writes exactly one outcome line reading no-go, and its artifacts re-check (Test S — the unchanged 'no scratch directory survives a default run' assertion)"
        status: pass
      - kind: other
        ref: "offline self-repro: node scripts/capture-live.js --dry-run --out /dev/null/nope → exit 1, 'transcript scratch preserved (exit 1): …transcript-A-…' and '…transcript-B-…' printed, no target-/home- scratch left on disk"
        status: pass
    human_judgment: false
  - id: D3
    description: "--out refuses a flag-shaped value in both spellings, naming --out and the value; a real path followed by --dry-run parses both (IN-08)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test R: --out refuses a value beginning with `--` in either spelling, naming --out and the value; a real path followed by --dry-run parses both"
        status: pass
      - kind: other
        ref: "node scripts/capture-live.js --out --dry-run → exit 1, 'CAPTURE NOT DERIVED: --out was given `--dry-run`, which is a flag, not a directory path'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The dry run still exits 0 with one OUTCOME: no-go line; the committed .js is rebuilt and parity-checked; the full offline suite is green"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "node scripts/capture-live.js --dry-run --out $(mktemp -d) → exit 0, one 'OUTCOME: no-go', last line DRY RUN COMPLETE; npm run build && npm run check:build-parity → ALL CHECKS PASSED; npx tsc --noEmit → clean; npm run check:nul-bytes → ALL CHECKS PASSED; npx vitest run --exclude '**/scripts/e2e/**' → 78 files, 5372 passed, 2 skipped"
        status: pass
    human_judgment: false

# Metrics
duration: 13 min
completed: 2026-09-20
status: complete
---

# Phase 33 Plan 13: CR-05 install-failure refusal and CR-04 transcript survival (IN-08 folded) Summary

**A target with no plugin never gets a model call (the install decision is pure, the real install throws, the seam proves zero launches after the throw), and a red run leaves its paid transcripts on disk with their paths printed — the flag decides targets, the flag OR a non-zero exit preserves transcripts, and `--out --dry-run` can no longer start a live capture into a directory named `--dry-run`.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-20T22:53:31Z
- **Completed:** 2026-09-20T23:07:00Z
- **Tasks:** 2 (each RED → GREEN, 4 commits)
- **Files modified:** 3 (`scripts/capture-live.ts`, its committed `.js`, `scripts/capture-live.test.ts`)

## Accomplishments

- **CR-05 (Task 1):** `installOutcome(r)` is the exported pure decision over a spawn result — `{ ok: false, reason }` naming the exit code, the spawn error and the platform's own output, or `{ ok: true, line }`. `pluginInstall` calls it and on `ok: false` throws through `fail(\`plugin install ${pluginName}@${marketplaceName} did not complete (${o.reason})\`)`; the `UNKNOWN - verify — \`plugin install` returned-string shape is gone (`grep -a -c` → 0). `runTarget`'s docblock states the install is the first platform-touching step and its failure propagates so `ops.runPlatform` is unreachable after it; the header's D-05 paragraph names the install as a phase-2 precondition that stops the run before any model call. Test N proves the order through 33-12's seam: with an install decided `ok: false`, `runTarget` rejects naming `plugin install grugops@grugops did not complete` and the platform recorder's call count is exactly 0; Test O proves the converse count is exactly 1 and the report carries the install line.
- **CR-04 (Task 2):** the scratch registry is two classes — `ScratchRegistry.targets` (targets and kit homes, via `makeScratch`) and `.transcripts` (the runner-owned transcript directories, via the new `makeScratchTranscript(label)`, which `buildTarget` now uses for `transcriptDir`). `cleanupPlan(code, keepTarget)` is the pure truth table Test P pins: `(0,false) → {true,true}`, `(0,true) → {false,false}`, `(1,false) → {true,false}`, `(1,true) → {false,false}`. `cleanupScratch(plan, registry)` applies it and returns the surviving transcript paths; `runAll()`'s `finally` reads `for (const p of cleanupScratch(cleanupPlan(code, keepTarget))) console.log(\`transcript scratch preserved (exit ${code}): ${p}\`)`. The `cleanupScratch(code === 0 && keepTarget)` shape is gone (`grep -a -c` → 0). Hard rule 3 is rewritten around the two classes and the two contracts; `runTarget`'s docblock states that no copy step is needed before derivation because the transcript is streamed into a directory that survives every non-zero exit.
- **IN-08 (folded into Task 2):** `outValue()` in `parseArgs` refuses an `--out` value beginning with `--` in both spellings: `--out was given \`--dry-run\`, which is a flag, not a directory path — write --out <dir> or --out=<dir>`. `node scripts/capture-live.js --out --dry-run` now exits 1 with `CAPTURE NOT DERIVED:` and that reason.
- **Offline self-repro of CR-04 on the real runner (zero tokens):** `node scripts/capture-live.js --dry-run --out /dev/null/nope` dies at the artifact write (`ENOTDIR`), exits 1, prints `transcript scratch preserved (exit 1): …/grugops-capture-live-transcript-A-…` and the `-B-` twin, and leaves no `target-`/`home-` scratch on disk — the target class followed the flag (absent → removed), the transcript class followed the exit code (non-zero → preserved).
- The dry run exits 0 with one `OUTCOME: no-go`; `npm run build && npm run check:build-parity` → `ALL CHECKS PASSED`; `npx tsc --noEmit` clean; `npm run check:nul-bytes` → `ALL CHECKS PASSED`; the full excluded suite is green (78 files, 5372 passed, 2 pre-existing skips).

## Task Commits

Each task was RED-committed before its GREEN:

1. **Task 1: a failed plugin install stops the run before the paid spawn (CR-05)** — RED `3ec41ada` (test) → GREEN `c18886d3` (feat)
2. **Task 2: the transcript survives every failure; `--keep-target` and `--out` keep their contracts (CR-04; IN-08)** — RED `a153a12e` (test) → GREEN `0a545e11` (feat)

**Plan metadata:** see the final `docs(33-13)` commit.

TDD gate compliance: `test(33-13)` precedes `feat(33-13)` for both tasks; both RED records returned `RED_EVIDENCE_OK` / `target_test_failed` from `gsd-tools check tdd-red-evidence`. No REFACTOR commit — no cleanup was needed after either GREEN.

### RED evidence (quoted from the red runs, `--reporter=tap-flat`)

Task 1 RED at `3ec41ada` (exit 1, 43 tests, 40 pass, 3 fail; target Test M):
- `Test M: installOutcome is the pure install decision — a non-zero exit names the exit and the platform's stderr, a spawn error names the error, exit 0 is ok with the platform's line; and the source no longer returns an UNKNOWN - verify install string` — `TypeError: installOutcome is not a function`
- `Test N: through the seam, an install that does not complete rejects runTarget naming \`plugin install\`, and the platform recorder was called exactly 0 times` — `expected [Function] to throw error matching /plugin install grugops@grugops did no…/ but got '(0 , __vite_ssr_import_8__.installOut…'` (the recorder's install is decided by the shipped `installOutcome`, absent at RED)
- `Test O: converse — an install that completes is followed by exactly 1 platform launch and the report is returned with the install line` — the same absent-function rejection

Task 2 RED at `a153a12e` (exit 1, 46 tests, 43 pass, 3 fail; target Test P):
- `Test P: cleanupPlan's truth table — the flag decides targets; the flag OR a non-zero exit preserves transcripts` — `TypeError: cleanupPlan is not a function`
- `Test Q: the two scratch classes are separate — removing targets leaves the transcript directory on disk, and the reverse plan does the reverse; a preserved transcript path is returned for printing` — `TypeError: makeScratch is not a function`
- `Test R: --out refuses a value beginning with \`--\` in either spelling, naming --out and the value; a real path followed by --dry-run parses both` — `AssertionError: expected [Function] to throw an error` (the round-1 `parseArgs` accepted `--dry-run` as the `--out` value — IN-08 reproduced by the assertion, not by an absent symbol)

Test S is the existing `--dry-run` integration case (`exits 0, prints GO-READINESS and the completion wording, writes exactly one outcome line reading no-go, and its artifacts re-check`); its `no scratch directory survives a default run` assertion is byte-unchanged (the test-file diff has zero deleted lines) and passes at GREEN.

## Files Created/Modified

- `scripts/capture-live.ts` — new exports `InstallOutcome`, `installOutcome`, `ScratchRegistry`, `makeScratch`, `makeScratchTranscript`, `CleanupPlan`, `cleanupPlan`, `cleanupScratch`; `pluginInstall` throws via `fail`; `outValue` guard in `parseArgs`; `buildTarget` registers `transcriptDir` in the transcript class; `runAll`'s `finally` prints preserved transcript paths; header hard rule 3 and the D-05 paragraph rewritten; `runTarget` docblock gains the install-first and no-copy-step sentences
- `scripts/capture-live.js` — rebuilt in each GREEN commit; `check:build-parity` green
- `scripts/capture-live.test.ts` — helper `installDecidingOps`; Tests M, N, O (`describe("CR-05: …")`) and P, Q, R (`describe("CR-04 / IN-08: …")`); imports extended; 46 cases in the file, up from 40

## Decisions Made

- **Explicit registry argument over a `scratchRegistryForTests()` export.** `makeScratch`, `makeScratchTranscript` and `cleanupScratch` take `registry: ScratchRegistry = SCRATCH`. Test Q drives its own registry and never touches the module's, and the runner's call sites are unchanged apart from the plan argument. This is the smaller surface the plan asked the executor to choose and name.
- **`cleanupScratch` returns the survivors.** The `finally` prints from the same call that decided survival; there is no second list of "what was kept" to drift from the registry.
- **The preserved-transcript line prints whenever a transcript is preserved**, labelled with the exit code (`exit 0` under `--keep-target`, `exit 1` on a failure) — one wording for both contracts, and the operator always has the path.
- **Test N is bound to the shipped decision.** The recorder's `pluginInstall` runs `installOutcome` over a canned failed spawn result and throws with the real message shape, so the ordering proof reds when the decision is absent and cannot pass over a recorder that merely throws on its own.

## Deviations from Plan

None — plan executed as written. One clarification, recorded rather than a deviation: Tests N and O would have been green against 33-12's `runTarget` had their recorder thrown on its own (33-12 already ordered the install first; what CR-05 lacked was the THROW in the real `pluginInstall`), so the recorder decides through `installOutcome` — see Decisions. The RED gate's target was Test M in Task 1 and Test P in Task 2; Test R additionally failed on the IN-08 assertion itself.

## Issues Encountered

- `check tdd-red-evidence` expects node-runner `# tests/pass/fail` lines; vitest's `tap-flat` emits none. The three lines were appended counted from the same tap-flat output (labelled as such inside the record), with the full `file > describe > title` chain as `targetTest` — 33-17's method. Both records classified `RED_EVIDENCE_OK`.
- `npm run check:build-parity` reads "moved" while the rebuilt `.js` is uncommitted — expected; it passed once each GREEN commit landed the `.ts`/`.js` pair together.

## Ledger state (for plan 33-23)

CR-04 and CR-05 are closed by mechanism and proven offline; IN-08 is folded and closed here (named in this summary so the closing ledger does not carry it as accepted-open). No stub, skipped test or unrun `<verify>` was left behind, so no WINDOWS.md entry was appended. CAP-01 / CAP-03 remain edge rows: this plan protects what a capture produces and what it refuses to spend on; whether the round-2 capture reaches parity is plan 33-21's observation, and CAP-02 is untouched here.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema. T-33-71 (spend with no plugin) mitigated by `installOutcome` + the throwing `pluginInstall` + Test N; T-33-72 (transcript lost on a failure path) mitigated by `cleanupPlan` + the transcript class + the printed path; T-33-73 (`--out` swallowing a flag) mitigated by `outValue`; T-33-SC: no package installed, `package.json` untouched.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The next live go (33-21) cannot burn its budget on a target with no plugin and cannot lose its transcript to a post-run derivation failure; a red run prints the transcript paths D-11's diagnosis needs.
- Plan 33-16 (wave 8) and 33-20 are the remaining round-2 work before the human stops at 33-20/33-21/33-22.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-20*

## Self-Check: PASSED

- 3 modified files present on disk; 4 task commits (`3ec41ada`, `c18886d3`, `a153a12e`, `0a545e11`) present in history; `commits: 4` measured from ledger `168ca917dc355a5f2d3905cb2315ded87ee5be7a`.
