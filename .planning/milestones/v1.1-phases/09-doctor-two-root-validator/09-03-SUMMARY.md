---
phase: 09-doctor-two-root-validator
plan: 03
subsystem: infra
tags: [doctor, install, node, byte-parity, two-root, kit-resolution, verification]

# Dependency graph
requires:
  - phase: 09-doctor-two-root-validator
    plan: 01
    provides: "install.sh --check doctor — the POSIX behavioral spec the Node twin mirrors function-for-function (three-source cross-check, ordered first-failure, WARN tier, exit-code matrix, not-installed fold-into-FAIL)"
  - phase: 08-two-root-installer
    provides: "install.mjs resolver (os.homedir + toPosix), writeMarker 4-field schema, MAT_OPEN/MAT_CLOSE/MAT_SLOT sentinels, materializeAdapter strip-loop, isSymlink (lstatSync)"
  - phase: 07-shared-home-foundation-path-rewrite
    provides: "kit-vs-state classification (agent-factory/… = KIT at KIT_ROOT; plans/, memory-bank/, .grugops/ = STATE repo-relative)"
provides:
  - "install.mjs --check doctor: the Node byte-parity twin of install.sh --check (INSTALL-05, Node side)"
  - "Node doctor() mirroring the sh doctor function-for-function — same pass/fail + same named first-failure path for the same target + env"
  - "docAbspath (Node twin of sh abspath, non-normalizing) so the cosmetic-vs-divergent cross-check classifies identically across the sh boundary"
affects: ["09-04 (sh↔Node doctor parity check + three-way resolution-parity assertion key off this)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node doctor as a non-mutating early-exit arm (branch after resolution + before the D-07 guard exit / run banner; never reaches copyKit/materializeAdapter/seedState/writeMarker)"
    - "Fail-closed JSON.parse marker read (try/catch → null → notInstalled), mirroring the validator safeRead posture — a garbled/absent marker is a finding, never an unhandled throw"
    - "docAbspath: a deliberately NON-normalizing absolute-path function (no `.`/`..` collapse, no slash-trim) that mirrors sh abspath so resolve() over-normalization can't turn a sh-WARN into a Node-pass"
    - "Closure-scoped DOC_FAILS/DOC_WARNS counters + docReport/docFail/docWarn (label.padEnd(14)) byte-identical to install.sh's doc_report printf"

key-files:
  created: []
  modified:
    - "install/install.mjs — added --check/--strict flags, doctor() + readMarker/readAdapterKit/kitReal/isDangling/notInstalled/docAbspath helpers + docReport/docFail/docWarn, the non-mutating early-exit branch, and relocated MAT_OPEN/MAT_CLOSE/MAT_SLOT above the doctor"

key-decisions:
  - "Tasks 1 and 2 committed as one atomic feat commit: the early-exit branch references doctor(), so they must land together to keep node -c valid (single coherent unit, same granularity choice the 09-01 sh side made)."
  - "docAbspath (not node:path resolve) for the cross-check: sh abspath returns an absolute path VERBATIM, so `…/agent-factory/.` stays textually distinct → sh emits a cosmetic WARN; resolve() would collapse it to equal → a Node `ok`. docAbspath restores byte-parity; existence checks still use join() (which the shell resolves on the sh side too)."
  - "MAT_OPEN/MAT_CLOSE/MAT_SLOT relocated above the doctor (the early-exit calls readAdapterKit, which references them) and the later duplicate const block removed; materializeAdapter on the install path reuses the same definitions verbatim (zero install behavior change, idempotency preserved)."

patterns-established:
  - "Node doctor read-only-by-construction: greppable docReport/docFail/docWarn lines; FAIL names path + referencing file; final line ALL CHECKS PASSED / N FAILURE(S) / N WARNING(S) — byte-identical to the sh doctor."
  - "not-installed fold-into-FAIL (Node): readMarker → null → notInstalled() prints the distinct greppable line + `\\n1 FAILURE(S)` and returns 1, fail-closed before touching adapters — never a Node stack trace."

requirements-completed: [INSTALL-05]

# Metrics
duration: 5min
completed: 2026-06-08
---

# Phase 9 Plan 03: install.mjs --check Doctor (Byte-Parity Node Twin) Summary

**Added the Node `install.mjs --check`/`--strict` doctor — the byte-parity twin of the Plan-01 sh doctor — a non-mutating verifier that re-resolves the kit root three ways, cross-checks them (D-03), stats a deterministic ordered start-up path set failing on the first unresolved one with its referencing file, runs the non-empty WARN tier (kit-version skew + missing seed), and matches the sh doctor byte-for-byte on output AND exit code across the full matrix.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-08T07:11:16Z
- **Completed:** 2026-06-08T07:15:52Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `--check`/`--strict` flags wired into the Node arg loop (`let CHECK = false`/`let STRICT = false` alongside `YES`/`ALLOW_SELF`; unknown-arg `process.exit(2)` preserved) plus the usage-comment block, lowercase `grugops`.
- A non-mutating early-exit branch (`if (CHECK) { process.exit(doctor()); }`) placed after `GRUGOPS_HOME`/`KIT_ROOT` + `TARGET` resolution but BEFORE the D-07 self-checkout guard's exit, the run banner, and every mutation — source-asserted to reach none of `copyKit`/`materializeAdapter`/`seedState`/`writeMarker`.
- `doctor()` implements the D-03 three-source cross-check (re-resolved rule / marker `kitRoot` / adapter `KIT=`) normalized via the new `docAbspath`, biasing to FAIL on true divergence and WARN on cosmetic-but-real.
- Deterministic ordered first-failure stat set (D-02/D-05) in the SAME tuple order as the sh side: `KIT_ROOT` → `roles/orchestrator.md` → `roles/_role-switch-protocol.md` → `workflows/` → `.grugops/factory.config.json` → `plans/board.md` → `plans/handoffs/`, with kit refs at `KIT_ROOT`, state refs repo-relative, and a dangling-symlink FAIL (`lstatSync().isSymbolicLink() && !existsSync`).
- Non-empty WARN tier (D-06/D-07, detect-only): marker `kitVersion` vs `$KIT_ROOT/VERSION` skew (read `head -n 1`-equivalent), and missing optional seed (`memory-bank/00-index.md`).
- Exit-code matrix proven (SC2): healthy→0, FAIL→nonzero, WARN-only→0, WARN+`--strict`→nonzero; uninstalled/dev checkout folds into FAIL via `notInstalled()` with the distinct `not installed` line, never a Node stack trace (fail-closed `JSON.parse` in try/catch).
- Read-only by construction (no mutation call; never names the deploy-approval env var — `grep -c` returns 0 non-comment occurrences), proven by a target snapshot equal across a double `--check`.

## Task Commits

Both tasks were committed atomically as one coherent unit (the early-exit branch references `doctor()`; splitting would leave an intermediate state where `node -c` could not validate the branch against a defined function — the same granularity choice the 09-01 sh side made):

1. **Task 1 (flags + non-mutating early-exit arm) + Task 2 (doctor() implementation)** - `36f3138` (feat)

**Plan metadata:** committed separately (this SUMMARY + STATE.md + ROADMAP.md).

## Files Created/Modified
- `install/install.mjs` - Added `--check`/`--strict` flags (usage block + arg loop), the `doctor()` function with `readMarker`/`readAdapterKit`/`kitReal`/`isDangling`/`notInstalled`/`docAbspath` helpers and `docReport`/`docFail`/`docWarn`, the non-mutating early-exit branch, and relocated `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` above the doctor (removing the later duplicate `const` block).

## Decisions Made
- **Combined-commit for Tasks 1+2:** the early-exit branch (`if (CHECK) { process.exit(doctor()); }`) and the `doctor()` definition are interdependent — committing Task 1 alone would reference an undefined function and an empty arm. Landed together as one `feat(09-03)` commit so every committed state is `node -c`-valid.
- **`docAbspath`, not `resolve()`, for the cross-check normalization:** install.sh's `abspath` returns an absolute path VERBATIM (it only prefixes cwd to relative paths — no `.`/`..` collapsing, no trailing-slash trim). A marker `kitRoot` of `…/agent-factory/.` therefore stays textually distinct on the sh side → cosmetic WARN. Node's `node:path` `resolve()` collapses it to equal → would emit `ok`, a parity break. `docAbspath` mirrors `abspath` exactly so the cosmetic-vs-divergent classification is byte-identical; existence/`kitReal` checks still use `join()` (which the shell resolves on the sh side too).
- **Sentinel relocation:** `MAT_OPEN`/`MAT_CLOSE`/`MAT_SLOT` were defined ~400 lines below the early-exit point, so `readAdapterKit` (called under `--check`) would have hit the TDZ for those `const`s. Moved them up to just before the doctor and removed the later duplicate declaration; `materializeAdapter` on the install path still uses the same definitions verbatim (verified install path idempotent + doctor-clean).

## Deviations from Plan

None — plan executed exactly as written. The combined commit (vs one commit per task) is a commit-granularity choice forced by the interdependence of the two tasks, not a scope deviation; all Task-1 and Task-2 actions and acceptance criteria were implemented exactly as specified.

The `docAbspath` helper is not a deviation from scope — the plan's action specifies "normalize via `abspath`" for the cross-check (Task 2, step 3), and `docAbspath` is the faithful Node implementation of the sh `abspath` the plan names. Using `resolve()` would have been the deviation (it over-normalizes and breaks the parity the plan's must-haves require).

## Issues Encountered
- **Cross-check cosmetic-vs-divergent parity break (caught + fixed during execution):** the first draft normalized the three cross-check sources with `node:path` `resolve()`. A test with marker `kitRoot = …/agent-factory/.` produced a Node `ok` (sources collapse to equal) where the sh doctor produced a cosmetic `WARN` (abspath leaves `/.` intact). Diagnosed as a `resolve()`-over-normalization parity break; introduced `docAbspath` (the non-normalizing sh-`abspath` twin) and re-proved byte-identical output on the cosmetic case and the full 12-case matrix.
- **`const` TDZ for the relocated sentinels:** the early-exit calls `readAdapterKit`, which reads `MAT_OPEN`/`MAT_CLOSE`; those `const`s lived far below the early-exit point and would be in the temporal dead zone at invocation. Resolved by relocating the three `MAT_*` definitions above the doctor (mirroring the 09-01 sh relocation) and deleting the duplicate.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- INSTALL-05 (Node side) complete: `install.mjs --check` is byte-parity with `install.sh --check` — same cross-check (D-03), same ordered first-failure (D-02/D-05), same WARN tier (D-06/D-07), same exit-code matrix (SC2), same "not installed" fold-into-FAIL.
- The sh↔Node doctor parity (same pass/fail + same first-failure path) and the three-way resolution-parity assertion (sh doctor = Node doctor = Node validator) are codified as committed checks in Plan 04 (wave 3) — this plan proves the contract ad-hoc; Plan 04 freezes it in `install.test.sh`/`validate.test.sh`.
- All three existing regression harnesses remain GREEN and untouched: `install.test.sh`, `install.two-root.test.sh` (sh/Node install byte-parity), `check-kit-refs.sh`; the install path is byte-idempotent and doctor-clean after the MAT_* relocation.

## Self-Check: PASSED

- FOUND: `.planning/phases/09-doctor-two-root-validator/09-03-SUMMARY.md`
- FOUND: commit `36f3138` (feat(09-03): add install.mjs --check doctor)
- FOUND: `install/install.mjs` in HEAD

---
*Phase: 09-doctor-two-root-validator*
*Completed: 2026-06-08*
