---
phase: 09-doctor-two-root-validator
plan: 05
subsystem: testing
tags: [doctor, parity, sh, node, exit-code, byte-parity, gap-closure, cr-01, cr-02, sc2, sc4, install]

# Dependency graph
requires:
  - phase: 09 (09-01)
    provides: install.sh --check doctor (D-03 three-source cross-check, ordered first-failure, WARN tier, exit-code matrix)
  - phase: 09 (09-03)
    provides: install.mjs --check — the byte-parity Node twin / parity ORACLE
  - phase: 09 (09-04)
    provides: install.test.sh Checks 7-13 (the doctor verification layer the new parity gates extend)
provides:
  - "resolve_grugops_home lexically normalizes GRUGOPS_HOME (collapse repeated/trailing slashes) to match Node resolve()"
  - "doctor() not-installed gate folds a present-but-garbled marker into the byte-identical not-installed FAIL the Node oracle emits"
  - "install.test.sh Check 14 (trailing-slash + --strict rc parity) + Check 15 (garbled-marker rc + first-failure-line parity)"
affects: [milestone-close UAT, install, doctor, validator, any future install.sh/install.mjs parity work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lexical (no-fs) slash-collapse normalization in POSIX sh (sed 's://*:/:g' + trailing-slash case strip) to mirror Node path.resolve() WITHOUT cd/pwd"
    - "Fail-closed marker-extractability gate: an unparseable local file degrades to the same finding an absent one produces (sh empty-field test mirrors Node try/catch JSON.parse → null)"
    - "RED-before-fix / GREEN-after parity regression gate: feed the divergent input (trailing-slash home, garbled marker) so the test can actually fail (no-fabrication contract)"

key-files:
  created: []
  modified:
    - install/install.sh
    - install/install.test.sh

key-decisions:
  - "GAP 1 (CR-01): normalize inside resolve_grugops_home so BOTH install and doctor paths inherit the normalized KIT_ROOT (full self-consistency); lexical slash-collapse, never cd && pwd (must work on a not-yet-existent home)"
  - "GAP 2 (CR-02): fold a garbled marker into the EXISTING not-installed FAIL by reusing line 187 verbatim (byte-identical to Node notInstalled()) — no rewording; the extractability gate keys on an empty kitRoot read"
  - "install.mjs (the parity ORACLE) is untouched — the sh side was brought into agreement with Node, never the reverse"

patterns-established:
  - "Parity-gate authoring: drive both doctors with the SAME non-normalized input + assert byte-equal rc AND first-failure line; gate on command -v node with a skip-with-note pass"
  - "Empirical RED proof: temporarily revert the fix and confirm the new check's failure branch fires before claiming GREEN"

requirements-completed: [INSTALL-05]

# Metrics
duration: 11min
completed: 2026-06-08
---

# Phase 9 Plan 05: Doctor Two-Root Parity Gap Closure Summary

**Brought the POSIX `sh` doctor into byte-for-byte agreement with the Node oracle (`install.mjs`) on exit code AND first-failure line for the two inputs the committed suite never exercised — a trailing-slash `GRUGOPS_HOME` under `--strict` (CR-01) and a present-but-garbled install marker (CR-02) — via a lexical slash-collapse in `resolve_grugops_home` and a fail-closed marker-extractability gate, plus two RED-before/GREEN-after regression checks.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-06-08 (execution)
- **Completed:** 2026-06-08
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- **CR-01 closed (SC2):** `resolve_grugops_home` now lexically collapses repeated slashes and strips a trailing slash (matching Node `resolve()`), so a non-normalized `GRUGOPS_HOME` no longer produces a `…//agent-factory` double-slash `KIT_ROOT` that textually disagrees with the recorded marker/adapter. The spurious cosmetic WARN is gone, so under `--strict` the sh doctor exits 0 exactly like Node. **Reproduced before the fix:** `sh rc=1` vs `mjs rc=0`. **After:** both `rc=0`.
- **CR-02 closed (SC4):** the doctor's not-installed gate now treats a present-but-unparseable `.grugops/install.json` the SAME as an absent one (an empty `kitRoot` read takes the existing not-installed branch), so it prints the byte-identical `grugops not installed in <target> …` first-failure line the Node oracle emits instead of the old D-03 `DISAGREE … marker=<unset>` line. **Reproduced before the fix:** sh = DISAGREE line, mjs = not-installed line. **After:** byte-identical line, both `rc=1`.
- **Two regression gates added (Check 14 + Check 15)** that are empirically RED before the Task-1 fix and GREEN after — proven by reverting `install.sh` to `HEAD~1`, running the suite, and confirming both failure branches fire (Check 14: `sh rc=1 mjs rc=0`; Check 15: DISAGREE vs not-installed). CR-01/CR-02 can never silently ship again.
- **Oracle untouched, no regressions:** `install.mjs` is not in the changeset; all of `install.test.sh` (Checks 1-15), `install.two-root.test.sh`, and `scripts/check-kit-refs.sh` exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize resolve_grugops_home (GAP 1/CR-01) + fold garbled marker into not-installed FAIL (GAP 2/CR-02)** — `f2a4aeb` (fix)
2. **Task 2: Extend install.test.sh with Check 14 (trailing-slash+strict rc parity) + Check 15 (garbled-marker rc + first-failure-line parity)** — `2021876` (test)

**Plan metadata:** _(final docs commit below)_

## Files Created/Modified

- `install/install.sh` — `resolve_grugops_home` gains a lexical slash-collapse (`sed 's://*:/:g'` + trailing-slash `case` strip) after `abspath`; the doctor not-installed gate gains a `kitRoot`-extractability test so a garbled marker folds into the byte-identical not-installed FAIL. The D-03 cross-check, stat set, WARN tier, and exit-code matrix are untouched.
- `install/install.test.sh` — Check 14 (CR-01: trailing-slash `GRUGOPS_HOME` + `--strict` → identical rc, both 0) and Check 15 (CR-02: corrupt `.grugops/install.json` → identical rc + byte-identical first-failure line containing `not installed in`), appended after Check 13, before the Result block. Both hermetic (`$WORK/...` kit+target), node-gated with a skip-with-note pass, mirroring Check 13.

## Decisions Made

- **Normalize inside `resolve_grugops_home`, not only in the doctor:** keeps install and doctor paths consistent — a sh-installed marker is written from the same normalized `KIT_ROOT`, so it stays single-slash too.
- **Lexical slash-collapse, never `cd && pwd`:** `cd` fails on a not-yet-existent `GRUGOPS_HOME` (created later during install), which would break the install path. A pure `sed` + `case` transform works on non-existent paths and exactly matches what `node -e 'path.resolve("/x//")'` produces (verified equivalence).
- **Reuse the existing not-installed FAIL line verbatim:** line 187 was already byte-identical to Node's `notInstalled()` string; the garbled-marker fold reuses it (no rewording), so byte-parity is preserved by construction.
- **`install.mjs` left untouched:** the oracle defines correct behavior; only the sh side moved.

## Deviations from Plan

None - plan executed exactly as written. Both surgical edits landed in the specified locations; both new checks were appended where the plan directed; the no-fabrication RED-proof was performed as the plan's acceptance criteria required.

## Issues Encountered

None. Both gaps reproduced precisely as the 09-VERIFICATION.md/09-REVIEW.md descriptions predicted, both fixes produced the expected parity, and the RED-before/GREEN-after proof confirmed the new checks are real gates.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The central phase contract — "sh and Node doctors agree byte-for-byte on exit code and first-failure line" — now holds for the two previously-uncovered divergent inputs. SC2 and SC4 are restored.
- D-09 honored: `install.two-root.test.sh` and `scripts/check-kit-refs.sh` stay GREEN and untouched.
- Ready for phase re-verification of the 09-VERIFICATION blockers CR-01 and CR-02 (and any remaining gap-closure plan, e.g. 09-06).

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*

## Self-Check: PASSED

- FOUND: `.planning/phases/09-doctor-two-root-validator/09-05-SUMMARY.md`
- FOUND: `install/install.sh`
- FOUND: `install/install.test.sh`
- FOUND: commit `f2a4aeb` (Task 1 — fix)
- FOUND: commit `2021876` (Task 2 — test)
