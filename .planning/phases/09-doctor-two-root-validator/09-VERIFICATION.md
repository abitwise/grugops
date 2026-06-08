---
phase: 09-doctor-two-root-validator
verified: 2026-06-08T07:40:48Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Exit-code matrix holds identically for sh and Node doctors (SC2 parity)"
    status: failed
    reason: "CR-01 confirmed. With a trailing-slash GRUGOPS_HOME, sh doctor emits a cosmetic WARN (path //agent-factory != /agent-factory from marker) and under --strict exits 1; Node doctor's resolve() normalizes the slash away so it sees sources agree and exits 0. Same real install, same target, same flag — two different exit codes. SC2 parity is broken for any non-normalized GRUGOPS_HOME under --strict."
    artifacts:
      - path: "install/install.sh"
        issue: "resolve_grugops_home uses abspath() which does NOT strip trailing slashes; KIT_ROOT gets double-slash (e.g. /home/u/.grugops//agent-factory) which is textually != the single-slash marker/adapter value written at install time — triggers a spurious cosmetic WARN under --strict"
      - path: "install/install.mjs"
        issue: "GRUGOPS_HOME is computed via resolve(process.env.GRUGOPS_HOME) which normalizes trailing slashes — the two doctors diverge on the cross-check result for the same non-normalized input"
    missing:
      - "sh's resolve_grugops_home must normalize GRUGOPS_HOME the same way Node resolve() does — apply `cd -- \"$GRUGOPS_HOME\" && pwd` normalization before constructing KIT_ROOT, or apply abspath normalization that collapses trailing slashes"
      - "A parity test in install.test.sh Check 13 (or a new check) that drives both doctors with a trailing-slash GRUGOPS_HOME under --strict and asserts identical rc"

  - truth: "sh and Node doctors produce the SAME first-failure line for the same target and env (byte-parity contract, SC4)"
    status: failed
    reason: "CR-02 confirmed. When .grugops/install.json is present but contains invalid JSON (e.g. garbled bytes), Node doctor's readMarker() (try/catch JSON.parse) returns null → falls into the not-installed branch → prints 'grugops not installed in <target>'. sh doctor's read_marker_field only checks [ ! -f ], so it passes the not-installed gate, then reads empty fields, and the cross-check fires 'kit-root sources DISAGREE ... marker=<unset>'. Both exit 1 but the first-failure lines are completely different. This breaks the byte-parity contract that Check 13 is supposed to enforce — Check 13 only induces a missing-kit FAIL, never a garbled-marker FAIL."
    artifacts:
      - path: "install/install.sh"
        issue: "The not-installed gate at line 186 only checks [ ! -f \"$_marker\" ] — a present-but-unparseable marker passes the gate; read_marker_field returns empty string; cross-check treats empty b/c as divergent and emits a different FAIL line than the Node doctor"
      - path: "install/install.test.sh"
        issue: "Check 13 (parity check) only exercises a missing-kit FAIL (rm -rf $GRUGOPS_HOME/agent-factory); it never exercises a garbled-marker FAIL, so the parity breakage is invisible to the test suite"
    missing:
      - "sh doctor must treat a present-but-garbled marker the same as an absent one: after the [ ! -f ] check, add a JSON-validity gate (e.g. attempt to read kitRoot; if empty, fold into the not-installed FAIL with the SAME message Node emits)"
      - "Check 13 in install.test.sh must be extended with a garbled-marker parity sub-case that corrupts .grugops/install.json and asserts identical rc AND first-failure line from both doctors"

  - truth: "The validator's fail-closed invariant holds — every read/JSON.parse becomes a finding, never an unhandled throw (documented header promise)"
    status: failed
    reason: "CR-03 confirmed. JSON.parse('null') is valid JSON returning null (no throw), so the try/catch passes silently. Then cfg[key] with cfg===null crashes with TypeError: Cannot read properties of null (reading 'mode') in checkConfig, and manifest.name with manifest===null crashes the same way in checkPackaging. Reproduced end-to-end: a factory.config.json containing the literal 'null' produces a Node stack trace instead of the documented 'not valid JSON' finding. The file header states 'every read/JSON.parse is wrapped in try/catch so a missing or garbled file becomes a finding, never an unhandled throw' — that invariant is violated."
    artifacts:
      - path: "scripts/validate-agent-factory.mjs"
        issue: "checkConfig (line 292): after JSON.parse succeeds, cfg can be null (from 'null' literal); the for-loop dereferences cfg[key] without a null guard — uncaught TypeError crashes the validator"
      - path: "scripts/validate-agent-factory.mjs"
        issue: "checkPackaging (line 375): after JSON.parse succeeds, manifest can be null (from 'null' literal); manifest.name dereference crashes — despite a comment at line 362 claiming the fail-closed guard is complete"
    missing:
      - "checkConfig: after JSON.parse(raw), add: if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) { err(`${rel}: not a JSON object`); return; }"
      - "checkPackaging: after JSON.parse(raw), add: if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) { err(`${rel}: not a JSON object`); return; }"
      - "validate.test.sh: add null-literal fixture cases for both factory.config.json and plugin.json that assert the validator emits a finding (not a stack trace)"
---

# Phase 9: Doctor + Two-Root Validator Verification Report

**Phase Goal:** Ship the verification layer — the `--check` doctor (sh + Node) that resolves and stats every referenced path and names the FIRST unresolved path with its referencing file, and the two-root-aware validator that refuses to false-green in the dev checkout or with `$GRUGOPS_HOME` unset. The validator must match the doctor's resolution rule so the two can never disagree about where the kit is.
**Verified:** 2026-06-08T07:40:48Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `install.sh --check` AND `install.mjs --check` verify every referenced path resolves, name the FIRST unresolved path with its referencing file, and use exit codes 0 pass / nonzero FAIL | VERIFIED | Both doctors implement the deterministic ordered stat set; Check 7-9 in install.test.sh pass (all 13 checks green). Both name path + referencing file on FAIL. |
| 2 | Exit-code matrix holds IDENTICALLY for sh and Node doctors: pass→0, FAIL→nonzero, WARN→0, `--check --strict`→nonzero on WARN | FAILED (CR-01) | With a trailing-slash `GRUGOPS_HOME` and `--strict`: sh exits 1 (spurious WARN from double-slash path), Node exits 0 (resolve() normalizes). Exit-code parity broken for non-normalized inputs. Independently confirmed — not just review claim. |
| 3 | The validator is two-root aware — explicit KIT_ROOT and STATE_ROOT, NO silent fallback to `.` — so it cannot false-green in the dev checkout or with `$GRUGOPS_HOME`/`VALIDATE_KIT_ROOT` unset | VERIFIED | `VALIDATE_KIT_ROOT` unset → `process.exit(1)` with `(C3)` message confirmed live. BAD missing-kit check passes. validate.test.sh 16/16 checks green. |
| 4 | A BAD fixture for missing/unset kit root MUST fail the validator AND doctor and validator resolve the kit home identically so they can NEVER disagree | PARTIAL/FAILED (CR-01, CR-02) | BAD unset-kit fixture passes (C3 guard works). But doctor-validator resolution parity only proven for normalized inputs: CR-01 shows sh and Node doctors can disagree on the cross-check result for non-normalized `GRUGOPS_HOME`, breaking the "can never disagree" guarantee. CR-02 shows sh and Node produce different first-failure lines for a garbled marker. |
| 5 | `install.test.sh` is updated for the split with idempotency, dry-run, reversibility preserved and doctor passes on good split / fails loudly on missing kit | VERIFIED | install.test.sh extended with Checks 7-13 (doctor surface). All 13 checks pass. Good-split → exit 0, missing-kit → nonzero naming agent-factory. Original Checks 1-6 preserved and passing. |

**Score:** 3/5 truths fully verified; 2/5 failed (CR-01 parity under non-normalized input; CR-02 garbled-marker first-failure divergence; plus CR-03 fail-closed invariant violated in validator)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install/install.sh` | `--check` doctor arm: non-mutating early-exit, three-source cross-check, ordered first-failure, WARN tier | VERIFIED | doctor(), read_marker_field, read_adapter_kit, kit_real helpers present and wired. Branching before run banner confirmed at line 295. |
| `install/install.mjs` | Node byte-parity `--check` doctor | VERIFIED (with gap) | doctor(), readMarker, readAdapterKit, isDangling, docAbspath present. Parity broken for non-normalized GRUGOPS_HOME per CR-01. |
| `scripts/validate-agent-factory.mjs` | Two-root aware: VALIDATE_KIT_ROOT (no default) + STATE_ROOT, forked helpers | VERIFIED (with gap) | KIT_ROOT/STATE_ROOT split confirmed. C3 guard fires on unset. Fail-closed invariant VIOLATED for null-literal JSON per CR-03. |
| `install/install.test.sh` | SC5 doctor checks (good-split, missing-kit, exit-code matrix, dangling-symlink, read-only, sh/Node parity) | VERIFIED (with gap) | Checks 7-13 present, all pass. Gap: Check 13 only exercises missing-kit FAIL, never garbled-marker FAIL (per CR-02). |
| `scripts/validate.test.sh` | Two-root validator checks (GOOD split, BAD missing-kit, BAD unset-kit C3, three-way parity) | VERIFIED | All 16 checks green. Two-root split, missing-kit, unset-kit (C3), and three-way parity all pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `install.sh doctor()` | `resolve_grugops_home` | source (a) of D-03 cross-check | VERIFIED | `_a="$KIT_ROOT"` uses the already-resolved `KIT_ROOT` at line 196 |
| `install.sh doctor()` | `.grugops/install.json` | `read_marker_field` reads `kitRoot`/`kitVersion` (source b) | VERIFIED | grep/sed-based read, test-before-read fail-closed |
| `install.sh doctor()` | `.claude/agents/grugops-orchestrator.md KIT=` | `read_adapter_kit` parses `grugops:materialized-kit` sentinel block (source c) | VERIFIED | awk pass with op/cl neutral names present |
| `install.mjs doctor()` | `KIT_ROOT` (os.homedir+toPosix) | source (a) of D-03 | VERIFIED | `const a = KIT_ROOT` at line 264 |
| `install.mjs doctor()` | `.grugops/install.json` | `readMarker()` try/catch JSON.parse (source b) | VERIFIED | Fail-closed, garbled → null → not-installed path |
| `validate-agent-factory.mjs KIT_ROOT` | `VALIDATE_KIT_ROOT` env (no default) | unset guard at line 49 with `process.exit(1)` | VERIFIED | C3 guard confirmed live |
| `validate-agent-factory.mjs` kit checks | `KIT_ROOT/agent-factory/roles/orchestrator.md` | `kitExists`/`kitRead`/`kitListDir` join against KIT_ROOT | VERIFIED | All kit checks route through kit* helpers |

### Data-Flow Trace (Level 4)

Not applicable — these are CLI tools and validator scripts, not UI components with data-flow rendering.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Good split → doctor exits 0 | `sh install/install.test.sh` Check 7 | PASS | PASS |
| Missing kit → doctor exits 1 | `sh install/install.test.sh` Check 8 | PASS | PASS |
| Exit-code matrix (pass/FAIL/WARN/WARN+strict) | `sh install/install.test.sh` Check 10 | PASS (normalized inputs only) | PARTIAL |
| sh/Node parity on normalized missing-kit | `sh install/install.test.sh` Check 13 | PASS | PASS |
| sh/Node parity with trailing-slash GRUGOPS_HOME + --strict | Manual probe | sh rc=1, mjs rc=0 (diverge) | FAIL |
| Unset VALIDATE_KIT_ROOT → C3 error | `sh scripts/validate.test.sh` unset-kit check | PASS | PASS |
| null-literal factory.config.json → finding (not crash) | Manual probe | TypeError: Cannot read properties of null | FAIL |
| null-literal plugin.json → finding (not crash) | Manual probe | TypeError: Cannot read properties of null | FAIL |
| Garbled marker → same first-failure line in sh and Node | Manual probe | Different FAIL lines (sh=disagree, mjs=not-installed) | FAIL |

### Probe Execution

No `scripts/tests/probe-*.sh` files declared or present for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INSTALL-05 | 09-01-PLAN.md, 09-03-PLAN.md, 09-04-PLAN.md | `install.sh --check` AND `install.mjs --check` verify paths, name first failure, use correct exit codes | PARTIAL | Core functionality implemented and tested. Parity contract broken under non-normalized inputs (CR-01) and garbled markers (CR-02). |
| VAL-02 | 09-02-PLAN.md, 09-04-PLAN.md | Validator two-root aware, no `.` fallback, BAD fixture must fail | PARTIAL | Two-root split and C3 guard work correctly. Fail-closed invariant violated for null-literal JSON (CR-03). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/validate-agent-factory.mjs` | 292-295 | `cfg[key]` accessed after JSON.parse with no null guard — `JSON.parse("null")` = `null`, not caught by try/catch, crashes at runtime | BLOCKER | Uncaught TypeError with stack trace instead of documented finding; remaining checks are skipped; fail-closed invariant violated |
| `scripts/validate-agent-factory.mjs` | 375 | `manifest.name` accessed after JSON.parse with no null guard — same null-literal crash path | BLOCKER | Uncaught TypeError in checkPackaging; fail-closed invariant violated for plugin.json |
| `install/install.sh` | 96-98 | `KIT_ROOT="$GRUGOPS_HOME/agent-factory"` with non-normalized GRUGOPS_HOME (abspath does not strip trailing slash) → double-slash path that textually != marker/adapter value | BLOCKER | Exit-code parity broken with Node doctor under --strict for any non-normalized $GRUGOPS_HOME |
| `install/install.sh` | 186 | `[ ! -f "$_marker" ]` not-installed gate only checks file existence, not parseability | BLOCKER | Garbled-present marker bypasses the not-installed branch; sh and Node produce different first-failure lines for same input, breaking the parity contract |
| `install/install.test.sh` | 403-420 | Check 13 only induces a missing-kit FAIL, never a garbled-marker FAIL | WARNING | The parity gate is incomplete; CR-01 and CR-02 are invisible to the committed test suite |

### Human Verification Required

None identified — all remaining issues are mechanically verifiable and verified above.

## Gaps Summary

Three blockers prevent full goal achievement. The central phase contract — **sh and Node doctors agree byte-for-byte on exit code and first-failure line** — is broken in two reproducible ways that the committed test suite cannot catch (it only exercises normalized inputs and a missing-kit FAIL). The validator's stated fail-closed invariant is violated by a valid-but-null JSON parse result.

**Gap 1 (CR-01) — Exit-code parity broken under non-normalized GRUGOPS_HOME with --strict:**
The sh doctor's `resolve_grugops_home` does not normalize trailing slashes; a `GRUGOPS_HOME` ending in `/` produces `KIT_ROOT=…//agent-factory` (double slash). The marker was written with a single slash. The sh cross-check sees them as textually different → WARN. Under `--strict`, WARN → exit 1. Node's `resolve()` normalizes the trailing slash → paths match → exit 0. Same target, same flag, different exit codes. This breaks SC2 (exit-code matrix identical for sh and Node) and SC4 (doctor and validator can never disagree).

**Gap 2 (CR-02) — Garbled-marker first-failure line diverges between sh and Node:**
Node's `readMarker()` wraps `JSON.parse` in try/catch; a garbled marker returns `null` → `notInstalled()` → "grugops not installed in …". The sh `read_marker_field` only checks `[ ! -f ]`; a present-but-unparseable marker passes that gate, the cross-check sees an empty `_b`, and emits "kit-root sources DISAGREE … marker=<unset>". Both exit 1 but the first-failure lines are completely different — which is exactly what Check 13's parity assertion is supposed to prevent. Check 13 never exercises this path.

**Gap 3 (CR-03) — Validator crashes with uncaught TypeError on null-literal JSON:**
`JSON.parse("null")` is valid ECMAScript, returns `null`, does NOT throw. The `try/catch` blocks in `checkConfig` and `checkPackaging` therefore succeed, assigning `null` to `cfg`/`manifest`. The subsequent property accesses (`cfg[key]`, `manifest.name`) then crash with `TypeError: Cannot read properties of null`. The validator produces a Node stack trace instead of the documented greppable finding, and every check after the crashing one is skipped. The file header explicitly promises "every read/JSON.parse is wrapped in try/catch so a missing or garbled file becomes a finding, never an unhandled throw" — that promise is broken.

**Root cause grouping:** Gaps 1 and 2 share a root cause: the sh doctor's marker-parsing and home-normalization are not fully symmetric with the Node doctor. Gap 3 is an independent null-deref omission in the validator. All three were correctly identified by the code review (09-REVIEW.md) and independently confirmed against the live scripts.

---

_Verified: 2026-06-08T07:40:48Z_
_Verifier: Claude (gsd-verifier)_
