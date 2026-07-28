---
phase: 10-sdlc-coverage-audit-foundation-guards
fixed_at: 2026-06-09T00:00:00Z
review_path: .planning/phases/10-sdlc-coverage-audit-foundation-guards/10-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-06-09T00:00:00Z
**Source review:** .planning/phases/10-sdlc-coverage-audit-foundation-guards/10-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, CR-02, WR-01, WR-02 — Critical + Warning; the lone Info finding IN-01 is out of `critical_warning` scope and was not attempted)
- Fixed: 4
- Skipped: 0

All four in-scope findings were fixed AND proven by the test harnesses. Each fix not only patches the source but adds a fail-red assertion that plants the exact violation the review described and asserts the guard/validator now fails red on it. The full SC-2 phase-goal gap ("the four foundation guards each fail red on violation and never fabricate a pass") is closed and demonstrated GREEN by all four verification commands.

## Fixed Issues

### CR-01: `guard_agents_bytes` / `guard_adapter_size` silently PASS when their input file is absent

**Files modified:** `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`
**Commit:** 1bf3141
**Applied fix:** Added an explicit `[ ! -f … ]` existence guard at the top of both `guard_agents_bytes` (returns after `fail`) and the `guard_adapter_size` loop body (`fail … ; continue`), so a deleted/missing input now fails red naming the path instead of the macOS-sh vacuous-PASS (empty `wc -c <` byte count → both numeric tests false → spurious `pass`). Proved by reproducing the original vacuous PASS in `/tmp` first, then adding two new fail-red harness cases — `agents-missing` (removes the mirrored `AGENTS.md`, asserts nonzero + `AGENTS.md missing`) and `adapter-missing` (removes a mirrored adapter, asserts nonzero + `grugops-orchestrator.md missing`). The existing harness only planted oversize (mutated-file) violations; it now also plants a missing-file violation per affected guard.

### CR-02: `guard_voice` hard-aborts via `set -eu` when a voice file is absent

**Files modified:** `scripts/check-foundation-guards.sh`, `scripts/check-foundation-guards.test.sh`
**Commit:** a627f38
**Applied fix:** Added a `[ ! -f "$f" ]` existence guard before the `body=$(awk … "$f")` command substitution inside the `guard_voice` loop; a missing file now appends a structured `$f: required voice file missing` finding to `voice_fail` and `continue`s, instead of letting `awk`'s non-zero "can't open file" exit abort the whole script under `set -eu`. Manually verified the fixed guard now reaches the `== Result ==` section, prints `1 CHECK(S) FAILED`, names the missing file, and exits 1 cleanly (no raw awk error). Proved by a new `voice-missing` harness case (removes the mirrored `compliance-officer.md`, asserts nonzero + the role path as a structured fail).

### WR-01: `production_requires_human_confirmation=true` was documented as immutable but never mechanically enforced

**Files modified:** `scripts/validate-agent-factory.mjs`, `scripts/validate.test.sh`
**Commit:** 9f4dedc
**Applied fix:** Added a presence-guarded safety-floor check to `checkConfig()`, mirroring the TINT-03 carve-out pattern: an ABSENT key stays the lean `true` default (preserving SC4 zero-config), but an explicit `production_requires_human_confirmation !== true` is an `err()` (always nonzero, even bare) — the mechanical form of the no-agent-deploy rule. Proved by a new harness case `(h.2b)` that builds a hermetic kit with `production_requires_human_confirmation: false` and asserts the validator fails red naming the key. Confirmed the real-tree config (which carries `true`) and the `fixtures/good` config (which omits the key) both stay GREEN, so SC4 absent-keys still passes.

### WR-02: Parity-check failure in `validate.test.sh` reported "resolution drift" when the real cause was a silenced install failure

**Files modified:** `scripts/validate.test.sh`
**Commit:** d8dcba0
**Applied fix:** Replaced the `… install.sh --yes … || true` install invocation (which swallowed any failure) with the `_install_out=$(…) && _install_rc=0 || _install_rc=$?` capture idiom, then surfaced an install failure as its OWN finding (`parity: install.sh --yes failed (rc=…: …)`) BEFORE the kit-path comparison. The three-way doctor/validator parity comparison now runs only inside the install-success `else` branch, so a failed install no longer mis-blames a path disagreement. Verified the parity check still passes GREEN when the install succeeds (the normal path).

## Notes

- All fixes kept the guards read-only, POSIX-sh, stdlib-only, with no new dependencies. The config-JSON byte-identity (`cmp -s`) invariant is preserved (both harnesses still assert it GREEN).
- The two source-file findings (CR-01, CR-02) modify the same two files; they were committed atomically per-finding by materializing each finding's state sequentially (an initial mixed commit was reset and rebuilt so each commit contains only its finding's hunks).
- Final verification (all GREEN, exit 0):
  - `sh scripts/check-foundation-guards.sh` → ALL CHECKS PASSED
  - `sh scripts/check-foundation-guards.test.sh` → ALL CHECKS PASSED
  - `VALIDATE_KIT_ROOT="$(git rev-parse --show-toplevel)" node scripts/validate-agent-factory.mjs` → ALL CHECKS PASSED
  - `sh scripts/validate.test.sh` → ALL CHECKS PASSED
- Out of scope: IN-01 (`guard_voice` awk strips all content after an unfenced `## Caveman prompt`) is an Info-tier latent risk and was not attempted under the `critical_warning` fix scope.

---

_Fixed: 2026-06-09T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
