---
phase: 22-memory-trajectory-compaction-dialable-token-economy
verified: 2026-06-18T10:05:35Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Compaction never drops a load-bearing field — verified_by, failed-attempt, supersedes, and by/at provenance survive compaction; a RED test fails if any is dropped (CMP-02, SC2)"
    status: failed
    reason: "checkCarveOut() has three confirmed bypasses — all reproducible against the committed compactor.js. (1) CR-01: a field mutated from one non-empty value to another non-empty value is silently accepted (line 181: `rawVal !== '' && promVal === ''` only catches drop-to-empty, not mutation). Confirmed: verified_by mutated from §14-gate#SEED-001 to §14-gate#FORGED-999 returns exit 0, empty findings. (2) CR-02: a durable verified finding wholly deleted from the promoted set passes when ≥2 promoted notes remain (line 177 `continue`s on null counterpart; single-note fallback masks the bug only in the trivial 1-note case). Confirmed: raw={finding, FA-1}, promoted={FA-1, FA-2} returns exit 0, empty findings. (3) CR-03: with two same-kind notes, a dropped `by` on one note is masked by borrowing the intact sibling as the counterpart (findCounterpart line 210 returns sameKind[0] unconditionally when byMatch fails). Confirmed: raw={engineer-finding, reviewer-finding}, promoted strips reviewer's by — returns exit 0, empty findings. The test oracle (compactor.test.ts) exercises only the cooperative drop-to-empty path in a single-note set — the exact path that works — and stays green through all three bypasses. Zero negative test cases cover mutation, wholly-dropped-finding, or multi-same-kind scenarios."
    artifacts:
      - path: "scripts/compactor.ts"
        issue: "checkCarveOut() line 181: condition `rawVal !== '' && promVal === ''` must be `rawVal !== '' && rawVal !== promVal` to catch mutations. Line 177: `continue` on null counterpart silently ignores wholly-dropped durable verified findings — requires an affirmative check that every raw note carrying a non-empty verified_by has a matching entry in the promoted set. findCounterpart() line 210: returns sameKind[0] when multiple same-kind notes exist and byMatch fails — ambiguous counterpart selection masks a dropped field on one of N same-kind notes."
      - path: "scripts/compactor.js"
        issue: "Committed .js is byte-fresh vs the buggy .ts — the bugs are present in both."
      - path: "scripts/compactor.test.ts"
        issue: "WR-04 confirmed: no negative test cases for (a) field mutated to a different non-empty value, (b) verified finding wholly dropped with ≥2 promoted notes, (c) two same-kind notes where one drops a field, or (d) forged verified_by substitution. Oracle gives false confidence in the safety invariant."
    missing:
      - "Fix checkCarveOut() line 181: replace `promVal === ''` with `rawVal !== promVal` (inequality check, not empty check)."
      - "Fix checkCarveOut() line 177: build a set of raw notes with non-empty verified_by keyed by (kind, verified_by, by) and require each key to appear in the promoted set; do not continue-skip a null counterpart for provenance-bearing notes."
      - "Fix findCounterpart() lines 206-210: match counterparts 1:1 on stable identity (e.g. verified_by stamp or (kind, at)); never fall back to sameKind[0] when multiple candidates exist."
      - "Add RED test cases for CR-01 (mutated verified_by), CR-02 (wholly-dropped finding with 2+ promoted notes), CR-03 (two same-kind notes, one drops a field). Each must assert exit 1 AND name the fault — written RED against current .js first, then the fix turns them green."
      - "Rebuild compactor.js from fixed compactor.ts (npm run build) and commit the fresh .js."
      - "Fix the comment at compactor.ts line 177 to state the actual enforced policy after CR-02 is resolved (IN-01)."
deferred: []
behavior_unverified_items: []
human_verification: []
---

# Phase 22: Memory Trajectory Compaction — Verification Report

**Phase Goal:** Bound the multi-agent token tax with two-tier memory — verbose local trajectory stays in the agent's thread; only compact, re-verified distillations promote to the shared context.
**Verified:** 2026-06-18T10:05:35Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Verbose trajectory stays in `.grugops/context/threads/<agent>.md`; only compact distillation reaches shared context; promotion routes through `context-io.appendNote`; promoted finding is re-verified via `admit()` before write (CMP-01, SC1) | ✓ VERIFIED | `writeThread()` writes to `<contextRoot>/<task>/threads/<agent>.md` (compactor.ts lines 232-246). `promote()` is a direct pass-through to `appendNote` (lines 251-258). `reVerify()` is a direct pass-through to `admit()` (lines 263-269). Two-tier separation test (`compactor.test.ts` lines 272-354) verified experimentally: verbose body present in thread tier, absent from notes/. `**/.grugops/context/*/threads/` scoped in `.gitignore`; no blanket `.grugops/context/` ignore present. |
| 2 | Compaction never drops a load-bearing field — `verified_by`, `failed-attempt`, `supersedes`, and `by`/`at` provenance survive compaction; a RED test fails if any is dropped (CMP-02, SC2) | ✗ FAILED | Three confirmed bypasses in the committed `scripts/compactor.js`, each reproduced directly by invoking `checkCarveOut()` with constructed inputs: **CR-01** — `verified_by` mutated from `§14-gate#SEED-001` to `§14-gate#FORGED-999` returns `[]` (exit 0). Root cause: line 181 condition `rawVal !== "" && promVal === ""` detects only drop-to-empty, not mutation. **CR-02** — a durable verified `finding` wholly deleted from the promoted set passes when ≥2 notes remain. Root cause: line 177 `continue`-skips notes with no counterpart. **CR-03** — reviewer `finding` with `by` stripped passes when an engineer `finding` exists (same kind). Root cause: `findCounterpart` lines 206-210 falls back to `sameKind[0]` when `byMatch` fails, borrowing the intact sibling. The test oracle (`compactor.test.ts`) pins only the cooperative drop-to-empty path in a single-note set — the one path that works — and produces green results through all three bypasses (WR-04 confirmed). |
| 3 | `context.compaction: aggressive\|balanced\|retain-raw` dial changes how aggressively trajectories are distilled, defaults to `aggressive` when absent, and is documented across all three config surfaces (CMP-03, SC3) | ✓ VERIFIED | `context.compaction: "aggressive"` present in `agent-factory/config/factory.config.json` and `agent-factory/seed/.grugops/factory.config.json`; `diff` of the two files produces zero output (byte-twin, D-06). `agent-factory/config/factory.config.md` contains a `### context` sub-field section, a `context.compaction` row in the lean→enterprise dial-contract table, and the zero-config defaults paragraph updated to 9 keys listing `context.compaction` as defaulting to `aggressive` when absent. `readCompactionDial()` tested: no-file → `aggressive`, no-key → `aggressive`, explicit `retain-raw` → `retain-raw`. |
| 4 | A role following Workflow 18 (`18-context-compaction.md`) compacts by the single-source protocol, and other roles reference it rather than restating it (CMP-03, SC4) | ✓ VERIFIED | `agent-factory/workflows/18-context-compaction.md` exists with `order: 18`, `# Workflow: context compaction`, all required sections (`## When to use`, `## Steps`, `## Stop conditions`, `## Done condition`, `## Commit`). References both `16-context-read-write.md` and `05-pr-quality-gate.md` without restating their content. Ordinal preserved at 18 (not renumbered to 17). `grep -rln '18-context-compaction.md' agent-factory/roles/` returns exactly 17 files (all roles, excluding `_role-switch-protocol.md`). Catalog test asserts `toBe(18)` with `"context compaction"` in `WORKFLOW_NAMES`; `docs/catalog/README.md` contains the WF18 row; `freshness:catalog` passes. |

**Score:** 3/4 truths verified (0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/compactor.ts` | Deterministic carve-out invariant checker; imports context-io.js; never summarizes | ✗ STUB (logic flaw) | File exists, imports from `./context-io.js`, structure is correct. The `checkCarveOut()` function is substantively implemented but has three confirmed logic errors that render the carve-out invariant unenforceable for realistic inputs. See gaps. |
| `scripts/compactor.js` | Committed tsc output of compactor.ts (freshness-gated) | ✗ STUB (inherited) | Exists and byte-fresh vs compactor.ts (`npm run freshness` exits 0). The bugs in the .ts are faithfully compiled into the .js. |
| `scripts/compactor.test.ts` | RED-fixture-first vitest oracle: one drop case per carve-out element + GOOD + dial-invariance + re-verify | ✗ STUB (inadequate coverage) | File exists; 14 tests all pass. Test titles match the specified list. However the negative cases exercise only cooperative drop-to-empty in a single-note set — the one code path that works — providing false confidence (WR-04). Three adversarial paths (mutation, wholly-dropped-among-siblings, multi-same-kind) are entirely absent. |
| `agent-factory/config/factory.config.json` | context.compaction dial (lean default aggressive) | ✓ VERIFIED | `context.compaction: "aggressive"` present. |
| `agent-factory/seed/.grugops/factory.config.json` | Byte-twin of the config dial | ✓ VERIFIED | Byte-identical to the main config (diff: zero output). |
| `agent-factory/config/factory.config.md` | context sub-field reference + lean→enterprise dial-contract row + absent-default documentation | ✓ VERIFIED | All three documentation locations present and correct. |
| `.gitignore` | Ephemeral threads/ tier ignore scoped to `*/threads/` only | ✓ VERIFIED | `**/.grugops/context/*/threads/` present; no blanket `.grugops/context/` ignore. |
| `agent-factory/workflows/18-context-compaction.md` | Single-source compaction protocol; order:18; references WF16 + §14 gate | ✓ VERIFIED | All checks pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/compactor.ts` | `scripts/context-io.ts` | `import { appendNote, admit } from "./context-io.js"` | ✓ WIRED | Line 57 confirmed. `promote()` delegates to `appendNote`; `reVerify()` delegates to `admit()`. |
| `scripts/compactor.ts` | `scripts/freshness.ts` | `collectJs()` auto-globs `scripts/*.js` | ✓ WIRED | `freshness.ts` discovers `compactor.js`; `npm run freshness` exits 0. |
| `agent-factory/config/factory.config.json` | `agent-factory/seed/.grugops/factory.config.json` | Byte-twin invariant (D-06) | ✓ WIRED | `diff` produces zero output. |
| `agent-factory/roles/*.md` | `agent-factory/workflows/18-context-compaction.md` | One-line pointer per role | ✓ WIRED | 17/17 role files carry the pointer. |
| `agent-factory/workflows/18-context-compaction.md` | `agent-factory/workflows/16-context-read-write.md` | References WF16's admission rules | ✓ WIRED | `16-context-read-write.md` referenced in WF18 body; content not restated. |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces tooling scripts and configuration/documentation, not UI components that render dynamic data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CR-01: mutated `verified_by` (non-empty → different non-empty) is refused | `checkCarveOut(rawMap, mutatedMap)` where `verified_by` changes from `§14-gate#SEED-001` to `§14-gate#FORGED-999` | `[]` (exit 0) | ✗ FAIL — BYPASS CONFIRMED |
| CR-02: wholly-dropped durable verified finding with ≥2 promoted notes is refused | `checkCarveOut(raw={finding,FA-1}, promoted={FA-1,FA-2})` | `[]` (exit 0) | ✗ FAIL — BYPASS CONFIRMED |
| CR-03: two same-kind notes, one drops `by`, is refused | `checkCarveOut(raw={eng-finding,rev-finding}, promoted=rev strips by)` | `[]` (exit 0) | ✗ FAIL — BYPASS CONFIRMED |
| Cooperative drop-to-empty path (what the test suite actually pins) | `runCheck(thread, promoted, {finding: {verified_by: ""}})` | exit 1, names `verified_by` | ✓ PASS — but this is the only working path |
| Test suite green | `npx vitest run scripts/compactor.test.ts` | 14/14 passed | ✓ PASS (green for wrong reasons — suite does not cover the bypassed paths) |
| Compactor.js byte-fresh | `npm run freshness` | exit 0, 17 files fresh | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CMP-01 | 22-01-PLAN.md | Two-tier compaction: verbose trajectory stays in threads/; only compact distillations promote | ✓ SATISFIED | `writeThread()` and `promote()` implement the two-tier separation. Tests confirm verbose body absent from notes/. |
| CMP-02 | 22-01-PLAN.md | Load-bearing-field carve-out; RED test fails if any field dropped | ✗ BLOCKED | checkCarveOut() has three confirmed logic bypasses (mutation, wholly-dropped-finding, multi-same-kind). Test oracle pins only the one code path that works. The safety invariant is NOT enforced for adversarial inputs. |
| CMP-03 | 22-01-PLAN.md, 22-02-PLAN.md | context.compaction dial + WF18 single-source protocol | ✓ SATISFIED | Dial present in 3 config surfaces, byte-twin confirmed, defaults to aggressive. WF18 exists as single-source protocol, 17 role pointers present. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/compactor.ts` | 177 | Comment "a wholly-dropped durable note is the agent's call" directly contradicts the stated safety contract in the header (lines 18-19) | 🛑 BLOCKER | Operators reading the comment would believe the behavior is intentional; it enables a silent bypass of the carve-out for deletion of verified findings. |
| `scripts/compactor.ts` | 181 | `rawVal !== "" && promVal === ""` — only catches drop-to-empty, not mutation | 🛑 BLOCKER | Allows any load-bearing field to be mutated to a different value (including a forged stamp) without detection. |
| `scripts/compactor.ts` | 206-210 | `findCounterpart` falls back to `sameKind[0]` when `byMatch` fails and `sameKind.length > 1` | 🛑 BLOCKER | Ambiguous 1:N matching masks dropped fields on one of N same-kind notes. |
| `scripts/compactor.test.ts` | 135-269 | No test cases for field mutation, wholly-dropped findings with siblings, or multi-same-kind scenarios | 🛑 BLOCKER | The RED-first oracle gives false confidence in a safety-critical invariant; the suite stays green through all three confirmed bypasses. |

### Human Verification Required

None — all gaps are programmatically confirmed with code-level evidence.

### Gaps Summary

**Success Criterion 2 (CMP-02) is not met.** The `checkCarveOut()` function — the stated un-cheatable mechanical floor — has three independent code-level bypasses confirmed against the committed `scripts/compactor.js`:

**CR-01 (mutation bypass):** The condition at line 181 is `rawVal !== "" && promVal === ""`. It catches only drop-to-empty. Any mutation from one non-empty value to a different non-empty value passes silently — including forging a `verified_by` stamp from `§14-gate#SEED-001` to `§14-gate#FORGED-999`. Reproduction: `checkCarveOut(raw={verified_by: "§14-gate#SEED-001"}, promoted={verified_by: "§14-gate#FORGED-999"})` → `[]`.

**CR-02 (wholly-dropped durable finding bypass):** Line 177 `continue`-skips raw notes with no counterpart, with the comment "a wholly-dropped durable note is the agent's call." A verified `finding` carrying `verified_by: §14-gate#SEED-001` can be deleted entirely from the promoted set when ≥2 other notes exist. The `promoted.size === 1` fallback in `findCounterpart` accidentally catches the trivial single-note case — which is the only case the test exercises. Reproduction: `checkCarveOut(raw={finding,FA-1}, promoted={FA-1,FA-2})` → `[]`.

**CR-03 (multi-same-kind ambiguity bypass):** `findCounterpart` lines 209-210 returns `sameKind[0]` unconditionally when `byMatch` fails and `sameKind.length > 1`. A dropped `by` on one of two same-kind notes is compared against the intact sibling, masking the drop. Reproduction: two findings, one loses `by` → `checkCarveOut` returns `[]`.

**WR-04 (test oracle inadequacy):** All negative cases in `compactor.test.ts` drop a field to empty string in a single-durable-note set. This is the cooperative drop path that the current logic happens to handle. None of the adversarial cases (mutation, deletion, multi-same-kind) appear in the test suite. The suite will remain green through all three bypasses without any code changes.

SC1 (two-tier separation), SC3 (dial configuration), and SC4 (WF18 single-source protocol) are fully verified.

---

_Verified: 2026-06-18T10:05:35Z_
_Verifier: Claude (gsd-verifier)_
