---
phase: 15-typescript-tooling-migration
plan: 03
subsystem: installer
tags: [typescript, installer, uninstaller, two-root, vitest, sentinel-idempotency, fail-closed]

# Dependency graph
requires:
  - phase: 15-01
    provides: "tsc/tsconfig/vitest build posture, committed-.ts/.js + freshness gate, LF pin"
provides:
  - "install/install.ts + install/install.js — single TS installer (D-07; replaces install.sh + install.mjs), additive/idempotent/DRY_RUN/reversible/never-overwrite"
  - "install/uninstall.ts + install/uninstall.js — TS uninstaller (D-09; replaces uninstall.sh), is_protected denylist + CR-01 bounded marker-strip"
  - "install/install.test.ts — Vitest harness folding install.test.sh + install.two-root.test.sh; D-08 retired-parity marker; idempotent/DRY_RUN/round-trip cases"
  - "reserved D-11 materializeRunnable() seam in install.ts (between seedState() and writeMarker())"
affects: [15-04-validator, 15-05-runnable-ref, 15-06-cleanup, 16-gate-convergence, 17-install-migrate-update]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "behavior-preserving .mjs/.sh -> .ts port: types only, every env-var/sentinel/exit-code/regex/fail-closed branch carried byte-for-behavior"
    - "import.meta.dirname for SCRIPT_DIR (Node 22+); committed LF .js via tsc; freshness-gated"
    - "Vitest installer-contract harness: spawnSync the committed .js into mkdtemp host fixtures; content-addressed snapshot of BOTH roots; afterEach rmSync cleanup"
    - "D-08 retired-parity marker convention: explicit greppable comment + it.skip so an intentionally-absent check is not read as a regression"

key-files:
  created:
    - "install/install.ts"
    - "install/install.js"
    - "install/uninstall.ts"
    - "install/uninstall.js"
    - "install/install.test.ts"
  modified: []

key-decisions:
  - "Ported install.mjs (not install.sh) as the analog — the .mjs is already Node + stdlib-only and mirrors install.sh's byte-spec; types added, nothing semantic changed"
  - "Two user-facing strings updated install.sh/install.mjs -> install.js in the now-Node-only error wording (the run-this-script hint); the load-bearing grep tokens ('not installed in', 'agent-factory', 'referenced by') are preserved verbatim"
  - "Old install.sh/install.mjs/uninstall.sh/*.test.sh KEPT in-tree as parity oracles (deleted in Plan 06)"

patterns-established:
  - "Sentinel-block idempotency: CLAUDE_OPEN/CLOSE + COPILOT_OPEN/CLOSE byte-identical across install.ts/uninstall.ts (verified by grep-diff of the shared GSD: set)"
  - "CR-01 bounded removal ported verbatim in both materializeAdapter (install) and removeSentinelBlock (uninstall) — an unterminated block restores buffered lines, never silent loss"
  - "readFileSync trailing-newline reconciliation so the TS sentinel-strip emits byte-identical output to the sh awk pass"

requirements-completed: [TOOL-01]

# Metrics
duration: ~25min
completed: 2026-06-13
---

# Phase 15 Plan 03: Single TypeScript Installer (D-07/D-09) Summary

**Collapsed the dual installer (install.sh POSIX + install.mjs Node) into one behavior-parity `install.ts`/`.js` and ported `uninstall.sh` -> `uninstall.ts`/`.js`, with a Vitest harness folding both sh test suites and carrying the D-08 retired-parity marker — every env-var, sentinel, the doctor, the self-checkout guard, the CR-01 bounded marker-strip, and the never-overwrite/never-delete/never-set-deploy-var invariants preserved.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-06-13
- **Tasks:** 2
- **Files created:** 5 (3 .ts + 2 committed .js; .test.ts excluded from tsc emit)

## Accomplishments
- `install.ts` is a verbatim-behavior port of `install.mjs`: arg-parse (unknown arg -> exit 2), `ensureBlock`, `linkOrCopy` (D-30), `materializeAdapter` (strip-then-inject, CR-01 bounded), `seedFile`/`seedState`/`listSeedFiles`, `writeMarker`, and the full non-mutating `doctor()` (D-03 three-source cross-check, ordered first-failure, WARN tier, exit matrix, `docAbspath` non-normalizing). The D-07 self-checkout guard and the never-set-deploy-var / never-touch-protected-dirs invariants are intact.
- `uninstall.ts` is a 1:1 port of `uninstall.sh`: the `isProtected` denylist (agent-factory/ plans/ .planning/ .grugops/ docs/ src/ + repo root), `removeFile`, `removeSentinelBlock` (CR-01 bounded), `unmergeGemini` (safe JSON edit, grugops-default-shape removal), `removeMarker` (the single `.grugops/install.json` exception), and the AGENTS.md symlink-into-source / byte-identical-copy ownership logic. Sentinel strings equal `install.ts`'s exactly.
- `install.test.ts` folds `install.test.sh` + `install.two-root.test.sh` into one Vitest suite (17 passing + 1 intentional skip) over the committed `.js`, snapshotting BOTH `$TARGET` and `$GRUGOPS_HOME`, and carries the REQUIRED D-08 retired-parity marker.
- The D-11 `materializeRunnable()` seam is reserved in `install.ts` (a clear comment between `seedState()` and `writeMarker()`) for Plan 05 — NOT added here.

## Task Commits

1. **Task 1: Port install.ts + uninstall.ts** — `8650801` (feat)
2. **Task 2: Vitest install harness + D-08 marker** — `888c4c3` (test)

## Files Created/Modified
- `install/install.ts` — single TS installer (D-07; replaces install.sh + install.mjs); env-vars `GRUGOPS_SRC`/`GRUGOPS_HOME`/`TARGET`/`INSTALL_MODE`/`DRY_RUN`; reserves the D-11 seam.
- `install/install.js` — committed compiled installer (freshness-checked, LF).
- `install/uninstall.ts` — TS uninstaller (D-09; replaces uninstall.sh); `isProtected` denylist + CR-01 bounded removal.
- `install/uninstall.js` — committed compiled uninstaller (LF).
- `install/install.test.ts` — Vitest harness (folds both sh suites); D-08 retired-parity marker; idempotent/DRY_RUN/round-trip + two-root/doctor/guard cases.

## Decisions Made
- **Ported the `.mjs`, not the `.sh`** — the `.mjs` is already Node + stdlib-only and mirrors `install.sh`'s byte-spec; the port adds types only and changes nothing semantic.
- **Two error-wording strings updated** `install.sh`/`install.mjs` -> `install.js` (the "run this script then --check" hint, now that Node is the single installer). The load-bearing grep tokens that tests and the doctor key on (`not installed in`, `agent-factory`, `referenced by`, `ALL CHECKS PASSED`, the `<!-- GSD:... -->` sentinels) are byte-preserved.
- **Old `.sh`/`.mjs`/`.test.sh` kept in-tree** as parity oracles; their deletion is Plan 06's deliverable.

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, or blocking issues surfaced during the port; the behavior-parity smoke tests (target-tree + marker byte-identical to the `install.mjs` oracle; uninstall CLAUDE/Copilot/Gemini strips byte-identical to the `uninstall.sh` oracle) passed on the first run.

## Issues Encountered
- **Trailing-newline reconciliation in `removeSentinelBlock`.** The sh `awk` reads line-records (no phantom trailing empty record), whereas `readFileSync(...).split("\n")` yields a trailing `""` for a newline-terminated file. Handled by dropping a single trailing `""` before processing and re-adding the trailing newline on write — verified byte-identical to the `uninstall.sh` output via `cmp -s` on both the CLAUDE.md and Copilot strip cases. Not a deviation (a faithful port of the awk semantics, not a behavior change).

## Threat Surface
No new security-relevant surface beyond the plan's `<threat_model>`. All five STRIDE entries are mitigated at parity:
- **T-15-03-Tamper / Tamper2** (overwrite/delete user content; unbounded marker-strip): `ensureBlock` never `>`-truncates, `seedFile`/`linkOrCopy` skip-if-exists/identical, `isProtected` refuses the frozen-core/state dirs, and the CR-01 bounded removal is ported verbatim in both directions. Vitest round-trip asserts seeded user state + frozen core + the shared kit survive.
- **T-15-03-EoP** (deploy-approval var): `grep -nE 'GRUGOPS_PROD_DEPLOY_APPROVED\s*=' install.ts` returns nothing; the D-07 self-checkout guard is preserved (test: refuse-by-default + `--allow-self` override).
- **T-15-03-Spoof** (garbled marker false-green): `readMarker` is fail-closed (try/catch -> null, plus a non-object/array reject before dereference); a garbled/absent marker folds into the byte-identical not-installed FAIL (test: not-installed -> rc 1).
- **T-15-03-Info** (retired parity test): the explicit `D-08` marker documents the intentional absence (Pitfall 6).

## Known Stubs
None. The D-11 `materializeRunnable()` seam is a deliberately-reserved comment (Plan 05 owns it), not a stub — `install.ts` is fully functional at parity without it.

## Next Phase Readiness
- TOOL-01 is satisfied for the installer at exact parity. The single `install.ts`/`uninstall.ts` pair, the doctor, and the Vitest contract harness are green.
- The D-11 materialization seam is concrete and reserved for Plan 05's `materializeRunnable()`.
- `install.sh`/`install.mjs`/`uninstall.sh`/`install.test.sh`/`install.two-root.test.sh` remain in-tree as parity oracles until Plan 06 (full-sweep cleanup). The invocation-string sweep (README/docs/AGENTS.md references to `install.sh`/`install.mjs`) is owned by the cleanup plan, not this one.

## Self-Check: PASSED

All 6 created files verified present on disk (install.ts/.js, uninstall.ts/.js, install.test.ts, 15-03-SUMMARY.md); both per-task commits (`8650801` feat, `888c4c3` test) verified in git history.

---
*Phase: 15-typescript-tooling-migration*
*Completed: 2026-06-13*
