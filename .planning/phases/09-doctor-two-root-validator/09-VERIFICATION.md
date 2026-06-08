---
phase: 09-doctor-two-root-validator
verified: 2026-06-08T13:15:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "Exit-code matrix holds identically for sh and Node doctors (SC2 parity) — CR-01 closed: trailing-slash, ./. and /../ GRUGOPS_HOME all normalize to the same KIT_ROOT as the Node oracle"
    - "sh and Node doctors produce the SAME first-failure line for the same target and env (byte-parity contract, SC4) — CR-02 closed: garbled marker (fully unparseable AND surviving-kitRoot-line variants) both fold into the byte-identical not-installed FAIL"
    - "The validator's fail-closed invariant holds — null-literal JSON becomes a greppable finding, never an unhandled TypeError — CR-03 closed: null/non-object guard in checkConfig and checkPackaging"
  gaps_remaining: []
  regressions: []
---

# Phase 9: Doctor + Two-Root Validator Verification Report (Re-verification)

**Phase Goal:** Ship the verification layer — the `--check` doctor (sh + Node) that resolves and stats every referenced path and names the FIRST unresolved path with its referencing file, and the two-root-aware validator that refuses to false-green in the dev checkout or with `$GRUGOPS_HOME` unset. The validator must match the doctor's resolution rule so the two can never disagree about where the kit is.
**Verified:** 2026-06-08T13:15:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (09-05 closed CR-01 + CR-02; 09-06 closed CR-03)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `install.sh --check` AND `install.mjs --check` verify every referenced path resolves, name the FIRST unresolved path with its referencing file, and use exit codes 0 pass / nonzero FAIL | VERIFIED | install.test.sh Checks 7-12 all PASS (rc=0). Check 8 confirmed missing kit → nonzero with path + referencing file named. Check 9 confirmed deterministic first-failure ordering. |
| 2 | Exit-code matrix holds IDENTICALLY for sh and Node doctors: pass=0, FAIL=nonzero, WARN=0, `--check --strict` promotes WARN to nonzero | VERIFIED | Check 10 PASS (pass=0, FAIL=1, WARN=0, WARN+strict=1). Checks 14/16/17 all PASS: trailing-slash, `/./`, and `/../` GRUGOPS_HOME under `--strict` each yield identical rc (both 0) from sh and Node doctors. The previous CR-01 gap (sh rc=1, Node rc=0 for non-normalized GRUGOPS_HOME) is confirmed closed. |
| 3 | The validator is two-root aware — explicit KIT_ROOT and STATE_ROOT, NO silent fallback to `.` — so it cannot false-green in the dev checkout or with `$GRUGOPS_HOME`/`VALIDATE_KIT_ROOT` unset | VERIFIED | `VALIDATE_KIT_ROOT` unset → `process.exit(1)` with `(C3)` message confirmed live in validate.test.sh. BAD missing-kit check passes. All 18 validate.test.sh checks (including SPLIT section) green. |
| 4 | Doctor and validator resolve the kit home identically so they can NEVER disagree; a BAD fixture for missing/unset kit MUST fail; sh and Node produce byte-identical first-failure lines for every divergent input | VERIFIED | Three-way parity check PASS (sh doctor = Node doctor = Node validator, same resolved kit dir). Checks 15/18 confirm garbled-marker (fully unparseable AND surviving-kitRoot-line) fold into byte-identical not-installed FAIL on both sides. The previous CR-02 false-green (sh rc=0, Node rc=1 for garbled-with-kitRoot-line marker) is confirmed closed. |
| 5 | The validator's fail-closed invariant holds — every read/JSON.parse becomes a greppable finding, never an unhandled throw — and validate.test.sh has null-literal regression cases for both factory.config.json and plugin.json | VERIFIED | validate.test.sh section (g) PASS: null-literal factory.config.json → finding not TypeError (rc!=0, "not a JSON object" present, no "TypeError"). null-literal plugin.json → same. CR-03 confirmed closed: `cfg === null` / `manifest === null` guards present in checkConfig (line 296) and checkPackaging (line 386) of validate-agent-factory.mjs. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/install.sh` | `resolve_grugops_home` normalizes trailing/double/dot/dotdot slashes lexically (no `cd && pwd`); `doctor()` folds absent OR structurally-invalid OR empty-kitRoot marker into byte-identical not-installed FAIL | VERIFIED | `resolve_grugops_home` at lines 95-137: `sed 's://*:/:g'` collapse + `case */)` strip + awk `.`/`..` collapse. `marker_structurally_valid` at lines 212-245. Not-installed gate at line 298: `[ ! -f ] || ! marker_structurally_valid || [ -z _mk_kitroot ]`. All three substantive and wired into `doctor()`. |
| `install/install.mjs` | Node byte-parity `--check` doctor (the oracle) — must NOT have been modified by gap closure | VERIFIED | `git log --oneline -- install/install.mjs` shows no commits in the gap-closure range. Last commit `36f3138 feat(09-03)`. Oracle untouched. `notInstalled()` message at line 231 matches sh line 299 byte-for-byte. |
| `scripts/validate-agent-factory.mjs` | Two-root aware: VALIDATE_KIT_ROOT (no default, C3 guard) + STATE_ROOT; null/non-object guard in checkConfig and checkPackaging after JSON.parse | VERIFIED | C3 guard at lines 49-54. KIT_ROOT/STATE_ROOT split confirmed. Null guard at line 296 (checkConfig) and line 386 (checkPackaging): `cfg === null \|\| typeof cfg !== "object" \|\| Array.isArray(cfg)`. Both emit `${rel}: not a JSON object` and return before deref. |
| `install/install.test.sh` | Checks 1-18 covering doctor surface, parity gates (including trailing-slash, dot/dotdot, garbled-marker, garbled-with-surviving-kitRoot-line), and hermetic regression | VERIFIED | 18 checks all PASS. Checks 14-15 (original parity gates) PASS. Checks 16-17 (dot/dotdot class) PASS. Check 18 (garbled-with-surviving-kitRoot-line, the previously-invisible false-green) PASS including happy-path guard. |
| `scripts/validate.test.sh` | Includes section (g): null-literal factory.config.json + null-literal plugin.json assert finding + nonzero + no TypeError | VERIFIED | Section (g) at lines 239-283. Both (g.1) and (g.2) PASS. All 18 validate.test.sh checks green including the null-literal regression gates. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `install.sh resolve_grugops_home` | `install.mjs resolve(GRUGOPS_HOME)` | Lexical slash-collapse (`sed`+`case`+`awk`) + no `cd && pwd` | VERIFIED | Checks 14/16/17 each drive both doctors with a non-normalized GRUGOPS_HOME under `--strict` and confirm identical rc (both 0). |
| `install.sh doctor() not-installed gate` | `install.mjs readMarker()/notInstalled()` | `marker_structurally_valid` structural gate + extractability test; folds on absent OR malformed OR empty-kitRoot | VERIFIED | Checks 15/18 confirm byte-identical first-failure line ("not installed in") for both fully-unparseable and surviving-kitRoot-line garbled markers. |
| `validate-agent-factory.mjs checkConfig` | `cfg[key]` deref | `null/non-object guard` at line 296 | VERIFIED | validate.test.sh (g.1): null-literal config → "not a JSON object" finding, no TypeError. |
| `validate-agent-factory.mjs checkPackaging` | `manifest.name` deref | `null/non-object guard` at line 386 | VERIFIED | validate.test.sh (g.2): null-literal plugin.json → "not a JSON object" finding, no TypeError. |
| `validate-agent-factory.mjs KIT_ROOT` | `VALIDATE_KIT_ROOT` env (no default) | C3 unset guard at lines 49-54 | VERIFIED | validate.test.sh SPLIT bad-unset-kit PASS: exits 1 with "(C3)" message. |

### Data-Flow Trace (Level 4)

Not applicable — these are CLI tools and a validator script, not UI components with data-flow rendering.

### Behavioral Spot-Checks

All spot-checks were run live; no results are claimed from SUMMARY.md narration.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full install test suite (18 checks) | `sh install/install.test.sh` | ALL CHECKS PASSED (exit 0) | PASS |
| Full validator test suite (18 checks) | `sh scripts/validate.test.sh` | ALL CHECKS PASSED (exit 0) | PASS |
| Two-root integration harness (12 checks) | `sh install/install.two-root.test.sh` | ALL CHECKS PASSED (exit 0) | PASS |
| Kit-ref grep gate | `sh scripts/check-kit-refs.sh` | ALL CHECKS PASSED (exit 0) | PASS |
| Trailing-slash GRUGOPS_HOME + --strict → identical rc | Check 14 (inside install.test.sh) | sh rc=0, mjs rc=0 (both pass) | PASS |
| /./ GRUGOPS_HOME + --strict → identical rc | Check 16 | sh rc=0, mjs rc=0 | PASS |
| /../ GRUGOPS_HOME + --strict → identical rc | Check 17 | sh rc=0, mjs rc=0 | PASS |
| Garbled marker (no kitRoot line) → byte-identical first-failure line | Check 15 | sh/mjs rc=1, same "not installed in" first-failure | PASS |
| Garbled marker (surviving kitRoot line) → sh no longer false-greens | Check 18 | sh rc=1 (was rc=0 false-green), mjs rc=1, byte-identical first-failure | PASS |
| Valid marker still passes on both sides (no over-rejection) | Check 18 happy-path guard | sh rc=0, mjs rc=0, ALL CHECKS PASSED | PASS |
| null-literal factory.config.json → finding not TypeError | validate.test.sh (g.1) | rc!=0, "not a JSON object" present, no TypeError | PASS |
| null-literal plugin.json → finding not TypeError | validate.test.sh (g.2) | rc!=0, "not a JSON object" present, no TypeError | PASS |

### Probe Execution

No `scripts/tests/probe-*.sh` files declared or present for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INSTALL-05 | 09-01-PLAN, 09-03-PLAN, 09-04-PLAN, 09-05-PLAN | `install.sh --check` AND `install.mjs --check` verify paths, name first failure, use correct exit codes; parity must hold for all input normalizations | SATISFIED | install.test.sh 18/18 checks PASS. REQUIREMENTS.md marks Complete. Core functionality verified empirically. Parity contract holds for all previously-failing inputs (trailing-slash, dot, dotdot, garbled, garbled-with-surviving-kitRoot). |
| VAL-02 | 09-02-PLAN, 09-04-PLAN, 09-06-PLAN | Validator two-root aware, no `.` fallback, BAD fixture must fail, fail-closed invariant holds | SATISFIED | validate.test.sh 18/18 checks PASS. REQUIREMENTS.md marks Complete. C3 guard verified live. null-literal crash path closed by null/non-object guard in checkConfig and checkPackaging. |

### Anti-Patterns Found

No TBD/FIXME/XXX/PLACEHOLDER markers found in the gap-closure modified files. No unhandled throw paths identified. No stub patterns. The `marker_structurally_valid` function includes a documented comment on its LIMITS (flat all-string objects only; no jq dependency) — this is an intentional design choice with documented scope, not a debt marker.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

### Human Verification Required

None identified — all success criteria are mechanically verifiable and verified above with empirical test execution.

## Re-verification: Gap Closure Confirmed

All three blockers from the initial verification (2026-06-08T07:40:48Z) are confirmed closed:

**CR-01 (closed by 09-05 f4ba884 + remediation f4ba884):** `resolve_grugops_home` now performs a two-step purely-lexical normalization: (1) `sed 's://*:/:g'` collapses repeated slashes + `case */)`strips trailing slash; (2) awk collapses `.` and `..` segments without `cd && pwd` (safe on a not-yet-existent home). Checks 14, 16, 17 all PASS, confirming the entire parity CLASS is closed, not just the originally-reported trailing-slash case.

**CR-02 (closed by 09-05 f4ba884 + remediation f4ba884):** The doctor's not-installed gate now applies `marker_structurally_valid` — a pragmatic pure-POSIX structural validator (no jq) that accepts only the flat all-string JSON object `write_marker` emits and rejects: trailing garbage after a value, a missing brace, duplicate brace, empty object, and a missing comma. Combined with the prior `[ ! -f ]` and `[ -z _mk_kitroot ]` tests, absent/malformed/empty-kitRoot markers all fold into the byte-identical not-installed FAIL. Check 15 confirms the fully-unparseable case; Check 18 confirms the previously-invisible surviving-kitRoot-line false-green is also closed.

**CR-03 (closed by 09-06 26b5bd5):** `checkConfig` and `checkPackaging` both guard against a null/array/primitive JSON.parse result before dereferencing. The guard predicate `cfg === null || typeof cfg !== "object" || Array.isArray(cfg)` emits `${rel}: not a JSON object` and returns, preventing the TypeError. validate.test.sh section (g) confirms both null-literal cases yield a finding and a nonzero exit with no stack trace.

---

_Verified: 2026-06-08T13:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after gap closure: 09-05 (CR-01 + CR-02) and 09-06 (CR-03)_
