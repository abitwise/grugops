---
phase: 08-two-root-installer
verified: 2026-06-07T00:00:00Z
status: passed
score: 5/5
overrides_applied: 0
---

# Phase 08: Two-Root Installer Verification Report

**Phase Goal:** Make the installer fix all three dogfood pains — kit never arrives, wrong target,
symlink fragility — by resolving `${GRUGOPS_HOME:-$HOME/.grugops}`, copying the read-only kit
there, materializing the resolved absolute kit path into each standalone adapter, and seeding
per-repo state into the target without clobbering user content. install.sh + install.mjs land
together (byte-parity is an existing contract).

**Verified:** 2026-06-07
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running install.sh/install.mjs `--target <repo>` from any CWD lays the kit under `${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory` and writes the resolved absolute kit path into the target's two resolver adapters — target resolves the orchestrator with no path error, no hunting | VERIFIED | Behavioral spot-check confirmed: hermetic install produced `KIT="/tmp/.../home/agent-factory"` in both `grugops-orchestrator.md` and `grugops/SKILL.md`; two-root harness [1] (kit copy) and [2] (materialization) PASS |
| 2 | Installer accepts `--target <repo>` + interactive confirm prompt; `--yes`/non-TTY bypass installs unattended (CI) without blocking | VERIFIED | Two-root harness [8] (`--target` from arbitrary CWD) and [9] (`--yes`/`/dev/null` stdin) both PASS; `install.sh:99-109` implements precedence flag > env > prompt; `install.mjs:115-123` mirrors it |
| 3 | Installer seeds per-repo state into the target — `.grugops/factory.config.json` from kit default, install marker/kit-version stamp under `.grugops/`, `plans/` skeleton incl. `plans/handoffs/` — skip-if-exists, never overwrite/delete user content | VERIFIED | Two-root harness [3] (seed presence), [4] (never-clobber sentinel), [6] (DRY_RUN neither root mutated) all PASS; `seed_state()` in install.sh:403-423 and `seedState()` in install.mjs:414-432 walk `$KIT_ROOT/seed/**` skip-if-exists; `plans/handoffs` explicitly `mkdirp`'d (Pitfall 4) |
| 4 | Default install mode is COPY (symlink opt-in only); additive/idempotent/`DRY_RUN=1`/reversible contract preserved end-to-end across both roots | VERIFIED | `INSTALL_MODE=${INSTALL_MODE:-copy}` (install.sh:70); `const INSTALL_MODE = ARG_SYMLINK ? "symlink" : ... \|\| "copy"` (install.mjs:80); two-root harness [5] (double-install zero diff both roots), [6] (DRY_RUN), [7] (no symlinks after default install), [11] (uninstall reversal) all PASS; `install.test.sh` ALL CHECKS PASSED |
| 5 | `install.mjs` stays byte-parity with `install.sh` (same kit root, same seeded target tree, same marker bytes) and resolves Windows home via `os.homedir()` not `$HOME` | VERIFIED | Two-root harness [12] (sh/Node identical target tree + marker bytes) PASS; `homedir()` from `node:os` used at install.mjs:90; `install.test.sh` Check 4 (parity) PASS |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/install.sh` | Two-root POSIX installer: home-resolve, `copy_kit`, materialize adapters, `seed_state`, install marker, `--target`/`--yes`/prompt, D-07 guard, copy-default | VERIFIED | 535 lines; `GRUGOPS_HOME` resolved via `:-` colon form; `copy_kit`, `materialize_adapter`, `seed_state`, `write_marker` all implemented; `sh -n` parses cleanly |
| `install/install.mjs` | Byte-parity Node twin (`os.homedir()` home resolution, POSIX-normalized materialized path) | VERIFIED | 524 lines; `homedir` imported from `node:os`; `toPosix()` normalization applied; `node --check` passes |
| `install/uninstall.sh` | Two-root reversal: marker + adapters removed; shared kit and seeded state protected | VERIFIED | `is_protected()` guards `.grugops/*`; `remove_marker()` narrow exception; no `rm.*GRUGOPS_HOME` pattern present |
| `install/README.md` | Docs for `--target`/`--yes`/copy-default/`$GRUGOPS_HOME`/self-checkout guard | VERIFIED | All six required terms present; `--check` and `purge-kit` absent (no fabricated features) |
| `scripts/check-kit-refs.sh` | Seed excluded from SCAN/GH_SCAN; exits 0 | VERIFIED | D-03 comment present; seed not in SCAN/GH_SCAN lists; `sh scripts/check-kit-refs.sh` exit 0 confirmed |
| `install/install.two-root.test.sh` | Phase-8 POSIX harness, two-root contract, hermetic | VERIFIED | 18/18 assertions PASS; all source-grep checks satisfied |
| `agent-factory/seed/.grugops/factory.config.json` | Byte-identical seed copy of kit default | VERIFIED | `cmp -s` vs `agent-factory/config/factory.config.json` passes |
| `agent-factory/seed/plans/board.md` + full seed tree | Bundled state-plane seed | VERIFIED | All four `plans/*.md`, all nine `memory-bank/**`, five `.gitkeep` dirs present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `install/install.sh` | `$GRUGOPS_HOME/agent-factory` | `copy_kit` atomic tmp→rename | VERIFIED | `copy_kit()` at line 308: builds in `$GRUGOPS_HOME/.agent-factory.tmp.$$`, moves existing aside, renames new → `KIT_ROOT`; confirmed by two-root harness [1] |
| `install/install.sh` | `.claude/agents/grugops-orchestrator.md` + `.claude/skills/grugops/SKILL.md` | `materialize_adapter` strip-then-inject | VERIFIED | Lines 499-500; awk pass strips prior block, injects `KIT="$KIT_ROOT"` above slot; harness [2] confirms resolved absolute path in both adapters |
| `install/install.sh` | `$TARGET/.grugops` + `plans/**` + `memory-bank/**` | `seed_state` from `$KIT_ROOT/seed/**`, skip-if-exists | VERIFIED | Lines 403-423; walks `$KIT_ROOT/seed/**`, skip-if-exists per file, explicit `plans/handoffs` mkdirp; harness [3] and [4] confirm |
| `install/install.mjs` | `install/install.sh` | Byte-parity twin — same kit root, seeded tree, marker bytes | VERIFIED | Identical logic across `copyKit`, `materializeAdapter`, `seedState`, `writeMarker`; harness [12] zero-diff parity PASS |
| `install/uninstall.sh` | `$TARGET/.grugops/install.json` | `remove_marker()` narrow named exception; `.grugops/` broadly protected | VERIFIED | `is_protected()` at line 96-107 includes `.grugops/*`; `remove_marker()` at line 280-292 removes only the one named file; harness [11] confirms |

---

## Data-Flow Trace (Level 4)

Not applicable — this phase produces CLI scripts, not UI components rendering dynamic data. Behavioral spot-checks and the harness suite cover data-flow correctness instead.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Install lays kit under `$GRUGOPS_HOME`, materializes adapters, seeds state | Hermetic `GRUGOPS_HOME=$WORK/home ... install.sh --target $WORK/app --yes` | Kit at `$WORK/home/agent-factory`; `KIT="$WORK/home/agent-factory"` in both adapters; `.grugops/install.json` with 4 stable fields; `plans/handoffs/` present | PASS |
| All 18 two-root harness assertions | `sh install/install.two-root.test.sh` | ALL CHECKS PASSED (18/18) | PASS |
| Frozen single-root harness | `sh install/install.test.sh` | ALL CHECKS PASSED (7 checks) | PASS |
| Kit-ref build gate | `sh scripts/check-kit-refs.sh` | ALL CHECKS PASSED (4 assertions) | PASS |

---

## Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| `install/install.two-root.test.sh` | `sh install/install.two-root.test.sh` | Exit 0, ALL CHECKS PASSED | PASS |
| `install/install.test.sh` | `sh install/install.test.sh` | Exit 0, ALL CHECKS PASSED | PASS |
| `scripts/check-kit-refs.sh` | `sh scripts/check-kit-refs.sh` | Exit 0, ALL CHECKS PASSED | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INSTALL-03 | Plans 02, 03, 04 | `install.sh`/`install.mjs` accept `--target <repo>` + interactive prompt + `--yes`/non-TTY bypass; runs from any CWD | SATISFIED | Harness [8] `--target` from arbitrary CWD PASS; harness [9] `--yes`/non-TTY PASS; `install.sh:49-58` arg parsing; `REQUIREMENTS.md` status: Complete |
| INSTALL-04 | Plans 01, 02, 03, 04 | Seed per-repo state (skip-if-exists); copy-default; idempotent/additive/DRY_RUN/reversible; `install.mjs` byte-parity; `os.homedir()` | SATISFIED | Harness [1]–[7] and [11]–[12] all PASS; `os.homedir()` confirmed; `REQUIREMENTS.md` status: Complete |

No orphaned requirements — INSTALL-05 and VAL-02 are explicitly Phase 9 (Pending).

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-factory/seed/plans/board.md` | 13, 56 | References `agent-factory/config/factory.config.json#wip_limits` instead of `.grugops/factory.config.json` | Info (IN-02 from review, out of scope) | Points a user reading their board at the kit-internal path rather than their runtime per-repo dial; no functional breakage since the seed is excluded from check-kit-refs.sh (D-03) and the files are byte-identical; accepted as out-of-scope at the fix boundary |
| `install/install.sh` | 435, 437 | `head -n 1` without `tr -d '\r'` strips trailing CR from VERSION | Info (IN-01 from review, out of scope) | If `agent-factory/VERSION` has CRLF line endings (Windows `autocrlf`), the marker `kitVersion` would embed `0.1.0\r`; committed VERSION is LF; both installers stay consistent with each other so byte-parity holds; accepted as out-of-scope at the fix boundary |

No `TBD`, `FIXME`, or `XXX` markers found in any phase-modified file. No placeholders or stubs. No unresolved debt markers.

**IN-01 and IN-02 assessment:** Both are informational findings documented in the review (08-REVIEW.md) and explicitly left unfixed with `fix_scope: critical_warning` in 08-REVIEW-FIX.md. Neither blocks the phase goal:
- IN-01: The committed `agent-factory/VERSION` is LF; impact is hypothetical (only on Windows with `autocrlf`); both installers remain parity-consistent with each other; no behavioral failure in any harness.
- IN-02: The seed board is excluded from the kit-ref gate by design (D-03); the seed `.grugops/factory.config.json` and `agent-factory/config/factory.config.json` are byte-identical; the incorrect path is a UX confuser but does not cause any runtime failure. Neither finding blocks the phase goal.

---

## Human Verification Required

None. All success criteria are mechanically verifiable and all three behavioral harnesses pass. The phase goal — making the installer fix the three dogfood pains — is observable and confirmed by the spot-check and harness results.

---

## Gaps Summary

None. All five success criteria are VERIFIED. Both requirements (INSTALL-03, INSTALL-04) are SATISFIED. All three behavioral harnesses pass (install.test.sh, install.two-root.test.sh, check-kit-refs.sh). The two info findings (IN-01, IN-02) are explicitly out of scope at the fix boundary and do not block the goal.

---

_Verified: 2026-06-07_
_Verifier: Claude (gsd-verifier)_
