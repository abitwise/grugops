---
phase: 16
slug: 14-gate-convergence-lint-ui-e2e-test-integrity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `16-RESEARCH.md` § Validation Architecture (HIGH confidence).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (`globals:false`, repo default — import test fns explicitly) |
| **Config file** | `vitest.config.*` + `package.json` `"test": "vitest run"` (shipped Phase 15) |
| **Quick run command** | `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts` |
| **Full suite command** | `npm test` (`vitest run`) + `npm run freshness` (committed-`.js` drift gate) |
| **Estimated runtime** | ~5–15 seconds (unit + spawn of committed `.js`) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts` (fast — the checker's own harness)
- **After every plan wave:** Run `npm test` (proves the new checker AND that `reference-check.test.ts` is still green — i.e. the proven reference was not disturbed) + `npm run freshness`
- **Before `/gsd-verify-work`:** Full suite green AND freshness green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

> Test IDs are illustrative until plans assign them; Requirement + behavior + command are the binding contract.

| Behavior | Requirement | Test Type | Automated Command | File Exists |
|----------|-------------|-----------|-------------------|-------------|
| Hollow justification (placeholder owner) → checker exits 1 — **the SC3 keystone** | TINT-01 | unit (spawn committed `.js`) | `npx vitest run scripts/runnable-ref/test-skip-integrity.test.ts -t "hollow"` | ❌ W0 |
| Well-formed registry, skips ≤ valid justifications → exit 0 | TINT-01 | unit | same harness, GREEN fixture case | ❌ W0 |
| Expired entry → exit 1 (blocks even if counts balance) | TINT-02 | unit | harness, expired-fixture case | ❌ W0 |
| `flaky-quarantine` valid+unexpired → counts as justified → exit 0 (non-blocking lane) | TINT-02 | unit | harness, quarantine-fixture case | ❌ W0 |
| host-skips > valid justifications → exit 1 | TINT-02 | unit | harness, `--skip-count N` > justified | ❌ W0 |
| `test_integrity` has no `off`; advisory composes (D-10 emits finding loudly) | TINT-03 | doc/behavior — assert no `off` in config enum + read 05 | `npm test` (validator enum) + manual read of `05-pr-quality-gate.md` | partial |
| Checker runs in bare temp dir, no `node_modules` (host-CI emulation) | (cross-cut) | unit | harness host-emulation case (mirror `reference-check.test.ts` Test 5) | ❌ W0 |
| Missing/unreadable registry → exit 2 (error, not a false pass) | (cross-cut) | unit | harness, missing-file case | ❌ W0 |
| Committed `.js` matches a fresh `tsc` rebuild | (cross-cut) | build gate | `npm run freshness` | ✅ (freshness.ts watches `scripts/**`) |
| `strict:true`→`--max-warnings 0`; `autofix:true`→safe fix then recheck | LINT-02 | doc (linter table + 05 wiring) | manual review of `linter-recommendations.md` + `05` | ❌ W0 (doc) |
| Per-stack linter table present + accurate | LINT-01 | doc | manual review | ❌ W0 (doc) |
| Recipe encodes mask/animations/fixed-viewport/CI-Docker baselines + axe `withTags` | UIQA-01 | doc | manual review of recipe checklist + axe extension | ❌ W0 (doc) |
| Gate step dials on `quality.ui_e2e` (off \| ui-or-critical-path \| always) | UIQA-02 | doc (gate-prose in 05) | manual review of `05` | ❌ W0 (doc) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/runnable-ref/test-skip-integrity.ts` — the checker (near-clone of `reference-check.ts`); covers TINT-01/02
- [ ] `scripts/runnable-ref/test-skip-integrity.js` — committed compiled output (freshness gate polices it)
- [ ] `scripts/runnable-ref/test-skip-integrity.test.ts` — RED-fixture Vitest harness (proves SC3); mirrors `reference-check.test.ts` (`runCheck` idiom + host-emulation case)
- [ ] `scripts/runnable-ref/fixtures/clean-test-skips.md` — GREEN fixture (well-formed, skips ≤ justifications)
- [ ] `scripts/runnable-ref/fixtures/hollow-test-skips.md` — RED fixture (placeholder owner = canonical hollow justification; **SC3 keystone**)
- [ ] (optional) `expired-test-skips.md`, `quarantine-test-skips.md` fixtures for D-05 edge cases

*Framework install: none — Vitest + tsc + freshness already shipped (Phase 15). Doc-only requirements (LINT-01/02, UIQA-01/02, TINT-03) are verified by review, not a runner.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Per-stack linter table accuracy | LINT-01 | doc artifact; no runner asserts prose | Read `agent-factory/checklists/linter-recommendations.md`: ESLint 9 flat default for Vue/TS, Biome caveat, Ruff/golangci-lint fallbacks, `UNKNOWN - verify` for unknown stack |
| Gate-prose wiring of lint/ui_e2e/test_integrity + D-08/09/10 mapping | LINT-02, UIQA-02, TINT-03 | single-source prose in `05` | Read `05-pr-quality-gate.md`: steps config-dialed, no `§14` literal, three terminal results preserved, test-integrity human-only short-circuit |
| Playwright/axe recipe completeness | UIQA-01 | doc artifact | Read recipe checklist + `accessibility-checklist.md` axe extension for the flake-resistance set |

---

## Validation Sign-Off

- [ ] Every code task has an `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (the checker + fixtures + harness)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner assigns task IDs)

**Approval:** pending
