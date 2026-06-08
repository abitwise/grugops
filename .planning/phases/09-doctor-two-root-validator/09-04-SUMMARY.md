---
phase: 09-doctor-two-root-validator
plan: 04
subsystem: testing
tags: [test-harness, fixtures, doctor, validator, parity, c3, two-root, sc5, kit-resolution]

# Dependency graph
requires:
  - phase: 09-doctor-two-root-validator
    plan: 01
    provides: "install.sh --check doctor (the sh program under test): three-source cross-check, ordered first-failure, WARN tier, exit-code matrix, dangling-symlink FAIL, not-installed fold-into-FAIL"
  - phase: 09-doctor-two-root-validator
    plan: 02
    provides: "two-root validator split — VALIDATE_KIT_ROOT (no default → unset is a hard exit(1) tagged (C3)) + STATE_ROOT reusing VALIDATE_ROOT; this is the RED-by-design contract validate.test.sh is rewritten against here"
  - phase: 09-doctor-two-root-validator
    plan: 03
    provides: "install.mjs --check doctor (the Node byte-parity twin under test): same kit: resolution line, same first-failure, same exit-code matrix"
  - phase: 08-two-root-installer
    provides: "the two-root installer (GRUGOPS_HOME kit copy + materialized adapters + seeded state + install.json marker) the doctor checks drive hermetically via run_install"
provides:
  - "install.test.sh Checks 7-13: the SC1/SC2/SC5 doctor surface — good-split pass, missing-kit loud FAIL, deterministic first-failure, full exit-code matrix, dangling-symlink FAIL, read-only double-check, sh↔Node doctor parity"
  - "validate.test.sh two-root checks: GOOD split passes, BAD missing-kit fails, BAD unset-kit errors with the (C3) message (SC4 no-`.`-fallback proof) — plus the back-compat rewrite that makes the 8 single-tree fixtures pass under the no-default kit-root contract"
  - "the three-way resolution-parity assertion: sh doctor = Node doctor = Node validator resolve the SAME kit dir for one GRUGOPS_HOME (SC4 / D-04)"
affects: ["v1.1 milestone close (full suite GREEN is the phase gate)", "any future kit-resolution change (the parity assertion + the C3 unset check are the mechanical guards)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hermetic two-root install driver borrowed into install.test.sh (run_install: INSTALL_MODE=copy + GRUGOPS_SRC/GRUGOPS_HOME/TARGET overrides + --yes) so doctor checks never mutate the real repo or $HOME"
    - "capture-rc doctor() wrapper (DOC_OUT/DOC_RC via `out=$(cmd 2>&1) && rc=0 || rc=$?`) — survives set -eu on the doctor's nonzero exit; reused across every doctor check"
    - "Two-root validator drivers: run_fixture now sets BOTH VALIDATE_KIT_ROOT + VALIDATE_ROOT at the same tree (single-tree fixtures = their own kit AND state, Discretion 4); run_fixture_split sets the two roots separately"
    - "C3 unset-kit proof: invoke the validator through an `( unset VALIDATE_KIT_ROOT; node … )` subshell — the only way to assert the no-default guard fires (a driver that sets the var can't test its absence)"
    - "Resolution-parity by spelling-aware comparison: the doctors' kit dir is ${GRUGOPS_HOME}/agent-factory; the validator's kit root is the PARENT containing agent-factory/, so the assertion compares the doctors' `kit:` line to ${VALIDATE_KIT_ROOT}/agent-factory and confirms the validator found the role/workflow tree there"
    - "mktemp-built split fixtures (cp -R the kit subtree vs the state subtree out of fixtures/good) — no duplicate fixture trees committed; cleaned by trap"

key-files:
  created: []
  modified:
    - "install/install.test.sh — appended Checks 7-13 (run_install + doctor drivers + the 7 doctor checks); Checks 1-6 untouched"
    - "scripts/validate.test.sh — rewrote run_fixture for the two-root contract, fixed the own-tree self-test to supply VALIDATE_KIT_ROOT, added run_fixture_split + expect_pass/fail_split, the three two-root checks, and the three-way resolution-parity assertion; mktemp -d + trap cleanup added"

key-decisions:
  - "Resolution-parity is proven as SPELLING-AWARE path agreement, not full structural validity of $GRUGOPS_HOME: the installer copies only agent-factory/ into the shared home (AGENTS.md/.claude-plugin/ stay in the source checkout by design), so a bare VALIDATE_KIT_ROOT=$GRUGOPS_HOME run legitimately flags those two top-level files as missing — that is NOT drift. The assertion compares the doctors' resolved agent-factory dir to ${VALIDATE_KIT_ROOT}/agent-factory and asserts the validator emitted no 'missing required role/workflow file' finding (proving it resolved the role tree to exactly that path)."
  - "Split fixtures are mktemp-built from fixtures/good (cp -R the kit subtree + AGENTS.md + .claude-plugin/ into one root, plans/ into another), NOT committed as new trees — the planner permitted either; mktemp keeps the kit/state classification exercised from the SAME bytes the combined GOOD fixture already proves, with zero new committed fixtures."
  - "run_fixture was changed to set BOTH VALIDATE_KIT_ROOT and VALIDATE_ROOT at the same fixture tree (not just VALIDATE_ROOT): under the 09-02 no-default contract a tree is simultaneously its own kit and its own state, so the 8 existing single-tree fixtures pass unchanged (back-compat, Discretion 4) — this is the precise fix for the RED-by-design state where every check tripped the C3 guard."

patterns-established:
  - "Doctor checks live ONLY in install.test.sh; the deep two-root harness (install.two-root.test.sh) and the Phase-7 grep gate (check-kit-refs.sh) are read-only references, never edited (D-09/D-10 — two harnesses, some overlap accepted, both stay GREEN)."
  - "Every new check is hermetic (mktemp -d + trap cleanup + env overrides) and the read-only doctor check snapshots the target before/after a double --check to prove zero mutation (T-09-02/T-09-09); `git status` is clean after the full suite."

requirements-completed: [INSTALL-05, VAL-02]

# Metrics
duration: 12min
completed: 2026-06-08
---

# Phase 9 Plan 04: Verification Layer (Doctor Checks + Two-Root Validator + Resolution Parity) Summary

**Closed the phase's verification layer: extended `install.test.sh` with 7 doctor checks (good-split pass, missing-kit loud FAIL, deterministic first-failure, the full exit-code matrix, dangling-symlink FAIL, read-only double-`--check`, sh↔Node doctor parity), rewrote `validate.test.sh` for the two-root validator (GOOD split passes, BAD missing-kit fails, BAD unset-kit errors with the `(C3)` no-`.`-fallback message) — fixing the RED-by-design state from 09-02 — and added the three-way resolution-parity assertion proving sh doctor = Node doctor = Node validator agree on the kit root. The full suite is GREEN.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-08
- **Completed:** 2026-06-08
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- **install.test.sh SC1/SC2/SC5 doctor surface (Checks 7-13):** a hermetic `run_install` two-root driver + a capture-rc `doctor()` wrapper, then: (7) good split → `--check` exits 0 with `ALL CHECKS PASSED`; (8) `rm -rf "$GRUGOPS_HOME/agent-factory"` → `--check` nonzero naming the missing kit + its referencing artifact; (9) byte-identical first-failure across two runs; (10) the full exit-code matrix (pass=0, FAIL≠0, WARN-only→0 via a bumped kit VERSION skew, WARN+`--strict`→≠0); (11) dangling-symlink FAIL with a symlink-specific line; (12) double `--check` leaves a byte-identical target snapshot (read-only); (13) sh↔Node doctor parity (same rc + same first-failure line, node-gated skip-with-note). Checks 1-6 untouched.
- **validate.test.sh two-root rewrite (SC3/SC4):** the RED-by-design harness from 09-02 is now GREEN. `run_fixture` sets BOTH `VALIDATE_KIT_ROOT` and `VALIDATE_ROOT` at the same tree, and the own-tree self-test supplies `VALIDATE_KIT_ROOT=$REPO_ROOT` — so the 8 single-tree fixtures + the D-42 self-test pass under the no-default kit-root contract. New `run_fixture_split` + `expect_pass/fail_split` drivers and three checks: GOOD split passes; BAD missing-kit (`VALIDATE_KIT_ROOT`→nonexistent) fails naming a missing required file; BAD unset-kit errors via an `( unset VALIDATE_KIT_ROOT; node … )` subshell with `VALIDATE_KIT_ROOT is unset` + `(C3)`.
- **Three-way resolution-parity assertion (SC4/D-04):** one `GRUGOPS_HOME` drives the sh doctor, the Node doctor, and the Node validator; the assertion confirms the two doctors' `kit:` line equals `${VALIDATE_KIT_ROOT}/agent-factory` and that the validator resolved the role/workflow tree to exactly that path (no missing-required drift). Node-gated skip-with-note; the fail branch names all three values on drift (proven via a forced-mismatch scratch run).
- **D-09/D-10 honored:** the deep two-root harness (`install.two-root.test.sh`, 18/18) and the Phase-7 grep gate (`check-kit-refs.sh`) stay GREEN and untouched. Full suite: `install.test.sh && install.two-root.test.sh && validate.test.sh && check-kit-refs.sh` all exit 0; `git status` clean after the run.

## Task Commits

Each task was committed atomically:

1. **Task 1: extend install.test.sh with SC5 doctor checks** - `029153d` (test)
2. **Task 2: rewrite validate.test.sh for the two-root validator** - `dce06ad` (test)
3. **Task 3: three-way resolution-parity assertion** - `a54b5eb` (test)

**Plan metadata:** committed separately (this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified
- `install/install.test.sh` - Appended Checks 7-13: the hermetic `run_install`/`doctor` drivers and the 7 doctor checks (good-split, missing-kit, first-failure determinism, exit-code matrix, dangling-symlink, read-only double-check, sh↔Node parity). Checks 1-6 left byte-for-byte intact.
- `scripts/validate.test.sh` - Rewrote `run_fixture` to set both roots; fixed the own-tree self-test to supply `VALIDATE_KIT_ROOT`; added `run_fixture_split` + `expect_pass/fail_split`, the three two-root checks (GOOD split / BAD missing-kit / BAD unset-kit C3), the three-way resolution-parity assertion, and a `mktemp -d` + `trap cleanup` hermetic scratch area.

## Decisions Made
- **Spelling-aware parity comparison:** the doctor's `KIT_ROOT` is the `agent-factory/` directory itself (`${GRUGOPS_HOME}/agent-factory`), while the validator's `KIT_ROOT` is the PARENT that contains `agent-factory/` (it resolves refs as `join(VALIDATE_KIT_ROOT, "agent-factory/…")`). These are two spellings of the same kit. The assertion therefore compares the doctors' `kit:` line to `${VALIDATE_KIT_ROOT}/agent-factory` and proves the validator found the role/workflow tree at that path — rather than naively string-comparing two intentionally-different kit-root variables.
- **Why a bare `VALIDATE_KIT_ROOT=$GRUGOPS_HOME` validator run flags `AGENTS.md`/`.claude-plugin/` as missing (and why that is NOT a parity failure):** the installer copies only `agent-factory/` into the shared home by design (the top-level `AGENTS.md`/`.claude-plugin/` belong to the source checkout). The parity guard asserts resolution AGREEMENT (no `missing required role/workflow file` finding) rather than full structural validity of a half-populated home — the latter would be a false RED about a deliberate installer behavior.
- **mktemp-built split fixtures, not committed trees:** the planner permitted either; building the kit/state split from `fixtures/good` via `cp -R` keeps the classification exercised from the same bytes the combined GOOD fixture already proves, adds zero duplicate fixtures to the repo, and is torn down by `trap`.

## Deviations from Plan

None — plan executed exactly as written.

The one judgment call (proving resolution parity as spelling-aware path agreement rather than a naive variable string-equality, and treating the half-populated-home `AGENTS.md` miss as expected installer behavior) is faithful to the plan's intent: Task 3's action explicitly notes "for the validator, the resolved kit root is the explicit input, so the assertion confirms that feeding the doctor-resolved `${GRUGOPS_HOME}/agent-factory` into `VALIDATE_KIT_ROOT` yields the same path all three agree on." The implementation realizes exactly that contract against the real two-root structural reality (doctor names the `agent-factory` dir; validator names its parent), which is the only correct reading.

## Issues Encountered
- **Parity-check first draft conflated the two kit-root spellings (caught + fixed during execution):** the initial assertion set `VALIDATE_KIT_ROOT=${GRUGOPS_HOME}/agent-factory` and expected the validator to validate it directly — but the validator resolves refs as `join(VALIDATE_KIT_ROOT, "agent-factory/…")`, so that pointed it at `${GRUGOPS_HOME}/agent-factory/agent-factory` (everything missing). Diagnosed the doctor-vs-validator spelling difference (doctor `KIT_ROOT` = the `agent-factory` dir; validator `KIT_ROOT` = its parent), and rewrote the assertion to feed `VALIDATE_KIT_ROOT=${GRUGOPS_HOME}` and compare the doctors' `kit:` line to `${VALIDATE_KIT_ROOT}/agent-factory`, asserting no missing-required-role/workflow drift. Re-proved GREEN, and proved the fail branch fires on a forced mismatch (it names all three values).
- **Own-tree self-test + the 8 single-tree fixtures were RED-by-design (the 09-02 hand-off):** every check tripped the new C3 unset-kit guard because `run_fixture` only set `VALIDATE_ROOT`. Resolved by setting BOTH roots in `run_fixture` (same tree) and supplying `VALIDATE_KIT_ROOT=$REPO_ROOT` to the own-tree self-test — the exact back-compat fix Discretion 4 specifies. All prior fixtures now pass unchanged.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- **Full suite GREEN — the phase gate is met.** `install.test.sh` (13 checks), `install.two-root.test.sh` (18/18), `validate.test.sh` (16 checks incl. the 3 two-root + parity), and `check-kit-refs.sh` all exit 0; `git status` is clean after the run (the doctor and the tests mutate nothing).
- **VAL-02 + INSTALL-05 fully proven mechanically:** the C3 false-green is now impossible to ship (the unset-kit check fires on the literal `(C3)` message), and "doctor passes" can never silently disagree with "validator passes" (the three-way resolution-parity assertion).
- **C3 gating blocker (STATE.md) is discharged for the test layer:** the validator must NOT fall back to `.` and MUST fail an unset-`$GRUGOPS_HOME`/unset-`VALIDATE_KIT_ROOT` BAD fixture — both are now asserted GREEN checks, not prose.
- This is the final plan of Phase 09; the milestone v1.1 (Install & Distribution) verification layer is complete.

## Self-Check: PASSED

- FOUND: `.planning/phases/09-doctor-two-root-validator/09-04-SUMMARY.md`
- FOUND: commit `029153d` (test(09-04): extend install.test.sh with SC5 doctor checks)
- FOUND: commit `dce06ad` (test(09-04): rewrite validate.test.sh for two-root validator)
- FOUND: commit `a54b5eb` (test(09-04): add three-way resolution-parity assertion)
- FOUND: `install/install.test.sh` + `scripts/validate.test.sh` modified in HEAD

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*
