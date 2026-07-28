---
phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2
plan: 02
subsystem: testing
tags: [vitest, claude-cli, e2e, headless, loud-skip, safe-02, dog-02, d-31, no-fabrication]

# Dependency graph
requires:
  - phase: 19-01
    provides: "Tier-1 deterministic oracle aggregator (scripts/check-uat-oracles.js) + its wiring into the foundation-guards aggregator — the gate doc references both"
  - phase: 05-packaging-adapters-install-distribution
    provides: "hooks/guard.ts deny string + GRUGOPS_PROD_DEPLOY_APPROVED var (the A2-live assertion target); the .claude-plugin marketplace/plugin the A1 case installs"
  - phase: 15-typescript-tooling-migration
    provides: "D-13 TS→committed-.js→freshness→Vitest house convention the harness clones; vitest.config.ts fileParallelism:false / globals:false"
provides:
  - "Gated headless Tier-2 E2E harness (scripts/e2e/uat-live.test.ts) driving the real claude CLI through A1/A2-live/A3-live behind a claude-auth-status present-and-authed probe"
  - "Exported LOUD_SKIP_MARKER sentinel + stubbable emitLoudSkipIfUnavailable() / claudePresentAndAuthed() helpers — the single skip-decision point"
  - "BLOCKER 2 proof: a -t \"loud-skip\" test forces the probe false and asserts the EXACT sentinel, so a correct loud-skip is distinguishable from a forbidden silent it.skip"
  - "package.json test:e2e script kept OUT of the default test green path; zero new devDependency"
  - "Single-source §14 gate reference (reference-don't-restate) to both auto-UAT lanes in 05-pr-quality-gate.md"
  - "Three-lane documentation in docs/dogfood-human-runbook.md (Tier-1/2 authoritative vs Tier-3 advisory/human)"
affects: [19-03a, 19-03b, factory-auto-uat, dogfood, dog-02, safe-02]

# Tech tracking
tech-stack:
  added: []  # zero new packages — node stdlib + existing {typescript, vitest, @types/node} + external claude CLI prereq
  patterns:
    - "Gated-on-external-CLI Vitest E2E lane with a fail-closed present-and-authed probe and a LOUD distinct skip marker (never a silent green)"
    - "Test-of-the-test (BLOCKER 2): the skip path itself is proven by forcing the probe false and asserting the exact sentinel"
    - "Reference-don't-restate gate wiring: new lanes are referenced (commands + exit-code branching), never restated, single-source in 05-pr-quality-gate.md"

key-files:
  created:
    - "scripts/e2e/uat-live.test.ts"
  modified:
    - "package.json"
    - "agent-factory/workflows/05-pr-quality-gate.md"
    - "docs/dogfood-human-runbook.md"

key-decisions:
  - "claude --version (arg-array) replaces the research's shell:true `command -v claude` presence probe — same fail-closed semantics, eliminates the DEP0190 shell-spawn hazard and avoids untrusted-input shell (ASVS V5)"
  - "Tier-2 lane carries NO new dial key — it self-gates on its own claude auth status probe (A4 confirmed), so quality.* is untouched"
  - "A2-live also self-guards: if GRUGOPS_PROD_DEPLOY_APPROVED is already exported in the dev env, the case loud-skips rather than run a deny test that would not deny (never sets it, never falsely passes)"
  - "Live A1/A2/A3 cases use it.skipIf(!LIVE) so the loud skip (emitted at module load) is the honest signal; the quiet vitest skip is backed by the loud marker, never read as a pass"

patterns-established:
  - "Loud-skip honesty gate: a single exported emitLoudSkipIfUnavailable() decides run-vs-skip, emits the exact LOUD_SKIP_MARKER, and is unit-proven by a stubbed probe"
  - "External-runtime E2E stays dev/CI-only: never a host runtime dep, never a CI secret; the loud-skip is the designed CI-without-a-key fallback"

requirements-completed: [UAT-AUTO-02, UAT-AUTO-03, UAT-AUTO-05]

# Metrics
duration: 18min
completed: 2026-06-16
---

# Phase 19 Plan 02: Tier-2 Headless E2E Harness + Single-Source Gate/Runbook Wiring Summary

**Gated headless Tier-2 E2E harness (`scripts/e2e/uat-live.test.ts`) drives the real `claude` CLI through A1 pointer resolution, A2-live SAFE-02 deny, and A3-live dual-path parity behind a `claude auth status` probe — emitting a LOUD distinct skip (never a silent green) when unauthed, with the loud-skip path itself proven by a stubbed-probe test (BLOCKER 2); both lanes are referenced single-source in the §14 gate and the runbook now names the three lanes with authoritative-vs-advisory marking.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-06-16T13:04:00Z
- **Completed:** 2026-06-16T13:23:00Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- A stubbable, fail-closed `claudePresentAndAuthed()` probe + an exported `LOUD_SKIP_MARKER` sentinel + a single `emitLoudSkipIfUnavailable()` decision point — the honesty keystone made testable.
- BLOCKER 2 proven: a `-t "loud-skip"` test forces the probe false, captures `console.warn`, and asserts the EXACT sentinel string AND a `false` return — so a correct loud-skip is distinguishable from a forbidden silent `it.skip` (both otherwise exit 0).
- The three live cases (A1/D-31, A2-live/SAFE-02, A3-live/DOG-02) wired against the real CLI with arg-array spawns (no `shell:true` on the data path), a throwaway `mkdtemp` install scope, and `afterAll` cleanup (uninstall + marketplace remove + rmSync) so the dev's real claude config is never polluted.
- The harness NEVER sets/exports `GRUGOPS_PROD_DEPLOY_APPROVED` and uses a harmless matched probe (`helm upgrade fake ./nope`), never `kubectl apply` against a real context.
- `package.json` gains `test:e2e` (kept out of the default `test`); zero new devDependency.
- Both lanes referenced single-source (reference-don't-restate) in `05-pr-quality-gate.md` — no fork into workflows 14/15; the runbook now names Tier-1/2/3 and marks Tier-1/2 authoritative vs Tier-3 advisory/human.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gated headless E2E harness (uat-live.test.ts) + test:e2e script** - `01ca162` (feat)
2. **Task 2: Single-source §14 gate reference + three-lane runbook docs** - `60e0a56` (docs)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `scripts/e2e/uat-live.test.ts` - Gated Tier-2 E2E harness: present-and-authed probe, LOUD_SKIP_MARKER sentinel, BLOCKER-2 test-of-the-test, A1/A2-live/A3-live live cases, cleanup.
- `package.json` - Added `"test:e2e": "vitest run scripts/e2e"` (out of default green path); no devDependencies change.
- `agent-factory/workflows/05-pr-quality-gate.md` - Two new reference-don't-restate gate steps for the Tier-1 oracle (`check-uat-oracles.js`) and the Tier-2 lane (`test:e2e`), config-dialed, single-source.
- `docs/dogfood-human-runbook.md` - New "three UAT lanes" section naming Tier-1/2/3 with authoritative-vs-advisory marking; clear professional voice.

## Decisions Made
- Replaced the research's `spawnSync("command", ["-v", "claude"], {shell:true})` presence probe with an arg-array `claude --version` check (same fail-closed semantics, eliminates the DEP0190 `shell:true` deprecation/hazard). See Deviations (Rule 1).
- Tier-2 lane carries NO new dial key — it self-gates on its own `claude auth status` probe (research A4 confirmed), so `quality.*` is untouched.
- A2-live self-guards: if `GRUGOPS_PROD_DEPLOY_APPROVED` is already exported in the dev environment, the case loud-skips rather than run a deny test that would not deny — it never sets the var and never falsely passes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `shell:true` presence probe with an arg-array `claude --version` check**
- **Found during:** Task 1 (harness build-out / verification)
- **Issue:** The research §A probe used `spawnSync("command", ["-v", "claude"], {shell:true})`. Under Node 22+ this emits a `DEP0190` deprecation warning ("passing args to a child process with shell option true can lead to security vulnerabilities") and is the only `shell:true` use in the file — an unnecessary command-injection surface on a safety harness.
- **Fix:** Probe the CLI directly with an arg array — `spawnSync("claude", ["--version"], {encoding:"utf8"})`, treating a non-zero status OR a non-null `error` (ENOENT) as absent. Same fail-closed semantics (absent/erroring → loud skip), no shell.
- **Files modified:** scripts/e2e/uat-live.test.ts (Task 1 commit)
- **Verification:** `npx tsc --noEmit` green; `npm run test:e2e` exits 0 with the loud skip and no DEP0190 warning; the auth gate still keys on `claude auth status` / `loggedIn` (acceptance grep confirms).
- **Committed in:** 01ca162 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — Rule 1)
**Impact on plan:** The fix hardens the harness (no `shell:true`, no untrusted-input shell on the safety surface) while preserving the exact research-specified fail-closed probe behavior. No scope creep — all other probe semantics (auth status / loggedIn gate) are unchanged.

## Issues Encountered
- **Live cases hang when run against an authed CLI in this session.** This environment's `claude` is present and `claude auth status` returns `loggedIn:true`, so a full `npm run test:e2e` here would actually drive the real CLI (plugin install, multiple `claude -p` print-mode calls) — slow, token-spending, and mutating the dev's real claude config. That real authed run is explicitly Plan 03a/03b's job (UAT-AUTO-04 flips the pending UATs from real-run output), NOT this plan's. Resolution: I verified the CI/default-state lane deterministically by running `vitest run scripts/e2e` with `claude` excluded from PATH (so the probe fail-closes) — it exits 0 via the LOUD skip, 3 live cases skipped, the 2 loud-skip-proof tests pass. The hanging interactive runs were terminated before any plugin install occurred (`claude plugin list` confirms grugops is NOT installed — no config pollution).
- **Probe is non-deterministic in this sandbox.** Across runs the spawned `claude auth status` sometimes succeeds and sometimes fail-closes depending on sandbox network state. The harness handles both honestly: a failed/inconclusive probe loud-skips (never a silent green). This is the designed behavior, not a defect.

## User Setup Required
None - no external service configuration required. The Tier-2 lane requires the external `claude` CLI + auth to run live, but that is a developer/CI prerequisite (dev/CI-only, never a host runtime dependency); without it the lane loud-skips and the default build stays green.

## Next Phase Readiness
- **Plan 19-03a/19-03b (UAT-AUTO-04):** ready to perform the REAL authed `npm run test:e2e` run and flip the pending cells in `05-HUMAN-UAT.md`, `06-HUMAN-UAT.md`, and `11-HUMAN-UAT.md` scenario 3 from the captured real-run output (never hand-set). The harness, the loud-skip honesty gate, and the safety guards (no approval-var set, harmless probe, install cleanup) are all in place.
- **Note for the verifier:** UAT-AUTO-04 is intentionally NOT marked complete here — Plan 19-02 builds the harness; only a real authed run resolves UAT-AUTO-04. No UAT files were flipped by this plan.

## Self-Check: PASSED

- FOUND: scripts/e2e/uat-live.test.ts
- FOUND: .planning/phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-02-SUMMARY.md
- FOUND commit: 01ca162 (Task 1)
- FOUND commit: 60e0a56 (Task 2)

---
*Phase: 19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2*
*Completed: 2026-06-16*
