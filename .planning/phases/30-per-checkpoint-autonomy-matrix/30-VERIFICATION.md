---
phase: 30-per-checkpoint-autonomy-matrix
verified: 2026-09-06T16:11:54Z
status: passed
score: 5/5 roadmap success criteria structurally verified; 2 material residuals require human sign-off
behavior_unverified: 0
overrides_applied: 0
behavior_unverified_items: []
human_verification:

  - test: "Decide whether Phase 30 may be marked done in ROADMAP.md given red-team surface A's fence (not close). Independently reproduced: `git push -fu origin feature` (combined short flag `-fu`) is ALLOWED by the committed `hooks/guard.js` at HEAD, with zero grant keys of any kind, against a control `git push --force origin feature` that correctly DENIES. This is one of six documented zero-key, executed bypasses of `protected_branch_merge` (V-30-11-16, -17, -18, -19, -20, -25) recorded in `docs/audit/30-redteam-surface-a.md` and already reflected as an explicit scope note under AUTO-03 in `.planning/REQUIREMENTS.md`."
    expected: "A human decides: (a) accept the fence as final for this milestone (matching the 2026-09-06 fence decision already recorded in `deferred-items.md`) and proceed, or (b) require a dedicated follow-up phase/plan to close the command-model bypasses (`V-30-11-16`..`-20`, `-25`) before relying on `protected_branch_merge=block` as an operative guarantee against an unauthorized `main` force-push."
    why_human: "This is a policy/risk-acceptance decision (D-59-style 'content, not mechanism'), not a fact a script can settle. The disclosure is confirmed accurate by independent reproduction; whether it is *acceptable* to ship is a human call."
  - test: "Decide whether `checkpoints.open_pr` needs an actual enforcement point (a hook rule intercepting `gh pr create` or equivalent) before Phase 30 is considered to have delivered dialable control over 'the four current safety floors.'"
    expected: "Either (a) confirm this is an accepted, permanent design position (open_pr remains documentary-only, matching its pre-Phase-30 status under the retired `autonomy` scalar, and the phase's job was only to unify its declaration/disclosure — not to newly gate it), and record that decision in `agent-factory/config/factory.config.md` / `docs/GUARANTEES.md` / REQUIREMENTS.md so a future reader does not assume it is enforced; or (b) open a follow-up item to wire real enforcement, since `open_pr` is one of the four `SAFETY_FLOORS` this whole phase organizes around."
    why_human: "Not covered by any must_have in the 11 plans, not mentioned in REQUIREMENTS.md's AUTO-03 scope note (which only discusses the env-var channel and the protected-branch bypasses), and its only mention (`V-30-02-01`/`V-30-02-02` in `deferred-items.md`, flagged at plan 30-02) was never given a final disposition by a later plan. Verified by direct grep: `open_pr` never appears in `hooks/guard.ts` or `hooks/admission-guard.ts`, and plan 30-08's own roster-coverage table places it in the 'covered elsewhere' bucket whose only test is config-resolution correctness (`CHECKPOINT_DEFAULTS` matching), not action-level gating."
  - test: "Confirm whether the settings-file `env`-grant vector (`.claude/settings.local.json` `env` block reaching a hook subprocess) is an acceptable residual for `GRUGOPS_FLOOR_*` / `GRUGOPS_PROD_DEPLOY_APPROVED` / `GRUGOPS_ADMISSION_APPROVED_BY`, given it was OBSERVED (not merely inferred) to reach the hook process in round 2 of surface A."
    expected: "A human reviews `docs/GUARANTEES.md` §9 and decides whether the current disclosure (accepted, irreducible, narrowing measures not yet built) is sufficient, or whether a `permissions.deny` recommendation over `.claude/settings*.json` should be added before shipping."
    why_human: "This is a risk-acceptance call over a mechanism residual that a script cannot adjudicate; the guarantees document itself asks for exactly this human review (`UNKNOWN - verify: whether they land, and where`)."
---

# Phase 30: Per-Checkpoint Autonomy Matrix Verification Report

**Phase Goal:** A project decides where a human stops it, per checkpoint — including the four current
safety floors — and a lowered floor is never silent: it takes a second key an agent cannot set, it
shows up in the trace and in the run banner, and the public claim it backed is dropped.
**Verified:** 2026-09-06T16:11:54Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Method

This is not a document review. Every truth below was checked against the COMMITTED `.js` artifacts by
spawning `hooks/guard.js` as a real process with scrubbed environments and constructed stdin JSON, by
calling the compiled `scripts/context-io.js` / `scripts/checkpoints.js` directly, by mutating a
temp-copy `scripts/checkpoints.ts` and running `tsc --noEmit` to demonstrate the compile-error
property, by driving `scripts/validate-agent-factory.js` against fixture and mutated configs, and by
running the phase's own named test files plus one full-suite regression pass. Full command transcripts
are reproducible from the tool calls in this session; the key results are quoted inline below.

## Goal Achievement

### Observable Truths (roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every human stop is a member of one closed, exported checkpoint set; adding a checkpoint without a default is a compile error (AUTO-01) | VERIFIED | `scripts/checkpoints.ts` exports `CHECKPOINT_DEFAULTS` as `const satisfies Record<Checkpoint, Disposition>` (14 members). Independently reproduced the compile-error property: added `\| "verifier_probe_no_default"` to the `Checkpoint` union in an isolated copy of the tree (node_modules symlinked) and ran `./node_modules/.bin/tsc --noEmit` — result: `error TS1360: Type '{...}' does not satisfy the expected type 'Record<Checkpoint, Disposition>'` at the exact line, plus two downstream cascade errors. `scripts/checkpoints.test.ts` (147/147 passing) asserts the two-sided derivation (`assertRosterMatchesDerivation`) against the tag arm (workflow `## Stop conditions`), the floor arm (`SAFETY_FLOORS`), and the legacy arm (`LEGACY_AUTONOMY_GRADES`) — the D-01 amendment (role `## Hard limits` are documentary; tag corpus is workflows only) is documented in-line and matches `.planning/phases/.../30-CONTEXT.md`. |
| 2 | Per-checkpoint ternary matrix replaces `autonomy`; fail-closed on unknown/malformed/unreadable; two readers collapse into one (AUTO-02, AUTO-06) | VERIFIED | `canonicalizeDisposition()` recognizes exactly the three literal strings `"block"/"notify"/"off"` and returns `"block"` for every other input (wrong case, non-string, `null`, arrays) — read the source, no `default:` branch that could diverge. Confirmed `readGovernanceConfigResult` no longer exists anywhere in the tree (`grep -rn "readGovernanceConfigResult"` → zero non-test, zero test hits); only `readGovernanceConfig` is exported from `scripts/context-io.ts`. Empirically fed a malformed (`not json {{{`) config to the spawned `hooks/guard.js`: it printed `checkpoint config refused: the config file exists but could not be read or parsed — every checkpoint is enforced at \`block\`` and denied a matched `git push origin main`, with even the non-floor `commit_to_branch` reported at `block` (the `STRICTEST_MATRIX`, not the roster default) — confirming "unreadable" is deliberately stricter than "absent." |
| 3 | Lowering a safety floor requires two keys (config declaration + fresh per-floor session env var) (AUTO-03) | **PARTIALLY MET — see Human Verification #1** | The two-key MECHANISM itself is fully and correctly implemented and empirically verified: (a) `checkpoints.protected_branch_merge=off` + no `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE` → DENY, naming both the checkpoint and the missing env var; (b) same config + `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=alice` → ALLOW, banner reads `authorized by ...=alice`; (c) env var alone with config left at its `block` default → still DENY (env alone changes nothing); (d) `export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=me && git push origin main` is refused even when the variable is already present in the environment (self-set refusal). **However**, the floor this mechanism protects has known, unfixed, EXECUTED zero-key bypasses that never reach the two-key rule at all, because the command-model/pattern layer that decides "does this command touch the checkpoint" can be evaded. Independently reproduced: `git push -fu origin feature` (combined short flag) is silently ALLOWED by the committed `hooks/guard.js`, with **zero** grant keys, against a control `git push --force origin feature` that correctly denies. This matches documented finding `V-30-11-20` in `docs/audit/30-redteam-surface-a.md`, one of six such reproduced, executed bypasses (`V-30-11-16/17/18/19/20/25`) left as an explicit, human-fenced (not closed) backlog per D-22's four-round cap. `.planning/REQUIREMENTS.md` already carries an accurate scope note under AUTO-03 disclosing this — the disclosure MATCHES the artifact. |
| 4 | `test_integrity` enforced at the point of effect: `emitVerdict()` refuses GREEN; tier split stated explicitly (AUTO-04) | VERIFIED | Called the compiled `emitVerdict()` directly with 9 non-clean inputs (`"finding"`, `"unknown"`, `"CLEAN"`, `"clean "` (trailing space), `""`, `undefined`, `null`, `42`, `"clean\nfoo"`) against an empty context root: every call returned `null` and the directory listing stayed `[]` (zero files, zero partial writes) both before and after. A subsequent call with the exact string `"clean"` returned a real verdict id and wrote exactly one note file. The `emitVerdict` signature requires `integrity` as a positional, non-defaulted third argument (confirmed by reading the source), and its header comment states the hook-enforced-vs-in-process tier split explicitly. The CLI verb `node scripts/context-io.js emit-verdict <task> <id> clean [contextRoot]` was independently exercised and produced a real note. |
| 5 | Guarantees render + per-run banner name every non-default checkpoint; zero-config repo behaves exactly as today (AUTO-05, AUTO-07) | VERIFIED (with one disclosed and one under-disclosed residual — see Human Verification #2, #3) | `npm run freshness:guarantees` → "Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration." `npx vitest run scripts/autonomy-zero-config.test.ts` → 15/15 passing, a whole-run LINE-LEVEL diff (not substring) against a blob-pinned pre-Phase-30 `hooks/guard.js`, asserting zero removed lines and exactly one added line (the banner) across the full roster. Empirically confirmed the banner mechanism: default config → `all checkpoints at default`; `open_pr=notify` + grant → `checkpoints not at default: open_pr=notify authorized by GRUGOPS_FLOOR_OPEN_PR=alice`. `docs/GUARANTEES.md` honestly discloses the settings-file grant-injection vector as OBSERVED (not just inferred) in its residual section, and correctly avoids asserting the floor-grant mechanism is un-forgeable outright — it names the vector by which an agent that can write host settings files could reach it, satisfying the no-overclaim prohibition. **Gap**: `checkpoints.open_pr` — one of the four canonical `SAFETY_FLOORS` — has no runtime consumer anywhere (`grep` for `open_pr` in `hooks/guard.ts` / `hooks/admission-guard.ts` returns nothing); its resolution is correct and its banner/guarantee disclosure is accurate, but no command (e.g. `gh pr create`) is ever gated by it, so "lowering" it has no observable effect to hide or disclose. This condition pre-dates Phase 30 (the retired `autonomy` scalar's `pr` grade was equally undefended) so it is not a regression, but it is also not resolved by this phase despite being flagged early (`V-30-02-01`/`V-30-02-02`) and never given a final disposition. |

**Score:** 5/5 roadmap success criteria have their described MECHANISM built, wired, and empirically verified. 2 of the 5 (#3 and #5) carry a materially significant, independently-confirmed residual that requires a human decision before the phase can be called unconditionally complete.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/checkpoints.ts` / `.js` | roster, ternary vocabulary, resolution, banner | VERIFIED | Present, substantive (1769 lines), committed `.js` fresh (`npm run freshness` — 59/59 build outputs match a rebuild), 147/147 own tests pass |
| `hooks/guard.ts` / `.js` | two-key enforcement + banner + notes | VERIFIED (with the AUTO-03 residual above) | Present, wired into `hooks/hooks.json`, spawned and exercised directly against 8+ scenarios in this session |
| `hooks/admission-guard.ts` | per-name env grant model | VERIFIED | Grant vocabulary imported from `scripts/checkpoints.ts` (`NAMED_GRANT_ENV_VARS`), not restated |
| `scripts/context-io.ts` / `.js` | single reader, `emitVerdict` point-of-effect | VERIFIED | `readGovernanceConfigResult` deleted; `emitVerdict` tested directly, see truth #4 |
| `scripts/validate-agent-factory.ts` / `.js` | refuses `autonomy` present, `test_integrity: off`, unknown checkpoint/disposition | VERIFIED | Both refusals reproduced against mutated fixture configs, see below |
| `scripts/generate-guarantees.ts`, `scripts/guarantees-freshness.ts`, `docs/GUARANTEES.md` | generated, fixed-path, freshness-gated render | VERIFIED | `npm run freshness:guarantees` green |
| `agent-factory/config/factory.config.json` + seed twin | `checkpoints` object, `autonomy` retired | VERIFIED | `diff` between the two shows zero difference (byte-identical twins); `grep -c autonomy` → 0 in both |
| `docs/audit/30-redteam-surface-a.md`, `-surface-b.md` | red-team round logs, fence | VERIFIED PRESENT, FENCED NOT CLOSED | Both explicitly state "FENCED, NOT CLOSED" with a dated 2026-09-06 human decision; contents cross-checked against `deferred-items.md` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| config `checkpoints` object | `readGovernanceConfig` | JSON parse + per-key canonicalization | VERIFIED | Malformed-JSON probe above |
| `readGovernanceConfig` | `hooks/guard.ts` matrix lookup | `evaluateMatrix(matrix, process.env)` | VERIFIED | One evaluation feeds both banner and decision (read in source, D-19); confirmed no drift across 8 spawned scenarios |
| `hooks/guard.ts` | `GRUGOPS_FLOOR_<ID>` | fresh `process.env` read per invocation | VERIFIED | env-alone-changes-nothing probe above |
| `emitVerdict` argument | workflow 05's test-integrity exit code | 3-state (`clean`/`finding`/`unknown`) | VERIFIED | `agent-factory/workflows/05-pr-quality-gate.md` documents the exact CLI invocation; independently exercised |
| checkpoint matrix + registry safety rows | `docs/GUARANTEES.md` | `generate-guarantees.ts` join | VERIFIED | Freshness gate green |
| `checkpoints.open_pr` value | any Bash command decision | **none found** | **NOT WIRED** | See Human Verification #2 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Compile-error on defaultless roster member | isolated-copy `tsc --noEmit` | `error TS1360` at the exact line | PASS |
| Two-key deny (config off, no env) | spawned `hooks/guard.js`, `git push origin main` | DENY, names checkpoint + env var | PASS |
| Two-key allow (config off + env grant) | spawned `hooks/guard.js` | ALLOW, banner names grant | PASS |
| Env-alone no-op | spawned `hooks/guard.js`, config at default | still DENY (Phase-5 wording) | PASS |
| Self-set refusal (fresh var) | `export GRUGOPS_FLOOR_...=me && git push origin main` | REFUSED | PASS |
| Self-set refusal (var pre-existing) | same command, var already granted | REFUSED regardless | PASS |
| `emitVerdict` refuses 9 non-clean values | direct call against compiled `.js` | `null`, zero files written each time | PASS |
| `emitVerdict` accepts exactly `"clean"` | direct call | real id, one file written | PASS |
| Validator refuses present `autonomy` | mutated `good` fixture | exit 1, named error | PASS |
| Validator refuses `checkpoints.test_integrity: "off"` | mutated `good` fixture | exit 1, named TINT-03 error | PASS |
| Zero-config whole-run differential | `npx vitest run scripts/autonomy-zero-config.test.ts` | 15/15 passed | PASS |
| **Zero-key bypass reproduction (adversarial)** | `git push -fu origin feature` vs `hooks/guard.js` | **ALLOWED — zero keys** | **CONFIRMS DOCUMENTED FINDING V-30-11-20** |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| AUTO-01 | 30-01, 30-04, 30-05, 30-10 | Closed, derived checkpoint set; compile error on defaultless member | SATISFIED | See truth #1 |
| AUTO-02 | 30-01, 30-03, 30-06, 30-07, 30-10 | Ternary matrix, fail-closed | SATISFIED | See truth #2 |
| AUTO-03 | 30-01, 30-08, 30-11 | Two-key lowering | SATISFIED for the mechanism; **scope-noted residual** already recorded in `.planning/REQUIREMENTS.md` (six zero-key bypasses, fenced) — matches this verifier's independent reproduction | See truth #3, Human Verification #1 |
| AUTO-04 | 30-05, 30-11 | `test_integrity` point of effect | SATISFIED | See truth #4 |
| AUTO-05 | 30-02, 30-06, 30-07, 30-08, 30-09, 30-10 | Mechanical claim-dropping, guarantees render, banner | SATISFIED, with the `open_pr` enforcement gap noted | See truth #5, Human Verification #2 |
| AUTO-06 | 30-03, 30-10 | Single discriminated-result reader | SATISFIED | See truth #2 |
| AUTO-07 | 30-01, 30-06, 30-08, 30-10 | Zero-config parity | SATISFIED | 15/15 differential test |

No orphaned requirements: every `AUTO-*` id in `.planning/REQUIREMENTS.md`'s "AUTO — Per-Checkpoint Autonomy Matrix" section is claimed by at least one of the 11 plans' `requirements:` frontmatter.

### Anti-Patterns Found

None. Scanned `scripts/checkpoints.ts`, `hooks/guard.ts`, `hooks/admission-guard.ts`, `scripts/context-io.ts`, `scripts/generate-guarantees.ts`, `scripts/guarantees-freshness.ts`, `scripts/validate-agent-factory.ts` for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — zero hits.

### Regression Suite

`npx vitest run --exclude '**/scripts/e2e/**'` (single full run, not repeated): **1 failed | 3149 passed | 2 skipped**, matching the documented pre-existing baseline exactly — the one failure is `scripts/frontmatter.test.ts`'s D-49 false-red control on `.planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md`, recorded in `deferred-items.md` as `V-30-01-01`, verified there to be an ancestor-committed, out-of-scope document untouched by any Phase 30 commit. No new regressions.

### Human Verification Required

See frontmatter `human_verification` — three items, none of them a fact a script can settle:

1. Whether the six reproduced, executed, zero-key `protected_branch_merge` bypasses (fenced, not closed) are acceptable to ship, or need a follow-up phase.
2. Whether `checkpoints.open_pr` having zero runtime enforcement is an accepted permanent design position or an outstanding gap.
3. Whether the settings-file env-grant vector (observed reaching the hook process) needs a narrowing `permissions.deny` recommendation before shipping.

### Gaps Summary

No must-have artifact is missing, stub, or unwired in the sense that would block programmatically —
every mechanism the 11 plans committed to build (the roster, the ternary matrix, the two-key
resolution, the point-of-effect `test_integrity` refusal, the guarantees render, the banner, the
single reader) exists, is wired, and passed direct empirical probing against the committed `.js` in
this session. What keeps this phase out of a clean `passed` verdict is not missing work but two
**disclosed-but-unresolved residuals** on the safety-critical surface this phase exists to govern:

1. **Six documented, executed, zero-key bypasses of `protected_branch_merge`** remain live at HEAD
   (this verifier independently reproduced one: `git push -fu origin feature`). These are honestly
   surfaced in `docs/audit/30-redteam-surface-a.md` and in an explicit scope note under AUTO-03 in
   `.planning/REQUIREMENTS.md`, and a human already chose to fence rather than pursue a fifth
   round (forbidden by D-22). The disclosure matches the artifact. Whether the fence is *sufficient*
   for this milestone to close, versus warranting a dedicated follow-up phase given CLAUDE.md's
   explicit "hard" safety requirement that agents never merge a protected branch, is the human call
   this report escalates.
2. **`open_pr`, one of the four `SAFETY_FLOORS`, has no runtime enforcement point anywhere** — a
   pre-existing condition (not a Phase 30 regression) that was flagged during execution
   (`V-30-02-01`/`V-30-02-02`) and never given a final, explicit disposition. Its two-key
   MACHINERY, banner line, and guarantees-render disclosure all work correctly; only the actual
   gating of a `gh pr create`-shaped action is absent.

Neither residual is a fabricated finding or an untested claim — both were independently reproduced or
independently confirmed absent in this session against the committed artifacts.

---

_Verified: 2026-09-06T16:11:54Z_
_Verifier: Claude (gsd-verifier)_
