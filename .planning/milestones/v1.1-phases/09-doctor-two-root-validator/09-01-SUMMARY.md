---
phase: 09-doctor-two-root-validator
plan: 01
subsystem: infra
tags: [doctor, install, posix-sh, two-root, kit-resolution, verification]

# Dependency graph
requires:
  - phase: 08-two-root-installer
    provides: "resolve_grugops_home, write_marker (.grugops/install.json 4-field schema), MAT_OPEN/MAT_CLOSE/MAT_SLOT materialization sentinels, copy_kit/materialize_adapter/seed_state"
  - phase: 07-shared-home-foundation-path-rewrite
    provides: "kit-vs-state classification (agent-factory/… = KIT at KIT_ROOT; plans/, memory-bank/, .grugops/ = STATE repo-relative)"
provides:
  - "install.sh --check doctor: the POSIX sh side of the byte-parity doctor pair (INSTALL-05)"
  - "doctor() three-source kit-root cross-check (re-resolved rule / marker kitRoot / adapter KIT=)"
  - "deterministic ordered first-failure stat set with dangling-symlink FAIL"
  - "non-empty WARN tier (kit-version skew + missing optional seed) so --strict has live warnings"
  - "the exit-code matrix: 0 pass / nonzero FAIL / WARN→0 / --strict→nonzero (SC2)"
  - "the FIRST reader of the .grugops/install.json marker"
affects: ["09-02 (install.mjs --check Node twin keys off this as its behavioral spec)", "09-04 (install.test.sh doctor checks)", "VAL-02 validator (resolves kit home by the same rule)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Doctor as a non-mutating early-exit arm of the installer (branch before the run banner, never reaches copy_kit/materialize/seed/write_marker)"
    - "Three-source kit-root cross-check (D-03): normalize via abspath; all-equal→pass, differ-but-all-real-cosmetic→WARN, any-unresolvable-or-divergent→FAIL"
    - "Deterministic first-failure ordering via a fixed newline-delimited tuple list (no readdir ordering), iterated WITHOUT a pipe to keep counters in-scope and WITHOUT a temp file to stay read-only"
    - "Read-back of the 4-field marker via grep -m1 + sed; adapter KIT= via op/cl-neutral awk (BSD/macOS-safe), both test-before-read fail-closed"

key-files:
  created: []
  modified:
    - "install/install.sh — added --check/--strict flags, doctor() + read_marker_field/read_adapter_kit/kit_real helpers, the early-exit branch, and moved the MAT_* sentinels above the doctor"

key-decisions:
  - "Tasks 1 and 2 committed as one atomic feat commit: the early-exit branch references doctor(), so they must land together to keep sh -n valid (single coherent unit)."
  - "MAT_OPEN/MAT_CLOSE/MAT_SLOT sentinels moved up to before the doctor so read_adapter_kit can reference them under --check (they were defined after the early-exit point); materialize_adapter on the install path reuses the same definitions verbatim."
  - "Stat loop iterates without a pipe (IFS-newline for-loop) and writes no temp file — preserves read-only-by-construction (T-09-02) AND keeps DOC_FAILS in the current shell scope."

patterns-established:
  - "Doctor read-only-by-construction: greppable doc_report/doc_fail/doc_warn lines; FAIL names path + referencing file; final line ALL CHECKS PASSED / N FAILURE(S) / N WARNING(S)."
  - "not-installed fold-into-FAIL: absent marker → distinct greppable 'grugops not installed … run install.sh' line + nonzero, fail-closed before touching adapters."

requirements-completed: [INSTALL-05]

# Metrics
duration: 4min
completed: 2026-06-08
---

# Phase 9 Plan 01: install.sh --check Doctor Summary

**Added the POSIX `sh` doctor arm (`install.sh --check`/`--strict`) — a non-mutating verifier that re-resolves the kit root three ways, cross-checks them (D-03), stats a deterministic ordered start-up path set failing on the first unresolved one with its referencing file, and runs a non-empty WARN tier (kit-version skew + missing seed), with the full exit-code matrix.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-08T06:56:08Z
- **Completed:** 2026-06-08T07:00:30Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `--check`/`--strict` flags wired into the arg loop (init `CHECK=0`/`STRICT=0`; unknown-arg `exit 2` preserved) and a non-mutating early-exit branch (`if [ "$CHECK" = "1" ]; then doctor; exit $?; fi`) placed after kit/TARGET resolution but before the D-07 guard's exit, the run banner, and every mutation.
- `doctor()` implements the D-03 three-source cross-check (re-resolved rule / marker `kitRoot` / adapter `KIT=`), normalized via `abspath`, biasing to FAIL on true divergence and WARN on cosmetic-but-real.
- Deterministic ordered first-failure stat set (D-02/D-05): `KIT_ROOT` → `roles/orchestrator.md` → `roles/_role-switch-protocol.md` → `workflows/` → `.grugops/factory.config.json` → `plans/board.md` → `plans/handoffs/`, with kit refs resolved at `KIT_ROOT` and state refs repo-relative (Phase-7 classification), and a dangling-symlink FAIL (`[ -L ] && [ ! -e ]`).
- Non-empty WARN tier (D-06/D-07, detect-only): marker `kitVersion` vs `$KIT_ROOT/VERSION` skew, and missing optional seed (`memory-bank/00-index.md`) — so `--strict` has live warnings.
- Exit-code matrix proven (SC2): healthy→0, FAIL→nonzero, WARN-only→0, WARN+`--strict`→nonzero; uninstalled/dev checkout folds into FAIL with a distinct `not installed` line, never crashing.
- The doctor is the FIRST reader of the `.grugops/install.json` marker, read-only by construction (no `copy_kit`/`materialize_adapter`/`seed_state`/`write_marker` call; never names the deploy-approval env var).

## Task Commits

Both tasks were committed atomically as one coherent unit (the early-exit branch references `doctor()`; splitting would leave an intermediate state where `sh -n` could not validate the branch against a defined function):

1. **Task 1 (flags + non-mutating early-exit arm) + Task 2 (doctor() implementation)** - `4df79bd` (feat)

**Plan metadata:** committed separately (this SUMMARY + STATE.md + ROADMAP.md).

## Files Created/Modified
- `install/install.sh` - Added `--check`/`--strict` flags (usage block + arg loop), the `doctor()` function with `read_marker_field`/`read_adapter_kit`/`kit_real`/`doc_report`/`doc_fail`/`doc_warn` helpers, the early-exit branch, and relocated the `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` sentinels above the doctor so `read_adapter_kit` can reference them under `--check`.

## Decisions Made
- **Combined-commit for Tasks 1+2:** the early-exit branch (`doctor; exit $?`) and the `doctor()` definition are interdependent — committing Task 1 alone would reference an undefined function. Landed together as one `feat(09-01)` commit so every committed state is `sh -n`-valid.
- **Sentinel relocation:** `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` were defined after the early-exit point, so `read_adapter_kit` (called under `--check`) would have seen them unset. Moved them up to just before the doctor; `materialize_adapter` on the install path still uses the same definitions verbatim (zero behavioral change to install).
- **Read-only stat loop:** the natural `printf … | while read` shape spawns a subshell that swallows `DOC_FAILS`. Rewrote it as an IFS-newline `for` loop with no pipe and no temp-file capture — this both keeps the counter in the current shell scope AND preserves read-only-by-construction (T-09-02), proven by a before/after target snapshot across a double `--check`.

## Deviations from Plan

None - plan executed exactly as written. The combined commit (vs one commit per task) is a commit-granularity choice forced by the interdependence of the two tasks, not a scope deviation; all Task-1 and Task-2 actions and acceptance criteria were implemented exactly as specified.

## Issues Encountered
- **Sentinel ordering:** `read_adapter_kit` referenced `MAT_OPEN`/`MAT_CLOSE`, defined ~200 lines below the early-exit branch — they would be unset under `--check`. Resolved by relocating the three `MAT_*` definitions above the doctor block (verified `sh -n` + the cross-check smoke tests).
- **Subshell counter loss:** the first stat-loop draft used a pipe-into-`while` (subshell) and a temp file to ferry the failure sentinel out — the temp file was itself a mutation under `--check`. Resolved by switching to a no-pipe IFS-newline `for` loop; verified read-only via target snapshot equality across two `--check` runs.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- INSTALL-05 (sh side) complete: `install.sh --check` is the behavioral spec for the Plan 02 Node twin (`install.mjs --check`) and for the Plan 04 `install.test.sh` doctor checks.
- All three existing regression harnesses remain GREEN and untouched: `install.two-root.test.sh`, `scripts/check-kit-refs.sh`, `install.test.sh` (`sh -n install.sh` also clean).
- The full doctor exit-code matrix, first-failure determinism, three-source cross-check, dangling-symlink FAIL, WARN tier, and read-only invariant were exercised by ad-hoc smoke tests during execution; they will be codified as committed checks in Plan 04 (`install.test.sh`).

## Self-Check: PASSED

- FOUND: `.planning/phases/09-doctor-two-root-validator/09-01-SUMMARY.md`
- FOUND: commit `4df79bd` (feat(09-01): add install.sh --check doctor)
- FOUND: `install/install.sh` in HEAD

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*
