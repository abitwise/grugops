---
phase: 9
slug: doctor-two-root-validator
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-08
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 09-RESEARCH.md § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | POSIX `sh` harness (`pass()/fail()/FAILS`, `mktemp -d` + `trap … EXIT` cleanup, content-addressed `snapshot()`) for the installer/doctor; the **same** sh harness drives the Node validator via `VALIDATE_KIT_ROOT` / `VALIDATE_ROOT` env. No test runner, no `package.json` (VAL-01). |
| **Config file** | none — bare `sh script.test.sh` and bare `node scripts/validate-agent-factory.mjs` |
| **Quick run command** | `sh install/install.test.sh` · `sh scripts/validate.test.sh` |
| **Full suite command** | `sh install/install.test.sh && sh install/install.two-root.test.sh && sh scripts/validate.test.sh && sh scripts/check-kit-refs.sh` |
| **Estimated runtime** | ~15–40 seconds |

**Hard constraints:**
- The doctor is a **read-only early-exit arm** — `--check` must NEVER call `copy_kit` / `materialize` / `seed` / `write_marker`. Test additions must not mutate the repo: use `mktemp -d` fixtures with `trap … EXIT` cleanup, as every existing harness does.
- `install/install.two-root.test.sh` (GREEN 18/18) and `scripts/check-kit-refs.sh` (Phase-7 grep-to-zero gate) **stay separate and stay GREEN** (D-09) — no coupling, no absorption.
- The validator's **kit root has NO default** — this is the deliberate C3 guard; unset `VALIDATE_KIT_ROOT` is an error, never a `.`-fallback.

---

## Sampling Rate

- **After every task commit:** the directly-affected quick run — `sh install/install.test.sh` for doctor work; `sh scripts/validate.test.sh` for validator work.
- **After every plan wave:** the full suite (all four scripts above) green.
- **Before `/gsd-verify-work`:** full suite green **plus** the three-way resolution-parity assertion (sh doctor = Node doctor = Node validator agree on the resolved kit root) green; `git status` clean in the grugops checkout (proves `--check` mutated nothing).
- **Max feedback latency:** ~40 seconds

---

## Per-Task Verification Map

> Task IDs are assigned by the planner; this maps each Success Criterion / requirement to its automated proof. Plan/Wave columns are filled by execute-phase.

| Req / SC | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| SC1 / INSTALL-05 | Doctor names the FIRST unresolved path + referencing file (deterministic across runs) | sh integration | `sh install/install.test.sh` (new doctor checks) | ❌ W0 | ⬜ pending |
| SC1 (D-05) | Dangling / escaping symlink → FAIL (never followed) | sh integration | `sh install/install.test.sh` | ❌ W0 | ⬜ pending |
| SC2 / INSTALL-05 | Exit-code matrix: pass=0, FAIL≠0, WARN→0, `--check --strict`→≠0 | sh integration | `sh install/install.test.sh` (assert `rc` per case) | ❌ W0 | ⬜ pending |
| SC3 / VAL-02 | Validator splits KIT_ROOT/STATE_ROOT; no `.`-fallback | node via sh | `sh scripts/validate.test.sh` (new fixtures) | ⚠️ extend | ⬜ pending |
| SC4 (C3) | BAD missing-kit fixture FAILS; unset-kit errors (no default) | node via sh | `sh scripts/validate.test.sh` (`expect_fail`) | ❌ W0 | ⬜ pending |
| SC4 (D-03/D-04) | Doctor's 3 sources cross-checked; doctor + validator resolve kit root identically | sh + node parity | new parity check (`install.test.sh` / `validate.test.sh`) | ❌ W0 | ⬜ pending |
| SC5 | Good split → doctor passes; missing kit → doctor fails loudly; idempotency / dry-run / reversibility preserved | sh integration | `sh install/install.test.sh` | ❌ W0 | ⬜ pending |
| regression | Deep two-root behaviors still GREEN | sh integration | `sh install/install.two-root.test.sh` | ✅ keep | ⬜ pending |
| regression | Phase-7 grep-to-zero gate still GREEN, stays separate (D-09) | sh grep | `sh scripts/check-kit-refs.sh` | ✅ keep | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Validation Dimensions (the matrix this phase must cover)

| Dimension | Cases to sample |
|-----------|-----------------|
| Exit code | (1) healthy install → 0; (2) FAIL → nonzero; (3) WARN-only → 0; (4) WARN + `--strict` → nonzero |
| First-failure determinism (SC1) | Same broken target, two runs → identical first-failure line; resolution order is a fixed ordered tuple list so "first" is stable |
| Three-source cross-check (D-03) | (a) all three agree → pass; (b) cosmetic-equivalent path diff → WARN; (c) true divergence / one unresolvable → FAIL |
| sh↔Node doctor parity | Same target + env → `install.sh --check` and `install.mjs --check` agree on pass/fail AND the named first-failure path (skip-with-note if `node` absent) |
| C3 must-fail (SC4) | (a) `VALIDATE_KIT_ROOT`→nonexistent dir → FAIL; (b) `VALIDATE_KIT_ROOT` unset → error (no `.`-default); (c) doctor on dev checkout (no marker) → distinct "not installed" message + nonzero |
| install.test.sh split (SC5) | good split → doctor passes; `rm -rf $GRUGOPS_HOME/agent-factory` → doctor fails loudly naming the missing kit; double-`--check` is read-only (snapshot unchanged) |
| Resolution agreement (SC4/D-04) | sh doctor, Node doctor, Node validator all report the same resolved kit root for the same `GRUGOPS_HOME` |

---

## Wave 0 Requirements

- [ ] New doctor checks in `install/install.test.sh` — cover SC1 / SC2 / SC5 + dangling-symlink + the exit-code matrix.
- [ ] New fixtures under `scripts/fixtures/` (or harness-local `mktemp -d`) — a GOOD split (separate kit + state roots), a BAD missing-kit (`VALIDATE_KIT_ROOT`→absent dir), a BAD unset-kit; wire `expect_fail` / `expect_pass` in `scripts/validate.test.sh`.
- [ ] A resolution-parity check asserting sh doctor + Node doctor + Node validator agree on the kit root (new check; mirror `install.two-root.test.sh` Check 12 shape).
- [ ] No framework install needed — `sh` + `node` already present; no `package.json`.

*Existing infrastructure (`install.two-root.test.sh`, `check-kit-refs.sh`) covers regression; no Wave 0 work there beyond not breaking them.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| sh↔Node doctor parity on a Windows host | SC4 / parity | `os.homedir()` resolution differs on Windows; CI here is darwin/POSIX | On a Windows checkout: run `node install/install.mjs --check` against a known-good split; confirm same pass/fail + first-failure path as POSIX |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (new doctor checks, fixtures, parity check)
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
