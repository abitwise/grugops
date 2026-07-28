---
phase: 16-14-gate-convergence-lint-ui-e2e-test-integrity
verified: 2026-06-14T14:37:00Z
status: passed
score: 4/4
overrides_applied: 0
human_verification_resolved:
  - test: "Confirm the Playwright version pin 1.60.0 (and @axe-core/playwright 4.11.3) are real published versions"
    resolution: "RESOLVED by orchestrator via `npm show` on 2026-06-14: @playwright/test@1.60.0 is the current LATEST STABLE (only newer entries are 1.61/1.62 alpha/beta pre-releases); @axe-core/playwright@4.11.3 is also the current latest stable. Both pins are valid — no softening needed."
    origin: "IN-04 from code review; flagged human_needed only because the verifier agent cannot make network calls"
---

# Phase 16: §14 Gate Convergence Verification Report

**Phase Goal:** Converge the BDD/UI/ASVS work into the single-source §14 quality gate — add lint, automated UI/E2E + visual regression, and an un-cheatable structured-justification test-integrity check to `05-pr-quality-gate.md` only, all config-dialed, preserving the bounded-self-fix contract and the three terminal results. The test-integrity checker is a cross-platform TypeScript routine on the Phase-15 foundation.
**Verified:** 2026-06-14T14:37:00Z
**Status:** passed (the single human-verification item — the Playwright/axe-core version pins — was resolved by the orchestrator via `npm show`; both pins are the current latest stable)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Lint is a first-class gate step backed by per-stack linter recommendations (ESLint 9 flat, Biome caveat, Ruff, golangci-lint), with strictness and autofix read from `quality.lint` | VERIFIED | `agent-factory/checklists/linter-recommendations.md` exists with all four stacks; `--max-warnings 0` strict and `--fix` autofix CLIs present (12+ grep matches). Gate (`05-pr-quality-gate.md` line 33) wires `quality.lint {strict, autofix}` with explicit behaviors and references the table by filename. `kind: checklist` frontmatter present. No §14 literal. No caveman voice. |
| 2 | Automated UI/E2E + visual-regression templated with full flake-resistance set and wired into the gate via `quality.ui_e2e` (off \| ui-or-critical-path \| always) | VERIFIED | `agent-factory/checklists/playwright-visual-regression-recipe.md` exists with `toHaveScreenshot`, `animations`, `mask`, `--update-snapshots`, fixed viewport, CI/Docker baseline guidance (9 grep matches for required terms). `agent-factory/checklists/accessibility-checklist.md` extended with `AxeBuilder`, `withTags`, `wcag22aa` (5 grep matches). Gate line 35 wires `quality.ui_e2e` and references both files by name. Fix-lane split (code/a11y = agent-fixable; visual-baseline = human-only) is explicit. |
| 3 | Gate blocks unjustified skipped tests; structured justification required; agent may not self-author; RED fixture where hollow justification fails proven | VERIFIED | `scripts/runnable-ref/test-skip-integrity.js` (committed): `node ... fixtures/hollow-test-skips.md --skip-count 1` exits 1 with "no real owner" finding (confirmed by direct execution). `node ... fixtures/clean-test-skips.md --skip-count 1` exits 0. `node ... fixtures/nope.md` exits 2. Vitest "hollow" case passes (`npx vitest run test-skip-integrity.test.ts -t "hollow"` — all 9 cases pass). Closed-list categories, expiry gate, and over-count all enforced. Gate prose wires test-integrity as always-human-only; exit 1 → BLOCKED_NEEDS_FIX, no self-fix attempt consumed. |
| 4 | Test-integrity not dialable off (warn \| block only); all steps inside bounded `self_fix_attempts` loop; three terminal results preserved; all gate changes single-source in `05-pr-quality-gate.md` | VERIFIED | `factory.config.md` line 68/96/109: `test_integrity` allowed values `warn`, `block` — **never `off`** (TINT-03 floor). Gate line 43: advisory mode emits loudly, does not hide. Three terminal results (`READY_FOR_HUMAN_REVIEW`, `BLOCKED_NEEDS_FIX`, `SPLIT_REQUIRED`) each appear 3+ times in gate. `self_fix_attempts` loop runs only for agent-fixable failures; human-only short-circuits without consuming budget (gate lines 40, 59-60). Workflow 14 (`14-ui-design-to-build.md`): 0 matches for toHaveScreenshot/axe-core/playwright/lint/test-integrity/linter-recommendations. Workflow 15: same 0. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/runnable-ref/test-skip-integrity.ts` | Test-integrity checker, node:builtins only, D-12 exit 0/1/2 contract | VERIFIED | 243 lines, imports only `node:fs`. No §14 literal. Substantive implementation with VALID_CATEGORIES set, PLACEHOLDER_OWNERS set, expiry parse, skip-count comparison. |
| `scripts/runnable-ref/test-skip-integrity.js` | Committed compiled output, freshness-policed | VERIFIED | Exists; `npm run freshness` confirms all 10 committed .js match fresh tsc rebuild (exit 0). |
| `scripts/runnable-ref/test-skip-integrity.test.ts` | Vitest harness — 9 cases including SC3 "hollow" keystone and host-emulation | VERIFIED | 135 lines; all 9 cases pass. Spawns committed .js (not .ts). Host-emulation case copies .js to bare tmpdir. |
| `scripts/runnable-ref/fixtures/hollow-test-skips.md` | RED fixture — placeholder owner ("agent") makes checker exit 1 | VERIFIED | Contains `| auth.login.rate-limit | ... | agent | ...`; confirmed exit 1 by direct node execution. |
| `scripts/runnable-ref/fixtures/clean-test-skips.md` | GREEN fixture — well-formed rows including flaky-quarantine, exit 0 | VERIFIED | Contains `flaky-quarantine` row with named owner; confirmed exit 0 by direct execution. |
| `scripts/runnable-ref/fixtures/expired-test-skips.md` | EXPIRED fixture — far-past expiry blocks even when counts balance | VERIFIED | Exists; Vitest expired case passes (exit 1 asserted). |
| `scripts/runnable-ref/fixtures/quarantine-test-skips.md` | QUARANTINE fixture — valid+unexpired flaky-quarantine exits 0 | VERIFIED | Exists; Vitest quarantine case passes (exit 0 asserted). |
| `install/install.ts` | Second RUNNABLES tuple materializing checker into tools/grugops/ | VERIFIED | `grep -c 'test-skip-integrity.js.*tools/grugops'` returns 1. Original `reference-check.js` tuple still present. |
| `agent-factory/workflows/05-pr-quality-gate.md` | Single-source gate with lint/ui_e2e/test-integrity wiring + D-08/D-09/D-10 | VERIFIED | Contains `tools/grugops/test-skip-integrity.js`, `--skip-count`, both checklist refs, `quality.lint {strict,autofix}`, `ui_e2e` dial, three terminal results, human-only short-circuit, advisory composition. §14 literal count = 0. |
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | toHaveScreenshot flake-resistance recipe | VERIFIED | Exists; `kind: checklist`; contains `toHaveScreenshot`, `animations`, `mask`, `--update-snapshots`, fixed viewport, CI/Docker guidance. No §14 literal. No caveman voice. |
| `agent-factory/checklists/linter-recommendations.md` | Per-stack linter table + strict/autofix CLI | VERIFIED | Exists; `kind: checklist`; all four stacks; `--max-warnings 0` and `--fix`; `UNKNOWN - verify` fallbacks; no §14 literal; no caveman voice. |
| `agent-factory/checklists/accessibility-checklist.md` | Extended with axe-core WCAG 2.2 AA bar | VERIFIED | Contains `AxeBuilder`, `withTags`, `wcag22aa` (5 grep matches). Extends in-place, existing manual checks preserved. |
| `agent-factory/checklists/00-index.md` | Registers both new checklists | VERIFIED | `grep -c -E 'linter-recommendations.md|playwright-visual-regression-recipe.md'` returns 2. |
| `AGENTS.md` | Test integrity skip-count slot under `### Test integrity` | VERIFIED | `grep -c 'Skip-count capture'` returns 1; under `### Test integrity` heading; `UNKNOWN - verify` default; per-runner examples in HTML comment; "never a silent 0" explicit. |
| `agent-factory/config/factory.config.md` | Clarifying dial→behavior prose, no new keys | VERIFIED | `test_integrity` row: `warn`, `block` — **never `off`** (TINT-03 floor) in lines 68, 96, 109. `gate_enforcement: advisory` composes with `test_integrity: block`, emits loudly. `skip_registry_path` count = 0. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `test-skip-integrity.test.ts` | `test-skip-integrity.js` | `spawnSync(node, [CHECK_JS, ...args])` | WIRED | `CHECK_JS = join(HERE, "test-skip-integrity.js")` — correct committed artifact path. |
| `install/install.ts` | `tools/grugops/test-skip-integrity.js` | RUNNABLES tuple → `materializeRunnable()` | WIRED | `grep -c 'test-skip-integrity.js.*tools/grugops' install/install.ts` = 1. |
| `05-pr-quality-gate.md` | `tools/grugops/test-skip-integrity.js` | `node` invocation in test-integrity step | WIRED | `grep -c 'tools/grugops/test-skip-integrity.js'` = 1. |
| `05-pr-quality-gate.md` | `agent-factory/checklists/playwright-visual-regression-recipe.md` | reference-by-filename (D-06) | WIRED | Present in UI/E2E step prose, line 35. |
| `05-pr-quality-gate.md` | `agent-factory/checklists/linter-recommendations.md` | reference-by-filename (D-06) | WIRED | Present in lint step prose, line 33. |
| `05-pr-quality-gate.md` | `AGENTS.md` skip-count slot | `--skip-count <N>` from Test integrity slot | WIRED | Gate invocation `--skip-count <N>` explicit (line 37); AGENTS.md slot provides the value. |
| `agent-factory/checklists/00-index.md` | `linter-recommendations.md` | index table row | WIRED | grep returns match. |
| `agent-factory/checklists/00-index.md` | `playwright-visual-regression-recipe.md` | index table row | WIRED | grep returns match. |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces workflow prose and a TypeScript runtime tool, not a component rendering dynamic data. The checker's data-flow is verified behaviorally: hollow fixture → exit 1 (confirmed by direct execution and Vitest harness).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Clean registry + valid skip count → exit 0, "No findings." | `node scripts/runnable-ref/test-skip-integrity.js fixtures/clean-test-skips.md --skip-count 1` | exit 0, stdout: "No findings." | PASS |
| Hollow registry (placeholder owner "agent") → exit 1 | `node scripts/runnable-ref/test-skip-integrity.js fixtures/hollow-test-skips.md --skip-count 1` | exit 1, stdout names "auth.login.rate-limit" and "no real owner" | PASS |
| Missing registry → exit 2 (not a false pass) | `node scripts/runnable-ref/test-skip-integrity.js fixtures/nope.md` | exit 2, stderr: "Error: cannot read the registry file" | PASS |
| SC3 keystone — Vitest hollow case | `npx vitest run test-skip-integrity.test.ts -t "hollow"` | exit 0 (test passes — hollow fixture correctly exits 1) | PASS |
| Full harness | `npx vitest run test-skip-integrity.test.ts` | 9 passed | PASS |
| Full test suite | `npm test` | 112 passed, 1 skipped (pre-existing D-08 skip) | PASS |
| Freshness gate | `npm run freshness` | All 10 committed .js files fresh | PASS |
| Kit structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED | PASS |
| Foundation guards | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED | PASS |
| No §14 literal in gate | `grep -c '§14' agent-factory/workflows/05-pr-quality-gate.md` | 0 | PASS |
| Workflow 14 tool-neutral | `grep -c -iE 'toHaveScreenshot\|axe-core\|playwright' 14-ui-design-to-build.md` | 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UIQA-01 | 16-02-PLAN.md | Playwright toHaveScreenshot + axe-core a11y templated with flake-resistance | SATISFIED | `playwright-visual-regression-recipe.md` exists with full flake-resistance set; `accessibility-checklist.md` extended with AxeBuilder WCAG 2.2 AA bar |
| UIQA-02 | 16-03-PLAN.md | UI/E2E wired into §14 gate, config-dialed via `quality.ui_e2e` | SATISFIED | Gate line 35 wires `quality.ui_e2e (off | ui-or-critical-path | always)`, references both checklists by filename (D-06) |
| TINT-01 | 16-01-PLAN.md, 16-03-PLAN.md | Gate blocks unjustified skipped tests; structured justification required; agent may not self-author | SATISFIED | Checker exits 1 on hollow fixture (confirmed by direct execution + SC3 Vitest keystone). Gate wires step as always-human-only. |
| TINT-02 | 16-01-PLAN.md, 16-03-PLAN.md | Gate fails when unjustified or expired skips > 0; quarantine is non-blocking lane | SATISFIED | Vitest harness: expired case exits 1, over-count exits 1, quarantine exits 0. Gate encodes D-05 logic. |
| TINT-03 | 16-01-PLAN.md, 16-03-PLAN.md | Test-integrity not dialable off (warn | block only); trace-integrity safety carve-out | SATISFIED | `factory.config.md` lines 68, 96, 109 all state **never `off`` (TINT-03). Gate advisory composition emits loudly, never hides. |
| LINT-01 | 16-02-PLAN.md | Lint is first-class gate step; per-stack linter recommendations table | SATISFIED | `linter-recommendations.md` with all four stacks + strict/autofix CLIs. Gate references it by filename. |
| LINT-02 | 16-03-PLAN.md | Lint strictness config-dialed (strict on/off, autofix on/off) | SATISFIED | Gate line 33 wires `quality.lint {strict, autofix}` with explicit behaviors. `factory.config.md` documents the dial. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/runnable-ref/test-skip-integrity.ts` | 151-225 | WR-01 (from code review): `validJustifications` incremented per-row without de-duplication on Test ID — duplicate rows silently inflate the justification count | WARNING | A copy-paste error in the human-owned `.grugops/test-skips.md` registry (two identical Test ID rows) could allow `--skip-count N` to pass where only `N/2` distinct tests are actually justified. The human-owned-registry assumption (D-02) reduces but does not eliminate this. The hollow-justification RED fixture (the SC3 requirement) still fails correctly — this affects the OVER-COUNT lane only. NOT a phase-blocking gap: SC3 is proven, the human-owned registry is the primary defense, and this is a robustness improvement for a future phase. |
| `agent-factory/checklists/00-index.md` | 38-40 | WR-03 (from code review): three new checklists classified as `Enterprise tier` but referenced by the gate which runs in lean mode too | WARNING | Minor documentation inconsistency — the checklists are marked enterprise-only in the index but the lint step (in `mandatory_gates`) runs in lean mode. Does not affect runtime behavior (the gate reads the files regardless of tier classification). |
| `agent-factory/workflows/05-pr-quality-gate.md` | 37, 40-41, 43 | WR-04 (from code review): advisory-mode handling of test-integrity human-only lane is ambiguous — Steps 3/4 say "STOPS" but Step 5 says "downgraded to advice" without reconciling the precedence | WARNING | A reader could interpret advisory mode as allowing a test-integrity exit 1 to proceed. In practice the TINT-03 floor (`test_integrity` has no `off`) and the "still emits loudly" clause limit the risk, but the prose lacks explicit precedence. The SC4 requirement (advisory never hides) is met; the ambiguity is in how a reader reconciles STOPPED vs ADVISED. |

No TBD/FIXME/XXX/PLACEHOLDER debt markers found in phase-modified files.

### Human Verification Required

#### 1. Playwright Version Pin Verification

**Test:** Run `npm show @playwright/test@1.60.0 version` (or check npmjs.com) to confirm version `1.60.0` exists in the `@playwright/test` registry. Also check `@axe-core/playwright@4.11.3`.
**Expected:** Both versions exist and are published. If `1.60.0` does not exist, the pin in `agent-factory/checklists/playwright-visual-regression-recipe.md` line 17 should be updated to the correct latest stable version or softened to a floor (e.g. `>=1.46.0`).
**Why human:** Cannot reach npm registry without a network call; the verifier cannot confirm an exact version number exists on a live registry. This is code-review finding IN-04.

### Gaps Summary

No phase-blocking gaps were found. All four success criteria are verified in the codebase with behavioral evidence (direct execution + Vitest harness). The three warnings from the code review (WR-01 duplicate-ID inflation, WR-03 tier misclassification, WR-04 advisory-mode prose ambiguity) are robustness/polish gaps, not correctness failures of the stated requirements:

- **WR-01** affects the over-count lane's robustness, not SC3 (the hollow-justification RED fixture still exits 1 correctly). The human-owned registry is the primary defense. Candidate for a follow-up plan if stronger mechanical de-duplication is desired.
- **WR-03** is a documentation inconsistency in the index tier classification. The gate behavior is unaffected.
- **WR-04** is a prose ambiguity that could confuse a reader about advisory mode's interaction with the human-only lane. The TINT-03 floor is correctly encoded and the finding is never silent.

The single human verification item (Playwright version pin) is the only open action required before the phase can be fully closed.

---

_Verified: 2026-06-14T14:37:00Z_
_Verifier: Claude (gsd-verifier)_
